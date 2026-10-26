/* ch19_s03 · pi in b float sixteen (fig 102)
   Movement 1 (b1): Pi in BF16: 0 | 10000000 | 1001001.
   Movement 2 (b2): Sign 0 (+1), Exponent 128 - 127 = 1 -> 2^1 = 2.
   Movement 3 (b3): Fraction: 1 + 73/128 = 1.5703125.
   Movement 4 (b4): 2 * 1.5703125 = 3.140625 (error = 0.031%). */

V.scene('ch19_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Pi in bfloat16', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Pi dissection visual
  const pi = ch19PiDissection(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('seven fraction bits represent pi to within 0.031% accuracy', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([pi.card, pi.title, pi.sBox, pi.sText, pi.sLbl, pi.eBox, pi.eText, pi.eLbl, pi.fBox, pi.fText, pi.fLbl], { autoAlpha: 0 });
  S.set([pi.rCard, pi.rFormula, pi.rErr, pi.footer], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 16 bits of Pi display
  S.add(fx.in([pi.card, pi.title], { from: 'scale', d: 0.5 }), 'b1~field-0.2');
  S.add(fx.in(pi.sBox, { from: 'scale', d: 0.35 }), 'b1~mechanics-0.2');
  S.add(fx.in([pi.sText, pi.sLbl], { from: 'fade', d: 0.35 }), 'b1~mechanics-0.2');
  S.add(fx.in(pi.eBox, { from: 'scale', d: 0.35 }), 'b1~mechanics');
  S.add(fx.in([pi.eText, pi.eLbl], { from: 'fade', d: 0.35 }), 'b1~mechanics');
  S.add(fx.in(pi.fBox, { from: 'scale', d: 0.35 }), 'b1~clarity.');
  S.add(fx.in([pi.fText, pi.fLbl], { from: 'fade', d: 0.35 }), 'b1~clarity.');

  // ---------------------------------------------------------------- b2: Sign & exponent resolve
  S.add(fx.pulse([pi.sBox, pi.sText], { scale: 1.08, d: 0.4 }), 'b2~sign-0.2');
  S.add(fx.pulse([pi.eBox, pi.eText], { scale: 1.05, d: 0.4 }), 'b2~hundred');

  // ---------------------------------------------------------------- b3: 7 fraction bits resolve (73/128)
  S.add(fx.pulse([pi.fBox, pi.fText], { scale: 1.05, d: 0.4 }), 'b3~fraction-0.2');

  // ---------------------------------------------------------------- b4: Final product (3.140625, 0.031% error)
  S.add(fx.in(pi.rCard, { from: 'scale', d: 0.4 }), 'b4~Multiply-0.2');
  S.add(fx.in(pi.rFormula, { from: 'fade', d: 0.4 }), 'b4~three');
  S.add(fx.in(pi.rErr, { from: 'fade', d: 0.4 }), 'b4~error');
  S.add(fx.pulse([pi.rCard, pi.rFormula], { scale: 1.04, d: 0.4 }), 'b4~percent.');
  S.add(fx.in(pi.footer, { from: 'up', d: 0.4 }), 'b4~percent.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
