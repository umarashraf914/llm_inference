/* ch07_common.js · Visual components for Chapter 07 ("Schedulers, the copy engine, four quarters")
   Figs 33–37: Four warp schedulers, the TMA copy engine,
   and the four-quarter physical SM floor plan. */

/**
 * Fig 33 & 34: Four Warp Schedulers and 16-Warp Queues
 * Shows 4 hardware schedulers, each managing 16 resident warps,
 * scanning for ready warps and issuing across 32 lanes.
 */
function ch07SchedulerQueue(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 505;
  const w = opts.w ?? 1420;
  const h = opts.h ?? 540;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#0a0f1d', stroke: S.tone('struct'), sw: 1.5
  }, g);

  const title = S.text('figs 33, 34 · four hardware schedulers: 64 resident warps (16 per scheduler)', {
    x: cx - w / 2 + 32, y: cy - h / 2 + 38, size: 22, weight: 700, color: 'struct'
  }, g);

  // 4 Horizontal Scheduler Rows
  const rows = [];
  const rowY0 = cy - h / 2 + 75;
  const rowH = 95;

  for (let i = 0; i < 4; i++) {
    const ry = rowY0 + i * rowH;
    const rg = S.g(null, g);
    const isPrimary = (i === 0);

    // Scheduler Badge on Left
    const sBox = S.rect({
      x: cx - w / 2 + 32, y: ry, w: 180, h: 56, r: 8,
      fill: isPrimary ? '#2b1c0a' : '#15243d',
      stroke: isPrimary ? S.tone('compute') : S.tone('struct'),
      sw: isPrimary ? 2 : 1
    }, rg);

    const sLbl = S.text(`scheduler ${i + 1}`, {
      x: cx - w / 2 + 122, y: ry + 36, size: 22, anchor: 'middle', weight: 700,
      color: isPrimary ? 'compute' : 'struct'
    }, rg);

    // 16 Warps Queue for this scheduler
    const warpsG = S.g(null, rg);
    const wX0 = cx - w / 2 + 240;
    const wW = 42, wH = 56, wGap = 8;
    const warpBoxes = [];

    for (let w = 0; w < 16; w++) {
      const isReady = isPrimary && (w === 2 || w === 7 || w === 11);
      const bx = S.rect({
        x: wX0 + w * (wW + wGap), y: ry, w: wW, h: wH, r: 4,
        fill: isReady ? '#f59e0b' : '#1e293b',
        stroke: isReady ? '#ffffff' : '#334155', sw: isReady ? 1.5 : 1
      }, warpsG);
      bx.setAttribute('data-audit', 'ignore');

      const wNum = S.text(`w${w}`, {
        x: wX0 + w * (wW + wGap) + wW / 2, y: ry + 36, size: 20, anchor: 'middle',
        color: isReady ? '#0a0f1e' : 'muted', weight: isReady ? 700 : 500
      }, warpsG);
      wNum.setAttribute('data-audit', 'ignore');

      warpBoxes.push(bx);
    }

    // 32 Execution Lanes on Right
    const lBox = S.rect({
      x: cx + w / 2 - 290, y: ry, w: 258, h: 56, r: 8,
      fill: isPrimary ? '#2b1c0a' : '#1e293b',
      stroke: isPrimary ? S.tone('compute') : '#334155', sw: isPrimary ? 2 : 1
    }, rg);

    const lLbl = S.text(isPrimary ? '32 lanes (active)' : '32 lanes', {
      x: cx + w / 2 - 161, y: ry + 36, size: 22, anchor: 'middle', weight: 700,
      color: isPrimary ? 'compute' : 'muted'
    }, rg);

    // Connecting issue arrow for Scheduler 1
    let issueLine = null;
    if (isPrimary) {
      issueLine = S.line({
        x1: wX0 + 2 * (wW + wGap) + wW / 2, y1: ry + wH + 8,
        x2: cx + w / 2 - 161, y2: ry + wH + 8,
        stroke: S.tone('compute'), sw: 2.5, arrow: true
      }, rg);
      issueLine.setAttribute('data-audit', 'ignore');
    }

    rows.push({ group: rg, sBox, sLbl, warpsG, warpBoxes, lBox, lLbl, issueLine });
  }

  // Stall alert banner at bottom
  const stallBox = S.rect({
    x: cx - w / 2 + 32, y: cy + h / 2 - 80, w: w - 64, h: 60, r: 8,
    fill: '#38161e', stroke: S.tone('bytes'), sw: 1.5
  }, g);

  const stallText = S.text('hazard: if all 16 warps stall on hbm, that scheduler 32 execution lanes sit 100% idle', {
    x: cx, y: cy + h / 2 - 44, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);

  return { group: g, bg, title, rows, stallBox, stallText };
}

