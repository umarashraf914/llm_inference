/* ch08_s09 · sizing one layer (fig 101)
   Shapes are drawn to scale, height = numbers in, width = numbers out (so W_K's 1,024 outputs make it an
   eighth as wide as W_Q). Every number is amber; checked in Python: 8,192² = 67,108,864; 8,192 × 1,024 =
   8,388,608; attention 150,994,944; 8,192 × 28,672 = 234,881,024; × 3 = 704,643,072; 28,672 / 8,192 = 3.5.
   b1  header 'Add it up,' / 'check against the advertised size'; corner key 'shapes: published 70B model
       (Llama 3 70B)'; the empty ledger card 'Per layer' slides in on the right.
   b2  W_Q draws edge by edge: left '8,192' in, bottom '8,192' out, then it closes into a square;
       '8,192 × 8,192 = 67.1 M'; ledger 'W_Q 67.1 M'.
   b3  W_Q slices into 64 strips (one marked '128'): '64 heads × 128 = 8,192'; 8 blue key strips at the
       right; brackets gather the queries into 8 groups of 8, a line from each to its key strip: 'keys and
       values shared', '8 × 128 = 1,024'.
   b4  the head arithmetic goes; W_Q shrinks, the key strips close into W_K, W_V draws beside it, an eighth
       of W_Q's width (eight dashed slots across W_Q show it); 'each = 8.4 M'; teal tag 'saving, explained
       later'; W_O; ledger 67.1 + 8.4 + 8.4 + 67.1 resolves to 'attention, per layer 151.0 M'.
   b5  the attention tiles shrink to a top row; feed-forward first and gate unroll wide (8,192 by 28,672,
       '28,672 / 8,192 = 3.5'); second draws tall; '8,192 × 28,672 = 234.88 M' copied onto each; bracket
       '3 × 234.88 M = 704.6 M'; ledger 'feed-forward, per layer 704.6 M'.
   Layout: drawing x 100-1280; ledger card x 1340-1820, y 250-770; corner key bottom left. */
