/* ch15_s03 · the eightfold ridge climb at narrow precision (fig 80)
   Movement 1 (b1): 16-bit ridge leveled off; narrow format ridge climbs dramatically.
   Movement 2 (b2): Narrow formats: FP16 -> FP8 (Hopper) -> FP4 (Blackwell).
   Movement 3 (b3): Halving bits doubles compute with 0 bandwidth multiplier.
   Movement 4 (b4): 8.1x ridge climb: 139 (V100) -> 1,125 op/B (B200). */

V.scene('ch15_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('The eightfold ridge climb at narrow precision', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Narrow ridge visual
  const nr = ch15NarrowRidge(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('narrower formats accelerate compute far faster than memory', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([nr.card, nr.title, nr.footer], { autoAlpha: 0 });
  nr.rowEls.forEach(r => {
    S.set(r.rc, { autoAlpha: 0 });
    S.set([r.fg, r.ff, r.fr, r.fa], { autoAlpha: 0 });
  });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Narrow format climb
  S.add(fx.in([nr.card, nr.title], { from: 'scale', d: 0.5 }), 'b1~sixteen-0.2');
  S.add(fx.in(nr.rowEls[0].rc, { from: 'scale', d: 0.4 }), 'b1~doubled-0.2');
  S.add(fx.in([nr.rowEls[0].fg, nr.rowEls[0].ff, nr.rowEls[0].fr, nr.rowEls[0].fa], { from: 'fade', d: 0.4 }), 'b1~doubled');

  // ---------------------------------------------------------------- b2: FP8 & FP4 introduction
  S.add(fx.in(nr.rowEls[1].rc, { from: 'scale', d: 0.4 }), 'b2~generation-0.2');
  S.add(fx.in([nr.rowEls[1].fg, nr.rowEls[1].ff, nr.rowEls[1].fr, nr.rowEls[1].fa], { from: 'fade', d: 0.4 }), 'b2~generation');
  S.add(fx.in(nr.rowEls[2].rc, { from: 'scale', d: 0.4 }), 'b2~eight-bit-0.2');
  S.add(fx.in([nr.rowEls[2].fg, nr.rowEls[2].ff, nr.rowEls[2].fr, nr.rowEls[2].fa], { from: 'fade', d: 0.4 }), 'b2~eight-bit');
  S.add(fx.in(nr.rowEls[3].rc, { from: 'scale', d: 0.4 }), 'b2~four-bit-0.2');
  S.add(fx.in([nr.rowEls[3].fg, nr.rowEls[3].ff, nr.rowEls[3].fr, nr.rowEls[3].fa], { from: 'fade', d: 0.4 }), 'b2~four-bit');

  // ---------------------------------------------------------------- b3: Halving bits doubles compute
  S.add(fx.pulse([nr.rowEls[2].rc, nr.rowEls[3].rc], { scale: 1.04, d: 0.4 }), 'b3~doubles');

  // ---------------------------------------------------------------- b4: 8-fold climb to 1,125 op/B
  S.add(fx.pulse([nr.rowEls[3].fr, nr.rowEls[3].fa], { scale: 1.1, d: 0.4 }), 'b4~eleven');
  S.add(fx.in(nr.footer, { from: 'up', d: 0.4 }), 'b4~climb.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
