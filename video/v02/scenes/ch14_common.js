/* ch14_common.js · Visual components for Chapter 14 ("Coalescing: the second sin")
   Figs 70, 71, 72, 73, 74, 75 from atlas:
   - ch14LineSectors: 128-byte cache line (four 32-byte sectors) & coalesced vs scattered warp (Figs 70, 71)
   - ch14RowColStride: 2D row-major matrix: 4-byte row step vs 16,384-byte column leap (Fig 72)
   - ch14StrideCliff: Stride slider progression and the 8-fold cliff (100% -> 50% -> 25% -> 12.5%) (Figs 73, 74, 75)
*/

/**
 * Creates the 128-byte cache line and 32-byte sectors visual (Atlas Figs 70, 71)
 */
function ch14LineSectors(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('memory access granularity · 128-byte line composed of four 32-byte sectors', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // 128-byte cache line container
  const lineW = 1200;
  const lineH = 100;
  const lineX = cx - lineW / 2;
  const lineY = cy - 165;

  const lineBox = S.rect({
    x: lineX, y: lineY, w: lineW, h: lineH, r: 8,
    fill: '#151c2e', stroke: S.tone('struct'), sw: 1.8
  }, g);

  const lineLbl = S.text('one 128-byte cache line (minimum memory transaction unit)', {
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
      fill: '#162e28', stroke: S.tone('helps'), sw: 1.5
    }, g);
    const lbl = S.text(`sector ${i} (32 bytes)`, {
      x: sx + sectorW / 2, y: sY + 34, size: 20, anchor: 'middle', weight: 700, color: 'helps'
    }, g);
    const sub = S.text('8 single-precision floats', {
      x: sx + sectorW / 2, y: sY + 58, size: 20, anchor: 'middle', weight: 600, color: 'muted'
    }, g);
    box.setAttribute('data-audit', 'ignore');
    lbl.setAttribute('data-audit', 'ignore');
    sub.setAttribute('data-audit', 'ignore');
    sectors.push({ box, lbl, sub });
  }

  // Two comparison panels below
  const panW = 590;
  const panH = 180;
  const panY = cy - 20;

  // Left: Coalesced Warp
  const cPan = S.rect({
    x: cx - panW - 20, y: panY, w: panW, h: panH, r: 10,
    fill: '#101c18', stroke: S.tone('helps'), sw: 1.5
  }, g);
  const cTitle = S.text('coalesced access (contiguous)', {
    x: cx - panW / 2 - 20, y: panY + 36, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const cDesc1 = S.text('32 threads read consecutive indices 0..31', {
    x: cx - panW / 2 - 20, y: panY + 76, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const cDesc2 = S.text('exact match: 4 sectors moved (128 b) = 100% efficient', {
    x: cx - panW / 2 - 20, y: panY + 124, size: 20, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  // Right: Scattered Warp
  const sPan = S.rect({
    x: cx + 20, y: panY, w: panW, h: panH, r: 10,
    fill: '#1c1216', stroke: S.tone('bytes'), sw: 1.5
  }, g);
  const sTitle = S.text('uncoalesced access (scattered)', {
    x: cx + panW / 2 + 20, y: panY + 36, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const sDesc1 = S.text('32 threads land in separate 32-byte sectors', {
    x: cx + panW / 2 + 20, y: panY + 76, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const sDesc2 = S.text('32 sectors moved (1,024 b) for 128 b used: 87.5% wasted', {
    x: cx + panW / 2 + 20, y: panY + 124, size: 20, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);

  const footer = S.pill('contiguous access uses 100% of fetched bytes · scattered access wastes 7/8ths', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'bytes', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g, bg, title, lineBox, lineLbl, sectors,
    cPan, cTitle, cDesc1, cDesc2, sPan, sTitle, sDesc1, sDesc2, footer
  };
}

/**
 * Creates the Row-Major vs Column-Major Walk Visual (Atlas Fig 72)
 */
function ch14RowColStride(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('why walking a column in a 2d matrix costs 8× more memory traffic', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Left side: Row walk
  const leftX = cx - 620;
  const sideW = 590;
  const sideH = 300;
  const sideY = cy - 150;

  const rCard = S.rect({
    x: leftX, y: sideY, w: sideW, h: sideH, r: 10,
    fill: '#101c18', stroke: S.tone('helps'), sw: 1.5
  }, g);
  const rTitle = S.text('row traversal · adjacent bytes (4-byte hop)', {
    x: leftX + sideW / 2, y: sideY + 40, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const rDesc1 = S.text('elements stored consecutively row after row', {
    x: leftX + sideW / 2, y: sideY + 90, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const rDesc2 = S.text('adjacent threads touch adjacent memory bytes', {
    x: leftX + sideW / 2, y: sideY + 140, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const rPill = S.pill('128 bytes fetched · 100% bandwidth efficiency', {
    x: leftX + sideW / 2, y: sideY + 235, h: 42, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  // Right side: Column walk
  const rightX = cx + 30;
  const cCard = S.rect({
    x: rightX, y: sideY, w: sideW, h: sideH, r: 10,
    fill: '#1c1216', stroke: S.tone('bytes'), sw: 1.5
  }, g);
  const cTitle = S.text('column traversal · 16,384-byte stride jump', {
    x: rightX + sideW / 2, y: sideY + 40, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const cDesc1 = S.text('4,096 elements × 4 bytes = 16,384-byte jump', {
    x: rightX + sideW / 2, y: sideY + 90, size: 20, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const cDesc2 = S.text('every single lane lands in a separate sector', {
    x: rightX + sideW / 2, y: sideY + 140, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const cPill = S.pill('1,024 bytes fetched (8×) · 87.5% wasted traffic', {
    x: rightX + sideW / 2, y: sideY + 235, h: 42, tone: 'bytes', size: 20, weight: 700, style: 'solid'
  }, g);

  const footer = S.pill('loop indexing order is a hardware bandwidth decision · not a matter of style', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'struct', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g, bg, title, rCard, rTitle, rDesc1, rDesc2, rPill,
    cCard, cTitle, cDesc1, cDesc2, cPill, footer
  };
}

/**
 * Creates the Stride Progression and Eightfold Cliff (Atlas Figs 73, 74, 75)
 */
function ch14StrideCliff(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('stride length and the eightfold cliff · efficiency plunges from 100% to 12.5%', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const strides = [
    { name: 'stride 1 (adjacent)', sectors: '4 sectors (128 b)', eff: '100% useful', col: 'helps', wPct: 1.0 },
    { name: 'stride 2 (every 2nd)', sectors: '8 sectors (256 b)', eff: '50% useful', col: 'helps', wPct: 0.5 },
    { name: 'stride 4 (every 4th)', sectors: '16 sectors (512 b)', eff: '25% useful', col: 'compute', wPct: 0.25 },
    { name: 'stride 8 (every 8th)', sectors: '32 sectors (1,024 b)', eff: '12.5% useful (8× cliff)', col: 'bytes', wPct: 0.125 },
    { name: 'stride 16+ (scattered)', sectors: '32 sectors capped', eff: '12.5% floor', col: 'bytes', wPct: 0.125 }
  ];

  const rowX0 = cx - 580;
  const rowW = 1160;
  const startY = cy - 165;
  const rowEls = [];

  strides.forEach((s, idx) => {
    const ry = startY + idx * 62;
    const rc = S.rect({
      x: rowX0, y: ry, w: rowW, h: 54, r: 6,
      fill: '#151c2e', stroke: S.tone(s.col), sw: 1.5
    }, g);

    const sn = S.text(s.name, {
      x: rowX0 + 24, y: ry + 34, size: 20, weight: 700, color: 'ink'
    }, g);

    const ss = S.text(s.sectors, {
      x: rowX0 + 420, y: ry + 34, size: 20, weight: 600, color: 'ink'
    }, g);

    const se = S.text(s.eff, {
      x: rowX0 + rowW - 24, y: ry + 34, size: 20, anchor: 'end', weight: 700, color: s.col
    }, g);

    rowEls.push({ rc, sn, ss, se });
  });

  const footer = S.pill('coalescing ensures every fetched byte counts · strides throw 87.5% away', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'bytes', size: 20, weight: 700, style: 'solid'
  }, g);

  return { group: g, bg, title, rowEls, footer };
}
