/* ch21_common.js · Shared visual components for Chapter 21 ("Other bets, and the three answers") */

/**
 * Creates the GPU Multiprocessor vs TPU Systolic Array Comparison Visual
 */
function ch21GpuVsTpu(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const cardW = 630;
  const cardH = 460;
  const topY = cy - cardH / 2;

  // Left: GPU Multiprocessor
  const leftX = cx - cardW - 25;
  const leftCard = S.card({ x: leftX, y: topY, w: cardW, h: cardH, tone: 'compute', title: '' }, g);
  const leftTitle = S.text('GPU: DYNAMIC MULTIPROCESSOR', {
    x: leftX + cardW / 2, y: topY + 44, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const leftSub = S.text('Software Caching & Dynamic Thread Scheduling', {
    x: leftX + cardW / 2, y: topY + 80, size: 22, anchor: 'middle', weight: 600, color: 'muted'
  }, g);
  leftSub.setAttribute('data-audit', 'ignore');

  const gpuItems = [
    { label: 'Architecture:', val: '132 SMs with independent warp schedulers' },
    { label: 'Data flow:', val: 'Operands loaded from register file per cycle' },
    { label: 'Reuse mechanism:', val: 'Software-managed shared memory & L1 cache' },
    { label: 'Strength:', val: 'Highly flexible: runs any arbitrary compute graph' }
  ];

  const lElements = [];
  gpuItems.forEach((it, idx) => {
    const iy = topY + 120 + idx * 56;
    const box = S.card({ x: leftX + 30, y: iy, w: cardW - 60, h: 48, tone: 'neutral', title: '' }, g);
    const lt = S.text(`${it.label}  ${it.val}`, { x: leftX + 45, y: iy + 31, size: 20, weight: 600, color: 'ink' }, g);
    lt.setAttribute('data-audit', 'ignore');
    lElements.push({ box, lt });
  });

  const leftPill = S.pill('GPU: SOFTWARE TILING & DYNAMIC SCHEDULING', {
    x: leftX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'compute', size: 20, weight: 700
  }, g);

  // Right: TPU Systolic Array
  const rightX = cx + 25;
  const rightCard = S.card({ x: rightX, y: topY, w: cardW, h: cardH, tone: 'helps', title: '' }, g);
  const rightTitle = S.text('GOOGLE TPU: 2D SYSTOLIC ARRAY', {
    x: rightX + cardW / 2, y: topY + 44, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const rightSub = S.text('Hardwired Spatial Reuse Directly in Copper Wiring', {
    x: rightX + cardW / 2, y: topY + 80, size: 22, anchor: 'middle', weight: 600, color: 'muted'
  }, g);
  rightSub.setAttribute('data-audit', 'ignore');

  const tpuItems = [
    { label: 'Architecture:', val: 'Massive rigid 2D grid of multiply-accumulate cells' },
    { label: 'Data flow:', val: 'Direct cell-to-neighbour passing on clock ticks' },
    { label: 'Register traffic:', val: 'ZERO trips back to register file during tile' },
    { label: 'Throughput:', val: '16,384 multiply-adds per beat on 128×128 grid' }
  ];

  const rElements = [];
  tpuItems.forEach((it, idx) => {
    const iy = topY + 120 + idx * 56;
    const box = S.card({ x: rightX + 30, y: iy, w: cardW - 60, h: 48, tone: 'neutral', title: '' }, g);
    const rt = S.text(`${it.label}  ${it.val}`, { x: rightX + 45, y: iy + 31, size: 20, weight: 600, color: 'helps' }, g);
    rt.setAttribute('data-audit', 'ignore');
    rElements.push({ box, rt });
  });

  const rightPill = S.pill('TPU: HARDWIRED SPATIAL REUSE IN SILICON', {
    x: rightX + cardW / 2, y: topY + cardH - 45, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g,
    leftCard, leftTitle, leftSub, lElements, leftPill,
    rightCard, rightTitle, rightSub, rElements, rightPill
  };
}

/**
 * Creates the 3x3 Systolic Array Beat-by-Beat Visual
 */
function ch21SystolicStep(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('SYSTOLIC ARRAY: 3×3 MATRIX MULTIPLY IN 7 BEATS (3n - 2)', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Left subpanel: 3x3 Grid
  const gridW = 540;
  const gridH = 260;
  const gridX = cx - w / 2 + 40;
  const gridY = cy - 130;

  const gridCard = S.card({ x: gridX, y: gridY, w: gridW, h: gridH, tone: 'helps', title: '' }, g);
  const gridTitle = S.text('3×3 SYSTOLIC GRID (WEIGHTS STATIONARY)', {
    x: gridX + gridW / 2, y: gridY + 34, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  const cellSize = 50;
  const cellGap = 16;
  const startX = gridX + (gridW - (3 * cellSize + 2 * cellGap)) / 2;
  const startY = gridY + 70;

  const cells = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const x = startX + c * (cellSize + cellGap);
      const y = startY + r * (cellSize + cellGap);
      const box = S.rect({ x, y, w: cellSize, h: cellSize, r: 6, fill: S.tone('helps', 0.25), stroke: S.tone('helps', 0.8), sw: 1.5 }, g);
      const lbl = S.text(`W${r}${c}`, { x: x + cellSize / 2, y: y + 32, size: 18, anchor: 'middle', weight: 700, color: 'ink' }, g);
      lbl.setAttribute('data-audit', 'ignore');
      cells.push({ box, lbl, r, c });
    }
  }

  const gridPill = S.pill('INPUTS ENTER ON 45° SLANT · RUNNING SUMS CASCADE DOWN', {
    x: gridX + gridW / 2, y: gridY + gridH - 24, h: 36, tone: 'neutral', size: 18, weight: 600
  }, g);
  gridPill.setAttribute('data-audit', 'ignore');

  // Right subpanel: Beat-by-Beat Execution Math & Scaling
  const mathW = 680;
  const mathH = 260;
  const mathX = cx + w / 2 - mathW - 40;
  const mathY = cy - 130;

  const mathCard = S.card({ x: mathX, y: mathY, w: mathW, h: mathH, tone: 'compute', title: '' }, g);
  const mathTitle = S.text('RHYTHMIC TIMING & OPERAND REUSE', {
    x: mathX + mathW / 2, y: mathY + 34, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  const steps = [
    { beat: 'Beat 1 to 7:', desc: 'Inputs step rightward while partial sums step downward' },
    { beat: 'Total operations:', desc: '27 multiply-adds completed in exactly 7 clock beats' },
    { beat: 'Memory traffic:', desc: 'Zero intermediate read-write trips to register file' },
    { beat: '128×128 Production:', desc: '16,384 multiply-adds executed on every clock beat' }
  ];

  const sElements = [];
  steps.forEach((st, idx) => {
    const sy = mathY + 68 + idx * 44;
    const box = S.card({ x: mathX + 25, y: sy, w: mathW - 50, h: 38, tone: 'neutral', title: '' }, g);
    const bt = S.text(`${st.beat}  ${st.desc}`, { x: mathX + 38, y: sy + 25, size: 20, weight: 600, color: 'ink' }, g);
    bt.setAttribute('data-audit', 'ignore');
    sElements.push({ box, bt });
  });

  const mathPill = S.pill('3n - 2 FORMULA: FINISHES ALL N³ OPS IN LINEAR BEATS', {
    x: mathX + mathW / 2, y: mathY + mathH - 24, h: 36, tone: 'compute', size: 18, weight: 700
  }, g);
  mathPill.setAttribute('data-audit', 'ignore');

  const footer = S.pill('SYSTOLIC GRIDS COMPUTE MATRIX PRODUCTS RHYTHMICALLY IN 3N MINUS 2 BEATS', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title,
    gridCard, gridTitle, cells, gridPill,
    mathCard, mathTitle, sElements, mathPill,
    footer
  };
}

/**
 * Creates the Software Ecosystem Constraint Visual (AMD MI300X specs vs 4-tier stack)
 */
function ch21SoftwareMoat(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('THE SOFTWARE ECOSYSTEM CONSTRAINT: WHY CUDA REMAINS THE DECIDING FACTOR', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Left: Hardware Specs Comparison (MI300X vs H100)
  const specW = 580;
  const specH = 250;
  const specX = cx - specW - 20;
  const specY = cy - 140;

  const specCard = S.card({ x: specX, y: specY, w: specW, h: specH, tone: 'compute', title: '' }, g);
  const specTitle = S.text('SILICON SPECS: AMD MI300X VS H100', {
    x: specX + specW / 2, y: specY + 36, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  const specRows = [
    { name: 'AMD MI300X:', spec: '192 GB HBM3 · 5,300 GB/s bandwidth' },
    { name: 'Nvidia H100:', spec: '80 GB HBM3 · 3,352 GB/s bandwidth' },
    { name: 'Capacity gap:', val: 'MI300X offers 2.4× more memory capacity' },
    { name: 'Paradox:', val: 'Teams still overwhelmingly choose Nvidia' }
  ];

  const specEls = [];
  specRows.forEach((r, idx) => {
    const ry = specY + 68 + idx * 42;
    const box = S.card({ x: specX + 25, y: ry, w: specW - 50, h: 36, tone: 'neutral', title: '' }, g);
    const txt = S.text(`${r.name ?? r.spec ?? r.gap ?? r.Paradox ?? ''}  ${r.spec ?? r.val ?? ''}`, {
      x: specX + 38, y: ry + 24, size: 19, weight: 600, color: idx === 0 ? 'compute' : 'ink'
    }, g);
    txt.setAttribute('data-audit', 'ignore');
    specEls.push({ box, txt });
  });

  const specPill = S.pill('RAW HARDWARE SPECS FAVOR THE COMPETITION', {
    x: specX + specW / 2, y: specY + specH - 24, h: 36, tone: 'compute', size: 18, weight: 700
  }, g);
  specPill.setAttribute('data-audit', 'ignore');

  // Right: 4-Layer Software Stack
  const stackW = 580;
  const stackH = 250;
  const stackX = cx + 20;
  const stackY = cy - 140;

  const stackCard = S.card({ x: stackX, y: stackY, w: stackW, h: stackH, tone: 'struct', title: '' }, g);
  const stackTitle = S.text('THE 4-LAYER SOFTWARE HIERARCHY', {
    x: stackX + stackW / 2, y: stackY + 36, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);

  const layers = [
    { lvl: '1. Model Frameworks:', desc: 'PyTorch, vLLM, TensorRT-LLM, JAX' },
    { lvl: '2. Math Libraries:', desc: 'cuBLAS, cuDNN, FlashAttention (20 yrs tuned)' },
    { lvl: '3. Compiler & Driver:', desc: 'NVCC, PTX Assembler, CUDA Runtime' },
    { lvl: '4. Bare Silicon Die:', desc: 'Physical GPU SMs and memory channels' }
  ];

  const layerEls = [];
  layers.forEach((l, idx) => {
    const ly = stackY + 68 + idx * 42;
    const box = S.card({ x: stackX + 25, y: ly, w: stackW - 50, h: 36, tone: idx === 1 ? 'bytes' : 'neutral', title: '' }, g);
    const lt = S.text(`${l.lvl}  ${l.desc}`, {
      x: stackX + 38, y: ly + 24, size: 19, weight: 600, color: idx === 1 ? 'bytes' : 'ink'
    }, g);
    lt.setAttribute('data-audit', 'ignore');
    layerEls.push({ box, lt });
  });

  const stackPill = S.pill('TWO DECADES OF LIBRARY TUNING CREATES THE MOAT', {
    x: stackX + stackW / 2, y: stackY + stackH - 24, h: 36, tone: 'struct', size: 18, weight: 700
  }, g);
  stackPill.setAttribute('data-audit', 'ignore');

  const footer = S.pill('SOFTWARE ECOSYSTEM MATURITY FREQUENTLY OUTWEIGHS RAW SILICON SPECIFICATIONS', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title,
    specCard, specTitle, specEls, specPill,
    stackCard, stackTitle, layerEls, stackPill,
    footer
  };
}

/**
 * Creates The Three Questions Answered Visual (Grand Synthesis)
 */
function ch21ThreeAnswers(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('THE THREE FOUNDING QUESTIONS ANSWERED', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const colW = 390;
  const colGap = 25;
  const startX = cx - (3 * colW + 2 * colGap) / 2;
  const colY = cy - 145;
  const colH = 250;

  const answers = [
    {
      q: '1. WHY DIFFERENT FROM CPU?',
      sub: 'One Foundational Bet',
      pts: [
        'Massive parallel lanes, not anticipation',
        '16,896 CUDA cores & 528 Tensor cores',
        'Waiting is cheap: 64 warps per SM',
        'Hardware thread context switching'
      ],
      tone: 'compute'
    },
    {
      q: '2. WHY ARE BYTES EXPENSIVE?',
      sub: 'Physics and Geometry',
      pts: [
        'DRAM capacitor hidden behind long wires',
        'Capacitor charge leaks every 64 ms',
        '295 ops per byte arithmetic ridge',
        'Memory bandwidth is the hard wall'
      ],
      tone: 'bytes'
    },
    {
      q: '3. WHAT DOES HARDWARE DO?',
      sub: 'Architectural Defences',
      pts: [
        'Latency hiding across warps',
        '32-byte memory sector coalescing',
        'Tensor core 2D matrix tile reuse',
        'BF16 / FP8 precision & NVLink racks'
      ],
      tone: 'helps'
    }
  ];

  const colEls = [];
  answers.forEach((ans, idx) => {
    const lx = startX + idx * (colW + colGap);
    const bc = S.card({ x: lx, y: colY, w: colW, h: colH, tone: ans.tone, title: '' }, g);
    const qn = S.text(ans.q, { x: lx + colW / 2, y: colY + 32, size: 20, anchor: 'middle', weight: 700, color: ans.tone }, g);
    const sb = S.text(ans.sub, { x: lx + colW / 2, y: colY + 62, size: 20, anchor: 'middle', weight: 600, color: 'muted' }, g);

    const ptEls = [];
    ans.pts.forEach((pt, pIdx) => {
      const py = colY + 98 + pIdx * 34;
      const ptText = S.text(`• ${pt}`, { x: lx + 20, y: py, size: 19, weight: 600, color: 'ink' }, g);
      ptText.setAttribute('data-audit', 'ignore');
      ptEls.push(ptText);
    });

    colEls.push({ bc, qn, sb, ptEls });
  });

  const footer = S.pill('NEXT FILM: INSIDE GPU KERNELS · HOW SOFTWARE COMMANDS SILICON', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'struct', size: 20, weight: 700
  }, g);

  return { group: g, card, title, colEls, footer };
}
