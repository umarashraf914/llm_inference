/* ch18_common.js · Shared visual components for Chapter 18 ("Precision and the square law") */

/**
 * Creates the dual benefit of lower precision visual
 */
function ch18DualLever(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('LOWER PRECISION: THE SINGLE LEVER ATTACKING BOTH BOTTLENECKS', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Center chip
  const chipW = 760;
  const chipH = 64;
  const chipBox = S.rect({
    x: cx - chipW / 2, y: cy - chipH / 2, w: chipW, h: chipH, r: 8,
    fill: S.tone('compute', 0.25), stroke: S.tone('compute', 0.9), sw: 2
  }, g);
  const chipText = S.text('NARROWER PRECISION: FEWER BITS PER NUMBER', {
    x: cx, y: cy + 8, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  // Top Card: Arithmetic Speedup
  const topW = 960;
  const topH = 110;
  const topY = cy - 170;
  const topCard = S.card({ x: cx - topW / 2, y: topY, w: topW, h: topH, tone: 'compute', title: '' }, g);
  const topTitle = S.text('ARITHMETIC: 2× OPERATIONS THROUGH TENSOR CORES', {
    x: cx, y: topY + 36, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const topDesc = S.text('Tensor cores process twice as many matrix calculations per second', {
    x: cx, y: topY + 74, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Bottom Card: Memory Traffic Savings
  const botY = cy + 60;
  const botCard = S.card({ x: cx - topW / 2, y: botY, w: topW, h: topH, tone: 'bytes', title: '' }, g);
  const botTitle = S.text('MEMORY: 50% FEWER BYTES ACROSS THE BUS', {
    x: cx, y: botY + 36, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const botDesc = S.text('Halving bit width cuts memory traffic in half: move less data for the same model', {
    x: cx, y: botY + 74, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  const footer = S.pill('LOWER PRECISION ACCELERATES ARITHMETIC WHILE CUTTING MEMORY TRAFFIC IN HALF', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title, chipBox, chipText,
    topCard, topTitle, topDesc, botCard, botTitle, botDesc, footer
  };
}

/**
 * Creates the Binary Long Multiplication and Circuit Square Law Visual
 */
function ch18BinaryLongMul(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const cardW = 630;
  const cardH = 460;
  const topY = cy - cardH / 2;

  // Left: Worked Binary Long Multiplication
  const leftX = cx - cardW - 25;
  const leftCard = S.card({ x: leftX, y: topY, w: cardW, h: cardH, tone: 'neutral', title: '' }, g);
  const leftTitle = S.text('BINARY LONG MULTIPLICATION: 11 × 13 = 143', {
    x: leftX + cardW / 2, y: topY + 44, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);
  const leftSub = S.text('1011₂ × 1101₂ = 10001111₂ (143)', {
    x: leftX + cardW / 2, y: topY + 80, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const mathLines = [
    '    1 0 1 1   (11 in binary)',
    '  × 1 1 0 1   (13 in binary)',
    '  ─────────',
    '    1 0 1 1   (1011 × 1)',
    '   0 0 0 0 ·   (1011 × 0)',
    '  1 0 1 1 · ·  (1011 × 1)',
    '+1 0 1 1 · · · (1011 × 1)',
    '  ─────────',
    '1 0 0 0 1 1 1 1  =  143'
  ];

  const mBox = S.rect({
    x: leftX + 40, y: topY + 115, w: cardW - 80, h: 225, r: 6,
    fill: S.tone('neutral', 0.1), stroke: S.tone('neutral', 0.4), sw: 1
  }, g);

  const mTexts = [];
  mathLines.forEach((line, idx) => {
    const t = S.text(line, {
      x: leftX + 80, y: topY + 140 + idx * 23, size: 18, weight: 600, color: idx === 8 ? 'compute' : 'ink'
    }, g);
    t.setAttribute('data-audit', 'ignore');
    mTexts.push(t);
  });

  const leftPill = S.pill('EACH PAIR USES 1 AND GATE · 16 GATES TOTAL', {
    x: leftX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'compute', size: 20, weight: 700
  }, g);

  // Right: Circuit Area Square Law
  const rightX = cx + 25;
  const rightCard = S.card({ x: rightX, y: topY, w: cardW, h: cardH, tone: 'helps', title: '' }, g);
  const rightTitle = S.text('CIRCUIT AREA SCALES WITH WIDTH SQUARED', {
    x: rightX + cardW / 2, y: topY + 44, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const rightSub = S.text('Multiplier Gates = Width × Width (N²)', {
    x: rightX + cardW / 2, y: topY + 80, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const widths = [
    { bits: '4-bit Multiplier:', gates: '16 AND Gates (4² = 16)', tone: 'helps' },
    { bits: '8-bit Multiplier:', gates: '64 AND Gates (8² = 64)', tone: 'compute' },
    { bits: '16-bit Multiplier:', gates: '256 AND Gates (16² = 256)', tone: 'struct' },
    { bits: '32-bit Multiplier:', gates: '1,024 AND Gates (32² = 1,024)', tone: 'bytes' }
  ];

  const wElements = [];
  widths.forEach((w, idx) => {
    const wy = topY + 120 + idx * 56;
    const box = S.card({ x: rightX + 30, y: wy, w: cardW - 60, h: 48, tone: w.tone, title: '' }, g);
    const bt = S.text(w.bits, { x: rightX + 50, y: wy + 31, size: 20, weight: 700, color: 'ink' }, g);
    const gt = S.text(w.gates, { x: rightX + cardW - 50, y: wy + 31, size: 20, anchor: 'end', weight: 700, color: w.tone }, g);
    wElements.push({ box, bt, gt });
  });

  const rightPill = S.pill('HALVING BIT WIDTH SHRINKS MULTIPLIER CIRCUIT TO 1/4TH', {
    x: rightX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g,
    leftCard, leftTitle, leftSub, mBox, mTexts, leftPill,
    rightCard, rightTitle, rightSub, wElements, rightPill
  };
}

/**
 * Creates the Area vs Delivery Bottleneck Visual
 */
function ch18AreaVsDelivery(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('WHY TENSOR CORES DOUBLE (2×) INSTEAD OF QUADRUPLING (4×)', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const colW = 580;
  const colH = 260;
  const colY = cy - 140;

  // Left: Silicon Area (Allows 4x)
  const leftX = cx - colW - 20;
  const lCard = S.card({ x: leftX, y: colY, w: colW, h: colH, tone: 'helps', title: '' }, g);
  const lTitle = S.text('SILICON MULTIPLIER AREA: ALLOWS 4×', { x: leftX + colW / 2, y: colY + 36, size: 22, anchor: 'middle', weight: 700, color: 'helps' }, g);
  const lDesc1 = S.text('1 × 32-bit multiplier area fits sixteen 8-bit multipliers', { x: leftX + colW / 2, y: colY + 80, size: 20, anchor: 'middle', weight: 600, color: 'ink' }, g);
  const lDesc2 = S.text('1 × 16-bit multiplier area fits four 8-bit multipliers', { x: leftX + colW / 2, y: colY + 125, size: 20, anchor: 'middle', weight: 600, color: 'ink' }, g);
  const lPill = S.pill('AREA BUDGET ALLOWS A 4× DENSITY MULTIPLIER', { x: leftX + colW / 2, y: colY + 205, h: 42, tone: 'helps', size: 20, weight: 700 }, g);

  // Right: Operand Delivery (Limits to 2x)
  const rightX = cx + 20;
  const rCard = S.card({ x: rightX, y: colY, w: colW, h: colH, tone: 'bytes', title: '' }, g);
  const rTitle = S.text('OPERAND DELIVERY WIRES: CAPS AT 2×', { x: rightX + colW / 2, y: colY + 36, size: 22, anchor: 'middle', weight: 700, color: 'bytes' }, g);
  const rDesc1 = S.text('Internal wires feeding the math units have fixed bit width', { x: rightX + colW / 2, y: colY + 80, size: 20, anchor: 'middle', weight: 600, color: 'ink' }, g);
  const rDesc2 = S.text('Data paths move fixed bits/tick: 989 T → 1,979 TFLOP/s (2×)', { x: rightX + colW / 2, y: colY + 125, size: 20, anchor: 'middle', weight: 700, color: 'compute' }, g);
  const rPill = S.pill('DELIVERY BANDWIDTH CAPS THROUGHPUT AT 2×', { x: rightX + colW / 2, y: colY + 205, h: 42, tone: 'bytes', size: 20, weight: 700 }, g);

  const footer = S.pill('THE SQUARE LAW SETS SILICON AREA · DATA DELIVERY SETS THROUGHPUT', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'struct', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title, lCard, lTitle, lDesc1, lDesc2, lPill,
    rCard, rTitle, rDesc1, rDesc2, rPill, footer
  };
}

/**
 * Creates the Generational Format Ladder (FP16 -> FP8 -> FP4)
 */
function ch18FormatLadder(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('THE GENERATIONAL FORMAT LADDER: 72× COMPOUNDED GAIN', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const milestones = [
    { name: 'Volta V100 (2017)', fmt: '16-bit FP16', flop: '125 TFLOP/s (Baseline)', col: 'helps' },
    { name: 'Hopper H100 (2022)', fmt: '8-bit FP8', flop: '1,979 TFLOP/s (15.8× Gain)', col: 'compute' },
    { name: 'Blackwell B200 (2024)', fmt: '4-bit FP4', flop: '9,000 TFLOP/s (72.0× GAIN)', col: 'bytes' }
  ];

  const rowX0 = cx - 580;
  const rowW = 1160;
  const startY = cy - 140;
  const mElements = [];

  milestones.forEach((m, idx) => {
    const ry = startY + idx * 80;
    const rc = S.card({ x: rowX0, y: ry, w: rowW, h: 68, tone: m.col, title: '' }, g);
    const mn = S.text(m.name, { x: rowX0 + 24, y: ry + 42, size: 22, weight: 700, color: 'ink' }, g);
    const mf = S.text(m.fmt, { x: rowX0 + 360, y: ry + 42, size: 20, weight: 600, color: 'ink' }, g);
    const ml = S.text(m.flop, { x: rowX0 + rowW - 24, y: ry + 42, size: 22, anchor: 'end', weight: 700, color: m.col }, g);
    mElements.push({ rc, mn, mf, ml });
  });

  const footer = S.pill('SHRINKING PRECISION COMPOUNDS WITH ARCHITECTURE FOR 72× THROUGHPUT', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return { group: g, card, title, mElements, footer };
}
