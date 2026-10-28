/* ch11_s03 · the two hundred and seventy nanosecond journey (fig 55)
   Movement 1 (b1): Total HBM memory load journey: ~273 ns (479 clock ticks).
   Movement 2 (b2): Cell readout takes only 27.5 ns (barely 10% of total time).
   Movement 3 (b3): 90% is transit across caches, crossbar, queues, and package wires.
   Movement 4 (b4): Wider buses increase bandwidth, but cannot speed up transit latency. */

V.scene('ch11_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('the two hundred and seventy nanosecond journey', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Latency breakdown bar (Atlas Fig 55)
  const lat = ch11LatencyBreakdown(S, { cx: GX, cy: 500 });

  // Takeaway band
  const takeaway = S.takeaway('bandwidth scales with wires; latency is bounded by physical transit distance', {
    tone: 'bytes'
  });

  // Initial states
  S.set([lat.bg, lat.title, lat.transitBar, lat.transitLbl, lat.cellBar, lat.cellLbl, lat.takeawayBadge, takeaway.el], { autoAlpha: 0 });
  lat.stageEls.forEach(s => S.set([s.sc, s.sn, s.sd], { autoAlpha: 0 }));

  // ---------------------------------------------------------------- b1: 273 nanoseconds total journey
  S.add(fx.in([lat.bg, lat.title], { from: 'up', d: 0.5 }), 'b1~thread-0.2');
  S.add(fx.in([lat.transitBar, lat.transitLbl], { from: 'up', d: 0.5 }), 'b1~two-0.2');
  S.add(fx.in([lat.cellBar, lat.cellLbl], { from: 'up', d: 0.5 }), 'b1~seventy-three-0.2');

  // ---------------------------------------------------------------- b2: Cell activation is only 27.5 ns (10%)
  S.add(fx.pulse([lat.cellBar, lat.cellLbl], { scale: 1.1, d: 0.5 }), 'b2~twenty-seven-0.2');
  S.add(fx.recolor(lat.cellBar, {
    fill: S.tone('helps'),
    stroke: S.tone('helps'),
    d: 0.4
  }), 'b2~tenth');

  // ---------------------------------------------------------------- b3: 90% is transit across stages
  lat.stageEls.forEach((s, idx) => {
    S.add(fx.in([s.sc, s.sn, s.sd], { from: 'up', d: 0.4 }), `b3~journey:-${0.2 - idx * 0.25}`);
  });
  S.add(fx.pulse(lat.stageEls.map(s => s.sc), { scale: 1.05, stagger: 0.05, d: 0.4 }), 'b3~traces.');

  // ---------------------------------------------------------------- b4: Bandwidth vs latency scaling
  S.add(fx.in(lat.takeawayBadge, { from: 'fade', d: 0.4 }), 'b4~Wider-0.2');
  S.add(fx.pulse(lat.takeawayBadge, { scale: 1.05, d: 0.4 }), 'b4~faster');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
