/* ch06_s03 · tiling: why staging saves memory traffic (fig 30)
   Movement 1 (b1): 4×4 output tile with matrix tiles A and B.
   Movement 2 (b2): Cell C[2,3] needs 4 numbers from Row 2 and 4 from Col 3 (8 total).
   Movement 3 (b3): Unstaged execution: 16 threads × 8 reads = 128 reads from HBM.
   Movement 4 (b4): Staged execution: block copies 16 of A and 16 of B into shared memory (32 reads).
   Movement 5 (b5): 4× memory traffic reduction (128 / 32 = 4× savings, equal to tile width!). */

V.scene('ch06_s03', S => {
  const { fx } = S;
  const GX = 960, GY = 505;

  // Heading
  const heading = S.heading('tiling: why staging saves memory traffic', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Fig 30 Tiling Diagram Builder
  const tile = ch06TilingDiagram(S, { cx: GX, cy: GY, w: 1420, h: 540 });

  // Initial visibility
  S.set([tile.bg, tile.title, tile.cLabel, tile.aLabel, tile.bLabel, tile.dotPill], { autoAlpha: 0 });
  tile.cCells.forEach(c => S.set(c.sq, { autoAlpha: 0 }));
  tile.aCells.forEach(c => S.set(c.sq, { autoAlpha: 0 }));
  tile.bCells.forEach(c => S.set(c.sq, { autoAlpha: 0 }));
  S.set([...tile.c1, ...tile.c2, ...tile.c3], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 4x4 Grid intro
  S.add(fx.in([tile.bg, tile.title, tile.cLabel, tile.aLabel, tile.bLabel], { from: 'fade', d: 0.5 }), 'b1~tiling-0.2');
  S.add(fx.in([...tile.cCells.map(c => c.sq), ...tile.aCells.map(c => c.sq), ...tile.bCells.map(c => c.sq)], { from: 'fade', stagger: 0.015, d: 0.4 }), 'b1~cooperating');

  // ---------------------------------------------------------------- b2: Cell dot product
  S.add(fx.in(tile.dotPill, { from: 'fade', d: 0.4 }), 'b2~needs-0.2');
  S.add(fx.pulse([tile.cCells[11].sq, tile.dotPill], { scale: 1.08, d: 0.5 }), 'b2~eight');

  // ---------------------------------------------------------------- b3: Unstaged 128 reads
  S.add(fx.in(tile.c1, { from: 'fade', d: 0.5 }), 'b3~sixteen-0.2');
  S.add(fx.pulse(tile.c1[1], { scale: 1.05, d: 0.4 }), 'b3~hundred');

  // ---------------------------------------------------------------- b4: Staged 32 reads
  S.add(fx.in(tile.c2, { from: 'fade', d: 0.5 }), 'b4~copies-0.2');
  S.add(fx.pulse(tile.c2[1], { scale: 1.05, d: 0.4 }), 'b4~thirty-two');

  // ---------------------------------------------------------------- b5: 4x Savings & Takeaway
  S.add(fx.in(tile.c3, { from: 'fade', d: 0.5 }), 'b5~fewer-0.2');
  S.add(fx.pulse(tile.c3[0], { scale: 1.05, d: 0.5 }), 'b5~saves');

  // Concluding Takeaway band
  const takeaway = S.takeaway('tiling trades on-chip scratchpad space for a massive reduction in memory traffic', {
    tone: 'helps'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
