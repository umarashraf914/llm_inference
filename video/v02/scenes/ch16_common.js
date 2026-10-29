/* ch16_common.js · Visual components for Chapter 16 ("The ridge")
   Figs 84, 85, 86, 87 from atlas:
   - ch16Roofline: H100 Roofline model powered by libRoofline (Figs 84, 85, 86)
   - ch16TwoOperations: Vector addition vs Matrix multiply illustrated figures (Fig 87)
*/

/**
 * Creates the H100 Roofline model plot using libRoofline
 */
function ch16Roofline(S, opts = {}, parent) {
  const o = Object.assign({
    x: 460, y: 165, w: 1120, h: 590,
    peak: 989.4, bw: 3.352,
    regionLabels: ['memory bound', 'compute bound'],
    ridgeLabel: 'the ridge',
    peakTag: ['peak arithmetic', '989.4 trillion/s'],
    slopeLabel: 'bandwidth × intensity'
  }, opts);

  const R = libRoofline(S, o, parent);
  if (R.ridgeEl && R.ridgeEl.tagBg) {
    const curY = parseFloat(R.ridgeEl.tagBg.getAttribute('y') || '0');
    R.ridgeEl.tagBg.setAttribute('height', '42');
    R.ridgeEl.tagBg.setAttribute('y', String(curY - 2));
  }
  return R;
}

/**
 * Creates the illustrated comparison between Vector Add and Matrix Multiply (Atlas Fig 87)
 */
