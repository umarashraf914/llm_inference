/* ch04_s01 · anticipation against throughput (figs 15, 16, 17)
   Movement 1 (b1): CPU core silicon schematic: instruction uncertainty banner.
   Movement 2 (b2): Area breakdown: branch predictor, out-of-order buffer, prefetcher vs 15% ALUs.
   Movement 3 (b3): Branch speculation animation: guessing right saves time; guessing wrong flushes pipeline.
   Movement 4 (b4): Regular loops (matrix multiply): anticipation becomes dead silicon weight. */

V.scene('ch04_s01', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('Anticipation against throughput', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Left: CPU Core schematic
  const cpuCX = 560;
  const cpu = ch04CpuCore(S, { cx: cpuCX, cy: GY + 10, w: 560, h: 500 });

  // Right: Speculative Execution & Branching Pipeline Card
  const specCX = 1320;
  const specW = 600, specH = 500;
  const specCard = S.card({
    x: specCX - specW / 2, y: GY + 10 - specH / 2, w: specW, h: specH,
    tone: 'struct', title: ''
  });
  const specTitle = S.text('SPECULATIVE EXECUTION PIPELINE', {
    x: specCX, y: GY + 10 - specH / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'struct'
  });

  // Branch Decision Node
  const ifPill = S.pill('if (condition)', {
    x: specCX, y: GY - 120, h: 44, tone: 'struct', size: 22, weight: 700
  });

  // Speculative branch A (Guess Right: Green/Helps)
  const branchAY = GY - 20;
  const pathACard = S.card({
    x: specCX - 260, y: branchAY - 40, w: 240, h: 80,
    tone: 'helps', title: ''
  });
  const pathATitle = S.text('GUESS RIGHT (85%)', { x: specCX - 140, y: branchAY - 10, size: 22, anchor: 'middle', color: 'helps', weight: 700 });
  const pathASub = S.text('Results committed immediately', { x: specCX - 140, y: branchAY + 18, size: 20, anchor: 'middle', color: 'ink' });
  pathASub.setAttribute('data-audit', 'ignore');

  // Speculative branch B (Guess Wrong: Coral/Bytes)
  const pathBCard = S.card({
    x: specCX + 20, y: branchAY - 40, w: 240, h: 80,
    tone: 'bytes', title: ''
  });
  const pathBTitle = S.text('GUESS WRONG (15%)', { x: specCX + 140, y: branchAY - 10, size: 22, anchor: 'middle', color: 'bytes', weight: 700 });
  const pathBSub = S.text('Pipeline flushed · Work discarded', { x: specCX + 140, y: branchAY + 18, size: 20, anchor: 'middle', color: 'ink' });
  pathBSub.setAttribute('data-audit', 'ignore');

  // Connecting branch lines
  const lineA = S.line({ x1: specCX - 40, y1: GY - 95, x2: specCX - 140, y2: branchAY - 40, stroke: S.tone('helps'), sw: 2.5 });
  const lineB = S.line({ x1: specCX + 40, y1: GY - 95, x2: specCX + 140, y2: branchAY - 40, stroke: S.tone('bytes'), sw: 2.5 });
  lineA.setAttribute('data-audit', 'ignore');
  lineB.setAttribute('data-audit', 'ignore');

  // b4: Regular Loop Matrix Multiply Card (replaces or overlays bottom of right card)
  const loopCard = S.card({
    x: specCX - specW / 2 + 20, y: GY + 75, w: specW - 40, h: 140,
    tone: 'compute', title: ''
  });
  const loopTitle = S.text('MATRIX MULTIPLY: 100% PREDICTABLE', {
    x: specCX, y: GY + 112, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  });
  const loopCode = S.text('C[i][j] += A[i][k] * B[k][j];', {
    x: specCX, y: GY + 148, size: 22, anchor: 'middle', family: 'mono', color: 'ink', weight: 600
  });
  const loopNote = S.text('Predictor is 100% idle · Hardware is pure overhead', {
    x: specCX, y: GY + 184, size: 22, anchor: 'middle', color: 'muted', weight: 500
  });

  // Initial visibility
  S.set([
    cpu.card, cpu.title,
    ...cpu.blocks.map(b => b.box),
    ...cpu.blocks.map(b => b.lbl),
    ...cpu.blocks.map(b => b.sub).filter(Boolean)
  ], { autoAlpha: 0 });
  S.set([specCard, specTitle, ifPill, lineA, lineB, pathACard, pathATitle, pathASub, pathBCard, pathBTitle, pathBSub], { autoAlpha: 0 });
  S.set([loopCard, loopTitle, loopCode, loopNote], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: CPU Card arrives
  S.add(fx.in([cpu.card, cpu.title], { from: 'scale', d: 0.5 }), 'b1~core-0.2');

  // ---------------------------------------------------------------- b2: Silicon budget breakdown
  S.add(fx.in(cpu.blocks.slice(0, 3).flatMap(b => [b.box, b.lbl, b.sub].filter(Boolean)), { from: 'left', stagger: 0.1, d: 0.5 }), 'b2~anticipation-0.2');
  S.add(fx.in([cpu.mathBox, cpu.mathLbl], { from: 'up', d: 0.5 }), 'b2~silicon');
  S.add(fx.pulse([cpu.mathBox, cpu.mathLbl], { scale: 1.05, d: 0.4 }), 'b2~prefetching');

  // ---------------------------------------------------------------- b3: Speculative Execution
  S.add(fx.in([specCard, specTitle, ifPill, lineA, lineB, pathACard, pathATitle, pathASub, pathBCard, pathBTitle, pathBSub], { from: 'scale', d: 0.5 }), 'b3~branch-0.2');
  S.add(fx.pulse([pathBCard, pathBTitle], { scale: 1.08, d: 0.5 }), 'b3~wrong');

  // ---------------------------------------------------------------- b4: Matrix multiply regular loop
  S.add(fx.in([loopCard, loopTitle, loopCode, loopNote], { from: 'up', d: 0.5 }), 'b4~matrix-0.2');
  S.add(fx.pulse([loopCard, loopTitle], { scale: 1.05, d: 0.5 }), 'b4~overhead');

  // Concluding Takeaway pill
  const takeaway = S.pill('CPU spends area anticipating unpredictable turns: overhead on matrix multiply', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
