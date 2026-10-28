/* ch11_s02 · destructive read and the refresh timer (fig 54)
   Movement 1 (b1): Reading DRAM drains the charge, destroying the stored bit.
   Movement 2 (b2): Every read requires an immediate rewrite; row blocked while restoring.
   Movement 3 (b3): 64 ms refresh timer continuously rewrites all rows against leakage.
   Movement 4 (b4): Physics sets latency; wire count sets bandwidth. */

V.scene('ch11_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('destructive read and the refresh timer', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Cycle diagram (Atlas Fig 54)
  const cycle = ch11DestructiveCycle(S, { cx: GX, cy: 500 });

  // Takeaway band
  const takeaway = S.takeaway('dram physics sets latency; wire count sets bandwidth', {
    tone: 'helps'
  });

  // Initial states
  S.set([cycle.bg, cycle.title, cycle.s1Box, cycle.s1Title, cycle.s1Sub, cycle.a1], { autoAlpha: 0 });
  S.set([cycle.s2Box, cycle.s2Title, cycle.s2Sub, cycle.a2, cycle.s3Box, cycle.s3Title, cycle.s3Sub], { autoAlpha: 0 });
  S.set([cycle.refBox, cycle.refText1, cycle.summaryPill, takeaway.el], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Destructive Read & Drain
  S.add(fx.in([cycle.bg, cycle.title], { from: 'up', d: 0.5 }), 'b1~Reading-0.2');
  S.add(fx.in([cycle.s1Box, cycle.s1Title, cycle.s1Sub, cycle.a1], { from: 'fade', d: 0.5 }), 'b1~destroys-0.2');
  S.add(fx.in([cycle.s2Box, cycle.s2Title, cycle.s2Sub], { from: 'fade', d: 0.4 }), 'b1~charge');
  S.add(fx.pulse([cycle.s2Box, cycle.s2Title], { scale: 1.05, d: 0.4 }), 'b1~completely.');

  // ---------------------------------------------------------------- b2: Mandatory Rewrite & Lock
  S.add(fx.in([cycle.a2, cycle.s3Box, cycle.s3Title, cycle.s3Sub], { from: 'fade', d: 0.5 }), 'b2~Every-0.2');
  S.add(fx.pulse([cycle.s3Box, cycle.s3Title], { scale: 1.05, d: 0.4 }), 'b2~blocked');

  // ---------------------------------------------------------------- b3: 64 ms refresh timer
  S.add(fx.in([cycle.refBox, cycle.refText1], { from: 'up', d: 0.5 }), 'b3~controller-0.2');
  S.add(fx.pulse(cycle.refBox, { scale: 1.04, d: 0.4 }), 'b3~sixty-four');

  // ---------------------------------------------------------------- b4: Physics vs Wire Bandwidth
  S.add(fx.in(cycle.summaryPill, { from: 'up', d: 0.4 }), 'b4~slower-0.2');
  S.add(fx.pulse(cycle.summaryPill, { scale: 1.05, d: 0.5 }), 'b4~bandwidth:');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
