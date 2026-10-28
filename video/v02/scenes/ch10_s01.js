/* ch10_s01 · what a branch means in lockstep (figs 49, 50)
   Movement 1 (b1): Single CPU thread branch: clean single path, 0 wasted cycles.
   Movement 2 (b2): 32-lane warp arrives at the fork; lanes test different data.
   Movement 3 (b3): 1 decoder forces 2 serial passes; half the lanes masked in each.
   Movement 4 (b4): 50% throughput penalty; divergent paths serialized not parallelized. */

V.scene('ch10_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('what a branch means in lockstep', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Top Section: CPU single thread fork vs GPU warp fork (Atlas Fig 49)
  const fork = ch10CpuVsGpuFork(S, { cx: GX, cy: 250, w: 1360, h: 180 });

  // Bottom Section: 32-lane Warp Execution in Two Sequential Passes (Atlas Fig 50)
  const warpPasses = ch10WarpTwoPasses(S, { cx: GX, cy: 580, w: 1360, h: 400 });

  // Takeaway band
  const takeaway = S.takeaway('warp divergence: divergent paths are serialized, not parallelized', {
    tone: 'violet'
  });

  // Initial visibility
  S.set([fork.group, warpPasses.group, takeaway.el], { autoAlpha: 0 });
  S.set([warpPasses.p1Lbl, warpPasses.p2Lbl, warpPasses.penaltyBadge], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: CPU single thread comparison
  S.add(fx.in(fork.group, { from: 'up', d: 0.5 }), 'b1~ordinary-0.2');
  S.add(fx.pulse(fork.cpuBranch, { scale: 1.05, d: 0.4 }), 'b1~decision,');

  // ---------------------------------------------------------------- b2: 32 lanes reach the fork
  S.add(fx.pulse(fork.gpuBranch, { scale: 1.05, d: 0.4 }), 'b2~together-0.2');
  S.add(fx.in(warpPasses.group, { from: 'up', d: 0.5 }), 'b2~differ-0.2');

  // ---------------------------------------------------------------- b3: Two serial passes
  S.add(fx.in(warpPasses.p1Lbl, { from: 'fade', d: 0.4 }), 'b3~decoder,-0.2');
  const p1Active = warpPasses.p1Boxes.filter(b => b.isIf).map(b => b.box);
  S.add(fx.pulse(p1Active, { scale: 1.1, d: 0.4 }), 'b3~runs');

  S.add(fx.in(warpPasses.p2Lbl, { from: 'fade', d: 0.4 }), 'b3~masking-0.2');
  const p2Active = warpPasses.p2Boxes.filter(b => b.isElse).map(b => b.box);
  S.add(fx.pulse(p2Active, { scale: 1.1, d: 0.4 }), 'b3~pass.');

  // ---------------------------------------------------------------- b4: 50% throughput penalty
  S.add(fx.in(warpPasses.penaltyBadge, { from: 'up', d: 0.5 }), 'b4~half-0.2');
  S.add(fx.pulse(warpPasses.penaltyBadge, { scale: 1.06, d: 0.5 }), 'b4~half.');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
