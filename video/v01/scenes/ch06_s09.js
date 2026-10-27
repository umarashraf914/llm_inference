/* ch06_s09 · the two specifications that matter (fig 77)
   b1  two cards: amber 'Compute throughput' (operations per second), coral 'Memory bandwidth' (bytes per
       second, off-chip memory → chip); a coral arrow fetches into the amber card, an amber loop multiplies.
   b2  'one token · H100 · if it fitted'; a 0-45 ms axis at 30 px per ms; the amber lane is a 4 px sliver
       (≈ 0.14 ms); the coral lane grows 1,254 px to 41.8 ms, 'moving the weights' riding on it.
   b3  the coral lane splits into slices of weight tiles; a playhead fetches them in turn and each slice's
       arithmetic lands as a tiny amber tick behind it; 'token done ≈ 42 ms'; the amber card idles; a ghost
       average at 21 ms (630 px) is struck out.
   b4  the lanes fade; 'which runs out first?'.
   Checks: 140e9 / 989e12 = 0.142 ms → 4.2 px; 140 GB / 3.35 TB/s = 41.8 ms → 1,254 px; mean 21.0 ms → 630 px.
   Layout: cards x 180-820 and 1100-1740, y 130-390; lanes y 600 and 700 from x 285; axis y 790 (285-1635). */
