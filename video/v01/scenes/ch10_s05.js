/* ch10_s05 · what the rule does not count (figs 114, 115)
   Checked: per context token 64 × 128 × 2 (score + blend) × 2 ops × 80 layers = 2,621,440 ≈ 2.6 million;
   at 2,048 tokens 5.37 bn (+3.8 %), 8,192: 21.5 bn (+15.3 %), 128,000: 335.5 bn (+239.7 %, 2.4 × 140 bn);
   the embedding table is 128,256 × 8,192 = 1.49 % of the parameters.
   b1  header 'What the rule does not count'; q, six k and six v pills; pulses from q to each k, scores; softmax
       turns them into shares; the shares flow into the v pills, which pour into one blended output; cards
       'query × keys', 'shares × values'.
   b2  a bracket 'made from your tokens'; the cards merge: 'activation × activation'; a weight tile crossed
       out, 'no parameter involved'; subheader 'real work, never counted'.
   b3  the k and v rows extend ('grows with context, not model size'); the equation builds:
       'scores 64 × 128 = 8,192', '+ blend 8,192', '× 2 ops = 32,768 per layer', '× 80 layers',
       '= 2.6 million per context token'.
   b4  a chart to scale: '140 billion · the weights'; contexts 2,048 (5.4 bn · +4%, 'rounding error'), 8,192
       (21.5 bn · +15%), 128,000 (335.5 bn · +240%, '2.4 × the weights').
   b5  two chips under the chart: the embedding table (≈ 1.5 % of parameters, '0 multiplies', down-arrow
       'counted, never multiplied') and softmax + normalisation (up-arrow 'uncounted: adds a little').
   b6  'operations = 2 × parameters' / 'short contexts only'; then all dims but 'the rule prices the weights' /
       'the whole story only while context is short'.
   Layout: header centred. The close-up (q at x 220, rows from x 360, 92 apart; the cards on one axis, COL) is
   one picture, centred below the header by a pane: (75, 227) while it is alone, up 99 at b3 to make room for the
   equation, which is centred under it. Chart rows y 380-660 from x 367, labels and bars centred (4.173 px per
   billion, so 335.5 bn = 1,400 px); two equal chips y 790-910 under it, each with its contents centred. */
