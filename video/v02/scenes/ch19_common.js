/* ch19_common.js · Visual components for Chapter 19 ("Inside a floating-point number")
   Figs 99, 100, 101, 102, 103, 104, 105, 106, 107 from atlas:
   - ch19BitFields: FP32 anatomy & dissection of 6 = 1.1₂ × 2² (Fig 99)
   - ch19FormatComparison: FP32 vs FP16 vs BF16 bit layouts & range vs precision trade (Figs 100, 101)
   - ch19PiDissection: Worked breakdown of π in BF16 = 3.140625 (0.031% error) (Fig 102)
   - ch19RangePrecision: 80-decade dynamic range span vs linear step zoom (Fig 103)
   - ch19MultiplierDelivery: Significand multiplier area (1/9th) vs operand wire bandwidth (Fig 104)
   - ch19FreezeGraph: The 256 wall: +1 repeated addition freezing in pure low precision (Figs 105, 106)
   - ch19MarketingDecomp: Headline 9×-18× claim decomposed into 3 physical factors (Fig 107)
*/

/**
 * Creates the 32-bit floating-point bit layout visualizer (Atlas Fig 99)
 */
function ch19BitFields(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('fp32 bit layout · dissecting the number 6 = 1.1₂ × 2²', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Bit boxes
  const boxY = cy - 135;
  const totalW = 1200;
  const boxH = 75;
  const startX = cx - totalW / 2;

  // Sign: 1 bit (~60px)
  const signW = 70;
  const signBox = S.rect({ x: startX, y: boxY, w: signW, h: boxH, r: 8, fill: '#1e2438', stroke: S.tone('struct'), sw: 1.5 }, g);
  const signBit = S.text('0', { x: startX + signW / 2, y: boxY + 46, size: 24, anchor: 'middle', weight: 700, color: 'struct' }, g);
  const signLbl = S.text('sign (1b)', { x: startX + signW / 2, y: boxY - 14, size: 20, anchor: 'middle', weight: 700, color: 'struct' }, g);

  // Exponent: 8 bits (~340px)
  const expW = 360;
  const expX = startX + signW + 15;
  const expBox = S.rect({ x: expX, y: boxY, w: expW, h: boxH, r: 8, fill: '#2e1c12', stroke: S.tone('compute'), sw: 1.5 }, g);
  const expBit = S.text('10000001 (129 = 2 + 127)', { x: expX + expW / 2, y: boxY + 46, size: 20, anchor: 'middle', weight: 700, color: 'compute' }, g);
  const expLbl = S.text('exponent (8b · bias 127)', { x: expX + expW / 2, y: boxY - 14, size: 20, anchor: 'middle', weight: 700, color: 'compute' }, g);

  // Fraction: 23 bits (~740px)
  const fracW = totalW - signW - expW - 30;
  const fracX = expX + expW + 15;
  const fracBox = S.rect({ x: fracX, y: boxY, w: fracW, h: boxH, r: 8, fill: '#10241e', stroke: S.tone('helps'), sw: 1.5 }, g);
  const fracBit = S.text('10000000000000000000000 (.1₂)', { x: fracX + fracW / 2, y: boxY + 46, size: 20, anchor: 'middle', weight: 700, color: 'helps' }, g);
  const fracLbl = S.text('mantissa / fraction (23b + implicit leading 1)', { x: fracX + fracW / 2, y: boxY - 14, size: 20, anchor: 'middle', weight: 700, color: 'helps' }, g);

  // Evaluation breakdown box
  const evW = 1200;
  const evH = 140;
  const evY = cy - 15;
  const evBox = S.rect({ x: cx - evW / 2, y: evY, w: evW, h: evH, r: 10, fill: '#151c2e', stroke: '#222f48', sw: 1.5 }, g);
  const evFormula = S.text('value = (−1)ˢ × 2ᵉ⁻¹²⁷ × 1.f  =  (+1) × 2¹²⁹⁻¹²⁷ × 1.1₂', {
    x: cx, y: evY + 44, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);
  const evResult = S.text('=  1 × 2² × 1.5  =  4 × 1.5  =  6.0 (exact)', {
    x: cx, y: evY + 95, size: 24, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  const footer = S.pill('an implicit leading one gives 24 significant bits from 23 stored bits', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g, bg, title,
    signBox, signBit, signLbl, expBox, expBit, expLbl, fracBox, fracBit, fracLbl,
    evBox, evFormula, evResult, footer
  };
}

/**
 * Creates the Format Bit Allocation Comparison (FP32 vs FP16 vs BF16) (Atlas Figs 100, 101)
 */
function ch19FormatComparison(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('the range vs precision trade-off across formats', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const fmts = [
    { name: 'fp32 (single precision)', bits: '1 sign · 8 exponent · 23 mantissa', range: '10⁻³⁸ to 10⁺³⁸', tone: 'struct' },
    { name: 'fp16 (half precision)', bits: '1 sign · 5 exponent · 10 mantissa', range: 'max 65,504 (narrow)', tone: 'helps' },
    { name: 'bf16 (bfloat16 precision)', bits: '1 sign · 8 exponent · 7 mantissa', range: '10⁻³⁸ to 10⁺³⁸ (fp32 reach)', tone: 'compute' }
  ];

  const rowX0 = cx - 580;
  const rowW = 1160;
  const startY = cy - 140;
  const rowEls = [];

  fmts.forEach((f, idx) => {
    const ry = startY + idx * 78;
    const rc = S.rect({
      x: rowX0, y: ry, w: rowW, h: 66, r: 8,
      fill: '#151c2e', stroke: S.tone(f.tone), sw: 1.5
    }, g);

    const fn = S.text(f.name, {
      x: rowX0 + 30, y: ry + 40, size: 22, weight: 700, color: 'ink'
    }, g);

    const fb = S.text(f.bits, {
      x: rowX0 + 400, y: ry + 40, size: 20, weight: 600, color: 'ink'
    }, g);

    const fr = S.text(f.range, {
      x: rowX0 + rowW - 30, y: ry + 40, size: 20, anchor: 'end', weight: 700, color: f.tone
    }, g);

    rowEls.push({ rc, fn, fb, fr });
  });

  const footer = S.pill('bf16 preserves all 8 exponent bits: fp32 range traded for coarser precision', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'compute', size: 20, weight: 700, style: 'solid'
  }, g);

  return { group: g, bg, title, rowEls, footer };
}

/**
 * Creates the field-by-field dissection of Pi in BF16 (Atlas Fig 102)
 */
function ch19PiDissection(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('π in bfloat16 · field-by-field bit dissection', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Bit representation of Pi: 0 | 10000000 | 1001001
  const bY = cy - 135;
  const bW = 1140;
  const bX0 = cx - bW / 2;

  const sBox = S.rect({ x: bX0, y: bY, w: 100, h: 72, r: 8, fill: '#1e2438', stroke: S.tone('struct'), sw: 1.5 }, g);
  const sText = S.text('0', { x: bX0 + 50, y: bY + 45, size: 24, anchor: 'middle', weight: 700, color: 'struct' }, g);
  const sLbl = S.text('sign (0 = +)', { x: bX0 + 50, y: bY - 14, size: 20, anchor: 'middle', weight: 700, color: 'struct' }, g);

  const eBox = S.rect({ x: bX0 + 115, y: bY, w: 450, h: 72, r: 8, fill: '#2e1c12', stroke: S.tone('compute'), sw: 1.5 }, g);
  const eText = S.text('10000000 (128 − 127 = 1)', { x: bX0 + 340, y: bY + 45, size: 22, anchor: 'middle', weight: 700, color: 'compute' }, g);
  const eLbl = S.text('exponent (2¹ = 2)', { x: bX0 + 340, y: bY - 14, size: 20, anchor: 'middle', weight: 700, color: 'compute' }, g);

  const fBox = S.rect({ x: bX0 + 580, y: bY, w: 560, h: 72, r: 8, fill: '#10241e', stroke: S.tone('helps'), sw: 1.5 }, g);
  const fText = S.text('1001001 (73 ÷ 128 = 0.5703125)', { x: bX0 + 860, y: bY + 45, size: 22, anchor: 'middle', weight: 700, color: 'helps' }, g);
  const fLbl = S.text('fraction (1 + 73/128 = 1.5703125)', { x: bX0 + 860, y: bY - 14, size: 20, anchor: 'middle', weight: 700, color: 'helps' }, g);

  // Result box
  const rY = cy - 15;
  const rBox = S.rect({ x: bX0, y: rY, w: bW, h: 140, r: 10, fill: '#151c2e', stroke: '#222f48', sw: 1.5 }, g);
  const rFormula = S.text('total value: 2¹ × 1.5703125  =  3.140625', {
    x: cx, y: rY + 46, size: 24, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const rErr = S.text('true π = 3.14159265... · off by 0.00097 · error is barely 0.031%', {
    x: cx, y: rY + 95, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  const footer = S.pill('seven fraction bits represent π to within 0.031% accuracy', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g, bg, title,
    sBox, sText, sLbl, eBox, eText, eLbl, fBox, fText, fLbl,
    rBox, rFormula, rErr, footer
  };
}

/**
 * Creates the Range vs Precision Side-by-Side Visual (Atlas Fig 103)
 */
function ch19RangePrecision(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('range vs precision · fp16 and bf16 side by side', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const topW = 1240;
  const topH = 120;

  // Top Box: Dynamic Range (Logarithmic reach)
  const topY = cy - 145;
  const topBox = S.rect({ x: cx - topW / 2, y: topY, w: topW, h: topH, r: 10, fill: '#1b1a28', stroke: S.tone('compute'), sw: 1.5 }, g);
  const topTitle = S.text('dynamic range: maximum reach before overflow', {
    x: cx - topW / 2 + 30, y: topY + 34, size: 22, weight: 700, color: 'compute'
  }, g);
  const topR1 = S.text('fp16 range: ~10⁻⁵ to 65,504 (prone to overflow in deep models)', {
    x: cx - topW / 2 + 30, y: topY + 70, size: 20, weight: 600, color: 'bytes'
  }, g);
  const topR2 = S.text('bf16 range: ~10⁻³⁸ to 3.4 × 10³⁸ (5 × 10³³ higher · zero overflow)', {
    x: cx - topW / 2 + 30, y: topY + 102, size: 20, weight: 700, color: 'helps'
  }, g);

  // Bottom Box: Step Precision (Linear steps above 1.0)
  const botY = cy + 5;
  const botBox = S.rect({ x: cx - topW / 2, y: botY, w: topW, h: topH, r: 10, fill: '#10201a', stroke: S.tone('helps'), sw: 1.5 }, g);
  const botTitle = S.text('precision step size: just above 1.0', {
    x: cx - topW / 2 + 30, y: botY + 34, size: 22, weight: 700, color: 'helps'
  }, g);
  const botR1 = S.text('fp16 step size: 2⁻¹⁰ = 0.00098 (10 fraction bits · very fine increments)', {
    x: cx - topW / 2 + 30, y: botY + 70, size: 20, weight: 600, color: 'ink'
  }, g);
  const botR2 = S.text('bf16 step size: 2⁻⁷ = 0.00781 (7 fraction bits · 8× coarser steps)', {
    x: cx - topW / 2 + 30, y: botY + 102, size: 20, weight: 700, color: 'bytes'
  }, g);

  const footer = S.pill('bf16 trades 8× coarser precision for 33 orders of magnitude in dynamic range', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'compute', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g, bg, title,
    topBox, topTitle, topR1, topR2, botBox, botTitle, botR1, botR2, footer
  };
}

/**
 * Creates the Multiplier Area vs Operand Delivery Visual (Atlas Fig 104)
 */
function ch19MultiplierDelivery(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 495;
  const cardW = 660;
  const cardH = 460;
  const topY = cy - cardH / 2;

  // Left: Multiplier Area
  const leftX = cx - cardW - 20;
  const lCard = S.rect({
    x: leftX, y: topY, w: cardW, h: cardH, r: 12,
    fill: '#151c2e', stroke: S.tone('compute'), sw: 1.5
  }, g);
  const lTitle = S.text('significand multiplier area (n²)', {
    x: leftX + cardW / 2, y: topY + 36, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  const lBox = S.rect({ x: leftX + 30, y: topY + 85, w: cardW - 60, h: 250, r: 8, fill: '#101524', stroke: '#222f48', sw: 1 }, g);
  const lDesc1 = S.text('fp32: 24 × 24 = 576 and gates (baseline)', {
    x: leftX + cardW / 2, y: topY + 135, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const lDesc2 = S.text('fp16: 11 × 11 = 121 and gates', {
    x: leftX + cardW / 2, y: topY + 185, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);
  const lDesc3 = S.text('bf16: 8 × 8 = 64 and gates (1/9th of fp32!)', {
    x: leftX + cardW / 2, y: topY + 235, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const lDesc4 = S.text('bf16 multiplier is half the size of fp16', {
    x: leftX + cardW / 2, y: topY + 285, size: 20, anchor: 'middle', weight: 600, color: 'compute'
  }, g);

  const lPill = S.pill('bf16 multiplier circuit is 1/9th the area of fp32', {
    x: leftX + cardW / 2, y: topY + cardH - 32, h: 42, tone: 'compute', size: 20, weight: 700, style: 'solid'
  }, g);

  // Right: H100 Real Throughput
  const rightX = cx + 20;
  const rCard = S.rect({
    x: rightX, y: topY, w: cardW, h: cardH, r: 12,
    fill: '#151c2e', stroke: S.tone('helps'), sw: 1.5
  }, g);
  const rTitle = S.text('h100 real tensor core throughput', {
    x: rightX + cardW / 2, y: topY + 36, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  const rBox = S.rect({ x: rightX + 30, y: topY + 85, w: cardW - 60, h: 250, r: 8, fill: '#101524', stroke: '#222f48', sw: 1 }, g);
  const rDesc1 = S.text('fp16 rate: 989.4 tflop/s (16-bit operands)', {
    x: rightX + cardW / 2, y: topY + 135, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const rDesc2 = S.text('bf16 rate: 989.4 tflop/s (exact same throughput!)', {
    x: rightX + cardW / 2, y: topY + 185, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const rDesc3 = S.text('operand delivery wires carry fixed bits per tick', {
    x: rightX + cardW / 2, y: topY + 235, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const rDesc4 = S.text('delivery bandwidth, not multiplier area, caps speed', {
    x: rightX + cardW / 2, y: topY + 285, size: 20, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  const rPill = S.pill('operand delivery bandwidth caps throughput', {
    x: rightX + cardW / 2, y: topY + cardH - 32, h: 42, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g,
    lCard, lTitle, lBox, lDesc1, lDesc2, lDesc3, lDesc4, lPill,
    rCard, rTitle, rBox, rDesc1, rDesc2, rDesc3, rDesc4, rPill
  };
}

/**
 * Creates the Running Accumulation Addition Freeze Visual (256 Wall) (Atlas Figs 105, 106)
 */
function ch19FreezeGraph(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('the accumulation safeguard · why pure low-precision sums freeze', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const colW = 390;
  const colGap = 25;
  const startX = cx - (3 * colW + 2 * colGap) / 2;
  const colY = cy - 145;
  const colH = 250;

  const formats = [
    { name: 'pure bf16 addition', limit: 'freezes at 256', d1: 'at 256, step size widens to 2', d2: '256 + 1 rounds back down to 256', tone: 'bytes' },
    { name: 'pure fp16 addition', limit: 'freezes at 2,048', d1: 'at 2,048, step size widens to 2', d2: '2,048 + 1 rounds down to 2,048', tone: 'compute' },
    { name: 'fp32 accumulator', limit: 'exact to 16,777,216', d1: 'hardware accumulates into fp32', d2: 'zero freeze · preserves all sums', tone: 'helps' }
  ];

  const colEls = [];
  formats.forEach((f, idx) => {
    const lx = startX + idx * (colW + colGap);
    const bc = S.rect({
      x: lx, y: colY, w: colW, h: colH, r: 10,
      fill: '#151c2e', stroke: S.tone(f.tone), sw: 1.5
    }, g);

    const fn = S.text(f.name, {
      x: lx + colW / 2, y: colY + 36, size: 20, anchor: 'middle', weight: 700, color: f.tone
    }, g);

    const fl = S.text(f.limit, {
      x: lx + colW / 2, y: colY + 80, size: 24, anchor: 'middle', weight: 700, color: 'ink'
    }, g);

    const fd1 = S.text(f.d1, {
      x: lx + colW / 2, y: colY + 140, size: 20, anchor: 'middle', weight: 600, color: 'ink'
    }, g);

    const fd2 = S.text(f.d2, {
      x: lx + colW / 2, y: colY + 180, size: 20, anchor: 'middle', weight: 600, color: 'muted'
    }, g);

    colEls.push({ bc, fn, fl, fd1, fd2 });
  });

  const footer = S.pill('low-precision multiplies accumulate in fp32 to prevent running totals from freezing', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  return { group: g, bg, title, colEls, footer };
}

/**
 * Creates the Marketing Claim Deconstruction Visual (Atlas Fig 107)
 */
function ch19MarketingDecomp(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('deconstructing generational marketing headlines', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Top Headline Box
  const headW = 1200;
  const headH = 75;
  const headBox = S.rect({ x: cx - headW / 2, y: cy - 145, w: headW, h: headH, r: 10, fill: '#24141a', stroke: S.tone('bytes'), sw: 1.5 }, g);
  const headText = S.text('headline claim: "9× to 18× generational leap"', {
    x: cx, y: cy - 98, size: 24, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);

  // Three Factor Decomposition Cards
  const colW = 380;
  const colGap = 25;
  const startX = cx - (3 * colW + 2 * colGap) / 2;
  const colY = cy - 45;
  const colH = 190;

  const factors = [
    { name: '1. narrow precision', mult: '2.0× multiplier', desc: 'fp16 to fp8 doubles math rate', tone: 'compute' },
    { name: '2. 2:4 sparsity', mult: '2.0× multiplier', desc: 'assumes half of weights are zero', tone: 'compute' },
    { name: '3. cluster fabric', mult: '2.25× multiplier', desc: 'combines multiple dies and clocks', tone: 'struct' }
  ];

  const fElements = [];
  factors.forEach((f, idx) => {
    const lx = startX + idx * (colW + colGap);
    const bc = S.rect({ x: lx, y: colY, w: colW, h: colH, r: 10, fill: '#151c2e', stroke: S.tone(f.tone), sw: 1.5 }, g);
    const fn = S.text(f.name, { x: lx + colW / 2, y: colY + 36, size: 20, anchor: 'middle', weight: 700, color: f.tone }, g);
    const fm = S.text(f.mult, { x: lx + colW / 2, y: colY + 75, size: 22, anchor: 'middle', weight: 700, color: 'ink' }, g);
    const fd = S.text(f.desc, { x: lx + colW / 2, y: colY + 125, size: 20, anchor: 'middle', weight: 600, color: 'muted' }, g);
    fElements.push({ bc, fn, fm, fd });
  });

  const footer = S.pill('on dense same-precision workloads: real silicon delivers 2× to 4× per generation', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  return { group: g, bg, title, headBox, headText, fElements, footer };
}
