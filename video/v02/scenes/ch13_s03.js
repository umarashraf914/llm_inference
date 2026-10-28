/* ch13_s03 · how many warps it takes to cover a wait (fig 66)
   Movement 1 (b1): Mathematical model: Warps needed = ceil((c + L) / c).
   Movement 2 (b2): c = 32 instructions: 16 warps needed, 100% scheduler busy rate.
   Movement 3 (b3): c = 8 instructions: 61 warps needed; scheduler idle 74% of the time.
   Movement 4 (b4): Occupancy cannot hide latency when arithmetic is insufficient. */

V.scene('ch13_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('how many warps it takes to cover a wait', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Mathematical Model (Atlas Fig 66)
  const mathMod = ch13LatencyHidingFormula(S, { cx: GX, cy: 500 });

  // Takeaway band
  const takeaway = S.takeaway('occupancy cannot hide latency when there is too little work between loads', {
    tone: 'bytes'
  });

  // Initial states
  S.set([mathMod.bg, mathMod.title, mathMod.formBox, mathMod.formText], { autoAlpha: 0 });
  S.set([mathMod.leftCard, mathMod.leftTitle, mathMod.leftMath, mathMod.leftResult], { autoAlpha: 0 });
  S.set([mathMod.rightCard, mathMod.rightTitle, mathMod.rightMath, mathMod.rightResult, mathMod.footer, takeaway.el], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Formula intro
  S.add(fx.in([mathMod.bg, mathMod.title], { from: 'up', d: 0.5 }), 'b1~warps-0.2');
  S.add(fx.in([mathMod.formBox, mathMod.formText], { from: 'fade', d: 0.5 }), 'b1~loads.');
  S.add(fx.pulse([mathMod.formBox, mathMod.formText], { scale: 1.05, d: 0.4 }), 'b1~depends');

  // ---------------------------------------------------------------- b2: Case A: c = 32 (16 warps)
  S.add(fx.in([mathMod.leftCard, mathMod.leftTitle, mathMod.leftMath, mathMod.leftResult], { from: 'up', d: 0.5 }), 'b2~computes-0.2');
  S.add(fx.pulse([mathMod.leftCard, mathMod.leftMath], { scale: 1.05, d: 0.4 }), 'b2~sixteen');

  // ---------------------------------------------------------------- b3: Case B: c = 8 (61 warps needed, 74% idle)
  S.add(fx.in([mathMod.rightCard, mathMod.rightTitle, mathMod.rightMath, mathMod.rightResult], { from: 'up', d: 0.5 }), 'b3~eight-0.2');
  S.add(fx.pulse([mathMod.rightCard, mathMod.rightMath], { scale: 1.05, d: 0.4 }), 'b3~sixty-one');

  // ---------------------------------------------------------------- b4: Insufficient arithmetic causes stalls
  S.add(fx.in(mathMod.footer, { from: 'fade', d: 0.4 }), 'b4~Occupancy-0.2');
  S.add(fx.pulse(mathMod.footer, { scale: 1.05, d: 0.4 }), 'b4~pace.');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
