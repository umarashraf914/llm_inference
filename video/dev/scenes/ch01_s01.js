V.scene('ch01_s01', S => {
  const { fx } = S;
  // ---- b1: a trained model is a file
  const head = S.heading('A trained model is a file', { y: 150, size: 60 });
  const file = S.g();
  const doc = S.icon('ph:file-duotone', { x: 960, y: 520, size: 260, color: 'struct' }, file);
  const fname = S.text('model.safetensors', { x: 960, y: 700, size: 34, family: 'mono', anchor: 'middle', color: 'ink' }, file);
  const fsize = S.text('140 GB', { x: 960, y: 748, size: 28, family: 'mono', anchor: 'middle', color: 'bytes' }, file);
  S.add(fx.in(head.titleEl, { from: 'up' }), 'b1');
  S.add(fx.pop(doc), 'b1~file');
  S.add(fx.in([fname, fsize], { from: 'up', stagger: 0.12 }), 'b1~file+0.25');

  // ---- b2: open it: nothing but numbers
  const vals = [0.13, -0.7, 0.02, 1.44, -0.3];
  const grid = S.grid({ x: 960 - (8 * 104 - 14) / 2, y: 300, rows: 5, cols: 8, cw: 90, ch: 58, gap: 14,
    tone: (r, c) => (vals[(r * 8 + c) % 5] < 0 ? 'violet' : 'struct'),
    values: Array.from({ length: 40 }, (_, i) => vals[i % 5]), fmt: v => (v > 0 ? '' : '') + v, size: 24 });
  S.add(fx.out(file, { to: 'up', d: 0.5 }), 'b2-0.2');
  S.add(gsap.fromTo(grid.cells, { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%' },
    { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)', stagger: { each: 0.025, from: 'center', grid: [5, 8] } }), 'b2+0.1');
  const nots = ['rules', 'instructions', 'text'].map((w, i) => {
    const g = S.g();
    S.icon('ph:x-circle-duotone', { x: 640 + i * 320 - 70, y: 730, size: 44, color: 'bytes' }, g);
    S.text(`no ${w}`, { x: 640 + i * 320 - 38, y: 731, size: 32, color: 'muted', weight: 550 }, g);
    return g;
  });
  S.add(fx.in(nots[0], { from: 'up' }), 'b2~rules');
  S.add(fx.in(nots[1], { from: 'up' }), 'b2~instructions');
  S.add(fx.in(nots[2], { from: 'up' }), 'b2~text');
  // number line from -1 to +1 with the forty values on it
  const nl = S.g();
  const X = v => 560 + (v + 1) / 2 * 800;
  S.line({ x1: 520, y1: 800, x2: 1400, y2: 800, stroke: 'faint', sw: 3 }, nl);
  [-1, 0, 1].forEach(v => {
    S.line({ x1: X(v), y1: 788, x2: X(v), y2: 812, stroke: 'muted', sw: 3 }, nl);
    S.text(v > 0 ? '+1' : String(v), { x: X(v), y: 846, size: 26, family: 'mono', anchor: 'middle', color: 'muted' }, nl);
  });
  const dots = vals.map(v => S.circle({ x: X(Math.max(-1, Math.min(1, v))), y: 800, r: 9, fill: v < 0 ? 'violet' : 'struct' }, nl));
  S.add(fx.out(nots, { d: 0.4 }), 'b2~numbers');
  S.add(fx.in(nl, { from: 'fade', d: 0.6 }), 'b2~between');
  S.add(fx.pop(dots, { stagger: 0.08 }), 'b2~minus');

  // ---- b3: forty drawn, seventy billion in a large model
  const counter = S.counter({ x: 960, y: 900, size: 64, anchor: 'middle', value: 40, color: 'compute', fmt: S.fmt.int });
  const unit = S.text('weights', { x: 960, y: 960, size: 30, anchor: 'middle', color: 'muted' });
  S.add(fx.out(nl, { d: 0.4 }), 'b3-0.3');
  S.add(fx.in([counter, unit], { from: 'up' }), 'b3~Forty');
  S.add(fx.count(counter, 40, 70e9, { d: 2.2, ease: 'expo.inOut' }), 'b3~seventy');
  S.add(fx.pulse(grid.g, { scale: 0.96, d: 0.8 }), 'b3~seventy+1');

  // ---- b4: one tile lifts out: weight = parameter
  const one = grid.at(1, 3);
  S.add(fx.dim(grid.cells.filter(c => c !== one), { to: 0.18 }), 'b4');
  S.add(fx.move(one, { y: -40, scale: 1.6, d: 0.9 }), 'b4');
  const eq = S.equation([{ t: 'parameter', tone: 'struct' }, { t: '=', tone: 'muted' }, { t: 'weight', tone: 'struct' }], { x: 960, y: 760, size: 46 });
  S.add(fx.out([counter, unit], { d: 0.3 }), 'b4-0.1');
  S.add(fx.in(eq.parts, { from: 'up', stagger: 0.18 }), 'b4~parameter');
});
