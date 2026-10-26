/* Shared builders for chapter 1 (Inside the GPU). Loaded before every ch01 scene. */

/**
 * The physical GPU package (Fig 1):
 * - Outer package carrier substrate with mounting fixtures
 * - Central compute die (29mm × 29mm, 814 mm², 80B transistors)
 * - 5 active HBM3 memory stacks flanking the die with high-density interposer buses
 * - 132 multiprocessor sub-grid and 1 mm² density callout
 */
function ch01Package(S, o = {}) {
  const g = o.parent || S.g();
  const cx = o.cx ?? 960, cy = o.cy ?? 530;
  const pw = o.pw ?? 780, ph = o.ph ?? 680;
  const dieSize = o.dieSize ?? 340; // represents 29mm × 29mm (814 mm²)

  // Outer metal package carrier
  const pkg = S.g(null, g);
  const base = S.rect({
    x: cx - pw / 2, y: cy - ph / 2, w: pw, h: ph, r: 24,
    fill: '#080d1a', stroke: '#22304e', sw: 3
  }, pkg);

  // Corner mounting fixtures / screws
  const screwR = 14;
  const cornerOffsets = [
    [-pw / 2 + 32, -ph / 2 + 32],
    [pw / 2 - 32, -ph / 2 + 32],
    [-pw / 2 + 32, ph / 2 - 32],
    [pw / 2 - 32, ph / 2 - 32]
  ];
  const screws = cornerOffsets.map(([dx, dy]) => {
    const sc = S.g(null, pkg);
    S.circle({ x: cx + dx, y: cy + dy, r: screwR, fill: '#141e33', stroke: '#3a4e75', sw: 2 }, sc);
    S.line({ x1: cx + dx - 7, y1: cy + dy, x2: cx + dx + 7, y2: cy + dy, stroke: '#566e99', sw: 2 }, sc);
    S.line({ x1: cx + dx, y1: cy + dy - 7, x2: cx + dx, y2: cy + dy + 7, stroke: '#566e99', sw: 2 }, sc);
    return sc;
  });

  // Silicon substrate interposer carrier
  const subW = pw - 120, subH = ph - 120;
  const interposer = S.rect({
    x: cx - subW / 2, y: cy - subH / 2, w: subW, h: subH, r: 14,
    fill: '#0f172a', stroke: '#33476d', sw: 2
  }, pkg);

  // Central compute die
  const die = S.g(null, g);
  const dieBg = S.rect({
    x: cx - dieSize / 2, y: cy - dieSize / 2, w: dieSize, h: dieSize, r: 8,
    fill: 'url(#card-compute)', stroke: S.tone('compute'), sw: 3
  }, die);

  // Micro-texture lines inside the compute die
  const gridLines = S.g(null, die);
  for (let i = 1; i < 8; i++) {
    const offset = (dieSize / 8) * i;
    S.line({
      x1: cx - dieSize / 2 + offset, y1: cy - dieSize / 2 + 4,
      x2: cx - dieSize / 2 + offset, y2: cy + dieSize / 2 - 4,
      stroke: S.tone('compute'), sw: 1, strokeOpacity: 0.18
    }, gridLines);
    S.line({
      x1: cx - dieSize / 2 + 4, y1: cy - dieSize / 2 + offset,
      x2: cx + dieSize / 2 - 4, y2: cy - dieSize / 2 + offset,
      stroke: S.tone('compute'), sw: 1, strokeOpacity: 0.18
    }, gridLines);
  }

  // 132 SM layout (12 columns × 11 rows) for the b5 silicon budget breakdown
  const smGrid = S.g(null, die);
  const smCols = 12, smRows = 11;
  const smW = (dieSize - 36) / smCols - 2.5;
  const smH = (dieSize - 36) / smRows - 2.5;
  const smCells = [];
  for (let r = 0; r < smRows; r++) {
    for (let c = 0; c < smCols; c++) {
      const sx = cx - dieSize / 2 + 18 + c * (smW + 2.5);
      const sy = cy - dieSize / 2 + 18 + r * (smH + 2.5);
      const cell = S.rect({
        x: sx, y: sy, w: smW, h: smH, r: 2,
        fill: S.tone('compute'), fillOpacity: 0.35, stroke: S.tone('compute'), sw: 1, strokeOpacity: 0.8
      }, smGrid);
      smCells.push(cell);
    }
  }
  smGrid.setAttribute('opacity', 0); // hidden initially

  // Die center label
  const dieLabel = S.text('COMPUTE DIE', {
    x: cx, y: cy - 18, size: 26, anchor: 'middle', weight: 700, family: 'mono', color: 'compute'
  }, die);
  const dieSub = S.text('814 mm² · 80B switches', {
    x: cx, y: cy + 22, size: 26, anchor: 'middle', weight: 500, family: 'sans', color: 'ink'
  }, die);

  // 5 Active HBM3 Memory Stacks (3 on left, 2 on right + 1 placeholder slot)
  const stackW = 92, stackH = 120;
  const stackSpacing = 140;
  const stackCoords = [
    // Left side: 3 stacks
    { x: cx - dieSize / 2 - stackW - 32, y: cy - stackSpacing },
    { x: cx - dieSize / 2 - stackW - 32, y: cy },
    { x: cx - dieSize / 2 - stackW - 32, y: cy + stackSpacing },
    // Right side: 2 active stacks + 1 placeholder
    { x: cx + dieSize / 2 + 32, y: cy - stackSpacing },
    { x: cx + dieSize / 2 + 32, y: cy },
  ];

  const stacksGroup = S.g(null, g);
  const stacks = stackCoords.map((pos, i) => {
    const sg = S.g(null, stacksGroup);
    // Micro-bump copper bus connecting memory stack to compute die
    const busLine = S.line({
      x1: pos.x < cx ? pos.x + stackW : pos.x,
      y1: pos.y,
      x2: pos.x < cx ? cx - dieSize / 2 : cx + dieSize / 2,
      y2: pos.y,
      stroke: S.tone('bytes'), sw: 6, strokeOpacity: 0.6, dash: '4 3'
    }, sg);

    const sRect = S.rect({
      x: pos.x, y: pos.y - stackH / 2, w: stackW, h: stackH, r: 8,
      fill: 'url(#card-bytes)', stroke: S.tone('bytes'), sw: 2.5
    }, sg);
    const sTag = S.text('HBM3', {
      x: pos.x + stackW / 2, y: pos.y - 14, size: 22, anchor: 'middle', weight: 700, family: 'mono', color: 'bytes'
    }, sg);
    const sSub = S.text('16 GB', {
      x: pos.x + stackW / 2, y: pos.y + 18, size: 22, anchor: 'middle', weight: 600, family: 'sans', color: 'ink'
    }, sg);
    return { g: sg, rect: sRect, tag: sTag, sub: sSub, bus: busLine, cx: pos.x + stackW / 2, cy: pos.y };
  });

  return {
    g, pkg, base, interposer, screws,
    die, dieBg, gridLines, dieLabel, dieSub, smGrid, smCells,
    stacksGroup, stacks,
    cx, cy, pw, ph, dieSize
  };
}

