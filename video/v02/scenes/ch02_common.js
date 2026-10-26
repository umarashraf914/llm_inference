/* Shared builders for chapter 2 (Two numbers and the words around them). Loaded before every ch02 scene. */

/**
 * Logarithmic time axis from 0.1 ns (10^-10 s) to 100 ms (10^-1 s), spanning 9 orders of magnitude (Fig 9).
 * Returns { g, axis, ticks, X(seconds), x0, x1, y }
 */
function ch02LogTimeAxis(S, o = {}) {
  const g = o.parent || S.g();
  const x0 = o.x0 ?? 180, x1 = o.x1 ?? 1740, y = o.y ?? 540;
  const logMin = -10; // 10^-10 s = 0.1 ns
  const logMax = -1;  // 10^-1 s = 100 ms
  const totalDecades = logMax - logMin;

  const X = sec => {
    const val = Math.max(1e-10, Math.min(0.1, sec));
    const decade = Math.log10(val);
    const frac = (decade - logMin) / totalDecades;
    return x0 + frac * (x1 - x0);
  };

  const axis = S.line({ x1: x0 - 20, y1: y, x2: x1 + 20, y2: y, stroke: '#334466', sw: 3 }, g);

  // 10 decade markers
  const labels = ['0.1 ns', '1 ns', '10 ns', '100 ns', '1 µs', '10 µs', '100 µs', '1 ms', '10 ms', '100 ms'];
  const ticks = [];
  for (let d = 0; d <= totalDecades; d++) {
    const sec = Math.pow(10, logMin + d);
    const tx = X(sec);
    const tg = S.g(null, g);
    S.line({ x1: tx, y1: y - 12, x2: tx, y2: y + 12, stroke: '#556b99', sw: 2.5 }, tg);
    S.text(labels[d], { x: tx, y: y + 38, size: 22, anchor: 'middle', family: 'mono', color: 'muted', weight: 600 }, tg);
    ticks.push(tg);
  }

  return { g, axis, ticks, X, x0, x1, y };
}

/**
 * Bus trace comparison: RTX 4090 vs H100 (Fig 7)
 * - RTX 4090: 384 wires, 21.0 Gb/s, 1,008 GB/s
 * - H100: 5,120 wires (13.3× wider), 5.24 Gb/s, 3,352 GB/s
 */
function ch02BusDiagram(S, o = {}) {
  const g = o.parent || S.g();
  const cx = o.cx ?? 960, cy = o.cy ?? 520;

  // RTX 4090 bar (top)
  const topY = cy - 130;
  const topCard = S.card({
    x: cx - 520, y: topY - 70, w: 1040, h: 120,
    tone: 'struct', title: ''
  }, g);
  const topTitle = S.text('RTX 4090 · GAMING BUS', { x: cx - 490, y: topY - 32, size: 22, color: 'struct', weight: 700 }, g);
  const topWires = S.text('384 wires @ 21.0 Gb/s', { x: cx - 490, y: topY + 8, size: 24, family: 'mono', color: 'ink', weight: 600 }, g);
  const topBw = S.pill('1,008 GB/s', { x: cx + 410, y: topY - 10, h: 44, tone: 'struct', size: 24, weight: 700 }, g);

  // H100 bar (bottom - 13.3× wider footprint representation)
  const btmY = cy + 110;
  const btmCard = S.card({
    x: cx - 520, y: btmY - 90, w: 1040, h: 180,
    tone: 'bytes', title: ''
  }, g);
  const btmTitle = S.text('H100 · HIGH BANDWIDTH MEMORY BUS', { x: cx - 490, y: btmY - 50, size: 22, color: 'bytes', weight: 700 }, g);
  const btmWires = S.text('5,120 wires @ 5.24 Gb/s (13.3× more wires!)', { x: cx - 490, y: btmY - 8, size: 24, family: 'mono', color: 'ink', weight: 600 }, g);
  const btmSub = S.text('4× slower clock, yet 3.3× higher total bandwidth', { x: cx - 490, y: btmY + 36, size: 22, color: 'muted', weight: 550 }, g);
  const btmBw = S.pill('3,352 GB/s', { x: cx + 410, y: btmY - 8, h: 50, tone: 'bytes', size: 26, weight: 700 }, g);

  return {
    g, topCard, topTitle, topWires, topBw,
    btmCard, btmTitle, btmWires, btmSub, btmBw, cx, cy
  };
}

/**
 * Compact physical package builder for chapter 2 (Fig 8):
 * - Central compute die
 * - 5 active HBM3 stacks surrounding it
 */
function ch02Package(S, o = {}) {
  const g = o.parent || S.g();
  const cx = o.cx ?? 500, cy = o.cy ?? 530;
  const pw = o.pw ?? 560, ph = o.ph ?? 500;
  const dieSize = o.dieSize ?? 220;

  const pkg = S.g(null, g);
  S.rect({
    x: cx - pw / 2, y: cy - ph / 2, w: pw, h: ph, r: 20,
    fill: '#080d1a', stroke: '#22304e', sw: 3
  }, pkg);

  // Central compute die
  const die = S.g(null, pkg);
  S.rect({
    x: cx - dieSize / 2, y: cy - dieSize / 2, w: dieSize, h: dieSize, r: 6,
    fill: 'url(#card-compute)', stroke: S.tone('compute'), sw: 2.5
  }, die);
  S.text('COMPUTE DIE', {
    x: cx, y: cy - 10, size: 22, anchor: 'middle', weight: 700, family: 'mono', color: 'compute'
  }, die);
  S.text('H100 Silicon', {
    x: cx, y: cy + 20, size: 22, anchor: 'middle', weight: 500, color: 'ink'
  }, die);

  // 5 HBM3 stacks
  const stackW = 76, stackH = 95;
  const spacing = 110;
  const stackCoords = [
    { x: cx - dieSize / 2 - stackW - 20, y: cy - spacing },
    { x: cx - dieSize / 2 - stackW - 20, y: cy },
    { x: cx - dieSize / 2 - stackW - 20, y: cy + spacing },
    { x: cx + dieSize / 2 + 20, y: cy - spacing },
    { x: cx + dieSize / 2 + 20, y: cy },
  ];

  const stacks = stackCoords.map((pos, i) => {
    const sg = S.g(null, pkg);
    S.line({
      x1: pos.x < cx ? pos.x + stackW : pos.x,
      y1: pos.y,
      x2: pos.x < cx ? cx - dieSize / 2 : cx + dieSize / 2,
      y2: pos.y,
      stroke: S.tone('bytes'), sw: 5, strokeOpacity: 0.6, dash: '4 3'
    }, sg);
    S.rect({
      x: pos.x, y: pos.y - stackH / 2, w: stackW, h: stackH, r: 6,
      fill: 'url(#card-bytes)', stroke: S.tone('bytes'), sw: 2
    }, sg);
    S.text('HBM3', {
      x: pos.x + stackW / 2, y: pos.y - 8, size: 18, anchor: 'middle', weight: 700, family: 'mono', color: 'bytes'
    }, sg);
    S.text('1,024 wires', {
      x: pos.x + stackW / 2, y: pos.y + 16, size: 14, anchor: 'middle', weight: 600, color: 'ink'
    }, sg);
    sg.setAttribute('data-audit', 'ignore');
    return sg;
  });

  return { g: pkg, cx, cy };
}
