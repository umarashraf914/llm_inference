/* ch20_s02 · what an interconnect link is (fig 110)
   Movement 1 (b1): Model split across chips requires continuous communication.
   Movement 2 (b2): Interconnect links obey width * frequency bus arithmetic.
   Movement 3 (b3): Distance dictates wire count, speed, and energy.
   Movement 4 (b4): Three tiers: Local HBM, Neighbour NVLink, Network InfiniBand. */

V.scene('ch20_s02', S => {
  const { fx } = S;

  // Heading
  const heading = S.heading('what an interconnect link is', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Interconnect link visual (Atlas Fig 110)
  const lw = ch20LinkWires(S, { cx: 960, cy: 510 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('an interconnect link is a bundle of physical differential wires obeying bus arithmetic', {
    tone: 'struct'
  });

  // Initial states
  S.set([lw.bg, lw.title, lw.aBox, lw.aTitle, lw.aDie, lw.aDieLbl, lw.aDieSub, lw.aPhy, lw.aPhyLbl, lw.aSerdesLbl], { autoAlpha: 0 });
  S.set([lw.bBox, lw.bTitle, lw.bDie, lw.bDieLbl, lw.bDieSub, lw.bPhy, lw.bPhyLbl, lw.bSerdesLbl], { autoAlpha: 0 });
  lw.wireLines.forEach(l => S.set(l, { autoAlpha: 0 }));
  S.set([lw.wirePill, lw.ruleBox, lw.ruleT1, lw.ruleT2], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Interconnect link joins chips
  S.add(fx.in([lw.bg, lw.title], { from: 'fade', d: 0.5 }), 'b1~model-0.2');
  S.add(fx.in([lw.aBox, lw.aTitle, lw.aDie, lw.aDieLbl, lw.aDieSub], { from: 'fade', d: 0.4 }), 'b1~model');

  // ---------------------------------------------------------------- b2: Width * frequency arithmetic & wire lanes
  S.add(fx.in([lw.bBox, lw.bTitle, lw.bDie, lw.bDieLbl, lw.bDieSub], { from: 'fade', d: 0.4 }), 'b2~bundle-0.2');
  S.add(fx.in([lw.aPhy, lw.aPhyLbl, lw.aSerdesLbl, lw.bPhy, lw.bPhyLbl, lw.bSerdesLbl], { from: 'fade', d: 0.4 }), 'b2~bundle');
  lw.wireLines.forEach((l, idx) => {
    S.add(fx.in(l, { from: 'fade', d: 0.35 }), `b2~bundle:-${0.2 - idx * 0.05}`);
  });
  S.add(fx.in(lw.wirePill, { from: 'up', d: 0.4 }), 'b2~bundle');

  // ---------------------------------------------------------------- b3: Distance difference & energy penalty
  S.add(fx.in([lw.ruleBox, lw.ruleT1], { from: 'fade', d: 0.4 }), 'b3~distance.-0.2');
  S.add(fx.in(lw.ruleT2, { from: 'fade', d: 0.4 }), 'b3~distance.');

  // ---------------------------------------------------------------- b4: Three tiers and takeaway
  S.add(fx.pulse([lw.aBox, lw.bBox, lw.wirePill], { scale: 1.02, d: 0.4 }), 'b4~slower');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
