/* ch03_s06 · nothing lives in the model (fig 21)
   The operator's system prompt goes in front; but the 140 GB of weights are identical for everyone,
   frozen before that text existed. So whatever shapes the answer must be in the context, the tokens
   in front of the model on that run: the context window is the only input. */
V.scene('ch03_s06', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };

  // ---------------------------------------------------------------- b1: the operator and its system prompt
  const op = S.g();
  S.icon('ph:buildings-duotone', { x: 500, y: 222, size: 76, color: 'muted' }, op);
  const opLbl = S.text('operator', { x: 500, y: 292, size: 26, anchor: 'middle', weight: 600, color: 'muted' }, op);
  S.set(op, { autoAlpha: 0 }, 0);
  S.add(fx.in(op, { from: 'up', d: 0.5 }), 0.3);
  const CARD = { x: 580, y: 170, w: 440, h: 124 };
  const card = S.g();
  S.rect({ x: CARD.x, y: CARD.y, w: CARD.w, h: CARD.h, r: 16, fill: '#0c1326', filter: 'url(#shadow)' }, card);
  const cardBg = S.rect({ x: CARD.x, y: CARD.y, w: CARD.w, h: CARD.h, r: 16, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.25, sw: 2 }, card);
  S.icon('ph:file-text-duotone', { x: CARD.x + 40, y: CARD.y + 42, size: 40, color: 'ink' }, card);
  const cardT = S.text('system prompt', { x: CARD.x + 74, y: CARD.y + 43, size: 30, weight: 650, color: 'muted' }, card);
  const cardL = S.text('You are a helpful assistant…', { x: CARD.x + 24, y: CARD.y + 92, size: 24, weight: 500, color: 'muted', family: 'mono' }, card);
  S.set(card, { autoAlpha: 0 }, 0);
  S.add(fx.in(card, { from: 'left', d: 0.55, dist: 30 }), 'b1~their-0.1');
  S.add(gsap.to(cardT, { attr: { fill: S.tone('ink') }, duration: 0.3 }), 'b1~system-0.05');
  S.add(gsap.fromTo(cardBg, { filter: 'none' }, { filter: 'url(#glow-struct)', duration: 0.4, yoyo: true, repeat: 1, immediateRender: false }), 'b1~system');
  S.add(fx.pulse(cardT, { scale: 1.05, d: 0.45 }), 'b1~prompt');

  // ---------------------------------------------------------------- b2: 140 GB of weights, identical for everyone, finished before
  S.add(fx.out([cardL, opLbl], { d: 0.35 }), 'b2-0.2');
  const SL = { x: 560, y: 360, w: 800, h: 260 };
  const slab = S.g();
  S.rect({ x: SL.x - 6, y: SL.y - 6, w: SL.w + 12, h: SL.h + 12, r: 14, fill: '#0c1326', stroke: 'bytes', strokeOpacity: 0.7, sw: 2.5 }, slab);
  // a dense block of weight tiles: three paths of seeded brightness, so it reads as a texture of numbers
  const rr = S.rand(13), TS = 10, TG = 2.5, cols = Math.floor(SL.w / (TS + TG)), rows = Math.floor(SL.h / (TS + TG));
  const ox = SL.x + (SL.w - (cols * (TS + TG) - TG)) / 2, oy = SL.y + (SL.h - (rows * (TS + TG) - TG)) / 2;
  const dd = ['', '', ''];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = ox + c * (TS + TG), y = oy + r * (TS + TG);
    dd[Math.floor(rr() * 3)] += `M${x.toFixed(1)},${y.toFixed(1)}h${TS}v${TS}h${-TS}Z`;
  }
  const tilesG = S.g(null, slab);
  dd.forEach((d, i) => S.path({ d, fill: 'bytes', fillOpacity: [0.32, 0.52, 0.75][i] }, tilesG));
  const clipId = 's06-slab-clip';
  const cp = S.el('clipPath', { id: clipId }, slab);
  const cr = S.rect({ x: SL.x - 8, y: SL.y - 8, w: 0, h: SL.h + 16 }, cp);
  slab.setAttribute('clip-path', `url(#${clipId})`);
  const plate = S.g();
  const plW = S.measure('140 GB of weights', { size: 40, weight: 700 }) + 60;
  S.rect({ x: 960 - plW / 2, y: SL.y + SL.h / 2 - 36, w: plW, h: 72, r: 36, fill: '#0c1326', fillOpacity: 0.92, stroke: 'bytes', sw: 2 }, plate);
  S.text('140 GB of weights', { x: 960, y: SL.y + SL.h / 2 + 1, size: 40, anchor: 'middle', weight: 700, color: 'ink' }, plate);
  S.set(plate, { autoAlpha: 0 }, 0);
  const WT = T('b2~weights') - 0.1;
  S.add(gsap.fromTo(cr, { attr: { width: 0 } }, { attr: { width: SL.w + 16 }, duration: 0.9, ease: 'power2.inOut', immediateRender: false }), WT);
  S.add(fx.in(plate, { from: 'scale', scale: 0.9, d: 0.45 }), WT + 0.7);
  const same = S.text('identical for every user, every request, forever', { x: 960, y: SL.y + SL.h + 54, size: 30, anchor: 'middle', weight: 650, color: 'ink' });
  S.set(same, { autoAlpha: 0 }, 0);
  S.add(fx.in(same, { from: 'scale', scale: 1.12, d: 0.4 }), 'b2~same-0.1');
  // a timeline: training finished long before the system prompt was written
  const TLY = 870, TX0 = 420, TX1 = 1500;
  const tline = S.g();
  const tl = S.line({ x1: TX0, y1: TLY, x2: TX1, y2: TLY, stroke: 'muted', sw: 3 }, tline);
  const tdot = (x, label, tone) => {
    const g = S.g(null, tline);
    S.circle({ x, y: TLY, r: 10, fill: tone, stroke: '#0c1326', sw: 3 }, g);
    S.text(label, { x, y: TLY + 40, size: 26, anchor: 'middle', weight: 600, color: tone === 'bytes' ? 'ink' : 'muted' }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  };
  const d1 = tdot(TX0, 'training finished', 'bytes'), d2 = tdot(TX1, 'system prompt written', 'muted');
  S.set(tl, { autoAlpha: 0 }, 0);
  const FIN = T('b2~finished') - 0.1;
  S.add(fx.pop(d1, { d: 0.4 }), FIN);
  S.add(gsap.set(tl, { autoAlpha: 1 }), FIN + 0.1);
  S.add(fx.draw(tl, { d: 0.8, ease: 'power1.inOut' }), FIN + 0.1);
  S.add(fx.pop(d2, { d: 0.4 }), T('b2~text') - 0.1);
  const gapLbl = S.text('long before', { x: (TX0 + TX1) / 2, y: TLY - 22, size: 24, anchor: 'middle', weight: 550, color: 'muted' }, tline);
  S.set(gapLbl, { autoAlpha: 0 }, 0);
  S.add(fx.in(gapLbl, { from: 'fade', d: 0.35 }), T('b2~before'));
  const lock = S.g();
  S.circle({ x: SL.x + SL.w, y: SL.y, r: 38, fill: '#0c1326', stroke: 'ink', sw: 2.5 }, lock);
  S.icon('ph:lock-simple-duotone', { x: SL.x + SL.w, y: SL.y - 2, size: 44, color: 'ink' }, lock);
  S.set(lock, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(lock, { autoAlpha: 0, y: -60 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'bounce.out' }), T('b2~before') + 0.15);
  // 'none of it': the card flies at the slab and bounces off
  const NONE = T('b2~None') - 0.1;
  S.add(fx.out(tline, { d: 0.4 }), NONE);
  S.add(gsap.to(card, { x: 250, y: 110, rotation: 6, transformOrigin: '50% 50%', duration: 0.32, ease: 'power2.in' }), NONE);
  S.add(gsap.to(card, { x: 0, y: 0, rotation: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(2.2)' }), NONE + 0.32);
  const hit = ignore(S.rect({ x: SL.x - 6, y: SL.y - 6, w: SL.w + 12, h: SL.h + 12, r: 14, stroke: 'ink', sw: 4 }));
  S.set(hit, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(hit, { autoAlpha: 0.9 }, { autoAlpha: 0, duration: 0.5, ease: 'power2.out', immediateRender: false }), NONE + 0.32);
  S.call(() => card.setAttribute('data-audit', 'ignore'), NONE);
  S.call(() => card.removeAttribute('data-audit'), NONE + 1.0);
  const head = S.text('The weights do not know your system prompt', { x: 1180, y: 118, size: 38, anchor: 'middle', weight: 700, family: 'display', color: 'ink' });
  S.set(head, { autoAlpha: 0 }, 0);
  S.add(fx.in(head, { from: 'down', d: 0.5, dist: 24 }), T('b2~model') - 0.2);

  // ---------------------------------------------------------------- b3: whatever shapes the answer must be in the context
  S.add(fx.out([same, head], { d: 0.4 }), 'b3-0.2');
  const ST = { x: 360, y: 728, w: 1200, h: 64 };
  const strip = S.g();
  S.rect({ x: ST.x, y: ST.y, w: ST.w, h: ST.h, r: 16, fill: '#0c1326' }, strip);
  S.rect({ x: ST.x, y: ST.y, w: ST.w, h: ST.h, r: 16, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.6, sw: 2 }, strip);
  const stripLbl = S.text('context', { x: ST.x + 4, y: ST.y - 26, size: 28, weight: 650, color: 'struct' }, strip);
  S.set(strip, { autoAlpha: 0 }, 0);
  S.add(fx.in(strip, { from: 'up', d: 0.45, dist: 20 }), 'b3~context-0.25');
  const PILLS = ['system prompt', 'conversation', 'your question'];
  let px = ST.x + 16;
  const pills = PILLS.map((t, i) => {
    const p = libToken(S, { text: t, x: px, y: ST.y + ST.h / 2, size: 26, anchor: 'start', state: i === 2 ? 'token' : 'token' });
    px += p.w + 12;
    S.set(p, { autoAlpha: 0 }, 0);
    return p;
  });
  pills.forEach((p, i) => S.add(p.in({ from: 'down', dist: 40, d: 0.4 }), T('b3~context') + 0.1 + i * 0.22));
  // the operator's card becomes the first pill
  S.add(gsap.to(card, { autoAlpha: 0, y: 40, duration: 0.4, ease: 'power2.in' }), T('b3~context'));
  S.add(fx.out(op, { d: 0.4 }), T('b3~context'));
  const arrow = S.arrow({ x1: 960, y1: ST.y - 8, x2: 960, y2: SL.y + SL.h + 14, color: 'struct', sw: 4, head: 16 });
  S.set(arrow, { autoAlpha: 0 }, 0);
  S.add(gsap.set(arrow, { autoAlpha: 1 }), 'b3~tokens');
  S.add(fx.drawArrow(arrow, { d: 0.5 }), 'b3~tokens');
  const runLbl = S.text('that run', { x: 984, y: (ST.y + SL.y + SL.h) / 2 + 2, size: 28, weight: 650, color: 'ink' });
  S.set(runLbl, { autoAlpha: 0 }, 0);
  S.add(fx.in(runLbl, { from: 'left', d: 0.35, dist: 12 }), 'b3~that run');
  S.flow({ d: `M960,${ST.y - 10} L960,${SL.y + SL.h + 18}`, from: T('b3~that run'), to: 'end', speed: 90, every: 0.25, size: 6, color: 'struct' });
  // no cupboard to reach into
  const cup = S.g();
  S.circle({ x: 1700, y: 490, r: 54, fill: '#0c1326', stroke: 'muted', strokeOpacity: 0.5, sw: 2 }, cup);
  S.icon('ph:lockers-duotone', { x: 1700, y: 490, size: 64, color: 'muted' }, cup);
  const reach = ignore(S.line({ x1: 1640, y1: 490, x2: SL.x + SL.w + 16, y2: 490, stroke: 'muted', sw: 3, dash: '2 9', cap: 'round' }));
  S.set([cup, reach], { autoAlpha: 0 }, 0);
  S.add(fx.in(cup, { from: 'right', d: 0.45, dist: 24 }), 'b3~channel');
  S.add(gsap.to(reach, { autoAlpha: 1, duration: 0.4 }), T('b3~channel') + 0.2);
  const cross = S.g();
  S.path({ d: 'M1662,452 L1738,528 M1738,452 L1662,528', stroke: 'muted', sw: 6, cap: 'round' }, cross);
  ignore(cross);
  S.set(cross, { autoAlpha: 0 }, 0);
  S.add(fx.pop(cross, { d: 0.35, from: 1.5 }), 'b3~cupboard');
  S.add(gsap.to(reach, { autoAlpha: 0, duration: 0.35 }), T('b3~cupboard') + 0.2);
  S.add(gsap.to(cup, { opacity: 0.4, duration: 0.4 }), T('b3~cupboard') + 0.2);

  // ---------------------------------------------------------------- b4: the context window is the only input
  S.add(fx.out([cup, cross], { d: 0.4 }), 'b4');
  const FR = { x: ST.x - 16, y: ST.y - 14, w: ST.w + 32, h: ST.h + 28 };
  const frame = ignore(S.rect({ x: FR.x, y: FR.y, w: FR.w, h: FR.h, r: 22, stroke: 'ink', sw: 2.5 }));
  const maxEdge = S.line({ x1: FR.x + FR.w, y1: FR.y - 12, x2: FR.x + FR.w, y2: FR.y + FR.h + 12, stroke: 'ink', sw: 6, cap: 'round' });
  const maxLbl = S.text('maximum', { x: FR.x + FR.w, y: FR.y + FR.h + 40, size: 24, anchor: 'end', weight: 600, color: 'ink' });
  S.set([frame, maxEdge, maxLbl], { autoAlpha: 0 }, 0);
  const CW = T('b4~context') - 0.1;
  S.add(gsap.set(frame, { autoAlpha: 1 }), CW);
  S.add(fx.draw(frame, { d: 0.8 }), CW);
  S.add(fx.in(maxEdge, { from: 'fade', d: 0.3 }), CW + 0.6);
  S.add(fx.in(maxLbl, { from: 'up', d: 0.35, dist: 10 }), CW + 0.7);
  S.add(fx.swap(stripLbl, 'context window'), CW + 0.2);
  S.add(gsap.to(stripLbl, { y: -16, duration: 0.3 }), CW + 0.2);
  S.add(fx.swap(runLbl, 'the only input'), 'b4~only-0.1');
  const take = S.takeaway('the context window is the only input', { tone: 'struct' });
  S.add(fx.in(take, { from: 'up', d: 0.5 }), 'b4~is its-0.2');
});
