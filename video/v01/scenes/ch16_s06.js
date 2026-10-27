/* ch16_s06 · same hits, opposite stories (fig 52)
   Against the whole prompt every case looks excellent: A 784 / 788 = 99.5%, B 775 / 777 = 99.7%, C 770 / 777 =
   99.1% (checked), because the 770-token preamble dominates (7 of 777 tokens is a 12.6 px sliver of 1,400 px).
   Counting only your 7 question tokens: A 7 / 7 (plus the history; only the 4 new tokens were fresh), B 5 / 7 =
   71%, C 0 / 7. The first divergence decides; the whole-prompt number is the one usually reported.
   b1  the scoreboard flies to the centre and becomes the table; the 'whole prompt' column fills; 'all above 99%';
       a to-scale bar of 777 units: 'preamble 770', 'your question: 7'; the bar fades.
   b2  'your 7 tokens': A seven teal mini-pills '7 / 7 · 100%', 'plus the whole history', '+4 new, prefilled';
       B five teal and two amber '5 / 7 · 71%'; C seven amber '0 / 7 · 0%'.
   b3  a white marker in each pill row at the first divergence; 'usually reported', 'the part you control';
       'two ways to quote the same hits'.
   Layout: table x 230-1810, y 250-690 (header 250-330; rows A, B, C 120 high, centres 390 / 510 / 630); columns
   case 230-720, whole prompt 720-1150, your 7 tokens 1150-1810; bar y 800; tags y 742; bottom line y 850. The
   table and everything on and around it is drawn at x 230-1810 and moved 60 left, centred; the b1 bar is centred. */
