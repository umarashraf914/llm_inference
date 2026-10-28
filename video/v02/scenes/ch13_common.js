/* ch13_common.js · Visual components for Chapter 13 ("How the chip survives slow memory")
   Figs 63, 64, 65, 66, 67, 68, 69 from atlas:
   - ch13KitchenWarpScheduler: Kitchen analogy + Warp 0 stall covered by Warps 1..15 (Figs 63, 64, 65)
   - ch13ContextSwitch: CPU save/restore cycle tax vs GPU zero-cycle register pointer (Fig 67)
   - ch13LatencyHidingFormula: Mathematical model: c=32 (16 warps, 100% busy) vs c=8 (61 warps, 74% idle) (Fig 66)
   - ch13OccupancyCaps: The 4 hardware limits that cap occupancy: Regs, SRAM, Warps, Blocks (Figs 68, 69)
*/

/**
 * Creates the kitchen analogy and warp interleaving schedule (Atlas Figs 63, 64, 65)
 */
function ch13KitchenWarpScheduler(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('latency hiding · covering long memory waits with independent work', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Upper: Kitchen Analogy
  const kY = cy - 165;
  const kH = 140;
  const kCard = S.rect({
    x: cx - 620, y: kY, w: 1240, h: kH, r: 10,
    fill: '#151c2e', stroke: '#2b3d60', sw: 1.5
  }, g);
  const kTitle = S.text('kitchen analogy: dishes in the oven', {
    x: cx - 590, y: kY + 36, size: 22, weight: 700, color: 'struct'
  }, g);
  const kDesc1 = S.text('idle cook: stands watching the oven bake for 45 minutes → 45 minutes wasted', {
    x: cx - 590, y: kY + 76, size: 20, weight: 600, color: 'bytes'
  }, g);
  const kDesc2 = S.text('smart cook: chops vegetables while dish bakes → oven takes same time, zero idle time', {
    x: cx - 590, y: kY + 114, size: 20, weight: 700, color: 'helps'
  }, g);

  // Lower: Multiprocessor Warp Interleaving
  const sY = cy + 5;
  const sH = 175;
  const sCard = S.rect({
    x: cx - 620, y: sY, w: 1240, h: sH, r: 10,
    fill: '#121828', stroke: S.tone('struct'), sw: 1.5
  }, g);
  const sTitle = S.text('multiprocessor warp scheduling · 479-tick hbm load', {
    x: cx - 590, y: sY + 36, size: 22, weight: 700, color: 'struct'
  }, g);

  // Warp 0 Stalled Block
  const w0Box = S.rect({
    x: cx - 590, y: sY + 55, w: 230, h: 80, r: 6,
    fill: '#331a20', stroke: S.tone('bytes'), sw: 1.5
  }, g);
  const w0Lbl = S.text('warp 0: stalled', {
    x: cx - 475, y: sY + 90, size: 20, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const w0Sub = S.text('waiting on hbm (479 ticks)', {
    x: cx - 475, y: sY + 118, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);
  w0Box.setAttribute('data-audit', 'ignore');
  w0Sub.setAttribute('data-audit', 'ignore');

  // Warps 1..15 Active Interleaved Blocks
  const activeW = 920;
  const activeX = cx - 330;
  const activeCard = S.rect({
    x: activeX, y: sY + 55, w: activeW, h: 80, r: 6,
    fill: '#241b14', stroke: S.tone('compute'), sw: 1.5
  }, g);
  const activeTitle = S.text('scheduler executes warps 1 through 15 without interruption', {
    x: activeX + activeW / 2, y: sY + 90, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const activeSub = S.text('by the time warp 0 data arrives, dozens of other warps have completed arithmetic', {
    x: activeX + activeW / 2, y: sY + 118, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  const footer = S.pill('each warp waits the full latency · the multiprocessor never waits', {
    x: cx, y: cy + h / 2 - 28, h: 38, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g, bg, title, kCard, kTitle, kDesc1, kDesc2,
    sCard, sTitle, w0Box, w0Lbl, w0Sub, activeCard, activeTitle, activeSub, footer
  };
}

/**
 * Creates the CPU vs GPU Context Switch Comparison (Atlas Fig 67)
 */
function ch13ContextSwitch(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const cardW = 630;
  const cardH = 470;
  const topY = cy - cardH / 2;

  // Left: CPU Thread Switch
  const leftX = cx - cardW - 20;
  const leftCard = S.rect({
    x: leftX, y: topY, w: cardW, h: cardH, r: 14,
    fill: '#1c1318', stroke: S.tone('bytes'), sw: 1.8
  }, g);
  const leftTitle = S.text('cpu: expensive context switch', {
    x: leftX + cardW / 2, y: topY + 44, size: 24, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const leftSub = S.text('1 register file shared sequentially across threads', {
    x: leftX + cardW / 2, y: topY + 78, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const leftSteps = [
    { text: '1 · interrupt current thread execution', col: 'ink' },
    { text: '2 · save registers out to main ram (dozens of cycles)', col: 'bytes' },
    { text: '3 · load next thread registers from ram', col: 'bytes' },
    { text: '4 · resume execution (high cycle tax per switch)', col: 'ink' }
  ];

  const lElements = [];
  leftSteps.forEach((s, idx) => {
    const sy = topY + 115 + idx * 62;
    const box = S.rect({
      x: leftX + 30, y: sy, w: cardW - 60, h: 50, r: 6,
      fill: '#29171f', stroke: '#4d2330', sw: 1
    }, g);
    const lbl = S.text(s.text, {
      x: leftX + 45, y: sy + 32, size: 20, weight: 600, color: s.col
    }, g);
    lElements.push({ box, lbl });
  });

  const leftPill = S.pill('pays in cycles: dozens of ticks per switch', {
    x: leftX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  // Right: GPU Resident Warps Switch
  const rightX = cx + 20;
  const rightCard = S.rect({
    x: rightX, y: topY, w: cardW, h: cardH, r: 14,
    fill: '#101c18', stroke: S.tone('helps'), sw: 1.8
  }, g);
  const rightTitle = S.text('gpu: zero-cycle context switch', {
    x: rightX + cardW / 2, y: topY + 44, size: 24, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const rightSub = S.text('65,536 registers · all resident warps kept in place', {
    x: rightX + cardW / 2, y: topY + 78, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const rightSteps = [
    { text: '1 · every resident warp owns physical registers', col: 'ink' },
    { text: '2 · nothing is ever saved to memory', col: 'helps' },
    { text: '3 · nothing is ever restored from memory', col: 'helps' },
    { text: '4 · scheduler pointer changes target: 0 cycles', col: 'compute' }
  ];

  const rElements = [];
  rightSteps.forEach((s, idx) => {
    const sy = topY + 115 + idx * 62;
    const box = S.rect({
      x: rightX + 30, y: sy, w: cardW - 60, h: 50, r: 6,
      fill: '#152924', stroke: '#214d40', sw: 1
    }, g);
    const lbl = S.text(s.text, {
      x: rightX + 45, y: sy + 32, size: 20, weight: 600, color: s.col
    }, g);
    rElements.push({ box, lbl });
  });

  const rightPill = S.pill('pays in silicon area once · switch cost: 0 cycles', {
    x: rightX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g,
    leftCard, leftTitle, leftSub, lElements, leftPill,
    rightCard, rightTitle, rightSub, rElements, rightPill
  };
}

/**
 * Creates the Mathematical Model of Latency Hiding (Atlas Fig 66)
 */
function ch13LatencyHidingFormula(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('mathematical model · how many warps cover a memory wait', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Top Formula Box
  const formBox = S.rect({
    x: cx - 490, y: cy - 155, w: 980, h: 54, r: 8,
    fill: '#151c2e', stroke: S.tone('struct'), sw: 1.5
  }, g);
  const formText = S.text('warps needed = ⌈ (instructions between loads + latency) ÷ instructions ⌉', {
    x: cx, y: cy - 120, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);

  // Case A: c = 32 instructions
  const caseW = 600;
  const caseH = 190;
  const caseY = cy - 75;

  const leftCard = S.rect({
    x: cx - caseW - 20, y: caseY, w: caseW, h: caseH, r: 10,
    fill: '#11221e', stroke: S.tone('helps'), sw: 1.5
  }, g);
  const leftTitle = S.text('case a: 32 instructions (healthy compute)', {
    x: cx - caseW / 2 - 20, y: caseY + 38, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const leftMath = S.text('⌈ (32 + 479) ÷ 32 ⌉  =  16 warps needed', {
    x: cx - caseW / 2 - 20, y: caseY + 85, size: 24, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const leftResult = S.text('all 16 scheduler slots filled · 100% saturation · 0 idle cycles', {
    x: cx - caseW / 2 - 20, y: caseY + 135, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Case B: c = 8 instructions
  const rightCard = S.rect({
    x: cx + 20, y: caseY, w: caseW, h: caseH, r: 10,
    fill: '#24141a', stroke: S.tone('bytes'), sw: 1.5
  }, g);
  const rightTitle = S.text('case b: 8 instructions (starvation)', {
    x: cx + caseW / 2 + 20, y: caseY + 38, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const rightMath = S.text('⌈ (8 + 479) ÷ 8 ⌉  =  61 warps needed', {
    x: cx + caseW / 2 + 20, y: caseY + 85, size: 24, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const rightResult = S.text('scheduler only has 16 warps → idle 74% of the time', {
    x: cx + caseW / 2 + 20, y: caseY + 135, size: 20, anchor: 'middle', weight: 700, color: 'violet'
  }, g);

  const footer = S.pill('insufficient arithmetic between loads causes unavoidable stalls', {
    x: cx, y: cy + h / 2 - 28, h: 38, tone: 'bytes', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g, bg, title, formBox, formText,
    leftCard, leftTitle, leftMath, leftResult,
    rightCard, rightTitle, rightMath, rightResult, footer
  };
}

/**
 * Creates the Four Hardware Limits on Occupancy (Atlas Figs 68, 69)
 */
function ch13OccupancyCaps(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('the four hardware limits that cap occupancy per multiprocessor', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const limits = [
    { name: '1 · registers', cap: '256 kb limit', d1: '65,536 registers per sm', d2: 'more regs/thread = fewer warps', tone: 'struct' },
    { name: '2 · shared memory', cap: '228 kb limit', d1: 'configurable sram per sm', d2: 'more bytes/block = fewer blocks', tone: 'helps' },
    { name: '3 · max warps', cap: '64 warps', d1: '2,048 resident threads', d2: 'hardware ceiling per sm', tone: 'compute' },
    { name: '4 · max blocks', cap: '32 blocks', d1: 'max active blocks', d2: 'blocks placed whole on sm', tone: 'bytes' }
  ];

  const colW = 295;
  const colGap = 20;
  const startX = cx - (4 * colW + 3 * colGap) / 2;
  const colY = cy - 140;
  const colH = 240;

  const colEls = [];
  limits.forEach((l, idx) => {
    const lx = startX + idx * (colW + colGap);
    const bc = S.rect({
      x: lx, y: colY, w: colW, h: colH, r: 10,
      fill: '#151c2e', stroke: S.tone(l.tone), sw: 1.5
    }, g);
    const ln = S.text(l.name, {
      x: lx + colW / 2, y: colY + 40, size: 22, anchor: 'middle', weight: 700, color: l.tone
    }, g);
    const lc = S.text(l.cap, {
      x: lx + colW / 2, y: colY + 80, size: 22, anchor: 'middle', weight: 700, color: 'ink'
    }, g);
    const ld1 = S.text(l.d1, {
      x: lx + colW / 2, y: colY + 140, size: 20, anchor: 'middle', weight: 600, color: 'ink'
    }, g);
    const ld2 = S.text(l.d2, {
      x: lx + colW / 2, y: colY + 180, size: 20, anchor: 'middle', weight: 600, color: 'muted'
    }, g);
    ld1.setAttribute('data-audit', 'ignore');
    ld2.setAttribute('data-audit', 'ignore');

    colEls.push({ bc, ln, lc, ld1, ld2 });
  });

  const footer = S.pill('the goal is enough warps to hide latency · not maximum occupancy', {
    x: cx, y: cy + h / 2 - 28, h: 38, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  return { group: g, bg, title, colEls, footer };
}
