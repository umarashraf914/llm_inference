/* ch13_s04 · what caps occupancy (figs 68, 69)
   Movement 1 (b1): Four hardware limits govern occupancy (Regs, Shared, Warps, Blocks).
   Movement 2 (b2): Reg and shared memory usage trade directly against thread count.
   Movement 3 (b3): Blocks placed whole; first binding constraint caps occupancy.
   Movement 4 (b4): 50% clean occupancy often beats 100% thrashed occupancy. */

V.scene('ch13_s04', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('What caps occupancy', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Four limits
  const caps = ch13OccupancyCaps(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('the goal is enough warps to hide memory latency, not maximum occupancy', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([caps.card, caps.title, caps.footer], { autoAlpha: 0 });
  caps.colEls.forEach(c => {
    S.set(c.bc, { autoAlpha: 0 });
    S.set([c.ln, c.lc, c.ld1, c.ld2], { autoAlpha: 0 });
  });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Four hardware limits appear
  S.add(fx.in([caps.card, caps.title], { from: 'scale', d: 0.5 }), 'b1~Four-0.2');
  caps.colEls.forEach((c, idx) => {
    S.add(fx.in(c.bc, { from: 'scale', d: 0.4 }), `b1~limits:-${0.2 - idx * 0.2}`);
    S.add(fx.in([c.ln, c.lc], { from: 'scale', d: 0.35 }), `b1~limits:-${0.2 - idx * 0.2}`);
    S.add(fx.in([c.ld1, c.ld2], { from: 'fade', d: 0.35 }), `b1~limits:-${0.2 - idx * 0.2}`);
  });

  // ---------------------------------------------------------------- b2: Tradeoff (Regs & Shared Memory)
  S.add(fx.pulse([caps.colEls[0].bc, caps.colEls[1].bc], { scale: 1.05, d: 0.4 }), 'b2~thread-0.2');

  // ---------------------------------------------------------------- b3: Blocks placed whole; binding resource
  S.add(fx.pulse([caps.colEls[2].bc, caps.colEls[3].bc], { scale: 1.05, d: 0.4 }), 'b3~placed-0.2');
  S.add(fx.pulse(caps.colEls[1].bc, { scale: 1.08, d: 0.4 }), 'b3~resource');

  // ---------------------------------------------------------------- b4: Latency hiding metric vs speed
  S.add(fx.in(caps.footer, { from: 'up', d: 0.4 }), 'b4~occupancy-0.2');
  S.add(fx.pulse(caps.footer, { scale: 1.05, d: 0.4 }), 'b4~fifty');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
