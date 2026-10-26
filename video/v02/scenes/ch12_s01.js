/* ch12_s01 · the four rungs and their scope (figs 57, 58, 59)
   Movement 1 (b1): Four rungs: Registers, L1/Shared, L2, HBM.
   Movement 2 (b2): Chip-wide totals: 34.6 MB registers vs 80 GB HBM (2,500x).
   Movement 3 (b3): Scope definition: Registers belong strictly to 1 private thread.
   Movement 4 (b4): Scope expands: Shared = 1 block, L2 = 132 SMs, HBM = all chips. */

V.scene('ch12_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('The four rungs and their scope', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Ladder rows
  const ladder = ch12LadderRows(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('to exchange data, threads must meet at a level they both see', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([ladder.card, ladder.title, ladder.footer], { autoAlpha: 0 });
  ladder.rows.forEach(r => {
    S.set(r.rc, { autoAlpha: 0 });
    S.set([r.rName, r.rCapSM, r.rCapChip, r.rScope], { autoAlpha: 0 });
  });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Four rungs appear
  S.add(fx.in([ladder.card, ladder.title], { from: 'scale', d: 0.5 }), 'b1~organizes-0.2');
  ladder.rows.forEach((r, idx) => {
    S.add(fx.in(r.rc, { from: 'scale', d: 0.4 }), `b1~rungs:-${0.2 - idx * 0.25}`);
    S.add(fx.in(r.rName, { from: 'fade', d: 0.35 }), `b1~rungs:-${0.2 - idx * 0.25}`);
    S.add(fx.in(r.rCapSM, { from: 'fade', d: 0.35 }), `b1~rungs:-${0.2 - idx * 0.25}`);
  });

  // ---------------------------------------------------------------- b2: Chip-wide capacities & 2500x span
  ladder.rows.forEach((r, idx) => {
    S.add(fx.in(r.rCapChip, { from: 'fade', d: 0.4 }), `b2~Counted:-${0.1 - idx * 0.2}`);
  });
  S.add(fx.pulse([ladder.rows[0].rc, ladder.rows[3].rc], { scale: 1.04, d: 0.4 }), 'b2~twenty-five');

  // ---------------------------------------------------------------- b3: Scope definition (Registers = 1 thread)
  S.add(fx.in(ladder.rows[0].rScope, { from: 'fade', d: 0.4 }), 'b3~scope:-0.2');
  S.add(fx.pulse(ladder.rows[0].rc, { scale: 1.05, d: 0.4 }), 'b3~thread');

  // ---------------------------------------------------------------- b4: Scope expands (Block, SMs, Entire system)
  S.add(fx.in(ladder.rows[1].rScope, { from: 'fade', d: 0.4 }), 'b4~Shared-0.2');
  S.add(fx.in(ladder.rows[2].rScope, { from: 'fade', d: 0.4 }), 'b4~multiprocessors.');
  S.add(fx.in(ladder.rows[3].rScope, { from: 'fade', d: 0.4 }), 'b4~everything,');
  S.add(fx.in(ladder.footer, { from: 'up', d: 0.4 }), 'b4~chips.');
  S.add(fx.pulse(ladder.footer, { scale: 1.05, d: 0.4 }), 'b4~chips.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
