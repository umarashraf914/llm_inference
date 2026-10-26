/* ch17_s02 · scalar unit against matrix tile (figs 89, 90, 91)
   Movement 1 (b1): Scalar CUDA core: 1 operation per cycle (d = a*b + c).
   Movement 2 (b2): Tensor core: 2D matrix tile operation (D = A*B + C).
   Movement 3 (b3): 512 multiply-adds per tick = 1,024 ops/cycle.
   Movement 4 (b4): 16x8x16 warp MMA instruction = 2,048 multiply-adds (4 ticks). */

V.scene('ch17_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Scalar unit against matrix tile', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // CUDA vs Tensor visual
  const ct = ch17CudaVsTensor(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('one tensor instruction unleashes thousands of arithmetic operations', {
    x: GX, y: 990, h: 48, tone: 'compute', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([ct.leftCard, ct.leftTitle, ct.leftSub, ct.leftPill], { autoAlpha: 0 });
  ct.lElements.forEach(e => S.set([e.box, e.lt], { autoAlpha: 0 }));
  S.set([ct.rightCard, ct.rightTitle, ct.rightSub, ct.rightPill], { autoAlpha: 0 });
  ct.rElements.forEach(e => S.set([e.box, e.rt], { autoAlpha: 0 }));
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Scalar CUDA core
  S.add(fx.in([ct.leftCard, ct.leftTitle], { from: 'scale', d: 0.5 }), 'b1~scalar-0.2');
  S.add(fx.in(ct.leftSub, { from: 'fade', d: 0.4 }), 'b1~core');
  ct.lElements.forEach((e, idx) => {
    S.add(fx.in([e.box, e.lt], { from: 'fade', d: 0.35 }), `b1~multiplies:-${0.2 - idx * 0.2}`);
  });
  S.add(fx.in(ct.leftPill, { from: 'up', d: 0.4 }), 'b1~cycle.');

  // ---------------------------------------------------------------- b2: Tensor core 2D tiles
  S.add(fx.in([ct.rightCard, ct.rightTitle], { from: 'scale', d: 0.5 }), 'b2~tensor-0.2');
  S.add(fx.in(ct.rightSub, { from: 'fade', d: 0.4 }), 'b2~core');
  ct.rElements.slice(0, 2).forEach((e, idx) => {
    S.add(fx.in([e.box, e.rt], { from: 'fade', d: 0.35 }), `b2~matrices:-${0.2 - idx * 0.2}`);
  });

  // ---------------------------------------------------------------- b3: 512 multiply-adds per tick
  S.add(fx.in([ct.rElements[2].box, ct.rElements[2].rt], { from: 'fade', d: 0.4 }), 'b3~five-0.2');
  S.add(fx.pulse([ct.rightCard, ct.rElements[2].rt], { scale: 1.05, d: 0.4 }), 'b3~thousand');

  // ---------------------------------------------------------------- b4: 16x8x16 warp instruction
  S.add(fx.in([ct.rElements[3].box, ct.rElements[3].rt], { from: 'fade', d: 0.4 }), 'b4~warp-0.2');
  S.add(fx.in(ct.rightPill, { from: 'up', d: 0.4 }), 'b4~ticks.');
  S.add(fx.pulse(ct.rightPill, { scale: 1.05, d: 0.4 }), 'b4~ticks.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
