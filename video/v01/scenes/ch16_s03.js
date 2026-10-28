/* ch16_s03 · case A, continue the chat (fig 49)
   The model answered 'The capital of France is Paris.' (7 tokens); a minute later you add 'And its population?'
   (4 tokens): 770 + 7 + 7 + 4 = 788. The answer was cached as it was written, so everything before the new
   words matches: hit 784 (770 + 7 + 7), prefill 4 (checked). A perfect prefix, the model's own answer included.
   b1  'case A: continue the chat'; the arriving row: system, tools, question 1, the answer's seven pills, four
       new pills; brackets 'answer 1: 7', 'new: 4'; '770 + 7 + 7 + 4 = 788'.
   b2  the cache row builds, its answer pills each clicking a K/V tile on; the scan cursor turns each arriving
       cell teal and stops at the first difference; the new pills amber; plate and scoreboard 'A | 784 | 4'.
   b3  the answer pills of both rows glow; 'a perfect prefix, answer included'; a chat window: each message
       adds only a short amber sliver to a long teal bar, 'keep typing, stay warm'.
   Layout: the case layout of s02, with larger cells (h 58, 26 px labels, from x 250): arriving y 440, in the
   cache y 566, brackets y 398 / 374, plate y 724; chat window x 80-300, y 820-940, its bar y 981. */
