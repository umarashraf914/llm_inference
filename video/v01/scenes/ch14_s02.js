/* ch14_s02 · at layer one, the reasoning holds (figs 38, 39, 40)
   Checked: token 5's embedding row holds 8,192 numbers (the model width); at layer 1 no input comes from tokens
   1 to 4, so changing token 2 leaves it bit for bit the same. Position is applied as the key is made (a rotation
   on the arrow out of W_K), so the input box holds the embedding row alone.
   b1  header; the embedding table and 'token 5's ID'; a pointer finds the row; a copy of it slides into the input
       box, flows through '×' into the padlocked W_K (layer 1); 'position 5' clicks onto the arrow; the key.
   b2  table and chip go, the pipeline dims; strips 'original' and 'changed' (XX violet); each t5 drops into its
       own input box; the boxes overlay, '8,192 numbers', both turn teal, '= identical'; banner 'at layer 1: right'.
   b3  a small table: token, position, layer-1 K, V; a pointer to 'token 5 | 5'; then 'one-layer model only' and
       two sentences ending in 'bank'; the prefix-rule card; the two 'bank' pills glow, a teal arc 'reusable';
       the card is struck and dims.
   b4  the pipeline folds into a slab 'layer 1' with a teal tick; 'layer 2' above it with '?'; caption.
   Layout: table x 120-380, y 312-864 (24 rows, 23 px); pipeline y 560: input box x 480-760, '×' 810, W_K at 940,
   arrow 1022-1146 with the rotation at 1084, key bar at 1262; right third x 1480-1850; bottom band y 760-990. */
