/* ch14_s03 · attention mixes, so the same matrix gets a different vector (figs 41, 42)
   Checked: weights 0.1, 0.3, 0.1, 0.2, 0.3 (sum 1); values 10 … 50 → products 1, 6, 3, 8, 15 → 33; token 2's
   value 20 → 60: its product 6 → 18, the blend 33 → 45. Lane j carries strands from lanes 1 … j (lane 1 one,
   lane 5 five); 80 layers: one key (layer 1) the same, 79 different.
   b1  pills, lanes (the residual stream) and slab 1; attention at position 5: query, keys, weight bars to scale,
       threads into 'blend of all five'; the stand-in arithmetic panel: 33, then t2 → XX, 20 → 60, 6 → 18, 45.
   b2  the blend passes 'combine' and is added into lane 5 at '+'; lane 5 above it woven with five strands
       (t1, t3, t4, t5 blues, XX violet); the header 'What layer 1 hands upward' / 'at position 5'.
   b3  every lane above slab 1 gains its strands; caption 'the purpose of the layer'.
   b4  the lanes shrink into the left third; a 2 × 2 grid (original / token 2 changed × layer 1 / layer 2) of
       vertical pipelines: layer 1 same input, same key; layer 2 same matrix, different input, different key.
   b5  the camera pulls back to lane 5 rising through 80 slabs, richer toward the top; 80 key slots, 1 same,
       79 different; all but the lane and one padlocked W_K dims; the two-line caption.
   Layout: lanes x 160 + 170 j, pills y 900, lanes y 220-870; slab 1 x 80-930, y 640-800; slab 2 y 300-360;
   blend box (840, 575); combine (840, 505); '+' (840, 452); panel x 1180-1870, y 340-720; grid columns 1080 /
   1560 ('=' at 1320), rows 'layer 2' y 280-540 and 'layer 1' y 580-840. */
