/* ch18_s03 · area versus delivery wires (fig 97)
   Movement 1 (b1): 1x 32-bit multiplier area fits sixteen 8-bit multipliers (4x density).
   Movement 2 (b2): H100 throughput doubles (2x) rather than quadrupling (989 -> 1,979 TFLOP/s).
   Movement 3 (b3): Why twice? Internal wire tracks feeding units have fixed width.
   Movement 4 (b4): Square law sets silicon area; data delivery sets throughput. */

V.scene('ch18_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('area versus delivery wires', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Area vs Delivery visual
  const ad = ch18AreaVsDelivery(S, { cx: GX, cy: 500 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('the square law sets how much arithmetic fits; data delivery sets how fast it runs', {
    tone: 'struct'
  });

  // Initial states
  S.set([ad.lCard, ad.lTitle, ad.lSub, ad.sqBox, ad.sq32, ad.sq32Lbl1, ad.sq32Lbl2, ad.sq8G, ad.sq8Lbl, ad.lPill], { autoAlpha: 0 });
  S.set([ad.rCard, ad.rTitle, ad.rSub, ad.wireBox, ad.wireT1, ad.wireT2, ad.wireT3, ad.wireT4, ad.rPill, takeaway], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Silicon area squares (1x 32-bit = 16x 8-bit)
  S.add(fx.in([ad.lCard, ad.lTitle, ad.lSub], { from: 'up', d: 0.5 }), 'b1~silicon-0.2');
  S.add(fx.in([ad.sqBox, ad.sq32, ad.sq32Lbl1, ad.sq32Lbl2, ad.sq8G, ad.sq8Lbl], { from: 'fade', d: 0.4 }), 'b1~footprint');
  S.add(fx.in(ad.lPill, { from: 'fade', d: 0.4 }), 'b1~multipliers.');

  // ---------------------------------------------------------------- b2: H100 throughput doubles to 1,979 TFLOP/s
  S.add(fx.in([ad.rCard, ad.rTitle, ad.rSub, ad.wireBox], { from: 'up', d: 0.5 }), 'b2~switches-0.2');
  S.add(fx.in([ad.wireT1, ad.wireT2, ad.wireT3], { from: 'fade', d: 0.4 }), 'b2~doubles');
  S.add(fx.pulse([ad.rCard, ad.wireT3], { scale: 1.03, d: 0.4 }), 'b2~trillion.');

  // ---------------------------------------------------------------- b3: Operand delivery wires bottleneck
  S.add(fx.in(ad.wireT4, { from: 'fade', d: 0.4 }), 'b3~delivery.-0.2');
  S.add(fx.pulse(ad.wireT4, { scale: 1.04, d: 0.4 }), 'b3~fixed');

  // ---------------------------------------------------------------- b4: Conclusion
  S.add(fx.in(ad.rPill, { from: 'fade', d: 0.4 }), 'b4~fits-0.2');
  S.add(fx.pulse(ad.rPill, { scale: 1.03, d: 0.4 }), 'b4~fed.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
