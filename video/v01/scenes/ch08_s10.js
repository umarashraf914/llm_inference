/* ch08_s10 · the parameter count settles it (fig 101)
   Numbers, checked in Python and shown so every on-screen sum adds up as displayed:
   one layer 151.0 + 704.6 = 855.6 M (exact 855,638,016); × 80 = 68.448 -> '68.45 B'; vocabulary tables
   2 × 128,256 × 8,192 = 2.101 B -> '1.05 B' each, '2.10 B'; total 68.45 + 2.10 = '70.55 B' (exact 70.552 B);
   what-if: W_Q + W_K + W_V = 83.886 M -> '83.9 M'; 79 × 83.9 M = '6.63 B'; 70.55 - 6.63 = '63.92 B'
   (exact 63.925 B); attention 151.0 / 855.6 = 17.6 %, feed-forward 82.4 %.
   b1  the ledger, centred and large, 'The parameter count settles it': 'one layer 855.6 M' with a bar split
       17.6 % attention / 82.4 % feed-forward; '× 80 layers' runs to 68.45 B.
   b2  two tall thin blue vocabulary tables slide in at the left: 'embedding 128,256 × 8,192', '1.05 B',
       '= 2.1 GB at 2 bytes'; 'output projection' / 'output head', '1.05 B', tag 'separate here'; both merge
       into the row 'embedding + output head 2.10 B'.
   b3  a rule; 'total' runs to 70.55 B; a grey stamp 'advertised: 70 B' presses in; a tick between.
   b4  the ledger moves left; a dashed grey ledger 'if Q, K, V existed once': 'W_Q + W_K + W_V = 83.9 M per
       layer', '× 79 removed = 6.63 B' (the line struck through), total 70.55 B down to 63.92 B, and a gap
       bar from 63.92 B to the advertised 70 B: 'over 6 B missing'.
   b5  the dashed ledger goes; the real one returns to the centre: 'only per-layer matrices add up'; the
       corner key brightens once.
   Layout: card 820 wide, y 190-840 (x 680, b4 x 100, b5 x 550); dashed card x 990-1810; key bottom left. */
