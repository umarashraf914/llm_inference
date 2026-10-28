/* ch20_s04 · why crossbar switches beat pairwise meshes (fig 112)
   Movement 1 (b1): Wiring every pair directly becomes impossible as clusters grow.
   Movement 2 (b2): Combinatorial explosion: n(n - 1) / 2 links (6, 28, 2556 links).
   Movement 3 (b3): 18-link budget split 7 ways: bandwidth severely fragmented.
   Movement 4 (b4): Crossbar switch provides full-speed all-to-all communication. */

V.scene('ch20_s04', S => {
  const { fx } = S;

  // Heading
  const heading = S.heading('why crossbar switches beat pairwise meshes', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Topology Comparison Visual (Atlas Fig 112)
  const top = ch20TopologyCompare(S, { cx: 960, cy: 510 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('crossbar switches provide full-speed all-to-all communication without combinatorial wiring', {
    tone: 'helps'
  });

  // Initial states
  S.set([top.leftBg, top.leftTitle, top.leftSub, top.bPanel1, top.m1, top.m2, top.m3, top.m4, top.leftPill], { autoAlpha: 0 });
  top.meshLines.forEach(l => S.set(l, { autoAlpha: 0 }));
  top.meshNodes.forEach(n => S.set([n.circle, n.num], { autoAlpha: 0 }));

  S.set([top.rightBg, top.rightTitle, top.rightSub, top.hubCircle, top.hubLbl, top.bPanel2, top.s1, top.s2, top.s3, top.s4, top.rightPill], { autoAlpha: 0 });
  top.swLines.forEach(l => S.set(l, { autoAlpha: 0 }));
  top.swNodes.forEach(n => S.set([n.circle, n.num], { autoAlpha: 0 }));

  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Pairwise wiring problem
  S.add(fx.in([top.leftBg, top.leftTitle, top.leftSub], { from: 'fade', d: 0.4 }), 'b1~Wiring-0.2');
  top.meshNodes.forEach((n, idx) => {
    S.add(fx.in([n.circle, n.num], { from: 'fade', d: 0.35 }), `b1~Wiring:-${0.2 - idx * 0.04}`);
  });

  // ---------------------------------------------------------------- b2: n(n-1)/2 formula & numbers
  top.meshLines.forEach((l, idx) => {
    S.add(fx.in(l, { from: 'fade', d: 0.25 }), `b2~Connecting:-${0.2 - idx * 0.01}`);
  });
  S.add(fx.in([top.bPanel1, top.m1, top.m2], { from: 'fade', d: 0.35 }), 'b2~Connecting');
  S.add(fx.in(top.leftPill, { from: 'up', d: 0.4 }), 'b2~seventy-two');

  // ---------------------------------------------------------------- b3: H100 link budget split 7 ways
  S.add(fx.in([top.m3, top.m4], { from: 'fade', d: 0.35 }), 'b3~budget-0.2');
  S.add(fx.pulse([top.leftBg, top.leftPill], { scale: 1.02, d: 0.4 }), 'b3~splits');

  // ---------------------------------------------------------------- b4: Crossbar switch linear solution
  S.add(fx.in([top.rightBg, top.rightTitle, top.rightSub, top.hubCircle, top.hubLbl], { from: 'fade', d: 0.4 }), 'b4~crossbar-0.2');
  top.swNodes.forEach((n, idx) => {
    S.add(fx.in([n.circle, n.num], { from: 'fade', d: 0.35 }), `b4~crossbar:-${0.2 - idx * 0.04}`);
  });
  top.swLines.forEach((l, idx) => {
    S.add(fx.in(l, { from: 'fade', d: 0.35 }), `b4~switch:-${0.2 - idx * 0.04}`);
  });
  S.add(fx.in([top.bPanel2, top.s1, top.s2, top.s3, top.s4, top.rightPill], { from: 'fade', d: 0.4 }), 'b4~linearly.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
