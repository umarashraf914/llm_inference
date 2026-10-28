/* ch02_s04 · deriving the three point three five terabytes (fig 8)
   Movement 1 (b1): 5 HBM3 memory stacks surrounding the central compute die.
   Movement 2 (b2): 1,024 data wires per stack × 5 stacks = 5,120 wires in all.
   Movement 3 (b3): 2,619 MHz clock with double data rate (DDR) = 5.238 Gb/s per wire.
   Movement 4 (b4): Complete derivation: 5,120 × 5.238 ÷ 8 = 3,352 GB/s (3.35 TB/s). */

V.scene('ch02_s04', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('Deriving the 3.35 terabytes', { y: 130 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Left side: Miniature Hopper package schematic
  const pGroup = S.g();
  const pkgCX = 420, pkgCY = GY + 10;
  const pkg = ch02Package(S, { cx: pkgCX, cy: pkgCY, pw: 540, ph: 480, dieSize: 200, parent: pGroup });

  // Right side: Derivation cards
  const dX = 1260;
  const cardW = 700, stepH = 100;

  // Step 1: Wire count card
  const c1Y = GY - 130;
  const step1Card = S.card({
    x: dX - cardW / 2, y: c1Y - stepH / 2, w: cardW, h: stepH,
    tone: 'struct', title: ''
  });
  const s1Title = S.text('1 · total data wires', { x: dX - cardW / 2 + 28, y: c1Y - 18, size: 22, color: 'struct', weight: 650 });
  const s1Eq = S.text('5 stacks × 1,024 wires = 5,120 wires', { x: dX - cardW / 2 + 28, y: c1Y + 18, size: 24, family: 'mono', color: 'ink', weight: 600 });

  // Step 2: Bit rate per wire card
  const c2Y = GY;
  const step2Card = S.card({
    x: dX - cardW / 2, y: c2Y - stepH / 2, w: cardW, h: stepH,
    tone: 'compute', title: ''
  });
  const s2Title = S.text('2 · bit rate per wire (double data rate)', { x: dX - cardW / 2 + 28, y: c2Y - 18, size: 22, color: 'compute', weight: 650 });
  const s2Eq = S.text('2,619 MHz × 2 bits/cycle = 5.238 Gb/s', { x: dX - cardW / 2 + 28, y: c2Y + 18, size: 24, family: 'mono', color: 'ink', weight: 600 });

  // Step 3: Total bandwidth product card
  const c3Y = GY + 145;
  const step3Card = S.card({
    x: dX - cardW / 2, y: c3Y - 65, w: cardW, h: 130,
    tone: 'bytes', title: ''
  });
  const s3Title = S.text('3 · total bandwidth', { x: dX - cardW / 2 + 28, y: c3Y - 26, size: 22, color: 'bytes', weight: 650 });
  const s3Badge = S.pill('3.35 TB/s spec', { x: dX + cardW / 2 - 110, y: c3Y - 26, h: 40, tone: 'bytes', size: 22, weight: 650 });
  const s3Eq = S.text('5,120 wires × 5.238 Gb/s ÷ 8 = 3,352 GB/s', { x: dX - cardW / 2 + 28, y: c3Y + 26, size: 24, family: 'mono', color: 'bytes', weight: 700 });

  // Concluding Takeaway
  const takeaway = S.takeaway('5,120 wires running at double data rate deliver 3.35 TB/s', {
    tone: 'bytes'
  });

  S.set([pGroup, step1Card, s1Title, s1Eq, step2Card, s2Title, s2Eq, step3Card, s3Title, s3Eq, s3Badge, takeaway], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 5 HBM3 memory stacks
  S.add(fx.in(pGroup, { from: 'fade', d: 0.6 }), 'b1~stacks-0.2');

  // ---------------------------------------------------------------- b2: 1,024 wires per stack = 5,120 wires
  S.add(fx.in([step1Card, s1Title, s1Eq], { from: 'right', d: 0.5 }), 'b2~wires-0.2');

  // ---------------------------------------------------------------- b3: DDR clock: 2,619 MHz × 2 = 5.238 Gb/s
  S.add(fx.in([step2Card, s2Title, s2Eq], { from: 'right', d: 0.5 }), 'b3~times-0.2');

  // ---------------------------------------------------------------- b4: Full formula: 3,352 GB/s
  S.add(fx.in([step3Card, s3Title, s3Eq, s3Badge], { from: 'up', d: 0.5 }), 'b4~Multiply-0.2');
  S.add(fx.pulse([step3Card, s3Badge], { scale: 1.05, d: 0.5 }), 'b4~terabytes');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
