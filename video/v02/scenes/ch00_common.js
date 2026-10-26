/* ch00_common.js · Shared visual components for Chapter 00 ("Cold open: a thousand trillion, waiting") */

/**
 * Creates the Die Counter & 99% Waiting Timeline Visual
 */
function ch00DieCounter(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('SPECIFICATION VS REALITY: A THOUSAND TRILLION OPERATIONS, WAITING', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Left: Silicon Die Card (29mm x 29mm, 814 mm²)
  const dieW = 480;
  const dieH = 240;
  const dieX = cx - w / 2 + 50;
  const dieY = cy - 135;

  const dieCard = S.card({ x: dieX, y: dieY, w: dieW, h: dieH, tone: 'compute', title: '' }, g);
  const dieTitle = S.text('H100 COMPUTE DIE: 814 mm²', {
    x: dieX + dieW / 2, y: dieY + 36, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const dieSub = S.text('29 mm × 29 mm · Postage Stamp Silicon Die', {
    x: dieX + dieW / 2, y: dieY + 70, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);
  dieSub.setAttribute('data-audit', 'ignore');

  const dieStat1 = S.text('989.4 TRILLION OPS / SECOND', {
    x: dieX + dieW / 2, y: dieY + 125, size: 24, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const dieStat2 = S.text('16,896 CUDA Cores · 528 Tensor Cores', {
    x: dieX + dieW / 2, y: dieY + 165, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  dieStat2.setAttribute('data-audit', 'ignore');

  const diePill = S.pill('MASSIVE PARALLEL ARITHMETIC ENGINE', {
    x: dieX + dieW / 2, y: dieY + dieH - 24, h: 36, tone: 'compute', size: 18, weight: 700
  }, g);
  diePill.setAttribute('data-audit', 'ignore');

  // Right: 30 ms Token Timeline Visual
  const timeW = 730;
  const timeH = 240;
  const timeX = cx + w / 2 - timeW - 50;
  const timeY = cy - 135;

  const timeCard = S.card({ x: timeX, y: timeY, w: timeW, h: timeH, tone: 'bytes', title: '' }, g);
  const timeTitle = S.text('ONE GENERATED TOKEN TIMELINE (≈ 30 MILLISECONDS)', {
    x: timeX + timeW / 2, y: timeY + 36, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);

  // Timeline bar graphic
  const barX = timeX + 35;
  const barY = timeY + 80;
  const barW = timeW - 70;
  const barH = 50;

  // Background full bar (waiting)
  const waitBar = S.rect({ x: barX, y: barY, w: barW, h: barH, r: 6, fill: S.tone('bytes', 0.25), stroke: S.tone('bytes', 0.8), sw: 1.5 }, g);
  // Tiny arithmetic sliver on left (under 1% -> visually ~15px wide)
  const calcBar = S.rect({ x: barX, y: barY, w: 20, h: barH, r: 6, fill: S.tone('compute', 0.9), stroke: S.tone('compute', 1.0), sw: 1.5 }, g);

  const calcLabel = S.text('CALCULATION: < 1% (≈ 0.1 ms)', {
    x: barX + 25, y: barY - 10, size: 18, weight: 700, color: 'compute'
  }, g);
  calcLabel.setAttribute('data-audit', 'ignore');

  const waitLabel = S.text('WAITING FOR DATA FROM MEMORY: > 99% (≈ 30 ms)', {
    x: barX + barW / 2 + 20, y: barY + 32, size: 20, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  waitLabel.setAttribute('data-audit', 'ignore');

  const timePill = S.pill('THE ENGINE SPENDS > 99% OF ITS TIME WAITING FOR BYTES', {
    x: timeX + timeW / 2, y: timeY + timeH - 24, h: 36, tone: 'bytes', size: 18, weight: 700
  }, g);
  timePill.setAttribute('data-audit', 'ignore');

  const footer = S.pill('THE VAST ENGINE OF ARITHMETIC SPENDS MORE THAN NINETY-NINE PERCENT OF ITS TIME WAITING', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title,
    dieCard, dieTitle, dieSub, dieStat1, dieStat2, diePill,
    timeCard, timeTitle, waitBar, calcBar, calcLabel, waitLabel, timePill,
    footer
  };
}

/**
 * Creates the 5,120-Wire Package Bottle Visual
 */
function ch00FiveThousandWires(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('THE FIVE-THOUSAND-WIRE BOTTLE: 3,352 GB/s SETS THE PACE', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const colW = 390;
  const colGap = 25;
  const startX = cx - (3 * colW + 2 * colGap) / 2;
  const colY = cy - 145;
  const colH = 250;

  const cols = [
    {
      title: 'ARITHMETIC DURATION',
      stat: '0.1 MILLISECOND',
      sub: 'Time to compute one token',
      desc: '140 billion operations run in ~0.1 ms on 989 TFLOP/s hardware',
      tone: 'compute'
    },
    {
      title: 'THE 5,120-WIRE BUS',
      stat: '3,352 GB/s BANDWIDTH',
      sub: '5 HBM3 Stacks × 1,024 Wires',
      desc: 'Microscopic silicon interposer bus setting the hardware pace',
      tone: 'helps'
    },
    {
      title: 'DATA MOVED PER TOKEN',
      stat: '140 GIGABYTES',
      sub: 'Weights read every single token',
      desc: 'The chip is not slow: it is physically starved for data',
      tone: 'bytes'
    }
  ];

  const colEls = [];
  cols.forEach((c, idx) => {
    const lx = startX + idx * (colW + colGap);
    const bc = S.card({ x: lx, y: colY, w: colW, h: colH, tone: c.tone, title: '' }, g);
    const ct = S.text(c.title, { x: lx + colW / 2, y: colY + 36, size: 20, anchor: 'middle', weight: 700, color: c.tone }, g);
    const cs = S.text(c.stat, { x: lx + colW / 2, y: colY + 80, size: 22, anchor: 'middle', weight: 700, color: 'ink' }, g);
    const cb = S.text(c.sub, { x: lx + colW / 2, y: colY + 120, size: 19, anchor: 'middle', weight: 600, color: c.tone }, g);
    cb.setAttribute('data-audit', 'ignore');
    const cd = S.text(c.desc, { x: lx + colW / 2, y: colY + 175, size: 18, anchor: 'middle', weight: 600, color: 'muted' }, g);
    cd.setAttribute('data-audit', 'ignore');
    colEls.push({ bc, ct, cs, cb, cd });
  });

  const footer = S.pill('EVERY WEIGHT MUST CROSS THAT BRIDGE: THE CHIP IS NOT SLOW, IT IS STARVED FOR DATA', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return { group: g, card, title, colEls, footer };
}

/**
 * Creates the What Is Inside the Package & Grand Title Visual
 */
function ch00InsidePackage(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('INSIDE THE PACKAGE: TRANSISTORS, CLOCK CYCLES, AND ARCHITECTURE', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const colW = 390;
  const colGap = 25;
  const startX = cx - (3 * colW + 2 * colGap) / 2;
  const colY = cy - 145;
  const colH = 250;

  const pillars = [
    {
      name: '132 MULTIPROCESSORS',
      sub: 'Floor Plan of Identical SMs',
      detail: '16,896 CUDA arithmetic lanes',
      stat: '528 Fourth-Gen Tensor Cores',
      tone: 'compute'
    },
    {
      name: 'THE MEMORY LADDER',
      sub: 'Latency Gap Across Levels',
      detail: 'Register File: 1 clock tick',
      stat: 'HBM Memory: ~479 clock ticks',
      tone: 'bytes'
    },
    {
      name: '64 WARPS LATENCY HIDING',
      sub: 'Zero-Overhead Thread Swapping',
      detail: 'Thousands of resident threads',
      stat: 'Hardware switches instantly on stalls',
      tone: 'helps'
    }
  ];

  const colEls = [];
  pillars.forEach((p, idx) => {
    const lx = startX + idx * (colW + colGap);
    const bc = S.card({ x: lx, y: colY, w: colW, h: colH, tone: p.tone, title: '' }, g);
    const pn = S.text(p.name, { x: lx + colW / 2, y: colY + 36, size: 20, anchor: 'middle', weight: 700, color: p.tone }, g);
    const ps = S.text(p.sub, { x: lx + colW / 2, y: colY + 75, size: 19, anchor: 'middle', weight: 600, color: 'ink' }, g);
    ps.setAttribute('data-audit', 'ignore');
    const pd = S.text(p.detail, { x: lx + colW / 2, y: colY + 125, size: 19, anchor: 'middle', weight: 600, color: 'muted' }, g);
    pd.setAttribute('data-audit', 'ignore');
    const pt = S.text(p.stat, { x: lx + colW / 2, y: colY + 185, size: 20, anchor: 'middle', weight: 700, color: p.tone }, g);
    colEls.push({ bc, pn, ps, pd, pt });
  });

  const footer = S.pill('INSIDE THE GPU: THE ARCHITECTURE OF HIGH-THROUGHPUT INFERENCE', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'struct', size: 20, weight: 700
  }, g);

  return { group: g, card, title, colEls, footer };
}
