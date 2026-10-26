/* ch17_s03 · what a cache hit saves, and what it does not (fig 144)
   Idealised H100 at full speed: cold prefill of the 1,032-token weather prompt is 1,032 × 140 billion + 1.40
   trillion of attention = 145.9 trillion ops / 989 trillion/s = 147.5 ms; warm, 5 tokens are prefilled but
   one 140 GB read of the weights remains: 41.9 ms. 206× less work, only 3.5× less waiting (147.5 / 41.9); the
   first token comes 105.6 ms ('≈ 106 ms') sooner. Decode is identical: a token every 41.9 ms in both lanes.
   To scale at 3 px per ms: 442.5 px, 125.7 px; the ninth cold token lands at 482.7 ms (all checked).
   b1  the lanes and axis; 'the weather conversation'; 'Prefill: skipped for matched tokens'; the warm strip:
       1,027 teal cells and 5 amber (a magnifier); the cold strip all amber, '1,032'.
   b2  the strips collapse to scale: 148 ms against 42 ms; '206× less work → 3.5× less wait'; '≈ 106 ms';
       'longer history: seconds'; the warm block is one 140 GB read (coral outline, a hairline of arithmetic).
   b3  pills every 42 ms in both lanes, coral brackets of the same width; 'Decode: identical, still reads all
       140 GB'; the keys and values end up the same however they were assembled.
   b4  the rows condense; amber brackets (different) and coral brackets (the same); 'Prefill skipped → TTFT
       shorter', 'Decode identical → TPOT unchanged'.
   b5  'makes the model faster' struck, 'makes it start sooner'; the warm pills slide under the cold ones.
   Layout: axis 0-500 ms at x 210-1710 (3 px per ms), y 740; lanes: cold y 480, warm y 640; verdict rows at
   x 1040, y 170 / 228; the caveat tag bottom right. */