V.scene('ch16_s03', S => {
  const K = libKit(S), { T, cl, E, whole, setO, hide, fade } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const AY = 440, CY = 566, H = 58;
  const ANS = ['The', 'capital', 'of', 'France', 'is', 'Paris', '.'], NEW = ['And', 'its', 'population', '?'];
  const L = ch16Lay(S, [{ label: 'system', w: 118 }, { label: 'tools', w: 98 }, { label: 'question 1', w: 164 }, ...ANS.map(label => ({ label, case: 'keep' })), ...NEW.map(label => ({ label, case: 'keep' }))], { x0: 250, size: 26, pad: 20, minW: 52 });
  const SEG = L.slice(0, 3), AP = L.slice(3, 10), NP = L.slice(10);
  const XC = AP[6].r + 3;  // where the cache row ends: the first difference

  // ================================================================ b1: the conversation so far, and four new tokens
  const kicker = S.text('case A: continue the chat', { x: 960, y: 150, size: 30, weight: 750, anchor: 'middle', color: 'ink' });   // centred
  rise(kicker, T('b1~Case') - 0.1, 6);
  const score = ch16Score(S, { rows: [{ case: 'time t', hit: 0, pre: 777 }, { case: 'A', hit: 784, pre: 4, at: T('b2~Hit') + 0.6 }] });
  void score;
  const arrL = S.text('arriving', { x: 226, y: AY + 1, size: 26, weight: 750, anchor: 'end', color: 'muted' });
  rise(arrL, 0.6, 0);
  const tCur = T('b2~everything') - 0.1, dCur = 1.6;
  const cur = ch16Cursor(S, { y1: AY - 40, y2: CY + 40, x0: 242, x1: XC, at: tCur, d: dCur, out: tB3 + 0.2 });
  const rowA = S.g();
  const tAns = ANS.map((w, i) => (i < 6 ? T(`b1~${['The#3', 'capital', 'of', 'France', 'is', 'Paris'][i]}`) - 0.1 : T('b1~Paris') + 0.2));
  const tNew = NEW.map((w, i) => (i < 3 ? T(`b1~${['And', 'its', 'population'][i]}`) - 0.1 : T('b1~population') + 0.35));
  const tHit = T('b2~Hit') - 0.1;
  const arr = L.map((c, i) => {
    const isNew = i >= 10, passT = cur.passAt(c.r);
    const plan = isNew ? [[0, 'blue'], [tHit + 0.06 * (i - 10), 'amber']] : [[0, 'blue'], [passT, 'teal', 0.25]];
    const cell = ch16Cell(S, { x: c.x, y: AY, w: c.w, h: H, label: c.label, case: c.case, size: 26, plan }, rowA);
    const at = i < 3 ? 0.8 + 0.12 * i : i < 10 ? tAns[i - 3] : tNew[i - 10];
    K.track(cell, [K.K(at, { x: i < 3 ? -24 : 30, o: 0 }), K.K(at + 0.35, { x: 0, o: 1, e: 'power3.out' })]);
    if (i < 3) cell.check(passT);
    return cell;
  });
  const bracket = (x1, x2, label, at, tone = 'muted') => {
    const g = S.g();
    const p = S.path({ d: `M${x1 + 2},406 V398 H${x2 - 2} V406`, stroke: tone, sw: 2.5 }, g);
    p.setAttribute('data-audit', 'ignore');
    S.text(label, { x: (x1 + x2) / 2, y: 374, size: 24, weight: 700, anchor: 'middle', color: tone }, g);
    rise(g, at, 6);
    return g;
  };
  const brA = bracket(AP[0].x, AP[6].r, 'answer 1: 7', tAns[6] + 0.1);
  bracket(NP[0].x, NP[3].r, 'new: 4', tNew[3] + 0.1);
  const sum = S.text('770 + 7 + 7 + 4 = 788', { x: L.end + 22, y: AY + 1, size: 26, weight: 750, color: 'ink' });
  rise(sum, tNew[3] + 0.3, 0);
  const ansCheck = S.g();
  S.circle({ x: AP[6].r - 2, y: 398, r: 12, fill: 'helps' }, ansCheck);
  S.path({ d: `M${AP[6].r - 8},398 L${AP[6].r - 4},403 L${AP[6].r + 4},393`, stroke: '#0a0f1e', sw: 2.5 }, ansCheck);
  ansCheck.setAttribute('data-audit', 'ignore');
  hide(ansCheck);
  fade(ansCheck, 0, 1, cur.passAt(AP[6].r), 0.25);
  void brA;

  // ================================================================ b2: the answer was cached as it was written
  const cacL = S.text('in the cache', { x: 226, y: CY + 1, size: 26, weight: 750, anchor: 'end', color: 'bytes' });
  rise(cacL, tB2, 0);
  const rowC = S.g();
  const tWrit = T('b2~cached') - 0.1;
  const cache = L.slice(0, 10).map((c, i) => {
    const cell = ch16Cell(S, { x: c.x, y: CY, w: c.w, h: H, label: c.label, case: c.case, size: 26, plan: [[0, 'teal']] }, rowC);
    const at = i < 3 ? tB2 + 0.1 * i : tWrit + 0.16 * (i - 3);
    K.track(cell, [K.K(at, { y: i < 3 ? 0 : -26, o: 0 }), K.K(at + 0.3, { y: 0, o: 1, e: i < 3 ? 'power2.out' : 'back.out(1.8)' })]);
    if (i >= 3) {
      const kv = ch16KV(S, c.r - 9, CY - H / 2 - 2, 10, 22, rowC);
      kv.setAttribute('data-audit', 'ignore');
      hide(kv);
      fade(kv, 0, 1, at + 0.3, 0.15);
    }
    return cell;
  });
  void cache;
  const writ = S.pill('cached as it was written', { x: (AP[0].x + AP[6].r) / 2, y: 634, tone: 'bytes', size: 24, h: 42 });
  rise(writ, tWrit + 0.6, 6);
  fade(writ, 1, 0, tHit - 0.2, 0.3);
  K.ignore(rowA, tCur, dCur + 0.3);
  // the first difference: the cache row ends where the new words begin
  const line = S.line({ x1: XC, y1: AY - 40, x2: XC, y2: CY + 40, stroke: '#ffffff', sw: 4 });
  line.setAttribute('data-audit', 'ignore');
  hide(line);
  fade(line, 0, 1, tCur + dCur, 0.2);
  const fd = S.text('first difference', { x: XC + 16, y: CY + 1, size: 24, weight: 700, color: 'ink' });
  rise(fd, tCur + dCur + 0.1, 0);
  const plate = ch16Plate(S, { x: (250 + L.end) / 2, y: 724, hit: '784', pre: '4 tokens' });
  rise(plate, tHit + 0.3, 10);

  // ================================================================ b3: a perfect prefix, the answer included
  const tOwn = T('b3~own') - 0.1;
  [AY, CY].forEach(y => {
    const r = S.rect({ x: AP[0].x - 10, y: y - H / 2 - 10, w: AP[6].r - AP[0].x + 20, h: H + 20, r: 20, fill: 'url(#pglow-helps)', opacity: 0 });
    r.setAttribute('data-audit', 'ignore');
    S.main.insertBefore(r, rowA);
    K.pulse(r, tOwn, 1, 1.4);
  });
  const perf = S.text('a perfect prefix, answer included', { x: (250 + L.end) / 2, y: 796, size: 28, weight: 750, anchor: 'middle', color: 'helps' });
  rise(perf, tOwn + 0.4, 8);
  // keep typing: each message adds only a short amber sliver to a long teal bar
  const tChat = T('b3~conversation') - 0.1;
  const chat = S.g();
  S.rect({ x: 80, y: 820, w: 220, h: 120, r: 14, fill: CH16.BASE, stroke: 'struct', strokeOpacity: 0.6, sw: 2 }, chat);
  S.icon('ph:chat-circle-dots-duotone', { x: 104, y: 842, size: 26, color: 'struct' }, chat);
  rise(chat, tChat, 8);
  const MSG = 5, bubbles = [];
  for (let m = 0; m < MSG; m++) {
    const right = m % 2 === 0, at = tChat + 0.35 + 0.55 * m;
    const b = S.rect({ x: right ? 190 : 96, y: 0, w: 94, h: 16, r: 8, fill: right ? '#5b8def' : '#3a4560' }, chat);
    b.setAttribute('data-audit', 'ignore');
    bubbles.push([b, at]);
  }
  whole(t => {
    // bubbles stack upward in the window as they arrive (newest at the bottom)
    const shown = bubbles.filter(([, at]) => t > at).length;
    bubbles.forEach(([b, at], m) => {
      const slot = shown - 1 - m, y = 912 - 22 * slot;
      b.setAttribute('y', y.toFixed(1));
      setO(b, t > at && y > 852 ? cl((t - at) / 0.2) : 0);
    });
  });
  const barT = S.rect({ x: 80, y: 972, w: 0, h: 18, r: 6, fill: 'url(#card-helps)', stroke: 'helps', sw: 2 });
  const barA = S.rect({ x: 80, y: 972, w: 0, h: 18, r: 4, fill: 'compute' });
  barA.setAttribute('data-audit', 'ignore');
  whole(t => {
    const n = bubbles.filter(([, at]) => t > at).length, k = cl((t - tChat - 0.1) / 0.4);
    const tealW = 300 + 22 * Math.max(0, n - 1), last = n ? cl((t - bubbles[n - 1][1]) / 0.25) : 0;
    barT.setAttribute('width', (tealW * k).toFixed(1));
    setO(barT, k);
    barA.setAttribute('x', (80 + tealW * k).toFixed(1));
    barA.setAttribute('width', (n ? 20 * last : 0.01).toFixed(1));
    setO(barA, n ? 1 : 0);
  });
  const stay = S.pill('keep typing, stay warm', { x: 560 + S.measure('keep typing, stay warm', { size: 24, weight: 600 }) / 2 + 22, y: 981, tone: 'helps', size: 24, h: 42 });
  rise(stay, T('b3~keep') - 0.15, 6);
});
