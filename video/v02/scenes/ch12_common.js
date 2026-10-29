/* ch12_common.js · Visual components for Chapter 12 ("The memory ladder")
   Figs 57, 58, 59, 60, 61, 62 from atlas:
   - ch12LadderRows: The 4 rungs of storage nested by capacity and access scope (Figs 58, 59)
   - ch12ModelScale: 121.6 MB fast on-chip memory vs 140 GB model drawn to scale (Fig 60)
   - ch12DualMetrics: Latency (479× growth) vs Bandwidth (120× drop) dual charts (Figs 61, 62)
*/

/**
 * Creates the 4-rung memory ladder with capacities, chip totals, and scopes (Atlas Figs 58, 59)
 */
function ch12LadderRows(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('the four rungs of the gpu memory hierarchy · 2,500× capacity span', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const rungs = [
    {
      name: '1 · registers',
      capSM: '256 kb / sm',
      capChip: '34.6 mb chip total',
      scope: 'scope: 1 private thread',
      tone: 'struct'
    },
    {
      name: '2 · l1 & shared memory',
      capSM: '256 kb / sm',
      capChip: '34.6 mb chip total',
      scope: 'scope: 1 thread block',
      tone: 'helps'
    },
    {
      name: '3 · l2 cache',
      capSM: 'shared die',
      capChip: '52.4 mb chip total',
      scope: 'scope: all 132 sms',
      tone: 'compute'
    },
    {
      name: '4 · hbm3 memory',
      capSM: 'off-die stacks',
      capChip: '80.0 gb package total',
      scope: 'scope: entire system & cluster',
      tone: 'bytes'
    }
  ];

  const rowX0 = cx - 620;
  const rowW = 1240;
  const rowH = 76;
  const startY = cy - 165;
  const rows = [];

  rungs.forEach((r, idx) => {
    const ry = startY + idx * 88;
    const rc = S.rect({
      x: rowX0, y: ry, w: rowW, h: rowH, r: 8,
      fill: '#151c2e', stroke: S.tone(r.tone), sw: 1.5
    }, g);

    const rName = S.text(r.name, {
      x: rowX0 + 30, y: ry + 46, size: 22, weight: 700, color: r.tone
    }, g);

    const rCapSM = S.text(r.capSM, {
      x: rowX0 + 350, y: ry + 46, size: 20, weight: 600, color: 'ink'
    }, g);

    const rCapChip = S.text(r.capChip, {
      x: rowX0 + 600, y: ry + 46, size: 20, weight: 700, color: 'ink'
    }, g);

    const rScope = S.text(r.scope, {
      x: rowX0 + rowW - 30, y: ry + 46, size: 20, anchor: 'end', weight: 600, color: 'muted'
    }, g);

    rows.push({ rc, rName, rCapSM, rCapChip, rScope });
  });

  const footer = S.pill('to exchange data, threads must meet at a level they both see', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'struct', size: 20, weight: 700, style: 'solid'
  }, g);

  return { group: g, bg, title, rows, footer };
}

/**
 * Creates the scale comparison: 121.6 MB on-chip vs 140 GB model (Atlas Fig 60)
 */
