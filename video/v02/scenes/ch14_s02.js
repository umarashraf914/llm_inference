/* ch14_s02 · why walking a column costs eight times more (fig 72)
   Movement 1 (b1): 2D grid stored row-major as continuous 1D physical line.
   Movement 2 (b2): Row neighbours are 4 bytes apart; column neighbours thousands of bytes apart.
   Movement 3 (b3): 4,096 elements wide = 16,384 bytes stride jump; lanes land in separate sectors.
   Movement 4 (b4): Walking a row is cheap; walking a column costs 8× memory traffic. */

V.scene('ch14_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('why walking a column costs eight times more', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Row vs Column Stride Diagram (Atlas Fig 72)
  const walk = ch14RowColStride(S, { cx: GX, cy: 500 });

  // Takeaway band
  const takeaway = S.takeaway('loop indexing order is a hardware bandwidth decision, not a matter of style', {
    tone: 'struct'
  });

  // Initial states
  S.set([walk.bg, walk.title, walk.rCard, walk.rTitle, walk.rDesc1, walk.rDesc2, walk.rPill], { autoAlpha: 0 });
  S.set([walk.cCard, walk.cTitle, walk.cDesc1, walk.cDesc2, walk.cPill, walk.footer, takeaway.el], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 2D row-major array in RAM
  S.add(fx.in([walk.bg, walk.title], { from: 'up', d: 0.5 }), 'b1~physical-0.2');
  S.add(fx.in([walk.rCard, walk.rTitle, walk.rDesc1], { from: 'up', d: 0.5 }), 'b1~continuous');

  // ---------------------------------------------------------------- b2: Row neighbours (4 B hop)
  S.add(fx.in([walk.rDesc2, walk.rPill], { from: 'fade', d: 0.4 }), 'b2~Neighbours-0.2');
  S.add(fx.pulse([walk.rCard, walk.rPill], { scale: 1.05, d: 0.4 }), 'b2~apart.');

  // ---------------------------------------------------------------- b3: Column jump (16,384 B stride)
  S.add(fx.in([walk.cCard, walk.cTitle, walk.cDesc1, walk.cDesc2], { from: 'up', d: 0.5 }), 'b3~matrix-0.2');
  S.add(fx.pulse([walk.cCard, walk.cDesc1], { scale: 1.05, d: 0.4 }), 'b3~sixteen');

  // ---------------------------------------------------------------- b4: 8x memory traffic penalty
  S.add(fx.in(walk.cPill, { from: 'up', d: 0.4 }), 'b4~Walking-0.2');
  S.add(fx.pulse([walk.cCard, walk.cPill], { scale: 1.05, d: 0.4 }), 'b4~eight');
  S.add(fx.in(walk.footer, { from: 'fade', d: 0.4 }), 'b4~mathematical-0.2');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
