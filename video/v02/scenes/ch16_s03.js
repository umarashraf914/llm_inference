/* ch16_s03 · two real operations: array add versus matrix multiply (fig 87)
   Movement 1 (b1): How algorithm sets arithmetic intensity.
   Movement 2 (b2): Vector add: c[i] = a[i] + b[i] -> 0.17 op/byte (memory-bound).
   Movement 3 (b3): Matrix multiply: 1,024x1,024 -> 341 op/byte (compute-bound).
   Movement 4 (b4): 2,000x gap; chip sets the ridge, math sets the side. */

V.scene('ch16_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('two real operations: array add versus matrix multiply', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Algorithm comparison cards
  const ops = ch16TwoOperations(S, { cx: GX, cy: 490 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('arithmetic intensity is a property of the algorithm, not the chip', {
    tone: 'struct'
  });

  // Initial states
  S.set([
    ops.leftCard, ops.leftTitle, ops.arrABox, ops.arrALbl, ops.arrBBox, ops.arrBLbl,
    ops.addCircle, ops.addPlus, ops.arrCBox, ops.arrCLbl, ops.leftAcc, ops.leftAccT1, ops.leftAccT2, ops.leftPill,
    ops.rightCard, ops.rightTitle, ops.matBox, ops.matA, ops.matB, ops.matC, ops.matReuse,
    ops.rightAcc, ops.rightAccT1, ops.rightAccT2, ops.rightPill,
    ops.rulerBg, ops.rulerTitle, ops.addPt, ops.ridgePt, ops.matPt,
    takeaway
  ], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Two operations appear
  S.add(fx.in([ops.leftCard, ops.leftTitle, ops.rightCard, ops.rightTitle], { from: 'up', d: 0.5 }), 'b1~basic-0.2');

  // ---------------------------------------------------------------- b2: Vector addition (0.17 op/B)
  S.add(fx.in([ops.arrABox, ops.arrALbl, ops.arrBBox, ops.arrBLbl], { from: 'fade', d: 0.4 }), 'b2~Adding-0.2');
  S.add(fx.in([ops.addCircle, ops.addPlus, ops.arrCBox, ops.arrCLbl], { from: 'fade', d: 0.4 }), 'b2~writes');
  S.add(fx.in([ops.leftAcc, ops.leftAccT1, ops.leftAccT2, ops.leftPill], { from: 'fade', d: 0.4 }), 'b2~traffic');
  S.add(fx.pulse(ops.leftPill, { scale: 1.05, d: 0.4 }), 'b2~seven');

  // ---------------------------------------------------------------- b3: Matrix multiplication (341 op/B)
  S.add(fx.in([ops.matBox, ops.matA, ops.matB, ops.matC, ops.matReuse], { from: 'fade', d: 0.4 }), 'b3~Multiplying-0.2');
  S.add(fx.in([ops.rightAcc, ops.rightAccT1, ops.rightAccT2, ops.rightPill], { from: 'fade', d: 0.4 }), 'b3~billion');
  S.add(fx.pulse(ops.rightPill, { scale: 1.05, d: 0.4 }), 'b3~forty-one');

  // ---------------------------------------------------------------- b4: 2,000x gap & conclusion
  S.add(fx.in([ops.rulerBg, ops.rulerTitle], { from: 'up', d: 0.4 }), 'b4~thousand-0.2');
  S.add(fx.in([ops.addPt, ops.ridgePt, ops.matPt], { from: 'fade', d: 0.4, stagger: 0.15 }), 'b4~thousand');
  S.add(fx.pulse([ops.addPt, ops.matPt], { scale: 1.08, d: 0.4, stagger: 0.15 }), 'b4~mathematics');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
