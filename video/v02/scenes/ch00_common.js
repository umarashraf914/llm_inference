/* ch00_common.js · Shared visual components for Chapter 00 ("Cold open: a thousand trillion, waiting") */

/**
 * Physical Silicon Compute Die
 * Represents the 29 mm x 29 mm (814 mm²) H100 die with internal 132 SM micro-grid.
 */
function ch00Die(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 460;
  const size = opts.size ?? 260; // 260x260 px square
  const half = size / 2;

  // Substrate / carrier plate
  const subPad = 26;
  const subW = size + subPad * 2;
  const subH = size + subPad * 2;
  const substrate = S.rect({
    x: cx - subW / 2, y: cy - subH / 2, w: subW, h: subH, r: 16,
    fill: '#0d1527', stroke: '#223254', sw: 2, filter: 'url(#shadow)'
  }, g);

  // Pin perimeter marks on substrate
  const pinGroup = S.g(null, g);
  const pinCount = 14;
  const step = subW / (pinCount + 1);
  for (let i = 1; i <= pinCount; i++) {
    // Top & bottom edge gold pins
    S.line({ x1: cx - subW / 2 + i * step, y1: cy - subH / 2 + 3, x2: cx - subW / 2 + i * step, y2: cy - subH / 2 + 12, stroke: '#d4af37', sw: 2, strokeOpacity: 0.7 }, pinGroup);
    S.line({ x1: cx - subW / 2 + i * step, y1: cy + subH / 2 - 12, x2: cx - subW / 2 + i * step, y2: cy + subH / 2 - 3, stroke: '#d4af37', sw: 2, strokeOpacity: 0.7 }, pinGroup);
    // Left & right edge pins
    S.line({ x1: cx - subW / 2 + 3, y1: cy - subH / 2 + i * step, x2: cx - subW / 2 + 12, y2: cy - subH / 2 + i * step, stroke: '#d4af37', sw: 2, strokeOpacity: 0.7 }, pinGroup);
    S.line({ x1: cx + subW / 2 - 12, y1: cy - subH / 2 + i * step, x2: cx + subW / 2 - 3, y2: cy - subH / 2 + i * step, stroke: '#d4af37', sw: 2, strokeOpacity: 0.7 }, pinGroup);
  }

  // Silicon die body
  const dieBody = S.rect({
    x: cx - half, y: cy - half, w: size, h: size, r: 8,
    fill: '#15110a', stroke: S.tone('compute'), strokeOpacity: 0.9, sw: 2.5
  }, g);

  // Pin 1 orientation dot (top-left)
  const pin1 = S.circle({ cx: cx - half + 14, cy: cy - half + 14, r: 3.5, fill: '#d4af37' }, g);

  // Internal microscopic 11 x 12 SM grid (132 Streaming Multiprocessors)
  const smGrid = S.g(null, g);
  const rows = 11, cols = 12;
  const pad = 12;
  const gw = size - pad * 2;
  const gh = size - pad * 2;
  const cw = gw / cols;
  const ch = gh / rows;
  const smCells = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = S.rect({
        x: cx - half + pad + c * cw + 1,
        y: cy - half + pad + r * ch + 1,
        w: cw - 2, h: ch - 2, r: 2,
        fill: S.tone('compute'), fillOpacity: 0.12,
        stroke: S.tone('compute'), strokeOpacity: 0.35, sw: 1
      }, smGrid);
      smCells.push(cell);
    }
  }

  // Cross channel bus lines inside die
  const crossBus = S.g(null, g);
  S.line({ x1: cx - half + pad, y1: cy, x2: cx + half - pad, y2: cy, stroke: S.tone('compute'), strokeOpacity: 0.7, sw: 2 }, crossBus);
  S.line({ x1: cx, y1: cy - half + pad, x2: cx, y2: cy + half - pad, stroke: S.tone('compute'), strokeOpacity: 0.7, sw: 2 }, crossBus);

  // Dimensions & Labels
  const topBracket = S.bracket({
    x1: cx - half, x2: cx + half, y: cy - half - 16,
    label: '29 mm', up: true
  }, g);

  // Right edge bracket
  const rightBracket = S.g(null, g);
  const rbX = cx + half + 18;
  S.line({ x1: rbX, y1: cy - half, x2: rbX + 8, y2: cy - half, stroke: S.tone('muted'), sw: 2 }, rightBracket);
  S.line({ x1: rbX, y1: cy + half, x2: rbX + 8, y2: cy + half, stroke: S.tone('muted'), sw: 2 }, rightBracket);
  S.line({ x1: rbX + 4, y1: cy - half, x2: rbX + 4, y2: cy + half, stroke: S.tone('muted'), sw: 2 }, rightBracket);
  const sideLabel = S.text('29 mm', { x: rbX + 16, y: cy + 6, size: 22, anchor: 'start', color: 'muted', weight: 600, family: 'mono' }, rightBracket);

  const areaPill = S.pill('814 mm²', {
    x: cx, y: cy + half + 42, h: 36, tone: 'compute', size: 20, weight: 650, mono: true
  });
  g.appendChild(areaPill);

  const dieLabel = S.text('compute die', {
    x: cx, y: cy + half + 84, size: 24, anchor: 'middle', color: 'compute', weight: 600
  }, g);

  return {
    group: g, cx, cy, size, half,
    substrate, pinGroup, dieBody, pin1, smGrid, smCells, crossBus,
    topBracket, rightBracket, areaPill, dieLabel
  };
}

