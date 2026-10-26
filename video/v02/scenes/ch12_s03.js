/* ch12_s03 · latencies and bandwidths on the ladder (figs 61, 62)
   Movement 1 (b1): Latency climbs steeply down the ladder (1 -> 479 ticks).
   Movement 2 (b2): Bandwidth drops rapidly in reverse (1,536 -> 12.8 B/tick/SM).
   Movement 3 (b3): 479x latency climb vs 120x bandwidth drop.
   Movement 4 (b4): GPU programming is the art of staging data upward. */

V.scene('ch12_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Latencies and bandwidths on the ladder', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Dual metrics cards
  const metrics = ch12DualMetrics(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('latency grows 500× and bandwidth drops 120×: stage data upward', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([metrics.card, metrics.title, metrics.leftCard, metrics.leftTitle, metrics.rightCard, metrics.rightTitle, metrics.takeawayPill], { autoAlpha: 0 });
  metrics.lElements.forEach(e => S.set([e.lbl, e.val], { autoAlpha: 0 }));
  metrics.rElements.forEach(e => S.set([e.lbl, e.val], { autoAlpha: 0 }));
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Latency climbs down ladder
  S.add(fx.in([metrics.card, metrics.title], { from: 'scale', d: 0.5 }), 'b1~hardware,-0.2');
  S.add(fx.in([metrics.leftCard, metrics.leftTitle], { from: 'scale', d: 0.5 }), 'b1~latency-0.2');
  metrics.lElements.forEach((e, idx) => {
    S.add(fx.in([e.lbl, e.val], { from: 'fade', d: 0.35 }), `b1~climbs:-${0.2 - idx * 0.25}`);
  });

  // ---------------------------------------------------------------- b2: Bandwidth falls in reverse
  S.add(fx.in([metrics.rightCard, metrics.rightTitle], { from: 'scale', d: 0.5 }), 'b2~Bandwidth-0.2');
  metrics.rElements.forEach((e, idx) => {
    S.add(fx.in([e.lbl, e.val], { from: 'fade', d: 0.35 }), `b2~falls:-${0.2 - idx * 0.25}`);
  });

  // ---------------------------------------------------------------- b3: 479x latency climb vs 120x bandwidth drop
  S.add(fx.pulse([metrics.leftCard, metrics.lElements[3].val], { scale: 1.05, d: 0.4 }), 'b3~five');
  S.add(fx.pulse([metrics.rightCard, metrics.rElements[0].val], { scale: 1.05, d: 0.4 }), 'b3~twenty');

  // ---------------------------------------------------------------- b4: Stage data upward
  S.add(fx.in(metrics.takeawayPill, { from: 'up', d: 0.4 }), 'b4~craft-0.2');
  S.add(fx.pulse(metrics.takeawayPill, { scale: 1.05, d: 0.4 }), 'b4~staging');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
