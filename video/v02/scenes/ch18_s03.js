/* ch18_s03 · why tensor cores double instead of quadruple (fig 97)
   Movement 1 (b1): Silicon area fits 16x 8-bit multipliers in 1x 32-bit footprint.
   Movement 2 (b2): H100 throughput doubles (989 -> 1,979 TFLOP/s) rather than quadrupling.
   Movement 3 (b3): Internal operand delivery wires have fixed bit width.
   Movement 4 (b4): Square law sets silicon area; data delivery sets throughput. */

V.scene('ch18_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Why tensor cores double instead of quadruple', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Area vs Delivery visual
  const ad = ch18AreaVsDelivery(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('operand delivery paths, not multiplier area, set the throughput scaling', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([ad.card, ad.title, ad.lCard, ad.lTitle, ad.lDesc1, ad.lDesc2, ad.lPill], { autoAlpha: 0 });
  S.set([ad.rCard, ad.rTitle, ad.rDesc1, ad.rDesc2, ad.rPill, ad.footer], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Silicon area allows 4x
  S.add(fx.in([ad.card, ad.title], { from: 'scale', d: 0.5 }), 'b1~silicon-0.2');
  S.add(fx.in([ad.lCard, ad.lTitle], { from: 'scale', d: 0.5 }), 'b1~area-0.2');
  S.add(fx.in([ad.lDesc1, ad.lDesc2], { from: 'fade', d: 0.4 }), 'b1~alone,');
  S.add(fx.in(ad.lPill, { from: 'up', d: 0.4 }), 'b1~sixteen');

  // ---------------------------------------------------------------- b2: Throughput only doubles (2x)
  S.add(fx.in([ad.rCard, ad.rTitle], { from: 'scale', d: 0.5 }), 'b2~switches-0.2');
  S.add(fx.in([ad.rDesc1, ad.rDesc2], { from: 'fade', d: 0.4 }), 'b2~doubles');
  S.add(fx.pulse([ad.rCard, ad.rDesc2], { scale: 1.05, d: 0.4 }), 'b2~quadrupling:');

  // ---------------------------------------------------------------- b3: Operand delivery bottleneck
  S.add(fx.in(ad.rPill, { from: 'up', d: 0.4 }), 'b3~operand-0.2');
  S.add(fx.pulse([ad.rCard, ad.rPill], { scale: 1.05, d: 0.4 }), 'b3~delivery.');

  // ---------------------------------------------------------------- b4: Area vs Delivery conclusion
  S.add(fx.in(ad.footer, { from: 'up', d: 0.4 }), 'b4~arithmetic-0.2');
  S.add(fx.pulse(ad.footer, { scale: 1.05, d: 0.4 }), 'b4~fed.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
