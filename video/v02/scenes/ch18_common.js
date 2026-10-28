/* ch18_common.js · Visual components for Chapter 18 ("Precision and the square law")
   Figs 95, 96, 97, 98 from atlas:
   - ch18DualLever: Dual bottleneck attack (compute throughput + memory bandwidth) (Fig 95)
   - ch18BinaryLongMul: Binary long multiplication 11×13=143 & N² AND gate scaling (Fig 96)
   - ch18AreaVsDelivery: Silicon area squares (1x 32-bit = 4x 16-bit = 16x 8-bit) & wire bottleneck (Fig 97)
   - ch18FormatLadder: Generational bit width bars (16b -> 8b -> 4b) & 72x throughput gain (Fig 98)
*/

/**
 * Creates the dual benefit of lower precision visual (Atlas Fig 95)
 */
function ch18DualLever(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('lower precision · the single lever attacking both bottlenecks', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Central Lever Node
  const leverW = 860;
  const leverH = 68;
  const leverY = cy - leverH / 2;
  const leverBox = S.rect({
    x: cx - leverW / 2, y: leverY, w: leverW, h: leverH, r: 10,
    fill: '#1c2438', stroke: S.tone('struct'), sw: 2
  }, g);
  const leverTitle = S.text('fewer bits per number (e.g. 16-bit → 8-bit)', {
    x: cx, y: cy + 8, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);

  // Diverging attack panels: Top = Compute, Bottom = Memory
  const panW = 1000;
  const panH = 105;

  // Top: Arithmetic through Tensor Cores
  const topY = cy - 170;
  const topCard = S.rect({
    x: cx - panW / 2, y: topY, w: panW, h: panH, r: 10,
    fill: '#241a14', stroke: S.tone('compute'), sw: 1.5
  }, g);
  const topTitle = S.text('arithmetic: 2× operations through tensor cores', {
    x: cx, y: topY + 36, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const topDesc = S.text('tensor cores double matrix throughput each second (989 T → 1,979 TFLOP/s)', {
    x: cx, y: topY + 76, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Bottom: Memory Bus Traffic
  const botY = cy + 65;
  const botCard = S.rect({
    x: cx - panW / 2, y: botY, w: panW, h: panH, r: 10,
    fill: '#24141a', stroke: S.tone('bytes'), sw: 1.5
  }, g);
  const botTitle = S.text('memory: 50% fewer bytes across the bus', {
    x: cx, y: botY + 36, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const botDesc = S.text('halving bit width cuts memory traffic in half: move less data for the same model', {
    x: cx, y: botY + 76, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  const footer = S.pill('lower precision accelerates arithmetic while cutting memory traffic in half', {
    x: cx, y: cy + h / 2 - 32, h: 38, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g, bg, title, leverBox, leverTitle,
    topCard, topTitle, topDesc, botCard, botTitle, botDesc, footer
  };
}

/**
 * Creates the Binary Long Multiplication and Circuit Square Law Visual (Atlas Fig 96)
 */
function ch18BinaryLongMul(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 495;
  const cardW = 660;
  const cardH = 460;
  const topY = cy - cardH / 2;

  // ---------------------------------------------------------------- Left: Binary Long Multiply
  const leftX = cx - cardW - 20;
  const leftCard = S.rect({
    x: leftX, y: topY, w: cardW, h: cardH, r: 12,
    fill: '#151c2e', stroke: '#222f48', sw: 1.5
  }, g);

  const leftTitle = S.text('binary long multiplication: 11 × 13 = 143', {
    x: leftX + cardW / 2, y: topY + 36, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);
  const leftSub = S.text('1011₂ × 1101₂ = 10001111₂ (143)', {
    x: leftX + cardW / 2, y: topY + 70, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  // Worked binary multiplication box
  const mBox = S.rect({
    x: leftX + 40, y: topY + 95, w: cardW - 80, h: 240, r: 8,
    fill: '#101524', stroke: '#222f48', sw: 1
  }, g);

  const mathLines = [
    { text: '     1 0 1 1   (11 in binary)', col: 'ink' },
    { text: '   × 1 1 0 1   (13 in binary)', col: 'ink' },
    { text: '   ─────────', col: 'muted' },
    { text: '     1 0 1 1   (row 0: 1011 × 1)', col: 'compute' },
    { text: '    0 0 0 0 ·  (row 1: 1011 × 0)', col: 'muted' },
    { text: '   1 0 1 1 · · (row 2: 1011 × 1)', col: 'compute' },
    { text: ' +1 0 1 1 · · ·(row 3: 1011 × 1)', col: 'compute' },
    { text: ' 1 0 0 0 1 1 1 1  =  143', col: 'helps' }
  ];

  const mTexts = [];
  mathLines.forEach((l, idx) => {
    const t = S.text(l.text, {
      x: leftX + 90, y: topY + 128 + idx * 26, size: 20, weight: 600, color: l.col, family: 'mono'
    }, g);
    mTexts.push(t);
  });

  const leftPill = S.pill('each bit pair uses 1 AND gate · 4 × 4 = 16 gates', {
    x: leftX + cardW / 2, y: topY + cardH - 32, h: 38, tone: 'compute', size: 20, weight: 700, style: 'solid'
  }, g);

  // ---------------------------------------------------------------- Right: Circuit Area Square Law
  const rightX = cx + 20;
  const rightCard = S.rect({
    x: rightX, y: topY, w: cardW, h: cardH, r: 12,
    fill: '#151c2e', stroke: S.tone('helps'), sw: 1.5
  }, g);

  const rightTitle = S.text('circuit area scales with width squared', {
    x: rightX + cardW / 2, y: topY + 36, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const rightSub = S.text('multiplier gates = width × width (n²)', {
    x: rightX + cardW / 2, y: topY + 70, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const widths = [
    { bits: '4-bit multiplier:', gates: '16 AND gates (4² = 16)', tone: 'helps' },
    { bits: '8-bit multiplier:', gates: '64 AND gates (8² = 64)', tone: 'compute' },
    { bits: '16-bit multiplier:', gates: '256 AND gates (16² = 256)', tone: 'struct' },
    { bits: '32-bit multiplier:', gates: '1,024 AND gates (32² = 1,024)', tone: 'bytes' }
  ];

  const wElements = [];
  widths.forEach((w, idx) => {
    const wy = topY + 105 + idx * 60;
    const box = S.rect({
      x: rightX + 30, y: wy, w: cardW - 60, h: 50, r: 6,
      fill: '#101524', stroke: S.tone(w.tone), sw: 1
    }, g);
    const bt = S.text(w.bits, { x: rightX + 45, y: wy + 32, size: 20, weight: 700, color: 'ink' }, g);
    const gt = S.text(w.gates, { x: rightX + cardW - 45, y: wy + 32, size: 20, anchor: 'end', weight: 700, color: w.tone }, g);
    wElements.push({ box, bt, gt });
  });

  const rightPill = S.pill('halving bit width shrinks multiplier circuit to 1/4th', {
    x: rightX + cardW / 2, y: topY + cardH - 32, h: 38, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g,
    leftCard, leftTitle, leftSub, mBox, mTexts, leftPill,
    rightCard, rightTitle, rightSub, wElements, rightPill
  };
}

/**
 * Creates the Area vs Delivery Bottleneck Visual (Atlas Fig 97)
 */
function ch18AreaVsDelivery(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 495;
  const cardW = 660;
  const cardH = 460;
  const topY = cy - cardH / 2;

  // ---------------------------------------------------------------- Left: Silicon Area (Allows 4x)
  const leftX = cx - cardW - 20;
  const lCard = S.rect({
    x: leftX, y: topY, w: cardW, h: cardH, r: 12,
    fill: '#151c2e', stroke: S.tone('helps'), sw: 1.5
  }, g);

  const lTitle = S.text('silicon multiplier area: allows 4×', {
    x: leftX + cardW / 2, y: topY + 36, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const lSub = S.text('area of one 32-bit multiplier holds sixteen 8-bit multipliers', {
    x: leftX + cardW / 2, y: topY + 70, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  // Drawn physical multiplier area squares
  const sqBox = S.rect({
    x: leftX + 30, y: topY + 95, w: cardW - 60, h: 235, r: 8,
    fill: '#101524', stroke: '#222f48', sw: 1
  }, g);

  // 32-bit square: 180x180
  const sq32 = S.rect({
    x: leftX + 60, y: topY + 120, w: 180, h: 180, r: 6,
    fill: '#1e2438', stroke: S.tone('struct'), sw: 2
  }, g);
  const sq32Lbl1 = S.text('1 × 32-bit', {
    x: leftX + 150, y: topY + 200, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);
  const sq32Lbl2 = S.text('1,024 ANDs', {
    x: leftX + 150, y: topY + 230, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  // 16 8-bit squares inside an 180x180 area beside it
  const sq8G = S.g(null, g);
  const sq8StartX = leftX + 300;
  const sq8StartY = topY + 120;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      S.rect({
        x: sq8StartX + c * 45, y: sq8StartY + r * 45, w: 40, h: 40, r: 3,
        fill: '#12261e', stroke: S.tone('helps'), sw: 1
      }, sq8G);
    }
  }
  const sq8Lbl = S.text('16 × 8-bit multipliers (64 ANDs each)', {
    x: leftX + 390, y: topY + 315, size: 20, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  const lPill = S.pill('silicon area budget allows a 4× density increase', {
    x: leftX + cardW / 2, y: topY + cardH - 32, h: 38, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  // ---------------------------------------------------------------- Right: Operand Delivery (Limits to 2x)
  const rightX = cx + 20;
  const rCard = S.rect({
    x: rightX, y: topY, w: cardW, h: cardH, r: 12,
    fill: '#151c2e', stroke: S.tone('bytes'), sw: 1.5
  }, g);

  const rTitle = S.text('operand delivery wires: caps at 2×', {
    x: rightX + cardW / 2, y: topY + 36, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const rSub = S.text('internal wire tracks feeding units have fixed width', {
    x: rightX + cardW / 2, y: topY + 70, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const wireBox = S.rect({
    x: rightX + 30, y: topY + 95, w: cardW - 60, h: 235, r: 8,
    fill: '#101524', stroke: '#222f48', sw: 1
  }, g);

  const wireT1 = S.text('internal data paths move fixed bits per clock tick', {
    x: rightX + cardW / 2, y: topY + 140, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const wireT2 = S.text('h100 16-bit rate: 989.4 tflop/s', {
    x: rightX + cardW / 2, y: topY + 185, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);
  const wireT3 = S.text('h100 8-bit rate: 1,978.9 tflop/s (exactly 2×)', {
    x: rightX + cardW / 2, y: topY + 230, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const wireT4 = S.text('wire bandwidth bounds throughput to 2× rather than 4×', {
    x: rightX + cardW / 2, y: topY + 275, size: 20, anchor: 'middle', weight: 600, color: 'bytes'
  }, g);

  const rPill = S.pill('delivery bandwidth caps throughput to 2×', {
    x: rightX + cardW / 2, y: topY + cardH - 32, h: 38, tone: 'bytes', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g,
    lCard, lTitle, lSub, sqBox, sq32, sq32Lbl1, sq32Lbl2, sq8G, sq8Lbl, lPill,
    rCard, rTitle, rSub, wireBox, wireT1, wireT2, wireT3, wireT4, rPill
  };
}

/**
 * Creates the Generational Format Ladder (FP16 -> FP8 -> FP4) (Atlas Fig 98)
 */
function ch18FormatLadder(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('the generational format ladder · 72× compounded gain', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const milestones = [
    { name: 'volta v100 (2017)', fmt: '16-bit fp16', barW: 340, flop: '125 tflop/s (baseline)', col: 'helps' },
    { name: 'hopper h100 (2022)', fmt: '8-bit fp8', barW: 170, flop: '1,979 tflop/s (15.8× gain)', col: 'compute' },
    { name: 'blackwell b200 (2024)', fmt: '4-bit fp4', barW: 85, flop: '9,000 tflop/s (72.0× gain)', col: 'bytes' }
  ];

  const rowX0 = cx - 580;
  const rowW = 1160;
  const startY = cy - 145;
  const mElements = [];

  milestones.forEach((m, idx) => {
    const ry = startY + idx * 78;
    const rc = S.rect({
      x: rowX0, y: ry, w: rowW, h: 66, r: 8,
      fill: '#151c2e', stroke: S.tone(m.col), sw: 1.5
    }, g);

    const mn = S.text(m.name, {
      x: rowX0 + 24, y: ry + 40, size: 22, weight: 700, color: 'ink'
    }, g);

    const mf = S.text(m.fmt, {
      x: rowX0 + 320, y: ry + 40, size: 20, weight: 600, color: 'ink'
    }, g);

    // Bit width bar (to scale: 340px -> 170px -> 85px)
    const barBox = S.rect({
      x: rowX0 + 460, y: ry + 22, w: m.barW, h: 22, r: 4,
      fill: S.tone(m.col)
    }, g);

    const ml = S.text(m.flop, {
      x: rowX0 + rowW - 24, y: ry + 40, size: 20, anchor: 'end', weight: 700, color: m.col
    }, g);

    mElements.push({ rc, mn, mf, barBox, ml });
  });

  const footer = S.pill('shrinking precision compounds with architecture for 72× dense throughput', {
    x: cx, y: cy + h / 2 - 28, h: 38, tone: 'bytes', size: 20, weight: 700, style: 'solid'
  }, g);

  return { group: g, bg, title, mElements, footer };
}
