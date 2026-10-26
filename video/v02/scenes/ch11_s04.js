/* ch11_s04 · why there must be a ladder (fig 56)
   Movement 1 (b1): Universal storage trade: Speed (latency) vs Capacity (bytes).
   Movement 2 (b2): The impossible corner: no storage is simultaneously fastest and vastest.
   Movement 3 (b3): Speed demands microscopic physical proximity to compute units.
   Movement 4 (b4): Capacity demands physical surface area; memory must be a ladder. */

V.scene('ch11_s04', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Why there must be a ladder', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Tradeoff Plot
  const plot = ch11TradeoffPlot(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('speed requires proximity, capacity requires area: memory must be a ladder', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([plot.card, plot.title, plot.impBox, plot.impLbl1, plot.impLbl2, plot.ladderPill], { autoAlpha: 0 });
  plot.ptEls.forEach(p => S.set([p.c, p.t], { autoAlpha: 0 }));
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Speed vs capacity trade
  S.add(fx.in([plot.card, plot.title], { from: 'scale', d: 0.5 }), 'b1~computer-0.2');
  plot.ptEls.forEach((p, idx) => {
    S.add(fx.in(p.c, { from: 'scale', d: 0.4 }), `b1~speed:-${0.2 - idx * 0.25}`);
    S.add(fx.in(p.t, { from: 'fade', d: 0.4 }), `b1~speed:-${0.2 - idx * 0.25}`);
  });

  // ---------------------------------------------------------------- b2: The empty top-right corner
  S.add(fx.in([plot.impBox, plot.impLbl1], { from: 'scale', d: 0.5 }), 'b2~top-right-0.2');
  S.add(fx.in(plot.impLbl2, { from: 'fade', d: 0.5 }), 'b2~top-right');
  S.add(fx.pulse([plot.impBox, plot.impLbl1], { scale: 1.05, d: 0.4 }), 'b2~fastest');

  // ---------------------------------------------------------------- b3: Speed requires proximity
  S.add(fx.pulse([plot.ptEls[0].c, plot.ptEls[0].t, plot.ptEls[1].c, plot.ptEls[1].t], {
    scale: 1.1, stagger: 0.1, d: 0.5
  }), 'b3~proximity:-0.2');

  // ---------------------------------------------------------------- b4: Capacity requires area; memory is a ladder
  S.add(fx.pulse([plot.ptEls[3].c, plot.ptEls[3].t], { scale: 1.1, d: 0.4 }), 'b4~surface-0.2');
  S.add(fx.in(plot.ladderPill, { from: 'up', d: 0.4 }), 'b4~solution-0.2');
  S.add(fx.pulse(plot.ladderPill, { scale: 1.05, d: 0.4 }), 'b4~ladder.');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
