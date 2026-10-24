/* ch14_s01 · a fixed matrix, and a fair question (fig 37)
   One continuous shot. Top band: the five tokens, t5 the one whose key we follow; blue arcs say "its key
   depends on the tokens before it". Centre: the equation builds in speech order, key = token's vector × W_K,
   the vector flying down out of t5. b2: W_K is one of 80 (a deck fans out and folds), it locks, and four tags
   (token, position, conversation, user) park beside it without the tile reacting. b3: the arcs come back and
   the fair question drops in. b4: the answer is the input: the vector glows, and a locked '× 2' machine turns
   3 into 6 and 4 into 8. */
V.scene('ch14_s01', S => {
  const { fx } = S;

  // ---------------------------------------------------------------- layout
  const CX = 960;                 // centre line of the strip, the equation and the machine
  const EQ = 540;                 // equation centre y
  const TY = 250;                 // the token strip's home in the top band
  const G = 36, OPW = 56;         // gap between terms, width of an operator slot
  const KEY_N = 8, VEC_N = 14, CW = 28, CHH = 56, GAP = 3, TILE = 240;
  const barW = n => n * CW + (n - 1) * GAP;
  const total = barW(KEY_N) + OPW + barW(VEC_N) + OPW + TILE + 4 * G;
  let xx = CX - total / 2;
  const keyCx = xx + barW(KEY_N) / 2; xx += barW(KEY_N) + G;
  const eqCx = xx + OPW / 2; xx += OPW + G;
  const vecCx = xx + barW(VEC_N) / 2; xx += barW(VEC_N) + G;
  const timesCx = xx + OPW / 2; xx += OPW + G;
  const tileCx = xx + TILE / 2;

  // ---------------------------------------------------------------- top band: the tokens and their dependence
  // b1 opens on the tokens alone, large and central; when the equation starts they rise to the top band
  const tkHold = S.g();
  const tk = ch14Tokens(S, { x: CX, y: TY }, tkHold);
  const t5 = tk.tokens[4], t5g = tk.at(4);
  const early = tk.tokens.slice(0, 4).map(c => c.body);
  S.xset(tkHold, { y: 450 - TY, s: 1.4, ox: CX, oy: TY });
  S.add(tk.reveal('all', { every: 0.09 }), 0.35);
  // "depends on the tokens before it": four arcs draw from t1 … t4 into t5, which lights as they land
  S.add(tk.showArcs({ d: 0.75, stagger: 0.3 }), 'b1~depends-0.1');
  S.add(t5.glow({ tone: 'struct', hold: 0.5 }), 'b1~before-0.05');
  const foot = ch14Tag(S, 'almost every layer', { x: t5g.cx, y: t5g.b + 36 }, tkHold);
  S.add(fx.in(foot, { from: 'up', d: 0.5, dist: 14 }), 'b1~almost-0.15');

  // "Yet a key is just …": the arcs and the footnote go, the strip rises to the top band; t1 … t4 step back
  S.add(tk.hideArcs({ d: 0.35 }), 'b1~Yet-0.3');
  S.add(fx.out(foot, { d: 0.3 }), 'b1~Yet-0.3');
  S.add(fx.xform(tkHold, { y: 0, s: 1 }, { d: 0.9, ease: 'power3.inOut' }), 'b1~Yet-0.15');
  S.add(ch14Fade(early, 1, 0.45, { d: 0.6 }), 'b1~a key is-0.1');

  // ---------------------------------------------------------------- the equation: key = token's vector × W_K
  const key = ch14Bar(S, { x: keyCx, y: EQ, n: KEY_N, cw: CW, ch: CHH, gap: GAP, seed: 41, label: 'key', hidden: true });
  const eqSign = ch14Op(S, '=', { x: eqCx, y: EQ });
  // the token's vector: drawn at its slot, but it starts as a small bar just under t5 and flies down
  const vecFade = S.g();
  const vecFly = S.g(null, vecFade);
  const vec = ch14Bar(S, { x: vecCx, y: EQ, n: VEC_N, cw: CW, ch: CHH, gap: GAP, seed: 23 }, vecFly);
  const vecLabel = S.text("token's vector", { x: vecCx, y: vec.b + 42, size: CH14.label, anchor: 'middle', color: 'muted', weight: 600 });
  const times = ch14Op(S, '×', { x: timesCx, y: EQ });
  const mat = ch14Matrix(S, { x: tileCx, y: EQ, size: TILE, seed: 14, name: 'K', sub: 'key matrix' });

  S.add(key.pop({ stagger: 0.025, d: 0.4 }), 'b1~a key is+0.05');
  S.add(fx.in(key.labelEl, { from: 'up', d: 0.5, dist: 14 }), 'b1~a key is+0.2');
  S.add(fx.pop(eqSign, { from: 0.5 }), 'b1~is-0.05');

  S.xset(vecFly, { x: t5g.cx - vec.cx, y: t5g.b + 30 - vec.cy, s: 0.24, ox: vec.cx, oy: vec.cy });
  S.add(t5.pulse({ scale: 1.1, d: 0.45 }), "b1~token's vector-0.4");
  S.add(fx.in(vecFade, { from: 'fade', d: 0.25 }), "b1~token's vector-0.35");
  S.add(fx.xform(vecFly, { x: 0, y: 0, s: 1 }, { d: 0.85, ease: 'power3.inOut' }), "b1~token's vector-0.2");
  S.add(fx.in(vecLabel, { from: 'up', d: 0.5, dist: 14 }), 'b1~vector+0.15');

  S.add(fx.pop(times, { from: 0.4 }), 'b1~times-0.12');
  S.add(fx.in(mat.tile, { from: 'scale', scale: 0.82, d: 0.7 }), 'b1~key matrix-0.3');
  S.add(fx.in(mat.subEl, { from: 'up', d: 0.5, dist: 14 }), 'b1~matrix');
  S.add(fx.in(mat.nameEl, { from: 'up', d: 0.5, dist: 14 }), 'b1~W K-0.12');

  // ---------------------------------------------------------------- b2: one per layer, fixed, the same for everyone
  // the deck: 80 faint tiles behind W_K, fanning up and to the right, then folding back into the one tile
  const N = 80, DX = 2.3, DY = -1.95;
  const deckG = S.g(null, mat.back);
  deckG.setAttribute('data-audit', 'ignore');
  const deck = [];
  for (let k = N; k >= 1; k--) {
    const rc = S.rect({ x: mat.l, y: mat.t, w: mat.w, h: mat.h, r: 16, fill: '#0e1730', stroke: '#c9d4f0', strokeOpacity: 0.1 + 0.42 * (1 - k / N), sw: 1.4 }, deckG);
    rc.k = k;
    deck.push(rc);
  }
  deckG.style.opacity = 0;
  const fan = (a, b, d, ease) => ch14Drive(d, p => {
    const v = a + (b - a) * p;
    deckG.style.opacity = Math.min(1, v * 5);
    deckG.style.visibility = v > 0.001 ? 'inherit' : 'hidden';
    deck.forEach(rc => rc.setAttribute('transform', `translate(${(rc.k * DX * v).toFixed(2)},${(rc.k * DY * v).toFixed(2)})`));
  }, ease);
  const deckLabel = S.text('80 layers, one each', { x: mat.r + N * DX, y: mat.t + N * DY - 32, size: 28, anchor: 'end', color: 'muted', weight: 550 });
  S.add(fan(0, 1, 0.85, 'power3.out'), "b2~Each-0.12");
  S.add(fx.in(deckLabel, { from: 'up', d: 0.5, dist: 14 }), "b2~layer's+0.05");
  // "fixed": the padlock snaps onto the front tile while the deck is still out
  S.add(mat.lock(), 'b2~fixed-0.15');
  // "once training ends": the deck folds back into the one tile
  S.add(fan(1, 0, 0.6, 'power2.inOut'), 'b2~training');
  S.add(fx.out(deckLabel, { d: 0.35 }), 'b2~training');

  // "the same for every token, position, conversation and user": four tags park beside the tile in turn
  const TAGS = [
    { t: 'token', icon: 'pill', w: 'b2~token' },
    { t: 'position', icon: 'ph:map-pin-duotone', w: 'b2~position' },
    { t: 'conversation', icon: 'ph:chat-circle-dots-duotone', w: 'b2~conversation' },
    { t: 'user', icon: 'ph:user-duotone', w: 'b2~user' },
  ];
  const TAG_H = 46, TAG_P = 60, tagX = mat.r + 38;
  const tags = TAGS.map((d, i) => ch14Tag(S, d.t, {
    x: tagX, y: EQ + (i - 1.5) * TAG_P, anchor: 'start', size: 26, h: TAG_H, icon: d.icon, iconSize: 30,
    iconColor: 'struct', color: 'ink', rim: 0.24,
  }));
  tags.forEach((g, i) => S.add(fx.in(g, { from: 'left', d: 0.55, dist: 44 }), `${TAGS[i].w}-0.15`));
  // "the matrix itself": a quiet light on the tile, nothing more; it does not react
  const halo = S.rect({ x: mat.l - 12, y: mat.t - 12, w: mat.w + 24, h: mat.h + 24, r: 24, fill: '#ffffff', fillOpacity: 0.05, stroke: '#ffffff', strokeOpacity: 0.32, sw: 2 }, S.layers.back);
  halo.style.opacity = 0;
  S.add(ch14Fade(halo, 0, 1, { d: 0.6 }), 'b2~matrix-0.1');
  // "independent of context": the tags go together, one label settles under the tile
  S.add(fx.out(tags, { d: 0.4, stagger: 0 }), 'b2~independent-0.05');
  const sameG = S.g();
  const same = S.text('same for everyone, forever', { x: mat.cx, y: mat.subY + 44, size: 28, anchor: 'middle', color: 'muted', weight: 550 }, sameG);
  S.add(fx.in(sameG, { from: 'up', d: 0.6, dist: 18 }), 'b2~independent+0.3');

  // ---------------------------------------------------------------- b3: the fair question
  S.add(ch14Fade(halo, 1, 0, { d: 0.5 }), 'b3-0.1');
  S.add(ch14Fade(same, 1, 0.35, { d: 0.5 }), 'b3');
  S.add(ch14Fade(early, 0.42, 1, { d: 0.5 }), 'b3+0.1');
  S.add(tk.showArcs({ d: 0.6, stagger: 0.12, to: 0.45 }), 'b3+0.25');
  const qText = 'fixed matrix, yet context-dependent key?';
  const qW = Math.ceil(S.measure(qText, { size: 34, weight: 650 })) + 28 + 44 + 22 + 30;
  const qCard = S.card({ x: CX - qW / 2, y: 830, w: qW, h: 88, tone: 'struct', icon: 'ph:question-duotone', iconSize: 44, title: qText, size: 34, layout: 'left' });
  S.add(fx.in(qCard, { from: 'down', d: 0.7, dist: 40 }), 'b3~fair-0.2');
  // "how can the key depend on earlier tokens?": the key and the arcs answer to the words; the tile stays still
  S.add(key.sweep({ stagger: 0.04 }), 'b3~key-0.1');
  S.add(tk.arcsTo(1, { d: 0.4 }), 'b3~earlier-0.15');
  S.add(tk.pulse([0, 3], { stagger: 0.08, scale: 1.08 }), 'b3~earlier-0.1');

  // ---------------------------------------------------------------- b4: the answer is in what gets multiplied
  S.add(fx.out(qCard, { to: 'down', d: 0.4 }), 'b4-0.1');
  S.add(fx.out([mat.subEl, sameG], { d: 0.4, stagger: 0 }), 'b4-0.1');
  S.add(tk.arcsTo(0.3, { d: 0.5 }), 'b4');
  S.add(vec.glow(), 'b4~answer');
  S.add(ch14Retext(vecLabel, "token's vector", 'which vector goes in?', 0.45), 'b4~what-0.15');
  S.add(gsap.fromTo(vecLabel, { fill: S.tone('muted') }, { fill: S.tone('ink'), duration: 0.4, immediateRender: false }), 'b4~what+0.05');

  // the analogy: a locked function, × 2; only what goes in changes
  const MY = 832, SW = 112, SH = 90, CARD_W = 210, CARD_H = 104, AR = 64, AG = 16;
  const cardL = CX - CARD_W / 2, cardR = CX + CARD_W / 2;
  const inCx = cardL - AG - AR - AG - SW / 2, outCx = cardR + AG + AR + AG + SW / 2;
  const mach = S.g();
  const slot = (cx, lbl) => {
    const g = S.g(null, mach);
    S.rect({ x: cx - SW / 2, y: MY - SH / 2, w: SW, h: SH, r: 16, fill: CH14.BASE }, g);
    g.rim = S.rect({ x: cx - SW / 2, y: MY - SH / 2, w: SW, h: SH, r: 16, stroke: 'struct', strokeOpacity: 0.6, sw: 2, dash: '8 7' }, g);
    g.label = S.text(lbl, { x: cx, y: MY - SH / 2 - 26, size: 26, anchor: 'middle', color: 'muted', weight: 550 }, g);
    return g;
  };
  const inGlow = S.rect({ x: inCx - SW / 2 - 10, y: MY - SH / 2 - 10, w: SW + 20, h: SH + 20, r: 22, fill: 'struct', fillOpacity: 0.16, stroke: 'struct', strokeOpacity: 0.9, sw: 2.5 }, mach);
  inGlow.style.opacity = 0;
  const inSlot = slot(inCx, 'input'), outSlot = slot(outCx, 'output');
  const nums = S.g(null, mach);
  const num = (v, cx) => {
    const g = S.g(null, nums);
    S.text(String(v), { x: cx, y: MY + 2, size: 56, anchor: 'middle', family: 'mono', weight: 600, color: 'struct' }, g);
    return g;
  };
  const n3 = num(3, inCx), n6 = num(6, outCx), n4 = num(4, inCx), n8 = num(8, outCx);
  const a1 = S.arrow({ x1: inCx + SW / 2 + AG, y1: MY, x2: cardL - AG, y2: MY, color: 'faint', sw: 3, head: 12 }, mach);
  const a2 = S.arrow({ x1: cardR + AG, y1: MY, x2: outCx - SW / 2 - AG, y2: MY, color: 'faint', sw: 3, head: 12 }, mach);
  const card = S.card({ x: cardL, y: MY - CARD_H / 2, w: CARD_W, h: CARD_H, tone: 'compute', title: '× 2', size: 56 }, mach);
  const cardLock = ch14Lock(S, { x: cardR - 8, y: MY - CARD_H / 2 + 8, r: 23 }, mach);

  S.add(fx.in(card, { from: 'scale', scale: 0.85, d: 0.6 }), 'b4~multiplied-0.05');
  S.add(fx.in([inSlot, outSlot], { from: 'fade', d: 0.5, stagger: 0.1 }), 'b4~multiplied+0.1');
  S.add(fx.drawArrow(a1, { d: 0.4 }), 'b4~multiplied+0.2');
  S.add(fx.drawArrow(a2, { d: 0.4 }), 'b4~multiplied+0.32');
  S.add(cardLock.snap(), 'b4~multiplied+0.38');

  const take = S.takeaway('fixed function, changing input', { tone: 'struct' });
  S.add(fx.in(take, { from: 'up', d: 0.6 }), 'b4~fixed');

  // "changing input": 3 slides into the input slot (which glows); a blue pulse runs through the locked card
  // (under it) and 6 lands in the output slot. The card and its padlock never move.
  const dot = S.circle({ x: 0, y: MY, r: 7, fill: 'struct', filter: 'url(#glow-struct)' }, nums);
  dot.style.opacity = 0;
  const dx0 = inCx + SW / 2 + 6, dx1 = outCx - SW / 2 - 6;
  const run = at => S.add(ch14Drive(0.42, k => {
    dot.setAttribute('cx', (dx0 + (dx1 - dx0) * k).toFixed(1));
    dot.style.opacity = k > 0.001 && k < 0.999 ? 1 : 0;
  }, 'power1.inOut'), at);
  const slideIn = (g, at) => S.add(gsap.fromTo(g, { autoAlpha: 0, x: -110 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power3.out' }), at);
  const popOut = (g, at) => S.add(gsap.fromTo(g, { autoAlpha: 0, scale: 0.55, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2.4)', transformOrigin: '50% 50%' }), at);
  const leave = (g, at) => S.add(gsap.fromTo(g, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: 34, duration: 0.3, ease: 'power2.in', immediateRender: false }), at);
  slideIn(n3, 'b4~changing input-0.2');
  S.add(ch14Fade(inGlow, 0, 1, { d: 0.35 }), 'b4~changing input-0.05');
  run('b4~changing input+0.25');
  popOut(n6, 'b4~input');
  // "changing output": 3 and 6 drop away as 4 comes in; the pulse runs again and 8 lands
  leave(n3, 'b4~changing output-0.35');
  leave(n6, 'b4~changing output-0.3');
  slideIn(n4, 'b4~changing output-0.2');
  S.add(ch14Fade(inGlow, 1, 0.35, { d: 0.15 }), 'b4~changing output-0.2');
  S.add(ch14Fade(inGlow, 0.35, 1, { d: 0.3 }), 'b4~changing output-0.05');
  run('b4~changing output+0.22');
  popOut(n8, 'b4~output+0.05');
});
