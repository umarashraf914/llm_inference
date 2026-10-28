/* ch00_s01 · a thousand trillion operations, waiting (cold open)
   Movement 1 (b1): Specification sheet: H100 compute die performs 989.4 trillion operations / sec.
   Movement 2 (b2): 29 mm x 29 mm (814 mm²) postage stamp silicon die with 132 SM micro-grid.
   Movement 3 (b3): One 30 ms token timeline: < 1% arithmetic calculation, > 99% waiting for memory. */

V.scene('ch00_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Scene heading
  const heading = S.heading('A thousand trillion operations, waiting', { y: 130 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Die holder group (centered at GX = 960 initially, slides to 710 when stat arrives)
  const dieHolder = S.g();
  const die = ch00Die(S, { cx: GX, cy: 400, size: 240, parent: dieHolder });

  // Throughput headline stat (right of die)
  const statGroup = S.g();
  const statX = 1210, statY = 380;
  const statCard = S.card({
    x: statX - 190, y: statY - 95, w: 380, h: 190,
    tone: 'compute', title: ''
  }, statGroup);
  const statTitle = S.text('arithmetic throughput', {
    x: statX, y: statY - 48, size: 22, anchor: 'middle', color: 'compute', weight: 650
  }, statGroup);
  const counterVal = S.counter({
    x: statX, y: statY + 4, size: 48, value: 0, anchor: 'middle',
    color: 'compute', family: 'mono', weight: 700
  }, statGroup);
  const statSub = S.text('trillion operations / second', {
    x: statX, y: statY + 52, size: 20, anchor: 'middle', color: 'muted', weight: 550
  }, statGroup);

  // Proportional 30 ms token execution timeline (bottom)
  const timeline = ch00ProportionalTimeline(S, { cx: GX, cy: 740, w: 1380, h: 56 });

  // Takeaway band
  const takeaway = S.takeaway('the vast engine of arithmetic spends more than ninety-nine percent of its time waiting', {
    tone: 'bytes'
  });

  // Initial hidden states
  S.set([
    die.substrate, die.pinGroup, die.dieBody, die.pin1, die.smGrid, die.crossBus,
    die.topBracket, die.rightBracket, die.areaPill, die.dieLabel,
    statGroup, timeline.track, timeline.calcRect, timeline.calcLeader,
    timeline.waitRect, timeline.linesG, timeline.waitLabel, timeline.timeBracket,
    takeaway
  ], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Spec sheet thousand trillion ops
  // Die appears centered first (Rule 7)
  S.add(fx.in([die.substrate, die.pinGroup, die.dieBody, die.pin1], { from: 'scale', d: 0.6 }), 'b1~modern-0.2');
  S.add(fx.in(die.dieLabel, { from: 'fade', d: 0.4 }), 'b1~modern+0.2');

  // When stat arrives, die slides left to make room (Rule 7)
  S.add(gsap.to(dieHolder, { x: -250, duration: 0.6, ease: 'power2.inOut' }), 'b1~thousand-0.3');
  S.add(fx.in(statGroup, { from: 'right', d: 0.5 }), 'b1~thousand-0.2');
  S.add(fx.count(counterVal, 0, 989.4, { d: 2.2, ease: 'power2.out', fmt: v => v.toFixed(1) }), 'b1~thousand-0.1');

  // ---------------------------------------------------------------- b2: 29 mm x 29 mm postage stamp die
  S.add(fx.in([die.topBracket, die.rightBracket], { from: 'scale', d: 0.45 }), 'b2~square-0.2');
  S.add(fx.in(die.areaPill, { from: 'up', d: 0.4 }), 'b2~postage-0.1');
  S.add(fx.in([die.smGrid, die.crossBus], { from: 'fade', d: 0.5 }), 'b2~silicon');
  // Ripple across the 132 SMs
  S.add(gsap.fromTo(die.smCells,
    { fillOpacity: 0.12, strokeOpacity: 0.35 },
    { fillOpacity: 0.7, strokeOpacity: 1, duration: 0.3, stagger: { each: 0.005, from: 'center' }, yoyo: true, repeat: 1 }
  ), 'b2~stamp.');

  // ---------------------------------------------------------------- b3: > 99% waiting timeline
  S.add(fx.in([timeline.track, timeline.calcRect, timeline.calcLeader, timeline.timeBracket], { from: 'up', d: 0.5 }), 'b3~language-0.2');
  S.add(fx.in([timeline.waitRect, timeline.linesG, timeline.waitLabel], { from: 'fade', d: 0.6 }), 'b3~waiting.');
  S.add(fx.pulse(timeline.calcRect, { scale: 1.08, d: 0.45 }), 'b3~waiting.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b3>-0.8');
});
