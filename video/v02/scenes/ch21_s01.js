/* ch21_s01 · a different bet: the systolic array (fig 119)
   Movement 1 (b1): GPU multiprocessor is one way, but not the only way.
   Movement 2 (b2): Google TPU systolic array: massive rigid 2D grid.
   Movement 3 (b3): Operands stream across rows/columns with zero register trips.
   Movement 4 (b4): Dynamic scheduling vs hardwired spatial reuse in copper. */

V.scene('ch21_s01', S => {
  const { fx } = S;

  // Heading
  const heading = S.heading('a different bet: the systolic array', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // GPU vs TPU Visual (Atlas Fig 119)
  const comp = ch21GpuVsTpu(S, { cx: 960, cy: 510 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('systolic arrays hardwire operand reuse directly into silicon wiring', {
    tone: 'helps'
  });

  // Initial states
  S.set([comp.leftBg, comp.leftTitle, comp.leftSub, comp.diagBg1, comp.rfBox, comp.rfLbl, comp.fBox1, comp.l1, comp.l2, comp.l3, comp.l4, comp.leftPill], { autoAlpha: 0 });
  comp.alus.forEach(a => S.set([a.ab, a.al, a.dL], { autoAlpha: 0 }));

  S.set([comp.rightBg, comp.rightTitle, comp.rightSub, comp.diagBg2, comp.fBox2, comp.r1, comp.r2, comp.r3, comp.r4, comp.rightPill], { autoAlpha: 0 });
  comp.tpuCells.forEach(c => S.set([c.cb, c.cl], { autoAlpha: 0 }));
  comp.tpuArrows.forEach(ar => S.set(ar, { autoAlpha: 0 }));

  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: GPU multiprocessor introduced
  S.add(fx.in([comp.leftBg, comp.leftTitle, comp.leftSub], { from: 'fade', d: 0.4 }), 'b1~multiprocessor-0.2');
  S.add(fx.in([comp.diagBg1, comp.rfBox, comp.rfLbl], { from: 'fade', d: 0.4 }), 'b1~multiprocessor');
  comp.alus.forEach((a, idx) => {
    S.add(fx.in([a.ab, a.al, a.dL], { from: 'fade', d: 0.35 }), `b1~silicon:-${0.2 - idx * 0.05}`);
  });
  S.add(fx.in([comp.fBox1, comp.l1, comp.l2, comp.l3, comp.l4, comp.leftPill], { from: 'fade', d: 0.4 }), 'b1~way.');

  // ---------------------------------------------------------------- b2: Google TPU systolic array grid
  S.add(fx.in([comp.rightBg, comp.rightTitle, comp.rightSub, comp.diagBg2], { from: 'fade', d: 0.4 }), 'b2~tensor-0.2');
  comp.tpuCells.forEach((c, idx) => {
    S.add(fx.in([c.cb, c.cl], { from: 'fade', d: 0.3 }), `b2~massive:-${0.2 - (idx % 3) * 0.04}`);
  });

  // ---------------------------------------------------------------- b3: Direct cell-to-cell data streams
  comp.tpuArrows.forEach((ar, idx) => {
    S.add(fx.in(ar, { from: 'fade', d: 0.25 }), `b3~streams:-${0.2 - idx * 0.02}`);
  });
  S.add(fx.in([comp.fBox2, comp.r1, comp.r2, comp.r3, comp.r4, comp.rightPill], { from: 'fade', d: 0.4 }), 'b3~file.');

  // ---------------------------------------------------------------- b4: Hardwired reuse in copper
  S.add(fx.pulse([comp.rightBg, comp.rightPill], { scale: 1.02, d: 0.45 }), 'b4~wiring.');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
