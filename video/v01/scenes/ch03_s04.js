/* ch03_s04 · everyone at once (fig 19)
   Production traffic: conversations arrive at unpredictable moments and all need the same machines.
   Run together (batched), each costs less. But one slow request holds back everyone's next token, and
   averages hide rare delays, so the film's measurements judge the worst case. Production is shared,
   concurrent and paid for. The scene ends on the crowd field alone, frozen and dimmed (opacity 0.35):
   ch03_s05 opens on the same field, built with the same CROWD options. */
V.scene('ch03_s04', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const CROWD = { x: 120, y: 210, w: 1680, h: 430, n: 48, size: 26, seed: 3 };

  // ---------------------------------------------------------------- the heading, the one set of machines, the arrows
  const head = S.text('Production traffic: everyone at once', { x: 960, y: 150, size: 40, anchor: 'middle', weight: 700, family: 'display', color: 'ink' });
  S.add(fx.in(head, { from: 'up', d: 0.6 }), 0.15);

  const BOX = { x: 730, y: 760, w: 460, h: 90 };
  const box = S.g();
  S.rect({ x: BOX.x, y: BOX.y, w: BOX.w, h: BOX.h, r: 18, fill: '#0c1326' }, box);
  const boxBg = S.rect({ x: BOX.x, y: BOX.y, w: BOX.w, h: BOX.h, r: 18, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.3, sw: 2 }, box);
  const servers = [820, 960, 1100].map((x, k) => libServer(S, { x, y: BOX.y + BOX.h / 2, w: 130, detail: 'lite', seed: 31 + k }, box));
  const boxLbl = S.text('one set of machines', { x: 960, y: BOX.y + BOX.h + 36, size: 28, anchor: 'middle', weight: 600, color: 'ink' }, box);
  S.set(box, { autoAlpha: 0 }, 0);
  S.add(fx.in(box, { from: 'up', d: 0.6 }), 0.5);
  servers.forEach((s, k) => S.add(s.activity({ d: 13, rate: 2.5 + k * 0.4, seed: 5 + k }), T('b1~thousands') + 0.6));

  const ATOP = [300, 630, 960, 1290, 1620], ABOT = [840, 900, 960, 1020, 1080], AY0 = 662, AY1 = BOX.y - 8;
  const arrows = ATOP.map((x, i) => ignore(S.arrow({ x1: x, y1: AY0, x2: ABOT[i], y2: AY1, color: 'faint', sw: 2.5, head: 10 })));
  S.set(arrows, { autoAlpha: 0 }, 0);
  S.add(gsap.set(arrows, { autoAlpha: 1 }), T('b1~thousands') - 0.2);
  arrows.forEach((a, i) => S.add(fx.drawArrow(a, { d: 0.5 }), T('b1~thousands') - 0.2 + i * 0.06));

  // ---------------------------------------------------------------- the crowd: each square is one conversation
  const trayLayer = S.g();                          // trays sit under the squares that fill them
  const crowd = ch03Crowd(S, CROWD);
  const sq = crowd.squares, N = sq.length;
  S.set(crowd.all, { autoAlpha: 0 }, 0);
  const home = sq.map(c => [c.cx, c.cy]);
  const r = S.rand(41);
  const nearestArrow = x => ATOP.reduce((b, ax, i) => (Math.abs(ax - x) < Math.abs(ATOP[b] - x) ? i : b), 0);
  const route = k => {
    const i = nearestArrow(home[k][0]);
    const [x, y] = home[k];
    return { d: `M${x},${y} L${ATOP[i]},${AY0} L${ABOT[i]},${AY1 + 14}`, len: Math.hypot(ATOP[i] - x, AY0 - y) + Math.hypot(ABOT[i] - ATOP[i], AY1 + 14 - AY0) };
  };
  const free = new Array(N).fill(Infinity);          // from when a square sits at home, visible and uncommitted
  const sink = (k, t) => {
    S.add(gsap.to(sq[k].body, { scale: 0.45, duration: 0.3, ease: 'power2.in', transformOrigin: '50% 50%' }), t - 0.15);
    S.add(sq[k].out({ d: 0.25 }), t - 0.1);
  };
  const respawn = (k, t) => {
    S.add(sq[k].moveTo(home[k], { d: 0.01 }), t - 0.3);
    S.add(sq[k].pop({ d: 0.45 }), t);
    free[k] = t + 0.4;
  };
  const B2 = T('b2') - 0.4;

  // b1: one user waiting politely, alone
  const lone = home.reduce((b, p, k) => (Math.hypot(p[0] - 960, p[1] - 330) < Math.hypot(home[b][0] - 960, home[b][1] - 330) ? k : b), 0);
  S.add(sq[lone].pop({ d: 0.5 }), 'b1~one user');
  const ring = ignore(S.circle({ x: home[lone][0], y: home[lone][1], r: 22, stroke: 'struct', sw: 2 }));
  S.set(ring, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(ring, { autoAlpha: 0.9, attr: { r: 18 } }, { autoAlpha: 0, attr: { r: 44 }, duration: 0.9, ease: 'power2.out', repeat: 1 }), 'b1~waiting');
  {
    const rt = route(lone), l = T('b1~thousands') + 0.5, d = rt.len / 480;
    S.add(sq[lone].travel(rt.d, { d, ease: 'power1.inOut' }), l);
    sink(lone, l + d);
    respawn(lone, l + d + 1.4);
  }
  // b1: thousands, at unpredictable moments; each drifts down into the machines at its own time
  const order = sq.map((_, k) => k).filter(k => k !== lone).sort((a, b) => (home[a][0] * 7.3 + home[a][1] * 3.1) % 97 - (home[b][0] * 7.3 + home[b][1] * 3.1) % 97);
  const TH = T('b1~thousands');
  order.forEach((k, j) => {
    const a = TH + 0.05 + 4.4 * Math.pow(j / (order.length - 1), 1.2) + r() * 0.3;
    S.add(sq[k].pop({ d: 0.45 }), a);
    free[k] = a + 0.5;
    const l = a + 0.6 + 2.2 * r();
    const rt = route(k), d = rt.len / (420 + 160 * r());
    if (l + d < B2) {
      S.add(sq[k].travel(rt.d, { d, ease: 'power1.inOut' }), l);
      sink(k, l + d);
      const back = l + d + 0.7 + 1.8 * r();
      if (back < 11.2) respawn(k, back); else free[k] = Infinity;
    }
  });
  crowd.edge.forEach((e, j) => S.add(e.pop({ d: 0.5 }), TH + 0.2 + j * 0.27));

  // ---------------------------------------------------------------- b2: run together: fuller trays, cheaper tokens
  const meter = S.g();
  const MT = { x: 1246, y: 766, h: 88 };
  S.rect({ x: MT.x, y: MT.y, w: 12, h: MT.h, r: 6, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.3, sw: 1.5 }, meter);
  const mFill = S.rect({ x: MT.x + 2, y: MT.y + 2, w: 8, h: MT.h - 4, r: 4, fill: 'helps', fillOpacity: 0.55 }, meter);
  const mark = S.path({ d: `M${MT.x - 18},${MT.y + 4 - 8} L${MT.x - 4},${MT.y + 4} L${MT.x - 18},${MT.y + 4 + 8} Z`, fill: 'ink' }, meter);
  S.text('cost per token', { x: MT.x + 30, y: MT.y + 20, size: 24, weight: 600, color: 'muted' }, meter);
  ignore(meter);
  S.set(meter, { autoAlpha: 0 }, 0);
  S.add(fx.in(meter, { from: 'left', d: 0.45, dist: 14 }), 'b2~economics');

  const TRAYS = [{ n: 3, F: T('b2~Run') - 0.15 }, { n: 5, F: T('b2~each') + 0.4 }, { n: 8, F: T('b2~costs') + 0.25 }];
  const LEVELS = [26, 48, 70];                       // marker drop per tray (schematic): fuller tray, lower cost
  const SL = { n: 8, s: 26, gap: 8, pad: 10, y: 704 };
  const TW = SL.n * SL.s + (SL.n - 1) * SL.gap + 2 * SL.pad;
  const slotX = i => 960 - TW / 2 + SL.pad + i * (SL.s + SL.gap) + SL.s / 2;
  TRAYS.forEach((tr, ti) => {
    const E = tr.F + 0.75;
    const tray = S.g(null, trayLayer);
    S.rect({ x: 960 - TW / 2, y: SL.y - SL.s / 2 - SL.pad, w: TW, h: SL.s + 2 * SL.pad, r: 14, fill: '#0c1326' }, tray);
    S.rect({ x: 960 - TW / 2, y: SL.y - SL.s / 2 - SL.pad, w: TW, h: SL.s + 2 * SL.pad, r: 14, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.35, sw: 2 }, tray);
    for (let i = tr.n; i < SL.n; i++) S.rect({ x: slotX(i) - SL.s / 2, y: SL.y - SL.s / 2, w: SL.s, h: SL.s, r: 6, stroke: '#ffffff', strokeOpacity: 0.2, sw: 1.5, dash: '4 4' }, tray);
    if (ti === 0) S.text('batch', { x: 960 - TW / 2 + 4, y: SL.y - 40, size: 24, weight: 600, color: 'muted' }, tray);
    S.set(tray, { autoAlpha: 0 }, 0);
    S.add(gsap.fromTo(tray, { autoAlpha: 0, y: 0 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }), tr.F - 0.1);
    S.add(gsap.to(tray, { y: 96, duration: 0.45, ease: 'power2.in' }), E);
    S.add(gsap.to(tray, { autoAlpha: 0, duration: 0.25 }), E + 0.25);
    // the conversations nearest the machines fill it
    const pick = sq.map((_, k) => k).filter(k => free[k] <= tr.F - 0.2)
      .sort((a, b) => (home[b][1] - Math.abs(home[b][0] - 960) * 0.25) - (home[a][1] - Math.abs(home[a][0] - 960) * 0.25)).slice(0, tr.n);
    pick.forEach((k, i) => {
      S.add(sq[k].moveTo([slotX(i), SL.y], { d: 0.55, ease: 'power3.inOut' }), tr.F + i * 0.03);
      S.add(sq[k].moveBy(0, 96, { d: 0.45, ease: 'power2.in' }), E);
      S.add(gsap.to(sq[k].body, { scale: 0.6, duration: 0.3, ease: 'power2.in', transformOrigin: '50% 50%' }), E + 0.15);
      S.add(sq[k].out({ d: 0.25 }), E + 0.25);
      free[k] = Infinity;
      const back = E + 1.0 + 1.4 * r();
      if (back < 16.4) respawn(k, back);
    });
    S.add(gsap.to(mark, { y: LEVELS[ti], duration: 0.4, ease: 'back.out(2)' }), E + 0.4);
    S.add(gsap.to(mFill, { attr: { y: MT.y + 2 + LEVELS[ti], height: MT.h - 4 - LEVELS[ti] }, duration: 0.4 }), E + 0.4);
    S.add(gsap.fromTo(boxBg, { attr: { 'stroke-opacity': 0.3 } }, { attr: { 'stroke-opacity': 0.9 }, duration: 0.2, yoyo: true, repeat: 1, immediateRender: false }), E + 0.4);
  });

  // ---------------------------------------------------------------- b3: the batch grows into eight lanes on a time axis
  const DIMT = T('b3') - 0.35;
  S.add(gsap.to(crowd, { opacity: 0.15, duration: 0.5 }), DIMT);
  S.add(gsap.to([head, box, meter, ...arrows], { opacity: 0.25, duration: 0.5 }), DIMT);
  const LP = { x: 300, y: 262, w: 1360, h: 468 };
  const lanes = S.g();
  S.rect({ x: LP.x, y: LP.y, w: LP.w, h: LP.h, r: 26, fill: '#0c1326', fillOpacity: 0.96, stroke: '#ffffff', strokeOpacity: 0.14, sw: 2 }, lanes);
  const LY = i => 318 + i * 46, X0 = 436, STEP = 84, PW = 64, PH = 28, AXY = 696;
  const laneG = S.g(null, lanes);
  const SHADE = i => (i === 2 ? null : ch03Shade(S, i, 7));
  const markers = [], laneLines = [];
  for (let i = 0; i < 8; i++) {
    laneLines.push(ignore(S.line({ x1: X0 - 12, y1: LY(i), x2: 1600, y2: LY(i), stroke: 'faint', sw: 1.5, strokeOpacity: 0.5 }, laneG)));
    markers.push(S.rect({ x: 380, y: LY(i) - 11, w: 22, h: 22, r: 5, fill: ch03Shade(S, i, 7), stroke: '#ffffff', strokeOpacity: 0.25, sw: 1 }, laneG));
  }
  const axis = S.g(null, lanes);
  S.arrow({ x1: X0 - 12, y1: AXY, x2: 1610, y2: AXY, color: 'muted', sw: 2.5, head: 12 }, axis);
  const axisLbl = S.text('time', { x: 1600, y: AXY - 24, size: 24, anchor: 'end', weight: 600, color: 'muted' }, axis);   // above the axis, clear of the panel's edge
  // the tray grows into the panel
  S.xset(lanes, { x: 960 - (LP.x + LP.w / 2), y: SL.y - (LP.y + LP.h / 2), s: 0.2, ox: LP.x + LP.w / 2, oy: LP.y + LP.h / 2 });
  S.set(lanes, { autoAlpha: 0 }, 0);
  const GROW = T('b3') - 0.3;
  S.add(gsap.to(lanes, { autoAlpha: 1, duration: 0.25 }), GROW);
  S.add(fx.xform(lanes, { x: 0, y: 0, s: 1 }, { d: 0.7, ease: 'power3.inOut' }), GROW);
  S.call(() => lanes.setAttribute('data-audit', 'ignore'), 0);
  S.call(() => lanes.removeAttribute('data-audit'), GROW + 0.75);

  // in step: every lane emits a next-token pill, then another
  const pill = (i, k, tone = 'struct') => S.rect({ x: X0 + k * STEP, y: LY(i) - PH / 2, w: PW, h: PH, r: 8, fill: `url(#card-${tone})`, stroke: tone, sw: 2 }, laneG);
  const stepAt = [GROW + 0.8, GROW + 1.25];
  const steps = [];
  stepAt.forEach((t, k) => {
    const row = [];
    for (let i = 0; i < 8; i++) { const p = pill(i, k); S.set(p, { autoAlpha: 0 }, 0); row.push(p); }
    S.add(fx.pop(row, { d: 0.35, stagger: 0.02, from: 0.5 }), t);
    steps.push(row);
  });
  // one slow request: lane 3 turns violet and its step stretches
  const SLOW = T('b3~request') + 0.15;
  S.add(gsap.to([markers[2]], { attr: { fill: S.tone('violet') }, duration: 0.3 }), SLOW);
  S.add(gsap.to([steps[0][2], steps[1][2]], { attr: { stroke: S.tone('violet'), fill: 'url(#card-violet)' }, duration: 0.3 }), SLOW);
  S.add(gsap.to(laneLines[2], { attr: { stroke: S.tone('violet'), 'stroke-opacity': 0.8 }, duration: 0.3 }), SLOW);
  const BX = X0 + 2 * STEP, BEND = 1250, TOK = T('b3~token') - 0.1;
  const longBar = S.rect({ x: BX, y: LY(2) - PH / 2, w: 0, h: PH, r: 8, fill: 'url(#bar-violet)', stroke: 'violet', sw: 2 }, laneG);
  S.set(longBar, { autoAlpha: 0 }, 0);
  S.add(gsap.set(longBar, { autoAlpha: 1 }), SLOW + 0.3);
  S.add(gsap.fromTo(longBar, { attr: { width: PW } }, { attr: { width: BEND - BX }, duration: TOK - SLOW - 0.3, ease: 'none', immediateRender: false }), SLOW + 0.3);
  const longLbl = S.text('long request', { x: BX + 18, y: LY(2) - 1, size: 21, weight: 650, color: '#0a0f1e' }, laneG);
  S.set(longLbl, { autoAlpha: 0 }, 0);
  // the label waits until the growing bar holds it
  const LBL_W = 18 + S.measure('long request', { size: 21, weight: 650 }) + 18, GROW_D = TOK - SLOW - 0.3;
  S.add(fx.in(longLbl, { from: 'fade', d: 0.3 }), Math.max(SLOW + 1.3, SLOW + 0.3 + GROW_D * (LBL_W - PW) / (BEND - BX - PW)));
  // the others' next pills stall, then wait (grey hatching)
  const ghosts = [];
  for (let i = 0; i < 8; i++) if (i !== 2) {
    const g = ignore(S.rect({ x: BX, y: LY(i) - PH / 2, w: PW, h: PH, r: 8, stroke: 'muted', sw: 2, dash: '5 4' }, laneG));
    S.set(g, { autoAlpha: 0 }, 0);
    ghosts.push(g);
  }
  S.add(gsap.to(ghosts, { autoAlpha: 1, duration: 0.15, stagger: 0.02 }), SLOW + 0.3);
  S.add(gsap.to(ghosts, { autoAlpha: 0.35, duration: 0.25, yoyo: true, repeat: 3 }), SLOW + 0.5);
  const HOLD = T('b3~holds') - 0.05;
  S.add(gsap.to(ghosts, { autoAlpha: 0, duration: 0.2 }), HOLD);
  const hatches = [];
  let nId = 0;
  for (let i = 0; i < 8; i++) if (i !== 2) {
    const g = S.g(null, laneG);
    const id = `s04-hatch-${nId++}`;
    const cp = S.el('clipPath', { id }, g);
    const cr = S.rect({ x: BX, y: LY(i) - PH / 2, w: 0, h: PH }, cp);
    const body = S.g(null, g);
    body.setAttribute('clip-path', `url(#${id})`);
    S.rect({ x: BX, y: LY(i) - PH / 2, w: BEND - BX, h: PH, r: 6, fill: 'faint', fillOpacity: 0.12, stroke: 'faint', strokeOpacity: 0.7, sw: 1.5 }, body);
    let d = '';
    for (let x = BX - PH; x < BEND; x += 11) d += `M${x},${LY(i) + PH / 2} L${x + PH},${LY(i) - PH / 2} `;
    ignore(S.path({ d, stroke: 'faint', sw: 1.5, strokeOpacity: 0.8 }, body));
    S.set(g, { autoAlpha: 0 }, 0);
    S.add(gsap.set(g, { autoAlpha: 1 }), HOLD);
    // catch up with the long bar, then keep pace with it
    const catchUp = Math.min(0.6, TOK - HOLD);
    const xAt = t => BX + (BEND - BX) * Math.min(1, Math.max(0, (t - SLOW - 0.3) / (TOK - SLOW - 0.3)));
    S.add(gsap.fromTo(cr, { attr: { width: 0 } }, { attr: { width: xAt(HOLD + catchUp) - BX }, duration: catchUp, ease: 'power2.out', immediateRender: false }), HOLD);
    S.add(gsap.to(cr, { attr: { width: BEND - BX }, duration: TOK - HOLD - catchUp, ease: 'none' }), HOLD + catchUp);
    hatches.push(g);
  }
  const waitLbl = S.text('waiting', { x: BX + 16, y: LY(0) - 1, size: 21, weight: 650, color: 'ink' }, laneG);
  S.set(waitLbl, { autoAlpha: 0 }, 0);
  S.add(fx.in(waitLbl, { from: 'fade', d: 0.3 }), HOLD + 0.7);
  // everyone's next token comes only when the long one is done
  const after = [];
  for (let i = 0; i < 8; i++) { const p = S.rect({ x: BEND + 16, y: LY(i) - PH / 2, w: PW, h: PH, r: 8, fill: `url(#card-${i === 2 ? 'violet' : 'struct'})`, stroke: i === 2 ? 'violet' : 'struct', sw: 2 }, laneG); S.set(p, { autoAlpha: 0 }, 0); after.push(p); }
  S.add(fx.pop(after, { d: 0.35, stagger: 0.015, from: 0.5 }), TOK + 0.05);

  // ---------------------------------------------------------------- b3: averages hide rare delays: the lanes become a dot plot
  const AVG = T('b3~Averages');
  S.add(gsap.to(laneG, { autoAlpha: 0, duration: 0.4 }), AVG - 0.1);
  S.add(fx.swap(axisLbl, 'time to answer'), AVG);
  const tag = S.pill('schematic', { x: LP.x + LP.w - 92, y: LP.y + 40, h: 40, size: 22, tone: 'neutral', style: 'outline' }, lanes);
  S.set(tag, { autoAlpha: 0 }, 0);
  S.add(fx.in(tag, { from: 'fade', d: 0.4 }), AVG + 0.2);
  // 30 quick answers and 2 slow ones (values in arbitrary time units)
  // a smooth right-skewed hump: dots per 22 px column (30 in all), then the two slow ones
  const HUMP = [1, 2, 4, 5, 5, 4, 3, 2, 2, 1, 1];
  const VALS = HUMP.flatMap((n, b) => Array(n).fill((510 + b * 22 - 400) / 118)).concat([7.2, 8.1]);
  const XV = v => 400 + v * 118, BIN = 22, DR = 9;
  const stack = {};
  const dots = VALS.map((v, k) => {
    const bx = k < 30 ? Math.round(XV(v)) : Math.round(XV(v) / BIN) * BIN, h = (stack[bx] = (stack[bx] || 0) + 1);
    const far = k >= 30;
    const c = S.circle({ x: bx, y: AXY - 18 - (h - 1) * 21, r: DR, fill: far ? 'violet' : 'struct', fillOpacity: 0.85, stroke: '#ffffff', strokeOpacity: 0.3, sw: 1 }, lanes);
    S.set(c, { autoAlpha: 0 }, 0);
    return c;
  });
  const order2 = dots.slice(0, 30).map((c, k) => k).sort((a, b) => VALS[a] - VALS[b]);
  order2.forEach((k, j) => S.add(fx.pop(dots[k], { d: 0.3, from: 0.3 }), AVG + 0.35 + j * 0.025));
  S.add(fx.pop(dots.slice(30), { d: 0.45, stagger: 0.18 }), 'b3~rare');
  const mean = VALS.reduce((a, b) => a + b, 0) / VALS.length;
  const tickAt = (x, label, tone, top) => {
    const g = S.g(null, lanes);
    S.line({ x1: x, y1: top + 14, x2: x, y2: AXY + 8, stroke: tone, sw: 3 }, g);
    g.lbl = S.text(label, { x, y: top, size: 26, anchor: 'middle', weight: 650, color: tone }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  };
  const avgTick = tickAt(XV(mean), 'average', 'ink', 440);
  S.add(fx.in(avgTick, { from: 'down', d: 0.4, dist: 20 }), 'b3~delays');
  const worstTick = tickAt(Math.round(XV(8.1) / BIN) * BIN, 'worst case', 'violet', 480);
  S.add(fx.in(worstTick, { from: 'down', d: 0.4, dist: 20 }), 'b3~worst-0.1');
  S.add(gsap.fromTo(worstTick.lbl, { filter: 'none' }, { filter: 'url(#glow-violet)', duration: 0.4, yoyo: true, repeat: 1 }), 'b3~case');
  S.add(gsap.to(avgTick, { opacity: 0.35, duration: 0.4 }), 'b3~worst');

  // ---------------------------------------------------------------- b4: shared, concurrent, paid for
  S.add(gsap.to(lanes, { opacity: 0.3, duration: 0.5 }), 'b4');
  S.add(gsap.to(head, { autoAlpha: 0, duration: 0.4 }), 'b4');
  const conc = ch03Tag(S, 'concurrent', { x: 960, y: 170, icons: [CH03.icons.concurrent], tone: 'struct', size: 32 });
  const shared = ch03Tag(S, 'shared', { x: 0, y: 170, icons: [CH03.icons.shared], anchor: 'start', size: 30 });
  const paid = ch03Tag(S, 'paid for', { x: 0, y: 170, icons: [CH03.icons.hour, CH03.icons.coin], anchor: 'start', size: 30 });
  S.xset(shared, { x: conc.l - 36 - shared.w });
  S.xset(paid, { x: conc.r + 36 });
  S.add(conc.stamp(), 'b4~concurrent-0.15');
  S.add(shared.stamp(), 'b4~Shared-0.15');
  S.add(fx.pulse(conc, { scale: 1.06, d: 0.4 }), 'b4~concurrent#2-0.1');
  S.add(paid.stamp(), 'b4~paid-0.15');
  // unlike running a model once on your own machine
  const inset = S.g();
  S.rect({ x: 1470, y: 770, w: 360, h: 196, r: 22, fill: '#0c1326' }, inset);
  S.rect({ x: 1470, y: 770, w: 360, h: 196, r: 22, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.18, sw: 2 }, inset);
  libDevice(S, { x: 1580, y: 846, w: 150 }, inset);
  S.icon('ph:user-duotone', { x: 1735, y: 846, size: 60, color: 'struct' }, inset);
  const insetLbl = S.text('once, on your own machine', { x: 1650, y: 936, size: 24, anchor: 'middle', weight: 600, color: 'ink' }, inset);
  S.set(inset, { autoAlpha: 0 }, 0);
  S.add(fx.in(inset, { from: 'right', d: 0.5, dist: 30 }), 'b4~unlike-0.1');
  S.add(gsap.to(inset, { opacity: 0.45, duration: 0.5 }), 'b4~own');
  S.add(gsap.to(insetLbl, { attr: { fill: S.tone('muted') }, duration: 0.5 }), 'b4~own');

  // ---------------------------------------------------------------- the close: the crowd field alone, frozen and dimmed
  const END = T('b4>') + 0.05;
  S.add(gsap.to([conc, shared, paid, lanes, inset, box, meter, ...arrows, crowd], { autoAlpha: 0, duration: 0.5 }), END);
  const still = ch03Crowd(S, CROWD);                  // the same seeded field, every square at home
  S.set(still, { autoAlpha: 0 }, 0);
  S.add(gsap.to(still, { autoAlpha: 0.35, duration: 0.6 }), END + 0.15);
});
