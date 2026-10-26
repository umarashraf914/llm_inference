/* ch07_common.js · Shared visual components for Chapter 7 ("Schedulers, the copy engine, four quarters") */

/**
 * Creates the full SM floor plan: 4 identical quarters side-by-side with central shared SRAM & TMA
 */
function ch07SmFloorPlan(S, opts = {}) {
  const g = S.g(null, opts.parent);
  const cx = opts.cx ?? 960;
  const cy = opts.cy ?? 510;
  const w = opts.w ?? 1280;
  const h = opts.h ?? 540;

  // Outer SM boundary card
  const card = S.card({
    x: cx - w / 2, y: cy - h / 2, w, h,
    tone: 'neutral', title: ''
  }, g);

  const title = S.text('HOPPER STREAMING MULTIPROCESSOR (SM) · FOUR IDENTICAL QUARTERS', {
    x: cx, y: cy - h / 2 + 36, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  }, g);

  // 4 Quarters side-by-side: Q0, Q1, Q2, Q3
  const qW = 270, qH = 340;
  const qGap = 16;
  const qX0 = cx - (4 * qW + 3 * qGap) / 2;
  const qY = cy - 65;

  const quarters = [];
  for (let i = 0; i < 4; i++) {
    const qx = qX0 + i * (qW + qGap);
    const qg = S.g(null, g);

    const qCard = S.card({
      x: qx, y: qY, w: qW, h: qH,
      tone: i === 0 ? 'struct' : 'neutral', title: ''
    }, qg);

    const qHeader = S.text(`QUARTER ${i + 1}`, {
      x: qx + qW / 2, y: qY + 30, size: 22, anchor: 'middle', weight: 700,
      color: i === 0 ? 'struct' : 'ink'
    }, qg);

    // Quarter contents:
    // 1. Scheduler
    const schedPill = S.pill('1 Warp Scheduler', {
      x: qx + qW / 2, y: qY + 68, h: 36, tone: 'helps', size: 20, weight: 700
    }, qg);
    schedPill.setAttribute('data-audit', 'ignore');

    // 2. 16,384 Registers (64 KB)
    const regBox = S.rect({
      x: qx + 15, y: qY + 98, w: qW - 30, h: 48, r: 6,
      fill: '#15243d', stroke: S.tone('struct'), sw: 1
    }, qg);
    regBox.setAttribute('data-audit', 'ignore');
    const regLbl = S.text('16,384 Regs (64 KB)', {
      x: qx + qW / 2, y: qY + 128, size: 20, anchor: 'middle', color: 'struct', weight: 600
    }, qg);
    regLbl.setAttribute('data-audit', 'ignore');

    // 3. 32 FP32 CUDA Lanes
    const lanesBox = S.rect({
      x: qx + 15, y: qY + 158, w: qW - 30, h: 68, r: 6,
      fill: '#241a0d', stroke: S.tone('compute'), sw: 1
    }, qg);
    lanesBox.setAttribute('data-audit', 'ignore');
    const lanesLbl = S.text('32 CUDA Lanes (FP32)', {
      x: qx + qW / 2, y: qY + 198, size: 20, anchor: 'middle', color: 'compute', weight: 700
    }, qg);
    lanesLbl.setAttribute('data-audit', 'ignore');

    // 4. 1 Tensor Core
    const tcBox = S.rect({
      x: qx + 15, y: qY + 238, w: qW - 30, h: 80, r: 6,
      fill: '#241a0d', stroke: S.tone('compute'), sw: 1.5
    }, qg);
    tcBox.setAttribute('data-audit', 'ignore');
    const tcLbl = S.text('1 Tensor Core', {
      x: qx + qW / 2, y: qY + 284, size: 22, anchor: 'middle', color: 'compute', weight: 700
    }, qg);

    quarters.push({ group: qg, card: qCard, header: qHeader, tcLbl });
  }

  // Central bottom block: 256 KB Shared SRAM & TMA Engine (spans across all 4 quarters)
  const botY = qY + qH + 16;
  const botH = 75;
  const botCard = S.card({
    x: qX0, y: botY, w: 4 * qW + 3 * qGap, h: botH,
    tone: 'helps', title: ''
  }, g);

  const sramText = S.text('256 KB SHARED SRAM SCRATCHPAD  &  TMA HARDWARE COPY ENGINE', {
    x: cx, y: botY + 44, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  }, g);

  return { group: g, card, title, quarters, botCard, sramText };
}