V.scene('ch10_s05', S => {
  const K = ch10Kit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;

  const hd = S.text('What the rule does not count', { x: 960, y: 130, size: 46, weight: 700, family: 'display', anchor: 'middle', color: 'ink' });
  const sub = S.text('real work, never counted', { x: 960, y: 186, size: 30, weight: 650, anchor: 'middle', color: 'compute' });
  hide([hd, sub]);
  fade(hd, 0, 1, 0.3, 0.5);
  const close = S.g();          // the attention close-up (b1-b3)

  // ================================================================ b1: scores and blends
  const QX = 220, RX = i => 360 + i * 92, KY = 300, VY = 400;
  const q = ch10Pill(S, { text: 'q', x: QX, y: 350, kind: 'prompt', size: 28, h: 52 }, close);
  const ks = [], vs = [];
  const addPair = i => {
    const k = ch10Pill(S, { text: 'k', x: RX(i), y: KY, kind: 'prompt' }, close), v = ch10Pill(S, { text: 'v', x: RX(i), y: VY, kind: 'answer' }, close);
    ks.push(k); vs.push(v);
    return [k, v];
  };
  for (let i = 0; i < 6; i++) addPair(i);
  hide([q, ...ks, ...vs]);
  fade(q, 0, 1, T('b1~Attention') - 0.2, 0.4);
  fade([...ks, ...vs], 0, 1, T('b1~Attention'), 0.3, 0.04);
  // pulses from q to each key, and the scores above
  const tEv = T('b1~every') - 0.1;
  const fx = S.g(null, close);
  fx.setAttribute('data-audit', 'ignore');
  ks.forEach((k, i) => {
    const dot = S.circle({ x: 0, y: 0, r: 5, fill: 'compute' }, fx);
    whole(t => { const u = cl((t - tEv - 0.05 * i) / 0.4); dot.setAttribute('transform', `translate(${lerp(QX + 30, k.cx, u).toFixed(1)},${lerp(345, KY, u).toFixed(1)})`); setO(dot, u > 0 && u < 1 ? 1 : 0); });
  });
  const SC = ['2.1', '0.4', '1.3', '-0.2', '0.9', '0.1'], SH = ['0.43', '0.08', '0.20', '0.04', '0.13', '0.06'];
  const scores = SC.map((s, i) => S.text(s, { x: RX(i), y: KY - 44, size: 22, weight: 650, family: 'mono', anchor: 'middle', color: 'compute' }, close));
  const shares = SH.map((s, i) => S.text(s, { x: RX(i), y: KY - 44, size: 22, weight: 650, family: 'mono', anchor: 'middle', color: 'compute' }, close));
  hide([...scores, ...shares]);
  scores.forEach((s, i) => fade(s, 0, 1, tEv + 0.35 + 0.05 * i, 0.2));
  const softT = S.pill('softmax', { x: RX(5) + 90, y: KY - 44, tone: 'neutral', size: 22, h: 38, anchor: 'start' }, close);
  hide(softT);
  const tSoft = T('b1~then') - 0.15;
  fade(softT, 0, 1, tSoft, 0.3);
  fade(scores, 1, 0, tSoft + 0.25, 0.25);
  fade(shares, 0, 1, tSoft + 0.3, 0.25);
  // the shares flow into the values, which pour into one blended output
  const tBl = T('b1~blends') - 0.1;
  const BLX = 980;
  const blended = ch10Pill(S, { text: 'blended', x: BLX, y: VY, kind: 'answer', size: 24 }, close);
  const blArr = S.path({ d: `M${RX(5) + 40},${VY} H${BLX - 62}`, stroke: 'struct', sw: 2.5 }, close);
  hide([blended, blArr]);
  vs.forEach((v, i) => {
    const d1 = S.circle({ x: 0, y: 0, r: 4.5, fill: 'compute' }, fx), d2 = S.circle({ x: 0, y: 0, r: 4.5, fill: 'struct' }, fx);
    whole(t => {
      const u = cl((t - tBl - 0.04 * i) / 0.35), w = cl((t - tBl - 0.5 - 0.04 * i) / 0.5);
      d1.setAttribute('transform', `translate(${RX(i)},${lerp(KY - 30, VY - 20, u).toFixed(1)})`); setO(d1, u > 0 && u < 1 ? 1 : 0);
      d2.setAttribute('transform', `translate(${lerp(RX(i), BLX - 60, w).toFixed(1)},${(VY + 26 - 26 * w).toFixed(1)})`); setO(d2, w > 0 && w < 1 ? 1 : 0);
    });
  });
  fade(blArr, 0, 1, tBl + 0.5, 0.3);
  fade(blended, 0, 1, tBl + 0.9, 0.3);
  const COL = 1388;             // the cards' axis: each card, the merged card and 'no parameter involved' centre on it
  const cardQK = S.pill('query × keys', { x: COL, y: KY, tone: 'compute', size: 26, h: 50 });
  const cardSV = S.pill('shares × values', { x: COL, y: VY, tone: 'compute', size: 26, h: 50 });
  hide([cardQK, cardSV]);
  fade(cardQK, 0, 1, tEv + 0.6, 0.35);
  fade(cardSV, 0, 1, tBl + 0.6, 0.35);

  // ================================================================ b2: activations, not weights
  const tB2 = T('b2') - 0.1;
  fade([softT, ...shares], 1, 0, tB2, 0.3);
  const br = S.bracket({ x1: q.l, x2: vs[5].r, y: 446, label: 'made from your tokens', tone: 'muted', size: 26 });
  hide(br);
  fade(br, 0, 1, T('b2~made') - 0.1, 0.4);
  const tAct = T('b2~activations') - 0.1;
  K.track(cardQK, [K.K(tAct, { y: 0 }), K.K(tAct + 0.4, { y: 50 })]);
  K.track(cardSV, [K.K(tAct, { y: 0 }), K.K(tAct + 0.4, { y: -50 })]);
  fade([cardQK, cardSV], 1, 0, tAct + 0.1, 0.3);
  const merged = S.pill('activation × activation', { x: COL, y: 350, tone: 'compute', size: 28, h: 56 });
  const mGlow = S.rect({ x: merged.l - 10, y: merged.t - 10, w: merged.w + 20, h: merged.h + 20, r: 36, fill: 'compute', opacity: 0 });
  mGlow.setAttribute('data-audit', 'ignore');
  hide(merged);
  fade(merged, 0, 1, tAct + 0.3, 0.35);
  const noW = S.g();
  const wt = S.g(null, noW);
  S.rect({ x: 1300, y: 430, w: 56, h: 56, r: 8, fill: 'url(#card-struct)', stroke: 'struct', sw: 2 }, wt);
  [0, 1, 2].forEach(r => [0, 1, 2].forEach(c => S.rect({ x: 1308 + c * 16, y: 438 + r * 16, w: 10, h: 10, r: 2, fill: 'struct', fillOpacity: (r + c) % 2 ? 0.3 : 0.7 }, wt)));
  S.path({ d: 'M1292,422 L1364,494 M1364,422 L1292,494', stroke: 'muted', sw: 4 }, noW).setAttribute('data-audit', 'ignore');
  S.text('no parameter involved', { x: 1380, y: 458, size: 26, weight: 650, color: 'muted' }, noW);
  noW.setAttribute('transform', `translate(${(COL - (1292 + 1380 + S.measure('no parameter involved', { size: 26, weight: 650 })) / 2).toFixed(1)},0)`);
  hide(noW);
  fade(noW, 0, 1, T('b2~not') - 0.1, 0.4);
  const tReal = T('b2~real') - 0.1;
  pulse(mGlow, tReal, 0.25, 1.0);
  fade(sub, 0, 1, tReal + 0.2, 0.45);

  // ================================================================ b3: it grows with context
  const tB3 = T('b3') - 0.1;
  fade([br, merged, noW, blended, blArr], 1, 0, tB3, 0.35);
  const tLen = T('b3~context') - 0.1;
  const more = [];
  for (let i = 6; i < 14; i++) { const pair = addPair(i); hide(pair); fade(pair, 0, 1, tLen + 0.1 * (i - 6), 0.2); more.push(...pair); }
  const GC = (q.l + more[more.length - 1].r) / 2;   // the centre of the whole close-up once the rows have grown
  const grows = S.text('grows with context, not model size', { x: GC, y: 236, size: 26, weight: 650, anchor: 'middle', color: 'muted' });
  hide(grows);
  fade(grows, 0, 1, tLen + 0.5, 0.4);
  // the equation, one term per spoken number, its lines left-aligned in a block centred under the close-up
  const ES = 32, EX = GC - S.measure('= 2.6 million per context token', { size: ES, weight: 700, family: 'mono' }) / 2, EY = 520;
  const eq = (txt, y, cue, off = 0) => { const e = S.text(txt, { x: EX, y, size: ES, weight: 700, family: 'mono', color: 'compute' }); hide(e); fade(e, 0, 1, T(cue) - 0.1 + off, 0.35); return e; };
  const e1a = eq('64 heads', EY, 'b3~sixty');
  const e1b = S.text('scores 64 × 128 = 8,192', { x: EX, y: EY, size: ES, weight: 700, family: 'mono', color: 'compute' });
  hide(e1b);
  const tE1 = T('b3~numbers') - 0.1;
  fade(e1a, 1, 0, tE1, 0.25);
  fade(e1b, 0, 1, tE1 + 0.15, 0.3);
  const e2 = eq('+ blend 8,192', EY + 46, 'b3~numbers', 0.5);
  const e3 = eq('× 2 ops = 32,768 per layer', EY + 92, 'b3~two');
  const e4 = eq('× 80 layers', EY + 138, 'b3~eighty');
  const e5 = eq('= 2.6 million per context token', EY + 184, 'b3~two#2');
  e5.setAttribute('fill', S.tone('ink'));
  // b1-b3 as one picture, centred below the header: lower while the close-up is alone, up 99 when the equation comes
  const pane = S.g();
  [...S.main.children].filter(e => e !== pane && e !== hd && e !== sub).forEach(e => pane.appendChild(e));
  whole(t => pane.setAttribute('transform', `translate(75,${(227 - 99 * EIO(cl((t - tB3 - 0.1) / 0.7))).toFixed(1)})`));

  // ================================================================ b4: against the weights, to scale
  const tB4 = T('b4') - 0.1;
  fade([close, ...more, grows, e1b, e2, e3, e4, e5, sub], 1, 0, tB4, 0.4);
  const CX0 = 367, PXB = 1400 / 335.54, CR = [380, 480, 570, 660], BH = 38;   // labels (195 px) + bars (1,400 px) centred
  const chart = S.g();
  S.text('bars to scale', { x: CX0 + 1400, y: 316, size: 22, weight: 600, anchor: 'end', color: 'muted' }, chart);
  S.path({ d: `M${CX0},340 V${CR[3] + 30}`, stroke: 'white', strokeOpacity: 0.3, sw: 2 }, chart);
  hide(chart);
  fade(chart, 0, 1, tB4 + 0.3, 0.4);
  const bar = (y, bn, fill, label, at, d = 0.8) => {
    const r = S.rect({ x: CX0, y: y - BH / 2, w: 0, h: BH, r: 6, fill });
    const lab = S.text(label, { x: CX0 - 18, y, size: 24, weight: 650, anchor: 'end', color: 'ink' });
    hide(lab);
    fade(lab, 0, 1, at - 0.1, 0.3);
    whole(t => r.setAttribute('width', (bn * PXB * EIO(cl((t - at) / d))).toFixed(1)));
    return r;
  };
  const tRef = T('b4~hundred') - 0.1;
  bar(CR[0], 140, 'url(#solid-compute)', 'the weights', tRef, 0.7);
  const refL = S.text('140 billion · the weights', { x: CX0 + 140 * PXB + 16, y: CR[0], size: 26, weight: 700, color: 'ink' });
  hide(refL);
  fade(refL, 0, 1, tRef + 0.6, 0.35);
  const val = (txt, x, y, at, color = 'compute', anchor = 'start') => { const e = S.text(txt, { x, y, size: 26, weight: 700, family: 'mono', anchor, color }); hide(e); fade(e, 0, 1, at, 0.35); return e; };
  const t2k = T('b4~about') - 0.1, t8k = T('b4~At') - 0.1, t128 = T('b4~At#2') - 0.1;
  bar(CR[1], 5.37, 'compute', 'context 2,048', t2k, 0.6);
  val('5.4 bn · +4%', CX0 + 5.37 * PXB + 16, CR[1], t2k + 0.6);
  const round = S.text('rounding error', { x: CX0 + 260, y: CR[1], size: 24, weight: 600, color: 'muted' });
  hide(round);
  fade(round, 0, 1, T('b4~rounding') - 0.1, 0.35);
  fade(round, 1, 0, t8k, 0.3);
  bar(CR[2], 21.47, 'compute', 'context 8,192', t8k, 0.6);
  val('21.5 bn · +15%', CX0 + 21.47 * PXB + 16, CR[2], t8k + 0.6);
  bar(CR[3], 335.54, 'compute', 'context 128,000', t128, 1.6);
  val('335.5 bn · +240%', CX0 + 1400, CR[3] + 46, t128 + 1.5, 'compute', 'end');
  const x24 = S.pill('2.4 × the weights', { x: CX0 + 1400, y: CR[2], tone: 'compute', size: 24, h: 44, anchor: 'start' });
  x24.setAttribute('transform', `translate(${-S.measure('2.4 × the weights', { size: 24, weight: 600 }) - 44},0)`);
  hide(x24);
  fade(x24, 0, 1, T('b4~percent#3') - 0.1, 0.35);
  fade(refL, 1, 0.35, T('b4~stops') - 0.1, 0.4);

  // ================================================================ b5: two small corrections
  // two equal chips, centred as a pair, each with its contents centred in it
  const tE = T('b5~embedding') - 0.1;
  const CW = 760, C1 = 960 - 20 - CW, C2 = 960 + 20;
  const chip1 = S.g();
  S.rect({ x: C1, y: 790, w: CW, h: 120, r: 16, fill: '#0c1326', stroke: 'white', strokeOpacity: 0.18, sw: 2 }, chip1);
  // the slab (140) and its title (from +160), and under them '0 multiplies' (centred on the slab) and the arrow tag
  const e1 = 160 + S.measure('embedding table ≈ 1.5% of parameters', { size: 26, weight: 650 }), z0 = 70 - S.measure('0 multiplies', { size: 22, weight: 650, family: 'mono' }) / 2;
  const SX = Math.round(C1 + CW / 2 - (z0 + e1) / 2);
  S.rect({ x: SX, y: 822, w: 140, h: 12, r: 4, fill: 'url(#solid-struct)' }, chip1);
  S.text('embedding table ≈ 1.5% of parameters', { x: SX + 160, y: 829, size: 26, weight: 650, color: 'ink' }, chip1);
  const qm = S.text('?', { x: SX + 70, y: 868, size: 26, weight: 800, anchor: 'middle', color: 'muted' }, chip1);
  const zero = S.text('0 multiplies', { x: SX + 70, y: 868, size: 22, weight: 650, family: 'mono', anchor: 'middle', color: 'ink' }, chip1);
  hide(zero);
  const down = S.g(null, chip1);
  S.icon('ph:arrow-down-bold', { x: SX + 180, y: 872, size: 30, color: 'muted' }, down);
  S.text('counted, never multiplied', { x: SX + 202, y: 872, size: 24, weight: 600, color: 'muted' }, down);
  hide([chip1, down]);
  fade(chip1, 0, 1, tE, 0.4);
  const tLook = T('b5~lookup') - 0.1;
  fade(qm, 1, 0, tLook, 0.25);
  fade(zero, 0, 1, tLook + 0.2, 0.3);
  fade(down, 0, 1, T('b5~overcount') - 0.1, 0.35);
  const chip2 = S.g();
  S.rect({ x: C2, y: 790, w: CW, h: 120, r: 16, fill: '#0c1326', stroke: 'white', strokeOpacity: 0.18, sw: 2 }, chip2);
  const e2w = Math.max(S.measure('softmax + normalisation', { size: 26, weight: 650 }), 36 + S.measure('uncounted: adds a little', { size: 24, weight: 650 }));
  const SX2 = Math.round(C2 + CW / 2 - e2w / 2);
  S.text('softmax + normalisation', { x: SX2, y: 829, size: 26, weight: 650, color: 'ink' }, chip2);
  const up = S.g(null, chip2);
  S.icon('ph:arrow-up-bold', { x: SX2 + 14, y: 872, size: 30, color: 'compute' }, up);
  S.text('uncounted: adds a little', { x: SX2 + 36, y: 872, size: 24, weight: 650, color: 'compute' }, up);
  hide([chip2, up]);
  const tSm = T('b5~Softmax') - 0.1;
  fade(chip2, 0, 1, tSm, 0.4);
  fade(up, 0, 1, T('b5~add') - 0.2, 0.35);

  // ================================================================ b6: the rule prices the weights
  const tB6 = T('b6') - 0.1;
  const rule = S.text([{ t: 'operations = ', c: 'ink' }, { t: '2', c: 'compute' }, { t: ' × parameters', c: 'struct' }], { x: 960, y: 200, size: 32, weight: 750, anchor: 'middle' });
  const shortT = S.text('short contexts only', { x: 960, y: 244, size: 24, weight: 600, anchor: 'middle', color: 'muted' });
  hide([rule, shortT]);
  fade(rule, 0, 1, tB6, 0.4);
  fade(shortT, 0, 1, tB6 + 0.4, 0.35);
  const tDim = T('b6~and') - 0.1;
  const everything = [...S.main.children].filter(e => e !== rule && e !== shortT);
  const veil = S.rect({ x: 0, y: 0, w: 1920, h: 1080, fill: '#060a14', opacity: 0 });
  veil.setAttribute('data-audit', 'ignore');
  K.ignore(everything, tDim + 0.3, S.duration - tDim);
  S.add(gsap.fromTo(veil, { attr: { opacity: 0 } }, { attr: { opacity: 0.86 }, duration: 0.6, immediateRender: false }), tDim);
  const f1 = S.text('the rule prices the weights', { x: 960, y: 500, size: 46, weight: 750, family: 'display', anchor: 'middle', color: 'ink' });
  const f2 = S.text('the whole story only while context is short', { x: 960, y: 572, size: 36, weight: 650, anchor: 'middle', color: 'muted' });
  hide([f1, f2]);
  fade(f1, 0, 1, tDim + 0.3, 0.45);
  fade(f2, 0, 1, T('b6~only') - 0.1, 0.45);
  void E; void setO;
});
