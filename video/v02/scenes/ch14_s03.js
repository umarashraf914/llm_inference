/* ch14_s03 · strides and the eightfold cliff (figs 73, 74, 75)
   Movement 1 (b1): Definition of stride.
   Movement 2 (b2): Stride 1: 4 sectors, 100% efficiency.
   Movement 3 (b3): Stride 2 (50%) and Stride 4 (25%).
   Movement 4 (b4): Stride 8: 32 sectors, 12.5% efficiency (8x cliff).
   Movement 5 (b5): Beyond stride 8 waste floors at 87.5%; making every byte count. */

V.scene('ch14_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Strides and the eightfold cliff', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Stride progression visual
  const sc = ch14StrideCliff(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('coalescing ensures every fetched byte is consumed; uncoalesced strides throw 87.5% away', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([sc.card, sc.title, sc.footer], { autoAlpha: 0 });
  sc.rowEls.forEach(r => {
    S.set(r.rc, { autoAlpha: 0 });
    S.set([r.sn, r.ss, r.se], { autoAlpha: 0 });
  });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Stride definition
  S.add(fx.in([sc.card, sc.title], { from: 'scale', d: 0.5 }), 'b1~Stride-0.2');

  // ---------------------------------------------------------------- b2: Stride 1 (100% efficiency)
  S.add(fx.in(sc.rowEls[0].rc, { from: 'scale', d: 0.4 }), 'b2~stride-0.2');
  S.add(fx.in([sc.rowEls[0].sn, sc.rowEls[0].ss, sc.rowEls[0].se], { from: 'fade', d: 0.4 }), 'b2~one,');
  S.add(fx.pulse([sc.rowEls[0].rc, sc.rowEls[0].se], { scale: 1.04, d: 0.4 }), 'b2~percent.');

  // ---------------------------------------------------------------- b3: Stride 2 & Stride 4
  S.add(fx.in(sc.rowEls[1].rc, { from: 'scale', d: 0.4 }), 'b3~stride-0.2');
  S.add(fx.in([sc.rowEls[1].sn, sc.rowEls[1].ss, sc.rowEls[1].se], { from: 'fade', d: 0.4 }), 'b3~two,');
  S.add(fx.in(sc.rowEls[2].rc, { from: 'scale', d: 0.4 }), 'b3~sixteen:-0.2');
  S.add(fx.in([sc.rowEls[2].sn, sc.rowEls[2].ss, sc.rowEls[2].se], { from: 'fade', d: 0.4 }), 'b3~sixteen:');

  // ---------------------------------------------------------------- b4: Stride 8 (The 8x cliff)
  S.add(fx.in(sc.rowEls[3].rc, { from: 'scale', d: 0.4 }), 'b4~stride-0.2');
  S.add(fx.in([sc.rowEls[3].sn, sc.rowEls[3].ss, sc.rowEls[3].se], { from: 'fade', d: 0.4 }), 'b4~eight');
  S.add(fx.pulse([sc.rowEls[3].rc, sc.rowEls[3].se], { scale: 1.05, d: 0.4 }), 'b4~thousand');

  // ---------------------------------------------------------------- b5: Stride 16+ & floor cap
  S.add(fx.in(sc.rowEls[4].rc, { from: 'scale', d: 0.4 }), 'b5~Beyond-0.2');
  S.add(fx.in([sc.rowEls[4].sn, sc.rowEls[4].ss, sc.rowEls[4].se], { from: 'fade', d: 0.4 }), 'b5~waste');
  S.add(fx.in(sc.footer, { from: 'up', d: 0.4 }), 'b5~count.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
