/* ch21_common.js · Visual components for Chapter 21 ("Other bets, and the three answers")
   Atlas Figs 119–123:
   - ch21GpuVsTpu (Fig 119): GPU multiprocessor (dynamic scheduling, register file trips) vs TPU systolic array (hardwired reuse)
   - ch21SystolicStep (Fig 120): 3x3 systolic array beat by beat: stationary weights, slanted input wavefront, 3n-2=7 beats
   - ch21SoftwareMoat (Figs 121, 122): Spec comparison (MI300X vs H100) and the 4-layer software stack hierarchy
   - ch21ThreeAnswers (Fig 123): Grand synthesis of the film answering the 3 core questions from Part 1
*/

/**
 * Atlas Fig 119: GPU Dynamic Multiprocessor vs Google TPU Systolic Array
 */
function ch21GpuVsTpu(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const cardW = 680;
  const cardH = 590;
  const topY = cy - cardH / 2;

  // Left: GPU Dynamic Multiprocessor
  const leftX = cx - cardW - 20;
  const leftBg = S.rect({ x: leftX, y: topY, w: cardW, h: cardH, r: 14, fill: '#141d2c', stroke: S.tone('compute'), sw: 1.5 }, g);
  const leftTitle = S.text('gpu · dynamic multiprocessor', {
    x: leftX + cardW / 2, y: topY + 40, size: 24, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const leftSub = S.text('software tiling and dynamic thread scheduling', {
    x: leftX + cardW / 2, y: topY + 74, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Diagram of GPU SM dataflow (Register File -> ALU -> Register File)
  const diagH = 210;
  const diagY = topY + 98;
  const diagBg1 = S.rect({ x: leftX + 30, y: diagY, w: cardW - 60, h: diagH, r: 10, fill: '#0d1420', stroke: '#223048', sw: 1 }, g);

  // Register File Box
  const rfW = 480;
  const rfH = 46;
  const rfX = leftX + cardW / 2 - rfW / 2;
  const rfY = diagY + 20;
  const rfBox = S.rect({ x: rfX, y: rfY, w: rfW, h: rfH, r: 8, fill: S.tone('compute', 0.35), stroke: S.tone('compute'), sw: 1.5 }, g);
  const rfLbl = S.text('register file (64k registers per sm)', { x: leftX + cardW / 2, y: rfY + 29, size: 20, anchor: 'middle', weight: 700, color: 'ink' }, g);

  // SIMD ALU Lanes
  const aluW = 90;
  const aluH = 50;
  const aluGap = 20;
  const aluY = diagY + 128;
  const aluStartX = leftX + cardW / 2 - (4 * aluW + 3 * aluGap) / 2;
  const alus = [];
  for (let i = 0; i < 4; i++) {
    const ax = aluStartX + i * (aluW + aluGap);
    const ab = S.rect({ x: ax, y: aluY, w: aluW, h: aluH, r: 6, fill: S.tone('compute', 0.2), stroke: S.tone('compute'), sw: 1.2 }, g);
    const al = S.text(`alu ${i + 1}`, { x: ax + aluW / 2, y: aluY + 31, size: 20, anchor: 'middle', weight: 700, color: 'compute' }, g);
    // Round-trip arrows
    const dL = S.line({ x1: ax + aluW / 2, y1: rfY + rfH, x2: ax + aluW / 2, y2: aluY, stroke: S.tone('compute'), sw: 2 }, g);
    alus.push({ ab, al, dL });
  }

  // Specifications
  const fBoxY = diagY + diagH + 16;
  const fBoxH = 165;
  const fBox1 = S.rect({ x: leftX + 30, y: fBoxY, w: cardW - 60, h: fBoxH, r: 10, fill: '#172236', stroke: '#2e4162', sw: 1 }, g);
  const l1 = S.text('• architecture: 132 sms with warp schedulers', { x: leftX + 50, y: fBoxY + 34, size: 20, weight: 600, color: 'ink' }, g);
  const l2 = S.text('• data flow: operands fetched from register file', { x: leftX + 50, y: fBoxY + 70, size: 20, weight: 600, color: 'ink' }, g);
  const l3 = S.text('• register traffic: intermediate results return to rf', { x: leftX + 50, y: fBoxY + 106, size: 20, weight: 700, color: 'compute' }, g);
  const l4 = S.text('• strength: runs arbitrary branching compute graphs', { x: leftX + 50, y: fBoxY + 138, size: 20, weight: 600, color: 'muted' }, g);

  const leftPill = S.pill('gpu: flexible software tiling and dynamic scheduling', {
    x: leftX + cardW / 2, y: topY + cardH - 36, h: 42, tone: 'compute', size: 20, weight: 700
  }, g);

  // Right: TPU 2D Systolic Array
  const rightX = cx + 20;
  const rightBg = S.rect({ x: rightX, y: topY, w: cardW, h: cardH, r: 14, fill: '#122026', stroke: S.tone('helps'), sw: 1.5 }, g);
  const rightTitle = S.text('google tpu · 2d systolic array', {
    x: rightX + cardW / 2, y: topY + 40, size: 24, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const rightSub = S.text('hardwired spatial operand reuse in copper wiring', {
    x: rightX + cardW / 2, y: topY + 74, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Diagram of Systolic Array grid (horizontal and vertical direct links)
  const diagBg2 = S.rect({ x: rightX + 30, y: diagY, w: cardW - 60, h: diagH, r: 10, fill: '#0a161c', stroke: '#1b3b3b', sw: 1 }, g);

  // 3x3 array of MAC cells with arrows
  const cSize = 52;
  const cGap = 18;
  const cStartX = rightX + cardW / 2 - (3 * cSize + 2 * cGap) / 2;
  const cStartY = diagY + 16;
  const tpuCells = [];
  const tpuArrows = [];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cxPos = cStartX + c * (cSize + cGap);
      const cyPos = cStartY + r * (cSize + cGap);
      const cb = S.rect({ x: cxPos, y: cyPos, w: cSize, h: cSize, r: 6, fill: S.tone('helps', 0.35), stroke: S.tone('helps'), sw: 1.5 }, g);
      const cl = S.text('mac', { x: cxPos + cSize / 2, y: cyPos + 32, size: 20, anchor: 'middle', weight: 700, color: 'ink' }, g);
      tpuCells.push({ cb, cl });

      // Horizontal arrow to right neighbour
      if (c < 2) {
        const ar = S.line({ x1: cxPos + cSize, y1: cyPos + cSize / 2, x2: cxPos + cSize + cGap, y2: cyPos + cSize / 2, stroke: S.tone('helps'), sw: 2 }, g);
        tpuArrows.push(ar);
      }
      // Vertical arrow to bottom neighbour
      if (r < 2) {
        const ad = S.line({ x1: cxPos + cSize / 2, y1: cyPos + cSize, x2: cxPos + cSize / 2, y2: cyPos + cSize + cGap, stroke: S.tone('helps'), sw: 2 }, g);
        tpuArrows.push(ad);
      }
    }
  }

  // Specifications
  const fBox2 = S.rect({ x: rightX + 30, y: fBoxY, w: cardW - 60, h: fBoxH, r: 10, fill: '#14272c', stroke: '#214e55', sw: 1 }, g);
  const r1 = S.text('• architecture: giant 2d grid of mac cells', { x: rightX + 50, y: fBoxY + 34, size: 20, weight: 600, color: 'ink' }, g);
  const r2 = S.text('• data flow: streams rhythmically to neighbours', { x: rightX + 50, y: fBoxY + 70, size: 20, weight: 600, color: 'ink' }, g);
  const r3 = S.text('• register traffic: zero round-trips to register files', { x: rightX + 50, y: fBoxY + 106, size: 20, weight: 700, color: 'helps' }, g);
  const r4 = S.text('• throughput: 16,384 macs/beat on 128×128 grid', { x: rightX + 50, y: fBoxY + 138, size: 20, weight: 600, color: 'muted' }, g);

  const rightPill = S.pill('tpu: hardwired spatial reuse directly in silicon wiring', {
    x: rightX + cardW / 2, y: topY + cardH - 36, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g,
    leftBg, leftTitle, leftSub, diagBg1, rfBox, rfLbl, alus, fBox1, l1, l2, l3, l4, leftPill,
    rightBg, rightTitle, rightSub, diagBg2, tpuCells, tpuArrows, fBox2, r1, r2, r3, r4, rightPill
  };
}

/**
 * Atlas Fig 120: A Systolic Array Beat by Beat Visual
 */
function ch21SystolicStep(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1460;
  const h = opts.h ?? 620;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('a systolic array beat by beat · 3×3 matrix multiply finished in 7 beats', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Left Panel: 3x3 Physical Systolic Array Engine
  const gridW = 660;
  const gridH = 430;
  const gridX = cx - gridW - 20;
  const gridY = cy - 205;

  const gridCard = S.rect({ x: gridX, y: gridY, w: gridW, h: gridH, r: 12, fill: '#122028', stroke: S.tone('helps'), sw: 1.5 }, g);
  const gridTitle = S.text('3×3 systolic grid · stationary weights', {
    x: gridX + gridW / 2, y: gridY + 34, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const gridSub = S.text('inputs a march right on a slant · partial sums move down', {
    x: gridX + gridW / 2, y: gridY + 62, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Draw 3x3 cells with stationary weights B
  const weights = [
    [1, 2, 1],
    [3, 1, 2],
    [2, 1, 3]
  ];
  const cellSize = 78;
  const cellGap = 24;
  const cStartX = gridX + (gridW - (3 * cellSize + 2 * cellGap)) / 2;
  const cStartY = gridY + 95;
  const cells = [];
  const cellArrows = [];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cxPos = cStartX + c * (cellSize + cellGap);
      const cyPos = cStartY + r * (cellSize + cellGap);
      const cb = S.rect({ x: cxPos, y: cyPos, w: cellSize, h: cellSize, r: 8, fill: S.tone('helps', 0.35), stroke: S.tone('helps'), sw: 1.5 }, g);
      const wLbl1 = S.text(`w = ${weights[r][c]}`, { x: cxPos + cellSize / 2, y: cyPos + 32, size: 20, anchor: 'middle', weight: 700, color: 'ink' }, g);
      const wLbl2 = S.text(`c[${r + 1},${c + 1}]`, { x: cxPos + cellSize / 2, y: cyPos + 58, size: 20, anchor: 'middle', weight: 600, color: 'helps' }, g);
      cells.push({ cb, wLbl1, wLbl2 });

      // Horizontal link to right
      if (c < 2) {
        const al = S.line({ x1: cxPos + cellSize, y1: cyPos + cellSize / 2, x2: cxPos + cellSize + cellGap, y2: cyPos + cellSize / 2, stroke: S.tone('helps'), sw: 2.5 }, g);
        cellArrows.push(al);
      }
      // Vertical link down
      if (r < 2) {
        const ad = S.line({ x1: cxPos + cellSize / 2, y1: cyPos + cellSize, x2: cxPos + cellSize / 2, y2: cyPos + cellSize + cellGap, stroke: S.tone('helps'), sw: 2.5 }, g);
        cellArrows.push(ad);
      }
    }
  }

  const gridPill = S.pill('weights stationary: zero register file trips', {
    x: gridX + gridW / 2, y: gridY + gridH - 32, h: 40, tone: 'helps', size: 20, weight: 700
  }, g);

  // Right Panel: Step-by-Step Rhythm & Arithmetic Ledger
  const mathW = 660;
  const mathH = 430;
  const mathX = cx + 20;
  const mathY = cy - 205;

  const mathCard = S.rect({ x: mathX, y: mathY, w: mathW, h: mathH, r: 12, fill: '#141d2c', stroke: S.tone('struct'), sw: 1.5 }, g);
  const mathTitle = S.text('rhythmic execution · 27 multiply-adds in 7 beats', {
    x: mathX + mathW / 2, y: mathY + 34, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);
  const mathSub = S.text('total beats formula: 3n − 2 beats for an n × n matrix', {
    x: mathX + mathW / 2, y: mathY + 62, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  const steps = [
    {
      beat: 'beats 1 to 3 · slanted wavefront enters',
      desc: 'rows of a enter skewed: a₁₁ first, then a₁₂ & a₂₁'
    },
    {
      beat: 'beats 4 to 5 · peak array occupancy',
      desc: 'every cell active: passing sums down, a right'
    },
    {
      beat: 'beats 6 to 7 · results emerge below',
      desc: 'finished dot products of c emerge from bottom'
    },
    {
      beat: 'google tpu v4/v5 · 128×128 production grid',
      desc: '16,384 multiply-accumulates every clock beat'
    }
  ];

  const sElements = [];
  steps.forEach((s, idx) => {
    const sy = mathY + 95 + idx * 72;
    const sb = S.rect({ x: mathX + 25, y: sy, w: mathW - 50, h: 68, r: 8, fill: '#1a263a', stroke: '#324a70', sw: 1 }, g);
    const bt1 = S.text(s.beat, { x: mathX + 42, y: sy + 24, size: 20, weight: 700, color: idx === 3 ? 'helps' : 'compute' }, g);
    const bt2 = S.text(s.desc, { x: mathX + 42, y: sy + 48, size: 20, weight: 600, color: 'ink' }, g);
    sElements.push({ sb, bt1, bt2 });
  });

  const mathPill = S.pill('27 multiply-adds finish in 7 beats', {
    x: mathX + mathW / 2, y: mathY + mathH - 32, h: 40, tone: 'struct', size: 20, weight: 700
  }, g);

  const footer = S.pill('systolic grids compute matrix products rhythmically in 3n minus 2 beats', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g, bg, title,
    gridCard, gridTitle, gridSub, cells, cellArrows, gridPill,
    mathCard, mathTitle, mathSub, sElements, mathPill, footer
  };
}

/**
 * Atlas Figs 121, 122: Hardware Specs vs Software Ecosystem Moat
 */
function ch21SoftwareMoat(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1460;
  const h = opts.h ?? 620;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('the constraint that is not hardware · what a software ecosystem is', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Left Panel: Hardware Spec Paradox (Atlas Fig 121: MI300X vs H100)
  const specW = 660;
  const specH = 430;
  const specX = cx - specW - 20;
  const specY = cy - 205;

  const specCard = S.rect({ x: specX, y: specY, w: specW, h: specH, r: 12, fill: '#171a28', stroke: S.tone('compute'), sw: 1.5 }, g);
  const specTitle = S.text('on paper · amd mi300x beats h100', {
    x: specX + specW / 2, y: specY + 34, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const specSub = S.text('more hbm capacity and higher bandwidth on the spec sheet', {
    x: specX + specW / 2, y: specY + 62, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Spec comparison bars
  const bW = 580;
  const bStartY = specY + 95;

  // HBM Capacity: MI300X (192 GB) vs H100 (80 GB)
  const c1 = S.rect({ x: specX + 40, y: bStartY, w: bW, h: 68, r: 8, fill: '#1c2236', stroke: '#323d60', sw: 1 }, g);
  const c1Lbl = S.text('hbm capacity: 192 gb (amd) vs 80 gb (h100)', { x: specX + 58, y: bStartY + 28, size: 20, weight: 700, color: 'ink' }, g);
  const c1BarA = S.rect({ x: specX + 58, y: bStartY + 38, w: 460, h: 18, r: 4, fill: S.tone('compute', 0.5), stroke: S.tone('compute'), sw: 1 }, g);
  const c1BarH = S.rect({ x: specX + 58, y: bStartY + 38, w: 192, h: 18, r: 4, fill: S.tone('neutral', 0.6), stroke: '#fff', sw: 1 }, g);

  // Memory Bandwidth: MI300X (5.3 TB/s) vs H100 (3.35 TB/s)
  const b2Y = bStartY + 82;
  const c2 = S.rect({ x: specX + 40, y: b2Y, w: bW, h: 68, r: 8, fill: '#1c2236', stroke: '#323d60', sw: 1 }, g);
  const c2Lbl = S.text('memory bandwidth: 5.3 tb/s (amd) vs 3.35 tb/s (h100)', { x: specX + 58, y: b2Y + 28, size: 20, weight: 700, color: 'ink' }, g);
  const c2BarA = S.rect({ x: specX + 58, y: b2Y + 38, w: 460, h: 18, r: 4, fill: S.tone('compute', 0.5), stroke: S.tone('compute'), sw: 1 }, g);
  const c2BarH = S.rect({ x: specX + 58, y: b2Y + 38, w: 290, h: 18, r: 4, fill: S.tone('neutral', 0.6), stroke: '#fff', sw: 1 }, g);

  // Conclusion box
  const c3Y = b2Y + 82;
  const c3 = S.rect({ x: specX + 40, y: c3Y, w: bW, h: 68, r: 8, fill: '#241a24', stroke: S.tone('bytes'), sw: 1 }, g);
  const c3T1 = S.text('teams still choose nvidia hardware', { x: specX + 58, y: c3Y + 28, size: 20, weight: 700, color: 'bytes' }, g);
  const c3T2 = S.text('two decades of software maturity decide', { x: specX + 58, y: c3Y + 52, size: 20, weight: 600, color: 'ink' }, g);

  const specPill = S.pill('raw hardware specifications favor the competition', {
    x: specX + specW / 2, y: specY + specH - 32, h: 40, tone: 'compute', size: 20, weight: 700
  }, g);

  // Right Panel: The 4-Layer Software Stack (Atlas Fig 122)
  const stackW = 660;
  const stackH = 430;
  const stackX = cx + 20;
  const stackY = cy - 205;

  const stackCard = S.rect({ x: stackX, y: stackY, w: stackW, h: stackH, r: 12, fill: '#141d2c', stroke: S.tone('struct'), sw: 1.5 }, g);
  const stackTitle = S.text('the 4-layer software stack hierarchy', {
    x: stackX + stackW / 2, y: stackY + 34, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);
  const stackSub = S.text('almost nobody writes instructions for the silicon directly', {
    x: stackX + stackW / 2, y: stackY + 62, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  const layers = [
    { lvl: '1. high-level model', desc: 'pytorch, jax, vllm, tensorrt-llm' },
    { lvl: '2. math libraries (the moat!)', desc: 'cublas, cudnn, flashattention (20 yrs tuned)' },
    { lvl: '3. compiler and runtime driver', desc: 'nvcc, ptx assembler, cuda runtime' },
    { lvl: '4. bare silicon die', desc: '132 multiprocessors, 528 tensor cores' }
  ];

  const layerEls = [];
  layers.forEach((l, idx) => {
    const ly = stackY + 95 + idx * 66;
    const isMoat = idx === 1;
    const lb = S.rect({
      x: stackX + 40, y: ly, w: stackW - 80, h: 62, r: 8,
      fill: isMoat ? '#2a1a28' : '#182438',
      stroke: isMoat ? S.tone('bytes') : '#2f4569',
      sw: isMoat ? 1.8 : 1
    }, g);
    const lt1 = S.text(l.lvl, { x: stackX + 58, y: ly + 24, size: 20, weight: 700, color: isMoat ? 'bytes' : 'struct' }, g);
    const lt2 = S.text(l.desc, { x: stackX + 58, y: ly + 46, size: 20, weight: 600, color: 'ink' }, g);
    layerEls.push({ lb, lt1, lt2 });
  });

  const stackPill = S.pill('two decades of hand-tuned library routines create the moat', {
    x: stackX + stackW / 2, y: stackY + stackH - 32, h: 40, tone: 'struct', size: 20, weight: 700
  }, g);

  const footer = S.pill('software ecosystem maturity frequently outweighs raw silicon specifications', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return {
    group: g, bg, title,
    specCard, specTitle, specSub, c1, c1Lbl, c1BarA, c1BarH, c2, c2Lbl, c2BarA, c2BarH, c3, c3T1, c3T2, specPill,
    stackCard, stackTitle, stackSub, layerEls, stackPill, footer
  };
}

/**
 * Atlas Fig 123: The Three Questions Answered (Grand Synthesis of the Film)
 */
function ch21ThreeAnswers(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1460;
  const h = opts.h ?? 620;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('the three founding questions answered · grand architectural synthesis', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const colW = 430;
  const colGap = 25;
  const startX = cx - (3 * colW + 2 * colGap) / 2;
  const colY = cy - 205;
  const colH = 430;

  const answers = [
    {
      q: '1. why so different from cpu?',
      sub: 'one bet · identical operations',
      pts: [
        'thousands of parallel math lanes',
        '16,896 cores & 528 tensor cores',
        'waiting is cheap: 64 warps per sm',
        'instant thread context switching'
      ],
      pill: 'lanes, not clever speculation',
      tone: 'compute'
    },
    {
      q: '2. why is a byte so expensive?',
      sub: 'physics and geometry',
      pts: [
        'dram cell: capacitor behind wires',
        'charge leaks away every 64 ms',
        '295 ops per byte arithmetic ridge',
        'memory bandwidth is the wall'
      ],
      pill: '295 operations per byte arrived',
      tone: 'bytes'
    },
    {
      q: '3. what can hardware do?',
      sub: 'architectural defences',
      pts: [
        'latency hiding across 64 warps',
        '32-byte sector memory coalescing',
        'tensor core 2d tile reuse',
        'fp8 precision & nvlink racks'
      ],
      pill: 'hide, coalesce, reuse, scale',
      tone: 'helps'
    }
  ];

  const colEls = [];
  answers.forEach((ans, idx) => {
    const lx = startX + idx * (colW + colGap);
    const bc = S.rect({ x: lx, y: colY, w: colW, h: colH, r: 12, fill: '#141d2d', stroke: S.tone(ans.tone), sw: 1.5 }, g);
    const qn = S.text(ans.q, { x: lx + colW / 2, y: colY + 34, size: 22, anchor: 'middle', weight: 700, color: ans.tone }, g);
    const sb = S.text(ans.sub, { x: lx + colW / 2, y: colY + 64, size: 20, anchor: 'middle', weight: 600, color: 'ink' }, g);

    const ptEls = [];
    ans.pts.forEach((pt, pIdx) => {
      const py = colY + 110 + pIdx * 56;
      const ptBox = S.rect({ x: lx + 20, y: py, w: colW - 40, h: 44, r: 6, fill: '#19253a', stroke: '#2e4165', sw: 1 }, g);
      const ptText = S.text(`• ${pt}`, { x: lx + 32, y: py + 28, size: 20, weight: 600, color: 'ink' }, g);
      ptEls.push({ ptBox, ptText });
    });

    const cp = S.pill(ans.pill, { x: lx + colW / 2, y: colY + colH - 32, h: 40, tone: ans.tone, size: 20, weight: 700 }, g);

    colEls.push({ bc, qn, sb, ptEls, cp });
  });

  const footer = S.pill('next film: inside gpu kernels · how software commands silicon', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'struct', size: 20, weight: 700
  }, g);

  return { group: g, bg, title, colEls, footer };
}
