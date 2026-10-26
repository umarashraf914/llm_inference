/* ch09_s01 · sixty-four warps and the turn counter (figs 44, 45)
   Movement 1 (b1): 64 warps fill 1 SM: 2,048 resident threads.
   Movement 2 (b2): Round-robin scheduling: each thread moves once every 16 ticks (Tick 1, 17, 33).
   Movement 3 (b3): Single-thread speed: 1.98 GHz ÷ 16 = ~124M instructions/s.
   Movement 4 (b4): Aggregate chip throughput: 33.5 trillion thread-instructions/s across 132 SMs. */

V.scene('ch09_s01', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('64 warps and the turn counter', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Top Section: 64 Warps Occupancy Card
  const topW = 1240, topH = 175;
  const topCard = S.card({
    x: GX - topW / 2, y: 175, w: topW, h: topH,
    tone: 'struct', title: ''
  });
  const topTitle = S.text('100% OCCUPANCY · 4 SCHEDULERS × 16 RESIDENT WARPS = 2,048 THREADS', {
    x: GX, y: 212, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  });
  const topGauge = S.pill('2,048 RESIDENT THREADS ON ONE SM', {
    x: GX, y: 280, h: 44, tone: 'struct', size: 22, weight: 700, style: 'solid'
  });

  // Middle Section: 32 Clock Cycles Timeline (Warp 0 executes on Tick 1 & Tick 17)
  const midW = 1240, midH = 175;
  const midCard = S.card({
    x: GX - midW / 2, y: 380, w: midW, h: midH,
    tone: 'neutral', title: ''
  });
  const midTitle = S.text('EXECUTION TIMELINE FOR ONE SCHEDULER: WARP 0 GETS A TURN EVERY 16 TICKS', {
    x: GX, y: 418, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  });

  // 32 tick boxes
  const ticksG = S.g();
  const numTicks = 32;
  const tW = 32, tH = 46, tGap = 5;
  const tX0 = GX - (numTicks * tW + (numTicks - 1) * tGap) / 2;
  const tY = 465;

  const tickBoxes = [];
  for (let t = 0; t < numTicks; t++) {
    const isWarp0 = (t === 0 || t === 16);
    const box = S.rect({
      x: tX0 + t * (tW + tGap), y: tY, w: tW, h: tH, r: 4,
      fill: isWarp0 ? S.tone('compute') : '#18243b',
      stroke: isWarp0 ? S.tone('compute') : '#2f4368', sw: 1
    }, ticksG);
    box.setAttribute('data-audit', 'ignore');

    const lbl = S.text(`${t + 1}`, {
      x: tX0 + t * (tW + tGap) + tW / 2, y: tY + 30, size: 20, anchor: 'middle',
      color: isWarp0 ? '#0a0f1e' : 'muted', weight: isWarp0 ? 700 : 500
    }, ticksG);
    lbl.setAttribute('data-audit', 'ignore');

    tickBoxes.push({ box, isWarp0 });
  }

  // Bottom Section: Speed Calculations (Single Thread vs Chip Total)
  const botW = 1240, botH = 220;
  const botCard = S.card({
    x: GX - botW / 2, y: 585, w: botW, h: botH,
    tone: 'compute', title: ''
  });
  const botTitle = S.text('SPEED IN THE COUNT · 124 MILLION PER THREAD × 270,336 THREADS', {
    x: GX - botW / 2 + 40, y: 622, size: 22, weight: 700, color: 'compute'
  });

  // Single Thread rate
  const r1 = S.text('Single thread speed: 1.98 GHz clock ÷ 16 cycles =', {
    x: GX - botW / 2 + 40, y: 675, size: 22, color: 'ink', weight: 600
  });
  const p1 = S.pill('124M instructions / sec', {
    x: GX + botW / 2 - 180, y: 673, h: 40, tone: 'struct', size: 22, weight: 700
  });

  // Chip aggregate rate
  const r2 = S.text('Chip-wide total: 132 SMs × 128 lanes × 1.98 GHz =', {
    x: GX - botW / 2 + 40, y: 740, size: 22, color: 'ink', weight: 600
  });
  const p2 = S.pill('33.5 TRILLION INSTRUCTIONS / SEC', {
    x: GX + botW / 2 - 240, y: 738, h: 42, tone: 'compute', size: 22, weight: 700, style: 'solid'
  });

  // Initial visibility
  S.set([topCard, topTitle, topGauge], { autoAlpha: 0 });
  S.set([midCard, midTitle, ticksG], { autoAlpha: 0 });
  S.set([botCard, botTitle, r1, p1, r2, p2], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 64 Warps full occupancy
  S.add(fx.in([topCard, topTitle, topGauge], { from: 'scale', d: 0.5 }), 'b1~capacity-0.2');

  // ---------------------------------------------------------------- b2: Timeline with tick 1 and 17
  S.add(fx.in([midCard, midTitle, ticksG], { from: 'scale', d: 0.5 }), 'b2~moves-0.2');
  const w0Boxes = tickBoxes.filter(t => t.isWarp0).map(t => t.box);
  S.add(fx.pulse(w0Boxes, { scale: 1.15, d: 0.5 }), 'b2~ticks');

  // ---------------------------------------------------------------- b3: Single thread 124M inst/s
  S.add(fx.in([botCard, botTitle, r1, p1], { from: 'up', d: 0.5 }), 'b3~instructions-0.2');
  S.add(fx.pulse(p1, { scale: 1.05, d: 0.4 }), 'b3~thread');

  // ---------------------------------------------------------------- b4: Chip-wide 33.5 Trillion
  S.add(fx.in([r2, p2], { from: 'up', d: 0.5 }), 'b4~thirty-three-0.2');
  S.add(fx.pulse(p2, { scale: 1.08, d: 0.5 }), 'b4~trillion');

  // Concluding Takeaway pill
  const takeaway = S.pill('slow threads are not a bug: they are how 64 warps share 4 schedulers', {
    x: GX, y: 990, h: 48, tone: 'compute', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
