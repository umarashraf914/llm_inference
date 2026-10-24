/* ch15_s02 · what the cache actually holds (figs 49, 50)
   Checked: the weather chat's keys and values, 1,032 × 327,680 = 338,165,760 bytes ≈ 0.338 GB ≈ 1/3 GB; its text
   ≈ 4 KB (4,000 bytes); to scale by area the 2 px blue square makes a coral square 2 × √84,541 = 581 px a side;
   > 80,000 ×. Prefill makes them at ≈ 2 × 70 billion = 140 billion operations per token.
   b1  heading; question and answer pills drift to the cache and stop, 'not stored here'; the service and its
       database take them; a pill runs laptop → service → GPU, 'sent every turn'.
   b2  'bank' passes the die; 80 K/V pairs rise (L1 … L80) and fold into one coral tile in an HBM stack; a later
       token attends to it; 'river · bank' and 'savings · bank' make different tiles, '≠'.
   b3  both halves shrink to the top corners; the weather tag; 4 KB as a 2 px square, 1/3 GB as a 581 px square
       on one baseline; '> 80,000 ×'; the amber 'prefill' arc and '≈ 140 billion operations per token'.
   b4  both return; the pill runs again; 'cheap · travels every turn'; the prefill arrow inside the GPU with
       'skipped on a hit'; 'expensive · what the cache is for'; the heading changes.
   Layout: laptop (160, 470); the service x 280-760, y 260-640; GPU package x 1040-1740, y 300-620 (die (1390, 460),
   HBM stacks x 1080-1180 and 1600-1700); label cards y 720; baseline y 960. */
