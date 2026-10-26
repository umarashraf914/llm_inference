/* ch05_s02 · where the headline comes from (fig 24)
   Movement 1 (b1): Peak throughput chart outline & scale across all 132 SMs.
   Movement 2 (b2): Bar 1: 16,896 CUDA cores at 32-bit = 66.9 TFLOP/s.
   Movement 3 (b3): Bar 2: 16,896 CUDA cores at 16-bit paired = 133.8 TFLOP/s.
   Movement 4 (b4): Bar 3: 528 Tensor cores at 16-bit = 989.4 TFLOP/s (7.4× ahead!). */

V.scene('ch05_s02', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('Where the headline comes from', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Chart builder
  const chart = ch05ThroughputChart(S, { cx: GX, cy: GY - 10, w: 1280, h: 480 });

  // 7.4x Multiple highlight card below chart
  const calloutCard = S.card({
    x: GX - 480, y: GY + 265, w: 960, h: 80,
    tone: 'compute', title: ''
  });
  const calloutText = S.text('TENSOR CORES DELIVER 88% OF THE PEAK ARITHMETIC CAPACITY', {
    x: GX, y: GY + 307, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  });

  // Initial visibility
  S.set([chart.bgCard, chart.title, ...chart.gridLines], { autoAlpha: 0 });
  chart.bars.forEach(b => S.set(b.group, { autoAlpha: 0 }));
  S.set([calloutCard, calloutText], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Chart outline
  S.add(fx.in([chart.bgCard, chart.title], { from: 'scale', d: 0.5 }), 'b1~specification-0.2');
  S.add(fx.in(chart.gridLines, { from: 'fade', stagger: 0.05, d: 0.4 }), 'b1~tensor');

  // ---------------------------------------------------------------- b2: 32-bit CUDA (66.9 TFLOP/s)
  S.add(fx.in(chart.bars[0].group, { from: 'left', d: 0.5 }), 'b2~thirty-two-0.2');
  S.add(fx.pulse(chart.bars[0].valLbl, { scale: 1.08, d: 0.4 }), 'b2~sixty-six');

  // ---------------------------------------------------------------- b3: 16-bit paired CUDA (133.8 TFLOP/s)
  S.add(fx.in(chart.bars[1].group, { from: 'left', d: 0.5 }), 'b3~sixteen-0.2');
  S.add(fx.pulse(chart.bars[1].valLbl, { scale: 1.08, d: 0.4 }), 'b3~thirty-three');

  // ---------------------------------------------------------------- b4: 16-bit Tensor Cores (989.4 TFLOP/s)
  S.add(fx.in(chart.bars[2].group, { from: 'left', d: 0.6 }), 'b4~precision-0.2');
  S.add(fx.pulse(chart.bars[2].valLbl, { scale: 1.1, d: 0.5 }), 'b4~eighty-nine');
  S.add(fx.in([calloutCard, calloutText], { from: 'up', d: 0.5 }), 'b4~seven');

  // Concluding Takeaway pill
  const takeaway = S.pill('code that ignores tensor cores leaves over eighty-five percent of the chip unused', {
    x: GX, y: 990, h: 48, tone: 'compute', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