V.scene('ch17_s03', S => {
  const K = libKit(S), { T, cl, E, EIO, whole, setO, hide, fade } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1, tB5 = T('b5') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const X = ms => 210 + 3 * ms, LY = [480, 640], SH = 40, COLD = 147.5, TOK = 41.9, CELL = 1500 / 1032;

  // ================================================================ b1: the lanes, and what a hit skips
  const lanes = S.g();
  const axis = S.g(null, lanes);
  S.line({ x1: 210, y1: 740, x2: 1710, y2: 740, stroke: '#ffffff', strokeOpacity: 0.45, sw: 2 }, axis);
  for (let m = 0; m <= 500; m += 100) {
    S.line({ x1: X(m), y1: 734, x2: X(m), y2: 748, stroke: '#ffffff', strokeOpacity: 0.45, sw: 2 }, axis);
    S.text(m === 500 ? '500 ms' : String(m), { x: X(m), y: 774, size: 24, weight: 600, anchor: 'middle', color: 'muted' }, axis);
  }
  rise(axis, 0.6, 8, 0.5);
  const labG = S.g();
  S.text('cold', { x: 58, y: LY[0] + 1, size: 28, weight: 750, color: 'ink' }, labG);
  S.rect({ x: 144, y: LY[0] - 17, w: 50, h: 34, r: 8, stroke: '#8b95ad', sw: 2, dash: '5 4' }, labG);
  S.text('warm', { x: 58, y: LY[1] + 1, size: 28, weight: 750, color: 'ink' }, labG);
  S.rect({ x: 158, y: LY[1] - 17, w: 40, h: 34, r: 8, fill: 'url(#card-helps)', stroke: 'helps', sw: 2.5 }, labG);
  rise(labG, 0.7, 0, 0.4);
  const tag = ch17Tag(S, 'idealised: H100 at full speed, no network or queue');
  fade(tag, 0, 1, 1.0, 0.4);
  const wx = S.g();
  S.icon('ph:cloud-sun-duotone', { x: 560, y: 160, size: 52, color: 'muted' }, wx);   // ends well before the verdict tick at x 1038
  S.text('the weather conversation', { x: 600, y: 161, size: 26, weight: 650, color: 'muted' }, wx);
  rise(wx, 0.9, 6);
  fade(wx, 1, 0, tB2, 0.35);
  // the two strips of 1,032 hairline cells
  let cells = '';
  for (let i = 1; i < 1032; i++) cells += `M${(210 + CELL * i).toFixed(2)},0 v${SH}`;
  const strip = (y, at) => {
    const g = S.g();
    const base = S.rect({ x: 210, y: y - SH / 2, w: 1500, h: SH, r: 6, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.3, sw: 1.5 }, g);
    const fills = S.g(null, g);
    const hl = S.path({ d: cells, stroke: '#ffffff', strokeOpacity: 0.12, sw: 0.6, cap: 'butt' }, g);
    hl.setAttribute('transform', `translate(0,${y - SH / 2})`);
    hl.setAttribute('data-audit', 'ignore');
    rise(g, at, 0, 0.5);
    g.fills = fills; g.base = base;
    return g;
  };
  const sCold = strip(LY[0], 0.8), sWarm = strip(LY[1], 0.9);
  const tWarm = T('b1~Warm') - 0.1, tCold = T('b1~one') - 0.1;
  const tealW = S.rect({ x: 210, y: LY[1] - SH / 2, w: 0, h: SH, fill: 'helps', fillOpacity: 0.45 }, sWarm.fills);
  whole(t => tealW.setAttribute('width', Math.max(0.01, 1027 * CELL * EIO(cl((t - tWarm) / 1.0))).toFixed(1)));
  const amb5 = S.rect({ x: 210 + 1027 * CELL, y: LY[1] - SH / 2, w: 5 * CELL, h: SH, fill: 'compute' }, sWarm.fills);
  amb5.setAttribute('data-audit', 'ignore');
  hide(amb5);
  fade(amb5, 0, 1, tWarm + 1.0, 0.2);
  const ambC = S.rect({ x: 210, y: LY[0] - SH / 2, w: 0, h: SH, fill: 'compute', fillOpacity: 0.5 }, sCold.fills);
  whole(t => ambC.setAttribute('width', Math.max(0.01, 1500 * EIO(cl((t - tCold) / 1.0))).toFixed(1)));
  [tealW, ambC].forEach(e => e.setAttribute('data-audit', 'ignore'));
  const n1032 = S.text('1,032', { x: 1724, y: LY[0] + 1, size: 26, weight: 750, color: 'compute' });
  rise(n1032, tCold + 0.9, 0);
  // the magnifier over the warm strip's tip
  const mag = S.g();
  const MC = [1630, 560], MR = 52;
  S.path({ d: `M${MC[0] + MR * 0.75},${MC[1] + MR * 0.66} L1706,${LY[1] - SH / 2}`, stroke: '#ffffff', strokeOpacity: 0.6, sw: 2 }, mag);
  S.circle({ x: MC[0], y: MC[1], r: MR, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.8, sw: 2.5 }, mag);
  for (let i = 0; i < 8; i++) { const isA = i >= 3; S.rect({ x: MC[0] - 44 + 11 * i, y: MC[1] - 15, w: 9, h: 30, r: 2, fill: isA ? 'compute' : 'helps', fillOpacity: isA ? 1 : 0.6 }, mag); }
  S.text('5', { x: MC[0] + MR + 16, y: MC[1] + 1, size: 30, weight: 800, color: 'compute' }, mag);
  mag.setAttribute('data-audit', 'ignore');
  rise(mag, tWarm + 1.2, 0, 0.35);
  fade([mag, n1032], 1, 0, tB2, 0.3);
  // the verdict rows, top right
  const tick = S.g();
  S.circle({ x: 1052, y: 170, r: 14, fill: 'helps' }, tick);
  S.path({ d: 'M1045,170 L1050,176 L1060,164', stroke: '#0a0f1e', sw: 3 }, tick);
  rise(tick, T('b1~skips') - 0.1, 0);
  const row = (txt, y, tone, at, out) => { const e = S.text(txt, { x: 1078, y: y + 1, size: 28, weight: 750, color: tone }); rise(e, at, 6); if (out != null) fade(e, 1, 0, out, 0.25); return e; };
  const tCond = T('b4~purely') - 0.1, tOnly = T('b4~only') - 0.1;
  const p1 = row('Prefill: skipped for matched tokens', 170, 'helps', T('b1~skips') - 0.1, tB2 + 0.1);
  fade(tick, 1, 0, tB2 + 0.1, 0.25);
  void p1;

  // ================================================================ b2: 206× less work, 3.5× less wait
  const tCol = T('b2~Two') - 0.1, tHalfW = T('b2~three') - 0.1, tRead = T('b2~one') - 0.1;
  fade([sCold, sWarm], 1, 0, tCol + 0.4, 0.4);
  const block = (y, ms, tone) => { const r = S.rect({ x: 210, y: y - 18, w: 0, h: 36, r: 6, fill: 'compute', fillOpacity: 0.45, stroke: tone, sw: 2.5 }); r.ms = ms; return r; };
  const bC = block(LY[0], COLD, 'compute'), bW = block(LY[1], TOK, 'compute');
  [bC, bW].forEach(r => whole(t => { const k = EIO(cl((t - tCol) / 0.8)); r.setAttribute('width', Math.max(0.01, 3 * r.ms * k).toFixed(1)); setO(r, t > tCol ? 1 : 0); }));
  // one read of the weights: the warm block becomes a coral-outlined read with a hairline of arithmetic
  whole(t => { const k = cl((t - tRead) / 0.4); bW.setAttribute('stroke', S.tone(k > 0.5 ? 'bytes' : 'compute')); bW.setAttribute('fill-opacity', (0.45 * (1 - k) + 0.12 * k).toFixed(3)); bW.setAttribute('fill', S.tone(k > 0.5 ? 'bytes' : 'compute')); });
  const hair = S.rect({ x: 212, y: LY[1] - 16, w: 3, h: 32, fill: 'compute' });
  hair.setAttribute('data-audit', 'ignore');
  hide(hair);
  fade(hair, 0, 1, tRead + 0.3, 0.3);
  // the tokens: one every 41.9 ms in both lanes (the first lands with the block in b2, the rest in b3)
  const tDec = T('b3~Decode') - 0.1;
  const tSlide = T('b5~same') - 0.2;
  const pills = [0, 1].map(l => [...Array(9).keys()].map(k => {
    const ms = (l === 0 ? COLD : TOK) + TOK * k;
    const p = S.rect({ x: 0, y: LY[l] - 15, w: 30, h: 30, r: 8, fill: 'url(#card-struct)', stroke: 'struct', sw: 2 });
    p.setAttribute('data-audit', 'ignore');
    const at = k === 0 ? tCol + 0.8 : tDec + 0.2 + 0.18 * (k - 1) + 0.05 * l;
    whole(t => {
      const sh = l === 1 ? 3 * (COLD - TOK) * EIO(cl((t - tSlide) / 0.9)) : 0;
      p.setAttribute('x', (X(ms) - 15 + sh).toFixed(1));
      const kk = E('back.out(2)')(cl((t - at) / 0.25));
      p.setAttribute('transform', `translate(0,${(-20 * (1 - kk)).toFixed(1)})`);
      setO(p, cl((t - at) / 0.1));
    });
    return p;
  }));
  const msL = (txt, l, y, at) => { const e = S.text(txt, { x: X(l === 0 ? COLD : TOK), y, size: 26, weight: 750, anchor: 'middle', color: l === 0 ? 'compute' : 'bytes' }); rise(e, at, 6); return e; };
  const m148 = msL('≈ 148 ms', 0, LY[0] - 40, tCol + 1.0);
  const m42a = msL('≈ 42 ms', 1, LY[1] + 52, tCol + 1.1);
  fade(m42a, 1, 0, tRead, 0.2);
  const m42b = msL('≈ 42 ms: one 140 GB read', 1, LY[1] + 52, tRead + 0.25);
  m42b.setAttribute('text-anchor', 'start');
  m42b.setAttribute('x', X(TOK) - 30);
  fade(m42b, 1, 0, tB3 + 0.1, 0.25);
  const m42c = msL('≈ 42 ms', 1, LY[1] + 52, tB3 + 0.4);
  const ratio1 = S.text('206× less work', { x: 210, y: 340, size: 30, weight: 800, color: 'ink' });
  rise(ratio1, tCol + 0.9, 6);
  const r1w = S.measure('206× less work', { size: 30, weight: 800 });
  const ratio2 = S.text('→ 3.5× less wait', { x: 210 + r1w + 14, y: 340, size: 30, weight: 800, color: 'helps' });
  rise(ratio2, tHalfW, 6);
  const brW = S.g();
  const bp = S.path({ d: `M${X(TOK) + 2},532 v-10 H${X(COLD) - 2} v10`, stroke: '#ffffff', sw: 2.5 }, brW);
  bp.setAttribute('data-audit', 'ignore');
  S.text('≈ 106 ms', { x: (X(TOK) + X(COLD)) / 2, y: 556, size: 26, weight: 800, anchor: 'middle', color: 'ink' }, brW);
  rise(brW, tHalfW + 0.3, 0);
  const longer = S.pill('longer history: seconds', { x: (X(TOK) + X(COLD)) / 2, y: 590, tone: 'neutral', size: 22, h: 34 });
  rise(longer, tHalfW + 0.7, 4);
  fade([ratio1, ratio2, brW, longer], 1, 0, tB3, 0.3);

  // ================================================================ b3: decode is untouched
  const p1b = row('Prefill: skipped for matched tokens', 170, 'helps', tB3 + 0.3, tCond);
  const tickB = S.g();
  S.circle({ x: 1052, y: 170, r: 14, fill: 'helps' }, tickB);
  S.path({ d: 'M1045,170 L1050,176 L1060,164', stroke: '#0a0f1e', sw: 3 }, tickB);
  rise(tickB, tB3 + 0.3, 0);
  const d1 = row('Decode: identical, still reads all 140 GB', 228, 'bytes', tDec + 0.6, tCond);
  void p1b; void d1;
  // coral brackets of the same width under one gap in each lane
  const gapBr = [0, 1].map(l => {
    const g = S.g(), base = l === 0 ? COLD + TOK : 3 * TOK, y = LY[l] + 24;
    const p = S.path({ d: `M${X(base) + 16},${y} v10 H${X(base + TOK) - 16} v-10`, stroke: 'bytes', sw: 3 }, g);
    p.setAttribute('data-audit', 'ignore');
    const lab = S.text('≈ 42 ms', { x: X(base + TOK / 2), y: y + 30, size: 24, weight: 750, anchor: 'middle', color: 'bytes' }, g);
    rise(g, tDec + 1.4 + 0.2 * l, 0);
    g.lab = lab;
    return g;
  });
  // however the context was assembled, the keys and values are the same 1,032 tokens
  const tAsm = T('b3~how') - 0.1;
  const kv = [0, 1].map(l => {
    const g = S.g(), y = LY[l] - 44;
    const r = S.rect({ x: 210, y: y - 6, w: 0, h: 12, r: 4, fill: l === 0 ? 'helps' : 'helps', fillOpacity: 0.6 }, g);
    const edge = S.rect({ x: 0, y: y - 6, w: l === 0 ? 10 : 8, h: 12, r: 2, fill: 'compute' }, g);
    whole(t => {
      const k = EIO(cl((t - tAsm) / 0.6)), m = cl((t - tAsm - 0.9) / 0.5), w = 200 * k;
      r.setAttribute('width', Math.max(0.01, w).toFixed(1));
      edge.setAttribute('x', (210 + w - (l === 0 ? 10 : 8)).toFixed(1));
      setO(edge, k > 0 ? 1 - m : 0);
      setO(g, t > tAsm ? 1 - cl((t - tB4) / 0.3) : 0);
    });
    g.setAttribute('data-audit', 'ignore');
    return g;
  });
  void kv;
  fade(m148, 1, 0, tAsm - 0.3, 0.25);
  const kvL = S.text('1,032 tokens of keys and values', { x: 430, y: 560, size: 26, weight: 750, color: 'helps' });
  rise(kvL, tAsm + 1.2, 0, 0.3);
  fade(kvL, 1, 0, tAsm + 2.3, 0.3);

  // ================================================================ b4: purely a prefill optimisation
  const p2 = row('Prefill', 170, 'helps', tCond + 0.3, tOnly);
  const d2 = row('Decode', 228, 'bytes', tCond + 0.3, tOnly);
  void p2; void d2;
  fade(tickB, 1, 0, tCond, 0.25);
  const glowP = S.rect({ x: 1030, y: 146, w: 420, h: 50, r: 18, fill: 'url(#pglow-helps)', opacity: 0 });
  glowP.setAttribute('data-audit', 'ignore');
  K.pulse(glowP, tCond + 0.3, 1, 1.2);
  fade([m42c, ...gapBr.map(g => g.lab)], 1, 0, tCond, 0.3);
  const tWaits = T('b4~two') - 0.1;
  const ambBr = [0, 1].map(l => {
    const ms = l === 0 ? COLD : TOK, y = LY[l] - 26;
    const p = S.path({ d: `M212,${y} v-10 H${X(ms) - 2} v10`, stroke: 'compute', sw: 3 });
    p.setAttribute('data-audit', 'ignore');
    rise(p, tWaits + 0.15 * l, 0, 0.3);
    return p;
  });
  ambBr.forEach(p => { const gl = p.cloneNode(); gl.setAttribute('stroke-width', '9'); gl.setAttribute('stroke-opacity', '0.35'); p.parentNode.insertBefore(gl, p); gl.setAttribute('data-audit', 'ignore'); setO(gl, 0); S.add(K.drive(0.8, k => setO(gl, Math.sin(Math.PI * k))), tOnly + 0.3); });
  const arrowD = S.g();
  S.path({ d: 'M1052,152 V186 M1040,174 L1052,188 L1064,174', stroke: 'helps', sw: 3.5 }, arrowD);
  arrowD.setAttribute('data-audit', 'ignore');
  rise(arrowD, tOnly + 0.25, 0);
  row('Prefill skipped → TTFT shorter', 170, 'helps', tOnly + 0.25, null);
  row('Decode identical → TPOT unchanged', 228, 'bytes', tOnly + 0.4, null);

  // ================================================================ b5: start sooner, same speed
  const tFast = T('b5~make') - 0.1, tSoon = T('b5~start') - 0.1;
  const dimmed = [lanes, labG, bC, bW, hair, ...pills.flat(), ...gapBr, ...ambBr];
  fade(dimmed, 1, 0.3, tFast, 0.4);
  fade(dimmed, 0.3, 1, tSlide - 0.3, 0.4);
  const back = S.rect({ x: 600, y: 520, w: 720, h: 120, r: 18, fill: '#0c1326', fillOpacity: 0.85 });
  rise(back, tFast, 0, 0.3);
  const f1 = S.text('makes the model faster', { x: 960, y: 552, size: 34, weight: 750, anchor: 'middle', color: 'ink' });
  rise(f1, tFast + 0.1, 6);
  const fw = S.measure('makes the model faster', { size: 34, weight: 750 });
  const fx = S.path({ d: `M${960 - fw / 2 - 8},554 H${960 + fw / 2 + 8}`, stroke: '#8b95ad', sw: 4 });
  fx.setAttribute('data-audit', 'ignore');
  K.draw(fx, fw + 16, tFast + 0.6, 0.35);
  const f2 = S.text('makes it start sooner', { x: 960, y: 606, size: 34, weight: 800, anchor: 'middle', color: 'helps' });
  rise(f2, tSoon, 6);
  fade([back, f1, fx, f2], 1, 0, tSlide - 0.3, 0.3);
  void tB4;
});
