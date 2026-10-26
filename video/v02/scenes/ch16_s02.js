/* ch16_s02 · prefill versus decode on the roofline (fig 86)
   Movement 1 (b1): Language model phases plotted on the H100 roofline.
   Movement 2 (b2): Decode: 1 token at a time -> 1 op/byte (starved on memory roof).
   Movement 3 (b3): Prefill: thousands of tokens -> ~2,000 op/byte (saturates compute ceiling).
   Movement 4 (b4): Same model and hardware live on opposite sides of the ridge. */

V.scene('ch16_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Prefill versus decode on the roofline', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Roofline visual
  const rf = ch16RooflinePlot(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('decode lives far left of the ridge; prefill lives far to the right', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([rf.card, rf.title, rf.gridBox, rf.slantedPath, rf.flatPath, rf.memRoofLbl, rf.compRoofLbl, rf.ridgeLine, rf.ridgeBadge, rf.footer], { autoAlpha: 0 });
  S.set([rf.decodeMarker.dot, rf.decodeMarker.lbl, rf.prefillMarker.dot, rf.prefillMarker.lbl], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Roofline in view
  S.add(fx.in([rf.card, rf.title, rf.gridBox], { from: 'scale', d: 0.5 }), 'b1~phases-0.2');
  S.add(fx.in([rf.slantedPath, rf.flatPath, rf.memRoofLbl, rf.compRoofLbl, rf.ridgeLine, rf.ridgeBadge], { from: 'fade', d: 0.4 }), 'b1~roofline.');

  // ---------------------------------------------------------------- b2: Decode lands at 1 op/byte
  S.add(fx.in(rf.decodeMarker.dot, { from: 'scale', d: 0.4 }), 'b2~Decode-0.2');
  S.add(fx.in(rf.decodeMarker.lbl, { from: 'fade', d: 0.4 }), 'b2~token');
  S.add(fx.pulse([rf.decodeMarker.dot, rf.decodeMarker.lbl], { scale: 1.15, d: 0.4 }), 'b2~operation');

  // ---------------------------------------------------------------- b3: Prefill lands at ~2,000 op/byte
  S.add(fx.in(rf.prefillMarker.dot, { from: 'scale', d: 0.4 }), 'b3~Prefill-0.2');
  S.add(fx.in(rf.prefillMarker.lbl, { from: 'fade', d: 0.4 }), 'b3~prompt');
  S.add(fx.pulse([rf.prefillMarker.dot, rf.prefillMarker.lbl], { scale: 1.15, d: 0.4 }), 'b3~thousand');

  // ---------------------------------------------------------------- b4: Opposite sides of the ridge
  S.add(fx.pulse([rf.decodeMarker.dot, rf.prefillMarker.dot], { scale: 1.1, stagger: 0.1, d: 0.4 }), 'b4~opposite');
  S.add(fx.in(rf.footer, { from: 'up', d: 0.4 }), 'b4~units.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
