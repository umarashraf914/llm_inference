/* ch06_s03 · tiling: why staging saves memory traffic (fig 30)
   Movement 1 (b1): 4×4 output tile with matrix tiles A and B.
   Movement 2 (b2): Cell C[2,3] needs 4 numbers from Row 2 and 4 from Col 3 (8 total).
   Movement 3 (b3): Unstaged execution: 16 threads × 8 reads = 128 reads from HBM.
   Movement 4 (b4): Staged execution: block copies 16 of A and 16 of B into shared memory (32 reads).
   Movement 5 (b5): 4× memory traffic reduction (128 / 32 = 4× savings, equal to tile width!). */

V.scene('ch06_s03', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('Tiling: why staging saves memory traffic', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Left: 4×4 Matrix Tile Diagram
  const tileCX = 620;
  const tile = ch06TileGrid(S, { cx: tileCX, cy: GY + 10 });

  // Right: Traffic Comparison Dashboard
  const dashCX = 1320;
  const cardW = 600, cardH = 480;
  const dashCard = S.card({
    x: dashCX - cardW / 2, y: GY + 10 - cardH / 2, w: cardW, h: cardH,
    tone: 'compute', title: ''
  });
  const dashTitle = S.text('HBM MEMORY READ REDUCTION', {
    x: dashCX, y: GY + 10 - cardH / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'compute'
  });

  // Step 1: Unstaged Reads Card (Coral)
  const c1Y = GY - 100;
  const c1Card = S.card({
    x: dashCX - cardW / 2 + 25, y: c1Y - 45, w: cardW - 50, h: 90,
    tone: 'bytes', title: ''
  });
  const c1Title = S.text('1 · UNSTAGED READS (INDEPENDENT THREADS)', { x: dashCX - cardW / 2 + 50, y: c1Y - 12, size: 22, color: 'bytes', weight: 700 });
  const c1Eq = S.text('16 threads × 8 values = 128 HBM READS', { x: dashCX - cardW / 2 + 50, y: c1Y + 22, size: 22, family: 'mono', color: 'ink', weight: 600 });

  // Step 2: Staged Collaborative Reads Card (Teal)
  const c2Y = GY + 15;
  const c2Card = S.card({
    x: dashCX - cardW / 2 + 25, y: c2Y - 45, w: cardW - 50, h: 90,
    tone: 'helps', title: ''
  });
  const c2Title = S.text('2 · STAGED READS (SHARED MEMORY)', { x: dashCX - cardW / 2 + 50, y: c2Y - 12, size: 22, color: 'helps', weight: 700 });
  const c2Eq = S.text('16 (Tile A) + 16 (Tile B) = 32 HBM READS', { x: dashCX - cardW / 2 + 50, y: c2Y + 22, size: 22, family: 'mono', color: 'ink', weight: 600 });

  // Step 3: Tiling Traffic Savings Card
  const c3Y = GY + 145;
  const c3Card = S.card({
    x: dashCX - cardW / 2 + 25, y: c3Y - 60, w: cardW - 50, h: 130,
    tone: 'compute', title: ''
  });
  const c3Title = S.text('3 · MEMORY TRAFFIC SAVING RATIO', { x: dashCX - cardW / 2 + 50, y: c3Y - 24, size: 22, color: 'compute', weight: 700 });
  const c3Eq = S.text('128 ÷ 32 = 4× LESS HBM TRAFFIC', { x: dashCX - cardW / 2 + 50, y: c3Y + 12, size: 24, family: 'mono', color: 'compute', weight: 700 });
  const c3Badge = S.pill('128× TILE SAVES 128× TRAFFIC', { x: dashCX, y: c3Y + 44, h: 38, tone: 'compute', size: 22, weight: 700 });

  // Initial visibility
  S.set([tile.card, tile.title, tile.dotPill], { autoAlpha: 0 });
  tile.aCells.forEach(c => S.set(c.sq, { autoAlpha: 0 }));
  tile.bCells.forEach(c => S.set(c.sq, { autoAlpha: 0 }));
  S.set([dashCard, dashTitle, c1Card, c1Title, c1Eq, c2Card, c2Title, c2Eq, c3Card, c3Title, c3Eq, c3Badge], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 4x4 Grid intro
  S.add(fx.in([tile.card, tile.title], { from: 'scale', d: 0.5 }), 'b1~tiling-0.2');
  S.add(fx.in([...tile.aCells.map(c => c.sq), ...tile.bCells.map(c => c.sq)], { from: 'scale', stagger: 0.02, d: 0.4 }), 'b1~cooperating');

  // ---------------------------------------------------------------- b2: Cell dot product
  S.add(fx.in(tile.dotPill, { from: 'up', d: 0.4 }), 'b2~needs-0.2');
  // Highlight row 2 of A and col 3 of B
  const row2A = tile.aCells.filter(c => c.r === 2).map(c => c.sq);
  const col3B = tile.bCells.filter(c => c.c === 3).map(c => c.sq);
  S.add(fx.recolor(row2A, { fill: S.tone('struct') }), 'b2~four');
  S.add(fx.recolor(col3B, { fill: S.tone('compute') }), 'b2~column');

  // ---------------------------------------------------------------- b3: Unstaged 128 reads
  S.add(fx.in([dashCard, dashTitle, c1Card, c1Title, c1Eq], { from: 'right', d: 0.5 }), 'b3~sixteen-0.2');
  S.add(fx.pulse([c1Card, c1Eq], { scale: 1.05, d: 0.4 }), 'b3~hundred');

  // ---------------------------------------------------------------- b4: Staged 32 reads
  S.add(fx.in([c2Card, c2Title, c2Eq], { from: 'right', d: 0.5 }), 'b4~copies-0.2');
  S.add(fx.pulse([c2Card, c2Eq], { scale: 1.05, d: 0.4 }), 'b4~thirty-two');

  // ---------------------------------------------------------------- b5: 4x Savings & Takeaway
  S.add(fx.in([c3Card, c3Title, c3Eq, c3Badge], { from: 'up', d: 0.5 }), 'b5~fewer-0.2');
  S.add(fx.pulse(c3Badge, { scale: 1.08, d: 0.5 }), 'b5~saves');

  // Concluding Takeaway pill
  const takeaway = S.pill('tiling trades on-chip scratchpad space for a massive reduction in memory traffic', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