/**
 * Proportional 30 ms Token Execution Timeline
 * Accurately contrasts < 1% arithmetic (~0.1 ms) against > 99% waiting (~30 ms).
 */
function ch00ProportionalTimeline(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 740;
  const w = opts.w ?? 1380;
  const h = opts.h ?? 58;
  const x0 = cx - w / 2;

  // Background track
  const track = S.rect({
    x: x0, y: cy - h / 2, w, h, r: 8,
    fill: '#0b1222', stroke: '#1c2844', sw: 2
  }, g);

  // Proportional calculation width: 0.1 ms of 30 ms is 0.33%, visually clamped to 14px
  const calcW = Math.max(14, Math.round(w * (0.14 / 30)));
  const waitW = w - calcW;

  // Diagonal hatch lines for waiting section
  const hatchGroup = S.g(null, g);
  const waitX = x0 + calcW;
  const waitRect = S.rect({
    x: waitX, y: cy - h / 2, w: waitW, h, r: 6,
    fill: S.tone('bytes', 0.18), stroke: S.tone('bytes', 0.8), sw: 1.5
  }, hatchGroup);

  // Fine diagonal lines inside waitRect
  const linesG = S.g(null, hatchGroup);
  const lineSpacing = 16;
  const numLines = Math.floor((waitW + h) / lineSpacing);
  for (let i = 0; i < numLines; i++) {
    const lx1 = waitX + i * lineSpacing;
    const ly1 = cy + h / 2;
    const lx2 = lx1 + h;
    const ly2 = cy - h / 2;
    if (lx1 >= waitX && lx2 <= waitX + waitW) {
      S.line({ x1: lx1, y1: ly1, x2: lx2, y2: ly2, stroke: S.tone('bytes'), strokeOpacity: 0.14, sw: 1.5 }, linesG);
    }
  }

  // Arithmetic sliver (amber solid glow)
  const calcRect = S.rect({
    x: x0, y: cy - h / 2, w: calcW, h, r: 6,
    fill: S.tone('compute'), stroke: S.tone('compute'), sw: 2,
    filter: 'url(#glow-compute)'
  }, g);

  // Top labels
  const calcLeader = S.g(null, g);
  S.line({ x1: x0 + calcW / 2, y1: cy - h / 2, x2: x0 + calcW / 2, y2: cy - h / 2 - 24, stroke: S.tone('compute'), sw: 1.5 }, calcLeader);
  const calcLabel = S.text('arithmetic: < 1% (≈ 0.1 ms)', {
    x: x0 + calcW / 2 + 8, y: cy - h / 2 - 34, size: 22, anchor: 'start', color: 'compute', weight: 650
  }, calcLeader);

  const waitLabel = S.text('waiting for data from memory: > 99% (≈ 30 ms)', {
    x: waitX + waitW / 2, y: cy + 1, size: 22, anchor: 'middle', color: 'ink', weight: 650
  }, hatchGroup);

  // Bottom time bracket (0 ms to 30 ms)
  const timeBracket = S.bracket({
    x1: x0, x2: x0 + w, y: cy + h / 2 + 14,
    label: 'one generated token: 30 ms', up: false
  }, g);

  return {
    group: g, cx, cy, w, h, x0,
    track, calcRect, calcLeader, calcLabel,
    waitRect, linesG, waitLabel, timeBracket
  };
}

