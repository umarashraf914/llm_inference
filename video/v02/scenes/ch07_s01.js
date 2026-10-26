/* ch07_s01 · four warp schedulers (figs 33, 34)
   Movement 1 (b1): 4 independent hardware schedulers inside 1 SM.
   Movement 2 (b2): 64 resident warps divided equally: 16 warps per scheduler.
   Movement 3 (b3): Single-cycle status scan: checking ready vs waiting for memory.
   Movement 4 (b4): Instant instruction issue: 1 ready warp picked and fired across 32 lanes.
   Movement 5 (b5): The stall hazard: if 0 of 16 warps are ready, 32 lanes sit idle for the tick. */

V.scene('ch07_s01', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('Four warp schedulers', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Master SM Schedulers Card
  const cardW = 1260, cardH = 550;
  const mainCard = S.card({
    x: GX - cardW / 2, y: GY + 20 - cardH / 2, w: cardW, h: cardH,
    tone: 'neutral', title: ''
  });
  const mainTitle = S.text('64 RESIDENT WARPS DIVIDED EQUALLY ACROSS 4 SCHEDULERS (16 PER SCHEDULER)', {
    x: GX, y: GY + 20 - cardH / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  });

  // 4 Horizontal Scheduler Rows
  const rows = [];
  const rowY0 = GY - 165;
  const rowH = 105;

  for (let i = 0; i < 4; i++) {
    const ry = rowY0 + i * rowH;
    const rg = S.g();

    // Scheduler Badge on Left
    const sPill = S.pill(`Scheduler ${i + 1}`, {
      x: GX - 470, y: ry + 36, h: 42, tone: i === 0 ? 'compute' : 'struct', size: 22, weight: 700
    }, rg);

    // 16 Warps Queue for this scheduler
    const warpsG = S.g(null, rg);
    const wX0 = GX - 310;
    const wW = 34, wH = 38, wGap = 10;
    const warpBoxes = [];
    for (let w = 0; w < 16; w++) {
      const isReady = (w === 2 || w === 7 || w === 11);
      const isStalled = !isReady;
      const bx = S.rect({
        x: wX0 + w * (wW + wGap), y: ry + 16, w: wW, h: wH, r: 4,
        fill: isReady ? S.tone('compute') : '#1d273d',
        stroke: isReady ? S.tone('compute') : '#364968', sw: 1
      }, warpsG);
      bx.setAttribute('data-audit', 'ignore');
      warpBoxes.push(bx);
    }

    // 32 Execution Lanes Target on Right
    const lanesPill = S.pill(i === 0 ? '32 CUDA Lanes (Active)' : '32 CUDA Lanes', {
      x: GX + 480, y: ry + 36, h: 42, tone: i === 0 ? 'compute' : 'neutral', size: 22, weight: 700
    }, rg);

    // Connecting issue arrow for Scheduler 1
    let issueArrow = null;
    if (i === 0) {
      issueArrow = S.line({
        x1: wX0 + 2 * (wW + wGap) + wW / 2, y1: ry + 36,
        x2: GX + 350, y2: ry + 36,
        stroke: S.tone('compute'), sw: 3, arrow: true
      }, rg);
      issueArrow.setAttribute('data-audit', 'ignore');
    }

    rows.push({ group: rg, sPill, warpsG, warpBoxes, lanesPill, issueArrow });
  }

  // Stall alert banner (hidden initially)
  const stallBanner = S.pill('STALL: If all 16 warps wait on DRAM, 32 execution lanes sit 100% idle', {
    x: GX, y: GY + 240, h: 44, tone: 'bytes', size: 22, weight: 700
  });

  // Initial visibility
  S.set([mainCard, mainTitle, stallBanner], { autoAlpha: 0 });
  rows.forEach(r => S.set(r.group, { autoAlpha: 0 }));

  // ---------------------------------------------------------------- b1: 4 Schedulers enter
  S.add(fx.in([mainCard, mainTitle], { from: 'scale', d: 0.5 }), 'b1~multiprocessor-0.2');
  S.add(fx.in(rows.map(r => r.sPill), { from: 'left', stagger: 0.08, d: 0.5 }), 'b1~schedulers');

  // ---------------------------------------------------------------- b2: 16 Warps per scheduler
  S.add(fx.in(rows.flatMap(r => [r.warpsG, r.lanesPill]), { from: 'right', stagger: 0.08, d: 0.5 }), 'b2~divided-0.2');

  // ---------------------------------------------------------------- b3: Scan ready vs waiting
  S.add(fx.pulse(rows[0].warpBoxes[2], { scale: 1.2, d: 0.5 }), 'b3~ready');

  // ---------------------------------------------------------------- b4: Issue instruction across 32 lanes
  if (rows[0].issueArrow) {
    S.add(fx.in(rows[0].issueArrow, { from: 'left', d: 0.4 }), 'b4~issues-0.2');
  }
  S.add(fx.pulse(rows[0].lanesPill, { scale: 1.08, d: 0.4 }), 'b4~thirty-two');

  // ---------------------------------------------------------------- b5: The stall hazard
  S.add(fx.in(stallBanner, { from: 'up', d: 0.5 }), 'b5~none-0.2');
  S.add(fx.pulse(stallBanner, { scale: 1.05, d: 0.5 }), 'b5~idle');

  // Concluding Takeaway pill
  const takeaway = S.pill('keep enough warps resident so the scheduler choice is never empty', {
    x: GX, y: 990, h: 48, tone: 'compute', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
