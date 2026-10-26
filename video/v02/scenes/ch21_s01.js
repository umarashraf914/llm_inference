/* ch21_s01 · a different bet: the systolic array (fig 119)
   Movement 1 (b1): GPU multiprocessor is one way, but not the only way.
   Movement 2 (b2): Google TPU systolic array: massive rigid 2D grid.
   Movement 3 (b3): Operands stream across rows/columns with zero register trips.
   Movement 4 (b4): Dynamic scheduling vs hardwired spatial reuse in copper. */

V.scene('ch21_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('A different bet: the systolic array', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // GPU vs TPU Visual
  const comp = ch21GpuVsTpu(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('systolic arrays hardwire operand reuse directly into silicon wiring', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([comp.leftCard, comp.leftTitle, comp.leftSub, comp.leftPill], { autoAlpha: 0 });
  comp.lElements.forEach(el => S.set([el.box, el.lt], { autoAlpha: 0 }));

  S.set([comp.rightCard, comp.rightTitle, comp.rightSub, comp.rightPill], { autoAlpha: 0 });
  comp.rElements.forEach(el => S.set([el.box, el.rt], { autoAlpha: 0 }));

  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: GPU multiprocessor introduced
  S.add(fx.in([comp.leftCard, comp.leftTitle], { from: 'scale', d: 0.4 }), 'b1~multiprocessor-0.2');
  S.add(fx.in(comp.leftSub, { from: 'fade', d: 0.35 }), 'b1~multiprocessor');
  comp.lElements.forEach((el, idx) => {
    S.add(fx.in(el.box, { from: 'scale', d: 0.35 }), `b1~silicon:-${0.2 - idx * 0.1}`);
    S.add(fx.in(el.lt, { from: 'fade', d: 0.35 }), `b1~silicon:-${0.2 - idx * 0.1}`);
  });
  S.add(fx.in(comp.leftPill, { from: 'up', d: 0.4 }), 'b1~way.');

  // ---------------------------------------------------------------- b2: Google TPU systolic array
  S.add(fx.in([comp.rightCard, comp.rightTitle], { from: 'scale', d: 0.4 }), 'b2~tensor-0.2');
  S.add(fx.in(comp.rightSub, { from: 'fade', d: 0.35 }), 'b2~tensor');
  S.add(fx.in(comp.rElements[0].box, { from: 'scale', d: 0.35 }), 'b2~massive');
  S.add(fx.in(comp.rElements[0].rt, { from: 'fade', d: 0.35 }), 'b2~massive');

  // ---------------------------------------------------------------- b3: Zero trips to register file
  comp.rElements.slice(1).forEach((el, idx) => {
    S.add(fx.in(el.box, { from: 'scale', d: 0.35 }), `b3~streams:-${0.2 - idx * 0.1}`);
    S.add(fx.in(el.rt, { from: 'fade', d: 0.35 }), `b3~streams:-${0.2 - idx * 0.1}`);
  });
  S.add(fx.in(comp.rightPill, { from: 'up', d: 0.4 }), 'b3~file.');

  // ---------------------------------------------------------------- b4: Software caching vs copper wiring
  S.add(fx.pulse([comp.rightCard, comp.rightPill], { scale: 1.04, d: 0.45 }), 'b4~wiring.');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
