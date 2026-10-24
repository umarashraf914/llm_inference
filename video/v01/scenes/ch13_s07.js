/* ch13_s07 · where the eighty comes from (fig 138)
   Top band: ch13Formula, words mode; only '2' (with its own K and V tiles) and '× layers' land here.
   Lower left: chapter 8's natural picture in dashed grey — embedding → W_Q, W_K, W_V → Q, K, V pills carried
   unchanged up a column of dashed layer slabs — struck through and dimmed.
   Lower right: two stacks of eighty slabs (slab j at y 860 - 6 j), 'earlier token' (dimmer, x 900-1160) and
   'new token' (x 1360-1620); each slab keeps its own K and V tile pair, a slightly different blue per layer.
   b1  'cache per token =' and blank slots; '2' with K and V tiles, 'one key, one value'; '× layers'.
   b2  the natural picture; 'no layers term' (and '× layers' flickers grey); it is struck and dims; the two
       stacks draw upward, each slab growing its K and V; '× 80'.
   b3  a query from the new token's layer 40 lights the earlier token's layer-40 K tile; its layer-1 K tile is
       crossed, 'wrong layer'; '× layers' glows coral with '80' beneath; a grey ghost stack collapses to one
       slab, '÷ 80'; takeaway 'every layer keeps its own'. */
