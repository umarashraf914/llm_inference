/* ch10_common.js · Visual components for Chapter 10 ("The first sin: divergence")
   Figs 49, 50, 51, 52 from atlas:
   - ch10CpuVsGpuFork: CPU single thread fork vs GPU 32-lane lockstep fork
   - ch10WarpTwoPasses: 32-lane execution in two sequential passes (Pass 1 & Pass 2)
   - ch10ActiveMaskRegister: 32-bit hardware active mask register with discard indicator
   - ch10NestedForksBars: Exponential efficiency decay (100% -> 50% -> 25% -> 12.5%)
   - ch10TwoSinsDiagram: Side-by-side comparison of Divergence vs Uncoalesced Access
*/

/**
 * Draws the CPU single thread fork vs GPU 32-lane warp fork (Figs 49, 50)
 */
function ch10CpuVsGpuFork(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 260;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 180;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 12,
    fill: '#101622', stroke: '#222f48', sw: 1.5
  }, g);

  // Left half: CPU Core (1 thread, 1 clean path)
  const cpuX = cx - 320;
  const cpuTitle = S.text('cpu: 1 thread at a branch', {
    x: cpuX, y: cy - 42, size: 22, anchor: 'middle', color: 'helps', weight: 700
  }, g);

  const cpuBranch = S.rect({
    x: cpuX - 260, y: cy - 20, w: 520, h: 56, r: 8,
    fill: '#152233', stroke: S.tone('helps'), sw: 1.5
  }, g);

  const cpuText = S.text('takes 1 path · zero wasted cycles', {
    x: cpuX, y: cy + 16, size: 20, anchor: 'middle', color: 'ink', weight: 600
  }, g);

  // Divider
  const divLine = S.line({
    x1: cx, y1: cy - 60, x2: cx, y2: cy + 60,
    stroke: '#283856', sw: 1.5, 'stroke-dasharray': '4 4'
  }, g);

  // Right half: GPU Warp (32 lanes, data differs)
  const gpuX = cx + 320;
  const gpuTitle = S.text('gpu: 32 lanes at a branch', {
    x: gpuX, y: cy - 42, size: 22, anchor: 'middle', color: 'violet', weight: 700
  }, g);

  const gpuBranch = S.rect({
    x: gpuX - 260, y: cy - 20, w: 520, h: 56, r: 8,
    fill: '#24162e', stroke: S.tone('violet'), sw: 1.5
  }, g);

  const gpuText = S.text('1 instruction · lanes disagree on data', {
    x: gpuX, y: cy + 16, size: 20, anchor: 'middle', color: 'ink', weight: 600
  }, g);

  return { group: g, bg, cpuTitle, cpuBranch, cpuText, divLine, gpuTitle, gpuBranch, gpuText };
}

/**
 * Draws the 32-lane execution in two sequential passes (Pass 1: if, Pass 2: else)
 */
