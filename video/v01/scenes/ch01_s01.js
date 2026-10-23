/* ch01_s01 · a file of numbers, and its two lives (figs 1, 2)
   Movement 1 (b1-b2): a file opens into 40 weights; their range; the pull-back to seventy billion.
   Movement 2 (b3-b5): the same list between its two lives, training and inference. */
V.scene('ch01_s01', S => {
  const { fx } = S;
  const GX = 960, GY = 470;

  // ---------------------------------------------------------------- the endless field (for the pull-back)
  // A pattern of tiles aligned exactly with the 40-tile grid, so pulling back reveals "more of the same".
  const defs = S.el('defs', null, S.layers.back);
  const pat = S.el('pattern', { id: 'ch01s01-field', width: 110, height: 76, patternUnits: 'userSpaceOnUse', x: GX - 544, y: GY - 146 }, defs);
  S.rect({ x: 0, y: 0, w: 98, h: 64, r: 10, fill: 'struct', fillOpacity: 0.34 }, pat);
  const field = S.rect({ x: -16000, y: -11000, w: 32000, h: 22000, fill: 'url(#ch01s01-field)', opacity: 0 }, S.layers.back);
  field.setAttribute('data-audit', 'ignore');

  // ---------------------------------------------------------------- b1: a trained model is a file
  const file = S.g();
  const fileIcon = S.icon('ph:file-duotone', { x: GX, y: GY - 20, size: 220, color: 'struct' }, file);
  const fileLabel = S.text('a trained model', { x: GX, y: GY + 130, size: 34, anchor: 'middle', color: 'muted', weight: 550 }, file);
  S.add(fx.pop(fileIcon, { from: 0.7, d: 0.8 }), 'b1-0.4');
  S.add(fx.in(fileLabel, { from: 'up' }), 'b1+0.1');
  S.add(fx.pulse(fileIcon, { scale: 1.05, d: 0.5 }), 'b1~file');

  const inferGroup = S.g();                  // the inference panel and its facts (scaled together in b5)
  const gridHolder = S.g();                  // the 40 tiles; moved and scaled with fx.xform
  const tiles = ch01Tiles(S, { cx: GX, cy: GY, parent: gridHolder });
  // "Open it": the file swells and dissolves; what we might expect to find inside is struck out, one word at a time
  S.add(gsap.to(fileIcon, { scale: 1.3, autoAlpha: 0, transformOrigin: '50% 50%', duration: 0.35, ease: 'power2.in' }), 'b1~Open');
  S.add(fx.out(fileLabel, { d: 0.3 }), 'b1~Open');
  const NOT = ['rules', 'instructions', 'text'];
  const nots = NOT.map((w, i) => {
    const g = S.g();
    g.word = S.text(w, { x: GX + (i - 1) * 380, y: GY, size: 52, color: 'muted', weight: 600, anchor: 'middle', family: 'display' }, g);
    return g;
  });
  nots.forEach((g, i) => {
    S.add(fx.in(g, { from: 'down', d: 0.4 }), `b1~${NOT[i]}-0.2`);
    S.add(fx.strike(g.word, { tone: 'bytes', d: 0.3 }), `b1~${NOT[i]}+0.3`);
  });
  S.add(fx.out(nots, { d: 0.3, stagger: 0.04 }), 'b1~Just-0.1');
  // "Just numbers": the tiles cascade out from the centre
  S.add(gsap.fromTo(tiles.cells, { autoAlpha: 0, scale: 0.3, x: (i, c) => GX - c.cx, y: (i, c) => GY - c.cy, transformOrigin: '50% 50%' },
    { autoAlpha: 1, scale: 1, x: 0, y: 0, duration: 0.7, ease: 'power3.out', stagger: { each: 0.018, grid: [4, 10], from: 'center' } }), 'b1~Just+0.05');
  // the first five tiles pulse in turn
  const first5 = tiles.cells.slice(0, 5);
  S.add(gsap.fromTo(first5.map(c => c.bg), { attr: { 'stroke-opacity': 0.45 } },
    { attr: { 'stroke-opacity': 1 }, duration: 0.22, yoyo: true, repeat: 1, stagger: 0.14, ease: 'sine.inOut' }), 'b1~numbers+0.5');
  S.add(gsap.fromTo(first5, { scale: 1, transformOrigin: '50% 50%' },
    { scale: 1.12, duration: 0.22, yoyo: true, repeat: 1, stagger: 0.14, ease: 'sine.inOut', transformOrigin: '50% 50%' }), 'b1~numbers+0.5');

  // ---------------------------------------------------------------- b2: the range, then seventy billion
  const NL = { x0: 560, x1: 1360, y: 740 };
  const X = v => NL.x0 + (v + 1) / 2 * (NL.x1 - NL.x0);
  const nl = S.g();
  const axis = S.line({ x1: NL.x0 - 40, y1: NL.y, x2: NL.x1 + 260, y2: NL.y, stroke: 'faint', sw: 3 }, nl);
  const ticks = [-1, 0, 1].map(v => {
    const tg = S.g(null, nl);
    S.line({ x1: X(v), y1: NL.y - 14, x2: X(v), y2: NL.y + 14, stroke: 'muted', sw: 3 }, tg);
    S.text(v > 0 ? '+1' : v < 0 ? '−1' : '0', { x: X(v), y: NL.y + 46, size: 28, anchor: 'middle', family: 'mono', color: 'muted' }, tg);
    return tg;
  });
  const shown = S.text('40 shown', { x: tiles.x + tiles.w + 26, y: GY, size: 28, color: 'faint', weight: 550 });
  const dots = tiles.values.map((v, i) => {
    const [cx, cy] = tiles.cellCenter(i);
    const d = S.circle({ x: X(v), y: NL.y, r: 8, fill: v < 0 ? 'violet' : 'struct' }, nl);
    d.__from = [cx - X(v), cy - NL.y];
    return d;
  });
  S.add(fx.draw(axis, { d: 0.7 }), 'b2+0.05');
  ['b2~minus', 'b2~and', 'b2~plus'].forEach((at, i) => S.add(fx.in(ticks[i], { from: 'up', d: 0.45 }), at));
  S.add(fx.in(shown, { from: 'left', d: 0.5 }), 'b2+0.4');
  S.add(gsap.fromTo(dots, { autoAlpha: 0, x: (i, d) => d.__from[0], y: (i, d) => d.__from[1] },
    { autoAlpha: 1, x: 0, y: 0, duration: 0.8, ease: 'power2.in', stagger: { each: 0.02, from: 'random' } }), 'b2~sits');
  // the one past the end of the line
  const past = S.callout('1.44', { x: X(1.44), y: NL.y - 40, from: [X(1.44), NL.y - 12], tone: 'struct', size: 26, anchor: 'middle' });
  S.add(fx.in(past, { from: 'fade', d: 0.4 }), 'b2~plus+0.35');

  // the counter, top right, above the camera
  const counter = S.counter({ x: 1810, y: 168, size: 58, value: 40, anchor: 'end', color: 'ink', family: 'mono', weight: 600 }, S.hud);
  const cLabel = S.text('numbers', { x: 1810, y: 226, size: 28, anchor: 'end', color: 'muted', weight: 550 }, S.hud);
  S.add(fx.out([nl, shown, past], { d: 0.35 }), 'b2~seventy-0.35');
  S.add(fx.in([counter, cLabel], { from: 'down', d: 0.5 }), 'b2~seventy-0.3');
  // the pull-back: camera retreats until the 40 tiles are a speck in a field of identical tiles
  const pull = gsap.timeline();
  pull.to(field, { opacity: 1, duration: 0.6, ease: 'power1.out' }, 0.15);
  pull.add(fx.cam({ x: GX, y: GY, scale: 0.12, d: 2.6, ease: 'expo.inOut' }), 0);
  S.add(pull, 'b2~seventy-0.1');
  S.add(fx.count(counter, 40, 70e9, { d: 2.6, ease: 'expo.inOut' }), 'b2~seventy-0.1');

  // "parameter": the 1.44 tile lifts out of the field toward the camera
  const big = S.g(null, S.hud);
  const bigTile = S.g(null, big);
  S.rect({ x: -98 / 2, y: -64 / 2, w: 98, h: 64, r: 10, fill: '#0c1326' }, bigTile);
  S.rect({ x: -98 / 2, y: -64 / 2, w: 98, h: 64, r: 10, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.9, sw: 1.5 }, bigTile);
  S.text('1.44', { x: 0, y: 1, size: 24, anchor: 'middle', family: 'mono', weight: 500 }, bigTile);
  // where tile (0,3) sits on screen at the pulled-back camera
  const [t3x, t3y] = tiles.cellCenter(3);
  const sx = 960 + (t3x - GX) * 0.12, sy = 540 + (t3y - GY) * 0.12;
  S.xset(big, { x: sx, y: sy, s: 0.12 });
  S.set(big, { autoAlpha: 0 }, 0);
  S.add(gsap.to(field, { opacity: 0.45, duration: 0.6 }), 'b2~parameter-0.2');
  S.add(gsap.to(S.main, { opacity: 0.35, duration: 0.6 }), 'b2~parameter-0.2');
  S.add(gsap.set(big, { autoAlpha: 1 }), 'b2~parameter-0.2');
  S.add(fx.xform(big, { x: 960, y: 450, s: 3 }, { d: 1.1, ease: 'power3.out' }), 'b2~parameter-0.2');
  const eq = S.equation([{ t: 'parameter', tone: 'struct' }, { t: '=', tone: 'muted' }, { t: 'weight', tone: 'struct' }], { x: 960, y: 640, size: 52 }, S.hud);
  S.add(fx.in(eq.parts[0], { from: 'right', d: 0.6 }), 'b2~parameter');
  S.add(fx.in([eq.parts[1], eq.parts[2]], { from: 'left', d: 0.6, stagger: 0.12 }), 'b2~weight-0.15');
  S.add(fx.swap(cLabel, 'weights'), 'b2~weight');

  // ---------------------------------------------------------------- b3: everything follows; training made it
  S.add(fx.xform(big, { x: sx, y: sy, s: 0.12 }, { d: 0.8, ease: 'power3.in' }), 'b3~Everything-0.2');
  S.add(gsap.to(big, { autoAlpha: 0, duration: 0.3 }), 'b3~Everything+0.3');
  S.add(fx.out(eq.parts, { d: 0.35 }), 'b3~Everything-0.2');
  S.add(gsap.to([S.main], { opacity: 1, duration: 0.5 }), 'b3~Everything');
  S.add(fx.cam({ scale: 1, d: 1.4, ease: 'expo.inOut' }), 'b3~Everything');
  S.add(gsap.to(field, { opacity: 0, duration: 0.9, ease: 'power2.in' }), 'b3~Everything+0.3');
  S.add(fx.out([counter, cLabel], { d: 0.4 }), 'b3~Everything+0.5');
  S.add(fx.pulse(tiles.g, { scale: 1.03, d: 0.6 }), 'b3~arithmetic');

  // the two panels, with the list between them
  const P = { y: 290, h: 500, w: 560, lx: 100, rx: 1260 };
  const CY = P.y + P.h / 2;                  // 540
  const train = S.card({ x: P.lx, y: P.y, w: P.w, h: P.h, tone: 'neutral', title: '' });
  const infer = S.card({ x: P.rx, y: P.y, w: P.w, h: P.h, tone: 'struct', title: '' }, inferGroup);
  const trainTitle = S.text('Training', { x: P.lx + P.w / 2, y: P.y + 60, size: 46, anchor: 'middle', weight: 700, family: 'display', color: 'muted' });
  const inferTitle = S.text('Inference', { x: P.rx + P.w / 2, y: P.y + 60, size: 46, anchor: 'middle', weight: 700, family: 'display', color: 'struct' }, inferGroup);

  // the grid shrinks into the gap between the panels: a picture of the file, not something to read
  const GS = 0.36;
  S.add(fx.xform(gridHolder, { y: CY - GY, s: GS, ox: GX, oy: GY }, { d: 1.0 }), 'b3~Training-0.4');
  gridHolder.setAttribute('data-audit', 'ignore');
  const gridB = { l: GX - tiles.w * GS / 2, r: GX + tiles.w * GS / 2, t: CY - tiles.h * GS / 2, b: CY + tiles.h * GS / 2 };
  const listLabel = S.text('70 billion weights', { x: GX, y: gridB.b + 44, size: 28, anchor: 'middle', color: 'muted', weight: 550 });
  S.add(fx.in(listLabel, { from: 'up', d: 0.5 }), 'b3~Training+0.4');
  S.add(fx.in([train, trainTitle], { from: 'left', d: 0.7, stagger: 0.1 }), 'b3~Training');

  // training feeds the list: amber work flows in while every value flickers, then settles
  const inArrow = S.arrow({ x1: P.lx + P.w + 14, y1: CY, x2: gridB.l - 14, y2: CY, color: 'faint', sw: 3, head: 14 });
  S.add(fx.drawArrow(inArrow, { d: 0.5 }), 'b3~Training+0.2');
  S.flow({ d: `M${P.lx + P.w - 40},${CY} L${gridB.l + 6},${CY}`, from: 'b3~Training+0.4', to: 'b3~Training+3.4', speed: 260, every: 0.16, size: 5, color: 'muted', tone: 'struct', glow: false });
  const flick = { p: 0 };
  const rnd = (i, k) => { let s = (i * 7919 + k * 104729) >>> 0; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 2000) / 1000 - 1; };
  const steps = 24;
  S.add(gsap.fromTo(flick, { p: 0 }, {
    p: 1, duration: 3.2, ease: 'none', immediateRender: false,
    onUpdate: () => {
      const k = Math.floor(flick.p * steps);
      tiles.cells.forEach((c, i) => {
        const v = flick.p >= 1 ? tiles.values[i] : Math.round((tiles.values[i] + rnd(i, k) * 0.08) * 100) / 100;
        c.label.textContent = ch01Fmt(v);
        c.label.setAttribute('fill', S.tone(v < 0 ? 'violet' : 'ink'));
      });
    },
  }), 'b3~Training+0.5');

  // three facts in each panel: icon, then label
  const FY = [P.y + 170, P.y + 280, P.y + 390];
  const fact = (x, cy, iconEls, label, color, parent) => {
    const g = S.g(null, parent);
    iconEls.forEach(e => g.appendChild(e));
    const t = S.text(label, { x, y: cy, size: 32, color, weight: 550 }, g);
    return { g, label: t };
  };
  const TX = P.lx + 62;                     // icon centre column in the training panel
  const stamp = S.g();
  S.rect({ x: TX - 32, y: FY[0] - 26, w: 64, h: 52, r: 12, stroke: 'muted', sw: 2.5, fill: '#0c1326' }, stamp);
  S.text('1×', { x: TX, y: FY[0] + 1, size: 28, anchor: 'middle', weight: 700, color: 'muted' }, stamp);
  const f1 = fact(TX + 58, FY[0], [stamp], 'done once', 'muted');
  const f2 = fact(TX + 58, FY[1], [S.icon('ph:calendar-dots-duotone', { x: TX, y: FY[1], size: 56, color: 'muted' })], 'over months', 'muted');
  const chips = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) chips.push(S.icon('ph:cpu-duotone', { x: TX - 26 + c * 17, y: FY[2] - 10 + r * 20, size: 20, color: 'muted' }));
  const f3 = fact(TX + 58, FY[2], chips, 'thousands of chips', 'muted');
  S.add(fx.in(f1.g, { from: 'up', d: 0.5 }), 'b3~once');
  S.add(fx.in(f2.g, { from: 'up', d: 0.5 }), 'b3~months');
  S.add(fx.in(f3.g, { from: 'up', d: 0.5 }), 'b3~thousands');

  // ---------------------------------------------------------------- b4: inference uses it, unchanged
  const trainLabels = [f1.label, f2.label, f3.label];
  S.add(fx.dim(trainLabels, { to: 0.3 }), 'b4~Inference');
  S.add(fx.dim(inArrow, { to: 0.3 }), 'b4~Inference');
  S.add(fx.in([infer, inferTitle], { from: 'right', d: 0.7, stagger: 0.1 }), 'b4~Inference');
  const outArrow = S.arrow({ x1: gridB.r + 14, y1: CY, x2: P.rx - 14, y2: CY, color: 'struct', sw: 3, head: 14 });
  S.add(fx.drawArrow(outArrow, { d: 0.5 }), 'b4~Inference+0.3');
  S.flow({ d: `M${gridB.r - 6},${CY} L${P.rx + 40},${CY}`, from: 'b4~using', to: 'b5~second', speed: 260, every: 0.2, size: 6, color: 'struct' });
  // the padlock snaps shut over the list, and the label says so
  const lockOpen = S.icon('ph:lock-simple-open-duotone', { x: GX, y: gridB.t - 44, size: 52, color: 'struct' });
  const lock = S.icon('ph:lock-simple-duotone', { x: GX, y: gridB.t - 44, size: 52, color: 'struct' });
  S.set(lock, { autoAlpha: 0 }, 0);
  S.add(fx.pop(lockOpen), 'b4~never-0.6');
  S.add(gsap.timeline().set(lockOpen, { autoAlpha: 0 }).fromTo(lock, { autoAlpha: 1, scale: 1.3, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.35, ease: 'back.out(3)' }), 'b4~never');
  S.add(gsap.fromTo(tiles.cells.map(c => c.bg), { attr: { 'stroke-opacity': 0.55 } }, { attr: { 'stroke-opacity': 1 }, duration: 0.25, yoyo: true, repeat: 1 }), 'b4~never');
  S.add(fx.swap(listLabel, 'fixed: never changes'), 'b4~never+0.1');

  const IX = P.rx + 62;
  const g1 = fact(IX + 58, FY[0], [S.icon('ph:timer-duotone', { x: IX, y: FY[0], size: 56, color: 'struct' })], 'milliseconds per token', 'ink', inferGroup);
  const g2 = fact(IX + 58, FY[1], [S.icon('ph:cpu-duotone', { x: IX, y: FY[1], size: 52, color: 'struct' })], 'one chip or a few', 'ink', inferGroup);
  const users = [0, 1, 2].map(i => S.icon('ph:user-circle-duotone', { x: IX - 24 + i * 28, y: FY[2] + 8, size: 32, color: 'struct' }));
  const g3 = fact(IX + 58, FY[2], users, 'every time anyone asks', 'ink', inferGroup);
  S.add(fx.in(g1.g, { from: 'up', d: 0.5 }), 'b4~milliseconds');
  S.add(fx.in(g2.g, { from: 'up', d: 0.5 }), 'b4~one');
  S.add(fx.in(g3.g, { from: 'up', d: 0.5 }), 'b4~time-0.2');
  // each user pops a small chat bubble in turn, on a slow loop
  const bubbles = users.map((u, i) => S.icon('ph:chat-circle-dots-duotone', { x: IX - 24 + i * 28 + 8, y: FY[2] - 26, size: 24, color: 'helps' }, inferGroup));
  S.set(bubbles, { autoAlpha: 0 }, 0);
  const loop = gsap.timeline({ repeat: 6 });
  bubbles.forEach((b, i) => loop.fromTo(b, { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 100%' }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.5)' }, i * 0.7)
    .to(b, { autoAlpha: 0, duration: 0.3 }, i * 0.7 + 1.1));
  S.add(loop, 'b4~time+0.3');

  // ---------------------------------------------------------------- b5: the film is about the second box
  S.add(fx.xform(inferGroup, { s: 1.04, ox: P.rx + P.w / 2, oy: CY }, { d: 0.8, ease: 'power2.out' }), 'b5~second');
  S.add(gsap.to(infer.bg, { attr: { 'stroke-opacity': 1 }, duration: 0.6 }), 'b5~second');
  S.add(fx.dim([train, trainTitle, f1.g, f2.g, f3.g, inArrow], { to: 0.25 }), 'b5~second');
  const finished = S.pill('finished before we begin', { x: P.lx + P.w / 2, y: P.y + P.h + 52, h: 46, size: 24, tone: 'neutral', style: 'outline' });
  S.add(fx.in(finished, { from: 'up', d: 0.5 }), 'b5~second+0.3');
  const take = S.takeaway('cost or speed? first ask: which box?', { tone: 'struct' });
  S.add(fx.in(take, { from: 'up', d: 0.6 }), 'b5~confusing+0.4');
});
