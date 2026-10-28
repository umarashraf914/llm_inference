/* ch06_s01 · the register file and the trade (figs 26, 27, 28)
   Movement 1 (b1): Architecture bottleneck: memory cannot feed ALUs directly. Data must land in registers.
   Movement 2 (b2): Red prohibition on direct memory access; clean flow through register r0.
   Movement 3 (b3): 256 KB register file = 65,536 registers (single-cycle latency).
   Movement 4 (b4): 32 registers/thread = 2,048 threads (100% occupancy).
   Movement 5 (b5): 64 & 128 registers/thread halve occupancy. Tradeoff revealed. */

V.scene('ch06_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('the register file and the trade', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Top Section: Fig 26 Register Path (y = 285)
  const topPath = ch06RegisterPath(S, { cx: GX, cy: 275, w: 1420, h: 220 });

  // Bottom Section: Fig 28 Occupancy Chart (y = 635)
  const botChart = ch06OccupancyChart(S, { cx: GX, cy: 645, w: 1420, h: 420 });

  // Initial visibility
  S.set([
    topPath.bg, topPath.title, topPath.aluBox, topPath.aluLbl,
    topPath.regBox, topPath.regHeader, ...topPath.regSlots,
    topPath.memBox, topPath.memLbl, topPath.arr1, topPath.arr2
  ], { autoAlpha: 0 });
  S.set([topPath.badLine, topPath.noDirectPill], { autoAlpha: 0 });
  S.set([botChart.bg, botChart.title, botChart.footer], { autoAlpha: 0 });
  botChart.rowBars.forEach(r => S.set([r.lbl, r.bar, r.occLbl], { autoAlpha: 0 }));

  // ---------------------------------------------------------------- b1: Pipeline intro
  S.add(fx.in([
    topPath.bg, topPath.title, topPath.aluBox, topPath.aluLbl,
    topPath.regBox, topPath.regHeader, ...topPath.regSlots,
    topPath.memBox, topPath.memLbl, topPath.arr1, topPath.arr2
  ], { from: 'fade', d: 0.5 }), 'b1~reach-0.2');

  // ---------------------------------------------------------------- b2: Prohibition of direct memory access
  S.add(fx.in([topPath.badLine, topPath.noDirectPill], { from: 'fade', d: 0.5 }), 'b2~optional-0.2');
  S.add(fx.pulse(topPath.noDirectPill, { scale: 1.05, d: 0.5 }), 'b2~touch');

  // ---------------------------------------------------------------- b3: 256 KB register file size
  S.add(fx.in([botChart.bg, botChart.title, botChart.footer], { from: 'fade', d: 0.5 }), 'b3~contains-0.2');

  // ---------------------------------------------------------------- b4: 32 regs/thread = 2,048 threads
  S.add(fx.in([botChart.rowBars[0].lbl, botChart.rowBars[0].bar, botChart.rowBars[0].occLbl], { from: 'fade', d: 0.5 }), 'b4~partitioned-0.2');
  S.add(fx.pulse(botChart.rowBars[0].occLbl, { scale: 1.05, d: 0.4 }), 'b4~fit');

  // ---------------------------------------------------------------- b5: 64, 128 & 255 regs/thread occupancy drop
  const otherRows = botChart.rowBars.slice(1).flatMap(r => [r.lbl, r.bar, r.occLbl]);
  S.add(fx.in(otherRows, { from: 'fade', stagger: 0.08, d: 0.5 }), 'b5~Double-0.2');
  S.add(fx.pulse([botChart.rowBars[2].occLbl, botChart.rowBars[4].occLbl], { scale: 1.05, d: 0.5 }), 'b5~waits');

  // Concluding Takeaway band
  const takeaway = S.takeaway('registers per thread trade one-for-one with occupancy', {
    tone: 'struct'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