V.scene('ch14_s02', S => {
  const K = libKit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const { fx } = S;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };

  const hdr = S.text('Layer 1: just the token itself', { x: 960, y: 128, size: 42, weight: 750, anchor: 'middle', color: 'ink' });
  rise(hdr, 0.5);

  // ================================================================ b1: the embedding table and its row
  const tab = S.g();
  const TX = 120, TY = 312, RH = 23, ROW = 13, rnd = S.rand(14);
  for (let r = 0; r < 24; r++) for (let c = 0; c < 10; c++) {
    const v = rnd();
    S.rect({ x: TX + 26 * c + 1.5, y: TY + RH * r + 1.5, w: 23, h: RH - 3, r: 3, fill: 'struct', opacity: (0.18 + 0.5 * v).toFixed(2) }, tab);
  }
  for (let r = 0; r < 24; r += 4) S.text(String(r), { x: TX - 14, y: TY + RH * r + RH / 2, size: 20, weight: 600, family: 'mono', anchor: 'end', color: 'faint' }, tab);
  hide(tab);
  fade(tab, 0, 1, 0.7, 0.6);
  const chip = S.g();
  libToken(S, { text: "token 5's ID", x: TX + 130, y: 262, size: 24, state: 'token', case: 'label' }, chip);
  rise(chip, 1.1);
  // the pointer runs down the right edge to the row; the row lights
  const tFind = T('b1~starts') - 0.1, rowY = TY + RH * ROW;
  const ptr = S.path({ d: 'M0,0 L-14,-9 L-14,9 Z', fill: 'ink' }, tab);
  whole(t => ptr.setAttribute('transform', `translate(${TX + 260 + 22},${(lerp(TY + RH / 2, rowY + RH / 2, EIO(cl((t - tFind) / 0.7)))).toFixed(1)}) rotate(180)`));
  const hi = S.rect({ x: TX - 4, y: rowY - 2, w: 268, h: RH + 4, r: 5, stroke: 'white', sw: 2.5 }, tab);
  hide(hi);
  fade(hi, 0, 1, tFind + 0.7, 0.2);
  fade(tab, 1, 0, tB2, 0.4);
  fade(chip, 1, 0, tB2, 0.4);

  // ================================================================ b1: the pipeline
  const pipe = S.g();
  const box = S.rect({ x: 480, y: 515, w: 280, h: 90, r: 14, fill: CH14.BASE, stroke: 'struct', strokeOpacity: 0.8, sw: 2.5 }, pipe);
  const boxL = S.text("token 5's row", { x: 620, y: 642, size: 28, weight: 600, anchor: 'middle', color: 'muted' }, pipe);
  const tRow = T('b1~own') - 0.1;
  hide([box, boxL]);
  fade(box, 0, 1, tRow, 0.3);
  fade(boxL, 0, 1, tRow + 0.5, 0.3);
  // the row's copy: ten cells lifting out of the table into the box (x 500-740, y 545-575)
  const copy = S.g(null, pipe);
  const r2 = S.rand(14);
  for (let r = 0; r < 24; r++) for (let c = 0; c < 10; c++) { const v = r2(); if (r === ROW) S.rect({ x: 26 * c + 1.5, y: 1.5, w: 23, h: RH - 3, r: 3, fill: 'struct', opacity: (0.35 + 0.65 * v).toFixed(2) }, copy); }
  whole(t => {
    const k = EIO(cl((t - tRow - 0.1) / 0.7));
    const x = lerp(TX, 500, k), y = lerp(rowY, 546, k), sx = lerp(1, 240 / 260, k), sy = lerp(1, 30 / RH, k);
    copy.setAttribute('transform', `translate(${x.toFixed(1)},${(y - 12 * Math.sin(Math.PI * k)).toFixed(1)}) scale(${sx.toFixed(3)},${sy.toFixed(3)})`);
    setO(copy, t > tRow ? 1 : 0);
  });
  const tFlow = T('b1~row') + 0.3;
  const mult = ch14Op(S, '×', { x: 812, y: 562, size: 60 }, pipe);
  const W = ch14Matrix(S, { x: 940, y: 560, size: 160, name: 'K', sub: 'layer 1', seed: 1, nameGap: 40, subGap: 40 }, pipe);
  hide([mult, W]);
  fade(mult, 0, 1, tRow + 0.4, 0.3);
  fade(W, 0, 1, tRow + 0.5, 0.35);
  S.add(W.lock(), tRow + 0.9);
  const dot = S.circle({ x: 0, y: 560, r: 16, fill: 'url(#pglow-struct)', opacity: 0 }, pipe);
  dot.setAttribute('data-audit', 'ignore');
  whole(t => {
    const k = cl((t - tFlow) / 0.55);
    dot.setAttribute('cx', lerp(760, 880, E('power1.in')(k)).toFixed(1));
    dot.setAttribute('opacity', (k > 0 && k < 1 ? Math.sin(Math.PI * k) : 0).toFixed(3));
  });
  const wGlow = S.rect({ x: 850, y: 470, w: 180, h: 180, r: 22, fill: 'url(#pglow-struct)', opacity: 0 }, pipe);
  wGlow.setAttribute('data-audit', 'ignore');
  pipe.insertBefore(wGlow, W);
  pulse(wGlow, tFlow + 0.45, 0.9, 0.7);
  // out of the tile: the rotation 'position 5' on the arrow, then the key
  const tPos = T('b1~position#2') - 0.1;
  const arr = S.path({ d: 'M1024,560 H1144 M1134,552 L1145,560 L1134,568', stroke: 'ink', sw: 2.5 }, pipe);
  arr.setAttribute('data-audit', 'ignore');
  K.draw(arr, 150, tPos - 0.3, 0.35);
  const rot = S.g(null, pipe);
  S.circle({ x: 1084, y: 560, r: 21, fill: CH14.BASE, stroke: 'ink', sw: 2 }, rot);
  S.icon('ph:arrows-clockwise-bold', { x: 1084, y: 560, size: 26, color: 'ink' }, rot);
  K.track(rot, [K.K(tPos, { s: 1.8, o: 0 }), K.K(tPos + 0.3, { s: 1, o: 1, e: 'power4.in' })], 1084, 560);
  const posL = S.text('position 5', { x: 1092, y: 608, size: 22, weight: 650, anchor: 'middle', color: 'muted' }, pipe);   // clear of the W_K tile
  hide(posL);
  fade(posL, 0, 1, tPos + 0.3, 0.3);
  const key = ch14Bar(S, { x: 1262, y: 560, n: 8, cw: 24, ch: 46, seed: 11, label: 'key', labelGap: 40 }, pipe);
  hide([key.holder, key.labelEl]);
  const tKey = T('b1~key#2') - 0.2;
  S.add(K.drive(0.5, k => { setO(key.holder, k); key.holder.setAttribute('transform', `translate(${(-40 * (1 - E('power3.out')(k))).toFixed(1)},0)`); }), tKey);
  fade(key.labelEl, 0, 1, tKey + 0.3, 0.3);

  // ================================================================ b2: change token two
  fade([hdr, pipe], 1, 0.3, tB2, 0.5);
  const right = S.g();
  const PW = 66, PG = 10, RX = 1480, px = j => RX + j * (PW + PG) + PW / 2;
  const strip = (y, name, changed, at) => {
    const g = S.g(null, right);
    S.text(name, { x: RX, y: y - 44, size: 24, weight: 700, color: 'muted' }, g);
    const pills = ['t1', changed ? 'XX' : 't2', 't3', 't4', 't5'].map((s, j) => {
      const p = S.g(null, g);
      libToken(S, { text: s, x: px(j), y, size: 24, w: PW, state: j === 1 && changed ? 'changed' : j === 4 ? 'new' : 'token' }, p);
      return p;
    });
    hide(g);
    fade(g, 0, 1, at, 0.4);
    return pills;
  };
  const orig = strip(380, 'original', false, T('b2~Nothing') + 0.1), chg = strip(520, 'changed', true, T('b2~Change') - 0.1);
  // t5 leaves each strip for its own input box; t1 … t4 stay behind, greyed
  const tDrop = T('b2~that') - 0.1;
  [orig, chg].forEach(ps => fade(ps.slice(0, 4), 1, 0.35, tDrop + 0.2, 0.4));
  const BOXY = [650, 760];
  const ibs = BOXY.map((y, i) => {
    const g = S.g(null, right);
    g.box = S.rect({ x: 1525, y: y - 34, w: 280, h: 68, r: 12, fill: CH14.BASE, stroke: 'struct', strokeOpacity: 0.8, sw: 2.5 }, g);
    g.bar = ch14Bar(S, { x: 1665, y, n: 9, cw: 24, ch: 34, seed: 7 }, g);
    g.tint = S.rect({ x: 1525, y: y - 34, w: 280, h: 68, r: 12, fill: 'helps', opacity: 0 }, g);
    g.tint.setAttribute('data-audit', 'ignore');
    hide(g);
    fade(g, 0, 1, tDrop + 0.1 * i, 0.3);
    hide(g.bar.holder);
    fade(g.bar.holder, 0, 1, tDrop + 0.5 + 0.1 * i, 0.25);
    return g;
  });
  [orig, chg].forEach((ps, i) => {
    const p = ps[4], y0 = i ? 520 : 380;
    K.ignore(p, tDrop - 0.05, 0.7);
    whole(t => {
      const k = EIO(cl((t - tDrop - 0.1 * i) / 0.5));
      p.setAttribute('transform', `translate(${lerp(0, 1665 - px(4), k).toFixed(1)},${lerp(0, BOXY[i] - y0, k).toFixed(1)}) scale(${lerp(1, 0.6, k).toFixed(3)})`);
      p.style.opacity = (1 - cl((t - tDrop - 0.1 * i - 0.42) / 0.12)).toFixed(3);
      p.style.visibility = p.style.opacity > 0 ? 'inherit' : 'hidden';
    });
  });
  // bit for bit: the boxes overlay, 8,192 numbers, both teal, '= identical'
  const tBit = T('b2~bit') - 0.1, tId = T('b2~identical') - 0.1;
  K.track(ibs[1], [K.K(tBit, { y: 0 }), K.K(tBit + 0.5, { y: -110 })]);
  const rd = S.text('', { x: 1665, y: 720, size: 26, weight: 700, family: 'mono', anchor: 'middle', color: 'ink' }, right);
  whole(t => { rd.textContent = `${Math.round(8192 * E('power2.out')(cl((t - tBit - 0.4) / 0.8))).toLocaleString('en-US')} numbers`; setO(rd, cl((t - tBit - 0.4) / 0.2)); });
  ibs.forEach(g => whole(t => {
    const k = cl((t - tId) / 0.4);
    g.box.setAttribute('stroke', S.tone(k > 0.5 ? 'helps' : 'struct'));
    g.tint.setAttribute('opacity', (0.18 * k).toFixed(3));
  }));
  const ident = S.pill('= identical', { x: 1665, y: 588, tone: 'helps', size: 26, h: 44 }, right);
  hide(ident);
  S.add(K.drive(0.3, k => { setO(ident, k); ident.setAttribute('transform', `translate(1665,588) scale(${lerp(1.6, 1, E('power4.in')(k)).toFixed(3)}) translate(-1665,-588)`); }), tId + 0.2);
  const banner = S.g();
  S.rect({ x: 420, y: 512, w: 1040, h: 92, r: 18, fill: '#0c1326', fillOpacity: 0.95, stroke: 'helps', sw: 3 }, banner);
  S.text('at layer 1: right', { x: 940, y: 559, size: 44, weight: 800, anchor: 'middle', color: 'helps' }, banner);
  K.track(banner, [K.K(T('b2~exactly') - 0.15, { x: -260, o: 0 }), K.K(T('b2~exactly') + 0.35, { x: 0, o: 1, e: 'power3.out' }), K.K(tB3, { o: 1 }), K.K(tB3 + 0.4, { o: 0 })]);
  fade(right, 1, 0, tB3, 0.4);
  // the banner lies over the dimmed pipeline on purpose
  K.ignore(pipe, T('b2~exactly') - 0.2, tB3 + 0.5 - (T('b2~exactly') - 0.2));

  // ================================================================ b3: a table would do; one-layer model only
  const tbl = S.g();
  const COLS = [[650, 'token'], [810, 'position'], [1030, 'layer-1 K, V']];
  S.rect({ x: 540, y: 762, w: 640, h: 220, r: 16, fill: CH14.BASE, stroke: '#ffffff', strokeOpacity: 0.18, sw: 2 }, tbl);
  COLS.forEach(([x, s]) => S.text(s, { x, y: 792, size: 24, weight: 700, anchor: 'middle', color: 'muted' }, tbl));
  S.path({ d: 'M560,814 H1160', stroke: '#ffffff', strokeOpacity: 0.15, sw: 1.5 }, tbl);
  [['token 2', '1', 846], ['token 5', '5', 900], ['token 9', '3', 954]].forEach(([a, b, y], i) => {
    S.text(a, { x: 650, y, size: 26, weight: 650, anchor: 'middle', color: i === 1 ? 'ink' : 'muted' }, tbl);
    S.text(b, { x: 810, y, size: 26, weight: 650, family: 'mono', anchor: 'middle', color: i === 1 ? 'ink' : 'muted' }, tbl);
    if (i !== 1) S.text('…', { x: 1030, y: y - 4, size: 28, weight: 700, anchor: 'middle', color: 'faint' }, tbl);
  });
  const tTbl = T('b3~Token') + 0.2, tOne = T('b3~onelayer') - 0.1;
  hide(tbl);
  fade(tbl, 0, 1, tTbl, 0.45);
  const kvb = S.g();
  const kB = ch14Bar(S, { x: 985, y: 900, n: 5, cw: 13, ch: 24, gap: 2, seed: 11, tone: 'helps' }, kvb);
  const vB = ch14Bar(S, { x: 1078, y: 900, n: 5, cw: 13, ch: 24, gap: 2, seed: 12, tone: 'helps' }, kvb);
  [[kB, T('b3~key') - 0.1], [vB, T('b3~value') - 0.1]].forEach(([b, at]) => K.track(b.holder, [K.K(at, { y: -80, o: 0 }), K.K(at + 0.45, { y: 0, o: 1, e: 'bounce.out' })]));
  const tp = S.path({ d: 'M0,0 L-14,-9 L-14,9 Z', fill: 'helps' }, tbl);
  const tPtr = T('b3~table') - 0.1;
  whole(t => tp.setAttribute('transform', `translate(554,${lerp(846, 900, EIO(cl((t - tPtr) / 0.5))).toFixed(1)})`));
  const rowHi = S.rect({ x: 560, y: 878, w: 600, h: 44, r: 8, stroke: 'helps', sw: 2 }, tbl);
  hide(rowHi);
  fade(rowHi, 0, 1, tPtr + 0.45, 0.25);
  fade([tbl, kvb], 1, 0, tOne, 0.4);
  // two sentences, 'bank' in slot 5 of each
  const sent = S.g();
  const SW = 110, SG = 12, SX = 480, sx = j => SX + j * (SW + SG) + SW / 2;
  const banks = [['we', 'sat', 'by', 'the', 'bank', 800], ['she', 'paid', 'at', 'the', 'bank', 900]].map((ws, i) => {
    const y = ws[5];
    let last;
    ws.slice(0, 5).forEach((w, j) => { const p = S.g(null, sent); libToken(S, { text: w, x: sx(j), y, size: 26, w: SW, state: j === 4 ? 'new' : 'token' }, p); K.track(p, [K.K(tOne + 0.3 + 0.05 * j + 0.15 * i, { x: -20, o: 0 }), K.K(tOne + 0.7 + 0.05 * j + 0.15 * i, { x: 0, o: 1, e: 'power3.out' })]); last = p; });
    return last;
  });
  const corner = ch14Tag(S, 'one-layer model only', { x: 1860, y: 128, anchor: 'end' });
  hide(corner);
  fade(corner, 0, 1, tOne + 0.2, 0.35);
  const card = S.g();
  S.rect({ x: 1290, y: 792, w: 360, h: 116, r: 16, fill: CH14.BASE, stroke: '#ffffff', strokeOpacity: 0.22, sw: 2 }, card);
  S.text('prefix rule', { x: 1470, y: 828, size: 28, weight: 750, anchor: 'middle', color: 'ink' }, card);
  const card2 = S.text('reuse stops at first change', { x: 1470, y: 872, size: 22, weight: 600, anchor: 'middle', color: 'muted' }, card);
  hide([card, card2]);
  fade(card, 0, 1, T('b3~prefix') - 0.1, 0.35);
  fade(card2, 0, 1, T('b3~stops') - 0.1, 0.35);
  const bankGlow = [800, 900].map(y => { const r = S.rect({ x: sx(4) - 70, y: y - 34, w: 140, h: 68, r: 20, fill: 'url(#pglow-helps)', opacity: 0 }, sent); r.setAttribute('data-audit', 'ignore'); sent.insertBefore(r, sent.firstChild); return r; });
  bankGlow.forEach(r => pulse(r, T('b3~Same') - 0.1, 1, 1.2));
  const link = S.path({ d: `M${sx(4) + SW / 2 + 6},800 C${sx(4) + SW / 2 + 70},800 ${sx(4) + SW / 2 + 70},900 ${sx(4) + SW / 2 + 6},900`, stroke: 'helps', sw: 3 }, sent);
  link.setAttribute('data-audit', 'ignore');
  const tReu = T('b3~reusable') - 0.1;
  K.draw(link, 200, tReu, 0.45);
  const reu = S.text('reusable', { x: sx(4) + SW / 2 + 62, y: 850, size: 24, weight: 750, color: 'helps' }, sent);
  hide(reu);
  fade(reu, 0, 1, tReu + 0.3, 0.3);
  const tWh = T('b3~whatever') - 0.1;
  const strike = S.path({ d: 'M1300,850 H1640', stroke: 'muted', sw: 3.5 }, card);
  strike.setAttribute('data-audit', 'ignore');
  K.draw(strike, 350, tWh, 0.35);
  fade(card, 1, 0.45, tWh + 0.4, 0.4);
  fade([sent, card, corner], 1, 0, tB4, 0.4);
  void banks;

  // ================================================================ b4: independent for exactly one layer
  const tGrant = T('b4~grant') - 0.1, tExact = T('b4~exactly') - 0.1;
  fade(pipe, 0.3, 0, tGrant, 0.4);
  const slab1 = S.g();
  const s1 = S.rect({ x: 960, y: 600, w: 0, h: 74, r: 14, fill: 'url(#card-struct)', stroke: 'struct', sw: 2.5 }, slab1);
  whole(t => { const k = EIO(cl((t - tGrant) / 0.6)); s1.setAttribute('x', lerp(960, 560, k).toFixed(1)); s1.setAttribute('width', (800 * k).toFixed(1)); });
  const s1L = S.text('layer 1', { x: 600, y: 638, size: 30, weight: 750, color: 'ink' }, slab1);
  const tick = S.g(null, slab1);
  S.circle({ x: 1310, y: 637, r: 22, fill: 'helps' }, tick);
  S.path({ d: 'M1299,637 L1307,646 L1322,628', stroke: '#0a0f1e', sw: 4 }, tick);
  hide(s1L);
  fade(s1L, 0, 1, tGrant + 0.5, 0.3);
  K.track(tick, [K.K(tGrant + 0.6, { s: 0.4, o: 0 }), K.K(tGrant + 1.0, { s: 1, o: 1, e: 'back.out(2.5)' })], 1310, 637);
  const slab2 = S.g();
  const s2 = S.rect({ x: 560, y: 496, w: 800, h: 74, r: 14, stroke: 'struct', strokeOpacity: 0.7, sw: 2.5 }, slab2);
  K.draw(s2, 1800, tExact, 0.6);
  const s2L = S.text('layer 2', { x: 600, y: 534, size: 30, weight: 750, color: 'muted' }, slab2);
  const q = S.text('?', { x: 1310, y: 536, size: 48, weight: 800, anchor: 'middle', color: 'ink' }, slab2);
  hide([s2L, q]);
  fade(s2L, 0, 1, tExact + 0.3, 0.3);
  fade(q, 0, 1, tExact + 0.5, 0.3);
  const take = S.takeaway('independent for exactly one layer', { tone: 'helps' });
  hide(take);
  fade(take, 0, 1, tExact + 0.3, 0.5);
  void fx; void tB2;
});
