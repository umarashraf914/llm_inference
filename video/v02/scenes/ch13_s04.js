/* ch13_s04 · what caps occupancy (figs 68, 69)
   Movement 1 (b1): 4 hardware limits: Registers, Shared Memory, Max Warps, Max Blocks.
   Movement 2 (b2): More registers/thread or shared memory/block cuts allowed warps.
   Movement 3 (b3): Blocks placed whole; whichever resource exhausts first binds occupancy.
   Movement 4 (b4): The goal is latency hiding, not maximum occupancy. */

V.scene('ch13_s04', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('what caps occupancy', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Resource gauges board (Atlas Figs 68, 69)
  const caps = ch13OccupancyCaps(S, { cx: GX, cy: 500 });

  // Takeaway band
  const takeaway = S.takeaway('the goal is enough warps to hide memory latency, not maximum occupancy', {
    tone: 'helps'
  });

  // Initial states
  S.set([caps.bg, caps.title, caps.footer, takeaway.el], { autoAlpha: 0 });
  caps.colEls.forEach(c => S.set([c.bc, c.ln, c.lc, c.ld1, c.ld2], { autoAlpha: 0 }));

  // ---------------------------------------------------------------- b1: 4 Hardware limits intro
  S.add(fx.in([caps.bg, caps.title], { from: 'up', d: 0.5 }), 'b1~separate-0.2');
  caps.colEls.forEach((c, idx) => {
    S.add(fx.in([c.bc, c.ln, c.lc], { from: 'up', d: 0.4 }), `b1~limits:-${0.2 - idx * 0.25}`);
  });

  // ---------------------------------------------------------------- b2: Adjusting registers and shared memory
  caps.colEls.forEach((c, idx) => {
    S.add(fx.in([c.ld1, c.ld2], { from: 'fade', d: 0.4 }), `b2~registers:-${0.2 - idx * 0.25}`);
  });
  if (caps.colEls[0] && caps.colEls[1]) {
    S.add(fx.pulse([caps.colEls[0].bc, caps.colEls[1].bc], { scale: 1.05, d: 0.4 }), 'b2~blocks.');
  }

  // ---------------------------------------------------------------- b3: Binding resource sets occupancy
  if (caps.colEls[1]) {
    S.add(fx.pulse(caps.colEls[1].bc, { scale: 1.08, d: 0.5 }), 'b3~resource');
  }

  // ---------------------------------------------------------------- b4: Latency hiding vs max occupancy
  S.add(fx.in(caps.footer, { from: 'fade', d: 0.4 }), 'b4~occupancy-0.2');
  S.add(fx.pulse(caps.footer, { scale: 1.05, d: 0.4 }), 'b4~beats');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
