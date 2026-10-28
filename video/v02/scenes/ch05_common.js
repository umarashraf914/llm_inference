/* ch05_common.js · Visual components for Chapter 05 ("The arithmetic units")
   Figs 23–25: Scalar CUDA cores vs Matrix Tensor Cores,
   peak throughput comparison chart (66.9 vs 133.8 vs 989.4 TFLOP/s),
   and the 4-factor arithmetic derivation + single-tick scale comparison. */

/**
 * Fig 23: The Multiprocessor Arithmetic Floor
 * Shows 128 scalar CUDA cores (4 partitions of 32) on the left
 * and 4 large Tensor Cores on the right, with feeder conduits.
 */
function ch05ArithmeticFloor(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1420;
  const h = opts.h ?? 540;

  // Outer SM carrier frame
  const frame = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#0a0f1d', stroke: S.tone('compute'), sw: 2
  }, g);

  const title = S.text('inside one multiprocessor · two arithmetic engines (fig 23)', {
    x: cx - w / 2 + 32, y: cy - h / 2 + 38, size: 22, weight: 700, color: 'compute'
  }, g);

  // Divider between Left (CUDA) and Right (Tensor)
  const divX = cx - 40;
  const divider = S.line({
    x1: divX, y1: cy - h / 2 + 60, x2: divX, y2: cy + h / 2 - 30,
    stroke: '#1e293b', sw: 2, strokeDasharray: '6 4'
  }, g);
  divider.setAttribute('data-audit', 'ignore');

  // ================================================================ Left: 128 CUDA Cores
  const leftW = 620;
  const leftX = cx - w / 2 + 30;
  const leftCX = leftX + leftW / 2;

  const cudaHeader = S.text('128 scalar cuda cores (4 partitions of 32)', {
    x: leftCX, y: cy - h / 2 + 75, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);

  // 4 partition containers of 32 cores each (4 sub-cores)
  const partGroup = S.g(null, g);
  const pW = 138, pH = 230, pGap = 16;
  const pStartY = cy - h / 2 + 105;
  const pStartX = leftCX - (4 * pW + 3 * pGap) / 2;

  const cudaBoxes = [];
  for (let p = 0; p < 4; p++) {
    const px = pStartX + p * (pW + pGap);
    const pBox = S.rect({
      x: px, y: pStartY, w: pW, h: pH, r: 8,
      fill: '#15243d', stroke: S.tone('struct'), sw: 1
    }, partGroup);
    pBox.setAttribute('data-audit', 'ignore');

    const pLbl = S.text(`part ${p}`, {
      x: px + pW / 2, y: pStartY + 24, size: 20, anchor: 'middle', color: 'muted'
    }, partGroup);
    pLbl.setAttribute('data-audit', 'ignore');

    // 8 rows × 4 cols = 32 micro-cores inside each partition
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 4; c++) {
        const cx0 = px + 12 + c * 28;
        const cy0 = pStartY + 42 + r * 22;
        const core = S.rect({
          x: cx0, y: cy0, w: 22, h: 16, r: 2,
          fill: '#f59e0b', stroke: '#d97706', sw: 1
        }, partGroup);
        core.setAttribute('data-audit', 'ignore');
        cudaBoxes.push(core);
      }
    }
  }

  // Scalar operation equation box below partitions
  const sEqY = cy + h / 2 - 130;
  const sEqBox = S.rect({
    x: leftX, y: sEqY, w: leftW, h: 80, r: 8,
    fill: '#1e293b', stroke: S.tone('struct'), sw: 1.5
  }, g);
  const sEqTitle = S.text('scalar fused multiply-add: d = (a × b) + c', {
    x: leftCX, y: sEqY + 32, size: 20, anchor: 'middle', family: 'mono', weight: 700, color: 'ink'
  }, g);
  const sEqDesc = S.text('1 single number in, 1 single number out per cycle', {
    x: leftCX, y: sEqY + 58, size: 20, anchor: 'middle', color: 'muted'
  }, g);

  // ================================================================ Right: 4 Tensor Cores
  const rightW = 680;
  const rightX = cx + 20;
  const rightCX = rightX + rightW / 2;

  const tcHeader = S.text('4 matrix tensor cores (1 per partition)', {
    x: rightCX, y: cy - h / 2 + 75, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);

  // 4 large Tensor Core blocks (2 × 2)
  const tcGroup = S.g(null, g);
  const tcSizeW = 310, tcSizeH = 105;
  const tcGapX = 20, tcGapY = 20;
  const tcStartX = rightCX - tcSizeW - tcGapX / 2;
  const tcStartY = cy - h / 2 + 105;

  const tcBoxes = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const bx = tcStartX + c * (tcSizeW + tcGapX);
      const by = tcStartY + r * (tcSizeH + tcGapY);
      const idx = r * 2 + c;

      const tcBox = S.rect({
        x: bx, y: by, w: tcSizeW, h: tcSizeH, r: 10,
        fill: '#2b1c0a', stroke: S.tone('compute'), sw: 2
      }, tcGroup);

      const tcTitle = S.text(`tensor core ${idx}`, {
        x: bx + tcSizeW / 2, y: by + 36, size: 22, anchor: 'middle', weight: 700, color: 'compute'
      }, tcGroup);
      const tcSub = S.text('512 fmas (1,024 ops) / tick', {
        x: bx + tcSizeW / 2, y: by + 70, size: 20, anchor: 'middle', color: 'ink'
      }, tcGroup);

      tcBoxes.push(tcBox, tcTitle, tcSub);
    }
  }

  // Matrix Tile operation equation box below Tensor Cores
  const mEqBox = S.rect({
    x: rightX, y: sEqY, w: rightW, h: 80, r: 8,
    fill: '#1e293b', stroke: S.tone('compute'), sw: 1.5
  }, g);
  const mEqTitle = S.text('matrix tile mma: D = (A × B) + C', {
    x: rightCX, y: sEqY + 32, size: 20, anchor: 'middle', family: 'mono', weight: 700, color: 'compute'
  }, g);
  const mEqDesc = S.text('consumes whole 16×16 matrix tiles at once', {
    x: rightCX, y: sEqY + 58, size: 20, anchor: 'middle', color: 'ink'
  }, g);

  // Feeder channels & conduits around units
  const feederText = S.text('all remaining silicon (registers, schedulers, shared memory) exists solely to feed these units', {
    x: cx, y: cy + h / 2 - 20, size: 20, anchor: 'middle', color: 'muted'
  }, g);

  return {
    group: g, frame, title, divider,
    cudaHeader, partGroup, cudaBoxes, sEqBox, sEqTitle, sEqDesc,
    tcHeader, tcGroup, tcBoxes, mEqBox, mEqTitle, mEqDesc, feederText
  };
}

