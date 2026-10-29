/* ch17_common.js · Visual components for Chapter 17 ("The tensor core")
   Figs 88, 89, 90, 91, 92, 93, 94 from atlas:
   - ch17MatMulSteps: 2x2 Matrix Multiplication row-meets-column & decode vs prefill (Fig 88)
   - ch17CudaVsTensor: Scalar FMA ALU vs Tensor Core 2D MMA Tile Engine (Figs 89, 90, 91)
   - ch17TileScaling: 2x2 -> 4x4 -> 16x16 -> 128x128 Tile geometry & n-fold reuse (Fig 92)
   - ch17TransformerPie: 92% GEMM budget bar & Peak vs Sustained efficiency bars (Figs 93, 94)
*/

/**
 * Creates the 2x2 Matrix Multiplication step-by-step visual (Atlas Fig 88)
 */
function ch17MatMulSteps(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('matrix multiplication · every row meets every column', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // 2x2 Matrix Grids
  const matY = cy - 125;
  const boxW = 58;
  const boxH = 58;
  const gap = 8;

  // Matrix A (Row 1 highlighted)
  const aX0 = cx - 440;
  const aBox1 = S.rect({ x: aX0, y: matY, w: boxW, h: boxH, r: 6, fill: '#2e1c12', stroke: S.tone('compute'), sw: 2 }, g);
  const aText1 = S.text('1', { x: aX0 + boxW / 2, y: matY + 37, size: 22, anchor: 'middle', weight: 700, color: 'compute' }, g);

  const aBox2 = S.rect({ x: aX0 + boxW + gap, y: matY, w: boxW, h: boxH, r: 6, fill: '#2e1c12', stroke: S.tone('compute'), sw: 2 }, g);
  const aText2 = S.text('2', { x: aX0 + boxW + gap + boxW / 2, y: matY + 37, size: 22, anchor: 'middle', weight: 700, color: 'compute' }, g);

  const aBox3 = S.rect({ x: aX0, y: matY + boxH + gap, w: boxW, h: boxH, r: 6, fill: '#141a2a', stroke: '#222f48', sw: 1 }, g);
  const aText3 = S.text('3', { x: aX0 + boxW / 2, y: matY + boxH + gap + 37, size: 22, anchor: 'middle', weight: 600, color: 'muted' }, g);

  const aBox4 = S.rect({ x: aX0 + boxW + gap, y: matY + boxH + gap, w: boxW, h: boxH, r: 6, fill: '#141a2a', stroke: '#222f48', sw: 1 }, g);
  const aText4 = S.text('4', { x: aX0 + boxW + gap + boxW / 2, y: matY + boxH + gap + 37, size: 22, anchor: 'middle', weight: 600, color: 'muted' }, g);

  const aLbl = S.text('matrix a (row 1)', { x: aX0 + boxW + gap / 2, y: matY - 14, size: 20, anchor: 'middle', weight: 700, color: 'compute' }, g);

  // Multiply symbol
  const mulSign = S.text('×', { x: cx - 270, y: matY + boxH + gap / 2 + 8, size: 28, anchor: 'middle', weight: 700, color: 'ink' }, g);

  // Matrix B (Col 1 highlighted)
  const bX0 = cx - 200;
  const bBox1 = S.rect({ x: bX0, y: matY, w: boxW, h: boxH, r: 6, fill: '#10241e', stroke: S.tone('helps'), sw: 2 }, g);
  const bText1 = S.text('5', { x: bX0 + boxW / 2, y: matY + 37, size: 22, anchor: 'middle', weight: 700, color: 'helps' }, g);

  const bBox2 = S.rect({ x: bX0 + boxW + gap, y: matY, w: boxW, h: boxH, r: 6, fill: '#141a2a', stroke: '#222f48', sw: 1 }, g);
  const bText2 = S.text('6', { x: bX0 + boxW + gap + boxW / 2, y: matY + 37, size: 22, anchor: 'middle', weight: 600, color: 'muted' }, g);

  const bBox3 = S.rect({ x: bX0, y: matY + boxH + gap, w: boxW, h: boxH, r: 6, fill: '#10241e', stroke: S.tone('helps'), sw: 2 }, g);
  const bText3 = S.text('7', { x: bX0 + boxW / 2, y: matY + boxH + gap + 37, size: 22, anchor: 'middle', weight: 700, color: 'helps' }, g);

  const bBox4 = S.rect({ x: bX0 + boxW + gap, y: matY + boxH + gap, w: boxW, h: boxH, r: 6, fill: '#141a2a', stroke: '#222f48', sw: 1 }, g);
  const bText4 = S.text('8', { x: bX0 + boxW + gap + boxW / 2, y: matY + boxH + gap + 37, size: 22, anchor: 'middle', weight: 600, color: 'muted' }, g);

  const bLbl = S.text('matrix b (col 1)', { x: bX0 + boxW / 2, y: matY - 14, size: 20, anchor: 'middle', weight: 700, color: 'helps' }, g);

  // Equals symbol
  const eqSign = S.text('=', { x: cx - 30, y: matY + boxH + gap / 2 + 8, size: 28, anchor: 'middle', weight: 700, color: 'ink' }, g);

  // Matrix C (Entry c11 highlighted)
  const cX0 = cx + 40;
  const cBox1 = S.rect({ x: cX0, y: matY, w: boxW, h: boxH, r: 6, fill: '#1a2238', stroke: S.tone('struct'), sw: 2 }, g);
  const cText1 = S.text('19', { x: cX0 + boxW / 2, y: matY + 37, size: 22, anchor: 'middle', weight: 700, color: 'struct' }, g);

  const cBox2 = S.rect({ x: cX0 + boxW + gap, y: matY, w: boxW, h: boxH, r: 6, fill: '#141a2a', stroke: '#222f48', sw: 1 }, g);
  const cText2 = S.text('22', { x: cX0 + boxW + gap + boxW / 2, y: matY + 37, size: 22, anchor: 'middle', weight: 600, color: 'muted' }, g);

  const cBox3 = S.rect({ x: cX0, y: matY + boxH + gap, w: boxW, h: boxH, r: 6, fill: '#141a2a', stroke: '#222f48', sw: 1 }, g);
  const cText3 = S.text('43', { x: cX0 + boxW / 2, y: matY + boxH + gap + 37, size: 22, anchor: 'middle', weight: 600, color: 'muted' }, g);

  const cBox4 = S.rect({ x: cX0 + boxW + gap, y: matY + boxH + gap, w: boxW, h: boxH, r: 6, fill: '#141a2a', stroke: '#222f48', sw: 1 }, g);
  const cText4 = S.text('50', { x: cX0 + boxW + gap + boxW / 2, y: matY + boxH + gap + 37, size: 22, anchor: 'middle', weight: 600, color: 'muted' }, g);

  const cLbl = S.text('matrix c (result)', { x: cX0 + boxW + gap / 2, y: matY - 14, size: 20, anchor: 'middle', weight: 700, color: 'struct' }, g);

  // Equation breakdown pill
  const eqBanner = S.pill('1 × 5 + 2 × 7  =  5 + 14  =  19 (entry c₁₁)', {
    x: cx, y: matY + boxH * 2 + gap + 38, h: 40, tone: 'compute', size: 20, weight: 700, style: 'solid'
  }, g);

  // Decode vs Prefill Comparison Panels below
  const panW = 620;
  const panH = 92;
  const panY = cy + 96;

  // Decode panel
  const decCard = S.rect({ x: cx - panW - 15, y: panY, w: panW, h: panH, r: 8, fill: '#181216', stroke: S.tone('bytes'), sw: 1.5 }, g);
  const decTitle = S.text('decode: matrix × vector (1 column)', { x: cx - panW / 2 - 15, y: panY + 34, size: 20, anchor: 'middle', weight: 700, color: 'bytes' }, g);
  const decDesc = S.text('1 token column: each weight read once (zero reuse)', { x: cx - panW / 2 - 15, y: panY + 68, size: 20, anchor: 'middle', weight: 600, color: 'ink' }, g);

  // Prefill panel
  const preCard = S.rect({ x: cx + 15, y: panY, w: panW, h: panH, r: 8, fill: '#10201a', stroke: S.tone('helps'), sw: 1.5 }, g);
  const preTitle = S.text('prefill: matrix × matrix (n columns)', { x: cx + panW / 2 + 15, y: panY + 34, size: 20, anchor: 'middle', weight: 700, color: 'helps' }, g);
  const preDesc = S.text('2,048 prompt tokens: each weight reused 2,048 times', { x: cx + panW / 2 + 15, y: panY + 68, size: 20, anchor: 'middle', weight: 600, color: 'ink' }, g);

  const footer = S.pill('matrix multiplication brings data reuse · matrix-vector multiplication does not', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'struct', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g, bg, title,
    aBox1, aText1, aBox2, aText2, aBox3, aText3, aBox4, aText4, aLbl,
    mulSign,
    bBox1, bText1, bBox2, bText2, bBox3, bText3, bBox4, bText4, bLbl,
    eqSign,
    cBox1, cText1, cBox2, cText2, cBox3, cText3, cBox4, cText4, cLbl,
    eqBanner, decCard, decTitle, decDesc, preCard, preTitle, preDesc, footer
  };
}

/**
 * Creates the Scalar CUDA Core vs Hopper Tensor Core Visual (Atlas Figs 89, 90, 91)
 */
function ch17CudaVsTensor(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 495;
  const cardW = 660;
  const cardH = 460;
  const topY = cy - cardH / 2;

  // ---------------------------------------------------------------- Left: Scalar CUDA Core
  const leftX = cx - cardW - 20;
  const leftCard = S.rect({
    x: leftX, y: topY, w: cardW, h: cardH, r: 12,
    fill: '#151c2e', stroke: '#222f48', sw: 1.5
  }, g);

  const leftTitle = S.text('scalar cuda core · scalar fma', {
    x: leftX + cardW / 2, y: topY + 36, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);
  const leftSub = S.text('executes d = a × b + c on single numbers', {
    x: leftX + cardW / 2, y: topY + 70, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  // Physical ALU Dataflow box
  const aluY = topY + 95;
  const aluBox = S.rect({
    x: leftX + 30, y: aluY, w: cardW - 60, h: 235, r: 8,
    fill: '#101524', stroke: '#222f48', sw: 1
  }, g);

  const aluInputs = S.text('inputs: three scalar numbers (a, b, c) from registers', {
    x: leftX + cardW / 2, y: aluY + 40, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Drawn ALU operator node
  const aluOp = S.circle({
    cx: leftX + cardW / 2, cy: aluY + 95, r: 24,
    fill: '#1e263d', stroke: S.tone('struct'), sw: 2
  }, g);
  const aluOpText = S.text('fma', {
    x: leftX + cardW / 2, y: aluY + 102, size: 20, anchor: 'middle', weight: 700, color: 'struct'
  }, g);

  const aluRate = S.text('throughput: 1 scalar result per clock cycle', {
    x: leftX + cardW / 2, y: aluY + 155, size: 20, anchor: 'middle', weight: 700, color: 'ink'
  }, g);
  const aluArch = S.text('standard pipelined arithmetic execution unit', {
    x: leftX + cardW / 2, y: aluY + 195, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const leftPill = S.pill('1 output per cycle · general-purpose arithmetic', {
    x: leftX + cardW / 2, y: topY + cardH - 36, h: 42, tone: 'struct', size: 20, weight: 700, style: 'solid'
  }, g);

  // ---------------------------------------------------------------- Right: Hopper Tensor Core
  const rightX = cx + 20;
  const rightCard = S.rect({
    x: rightX, y: topY, w: cardW, h: cardH, r: 12,
    fill: '#151c2e', stroke: S.tone('compute'), sw: 1.5
  }, g);

  const rightTitle = S.text('hopper tensor core · 2d tile mma', {
    x: rightX + cardW / 2, y: topY + 36, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const rightSub = S.text('executes D = A × B + C on whole matrix tiles', {
    x: rightX + cardW / 2, y: topY + 70, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  // Physical MMA Tile Engine Dataflow box
  const mmaBox = S.rect({
    x: rightX + 30, y: aluY, w: cardW - 60, h: 235, r: 8,
    fill: '#1a1820', stroke: S.tone('compute'), sw: 1
  }, g);

  const mmaTiles = S.text('operands: 2d matrix tiles staged in registers & sram', {
    x: rightX + cardW / 2, y: aluY + 40, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Drawn Tensor Core node
  const mmaOp = S.circle({
    cx: rightX + cardW / 2, cy: aluY + 95, r: 24,
    fill: '#2e1c12', stroke: S.tone('compute'), sw: 2
  }, g);
  const mmaOpText = S.text('mma', {
    x: rightX + cardW / 2, y: aluY + 102, size: 20, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  const mmaRate = S.text('throughput: 512 multiply-adds finished every tick', {
    x: rightX + cardW / 2, y: aluY + 155, size: 20, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const mmaWarp = S.text('warp step: 16 × 8 × 16 = 2,048 multiply-adds (4 ticks)', {
    x: rightX + cardW / 2, y: aluY + 195, size: 20, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  const rightPill = S.pill('1,024 ops per cycle · specialized matrix hardware', {
    x: rightX + cardW / 2, y: topY + cardH - 36, h: 42, tone: 'compute', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g,
    leftCard, leftTitle, leftSub, aluBox, aluInputs, aluOp, aluOpText, aluRate, aluArch, leftPill,
    rightCard, rightTitle, rightSub, mmaBox, mmaTiles, mmaOp, mmaOpText, mmaRate, mmaWarp, rightPill
  };
}

/**
 * Creates the Tile Scaling and Arithmetic Reuse Visual (Atlas Fig 92)
 */
function ch17TileScaling(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('tile scaling · how larger tiles multiply data reuse', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const tiles = [
    { size: '2 × 2 tile', reuse: '2 reuses per element', intensity: '1 operation / byte', tone: 'bytes' },
    { size: '4 × 4 tile', reuse: '4 reuses per element', intensity: '2 operations / byte', tone: 'bytes' },
    { size: '16 × 16 tile', reuse: '16 reuses per element', intensity: '8 operations / byte', tone: 'compute' },
    { size: '128 × 128 tile', reuse: '128 reuses per element', intensity: '64 operations / byte', tone: 'helps' }
  ];

  const rowX0 = cx - 580;
  const rowW = 1160;
  const startY = cy - 145;
  const rowEls = [];

  tiles.forEach((t, idx) => {
    const ry = startY + idx * 68;
    const rc = S.rect({
      x: rowX0, y: ry, w: rowW, h: 56, r: 8,
      fill: '#151c2e', stroke: S.tone(t.tone), sw: 1.5
    }, g);

    const ts = S.text(t.size, {
      x: rowX0 + 30, y: ry + 36, size: 20, weight: 700, color: 'ink'
    }, g);

    const tr = S.text(t.reuse, {
      x: rowX0 + 360, y: ry + 36, size: 20, weight: 600, color: 'ink'
    }, g);

    const ti = S.text(t.intensity, {
      x: rowX0 + rowW - 30, y: ry + 36, size: 20, anchor: 'end', weight: 700, color: t.tone
    }, g);

    rowEls.push({ rc, ts, tr, ti });
  });

  const footer = S.pill('data reuse grows with tile width · turns memory-bound jobs into compute-bound', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  return { group: g, bg, title, rowEls, footer };
}

/**
 * Creates the Transformer Arithmetic Budget & Peak vs Sustained Bars (Atlas Figs 93, 94)
 */
function ch17TransformerPie(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 495;
  const cardW = 660;
  const cardH = 460;
  const topY = cy - cardH / 2;

  // ---------------------------------------------------------------- Left: Transformer Budget
  const leftX = cx - cardW - 20;
  const leftCard = S.rect({
    x: leftX, y: topY, w: cardW, h: cardH, r: 12,
    fill: '#151c2e', stroke: S.tone('compute'), sw: 1.5
  }, g);

  const leftTitle = S.text('what a transformer spends arithmetic on', {
    x: leftX + cardW / 2, y: topY + 36, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const leftSub = S.text('why 528 tensor cores exist on one h100 die', {
    x: leftX + cardW / 2, y: topY + 70, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  // Proportional horizontal bar
  const barY = topY + 105;
  const barW = 560;
  const barX0 = leftX + (cardW - barW) / 2;

  // 92% GEMM bar
  const gemmW = Math.round(barW * 0.92);
  const gemmBar = S.rect({ x: barX0, y: barY, w: gemmW, h: 32, r: 6, fill: S.tone('compute'), stroke: '#fff', sw: 1 }, g);

  // 5% LayerNorm bar
  const normW = Math.round(barW * 0.05);
  const normBar = S.rect({ x: barX0 + gemmW + 2, y: barY, w: normW, h: 32, r: 4, fill: '#3b4560', stroke: '#fff', sw: 1 }, g);

  // 3% Softmax bar
  const softW = barW - gemmW - normW - 4;
  const softBar = S.rect({ x: barX0 + gemmW + normW + 4, y: barY, w: softW, h: 32, r: 4, fill: '#222f48', stroke: '#fff', sw: 1 }, g);

  // Row breakdown list
  const pieRows = [
    { name: 'matrix multiplies (qkv, mlp):', pct: '92% of arithmetic', col: 'compute' },
    { name: 'layernorm & residual additions:', pct: '5% of operations', col: 'ink' },
    { name: 'softmax & activation functions:', pct: '3% of operations', col: 'muted' }
  ];

  const pElements = [];
  pieRows.forEach((r, idx) => {
    const py = topY + 165 + idx * 56;
    const box = S.rect({
      x: leftX + 30, y: py, w: cardW - 60, h: 48, r: 6,
      fill: '#101524', stroke: '#222f48', sw: 1
    }, g);
    const nl = S.text(r.name, { x: leftX + 45, y: py + 31, size: 20, weight: 600, color: 'ink' }, g);
    const vl = S.text(r.pct, { x: leftX + cardW - 45, y: py + 31, size: 20, anchor: 'end', weight: 700, color: r.col }, g);
    pElements.push({ box, nl, vl });
  });

  const leftPill = S.pill('over 90% is matrix multiply · specialized silicon bet', {
    x: leftX + cardW / 2, y: topY + cardH - 32, h: 42, tone: 'compute', size: 20, weight: 700, style: 'solid'
  }, g);

  // ---------------------------------------------------------------- Right: Peak vs Sustained
  const rightX = cx + 20;
  const rightCard = S.rect({
    x: rightX, y: topY, w: cardW, h: cardH, r: 12,
    fill: '#151c2e', stroke: S.tone('helps'), sw: 1.5
  }, g);

  const rightTitle = S.text('peak hardware ceiling vs real code', {
    x: rightX + cardW / 2, y: topY + 36, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const rightSub = S.text('theoretical maximum vs real-world kernels', {
    x: rightX + cardW / 2, y: topY + 70, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  // 3 Efficiency Bars
  const effRows = [
    { label: 'spec sheet peak (100%):', val: '989.4 tflop/s', pct: 1.00, col: 'muted' },
    { label: 'superbly tuned kernel:', val: '50% to 80% sustained', pct: 0.70, col: 'helps' },
    { label: 'naive / uncoalesced code:', val: '10% to 25% sustained', pct: 0.20, col: 'bytes' }
  ];

  const eElements = [];
  effRows.forEach((r, idx) => {
    const ey = topY + 115 + idx * 72;
    const box = S.rect({
      x: rightX + 30, y: ey, w: cardW - 60, h: 62, r: 6,
      fill: '#101524', stroke: '#222f48', sw: 1
    }, g);
    const nl = S.text(r.label, { x: rightX + 45, y: ey + 28, size: 20, weight: 600, color: 'ink' }, g);
    const vl = S.text(r.val, { x: rightX + cardW - 45, y: ey + 28, size: 20, anchor: 'end', weight: 700, color: r.col }, g);

    // Progress bar inside box
    const barTrack = S.rect({ x: rightX + 45, y: ey + 38, w: cardW - 90, h: 12, r: 4, fill: '#1b2234' }, g);
    const barFill = S.rect({ x: rightX + 45, y: ey + 38, w: Math.round((cardW - 90) * r.pct), h: 12, r: 4, fill: S.tone(r.col) }, g);

    eElements.push({ box, nl, vl, barTrack, barFill });
  });

  const rightPill = S.pill('peak is a ceiling · software is sustained fraction', {
    x: rightX + cardW / 2, y: topY + cardH - 32, h: 42, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g,
    leftCard, leftTitle, leftSub, gemmBar, normBar, softBar, pElements, leftPill,
    rightCard, rightTitle, rightSub, eElements, rightPill
  };
}
