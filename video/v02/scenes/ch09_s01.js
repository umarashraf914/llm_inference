/* ch09_s01 · sixty-four warps and the turn counter (figs 44, 45)
   Movement 1 (b1): 64 warps fill 1 SM: 2,048 resident threads across 4 schedulers.
   Movement 2 (b2): Round-robin scheduling: each thread moves once every 16 ticks (Tick 1, 17, 33).
   Movement 3 (b3): Single-thread speed: 1.98 GHz ÷ 16 = ~124M instructions/s per thread.
   Movement 4 (b4): Aggregate chip throughput: 33.5 trillion thread-instructions/s across 132 SMs. */

V.scene('ch09_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('64 warps and the turn counter', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Top Section: 64 Warps Grid on Multiprocessor (Atlas Fig 44)
  const grid = ch09WarpGrid(S, { cx: GX, cy: 295, w: 1360, h: 250 });

  // Bottom Section: 32 Clock Cycles Timeline & Rates (Atlas Fig 45)
  const timeline = ch09TurnTimeline(S, { cx: GX, cy: 605, w: 1360, h: 270 });

  // Takeaway band
  const takeaway = S.takeaway('slow threads are not a bug: they are how 64 warps share 4 schedulers', {
    tone: 'compute'
  });

  // Initial visibility
  S.set([grid.group, timeline.group, takeaway.el], { autoAlpha: 0 });
  S.set([timeline.ticksG, timeline.rateG], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 64 Warps full occupancy
  S.add(fx.in(grid.group, { from: 'up', d: 0.5 }), 'b1~capacity-0.2');
  S.add(fx.pulse(grid.occBadge, { scale: 1.06, d: 0.4 }), 'b1~two');

  // ---------------------------------------------------------------- b2: Timeline with tick 1 and 17
  S.add(fx.in(timeline.group, { from: 'up', d: 0.4 }), 'b2~moves-0.2');
  S.add(fx.in(timeline.ticksG, { from: 'fade', d: 0.4 }), 'b2~sixteen-0.2');
  S.add(fx.pulse(timeline.w0Boxes, { scale: 1.15, d: 0.5 }), 'b2~ticks');

  // ---------------------------------------------------------------- b3: Single thread 124M inst/s
  S.add(fx.in(timeline.rateG, { from: 'up', d: 0.4 }), 'b3~instructions-0.2');
  S.add(fx.pulse(timeline.singleBox, { scale: 1.05, d: 0.4 }), 'b3~thread');

  // ---------------------------------------------------------------- b4: Chip-wide 33.5 Trillion
  S.add(fx.pulse(timeline.chipBox, { scale: 1.06, d: 0.5 }), 'b4~trillion');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