/**
 * Fig 35 & 36: Tensor Memory Accelerator (TMA)
 * Shows the autonomous copy engine between HBM and Shared Memory SRAM,
 * plus the tile descriptor that launches 64-row transfers with 1 instruction.
 */
function ch07TmaFlow(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 505;
  const w = opts.w ?? 1420;
  const h = opts.h ?? 540;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#0a0f1d', stroke: S.tone('helps'), sw: 1.5
  }, g);

  const title = S.text('figs 35, 36 · tensor memory accelerator: autonomous hardware copy engine', {
    x: cx - w / 2 + 32, y: cy - h / 2 + 38, size: 22, weight: 700, color: 'helps'
  }, g);

  // ================================================================ TOP: 3-Stage Data Flow (HBM -> TMA -> SRAM)
  const fY = cy - 135;
  const fH = 86;

  // HBM Box (Left)
  const hbmX = cx - 460;
  const hbmBox = S.rect({
    x: hbmX - 140, y: fY, w: 280, h: fH, r: 10,
    fill: '#38161e', stroke: S.tone('bytes'), sw: 2
  }, g);
  const hbmTitle = S.text('off-chip hbm3', { x: hbmX, y: fY + 32, size: 22, anchor: 'middle', weight: 700, color: 'bytes' }, g);
  const hbmSub = S.text('80 gb · 3,352 gb/s', { x: hbmX, y: fY + 58, size: 20, anchor: 'middle', color: 'muted' }, g);

  // Flow Arrow 1 -> TMA
  const a1 = S.line({
    x1: hbmX + 150, y1: fY + fH / 2, x2: cx - 200, y2: fY + fH / 2,
    stroke: S.tone('helps'), sw: 3, arrow: true
  }, g);
  a1.setAttribute('data-audit', 'ignore');

  // TMA Box (Center)
  const tmaBox = S.rect({
    x: cx - 180, y: fY, w: 360, h: fH, r: 10,
    fill: '#142e2b', stroke: S.tone('helps'), sw: 2.5
  }, g);
  const tmaTitle = S.text('tma hardware engine', { x: cx, y: fY + 32, size: 22, anchor: 'middle', weight: 700, color: 'helps' }, g);
  const tmaSub = S.text('autonomous tile copy', { x: cx, y: fY + 60, size: 20, anchor: 'middle', color: 'ink' }, g);

  // Shared Memory SRAM Box (Right)
  const sramX = cx + 460;

  // Flow Arrow 2 -> SRAM
  const a2 = S.line({
    x1: cx + 190, y1: fY + fH / 2, x2: sramX - 150, y2: fY + fH / 2,
    stroke: S.tone('helps'), sw: 3, arrow: true
  }, g);
  a2.setAttribute('data-audit', 'ignore');

  const sramBox = S.rect({
    x: sramX - 140, y: fY, w: 280, h: fH, r: 10,
    fill: '#064e3b', stroke: S.tone('helps'), sw: 2
  }, g);
  const sramTitle = S.text('on-chip shared sram', { x: sramX, y: fY + 32, size: 22, anchor: 'middle', weight: 700, color: 'helps' }, g);
  const sramSub = S.text('228 kb scratchpad', { x: sramX, y: fY + 58, size: 20, anchor: 'middle', color: 'ink' }, g);

  // ================================================================ MIDDLE: Tile Descriptor Card
  const descY = cy - 10;
  const descW = 1356, descH = 110;
  const descBox = S.rect({
    x: cx - descW / 2, y: descY, w: descW, h: descH, r: 10,
    fill: '#15243d', stroke: S.tone('struct'), sw: 1.5
  }, g);

  const descTitle = S.text('tile descriptor (passed once to tma): 1 thread issues 1 instruction', {
    x: cx - descW / 2 + 24, y: descY + 34, size: 22, weight: 700, color: 'struct'
  }, g);

  // Descriptor field pills
  const dPills = [
    { label: 'start address in hbm', tone: 'neutral', x: cx - 480 },
    { label: 'tile shape: 64 × 64', tone: 'compute', x: cx - 180 },
    { label: 'element size: 16-bit', tone: 'compute', x: cx + 110 },
    { label: 'matrix stride: 8,192 bytes', tone: 'helps', x: cx + 430 }
  ];
  const pillEls = [];
  dPills.forEach(p => {
    const pl = S.pill(p.label, { x: p.x, y: descY + 74, h: 40, tone: p.tone, size: 20, weight: 700 }, g);
    pillEls.push(pl);
  });

  // ================================================================ BOTTOM: Comparison Banner
  const compY = cy + 130;
  const compW = 1356, compH = 110;

  // Left: Legacy without TMA
  const legBox = S.rect({
    x: cx - compW / 2, y: compY, w: compW / 2 - 12, h: compH, r: 8,
    fill: '#38161e', stroke: S.tone('bytes'), sw: 1.5
  }, g);
  const legTitle = S.text('without tma (legacy a100)', {
    x: cx - compW / 4 - 6, y: compY + 34, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const legDesc = S.text('128 threads issue 512 copy instructions: math stalls!', {
    x: cx - compW / 4 - 6, y: compY + 70, size: 20, anchor: 'middle', color: 'ink'
  }, g);

  // Right: Hopper with TMA
  const hopBox = S.rect({
    x: cx + 12, y: compY, w: compW / 2 - 12, h: compH, r: 8,
    fill: '#142e2b', stroke: S.tone('helps'), sw: 1.5
  }, g);
  const hopTitle = S.text('with tma (hopper h100)', {
    x: cx + compW / 4 + 6, y: compY + 34, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const hopDesc = S.text('1 instruction: background streaming while math runs 100%', {
    x: cx + compW / 4 + 6, y: compY + 70, size: 20, anchor: 'middle', color: 'helps'
  }, g);

  return {
    group: g, bg, title,
    flow: [hbmBox, hbmTitle, hbmSub, a1, tmaBox, tmaTitle, tmaSub, a2, sramBox, sramTitle, sramSub],
    desc: [descBox, descTitle, ...pillEls],
    comp: [legBox, legTitle, legDesc, hopBox, hopTitle, hopDesc]
  };
}

/**
 * Fig 37: The Floor Plan: Four Identical Quarters
 * Shows 4 identical quarters, each with:
 * - 1 Warp Scheduler
 * - 32 FP32 CUDA Lanes
 * - 1 Tensor Core
 * - 16,384 Registers (64 KB slice)
 * Center: 256 KB Shared SRAM & TMA engine.
 */
function ch07SmFloorPlan(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 505;
  const w = opts.w ?? 1420;
  const h = opts.h ?? 540;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#0a0f1d', stroke: S.tone('struct'), sw: 2
  }, g);

  const title = S.text('fig 37 · one multiprocessor is four identical quarters', {
    x: cx - w / 2 + 32, y: cy - h / 2 + 38, size: 22, weight: 700, color: 'struct'
  }, g);

  // 4 Quarters side-by-side
  const qW = 320, qH = 340;
  const qGap = 16;
  const qX0 = cx - (4 * qW + 3 * qGap) / 2;
  const qY = cy - 70;

  const quarters = [];
  for (let i = 0; i < 4; i++) {
    const qx = qX0 + i * (qW + qGap);
    const qg = S.g(null, g);
    const isPrimary = (i === 0);

    const qBox = S.rect({
      x: qx, y: qY, w: qW, h: qH, r: 10,
      fill: isPrimary ? '#15243d' : '#111827',
      stroke: isPrimary ? S.tone('struct') : '#334155', sw: isPrimary ? 2 : 1
    }, qg);
    qBox.setAttribute('data-audit', 'ignore');

    const qHeader = S.text(`quarter ${i + 1}`, {
      x: qx + qW / 2, y: qY + 30, size: 22, anchor: 'middle', weight: 700,
      color: isPrimary ? 'struct' : 'ink'
    }, qg);

    // 1. Scheduler
    const sBox = S.rect({
      x: qx + 16, y: qY + 54, w: qW - 32, h: 48, r: 6,
      fill: '#1e293b', stroke: S.tone('helps'), sw: 1
    }, qg);
    sBox.setAttribute('data-audit', 'ignore');
    const sLbl = S.text('1 warp scheduler', {
      x: qx + qW / 2, y: qY + 84, size: 20, anchor: 'middle', color: 'helps', weight: 700
    }, qg);

    // 2. Registers
    const rBox = S.rect({
      x: qx + 16, y: qY + 114, w: qW - 32, h: 48, r: 6,
      fill: '#1e293b', stroke: S.tone('struct'), sw: 1
    }, qg);
    rBox.setAttribute('data-audit', 'ignore');
    const rLbl = S.text('16,384 registers (64 kb)', {
      x: qx + qW / 2, y: qY + 144, size: 20, anchor: 'middle', color: 'struct', weight: 600
    }, qg);

    // 3. 32 CUDA Lanes
    const lBox = S.rect({
      x: qx + 16, y: qY + 174, w: qW - 32, h: 56, r: 6,
      fill: '#2b1c0a', stroke: S.tone('compute'), sw: 1
    }, qg);
    lBox.setAttribute('data-audit', 'ignore');
    const lLbl = S.text('32 fp32 cuda lanes', {
      x: qx + qW / 2, y: qY + 208, size: 20, anchor: 'middle', color: 'compute', weight: 700
    }, qg);

    // 4. 1 Tensor Core
    const tBox = S.rect({
      x: qx + 16, y: qY + 242, w: qW - 32, h: 76, r: 6,
      fill: '#2b1c0a', stroke: S.tone('compute'), sw: 1.5
    }, qg);
    tBox.setAttribute('data-audit', 'ignore');
    const tLbl = S.text('1 tensor core (512 fmas)', {
      x: qx + qW / 2, y: qY + 286, size: 20, anchor: 'middle', color: 'compute', weight: 700
    }, qg);

    quarters.push({ group: qg, qBox, qHeader, sBox, sLbl, rBox, rLbl, lBox, lLbl, tBox, tLbl });
  }

  // Central Shared SRAM & TMA Engine at Bottom
  const botY = qY + qH + 16;
  const botW = 4 * qW + 3 * qGap;
  const botH = 68;

  const botBox = S.rect({
    x: qX0, y: botY, w: botW, h: botH, r: 8,
    fill: '#142e2b', stroke: S.tone('helps'), sw: 2
  }, g);
  botBox.setAttribute('data-audit', 'ignore');

  const botText = S.text('central 256 kb shared memory & tma copy engine (shared across all 4 quarters)', {
    x: cx, y: botY + 40, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  return { group: g, bg, title, quarters, botBox, botText };
}
