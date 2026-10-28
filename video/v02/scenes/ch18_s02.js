/* ch18_s02 · binary multiplication and the square law (fig 96)
   Movement 1 (b1): Binary multiplication is long multiplication with 0 and 1.
   Movement 2 (b2): 11 * 13 = 143 shifted rows sum.
   Movement 3 (b3): Work grows with square of width (N^2 AND gates).
   Movement 4 (b4): 16 (4-bit) -> 64 (8-bit) -> 256 (16-bit) -> 1,024 (32-bit). Halve width -> 1/4 area. */

V.scene('ch18_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('binary multiplication and the square law', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Binary long multiplication visual
  const bm = ch18BinaryLongMul(S, { cx: GX, cy: 500 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('storing numbers costs width; multiplying costs width squared', {
    tone: 'helps'
  });

  // Initial states
  S.set([bm.leftCard, bm.leftTitle, bm.leftSub, bm.mBox, bm.leftPill], { autoAlpha: 0 });
  bm.mTexts.forEach(t => S.set(t, { autoAlpha: 0 }));
  S.set([bm.rightCard, bm.rightTitle, bm.rightSub, bm.rightPill, takeaway], { autoAlpha: 0 });
  bm.wElements.forEach(e => S.set([e.box, e.bt, e.gt], { autoAlpha: 0 }));

  // ---------------------------------------------------------------- b1: Binary long multiplication card
  S.add(fx.in([bm.leftCard, bm.leftTitle, bm.leftSub, bm.mBox], { from: 'up', d: 0.5 }), 'b1~simply-0.2');

  // ---------------------------------------------------------------- b2: 11 * 13 = 143 worked example
  bm.mTexts.forEach((t, idx) => {
    S.add(fx.in(t, { from: 'fade', d: 0.3 }), `b2~eleven:-${0.2 - idx * 0.15}`);
  });
  S.add(fx.in(bm.leftPill, { from: 'fade', d: 0.4 }), 'b2~forty-three.');

  // ---------------------------------------------------------------- b3: Square law scaling (N^2)
  S.add(fx.in([bm.rightCard, bm.rightTitle, bm.rightSub], { from: 'up', d: 0.5 }), 'b3~pairs-0.2');
  S.add(fx.pulse([bm.leftCard, bm.leftPill], { scale: 1.03, d: 0.4 }), 'b3~square');

  // ---------------------------------------------------------------- b4: 16 -> 64 -> 256 -> 1,024 gates
  bm.wElements.forEach((e, idx) => {
    S.add(fx.in([e.box, e.bt, e.gt], { from: 'fade', d: 0.35 }), `b4~Sixteen:-${0.1 - idx * 0.2}`);
  });
  S.add(fx.in(bm.rightPill, { from: 'fade', d: 0.4 }), 'b4~quarter.');
  S.add(fx.pulse(bm.rightPill, { scale: 1.03, d: 0.4 }), 'b4~quarter.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
