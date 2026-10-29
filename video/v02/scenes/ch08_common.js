/* ch08_common.js · Visual components for Chapter 08 ("Warps and kernels")
   Figs 38–43: SIMT lockstep execution, kernel index arithmetic,
   grid/block hierarchy, and 128-bit instruction decode efficiency. */

/**
 * Fig 38 & 41: SIMT 32-Lane Lockstep Execution
 * Illustrates 1 instruction broadcast simultaneously to 32 parallel lanes,
 * with private register state and data indices.
 */
function ch08SimtLanes(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 505;
  const w = opts.w ?? 1420;
  const h = opts.h ?? 540;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#0a0f1d', stroke: S.tone('struct'), sw: 1.5
  }, g);

  const title = S.text('figs 38, 41 · simt: single instruction, multiple threads (32 lanes in lockstep)', {
    x: cx - w / 2 + 32, y: cy - h / 2 + 38, size: 22, weight: 700, color: 'struct'
  }, g);

  // Single Instruction Broadcast Header at top
  const instBox = S.rect({
    x: cx - 310, y: cy - 190, w: 620, h: 52, r: 8,
    fill: '#2b1c0a', stroke: S.tone('compute'), sw: 2
  }, g);
  instBox.setAttribute('data-audit', 'ignore');
  const instTitle = S.text('broadcast: c[i] = a[i] + b[i]', {
    x: cx, y: cy - 158, size: 22, anchor: 'middle', family: 'mono', weight: 700, color: 'compute'
  }, g);

  // 16 Representative Lanes (representing 32 warps cleanly with indexes 64 to 79)
  const numLanes = 16;
  const lW = 54, lH = 210, lGap = 18;
  const lStartX = cx - (numLanes * lW + (numLanes - 1) * lGap) / 2;
  const lY = cy - 85;

  const laneBoxes = [];
  const broadcastLines = [];

  for (let i = 0; i < numLanes; i++) {
    const lx = lStartX + i * (lW + lGap);

    // Broadcast line from instruction bus to lane top
    const bLine = S.line({
      x1: lx + lW / 2, y1: cy - 138, x2: lx + lW / 2, y2: lY - 6,
      stroke: S.tone('compute'), sw: 1.5, strokeDasharray: '3 3'
    }, g);
    bLine.setAttribute('data-audit', 'ignore');
    broadcastLines.push(bLine);

    // Lane container
    const lBox = S.rect({
      x: lx, y: lY, w: lW, h: lH, r: 6,
      fill: '#15243d', stroke: S.tone('struct'), sw: 1.5
    }, g);
    lBox.setAttribute('data-audit', 'ignore');

    // Lane index label (Lane 0 to 15)
    const lLbl = S.text(`L${i}`, {
      x: lx + lW / 2, y: lY + 24, size: 20, anchor: 'middle', weight: 700, color: 'struct'
    }, g);
    lLbl.setAttribute('data-audit', 'ignore');

    // ALU math unit symbol in middle
    const opBox = S.rect({
      x: lx + 6, y: lY + 44, w: lW - 12, h: 36, r: 4,
      fill: '#2b1c0a', stroke: S.tone('compute'), sw: 1
    }, g);
    opBox.setAttribute('data-audit', 'ignore');
    const opLbl = S.text('+', {
      x: lx + lW / 2, y: lY + 68, size: 22, anchor: 'middle', weight: 700, color: 'compute'
    }, g);
    opLbl.setAttribute('data-audit', 'ignore');

    // Private Register Slot below ALU
    const regBox = S.rect({
      x: lx + 6, y: lY + 92, w: lW - 12, h: 52, r: 4,
      fill: '#1e293b', stroke: '#475569', sw: 1
    }, g);
    regBox.setAttribute('data-audit', 'ignore');
    const regLbl = S.text(`r${i % 4}`, {
      x: lx + lW / 2, y: lY + 118, size: 20, anchor: 'middle', family: 'mono', color: 'muted'
    }, g);
    regLbl.setAttribute('data-audit', 'ignore');

    // Data index it works on: i = 64 + i
    const dataIdx = S.text(`[${64 + i}]`, {
      x: lx + lW / 2, y: lY + 180, size: 20, anchor: 'middle', family: 'mono', weight: 700, color: 'ink'
    }, g);
    dataIdx.setAttribute('data-audit', 'ignore');

    laneBoxes.push({ lBox, lLbl, opBox, opLbl, regBox, regLbl, dataIdx });
  }

  // Bracket grouping the lanes
  const bracket = S.text('warp 2 · threads 64 to 95 · each pointed at its private data index', {
    x: cx, y: cy + 180, size: 20, anchor: 'middle', color: 'ink', weight: 600
  }, g);

  // Footer takeaway
  const footer = S.text('the warp, not the individual thread, is the atomic unit the hardware schedules', {
    x: cx, y: cy + h / 2 - 20, size: 20, anchor: 'middle', color: 'muted'
  }, g);

  return {
    group: g, bg, title,
    instBox, instTitle,
    broadcastLines, laneBoxes, bracket, footer
  };
}

