/* ch18_s02 · binary long multiplication and the square law (fig 96)
   Movement 1 (b1): Binary multiplication: long multiplication with 0s and 1s.
   Movement 2 (b2): 11 x 13: 4 shifted rows sum to 143.
   Movement 3 (b3): Every bit pair requires an AND gate: work grows with N^2.
   Movement 4 (b4): 16 gates (4b) -> 64 (8b) -> 256 (16b) -> 1,024 (32b). */

V.scene('ch18_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Binary long multiplication and the square law', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Binary multiplication visual
  const bm = ch18BinaryLongMul(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('multiplier area scales with width squared: narrow numbers shrink circuits by 4×', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([bm.leftCard, bm.leftTitle, bm.leftSub, bm.mBox, bm.leftPill], { autoAlpha: 0 });
  bm.mTexts.forEach(t => S.set(t, { autoAlpha: 0 }));
  S.set([bm.rightCard, bm.rightTitle, bm.rightSub, bm.rightPill], { autoAlpha: 0 });
  bm.wElements.forEach(e => S.set([e.box, e.bt, e.gt], { autoAlpha: 0 }));
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Binary long multiplication setup
  S.add(fx.in([bm.leftCard, bm.leftTitle], { from: 'scale', d: 0.5 }), 'b1~Multiplying-0.2');
  S.add(fx.in(bm.leftSub, { from: 'fade', d: 0.4 }), 'b1~binary');
  S.add(fx.in(bm.mBox, { from: 'scale', d: 0.4 }), 'b1~trivial');
  bm.mTexts.slice(0, 3).forEach((t, idx) => {
    S.add(fx.in(t, { from: 'fade', d: 0.3 }), `b1~digit:-${0.1 - idx * 0.1}`);
  });

  // ---------------------------------------------------------------- b2: Shifted rows sum to 143
  bm.mTexts.slice(3).forEach((t, idx) => {
    S.add(fx.in(t, { from: 'fade', d: 0.3 }), `b2~eleven:-${0.1 - idx * 0.1}`);
  });
  S.add(fx.pulse([bm.mBox, bm.mTexts[8]], { scale: 1.05, d: 0.4 }), 'b2~forty-three.');

  // ---------------------------------------------------------------- b3: AND gate square law (N^2)
  S.add(fx.in([bm.rightCard, bm.rightTitle], { from: 'scale', d: 0.5 }), 'b3~first-0.2');
  S.add(fx.in(bm.rightSub, { from: 'fade', d: 0.4 }), 'b3~gate.');
  S.add(fx.in(bm.leftPill, { from: 'up', d: 0.4 }), 'b3~square');

  // ---------------------------------------------------------------- b4: Circuit area scaling blocks (16 -> 1,024)
  bm.wElements.forEach((e, idx) => {
    S.add(fx.in([e.box, e.bt, e.gt], { from: 'up', d: 0.35 }), `b4~Sixteen:-${0.2 - idx * 0.25}`);
  });
  S.add(fx.in(bm.rightPill, { from: 'up', d: 0.4 }), 'b4~quarter.');
  S.add(fx.pulse(bm.rightPill, { scale: 1.05, d: 0.4 }), 'b4~quarter.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
