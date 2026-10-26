/* ch10_s03 · the two cardinal sins (fig 52)
   Movement 1 (b1): The two cardinal sins: Divergence vs Uncoalesced access.
   Movement 2 (b2): Both share the root cause: 32 lanes bound in hardware lockstep.
   Movement 3 (b3): Divergence wastes arithmetic issue slots.
   Movement 4 (b4): Uncoalesced access wastes scarce memory bandwidth. */

V.scene('ch10_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('The two cardinal sins', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Shared root cause pill
  const rootPill = S.pill('SHARED ROOT CAUSE: 32 LANES ARE HARDWARE-BOUND TO ACT AS ONE', {
    x: GX, y: 190, h: 46, tone: 'struct', size: 20, weight: 700
  });

  // Left Panel: Divergence (Instruction Mismatch)
  const leftX = 230;
  const cardW = 690;
  const cardH = 550;
  const cardY = 250;

  const leftCard = S.card({
    x: leftX, y: cardY, w: cardW, h: cardH,
    tone: 'violet', title: ''
  });
  const leftTitle = S.text('FIRST SIN: BRANCH DIVERGENCE', {
    x: leftX + cardW / 2, y: cardY + 45, size: 24, anchor: 'middle', weight: 700, color: 'violet'
  });
  const leftSub = S.text('Instruction Mismatch Within Warp', {
    x: leftX + cardW / 2, y: cardY + 80, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  });

  // Left internal details
  const lRow1 = S.card({ x: leftX + 30, y: cardY + 120, w: cardW - 60, h: 90, tone: 'neutral', title: '' });
  const lRow1T = S.text('Cause: Lanes take differing branch paths', { x: leftX + 50, y: cardY + 172, size: 20, weight: 600, color: 'ink' });

  const lRow2 = S.card({ x: leftX + 30, y: cardY + 230, w: cardW - 60, h: 90, tone: 'neutral', title: '' });
  const lRow2T = S.text('Mechanism: Hardware serializes passes', { x: leftX + 50, y: cardY + 282, size: 20, weight: 600, color: 'ink' });

  const lRow3 = S.card({ x: leftX + 30, y: cardY + 340, w: cardW - 60, h: 90, tone: 'neutral', title: '' });
  const lRow3T = S.text('Wasted Resource: Arithmetic Issue Slots', { x: leftX + 50, y: cardY + 392, size: 20, weight: 700, color: 'violet' });

  const leftPill = S.pill('COMPUTE IS CHEAP · WASTES ALU CYCLES', {
    x: leftX + cardW / 2, y: cardY + 480, h: 42, tone: 'violet', size: 20, weight: 700
  });

  // Right Panel: Uncoalesced Access (Address Mismatch)
  const rightX = 1000;
  const rightCard = S.card({
    x: rightX, y: cardY, w: cardW, h: cardH,
    tone: 'bytes', title: ''
  });
  const rightTitle = S.text('SECOND SIN: UNCOALESCED ACCESS', {
    x: rightX + cardW / 2, y: cardY + 45, size: 24, anchor: 'middle', weight: 700, color: 'bytes'
  });
  const rightSub = S.text('Address Mismatch Within Warp', {
    x: rightX + cardW / 2, y: cardY + 80, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  });

  // Right internal details
  const rRow1 = S.card({ x: rightX + 30, y: cardY + 120, w: cardW - 60, h: 90, tone: 'neutral', title: '' });
  const rRow1T = S.text('Cause: Lanes request scattered memory addresses', { x: rightX + 50, y: cardY + 172, size: 20, weight: 600, color: 'ink' });

  const rRow2 = S.card({ x: rightX + 30, y: cardY + 230, w: cardW - 60, h: 90, tone: 'neutral', title: '' });
  const rRow2T = S.text('Mechanism: Memory splits into multiple bursts', { x: rightX + 50, y: cardY + 282, size: 20, weight: 600, color: 'ink' });

  const rRow3 = S.card({ x: rightX + 30, y: cardY + 340, w: cardW - 60, h: 90, tone: 'neutral', title: '' });
  const rRow3T = S.text('Wasted Resource: Memory Bus Bandwidth', { x: rightX + 50, y: cardY + 392, size: 20, weight: 700, color: 'bytes' });

  const rightPill = S.pill('BANDWIDTH IS SCARCE · WASTES BUS CAPACITY', {
    x: rightX + cardW / 2, y: cardY + 480, h: 42, tone: 'bytes', size: 20, weight: 700
  });

  // Concluding Takeaway pill
  const takeaway = S.pill('a group that acts as one must agree on instructions and on addresses alike', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 600, style: 'solid'
  });

  // Initial visibility
  S.set([rootPill, takeaway], { autoAlpha: 0 });
  S.set([leftCard, leftTitle, leftSub, lRow1, lRow1T, lRow2, lRow2T, lRow3, lRow3T, leftPill], { autoAlpha: 0 });
  S.set([rightCard, rightTitle, rightSub, rRow1, rRow1T, rRow2, rRow2T, rRow3, rRow3T, rightPill], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Two sins appear
  S.add(fx.in([leftCard, leftTitle], { from: 'scale', d: 0.5 }), 'b1~first-0.2');
  S.add(fx.in(leftSub, { from: 'up', d: 0.5 }), 'b1~first');
  S.add(fx.in([rightCard, rightTitle], { from: 'scale', d: 0.5 }), 'b1~second-0.2');
  S.add(fx.in(rightSub, { from: 'up', d: 0.5 }), 'b1~second');

  // ---------------------------------------------------------------- b2: Root cause lockstep
  S.add(fx.in(rootPill, { from: 'up', d: 0.5 }), 'b2~exact-0.2');
  S.add(fx.pulse(rootPill, { scale: 1.05, d: 0.4 }), 'b2~bound');

  // ---------------------------------------------------------------- b3: Divergence details (instruction mismatch)
  S.add(fx.in([lRow1, lRow1T, lRow2, lRow2T, lRow3, lRow3T], { from: 'up', stagger: 0.1, d: 0.4 }), 'b3~instructions,-0.2');
  S.add(fx.in(leftPill, { from: 'up', d: 0.4 }), 'b3~slots.');
  S.add(fx.pulse([leftTitle, leftPill], { scale: 1.05, d: 0.4 }), 'b3~arithmetic');

  // ---------------------------------------------------------------- b4: Uncoalesced details (bandwidth is scarcer)
  S.add(fx.in([rRow1, rRow1T, rRow2, rRow2T, rRow3, rRow3T], { from: 'up', stagger: 0.1, d: 0.4 }), 'b4~scattered-0.2');
  S.add(fx.in(rightPill, { from: 'up', d: 0.4 }), 'b4~scarcer');
  S.add(fx.pulse([rightTitle, rightPill], { scale: 1.05, d: 0.4 }), 'b4~bandwidth');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
