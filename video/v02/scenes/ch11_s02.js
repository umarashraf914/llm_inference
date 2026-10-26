/* ch11_s02 · destructive read and the refresh timer (fig 54)
   Movement 1 (b1): Reading DRAM drains the charge, destroying the stored bit.
   Movement 2 (b2): Every read requires an immediate rewrite; row blocked while restoring.
   Movement 3 (b3): 64 ms refresh timer continuously rewrites all rows against leakage.
   Movement 4 (b4): Physics sets latency; wire count sets bandwidth. */

V.scene('ch11_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Destructive read and the refresh timer', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Cycle diagram
  const cycle = ch11DestructiveCycle(S, { cx: GX, cy: 500 });

  // Concluding Takeaway pill
  const takeaway = S.pill('DRAM physics sets latency; wire count sets bandwidth', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([cycle.card, cycle.title, cycle.p1Card, cycle.p1Title, cycle.p1Desc1, cycle.p1Desc2], { autoAlpha: 0 });
  S.set([cycle.p2Card, cycle.p2Title, cycle.p2Desc1, cycle.p2Desc2, cycle.refreshPill], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Destructive Read & Drain
  S.add(fx.in([cycle.card, cycle.title], { from: 'scale', d: 0.5 }), 'b1~Reading-0.2');
  S.add(fx.in([cycle.p1Card, cycle.p1Title], { from: 'scale', d: 0.5 }), 'b1~destroys-0.2');
  S.add(fx.in([cycle.p1Desc1, cycle.p1Desc2], { from: 'up', d: 0.4 }), 'b1~charge');
  S.add(fx.pulse([cycle.p1Card, cycle.p1Title], { scale: 1.05, d: 0.4 }), 'b1~completely.');

  // ---------------------------------------------------------------- b2: Mandatory Rewrite & Lock
  S.add(fx.in([cycle.p2Card, cycle.p2Title], { from: 'scale', d: 0.5 }), 'b2~Every-0.2');
  S.add(fx.in([cycle.p2Desc1, cycle.p2Desc2], { from: 'up', d: 0.4 }), 'b2~immediate');
  S.add(fx.pulse([cycle.p2Card, cycle.p2Title], { scale: 1.05, d: 0.4 }), 'b2~blocked');

  // ---------------------------------------------------------------- b3: 64 ms refresh timer
  S.add(fx.in(cycle.refreshPill, { from: 'up', d: 0.5 }), 'b3~controller-0.2');
  S.add(fx.pulse(cycle.refreshPill, { scale: 1.05, d: 0.4 }), 'b3~sixty-four');

  // ---------------------------------------------------------------- b4: Physics vs Wire Bandwidth
  S.add(fx.pulse([cycle.p1Card, cycle.p2Card], { scale: 1.04, d: 0.5 }), 'b4~slower');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
