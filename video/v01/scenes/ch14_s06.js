/* ch14_s06 · could the cache keep layer one? (fig 45)
   Checked (Llama 3 70B layer, width 8,192, 8 KV heads × 128, FFN 28,672): W_K = W_V = 8,192 × 1,024 = 8.4 M;
   the layer's weights W_Q + W_K + W_V + W_O + 3 FFN = 855.6 M, so K and V are 1.96% ≈ 2%; layer 1 is 1/80 = 1.25%
   of the prefill work, so the saving is 1.25% × 1.96% = 0.0245% ≈ 0.025% (a fortieth of one percent); its cache is
   4 KB of the 320 KB per token.
   b1  header; the strip t1 XX t3 t4 t5 with three-cell stacks (bottom = layer 1): t1 teal, XX grey and cracked,
       t3-t5 grey above a '?' that turns into teal ticks on 'yes'; 'layers 2–80: invalid', 'layer 1: still valid'.
   b2  the 80-segment bar of prefill work: layer 1 teal 1.25%, layers 2-80 amber 98.75% recomputed; 'cache bytes:
       4 KB of 320 KB'.
   b3  segment 1 opens: attention and feed-forward run anyway, K and V multiplications skipped; W_K + W_V against
       the layer's 855.6 M weights, ≈ 2%; it closes: segment 1 amber but a teal hairline, 'saved: ≈ 0.025%'.
   b4  a crack sweeps from XX through every remaining cell; 'recompute from here'; the bottom cells glow, then go
       grey; everything but the bar dims; the two-line caption.
   Layout: pills y 262 at x 760 + 110 j; cells y 318 / 348 / 378 (bottom = layer 1), 70 × 24; status words end at
   x 690; bar x 240-1680 (18 px per layer), y 535-585; zoom panel x 240-1680, y 680-970. */
