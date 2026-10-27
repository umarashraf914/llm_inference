/* ch08_s11 · why stack so many layers (fig 102)
   b1  header 'Depth, one layer at a time'; a ladder of 80 thin blue slabs builds upward on the right; a
       short passage of faint token pills on the left with 'it' highlighted. A depth line climbs the ladder;
       markers light at slabs 1, 10, 40, 80 ('after 1: its neighbours' ... 'after 80: the whole passage')
       and the reach (tinted pills, a blue bracket under each line) widens: two neighbours, a phrase, the
       sentence, both sentences.
   b2  the labels turn grey italic, tag 'intuition, not measurement'; a pointer with '?' over slab 40, 'nobody
       can read off what layer 40 knows'; then a chain of small up-arrows between slabs: 'builds on the one
       below'.
   b3  'cost: linear in depth, exact'; the slabs turn coral bottom to top as '× 1' runs to '× 80', 'weights
       read per token'; a coral bracket spans the ladder: 'next: in bytes'.
   Layout: passage x 110-760, lines y 430 / 510 / 590; ladder x 1100-1460, slab 1 at y 960, slab 80 at
   y 202 (9.6 apart); marker labels from x 1500. */
V.scene('ch08_s11', S => {
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = n => gsap.parseEase(n);
  const EIO = E('power2.inOut');
  const clock = (a, b, fn) => S.add(ch08Drive(b - a, k => fn(a + k * (b - a))), a);
  const whole = fn => { fn(0); clock(0, S.duration, fn); };
  const fade = (els, a, b, at, d = 0.45, stagger = 0) => S.add(ch08Fade(els, a, b, { d, stagger }), at);
  const STRUCT = S.tone('struct'), BYTES = S.tone('bytes');

  const hd = S.text('Depth, one layer at a time', { x: 960, y: 130, size: 46, weight: 700, family: 'display', anchor: 'middle', color: 'ink' });
  ch08Hide(hd);
  fade(hd, 0, 1, 0.3, 0.5);
  fade(hd, 1, 0, T('b2') + 0.2, 0.5);

  // ================================================================ the ladder
  const LX = 1100, LW = 360, SY = k => 960 - (k - 1) * 9.6, TH = 6;
  const ladder = S.g();
  ladder.setAttribute('data-audit', 'ignore');
  const slabs = Array.from({ length: 80 }, (_, i) => {
    const y = SY(i + 1) - TH / 2;
    const b = S.rect({ x: LX, y, w: LW, h: TH, r: 2, fill: 'struct', fillOpacity: 0.55 }, ladder);
    const c = S.rect({ x: LX, y, w: LW, h: TH, r: 2, fill: 'bytes', opacity: 0 }, ladder);
    return { b, c };
  });
  const tBuild = 0.5, tCoral = T('b3~eighty#2') - 0.1, coralD = 2.0;
  whole(t => slabs.forEach((s, i) => {
    const o = cl((t - (tBuild + 0.014 * i)) / 0.2);
    s.b.setAttribute('opacity', o.toFixed(3));
    s.c.setAttribute('opacity', (0.9 * cl((t - (tCoral + coralD * i / 80)) / 0.15)).toFixed(3));
  }));
  // the depth line that climbs to each marker
  const MK = [[1, 'b1~one', 'its neighbours'], [10, 'b1~ten', 'its phrase'], [40, 'b1~forty', 'its sentence'], [80, 'b1~eighty', 'the whole passage']];
  const tM = MK.map(m => T(m[1]) - 0.1);
  const depth = S.rect({ x: LX - 8, y: SY(1) - 2, w: LW + 16, h: 4, r: 2, fill: 'white', opacity: 0 }, ladder);
  whole(t => {
    let k = 1;
    for (let i = 0; i < 4; i++) if (t > tM[i]) k = i === 0 ? 1 : lerp(MK[i - 1][0], MK[i][0], EIO(cl((t - tM[i]) / 0.5)));
    depth.setAttribute('y', (SY(k) - 2).toFixed(1));
    const on = cl((t - tM[0] + 0.2) / 0.3) * (1 - cl((t - T('b2') - 0.3) / 0.5));
    depth.setAttribute('opacity', (0.85 * on).toFixed(3));
  });
  // markers: a tick and a label for slabs 1, 10, 40, 80; then grey italic copies
  const marks = MK.map(([k, cue, what], i) => {
    const g = S.g();
    S.path({ d: `M${LX + LW + 6},${SY(k)} H${LX + LW + 28}`, stroke: 'ink', sw: 2.5 }, g);
    const lab = S.text([{ t: `after ${k}: `, c: 'muted' }, { t: what, c: 'ink' }], { x: LX + LW + 40, y: SY(k), size: 26, weight: 650 }, g);
    const it = S.text(`after ${k}: ${what}`, { x: LX + LW + 40, y: SY(k), size: 26, weight: 550, color: 'muted' }, g);
    it.setAttribute('font-style', 'italic');
    ch08Hide([g, it]);
    fade(g, 0, 1, tM[i], 0.35);
    Object.assign(g, { lab, it });
    return g;
  });
  const tGrey = T('b2~intuition') - 0.1;
  marks.forEach(m => { fade(m.lab, 1, 0, tGrey, 0.4); fade(m.it, 0, 1, tGrey, 0.4); });
  const tag = S.pill('intuition, not measurement', { x: LX + LW + 40, y: 150, tone: 'neutral', size: 24, h: 46, anchor: 'start' });
  ch08Hide(tag);
  fade(tag, 0, 1, tGrey + 0.2, 0.4);

  // ================================================================ the passage
  const LINES = [['The', 'old', 'cat', 'came', 'in', 'late.'], ['Wet', 'and', 'cold,', 'it', 'sat', 'down'], ['by', 'the', 'fire', 'to', 'sleep.']];
  const PY = [430, 510, 590], PX0 = 110, FS = 30, PH = 52, PADX = 14, GAPX = 12;
  const toks = [];
  LINES.forEach((ws, li) => {
    let x = PX0;
    ws.forEach(w => {
      const tw = S.measure(w, { size: FS, weight: 600, case: 'keep' }) + PADX * 2;
      const g = S.g();
      const hot = w === 'it';
      S.rect({ x, y: PY[li] - PH / 2, w: tw, h: PH, r: 12, fill: '#0f1730', stroke: hot ? 'struct' : 'white', strokeOpacity: hot ? 0.9 : 0.14, sw: hot ? 2.5 : 1.5 }, g);
      const tint = S.rect({ x, y: PY[li] - PH / 2, w: tw, h: PH, r: 12, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.7, sw: 2, opacity: 0 }, g);
      if (hot) S.rect({ x, y: PY[li] - PH / 2, w: tw, h: PH, r: 12, fill: 'url(#solid-struct)', opacity: 0.85 }, g);
      S.text(w, { x: x + tw / 2, y: PY[li] + 1, size: FS, weight: hot ? 750 : 600, anchor: 'middle', color: hot ? '#0a0f1e' : 'muted', case: 'keep' }, g);
      toks.push({ g, tint, li, l: x, r: x + tw, hot });
      x += tw + GAPX;
    });
  });
  const pass = toks.map(t => t.g);
  ch08Hide(pass);
  fade(pass, 0, 1, 0.9, 0.5, 0.03);
  const IT = toks.findIndex(t => t.hot);
  // reach sets (flat indices): neighbours, a phrase, the sentence, the passage
  const REACH = [[IT - 1, IT + 1], [IT - 2, IT + 2], [6, 16], [0, 16]];
  const inReach = (i, s) => i !== IT && i >= REACH[s][0] && i <= REACH[s][1];
  whole(t => toks.forEach((tk, i) => {
    let o = 0;
    for (let s = 0; s < 4; s++) if (inReach(i, s)) o = Math.max(o, cl((t - tM[s] - 0.1) / 0.4));
    tk.tint.setAttribute('opacity', (0.9 * o).toFixed(3));
  }));
  // a bracket under each line's reached tokens, one set per stage, cross-fading
  REACH.forEach((_, s) => {
    const g = S.g();
    [0, 1, 2].forEach(li => {
      const on = toks.filter((tk, i) => tk.li === li && (inReach(i, s) || i === IT));
      if (!on.length || (on.length === 1 && on[0].hot)) return;
      const x1 = Math.min(...on.map(o => o.l)), x2 = Math.max(...on.map(o => o.r)), y = PY[li] + PH / 2 + 8;
      S.path({ d: `M${x1},${y - 6} V${y} H${x2} V${y - 6}`, stroke: 'struct', sw: 2.5 }, g);
    });
    g.setAttribute('data-audit', 'ignore');
    ch08Hide(g);
    fade(g, 0, 1, tM[s] + 0.1, 0.35);
    if (s < 3) fade(g, 1, 0, tM[s + 1] + 0.1, 0.3);
    else fade(g, 1, 0.5, T('b3') - 0.1, 0.4);
  });

  // ================================================================ b2: intuition; built on the one below
  const tPt = T('b2~What') - 0.1;
  const ptG = S.g();
  S.icon('ph:cursor-fill', { x: LX + 200, y: SY(40) + 22, size: 40, color: 'ink' }, ptG);
  S.text('?', { x: LX + 236, y: SY(40) - 6, size: 40, weight: 750, color: 'muted' }, ptG);
  const ptT = S.text('nobody can read off what layer 40 knows', { x: LX - 30, y: SY(40) + 90, size: 24, weight: 600, anchor: 'end', color: 'muted' });
  ch08Hide([ptG, ptT]);
  // the pointer settles over slab 40
  whole(t => { const k = E('power3.out')(cl((t - tPt) / 0.6)); ptG.setAttribute('transform', `translate(${lerp(-60, 0, k).toFixed(1)},${lerp(70, 0, k).toFixed(1)})`); });
  fade(ptG, 0, 1, tPt, 0.35);
  fade(ptT, 0, 1, tPt + 0.4, 0.4);
  marks.forEach(m => fade(m.it, 1, 0.6, tPt + 0.5, 0.4));
  const tBld = T('b2~builds') - 0.1;
  fade([ptG, ptT], 1, 0, tBld, 0.35);
  marks.forEach(m => fade(m.it, 0.6, 0.35, tBld, 0.4));
  // small up-arrows in every gap, drawn bottom to top, at the ladder's left
  const chev = S.g();
  const chevs = Array.from({ length: 79 }, (_, i) => S.path({ d: `M${LX - 30},${SY(i + 1) - 1.8} L${LX - 22},${SY(i + 1) - 7.8} L${LX - 14},${SY(i + 1) - 1.8}`, stroke: 'struct', sw: 2, opacity: 0 }, chev));
  chev.setAttribute('data-audit', 'ignore');
  whole(t => chevs.forEach((c, i) => c.setAttribute('opacity', (0.9 * cl((t - (tBld + 0.012 * i)) / 0.15)).toFixed(3))));
  const bLab = S.text('builds on the one below', { x: LX - 44, y: SY(70), size: 26, weight: 650, anchor: 'end', color: 'struct' });
  ch08Hide(bLab);
  fade(bLab, 0, 1, tBld + 0.4, 0.4);

  // ================================================================ b3: the cost is exact
  const tB3 = T('b3') - 0.1;
  fade([bLab, chev], 1, 0, tB3, 0.4);
  marks.forEach(m => fade(m.it, 0.35, 0.25, tB3, 0.4));
  fade(tag, 1, 0.4, tB3, 0.4);
  const cost = S.text('cost: linear in depth, exact', { x: 110, y: 760, size: 34, weight: 700, color: 'ink' });
  ch08Hide(cost);
  fade(cost, 0, 1, T('b3~linear') - 0.1, 0.4);
  const cnt = S.text('× 1', { x: 110, y: 860, size: 64, weight: 700, family: 'mono', color: 'bytes' });
  const cntL = S.text('weights read per token', { x: 110, y: 920, size: 26, weight: 600, color: 'muted' });
  ch08Hide([cnt, cntL]);
  fade([cnt, cntL], 0, 1, tCoral - 0.1, 0.35);
  whole(t => { cnt.textContent = `× ${Math.max(1, Math.min(80, 1 + Math.floor(80 * cl((t - tCoral) / coralD))))}`; });
  // the coral bracket over the whole ladder: next, in bytes
  const brk = S.g();
  S.path({ d: `M${LX - 20},${SY(1) + 8} H${LX - 36} V${SY(80) - 8} H${LX - 20}`, stroke: 'bytes', sw: 3 }, brk);
  const nbW = S.measure('next: in bytes', { size: 26, weight: 600 }) + 44;
  S.pill('next: in bytes', { x: LX - 52 - nbW, y: (SY(1) + SY(80)) / 2, tone: 'bytes', size: 26, h: 48, anchor: 'start' }, brk);
  ch08Hide(brk);
  fade(brk, 0, 1, T('b3~byte') - 0.15, 0.4);
  void STRUCT; void BYTES;
});
