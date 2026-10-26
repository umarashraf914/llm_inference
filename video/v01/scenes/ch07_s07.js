/* ch07_s07 · order has to be put in (fig 90)
   b1  'same words, different order': row A 'the dog bit the man' (left), row B 'the man bit the dog' (right);
       grey arcs link matching words, the dog and man arcs crossing.
   b2  every pill drops its strip (identical tokens, identical strips: the dogs and the men outline in white);
       the strips tumble into a bin under each row, and the two bins hold the same pile; a grey '='.
   b3  the strips lift back under their pills, the bins fade, the '=' glides up between the rows; teal badges
       1-5 clip on (dog · 2, dog · 5); two option cards: 'add it in at the start', 'apply it inside attention'
       (a tiny glyph of tokens joined by arcs; 'comes next').
   b4  a teal tick and '70B example' on the second card; the cards fade and the '=' becomes a teal '≠'; the
       badges dim: 'vectors alone carry no order'.
   Layout: row A slots x 180-820, row B slots x 1100-1740, pills y 330, strips y 400; bins y 700-880. */
V.scene('ch07_s07', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const E = n => gsap.parseEase(n);
  const head = ch07Heading(S);
  S.add(head.show('same words, different order'), 'b1~still-0.1');

  const PY = 330, SY = 392;
  const A = ['the', 'dog', 'bit', 'the', 'man'], B = ['the', 'man', 'bit', 'the', 'dog'];
  const AX = [180, 340, 500, 660, 820], BX = [1100, 1260, 1420, 1580, 1740];
  const SN = 6, SCW = 16, SW = SN * (SCW + 3) - 3, SH = 22;

  // pills, and under each pill a holder with the token's strip
  const mk = (words, xs, row) => words.map((w, k) => {
    const pill = S.pill(w, { x: xs[k], y: PY, tone: 'struct', size: 30, h: 54, case: 'keep' });
    const hold = S.g();
    const inner = S.g(null, hold);
    ch07Vec(S, { token: w, n: SN, cw: SCW, ch: SH, gap: 3, anchor: 'start', x: xs[k] - SW / 2, y: SY }, inner);
    const ring = S.rect({ x: xs[k] - SW / 2 - 5, y: SY - 5, w: SW + 10, h: SH + 10, r: 6, stroke: 'white', sw: 2.5 }, hold);
    ring.setAttribute('data-audit', 'ignore');
    ch07Hide([pill, hold]);
    ring.style.opacity = 0;
    return { w, k, x: xs[k], pill, hold, inner, ring, row };
  });
  const RA = mk(A, AX, 'A'), RB = mk(B, BX, 'B');
  // b1: the rows slide in word by word
  const tA = [T('b1~The'), T('b1~dog'), T('b1~bit'), T('b1~the#2'), T('b1~man')];
  const tB = [T('b1~The#3'), T('b1~man#2'), T('b1~bit#2'), T('b1~the#4'), T('b1~dog#2')];
  RA.forEach((p, k) => S.add(ch07Fade(p.pill, 0, 1, { d: 0.35, dy0: -14, dy1: 0 }), tA[k] - 0.1));
  RB.forEach((p, k) => S.add(ch07Fade(p.pill, 0, 1, { d: 0.35, dy0: -14, dy1: 0 }), tB[k] - 0.1));
  // grey arcs link matching words, below the rows; the dog and man arcs cross
  const links = S.g();
  const pairs = [[0, 0], [1, 4], [2, 2], [3, 3], [4, 1]];
  pairs.forEach(([a, b]) => {
    const x1 = AX[a], x2 = BX[b], dy = 60 + Math.min(260, 0.2 * (x2 - x1));
    S.path({ d: `M${x1},${PY + 30} C${x1},${PY + 30 + dy} ${x2},${PY + 30 + dy} ${x2},${PY + 30}`, stroke: (a === 1 || a === 4) ? 'ink' : 'muted', strokeOpacity: (a === 1 || a === 4) ? 0.7 : 0.4, sw: 2 }, links);
  });
  links.querySelectorAll('path').forEach(e => e.setAttribute('data-audit', 'ignore'));
  ch07Hide(links);
  const linkPaths = [...links.querySelectorAll('path')];
  linkPaths.forEach(p => { p.setAttribute('stroke-dasharray', 2000); p.setAttribute('stroke-dashoffset', 2000); });
  const tL = T('b1~Identical') - 0.1;
  S.add(ch07Fade(links, 0, 1, { d: 0.01 }), tL);
  S.add(ch07Drive(0.9, k => linkPaths.forEach(p => p.setAttribute('stroke-dashoffset', (2000 * (1 - k)).toFixed(1))), 'power2.inOut'), tL);

  // ================================================================ b2: same rows, same bag
  S.add(ch07Fade(links, 1, 0, { d: 0.4 }), T('b2') - 0.1);
  const all = [...RA, ...RB];
  const tDrop = T('b2~same') - 0.1;
  all.forEach((p, i) => S.add(ch07Fade(p.hold, 0, 1, { d: 0.35, dy0: -26, dy1: 0, ease: 'power2.out' }), tDrop + 0.04 * (i % 5)));
  const ringFlash = (ps, at) => S.add(ch07Drive(0.7, k => ps.forEach(p => { p.ring.style.opacity = Math.sin(Math.PI * k).toFixed(3); })), at);
  ringFlash([RA[1], RB[4]], T('b2~row') + 0.15);
  ringFlash([RA[4], RB[1]], T('b2~wherever') + 0.3);
  // the bins
  const binX = [(AX[0] + AX[4]) / 2, (BX[0] + BX[4]) / 2], BY0 = 700, BY1 = 880, BWd = 420;
  const bins = binX.map(cx => {
    const g = S.g();
    S.path({ d: `M${cx - BWd / 2},${BY0} L${cx - BWd / 2 + 30},${BY1} H${cx + BWd / 2 - 30} L${cx + BWd / 2},${BY0}`, stroke: 'muted', sw: 4, fill: '#121a2e' }, g);
    S.text('a bag of vectors', { x: cx, y: BY1 + 36, size: 24, weight: 550, anchor: 'middle', color: 'faint' }, g);
    ch07Hide(g);
    return g;
  });
  bins.forEach(g => g.parentNode.insertBefore(g, RA[0].pill));    // behind the pills and strips, so the pile shows
  S.add(ch07Fade(bins, 0, 1, { d: 0.5 }), T('b2~become') - 0.1);
  // pile places, chosen by word, so both bins end up with the same pile
  const PILE = { the: [[-110, 108, -9], [70, 118, 7]], dog: [[-30, 76, 12]], bit: [[95, 70, -6]], man: [[-60, 138, 4]] };
  const pileOf = (rowWords, k) => { const w = rowWords[k], nth = rowWords.slice(0, k).filter(x => x === w).length; return PILE[w][nth]; };
  const tBag = T('b2~bag') - 0.2, tLift = T('b3~where') - 0.1;
  all.forEach(p => {
    const words = p.row === 'A' ? A : B, cx = binX[p.row === 'A' ? 0 : 1];
    const [px, py, rot] = pileOf(words, p.k);
    const dx = cx + px - p.x, dy = BY0 + py - (SY + SH / 2) - 10;
    // one painter per strip: out to the pile, then back under its pill
    const t0 = tBag + 0.06 * p.k, t1 = tLift + 0.04 * p.k, ox = p.x, oy = SY + SH / 2;
    const at = t => {
      const u = E('power2.in')(cl((t - t0) / 0.8)) * (1 - E('power3.inOut')(cl((t - t1) / 0.8)));
      p.inner.setAttribute('transform', u <= 0 ? '' : `translate(${(dx * u).toFixed(2)},${(dy * u).toFixed(2)}) rotate(${(rot * u).toFixed(2)} ${ox} ${oy})`);
    };
    S.add(ch07Drive(t1 + 0.8 - t0, k => at(t0 + k * (t1 + 0.8 - t0))), t0);
  });
  S.add(ch07Ignore(all.map(p => p.hold), tLift + 1.0 - tBag), tBag);
  // a grey '=' between the bins; later it glides up between the rows
  const eqG = S.g();
  const eq = S.text('=', { x: 960, y: (BY0 + BY1) / 2, size: 96, weight: 700, family: 'display', anchor: 'middle', color: 'muted' }, eqG);
  const ne = S.text('≠', { x: 960, y: (BY0 + BY1) / 2, size: 96, weight: 700, family: 'display', anchor: 'middle', color: 'helps' }, eqG);
  ch07Hide([eqG, ne]);
  S.add(ch07Fade(eqG, 0, 1, { d: 0.4 }), 'b2~answer-0.25');
  S.add(gsap.fromTo(eq, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.25, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%', immediateRender: false }), 'b2~answer');

  // ================================================================ b3: where it sits
  S.add(ch07Fade(bins, 1, 0, { d: 0.5 }), tLift + 0.2);
  S.add(gsap.fromTo(eqG, { y: 0 }, { y: PY - (BY0 + BY1) / 2, duration: 0.9, ease: 'power3.inOut', immediateRender: false }), tLift + 0.3);
  // teal badges 1-5 on every pill-and-strip pair
  const badges = all.map(p => {
    const g = S.g();
    const bx = p.x, by = PY - 52;                                 // just above its pill
    S.circle({ x: bx, y: by, r: 16, fill: '#0c2a26', stroke: 'helps', sw: 2.5 }, g);
    S.text(String(p.k + 1), { x: bx, y: by + 1, size: 20, weight: 800, family: 'mono', anchor: 'middle', color: 'helps' }, g);
    ch07Hide(g);
    return g;
  });
  const tBadge = T('b3~sits') + 0.1;
  [RA, RB].forEach((row, r) => row.forEach((p, k) => S.add(ch07Fade(badges[r * 5 + k], 0, 1, { d: 0.3, dy0: -10, dy1: 0 }), tBadge + 0.12 * k)));
  // two option cards, bottom right
  const card = (y, text) => {
    const g = S.g();
    S.card({ x: 1080, y, w: 680, h: 96, tone: 'helps', r: 18 }, g);
    S.text(text, { x: 1112, y: y + 48, size: 30, weight: 650, color: 'ink' }, g);
    ch07Hide(g);
    return g;
  };
  const opt1 = card(620, 'add it in at the start'), opt2 = card(746, 'apply it inside attention');
  S.add(ch07Fade(opt1, 0, 1, { d: 0.45, dy0: 14, dy1: 0 }), 'b3~added-0.1');
  S.add(ch07Fade(opt2, 0, 1, { d: 0.45, dy0: 14, dy1: 0 }), 'b3~inside-0.1');
  // a tiny glyph of tokens joined by arcs, on the second card
  const glyph = S.g();
  const GX = [1530, 1572, 1614, 1656], GY = 812;
  GX.forEach(x => S.circle({ x, y: GY, r: 7, fill: 'struct' }, glyph));
  [[0, 3], [1, 3], [2, 3]].forEach(([a, b]) => S.path({ d: `M${GX[a]},${GY - 9} Q${(GX[a] + GX[b]) / 2},${GY - 40 + 6 * a} ${GX[b]},${GY - 9}`, stroke: 'struct', strokeOpacity: 0.8, sw: 2 }, glyph));
  glyph.querySelectorAll('path').forEach(e => e.setAttribute('data-audit', 'ignore'));
  ch07Hide(glyph);
  S.add(ch07Fade(glyph, 0, 1, { d: 0.4 }), 'b3~look-0.1');
  const next = S.text('comes next', { x: 1760, y: 866, size: 22, weight: 600, anchor: 'end', color: 'muted' });
  ch07Hide(next);
  S.add(ch07Fade(next, 0, 1, { d: 0.4 }), 'b3~comes-0.1');

  // ================================================================ b4: ours does the second; no order alone
  const tick = S.g();
  // under the second card, at its left: its own row, clear of the card's text and the glyph
  S.path({ d: `M${1112},${862} l10,11 l19,-23`, stroke: 'helps', sw: 4 }, tick);
  S.text('70B example', { x: 1148, y: 866, size: 22, weight: 700, color: 'helps' }, tick);
  ch07Hide(tick);
  S.add(ch07Fade(tick, 0, 1, { d: 0.4 }), 'b4~Our-0.1');
  const tE = T('b4~Easy') - 0.1;
  S.add(ch07Fade([opt1, opt2, glyph, next, tick], 1, 0, { d: 0.5 }), tE);
  S.add(ch07Fade(eq, 1, 0, { d: 0.3 }), tE + 0.1);
  S.add(ch07Fade(ne, 0, 1, { d: 0.4 }), tE + 0.25);
  S.add(gsap.fromTo(ne, { scale: 0.8, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, ease: 'back.out(2.4)', transformOrigin: '50% 50%', immediateRender: false }), tE + 0.25);
  const tV = T('b4~vectors') - 0.1;
  S.add(ch07Fade(badges, 1, 0.3, { d: 0.5 }), tV);
  const close = S.text([{ t: 'vectors alone carry ' }, { t: 'no order', c: 'helps' }], { x: 960, y: 600, size: 46, weight: 700, family: 'display', anchor: 'middle', color: 'ink' });
  ch07Hide(close);
  S.add(ch07Fade(close, 0, 1, { d: 0.6, dy0: 12, dy1: 0 }), tV + 0.2);
});
