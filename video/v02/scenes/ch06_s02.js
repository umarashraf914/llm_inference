/* ch06_s02 · on-chip S RAM and the scratchpad (fig 29)
   Movement 1 (b1): 256 KB on-chip SRAM structure beside the registers.
   Movement 2 (b2): Shared memory scratchpad: up to 228 KB claimed explicitly by software.
   Movement 3 (b3): Remaining portion: automatic hardware-managed L1 cache. */

V.scene('ch06_s02', S => {
  const { fx } = S;
  const GX = 960, GY = 505;

  // Heading
  const heading = S.heading('on-chip sram and the scratchpad', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // 256 KB SRAM Split builder from ch06_common.js
  const sram = ch06SramSplit(S, { cx: GX, cy: GY, w: 1420, h: 540 });

  // Initial visibility
  S.set([sram.bg, sram.title], { autoAlpha: 0 });
  S.set([sram.smemBox, sram.smemTitle, sram.smemSub, ...sram.p1], { autoAlpha: 0 });
  S.set([sram.l1Box, sram.l1Title, sram.divLine, ...sram.p2], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 256 KB SRAM base
  S.add(fx.in([sram.bg, sram.title], { from: 'fade', d: 0.5 }), 'b1~registers-0.2');
  S.add(fx.pulse(sram.bg, { scale: 1.01, d: 0.4 }), 'b1~registers');

  // ---------------------------------------------------------------- b2: Up to 228 KB Shared Memory scratchpad
  S.add(fx.in([sram.smemBox, sram.smemTitle, sram.smemSub, ...sram.p1], { from: 'fade', d: 0.5 }), 'b2~twenty-eight-0.2');
  S.add(fx.pulse([sram.smemBox, sram.p1[0]], { scale: 1.03, d: 0.5 }), 'b2~scratchpad');

  // ---------------------------------------------------------------- b3: Automatic L1 Cache remainder
  S.add(fx.in([sram.l1Box, sram.l1Title, sram.divLine, ...sram.p2], { from: 'fade', d: 0.5 }), 'b3~claimed-0.2');
  S.add(fx.pulse([sram.l1Box, sram.p2[0]], { scale: 1.03, d: 0.5 }), 'b3~cache');

  // Concluding Takeaway band
  const takeaway = S.takeaway('the split between cache and scratchpad is chosen by software', {
    tone: 'helps'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b3>-0.8');
});
