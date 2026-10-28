/* ch19_s02 · range versus precision trade-off (figs 100, 101)
   Movement 1 (b1): Range and precision bought separately.
   Movement 2 (b2): Exponent = magnitude range; Fraction = fine steps.
   Movement 3 (b3): FP16: 10 fraction, 5 exponent bits (fine steps, narrow range).
   Movement 4 (b4): BF16: 8 exponent, 7 fraction bits (vast range, coarse steps). */

V.scene('ch19_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('range versus precision trade-off', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Format comparison visual
  const fc = ch19FormatComparison(S, { cx: GX, cy: 500 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('BF16 preserves all 8 exponent bits: FP32 dynamic range with coarser precision', {
    tone: 'compute'
  });

  // Initial states
  S.set([fc.bg, fc.title, fc.footer, takeaway], { autoAlpha: 0 });
  fc.rowEls.forEach(r => {
    S.set(r.rc, { autoAlpha: 0 });
    S.set([r.fn, r.fb, r.fr], { autoAlpha: 0 });
  });

  // ---------------------------------------------------------------- b1: Fixed bit budget
  S.add(fx.in([fc.bg, fc.title], { from: 'up', d: 0.5 }), 'b1~Range-0.2');

  // ---------------------------------------------------------------- b2: FP32 baseline
  S.add(fx.in(fc.rowEls[0].rc, { from: 'fade', d: 0.4 }), 'b2~exponent-0.2');
  S.add(fx.in([fc.rowEls[0].fn, fc.rowEls[0].fb, fc.rowEls[0].fr], { from: 'fade', d: 0.4 }), 'b2~exponent');

  // ---------------------------------------------------------------- b3: FP16 (10 fraction, 5 exponent)
  S.add(fx.in(fc.rowEls[1].rc, { from: 'fade', d: 0.4 }), 'b3~Standard-0.2');
  S.add(fx.in([fc.rowEls[1].fn, fc.rowEls[1].fb, fc.rowEls[1].fr], { from: 'fade', d: 0.4 }), 'b3~Standard');
  S.add(fx.pulse([fc.rowEls[1].rc, fc.rowEls[1].fb], { scale: 1.03, d: 0.4 }), 'b3~narrow');

  // ---------------------------------------------------------------- b4: BF16 (8 exponent, 7 fraction)
  S.add(fx.in(fc.rowEls[2].rc, { from: 'fade', d: 0.4 }), 'b4~float-0.2');
  S.add(fx.in([fc.rowEls[2].fn, fc.rowEls[2].fb, fc.rowEls[2].fr], { from: 'fade', d: 0.4 }), 'b4~float');
  S.add(fx.pulse([fc.rowEls[2].rc, fc.rowEls[2].fr], { scale: 1.03, d: 0.4 }), 'b4~immense');
  S.add(fx.in(fc.footer, { from: 'up', d: 0.4 }), 'b4~number.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
