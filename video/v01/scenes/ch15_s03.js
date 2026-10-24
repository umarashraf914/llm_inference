/* ch15_s03 · settled, then spoiled by one change (figs 51, 52)
   Attention only looks back, so a token's keys and values are fixed once made: safe to keep. The same fact makes
   a kept tile valid only while its token and every one before it are unchanged, so changing token 2 spoils the
   tiles of tokens 2 … 7: recompute 6 of 7. Layer 1 alone would stay valid, but saves only ≈ 0.025% (ch14_s06).
   b1  seven pills and an empty tray; the heading; 'above layer 1'; t5's arcs from t1-t4 and itself, a bracket
       'token 5: from these five'; a one-way wall right of t5 turns t6 and t7 away.
   b2  t5's tile, padlocked, 'settled'; a still-changing ghost tile is turned away; the t5 tile drops in, 'safe to
       keep'; padlocked tiles fill the tray.
   b3  the bracket turns teal, '=' under t1-t5, 'valid while these are unchanged'; three icons: decode one at a
       time, scores a triangle, caching safe.
   b4  the arriving row t1 XX t3 … t7; 'differs here'; old t2 grey, recompute 1; t3 '=' but made with the old t2;
       the cracks run t3 … t7, each thread back to t2: recompute 6 of 7.
   b5  'skip and resume?' crossed out; amber outlines 'prefill again'; the footnote; a teal block and an amber
       block; the heading 'a prefix rule, / not a search for pieces'; 'why the rule is unforgiving'.
   Layout: pills y 300 at x 300 + 200 i; tray x 220-1580, y 380-440 (slots 90 × 44); arriving row y 620;
   counter x 1600-1820; bottom band y 860-940; blocks y 770. */
