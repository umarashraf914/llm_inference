/* ch04_s01 · one journey up, many small journeys down (figs 28, 57)
   One continuous shot, no cut.
   b1-b4, wide: your device on the left (a laptop, its chat window floating above it), the server in its data
   centre on the right, one cable across a strip of ocean between them; the Up lane above the cable, the Down
   lane below. Two wrong guesses play as grey thumbnails and are crossed out; the prompt goes up once as a
   parcel; the line stays open (teal) and the answer comes down one framed token at a time; then the summary.
   b5-b7, pushed in: the chat window centre-left, the server at the right edge on the teal cable, two check
   cards down the left edge. The answer is re-run for each check: steady arrival, then stop halfway; then a
   non-streaming run (same rhythm, delivered in one box), then the two timelines, then the verdict.
   The server and the cable live in S.hud so they hold the right edge while the camera pushes in on the chat. */
V.scene('ch04_s01', S => {
  const { fx } = S;
  const T = s => S.t(s);

  // ---------------------------------------------------------------- layout (wide shot = camera at rest)
  const CW = { x: 100, y: 150, w: 440, h: 340 };      // the chat window, floating above the laptop
  const LAP = { x: 320, y: 700, w: 300 };             // the laptop (lid top 594, deck bottom 806)
  const SRV = { x: 1620, y: 650, w: 300 };            // the server, in its data centre
  const CAB = { x1: 478, x2: SRV.x - SRV.w / 2, y: 650 };   // the cable: device end → server port
  const UPY = 565, DNY = 712;                         // the Up lane and the Down lane

  // the push-in (b5-b7): the chat window lands centre-left, the server at the right edge
  const K = 1.55, PL = 590, PT = 226;
  const CAMX = CW.x - (PL - 960) / K, CAMY = CW.y - (PT - 540) / K;
  const sx = X => 960 + (X - CAMX) * K, sy = Y => 540 + (Y - CAMY) * K;
  const PC = { l: PL, t: PT, r: sx(CW.x + CW.w), b: sy(CW.y + CW.h) };
  PC.cx = (PC.l + PC.r) / 2;
  const PY = Math.round((PC.t + PC.b) / 2);           // the cable in the close-up
  const PSRV = { x: 1676, y: PY, w: 280 };
  const PCAB = { x1: PC.r, x2: PSRV.x - PSRV.w / 2, y: PY };
  const PDN = PY + 50;                                // the Down lane in the close-up
  const RHY = 0.7;                                    // close-up: one token every 0.7 s, in both runs

  // ---------------------------------------------------------------- the ocean
  const waves = S.g();
  waves.setAttribute('data-audit', 'ignore');
  const waveLines = [0, 1, 2].map(r => {
    const y = 852 + r * 22, x0 = 520 + (r % 2) * 24, P = 48;
    let d = `M${x0},${y}`;
    for (let x = x0; x + P <= 1410; x += P) d += ` q${P / 4},-8 ${P / 2},0 t${P / 2},0`;
    return S.path({ d, stroke: 'struct', sw: 2.5, strokeOpacity: 0.5 - r * 0.13 }, waves);
  });

  // ---------------------------------------------------------------- your device: laptop + chat window
  const tether = S.g();
  tether.setAttribute('data-audit', 'ignore');
  const lidT = LAP.y - (LAP.w * 0.708) / 2, lidL = LAP.x - LAP.w * 0.42, lidR = LAP.x + LAP.w * 0.42;
  [[CW.x + 34, lidL + 10], [CW.x + CW.w - 34, lidR - 10]].forEach(([a, b]) =>
    S.line({ x1: a, y1: CW.y + CW.h + 6, x2: b, y2: lidT - 4, stroke: 'struct', sw: 1.5, strokeOpacity: 0.32, dash: '4 7' }, tether));
  const lap = libDevice(S, { x: LAP.x, y: LAP.y, w: LAP.w, label: 'your device' });

  const chatG = S.g();
  const mkChat = () => libChatWindow(S, {
    x: CW.x, y: CW.y, w: CW.w, h: CW.h, title: '', question: CH04.question, qSize: 24, answer: CH04.answer,
    size: 26, composer: true, placeholder: CH04.question,
  }, chatG);
  const chat = mkChat();            // the window, and the first answer (b3-b4)
  const chat2 = mkChat();           // the second run (b5): only its answer layer is used
  const chat3 = mkChat();           // the third run (b6), delivered in one piece
  [chat2, chat3].forEach(c => [c.frame, c.titleBar, c.composer, c.bubbleG].forEach(e => e && e.setAttribute('visibility', 'hidden')));
  S.set([chat2.answerG, chat3.answerG], { autoAlpha: 0 }, 0);
  S.set([chat.sparkle, chat.caret], { autoAlpha: 0 }, 0);
  chat.placeholder.setAttribute('fill', S.tone('ink'));            // the message, typed, waiting to be sent
  // while an answer is being made, the send button is a stop button (a square)
  const sb = chat.sendBtn, bR = +sb.querySelector('circle').getAttribute('r');
  const stopBtn = S.g(null, chat.composer);
  S.circle({ x: sb.cx, y: sb.cy, r: bR, fill: 'struct' }, stopBtn);
  S.rect({ x: sb.cx - bR * 0.36, y: sb.cy - bR * 0.36, w: bR * 0.72, h: bR * 0.72, r: 3, fill: '#0a0f1e' }, stopBtn);
  S.set(stopBtn, { autoAlpha: 0 }, 0);
  const stopOn = at => S.add(gsap.fromTo(stopBtn, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, immediateRender: false }), at);
  const stopOff = at => S.add(gsap.fromTo(stopBtn, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, immediateRender: false }), at);

  // ---------------------------------------------------------------- the server, its data centre, the cable (HUD)
  const dc = S.g(null, S.hud);
  const B = { x: 1432, y: 474, w: 376, h: 330 };
  S.rect({ x: B.x, y: B.y, w: B.w, h: B.h, r: 10, fill: 'url(#hw-hall)', stroke: '#ffffff', strokeOpacity: 0.22, sw: 2 }, dc);
  S.rect({ x: B.x - 10, y: B.y - 12, w: B.w + 20, h: 14, r: 4, fill: '#1a2440', stroke: '#ffffff', strokeOpacity: 0.22, sw: 1.5 }, dc);
  [B.x + 92, B.x + B.w - 92].forEach(ux => {
    S.rect({ x: ux - 40, y: B.y - 46, w: 80, h: 34, r: 4, fill: '#141d33', stroke: '#ffffff', strokeOpacity: 0.18, sw: 1.5 }, dc);
    S.circle({ x: ux, y: B.y - 29, r: 11, stroke: '#ffffff', strokeOpacity: 0.28, sw: 1.5 }, dc);
    S.line({ x1: ux - 8, y1: B.y - 29, x2: ux + 8, y2: B.y - 29, stroke: '#ffffff', strokeOpacity: 0.28, sw: 1.5 }, dc);
  });
  S.line({ x1: B.x + 24, y1: B.y + B.h - 22, x2: B.x + B.w - 24, y2: B.y + B.h - 22, stroke: '#ffffff', strokeOpacity: 0.1, sw: 2 }, dc);
  const other = libServer(S, { x: SRV.x, y: SRV.y + 86, w: SRV.w, seed: 4 }, dc);     // another machine in the rack
  other.setAttribute('opacity', 0.4);
  dc.setAttribute('data-audit', 'ignore');

  const cable = ch04Cable(S, { x1: CAB.x1, y1: CAB.y, x2: CAB.x2, y2: CAB.y }, S.hud);
  const openPill = S.pill('open connection', { x: (CAB.x1 + CAB.x2) / 2, y: CAB.y, h: 44, size: 26, tone: 'helps' }, S.hud);
  S.set(openPill, { autoAlpha: 0 }, 0);

  const srvIn = S.g(null, S.hud);                     // slides in (fx.in)
  const srvHolder = S.g(null, srvIn);                 // moves and scales (fx.xform)
  const srv = libServer(S, { x: SRV.x, y: SRV.y, w: SRV.w, spinner: true }, srvHolder);
  const srvLabel = S.text('the server', { x: SRV.x, y: 838, size: 30, anchor: 'middle', weight: 650 }, dc);
  S.xset(srvHolder, { x: 0, y: 0, s: 1, ox: SRV.x, oy: SRV.y });
  const spinPaths = [...srv.spinnerRot.querySelectorAll('path')];
  const spinTint = (from, to, at) => S.add(gsap.fromTo(spinPaths, { attr: { stroke: S.tone(from) } }, { attr: { stroke: S.tone(to) }, duration: 0.3, immediateRender: false }), at);

  // ---------------------------------------------------------------- b1: two places, an ocean apart
  S.add(fx.in([lap, chatG], { from: 'up', d: 0.8, stagger: 0.1 }), 0.05);
  S.add(fx.in(tether, { from: 'fade', d: 0.6 }), 0.5);
  S.add(fx.in([dc, srvIn], { from: 'right', d: 0.8, stagger: 0.08 }), 0.2);
  // press send: the button pulses, the message leaves the box and becomes the question bubble
  S.add(chat.send({ d: 0.45 }), 'b1~send-0.12');
  S.add(fx.out(chat.placeholder, { d: 0.2 }), 'b1~send+0.12');
  S.set(chat.avatar, { autoAlpha: 0 }, 0);
  S.add(fx.in(chat.avatar, { from: 'fade', d: 0.3 }), 'b1~send+0.15');
  S.add(chat.typeQuestion({ d: 0.45 }), 'b1~send+0.15');
  // an ocean away: the sea and the cable draw on, left to right
  S.add(fx.draw(waveLines, { d: 1.1, stagger: 0.12, ease: 'power1.inOut' }), 'b1~ocean-0.25');
  S.add(cable.drawOn({ d: 1.0 }), 'b1~ocean-0.15');
  // the model runs once per token: the circular arrow ticks round once
  const runTag = S.text('one run per token', { x: SRV.x, y: SRV.y - 84, size: 26, anchor: 'middle', color: 'muted', weight: 550 }, S.hud);
  S.add(srv.tick({ d: 0.7 }), 'b1~once-0.1');
  S.add(fx.in(runTag, { from: 'up', d: 0.45 }), 'b1~per-0.1');
  S.add(fx.out(runTag, { d: 0.3 }), 'b1~resent-0.35');

  // the two wrong guesses, as grey thumbnails at the top
  const TH = { y: 166, w: 396, h: 232 };
  const thumb = (x, title) => {
    const g = S.g();
    S.rect({ x, y: TH.y, w: TH.w, h: TH.h, r: 18, fill: '#0c1326' }, g);
    S.rect({ x, y: TH.y, w: TH.w, h: TH.h, r: 18, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.16, sw: 1.5 }, g);
    g.title = S.text(title, { x: x + TH.w / 2, y: TH.y + 38, size: 26, anchor: 'middle', color: 'muted', weight: 600 }, g);
    const my = TH.y + 146;
    S.icon('ph:laptop-duotone', { x: x + 62, y: my, size: 66, color: 'muted' }, g);
    const bx = x + TH.w - 108, bw = 78, bh = 72;          // the tiny server
    S.rect({ x: bx, y: my - bh / 2, w: bw, h: bh, r: 8, fill: '#0c1326', stroke: 'muted', strokeOpacity: 0.55, sw: 2 }, g);
    S.line({ x1: bx + 8, y1: my - bh / 2 + 14, x2: bx + bw - 20, y2: my - bh / 2 + 14, stroke: 'muted', strokeOpacity: 0.5, sw: 3 }, g);
    S.circle({ x: bx + bw - 11, y: my - bh / 2 + 14, r: 3, fill: 'muted', fillOpacity: 0.7 }, g);
    S.line({ x1: x + 104, y1: my, x2: bx - 10, y2: my, stroke: 'faint', sw: 2, dash: '5 7' }, g);
    Object.assign(g, { x, my, a: x + 104, b: bx - 10, bx, bw, bh });
    return g;
  };
  const g1 = thumb(578, 'guess 1: resend per token');
  const g2 = thumb(1000, 'guess 2: finish, then send');
  // guess 1: the text goes up, one pill comes back, a longer text goes up ... three quick cycles
  const shuttle = (g, w, h, y, x0, x1, at, d, tone) => {
    const r = S.rect({ x: -w / 2, y: y - h / 2, w, h, r: Math.min(6, h / 2), fill: tone, fillOpacity: 0.85 }, g);
    S.set(r, { autoAlpha: 0, x: x0 }, 0);
    const tl = gsap.timeline();
    tl.fromTo(r, { x: x0 }, { x: x1, duration: d, ease: 'none', immediateRender: false }, 0);
    tl.fromTo(r, { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.15, ease: 'none', immediateRender: false }, 0);
    tl.fromTo(r, { autoAlpha: 1 }, { autoAlpha: 0, duration: d * 0.15, ease: 'none', immediateRender: false }, d * 0.85);
    S.add(tl, at);
    return r;
  };
  S.add(fx.in(g1, { from: 'down', d: 0.5 }), 'b1~resent-0.3');
  const c0 = T('b1~resent') + 0.05;
  [0, 1, 2].forEach(c => {
    const t = c0 + c * 0.72;
    shuttle(g1, 30 + 16 * c, 16, g1.my - 24, g1.a + 18, g1.b - 18, t, 0.34, 'muted');      // the whole text, up
    shuttle(g1, 18, 14, g1.my + 24, g1.b - 12, g1.a + 12, t + 0.36, 0.3, 'muted');         // one token, back
  });
  // guess 2: a page fills inside the tiny server, then the whole answer slides down in one block
  S.add(fx.in(g2, { from: 'down', d: 0.5 }), 'b1~shipped-0.25');
  const pg = { x: g2.bx + g2.bw / 2 - 15, y: g2.my - 14, w: 30, h: 40 };
  S.rect({ x: pg.x, y: pg.y, w: pg.w, h: pg.h, r: 3, fill: '#0c1326', stroke: 'muted', sw: 1.5 }, g2);
  const pgLines = [0, 1, 2, 3, 4].map(i => S.line({ x1: pg.x + 6, y1: pg.y + 8 + i * 6.5, x2: pg.x + pg.w - 6 - (i === 4 ? 8 : 0), y2: pg.y + 8 + i * 6.5, stroke: 'muted', sw: 2.2 }, g2));
  S.add(fx.draw(pgLines, { d: 0.14, stagger: 0.13, ease: 'none' }), 'b1~shipped+0.05');
  shuttle(g2, 46, 18, g2.my + 24, g2.b - 18, g2.a + 18, T('b1~finished') + 0.05, 0.5, 'muted');
  // neither: both take a grey cross and fade
  const x1c = ch04Cross(S, { x: g1.x + 60, y: TH.y + 62, w: TH.w - 120, h: TH.h - 70, tone: 'muted', sw: 7 }, g1);
  const x2c = ch04Cross(S, { x: g2.x + 60, y: TH.y + 62, w: TH.w - 120, h: TH.h - 70, tone: 'muted', sw: 7 }, g2);
  S.add(x1c.draw({ d: 0.4 }), 'b1~Neither-0.1');
  S.add(x2c.draw({ d: 0.4 }), 'b1~Neither+0.12');
  S.add(fx.out([g1, g2], { d: 0.4, stagger: 0.08 }), 'b1~Neither+0.75');

  // ---------------------------------------------------------------- b2: one request goes up, once
  const upHead = S.text([{ t: 'Up: ', c: 'struct', w: 700 }, { t: 'once, at the start', c: 'muted' }], { x: 960, y: 455, size: 30, anchor: 'middle', weight: 600 });
  S.add(fx.in(upHead, { from: 'up', d: 0.6 }), 'b2-0.1');
  // the parcel: clipped to the stretch of cable, so it slides out of the laptop and into the server
  const clipUp = S.el('clipPath', { id: 'ch04s01-up' });
  S.rect({ x: CAB.x1 + 2, y: 380, w: CAB.x2 - CAB.x1 - 2, h: 360 }, clipUp);
  const upClip = S.g({ 'clip-path': 'url(#ch04s01-up)' });
  const pHold = S.g(null, upClip);
  const parcel = ch04Parcel(S, { x: 0, y: 0, h: 52, segments: [{ w: 286 }, { w: 44, state: 'new' }], counter: true, size: 26 }, pHold);
  const pLabel = S.text('the whole prompt', { x: parcel.cx, y: -54, size: 28, anchor: 'middle', color: 'ink', weight: 600 }, pHold);
  const pKB = S.text('≈ 4 KB', { x: 145, y: 50, size: 26, anchor: 'middle', color: 'struct', weight: 650 }, pHold);
  S.set([pLabel, pKB], { autoAlpha: 0 }, 0);
  S.xset(pHold, { x: CAB.x1 - parcel.w - 10, y: UPY, s: 1, ox: parcel.r, oy: 0 });
  const tGo = T('b2~carrying') - 0.05;
  S.add(fx.xform(pHold, { x: 990 }, { d: T('b2>') + 0.3 - tGo, ease: 'power3.out' }), tGo);
  S.add(fx.in(pLabel, { from: 'fade', d: 0.5 }), 'b2~carrying+0.6');
  S.add(parcel.compose({ d: 0.5 }), 'b2~follow-0.1');
  S.add(parcel.count(CH04.prompt.tokens, { d: 1.3 }), 'b2~is-0.05');
  S.add(fx.in(pKB, { from: 'up', d: 0.4, dist: 14 }), 'b2~tokens-0.35');
  const legend = S.text('1 byte ≈ 1 letter · ≈ 4 per token', { x: 960, y: DNY, size: 26, anchor: 'middle', color: 'muted', weight: 500 });
  S.add(fx.in(legend, { from: 'up', d: 0.45, dist: 14 }), 'b2~tokens-0.1');
  // absorbed into the server: it drops to the cable's height and slides in, shrinking
  const tAbs = T('b3') + 0.05;
  S.add(fx.out([pLabel, pKB, legend], { d: 0.35 }), tAbs - 0.05);
  S.add(fx.xform(pHold, { x: SRV.x - parcel.r, y: SRV.y, s: 0.3 }, { d: 0.6, ease: 'power2.in' }), tAbs);
  S.add(fx.out(parcel, { d: 0.15 }), tAbs + 0.5);
  S.add(srv.glow({ tone: 'struct', d: 0.25 }), tAbs + 0.45);
  S.add(srv.unglow({ d: 0.5 }), tAbs + 0.75);
  S.add(fx.out([lap.labelEl, srvLabel], { d: 0.4 }), tAbs);

  // ---------------------------------------------------------------- b3: the line stays open; tokens come down
  S.add(cable.open({ d: 0.7 }), 'b3~stays-0.15');
  S.add(fx.in(openPill, { from: 'fade', d: 0.45 }), 'b3~open-0.05');
  const dnHead = S.text([{ t: 'Down: ', c: 'struct', w: 700 }, { t: 'as each token is made', c: 'muted' }], { x: 960, y: 774, size: 30, anchor: 'middle', weight: 600 });
  S.add(fx.in(dnHead, { from: 'down', d: 0.6 }), 'b3~answer-0.1');
  const laneTag = S.text('one small frame per token', { x: 960, y: 816, size: 26, anchor: 'middle', color: 'muted', weight: 500 });
  S.add(fx.in(laneTag, { from: 'down', d: 0.5, dist: 16 }), 'b3~small-0.1');

  const TRAVEL = 1.6, EVERY = 0.8;
  const m0 = T('b3~one token') - 0.1;
  const tFreeze = T('b4~One journey') - 0.06;
  const madeA = CH04.answer.map((_, k) => m0 + k * EVERY);
  const frA = ch04Frames(S, {
    d: `M${CAB.x2 + 70},${DNY} L${CAB.x1 + 30},${DNY}`, texts: CH04.answer, made: madeA, travel: TRAVEL, freeze: tFreeze, fadeOut: 0.2,
    clip: { x: CAB.x1 + 2, y: DNY - 50, w: CAB.x2 - CAB.x1 - 4, h: 100 },
  });
  const nA = frA.arrive.filter(t => t <= tFreeze).length;            // words on screen when the stream freezes
  S.add(fx.in([chat.sparkle, chat.caret], { from: 'fade', d: 0.3 }), m0);
  stopOn(m0);
  S.add(chat.stream({ from: 0, count: nA, times: frA.arrive.slice(0, nA).map(t => t - frA.arrive[0]) }), frA.arrive[0]);
  S.add(srv.spin({ d: tFreeze - (m0 - EVERY), turns: (tFreeze - (m0 - EVERY)) / EVERY }), m0 - EVERY);
  frA.arrive.slice(0, nA).forEach(t => S.add(lap.ping({ d: 0.45 }), t));      // the screen brightens as each word lands

  // ---------------------------------------------------------------- b4: nothing more goes up; the summary
  // a block arrow from its tail (xs) to its tip (xt): shaft half-height hs, head half-height ht, head length hl
  const arrowD = (xs, xt, y, hs, ht, hl) => {
    const xb = xt - Math.sign(xt - xs) * hl;
    return `M${xs},${y - hs} H${xb} V${y - ht} L${xt},${y} L${xb},${y + ht} V${y + hs} H${xs} Z`;
  };
  const upArrowD = arrowD(600, 1352, UPY, 12, 30, 44);
  const hollow = S.path({ d: upArrowD, stroke: 'struct', sw: 2.5, strokeOpacity: 0.6, dash: '10 8' });
  const solid = S.path({ d: upArrowD, fill: 'url(#solid-struct)', stroke: 'struct', sw: 2 });
  S.set(solid, { autoAlpha: 0 }, 0);
  S.add(fx.dim(upHead, { to: 0.35 }), 'b4~Nothing');
  S.add(fx.draw(hollow, { d: 0.9 }), 'b4~Nothing+0.1');
  const ear = S.icon('ph:ear-duotone', { x: 528, y: UPY - 4, size: 58, color: 'struct' });
  S.add(fx.pop(ear), 'b4~listens-0.25');
  // freeze into the summary
  S.add(fx.out(frA, { d: 0.35 }), tFreeze + 0.05);
  S.add(fx.out([dnHead, laneTag, upHead], { d: 0.35 }), tFreeze + 0.05);
  S.add(gsap.fromTo(solid, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }), tFreeze + 0.1);
  S.add(fx.out(hollow, { d: 0.3 }), tFreeze + 0.4);
  const upLab = S.text('1 up', { x: 960, y: UPY - 66, size: 40, anchor: 'middle', weight: 700, family: 'display', color: 'struct' });
  S.add(fx.in(upLab, { from: 'up', d: 0.5 }), tFreeze + 0.25);
  const smalls = [];
  for (let i = 0; i < 9; i++) {
    const xr = 1352 - i * 86;
    smalls.push(S.path({ d: arrowD(xr, xr - 62, DNY, 7, 16, 22), fill: 'url(#solid-struct)', fillOpacity: 0.9 }));
  }
  S.set(smalls, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(smalls, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.35, ease: 'power2.out', stagger: 0.09 }), 'b4~many-0.35');
  const dnLab = S.text('many down', { x: 960, y: DNY + 64, size: 40, anchor: 'middle', weight: 700, family: 'display', color: 'struct' });
  S.add(fx.in(dnLab, { from: 'down', d: 0.5 }), 'b4~down-0.15');
  S.add(fx.swap(openPill.label, 'one connection', { d: 0.45 }), 'b4~one open-0.1');
  S.add(gsap.fromTo(openPill.bg, { attr: { 'stroke-opacity': 0.7 } }, { attr: { 'stroke-opacity': 1 }, duration: 0.3, yoyo: true, repeat: 1 }), 'b4~connection-0.2');
  const title = S.text('streaming, on the wire', { x: 960, y: 290, size: 60, anchor: 'middle', weight: 700, family: 'display' });
  S.add(fx.in(title, { from: 'up', d: 0.7 }), 'b4~That-0.1');

  // ---------------------------------------------------------------- b5: push in on the chat window; check 1
  const tPush = T('b5'), PD = 1.4;
  S.add(fx.out([title, upLab, dnLab, solid, ...smalls, ear, openPill], { d: 0.35, stagger: 0 }), tPush - 0.25);
  S.add(fx.cam({ x: CAMX, y: CAMY, scale: K, d: PD, ease: 'power2.inOut' }), tPush);
  S.add(fx.out([lap, tether, waves], { d: 0.6, stagger: 0 }), tPush + 0.1);
  S.add(fx.out(dc, { d: 0.6 }), tPush + 0.1);
  S.add(fx.xform(srvHolder, { x: PSRV.x - SRV.x, y: PSRV.y - SRV.y, s: PSRV.w / SRV.w }, { d: PD, ease: 'power2.inOut' }), tPush);
  S.add(cable.route({ x1: PCAB.x1, y1: PY, x2: PCAB.x2, y2: PY }, { d: PD, ease: 'power2.inOut' }), tPush);
  S.add(fx.out(chat.answerG, { d: 0.4 }), tPush + 0.1);
  S.add(fx.in(chat2.answerG, { from: 'fade', d: 0.3 }), tPush + PD - 0.2);

  // the corridor between the window and the server: frames and the box show only here
  const clipC = S.el('clipPath', { id: 'ch04s01-cor' }, S.hud);
  S.rect({ x: PC.r + 1, y: PY - 80, w: PCAB.x2 - PC.r - 2, h: 180 }, clipC);
  const corridorPath = `M${PCAB.x2 + 70},${PDN} L${PC.r + 24},${PDN}`;
  const tClick = T('b5~stop') - 0.05;
  const M0 = tClick + 0.1 - 5 * RHY;                  // token 5 would have been made just after the click
  const madeB = [0, 1, 2, 3, 4].map(k => M0 + k * RHY);
  const frB = ch04Frames(S, { d: corridorPath, texts: CH04.answer.slice(0, 5), made: madeB, travel: 0.65, size: 26, fadeOut: 0.14, clip: { x: PC.r + 1, y: PY - 80, w: PCAB.x2 - PC.r - 2, h: 180 } }, S.hud);
  S.add(chat2.stream({ from: 0, count: 5, times: frB.arrive.map(t => t - frB.arrive[0]) }), frB.arrive[0]);
  S.add(srv.spin({ d: tClick - (M0 - RHY), turns: (tClick - (M0 - RHY)) / RHY }), M0 - RHY);
  // tick marks grow along the window's bottom edge, one per word: an even beat
  const tk = { x0: PC.l + 36, step: 84, y: PC.b + 26 };
  const tickBase = S.line({ x1: tk.x0, y1: tk.y, x2: tk.x0, y2: tk.y, stroke: 'faint', sw: 2 }, S.hud);
  S.set(tickBase, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(tickBase, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }), frB.arrive[0] - 0.05);
  S.add(gsap.fromTo(tickBase, { attr: { x2: tk.x0 } }, { attr: { x2: tk.x0 + 4 * tk.step }, duration: frB.arrive[4] - frB.arrive[0], ease: 'none', immediateRender: false }), frB.arrive[0]);
  const ticks = frB.arrive.map((t, k) => {
    const l = S.line({ x1: tk.x0 + k * tk.step, y1: tk.y - 14, x2: tk.x0 + k * tk.step, y2: tk.y + 14, stroke: 'struct', sw: 4 }, S.hud);
    S.set(l, { autoAlpha: 0 }, 0);
    S.add(gsap.fromTo(l, { autoAlpha: 0, scaleY: 0, transformOrigin: '50% 100%' }, { autoAlpha: 1, scaleY: 1, duration: 0.25, ease: 'back.out(2)' }), t);
    return l;
  });

  // the check cards, stacked down the left edge
  const CARD = { x: 96, w: 452, h: 150 };
  const card1 = S.card({ x: CARD.x, y: PY - 52 - CARD.h, w: CARD.w, h: CARD.h, tone: 'struct', title: 'Text appears steadily', sub: 'not all at once', size: 30, subSize: 26, layout: 'left' }, S.hud);
  const card2 = S.card({ x: CARD.x, y: PY + 52, w: CARD.w, h: CARD.h, tone: 'struct', title: 'Stopping mid-answer works', sub: 'the server stops', size: 30, subSize: 26, layout: 'left' }, S.hud);
  S.set([card1, card2], { autoAlpha: 0 }, 0);
  S.add(fx.in(card1, { from: 'left', d: 0.7 }), 'b5~steadily-0.15');

  // pressing stop: a cursor clicks the square; the words stop, the cable breaks, the arrow halts
  const btn = { x: sx(sb.cx), y: sy(sb.cy) };
  const cur = S.g(null, S.hud);
  const curIcon = S.icon('ph:cursor-fill', { x: 0, y: 0, size: 54, color: 'ink' }, cur);
  curIcon.setAttribute('transform', 'translate(13,17)');               // the arrow's tip at the group origin
  S.set(cur, { autoAlpha: 0, x: btn.x + 170, y: btn.y + 150 }, 0);
  S.add(gsap.fromTo(cur, { autoAlpha: 0, x: btn.x + 170, y: btn.y + 150 }, { autoAlpha: 1, x: btn.x + 4, y: btn.y + 4, duration: 0.8, ease: 'power2.out' }), tClick - 0.85);
  S.add(gsap.fromTo(curIcon, { scale: 1, transformOrigin: '20% 15%' }, { scale: 0.82, duration: 0.09, yoyo: true, repeat: 1, ease: 'power1.inOut', transformOrigin: '20% 15%', immediateRender: false }), tClick - 0.06);
  S.add(gsap.fromTo(stopBtn, { scale: 1, transformOrigin: '50% 50%' }, { scale: 0.86, duration: 0.09, yoyo: true, repeat: 1, ease: 'power1.inOut', transformOrigin: '50% 50%', immediateRender: false }), tClick - 0.06);
  stopOff(tClick + 0.15);
  S.add(cable.cut({ gap: 40, d: 0.35 }), tClick + 0.1);
  spinTint('struct', 'faint', tClick);
  S.add(gsap.fromTo(cur, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4, immediateRender: false }), tClick + 0.9);
  // the rest is never computed
  S.add(chat2.ghosts(5, 9, { d: 0.4, stagger: 0.06 }), 'b5~never-0.15');
  const gsp = chat2.span(5, 9);
  const never = S.text('never computed: work saved', { x: sx(gsp.x1) + 4, y: sy(gsp.b) + 30, size: 26, color: 'helps', weight: 650 }, S.hud);
  S.set(never, { autoAlpha: 0 }, 0);
  S.add(fx.in(never, { from: 'up', d: 0.45, dist: 14 }), 'b5~computed-0.1');
  S.add(fx.in(card2, { from: 'left', d: 0.7 }), 'b5>-0.5');

  // ---------------------------------------------------------------- b6: the same generation, delivered at once
  const t6 = T('b6');
  S.add(cable.mend({ d: 0.5 }), t6);
  S.add(fx.dim([card1, card2], { to: 0.28 }), t6);
  S.add(fx.out([never, tickBase, ...ticks], { d: 0.35, stagger: 0 }), t6);
  S.add(fx.out(chat2.answerG, { d: 0.4 }), t6 + 0.05);
  // the toggle above the window
  const TGL = ['streaming', 'non-streaming'], TS = 26, TP = 26;
  const tw = TGL.map(t => S.measure(t, { size: TS, weight: 600 }) + 2 * TP);
  const tg = { y: PC.t - 58, h: 52, w: tw[0] + tw[1] + 8 };
  tg.x = PC.cx - tg.w / 2;
  const toggle = S.g(null, S.hud);
  S.rect({ x: tg.x, y: tg.y - tg.h / 2, w: tg.w, h: tg.h, r: tg.h / 2, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.18, sw: 1.5 }, toggle);
  const kx = [tg.x + 4, tg.x + 4 + tw[0]];
  const knob = S.rect({ x: kx[0], y: tg.y - tg.h / 2 + 4, w: tw[0], h: tg.h - 8, r: (tg.h - 8) / 2, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.9, sw: 2 }, toggle);
  const tgl = TGL.map((t, i) => S.text(t, { x: kx[i] + tw[i] / 2, y: tg.y + 1, size: TS, anchor: 'middle', weight: 600, color: i === 0 ? 'ink' : 'faint' }, toggle));
  S.set(toggle, { autoAlpha: 0 }, 0);
  const flip = (to, at) => {
    const fr = 1 - to, tl = gsap.timeline();
    tl.fromTo(knob, { attr: { x: kx[fr], width: tw[fr] } }, { attr: { x: kx[to], width: tw[to] }, duration: 0.4, ease: 'power3.inOut', immediateRender: false }, 0);
    tl.fromTo(tgl[to], { attr: { fill: S.tone('faint') } }, { attr: { fill: S.tone('ink') }, duration: 0.3, immediateRender: false }, 0.1);
    tl.fromTo(tgl[fr], { attr: { fill: S.tone('ink') } }, { attr: { fill: S.tone('faint') }, duration: 0.3, immediateRender: false }, 0.1);
    S.add(tl, at);
  };
  S.add(fx.in(toggle, { from: 'down', d: 0.5 }), t6 - 0.15);
  const tFlip = T('b6~non') + 0.05;
  flip(1, tFlip);
  // the server runs at the same rhythm; each token drops into a box beside it instead of onto the wire
  const G0 = tFlip + 0.1;
  spinTint('faint', 'struct', G0 - 0.1);
  S.add(srv.spin({ d: 10 * RHY, turns: 10 }), G0);
  stopOn(G0);
  const corridor = S.g({ 'clip-path': 'url(#ch04s01-cor)' }, S.hud);
  const BX = { w: 150, h: 66 };
  BX.x = PCAB.x2 - 16 - BX.w; BX.y = PDN - BX.h / 2;
  const boxHold = S.g(null, corridor);
  const box = S.g(null, boxHold);
  S.rect({ x: BX.x, y: BX.y, w: BX.w, h: BX.h, r: 10, fill: '#0c1326', stroke: 'struct', strokeOpacity: 0.75, sw: 2 }, box);
  const minis = [];
  for (let k = 0; k < 10; k++) {
    const r = Math.floor(k / 5), c = k % 5;
    const m = S.rect({ x: BX.x + 10 + c * 27, y: BX.y + 10 + r * 25, w: 22, h: 19, r: 5, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.9, sw: 1.5 }, box);
    minis.push(m);
  }
  box.setAttribute('data-audit', 'ignore');
  S.set(minis, { autoAlpha: 0 }, 0);
  S.xset(boxHold, { x: 0, y: 0 });
  S.set(box, { autoAlpha: 0 }, 0);
  S.add(fx.in(box, { from: 'fade', d: 0.35 }), G0 - 0.1);
  minis.forEach((m, k) => S.add(fx.pop(m, { d: 0.35 }), G0 + (k + 1) * RHY - 0.05));
  const tShip = G0 + 10 * RHY + 0.1, SHIP = 0.6;
  S.add(fx.xform(boxHold, { x: PC.r - BX.x - BX.w - 4 }, { d: SHIP, ease: 'power2.in' }), tShip);
  S.add(fx.out(box, { d: 0.15 }), tShip + SHIP - 0.1);
  stopOff(tShip + SHIP);
  S.add(gsap.fromTo(chat3.answerG, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, immediateRender: false }), G0);
  S.add(chat3.blink({ n: Math.floor((tShip + SHIP - G0 - 0.3) / 0.8), period: 0.8 }), G0 + 0.3);   // waiting: nothing shows
  S.add(chat3.stream({ from: 0, count: 10, every: 0 }), tShip + SHIP);
  const same = S.text('same generation, different delivery', { x: (PC.r + 1820) / 2, y: PDN + 92, size: 26, anchor: 'middle', color: 'muted', weight: 600 }, S.hud);
  S.set(same, { autoAlpha: 0 }, 0);
  S.add(fx.in(same, { from: 'up', d: 0.5, dist: 14 }), 'b6~same-0.1');
  S.add(fx.out(same, { d: 0.35 }), 'b6~Chat');
  flip(0, Math.max(T('b6~Chat') + 0.3, tShip + SHIP + 0.1));

  // two short timelines under the window: when does the first word show?
  const TLX = { x0: PC.l, x1: PC.r };
  const rows = [
    { label: [{ t: 'streaming: ', c: 'ink', w: 650 }, { t: 'first word < 1 s', c: 'muted' }], y: PC.b + 64 },
    { label: [{ t: 'non-streaming: ', c: 'ink', w: 650 }, { t: 'first word at the end', c: 'muted' }], y: PC.b + 152 },
  ];
  const rowG = rows.map(r => {
    const g = S.g(null, S.hud);
    S.text(r.label, { x: TLX.x0, y: r.y, size: 26, weight: 500 }, g);
    g.line = S.line({ x1: TLX.x0, y1: r.y + 40, x2: TLX.x1, y2: r.y + 40, stroke: 'faint', sw: 2.5 }, g);
    g.line.setAttribute('data-audit', 'ignore');           // the first word lands ON this line, on an opaque chip
    S.line({ x1: TLX.x0, y1: r.y + 30, x2: TLX.x0, y2: r.y + 50, stroke: 'muted', sw: 2.5 }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  });
  S.add(fx.in(rowG, { from: 'up', d: 0.5, stagger: 0.15 }), 'b6~first-0.15');
  const w1 = libToken(S, { text: 'Sunny', x: TLX.x0 + 84, y: rows[0].y + 40, size: 24, state: 'token' }, S.hud);
  S.set(w1, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(w1, { autoAlpha: 0, y: -30 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'back.out(1.8)' }), 'b6~under-0.1');
  const blk = S.g(null, S.hud);
  const bkW = 112, bkH = 34;
  S.rect({ x: TLX.x1 - bkW - 4, y: rows[1].y + 40 - bkH / 2, w: bkW, h: bkH, r: 8, fill: '#0c1326' }, blk);
  S.rect({ x: TLX.x1 - bkW - 4, y: rows[1].y + 40 - bkH / 2, w: bkW, h: bkH, r: 8, fill: 'url(#card-struct)', stroke: 'struct', sw: 2 }, blk);
  blk.setAttribute('data-audit', 'ignore');
  S.set(blk, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(blk, { autoAlpha: 0, y: -30 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'back.out(1.8)' }), 'b6~second-0.25');

  // ---------------------------------------------------------------- b7: both checks point the same way
  const t7 = T('b7');
  S.add(fx.out([toggle, ...rowG, w1, blk], { d: 0.4, stagger: 0 }), t7);
  S.add(fx.undim([card1, card2], { d: 0.5 }), t7);
  [card1, card2].forEach((c, i) => {
    const at = T('b7~Neither') + 0.25 + i * 0.6;
    const badge = S.g(null, S.hud);
    S.circle({ x: c.r - 8, y: c.t + 8, r: 25, fill: '#0c1326' }, badge);
    S.icon('ph:check-circle-fill', { x: c.r - 8, y: c.t + 8, size: 52, color: 'helps' }, badge);
    S.set(badge, { autoAlpha: 0 }, 0);
    S.add(fx.pulse(c, { scale: 1.03, d: 0.5 }), at);
    S.add(fx.pop(badge, { d: 0.5 }), at + 0.1);
    S.add(gsap.fromTo(c.bg, { attr: { stroke: S.tone('struct') } }, { attr: { stroke: S.tone('helps') }, duration: 0.4, immediateRender: false }), at + 0.1);
  });
  const verdict = S.text('tokens leave as they are made', { x: CARD.x + CARD.w / 2, y: PY, size: 30, anchor: 'middle', weight: 650, color: 'helps' }, S.hud);
  S.set(verdict, { autoAlpha: 0 }, 0);
  S.add(fx.in(verdict, { from: 'fade', d: 0.6 }), 'b7~Tokens-0.15');
});
