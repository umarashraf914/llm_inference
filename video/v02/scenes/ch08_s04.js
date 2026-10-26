/* ch08_s04 · lockstep and the cost of instruction decode (figs 42, 43)
   Movement 1 (b1): Lockstep vs independent thread question.
   Movement 2 (b2): Area penalty of independence: 32 decoders, branch predictors, caches.
   Movement 3 (b3): 128-bit binary instruction word (FFMA) costs real silicon and energy.
   Movement 4 (b4): 32 decode operations (CPU) vs 1 decode operation (Warp): 32× efficiency advantage. */

V.scene('ch08_s04', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('Lockstep and instruction decode cost', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Comparative Panels: Independent Execution vs Warp Lockstep
  const colW = 590, colH = 340;
  const c1X = GX - 315, c2X = GX + 315;
  const colY = GY - 65;

  // Left: 32 Independent Decoders (High Overhead)
  const leftCard = S.card({ x: c1X - colW / 2, y: colY - colH / 2, w: colW, h: colH, tone: 'bytes', title: '' });
  const leftTitle = S.text('INDEPENDENT THREAD EXECUTION', { x: c1X, y: colY - colH / 2 + 36, size: 22, anchor: 'middle', weight: 700, color: 'bytes' });

  const lRow1 = S.text('Requires 32 separate instruction decoders & caches', { x: c1X, y: colY - 55, size: 22, anchor: 'middle', color: 'ink' });
  const lPill = S.pill('32 SEPARATE DECODE CYCLES', { x: c1X, y: colY + 10, h: 44, tone: 'bytes', size: 22, weight: 700 });
  const lRow2 = S.text('Redundant circuits consume vast silicon area', { x: c1X, y: colY + 80, size: 22, anchor: 'middle', color: 'bytes', weight: 600 });

  // Right: 1 Shared Warp Decoder (Lockstep Efficiency)
  const rightCard = S.card({ x: c2X - colW / 2, y: colY - colH / 2, w: colW, h: colH, tone: 'helps', title: '' });
  const rightTitle = S.text('SIMT WARP LOCKSTEP (32 LANES)', { x: c2X, y: colY - colH / 2 + 36, size: 22, anchor: 'middle', weight: 700, color: 'helps' });

  const rRow1 = S.text('1 instruction decoded once and broadcast to 32 lanes', { x: c2X, y: colY - 55, size: 22, anchor: 'middle', color: 'ink' });
  const rPill = S.pill('1 SHARED DECODE (32× SAVINGS)', { x: c2X, y: colY + 10, h: 44, tone: 'helps', size: 22, weight: 700 });
  const rRow2 = S.text('Frees silicon to become dense arithmetic units', { x: c2X, y: colY + 80, size: 22, anchor: 'middle', color: 'helps', weight: 600 });

  // Bottom Section: 128-bit Instruction Word breakdown
  const botCard = S.card({
    x: GX - 610, y: GY + 140, w: 1220, h: 220,
    tone: 'neutral', title: ''
  });
  const botTitle = S.text('128-BIT BINARY INSTRUCTION WORD · DISSECTED IN HARDWARE', {
    x: GX, y: GY + 178, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  });

  // Instruction fields
  const dY = GY + 250;
  const f1 = S.pill('Opcode: FFMA (Float FMA)', { x: GX - 400, y: dY, h: 40, tone: 'compute', size: 22, weight: 700 });
  const f2 = S.pill('Dest: R140', { x: GX - 130, y: dY, h: 40, tone: 'struct', size: 22, weight: 600 });
  const f3 = S.pill('Src1: R11', { x: GX + 60, y: dY, h: 40, tone: 'struct', size: 22, weight: 600 });
  const f4 = S.pill('Src2: R4', { x: GX + 230, y: dY, h: 40, tone: 'struct', size: 22, weight: 600 });
  const f5 = S.pill('Src3: R142', { x: GX + 420, y: dY, h: 40, tone: 'struct', size: 22, weight: 600 });

  // Initial visibility
  S.set([leftCard, leftTitle, lRow1, lPill, lRow2], { autoAlpha: 0 });
  S.set([rightCard, rightTitle, rRow1, rPill, rRow2], { autoAlpha: 0 });
  S.set([botCard, botTitle, f1, f2, f3, f4, f5], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Independent thread question
  S.add(fx.in([leftCard, leftTitle, lRow1], { from: 'left', d: 0.5 }), 'b1~independently-0.2');

  // ---------------------------------------------------------------- b2: 32 decoders overhead
  S.add(fx.in([lPill, lRow2], { from: 'up', d: 0.5 }), 'b2~decoders-0.2');
  S.add(fx.pulse(lPill, { scale: 1.08, d: 0.5 }), 'b2~trackers');

  // ---------------------------------------------------------------- b3: 128-bit instruction cost
  S.add(fx.in([botCard, botTitle, f1, f2, f3, f4, f5], { from: 'up', d: 0.5 }), 'b3~instruction-0.2');
  S.add(fx.pulse([f1, botCard], { scale: 1.05, d: 0.5 }), 'b3~silicon');

  // ---------------------------------------------------------------- b4: 32x Decode efficiency of Warp
  S.add(fx.in([rightCard, rightTitle, rRow1, rPill, rRow2], { from: 'right', d: 0.6 }), 'b4~pays-0.2');
  S.add(fx.pulse(rPill, { scale: 1.08, d: 0.5 }), 'b4~spreads');

  // Concluding Takeaway pill
  const takeaway = S.pill('sharing one instruction across 32 lanes frees the silicon that becomes arithmetic', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
