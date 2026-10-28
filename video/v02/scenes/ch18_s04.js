/* ch18_s04 · the generational ladder (fig 98)
   Movement 1 (b1): Every generation introduces a narrower format.
   Movement 2 (b2): Volta: 16-bit FP16 in 2017 at 125 TFLOP/s.
   Movement 3 (b3): Hopper: 8-bit FP8 at 1,979 T; Blackwell: 4-bit FP4 at 9,000 T.
   Movement 4 (b4): 16-bit Volta to 4-bit Blackwell = 72-fold increase in throughput. */

V.scene('ch18_s04', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('the generational ladder', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Generational format ladder
  const fl = ch18FormatLadder(S, { cx: GX, cy: 500 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('from Volta FP16 to Blackwell FP4: a 72-fold increase in dense arithmetic', {
    tone: 'bytes'
  });

  // Initial states
  S.set([fl.bg, fl.title, fl.footer, takeaway], { autoAlpha: 0 });
  fl.mElements.forEach(e => {
    S.set([e.rc, e.mn, e.mf, e.barBox, e.ml], { autoAlpha: 0 });
  });

  // ---------------------------------------------------------------- b1: Generational introduction
  S.add(fx.in([fl.bg, fl.title], { from: 'up', d: 0.5 }), 'b1~tensor-core-0.2');

  // ---------------------------------------------------------------- b2: Volta FP16 (125 TFLOP/s)
  S.add(fx.in([fl.mElements[0].rc, fl.mElements[0].mn, fl.mElements[0].mf, fl.mElements[0].barBox, fl.mElements[0].ml], { from: 'fade', d: 0.4 }), 'b2~Volta-0.2');
  S.add(fx.pulse([fl.mElements[0].rc, fl.mElements[0].ml], { scale: 1.03, d: 0.4 }), 'b2~twenty-seventeen');

  // ---------------------------------------------------------------- b3: Hopper FP8 & Blackwell FP4
  S.add(fx.in([fl.mElements[1].rc, fl.mElements[1].mn, fl.mElements[1].mf, fl.mElements[1].barBox, fl.mElements[1].ml], { from: 'fade', d: 0.4 }), 'b3~Hopper-0.2');
  S.add(fx.in([fl.mElements[2].rc, fl.mElements[2].mn, fl.mElements[2].mf, fl.mElements[2].barBox, fl.mElements[2].ml], { from: 'fade', d: 0.4 }), 'b3~Blackwell-0.2');
  S.add(fx.pulse([fl.mElements[2].rc, fl.mElements[2].ml], { scale: 1.03, d: 0.4 }), 'b3~nine');

  // ---------------------------------------------------------------- b4: 72x compounded gain
  S.add(fx.pulse([fl.mElements[0].barBox, fl.mElements[2].barBox], { scale: 1.05, d: 0.4, stagger: 0.1 }), 'b4~seventy-two-fold');
  S.add(fx.in(fl.footer, { from: 'up', d: 0.4 }), 'b4~throughput.');
  S.add(fx.pulse(fl.footer, { scale: 1.03, d: 0.4 }), 'b4~throughput.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
