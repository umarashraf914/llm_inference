/* ch14_s05 · why context-dependent keys are the point (fig 44)
   Two sentences, the same word in slot 3: 'the river bank' and 'the savings bank'. Same token, position and W_K;
   the layer-1 keys match; above layer 1 the inputs differ and the keys lean apart, more with height (schematic:
   8 bars for 80 layers, layer 1 at the bottom; tilt 2.2° per layer).
   b1  header; the two rows slide in; 'same token', 'same position: 3', 'same W_K'.
   b2  layer-1 bars teal, joined by '='; river → bank (blue) and savings → bank (violet) threads; each bank feeds
       its W_K; the stacks grow upward, tilting toward the water and the coin: 'leans toward water / money'.
   b3  'a later word', 'looking for water', probes: the river key answers, the savings key barely; 'illustrative';
       'blind to context': both stacks go grey and flat, 'context-free keys: useless'; then they snap back.
   b4  caption 'question and capability: one phenomenon'; the strip t1 XX t3 t4 t5 with cache cells, cracked from
       XX to the end: 'why the prefix rule exists'.
   Layout: rows y 360 / 700, slot centres x 200 / 380 / 560; W_K glyphs at x 700; stacks x 800-1040, layer 1 bar at
   y 440 (top) / 780 (bottom), 26 px pitch; icons x 1140; probe pill (1620, 520); strip y 900, cells y 950. */