/**
 * A schematic transistor switch (Fig 2):
 * - Source terminal (left) and drain terminal (right)
 * - Channel and gate electrode (top)
 * - Moveable conductive switch arm that snaps open (0) or closed (1)
 * - Current pulse indicators
 */
function ch01Transistor(S, o = {}) {
  const g = o.parent || S.g();
  const cx = o.cx ?? 960, cy = o.cy ?? 520;
  const w = 500, h = 330;

  // Background schematic card with custom header text
  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'struct', title: ''
  }, g);
  const cardTitle = S.text('FIELD-EFFECT TRANSISTOR', {
    x: cx, y: cy - h / 2 + 32, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // Terminals: Source (left) and Drain (right)
  const sourceLine = S.line({
    x1: cx - 180, y1: cy + 40, x2: cx - 60, y2: cy + 40,
    stroke: S.tone('struct'), sw: 6
  }, g);
  const drainLine = S.line({
    x1: cx + 60, y1: cy + 40, x2: cx + 180, y2: cy + 40,
    stroke: S.tone('struct'), sw: 6
  }, g);

  const sContact = S.circle({ x: cx - 60, y: cy + 40, r: 8, fill: S.tone('struct') }, g);
  const dContact = S.circle({ x: cx + 60, y: cy + 40, r: 8, fill: S.tone('struct') }, g);

  const sourceLabel = S.text('Source', { x: cx - 140, y: cy + 76, size: 22, anchor: 'middle', color: 'muted', weight: 600 }, g);
  const drainLabel = S.text('Drain', { x: cx + 140, y: cy + 76, size: 22, anchor: 'middle', color: 'muted', weight: 600 }, g);

  // Gate electrode (top) - well below header text
  const gateLine = S.line({
    x1: cx, y1: cy - 35, x2: cx, y2: cy - 10,
    stroke: S.tone('compute'), sw: 6
  }, g);
  const gatePlate = S.rect({
    x: cx - 50, y: cy - 10, w: 100, h: 14, r: 3,
    fill: S.tone('compute'), stroke: S.tone('compute'), sw: 1
  }, g);
  const gateLabel = S.text('Gate (Control)', { x: cx, y: cy - 54, size: 22, anchor: 'middle', color: 'compute', weight: 700 }, g);

  // Moveable switch arm / channel
  const switchArm = S.line({
    x1: cx - 60, y1: cy + 40, x2: cx + 55, y2: cy + 12,
    stroke: S.tone('violet'), sw: 6, strokeLinecap: 'round'
  }, g);

  // Status badges: 0 · off vs 1 · on
  const badgeOff = S.pill('0 · OFF (blocking)', {
    x: cx, y: cy + 115, h: 42, tone: 'violet', size: 22, weight: 650
  }, g);
  const badgeOn = S.pill('1 · ON (conducting)', {
    x: cx, y: cy + 115, h: 42, tone: 'helps', size: 22, weight: 650
  }, g);
  S.set(badgeOn, { autoAlpha: 0 });

  return {
    g, card, sourceLine, drainLine, sContact, dContact,
    sourceLabel, drainLabel, gateLine, gatePlate, gateLabel,
    switchArm, badgeOff, badgeOn, cx, cy
  };
}
