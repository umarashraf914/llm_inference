/* ch04_s02 · the G P U trade: 132 identical copies (figs 18, 20)
   Movement 1 (b1): GPU Multiprocessor (SM) arrives: no anticipation, dense ALUs + 256 KB register file.
   Movement 2 (b2): Thread density: 64 warps × 32 threads = 2,048 resident threads.
   Movement 3 (b3): Zero-overhead latency hiding: when Warp A stalls on memory, Warp B swaps in.
   Movement 4 (b4): SM slides left; Fig 20 full die appears with 132 stamped SMs = 270,336 threads. */

V.scene('ch04_s02', S => {
  const { fx } = S;
  const GX = 960, GY = 505;

  // Heading
  const heading = S.heading('the gpu trade: 132 identical copies', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // SM container group (initially centered at GX, slides left to cx = 480 at b4)
  const smGroup = S.g();
  const sm = ch04GpuSmArea(S, { cx: GX, cy: GY, w: 580, h: 490, parent: smGroup });

  // Right side: Fig 20 stamped 132-SM full die grid (enters at b4)
  const dieGrid = ch04Die132Grid(S, { cx: 1390, cy: GY, w: 720, h: 490 });

  // Initial visibility
  S.set([
    sm.carrier, sm.header, sm.noAntBlock, sm.noAntLbl,
    sm.regBlock, sm.regTitle, sm.regSub,
    sm.mathBlock, sm.mathTitle, sm.laneGrid, sm.footer
  ], { autoAlpha: 0 });
  S.set([sm.swapBox, sm.swapTextA, sm.swapArrow, sm.swapTextB], { autoAlpha: 0 });
  S.set(dieGrid.group, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: GPU SM arrives centered
  S.add(fx.in([sm.carrier, sm.header, sm.noAntBlock, sm.noAntLbl], { from: 'fade', d: 0.5 }), 'b1~opposite-0.2');
  S.add(fx.in([sm.regBlock, sm.regTitle, sm.regSub], { from: 'fade', d: 0.4 }), 'b1~strips');
  S.add(fx.in([sm.mathBlock, sm.mathTitle, sm.laneGrid], { from: 'fade', d: 0.5 }), 'b1~arithmetic');
  S.add(fx.pulse([sm.mathBlock, sm.mathTitle], { scale: 1.04, d: 0.4 }), 'b1~lanes');

  // ---------------------------------------------------------------- b2: Thread capacity (2,048 resident threads)
  S.add(fx.in(sm.footer, { from: 'fade', d: 0.4 }), 'b2~multiprocessor-0.2');
  S.add(fx.pulse([sm.regBlock, sm.regTitle, sm.footer], { scale: 1.04, d: 0.5 }), 'b2~thousand');

  // ---------------------------------------------------------------- b3: Zero-overhead warp swap
  S.add(fx.in([sm.swapBox, sm.swapTextA, sm.swapArrow, sm.swapTextB], { from: 'fade', d: 0.5 }), 'b3~waiting-0.2');
  S.add(fx.pulse([sm.swapTextB, sm.swapBox], { scale: 1.04, d: 0.4 }), 'b3~ready');

  // ---------------------------------------------------------------- b4: Stamped 132 times = 270,336 threads
  S.add(gsap.to(smGroup, { x: -450, duration: 0.7, ease: 'power2.out' }), 'b4~stamped-0.3');
  S.add(fx.in(dieGrid.group, { from: 'fade', d: 0.6 }), 'b4~stamped');
  S.add(fx.pulse(dieGrid.calloutPill, { scale: 1.08, d: 0.5 }), 'b4~hundred');
  S.add(fx.pulse(dieGrid.summary, { scale: 1.05, d: 0.5 }), 'b4~flight');

  // Concluding Takeaway band
  const takeaway = S.takeaway('understand one multiprocessor, and you understand the whole 132-SM chip', {
    tone: 'compute'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
