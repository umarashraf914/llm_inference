/* ch04_s04 · why slow threads win, and where the bet fails (figs 21, 22)
   Movement 1 (b1): Fig 21: 100,000 slow lanes in parallel crush 4 fast CPU cores on 1B independent numbers.
   Movement 2 (b2): Fig 22: Serial chain failure mode: step 1 → step 2 → step 3 forces 99,999 lanes idle.
   Movement 3 (b3): Single-lane speed gap: 1 CPU core runs 5–10× faster than a single GPU lane on sequential code.
   Movement 4 (b4): LLM Token synthesis: serial between tokens, but 16.7M parallel multiply-adds inside each token. */

V.scene('ch04_s04', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('why slow threads win, and where the bet fails', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // ================================================================ TOP PANEL: Fig 21 Independent Workload
  const topW = 1420, topH = 300;
  const topY = 180;
  const topBg = S.rect({
    x: GX - topW / 2, y: topY, w: topW, h: topH, r: 16,
    fill: '#0a0f1d', stroke: S.tone('compute'), sw: 1.5
  });

  const topTitle = S.text('fig 21 · independent workload (1 billion numbers) · parallel lanes win', {
    x: GX - topW / 2 + 32, y: topY + 40, size: 22, weight: 700, color: 'compute'
  });

  // CPU Row
  const cpuY = topY + 80;
  const cpuW = 1356, barH = 50;
  const cpuBox = S.rect({
    x: GX - cpuW / 2, y: cpuY, w: cpuW, h: barH, r: 8,
    fill: '#15243d', stroke: S.tone('struct'), sw: 1.5
  });
  const cpuName = S.text('cpu: 4–16 fast cores', {
    x: GX - cpuW / 2 + 24, y: cpuY + barH / 2, size: 22, weight: 700, color: 'struct'
  });
  const cpuDesc = S.text('serial queue · ~1,200 ms total time', {
    x: GX - 40, y: cpuY + barH / 2, size: 22, anchor: 'middle', weight: 600, color: 'muted'
  });
  const cpuBadge = S.pill('1× baseline', {
    x: GX + cpuW / 2 - 120, y: cpuY + barH / 2, h: 42, tone: 'struct', size: 20, weight: 700
  });

  // GPU Row
  const gpuY = topY + 155;
  const gpuBox = S.rect({
    x: GX - cpuW / 2, y: gpuY, w: cpuW, h: barH + 40, r: 8,
    fill: '#2b1c0a', stroke: S.tone('compute'), sw: 2
  });
  const gpuName = S.text('gpu: 100,000+ slow lanes', {
    x: GX - cpuW / 2 + 24, y: gpuY + 30, size: 22, weight: 700, color: 'compute'
  });
  const gpuDesc = S.text('all lanes active · 1.5 ms total', {
    x: GX - 40, y: gpuY + 30, size: 22, anchor: 'middle', weight: 600, color: 'ink'
  });
  const gpuBadge = S.pill('800× faster', {
    x: GX + cpuW / 2 - 120, y: gpuY + 30, h: 42, tone: 'compute', size: 20, weight: 700
  });

  // Dense micro-grid of lanes inside GPU row
  const laneDots = S.g();
  const dStartX = GX - cpuW / 2 + 24;
  const dY = gpuY + 58;
  for (let i = 0; i < 48; i++) {
    const dot = S.rect({
      x: dStartX + i * 27.5, y: dY, w: 20, h: 18, r: 3,
      fill: '#f59e0b', stroke: '#d97706', sw: 1
    }, laneDots);
    dot.setAttribute('data-audit', 'ignore');
  }

  // ================================================================ BOTTOM PANEL: Fig 22 Failure Mode & LLM Reality
  const botW = 1420, botH = 340;
  const botY = 510;
  const botBg = S.rect({
    x: GX - botW / 2, y: botY, w: botW, h: botH, r: 16,
    fill: '#0a0f1d', stroke: S.tone('bytes'), sw: 1.5
  });

  const botTitle = S.text('fig 22 · where the bet loses: serial chains vs llm decode reality', {
    x: GX - botW / 2 + 32, y: botY + 40, size: 22, weight: 700, color: 'bytes'
  });

  // Serial Chain Row: Step 1 -> Step 2 -> Step 3
  const chainY = botY + 85;
  const s1 = S.pill('step 1 (active)', { x: GX - 480, y: chainY, h: 42, tone: 'bytes', size: 20, weight: 700 });
  const a1 = S.line({ x1: GX - 365, y1: chainY, x2: GX - 295, y2: chainY, stroke: S.tone('bytes'), sw: 2.5, arrow: true });
  a1.setAttribute('data-audit', 'ignore');

  const s2 = S.pill('step 2 (waiting)', { x: GX - 180, y: chainY, h: 42, tone: 'neutral', size: 20, weight: 600 });
  const a2 = S.line({ x1: GX - 65, y1: chainY, x2: GX + 5, y2: chainY, stroke: '#475569', sw: 2.5, arrow: true });
  a2.setAttribute('data-audit', 'ignore');

  const s3 = S.pill('step 3 (waiting)', { x: GX + 120, y: chainY, h: 42, tone: 'neutral', size: 20, weight: 600 });

  const idleWarning = S.pill('99,999 lanes forced idle', {
    x: GX + 460, y: chainY, h: 42, tone: 'bytes', size: 20, weight: 700
  });

  // Single Lane Speed difference callout
  const speedBoxY = botY + 155;
  const speedBox = S.rect({
    x: GX - botW / 2 + 24, y: speedBoxY, w: botW - 48, h: 54, r: 8,
    fill: '#15243d', stroke: '#334155', sw: 1
  });
  const speedText = S.text('on strict sequential code, 1 cpu core outruns 1 gpu lane by 5× to 10×', {
    x: GX, y: speedBoxY + 27, size: 22, anchor: 'middle', weight: 600, color: 'struct'
  });

  // LLM Token Generation Synthesis
  const llmY = botY + 245;
  const tok1 = S.pill('token n', { x: GX - 480, y: llmY, h: 42, tone: 'struct', size: 20, weight: 700 });
  const tokArrow = S.line({ x1: GX - 395, y1: llmY, x2: GX - 325, y2: llmY, stroke: S.tone('helps'), sw: 2.5, arrow: true });
  tokArrow.setAttribute('data-audit', 'ignore');

  const tok2 = S.pill('token n+1', { x: GX - 210, y: llmY, h: 42, tone: 'struct', size: 20, weight: 700 });

  const matPill = S.pill('inside each token: 16,777,216 parallel multiply-adds (lanes stay fed!)', {
    x: GX + 260, y: llmY, h: 44, tone: 'helps', size: 20, weight: 700
  });

  // Initial visibility
  S.set([topBg, topTitle, cpuBox, cpuName, cpuDesc, cpuBadge, gpuBox, gpuName, gpuDesc, gpuBadge, laneDots], { autoAlpha: 0 });
  S.set([botBg, botTitle, s1, s2, s3, idleWarning, speedBox, speedText, tok1, tok2, matPill], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Parallel victory
  S.add(fx.in([topBg, topTitle], { from: 'fade', d: 0.5 }), 'b1~workload-0.2');
  S.add(fx.in([cpuBox, cpuName, cpuDesc, cpuBadge], { from: 'fade', d: 0.4 }), 'b1~workload');
  S.add(fx.in([gpuBox, gpuName, gpuDesc, gpuBadge, laneDots], { from: 'fade', d: 0.5 }), 'b1~thousand-0.1');
  S.add(fx.pulse([gpuBox, gpuBadge], { scale: 1.04, d: 0.4 }), 'b1~thousand');

  // ---------------------------------------------------------------- b2: Serial chain failure
  S.add(fx.in([botBg, botTitle, s1, s2, s3, idleWarning], { from: 'fade', d: 0.5 }), 'b2~lose-0.2');
  S.add(fx.pulse(idleWarning, { scale: 1.06, d: 0.5 }), 'b2~chain');

  // ---------------------------------------------------------------- b3: Single lane speed difference
  S.add(fx.in([speedBox, speedText], { from: 'fade', d: 0.4 }), 'b3~lane-0.2');
  S.add(fx.pulse([speedBox, speedText], { scale: 1.03, d: 0.4 }), 'b3~slower');

  // ---------------------------------------------------------------- b4: LLM Token synthesis
  S.add(fx.in([tok1, tok2, matPill], { from: 'fade', d: 0.5 }), 'b4~tokens-0.2');
  S.add(fx.pulse(matPill, { scale: 1.05, d: 0.5 }), 'b4~matrix');

  // Concluding Takeaway band
  const takeaway = S.takeaway('the workload has vast parallelism; the challenge is keeping the lanes fed', {
    tone: 'compute'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
