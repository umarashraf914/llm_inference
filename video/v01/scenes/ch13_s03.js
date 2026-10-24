/* ch13_s03 · the redundant work, and two ways to grow (figs 133, 134)
   Checked: n(n − 1)/2 — 4 → 6 (4 × 3 = 12, half 6); 1,000 → 499,500; 10 → 45 against 10, 4.5× apart; 10,000 →
   49,995,000 against 10,000, ≈ 5,000× worse; growth from 10 to 10,000 tokens: linear × 1,000, quadratic × 1.11 M.
   b1  header; t1–t6 with K and V tiles; t7 slides in amber, the earlier tiles stay still, a teal banner draws;
       t3's query arrow stops at a grey wall 'mask' ('t3 never saw t7'); teal padlocks settle on every tile.
   b2  the upper group dims; 'generating token 1,000' and 'recompute 999 positions'; 999 hairline ticks flash.
   b3  the boxes shrink up; amber block columns 0, 1, 2, 3 with '0 + 1 + 2 + 3 = 6'; a dashed 4 × 3 box '4 × 3 =
       12'; its empty half shades grey, 'half = 6'; 'total = n(n − 1) / 2', 'quadratic in n'; n → 1,000 and a
       counter runs to 499,500 against a teal 1,000.
   b4  everything but the blocks fades; the blocks grow to fill the left half; 'Two ways to grow': teal linear
       total, per-token strip; three block columns fly into the strip and the amber total bends up; '4.5× apart'
       at 10; the axes rescale to 10,000 tokens: '× 1,000', '× 1,000,000', '≈ 5,000× worse'.
   b5  'recompute every step'; the curve runs off the top: 'impossible, not just expensive'; the left half dims;
       takeaway 'one quadratic term outgrows everything linear'.
   The curve's run off the top leaves along its own tangent (slope 1.31 px/px at 10,000 tokens).
   Layout: pills y 412 at x 612 + 116 i, K tiles y 352, V tiles y 312, banner y 192-272; boxes y 560-640; blocks
   in b3 at x 360-560, y 780-930 (50 px pitch); chart origin (1060, 700), 700 x 460 px; strip y 780-860. */
