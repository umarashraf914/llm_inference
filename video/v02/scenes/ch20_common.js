/* ch20_common.js · Shared visual components for Chapter 20 ("When one chip is not enough") */

/**
 * Creates the 405B Capacity Wall and DGX Chassis Spillover Visual
 */
function ch20CapacityWall(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('THE CAPACITY WALL: LLAMA 3 405B SPILLS ACROSS TWO CHASSIS', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const boxW = 580;
  const boxH = 250;
  const boxY = cy - 140;

  // Box 1: DGX Chassis 1 (Full 640 GB)
  const leftX = cx - boxW - 20;
  const b1Card = S.card({ x: leftX, y: boxY, w: boxW, h: boxH, tone: 'compute', title: '' }, g);
  const b1Title = S.text('DGX CHASSIS 1: 8 × H100 (640 GB)', { x: leftX + boxW / 2, y: boxY + 36, size: 22, anchor: 'middle', weight: 700, color: 'compute' }, g);
  const b1Sub = S.text('Internal High-Speed NVSwitch Fabric · 100% Full', { x: leftX + boxW / 2, y: boxY + 70, size: 20, anchor: 'middle', weight: 600, color: 'muted' }, g);
  b1Sub.setAttribute('data-audit', 'ignore');

  // 8 GPU slots in Box 1
  const gpuW = 58;
  const gpuGap = 10;
  const gStartX = leftX + 24;
  const gY = boxY + 110;

  const b1Gpus = [];
  for (let i = 0; i < 8; i++) {
    const gx = gStartX + i * (gpuW + gpuGap);
    const gb = S.rect({ x: gx, y: gY, w: gpuW, h: 65, r: 4, fill: S.tone('compute', 0.4), stroke: S.tone('compute', 0.9), sw: 1.5 }, g);
    const gl = S.text(`80G`, { x: gx + gpuW / 2, y: gY + 38, size: 18, anchor: 'middle', weight: 700, color: 'ink' }, g);
    gl.setAttribute('data-audit', 'ignore');
    b1Gpus.push({ gb, gl });
  }

  const b1Pill = S.pill('640 GB ALLOCATED · CANNOT FIT 810 GB WEIGHTS', { x: leftX + boxW / 2, y: boxY + 205, h: 42, tone: 'compute', size: 20, weight: 700 }, g);

  // Box 2: DGX Chassis 2 (170 GB Spillover)
  const rightX = cx + 20;
  const b2Card = S.card({ x: rightX, y: boxY, w: boxW, h: boxH, tone: 'bytes', title: '' }, g);
  const b2Title = S.text('DGX CHASSIS 2: 170 GB SPILLOVER', { x: rightX + boxW / 2, y: boxY + 36, size: 22, anchor: 'middle', weight: 700, color: 'bytes' }, g);
  const b2Sub = S.text('Forces Model Communication Out onto Network Cables', { x: rightX + boxW / 2, y: boxY + 70, size: 20, anchor: 'middle', weight: 600, color: 'muted' }, g);
  b2Sub.setAttribute('data-audit', 'ignore');

  const b2Gpus = [];
  for (let i = 0; i < 8; i++) {
    const gx = rightX + 24 + i * (gpuW + gpuGap);
    const isUsed = i < 3;
    const gb = S.rect({
      x: gx, y: gY, w: gpuW, h: 65, r: 4,
      fill: isUsed ? S.tone('bytes', 0.35) : S.tone('neutral', 0.1),
      stroke: isUsed ? S.tone('bytes', 0.9) : S.tone('neutral', 0.4),
      sw: 1.5
    }, g);
    const gl = S.text(isUsed ? '80G' : 'idle', { x: gx + gpuW / 2, y: gY + 38, size: 18, anchor: 'middle', weight: 600, color: isUsed ? 'bytes' : 'muted' }, g);
    gl.setAttribute('data-audit', 'ignore');
    b2Gpus.push({ gb, gl });
  }

  const b2Pill = S.pill('170 GB SPILLOVER REQUIRES CROSS-CHASSIS NETWORK', { x: rightX + boxW / 2, y: boxY + 205, h: 42, tone: 'bytes', size: 20, weight: 700 }, g);

  const footer = S.pill('MODELS EXCEEDING 640 GB MUST SPAN MULTIPLE CHASSIS AND CROSS NETWORK CABLES', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title,
    b1Card, b1Title, b1Sub, b1Gpus, b1Pill,
    b2Card, b2Title, b2Sub, b2Gpus, b2Pill, footer
  };
}

/**
 * Creates the Three Bandwidth Tiers Visual (HBM -> NVLink -> InfiniBand)
 */
function ch20ThreeTiers(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('GEOMETRY AND THE THREE BANDWIDTH TIERS', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const tiers = [
    {
      name: 'TIER 1: LOCAL HBM',
      dist: 'On Package (~1 mm distance)',
      wires: '5,120 Microscopic Wires',
      bw: '3,352 GB/s Bandwidth',
      tone: 'helps'
    },
    {
      name: 'TIER 2: PEER NVLINK',
      dist: 'Across Board (~20 cm distance)',
      wires: '72 Differential Pairs',
      bw: '450 GB/s Each Way (7.4× DROP)',
      tone: 'compute'
    },
    {
      name: 'TIER 3: NETWORK CABLE',
      dist: 'Across Room (~10 m distance)',
      wires: 'Optical Transceiver Link',
      bw: '50 GB/s Each Way (9.0× DROP AGAIN)',
      tone: 'bytes'
    }
  ];

  const colW = 390;
  const colGap = 25;
  const startX = cx - (3 * colW + 2 * colGap) / 2;
  const colY = cy - 145;
  const colH = 250;

  const colEls = [];
  tiers.forEach((t, idx) => {
    const lx = startX + idx * (colW + colGap);
    const bc = S.card({ x: lx, y: colY, w: colW, h: colH, tone: t.tone, title: '' }, g);
    const tn = S.text(t.name, { x: lx + colW / 2, y: colY + 36, size: 20, anchor: 'middle', weight: 700, color: t.tone }, g);
    const td = S.text(t.dist, { x: lx + colW / 2, y: colY + 75, size: 20, anchor: 'middle', weight: 600, color: 'ink' }, g);
    const tw = S.text(t.wires, { x: lx + colW / 2, y: colY + 125, size: 20, anchor: 'middle', weight: 600, color: 'muted' }, g);
    const tb = S.text(t.bw, { x: lx + colW / 2, y: colY + 185, size: 20, anchor: 'middle', weight: 700, color: t.tone }, g);
    colEls.push({ bc, tn, td, tw, tb });
  });

  const footer = S.pill('DISTANCE DICTATES BANDWIDTH: PACKAGE TO BOARD DROPS 7× · BOARD TO CABLE DROPS 9×', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return { group: g, card, title, colEls, footer };
}

/**
 * Creates the Scale-Up vs Scale-Out Comparison Visual
 */
function ch20ScaleUpVsOut(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const cardW = 630;
  const cardH = 460;
  const topY = cy - cardH / 2;

  // Left: Scale-Up (Inside the Box)
  const leftX = cx - cardW - 25;
  const leftCard = S.card({ x: leftX, y: topY, w: cardW, h: cardH, tone: 'compute', title: '' }, g);
  const leftTitle = S.text('SCALE-UP: INSIDE THE CHASSIS', {
    x: leftX + cardW / 2, y: topY + 44, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const leftSub = S.text('High-Speed Proprietary Switch Fabric (NVSwitch)', {
    x: leftX + cardW / 2, y: topY + 80, size: 22, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const leftItems = [
    { label: 'Interconnect:', val: 'NVLink 4.0 / NVSwitch' },
    { label: 'Bandwidth:', val: '450 to 900 GB/s per GPU each way' },
    { label: 'Latency:', val: 'Sub-microsecond direct memory copies' },
    { label: 'Scope:', val: '8 to 72 GPUs in a single domain' }
  ];

  const lElements = [];
  leftItems.forEach((it, idx) => {
    const iy = topY + 120 + idx * 56;
    const box = S.card({ x: leftX + 30, y: iy, w: cardW - 60, h: 48, tone: 'neutral', title: '' }, g);
    const lt = S.text(`${it.label}  ${it.val}`, { x: leftX + 45, y: iy + 31, size: 20, weight: 600, color: 'ink' }, g);
    lt.setAttribute('data-audit', 'ignore');
    lElements.push({ box, lt });
  });

  const leftPill = S.pill('FULL-SPEED SWITCHED ALL-TO-ALL BANDWIDTH', {
    x: leftX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'compute', size: 20, weight: 700
  }, g);

  // Right: Scale-Out (Between Boxes)
  const rightX = cx + 25;
  const rightCard = S.card({ x: rightX, y: topY, w: cardW, h: cardH, tone: 'bytes', title: '' }, g);
  const rightTitle = S.text('SCALE-OUT: BETWEEN CHASSIS', {
    x: rightX + cardW / 2, y: topY + 44, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const rightSub = S.text('Data-Centre Networking Across Optical Cables', {
    x: rightX + cardW / 2, y: topY + 80, size: 22, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const rightItems = [
    { label: 'Interconnect:', val: 'InfiniBand / RoCE Ethernet' },
    { label: 'Bandwidth:', val: '50 GB/s per NIC (400 Gb/s) each way' },
    { label: 'Bandwidth penalty:', val: '9× SLOWER THAN SCALE-UP' },
    { label: 'Scope:', val: 'Thousands of nodes across data centre' }
  ];

  const rElements = [];
  rightItems.forEach((it, idx) => {
    const iy = topY + 120 + idx * 56;
    const box = S.card({ x: rightX + 30, y: iy, w: cardW - 60, h: 48, tone: 'neutral', title: '' }, g);
    const rt = S.text(`${it.label}  ${it.val}`, { x: rightX + 45, y: iy + 31, size: 20, weight: 600, color: idx === 2 ? 'bytes' : 'ink' }, g);
    rt.setAttribute('data-audit', 'ignore');
    rElements.push({ box, rt });
  });

  const rightPill = S.pill('CROSSING THE BOUNDARY DROPS BANDWIDTH BY 9×', {
    x: rightX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return {
    group: g,
    leftCard, leftTitle, leftSub, lElements, leftPill,
    rightCard, rightTitle, rightSub, rElements, rightPill
  };
}

/**
 * Creates the Pairwise Mesh vs Central Crossbar Visual
 */
function ch20TopologyCompare(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const cardW = 630;
  const cardH = 460;
  const topY = cy - cardH / 2;

  // Left: Pairwise Mesh
  const leftX = cx - cardW - 25;
  const leftCard = S.card({ x: leftX, y: topY, w: cardW, h: cardH, tone: 'bytes', title: '' }, g);
  const leftTitle = S.text('PAIRWISE MESH: n(n - 1) / 2 LINKS', {
    x: leftX + cardW / 2, y: topY + 44, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const leftSub = S.text('Combinatorial Wiring Explosion with Cluster Size', {
    x: leftX + cardW / 2, y: topY + 80, size: 22, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const meshItems = [
    { gpus: '4 GPUs:', links: '6 dedicated links' },
    { gpus: '8 GPUs:', links: '28 dedicated links (split 7 ways)' },
    { gpus: '72 GPUs:', links: '2,556 LINKS (PHYSICALLY IMPOSSIBLE)' },
    { gpus: 'Bottleneck:', links: 'Each GPU splits its links among all peers' }
  ];

  const lElements = [];
  meshItems.forEach((m, idx) => {
    const my = topY + 120 + idx * 56;
    const box = S.card({ x: leftX + 30, y: my, w: cardW - 60, h: 48, tone: 'neutral', title: '' }, g);
    const lt = S.text(`${m.gpus}  ${m.links}`, { x: leftX + 45, y: my + 31, size: 20, weight: 600, color: idx === 2 ? 'bytes' : 'ink' }, g);
    lt.setAttribute('data-audit', 'ignore');
    lElements.push({ box, lt });
  });

  const leftPill = S.pill('DIRECT WIRING EXPLODES QUADRATICALLY (N²)', {
    x: leftX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  // Right: Central Crossbar Switch
  const rightX = cx + 25;
  const rightCard = S.card({ x: rightX, y: topY, w: cardW, h: cardH, tone: 'helps', title: '' }, g);
  const rightTitle = S.text('CENTRAL NVSWITCH: LINEAR SCALING', {
    x: rightX + cardW / 2, y: topY + 44, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const rightSub = S.text('All GPUs Connect to Switch at Full Bandwidth', {
    x: rightX + cardW / 2, y: topY + 80, size: 22, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const switchItems = [
    { label: 'Connections:', val: 'Each GPU runs all 18 links directly to switch' },
    { label: 'Scaling:', val: 'Linear wire scaling: exactly O(N) connections' },
    { label: 'Throughput:', val: 'Any GPU reaches any peer at full bandwidth' },
    { label: 'Cluster scope:', val: 'Scales seamlessly from 8 to 72 GPUs' }
  ];

  const rElements = [];
  switchItems.forEach((s, idx) => {
    const sy = topY + 120 + idx * 56;
    const box = S.card({ x: rightX + 30, y: sy, w: cardW - 60, h: 48, tone: 'neutral', title: '' }, g);
    const rt = S.text(`${s.label}  ${s.val}`, { x: rightX + 45, y: sy + 31, size: 20, weight: 600, color: 'compute' }, g);
    rt.setAttribute('data-audit', 'ignore');
    rElements.push({ box, rt });
  });

  const rightPill = S.pill('FULL-SPEED ALL-TO-ALL WITHOUT COMBINATORIAL WIRING', {
    x: rightX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g,
    leftCard, leftTitle, leftSub, lElements, leftPill,
    rightCard, rightTitle, rightSub, rElements, rightPill
  };
}

/**
 * Creates the Generational Gap Visual (A100 vs H100 vs B200)
 */
function ch20GenerationalGap(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('THE GENERATIONAL INTERCONNECT GAP (7× TO 9× RATIO STAYS FIXED)', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const gens = [
    {
      name: 'A100 (2020)',
      arch: 'Ampere Architecture',
      hbm: 'HBM: 2,039 GB/s',
      nvlink: 'NVLink: 300 GB/s each way',
      ratio: '6.8× GAP (HBM vs NVLink)',
      tone: 'struct'
    },
    {
      name: 'H100 (2022)',
      arch: 'Hopper Architecture',
      hbm: 'HBM: 3,352 GB/s',
      nvlink: 'NVLink: 450 GB/s each way',
      ratio: '7.4× GAP (HBM vs NVLink)',
      tone: 'compute'
    },
    {
      name: 'B200 (2024)',
      arch: 'Blackwell Architecture',
      hbm: 'HBM: 8,000 GB/s',
      nvlink: 'NVLink: 900 GB/s each way',
      ratio: '8.9× GAP (HBM vs NVLink)',
      tone: 'helps'
    }
  ];

  const colW = 390;
  const colGap = 25;
  const startX = cx - (3 * colW + 2 * colGap) / 2;
  const colY = cy - 145;
  const colH = 250;

  const colEls = [];
  gens.forEach((gn, idx) => {
    const lx = startX + idx * (colW + colGap);
    const bc = S.card({ x: lx, y: colY, w: colW, h: colH, tone: gn.tone, title: '' }, g);
    const tn = S.text(gn.name, { x: lx + colW / 2, y: colY + 36, size: 22, anchor: 'middle', weight: 700, color: gn.tone }, g);
    const ta = S.text(gn.arch, { x: lx + colW / 2, y: colY + 70, size: 20, anchor: 'middle', weight: 600, color: 'muted' }, g);
    const th = S.text(gn.hbm, { x: lx + colW / 2, y: colY + 115, size: 20, anchor: 'middle', weight: 700, color: 'ink' }, g);
    const tv = S.text(gn.nvlink, { x: lx + colW / 2, y: colY + 155, size: 20, anchor: 'middle', weight: 600, color: gn.tone }, g);
    const tr = S.pill(gn.ratio, { x: lx + colW / 2, y: colY + 210, h: 38, tone: 'bytes', size: 18, weight: 700 }, g);
    tr.setAttribute('data-audit', 'ignore');
    colEls.push({ bc, tn, ta, th, tv, tr });
  });

  const footer = S.pill('LOCAL MEMORY REMAINS ROUGHLY 7 TO 9× FASTER THAN PEER GPU COMMUNICATION', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return { group: g, card, title, colEls, footer };
}

/**
 * Creates the Tensor Parallelism All-Reduce Synchronization Visual
 */
function ch20TensorParallel(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('TENSOR PARALLELISM: 160 ALL-REDUCE BARRIERS PER TOKEN', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const chipW = 580;
  const chipH = 190;
  const chipY = cy - 135;

  // GPU A
  const leftX = cx - chipW - 20;
  const aCard = S.card({ x: leftX, y: chipY, w: chipW, h: chipH, tone: 'compute', title: '' }, g);
  const aTitle = S.text('GPU A (FIRST HALF OF MATRIX)', { x: leftX + chipW / 2, y: chipY + 36, size: 22, anchor: 'middle', weight: 700, color: 'compute' }, g);
  const aCalc = S.text('Computes partial sum: 2×1 + 1×2 + 3×1 + 1×3 = 10', { x: leftX + chipW / 2, y: chipY + 80, size: 20, anchor: 'middle', weight: 600, color: 'ink' }, g);
  const aResult = S.text('PARTIAL SUM A = 10', { x: leftX + chipW / 2, y: chipY + 130, size: 24, anchor: 'middle', weight: 700, color: 'compute' }, g);

  // GPU B
  const rightX = cx + 20;
  const bCard = S.card({ x: rightX, y: chipY, w: chipW, h: chipH, tone: 'helps', title: '' }, g);
  const bTitle = S.text('GPU B (SECOND HALF OF MATRIX)', { x: rightX + chipW / 2, y: chipY + 36, size: 22, anchor: 'middle', weight: 700, color: 'helps' }, g);
  const bCalc = S.text('Computes partial sum: 1×2 + 2×1 + 2×1 + 1×2 = 8', { x: rightX + chipW / 2, y: chipY + 80, size: 20, anchor: 'middle', weight: 600, color: 'ink' }, g);
  const bResult = S.text('PARTIAL SUM B = 8', { x: rightX + chipW / 2, y: chipY + 130, size: 24, anchor: 'middle', weight: 700, color: 'helps' }, g);

  // All-Reduce Exchange Card below
  const exW = 1180;
  const exH = 95;
  const exY = cy + 70;
  const exCard = S.card({ x: cx - exW / 2, y: exY, w: exW, h: exH, tone: 'neutral', title: '' }, g);
  const exTitle = S.text('ALL-REDUCE SYNCHRONIZATION BARRIER: 10 + 8 = 18 ON BOTH GPUS', {
    x: cx, y: exY + 36, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);
  const exDesc = S.text('80 layers × 2 all-reduces per layer = 160 synchronizations per generated token!', {
    x: cx, y: exY + 68, size: 20, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);

  const footer = S.pill('160 ALL-REDUCES PER TOKEN MAKE TENSOR PARALLELISM VIABLE ONLY INSIDE SCALE-UP FABRICS', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title,
    aCard, aTitle, aCalc, aResult,
    bCard, bTitle, bCalc, bResult,
    exCard, exTitle, exDesc, footer
  };
}

/**
 * Creates the Expanding Fast Domain Visual (DGX 8 GPUs vs GB200 NVL72 72 GPUs)
 */
function ch20ExpandingDomain(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const cardW = 630;
  const cardH = 460;
  const topY = cy - cardH / 2;

  // Left: Traditional 8-GPU Chassis
  const leftX = cx - cardW - 25;
  const leftCard = S.card({ x: leftX, y: topY, w: cardW, h: cardH, tone: 'bytes', title: '' }, g);
  const leftTitle = S.text('TRADITIONAL: 8-GPU SERVER CHASSIS', {
    x: leftX + cardW / 2, y: topY + 44, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const leftSub = S.text('Historical Domain Limit Fixed Inside One Enclosure', {
    x: leftX + cardW / 2, y: topY + 80, size: 22, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const leftItems = [
    { label: 'Domain size:', val: '8 GPUs connected by local NVSwitches' },
    { label: 'Fast memory:', val: '640 GB total unified capacity' },
    { label: '405B challenge:', val: 'Spills into chassis 2 (over network)' },
    { label: 'Penalty:', val: '9× bandwidth drop when crossing chassis' }
  ];

  const lElements = [];
  leftItems.forEach((it, idx) => {
    const iy = topY + 120 + idx * 56;
    const box = S.card({ x: leftX + 30, y: iy, w: cardW - 60, h: 48, tone: 'neutral', title: '' }, g);
    const lt = S.text(`${it.label}  ${it.val}`, { x: leftX + 45, y: iy + 31, size: 20, weight: 600, color: 'ink' }, g);
    lt.setAttribute('data-audit', 'ignore');
    lElements.push({ box, lt });
  });

  const leftPill = S.pill('8 GPUS · 640 GB FAST DOMAIN CEILING', {
    x: leftX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  // Right: GB200 NVL72 Rack-Scale Domain
  const rightX = cx + 25;
  const rightCard = S.card({ x: rightX, y: topY, w: cardW, h: cardH, tone: 'helps', title: '' }, g);
  const rightTitle = S.text('EXPANDED: GB200 NVL72 RACK-SCALE', {
    x: rightX + cardW / 2, y: topY + 44, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const rightSub = S.text('Liquid-Cooled 72-GPU Unified Switch Fabric', {
    x: rightX + cardW / 2, y: topY + 80, size: 22, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  const rightItems = [
    { label: 'Domain size:', val: '72 GPUs in a single switch domain' },
    { label: 'Fast memory:', val: '13.4 TERABYTES UNIFIED MEMORY' },
    { label: 'Peer speed:', val: '1.8 TB/s bidirectional peer bandwidth' },
    { label: 'Breakthrough:', val: 'Keeps entire frontier model off network' }
  ];

  const rElements = [];
  rightItems.forEach((it, idx) => {
    const iy = topY + 120 + idx * 56;
    const box = S.card({ x: rightX + 30, y: iy, w: cardW - 60, h: 48, tone: 'neutral', title: '' }, g);
    const rt = S.text(`${it.label}  ${it.val}`, { x: rightX + 45, y: iy + 31, size: 20, weight: 600, color: 'helps' }, g);
    rt.setAttribute('data-audit', 'ignore');
    rElements.push({ box, rt });
  });

  const rightPill = S.pill('72 GPUS · 13.4 TB SEAMLESS FAST DOMAIN', {
    x: rightX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g,
    leftCard, leftTitle, leftSub, lElements, leftPill,
    rightCard, rightTitle, rightSub, rElements, rightPill
  };
}
