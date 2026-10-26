/* ch20_s07 · tensor parallelism and the all-reduce burden (figs 116, 117)
   Movement 1 (b1): Tensor parallelism splits weight matrices across GPUs.
   Movement 2 (b2): Each GPU calculates partial dot product: GPU A = 10, GPU B = 8.
   Movement 3 (b3): All-reduce exchange: GPUs exchange partial sums to total 18.
   Movement 4 (b4): 80 layers x 2 = 160 synchronizations per token. */

V.scene('ch20_s07', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Tensor parallelism and the all-reduce burden', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Tensor Parallelism Visual
  const tp = ch20TensorParallel(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('160 all-reduces per token make tensor parallelism viable only inside fast scale-up fabrics', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([tp.card, tp.title, tp.footer], { autoAlpha: 0 });
  S.set([tp.aCard, tp.aTitle, tp.aCalc, tp.aResult], { autoAlpha: 0 });
  S.set([tp.bCard, tp.bTitle, tp.bCalc, tp.bResult], { autoAlpha: 0 });
  S.set([tp.exCard, tp.exTitle, tp.exDesc], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Weight matrix split
  S.add(fx.in([tp.card, tp.title], { from: 'scale', d: 0.5 }), 'b1~splits-0.2');
  S.add(fx.in([tp.aCard, tp.aTitle], { from: 'scale', d: 0.4 }), 'b1~matrices');
  S.add(fx.in([tp.bCard, tp.bTitle], { from: 'scale', d: 0.4 }), 'b1~processors.');

  // ---------------------------------------------------------------- b2: Partial sums (10 and 8)
  S.add(fx.in(tp.aCalc, { from: 'fade', d: 0.35 }), 'b2~multiplies-0.2');
  S.add(fx.in(tp.aResult, { from: 'scale', d: 0.35 }), 'b2~multiplies');
  S.add(fx.in(tp.bCalc, { from: 'fade', d: 0.35 }), 'b2~partial-0.2');
  S.add(fx.in(tp.bResult, { from: 'scale', d: 0.35 }), 'b2~partial');

  // ---------------------------------------------------------------- b3: All-reduce exchange across link
  S.add(fx.in([tp.exCard, tp.exTitle], { from: 'scale', d: 0.4 }), 'b3~exchange-0.2');
  S.add(fx.pulse([tp.aCard, tp.bCard], { scale: 1.03, d: 0.4 }), 'b3~all-reduce');

  // ---------------------------------------------------------------- b4: 160 barriers per token
  S.add(fx.in(tp.exDesc, { from: 'up', d: 0.4 }), 'b4~eighty-layer-0.2');
  S.add(fx.pulse([tp.exCard, tp.exDesc], { scale: 1.04, d: 0.4 }), 'b4~catastrophic.');
  S.add(fx.in(tp.footer, { from: 'up', d: 0.4 }), 'b4~catastrophic.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
