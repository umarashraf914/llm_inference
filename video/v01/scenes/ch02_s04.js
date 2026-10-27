/* ch02_s04 · every token reads every weight (fig 14)
   The chip cannot keep the weights, so for one conversation every token streams all 140 GB from the
   memory beside it. Hence: time per token = bytes to read ÷ bytes per second (bandwidth). */
V.scene('ch02_s04', S => {
  const { fx } = S;
  // the package (left) and the counters, later the spec sheet (right), as one group centred on the screen;
  // in b2, with nothing beside it, the package and its captions (pkgG) move to the centre, and back for b3
  const PK = { x: 660, y: 580, s: 1.2 };
  const pkgG = S.g();
  const gpu = S.gpu({ x: PK.x, y: PK.y, scale: PK.s, stacks: 3, labels: false }, pkgG);
  S.add(fx.in(gpu, { from: 'fade', d: 0.6 }), 0.1);
  const die = gpu.dieRect;
  const dieLbl = S.text('the chip · does the arithmetic', { x: PK.x, y: die.y + die.h + 40, size: 26, anchor: 'middle', color: 'compute', weight: 600 }, pkgG);
  const memLbl = S.text('memory beside the chip · 140 GB', { x: PK.x, y: gpu.t - 26, size: 28, anchor: 'middle', color: 'bytes', weight: 650 }, pkgG);
  S.add(fx.in([dieLbl, memLbl], { from: 'fade', d: 0.5 }), 0.5);

  // ---------------------------------------------------------------- b1: every token reads every weight
  // the stacks fill with coral weight tiles
  const fills = gpu.stacks.map(st => {
    const g = S.g(null, pkgG);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
      const w = (st.w - 24) / 6, h = (st.h - 20) / 4;
      S.rect({ x: st.x + 12 + c * w + 1, y: st.y + 10 + r * h + 1, w: w - 3, h: h - 3, r: 3, fill: 'url(#card-bytes)', stroke: 'bytes', sw: 1 }, g);
    }
    g.setAttribute('data-audit', 'ignore');
    return g;
  });
  S.set(fills, { autoAlpha: 0 }, 0);
  S.add(gsap.to(fills, { autoAlpha: 1, duration: 0.3, stagger: 0.08 }), 'b1~all seventy');
  // only a tenth of a gigabyte fits on the chip
  const tiny = S.rect({ x: die.x + 18, y: die.y + 29, w: 14, h: 14, r: 2, fill: 'compute' }, pkgG);
  const tinyTag = S.text('≈ 0.1 GB fits here', { x: die.x + 42, y: die.y + 37, size: 24, color: 'ink', weight: 600 }, pkgG);
  S.set(tiny, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(tiny, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, yoyo: true, repeat: 3 }), 'b1~cannot');
  S.add(fx.in(tinyTag, { from: 'left', d: 0.35 }), 'b1~cannot');
  S.add(fx.out(tinyTag, { d: 0.3 }), 'b1~every-0.3');
  // one conversation: a user, and the tokens coming back
  const user = S.icon('ph:user-circle-duotone', { x: 1210, y: 380, size: 64, color: 'struct' });
  S.add(fx.pop(user), 'b1~one');
  // three runs, each keyed to its words
  const RUNS = [[S.t('b1~every'), 1.2], [S.t('b1~hundred'), 0.8], [S.t('b1~from'), 0.6]];
  const bytes = S.counter({ x: 1610, y: 400, size: 46, value: 0, anchor: 'end', color: 'bytes', family: 'mono', weight: 650 });
  const bytesU = S.text('GB', { x: 1622, y: 402, size: 30, color: 'bytes', weight: 650 });
  const bytesL = S.text('bytes moved, this token', { x: 1610, y: 446, size: 24, anchor: 'end', color: 'muted', weight: 550 });
  const toks = S.counter({ x: 1610, y: 530, size: 46, value: 0, anchor: 'end', color: 'struct', family: 'mono', weight: 650 });
  const toksL = S.text('tokens', { x: 1610, y: 576, size: 24, anchor: 'end', color: 'muted', weight: 550 });
  S.add(fx.in([bytes, bytesU, bytesL, toks, toksL], { from: 'fade', d: 0.4 }), S.t('b1~every') - 0.3);
  const pills = [];
  RUNS.forEach(([t0, d], k) => {
    gpu.buses.forEach(b => S.flow({ d: b.__d, from: t0, to: t0 + d * 0.8, speed: 600 / d, every: 0.04, size: 6, color: 'bytes' }, pkgG));
    S.add(gsap.fromTo(gpu.die, { filter: 'none' }, { filter: 'url(#glow-compute)', duration: d * 0.12, yoyo: true, repeat: 5 }), t0 + 0.1);
    S.add(fx.count(bytes, 0, 140, { d, ease: 'none', fmt: v => String(Math.round(v)) }), t0);
    S.add(fx.count(toks, k, k + 1, { d: 0.15, fmt: v => String(Math.round(v)) }), t0 + d);
    const p = S.rect({ x: 1192, y: 440 + k * 46, w: 36, h: 32, r: 9, fill: 'url(#card-struct)', stroke: 'struct', sw: 2 });
    S.add(gsap.fromTo(p, { autoAlpha: 0, x: PK.x - 1210, y: PK.y - (456 + k * 46) }, { autoAlpha: 1, x: 0, y: 0, duration: 0.45, ease: 'power3.out' }), t0 + d);
    pills.push(p);
  });
  const rule = S.text('one conversation: all 140 GB, every token', { x: PK.x, y: 900, size: 30, anchor: 'middle', color: 'ink', weight: 650 }, pkgG);
  const later = S.text('shared reads, many users: later', { x: PK.x + 340, y: 940, size: 24, anchor: 'middle', color: 'muted', weight: 550 }, pkgG);
  S.add(fx.in(rule, { from: 'up', d: 0.4 }), 'b1>-0.2');
  S.add(fx.in(later, { from: 'up', d: 0.35 }), 'b1>+0.2');

  // ---------------------------------------------------------------- b2: the rule
  S.add(fx.out([bytes, bytesU, bytesL, toks, toksL, user, ...pills], { d: 0.4 }), 'b2');
  S.add(gsap.fromTo(pkgG, { x: 0 }, { x: 960 - PK.x, duration: 0.8, ease: 'power2.inOut', immediateRender: false }), S.t('b2') + 0.2);
  gpu.buses.forEach(b => S.flow({ d: b.__d, from: 'b2', to: 'end', speed: 300, every: 0.12, size: 5, color: 'bytes', opacity: 0.7 }, pkgG));
  const eq = S.equation([{ t: 'time per token', tone: 'ink' }, { t: '=', tone: 'muted' }, { t: 'bytes to read', tone: 'bytes' }, { t: '÷', tone: 'muted' }, { t: 'bytes per second', tone: 'bytes' }], { x: 960, y: 165, size: 46 });
  S.add(fx.in(eq.parts[0], { from: 'up', d: 0.4 }), 'b2~Time');
  S.add(fx.in(eq.parts[1], { from: 'up', d: 0.3 }), 'b2~is');
  S.add(fx.in(eq.parts[2], { from: 'up', d: 0.4 }), 'b2~bytes');
  S.add(fx.in(eq.parts[3], { from: 'up', d: 0.3 }), 'b2~divided');
  S.add(fx.in(eq.parts[4], { from: 'up', d: 0.4 }), 'b2~each');
  const bb = eq.parts[4].getBBox();
  const brk = S.bracket({ x1: bb.x, x2: bb.x + bb.width, y: bb.y + bb.height + 8, label: 'bandwidth', tone: 'bytes', size: 30 });
  S.add(fx.in(brk, { from: 'fade', d: 0.4 }), 'b2~bandwidth');
  S.add(fx.swap(memLbl, 'HBM · high bandwidth memory'), 'b2~high-0.1');
  S.add(fx.dim([dieLbl, rule, later], { to: 0.4 }), 'b2~high');

  // ---------------------------------------------------------------- b3: one of the two numbers; the other does not appear
  S.add(fx.out([rule, later], { d: 0.35 }), 'b3');
  S.add(gsap.fromTo(pkgG, { x: 960 - PK.x }, { x: 0, duration: 0.7, ease: 'power2.inOut', immediateRender: false }), 'b3');
  const sheet = libSpecSheet(S, { x: 1290, y: 380, w: 430, title: 'chip spec sheet', icon: 'doc', rowStyle: 'inline', size: 24,
    rows: [null, { label: 'operations per second', value: '?', tone: 'compute' }, null, { label: 'bytes per second', value: '?', tone: 'bytes' }, null] });
  S.set(sheet, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(sheet, { autoAlpha: 0, x: 80 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out' }), 'b3');
  S.add(sheet.glow(3, { part: 'row', tone: 'bytes' }), 'b3~Bandwidth');
  const r3 = sheet.rows[3];
  const conn = S.path({ d: `M${r3.x + 10},${r3.cy} C${r3.x - 140},${r3.cy} ${bb.x + bb.width / 2},${bb.y + 160} ${bb.x + bb.width / 2},${bb.y + bb.height + 64}`, stroke: 'bytes', sw: 2.5, dash: '6 6' });
  conn.setAttribute('data-audit', 'ignore');
  S.set(conn, { autoAlpha: 0 }, 0);
  S.add(gsap.set(conn, { autoAlpha: 1 }), 'b3~one');
  S.add(fx.draw(conn, { d: 0.6 }), 'b3~one');
  S.add(sheet.glow(1, { part: 'row', tone: 'compute' }), 'b3~other');
  // a white highlight sweeps the rule and finds no amber term
  const sweep = S.rect({ x: 0, y: 125, w: 70, h: 80, r: 10, fill: 'ink', fillOpacity: 0.16 });
  sweep.setAttribute('data-audit', 'ignore');
  S.set(sweep, { autoAlpha: 0 }, 0);
  const eqBox = eq.parts[0].getBBox();
  S.add(gsap.fromTo(sweep, { autoAlpha: 1, attr: { x: eqBox.x - 70 } }, { attr: { x: bb.x + bb.width }, duration: 0.8, ease: 'power1.inOut' }), 'b3~does');
  S.add(gsap.to(sweep, { autoAlpha: 0, duration: 0.2 }), S.t('b3~does') + 0.8);
  S.add(sheet.dimRows(1, 0.4), 'b3~appear');
  const notIn = S.text('not in the rule', { x: sheet.rows[1].x + 16, y: sheet.rows[1].cy + 34, size: 22, color: 'muted', weight: 550 });
  S.add(fx.in(notIn, { from: 'up', d: 0.35 }), 'b3~appear');
  const arith = S.text('arithmetic ≈ 0.1 ms · overlaps the reading (later)', { x: PK.x, y: 900, size: 26, anchor: 'middle', color: 'compute', weight: 600 }, pkgG);
  S.add(fx.in(arith, { from: 'up', d: 0.4 }), 'b3~appear');
});
