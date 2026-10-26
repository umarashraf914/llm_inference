/* ch19_s05 · multiplier area versus bit delivery (fig 104)
   Movement 1 (b1): Floating point multiply: exponents add, significands multiply.
   Movement 2 (b2): BF16 multiplier (64 gates) is 1/9th the size of FP32 (576 gates).
   Movement 3 (b3): On H100, BF16 and FP16 run at identical 989.4 TFLOP/s.
   Movement 4 (b4): Delivery wires, not multiplier area, set throughput speed. */

V.scene('ch19_s05', S => {
  const { fx } = S;
  const GX = 960, GY = 510;

  // Heading
  const heading = S.heading('Multiplier area versus bit delivery', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Container card
  const card = S.card({ x: GX - 680, y: GY - 240, w: 1360, h: 480, tone: 'neutral', title: '' });
  const title = S.text('MULTIPLIER SILICON AREA VS OPERAND DELIVERY WIRES', {
    x: GX, y: GY - 204, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  });

  const colW = 580;
  const colH = 260;
  const colY = GY - 140;

  // Left: Multiplier Area
  const leftX = GX - colW - 20;
  const lCard = S.card({ x: leftX, y: colY, w: colW, h: colH, tone: 'compute', title: '' });
  const lTitle = S.text('SIGNIFICAND MULTIPLIER AREA (N²)', { x: leftX + colW / 2, y: colY + 36, size: 22, anchor: 'middle', weight: 700, color: 'compute' });
  const lDesc1 = S.text('FP32: 24 × 24 = 576 AND Gates (Full 24-bit significand)', { x: leftX + colW / 2, y: colY + 85, size: 20, anchor: 'middle', weight: 600, color: 'ink' });
  const lDesc2 = S.text('BF16: 8 × 8 = 64 AND Gates (1/9th the silicon of FP32!)', { x: leftX + colW / 2, y: colY + 130, size: 20, anchor: 'middle', weight: 700, color: 'helps' });
  const lPill = S.pill('BF16 MULTIPLIER IS HALF THE SIZE OF FP16', { x: leftX + colW / 2, y: colY + 205, h: 42, tone: 'compute', size: 20, weight: 700 });

  // Right: H100 Real Throughput
  const rightX = GX + 20;
  const rCard = S.card({ x: rightX, y: colY, w: colW, h: colH, tone: 'helps', title: '' });
  const rTitle = S.text('H100 REAL TENSOR THROUGHPUT', { x: rightX + colW / 2, y: colY + 36, size: 22, anchor: 'middle', weight: 700, color: 'helps' });
  const rDesc1 = S.text('FP16 Rate: 989.4 TFLOP/s (16-bit operands)', { x: rightX + colW / 2, y: colY + 85, size: 20, anchor: 'middle', weight: 600, color: 'ink' });
  const rDesc2 = S.text('BF16 Rate: 989.4 TFLOP/s (EXACT SAME 989.4 TFLOP/s)', { x: rightX + colW / 2, y: colY + 130, size: 20, anchor: 'middle', weight: 700, color: 'compute' });
  const rPill = S.pill('OPERAND DELIVERY BANDWIDTH CAPS THROUGHPUT', { x: rightX + colW / 2, y: colY + 205, h: 42, tone: 'helps', size: 20, weight: 700 });

  const footer = S.pill('OPERAND DELIVERY BANDWIDTH, NOT MULTIPLIER AREA, GOVERNS SPEED', {
    x: GX, y: GY + 204, h: 42, tone: 'struct', size: 20, weight: 700
  });

  // Concluding Takeaway pill
  const takeaway = S.pill('operand delivery bandwidth, not multiplier area, governs tensor core speed', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([card, title, lCard, lTitle, lDesc1, lDesc2, lPill, rCard, rTitle, rDesc1, rDesc2, rPill, footer], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Exponents add, significands multiply
  S.add(fx.in([card, title], { from: 'scale', d: 0.5 }), 'b1~multiplying-0.2');

  // ---------------------------------------------------------------- b2: Multiplier area (1/9th size)
  S.add(fx.in([lCard, lTitle], { from: 'scale', d: 0.5 }), 'b2~eight-by-eight-0.2');
  S.add(fx.in([lDesc1, lDesc2], { from: 'fade', d: 0.4 }), 'b2~sixty-four');
  S.add(fx.in(lPill, { from: 'up', d: 0.4 }), 'b2~size');

  // ---------------------------------------------------------------- b3: Identical 989.4 TFLOP/s throughput
  S.add(fx.in([rCard, rTitle], { from: 'scale', d: 0.5 }), 'b3~exact-0.2');
  S.add(fx.in([rDesc1, rDesc2], { from: 'fade', d: 0.4 }), 'b3~nine');
  S.add(fx.pulse([rCard, rDesc2], { scale: 1.05, d: 0.4 }), 'b3~trillion');

  // ---------------------------------------------------------------- b4: Delivery wires govern speed
  S.add(fx.in(rPill, { from: 'up', d: 0.4 }), 'b4~determines-0.2');
  S.add(fx.in(footer, { from: 'up', d: 0.4 }), 'b4~tick.');
  S.add(fx.pulse(footer, { scale: 1.05, d: 0.4 }), 'b4~tick.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
