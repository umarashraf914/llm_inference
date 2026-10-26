/* ch05_common.js · Shared visual components for Chapter 5 ("The arithmetic units") */

/**
 * Horizontal bar chart comparing 32-bit CUDA, 16-bit CUDA, and 16-bit Tensor Cores
 */
function ch05ThroughputChart(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1260;
  const h = opts.h ?? 480;

  // Background card
  const bgCard = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('PEAK OPERATIONS PER SECOND ACROSS ALL 132 MULTIPROCESSORS', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Linear scale mapping: 0 -> 1050 TFLOP/s
  const barAreaX0 = cx - w / 2 + 360;
  const barAreaW = w - 480;
  const maxVal = 1050;

  function X(tflops) {
    return barAreaX0 + (tflops / maxVal) * barAreaW;
  }

  // Reference grid ticks (0, 250, 500, 750, 1000 TFLOP/s)
  const gridLines = [];
  const refVals = [0, 250, 500, 750, 1000];
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

    const lbl = S.text(`${v} TFLOP/s`, {
      x: gx, y: gridY1 + 22, size: 20, anchor: 'middle', color: 'muted'
    }, g);
    lbl.setAttribute('data-audit', 'ignore');
    gridLines.push(lbl);
  }

  // 3 Bar Rows:
  // 1. 16,896 CUDA cores · 32-bit: 66.9 TFLOP/s
  // 2. 16,896 CUDA cores · 16-bit paired: 133.8 TFLOP/s
  // 3. 528 Tensor cores · 16-bit: 989.4 TFLOP/s (7.4× ahead)
  const rows = [
    { label: 'CUDA Cores (32-bit)', val: 66.9, text: '66.9 TFLOP/s', tone: 'neutral' },
    { label: 'CUDA Cores (16-bit Paired)', val: 133.8, text: '133.8 TFLOP/s', tone: 'compute' },
    { label: 'Tensor Cores (16-bit)', val: 989.4, text: '989.4 TFLOP/s  (7.4× ahead)', tone: 'compute' }
  ];

  const bars = [];
  const rowY0 = cy - h / 2 + 110;
  const rowH = 95;

  rows.forEach((r, idx) => {
    const rowG = S.g(null, g);
    const ry = rowY0 + idx * rowH;
    const barW = Math.max(20, X(r.val) - barAreaX0);

    const lbl = S.text(r.label, {
      x: barAreaX0 - 24, y: ry + 26, size: 22, anchor: 'end',
      color: r.tone === 'compute' ? 'compute' : 'ink', weight: 700
    }, rowG);

    const bar = S.rect({
      x: barAreaX0, y: ry, w: barW, h: 42, r: 6,
      fill: r.tone === 'compute' ? S.tone('compute') : '#2c3a58',
      stroke: r.tone === 'compute' ? S.tone('compute') : '#ffffff', sw: 1
    }, rowG);

    const isInside = barW > 350;
    const valLbl = S.text(r.text, {
      x: isInside ? barAreaX0 + barW - 20 : barAreaX0 + barW + 20,
      y: ry + 28, size: 22, anchor: isInside ? 'end' : 'start',
      color: isInside ? '#0a0f1e' : (r.tone === 'compute' ? 'compute' : 'ink'),
      weight: 700
    }, rowG);

    bars.push({ group: rowG, bar, lbl, valLbl, val: r.val });
  });

  return { group: g, bgCard, title, gridLines, bars };
}
