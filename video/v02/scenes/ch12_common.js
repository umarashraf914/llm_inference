/* ch12_common.js · Shared visual components for Chapter 12 ("The memory ladder") */

/**
 * Creates the 4-rung memory ladder with capacities, chip totals, and scopes
 */
function ch12LadderRows(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('THE FOUR RUNGS OF THE GPU MEMORY HIERARCHY', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const rungs = [
    {
      name: '1. REGISTERS',
      capSM: '256 KB / SM',
      capChip: '34.6 MB Chip Total',
      scope: 'Scope: 1 Private Thread',
      tone: 'struct'
    },
    {
      name: '2. L1 & SHARED MEMORY',
      capSM: '256 KB / SM',
      capChip: '34.6 MB Chip Total',
      scope: 'Scope: 1 Thread Block',
      tone: 'helps'
    },
    {
      name: '3. L2 CACHE',
      capSM: 'Shared Die',
      capChip: '52.4 MB Chip Total',
      scope: 'Scope: All 132 SMs',
      tone: 'compute'
    },
    {
      name: '4. HBM3 MEMORY',
      capSM: 'Off-Die Stacks',
      capChip: '80.0 GB Package Total',
      scope: 'Scope: Entire System & Other Chips',
      tone: 'bytes'
    }
  ];

  const rowX0 = cx - 620;
  const rowW = 1240;
  const rowH = 78;
  const startY = cy - 165;
  const rows = [];

  rungs.forEach((r, idx) => {
    const ry = startY + idx * 88;
    const rc = S.card({ x: rowX0, y: ry, w: rowW, h: rowH, tone: r.tone, title: '' }, g);

    const rName = S.text(r.name, {
      x: rowX0 + 30, y: ry + 46, size: 22, weight: 700, color: r.tone
    }, g);

    const rCapSM = S.text(r.capSM, {
      x: rowX0 + 360, y: ry + 46, size: 20, weight: 600, color: 'ink'
    }, g);

    const rCapChip = S.text(r.capChip, {
      x: rowX0 + 640, y: ry + 46, size: 20, weight: 700, color: 'ink'
    }, g);

    const rScope = S.text(r.scope, {
      x: rowX0 + rowW - 30, y: ry + 46, size: 20, anchor: 'end', weight: 600, color: 'muted'
    }, g);

    rows.push({ rc, rName, rCapSM, rCapChip, rScope });
  });

  const footer = S.pill('TO EXCHANGE DATA, THREADS MUST MEET AT A LEVEL THEY BOTH SEE', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'struct', size: 20, weight: 700
  }, g);

  return { group: g, card, title, rows, footer };
}

/**
 * Creates the scale comparison: 121.6 MB on-chip vs 140 GB model
 */
