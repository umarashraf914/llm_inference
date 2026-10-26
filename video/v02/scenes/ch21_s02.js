/* ch21_s02 · a systolic array beat by beat (fig 120)
   Movement 1 (b1): 3x3 systolic array: stationary weights, diagonal slant input wavefront.
   Movement 2 (b2): Cell multiplies weight by left input, adds top sum, passes forward.
   Movement 3 (b3): 27 multiply-adds finish in 7 beats with zero trips to memory.
   Movement 4 (b4): 128x128 production TPU: 16,384 multiply-adds per clock beat. */

V.scene('ch21_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('A systolic array beat by beat', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Systolic Step Visual
  const sys = ch21SystolicStep(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('systolic grids compute matrix products rhythmically in 3n minus 2 beats', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([sys.card, sys.title, sys.footer], { autoAlpha: 0 });
  S.set([sys.gridCard, sys.gridTitle, sys.gridPill], { autoAlpha: 0 });
  sys.cells.forEach(c => S.set([c.box, c.lbl], { autoAlpha: 0 }));

  S.set([sys.mathCard, sys.mathTitle, sys.mathPill], { autoAlpha: 0 });
  sys.sElements.forEach(el => S.set([el.box, el.bt], { autoAlpha: 0 }));

  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 3x3 grid introduced
  S.add(fx.in([sys.card, sys.title], { from: 'scale', d: 0.5 }), 'b1~three-by-three-0.2');
  S.add(fx.in([sys.gridCard, sys.gridTitle], { from: 'scale', d: 0.4 }), 'b1~three-by-three');
  sys.cells.forEach((c, idx) => {
    S.add(fx.in(c.box, { from: 'scale', d: 0.3 }), `b1~Weights:-${0.2 - idx * 0.08}`);
    S.add(fx.in(c.lbl, { from: 'fade', d: 0.3 }), `b1~Weights:-${0.2 - idx * 0.08}`);
  });
  S.add(fx.in(sys.gridPill, { from: 'up', d: 0.35 }), 'b1~slant');

  // ---------------------------------------------------------------- b2: Step through math
  S.add(fx.in([sys.mathCard, sys.mathTitle], { from: 'scale', d: 0.4 }), 'b2~multiplies-0.2');
  S.add(fx.in(sys.sElements[0].box, { from: 'scale', d: 0.35 }), 'b2~multiplies');
  S.add(fx.in(sys.sElements[0].bt, { from: 'fade', d: 0.35 }), 'b2~multiplies');
  S.add(fx.pulse(sys.cells.map(c => c.box), { scale: 1.08, stagger: 0.05, d: 0.35 }), 'b2~forward.');

  // ---------------------------------------------------------------- b3: 27 operations in 7 beats
  S.add(fx.in(sys.sElements[1].box, { from: 'scale', d: 0.35 }), 'b3~seven-0.2');
  S.add(fx.in(sys.sElements[1].bt, { from: 'fade', d: 0.35 }), 'b3~seven');
  S.add(fx.in(sys.sElements[2].box, { from: 'scale', d: 0.35 }), 'b3~memory.-0.2');
  S.add(fx.in(sys.sElements[2].bt, { from: 'fade', d: 0.35 }), 'b3~memory.');
  S.add(fx.in(sys.mathPill, { from: 'up', d: 0.4 }), 'b3~memory.');

  // ---------------------------------------------------------------- b4: 128x128 production TPU
  S.add(fx.in(sys.sElements[3].box, { from: 'scale', d: 0.35 }), 'b4~expand-0.2');
  S.add(fx.in(sys.sElements[3].bt, { from: 'fade', d: 0.35 }), 'b4~expand');
  S.add(fx.pulse([sys.mathCard, sys.mathPill], { scale: 1.04, d: 0.4 }), 'b4~beat.');
  S.add(fx.in(sys.footer, { from: 'up', d: 0.4 }), 'b4~beat.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
