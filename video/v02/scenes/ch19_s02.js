/* ch19_s02 · the trade-off between range and precision (figs 100, 101)
   Movement 1 (b1): Range and precision are bought separately from a fixed bit budget.
   Movement 2 (b2): Exponent bits buy dynamic range; fraction bits buy step precision.
   Movement 3 (b3): FP16: 5 exponent, 10 fraction (fine steps, narrow range).
   Movement 4 (b4): BF16: 8 exponent, 7 fraction (FP32 range, coarse steps). */

V.scene('ch19_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('The trade-off between range and precision', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Format comparison
  const fc = ch19FormatComparison(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('BF16 trades precision for range by preserving all 8 exponent bits', {
    x: GX, y: 990, h: 48, tone: 'compute', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([fc.card, fc.title, fc.footer], { autoAlpha: 0 });
  fc.rowEls.forEach(r => {
    S.set(r.rc, { autoAlpha: 0 });
    S.set([r.fn, r.fb, r.fr], { autoAlpha: 0 });
  });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Fixed budget seesaw
  S.add(fx.in([fc.card, fc.title], { from: 'scale', d: 0.5 }), 'b1~Range-0.2');
  S.add(fx.in(fc.rowEls[0].rc, { from: 'scale', d: 0.4 }), 'b1~budget-0.2');
  S.add(fx.in([fc.rowEls[0].fn, fc.rowEls[0].fb, fc.rowEls[0].fr], { from: 'fade', d: 0.4 }), 'b1~budget');

  // ---------------------------------------------------------------- b2: Exponent vs Fraction roles
  S.add(fx.pulse(fc.rowEls[0].fb, { scale: 1.05, d: 0.4 }), 'b2~exponent');

  // ---------------------------------------------------------------- b3: FP16 (5 exp, 10 mantissa)
  S.add(fx.in(fc.rowEls[1].rc, { from: 'scale', d: 0.4 }), 'b3~Standard-0.2');
  S.add(fx.in([fc.rowEls[1].fn, fc.rowEls[1].fb, fc.rowEls[1].fr], { from: 'fade', d: 0.4 }), 'b3~sixteen-bit');
  S.add(fx.pulse(fc.rowEls[1].rc, { scale: 1.04, d: 0.4 }), 'b3~narrow');

  // ---------------------------------------------------------------- b4: BF16 (8 exp, 7 mantissa)
  S.add(fx.in(fc.rowEls[2].rc, { from: 'scale', d: 0.4 }), 'b4~float-0.2');
  S.add(fx.in([fc.rowEls[2].fn, fc.rowEls[2].fb, fc.rowEls[2].fr], { from: 'fade', d: 0.4 }), 'b4~sixteen');
  S.add(fx.pulse(fc.rowEls[2].rc, { scale: 1.05, d: 0.4 }), 'b4~immense');
  S.add(fx.in(fc.footer, { from: 'up', d: 0.4 }), 'b4~number.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
