/* demo_charts · the charts family (lib/charts.js) in its main states.
   b1-b2  libRoofline: axes, the two ceilings, the ridge, regions; decode and prefill drop on; a bracket;
          decode slides up the slope and round the corner, readout counting; a probe at 10 ops/byte.
   b3     libScaleCompare: 140 GB vs 0.12 GB as rows, with a round lens; 30 ms vs 0.1 ms inline, tiled ×300.
   b4     libGrowthCurve: linear vs quadratic with the per-token strip, 'about equal' at 10, rescale to 10,000. */
V.scene('demo_charts', S => {
  const { fx } = S;

  // ---------------------------------------------------------------- b1-b2: the roofline (storyboard geometry)
  const roofHolder = S.g();
  const R = libRoofline(S, {}, roofHolder);
  S.add(R.drawAxes({ d: 0.8 }), 'b1');
  S.add(R.drawFlat({ d: 0.8 }), 'b1+0.6');
  S.add(R.drawSlope({ d: 0.7 }), 'b1+1.3');
  S.add(R.showRidge(), 'b1+1.9');
  S.add(R.showRegions(), 'b1+2.4');
  const dec = R.point(1, { label: 'decode', readout: true });
  const pre = R.point(2000, { label: 'prefill' });
  S.add(dec.in(), 'b1+2.8');
  S.add(pre.in(), 'b1+3.1');

  const br = R.bracket(1, 2000, { y: 878, label: '× 2,000' });
  S.add(br.in(), 'b2');
  S.add(br.out(), 'b2+0.9');
  S.add(pre.out(), 'b2+0.9');
  S.add(dec.moveTo(5000, { d: 1.9 }), 'b2+1.0');
  const pb = R.probe(50);
  S.add(pb.in(), 'b2+2.2');
  S.add(pb.settle(), 'b2+3.1');
  S.add(fx.out(roofHolder, { d: 0.3 }), 'b3-0.05');

  // ---------------------------------------------------------------- b3: scale compare, rows + lens, inline + tiles
  const sc = libScaleCompare(S, {
    x: 210, y: 250, w: 1400, items: [
      { value: 140, label: 'the model', text: '140 GB', tone: 'bytes' },
      { value: 0.12, label: 'on the chip', text: '0.12 GB', tone: 'compute' },
    ],
  });
  S.add(sc.in({ d: 0.9 }), 'b3+0.1');
  const lens = sc.magnify({ x: 560, y: 600, r: 110 });
  S.add(lens.open(), 'b3+0.8');

  const bud = libScaleCompare(S, {
    layout: 'inline', x: 210, y: 820, w: 1500, items: [
      { value: 30, tone: 'neutral' },
      { value: 0.1, tone: 'compute' },
    ],
  });
  const dim = bud.dimension(0, '30 ms per token');
  const ptr = bud.pointer(1, 'arithmetic: 0.1 ms', { tone: 'compute' });
  S.add(bud.in({ d: 0.8 }), 'b3+1.3');
  S.add(dim.in(), 'b3+1.6');
  S.add(ptr.in(), 'b3+1.9');
  S.add(bud.tile({ n: 300, d: 1.3, counter: { x: 1710, y: 760, size: 40, anchor: 'end', suffix: ' tokens' } }), 'b3+2.1');
  S.add(fx.out([sc, lens, bud, dim, ptr, bud.tiles, bud.tileCounter], { d: 0.3 }), 'b4-0.1');

  // ---------------------------------------------------------------- b4: two ways to grow
  const gc = libGrowthCurve(S, {
    x: 560, y: 260, w: 800, h: 440, xmax: 12, title: 'Two ways to grow', tag: 'schematic',
    xlabel: 'tokens', strip: { h: 70, label: 'per token' },
  });
  gc.steps('linear', { n: 12 });
  gc.steps('quadratic', { n: 12 });
  S.add(gc.drawAxes(), 'b4+0.05');
  S.add(gc.draw('linear', { d: 0.9 }), 'b4+0.3');
  S.add(gc.draw('quadratic', { d: 0.9 }), 'b4+0.8');
  const eq = gc.mark(10, { label: 'about equal' });
  S.add(eq.in(), 'b4+1.4');
  S.add(eq.out(), 'b4+1.85');
  S.add(gc.rescale({ xmax: 10000, d: 1.0 }), 'b4+2.2');
  const t1 = gc.tag('linear', '× 1,000'), t2 = gc.tag('quadratic', '× 1,000,000');
  S.add(t1.in(), 'b4+2.6');
  S.add(t2.in(), 'b4+2.7');
});
