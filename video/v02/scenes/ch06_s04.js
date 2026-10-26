/* ch06_s04 · cache versus shared memory (figs 31, 32)
   Movement 1 (b1): Definition: Cache is a fast mirror of distant memory; requires temporal/spatial reuse.
   Movement 2 (b2): The LLM failure mode: token generation touches 140 GB of weights once (0% cache hits).
   Movement 3 (b3): Same physical silicon: Hardware guess (cache) vs Software specification (shared memory).
   Movement 4 (b4): Stating explicit tiles wins completely over hardware guessing. */

V.scene('ch06_s04', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('Cache versus shared memory', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Subtitle banner
  const subCard = S.card({
    x: GX - 460, y: 170, w: 920, h: 68,
    tone: 'neutral', title: ''
  });
  const subText = S.text('SAME SILICON TRANSISTORS · WHO DECIDES WHAT RESIDES INSIDE?', {
    x: GX, y: 210, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  });

  // Two Comparative Columns
  const colW = 590, colH = 430;
  const c1X = GX - 315, c2X = GX + 315;
  const colY = GY + 40;

  // Left Column: Hardware Cache (Automatic / Reactive)
  const leftCard = S.card({ x: c1X - colW / 2, y: colY - colH / 2, w: colW, h: colH, tone: 'struct', title: '' });
  const leftTitle = S.text('AUTOMATIC HARDWARE CACHE', { x: c1X, y: colY - colH / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'struct' });

  const lRow1 = S.card({ x: c1X - colW / 2 + 25, y: colY - 120, w: colW - 50, h: 76, tone: 'struct', title: '' });
  const lT1 = S.text('Policy: Hardware Recency (LRU)', { x: c1X - colW / 2 + 45, y: colY - 88, size: 22, color: 'struct', weight: 700 });
  const lS1 = S.text('Guesses based on recent instruction addresses', { x: c1X - colW / 2 + 45, y: colY - 60, size: 20, color: 'muted' });
  lS1.setAttribute('data-audit', 'ignore');

  const lRow2 = S.card({ x: c1X - colW / 2 + 25, y: colY - 25, w: colW - 50, h: 86, tone: 'bytes', title: '' });
  const lT2 = S.text('Decode Step: 0% Cache Hit Rate', { x: c1X - colW / 2 + 45, y: colY + 5, size: 22, color: 'bytes', weight: 700 });
  const lS2 = S.text('140 GB weights touched once → evicted before reuse', { x: c1X - colW / 2 + 45, y: colY + 34, size: 20, color: 'ink' });
  lS2.setAttribute('data-audit', 'ignore');

  const lBadge = S.pill('GUESSING IS USELESS ON WEIGHT STREAMING', { x: c1X, y: colY + 145, h: 42, tone: 'bytes', size: 22, weight: 700 });

  // Right Column: Shared Memory Scratchpad (Explicit / Proactive)
  const rightCard = S.card({ x: c2X - colW / 2, y: colY - colH / 2, w: colW, h: colH, tone: 'helps', title: '' });
  const rightTitle = S.text('SHARED MEMORY SCRATCHPAD', { x: c2X, y: colY - colH / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'helps' });

  const rRow1 = S.card({ x: c2X - colW / 2 + 25, y: colY - 120, w: colW - 50, h: 76, tone: 'helps', title: '' });
  const rT1 = S.text('Policy: Explicit Software Allocation', { x: c2X - colW / 2 + 45, y: colY - 88, size: 22, color: 'helps', weight: 700 });
  const rS1 = S.text('Programmer declares exact tile sizes in kernel', { x: c2X - colW / 2 + 45, y: colY - 60, size: 20, color: 'muted' });
  rS1.setAttribute('data-audit', 'ignore');

  const rRow2 = S.card({ x: c2X - colW / 2 + 25, y: colY - 25, w: colW - 50, h: 86, tone: 'helps', title: '' });
  const rT2 = S.text('Decode Step: 100% Cooperative Reuse', { x: c2X - colW / 2 + 45, y: colY + 5, size: 22, color: 'helps', weight: 700 });
  const rS2 = S.text('Staged tiles reused across all threads with 0 evictions', { x: c2X - colW / 2 + 45, y: colY + 34, size: 20, color: 'ink' });
  rS2.setAttribute('data-audit', 'ignore');

  const rBadge = S.pill('EXPLICIT ENGINEERING ELIMINATES TRAFFIC', { x: c2X, y: colY + 145, h: 42, tone: 'helps', size: 22, weight: 700 });

  // Initial visibility
  S.set([subCard, subText], { autoAlpha: 0 });
  S.set([leftCard, leftTitle, lRow1, lT1, lRow2, lT2, lBadge], { autoAlpha: 0 });
  S.set([rightCard, rightTitle, rRow1, rT1, rRow2, rT2, rBadge], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Intro definition
  S.add(fx.in([subCard, subText], { from: 'up', d: 0.4 }), 'b1~cache-0.2');
  S.add(fx.in([leftCard, leftTitle, lRow1, lT1], { from: 'left', d: 0.5 }), 'b1~works');

  // ---------------------------------------------------------------- b2: LLM single-pass weight failure
  S.add(fx.in([lRow2, lT2, lBadge], { from: 'up', d: 0.5 }), 'b2~touches-0.2');
  S.add(fx.pulse([lRow2, lBadge], { scale: 1.05, d: 0.4 }), 'b2~token');

  // ---------------------------------------------------------------- b3: Shared memory contrast
  S.add(fx.in([rightCard, rightTitle, rRow1, rT1], { from: 'right', d: 0.5 }), 'b3~shared-0.2');
  S.add(fx.pulse(rightTitle, { scale: 1.05, d: 0.4 }), 'b3~silicon');

  // ---------------------------------------------------------------- b4: Explicit engineering victory
  S.add(fx.in([rRow2, rT2, rBadge], { from: 'up', d: 0.5 }), 'b4~streaming-0.2');
  S.add(fx.pulse([rightCard, rBadge], { scale: 1.05, d: 0.5 }), 'b4~everything');

  // Concluding Takeaway pill
  const takeaway = S.pill('caches rely on luck: shared memory relies on explicit engineering', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
