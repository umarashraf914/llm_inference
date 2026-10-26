/* ch13_s03 · how many warps it takes to cover a wait (fig 66)
   Movement 1 (b1): Mathematical model: Warps needed = ceil((c + L) / c).
   Movement 2 (b2): c = 32 instructions: 16 warps fully saturate the scheduler.
   Movement 3 (b3): c = 8 instructions: 61 warps needed; scheduler idle 74% of the time.
   Movement 4 (b4): Compute-to-memory ratio sets the pace; occupancy cannot fix arithmetic deficits. */

V.scene('ch13_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('How many warps it takes to cover a wait', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Math model visual
  const model = ch13LatencyHidingFormula(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('insufficient arithmetic between loads causes unavoidable pipeline stalls', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([model.card, model.title, model.formPill], { autoAlpha: 0 });
  S.set([model.leftCard, model.leftTitle, model.leftMath, model.leftResult], { autoAlpha: 0 });
  S.set([model.rightCard, model.rightTitle, model.rightMath, model.rightResult, model.footer], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Formula appears
  S.add(fx.in([model.card, model.title], { from: 'scale', d: 0.5 }), 'b1~warps-0.2');
  S.add(fx.in(model.formPill, { from: 'up', d: 0.5 }), 'b1~hide-0.2');
  S.add(fx.pulse(model.formPill, { scale: 1.05, d: 0.4 }), 'b1~depends');

  // ---------------------------------------------------------------- b2: Case A (32 instructions -> 16 warps)
  S.add(fx.in([model.leftCard, model.leftTitle], { from: 'scale', d: 0.5 }), 'b2~computes-0.2');
  S.add(fx.in(model.leftMath, { from: 'fade', d: 0.4 }), 'b2~thirty-two');
  S.add(fx.in(model.leftResult, { from: 'up', d: 0.4 }), 'b2~sixteen');
  S.add(fx.pulse([model.leftCard, model.leftMath], { scale: 1.04, d: 0.4 }), 'b2~hold.');

  // ---------------------------------------------------------------- b3: Case B (8 instructions -> 61 warps)
  S.add(fx.in([model.rightCard, model.rightTitle], { from: 'scale', d: 0.5 }), 'b3~computes-0.2');
  S.add(fx.in(model.rightMath, { from: 'fade', d: 0.4 }), 'b3~eight');
  S.add(fx.in(model.rightResult, { from: 'up', d: 0.4 }), 'b3~sixty-one');
  S.add(fx.pulse([model.rightCard, model.rightResult], { scale: 1.04, d: 0.4 }), 'b3~quarters');

  // ---------------------------------------------------------------- b4: Ratio sets the pace
  S.add(fx.in(model.footer, { from: 'up', d: 0.4 }), 'b4~cannot-0.2');
  S.add(fx.pulse(model.footer, { scale: 1.05, d: 0.4 }), 'b4~ratio');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
