/* ch04_common.js · Shared visual components for Chapter 4 ("Two design philosophies") */

/**
 * Creates a schematic of a CPU core showing silicon area spent on anticipation
 */
function ch04CpuCore(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 580;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 540;
  const h = opts.h ?? 500;

  // Outer container card
  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'struct', title: ''
  }, g);

  const title = S.text('CPU CORE · SILICON BUDGET', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'struct'
  }, g);

  // Block 1: Branch Prediction & Speculation (large area: ~35%)
  const b1Y = cy - h / 2 + 65;
  const b1H = 110;
  const b1Box = S.rect({
    x: cx - w / 2 + 25, y: b1Y, w: w - 50, h: b1H, r: 8,
    fill: '#15243d', stroke: S.tone('struct'), sw: 1.5
  }, g);
  const b1Lbl = S.text('Branch Predictor & Speculation', {
    x: cx, y: b1Y + 45, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);
  const b1Sub = S.text('Guesses path ahead to keep single thread fed', {
    x: cx, y: b1Y + 80, size: 20, anchor: 'middle', color: 'muted'
  }, g);
  b1Sub.setAttribute('data-audit', 'ignore');

  // Block 2: Out-of-Order Engine & Reorder Buffers (~30%)
  const b2Y = b1Y + b1H + 16;
  const b2H = 100;
  const b2Box = S.rect({
    x: cx - w / 2 + 25, y: b2Y, w: w - 50, h: b2H, r: 8,
    fill: '#15243d', stroke: S.tone('struct'), sw: 1.5
  }, g);
  const b2Lbl = S.text('Out-of-Order Reorder Buffer', {
    x: cx, y: b2Y + 42, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);
  const b2Sub = S.text('Reorders instructions around memory delays', {
    x: cx, y: b2Y + 74, size: 20, anchor: 'middle', color: 'muted'
  }, g);
  b2Sub.setAttribute('data-audit', 'ignore');

  // Block 3: Hardware Prefetchers & Large Caches (~20%)
  const b3Y = b2Y + b2H + 16;
  const b3H = 80;
  const b3Box = S.rect({
    x: cx - w / 2 + 25, y: b3Y, w: w - 50, h: b3H, r: 8,
    fill: '#15243d', stroke: S.tone('struct'), sw: 1.5
  }, g);
  const b3Lbl = S.text('Hardware Cache Prefetchers', {
    x: cx, y: b3Y + 48, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Block 4: Math ALUs (the actual arithmetic: ~15%!)
  const b4Y = b3Y + b3H + 16;
  const b4H = 65;
  const b4Box = S.rect({
    x: cx - w / 2 + 25, y: b4Y, w: w - 50, h: b4H, r: 8,
    fill: S.tone('compute'), stroke: S.tone('compute'), sw: 1.5
  }, g);
  const b4Lbl = S.text('Arithmetic Units (ALUs)', {
    x: cx, y: b4Y + 40, size: 22, anchor: 'middle', weight: 700, color: '#0a0f1e'
  }, g);

  return {
    group: g, card, title,
    blocks: [
      { box: b1Box, lbl: b1Lbl, sub: b1Sub },
      { box: b2Box, lbl: b2Lbl, sub: b2Sub },
      { box: b3Box, lbl: b3Lbl },
      { box: b4Box, lbl: b4Lbl }
    ],
    mathBox: b4Box, mathLbl: b4Lbl
  };
}

/**
 * Creates a schematic of a GPU Streaming Multiprocessor (SM)
 */
function ch04GpuSM(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 1340;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 540;
  const h = opts.h ?? 500;

  // Outer container card
  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'compute', title: ''
  }, g);

  const title = S.text('GPU MULTIPROCESSOR (SM)', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  // Block 1: Massive Register File (blue: 256 KB)
  const b1Y = cy - h / 2 + 65;
  const b1H = 90;
  const b1Box = S.rect({
    x: cx - w / 2 + 25, y: b1Y, w: w - 50, h: b1H, r: 8,
    fill: '#15243d', stroke: S.tone('struct'), sw: 1.5
  }, g);
  const b1Lbl = S.text('256 KB Fast Register File', {
    x: cx, y: b1Y + 40, size: 24, anchor: 'middle', weight: 700, color: 'struct'
  }, g);
  const b1Sub = S.text('Holds state for 2,048 resident threads in hardware', {
    x: cx, y: b1Y + 70, size: 20, anchor: 'middle', color: 'muted'
  }, g);
  b1Sub.setAttribute('data-audit', 'ignore');

  // Block 2: 4 Warp Schedulers (no speculation, simple round-robin)
  const b2Y = b1Y + b1H + 16;
  const b2H = 75;
  const b2Box = S.rect({
    x: cx - w / 2 + 25, y: b2Y, w: w - 50, h: b2H, r: 8,
    fill: '#15243d', stroke: S.tone('helps'), sw: 1.5
  }, g);
  const b2Lbl = S.text('4 Warp Schedulers (Zero Overhead)', {
    x: cx, y: b2Y + 46, size: 24, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  // Block 3: Dense Arithmetic Lanes (128 CUDA cores + 4 Tensor Cores: >60% area!)
  const b3Y = b2Y + b2H + 16;
  const b3H = 195;
  const b3Box = S.rect({
    x: cx - w / 2 + 25, y: b3Y, w: w - 50, h: b3H, r: 8,
    fill: '#241a0d', stroke: S.tone('compute'), sw: 1.5
  }, g);
  const b3Lbl = S.text('Dense Arithmetic Lanes', {
    x: cx, y: b3Y + 38, size: 24, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  // Grid of amber compute lane icons
  const lanesG = S.g(null, g);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      const lx = cx - 210 + c * 56;
      const ly = b3Y + 65 + r * 38;
      const rct = S.rect({
        x: lx, y: ly, w: 46, h: 28, r: 4,
        fill: S.tone('compute'), stroke: S.tone('compute'), sw: 1
      }, lanesG);
      rct.setAttribute('data-audit', 'ignore');
    }
  }

  return {
    group: g, card, title,
    regBox: b1Box, regLbl: b1Lbl, regSub: b1Sub,
    schedBox: b2Box, schedLbl: b2Lbl,
    mathBox: b3Box, mathLbl: b3Lbl, lanesG
  };
}
