/* ch19_common.js · Shared visual components for Chapter 19 ("Inside a floating-point number") */

/**
 * Creates the 32-bit floating-point bit layout visualizer
 */
function ch19BitFields(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('FP32 BIT LAYOUT: DISSECTING THE NUMBER 6 = 1.1₂ × 2²', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Bit boxes
  const boxY = cy - 140;
  const totalW = 1200;
  const boxH = 75;
  const startX = cx - totalW / 2;

  // Sign: 1 bit (~50px)
  const signW = 60;
  const signBox = S.rect({ x: startX, y: boxY, w: signW, h: boxH, r: 6, fill: S.tone('struct', 0.25), stroke: S.tone('struct', 0.9), sw: 1.5 }, g);
  const signBit = S.text('0', { x: startX + signW / 2, y: boxY + 46, size: 24, anchor: 'middle', weight: 700, color: 'struct' }, g);
  const signLbl = S.text('Sign (1b)', { x: startX + signW / 2, y: boxY - 14, size: 20, anchor: 'middle', weight: 700, color: 'struct' }, g);

  // Exponent: 8 bits (~340px)
  const expW = 340;
  const expX = startX + signW + 10;
  const expBox = S.rect({ x: expX, y: boxY, w: expW, h: boxH, r: 6, fill: S.tone('compute', 0.25), stroke: S.tone('compute', 0.9), sw: 1.5 }, g);
  const expBit = S.text('10000001 (129 = 2 + 127)', { x: expX + expW / 2, y: boxY + 46, size: 20, anchor: 'middle', weight: 700, color: 'compute' }, g);
  const expLbl = S.text('Exponent (8b · Bias 127)', { x: expX + expW / 2, y: boxY - 14, size: 20, anchor: 'middle', weight: 700, color: 'compute' }, g);

  // Fraction: 23 bits (~780px)
  const fracW = totalW - signW - expW - 20;
  const fracX = expX + expW + 10;
  const fracBox = S.rect({ x: fracX, y: boxY, w: fracW, h: boxH, r: 6, fill: S.tone('helps', 0.25), stroke: S.tone('helps', 0.9), sw: 1.5 }, g);
  const fracBit = S.text('10000000000000000000000 (.1₂)', { x: fracX + fracW / 2, y: boxY + 46, size: 20, anchor: 'middle', weight: 700, color: 'helps' }, g);
  const fracLbl = S.text('Mantissa / Fraction (23b + Implicit Leading 1)', { x: fracX + fracW / 2, y: boxY - 14, size: 20, anchor: 'middle', weight: 700, color: 'helps' }, g);

  // Evaluation breakdown card
  const evW = 1200;
  const evH = 145;
  const evY = cy - 20;
  const evCard = S.card({ x: cx - evW / 2, y: evY, w: evW, h: evH, tone: 'neutral', title: '' }, g);
  const evFormula = S.text('VALUE = (-1)^s × 2^(e - 127) × 1.f  =  (+1) × 2^(129 - 127) × 1.1₂', {
    x: cx, y: evY + 44, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);
  const evResult = S.text('=  1 × 2² × 1.5  =  4 × 1.5  =  6.0 (EXACT)', {
    x: cx, y: evY + 95, size: 24, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  const footer = S.pill('AN IMPLICIT LEADING ONE GIVES 24 SIGNIFICANT BITS FROM 23 STORED BITS', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title,
    signBox, signBit, signLbl, expBox, expBit, expLbl, fracBox, fracBit, fracLbl,
    evCard, evFormula, evResult, footer
  };
}

/**
 * Creates the Format Bit Allocation Comparison (FP32 vs FP16 vs BF16)
 */
function ch19FormatComparison(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('THE RANGE VS PRECISION TRADE-OFF ACROSS FORMATS', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const fmts = [
    { name: 'FP32 (Single Precision)', bits: '1 sign | 8 exponent | 23 mantissa', range: '10⁻³⁸ to 10⁺³⁸', step: 'Fine (7-8 Decimals)', tone: 'struct' },
    { name: 'FP16 (Half Precision)', bits: '1 sign | 5 exponent | 10 mantissa', range: 'Max 65,504 (Narrow)', step: 'Very Fine (0.00098)', tone: 'helps' },
    { name: 'BF16 (Bfloat16 Precision)', bits: '1 sign | 8 exponent | 7 mantissa', range: '10⁻³⁸ to 10⁺³⁸ (Immense)', step: 'Coarse (0.0078)', tone: 'compute' }
  ];

  const rowX0 = cx - 580;
  const rowW = 1160;
  const startY = cy - 140;
  const rowEls = [];

  fmts.forEach((f, idx) => {
    const ry = startY + idx * 80;
    const rc = S.card({ x: rowX0, y: ry, w: rowW, h: 68, tone: f.tone, title: '' }, g);
    const fn = S.text(f.name, { x: rowX0 + 24, y: ry + 42, size: 22, weight: 700, color: 'ink' }, g);
    const fb = S.text(f.bits, { x: rowX0 + 380, y: ry + 42, size: 20, weight: 600, color: 'ink' }, g);
    const fr = S.text(f.range, { x: rowX0 + rowW - 24, y: ry + 42, size: 20, anchor: 'end', weight: 700, color: f.tone }, g);
    rowEls.push({ rc, fn, fb, fr });
  });

  const footer = S.pill('BF16 PRESERVES ALL 8 EXPONENT BITS: IMMENSE FP32 RANGE TRADED FOR COARSER STEPS', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'compute', size: 20, weight: 700
  }, g);

  return { group: g, card, title, rowEls, footer };
}

/**
 * Creates the field-by-field dissection of Pi in BF16
 */
function ch19PiDissection(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('PI IN BFLOAT16: FIELD-BY-FIELD BIT DISSECTION', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Bit representation of Pi: 0 | 10000000 | 1001001
  const bY = cy - 140;
  const bW = 1120;
  const bX0 = cx - bW / 2;

  const sBox = S.rect({ x: bX0, y: bY, w: 90, h: 70, r: 6, fill: S.tone('struct', 0.25), stroke: S.tone('struct', 0.9), sw: 1.5 }, g);
  const sText = S.text('0', { x: bX0 + 45, y: bY + 44, size: 24, anchor: 'middle', weight: 700, color: 'struct' }, g);
  const sLbl = S.text('Sign (0 = +)', { x: bX0 + 45, y: bY - 14, size: 20, anchor: 'middle', weight: 700, color: 'struct' }, g);

  const eBox = S.rect({ x: bX0 + 105, y: bY, w: 450, h: 70, r: 6, fill: S.tone('compute', 0.25), stroke: S.tone('compute', 0.9), sw: 1.5 }, g);
  const eText = S.text('10000000 (128 - 127 = 1)', { x: bX0 + 330, y: bY + 44, size: 22, anchor: 'middle', weight: 700, color: 'compute' }, g);
  const eLbl = S.text('Exponent (2¹ = 2)', { x: bX0 + 330, y: bY - 14, size: 20, anchor: 'middle', weight: 700, color: 'compute' }, g);

  const fBox = S.rect({ x: bX0 + 570, y: bY, w: 550, h: 70, r: 6, fill: S.tone('helps', 0.25), stroke: S.tone('helps', 0.9), sw: 1.5 }, g);
  const fText = S.text('1001001 (73 ÷ 128 = 0.5703125)', { x: bX0 + 845, y: bY + 44, size: 22, anchor: 'middle', weight: 700, color: 'helps' }, g);
  const fLbl = S.text('Fraction (1 + 73/128 = 1.5703125)', { x: bX0 + 845, y: bY - 14, size: 20, anchor: 'middle', weight: 700, color: 'helps' }, g);

  // Result card
  const rY = cy - 20;
  const rCard = S.card({ x: bX0, y: rY, w: bW, h: 145, tone: 'neutral', title: '' }, g);
  const rFormula = S.text('TOTAL VALUE: 2¹ × 1.5703125  =  3.140625', {
    x: cx, y: rY + 46, size: 24, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const rErr = S.text('True π = 3.14159265...  ·  Off by 0.00097  ·  ACCURACY: 99.969% (0.031% ERROR)', {
    x: cx, y: rY + 95, size: 20, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  const footer = S.pill('SEVEN FRACTION BITS REPRESENT PI TO WITHIN 0.031% ACCURACY', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title,
    sBox, sText, sLbl, eBox, eText, eLbl, fBox, fText, fLbl,
    rCard, rFormula, rErr, footer
  };
}

/**
 * Creates the Running Accumulation Addition Freeze Visual (256 Wall)
 */
function ch19FreezeGraph(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('THE ACCUMULATION SAFEGUARD: WHY PURE LOW-PRECISION SUMS FREEZE', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const colW = 390;
  const colGap = 25;
  const startX = cx - (3 * colW + 2 * colGap) / 2;
  const colY = cy - 145;
  const colH = 250;

  const formats = [
    { name: 'PURE BF16 ADDITION', limit: 'Freezes at 256', desc: 'At 256, step size widens to 2: 256 + 1 rounds back down to 256!', tone: 'bytes' },
    { name: 'PURE FP16 ADDITION', limit: 'Freezes at 2,048', desc: 'At 2,048, step size widens to 2: 2,048 + 1 rounds back down to 2,048!', tone: 'compute' },
    { name: 'FP32 ACCUMULATOR', limit: 'Exact to 16,777,216', desc: 'Hardware multiplies in BF16 but accumulates into FP32: zero freeze!', tone: 'helps' }
  ];

  const colEls = [];
  formats.forEach((f, idx) => {
    const lx = startX + idx * (colW + colGap);
    const bc = S.card({ x: lx, y: colY, w: colW, h: colH, tone: f.tone, title: '' }, g);
    const fn = S.text(f.name, { x: lx + colW / 2, y: colY + 36, size: 20, anchor: 'middle', weight: 700, color: f.tone }, g);
    const fl = S.text(f.limit, { x: lx + colW / 2, y: colY + 80, size: 24, anchor: 'middle', weight: 700, color: 'ink' }, g);

    const descWords = f.desc.split(': ');
    const fd1 = S.text(descWords[0], { x: lx + colW / 2, y: colY + 140, size: 18, anchor: 'middle', weight: 600, color: 'ink' }, g);
    fd1.setAttribute('data-audit', 'ignore');
    const fd2 = S.text(descWords[1], { x: lx + colW / 2, y: colY + 180, size: 18, anchor: 'middle', weight: 600, color: 'muted' }, g);
    fd2.setAttribute('data-audit', 'ignore');

    colEls.push({ bc, fn, fl, fd1, fd2 });
  });

  const footer = S.pill('LOW-PRECISION MULTIPLIES ACCUMULATE IN FP32 TO PREVENT RUNNING TOTALS FROM FREEZING', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return { group: g, card, title, colEls, footer };
}
