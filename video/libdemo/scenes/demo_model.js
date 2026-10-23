/* demo_model · the model family (lib/model.js) in its main states.
   b1 vectors · b2 matrix × vector · b3 the layer stack · b4 attention (arcs + score grid). */
V.scene('demo_model', S => {
  const { fx } = S;

  // ---------------------------------------------------------------- b1: vectors
  const v8 = libVector(S, { values: ['0.4', '-1.2', '0.0', '0.9', '0.3', '-0.5', '1.1', '0.2'], x: 760, y: 250, label: 'x' });
  S.add(v8.pop({ stagger: 0.12 }), 'b1-0.3');
  const emb = libVector(S, { values: [0.12, -0.83, 0.41, 0.05, -0.61, 0.27], length: 8192, index: 'ends', lengthLabel: '8,192 numbers', x: 760, y: 500, label: 'cat' });
  S.add(emb.pop({ stagger: 0.07 }), 'b1+0.4');
  const bar = libVector(S, { style: 'heat', n: 36, seed: 4, x: 760, y: 730, label: 'cat', lengthLabel: 'one token, as numbers', lengthPos: 'below' });
  S.add(bar.pop({ stagger: 0.015 }), 'b1+0.8');
  const col = libVector(S, { values: [null, null, null, null], dir: 'col', x: 1600, y: 500, label: 'out' });
  S.add(col.pop({ stagger: 0.06 }), 'b1+0.2');
  S.add(col.set([0, 3], [0.5, -0.24, 1.3, 0.07], { stagger: 0.25 }), 'b1+1.4');
  S.add(v8.flash('all', { stagger: 0.07 }), 'b1+1.6');
  S.add(bar.reshade({ seed: 9, gain: 1.35 }, { stagger: 0.012 }), 'b1+2.2');
  S.add(fx.out([v8, emb, bar, col], { d: 0.35 }), 'b2-0.45');

  // ---------------------------------------------------------------- b2: matrix × vector
  const W = [
    [0.5, 0.25, -0.7, '1.0', '-1.0'],
    [0.3, -0.5, 0.8, 0.2, 0.6],
    [-0.4, 0.1, 0.9, -0.6, 0.5],
    [0.7, 0.2, -0.3, 0.4, -0.8],
  ];
  const mv = libMatVec(S, {
    x: 720, y: 330, W, input: ['0.4', '-1.2', '0.0', '0.9', '0.3'], inputAt: 'left',
    labels: { input: 'in', output: 'out', W: '4 × 5 matrix' }, counters: true,
  });
  S.add(mv.in(), 'b2-0.05');
  S.add(mv.layInput({ d: 0.7 }), 'b2+0.55');
  const r0 = mv.row(0, { speed: 3.2 });
  S.add(r0, 'b2+1.2');
  S.add(mv.pulse([1, 2, 3], { speed: 5 }), 4.5 + 1.2 + r0.duration() + 0.05);
  S.add(fx.out(mv, { d: 0.35 }), 'b3+0.15');

  // ---------------------------------------------------------------- b3: the layer stack
  const stack = libLayerStack(S, { x: 700, y: 900, n: 80, shown: 4, h: 600, w: 400, texture: true, numbers: [1, 40, 80], label: '80 layers', hidden: true, detail: { x: 1180, y: 330, w: 460, h: 340 } });
  const cnt = S.counter({ x: 1250, y: 236, size: 44, value: 4, anchor: 'end', color: 'ink' });
  const cntL = S.text('layers', { x: 1268, y: 238, size: 30, color: 'muted', weight: 550 });
  S.add(stack.build({ d: 0.6 }), 'b3+0.45');
  S.add(fx.in([cnt, cntL], { from: 'left', d: 0.5 }), 'b3+0.5');
  S.add(stack.grow(80, { d: 0.9, counter: cnt }), 'b3+0.95');
  const up = stack.climb(null, { d: 0.8 });
  S.add(up, 'b3+1.85');
  S.add(fx.out([cnt, cntL, up.el], { d: 0.3 }), 'b3+2.6');
  S.add(stack.open(40, { d: 1.0 }), 'b3+2.65');
  S.add(fx.out(stack, { d: 0.35 }), 'b4-0.25');

  // ---------------------------------------------------------------- b4: attention
  const at = libAttention(S, {
    x: 640, y: 560, tokens: ['the', 'cat', 'sat', 'down', 'it', 'was', 'tired'], query: 4,
    weights: [0.05, 0.62, 0.28, 0.05], bars: true, queryLabel: 'asks', size: 30,
  });
  S.add(at.in({ stagger: 0.06 }), 'b4-0.1');
  S.add(at.ask({ d: 0.5 }), 'b4+0.4');
  S.add(at.weigh(null, { d: 0.5 }), 'b4+0.9');
  S.add(at.blend({ d: 0.8, into: 'new' }), 'b4+1.45');
  S.add(at.mask({ d: 0.4 }), 'b4+2.1');
  S.add(at.probe(6, { d: 0.8 }), 'b4+2.4');
  const sg = libAttentionGrid(S, { x: 1500, y: 600, tokens: ['the', 'cat', 'sat', 'down', 'it'], cw: 84, ch: 58, rowTitle: 'asks', colTitle: 'is asked', hidden: true });
  S.add(sg.in({ d: 0.5 }), 'b4+0.1');
  S.add(sg.fill({ stagger: 0.02 }), 'b4+0.7');
  S.add(sg.mask({ d: 0.6 }), 'b4+2.0');
});
