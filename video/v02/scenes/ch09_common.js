/* ch09_common.js · Shared visual components for Chapter 9 ("Filling a multiprocessor") */

/**
 * Creates the Little's Law bar chart comparing required memory in flight vs supplied by threads
 */
function ch09LittlesLawBars(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 520;
  const w = opts.w ?? 1240;
  const h = opts.h ?? 380;

  // Background card
  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text("LITTLE'S LAW PER MULTIPROCESSOR: BYTES IN FLIGHT TO SATURATE HBM", {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  const barX0 = cx - 280;
  const barAreaW = 560;
  const maxB = 10000;

  // Row 1: Required bytes to saturate bus (6,933 B)
  const r1Y = cy - 40;
  const r1W = Math.round((6933 / maxB) * barAreaW); // ~388px
  const r1Lbl = S.text('Required to saturate bus:', { x: barX0 - 24, y: r1Y + 28, size: 22, anchor: 'end', color: 'bytes', weight: 700 }, g);
  const r1Bar = S.rect({ x: barX0, y: r1Y, w: r1W, h: 42, r: 6, fill: S.tone('bytes'), stroke: S.tone('bytes'), sw: 1 }, g);
  const r1Val = S.text('6,933 Bytes (915 KB ÷ 132 SMs)', { x: barX0 + r1W + 18, y: r1Y + 28, size: 22, color: 'bytes', weight: 700 }, g);

  // Row 2: Supplied by 2,048 resident threads with one 4-byte read (8,192 B)
  const r2Y = cy + 45;
  const r2W = Math.round((8192 / maxB) * barAreaW); // ~459px
  const r2Lbl = S.text('Supplied by 2,048 threads:', { x: barX0 - 24, y: r2Y + 28, size: 22, anchor: 'end', color: 'helps', weight: 700 }, g);
  const r2Bar = S.rect({ x: barX0, y: r2Y, w: r2W, h: 42, r: 6, fill: S.tone('helps'), stroke: S.tone('helps'), sw: 1 }, g);
  const r2Val = S.text('8,192 Bytes (2,048 × 4 B = 1.18×)', { x: barX0 + r2W + 18, y: r2Y + 28, size: 22, color: 'helps', weight: 700 }, g);

  // Saturation badge below
  const satBadge = S.pill('100% OCCUPANCY SUPPLIES 1.18× SATURATION: MEMORY RUNS AT FULL SPEED', {
    x: cx, y: cy + 130, h: 42, tone: 'helps', size: 22, weight: 700
  }, g);

  return { group: g, card, title, r1Lbl, r1Bar, r1Val, r2Lbl, r2Bar, r2Val, satBadge };
}
