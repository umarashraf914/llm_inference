/* ch10_s02 · the active mask and nested forks (fig 51)
   Movement 1 (b1): 32-bit active mask register controls which lanes commit output.
   Movement 2 (b2): Inactive lanes still occupy issue slots; results discarded.
   Movement 3 (b3): Nested forks compound exponentially (2 -> 4 -> 8 passes).
   Movement 4 (b4): Branching is free when warps agree; data splits destroy throughput. */

V.scene('ch10_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('the active mask and nested forks', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Upper Section: Hardware Active Mask Register (Atlas Fig 51)
  const mask = ch10ActiveMaskRegister(S, { cx: GX, cy: 285, w: 1360, h: 220 });

  // Lower Section: Nested Branch Efficiency Bar Chart (Atlas Fig 51)
  const tree = ch10NestedForksBars(S, { cx: GX, cy: 605, w: 1360, h: 330 });

  // Takeaway band
  const takeaway = S.takeaway('branching is free when warps agree; data-dependent splits destroy efficiency', {
    tone: 'helps'
  });

  // Initial visibility
  S.set([mask.group, tree.group, takeaway.el], { autoAlpha: 0 });
  tree.rows.forEach(r => S.set([r.lbl, r.bar, r.val], { autoAlpha: 0 }));
  S.set(tree.agreeBadge, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Active mask register
  S.add(fx.in(mask.group, { from: 'up', d: 0.5 }), 'b1~hardware-0.2');
  const ones = mask.bits.filter(b => b.isOne).map(b => b.box);
  S.add(fx.pulse(ones, { scale: 1.1, d: 0.4 }), 'b1~thirty-two');

  // ---------------------------------------------------------------- b2: Inactive lanes occupy slot & discard
  const zeros = mask.bits.filter(b => !b.isOne).map(b => b.box);
  S.add(fx.pulse(zeros, { scale: 1.1, d: 0.4 }), 'b2~occupy-0.2');
  S.add(fx.pulse(mask.note, { scale: 1.05, d: 0.4 }), 'b2~discard');

  // ---------------------------------------------------------------- b3: Nested forks penalty bars
  S.add(fx.in(tree.group, { from: 'up', d: 0.5 }), 'b3~nested-0.2');
  tree.rows.forEach((r, idx) => {
    S.add(fx.in([r.lbl, r.bar, r.val], { from: 'up', d: 0.4 }), `b3~passes:-${0.2 - idx * 0.25}`);
  });
  if (tree.rows[3]) {
    S.add(fx.pulse(tree.rows[3].bar, { scale: 1.06, d: 0.4 }), 'b3~eight');
  }

  // ---------------------------------------------------------------- b4: Agreeing warps are free
  S.add(fx.in(tree.agreeBadge, { from: 'up', d: 0.5 }), 'b4~costs-0.2');
  S.add(fx.pulse(tree.agreeBadge, { scale: 1.06, d: 0.5 }), 'b4~nothing');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
