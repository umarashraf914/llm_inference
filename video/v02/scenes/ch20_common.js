/* ch20_common.js · Visual components for Chapter 20 ("When one chip is not enough")
   Atlas Figs 108–118:
   - ch20CapacityWall (Figs 108, 109): Llama 3 405B weights (810 GB) vs 8-GPU chassis (640 GB) spillover
   - ch20LinkWires (Fig 110): Differential wire pairs between GPU A and GPU B with SerDes PHY
   - ch20ScaleUpVsOut (Fig 111): Scale-up (inside chassis, 450 GB/s) vs scale-out (network cable, 50 GB/s) 9x drop
   - ch20TopologyCompare (Fig 112): Pairwise mesh (28 links, fragmented) vs central NVSwitch crossbar (full rate)
   - ch20GenerationalGap (Fig 113): Dual bandwidth bars (A100 -> H100 -> B200) with 7x-9x gap holding steady
   - ch20GeometryTiers (Figs 114, 115): On package (5,120 wires) -> off package (72 pairs) -> across room (cable)
   - ch20TensorParallel (Figs 116, 117): All-reduce dot product (GPU A: 10, GPU B: 8 -> 18) and 160 barriers/token
   - ch20ExpandingDomain (Fig 118): Traditional 8-GPU box (640 GB) vs GB200 NVL72 rack (72 GPUs, 13.4 TB unified)
*/

/**
 * Atlas Figs 108, 109: The Capacity Wall & DGX Chassis Spillover
 */