V.scene('ch14_s06', S => {
  const K = libKit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1;
  const TEAL = S.tone('helps'), GREY = '#3a4560';
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };

  const hdr = S.text('Keep layer 1, drop the rest?', { x: 960, y: 128, size: 44, weight: 750, anchor: 'middle', color: 'ink' });
  rise(hdr, 0.4);

  // ================================================================ b1: the strip and its cache stacks
  const top = S.g();
  const PX = j => 760 + 110 * j, CY = [378, 348, 318];   // cell rows: layer 1 at the bottom
  const toks = ['t1', 'XX', 't3', 't4', 't5'].map((s, j) => {
    const g = S.g(null, top);
    const tk = libToken(S, { text: s, x: PX(j), y: 262, size: 26, w: 80, state: j === 1 ? 'changed' : 'token' }, g);
    K.track(g, [K.K(0.6 + 0.07 * j, { y: -16, o: 0 }), K.K(1.0 + 0.07 * j, { y: 0, o: 1, e: 'power3.out' })]);
    return tk;
  });
  const xxGlow = S.rect({ x: PX(1) - 52, y: 236, w: 104, h: 52, r: 18, fill: 'url(#pglow-violet)', opacity: 0 }, top);
  xxGlow.setAttribute('data-audit', 'ignore');
  top.insertBefore(xxGlow, top.firstChild);
  pulse(xxGlow, T('b1~changes') - 0.2, 1, 0.8);
  const tYes = T('b1~yes') - 0.1, tSweep = T('b4~prefix') - 0.1, tStill = T('b4~still') - 0.1, tNot = T('b4~not') - 0.1;
  const sweepAt = j => tSweep + 0.15 * (j - 1);
  const cells = [];
  const crackD = (x, y) => `M${x - 26},${y - 2} L${x - 12},${y + 5} L${x},${y - 5} L${x + 12},${y + 4} L${x + 26},${y - 3}`;
  for (let j = 0; j < 5; j++) for (let r = 0; r < 3; r++) {
    const x = PX(j), y = CY[r];
    const g = S.g(null, top);
    const box = S.rect({ x: x - 35, y: y - 12, w: 70, h: 24, r: 5, fill: GREY, stroke: '#ffffff', strokeOpacity: 0.12, sw: 1 }, g);
    const crack = S.path({ d: crackD(x, y), stroke: '#0a0f1e', sw: 2 }, g);
    crack.setAttribute('data-audit', 'ignore');
    const c = { j, r, box, crack };
    if (j >= 2 && r === 0) {
      c.q = S.text('?', { x, y: y + 1, size: 22, weight: 800, anchor: 'middle', color: 'ink' }, g);
      c.tick = S.path({ d: `M${x - 8},${y} L${x - 2},${y + 6} L${x + 9},${y - 6}`, stroke: '#0a0f1e', sw: 3 }, g);
      c.tick.setAttribute('data-audit', 'ignore');
    }
    K.track(g, [K.K(1.2 + 0.05 * j + 0.04 * r, { o: 0 }), K.K(1.5 + 0.05 * j + 0.04 * r, { o: 1 })]);
    cells.push(c);
  }
  whole(t => cells.forEach(c => {
    // teal: t1 always; t3-t5's bottom cell from 'yes' until the b4 sweep, and again for a moment on 'still valid'
    let teal = 0, cracked = 1;
    if (c.j === 0) { teal = 1; cracked = 0; }
    else if (c.j >= 2 && c.r === 0) {
      const on = cl((t - tYes) / 0.3) * (1 - cl((t - sweepAt(c.j)) / 0.25));
      const flash = cl((t - tStill) / 0.3) * (1 - cl((t - tNot) / 0.4));
      teal = Math.max(on, flash);
      cracked = cl((t - sweepAt(c.j)) / 0.25) * (1 - flash);
    }
    c.box.setAttribute('fill', teal > 0.5 ? TEAL : GREY);
    c.box.setAttribute('opacity', (teal > 0.5 ? 0.9 : 1).toFixed(2));
    c.crack.setAttribute('opacity', cracked > 0.5 ? 0.9 : 0);
    if (c.q) { c.q.setAttribute('opacity', t < tYes && t > 1.5 ? 1 : 0); c.tick.setAttribute('opacity', teal > 0.5 ? 1 : 0); }
  }));
  const lInv = S.text('layers 2–80: invalid', { x: 690, y: 334, size: 24, weight: 700, anchor: 'end', color: 'muted' }, top);
  const lVal = S.text('layer 1: still valid', { x: 690, y: 379, size: 24, weight: 700, anchor: 'end', color: 'helps' }, top);
  const sch = ch14Tag(S, 'schematic: 3 cells for 80 layers', { x: 1450, y: 348, size: 22 }, top);
  rise(lInv, T('b1~keep') - 0.1, 0, 0.35);
  rise(lVal, tYes + 0.2, 0, 0.35);
  rise(sch, 1.6, 0, 0.4);
  fade([lInv, lVal, sch], 1, 0.4, tB2, 0.4);

  // ================================================================ b2: layer 1 is a rounding error
  const BX = 240, SEG = 18, BY = 535;
  const bar = S.g();
  const segs = Array.from({ length: 80 }, (_, i) => S.rect({ x: BX + SEG * i + 0.5, y: BY, w: SEG - 1, h: 50, r: 2, fill: GREY }, bar));
  const hair = S.rect({ x: BX + 0.5, y: BY, w: 1.6, h: 50, fill: TEAL, opacity: 0 }, bar);
  const tBar = tB2 + 0.3, t125 = T('b2~one#2') - 0.1, t9875 = T('b2~ninety') - 0.1, tClose = T('b3~fortieth') - 0.1;
  whole(t => {
    segs.forEach((s, i) => {
      const on = cl((t - tBar - 0.006 * i) / 0.2);
      let fill = GREY;
      if (i === 0) fill = t > tClose + 0.6 ? S.tone('compute') : t > t125 ? TEAL : GREY;
      else if (t > t9875 + 0.012 * i) fill = S.tone('compute');
      s.setAttribute('fill', fill);
      s.setAttribute('opacity', (on * (i === 0 || t < t9875 ? 1 : 0.85)).toFixed(3));
    });
    hair.setAttribute('opacity', t > tClose + 0.6 ? 1 : 0);
  });
  bar.setAttribute('data-audit', 'ignore');
  const barL = S.text('prefill work, by layer', { x: 960, y: 618, size: 26, weight: 650, anchor: 'middle', color: 'muted' });
  rise(barL, tBar + 0.4, 10);
  const l1 = S.text('layer 1: 1.25%', { x: BX, y: 504, size: 28, weight: 800, color: 'helps' });
  rise(l1, t125 + 0.3, 10);
  const l2 = S.text('layers 2–80: 98.75%, recomputed', { x: BX + 80 * SEG, y: 504, size: 28, weight: 800, anchor: 'end', color: 'compute' });
  rise(l2, t9875 + 0.6, 10);
  const bytes = S.text('cache bytes: 4 KB of 320 KB', { x: 960, y: 666, size: 26, weight: 700, anchor: 'middle', color: 'bytes' });
  rise(bytes, t9875 + 1.2, 10);
  fade(bytes, 1, 0, tB3, 0.35);

  // ================================================================ b3: the saving is smaller still
  const tOpen = tB3 + 0.4, tKV = T('b3~key') - 0.1;
  const zoom = S.g();
  const zf = S.rect({ x: BX, y: 690, w: 1440, h: 280, r: 18, fill: '#0e1528', stroke: TEAL, sw: 2 }, zoom);
  const zl = S.path({ d: `M${BX},${BY + 50} L${BX},690 M${BX + SEG},${BY + 50} L${BX + 1440},690`, stroke: TEAL, strokeOpacity: 0.5, sw: 1.5, dash: '5 5' }, zoom);
  zl.setAttribute('data-audit', 'ignore');
  const zc = S.g(null, zoom);
  const zbox = (x, w, txt, tone) => {
    const g = S.g(null, zc);
    S.rect({ x, y: 742, w, h: 64, r: 12, fill: `url(#card-${tone})`, stroke: tone, sw: 2.5 }, g);
    S.text(txt, { x: x + w / 2, y: 775, size: 26, weight: 750, anchor: 'middle', color: tone }, g);
    return g;
  };
  const amb = S.g(null, zc);
  amb.appendChild(zbox(300, 260, 'attention', 'compute'));
  amb.appendChild(zbox(590, 280, 'feed-forward', 'compute'));
  const brk = S.path({ d: 'M300,730 v-10 H870 v10', stroke: 'compute', sw: 2.5 }, amb);
  S.text('runs anyway', { x: 585, y: 706, size: 24, weight: 750, anchor: 'middle', color: 'compute' }, amb);
  const kvBox = zbox(920, 380, 'K and V multiplications', 'helps');
  const skip = ch14Tag(S, 'skipped', { x: 1110, y: 838, size: 22 }, zc);
  void brk; void skip;
  // the K and V weights against the whole layer, to scale (1,380 px = 855.6 M)
  const wv = S.g(null, zoom);
  S.text(V.subs('W_K 8.4 M + W_V 8.4 M', 26, { c: 'helps' }), { x: 270, y: 880, size: 26, weight: 750 }, wv);
  S.text('855.6 M weights in the layer', { x: 1650, y: 880, size: 24, weight: 650, anchor: 'end', color: 'muted' }, wv);
  S.rect({ x: 270, y: 905, w: 1380, h: 30, r: 6, fill: GREY }, wv);
  S.rect({ x: 270, y: 905, w: 27, h: 30, r: 3, fill: TEAL }, wv);
  S.text('≈ 2%', { x: 306, y: 921, size: 22, weight: 800, color: 'helps' }, wv);
  hide(wv);
  fade(wv, 0, 1, tKV + 0.4, 0.4);
  fade(amb, 1, 0.35, tKV, 0.4);
  // open out of segment 1, close back into it
  K.track(zoom, [K.K(tOpen, { s: 0.02, o: 0 }), K.K(tOpen + 0.6, { s: 1, o: 1, e: 'power3.out' }), K.K(tClose, { s: 1, o: 1 }), K.K(tClose + 0.6, { s: 0.02, o: 0, e: 'power2.in' })], BX + 9, BY + 25);
  K.ignore(zoom, tOpen - 0.05, 0.7);
  K.ignore(zoom, tClose - 0.05, 0.7);
  S.add(ch14Retext(l1, 'layer 1: 1.25%', 'saved: ≈ 0.025%', 0.4), tClose + 0.5);
  const only = ch14Tag(S, 'weight arithmetic only', { x: 610, y: 504, size: 22, anchor: 'start' });
  rise(only, T('b3~arithmetic') - 0.1, 0, 0.35);
  void zf; void kvBox;

  // ================================================================ b4: the prefix rule stays
  // the crack sweeps from XX through every remaining cell (the painter above); amber outlines on XX … t5
  const rec = S.g();
  for (let j = 1; j < 5; j++) { const r = S.rect({ x: PX(j) - 44, y: 238, w: 88, h: 48, r: 14, stroke: 'compute', sw: 2.5 }, rec); rise(r, sweepAt(j), 0, 0.25); }
  const recL = S.text('recompute from here', { x: PX(1) - 44, y: 208, size: 24, weight: 750, color: 'compute' }, rec);
  rise(recL, tSweep + 0.6, 0, 0.35);
  const tRight = T('b4~right') - 0.1;
  fade(lInv, 0.4, 1, tRight, 0.3);
  fade(lVal, 0.4, 1, tStill, 0.3);
  fade(lVal, 1, 0.4, tNot + 0.2, 0.4);
  // everything but the bar dims; the caption
  const tDim = tNot + 0.5;
  fade([top, rec, hdr], 1, 0.35, tDim, 0.5);
  fade([barL, l1, l2, only], 1, 0.6, tDim, 0.5);
  const c1 = S.text('observation right, conclusion unchanged', { x: 960, y: 790, size: 40, weight: 800, anchor: 'middle', color: 'ink' });
  const c2 = S.text('one layer in 80: not worth the bookkeeping', { x: 960, y: 846, size: 30, weight: 650, anchor: 'middle', color: 'muted' });
  rise(c1, tDim + 0.2); rise(c2, tDim + 0.5);
  void toks; void tB2; void lerp; void EIO;
});
