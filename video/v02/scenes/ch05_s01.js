/* ch05_s01 · scalar cores and tensor cores (fig 23)
   Movement 1 (b1): SM math engine overview: scalar vs matrix arithmetic floor plan.
   Movement 2 (b2): 128 CUDA cores: 4 partitions of 32 scalar multiply-adds per cycle.
   Movement 3 (b3): 4 Tensor cores: matrix tile multiply-accumulate on 16×16 tiles.
   Movement 4 (b4): Supporting silicon: registers, schedulers, SRAM exist solely to feed them. */

V.scene('ch05_s01', S => {
  const { fx } = S;
  const GX = 960, GY = 505;

  // Heading
  const heading = S.heading('scalar cores and tensor cores', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Arithmetic Floor Plan builder (Fig 23)
  const floor = ch05ArithmeticFloor(S, { cx: GX, cy: GY, w: 1420, h: 540 });

  // Initial visibility
  S.set([floor.frame, floor.title, floor.divider, floor.feederText], { autoAlpha: 0 });
  S.set([floor.cudaHeader, floor.partGroup, floor.sEqBox, floor.sEqTitle, floor.sEqDesc], { autoAlpha: 0 });
  S.set([floor.tcHeader, floor.tcGroup, floor.mEqBox, floor.mEqTitle, floor.mEqDesc], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Floor frame draws on
  S.add(fx.in([floor.frame, floor.title, floor.divider], { from: 'fade', d: 0.5 }), 'b1~multiprocessor-0.2');
  S.add(fx.pulse(floor.frame, { scale: 1.01, d: 0.4 }), 'b1~maths');

  // ---------------------------------------------------------------- b2: 128 CUDA cores (scalar)
  S.add(fx.in([floor.cudaHeader, floor.partGroup, floor.sEqBox, floor.sEqTitle, floor.sEqDesc], { from: 'fade', d: 0.5 }), 'b2~twenty-eight-0.2');
  S.add(fx.pulse([floor.sEqBox, floor.sEqTitle], { scale: 1.04, d: 0.4 }), 'b2~scalar');

  // ---------------------------------------------------------------- b3: 4 Tensor cores (matrix)
  S.add(fx.in([floor.tcHeader, floor.tcGroup, floor.mEqBox, floor.mEqTitle, floor.mEqDesc], { from: 'fade', d: 0.5 }), 'b3~tensor-0.2');
  S.add(fx.pulse([floor.mEqBox, floor.mEqTitle], { scale: 1.04, d: 0.4 }), 'b3~matrix');

  // ---------------------------------------------------------------- b4: Supporting hardware feeder purpose
  S.add(fx.in(floor.feederText, { from: 'fade', d: 0.5 }), 'b4~silicon-0.2');
  S.add(fx.pulse([floor.feederText, floor.partGroup, floor.tcGroup], { scale: 1.02, d: 0.5 }), 'b4~fed');

  // Concluding Takeaway band
  const takeaway = S.takeaway('math units waiting on data do nothing: feeding them is the whole problem', {
    tone: 'compute'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
