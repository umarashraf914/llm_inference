/* ch08_common.js · Shared visual components for Chapter 8 ("Warps and kernels") */

/**
 * Creates a 32-lane warp visualization with single instruction broadcast
 */
function ch08WarpLanes(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 530;
  const w = opts.w ?? 1260;
  const h = opts.h ?? 380;

  // Background card
  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'struct', title: ''
  }, g);

  const title = S.text('ONE WARP = 32 THREADS MOVING IN LOCKSTEP', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'struct'
  }, g);

  // Single Instruction Broadcast Packet at top
  const instCard = S.card({
    x: cx - 220, y: cy - 105, w: 440, h: 60,
    tone: 'compute', title: ''
  }, g);
  const instText = S.text('INSTRUCTION: c[i] = a[i] + b[i]', {
    x: cx, y: cy - 70, size: 22, anchor: 'middle', family: 'mono', weight: 700, color: 'compute'
  }, g);

  // 32 Parallel Lanes
  const numLanes = 32;
  const lW = 28, lH = 150, lGap = 9;
  const lX0 = cx - (numLanes * lW + (numLanes - 1) * lGap) / 2;
  const lY = cy - 10;

  const lanes = [];
  for (let i = 0; i < numLanes; i++) {
    const lx = lX0 + i * (lW + lGap);
    const box = S.rect({
      x: lx, y: lY, w: lW, h: lH, r: 5,
      fill: '#15243d', stroke: S.tone('struct'), sw: 1.5
    }, g);
    box.setAttribute('data-audit', 'ignore');

    const num = S.text(`${i}`, {
      x: lx + lW / 2, y: lY + 28, size: 20, anchor: 'middle', color: 'muted'
    }, g);
    num.setAttribute('data-audit', 'ignore');

    const reg = S.rect({
      x: lx + 4, y: lY + 50, w: lW - 8, h: 42, r: 3,
      fill: S.tone('compute'), stroke: S.tone('compute'), sw: 1
    }, g);
    reg.setAttribute('data-audit', 'ignore');

    lanes.push({ box, num, reg });
  }

  // Bracket grouping the 32 lanes
  const warpPill = S.pill('SIMT: Single Instruction, Multiple Threads (32 Lanes)', {
    x: cx, y: cy + 185, h: 42, tone: 'struct', size: 22, weight: 700
  }, g);

  return { group: g, card, title, instCard, instText, lanes, warpPill };
}
