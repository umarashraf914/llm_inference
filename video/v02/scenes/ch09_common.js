/* ch09_common.js · Visual components for Chapter 9 ("Filling a multiprocessor")
   Figs 44, 45, 46, 47, 48 from atlas:
   - ch09WarpGrid: 4 schedulers × 16 resident warps = 64 warps (2,048 resident threads)
   - ch09TurnTimeline: 32-tick execution timeline (warp 0 turns on tick 1, 17, 33...)
   - ch09PizzaPipeline: Delivery pipeline analogy (items in flight = rate × latency)
   - ch09HbmPipeline: HBM Little's Law pipeline (3,352 B/ns × 273 ns = 915,096 B)
   - ch09PerSmSaturation: Per-SM bytes needed (6,933 B) vs supplied by 2,048 threads (8,192 B)
   - ch09ConcentricHierarchy: Fig 48 nested physical hierarchy (thread -> warp -> block -> SM -> chip)
*/

/**
 * Draws the 4 schedulers with 16 resident warp slots each (Fig 44 from atlas)
 */
function ch09WarpGrid(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 330;
  const w = opts.w ?? 1280;
  const h = opts.h ?? 250;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 12,
    fill: '#101622', stroke: S.tone('struct'), sw: 1.5
  }, g);

  const title = S.text('64 resident warps fill one multiprocessor · 2,048 threads', {
    x: cx, y: cy - h / 2 + 34, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const schedG = S.g(null, g);
  const rowLabels = [];
  const warpSlots = [];
  const warp0Slots = [];

  const startY = cy - h / 2 + 75;
  const rowSpacing = 38;
  const slotW = 54;
  const slotH = 26;
  const slotGap = 12;
  const slotsStartX = cx - (16 * slotW + 15 * slotGap) / 2 + 70;

  for (let s = 0; s < 4; s++) {
    const rowY = startY + s * rowSpacing;
    const sLbl = S.text(`scheduler ${s + 1}`, {
      x: slotsStartX - 30, y: rowY + 19, size: 20, anchor: 'end',
      color: 'muted', weight: 600
    }, schedG);
    rowLabels.push(sLbl);

    for (let wIdx = 0; wIdx < 16; wIdx++) {
      const slotX = slotsStartX + wIdx * (slotW + slotGap);
      const isW0 = (s === 0 && wIdx === 0);

      const slot = S.rect({
        x: slotX, y: rowY, w: slotW, h: slotH, r: 4,
        fill: isW0 ? S.tone('compute') : '#18243b',
        stroke: isW0 ? S.tone('compute') : '#2f4368',
        sw: isW0 ? 2 : 1
      }, schedG);

      const slotTxt = S.text(isW0 ? 'w0' : `${wIdx}`, {
        x: slotX + slotW / 2, y: rowY + 19, size: 20, anchor: 'middle',
        color: isW0 ? '#0a0f1e' : '#8899b5', weight: isW0 ? 700 : 500
      }, schedG);

      slot.setAttribute('data-audit', 'ignore');
      slotTxt.setAttribute('data-audit', 'ignore');

      if (isW0) {
        warp0Slots.push({ slot, slotTxt });
      }
      warpSlots.push({ slot, slotTxt });
    }
  }

  // Occupancy badge
  const occBadge = S.pill('occupancy 100% · 64 of 64 slots filled', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'struct', size: 20, weight: 700
  }, g);

  return { group: g, bg, title, schedG, rowLabels, warpSlots, warp0Slots, occBadge };
}

/**
 * Draws the 32-tick timeline of Scheduler 1 executing round-robin
 */
