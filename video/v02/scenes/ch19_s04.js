/* ch19_s04 · range and precision across formats (fig 103)
   Movement 1 (b1): FP16 max 65,504 vs BF16 max 3.4 x 10^38.
   Movement 2 (b2): BF16 reaches 5 x 10^33 higher, banishing overflow.
   Movement 3 (b3): Precision price: FP16 steps 0.00098 vs BF16 steps 0.0078 (8x coarser).
   Movement 4 (b4): Deep learning forgives coarse rounding; requires vast range. */

V.scene('ch19_s04', S => {
  const { fx } = S;
  const GX = 960, GY = 510;

  // Heading
  const heading = S.heading('Range and precision across formats', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Container card
  const card = S.card({ x: GX - 680, y: GY - 240, w: 1360, h: 480, tone: 'neutral', title: '' });
  const title = S.text('RANGE VS PRECISION: FP16 AND BF16 SIDE BY SIDE', {
    x: GX, y: GY - 204, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  });

  // Top Box: Dynamic Range (Logarithmic reach)
  const topY = GY - 150;
  const topW = 1240;
  const topH = 125;
  const topCard = S.card({ x: GX - topW / 2, y: topY, w: topW, h: topH, tone: 'compute', title: '' });
  const topTitle = S.text('DYNAMIC RANGE: MAXIMUM REACH BEFORE OVERFLOW', {
    x: GX - topW / 2 + 25, y: topY + 36, size: 22, weight: 700, color: 'compute'
  });
  const topR1 = S.text('FP16 Range: ~10⁻⁵ to 65,504 (Overflew easily during early training)', {
    x: GX - topW / 2 + 25, y: topY + 75, size: 20, weight: 600, color: 'bytes'
  });
  const topR2 = S.text('BF16 Range: ~10⁻³⁸ to 3.4 × 10³⁸ (5 × 10³³ HIGHER · ZERO OVERFLOW)', {
    x: GX - topW / 2 + 25, y: topY + 108, size: 20, weight: 700, color: 'helps'
  });

  // Bottom Box: Step Precision (Linear steps above 1.0)
  const botY = GY + 10;
  const botCard = S.card({ x: GX - topW / 2, y: botY, w: topW, h: topH, tone: 'helps', title: '' });
  const botTitle = S.text('PRECISION STEP SIZE: JUST ABOVE 1.0', {
    x: GX - topW / 2 + 25, y: botY + 36, size: 22, weight: 700, color: 'helps'
  });
  const botR1 = S.text('FP16 Step Size: 2⁻¹⁰ = 0.00098 (10 fraction bits · Very fine increments)', {
    x: GX - topW / 2 + 25, y: botY + 75, size: 20, weight: 600, color: 'ink'
  });
  const botR2 = S.text('BF16 Step Size: 2⁻⁷ = 0.00781 (7 fraction bits · 8× COARSER STEPS)', {
    x: GX - topW / 2 + 25, y: botY + 108, size: 20, weight: 700, color: 'bytes'
  });

  const footer = S.pill('BF16 TRADES 8× COARSER PRECISION FOR 33 ORDERS OF MAGNITUDE IN DYNAMIC RANGE', {
    x: GX, y: GY + 204, h: 42, tone: 'compute', size: 20, weight: 700
  });

  // Concluding Takeaway pill
  const takeaway = S.pill('BF16 trades 8× coarser precision for 33 orders of magnitude in dynamic range', {
    x: GX, y: 990, h: 48, tone: 'compute', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([card, title, topCard, topTitle, topR1, topR2, botCard, botTitle, botR1, botR2, footer], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Reach comparison
  S.add(fx.in([card, title], { from: 'scale', d: 0.5 }), 'b1~reach:-0.2');
  S.add(fx.in([topCard, topTitle], { from: 'scale', d: 0.4 }), 'b1~standard');
  S.add(fx.in(topR1, { from: 'fade', d: 0.4 }), 'b1~standard');
  S.add(fx.in(topR2, { from: 'fade', d: 0.4 }), 'b1~thirty-eighth');

  // ---------------------------------------------------------------- b2: Banishing overflow
  S.add(fx.pulse([topCard, topR2], { scale: 1.03, d: 0.4 }), 'b2~banishing');

  // ---------------------------------------------------------------- b3: Precision price (8x coarser)
  S.add(fx.in([botCard, botTitle], { from: 'scale', d: 0.4 }), 'b3~price-0.2');
  S.add(fx.in(botR1, { from: 'fade', d: 0.4 }), 'b3~price-0.2');
  S.add(fx.in(botR2, { from: 'fade', d: 0.4 }), 'b3~coarser.');
  S.add(fx.pulse([botCard, botR2], { scale: 1.03, d: 0.4 }), 'b3~coarser.');

  // ---------------------------------------------------------------- b4: Whole bargain & conclusion
  S.add(fx.in(footer, { from: 'up', d: 0.4 }), 'b4~bargain:-0.2');
  S.add(fx.pulse(footer, { scale: 1.05, d: 0.4 }), 'b4~layers.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