V.scene('ch15_s02', S => {
  const K = libKit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const pillAt = (text, x, y, parent, o = {}) => { const g = S.g(null, parent); libToken(S, { text, x, y, size: o.size ?? 26, state: o.state || 'token', w: o.w }, g); return g; };

  const h1 = S.text('The cache holds no text, and no answers', { x: 960, y: 128, size: 44, weight: 750, anchor: 'middle', color: 'ink' });
  rise(h1, 0.4);

  // ================================================================ the two halves
  const left = S.g(), gpu = S.g();
  const laptop = S.icon('ph:laptop-duotone', { x: 160, y: 470, size: 110, color: 'struct' }, left);
  const bld = S.g(null, left);
  S.path({ d: 'M280,640 V330 L520,262 L760,330 V640 Z', fill: '#0e1528', stroke: 'struct', strokeOpacity: 0.8, sw: 2.5 }, bld);
  S.text('the service', { x: 520, y: 362, size: 26, weight: 700, anchor: 'middle', color: 'ink' }, bld);
  S.icon('ph:database-duotone', { x: 520, y: 466, size: 112, color: 'struct' }, bld);
  S.text("the service's database", { x: 520, y: 574, size: 22, weight: 650, anchor: 'middle', color: 'muted' }, bld);
  const tDb = T('b1~database') - 0.1;
  hide(laptop);
  fade(laptop, 0, 1, 0.6, 0.4);
  hide(bld);
  fade(bld, 0, 1, tDb, 0.5);
  // the GPU package: die and two HBM stacks; dashed blue outlines round the stacks only ('cache')
  S.rect({ x: 1040, y: 300, w: 700, h: 320, r: 20, fill: '#0e1528', stroke: '#ffffff', strokeOpacity: 0.14, sw: 2 }, gpu);
  const stacks = [1080, 1600].map(x => {
    const g = S.g(null, gpu);
    S.rect({ x, y: 330, w: 100, h: 260, r: 10, fill: '#2a1418', stroke: 'bytes', sw: 2 }, g);
    for (let i = 1; i < 8; i++) S.path({ d: `M${x + 8},${330 + i * 260 / 8} H${x + 92}`, stroke: 'bytes', strokeOpacity: 0.3, sw: 1.5 }, g);
    S.rect({ x: x - 12, y: 318, w: 124, h: 284, r: 14, stroke: 'struct', sw: 2.5, dash: '8 6' }, g);
    return g;
  });
  const die = libChip(S, { x: 1390, y: 460, size: 180, tone: 'compute', state: 'on', seed: 4 }, gpu);
  const cacheL = S.text('cache', { x: 1650, y: 646, size: 26, weight: 750, anchor: 'middle', color: 'struct' }, gpu);
  S.text('cache', { x: 1130, y: 646, size: 26, weight: 750, anchor: 'middle', color: 'struct' }, gpu);
  hide(gpu);
  fade(gpu, 0, 1, 0.5, 0.5);
  void stacks; void die; void cacheL;

  // ================================================================ b1: not stored here; a database; sent every turn
  const tNei = T('b1~neither') - 0.1;
  const qa = [["What's the weather in Seoul?", 820], ['Sunny tomorrow', 880]];
  const chats = qa.map(([s, y]) => pillAt(s, 760, y, null));
  chats.forEach(c => rise(c, tNei, 10, 0.3));
  // ghost copies drift to the cache and stop under a grey cross
  const ghosts = qa.map(([s, y], i) => {
    const g = pillAt(s, 760, y, null);
    K.track(g, [K.K(tNei + 0.2, { x: 0, y: 0, o: 0 }), K.K(tNei + 0.3, { o: 0.55 }), K.K(tNei + 1.4, { x: 240 - 40 * i, y: -380 - 20 * i, s: 0.6, o: 0.55 }), K.K(tDb - 0.3, { o: 0.55 }), K.K(tDb + 0.2, { o: 0 })], 760, y);
    K.ignore(g, tNei, tDb - tNei + 0.3);
    return g;
  });
  const cross = S.path({ d: 'M960,410 L1030,480 M1030,410 L960,480', stroke: 'muted', sw: 5 });
  cross.setAttribute('data-audit', 'ignore');
  K.draw(cross, 220, tNei + 1.4, 0.3);
  const notHere = S.pill('not stored here', { x: 940, y: 530, tone: 'neutral', size: 22, h: 36 });
  rise(notHere, tNei + 1.6, 8);
  fade([cross, notHere], 1, 0, tDb + 0.2, 0.3);
  // the chat slides into the database, with three more turns
  const more = [['Will it rain?', 640], ['No rain', 830], ['Thanks!', 980]].map(([s, x], i) => { const p = pillAt(s, x, 940, null, { size: 24 }); rise(p, tDb, 10, 0.3); return p; });
  [...chats, ...more].forEach((p, i) => {
    const [sx, sy] = i < 2 ? [760, qa[i][1]] : [[640, 830, 980][i - 2], 940];
    K.track(p, [K.K(tDb + 0.4 + 0.08 * i, { x: 0, y: 0, s: 1, o: 1 }), K.K(tDb + 1.1 + 0.08 * i, { x: 520 - sx, y: 470 - sy, s: 0.2, o: 0, e: 'power2.in' })], sx, sy);
    K.ignore(p, tDb + 0.3, 1.4);
  });
  const cardL = S.g(), cardR = S.g();
  const card = (g, text, tone, x) => {
    const w = S.measure(text, { size: 26, weight: 700 }) + 48;
    S.rect({ x: x - w / 2, y: 698, w, h: 48, r: 14, fill: `url(#card-${tone})`, stroke: tone, sw: 2.5 }, g);
    S.text(text, { x, y: 723, size: 26, weight: 700, anchor: 'middle', color: tone === 'bytes' ? 'bytes' : 'ink' }, g);
    return w;
  };
  card(cardL, 'the words: kept in a database', 'struct', 520);
  card(cardR, 'the keys and values: kept on the GPU', 'bytes', 1390);
  rise(cardL, tDb + 0.9, 10);
  // the words travel with every turn
  const run = (at) => {
    const p = S.g();
    libToken(S, { text: '', x: 0, y: 0, w: 46, h: 30, state: 'token' }, p);
    whole(t => {
      const k = cl((t - at) / 1.6), x = k < 0.45 ? lerp(220, 640, k / 0.45) : lerp(640, 1300, (k - 0.45) / 0.55);
      p.setAttribute('transform', `translate(${x.toFixed(1)},${lerp(470, 460, k).toFixed(1)})`);
      setO(p, k > 0 && k < 1 ? Math.min(1, k * 8, (1 - k) * 8) : 0);
    });
    p.setAttribute('data-audit', 'ignore');
    const tag = S.pill('sent every turn', { x: 900, y: 420, tone: 'neutral', size: 22, h: 36 });
    rise(tag, at + 0.6, 8);
    return tag;
  };
  const sent1 = run(T('b1~travel') - 0.1);
  fade(sent1, 1, 0, tB2, 0.3);

  // ================================================================ b2: what it does hold
  const tMade = T('b2~what') - 0.1, tL = T('b2~eighty') - 0.1, tLater = T('b2~later') - 0.1, tCtx = T('b2~its') - 0.1;
  const bank = pillAt('bank', 1000, 460, null);
  K.track(bank, [K.K(tMade, { x: -80, o: 0 }), K.K(tMade + 0.3, { x: 0, o: 1 }), K.K(tMade + 1.0, { x: 390, s: 0.5, o: 1 }), K.K(tMade + 1.3, { x: 390, s: 0.3, o: 0 })], 1000, 460);
  K.ignore(bank, tMade, 1.4);
  // the ladder of eighty K/V pairs rises out of the die, then folds into one tile
  const ladder = S.g();
  ladder.setAttribute('data-audit', 'ignore');
  const rungs = Array.from({ length: 80 }, (_, i) => {
    const g = S.g(null, ladder);
    S.rect({ x: 1360, y: 352 - 2.1 * i, w: 28, h: 1.6, fill: 'bytes' }, g);
    S.rect({ x: 1392, y: 352 - 2.1 * i, w: 28, h: 1.6, fill: '#ff9a9a' }, g);
    return g;
  });
  const lL1 = S.text('L1', { x: 1434, y: 352, size: 20, weight: 700, family: 'mono', color: 'bytes' });
  const lL80 = S.text('L80', { x: 1434, y: 186, size: 20, weight: 700, family: 'mono', color: 'bytes' });
  hide([lL1, lL80]);
  fade([lL1, lL80], 0, 1, tL + 0.4, 0.3);
  const tFold = tL + 1.5;
  fade([lL1, lL80], 1, 0, tFold, 0.25);
  whole(t => {
    const up = cl((t - tL) / 0.9), fold = EIO(cl((t - tFold) / 0.5));
    rungs.forEach((g, i) => {
      const vis = i / 80 < up ? 1 : 0;
      g.setAttribute('transform', `translate(0,${(2.1 * i * fold).toFixed(1)})`);
      g.setAttribute('opacity', (vis * (1 - cl((t - tFold - 0.45) / 0.1))).toFixed(2));
    });
  });
  const tile = S.g();
  S.rect({ x: -24, y: -14, w: 24, h: 28, r: 4, fill: 'url(#solid-bytes)' }, tile);
  S.rect({ x: 1, y: -14, w: 24, h: 28, r: 4, fill: '#9b3a44', stroke: 'bytes', sw: 1 }, tile);
  const tLand = tFold + 0.5;
  whole(t => {
    const k = EIO(cl((t - tLand) / 0.7));
    tile.setAttribute('transform', `translate(${lerp(1390, 1650, k).toFixed(1)},${(lerp(352, 520, k) - 60 * Math.sin(Math.PI * k)).toFixed(1)})`);
    // hidden while the halves are shrunk in b3, back with the GPU in b4
    setO(tile, (t > tLand ? 1 : 0) * (1 - cl((t - tB3) / 0.35)) + (t > tB4 + 0.8 ? cl((t - tB4 - 0.8) / 0.3) : 0));
  });
  rise(cardR, tLand + 0.6, 10);
  // a later token attends to it
  const later = pillAt('later', 1800, 470, null, { size: 24 });
  rise(later, tLater, 8, 0.3);
  const arcs = [-26, 0, 26].map((dy, i) => {
    const p = S.path({ d: `M1764,${470 + dy * 0.4} C1730,${470 + dy} 1700,${520 + dy} 1680,${520 + dy * 0.3}`, stroke: 'bytes', sw: 2 });
    p.setAttribute('data-audit', 'ignore');
    K.draw(p, 140, tLater + 0.3 + 0.1 * i, 0.4);
    return p;
  });
  // the same token in two contexts: two different tiles
  const ctx = S.g();
  const rows = [[['river', 1130], ['bank', 1250]], [['savings', 1510], ['bank', 1640]]];
  rows.forEach(r => r.forEach(([s, x]) => pillAt(s, x, 210, ctx, { size: 24 })));
  const ctile = (x, seed, parent) => {
    const g = S.g(null, parent);
    S.rect({ x: x - 26, y: 246, w: 52, h: 26, r: 4, fill: 'url(#solid-bytes)' }, g);
    const r = S.rand(seed);
    for (let i = 0; i < 5; i++) S.rect({ x: x - 22 + 9 * i, y: 249, w: 5, h: 20, r: 1, fill: '#0a0f1e', opacity: (0.15 + 0.5 * r()).toFixed(2) }, g);
    return g;
  };
  ctile(1250, 3, ctx); ctile(1640, 9, ctx);
  S.text('≠', { x: 1445, y: 258, size: 40, weight: 800, anchor: 'middle', color: 'ink' }, ctx);
  rise(ctx, tCtx, -10);

  // ================================================================ b3: to scale by area
  K.track(left, [K.K(tB3, { y: 0, s: 1 }), K.K(tB3 + 0.8, { y: -60, s: 0.35 }), K.K(tB4, { y: -60, s: 0.35 }), K.K(tB4 + 0.8, { y: 0, s: 1 })], 100, 260);
  K.track(gpu, [K.K(tB3, { x: 0, y: 0, s: 1 }), K.K(tB3 + 0.8, { x: 80, y: -90, s: 0.35 }), K.K(tB4, { x: 80, y: -90, s: 0.35 }), K.K(tB4 + 0.8, { x: 0, y: 0, s: 1 })], 1740, 290);
  K.ignore([left, gpu], tB3, tB4 + 0.9 - tB3);
  fade([cardL, cardR, ctx, later, ...arcs], 1, 0, tB3, 0.35);
  fade(h1, 1, 0.3, tB3, 0.4);
  const wx = S.g();
  const wTag = S.g(null, wx);
  S.rect({ x: 300, y: 398, w: 500, h: 74, r: 16, fill: CH15.BASE, stroke: 'neutral', strokeOpacity: 0.5, sw: 2 }, wTag);
  S.icon(CH15.weather, { x: 344, y: 435, size: 46, color: 'muted' }, wTag);
  S.text('weather chat, 1,032 tokens', { x: 380, y: 422, size: 26, weight: 700, color: 'ink' }, wTag);
  S.text('to scale by area', { x: 380, y: 452, size: 22, weight: 600, color: 'muted' }, wTag);
  rise(wTag, T('b3~weather') - 0.1, 10);
  const tFour = T('b3~four') - 0.1, tThird = T('b3~third') - 0.1, t80k = T('b3~eighty') - 0.1, tPre = T('b3~exactly') - 0.1;
  const sq = S.rect({ x: 759, y: 958, w: 2, h: 2, fill: 'struct' }, wx);
  const txtL = S.text('text: ≈ 4 KB', { x: 300, y: 930, size: 30, weight: 750, color: 'struct' }, wx);
  const ptr = S.path({ d: 'M500,936 C640,936 720,940 752,955 M742,950 L753,956 L744,960', stroke: 'struct', sw: 2.5 }, wx);
  ptr.setAttribute('data-audit', 'ignore');
  rise(txtL, tFour, 8, 0.3);
  hide(sq);
  fade(sq, 0, 1, tFour, 0.2);
  K.draw(ptr, 300, tFour + 0.2, 0.35);
  const big = S.rect({ x: 1100, y: 960, w: 581, h: 0, fill: 'url(#solid-bytes)', opacity: 0.92 }, wx);
  whole(t => { const k = E('power3.out')(cl((t - tThird) / 0.9)); big.setAttribute('y', (960 - 581 * k).toFixed(1)); big.setAttribute('height', (581 * k).toFixed(1)); });
  const bigL = S.text('keys and values: ≈ 1/3 GB', { x: 1124, y: 412, size: 30, weight: 800, color: '#0a0f1e' }, wx);
  rise(bigL, tThird + 0.7, 8, 0.3);
  const times = S.text('> 80,000 ×', { x: 930, y: 760, size: 44, weight: 800, anchor: 'middle', color: 'ink' }, wx);
  rise(times, t80k, 10);
  const arc = S.path({ d: 'M766,950 C800,560 1040,560 1094,800 M1086,790 L1095,802 L1100,788', stroke: 'compute', sw: 4 }, wx);
  arc.setAttribute('data-audit', 'ignore');
  K.draw(arc, 700, tPre, 0.7);
  const preL = S.text('prefill', { x: 930, y: 610, size: 30, weight: 800, anchor: 'middle', color: 'compute' }, wx);
  rise(preL, tPre + 0.4, 8, 0.3);
  const cnt = S.text('', { x: 550, y: 590, size: 40, weight: 800, family: 'mono', anchor: 'middle', color: 'compute' }, wx);
  const cntL = S.text('operations per token', { x: 550, y: 636, size: 24, weight: 650, anchor: 'middle', color: 'compute' }, wx);
  hide(cntL);
  fade(cntL, 0, 1, tPre + 0.5, 0.3);
  whole(t => { const k = cl((t - tPre - 0.3) / 0.9); cnt.textContent = k > 0 ? `≈ ${Math.round(140 * E('power2.out')(k))} billion` : ''; });
  fade(wx, 1, 0, tB4, 0.4);
  // times sits between the squares; the prefill arc passes above it
  void sq;

  // ================================================================ b4: what a hit saves
  fade(h1, 0.3, 0, tB4, 0.3);
  const h2 = S.text('the distinction everything else rests on', { x: 960, y: 128, size: 44, weight: 750, anchor: 'middle', color: 'ink' });
  rise(h2, T('b4~expensive') + 0.2);
  const sent2 = run(T('b4~sending') - 0.1);
  fade(sent2, 1, 0, T('b4~remaking') - 0.1, 0.3);
  // the label cards return at the bottom centre
  const tCheap = T('b4~cheap') - 0.1, tExp = T('b4~expensive') - 0.1;
  const cl2 = S.g();
  card(cl2, 'the words: kept in a database', 'struct', 560);
  const cheap = S.text('cheap · travels every turn', { x: 560, y: 782, size: 24, weight: 650, anchor: 'middle', color: 'muted' }, cl2);
  K.track(cl2, [K.K(tCheap, { y: 120, o: 0 }), K.K(tCheap + 0.5, { y: 120, o: 1, e: 'power3.out' })]);
  void cheap;
  const cr2 = S.g();
  const wR = card(cr2, 'the keys and values: kept on the GPU', 'bytes', 1340);
  S.text('expensive · what the cache is for', { x: 1340, y: 782, size: 24, weight: 700, anchor: 'middle', color: 'bytes' }, cr2);
  const ring = S.rect({ x: 1340 - wR / 2 - 10, y: 688, w: wR + 20, h: 68, r: 18, stroke: 'helps', sw: 3 }, cr2);
  K.draw(ring, 1400, tExp + 0.4, 0.5);
  K.track(cr2, [K.K(tExp, { y: 120, o: 0 }), K.K(tExp + 0.5, { y: 120, o: 1, e: 'power3.out' })]);
  // the prefill arrow inside the GPU, and the stamp that says a hit skips it
  const tRem = T('b4~remaking') - 0.1;
  const pa = S.path({ d: 'M1480,460 C1530,420 1560,420 1594,452 M1584,444 L1595,453 L1582,458', stroke: 'compute', sw: 4 });
  pa.setAttribute('data-audit', 'ignore');
  K.draw(pa, 200, tRem, 0.45);
  const paL = S.text('prefill', { x: 1537, y: 404, size: 24, weight: 800, anchor: 'middle', color: 'compute' });
  rise(paL, tRem + 0.3, 6, 0.3);
  const stamp = S.g();
  S.rect({ x: 1420, y: 466, w: 240, h: 46, r: 10, fill: CH15.BASE, fillOpacity: 0.85, stroke: 'helps', sw: 3 }, stamp);
  S.text('skipped on a hit', { x: 1540, y: 490, size: 26, weight: 800, anchor: 'middle', color: 'helps' }, stamp);
  stamp.setAttribute('data-audit', 'ignore');
  K.track(stamp, [K.K(tRem + 0.6, { s: 1.6, o: 0 }), K.K(tRem + 0.85, { s: 1, o: 1, e: 'power4.in' })], 1540, 490);
  void lerp; void tB2; void pulse;
});
