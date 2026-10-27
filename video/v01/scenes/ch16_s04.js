/* ch16_s04 · case B, one word changed (fig 50)
   A minute later a new conversation asks 'What is the capital of Japan?'. The preamble (770) and the first five
   words match, identical and in the same places; then France meets Japan and the match ends, and the question
   mark after it is redone too: hit 770 + 5 = 775, prefill 2 (checked).
   b1  'case B: a minute later, one word changed', 'new conversation, not a follow-up'; the cache row holds the
       earlier question; the arriving pills as spoken; the cursor turns the '770' pair, then five word pairs teal.
   b2  France and Japan flash, 'diverges here'; the two '?' glow, a crossed link, 'same token, after the
       difference'; Japan and '?' amber; plate 'hit 775 · prefill 2 tokens'; scoreboard 'B | 775 | 2'.
   b3  ghost rows fan out with the same start ('Spain', 'Peru', 'Kenya'), 'same shape, same start', and fade; the
       five word pairs pulse; 'identical from the front is all that counts'.
   Layout: the preamble collapsed to one '770' cell so the pills can be large (h 68, 32 px); columns centred,
   arriving y 450, in the cache y 580; plate y 730; ghost rows above the arriving row at y 386 / 322 / 258. */
V.scene('ch16_s04', S => {
  const K = libKit(S), { T, cl, E, whole, setO, hide, fade } = K;
  const tB3 = T('b3') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const AY = 450, CY = 580, H = 68, SZ = 32, GAP = 10;
  const CW = ['770', 'What', 'is', 'the', 'capital', 'of', 'France', '?'], AW = ['770', 'What', 'is', 'the', 'capital', 'of', 'Japan', '?'];
  const colW = CW.map((w, i) => (i === 0 ? 130 : Math.max(76, Math.round(Math.max(S.measure(w, { size: SZ, weight: 650, case: 'keep' }), S.measure(AW[i], { size: SZ, weight: 650, case: 'keep' })) + 44))));
  const total = colW.reduce((a, b) => a + b, 0) + GAP * 7, X0 = Math.round(960 - total / 2 + 60);
  const COLX = colW.map((w, i) => X0 + colW.slice(0, i).reduce((a, b) => a + b, 0) + GAP * i);
  const COLR = i => COLX[i] + colW[i], COLC = i => COLX[i] + colW[i] / 2;
  const XD = COLR(5) + GAP / 2;  // between 'of' and 'Japan'

  // ================================================================ b1: a new conversation, the same start
  const kicker = S.text('case B: a minute later, one word changed', { x: 960, y: 140, size: 30, weight: 750, anchor: 'middle', color: 'ink' });   // centred, its tag under it
  rise(kicker, T('b1~Case') - 0.1, 6);
  const newT = S.pill('new conversation, not a follow-up', { x: 960, y: 192, tone: 'neutral', size: 24, h: 42 });
  rise(newT, T('b1~new') - 0.1, 6);
  ch16Score(S, { rows: [{ case: 'time t', hit: 0, pre: 777 }, { case: 'A', hit: 784, pre: 4 }, { case: 'B', hit: 775, pre: 2, at: T('b2~Hit') + 0.6 }] });
  const lab = (txt, y, tone) => { const e = S.text(txt, { x: X0 - 24, y: y + 1, size: 26, weight: 750, anchor: 'end', color: tone }); rise(e, 0.6, 0); return e; };
  lab('arriving', AY, 'muted');
  lab('in the cache', CY, 'bytes');
  // the cursor: past the preamble on 'The preamble', then past five words on 'first five words'
  const tPre = T('b1~preamble') - 0.2, tFive = T('b1~first') - 0.1, dFive = T('b1~match') - tFive;
  const cur = S.g();
  cur.setAttribute('data-audit', 'ignore');
  S.rect({ x: -26, y: AY - H / 2 - 16, w: 52, h: CY - AY + H + 32, fill: 'url(#pglow-struct)', opacity: 0.8 }, cur);
  S.rect({ x: -2, y: AY - H / 2 - 10, w: 4, h: CY - AY + H + 20, r: 2, fill: '#ffffff' }, cur);
  const curX = t => {
    if (t < tFive) return X0 - 8 + (COLR(0) + GAP / 2 - X0 + 8) * cl((t - tPre) / 0.6);
    return COLR(0) + GAP / 2 + (XD - COLR(0) - GAP / 2) * cl((t - tFive) / dFive);
  };
  const passAt = i => (i === 0 ? tPre + 0.6 : tFive + dFive * cl((COLR(i) - COLR(0)) / (XD - COLR(0) - GAP / 2)));
  whole(t => { cur.setAttribute('transform', `translate(${curX(t).toFixed(1)},0)`); setO(cur, cl((t - tPre + 0.2) / 0.2)); });
  const tHit = T('b2~Hit') - 0.1;
  const rowA = S.g(), rowC = S.g();
  const wordAt = ['What', 'is', 'the', 'capital', 'of', 'Japan'].map(w => T(`b1~${w}`) - 0.1);
  wordAt.push(wordAt[5] + 0.3);
  const arr = AW.map((w, i) => {
    const plan = i <= 5 ? [[0, 'blue'], [passAt(i), 'teal', 0.25]] : [[0, 'blue'], [tHit + 0.1 * (i - 6), 'amber']];
    const c = ch16Cell(S, { x: COLX[i], y: AY, w: colW[i], h: H, r: 18, label: w, case: 'keep', size: i === 0 ? 30 : SZ, plan }, rowA);
    const at = i === 0 ? 0.7 : wordAt[i - 1];
    K.track(c, [K.K(at, { x: 30, o: 0 }), K.K(at + 0.35, { x: 0, o: 1, e: 'power3.out' })]);
    if (i <= 5) c.check(passAt(i));
    return c;
  });
  const cache = CW.map((w, i) => {
    const plan = i <= 5 ? [[0, 'blue'], [passAt(i), 'teal', 0.25]] : [[0, 'blue']];
    const c = ch16Cell(S, { x: COLX[i], y: CY, w: colW[i], h: H, r: 18, label: w, case: 'keep', size: i === 0 ? 30 : SZ, plan }, rowC);
    rise(c, 0.7 + 0.06 * i, 8, 0.35);
    return c;
  });
  K.ignore([rowA, rowC], tPre, tFive + dFive - tPre + 0.3);

  // ================================================================ b2: France meets Japan
  const tMeet = T('b2~France') - 0.1, tQ = T('b2~question') - 0.1;
  const glow = (c, at, tone, d = 0.8) => { const r = S.rect({ x: c.l - 10, y: c.t - 10, w: c.w + 20, h: c.h + 20, r: 24, fill: `url(#pglow-${tone})`, opacity: 0 }); r.setAttribute('data-audit', 'ignore'); S.main.insertBefore(r, rowA); K.pulse(r, at, 1, d); };
  glow(arr[6], tMeet, 'compute');
  glow(cache[6], tMeet, 'struct');
  glow(arr[6], tMeet + 0.6, 'compute');
  glow(cache[6], tMeet + 0.6, 'struct');
  const div = S.text('diverges here', { x: XD, y: AY - H / 2 - 30, size: 26, weight: 750, anchor: 'middle', color: 'ink' });
  rise(div, tMeet + 0.3, 6);
  fade(div, 1, 0, tB3, 0.3);
  // the two question marks: the same token, after the difference
  glow(arr[7], tQ, 'struct', 1.2);
  glow(cache[7], tQ, 'struct', 1.2);
  const lk = S.path({ d: `M${COLC(7)},${AY + H / 2 + 6} V${CY - H / 2 - 6}`, stroke: 'muted', sw: 3 });
  lk.setAttribute('data-audit', 'ignore');
  K.draw(lk, 80, tQ + 0.2, 0.3);
  const lx = S.path({ d: `M${COLC(7) - 10},${(AY + CY) / 2 - 10} l20,20 M${COLC(7) + 10},${(AY + CY) / 2 - 10} l-20,20`, stroke: 'compute', sw: 3.5 });
  lx.setAttribute('data-audit', 'ignore');
  K.draw(lx, 60, tQ + 0.55, 0.25);
  const sameT = S.pill('same token, after the difference', { x: COLR(7) - S.measure('same token, after the difference', { size: 24, weight: 600 }) / 2 - 22, y: CY + H / 2 + 40, tone: 'neutral', size: 24, h: 42 });
  rise(sameT, tQ + 0.6, 6);
  fade(sameT, 1, 0, tHit + 1.2, 0.3);
  const plate = ch16Plate(S, { x: 960, y: 730, hit: '775', pre: '2 tokens' });
  rise(plate, tHit + 0.3, 10);

  // ================================================================ b3: same-shaped questions start alike
  const tShape = T('b3~Sameshaped') - 0.1, tWhose = T('b3~whose') - 0.1, tId = T('b3~identical') - 0.1;
  const ghosts = S.g();
  ['Spain', 'Peru', 'Kenya'].forEach((w, k) => {
    const g = S.g(null, ghosts), y = AY - 64 * (k + 1), at = tShape + 0.2 * k;
    AW.forEach((ww, i) => {
      const lbl = i === 6 ? w : ww;
      S.rect({ x: COLX[i], y: y - 26, w: colW[i], h: 52, r: 14, fill: CH16.BASE }, g);
      S.rect({ x: COLX[i], y: y - 26, w: colW[i], h: 52, r: 14, fill: '#1d3566', stroke: 'struct', strokeOpacity: 0.7, sw: 2 }, g);
      S.text(lbl, { x: COLC(i), y: y + 1, size: 24, weight: 650, anchor: 'middle', color: 'ink', case: 'keep' }, g);
    });
    ghosts.insertBefore(g, ghosts.firstChild);
    whole(t => {
      const kIn = E('power3.out')(cl((t - at) / 0.5)), kOut = cl((t - tWhose) / 0.5);
      setO(g, (0.55 - 0.13 * k) * kIn * (1 - kOut));
      g.setAttribute('transform', `translate(0,${(64 * (k + 1) * (1 - kIn)).toFixed(1)})`);
    });
  });
  S.main.insertBefore(ghosts, rowA);
  K.ignore(ghosts, tShape, tWhose + 0.5 - tShape);
  const shapeT = S.pill('same shape, same start', { x: COLR(7) + 30 + S.measure('same shape, same start', { size: 24, weight: 600 }) / 2 + 22, y: AY - 128, tone: 'neutral', size: 24, h: 42 });
  rise(shapeT, tShape + 0.6, 6);
  fade(shapeT, 1, 0, tWhose, 0.4);
  [1, 2, 3, 4, 5].forEach(i => { glow(arr[i], tId + 0.06 * i, 'helps', 0.8); glow(cache[i], tId + 0.06 * i, 'helps', 0.8); });
  const only = S.text('identical from the front is all that counts', { x: 960, y: 804, size: 28, weight: 750, anchor: 'middle', color: 'helps' });
  rise(only, tId + 0.4, 8);
});
