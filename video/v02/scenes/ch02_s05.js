/* ch02_s05 · three durations on a log axis (fig 9)
   Movement 1 (b1): Logarithmic time axis spanning 9 decades from 0.1 ns to 100 ms.
   Movement 2 (b2): Marker 1 at 0.55 ns: one clock tick (arithmetic logic execution).
   Movement 3 (b3): Marker 2 at 273 ns: one HBM memory load (a 500-fold latency gap!).
   Movement 4 (b4): Marker 3 at 30 ms: one token generation (110,000 memory loads). */

V.scene('ch02_s05', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('Three durations on a log axis', { y: 130 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Logarithmic axis builder
  const axis = ch02LogTimeAxis(S, { x0: 200, x1: 1720, y: GY + 50 });

  // Axis headline card
  const scaleCard = S.card({
    x: GX - 460, y: 170, w: 920, h: 76,
    tone: 'neutral', title: ''
  });
  const scaleText = S.text('logarithmic scale: each step is 10× longer in time', {
    x: GX, y: 208, size: 22, anchor: 'middle', weight: 650, color: 'ink'
  });

  // ---------------------------------------------------------------- b2: Marker 1: One clock tick (0.55 ns)
  const m1X = axis.X(0.55e-9);
  const m1Group = S.g();
  const m1Line = S.line({ x1: m1X, y1: axis.y - 140, x2: m1X, y2: axis.y, stroke: S.tone('compute'), sw: 3.5 }, m1Group);
  const m1Dot = S.circle({ x: m1X, y: axis.y, r: 8, fill: S.tone('compute') }, m1Group);
  const m1Card = S.card({
    x: m1X - 140, y: axis.y - 230, w: 280, h: 90,
    tone: 'compute', title: ''
  }, m1Group);
  const m1Title = S.text('1 · clock tick', { x: m1X, y: axis.y - 195, size: 22, anchor: 'middle', color: 'compute', weight: 650 }, m1Group);
  const m1Time = S.text('0.55 nanoseconds', { x: m1X, y: axis.y - 162, size: 22, anchor: 'middle', family: 'mono', color: 'ink', weight: 600 }, m1Group);

  // ---------------------------------------------------------------- b3: Marker 2: One HBM load (273 ns)
  const m2X = axis.X(273e-9);
  const m2Group = S.g();
  const m2Line = S.line({ x1: m2X, y1: axis.y - 140, x2: m2X, y2: axis.y, stroke: S.tone('bytes'), sw: 3.5 }, m2Group);
  const m2Dot = S.circle({ x: m2X, y: axis.y, r: 8, fill: S.tone('bytes') }, m2Group);
  const m2Card = S.card({
    x: m2X - 150, y: axis.y - 230, w: 300, h: 90,
    tone: 'bytes', title: ''
  }, m2Group);
  const m2Title = S.text('2 · HBM memory load', { x: m2X, y: axis.y - 195, size: 22, anchor: 'middle', color: 'bytes', weight: 650 }, m2Group);
  const m2Time = S.text('≈ 273 ns (≈ 479 ticks)', { x: m2X, y: axis.y - 162, size: 22, anchor: 'middle', family: 'mono', color: 'ink', weight: 600 }, m2Group);

  // 500-fold gap callout
  const gapBracket = S.pill('500× clock cycles wait', {
    x: (m1X + m2X) / 2, y: axis.y + 115, h: 42, tone: 'bytes', size: 22, weight: 650
  });

  // ---------------------------------------------------------------- b4: Marker 3: One token (30 ms)
  const m3X = axis.X(30e-3);
  const m3Group = S.g();
  const m3Line = S.line({ x1: m3X, y1: axis.y - 140, x2: m3X, y2: axis.y, stroke: S.tone('helps'), sw: 3.5 }, m3Group);
  const m3Dot = S.circle({ x: m3X, y: axis.y, r: 8, fill: S.tone('helps') }, m3Group);
  const m3Card = S.card({
    x: m3X - 190, y: axis.y - 230, w: 380, h: 90,
    tone: 'helps', title: ''
  }, m3Group);
  const m3Title = S.text('3 · generated token', { x: m3X, y: axis.y - 195, size: 22, anchor: 'middle', color: 'helps', weight: 650 }, m3Group);
  const m3Time = S.text('≈ 30 ms (≈ 110,000 loads)', { x: m3X, y: axis.y - 162, size: 22, anchor: 'middle', family: 'mono', color: 'ink', weight: 600 }, m3Group);

  // Concluding Takeaway
  const takeaway = S.takeaway('a memory load takes five hundred ticks: latency hiding is essential', {
    tone: 'bytes'
  });

  // Initial hidden states
  S.set([scaleCard, scaleText, axis.axis, ...axis.ticks, m1Group, m2Group, gapBracket, m3Group, takeaway], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Logarithmic time axis appears
  S.add(fx.in([scaleCard, scaleText], { from: 'up', d: 0.4 }), 'b1~scale-0.2');
  S.add(fx.draw(axis.axis, { d: 0.8 }), 'b1~scale');
  S.add(fx.in(axis.ticks, { from: 'up', stagger: 0.05, d: 0.4 }), 'b1~step');

  // ---------------------------------------------------------------- b2: Marker 1: One clock tick (0.55 ns)
  S.add(fx.in(m1Group, { from: 'fade', d: 0.5 }), 'b2~tick-0.2');
  S.add(fx.pulse([m1Dot, m1Card], { scale: 1.08, d: 0.5 }), 'b2~nanoseconds');

  // ---------------------------------------------------------------- b3: Marker 2: One HBM load (273 ns)
  S.add(fx.in(m2Group, { from: 'fade', d: 0.5 }), 'b3~load-0.2');
  S.add(fx.in(gapBracket, { from: 'fade', d: 0.4 }), 'b3~five hundred');

  // ---------------------------------------------------------------- b4: Marker 3: One token (30 ms)
  S.add(fx.in(m3Group, { from: 'fade', d: 0.5 }), 'b4~token-0.2');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
