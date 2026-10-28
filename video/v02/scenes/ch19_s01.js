/* ch19_s01 · floating-point numbers in base two (fig 99)
   Movement 1 (b1): Scientific notation in base ten.
   Movement 2 (b2): Floating point in base two (6 = 1.1 x 2^2).
   Movement 3 (b3): Sign bit (0) and Exponent with bias 127 (129).
   Movement 4 (b4): Fraction field and implicit leading one (24 bits from 23). */

V.scene('ch19_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('floating-point numbers in base two', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Bit fields visual
  const bf = ch19BitFields(S, { cx: GX, cy: 500 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('an implicit leading one gives 24 significant bits of precision from 23 bits stored', {
    tone: 'helps'
  });

  // Initial states
  S.set([bf.bg, bf.title, bf.signBox, bf.signBit, bf.signLbl], { autoAlpha: 0 });
  S.set([bf.expBox, bf.expBit, bf.expLbl, bf.fracBox, bf.fracBit, bf.fracLbl], { autoAlpha: 0 });
  S.set([bf.evBox, bf.evFormula, bf.evResult, bf.footer, takeaway], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Scientific notation concept
  S.add(fx.in([bf.bg, bf.title], { from: 'up', d: 0.5 }), 'b1~Scientific-0.2');

  // ---------------------------------------------------------------- b2: Base two representation (6 = 1.1 x 2^2)
  S.add(fx.in([bf.evBox, bf.evFormula], { from: 'fade', d: 0.4 }), 'b2~exact-0.2');

  // ---------------------------------------------------------------- b3: Sign bit and Exponent
  S.add(fx.in([bf.signBox, bf.signBit, bf.signLbl], { from: 'fade', d: 0.4 }), 'b3~thirty-two-bit-0.2');
  S.add(fx.in([bf.expBox, bf.expBit, bf.expLbl], { from: 'fade', d: 0.4 }), 'b3~exponent');
  S.add(fx.pulse([bf.expBox, bf.expBit], { scale: 1.03, d: 0.4 }), 'b3~hundred');

  // ---------------------------------------------------------------- b4: Fraction & implicit leading 1
  S.add(fx.in([bf.fracBox, bf.fracBit, bf.fracLbl], { from: 'fade', d: 0.4 }), 'b4~fraction-0.2');
  S.add(fx.in(bf.evResult, { from: 'fade', d: 0.4 }), 'b4~stores');
  S.add(fx.pulse([bf.evBox, bf.evResult], { scale: 1.03, d: 0.4 }), 'b4~twenty-four');
  S.add(fx.in(bf.footer, { from: 'up', d: 0.4 }), 'b4~precision');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
