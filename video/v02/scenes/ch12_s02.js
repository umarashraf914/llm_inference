/* ch12_s02 · less than a thousandth of the model (fig 60)
   Movement 1 (b1): Tally of all fast on-chip memory: 121.6 MB.
   Movement 2 (b2): 121.6 MB fast SRAM vs 140 GB 70B model weights.
   Movement 3 (b3): On-chip storage is 0.087% of the model (< 1/1,000th).
   Movement 4 (b4): Continuous eviction; every token must stream 140 GB from HBM. */

V.scene('ch12_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Less than a thousandth of the model', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Scale diagram
  const scale = ch12ModelScale(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('there is nowhere on-chip to keep the weights: each token must stream the entire model from HBM', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([scale.card, scale.title, scale.modelBox, scale.modelLbl1, scale.modelLbl2], { autoAlpha: 0 });
  S.set([scale.chipTiny, scale.chipTinyLbl, scale.rightCard, scale.takeawayPill], { autoAlpha: 0 });
  scale.bLines.forEach(b => S.set([b.nl, b.vl], { autoAlpha: 0 }));
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Tally fast storage
  S.add(fx.in([scale.card, scale.title], { from: 'scale', d: 0.5 }), 'b1~Sum-0.2');
  S.add(fx.in(scale.rightCard, { from: 'scale', d: 0.4 }), 'b1~storage-0.2');
  scale.bLines.forEach((b, idx) => {
    S.add(fx.in([b.nl, b.vl], { from: 'fade', d: 0.35 }), `b1~registers:-${0.2 - idx * 0.25}`);
  });

  // ---------------------------------------------------------------- b2: 121.6 MB vs 140 GB model
  S.add(fx.in([scale.modelBox, scale.modelLbl1], { from: 'scale', d: 0.5 }), 'b2~Together,-0.2');
  S.add(fx.in(scale.modelLbl2, { from: 'fade', d: 0.5 }), 'b2~Together');
  S.add(fx.pulse([scale.modelBox, scale.modelLbl1], { scale: 1.04, d: 0.4 }), 'b2~forty');

  // ---------------------------------------------------------------- b3: 0.087% ratio (< 1/1,000th)
  S.add(fx.in(scale.chipTiny, { from: 'scale', d: 0.4 }), 'b3~All-0.2');
  S.add(fx.in(scale.chipTinyLbl, { from: 'fade', d: 0.4 }), 'b3~All');
  S.add(fx.pulse([scale.chipTiny, scale.chipTinyLbl], { scale: 1.15, d: 0.4 }), 'b3~eight');

  // ---------------------------------------------------------------- b4: Weights must stream from HBM
  S.add(fx.in(scale.takeawayPill, { from: 'up', d: 0.4 }), 'b4~token\'s-0.2');
  S.add(fx.pulse(scale.takeawayPill, { scale: 1.05, d: 0.4 }), 'b4~weights');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