function ch16TwoOperations(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 485;
  const panelW = 680;
  const panelH = 430;
  const topY = cy - 235;

  // ---------------------------------------------------------------- Left: Vector Addition (0.17 op/byte)
  const leftX = cx - panelW - 25;
  const leftCard = S.rect({
    x: leftX, y: topY, w: panelW, h: panelH, r: 12,
    fill: '#151c2e', stroke: S.tone('bytes'), sw: 1.5
  }, g);

  const leftTitle = S.text('array addition · c[i] = a[i] + b[i]', {
    x: leftX + panelW / 2, y: topY + 36, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);

  // Illustrated Arrays A and B feeding Adder
  const arrY = topY + 65;
  const arrW = 500;
  const arrX = leftX + (panelW - arrW) / 2;

  // Array A
  const arrABox = S.rect({
    x: arrX, y: arrY, w: arrW, h: 50, r: 6,
    fill: '#1b233a', stroke: S.tone('bytes'), sw: 1
  }, g);
  const arrALbl = S.text('input a[i]: 2 bytes (16-bit float)', {
    x: arrX + arrW / 2, y: arrY + 32, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Array B
  const arrBBox = S.rect({
    x: arrX, y: arrY + 56, w: arrW, h: 50, r: 6,
    fill: '#1b233a', stroke: S.tone('bytes'), sw: 1
  }, g);
  const arrBLbl = S.text('input b[i]: 2 bytes (16-bit float)', {
    x: arrX + arrW / 2, y: arrY + 88, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Adder (+) node
  const addCircle = S.circle({
    cx: leftX + panelW / 2, cy: arrY + 134, r: 18,
    fill: '#241a14', stroke: S.tone('compute'), sw: 2
  }, g);
  const addPlus = S.text('+', {
    x: leftX + panelW / 2, y: arrY + 141, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  // Array C (output)
  const arrCBox = S.rect({
    x: arrX, y: arrY + 162, w: arrW, h: 50, r: 6,
    fill: '#1b233a', stroke: S.tone('bytes'), sw: 1
  }, g);
  const arrCLbl = S.text('output c[i]: 2 bytes written', {
    x: arrX + arrW / 2, y: arrY + 194, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Accounting box
  const leftAcc = S.rect({
    x: leftX + 30, y: topY + 280, w: panelW - 60, h: 84, r: 8,
    fill: '#101524', stroke: '#222f48', sw: 1
  }, g);
  const leftAccT1 = S.text('traffic: 2 reads (4 b) + 1 write (2 b) = 6 bytes', {
    x: leftX + panelW / 2, y: topY + 310, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);
  const leftAccT2 = S.text('intensity: 1 op ÷ 6 bytes = 0.17 op/byte', {
    x: leftX + panelW / 2, y: topY + 344, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);

  const leftPill = S.pill('1,735× below ridge · 99.9% waiting on hbm', {
    x: leftX + panelW / 2, y: topY + panelH - 30, h: 42, tone: 'bytes', size: 20, weight: 700, style: 'solid'
  }, g);

  // ---------------------------------------------------------------- Right: Matrix Multiply (341 op/byte)
  const rightX = cx + 25;
  const rightCard = S.rect({
    x: rightX, y: topY, w: panelW, h: panelH, r: 12,
    fill: '#151c2e', stroke: S.tone('compute'), sw: 1.5
  }, g);

  const rightTitle = S.text('matrix multiply · c = a × b (1,024 × 1,024)', {
    x: rightX + panelW / 2, y: topY + 36, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  // Illustrated 2D Matrices
  const matY = topY + 68;
  const matW = 520;
  const matBox = S.rect({
    x: rightX + (panelW - matW) / 2, y: matY, w: matW, h: 196, r: 8,
    fill: '#181e30', stroke: S.tone('compute'), sw: 1
  }, g);

  const matA = S.text('matrix a: 1,024 × 1,024 (2.097 mb)', {
    x: rightX + panelW / 2, y: matY + 38, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const matB = S.text('matrix b: 1,024 × 1,024 (2.097 mb)', {
    x: rightX + panelW / 2, y: matY + 78, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const matC = S.text('matrix c: 1,024 × 1,024 (2.097 mb)', {
    x: rightX + panelW / 2, y: matY + 118, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const matReuse = S.text('sram tiling: each weight reused 1,024×', {
    x: rightX + panelW / 2, y: matY + 164, size: 20, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  // Accounting box
  const rightAcc = S.rect({
    x: rightX + 30, y: topY + 280, w: panelW - 60, h: 84, r: 8,
    fill: '#101524', stroke: '#222f48', sw: 1
  }, g);
  const rightAccT1 = S.text('traffic: 3 matrices = 6.29 mb · math: 2.15b ops', {
    x: rightX + panelW / 2, y: topY + 310, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);
  const rightAccT2 = S.text('intensity: 2.15b ops ÷ 6.29 mb = 341.3 op/byte', {
    x: rightX + panelW / 2, y: topY + 344, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  const rightPill = S.pill('crosses right of ridge · full tensor core speed', {
    x: rightX + panelW / 2, y: topY + panelH - 30, h: 42, tone: 'compute', size: 20, weight: 700, style: 'solid'
  }, g);

  // ---------------------------------------------------------------- Bottom Comparison Ruler
  const rulerY = topY + panelH + 22;
  const rulerW = 1260;
  const rulerX = cx - rulerW / 2;

  const rulerBg = S.rect({
    x: rulerX, y: rulerY, w: rulerW, h: 82, r: 10,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const rulerTitle = S.text('intensity comparison (log):', {
    x: rulerX + 30, y: rulerY + 47, size: 20, weight: 700, color: 'muted'
  }, g);

  const addPt = S.pill('array add: 0.17', {
    x: rulerX + 460, y: rulerY + 41, h: 40, tone: 'bytes', size: 20, weight: 700, style: 'solid'
  }, g);

  const ridgePt = S.pill('ridge: 295', {
    x: rulerX + 780, y: rulerY + 41, h: 40, tone: 'struct', size: 20, weight: 700, style: 'solid'
  }, g);

  const matPt = S.pill('matmul: 341', {
    x: rulerX + 1100, y: rulerY + 41, h: 40, tone: 'compute', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g,
    // Left
    leftCard, leftTitle, arrABox, arrALbl, arrBBox, arrBLbl, addCircle, addPlus, arrCBox, arrCLbl,
    leftAcc, leftAccT1, leftAccT2, leftPill,
    // Right
    rightCard, rightTitle, matBox, matA, matB, matC, matReuse,
    rightAcc, rightAccT1, rightAccT2, rightPill,
    // Ruler
    rulerBg, rulerTitle, addPt, ridgePt, matPt
  };
}
