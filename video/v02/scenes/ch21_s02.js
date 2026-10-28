/* ch21_s02 · a systolic array beat by beat (fig 120)
   Movement 1 (b1): 3x3 systolic array: stationary weights, diagonal slant input wavefront.
   Movement 2 (b2): Cell multiplies weight by left input, adds top sum, passes forward.
   Movement 3 (b3): 27 multiply-adds finish in 7 beats with zero trips to memory.
   Movement 4 (b4): 128x128 production TPU: 16,384 multiply-adds per clock beat. */

V.scene('ch21_s02', S => {
  const { fx } = S;

  // Heading
  const heading = S.heading('a systolic array beat by beat', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Systolic Step Visual (Atlas Fig 120)
  const sys = ch21SystolicStep(S, { cx: 960, cy: 510 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('systolic grids compute matrix products rhythmically in 3n minus 2 beats', {
    tone: 'helps'
  });

  // Initial states
  S.set([sys.bg, sys.title, sys.footer], { autoAlpha: 0 });
  S.set([sys.gridCard, sys.gridTitle, sys.gridSub, sys.gridPill], { autoAlpha: 0 });
  sys.cells.forEach(c => S.set([c.cb, c.wLbl1, c.wLbl2], { autoAlpha: 0 }));
  sys.cellArrows.forEach(a => S.set(a, { autoAlpha: 0 }));

  S.set([sys.mathCard, sys.mathTitle, sys.mathSub, sys.mathPill], { autoAlpha: 0 });
  sys.sElements.forEach(el => S.set([el.sb, el.bt1, el.bt2], { autoAlpha: 0 }));

  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 3x3 grid introduced
  S.add(fx.in([sys.bg, sys.title], { from: 'fade', d: 0.5 }), 'b1~three-by-three-0.2');
  S.add(fx.in([sys.gridCard, sys.gridTitle, sys.gridSub], { from: 'fade', d: 0.4 }), 'b1~three-by-three');
  sys.cells.forEach((c, idx) => {
    S.add(fx.in([c.cb, c.wLbl1, c.wLbl2], { from: 'fade', d: 0.3 }), `b1~Weights:-${0.2 - idx * 0.04}`);
  });
  sys.cellArrows.forEach((a, idx) => {
    S.add(fx.in(a, { from: 'fade', d: 0.25 }), `b1~slant:-${0.2 - idx * 0.02}`);
  });
  S.add(fx.in(sys.gridPill, { from: 'up', d: 0.35 }), 'b1~slant');

  // ---------------------------------------------------------------- b2: Step through math
  S.add(fx.in([sys.mathCard, sys.mathTitle, sys.mathSub], { from: 'fade', d: 0.4 }), 'b2~multiplies-0.2');
  S.add(fx.in([sys.sElements[0].sb, sys.sElements[0].bt1, sys.sElements[0].bt2], { from: 'fade', d: 0.35 }), 'b2~multiplies');
  S.add(fx.pulse(sys.cells.map(c => c.cb), { scale: 1.03, stagger: 0.04, d: 0.35 }), 'b2~forward.');

  // ---------------------------------------------------------------- b3: 27 operations in 7 beats
  S.add(fx.in([sys.sElements[1].sb, sys.sElements[1].bt1, sys.sElements[1].bt2], { from: 'fade', d: 0.35 }), 'b3~seven-0.2');
  S.add(fx.in([sys.sElements[2].sb, sys.sElements[2].bt1, sys.sElements[2].bt2], { from: 'fade', d: 0.35 }), 'b3~memory.-0.2');
  S.add(fx.in(sys.mathPill, { from: 'up', d: 0.4 }), 'b3~memory.');

  // ---------------------------------------------------------------- b4: 128x128 production TPU
  S.add(fx.in([sys.sElements[3].sb, sys.sElements[3].bt1, sys.sElements[3].bt2], { from: 'fade', d: 0.35 }), 'b4~expand-0.2');
  S.add(fx.pulse([sys.mathCard, sys.mathPill], { scale: 1.02, d: 0.4 }), 'b4~beat.');
  S.add(fx.in(sys.footer, { from: 'up', d: 0.4 }), 'b4~beat.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
