/* ch07_s01 · four warp schedulers (figs 33, 34)
   Movement 1 (b1): 4 independent hardware schedulers inside 1 SM.
   Movement 2 (b2): 64 resident warps divided equally: 16 warps per scheduler.
   Movement 3 (b3): Single-cycle status scan: checking ready vs waiting for memory.
   Movement 4 (b4): Instant instruction issue: 1 ready warp picked and fired across 32 lanes.
   Movement 5 (b5): The stall hazard: if 0 of 16 warps are ready, 32 lanes sit idle for the tick. */

V.scene('ch07_s01', S => {
  const { fx } = S;
  const GX = 960, GY = 505;

  // Heading
  const heading = S.heading('four warp schedulers', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Scheduler Queue Builder (Figs 33, 34)
  const sched = ch07SchedulerQueue(S, { cx: GX, cy: GY, w: 1420, h: 540 });

  // Initial visibility
  S.set([sched.bg, sched.title, sched.stallBox, sched.stallText], { autoAlpha: 0 });
  sched.rows.forEach(r => {
    S.set([r.sBox, r.sLbl, r.warpsG, r.lBox, r.lLbl], { autoAlpha: 0 });
    if (r.issueLine) S.set(r.issueLine, { autoAlpha: 0 });
  });

  // ---------------------------------------------------------------- b1: 4 Schedulers enter
  S.add(fx.in([sched.bg, sched.title], { from: 'fade', d: 0.5 }), 'b1~multiprocessor-0.2');
  S.add(fx.in(sched.rows.flatMap(r => [r.sBox, r.sLbl]), { from: 'fade', stagger: 0.08, d: 0.5 }), 'b1~schedulers');

  // ---------------------------------------------------------------- b2: 16 Warps per scheduler
  S.add(fx.in(sched.rows.flatMap(r => [r.warpsG, r.lBox, r.lLbl]), { from: 'fade', stagger: 0.08, d: 0.5 }), 'b2~divided-0.2');

  // ---------------------------------------------------------------- b3: Scan ready vs waiting
  S.add(fx.pulse([sched.rows[0].warpBoxes[2], sched.rows[0].warpBoxes[7]], { scale: 1.15, d: 0.5 }), 'b3~ready');

  // ---------------------------------------------------------------- b4: Issue instruction across 32 lanes
  if (sched.rows[0].issueLine) {
    S.add(fx.in(sched.rows[0].issueLine, { from: 'fade', d: 0.4 }), 'b4~issues-0.2');
  }
  S.add(fx.pulse([sched.rows[0].lBox, sched.rows[0].lLbl], { scale: 1.05, d: 0.4 }), 'b4~thirty-two');

  // ---------------------------------------------------------------- b5: The stall hazard
  S.add(fx.in([sched.stallBox, sched.stallText], { from: 'fade', d: 0.5 }), 'b5~none-0.2');
  S.add(fx.pulse([sched.stallBox, sched.stallText], { scale: 1.03, d: 0.5 }), 'b5~idle');

  // Concluding Takeaway band
  const takeaway = S.takeaway('keep enough warps resident so the scheduler choice is never empty', {
    tone: 'compute'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
