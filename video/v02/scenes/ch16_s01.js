/* ch16_s01 · attainable performance and the roofline (figs 84, 85)
   Movement 1 (b1): Roofline model gives absolute attainable performance ceiling.
   Movement 2 (b2): Below ridge: slanted memory roof binds (rate = 3.35 TB/s * intensity).
   Movement 3 (b3): Above ridge: flat compute ceiling binds (989.4 TFLOP/s peak).
   Movement 4 (b4): Ridge point = 989.4 / 3.352 = 295 operations per byte. */

V.scene('ch16_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Attainable performance and the roofline', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Roofline visual
  const rf = ch16RooflinePlot(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('below 295 you wait on memory; above 295 you wait on arithmetic', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([rf.card, rf.title, rf.gridBox, rf.slantedPath, rf.flatPath], { autoAlpha: 0 });
  S.set([rf.memRoofLbl, rf.compRoofLbl, rf.ridgeLine, rf.ridgeBadge, rf.footer], { autoAlpha: 0 });
  S.set([rf.decodeMarker.dot, rf.decodeMarker.lbl, rf.prefillMarker.dot, rf.prefillMarker.lbl], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Log-log coordinate grid
  S.add(fx.in([rf.card, rf.title], { from: 'scale', d: 0.5 }), 'b1~performance-0.2');
  S.add(fx.in(rf.gridBox, { from: 'fade', d: 0.4 }), 'b1~ceiling');

  // ---------------------------------------------------------------- b2: Slanted memory roof
  S.add(fx.draw(rf.slantedPath, { d: 0.5 }), 'b2~slanted-0.2');
  S.add(fx.in(rf.memRoofLbl, { from: 'fade', d: 0.4 }), 'b2~bandwidth');
  S.add(fx.pulse(rf.memRoofLbl, { scale: 1.04, d: 0.4 }), 'b2~intensity.');

  // ---------------------------------------------------------------- b3: Flat compute ceiling (989.4 TFLOP/s)
  S.add(fx.draw(rf.flatPath, { d: 0.5 }), 'b3~flat-0.2');
  S.add(fx.in(rf.compRoofLbl, { from: 'fade', d: 0.4 }), 'b3~eighty-nine');
  S.add(fx.pulse(rf.compRoofLbl, { scale: 1.04, d: 0.4 }), 'b3~second.');

  // ---------------------------------------------------------------- b4: The Ridge = 295 ops/byte
  S.add(fx.draw(rf.ridgeLine, { d: 0.4 }), 'b4~inflection-0.2');
  S.add(fx.in(rf.ridgeBadge, { from: 'scale', d: 0.4 }), 'b4~ninety-five');
  S.add(fx.pulse(rf.ridgeBadge, { scale: 1.08, d: 0.4 }), 'b4~byte.');
  S.add(fx.in(rf.footer, { from: 'up', d: 0.4 }), 'b4~byte.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