V.scene('ch08_s10', S => {
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
  const track = (el, keys, ox = 0, oy = 0) => whole(t => {
    const st = stateAt(keys, t), s = st.s ?? 1, o = st.o ?? 1;
    el.setAttribute('transform', `translate(${(ox + (st.x ?? 0)).toFixed(1)},${(oy + (st.y ?? 0)).toFixed(1)}) rotate(${(st.r ?? 0).toFixed(2)}) scale(${s.toFixed(4)}) translate(${-ox},${-oy})`);
    el.setAttribute('opacity', o.toFixed(3));
    el.style.visibility = o > 0.002 ? 'inherit' : 'hidden';
  });
  const count = (el, t0, d, from, to, fmt, ease = 'power2.out') => whole(t => { el.textContent = fmt(lerp(from, to, E(ease)(cl((t - t0) / d)))); });
  const M = v => `${v.toFixed(1)} M`, B2 = v => `${v.toFixed(2)} B`;

  // ================================================================ the corner key (from s09) and the card
  const keyG = S.g();
  S.icon('ph:book-open-duotone', { x: 124, y: 1008, size: 30, color: 'muted' }, keyG);
  const keyT = S.text('shapes: published 70B model (Llama 3 70B)', { x: 150, y: 1008, size: 22, weight: 600, color: 'muted' }, keyG);
  const keyHi = S.text('shapes: published 70B model (Llama 3 70B)', { x: 150, y: 1008, size: 22, weight: 600, color: 'ink' });
  keyHi.setAttribute('data-audit', 'ignore');    // a brighter copy laid over the key
  ch08Hide(keyHi);
  const CX = 680, CW = 820, CY = 190, CH = 650, LX = CX + 40, VX = CX + CW - 40;
  const cardG = S.g();
  S.rect({ x: CX, y: CY, w: CW, h: CH, r: 20, fill: '#0b1224', stroke: 'struct', strokeOpacity: 0.5, sw: 2 }, cardG);
  S.text('The parameter count settles it', { x: LX, y: CY + 60, size: 40, weight: 750, family: 'display', color: 'ink' }, cardG);
  S.path({ d: `M${LX},${CY + 102} H${VX}`, stroke: 'white', strokeOpacity: 0.18, sw: 2 }, cardG);
  const row = (label, val, y, o = {}) => {
    const g = S.g(null, cardG);
    g.lab = S.text(label, { x: LX, y, size: o.size ?? 28, weight: 650, color: 'ink' }, g);
    g.val = S.text(val, { x: VX, y, size: o.vsize ?? 32, weight: 700, family: 'mono', anchor: 'end', color: 'compute' }, g);
    return g;
  };
  const Y = { att: 350, ff: 410, one: 490, bar: 530, x80: 630, voc: 690, rule: 732, tot: 785 };
  row('attention, per layer', '151.0 M', Y.att);
  row('feed-forward, per layer', '704.6 M', Y.ff);
  // where the card sits: x 680 (b1-b3), x 100 (b4), x 550 (b5)
  const tL = T('b4') - 0.2, tR = T('b5') + 0.1;
  const cardX = t => lerp(lerp(0, 100 - CX, EIO(cl((t - tL) / 0.8))), 550 - CX, EIO(cl((t - tR) / 0.8)));
  whole(t => cardG.setAttribute('transform', `translate(${cardX(t).toFixed(1)},0)`));
  S.add(ch08Ignore(cardG, 0.85), tL);
  S.add(ch08Ignore(cardG, 0.85), tR);

  // ================================================================ b1: one layer, × 80
  const sumRule = S.path({ d: `M${VX - 230},${Y.one - 38} H${VX}`, stroke: 'white', strokeOpacity: 0.35, sw: 2 }, cardG);
  const rOne = row('one layer', '0.0 M', Y.one);
  ch08Hide([sumRule, rOne]);
  const tOne = T('b1~One') - 0.1;
  fade([sumRule, rOne], 0, 1, tOne, 0.4);
  count(rOne.val, T('b1~eight') - 0.1, 1.6, 0, 855.6, M);
  // the split of one layer
  const BW = VX - LX, attW = BW * 0.176;
  const bar = S.g(null, cardG);
  const bA = S.rect({ x: LX, y: Y.bar - 7, w: 0, h: 14, r: 3, fill: 'struct' }, bar);
  const bF = S.rect({ x: LX + attW, y: Y.bar - 7, w: 0, h: 14, r: 3, fill: 'struct', fillOpacity: 0.4 }, bar);
  const tBar = T('b1~million') - 0.2;
  whole(t => { const k = EIO(cl((t - tBar) / 0.8)); bA.setAttribute('width', (attW * cl(k / 0.176)).toFixed(1)); bF.setAttribute('width', ((BW - attW) * cl((k - 0.176) / 0.824)).toFixed(1)); });
  const barL = S.text([{ t: '17.6%', c: 'compute' }, { t: ' attention', c: 'muted' }], { x: LX, y: Y.bar + 32, size: 22, weight: 600, family: 'sans' }, bar);
  const barR = S.text([{ t: '82.4%', c: 'compute' }, { t: ' feed-forward', c: 'muted' }], { x: VX, y: Y.bar + 32, size: 22, weight: 600, anchor: 'end' }, bar);
  ch08Hide([barL, barR]);
  fade([barL, barR], 0, 1, tBar + 0.5, 0.4, 0.15);
  const r80 = row('× 80 layers', '0.00 B', Y.x80);
  ch08Hide(r80);
  const t80 = T('b1~Times') - 0.1;
  fade(r80, 0, 1, t80, 0.4);
  count(r80.val, t80 + 0.3, 1.9, 0, 68.45, B2);

  // ================================================================ b2: the two vocabulary tables
  const TBH = 450, TBW = 40, TBY = 220;
  const table = (x, seed) => {
    const g = S.g();
    S.rect({ x, y: TBY, w: TBW, h: TBH, r: 5, fill: '#0c1326' }, g);
    S.rect({ x, y: TBY, w: TBW, h: TBH, r: 5, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.8, sw: 2 }, g);
    ch08Texture(S, { x: x + 4, y: TBY + 6, w: TBW - 8, h: TBH - 12, cols: 3, rows: 48, seed, tone: 'struct', ops: [0.18, 0.4, 0.7] }, g);
    return g;
  };
  const tab1 = S.g(), tab2 = S.g();
  tab1.appendChild(table(160, 501));
  tab2.appendChild(table(420, 502));
  const lab = (s, x, y, o = {}) => S.text(s, { x, y, anchor: 'middle', size: 26, weight: 650, color: 'ink', ...o });
  const t1n = lab('embedding', 180, 710, { size: 28 }), t1d = lab('128,256 × 8,192', 180, 746, { size: 24, family: 'mono', color: 'compute' });
  const t1v = lab('1.05 B', 180, 792, { size: 34, family: 'mono', weight: 700, color: 'compute' });
  const t1g = lab('= 2.1 GB at 2 bytes', 180, 834, { size: 22, weight: 600, color: 'muted' });
  [t1n, t1d, t1v, t1g].forEach(e => tab1.appendChild(e));
  const t2n = lab('output projection', 440, 710, { size: 28 }), t2h = lab('output head', 440, 744, { size: 24, weight: 600, color: 'muted' });
  const t2v = lab('1.05 B', 440, 792, { size: 34, family: 'mono', weight: 700, color: 'compute' });
  const sep = S.pill('separate here', { x: 440, y: 186, tone: 'neutral', size: 22, h: 40 }, tab2);
  [t2n, t2v].forEach(e => tab2.appendChild(e));
  tab2.appendChild(t2h);
  ch08Hide([t1d, t1v, t1g, t2h, sep]);
  const tE = T('b2~embedding') - 0.15, tSep = T('b2~separate') - 0.1, tAll = T('b2~Two#2') - 0.1;
  const slideIn = t0 => [K(t0, { x: -260, o: 0 }), K(t0 + 0.7, { x: 0, o: 1, e: 'power3.out' })];
  // both merge into the ledger row (the row's label sits at x ~720 + card offset 0 in b2)
  const merge = (cx, t0) => [K(t0, { x: 0, y: 0, s: 1, o: 1 }), K(t0 + 0.7, { x: LX + 160 - cx, y: Y.voc - 520, s: 0.12, o: 0, e: 'power2.in' })];
  track(tab1, [...slideIn(tE), ...merge(180, tAll + 0.2)], 180, 520);
  track(tab2, [...slideIn(tSep), ...merge(440, tAll + 0.3)], 440, 520);
  fade(t1d, 0, 1, tE + 0.4, 0.35);
  fade(t1v, 0, 1, T('b2~one') - 0.1, 0.35);
  fade(t1g, 0, 1, T('b2~billion') + 0.1, 0.35);
  fade(sep, 0, 1, tSep + 0.5, 0.35);
  fade(t2h, 0, 1, T('b2~or') + 0.05, 0.35);
  fade(t1g, 1, 0, tAll, 0.3);
  fade([t1n, t1d, t1v, t2n, t2h, t2v, sep], 1, 0, tAll + 0.1, 0.25);
  S.add(ch08Ignore([tab1, tab2], 0.8), tAll + 0.15);
  const rVoc = row('embedding + output head', '2.10 B', Y.voc);
  ch08Hide(rVoc);
  fade(rVoc, 0, 1, tAll + 0.7, 0.45);

  // ================================================================ b3: the total, against 70 B
  const rule = S.path({ d: `M${LX},${Y.rule} H${VX}`, stroke: 'white', strokeOpacity: 0.4, sw: 2.5 }, cardG);
  rule.setAttribute('stroke-dasharray', `${BW} ${BW}`);
  const tTot = T('b3~Total') - 0.1;
  whole(t => rule.setAttribute('stroke-dashoffset', (BW * (1 - EIO(cl((t - tTot) / 0.6)))).toFixed(1)));
  const rTot = row('total', '0.00 B', Y.tot, { size: 34, vsize: 44 });
  ch08Hide(rTot);
  fade(rTot, 0, 1, tTot + 0.3, 0.4);
  count(rTot.val, T('b3~seventy') - 0.2, 1.1, 0, 70.55, B2);
  const stampX = CX + 330;
  const stamp = S.g(null, cardG);
  S.pill('advertised: 70 B', { x: stampX, y: Y.tot, tone: 'neutral', size: 24, h: 46 }, stamp);
  const tAd = T('b3~advertised') - 0.1;
  track(stamp, [K(tAd, { s: 1.4, o: 0, r: -4 }), K(tAd + 0.35, { s: 1, o: 1, r: -4, e: 'back.out(2)' })], stampX, Y.tot);
  const tick = S.icon('ph:check-circle-duotone', { x: CX + 520, y: Y.tot, size: 40, color: 'helps' }, cardG);
  ch08Hide(tick);
  fade(tick, 0, 1, T('b3~lands') - 0.1, 0.35);

  // ================================================================ b4: what if Q, K, V existed once
  const DX = 990, DLX = DX + 40, DVX = DX + CW - 40;
  const dash = S.g();
  S.rect({ x: DX, y: CY, w: CW, h: CH, r: 20, fill: '#0b1224', fillOpacity: 0.92, stroke: 'muted', strokeOpacity: 0.7, sw: 2, dash: '12 9' }, dash);
  S.text('if Q, K, V existed once', { x: DLX, y: CY + 60, size: 38, weight: 700, family: 'display', color: 'muted' }, dash);
  S.path({ d: `M${DLX},${CY + 102} H${DVX}`, stroke: 'white', strokeOpacity: 0.14, sw: 2 }, dash);
  const tD = T('b4') + 0.1;
  track(dash, [K(tD, { x: 500, o: 0 }), K(tD + 0.8, { x: 0, o: 1, e: 'power3.out' }), K(T('b5') - 0.1, { x: 0, o: 1 }), K(T('b5') + 0.4, { x: 0, o: 0 })]);
  S.add(ch08Ignore(dash, 0.8), tD);
  // 'W_Q + W_K + W_V = 83.9 M per layer', piece by piece
  const L1 = 350, wsz = 34;
  const wW = S.measure('W', { size: wsz, weight: 650 }) + S.measure('Q', { size: Math.round(wsz * 0.68), weight: 650 });
  let lx = DLX;
  const l1 = [];
  ['Q', 'K', 'V'].forEach((n, i) => {
    const w = ch08W(S, n, { x: lx, y: L1, size: wsz, anchor: 'start' }, dash); l1.push(w); lx += wW + 12;
    if (i < 2) { l1.push(S.text('+', { x: lx, y: L1, size: 32, weight: 600, color: 'ink' }, dash)); lx += 34; }
  });
  const l1e = S.text([{ t: '= ', c: 'muted' }, { t: '83.9 M', c: 'compute', f: 'mono' }, { t: ' per layer', c: 'muted' }], { x: lx + 4, y: L1, size: 30, weight: 650 }, dash);
  ch08Hide([...l1, l1e]);
  [[0, 'b4~W'], [1, 'b4~K'], [2, 'b4~K'], [3, 'b4~V'], [4, 'b4~V']].forEach(([i, c]) => fade(l1[i], 0, 1, T(c) - 0.1 + (i === 1 || i === 3 ? -0.15 : 0), 0.3));
  fade(l1e, 0, 1, T('b4~once') - 0.1, 0.4);
  const strike = S.path({ d: `M${DLX - 6},${L1} H${lx + 4 + S.measure('= 83.9 M per layer', { size: 30, weight: 650 }) + 6}`, stroke: 'muted', sw: 3 }, dash);
  strike.setAttribute('data-audit', 'ignore');   // it is meant to cross the line
  const sLen = 700;
  strike.setAttribute('stroke-dasharray', `${sLen} ${sLen}`);
  const tStr = T('b4~vanish') - 0.15;
  whole(t => strike.setAttribute('stroke-dashoffset', (sLen * (1 - EIO(cl((t - tStr) / 0.5)))).toFixed(1)));
  const l2a = S.text('× 79 removed', { x: DLX, y: L1 + 70, size: 32, weight: 650, family: 'mono', color: 'compute' }, dash);
  const l2b = S.text('= 6.63 B', { x: DLX + S.measure('× 79 removed', { size: 32, weight: 650, family: 'mono' }) + 16, y: L1 + 70, size: 32, weight: 650, family: 'mono', color: 'compute' }, dash);
  ch08Hide([l2a, l2b]);
  fade(l2a, 0, 1, T('b4~Seventy') - 0.1, 0.4);
  fade(l2b, 0, 1, T('b4~six') - 0.1, 0.4);
  // the gap: 63.92 B against the advertised 70 B, on a scale from 60 to 72 B
  const AX0 = DLX + 20, AX1 = DVX - 20, AY = 600, ax = v => AX0 + (v - 60) / 12 * (AX1 - AX0);
  const gap = S.g(null, dash);
  S.path({ d: `M${AX0},${AY} H${AX1}`, stroke: 'white', strokeOpacity: 0.3, sw: 2 }, gap);
  [60, 64, 68, 72].forEach(v => S.path({ d: `M${ax(v)},${AY - 6} V${AY + 6}`, stroke: 'white', strokeOpacity: 0.3, sw: 2 }, gap));
  const gBar = S.rect({ x: ax(63.92), y: AY - 13, w: 0, h: 26, r: 4, fill: 'muted', fillOpacity: 0.28, stroke: 'muted', strokeOpacity: 0.7, sw: 1.5 }, gap);
  S.circle({ x: ax(63.92), y: AY, r: 7, fill: 'compute' }, gap);
  S.text('63.92 B', { x: ax(63.92), y: AY + 40, size: 24, weight: 650, family: 'mono', anchor: 'middle', color: 'compute' }, gap);
  S.path({ d: `M${ax(70)},${AY - 22} V${AY + 22}`, stroke: 'ink', sw: 3 }, gap);
  S.text('advertised 70 B', { x: ax(70), y: AY + 40, size: 22, weight: 600, anchor: 'middle', color: 'muted' }, gap);
  const gLab = S.text('over 6 B missing', { x: (ax(63.92) + ax(70)) / 2, y: AY - 40, size: 26, weight: 700, anchor: 'middle', color: 'ink' }, dash);
  ch08Hide([gap, gLab]);
  const tGap = T('b4~over') - 0.25;
  fade(gap, 0, 1, tGap, 0.35);
  whole(t => gBar.setAttribute('width', ((ax(70) - ax(63.92)) * EIO(cl((t - tGap - 0.2) / 0.6))).toFixed(1)));
  fade(gLab, 0, 1, tGap + 0.6, 0.35);
  // its total, down from 70.55 B
  S.path({ d: `M${DLX},${Y.rule} H${DVX}`, stroke: 'white', strokeOpacity: 0.3, sw: 2.5 }, dash);
  S.text('total', { x: DLX, y: Y.tot, size: 34, weight: 650, color: 'ink' }, dash);
  const dTot = S.text('70.55 B', { x: DVX, y: Y.tot, size: 44, weight: 700, family: 'mono', anchor: 'end', color: 'compute' }, dash);
  count(dTot, T('b4~leaving') - 0.1, 1.3, 70.55, 63.92, B2, 'power2.inOut');

  // ================================================================ b5: only per-layer matrices add up
  const cap = S.text('only per-layer matrices add up', { x: 960, y: 922, size: 46, weight: 750, family: 'display', anchor: 'middle', color: 'struct' });
  ch08Hide(cap);
  fade(cap, 0, 1, T('b5~only') - 0.15, 0.5);
  const tKey = T('b5~adds') - 0.2;
  fade(keyHi, 0, 1, tKey, 0.3);
  fade(keyHi, 1, 0, tKey + 0.6, 0.6);
  void keyT;
});
