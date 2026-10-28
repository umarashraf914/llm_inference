/* ch13_s09 · which terms can shrink (fig 141)
   Checked: 64 KV heads: 2 × 80 × 64 × 128 × 2 = 2,621,440 bytes ≈ 2.6 MB (decimal; 2.5 MB at 1,024² bytes,
   so the label says 'about'); 8 heads: 327,680 bytes = 320 KB, exactly one eighth. Bars to scale: 1,440 px
   and 180 px from x 210, at y 688 (centred below the band).
   Top band: ch13Formula, numbers mode, no result, every factor labelled.
   b1  '8' → '64', glowing amber; a coral ghost bar draws: '64 KV heads: 2.6 MB per token', '× 8'.
   b2  '64' → '8' in teal; a solid coral bar grows to one eighth: '8 KV heads: 320 KB per token'; the tag
       'grouped-query attention: ÷ 8'; a padlock on the '80': 'that is the model'.
   b3  three teal arrows to KV heads, head dim and bytes; then the bars go and the labelled equation moves to
       the centre with its padlock: '320 KB, decomposed'. */
V.scene('ch13_s09', S => {
  const K = libKit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1;

  const f = ch13Formula(S, { mode: 'numbers', result: false, labels: ['K and V', 'layers', 'KV heads', 'head dim', 'bytes'] });
  const X = i => f.termX(i, 'numbers');

  // ================================================================ b1: sixty-four heads
  // the formula card over the bars (y 114-766) sits 100 px lower by camera through b1-b2; the camera eases back as
  // the card comes down to the middle on its own in b3
  S.xset(S.camera, { x: 0, y: 100, s: 1 });
  const t64 = T('b1~Sixty') - 0.1;
  S.add(f.swap(2, '64', { tone: 'compute' }), t64);
  S.add(f.glow(2, { tone: 'compute', d: 1.3, hold: 0.5 }), t64 + 0.5);
  const BX = 210, BY = 688, GW = 1440;   // the bars (and '× 8') centred, in the space below the formula band
  const bars = S.g();
  const ghost = S.rect({ x: BX, y: BY - 30, w: GW, h: 60, r: 10, stroke: 'bytes', strokeOpacity: 0.85, sw: 2.5, dash: '10 7' }, bars);
  ghost.setAttribute('data-audit', 'ignore');
  const tBig = T('b1~eight') - 0.1;
  hide(ghost);
  whole(t => {
    const k = EIO(cl((t - tBig) / 0.8));
    ghost.setAttribute('width', (GW * k).toFixed(1));
    setO(ghost, k > 0 ? 1 : 0);
  });
  const gL = S.text([{ t: '64 KV heads: ', c: 'muted' }, { t: '2.6 MB', c: 'bytes', w: 800 }, { t: ' per token', c: 'muted' }], { x: BX, y: BY - 58, size: 28, weight: 650 }, bars);
  const x8 = S.text('× 8', { x: BX + GW + 16, y: BY + 1, size: 28, weight: 750, color: 'muted' }, bars);
  hide([gL, x8]);
  fade(gL, 0, 1, tBig + 0.7, 0.35);
  fade(x8, 0, 1, tBig + 0.9, 0.35);

  // ================================================================ b2: grouped-query attention, already built in
  S.add(f.swap(2, '8', { tone: 'helps' }), tB2);
  const solid = S.rect({ x: BX, y: BY - 30, w: 0, h: 60, r: 10, fill: 'url(#solid-bytes)' }, bars);
  const tGrow = tB2 + 0.3;
  whole(t => solid.setAttribute('width', (GW / 8 * E('power3.out')(cl((t - tGrow) / 0.6))).toFixed(1)));
  const sL = S.text([{ t: '8 KV heads: ', c: 'muted' }, { t: '320 KB', c: 'bytes', w: 800 }, { t: ' per token', c: 'muted' }], { x: BX, y: BY + 62, size: 28, weight: 650 }, bars);
  hide(sL);
  fade(sL, 0, 1, tGrow + 0.5, 0.35);
  const gqa = S.pill('grouped-query attention: ÷ 8', { x: (BX + GW / 8 + BX + GW) / 2, y: BY, tone: 'helps', size: 26, h: 46 }, bars);
  hide(gqa);
  S.add(K.drive(0.4, k => { setO(gqa, k); gqa.setAttribute('transform', `translate(0,${(10 * (1 - E('back.out(2)')(k))).toFixed(1)})`); }), T('b2~grouped') - 0.1);
  // nothing cuts the layers: a padlock on the '80'
  const lockG = S.g();
  const tLock = T('b2~Nothing') - 0.1;
  const lock = S.g(null, lockG);
  S.circle({ x: X(1), y: f.valueY, r: 17, fill: '#0c1326', stroke: 'ink', sw: 2 }, lock);
  S.icon('ph:lock-simple-duotone', { x: X(1), y: f.valueY, size: 22, color: 'ink' }, lock);
  K.track(lock, [K.K(tLock, { y: -26, o: 0 }), K.K(tLock + 0.45, { y: 0, o: 1, e: 'bounce.out' })]);
  const model = S.text('that is the model', { x: X(1), y: f.b + 30, size: 24, weight: 650, anchor: 'middle', color: 'muted' }, lockG);
  hide(model);
  fade(model, 0, 1, T('b2~model') - 0.3, 0.35);

  // ================================================================ b3: every technique attacks another term
  S.add(S.fx.cam({ d: 0.8, ease: 'power2.inOut' }), tB3 - 0.2);
  const arrows = S.g();
  [[2, 'fewer heads', T('b3~fewer')], [3, 'narrower heads', T('b3~narrower')], [4, 'fewer bytes', T('b3~fewer#2')]].forEach(([i, txt, at]) => {
    const g = S.g(null, arrows);
    const a = S.path({ d: `M${X(i)},452 V${f.b + 14} M${X(i) - 9},${f.b + 25} L${X(i)},${f.b + 13} L${X(i) + 9},${f.b + 25}`, stroke: 'helps', sw: 3.5 }, g);
    a.setAttribute('data-audit', 'ignore');
    K.draw(a, 160, at - 0.1, 0.4);
    const l = S.text(txt, { x: X(i), y: 476, size: 26, weight: 750, anchor: 'middle', color: 'helps' }, g);
    hide(l);
    fade(l, 0, 1, at, 0.3);
  });
  // the bars go; the equation, still labelled and locked, moves to the centre
  const tKnow = T('b3~Knowing') - 0.1;
  fade([bars, arrows], 1, 0, tKnow, 0.4);
  fade(model, 1, 0, tKnow, 0.3);
  const DY = 250;
  [f, lockG].forEach(g => K.track(g, [K.K(tKnow + 0.2, { y: 0 }), K.K(tKnow + 1.1, { y: DY })]));
  const dec = S.text([{ t: '320 KB', c: 'bytes', w: 800 }, { t: ', decomposed', c: 'ink' }], { x: 960, y: f.b + DY + 64, size: 40, weight: 700, anchor: 'middle' });
  hide(dec);
  S.add(K.drive(0.5, k => { setO(dec, k); dec.setAttribute('transform', `translate(0,${(14 * (1 - E('power3.out')(k))).toFixed(1)})`); }), tKnow + 1.0);
  void tB3; void pulse; void lerp;
});
