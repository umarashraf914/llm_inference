/* ch11_common.js · Visual components for Chapter 11 ("Why memory is slow in the first place")
   Figs 53, 54, 55, 56 from atlas:
   - ch11CellComparison: SRAM 6-transistor cell vs DRAM 1T+1C cell with leak curve (Fig 53)
   - ch11DestructiveCycle: DRAM destructive read and 64 ms refresh timer (Fig 54)
   - ch11LatencyBreakdown: One 273 ns HBM load (27.5 ns cell read vs 245.5 ns transit) (Fig 55)
   - ch11TradeoffPlot: Speed vs Capacity 2D scatter plot and empty top-right corner (Fig 56)
*/

/**
 * Creates the side-by-side SRAM vs DRAM cell visual comparison (Atlas Fig 53)
 */
function ch11CellComparison(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const cardW = 640;
  const cardH = 470;
  const leftX = cx - cardW - 20;
  const rightX = cx + 20;
  const topY = cy - cardH / 2;

  // Left Card: SRAM Cell (6 Transistors)
  const leftCard = S.rect({
    x: leftX, y: topY, w: cardW, h: cardH, r: 14,
    fill: '#101a24', stroke: S.tone('helps'), sw: 1.8
  }, g);

  const leftTitle = S.text('an sram cell: six transistors', {
    x: leftX + cardW / 2, y: topY + 44, size: 24, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  const leftSub = S.text('on-chip · read in one cycle without disturbing it', {
    x: leftX + cardW / 2, y: topY + 78, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  // Diagram container inside SRAM
  const leftBox = S.rect({
    x: leftX + 40, y: topY + 110, w: cardW - 80, h: 240, r: 8,
    fill: '#13212c', stroke: '#1f3a35', sw: 1
  }, g);

  // 6 Transistors visualized as 6 paired blocks
  const tBlocks = [];
  const startTx = leftX + 70;
  const startTy = topY + 135;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const bx = startTx + c * 170;
      const by = startTy + r * 95;
      const tb = S.rect({
        x: bx, y: by, w: 140, h: 68, r: 6,
        fill: '#15332f', stroke: S.tone('helps'), sw: 1.5
      }, g);
      const tl = S.text(`transistor t${r * 3 + c + 1}`, {
        x: bx + 70, y: by + 40, size: 20, anchor: 'middle', weight: 600, color: 'helps'
      }, g);
      tb.setAttribute('data-audit', 'ignore');
      tl.setAttribute('data-audit', 'ignore');
      tBlocks.push({ tb, tl });
    }
  }

  const leftPill = S.pill('fast & non-destructive · bulky (6t footprint)', {
    x: leftX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  // Right Card: DRAM Cell (1 Transistor + 1 Capacitor)
  const rightCard = S.rect({
    x: rightX, y: topY, w: cardW, h: cardH, r: 14,
    fill: '#1c1316', stroke: S.tone('bytes'), sw: 1.8
  }, g);

  const rightTitle = S.text('a dram cell: one transistor, one capacitor', {
    x: rightX + cardW / 2, y: topY + 44, size: 24, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);

  const rightSub = S.text('off-chip (hbm) · microscopic charge · leaks continuously', {
    x: rightX + cardW / 2, y: topY + 78, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  // Diagram container inside DRAM
  const rightBox = S.rect({
    x: rightX + 40, y: topY + 110, w: cardW - 80, h: 240, r: 8,
    fill: '#24161b', stroke: '#47222a', sw: 1
  }, g);

  // 1 Transistor block + 1 Capacitor plate
  const dramT = S.rect({
    x: rightX + 65, y: topY + 145, w: 210, h: 80, r: 6,
    fill: '#1a2233', stroke: S.tone('struct'), sw: 1.5
  }, g);
  const dramTLbl = S.text('access gate (1t)', {
    x: rightX + 170, y: topY + 192, size: 20, anchor: 'middle', weight: 700, color: 'struct'
  }, g);

  const dramCap = S.rect({
    x: rightX + 300, y: topY + 135, w: 275, h: 100, r: 6,
    fill: '#331a20', stroke: S.tone('bytes'), sw: 1.5
  }, g);
  const dramCapLbl = S.text('trench capacitor (c)', {
    x: rightX + 437, y: topY + 175, size: 20, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const dramCharge = S.text('microscopic ~30 ff charge', {
    x: rightX + 437, y: topY + 210, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  // Leak curve line across bottom of DRAM box
  const leakLbl = S.text('charge leaks away over time', {
    x: rightX + 310, y: topY + 270, size: 20, anchor: 'middle', color: 'bytes', weight: 600
  }, g);
  const leakLine = S.line({
    x1: rightX + 80, y1: topY + 295, x2: rightX + 540, y2: topY + 335,
    stroke: S.tone('bytes'), sw: 3
  }, g);

  const rightPill = S.pill('ultra dense (80 gb) · destroys on read & leaks', {
    x: rightX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return {
    group: g,
    leftCard, leftTitle, leftSub, leftBox, tBlocks, leftPill,
    rightCard, rightTitle, rightSub, rightBox, dramT, dramTLbl, dramCap, dramCapLbl, dramCharge, leakLine, leakLbl, rightPill
  };
}

/**
 * Creates the DRAM destructive read & refresh cycle diagram (Atlas Fig 54)
 */
function ch11DestructiveCycle(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 470;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 400;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1420', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('reading dram destroys the bit · every row rewritten every 64 ms', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // 3-step Read & Rewrite Flow (Fig 54 from atlas)
  const stepW = 380;
  const stepH = 125;
  const stepY = cy - 85;
  const stepGap = 35;
  const totalStepsW = 3 * stepW + 2 * stepGap;
  const stepStartX = cx - totalStepsW / 2;

  // Step 1: Charge Sits
  const s1Box = S.rect({
    x: stepStartX, y: stepY, w: stepW, h: stepH, r: 8,
    fill: '#1c1524', stroke: S.tone('struct'), sw: 1.5
  }, g);
  const s1Title = S.text('1 · charge sits on capacitor', {
    x: stepStartX + stepW / 2, y: stepY + 42, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);
  const s1Sub = S.text('microscopic voltage holds bit', {
    x: stepStartX + stepW / 2, y: stepY + 85, size: 20, anchor: 'middle', color: 'muted', weight: 600
  }, g);

  // Arrow 1 -> 2
  const a1 = S.line({
    x1: stepStartX + stepW + 8, y1: stepY + stepH / 2,
    x2: stepStartX + stepW + stepGap - 8, y2: stepY + stepH / 2,
    stroke: S.tone('muted'), sw: 2
  }, g);

  // Step 2: Read - Drains Out
  const s2X = stepStartX + stepW + stepGap;
  const s2Box = S.rect({
    x: s2X, y: stepY, w: stepW, h: stepH, r: 8,
    fill: '#24141a', stroke: S.tone('bytes'), sw: 1.5
  }, g);
  const s2Title = S.text('2 · read: charge drains out', {
    x: s2X + stepW / 2, y: stepY + 42, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const s2Sub = S.text('sense amp drains bit to read', {
    x: s2X + stepW / 2, y: stepY + 85, size: 20, anchor: 'middle', color: 'muted', weight: 600
  }, g);

  // Arrow 2 -> 3
  const a2 = S.line({
    x1: s2X + stepW + 8, y1: stepY + stepH / 2,
    x2: s2X + stepW + stepGap - 8, y2: stepY + stepH / 2,
    stroke: S.tone('muted'), sw: 2
  }, g);

  // Step 3: Write It Back
  const s3X = s2X + stepW + stepGap;
  const s3Box = S.rect({
    x: s3X, y: stepY, w: stepW, h: stepH, r: 8,
    fill: '#15241f', stroke: S.tone('helps'), sw: 1.5
  }, g);
  const s3Title = S.text('3 · write it back immediately', {
    x: s3X + stepW / 2, y: stepY + 42, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const s3Sub = S.text('row locked until restore done', {
    x: s3X + stepW / 2, y: stepY + 85, size: 20, anchor: 'middle', color: 'muted', weight: 600
  }, g);

  // Bottom Section: 64 ms Refresh Window
  const refY = cy + 65;
  const refBox = S.rect({
    x: cx - 600, y: refY, w: 1200, h: 72, r: 8,
    fill: '#121828', stroke: S.tone('struct'), sw: 1.5
  }, g);
  const refText1 = S.text('64 millisecond refresh timer · every row rewritten 16 times per second', {
    x: cx, y: refY + 42, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);

  const summaryPill = S.pill('dram physics sets latency · wire count sets bandwidth', {
    x: cx, y: cy + h / 2 - 28, h: 38, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g, bg, title,
    s1Box, s1Title, s1Sub, a1,
    s2Box, s2Title, s2Sub, a2,
    s3Box, s3Title, s3Sub,
    refBox, refText1, summaryPill
  };
}

/**
 * Creates the 273-nanosecond latency breakdown bar (Fig 55 from atlas)
 */
function ch11LatencyBreakdown(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 400;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('one hbm memory load · ~273 nanoseconds (479 clock ticks)', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const barX0 = cx - 580;
  const barY0 = cy - 50;
  const totalBarW = 1160;
  const barH = 64;

  // Transit: 90% (245.5 ns)
  const transitW = Math.round(totalBarW * 0.90); // 1044px
  const transitBar = S.rect({
    x: barX0, y: barY0, w: transitW, h: barH, r: 6,
    fill: '#331a20', stroke: S.tone('bytes'), sw: 1.5
  }, g);

  const transitLbl = S.text('physical signal transit, caches & queues · 245.5 ns (90%)', {
    x: barX0 + transitW / 2, y: barY0 + 40, size: 20, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);

  // Cell Read: 10% (27.5 ns)
  const cellX = barX0 + transitW;
  const cellW = totalBarW - transitW; // 116px
  const cellBar = S.rect({
    x: cellX, y: barY0, w: cellW, h: barH, r: 6,
    fill: '#15332f', stroke: S.tone('helps'), sw: 1.5
  }, g);

  const cellLbl = S.text('cell read: 27.5 ns', {
    x: cellX + cellW / 2, y: barY0 - 16, size: 20, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  // Sub-stages underneath transit bar
  const stages = [
    { name: '1. sm l1 check', dur: '~20 ns', x: barX0 },
    { name: '2. crossbar mesh', dur: '~50 ns', x: barX0 + 265 },
    { name: '3. memory queue', dur: '~110 ns', x: barX0 + 530 },
    { name: '4. interposer phy', dur: '~65.5 ns', x: barX0 + 795 }
  ];

  const stageEls = [];
  stages.forEach(s => {
    const sc = S.rect({
      x: s.x, y: barY0 + 85, w: 250, h: 72, r: 8,
      fill: '#151c2e', stroke: '#293a5a', sw: 1
    }, g);
    const sn = S.text(s.name, {
      x: s.x + 125, y: barY0 + 115, size: 20, anchor: 'middle', weight: 700, color: 'ink'
    }, g);
    const sd = S.text(s.dur, {
      x: s.x + 125, y: barY0 + 143, size: 20, anchor: 'middle', weight: 600, color: 'muted'
    }, g);
    stageEls.push({ sc, sn, sd });
  });

  const takeawayBadge = S.pill('wider buses increase throughput, but signals cannot travel faster across silicon', {
    x: cx, y: cy + h / 2 - 28, h: 38, tone: 'bytes', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g, bg, title, transitBar, transitLbl, cellBar, cellLbl, stageEls, takeawayBadge
  };
}

/**
 * Creates the Speed vs Capacity Tradeoff 2D Chart (Atlas Fig 56)
 */
function ch11TradeoffPlot(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 430;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('the same trade in every storage technology ever built', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Axes
  const ax0X = cx - 520;
  const ax1X = cx + 520;
  const ax0Y = cy - 130;
  const ax1Y = cy + 120;

  const xLine = S.line({
    x1: ax0X, y1: ax1Y, x2: ax1X, y2: ax1Y,
    stroke: '#3b4e72', sw: 1.5
  }, g);

  const yLine = S.line({
    x1: ax0X, y1: ax0Y, x2: ax0X, y2: ax1Y,
    stroke: '#3b4e72', sw: 1.5
  }, g);

  const yLbl = S.text('faster (lower latency) ↑', {
    x: ax0X + 16, y: ax0Y - 14, size: 20, color: 'helps', weight: 700
  }, g);

  const xLbl = S.text('bigger (higher capacity) →', {
    x: ax1X - 20, y: ax1Y + 32, size: 20, anchor: 'end', color: 'bytes', weight: 700
  }, g);

  // Plotted points: anchor start, positioned so they don't cross axes
  const points = [
    { name: 'registers (1 tick · 256 kb)', x: cx - 440, y: cy - 70, tone: 'helps' },
    { name: 'on-chip sram (29 ticks · 256 kb)', x: cx - 220, y: cy - 20, tone: 'helps' },
    { name: 'l2 cache (263 ticks · 50 mb)', x: cx + 20, y: cy + 35, tone: 'struct' },
    { name: 'memory beside chip (hbm 80 gb)', x: cx + 240, y: cy + 80, tone: 'bytes' }
  ];

  const ptEls = [];
  points.forEach(p => {
    const c = S.circle({
      cx: p.x, cy: p.y, r: 10,
      fill: S.tone(p.tone), stroke: '#fff', sw: 2
    }, g);
    const t = S.text(p.name, {
      x: p.x + 18, y: p.y + 7, size: 20, anchor: 'start', weight: 700, color: p.tone
    }, g);
    c.setAttribute('data-audit', 'ignore');
    t.setAttribute('data-audit', 'ignore');
    ptEls.push({ c, t });
  });

  // Top-right empty impossible box
  const impBox = S.rect({
    x: cx + 120, y: cy - 140, w: 420, h: 120, r: 8,
    fill: '#24141a', stroke: S.tone('bytes'), sw: 1.5,
    'stroke-dasharray': '6 6'
  }, g);

  const impLbl1 = S.text('physically impossible', {
    x: cx + 330, y: cy - 95, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const impLbl2 = S.text('simultaneously fastest & vastest', {
    x: cx + 330, y: cy - 62, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const ladderPill = S.pill('speed requires proximity · capacity requires area · memory must be a ladder', {
    x: cx, y: cy + h / 2 - 28, h: 38, tone: 'struct', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g, bg, title, xLine, yLine, yLbl, xLbl, ptEls, impBox, impLbl1, impLbl2, ladderPill
  };
}
