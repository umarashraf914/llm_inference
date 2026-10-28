/* ch14_s03 · strides and the eightfold cliff (figs 73, 74, 75)
   Movement 1 (b1): Stride definition: distance between numbers requested by adjacent threads.
   Movement 2 (b2): Stride 1: 4 sectors, 100% efficiency.
   Movement 3 (b3): Stride 2 (8 sectors, 50%) -> Stride 4 (16 sectors, 25%).
   Movement 4 (b4): Stride 8: 32 sectors, 12.5% efficiency (8× cliff).
   Movement 5 (b5): Beyond stride 8 waste is capped; make every byte count. */

V.scene('ch14_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('strides and the eightfold cliff', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Stride Cliff Progression (Atlas Figs 73, 74, 75)
  const cliff = ch14StrideCliff(S, { cx: GX, cy: 500 });

  // Takeaway band
  const takeaway = S.takeaway('coalescing ensures every fetched byte is consumed; uncoalesced strides throw 87.5% away', {
    tone: 'helps'
  });

  // Initial states
  S.set([cliff.bg, cliff.title, cliff.footer, takeaway.el], { autoAlpha: 0 });
  cliff.rowEls.forEach(r => S.set([r.rc, r.sn, r.ss, r.se], { autoAlpha: 0 }));

  // ---------------------------------------------------------------- b1: Stride definition
  S.add(fx.in([cliff.bg, cliff.title], { from: 'up', d: 0.5 }), 'b1~Stride-0.2');

  // ---------------------------------------------------------------- b2: Stride 1 (100% efficiency)
  if (cliff.rowEls[0]) {
    S.add(fx.in([cliff.rowEls[0].rc, cliff.rowEls[0].sn, cliff.rowEls[0].ss, cliff.rowEls[0].se], { from: 'fade', d: 0.4 }), 'b2~one,-0.2');
    S.add(fx.pulse([cliff.rowEls[0].rc, cliff.rowEls[0].se], { scale: 1.05, d: 0.4 }), 'b2~hundred');
  }

  // ---------------------------------------------------------------- b3: Stride 2 (50%) & Stride 4 (25%)
  if (cliff.rowEls[1] && cliff.rowEls[2]) {
    S.add(fx.in([cliff.rowEls[1].rc, cliff.rowEls[1].sn, cliff.rowEls[1].ss, cliff.rowEls[1].se], { from: 'fade', d: 0.4 }), 'b3~Double-0.2');
    S.add(fx.in([cliff.rowEls[2].rc, cliff.rowEls[2].sn, cliff.rowEls[2].ss, cliff.rowEls[2].se], { from: 'fade', d: 0.4 }), 'b3~four,-0.2');
    S.add(fx.pulse([cliff.rowEls[2].rc, cliff.rowEls[2].se], { scale: 1.05, d: 0.4 }), 'b3~twenty-five');
  }

  // ---------------------------------------------------------------- b4: Stride 8 (12.5% cliff)
  if (cliff.rowEls[3]) {
    S.add(fx.in([cliff.rowEls[3].rc, cliff.rowEls[3].sn, cliff.rowEls[3].ss, cliff.rowEls[3].se], { from: 'fade', d: 0.4 }), 'b4~stride-0.2');
    S.add(fx.pulse([cliff.rowEls[3].rc, cliff.rowEls[3].se], { scale: 1.06, d: 0.5 }), 'b4~thousand');
  }

  // ---------------------------------------------------------------- b5: Stride 16+ capped
  if (cliff.rowEls[4]) {
    S.add(fx.in([cliff.rowEls[4].rc, cliff.rowEls[4].sn, cliff.rowEls[4].ss, cliff.rowEls[4].se], { from: 'fade', d: 0.4 }), 'b5~Beyond-0.2');
    S.add(fx.pulse(cliff.rowEls[4].rc, { scale: 1.04, d: 0.4 }), 'b5~worse;');
  }
  S.add(fx.in(cliff.footer, { from: 'fade', d: 0.4 }), 'b5~optimisation-0.2');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
