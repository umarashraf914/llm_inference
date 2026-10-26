/* ch04_s04 · why slow threads win, and where the bet fails (figs 21, 22)
   Movement 1 (b1): Parallel victory: 100,000 slow lanes crush 4 fast cores on 1B independent numbers.
   Movement 2 (b2): The bet's failure mode: strict serial dependency chains idle 99.9% of lanes.
   Movement 3 (b3): Single lane speed comparison: CPU core runs 5–10× faster than a single GPU lane.
   Movement 4 (b4): LLM reality: sequential across tokens, but massively parallel inside each token. */

V.scene('ch04_s04', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('Why slow threads win, and where the bet fails', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Top Section: Parallel speedup vs Handful of fast cores
  const topCard = S.card({
    x: GX - 630, y: 175, w: 1260, h: 215,
    tone: 'compute', title: ''
  });
  const topTitle = S.text('INDEPENDENT WORKLOAD (1 BILLION NUMBERS) · PARALLEL LANES CRUSH FAST CORES', {
    x: GX - 590, y: 212, size: 22, weight: 700, color: 'compute'
  });

  // CPU 4 cores row
  const cpuRowY = 270;
  const cpuBar = S.rect({ x: GX - 590, y: cpuRowY - 20, w: 1180, h: 38, r: 6, fill: '#1d2a45', stroke: S.tone('struct'), sw: 1.5 });
  const cpuLbl = S.text('CPU: 4–16 Fast Cores', { x: GX - 565, y: cpuRowY + 5, size: 22, color: 'struct', weight: 700 });
  const cpuTime = S.text('~1,200 ms (serial queue)', { x: GX + 100, y: cpuRowY + 5, size: 22, color: 'muted', weight: 600 });
  const cpuPill = S.pill('1× Baseline', { x: GX + 470, y: cpuRowY - 2, h: 36, tone: 'struct', size: 22, weight: 700 });

  // GPU 100k lanes row
  const gpuRowY = 335;
  const gpuBar = S.rect({ x: GX - 590, y: gpuRowY - 20, w: 1180, h: 38, r: 6, fill: S.tone('compute'), stroke: S.tone('compute'), sw: 1 });
  const gpuLbl = S.text('GPU: 100,000+ Slow Lanes', { x: GX - 565, y: gpuRowY + 5, size: 22, color: '#0a0f1e', weight: 700 });
  const gpuTime = S.text('~1.5 ms (all lanes active)', { x: GX + 100, y: gpuRowY + 5, size: 22, color: '#0a0f1e', weight: 700 });
  const gpuPill = S.pill('800× FASTER', { x: GX + 470, y: gpuRowY - 2, h: 36, tone: 'compute', size: 22, weight: 700 });

  // Middle Section: Where the bet loses (Serial dependency chain)
  const midCard = S.card({
    x: GX - 630, y: 415, w: 1260, h: 200,
    tone: 'bytes', title: ''
  });
  const midTitle = S.text('WHERE THE BET LOSES: STRICT SERIAL DEPENDENCY CHAINS', {
    x: GX - 590, y: 452, size: 22, weight: 700, color: 'bytes'
  });

  // Serial chain diagram: Step 1 -> Step 2 -> Step 3
  const chainY = 530;
  const s1 = S.pill('Step 1 (active)', { x: GX - 420, y: chainY, h: 42, tone: 'bytes', size: 22, weight: 700 });
  const a1 = S.line({ x1: GX - 310, y1: chainY, x2: GX - 230, y2: chainY, stroke: S.tone('bytes'), sw: 3, arrow: true });
  a1.setAttribute('data-audit', 'ignore');

  const s2 = S.pill('Step 2 (waiting)', { x: GX - 120, y: chainY, h: 42, tone: 'neutral', size: 22, weight: 700 });
  const a2 = S.line({ x1: GX - 10, y1: chainY, x2: GX + 70, y2: chainY, stroke: '#405275', sw: 3, arrow: true });
  a2.setAttribute('data-audit', 'ignore');

  const s3 = S.pill('Step 3 (waiting)', { x: GX + 170, y: chainY, h: 42, tone: 'neutral', size: 22, weight: 700 });
  const idleBadge = S.pill('99,999 LANES FORCED IDLE', { x: GX + 460, y: chainY, h: 42, tone: 'bytes', size: 22, weight: 700 });

  // Bottom Section: Token Generation Synthesis
  const botCard = S.card({
    x: GX - 630, y: 640, w: 1260, h: 205,
    tone: 'helps', title: ''
  });
  const botTitle = S.text('LLM INFERENCE REALITY · SERIAL OUTSIDE, MASSIVELY PARALLEL INSIDE', {
    x: GX - 590, y: 678, size: 22, weight: 700, color: 'helps'
  });

  const bTok1 = S.pill('Token N', { x: GX - 400, y: 755, h: 42, tone: 'struct', size: 22, weight: 700 });
  const tokArrow = S.line({ x1: GX - 300, y1: 755, x2: GX - 210, y2: 755, stroke: S.tone('helps'), sw: 3, arrow: true });
  tokArrow.setAttribute('data-audit', 'ignore');
  const bTok2 = S.pill('Token N+1', { x: GX - 110, y: 755, h: 42, tone: 'struct', size: 22, weight: 700 });

  const insideBadge = S.pill('INSIDE EACH TOKEN: 16.7M PARALLEL MULTIPLY-ADDS', {
    x: GX + 290, y: 755, h: 44, tone: 'helps', size: 22, weight: 700
  });

  // Initial visibility
  S.set([topCard, topTitle, cpuBar, cpuLbl, cpuTime, cpuPill, gpuBar, gpuLbl, gpuTime, gpuPill], { autoAlpha: 0 });
  S.set([midCard, midTitle, s1, a1, s2, a2, s3, idleBadge], { autoAlpha: 0 });
  S.set([botCard, botTitle, bTok1, tokArrow, bTok2, insideBadge], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Parallel victory
  S.add(fx.in(topCard, { from: 'scale', d: 0.5 }), 'b1~workload-0.2');
  S.add(fx.in([topTitle, cpuBar, cpuLbl, cpuTime, cpuPill, gpuBar, gpuLbl, gpuTime, gpuPill], { from: 'up', d: 0.5, stagger: 0.05 }), 'b1~workload');
  S.add(fx.pulse([gpuBar, gpuPill], { scale: 1.05, d: 0.5 }), 'b1~thousand');

  // ---------------------------------------------------------------- b2: Serial chain failure
  S.add(fx.in([midCard, midTitle, s1, a1, s2, a2, s3, idleBadge], { from: 'up', d: 0.5 }), 'b2~lose-0.2');
  S.add(fx.pulse(idleBadge, { scale: 1.05, d: 0.5 }), 'b2~chain');

  // ---------------------------------------------------------------- b3: Speed difference
  S.add(fx.pulse(s1, { scale: 1.05, d: 0.4 }), 'b3~lane');

  // ---------------------------------------------------------------- b4: LLM Token synthesis
  S.add(fx.in([botCard, botTitle, bTok1, tokArrow, bTok2, insideBadge], { from: 'up', d: 0.5 }), 'b4~tokens-0.2');
  S.add(fx.pulse(insideBadge, { scale: 1.05, d: 0.5 }), 'b4~matrix');

  // Concluding Takeaway pill
  const takeaway = S.pill('the workload has vast parallelism: the challenge is keeping the lanes fed', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
