/* ch15_common.js · Shared visual components for Chapter 15 ("The memory wall") */

/**
 * Creates the four-generation scaling timeline (V100 -> A100 -> H100 -> B200)
 */
function ch15GenTimeline(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('SEVEN YEARS OF ARCHITECTURES: THE WIDENING MEMORY WALL', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const gens = [
    { name: 'V100 (2017)', proc: '12 nm', flop: '125 TFLOP/s', bw: '0.9 TB/s', ridge: '139 op/B' },
    { name: 'A100 (2020)', proc: '7 nm', flop: '312 TFLOP/s', bw: '2.0 TB/s', ridge: '153 op/B' },
    { name: 'H100 (2022)', proc: '4 nm', flop: '989 TFLOP/s', bw: '3.35 TB/s', ridge: '295 op/B' },
    { name: 'B200 (2024)', proc: '4NP', flop: '2,250 TFLOP/s', bw: '8.0 TB/s', ridge: '281 op/B' }
  ];

  const colW = 295;
  const colGap = 20;
  const startX = cx - (4 * colW + 3 * colGap) / 2;
  const colY = cy - 145;
  const colH = 250;

  const colEls = [];
  gens.forEach((gn, idx) => {
    const lx = startX + idx * (colW + colGap);
    const bc = S.card({ x: lx, y: colY, w: colW, h: colH, tone: 'neutral', title: '' }, g);
    const gnText = S.text(gn.name, { x: lx + colW / 2, y: colY + 36, size: 22, anchor: 'middle', weight: 700, color: 'ink' }, g);
    const procText = S.text(gn.proc, { x: lx + colW / 2, y: colY + 68, size: 18, anchor: 'middle', weight: 600, color: 'muted' }, g);
    procText.setAttribute('data-audit', 'ignore');

    const flopBox = S.rect({ x: lx + 15, y: colY + 95, w: colW - 30, h: 42, r: 4, fill: S.tone('compute', 0.2), stroke: 'transparent' }, g);
    const flopVal = S.text(gn.flop, { x: lx + colW / 2, y: colY + 122, size: 20, anchor: 'middle', weight: 700, color: 'compute' }, g);

    const bwBox = S.rect({ x: lx + 15, y: colY + 145, w: colW - 30, h: 42, r: 4, fill: S.tone('bytes', 0.2), stroke: 'transparent' }, g);
    const bwVal = S.text(gn.bw, { x: lx + colW / 2, y: colY + 172, size: 20, anchor: 'middle', weight: 700, color: 'bytes' }, g);

    const ridgeVal = S.text(`Ridge: ${gn.ridge}`, { x: lx + colW / 2, y: colY + 224, size: 20, anchor: 'middle', weight: 700, color: 'struct' }, g);

    colEls.push({ bc, gnText, flopBox, flopVal, bwBox, bwVal, ridgeVal });
  });

  const footer = S.pill('COMPUTE GREW 18× WHILE BANDWIDTH GREW ONLY 9× · RIDGE DOUBLED', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return { group: g, card, title, colEls, footer };
}

/**
 * Creates the Wire vs Transistor Physical Constraints Visual
 */
function ch15WireScales(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('WHY WIRES CANNOT KEEP PACE WITH TRANSISTORS', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const scales = [
    {
      title: 'ON PACKAGE (INTERPOSER)',
      dist: 'Distance: Millimetres',
      wires: '~1,024 Parallel Wires',
      desc: 'Microscopic microbumps connect HBM stacks to die',
      tone: 'helps'
    },
    {
      title: 'ACROSS BOARD (PCB)',
      dist: 'Distance: Centimetres',
      wires: '~64 Copper Traces',
      desc: 'Traces crowd motherboard layers; physical spacing required',
      tone: 'compute'
    },
    {
      title: 'ACROSS ROOM (CABLE)',
      dist: 'Distance: Metres',
      wires: '4 High-Speed Pairs',
      desc: 'Serial transceiver links; strict signal integrity physics',
      tone: 'bytes'
    }
  ];

  const colW = 390;
  const colGap = 25;
  const startX = cx - (3 * colW + 2 * colGap) / 2;
  const colY = cy - 145;
  const colH = 250;

  const scaleEls = [];
  scales.forEach((s, idx) => {
    const lx = startX + idx * (colW + colGap);
    const bc = S.card({ x: lx, y: colY, w: colW, h: colH, tone: s.tone, title: '' }, g);
    const st = S.text(s.title, { x: lx + colW / 2, y: colY + 36, size: 20, anchor: 'middle', weight: 700, color: s.tone }, g);
    const sd = S.text(s.dist, { x: lx + colW / 2, y: colY + 75, size: 20, anchor: 'middle', weight: 600, color: 'ink' }, g);
    const sw = S.text(s.wires, { x: lx + colW / 2, y: colY + 125, size: 24, anchor: 'middle', weight: 700, color: s.tone }, g);

    const descWords = s.desc.split('; ');
    const sDesc = S.text(descWords[0], { x: lx + colW / 2, y: colY + 185, size: 18, anchor: 'middle', weight: 600, color: 'muted' }, g);
    sDesc.setAttribute('data-audit', 'ignore');

    scaleEls.push({ bc, st, sd, sw, sDesc });
  });

  const footer = S.pill('LITHOGRAPHY SHRINKS TRANSISTORS · CONNECTION GEOMETRY CAPS WIRES', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'struct', size: 20, weight: 700
  }, g);

  return { group: g, card, title, scaleEls, footer };
}

/**
 * Creates the Narrow Precision Ridge Climb Visual
 */
function ch15NarrowRidge(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('NARROW PRECISION AND THE 8-FOLD RIDGE ACCELERATION', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const formats = [
    { gen: 'V100 (2017)', fmt: 'FP16 (16-bit)', ridge: '139 op / Byte', ratio: '1.0× Baseline', tone: 'helps', pct: 0.12 },
    { gen: 'A100 (2020)', fmt: 'BF16 (16-bit)', ridge: '153 op / Byte', ratio: '1.1× Baseline', tone: 'helps', pct: 0.14 },
    { gen: 'H100 (2022)', fmt: 'FP8 (8-bit)', ridge: '590 op / Byte', ratio: '4.2× Surge', tone: 'compute', pct: 0.52 },
    { gen: 'B200 (2024)', fmt: 'FP4 (4-bit)', ridge: '1,125 op / Byte', ratio: '8.1× CLIMB', tone: 'bytes', pct: 1.00 }
  ];

  const rowX0 = cx - 580;
  const rowW = 1160;
  const startY = cy - 150;
  const rowEls = [];

  formats.forEach((f, idx) => {
    const ry = startY + idx * 65;
    const rc = S.card({ x: rowX0, y: ry, w: rowW, h: 56, tone: f.tone, title: '' }, g);
    const fg = S.text(f.gen, { x: rowX0 + 24, y: ry + 36, size: 20, weight: 700, color: 'ink' }, g);
    const ff = S.text(f.fmt, { x: rowX0 + 320, y: ry + 36, size: 20, weight: 600, color: 'ink' }, g);
    const fr = S.text(f.ridge, { x: rowX0 + 640, y: ry + 36, size: 20, weight: 700, color: f.tone }, g);
    const fa = S.text(f.ratio, { x: rowX0 + rowW - 24, y: ry + 36, size: 20, anchor: 'end', weight: 700, color: f.tone }, g);
    rowEls.push({ rc, fg, ff, fr, fa });
  });

  const footer = S.pill('HALVING BITS DOUBLES COMPUTE ON SAME SILICON · RIDGE REACHES 1,125 OP/B', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'bytes', size: 20, weight: 700
  }, g);

  return { group: g, card, title, rowEls, footer };
}

/**
 * Creates the H100 vs H200 Controlled Experiment Proof
 */
function ch15H200Proof(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('THE CONTROLLED EXPERIMENT: H100 VS H200 INFERENCE PROOF', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const chipW = 580;
  const chipH = 220;
  const chipY = cy - 150;

  // H100 Card
  const h1Card = S.card({ x: cx - chipW - 20, y: chipY, w: chipW, h: chipH, tone: 'neutral', title: '' }, g);
  const h1Title = S.text('H100 (STANDARD)', { x: cx - chipW / 2 - 20, y: chipY + 36, size: 22, anchor: 'middle', weight: 700, color: 'ink' }, g);
  const h1Flop = S.text('Compute: 989.4 TFLOP/s (16-bit)', { x: cx - chipW / 2 - 20, y: chipY + 80, size: 20, anchor: 'middle', weight: 600, color: 'compute' }, g);
  const h1Bw = S.text('Memory: 3.35 TB/s HBM3', { x: cx - chipW / 2 - 20, y: chipY + 120, size: 20, anchor: 'middle', weight: 700, color: 'bytes' }, g);
  const h1Tok = S.text('70B Model: 47.9 Tokens / Sec', { x: cx - chipW / 2 - 20, y: chipY + 175, size: 22, anchor: 'middle', weight: 700, color: 'ink' }, g);

  // H200 Card
  const h2Card = S.card({ x: cx + 20, y: chipY, w: chipW, h: chipH, tone: 'helps', title: '' }, g);
  const h2Title = S.text('H200 (MEMORY UPGRADE)', { x: cx + chipW / 2 + 20, y: chipY + 36, size: 22, anchor: 'middle', weight: 700, color: 'helps' }, g);
  const h2Flop = S.text('Compute: 989.4 TFLOP/s (Identical Die!)', { x: cx + chipW / 2 + 20, y: chipY + 80, size: 20, anchor: 'middle', weight: 600, color: 'compute' }, g);
  const h2Bw = S.text('Memory: 4.80 TB/s HBM3e (+43%)', { x: cx + chipW / 2 + 20, y: chipY + 120, size: 20, anchor: 'middle', weight: 700, color: 'helps' }, g);
  const h2Tok = S.text('70B Model: 68.6 Tokens / Sec (+43%)', { x: cx + chipW / 2 + 20, y: chipY + 175, size: 22, anchor: 'middle', weight: 700, color: 'helps' }, g);

  // Three attacks pill
  const footer = S.pill('PROOF: ZERO EXTRA COMPUTE YIELDS +43% SPEEDUP · INFERENCE IS MEMORY-BOUND', {
    x: cx, y: cy + h / 2 - 36, h: 42, tone: 'helps', size: 20, weight: 700
  }, g);

  return {
    group: g, card, title,
    h1Card, h1Title, h1Flop, h1Bw, h1Tok,
    h2Card, h2Title, h2Flop, h2Bw, h2Tok, footer
  };
}
