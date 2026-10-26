/* ch13_s01 · latency hiding and the kitchen analogy (figs 63, 64, 65)
   Movement 1 (b1): Kitchen cook prepares next dish while oven bakes.
   Movement 2 (b2): Latency is not reduced; idle time is covered with work.
   Movement 3 (b3): Warp 0 stalls on HBM for ~479 ticks.
   Movement 4 (b4): Scheduler runs warps 1..15; chip never sits idle. */

V.scene('ch13_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Latency hiding and the kitchen analogy', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Kitchen and warp scheduler
  const kw = ch13KitchenWarpScheduler(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('each warp waits the full latency; the multiprocessor never waits', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([kw.card, kw.title, kw.kCard, kw.kTitle, kw.kDesc1, kw.kDesc2], { autoAlpha: 0 });
  S.set([kw.sCard, kw.sTitle, kw.w0Box, kw.w0Lbl, kw.w0Sub, kw.activeCard, kw.activeTitle, kw.activeSub, kw.footer], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Kitchen analogy (cook & oven)
  S.add(fx.in([kw.card, kw.title], { from: 'scale', d: 0.5 }), 'b1~cook-0.2');
  S.add(fx.in([kw.kCard, kw.kTitle], { from: 'scale', d: 0.4 }), 'b1~preparing');
  S.add(fx.in(kw.kDesc1, { from: 'fade', d: 0.35 }), 'b1~stand');
  S.add(fx.in(kw.kDesc2, { from: 'fade', d: 0.35 }), 'b1~vegetables-0.2');

  // ---------------------------------------------------------------- b2: Latency hiding concept
  S.add(fx.pulse([kw.kCard, kw.kDesc2], { scale: 1.03, d: 0.4 }), 'b2~latency');

  // ---------------------------------------------------------------- b3: Warp 0 stalls on HBM
  S.add(fx.in([kw.sCard, kw.sTitle], { from: 'scale', d: 0.4 }), 'b3~warp-0.2');
  S.add(fx.in(kw.w0Box, { from: 'scale', d: 0.4 }), 'b3~stalls-0.2');
  S.add(fx.in([kw.w0Lbl, kw.w0Sub], { from: 'fade', d: 0.4 }), 'b3~stalls-0.2');
  S.add(fx.pulse(kw.w0Box, { scale: 1.05, d: 0.4 }), 'b3~five');

  // ---------------------------------------------------------------- b4: Scheduler interleaves warps 1..15
  S.add(fx.in(kw.activeCard, { from: 'scale', d: 0.4 }), 'b4~scheduler-0.2');
  S.add(fx.in([kw.activeTitle, kw.activeSub], { from: 'fade', d: 0.4 }), 'b4~scheduler-0.2');
  S.add(fx.pulse(kw.activeCard, { scale: 1.04, d: 0.4 }), 'b4~computed.');
  S.add(fx.in(kw.footer, { from: 'up', d: 0.4 }), 'b4~computed.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