function ch12ModelScale(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('on-chip fast storage vs 70-billion parameter model (drawn to scale)', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Big container for 140 GB Model
  const modelBox = S.rect({
    x: cx - 600, y: cy - 165, w: 780, h: 300, r: 8,
    fill: '#24141a', stroke: S.tone('bytes'), sw: 2
  }, g);

  const modelLbl1 = S.text('llama 3 70b weights: 140 gigabytes (100%)', {
    x: cx - 210, y: cy - 120, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);

  const modelLbl2 = S.text('70 billion parameters @ 16-bit (fp16 / bf16)', {
    x: cx - 210, y: cy - 85, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  // Tiny on-chip square in corner (121.6 MB is 0.087% = 1/1,151th of area)
  const chipTiny = S.rect({
    x: cx - 575, y: cy + 70, w: 46, h: 46, r: 4,
    fill: S.tone('helps'), stroke: '#fff', sw: 1.5
  }, g);

  const chipTinyLbl = S.text('fast on-chip: 121.6 mb (0.087% of model)', {
    x: cx - 510, y: cy + 100, size: 20, weight: 700, color: 'helps'
  }, g);

  // Right Breakdown Card
  const rightX = cx + 220;
  const rightW = 380;
  const rightCard = S.rect({
    x: rightX, y: cy - 165, w: rightW, h: 300, r: 8,
    fill: '#151c2e', stroke: '#293a5a', sw: 1.5
  }, g);

  const breakdown = [
    { name: 'registers (132 sms):', val: '34.6 mb', col: 'struct' },
    { name: 'l1 & shared (132 sms):', val: '34.6 mb', col: 'helps' },
    { name: 'l2 cache (chip-wide):', val: '52.4 mb', col: 'compute' },
    { name: 'total fast sram:', val: '121.6 mb', col: 'helps' }
  ];

  const bLines = [];
  breakdown.forEach((b, idx) => {
    const by = cy - 125 + idx * 58;
    const nl = S.text(b.name, { x: rightX + 20, y: by + 26, size: 20, weight: 600, color: 'ink' }, g);
    const vl = S.text(b.val, { x: rightX + rightW - 20, y: by + 26, size: 20, anchor: 'end', weight: 700, color: b.col }, g);
    bLines.push({ nl, vl });
  });

  const takeawayPill = S.pill('l2 holds 1 part in 2,600 · every token must stream 140 gb from hbm', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'bytes', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g, bg, title, modelBox, modelLbl1, modelLbl2,
    chipTiny, chipTinyLbl, rightCard, bLines, takeawayPill
  };
}

/**
 * Creates the dual Latency vs Bandwidth comparison charts (Atlas Figs 61, 62)
 */
function ch12DualMetrics(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('latency climbs 479× while bandwidth drops 120× on the ladder', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Left column: Latency (ticks)
  const leftX = cx - 620;
  const colW = 590;
  const leftCard = S.rect({
    x: leftX, y: cy - 165, w: colW, h: 310, r: 10,
    fill: '#1a121d', stroke: S.tone('bytes'), sw: 1.5
  }, g);
  const leftTitle = S.text('latency in clock ticks (479× growth)', {
    x: leftX + colW / 2, y: cy - 130, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);

  const latRows = [
    { name: 'registers:', ticks: '1 tick', wPct: 0.08, col: 'helps' },
    { name: 'shared memory:', ticks: '29 ticks', wPct: 0.20, col: 'helps' },
    { name: 'l2 cache:', ticks: '263 ticks', wPct: 0.60, col: 'compute' },
    { name: 'hbm3 memory:', ticks: '479 ticks (479×)', wPct: 1.00, col: 'bytes' }
  ];

  const lElements = [];
  latRows.forEach((r, idx) => {
    const ry = cy - 90 + idx * 56;
    const barW = Math.round(r.wPct * 160);

    const lbl = S.text(r.name, { x: leftX + 24, y: ry + 24, size: 20, weight: 600, color: 'ink' }, g);

    const bar = S.rect({
      x: leftX + 205, y: ry, w: barW, h: 32, r: 4,
      fill: S.tone(r.col), stroke: S.tone(r.col), sw: 1
    }, g);

    const val = S.text(r.ticks, { x: leftX + 205 + barW + 12, y: ry + 24, size: 20, weight: 700, color: r.col }, g);
    bar.setAttribute('data-audit', 'ignore');
    lElements.push({ lbl, bar, val });
  });

  // Right column: Bandwidth per SM per tick
  const rightX = cx + 30;
  const rightCard = S.rect({
    x: rightX, y: cy - 165, w: colW, h: 310, r: 10,
    fill: '#121e1a', stroke: S.tone('helps'), sw: 1.5
  }, g);
  const rightTitle = S.text('bandwidth per sm per tick (120× drop)', {
    x: rightX + colW / 2, y: cy - 130, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  const bwRows = [
    { name: 'registers:', bw: '1,536 b (120×)', wPct: 1.00, col: 'helps' },
    { name: 'shared memory:', bw: '128 b', wPct: 0.35, col: 'helps' },
    { name: 'l2 cache:', bw: '39 b', wPct: 0.18, col: 'compute' },
    { name: 'hbm3 memory:', bw: '12.8 b', wPct: 0.08, col: 'bytes' }
  ];

  const rElements = [];
  bwRows.forEach((r, idx) => {
    const ry = cy - 90 + idx * 56;
    const barW = Math.round(r.wPct * 160);

    const lbl = S.text(r.name, { x: rightX + 24, y: ry + 24, size: 20, weight: 600, color: 'ink' }, g);

    const bar = S.rect({
      x: rightX + 205, y: ry, w: barW, h: 32, r: 4,
      fill: S.tone(r.col), stroke: S.tone(r.col), sw: 1
    }, g);

    const val = S.text(r.bw, { x: rightX + 205 + barW + 12, y: ry + 24, size: 20, weight: 700, color: r.col }, g);
    bar.setAttribute('data-audit', 'ignore');
    rElements.push({ lbl, bar, val });
  });

  const takeawayPill = S.pill('latency grows 500× and bandwidth drops 120×: stage data upward', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g, bg, title, leftCard, leftTitle, lElements,
    rightCard, rightTitle, rElements, takeawayPill
  };
}
