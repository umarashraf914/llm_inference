/* ch13_s11 · the cache and the weights compete (fig 143)
   Checked: what-if H100, weights alone: 3.35 TB/s ÷ 140 GB = 23.9 ≈ 24 tokens/s; with a 100,000-token cache
   (32.8 GB) each step reads 172.8 ≈ 173 GB: 19.4 ≈ 19 tokens/s. Block areas at 480 px² per GB: weights 140 GB =
   420 × 160; the cache block is 120 wide, 4 px tall per GB (33 GB = 131 px).
   Opens on scene 10's two bars, which fold into blocks inside the HBM panel; one bus to the die; coral particles
   from both blocks; the ceiling readout top right.
   b1  fold; panel, bus, die; weights particles, then cache particles; 'both draw on the same bus'; the readout.
   b2  weights alone (the cache empties): '3.35 TB/s ÷ 140 GB ≈ 24 tokens/s'; a 100,000-token cache: 33 GB, the
       denominator 173 GB, the result 24 → 19; 'illustrative: one request, what-if H100'; a slider: cache up,
       rate down.
   b3  readout, slider, tags fade; labels shorten; 'read once, shared'; five users, the weights stream branching
       to all; five caches under 'one cache per conversation', each streaming to its own user.
   b4  pulses; four teal cards: shrink it, share a common prefix, split across machines, don't store parts.
   b5  cards fade; 'the model', 'the conversation's state'; 'two things, one budget'.
   Layout: panel x 80-900, y 300-680; weights block x 130-550, y 420-580; cache block x 600-720 bottom 580 (five
   blocks in b3 at x 592 + 58 c, w 48); bus x 900-1360 at y 580; die (1450, 580); users x 1720; readout y 160-262. */