V.scene('ch14_s05', S => {
  const K = libKit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1;
  const VIOLET = S.tone('violet');
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };

  const hdr = S.text('Same word, two sentences, two keys', { x: 960, y: 128, size: 44, weight: 750, anchor: 'middle', color: 'ink' });
  rise(hdr, 0.5);

  // ================================================================ b1: the two sentences
  const SX = [200, 380, 560], RY = [360, 700];
  const tBank = T('b1~bank') - 0.1;
  const rows = [['the', 'river', 'bank'], ['the', 'savings', 'bank']].map((ws, r) => ws.map((w, j) => {
    const g = S.g();
    libToken(S, { text: w, x: SX[j], y: RY[r], size: 30, w: 160, state: j === 2 ? 'new' : 'token' }, g);
    const at = tBank + 0.3 + (r ? T('b1~savings') - tBank - 0.4 : 0) + 0.08 * j;
    K.track(g, [K.K(at, { x: -60, o: 0 }), K.K(at + 0.45, { x: 0, o: 1, e: 'power3.out' })]);
    return g;
  }));
  const sameTags = [['same token', 'b1~same#2'], ['same position: 3', 'b1~same#3'], ['same W_K', 'b1~same#4']].map(([s, cue], i) => {
    const g = ch14Tag(S, s, { x: [210, 450, 700][i], y: 530, size: 24 });
    rise(g, T(cue) - 0.1, 10, 0.35);
    return g;
  });
  fade(sameTags, 1, 0, T('b2~match') + 0.2, 0.4);

  // ---------------------------------------------------------------- W_K glyphs and the stacks
  const WX = 700, BX = 800, BW = 240, PIT = 26, base = r => (r ? 780 : 440);
  const Ws = RY.map((y, r) => {
    const w = ch14Matrix(S, { x: WX, y, size: 76, name: null, seed: 3, locked: true, lockR: 15 });
    rise(w, tBank + 0.6 + 0.4 * r, 10);
    return w;
  });
  const wNames = RY.map(y => { const t = ch14W(S, 'K', { x: WX, y: y + 62, size: 30 }); rise(t, tBank + 0.8, 8); return t; });
  // bars: layer 1 at the bottom of each stack; 7 above it lean (top stack up toward the water, bottom down to the coin)
  const tMatch = T('b2~match') - 0.4, tLean = T('b2~leans') - 0.1, tBlind = T('b3~blind') - 0.1, tBack = T('b3~useless') + 0.2;
  const stacks = [0, 1].map(r => {
    const g = S.g();
    const bars = Array.from({ length: 8 }, (_, i) => {
      const y = base(r) - PIT * i;
      const b = S.rect({ x: BX, y: y - 9, w: BW, h: 18, r: 5, fill: r ? VIOLET : 'struct' }, g);
      b.__y = y;
      return b;
    });
    g.bars = bars;
    return g;
  });
  whole(t => {
    // flat and grey while 'blind to context', snapping back after
    const blind = cl((t - tBlind) / 0.4) * (1 - cl((t - tBack) / 0.25));
    stacks.forEach((g, r) => g.bars.forEach((b, i) => {
      if (i === 0) {
        const k = EIO(cl((t - tMatch) / 0.4));
        b.setAttribute('width', (BW * k).toFixed(1));
        b.setAttribute('fill', S.tone(blind > 0.5 ? 'neutral' : 'helps'));
        b.setAttribute('opacity', k > 0 ? 1 : 0);
        return;
      }
      const k = E('power3.out')(cl((t - tLean - 0.12 * i) / 0.5));
      const ang = (r ? 1 : -1) * 2.2 * i * k * (1 - blind);
      b.setAttribute('width', (BW * cl(k * 1.4)).toFixed(1));
      b.setAttribute('transform', `rotate(${ang.toFixed(2)} ${BX} ${b.__y})`);
      b.setAttribute('fill', blind > 0.5 ? S.tone('neutral') : r ? VIOLET : S.tone('struct'));
      b.setAttribute('opacity', (k > 0 ? 0.55 + 0.4 * (i / 7) : 0).toFixed(3));
    }));
  });
  stacks.forEach(g => g.setAttribute('data-audit', 'ignore'));
  const eq = S.g();
  S.path({ d: `M${BX + BW + 10},${base(0)} H${BX + BW + 44} V${base(1)} H${BX + BW + 10}`, stroke: 'helps', sw: 2.5 }, eq);
  S.text('=', { x: BX + BW + 94, y: (base(0) + base(1)) / 2, size: 40, weight: 800, anchor: 'middle', color: 'helps' }, eq);
  S.text('layer 1', { x: BX + BW + 94, y: (base(0) + base(1)) / 2 + 40, size: 22, weight: 700, anchor: 'middle', color: 'helps' }, eq);
  rise(eq, tMatch + 0.4, 10);
  fade(eq, 1, 0.35, tLean, 0.4);
  const sch = ch14Tag(S, 'schematic: 8 bars for 80 layers', { x: BX + BW / 2, y: 840, size: 22 });
  rise(sch, tLean + 0.6, 10);
  fade(sch, 1, 0, tB4, 0.35);

  // ---------------------------------------------------------------- b2: the inputs differ
  const tDiff = T('b2~vectors') - 0.1;
  const thread = (r, tone, at) => {
    const y = RY[r] - 26;
    const p = S.path({ d: `M${SX[1]},${y} C${SX[1] + 40},${y - 70} ${SX[2] - 40},${y - 70} ${SX[2] - 10},${y}`, stroke: tone, sw: 3.5 });
    p.setAttribute('data-audit', 'ignore');
    K.draw(p, 260, at, 0.5);
    return p;
  };
  thread(0, 'struct', tDiff + 0.2); thread(1, VIOLET, tDiff + 0.4);
  RY.forEach((y, r) => {
    const a = S.path({ d: `M${SX[2] + 84},${y} H${WX - 46} M${WX - 56},${y - 7} L${WX - 45},${y} L${WX - 56},${y + 7}`, stroke: r ? VIOLET : 'struct', sw: 3 });
    a.setAttribute('data-audit', 'ignore');
    K.draw(a, 100, tDiff + 0.8 + 0.15 * r, 0.3);
    const gl = S.rect({ x: WX - 52, y: y - 52, w: 104, h: 104, r: 18, fill: r ? 'url(#pglow-violet)' : 'url(#pglow-struct)', opacity: 0 });
    gl.setAttribute('data-audit', 'ignore');
    pulse(gl, tDiff + 1.0 + 0.15 * r, 0.9, 0.7);
  });
  const ICX = 1140;
  const wave = S.icon('ph:waves-duotone', { x: ICX, y: 250, size: 54, color: 'ink' });
  const coin = S.icon('ph:coin-duotone', { x: ICX, y: 790, size: 54, color: 'ink' });
  rise(wave, tLean, 10); rise(coin, tLean + 0.2, 10);
  const lW = S.text('leans toward water', { x: ICX + 42, y: 252, size: 28, weight: 750, color: 'struct' });
  const lM = S.text('leans toward money', { x: ICX + 42, y: 792, size: 28, weight: 750, color: 'violet' });
  rise(lW, T('b2~water') - 0.1, 10); rise(lM, T('b2~money') - 0.1, 10);
  fade([lW, lM], 1, 0, tB3, 0.35);
  // icons grey out while blind
  whole(t => { const b = cl((t - tBlind) / 0.4) * (1 - cl((t - tBack) / 0.25)); [wave, coin].forEach(ic => ic.setAttribute('opacity', (1 - 0.6 * b).toFixed(3))); });

  // ================================================================ b3: how the model tells them apart
  const probe = S.g();
  const later = S.g(null, probe);
  libToken(S, { text: 'a later word', x: 1620, y: 520, size: 28, state: 'token', icon: 'ph:magnifying-glass-duotone' }, later);
  K.track(later, [K.K(tB3 + 0.2, { x: 220, o: 0 }), K.K(tB3 + 0.7, { x: 0, o: 1, e: 'power3.out' })]);
  const look = ch14Tag(S, 'looking for water', { x: 1620, y: 584, size: 22 }, probe);
  rise(look, tB3 + 0.7, 10);
  const tProbe = tB3 + 0.9;
  const tips = [0, 1].map(r => { const y = base(r) - PIT * 7, a = (r ? 1 : -1) * 2.2 * 7 * Math.PI / 180; return [BX + BW * Math.cos(a) + 6, y + BW * Math.sin(a)]; });
  const lines = tips.map(([x, y], r) => {
    const p = S.path({ d: `M1500,520 C1380,520 ${x + 120},${y} ${x},${y}`, stroke: r ? VIOLET : 'struct', sw: 2 }, probe);
    p.setAttribute('data-audit', 'ignore');
    K.draw(p, 700, tProbe + 0.15 * r, 0.5);
    return p;
  });
  whole(t => {
    const s = cl((t - tProbe - 0.6) / 0.4), b = cl((t - tBlind) / 0.4) * (1 - cl((t - tBack) / 0.25));
    const strong = lerp(lerp(2, 7, s), 2, b), weak = 2;
    lines[0].setAttribute('stroke-width', strong.toFixed(2));
    lines[1].setAttribute('stroke-width', weak);
    lines[0].setAttribute('stroke-opacity', lerp(lerp(0.6, 1, s), 0.35, b).toFixed(3));
    lines[1].setAttribute('stroke-opacity', lerp(lerp(0.6, 0.3, s), 0.35, b).toFixed(3));
    lines[0].setAttribute('filter', s > 0.5 && b < 0.5 ? 'url(#glow-struct)' : '');
  });
  const ill = ch14Tag(S, 'illustrative', { x: 1860, y: 128, anchor: 'end', size: 22 });
  rise(ill, tProbe, 10);
  const useless = ch14Tag(S, 'context-free keys: useless', { x: 1620, y: 650, size: 24 }, probe);
  rise(useless, tBlind + 0.4, 10);
  fade(useless, 1, 0, tBack + 0.3, 0.3);
  fade([probe, ill], 1, 0, tB4, 0.4);

  // ================================================================ b4: one phenomenon
  const cap1 = S.text('question and capability:', { x: 1540, y: 470, size: 36, weight: 750, anchor: 'middle', color: 'ink' });
  const cap2 = S.text('one phenomenon', { x: 1540, y: 522, size: 40, weight: 800, anchor: 'middle', color: 'helps' });
  rise(cap1, tB4 + 0.4); rise(cap2, tB4 + 0.7);
  const tPre = T('b4~prefix') - 0.2;
  const strip = S.g();
  const PX = j => 820 + 76 * j;
  ['t1', 'XX', 't3', 't4', 't5'].forEach((s, j) => {
    const p = S.g(null, strip);
    libToken(S, { text: s, x: PX(j), y: 900, size: 24, w: 62, state: j === 1 ? 'changed' : 'token' }, p);
    S.rect({ x: PX(j) - 26, y: 940, w: 52, h: 22, r: 5, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.7, sw: 1.5 }, p);
  });
  rise(strip, tPre, 10, 0.35);
  let d = `M${PX(1) - 26},951`;
  for (let x = PX(1) - 26 + 10, i = 0; x <= PX(4) + 26; x += 10, i++) d += ` L${x},${951 + (i % 2 ? -6 : 6)}`;
  const crack = S.path({ d, stroke: 'muted', sw: 2.5 }, strip);
  crack.setAttribute('data-audit', 'ignore');
  K.draw(crack, 360, tPre + 0.4, 0.6);
  const why = ch14Tag(S, 'why the prefix rule exists', { x: 1390, y: 950, size: 24 });
  rise(why, tPre + 0.8, 10);
  void rows; void Ws; void wNames; void tB2;
});
