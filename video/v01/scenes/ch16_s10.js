/* ch16_s10 · expensive to edit the front everyone shares (fig 56)
   Change one token at position 5 of the shared preamble and the match ends there: nothing after it is reused,
   however identical. Every conversation on the machine shares that prefix, so all go cold at once; the weather
   conversation's next turn prefills 1,032 - 4 = 1,028 tokens, not 5: 1,028 / 5 = 205.6, '≈ 206×' (checked).
   To scale at 1,028 units = 1,200 px the 5 is a 5.8 px sliver, drawn 6 px. Hence: stable first, variable last.
   b1  'Change one token at the very front'; the row: five numbered slots, then the rest of the system prompt,
       tools, everything after; slot 5 'edit'; the cursor: 1-4 teal, 'the match ends here'; the rest amber,
       'identical, but after the difference'.
   b2  pull out: the row tops a stack of conversations with the same front; the marker runs down every row and
       the right side turns amber at once; the weather row enlarges; bars to scale: 'before the edit: 5' against
       'after: 1,028'.
   b3  plate '1,028 ÷ 5 ≈ 206× the prefill work'; a warning sign over the system prompt, 'edit with care'.
   b4  the stack fades; a band from 'most stable' to 'most variable' carrying ch15_s06's four segments; edit
       ticks flicker only on the variable end; ghost strips share the teal front; 'order matters: stable first,
       variable last'.
   Layout: row y 330 from x 140 (slots 70 wide, numbers y 286); the stack scales rows 0.75 about (140, 330), row k
   at y 230 + 54 k; bars x 360-1560, y 772 / 840; plate y 930; band x 260-1660, y 520. The row and then the stack
   with its bars are one pane: in b1 the row sits 230 lower, centred below the header; as it pulls out into the
   stack (b2) the pane rises into place and moves 134 right, so the stack and bars are centred. */
