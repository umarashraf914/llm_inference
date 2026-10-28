/* ch12_s01 · the four rungs and their scope (figs 57, 58, 59)
   Movement 1 (b1): 4 storage rungs: Registers, L1/Shared, L2, HBM.
   Movement 2 (b2): 34.6 MB registers vs 80 GB HBM (2,500× capacity span).
   Movement 3 (b3): Scope of registers: 1 private thread.
   Movement 4 (b4): Scope expanding: block, multiprocessor, whole package. */

V.scene('ch12_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('the four rungs and their scope', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Ladder Rows (Atlas Figs 58, 59)
  const ladder = ch12LadderRows(S, { cx: GX, cy: 500 });

  // Takeaway band
  const takeaway = S.takeaway('to exchange data, threads must meet at a level they both see', {
    tone: 'struct'
  });

  // Initial states
  S.set([ladder.bg, ladder.title, ladder.footer, takeaway.el], { autoAlpha: 0 });
  ladder.rows.forEach(r => S.set([r.rc, r.rName, r.rCapSM, r.rCapChip, r.rScope], { autoAlpha: 0 }));

  // ---------------------------------------------------------------- b1: 4 Rungs intro
  S.add(fx.in([ladder.bg, ladder.title], { from: 'up', d: 0.5 }), 'b1~organizes-0.2');
  ladder.rows.forEach((r, idx) => {
    S.add(fx.in([r.rc, r.rName], { from: 'up', d: 0.4 }), `b1~rungs:-${0.2 - idx * 0.25}`);
  });

  // ---------------------------------------------------------------- b2: Capacities across chip (2,500x)
  ladder.rows.forEach((r, idx) => {
    S.add(fx.in([r.rCapSM, r.rCapChip], { from: 'fade', d: 0.4 }), `b2~megabytes,-${0.2 - idx * 0.25}`);
  });
  if (ladder.rows[3]) {
    S.add(fx.pulse([ladder.rows[3].rc, ladder.rows[3].rCapChip], { scale: 1.05, d: 0.4 }), 'b2~twenty-five');
  }

  // ---------------------------------------------------------------- b3: Scope of registers (1 thread)
  if (ladder.rows[0]) {
    S.add(fx.in(ladder.rows[0].rScope, { from: 'fade', d: 0.4 }), 'b3~scope:-0.2');
    S.add(fx.pulse([ladder.rows[0].rc, ladder.rows[0].rScope], { scale: 1.05, d: 0.4 }), 'b3~nobody');
  }

  // ---------------------------------------------------------------- b4: Block, L2, and HBM scope
  if (ladder.rows[1] && ladder.rows[2] && ladder.rows[3]) {
    S.add(fx.in([ladder.rows[1].rScope, ladder.rows[2].rScope, ladder.rows[3].rScope], { from: 'fade', stagger: 0.1, d: 0.4 }), 'b4~block.-0.2');
    S.add(fx.pulse(ladder.rows[3].rScope, { scale: 1.05, d: 0.4 }), 'b4~chips.');
  }
  S.add(fx.in(ladder.footer, { from: 'fade', d: 0.4 }), 'b4~chips.-0.2');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
