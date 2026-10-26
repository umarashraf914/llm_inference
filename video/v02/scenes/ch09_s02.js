/* ch09_s02 · Little's law: what must be on the road (figs 46, 47)
   Movement 1 (b1): Pipeline saturation concept: work in flight.
   Movement 2 (b2): Pizza delivery analogy: 1 pizza/5 min × 30 min trip = 6 drivers on the road.
   Movement 3 (b3): Little's Law for HBM: 3,352 B/ns × 273 ns = 915,096 bytes in flight.
   Movement 4 (b4): Per-SM requirement: 915 KB ÷ 132 SMs = 6,933 bytes in flight per SM.
   Movement 5 (b5): Occupancy proof: 2,048 threads × 4-byte load = 8,192 bytes (1.18× saturation). */

V.scene('ch09_s02', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading("Little's law: what must be on the road", { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Top Section: Analogy vs Formula Card
  const topW = 1240, topH = 220;
  const topCard = S.card({
    x: GX - topW / 2, y: 175, w: topW, h: topH,
    tone: 'compute', title: ''
  });
  const topTitle = S.text("LITTLE'S LAW · WORK IN FLIGHT = ARRIVAL RATE × PIPELINE TRIP LATENCY", {
    x: GX, y: 212, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  });

  // Pizza Analogy row
  const aRowY = 270;
  const aLbl = S.text('Pipeline Analogy:', { x: GX - topW / 2 + 40, y: aRowY, size: 22, color: 'struct', weight: 700 });
  const aEq = S.text('1 pizza / 5 min  ×  30 min round trip  =', { x: GX - 300, y: aRowY, size: 22, family: 'mono', color: 'ink', weight: 600 });
  const aPill = S.pill('6 Drivers on Road', { x: GX + 400, y: aRowY - 2, h: 40, tone: 'struct', size: 22, weight: 700 });

  // HBM Little's Law row
  const hRowY = 345;
  const hLbl = S.text('H100 Memory Bus:', { x: GX - topW / 2 + 40, y: hRowY, size: 22, color: 'bytes', weight: 700 });
  const hEq = S.text('3,352 GB/s  ×  273 ns round trip  =', { x: GX - 300, y: hRowY, size: 22, family: 'mono', color: 'ink', weight: 600 });
  const hPill = S.pill('915,096 BYTES IN FLIGHT (~915 KB)', { x: GX + 400, y: hRowY - 2, h: 42, tone: 'bytes', size: 22, weight: 700, style: 'solid' });

  // Bottom Section: Per-SM saturation bars builder from ch09_common.js
  const bars = ch09LittlesLawBars(S, { cx: GX, cy: 615, w: 1240, h: 360 });

  // Initial visibility
  S.set([topCard, topTitle, aLbl, aEq, aPill], { autoAlpha: 0 });
  S.set([hLbl, hEq, hPill], { autoAlpha: 0 });
  S.set([bars.card, bars.title, bars.r1Lbl, bars.r1Bar, bars.r1Val, bars.r2Lbl, bars.r2Bar, bars.r2Val, bars.satBadge], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Pipeline intro
  S.add(fx.in([topCard, topTitle], { from: 'scale', d: 0.5 }), 'b1~pipeline-0.2');

  // ---------------------------------------------------------------- b2: Pizza analogy
  S.add(fx.in([aLbl, aEq, aPill], { from: 'left', d: 0.5 }), 'b2~pizza-0.2');
  S.add(fx.pulse(aPill, { scale: 1.05, d: 0.4 }), 'b2~drivers');

  // ---------------------------------------------------------------- b3: HBM Little's Law (915 KB)
  S.add(fx.in([hLbl, hEq, hPill], { from: 'left', d: 0.5 }), 'b3~Little-0.2');
  S.add(fx.pulse(hPill, { scale: 1.08, d: 0.5 }), 'b3~fifteen');

  // ---------------------------------------------------------------- b4: Per-SM requirement (6,933 B)
  S.add(fx.in([bars.card, bars.title, bars.r1Lbl, bars.r1Bar, bars.r1Val], { from: 'up', d: 0.5 }), 'b4~Divided-0.2');
  S.add(fx.pulse(bars.r1Val, { scale: 1.05, d: 0.4 }), 'b4~thousand');

  // ---------------------------------------------------------------- b5: 2,048 threads supply 8,192 B (1.18x)
  S.add(fx.in([bars.r2Lbl, bars.r2Bar, bars.r2Val, bars.satBadge], { from: 'up', d: 0.5 }), 'b5~thousand-0.2');
  S.add(fx.pulse(bars.satBadge, { scale: 1.08, d: 0.5 }), 'b5~saturate');

  // Concluding Takeaway pill
  const takeaway = S.pill('full thread occupancy is what provides enough memory requests to reach full bandwidth', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