V.scene('ch13_s07', S => {
  const K = libKit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const { fx } = S;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1;

  // ================================================================ b1: the formula, factor by factor
  const f = ch13Formula(S, { landed: [], hidden: true });
  S.add(f.drawOn(), T('b1') - 0.1);
  const tTwo = T('b1~two') - 0.2;
  S.add(f.land(0, { label: 'one key, one value' }), tTwo);
  const x0 = f.termX(0, 'words'), kvT = S.g();
  S.rect({ x: x0 - 38, y: f.valueY - 14, w: 34, h: 28, r: 6, fill: 'url(#solid-struct)' }, kvT);
  S.text('K', { x: x0 - 21, y: f.valueY + 1, size: 20, weight: 800, anchor: 'middle', color: '#0a0f1e' }, kvT);
  S.rect({ x: x0 + 4, y: f.valueY - 14, w: 34, h: 28, r: 6, fill: '#1f3a68', stroke: 'struct', sw: 1.5 }, kvT);
  S.text('V', { x: x0 + 21, y: f.valueY + 1, size: 20, weight: 800, anchor: 'middle', color: 'struct' }, kvT);
  K.track(kvT, [K.K(tTwo + 0.2, { y: -10, o: 0 }), K.K(tTwo + 0.6, { y: 0, o: 1, e: 'back.out(2)' })]);
  S.add(f.land(1, { label: 'layers' }), T('b1~layers') - 0.2);

  // ================================================================ b2: the natural picture, and why it is wrong
  const nat = S.g();
  const tNat = T('b2~natural') - 0.1;
  const NX = 400;
  const natL = S.text('the natural picture', { x: NX, y: 378, size: 22, weight: 650, anchor: 'middle', color: 'muted' }, nat);
  hide(natL);
  fade(natL, 0, 1, tNat - 0.1, 0.4);
  const col = S.g(null, nat);
  for (let j = 0; j < 5; j++) S.rect({ x: NX - 130, y: 604 - 48 * j, w: 260, h: 34, r: 8, stroke: 'muted', strokeOpacity: 0.6, sw: 2, dash: '7 6' }, col);
  const box = (y, text) => {
    const g = S.g(null, nat);
    S.rect({ x: NX - 130, y: y - 23, w: 260, h: 46, r: 10, stroke: 'muted', strokeOpacity: 0.7, sw: 2, dash: '7 6' }, g);
    S.text(text, { x: NX, y: y + 1, size: 24, weight: 650, anchor: 'middle', color: 'muted' }, g);
    return g;
  };
  const wq = box(780, 'W_Q, W_K, W_V'), emb = box(856, 'embedding');
  const arr = S.path({ d: `M${NX},832 V806 M${NX - 7},814 L${NX},805 L${NX + 7},814 M${NX},756 V734 M${NX - 7},742 L${NX},733 L${NX + 7},742`, stroke: 'muted', sw: 2.5 }, nat);
  [col, wq, emb, arr].forEach((e, i) => { hide(e); fade(e, 0, 1, tNat + 0.12 * i, 0.4); });
  // Q, K, V made once and carried up the column unchanged
  const qkv = ['Q', 'K', 'V'].map((s, i) => {
    const g = S.g(null, nat);
    libToken(S, { text: s, x: NX - 70 + 70 * i, y: 0, size: 24, w: 52, state: i ? 'token' : 'new' }, g);
    return g;
  });
  const tUp = T('b2~carried') - 0.4;
  whole(t => {
    const y = lerp(700, 430, EIO(cl((t - tUp) / 1.4)));
    qkv.forEach(g => g.setAttribute('transform', `translate(0,${y.toFixed(1)})`));
  });
  qkv.forEach((g, i) => { hide(g); fade(g, 0, 1, T('b2~query') - 0.1 + 0.25 * i, 0.3); });
  const tNo = T('b2~no') - 0.1;
  const noL = S.pill('no layers term', { x: 710, y: 560, tone: 'helps', size: 26, h: 46 }, nat);
  hide(noL);
  fade(noL, 0, 1, tNo, 0.35);
  S.add(f.tint(1, 'muted', { d: 0.25 }), tNo + 0.1);
  S.add(f.tint(1, null, { d: 0.25 }), tNo + 0.45);
  S.add(f.tint(1, 'muted', { d: 0.2 }), tNo + 0.75);
  S.add(f.tint(1, null, { d: 0.3 }), T('b2~every') - 0.1);
  // crossed out and dimmed
  const tEvery = T('b2~every') - 0.1;
  const x1 = S.path({ d: `M${NX - 150},400 L${NX + 150},880`, stroke: 'muted', sw: 4 }), x2 = S.path({ d: `M${NX + 150},400 L${NX - 150},880`, stroke: 'muted', sw: 4 });
  [x1, x2].forEach((p, i) => { p.setAttribute('data-audit', 'ignore'); K.draw(p, 580, tEvery + 0.15 * i, 0.35); });
  fade(noL, 1, 0, tEvery, 0.3);
  fade([nat, x1, x2], 1, 0.3, tEvery + 0.5, 0.5);

  // ---------------------------------------------------------------- the two stacks of eighty
  const SY = j => 860 - 6 * j;   // slab j, 1 … 80
  const tMakes = T('b2~makes') - 0.1;
  const shade = j => { const k = (j * 37 % 80) / 80; return [`hsl(216, 95%, ${62 + 10 * k}%)`, `hsl(218, 60%, ${30 + 8 * k}%)`]; };
  const stack = (x, name, op, delay) => {
    const g = S.g();
    const slabs = [];
    for (let j = 1; j <= 80; j++) {
      const sg = S.g(null, g);
      S.rect({ x, y: SY(j) - 1.5, w: 198, h: 3, r: 1.5, fill: 'struct', opacity: 0.3 }, sg);
      const [ck, cv] = shade(j);
      const kt = S.rect({ x: x + 206, y: SY(j) - 2.5, w: 22, h: 5, r: 1.5, fill: ck }, sg);
      const vt = S.rect({ x: x + 232, y: SY(j) - 2.5, w: 22, h: 5, r: 1.5, fill: cv, stroke: ck, sw: 0.6 }, sg);
      const at = tMakes + delay + 0.016 * j;
      hide(sg);
      fade(sg, 0, op, at, 0.15);
      slabs.push({ kt, vt });
    }
    const lab = S.text(name, { x: x + 127, y: 892, size: 26, weight: 700, anchor: 'middle', color: op < 1 ? 'muted' : 'struct' }, g);
    hide(lab);
    fade(lab, 0, 1, tMakes + delay + 0.3, 0.35);
    g.setAttribute('data-audit', 'ignore');
    return { g, slabs, lab };
  };
  const early = stack(900, 'earlier token', 0.55, 0), fresh = stack(1360, 'new token', 1, 0.25);
  // the audit should still check the stack names
  [early.lab, fresh.lab].forEach(l => { const g = S.g(); g.appendChild(l); });
  const lay = S.g();
  S.text('layer 80', { x: 1260, y: SY(80), size: 20, weight: 650, anchor: 'middle', color: 'muted' }, lay);
  S.text('layer 1', { x: 1260, y: SY(1), size: 20, weight: 650, anchor: 'middle', color: 'muted' }, lay);
  hide(lay);
  fade(lay, 0, 1, tMakes + 1.4, 0.35);
  const x80 = S.text('× 80', { x: 1260, y: 470, size: 44, weight: 800, anchor: 'middle', color: 'ink' });
  hide(x80);
  S.add(K.drive(0.4, k => { setO(x80, k); x80.setAttribute('transform', `translate(0,${(12 * (1 - E('back.out(2)')(k))).toFixed(1)})`); }), T('b2~weights') - 0.1);

  // ================================================================ b3: layer forty needs layer forty
  const tL40 = T('b3~layer') - 0.1, y40 = SY(40);
  const q = S.path({ d: `M1352,${y40} H1140 M1150,${y40 - 8} L1138,${y40} L1150,${y40 + 8}`, stroke: 'white', sw: 3 });
  q.setAttribute('data-audit', 'ignore');
  K.draw(q, 260, tL40, 0.5);
  const l40 = S.text('layer 40', { x: 1260, y: y40 - 22, size: 22, weight: 700, anchor: 'middle', color: 'ink' });
  hide(l40);
  fade(l40, 0, 1, tL40 + 0.2, 0.3);
  const hit = S.rect({ x: 900 + 202, y: y40 - 6, w: 30, h: 12, r: 3, stroke: 'white', sw: 2 });
  const hitGlow = S.rect({ x: 900 + 190, y: y40 - 16, w: 54, h: 32, r: 8, fill: 'url(#pglow-struct)', opacity: 0 });
  [hit, hitGlow].forEach(e => e.setAttribute('data-audit', 'ignore'));
  hide(hit);
  fade(hit, 0, 1, tL40 + 0.45, 0.2);
  pulse(hitGlow, tL40 + 0.45, 1, 0.8);
  // not its layer-one key
  const tOne = T('b3~layerone') - 0.1, k1 = early.slabs[0].kt;
  whole(t => { const g = cl((t - tOne) / 0.3); k1.setAttribute('fill', g > 0.5 ? S.tone('faint') : shade(1)[0]); });
  const cross = S.path({ d: `M${1117 - 7},${SY(1) - 7} L${1117 + 7},${SY(1) + 7} M${1117 + 7},${SY(1) - 7} L${1117 - 7},${SY(1) + 7}`, stroke: 'bytes', sw: 2.5 });
  cross.setAttribute('data-audit', 'ignore');
  K.draw(cross, 44, tOne + 0.15, 0.25);
  const wrong = S.text('wrong layer', { x: 888, y: SY(1), size: 22, weight: 700, anchor: 'end', color: 'muted' });
  hide(wrong);
  fade(wrong, 0, 1, tOne + 0.2, 0.3);
  // made once: eighty times smaller
  const tSm = T('b3~eighty#2') - 0.1;
  S.add(f.glow(1, { tone: 'bytes' }), tSm);
  S.add(f.setValue(1, '80', { tone: 'bytes' }), tSm + 0.2);
  const ghost = S.rect({ x: 1352, y: SY(80) - 6, w: 270, h: 6 * 80 + 4, r: 6, fill: 'neutral', fillOpacity: 0.16, stroke: 'neutral', strokeOpacity: 0.6, sw: 2 });
  ghost.setAttribute('data-audit', 'ignore');
  whole(t => {
    const k = EIO(cl((t - tSm - 0.5) / 0.8)), h = lerp(6 * 80 + 4, 8, k);
    ghost.setAttribute('y', (SY(1) + 4 - h).toFixed(1));
    ghost.setAttribute('height', h.toFixed(1));
    setO(ghost, cl((t - tSm - 0.1) / 0.3));
  });
  const div = S.text('÷ 80', { x: 1634, y: SY(1), size: 30, weight: 800, color: 'muted' });
  hide(div);
  fade(div, 0, 1, tSm + 1.2, 0.35);
  const take = S.takeaway('every layer keeps its own', { tone: 'struct' });
  hide(take);
  fade(take, 0, 1, T('b3~much') - 0.1, 0.5);
  void tB2; void tB3; void x1;
});