/**
 * Fig 24: Peak Throughput Chart Across All 132 SMs
 * Proportional horizontal bar chart comparing:
 * - 32-bit CUDA (66.9 TFLOP/s)
 * - 16-bit CUDA paired (133.8 TFLOP/s)
 * - 16-bit Tensor Cores (989.4 TFLOP/s, 7.4× ahead)
 */
function ch05ThroughputChart(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1420;
  const h = opts.h ?? 500;

  // Background frame
  const bgCard = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#0a0f1d', stroke: S.tone('compute'), sw: 1.5
  }, g);

  const title = S.text('peak operations per second across all 132 multiprocessors (fig 24)', {
    x: cx - w / 2 + 32, y: cy - h / 2 + 40, size: 22, weight: 700, color: 'compute'
  }, g);

  // Linear scale mapping: 0 -> 1050 TFLOP/s
  const barAreaX0 = cx - w / 2 + 380;
  const barAreaW = w - 500;
  const maxVal = 1050;

  function X(tflops) {
    return barAreaX0 + (tflops / maxVal) * barAreaW;
  }

  // Reference grid ticks (0, 250, 500, 750, 1000 TFLOP/s)
  const gridLines = [];
  const refVals = [0, 250, 500, 750, 1000];
  const gridY0 = cy - h / 2 + 80;
  const gridY1 = cy + h / 2 - 60;

  for (const v of refVals) {
    const gx = X(v);
    const line = S.line({
      x1: gx, y1: gridY0, x2: gx, y2: gridY1,
      stroke: '#1e2b45', sw: 1.5, strokeDasharray: '4 4'
    }, g);
    line.setAttribute('data-audit', 'ignore');
    gridLines.push(line);

    const lbl = S.text(`${v} TFLOP/s`, {
      x: gx, y: gridY1 + 24, size: 20, anchor: 'middle', color: 'muted'
    }, g);
    lbl.setAttribute('data-audit', 'ignore');
    gridLines.push(lbl);
  }

  // 3 Bar Rows
  const rows = [
    { label: 'cuda cores, 32-bit', val: 66.9, text: '66.9 trillion ops / s', tone: 'struct' },
    { label: 'cuda cores, 16-bit paired', val: 133.8, text: '133.8 trillion ops / s', tone: 'neutral' },
    { label: 'tensor cores, 16-bit', val: 989.4, text: '989.4 trillion ops / s (7.4× ahead)', tone: 'compute' }
  ];

  const bars = [];
  const rowY0 = cy - h / 2 + 110;
  const rowH = 100;

  rows.forEach((r, idx) => {
    const rowG = S.g(null, g);
    const ry = rowY0 + idx * rowH;
    const barW = Math.max(24, X(r.val) - barAreaX0);
    const isGold = r.tone === 'compute';

    const lbl = S.text(r.label, {
      x: barAreaX0 - 24, y: ry + 26, size: 22, anchor: 'end',
      color: isGold ? 'compute' : 'ink', weight: 700
    }, rowG);

    const bar = S.rect({
      x: barAreaX0, y: ry, w: barW, h: 48, r: 8,
      fill: isGold ? '#f59e0b' : '#1e293b',
      stroke: isGold ? '#ffffff' : '#475569', sw: isGold ? 2 : 1
    }, rowG);

    const isInside = barW > 400;
    const valLbl = S.text(r.text, {
      x: isInside ? barAreaX0 + barW - 24 : barAreaX0 + barW + 20,
      y: ry + 27, size: 22, anchor: isInside ? 'end' : 'start',
      color: isInside ? '#0a0f1e' : (isGold ? 'compute' : 'ink'),
      weight: 700
    }, rowG);

    bars.push({ group: rowG, bar, lbl, valLbl, val: r.val });
  });

  // Callout banner at bottom
  const callout = S.text('code that ignores tensor cores leaves over 85% of the chip arithmetic capacity idle', {
    x: cx, y: cy + h / 2 - 20, size: 20, anchor: 'middle', color: 'compute'
  }, g);

  return { group: g, bgCard, title, gridLines, bars, callout };
}

