/* ch04_s01 · anticipation against throughput (figs 15, 16, 17)
   Movement 1 (b1): CPU core arrives centered: instruction uncertainty queue ('add, branch, fetch, or jump?').
   Movement 2 (b2): Silicon budget breakdown: ~75% anticipation vs ~25% arithmetic math units.
   Movement 3 (b3): Core slides left; Fig 17 branch speculation timeline arrives (wait vs guess right vs guess wrong).
   Movement 4 (b4): Regular loops (matrix multiply): anticipation machinery is 100% idle overhead. */

V.scene('ch04_s01', S => {
  const { fx } = S;
  const GX = 960, GY = 505;

  // Heading
  const heading = S.heading('anticipation against throughput', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // CPU Core visual builder (initially centered at GX, later slides left to cx = 500)
  const cpuGroup = S.g();
  const cpu = ch04CpuCoreArea(S, { cx: GX, cy: GY, w: 580, h: 490, parent: cpuGroup });

  // Right side: Fig 17 branch speculation timeline (enters at b3)
  const specTimeline = ch04BranchTimeline(S, { cx: 1390, cy: GY, w: 720, h: 490 });

  // Initial visibility
  S.set([cpu.carrier, cpu.header, cpu.qBox, cpu.qLbl], { autoAlpha: 0 });
  S.set([
    cpu.antBlock, cpu.antTitle, ...cpu.subBlocks,
    cpu.mathBlock, cpu.mathTitle, cpu.mathSub, cpu.threadNote
  ], { autoAlpha: 0 });
  S.set(specTimeline.group, { autoAlpha: 0 });
  S.set([specTimeline.r1, specTimeline.r2, specTimeline.r3, specTimeline.resLine, specTimeline.resLbl, specTimeline.loop], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: CPU Core arrives centered
  S.add(fx.in([cpu.carrier, cpu.header, cpu.qBox, cpu.qLbl], { from: 'fade', d: 0.5 }), 'b1~core-0.2');
  S.add(fx.pulse([cpu.qBox, cpu.qLbl], { scale: 1.04, d: 0.4 }), 'b1~jump');

  // ---------------------------------------------------------------- b2: Silicon budget breakdown
  S.add(fx.in([cpu.antBlock, cpu.antTitle, ...cpu.subBlocks], { from: 'fade', stagger: 0.08, d: 0.5 }), 'b2~anticipation-0.2');
  S.add(fx.in([cpu.mathBlock, cpu.mathTitle, cpu.mathSub, cpu.threadNote], { from: 'fade', d: 0.5 }), 'b2~silicon');
  S.add(fx.pulse([cpu.mathBlock, cpu.mathTitle], { scale: 1.04, d: 0.4 }), 'b2~prefetching');

  // ---------------------------------------------------------------- b3: CPU slides left, Speculative Timeline lands
  S.add(gsap.to(cpuGroup, { x: -440, duration: 0.7, ease: 'power2.out' }), 'b3~branch-0.3');
  S.add(fx.in(specTimeline.group, { from: 'fade', d: 0.5 }), 'b3~branch');
  S.add(fx.in(specTimeline.r1, { from: 'fade', d: 0.4 }), 'b3~branch+0.2');
  S.add(fx.in(specTimeline.r2, { from: 'fade', d: 0.4 }), 'b3~guess');
  S.add(fx.in([specTimeline.r3, specTimeline.resLine, specTimeline.resLbl], { from: 'fade', d: 0.4 }), 'b3~wrong');
  S.add(fx.pulse(specTimeline.r3, { scale: 1.03, d: 0.4 }), 'b3~thrown');

  // ---------------------------------------------------------------- b4: Matrix multiply regular loop
  S.add(fx.in(specTimeline.loop, { from: 'fade', d: 0.5 }), 'b4~matrix-0.2');
  S.add(fx.pulse(specTimeline.loop, { scale: 1.03, d: 0.5 }), 'b4~overhead');

  // Concluding Takeaway band
  const takeaway = S.takeaway('CPU spends silicon anticipating unpredictable turns: pure overhead on regular loops', {
    tone: 'struct'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