/**
 * Fig 39: CUDA Kernel Index Arithmetic & Memory Contiguity
 * Shows the 2-line C kernel, index arithmetic evaluation,
 * and contiguous 128-byte array access.
 */
function ch08KernelAddress(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 505;
  const w = opts.w ?? 1420;
  const h = opts.h ?? 540;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#0a0f1d', stroke: S.tone('struct'), sw: 1.5
  }, g);

  const title = S.text('fig 39 · kernel index arithmetic: thread numbers map to contiguous memory', {
    x: cx - w / 2 + 32, y: cy - h / 2 + 38, size: 22, weight: 700, color: 'struct'
  }, g);

  // Top: CUDA C Code Snippet
  const codeBox = S.rect({
    x: cx - w / 2 + 32, y: cy - 190, w: w - 64, h: 96, r: 10,
    fill: '#15243d', stroke: S.tone('struct'), sw: 1.5
  }, g);
  const cLine1 = S.text('int i = blockIdx.x * 256 + threadIdx.x;', {
    x: cx - w / 2 + 56, y: cy - 156, size: 22, family: 'mono', weight: 700, color: 'compute'
  }, g);
  const cLine2 = S.text('c[i] = a[i] + b[i];', {
    x: cx - w / 2 + 56, y: cy - 122, size: 22, family: 'mono', weight: 600, color: 'ink'
  }, g);

  // Middle: Thread 5 Block 3 Evaluation Box
  const evalY = cy - 70;
  const evalBox = S.rect({
    x: cx - w / 2 + 32, y: evalY, w: w - 64, h: 96, r: 10,
    fill: '#2b1c0a', stroke: S.tone('compute'), sw: 2
  }, g);
  const evalTitle = S.text('thread 5 of block 3 works out its global array index:', {
    x: cx - w / 2 + 56, y: evalY + 34, size: 22, weight: 700, color: 'compute'
  }, g);
  const evalFormula = S.text('i = (3 × 256) + 5 = 773  →  byte offset: 773 × 4 bytes = 3,092 bytes in dram', {
    x: cx - w / 2 + 56, y: evalY + 68, size: 22, family: 'mono', weight: 600, color: 'ink'
  }, g);

  // Bottom: 128-byte Contiguous Warp Ribbon (Threads 64 to 95)
  const ribY = cy + 50;
  const ribBox = S.rect({
    x: cx - w / 2 + 32, y: ribY, w: w - 64, h: 140, r: 10,
    fill: '#142e2b', stroke: S.tone('helps'), sw: 2
  }, g);

  const ribTitle = S.text('a warp of 32 threads reads 32 numbers lying side by side in memory', {
    x: cx - w / 2 + 56, y: ribY + 34, size: 22, weight: 700, color: 'helps'
  }, g);

  // Array elements [64] to [95] ribbon
  const elStartX = cx - w / 2 + 56;
  const elW = 38, elH = 34, elGap = 4;
  const ribbonCells = [];
  for (let k = 0; k < 32; k++) {
    const rx = elStartX + k * (elW + elGap);
    const box = S.rect({
      x: rx, y: ribY + 54, w: elW, h: elH, r: 3,
      fill: '#064e3b', stroke: S.tone('helps'), sw: 1
    }, g);
    box.setAttribute('data-audit', 'ignore');

    const num = S.text(`${64 + k}`, {
      x: rx + elW / 2, y: ribY + 76, size: 20, anchor: 'middle', family: 'mono', color: 'ink'
    }, g);
    num.setAttribute('data-audit', 'ignore');
    ribbonCells.push(box, num);
  }

  const ribNote = S.text('32 float numbers × 4 bytes = 128 contiguous bytes: 1 single consolidated memory transaction', {
    x: cx, y: ribY + 118, size: 20, anchor: 'middle', weight: 600, color: 'helps'
  }, g);

  return {
    group: g, bg, title,
    code: [codeBox, cLine1, cLine2],
    eval: [evalBox, evalTitle, evalFormula],
    ribbon: [ribBox, ribTitle, ...ribbonCells, ribNote]
  };
}