/**
 * Fig 25: Arithmetic Derivation & One Multiprocessor One Tick
 * Combines:
 * - Top: Step-by-step derivation: SMs × cores × ops/tick × clock = 989.4 TFLOP/s
 * - Bottom: "One multiprocessor, one tick, drawn to scale": 4,096 ops (TC) vs 256 ops (CUDA)
 */
function ch05DerivationLayout(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1420;
  const h = opts.h ?? 540;

  // Background frame
  const frame = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 16,
    fill: '#0a0f1d', stroke: S.tone('compute'), sw: 1.5
  }, g);

  const title = S.text('deriving 989 trillion: units × work per tick × ticks (fig 25)', {
    x: cx - w / 2 + 32, y: cy - h / 2 + 38, size: 22, weight: 700, color: 'compute'
  }, g);

  // ================================================================ TOP: 3 Derivation Factors
  const topY0 = cy - h / 2 + 65;
  const stepW = 1356, stepH = 56, stepGap = 14;

  const steps = [
    {
      factor: '132 multiprocessors × 4 tensor cores',
      result: '= 528 tensor cores chip-wide',
      tone: 'struct'
    },
    {
      factor: '× 1,024 operations per tick each (512 fmas × 2)',
      result: '= 540,672 operations per tick',
      tone: 'compute'
    },
    {
      factor: '× 1.830 billion ticks a second',
      result: '= 989.4 trillion operations a second',
      tone: 'compute'
    }
  ];

  const stepEls = [];
  steps.forEach((s, i) => {
    const sy = topY0 + i * (stepH + stepGap);
    const isGold = s.tone === 'compute' && i === 2;

    const box = S.rect({
      x: cx - stepW / 2, y: sy, w: stepW, h: stepH, r: 8,
      fill: isGold ? '#2b1c0a' : '#15243d',
      stroke: isGold ? S.tone('compute') : '#334155', sw: isGold ? 2 : 1
    }, g);

    const fText = S.text(s.factor, {
      x: cx - stepW / 2 + 24, y: sy + 36, size: 22, weight: 600, color: 'ink'
    }, g);

    const rText = S.text(s.result, {
      x: cx + stepW / 2 - 24, y: sy + 36, size: 22, anchor: 'end', weight: 700,
      color: isGold ? 'compute' : 'struct'
    }, g);

    stepEls.push({ box, fText, rText });
  });

  // ================================================================ BOTTOM: One Multiprocessor One Tick (drawn to scale)
  const botY = topY0 + 3 * (stepH + stepGap) + 16;
  const botTitle = S.text('one multiprocessor, one tick, drawn to scale', {
    x: cx - w / 2 + 32, y: botY + 24, size: 22, weight: 700, color: 'ink'
  }, g);

  const barStartX = cx - w / 2 + 280;
  const barMaxW = w - 460;

  // Tensor Core Bar: 4,096 ops
  const tcBarY = botY + 45;
  const tcBar = S.rect({
    x: barStartX, y: tcBarY, w: barMaxW, h: 42, r: 6,
    fill: '#f59e0b', stroke: '#ffffff', sw: 1.5
  }, g);
  const tcLbl = S.text('4 tensor cores', {
    x: barStartX - 20, y: tcBarY + 26, size: 22, anchor: 'end', weight: 700, color: 'compute'
  }, g);
  const tcVal = S.text('4,096 operations', {
    x: barStartX + barMaxW - 20, y: tcBarY + 26, size: 22, anchor: 'end', weight: 700, color: '#0a0f1e'
  }, g);

  // CUDA Core Bar: 256 ops (1/16th width!)
  const cudaBarY = tcBarY + 60;
  const cudaW = barMaxW * (256 / 4096); // ~60 px
  const cudaBar = S.rect({
    x: barStartX, y: cudaBarY, w: cudaW, h: 42, r: 6,
    fill: '#1e293b', stroke: S.tone('struct'), sw: 1.5
  }, g);
  const cudaLbl = S.text('128 cuda cores', {
    x: barStartX - 20, y: cudaBarY + 26, size: 22, anchor: 'end', weight: 700, color: 'struct'
  }, g);
  const cudaVal = S.text('256 operations (32-bit) · 1/16th of tensor cores', {
    x: barStartX + cudaW + 20, y: cudaBarY + 26, size: 20, weight: 600, color: 'muted'
  }, g);

  return {
    group: g, frame, title,
    stepEls,
    botTitle, tcBar, tcLbl, tcVal, cudaBar, cudaLbl, cudaVal
  };
}
