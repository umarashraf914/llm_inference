/* ch05_s03 · deriving nine hundred and eighty-nine trillion (fig 25)
   Movement 1 (b1): Master derivation template: SMs × Cores × Ops/Tick × Clock = Peak FLOPS.
   Movement 2 (b2): Step 1: 132 SMs × 4 tensor cores = 528 tensor cores.
   Movement 3 (b3): Step 2: 528 cores × 1,024 ops/tick = 540,672 ops/tick chip-wide.
   Movement 4 (b4): Step 3: 540,672 × 1.83 GHz = 989.4 TFLOP/s (989.4 trillion ops/s). */

V.scene('ch05_s03', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('Deriving 989 trillion operations', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Master Equation Template Card
  const tmplCard = S.card({
    x: GX - 620, y: 170, w: 1240, h: 76,
    tone: 'neutral', title: ''
  });
  const tmplText = S.text('132 SMs  ×  4 CORES  ×  1,024 OPS/TICK  ×  1.83 GHz CLOCK  =  PEAK TFLOP/S', {
    x: GX, y: 215, size: 22, anchor: 'middle', family: 'mono', weight: 700, color: 'ink'
  });

  // 3 Derivation Step Cards
  const cardW = 1240, stepH = 110;
  const cX = GX - cardW / 2;

  // Step 1: Core Count
  const s1Y = 275;
  const s1Card = S.card({ x: cX, y: s1Y, w: cardW, h: stepH, tone: 'struct', title: '' });
  const s1Badge = S.pill('FACTOR 1: CORES', { x: cX + 130, y: s1Y + 36, h: 38, tone: 'struct', size: 22, weight: 700 });
  const s1Title = S.text('132 Multiprocessors × 4 Tensor Cores per SM =', { x: cX + 280, y: s1Y + 38, size: 22, color: 'ink', weight: 600 });
  const s1Val = S.text('528 TENSOR CORES CHIP-WIDE', { x: cX + cardW - 40, y: s1Y + 38, size: 24, anchor: 'end', color: 'struct', weight: 700 });
  const s1Sub = S.text('Each SM houses four identical quarters, each with one tensor core', { x: cX + 280, y: s1Y + 78, size: 20, color: 'muted' });
  s1Sub.setAttribute('data-audit', 'ignore');

  // Step 2: Work per Tick
  const s2Y = 415;
  const s2Card = S.card({ x: cX, y: s2Y, w: cardW, h: stepH, tone: 'compute', title: '' });
  const s2Badge = S.pill('FACTOR 2: OPS / TICK', { x: cX + 130, y: s2Y + 36, h: 38, tone: 'compute', size: 22, weight: 700 });
  const s2Title = S.text('528 Cores × 1,024 ops/tick (512 FMAs each) =', { x: cX + 280, y: s2Y + 38, size: 22, color: 'ink', weight: 600 });
  const s2Val = S.text('540,672 OPERATIONS / TICK', { x: cX + cardW - 40, y: s2Y + 38, size: 24, anchor: 'end', color: 'compute', weight: 700 });
  const s2Sub = S.text('One fused multiply-add counts as two floating-point operations', { x: cX + 280, y: s2Y + 78, size: 20, color: 'muted' });
  s2Sub.setAttribute('data-audit', 'ignore');

  // Step 3: Clock Frequency & Final Product
  const s3Y = 555;
  const s3Card = S.card({ x: cX, y: s3Y, w: cardW, h: 140, tone: 'helps', title: '' });
  const s3Badge = S.pill('FACTOR 3: CLOCK', { x: cX + 130, y: s3Y + 40, h: 38, tone: 'helps', size: 22, weight: 700 });
  const s3Title = S.text('540,672 ops/tick × 1.830 GHz tensor clock =', { x: cX + 280, y: s3Y + 42, size: 22, color: 'ink', weight: 600 });
  const s3Val = S.text('989,429,760,000,000 ops / sec', { x: cX + cardW - 40, y: s3Y + 42, size: 24, anchor: 'end', family: 'mono', color: 'helps', weight: 700 });

  // Hero Headline Banner inside Step 3
  const heroBadge = S.pill('989.4 TFLOP/s (16-BIT PEAK)', {
    x: GX, y: s3Y + 98, h: 48, tone: 'compute', size: 24, weight: 700, style: 'solid'
  });

  // Initial visibility
  S.set([tmplCard, tmplText], { autoAlpha: 0 });
  S.set([s1Card, s1Badge, s1Title, s1Val, s1Sub], { autoAlpha: 0 });
  S.set([s2Card, s2Badge, s2Title, s2Val, s2Sub], { autoAlpha: 0 });
  S.set([s3Card, s3Badge, s3Title, s3Val, heroBadge], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Template card
  S.add(fx.in([tmplCard, tmplText], { from: 'up', d: 0.5 }), 'b1~derive-0.2');

  // ---------------------------------------------------------------- b2: Step 1
  S.add(fx.in([s1Card, s1Badge, s1Title, s1Val, s1Sub], { from: 'left', d: 0.5 }), 'b2~thirty-two-0.2');
  S.add(fx.pulse(s1Val, { scale: 1.05, d: 0.4 }), 'b2~twenty-eight');

  // ---------------------------------------------------------------- b3: Step 2
  S.add(fx.in([s2Card, s2Badge, s2Title, s2Val, s2Sub], { from: 'left', d: 0.5 }), 'b3~completes-0.2');
  S.add(fx.pulse(s2Val, { scale: 1.05, d: 0.4 }), 'b3~thousand');

  // ---------------------------------------------------------------- b4: Step 3 & Hero Result
  S.add(fx.in([s3Card, s3Badge, s3Title, s3Val, heroBadge], { from: 'up', d: 0.5 }), 'b4~Multiply-0.2');
  S.add(fx.pulse(heroBadge, { scale: 1.1, d: 0.6 }), 'b4~trillion');

  // Concluding Takeaway pill
  const takeaway = S.pill('peak compute is just hardware units × operations per tick × clock speed', {
    x: GX, y: 990, h: 48, tone: 'compute', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