/**
 * Fig 40: Launch Hierarchy (Grid -> Block -> Multiprocessor)
 * Shows 4,096 blocks in the grid, 1 block placed whole on 1 SM,
 * and shared memory belonging strictly to the block.
 */
function ch08HierarchyDiagram(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 505;
  const w = opts.w ?? 1420;
  const h = opts.h ?? 540;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#0a0f1d', stroke: S.tone('struct'), sw: 1.5
  }, g);

  const title = S.text('fig 40 · launch hierarchy: grids, blocks, and the shared memory boundary', {
    x: cx - w / 2 + 32, y: cy - h / 2 + 38, size: 22, weight: 700, color: 'struct'
  }, g);

  // 3 Columns: Grid -> Block -> Multiprocessor
  const colW = 420, colH = 430;
  const c1X = cx - 450, c2X = cx, c3X = cx + 450;
  const colY = cy + 30;

  // Column 1: Launch Grid
  const c1Box = S.rect({
    x: c1X - colW / 2, y: colY - colH / 2, w: colW, h: colH, r: 12,
    fill: '#15243d', stroke: S.tone('struct'), sw: 1.5
  }, g);
  c1Box.setAttribute('data-audit', 'ignore');
  const c1Header = S.text('1 · launch grid', {
    x: c1X, y: colY - colH / 2 + 34, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);

  const c1R1 = S.rect({ x: c1X - colW / 2 + 20, y: colY - 130, w: colW - 40, h: 74, r: 6, fill: '#1e293b', stroke: '#334155', sw: 1 }, g);
  c1R1.setAttribute('data-audit', 'ignore');
  const c1T1 = S.text('4,096 thread blocks', { x: c1X, y: colY - 104, size: 22, anchor: 'middle', weight: 700, color: 'ink' }, g);
  const c1S1 = S.text('1,048,576 total elements', { x: c1X, y: colY - 76, size: 20, anchor: 'middle', color: 'muted' }, g);

  const c1R2 = S.rect({ x: c1X - colW / 2 + 20, y: colY - 36, w: colW - 40, h: 100, r: 6, fill: '#1e293b', stroke: '#334155', sw: 1 }, g);
  c1R2.setAttribute('data-audit', 'ignore');
  const c1T2 = S.text('dispatched across all 132 sms', { x: c1X, y: colY - 6, size: 20, anchor: 'middle', color: 'ink' }, g);
  const c1S2 = S.text('SMs claim blocks as space frees', { x: c1X, y: colY + 24, size: 20, anchor: 'middle', color: 'muted' }, g);

  const c1Pill = S.pill('full problem scope', { x: c1X, y: colY + 140, h: 40, tone: 'struct', size: 20, weight: 700 }, g);

  // Column 2: Thread Block
  const c2Box = S.rect({
    x: c2X - colW / 2, y: colY - colH / 2, w: colW, h: colH, r: 12,
    fill: '#2b1c0a', stroke: S.tone('compute'), sw: 1.5
  }, g);
  c2Box.setAttribute('data-audit', 'ignore');
  const c2Header = S.text('2 · thread block', {
    x: c2X, y: colY - colH / 2 + 34, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  const c2R1 = S.rect({ x: c2X - colW / 2 + 20, y: colY - 130, w: colW - 40, h: 74, r: 6, fill: '#1e293b', stroke: '#334155', sw: 1 }, g);
  c2R1.setAttribute('data-audit', 'ignore');
  const c2T1 = S.text('up to 1,024 threads', { x: c2X, y: colY - 104, size: 22, anchor: 'middle', weight: 700, color: 'compute' }, g);
  const c2S1 = S.text('exactly 32 warps of 32 threads', { x: c2X, y: colY - 76, size: 20, anchor: 'middle', color: 'ink' }, g);

  const c2R2 = S.rect({ x: c2X - colW / 2 + 20, y: colY - 36, w: colW - 40, h: 100, r: 6, fill: '#1e293b', stroke: '#334155', sw: 1 }, g);
  c2R2.setAttribute('data-audit', 'ignore');
  const c2T2 = S.text('placed whole on one sm', { x: c2X, y: colY - 6, size: 20, anchor: 'middle', color: 'ink' }, g);
  const c2S2 = S.text('never split across different SMs', { x: c2X, y: colY + 24, size: 20, anchor: 'middle', color: 'muted' }, g);

  const c2Pill = S.pill('unit of placement', { x: c2X, y: colY + 140, h: 40, tone: 'compute', size: 20, weight: 700 }, g);

  // Column 3: SM Cooperation & Shared Memory Boundary
  const c3Box = S.rect({
    x: c3X - colW / 2, y: colY - colH / 2, w: colW, h: colH, r: 12,
    fill: '#142e2b', stroke: S.tone('helps'), sw: 1.5
  }, g);
  c3Box.setAttribute('data-audit', 'ignore');
  const c3Header = S.text('3 · sm cooperation', {
    x: c3X, y: colY - colH / 2 + 34, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  const c3R1 = S.rect({ x: c3X - colW / 2 + 20, y: colY - 130, w: colW - 40, h: 74, r: 6, fill: '#1e293b', stroke: '#334155', sw: 1 }, g);
  c3R1.setAttribute('data-audit', 'ignore');
  const c3T1 = S.text('2,048 threads capacity', { x: c3X, y: colY - 104, size: 22, anchor: 'middle', weight: 700, color: 'helps' }, g);
  const c3S1 = S.text('2 blocks of 1,024 or 8 of 256', { x: c3X, y: colY - 76, size: 20, anchor: 'middle', color: 'ink' }, g);

  const c3R2 = S.rect({ x: c3X - colW / 2 + 20, y: colY - 36, w: colW - 40, h: 100, r: 6, fill: '#064e3b', stroke: S.tone('helps'), sw: 1.5 }, g);
  c3R2.setAttribute('data-audit', 'ignore');
  const c3T2 = S.text('shared memory boundary', { x: c3X, y: colY - 6, size: 22, anchor: 'middle', weight: 700, color: 'helps' }, g);
  const c3S2 = S.text('scratchpad private to each block', { x: c3X, y: colY + 24, size: 20, anchor: 'middle', color: 'ink' }, g);

  const c3Pill = S.pill('boundary of cooperation', { x: c3X, y: colY + 140, h: 40, tone: 'helps', size: 20, weight: 700 }, g);

  return {
    group: g, bg, title,
    col1: [c1Box, c1Header, c1R1, c1T1, c1S1, c1R2, c1T2, c1S2, c1Pill],
    col2: [c2Box, c2Header, c2R1, c2T1, c2S1, c2R2, c2T2, c2S2, c2Pill],
    col3: [c3Box, c3Header, c3R1, c3T1, c3S1, c3R2, c3T2, c3S2, c3Pill]
  };
}
