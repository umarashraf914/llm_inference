/* ch11_s03 · the two hundred and seventy nanosecond journey (fig 55)
   Movement 1 (b1): Total HBM memory load journey: ~273 ns (479 clock ticks).
   Movement 2 (b2): Cell readout takes only 27.5 ns (barely 10% of total time).
   Movement 3 (b3): 90% is transit across caches, crossbar, queues, and package wires.
   Movement 4 (b4): Wider buses increase bandwidth, but cannot speed up transit latency. */

V.scene('ch11_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('The two hundred and seventy nanosecond journey', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Latency breakdown bar
  const lat = ch11LatencyBreakdown(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('bandwidth scales with wires; latency is bounded by physical transit distance', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([lat.card, lat.title, lat.transitBar, lat.transitLbl, lat.cellBar, lat.cellLbl, lat.takeawayBadge], { autoAlpha: 0 });
  lat.stageEls.forEach(s => S.set([s.sc, s.sn, s.sd], { autoAlpha: 0 }));
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 273 nanoseconds total journey
  S.add(fx.in([lat.card, lat.title], { from: 'scale', d: 0.5 }), 'b1~thread-0.2');
  S.add(fx.in(lat.transitBar, { from: 'scale', d: 0.5 }), 'b1~two-0.2');
  S.add(fx.in(lat.transitLbl, { from: 'fade', d: 0.5 }), 'b1~two');
  S.add(fx.in(lat.cellBar, { from: 'scale', d: 0.5 }), 'b1~seventy-three');
  S.add(fx.in(lat.cellLbl, { from: 'fade', d: 0.5 }), 'b1~seventy-three');

  // ---------------------------------------------------------------- b2: Cell activation is only 27.5 ns (10%)
  S.add(fx.pulse([lat.cellBar, lat.cellLbl], { scale: 1.1, d: 0.5 }), 'b2~twenty-seven-0.2');
  S.add(fx.recolor(lat.cellBar, {
    fill: S.tone('helps', 0.8),
    stroke: S.tone('helps', 1.0),
    d: 0.4
  }), 'b2~tenth');

  // ---------------------------------------------------------------- b3: 90% is transit across stages
  lat.stageEls.forEach((s, idx) => {
    S.add(fx.in([s.sc, s.sn, s.sd], { from: 'up', d: 0.4 }), `b3~journey:-${0.2 - idx * 0.25}`);
  });
  S.add(fx.pulse(lat.stageEls.map(s => s.sc), { scale: 1.05, stagger: 0.05, d: 0.4 }), 'b3~traces.');

  // ---------------------------------------------------------------- b4: Bandwidth vs latency scaling
  S.add(fx.in(lat.takeawayBadge, { from: 'up', d: 0.4 }), 'b4~Wider-0.2');
  S.add(fx.pulse(lat.takeawayBadge, { scale: 1.05, d: 0.4 }), 'b4~faster');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
