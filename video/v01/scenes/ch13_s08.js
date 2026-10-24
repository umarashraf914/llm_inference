/* ch13_s08 · three hundred and twenty kilobytes per token (figs 139, 140)
   Checked: 8 × 128 = 1,024 numbers per K (and per V); 2 × 8 × 128 × 2 = 4,096 bytes per layer = 4 KB;
   × 80 = 327,680 bytes = 320 KB (1 KB = 1,024 bytes).
   Top band: ch13Formula, picked up as s07 left it ('2' with its K and V tiles, '× layers' with a coral '80');
   the other three factors land with their numbers; then the whole line turns numeric with '= 327,680 bytes'.
   Left third: one blue token at the bottom, a column of slots L1 … L10, '…', L80 (each a K and V pair).
   Right: K and V tiles split into 8 heads of 128 (b1); the per-layer product, the × 80 counter (b2); the large
   '320 KB per token' (b3).
   Layout: slots at y 870 - 38 k (L1 … L10), '…' 490, L80 452; header y 400; panel lines y 470 / 525 / 640;
   figure y 780. */
V.scene('ch13_s08', S => {
  const K = libKit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1;

  // ================================================================ the formula, as s07 left it
  const f = ch13Formula(S, { landed: [0, 1], labels: ['one key, one value', 'layers'], values: [null, '80'] });
  const v80 = f.terms[1].value;
  v80.setAttribute('fill', S.tone('bytes')); v80.__fill = S.tone('bytes');
  const x0 = f.termX(0, 'words'), kvT = S.g();
  S.rect({ x: x0 - 38, y: f.valueY - 14, w: 34, h: 28, r: 6, fill: 'url(#solid-struct)' }, kvT);
  S.text('K', { x: x0 - 21, y: f.valueY + 1, size: 20, weight: 800, anchor: 'middle', color: '#0a0f1e' }, kvT);
  S.rect({ x: x0 + 4, y: f.valueY - 14, w: 34, h: 28, r: 6, fill: '#1f3a68', stroke: 'struct', sw: 1.5 }, kvT);
  S.text('V', { x: x0 + 21, y: f.valueY + 1, size: 20, weight: 800, anchor: 'middle', color: 'struct' }, kvT);
  const tModel = T('b1~our') - 0.1;
  const llama = S.pill('Llama 3 70B', { x: 1760, y: 150, tone: 'neutral', size: 22, h: 36 });
  hide(llama);
  fade(llama, 0, 1, tModel, 0.35);
  fade(llama, 1, 0, tB3, 0.35);
  const tH = T('b1~eight') - 0.15, tD = T('b1~hundred') - 0.15, tBy = T('b1~two') - 0.15;
  S.add(f.land(2, { value: '8' }), tH);
  S.add(f.land(3, { value: '128' }), tD);
  S.add(f.land(4, { value: '2' }), tBy);
  // the word labels from s07 give way to numbers
  S.add(f.setLabel(0, null), tH + 0.2);
  S.add(f.setLabel(1, null), tH + 0.2);
  fade(kvT, 1, 0, tH + 0.2, 0.3);

  // ================================================================ left third: one token, eighty layers deep
  const colG = S.g();
  const hdr = S.text('One token, eighty layers deep', { x: 230, y: 400, size: 26, weight: 750, anchor: 'middle', color: 'ink' }, colG);
  const tok = S.g(null, colG);
  libToken(S, { text: 'token', x: 218, y: 930, size: 24, w: 110, state: 'token' }, tok);
  const ROWS = [...Array.from({ length: 10 }, (_, k) => [`L${k + 1}`, 870 - 38 * k]), ['…', 490], ['L80', 452]];
  const slots = ROWS.map(([name, y]) => {
    const g = S.g(null, colG);
    S.text(name, { x: 148, y, size: 20, weight: 650, family: 'mono', anchor: 'end', color: 'muted' }, g);
    if (name === '…') return { g, y, dots: true };
    const eK = S.rect({ x: 165, y: y - 13, w: 50, h: 26, r: 5, stroke: 'struct', strokeOpacity: 0.45, sw: 1.5, dash: '4 4' }, g);
    const eV = S.rect({ x: 222, y: y - 13, w: 50, h: 26, r: 5, stroke: 'struct', strokeOpacity: 0.45, sw: 1.5, dash: '4 4' }, g);
    const fK = S.rect({ x: 165, y: y - 13, w: 50, h: 26, r: 5, fill: 'url(#solid-struct)' }, g);
    const fV = S.rect({ x: 222, y: y - 13, w: 50, h: 26, r: 5, fill: '#1f3a68', stroke: 'struct', sw: 1.5 }, g);
    hide([fK, fV]);
    return { g, y, eK, eV, fK, fV };
  });
  hide(colG);
  fade(colG, 0, 1, 0.3, 0.5);
  // L1 fills on 'per layer'; the rest fill fast on 'Times eighty'
  const tL1 = T('b2~layer') - 0.1, t80 = T('b2~times#4') - 0.1;
  slots.forEach((s, i) => { if (s.dots) return; const at = i === 0 ? tL1 : t80 + 0.07 * i; fade([s.fK, s.fV], 0, 1, at, 0.2); });
  const dots = slots[10];
  const dotsGlow = S.rect({ x: 160, y: 476, w: 118, h: 28, r: 8, fill: 'url(#pglow-struct)', opacity: 0 }, colG);
  dotsGlow.setAttribute('data-audit', 'ignore');
  pulse(dotsGlow, t80 + 0.7, 1, 0.6);
  void dots;

  // ================================================================ b1: what one layer's K and V hold
  const kv = S.g();
  const SEGW = 70, KX = 680;
  const row = (y, name, fill) => {
    const g = S.g(null, kv);
    S.text(name, { x: KX - 20, y, size: 28, weight: 800, anchor: 'end', color: 'struct' }, g);
    const segs = [];
    for (let s = 0; s < 8; s++) {
      const sg = S.g(null, g);
      S.rect({ x: KX + SEGW * s + 2, y: y - 20, w: SEGW - 4, h: 40, r: 5, fill, stroke: 'struct', strokeOpacity: 0.8, sw: 1.5 }, sg);
      const cells = S.path({ d: Array.from({ length: 15 }, (_, c) => `M${(KX + SEGW * s + 2 + (c + 1) * (SEGW - 4) / 16).toFixed(1)},${y - 16} V${y + 16}`).join(''), stroke: '#0a0f1e', strokeOpacity: 0.35, sw: 1 }, sg);
      cells.setAttribute('data-audit', 'ignore');
      segs.push({ sg, cells });
    }
    return { g, segs };
  };
  const kRow = row(470, 'K', 'url(#solid-struct)'), vRow = row(545, 'V', '#1f3a68');
  const heads = S.g(null, kv);
  for (let s = 0; s < 8; s++) S.text('128', { x: KX + SEGW * s + SEGW / 2, y: 594, size: 20, weight: 650, family: 'mono', anchor: 'middle', color: 'muted' }, heads);
  const numL = S.text('8 × 128 = 1,024 numbers each', { x: KX + 4 * SEGW, y: 640, size: 28, weight: 700, anchor: 'middle', color: 'ink' }, kv);
  const bytesL = S.text('2 bytes per number', { x: KX + 4 * SEGW, y: 684, size: 24, weight: 650, anchor: 'middle', color: 'muted' }, kv);
  // the K tile splits into eight heads on 'eight'; cells and '128' on 'a hundred and twenty-eight'; V on 'numbers'
  [kRow, vRow].forEach((r, ri) => r.segs.forEach((s, i) => {
    const at = ri === 0 ? tH + 0.1 + 0.05 * i : T('b1~numbers') - 0.1 + 0.04 * i;
    K.track(s.sg, [K.K(at, { x: ri === 0 ? -SEGW * i : 0, o: ri === 0 ? 1 : 0 }), K.K(at + 0.4, { x: 0, o: 1, e: 'power3.out' })]);
    hide(s.cells);
    fade(s.cells, 0, 1, tD + 0.05 * i, 0.25);
  }));
  hide([kRow.g, vRow.g]);
  fade(kRow.g, 0, 1, tH, 0.25);
  fade(vRow.g, 0, 1, T('b1~numbers') - 0.1, 0.25);
  hide([heads, numL, bytesL]);
  fade(heads, 0, 1, tD + 0.3, 0.35);
  fade(numL, 0, 1, T('b1~numbers') + 0.1, 0.35);
  fade(bytesL, 0, 1, tBy + 0.2, 0.35);
  fade(kv, 1, 0, tB2, 0.4);

  // ================================================================ b2: per layer, then times eighty
  // one element per token, placed by measured width (SVG would collapse leading spaces)
  const MS = 40, GAP = 16;
  const wOf = (s, fam) => S.measure(s, { size: MS, weight: 700, family: fam });
  const famOf = s => (s === 'bytes' || s === '4 KB' ? 'sans' : 'mono');
  const placeLine = (toks, cx, y, parent) => {
    const total = toks.reduce((a, [s]) => a + wOf(s, famOf(s)), 0) + GAP * (toks.length - 1);
    let x = cx - total / 2;
    return toks.map(([s, c, at]) => {
      const e = S.text(s, { x, y, size: MS, weight: 700, family: famOf(s), color: c }, parent);
      e.__x = x; x += wOf(s, famOf(s)) + GAP;
      if (at != null) { hide(e); S.add(K.drive(0.35, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(-12 * (1 - E('power3.out')(k))).toFixed(1)})`); }), at - 0.1); }
      return e;
    });
  };
  const tE = T('b2~eight'), tT = T('b2~twenty'), t2 = T('b2~two#2'), t4 = T('b2~four'), tKB = T('b3~one') - 0.1;
  const perLayer = S.g();
  // the per-layer line, with room on the right for '= 4 KB' (b3)
  placeLine([['2', 'ink', T('b2~Two')], ['×', 'muted', tE], ['8', 'ink', tE], ['×', 'muted', tT], ['128', 'ink', tT], ['×', 'muted', t2], ['2', 'ink', t2],
    ['=', 'muted', t4], ['4,096', 'ink', t4], ['bytes', 'ink', t4], ['=', 'muted', tKB + 0.3], ['4 KB', 'helps', tKB + 0.3]], 1200, 470, perLayer);
  const perL = S.text('per layer, per token', { x: 1200, y: 526, size: 26, weight: 650, anchor: 'middle', color: 'muted' });
  hide(perL);
  fade(perL, 0, 1, T('b2~per') - 0.1, 0.35);
  const tot = S.g();
  const totEls = placeLine([['×', 'muted'], ['80', 'bytes'], ['=', 'muted'], ['327,680', 'bytes'], ['bytes', 'bytes']], 1200, 640, tot);
  const cnt = totEls[3];
  cnt.setAttribute('text-anchor', 'end');
  cnt.setAttribute('x', (cnt.__x + wOf('327,680', 'mono')).toFixed(1));
  hide(tot);
  fade(tot, 0, 1, t80, 0.35);
  const tCount = T('b2~three') - 0.1;
  whole(t => { cnt.textContent = Math.round(327680 * E('power1.inOut')(cl((t - tCount) / 3.6))).toLocaleString('en-US'); });
  S.add(f.toNumbers({ d: 1.0 }), T('b2~bytes#2') - 0.4);

  // ================================================================ b3: three hundred and twenty kilobytes per token
  fade(perL, 1, 0, tB3, 0.35);
  const fig = S.text([{ t: '320 KB', c: 'bytes' }, { t: ' per token', c: 'ink' }], { x: 1200, y: 790, size: 68, weight: 800, anchor: 'middle' });
  const used = S.pill('used from here on', { x: 1200, y: 862, tone: 'neutral', size: 24, h: 40 });
  hide([fig, used]);
  S.add(K.drive(0.5, k => { setO(fig, k); fig.setAttribute('transform', `translate(600,790) scale(${(0.85 + 0.15 * E('back.out(1.6)')(k)).toFixed(3)}) translate(-600,-790)`); }), T('b3~kilobytes') - 0.4);
  fade(used, 0, 1, T('b3~token') - 0.1, 0.35);
  const kbNote = S.text('1 KB = 1,024 bytes here', { x: 1200, y: 916, size: 24, weight: 600, anchor: 'middle', color: 'muted' });
  hide(kbNote);
  fade(kbNote, 0, 1, tKB, 0.35);
  // all eighty layers: the '80' and the whole column glow coral together
  const tAll = T('b3~eighty') - 0.1;
  S.add(f.glow(1, { tone: 'bytes', d: 1.4, hold: 0.6 }), tAll);
  const colGlow = S.rect({ x: 100, y: 430, w: 200, h: 460, r: 18, fill: 'url(#pglow-bytes)', opacity: 0 });
  colGlow.setAttribute('data-audit', 'ignore');
  colG.insertBefore(colGlow, colG.firstChild);
  pulse(colGlow, tAll, 0.9, 1.4);
  fade(hdr, 1, 0, tAll, 0.3);
  const hdr2 = S.g(null, colG);
  S.text('a key and a value', { x: 230, y: 382, size: 24, weight: 700, anchor: 'middle', color: 'bytes' }, hdr2);
  S.text('at every one of the eighty', { x: 230, y: 414, size: 24, weight: 700, anchor: 'middle', color: 'bytes' }, hdr2);
  hide(hdr2);
  fade(hdr2, 0, 1, tAll + 0.3, 0.4);
  void tB2; void lerp; void EIO;
});