V.scene('ch16_s06', S => {
  const K = libKit(S), { T, cl, E, EIO, whole, setO, hide, fade } = K;
  const tB2 = T('b2') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const RY = [390, 510, 630], C1 = [720, 1150], C2 = [1150, 1810];

  // ================================================================ b1: against the whole prompt
  // the corner scoreboard flies to the centre and hands over to the table
  const score = ch16Score(S, { rows: [{ case: 'time t', hit: 0, pre: 777 }, { case: 'A', hit: 784, pre: 4 }, { case: 'B', hit: 775, pre: 2 }, { case: 'C', hit: 770, pre: 7 }] });
  K.track(score, [K.K(0.5, { x: 0, y: 0, s: 1, o: 1 }), K.K(1.3, { x: -620, y: 260, s: 1.6, o: 0, e: 'power3.inOut' })], 1870, 40);   // onto the table (moved 60 left)
  K.ignore(score, 0.5, 0.9);
  const table = S.g();
  S.rect({ x: 230, y: 250, w: 1580, h: 440, r: 20, fill: CH16.BASE, fillOpacity: 0.92, stroke: '#ffffff', strokeOpacity: 0.18, sw: 1.5 }, table);
  [330, 450, 570].forEach(y => S.line({ x1: 250, y1: y, x2: 1790, y2: y, stroke: '#ffffff', strokeOpacity: y === 330 ? 0.2 : 0.1, sw: 1.5 }, table));
  [C1[0], C2[0]].forEach(x => S.line({ x1: x, y1: 266, x2: x, y2: 674, stroke: '#ffffff', strokeOpacity: 0.1, sw: 1.5 }, table));
  S.text('case', { x: 260, y: 291, size: 26, weight: 700, color: 'muted' }, table);
  S.text('whole prompt', { x: (C1[0] + C1[1]) / 2, y: 291, size: 28, weight: 750, anchor: 'middle', color: 'helps' }, table);
  [['A', 'continue the chat'], ['B', 'France to Japan'], ['C', 'same words, reordered']].forEach(([c, d], i) => {
    S.text(c, { x: 260, y: RY[i] + 1, size: 32, weight: 800, color: 'ink' }, table);
    S.text(d, { x: 300, y: RY[i] + 1, size: 26, weight: 600, color: 'muted' }, table);
  });
  rise(table, 1.0, 16, 0.6);
  const W1 = [['784 / 788 = 99.5%', 'b1~all'], ['775 / 777 = 99.7%', 'b1~three'], ['770 / 777 = 99.1%', 'b1~hits']];
  W1.forEach(([s, c], i) => { const e = S.text(s, { x: (C1[0] + C1[1]) / 2, y: RY[i] + 1, size: 30, weight: 800, anchor: 'middle', color: 'helps' }); rise(e, T(c) - 0.1, 8); });
  const br = S.g();
  const brp = S.path({ d: `M${C1[0] + 24},696 V706 H${C1[1] - 24} V696`, stroke: 'helps', sw: 2.5 }, br);
  brp.setAttribute('data-audit', 'ignore');
  S.text('all above 99%', { x: (C1[0] + C1[1]) / 2, y: 736, size: 26, weight: 750, anchor: 'middle', color: 'helps' }, br);
  rise(br, T('b1~or') - 0.1, 6);
  fade(br, 1, 0, tB2, 0.35);
  // to scale: 777 units = 1,400 px; the preamble 770 (1,387 px), your question 7 (12.6 px)
  const U = 1400 / 777, BX = 260, BY = 810;
  const tBar = T('b1~preamble') - 0.15;
  const bar = S.g();
  const teal = S.rect({ x: BX, y: BY - 20, w: 0, h: 40, r: 8, fill: 'url(#card-helps)', stroke: 'helps', sw: 2.5 }, bar);
  whole(t => { const k = EIO(cl((t - tBar) / 0.8)); teal.setAttribute('width', Math.max(0.01, 770 * U * k).toFixed(1)); });
  const sliver = S.rect({ x: BX + 770 * U, y: BY - 20, w: 7 * U, h: 40, fill: 'struct' }, bar);
  sliver.setAttribute('data-audit', 'ignore');
  hide(sliver);
  fade(sliver, 0, 1, tBar + 0.8, 0.2);
  const preL = S.text('preamble 770', { x: BX + 770 * U / 2, y: BY + 1, size: 26, weight: 750, anchor: 'middle', color: 'ink' }, bar);
  rise(preL, tBar + 0.6, 0);
  const ptr = S.g(null, bar);
  const pp = S.path({ d: `M${BX + 773.5 * U},${BY + 22} V${BY + 44}`, stroke: 'struct', sw: 2.5 }, ptr);
  pp.setAttribute('data-audit', 'ignore');
  S.text('your question: 7', { x: BX + 777 * U, y: BY + 62, size: 26, weight: 750, anchor: 'end', color: 'struct' }, ptr);
  rise(ptr, tBar + 1.0, 6);
  const scaleN = S.text('to scale: 777 tokens = 1,400 px', { x: BX, y: BY - 44, size: 22, weight: 600, color: 'muted' }, bar);
  rise(scaleN, tBar + 0.3, 0);
  fade(bar, 1, 0, tB2 - 0.6, 0.45);

  // ================================================================ b2: count only your seven tokens
  const h2 = S.text('your 7 tokens', { x: (C2[0] + C2[1]) / 2, y: 291, size: 28, weight: 750, anchor: 'middle', color: 'ink' });
  rise(h2, tB2, 6);
  const PX = (i) => C2[0] + 30 + 38 * i;
  const mini = (i, y, tone, at, parent) => {
    const g = S.g(null, parent);
    S.rect({ x: PX(i), y: y - 14, w: 32, h: 28, r: 7, fill: CH16.BASE }, g);
    S.rect({ x: PX(i), y: y - 14, w: 32, h: 28, r: 7, fill: `url(#card-${tone})`, stroke: tone, sw: 2 }, g);
    g.setAttribute('data-audit', 'ignore');
    K.track(g, [K.K(at, { y: -10, o: 0 }), K.K(at + 0.25, { y: 0, o: 1, e: 'back.out(2)' })]);
    return g;
  };
  const yA = RY[0] - 24, tA = T('b2~case') - 0.1;
  const cellA = S.g();
  for (let i = 0; i < 7; i++) mini(i, yA, 'helps', tA + 0.06 * i, cellA);
  const fA = S.text('7 / 7 · 100%', { x: PX(7) + 14, y: yA + 1, size: 28, weight: 800, color: 'helps' });
  rise(fA, tA + 0.5, 0);
  const tagH = S.pill('plus the whole history', { x: C2[0] + 30 + S.measure('plus the whole history', { size: 22, weight: 600 }) / 2 + 18, y: RY[0] + 30, tone: 'helps', size: 22, h: 36, padX: 18 });
  rise(tagH, T('b2~plus') - 0.1, 6);
  const tagNx = tagH.r + 16;
  const tagN = S.g();
  const tnw = S.measure('+4 new, prefilled', { size: 22, weight: 600 });
  S.rect({ x: tagNx, y: RY[0] + 12, w: 4 * 22 + 12 + tnw + 30, h: 36, r: 14, fill: CH16.BASE, stroke: 'compute', strokeOpacity: 0.7, sw: 2 }, tagN);
  for (let i = 0; i < 4; i++) S.rect({ x: tagNx + 12 + 22 * i, y: RY[0] + 21, w: 18, h: 18, r: 4, fill: 'url(#card-compute)', stroke: 'compute', sw: 1.5 }, tagN);
  S.text('+4 new, prefilled', { x: tagNx + 12 + 88 + 6, y: RY[0] + 31, size: 22, weight: 650, color: 'compute' }, tagN);
  rise(tagN, T('b2~four') - 0.1, 6);
  const tBf = T('b2~five') - 0.1, tCn = T('b2~none') - 0.1;
  const cellB = S.g(), cellC = S.g();
  for (let i = 0; i < 7; i++) mini(i, RY[1], i < 5 ? 'helps' : 'compute', tBf + 0.06 * i, cellB);
  for (let i = 0; i < 7; i++) mini(i, RY[2], 'compute', tCn + 0.05 * i, cellC);
  const fB = S.text('5 / 7 · 71%', { x: PX(7) + 14, y: RY[1] + 1, size: 28, weight: 800, color: 'helps' });
  rise(fB, tBf + 0.5, 0);
  const fC = S.text('0 / 7 · 0%', { x: PX(7) + 14, y: RY[2] + 1, size: 28, weight: 800, color: 'compute' });
  rise(fC, tCn + 0.4, 0);

  // ================================================================ b3: where the first divergence falls
  const tDiv = T('b3~first') - 0.1;
  [[yA, 7], [RY[1], 5], [RY[2], 0]].forEach(([y, n], k) => {
    const x = n === 0 ? PX(0) - 4 : PX(n) - 3;
    const m = S.rect({ x: x - 2, y: y - 24, w: 4, h: 48, r: 2, fill: '#ffffff' });
    m.setAttribute('data-audit', 'ignore');
    whole(t => { const kk = E('power3.out')(cl((t - tDiv - 0.2 * k) / 0.5)); m.setAttribute('transform', `translate(${(-60 * (1 - kk)).toFixed(1)},0)`); setO(m, kk); });
  });
  const tFl = T('b3~flatters') - 0.1, tCtl = T('b3~control') - 0.1;
  const colGlow = S.rect({ x: C1[0] + 6, y: 256, w: C1[1] - C1[0] - 12, h: 428, r: 14, fill: 'helps', fillOpacity: 0.1, stroke: 'helps', strokeOpacity: 0.6, sw: 2 });
  colGlow.setAttribute('data-audit', 'ignore');
  hide(colGlow);
  fade(colGlow, 0, 1, tFl, 0.4);
  const rep = S.pill('usually reported', { x: (C1[0] + C1[1]) / 2, y: 742, tone: 'helps', size: 24, h: 42 });
  rise(rep, tFl + 0.2, 6);
  const ctl = S.pill('the part you control', { x: (C2[0] + C2[1]) / 2, y: 742, tone: 'neutral', size: 24, h: 42 });
  rise(ctl, tCtl, 6);
  const two = S.text('two ways to quote the same hits', { x: 1020, y: 850, size: 32, weight: 750, anchor: 'middle', color: 'ink' });
  rise(two, T('b3~usually') - 0.1, 8);
  // the table and what is written in and around it, centred (see the header)
  const tableG = S.g();
  [...S.main.children].filter(e => e !== tableG && e !== score && e !== bar).forEach(e => tableG.appendChild(e));
  tableG.setAttribute('transform', 'translate(-60,0)');
});
