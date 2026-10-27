/* ch15_s06 · the whole rule, in one line (fig 46)
   Compare from token 1 and stop at the first difference: a hit before it, a miss after. The useful question is
   how identical and from where, never how similar: of two 1,032-token prompts that share 1,031 tokens, one
   differing at the last token hits 1,031 (99.9%, checked), one differing at the first hits 0 and prefills all
   1,032. That is why a prompt puts its most shared parts first (the strip of ch03_s07, same labels and arrow).
   b1  the rule card writes on; a token bar under it: a white notch two thirds along, teal before it, amber after.
   b2  'how similar?' struck, 'how identical, and from where?'; two pairs of bars (faint cached over bright
       arriving) with one legend; the last token differs: 1,031 hit; the first differs: 0 hit; the bracket.
   b3  the pairs merge into one strip; it splits into four segments, labelled on their phrases; the arrow
       'most shared → most specific'; a teal sweep over the first three, 'newest message' amber.
   b4  everything fades but the rule card, which moves to the centre, brightens and holds.
   Layout: card x 560-1360, y 120-240; bars x 360-1560; b1 bar y 420; questions y 316 / 362; pairs y 516 / 556
   and 736 / 776; legend top right y 444; strip y 560, arrow y 632. */
V.scene('ch15_s06', S => {
  const K = libKit(S), { T, cl, E, EIO, whole, setO, hide, fade } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const X0 = 360, X1 = 1560, W = X1 - X0;
  // a thin bar of many tiny token cells, with fills (teal / amber) whose spans are set per frame
  const tokenBar = (y, h, o = {}) => {
    const g = S.g(null, o.parent);
    S.rect({ x: X0, y: y - h / 2, w: W, h, r: Math.min(8, h / 2), fill: CH15.BASE }, g);
    S.rect({ x: X0, y: y - h / 2, w: W, h, r: Math.min(8, h / 2), fill: '#1d3566', fillOpacity: o.faint ? 0.5 : 1, stroke: 'struct', strokeOpacity: o.faint ? 0.4 : 0.85, sw: 2 }, g);
    const fills = S.g(null, g);
    let d = '';
    for (let x = X0 + 10; x < X1 - 4; x += 10) d += `M${x},${y - h / 2 + 3}v${h - 6}`;
    const cells = S.path({ d, stroke: '#ffffff', strokeOpacity: o.faint ? 0.08 : 0.16, sw: 1, cap: 'butt' }, g);
    cells.setAttribute('data-audit', 'ignore');
    g.span = (tone, fn) => {
      const r = S.rect({ x: X0, y: y - h / 2, w: 0, h, r: Math.min(8, h / 2), fill: tone === 'helps' ? 'url(#card-helps)' : 'url(#card-compute)', stroke: tone, sw: 2.5 }, fills);
      const r0 = S.rect({ x: X0, y: y - h / 2, w: 0, h, r: Math.min(8, h / 2), fill: CH15.BASE }, fills);
      fills.insertBefore(r0, r);
      whole(t => { const [a, b] = fn(t), w = Math.max(0, b - a); [r0, r].forEach(e => { e.setAttribute('x', a.toFixed(1)); e.setAttribute('width', Math.max(0.01, w).toFixed(1)); setO(e, w > 0.5 ? 1 : 0); }); });
    };
    g.notch = (x, at, caret = true) => {
      const n = S.g(null, g);
      S.rect({ x: x - 5, y: y - h / 2 - 4, w: 10, h: h + 8, r: 3, fill: '#ffffff' }, n);
      if (caret) S.path({ d: `M${x - 9},${y - h / 2 - 16} L${x},${y - h / 2 - 7} L${x + 9},${y - h / 2 - 16}`, stroke: 'ink', sw: 3 }, n);
      n.setAttribute('data-audit', 'ignore');
      rise(n, at, -8, 0.3);
      return n;
    };
    g.y = y; g.h = h;
    return g;
  };

  // ================================================================ b1: the rule, and one bar
  // the rule's card and its one bar (y 120-495) are the whole picture in b1: the camera holds them 180 px lower,
  // and eases back as the two bars of b2 fill the space under the card
  S.xset(S.camera, { x: 0, y: 180, s: 1 });
  const card = S.g();
  const glow = S.rect({ x: 520, y: 100, w: 880, h: 160, r: 40, fill: 'url(#pglow-helps)', opacity: 0 }, card);
  glow.setAttribute('data-audit', 'ignore');
  const cardR = S.rect({ x: 560, y: 120, w: 800, h: 120, r: 22, fill: CH15.BASE, stroke: 'helps', sw: 3 }, card);
  const cardF = S.rect({ x: 560, y: 120, w: 800, h: 120, r: 22, fill: 'url(#card-helps)' }, card);
  K.draw(cardR, 1900, T('b1~whole') - 0.1, 0.8);
  hide(cardF);
  fade(cardF, 0, 1, T('b1~whole') + 0.3, 0.5);
  const type = (str, y, size, weight, color, a, b, parent = card) => {
    const w = S.measure(str, { size, weight });
    const e = S.text('', { x: 960 - w / 2, y, size, weight, color }, parent);
    whole(t => { const n = Math.round(str.length * cl((t - a) / (b - a))); e.textContent = str.slice(0, n); });
    return e;
  };
  type('compare from token 1,', 160, 40, 750, 'ink', T('b1~Compare') - 0.1, T('b1~one#2') + 0.25);
  type('stop at the first difference', 206, 36, 700, 'helps', T('b1~stop') - 0.1, T('b1~difference') + 0.45);
  const bar1G = S.g();
  const bar1 = tokenBar(420, 44, { parent: bar1G });
  const tBar = T('b1~difference') + 0.1, tBef = T('b1~Before') - 0.1, tMiss = T('b1~miss') - 0.1, NX = X0 + Math.round(W * 2 / 3);
  rise(bar1G, tBar, 10, 0.45);
  bar1.span('helps', t => [X0, X0 + (NX - 5 - X0) * EIO(cl((t - tBef - 0.25) / 0.8))]);
  bar1.span('compute', t => [NX + 5, NX + 5 + (X1 - NX - 5) * EIO(cl((t - tMiss) / 0.5))]);
  bar1.notch(NX, tBef);
  const hitL = S.text('hit: reused', { x: (X0 + NX) / 2, y: 486, size: 28, weight: 750, anchor: 'middle', color: 'helps' }, bar1G);
  rise(hitL, T('b1~hit') - 0.05, 8);
  const missL = S.text('miss: prefill', { x: (NX + X1) / 2, y: 486, size: 28, weight: 750, anchor: 'middle', color: 'compute' }, bar1G);
  rise(missL, tMiss + 0.25, 8);
  fade(bar1G, 1, 0, tB2, 0.4);

  // ================================================================ b2: how identical, and from where
  S.add(S.fx.cam({ d: 0.8, ease: 'power2.inOut' }), tB2 - 0.2);
  const tSim = T('b2~similar') - 0.1, tIdent = T('b2~identical') - 0.1, tPairs = T('b2~Diverge') - 0.1;
  const q1s = 'how similar?', q1w = S.measure(q1s, { size: 32, weight: 700 });
  const q1 = S.text(q1s, { x: 960, y: 316, size: 32, weight: 700, anchor: 'middle', color: 'muted' });
  rise(q1, tSim, 8);
  const qx = S.path({ d: `M${960 - q1w / 2 - 8},318 H${960 + q1w / 2 + 8}`, stroke: 'muted', sw: 3.5 });
  qx.setAttribute('data-audit', 'ignore');
  K.draw(qx, q1w + 16, tSim + 0.5, 0.3);
  const qG = S.g();
  type('how identical, and from where?', 364, 32, 750, 'helps', tIdent, T('b2~where') + 0.4, qG);
  fade([q1, qx, qG], 1, 0.3, tPairs + 0.3, 0.5);
  // two pairs: a faint cached bar over a bright arriving bar
  const pairsG = S.g();
  const mkPair = (yc, at) => {
    const g = S.g(null, pairsG);
    const c = tokenBar(yc - 20, 20, { faint: true, parent: g }), a = tokenBar(yc + 20, 34, { parent: g });
    K.track(g, [K.K(at, { x: -30, o: 0 }), K.K(at + 0.6, { x: 0, o: 1, e: 'power3.out' })]);
    return { g, c, a };
  };
  const P1 = mkPair(536, tPairs), P2 = mkPair(756, tPairs + 0.25);
  const legend = ch15Tag(S, { x: X1, y: 448, anchor: 'end', lines: ['every bar: 1,032 tokens', 'faint = cached, bright = arriving'] }, pairsG);
  rise(legend, tPairs + 0.6, 6);
  // the very end: the notch at the last token, a teal sweep up to it
  const tEnd = T('b2~very') - 0.1, tFirst = T('b2~first') - 0.1;
  const LAST = X1 - 6;
  P1.a.notch(LAST, tEnd, false);
  P1.a.span('helps', t => [X0, X0 + (LAST - 5 - X0) * EIO(cl((t - tEnd - 0.2) / 1.2))]);
  const l1 = S.text('last token differs: 1,031 hit · 99.9%', { x: 960, y: 612, size: 28, weight: 750, anchor: 'middle', color: 'helps' }, pairsG);
  rise(l1, tEnd + 1.3, 8);
  // the first word: the notch at token 1; the sweep stops at once and the whole bar fills amber
  const FIRST = X0 + 6;
  P2.a.notch(FIRST, tFirst, false);
  const stop = S.rect({ x: X0 - 4, y: 776 - 26, w: 8, h: 52, r: 3, fill: 'helps', opacity: 0 }, pairsG);
  stop.setAttribute('data-audit', 'ignore');
  K.pulse(stop, tFirst + 0.25, 1, 0.4);
  P2.a.span('compute', t => [X0 + 11, X0 + 11 + (X1 - X0 - 11) * EIO(cl((t - tFirst - 0.55) / 0.6))]);
  const l2 = S.text('first token differs: 0 hit · 1,032 prefilled', { x: 960, y: 832, size: 28, weight: 750, anchor: 'middle', color: 'compute' }, pairsG);
  rise(l2, tFirst + 1.0, 8);
  // between the pairs: the same 1,031 tokens in common both times
  const brG = S.g(null, pairsG);
  const br = S.path({ d: `M${X0 - 10},536 H${X0 - 26} V756 H${X0 - 10}`, stroke: 'muted', sw: 2.5 }, brG);
  br.setAttribute('data-audit', 'ignore');
  ch15Tag(S, { x: X0, y: 676, lines: '1,031 tokens in common, both times' }, brG);
  rise(brG, T('b2~nothing') - 0.1, 6);

  // ================================================================ b3: order matters as much as content
  const tOrd = T('b3~Order') - 0.1, tMerge = tOrd + 0.2;
  fade([P1.c, P2.c, legend, l1, l2, brG], 1, 0, tOrd, 0.4);
  fade([q1, qx, qG], 0.3, 0, tOrd, 0.4);
  // the two arriving bars slide together onto the strip's line and fade as the strip appears
  K.track(P1.a, [K.K(tMerge, { y: 0 }), K.K(tMerge + 0.8, { y: 4 })]);
  K.track(P2.a, [K.K(tMerge, { y: 0 }), K.K(tMerge + 0.8, { y: -216 })]);
  fade([P1.a, P2.a], 1, 0, tMerge + 0.7, 0.35);
  const KIND = [
    ["provider's prompt", '#5b8def', 'b3~most'], ['your instructions', '#86b6ff', 'b3~yours'],
    ['conversation so far', '#4a6fc4', 'b3~conversation'], ['newest message', '#a9cdff', 'b3~newest'],
  ];
  const SY = 560, SH = 56, GAP = 10;
  const raw = KIND.map(([s]) => S.measure(s, { size: 26, weight: 650 }) + 64), scale = (W - 3 * GAP) / raw.reduce((a, b) => a + b, 0);
  const segW = raw.map(w => w * scale);
  const segX = segW.map((w, i) => X0 + segW.slice(0, i).reduce((a, b) => a + b, 0) + GAP * i);
  const strip = S.g(), segL = S.g(null, strip), sweepL = S.g(null, strip), labL = S.g(null, strip);
  const tSplit = T('b3~most') - 0.2, F = W / (W - 3 * GAP);
  const segs = KIND.map(([s, c, cue], i) => {
    const g = S.g(null, segL);
    const base = S.rect({ x: segX[i], y: SY - SH / 2, w: segW[i], h: SH, r: 12, fill: CH15.BASE }, g);
    const blue = S.rect({ x: segX[i], y: SY - SH / 2, w: segW[i], h: SH, r: 12, fill: '#1d3566', stroke: 'struct', strokeOpacity: 0.85, sw: 2 }, g);
    const tint = S.rect({ x: segX[i], y: SY - SH / 2, w: segW[i], h: SH, r: 12, fill: c, fillOpacity: 0.22, stroke: c, sw: 2.5 }, g);
    // before the split the four sit flush as one strip; the gaps open on 'most shared'
    const fx0 = X0 + F * segW.slice(0, i).reduce((a, b) => a + b, 0), fw = F * segW[i];
    whole(t => {
      const k = EIO(cl((t - tSplit) / 0.5));
      [base, blue, tint].forEach(r => { r.setAttribute('x', (fx0 + (segX[i] - fx0) * k).toFixed(1)); r.setAttribute('width', (fw + (segW[i] - fw) * k).toFixed(1)); r.setAttribute('rx', (4 + 8 * k).toFixed(1)); });
    });
    hide(tint);
    fade(tint, 0, 1, T(cue) - 0.1, 0.4);
    const lab = S.text(s, { x: segX[i] + segW[i] / 2, y: SY + 1, size: 26, weight: 650, anchor: 'middle', color: 'ink' }, labL);
    rise(lab, T(cue) - 0.05, 0, 0.35);
    return { g, x: segX[i], w: segW[i] };
  });
  rise(strip, tMerge + 0.6, 0, 0.4);
  const ord = S.g();
  S.arrow({ x1: X0, y1: 632, x2: X1, y2: 632, color: 'muted', sw: 2.5, head: 12 }, ord);
  S.text('most shared → most specific', { x: 960, y: 668, size: 26, weight: 600, anchor: 'middle', color: 'muted' }, ord);
  rise(ord, T('b3~message') + 0.1, 6);
  // this rule is why: a teal sweep over the first three, the newest message amber
  const tWhy = T('b3~This') - 0.1, sEnd = segs[2].x + segs[2].w;
  const sweepRects = segs.slice(0, 3).map(sg => {
    const r0 = S.rect({ x: sg.x, y: SY - SH / 2, w: 0, h: SH, r: 12, fill: CH15.BASE }, sweepL);
    const r = S.rect({ x: sg.x, y: SY - SH / 2, w: 0, h: SH, r: 12, fill: 'url(#card-helps)', stroke: 'helps', sw: 2.5 }, sweepL);
    return [sg, r0, r];
  });
  whole(t => {
    const sx = X0 + (sEnd - X0) * EIO(cl((t - tWhy) / 1.0));
    sweepRects.forEach(([sg, r0, r]) => { const w = Math.max(0, Math.min(sg.w, sx - sg.x)); [r0, r].forEach(e => { e.setAttribute('width', Math.max(0.01, w).toFixed(1)); setO(e, w > 0.5 ? 1 : 0); }); });
  });
  K.ignore(sweepRects.flatMap(s => s.slice(1)), tWhy, 1.1);
  const newA = S.g(null, sweepL);
  S.rect({ x: segs[3].x, y: SY - SH / 2, w: segs[3].w, h: SH, r: 12, fill: CH15.BASE }, newA);
  S.rect({ x: segs[3].x, y: SY - SH / 2, w: segs[3].w, h: SH, r: 12, fill: 'url(#card-compute)', stroke: 'compute', sw: 3 }, newA);
  hide(newA);
  fade(newA, 0, 1, tWhy + 1.0, 0.35);

  // ================================================================ b4: one sentence, applied case by case
  const tOut = T('b4~next') - 0.2;
  fade([strip, ord, P1.g, P2.g, pairsG, q1, qx, qG], 1, 0, tOut, 0.45);
  K.track(card, [K.K(tOut + 0.2, { y: 0, s: 1 }), K.K(tOut + 1.2, { y: 360, s: 1.2, e: 'power3.inOut' })], 960, 180);
  K.ignore(card, tOut + 0.2, 1.1);
  whole(t => glow.setAttribute('opacity', (0.8 * cl((t - tOut - 0.9) / 0.6)).toFixed(3)));
});
