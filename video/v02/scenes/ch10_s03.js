/* ch10_s03 · the two cardinal sins (fig 52)
   Movement 1 (b1): The two cardinal sins: Divergence vs Uncoalesced access.
   Movement 2 (b2): Both share the root cause: 32 lanes bound in hardware lockstep.
   Movement 3 (b3): Divergence wastes arithmetic issue slots.
   Movement 4 (b4): Uncoalesced access wastes scarce memory bandwidth. */

V.scene('ch10_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('the two cardinal sins', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Side-by-side comparison diagram (Atlas Fig 52)
  const diag = ch10TwoSinsDiagram(S, { cx: GX, cy: 500 });

  // Takeaway band
  const takeaway = S.takeaway('a group that acts as one must agree on instructions and on addresses alike', {
    tone: 'struct'
  });

  // Initial visibility
  S.set([
    diag.rootBox, diag.rootText,
    diag.leftBg, diag.leftTitle, diag.leftSub,
    diag.lForkBox, diag.lWarpLbl, diag.lPass1, diag.lPass1Txt, diag.lPass2, diag.lPass2Txt, diag.lWastedPill,
    diag.rightBg, diag.rightTitle, diag.rightSub,
    diag.rDramBox, diag.rWarpLbl, diag.rBurst1, diag.rBurst1Txt, diag.rBurst2, diag.rBurst2Txt, diag.rWastedPill,
    takeaway.el
  ], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Two sins appear
  S.add(fx.in([diag.leftBg, diag.leftTitle, diag.leftSub], { from: 'up', d: 0.5 }), 'b1~first-0.2');
  S.add(fx.in([diag.rightBg, diag.rightTitle, diag.rightSub], { from: 'up', d: 0.5 }), 'b1~second-0.2');

  // ---------------------------------------------------------------- b2: Shared root cause lockstep
  S.add(fx.in([diag.rootBox, diag.rootText], { from: 'up', d: 0.5 }), 'b2~exact-0.2');
  S.add(fx.pulse(diag.rootBox, { scale: 1.05, d: 0.4 }), 'b2~bound');

  // ---------------------------------------------------------------- b3: Divergence details (instruction mismatch)
  S.add(fx.in([
    diag.lForkBox, diag.lWarpLbl,
    diag.lPass1, diag.lPass1Txt,
    diag.lPass2, diag.lPass2Txt,
    diag.lWastedPill
  ], { from: 'fade', stagger: 0.08, d: 0.4 }), 'b3~instructions,-0.2');
  S.add(fx.pulse(diag.lWastedPill, { scale: 1.06, d: 0.4 }), 'b3~slots.');

  // ---------------------------------------------------------------- b4: Uncoalesced access details (address mismatch)
  S.add(fx.in([
    diag.rDramBox, diag.rWarpLbl,
    diag.rBurst1, diag.rBurst1Txt,
    diag.rBurst2, diag.rBurst2Txt,
    diag.rWastedPill
  ], { from: 'fade', stagger: 0.08, d: 0.4 }), 'b4~scattered-0.2');
  S.add(fx.pulse(diag.rWastedPill, { scale: 1.06, d: 0.5 }), 'b4~scarcer');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
