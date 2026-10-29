/* ch03_common.js · Shared visual components for Chapter 3 ("Almost three hundred") */

/**
 * Creates an energy bar chart on a log scale (picojoules)
 * Values: 0.9 pJ (Add), 3.7 pJ (Mul), 5.0 pJ (SRAM), 640 pJ (DRAM)
 */
function ch03EnergyChart(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1320;
  const h = opts.h ?? 460;

  // Background panel
  const bgCard = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#0c1424', stroke: '#1d2c4d', sw: 2
  }, g);

  // Chart title
  const chartTitle = S.text('energy cost per operation (45 nm process)', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 650, color: 'ink'
  }, g);

  // 4 items to plot: [label, pJ, multiple, tone]
  const items = [
    { label: '32-bit float add', pJ: 0.9, mult: '1× baseline', tone: 'compute' },
    { label: '32-bit float multiply', pJ: 3.7, mult: '4.1×', tone: 'compute' },
    { label: '32-bit read from SRAM cache', pJ: 5.0, mult: '5.6×', tone: 'helps' },
    { label: '32-bit read from off-chip DRAM', pJ: 640.0, mult: '711×', tone: 'bytes' }
  ];

  // Log scale mapping: min 0.5 pJ -> max 1000 pJ (about 3.3 decades)
  const logMin = Math.log10(0.5);
  const logMax = Math.log10(1000);
  const barAreaX0 = cx - w / 2 + 420;
  const barAreaW = 540;

  function X(pj) {
    const frac = (Math.log10(pj) - logMin) / (logMax - logMin);
    return barAreaX0 + frac * barAreaW;
  }

  // Draw reference log grid lines (1, 10, 100, 1000 pJ)
  const gridLines = [];
  const refVals = [1, 10, 100, 1000];
  const gridY0 = cy - h / 2 + 75;
  const gridY1 = cy + h / 2 - 40;

  for (const v of refVals) {
    const gx = X(v);
    const line = S.line({
      x1: gx, y1: gridY0, x2: gx, y2: gridY1,
      stroke: '#1e2b45', sw: 1.5, dash: '4 4'
    }, g);
    line.setAttribute('data-audit', 'ignore');
    gridLines.push(line);

    const lbl = S.text(`${v} pJ`, {
      x: gx, y: gridY1 + 22, size: 20, anchor: 'middle', color: 'muted', family: 'mono'
    }, g);
    lbl.setAttribute('data-audit', 'ignore');
    gridLines.push(lbl);
  }

  // Bars
  const bars = [];
  const rowY0 = cy - h / 2 + 105;
  const rowH = 76;

  items.forEach((it, idx) => {
    const rowG = S.g(null, g);
    const ry = rowY0 + idx * rowH;
    const barW = Math.max(16, X(it.pJ) - barAreaX0);

    // Label on left
    const nameText = S.text(it.label, {
      x: barAreaX0 - 24, y: ry + 22, size: 22, anchor: 'end', color: it.tone, weight: 600
    }, rowG);

    // Bar rect
    const barRect = S.rect({
      x: barAreaX0, y: ry, w: barW, h: 36, r: 6,
      fill: S.tone(it.tone, 0.3), stroke: S.tone(it.tone), sw: 2
    }, rowG);

    // Value and multiplier on right of bar
    const valText = S.text(`${it.pJ} pJ (${it.mult})`, {
      x: barAreaX0 + barW + 20, y: ry + 24, size: 22, color: it.tone === 'bytes' ? 'bytes' : 'ink', weight: 650, family: 'mono'
    }, rowG);

    bars.push({ group: rowG, rect: barRect, name: nameText, val: valText, pJ: it.pJ, tone: it.tone, barW });
  });

  return { group: g, bgCard, chartTitle, gridLines, bars, X, barAreaX0 };
}

/**
 * Creates timeline rows comparing serial vs parallel execution
 */
function ch03ParallelTimeline(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;

  // Serial block container
  const sCard = S.card({
    x: cx - 600, y: 260, w: 1200, h: 130,
    tone: 'compute', title: ''
  }, g);
  const sTitle = S.text('serial execution: 1 worker · 4 time units', {
    x: cx - 560, y: 326, size: 22, weight: 650, color: 'compute'
  }, g);

  // Serial jobs: 4 consecutive blocks
  const sJobs = [];
  const sX0 = cx - 30;
  for (let j = 0; j < 4; j++) {
    const jx = sX0 + j * 145;
    const box = S.rect({
      x: jx, y: 295, w: 130, h: 54, r: 8,
      fill: S.tone('compute', 0.25), stroke: S.tone('compute'), sw: 2
    }, g);
    box.setAttribute('data-audit', 'ignore');
    const lbl = S.text(`job ${j + 1}`, {
      x: jx + 65, y: 329, size: 22, anchor: 'middle', weight: 650, color: 'ink'
    }, g);
    sJobs.push({ box, lbl });
  }

  // Parallel block container
  const pCard = S.card({
    x: cx - 600, y: 430, w: 1200, h: 220,
    tone: 'helps', title: ''
  }, g);
  const pTitle = S.text('parallel execution: 4 workers · 1 time unit', {
    x: cx - 560, y: 535, size: 22, weight: 650, color: 'helps'
  }, g);

  // Parallel jobs: 4 simultaneous rows
  const pJobs = [];
  const pX0 = cx - 30;
  for (let j = 0; j < 4; j++) {
    const jy = 445 + j * 50;
    const box = S.rect({
      x: pX0 - 10, y: jy, w: 280, h: 46, r: 6,
      fill: S.tone('helps', 0.25), stroke: S.tone('helps'), sw: 1.5
    }, g);
    const lbl = S.text(`worker ${j + 1}: job ${j + 1}`, {
      x: pX0 + 130, y: jy + 29, size: 20, anchor: 'middle', weight: 650, color: 'ink'
    }, g);
    pJobs.push({ box, lbl });
  }

  return { group: g, sCard, sTitle, sJobs, pCard, pTitle, pJobs };
}
