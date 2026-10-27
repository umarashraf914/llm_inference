/* ch15_s04 · a cache hit is a prefix match (fig 44)
   A real request is system prompt, tools, history and the new message. The match runs from the front and
   stops at the first difference. The weather prompt was itself a follow-up: 1,027 of 1,032 tokens match,
   5 are prefilled, hit rate 1,027 / 1,032 = 99.5% (checked). Most of it is text the user never wrote.
   b1  the arriving bar builds segment by segment; the cached bar under it; a teal sweep from the front stops
       at 'new': the white line 'the first difference', teal 'hit: reused', amber 'prefill'.
   b2  labels dim; the weather tag; counters 'matched 1,027', 'arriving 1,032', 'prefill 5'; the schematic
       note; '99.5%' with 'hit rate = 1,027 ÷ 1,032'.
   b3  counters dim; provenance tags over the bar: provider, tool docs, model's answers; 'you' marks thin
       slivers of history and the new message.
   b4  the sweep replays; caption 'front to back, stop at the first difference'; warm and cold chips.
   Layout: bars x 260-1700 (segments at 260 | 520 | 820 | 1556 | 1700, 'new' a tenth, schematic); arriving
   y 392-448, cached y 492-548; tags y 346; b1 labels y 596; counters y 668; result x 1640, y 806 / 868. In b1 the
   bars are alone, so the body sits 130 lower, centred below the heading; it rises for b2's counters and result. */