/**
 * Complete H100 Package Graphic with 5 HBM3 Stacks & 5,120-Wire Interposer Bus
 */
function ch00Package(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const scale = opts.scale ?? 1;

  const pw = 840 * scale;
  const ph = 460 * scale;

  // Substrate
  const substrate = S.rect({
    x: cx - pw / 2, y: cy - ph / 2, w: pw, h: ph, r: 24 * scale,
    fill: '#0c1424', stroke: '#1d2c4d', sw: 2.5, filter: 'url(#shadow)'
  }, g);

  // Central compute die
  const dw = 260 * scale, dh = 260 * scale;
  const dieGroup = S.g(null, g);
  const dieRect = S.rect({
    x: cx - dw / 2, y: cy - dh / 2, w: dw, h: dh, r: 10 * scale,
    fill: '#18120a', stroke: S.tone('compute'), strokeOpacity: 0.9, sw: 2.5
  }, dieGroup);
  const dieGrid = S.rect({
    x: cx - dw / 2 + 8 * scale, y: cy - dh / 2 + 8 * scale,
    w: dw - 16 * scale, h: dh - 16 * scale, r: 6 * scale,
    fill: 'url(#die-grid)'
  }, dieGroup);
  const dieLabel = S.text('compute die', {
    x: cx, y: cy + dh / 2 + 30 * scale, size: 22 * scale, anchor: 'middle', color: 'compute', weight: 650
  }, dieGroup);

  // Five HBM3 stacks: 3 on left, 2 on right (as on physical H100 with 5 populated stacks)
  const sw = 110 * scale, sh = 88 * scale, gapY = 16 * scale;
  const leftTotalH = 3 * sh + 2 * gapY;
  const rightTotalH = 2 * sh + 1 * gapY;

  const stacks = [];
  const buses = [];

  // Left 3 stacks
  for (let i = 0; i < 3; i++) {
    const sx = cx - pw / 2 + 38 * scale;
    const sy = cy - leftTotalH / 2 + i * (sh + gapY);
    // Left 3 stacks
    const stG = S.g(null, g);
    S.rect({ x: sx, y: sy, w: sw, h: sh, r: 8 * scale, fill: '#220e15', stroke: S.tone('bytes'), strokeOpacity: 0.85, sw: 2 }, stG);
    // Layer lines in lower half
    const lineY0 = sy + 36 * scale;
    for (let k = 1; k < 4; k++) {
      S.line({ x1: sx + 8 * scale, y1: lineY0 + k * 12 * scale, x2: sx + sw - 8 * scale, y2: lineY0 + k * 12 * scale, stroke: S.tone('bytes'), strokeOpacity: 0.35, sw: 1.5 }, stG);
    }
    S.text('HBM3', { x: sx + sw / 2, y: sy + 22 * scale, size: 22 * scale, anchor: 'middle', color: 'bytes', weight: 650 }, stG);
    stacks.push(stG);

    // Bus path from stack to die
    const bx1 = sx + sw, bx2 = cx - dw / 2;
    const by = sy + sh / 2, dy = cy - dh / 2 + (i + 0.5) * (dh / 3);
    const d = `M${bx1},${by} C${(bx1 + bx2) / 2},${by} ${(bx1 + bx2) / 2},${dy} ${bx2},${dy}`;
    const bus = S.path({ d, stroke: S.tone('bytes'), sw: 6 * scale, strokeOpacity: 0.35 }, g);
    bus.__d = d;
    buses.push(bus);
  }

  // Right 2 stacks
  for (let i = 0; i < 2; i++) {
    const sx = cx + pw / 2 - 38 * scale - sw;
    const sy = cy - rightTotalH / 2 + i * (sh + gapY);
    // Left 3 stacks
    const stG = S.g(null, g);
    S.rect({ x: sx, y: sy, w: sw, h: sh, r: 8 * scale, fill: '#220e15', stroke: S.tone('bytes'), strokeOpacity: 0.85, sw: 2 }, stG);
    // Layer lines in lower half
    const lineY0 = sy + 36 * scale;
    for (let k = 1; k < 4; k++) {
      S.line({ x1: sx + 8 * scale, y1: lineY0 + k * 12 * scale, x2: sx + sw - 8 * scale, y2: lineY0 + k * 12 * scale, stroke: S.tone('bytes'), strokeOpacity: 0.35, sw: 1.5 }, stG);
    }
    S.text('HBM3', { x: sx + sw / 2, y: sy + 22 * scale, size: 22 * scale, anchor: 'middle', color: 'bytes', weight: 650 }, stG);
    stacks.push(stG);

    // Bus path from right stack to die
    const bx1 = sx, bx2 = cx + dw / 2;
    const by = sy + sh / 2, dy = cy - dh / 2 + (i + 0.5) * (dh / 2);
    const d = `M${bx1},${by} C${(bx1 + bx2) / 2},${by} ${(bx1 + bx2) / 2},${dy} ${bx2},${dy}`;
    const bus = S.path({ d, stroke: S.tone('bytes'), sw: 6 * scale, strokeOpacity: 0.35 }, g);
    bus.__d = d;
    buses.push(bus);
  }

  // Bus Bracket & Bandwidth tag
  const busBadge = S.pill('5,120 wires · 3.35 TB/s', {
    x: cx, y: cy - dh / 2 - 32 * scale, h: 40 * scale, tone: 'helps', size: 22 * scale, weight: 650, mono: true
  });
  g.appendChild(busBadge);

  return {
    group: g, cx, cy, pw, ph,
    substrate, dieGroup, dieRect, dieGrid, dieLabel,
    stacks, buses, busBadge
  };
}

