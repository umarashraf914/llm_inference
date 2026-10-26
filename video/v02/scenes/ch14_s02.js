/* ch14_s02 · why walking a column costs eight times more (fig 72)
   Movement 1 (b1): 2D matrix stored in 1D row-major format in memory.
   Movement 2 (b2): Row step is 4 bytes; column step is thousands of bytes.
   Movement 3 (b3): 4,096-wide matrix stride is 16,384 bytes; lanes strand across 32 sectors.
   Movement 4 (b4): Walking a column costs 8x the traffic with zero change in math. */

V.scene('ch14_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Why walking a column costs eight times more', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Row vs Column visual
  const rc = ch14RowColStride(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('loop indexing order is a hardware bandwidth decision, not a matter of style', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([rc.card, rc.title, rc.rCard, rc.rTitle, rc.rDesc1, rc.rDesc2, rc.rPill], { autoAlpha: 0 });
  S.set([rc.cCard, rc.cTitle, rc.cDesc1, rc.cDesc2, rc.cPill, rc.footer], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 2D row-major continuous format
  S.add(fx.in([rc.card, rc.title], { from: 'scale', d: 0.5 }), 'b1~memory,-0.2');
  S.add(fx.in(rc.rCard, { from: 'scale', d: 0.5 }), 'b1~continuous-0.2');
  S.add(fx.in(rc.rTitle, { from: 'fade', d: 0.5 }), 'b1~continuous');
  S.add(fx.in([rc.rDesc1, rc.rDesc2], { from: 'fade', d: 0.4 }), 'b1~row');

  // ---------------------------------------------------------------- b2: Row hop (4B) vs Column jump
  S.add(fx.in(rc.rPill, { from: 'up', d: 0.4 }), 'b2~row-0.2');
  S.add(fx.pulse([rc.rCard, rc.rPill], { scale: 1.04, d: 0.4 }), 'b2~apart.');

  // ---------------------------------------------------------------- b3: 16,384B stride down column
  S.add(fx.in([rc.cCard, rc.cTitle], { from: 'scale', d: 0.5 }), 'b3~matrix-0.2');
  S.add(fx.in([rc.cDesc1, rc.cDesc2], { from: 'fade', d: 0.4 }), 'b3~sixteen-0.2');
  S.add(fx.in(rc.cPill, { from: 'up', d: 0.4 }), 'b3~sector.');

  // ---------------------------------------------------------------- b4: 8x memory traffic penalty
  S.add(fx.pulse([rc.cCard, rc.cPill], { scale: 1.05, d: 0.4 }), 'b4~eight');
  S.add(fx.in(rc.footer, { from: 'up', d: 0.4 }), 'b4~operation.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
