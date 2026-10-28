/* ch19_s03 · dissection of pi in BF16 (fig 102)
   Movement 1 (b1): Field-by-field dissection of Pi.
   Movement 2 (b2): Sign bit 0 (+), exponent 128 - 127 = 1 (2^1 = 2).
   Movement 3 (b3): 7 fraction bits: 73/128 + 1 = 1.5703125.
   Movement 4 (b4): Value = 2 * 1.5703125 = 3.140625 (0.031% error). */

V.scene('ch19_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('dissection of pi in bfloat16', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Pi dissection visual
  const pd = ch19PiDissection(S, { cx: GX, cy: 500 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('seven fraction bits represent pi to within 0.031% error: coarse yet sufficient', {
    tone: 'helps'
  });

  // Initial states
  S.set([pd.bg, pd.title, pd.sBox, pd.sText, pd.sLbl], { autoAlpha: 0 });
  S.set([pd.eBox, pd.eText, pd.eLbl, pd.fBox, pd.fText, pd.fLbl], { autoAlpha: 0 });
  S.set([pd.rBox, pd.rFormula, pd.rErr, pd.footer, takeaway], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Pi breakdown in view
  S.add(fx.in([pd.bg, pd.title], { from: 'up', d: 0.5 }), 'b1~field-0.2');

  // ---------------------------------------------------------------- b2: Sign and Exponent
  S.add(fx.in([pd.sBox, pd.sText, pd.sLbl], { from: 'fade', d: 0.4 }), 'b2~sign-0.2');
  S.add(fx.in([pd.eBox, pd.eText, pd.eLbl], { from: 'fade', d: 0.4 }), 'b2~exponent');
  S.add(fx.pulse([pd.eBox, pd.eText], { scale: 1.03, d: 0.4 }), 'b2~hundred');

  // ---------------------------------------------------------------- b3: 7 fraction bits (73/128)
  S.add(fx.in([pd.fBox, pd.fText, pd.fLbl], { from: 'fade', d: 0.4 }), 'b3~fraction-0.2');
  S.add(fx.pulse([pd.fBox, pd.fText], { scale: 1.03, d: 0.4 }), 'b3~seventy-three');

  // ---------------------------------------------------------------- b4: Value = 3.140625 (0.031% error)
  S.add(fx.in([pd.rBox, pd.rFormula], { from: 'fade', d: 0.4 }), 'b4~Multiply-0.2');
  S.add(fx.in(pd.rErr, { from: 'fade', d: 0.4 }), 'b4~error');
  S.add(fx.pulse([pd.rBox, pd.rErr], { scale: 1.03, d: 0.4 }), 'b4~barely');
  S.add(fx.in(pd.footer, { from: 'up', d: 0.4 }), 'b4~percent.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
