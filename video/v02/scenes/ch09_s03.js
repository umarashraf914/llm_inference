/* ch09_s03 · the complete execution chain (fig 48)
   Movement 1 (b1): Execution hierarchy intro: Thread (1 scalar lane with private registers).
   Movement 2 (b2): Warp (32 threads, 1 shared instruction in lockstep).
   Movement 3 (b3): Block (32 warps = 1,024 threads, 1 shared memory scratchpad).
   Movement 4 (b4): Multiprocessor & Chip (64 warps/SM × 132 SMs = 270,336 threads in flight). */

V.scene('ch09_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('the complete execution chain', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Concentric nesting hierarchy (Atlas Fig 48)
  const hier = ch09ConcentricHierarchy(S, { cx: GX, cy: 505 });

  // Takeaway band
  const takeaway = S.takeaway('threads make warps, warps make blocks, blocks fill multiprocessors', {
    tone: 'compute'
  });

  // Initial visibility: hide outer layers first, show thread initially
  S.set([
    hier.chipCard, hier.chipLbl,
    hier.smCard, hier.smLbl,
    hier.blkCard, hier.blkLbl,
    hier.warpCard, hier.warpLbl,
    hier.threadsG,
    takeaway.el
  ], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Level 1 (Thread)
  S.add(fx.in(hier.threadsG, { from: 'up', d: 0.5 }), 'b1~hierarchy-0.2');
  if (hier.threadBoxes[0]) {
    S.add(fx.pulse(hier.threadBoxes[0].rect, { scale: 1.15, d: 0.4 }), 'b1~thread');
  }

  // ---------------------------------------------------------------- b2: Level 2 (Warp)
  S.add(fx.in([hier.warpCard, hier.warpLbl], { from: 'fade', d: 0.5 }), 'b2~Thirty-two-0.2');
  S.add(fx.pulse(hier.warpLbl, { scale: 1.05, d: 0.4 }), 'b2~warp');

  // ---------------------------------------------------------------- b3: Level 3 (Block)
  S.add(fx.in([hier.blkCard, hier.blkLbl], { from: 'fade', d: 0.5 }), 'b3~thirty-two-0.2');
  S.add(fx.pulse(hier.blkLbl, { scale: 1.05, d: 0.4 }), 'b3~scratchpad');

  // ---------------------------------------------------------------- b4: Level 4 & 5 (Multiprocessor & Chip)
  S.add(fx.in([hier.smCard, hier.smLbl], { from: 'fade', d: 0.4 }), 'b4~sixty-four-0.2');
  S.add(fx.in([hier.chipCard, hier.chipLbl], { from: 'fade', d: 0.4 }), 'b4~thirty-two-0.1');
  S.add(fx.pulse(hier.chipLbl, { scale: 1.05, d: 0.5 }), 'b4~chip');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
