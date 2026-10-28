/* ch13_s01 · latency hiding and the kitchen analogy (figs 63, 64, 65)
   Movement 1 (b1): Kitchen cook chops vegetables while dish bakes.
   Movement 2 (b2): Oven takes the same time; idle time drops to zero. That is latency hiding.
   Movement 3 (b3): Warp 0 stalls on HBM for nearly 500 clock cycles.
   Movement 4 (b4): Scheduler runs warps 1..15; multiprocessor never waits. */

V.scene('ch13_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('latency hiding and the kitchen analogy', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Kitchen and Warp Scheduler (Atlas Figs 63, 64, 65)
  const sched = ch13KitchenWarpScheduler(S, { cx: GX, cy: 500 });

  // Takeaway band
  const takeaway = S.takeaway('each warp waits the full latency; the multiprocessor never waits', {
    tone: 'helps'
  });

  // Initial states
  S.set([sched.bg, sched.title, sched.kCard, sched.kTitle, sched.kDesc1, sched.kDesc2], { autoAlpha: 0 });
  S.set([sched.sCard, sched.sTitle, sched.w0Box, sched.w0Lbl, sched.activeCard, sched.activeTitle, sched.activeSub, sched.footer, takeaway.el], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Kitchen analogy intro
  S.add(fx.in([sched.bg, sched.title], { from: 'up', d: 0.5 }), 'b1~cook-0.2');
  S.add(fx.in([sched.kCard, sched.kTitle, sched.kDesc1], { from: 'up', d: 0.5 }), 'b1~cook');

  // ---------------------------------------------------------------- b2: Smart cook & zero idle time
  S.add(fx.in(sched.kDesc2, { from: 'fade', d: 0.4 }), 'b2~exact-0.2');
  S.add(fx.pulse(sched.kDesc2, { scale: 1.05, d: 0.4 }), 'b2~hiding.');

  // ---------------------------------------------------------------- b3: Warp 0 stalls on HBM (500 ticks)
  S.add(fx.in([sched.sCard, sched.sTitle, sched.w0Box, sched.w0Lbl], { from: 'up', d: 0.5 }), 'b3~zero-0.2');
  S.add(fx.pulse([sched.w0Box, sched.w0Lbl], { scale: 1.08, d: 0.4 }), 'b3~hundred');

  // ---------------------------------------------------------------- b4: Scheduler runs warps 1..15
  S.add(fx.in([sched.activeCard, sched.activeTitle, sched.activeSub], { from: 'fade', d: 0.5 }), 'b4~Instead-0.2');
  S.add(fx.pulse([sched.activeCard, sched.activeTitle], { scale: 1.05, d: 0.4 }), 'b4~dozens');
  S.add(fx.in(sched.footer, { from: 'fade', d: 0.4 }), 'b4~computed.-0.2');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