V.scene('ch13_s03', S => {
  const K = libKit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const { fx } = S;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1, tB5 = T('b5') - 0.1;

  const hdr = S.text('The observation that saves everything', { x: 960, y: 128, size: 44, weight: 750, anchor: 'middle', color: 'ink' });
  S.add(fx.type(hdr, { d: 1.0 }), T('b1') - 0.05);
  fade(hdr, 1, 0, tB4, 0.4);

  // ================================================================ b1: earlier keys and values are settled
  const up = S.g();
  const PX = i => 960 + (i - 3) * 116, PY = 412, KY = 352, VY = 312;
  const kvs = [];
  for (let i = 0; i < 6; i++) {
    const g = S.g(null, up);
    libToken(S, { text: `t${i + 1}`, x: PX(i), y: PY, size: 28, w: 84, state: 'token' }, g);
    const kv = S.g(null, g);
    S.rect({ x: PX(i) - 20, y: KY - 17, w: 40, h: 34, r: 6, fill: 'url(#solid-struct)' }, kv);
    S.text('K', { x: PX(i), y: KY + 1, size: 20, weight: 750, anchor: 'middle', color: '#0a0f1e' }, kv);
    S.rect({ x: PX(i) - 20, y: VY - 17, w: 40, h: 34, r: 6, fill: '#1f3a68', stroke: 'struct', sw: 1.5 }, kv);
    S.text('V', { x: PX(i), y: VY + 1, size: 20, weight: 750, anchor: 'middle', color: 'struct' }, kv);
    K.track(g, [K.K(0.75 + 0.12 * i, { y: 24, o: 0 }), K.K(1.25 + 0.12 * i, { y: 0, o: 1, e: 'power3.out' })]);
    kvs.push(kv);
  }
  // 'earlier keys and values': the tiles glow once, keys then values
  const tileGlow = S.g(null, up);
  tileGlow.setAttribute('data-audit', 'ignore');
  [KY, VY].forEach((y, j) => {
    const r = S.rect({ x: PX(0) - 34, y: y - 26, w: PX(5) - PX(0) + 68, h: 52, r: 14, fill: 'url(#pglow-struct)', opacity: 0 }, tileGlow);
    pulse(r, T('b1~earlier') + 0.25 * j, 0.8, 0.9);
  });
  up.insertBefore(tileGlow, up.firstChild);
  const tNew = T('b1~new') - 0.25;
  const t7g = S.g(null, up);
  libToken(S, { text: 't7', x: PX(6), y: PY, size: 28, w: 84, state: 'prefill' }, t7g);
  K.track(t7g, [K.K(tNew, { x: 420, o: 0 }), K.K(tNew + 0.6, { x: 0, o: 1, e: 'power3.out' })]);
  const banFill = S.rect({ x: 560, y: 192, w: 800, h: 80, r: 16, fill: '#0c1326', fillOpacity: 0.9 }, up);
  const banLine = S.rect({ x: 560, y: 192, w: 800, h: 80, r: 16, stroke: 'helps', sw: 2.5 }, up);
  const ban1 = S.text('Earlier keys and values', { x: 960, y: 218, size: 28, weight: 750, anchor: 'middle', color: 'ink' }, up);
  const ban2 = S.text('do not depend on the new token', { x: 960, y: 252, size: 26, weight: 650, anchor: 'middle', color: 'helps' }, up);
  hide([banFill, ban1, ban2]);
  fade(banFill, 0, 1, tNew + 0.3, 0.3);
  K.draw(banLine, 1800, tNew + 0.3, 0.7);
  fade([ban1, ban2], 0, 1, tNew + 0.6, 0.35, 0.15);
  // t3's query reaches forward and stops at the mask
  const tQ = T('b1~Settled') - 0.1, WX = (PX(5) + PX(6)) / 2;
  const q = S.g(null, up);
  const qa = S.path({ d: `M${PX(2)},${PY + 30} C${PX(2)},${PY + 92} ${WX - 140},${PY + 92} ${WX - 10},${PY + 92}`, stroke: 'struct', sw: 3 }, q);
  const qh = S.path({ d: `M${WX - 20},${PY + 84} L${WX - 9},${PY + 92} L${WX - 20},${PY + 100}`, stroke: 'struct', sw: 3 }, q);
  const wall = S.path({ d: `M${WX},${PY - 122} V${PY + 112}`, stroke: 'muted', sw: 3 }, q);
  const wallT = S.text('mask', { x: WX, y: PY + 134, size: 22, weight: 650, anchor: 'middle', color: 'muted' }, q);
  const never = S.text('t3 never saw t7', { x: 1000, y: PY + 134, size: 22, weight: 650, anchor: 'middle', color: 'muted' }, q);
  [qa, qh, wall].forEach(e => e.setAttribute('data-audit', 'ignore'));
  K.draw(qa, 620, tQ, 0.6);
  K.draw(wall, 240, tQ + 0.15, 0.35);
  hide([qh, wallT, never]);
  fade(qh, 0, 1, tQ + 0.55, 0.12);
  fade([wallT, never], 0, 1, tQ + 0.6, 0.3, 0.1);
  fade(q, 1, 0, T('b1~processed') - 0.1, 0.4);
  // they never change: a padlock settles on every earlier key and value
  const tLock = T('b1~never') - 0.15;
  let n = 0;
  for (let i = 0; i < 6; i++) [KY, VY].forEach(y => {
    const g = S.g(null, up);
    S.circle({ x: PX(i) + 21, y: y - 16, r: 11, fill: '#0c1326', stroke: 'helps', sw: 1.5 }, g);
    S.icon('ph:lock-simple-duotone', { x: PX(i) + 21, y: y - 16, size: 15, color: 'helps' }, g);
    K.track(g, [K.K(tLock + 0.035 * n, { y: -14, o: 0 }), K.K(tLock + 0.035 * n + 0.3, { y: 0, o: 1, e: 'back.out(2)' })]);
    n++;
  });
  void kvs;

  // ================================================================ b2: recomputing repeats identical work
  fade(up, 1, 0.4, tB2, 0.5);
  const boxes = S.g();
  const bx1 = S.g(null, boxes), bx2 = S.g(null, boxes);
  S.rect({ x: 520, y: 560, w: 390, h: 80, r: 16, fill: 'url(#card-struct)', stroke: 'struct', sw: 2.5 }, bx1);
  S.text('generating token 1,000', { x: 715, y: 601, size: 30, weight: 700, anchor: 'middle', color: 'ink' }, bx1);
  S.rect({ x: 960, y: 560, w: 440, h: 80, r: 16, fill: 'url(#card-compute)', stroke: 'compute', sw: 2.5 }, bx2);
  S.text('recompute 999 positions', { x: 1180, y: 601, size: 30, weight: 700, anchor: 'middle', color: 'compute' }, bx2);
  const tBx1 = T('b2~thousand') - 0.15, tBx2 = T('b2~nine') - 0.1;
  K.track(bx1, [K.K(tBx1, { y: 30, o: 0 }), K.K(tBx1 + 0.5, { y: 0, o: 1, e: 'power3.out' })]);
  K.track(bx2, [K.K(tBx2, { y: 30, o: 0 }), K.K(tBx2 + 0.5, { y: 0, o: 1, e: 'power3.out' })]);
  const ticks = S.path({ d: Array.from({ length: 999 }, (_, i) => `M${(520 + i * 880 / 998).toFixed(2)},664 V700`).join(''), stroke: 'compute', sw: 0.6, opacity: 0 });
  ticks.setAttribute('data-audit', 'ignore');
  const tTk = T('b2~ninety') - 0.1;
  whole(t => {
    const k = cl((t - tTk) / 0.25), f = cl((t - tTk - 0.25) / 0.6);
    ticks.setAttribute('opacity', ((k * (1 - 0.45 * f)) * (1 - cl((t - tB3) / 0.4))).toFixed(3));
  });
  // b3 shrinks the boxes upward; b4 clears them
  K.track(boxes, [K.K(tB3, { y: 0, s: 1, o: 1 }), K.K(tB3 + 0.6, { y: -60, s: 0.75 }), K.K(tB4, { o: 1 }), K.K(tB4 + 0.4, { o: 0 })], 960, 600);

  // ================================================================ b3: add it up
  const X0 = 360, BASE = 930, P = 50;
  const blkMove = S.g(), blk = S.g(null, blkMove);
  const tAdd = T('b3~Add') - 0.05;
  const base = S.path({ d: `M${X0},${BASE + 2} H${X0 + 4 * P}`, stroke: 'compute', strokeOpacity: 0.35, sw: 2 });
  hide(base);
  fade(base, 0, 1, tAdd, 0.3);
  for (let c = 1; c < 4; c++) for (let r = 0; r < c; r++) {
    const b = S.rect({ x: X0 + P * c + 3, y: BASE - P * (r + 1) + 3, w: 44, h: 44, r: 6, fill: 'url(#solid-compute)' }, blk);
    const at = tAdd + 0.3 * c + 0.08 * r;
    K.track(b, [K.K(at, { y: -22, o: 0 }), K.K(at + 0.3, { y: 0, o: 1, e: 'bounce.out' })]);
  }
  const EQX = 640, MONO = (s, z) => S.measure(s, { size: z, weight: 700, family: 'mono' });
  const termsA = [[{ t: '0', c: 'compute' }], [{ t: '+ ', c: 'muted' }, { t: '1', c: 'compute' }], [{ t: '+ ', c: 'muted' }, { t: '2', c: 'compute' }], [{ t: '+ ', c: 'muted' }, { t: '3', c: 'compute' }], [{ t: '= ', c: 'muted' }, { t: '6', c: 'compute' }]];
  const rowA = S.g();
  let xa = EQX;
  termsA.forEach((segs, i) => {
    const e = S.text(segs.map(s => ({ ...s, f: 'mono' })), { x: xa, y: 800, size: 36, weight: 700, family: 'mono' }, rowA);
    xa += MONO(segs.map(s => s.t).join(''), 36) + 16;
    hide(e);
    fade(e, 0, 1, tAdd + 0.3 * i + (i === 4 ? 0.1 : 0), 0.3);
  });
  const tOne = T('b3~one') - 0.1;
  const box = S.rect({ x: X0 - 2, y: BASE - 3 * P - 2, w: 4 * P + 4, h: 3 * P + 4, r: 8, stroke: 'white', strokeOpacity: 0.75, sw: 2, dash: '8 6' });
  const dimN = S.text('4', { x: X0 + 2 * P, y: BASE + 30, size: 24, weight: 700, family: 'mono', anchor: 'middle', color: 'ink' });
  const dimM = S.text('3', { x: X0 - 20, y: BASE - 1.5 * P, size: 24, weight: 700, family: 'mono', anchor: 'end', color: 'ink' });
  hide([box, dimN, dimM]);
  fade(box, 0, 1, tOne, 0.4);
  fade([dimN, dimM], 0, 1, tOne + 0.25, 0.3, 0.1);
  const rowB = S.text([{ t: '4', c: 'ink', f: 'mono' }, { t: ' × ', c: 'muted', f: 'mono' }, { t: '3', c: 'ink', f: 'mono' }, { t: ' = 12', c: 'ink', f: 'mono' }], { x: EQX, y: 860, size: 36, weight: 700, family: 'mono' });
  hide(rowB);
  fade(rowB, 0, 1, tOne + 0.5, 0.35);
  const tHalf = T('b3~halve') - 0.1;
  const half = S.g();
  [[0, 0], [0, 1], [0, 2], [1, 1], [1, 2], [2, 2]].forEach(([c, r], i) => {
    const e = S.rect({ x: X0 + P * c + 3, y: BASE - P * (r + 1) + 3, w: 44, h: 44, r: 6, fill: 'neutral', fillOpacity: 0.22, stroke: 'neutral', strokeOpacity: 0.4, sw: 1.5 }, half);
    hide(e);
    fade(e, 0, 1, tHalf + 0.04 * i, 0.25);
  });
  const halfT = S.text([{ t: 'half = ', c: 'muted', f: 'mono' }, { t: '6', c: 'compute', f: 'mono' }], { x: EQX + MONO('4 × 3 = 12', 36) + 40, y: 860, size: 36, weight: 700, family: 'mono' });
  hide(halfT);
  fade(halfT, 0, 1, tHalf + 0.25, 0.3);
  // the rows collapse into the general formula
  const tM = tHalf + 0.45;
  fade([rowA, rowB, halfT], 1, 0, tM, 0.3);
  const formula = S.text('total = n(n − 1) / 2', { x: EQX, y: 800, size: 38, weight: 700, family: 'mono', color: 'ink' });
  hide(formula);
  fade(formula, 0, 1, tM + 0.3, 0.35);
  const qTag = S.pill('quadratic in n', { x: EQX, y: 860, anchor: 'start', tone: 'compute', size: 24, h: 42 });
  hide(qTag);
  fade(qTag, 0, 1, tM + 0.55, 0.35);
  // n = 1,000: about half a million recomputations, where a thousand would do
  const tK = T('b3~thousand') + 0.15;
  S.add(ch13Retext(formula, 'total = n(n − 1) / 2', 'total = 1,000 × 999 / 2', 0.4), tK);
  const cnt = S.text('0', { x: 880, y: 926, size: 40, weight: 750, family: 'mono', anchor: 'end', color: 'compute' });
  const cntL = S.text('recomputations', { x: 898, y: 928, size: 22, weight: 600, color: 'muted' });
  hide([cnt, cntL]);
  fade([cnt, cntL], 0, 1, tK + 0.3, 0.3);
  whole(t => { cnt.textContent = Math.round(499500 * E('power2.out')(cl((t - tK - 0.4) / 1.5))).toLocaleString('en-US'); });
  const would = S.text([{ t: 'vs ', c: 'muted' }, { t: '1,000', c: 'helps', w: 750 }, { t: ' would do', c: 'muted' }], { x: 1072, y: 928, size: 22, weight: 600 });
  hide(would);
  fade(would, 0, 1, T('b3~where') - 0.1, 0.35);
  fade([base, box, dimN, dimM, half, formula, qTag, cnt, cntL, would], 1, 0, tB4, 0.4);
  fade(up, 0.4, 0, tB4, 0.4);

  // ================================================================ b4: two ways to grow
  // the blocks alone stay, grown to fill the left half: (460, 855) → (440, 560), × 1.8
  const tImp = T('b5~impossible') - 0.15;
  K.track(blkMove, [K.K(tB4, { x: 0, y: 0, s: 1, o: 1 }), K.K(tB4 + 0.9, { x: -20, y: -295, s: 1.8 }), K.K(tImp + 0.3, { o: 1 }), K.K(tImp + 0.9, { o: 0.35 })], 460, 855);
  const title = S.text('Two ways to grow', { x: 1410, y: 128, size: 44, weight: 750, anchor: 'middle', color: 'ink' });
  hide(title);
  fade(title, 0, 1, tB4 + 0.4, 0.45);
  const OX = 1060, OY = 700, PW = 700, PH = 460;
  const chart = S.g();
  const axes = S.path({ d: `M${OX},${OY - PH} V${OY} H${OX + PW + 10}`, stroke: 'white', strokeOpacity: 0.6, sw: 2.5 }, chart);
  K.draw(axes, 1200, tB4 + 0.5, 0.7);
  const grid = S.g(null, chart), xt = [], yt = [];
  for (let i = 1; i <= 5; i++) {
    const f = i / 5;
    S.path({ d: `M${OX},${(OY - PH * f).toFixed(1)} H${OX + PW}`, stroke: 'white', strokeOpacity: 0.06, sw: 1.5 }, grid);
    S.path({ d: `M${(OX + PW * f).toFixed(1)},${OY} V${OY + 8}`, stroke: 'white', strokeOpacity: 0.5, sw: 2 }, grid);
    xt.push(S.text('', { x: OX + PW * f, y: OY + 26, size: 20, weight: 600, family: 'mono', anchor: 'middle', color: 'muted' }, grid));
    yt.push(S.text('', { x: OX - 12, y: OY - PH * f, size: 20, weight: 600, family: 'mono', anchor: 'end', color: 'muted' }, grid));
  }
  const yName = S.text('total work', { x: OX + 12, y: OY - PH - 18, size: 22, weight: 650, color: 'muted' }, chart);
  const xName = S.text('tokens', { x: OX + PW / 2, y: OY + 54, size: 22, weight: 650, anchor: 'middle', color: 'muted' }, chart);
  const sch = S.pill('schematic', { x: 1690, y: 130, tone: 'neutral', size: 20, h: 30 }, chart);
  hide([grid, yName, xName, sch]);
  fade([grid, yName, xName], 0, 1, tB4 + 0.9, 0.4);
  fade(sch, 0, 1, tB4 + 1.2, 0.4);
  // the two totals, recomputed from the ranges every frame
  const lin = S.path({ d: 'M0,0', stroke: 'helps', sw: 4 }, chart);
  const quad = S.path({ d: 'M0,0', stroke: 'compute', sw: 4 }, chart);
  [lin, quad].forEach(e => e.setAttribute('data-audit', 'ignore'));
  const linL = S.text('Linear', { x: OX + PW + 15, y: 0, size: 26, weight: 750, color: 'helps' }, chart);
  const quadL = S.text('Quadratic', { x: OX + PW - 15, y: 0, size: 26, weight: 750, anchor: 'end', color: 'compute' }, chart);
  hide([linL, quadL]);
  const tLin = T('b4~Linear') - 0.1, tQd = T('b4~Quadratic') - 0.1, tTen2 = T('b4~ten#2') - 0.1;
  fade(linL, 0, 1, tLin + 0.9, 0.35);
  fade(quadL, 0, 1, tQd + 2.2, 0.35);
  const Qf = x => Math.max(0, x * (x - 1) / 2);
  const fmtTick = v => (v >= 1e6 ? `${(v / 1e6).toFixed(v / 1e6 < 10 ? 1 : 0).replace(/\.0$/, '')}M` : Math.round(v).toLocaleString('en-US'));
  whole(t => {
    const k = EIO(cl((t - tTen2 - 0.2) / 1.4)), Xm = 10 ** (1 + 3 * k), Ym = 50 * 10 ** (6 * k);
    const X = x => OX + PW * x / Xm, Y = v => OY - PH * v / Ym;
    xt.forEach((e, i) => { e.textContent = fmtTick(Xm * (i + 1) / 5); });
    yt.forEach((e, i) => { e.textContent = fmtTick(Ym * (i + 1) / 5); });
    const pL = EIO(cl((t - tLin) / 1.0)), pQ = cl((t - tQd - 0.5) / 1.8);
    lin.setAttribute('d', `M${OX},${OY} L${X(Xm * pL).toFixed(1)},${Y(Xm * pL).toFixed(2)}`);
    setO(lin, pL > 0 ? 1 : 0);
    let d = '';
    for (let j = 0; j <= 80; j++) { const x = Xm * pQ * j / 80; d += `${j ? 'L' : 'M'}${X(x).toFixed(1)},${Y(Qf(x)).toFixed(1)}`; }
    quad.setAttribute('d', d);
    setO(quad, pQ > 0 ? 1 : 0);
    linL.setAttribute('y', Math.min(OY - 10, Y(Xm)).toFixed(1));
    quadL.setAttribute('y', (Y(Qf(Xm)) - 22).toFixed(1));
  });
  // the per-token strip: teal, one unit each; amber, one more each time
  const SB = 860, U = 8, CX = k => OX + 70 * (k - 0.5);
  const strip = S.g(null, chart);
  S.path({ d: `M${OX},${SB + 1} H${OX + PW}`, stroke: 'white', strokeOpacity: 0.25, sw: 1.5 }, strip);
  const perT = S.text('per token', { x: OX - 12, y: SB - 16, size: 20, weight: 650, anchor: 'end', color: 'muted' }, strip);
  hide(perT);
  fade(perT, 0, 1, tLin, 0.35);
  for (let k = 1; k <= 10; k++) {
    const tb = S.rect({ x: CX(k) - 13, y: SB - U, w: 10, h: U, r: 2, fill: 'helps' }, strip);
    hide(tb);
    fade(tb, 0, 1, tLin + 0.07 * k, 0.2);
  }
  for (let k = 5; k <= 10; k++) {
    const ab = S.rect({ x: CX(k) + 3, y: SB, w: 10, h: 0, r: 2, fill: 'compute' }, strip);
    const at = tQd + 0.5 + 1.8 * (k - 0.5) / 10;
    whole(t => { const h = U * (k - 1) * E('power2.out')(cl((t - at) / 0.3)); ab.setAttribute('y', (SB - h).toFixed(1)); ab.setAttribute('height', h.toFixed(1)); });
  }
  // three block columns fly from the left half into the strip as rising bars (tokens 2, 3, 4)
  for (let c = 1; c <= 3; c++) {
    const f = (x, y) => [440 + (x - 460) * 1.8, 560 + (y - 855) * 1.8];
    const [ax, ay] = f(X0 + P * c + 3, BASE - P * c + 3), [bx, by] = f(X0 + P * c + 47, BASE - 3);
    const from = [ax, ay, bx - ax, by - ay], to = [CX(c + 1) + 3, SB - U * c, 10, U * c];
    const fly = S.rect({ x: from[0], y: from[1], w: from[2], h: from[3], r: 4, fill: 'url(#solid-compute)' }, strip);
    fly.setAttribute('data-audit', 'ignore');
    const at = tQd - 0.05 + 0.12 * c;
    whole(t => {
      const p = EIO(cl((t - at) / 0.75));
      ['x', 'y', 'width', 'height'].forEach((a, j) => fly.setAttribute(a, lerp(from[j], to[j], p).toFixed(1)));
      fly.setAttribute('rx', lerp(4, 2, p).toFixed(1));
      setO(fly, t > at ? 1 : 0);
    });
  }
  fade(strip, 1, 0, tTen2, 0.4);
  hide(chart);
  fade(chart, 0, 1, tB4 + 0.5, 0.3);
  // at ten tokens: 45 against 10
  const mark = S.g();
  const mk = S.path({ d: `M${OX + PW},${OY - PH * 10 / 50 - 4} V${OY - PH * 45 / 50 + 4}`, stroke: 'white', sw: 2.5, dash: '6 6' }, mark);
  mk.setAttribute('data-audit', 'ignore');
  S.text('4.5× apart', { x: OX + PW - 15, y: 520, size: 28, weight: 750, anchor: 'end', color: 'ink' }, mark);
  hide(mark);
  fade(mark, 0, 1, T('b4~ten') - 0.1, 0.35);
  fade(mark, 1, 0, tTen2 - 0.1, 0.3);
  // at ten thousand
  const tags = S.g();
  S.text('× 1,000', { x: OX + PW - 15, y: OY - 24, size: 26, weight: 750, anchor: 'end', color: 'helps' }, tags);
  S.text('× 1,000,000', { x: 1560, y: OY - PH - 22, size: 26, weight: 750, anchor: 'end', color: 'compute' }, tags);
  hide(tags);
  fade(tags, 0, 1, tTen2 + 1.6, 0.4);
  const worse = S.text('≈ 5,000× worse', { x: OX + 40, y: 320, size: 36, weight: 800, color: 'compute' });
  hide(worse);
  S.add(K.drive(0.4, k => { setO(worse, k); worse.setAttribute('transform', `translate(0,${(14 * (1 - E('power3.out')(k))).toFixed(1)})`); }), T('b4~five#2') - 0.1);

  // ================================================================ b5: impossible, not merely expensive
  fade([tags, worse], 1, 0, tB5, 0.4);
  S.add(ch13Retext(quadL, 'Quadratic', 'recompute every step', 0.4), tB5 + 0.2);
  const run = S.path({ d: `M${OX + PW},${OY - PH} C${OX + PW + 20},${OY - PH - 26} ${OX + PW + 28},${OY - PH - 120} ${OX + PW + 30},-30`, stroke: 'compute', sw: 4 });
  run.setAttribute('data-audit', 'ignore');
  K.draw(run, 320, tImp, 0.7);
  const imp = S.pill('impossible, not just expensive', { x: 1430, y: 300, tone: 'compute', size: 24, h: 44 });
  hide(imp);
  fade(imp, 0, 1, tImp + 0.4, 0.35);
  const tAll = T('b5~Almost') - 0.1;
  fade(imp, 1, 0, tAll, 0.35);
  const take = S.takeaway('one quadratic term outgrows everything linear', { tone: 'compute' });
  hide(take);
  fade(take, 0, 1, tAll + 0.2, 0.5);
  void cl; void pulse;
});
