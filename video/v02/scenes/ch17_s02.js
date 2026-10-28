/* ch17_s02 · scalar unit against matrix tile (figs 89, 90, 91)
   Movement 1 (b1): Scalar CUDA core: 1 operation per cycle (d = a*b + c).
   Movement 2 (b2): Tensor core: 2D matrix tile operation (D = A*B + C).
   Movement 3 (b3): 512 multiply-adds per tick = 1,024 ops/cycle.
   Movement 4 (b4): 16x8x16 warp MMA instruction = 2,048 multiply-adds (4 ticks). */

V.scene('ch17_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('scalar unit against matrix tile', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // CUDA vs Tensor visual
  const ct = ch17CudaVsTensor(S, { cx: GX, cy: 500 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('one tensor instruction unleashes thousands of arithmetic operations', {
    tone: 'compute'
  });

  // Initial states
  S.set([ct.leftCard, ct.leftTitle, ct.leftSub, ct.aluBox, ct.aluInputs, ct.aluOp, ct.aluOpText, ct.aluRate, ct.aluArch, ct.leftPill], { autoAlpha: 0 });
  S.set([ct.rightCard, ct.rightTitle, ct.rightSub, ct.mmaBox, ct.mmaTiles, ct.mmaOp, ct.mmaOpText, ct.mmaRate, ct.mmaWarp, ct.rightPill, takeaway], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Scalar CUDA core
  S.add(fx.in([ct.leftCard, ct.leftTitle, ct.leftSub], { from: 'up', d: 0.5 }), 'b1~scalar-0.2');
  S.add(fx.in([ct.aluBox, ct.aluInputs, ct.aluOp, ct.aluOpText, ct.aluRate, ct.aluArch], { from: 'fade', d: 0.4 }), 'b1~multiplies:');
  S.add(fx.in(ct.leftPill, { from: 'fade', d: 0.4 }), 'b1~cycle.');

  // ---------------------------------------------------------------- b2: Tensor core 2D tiles
  S.add(fx.in([ct.rightCard, ct.rightTitle, ct.rightSub], { from: 'up', d: 0.5 }), 'b2~tensor-0.2');
  S.add(fx.in([ct.mmaBox, ct.mmaTiles, ct.mmaOp, ct.mmaOpText], { from: 'fade', d: 0.4 }), 'b2~matrices');

  // ---------------------------------------------------------------- b3: 512 multiply-adds per tick
  S.add(fx.in(ct.mmaRate, { from: 'fade', d: 0.4 }), 'b3~five-0.2');
  S.add(fx.pulse([ct.rightCard, ct.mmaRate], { scale: 1.03, d: 0.4 }), 'b3~thousand');

  // ---------------------------------------------------------------- b4: 16x8x16 warp instruction
  S.add(fx.in(ct.mmaWarp, { from: 'fade', d: 0.4 }), 'b4~warp-0.2');
  S.add(fx.in(ct.rightPill, { from: 'fade', d: 0.4 }), 'b4~ticks.');
  S.add(fx.pulse(ct.rightPill, { scale: 1.03, d: 0.4 }), 'b4~ticks.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
