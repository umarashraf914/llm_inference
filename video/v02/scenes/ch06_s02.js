/* ch06_s02 · on-chip S RAM and the scratchpad (fig 29)
   Movement 1 (b1): 256 KB on-chip SRAM structure beside the registers.
   Movement 2 (b2): Shared memory scratchpad: up to 228 KB claimed explicitly by software.
   Movement 3 (b3): Remaining portion: automatic hardware-managed L1 cache. */

V.scene('ch06_s02', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('On-chip SRAM and the scratchpad', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // 256 KB SRAM Split builder from ch06_common.js
  const sram = ch06SramSplit(S, { cx: GX, cy: GY - 20, w: 1240, h: 360 });

  // Comparison Cards underneath
  const cardW = 600, cardH = 150;
  const c1X = GX - 320, c2X = GX + 320;
  const botY = GY + 240;

  // Shared Memory Card
  const smCard = S.card({ x: c1X - cardW / 2, y: botY - cardH / 2, w: cardW, h: cardH, tone: 'helps', title: '' });
  const smTitle = S.text('SHARED MEMORY (UP TO 228 KB)', { x: c1X, y: botY - 30, size: 22, anchor: 'middle', weight: 700, color: 'helps' });
  const smDesc = S.text('Explicit software staging · guaranteed 0 evictions', { x: c1X, y: botY + 12, size: 22, anchor: 'middle', color: 'ink', weight: 600 });

  // L1 Cache Card
  const l1Card = S.card({ x: c2X - cardW / 2, y: botY - cardH / 2, w: cardW, h: cardH, tone: 'struct', title: '' });
  const l1Title = S.text('L1 CACHE (REMAINDER: 28 KB)', { x: c2X, y: botY - 30, size: 22, anchor: 'middle', weight: 700, color: 'struct' });
  const l1Desc = S.text('Hardware manages lines automatically via LRU', { x: c2X, y: botY + 12, size: 22, anchor: 'middle', color: 'ink', weight: 600 });

  // Initial visibility
  S.set([sram.card, sram.title, sram.note], { autoAlpha: 0 });
  S.set([sram.smemBox, sram.smemTitle], { autoAlpha: 0 });
  S.set([sram.l1Box, sram.l1Title], { autoAlpha: 0 });
  S.set([smCard, smTitle, smDesc, l1Card, l1Title, l1Desc], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 256 KB SRAM base
  S.add(fx.in([sram.card, sram.title], { from: 'scale', d: 0.5 }), 'b1~registers-0.2');
  S.add(fx.in(sram.note, { from: 'up', d: 0.4 }), 'b1~registers');

  // ---------------------------------------------------------------- b2: Up to 228 KB Shared Memory scratchpad
  S.add(fx.in([sram.smemBox, sram.smemTitle, smCard, smTitle, smDesc], { from: 'left', d: 0.6 }), 'b2~twenty-eight-0.2');
  S.add(fx.pulse([sram.smemBox, smCard], { scale: 1.05, d: 0.5 }), 'b2~scratchpad');

  // ---------------------------------------------------------------- b3: Automatic L1 Cache remainder
  S.add(fx.in([sram.l1Box, sram.l1Title, l1Card, l1Title, l1Desc], { from: 'right', d: 0.6 }), 'b3~claimed-0.2');
  S.add(fx.pulse([sram.l1Box, l1Card], { scale: 1.05, d: 0.5 }), 'b3~cache');

  // Concluding Takeaway pill
  const takeaway = S.pill('the split between cache and scratchpad is chosen by software', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b3>-0.8');
});
