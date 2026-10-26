/* ch09_s03 · the complete execution chain (fig 48)
   Movement 1 (b1): Execution hierarchy intro: Thread (1 scalar lane).
   Movement 2 (b2): Warp (32 threads, 1 shared instruction in lockstep).
   Movement 3 (b3): Block (32 warps = 1,024 threads, 1 shared memory scratchpad).
   Movement 4 (b4): Multiprocessor & Chip (64 warps/SM × 132 SMs = 270,336 threads in flight). */

V.scene('ch09_s03', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('The complete execution chain', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Subtitle card
  const subCard = S.card({
    x: GX - 460, y: 170, w: 920, h: 68,
    tone: 'neutral', title: ''
  });
  const subText = S.text('FROM A SINGLE THREAD TO 270,336 CONCURRENT LANES ACROSS THE CHIP', {
    x: GX, y: 210, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  });

  // 4 Nested Horizontal Hierarchy Cards
  const cardW = 1240, rowH = 110;
  const cX = GX - cardW / 2;

  // Level 1: Thread
  const l1Y = 275;
  const l1Card = S.card({ x: cX, y: l1Y, w: cardW, h: rowH, tone: 'struct', title: '' });
  const l1Badge = S.pill('LEVEL 1: THREAD', { x: cX + 130, y: l1Y + 36, h: 38, tone: 'struct', size: 22, weight: 700 });
  const l1Desc = S.text('One sequence of scalar arithmetic operations with private register state', { x: cX + 270, y: l1Y + 38, size: 22, color: 'ink', weight: 600 });
  const l1Stat = S.pill('1 Thread', { x: cX + cardW - 110, y: l1Y + 36, h: 38, tone: 'struct', size: 22, weight: 700 });

  // Level 2: Warp
  const l2Y = 415;
  const l2Card = S.card({ x: cX, y: l2Y, w: cardW, h: rowH, tone: 'compute', title: '' });
  const l2Badge = S.pill('LEVEL 2: WARP', { x: cX + 130, y: l2Y + 36, h: 38, tone: 'compute', size: 22, weight: 700 });
  const l2Desc = S.text('Thirty-two threads moving in lockstep, executing one shared instruction', { x: cX + 270, y: l2Y + 38, size: 22, color: 'ink', weight: 600 });
  const l2Stat = S.pill('32 Threads', { x: cX + cardW - 110, y: l2Y + 36, h: 38, tone: 'compute', size: 22, weight: 700 });

  // Level 3: Block
  const l3Y = 555;
  const l3Card = S.card({ x: cX, y: l3Y, w: cardW, h: rowH, tone: 'helps', title: '' });
  const l3Badge = S.pill('LEVEL 3: BLOCK', { x: cX + 130, y: l3Y + 36, h: 38, tone: 'helps', size: 22, weight: 700 });
  const l3Desc = S.text('Up to 32 warps (1,024 threads) sharing one private on-chip scratchpad', { x: cX + 270, y: l3Y + 38, size: 22, color: 'ink', weight: 600 });
  const l3Stat = S.pill('1,024 Threads', { x: cX + cardW - 110, y: l3Y + 36, h: 38, tone: 'helps', size: 22, weight: 700 });

  // Level 4: Full Chip
  const l4Y = 695;
  const l4Card = S.card({ x: cX, y: l4Y, w: cardW, h: 130, tone: 'compute', title: '' });
  const l4Badge = S.pill('LEVEL 4: CHIP', { x: cX + 130, y: l4Y + 40, h: 38, tone: 'compute', size: 22, weight: 700 });
  const l4Desc = S.text('132 SMs × 2,048 threads = 270,336 threads in flight', { x: cX + 270, y: l4Y + 42, size: 22, color: 'compute', weight: 700 });
  const l4Stat = S.pill('270,336 Threads', { x: cX + cardW - 120, y: l4Y + 40, h: 42, tone: 'compute', size: 22, weight: 700, style: 'solid' });

  // Initial visibility
  S.set([subCard, subText], { autoAlpha: 0 });
  S.set([l1Card, l1Badge, l1Desc, l1Stat], { autoAlpha: 0 });
  S.set([l2Card, l2Badge, l2Desc, l2Stat], { autoAlpha: 0 });
  S.set([l3Card, l3Badge, l3Desc, l3Stat], { autoAlpha: 0 });
  S.set([l4Card, l4Badge, l4Desc, l4Stat], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Level 1 (Thread)
  S.add(fx.in([subCard, subText], { from: 'up', d: 0.4 }), 'b1~hierarchy-0.2');
  S.add(fx.in([l1Card, l1Badge, l1Desc, l1Stat], { from: 'left', d: 0.5 }), 'b1~thread-0.2');

  // ---------------------------------------------------------------- b2: Level 2 (Warp)
  S.add(fx.in([l2Card, l2Badge, l2Desc, l2Stat], { from: 'left', d: 0.5 }), 'b2~Thirty-two-0.2');
  S.add(fx.pulse([l2Badge, l2Stat], { scale: 1.05, d: 0.4 }), 'b2~warp');

  // ---------------------------------------------------------------- b3: Level 3 (Block)
  S.add(fx.in([l3Card, l3Badge, l3Desc, l3Stat], { from: 'left', d: 0.5 }), 'b3~thirty-two-0.2');
  S.add(fx.pulse([l3Badge, l3Stat], { scale: 1.05, d: 0.4 }), 'b3~scratchpad');

  // ---------------------------------------------------------------- b4: Level 4 (Multiprocessor & Full Chip)
  S.add(fx.in([l4Card, l4Badge, l4Desc, l4Stat], { from: 'up', d: 0.5 }), 'b4~sixty-four-0.2');
  S.add(fx.pulse([l4Card, l4Stat], { scale: 1.08, d: 0.5 }), 'b4~chip');

  // Concluding Takeaway pill
  const takeaway = S.pill('threads make warps, warps make blocks, blocks fill multiprocessors', {
    x: GX, y: 990, h: 48, tone: 'compute', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
