/* ch07_s03 · two conversions (fig 86)
   One shot, three station cards in the middle band joined by two grey arrows: Text -> Tokens -> Vectors.
   b1: the sentence types on in the Text card; a copy of it rides arrow 1 and snaps into five blue pills,
       one per row of the Tokens card. Recalls from chapter one under the cards: 'unbelievably' splitting
       into three pills (under Text) and '500 words -> 600-800 tokens' (under Tokens).
   b2: a copy of each pill rides arrow 2 and unrolls into its vector, a shaded strip in the matching row of
       the Vectors card (each fills a dashed slot). '8,192 numbers each' along the top. Then the left side
       dims and the five strips squash into the top of a tall block that fills row by row while the
       counter runs 5 -> 700 tokens; '700 x 8,192 = 5.7 million numbers'; the block sharpens into a matrix.
   b3: the left side returns; a crossed-out calculator on each arrow; 'lookup in a list', 'read one row';
       the sentence fades out of the Text card; everything but the block dims: 'only numbers from here on'.
   Colour: white text, blue tokens and vectors, grey arrows and tags. No amber: nothing here is arithmetic. */
V.scene('ch07_s03', S => {
  const { fx } = S;

  // ---------------------------------------------------------------- layout
  const CY = 522;                                         // the arrows, and the middle row of pills / strips
  const CARD_T = 222, CARD_B = 762, HEAD_Y = 274;
  const TX = { l: 96, r: 436 }, TK = { l: 636, r: 856 }, VC = { l: 1056, r: 1824 };
  [TX, TK, VC].forEach(c => { c.cx = (c.l + c.r) / 2; c.w = c.r - c.l; });
  const ROWS = [-2, -1, 0, 1, 2].map(k => CY + 66 * k);   // pill / strip row centres (66 px pitch)
  const WORDS = ['the', 'quick', 'brown', 'fox', 'jumps'];
  const PILL = { size: 28 };                              // token chips: 28 px text, 52 px tall
  // a token's vector: the chapter's shaded strip, 20 cells (as in the embedding table of s04-s06)
  const NC = 20, CW = 17, CG = 3, SH = 40;
  const SW = NC * (CW + CG) - CG;                          // 397
  const BR = VC.r - 32, BL = BR - SW;                     // strips / block: x 1395..1792
  const BT = ROWS[0] - SH / 2;                            // block top (370)
  const NR = 45, RP = 8, RH = 6.5;                        // the block: 45 drawn rows (700 tokens, schematic)
  const BB = BT + (NR - 1) * RP + RH;                     // block bottom (728.5)
  const A1 = { x1: TX.r + 18, x2: TK.l - 18 }, A2 = { x1: TK.r + 18, x2: VC.l - 18 };
  const G1 = (TX.r + TK.l) / 2, G2 = (TK.r + VC.l) / 2;   // gap centres (arrow icon and tag column)
  const CAP_Y = 822;                                      // the caption row under the cards

  // ---------------------------------------------------------------- small helpers
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  // hidden paths, for sampling routes (getPointAtLength)
  const routes = S.g({ 'data-audit': 'ignore', opacity: 0 }, S.layers.back);
  const route = d => { const p = S.path({ d, stroke: 'none' }, routes); p.__L = p.getTotalLength(); return p; };
  // move a holder along a route: translate so that its point `from` follows the path, scaling about it
  const ride = (holder, path, from, o = {}) => ch07Drive(o.d ?? 1, k => {
    const pt = path.getPointAtLength(k * path.__L);
    const s = o.s ? o.s(k) : 1;
    holder.setAttribute('transform', `translate(${pt.x.toFixed(2)},${pt.y.toFixed(2)}) scale(${s.toFixed(4)}) translate(${-from[0]},${-from[1]})`);
  }, o.ease || 'power2.inOut');

  // ---------------------------------------------------------------- the three station cards
  const station = (c, title, glyph) => {
    const g = S.g();
    S.card({ x: c.l, y: CARD_T, w: c.w, h: CARD_B - CARD_T, tone: 'neutral', title: '' }, g);
    // the glyph (about 44 px) and the title, centred in the card as one
    const x0 = c.cx - (44 + 12 + S.measure(title, { size: 34, weight: 650 })) / 2;
    glyph(x0 + 22, HEAD_Y, g);
    g.titleEl = S.text(title, { x: x0 + 56, y: HEAD_Y, size: 34, weight: 650, color: 'ink' }, g);
    ch07Hide(g);
    return g;
  };
  // header glyphs: a document; a row of three pills; three stacked shaded strips
  const glyphText = (x, y, p) => S.icon('ph:file-text-duotone', { x, y, size: 42, color: 'ink' }, p);
  const glyphTokens = (x, y, p) => {
    const gg = S.g(null, p);
    [[-24, 13], [-8, 17], [12, 13]].forEach(([dx, w]) => {
      S.rect({ x: x + dx, y: y - 7, w, h: 14, r: 4.5, fill: '#0c1326' }, gg);
      S.rect({ x: x + dx, y: y - 7, w, h: 14, r: 4.5, fill: 'struct', fillOpacity: 0.35, stroke: 'struct', strokeOpacity: 0.95, sw: 1.8 }, gg);
    });
    return gg;
  };
  const glyphVectors = (x, y, p) => {
    const gg = S.g(null, p), rnd = S.rand(31);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
      const v = rnd() * 2 - 1, a = clamp(0.2 + 0.7 * Math.abs(v));
      const tone = v < 0 ? 'violet' : 'struct';
      S.rect({ x: x - 20 + c * 7, y: y - 13 + r * 9.5, w: 5.5, h: 7, r: 1.5, fill: tone, fillOpacity: 0.15 + 0.75 * a, stroke: tone, strokeOpacity: 0.4 + 0.4 * a, sw: 0.8 }, gg);
    }
    return gg;
  };
  const textG = station(TX, 'Text', glyphText);
  const tokG = station(TK, 'Tokens', glyphTokens);
  const vecG = station(VC, 'Vectors', glyphVectors);

  // empty dashed slots in the Vectors card: one vector per token, not there yet
  const slots = ROWS.map(y => S.rect({ x: BL, y: y - SH / 2, w: SW, h: SH, r: 4, stroke: 'struct', strokeOpacity: 0.32, sw: 1.5, dash: '6 6' }, vecG));

  // ---------------------------------------------------------------- the two arrows (with their later icon and tag)
  const arrowG = [A1, A2].map((a, i) => {
    const g = S.g();
    g.arrow = S.arrow({ x1: a.x1, y1: CY, x2: a.x2, y2: CY, color: 'muted', sw: 3, head: 14 }, g);
    g.calc = ch07NoCalc(S, { x: i ? G2 : G1, y: CY - 52, size: 48 }, g);
    g.tag = S.text(i ? 'read one row' : 'lookup in a list', { x: i ? G2 : G1, y: CY + 44, size: 24, anchor: 'middle', color: 'muted', weight: 550 }, g);
    ch07Hide(g.tag);
    return g;
  });

  // ---------------------------------------------------------------- b1: you type text
  S.add(ch07Fade([textG, tokG, vecG], 0, 1, { d: 0.65, stagger: 0.12, dy0: 18, dy1: 0 }), 'b1~you-0.45');
  S.add(fx.drawArrow(arrowG[0].arrow, { d: 0.5 }), 'b1~text-0.15');
  S.add(fx.drawArrow(arrowG[1].arrow, { d: 0.5 }), 'b1~text+0.1');

  // the sentence, two lines, left-aligned in the Text card; it types on with a caret
  const TS = { size: 36, weight: 500, case: 'keep' };   // the sentence being typed, as written
  const LINES = [['the', 'quick', 'brown'], ['fox', 'jumps']];
  const LINE_Y = [CY - 26, CY + 26];
  const lineStr = LINES.map(l => l.join(' '));
  const X0 = TX.cx - S.measure(lineStr[0], TS) / 2;
  const sentG = S.g(null, textG);
  const words = [];                                       // {el, word, line, x, cx, y, s (char offset in the sentence)}
  let off = 0;
  LINES.forEach((ln, li) => {
    ln.forEach((w, wi) => {
      const x = X0 + (wi ? S.measure(ln.slice(0, wi).join(' ') + ' ', TS) : 0);
      const el = S.text(w, { x, y: LINE_Y[li], ...TS, color: 'ink' }, sentG);
      words.push({ el, word: w, line: li, x, cx: x + S.measure(w, TS) / 2, y: LINE_Y[li], s: off });
      off += w.length + 1;
    });
  });
  const NCH = off - 1;                                     // 25 characters, the line break counted as the space
  const caret = S.rect({ x: X0, y: LINE_Y[0] - 21, w: 3, h: 42, r: 1.5, fill: 'ink' }, sentG);
  const caretX = n => {
    const l1 = lineStr[0].length;
    return n <= l1 ? [X0 + S.measure(lineStr[0].slice(0, n), TS) + 3, 0] : [X0 + S.measure(lineStr[1].slice(0, n - l1 - 1), TS) + 3, 1];
  };
  const caretPos = Array.from({ length: NCH + 1 }, (_, n) => caretX(n));
  const typeTo = p => {
    const n = Math.round(p * NCH);
    words.forEach(w => { w.el.textContent = w.word.slice(0, clamp(n - w.s, 0, w.word.length)); });
    const [cx, li] = caretPos[n];
    caret.setAttribute('x', cx.toFixed(2));
    caret.setAttribute('y', LINE_Y[li] - 21);
  };
  typeTo(0);
  ch07Hide(caret);
  S.add(ch07Fade(caret, 0, 1, { d: 0.12 }), 'b1~type-0.15');
  S.add(ch07Drive(1.0, typeTo, 'none'), 'b1~type-0.05');
  S.add(ch07Fade(caret, 1, 0, { d: 0.2 }), 'b1~tokeniser-0.25');

  // the token pills, one per row of the Tokens card (hidden until their word lands)
  const pills = WORDS.map((w, i) => libToken(S, { text: w, x: TK.cx, y: ROWS[i], ...PILL, hidden: true }, tokG));

  // "The tokeniser": a copy of the sentence rides arrow 1 as one packet, shrinking as it goes; on "cuts" it
  // snaps apart, each word flying to its row and becoming a pill
  const T_DEP = S.t('b1~tokeniser') - 0.12, D1 = 0.8, S1 = 0.55;
  const T_CUT = S.t('b1~cuts') - 0.16, CUT_GAP = 0.06, D2 = 0.45;
  const C0 = [TX.cx, CY], C1 = [TK.cx, CY];
  const e1 = gsap.parseEase('power2.inOut'), e2 = gsap.parseEase('power3.out');
  S.add(ch07Fade(sentG, 1, 0.35, { d: 0.3 }), T_DEP);
  words.forEach((w, i) => {
    const h = S.g(null, S.layers.front);
    S.text(w.word, { x: w.cx, y: w.y, ...TS, anchor: 'middle', color: 'ink' }, h);
    ch07Hide(h);
    const t2 = T_CUT + i * CUT_GAP, D = t2 + D2 - T_DEP;
    const rel = [w.cx - C0[0], w.y - C0[1]];
    const pAt = (q, sc) => [lerp(C0[0], C1[0], q) + rel[0] * sc, lerp(C0[1], C1[1], q) + rel[1] * sc];
    const end1 = pAt(1, S1), target = [TK.cx, ROWS[i]], sEnd = PILL.size / TS.size;
    S.add(ch07Fade(h, 0, 1, { d: 0.08 }), T_DEP);
    S.add(ch07Ignore(h, D + 0.1), T_DEP);
    S.add(ch07Drive(D, k => {
      const t = k * D;
      let p, sc;
      if (t < t2 - T_DEP) {                                // phase 1: the packet rides the arrow
        const q = e1(clamp(t / D1));
        sc = lerp(1, S1, q); p = pAt(q, sc);
      } else {                                             // phase 2: this word snaps to its row
        const q = e2(clamp((t - (t2 - T_DEP)) / D2));
        sc = lerp(S1, sEnd, q); p = [lerp(end1[0], target[0], q), lerp(end1[1], target[1], q)];
      }
      h.setAttribute('transform', `translate(${p[0].toFixed(2)},${p[1].toFixed(2)}) scale(${sc.toFixed(4)}) translate(${-w.cx},${-w.y})`);
    }, 'none'), T_DEP);
    S.add(ch07Fade(h, 1, 0, { d: 0.14, ease: 'power1.in' }), t2 + D2 - 0.1);
    S.add(pills[i].pop({ d: 0.45, from: 0.75 }), t2 + D2 - 0.16);
  });
  S.add(ch07Fade(sentG, 0.35, 1, { d: 0.5 }), T_CUT + 4 * CUT_GAP + D2);

  // "the tokens you met earlier": 'unbelievably' drops in under the Text card and splits into three pills
  const UNB = ['un', 'believ', 'ably'];
  const recallG = S.g();
  const ux0 = TX.cx - S.measure('unbelievably', TS) / 2;
  const segs = UNB.map((p, i) => {
    const hold = S.g(null, recallG);
    const x = ux0 + S.measure(UNB.slice(0, i).join(''), TS);
    hold.el = S.text(p, { x, y: CAP_Y, ...TS, color: 'ink' }, hold);
    hold.cx = x + S.measure(p, TS) / 2;
    return hold;
  });
  const unb = libTokenStrip(S, { x: TX.cx, y: CAP_Y, align: 'middle', tokens: UNB, ...PILL, gap: 12, hidden: true }, recallG);
  const segWrap = S.g(null, recallG);
  segs.forEach(s => segWrap.appendChild(s));
  ch07Hide(segWrap);
  const illus = S.pill('illustrative split, as before', { x: TX.cx, y: CAP_Y + 62, h: 38, size: 24, padX: 16, tone: 'neutral', style: 'ghost' }, recallG);
  ch07Hide(illus);
  S.add(ch07Fade(segWrap, 0, 1, { d: 0.45, dy0: -26, dy1: 0, ease: 'power3.out' }), 'b1~met-0.2');
  const T_SPLIT = S.t('b1~earlier') + 0.3;
  S.add(ch07Drive(0.5, k => segs.forEach((s, i) => s.setAttribute('transform', `translate(${((unb.at(i).cx - s.cx) * k).toFixed(2)},0)`)), 'power3.inOut'), T_SPLIT);
  S.add(unb.reveal('all', { every: 0.06, d: 0.4 }), T_SPLIT + 0.32);
  S.add(ch07Fade(segWrap, 1, 0, { d: 0.2 }), T_SPLIT + 0.42);
  S.add(ch07Fade(illus, 0, 1, { d: 0.45, dy0: 10, dy1: 0 }), T_SPLIT + 0.75);

  // "a little smaller than words": the recall from chapter one under the Tokens card
  const subG = S.g();
  const sub1 = S.text('500 words → 600–800 tokens', { x: TK.cx, y: CAP_Y - 4, size: 26, anchor: 'middle', color: 'muted', weight: 550 }, subG);
  const sub2 = S.text('(1.2–1.6 per word)', { x: TK.cx, y: CAP_Y + 34, size: 26, anchor: 'middle', color: 'muted', weight: 550 }, subG);
  ch07Hide([sub1, sub2]);
  S.add(ch07Fade([sub1, sub2], 0, 1, { d: 0.5, stagger: 0.15, dy0: 10, dy1: 0 }), 'b1~smaller-0.15');

  // ---------------------------------------------------------------- b2: the embedding step
  S.add(ch07Fade(recallG, 1, 0, { d: 0.4, ease: 'power2.in' }), 'b2-0.1');
  S.add(ch07Fade(subG, 1, 0.4, { d: 0.5 }), 'b2-0.1');

  // everything drawn on the vectors (re-centred in the card in b3, once its labels have gone)
  const blockHold = S.g(null, vecG);
  // each pill's vector, in its own holder (squashed into the block later)
  const stripH = WORDS.map(() => S.g(null, blockHold));
  const strips = WORDS.map((w, i) => ch07Vec(S, { token: w, n: NC, cw: CW, ch: SH, gap: CG, anchor: 'start', x: BL, y: ROWS[i] - SH / 2, hidden: true }, stripH[i]));
  // a copy of each pill rides arrow 2 and unrolls into its strip
  const T_EMB = S.t('b2~embedding') - 0.15, EMB_GAP = 0.2, EMB_D = 1.0;
  WORDS.forEach((w, i) => {
    const h = S.g(null, S.layers.front);
    libToken(S, { text: w, x: TK.cx, y: ROWS[i], ...PILL }, h);
    ch07Hide(h);
    // slide straight out of the column at its own row, drop onto arrow 2, ride it, rise to the strip's row
    const y = ROWS[i], end = [BL + 30, y], xa = TK.r + 34, xb = A2.x1 + 86;
    const r = route(`M${TK.cx},${y} L${xa},${y} C${xa + 44},${y} ${xb - 44},${CY} ${xb},${CY} L${A2.x2},${CY} C${A2.x2 + 90},${CY} ${end[0] - 90},${y} ${end[0]},${y}`);
    const t0 = T_EMB + i * EMB_GAP;
    S.add(ch07Fade(h, 0, 1, { d: 0.08 }), t0);
    S.add(ch07Ignore(h, EMB_D + 0.2), t0);
    S.add(ride(h, r, [TK.cx, ROWS[i]], { d: EMB_D, s: k => (k < 0.3 ? lerp(1, 0.86, k / 0.3) : lerp(0.86, 0.78, clamp((k - 0.75) / 0.25))) }), t0);
    S.add(strips[i].pop({ stagger: 0.02, d: 0.3, scale: 0.4 }), t0 + EMB_D - 0.14);
    S.add(ch07Fade(h, 1, 0, { d: 0.22, ease: 'power1.in' }), t0 + EMB_D - 0.06);
    S.add(ch07Fade(slots[i], 1, 0, { d: 0.4 }), t0 + EMB_D - 0.1);
  });

  // "eight thousand one hundred and ninety-two": the length, along the top of the strips
  const widthG = S.g(null, blockHold);
  const wBr = S.bracket({ x1: BL, x2: BR, y: BT - 12, up: true, label: '8,192 numbers each', size: 26 }, widthG);
  ch07Hide(wBr.label);
  S.add(fx.draw(wBr.line, { d: 0.7, ease: 'power2.out' }), 'b2~eight-0.15');
  S.add(ch07Fade(wBr.label, 0, 1, { d: 0.5, dy0: 8, dy1: 0 }), 'b2~eight+0.15');

  // "numbers long": the left side dims; the five strips squash into the top of a tall block
  const T_SQ = S.t('b2~numbers') - 0.18, SQ_D = 0.5;
  S.add(ch07Fade([textG, tokG, arrowG[0], arrowG[1]], 1, 0.3, { d: 0.5 }), T_SQ);
  S.add(ch07Drive(SQ_D, k => stripH.forEach((h, i) => {
    const y0 = ROWS[i] - SH / 2, sy = lerp(1, RH / SH, k), top = lerp(y0, BT + i * RP, k);
    h.setAttribute('transform', `translate(0,${(top - y0 * sy).toFixed(3)}) scale(1,${sy.toFixed(5)})`);
  }), 'power2.inOut'), T_SQ);
  S.add(ch07Ignore(stripH), T_SQ);

  // the rest of the block: 40 more rows (other tokens), drawn in the strips' heat style
  const blockG = S.g({ 'data-audit': 'ignore' }, blockHold);
  const rowEls = [];
  for (let r = 5; r < NR; r++) {
    const rg = S.g(null, blockG), rnd = S.rand(1000 + r * 37);
    const vals = Array.from({ length: NC }, () => rnd() * 2 - 1);
    const vmax = Math.max(...vals.map(Math.abs));
    vals.forEach((v, c) => {
      const a = clamp((0.12 + 0.7 * Math.abs(v) / vmax), 0.06, 1), tone = v < 0 ? 'violet' : 'struct';
      S.rect({ x: BL + c * (CW + CG), y: BT + r * RP, w: CW, h: RH, r: 1.5, fill: tone, fillOpacity: +(0.1 + 0.78 * a).toFixed(2), stroke: tone, strokeOpacity: +(0.25 + 0.45 * a).toFixed(2), sw: 1 }, rg);
    });
    ch07Hide(rg);
    rowEls.push(rg);
  }

  // the counter: '5 tokens' runs to '700 tokens' down the block's left edge, with a growing dimension line
  const LX = BL - 40, DX = BL - 18;
  const cntG = S.g(null, blockHold);
  const cntLbl = S.g(null, cntG);                         // the label rides the middle of the growing block
  const tokW = S.measure('tokens', { size: 30, weight: 550 });
  const LBL_Y = (BT + BB) / 2;
  const cntNum = S.text('5', { x: LX - tokW - 12, y: LBL_Y + 2, size: 46, family: 'mono', weight: 600, anchor: 'end', color: 'ink', baseline: 'alphabetic' }, cntLbl);
  S.text('tokens', { x: LX, y: LBL_Y + 2, size: 30, anchor: 'end', color: 'ink', weight: 550, baseline: 'alphabetic' }, cntLbl);
  S.text('≈ a 500-word prompt', { x: LX, y: LBL_Y + 38, size: 26, anchor: 'end', color: 'muted', weight: 550 }, cntLbl);
  const dimLine = S.path({ d: '', stroke: 'muted', sw: 2.5 }, cntG);
  const grownTo = n => {                                  // n rows drawn: dimension line and label follow
    const yb = BT + (Math.max(5, n) - 1) * RP + RH;
    dimLine.setAttribute('d', `M${DX - 7},${BT} h14 M${DX},${BT} V${yb.toFixed(2)} M${DX - 7},${yb.toFixed(2)} h14`);
    cntLbl.setAttribute('transform', `translate(0,${Math.max(BT + 32 - LBL_Y, (BT + yb) / 2 - LBL_Y).toFixed(2)})`);
  };
  grownTo(5);
  ch07Hide(cntG);
  const T_CAS = T_SQ + SQ_D - 0.08, CAS_D = 0.68;
  S.add(ch07Fade(cntG, 0, 1, { d: 0.3 }), T_CAS - 0.1);
  S.add(ch07Drive(CAS_D, p => {
    const n = 5 + p * (NR - 5);
    rowEls.forEach((rg, j) => {
      const v = clamp(n - (5 + j));
      rg.style.opacity = v;
      rg.style.visibility = v > 0.001 ? 'inherit' : 'hidden';
    });
    grownTo(n);
    cntNum.textContent = String(Math.round(5 + p * 695));
  }, 'power1.inOut'), T_CAS);

  // "in our model": how many numbers that is, and the block sharpens into a matrix
  const total = S.text([{ t: '700 × 8,192 ≈ ', c: 'muted' }, { t: '5.7 million', c: 'ink' }, { t: ' numbers', c: 'muted' }], { x: VC.cx, y: CAP_Y, size: 30, anchor: 'middle', weight: 550 });
  ch07Hide(total);
  S.add(ch07Fade(total, 0, 1, { d: 0.5, dy0: 10, dy1: 0 }), 'b2~our-0.02');
  const matG = S.g({ 'data-audit': 'ignore' }, blockHold);
  let gd = '';
  for (let c = 1; c < NC; c++) { const x = BL + c * (CW + CG) - CG / 2; gd += `M${x},${BT}V${BB}`; }
  for (let r = 1; r < NR; r++) { const y = BT + r * RP - (RP - RH) / 2; gd += `M${BL},${y}H${BR}`; }
  const gridLines = S.path({ d: gd, stroke: 'struct', strokeOpacity: 0.32, sw: 1 }, matG);
  ch07Hide(gridLines);
  const frame = S.rect({ x: BL - 7, y: BT - 7, w: SW + 14, h: BB - BT + 14, r: 7, stroke: 'struct', sw: 2.5 }, matG);
  S.add(fx.draw(frame, { d: 0.75, ease: 'power2.inOut' }), 'b2~model-0.15');
  S.add(ch07Fade(gridLines, 0, 1, { d: 0.6 }), 'b2~model');

  // ---------------------------------------------------------------- b3: neither is a calculation; both are lookups
  S.add(ch07Fade(subG, 0.4, 0, { d: 0.4, ease: 'power2.in' }), 'b3-0.05');
  S.add(ch07Fade([textG, tokG, arrowG[0], arrowG[1]], 0.3, 1, { d: 0.6 }), 'b3~Neither-0.05');
  S.add(arrowG[0].calc.show({ d: 0.9 }), 'b3~conversion-0.15');
  S.add(arrowG[1].calc.show({ d: 0.9 }), 'b3~conversion+0.15');

  // "Both are lookups": the numbers' labels clear; each arrow says what it does
  S.add(ch07Fade([cntG, total, widthG], 1, 0, { d: 0.4, ease: 'power2.in' }), 'b3~Both-0.25');
  S.add(ch07Fade(arrowG[0].tag, 0, 1, { d: 0.45, dy0: 10, dy1: 0 }), 'b3~Both-0.05');
  S.add(ch07Fade(arrowG[1].tag, 0, 1, { d: 0.45, dy0: 10, dy1: 0 }), 'b3~lookups-0.1');

  // "From here on": the block, now the only subject, settles into the middle of its card
  S.add(fx.xform(blockHold, { x: VC.cx - (BL + BR) / 2 }, { d: 1.0, ease: 'power2.inOut' }), 'b3~From-0.15');

  // "no text": the sentence fades out of the Text card, word by word
  S.add(ch07Fade(words.map(w => w.el), 1, 0, { d: 0.5, stagger: 0.06, ease: 'power2.inOut' }), 'b3~no-0.2');

  // "everything downstream": all but the block dims; one line beneath it
  S.add(ch07Fade([textG, tokG, arrowG[0], arrowG[1]], 1, 0.3, { d: 0.7 }), 'b3~everything-0.1');
  const only = S.text('only numbers from here on', { x: VC.cx, y: CAP_Y, size: 32, anchor: 'middle', weight: 600, color: 'ink' });
  ch07Hide(only);
  S.add(ch07Fade(only, 0, 1, { d: 0.6, dy0: 12, dy1: 0 }), 'b3~downstream-0.2');
  // "linear algebra": the matrix frame brightens, once
  const glow = S.rect({ x: BL - 7, y: BT - 7, w: SW + 14, h: BB - BT + 14, r: 7, stroke: 'struct', sw: 3, filter: 'url(#glow-struct)' }, matG);
  ch07Hide(glow);
  S.add(ch07Fade(glow, 0, 0.9, { d: 0.45 }), 'b3~linear-0.1');
  S.add(ch07Fade(glow, 0.9, 0.35, { d: 0.8, ease: 'power1.inOut' }), S.t('b3~linear') + 0.45);
});
