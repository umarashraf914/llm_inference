/* ch11_common.js · Shared visual components for Chapter 11 ("Why memory is slow in the first place") */

/**
 * Creates the side-by-side SRAM vs DRAM cell visual comparison
 */
function ch11CellComparison(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const cardW = 640;
  const cardH = 460;
  const leftX = cx - cardW - 30;
  const rightX = cx + 30;
  const topY = cy - cardH / 2;

  // Left Card: SRAM Cell (6 Transistors)
  const leftCard = S.card({
    x: leftX, y: topY, w: cardW, h: cardH,
    tone: 'helps', title: ''
  }, g);

  const leftTitle = S.text('SRAM CELL: 6 TRANSISTORS', {
    x: leftX + cardW / 2, y: topY + 44, size: 24, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  const leftSub = S.text('On-Chip · Single-Cycle Read · Stable Feedback Loop', {
    x: leftX + cardW / 2, y: topY + 80, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  // Diagram container inside SRAM
  const leftBox = S.rect({
    x: leftX + 40, y: topY + 115, w: cardW - 80, h: 220, r: 8,
    fill: S.tone('neutral', 0.1), stroke: S.tone('helps', 0.4), sw: 1.5
  }, g);

  // 6 Transistors visualized as 6 paired blocks
  const tBlocks = [];
  const startTx = leftX + 70;
  const startTy = topY + 140;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const bx = startTx + c * 170;
      const by = startTy + r * 85;
      const tb = S.rect({
        x: bx, y: by, w: 140, h: 60, r: 6,
        fill: S.tone('helps', 0.2), stroke: S.tone('helps', 0.8), sw: 1.5
      }, g);
      const tl = S.text(`Transistor T${r * 3 + c + 1}`, {
        x: bx + 70, y: by + 36, size: 20, anchor: 'middle', weight: 600, color: 'helps'
      }, g);
      tBlocks.push({ tb, tl });
    }
  }

  const leftPill = S.pill('FAST & NON-DESTRUCTIVE · BULKY (6T FOOTPRINT)', {
    x: leftX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  // Right Card: DRAM Cell (1 Transistor + 1 Capacitor)
  const rightCard = S.card({
    x: rightX, y: topY, w: cardW, h: cardH,
    tone: 'bytes', title: ''
  }, g);

  const rightTitle = S.text('DRAM CELL: 1 TRANSISTOR + 1 CAPACITOR', {
    x: rightX + cardW / 2, y: topY + 44, size: 24, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);

  const rightSub = S.text('Off-Chip (HBM) · Microscopic Charge · Physical Leakage', {
    x: rightX + cardW / 2, y: topY + 80, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  // Diagram container inside DRAM
  const rightBox = S.rect({
    x: rightX + 40, y: topY + 115, w: cardW - 80, h: 220, r: 8,
    fill: S.tone('neutral', 0.1), stroke: S.tone('bytes', 0.4), sw: 1.5
  }, g);

  // 1 Transistor block + 1 Capacitor plate
  const dramT = S.rect({
    x: rightX + 60, y: topY + 170, w: 220, h: 90, r: 6,
    fill: S.tone('struct', 0.2), stroke: S.tone('struct', 0.8), sw: 1.5
  }, g);
  const dramTLbl = S.text('1 Access Gate (1T)', {
    x: rightX + 170, y: topY + 224, size: 20, anchor: 'middle', weight: 700, color: 'struct'
  }, g);

  const dramCap = S.rect({
    x: rightX + 310, y: topY + 150, w: 270, h: 130, r: 6,
    fill: S.tone('bytes', 0.2), stroke: S.tone('bytes', 0.8), sw: 1.5
  }, g);
  const dramCapLbl = S.text('Trench Capacitor', {
    x: rightX + 445, y: topY + 200, size: 20, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const dramCharge = S.text('Microscopic ~30 fF Charge', {
    x: rightX + 445, y: topY + 240, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const rightPill = S.pill('ULTRA DENSE (80 GB) · DESTROYS ON READ & LEAKS', {
    x: rightX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return {
    group: g,
    leftCard, leftTitle, leftSub, leftBox, tBlocks, leftPill,
    rightCard, rightTitle, rightSub, rightBox, dramT, dramTLbl, dramCap, dramCapLbl, dramCharge, rightPill
  };
}

/**
 * Creates the DRAM destructive read & refresh cycle diagram
 */
function ch11DestructiveCycle(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 470;
  const w = opts.w ?? 1340;
  const h = opts.h ?? 380;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('DRAM DESTRUCTIVE READOUT AND MANDATORY RESTORE', {
    x: cx, y: cy - h / 2 + 38, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Two Phase Cards
  const phW = 580;
  const phH = 180;
  const phY = cy - 40;

  // Phase 1: Read & Drain
  const p1Card = S.card({ x: cx - phW - 25, y: phY, w: phW, h: phH, tone: 'bytes', title: '' }, g);
  const p1Title = S.text('PHASE 1: READ & DRAIN (27.5 ns)', {
    x: cx - phW / 2 - 25, y: phY + 40, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const p1Desc1 = S.text('Sense amp measures microscopic charge', {
    x: cx - phW / 2 - 25, y: phY + 80, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const p1Desc2 = S.text('Capacitor is drained completely empty', {
    x: cx - phW / 2 - 25, y: phY + 120, size: 20, anchor: 'middle', weight: 600, color: 'violet'
  }, g);

  // Phase 2: Rewrite & Restore
  const p2Card = S.card({ x: cx + 25, y: phY, w: phW, h: phH, tone: 'compute', title: '' }, g);
  const p2Title = S.text('PHASE 2: MANDATORY REWRITE & LOCK', {
    x: cx + phW / 2 + 25, y: phY + 40, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const p2Desc1 = S.text('Sense amp actively rewrites full charge back', {
    x: cx + phW / 2 + 25, y: phY + 80, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const p2Desc2 = S.text('Row is locked and blocked until rewrite finishes', {
    x: cx + phW / 2 + 25, y: phY + 120, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  // Bottom timer pill: 64 ms refresh window
  const refreshPill = S.pill('64 ms REFRESH TIMER: EVERY ROW REWRITTEN 16 TIMES EVERY SECOND TO SURVIVE LEAKAGE', {
    x: cx, y: cy + h / 2 - 40, h: 42, tone: 'struct', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title, p1Card, p1Title, p1Desc1, p1Desc2,
    p2Card, p2Title, p2Desc1, p2Desc2, refreshPill
  };
}

/**
 * Creates the 273-nanosecond latency breakdown bar
 */
function ch11LatencyBreakdown(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 400;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('ONE HBM MEMORY LOAD: ~273 NANOSECONDS (479 CLOCK TICKS)', {
    x: cx, y: cy - h / 2 + 38, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const barX0 = cx - 580;
  const barY0 = cy - 40;
  const totalBarW = 1160;
  const barH = 64;

  // Transit: 90% (245.5 ns)
  const transitW = Math.round(totalBarW * 0.90); // 1044px
  const transitBar = S.rect({
    x: barX0, y: barY0, w: transitW, h: barH, r: 6,
    fill: S.tone('bytes', 0.35), stroke: S.tone('bytes', 0.9), sw: 1.5
  }, g);

  const transitLbl = S.text('PHYSICAL TRANSIT, CACHE MISSES & QUEUES: ~245.5 ns (90%)', {
    x: barX0 + transitW / 2, y: barY0 + 40, size: 20, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Cell Read: 10% (27.5 ns)
  const cellX = barX0 + transitW;
  const cellW = totalBarW - transitW; // 116px
  const cellBar = S.rect({
    x: cellX, y: barY0, w: cellW, h: barH, r: 6,
    fill: S.tone('helps', 0.45), stroke: S.tone('helps', 0.95), sw: 1.5
  }, g);

  const cellLbl = S.text('CELL READ: 27.5 ns (10%)', {
    x: cellX + cellW / 2, y: barY0 - 15, size: 20, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  // Sub-stages underneath transit bar
  const stages = [
    { name: '1. SM L1 Check', dur: '~20 ns', x: barX0 },
    { name: '2. Crossbar Mesh', dur: '~50 ns', x: barX0 + 260 },
    { name: '3. Memory Controller', dur: '~110 ns', x: barX0 + 520 },
    { name: '4. Interposer PHY', dur: '~65.5 ns', x: barX0 + 780 }
  ];

  const stageEls = [];
  stages.forEach(s => {
    const sc = S.card({ x: s.x, y: barY0 + 90, w: 240, h: 70, tone: 'neutral', title: '' }, g);
    const sn = S.text(s.name, { x: s.x + 120, y: barY0 + 122, size: 20, anchor: 'middle', weight: 700, color: 'ink' }, g);
    const sd = S.text(s.dur, { x: s.x + 120, y: barY0 + 148, size: 20, anchor: 'middle', weight: 600, color: 'muted' }, g);
    stageEls.push({ sc, sn, sd });
  });

  const takeawayBadge = S.pill('BANDWIDTH SCALES WITH WIRES · LATENCY IS BOUNDED BY DISTANCE', {
    x: cx, y: cy + h / 2 - 38, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title, transitBar, transitLbl, cellBar, cellLbl, stageEls, takeawayBadge
  };
}

/**
 * Creates the Speed vs Capacity Tradeoff 2D Chart
 */
function ch11TradeoffPlot(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 440;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('THE STORAGE COMPROMISE: SPEED (LATENCY) VS CAPACITY', {
    x: cx, y: cy - h / 2 + 38, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Points on the ladder
  const points = [
    { name: 'Registers (1 tick · 256 KB)', x: cx - 440, y: cy - 60, tone: 'helps' },
    { name: 'L1 / Shared (29 ticks · 256 KB)', x: cx - 220, y: cy - 10, tone: 'helps' },
    { name: 'L2 Cache (263 ticks · 50 MB)', x: cx + 40, y: cy + 60, tone: 'struct' },
    { name: 'HBM3 Memory (479 ticks · 80 GB)', x: cx + 340, y: cy + 120, tone: 'bytes' }
  ];

  const ptEls = [];
  points.forEach(p => {
    const c = S.circle({ cx: p.x, cy: p.y, r: 12, fill: S.tone(p.tone), stroke: '#fff', sw: 2 }, g);
    const t = S.text(p.name, { x: p.x, y: p.y - 20, size: 20, anchor: 'middle', weight: 700, color: p.tone }, g);
    ptEls.push({ c, t });
  });

  // Top-right impossible quadrant
  const impBox = S.rect({
    x: cx + 180, y: cy - 160, w: 420, h: 130, r: 8,
    fill: S.tone('bytes', 0.1), stroke: S.tone('bytes', 0.6), sw: 2
  }, g);
  impBox.setAttribute('stroke-dasharray', '6 6');

  const impLbl1 = S.text('PHYSICALLY IMPOSSIBLE', {
    x: cx + 390, y: cy - 110, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const impLbl2 = S.text('Simultaneously Fastest & Vastest', {
    x: cx + 390, y: cy - 75, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const ladderPill = S.pill('SPEED REQUIRES PROXIMITY · CAPACITY REQUIRES AREA · MEMORY MUST BE A LADDER', {
    x: cx, y: cy + h / 2 - 38, h: 42, tone: 'struct', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title, ptEls, impBox, impLbl1, impLbl2, ladderPill
  };
}
