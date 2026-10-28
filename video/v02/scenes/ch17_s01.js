/* ch17_s01 · matrix multiplication: every row meets every column (fig 88)
   Movement 1 (b1): Row 1 of A meets Column 1 of B.
   Movement 2 (b2): 1*5 + 2*7 = 19 drops into c11.
   Movement 3 (b3): n^3 operations from 2n^2 numbers; n-fold reuse.
   Movement 4 (b4): 1 column = decode (0 reuse); 2,048 columns = prefill (2,048x reuse). */

V.scene('ch17_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('matrix multiplication: every row meets every column', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Matrix multiplication steps
  const mm = ch17MatMulSteps(S, { cx: GX, cy: 500 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('matrix multiplication brings data reuse; matrix-vector multiplication does not', {
    tone: 'struct'
  });

  // Initial states
  S.set([mm.bg, mm.title, mm.aLbl, mm.bLbl, mm.cLbl, mm.mulSign, mm.eqSign], { autoAlpha: 0 });
  S.set([mm.aBox1, mm.aText1, mm.aBox2, mm.aText2, mm.aBox3, mm.aText3, mm.aBox4, mm.aText4], { autoAlpha: 0 });
  S.set([mm.bBox1, mm.bText1, mm.bBox2, mm.bText2, mm.bBox3, mm.bText3, mm.bBox4, mm.bText4], { autoAlpha: 0 });
  S.set([mm.cBox1, mm.cText1, mm.cBox2, mm.cText2, mm.cBox3, mm.cText3, mm.cBox4, mm.cText4], { autoAlpha: 0 });
  S.set([mm.eqBanner, mm.decCard, mm.decTitle, mm.decDesc, mm.preCard, mm.preTitle, mm.preDesc, mm.footer, takeaway], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Matrices appear & row/column highlight
  S.add(fx.in([mm.bg, mm.title], { from: 'up', d: 0.5 }), 'b1~multiply-0.2');
  S.add(fx.in([mm.aLbl, mm.mulSign, mm.bLbl, mm.eqSign, mm.cLbl], { from: 'fade', d: 0.4 }), 'b1~matrices,');
  S.add(fx.in([mm.aBox1, mm.aBox2, mm.aBox3, mm.aBox4], { from: 'fade', d: 0.35 }), 'b1~row');
  S.add(fx.in([mm.aText1, mm.aText2, mm.aText3, mm.aText4], { from: 'fade', d: 0.35 }), 'b1~row');
  S.add(fx.in([mm.bBox1, mm.bBox2, mm.bBox3, mm.bBox4], { from: 'fade', d: 0.35 }), 'b1~column');
  S.add(fx.in([mm.bText1, mm.bText2, mm.bText3, mm.bText4], { from: 'fade', d: 0.35 }), 'b1~column');

  // ---------------------------------------------------------------- b2: Dot product calculation (19)
  S.add(fx.in(mm.eqBanner, { from: 'fade', d: 0.4 }), 'b2~Multiply-0.2');
  S.add(fx.in([mm.cBox1, mm.cBox2, mm.cBox3, mm.cBox4], { from: 'fade', d: 0.35 }), 'b2~nineteen.');
  S.add(fx.in([mm.cText1, mm.cText2, mm.cText3, mm.cText4], { from: 'fade', d: 0.35 }), 'b2~nineteen.');
  S.add(fx.pulse([mm.cBox1, mm.cText1], { scale: 1.1, d: 0.4 }), 'b2~nineteen.');

  // ---------------------------------------------------------------- b3: n^3 operations & n-fold reuse
  S.add(fx.pulse([mm.aBox1, mm.aBox2, mm.bBox1, mm.bBox3], { scale: 1.05, d: 0.4 }), 'b3~reused');

  // ---------------------------------------------------------------- b4: Decode (1 col) vs Prefill (2,048 cols)
  S.add(fx.in([mm.decCard, mm.decTitle, mm.decDesc], { from: 'fade', d: 0.4 }), 'b4~column,-0.2');
  S.add(fx.in([mm.preCard, mm.preTitle, mm.preDesc], { from: 'fade', d: 0.4 }), 'b4~prefill.-0.2');
  S.add(fx.in(mm.footer, { from: 'up', d: 0.4 }), 'b4~prefill.');
  S.add(fx.pulse(mm.footer, { scale: 1.03, d: 0.4 }), 'b4~prefill.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
