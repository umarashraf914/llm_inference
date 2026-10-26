/* ch10_s02 · the active mask and nested forks (fig 51)
   Movement 1 (b1): 32-bit active mask register controls which lanes commit output.
   Movement 2 (b2): Inactive lanes still occupy issue slots; results discarded.
   Movement 3 (b3): Nested forks compound exponentially (2 -> 4 -> 8 passes).
   Movement 4 (b4): Branching is free when warps agree; data splits destroy throughput. */

V.scene('ch10_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('The active mask and nested forks', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Upper Card: Active Bitmask Register
  const mask = ch10ActiveMask(S, { cx: GX, cy: 330, w: 1360, h: 230 });

  // Lower Card: Nested Branch Tree / Efficiency Chart
  const tree = ch10NestedTree(S, { cx: GX, cy: 660, w: 1360, h: 290 });

  // Agreement highlight pill
  const agreementPill = S.pill('WHEN ALL 32 LANES AGREE: 1 PASS · 100% PEAK EFFICIENCY · ZERO PENALTY', {
    x: GX, y: 840, h: 44, tone: 'helps', size: 20, weight: 700
  });

  // Concluding Takeaway pill
  const takeaway = S.pill('branching is free when warps agree; data-dependent splits destroy efficiency', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([mask.card, mask.title, mask.maskExplain], { autoAlpha: 0 });
  mask.bits.forEach(b => S.set([b.box, b.val], { autoAlpha: 0 }));
  S.set([tree.card, tree.title], { autoAlpha: 0 });
  tree.elements.forEach(e => S.set([e.lbl, e.bar, e.val], { autoAlpha: 0 }));
  S.set(agreementPill, { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Active mask register
  S.add(fx.in([mask.card, mask.title], { from: 'scale', d: 0.5 }), 'b1~hardware-0.2');
  S.add(fx.in(mask.maskExplain, { from: 'fade', d: 0.5 }), 'b1~hardware');
  S.add(fx.in(mask.bits.map(b => b.box), { from: 'scale', stagger: 0.015, d: 0.4 }), 'b1~using');
  S.add(fx.in(mask.bits.map(b => b.val), { from: 'fade', stagger: 0.01, d: 0.3 }), 'b1~thirty-two');

  // ---------------------------------------------------------------- b2: Inactive lanes occupy slot & discard
  S.add(fx.pulse(mask.bits.filter(b => !b.isOne).map(b => b.box), {
    scale: 1.08, stagger: 0.02, d: 0.4
  }), 'b2~occupy-0.2');
  S.add(fx.pulse(mask.maskExplain, { scale: 1.04, d: 0.4 }), 'b2~discard');

  // ---------------------------------------------------------------- b3: Nested forks penalty bars
  S.add(fx.in([tree.card, tree.title], { from: 'up', d: 0.5 }), 'b3~nested-0.2');
  tree.elements.forEach((e, idx) => {
    S.add(fx.in([e.lbl, e.bar, e.val], { from: 'up', d: 0.4 }), `b3~passes:-${0.2 - idx * 0.3}`);
  });
  S.add(fx.pulse(tree.elements[2].bar, { scale: 1.05, d: 0.4 }), 'b3~eight');

  // ---------------------------------------------------------------- b4: Agreeing warps are free
  // Flip all bits in the mask to 1
  mask.bits.forEach(b => {
    S.add(fx.recolor(b.box, {
      fill: S.tone('helps', 0.25),
      stroke: S.tone('helps', 0.85),
      d: 0.3
    }), 'b4~costs-0.2');
  });
  S.add(fx.in(agreementPill, { from: 'up', d: 0.5 }), 'b4~nothing');
  S.add(fx.pulse(agreementPill, { scale: 1.05, d: 0.4 }), 'b4~disagree.');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
