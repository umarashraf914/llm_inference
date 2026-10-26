/* ch07_s02 · the tensor memory accelerator (figs 35, 36)
   Movement 1 (b1): Legacy copy loop: threads spend precious arithmetic issue slots fetching data.
   Movement 2 (b2): Cost on 64×64 tile: 128 threads issue 512 copy instructions (slots lost from math).
   Movement 3 (b3): Hopper innovation: TMA dedicated hardware copy engine.
   Movement 4 (b4): TMA descriptor: base address, tile shape, row stride. 1 thread issues 1 instruction.
   Movement 5 (b5): Background streaming: all 64 rows transferred while threads continue computing. */

V.scene('ch07_s02', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('The tensor memory accelerator', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Comparative Columns: Legacy Software Copying vs Hopper TMA Hardware
  const colW = 590, colH = 340;
  const c1X = GX - 315, c2X = GX + 315;
  const colY = GY - 65;

  // ---------------------------------------------------------------- Left: Legacy Software Thread Copying
  const leftCard = S.card({ x: c1X - colW / 2, y: colY - colH / 2, w: colW, h: colH, tone: 'bytes', title: '' });
  const leftTitle = S.text('LEGACY: THREAD-DRIVEN MEMORY COPY', { x: c1X, y: colY - colH / 2 + 36, size: 22, anchor: 'middle', weight: 700, color: 'bytes' });

  const lRow1 = S.text('128 threads manually compute row & column addresses', { x: c1X, y: colY - 55, size: 22, anchor: 'middle', color: 'ink' });
  const lPill = S.pill('512 COPY INSTRUCTIONS ISSUED', { x: c1X, y: colY + 10, h: 44, tone: 'bytes', size: 22, weight: 700 });
  const lRow2 = S.text('Math units sit stalled while threads copy memory', { x: c1X, y: colY + 80, size: 22, anchor: 'middle', color: 'bytes', weight: 600 });

  // ---------------------------------------------------------------- Right: Hopper TMA Hardware Engine
  const rightCard = S.card({ x: c2X - colW / 2, y: colY - colH / 2, w: colW, h: colH, tone: 'helps', title: '' });
  const rightTitle = S.text('HOPPER: TMA ASYNCHRONOUS COPY ENGINE', { x: c2X, y: colY - colH / 2 + 36, size: 22, anchor: 'middle', weight: 700, color: 'helps' });

  const rRow1 = S.text('Autonomous engine streams multidimensional tiles', { x: c2X, y: colY - 55, size: 22, anchor: 'middle', color: 'ink' });
  const rPill = S.pill('1 SINGLE INSTRUCTION ISSUED', { x: c2X, y: colY + 10, h: 44, tone: 'helps', size: 22, weight: 700 });
  const rRow2 = S.text('Arithmetic lanes remain 100% active computing tokens', { x: c2X, y: colY + 80, size: 22, anchor: 'middle', color: 'helps', weight: 600 });

  // ---------------------------------------------------------------- Bottom: TMA Descriptor & Background Flow
  const botCard = S.card({
    x: GX - 610, y: GY + 140, w: 1220, h: 220,
    tone: 'neutral', title: ''
  });
  const botTitle = S.text('TMA TILE DESCRIPTOR · 1 THREAD LAUNCHES FULL BACKGROUND TRANSFER', {
    x: GX, y: GY + 178, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  });

  // Descriptor elements
  const dY = GY + 250;
  const p1 = S.pill('Base Addr (HBM)', { x: GX - 420, y: dY, h: 40, tone: 'neutral', size: 22, weight: 600 });
  const p2 = S.pill('Shape: 64×64', { x: GX - 210, y: dY, h: 40, tone: 'compute', size: 22, weight: 700 });
  const p3 = S.pill('Element: 16-bit', { x: GX, y: dY, h: 40, tone: 'compute', size: 22, weight: 700 });
  const p4 = S.pill('Stride: 8,192 B', { x: GX + 210, y: dY, h: 40, tone: 'struct', size: 22, weight: 600 });
  const pDone = S.pill('ASYNC COPY ACTIVE', { x: GX + 430, y: dY, h: 40, tone: 'helps', size: 22, weight: 700 });

  // Initial visibility
  S.set([leftCard, leftTitle, lRow1, lPill, lRow2], { autoAlpha: 0 });
  S.set([rightCard, rightTitle, rRow1, rPill, rRow2], { autoAlpha: 0 });
  S.set([botCard, botTitle, p1, p2, p3, p4, pDone], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Legacy thread copy
  S.add(fx.in([leftCard, leftTitle, lRow1], { from: 'left', d: 0.5 }), 'b1~spend-0.2');

  // ---------------------------------------------------------------- b2: 512 copy instructions lost
  S.add(fx.in([lPill, lRow2], { from: 'up', d: 0.5 }), 'b2~twelve-0.2');
  S.add(fx.pulse(lPill, { scale: 1.08, d: 0.5 }), 'b2~slots');

  // ---------------------------------------------------------------- b3: TMA hardware arrival
  S.add(fx.in([rightCard, rightTitle, rRow1, rPill, rRow2], { from: 'right', d: 0.6 }), 'b3~accelerator-0.2');
  S.add(fx.pulse(rPill, { scale: 1.08, d: 0.5 }), 'b3~independently');

  // ---------------------------------------------------------------- b4: Descriptor & 1 instruction
  S.add(fx.in([botCard, botTitle, p1, p2, p3, p4], { from: 'up', d: 0.5 }), 'b4~descriptor-0.2');
  S.add(fx.pulse([p2, p3], { scale: 1.05, d: 0.4 }), 'b4~single');

  // ---------------------------------------------------------------- b5: Background streaming
  S.add(fx.in(pDone, { from: 'scale', d: 0.4 }), 'b5~streams-0.2');
  S.add(fx.pulse([pDone, rightCard], { scale: 1.05, d: 0.5 }), 'b5~computing');

  // Concluding Takeaway pill
  const takeaway = S.pill('TMA overlaps memory staging with compute without spending thread instructions', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
