/* ch14_common.js · Shared visual components for Chapter 14 ("Coalescing: the second sin") */

/**
 * Creates the 128-byte cache line and 32-byte sectors visual
 */
function ch14LineSectors(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('MEMORY ACCESS GRANULARITY: 128-BYTE LINE · FOUR 32-BYTE SECTORS', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // 128-byte cache line container
  const lineW = 1200;
  const lineH = 100;
  const lineX = cx - lineW / 2;
  const lineY = cy - 160;

  const lineBox = S.rect({
    x: lineX, y: lineY, w: lineW, h: lineH, r: 8,
    fill: S.tone('struct', 0.1), stroke: S.tone('struct', 0.8), sw: 2
  }, g);

  const lineLbl = S.text('ONE 128-BYTE CACHE LINE', {
    x: cx, y: lineY - 14, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);

  // 4 sectors
  const sectorW = 285;
  const sectorH = 76;
  const sectorGap = 15;
  const sStartX = lineX + 10;
  const sY = lineY + 12;

  const sectors = [];
  for (let i = 0; i < 4; i++) {
    const sx = sStartX + i * (sectorW + sectorGap);
    const box = S.rect({
      x: sx, y: sY, w: sectorW, h: sectorH, r: 6,
      fill: S.tone('helps', 0.25), stroke: S.tone('helps', 0.9), sw: 1.5
    }, g);
    const lbl = S.text(`Sector ${i} (32 Bytes)`, {
      x: sx + sectorW / 2, y: sY + 36, size: 20, anchor: 'middle', weight: 700, color: 'helps'
    }, g);
    const sub = S.text('8 Single-Precision Floats', {
      x: sx + sectorW / 2, y: sY + 60, size: 18, anchor: 'middle', weight: 600, color: 'muted'
    }, g);
    sub.setAttribute('data-audit', 'ignore');
    sectors.push({ box, lbl, sub });
  }

  // Two comparison panels below
  const panW = 580;
  const panH = 175;
  const panY = cy - 25;

  // Left: Coalesced Warp
  const cPan = S.card({ x: cx - panW - 20, y: panY, w: panW, h: panH, tone: 'helps', title: '' }, g);
  const cTitle = S.text('COALESCED ACCESS (CONTIGUOUS)', {
    x: cx - panW / 2 - 20, y: panY + 36, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const cDesc1 = S.text('32 threads read consecutive indices 0..31', {
    x: cx - panW / 2 - 20, y: panY + 75, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const cDesc2 = S.text('Exact fit: 4 sectors moved (128 B) = 100% EFFICIENT', {
    x: cx - panW / 2 - 20, y: panY + 125, size: 20, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  // Right: Scattered Warp
  const sPan = S.card({ x: cx + 20, y: panY, w: panW, h: panH, tone: 'bytes', title: '' }, g);
  const sTitle = S.text('UNCOALESCED ACCESS (SCATTERED)', {
    x: cx + panW / 2 + 20, y: panY + 36, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const sDesc1 = S.text('32 threads land in separate 32-byte sectors', {
    x: cx + panW / 2 + 20, y: panY + 75, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const sDesc2 = S.text('32 sectors moved (1,024 B) for 128 B used: 87.5% WASTED', {
    x: cx + panW / 2 + 20, y: panY + 125, size: 20, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);

  const footer = S.pill('CONTIGUOUS ACCESS USES 100% OF FETCHED BYTES · SCATTERED ACCESS WASTES 7/8THS', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title, lineBox, lineLbl, sectors,
    cPan, cTitle, cDesc1, cDesc2, sPan, sTitle, sDesc1, sDesc2, footer
  };
}

/**
 * Creates the Row-Major vs Column-Major Walk Visual
 */
function ch14RowColStride(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('WHY WALKING A COLUMN IN A 2D MATRIX COSTS 8× MORE TRAFFIC', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Left side: Row walk
  const leftX = cx - 620;
  const sideW = 590;
  const sideH = 300;
  const sideY = cy - 150;

  const rCard = S.card({ x: leftX, y: sideY, w: sideW, h: sideH, tone: 'helps', title: '' }, g);
  const rTitle = S.text('ROW TRAVERSAL: ADJACENT BYTES (4-BYTE HOP)', {
    x: leftX + sideW / 2, y: sideY + 40, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const rDesc1 = S.text('Elements stored consecutively in row-major memory', {
    x: leftX + sideW / 2, y: sideY + 90, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const rDesc2 = S.text('Neighbouring threads touch adjacent memory addresses', {
    x: leftX + sideW / 2, y: sideY + 140, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const rPill = S.pill('128 BYTES FETCHED · 100% BANDWIDTH EFFICIENCY', {
    x: leftX + sideW / 2, y: sideY + 240, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  // Right side: Column walk
  const rightX = cx + 30;
  const cCard = S.card({ x: rightX, y: sideY, w: sideW, h: sideH, tone: 'bytes', title: '' }, g);
  const cTitle = S.text('COLUMN TRAVERSAL: 16,384-BYTE STRIDE JUMP', {
    x: rightX + sideW / 2, y: sideY + 40, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const cDesc1 = S.text('4,096 elements wide × 4 bytes = 16,384 bytes jump per step', {
    x: rightX + sideW / 2, y: sideY + 90, size: 20, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const cDesc2 = S.text('Every single lane lands in a completely separate sector', {
    x: rightX + sideW / 2, y: sideY + 140, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const cPill = S.pill('1,024 BYTES FETCHED (8×) · 87.5% WASTED', {
    x: rightX + sideW / 2, y: sideY + 240, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  const footer = S.pill('LOOP INDEXING ORDER IS A HARDWARE BANDWIDTH DECISION · NOT A MATTER OF STYLE', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'struct', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title, rCard, rTitle, rDesc1, rDesc2, rPill,
    cCard, cTitle, cDesc1, cDesc2, cPill, footer
  };
}

/**
 * Creates the Stride Progression and Eightfold Cliff
 */
function ch14StrideCliff(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('STRIDE LENGTH AND THE EIGHTFOLD CLIFF', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const strides = [
    { name: 'Stride 1 (Adjacent)', sectors: '4 Sectors (128 B)', eff: '100% Useful', col: 'helps', wRatio: 1.0 },
    { name: 'Stride 2 (Every 2nd)', sectors: '8 Sectors (256 B)', eff: '50% Useful', col: 'helps', wRatio: 0.5 },
    { name: 'Stride 4 (Every 4th)', sectors: '16 Sectors (512 B)', eff: '25% Useful', col: 'compute', wRatio: 0.25 },
    { name: 'Stride 8 (Every 8th)', sectors: '32 Sectors (1,024 B)', eff: '12.5% Useful (8× Cliff)', col: 'bytes', wRatio: 0.125 },
    { name: 'Stride 16+ (Scattered)', sectors: '32 Sectors Capped', eff: '12.5% Floor', col: 'bytes', wRatio: 0.125 }
  ];

  const rowX0 = cx - 580;
  const rowW = 1160;
  const startY = cy - 165;
  const rowEls = [];

  strides.forEach((s, idx) => {
    const ry = startY + idx * 62;
    const rc = S.card({ x: rowX0, y: ry, w: rowW, h: 54, tone: s.col, title: '' }, g);
    const sn = S.text(s.name, { x: rowX0 + 24, y: ry + 34, size: 20, weight: 700, color: 'ink' }, g);
    const ss = S.text(s.sectors, { x: rowX0 + 440, y: ry + 34, size: 20, weight: 600, color: 'ink' }, g);
    const se = S.text(s.eff, { x: rowX0 + rowW - 24, y: ry + 34, size: 20, anchor: 'end', weight: 700, color: s.col }, g);
    rowEls.push({ rc, sn, ss, se });
  });

  const footer = S.pill('COALESCING ENSURES EVERY FETCHED BYTE COUNTS · STRIDES THROW 87.5% AWAY', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return { group: g, card, title, rowEls, footer };
}
