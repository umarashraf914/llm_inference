/* ch16_s05 · case C, same words reordered (fig 51)
   'Tell me the capital of France please' shares the whole phrase 'the capital of France' with the cached
   'What is the capital of France?', even in the same places, but the very first token differs: only the
   preamble hits, hit 770, prefill all 7 (checked). B and C are both 7 tokens; B matches 5, C none.
   b1  'case C: a minute later, same words reordered', 'seen earlier'; the arriving pills as spoken; grey links
       between the four shared words, 'shared words: 4'; the cursor turns the '770' pair teal and stops dead at
       the first pills; 'Tell' and 'What' flash, 'diverges at the very first token'; the links snap.
   b2  the seven arriving pills amber; 'shared preamble, nothing of yours'; plate 'hit 770 · prefill 7 tokens';
       scoreboard 'C | 770 | 7'.
   b3  the cache row and plate fade; case B's arriving row slides in above C's, each '7 tokens'; B's first five
       glow teal, '5 of 7'; C '0 of 7'; the first pill of each row circled; 'which word came first decides'.
   Layout: as s04 (h 68, 32 px, columns centred; arriving y 450, in the cache y 580; plate y 730); in b3 case B's
   row at y 300, brackets above each row. */
V.scene('ch16_s05', S => {
  const K = libKit(S), { T, cl, E, whole, setO, hide, fade } = K;
  const tB3 = T('b3') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const AY = 450, CY = 580, BY = 300, H = 68, SZ = 32, GAP = 10;
  const CW = ['770', 'What', 'is', 'the', 'capital', 'of', 'France', '?'];
  const AW = ['770', 'Tell', 'me', 'the', 'capital', 'of', 'France', 'please'];
  const BW = ['770', 'What', 'is', 'the', 'capital', 'of', 'Japan', '?'];
  const m = w => S.measure(w, { size: SZ, weight: 650 });
  const colW = CW.map((w, i) => (i === 0 ? 130 : Math.max(76, Math.round(Math.max(m(w), m(AW[i]), m(BW[i])) + 44))));
  const total = colW.reduce((a, b) => a + b, 0) + GAP * 7, X0 = Math.round(960 - total / 2 + 60);
  const COLX = colW.map((w, i) => X0 + colW.slice(0, i).reduce((a, b) => a + b, 0) + GAP * i);
  const COLR = i => COLX[i] + colW[i], COLC = i => COLX[i] + colW[i] / 2;
  const XD = COLR(0) + GAP / 2;

  // ================================================================ b1: the whole phrase in common, the first token not
  const kicker = S.text('case C: a minute later, same words reordered', { x: 70, y: 150, size: 30, weight: 750, color: 'ink' });
  rise(kicker, T('b1~Case') - 0.1, 6);
  const kw = S.measure('case C: a minute later, same words reordered', { size: 30, weight: 750 });
  const seen = S.pill('seen earlier', { x: 70 + kw + 30 + S.measure('seen earlier', { size: 24, weight: 600 }) / 2 + 22, y: 150, tone: 'neutral', size: 24, h: 42 });
  hide(seen);
  const tSeen = T('b1~pair') - 0.1;
  whole(t => setO(seen, cl((t - tSeen) / 0.15) * (1 - cl((t - tSeen - 1.6) / 0.4)) * (t < tSeen + 0.6 ? 0.6 + 0.4 * Math.abs(Math.sin(t * 18)) : 1)));
  ch16Score(S, { rows: [{ case: 'time t', hit: 0, pre: 777 }, { case: 'A', hit: 784, pre: 4 }, { case: 'B', hit: 775, pre: 2 }, { case: 'C', hit: 770, pre: 7, at: T('b2~contributed') - 0.1 }] });
  const labA = S.text('arriving', { x: X0 - 24, y: AY + 1, size: 26, weight: 750, anchor: 'end', color: 'muted' });
  rise(labA, 0.6, 0);
  const labC = S.text('in the cache', { x: X0 - 24, y: CY + 1, size: 26, weight: 750, anchor: 'end', color: 'bytes' });
  rise(labC, 0.6, 0);
  const tVery = T('b1~very') - 0.1, tAll = T('b2~All') - 0.1;
  const tPass = tVery + 0.5;  // the cursor reaches the end of '770'
  const rowA = S.g(), rowC = S.g();
  const wordAt = ['Tell', 'me', 'the#2', 'capital', 'of', 'France', 'please'].map(w => T(`b1~${w}`) - 0.1);
  const arr = AW.map((w, i) => {
    const plan = i === 0 ? [[0, 'blue'], [tPass, 'teal', 0.25]] : [[0, 'blue'], [tAll + 0.08 * (i - 1), 'amber']];
    const c = ch16Cell(S, { x: COLX[i], y: AY, w: colW[i], h: H, r: 18, label: w, size: i === 0 ? 30 : SZ, plan }, rowA);
    const at = i === 0 ? 0.7 : wordAt[i - 1];
    K.track(c, [K.K(at, { x: 30, o: 0 }), K.K(at + 0.35, { x: 0, o: 1, e: 'power3.out' })]);
    if (i === 0) c.check(tPass);
    return c;
  });
  const cache = CW.map((w, i) => {
    const plan = i === 0 ? [[0, 'blue'], [tPass, 'teal', 0.25]] : [[0, 'blue']];
    const c = ch16Cell(S, { x: COLX[i], y: CY, w: colW[i], h: H, r: 18, label: w, size: i === 0 ? 30 : SZ, plan }, rowC);
    rise(c, 0.7 + 0.06 * i, 8, 0.35);
    return c;
  });
  // the four shared words, linked: the, capital, of, France
  const tPhrase = T('b1~whole') - 0.1, tGlowL = T('b1~the#4') - 0.1, tSnap = tPass + 0.5;
  const links = [3, 4, 5, 6].map((i, k) => {
    const p = S.path({ d: `M${COLC(i)},${AY + H / 2 + 5} C${COLC(i) + 22},${(AY + CY) / 2 - 10} ${COLC(i) + 22},${(AY + CY) / 2 + 10} ${COLC(i)},${CY - H / 2 - 5}`, stroke: 'muted', sw: 3 });
    p.setAttribute('data-audit', 'ignore');
    K.draw(p, 90, tPhrase + 0.12 * k, 0.3);
    whole(t => {
      const g = Math.sin(Math.PI * cl((t - tGlowL) / 0.9));
      p.setAttribute('stroke', g > 0.05 ? S.tone('struct') : S.tone('muted'));
      p.setAttribute('stroke-width', (3 + 2 * g).toFixed(2));
      const ks = cl((t - tSnap - 0.05 * k) / 0.35);
      p.setAttribute('transform', `translate(${(10 * ks).toFixed(1)},${(8 * ks * (k % 2 ? 1 : -1)).toFixed(1)}) rotate(${(14 * ks).toFixed(1)},${COLC(i)},${(AY + CY) / 2})`);
      setO(p, 1 - ks);
    });
    return p;
  });
  const shared = S.g();
  S.text('shared words', { x: COLR(7) + 90, y: (AY + CY) / 2 - 22, size: 24, weight: 700, anchor: 'middle', color: 'muted' }, shared);
  S.text('4', { x: COLR(7) + 90, y: (AY + CY) / 2 + 20, size: 44, weight: 800, family: 'mono', anchor: 'middle', color: 'muted' }, shared);
  rise(shared, tPhrase + 0.5, 6);
  fade(shared, 1, 0.3, tSnap, 0.4);
  // the cursor: past the preamble, then stops dead at the first pills
  const cur = S.g();
  cur.setAttribute('data-audit', 'ignore');
  S.rect({ x: -26, y: AY - H / 2 - 16, w: 52, h: CY - AY + H + 32, fill: 'url(#pglow-struct)', opacity: 0.8 }, cur);
  S.rect({ x: -2, y: AY - H / 2 - 10, w: 4, h: CY - AY + H + 20, r: 2, fill: '#ffffff' }, cur);
  whole(t => { cur.setAttribute('transform', `translate(${(X0 - 8 + (XD - X0 + 8) * cl((t - tVery) / 0.5)).toFixed(1)},0)`); setO(cur, cl((t - tVery + 0.2) / 0.2) * (1 - cl((t - tB3) / 0.35))); });
  const glow = (c, at, tone, d = 0.8) => { const r = S.rect({ x: c.l - 10, y: c.t - 10, w: c.w + 20, h: c.h + 20, r: 24, fill: `url(#pglow-${tone})`, opacity: 0 }); r.setAttribute('data-audit', 'ignore'); S.main.insertBefore(r, rowA); K.pulse(r, at, 1, d); return r; };
  [arr[1], cache[1]].forEach(c => { glow(c, tPass, 'compute', 0.6); glow(c, tPass + 0.6, 'compute', 0.6); });
  const div = S.text('diverges at the very first token', { x: XD, y: AY - H / 2 - 30, size: 26, weight: 750, anchor: 'middle', color: 'ink' });
  rise(div, tPass + 0.2, 6);
  fade(div, 1, 0, tB3, 0.3);

  // ================================================================ b2: only the shared preamble hits
  const pre = S.pill('shared preamble, nothing of yours', { x: COLX[0] + S.measure('shared preamble, nothing of yours', { size: 24, weight: 600 }) / 2 + 22, y: CY + H / 2 + 40, tone: 'helps', size: 24, h: 42 });
  rise(pre, T('b2~preamble') - 0.1, 6);
  const plate = ch16Plate(S, { x: 960, y: 730, hit: '770', pre: '7 tokens' });
  rise(plate, T('b2~prefilled') - 0.1, 10);
  K.ignore(rowA, tAll, 0.9);

  // ================================================================ b3: B against C, decided by the first word
  fade([rowC, labC, pre, plate], 1, 0, tB3, 0.45);
  fade(shared, 0.3, 0, tB3, 0.45);
  K.ignore([rowC, plate, pre], tB3, 0.5);
  const labB = S.text('case B', { x: X0 - 24, y: BY + 1, size: 26, weight: 750, anchor: 'end', color: 'muted' });
  rise(labB, tB3 + 0.3, 0);
  fade(labA, 1, 0, tB3, 0.25);
  const labA2 = S.text('case C', { x: X0 - 24, y: AY + 1, size: 26, weight: 750, anchor: 'end', color: 'muted' });
  rise(labA2, tB3 + 0.35, 0);
  const tFive = T('b3~matches') - 0.1, tNone = T('b3~none') - 0.1, tFirst = T('b3~which') - 0.1;
  const rowB = S.g();
  const bRow = BW.map((w, i) => {
    const plan = i === 0 ? [[0, 'teal']] : i <= 5 ? [[0, 'blue'], [tFive + 0.07 * i, 'teal', 0.25]] : [[0, 'blue'], [tFive + 0.5, 'amber']];
    return ch16Cell(S, { x: COLX[i], y: BY, w: colW[i], h: H, r: 18, label: w, size: i === 0 ? 30 : SZ, plan }, rowB);
  });
  K.track(rowB, [K.K(tB3 + 0.2, { y: -40, o: 0 }), K.K(tB3 + 0.8, { y: 0, o: 1, e: 'power3.out' })]);
  const bracket = (y, at) => {
    const g = S.g();
    const yb = y - H / 2 - 10;
    const p = S.path({ d: `M${COLX[1] + 2},${yb + 8} V${yb} H${COLR(7) - 2} V${yb + 8}`, stroke: 'muted', sw: 2.5 }, g);
    p.setAttribute('data-audit', 'ignore');
    S.text('7 tokens', { x: (COLX[1] + COLR(7)) / 2, y: yb - 20, size: 22, weight: 700, anchor: 'middle', color: 'muted' }, g);
    rise(g, at, 6);
    return g;
  };
  bracket(BY, T('b3~seven') - 0.1);
  bracket(AY, T('b3~seven') + 0.1);
  [1, 2, 3, 4, 5].forEach(i => glow(bRow[i], tFive + 0.07 * i, 'helps', 0.9));
  const badge = (txt, y, tone, at) => { const b = S.pill(txt, { x: COLR(7) + 90, y, tone, size: 26, h: 46 }); rise(b, at, 6); return b; };
  badge('5 of 7', BY, 'helps', tFive + 0.5);
  badge('0 of 7', AY, 'compute', tNone);
  [bRow[1], arr[1]].forEach((c, k) => {
    const e = S.path({ d: `M${c.cx - c.w / 2 - 12},${c.cy} a${c.w / 2 + 12},${H / 2 + 12} 0 1,0 ${c.w + 24},0 a${c.w / 2 + 12},${H / 2 + 12} 0 1,0 ${-(c.w + 24)},0`, stroke: '#ffffff', sw: 3.5 });
    e.setAttribute('data-audit', 'ignore');
    K.draw(e, 500, tFirst + 0.15 * k, 0.5);
  });
  const dec = S.text('which word came first decides', { x: 960, y: 640, size: 34, weight: 750, anchor: 'middle', color: 'ink' });
  rise(dec, tFirst + 0.6, 8);
  void links;
});
