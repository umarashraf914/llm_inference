/* ch15_common.js · Visual components for Chapter 15 ("The memory wall")
   Figs 76, 77, 78, 79, 80, 81, 82, 83 from atlas:
   - ch15GenTimeline: Four GPU generations (V100 -> A100 -> H100 -> B200) & diverging curves (Figs 76, 77, 78)
   - ch15WireScales: Three connection scales across distance (package -> board -> cable) (Fig 79)
   - ch15NarrowRidge: Narrow precision 8.1× ridge acceleration (139 -> 153 -> 590 -> 1,125 op/B) (Fig 80)
   - ch15H200Proof: H100 vs H200 controlled experiment proof (+43% bandwidth = +43% tokens) (Figs 81, 82, 83)
*/

/**
 * Creates the four-generation scaling timeline (Atlas Figs 76, 77, 78)
 */
function ch15GenTimeline(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('seven years of gpu architectures · the widening memory wall', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const gens = [
    { name: 'v100 (2017)', proc: '12 nm process', flop: '125 tflop/s', bw: '0.9 tb/s', ridge: '139 op/b', tone: 'helps' },
    { name: 'a100 (2020)', proc: '7 nm process', flop: '312 tflop/s', bw: '2.0 tb/s', ridge: '153 op/b', tone: 'helps' },
    { name: 'h100 (2022)', proc: '4 nm process', flop: '989 tflop/s', bw: '3.35 tb/s', ridge: '295 op/b', tone: 'compute' },
    { name: 'b200 (2024)', proc: '4np process', flop: '2,250 tflop/s', bw: '8.0 tb/s', ridge: '281 op/b', tone: 'bytes' }
  ];

  const colW = 295;
  const colGap = 20;
  const startX = cx - (4 * colW + 3 * colGap) / 2;
  const colY = cy - 145;
  const colH = 250;

  const colEls = [];
  gens.forEach((gn, idx) => {
    const lx = startX + idx * (colW + colGap);
    const bc = S.rect({
      x: lx, y: colY, w: colW, h: colH, r: 10,
      fill: '#151c2e', stroke: S.tone(gn.tone), sw: 1.5
    }, g);

    const gnText = S.text(gn.name, {
      x: lx + colW / 2, y: colY + 36, size: 22, anchor: 'middle', weight: 700, color: 'ink'
    }, g);

    const procText = S.text(gn.proc, {
      x: lx + colW / 2, y: colY + 68, size: 20, anchor: 'middle', weight: 600, color: 'muted'
    }, g);
    procText.setAttribute('data-audit', 'ignore');

    const flopBox = S.rect({
      x: lx + 15, y: colY + 92, w: colW - 30, h: 48, r: 6,
      fill: '#241a14', stroke: S.tone('compute'), sw: 1
    }, g);
    const flopVal = S.text(gn.flop, {
      x: lx + colW / 2, y: colY + 122, size: 20, anchor: 'middle', weight: 700, color: 'compute'
    }, g);

    const bwBox = S.rect({
      x: lx + 15, y: colY + 148, w: colW - 30, h: 48, r: 6,
      fill: '#291418', stroke: S.tone('bytes'), sw: 1
    }, g);
    const bwVal = S.text(gn.bw, {
      x: lx + colW / 2, y: colY + 178, size: 20, anchor: 'middle', weight: 700, color: 'bytes'
    }, g);

    const ridgeVal = S.text(`ridge: ${gn.ridge}`, {
      x: lx + colW / 2, y: colY + 224, size: 20, anchor: 'middle', weight: 700, color: 'struct'
    }, g);

    colEls.push({ bc, gnText, procText, flopBox, flopVal, bwBox, bwVal, ridgeVal });
  });

  const footer = S.pill('compute grew 18× while bandwidth grew only 9× · ridge doubled to ~300 op/b', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'bytes', size: 20, weight: 700, style: 'solid'
  }, g);

  return { group: g, bg, title, colEls, footer };
}

/**
 * Creates the Wire vs Transistor Physical Constraints Visual (Atlas Fig 79)
 */
function ch15WireScales(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('why wires cannot keep pace with shrinking transistors', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const scales = [
    {
      title: 'on package (interposer)',
      dist: 'distance: millimetres',
      wires: '~1,024 parallel wires',
      desc: 'microscopic microbumps connect hbm die',
      tone: 'helps'
    },
    {
      title: 'across board (pcb)',
      dist: 'distance: centimetres',
      wires: '~64 copper traces',
      desc: 'copper traces crowd board layers',
      tone: 'compute'
    },
    {
      title: 'across room (cable)',
      dist: 'distance: metres',
      wires: '4 high-speed pairs',
      desc: 'serial transceiver differential links',
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
    const bc = S.rect({
      x: lx, y: colY, w: colW, h: colH, r: 10,
      fill: '#151c2e', stroke: S.tone(s.tone), sw: 1.5
    }, g);

    const st = S.text(s.title, {
      x: lx + colW / 2, y: colY + 36, size: 20, anchor: 'middle', weight: 700, color: s.tone
    }, g);

    const sd = S.text(s.dist, {
      x: lx + colW / 2, y: colY + 76, size: 20, anchor: 'middle', weight: 600, color: 'ink'
    }, g);

    const sw = S.text(s.wires, {
      x: lx + colW / 2, y: colY + 128, size: 24, anchor: 'middle', weight: 700, color: s.tone
    }, g);

    const sDesc = S.text(s.desc, {
      x: lx + colW / 2, y: colY + 185, size: 20, anchor: 'middle', weight: 600, color: 'muted'
    }, g);
    sDesc.setAttribute('data-audit', 'ignore');

    scaleEls.push({ bc, st, sd, sw, sDesc });
  });

  const footer = S.pill('lithography shrinks transistors · physical geometry caps wires', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'struct', size: 20, weight: 700, style: 'solid'
  }, g);

  return { group: g, bg, title, scaleEls, footer };
}

