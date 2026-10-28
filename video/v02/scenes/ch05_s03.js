/* ch05_s03 · deriving nine hundred and eighty-nine trillion (fig 25)
   Movement 1 (b1): Derivation layout: units × work per tick × ticks = peak FLOPS.
   Movement 2 (b2): Factor 1: 132 SMs × 4 tensor cores = 528 tensor cores.
   Movement 3 (b3): Factor 2: 528 cores × 1,024 ops/tick = 540,672 ops/tick.
   Movement 4 (b4): Factor 3: 540,672 × 1.83 GHz = 989.4 TFLOP/s, plus single-tick scale comparison (4,096 vs 256). */

V.scene('ch05_s03', S => {
  const { fx } = S;
  const GX = 960, GY = 505;

  // Heading
  const heading = S.heading('deriving 989 trillion operations', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Derivation Layout builder (Fig 25)
  const d = ch05DerivationLayout(S, { cx: GX, cy: GY, w: 1420, h: 540 });

  // Initial visibility
  S.set([d.frame, d.title], { autoAlpha: 0 });
  d.stepEls.forEach(s => S.set([s.box, s.fText, s.rText], { autoAlpha: 0 }));
  S.set([d.botTitle, d.tcBar, d.tcLbl, d.tcVal, d.cudaBar, d.cudaLbl, d.cudaVal], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Layout frame enters
  S.add(fx.in([d.frame, d.title], { from: 'fade', d: 0.5 }), 'b1~derive-0.2');

  // ---------------------------------------------------------------- b2: Factor 1 (Cores)
  S.add(fx.in([d.stepEls[0].box, d.stepEls[0].fText, d.stepEls[0].rText], { from: 'fade', d: 0.5 }), 'b2~thirty-two-0.2');
  S.add(fx.pulse([d.stepEls[0].box, d.stepEls[0].rText], { scale: 1.03, d: 0.4 }), 'b2~twenty-eight');

  // ---------------------------------------------------------------- b3: Factor 2 (Work per tick)
  S.add(fx.in([d.stepEls[1].box, d.stepEls[1].fText, d.stepEls[1].rText], { from: 'fade', d: 0.5 }), 'b3~completes-0.2');
  S.add(fx.pulse([d.stepEls[1].box, d.stepEls[1].rText], { scale: 1.03, d: 0.4 }), 'b3~thousand');

  // ---------------------------------------------------------------- b4: Factor 3 & Single-Tick comparison
  S.add(fx.in([d.stepEls[2].box, d.stepEls[2].fText, d.stepEls[2].rText], { from: 'fade', d: 0.5 }), 'b4~Multiply-0.2');
  S.add(fx.pulse([d.stepEls[2].box, d.stepEls[2].rText], { scale: 1.04, d: 0.5 }), 'b4~trillion');

  // Single-tick scale comparison (Fig 25 bottom)
  S.add(fx.in([d.botTitle, d.tcBar, d.tcLbl, d.tcVal, d.cudaBar, d.cudaLbl, d.cudaVal], { from: 'fade', d: 0.5 }), 'b4~second');
  S.add(fx.pulse([d.tcBar, d.tcVal], { scale: 1.03, d: 0.4 }), 'b4~second+0.3');

  // Concluding Takeaway band
  const takeaway = S.takeaway('peak compute is just hardware units × operations per tick × clock speed', {
    tone: 'compute'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
