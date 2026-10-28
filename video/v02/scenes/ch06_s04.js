/* ch06_s04 · cache versus shared memory (figs 31, 32)
   Movement 1 (b1): Definition: Cache is a fast mirror of distant memory; requires temporal/spatial reuse.
   Movement 2 (b2): The LLM failure mode: token generation touches 140 GB of weights once (0% cache hits).
   Movement 3 (b3): Same physical silicon: Hardware guess (cache) vs Software specification (shared memory).
   Movement 4 (b4): Stating explicit tiles wins completely over hardware guessing. */

V.scene('ch06_s04', S => {
  const { fx } = S;
  const GX = 960, GY = 505;

  // Heading
  const heading = S.heading('cache versus shared memory', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Background frame
  const frameW = 1420, frameH = 540;
  const frame = S.rect({
    x: GX - frameW / 2, y: GY - frameH / 2, w: frameW, h: frameH, r: 16,
    fill: '#0a0f1d', stroke: S.tone('helps'), sw: 1.5
  });

  const title = S.text('figs 31, 32 · same physical silicon: who decides what resides inside?', {
    x: GX - frameW / 2 + 32, y: GY - frameH / 2 + 38, size: 22, weight: 700, color: 'helps'
  });

  // Two Comparative Columns
  const colW = 650, colH = 430;
  const c1X = GX - 340, c2X = GX + 340;
  const colY = GY + 30;

  // ================================================================ Left: Automatic Hardware Cache
  const leftBox = S.rect({
    x: c1X - colW / 2, y: colY - colH / 2, w: colW, h: colH, r: 12,
    fill: '#15243d', stroke: S.tone('struct'), sw: 1.5
  });
  leftBox.setAttribute('data-audit', 'ignore');
  const leftTitle = S.text('automatic hardware cache (fig 31)', {
    x: c1X, y: colY - colH / 2 + 34, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  });

  // Row 1: Principle
  const lR1 = S.rect({ x: c1X - colW / 2 + 20, y: colY - 130, w: colW - 40, h: 72, r: 6, fill: '#1e293b', stroke: '#334155', sw: 1 });
  lR1.setAttribute('data-audit', 'ignore');
  const lT1 = S.text('principle: small fast copy of slow memory', { x: c1X - colW / 2 + 36, y: colY - 104, size: 20, weight: 600, color: 'ink' });
  const lS1 = S.text('keeps recent values nearby in case they are reused', { x: c1X - colW / 2 + 36, y: colY - 78, size: 20, color: 'muted' });

  // Row 2: LLM Decode Failure
  const lR2 = S.rect({ x: c1X - colW / 2 + 20, y: colY - 40, w: colW - 40, h: 84, r: 6, fill: '#38161e', stroke: S.tone('bytes'), sw: 1.5 });
  lR2.setAttribute('data-audit', 'ignore');
  const lT2 = S.text('llm token decode: 0% cache hit rate', { x: c1X - colW / 2 + 36, y: colY - 14, size: 22, weight: 700, color: 'bytes' });
  const lS2 = S.text('each weight is touched once and evicted before reuse', { x: c1X - colW / 2 + 36, y: colY + 18, size: 20, color: 'ink' });

  // Left Badge
  const lBadge = S.pill('hardware recency guessing fails on weights', {
    x: c1X, y: colY + 160, h: 40, tone: 'bytes', size: 20, weight: 700
  });

  // ================================================================ Right: Shared Memory Scratchpad
  const rightBox = S.rect({
    x: c2X - colW / 2, y: colY - colH / 2, w: colW, h: colH, r: 12,
    fill: '#142e2b', stroke: S.tone('helps'), sw: 1.5
  });
  rightBox.setAttribute('data-audit', 'ignore');
  const rightTitle = S.text('software shared memory (fig 32)', {
    x: c2X, y: colY - colH / 2 + 34, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  });

  // Row 1: Principle
  const rR1 = S.rect({ x: c2X - colW / 2 + 20, y: colY - 130, w: colW - 40, h: 72, r: 6, fill: '#1e293b', stroke: '#334155', sw: 1 });
  rR1.setAttribute('data-audit', 'ignore');
  const rT1 = S.text('principle: explicit software scratchpad', { x: c2X - colW / 2 + 36, y: colY - 104, size: 20, weight: 600, color: 'ink' });
  const rS1 = S.text('the program knows in advance who needs what data', { x: c2X - colW / 2 + 36, y: colY - 78, size: 20, color: 'muted' });

  // Row 2: Matrix Tiling Reuse
  const rR2 = S.rect({ x: c2X - colW / 2 + 20, y: colY - 40, w: colW - 40, h: 84, r: 6, fill: '#064e3b', stroke: S.tone('helps'), sw: 1.5 });
  rR2.setAttribute('data-audit', 'ignore');
  const rT2 = S.text('matrix tiling: 100% cooperative reuse', { x: c2X - colW / 2 + 36, y: colY - 14, size: 22, weight: 700, color: 'helps' });
  const rS2 = S.text('stages input tiles once: guaranteed zero evictions', { x: c2X - colW / 2 + 36, y: colY + 18, size: 20, color: 'ink' });

  // Right Badge
  const rBadge = S.pill('explicit engineering eliminates memory traffic', {
    x: c2X, y: colY + 160, h: 40, tone: 'helps', size: 20, weight: 700
  });

  // Initial visibility
  S.set([frame, title], { autoAlpha: 0 });
  S.set([leftBox, leftTitle, lR1, lT1, lS1, lR2, lT2, lS2, lBadge], { autoAlpha: 0 });
  S.set([rightBox, rightTitle, rR1, rT1, rS1, rR2, rT2, rS2, rBadge], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Frame & Cache intro
  S.add(fx.in([frame, title], { from: 'fade', d: 0.5 }), 'b1~cache-0.2');
  S.add(fx.in([leftBox, leftTitle, lR1, lT1, lS1], { from: 'fade', d: 0.5 }), 'b1~works');

  // ---------------------------------------------------------------- b2: LLM single-pass weight failure
  S.add(fx.in([lR2, lT2, lS2, lBadge], { from: 'fade', d: 0.5 }), 'b2~touches-0.2');
  S.add(fx.pulse([lR2, lBadge], { scale: 1.04, d: 0.4 }), 'b2~token');

  // ---------------------------------------------------------------- b3: Shared memory contrast
  S.add(fx.in([rightBox, rightTitle, rR1, rT1, rS1], { from: 'fade', d: 0.5 }), 'b3~shared-0.2');
  S.add(fx.pulse(rightTitle, { scale: 1.04, d: 0.4 }), 'b3~silicon');

  // ---------------------------------------------------------------- b4: Explicit engineering victory
  S.add(fx.in([rR2, rT2, rS2, rBadge], { from: 'fade', d: 0.5 }), 'b4~streaming-0.2');
  S.add(fx.pulse([rightBox, rBadge], { scale: 1.05, d: 0.5 }), 'b4~everything');

  // Concluding Takeaway band
  const takeaway = S.takeaway('caches rely on luck: shared memory relies on explicit engineering', {
    tone: 'helps'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
