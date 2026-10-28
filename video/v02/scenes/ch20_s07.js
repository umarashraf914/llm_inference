/* ch20_s07 · tensor parallelism and the all-reduce burden (figs 116, 117)
   Movement 1 (b1): Tensor parallelism splits weight matrices across GPUs.
   Movement 2 (b2): Each GPU calculates partial dot product: GPU A = 10, GPU B = 8.
   Movement 3 (b3): All-reduce exchange: GPUs exchange partial sums to total 18.
   Movement 4 (b4): 80 layers x 2 = 160 synchronizations per token. */

V.scene('ch20_s07', S => {
  const { fx } = S;

  // Heading
  const heading = S.heading('tensor parallelism and the all-reduce burden', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Tensor Parallelism Visual (Atlas Figs 116, 117)
  const tp = ch20TensorParallel(S, { cx: 960, cy: 510 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('160 all-reduces per token make tensor parallelism viable only inside fast scale-up fabrics', {
    tone: 'helps'
  });

  // Initial states
  S.set([tp.bg, tp.title, tp.footer], { autoAlpha: 0 });
  S.set([tp.aCard, tp.aTitle, tp.aTerms, tp.aCalc, tp.aResultPill], { autoAlpha: 0 });
  S.set([tp.bCard, tp.bTitle, tp.bTerms, tp.bCalc, tp.bResultPill], { autoAlpha: 0 });
  S.set([tp.exCard, tp.exTitle, tp.exMath, tp.multCard, tp.multT1, tp.multT2], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Weight matrix split across GPUs
  S.add(fx.in([tp.bg, tp.title], { from: 'fade', d: 0.5 }), 'b1~splits-0.2');
  S.add(fx.in([tp.aCard, tp.aTitle, tp.aTerms], { from: 'fade', d: 0.4 }), 'b1~matrices');
  S.add(fx.in([tp.bCard, tp.bTitle, tp.bTerms], { from: 'fade', d: 0.4 }), 'b1~processors.');

  // ---------------------------------------------------------------- b2: Partial sums (10 and 8)
  S.add(fx.in(tp.aCalc, { from: 'fade', d: 0.35 }), 'b2~multiplies-0.2');
  S.add(fx.in(tp.aResultPill, { from: 'up', d: 0.35 }), 'b2~multiplies');
  S.add(fx.in(tp.bCalc, { from: 'fade', d: 0.35 }), 'b2~partial-0.2');
  S.add(fx.in(tp.bResultPill, { from: 'up', d: 0.35 }), 'b2~partial');

  // ---------------------------------------------------------------- b3: All-reduce exchange across interconnect link
  S.add(fx.in([tp.exCard, tp.exTitle, tp.exMath], { from: 'fade', d: 0.4 }), 'b3~exchange-0.2');
  S.add(fx.pulse([tp.aResultPill, tp.bResultPill, tp.exCard], { scale: 1.02, d: 0.4 }), 'b3~all-reduce');

  // ---------------------------------------------------------------- b4: 160 barriers per token & takeaway
  S.add(fx.in([tp.multCard, tp.multT1, tp.multT2], { from: 'fade', d: 0.4 }), 'b4~eighty-layer-0.2');
  S.add(fx.pulse([tp.multCard, tp.multT1], { scale: 1.02, d: 0.4 }), 'b4~catastrophic.');
  S.add(fx.in(tp.footer, { from: 'up', d: 0.4 }), 'b4~catastrophic.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
