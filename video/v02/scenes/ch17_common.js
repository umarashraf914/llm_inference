/* ch17_common.js · Shared visual components for Chapter 17 ("The tensor core") */

/**
 * Creates the 2x2 Matrix Multiplication step-by-step visual
 */
function ch17MatMulSteps(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('MATRIX MULTIPLICATION: EVERY ROW MEETS EVERY COLUMN', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Matrix A (2x2) at left
  const matY = cy - 120;
  const boxW = 56;
  const boxH = 56;
  const gap = 8;

  const aX0 = cx - 440;
  const aBox1 = S.rect({ x: aX0, y: matY, w: boxW, h: boxH, r: 6, fill: S.tone('compute', 0.25), stroke: S.tone('compute', 0.9), sw: 2 }, g);
  const aText1 = S.text('1', { x: aX0 + boxW / 2, y: matY + 36, size: 22, anchor: 'middle', weight: 700, color: 'compute' }, g);

  const aBox2 = S.rect({ x: aX0 + boxW + gap, y: matY, w: boxW, h: boxH, r: 6, fill: S.tone('compute', 0.25), stroke: S.tone('compute', 0.9), sw: 2 }, g);
  const aText2 = S.text('2', { x: aX0 + boxW + gap + boxW / 2, y: matY + 36, size: 22, anchor: 'middle', weight: 700, color: 'compute' }, g);

  const aBox3 = S.rect({ x: aX0, y: matY + boxH + gap, w: boxW, h: boxH, r: 6, fill: S.tone('neutral', 0.1), stroke: S.tone('neutral', 0.4), sw: 1 }, g);
  const aText3 = S.text('3', { x: aX0 + boxW / 2, y: matY + boxH + gap + 36, size: 22, anchor: 'middle', weight: 600, color: 'muted' }, g);

  const aBox4 = S.rect({ x: aX0 + boxW + gap, y: matY + boxH + gap, w: boxW, h: boxH, r: 6, fill: S.tone('neutral', 0.1), stroke: S.tone('neutral', 0.4), sw: 1 }, g);
  const aText4 = S.text('4', { x: aX0 + boxW + gap + boxW / 2, y: matY + boxH + gap + 36, size: 22, anchor: 'middle', weight: 600, color: 'muted' }, g);

  const aLbl = S.text('Matrix A (Row 1)', { x: aX0 + boxW + gap / 2, y: matY - 14, size: 20, anchor: 'middle', weight: 700, color: 'compute' }, g);

  // Multiply symbol
  const mulSign = S.text('×', { x: cx - 270, y: matY + boxH + gap / 2 + 8, size: 28, anchor: 'middle', weight: 700, color: 'ink' }, g);

  // Matrix B (2x2) at middle
  const bX0 = cx - 200;
  const bBox1 = S.rect({ x: bX0, y: matY, w: boxW, h: boxH, r: 6, fill: S.tone('helps', 0.25), stroke: S.tone('helps', 0.9), sw: 2 }, g);
  const bText1 = S.text('5', { x: bX0 + boxW / 2, y: matY + 36, size: 22, anchor: 'middle', weight: 700, color: 'helps' }, g);

  const bBox2 = S.rect({ x: bX0 + boxW + gap, y: matY, w: boxW, h: boxH, r: 6, fill: S.tone('neutral', 0.1), stroke: S.tone('neutral', 0.4), sw: 1 }, g);
  const bText2 = S.text('6', { x: bX0 + boxW + gap + boxW / 2, y: matY + 36, size: 22, anchor: 'middle', weight: 600, color: 'muted' }, g);

  const bBox3 = S.rect({ x: bX0, y: matY + boxH + gap, w: boxW, h: boxH, r: 6, fill: S.tone('helps', 0.25), stroke: S.tone('helps', 0.9), sw: 2 }, g);
  const bText3 = S.text('7', { x: bX0 + boxW / 2, y: matY + boxH + gap + 36, size: 22, anchor: 'middle', weight: 700, color: 'helps' }, g);

  const bBox4 = S.rect({ x: bX0 + boxW + gap, y: matY + boxH + gap, w: boxW, h: boxH, r: 6, fill: S.tone('neutral', 0.1), stroke: S.tone('neutral', 0.4), sw: 1 }, g);
  const bText4 = S.text('8', { x: bX0 + boxW + gap + boxW / 2, y: matY + boxH + gap + 36, size: 22, anchor: 'middle', weight: 600, color: 'muted' }, g);

  const bLbl = S.text('Matrix B (Col 1)', { x: bX0 + boxW / 2, y: matY - 14, size: 20, anchor: 'middle', weight: 700, color: 'helps' }, g);

  // Equals symbol
  const eqSign = S.text('=', { x: cx - 30, y: matY + boxH + gap / 2 + 8, size: 28, anchor: 'middle', weight: 700, color: 'ink' }, g);

  // Matrix C (2x2) at right
  const cX0 = cx + 40;
  const cBox1 = S.rect({ x: cX0, y: matY, w: boxW, h: boxH, r: 6, fill: S.tone('struct', 0.3), stroke: S.tone('struct', 0.9), sw: 2 }, g);
  const cText1 = S.text('19', { x: cX0 + boxW / 2, y: matY + 36, size: 22, anchor: 'middle', weight: 700, color: 'struct' }, g);

  const cBox2 = S.rect({ x: cX0 + boxW + gap, y: matY, w: boxW, h: boxH, r: 6, fill: S.tone('neutral', 0.1), stroke: S.tone('neutral', 0.4), sw: 1 }, g);
  const cText2 = S.text('22', { x: cX0 + boxW + gap + boxW / 2, y: matY + 36, size: 22, anchor: 'middle', weight: 600, color: 'muted' }, g);

  const cBox3 = S.rect({ x: cX0, y: matY + boxH + gap, w: boxW, h: boxH, r: 6, fill: S.tone('neutral', 0.1), stroke: S.tone('neutral', 0.4), sw: 1 }, g);
  const cText3 = S.text('43', { x: cX0 + boxW / 2, y: matY + boxH + gap + 36, size: 22, anchor: 'middle', weight: 600, color: 'muted' }, g);

  const cBox4 = S.rect({ x: cX0 + boxW + gap, y: matY + boxH + gap, w: boxW, h: boxH, r: 6, fill: S.tone('neutral', 0.1), stroke: S.tone('neutral', 0.4), sw: 1 }, g);
  const cText4 = S.text('50', { x: cX0 + boxW + gap + boxW / 2, y: matY + boxH + gap + 36, size: 22, anchor: 'middle', weight: 600, color: 'muted' }, g);

  const cLbl = S.text('Matrix C (Result)', { x: cX0 + boxW + gap / 2, y: matY - 14, size: 20, anchor: 'middle', weight: 700, color: 'struct' }, g);

  // Equation breakdown banner
  const eqBanner = S.pill('1 × 5 + 2 × 7  =  5 + 14  =  19 (ENTRY c₁₁)', {
    x: cx, y: matY + boxH * 2 + gap + 35, h: 42, tone: 'compute', size: 20, weight: 700
  }, g);

  // Decode vs Prefill Comparison Cards below
  const panW = 580;
  const panH = 95;
  const panY = cy + 95;

  const decCard = S.card({ x: cx - panW - 20, y: panY, w: panW, h: panH, tone: 'bytes', title: '' }, g);
  const decTitle = S.text('DECODE: MATRIX × VECTOR (1 COLUMN)', { x: cx - panW / 2 - 20, y: panY + 34, size: 20, anchor: 'middle', weight: 700, color: 'bytes' }, g);
  const decDesc = S.text('1 column of tokens: every weight read once (Zero reuse)', { x: cx - panW / 2 - 20, y: panY + 68, size: 18, anchor: 'middle', weight: 600, color: 'ink' }, g);
  decDesc.setAttribute('data-audit', 'ignore');

  const preCard = S.card({ x: cx + 20, y: panY, w: panW, h: panH, tone: 'helps', title: '' }, g);
  const preTitle = S.text('PREFILL: MATRIX × MATRIX (2,048 COLUMNS)', { x: cx + panW / 2 + 20, y: panY + 34, size: 20, anchor: 'middle', weight: 700, color: 'helps' }, g);
  const preDesc = S.text('2,048 prompt tokens: each weight reused 2,048 times', { x: cx + panW / 2 + 20, y: panY + 68, size: 18, anchor: 'middle', weight: 600, color: 'ink' }, g);
  preDesc.setAttribute('data-audit', 'ignore');

  const footer = S.pill('MATRIX MULTIPLICATION BRINGS DATA REUSE · MATRIX-VECTOR MULTIPLICATION DOES NOT', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'struct', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title,
    aBox1, aText1, aBox2, aText2, aBox3, aText3, aBox4, aText4, aLbl,
    mulSign,
    bBox1, bText1, bBox2, bText2, bBox3, bText3, bBox4, bText4, bLbl,
    eqSign,
    cBox1, cText1, cBox2, cText2, cBox3, cText3, cBox4, cText4, cLbl,
    eqBanner, decCard, decTitle, decDesc, preCard, preTitle, preDesc, footer
  };
}

/**
 * Creates the Scalar CUDA Core vs Hopper Tensor Core Visual
 */
function ch17CudaVsTensor(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const cardW = 630;
  const cardH = 460;
  const topY = cy - cardH / 2;

  // Left: Scalar CUDA Core
  const leftX = cx - cardW - 25;
  const leftCard = S.card({ x: leftX, y: topY, w: cardW, h: cardH, tone: 'neutral', title: '' }, g);
  const leftTitle = S.text('SCALAR CUDA CORE: 1 OP PER CYCLE', {
    x: leftX + cardW / 2, y: topY + 44, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);
  const leftSub = S.text('Executes d = a × b + c on Individual Numbers', {
    x: leftX + cardW / 2, y: topY + 80, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const leftDetails = [
    { label: 'Input operands:', desc: 'Three individual 32-bit scalars (a, b, c)' },
    { label: 'Operation:', desc: 'One fused multiply-add (FMA)' },
    { label: 'Output throughput:', desc: '1 scalar number per clock cycle' },
    { label: 'Execution unit:', desc: 'Standard pipelined arithmetic ALU' }
  ];

  const lElements = [];
  leftDetails.forEach((d, idx) => {
    const dy = topY + 120 + idx * 56;
    const box = S.card({ x: leftX + 30, y: dy, w: cardW - 60, h: 48, tone: 'neutral', title: '' }, g);
    const lt = S.text(`${d.label}  ${d.desc}`, { x: leftX + 45, y: dy + 31, size: 20, weight: 600, color: 'ink' }, g);
    lElements.push({ box, lt });
  });

  const leftPill = S.pill('1 OUTPUT PER CYCLE · GENERAL-PURPOSE MATH', {
    x: leftX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'neutral', size: 20, weight: 700
  }, g);

  // Right: Hopper Tensor Core
  const rightX = cx + 25;
  const rightCard = S.card({ x: rightX, y: topY, w: cardW, h: cardH, tone: 'compute', title: '' }, g);
  const rightTitle = S.text('HOPPER TENSOR CORE: 1,024 OPS / CYCLE', {
    x: rightX + cardW / 2, y: topY + 44, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const rightSub = S.text('Executes D = A × B + C on Whole Matrix Tiles', {
    x: rightX + cardW / 2, y: topY + 80, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const rightDetails = [
    { label: 'Input operands:', desc: '2D tiles in registers & shared SRAM' },
    { label: 'Operation:', desc: '512 multiply-adds finished every single tick' },
    { label: 'Throughput:', desc: '1,024 operations per clock cycle' },
    { label: 'Warp MMA step:', desc: '16 × 8 × 16 = 2,048 FMAs (4 ticks)' }
  ];

  const rElements = [];
  rightDetails.forEach((d, idx) => {
    const dy = topY + 120 + idx * 56;
    const box = S.card({ x: rightX + 30, y: dy, w: cardW - 60, h: 48, tone: 'neutral', title: '' }, g);
    const rt = S.text(`${d.label}  ${d.desc}`, { x: rightX + 45, y: dy + 31, size: 20, weight: 600, color: 'compute' }, g);
    rElements.push({ box, rt });
  });

  const rightPill = S.pill('ONE TENSOR INSTRUCTION UNLEASHES THOUSANDS OF OPS', {
    x: rightX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'compute', size: 20, weight: 700
  }, g);

  return {
    group: g,
    leftCard, leftTitle, leftSub, lElements, leftPill,
    rightCard, rightTitle, rightSub, rElements, rightPill
  };
}

/**
 * Creates the Tile Scaling and Arithmetic Reuse Chart
 */
function ch17TileScaling(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('TILE SCALING: HOW LARGER TILES MULTIPLY DATA REUSE', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const tiles = [
    { size: '2 × 2 Tile', reuse: '2 Reuses per Element', intensity: '1 Operation / Byte', tone: 'bytes' },
    { size: '4 × 4 Tile', reuse: '4 Reuses per Element', intensity: '2 Operations / Byte', tone: 'bytes' },
    { size: '16 × 16 Tile', reuse: '16 Reuses per Element', intensity: '8 Operations / Byte', tone: 'compute' },
    { size: '128 × 128 Tile', reuse: '128 Reuses per Element', intensity: '64 Operations / Byte', tone: 'helps' }
  ];

  const rowX0 = cx - 580;
  const rowW = 1160;
  const startY = cy - 150;
  const rowEls = [];

  tiles.forEach((t, idx) => {
    const ry = startY + idx * 65;
    const rc = S.card({ x: rowX0, y: ry, w: rowW, h: 56, tone: t.tone, title: '' }, g);
    const ts = S.text(t.size, { x: rowX0 + 24, y: ry + 36, size: 20, weight: 700, color: 'ink' }, g);
    const tr = S.text(t.reuse, { x: rowX0 + 360, y: ry + 36, size: 20, weight: 600, color: 'ink' }, g);
    const ti = S.text(t.intensity, { x: rowX0 + rowW - 24, y: ry + 36, size: 20, anchor: 'end', weight: 700, color: t.tone }, g);
    rowEls.push({ rc, ts, tr, ti });
  });

  const footer = S.pill('DATA REUSE GROWS WITH TILE WIDTH · TURNS MEMORY-BOUND JOBS INTO COMPUTE-BOUND', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return { group: g, card, title, rowEls, footer };
}

/**
 * Creates the Transformer Pie & Peak vs Sustained Efficiency Visual
 */
function ch17TransformerPie(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const cardW = 630;
  const cardH = 460;
  const topY = cy - cardH / 2;

  // Left: Transformer Arithmetic Breakdown
  const leftX = cx - cardW - 25;
  const leftCard = S.card({ x: leftX, y: topY, w: cardW, h: cardH, tone: 'compute', title: '' }, g);
  const leftTitle = S.text('WHERE TRANSFORMERS SPEND ARITHMETIC', {
    x: leftX + cardW / 2, y: topY + 44, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const leftSub = S.text('Why 528 Tensor Cores Exist on One H100 Die', {
    x: leftX + cardW / 2, y: topY + 80, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const pieRows = [
    { name: 'Matrix Multiplications (GEMMs):', pct: '92% of all arithmetic', col: 'compute' },
    { name: 'LayerNorm & Residual Adds:', pct: '5% of operations', col: 'ink' },
    { name: 'Softmax & Non-Linearities:', pct: '3% of operations', col: 'ink' }
  ];

  const pElements = [];
  pieRows.forEach((r, idx) => {
    const py = topY + 130 + idx * 65;
    const box = S.card({ x: leftX + 30, y: py, w: cardW - 60, h: 54, tone: 'neutral', title: '' }, g);
    const nl = S.text(r.name, { x: leftX + 45, y: py + 34, size: 20, weight: 600, color: 'ink' }, g);
    const vl = S.text(r.pct, { x: leftX + cardW - 45, y: py + 34, size: 20, anchor: 'end', weight: 700, color: r.col }, g);
    pElements.push({ box, nl, vl });
  });

  const leftPill = S.pill('OVER 90% OF TRANSFORMER COMPUTE IS MATRIX MULTIPLY', {
    x: leftX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'compute', size: 20, weight: 700
  }, g);

  // Right: Peak vs Sustained Efficiency
  const rightX = cx + 25;
  const rightCard = S.card({ x: rightX, y: topY, w: cardW, h: cardH, tone: 'helps', title: '' }, g);
  const rightTitle = S.text('PEAK HARDWARE CEILING VS REAL CODE', {
    x: rightX + cardW / 2, y: topY + 44, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const rightSub = S.text('Spec Sheet Maximum vs Sustained Kernel Performance', {
    x: rightX + cardW / 2, y: topY + 80, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const effRows = [
    { label: 'Spec sheet peak (100%):', val: '989.4 TFLOP/s (Theoretical)', col: 'muted' },
    { label: 'Superbly tuned kernel:', val: '50% to 80% of Peak Sustained', col: 'helps' },
    { label: 'Naive / uncoalesced code:', val: '10% to 25% of Peak (Stalled)', col: 'bytes' }
  ];

  const eElements = [];
  effRows.forEach((r, idx) => {
    const ey = topY + 130 + idx * 65;
    const box = S.card({ x: rightX + 30, y: ey, w: cardW - 60, h: 54, tone: 'neutral', title: '' }, g);
    const nl = S.text(r.label, { x: rightX + 45, y: ey + 34, size: 20, weight: 600, color: 'ink' }, g);
    const vl = S.text(r.val, { x: rightX + cardW - 45, y: ey + 34, size: 20, anchor: 'end', weight: 700, color: r.col }, g);
    eElements.push({ box, nl, vl });
  });

  const rightPill = S.pill('PEAK IS A CEILING · SOFTWARE IS SUSTAINED FRACTION', {
    x: rightX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g,
    leftCard, leftTitle, leftSub, pElements, leftPill,
    rightCard, rightTitle, rightSub, eElements, rightPill
  };
}
