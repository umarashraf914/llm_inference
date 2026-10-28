/* ch19_s05 · multiplier area versus bit delivery (fig 104)
   Movement 1 (b1): Floating point multiply: exponents add, significands multiply.
   Movement 2 (b2): BF16 multiplier (64 gates) is 1/9th the size of FP32 (576 gates).
   Movement 3 (b3): On H100, BF16 and FP16 run at identical 989.4 TFLOP/s.
   Movement 4 (b4): Delivery wires, not multiplier area, set throughput speed. */

V.scene('ch19_s05', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('multiplier area versus bit delivery', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Multiplier vs Delivery visual
  const md = ch19MultiplierDelivery(S, { cx: GX, cy: 500 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('operand delivery bandwidth, not multiplier area, governs tensor core speed', {
    tone: 'struct'
  });

  // Initial states
  S.set([md.lCard, md.lTitle, md.lBox, md.lDesc1, md.lDesc2, md.lDesc3, md.lDesc4, md.lPill], { autoAlpha: 0 });
  S.set([md.rCard, md.rTitle, md.rBox, md.rDesc1, md.rDesc2, md.rDesc3, md.rDesc4, md.rPill, takeaway], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Exponents add, significands multiply
  S.add(fx.in([md.lCard, md.lTitle, md.lBox], { from: 'up', d: 0.5 }), 'b1~multiplying-0.2');

  // ---------------------------------------------------------------- b2: Multiplier area (1/9th size)
  S.add(fx.in([md.lDesc1, md.lDesc2, md.lDesc3, md.lDesc4], { from: 'fade', d: 0.4 }), 'b2~eight-by-eight-0.2');
  S.add(fx.pulse([md.lCard, md.lDesc3], { scale: 1.03, d: 0.4 }), 'b2~sixty-four');
  S.add(fx.in(md.lPill, { from: 'fade', d: 0.4 }), 'b2~size');

  // ---------------------------------------------------------------- b3: H100 identical throughput (989.4 TFLOP/s)
  S.add(fx.in([md.rCard, md.rTitle, md.rBox], { from: 'up', d: 0.5 }), 'b3~Yet-0.2');
  S.add(fx.in([md.rDesc1, md.rDesc2], { from: 'fade', d: 0.4 }), 'b3~runs');
  S.add(fx.pulse([md.rCard, md.rDesc2], { scale: 1.03, d: 0.4 }), 'b3~exact');

  // ---------------------------------------------------------------- b4: Operand delivery bottleneck
  S.add(fx.in([md.rDesc3, md.rDesc4], { from: 'fade', d: 0.4 }), 'b4~Silicon-0.2');
  S.add(fx.in(md.rPill, { from: 'fade', d: 0.4 }), 'b4~wires');
  S.add(fx.pulse(md.rPill, { scale: 1.03, d: 0.4 }), 'b4~tick.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
