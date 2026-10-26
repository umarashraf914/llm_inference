/* ch03_s04 · the three questions that guide the machine (fig 11)
   Movement 1 (b1): Three question cards outline the core journey of the entire film.
   Movement 2 (b2): Question 1 (blue): Why so different from a CPU? Thousands of simple lanes.
   Movement 3 (b3): Question 2 (coral): Why is a byte so expensive? Capacitor physics and memory hierarchy.
   Movement 4 (b4): Question 3 (teal): What can hardware do to fight back? Latency hiding, coalescing, tensor cores. */

V.scene('ch03_s04', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('The three questions that guide the machine', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Subtitle banner
  const subCard = S.card({
    x: GX - 440, y: 170, w: 880, h: 70,
    tone: 'neutral', title: ''
  });
  const subText = S.text('THREE FOUNDATIONAL QUESTIONS THAT GOVERN GPU ARCHITECTURE', {
    x: GX, y: 212, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  });

  // 3 Large question cards stacked vertically or in clean rows
  const cardW = 1200, cardH = 175;
  const cardX = GX - cardW / 2;

  // Question 1: CPU vs GPU (blue/struct)
  const q1Y = 265;
  const q1Card = S.card({ x: cardX, y: q1Y, w: cardW, h: cardH, tone: 'struct', title: '' });
  const q1Badge = S.pill('QUESTION 1', { x: cardX + 110, y: q1Y + 38, h: 40, tone: 'struct', size: 22, weight: 700 });
  const q1Title = S.text('Why is this processor designed so differently from a CPU?', {
    x: cardX + 225, y: q1Y + 40, size: 22, weight: 700, color: 'ink'
  });
  const q1Ans = S.text('Answer: It trades complex prediction and caching for thousands of identical arithmetic lanes.', {
    x: cardX + 40, y: q1Y + 110, size: 22, color: 'struct', weight: 600
  });
  const q1Chap = S.pill('Chapters 4 – 10', { x: cardX + cardW - 130, y: q1Y + 38, h: 40, tone: 'struct', size: 22, weight: 700 });

  // Question 2: The Expensive Byte (coral/bytes)
  const q2Y = 465;
  const q2Card = S.card({ x: cardX, y: q2Y, w: cardW, h: cardH, tone: 'bytes', title: '' });
  const q2Badge = S.pill('QUESTION 2', { x: cardX + 110, y: q2Y + 38, h: 40, tone: 'bytes', size: 22, weight: 700 });
  const q2Title = S.text('Why is moving a byte so expensive next to computing an operation?', {
    x: cardX + 225, y: q2Y + 40, size: 22, weight: 700, color: 'ink'
  });
  const q2Ans = S.text('Answer: The physics of dynamic RAM capacitors, long distance wires, and thermal energy walls.', {
    x: cardX + 40, y: q2Y + 110, size: 22, color: 'bytes', weight: 600
  });
  const q2Chap = S.pill('Chapters 11 – 15', { x: cardX + cardW - 130, y: q2Y + 38, h: 40, tone: 'bytes', size: 22, weight: 700 });

  // Question 3: Hardware Fightback (teal/helps)
  const q3Y = 665;
  const q3Card = S.card({ x: cardX, y: q3Y, w: cardW, h: cardH, tone: 'helps', title: '' });
  const q3Badge = S.pill('QUESTION 3', { x: cardX + 110, y: q3Y + 38, h: 40, tone: 'helps', size: 22, weight: 700 });
  const q3Title = S.text('What does the hardware do to survive slow memory?', {
    x: cardX + 225, y: q3Y + 40, size: 22, weight: 700, color: 'ink'
  });
  const q3Ans = S.text('Answer: Zero-overhead latency hiding, memory coalescing, tensor cores, and low precision math.', {
    x: cardX + 40, y: q3Y + 110, size: 22, color: 'helps', weight: 600
  });
  const q3Chap = S.pill('Chapters 16 – 21', { x: cardX + cardW - 130, y: q3Y + 38, h: 40, tone: 'helps', size: 22, weight: 700 });

  // Initial visibility
  S.set([subCard, subText], { autoAlpha: 0 });
  S.set([q1Card, q1Badge, q1Title, q1Ans, q1Chap], { autoAlpha: 0 });
  S.set([q2Card, q2Badge, q2Title, q2Ans, q2Chap], { autoAlpha: 0 });
  S.set([q3Card, q3Badge, q3Title, q3Ans, q3Chap], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Cards enter
  S.add(fx.in([subCard, subText], { from: 'up', d: 0.4 }), 'b1~three-0.2');
  S.add(fx.in([q1Card, q2Card, q3Card], { from: 'scale', d: 0.5, stagger: 0.1 }), 'b1~questions');

  // ---------------------------------------------------------------- b2: Question 1
  S.add(fx.in([q1Badge, q1Title, q1Ans, q1Chap], { from: 'left', d: 0.5 }), 'b2~First-0.2');
  S.add(fx.pulse([q1Badge, q1Card], { scale: 1.03, d: 0.5 }), 'b2~thousands');

  // ---------------------------------------------------------------- b3: Question 2
  S.add(fx.in([q2Badge, q2Title, q2Ans, q2Chap], { from: 'left', d: 0.5 }), 'b3~Second-0.2');
  S.add(fx.pulse([q2Badge, q2Card], { scale: 1.03, d: 0.5 }), 'b3~physics');

  // ---------------------------------------------------------------- b4: Question 3
  S.add(fx.in([q3Badge, q3Title, q3Ans, q3Chap], { from: 'left', d: 0.5 }), 'b4~third-0.2');
  S.add(fx.pulse([q3Badge, q3Card], { scale: 1.03, d: 0.5 }), 'b4~hiding');

  // Concluding Takeaway pill
  const takeaway = S.pill('three questions that govern the entire GPU architecture', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
