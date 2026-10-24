/* ch10_s03 · where the two comes from, and why it is exact (fig 112)
   Checked: a 4 × 6 matrix holds 24 weights; 24 multiply-accumulates × 2 = 48 operations; per row 6 MACs, so
   the counters read 6, 12, 18, 24 and 12, 24, 36, 48.
   b1  callback chip 'earlier: 2 operations per weight' (the '2' amber) at centre; an amber '?' beside the 2;
       the chip shrinks to the top-left corner.
   b2  the 4 × 6 matrix draws tile by tile ('24 weights'); six input cells along its top ('the token');
       'columns = inputs', 'rows = outputs'; row 1 brightens; the top band builds 'y = w1·x1 + w2·x2 + …' with
       square weight chips and round input chips.
   b3  'w1·x1' lifts out: 'one multiply'; its product drops into a running total y (0 → 0.42): 'one addition';
       the two tags fuse into the amber card 'multiply-accumulate'; '× → product', '+ → new total',
       '= 2 operations'; the card's 2 pulses with the corner chip's 2.
   b4  row by row, six pulses drop into the row's tiles, each flashes amber once and keeps a '1'; products sweep
       into the output; counters 6 … 24 and 12 … 48; 'once per layer', 'once per head' struck, 'once' stays;
       'operations = 2 × cells'.
   b5  'exact'; the corner '?' becomes a tick; 'fudge factor', 'rule of thumb' struck; a dashed second input
       row ghosts in ('a second input?') and is crossed out; 'one input vector: every weight used once'.
   Layout: matrix x 300-760, y 430-734 (tiles 70, pitch 78); inputs y 380; output cells x 820-890; workspace
   x 980-1280; card x 1340-1800, y 300-520; counters y 880. */