V.scene('ch15_s04', S => {
  const K = libKit(S), { T, cl, E, EIO, whole, setO, hide, fade } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const B = [260, 520, 820, 1556, 1700], NAMES = ['system', 'tools', 'history', 'new'];
  const SHADE = ['#1a3566', '#1f3d74', '#16305e', '#22447f'];
  const AY = 420, CY = 520, H = 56, LX = B[3];
  const fmt = n => Math.round(n).toLocaleString('en-US');

  // ================================================================ b1: the match runs from the front
  const head = S.g();
  S.text('The prompt that arrives,', { x: 960, y: 128, size: 40, weight: 750, anchor: 'middle', color: 'ink' }, head);
  S.text('and what the server holds', { x: 960, y: 176, size: 34, weight: 650, anchor: 'middle', color: 'muted' }, head);
  rise(head, T('b1~Now') - 0.2, 10);

  // the arriving bar: one blue segment per spoken name, each growing from its left edge
  const arrL = S.text('arriving', { x: 240, y: AY + 1, size: 26, weight: 750, anchor: 'end', color: 'muted' });
  rise(arrL, T('b1~request') - 0.1, 0);
  const segG = S.g(), hitG = S.g(), labG = S.g();
  const segAt = [T('b1~system'), T('b1~tools'), T('b1~history'), T('b1~new')].map(t => t - 0.15);
  const segLabels = [];
  B.slice(0, 4).forEach((a, i) => {
    const x0 = a + 3, w = B[i + 1] - a - 6;
    const base = S.rect({ x: x0, y: AY - H / 2, w, h: H, r: 12, fill: CH15.BASE }, segG);
    const skin = S.rect({ x: x0, y: AY - H / 2, w, h: H, r: 12, fill: SHADE[i], stroke: 'struct', strokeOpacity: 0.85, sw: 2 }, segG);
    whole(t => { const k = E('power3.out')(cl((t - segAt[i]) / 0.5)), ww = Math.max(0.01, w * k); [base, skin].forEach(r => r.setAttribute('width', ww.toFixed(1))); setO(base, k > 0 ? 1 : 0); setO(skin, k > 0 ? 1 : 0); });
    const lab = S.text(NAMES[i], { x: x0 + w / 2, y: AY + 1, size: 26, weight: 650, anchor: 'middle', color: 'ink' }, labG);
    rise(lab, segAt[i] + 0.3, 0, 0.3);
    segLabels.push(lab);
  });
  // the cached bar: the same three segments as coral keys and values, then an empty slot under 'new'
  const cacL = S.text('cached', { x: 240, y: CY + 1, size: 26, weight: 750, anchor: 'end', color: 'bytes' });
  const tHold = T('b1~what') - 0.1;
  rise(cacL, tHold, 0);
  const cacG = S.g();
  B.slice(0, 3).forEach((a, i) => {
    const x0 = a + 3, w = B[i + 1] - a - 6;
    const g = S.g(null, cacG);
    S.rect({ x: x0, y: CY - H / 2, w, h: H, r: 12, fill: '#1a0f14', stroke: 'bytes', strokeOpacity: 0.8, sw: 2 }, g);
    for (let x = x0 + 10; x + 21 < x0 + w - 6; x += 26) {
      S.rect({ x, y: CY - 15, w: 10, h: 30, r: 2, fill: '#ff7a85', opacity: 0.4 }, g);
      S.rect({ x: x + 11, y: CY - 15, w: 10, h: 30, r: 2, fill: '#9b3a44', opacity: 0.6 }, g);
    }
    rise(g, tHold + 0.2 * i, 0, 0.45);
  });
  const slot = S.rect({ x: B[3] + 3, y: CY - H / 2, w: B[4] - B[3] - 6, h: H, r: 12, stroke: 'bytes', strokeOpacity: 0.6, sw: 2, dash: '7 6' }, cacG);
  rise(slot, tHold + 0.65, 0, 0.4);

  // the sweep: a teal edge from the front to the first difference (b1), replayed quickly in b4
  const tFront = T('b1~front') - 0.35, tStop = T('b1~stops') + 0.1, tRe = T('b4~fronttoback') + 0.05, tReEnd = tRe + 0.8;
  const sweepX = t => t < tRe ? B[0] + (LX - B[0]) * EIO(cl((t - tFront) / (tStop - tFront))) : B[0] + (LX - B[0]) * EIO(cl((t - tRe) / (tReEnd - tRe)));
  const sweepOn = t => (t > tFront && t < tStop + 0.6) || (t > tRe && t < tReEnd + 0.6);
  // what the sweep leaves behind: teal over the matched segments of both bars
  const hits = [], hitC = S.g();  // hitC sits over the cached bar
  B.slice(0, 3).forEach((a, i) => {
    const x0 = a + 3, w = B[i + 1] - a - 6;
    const r1 = S.rect({ x: x0, y: AY - H / 2, w, h: H, r: 12, fill: CH15.BASE }, hitG);
    const r2 = S.rect({ x: x0, y: AY - H / 2, w, h: H, r: 12, fill: 'url(#card-helps)', stroke: 'helps', sw: 2.5 }, hitG);
    const r3 = S.rect({ x: x0, y: CY - H / 2, w, h: H, r: 12, fill: 'helps', fillOpacity: 0.14, stroke: 'helps', sw: 2.5 }, hitC);
    hits.push([x0, w, [r1, r2, r3]]);
  });
  whole(t => {
    const sx = t < tStop + 0.01 ? sweepX(Math.min(t, tStop)) : LX;
    hits.forEach(([x0, w, rs]) => { const ww = Math.max(0, Math.min(w, sx - x0)); rs.forEach(r => { r.setAttribute('width', Math.max(0.01, ww).toFixed(1)); setO(r, ww > 0.5 ? 1 : 0); }); });
  });
  K.ignore(hits.flatMap(h => h[2]), tFront, tStop - tFront + 0.1);  // the growing edge passes under labels
  // 'new' takes amber once the match has stopped
  const tNew = tStop + 0.9;
  const newA = S.g(null, hitG);
  S.rect({ x: B[3] + 3, y: AY - H / 2, w: B[4] - B[3] - 6, h: H, r: 12, fill: CH15.BASE }, newA);
  S.rect({ x: B[3] + 3, y: AY - H / 2, w: B[4] - B[3] - 6, h: H, r: 12, fill: 'url(#card-compute)', stroke: 'compute', sw: 2.5 }, newA);
  hide(newA);
  fade(newA, 0, 1, tNew, 0.4);
  // the moving edge and the ticks it leaves at segment boundaries
  const sweep = S.g();
  sweep.setAttribute('data-audit', 'ignore');
  S.rect({ x: -30, y: 374, w: 60, h: 192, fill: 'url(#pglow-helps)', opacity: 0.9 }, sweep);
  S.rect({ x: -2.5, y: 376, w: 5, h: 188, r: 2.5, fill: 'helps' }, sweep);
  const ticks = [B[1], B[2]].map(x => {
    const p = S.path({ d: `M${x - 8},360 L${x},369 L${x + 8},360`, stroke: 'helps', sw: 3 });
    p.setAttribute('data-audit', 'ignore');
    return p;
  });
  whole(t => {
    const sx = sweepX(t), on = sweepOn(t);
    const end = t < tRe ? tStop : tReEnd, k = on ? Math.min(cl((t - (t < tRe ? tFront : tRe)) / 0.15), 1 - cl((t - end - 0.2) / 0.4)) : 0;
    sweep.setAttribute('transform', `translate(${sx.toFixed(1)},0)`);
    setO(sweep, k);
    ticks.forEach(p => setO(p, on && sx > parseFloat(p.getAttribute('d').slice(1)) + 8 ? k : 0));
  });
  // the first difference
  const line = S.line({ x1: LX, y1: 370, x2: LX, y2: 566, stroke: '#ffffff', sw: 4 });
  line.setAttribute('data-audit', 'ignore');
  whole(t => { const k = E('power2.out')(cl((t - tStop - 0.05) / 0.45)); line.setAttribute('y2', (370 + 196 * k).toFixed(1)); setO(line, k > 0 ? 1 : 0); });
  const lineL = S.text('the first difference', { x: LX, y: 344, size: 26, weight: 650, anchor: 'middle', color: 'ink' });
  rise(lineL, tStop + 0.35, 6);
  const hitL = S.text('hit: reused', { x: (B[0] + LX) / 2, y: 596, size: 28, weight: 750, anchor: 'middle', color: 'helps' });
  rise(hitL, tStop + 0.6, 8);
  const preL = S.text('prefill', { x: (B[3] + B[4]) / 2, y: 596, size: 28, weight: 750, anchor: 'middle', color: 'compute' });
  rise(preL, tNew + 0.2, 8);

  // ================================================================ b2: 1,027 of 1,032
  const dimB2 = [head, labG, lineL, hitL, preL];
  fade(dimB2, 1, 0.3, tB2, 0.5);
  const wTag = ch15Tag(S, { x: B[0], y: 790, lines: 'weather chat, a minute later', icon: CH15.weather });
  rise(wTag, T('b2~itself') - 0.1, 8);
  const counter = (label, x, tone, at, n, d, opt = {}) => {
    const g = S.g();
    S.text(label, { x: x - 10, y: 669, size: 26, weight: 700, anchor: 'end', color: tone }, g);
    const v = S.text('0', { x: x + 4, y: 668, size: 34, weight: 800, family: 'mono', anchor: 'start', color: tone }, g);
    whole(tt => { v.textContent = fmt(n * (opt.instant ? 1 : E('power2.out')(cl((tt - at) / d)))); });
    rise(g, at - 0.1, 6, 0.3);
    return g;
  };
  const cMatch = counter('matched', 900, 'helps', T('b2~one') - 0.05, 1027, 1.8);
  const cArr = counter('arriving', 400, 'muted', T('b2~one#2') - 0.05, 1032, 1.0);
  const cPre = counter('prefill', 1620, 'compute', T('b2~five') - 0.05, 5, 0.01, { instant: true });
  const note = S.text('bars schematic, not to scale', { x: B[4], y: 722, size: 22, weight: 600, anchor: 'end', color: 'muted' });
  rise(note, T('b2~prefilled') - 0.05, 6);
  const tPct = T('b2~ninetynine') - 0.1;
  const res = S.g();
  S.text('99.5%', { x: 1640, y: 806, size: 84, weight: 800, anchor: 'middle', color: 'helps' }, res);
  S.text('hit rate = 1,027 ÷ 1,032', { x: 1640, y: 870, size: 26, weight: 650, anchor: 'middle', color: 'muted' }, res);
  rise(res, tPct, 12, 0.5);

  // ================================================================ b3: text you never wrote
  fade([cMatch, cArr, cPre, wTag], 1, 0.3, tB3, 0.4);
  fade([lineL, hitL, preL], 0.3, 0, tB3, 0.4);
  const tag = (text, x, at) => { const g = ch15Tag(S, { x, y: 346, anchor: 'middle', lines: text }); rise(g, at, 8); return g; };
  const tags = [
    tag('provider', (B[0] + B[1]) / 2, T('b3~system') - 0.1),
    tag('tool docs', (B[1] + B[2]) / 2, T('b3~tools') - 0.1),
    tag("model's answers", 1150, T("b3~model") - 0.1),
  ];
  // what the user did write: thin slivers of history and the new message
  const tYou = T('b3~own') + 0.05;
  const you = S.g();
  [960, 1260, 1450].forEach(x => {
    S.rect({ x: x - 6, y: AY - H / 2 + 6, w: 12, h: H - 12, r: 3, fill: '#e8eefc', opacity: 0.9 }, you);
    S.path({ d: `M${x - 7},374 L${x},383 L${x + 7},374`, stroke: 'ink', sw: 2.5 }, you);
  });
  S.rect({ x: B[3] + 1, y: AY - H / 2 - 2, w: B[4] - B[3] - 2, h: H + 4, r: 14, stroke: 'ink', sw: 2.5 }, you);
  rise(you, tYou, 0, 0.35);
  const youT = ch15Tag(S, { x: (B[3] + B[4]) / 2, y: 346, anchor: 'middle', lines: 'you', textTone: 'ink', tone: 'ink' });
  rise(youT, tYou + 0.15, 8);

  // ================================================================ b4: the rule for every case to come
  fade([...tags, you, youT, note], 1, 0, tB4 + 0.25, 0.35);
  fade([cMatch, cArr, cPre, wTag], 0.3, 0, tB4 + 0.25, 0.35);
  fade(labG, 0.3, 1, tB4, 0.4);
  const cap = S.text('front to back, stop at the first difference', { x: (B[0] + LX) / 2, y: 610, size: 30, weight: 750, anchor: 'middle', color: 'ink' });
  rise(cap, tRe + 0.5, 8);
  const warm = S.pill('warm: beginning still held', { x: 680, y: 690, tone: 'helps', size: 26, h: 46 });
  rise(warm, T('b4~warm') - 0.1, 8);
  const cold = S.pill('cold: beginning not held', { x: 1130, y: 690, tone: 'neutral', size: 26, h: 46 });
  rise(cold, T('b4~cold') - 0.1, 8);
  // the body: centred below the heading while the bars are alone (b1), up 130 for b2's counters and result
  const body = S.g();
  [...S.main.children].filter(e => e !== body && e !== head).forEach(e => body.appendChild(e));
  whole(t => body.setAttribute('transform', `translate(0,${(130 * (1 - EIO(cl((t - tB2) / 0.8)))).toFixed(1)})`));
  void segG; void segLabels; void cacG;
});