V.scene('ch06_s09', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = n => gsap.parseEase(n);
  const eO2 = E('power2.out'), eIO2 = E('power2.inOut');
  const ignoreIn = (els, a, b) => ch06Clock(S, a, b, t => els.forEach(e => (t > a && t < b ? e.setAttribute('data-audit', 'ignore') : e.removeAttribute('data-audit'))));
  const PXMS = 30, AX0 = 285, X = ms => AX0 + PXMS * ms;
  const MS_A = 140e9 / 989e12 * 1000, MS_M = 140 / 3.35;          // 0.1416 ms, 41.79 ms

  // ================================================================ b1: the two cards
  // the cards and what sits on them (topG) are centred while they are alone (b1, TY1 lower), move up for the
  // lanes (b2-b3), and come down again over the question (b4, TY4 lower); every line centred in its card
  const CW = 640, CH = 260, CY = 130, CXA = 180, CXM = 1100, CA = CXA + CW / 2, CM = CXM + CW / 2;
  const TY1 = 280, TY4 = 189, topG = S.g();
  S.set(topG, { y: TY1 }, 0);
  S.add(gsap.fromTo(topG, { y: TY1 }, { y: 0, duration: 0.6, ease: 'power2.inOut', immediateRender: false }), T('b2') - 0.6);
  const cardA = S.g(null, topG), cardM = S.g(null, topG);
  S.card({ x: CXA, y: CY, w: CW, h: CH, tone: 'compute', r: 26 }, cardA);
  S.text('Compute throughput', { x: CA, y: CY + 82, size: 44, weight: 700, family: 'display', anchor: 'middle', color: 'compute' }, cardA);
  S.text('operations per second', { x: CA, y: CY + 132, size: 30, weight: 550, anchor: 'middle', color: 'ink' }, cardA);
  S.card({ x: CXM, y: CY, w: CW, h: CH, tone: 'bytes', r: 26 }, cardM);
  S.text('Memory bandwidth', { x: CM, y: CY + 82, size: 44, weight: 700, family: 'display', anchor: 'middle', color: 'bytes' }, cardM);
  S.text('bytes per second', { x: CM, y: CY + 132, size: 30, weight: 550, anchor: 'middle', color: 'ink' }, cardM);
  S.text('off-chip memory → chip', { x: CM, y: CY + 180, size: 28, weight: 550, anchor: 'middle', color: 'muted' }, cardM);
  S.add(fx.in(cardA, { from: 'scale', d: 0.6, scale: 0.86 }), 'b1~compute-0.15');
  S.add(fx.in(cardM, { from: 'scale', d: 0.6, scale: 0.86 }), 'b1~memory-0.15');
  // 'fetch': a coral arrow from the bandwidth card into the compute card; 'multiply': an amber loop
  // through the cards' middle: the arrow joins the two cards, not their bottom rows
  const fetch = S.arrow({ x1: CXM - 14, y1: CY + CH / 2, x2: CXA + CW + 14, y2: CY + CH / 2, color: 'bytes', sw: 5, head: 18 }, topG);
  S.set(fetch, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(fetch, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1, immediateRender: false }), 'b1~fetch-0.1');
  S.add(fx.drawArrow(fetch, { d: 0.5 }), 'b1~fetch-0.1');
  // the loop sits under the card's lines and stays until 'idle' takes its place (b3)
  const loopG = S.g(null, topG), loopIn = S.g(null, loopG), LPY = CY + 196;
  S.icon('ph:arrows-clockwise-bold', { x: CA, y: LPY, size: 64, color: 'compute' }, loopIn);
  S.set(loopG, { autoAlpha: 0 }, 0);
  S.add(fx.in(loopG, { from: 'fade', d: 0.3 }), 'b1~multiply-0.1');
  S.add(gsap.fromTo(loopIn, { rotation: 0, svgOrigin: `${CA} ${LPY}` }, { rotation: 360, svgOrigin: `${CA} ${LPY}`, duration: 1.0, ease: 'power2.inOut', immediateRender: false }), 'b1~multiply');

  // ================================================================ b2: one token, drawn to scale
  const lanes = S.g();
  const what = S.text('one token · H100 · if it fitted', { x: 960, y: 486, size: 28, weight: 600, anchor: 'middle', color: 'muted' }, lanes);
  S.set(what, { autoAlpha: 0 }, 0);
  S.add(fx.in(what, { from: 'fade', d: 0.45 }), 'b2~Pretend-0.1');
  S.add(gsap.to(fetch, { autoAlpha: 0, duration: 0.4 }), 'b2~Pretend');
  // the axis, 0-45 ms
  const AY = 790;
  const axis = S.g(null, lanes);
  const axLine = S.line({ x1: AX0, y1: AY, x2: X(45), y2: AY, stroke: 'ink', strokeOpacity: 0.6, sw: 2.5 }, axis);
  for (let ms = 0; ms <= 45; ms += 5) {
    S.line({ x1: X(ms), y1: AY, x2: X(ms), y2: AY + 12, stroke: 'ink', strokeOpacity: 0.6, sw: 2 }, axis);
    S.text(ms === 45 ? '45 ms' : String(ms), { x: X(ms), y: AY + 34, size: 22, weight: 550, anchor: 'middle', family: 'mono', color: 'muted' }, axis);
  }
  S.set(axis, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(axis, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, immediateRender: false }), 'b2~model-0.1');
  S.add(fx.draw(axLine, { d: 0.8 }), 'b2~model-0.1');
  // lane names
  const LA = 600, LM = 700, LH = 40;
  const nameA = S.text('arithmetic', { x: AX0 - 22, y: LA, size: 26, weight: 600, anchor: 'end', color: 'compute' }, lanes);
  const nameM = S.text('reading', { x: AX0 - 22, y: LM, size: 26, weight: 600, anchor: 'end', color: 'bytes' }, lanes);
  [nameA, nameM].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  // the amber lane: a sliver
  const sliver = S.rect({ x: AX0, y: LA - LH / 2, w: PXMS * MS_A, h: LH, fill: 'compute' }, lanes);
  const lblA = S.text('140 billion ops ÷ 989 trillion/s ≈ 0.14 ms', { x: AX0 + 24, y: LA, size: 28, weight: 650, color: 'compute' }, lanes);
  const wA = S.measure('140 billion ops ÷ 989 trillion/s ≈ 0.14 ms', { size: 28, weight: 650 });
  const rounded = S.text('rounded earlier: ≈ 0.1 ms', { x: AX0 + 24 + wA + 24, y: LA + 1, size: 22, weight: 550, color: 'faint' }, lanes);
  [sliver, lblA, rounded].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  const tA = T('b2~seventh') - 0.1;
  S.add(fx.in([nameA, sliver], { from: 'fade', d: 0.35 }), tA);
  S.add(fx.in(lblA, { from: 'left', d: 0.45, dist: 14 }), tA + 0.1);
  S.add(fx.in(rounded, { from: 'fade', d: 0.45 }), T('b2~millisecond') + 0.3);
  // the coral lane grows to 41.8 ms; 'moving the weights' rides its leading edge
  const W_M = PXMS * MS_M;
  const coral = S.rect({ x: AX0, y: LM - LH / 2, w: 0, h: LH, fill: 'bytes', fillOpacity: 0.62 }, lanes);
  const lblM = S.text('140 GB ÷ 3.35 TB/s ≈ 41.8 ms', { x: AX0 + 24, y: LM + 1, size: 26, weight: 700, color: 'ink' }, lanes);   // 26: the tall '/' clears the 40 px bar
  const rider = S.text('moving the weights', { x: AX0, y: LM - LH / 2 - 24, size: 24, weight: 650, anchor: 'end', color: 'bytes' }, lanes);
  [lblM, rider].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  const tM0 = T('b2~Reading') - 0.05, tM1 = T('b2~milliseconds') + 0.2;
  S.add(fx.in(nameM, { from: 'fade', d: 0.35 }), tM0);
  ch06Clock(S, tM0, tM1, t => {
    const w = W_M * eIO2(cl((t - tM0) / (tM1 - tM0)));
    coral.setAttribute('width', w.toFixed(2));
    rider.setAttribute('x', Math.max(AX0 + 260, AX0 + w - 12).toFixed(2));
  });
  S.add(fx.in(rider, { from: 'fade', d: 0.3 }), tM0 + 0.35);
  // the label waits until the growing bar has passed its end, so the edge never cuts through the text
  const needM = 24 + S.measure('140 GB ÷ 3.35 TB/s ≈ 41.8 ms', { size: 26, weight: 700 }) + 24;
  let uM = 0;
  while (uM < 1 && W_M * eIO2(uM) < needM) uM += 0.01;
  S.add(fx.in(lblM, { from: 'fade', d: 0.4 }), Math.max(tM0 + 0.7, tM0 + uM * (tM1 - tM0)));

  // ================================================================ b3: slices, the pace, idle, no average
  const N = 12, SG = 4, SW = (W_M - SG * (N - 1)) / N;
  const slices = S.g(null, lanes), ticks = S.g(null, lanes);
  const sl = [], tk = [];
  for (let k = 0; k < N; k++) {
    const x = AX0 + k * (SW + SG);
    const g = S.g(null, slices);
    S.rect({ x, y: LM - LH / 2, w: SW, h: LH, r: 3, fill: 'bytes', fillOpacity: 0.62 }, g);
    let d = '';
    for (let c = 0; c < Math.floor((SW - 6) / 12); c++) for (let r = 0; r < 3; r++) d += `M${(x + 5 + c * 12).toFixed(1)},${LM - LH / 2 + 5 + r * 11}h8v8h-8z`;
    S.path({ d, fill: '#ffffff', fillOpacity: 0.16 }, g);
    sl.push(g);
    tk.push(S.rect({ x: x + SW - 3, y: LM + LH / 2 + 6, w: 3, h: 14, fill: 'compute', opacity: 0 }, ticks));
  }
  slices.setAttribute('data-audit', 'ignore');
  S.set(slices, { autoAlpha: 0 }, 0);
  const tSplit = T('b3~one') - 0.1, tSw0 = tSplit + 0.5, tSw1 = T('b3~fetched') + 0.3;
  S.add(gsap.fromTo(slices, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, immediateRender: false }), tSplit);
  S.add(gsap.to([coral, lblM], { autoAlpha: 0, duration: 0.4 }), tSplit);
  S.add(gsap.to(sliver, { autoAlpha: 0.25, duration: 0.5 }), tSplit + 0.2);
  // a playhead fetches slice after slice; as each lands, its arithmetic ticks behind it
  const head = S.line({ x1: AX0, y1: LM - LH / 2 - 8, x2: AX0, y2: LM + LH / 2 + 24, stroke: 'ink', sw: 2.5, opacity: 0 }, lanes);
  head.setAttribute('data-audit', 'ignore');
  ch06Clock(S, tSw0, tSw1, t => {
    const p = cl((t - tSw0) / (tSw1 - tSw0)), xh = AX0 + W_M * p;
    head.setAttribute('x1', xh.toFixed(1)); head.setAttribute('x2', xh.toFixed(1));
    head.setAttribute('opacity', p > 0 && p < 1 ? 0.9 : 0);
    sl.forEach((g, k) => {
      const done = (k + 1) / N <= p + 1e-6, cur = !done && k / N <= p;
      g.setAttribute('opacity', done ? 1 : cur ? 1 : 0.45);
    });
    tk.forEach((e, k) => { const u = (p - (k + 1) / N) * N; e.setAttribute('opacity', u >= 0 ? (1 - 0.35 * cl(u)).toFixed(3) : 0); });
  });
  sl.forEach(g => g.setAttribute('opacity', 0.45));
  // 'The slower one sets the pace': the token is done when the coral lane is
  const done = S.g(null, lanes);
  S.line({ x1: AX0 + W_M + 2, y1: 560, x2: AX0 + W_M + 2, y2: AY - 4, stroke: 'white', sw: 3.5 }, done);
  S.text('token done ≈ 42 ms', { x: AX0 + W_M + 2, y: 538, size: 28, weight: 700, anchor: 'middle', color: 'white' }, done);
  S.set(done, { autoAlpha: 0 }, 0);
  S.add(fx.in(done, { from: 'down', d: 0.5, dist: 30 }), 'b3~slower-0.1');
  const pace = S.g(null, topG);
  S.text('slower one', { x: 960, y: CY + CH / 2 - 18, size: 28, weight: 600, anchor: 'middle', color: 'muted' }, pace);
  S.text('sets the pace', { x: 960, y: CY + CH / 2 + 18, size: 28, weight: 600, anchor: 'middle', color: 'muted' }, pace);
  S.set(pace, { autoAlpha: 0 }, 0);
  S.add(fx.in(pace, { from: 'fade', d: 0.45 }), 'b3~sets-0.1');
  // 'leaving the other idle': the compute card greys out, an hourglass and 'idle, waiting'
  const idle = S.g(null, topG);                                     // hourglass and words, one row where the loop was
  const ix0 = CA - (56 + 14 + S.measure('idle, waiting', { size: 30, weight: 650 })) / 2;
  S.icon('ph:hourglass-medium-duotone', { x: ix0 + 28, y: LPY, size: 56, color: 'muted' }, idle);
  S.text('idle, waiting', { x: ix0 + 70, y: LPY + 1, size: 30, weight: 650, color: 'muted' }, idle);
  S.set(idle, { autoAlpha: 0 }, 0);
  const tIdle = T('b3~idle') - 0.15;
  S.add(gsap.to(cardA, { opacity: 0.35, duration: 0.5 }), tIdle);
  S.add(gsap.to(loopG, { autoAlpha: 0, duration: 0.3 }), tIdle);
  S.add(fx.in(idle, { from: 'fade', d: 0.45 }), tIdle + 0.15);
  // 'not an average of twenty-one': a dashed ghost marker at 630 px, then struck out
  const ghost = S.g(null, lanes);
  const XG = AX0 + 630;
  S.line({ x1: XG, y1: LA + 34, x2: XG, y2: AY + 50, stroke: 'muted', sw: 3, dash: '9 8' }, ghost);
  const gLbl = S.text('≈ 21 ms · average', { x: XG, y: AY + 78, size: 28, weight: 650, anchor: 'middle', color: 'muted' }, ghost);
  const wG = S.measure('≈ 21 ms · average', { size: 28, weight: 650 });
  const strike = S.line({ x1: XG - wG / 2 - 8, y1: AY + 88, x2: XG + wG / 2 + 8, y2: AY + 68, stroke: 'muted', sw: 3.5 }, ghost);
  ghost.querySelectorAll('line').forEach(e => e.setAttribute('data-audit', 'ignore'));
  S.set(ghost, { autoAlpha: 0 }, 0);
  S.set(strike, { autoAlpha: 0 }, 0);
  S.add(fx.in(ghost, { from: 'fade', d: 0.4 }), 'b3~average-0.15');
  S.add(fx.draw(strike, { d: 0.35 }), T('b3~twenty-one') + 0.2);
  S.add(gsap.to(gLbl, { opacity: 0.5, duration: 0.3 }), T('b3~twenty-one') + 0.4);

  // ================================================================ b4: which runs out first?
  const tQ = T('b4') - 0.1;
  S.add(gsap.to([lanes, ticks], { opacity: 0, duration: 0.6 }), tQ);
  S.add(fx.out([pace, idle], { d: 0.4 }), tQ);
  S.add(gsap.to(cardA, { opacity: 1, duration: 0.5 }), tQ + 0.2);
  ignoreIn([lanes], tQ, S.duration);
  S.add(gsap.fromTo(topG, { y: 0 }, { y: TY4, duration: 0.7, ease: 'power2.inOut', immediateRender: false }), tQ + 0.3);
  const q = S.text('which runs out first?', { x: 960, y: 560 + TY4, size: 56, weight: 700, family: 'display', anchor: 'middle', color: 'white' });
  S.set(q, { autoAlpha: 0 }, 0);
  S.add(fx.in(q, { from: 'up', d: 0.6, dist: 16 }), 'b4~Almost-0.1');
});