function ch20CapacityWall(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1460;
  const h = opts.h ?? 620;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('the capacity wall · frontier models exceed single-chip physical memory', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Top Section: Weight Footprint Comparison Bars (to scale)
  const topY = cy - 235;
  const barMaxW = 1100;
  const barH = 48;

  // 16-bit weights: 810 GB (405B * 2B)
  const w16Y = topY;
  const bar16Bg = S.rect({ x: cx - barMaxW / 2, y: w16Y, w: barMaxW, h: barH, r: 6, fill: '#141c2c', stroke: '#2a3a5a', sw: 1 }, g);
  const bar16Fill = S.rect({ x: cx - barMaxW / 2, y: w16Y, w: barMaxW, h: barH, r: 6, fill: S.tone('bytes', 0.4), stroke: S.tone('bytes'), sw: 1.5 }, g);
  const bar16Lbl = S.text('llama 3 405b at 16-bit: 810 gb', {
    x: cx - barMaxW / 2 + 20, y: w16Y + 31, size: 20, weight: 700, color: 'ink'
  }, g);
  const bar16Val = S.text('810 gb · spills out of chassis', {
    x: cx + barMaxW / 2 - 20, y: w16Y + 31, size: 20, anchor: 'end', weight: 700, color: 'bytes'
  }, g);

  // 8-bit weights: 405 GB (405B * 1B)
  const w8Y = topY + 56;
  const w8Width = Math.round(barMaxW * (405 / 810));
  const bar8Bg = S.rect({ x: cx - barMaxW / 2, y: w8Y, w: barMaxW, h: barH, r: 6, fill: '#141c2c', stroke: '#2a3a5a', sw: 1 }, g);
  const bar8Fill = S.rect({ x: cx - barMaxW / 2, y: w8Y, w: w8Width, h: barH, r: 6, fill: S.tone('compute', 0.35), stroke: S.tone('compute'), sw: 1.5 }, g);
  const bar8Lbl = S.text('llama 3 405b at 8-bit: 405 gb', {
    x: cx - barMaxW / 2 + 20, y: w8Y + 31, size: 20, weight: 700, color: 'ink'
  }, g);
  const bar8Val = S.text('405 gb · fits in 1 chassis (235 gb free)', {
    x: cx + barMaxW / 2 - 20, y: w8Y + 31, size: 20, anchor: 'end', weight: 700, color: 'compute'
  }, g);

  // Middle Section: Two DGX Chassis Side-by-Side
  const boxW = 660;
  const boxH = 205;
  const boxY = cy - 58;

  // Box 1: DGX Chassis 1 (8 x 80GB = 640 GB, 100% full)
  const b1X = cx - boxW - 20;
  const b1Card = S.rect({ x: b1X, y: boxY, w: boxW, h: boxH, r: 10, fill: '#172235', stroke: S.tone('compute'), sw: 1.5 }, g);
  const b1Title = S.text('dgx chassis 1: 8 × h100 (640 gb total)', {
    x: b1X + boxW / 2, y: boxY + 30, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const b1Sub = S.text('internal nvswitch fabric · 640 gb 100% full', {
    x: b1X + boxW / 2, y: boxY + 56, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  const gpuW = 70;
  const gpuH = 68;
  const gpuGap = 10;
  const gStartX1 = b1X + (boxW - (8 * gpuW + 7 * gpuGap)) / 2;
  const gY = boxY + 70;

  const b1Gpus = [];
  for (let i = 0; i < 8; i++) {
    const gx = gStartX1 + i * (gpuW + gpuGap);
    const gb = S.rect({ x: gx, y: gY, w: gpuW, h: gpuH, r: 6, fill: S.tone('compute', 0.35), stroke: S.tone('compute'), sw: 1.5 }, g);
    const gl1 = S.text(`${i + 1}`, { x: gx + gpuW / 2, y: gY + 26, size: 20, anchor: 'middle', weight: 700, color: 'ink' }, g);
    const gl2 = S.text('80g', { x: gx + gpuW / 2, y: gY + 50, size: 20, anchor: 'middle', weight: 600, color: 'compute' }, g);
    b1Gpus.push({ gb, gl1, gl2 });
  }

  const b1Pill = S.pill('640 gb full · 170 gb remains with nowhere to go', {
    x: b1X + boxW / 2, y: boxY + 168, h: 40, tone: 'compute', size: 20, weight: 700
  }, g);

  // Box 2: DGX Chassis 2 (3 x 80GB = 240 GB used for 170 GB spillover)
  const b2X = cx + 20;
  const b2Card = S.rect({ x: b2X, y: boxY, w: boxW, h: boxH, r: 10, fill: '#251a24', stroke: S.tone('bytes'), sw: 1.5 }, g);
  const b2Title = S.text('dgx chassis 2: 170 gb spillover', {
    x: b2X + boxW / 2, y: boxY + 30, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const b2Sub = S.text('forces layer communication onto network cables', {
    x: b2X + boxW / 2, y: boxY + 56, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  const gStartX2 = b2X + (boxW - (8 * gpuW + 7 * gpuGap)) / 2;
  const b2Gpus = [];
  for (let i = 0; i < 8; i++) {
    const gx = gStartX2 + i * (gpuW + gpuGap);
    const isUsed = i < 3;
    const gb = S.rect({
      x: gx, y: gY, w: gpuW, h: gpuH, r: 6,
      fill: isUsed ? S.tone('bytes', 0.35) : '#141824',
      stroke: isUsed ? S.tone('bytes') : '#2b364e',
      sw: 1.5
    }, g);
    const gl1 = S.text(`${i + 9}`, {
      x: gx + gpuW / 2, y: gY + 26, size: 20, anchor: 'middle', weight: 700,
      color: isUsed ? 'ink' : 'muted'
    }, g);
    const gl2 = S.text(isUsed ? '80g' : 'idle', {
      x: gx + gpuW / 2, y: gY + 50, size: 20, anchor: 'middle', weight: 600,
      color: isUsed ? 'bytes' : 'muted'
    }, g);
    b2Gpus.push({ gb, gl1, gl2 });
  }

  const b2Pill = S.pill('spillover forces 16-bit serving across network', {
    x: b2X + boxW / 2, y: boxY + 168, h: 40, tone: 'bytes', size: 20, weight: 700
  }, g);

  // Connecting Cable / Network Span between chassis
  const cableY = boxY + boxH + 42;
  const cableLine = S.g(null, g);
  const cableLine1 = S.line({
    x1: b1X + boxW / 2, y1: cableY, x2: cx - 210, y2: cableY,
    stroke: S.tone('bytes'), sw: 3, dash: '8 6'
  }, cableLine);
  const cableLine2 = S.line({
    x1: cx + 210, y1: cableY, x2: b2X + boxW / 2, y2: cableY,
    stroke: S.tone('bytes'), sw: 3, dash: '8 6'
  }, cableLine);
  const cablePill = S.pill('infiniband cable (9× penalty)', {
    x: cx, y: cableY, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return {
    group: g, bg, title,
    bar16Bg, bar16Fill, bar16Lbl, bar16Val,
    bar8Bg, bar8Fill, bar8Lbl, bar8Val,
    b1Card, b1Title, b1Sub, b1Gpus, b1Pill,
    b2Card, b2Title, b2Sub, b2Gpus, b2Pill,
    cableLine, cablePill
  };
}

/**
 * Atlas Fig 110: What an Interconnect Link Actually Is
 */
function ch20LinkWires(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1460;
  const h = opts.h ?? 620;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('what an interconnect link is · physical differential wire pairs between chips', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // GPU A Package (Left) and GPU B Package (Right)
  const chipW = 280;
  const chipH = 260;
  const chipY = cy - 180;

  const aX = cx - 560;
  const aBox = S.rect({ x: aX, y: chipY, w: chipW, h: chipH, r: 12, fill: '#141d2c', stroke: S.tone('compute'), sw: 2 }, g);
  const aTitle = S.text('gpu a (sender)', { x: aX + chipW / 2, y: chipY + 34, size: 22, anchor: 'middle', weight: 700, color: 'compute' }, g);
  const aDie = S.rect({ x: aX + 25, y: chipY + 54, w: chipW - 50, h: 105, r: 8, fill: '#1d273a', stroke: '#364765', sw: 1.5 }, g);
  const aDieLbl = S.text('gpu silicon die', { x: aX + chipW / 2, y: chipY + 95, size: 20, anchor: 'middle', weight: 600, color: 'ink' }, g);
  const aDieSub = S.text('tensor cores', { x: aX + chipW / 2, y: chipY + 128, size: 20, anchor: 'middle', weight: 600, color: 'muted' }, g);
  const aPhy = S.rect({ x: aX + chipW - 60, y: chipY + 172, w: 50, h: 72, r: 6, fill: S.tone('compute', 0.4), stroke: S.tone('compute'), sw: 1.5 }, g);
  const aPhyLbl = S.text('phy', { x: aX + chipW - 35, y: chipY + 215, size: 20, anchor: 'middle', weight: 700, color: 'ink' }, g);
  const aSerdesLbl = S.text('serdes transmitter', { x: aX + 104, y: chipY + 215, size: 20, anchor: 'middle', weight: 600, color: 'compute' }, g);

  const bX = cx + 280;
  const bBox = S.rect({ x: bX, y: chipY, w: chipW, h: chipH, r: 12, fill: '#141d2c', stroke: S.tone('helps'), sw: 2 }, g);
  const bTitle = S.text('gpu b (receiver)', { x: bX + chipW / 2, y: chipY + 34, size: 22, anchor: 'middle', weight: 700, color: 'helps' }, g);
  const bDie = S.rect({ x: bX + 25, y: chipY + 54, w: chipW - 50, h: 105, r: 8, fill: '#1d273a', stroke: '#364765', sw: 1.5 }, g);
  const bDieLbl = S.text('gpu silicon die', { x: bX + chipW / 2, y: chipY + 95, size: 20, anchor: 'middle', weight: 600, color: 'ink' }, g);
  const bDieSub = S.text('tensor cores', { x: bX + chipW / 2, y: chipY + 128, size: 20, anchor: 'middle', weight: 600, color: 'muted' }, g);
  const bPhy = S.rect({ x: bX + 10, y: chipY + 172, w: 50, h: 72, r: 6, fill: S.tone('helps', 0.4), stroke: S.tone('helps'), sw: 1.5 }, g);
  const bPhyLbl = S.text('phy', { x: bX + 35, y: chipY + 215, size: 20, anchor: 'middle', weight: 700, color: 'ink' }, g);
  const bSerdesLbl = S.text('serdes receiver', { x: bX + chipW - 104, y: chipY + 215, size: 20, anchor: 'middle', weight: 600, color: 'helps' }, g);

  // High-Speed Differential Wire Bundle in between
  const wireX1 = aX + chipW - 10;
  const wireX2 = bX + 10;
  const wireLines = [];
  const numPairs = 5;
  const wireStartY = chipY + 175;
  for (let i = 0; i < numPairs; i++) {
    const wy = wireStartY + i * 16;
    const wl = S.line({ x1: wireX1, y1: wy, x2: wireX2, y2: wy, stroke: S.tone('struct'), sw: 2.5 }, g);
    wireLines.push(wl);
  }

  const wirePill = S.pill('18 links × 2 pairs × 100 gb/s = 450 gb/s each way', {
    x: cx, y: chipY + 120, h: 42, tone: 'struct', size: 20, weight: 700
  }, g);

  // Bottom Box: The Bus Arithmetic Rule (positioned with clean gap below chip boxes)
  const ruleBoxW = 1200;
  const ruleBoxH = 100;
  const ruleY = cy + 120;
  const ruleBox = S.rect({ x: cx - ruleBoxW / 2, y: ruleY, w: ruleBoxW, h: ruleBoxH, r: 10, fill: '#141a28', stroke: '#2e3d5a', sw: 1.5 }, g);
  const ruleT1 = S.text('bandwidth = physical wire count × bit rate per wire ÷ 8 bits per byte', {
    x: cx, y: ruleY + 36, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);
  const ruleT2 = S.text('fewer wires over longer distance = slower transmission and higher energy per bit', {
    x: cx, y: ruleY + 72, size: 20, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  return {
    group: g, bg, title,
    aBox, aTitle, aDie, aDieLbl, aDieSub, aPhy, aPhyLbl, aSerdesLbl,
    bBox, bTitle, bDie, bDieLbl, bDieSub, bPhy, bPhyLbl, bSerdesLbl,
    wireLines, wirePill,
    ruleBox, ruleT1, ruleT2
  };
}

/**
 * Atlas Fig 111: Scale-Up vs Scale-Out Comparison Visual
 */
function ch20ScaleUpVsOut(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const cardW = 680;
  const cardH = 590;
  const topY = cy - cardH / 2;

  // Left Card: Scale-Up (Inside the Chassis)
  const leftX = cx - cardW - 20;
  const leftBg = S.rect({ x: leftX, y: topY, w: cardW, h: cardH, r: 14, fill: '#131d2e', stroke: S.tone('compute'), sw: 1.5 }, g);
  const leftTitle = S.text('scale-up · inside the chassis', {
    x: leftX + cardW / 2, y: topY + 40, size: 24, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const leftSub = S.text('high-speed nvswitch crossbar fabric across the board', {
    x: leftX + cardW / 2, y: topY + 74, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Diagram of 8 GPUs inside Chassis connected to central switch
  const diagH = 210;
  const diagY = topY + 98;
  const diagBg1 = S.rect({ x: leftX + 30, y: diagY, w: cardW - 60, h: diagH, r: 10, fill: '#0d131f', stroke: '#222f48', sw: 1 }, g);

  // Draw 8 GPU boxes in 2 rows of 4
  const gW = 86;
  const gH = 44;
  const gRow1Y = diagY + 20;
  const gRow2Y = diagY + diagH - 20 - gH;
  const lGpus = [];
  for (let r = 0; r < 2; r++) {
    const gy = r === 0 ? gRow1Y : gRow2Y;
    for (let c = 0; c < 4; c++) {
      const gx = leftX + 55 + c * (gW + 56);
      const gb = S.rect({ x: gx, y: gy, w: gW, h: gH, r: 6, fill: S.tone('compute', 0.35), stroke: S.tone('compute'), sw: 1.5 }, g);
      const gl = S.text(`gpu ${r * 4 + c + 1}`, { x: gx + gW / 2, y: gy + 28, size: 20, anchor: 'middle', weight: 700, color: 'ink' }, g);
      lGpus.push({ gb, gl });
    }
  }

  // Central NVSwitch Chip
  const swW = 240;
  const swH = 46;
  const swX = leftX + cardW / 2 - swW / 2;
  const swY = diagY + diagH / 2 - swH / 2;
  const swBox = S.rect({ x: swX, y: swY, w: swW, h: swH, r: 8, fill: S.tone('compute', 0.6), stroke: S.tone('compute'), sw: 2 }, g);
  const swLbl = S.text('nvswitch crossbar', { x: leftX + cardW / 2, y: swY + 30, size: 20, anchor: 'middle', weight: 700, color: 'ink' }, g);

  // Features list
  const fBoxY = diagY + diagH + 16;
  const fBoxH = 165;
  const fBox1 = S.rect({ x: leftX + 30, y: fBoxY, w: cardW - 60, h: fBoxH, r: 10, fill: '#172236', stroke: '#2e4162', sw: 1 }, g);
  const l1 = S.text('• interconnect: nvlink 4.0 / nvswitch crossbar', { x: leftX + 50, y: fBoxY + 34, size: 20, weight: 600, color: 'ink' }, g);
  const l2 = S.text('• peer rate: 450 gb/s each way (900 gb/s total)', { x: leftX + 50, y: fBoxY + 70, size: 20, weight: 700, color: 'compute' }, g);
  const l3 = S.text('• latency: sub-microsecond direct load/store access', { x: leftX + 50, y: fBoxY + 106, size: 20, weight: 600, color: 'ink' }, g);
  const l4 = S.text('• scope: 8 to 72 gpus in one unified switch domain', { x: leftX + 50, y: fBoxY + 138, size: 20, weight: 600, color: 'muted' }, g);

  const leftPill = S.pill('full-speed switched peer bandwidth (450 gb/s)', {
    x: leftX + cardW / 2, y: topY + cardH - 36, h: 42, tone: 'compute', size: 20, weight: 700
  }, g);

  // Right Card: Scale-Out (Between Chassis)
  const rightX = cx + 20;
  const rightBg = S.rect({ x: rightX, y: topY, w: cardW, h: cardH, r: 14, fill: '#231823', stroke: S.tone('bytes'), sw: 1.5 }, g);
  const rightTitle = S.text('scale-out · between chassis', {
    x: rightX + cardW / 2, y: topY + 40, size: 24, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const rightSub = S.text('ordinary data-centre networking across optical cables', {
    x: rightX + cardW / 2, y: topY + 74, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Diagram of Chassis A and Chassis B connected across room
  const diagBg2 = S.rect({ x: rightX + 30, y: diagY, w: cardW - 60, h: diagH, r: 10, fill: '#140f16', stroke: '#3a2638', sw: 1 }, g);

  const boxAW = 160;
  const boxAH = 130;
  const boxAY = diagY + 40;
  const boxA = S.rect({ x: rightX + 50, y: boxAY, w: boxAW, h: boxAH, r: 8, fill: '#221422', stroke: S.tone('bytes'), sw: 1.5 }, g);
  const boxALbl1 = S.text('chassis a', { x: rightX + 50 + boxAW / 2, y: boxAY + 50, size: 22, anchor: 'middle', weight: 700, color: 'ink' }, g);
  const boxALbl2 = S.text('8 gpus', { x: rightX + 50 + boxAW / 2, y: boxAY + 88, size: 20, anchor: 'middle', weight: 600, color: 'bytes' }, g);

  const boxBX = rightX + cardW - 50 - boxAW;
  const boxB = S.rect({ x: boxBX, y: boxAY, w: boxAW, h: boxAH, r: 8, fill: '#221422', stroke: S.tone('bytes'), sw: 1.5 }, g);
  const boxBLbl1 = S.text('chassis b', { x: boxBX + boxAW / 2, y: boxAY + 50, size: 22, anchor: 'middle', weight: 700, color: 'ink' }, g);
  const boxBLbl2 = S.text('8 gpus', { x: boxBX + boxAW / 2, y: boxAY + 88, size: 20, anchor: 'middle', weight: 600, color: 'bytes' }, g);

  // Optical Cable between Chassis A and B with clear tag
  const tagW = 200;
  const cableL = S.g(null, g);
  const cableL1 = S.line({
    x1: rightX + 50 + boxAW, y1: boxAY + boxAH / 2,
    x2: rightX + cardW / 2 - tagW / 2 - 5, y2: boxAY + boxAH / 2,
    stroke: S.tone('bytes'), sw: 3, dash: '6 4'
  }, cableL);
  const cableL2 = S.line({
    x1: rightX + cardW / 2 + tagW / 2 + 5, y1: boxAY + boxAH / 2,
    x2: boxBX, y2: boxAY + boxAH / 2,
    stroke: S.tone('bytes'), sw: 3, dash: '6 4'
  }, cableL);
  const cableTag = S.pill('9× bandwidth drop', {
    x: rightX + cardW / 2, y: boxAY + boxAH / 2, h: 36, tone: 'bytes', size: 20, weight: 700
  }, g);

  // Features list
  const fBox2 = S.rect({ x: rightX + 30, y: fBoxY, w: cardW - 60, h: fBoxH, r: 10, fill: '#291828', stroke: '#502a4d', sw: 1 }, g);
  const r1 = S.text('• interconnect: infiniband cx-7 / roce ethernet', { x: rightX + 50, y: fBoxY + 34, size: 20, weight: 600, color: 'ink' }, g);
  const r2 = S.text('• network rate: 50 gb/s each way (400 gb/s port)', { x: rightX + 50, y: fBoxY + 70, size: 20, weight: 700, color: 'bytes' }, g);
  const r3 = S.text('• boundary penalty: 9× slower than nvlink fabric', { x: rightX + 50, y: fBoxY + 106, size: 20, weight: 700, color: 'bytes' }, g);
  const r4 = S.text('• scope: thousands of nodes across data centre', { x: rightX + 50, y: fBoxY + 138, size: 20, weight: 600, color: 'muted' }, g);

  const rightPill = S.pill('crossing the chassis boundary drops bandwidth by 9×', {
    x: rightX + cardW / 2, y: topY + cardH - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return {
    group: g,
    leftBg, leftTitle, leftSub, diagBg1, lGpus, swBox, swLbl, fBox1, l1, l2, l3, l4, leftPill,
    rightBg, rightTitle, rightSub, diagBg2, boxA, boxALbl1, boxALbl2, boxB, boxBLbl1, boxBLbl2,
    cableL, cableTag, fBox2, r1, r2, r3, r4, rightPill
  };
}

/**
 * Atlas Fig 112: Pairwise Mesh vs Central Crossbar Topology Visual
 */
function ch20TopologyCompare(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const cardW = 680;
  const cardH = 590;
  const topY = cy - cardH / 2;

  // Left Card: Pairwise Mesh Topology (n(n-1)/2 Links)
  const leftX = cx - cardW - 20;
  const leftBg = S.rect({ x: leftX, y: topY, w: cardW, h: cardH, r: 14, fill: '#221520', stroke: S.tone('bytes'), sw: 1.5 }, g);
  const leftTitle = S.text('pairwise mesh · n(n − 1) ÷ 2 links', {
    x: leftX + cardW / 2, y: topY + 40, size: 24, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const leftSub = S.text('combinatorial wiring explosion and link fragmentation', {
    x: leftX + cardW / 2, y: topY + 74, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Illustrated 8 GPUs arranged in a circle with all 28 mesh lines
  const meshCenterX = leftX + cardW / 2;
  const meshCenterY = topY + 220;
  const meshRadius = 110;
  const numGpus = 8;
  const nodeR = 19;
  const gpuCoords = [];
  for (let i = 0; i < numGpus; i++) {
    const angle = (i * 2 * Math.PI) / numGpus - Math.PI / 2;
    const gx = meshCenterX + meshRadius * Math.cos(angle);
    const gy = meshCenterY + meshRadius * Math.sin(angle);
    gpuCoords.push({ x: gx, y: gy });
  }

  // Draw 28 interconnect lines connecting all pairs, trimmed to node perimeter!
  const meshLines = [];
  for (let i = 0; i < numGpus; i++) {
    for (let j = i + 1; j < numGpus; j++) {
      const dx = gpuCoords[j].x - gpuCoords[i].x;
      const dy = gpuCoords[j].y - gpuCoords[i].y;
      const dist = Math.hypot(dx, dy);
      const ux = dx / dist;
      const uy = dy / dist;
      const ml = S.line({
        x1: gpuCoords[i].x + ux * nodeR, y1: gpuCoords[i].y + uy * nodeR,
        x2: gpuCoords[j].x - ux * nodeR, y2: gpuCoords[j].y - uy * nodeR,
        stroke: S.tone('bytes', 0.4), sw: 1.2
      }, g);
      meshLines.push(ml);
    }
  }

  // Draw 8 GPU circular nodes
  const meshNodes = [];
  for (let i = 0; i < numGpus; i++) {
    const circle = S.circle({ cx: gpuCoords[i].x, cy: gpuCoords[i].y, r: nodeR, fill: '#2e192c', stroke: S.tone('bytes'), sw: 1.5 }, g);
    const num = S.text(`${i + 1}`, { x: gpuCoords[i].x, y: gpuCoords[i].y + 7, size: 20, anchor: 'middle', weight: 700, color: 'ink' }, g);
    meshNodes.push({ circle, num });
  }

  // Bottleneck panel
  const botPanelY = topY + 365;
  const botPanelH = 155;
  const bPanel1 = S.rect({ x: leftX + 30, y: botPanelY, w: cardW - 60, h: botPanelH, r: 10, fill: '#2b1928', stroke: '#552a4f', sw: 1 }, g);
  const m1 = S.text('• 4 gpus = 6 links  |  8 gpus = 28 links', { x: leftX + 50, y: botPanelY + 34, size: 20, weight: 600, color: 'ink' }, g);
  const m2 = S.text('• 72 gpus = 2,556 links (impossible wiring!)', { x: leftX + 50, y: botPanelY + 70, size: 20, weight: 700, color: 'bytes' }, g);
  const m3 = S.text('• 18-link budget split 7 ways: 2.5 links per pair', { x: leftX + 50, y: botPanelY + 104, size: 20, weight: 600, color: 'ink' }, g);
  const m4 = S.text('• links to other peers sit completely idle during send', { x: leftX + 50, y: botPanelY + 136, size: 20, weight: 600, color: 'muted' }, g);

  const leftPill = S.pill('direct pairwise mesh scales as n²: links explode quadratically', {
    x: leftX + cardW / 2, y: topY + cardH - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  // Right Card: Central NVSwitch Crossbar Topology
  const rightX = cx + 20;
  const rightBg = S.rect({ x: rightX, y: topY, w: cardW, h: cardH, r: 14, fill: '#141d2c', stroke: S.tone('helps'), sw: 1.5 }, g);
  const rightTitle = S.text('central nvswitch · linear o(n) scaling', {
    x: rightX + cardW / 2, y: topY + 40, size: 24, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const rightSub = S.text('every gpu runs all links to switch at full rate', {
    x: rightX + cardW / 2, y: topY + 74, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Illustrated 8 GPUs connecting radially to central NVSwitch
  const swCenterX = rightX + cardW / 2;
  const swCenterY = topY + 220;
  const swRadius = 110;
  const hubR = 38;
  const swGpuCoords = [];
  for (let i = 0; i < numGpus; i++) {
    const angle = (i * 2 * Math.PI) / numGpus - Math.PI / 2;
    const gx = swCenterX + swRadius * Math.cos(angle);
    const gy = swCenterY + swRadius * Math.sin(angle);
    swGpuCoords.push({ x: gx, y: gy, angle });
  }

  // Draw 8 radial links, trimmed to hub and node perimeters!
  const swLines = [];
  for (let i = 0; i < numGpus; i++) {
    const sl = S.line({
      x1: swCenterX + hubR * Math.cos(swGpuCoords[i].angle),
      y1: swCenterY + hubR * Math.sin(swGpuCoords[i].angle),
      x2: swGpuCoords[i].x - nodeR * Math.cos(swGpuCoords[i].angle),
      y2: swGpuCoords[i].y - nodeR * Math.sin(swGpuCoords[i].angle),
      stroke: S.tone('helps'), sw: 3
    }, g);
    swLines.push(sl);
  }

  // Central NVSwitch Hub
  const hubCircle = S.circle({ cx: swCenterX, cy: swCenterY, r: hubR, fill: S.tone('helps', 0.4), stroke: S.tone('helps'), sw: 2.5 }, g);
  const hubLbl = S.text('switch', { x: swCenterX, y: swCenterY + 7, size: 20, anchor: 'middle', weight: 700, color: 'ink' }, g);

  // Draw 8 GPU circular nodes around switch
  const swNodes = [];
  for (let i = 0; i < numGpus; i++) {
    const circle = S.circle({ cx: swGpuCoords[i].x, cy: swGpuCoords[i].y, r: nodeR, fill: '#172738', stroke: S.tone('helps'), sw: 1.5 }, g);
    const num = S.text(`${i + 1}`, { x: swGpuCoords[i].x, y: swGpuCoords[i].y + 7, size: 20, anchor: 'middle', weight: 700, color: 'ink' }, g);
    swNodes.push({ circle, num });
  }

  // Advantage panel
  const bPanel2 = S.rect({ x: rightX + 30, y: botPanelY, w: cardW - 60, h: botPanelH, r: 10, fill: '#172538', stroke: '#2e496b', sw: 1 }, g);
  const s1 = S.text('• connections scale linearly: exactly 8 links for 8 gpus', { x: rightX + 50, y: botPanelY + 34, size: 20, weight: 600, color: 'ink' }, g);
  const s2 = S.text('• dgx h100 connects 8 gpus through 4 nvswitch chips', { x: rightX + 50, y: botPanelY + 70, size: 20, weight: 600, color: 'ink' }, g);
  const s3 = S.text('• all 18 links dedicated: any pair connects at full 450 gb/s', { x: rightX + 50, y: botPanelY + 104, size: 20, weight: 700, color: 'helps' }, g);
  const s4 = S.text('• connections scale with gpu count, not pairs of gpus', { x: rightX + 50, y: botPanelY + 136, size: 20, weight: 600, color: 'muted' }, g);

  const rightPill = S.pill('nvswitch delivers all-to-all communication at full link rate', {
    x: rightX + cardW / 2, y: topY + cardH - 36, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g,
    leftBg, leftTitle, leftSub, meshLines, meshNodes, bPanel1, m1, m2, m3, m4, leftPill,
    rightBg, rightTitle, rightSub, swLines, hubCircle, hubLbl, swNodes, bPanel2, s1, s2, s3, s4, rightPill
  };
}

/**
 * Atlas Fig 113: Generational Interconnect Gap Visual (A100 vs H100 vs B200)
 */
function ch20GenerationalGap(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1460;
  const h = opts.h ?? 620;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('the generational interconnect gap · local hbm remains 7× to 9× faster than nvlink', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Three Generational Rows: A100 (2020), H100 (2022), B200 (2024)
  const gens = [
    {
      name: 'a100 (2020)',
      hbm: 2039,
      nvlink: 300,
      ratio: '6.8× gap',
      desc: 'hbm: 2,039 gb/s vs nvlink: 300 gb/s (each way)',
      tone: 'struct'
    },
    {
      name: 'h100 (2022)',
      hbm: 3352,
      nvlink: 450,
      ratio: '7.4× gap',
      desc: 'hbm: 3,352 gb/s vs nvlink: 450 gb/s (each way)',
      tone: 'compute'
    },
    {
      name: 'b200 (2024)',
      hbm: 8000,
      nvlink: 900,
      ratio: '8.9× gap',
      desc: 'hbm: 8,000 gb/s vs nvlink: 900 gb/s (each way)',
      tone: 'helps'
    }
  ];

  const maxVal = 8000;
  const barMaxW = 860;
  const rowStartX = cx - 650;
  const startY = cy - 190;
  const rowGap = 145;

  const genRows = [];
  gens.forEach((gn, idx) => {
    const ry = startY + idx * rowGap;

    const rowCard = S.rect({
      x: rowStartX, y: ry, w: 1300, h: 125, r: 10,
      fill: '#151d2e', stroke: S.tone(gn.tone), sw: 1.5
    }, g);

    const nameLbl = S.text(gn.name, {
      x: rowStartX + 30, y: ry + 36, size: 24, weight: 700, color: gn.tone
    }, g);

    const descLbl = S.text(gn.desc, {
      x: rowStartX + 200, y: ry + 36, size: 20, weight: 600, color: 'ink'
    }, g);

    const ratioPill = S.pill(gn.ratio, {
      x: rowStartX + 1180, y: ry + 32, h: 36, tone: 'bytes', size: 20, weight: 700
    }, g);

    // HBM Bar
    const hbmW = Math.round((gn.hbm / maxVal) * barMaxW);
    const hbmY = ry + 56;
    const hbmBar = S.rect({
      x: rowStartX + 200, y: hbmY, w: hbmW, h: 26, r: 5,
      fill: S.tone(gn.tone, 0.45), stroke: S.tone(gn.tone), sw: 1.5
    }, g);
    const hbmLbl = S.text(`hbm: ${gn.hbm.toLocaleString()} gb/s`, {
      x: rowStartX + 200 + hbmW + 15, y: hbmY + 19, size: 20, weight: 700, color: 'ink'
    }, g);

    // NVLink Bar
    const nvW = Math.round((gn.nvlink / maxVal) * barMaxW);
    const nvY = ry + 88;
    const nvBar = S.rect({
      x: rowStartX + 200, y: nvY, w: nvW, h: 24, r: 5,
      fill: S.tone('bytes', 0.45), stroke: S.tone('bytes'), sw: 1.5
    }, g);
    const nvLbl = S.text(`nvlink: ${gn.nvlink} gb/s (each way)`, {
      x: rowStartX + 200 + nvW + 15, y: nvY + 18, size: 20, weight: 700, color: 'bytes'
    }, g);

    genRows.push({ rowCard, nameLbl, descLbl, ratioPill, hbmBar, hbmLbl, nvBar, nvLbl });
  });

  const footer = S.pill('both bandwidths grow 4× across two generations, but the 7× to 9× gap holds steady', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return { group: g, bg, title, genRows, footer };
}

/**
 * Atlas Figs 114, 115: Physical Wire Geometry Hierarchy & Log Bandwidth Ruler
 */
function ch20GeometryTiers(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1460;
  const h = opts.h ?? 620;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('why leaving the package is expensive · geometry and the three bandwidth tiers', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Three Physical Tiers Illustrated Side-by-Side
  const colW = 420;
  const colGap = 30;
  const startX = cx - (3 * colW + 2 * colGap) / 2;
  const colY = cy - 220;
  const colH = 310;

  const tiers = [
    {
      title: 'tier 1 · on package',
      dist: 'silicon interposer (~1 mm distance)',
      wires: '5,120 microscopic wires',
      calc: '5,120 × 5.238 gb/s ÷ 8',
      bw: '3,352 gb/s',
      tone: 'helps'
    },
    {
      title: 'tier 2 · off package',
      dist: 'printed circuit board (~20 cm distance)',
      wires: '72 differential wire pairs',
      calc: '18 links × 2 pairs × 100 gb/s ÷ 8',
      bw: '450 gb/s (7.4× drop)',
      tone: 'compute'
    },
    {
      title: 'tier 3 · across the room',
      dist: 'optical network cable (~10 m distance)',
      wires: 'serial transceiver fiber',
      calc: 'one 400 gb/s port per gpu ÷ 8',
      bw: '50 gb/s (9.0× drop again)',
      tone: 'bytes'
    }
  ];

  const colEls = [];
  tiers.forEach((t, idx) => {
    const lx = startX + idx * (colW + colGap);
    const bc = S.rect({ x: lx, y: colY, w: colW, h: colH, r: 12, fill: '#141d2d', stroke: S.tone(t.tone), sw: 1.5 }, g);
    const tn = S.text(t.title, { x: lx + colW / 2, y: colY + 36, size: 22, anchor: 'middle', weight: 700, color: t.tone }, g);
    const td = S.text(t.dist, { x: lx + colW / 2, y: colY + 76, size: 20, anchor: 'middle', weight: 600, color: 'ink' }, g);
    const tw = S.text(t.wires, { x: lx + colW / 2, y: colY + 120, size: 20, anchor: 'middle', weight: 700, color: t.tone }, g);
    const tc = S.text(t.calc, { x: lx + colW / 2, y: colY + 165, size: 20, anchor: 'middle', weight: 600, color: 'muted' }, g);
    const tp = S.pill(t.bw, { x: lx + colW / 2, y: colY + 230, h: 44, tone: t.tone, size: 22, weight: 700 }, g);
    colEls.push({ bc, tn, td, tw, tc, tp });
  });

  // Bottom Section: Log-Scale Bandwidth Axis (Atlas Fig 115)
  const rulerY = cy + 130;
  const rulerW = 1200;
  const rulerStartX = cx - rulerW / 2;
  const rulerBox = S.rect({ x: rulerStartX, y: rulerY, w: rulerW, h: 100, r: 10, fill: '#121927', stroke: '#273650', sw: 1.5 }, g);
  const rulerLine = S.line({ x1: rulerStartX + 80, y1: rulerY + 50, x2: rulerStartX + rulerW - 80, y2: rulerY + 50, stroke: '#3f5680', sw: 2 }, g);

  // Log ticks: 10, 100, 1,000, 10,000 GB/s
  const logTicks = [
    { val: 10, lbl: '10 gb/s', x: rulerStartX + 120 },
    { val: 100, lbl: '100 gb/s', x: rulerStartX + 420 },
    { val: 1000, lbl: '1,000 gb/s', x: rulerStartX + 720 },
    { val: 10000, lbl: '10,000 gb/s', x: rulerStartX + 1020 }
  ];
  const tickEls = [];
  logTicks.forEach(tk => {
    const tl = S.line({ x1: tk.x, y1: rulerY + 42, x2: tk.x, y2: rulerY + 58, stroke: '#5675aa', sw: 2 }, g);
    const tt = S.text(tk.lbl, { x: tk.x, y: rulerY + 80, size: 20, anchor: 'middle', weight: 600, color: 'muted' }, g);
    tickEls.push({ tl, tt });
  });

  // Plotted points on ruler: InfiniBand (50), NVLink (450), HBM (3,352)
  const getLogX = gb => rulerStartX + 120 + (Math.log10(gb) - 1) * 300;
  const pIbX = getLogX(50);
  const pNvX = getLogX(450);
  const pHbmX = getLogX(3352);

  const ptIb = S.circle({ cx: pIbX, cy: rulerY + 50, r: 8, fill: S.tone('bytes'), stroke: '#fff', sw: 1.5 }, g);
  const tagIb = S.text('50 gb/s', { x: pIbX, y: rulerY + 30, size: 20, anchor: 'middle', weight: 700, color: 'bytes' }, g);

  const ptNv = S.circle({ cx: pNvX, cy: rulerY + 50, r: 8, fill: S.tone('compute'), stroke: '#fff', sw: 1.5 }, g);
  const tagNv = S.text('450 gb/s', { x: pNvX, y: rulerY + 30, size: 20, anchor: 'middle', weight: 700, color: 'compute' }, g);

  const ptHbm = S.circle({ cx: pHbmX, cy: rulerY + 50, r: 8, fill: S.tone('helps'), stroke: '#fff', sw: 1.5 }, g);
  const tagHbm = S.text('3,352 gb/s', { x: pHbmX, y: rulerY + 30, size: 20, anchor: 'middle', weight: 700, color: 'helps' }, g);

  const footer = S.pill('distance dictates bandwidth: package to board drops 7× · board to cable drops 9×', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return {
    group: g, bg, title, colEls, rulerBox, rulerLine, tickEls,
    ptIb, tagIb, ptNv, tagNv, ptHbm, tagHbm, footer
  };
}

/**
 * Atlas Figs 116, 117: Tensor Parallelism All-Reduce Visual
 */
function ch20TensorParallel(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1460;
  const h = opts.h ?? 620;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('tensor parallelism · splitting a sum across two gpus and the all-reduce burden', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // GPU A (Left) and GPU B (Right) calculating partial dot products
  const chipW = 660;
  const chipH = 220;
  const chipY = cy - 220;

  // GPU A
  const leftX = cx - chipW - 20;
  const aCard = S.rect({ x: leftX, y: chipY, w: chipW, h: chipH, r: 12, fill: '#141d2c', stroke: S.tone('compute'), sw: 1.5 }, g);
  const aTitle = S.text('gpu a · first 4 terms of layer dot product', {
    x: leftX + chipW / 2, y: chipY + 36, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  }, g);
  const aTerms = S.text('weights w = [2, 1, 3, 1]  ·  inputs x = [1, 2, 1, 3]', {
    x: leftX + chipW / 2, y: chipY + 80, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const aCalc = S.text('partial sum = (2×1) + (1×2) + (3×1) + (1×3) = 10', {
    x: leftX + chipW / 2, y: chipY + 125, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);
  const aResultPill = S.pill('partial sum a = 10', {
    x: leftX + chipW / 2, y: chipY + 175, h: 42, tone: 'compute', size: 20, weight: 700
  }, g);

  // GPU B
  const rightX = cx + 20;
  const bCard = S.rect({ x: rightX, y: chipY, w: chipW, h: chipH, r: 12, fill: '#141d2c', stroke: S.tone('helps'), sw: 1.5 }, g);
  const bTitle = S.text('gpu b · second 4 terms of layer dot product', {
    x: rightX + chipW / 2, y: chipY + 36, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const bTerms = S.text('weights w = [1, 2, 2, 1]  ·  inputs x = [2, 1, 1, 2]', {
    x: rightX + chipW / 2, y: chipY + 80, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);
  const bCalc = S.text('partial sum = (1×2) + (2×1) + (2×1) + (1×2) = 8', {
    x: rightX + chipW / 2, y: chipY + 125, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);
  const bResultPill = S.pill('partial sum b = 8', {
    x: rightX + chipW / 2, y: chipY + 175, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  // Interconnect All-Reduce Exchange Section
  const exW = 1340;
  const exH = 120;
  const exY = cy + 25;
  const exCard = S.rect({ x: cx - exW / 2, y: exY, w: exW, h: exH, r: 12, fill: '#162032', stroke: S.tone('struct'), sw: 2 }, g);
  const exTitle = S.text('all-reduce exchange across interconnect · both gpus receive the total sum', {
    x: cx, y: exY + 36, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);
  const exMath = S.text('gpu a: 10 + 8 = 18    ⇄  interconnect link  ⇄    gpu b: 8 + 10 = 18', {
    x: cx, y: exY + 82, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // The Multiplier: 160 All-Reduces per token
  const multW = 1340;
  const multH = 80;
  const multY = cy + 165;
  const multCard = S.rect({ x: cx - multW / 2, y: multY, w: multW, h: multH, r: 10, fill: '#251523', stroke: S.tone('bytes'), sw: 1.5 }, g);
  const multT1 = S.text('2 all-reduces per layer × 80 layers = 160 synchronization barriers for every token!', {
    x: cx, y: multY + 34, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const multT2 = S.text('inside nvlink domain: affordable · across network cables: serial barriers dominate execution time', {
    x: cx, y: multY + 62, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  const footer = S.pill('160 all-reduces per token make tensor parallelism viable only inside fast scale-up fabrics', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g, bg, title,
    aCard, aTitle, aTerms, aCalc, aResultPill,
    bCard, bTitle, bTerms, bCalc, bResultPill,
    exCard, exTitle, exMath,
    multCard, multT1, multT2, footer
  };
}

/**
 * Atlas Fig 118: Growing the Fast Domain Visual (DGX 8 GPUs vs GB200 NVL72 72 GPUs)
 */
function ch20ExpandingDomain(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const cardW = 680;
  const cardH = 590;
  const topY = cy - cardH / 2;

  // Left Card: Traditional 8-GPU Server Chassis
  const leftX = cx - cardW - 20;
  const leftBg = S.rect({ x: leftX, y: topY, w: cardW, h: cardH, r: 14, fill: '#221520', stroke: S.tone('bytes'), sw: 1.5 }, g);
  const leftTitle = S.text('traditional · 8-gpu server chassis', {
    x: leftX + cardW / 2, y: topY + 40, size: 24, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const leftSub = S.text('fast switch domain limited to a single physical enclosure', {
    x: leftX + cardW / 2, y: topY + 74, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Diagram of 8-GPU chassis
  const diagH = 210;
  const diagY = topY + 98;
  const diagBg1 = S.rect({ x: leftX + 30, y: diagY, w: cardW - 60, h: diagH, r: 10, fill: '#140f16', stroke: '#3a2638', sw: 1 }, g);

  // 8 GPU cards in chassis
  const gW = 60;
  const gH = 115;
  const gGap = 12;
  const gStartX1 = leftX + 30 + (cardW - 60 - (8 * gW + 7 * gGap)) / 2;
  const gY1 = diagY + 45;
  const lGpus = [];
  for (let i = 0; i < 8; i++) {
    const gx = gStartX1 + i * (gW + gGap);
    const gb = S.rect({ x: gx, y: gY1, w: gW, h: gH, r: 6, fill: S.tone('bytes', 0.35), stroke: S.tone('bytes'), sw: 1.5 }, g);
    const gl1 = S.text(`h100`, { x: gx + gW / 2, y: gY1 + 48, size: 20, anchor: 'middle', weight: 700, color: 'ink' }, g);
    const gl2 = S.text(`80g`, { x: gx + gW / 2, y: gY1 + 82, size: 20, anchor: 'middle', weight: 600, color: 'bytes' }, g);
    lGpus.push({ gb, gl1, gl2 });
  }

  // Specifications list
  const sBoxY = diagY + diagH + 16;
  const sBoxH = 165;
  const sBox1 = S.rect({ x: leftX + 30, y: sBoxY, w: cardW - 60, h: sBoxH, r: 10, fill: '#281727', stroke: '#50264d', sw: 1 }, g);
  const l1 = S.text('• fast domain size: 8 gpus in one chassis', { x: leftX + 50, y: sBoxY + 34, size: 20, weight: 600, color: 'ink' }, g);
  const l2 = S.text('• total fast memory: 640 gb unified capacity', { x: leftX + 50, y: sBoxY + 70, size: 20, weight: 700, color: 'bytes' }, g);
  const l3 = S.text('• frontier model limit: 405b (810 gb) spills onto network', { x: leftX + 50, y: sBoxY + 106, size: 20, weight: 700, color: 'bytes' }, g);
  const l4 = S.text('• boundary penalty: 9× bandwidth drop between chassis', { x: leftX + 50, y: sBoxY + 138, size: 20, weight: 600, color: 'muted' }, g);

  const leftPill = S.pill('640 gb ceiling · spills into 2nd chassis over slow network', {
    x: leftX + cardW / 2, y: topY + cardH - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  // Right Card: GB200 NVL72 Rack-Scale Domain
  const rightX = cx + 20;
  const rightBg = S.rect({ x: rightX, y: topY, w: cardW, h: cardH, r: 14, fill: '#131e2c', stroke: S.tone('helps'), sw: 1.5 }, g);
  const rightTitle = S.text('expanded · gb200 nvl72 liquid-cooled rack', {
    x: rightX + cardW / 2, y: topY + 40, size: 24, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const rightSub = S.text('72 gpus united into a single nvlink switch domain', {
    x: rightX + cardW / 2, y: topY + 74, size: 20, anchor: 'middle', weight: 600, color: 'ink'
  }, g);

  // Diagram of GB200 NVL72 Rack with 72 GPUs
  const diagBg2 = S.rect({ x: rightX + 30, y: diagY, w: cardW - 60, h: diagH, r: 10, fill: '#0e1522', stroke: '#1f2e46', sw: 1 }, g);

  // Draw 18 compute trays with 4 GPUs each (72 GPUs total in rack)
  const rackTrayW = 540;
  const rackTrayH = 165;
  const rackTrayX = rightX + 30 + (cardW - 60 - rackTrayW) / 2;
  const rackTrayY = diagY + 22;
  const rackBox = S.rect({ x: rackTrayX, y: rackTrayY, w: rackTrayW, h: rackTrayH, r: 8, fill: '#172538', stroke: S.tone('helps'), sw: 1.5 }, g);

  // Draw 4 rows of 9 GPU dies to show the density
  const rGpuW = 44;
  const rGpuH = 25;
  const rGpus = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 9; col++) {
      const rx = rackTrayX + 22 + col * (rGpuW + 12);
      const ry = rackTrayY + 18 + row * (rGpuH + 12);
      const rb = S.rect({ x: rx, y: ry, w: rGpuW, h: rGpuH, r: 4, fill: S.tone('helps', 0.45), stroke: S.tone('helps'), sw: 1 }, g);
      rGpus.push(rb);
    }
  }

  // Specifications list
  const sBox2 = S.rect({ x: rightX + 30, y: sBoxY, w: cardW - 60, h: sBoxH, r: 10, fill: '#162334', stroke: '#2e4566', sw: 1 }, g);
  const r1 = S.text('• fast domain size: 72 gpus in one liquid-cooled rack', { x: rightX + 50, y: sBoxY + 34, size: 20, weight: 600, color: 'ink' }, g);
  const r2 = S.text('• total fast memory: 13.4 terabytes unified hbm pool', { x: rightX + 50, y: sBoxY + 70, size: 20, weight: 700, color: 'helps' }, g);
  const r3 = S.text('• peer throughput: 1.8 tb/s all-to-all across switches', { x: rightX + 50, y: sBoxY + 106, size: 20, weight: 700, color: 'helps' }, g);
  const r4 = S.text('• fits 405b model 16× over without leaving domain', { x: rightX + 50, y: sBoxY + 138, size: 20, weight: 600, color: 'muted' }, g);

  const rightPill = S.pill('13.4 tb unified memory: model never leaves the fast domain', {
    x: rightX + cardW / 2, y: topY + cardH - 36, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g,
    leftBg, leftTitle, leftSub, diagBg1, lGpus, sBox1, l1, l2, l3, l4, leftPill,
    rightBg, rightTitle, rightSub, diagBg2, rackBox, rGpus, sBox2, r1, r2, r3, r4, rightPill
  };
}