function ch10WarpTwoPasses(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 570;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 370;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 12,
    fill: '#0f1422', stroke: S.tone('violet'), sw: 1.5
  }, g);

  const title = S.text('warp divergence · hardware serializes branches in two sequential passes', {
    x: cx, y: cy - h / 2 + 34, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const numLanes = 32;
  const laneW = 34;
  const laneGap = 5;
  const totalW = numLanes * laneW + (numLanes - 1) * laneGap; // ~1243px
  const startX = cx - totalW / 2;

  // Pass 1: if-path (Lanes 0-15 active amber, 16-31 idle grey)
  const p1Y = cy - 70;
  const p1H = 70;
  const p1Lbl = S.text('pass 1: if-path executes (lanes 0–15 active, lanes 16–31 masked/idle)', {
    x: startX, y: p1Y - 14, size: 20, color: 'compute', weight: 700
  }, g);

  const p1Boxes = [];
  for (let i = 0; i < numLanes; i++) {
    const lx = startX + i * (laneW + laneGap);
    const isIf = (i < 16);
    const box = S.rect({
      x: lx, y: p1Y, w: laneW, h: p1H, r: 4,
      fill: isIf ? S.tone('compute') : '#182030',
      stroke: isIf ? S.tone('compute') : '#28344c',
      sw: isIf ? 2 : 1
    }, g);
    const txt = S.text(isIf ? 'if' : '—', {
      x: lx + laneW / 2, y: p1Y + p1H / 2 + 7, size: 20, anchor: 'middle',
      color: isIf ? '#0a0f1e' : 'muted', weight: isIf ? 700 : 500
    }, g);
    box.setAttribute('data-audit', 'ignore');
    txt.setAttribute('data-audit', 'ignore');
    p1Boxes.push({ box, txt, isIf });
  }

  // Pass 2: else-path (Lanes 0-15 idle grey, 16-31 active violet)
  const p2Y = cy + 50;
  const p2H = 70;
  const p2Lbl = S.text('pass 2: else-path executes (lanes 0–15 masked/idle, lanes 16–31 active)', {
    x: startX, y: p2Y - 14, size: 20, color: 'violet', weight: 700
  }, g);

  const p2Boxes = [];
  for (let i = 0; i < numLanes; i++) {
    const lx = startX + i * (laneW + laneGap);
    const isElse = (i >= 16);
    const box = S.rect({
      x: lx, y: p2Y, w: laneW, h: p2H, r: 4,
      fill: isElse ? S.tone('violet') : '#182030',
      stroke: isElse ? S.tone('violet') : '#28344c',
      sw: isElse ? 2 : 1
    }, g);
    const txt = S.text(isElse ? 'else' : '—', {
      x: lx + laneW / 2, y: p2Y + p2H / 2 + 7, size: 20, anchor: 'middle',
      color: isElse ? '#0a0f1e' : 'muted', weight: isElse ? 700 : 500
    }, g);
    box.setAttribute('data-audit', 'ignore');
    txt.setAttribute('data-audit', 'ignore');
    p2Boxes.push({ box, txt, isElse });
  }

  // Penalty badge
  const penaltyBadge = S.pill('balanced if/else cuts throughput in half · 2 passes spent to do 1 pass of work', {
    x: cx, y: cy + h / 2 - 28, h: 38, tone: 'violet', size: 20, weight: 700, style: 'solid'
  }, g);

  return { group: g, bg, title, p1Lbl, p1Boxes, p2Lbl, p2Boxes, penaltyBadge };
}

/**
 * Draws the 32-bit hardware active mask register (Fig 51 from atlas)
 */
function ch10ActiveMaskRegister(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 300;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 230;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 12,
    fill: '#101622', stroke: S.tone('struct'), sw: 1.5
  }, g);

  const title = S.text('hardware active mask · one bit per lane (32-bit register)', {
    x: cx, y: cy - h / 2 + 34, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const numBits = 32;
  const bW = 34, bH = 50, bGap = 5;
  const totalW = numBits * bW + (numBits - 1) * bGap;
  const startX = cx - totalW / 2;
  const bY = cy - 20;

  const bits = [];
  for (let i = 0; i < numBits; i++) {
    const isOne = (i < 16);
    const bx = startX + i * (bW + bGap);

    const box = S.rect({
      x: bx, y: bY, w: bW, h: bH, r: 4,
      fill: isOne ? S.tone('compute') : '#18243b',
      stroke: isOne ? S.tone('compute') : '#2f4368',
      sw: isOne ? 2 : 1
    }, g);

    const val = S.text(isOne ? '1' : '0', {
      x: bx + bW / 2, y: bY + 33, size: 22, anchor: 'middle',
      color: isOne ? '#0a0f1e' : 'muted', weight: 700
    }, g);

    box.setAttribute('data-audit', 'ignore');
    val.setAttribute('data-audit', 'ignore');

    bits.push({ box, val, isOne });
  }

  // Explanation note at bottom
  const note = S.text('bit = 1: lane commits output  |  bit = 0: lane executes slot, then discards result', {
    x: cx, y: cy + h / 2 - 28, size: 20, anchor: 'middle', color: 'muted', weight: 600
  }, g);

  return { group: g, bg, title, bits, note };
}

/**
 * Draws the nested branch efficiency bars (Fig 51 from atlas)
 */
function ch10NestedForksBars(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 625;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 330;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 12,
    fill: '#0f1420', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('useful share of issue slots · each nested fork doubles passes and halves work', {
    x: cx, y: cy - h / 2 + 34, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const startX = cx - 180;
  const maxW = 560;

  const rowsData = [
    { label: 'no fork (1 pass):', pct: 100, valText: '100% useful (1 pass)', tone: 'helps' },
    { label: 'one fork (2 passes):', pct: 50, valText: '50% useful (2 passes)', tone: 'compute' },
    { label: 'two nested forks:', pct: 25, valText: '25% useful (4 passes)', tone: 'violet' },
    { label: 'three nested forks:', pct: 12.5, valText: '12.5% useful (8 passes)', tone: 'bytes' }
  ];

  const rows = [];
  const startY = cy - 65;
  const rowSpacing = 48;

  for (let i = 0; i < rowsData.length; i++) {
    const rd = rowsData[i];
    const rY = startY + i * rowSpacing;
    const rW = Math.round((rd.pct / 100) * maxW);

    const lbl = S.text(rd.label, {
      x: startX - 24, y: rY + 23, size: 20, anchor: 'end', color: 'ink', weight: 600
    }, g);

    const bar = S.rect({
      x: startX, y: rY, w: rW, h: 32, r: 5,
      fill: S.tone(rd.tone), stroke: S.tone(rd.tone), sw: 1
    }, g);

    const val = S.text(rd.valText, {
      x: startX + rW + 18, y: rY + 24, size: 22, color: rd.tone, weight: 700
    }, g);

    rows.push({ lbl, bar, val });
  }

  // Agreement note badge
  const agreeBadge = S.pill('branching is free when all 32 lanes agree: 1 pass · 100% peak efficiency', {
    x: cx, y: cy + h / 2 - 28, h: 38, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  return { group: g, bg, title, rows, agreeBadge };
}

/**
 * Draws the Two Cardinal Sins side-by-side comparison (Atlas Fig 52)
 */
function ch10TwoSinsDiagram(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 470;
  const colW = 630;
  const colH = 510;

  // Center root cause header
  const rootBox = S.rect({
    x: cx - 460, y: cy - 250, w: 920, h: 56, r: 8,
    fill: '#152033', stroke: S.tone('struct'), sw: 1.5
  }, g);
  const rootText = S.text('shared root cause: thirty-two lanes are bound in hardware to act as one', {
    x: cx, y: cy - 215, size: 22, anchor: 'middle', color: 'struct', weight: 700
  }, g);

  // Left Sin: Divergence
  const leftX = cx - colW - 20;
  const leftY = cy - 170;
  const leftBg = S.rect({
    x: leftX, y: leftY, w: colW, h: colH, r: 12,
    fill: '#141022', stroke: S.tone('violet'), sw: 1.8
  }, g);

  const leftTitle = S.text('sin 1: divergence', {
    x: leftX + colW / 2, y: leftY + 40, size: 24, anchor: 'middle', color: 'violet', weight: 700
  }, g);
  const leftSub = S.text('lanes want different instructions', {
    x: leftX + colW / 2, y: leftY + 74, size: 20, anchor: 'middle', color: 'muted', weight: 600
  }, g);

  // Divergence diagram: Forking paths
  const lForkY = leftY + 115;
  const lForkBox = S.rect({
    x: leftX + 40, y: lForkY, w: colW - 80, h: 220, r: 8,
    fill: '#1a152e', stroke: '#352554', sw: 1
  }, g);

  const lWarpLbl = S.text('warp of 32 lanes encounters branch', {
    x: leftX + colW / 2, y: lForkY + 36, size: 20, anchor: 'middle', color: 'ink', weight: 700
  }, g);

  const lPass1 = S.rect({
    x: leftX + 70, y: lForkY + 60, w: colW - 140, h: 46, r: 6,
    fill: S.tone('compute'), stroke: S.tone('compute'), sw: 1
  }, g);
  const lPass1Txt = S.text('pass 1: if-path (16 active, 16 masked)', {
    x: leftX + colW / 2, y: lForkY + 90, size: 20, anchor: 'middle', color: '#0a0f1e', weight: 700
  }, g);

  const lPass2 = S.rect({
    x: leftX + 70, y: lForkY + 120, w: colW - 140, h: 46, r: 6,
    fill: S.tone('violet'), stroke: S.tone('violet'), sw: 1
  }, g);
  const lPass2Txt = S.text('pass 2: else-path (16 masked, 16 active)', {
    x: leftX + colW / 2, y: lForkY + 150, size: 20, anchor: 'middle', color: '#0a0f1e', weight: 700
  }, g);

  const lWastedPill = S.pill('wastes arithmetic issue slots (compute is cheap)', {
    x: leftX + colW / 2, y: leftY + colH - 45, h: 44, tone: 'violet', size: 20, weight: 700
  }, g);

  // Right Sin: Uncoalesced Access
  const rightX = cx + 20;
  const rightY = cy - 170;
  const rightBg = S.rect({
    x: rightX, y: rightY, w: colW, h: colH, r: 12,
    fill: '#1f1316', stroke: S.tone('bytes'), sw: 1.8
  }, g);

  const rightTitle = S.text('sin 2: uncoalesced access', {
    x: rightX + colW / 2, y: rightY + 40, size: 24, anchor: 'middle', color: 'bytes', weight: 700
  }, g);
  const rightSub = S.text('lanes want scattered addresses', {
    x: rightX + colW / 2, y: rightY + 74, size: 20, anchor: 'middle', color: 'muted', weight: 600
  }, g);

  // Uncoalesced diagram: Scattered memory reads
  const rDramY = rightY + 115;
  const rDramBox = S.rect({
    x: rightX + 40, y: rDramY, w: colW - 80, h: 220, r: 8,
    fill: '#2a171b', stroke: '#522931', sw: 1
  }, g);

  const rWarpLbl = S.text('warp makes scattered memory requests', {
    x: rightX + colW / 2, y: rDramY + 36, size: 20, anchor: 'middle', color: 'ink', weight: 700
  }, g);

  // 4 separate DRAM burst lines
  const rBurst1 = S.rect({
    x: rightX + 70, y: rDramY + 60, w: colW - 140, h: 46, r: 6,
    fill: S.tone('bytes'), stroke: S.tone('bytes'), sw: 1
  }, g);
  const rBurst1Txt = S.text('burst 1: 32 bytes fetched (only 4 b used)', {
    x: rightX + colW / 2, y: rDramY + 90, size: 20, anchor: 'middle', color: '#0a0f1e', weight: 700
  }, g);

  const rBurst2 = S.rect({
    x: rightX + 70, y: rDramY + 120, w: colW - 140, h: 46, r: 6,
    fill: '#b83b3b', stroke: S.tone('bytes'), sw: 1
  }, g);
  const rBurst2Txt = S.text('burst 2..32: separate 32-byte bus cycles', {
    x: rightX + colW / 2, y: rDramY + 150, size: 20, anchor: 'middle', color: '#fff', weight: 700
  }, g);

  const rWastedPill = S.pill('wastes memory bandwidth (bandwidth is scarce)', {
    x: rightX + colW / 2, y: rightY + colH - 45, h: 44, tone: 'bytes', size: 20, weight: 700
  }, g);

  return {
    group: g,
    rootBox, rootText,
    leftBg, leftTitle, leftSub, lForkBox, lWarpLbl, lPass1, lPass1Txt, lPass2, lPass2Txt, lWastedPill,
    rightBg, rightTitle, rightSub, rDramBox, rWarpLbl, rBurst1, rBurst1Txt, rBurst2, rBurst2Txt, rWastedPill
  };
}
