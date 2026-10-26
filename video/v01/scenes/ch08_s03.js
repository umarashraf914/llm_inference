/* ch08_s03 · query, key and value (fig 92)
   b1  'cat' and its tall bar (left); three weight tiles W_Q, W_K, W_V (named as spoken, then 'query', 'key',
       'value'); three copies fly into the tiles and out to the right: Query full height, Key and Value an
       eighth of it; 'position worked in here' touches Query and Key only; 'one vector, three projections'.
   b2  the outputs get their roles and icons; a teal shelf 'the cache' takes ghost copies of Key and Value.
   b3  the board clears; the outputs shrink to a Q K V inset (top right); a worked example
       [1, 2, 0, −1] · [0.5, 1, 3, 0] = 0.5 + 2 + 0 + 0 = 2.5, a 'match score' that drops into the corner of a
       5 × 5 grid; rows ask (magnifier), columns are asked (key); the cells fill amber, row by row.
   b4  the upper triangle greys ('looks back only'); the 'it' row's scores blend five value bars into an
       'updated vector'; 'context reaches across'.
   b5  a vast faint grid behind ('thousands × thousands', 'video 3'); then the three bars return to centre:
       'three roles from one vector'.
   Layout: cat bar x 220, y 285-786; tiles x 470-1080, y 395-545; outputs x 1290/1500/1710, bottom 786;
   grid x 760-1160, y 320-630. */
