/* ch04_s02 · the G P U trade: 132 identical copies (figs 18, 20)
   Movement 1 (b1): GPU Streaming Multiprocessor (SM) schematic: dense ALUs & massive register file.
   Movement 2 (b2): Concurrency inside 1 SM: 2,048 resident threads.
   Movement 3 (b3): Zero-overhead latency hiding: when Warp A stalls on memory, Warp B swaps in.
   Movement 4 (b4): Stamped 132 times: 132 SMs × 2,048 = 270,336 threads in flight. */

V.scene('ch04_s02', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('The GPU trade: 132 identical copies', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Left: GPU Multiprocessor (SM)
  const smCX = 480;
  const sm = ch04GpuSM(S, { cx: smCX, cy: GY + 10, w: 520, h: 500 });

  // Right: Concurrency & Stamping Dashboard Card
  const dCX = 1280;
  const dW = 780, dH = 500;
  const dashCard = S.card({
    x: dCX - dW / 2, y: GY + 10 - dH / 2, w: dW, h: dH,
    tone: 'compute', title: ''
  });
  const dashTitle = S.text('CONCURRENCY & CHIP-WIDE SCALING', {
    x: dCX, y: GY + 10 - dH / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'compute'
  });

  // Step 1: Thread capacity in 1 SM
  const t1Y = GY - 120;
  const t1Card = S.card({
    x: dCX - dW / 2 + 25, y: t1Y - 45, w: dW - 50, h: 90,
    tone: 'struct', title: ''
  });
  const t1Title = S.text('1 · SINGLE MULTIPROCESSOR CAPACITY', { x: dCX - dW / 2 + 50, y: t1Y - 12, size: 22, color: 'struct', weight: 700 });
  const t1Val = S.text('64 Warps × 32 Threads = 2,048 Resident Threads', { x: dCX - dW / 2 + 50, y: t1Y + 22, size: 22, family: 'mono', color: 'ink', weight: 600 });

  // Step 2: Zero-Cost Warp Switching
  const t2Y = GY - 5;
  const t2Card = S.card({
    x: dCX - dW / 2 + 25, y: t2Y - 45, w: dW - 50, h: 90,
    tone: 'helps', title: ''
  });
  const t2Title = S.text('2 · ZERO-OVERHEAD LATENCY HIDING', { x: dCX - dW / 2 + 50, y: t2Y - 12, size: 22, color: 'helps', weight: 700 });
  const t2Val = S.text('Warp A stalls on memory  →  Warp B executes instantly', { x: dCX - dW / 2 + 50, y: t2Y + 22, size: 22, color: 'helps', weight: 600 });

  // Step 3: 132 SMs Stamped Across Chip
  const t3Y = GY + 120;
  const t3Card = S.card({
    x: dCX - dW / 2 + 25, y: t3Y - 55, w: dW - 50, h: 125,
    tone: 'compute', title: ''
  });
  const t3Title = S.text('3 · FULL CHIP EXECUTION CONCURRENCY', { x: dCX - dW / 2 + 50, y: t3Y - 20, size: 22, color: 'compute', weight: 700 });
  const t3Val = S.text('132 SMs × 2,048 threads = 270,336 threads', { x: dCX - dW / 2 + 50, y: t3Y + 16, size: 24, family: 'mono', color: 'compute', weight: 700 });
  const t3Badge = S.pill('270,336 THREADS IN FLIGHT', { x: dCX, y: t3Y + 50, h: 40, tone: 'compute', size: 22, weight: 700 });

  // Initial visibility
  S.set([sm.card, sm.title, sm.regBox, sm.regLbl, sm.regSub, sm.schedBox, sm.schedLbl, sm.mathBox, sm.mathLbl, sm.lanesG], { autoAlpha: 0 });
  S.set([dashCard, dashTitle, t1Card, t1Title, t1Val, t2Card, t2Title, t2Val, t3Card, t3Title, t3Val, t3Badge], { autoAlpha: 0 });

  // Animations
  // b1: GPU SM schematic appears
  S.add(fx.in([sm.card, sm.title, sm.regBox, sm.regLbl, sm.regSub, sm.schedBox, sm.schedLbl, sm.mathBox, sm.mathLbl, sm.lanesG], { from: 'scale', d: 0.6 }), 'b1~opposite-0.2');
  S.add(fx.pulse([sm.mathBox, sm.mathLbl], { scale: 1.05, d: 0.5 }), 'b1~arithmetic');

  // b2: 2,048 resident threads in 1 SM
  S.add(fx.in([dashCard, dashTitle, t1Card, t1Title, t1Val], { from: 'right', d: 0.5 }), 'b2~thousand-0.2');
  S.add(fx.pulse([t1Card, t1Val], { scale: 1.05, d: 0.4 }), 'b2~threads');

  // b3: Zero-overhead warp swap
  S.add(fx.in([t2Card, t2Title, t2Val], { from: 'right', d: 0.5 }), 'b3~waiting-0.2');
  S.add(fx.pulse([t2Card, t2Val], { scale: 1.05, d: 0.4 }), 'b3~ready');

  // b4: Stamped 132 times = 270,336 threads
  S.add(fx.in([t3Card, t3Title, t3Val, t3Badge], { from: 'up', d: 0.5 }), 'b4~stamped-0.2');
  S.add(fx.pulse(t3Badge, { scale: 1.1, d: 0.5 }), 'b4~flight');

  // Concluding Takeaway pill
  const takeaway = S.pill('understand one multiprocessor, and you understand the entire 814 mm² chip', {
    x: GX, y: 990, h: 48, tone: 'compute', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