V.scene('ch10_s03', S => {
  const K = ch10Kit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const AMB = S.tone('compute');

  // ================================================================ b1: the callback chip
  const chip = S.g();
  // 'earlier: 2' and 'operations per weight' as two texts, with room between for the '?'
  const CS = 40, wA = S.measure('earlier: 2', { size: CS, weight: 650 }), GAPQ = 40, wB = S.measure(' operations per weight', { size: CS, weight: 650 });
  const cW = wA + GAPQ + wB;
  S.rect({ x: 960 - cW / 2 - 32, y: 540 - 40, w: cW + 64, h: 80, r: 18, fill: '#0c1326', stroke: 'white', strokeOpacity: 0.22, sw: 2 }, chip);
  S.text([{ t: 'earlier: ', c: 'muted' }, { t: '2', c: 'compute' }], { x: 960 - cW / 2, y: 541, size: CS, weight: 650 }, chip);
  S.text('operations per weight', { x: 960 - cW / 2 + wA + GAPQ, y: 541, size: CS, weight: 650, color: 'muted' }, chip);
  const twoX = 960 - cW / 2 + S.measure('earlier: ', { size: CS, weight: 650 }) + S.measure('2', { size: CS, weight: 650 }) / 2;
  const q = S.text('?', { x: 960 - cW / 2 + wA + GAPQ / 2, y: 530, size: 38, weight: 800, anchor: 'middle', color: 'compute' }, chip);
  const tick = S.icon('ph:check-bold', { x: 960 - cW / 2 + wA + GAPQ / 2, y: 530, size: 36, color: 'ink' }, chip);
  const twoGlow = S.circle({ x: twoX, y: 540, r: 26, fill: 'compute', opacity: 0 }, chip);
  twoGlow.setAttribute('data-audit', 'ignore');
  chip.insertBefore(twoGlow, chip.children[1]);
  hide([q, tick]);
  const tQ = T('b1~Exact') - 0.1, tShrink = T('b1~thumb') + 0.1;
  K.track(chip, [K.K(0.4, { o: 0, s: 0.9 }), K.K(0.9, { o: 1, s: 1 }), K.K(tShrink, { x: 0, y: 0, s: 1 }), K.K(tShrink + 0.8, { x: 110 + (cW + 64) * 0.55 / 2 - 960, y: 140 - 540, s: 0.55 })], 960, 540);
  S.add(K.drive(0.3, k => { setO(q, k); q.setAttribute('transform', `translate(0,${(8 * (1 - E('back.out(2)')(k))).toFixed(1)})`); }), tQ);
  K.ignore(chip, tShrink, 0.8);

  // ================================================================ b2: the matrix, the inputs, the sum
  const MX = 300, MY = 430, TS = 70, P = 78, cx = c => MX + c * P + TS / 2, cy = r => MY + r * P + TS / 2;
  const tiles = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    const g = S.g();
    g.bg = S.rect({ x: MX + c * P, y: MY + r * P, w: TS, h: TS, r: 8, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.8, sw: 2 }, g);
    g.fl = S.rect({ x: MX + c * P - 3, y: MY + r * P - 3, w: TS + 6, h: TS + 6, r: 10, fill: 'compute', opacity: 0 }, g);
    g.fl.setAttribute('data-audit', 'ignore');
    g.one = S.text('1', { x: cx(c), y: cy(r) + 1, size: 24, weight: 700, family: 'mono', anchor: 'middle', color: 'ink' }, g);
    hide(g.one);
    Object.assign(g, { r, c });
    tiles.push(g);
  }
  const tDraw = T('b2~Back') + 0.1;
  tiles.forEach((g, i) => K.track(g, [K.K(tDraw + 0.04 * i, { o: 0, s: 0.7 }), K.K(tDraw + 0.04 * i + 0.3, { o: 1, s: 1, e: 'back.out(1.6)' })], cx(g.c), cy(g.r)));
  const w24 = S.text('24 weights', { x: MX + 3 * P - 4, y: 772, size: 24, weight: 600, anchor: 'middle', color: 'muted' });
  hide(w24);
  fade(w24, 0, 1, tDraw + 1.1, 0.4);
  const inputs = Array.from({ length: 6 }, (_, c) => { const g = S.g(); S.circle({ x: cx(c), y: 380, r: 22, fill: 'url(#solid-struct)' }, g); return g; });
  const tIn = T('b2~six') - 0.1;
  inputs.forEach((g, c) => K.track(g, [K.K(tIn + 0.06 * c, { y: -40, o: 0 }), K.K(tIn + 0.06 * c + 0.4, { y: 0, o: 1, e: 'power3.out' })]));
  const lTok = S.text('the token', { x: MX - 24, y: 380, size: 24, weight: 650, anchor: 'end', color: 'struct' });
  const lCol = S.text('columns = inputs', { x: MX + 6 * P + 12, y: 380, size: 24, weight: 600, color: 'muted' });
  const lRow = S.text('rows = outputs', { x: MX - 24, y: MY + 2 * P - 4, size: 24, weight: 600, anchor: 'end', color: 'muted' });
  hide([lTok, lCol, lRow]);
  fade([lTok, lCol, lRow], 0, 1, tIn + 0.4, 0.4, 0.15);
  // the output column
  const outs = Array.from({ length: 4 }, (_, r) => {
    const g = S.g();
    S.rect({ x: 820, y: MY + r * P, w: TS, h: TS, r: 8, fill: 'none', stroke: 'struct', strokeOpacity: 0.7, sw: 2 }, g);
    g.fill = S.rect({ x: 820, y: MY + r * P, w: TS, h: TS, r: 8, fill: 'url(#solid-struct)', opacity: 0 }, g);
    return g;
  });
  const lOut = S.text('the output', { x: 855, y: 772, size: 24, weight: 650, anchor: 'middle', color: 'struct' });
  hide([...outs, lOut]);
  fade([...outs, lOut], 0, 1, tIn + 0.6, 0.4);
  // row one brightens
  const row1 = S.rect({ x: MX - 6, y: MY - 6, w: 6 * P + 4, h: TS + 12, r: 12, fill: 'none', stroke: 'white', sw: 2.5 });
  hide(row1);
  const tRow = T('b2~Row#2') - 0.1;
  fade(row1, 0, 1, tRow, 0.35);
  // 'y = w1·x1 + w2·x2 + …' with chips
  const BY = 250;
  const wChip = (x, n, parent) => { const g = S.g(null, parent); S.rect({ x, y: BY - 22, w: 50, h: 44, r: 6, fill: 'url(#card-struct)', stroke: 'struct', sw: 2 }, g); S.text(`w${n}`, { x: x + 25, y: BY + 1, size: 24, weight: 700, anchor: 'middle', color: 'ink' }, g); return g; };
  const xChip = (x, n, parent) => { const g = S.g(null, parent); S.circle({ x: x + 23, y: BY, r: 23, fill: 'url(#solid-struct)' }, g); S.text(`x${n}`, { x: x + 23, y: BY + 1, size: 22, weight: 700, anchor: 'middle', color: '#0a0f1e' }, g); return g; };
  const term = (x, n) => { const g = S.g(); wChip(x, n, g); S.text('·', { x: x + 64, y: BY, size: 34, weight: 800, anchor: 'middle', color: 'ink' }, g); xChip(x + 78, n, g); return g; };
  const yEq = S.text('y =', { x: 300, y: BY, size: 34, weight: 700, color: 'ink' });
  const t1 = term(370, 1);
  const plus1 = S.text('+', { x: 520, y: BY, size: 34, weight: 700, anchor: 'middle', color: 'ink' });
  const t2 = term(548, 2);
  const plusE = S.text('+ …', { x: 700, y: BY, size: 34, weight: 700, color: 'ink' });
  hide([yEq, t1, plus1, t2, plusE]);
  fade(yEq, 0, 1, T('b2~output') - 0.1, 0.3);
  fade(t1, 0, 1, T('b2~weight') - 0.1, 0.35);
  fade([plus1, t2], 0, 1, T('b2~plus') - 0.1, 0.35);
  fade(plusE, 0, 1, T('b2~so') - 0.2, 0.35);

  // ================================================================ b3: one instruction, two operations
  const tLift = T('b3~term') - 0.1;
  // a copy of w1·x1 lifts out into the workspace
  const lift = term(370, 1);
  hide(lift);
  K.track(lift, [K.K(tLift, { x: 0, y: 0 }), K.K(tLift + 0.6, { x: 620, y: 60 })]);
  fade(lift, 0, 1, tLift, 0.2);
  const tagM = S.text('one multiply', { x: 1150, y: BY + 60, size: 26, weight: 700, color: 'compute' });
  const yBox = S.g();
  S.rect({ x: 990, y: 380, w: 210, h: 56, r: 10, fill: '#0c1326', stroke: 'compute', strokeOpacity: 0.7, sw: 2 }, yBox);
  S.text('y =', { x: 1008, y: 409, size: 26, weight: 700, color: 'ink' }, yBox);
  const yVal = S.text('0', { x: 1182, y: 409, size: 28, weight: 700, family: 'mono', anchor: 'end', color: 'compute' }, yBox);
  const tagA = S.text('one addition', { x: 1220, y: 409, size: 26, weight: 700, color: 'compute' });
  hide([tagM, yBox, tagA]);
  fade(tagM, 0, 1, tLift + 0.5, 0.3);
  fade(yBox, 0, 1, tLift + 0.6, 0.3);
  const prod = S.circle({ x: 0, y: 0, r: 8, fill: 'compute' });
  prod.setAttribute('data-audit', 'ignore');
  const tDrop = T('b3~instruction') - 0.1;
  whole(t => { const k = cl((t - tDrop) / 0.5); prod.setAttribute('transform', `translate(1085,${lerp(BY + 90, 406, E('power2.in')(k)).toFixed(1)})`); setO(prod, k > 0 && k < 1 ? 1 : 0); yVal.textContent = k >= 1 ? '0.42' : '0'; });
  fade(tagA, 0, 1, tDrop + 0.5, 0.3);
  // the two tags slide right and fuse into the card
  const tFuse = T('b3~multiply') - 0.15;
  K.track(tagM, [K.K(tFuse, { x: 0, y: 0, o: 1 }), K.K(tFuse + 0.5, { x: 300, y: 120, o: 1 })]);
  K.track(tagA, [K.K(tFuse, { x: 0, y: 0, o: 1 }), K.K(tFuse + 0.5, { x: 180, y: -30, o: 1 })]);
  fade([tagM, tagA], 1, 0, tFuse + 0.2, 0.3);
  const card = S.g();
  S.rect({ x: 1340, y: 300, w: 460, h: 220, r: 18, fill: '#16110a', stroke: 'compute', sw: 2.5 }, card);
  S.icon('ph:cpu-duotone', { x: 1384, y: 348, size: 40, color: 'compute' }, card);
  S.text('multiply-accumulate', { x: 1416, y: 348, size: 32, weight: 750, color: 'compute' }, card);
  const twoOps = S.text([{ t: '= ', c: 'ink' }, { t: '2', c: 'compute' }, { t: ' operations', c: 'ink' }], { x: 1372, y: 470, size: 30, weight: 700 }, card);
  const cardTwoX = 1372 + S.measure('= ', { size: 30, weight: 700 }) + S.measure('2', { size: 30, weight: 700 }) / 2;
  const cardGlow = S.circle({ x: cardTwoX, y: 470, r: 22, fill: 'compute', opacity: 0 }, card);
  cardGlow.setAttribute('data-audit', 'ignore');
  card.insertBefore(cardGlow, twoOps);
  const ghosts = S.g(null, card);
  S.text('× → product', { x: 1372, y: 400, size: 24, weight: 650, family: 'mono', color: 'muted' }, ghosts);
  S.text('+ → new total', { x: 1580, y: 400, size: 24, weight: 650, family: 'mono', color: 'muted' }, ghosts);
  S.path({ d: 'M1372,424 v8 H1772 v-8', stroke: 'muted', sw: 2 }, ghosts);
  hide([card, ghosts, twoOps]);
  fade(card, 0, 1, tFuse + 0.35, 0.4);
  fade(ghosts, 0, 1, T('b3~two#2') - 0.1, 0.4);
  fade(twoOps, 0, 1, T('b3~results') + 0.2, 0.4);
  const tSrc = T('b3~source') - 0.1;
  pulse(cardGlow, tSrc, 0.5, 0.8);
  pulse(twoGlow, tSrc, 0.5, 0.8);
  fade([lift, yBox, prod], 1, 0, T('b4') - 0.2, 0.35);

  // ================================================================ b4: every weight, exactly once
  const tB4 = T('b4') - 0.1;
  fade([yEq, t1, plus1, t2, plusE, ghosts, row1], 1, 0, tB4, 0.35);
  // twoOps moves up to sit right under the title once the ghosts go
  K.track(twoOps, [K.K(tB4, { y: 0 }), K.K(tB4 + 0.5, { y: -60 })]);
  const ROW0 = tB4 + 0.3, RD = 0.95;
  const dots = S.g();
  dots.setAttribute('data-audit', 'ignore');
  for (let r = 0; r < 4; r++) {
    const tr = ROW0 + r * RD;
    for (let c = 0; c < 6; c++) {
      const down = S.circle({ x: 0, y: 0, r: 6, fill: 'struct' }, dots), across = S.circle({ x: 0, y: 0, r: 5, fill: 'compute' }, dots);
      whole(t => {
        const k1 = cl((t - tr) / 0.35), k2 = cl((t - tr - 0.45) / 0.35);
        down.setAttribute('transform', `translate(${cx(c)},${lerp(404, cy(r), E('power2.in')(k1)).toFixed(1)})`);
        setO(down, k1 > 0 && k1 < 1 ? 1 : 0);
        across.setAttribute('transform', `translate(${lerp(cx(c), 855, E('power2.in')(k2)).toFixed(1)},${cy(r)})`);
        setO(across, k2 > 0 && k2 < 1 ? 1 : 0);
      });
    }
    tiles.filter(g => g.r === r).forEach(g => {
      pulse(g.fl, tr + 0.3, 0.85, 0.35);
      fade(g.one, 0, 1, tr + 0.45, 0.2);
      S.add(gsap.fromTo(g.bg, { attr: { 'fill-opacity': 1 } }, { attr: { 'fill-opacity': 0.4 }, duration: 0.4, immediateRender: false }), tr + 0.5);
    });
    S.add(gsap.fromTo(outs[r].fill, { attr: { opacity: 0 } }, { attr: { opacity: 0.85 }, duration: 0.3, immediateRender: false }), tr + 0.78);
  }
  // counters
  const cMac = S.text('0', { x: 300, y: 905, size: 46, weight: 750, family: 'mono', color: 'compute' });
  const cOps = S.text('0', { x: 760, y: 905, size: 46, weight: 750, family: 'mono', color: 'compute' });
  const lMac = S.text('multiply-accumulates', { x: 300, y: 856, size: 24, weight: 600, color: 'muted' });
  const lOps = S.text('operations', { x: 760, y: 856, size: 24, weight: 600, color: 'muted' });
  hide([cMac, cOps, lMac, lOps]);
  fade([lMac, cMac, lOps, cOps], 0, 1, tB4 - 0.1, 0.4);
  whole(t => { const n = [0, 1, 2, 3].filter(r => t >= ROW0 + r * RD + 0.45).length; cMac.textContent = String(6 * n); cOps.textContent = String(12 * n); });
  // not once per layer, not once per head: once
  const strikeTag = (txt, x, y, at, d) => {
    const g = S.g();
    S.text(txt, { x, y, size: 28, weight: 600, color: 'muted' }, g);
    const w = S.measure(txt, { size: 28, weight: 600 });
    const ln = S.path({ d: `M${x - 6},${y} H${x + w + 6}`, stroke: 'muted', sw: 3 }, g);
    ln.setAttribute('data-audit', 'ignore');
    K.draw(ln, w + 12, at + 0.3, 0.3);
    hide(g);
    fade(g, 0, 1, at, 0.3);
    fade(g, 1, 0, at + d, 0.4);
    return g;
  };
  const tNot = T('b4~Not') - 0.05;
  strikeTag('once per layer', 1360, 610, tNot, T('b4~Once#2') - tNot + 0.3);
  strikeTag('once per head', 1360, 660, T('b4~head') - 0.2, T('b4~Once#2') - T('b4~head') + 0.5);
  const once = S.text('once', { x: 1360, y: 610, size: 34, weight: 800, color: 'ink' });
  hide(once);
  fade(once, 0, 1, T('b4~Once#2') + 0.3, 0.35);
  const rule = S.text([{ t: 'operations = ', c: 'ink' }, { t: '2', c: 'compute' }, { t: ' × cells', c: 'ink' }], { x: 1360, y: 880, size: 34, weight: 750 });
  const ruleGlow = S.rect({ x: 1340, y: 848, w: 420, h: 64, r: 14, fill: 'white', opacity: 0 });
  ruleGlow.setAttribute('data-audit', 'ignore');
  hide(rule);
  fade(rule, 0, 1, T('b4~twice') - 0.1, 0.4);

  // ================================================================ b5: exact, not a rule of thumb
  const tEx = T('b5~Exact') - 0.1;
  pulse(ruleGlow, tEx, 0.12, 0.9);
  const exact = S.pill('exact', { x: 1360 + S.measure('operations = 2 × cells', { size: 34, weight: 750 }) + 20, y: 880, tone: 'neutral', size: 22, h: 38, anchor: 'start', color: 'ink' });
  hide(exact);
  fade(exact, 0, 1, tEx + 0.3, 0.35);
  fade(q, 1, 0, tEx + 0.2, 0.3);
  fade(tick, 0, 1, tEx + 0.35, 0.3);
  strikeTag('fudge factor', 1360, 690, T('b5~not') - 0.1, 1.4);
  strikeTag('rule of thumb', 1360, 740, T('b5~rule') - 0.05, 1.3);
  fade(once, 1, 0.4, tEx, 0.4);
  // a second input row? no
  const tSec = T('b5~one') - 0.1;
  const ghostRow = S.g();
  for (let c = 0; c < 6; c++) S.circle({ x: cx(c), y: 318, r: 20, fill: 'none', stroke: 'struct', sw: 2, dash: '5 5' }, ghostRow);
  S.text('? a second input?', { x: MX + 6 * P + 12, y: 318, size: 24, weight: 650, color: 'muted' }, ghostRow);
  const cross = S.path({ d: `M${MX - 10},300 L${MX + 6 * P},336 M${MX - 10},336 L${MX + 6 * P},300`, stroke: 'muted', sw: 3 }, ghostRow);
  cross.setAttribute('data-audit', 'ignore');
  K.draw(cross, 1000, tSec + 0.7, 0.3);
  hide(ghostRow);
  fade(ghostRow, 0, 1, tSec, 0.35);
  fade(ghostRow, 1, 0, tSec + 1.3, 0.4);
  fade(w24, 1, 0, T('b5~no#2') - 0.1, 0.3);
  const fin = S.text('one input vector: every weight used once', { x: MX + 3 * P - 4, y: 772, size: 26, weight: 700, anchor: 'middle', color: 'ink' });
  hide(fin);
  fade(fin, 0, 1, T('b5~no#2') + 0.2, 0.4);
  fade(lOut, 1, 0, T('b5~no#2') - 0.1, 0.3);
  void EIO; void AMB;
});
