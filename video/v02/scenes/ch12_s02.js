/* ch12_s02 · less than a thousandth of the model (fig 60)
   Movement 1 (b1): Tally all on-chip fast storage: 121.6 megabytes total.
   Movement 2 (b2): 70B model requires 140 gigabytes.
   Movement 3 (b3): On-chip fast storage is 0.087% of the model (< 1/1,000th).
   Movement 4 (b4): Every token must stream the entire model up from HBM. */

V.scene('ch12_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('less than a thousandth of the model', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Scale diagram (Atlas Fig 60)
  const scaleComp = ch12ModelScale(S, { cx: GX, cy: 500 });

  // Takeaway band
  const takeaway = S.takeaway('there is nowhere on-chip to keep the weights: each token must stream the entire model from HBM', {
    tone: 'bytes'
  });

  // Initial states
  S.set([scaleComp.bg, scaleComp.title, scaleComp.rightCard, scaleComp.takeawayPill, takeaway.el], { autoAlpha: 0 });
  scaleComp.bLines.forEach(l => S.set([l.nl, l.vl], { autoAlpha: 0 }));
  S.set([scaleComp.modelBox, scaleComp.modelLbl1, scaleComp.modelLbl2, scaleComp.chipTiny, scaleComp.chipTinyLbl], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Tally 121.6 MB fast storage
  S.add(fx.in([scaleComp.bg, scaleComp.title], { from: 'up', d: 0.5 }), 'b1~Sum-0.2');
  S.add(fx.in(scaleComp.rightCard, { from: 'up', d: 0.5 }), 'b1~single-0.2');
  scaleComp.bLines.forEach((l, idx) => {
    S.add(fx.in([l.nl, l.vl], { from: 'fade', d: 0.4 }), `b1~registers,-${0.2 - idx * 0.25}`);
  });
  if (scaleComp.bLines[3]) {
    S.add(fx.pulse([scaleComp.bLines[3].nl, scaleComp.bLines[3].vl], { scale: 1.05, d: 0.4 }), 'b1~cache.');
  }

  // ---------------------------------------------------------------- b2: 140 GB model box
  S.add(fx.in([scaleComp.modelBox, scaleComp.modelLbl1, scaleComp.modelLbl2], { from: 'up', d: 0.5 }), 'b2~seventy-billion-parameter-0.2');
  S.add(fx.pulse([scaleComp.modelBox, scaleComp.modelLbl1], { scale: 1.05, d: 0.4 }), 'b2~hundred');

  // ---------------------------------------------------------------- b3: 0.087% tiny corner square
  S.add(fx.in([scaleComp.chipTiny, scaleComp.chipTinyLbl], { from: 'fade', d: 0.5 }), 'b3~holds-0.2');
  S.add(fx.pulse(scaleComp.chipTiny, { scale: 1.2, d: 0.5 }), 'b3~thousandth');

  // ---------------------------------------------------------------- b4: Tokens stream from HBM
  S.add(fx.in(scaleComp.takeawayPill, { from: 'up', d: 0.4 }), 'b4~evicted-0.2');
  S.add(fx.pulse(scaleComp.takeawayPill, { scale: 1.05, d: 0.4 }), 'b4~weights');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