/**
 * Creates the Narrow Precision Ridge Climb Visual (Atlas Fig 80)
 */
function ch15NarrowRidge(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('narrow precision and the 8-fold ridge acceleration', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const formats = [
    { gen: 'v100 (2017)', fmt: 'fp16 (16-bit)', ridge: '139 op/b', ratio: '1.0× baseline', tone: 'helps', wPct: 0.12 },
    { gen: 'a100 (2020)', fmt: 'bf16 (16-bit)', ridge: '153 op/b', ratio: '1.1× baseline', tone: 'helps', wPct: 0.14 },
    { gen: 'h100 (2022)', fmt: 'fp8 (8-bit)', ridge: '590 op/b', ratio: '4.2× surge', tone: 'compute', wPct: 0.52 },
    { gen: 'b200 (2024)', fmt: 'fp4 (4-bit)', ridge: '1,125 op/b', ratio: '8.1× climb', tone: 'bytes', wPct: 1.00 }
  ];

  const rowX0 = cx - 580;
  const rowW = 1160;
  const startY = cy - 150;
  const rowEls = [];

  formats.forEach((f, idx) => {
    const ry = startY + idx * 65;
    const rc = S.rect({
      x: rowX0, y: ry, w: rowW, h: 56, r: 6,
      fill: '#151c2e', stroke: S.tone(f.tone), sw: 1.5
    }, g);

    const fg = S.text(f.gen, {
      x: rowX0 + 24, y: ry + 36, size: 20, weight: 700, color: 'ink'
    }, g);

    const ff = S.text(f.fmt, {
      x: rowX0 + 280, y: ry + 36, size: 20, weight: 600, color: 'ink'
    }, g);

    const fr = S.text(f.ridge, {
      x: rowX0 + 560, y: ry + 36, size: 20, weight: 700, color: f.tone
    }, g);

    const fa = S.text(f.ratio, {
      x: rowX0 + rowW - 24, y: ry + 36, size: 20, anchor: 'end', weight: 700, color: f.tone
    }, g);

    rowEls.push({ rc, fg, ff, fr, fa });
  });

  const footer = S.pill('halving bits doubles compute on same silicon · ridge reaches 1,125 op/byte', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'bytes', size: 20, weight: 700, style: 'solid'
  }, g);

  return { group: g, bg, title, rowEls, footer };
}

/**
 * Creates the H100 vs H200 Controlled Experiment Proof (Atlas Figs 81, 82, 83)
 */
function ch15H200Proof(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 500;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 480;

  const bg = S.rect({
    x: cx - w / 2, y: cy - h / 2, w, h, r: 14,
    fill: '#0f1422', stroke: '#222f48', sw: 1.5
  }, g);

  const title = S.text('the controlled experiment · h100 vs h200 inference proof', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const chipW = 590;
  const chipH = 240;
  const chipY = cy - 150;

  // H100 Card
  const h1Card = S.rect({
    x: cx - chipW - 20, y: chipY, w: chipW, h: chipH, r: 10,
    fill: '#151c2e', stroke: S.tone('struct'), sw: 1.5
  }, g);
  const h1Title = S.text('h100 (standard)', {
    x: cx - chipW / 2 - 20, y: chipY + 38, size: 22, anchor: 'middle', weight: 700, color: 'struct'
  }, g);
  const h1Flop = S.text('compute: 989.4 tflop/s (16-bit)', {
    x: cx - chipW / 2 - 20, y: chipY + 85, size: 20, anchor: 'middle', weight: 600, color: 'compute'
  }, g);
  const h1Bw = S.text('memory: 3.35 tb/s hbm3', {
    x: cx - chipW / 2 - 20, y: chipY + 128, size: 20, anchor: 'middle', weight: 700, color: 'bytes'
  }, g);
  const h1Tok = S.text('70b model: 47.9 tokens / sec', {
    x: cx - chipW / 2 - 20, y: chipY + 185, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // H200 Card
  const h2Card = S.rect({
    x: cx + 20, y: chipY, w: chipW, h: chipH, r: 10,
    fill: '#101c18', stroke: S.tone('helps'), sw: 1.5
  }, g);
  const h2Title = S.text('h200 (memory upgrade)', {
    x: cx + chipW / 2 + 20, y: chipY + 38, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const h2Flop = S.text('compute: 989.4 tflop/s (identical die!)', {
    x: cx + chipW / 2 + 20, y: chipY + 85, size: 20, anchor: 'middle', weight: 600, color: 'compute'
  }, g);
  const h2Bw = S.text('memory: 4.80 tb/s hbm3e (+43%)', {
    x: cx + chipW / 2 + 20, y: chipY + 128, size: 20, anchor: 'middle', weight: 700, color: 'helps'
  }, g);
  const h2Tok = S.text('70b model: 68.6 tokens / sec (+43%)', {
    x: cx + chipW / 2 + 20, y: chipY + 185, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  // Three attacks pill
  const footer = S.pill('zero extra arithmetic yields +43% speedup · inference is bandwidth-bound', {
    x: cx, y: cy + h / 2 - 28, h: 42, tone: 'helps', size: 20, weight: 700, style: 'solid'
  }, g);

  return {
    group: g, bg, title,
    h1Card, h1Title, h1Flop, h1Bw, h1Tok,
    h2Card, h2Title, h2Flop, h2Bw, h2Tok, footer
  };
}