V.scene('ch15_s03', S => {
  const K = libKit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1, tB5 = T('b5') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const PX = i => 300 + 200 * i, GREY = '#3a4560';
  // a heading on two lines that is replaced by fading out, then in (never cross-faded)
  const heads = [];
  const heading = (l1, l2, at, out) => {
    const g = S.g();
    S.text(l1, { x: 960, y: 128, size: 40, weight: 750, anchor: 'middle', color: 'ink' }, g);
    S.text(l2, { x: 960, y: 176, size: 34, weight: 650, anchor: 'middle', color: 'muted' }, g);
    rise(g, at, 10);
    if (out) fade(g, 1, 0, out, 0.3);
    heads.push(g);
    return g;
  };

  // ================================================================ b1: settled once made
  const tH1 = T('b1~because') - 0.1, tH2 = tB4 + 0.3, tH3 = T('b5~prefix') - 0.1;
  heading("A token's keys and values", 'depend only on what came before it', tH1, tH2 - 0.35);
  const up = S.g();
  const pills = [0, 1, 2, 3, 4, 5, 6].map(i => {
    const g = S.g(null, up);
    const tk = libToken(S, { text: `t${i + 1}`, x: PX(i), y: 300, size: 28, w: 110, state: 'token' }, g);
    K.track(g, [K.K(0.7 + 0.08 * i, { x: -20, o: 0 }), K.K(1.1 + 0.08 * i, { x: 0, o: 1, e: 'power3.out' })]);
    g.tk = tk;
    return g;
  });
  const tray = S.g();
  const trayR = S.rect({ x: 220, y: 380, w: 1360, h: 60, r: 14, fill: '#1a0f14', stroke: 'bytes', sw: 2.5 }, tray);
  K.draw(trayR, 3000, 1.2, 0.8);
  whole(t => trayR.setAttribute('fill-opacity', cl((t - 1.5) / 0.5).toFixed(3)));
  const trayIn = S.g(null, tray);
  S.text('cache', { x: 204, y: 411, size: 26, weight: 750, anchor: 'end', color: 'bytes' }, trayIn);
  [0, 1, 2, 3, 4, 5, 6].forEach(i => S.rect({ x: PX(i) - 45, y: 388, w: 90, h: 44, r: 8, stroke: 'bytes', strokeOpacity: 0.4, sw: 1.5, dash: '5 5' }, trayIn));
  hide(trayIn);
  fade(trayIn, 0, 1, 1.6, 0.35);
  const above = S.pill('above layer 1', { x: 300, y: 236, tone: 'neutral', size: 22, h: 34 });
  rise(above, T('b1~Above') - 0.1, 8);
  // t5 lifts; arcs from t1-t4 and itself; the bracket; t6 and t7 dim
  const tT5 = T('b1~token') - 0.1, tArcs = T('b1~tokens') - 0.1, tWall = T('b1~Nothing') - 0.1;
  K.track(pills[4], [K.K(0.7 + 0.32, { x: -20, y: 0, o: 0 }), K.K(1.1 + 0.32, { x: 0, y: 0, o: 1, e: 'power3.out' }), K.K(tT5, { y: 0 }), K.K(tT5 + 0.3, { y: -8 }), K.K(tB2 + 0.6, { y: -8 }), K.K(tB2 + 1.0, { y: 0 })]);
  const t5Glow = S.rect({ x: PX(4) - 70, y: 270, w: 140, h: 60, r: 20, fill: 'url(#pglow-struct)', opacity: 0 }, up);
  t5Glow.setAttribute('data-audit', 'ignore');
  up.insertBefore(t5Glow, up.firstChild);
  whole(t => t5Glow.setAttribute('opacity', (0.8 * cl((t - tT5) / 0.3) * (1 - cl((t - tB2 - 0.6) / 0.4))).toFixed(3)));
  const arcs = S.g();
  arcs.setAttribute('data-audit', 'ignore');
  [0, 1, 2, 3].forEach((i, k) => {
    const span = PX(4) - PX(i), hgt = Math.min(62, 18 + span * 0.055);
    const p = S.path({ d: `M${PX(i)},276 C${PX(i)},${276 - hgt} ${PX(4) - 20},${276 - hgt} ${PX(4) - 16},276`, stroke: 'struct', sw: 2.5 }, arcs);
    K.draw(p, span * 1.3, tArcs + 0.12 * k, 0.5);
  });
  const loop = S.path({ d: `M${PX(4) + 6},274 C${PX(4) - 2},244 ${PX(4) + 50},246 ${PX(4) + 32},274`, stroke: 'struct', sw: 2.5 }, arcs);
  K.draw(loop, 120, tArcs + 0.6, 0.35);
  const brG = S.g();
  const br = S.path({ d: `M${PX(0) - 50},452 v10 H${PX(4) + 50} v-10`, stroke: 'muted', sw: 2.5 }, brG);
  K.draw(br, 1000, tArcs + 0.4, 0.5);
  const brL = S.text('token 5: from these five', { x: (PX(0) + PX(4)) / 2, y: 492, size: 26, weight: 700, anchor: 'middle', color: 'muted' }, brG);
  rise(brL, tArcs + 0.8, 8);
  fade([pills[5], pills[6]].map(p => p.firstChild), 1, 0.35, tArcs + 0.6, 0.4);
  // the one-way wall: later tokens cannot reach back
  const wall = S.g();
  const wl = S.path({ d: `M${PX(4) + 100},446 V244`, stroke: 'ink', sw: 3 }, wall);
  K.draw(wl, 210, tWall, 0.4);
  const ow = S.path({ d: `M${PX(4) + 122},236 H${PX(4) + 78} M${PX(4) + 88},228 L${PX(4) + 77},236 L${PX(4) + 88},244`, stroke: 'ink', sw: 2.5 }, wall);
  K.draw(ow, 80, tWall + 0.35, 0.25);
  [5, 6].forEach((i, k) => {
    const p = S.path({ d: `M${PX(i)},276 C${PX(i)},${236 - 10 * k} ${PX(4) + 140},${236 - 10 * k} ${PX(4) + 104},262`, stroke: 'muted', sw: 2.2, dash: '5 4' }, wall);
    p.setAttribute('data-audit', 'ignore');
    hide(p);
    whole(t => { const k2 = cl((t - tWall - 0.5 - 0.2 * k) / 0.5); setO(p, k2 > 0 ? Math.min(1, k2 * 4) * (1 - cl((t - tWall - 1.3 - 0.2 * k) / 0.4)) : 0); });
  });
  wall.setAttribute('data-audit', 'ignore');
  fade([wall, arcs], 1, 0, tB3, 0.35);

  // ================================================================ b2: the whole permission for caching
  const tile = (x, y, parent, o = {}) => {
    const g = S.g(null, parent);
    g.k = S.rect({ x: x - 40, y: y - 18, w: 39, h: 36, r: 5, fill: 'url(#solid-bytes)' }, g);
    g.v = S.rect({ x: x + 1, y: y - 18, w: 39, h: 36, r: 5, fill: '#9b3a44', stroke: 'bytes', sw: 1 }, g);
    if (o.lock !== false) {
      g.lock = S.g(null, g);
      S.circle({ x: x + 36, y: y - 16, r: 11, fill: CH15.BASE, stroke: 'ink', sw: 1.5 }, g.lock);
      S.icon('ph:lock-simple-duotone', { x: x + 36, y: y - 16, size: 15, color: 'ink' }, g.lock);
    }
    return g;
  };
  const tPerm = T('b2~whole') - 0.1, tCould = T('b2~could') - 0.1, tSafe = T('b2~settled') - 0.1, tRoom = T('b2~while') - 0.1;
  const tiles = [0, 1, 2, 3, 4, 5, 6].map(i => tile(PX(i), 410, tray));
  // t5's tile pops out beneath t5 (y 350), then drops into its slot; the others drop in on 'room'
  tiles.forEach((g, i) => {
    if (i === 4) K.track(g, [K.K(tPerm, { y: -60, s: 0.4, o: 0 }), K.K(tPerm + 0.35, { y: -60, s: 1, o: 1, e: 'back.out(2)' }), K.K(tSafe, { y: -60 }), K.K(tSafe + 0.45, { y: 0, e: 'bounce.out' })], PX(4), 410);
    else K.track(g, [K.K(tRoom + 0.08 * Math.abs(i - 4), { y: -70, o: 0 }), K.K(tRoom + 0.08 * Math.abs(i - 4) + 0.4, { y: 0, o: 1, e: 'bounce.out' })], PX(i), 410);
  });
  fade([pills[5], pills[6]].map(p => p.firstChild), 0.35, 1, tRoom + 0.3, 0.4);
  const settled = S.text('settled', { x: PX(4) + 66, y: 352, size: 24, weight: 750, color: 'bytes' });
  rise(settled, tPerm + 0.4, 6);
  fade(settled, 1, 0, tSafe, 0.25);
  // a value that could still change is turned away
  const ghost = S.g();
  ghost.k = S.rect({ x: -40, y: -18, w: 80, h: 36, r: 5, fill: 'bytes', opacity: 0.45 }, ghost);
  const stripes = S.g(null, ghost);
  for (let i = 0; i < 6; i++) S.rect({ x: -36 + 13 * i, y: -14, w: 6, h: 28, r: 2, fill: '#0a0f1e', opacity: 0.35 }, stripes);
  ghost.setAttribute('data-audit', 'ignore');
  whole(t => {
    const k = EIO(cl((t - tCould) / 0.8)), back = EIO(cl((t - tCould - 1.3) / 0.6));
    const x = lerp(1900, 1660, k) + 260 * back, y = 530;
    ghost.setAttribute('transform', `translate(${x.toFixed(1)},${y})`);
    stripes.setAttribute('transform', `translate(${(6 * Math.sin(t * 9)).toFixed(1)},0)`);
    setO(ghost, t > tCould && back < 1 ? 1 : 0);
  });
  const gx = S.path({ d: 'M1636,506 L1684,554 M1684,506 L1636,554', stroke: 'muted', sw: 4 });
  gx.setAttribute('data-audit', 'ignore');
  K.draw(gx, 150, tCould + 0.8, 0.25);
  const gTag = S.pill('could still change', { x: 1660, y: 604, tone: 'neutral', size: 22, h: 34 });
  rise(gTag, tCould + 0.9, 6);
  fade([gx, gTag], 1, 0, tSafe + 0.2, 0.3);
  const safeT = S.g();
  S.circle({ x: PX(4) - 64, y: 520, r: 14, fill: 'helps' }, safeT);
  S.path({ d: `M${PX(4) - 71},520 L${PX(4) - 66},526 L${PX(4) - 57},514`, stroke: '#0a0f1e', sw: 3 }, safeT);
  S.text('safe to keep', { x: PX(4) - 42, y: 521, size: 26, weight: 750, color: 'helps' }, safeT);
  rise(safeT, tSafe + 0.45, 8);
  fade(safeT, 1, 0, tB3, 0.3);

  // ================================================================ b3: valid while everything before is unchanged
  const tEv = T('b3~every') - 0.1;
  whole(t => br.setAttribute('stroke', S.tone(t > tEv ? 'helps' : 'muted')));
  fade(brL, 1, 0, tEv, 0.25);
  const brL2 = S.text('valid while these are unchanged', { x: (PX(0) + PX(4)) / 2, y: 492, size: 26, weight: 750, anchor: 'middle', color: 'helps' }, brG);
  rise(brL2, tEv + 0.3, 8);
  [0, 1, 2, 3, 4].forEach(i => {
    const e = S.text('=', { x: PX(i) - 66, y: 300, size: 28, weight: 800, anchor: 'middle', color: 'helps' });
    hide(e);
    fade(e, 0, 1, tEv + 0.06 * i, 0.2);
    fade(e, 1, 0, tEv + 1.4, 0.4);
  });
  fade(brG, 1, 0, tB4, 0.35);
  const band = S.g();
  const icon3 = (x, at, draw, label) => {
    const g = S.g(null, band);
    draw(g, x);
    S.text(label, { x, y: 940, size: 24, weight: 700, anchor: 'middle', color: 'muted' }, g);
    rise(g, at, 10);
    return g;
  };
  icon3(560, T('b3~one#2') - 0.1, (g, x) => {
    [-40, -14, 12].forEach(dx => S.circle({ x: x + dx, y: 880, r: 9, fill: 'struct' }, g));
    S.path({ d: `M${x + 26},880 H${x + 52} M${x + 44},873 L${x + 53},880 L${x + 44},887`, stroke: 'struct', sw: 3 }, g);
  }, 'decode: one at a time');
  icon3(960, T('b3~halved') - 0.1, (g, x) => {
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) S.rect({ x: x - 34 + 17 * c, y: 846 + 17 * r, w: 15, h: 15, r: 2, fill: c <= r ? 'struct' : '#1a2238', stroke: '#ffffff', strokeOpacity: 0.1, sw: 1 }, g);
  }, 'scores: a triangle');
  icon3(1360, T('b3~makes') - 0.1, (g, x) => {
    const tg = tile(x, 880, g);
    S.rect({ x: x - 46, y: 856, w: 92, h: 48, r: 8, stroke: 'helps', sw: 2.5 }, g);
    void tg;
  }, 'caching: safe');
  fade(band, 1, 0, tB4, 0.35);
  fade(above, 1, 0, tB4, 0.3);

  // ================================================================ b4: change one token early
  heading('Change one token early,', 'everything after is wrong', tH2, tH3 - 0.35);
  const cachedL = S.text('cached', { x: 204, y: 301, size: 24, weight: 750, anchor: 'end', color: 'muted' });
  rise(cachedL, tH2 + 0.2, 0);
  const tArr = T('b4~prompt') - 0.1, tChg = T('b4~token') - 0.1;
  const low = S.g();
  const arrL = S.text('arriving', { x: 204, y: 621, size: 24, weight: 750, anchor: 'end', color: 'muted' }, low);
  rise(arrL, tArr, 0);
  const lows = ['t1', 'XX', 't3', 't4', 't5', 't6', 't7'].map((s, i) => {
    const g = S.g(null, low);
    libToken(S, { text: s, x: PX(i), y: 620, size: 28, w: 110, state: 'token' }, g);
    K.track(g, [K.K(tArr + 0.08 * i, { x: -20, o: 0 }), K.K(tArr + 0.08 * i + 0.4, { x: 0, o: 1, e: 'power3.out' })]);
    return g;
  });
  const xxFlash = S.rect({ x: PX(1) - 64, y: 590, w: 128, h: 60, r: 20, fill: 'url(#pglow-struct)', opacity: 0 }, low);
  xxFlash.setAttribute('data-audit', 'ignore');
  pulse(xxFlash, tChg, 1, 0.6);
  pulse(xxFlash, tChg + 0.6, 1, 0.6);
  const LX = (PX(0) + PX(1)) / 2;
  const diff = S.path({ d: `M${LX},262 V664`, stroke: 'white', sw: 4 });
  diff.setAttribute('data-audit', 'ignore');
  K.draw(diff, 410, tChg + 0.3, 0.45);
  const diffL = S.text('differs here', { x: LX, y: 692, size: 24, weight: 750, anchor: 'middle', color: 'ink' });
  rise(diffL, tChg + 0.7, 6);
  const t1ok = S.g();
  S.circle({ x: PX(0) - 40, y: 390, r: 11, fill: 'helps' }, t1ok);
  S.path({ d: `M${PX(0) - 46},390 L${PX(0) - 42},395 L${PX(0) - 34},385`, stroke: '#0a0f1e', sw: 2.5 }, t1ok);
  rise(t1ok, tChg + 0.8, 0, 0.3);
  // tiles going grey and cracked: t2 at the end of the sentence, then t3 … t7 on 'They are now wrong'
  const tOld = T('b4~changed') + 0.35, tWrong = T('b4~They') - 0.1;
  const badAt = i => (i === 1 ? tOld : tWrong + 0.35 * (i - 2));
  const cracks = tiles.map((g, i) => {
    if (i === 0) return null;
    const c = S.path({ d: `M${PX(i) - 22},392 L${PX(i) - 10},405 L${PX(i) - 20},414 L${PX(i) - 6},428 M${PX(i) - 10},405 L${PX(i) + 8},410 L${PX(i) + 4},419 L${PX(i) + 22},428`, stroke: '#0a0f1e', sw: 3 }, tray);
    c.setAttribute('data-audit', 'ignore');
    const dash = S.rect({ x: PX(i) - 42, y: 390, w: 84, h: 40, r: 6, stroke: 'muted', sw: 2, dash: '5 4', opacity: 0 }, tray);
    whole(t => {
      const bad = t > badAt(i);
      g.k.setAttribute('fill', bad ? GREY : 'url(#solid-bytes)');
      g.v.setAttribute('fill', bad ? GREY : '#9b3a44');
      g.v.setAttribute('stroke', bad ? GREY : S.tone('bytes'));
      c.setAttribute('opacity', bad && i > 1 ? 0.9 : 0);
      dash.setAttribute('opacity', bad && i > 1 ? 0.9 : 0);
    });
    return c;
  });
  const oldT = S.pill('old t2', { x: PX(1), y: 480, tone: 'neutral', size: 22, h: 34 });
  rise(oldT, tOld + 0.1, 6);
  const cntG = S.g();
  S.text('recompute', { x: 1730, y: 586, size: 24, weight: 750, anchor: 'middle', color: 'compute' }, cntG);
  const cnt = S.text('', { x: 1730, y: 636, size: 38, weight: 800, family: 'mono', anchor: 'middle', color: 'compute' }, cntG);
  whole(t => {
    const n = 1 + [2, 3, 4, 5, 6].filter(i => t > badAt(i)).length;
    cnt.textContent = t > tWrong + 0.35 * 4 + 0.3 ? '6 of 7' : `${n}`;
    setO(cntG, cl((t - tOld) / 0.3));
  });
  // t3 is unchanged ... but made with the old t2
  const t3 = T('b4~token#2') - 0.1;
  const eq3 = S.text('=', { x: PX(2), y: 540, size: 40, weight: 800, anchor: 'middle', color: 'helps' });
  rise(eq3, t3 + 0.2, 6);
  const g3 = [300, 620].map(y => { const r = S.rect({ x: PX(2) - 66, y: y - 30, w: 132, h: 60, r: 20, fill: 'url(#pglow-struct)', opacity: 0 }); r.setAttribute('data-audit', 'ignore'); return r; });
  g3.forEach(r => pulse(r, t3, 1, 1.2));
  fade(eq3, 1, 0, tWrong, 0.3);
  const tHold = T('b4~holding') - 0.1;
  const threads = [2, 3, 4, 5, 6].map(i => {
    const p = S.path({ d: `M${PX(i) - 30},392 C${PX(i) - 60},${340} ${PX(1) + 80},${330} ${PX(1) + 40},${318}`, stroke: '#a9cbff', sw: 2.5 });
    p.setAttribute('data-audit', 'ignore');
    const on = i === 2 ? tHold : badAt(i);
    const off = i === 6 ? tB5 + 0.4 : badAt(i + 1);
    K.draw(p, 700, on, 0.4);
    whole(t => p.setAttribute('opacity', (1 - cl((t - off) / 0.3)).toFixed(3)));
    return p;
  });
  const stripe = S.rect({ x: PX(2) - 34, y: 404, w: 68, h: 8, r: 2, fill: '#a9cbff', opacity: 0 }, tray);
  stripe.setAttribute('data-audit', 'ignore');
  whole(t => stripe.setAttribute('opacity', (cl((t - tHold - 0.4) / 0.3) * (1 - cl((t - tWrong) / 0.2))).toFixed(3)));
  void threads; void cracks;

  // ================================================================ b5: a prefix rule, not a search for pieces
  fade(oldT, 1, 0, tB5, 0.3);
  fade(diffL, 1, 0.4, tB5, 0.3);
  const tSkip = T('b5~skip') - 0.1, tId = T('b5~identical') - 0.1, tNot = T('b5~not#3') - 0.1;
  const hop = S.path({ d: `M${PX(0) + 20},588 C${PX(0) + 120},500 ${PX(2) - 120},500 ${PX(2) - 24},586 M${PX(2) - 36},578 L${PX(2) - 23},587 L${PX(2) - 22},572`, stroke: 'helps', sw: 3, dash: '3 6' });
  hop.setAttribute('data-audit', 'ignore');
  hide(hop);
  fade(hop, 0, 1, tSkip, 0.4);
  const hopL = S.text('skip and resume?', { x: PX(1) + 14, y: 500, size: 24, weight: 750, anchor: 'middle', color: 'helps' });
  rise(hopL, tSkip + 0.2, 6);
  const hx = S.path({ d: `M${PX(1) - 30},520 L${PX(1) + 30},580 M${PX(1) + 30},520 L${PX(1) - 30},580`, stroke: 'muted', sw: 4 });
  hx.setAttribute('data-audit', 'ignore');
  K.draw(hx, 180, tSkip + 0.8, 0.3);
  fade([hop, hopL, hx], 1, 0.3, tId, 0.4);
  fade([hop, hopL, hx], 0.3, 0, tH3, 0.4);
  const amb = S.g();
  for (let i = 1; i < 7; i++) S.rect({ x: PX(i) - 62, y: 592, w: 124, h: 56, r: 18, stroke: 'compute', sw: 3 }, amb);
  rise(amb, tId, 0, 0.35);
  const pre = S.text('prefill again', { x: (PX(1) + PX(6)) / 2, y: 692, size: 26, weight: 800, anchor: 'middle', color: 'compute' });
  rise(pre, tId + 0.3, 6);
  const foot = S.text('layer 1 stays valid, but saves only ≈ 0.025%', { x: 1820, y: 996, size: 22, weight: 600, anchor: 'end', color: 'muted' });
  rise(foot, tId + 0.5, 6);
  heading('a prefix rule,', 'not a search for pieces', tH3);
  const blocks = S.g();
  S.rect({ x: PX(0) - 55, y: 744, w: 110, h: 52, r: 12, fill: 'url(#card-helps)', stroke: 'helps', sw: 2.5 }, blocks);
  S.text('reuse', { x: PX(0), y: 771, size: 24, weight: 750, anchor: 'middle', color: 'helps' }, blocks);
  S.rect({ x: PX(1) - 55, y: 744, w: PX(6) - PX(1) + 110, h: 52, r: 12, fill: 'url(#card-compute)', stroke: 'compute', sw: 2.5 }, blocks);
  S.text('prefill from the first difference on', { x: (PX(1) + PX(6)) / 2, y: 771, size: 24, weight: 750, anchor: 'middle', color: 'compute' }, blocks);
  rise(blocks, tH3 + 0.3, 10);
  const why = S.text('why the rule is unforgiving', { x: 960, y: 222, size: 26, weight: 650, anchor: 'middle', color: 'muted' });
  rise(why, tNot, 6);
  void heads; void pills; void lows; void lerp;
});