V.scene('ch14_s03', S => {
  const K = libKit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1, tB5 = T('b5') - 0.1;
  const LX = j => 160 + 170 * j, VIOLET = S.tone('violet');
  const SC = ['#a9cbff', VIOLET, '#6ea8ff', '#4f8fef', '#3a73d6'];   // strand colours: t1, XX, t3, t4, t5
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };

  // ================================================================ b1: tokens, lanes, slabs
  const world = S.g();
  const lanes = S.g(null, world), lane5 = S.g(null, world);
  const bands = [0, 1, 2, 3, 4].map(j => {
    const b = S.rect({ x: LX(j) - 7, y: 220, w: 14, h: 650, r: 7, fill: 'struct', opacity: 0.28 }, j === 4 ? lane5 : lanes);
    whole(t => { const k = EIO(cl((t - 0.5 - 0.08 * j) / 0.9)); b.setAttribute('y', (870 - 650 * k).toFixed(1)); b.setAttribute('height', (650 * k).toFixed(1)); });
    return b;
  });
  const pills = [0, 1, 2, 3, 4].map(j => {
    const g = S.g(null, j === 4 ? lane5 : lanes);
    const tk = libToken(S, { text: `t${j + 1}`, x: LX(j), y: 900, size: 30, w: 96, state: j === 4 ? 'new' : 'token' }, g);
    K.track(g, [K.K(0.3 + 0.06 * j, { y: 20, o: 0 }), K.K(0.7 + 0.06 * j, { y: 0, o: 1, e: 'power3.out' })]);
    return tk;
  });
  const slab1 = S.g(null, lanes);
  S.rect({ x: 80, y: 640, w: 850, h: 160, r: 16, fill: '#16203a', fillOpacity: 0.7, stroke: 'struct', strokeOpacity: 0.55, sw: 2 }, slab1);
  S.text('layer 1', { x: 98, y: 664, size: 22, weight: 700, color: 'muted' }, slab1);
  const slab2 = S.g(null, lanes);
  S.rect({ x: 80, y: 300, w: 850, h: 60, r: 14, fill: '#16203a', fillOpacity: 0.4, stroke: 'struct', strokeOpacity: 0.25, sw: 2 }, slab2);
  S.text('layer 2', { x: 98, y: 330, size: 22, weight: 700, color: 'faint' }, slab2);
  hide([slab1, slab2]);
  fade(slab1, 0, 1, 1.1, 0.5);
  fade(slab2, 0, 1, 1.4, 0.5);

  // ---------------------------------------------------------------- attention at position 5
  const att = S.g(null, lanes);
  const WTS = [0.1, 0.3, 0.1, 0.2, 0.3];
  const tBl = T('b1~blends') - 0.1;
  const keys = [0, 1, 2, 3, 4].map(j => S.icon('ph:key-duotone', { x: LX(j), y: 776, size: 28, color: 'struct' }, att));
  const qI = S.icon('ph:magnifying-glass-duotone', { x: 886, y: 700, size: 38, color: 'ink' }, att);
  const qGlow = S.circle({ x: 886, y: 700, r: 30, fill: 'url(#pglow-struct)', opacity: 0 }, att);
  qGlow.setAttribute('data-audit', 'ignore');
  att.insertBefore(qGlow, qI);
  pulse(qGlow, tBl, 1, 0.8);
  const dashes = [0, 1, 2, 3, 4].map(j => {
    const p = S.path({ d: `M870,712 C${lerp(870, LX(j), 0.4)},${740} ${LX(j) + 20},${748} ${LX(j) + 10},${760}`, stroke: 'ink', strokeOpacity: 0.55, sw: 1.8, dash: '4 5' }, att);
    p.setAttribute('data-audit', 'ignore');
    hide(p);
    fade(p, 0, 1, tBl + 0.1 + 0.05 * (4 - j), 0.3);
    return p;
  });
  const bars = WTS.map((w, j) => {
    const r = S.rect({ x: LX(j) + 14, y: 760, w: 16, h: 0, r: 3, fill: 'url(#solid-compute)' }, att);
    whole(t => { const h = 180 * w * E('power3.out')(cl((t - tBl - 0.4 - 0.06 * j) / 0.5)); r.setAttribute('y', (760 - h).toFixed(1)); r.setAttribute('height', h.toFixed(1)); });
    const l = S.text(String(w), { x: LX(j) + 22, y: 760 - 180 * w - 16, size: 20, weight: 700, family: 'mono', anchor: 'middle', color: 'compute' }, att);
    hide(l);
    fade(l, 0, 1, tBl + 0.8 + 0.06 * j, 0.3);
    return r;
  });
  hide([...keys, qI]);
  fade(keys, 0, 1, tBl - 0.2, 0.3, 0.04);
  fade(qI, 0, 1, tBl - 0.1, 0.3);
  const threads = [0, 1, 2, 3, 4].map(j => {
    const p = S.path({ d: `M${LX(j)},640 C${LX(j)},610 ${lerp(LX(j), 840, 0.6)},606 840,598`, stroke: 'struct', sw: 2.5 }, att);
    p.setAttribute('data-audit', 'ignore');
    K.draw(p, 760, tBl + 1.0 + 0.06 * j, 0.5);
    return p;
  });
  const blend = S.g(null, lane5);
  S.rect({ x: 745, y: 552, w: 190, h: 46, r: 12, fill: 'url(#card-struct)', stroke: 'struct', sw: 2.5 }, blend);
  S.text('blend of all five', { x: 840, y: 576, size: 22, weight: 700, anchor: 'middle', color: 'ink' }, blend);
  const illus = ch14Tag(S, 'illustrative, weights held fixed', { x: 1525, y: 296, size: 22 });
  hide(illus);
  fade(illus, 0, 1, T('b1~weighted') - 0.1, 0.35);
  void bars; void threads; void dashes;

  // ---------------------------------------------------------------- the stand-in arithmetic panel
  const pan = S.g();
  S.rect({ x: 1180, y: 340, w: 690, h: 380, r: 18, fill: CH14.BASE, stroke: '#ffffff', strokeOpacity: 0.16, sw: 2 }, pan);
  const CX = i => 1360 + 115 * i, RY = { w: 410, v: 490, p: 570 };
  [['weight', 'compute', RY.w], ['value', 'struct', RY.v], ['product', 'compute', RY.p]].forEach(([s, c, y]) => S.text(s, { x: 1294, y, size: 22, weight: 700, anchor: 'end', color: c }, pan));
  WTS.forEach((w, i) => S.text(String(w), { x: CX(i), y: RY.w, size: 30, weight: 700, family: 'mono', anchor: 'middle', color: 'compute' }, pan));
  const tPan = T('b1~stand') - 0.1;
  hide(pan);
  fade(pan, 0, 1, tPan, 0.4);
  const VALS = [10, 20, 30, 40, 50], PRODS = [1, 6, 3, 8, 15];
  const tV = [0, 1, 2, 3, 4].map(i => T('b1~ten') - 0.15 + 0.17 * i);
  const vEl = VALS.map((v, i) => { const e = S.text(String(v), { x: CX(i), y: RY.v, size: 30, weight: 700, family: 'mono', anchor: 'middle', color: 'struct' }, pan); rise(e, tV[i], -10, 0.25); return e; });
  const pEl = PRODS.map((p, i) => { const e = S.text(String(p), { x: CX(i), y: RY.p, size: 30, weight: 700, family: 'mono', anchor: 'middle', color: 'compute' }, pan); rise(e, tV[i] + 0.12, -10, 0.25); return e; });
  // the products slide together into '= 33'
  const tSum = T('b1~thirty') - 0.15;
  const fly = PRODS.map((p, i) => {
    const e = S.text(String(p), { x: CX(i), y: RY.p, size: 30, weight: 700, family: 'mono', anchor: 'middle', color: 'compute' }, pan);
    e.setAttribute('data-audit', 'ignore');
    whole(t => {
      const k = EIO(cl((t - tSum) / 0.5));
      e.setAttribute('transform', `translate(${(lerp(CX(i), 1530, k) - CX(i)).toFixed(1)},${(lerp(RY.p, 662, k) - RY.p).toFixed(1)})`);
      setO(e, t > tSum && k < 1 ? 1 - 0.6 * k : 0);
    });
    return e;
  });
  const s33 = S.text([{ t: '= ', c: 'muted' }, { t: '33', c: 'ink' }], { x: 1530, y: 664, size: 44, weight: 800, family: 'mono', anchor: 'middle' }, pan);
  rise(s33, tSum + 0.4, 10, 0.3);
  // token two changes
  const tChg = T('b1~Change') - 0.1, t60 = T('b1~sixty') - 0.1, t45 = T('b1~forty') - 0.1;
  S.add(pills[1].swap('XX', { state: 'changed' }), tChg);
  S.add(ch14Retext(vEl[1], '20', '60'), tChg + 0.4);
  whole(t => vEl[1].setAttribute('fill', t > tChg + 0.6 ? VIOLET : S.tone('struct')));
  S.add(ch14Retext(pEl[1], '6', '18'), t60);
  whole(t => pEl[1].setAttribute('fill', t > t60 + 0.2 ? VIOLET : S.tone('compute')));
  const strike = S.path({ d: 'M1530,664 H1592', stroke: 'ink', sw: 4 }, pan);
  strike.setAttribute('data-audit', 'ignore');
  K.draw(strike, 70, t45, 0.25);
  const s45 = S.text('45', { x: 1660, y: 664, size: 44, weight: 800, family: 'mono', anchor: 'middle', color: 'violet' }, pan);
  rise(s45, t45 + 0.2, 10, 0.3);
  fade([pan, illus], 1, 0, tB2, 0.4);
  void fly;

  // ================================================================ b2: added into position 5's stream
  const tComb = T('b2~combine') - 0.1;
  const comb = S.g(null, lane5);
  S.rect({ x: 775, y: 486, w: 130, h: 40, r: 10, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.3, sw: 2 }, comb);
  S.text('combine', { x: 840, y: 507, size: 22, weight: 700, anchor: 'middle', color: 'ink' }, comb);
  const plus = S.g(null, lane5);
  S.circle({ x: 840, y: 452, r: 18, fill: CH14.BASE, stroke: 'ink', sw: 2.5 }, plus);
  S.text('+', { x: 840, y: 453, size: 30, weight: 700, anchor: 'middle', color: 'ink' }, plus);
  hide([comb, plus]);
  fade(comb, 0, 1, tComb, 0.3);
  fade(plus, 0, 1, tComb + 0.5, 0.3);
  // the blend box rises through combine and drops into the lane at '+'
  K.track(blend, [K.K(tBl + 1.3, { y: 10, o: 0 }), K.K(tBl + 1.7, { y: 0, o: 1, e: 'power3.out' }), K.K(tComb + 0.2, { y: 0, s: 1, o: 1 }), K.K(tComb + 0.7, { y: -70, s: 0.7, o: 0.9 }), K.K(tComb + 1.1, { y: -123, s: 0.2, o: 0 })], 840, 575);
  K.ignore(blend, tComb + 0.2, 1.0);   // it passes through 'combine' on purpose
  const added = S.text('added at position 5', { x: 872, y: 452, size: 22, weight: 650, color: 'muted' }, lane5);
  hide(added);
  fade(added, 0, 1, tComb + 1.0, 0.3);
  fade(added, 1, 0, tB3 + 0.4, 0.3);
  // strands: lane j carries one strand per lane 0 … j, from y0 up to 220
  const strands = (j, y0, at, parent) => {
    const g = S.g(null, parent);
    g.setAttribute('data-audit', 'ignore');
    for (let k = 0; k <= j; k++) {
      let d = '';
      for (let y = y0; y >= 220; y -= 6) d += `${d ? 'L' : 'M'}${(LX(j) + 4.5 * Math.sin((y0 - y) / 26 + k * 1.3)).toFixed(1)},${y}`;
      const p = S.path({ d, stroke: SC[k], sw: 2.2 }, g);
      K.draw(p, (y0 - 220) * 1.35, at + 0.08 * k, 0.8);
    }
    return g;
  };
  strands(4, 434, tComb + 1.2, lane5);
  const hd1 = S.text('What layer 1 hands upward', { x: 1300, y: 150, size: 42, weight: 750, anchor: 'middle', color: 'ink' });
  const hd2 = S.text('at position 5', { x: 1300, y: 200, size: 30, weight: 600, anchor: 'middle', color: 'muted' });
  rise(hd1, T('b2~what') - 0.1);
  rise(hd2, T('b2~what') + 0.2);
  fade([hd1, hd2], 1, 0, tB4, 0.4);
  const tEv = T('b2~every') - 0.1;
  ['t1', 'XX', 't3', 't4', 't5'].forEach((s, k) => {
    const e = S.text(s, { x: 870, y: 252 + 30 * k, size: 20, weight: 750, family: 'mono', color: k === 1 ? 'violet' : 'struct' }, lane5);
    hide(e);
    fade(e, 0, 1, tEv + 0.06 * k, 0.25);
    fade(e, 1, 0, tEv + 1.3, 0.35);
  });

  // ================================================================ b3: every lane carries its context
  [0, 1, 2, 3].forEach(j => strands(j, 634, tB3 + 0.2 + 0.25 * j, lanes));
  const cap = S.text('the purpose of the layer', { x: 1400, y: 560, size: 44, weight: 800, anchor: 'middle', color: 'ink' });
  rise(cap, T('b3~purpose') - 0.1);
  fade(cap, 1, 0, tB4, 0.35);

  // ================================================================ b4: same matrix, different vector, different key
  // the lanes picture shrinks into the left third; all but lane 5 dims
  K.track(world, [K.K(tB4, { s: 1 }), K.K(tB4 + 0.8, { s: 0.62 })], 60, 990);
  fade(lanes, 1, 0.3, tB4 + 0.2, 0.5);
  // shrunk into the left third it is a picture, not text to read
  K.ignore(world, tB4 + 0.05, tB5 - tB4 + 0.5);
  const grid = S.g();
  const CA = 1080, CB = 1560, CM = 1320;
  S.text('original', { x: CA, y: 236, size: 30, weight: 750, anchor: 'middle', color: 'ink' }, grid);
  S.text('token 2 changed', { x: CB, y: 236, size: 30, weight: 750, anchor: 'middle', color: 'violet' }, grid);
  S.text('layer 2', { x: 780, y: 410, size: 28, weight: 750, anchor: 'end', color: 'muted' }, grid);
  S.text('layer 1', { x: 780, y: 710, size: 28, weight: 750, anchor: 'end', color: 'muted' }, grid);
  S.path({ d: 'M800,560 H1840', stroke: '#ffffff', strokeOpacity: 0.12, sw: 1.5 }, grid);
  hide(grid);
  fade(grid, 0, 1, tB4 + 0.5, 0.5);
  const cell = (cx, y0, label, keyTone, tIn, tTile, tKey, strand) => {
    const g = S.g(null, grid);
    const chip = S.g(null, g);
    S.rect({ x: cx - 120, y: y0, w: 240, h: 46, r: 12, fill: 'url(#card-struct)', stroke: 'struct', sw: 2.5 }, chip);
    S.text(label, { x: cx, y: y0 + 21, size: 22, weight: 700, anchor: 'middle', color: 'ink' }, chip);
    if (strand) S.path({ d: `M${cx - 96},${y0 + 38} q12,-6 24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0`, stroke: strand, sw: 2.5 }, chip).setAttribute('data-audit', 'ignore');
    const x = ch14Op(S, '×', { x: cx, y: y0 + 78, size: 44 }, g);
    const tile = ch14Matrix(S, { x: cx, y: y0 + 150, size: 84, name: null, seed: y0 < 500 ? 2 : 1, lockR: 18 }, g);
    const key = ch14Bar(S, { x: cx, y: y0 + 232, n: 7, cw: 22, ch: 30, seed: keyTone === 'violet' ? 23 : y0 < 500 ? 17 : 11, tone: keyTone }, g);
    hide([chip, x, tile, key.holder]);
    fade(chip, 0, 1, tIn, 0.35);
    fade([x, tile], 0, 1, tTile, 0.35);
    S.add(tile.lock({ d: 0.3 }), tTile + 0.2);
    S.add(K.drive(0.4, k => { setO(key.holder, k); key.holder.setAttribute('transform', `translate(0,${(-14 * (1 - E('power3.out')(k))).toFixed(1)})`); }), tKey);
    return { g, chip };
  };
  const tSame = T('b4~same') - 0.1, tSame2 = T('b4~same#2') - 0.1, tL2 = T('b4~same#3') - 0.1;
  const tDiff = T('b4~different') - 0.1, tDiff2 = T('b4~different#2') - 0.1;
  cell(CA, 584, "token 5's row", 'helps', tSame, tSame2, tSame2 + 0.3);
  cell(CB, 584, "token 5's row", 'helps', tSame + 0.1, tSame2 + 0.1, tSame2 + 0.4);
  const top = [cell(CA, 284, "layer 1's output", 'struct', tDiff, tL2, tDiff2, SC[2]), cell(CB, 284, "layer 1's output", 'violet', tDiff + 0.1, tL2 + 0.1, tDiff2 + 0.1, VIOLET)];
  // the top chips rise out of lane 5 (shrunk: x ≈ 544) into their cells
  top.forEach(c => K.ignore(c.chip, tDiff - 0.05, 0.9));
  top.forEach((c, i) => K.track(c.chip, [K.K(tDiff + 0.1 * i, { x: 544 - (i ? CB : CA), y: 280, s: 0.4 }), K.K(tDiff + 0.1 * i + 0.7, { x: 0, y: 0, s: 1 })], i ? CB : CA, 307));
  const sign = (s, y, tone, at) => { const e = S.text(s, { x: CM, y, size: 40, weight: 800, anchor: 'middle', color: tone }, grid); hide(e); S.add(K.drive(0.3, k => { setO(e, k); e.setAttribute('transform', `translate(${CM},${y}) scale(${lerp(1.6, 1, E('power4.in')(k)).toFixed(3)}) translate(${-CM},${-y})`); }), at); return e; };
  sign('=', 607, 'helps', tSame + 0.4);
  sign('=', 734, 'helps', tSame2 + 0.3);
  sign('=', 816, 'helps', tSame2 + 0.6);
  sign('=', 434, 'helps', tL2 + 0.4);
  sign('≠', 307, 'ink', tDiff + 0.8);
  sign('≠', 516, 'ink', tDiff2 + 0.5);
  const cap2 = S.text('context in the vector, context in the key', { x: 1320, y: 920, size: 36, weight: 800, anchor: 'middle', color: 'ink' });
  rise(cap2, T('b4~contextfree') - 0.1);
  fade([grid, cap2], 1, 0, tB5, 0.4);

  // ================================================================ b5: eighty times over
  fade(world, 1, 0, tB5, 0.4);
  const st = S.g();
  const SX = 900, SB = 930, PIT = 9.5, sY = i => SB - 10 - PIT * i;   // slab i (0 … 79)
  const tPull = tB5 + 0.3, tRun = T('b5~eighty') - 0.2;
  K.track(st, [K.K(tPull, { s: 1.7, o: 0 }), K.K(tPull + 1.0, { s: 1, o: 1, e: 'power2.out' })], SX, SB);
  // the lane: richer toward the top as each slab weaves in one more strand
  const lane = S.rect({ x: SX - 9, y: sY(79) - 10, w: 18, h: SB - sY(79) + 10, r: 9, fill: 'struct', opacity: 0.25 }, st);
  const wov = S.g(null, st);
  wov.setAttribute('data-audit', 'ignore');
  const slabsG = S.g(null, st);
  st.insertBefore(slabsG, lane);
  const slabs = Array.from({ length: 80 }, (_, i) => S.rect({ x: SX - 150, y: sY(i) - 1.5, w: 300, h: 3, r: 1.5, fill: 'struct', opacity: 0 }, slabsG));
  const fills = Array.from({ length: 80 }, (_, i) => S.rect({ x: SX - 7, y: sY(i) - PIT / 2, w: 14, h: PIT, fill: i ? VIOLET : 'struct', opacity: 0 }, wov));
  const cnt = S.text('layer 1', { x: SX - 170, y: SB - 10, size: 24, weight: 700, family: 'mono', anchor: 'end', color: 'muted' }, st);
  whole(t => {
    const n = Math.round(80 * cl((t - tRun) / 2.6));
    slabs.forEach((s, i) => s.setAttribute('opacity', (i < n ? 0.55 : 0.12).toFixed(2)));
    fills.forEach((f, i) => f.setAttribute('opacity', (i < n ? 0.15 + 0.6 * i / 79 : 0).toFixed(3)));
    cnt.textContent = `layer ${Math.max(1, n)}`;
    cnt.setAttribute('y', sY(Math.max(0, n - 1)).toFixed(1));
  });
  const thor = S.text('thoroughly contextual', { x: SX, y: sY(79) - 40, size: 30, weight: 750, anchor: 'middle', color: 'ink' }, st);
  hide(thor);
  fade(thor, 0, 1, tRun + 2.4, 0.4);
  // eighty key slots: the bottom one the same (teal), the 79 above it different (violet)
  const ks = S.g(null, st);
  const KX = 1200;
  const slots = Array.from({ length: 80 }, (_, i) => S.rect({ x: KX, y: sY(i) - 3, w: 40, h: 6, r: 2, fill: i ? VIOLET : 'helps', opacity: 0 }, ks));
  whole(t => { const n = Math.round(80 * cl((t - tRun - 0.4) / 2.4)); slots.forEach((s, i) => s.setAttribute('opacity', i < n ? 0.9 : 0)); });
  const kL = S.text('keys', { x: KX + 20, y: sY(79) - 40, size: 26, weight: 700, anchor: 'middle', color: 'muted' }, ks);
  const kC = S.text([{ t: '1 same', c: 'helps' }, { t: ', ', c: 'muted' }, { t: '79 different', c: 'violet' }], { x: KX + 64, y: sY(40), size: 30, weight: 750 }, ks);
  hide([kL, kC]);
  fade(kL, 0, 1, tRun + 0.4, 0.3);
  fade(kC, 0, 1, tRun + 2.6, 0.4);
  // never the weights: everything dims but the lane and one padlocked W_K
  const tNever = T('b5~never') - 0.1;
  fade([slabsG, ks, thor, cnt], 1, 0.3, tNever, 0.5);
  const Wk = ch14Matrix(S, { x: 560, y: 600, size: 130, name: 'K', seed: 1, locked: true, lockR: 22 });
  hide(Wk);
  fade(Wk, 0, 1, tNever, 0.4);
  const c1 = S.text('fixed function, changing input', { x: 1460, y: 820, size: 34, weight: 800, anchor: 'middle', color: 'ink' });
  const c2 = S.text('through the stream, never the weights', { x: 1460, y: 870, size: 28, weight: 650, anchor: 'middle', color: 'muted' });
  rise(c1, tNever + 0.3);
  rise(c2, tNever + 0.6);
  void bands; void lane; void tB2;
});
