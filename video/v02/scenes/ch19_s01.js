/* ch19_s01 · scientific notation in base two (fig 99)
   Movement 1 (b1): Scientific notation: digits * base^exponent.
   Movement 2 (b2): Base two: 6 = 110_2 = 1.1_2 * 2^2.
   Movement 3 (b3): Sign 0 (plus), Exponent 129 (2 + 127 bias).
   Movement 4 (b4): Implicit leading 1 gives 24 significant bits from 23 stored bits. */

V.scene('ch19_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Scientific notation in base two', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Bit fields visual
  const bf = ch19BitFields(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('an implicit leading one gives 24 significant bits from 23 stored bits', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([bf.card, bf.title, bf.signBox, bf.signBit, bf.signLbl, bf.expBox, bf.expBit, bf.expLbl], { autoAlpha: 0 });
  S.set([bf.fracBox, bf.fracBit, bf.fracLbl, bf.evCard, bf.evFormula, bf.evResult, bf.footer], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Scientific notation concept
  S.add(fx.in([bf.card, bf.title], { from: 'scale', d: 0.5 }), 'b1~notation-0.2');

  // ---------------------------------------------------------------- b2: Base two 6 = 1.1 x 2^2
  S.add(fx.in(bf.evCard, { from: 'scale', d: 0.4 }), 'b2~floating-point-0.2');
  S.add(fx.in(bf.evFormula, { from: 'fade', d: 0.4 }), 'b2~squared.');

  // ---------------------------------------------------------------- b3: Sign (0) & Exponent (129)
  S.add(fx.in(bf.signBox, { from: 'scale', d: 0.4 }), 'b3~sign-0.2');
  S.add(fx.in([bf.signBit, bf.signLbl], { from: 'fade', d: 0.4 }), 'b3~sign-0.2');
  S.add(fx.in(bf.expBox, { from: 'scale', d: 0.4 }), 'b3~exponent-0.2');
  S.add(fx.in([bf.expBit, bf.expLbl], { from: 'fade', d: 0.4 }), 'b3~exponent-0.2');
  S.add(fx.pulse([bf.expBox, bf.expBit], { scale: 1.05, d: 0.4 }), 'b3~hundred');

  // ---------------------------------------------------------------- b4: Fraction & implicit leading 1
  S.add(fx.in(bf.fracBox, { from: 'scale', d: 0.4 }), 'b4~fraction-0.2');
  S.add(fx.in([bf.fracBit, bf.fracLbl], { from: 'fade', d: 0.4 }), 'b4~fraction-0.2');
  S.add(fx.in(bf.evResult, { from: 'up', d: 0.4 }), 'b4~twenty-four');
  S.add(fx.pulse([bf.evCard, bf.evResult], { scale: 1.04, d: 0.4 }), 'b4~storage.');
  S.add(fx.in(bf.footer, { from: 'up', d: 0.4 }), 'b4~storage.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