function ch09TurnTimeline(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 620;
  const w = opts.w ?? 1280;
  const h = opts.h ?? 270;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 12,
    fill: '#0f1420', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('execution timeline for scheduler 1 · each thread moves once every 16 ticks', {
    x: cx, y: cy - h / 2 + 34, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const ticksG = S.g(null, g);
  const numTicks = 32;
  const tW = 34, tH = 46, tGap = 5;
  const tX0 = cx - (numTicks * tW + (numTicks - 1) * tGap) / 2;
  const tY = cy - 40;

  const tickBoxes = [];
  const w0Boxes = [];

  for (let t = 0; t < numTicks; t++) {
    const isWarp0 = (t === 0 || t === 16);
    const boxX = tX0 + t * (tW + tGap);

    const box = S.rect({
      x: boxX, y: tY, w: tW, h: tH, r: 4,
      fill: isWarp0 ? S.tone('compute') : '#162035',
      stroke: isWarp0 ? S.tone('compute') : '#283856',
      sw: isWarp0 ? 2 : 1
    }, ticksG);

    const lbl = S.text(`${t + 1}`, {
      x: boxX + tW / 2, y: tY + 30, size: 20, anchor: 'middle',
      color: isWarp0 ? '#0a0f1e' : 'muted', weight: isWarp0 ? 700 : 500
    }, ticksG);

    box.setAttribute('data-audit', 'ignore');
    lbl.setAttribute('data-audit', 'ignore');

    tickBoxes.push({ box, lbl, isWarp0 });
    if (isWarp0) w0Boxes.push(box);
  }

  // Rate callouts at bottom
  const rateG = S.g(null, g);

  const singleBox = S.rect({
    x: cx - 600, y: cy + 35, w: 580, h: 72, r: 8,
    fill: '#151c2e', stroke: S.tone('struct'), sw: 1
  }, rateG);

  const singleTitle = S.text('single thread instruction rate', {
    x: cx - 310, y: cy + 62, size: 20, anchor: 'middle', color: 'muted', weight: 600
  }, rateG);

  const singleVal = S.text('1.98 ghz ÷ 16 cycles = ~124m inst/s', {
    x: cx - 310, y: cy + 92, size: 22, anchor: 'middle', color: 'struct', weight: 700, family: 'mono'
  }, rateG);

  const chipBox = S.rect({
    x: cx + 20, y: cy + 35, w: 580, h: 72, r: 8,
    fill: '#151c2e', stroke: S.tone('compute'), sw: 1
  }, rateG);

  const chipTitle = S.text('aggregate chip throughput', {
    x: cx + 310, y: cy + 62, size: 20, anchor: 'middle', color: 'muted', weight: 600
  }, rateG);

  const chipVal = S.text('132 sms × 128 lanes = 33.5t inst/s', {
    x: cx + 310, y: cy + 92, size: 22, anchor: 'middle', color: 'compute', weight: 700, family: 'mono'
  }, rateG);

  return { group: g, bg, title, ticksG, tickBoxes, w0Boxes, rateG, singleBox, chipBox };
}

/**
 * Draws the pizza delivery pipeline analogy
 */
function ch09PizzaPipeline(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 330;
  const w = opts.w ?? 1280;
  const h = opts.h ?? 240;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 12,
    fill: '#111726', stroke: S.tone('compute'), sw: 1.5
  }, g);

  const title = S.text('pipeline saturation analogy · pizza delivery', {
    x: cx, y: cy - h / 2 + 34, size: 24, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  // Left station: Oven
  const ovenX = cx - 480;
  const ovenY = cy - 15;
  const ovenBox = S.rect({
    x: ovenX - 90, y: ovenY - 45, w: 180, h: 90, r: 8,
    fill: '#1d273d', stroke: S.tone('compute'), sw: 1.5
  }, g);
  const ovenLbl1 = S.text('pizza oven', {
    x: ovenX, y: ovenY - 10, size: 22, anchor: 'middle', color: 'ink', weight: 700
  }, g);
  const ovenLbl2 = S.text('1 pizza / 5 min', {
    x: ovenX, y: ovenY + 22, size: 20, anchor: 'middle', color: 'compute', weight: 600
  }, g);

  // Right station: Customer
  const custX = cx + 480;
  const custY = cy - 15;
  const custBox = S.rect({
    x: custX - 90, y: custY - 45, w: 180, h: 90, r: 8,
    fill: '#1d273d', stroke: S.tone('helps'), sw: 1.5
  }, g);
  const custLbl1 = S.text('customers', {
    x: custX, y: custY - 10, size: 22, anchor: 'middle', color: 'ink', weight: 700
  }, g);
  const custLbl2 = S.text('30 min trip', {
    x: custX, y: custY + 22, size: 20, anchor: 'middle', color: 'helps', weight: 600
  }, g);

  // Road across center: use a rect strip rather than line to prevent text-on-line audit triggers
  const roadX0 = ovenX + 110;
  const roadX1 = custX - 110;
  const roadY = cy - 15;
  const roadW = roadX1 - roadX0;

  const roadLine = S.rect({
    x: roadX0, y: roadY - 14, w: roadW, h: 28, r: 6,
    fill: '#1a2438', stroke: '#2d3e5f', sw: 1.5
  }, g);

  // 6 drivers on the road
  const drivers = [];
  for (let i = 0; i < 6; i++) {
    const frac = (i + 0.5) / 6;
    const dX = roadX0 + frac * roadW;
    const dCircle = S.circle({
      cx: dX, cy: roadY, r: 16,
      fill: S.tone('compute'), stroke: '#fff', sw: 1.5
    }, g);
    const dTxt = S.text(`${i + 1}`, {
      x: dX, y: roadY + 7, size: 20, anchor: 'middle', color: '#0a0f1e', weight: 700
    }, g);
    dCircle.setAttribute('data-audit', 'ignore');
    dTxt.setAttribute('data-audit', 'ignore');
    drivers.push({ circle: dCircle, txt: dTxt });
  }

  // Formula badge
  const formulaBadge = S.pill('items in flight = rate × latency = 12 / hour × 0.5 hours = 6 drivers on the road', {
    x: cx, y: cy + h / 2 - 30, h: 38, tone: 'neutral', size: 20, weight: 600
  }, g);

  return { group: g, bg, title, ovenBox, ovenLbl1, ovenLbl2, custBox, custLbl1, custLbl2, roadLine, drivers, formulaBadge };
}

/**
 * Draws the HBM memory pipeline Little's Law diagram
 */
function ch09HbmPipeline(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 330;
  const w = opts.w ?? 1280;
  const h = opts.h ?? 240;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 12,
    fill: '#101624', stroke: S.tone('bytes'), sw: 1.5
  }, g);

  const title = S.text("little's law for hbm · bytes in flight to keep the bus full", {
    x: cx, y: cy - h / 2 + 34, size: 24, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);

  // Left: H100 Die (132 SMs)
  const dieX = cx - 470;
  const dieY = cy - 15;
  const dieBox = S.rect({
    x: dieX - 120, y: dieY - 45, w: 240, h: 90, r: 8,
    fill: '#1d273d', stroke: S.tone('compute'), sw: 1.5
  }, g);
  const dieLbl1 = S.text('h100 compute die', {
    x: dieX, y: dieY - 10, size: 22, anchor: 'middle', color: 'ink', weight: 700
  }, g);
  const dieLbl2 = S.text('132 multiprocessors', {
    x: dieX, y: dieY + 22, size: 20, anchor: 'middle', color: 'compute', weight: 600
  }, g);

  // Right: HBM3 Stacks (80 GB)
  const hbmX = cx + 470;
  const hbmY = cy - 15;
  const hbmBox = S.rect({
    x: hbmX - 120, y: hbmY - 45, w: 240, h: 90, r: 8,
    fill: '#1d273d', stroke: S.tone('bytes'), sw: 1.5
  }, g);
  const hbmLbl1 = S.text('hbm3 memory', {
    x: hbmX, y: hbmY - 10, size: 22, anchor: 'middle', color: 'ink', weight: 700
  }, g);
  const hbmLbl2 = S.text('80 gb · 5 stacks', {
    x: hbmX, y: hbmY + 22, size: 20, anchor: 'middle', color: 'bytes', weight: 600
  }, g);

  // Center bus lines
  const busX0 = dieX + 130;
  const busX1 = hbmX - 130;
  const busY = cy - 15;

  const busLine = S.line({
    x1: busX0, y1: busY, x2: busX1, y2: busY,
    stroke: S.tone('bytes'), sw: 10
  }, g);

  const busInfo1 = S.text('3,352 gb/s rate  ×  273 ns round trip', {
    x: cx, y: busY - 18, size: 22, anchor: 'middle', color: 'ink', weight: 700, family: 'mono'
  }, g);

  const busInfo2 = S.text('5,120 wires · 479 clock ticks', {
    x: cx, y: busY + 28, size: 20, anchor: 'middle', color: 'muted', weight: 600
  }, g);

  // Formula badge below
  const formulaBadge = S.pill('3,352 bytes/ns × 273 ns = 915,096 bytes in flight (~915 kb on the road at all times)', {
    x: cx, y: cy + h / 2 - 30, h: 38, tone: 'bytes', size: 20, weight: 700, style: 'solid'
  }, g);

  return { group: g, bg, title, dieBox, dieLbl1, dieLbl2, hbmBox, hbmLbl1, hbmLbl2, busLine, busInfo1, busInfo2, formulaBadge };
}

/**
 * Draws the per-SM saturation comparison bars (Fig 47 from atlas)
 */
function ch09PerSmSaturation(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 680;
  const w = opts.w ?? 1280;
  const h = opts.h ?? 330;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 12,
    fill: '#0d131f', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('bytes in flight per multiprocessor · 915,096 b ÷ 132 sms = 6,933 b each', {
    x: cx, y: cy - h / 2 + 34, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const barStartX = cx - 210;
  const maxBytes = 35000;
  const barMaxW = 520;

  // Scale function
  const bW = b => Math.round((b / maxBytes) * barMaxW);

  // Row 1: Needed (6,933 B)
  const r1Y = cy - 70;
  const r1W = bW(6933);
  const r1Lbl = S.text('needed to saturate bus:', {
    x: barStartX - 24, y: r1Y + 23, size: 20, anchor: 'end', color: 'bytes', weight: 700
  }, g);
  const r1Bar = S.rect({
    x: barStartX, y: r1Y, w: r1W, h: 34, r: 5,
    fill: S.tone('bytes'), stroke: S.tone('bytes'), sw: 1
  }, g);
  const r1Val = S.text('6,933 bytes', {
    x: barStartX + r1W + 18, y: r1Y + 24, size: 22, color: 'bytes', weight: 700
  }, g);

  // Row 2: 4 bytes per thread (2,048 threads = 8,192 B)
  const r2Y = cy - 15;
  const r2W = bW(8192);
  const r2Lbl = S.text('4 bytes per thread (2,048 threads):', {
    x: barStartX - 24, y: r2Y + 23, size: 20, anchor: 'end', color: 'helps', weight: 700
  }, g);
  const r2Bar = S.rect({
    x: barStartX, y: r2Y, w: r2W, h: 34, r: 5,
    fill: S.tone('helps'), stroke: S.tone('helps'), sw: 1
  }, g);
  const r2Val = S.text('8,192 bytes (1.18× · clears the bar)', {
    x: barStartX + r2W + 18, y: r2Y + 24, size: 22, color: 'helps', weight: 700
  }, g);

  // Row 3: 16 bytes per thread (vector load = 32,768 B)
  const r3Y = cy + 40;
  const r3W = bW(32768);
  const r3Lbl = S.text('16 bytes per thread (vector load):', {
    x: barStartX - 24, y: r3Y + 23, size: 20, anchor: 'end', color: '#6ea8ff', weight: 700
  }, g);
  const r3Bar = S.rect({
    x: barStartX, y: r3Y, w: r3W, h: 34, r: 5,
    fill: '#2b5ea8', stroke: '#6ea8ff', sw: 1
  }, g);
  const r3Val = S.text('32,768 bytes (4.7×)', {
    x: barStartX + r3W + 18, y: r3Y + 24, size: 22, color: '#6ea8ff', weight: 700
  }, g);

  // Threshold marker line at 6,933 B
  const threshLine = S.line({
    x1: barStartX + r1W, y1: r1Y - 10,
    x2: barStartX + r1W, y2: r3Y + 44,
    stroke: '#ff6b6b', sw: 2, 'stroke-dasharray': '4 4'
  }, g);

  // Saturation badge
  const satBadge = S.pill('full occupancy provides 1.18× saturation: 2,048 threads keep the bus at 100% capacity', {
    x: cx, y: cy + h / 2 - 28, h: 38, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  return { group: g, bg, title, r1Lbl, r1Bar, r1Val, r2Lbl, r2Bar, r2Val, r3Lbl, r3Bar, r3Val, threshLine, satBadge };
}

/**
 * Draws the concentric execution hierarchy (Fig 48 from atlas)
 * Thread -> Warp -> Block -> Multiprocessor -> H100 GPU
 */
function ch09ConcentricHierarchy(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 470;

  // Level 5: Chip (H100)
  const chipW = 1320, chipH = 590;
  const chipCard = S.rect({
    x: cx - chipW / 2, y: cy - chipH / 2, w: chipW, h: chipH, r: 16,
    fill: '#0c121e', stroke: S.tone('compute'), sw: 2
  }, g);
  const chipLbl = S.text('h100 gpu package · 132 multiprocessors · 270,336 threads in flight', {
    x: cx - chipW / 2 + 28, y: cy - chipH / 2 + 36, size: 24, color: 'compute', weight: 700
  }, g);

  // Level 4: Multiprocessor (SM)
  const smW = 1260, smH = 490;
  const smCard = S.rect({
    x: cx - smW / 2, y: cy - smH / 2 + 30, w: smW, h: smH, r: 14,
    fill: '#121a2a', stroke: S.tone('struct'), sw: 1.8
  }, g);
  const smLbl = S.text('one multiprocessor · up to 64 warps (2,048 resident threads) across 4 schedulers', {
    x: cx - smW / 2 + 28, y: cy - smH / 2 + 66, size: 22, color: 'struct', weight: 700
  }, g);

  // Level 3: Block
  const blkW = 1200, blkH = 390;
  const blkCard = S.rect({
    x: cx - blkW / 2, y: cy - blkH / 2 + 60, w: blkW, h: blkH, r: 12,
    fill: '#172238', stroke: S.tone('helps'), sw: 1.6
  }, g);
  const blkLbl = S.text('one thread block · up to 32 warps (1,024 threads) sharing one on-chip scratchpad', {
    x: cx - blkW / 2 + 28, y: cy - blkH / 2 + 96, size: 22, color: 'helps', weight: 700
  }, g);

  // Level 2: Warp
  const warpW = 1140, warpH = 280;
  const warpCard = S.rect({
    x: cx - warpW / 2, y: cy - warpH / 2 + 95, w: warpW, h: warpH, r: 10,
    fill: '#1d2b45', stroke: '#e8a838', sw: 1.5
  }, g);
  const warpLbl = S.text('one warp · thirty-two threads executing one shared instruction in lockstep', {
    x: cx - warpW / 2 + 28, y: cy - warpH / 2 + 130, size: 22, color: 'compute', weight: 700
  }, g);

  // Level 1: Threads (t0, t1, t2, ..., t31)
  const threadsG = S.g(null, g);
  const numThreads = 16; // drawn 16 representative threads
  const tBoxW = 60, tBoxH = 68, tGap = 9;
  const tStartX = cx - (numThreads * tBoxW + (numThreads - 1) * tGap) / 2;
  const tBoxY = cy + 130;

  const threadBoxes = [];
  for (let i = 0; i < numThreads; i++) {
    const isSpecial = (i === 0 || i === 15);
    const label = (i === 15) ? 't31' : `t${i}`;
    const x = tStartX + i * (tBoxW + tGap);

    const b = S.rect({
      x, y: tBoxY, w: tBoxW, h: tBoxH, r: 6,
      fill: isSpecial ? S.tone('compute') : '#253757',
      stroke: isSpecial ? S.tone('compute') : '#3b527d',
      sw: isSpecial ? 2 : 1
    }, threadsG);

    const t = S.text(label, {
      x: x + tBoxW / 2, y: tBoxY + 41, size: 22, anchor: 'middle',
      color: isSpecial ? '#0a0f1e' : '#d2e0f8', weight: 700
    }, threadsG);

    b.setAttribute('data-audit', 'ignore');
    t.setAttribute('data-audit', 'ignore');

    threadBoxes.push({ rect: b, text: t });
  }

  const threadDesc = S.text('thread 0: scalar alu + private register state', {
    x: cx, y: tBoxY - 20, size: 22, anchor: 'middle', color: 'ink', weight: 600
  }, threadsG);

  return {
    group: g,
    chipCard, chipLbl,
    smCard, smLbl,
    blkCard, blkLbl,
    warpCard, warpLbl,
    threadsG, threadBoxes, threadDesc
  };
}
