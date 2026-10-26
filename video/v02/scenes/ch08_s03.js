/* ch08_s03 · grids, blocks and cooperation (fig 40)
   Movement 1 (b1): Launch Grid: 4,096 blocks (1,048,576 elements).
   Movement 2 (b2): Thread Block: holds up to 1,024 threads (32 warps), placed whole on one SM.
   Movement 3 (b3): Multiprocessor capacity: 2,048 threads = two 1,024-thread blocks.
   Movement 4 (b4): Cooperation boundary: shared memory is allocated per block. */

V.scene('ch08_s03', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('Grids, blocks and cooperation', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Hierarchy Layout: 3 Column Progression (Grid -> Block -> Multiprocessor)
  const colW = 390, colH = 490;
  const colY = GY + 10;
  const c1X = GX - 430, c2X = GX, c3X = GX + 430;

  // Column 1: Launch Grid
  const col1Card = S.card({ x: c1X - colW / 2, y: colY - colH / 2, w: colW, h: colH, tone: 'struct', title: '' });
  const col1Header = S.text('1 · LAUNCH GRID', { x: c1X, y: colY - colH / 2 + 38, size: 24, anchor: 'middle', weight: 700, color: 'struct' });
  const col1Sub = S.text('Entire Kernel Problem Domain', { x: c1X, y: colY - colH / 2 + 70, size: 20, anchor: 'middle', color: 'muted' });
  col1Sub.setAttribute('data-audit', 'ignore');

  const gBox = S.rect({ x: c1X - 160, y: colY - 140, w: 320, h: 220, r: 8, fill: '#15243d', stroke: S.tone('struct'), sw: 1.5 });
  const gLbl = S.text('4,096 Thread Blocks', { x: c1X, y: colY - 45, size: 24, anchor: 'middle', weight: 700, color: 'ink' });
  const gTotal = S.text('1,048,576 Total Threads', { x: c1X, y: colY - 5, size: 22, anchor: 'middle', color: 'struct', weight: 600 });
  const gNote = S.text('Dispatched across all 132 SMs', { x: c1X, y: colY + 35, size: 20, anchor: 'middle', color: 'muted' });
  gNote.setAttribute('data-audit', 'ignore');
  const gPill = S.pill('Full Grid Scope', { x: c1X, y: colY + 165, h: 40, tone: 'struct', size: 24, weight: 700 });

  // Column 2: Thread Block
  const col2Card = S.card({ x: c2X - colW / 2, y: colY - colH / 2, w: colW, h: colH, tone: 'compute', title: '' });
  const col2Header = S.text('2 · THREAD BLOCK', { x: c2X, y: colY - colH / 2 + 38, size: 24, anchor: 'middle', weight: 700, color: 'compute' });
  const col2Sub = S.text('Unit of Shared Execution', { x: c2X, y: colY - colH / 2 + 70, size: 20, anchor: 'middle', color: 'muted' });
  col2Sub.setAttribute('data-audit', 'ignore');

  const bBox = S.rect({ x: c2X - 160, y: colY - 140, w: 320, h: 220, r: 8, fill: '#241a0d', stroke: S.tone('compute'), sw: 1.5 });
  const bLbl = S.text('Up to 1,024 Threads', { x: c2X, y: colY - 45, size: 24, anchor: 'middle', weight: 700, color: 'ink' });
  const bWarps = S.text('Exactly 32 Warps', { x: c2X, y: colY - 5, size: 22, anchor: 'middle', color: 'compute', weight: 700 });
  const bSched = S.text('Placed whole on one SM', { x: c2X, y: colY + 35, size: 20, anchor: 'middle', color: 'muted' });
  bSched.setAttribute('data-audit', 'ignore');
  const bPill = S.pill('Never Split Across SMs', { x: c2X, y: colY + 165, h: 40, tone: 'compute', size: 24, weight: 700 });

  // Column 3: SM Resident Capacity & Shared Memory
  const col3Card = S.card({ x: c3X - colW / 2, y: colY - colH / 2, w: colW, h: colH, tone: 'helps', title: '' });
  const col3Header = S.text('3 · SM COOPERATION', { x: c3X, y: colY - colH / 2 + 38, size: 24, anchor: 'middle', weight: 700, color: 'helps' });
  const col3Sub = S.text('Shared Memory Boundary', { x: c3X, y: colY - colH / 2 + 70, size: 20, anchor: 'middle', color: 'muted' });
  col3Sub.setAttribute('data-audit', 'ignore');

  const smBox = S.rect({ x: c3X - 160, y: colY - 140, w: 320, h: 220, r: 8, fill: '#132822', stroke: S.tone('helps'), sw: 1.5 });
  const smLbl = S.text('2,048 Threads Capacity', { x: c3X, y: colY - 45, size: 24, anchor: 'middle', weight: 700, color: 'ink' });
  const smBlocks = S.text('2 Blocks of 1,024 Threads', { x: c3X, y: colY - 5, size: 22, anchor: 'middle', color: 'helps', weight: 700 });
  const smSmem = S.text('Private Block Scratchpad', { x: c3X, y: colY + 35, size: 20, anchor: 'middle', color: 'muted' });
  smSmem.setAttribute('data-audit', 'ignore');
  const smPill = S.pill('Shared Memory Boundary', { x: c3X, y: colY + 165, h: 40, tone: 'helps', size: 24, weight: 700 });

  // Initial visibility
  S.set([col1Card, col1Header, gBox, gLbl, gTotal, gPill], { autoAlpha: 0 });
  S.set([col2Card, col2Header, bBox, bLbl, bWarps, bPill], { autoAlpha: 0 });
  S.set([col3Card, col3Header, smBox, smLbl, smBlocks, smPill], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Launch Grid
  S.add(fx.in([col1Card, col1Header, gBox, gLbl, gTotal, gPill], { from: 'scale', d: 0.6 }), 'b1~grid-0.2');

  // ---------------------------------------------------------------- b2: Block details
  S.add(fx.in([col2Card, col2Header, bBox, bLbl, bWarps, bPill], { from: 'scale', d: 0.6 }), 'b2~twenty-four-0.2');
  S.add(fx.pulse([bBox, bWarps], { scale: 1.05, d: 0.4 }), 'b2~places');

  // ---------------------------------------------------------------- b3: SM capacity (2,048 threads)
  S.add(fx.in([col3Card, col3Header, smBox, smLbl, smBlocks], { from: 'scale', d: 0.6 }), 'b3~forty-eight-0.2');
  S.add(fx.pulse([smBox, smBlocks], { scale: 1.05, d: 0.4 }), 'b3~blocks');

  // ---------------------------------------------------------------- b4: Shared memory cooperation boundary
  S.add(fx.in(smPill, { from: 'up', d: 0.5 }), 'b4~scratchpad-0.2');
  S.add(fx.pulse([smPill, col3Card], { scale: 1.05, d: 0.5 }), 'b4~cooperates');

  // Concluding Takeaway pill
  const takeaway = S.pill('blocks are the boundary of shared memory cooperation', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