function ch12ModelScale(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('ON-CHIP FAST MEMORY VS 70-BILLION PARAMETER MODEL (TO SCALE)', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Big container for 140 GB Model
  const modelBox = S.rect({
    x: cx - 580, y: cy - 160, w: 760, h: 300, r: 8,
    fill: S.tone('bytes', 0.15), stroke: S.tone('bytes', 0.8), sw: 2
  }, g);

  const modelLbl1 = S.text('LLAMA 3 70B WEIGHTS: 140 GIGABYTES (100%)', {
    x: cx - 200, y: cy - 120, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);

  const modelLbl2 = S.text('70 Billion Parameters @ 16-Bit (FP16 / BF16)', {
    x: cx - 200, y: cy - 85, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  // Tiny on-chip square in corner (121.6 MB is 0.087% = 1/1151th of area)
  const chipTiny = S.rect({
    x: cx - 560, y: cy + 80, w: 45, h: 45, r: 4,
    fill: S.tone('helps', 0.9), stroke: '#fff', sw: 1.5
  }, g);

  const chipTinyLbl = S.text('All Fast On-Chip Storage: 121.6 MB (0.087%)', {
    x: cx - 500, y: cy + 110, size: 20, weight: 700, color: 'helps'
  }, g);

  // Right Breakdown Card
  const rightX = cx + 220;
  const rightW = 360;
  const rightCard = S.card({
    x: rightX, y: cy - 160, w: rightW, h: 300,
    tone: 'neutral', title: ''
  }, g);

  const breakdown = [
    { name: 'Registers (132 SMs):', val: '34.6 MB', col: 'struct' },
    { name: 'L1 & Shared (132 SMs):', val: '34.6 MB', col: 'helps' },
    { name: 'L2 Cache (Chip-wide):', val: '52.4 MB', col: 'compute' },
    { name: 'Total Fast SRAM:', val: '121.6 MB', col: 'helps' }
  ];

  const bLines = [];
  breakdown.forEach((b, idx) => {
    const by = cy - 120 + idx * 56;
    const nl = S.text(b.name, { x: rightX + 20, y: by + 24, size: 20, weight: 600, color: 'ink' }, g);
    const vl = S.text(b.val, { x: rightX + rightW - 20, y: by + 24, size: 20, anchor: 'end', weight: 700, color: b.col }, g);
    bLines.push({ nl, vl });
  });

  const takeawayPill = S.pill('NOWHERE ON-CHIP TO KEEP WEIGHTS: EVERY TOKEN STREAMS 140 GB FROM HBM', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title, modelBox, modelLbl1, modelLbl2,
    chipTiny, chipTinyLbl, rightCard, bLines, takeawayPill
  };
}

/**
 * Creates the dual Latency vs Bandwidth comparison charts
 */
function ch12DualMetrics(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('LATENCY CLIMBS 479× WHILE BANDWIDTH DROPS 120×', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Left column: Latency (ticks)
  const leftX = cx - 620;
  const colW = 590;
  const leftCard = S.card({ x: leftX, y: cy - 165, w: colW, h: 320, tone: 'bytes', title: '' }, g);
  const leftTitle = S.text('LATENCY (CLOCK TICKS · LOWER IS BETTER)', {
    x: leftX + colW / 2, y: cy - 130, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);

  const latRows = [
    { name: 'Registers', ticks: '1 tick', pct: 0.05, col: 'helps' },
    { name: 'L1 / Shared', ticks: '29 – 41 ticks', pct: 0.15, col: 'helps' },
    { name: 'L2 Cache', ticks: '263 ticks', pct: 0.55, col: 'compute' },
    { name: 'HBM3 Memory', ticks: '479 ticks (479×)', pct: 1.00, col: 'bytes' }
  ];

  const lElements = [];
  latRows.forEach((r, idx) => {
    const ry = cy - 90 + idx * 56;
    const lbl = S.text(r.name, { x: leftX + 24, y: ry + 24, size: 20, weight: 700, color: 'ink' }, g);
    const val = S.text(r.ticks, { x: leftX + colW - 24, y: ry + 24, size: 20, anchor: 'end', weight: 700, color: r.col }, g);
    lElements.push({ lbl, val });
  });

  // Right column: Bandwidth per SM per tick
  const rightX = cx + 30;
  const rightCard = S.card({ x: rightX, y: cy - 165, w: colW, h: 320, tone: 'helps', title: '' }, g);
  const rightTitle = S.text('BANDWIDTH (BYTES / SM / TICK · HIGHER IS BETTER)', {
    x: rightX + colW / 2, y: cy - 130, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  const bwRows = [
    { name: 'Registers', bw: '1,536 Bytes / SM (120×)', col: 'helps' },
    { name: 'L1 / Shared', bw: '128 Bytes / SM', col: 'helps' },
    { name: 'L2 Cache', bw: '39 Bytes / SM', col: 'compute' },
    { name: 'HBM3 Memory', bw: '12.8 Bytes / SM', col: 'bytes' }
  ];

  const rElements = [];
  bwRows.forEach((r, idx) => {
    const ry = cy - 90 + idx * 56;
    const lbl = S.text(r.name, { x: rightX + 24, y: ry + 24, size: 20, weight: 700, color: 'ink' }, g);
    const val = S.text(r.bw, { x: rightX + colW - 24, y: ry + 24, size: 20, anchor: 'end', weight: 700, color: r.col }, g);
    rElements.push({ lbl, val });
  });

  const takeawayPill = S.pill('LATENCY GROWS 500× AND BANDWIDTH DROPS 120×: STAGE DATA UPWARD', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title, leftCard, leftTitle, lElements,
    rightCard, rightTitle, rElements, takeawayPill
  };
}
