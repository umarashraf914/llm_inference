/* ch03_s02 · the energy cost of moving data (fig 12)
   Movement 1 (b1): Energy chart container and scale appear.
   Movement 2 (b2): 32-bit add (0.9 pJ) and multiply (3.7 pJ) in amber.
   Movement 3 (b3): 32-bit SRAM cache read (5.0 pJ) in teal.
   Movement 4 (b4): 32-bit DRAM read (640 pJ, 711×) in coral. Takeaway. */

V.scene('ch03_s02', S => {
  const { fx } = S;
  const GX = 960, GY = 500;

  // Heading
  const heading = S.heading('The energy cost of moving data', { y: 130 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Chart builder
  const chart = ch03EnergyChart(S, { cx: GX, cy: GY - 20, w: 1260, h: 460 });

  // 700x Energy Gap highlight pill below chart
  const calloutPill = S.pill('off-chip DRAM read costs 711× more energy than a float add', {
    x: GX, y: GY + 250, h: 46, tone: 'bytes', size: 22, weight: 650
  });

  // Concluding Takeaway
  const takeaway = S.takeaway('arithmetic is cheap; moving data across wires consumes the power', {
    tone: 'bytes'
  });

  // Initial visibility
  S.set([chart.bgCard, chart.chartTitle, ...chart.gridLines], { autoAlpha: 0 });
  chart.bars.forEach(b => S.set(b.group, { autoAlpha: 0 }));
  S.set([calloutPill, takeaway], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Chart outline and grid
  S.add(fx.in([chart.bgCard, chart.chartTitle], { from: 'fade', d: 0.5 }), 'b1~heat-0.2');
  S.add(fx.in(chart.gridLines, { from: 'fade', stagger: 0.05, d: 0.4 }), 'b1~energy');

  // ---------------------------------------------------------------- b2: Add (0.9 pJ) and Multiply (3.7 pJ)
  S.add(fx.in(chart.bars[0].group, { from: 'left', d: 0.5 }), 'b2~Adding-0.2');
  S.add(fx.in(chart.bars[1].group, { from: 'left', d: 0.5 }), 'b2~Multiplying-0.2');

  // ---------------------------------------------------------------- b3: SRAM cache read (5.0 pJ)
  S.add(fx.in(chart.bars[2].group, { from: 'left', d: 0.5 }), 'b3~Reading-0.2');

  // ---------------------------------------------------------------- b4: DRAM off-chip read (640 pJ, 711x)
  S.add(fx.in(chart.bars[3].group, { from: 'left', d: 0.5 }), 'b4~Fetching-0.2');
  S.add(fx.pulse(chart.bars[3].val, { scale: 1.08, d: 0.5 }), 'b4~seven');
  S.add(fx.in(calloutPill, { from: 'up', d: 0.5 }), 'b4~times');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
