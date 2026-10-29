/* ch06_common.js · Visual components for Chapter 06 ("Registers, scratchpads and tiles")
   Figs 26–32: Register file and occupancy trade, on-chip SRAM split,
   matrix tiling traffic reduction, and cache vs shared memory. */

/**
 * Fig 26 & 27: Register Data Path & Register File
 * Shows that arithmetic units cannot touch memory directly:
 * values must pass through named register slots (r0, r1, r2, ...).
 */
function ch06RegisterPath(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 275;
  const w = opts.w ?? 1420;
  const h = opts.h ?? 220;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#0a0f1d', stroke: S.tone('struct'), sw: 1.5
  }, g);

  const title = S.text('fig 26 · the register step is not optional: memory cannot feed arithmetic directly', {
    x: cx - w / 2 + 32, y: cy - h / 2 + 36, size: 22, weight: 700, color: 'struct'
  }, g);

  // Math ALU on the left
  const aluX = cx - 440;
  const aluBox = S.rect({
    x: aluX - 110, y: cy - 15, w: 220, h: 54, r: 8,
    fill: '#2b1c0a', stroke: S.tone('compute'), sw: 2
  }, g);
  aluBox.setAttribute('data-audit', 'ignore');
  const aluLbl = S.text('math units (alus)', {
    x: aluX, y: cy + 17, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  // Register slots in the middle (r0, r1, r2, r3)
  const regCX = cx - 20;
  const regW = 340, regH = 54;
  const regBox = S.rect({
    x: regCX - regW / 2, y: cy - 15, w: regW, h: regH, r: 8,
    fill: '#15243d', stroke: S.tone('struct'), sw: 1.5
  }, g);
  regBox.setAttribute('data-audit', 'ignore');

  // Micro-slots inside register file
  const slotW = 60, slotH = 36, slotGap = 16;
  const slotStartX = regCX - (4 * slotW + 3 * slotGap) / 2;
  const regSlots = [];
  ['r0', 'r1', 'r2', '...'].forEach((lbl, i) => {
    const sx = slotStartX + i * (slotW + slotGap);
    const sBox = S.rect({
      x: sx, y: cy - 6, w: slotW, h: slotH, r: 4,
      fill: '#1e293b', stroke: '#38bdf8', sw: 1
    }, g);
    sBox.setAttribute('data-audit', 'ignore');
    const sLbl = S.text(lbl, {
      x: sx + slotW / 2, y: cy + 17, size: 20, anchor: 'middle', family: 'mono', color: 'ink'
    }, g);
    sLbl.setAttribute('data-audit', 'ignore');
    regSlots.push(sBox, sLbl);
  });

  const regHeader = S.text('named register slots (1 tick)', {
    x: regCX, y: cy - 26, size: 20, anchor: 'middle', color: 'struct', weight: 600
  }, g);

  // Off-chip Memory on the right
  const memX = cx + 430;
  const memBox = S.rect({
    x: memX - 165, y: cy - 15, w: 330, h: 54, r: 8,
    fill: '#38161e', stroke: S.tone('bytes'), sw: 1.5
  }, g);
  memBox.setAttribute('data-audit', 'ignore');
  const memLbl = S.text('off-chip memory (479 ticks)', {
    x: memX, y: cy + 17, size: 20, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);

  // Legal flow arrows: Memory -> Register -> Math ALU
  const arr1 = S.line({
    x1: memX - 175, y1: cy + 12, x2: regCX + regW / 2 + 10, y2: cy + 12,
    stroke: S.tone('struct'), sw: 2.5, arrow: true
  }, g);
  arr1.setAttribute('data-audit', 'ignore');

  const arr2 = S.line({
    x1: regCX - regW / 2 - 10, y1: cy + 12, x2: aluX + 120, y2: cy + 12,
    stroke: S.tone('compute'), sw: 2.5, arrow: true
  }, g);
  arr2.setAttribute('data-audit', 'ignore');

  // Illegal direct path (Memory -> ALU) with prohibition cross
  const badLine = S.line({
    x1: memX - 175, y1: cy + 58, x2: aluX + 120, y2: cy + 58,
    stroke: '#ef4444', sw: 2, strokeDasharray: '6 4'
  }, g);
  badLine.setAttribute('data-audit', 'ignore');

  const noDirectPill = S.pill('no direct memory access in hardware', {
    x: cx - 20, y: cy + 58, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return {
    group: g, bg, title,
    aluBox, aluLbl,
    regBox, regHeader, regSlots,
    memBox, memLbl,
    arr1, arr2, badLine, noDirectPill
  };
}

/**
 * Fig 28: 256 KB Register File Occupancy Tradeoff
 * 5 proportional horizontal bars showing registers per thread vs resident threads.
 */
function ch06OccupancyChart(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 645;
  const w = opts.w ?? 1420;
  const h = opts.h ?? 420;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#0a0f1d', stroke: S.tone('compute'), sw: 1.5
  }, g);

  const title = S.text('fig 28 · 256 kb ÷ 4 bytes = 65,536 registers, shared across resident threads', {
    x: cx - w / 2 + 32, y: cy - h / 2 + 36, size: 22, weight: 700, color: 'compute'
  }, g);

  const barStartX = cx - w / 2 + 340;
  const barMaxW = 600; // max width for 2,048 threads = 600 px

  const rowsData = [
    { regs: '32 registers / thread', threads: 2048, occ: '100% occupancy (2,048 threads)', tone: 'helps' },
    { regs: '40 registers / thread', threads: 1536, occ: '75% occupancy (1,536 threads)', tone: 'struct' },
    { regs: '64 registers / thread', threads: 1024, occ: '50% occupancy (1,024 threads)', tone: 'neutral' },
    { regs: '128 registers / thread', threads: 512, occ: '25% occupancy (512 threads)', tone: 'compute' },
    { regs: '255 registers / thread', threads: 256, occ: '12.5% occupancy (256 threads)', tone: 'bytes' }
  ];

  const rowY0 = cy - h / 2 + 75;
  const rowGap = 56;
  const rowBars = [];

  rowsData.forEach((r, idx) => {
    const ry = rowY0 + idx * rowGap;
    const barW = Math.round(barMaxW * (r.threads / 2048));

    const lbl = S.text(r.regs, {
      x: barStartX - 24, y: ry + 24, size: 20, anchor: 'end', weight: 600, color: 'ink'
    }, g);

    const bar = S.rect({
      x: barStartX, y: ry, w: barW, h: 36, r: 6,
      fill: S.tone(r.tone), stroke: S.tone(r.tone), sw: 1
    }, g);

    const occLbl = S.text(r.occ, {
      x: barStartX + barW + 32, y: ry + 24, size: 20, weight: 700,
      color: S.tone(r.tone)
    }, g);

    rowBars.push({ lbl, bar, occLbl });
  });

  const footer = S.text('hoarding registers buys speed per thread, but leaves fewer threads to hide memory waits', {
    x: cx, y: cy + h / 2 - 20, size: 20, anchor: 'middle', color: 'muted'
  }, g);

  return { group: g, bg, title, rowBars, footer };
}

/**
 * Fig 29: On-chip SRAM Split (Shared Memory vs L1 Cache)
 * Shows 256 KB of SRAM partitioned by software between shared memory and L1.
 */
function ch06SramSplit(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 505;
  const w = opts.w ?? 1420;
  const h = opts.h ?? 540;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#0a0f1d', stroke: S.tone('helps'), sw: 1.5
  }, g);

  const title = S.text('fig 29 · 256 kb on-chip sram per multiprocessor · software configurable split', {
    x: cx - w / 2 + 32, y: cy - h / 2 + 38, size: 22, weight: 700, color: 'helps'
  }, g);

  // Full 256 KB bar
  const barStartX = cx - 580;
  const barY = cy - 90;
  const barW = 1160, barH = 76;

  // Shared Memory fraction (up to 228 KB = 89%)
  const smemW = Math.round(barW * (228 / 256)); // ~1033px
  const l1W = barW - smemW; // ~127px

  const smemBox = S.rect({
    x: barStartX, y: barY, w: smemW, h: barH, r: 8,
    fill: '#064e3b', stroke: S.tone('helps'), sw: 2
  }, g);
  const smemTitle = S.text('shared memory scratchpad · up to 228 kb (89%)', {
    x: barStartX + smemW / 2, y: barY + 34, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const smemSub = S.text('explicit programmer control · staging matrix tiles · zero eviction misses', {
    x: barStartX + smemW / 2, y: barY + 60, size: 20, anchor: 'middle', color: 'ink'
  }, g);

  // L1 Cache fraction (remaining 28 KB = 11%)
  const l1Box = S.rect({
    x: barStartX + smemW, y: barY, w: l1W, h: barH, r: 8,
    fill: '#15243d', stroke: S.tone('struct'), sw: 2
  }, g);
  const l1Title = S.text('l1 (28 kb)', {
    x: barStartX + smemW + l1W / 2, y: barY + 44, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);

  // Divider marker
  const divX = barStartX + smemW;
  const divLine = S.line({
    x1: divX, y1: barY - 14, x2: divX, y2: barY + barH + 14,
    stroke: '#ffffff', sw: 2, strokeDasharray: '4 3'
  }, g);
  divLine.setAttribute('data-audit', 'ignore');

  // Comparison panels below
  const panelW = 620, panelH = 150;
  const p1X = cx - 330, p2X = cx + 330;
  const pY = cy + 120;

  // Shared Memory Panel
  const p1Box = S.rect({
    x: p1X - panelW / 2, y: pY - panelH / 2, w: panelW, h: panelH, r: 8,
    fill: '#142e2b', stroke: S.tone('helps'), sw: 1.5
  }, g);
  p1Box.setAttribute('data-audit', 'ignore');
  const p1Title = S.text('shared memory: software scratchpad', {
    x: p1X, y: pY - panelH / 2 + 32, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const p1Text1 = S.text('• program explicitly stages cooperating tiles', {
    x: p1X - panelW / 2 + 24, y: pY + 8, size: 20, color: 'ink'
  }, g);
  const p1Text2 = S.text('• all threads read staged scratchpad directly', {
    x: p1X - panelW / 2 + 24, y: pY + 44, size: 20, color: 'ink'
  }, g);

  // L1 Cache Panel
  const p2Box = S.rect({
    x: p2X - panelW / 2, y: pY - panelH / 2, w: panelW, h: panelH, r: 8,
    fill: '#15243d', stroke: S.tone('struct'), sw: 1.5
  }, g);
  p2Box.setAttribute('data-audit', 'ignore');
  const p2Title = S.text('l1 cache: hardware managed', {
    x: p2X, y: pY - panelH / 2 + 32, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);
  const p2Text1 = S.text('• hardware guesses what to keep based on recency', {
    x: p2X - panelW / 2 + 24, y: pY + 8, size: 20, color: 'ink'
  }, g);
  const p2Text2 = S.text('• useful for general reuse; useless on weight streaming', {
    x: p2X - panelW / 2 + 24, y: pY + 44, size: 20, color: 'muted'
  }, g);

  return {
    group: g, bg, title,
    smemBox, smemTitle, smemSub, l1Box, l1Title, divLine,
    p1: [p1Box, p1Title, p1Text1, p1Text2],
    p2: [p2Box, p2Title, p2Text1, p2Text2]
  };
}

/**
 * Fig 30: Staging a Tile: 4×4 Matrix Tiling Diagram
 * Shows 4×4 output tile C, Tile A on left, Tile B on top,
 * and unstaged 128 reads vs staged 32 reads comparison.
 */
function ch06TilingDiagram(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 505;
  const w = opts.w ?? 1420;
  const h = opts.h ?? 540;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#0a0f1d', stroke: S.tone('helps'), sw: 1.5
  }, g);

  const title = S.text('fig 30 · staging a tile: fetch each number once and let cooperating threads read it', {
    x: cx - w / 2 + 32, y: cy - h / 2 + 38, size: 22, weight: 700, color: 'helps'
  }, g);

  // Left side: Matrix Tiling Geometry
  const mCX = cx - 360;
  const cellSize = 38, cellGap = 6;

  // Output Block C (4×4)
  const cX0 = mCX - 40;
  const cY0 = cy - 20;
  const cCells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const isTarget = (r === 2 && c === 3);
      const sq = S.rect({
        x: cX0 + c * (cellSize + cellGap), y: cY0 + r * (cellSize + cellGap),
        w: cellSize, h: cellSize, r: 4,
        fill: isTarget ? '#10b981' : '#1e293b',
        stroke: isTarget ? '#ffffff' : '#334155', sw: isTarget ? 2 : 1
      }, g);
      sq.setAttribute('data-audit', 'ignore');
      cCells.push({ sq, r, c });
    }
  }
  const cLabel = S.text('output block C (16 cells, 16 threads)', {
    x: cX0 + 2 * (cellSize + cellGap), y: cY0 + 4 * (cellSize + cellGap) + 20,
    size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Matrix A (left of C: 4 rows × 4 cols)
  const aX0 = cX0 - 4 * (cellSize + cellGap) - 24;
  const aY0 = cY0;
  const aCells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const isRow2 = (r === 2);
      const sq = S.rect({
        x: aX0 + c * (cellSize + cellGap), y: aY0 + r * (cellSize + cellGap),
        w: cellSize, h: cellSize, r: 4,
        fill: isRow2 ? '#38bdf8' : '#15243d',
        stroke: isRow2 ? '#ffffff' : '#334155', sw: isRow2 ? 2 : 1
      }, g);
      sq.setAttribute('data-audit', 'ignore');
      aCells.push({ sq, r, c });
    }
  }
  const aLabel = S.text('tile A (row 2)', {
    x: aX0 + 2 * (cellSize + cellGap), y: aY0 - 14,
    size: 20, anchor: 'middle', weight: 600, color: 'struct'
  }, g);

  // Matrix B (above C: 4 rows × 4 cols)
  const bX0 = cX0;
  const bY0 = cY0 - 4 * (cellSize + cellGap) - 24;
  const bCells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const isCol3 = (c === 3);
      const sq = S.rect({
        x: bX0 + c * (cellSize + cellGap), y: bY0 + r * (cellSize + cellGap),
        w: cellSize, h: cellSize, r: 4,
        fill: isCol3 ? '#f59e0b' : '#2b1c0a',
        stroke: isCol3 ? '#ffffff' : '#334155', sw: isCol3 ? 2 : 1
      }, g);
      sq.setAttribute('data-audit', 'ignore');
      bCells.push({ sq, r, c });
    }
  }
  const bLabel = S.text('tile B (col 3)', {
    x: bX0 - 14, y: bY0 + 2 * (cellSize + cellGap),
    size: 20, anchor: 'end', weight: 600, color: 'compute'
  }, g);

  // Formula badge
  const dotPill = S.pill('cell c23 = row 2 of A · col 3 of B (8 values)', {
    x: mCX + 40, y: cy + 225, h: 40, tone: 'helps', size: 20, weight: 700
  }, g);

  // Right side: Traffic Reduction Comparison Dashboard
  const dashCX = cx + 330;
  const cardW = 640;

  // Card 1: Unstaged reads
  const c1Y = cy - 110;
  const c1Box = S.rect({
    x: dashCX - cardW / 2, y: c1Y, w: cardW, h: 96, r: 8,
    fill: '#38161e', stroke: S.tone('bytes'), sw: 1.5
  }, g);
  const c1Title = S.text('1 · unstaged execution (independent threads)', {
    x: dashCX - cardW / 2 + 24, y: c1Y + 34, size: 22, weight: 700, color: 'bytes'
  }, g);
  const c1Desc = S.text('16 threads × 8 inputs = 128 reads from hbm', {
    x: dashCX - cardW / 2 + 24, y: c1Y + 68, size: 22, family: 'mono', weight: 700, color: 'ink'
  }, g);

  // Card 2: Staged reads into shared memory
  const c2Y = cy + 10;
  const c2Box = S.rect({
    x: dashCX - cardW / 2, y: c2Y, w: cardW, h: 96, r: 8,
    fill: '#142e2b', stroke: S.tone('helps'), sw: 1.5
  }, g);
  const c2Title = S.text('2 · staged execution (cooperative shared memory)', {
    x: dashCX - cardW / 2 + 24, y: c2Y + 34, size: 22, weight: 700, color: 'helps'
  }, g);
  const c2Desc = S.text('16 of A + 16 of B = 32 reads from hbm', {
    x: dashCX - cardW / 2 + 24, y: c2Y + 68, size: 22, family: 'mono', weight: 700, color: 'helps'
  }, g);

  // Card 3: 4x Savings Banner
  const c3Y = cy + 130;
  const c3Box = S.rect({
    x: dashCX - cardW / 2, y: c3Y, w: cardW, h: 78, r: 8,
    fill: '#2b1c0a', stroke: S.tone('compute'), sw: 2
  }, g);
  const c3Title = S.text('128 ÷ 32 = 4× less hbm memory traffic!', {
    x: dashCX, y: c3Y + 32, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const c3Sub = S.text('saving equals tile width · 128-wide tile saves 128×', {
    x: dashCX, y: c3Y + 56, size: 20, anchor: 'middle', color: 'ink'
  }, g);

  return {
    group: g, bg, title,
    cCells, cLabel, aCells, aLabel, bCells, bLabel, dotPill,
    c1: [c1Box, c1Title, c1Desc],
    c2: [c2Box, c2Title, c2Desc],
    c3: [c3Box, c3Title, c3Sub]
  };
}