V.scene('ch08_s09', S => {
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = n => gsap.parseEase(n);
  const EIO = E('power2.inOut');
  const clock = (a, b, fn) => S.add(ch08Drive(b - a, k => fn(a + k * (b - a))), a);
  const whole = fn => { fn(0); clock(0, S.duration, fn); };
  const fade = (els, a, b, at, d = 0.45, stagger = 0) => S.add(ch08Fade(els, a, b, { d, stagger }), at);
  const stateAt = (keys, t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, b] = keys[i];
      if (t < t1) {
        const [t0, a] = keys[i - 1], u = (b.e ? E(b.e) : EIO)(cl((t - t0) / (t1 - t0)));
        const o = {};
        for (const k of Object.keys(b)) if (k !== 'e' && typeof b[k] === 'number') o[k] = lerp(a[k] ?? b[k], b[k], u);
        return { ...a, ...o };
      }
    }
    return keys[keys.length - 1][1];
  };
  const K = (t, st) => [t, st];
  // a group moved / scaled about (ox, oy) with attribute opacity (never style-faded)
  const track = (el, keys, ox = 0, oy = 0) => whole(t => {
    const st = stateAt(keys, t), s = st.s ?? 1, o = st.o ?? 1;
    el.setAttribute('transform', `translate(${(ox + (st.x ?? 0)).toFixed(1)},${(oy + (st.y ?? 0)).toFixed(1)}) scale(${s.toFixed(4)}) translate(${-ox},${-oy})`);
    el.setAttribute('opacity', o.toFixed(3));
    el.style.visibility = o > 0.002 ? 'inherit' : 'hidden';
  });
  // a translate only (opacity left to ch08Fade)
  const mover = (el, keys) => whole(t => { const st = stateAt(keys, t); el.setAttribute('transform', `translate(${(st.x ?? 0).toFixed(1)},${(st.y ?? 0).toFixed(1)})`); });
  // a rect whose geometry is keyframed
  const rectKeys = (r, keys) => whole(t => { const g = stateAt(keys, t); ['x', 'y', 'w', 'h'].forEach(k => r.setAttribute({ w: 'width', h: 'height' }[k] || k, Math.max(0, g[k]).toFixed(2))); if (g.o != null) { r.setAttribute('opacity', g.o.toFixed(3)); r.style.visibility = g.o > 0.002 ? 'inherit' : 'hidden'; } });
  const amber = (s, x, y, o = {}) => S.text(s, { x, y, size: 30, weight: 650, family: 'mono', color: 'compute', anchor: 'middle', ...o });
  const grey = (s, x, y, o = {}) => S.text(s, { x, y, size: 24, weight: 600, color: 'muted', anchor: 'middle', ...o });
  const NS = { 'vector-effect': 'non-scaling-stroke' };
  const mat = (x, y, w, h, seed, cols, rows, parent) => {
    const g = S.g(null, parent);
    S.rect({ x, y, w, h, r: 6, fill: '#0c1326' }, g);
    g.card = S.rect({ x, y, w, h, r: 6, fill: 'url(#card-neutral)', stroke: 'white', strokeOpacity: 0.25, sw: 2 }, g);
    Object.entries(NS).forEach(([k, v]) => g.card.setAttribute(k, v));
    const pad = Math.min(w, h) * 0.06;
    g.tex = ch08Texture(S, { x: x + pad, y: y + pad, w: w - 2 * pad, h: h - 2 * pad, cols, rows, seed }, g);
    return g;
  };

  // ================================================================ b1: header, key, ledger card
  const hd1 = S.text('Add it up,', { x: 110, y: 130, size: 46, weight: 700, family: 'display', color: 'ink' });
  const hd2 = S.text('check against the advertised size', { x: 110, y: 186, size: 32, weight: 600, color: 'muted' });
  ch08Hide([hd1, hd2]);
  fade([hd1, hd2], 0, 1, 0.5, 0.5, 0.25);
  fade([hd1, hd2], 1, 0, T('b3') - 0.1, 0.4);
  const key = S.g();
  S.icon('ph:book-open-duotone', { x: 124, y: 1008, size: 30, color: 'muted' }, key);
  S.text('shapes: published 70B model (Llama 3 70B)', { x: 150, y: 1008, size: 22, weight: 600, color: 'muted' }, key);
  ch08Hide(key);
  fade(key, 0, 1, T('b1~published') - 0.1, 0.5);
  // the ledger card
  const LX = 1320, LY = 250, LW = 520, LH = 520, VX = LX + LW - 32, NX = LX + 32;
  const card = S.g();
  S.rect({ x: LX, y: LY, w: LW, h: LH, r: 18, fill: '#0b1224', stroke: 'compute', strokeOpacity: 0.4, sw: 2 }, card);
  S.text('Per layer', { x: NX, y: LY + 50, size: 34, weight: 750, family: 'display', color: 'ink' }, card);
  S.path({ d: `M${NX},${LY + 84} H${LX + LW - 32}`, stroke: 'white', strokeOpacity: 0.18, sw: 2 }, card);
  const tCard = T('b1~add') - 0.1;
  track(card, [K(tCard, { x: 560, o: 0 }), K(tCard + 0.8, { x: 0, o: 1, e: 'power3.out' })]);
  const RY = [LY + 130, LY + 190, LY + 250, LY + 310];
  const row = (name, val, y) => {
    const g = S.g(null, card);
    if (name.length === 1) ch08W(S, name, { x: NX, y, size: 34, anchor: 'start' }, g);
    else S.text(name, { x: NX, y, size: 24, weight: 650, color: 'ink' }, g);   // 24: 'feed-forward, per layer' clears its value
    g.val = S.text(val, { x: VX, y, size: 30, weight: 650, family: 'mono', anchor: 'end', color: 'compute' }, g);
    ch08Hide(g);
    return g;
  };

  // ================================================================ b2: W_Q, edge by edge
  // big W_Q: x 360-720, y 330-690 (360 px for 8,192)
  const QX = 360, QY = 330, QS = 360, QC = [QX + QS / 2, QY + QS / 2];
  const qG = S.g();
  const qView = S.g(null, qG);          // the whole-W_Q look; in b3 eight split groups stand in for it
  const qBody = mat(QX, QY, QS, QS, 41, 16, 16, qView);
  qBody.card.setAttribute('stroke-opacity', 0);
  ch08Hide(qBody);
  // dividers into 64 heads, the marked first strip (b3)
  const SW = QS / 64;
  const divs = S.path({ d: Array.from({ length: 63 }, (_, i) => `M${(QX + SW * (i + 1)).toFixed(2)},${QY} V${QY + QS}`).join(' '), stroke: '#060a14', sw: 1.6 }, qView);
  divs.setAttribute('data-audit', 'ignore');
  const divClip = S.el('clipPath', { id: 'ch08s09-div' }, S.el('defs', {}));
  const divCR = S.el('rect', { x: QX, y: QY - 2, width: 0, height: QS + 4 }, divClip);
  divs.setAttribute('clip-path', 'url(#ch08s09-div)');
  const hl0 = S.rect({ x: QX, y: QY, w: SW, h: QS, fill: 'struct', fillOpacity: 0.75 }, qView);
  ch08Hide([divs, hl0]);
  // the outline, drawn edge by edge
  const edge = d => { const p = S.path({ d, stroke: 'white', strokeOpacity: 0.55, sw: 2.5 }, qView); Object.entries(NS).forEach(([k, v]) => p.setAttribute(k, v)); p.setAttribute('stroke-dasharray', '400 400'); p.setAttribute('stroke-dashoffset', 400); return p; };
  const eL = edge(`M${QX},${QY} V${QY + QS}`), eB = edge(`M${QX},${QY + QS} H${QX + QS}`), eRT = edge(`M${QX + QS},${QY + QS} V${QY} H${QX}`);
  eRT.setAttribute('stroke-dasharray', '800 800'); eRT.setAttribute('stroke-dashoffset', 800);
  const drawEdge = (p, len, t0, d) => whole(t => p.setAttribute('stroke-dashoffset', (len * (1 - EIO(cl((t - t0) / d)))).toFixed(1)));
  const tQ = T('b2~W') - 0.1, tIn = T('b2~eight') - 0.1, tWide = T('b2~just') - 0.1, tSq = T('b2~Square') - 0.1;
  drawEdge(eL, 400, tQ + 0.1, 0.7);
  drawEdge(eB, 400, tWide, 0.6);
  drawEdge(eRT, 800, tSq, 0.6);
  fade(qBody, 0, 1, tSq + 0.4, 0.5);
  const qName1 = ch08W(S, 'Q', { x: QC[0], y: QY - 34, size: 44 });
  const inL = [amber('8,192', QX - 20, QC[1] - 16, { anchor: 'end' }), grey('in', QX - 20, QC[1] + 22, { anchor: 'end' })];
  const outL = [amber('8,192', QC[0], QY + QS + 34), grey('out', QC[0], QY + QS + 72)];
  ch08Hide([qName1, ...inL, ...outL]);
  fade(qName1, 0, 1, tQ, 0.4);
  fade(inL, 0, 1, tIn, 0.4, 0.15);
  fade(outL, 0, 1, tWide + 0.2, 0.4, 0.15);
  // an equation laid out term by term (SVG drops edge spaces, so the gaps are explicit)
  const terms = (parts, x0, y, size, anchor = 'start') => {
    const ws = parts.map(s => S.measure(s, { size, weight: 650, family: 'mono' })), gap = size * 0.42;
    let x = anchor === 'middle' ? x0 - (ws.reduce((a, b) => a + b, 0) + gap * (parts.length - 1)) / 2 : x0;
    return parts.map((s, i) => { const t = amber(s, x, y, { size, anchor: 'start' }); x += ws[i] + gap; return t; });
  };
  const EQX = 790;
  const eq1 = terms(['8,192', '×', '8,192'], EQX, 470, 44);
  const eq1b = amber('= 67.1 M', EQX, 540, { size: 44, anchor: 'start' });
  ch08Hide([...eq1, eq1b]);
  fade(eq1, 0, 1, tSq + 0.1, 0.35, 0.18);
  fade(eq1b, 0, 1, T('b2~sixty') - 0.1, 0.4);
  const rQ = row('Q', '67.1 M', RY[0]);
  fade(rQ, 0, 1, T('b2~million') - 0.1, 0.4);
  const b2Labels = [qName1, ...inL, ...outL, ...eq1, eq1b];
  fade(b2Labels, 1, 0, T('b3') - 0.1, 0.4);

  // ================================================================ b3: heads
  const t64 = T('b3~sixty') - 0.1;
  fade(divs, 0, 1, t64, 0.01);
  whole(t => divCR.setAttribute('width', (QS * E('power1.inOut')(cl((t - t64) / 0.9))).toFixed(1)));
  const tw8 = T('b3~twenty') - 0.1;
  fade(hl0, 0, 1, tw8, 0.35);
  const l128 = S.g();
  S.path({ d: `M${QX + SW / 2},${QY + QS + 4} V${QY + QS + 30}`, stroke: 'struct', sw: 2 }, l128);
  l128.appendChild(amber('128', QX + SW / 2 + 4, QY + QS + 52, { size: 28 }));
  ch08Hide(l128);
  fade(l128, 0, 1, tw8 + 0.1, 0.35);
  // '64 heads × 128 = 8,192', built in pieces
  const EQC = 600;
  const eqH = terms(['64 heads', '× 128', '= 8,192'], EQC, 790, 34, 'middle');
  ch08Hide(eqH);
  ['b3~sixty', 'b3~twenty', 'b3~numbers'].forEach((c, i) => fade(eqH[i], 0, 1, T(c) + 0.1, 0.35));
  // on 'eight heads' W_Q splits into 8 groups of 8 query strips; a blue key strip stands in each gap
  const GW = 8 * SW, GAP = 30;
  const tSp0 = T('b3~only') - 0.15, tSp1 = T('b4') - 0.05;
  const split = S.g(null, qG);
  const groups = Array.from({ length: 8 }, (_, gi) => {
    const g = S.g(null, split), x = QX + gi * GW;
    S.rect({ x, y: QY, w: GW, h: QS, fill: '#0c1326' }, g);
    S.rect({ x, y: QY, w: GW, h: QS, fill: 'url(#card-neutral)', stroke: 'white', strokeOpacity: 0.4, sw: 1.5 }, g);
    ch08Texture(S, { x: x + 2, y: QY + 6, w: GW - 4, h: QS - 12, cols: 2, rows: 16, seed: 211 + gi }, g);
    S.path({ d: Array.from({ length: 7 }, (_, i) => `M${(x + SW * (i + 1)).toFixed(2)},${QY} V${QY + QS}`).join(' '), stroke: '#060a14', sw: 1.6 }, g);
    if (gi === 0) S.rect({ x, y: QY, w: SW, h: QS, fill: 'struct', fillOpacity: 0.75 }, g);
    return g;
  });
  ch08Hide(split);
  fade(qView, 1, 0, tSp0, 0.2);
  fade(split, 0, 1, tSp0, 0.2);
  fade(split, 1, 0, tSp1 + 0.45, 0.2);
  fade(qView, 0, 1, tSp1 + 0.45, 0.2);
  whole(t => {
    const sp = EIO(cl((t - tSp0 - 0.15) / 0.6)) * (1 - EIO(cl((t - tSp1) / 0.45)));
    groups.forEach((g, i) => g.setAttribute('transform', `translate(${(i * GAP * sp).toFixed(1)},0)`));
  });
  const kx = i => QX + GW * (i + 1) + GAP * i + (GAP - SW) / 2;
  const kStrips = Array.from({ length: 8 }, (_, i) => S.rect({ x: kx(i), y: QY, w: SW, h: QS, fill: 'struct', fillOpacity: 1 }));
  const kOut = S.rect({ x: 0, y: 0, w: 0, h: 0, fill: 'none', stroke: 'struct', sw: 2 });
  const tK8 = T('b3~eight') - 0.05, tGo = T('b4') - 0.15, tKW = T('b4') + 0.8;
  const tClose = T('b4') + 0.45, tSmall = T('b5') - 0.05;
  // key strips: b3 in the gaps; b4 gathered aside (x 880), then into W_K (x 470, 30 x 240); b5 small (x 320, 15 x 120)
  kStrips.forEach((r, i) => {
    const t0 = tK8 + 0.06 * i;
    rectKeys(r, [K(t0, { x: kx(i), y: QY + 40, w: SW, h: QS, o: 0 }), K(t0 + 0.35, { x: kx(i), y: QY, w: SW, h: QS, o: 1 }),
      K(tGo, { x: kx(i), y: QY, w: SW, h: QS, o: 1 }), K(tGo + 0.5, { x: 880 + 3.75 * i, y: QY, w: 3.75, h: QS, o: 1 }),
      K(tKW, { x: 880 + 3.75 * i, y: QY, w: 3.75, h: QS, o: 1 }), K(tKW + 0.7, { x: 470 + 3.75 * i, y: 330, w: 3.75, h: 240, o: 1 }),
      K(tSmall, { x: 470 + 3.75 * i, y: 330, w: 3.75, h: 240, o: 1 }), K(tSmall + 0.8, { x: 320 + 1.875 * i, y: 250, w: 1.875, h: 120, o: 1 })]);
  });
  rectKeys(kOut, [K(tKW + 0.5, { x: 470, y: 330, w: 30, h: 240, o: 0 }), K(tKW + 0.8, { x: 470, y: 330, w: 30, h: 240, o: 1 }),
    K(tSmall, { x: 470, y: 330, w: 30, h: 240, o: 1 }), K(tSmall + 0.8, { x: 320, y: 250, w: 15, h: 120, o: 1 })]);
  // a bracket over each group of 8 queries, ending in an arrow onto its key strip
  const grp = S.g();
  for (let gi = 0; gi < 8; gi++) {
    const x1 = QX + gi * (GW + GAP) + 2, kc = kx(gi) + SW / 2;
    S.path({ d: `M${x1},${QY - 8} V${QY - 20} H${kc} V${QY - 7}`, stroke: 'struct', sw: 2 }, grp);
    S.path({ d: `M${kc - 5},${QY - 14} L${kc},${QY - 5} L${kc + 5},${QY - 14}`, stroke: 'struct', sw: 2 }, grp);
  }
  grp.setAttribute('data-audit', 'ignore');
  ch08Hide(grp);
  fade(grp, 0, 1, T('b3~each#2') - 0.1, 0.4);
  const shareL = grey('keys and values shared', EQC, 270, { color: 'ink', size: 26 });
  const eqK = amber('8 × 128 = 1,024', EQC, 846, { size: 34 });
  ch08Hide([shareL, eqK]);
  fade(eqK, 0, 1, T('b3~heads#2') - 0.05, 0.4);
  fade(shareL, 0, 1, T('b3~shared') + 0.1, 0.4);
  fade(grp, 1, 0, T('b4') - 0.35, 0.3);
  const b3Labels = [divs, hl0, l128, ...eqH, shareL, eqK];
  fade(b3Labels, 1, 0, T('b4') - 0.1, 0.4);

  // ================================================================ b4: W_K, W_V, W_O
  // W_Q to 240 px at (100, 330), then (b5) 120 px at (170, 250)
  const tAppQ = tQ;
  track(qG, [K(tAppQ, { o: 0 }), K(tAppQ + 0.2, { o: 1 }), K(tClose - 0.1, { x: 0, y: 0, s: 1 }), K(tClose + 0.7, { x: 220 - QC[0], y: 450 - QC[1], s: 2 / 3 }),
    K(tSmall, { x: 220 - QC[0], y: 450 - QC[1], s: 2 / 3 }), K(tSmall + 0.8, { x: 230 - QC[0], y: 310 - QC[1], s: 1 / 3 })], QC[0], QC[1]);
  const wv = S.rect({ x: 560, y: 330, w: 30, h: 0, fill: 'struct', fillOpacity: 0.75, stroke: 'struct', sw: 2 });
  const tWV = tKW + 0.5;
  rectKeys(wv, [K(tWV, { x: 560, y: 330, w: 30, h: 0, o: 0 }), K(tWV + 0.05, { o: 1 }), K(tWV + 0.6, { x: 560, y: 330, w: 30, h: 240, o: 1 }),
    K(tSmall, { x: 560, y: 330, w: 30, h: 240 }), K(tSmall + 0.8, { x: 390, y: 250, w: 15, h: 120 })]);
  // eight dashed W_K-wide slots across W_Q: it is an eighth as wide
  const eighth = S.g();
  for (let i = 0; i < 8; i++) S.rect({ x: 100 + 30 * i + 2, y: 332, w: 26, h: 236, r: 3, fill: 'none', stroke: 'struct', sw: 1.8, dash: '5 5' }, eighth);
  eighth.setAttribute('data-audit', 'ignore');
  ch08Hide(eighth);
  fade(eighth, 0, 1, T('b4~eighth') - 0.1, 0.4);
  fade(eighth, 1, 0, T('b4~each') - 0.2, 0.4);
  // W_O
  const oG = S.g();
  mat(740, 330, 240, 240, 77, 12, 12, oG);
  const tWO = T('b4~W#3') - 0.1;
  track(oG, [K(tWO, { o: 0, s: 0.9 }), K(tWO + 0.45, { o: 1, s: 1, e: 'back.out(1.5)' }),
    K(tSmall, { x: 0, y: 0, s: 1 }), K(tSmall + 0.8, { x: 490 - 860, y: 310 - 450, s: 0.5 })], 860, 450);
  // names: they follow their tiles; in b5 they dim
  const nm = (sub, x, y) => { const t = ch08W(S, sub, { x, y, size: 40 }); ch08Hide(t); return t; };
  const nQ = nm('Q', 220, 300), nK = nm('K', 485, 300), nV = nm('V', 575, 300), nO = nm('O', 860, 300);
  fade(nQ, 0, 1, tClose + 0.5, 0.4);
  fade(nK, 0, 1, tKW + 0.7, 0.4);
  fade(nV, 0, 1, tWV + 0.3, 0.4);
  fade(nO, 0, 1, tWO + 0.2, 0.4);
  const b5pos = { [0]: [230, 222], [1]: [327, 222], [2]: [397, 222], [3]: [490, 222] };
  [nQ, nK, nV, nO].forEach((n, i) => {
    const x0 = [220, 485, 575, 860][i];
    mover(n, [K(tSmall, { x: 0, y: 0 }), K(tSmall + 0.8, { x: b5pos[i][0] - x0, y: b5pos[i][1] - 300 })]);
  });
  // K and V at b5 sit 46 apart: smaller names so they do not collide
  [nK, nV].forEach(n => { const k0 = tSmall; whole(t => { const s = lerp(40, 30, EIO(cl((t - k0) / 0.8))); n.setAttribute('font-size', s.toFixed(1)); n.firstElementChild.setAttribute('font-size', Math.max(20, s * 0.68).toFixed(1)); }); });
  fade([nQ, nK, nV, nO], 1, 0.45, tSmall + 0.4, 0.5);
  // size labels under each
  const lab2 = (cx, a, b) => [amber(a, cx, 610, { size: 26 }), amber(b, cx, 648, { size: 26 })];
  const labQ = lab2(220, '8,192 × 8,192', '= 67.1 M'), labKV = lab2(530, '8,192 × 1,024', 'each = 8.4 M'), labO = lab2(860, '8,192 × 8,192', '= 67.1 M');
  ch08Hide([...labQ, ...labKV, ...labO]);
  fade(labQ, 0, 1, tClose + 0.8, 0.4);
  fade(labKV[0], 0, 1, T('b4~eight#2') - 0.15, 0.35);
  fade(labKV[1], 0, 1, T('b4~million') - 0.15, 0.35);
  fade(labO, 0, 1, T('b4~matches') - 0.1, 0.4, 0.2);
  const saving = S.pill('saving, explained later', { x: 530, y: 706, tone: 'helps', size: 24, h: 46 });
  ch08Hide(saving);
  fade(saving, 0, 1, T('b4~saving') - 0.1, 0.4);
  // ledger: the four rows, the sum, then one row
  const rK = row('K', '8.4 M', RY[1]), rV = row('V', '8.4 M', RY[2]), rO = row('O', '67.1 M', RY[3]);
  fade(rK, 0, 1, T('b4~each') - 0.2, 0.35);
  fade(rV, 0, 1, T('b4~each') + 0.05, 0.35);
  fade(rO, 0, 1, T('b4~Q') - 0.1, 0.35);
  const sumL = S.text('67.1 + 8.4 + 8.4 + 67.1', { x: VX, y: RY[3] + 62, size: 26, weight: 600, family: 'mono', anchor: 'end', color: 'muted' }, card);
  ch08Hide(sumL);
  fade(sumL, 0, 1, T('b4~Attention') - 0.1, 0.4);
  const tRes = T('b4~fifty') - 0.15;
  fade([rQ, rK, rV, rO, sumL], 1, 0, tRes, 0.35);
  const rAtt = row('attention, per layer', '151.0 M', RY[0]);
  fade(rAtt, 0, 1, tRes + 0.3, 0.45);
  const b4Labels = [saving, ...labQ, ...labKV, ...labO];
  fade(b4Labels, 1, 0, tSmall - 0.1, 0.4);

  // ================================================================ b5: the feed-forward, to the same small scale
  // 120 px for 8,192: first and gate 420 x 120 (28,672 out), second 120 x 420
  const ff = (x, y, w, h, seed, cols, rows, dir) => {
    const g = S.g();
    const m = mat(x, y, w, h, seed, cols, rows, g);
    const id = `ch08s09-ff${seed}`, cp = S.el('clipPath', { id }, S.el('defs', {}));
    const cr = S.el('rect', { x: x - 4, y: y - 4, width: 0, height: 0 }, cp);
    m.setAttribute('clip-path', `url(#${id})`);
    g.unroll = (t0, d) => whole(t => {
      const k = EIO(cl((t - t0) / d));
      g.style.visibility = k > 0 ? 'inherit' : 'hidden';
      cr.setAttribute('width', (dir === 'x' ? (w + 8) * k : w + 8).toFixed(1));
      cr.setAttribute('height', (dir === 'y' ? (h + 8) * k : h + 8).toFixed(1));
    });
    Object.assign(g, { x, y, w, h, cx: x + w / 2, cy: y + h / 2 });
    return g;
  };
  const fFirst = ff(170, 470, 420, 120, 91, 28, 8, 'x'), fGate = ff(170, 680, 420, 120, 93, 28, 8, 'x'), fSecond = ff(690, 400, 120, 420, 95, 8, 28, 'y');
  const tWid = T('b5~widens') - 0.1;
  fFirst.unroll(tWid, 0.8);
  fGate.unroll(tWid + 0.3, 0.8);
  const tSec = T('b5~three#2') - 0.2;
  fSecond.unroll(tSec, 0.8);
  // their names (icon + word), in grey
  const ffName = (g, icon, word, x, y) => { const n = S.g(); S.icon(icon, { x, y, size: 30, color: 'muted' }, n); S.text(word, { x: x + 22, y, size: 24, weight: 600, color: 'muted' }, n); ch08Hide(n); return n; };
  const nF = ffName(fFirst, 'ph:arrows-out-line-vertical-bold', 'first', 186, 446), nG = ffName(fGate, 'ms:valve', 'gate', 186, 656), nS = ffName(fSecond, 'ph:arrows-in-line-vertical-bold', 'second', 706, 376);
  fade(nF, 0, 1, tWid + 0.2, 0.4);
  fade(nG, 0, 1, tWid + 0.5, 0.4);
  fade(nS, 0, 1, tSec + 0.3, 0.4);
  // edges of first; the 3.5
  const fIn = amber('8,192', 150, 530, { anchor: 'end' }), fOut = amber('28,672', 380, 624);
  const note = grey('28,672 / 8,192 = 3.5', 930, 556, { anchor: 'start', size: 26 });
  ch08Hide([fIn, fOut, note]);
  fade(fIn, 0, 1, tWid + 0.5, 0.35);
  fade(fOut, 0, 1, tWid + 0.85, 0.35);
  fade(note, 0, 1, T('b5~three') - 0.1, 0.4);
  // second: 28,672 tall by 8,192 wide
  const sIn = amber('28,672', 830, 610, { anchor: 'start' }), sOut = amber('8,192', 750, 846);
  ch08Hide([sIn, sOut]);
  fade([sIn, sOut], 0, 1, tSec + 0.5, 0.35, 0.15);
  // the product, and copies on all three
  const tHold = T('b5~hold') - 0.15;
  const pr1 = amber('8,192 × 28,672', 930, 450, { anchor: 'start', size: 34 }), pr2 = amber('= 234.88 M', 930, 500, { anchor: 'start', size: 34 });
  ch08Hide([pr1, pr2]);
  fade(pr1, 0, 1, tHold - 0.3, 0.35);
  fade(pr2, 0, 1, tHold + 0.05, 0.35);
  const cp = (x, y) => { const p = S.pill('234.88 M', { x, y, tone: 'compute', size: 20, h: 36, padX: 8, mono: true }); ch08Hide(p); return p; };
  const copies = [cp(fFirst.cx, fFirst.cy), cp(fGate.cx, fGate.cy), cp(fSecond.cx, fSecond.cy)];
  fade(copies, 0, 1, tHold + 0.35, 0.3, 0.15);
  const brFF = S.bracket({ x1: 170, x2: 810, y: 878, label: '3 × 234.88 M = 704.6 M', tone: 'compute', size: 30 });
  ch08Hide(brFF);
  fade(brFF, 0, 1, T('b5~seven') - 0.1, 0.4);
  const rFF = row('feed-forward, per layer', '704.6 M', RY[1]);
  fade(rFF, 0, 1, T('b5~million') - 0.2, 0.45);
});
