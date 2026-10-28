/* ch04_common.js · Visual components for Chapter 04 ("Two design philosophies")
   Figs 15–22: CPU anticipation budget vs GPU throughput budget,
   speculative branch pipelines, address prefetching, 132 SM stamping,
   and serial dependency chains vs matrix parallelism. */

/**
 * Fig 16: CPU Core Silicon Budget
 * Illustrates the physical area split: ~75% anticipation (predict, prefetch, reorder)
 * vs ~25% actual math arithmetic units.
 */
function ch04CpuCoreArea(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 540;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 560;
  const h = opts.h ?? 490;

  // Outer silicon die carrier
  const carrier = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#0f172a', stroke: S.tone('struct'), sw: 2
  }, g);

  const header = S.text('cpu core · silicon budget', {
    x: cx - w / 2 + 28, y: cy - h / 2 + 38, size: 22, weight: 700, color: 'struct'
  }, g);

  // Uncertainty banner at top of core
  const qBox = S.rect({
    x: cx - w / 2 + 24, y: cy - h / 2 + 56, w: w - 48, h: 44, r: 8,
    fill: '#15243d', stroke: S.tone('struct'), sw: 1.5
  }, g);
  const qLbl = S.text('incoming: add · branch · load · or jump?', {
    x: cx, y: cy - h / 2 + 84, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Large anticipation block (~70% area)
  const aX = cx - w / 2 + 24;
  const aY = cy - h / 2 + 114;
  const aW = w - 48;
  const aH = 216;
  const antBlock = S.rect({
    x: aX, y: aY, w: aW, h: aH, r: 10,
    fill: '#162238', stroke: S.tone('struct'), sw: 1.5
  }, g);

  const antTitle = S.text('anticipation machinery (~75% area)', {
    x: cx, y: aY + 34, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);

  // Sub-blocks inside anticipation
  const subH = 46;
  const b1 = S.rect({ x: aX + 16, y: aY + 50, w: aW - 32, h: subH, r: 6, fill: '#1e293b', stroke: '#334155', sw: 1 }, g);
  const b1Lbl = S.text('branch predictor & speculative execution', { x: cx, y: aY + 79, size: 20, anchor: 'middle', color: 'ink' }, g);

  const b2 = S.rect({ x: aX + 16, y: aY + 104, w: aW - 32, h: subH, r: 6, fill: '#1e293b', stroke: '#334155', sw: 1 }, g);
  const b2Lbl = S.text('out-of-order reorder buffer & rename tables', { x: cx, y: aY + 133, size: 20, anchor: 'middle', color: 'ink' }, g);

  const b3 = S.rect({ x: aX + 16, y: aY + 158, w: aW - 32, h: subH, r: 6, fill: '#1e293b', stroke: '#334155', sw: 1 }, g);
  const b3Lbl = S.text('hardware prefetcher & address trackers', { x: cx, y: aY + 187, size: 20, anchor: 'middle', color: 'ink' }, g);

  // Small arithmetic block (~25% area)
  const mY = aY + aH + 14;
  const mH = 86;
  const mathBlock = S.rect({
    x: aX, y: mY, w: aW, h: mH, r: 10,
    fill: '#2b1c0a', stroke: S.tone('compute'), sw: 2
  }, g);

  const mathTitle = S.text('arithmetic units (alus & fpu)', {
    x: cx, y: mY + 34, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const mathSub = S.text('the actual math: a tiny fraction of core silicon', {
    x: cx, y: mY + 64, size: 20, anchor: 'middle', color: 'muted'
  }, g);

  // Thread note at bottom
  const threadNote = S.text('runs a few tens of fast, unpredictable threads', {
    x: cx, y: cy + h / 2 - 24, size: 20, anchor: 'middle', color: 'muted'
  }, g);

  return {
    group: g, carrier, header, qBox, qLbl,
    antBlock, antTitle,
    subBlocks: [b1, b1Lbl, b2, b2Lbl, b3, b3Lbl],
    mathBlock, mathTitle, mathSub, threadNote
  };
}

/**
 * Fig 18: GPU Multiprocessor (SM) Silicon Budget
 * Illustrates the physical area split: no prefetch/speculation,
 * massive arithmetic units + register file.
 */
function ch04GpuSmArea(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 1380;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 560;
  const h = opts.h ?? 490;

  // Outer SM carrier
  const carrier = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#0f172a', stroke: S.tone('compute'), sw: 2
  }, g);

  const header = S.text('one gpu multiprocessor (sm)', {
    x: cx - w / 2 + 28, y: cy - h / 2 + 38, size: 22, weight: 700, color: 'compute'
  }, g);

  // Latency hiding warp swap panel inside SM at top
  const swapBox = S.rect({
    x: cx - w / 2 + 24, y: cy - h / 2 + 56, w: w - 48, h: 44, r: 8,
    fill: '#15243d', stroke: S.tone('helps'), sw: 1.5
  }, g);
  const swapTextA = S.text('warp 0: stalled', {
    x: cx - 140, y: cy - h / 2 + 84, size: 20, anchor: 'middle', weight: 600, color: 'bytes'
  }, g);
  const swapArrow = S.text('→', {
    x: cx - 40, y: cy - h / 2 + 84, size: 20, anchor: 'middle', color: 'muted'
  }, g);
  const swapTextB = S.text('warp 1: fires next cycle', {
    x: cx + 90, y: cy - h / 2 + 84, size: 20, anchor: 'middle', weight: 600, color: 'helps'
  }, g);

  // Stripped anticipation: dashed outline "no prefetch, no speculation"
  const aX = cx - w / 2 + 24;
  const aY = cy - h / 2 + 114;
  const aW = w - 48;
  const aH = 50;
  const noAntBlock = S.rect({
    x: aX, y: aY, w: aW, h: aH, r: 8,
    fill: 'none', stroke: '#475569', sw: 1.5, strokeDasharray: '6 4'
  }, g);
  const noAntLbl = S.text('no branch prediction · no speculation · no prefetch', {
    x: cx, y: aY + 31, size: 20, anchor: 'middle', color: 'muted'
  }, g);

  // Blue Register file block (256 KB)
  const regY = aY + aH + 14;
  const regH = 76;
  const regBlock = S.rect({
    x: aX, y: regY, w: aW, h: regH, r: 10,
    fill: '#15243d', stroke: S.tone('struct'), sw: 1.5
  }, g);
  const regTitle = S.text('256 kb register file', {
    x: cx, y: regY + 32, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);
  const regSub = S.text('holds state for 2,048 threads in hardware', {
    x: cx, y: regY + 58, size: 20, anchor: 'middle', color: 'muted'
  }, g);

  // Massive Arithmetic Lanes (>70% area!)
  const mY = regY + regH + 14;
  const mH = 150;
  const mathBlock = S.rect({
    x: aX, y: mY, w: aW, h: mH, r: 10,
    fill: '#2b1c0a', stroke: S.tone('compute'), sw: 2
  }, g);

  const mathTitle = S.text('dense arithmetic lanes (>70% area)', {
    x: cx, y: mY + 30, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  // Micro-grid of arithmetic lane blocks
  const laneGrid = S.g(null, g);
  const startX = cx - 210;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 8; c++) {
      const lx = startX + c * 54;
      const ly = mY + 48 + r * 44;
      const rct = S.rect({
        x: lx, y: ly, w: 46, h: 34, r: 4,
        fill: '#f59e0b', stroke: '#d97706', sw: 1
      }, laneGrid);
      rct.setAttribute('data-audit', 'ignore');
    }
  }

  // Capacity footer
  const footer = S.text('holds up to 2,048 resident threads per multiprocessor', {
    x: cx, y: cy + h / 2 - 24, size: 20, anchor: 'middle', color: 'muted'
  }, g);

  return {
    group: g, carrier, header, swapBox, swapTextA, swapArrow, swapTextB,
    noAntBlock, noAntLbl,
    regBlock, regTitle, regSub,
    mathBlock, mathTitle, laneGrid, footer
  };
}

/**
 * Fig 17: Branch Speculation Timeline
 * Illustrates:
 * - wait: stalled for 3 slots until test resolves
 * - guess right: runs ahead, committing work
 * - guess wrong: speculative slots flushed with pipeline flush marks
 */
function ch04BranchTimeline(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 1360;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 600;
  const h = opts.h ?? 490;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#090f1d', stroke: S.tone('struct'), sw: 1.5
  }, g);

  const title = S.text('cpu speculative execution (fig 17)', {
    x: cx - w / 2 + 28, y: cy - h / 2 + 38, size: 22, weight: 700, color: 'struct'
  }, g);

  // Row 1: Wait (no speculation)
  const r1Y = cy - h / 2 + 76;
  const r1Lbl = S.text('wait (stalled)', { x: cx - w / 2 + 28, y: r1Y + 24, size: 20, weight: 600, color: 'muted' }, g);

  // Draw slots: i1, i2, i3, if?, [stall], [stall], [stall], i5, i6
  const slotW = 44, slotH = 34, gap = 6;
  const startX = cx - w / 2 + 180;
  const r1Slots = [];

  ['i1', 'i2', 'i3', 'if?'].forEach((lbl, i) => {
    const sx = startX + i * (slotW + gap);
    const box = S.rect({ x: sx, y: r1Y, w: slotW, h: slotH, r: 4, fill: '#1e293b', stroke: '#475569', sw: 1 }, g);
    box.setAttribute('data-audit', 'ignore');
    const t = S.text(lbl, { x: sx + slotW / 2, y: r1Y + 24, size: 20, anchor: 'middle', color: 'ink' }, g);
    t.setAttribute('data-audit', 'ignore');
    r1Slots.push(box, t);
  });
  // 3 dashed stall slots
  for (let s = 0; s < 3; s++) {
    const sx = startX + (4 + s) * (slotW + gap);
    const box = S.rect({ x: sx, y: r1Y, w: slotW, h: slotH, r: 4, fill: 'none', stroke: '#ef4444', sw: 1.5, strokeDasharray: '4 3' }, g);
    box.setAttribute('data-audit', 'ignore');
    r1Slots.push(box);
  }
  ['i5', 'i6'].forEach((lbl, i) => {
    const sx = startX + (7 + i) * (slotW + gap);
    const box = S.rect({ x: sx, y: r1Y, w: slotW, h: slotH, r: 4, fill: '#1e293b', stroke: '#475569', sw: 1 }, g);
    box.setAttribute('data-audit', 'ignore');
    const t = S.text(lbl, { x: sx + slotW / 2, y: r1Y + 24, size: 20, anchor: 'middle', color: 'ink' }, g);
    t.setAttribute('data-audit', 'ignore');
    r1Slots.push(box, t);
  });

  // Row 2: Guess Right (green / helps)
  const r2Y = r1Y + 76;
  const r2Lbl = S.text('guess right', { x: cx - w / 2 + 28, y: r2Y + 24, size: 20, weight: 600, color: 'helps' }, g);
  const r2Slots = [];
  ['i1', 'i2', 'i3', 'if?', 'i5', 'i6', 'i7', 'i8', 'i9'].forEach((lbl, i) => {
    const sx = startX + i * (slotW + gap);
    const isSpec = i >= 4;
    const box = S.rect({
      x: sx, y: r2Y, w: slotW, h: slotH, r: 4,
      fill: isSpec ? '#064e3b' : '#1e293b',
      stroke: isSpec ? S.tone('helps') : '#475569',
      sw: 1.5
    }, g);
    box.setAttribute('data-audit', 'ignore');
    const t = S.text(lbl, { x: sx + slotW / 2, y: r2Y + 24, size: 20, anchor: 'middle', color: isSpec ? 'helps' : 'ink' }, g);
    t.setAttribute('data-audit', 'ignore');
    r2Slots.push(box, t);
  });

  // Row 3: Guess Wrong (coral / bytes)
  const r3Y = r2Y + 76;
  const r3Lbl = S.text('guess wrong', { x: cx - w / 2 + 28, y: r3Y + 24, size: 20, weight: 600, color: 'bytes' }, g);
  const r3Slots = [];
  ['i1', 'i2', 'i3', 'if?'].forEach((lbl, i) => {
    const sx = startX + i * (slotW + gap);
    const box = S.rect({ x: sx, y: r3Y, w: slotW, h: slotH, r: 4, fill: '#1e293b', stroke: '#475569', sw: 1 }, g);
    box.setAttribute('data-audit', 'ignore');
    const t = S.text(lbl, { x: sx + slotW / 2, y: r3Y + 24, size: 20, anchor: 'middle', color: 'ink' }, g);
    t.setAttribute('data-audit', 'ignore');
    r3Slots.push(box, t);
  });
  // Flushed speculative slots (w1, w2, w3 with cross strike)
  for (let s = 0; s < 3; s++) {
    const sx = startX + (4 + s) * (slotW + gap);
    const box = S.rect({ x: sx, y: r3Y, w: slotW, h: slotH, r: 4, fill: '#450a0a', stroke: S.tone('bytes'), sw: 1.5 }, g);
    box.setAttribute('data-audit', 'ignore');
    const cross = S.text('✕', { x: sx + slotW / 2, y: r3Y + 24, size: 20, anchor: 'middle', color: 'bytes' }, g);
    cross.setAttribute('data-audit', 'ignore');
    r3Slots.push(box, cross);
  }
  // Restarted path
  ['e5', 'e6'].forEach((lbl, i) => {
    const sx = startX + (7 + i) * (slotW + gap);
    const box = S.rect({ x: sx, y: r3Y, w: slotW, h: slotH, r: 4, fill: '#1e293b', stroke: '#475569', sw: 1 }, g);
    box.setAttribute('data-audit', 'ignore');
    const t = S.text(lbl, { x: sx + slotW / 2, y: r3Y + 24, size: 20, anchor: 'middle', color: 'ink' }, g);
    t.setAttribute('data-audit', 'ignore');
    r3Slots.push(box, t);
  });

  // Vertical resolution marker line
  const resX = startX + 4 * (slotW + gap) - gap / 2;
  const resLine = S.line({
    x1: resX, y1: r1Y - 10, x2: resX, y2: r3Y + slotH + 10,
    stroke: S.tone('amber') ?? '#f59e0b', sw: 1.5, strokeDasharray: '4 3'
  }, g);
  resLine.setAttribute('data-audit', 'ignore');
  const resLbl = S.text('answer known (3 slots late)', {
    x: resX + 10, y: r3Y + slotH + 34, size: 20, color: 'compute'
  }, g);

  // Matrix multiply overhead banner at bottom
  const loopY = cy + h / 2 - 86;
  const loopBox = S.rect({
    x: cx - w / 2 + 20, y: loopY, w: w - 40, h: 64, r: 8,
    fill: '#1e293b', stroke: '#475569', sw: 1
  }, g);
  const loopTitle = S.text('regular loops: c[i][j] += a[i][k] * b[k][j]', {
    x: cx, y: loopY + 28, size: 20, anchor: 'middle', family: 'mono', color: 'ink'
  }, g);
  const loopSub = S.text('zero branches · predictor sits 100% idle · pure overhead', {
    x: cx, y: loopY + 52, size: 20, anchor: 'middle', color: 'muted'
  }, g);

  return {
    group: g, bg, title,
    r1: [r1Lbl, ...r1Slots],
    r2: [r2Lbl, ...r2Slots],
    r3: [r3Lbl, ...r3Slots],
    resLine, resLbl,
    loop: [loopBox, loopTitle, loopSub]
  };
}

/**
 * Fig 20: Full Die 132 SM Stamped Grid
 * Illustrates 132 identical multiprocessor units filling the silicon die,
 * with one unit highlighted in amber.
 */
function ch04Die132Grid(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 1360;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 680;
  const h = opts.h ?? 490;

  const dieBg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#0a0f1d', stroke: S.tone('compute'), sw: 2
  }, g);

  const title = S.text('814 mm² die · one design stamped 132 times', {
    x: cx, y: cy - h / 2 + 38, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  // 12 columns × 11 rows = 132 SM tiles
  const cols = 12, rows = 11;
  const tileW = 42, tileH = 26;
  const gapX = 6, gapY = 6;
  const gridW = cols * tileW + (cols - 1) * gapX;
  const gridH = rows * tileH + (rows - 1) * gapY;
  const startX = cx - gridW / 2;
  const startY = cy - gridH / 2 + 20;

  const tiles = [];
  let highlightedTile = null;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tx = startX + c * (tileW + gapX);
      const ty = startY + r * (tileH + gapY);
      const isTarget = (r === 2 && c === 2);

      const tile = S.rect({
        x: tx, y: ty, w: tileW, h: tileH, r: 4,
        fill: isTarget ? '#f59e0b' : '#1e293b',
        stroke: isTarget ? '#ffffff' : '#334155',
        sw: isTarget ? 2 : 1
      }, g);
      tile.setAttribute('data-audit', 'ignore');

      if (isTarget) {
        highlightedTile = tile;
      }
      tiles.push(tile);
    }
  }

  // Label pointing to highlighted SM
  const calloutPill = S.pill('the 1 sm we inspect', {
    x: cx - 180, y: startY - 26, h: 36, tone: 'compute', size: 20, weight: 700
  }, g);

  // Chip-wide thread calculation summary
  const summary = S.text('132 sms × 2,048 threads = 270,336 resident threads', {
    x: cx, y: cy + h / 2 - 24, size: 22, anchor: 'middle', family: 'mono', weight: 700, color: 'ink'
  }, g);

  return {
    group: g, dieBg, title, tiles, highlightedTile, calloutPill, summary
  };
}
