/* ch16_s01 · attainable performance and the roofline (figs 84, 85)
   Movement 1 (b1): Roofline model gives absolute attainable performance ceiling.
   Movement 2 (b2): Below ridge: slanted memory roof binds (rate = 3.352 TB/s * intensity).
   Movement 3 (b3): Above ridge: flat compute ceiling binds (989.4 TFLOP/s peak).
   Movement 4 (b4): Ridge point = 989.4 / 3.352 = 295 operations per byte. */

V.scene('ch16_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('attainable performance and the roofline', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Roofline visual using libRoofline
  const R = ch16Roofline(S, {
    grid: false,
    show: { roof: false, ceilings: false, regions: false, ridge: false, peakTag: false, slopeLabel: false }
  });

  // Upper bound pill
  const upperPill = S.pill('ceiling, not prediction', {
    x: 670, y: 380, h: 38, tone: 'struct', size: 20, weight: 700, style: 'solid'
  });

  // Formula badge for ridge calculation
  const formulaPill = S.pill('989.4 T ÷ 3.352 TB/s = 295 op/B', {
    x: 1370, y: 380, h: 38, tone: 'struct', size: 20, weight: 700, style: 'solid'
  });

  // Concluding Takeaway band
  const takeaway = S.takeaway('below 295 you wait on memory; above 295 you wait on arithmetic', {
    tone: 'struct'
  });

  // Initial states
  S.set([upperPill, formulaPill, takeaway], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Log-log coordinate axes
  S.add(R.drawAxes({ d: 0.8 }), 'b1~Attainable-0.2');
  S.add(fx.in(upperPill, { from: 'fade', d: 0.5 }), 'b1~prediction');

  // ---------------------------------------------------------------- b2: Slanted memory roof
  S.add(R.drawSlope({ to: 'ridge', d: 0.8 }), 'b2~slanted-0.2');
  S.add(R.showRegions({ which: 'memory', d: 0.6 }), 'b2~memory');
  S.add(R.tagSlope({ d: 0.4 }), 'b2~bandwidth');

  // ---------------------------------------------------------------- b3: Flat compute ceiling (989.4 TFLOP/s)
  S.add(R.drawFlat({ d: 0.8 }), 'b3~flat-0.2');
  S.add(R.showRegions({ which: 'compute', d: 0.6 }), 'b3~tensor');
  S.add(R.tagPeak({ d: 0.4 }), 'b3~peak');

  // ---------------------------------------------------------------- b4: The Ridge = 295 ops/byte
  S.add(R.showRidge({ d: 0.7 }), 'b4~inflection-0.2');
  S.add(fx.in(formulaPill, { from: 'fade', d: 0.5 }), 'b4~divided');
  S.add(fx.pulse(formulaPill, { scale: 1.05, d: 0.4 }), 'b4~two');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