/**
 * Memory Ladder Latency Comparison (1 tick to 479 ticks)
 */
function ch00MemoryLadder(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 920;
  const h = opts.h ?? 360;

  const rungs = [
    { name: 'registers', ticks: '1 tick', ns: '0.55 ns', tone: 'compute', frac: 0.02 },
    { name: 'shared memory / L1', ticks: '≈ 20 ticks', ns: '11 ns', tone: 'helps', frac: 0.12 },
    { name: 'L2 cache', ticks: '≈ 50 ticks', ns: '27 ns', tone: 'struct', frac: 0.25 },
    { name: 'HBM3 main memory', ticks: '≈ 479 ticks', ns: '260 ns', tone: 'bytes', frac: 1.0 }
  ];

  const rungH = 52;
  const rungGap = 24;
  const startY = cy - ((rungs.length * rungH + (rungs.length - 1) * rungGap) / 2) + rungH / 2;

  const rows = [];
  rungs.forEach((r, idx) => {
    const ry = startY + idx * (rungH + rungGap);
    const rg = S.g(null, g);

    // Label on left
    const nameLabel = S.text(r.name, {
      x: cx - w / 2, y: ry, size: 24, color: r.tone, weight: 650
    }, rg);

    // Horizontal bar
    const barX = cx - w / 2 + 280;
    const maxBarW = w - 460;
    const barW = Math.max(14, maxBarW * r.frac);

    const bar = S.rect({
      x: barX, y: ry - rungH / 2 + 6, w: barW, h: rungH - 12, r: 6,
      fill: S.tone(r.tone, 0.25), stroke: S.tone(r.tone), sw: 2
    }, rg);

    // Latency readout on right
    const tickLabel = S.text(`${r.ticks} (${r.ns})`, {
      x: barX + barW + 16, y: ry, size: 22, anchor: 'start', color: 'ink', weight: 600, family: 'mono'
    }, rg);

    rows.push({ group: rg, nameLabel, bar, tickLabel });
  });

  return { group: g, rows };
}
