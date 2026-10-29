/* ch02_common.js · Shared visual components for Chapter 02 ("Two numbers and the words around them") */

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
 * Physical Bus Trace Comparison: RTX 4090 vs H100 (Fig 7)
 * Draws wire bundles to scale:
 * - RTX 4090: narrow 24 px ribbon (384 fast wires @ 21.0 Gb/s = 1,008 GB/s)
 * - H100: wide 180 px ribbon (5,120 wires @ 5.24 Gb/s = 3,352 GB/s; 13.3x more wires)
 */
function ch02BusDiagram(S, o = {}) {
  const g = o.parent || S.g();
  const cx = o.cx ?? 960, cy = o.cy ?? 520;
  const bw = 1100;
  const bx0 = cx - bw / 2;

  // RTX 4090: Top bundle
  const topY = cy - 130;
  const topH = 26; // narrow wire bundle
  const topGroup = S.g(null, g);

  const topTrack = S.rect({
    x: bx0, y: topY - topH / 2, w: bw, h: topH, r: 4,
    fill: '#0f1a30', stroke: S.tone('struct'), sw: 1.5
  }, topGroup);

  // 4 rapid wire lines inside
  for (let i = 1; i < 4; i++) {
    S.line({
      x1: bx0 + 6, y1: topY - topH / 2 + i * (topH / 4),
      x2: bx0 + bw - 6, y2: topY - topH / 2 + i * (topH / 4),
      stroke: S.tone('struct'), sw: 2, strokeOpacity: 0.7, dash: '8 4'
    }, topGroup);
  }

  const topTitle = S.text('RTX 4090 · 384 wires @ 21.0 Gb/s', {
    x: bx0, y: topY - 30, size: 22, color: 'struct', weight: 650, family: 'mono'
  }, topGroup);

  const topBw = S.pill('1,008 GB/s bandwidth', {
    x: bx0 + bw - 140, y: topY - 30, h: 36, tone: 'struct', size: 20, weight: 650, mono: true
  });
  topGroup.appendChild(topBw);

  // H100: Bottom bundle (13.3x wider wire bundle representation)
  const btmY = cy + 120;
  const btmH = 180;
  const btmGroup = S.g(null, g);

  const btmTrack = S.rect({
    x: bx0, y: btmY - btmH / 2, w: bw, h: btmH, r: 8,
    fill: '#1c0e14', stroke: S.tone('bytes'), sw: 2
  }, btmGroup);

  // Dense parallel wire traces
  const wireCount = 14;
  for (let i = 1; i < wireCount; i++) {
    S.line({
      x1: bx0 + 8, y1: btmY - btmH / 2 + i * (btmH / wireCount),
      x2: bx0 + bw - 8, y2: btmY - btmH / 2 + i * (btmH / wireCount),
      stroke: S.tone('bytes'), sw: 2, strokeOpacity: 0.5, dash: '4 4'
    }, btmGroup);
  }

  const btmTitle = S.text('H100 · 5,120 wires @ 5.24 Gb/s (13.3× more wires)', {
    x: bx0, y: btmY - btmH / 2 - 20, size: 22, color: 'bytes', weight: 650, family: 'mono'
  }, btmGroup);

  const btmBw = S.pill('3,352 GB/s (3.35 TB/s)', {
    x: bx0 + bw - 150, y: btmY - btmH / 2 - 20, h: 38, tone: 'bytes', size: 20, weight: 700, mono: true
  });
  btmGroup.appendChild(btmBw);

  const btmSub = S.text('4× slower clock, yet 3.3× higher total bandwidth', {
    x: cx, y: btmY + btmH / 2 + 34, size: 22, anchor: 'middle', color: 'muted', weight: 550
  }, btmGroup);

  return {
    g, topGroup, topTrack, topTitle, topBw,
    btmGroup, btmTrack, btmTitle, btmBw, btmSub, cx, cy
  };
}

/**
 * Miniature physical package builder for Chapter 02 (Fig 8):
 * - Central compute die
 * - 5 active HBM3 stacks surrounding it
 */
function ch02Package(S, o = {}) {
  const g = o.parent || S.g();
  const cx = o.cx ?? 500, cy = o.cy ?? 530;
  const pw = o.pw ?? 580, ph = o.ph ?? 500;
  const dieSize = o.dieSize ?? 180;

  const pkg = S.g(null, g);
  S.rect({
    x: cx - pw / 2, y: cy - ph / 2, w: pw, h: ph, r: 20,
    fill: '#080d1a', stroke: '#22304e', sw: 3
  }, pkg);

  // Central compute die
  const die = S.g(null, pkg);
  S.rect({
    x: cx - dieSize / 2, y: cy - dieSize / 2, w: dieSize, h: dieSize, r: 6,
    fill: '#15100a', stroke: S.tone('compute'), sw: 2.5
  }, die);
  S.rect({
    x: cx - dieSize / 2 + 8, y: cy - dieSize / 2 + 8, w: dieSize - 16, h: dieSize - 16, r: 4,
    fill: 'url(#die-grid)'
  }, die);
  S.text('compute die', {
    x: cx, y: cy - 10, size: 22, anchor: 'middle', weight: 650, family: 'mono', color: 'compute'
  }, die);
  S.text('H100 silicon', {
    x: cx, y: cy + 22, size: 20, anchor: 'middle', weight: 550, color: 'ink'
  }, die);

  // 5 active HBM3 memory stacks
  const stackW = 142, stackH = 96;
  const stackSpacing = 110;
  const stackCoords = [
    { x: cx - dieSize / 2 - stackW - 16, y: cy - stackSpacing },
    { x: cx - dieSize / 2 - stackW - 16, y: cy },
    { x: cx - dieSize / 2 - stackW - 16, y: cy + stackSpacing },
    { x: cx + dieSize / 2 + 16, y: cy - stackSpacing / 2 },
    { x: cx + dieSize / 2 + 16, y: cy + stackSpacing / 2 },
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
      fill: '#220e15', stroke: S.tone('bytes'), sw: 2
    }, sg);
    S.text('HBM3', {
      x: pos.x + stackW / 2, y: pos.y - 12, size: 20, anchor: 'middle', weight: 650, family: 'mono', color: 'bytes'
    }, sg);
    S.text('1,024 wires', {
      x: pos.x + stackW / 2, y: pos.y + 18, size: 20, anchor: 'middle', weight: 550, color: 'ink'
    }, sg);
    return sg;
  });

  return { pkg, die, stacks, cx, cy, pw, ph, dieSize };
}