V.scene('ch16_s10', S => {
  const K = libKit(S), { T, cl, E, EIO, whole, setO, hide, fade } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const hsh = i => { const v = Math.sin(i * 12.9898 + 2.3) * 43758.5453; return v - Math.floor(v); };
  const RY = 330, H = 58, X0 = 140, SW = 70, GAP = 6;
  const SX = i => X0 + (SW + GAP) * i;
  const SEG = [['rest of the system prompt', SX(5), 520], ['tools', SX(5) + 526, 260], ['everything after', SX(5) + 792, 470]];
  const XM = SX(4) - GAP / 2;  // the first difference: before slot 5
  const tEdit = T('b1~position') - 0.1, tCur = T('b1~match') - 0.2, dCur = 0.8, tAfter = T('b1~Nothing') - 0.1;
  const tOnce = T('b2~at') - 0.1;

  // ================================================================ b1: one token changed at the front
  const head = S.text('Change one token at the very front', { x: 960, y: 128, size: 40, weight: 750, anchor: 'middle', color: 'ink' });
  rise(head, 0.6, 10);
  const top = S.g(), small = [];  // small: the top row's text, faded before the row shrinks into the stack
  const passAt = x => tCur + dCur * cl((x - X0) / (XM - X0));
  for (let i = 0; i < 5; i++) {
    const plan = i < 4 ? [[0, 'blue'], [passAt(SX(i) + SW), 'teal', 0.25]] : [[0, 'blue'], [tEdit, 'amber', 0.3]];
    ch16Cell(S, { x: SX(i), y: RY, w: SW, h: H, r: 14, plan }, top);
    small.push(S.text(String(i + 1), { x: SX(i) + SW / 2, y: 286, size: 22, weight: 700, family: 'mono', anchor: 'middle', color: 'muted' }, top));
  }
  SEG.forEach(([label, x, w], i) => small.push(ch16Cell(S, { x, y: RY, w, h: H, label, size: 26, plan: [[0, 'blue'], [tAfter + 0.35 * i, 'amber', 0.4]] }, top).lab));
  rise(top, 1.4, 0, 0.6);
  const editL = S.text('edit', { x: SX(4) + SW / 2, y: 392, size: 26, weight: 800, anchor: 'middle', color: 'compute' });
  rise(editL, tEdit + 0.2, 6);
  const cur = S.g();
  cur.setAttribute('data-audit', 'ignore');
  S.rect({ x: -24, y: RY - 44, w: 48, h: 88, fill: 'url(#pglow-struct)', opacity: 0.8 }, cur);
  S.rect({ x: -2, y: RY - 40, w: 4, h: 80, r: 2, fill: '#ffffff' }, cur);
  whole(t => { cur.setAttribute('transform', `translate(${(X0 - 8 + (XM - X0 + 8) * cl((t - tCur) / dCur)).toFixed(1)},0)`); setO(cur, cl((t - tCur + 0.2) / 0.2) * (1 - cl((t - tCur - dCur) / 0.2))); });
  // the marker: a white line, later extended down through the whole stack
  const tStack = tB2 + 0.3, ROWS = 8, PITCH = 54, SC = 0.75;
  const stackY = k => 230 + PITCH * k;  // centre of row k once pulled out
  const mk = S.line({ x1: XM, y1: RY - 44, x2: XM, y2: RY + 44, stroke: '#ffffff', sw: 4 });
  mk.setAttribute('data-audit', 'ignore');
  whole(t => {
    const k = cl((t - tCur - dCur) / 0.3), p = EIO(cl((t - tStack) / 1.0)), d = E('power2.out')(cl((t - tOnce) / 0.5));
    // follow the top row as it shrinks, then grow down through every row on 'at once'
    const x = XM, y1 = (RY - 44) + (stackY(0) - 26 - (RY - 44)) * p, y2b = (RY + 44) + (stackY(0) + 26 - (RY + 44)) * p;
    const xs = X0 + (x - X0) * (1 - (1 - SC) * p);
    mk.setAttribute('x1', xs.toFixed(1)); mk.setAttribute('x2', xs.toFixed(1));
    mk.setAttribute('y1', y1.toFixed(1)); mk.setAttribute('y2', (y2b + (stackY(ROWS - 1) + 26 - y2b) * d).toFixed(1));
    setO(mk, k * (1 - cl((t - tB4) / 0.4)));
  });
  const endL = S.text('the match ends here', { x: XM, y: 238, size: 26, weight: 750, anchor: 'middle', color: 'ink' });
  rise(endL, tCur + dCur + 0.1, 6);
  const idT = S.pill('identical, but after the difference', { x: (SEG[0][1] + SEG[2][1] + SEG[2][2]) / 2, y: 404, tone: 'neutral', size: 24, h: 42 });
  rise(idT, tAfter + 0.6, 6);
  fade([endL, idT, editL, ...small], 1, 0, tStack - 0.3, 0.3);

  // ================================================================ b2: every conversation shares the prefix
  K.track(top, [K.K(tStack, { x: 0, y: 0, s: 1 }), K.K(tStack + 1.0, { y: stackY(0) - RY, s: SC, e: 'power3.inOut' })], X0, RY);
  K.ignore(top, tStack, 1.1);
  const stack = S.g();
  const tWx = T('b2~weather') - 0.1, WK = 4;
  for (let k = 1; k < ROWS; k++) {
    const g = S.g(null, stack);
    S.icon('ph:user-duotone', { x: X0 - 46, y: RY, size: 40, color: 'muted' }, g);
    for (let i = 0; i < 5; i++) ch16Cell(S, { x: SX(i), y: RY, w: SW, h: H, r: 14, plan: i < 4 ? [[0, 'teal']] : [[0, 'teal'], [tOnce + 0.05 * k, 'amber', 0.3]] }, g);
    const tailW = 300 + Math.round(900 * hsh(k));
    ch16Cell(S, { x: SEG[0][1], y: RY, w: 520, h: H, plan: [[0, 'teal'], [tOnce + 0.05 * k + 0.1, 'amber', 0.3]] }, g);
    ch16Cell(S, { x: SEG[1][1], y: RY, w: 260, h: H, plan: [[0, 'teal'], [tOnce + 0.05 * k + 0.2, 'amber', 0.3]] }, g);
    ch16Cell(S, { x: SEG[2][1], y: RY, w: Math.min(470, tailW - 120), h: H, plan: [[0, 'teal'], [tOnce + 0.05 * k + 0.3, 'amber', 0.3]] }, g);
    if (k === WK) S.icon('ph:cloud-sun-duotone', { x: X0 - 46, y: RY, size: 46, color: '#a9cbff' }, g);
    const at = tStack + 0.6 + 0.07 * k;
    K.track(g, [K.K(at, { y: stackY(k) - RY + 20, s: SC, o: 0 }), K.K(at + 0.4, { y: stackY(k) - RY, o: 1, e: 'power3.out' })], X0, RY);
  }
  K.ignore(stack, tStack, 2.0);
  // the top row's user icon appears with the stack
  const topU = S.icon('ph:user-duotone', { x: X0 - 46 * SC, y: stackY(0), size: 30, color: 'muted' });
  rise(topU, tStack + 0.9, 0);
  const wGlow = S.rect({ x: X0 - 60, y: stackY(WK) - 32, w: (1782 - X0) * SC + 90, h: 64, r: 18, fill: 'url(#pglow-struct)', opacity: 0 });
  wGlow.setAttribute('data-audit', 'ignore');
  S.main.insertBefore(wGlow, stack);
  K.pulse(wGlow, tWx, 1, 1.0);
  K.pulse(wGlow, tWx + 1.0, 1, 1.0);
  // to scale: 1,028 units = 1,200 px; 'before the edit: 5' is 5.8 px, drawn 6 px
  const U = 1200 / 1028, BX = 360;
  const tPre = T('b2~prefills') - 0.1;
  const b1 = S.g(), b2 = S.g();
  const s5 = S.rect({ x: BX, y: 772 - 18, w: 6, h: 36, fill: 'compute' }, b1);
  s5.setAttribute('data-audit', 'ignore');
  S.text('before the edit: 5', { x: BX - 18, y: 773, size: 26, weight: 700, anchor: 'end', color: 'compute' }, b1);
  rise(b1, T('b2~five') - 0.1, 6);
  const big = S.rect({ x: BX, y: 840 - 20, w: 0, h: 40, r: 7, fill: 'url(#card-compute)', stroke: 'compute', sw: 2.5 }, b2);
  whole(t => big.setAttribute('width', Math.max(0.01, 1028 * U * EIO(cl((t - tPre - 0.3) / 1.0))).toFixed(1)));
  S.text('after: 1,028', { x: BX - 18, y: 841, size: 26, weight: 700, anchor: 'end', color: 'compute' }, b2);
  S.text('to scale: 1,028 tokens = 1,200 px', { x: BX + 1200, y: 732, size: 22, weight: 600, anchor: 'end', color: 'muted' }, b2);
  rise(b2, tPre, 6);

  // ================================================================ b3: about 206 times the work, from one token
  const plate = S.g();
  S.rect({ x: 960 - 330, y: 930 - 32, w: 660, h: 64, r: 16, fill: CH16.BASE, stroke: '#ffffff', strokeOpacity: 0.35, sw: 2 }, plate);
  S.text('1,028 ÷ 5 ≈ 206× the prefill work', { x: 960, y: 931, size: 32, weight: 800, anchor: 'middle', color: 'ink' }, plate);
  rise(plate, tB3 + 0.1, 10);
  const tCare = T('b3~care') - 0.25;
  const warn = S.g();
  S.icon('ph:warning-duotone', { x: X0 + 300, y: 168, size: 50, color: 'compute' }, warn);
  S.text('edit with care', { x: X0 + 336, y: 169, size: 28, weight: 750, color: 'compute' }, warn);
  rise(warn, tCare, 8);
  fade(head, 1, 0, tCare - 0.4, 0.3);

  // the row, then the stack and its bars, as one pane (see the header)
  const pane = S.g();
  [...S.main.children].filter(e => e !== pane && e !== head && e !== plate).forEach(e => pane.appendChild(e));
  whole(t => { const p = EIO(cl((t - tStack) / 1.0)); pane.setAttribute('transform', `translate(${(134 * p).toFixed(1)},${(230 * (1 - p)).toFixed(1)})`); });

  // ================================================================ b4: stable first, variable last
  fade([top, stack, topU, b1, b2, plate, warn], 1, 0, tB4, 0.45);
  const tSt = T('b4~stable') - 0.1, tEv = T('b4~everyday') - 0.1, tFr = T('b4~front') - 0.1;
  const band = S.g();
  const N = 70, BL = 260, BR = 1660, BY = 540;
  const mix = (a, b, k) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
  for (let i = 0; i < N; i++) S.rect({ x: BL + (BR - BL) * i / N, y: BY - 48, w: (BR - BL) / N + 0.6, h: 96, fill: mix([20, 120, 110], [150, 100, 30], i / (N - 1)), opacity: 0.55 }, band);
  band.setAttribute('data-audit', 'ignore');
  rise(band, tB4 + 0.3, 0, 0.6);
  const ord = S.g();
  S.arrow({ x1: BL, y1: 624, x2: BR, y2: 624, color: 'muted', sw: 2.5, head: 12 }, ord);
  const ordL = S.text('most stable → most variable', { x: 960, y: 660, size: 26, weight: 600, anchor: 'middle', color: 'muted' }, ord);
  rise(ord, tB4 + 0.6, 6);
  // ch15_s06's strip, slotting onto the band
  const KIND = [["provider's prompt", '#5b8def'], ['your instructions', '#86b6ff'], ['conversation so far', '#4a6fc4'], ['newest message', '#a9cdff']];
  const raw = KIND.map(([s]) => S.measure(s, { size: 26, weight: 650 }) + 64), fW = (BR - BL - 40 - 30) / raw.reduce((a, b) => a + b, 0);
  const segW = raw.map(w => w * fW), segX = segW.map((w, i) => BL + 20 + segW.slice(0, i).reduce((a, b) => a + b, 0) + 10 * i);
  const strip = S.g();
  const segs = KIND.map(([s, c], i) => {
    const g = S.g(null, strip);
    S.rect({ x: segX[i], y: BY - 28, w: segW[i], h: 56, r: 12, fill: CH16.BASE }, g);
    S.rect({ x: segX[i], y: BY - 28, w: segW[i], h: 56, r: 12, fill: c, fillOpacity: 0.22, stroke: c, sw: 2.5 }, g);
    S.text(s, { x: segX[i] + segW[i] / 2, y: BY + 1, size: 26, weight: 650, anchor: 'middle', color: 'ink' }, g);
    K.track(g, [K.K(tSt + 0.35 * i, { y: -60, o: 0 }), K.K(tSt + 0.35 * i + 0.45, { y: 0, o: 1, e: 'back.out(1.4)' })]);
    return g;
  });
  K.ignore(strip, tSt, 1.6);
  // everyday edits land only on the variable end
  for (let j = 0; j < 8; j++) {
    const i = 2 + (j % 2), x = segX[i] + segW[i] * (0.15 + 0.7 * hsh(j + 3)), at = tEv + 0.22 * j;
    const tick = S.path({ d: `M${x},${BY - 40} v-16`, stroke: 'compute', sw: 4 });
    tick.setAttribute('data-audit', 'ignore');
    whole(t => setO(tick, Math.sin(Math.PI * cl((t - at) / 0.5))));
  }
  // ghost strips of other users' prompts, all sharing the front
  const ghosts = S.g();
  ghosts.setAttribute('data-audit', 'ignore');
  [1, 2, 3].forEach(k => {
    const g = S.g(null, ghosts), y = BY - 28 - 34 * k;
    S.rect({ x: segX[0], y, w: segW[0], h: 24, r: 8, fill: 'helps', fillOpacity: 0.18, stroke: 'helps', strokeOpacity: 0.5, sw: 1.5 }, g);
    S.rect({ x: segX[1], y, w: segW[1] + segW[2] * (0.3 + 0.5 * hsh(k)), h: 24, r: 8, fill: '#1d3566', fillOpacity: 0.4, stroke: 'struct', strokeOpacity: 0.4, sw: 1.5 }, g);
    whole(t => setO(g, 0.9 * cl((t - tFr - 0.12 * k) / 0.4)));
  });
  S.main.insertBefore(ghosts, strip);
  const frontGlow = S.rect({ x: segX[0] - 12, y: BY - 40, w: segW[0] + 24, h: 80, r: 20, fill: 'url(#pglow-helps)', opacity: 0 });
  frontGlow.setAttribute('data-audit', 'ignore');
  S.main.insertBefore(frontGlow, strip);
  whole(t => frontGlow.setAttribute('opacity', (cl((t - tFr - 0.3) / 0.5)).toFixed(3)));
  fade(ordL, 1, 0, tFr + 0.4, 0.3);
  const finS = 'order matters: stable first, variable last', tFin = tFr + 0.7;
  const fw = S.measure(finS, { size: 34, weight: 800 });
  const fin = S.text('', { x: 960 - fw / 2, y: 740, size: 34, weight: 800, color: 'ink' });
  whole(t => { fin.textContent = finS.slice(0, Math.round(finS.length * cl((t - tFin) / 1.2))); });
  void segs;
});
