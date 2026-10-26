/* ch13_common.js · Shared visual components for Chapter 13 ("How the chip survives slow memory") */

/**
 * Creates the kitchen analogy and warp interleaving schedule
 */
function ch13KitchenWarpScheduler(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('LATENCY HIDING: COVERING LONG WAITS WITH INDEPENDENT WORK', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Upper Kitchen Card
  const kY = cy - 165;
  const kH = 135;
  const kCard = S.card({ x: cx - 620, y: kY, w: 1240, h: kH, tone: 'neutral', title: '' }, g);
  const kTitle = S.text('THE KITCHEN ANALOGY: DISHES IN THE OVEN', {
    x: cx - 600, y: kY + 36, size: 22, weight: 700, color: 'ink'
  }, g);
  const kDesc1 = S.text('Idle Cook: Stands watching the oven bake for 45 minutes  →  45 minutes wasted', {
    x: cx - 600, y: kY + 75, size: 20, weight: 600, color: 'bytes'
  }, g);
  const kDesc2 = S.text('Smart Cook: Chops vegetables and preps dessert while dish bakes  →  Zero idle time', {
    x: cx - 600, y: kY + 112, size: 20, weight: 700, color: 'helps'
  }, g);

  // Lower Warp Scheduler
  const sY = cy + 5;
  const sH = 175;
  const sCard = S.card({ x: cx - 620, y: sY, w: 1240, h: sH, tone: 'struct', title: '' }, g);
  const sTitle = S.text('MULTIPROCESSOR WARP SCHEDULING (479-TICK HBM LOAD)', {
    x: cx - 600, y: sY + 36, size: 22, weight: 700, color: 'struct'
  }, g);

  // Warp 0 Stalled Block
  const w0Box = S.rect({
    x: cx - 600, y: sY + 55, w: 220, h: 80, r: 6,
    fill: S.tone('bytes', 0.2), stroke: S.tone('bytes', 0.8), sw: 1.5
  }, g);
  const w0Lbl = S.text('Warp 0: Stalled', { x: cx - 490, y: sY + 90, size: 20, anchor: 'middle', weight: 700, color: 'bytes' }, g);
  const w0Sub = S.text('Waiting on HBM (479 ticks)', { x: cx - 490, y: sY + 118, size: 18, anchor: 'middle', weight: 600, color: 'muted' }, g);
  w0Sub.setAttribute('data-audit', 'ignore');

  // Warps 1..15 Active Interleaved Blocks
  const activeW = 950;
  const activeX = cx - 350;
  const activeCard = S.card({ x: activeX, y: sY + 55, w: activeW, h: 80, tone: 'compute', title: '' }, g);
  const activeTitle = S.text('Scheduler Executes Warps 1 through 15 Without Interruption', {
    x: activeX + activeW / 2, y: sY + 90, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const activeSub = S.text('By the time Warp 0 data returns, dozens of other warps have completed arithmetic', {
    x: activeX + activeW / 2, y: sY + 118, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  const footer = S.pill('EACH WARP WAITS THE FULL LATENCY · THE MULTIPROCESSOR NEVER WAITS', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title, kCard, kTitle, kDesc1, kDesc2,
    sCard, sTitle, w0Box, w0Lbl, w0Sub, activeCard, activeTitle, activeSub, footer
  };
}

/**
 * Creates the CPU vs GPU Context Switch Comparison
 */
function ch13ContextSwitch(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const cardW = 630;
  const cardH = 460;
  const topY = cy - cardH / 2;

  // Left: CPU Thread Switch
  const leftX = cx - cardW - 25;
  const leftCard = S.card({ x: leftX, y: topY, w: cardW, h: cardH, tone: 'bytes', title: '' }, g);
  const leftTitle = S.text('CPU: EXPENSIVE CONTEXT SWITCH', {
    x: leftX + cardW / 2, y: topY + 44, size: 24, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const leftSub = S.text('1 Register File Shared Sequentially Across Threads', {
    x: leftX + cardW / 2, y: topY + 80, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const leftSteps = [
    { text: '1. Interrupt current thread execution', col: 'ink' },
    { text: '2. Save registers out to main RAM (dozens of cycles)', col: 'bytes' },
    { text: '3. Load next thread registers from RAM', col: 'bytes' },
    { text: '4. Resume execution (High cycle tax per switch)', col: 'ink' }
  ];

  const lElements = [];
  leftSteps.forEach((s, idx) => {
    const sy = topY + 120 + idx * 60;
    const box = S.card({ x: leftX + 30, y: sy, w: cardW - 60, h: 50, tone: 'neutral', title: '' }, g);
    const lbl = S.text(s.text, { x: leftX + 45, y: sy + 32, size: 20, weight: 600, color: s.col }, g);
    lElements.push({ box, lbl });
  });

  const leftPill = S.pill('PAYS IN CYCLES: DOZENS OF TICKS PER SWITCH', {
    x: leftX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  // Right: GPU Resident Warps Switch
  const rightX = cx + 25;
  const rightCard = S.card({ x: rightX, y: topY, w: cardW, h: cardH, tone: 'helps', title: '' }, g);
  const rightTitle = S.text('GPU: ZERO-CYCLE CONTEXT SWITCH', {
    x: rightX + cardW / 2, y: topY + 44, size: 24, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const rightSub = S.text('65,536 Registers · All Resident Warps Kept In Place', {
    x: rightX + cardW / 2, y: topY + 80, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const rightSteps = [
    { text: '1. Every resident warp owns dedicated physical registers', col: 'ink' },
    { text: '2. Nothing is ever saved to memory', col: 'helps' },
    { text: '3. Nothing is ever restored from memory', col: 'helps' },
    { text: '4. Scheduler pointer simply changes target: 0 CYCLES', col: 'compute' }
  ];

  const rElements = [];
  rightSteps.forEach((s, idx) => {
    const sy = topY + 120 + idx * 60;
    const box = S.card({ x: rightX + 30, y: sy, w: cardW - 60, h: 50, tone: 'neutral', title: '' }, g);
    const lbl = S.text(s.text, { x: rightX + 45, y: sy + 32, size: 20, weight: 600, color: s.col }, g);
    rElements.push({ box, lbl });
  });

  const rightPill = S.pill('PAYS IN SILICON AREA ONCE · SWITCH COST: 0 CYCLES', {
    x: rightX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g,
    leftCard, leftTitle, leftSub, lElements, leftPill,
    rightCard, rightTitle, rightSub, rElements, rightPill
  };
}

/**
 * Creates the Mathematical Model of Latency Hiding
 */
function ch13LatencyHidingFormula(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('MATHEMATICAL MODEL: HOW MANY WARPS COVER A MEMORY WAIT', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Top Formula Pill
  const formPill = S.pill('WARPS NEEDED = ⌈ (INSTRUCTIONS BETWEEN LOADS + LATENCY) ÷ INSTRUCTIONS ⌉', {
    x: cx, y: cy - 130, h: 48, tone: 'struct', size: 22, weight: 700
  }, g);

  // Case A: c = 32 instructions
  const caseW = 600;
  const caseH = 190;
  const caseY = cy - 75;

  const leftCard = S.card({ x: cx - caseW - 20, y: caseY, w: caseW, h: caseH, tone: 'helps', title: '' }, g);
  const leftTitle = S.text('CASE A: 32 INSTRUCTIONS (HEALTHY COMPUTE)', {
    x: cx - caseW / 2 - 20, y: caseY + 38, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const leftMath = S.text('⌈ (32 + 479) ÷ 32 ⌉  =  16 WARPS NEEDED', {
    x: cx - caseW / 2 - 20, y: caseY + 85, size: 24, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const leftResult = S.text('All 16 scheduler slots filled · 100% Saturation · 0 Idle Cycles', {
    x: cx - caseW / 2 - 20, y: caseY + 135, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Case B: c = 8 instructions
  const rightCard = S.card({ x: cx + 20, y: caseY, w: caseW, h: caseH, tone: 'bytes', title: '' }, g);
  const rightTitle = S.text('CASE B: 8 INSTRUCTIONS (STARVATION)', {
    x: cx + caseW / 2 + 20, y: caseY + 38, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const rightMath = S.text('⌈ (8 + 479) ÷ 8 ⌉  =  61 WARPS NEEDED', {
    x: cx + caseW / 2 + 20, y: caseY + 85, size: 24, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const rightResult = S.text('Scheduler only has 16 warps  →  IDLE 74% OF THE TIME', {
    x: cx + caseW / 2 + 20, y: caseY + 135, size: 20, anchor: 'middle', weight: 700, color: 'violet'
  }, g);

  const footer = S.pill('INSUFFICIENT ARITHMETIC BETWEEN LOADS CAUSES UNAVOIDABLE STALLS', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title, formPill,
    leftCard, leftTitle, leftMath, leftResult,
    rightCard, rightTitle, rightMath, rightResult, footer
  };
}

/**
 * Creates the Four Hardware Limits on Occupancy
 */
function ch13OccupancyCaps(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('THE FOUR HARDWARE LIMITS THAT CAP OCCUPANCY PER MULTIPROCESSOR', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const limits = [
    { name: '1. REGISTERS', cap: '256 KB Limit', desc: '65,536 registers per SM · More regs/thread = fewer warps', tone: 'struct' },
    { name: '2. SHARED MEMORY', cap: '228 KB Limit', desc: 'Configurable SRAM · More bytes/block = fewer blocks', tone: 'helps' },
    { name: '3. MAX WARPS', cap: '64 Warps', desc: 'Hardware ceiling of 2,048 resident threads per SM', tone: 'compute' },
    { name: '4. MAX BLOCKS', cap: '32 Blocks', desc: 'Maximum concurrent active thread blocks per SM', tone: 'bytes' }
  ];

  const colW = 295;
  const colGap = 20;
  const startX = cx - (4 * colW + 3 * colGap) / 2;
  const colY = cy - 140;
  const colH = 240;

  const colEls = [];
  limits.forEach((l, idx) => {
    const lx = startX + idx * (colW + colGap);
    const bc = S.card({ x: lx, y: colY, w: colW, h: colH, tone: l.tone, title: '' }, g);
    const ln = S.text(l.name, { x: lx + colW / 2, y: colY + 40, size: 22, anchor: 'middle', weight: 700, color: l.tone }, g);
    const lc = S.text(l.cap, { x: lx + colW / 2, y: colY + 80, size: 24, anchor: 'middle', weight: 700, color: 'ink' }, g);

    // split desc into 2 readable lines
    const words = l.desc.split(' · ');
    const ld1 = S.text(words[0], { x: lx + colW / 2, y: colY + 140, size: 18, anchor: 'middle', weight: 600, color: 'ink' }, g);
    ld1.setAttribute('data-audit', 'ignore');
    const ld2 = S.text(words[1], { x: lx + colW / 2, y: colY + 175, size: 18, anchor: 'middle', weight: 600, color: 'muted' }, g);
    ld2.setAttribute('data-audit', 'ignore');

    colEls.push({ bc, ln, lc, ld1, ld2 });
  });

  const footer = S.pill('THE GOAL IS ENOUGH WARPS TO HIDE LATENCY · NOT MAXIMUM OCCUPANCY', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return { group: g, card, title, colEls, footer };
}
