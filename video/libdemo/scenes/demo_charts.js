/* TEMPORARY test 2 (restored to the real demo afterwards). */
V.scene('demo_charts', S => {
  const { fx } = S;
  // b1-b2: ch00_s02 — 30 ms bar drawn from the centre, inset ×20 with a '1 ms' ruler, grey fill, inside label, tiles
  const A = libScaleCompare(S, { layout: 'inline', x: 210, y: 640, w: 1500, h: 80, items: [{ value: 30, tone: 'neutral' }, { value: 0.1, tone: 'compute' }] });
  const dim = A.dimension(0, '≈ 30 ms per token', { gap: 70 });
  S.add(A.in({ from: 'center', d: 0.8 }), 0.2);
  S.add(dim.in(), 0.4);
  const ins = A.magnify({ shape: 'inset', window: [0, 1], x: 460, y: 250, w: 1000, h: 170, tag: '×20', ruler: '1 ms' });
  S.add(ins.open(), 1.0);
  S.add(ins.close(), 2.6);
  const ptr = A.pointer(1, 'all the arithmetic', { tone: 'compute' });
  S.add(ptr.in(), 3.2);
  S.add(fx.swap(ptr.label, 'arithmetic: under 1%'), 4.0);
  S.add(A.restyle(0, 'grey', { d: 0.6 }), 4.6);
  const inside = A.tag(0, 'something else: over 99%', { side: 'center' });
  S.add(inside.in(), 5.0);
  S.add(inside.out({ d: 0.3 }), 5.6);
  S.add(A.tile({ n: 300, d: 1.6, counter: { x: 960, y: 560, size: 48 } }), 5.6);
  S.add(fx.out([A, dim, ptr, A.tiles, A.tileCounter], { d: 0.25 }), 8.1);

  // b3a: ch18_s01 — coral 30 ms with its sliver, '× 300' tag; trim to 29.2 and widen to 0.14, the dimension follows
  const B = libScaleCompare(S, { layout: 'inline', x: 210, y: 200, w: 1500, h: 56, items: [{ value: 30, tone: 'bytes', style: 'solid' }, { value: 0.1, tone: 'compute' }] });
  const bd = B.dimension(0, '30 ms per token');
  const bt = B.tag(0, '× 300', { tone: 'ink' });
  const bp = B.pointer(1, '0.1 ms arithmetic', { tone: 'compute' });
  S.set([B, bd, bt, bp], { autoAlpha: 0 }, 0);
  S.add(gsap.to([B, bd, bt, bp], { autoAlpha: 1, duration: 0.2 }), 8.3);
  S.add(B.grow(1, 0.14, { d: 0.4 }), 9.2);
  S.add(B.grow(0, 29.2, { d: 0.4 }), 9.6);

  // b3b: ch03_s09 — 80,000 of a 200,000 window (track), 3,200 under it, a tag
  const T = libScaleCompare(S, { x: 160, y: 480, w: 1600, h: 50, gap: 60, max: 200000, items: [
    { value: 80000, label: 'all forty in full', text: '80,000', tone: 'struct', track: true },
    { value: 3200, label: 'catalogue + one skill', text: '3,200', tone: 'helps' }] });
  S.set(T, { autoAlpha: 0 }, 0);
  S.add(gsap.to(T, { autoAlpha: 1, duration: 0.2 }), 8.3);
  const tb = T.tag(1, '25× smaller', { tone: 'helps' });
  S.add(tb.in(), 9.0);
  S.add(fx.out([B, bd, bt, bp, T, tb], { d: 0.25 }), 12.1);

  // b4: toy chips (ch11_s06): '× 2' span at intensity 1, '× 4.7' arrow, ridge tag flip, deeper tint
  const R = libRoofline(S, { x: 1100, y: 300, w: 700, h: 560, xmin: 0.6, xmax: 200, ymin: 10, ymax: 2000, peak: 1000, bw: 100,
    xtitle: 'ops per byte (log)', ytitle: 'ops per second (log)', ridgeTag: '?', show: { regions: true, ridge: true }, regionLabels: ['memory', 'compute'] });
  R.addRoof({ peak: 500, bw: 50, sw: 2.5, opacity: 0.6 });
  S.set(R, { autoAlpha: 0 }, 0);
  S.add(gsap.to(R, { autoAlpha: 1, duration: 0.2 }), 12.4);
  const sp = R.span(1, 50, 100, { label: '× 2' });
  S.add(sp.in(), 12.8);
  const ar = R.bracket(10, 47, { style: 'arrow', y: 820, label: '× 4.7' });
  S.add(ar.in(), 13.3);
  S.add(R.ridgeTagTo('10'), 14.0);
  S.add(R.tint('memory', 2.5), 14.5);
  // and the H100 roofline, compact, on the left: decode with a y guide
  const H = libRoofline(S, { x: 200, y: 360, w: 640, h: 420, xmin: 0.5, xmax: 1e4, ymin: 1, ymax: 1500, xtitle: 'ops per byte', ytitle: 'trillion ops/s', show: { ridge: true } });
  const dd = H.point(1, { label: 'decode' });
  S.set(H, { autoAlpha: 0 }, 0);
  S.add(gsap.to(H, { autoAlpha: 1, duration: 0.2 }), 12.4);
  const gy = dd.guide('y', { tag: '3.35' });
  S.add(gy.in(), 13.0);
});
