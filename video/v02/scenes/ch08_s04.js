/* ch08_s04 · lockstep and the cost of instruction decode (figs 42, 43)
   Movement 1 (b1): Lockstep vs independent thread question.
   Movement 2 (b2): Area penalty of independence: 32 decoders, branch predictors, caches.
   Movement 3 (b3): 128-bit binary instruction word (FFMA) costs real silicon and energy.
   Movement 4 (b4): 32 decode operations (CPU) vs 1 decode operation (Warp): 32× efficiency advantage. */

V.scene('ch08_s04', S => {
  const { fx } = S;
  const GX = 960, GY = 505;

  // Heading
  const heading = S.heading('lockstep and instruction decode cost', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Background frame
  const frameW = 1420, frameH = 540;
  const frame = S.rect({
    x: GX - frameW / 2, y: GY - frameH / 2, w: frameW, h: frameH, r: 16,
    fill: '#0a0f1d', stroke: S.tone('helps'), sw: 1.5
  });

  const title = S.text('figs 42, 43 · sharing one instruction across 32 lanes frees silicon for arithmetic', {
    x: GX - frameW / 2 + 32, y: GY - frameH / 2 + 38, size: 22, weight: 700, color: 'helps'
  });

  // Comparative Panels: Independent Execution vs Warp Lockstep
  const colW = 650, colH = 260;
  const c1X = GX - 340, c2X = GX + 340;
  const colY = GY - 55;

  // Left: Independent Threads
  const leftBox = S.rect({
    x: c1X - colW / 2, y: colY - colH / 2, w: colW, h: colH, r: 12,
    fill: '#38161e', stroke: S.tone('bytes'), sw: 1.5
  });
  leftBox.setAttribute('data-audit', 'ignore');
  const leftTitle = S.text('independent thread execution (fig 42)', {
    x: c1X, y: colY - colH / 2 + 34, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  });

  const lRow1 = S.text('requires 32 separate instruction decoders, trackers & caches', {
    x: c1X, y: colY - 14, size: 20, anchor: 'middle', color: 'ink'
  });
  const lPill = S.pill('32 separate decode circuits per cycle', {
    x: c1X, y: colY + 36, h: 40, tone: 'bytes', size: 20, weight: 700
  });
  const lRow2 = S.text('redundant decoders consume silicon area that could be alus', {
    x: c1X, y: colY + 90, size: 20, anchor: 'middle', color: 'muted'
  });

  // Right: SIMT Warp Lockstep
  const rightBox = S.rect({
    x: c2X - colW / 2, y: colY - colH / 2, w: colW, h: colH, r: 12,
    fill: '#142e2b', stroke: S.tone('helps'), sw: 1.5
  });
  rightBox.setAttribute('data-audit', 'ignore');
  const rightTitle = S.text('simt warp lockstep (32 lanes)', {
    x: c2X, y: colY - colH / 2 + 34, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  });

  const rRow1 = S.text('1 single instruction decoded once and broadcast to 32 lanes', {
    x: c2X, y: colY - 14, size: 20, anchor: 'middle', color: 'ink'
  });
  const rPill = S.pill('1 shared decoder (32× silicon savings)', {
    x: c2X, y: colY + 36, h: 40, tone: 'helps', size: 20, weight: 700
  });
  const rRow2 = S.text('frees vast die area to build dense arithmetic execution units', {
    x: c2X, y: colY + 90, size: 20, anchor: 'middle', color: 'helps'
  });

  // ================================================================ BOTTOM: 128-bit Instruction Word (Fig 43)
  const botY = GY + 115;
  const botW = 1356, botH = 130;
  const botBox = S.rect({
    x: GX - botW / 2, y: botY, w: botW, h: botH, r: 10,
    fill: '#15243d', stroke: S.tone('struct'), sw: 1.5
  });

  const botTitle = S.text('fig 43 · 128-bit binary instruction word: FFMA R140, R11, R4, R142', {
    x: GX - botW / 2 + 24, y: botY + 34, size: 22, weight: 700, color: 'struct'
  });

  // Instruction field pills
  const dY = botY + 80;
  const f1 = S.pill('Opcode: FFMA (Float FMA)', { x: GX - 440, y: dY, h: 40, tone: 'compute', size: 20, weight: 700 });
  const f2 = S.pill('Dest: R140', { x: GX - 150, y: dY, h: 40, tone: 'struct', size: 20, weight: 600 });
  const f3 = S.pill('Src1: R11', { x: GX + 50, y: dY, h: 40, tone: 'struct', size: 20, weight: 600 });
  const f4 = S.pill('Src2: R4', { x: GX + 230, y: dY, h: 40, tone: 'struct', size: 20, weight: 600 });
  const f5 = S.pill('Src3: R142', { x: GX + 420, y: dY, h: 40, tone: 'struct', size: 20, weight: 600 });

  // Initial visibility
  S.set([frame, title], { autoAlpha: 0 });
  S.set([leftBox, leftTitle, lRow1, lPill, lRow2], { autoAlpha: 0 });
  S.set([rightBox, rightTitle, rRow1, rPill, rRow2], { autoAlpha: 0 });
  S.set([botBox, botTitle, f1, f2, f3, f4, f5], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Independent thread question
  S.add(fx.in([frame, title, leftBox, leftTitle, lRow1], { from: 'fade', d: 0.5 }), 'b1~independently-0.2');

  // ---------------------------------------------------------------- b2: 32 decoders overhead
  S.add(fx.in([lPill, lRow2], { from: 'fade', d: 0.5 }), 'b2~decoders-0.2');
  S.add(fx.pulse(lPill, { scale: 1.05, d: 0.5 }), 'b2~trackers');

  // ---------------------------------------------------------------- b3: 128-bit instruction cost
  S.add(fx.in([botBox, botTitle, f1, f2, f3, f4, f5], { from: 'fade', d: 0.5 }), 'b3~instruction-0.2');
  S.add(fx.pulse([f1, botBox], { scale: 1.03, d: 0.5 }), 'b3~silicon');

  // ---------------------------------------------------------------- b4: 32x Decode efficiency of Warp
  S.add(fx.in([rightBox, rightTitle, rRow1, rPill, rRow2], { from: 'fade', d: 0.6 }), 'b4~pays-0.2');
  S.add(fx.pulse(rPill, { scale: 1.05, d: 0.5 }), 'b4~spreads');

  // Concluding Takeaway band
  const takeaway = S.takeaway('sharing one instruction across 32 lanes frees the silicon that becomes arithmetic', {
    tone: 'helps'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
