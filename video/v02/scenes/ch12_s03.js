/* ch12_s03 · latencies and bandwidths on the ladder (figs 61, 62)
   Movement 1 (b1): Latency climbs steeply with every step down the ladder.
   Movement 2 (b2): Bandwidth falls in the other direction.
   Movement 3 (b3): 500× latency growth vs 120× bandwidth drop.
   Movement 4 (b4): Programming is the craft of staging data upward. */

V.scene('ch12_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('latencies and bandwidths on the ladder', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Dual Metrics Charts (Atlas Figs 61, 62)
  const dual = ch12DualMetrics(S, { cx: GX, cy: 500 });

  // Takeaway band
  const takeaway = S.takeaway('latency grows 500× and bandwidth drops 120×: stage data upward', {
    tone: 'helps'
  });

  // Initial states
  S.set([dual.bg, dual.title, dual.takeawayPill, takeaway.el], { autoAlpha: 0 });
  S.set([dual.leftCard, dual.leftTitle], { autoAlpha: 0 });
  dual.lElements.forEach(e => S.set([e.lbl, e.bar, e.val], { autoAlpha: 0 }));
  S.set([dual.rightCard, dual.rightTitle], { autoAlpha: 0 });
  dual.rElements.forEach(e => S.set([e.lbl, e.bar, e.val], { autoAlpha: 0 }));

  // ---------------------------------------------------------------- b1: Latency climbs 479x
  S.add(fx.in([dual.bg, dual.title], { from: 'up', d: 0.5 }), 'b1~hardware,-0.2');
  S.add(fx.in([dual.leftCard, dual.leftTitle], { from: 'up', d: 0.5 }), 'b1~latency-0.2');
  dual.lElements.forEach((e, idx) => {
    S.add(fx.in([e.lbl, e.bar, e.val], { from: 'fade', d: 0.4 }), `b1~step:-${0.2 - idx * 0.25}`);
  });
  if (dual.lElements[3]) {
    S.add(fx.pulse([dual.lElements[3].bar, dual.lElements[3].val], { scale: 1.08, d: 0.4 }), 'b1~ladder.');
  }

  // ---------------------------------------------------------------- b2: Bandwidth drops 120x
  S.add(fx.in([dual.rightCard, dual.rightTitle], { from: 'up', d: 0.5 }), 'b2~Bandwidth-0.2');
  dual.rElements.forEach((e, idx) => {
    S.add(fx.in([e.lbl, e.bar, e.val], { from: 'fade', d: 0.4 }), `b2~direction:-${0.2 - idx * 0.25}`);
  });
  if (dual.rElements[0]) {
    S.add(fx.pulse([dual.rElements[0].bar, dual.rElements[0].val], { scale: 1.08, d: 0.4 }), 'b2~direction.');
  }

  // ---------------------------------------------------------------- b3: 500x vs 120x comparison
  S.add(fx.pulse([dual.leftCard, dual.rightCard], { scale: 1.03, d: 0.4 }), 'b3~hundred-0.2');

  // ---------------------------------------------------------------- b4: Stage data upward
  S.add(fx.in(dual.takeawayPill, { from: 'up', d: 0.4 }), 'b4~expensive-0.2');
  S.add(fx.pulse(dual.takeawayPill, { scale: 1.05, d: 0.4 }), 'b4~staging');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