V.scene('ch08_s03', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = n => gsap.parseEase(n);
  const clock = (a, b, fn) => S.add(ch08Drive(b - a, k => fn(a + k * (b - a))), a);
  const fade = (els, a, b, at, d = 0.45) => S.add(ch08Fade(els, a, b, { d }), at);
  const ignore = (els, a, b) => S.add(ch08Ignore(els, b - a), a);

  // ================================================================ b1: one vector, three projections
  const N = 24, CHh = 18, GP = 3, CW = 46, H = ch08VecH(N, CHh, GP), BASE = 786;
  const cat = ch08Column(S, { token: 'cat', x: 220, y: 830, n: N, ch: CHh, gap: GP, cw: CW, size: 30 });
  ch08Hide(cat);
  fade(cat, 0, 1, 0.4, 0.6);
  const TL = [470, 700, 930], TYt = 395, TW = 150, NAMES = ['Q', 'K', 'V'], WORDS = ['query', 'key', 'value'];
  const tiles = TL.map((x, i) => ch08WeightTile(S, { x, y: TYt, w: TW, h: TW, seed: 31 + i * 7 }));
  const tileNames = TL.map((x, i) => ch08W(S, NAMES[i], { x: x + TW / 2, y: TYt + TW + 36, size: 40 }));
  const tileWords = TL.map((x, i) => S.text(WORDS[i], { x: x + TW / 2, y: TYt + TW + 82, size: 26, weight: 550, anchor: 'middle', color: 'muted' }));
  ch08Hide([...tileNames, ...tileWords]);
  tiles.forEach((t, i) => S.add(fx.in(t, { from: 'right', d: 0.55, dist: 40 }), T('b1~three') - 0.1 + 0.12 * i));
  [T('b1~W'), T('b1~W#2'), T('b1~W#3')].forEach((t, i) => fade(tileNames[i], 0, 1, t - 0.05, 0.3));
  [T('b1~query'), T('b1~key'), T('b1~value')].forEach((t, i) => fade(tileWords[i], 0, 1, t - 0.1, 0.35));
  // the outputs: Query as tall as the input, Key and Value an eighth of it
  const OX = [1290, 1500, 1710], OH = [H, H / 8, H / 8];
  const outs = OX.map((x, i) => {
    const g = S.g();
    const n = i === 0 ? N : 3, ch = i === 0 ? CHh : (OH[i] - 2 * GP) / 3;
    ch08Vec(S, { token: `cat-${NAMES[i]}`, round: 1, n, ch, gap: GP, cw: CW, x, y: BASE - OH[i] / 2 }, g);
    ch08Hide(g);
    return g;
  });
  // three copies: shrink and fly into their tile, then out over the tiles to their output
  const tOut = T('b1~Out') - 0.05;
  const minis = [0, 1, 2].map(i => {
    const h = S.g();
    ch08Vec(S, { token: 'cat', n: N, ch: CHh, gap: GP, cw: CW, x: 0, y: 0 }, h);
    h.setAttribute('data-audit', 'ignore');
    ch08Hide(h);
    const t0 = tOut + 0.28 * i, tile = tiles[i];
    const P0 = [220, cat.barT + H / 2], P1 = [tile.cx, tile.cy], C2 = [lerp(tile.cx, OX[i], 0.5), 260], P2 = [OX[i], BASE - OH[i] / 2];
    const at = t => {
      const a = E('power2.inOut')(cl((t - t0) / 0.5)), b = E('power2.inOut')(cl((t - t0 - 0.62) / 0.55));
      let x, y, s;
      if (b <= 0) { x = lerp(P0[0], P1[0], a); y = lerp(P0[1], P1[1], a); s = lerp(1, 0.2, a); }
      else { const u = b; x = (1 - u) * (1 - u) * P1[0] + 2 * (1 - u) * u * C2[0] + u * u * P2[0]; y = (1 - u) * (1 - u) * P1[1] + 2 * (1 - u) * u * C2[1] + u * u * P2[1]; s = 0.2; }
      h.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s.toFixed(3)})`);
      h.style.opacity = t < t0 ? 0 : (b > 0.85 ? (1 - (b - 0.85) / 0.15) : 1).toFixed(3);
      h.style.visibility = t < t0 || b >= 1 ? 'hidden' : 'inherit';
    };
    at(0);
    clock(t0, t0 + 1.2, at);
    // the tile flashes as the copy passes through it
    S.add(gsap.fromTo(tile.bg, { attr: { 'stroke-opacity': 0.22 } }, { attr: { 'stroke-opacity': 1 }, duration: 0.18, yoyo: true, repeat: 1, immediateRender: false }), t0 + 0.45);
    // the output grows up from the baseline as the copy lands
    fade(outs[i], 0, 1, t0 + 1.0, 0.3);
    S.add(gsap.fromTo(outs[i], { scaleY: 0.3, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.45, ease: 'power3.out', transformOrigin: '50% 100%', immediateRender: false }), t0 + 1.0);
    return h;
  });
  // 'position worked in here': touches Query and Key, never Value
  const posTag = S.g();
  const PTX = 1480, PTY = 660;                                   // icon at x 1362, text from 1384
  S.icon('ph:arrows-clockwise-bold', { x: PTX - 118, y: PTY, size: 30, color: 'muted' }, posTag);
  S.text('position worked in here', { x: PTX - 96, y: PTY + 1, size: 24, weight: 600, color: 'muted' }, posTag);
  const lq = S.line({ x1: PTX - 136, y1: PTY, x2: OX[0] + CW / 2 + 6, y2: PTY, stroke: 'muted', sw: 2 }, posTag);
  const lk = S.line({ x1: OX[1], y1: PTY + 18, x2: OX[1], y2: BASE - OH[1] - 6, stroke: 'muted', sw: 2 }, posTag);
  [lq, lk].forEach(l => l.setAttribute('data-audit', 'ignore'));
  ch08Hide(posTag);
  fade(posTag, 0, 1, T('b1~position') - 0.1, 0.4);
  fade(posTag, 1, 0, T('b2') + 0.2, 0.4);
  const cap = S.text('one vector, three projections', { x: 960, y: 975, size: 30, weight: 600, anchor: 'middle', color: 'muted' });
  ch08Hide(cap);
  fade(cap, 0, 1, T('b1~key#2') + 0.2);

  // ================================================================ b2: roles; the cache
  fade([...tileWords, cap], 1, 0, T('b2') - 0.1, 0.4);
  const ROLES = [['Query', 'what it seeks', 'ph:magnifying-glass-bold'], ['Key', 'what it offers', 'ph:key-bold'], ['Value', 'what it contributes', 'ph:package-bold']];
  const roles = ROLES.map(([r, sub, icon], i) => {
    const g = S.g();
    S.icon(icon, { x: OX[i] - S.measure(r, { size: 32, weight: 700 }) / 2 - 22, y: BASE + 40, size: 30, color: 'struct' }, g);
    S.text(r, { x: OX[i] + 6, y: BASE + 41, size: 32, weight: 700, anchor: 'middle', color: 'ink' }, g);
    S.text(sub, { x: OX[i], y: BASE + 80, size: 22, weight: 550, anchor: 'middle', color: 'muted' }, g);   // 22: the three subtitles keep apart
    ch08Hide(g);
    return g;
  });
  [T('b2~query'), T('b2~key'), T('b2~value')].forEach((t, i) => fade(roles[i], 0, 1, t - 0.1, 0.4));
  // the cache: a teal shelf at the top right; ghost copies of Key and Value glide onto it
  const SH = { x0: 1540, x1: 1830, y: 200 };
  const shelf = S.g();
  S.line({ x1: SH.x0, y1: SH.y, x2: SH.x1, y2: SH.y, stroke: 'helps', sw: 5 }, shelf);
  S.text('the cache', { x: (SH.x0 + SH.x1) / 2, y: SH.y + 32, size: 28, weight: 700, anchor: 'middle', color: 'helps' }, shelf);
  const rec = S.text('running record', { x: (SH.x0 + SH.x1) / 2, y: SH.y + 64, size: 24, weight: 550, anchor: 'middle', color: 'helps' });
  ch08Hide([shelf, rec]);
  const tC = T('b2~kept') - 0.15;
  S.add(ch08Fade(shelf, 0, 1, { d: 0.4 }), tC);
  S.add(gsap.fromTo(shelf, { x: 120 }, { x: 0, duration: 0.6, ease: 'power3.out', immediateRender: false }), tC);
  const ghosts = [1, 2].map(i => {
    const g = S.g();
    ch08Vec(S, { token: `cat-${NAMES[i]}`, round: 1, n: 3, ch: (OH[i] - 2 * GP) / 3, gap: GP, cw: CW, x: OX[i], y: BASE - OH[i] / 2 }, g);
    g.setAttribute('data-audit', 'ignore');
    ch08Hide(g);
    const tx = (i === 1 ? 1620 : 1750) - OX[i], ty = SH.y - 4 - BASE;
    fade(g, 0, 0.7, tC + 0.3, 0.2);
    S.add(gsap.fromTo(g, { x: 0, y: 0 }, { x: tx, y: ty, duration: 0.8, ease: 'power3.inOut', immediateRender: false }), tC + 0.3 + 0.1 * i);
    return g;
  });
  fade(rec, 0, 1, T('b2~running') - 0.1);
  fade([shelf, rec, ...ghosts], 1, 0.35, T('b2~record') + 0.5, 0.5);

  // ================================================================ b3: the score grid
  const t3 = T('b3') - 0.1;
  S.add(fx.out([cat, ...tiles, ...tileNames, shelf, rec, ...ghosts], { to: 'left', d: 0.5, dist: 80, stagger: 0.02 }), t3);
  // the three outputs shrink into a small inset at the top right
  const inset = S.g();
  outs.forEach(o => inset.appendChild(o));
  const IX = { x: 1630 - 0.3 * 1290, y: 300 - 0.3 * BASE };       // scale 0.3, Query at x 1630, base at y 300
  S.add(fx.xform(inset, { x: IX.x, y: IX.y, s: 0.3 }, { d: 0.8, ease: 'power3.inOut' }), t3 + 0.1);
  fade(roles, 1, 0, t3, 0.3);
  const qkv = NAMES.map((n, i) => S.text(n, { x: IX.x + 0.3 * OX[i], y: 328, size: 26, weight: 700, anchor: 'middle', color: 'ink' }));
  ch08Hide(qkv);
  fade(qkv, 0, 1, t3 + 0.8, 0.4);
  ignore(inset, t3, T('b5') + 2.6);
  // the worked example
  const QV = ['1', '2', '0', '−1'], KV = ['0.5', '1', '3', '0'], EX = [810, 910, 1010, 1110], QY = 420, KY = 500;
  const exG = S.g();
  const qLbl = S.text('query', { x: 740, y: QY, size: 26, weight: 600, anchor: 'end', color: 'muted' }, exG);
  const kLbl = S.text('key', { x: 740, y: KY, size: 26, weight: 600, anchor: 'end', color: 'muted' }, exG);
  const cellPair = EX.map((x, i) => {
    const g = S.g(null, exG);
    [[QY, QV[i]], [KY, KV[i]]].forEach(([y, v]) => {
      S.rect({ x: x - 42, y: y - 28, w: 84, h: 56, r: 10, fill: 'url(#card-struct)', stroke: 'struct', sw: 2 }, g);
      S.text(v, { x, y: y + 2, size: 30, weight: 650, family: 'mono', anchor: 'middle', color: 'ink' }, g);
    });
    g.hot = S.rect({ x: x - 48, y: QY - 34, w: 96, h: KY - QY + 68, r: 12, stroke: 'compute', sw: 3, opacity: 0 }, g);
    g.hot.setAttribute('data-audit', 'ignore');
    return g;
  });
  const foot = S.text('real ones: thousands of numbers', { x: 960, y: 572, size: 24, weight: 550, anchor: 'middle', color: 'faint' }, exG);
  ch08Hide(exG);
  fade(exG, 0, 1, t3 + 0.5, 0.5);
  const tMul = T('b3~multiply') - 0.1;
  S.add(gsap.fromTo(cellPair.map(c => c.hot), { attr: { opacity: 0 } }, { attr: { opacity: 1 }, duration: 0.3, immediateRender: false }), tMul);
  const prod = S.equation([{ t: '0.5', tone: 'compute' }, { t: '+', tone: 'muted' }, { t: '2', tone: 'compute' }, { t: '+', tone: 'muted' }, { t: '0', tone: 'compute' }, { t: '+', tone: 'muted' }, { t: '0', tone: 'compute' }, { t: '=', tone: 'muted' }, { t: '2.5', tone: 'compute', w: 800 }], { x: 960, y: 640, size: 36, family: 'mono', gap: 14 });
  ch08Hide(prod.parts);
  prod.parts.forEach((p, i) => fade(p, 0, 1, tMul + 0.25 + 0.06 * i, 0.25));
  const score = prod.parts[8];
  const ms = S.text('match score', { x: score.r + 70, y: 700, size: 26, weight: 650, color: 'compute' });
  const msLine = S.line({ x1: score.r + 66, y1: 690, x2: score.cx + 10, y2: 660, stroke: 'compute', sw: 2 });
  msLine.setAttribute('data-audit', 'ignore');
  ch08Hide([ms, msLine]);
  fade([ms, msLine], 0, 1, T('b3~how') - 0.1, 0.35);
  // the grid: rows ask, columns are asked
  const G = { x: 760, y: 320, cw: 80, ch: 62, n: 5 };
  const toks = CH08.tokens;
  const rnd = S.rand(83);
  const sc = [...Array(5)].map((_, r) => [...Array(5)].map((_, c) => (c === r ? 0.75 : 0.15 + 0.6 * rnd())));
  sc[4][1] = 0.95;                                                // 'it' looks hard at 'cat'
  const cells = [], cellG = S.g();
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    const e = S.rect({ x: G.x + c * G.cw + 3, y: G.y + r * G.ch + 3, w: G.cw - 6, h: G.ch - 6, r: 6, fill: 'compute', fillOpacity: 0, stroke: 'compute', strokeOpacity: 0.35, sw: 1.5 }, cellG);
    Object.assign(e, { r, c });
    cells.push(e);
  }
  ch08Hide(cellG);
  // the '2.5' drops into the corner cell; the example fades as the grid appears around it
  const tDropS = T('b3~matches') - 0.1;
  const corner = cells[0];
  S.add(gsap.fromTo(score, { x: 0, y: 0 }, { x: G.x + G.cw / 2 - score.cx, y: G.y + G.ch / 2 - 640, duration: 0.6, ease: 'power3.inOut', immediateRender: false }), tDropS);
  ignore([score], tDropS, tDropS + 0.7);
  fade([exG, ...prod.parts.slice(0, 8), msLine], 1, 0, tDropS, 0.4);
  fade(cellG, 0, 1, tDropS + 0.5, 0.4);
  fade(score, 1, 0, tDropS + 0.75, 0.3);
  S.add(gsap.fromTo(ms, { x: 0, y: 0 }, { x: G.x + G.n * G.cw / 2 - (score.r + 70) - S.measure('match score', { size: 26, weight: 650 }) / 2, y: G.y - 34 - 700, duration: 0.6, ease: 'power3.inOut', immediateRender: false }), tDropS + 0.5);
  ignore([ms], tDropS + 0.5, tDropS + 1.15);
  const rowL = toks.map((w, r) => S.text(w, { x: G.x - 16, y: G.y + r * G.ch + G.ch / 2, size: 26, weight: 600, anchor: 'end', color: 'ink', case: 'keep' }));
  const colL = toks.map((w, c) => S.text(w, { x: G.x + c * G.cw + G.cw / 2, y: G.y - 18, size: 24, weight: 600, anchor: 'middle', color: 'ink', case: 'keep' }));
  const rowIc = S.icon('ph:magnifying-glass-bold', { x: G.x - 150, y: G.y + 2.5 * G.ch, size: 34, color: 'struct' });
  const colIc = S.icon('ph:key-bold', { x: G.x + G.n * G.cw + 34, y: G.y - 18, size: 30, color: 'struct' });
  ch08Hide([...rowL, ...colL, rowIc, colIc]);
  S.add(ch08Fade([rowIc, ...rowL], 0, 1, { d: 0.3, stagger: 0.07 }), 'b3~row-0.1');
  S.add(ch08Fade([colIc, ...colL], 0, 1, { d: 0.3, stagger: 0.07 }), 'b3~column-0.1');
  // the title moves up: 'match score' sits over the grid (colL sits just under it)
  S.add(gsap.to(ms, { y: G.y - 70 - 700, duration: 0.4, ease: 'power2.inOut' }), 'b3~column-0.15');
  const tFill = T('b3~column') + 0.3;
  clock(tFill, tFill + 1.4, t => cells.forEach(e => {
    const u = cl((t - tFill) / 1.4 * 5 - e.r - e.c * 0.15);
    e.setAttribute('fill-opacity', (u * (0.12 + 0.78 * sc[e.r][e.c])).toFixed(3));
  }));

  // ================================================================ b4: only back; blend the values
  const tBack = T('b4~only') - 0.1;
  const upper = S.g();
  cells.filter(e => e.c > e.r).forEach(e => S.rect({ x: +e.getAttribute('x'), y: +e.getAttribute('y'), w: G.cw - 6, h: G.ch - 6, r: 6, fill: '#262d40' }, upper));
  upper.setAttribute('data-audit', 'ignore');
  ch08Hide(upper);
  fade(upper, 0, 0.95, tBack, 0.5);
  const back = S.g();
  S.arrow({ x1: G.x + G.n * G.cw - 30, y1: G.y + 5 * G.ch + 34, x2: G.x + 30, y2: G.y + 5 * G.ch + 34, color: 'muted', sw: 3, head: 12 }, back);
  S.text('looks back only', { x: G.x + G.n * G.cw + 20, y: G.y + 5 * G.ch + 35, size: 26, weight: 600, color: 'muted' }, back);
  ch08Hide(back);
  fade(back, 0, 1, tBack + 0.2);
  fade(back, 1, 0, T('b4~blend') - 0.3, 0.3);
  // five value bars below the grid; amber lines from the 'it' row; they pour into one updated vector
  const VY = 760, VH = H / 8;
  const vals = toks.map((w, c) => { const g = S.g(); ch08Vec(S, { token: `${w}-V`, round: 1, n: 3, ch: (VH - 2 * GP) / 3, gap: GP, cw: 34, x: G.x + c * G.cw + G.cw / 2, y: VY }, g); ch08Hide(g); return g; });
  const lines = toks.map((w, c) => { const l = S.line({ x1: G.x + c * G.cw + G.cw / 2, y1: G.y + 5 * G.ch - 4, x2: G.x + c * G.cw + G.cw / 2, y2: VY - VH / 2 - 6, stroke: 'compute', sw: 1.5 + 3 * sc[4][c] }); l.setAttribute('data-audit', 'ignore'); ch08Hide(l); return l; });
  const tBl = T('b4~blend') - 0.1;
  fade(vals, 0, 1, tBl, 0.35);
  fade(lines, 0, 1, tBl + 0.2, 0.35);
  const UX = 1330;
  const upd = S.g();
  ch08Vec(S, { token: 'it', round: 2, n: 3, ch: (VH - 2 * GP) / 3, gap: GP, cw: 46, x: UX, y: VY }, upd);
  S.rect({ x: UX - 30, y: VY - VH / 2 - 7, w: 60, h: VH + 14, r: 8, stroke: 'struct', sw: 2.5 }, upd);
  const updL = S.text('updated vector', { x: UX, y: VY + VH / 2 + 34, size: 26, weight: 650, anchor: 'middle', color: 'struct' });
  ch08Hide([upd, updL]);
  const tPour = T('b4~updated') - 0.25;
  vals.forEach((g, c) => S.add(gsap.fromTo(g, { x: 0 }, { x: UX - (G.x + c * G.cw + G.cw / 2), duration: 0.6, ease: 'power2.in', immediateRender: false }), tPour + 0.05 * c));
  fade(vals, 1, 0, tPour + 0.45, 0.25);
  fade(lines, 1, 0.25, tPour, 0.4);
  ignore(vals, tPour, tPour + 0.9);
  fade(upd, 0, 1, tPour + 0.55, 0.35);
  fade(updL, 0, 1, tPour + 0.7, 0.4);
  const ctx = S.text('context reaches across', { x: 960, y: 975, size: 32, weight: 650, anchor: 'middle', color: 'ink' });
  ch08Hide(ctx);
  fade(ctx, 0, 1, T('b4~context') - 0.1);

  // ================================================================ b5: thousands × thousands; three roles
  const t5 = T('b5') - 0.1;
  fade([lines, upd, updL, ctx, rowIc, colIc].flat(), 1, 0, t5, 0.4);
  const huge = S.g();
  let hd = '';
  for (let x = -40; x <= 1960; x += 14) hd += `M${x},-40V1120`;
  for (let y = -40; y <= 1120; y += 14) hd += `M-40,${y}H1960`;
  S.path({ d: hd, stroke: 'compute', strokeOpacity: 0.16, sw: 1 }, huge);
  huge.setAttribute('data-audit', 'ignore');
  ch08Hide(huge);
  huge.parentNode.insertBefore(huge, huge.parentNode.firstChild);
  fade(huge, 0, 1, t5 + 0.1, 0.8);
  S.add(gsap.fromTo(huge, { scale: 0.35, transformOrigin: '50% 45%' }, { scale: 1, duration: 1.6, ease: 'power2.out', transformOrigin: '50% 45%', immediateRender: false }), t5 + 0.1);
  const gridAll = [cellG, upper, ...rowL, ...colL, ms];
  S.add(ch08Fade(gridAll, 1, 0.45, { d: 0.8 }), t5 + 0.2);
  const thou = S.text('thousands × thousands', { x: 960, y: 760, size: 40, weight: 700, family: 'display', anchor: 'middle', color: 'compute' });
  const v3 = S.pill('video 3', { x: 960, y: 830, tone: 'neutral', size: 24, h: 44 });
  ch08Hide([thou, v3]);
  fade(thou, 0, 1, T('b5~enormous') - 0.2);
  fade(v3, 0, 1, T('b5~object') - 0.1, 0.35);
  // the big grid and the 5 × 5 fade together; the inset glides back to centre, full size
  const tRet = T('b5~third') - 0.05;
  S.add(ch08Fade([huge, thou, v3, ...gridAll, ...qkv], 1, 0, { d: 0.4 }), tRet);
  S.add(fx.xform(inset, { x: 960 - 1500, y: -40, s: 1 }, { d: 0.9, ease: 'power3.inOut' }), tRet + 0.1);
  const roles2 = ROLES.map(([r], i) => { const e = S.text(r, { x: OX[i] - 540, y: BASE + 1, size: 32, weight: 700, anchor: 'middle', color: 'ink' }); ch08Hide(e); return e; });
  fade(roles2, 0, 1, tRet + 0.6, 0.3);
  const three = S.text('three roles from one vector', { x: 960, y: 900, size: 34, weight: 650, anchor: 'middle', color: 'muted' });
  ch08Hide(three);
  fade(three, 0, 1, tRet + 0.5, 0.3);
});
