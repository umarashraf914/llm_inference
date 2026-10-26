/* ch21_s04 · the three questions answered (fig 123)
   Movement 1 (b1): The three fundamental questions return.
   Movement 2 (b2): Question 1 answered: parallel lanes, not anticipation (16,896 cores, 528 tensor cores).
   Movement 3 (b3): Question 2 answered: DRAM capacitor physics & 295 ops/byte ridge.
   Movement 4 (b4): Question 3 answered: latency hiding, coalescing, tensor reuse, precision, NVLink racks.
   Movement 5 (b5): Closing transition: Next film: Inside GPU Kernels. */

V.scene('ch21_s04', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('The three questions answered', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Three Answers Visual
  const syn = ch21ThreeAnswers(S, { cx: GX, cy: 510 });

  // Concluding Takeaway / Next Film pill
  const takeaway = S.pill('NEXT FILM: INSIDE GPU KERNELS · HOW SOFTWARE COMMANDS SILICON', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 700, style: 'solid'
  });

  // Initial states
  S.set([syn.card, syn.title, syn.footer], { autoAlpha: 0 });
  syn.colEls.forEach(col => {
    S.set(col.bc, { autoAlpha: 0 });
    S.set([col.qn, col.sb], { autoAlpha: 0 });
    col.ptEls.forEach(pt => S.set(pt, { autoAlpha: 0 }));
  });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Three questions return
  S.add(fx.in([syn.card, syn.title], { from: 'scale', d: 0.5 }), 'b1~answer-0.2');

  // ---------------------------------------------------------------- b2: Answer 1 (parallel lanes vs CPU)
  const c1 = syn.colEls[0];
  S.add(fx.in(c1.bc, { from: 'scale', d: 0.4 }), 'b2~different-0.2');
  S.add(fx.in([c1.qn, c1.sb], { from: 'fade', d: 0.35 }), 'b2~different');
  c1.ptEls.forEach((pt, idx) => {
    S.add(fx.in(pt, { from: 'fade', d: 0.35 }), `b2~foundational:-${0.2 - idx * 0.1}`);
  });
  S.add(fx.pulse(c1.bc, { scale: 1.03, d: 0.4 }), 'b2~die.');

  // ---------------------------------------------------------------- b3: Answer 2 (DRAM physics & ridge)
  const c2 = syn.colEls[1];
  S.add(fx.in(c2.bc, { from: 'scale', d: 0.4 }), 'b3~expensive-0.2');
  S.add(fx.in([c2.qn, c2.sb], { from: 'fade', d: 0.35 }), 'b3~expensive');
  c2.ptEls.forEach((pt, idx) => {
    S.add(fx.in(pt, { from: 'fade', d: 0.35 }), `b3~physics.:-${0.2 - idx * 0.1}`);
  });
  S.add(fx.pulse(c2.bc, { scale: 1.03, d: 0.4 }), 'b3~delivery.');

  // ---------------------------------------------------------------- b4: Answer 3 (architectural defences)
  const c3 = syn.colEls[2];
  S.add(fx.in(c3.bc, { from: 'scale', d: 0.4 }), 'b4~fight-0.2');
  S.add(fx.in([c3.qn, c3.sb], { from: 'fade', d: 0.35 }), 'b4~fight');
  c3.ptEls.forEach((pt, idx) => {
    S.add(fx.in(pt, { from: 'fade', d: 0.35 }), `b4~resident:-${0.2 - idx * 0.1}`);
  });
  S.add(fx.pulse(c3.bc, { scale: 1.03, d: 0.4 }), 'b4~domains.');

  // ---------------------------------------------------------------- b5: Next film transition
  S.add(fx.in(syn.footer, { from: 'up', d: 0.45 }), 'b5~unlocks-0.2');
  S.add(fx.pulse(syn.footer, { scale: 1.05, d: 0.5 }), 'b5~kernels.');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
