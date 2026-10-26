/* ch20_s04 · why crossbar switches beat pairwise meshes (fig 112)
   Movement 1 (b1): Wiring every pair directly becomes impossible as clusters grow.
   Movement 2 (b2): Combinatorial explosion: n(n - 1) / 2 links (6, 28, 2556 links).
   Movement 3 (b3): 18-link budget split 7 ways: bandwidth severely fragmented.
   Movement 4 (b4): Crossbar switch provides full-speed all-to-all communication. */

V.scene('ch20_s04', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Why crossbar switches beat pairwise meshes', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Topology Comparison Visual
  const top = ch20TopologyCompare(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('crossbar switches provide full-speed all-to-all communication without combinatorial wiring', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([top.leftCard, top.leftTitle, top.leftSub, top.leftPill], { autoAlpha: 0 });
  top.lElements.forEach(el => S.set([el.box, el.lt], { autoAlpha: 0 }));

  S.set([top.rightCard, top.rightTitle, top.rightSub, top.rightPill], { autoAlpha: 0 });
  top.rElements.forEach(el => S.set([el.box, el.rt], { autoAlpha: 0 }));

  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Pairwise wiring problem
  S.add(fx.in([top.leftCard, top.leftTitle, top.leftSub], { from: 'scale', d: 0.4 }), 'b1~Wiring-0.2');

  // ---------------------------------------------------------------- b2: n(n-1)/2 formula & numbers
  top.lElements.slice(0, 3).forEach((el, idx) => {
    S.add(fx.in(el.box, { from: 'scale', d: 0.35 }), `b2~Connecting:-${0.2 - idx * 0.1}`);
    S.add(fx.in(el.lt, { from: 'fade', d: 0.35 }), `b2~Connecting:-${0.2 - idx * 0.1}`);
  });
  S.add(fx.in(top.leftPill, { from: 'up', d: 0.4 }), 'b2~seventy-two');

  // ---------------------------------------------------------------- b3: H100 link budget split 7 ways
  const lastL = top.lElements[3];
  S.add(fx.in(lastL.box, { from: 'scale', d: 0.35 }), 'b3~budget-0.2');
  S.add(fx.in(lastL.lt, { from: 'fade', d: 0.35 }), 'b3~budget-0.2');
  S.add(fx.pulse([top.leftCard, top.leftPill], { scale: 1.04, d: 0.4 }), 'b3~splits');

  // ---------------------------------------------------------------- b4: Crossbar switch linear solution
  S.add(fx.in([top.rightCard, top.rightTitle], { from: 'scale', d: 0.4 }), 'b4~crossbar-0.2');
  S.add(fx.in(top.rightSub, { from: 'fade', d: 0.35 }), 'b4~crossbar');
  top.rElements.forEach((el, idx) => {
    S.add(fx.in(el.box, { from: 'scale', d: 0.35 }), `b4~switch:-${0.2 - idx * 0.1}`);
    S.add(fx.in(el.rt, { from: 'fade', d: 0.35 }), `b4~switch:-${0.2 - idx * 0.1}`);
  });
  S.add(fx.in(top.rightPill, { from: 'up', d: 0.4 }), 'b4~linearly.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
