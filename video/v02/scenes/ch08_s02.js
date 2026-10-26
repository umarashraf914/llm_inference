/* ch08_s02 · writing a kernel (fig 39)
   Movement 1 (b1): CUDA Kernel code window: written once, executed by millions of threads.
   Movement 2 (b2): Thread identity: blockIdx.x and threadIdx.x provided by hardware.
   Movement 3 (b3): Global index calculation: Block 3, Thread 5 -> 3 × 256 + 5 = 773.
   Movement 4 (b4): Contiguous memory: 32 adjacent threads read 128 contiguous bytes. */

V.scene('ch08_s02', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('Writing a kernel', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Top Section: CUDA C Code Card
  const codeW = 1240, codeH = 205;
  const codeCard = S.card({
    x: GX - codeW / 2, y: 175, w: codeW, h: codeH,
    tone: 'struct', title: ''
  });
  const codeTitle = S.text('CUDA C KERNEL · SINGLE-THREAD SPECIFICATION', {
    x: GX - codeW / 2 + 40, y: 212, size: 22, weight: 700, color: 'struct'
  });
  const cLine1 = S.text('int i = blockIdx.x * blockDim.x + threadIdx.x;', {
    x: GX - codeW / 2 + 40, y: 260, size: 24, family: 'mono', color: 'compute', weight: 700
  });
  const cLine2 = S.text('c[i] = a[i] + b[i];', {
    x: GX - codeW / 2 + 40, y: 310, size: 24, family: 'mono', color: 'ink', weight: 600
  });

  // Middle Section: Index Evaluation Card (Thread 5, Block 3)
  const evalW = 1240, evalH = 175;
  const evalCard = S.card({
    x: GX - evalW / 2, y: 410, w: evalW, h: evalH,
    tone: 'compute', title: ''
  });
  const evalTitle = S.text('INDEX ARITHMETIC FOR THREAD 5 IN BLOCK 3', {
    x: GX - evalW / 2 + 40, y: 448, size: 22, weight: 700, color: 'compute'
  });
  const evalEq = S.text('i = (3 × 256) + 5 = 773', {
    x: GX - evalW / 2 + 40, y: 500, size: 26, family: 'mono', color: 'ink', weight: 700
  });
  const byteEq = S.text('Byte offset in global memory: 773 × 4 bytes = 3,092 B', {
    x: GX - evalW / 2 + 40, y: 545, size: 22, color: 'muted', weight: 600
  });
  const targetPill = S.pill('Array Element: c[773]', {
    x: GX + evalW / 2 - 170, y: 500, h: 44, tone: 'compute', size: 22, weight: 700
  });

  // Bottom Section: 128-byte Contiguous Access Card
  const botW = 1240, botH = 180;
  const botCard = S.card({
    x: GX - botW / 2, y: 615, w: botW, h: botH,
    tone: 'helps', title: ''
  });
  const botTitle = S.text('CONTIGUOUS MEMORY ACCESS · 32 ADJACENT THREADS = 128 BYTES', {
    x: GX - botW / 2 + 40, y: 652, size: 22, weight: 700, color: 'helps'
  });
  const botDesc = S.text('Threads 64 through 95 access elements a[64] through a[95] side-by-side', {
    x: GX - botW / 2 + 40, y: 705, size: 22, color: 'ink', weight: 600
  });
  const botPill = S.pill('32 floats × 4 bytes = 128 contiguous bytes (1 Cache Line)', {
    x: GX, y: 755, h: 44, tone: 'helps', size: 22, weight: 700, style: 'solid'
  });

  // Initial visibility
  S.set([codeCard, codeTitle, cLine1, cLine2], { autoAlpha: 0 });
  S.set([evalCard, evalTitle, evalEq, byteEq, targetPill], { autoAlpha: 0 });
  S.set([botCard, botTitle, botDesc, botPill], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Code window
  S.add(fx.in([codeCard, codeTitle, cLine1, cLine2], { from: 'scale', d: 0.6 }), 'b1~program-0.2');

  // ---------------------------------------------------------------- b2: Identical execution
  S.add(fx.pulse([cLine1, cLine2], { scale: 1.03, d: 0.5 }), 'b2~identical-0.2');

  // ---------------------------------------------------------------- b3: Thread 5 Block 3 index calculation
  S.add(fx.in([evalCard, evalTitle, evalEq, byteEq, targetPill], { from: 'up', d: 0.5 }), 'b3~works-0.2');
  S.add(fx.pulse(targetPill, { scale: 1.08, d: 0.5 }), 'b3~seventy-three');

  // ---------------------------------------------------------------- b4: Contiguous warp memory access
  S.add(fx.in([botCard, botTitle, botDesc, botPill], { from: 'up', d: 0.5 }), 'b4~Neighbouring-0.2');
  S.add(fx.pulse(botPill, { scale: 1.08, d: 0.5 }), 'b4~consecutive');

  // Concluding Takeaway pill
  const takeaway = S.pill('index arithmetic naturally organizes warps into contiguous memory requests', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
