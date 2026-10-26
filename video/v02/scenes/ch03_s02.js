/* ch03_s02 · the energy cost of moving data (fig 12)
   Movement 1 (b1): Energy chart container and scale appear.
   Movement 2 (b2): 32-bit add (0.9 pJ) and multiply (3.7 pJ) in amber.
   Movement 3 (b3): 32-bit SRAM cache read (5.0 pJ) in teal.
   Movement 4 (b4): 32-bit DRAM read (640 pJ, 711×) in coral. Takeaway. */

V.scene('ch03_s02', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('The energy cost of moving data', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Chart builder from ch03_common.js
  const chart = ch03EnergyChart(S, { cx: GX, cy: GY - 10, w: 1240, h: 480 });

  // 700x Energy Gap highlight card below chart
  const calloutCard = S.card({
    x: GX - 460, y: GY + 265, w: 920, h: 80,
    tone: 'bytes', title: ''
  });
  const calloutText = S.text('OFF-CHIP DRAM READ COSTS 711× MORE ENERGY THAN A FLOAT ADD', {
    x: GX, y: GY + 307, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  });

  // Initial visibility
  S.set([chart.bgCard, chart.chartTitle, ...chart.gridLines], { autoAlpha: 0 });
  chart.bars.forEach(b => S.set(b.group, { autoAlpha: 0 }));
  S.set([calloutCard, calloutText], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Chart outline and grid
  S.add(fx.in([chart.bgCard, chart.chartTitle], { from: 'scale', d: 0.5 }), 'b1~heat-0.2');
  S.add(fx.in(chart.gridLines, { from: 'fade', stagger: 0.05, d: 0.4 }), 'b1~energy');

  // ---------------------------------------------------------------- b2: Add (0.9 pJ) and Multiply (3.7 pJ)
  S.add(fx.in(chart.bars[0].group, { from: 'left', d: 0.5 }), 'b2~Adding-0.2');
  S.add(fx.in(chart.bars[1].group, { from: 'left', d: 0.5 }), 'b2~Multiplying-0.2');

  // ---------------------------------------------------------------- b3: SRAM cache read (5.0 pJ)
  S.add(fx.in(chart.bars[2].group, { from: 'left', d: 0.5 }), 'b3~Reading-0.2');

  // ---------------------------------------------------------------- b4: DRAM off-chip read (640 pJ, 711x)
  S.add(fx.in(chart.bars[3].group, { from: 'left', d: 0.5 }), 'b4~Fetching-0.2');
  S.add(fx.pulse(chart.bars[3].val, { scale: 1.1, d: 0.5 }), 'b4~seven');
  S.add(fx.in([calloutCard, calloutText], { from: 'up', d: 0.5 }), 'b4~times');

  // Concluding Takeaway pill
  const takeaway = S.pill('arithmetic is cheap: moving data across wires consumes the power', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
