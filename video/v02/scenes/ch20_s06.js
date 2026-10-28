/* ch20_s06 · geometry and the three bandwidth tiers (figs 114, 115)
   Movement 1 (b1): Leaving the package is punishing due to pure geometry.
   Movement 2 (b2): On-package: 5,120 microscopic wires over millimetres (3,352 GB/s).
   Movement 3 (b3): Off-package: 72 wire pairs over centimetres (450 GB/s, 7.4x drop).
   Movement 4 (b4): Across room: optical cable over metres (50 GB/s, 9.0x drop again). */

V.scene('ch20_s06', S => {
  const { fx } = S;

  // Heading
  const heading = S.heading('geometry and the three bandwidth tiers', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Three tiers visual (Atlas Figs 114, 115)
  const tiers = ch20GeometryTiers(S, { cx: 960, cy: 510 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('distance dictates bandwidth: package to board drops 7×, board to cable drops 9×', {
    tone: 'bytes'
  });

  // Initial states
  S.set([tiers.bg, tiers.title, tiers.footer], { autoAlpha: 0 });
  tiers.colEls.forEach(c => {
    S.set([c.bc, c.tn, c.td, c.tw, c.tc, c.tp], { autoAlpha: 0 });
  });
  S.set([tiers.rulerBox, tiers.rulerLine, tiers.ptIb, tiers.tagIb, tiers.ptNv, tiers.tagNv, tiers.ptHbm, tiers.tagHbm], { autoAlpha: 0 });
  tiers.tickEls.forEach(t => S.set([t.tl, t.tt], { autoAlpha: 0 }));
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Pure geometry question
  S.add(fx.in([tiers.bg, tiers.title], { from: 'fade', d: 0.5 }), 'b1~punishing?-0.2');

  // ---------------------------------------------------------------- b2: On-package 5,120 wires (3,352 GB/s)
  const t1 = tiers.colEls[0];
  S.add(fx.in([t1.bc, t1.tn, t1.td], { from: 'fade', d: 0.4 }), 'b2~package,-0.2');
  S.add(fx.in(t1.tw, { from: 'fade', d: 0.35 }), 'b2~thousand');
  S.add(fx.in([t1.tc, t1.tp], { from: 'fade', d: 0.35 }), 'b2~delivering');
  S.add(fx.in([tiers.rulerBox, tiers.rulerLine, tiers.ptHbm, tiers.tagHbm], { from: 'fade', d: 0.35 }), 'b2~delivering');
  tiers.tickEls.forEach((tk, idx) => {
    S.add(fx.in([tk.tl, tk.tt], { from: 'fade', d: 0.25 }), `b2~delivering:-${0.1 - idx * 0.02}`);
  });

  // ---------------------------------------------------------------- b3: Off-package 72 pairs (450 GB/s, 7.4x drop)
  const t2 = tiers.colEls[1];
  S.add(fx.in([t2.bc, t2.tn, t2.td], { from: 'fade', d: 0.4 }), 'b3~package,-0.2');
  S.add(fx.in(t2.tw, { from: 'fade', d: 0.35 }), 'b3~seventy-two');
  S.add(fx.in([t2.tc, t2.tp], { from: 'fade', d: 0.35 }), 'b3~dropping');
  S.add(fx.in([tiers.ptNv, tiers.tagNv], { from: 'fade', d: 0.35 }), 'b3~dropping');
  S.add(fx.pulse([t2.bc, t2.tp], { scale: 1.02, d: 0.4 }), 'b3~slower.');

  // ---------------------------------------------------------------- b4: InfiniBand cable (50 GB/s, 9.0x drop again) & takeaway
  const t3 = tiers.colEls[2];
  S.add(fx.in([t3.bc, t3.tn, t3.td], { from: 'fade', d: 0.4 }), 'b4~room,-0.2');
  S.add(fx.in(t3.tw, { from: 'fade', d: 0.35 }), 'b4~cable');
  S.add(fx.in([t3.tc, t3.tp], { from: 'fade', d: 0.35 }), 'b4~fifty');
  S.add(fx.in([tiers.ptIb, tiers.tagIb], { from: 'fade', d: 0.35 }), 'b4~fifty');
  S.add(fx.pulse([t3.bc, t3.tp], { scale: 1.02, d: 0.4 }), 'b4~again.');
  S.add(fx.in(tiers.footer, { from: 'up', d: 0.4 }), 'b4~throughput.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
