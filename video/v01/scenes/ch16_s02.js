/* ch16_s02 · time t, the first question (fig 48)
   A service starts every conversation with the same 770-token preamble (system prompt and tools). At time t you
   ask 'What is the capital of France?', 7 tokens: 770 + 7 = 777. Nothing in the cache matches this
   conversation, so hit 0, prefill all 777. On a busy machine the preamble is probably cached already, leaving
   the 7 question tokens as the only genuinely new work.
   b1  the arriving row: 'system', 'tools'; ghost rows of other conversations; the bracket 'shared preamble: 770
       tokens'; the empty scoreboard.
   b2  'time t'; seven pills as spoken, '7 tokens', '770 + 7 = 777'; the cache row: nothing that matches; the
       arriving row fills amber; plate 'hit 0 · prefill all 777 tokens'; scoreboard 'time t | 0 | 777'.
   b3  'the expensive case: nothing reused'; on a busy machine the preamble is probably cached (teal hatching);
       the seven pills pulse: 'the only genuinely new work'.
   Layout (the case layout, s02-s05, s08): row labels end x 230; cells from x 260; arriving y 440, in the cache
   y 560; brackets above the arriving row (y 398, label y 374); plate y 720; scoreboard top right. */
V.scene('ch16_s02', S => {
  const K = libKit(S), { T, cl, E, whole, setO, hide, fade } = K;
  const tB3 = T('b3') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const AY = 440, CY = 560, X0 = 260, GAP = 8;
  const SYS = [X0, 300], TLS = [X0 + 300 + GAP, 220], PW = 110;
  const PX = i => TLS[0] + TLS[1] + GAP + i * (PW + GAP);
  const XEND = PX(6) + PW, PRE_END = TLS[0] + TLS[1];
  const WORDS = ['What', 'is', 'the', 'capital', 'of', 'France', '?'];

  // ================================================================ b1: one preamble for every conversation
  const kicker = S.text('a smaller example, token by token', { x: 960, y: 150, size: 28, weight: 700, anchor: 'middle', color: 'muted' });   // centred
  rise(kicker, T('b1~smaller') - 0.1, 6);
  const tRow = T('b1~service') - 0.15, tFill = T('b2~all') - 0.05, tHatch = T('b3~preamble') + 0.2;
  const arrL = S.text('arriving', { x: 230, y: AY + 1, size: 26, weight: 750, anchor: 'end', color: 'muted' });
  rise(arrL, tRow, 0);
  // ghosts of other conversations' rows: the same two segments, flickering behind
  const ghosts = S.g();
  ghosts.setAttribute('data-audit', 'ignore');
  [3, 2, 1].forEach(k => {
    const g = S.g(null, ghosts);
    [SYS, TLS].forEach(([x, w]) => S.rect({ x: x + 18 * k, y: AY - 28 - 18 * k, w, h: 56, r: 14, fill: '#1d3566', fillOpacity: 0.5, stroke: 'struct', strokeOpacity: 0.5, sw: 2 }, g));
    const at = T('b1~every') - 0.1 + 0.12 * (3 - k);
    whole(t => setO(g, cl((t - at) / 0.2) * (1 - cl((t - at - 1.1 - 0.1 * k) / 0.4)) * (0.55 + 0.25 * Math.sin(t * 22 + k))));
  });
  const rowA = S.g();
  const sys = ch16Cell(S, { x: SYS[0], y: AY, w: SYS[1], label: 'system', plan: [[0, 'blue'], [tFill, 'amber']], hatch: [[0, 0], [tHatch + 0.6, 1, 0.4]] }, rowA);
  const tls = ch16Cell(S, { x: TLS[0], y: AY, w: TLS[1], label: 'tools', plan: [[0, 'blue'], [tFill + 0.15, 'amber']], hatch: [[0, 0], [tHatch + 0.7, 1, 0.4]] }, rowA);
  [sys, tls].forEach((c, i) => K.track(c, [K.K(tRow + 0.12 * i, { x: -24, o: 0 }), K.K(tRow + 0.12 * i + 0.45, { x: 0, o: 1, e: 'power3.out' })]));
  const glint = (cell, at) => { const r = S.rect({ x: cell.l - 6, y: cell.t - 6, w: cell.w + 12, h: cell.h + 12, r: 18, fill: 'url(#pglow-struct)', opacity: 0 }); r.setAttribute('data-audit', 'ignore'); S.main.insertBefore(r, rowA); K.pulse(r, at, 1, 0.7); };
  glint(sys, T('b1~system') - 0.1);
  glint(tls, T('b1~tools') - 0.1);
  const bracket = (x1, x2, label, at, tone = 'muted') => {
    const g = S.g();
    const p = S.path({ d: `M${x1 + 2},406 V398 H${x2 - 2} V406`, stroke: tone, sw: 2.5 }, g);
    p.setAttribute('data-audit', 'ignore');
    S.text(label, { x: (x1 + x2) / 2, y: 374, size: 24, weight: 700, anchor: 'middle', color: tone }, g);
    rise(g, at, 6);
    return g;
  };
  bracket(X0, PRE_END, 'shared preamble: 770 tokens', T('b1~seven') - 0.1);
  const score = ch16Score(S, { rows: [{ case: 'time t', hit: 0, pre: 777, at: T('b2~prefilled') + 0.2 }] });
  rise(score, T('b1~counted') - 0.1, 8);

  // ================================================================ b2: time t, seven tokens, nothing held
  const clock = S.g();
  S.icon('ph:clock-duotone', { x: 92, y: 374, size: 40, color: 'struct' }, clock);
  S.text('time t', { x: 120, y: 375, size: 26, weight: 750, color: 'struct' }, clock);
  rise(clock, T('b2~time') - 0.15, 6);
  const wordAt = ['What', 'is', 'the', 'capital', 'of', 'France'].map(w => T(`b2~${w}`) - 0.1);
  wordAt.push(wordAt[5] + 0.3);
  const pills = WORDS.map((w, i) => {
    const c = ch16Cell(S, { x: PX(i), y: AY, w: PW, label: w, case: 'keep', plan: [[0, 'blue'], [tFill + 0.3 + 0.1 * i, 'amber']] }, rowA);
    K.track(c, [K.K(wordAt[i], { x: 30, o: 0 }), K.K(wordAt[i] + 0.35, { x: 0, o: 1, e: 'power3.out' })]);
    return c;
  });
  bracket(PX(0), XEND, '7 tokens', T('b2~Seven') - 0.1);
  const sum = S.text('770 + 7 = 777', { x: XEND + 22, y: AY + 1, size: 26, weight: 750, color: 'ink' });
  rise(sum, T('b2~tokens') - 0.05, 0);
  K.ignore(rowA, tFill, 1.4);
  // the cache row: nothing that matches this conversation
  const tNo = T('b2~Nothing') - 0.1;
  const cacL = S.text('in the cache', { x: 230, y: CY + 1, size: 26, weight: 750, anchor: 'end', color: 'bytes' });
  rise(cacL, tNo, 0);
  const cRow = S.rect({ x: X0, y: CY - 28, w: XEND - X0, h: 56, r: 14, stroke: CH16.DASH, strokeOpacity: 0.85, sw: 2, dash: '8 7' });
  rise(cRow, tNo, 0, 0.45);
  const nothingG = S.g();  // the painter moves the group; rise and fades act on the text
  const nothing = S.text('nothing that matches this conversation', { x: (X0 + XEND) / 2, y: CY + 1, size: 26, weight: 650, anchor: 'middle', color: 'muted' }, nothingG);
  rise(nothing, tNo + 0.2, 0);
  const plate = ch16Plate(S, { x: (X0 + XEND) / 2, y: 720, hit: '0', pre: 'all 777 tokens' });
  rise(plate, T('b2~seventyseven') - 0.1, 10);

  // ================================================================ b3: the cold case, and what is new
  const exp = S.pill('the expensive case: nothing reused', { x: plate.r + 30 + S.measure('the expensive case: nothing reused', { size: 24, weight: 600 }) / 2 + 22, y: 720, tone: 'neutral', size: 24, h: 42 });
  rise(exp, tB3 + 0.2, 6);
  const tBusy = T('b3~busy') - 0.1;
  const users = S.g();
  [0, 1, 2, 3, 4].forEach(i => S.icon('ph:user-duotone', { x: 330 + 100 * i, y: 316, size: 36, color: 'muted' }, users));
  users.setAttribute('data-audit', 'ignore');
  hide(users);
  fade(users, 0, 0.6, tBusy, 0.5);
  // the preamble part of the cache row fills with teal hatching (and the text moves to the question part)
  const hatch = S.path({ d: ch16Hatch(X0 + 4, CY - 24, PRE_END - X0 - 8, 48, 14), stroke: 'helps', strokeOpacity: 0.7, sw: 3, cap: 'butt' });
  hatch.setAttribute('data-audit', 'ignore');
  hide(hatch);
  fade(hatch, 0, 1, tHatch, 0.5);
  const pDash = S.rect({ x: X0, y: CY - 28, w: PRE_END - X0, h: 56, r: 14, stroke: 'helps', strokeOpacity: 0.7, sw: 2, dash: '8 7' });
  hide(pDash);
  fade(pDash, 0, 1, tHatch, 0.5);
  whole(t => nothingG.setAttribute('transform', `translate(${((PX(0) + XEND) / 2 - (X0 + XEND) / 2) * E('power2.inOut')(cl((t - tHatch + 0.5) / 0.5))},0)`));
  K.ignore(nothing, tHatch - 0.5, 0.55);
  fade(nothing, 1, 0, tHatch - 0.5, 0.15);
  fade(nothing, 0, 1, tHatch + 0.05, 0.3);
  const prob = S.pill('probably cached by someone else', { x: (X0 + PRE_END) / 2, y: 632, tone: 'helps', size: 24, h: 42 });
  rise(prob, tHatch + 0.4, 6);
  // the seven question tokens pulse: the only genuinely new work
  const tOnly = T('b3~only') - 0.1;
  pills.forEach((c, i) => { const r = S.rect({ x: c.l - 8, y: c.t - 8, w: c.w + 16, h: c.h + 16, r: 20, fill: 'url(#pglow-compute)', opacity: 0 }); r.setAttribute('data-audit', 'ignore'); S.main.insertBefore(r, rowA); K.pulse(r, tOnly + 0.04 * i, 1, 0.8); });
  const newT = S.pill('the only genuinely new work', { x: (PX(0) + XEND) / 2, y: 316, tone: 'compute', size: 24, h: 42 });
  rise(newT, tOnly + 0.2, 6);
  const note = S.text('widths schematic', { x: 1860, y: 1010, size: 22, weight: 600, anchor: 'end', color: 'muted' });
  rise(note, tRow + 0.5, 0);
});
