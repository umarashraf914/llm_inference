/* ch19_s04 · range versus precision across formats (fig 103)
   Movement 1 (b1): FP16 max 65,504 vs BF16 max 3.4 x 10^38.
   Movement 2 (b2): BF16 reaches 5 x 10^33 higher, banishing overflow.
   Movement 3 (b3): Precision price: FP16 steps 0.00098 vs BF16 steps 0.0078 (8x coarser).
   Movement 4 (b4): Deep learning forgives coarse rounding; requires vast range. */

V.scene('ch19_s04', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('range versus precision across formats', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Range and precision visual
  const rp = ch19RangePrecision(S, { cx: GX, cy: 500 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('deep learning forgives coarse rounding, but requires immense dynamic range', {
    tone: 'compute'
  });

  // Initial states
  S.set([rp.bg, rp.title, rp.topBox, rp.topTitle, rp.topR1, rp.topR2], { autoAlpha: 0 });
  S.set([rp.botBox, rp.botTitle, rp.botR1, rp.botR2, rp.footer, takeaway], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Dynamic range reach
  S.add(fx.in([rp.bg, rp.title, rp.topBox, rp.topTitle], { from: 'up', d: 0.5 }), 'b1~reach:-0.2');
  S.add(fx.in(rp.topR1, { from: 'fade', d: 0.4 }), 'b1~sixty-five');
  S.add(fx.in(rp.topR2, { from: 'fade', d: 0.4 }), 'b1~thirty-eighth');

  // ---------------------------------------------------------------- b2: 5 x 10^33 higher reach
  S.add(fx.pulse([rp.topBox, rp.topR2], { scale: 1.03, d: 0.4 }), 'b2~higher');

  // ---------------------------------------------------------------- b3: Precision step size comparison
  S.add(fx.in([rp.botBox, rp.botTitle], { from: 'up', d: 0.4 }), 'b3~precision:-0.2');
  S.add(fx.in(rp.botR1, { from: 'fade', d: 0.4 }), 'b3~zero');
  S.add(fx.in(rp.botR2, { from: 'fade', d: 0.4 }), 'b3~coarser.');
  S.add(fx.pulse([rp.botBox, rp.botR2], { scale: 1.03, d: 0.4 }), 'b3~coarser.');

  // ---------------------------------------------------------------- b4: Conclusion
  S.add(fx.in(rp.footer, { from: 'up', d: 0.4 }), 'b4~bargain:-0.2');
  S.add(fx.pulse(rp.footer, { scale: 1.03, d: 0.4 }), 'b4~layers.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