V.scene('ch13_s11', S => {
  const K = libKit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const { fx } = S;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1, tB5 = T('b5') - 0.1;

  // ================================================================ the cache size over the scene (GB)
  const tAlone = T('b2~weights') - 0.1, tAdd = T('b2~Add') - 0.1, tGen = T('b2~direction') - 0.1;
  const cacheGB = t => {
    let g = 32.768 * (1 - EIO(cl((t - tAlone) / 0.5))) + 32.768 * EIO(cl((t - tAdd) / 1.2));
    const q = cl((t - tGen) / 1.5);   // the slider: up to 45, down to 8, back to 33
    if (q > 0 && q < 1) g = q < 0.35 ? lerp(32.768, 45, EIO(q / 0.35)) : q < 0.75 ? lerp(45, 8, EIO((q - 0.35) / 0.4)) : lerp(8, 32.768, EIO((q - 0.75) / 0.25));
    return g;
  };

  // ================================================================ b1: the bars fold into blocks
  const panel = S.g();
  const panR = S.rect({ x: 80, y: 300, w: 820, h: 380, r: 24, fill: '#0e1528', stroke: '#ffffff', strokeOpacity: 0.16, sw: 2 }, panel);
  const panT = S.text('HBM, one bandwidth budget', { x: 490, y: 340, size: 30, weight: 750, anchor: 'middle', color: 'ink' }, panel);
  hide(panel);
  fade(panel, 0, 1, 0.5, 0.5);
  const tFold = 0.3;
  const wBlk = S.rect({ x: 120, y: 420, w: 1680, h: 40, r: 8, fill: 'url(#solid-struct)' });
  const cBlk = S.rect({ x: 120, y: 520, w: 393, h: 40, r: 3, fill: 'url(#solid-bytes)' });
  const tSplit = T('b3~each') - 0.1;
  whole(t => {
    const k = EIO(cl((t - tFold) / 1.0));
    [['x', 120, 130], ['y', 420, 420], ['width', 1680, 420], ['height', 40, 160]].forEach(([a, p, q]) => wBlk.setAttribute(a, lerp(p, q, k).toFixed(1)));
    const h = 4 * cacheGB(t);
    cBlk.setAttribute('x', lerp(120, 600, k).toFixed(1));
    cBlk.setAttribute('width', lerp(393, 120, k).toFixed(1));
    cBlk.setAttribute('height', lerp(40, h, k).toFixed(1));
    cBlk.setAttribute('y', lerp(520, 580 - h, k).toFixed(1));
    setO(cBlk, (h > 0.5 || k < 1 ? 1 : 0) * (1 - cl((t - tSplit) / 0.3)));
  });
  const cGB = S.text('', { x: 660, y: 0, size: 24, weight: 800, anchor: 'middle', color: 'bytes' });
  whole(t => {
    const g = cacheGB(t);
    cGB.textContent = `${Math.round(g)} GB`;
    cGB.setAttribute('y', (580 - 4 * g - 18).toFixed(1));
    setO(cGB, cl((t - tFold - 1.0) / 0.3) * (g > 3 ? 1 : 0) * (1 - cl((t - tB3) / 0.3)));
  });
  // block labels: long in b1-b2, short in b3, gone in b4, 'the model' / 'the conversation's state' in b5
  const lab = (text, x, at, out) => { const e = S.text(text, { x, y: 614, size: 24, weight: 650, anchor: 'middle', color: 'muted' }); hide(e); fade(e, 0, 1, at, 0.35); if (out) fade(e, 1, 0, out, 0.3); return e; };
  const tCards = T('b4~shrinking') - 0.1;
  lab('weights, read every step', 340, tFold + 1.1, tB3);
  lab('cache, read every step', 680, tFold + 1.2, tB3);
  lab('weights', 340, tB3 + 0.35, tCards);
  lab('cache', 706, tB3 + 0.35, tCards);
  const tTwo = T('b5~Two') - 0.1;
  lab('the model', 340, tTwo + 0.3);
  lab("the conversation's state", 730, tTwo + 0.3);

  // ---------------------------------------------------------------- the bus and the die
  const DX = 1450, DY = 580;
  const busG = S.g();
  S.rect({ x: 900, y: DY - 36, w: 466, h: 72, r: 12, fill: '#140c14', stroke: 'bytes', strokeOpacity: 0.6, sw: 2 }, busG);
  libChip(S, { x: DX, y: DY, size: 170, tone: 'compute', state: 'on', seed: 9 }, busG);
  hide(busG);
  fade(busG, 0, 1, 1.0, 0.5);
  const busL = S.text('both draw on the same bus', { x: 1130, y: 650, size: 24, weight: 650, anchor: 'middle', color: 'muted' });
  hide(busL);
  fade(busL, 0, 1, T('b1~one') - 0.1, 0.35);
  fade(busL, 1, 0, tB3, 0.3);

  // ---------------------------------------------------------------- users and their branches (b3)
  const tUsers = T('b3~shares') - 0.1, UY = [440, 510, 580, 650, 720], UX = 1720;
  const users = S.g();
  const branches = UY.map(y => S.path({ d: `M${DX + 92},${DY} C${DX + 160},${DY} ${UX - 110},${y} ${UX - 34},${y}`, stroke: 'muted', strokeOpacity: 0.45, sw: 2 }, users));
  branches.forEach((b, i) => { b.setAttribute('data-audit', 'ignore'); K.draw(b, 320, tUsers + 0.3 + 0.06 * i, 0.4); });
  UY.forEach((y, i) => { const ic = S.icon('ph:user-duotone', { x: UX, y, size: 50, color: 'struct' }, users); K.track(ic, [K.K(tUsers + 0.08 * i, { x: 30, o: 0 }), K.K(tUsers + 0.08 * i + 0.4, { x: 0, o: 1, e: 'back.out(2)' })]); });

  // ---------------------------------------------------------------- five caches, one per conversation (b3)
  const CH = [131, 82, 108, 58, 96], CC = ['#ff6b6b', '#ff8f80', '#e5576a', '#ffab9b', '#d94f4f'];
  const cacheX = c => 592 + 58 * c;
  const fiveG = S.g();
  const five = CH.map((h, c) => {
    const r = S.rect({ x: cacheX(c), y: 580, w: 48, h: 0, r: 4, fill: CC[c] }, fiveG);
    whole(t => { const k = E('power3.out')(cl((t - tSplit - 0.1 * c) / 0.45)); r.setAttribute('y', (580 - h * k).toFixed(1)); r.setAttribute('height', (h * k).toFixed(1)); });
    return r;
  });
  const brk = S.g();
  const bp = S.path({ d: `M${cacheX(0)},432 v-10 H${cacheX(4) + 48} v10`, stroke: 'white', sw: 2.5 }, brk);
  K.draw(bp, 330, tSplit + 0.4, 0.4);
  hide(bp);
  fade(bp, 0, 1, tSplit + 0.4, 0.05);
  const bT = S.text('one cache per conversation', { x: (cacheX(0) + cacheX(4) + 48) / 2, y: 398, size: 22, weight: 700, anchor: 'middle', color: 'ink' }, brk);
  hide(bT);
  fade(bT, 0, 1, tSplit + 0.6, 0.35);
  const shared = S.pill('read once, shared', { x: 340, y: 392, tone: 'helps', size: 22, h: 36 });
  hide(shared);
  fade(shared, 0, 1, T('b3~shares') + 0.1, 0.35);
  fade([brk, shared], 1, 0, tB4, 0.35);

  // ---------------------------------------------------------------- the particles: both blocks drain one bus
  const parts = S.g();
  parts.setAttribute('data-audit', 'ignore');
  const rnd = S.rand(43), RATE = 0.85, N = 130;
  const P = Array.from({ length: N }, (_, k) => ({ ph: rnd(), rank: k / N, lane: (rnd() - 0.5) * 44, el: S.rect({ x: -4, y: -1.5, w: 8, h: 3, r: 1, fill: 'bytes', opacity: 0 }, parts) }));
  const hash = (a, b, s) => { const v = Math.sin(a * 127.1 + b * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
  const tW = T('b1~weight') - 0.1, tC = T('b1~cache') - 0.1, tCompete = T('b4~compete') - 0.1;
  whole(t => {
    const I = 0.5 * cl((t - tW) / 0.5) + 0.25 * cl((t - tCompete) / 0.8);
    const gb = cacheGB(t), split = t >= tSplit + 0.3, usersOn = t >= tUsers + 0.6;
    const share = cl((t - tC) / 0.4) * Math.min(0.45, 1.6 * gb / (140 + gb)) * (split ? 1.5 : 1);
    P.forEach((p, k) => {
      const c = Math.floor(t * RATE + p.ph), u = (t * RATE + p.ph) - c;
      const fromCache = hash(c, k, 1) < share;
      let sx, sy, col = S.tone('bytes'), user = Math.floor(hash(c, k, 2) * 5);
      if (!fromCache) { sx = 140 + hash(c, k, 3) * 400; sy = 430 + hash(c, k, 4) * 140; }
      else if (!split) { sx = 606 + hash(c, k, 3) * 108; sy = 576 - hash(c, k, 4) * Math.max(1, 4 * gb - 8); }
      else { user = Math.floor(hash(c, k, 5) * 5); sx = cacheX(user) + 6 + hash(c, k, 3) * 36; sy = 576 - hash(c, k, 4) * (CH[user] - 8); col = CC[user]; }
      const end = usersOn ? 1 : 0.82;
      let x, y;
      if (u < 0.3) { const q = u / 0.3; x = lerp(sx, 905, q); y = lerp(sy, DY + p.lane, q); }
      else if (u < 0.75) { const q = (u - 0.3) / 0.45; x = lerp(905, 1362, q); y = DY + p.lane; }
      else if (!usersOn) { const q = Math.min(1, (u - 0.75) / 0.07); x = lerp(1362, 1380, q); y = DY + p.lane; }
      else { const q = (u - 0.75) / 0.25; x = lerp(1362, UX - 36, q); y = lerp(DY + p.lane, UY[user], E('power1.inOut')(q)); }
      p.el.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      p.el.setAttribute('fill', col);
      p.el.setAttribute('opacity', (p.rank < I && u < end ? 0.9 * Math.min(1, u * 10, (end - u) * 12) : 0).toFixed(3));
    });
  });

  // ================================================================ the ceiling readout (top right)
  const ro = S.g();
  const r1 = S.text([{ t: 'tokens/s', c: 'struct' }, { t: ' ≤ ', c: 'muted' }, { t: 'bandwidth', c: 'bytes' }, { t: ' ÷ ', c: 'muted' }, { t: 'bytes per token', c: 'bytes' }], { x: 1400, y: 168, size: 30, weight: 700, anchor: 'middle' }, ro);
  hide(r1);
  fade(r1, 0, 1, T('b1~ceiling') - 0.1, 0.4);
  // line 2, placed token by token: 3.35 TB/s ÷ [140 GB | 173 GB] ≈ [24 → 19] tokens/s
  const L2 = [['3.35 TB/s', 'bytes', 'mono'], ['÷', 'muted', 'mono'], ['173 GB', 'bytes', 'mono'], ['≈', 'muted', 'mono'], ['24', 'struct', 'mono'], ['tokens/s', 'struct', 'sans']];
  const wOf = (s, fam) => S.measure(s, { size: 32, weight: 750, family: fam });
  const tot = L2.reduce((a, [s, , f]) => a + wOf(s, f), 0) + 16 * (L2.length - 1);
  let lx = 1400 - tot / 2;
  const tL2 = T('b2~weights') + 0.3;
  const l2 = L2.map(([s, c, f], i) => {
    const e = S.text(s, { x: lx, y: 230, size: 32, weight: 750, family: f, color: c }, ro);
    e.__x = lx; lx += wOf(s, f) + 16;
    hide(e);
    fade(e, 0, 1, (i === 4 ? T('b2~twenty') - 0.15 : tL2 + 0.15 * i), 0.3);
    return e;
  });
  const den = l2[2], res = l2[4];
  const tDen = T('b2~seventy') - 0.15, tRes = T('b2~nineteen') - 0.4;
  const plus = S.text('140 + 33', { x: den.__x + wOf('173 GB', 'mono') / 2, y: 268, size: 22, weight: 700, family: 'mono', anchor: 'middle', color: 'bytes' }, ro);
  hide(plus);
  fade(plus, 0, 1, tDen + 0.1, 0.3);
  whole(t => {
    const gb = cacheGB(t), sliding = t > tGen && t < tGen + 1.6;
    den.textContent = t < tDen ? '140 GB' : `${Math.round(140 + gb)} GB`;
    const live = 3350 / (140 + (t < tDen ? 0 : gb));
    res.textContent = sliding ? String(Math.round(live)) : t < tRes ? '24' : String(Math.round(lerp(24, 19, cl((t - tRes) / 0.5))));
  });
  const ill = S.text('illustrative: one request, what-if H100', { x: 1400, y: 306, size: 22, weight: 600, anchor: 'middle', color: 'muted' }, ro);
  hide(ill);
  fade(ill, 0, 1, T('b2~Illustrative') - 0.1, 0.35);
  // the slider: the cache up, the rate down
  const sl = S.g(null, ro);
  S.text('cache size', { x: 1300, y: 356, size: 22, weight: 650, anchor: 'end', color: 'muted' }, sl);
  S.path({ d: 'M1316,356 H1616', stroke: 'muted', strokeOpacity: 0.5, sw: 3 }, sl);
  const knob = S.circle({ x: 1316, y: 356, r: 10, fill: 'bytes', stroke: '#060a14', sw: 2 }, sl);
  whole(t => knob.setAttribute('cx', (1316 + 300 * cacheGB(t) / 50).toFixed(1)));
  hide(sl);
  fade(sl, 0, 1, tGen - 0.2, 0.3);
  fade(ro, 1, 0, tB3, 0.4);

  // ================================================================ b4: they compete; the techniques ahead
  const glowW = S.rect({ x: 118, y: 408, w: 444, h: 184, r: 16, fill: 'url(#pglow-struct)', opacity: 0 });
  const glowC = S.rect({ x: 580, y: 430, w: 300, h: 162, r: 16, fill: 'url(#pglow-bytes)', opacity: 0 });
  [glowW, glowC].forEach(g => { g.setAttribute('data-audit', 'ignore'); });
  pulse(glowW, tCompete, 0.9, 0.7); pulse(glowC, tCompete + 0.45, 0.9, 0.7);
  pulse(glowW, tTwo, 0.9, 0.7); pulse(glowC, tTwo + 0.3, 0.9, 0.7);
  const CARDS = [['ph:arrows-in-duotone', 'shrink it', 'b4~shrinking'], ['ph:users-duotone', 'share a common prefix', 'b4~sharing'], ['ph:hard-drives-duotone', 'split across machines', 'b4~splitting'], ['ph:prohibit-duotone', "don't store parts", 'b4~never']];
  const cards = CARDS.map(([ic, txt, cue], i) => {
    const g = S.g(), x = 100 + 440 * i;
    S.rect({ x, y: 846, w: 400, h: 96, r: 18, fill: 'url(#card-helps)', stroke: 'helps', sw: 2.5 }, g);
    S.icon(ic, { x: x + 52, y: 894, size: 50, color: 'helps' }, g);
    S.text(txt, { x: x + 90, y: 895, size: 24, weight: 750, color: 'ink' }, g);
    const at = T(cue) - 0.1;
    K.track(g, [K.K(at, { y: 60, o: 0 }), K.K(at + 0.5, { y: 0, o: 1, e: 'power3.out' }), K.K(tB5, { o: 1 }), K.K(tB5 + 0.4, { o: 0 })]);
    return g;
  });
  // ================================================================ b5: two things, one budget
  const key = S.text('two things, one budget', { x: 490, y: 242, size: 44, weight: 800, anchor: 'middle', color: 'ink' });
  hide(key);
  S.add(K.drive(0.5, k => { setO(key, k); key.setAttribute('transform', `translate(0,${(14 * (1 - E('power3.out')(k))).toFixed(1)})`); }), T('b5~one') - 0.1);
  void panR; void panT; void five; void cards; void fx; void tB2;
});
