/* ch20_s06 · geometry and the three bandwidth tiers (figs 114, 115)
   Movement 1 (b1): Leaving the package is punishing due to pure geometry.
   Movement 2 (b2): On-package: 5,120 microscopic wires over millimetres (3,352 GB/s).
   Movement 3 (b3): Off-package: 72 wire pairs over centimetres (450 GB/s, 7.4x drop).
   Movement 4 (b4): Across room: optical cable over metres (50 GB/s, 9.0x drop again). */

V.scene('ch20_s06', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Geometry and the three bandwidth tiers', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Three tiers visual
  const tiers = ch20ThreeTiers(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('distance dictates bandwidth: package to board drops 7×; board to cable drops 9×', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([tiers.card, tiers.title, tiers.footer], { autoAlpha: 0 });
  tiers.colEls.forEach(c => {
    S.set(c.bc, { autoAlpha: 0 });
    S.set([c.tn, c.td, c.tw, c.tb], { autoAlpha: 0 });
  });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Pure geometry question
  S.add(fx.in([tiers.card, tiers.title], { from: 'scale', d: 0.5 }), 'b1~punishing?-0.2');

  // ---------------------------------------------------------------- b2: On-package 5,120 wires
  const t1 = tiers.colEls[0];
  S.add(fx.in(t1.bc, { from: 'scale', d: 0.4 }), 'b2~package,-0.2');
  S.add(fx.in([t1.tn, t1.td], { from: 'fade', d: 0.35 }), 'b2~package,');
  S.add(fx.in(t1.tw, { from: 'up', d: 0.35 }), 'b2~thousand');
  S.add(fx.in(t1.tb, { from: 'up', d: 0.35 }), 'b2~delivering');

  // ---------------------------------------------------------------- b3: Off-package 72 pairs (7.4x drop)
  const t2 = tiers.colEls[1];
  S.add(fx.in(t2.bc, { from: 'scale', d: 0.4 }), 'b3~package,-0.2');
  S.add(fx.in([t2.tn, t2.td], { from: 'fade', d: 0.35 }), 'b3~package,');
  S.add(fx.in(t2.tw, { from: 'up', d: 0.35 }), 'b3~seventy-two');
  S.add(fx.in(t2.tb, { from: 'up', d: 0.35 }), 'b3~dropping');
  S.add(fx.pulse([t2.bc, t2.tb], { scale: 1.04, d: 0.4 }), 'b3~slower.');

  // ---------------------------------------------------------------- b4: InfiniBand cable (9.0x drop again) & takeaway
  const t3 = tiers.colEls[2];
  S.add(fx.in(t3.bc, { from: 'scale', d: 0.4 }), 'b4~room,-0.2');
  S.add(fx.in([t3.tn, t3.td], { from: 'fade', d: 0.35 }), 'b4~room,');
  S.add(fx.in(t3.tw, { from: 'up', d: 0.35 }), 'b4~cable');
  S.add(fx.in(t3.tb, { from: 'up', d: 0.35 }), 'b4~fifty');
  S.add(fx.pulse([t3.bc, t3.tb], { scale: 1.04, d: 0.4 }), 'b4~again.');
  S.add(fx.in(tiers.footer, { from: 'up', d: 0.4 }), 'b4~throughput.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
