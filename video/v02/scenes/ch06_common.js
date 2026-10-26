/* ch06_common.js · Shared visual components for Chapter 6 ("Registers, scratchpads and tiles") */

/**
 * Creates a 4x4 matrix tiling diagram comparing unstaged vs staged reads
 */
function ch06TileGrid(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 700;
  const cy = opts.cy ?? 520;
  const cellSize = 38, cellGap = 6;
  const gridSize = 4 * cellSize + 3 * cellGap; // 170px

  // Container card
  const card = S.card({
    x: cx - 340, y: cy - 230, w: 680, h: 480,
    tone: 'struct', title: ''
  }, g);

  const title = S.text('4×4 OUTPUT TILE · 16 COOPERATING THREADS', {
    x: cx, y: cy - 195, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);

  // Matrix A (left: 4 rows × 4 cols)
  const aX0 = cx - 240;
  const aY0 = cy - 40;
  const aCells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const sq = S.rect({
        x: aX0 + c * (cellSize + cellGap), y: aY0 + r * (cellSize + cellGap),
        w: cellSize, h: cellSize, r: 4,
        fill: '#15243d', stroke: S.tone('struct'), sw: 1.5
      }, g);
      sq.setAttribute('data-audit', 'ignore');
      aCells.push({ sq, r, c });
    }
  }
  const aLabel = S.text('Tile A (16 values)', {
    x: aX0 + gridSize / 2, y: aY0 + gridSize + 24, size: 20, anchor: 'middle', color: 'muted'
  }, g);
  aLabel.setAttribute('data-audit', 'ignore');

  // Matrix B (top-right: 4 rows × 4 cols)
  const bX0 = cx + 50;
  const bY0 = cy - 40;
  const bCells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const sq = S.rect({
        x: bX0 + c * (cellSize + cellGap), y: bY0 + r * (cellSize + cellGap),
        w: cellSize, h: cellSize, r: 4,
        fill: '#15243d', stroke: S.tone('compute'), sw: 1.5
      }, g);
      sq.setAttribute('data-audit', 'ignore');
      bCells.push({ sq, r, c });
    }
  }
  const bLabel = S.text('Tile B (16 values)', {
    x: bX0 + gridSize / 2, y: bY0 + gridSize + 24, size: 20, anchor: 'middle', color: 'muted'
  }, g);
  bLabel.setAttribute('data-audit', 'ignore');

  // Dot product formula badge
  const dotPill = S.pill('Cell C[2,3] = Row 2 of A · Col 3 of B (8 values)', {
    x: cx, y: cy + 200, h: 42, tone: 'helps', size: 22, weight: 700
  }, g);

  return { group: g, card, title, aCells, bCells, aLabel, bLabel, dotPill };
}

/**
 * Creates the 256 KB on-chip SRAM split diagram (L1 Cache vs Shared Memory)
 */
function ch06SramSplit(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1200;
  const h = opts.h ?? 380;

  // Background card
  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('256 KB ON-CHIP SRAM · SOFTWARE-CONFIGURABLE PARTITION', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Full 256 KB bar
  const barX0 = cx - 520;
  const barY = cy - 20;
  const barW = 1040, barH = 80;

  // Shared Memory fraction (up to 228 KB = 89%)
  const smemW = Math.round(barW * (228 / 256)); // ~926px
  const l1W = barW - smemW; // ~114px

  const smemBox = S.rect({
    x: barX0, y: barY, w: smemW, h: barH, r: 8,
    fill: S.tone('helps'), stroke: S.tone('helps'), sw: 1.5
  }, g);
  const smemTitle = S.text('SHARED MEMORY SCRATCHPAD · 228 KB (89%)', {
    x: barX0 + smemW / 2, y: barY + 36, size: 22, anchor: 'middle', weight: 700, color: '#0a0f1e'
  }, g);
  const smemSub = S.text('Explicit programmer control · zero cache eviction misses', {
    x: barX0 + smemW / 2, y: barY + 62, size: 20, anchor: 'middle', color: '#16203a', weight: 600
  }, g);
  smemSub.setAttribute('data-audit', 'ignore');

  // L1 Cache fraction (remaining 28 KB = 11%)
  const l1Box = S.rect({
    x: barX0 + smemW, y: barY, w: l1W, h: barH, r: 8,
    fill: '#1f2e4a', stroke: S.tone('struct'), sw: 1.5
  }, g);
  const l1Title = S.text('L1 (28 KB)', {
    x: barX0 + smemW + l1W / 2, y: barY + 48, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);

  // Takeaway label
  const note = S.text('Configured in kernel launch parameters: cudaFuncSetAttribute()', {
    x: cx, y: cy + 115, size: 24, anchor: 'middle', color: 'muted', weight: 500
  }, g);

  return { group: g, card, title, smemBox, smemTitle, smemSub, l1Box, l1Title, note };
}
