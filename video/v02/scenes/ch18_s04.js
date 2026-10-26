/* ch18_s04 · the generational format ladder (fig 98)
   Movement 1 (b1): Each generation introduces a narrower format.
   Movement 2 (b2): Volta (2017): 16-bit FP16 -> 125 TFLOP/s.
   Movement 3 (b3): Hopper (2022): 8-bit FP8 (1,979 T) -> Blackwell (2024): 4-bit FP4 (9,000 T).
   Movement 4 (b4): Compounded 72-fold dense arithmetic throughput gain. */

V.scene('ch18_s04', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('The generational format ladder', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Format ladder visual
  const fl = ch18FormatLadder(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('shrinking precision compounds with architectural gains for massive throughput', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([fl.card, fl.title, fl.footer], { autoAlpha: 0 });
  fl.mElements.forEach(e => {
    S.set(e.rc, { autoAlpha: 0 });
    S.set([e.mn, e.mf, e.ml], { autoAlpha: 0 });
  });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Format ladder setup
  S.add(fx.in([fl.card, fl.title], { from: 'scale', d: 0.5 }), 'b1~generation-0.2');

  // ---------------------------------------------------------------- b2: Volta FP16 milestone (125 T)
  S.add(fx.in(fl.mElements[0].rc, { from: 'scale', d: 0.4 }), 'b2~Volta-0.2');
  S.add(fx.in([fl.mElements[0].mn, fl.mElements[0].mf, fl.mElements[0].ml], { from: 'fade', d: 0.4 }), 'b2~twenty-seventeen');

  // ---------------------------------------------------------------- b3: Hopper FP8 & Blackwell FP4
  S.add(fx.in(fl.mElements[1].rc, { from: 'scale', d: 0.4 }), 'b3~Hopper-0.2');
  S.add(fx.in([fl.mElements[1].mn, fl.mElements[1].mf, fl.mElements[1].ml], { from: 'fade', d: 0.4 }), 'b3~two');
  S.add(fx.in(fl.mElements[2].rc, { from: 'scale', d: 0.4 }), 'b3~Blackwell-0.2');
  S.add(fx.in([fl.mElements[2].mn, fl.mElements[2].mf, fl.mElements[2].ml], { from: 'fade', d: 0.4 }), 'b3~nine');

  // ---------------------------------------------------------------- b4: 72x compounded increase
  S.add(fx.pulse([fl.mElements[0].rc, fl.mElements[2].rc], { scale: 1.05, stagger: 0.1, d: 0.4 }), 'b4~seventy-two-fold');
  S.add(fx.in(fl.footer, { from: 'up', d: 0.4 }), 'b4~throughput.');
  S.add(fx.pulse(fl.footer, { scale: 1.05, d: 0.4 }), 'b4~throughput.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
