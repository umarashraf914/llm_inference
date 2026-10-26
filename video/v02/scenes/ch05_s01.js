/* ch05_s01 · scalar cores and tensor cores (fig 23)
   Movement 1 (b1): SM math engine overview: scalar vs matrix arithmetic.
   Movement 2 (b2): 128 CUDA cores: scalar multiply-add (a × b + c) every cycle.
   Movement 3 (b3): 4 Tensor cores: matrix tile multiply-accumulate (D = A × B + C).
   Movement 4 (b4): Supporting silicon: registers, schedulers, SRAM exist solely to feed them. */

V.scene('ch05_s01', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('Scalar cores and tensor cores', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Subtitle card
  const subCard = S.card({
    x: GX - 460, y: 170, w: 920, h: 68,
    tone: 'neutral', title: ''
  });
  const subText = S.text('ONE MULTIPROCESSOR · TWO FUNDAMENTALLY DIFFERENT MATH ENGINES', {
    x: GX, y: 210, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  });

  // Left Side: 128 CUDA Cores (Scalar)
  const leftCX = 560;
  const cardW = 560, cardH = 540;
  const cudaCard = S.card({
    x: leftCX - cardW / 2, y: GY + 25 - cardH / 2, w: cardW, h: cardH,
    tone: 'struct', title: ''
  });
  const cudaTitle = S.text('128 SCALAR CUDA CORES', {
    x: leftCX, y: GY + 25 - cardH / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'struct'
  });
  const cudaBadge = S.pill('1 scalar multiply-add / cycle', {
    x: leftCX, y: GY - 165, h: 40, tone: 'struct', size: 22, weight: 700
  });

  // 128 scalar units represented as 8 rows × 16 columns of small amber squares
  const cudaGrid = S.g();
  const cCols = 16, cRows = 8;
  const cW = 24, cH = 18, cGapX = 6, cGapY = 5;
  const cX0 = leftCX - ((cCols * (cW + cGapX) - cGapX) / 2);
  const cY0 = GY - 125;
  for (let r = 0; r < cRows; r++) {
    for (let c = 0; c < cCols; c++) {
      const sq = S.rect({
        x: cX0 + c * (cW + cGapX), y: cY0 + r * (cH + cGapY), w: cW, h: cH, r: 3,
        fill: S.tone('compute'), stroke: S.tone('compute'), sw: 1
      }, cudaGrid);
      sq.setAttribute('data-audit', 'ignore');
    }
  }

  // Scalar Operation formula card
  const scalarEqCard = S.card({
    x: leftCX - cardW / 2 + 25, y: GY + 85, w: cardW - 50, h: 100,
    tone: 'compute', title: ''
  });
  const scalarEqTitle = S.text('SCALAR FUSED MULTIPLY-ADD (FMA)', { x: leftCX, y: GY + 118, size: 22, anchor: 'middle', weight: 700, color: 'compute' });
  const scalarEq = S.text('d = (a × b) + c   [1 output number]', { x: leftCX, y: GY + 155, size: 22, anchor: 'middle', family: 'mono', color: 'ink', weight: 600 });

  // Right Side: 4 Tensor Cores (Matrix Tiles)
  const rightCX = 1360;
  const tensorCard = S.card({
    x: rightCX - cardW / 2, y: GY + 25 - cardH / 2, w: cardW, h: cardH,
    tone: 'compute', title: ''
  });
  const tensorTitle = S.text('4 MATRIX TENSOR CORES', {
    x: rightCX, y: GY + 25 - cardH / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'compute'
  });
  const tensorBadge = S.pill('1,024 operations / core / tick', {
    x: rightCX, y: GY - 165, h: 40, tone: 'compute', size: 22, weight: 700
  });

  // 4 large tensor core blocks (2 × 2)
  const tensorBlocks = S.g();
  const tSize = 100, tGap = 20;
  const tX0 = rightCX - tSize - tGap / 2;
  const tY0 = GY - 130;
  for (let tr = 0; tr < 2; tr++) {
    for (let tc = 0; tc < 2; tc++) {
      const bx = tX0 + tc * (tSize + tGap);
      const by = tY0 + tr * (tSize + tGap);
      const b = S.card({ x: bx, y: by, w: tSize, h: tSize, tone: 'compute', title: '' }, tensorBlocks);
      const lbl = S.text(`TC ${tr * 2 + tc + 1}`, { x: bx + tSize / 2, y: by + tSize / 2 + 8, size: 22, anchor: 'middle', weight: 700, color: 'compute' }, tensorBlocks);
    }
  }

  // Matrix Tile Operation card
  const matEqCard = S.card({
    x: rightCX - cardW / 2 + 25, y: GY + 85, w: cardW - 50, h: 100,
    tone: 'helps', title: ''
  });
  const matEqTitle = S.text('MATRIX TILE MULTIPLY-ACCUMULATE', { x: rightCX, y: GY + 118, size: 22, anchor: 'middle', weight: 700, color: 'helps' });
  const matEq = S.text('D = (A × B) + C   [16×16 tile output]', { x: rightCX, y: GY + 155, size: 22, anchor: 'middle', family: 'mono', color: 'ink', weight: 600 });

  // Initial visibility
  S.set([subCard, subText], { autoAlpha: 0 });
  S.set([cudaCard, cudaTitle, cudaBadge, cudaGrid, scalarEqCard, scalarEqTitle, scalarEq], { autoAlpha: 0 });
  S.set([tensorCard, tensorTitle, tensorBadge, tensorBlocks, matEqCard, matEqTitle, matEq], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Overview banner
  S.add(fx.in([subCard, subText], { from: 'up', d: 0.4 }), 'b1~multiprocessor-0.2');

  // ---------------------------------------------------------------- b2: 128 CUDA cores
  S.add(fx.in([cudaCard, cudaTitle, cudaBadge, cudaGrid, scalarEqCard, scalarEqTitle, scalarEq], { from: 'left', d: 0.6 }), 'b2~twenty-eight-0.2');
  S.add(fx.pulse([cudaBadge, scalarEqCard], { scale: 1.05, d: 0.5 }), 'b2~scalar');

  // ---------------------------------------------------------------- b3: 4 Tensor cores
  S.add(fx.in([tensorCard, tensorTitle, tensorBadge, tensorBlocks, matEqCard, matEqTitle, matEq], { from: 'right', d: 0.6 }), 'b3~tensor-0.2');
  S.add(fx.pulse([tensorBadge, matEqCard], { scale: 1.05, d: 0.5 }), 'b3~matrix');

  // ---------------------------------------------------------------- b4: Supporting hardware purpose
  S.add(fx.pulse([cudaCard, tensorCard], { scale: 1.03, d: 0.6 }), 'b4~silicon-0.2');

  // Concluding Takeaway pill
  const takeaway = S.pill('math units waiting on data do nothing: feeding them is the whole problem', {
    x: GX, y: 990, h: 48, tone: 'compute', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
