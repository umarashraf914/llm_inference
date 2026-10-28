/* ch09_s02 · Little's law: what must be on the road (figs 46, 47)
   Movement 1 (b1): Pipeline saturation concept: work in flight.
   Movement 2 (b2): Pizza delivery analogy: 1 pizza/5 min × 30 min trip = 6 drivers on the road.
   Movement 3 (b3): Little's Law for HBM: 3,352 B/ns × 273 ns = 915,096 bytes in flight (~915 KB).
   Movement 4 (b4): Per-SM requirement: 915 KB ÷ 132 SMs = 6,933 bytes in flight per SM.
   Movement 5 (b5): Occupancy proof: 2,048 threads × 4-byte load = 8,192 bytes (1.18× saturation). */

V.scene('ch09_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading("Little's law: what must be on the road", { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Top Section: Pizza Pipeline Analogy (Beats 1 & 2)
  const pizza = ch09PizzaPipeline(S, { cx: GX, cy: 285, w: 1360, h: 230 });

  // Top Section: HBM Memory Bus Little's Law Pipeline (Beats 3)
  const hbm = ch09HbmPipeline(S, { cx: GX, cy: 285, w: 1360, h: 230 });

  // Bottom Section: Per-SM saturation comparison bars (Beats 4 & 5)
  const sat = ch09PerSmSaturation(S, { cx: GX, cy: 620, w: 1360, h: 320 });

  // Takeaway band
  const takeaway = S.takeaway('full thread occupancy is what provides enough memory requests to reach full bandwidth', {
    tone: 'helps'
  });

  // Initial visibility
  S.set([pizza.group, hbm.group, sat.group, takeaway.el], { autoAlpha: 0 });
  S.set([sat.r2Lbl, sat.r2Bar, sat.r2Val, sat.r3Lbl, sat.r3Bar, sat.r3Val, sat.threshLine, sat.satBadge], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Pipeline intro
  S.add(fx.in(pizza.group, { from: 'up', d: 0.5 }), 'b1~pipeline-0.2');

  // ---------------------------------------------------------------- b2: Pizza analogy & 6 drivers
  const driverCircles = pizza.drivers.map(d => d.circle);
  S.add(fx.pulse(driverCircles, { scale: 1.15, d: 0.5 }), 'b2~drivers');
  S.add(fx.pulse(pizza.formulaBadge, { scale: 1.05, d: 0.4 }), 'b2~idle-0.2');

  // ---------------------------------------------------------------- b3: HBM Little's Law (915 KB)
  S.add(fx.out(pizza.group, { to: 'fade', d: 0.4 }), 'b3~Little-0.3');
  S.add(fx.in(hbm.group, { from: 'fade', d: 0.5 }), 'b3~Little-0.1');
  S.add(fx.pulse(hbm.formulaBadge, { scale: 1.06, d: 0.5 }), 'b3~fifteen');

  // ---------------------------------------------------------------- b4: Per-SM requirement (6,933 B)
  S.add(fx.in(sat.group, { from: 'up', d: 0.5 }), 'b4~Divided-0.2');
  S.add(fx.pulse(sat.r1Val, { scale: 1.05, d: 0.4 }), 'b4~thousand');

  // ---------------------------------------------------------------- b5: 2,048 threads supply 8,192 B (1.18x)
  S.add(fx.in([sat.r2Lbl, sat.r2Bar, sat.r2Val, sat.r3Lbl, sat.r3Bar, sat.r3Val, sat.threshLine, sat.satBadge], { from: 'fade', d: 0.5 }), 'b5~thousand-0.2');
  S.add(fx.pulse(sat.satBadge, { scale: 1.06, d: 0.5 }), 'b5~saturate');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
