/* ch16_common.js · Shared visual components for Chapter 16 ("The ridge") */

/**
 * Creates the H100 Roofline model plot
 */
function ch16RooflinePlot(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('H100 ROOFLINE MODEL: ATTAINABLE PERFORMANCE AND THE RIDGE', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Plot area inside card
  const plotX = cx - 560;
  const plotY = cy - 140;
  const plotW = 1120;
  const plotH = 260;

  // Background grid box
  const gridBox = S.rect({
    x: plotX, y: plotY, w: plotW, h: plotH, r: 6,
    fill: S.tone('neutral', 0.1), stroke: S.tone('neutral', 0.4), sw: 1
  }, g);

  // Ridge coordinates inside plot area
  // Log scale: X goes from 0.1 (plotX) to 10,000 (plotX + plotW)
  // 0.1 -> 1 -> 10 -> 100 -> 295 -> 1000 -> 10000 (5 decades)
  // log10(295) = 2.47; 0.1 is -1; range is 5 decades (-1 to 4).
  // fraction = (2.47 - (-1)) / 5 = 3.47 / 5 = 0.694
  const ridgeX = plotX + Math.round(plotW * 0.68); // ~760px from left
  const ceilY = plotY + 45; // top horizontal ceiling
  const roofStartY = plotY + plotH - 20; // bottom-left of slanted roof

  // Slanted memory roof path
  const slantedPath = S.path({
    d: `M ${plotX + 30} ${roofStartY} L ${ridgeX} ${ceilY}`,
    stroke: S.tone('bytes'), sw: 4
  }, g);
  slantedPath.setAttribute('data-audit', 'ignore');

  // Flat compute ceiling path
  const flatPath = S.path({
    d: `M ${ridgeX} ${ceilY} L ${plotX + plotW - 30} ${ceilY}`,
    stroke: S.tone('compute'), sw: 4
  }, g);
  flatPath.setAttribute('data-audit', 'ignore');

  // Ceiling labels
  const memRoofLbl = S.text('MEMORY-BOUND: RATE = 3.35 TB/s × INTENSITY', {
    x: plotX + 40, y: plotY + 36, size: 20, anchor: 'start', weight: 700, color: 'bytes'
  }, g);

  const compRoofLbl = S.text('COMPUTE-BOUND: 989.4 TFLOP/s CEILING', {
    x: plotX + plotW - 40, y: ceilY - 16, size: 20, anchor: 'end', weight: 700, color: 'compute'
  }, g);

  // Ridge vertical dashed line & label
  const ridgeLine = S.line({
    x1: ridgeX, y1: ceilY, x2: ridgeX, y2: plotY + plotH,
    stroke: S.tone('struct', 0.9), sw: 2
  }, g);
  ridgeLine.setAttribute('stroke-dasharray', '5 5');
  ridgeLine.setAttribute('data-audit', 'ignore');

  const ridgeBadge = S.pill('RIDGE: 295 OP / BYTE', {
    x: ridgeX, y: plotY + plotH + 28, h: 38, tone: 'struct', size: 18, weight: 700
  }, g);
  ridgeBadge.setAttribute('data-audit', 'ignore');

  // Markers helper function
  function createMarker(name, xPct, yPct, tone) {
    const mx = plotX + Math.round(plotW * xPct);
    const my = plotY + Math.round(plotH * yPct);
    const dot = S.circle({ cx: mx, cy: my, r: 9, fill: S.tone(tone), stroke: '#fff', sw: 2 }, g);
    const lbl = S.text(name, { x: mx, y: my + 24, size: 20, anchor: 'middle', weight: 700, color: tone }, g);
    return { dot, lbl, mx, my };
  }

  // Pre-created markers
  // Decode at 1 op/byte: fraction ~ (0 - (-1)) / 5 = 0.20 -> xPct: 0.22, yPct: 0.72
  const decodeMarker = createMarker('Decode (1 op/B)', 0.22, 0.72, 'bytes');

  // Prefill at 2,048 op/byte: fraction ~ (3.31 - (-1)) / 5 = 4.31 / 5 = 0.86 -> xPct: 0.86, yPct: 0.17
  const prefillMarker = createMarker('Prefill (~2,000 op/B)', 0.86, 0.17, 'compute');

  const footer = S.pill('BELOW 295 YOU WAIT ON MEMORY · ABOVE 295 YOU WAIT ON ARITHMETIC', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'struct', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title, gridBox, slantedPath, flatPath,
    memRoofLbl, compRoofLbl, ridgeLine, ridgeBadge,
    decodeMarker, prefillMarker, footer
  };
}

/**
 * Creates the Vector Add vs Matrix Multiply Comparison
 */
function ch16AlgorithmCards(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const cardW = 630;
  const cardH = 460;
  const topY = cy - cardH / 2;

  // Left: Vector Addition
  const leftX = cx - cardW - 25;
  const leftCard = S.card({ x: leftX, y: topY, w: cardW, h: cardH, tone: 'bytes', title: '' }, g);
  const leftTitle = S.text('VECTOR ADDITION: c[i] = a[i] + b[i]', {
    x: leftX + cardW / 2, y: topY + 44, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const leftSub = S.text('Deeply Memory-Bound (0.17 Operations / Byte)', {
    x: leftX + cardW / 2, y: topY + 80, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const leftDetails = [
    { title: 'Data read:', desc: '2 input floats (8 bytes)', col: 'ink' },
    { title: 'Data written:', desc: '1 output float (4 bytes)', col: 'ink' },
    { title: 'Total memory traffic:', desc: '12 bytes (or 6 bytes at 16-bit)', col: 'bytes' },
    { title: 'Arithmetic ops:', desc: '1 addition (0.17 ops / byte)', col: 'bytes' }
  ];

  const lElements = [];
  leftDetails.forEach((d, idx) => {
    const dy = topY + 120 + idx * 56;
    const box = S.card({ x: leftX + 30, y: dy, w: cardW - 60, h: 48, tone: 'neutral', title: '' }, g);
    const lt = S.text(`${d.title}  ${d.desc}`, { x: leftX + 45, y: dy + 31, size: 20, weight: 600, color: d.col }, g);
    lElements.push({ box, lt });
  });

  const leftPill = S.pill('LANDS FAR LEFT OF THE RIDGE (0.17 OP/B) · WAITS ON HBM', {
    x: leftX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  // Right: Matrix Multiplication
  const rightX = cx + 25;
  const rightCard = S.card({ x: rightX, y: topY, w: cardW, h: cardH, tone: 'compute', title: '' }, g);
  const rightTitle = S.text('MATRIX MULTIPLY: C = A × B (1,024 × 1,024)', {
    x: rightX + cardW / 2, y: topY + 44, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const rightSub = S.text('Compute-Bound (341 Operations / Byte)', {
    x: rightX + cardW / 2, y: topY + 80, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const rightDetails = [
    { title: 'Data footprint:', desc: 'Three 1,024 × 1,024 matrices (6.29 MB)', col: 'ink' },
    { title: 'Arithmetic ops:', desc: '2 × 1,024³ = 2.15 Billion operations', col: 'compute' },
    { title: 'Intensity:', desc: '2.15B ops ÷ 6.29 MB = 341.3 op/B', col: 'compute' },
    { title: 'Ridge position:', desc: 'Crosses 295 ridge (Compute-bound)', col: 'helps' }
  ];

  const rElements = [];
  rightDetails.forEach((d, idx) => {
    const dy = topY + 120 + idx * 56;
    const box = S.card({ x: rightX + 30, y: dy, w: cardW - 60, h: 48, tone: 'neutral', title: '' }, g);
    const rt = S.text(`${d.title}  ${d.desc}`, { x: rightX + 45, y: dy + 31, size: 20, weight: 600, color: d.col }, g);
    rElements.push({ box, rt });
  });

  const rightPill = S.pill('CROSSES RIGHT OF THE RIDGE (341 OP/B) · FULL TENSOR SPEED', {
    x: rightX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'compute', size: 20, weight: 700
  }, g);

  return {
    group: g,
    leftCard, leftTitle, leftSub, lElements, leftPill,
    rightCard, rightTitle, rightSub, rElements, rightPill
  };
}
