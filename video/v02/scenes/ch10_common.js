/* ch10_common.js · Shared visual components for Chapter 10 ("The first sin: divergence") */

/**
 * Creates a 32-lane warp display with individual lane blocks and execution states
 */
function ch10WarpLanes(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 480;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 360;

  // Outer container card
  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('32-LANE WARP LOCKSTEP EXECUTION', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const numLanes = 32;
  const laneW = 34;
  const laneGap = 5;
  const totalLanesW = numLanes * laneW + (numLanes - 1) * laneGap; // 1243px
  const startX = cx - totalLanesW / 2;
  const laneY = cy - 40;
  const laneH = 120;

  const lanes = [];

  for (let i = 0; i < numLanes; i++) {
    const lx = startX + i * (laneW + laneGap);
    const box = S.rect({
      x: lx, y: laneY, w: laneW, h: laneH, r: 6,
      fill: S.tone('struct', 0.15),
      stroke: S.tone('struct', 0.6),
      sw: 1.5
    }, g);

    // Only label key lanes or all lanes with clean 20px numbers
    // 2-digit numbers fit in 34px box
    const num = S.text(String(i), {
      x: lx + laneW / 2, y: laneY + 28, size: 20, anchor: 'middle',
      weight: 600, color: 'ink'
    }, g);

    // Indicator pill / state inside lane
    const stateRect = S.rect({
      x: lx + 4, y: laneY + 45, w: laneW - 8, h: 62, r: 4,
      fill: S.tone('struct', 0.3),
      stroke: 'transparent'
    }, g);

    lanes.push({ i, lx, box, num, stateRect });
  }

  // Branch condition headers (left 16: if (x > 0), right 16: else)
  const leftW = 16 * laneW + 15 * laneGap;
  const rightW = leftW;
  const leftX = startX;
  const rightX = startX + 16 * (laneW + laneGap);

  const ifHeader = S.text('TRUE: if (x > 0) [Lanes 0–15]', {
    x: leftX + leftW / 2, y: laneY - 14, size: 20, anchor: 'middle',
    weight: 700, color: 'compute'
  }, g);

  const elseHeader = S.text('FALSE: else [Lanes 16–31]', {
    x: rightX + rightW / 2, y: laneY - 14, size: 20, anchor: 'middle',
    weight: 700, color: 'violet'
  }, g);

  // Status badge at bottom of card
  const statusBadge = S.pill('1 INSTRUCTION DECODER · 32 LANES MUST SHARE OR WAIT', {
    x: cx, y: cy + h / 2 - 38, h: 42, tone: 'struct', size: 22, weight: 700
  }, g);

  return {
    group: g, card, title, lanes, ifHeader, elseHeader, statusBadge,
    startX, laneY, laneW, laneGap, leftX, rightX, leftW, rightW
  };
}

/**
 * Creates the active mask register view (32 bits)
 */
function ch10ActiveMask(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 420;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 280;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('HARDWARE ACTIVE MASK REGISTER (32-BIT)', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const numBits = 32;
  const bitW = 34;
  const bitGap = 5;
  const totalW = numBits * bitW + (numBits - 1) * bitGap;
  const startX = cx - totalW / 2;
  const bitY = cy - 25;
  const bitH = 68;

  const bits = [];

  for (let i = 0; i < numBits; i++) {
    const bx = startX + i * (bitW + bitGap);
    const isOne = i < 16;
    const box = S.rect({
      x: bx, y: bitY, w: bitW, h: bitH, r: 5,
      fill: isOne ? S.tone('compute', 0.2) : S.tone('muted', 0.1),
      stroke: isOne ? S.tone('compute', 0.8) : S.tone('muted', 0.4),
      sw: 1.5
    }, g);

    const val = S.text(isOne ? '1' : '0', {
      x: bx + bitW / 2, y: bitY + 44, size: 24, anchor: 'middle',
      weight: 700, color: isOne ? 'compute' : 'muted'
    }, g);

    bits.push({ i, box, val, isOne });
  }

  const maskExplain = S.text('1 = EXECUTE AND COMMIT RESULTS · 0 = MASKED OUT (DISCARD RESULTS)', {
    x: cx, y: cy + h / 2 - 32, size: 22, anchor: 'middle', weight: 600, color: 'muted'
  }, g);

  return { group: g, card, title, bits, maskExplain };
}

/**
 * Creates the nested branch penalty comparison chart
 */
function ch10NestedTree(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 730;
  const w = opts.w ?? 1360;
  const h = opts.h ?? 260;

  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('EXPONENTIAL PENALTY OF NESTED BRANCHES', {
    x: cx, y: cy - h / 2 + 32, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const rows = [
    { name: '1 Fork (Balanced)', passes: '2 Passes', eff: '50% Peak Efficiency', pct: 0.50, color: 'compute' },
    { name: '2 Nested Forks', passes: '4 Passes', eff: '25% Peak Efficiency', pct: 0.25, color: 'violet' },
    { name: '3 Nested Forks', passes: '8 Passes', eff: '12.5% Peak Efficiency', pct: 0.125, color: 'bytes' }
  ];

  const barX0 = cx - 180;
  const barMaxW = 460;
  const elements = [];

  rows.forEach((r, idx) => {
    const ry = cy - 40 + idx * 56;
    const barW = Math.round(barMaxW * r.pct);

    const lbl = S.text(r.name, {
      x: barX0 - 24, y: ry + 26, size: 22, anchor: 'end', weight: 700, color: 'ink'
    }, g);

    const bar = S.rect({
      x: barX0, y: ry, w: barW, h: 36, r: 6,
      fill: S.tone(r.color), stroke: S.tone(r.color), sw: 1
    }, g);

    const val = S.text(`${r.passes}  →  ${r.eff}`, {
      x: barX0 + barW + 18, y: ry + 26, size: 22, weight: 700, color: r.color
    }, g);

    elements.push({ lbl, bar, val });
  });

  return { group: g, card, title, elements };
}
