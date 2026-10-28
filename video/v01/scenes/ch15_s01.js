/* ch15_s01 · two jobs, two moments (fig 33)
   One continuous shot. Middle band: the model (left), the turn-2 prompt bar (lane y 452) over the KV cache
   row (y 500-574), cell for cell: token i of the bar sits directly above its K|V slab. Bottom band: a
   timeline of two turns with a white playhead. Top band: the header and the two job cards.
   b1  during an answer the cache only grows: each answer token leaves the model, rides to the end of the
       row and drops its K|V slab there (12 → 20 slabs), one per tick of the playhead. No lookup.
   b2  the next message arrives: the playhead jumps to turn 2, the whole conversation + new words arrives
       as one bar, and the cache is searched once (the magnifier compares bar and row, front to back).
   b3  where it matches: teal, skip prefill, a hit, warm; prompt caching.
   b4  where it does not: the amber tail is prefilled. Only the search can hit or miss; appends never do. */
V.scene('ch15_s01', S => {
  const { fx } = S;

  // ---------------------------------------------------------------- geometry
  const ROW = { x0: 374, y0: 514, cw: 52, ch: 46, gap: 8, pad: 14, n: 20, filled: 12 };   // frame 360..1580 × 500..574
  const PITCH = ROW.cw + ROW.gap;                                  // 60 px: one token, one slab
  const slotX = i => ROW.x0 + i * PITCH + ROW.cw / 2;              // centre of slab i (= centre of bar cell i)
  const BAR = { x: 370, y: 452, n: 24 };                           // 20 cells over the slabs + 4 new words (to 1810)
  const MODEL = { x: 112, y: 492, w: 184, h: 90 };
  const MCX = MODEL.x + MODEL.w / 2;                               // 204
  const CARD = { y: 192, w: 740, h: 160, lx: 120, rx: 1060 };
  const TL = { x: 370, y: 872, w: 1440 };                          // timeline: 1 unit = 1 px from x 370

  // ---------------------------------------------------------------- header (writes on with 'two jobs')
  const headG = S.g();
  const head = S.equation(['The', 'same', 'cache,', 'two', 'different', 'jobs'].map(t => ({ t, w: 700, family: 'display' })),
    { x: 960, y: 140, size: 50, gap: 14 }, headG);
  S.add(fx.in(head.parts, { from: 'up', dist: 16, d: 0.55, stagger: 0.09 }), 'b1~two-0.55');
  const head2 = S.text('one word, two jobs: keep them apart', { x: 960, y: 140, size: 50, weight: 700, family: 'display', anchor: 'middle' });
  S.set(head2, { autoAlpha: 0 }, 0);

  // ---------------------------------------------------------------- the KV cache row, its label, the model
  const kv = libKVCache(S, {
    x: ROW.x0, y: ROW.y0, layout: 'row', slots: ROW.n, filled: ROW.filled, cw: ROW.cw, ch: ROW.ch, gap: ROW.gap, pad: ROW.pad,
    tone: CH15.kv, letters: true, empty: false, frameTone: 'struct', label: null,
  });
  const rowLabel = S.text([{ t: 'KV cache', c: 'ink' }, { t: '  ·  on the GPU', c: 'muted' }], { x: kv.l + 2, y: kv.b + 34, size: 28, weight: 600 });
  S.add(fx.in(kv, { from: 'up', d: 0.7 }), 'b1-0.3');
  S.add(fx.in(rowLabel, { from: 'up', d: 0.6 }), 'b1~K-0.1');

  const model = S.g();
  const modelCard = S.card({ x: MODEL.x, y: MODEL.y, w: MODEL.w, h: MODEL.h, tone: 'compute', title: 'model', size: 32 }, model);
  const modelGlow = S.rect({ x: MODEL.x - 3, y: MODEL.y - 3, w: MODEL.w + 6, h: MODEL.h + 6, r: 22, stroke: 'compute', sw: 3, filter: 'url(#glow-compute)', opacity: 0 }, model);
  modelGlow.setAttribute('data-audit', 'ignore');
  S.add(fx.in(model, { from: 'right', d: 0.6 }), 'b1~cache-0.2');
  const flashModel = at => S.add(gsap.fromTo(modelGlow, { opacity: 0 }, { opacity: 0.9, duration: 0.18, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), at);

  // ---------------------------------------------------------------- the timeline (bottom band)
  const ax = libTimeAxis(S, { x: TL.x, y: TL.y, w: TL.w, t0: 0, t1: TL.w, unit: '', ticks: false, tone: 'faint', barH: 34, gap: 12, clip: false });
  const ROWT = ax.rowTop(0), ROWY = ax.rowY(0);                    // 826, 843
  const readIn = ax.span(0, 210, { tone: 'struct', style: 'soft', label: 'read prompt in', labelPos: 'inside', size: 24 });
  const TICK0 = 232, TICKD = 40, NT = 8;                          // the answer: 8 ticks, one per token
  const ticks = Array.from({ length: NT }, (_, k) => ax.span(TICK0 + k * TICKD, TICK0 + k * TICKD + 12, { tone: 'struct', style: 'solid', r: 4 }));
  const ghost2 = ax.span(906, TL.w, { tone: 'struct', style: 'ghost' });
  const search = ax.span(880, 892, { tone: CH15.hit, style: 'solid', r: 4 });
  const t1Label = S.text('turn 1', { x: TL.x, y: ROWT - 26, size: 26, weight: 650, color: 'muted' });
  const t2Dim = S.g({ opacity: 0.45 });
  const t2Label = S.text('turn 2', { x: TL.x + 906, y: ROWT - 26, size: 26, weight: 650, color: 'muted' }, t2Dim);
  const ansMid = TL.x + TICK0 + ((NT - 1) * TICKD + 12) / 2;
  const ansLabel = S.text('answer', { x: ansMid, y: TL.y + 32, size: 26, weight: 600, color: 'muted', anchor: 'middle' });
  const appendTag = S.text('append, no search', { x: ansMid, y: TL.y + 32, size: 26, weight: 650, color: 'bytes', anchor: 'middle' });
  const searchLabel = S.text('search, once', { x: TL.x + 886, y: TL.y + 32, size: 26, weight: 650, color: 'helps', anchor: 'middle' });
  S.set([appendTag, searchLabel], { autoAlpha: 0 }, 0);
  // the clock in the gap between the turns: its minute hand sweeps once when the next message arrives
  const CK = { x: TL.x + 702, y: ROWY, r: 19 };
  const clock = S.g();
  S.circle({ x: CK.x, y: CK.y, r: CK.r, fill: CH15.BASE, stroke: 'muted', sw: 2.5 }, clock);
  const hourH = S.line({ x1: CK.x, y1: CK.y, x2: CK.x, y2: CK.y - 9, stroke: 'muted', sw: 3 }, clock);
  const minH = S.line({ x1: CK.x, y1: CK.y, x2: CK.x, y2: CK.y - 14, stroke: 'ink', sw: 2.5 }, clock);
  hourH.setAttribute('transform', `rotate(120 ${CK.x} ${CK.y})`);
  S.circle({ x: CK.x, y: CK.y, r: 2.6, fill: 'ink' }, clock);
  const head0 = ax.marker(210, { tone: 'ink', y1: ROWT - 8, dot: true });   // the playhead

  S.add(ax.draw({ d: 0.9 }), 'b1~jobs-0.05');
  S.add(readIn.grow({ d: 0.55 }), 'b1~jobs+0.1');
  S.add(fx.in(t1Label, { from: 'up', d: 0.5 }), 'b1~jobs+0.1');
  S.add(ghost2.grow({ d: 0.6 }), 'b1~jobs+0.35');
  S.add(fx.in(t2Label, { from: 'up', d: 0.5 }), 'b1~jobs+0.45');
  S.add(fx.in(clock, { from: 'scale', d: 0.5 }), 'b1~jobs+0.35');
  S.add(head0.draw({ d: 0.4 }), 'b1~jobs+0.4');

  // ---------------------------------------------------------------- b1: during an answer, the cache grows
  // the playhead runs through the answer at a steady pace; each tick it passes is one answer token
  const V0 = 65.1;                                                // timeline units per second
  const T0 = S.t('b1~During') + 0.26;                              // the playhead reaches tick 0
  const tAt = k => T0 + (k * TICKD) / V0;
  const runStart = T0 - (TICK0 + 6 - 210) / V0, runEnd = 540;
  S.add(head0.moveTo(runEnd, { d: (runEnd - 210) / V0, ease: 'none' }), runStart);
  S.add(fx.in(ansLabel, { from: 'up', d: 0.5 }), 'b1~answer-0.1');
  ticks.forEach((tk, k) => {
    const at = tAt(k);
    S.add(tk.grow({ d: 0.22, from: 'center' }), at - 0.05);
    // the model makes token k: a blue pill pops out of it, rides the empty lane to the end of the row and
    // drops its keys and values into the next slot
    const cx = slotX(ROW.filled + k);
    const pill = libToken(S, { text: '', x: MCX, y: MODEL.y - 2, w: ROW.cw, h: 34, state: 'token', hidden: true });
    const route = `M${MCX},${MODEL.y - 2} L${MCX},${BAR.y} L${cx},${BAR.y}`;
    const dur = (BAR.y - MODEL.y + 2 + cx - MCX) / 1250;
    flashModel(at - 0.08);
    S.add(pill.pop({ d: 0.35 }), at);
    S.add(pill.travel(route, { d: dur, ease: 'power1.inOut' }), at);
    S.add(pill.moveBy(0, 34, { d: 0.26, ease: 'power2.in' }), at + dur);
    S.add(pill.out({ d: 0.24 }), at + dur + 0.02);
    S.add(kv.fill([ROW.filled + k], { from: 'down', d: 0.42 }), at + dur + 0.06);
  });
  S.add(fx.dim([t1Label, readIn], { to: 0.45 }), 'b1~appends');

  // the job cards: icon, kicker, the job in a few words, the detail
  const jobCard = (x, kicker, main, sub, iconFn) => {
    const holder = S.g(), dimG = S.g(null, holder);
    const card = S.card({ x, y: CARD.y, w: CARD.w, h: CARD.h, tone: 'neutral', title: '' }, dimG);
    const ix = x + 66, iy = CARD.y + CARD.h / 2, tx = x + 124, maxW = CARD.w - 124 - 28;
    const icon = S.g(null, dimG);
    iconFn(icon, ix, iy);
    const k = S.text(kicker, { x: tx, y: CARD.y + 40, size: 26, weight: 600, color: 'muted', maxW }, dimG);
    const m = S.text(main, { x: tx, y: CARD.y + 84, size: 44, weight: 700, family: 'display', maxW }, dimG);
    const s = S.text(sub, { x: tx, y: CARD.y + 127, size: 26, weight: 500, color: 'muted', maxW }, dimG);
    return { holder, dimG, card, parts: [icon, k, m, s] };
  };
  // left icon: one K|V slab with a '+': "one new entry"
  const slabIcon = (g, x, y) => {
    const kd = S.g(null, g);
    S.rect({ x: x - 26, y: y - 22, w: 25, h: 44, r: 6, fill: '#ff8a8a' }, kd);
    S.rect({ x: x + 1, y: y - 22, w: 25, h: 44, r: 6, fill: '#5a2a33', stroke: 'bytes', sw: 1.5 }, kd);
    S.circle({ x: x + 24, y: y - 22, r: 13, fill: CH15.BASE, stroke: 'ink', sw: 2.5 }, kd);
    S.path({ d: `M${x + 24},${y - 29}v14M${x + 17},${y - 22}h14`, stroke: 'ink', sw: 2.5 }, kd);
    kd.setAttribute('data-audit', 'ignore');
  };
  const lensIcon = (g, x, y) => S.icon('ph:magnifying-glass-duotone', { x, y, size: 64, color: 'ink' }, g);
  const cardL = jobCard(CARD.lx, 'During a turn', 'it grows.', 'One new entry per token, no lookup.', slabIcon);
  const cardR = jobCard(CARD.rx, 'At the start of a turn', 'it is searched.', 'Either the prompt matches, or it does not.', lensIcon);
  S.add(fx.in(cardL.card, { from: 'up', d: 0.6 }), 'b1~nothing-0.15');
  S.add(fx.in(cardL.parts, { from: 'up', dist: 12, d: 0.55, stagger: 0.1 }), 'b1~nothing');   // a short rise keeps the last line inside the card
  S.add(fx.dim(ansLabel, { to: 0.45 }), 'b1~nothing');

  // ---------------------------------------------------------------- b2: the next message arrives; one search
  // the clock's hand sweeps once and the playhead jumps the gap to the start of turn 2
  const spin = { a: 0 };
  const setHands = () => {
    minH.setAttribute('transform', `rotate(${spin.a.toFixed(2)} ${CK.x} ${CK.y})`);
    hourH.setAttribute('transform', `rotate(${(120 + spin.a / 12).toFixed(2)} ${CK.x} ${CK.y})`);
  };
  S.add(gsap.fromTo(spin, { a: 0 }, { a: 360, duration: 1.0, ease: 'power1.inOut', immediateRender: false, onUpdate: setHands }), 'b2~next-0.2');
  S.add(head0.moveTo(872, { d: 0.75, ease: 'power3.inOut' }), 'b2~next+0.05');
  S.add(fx.undim(t2Dim), 'b2~next+0.3');
  S.add(fx.dim([headG], { to: 0.5 }), 'b2~message');

  // turn 2's prompt: the whole conversation (20 tokens, one over each slab) plus the new words (4 tokens)
  const barIn = S.g(), barDim = S.g(null, barIn);
  const bar = ch15Bar(S, { x: BAR.x, y: BAR.y, n: BAR.n, pitch: PITCH, label: 'turn 2: whole conversation + new words' }, barDim);
  S.add(fx.in(barIn, { from: 'left', dist: 460, d: 0.95, ease: 'power3.out' }), 'b2~message-0.1');
  S.add(fx.dim(rowLabel, { to: 0.45 }), 'b2~message+0.3');

  // the search, once: one teal tick at the start of turn 2
  S.add(search.grow({ d: 0.3, from: 'center' }), 'b2~searched-0.15');
  S.add(fx.in(searchLabel, { from: 'up', d: 0.5 }), 'b2~searched');

  // the server asks
  S.add(fx.in(cardR.card, { from: 'up', d: 0.6 }), 'b2~server-0.15');
  S.add(fx.in(cardR.parts, { from: 'up', dist: 12, d: 0.55, stagger: 0.1 }), 'b2~server');
  S.add(fx.dim([cardL.dimG], { to: 0.4 }), 'b2~server');
  S.add(fx.dim([t2Dim], { to: 0.45 }), 'b2~server+0.2');
  const ask = libBubble(S, { text: '?', x: MCX, y: 434, size: 36, weight: 700, tone: 'neutral', side: 'left', hidden: true });
  S.add(ask.pop(), 'b2~do-0.05');

  // the magnifier compares the bar with the row, token by token, from the front
  const SW = { x0: slotX(0) + 5, x1: slotX(ROW.n - 1) + 5, d: 2.1 };
  const lens = ch15Sweep(S, { x: SW.x0, y1: BAR.y - 20, y2: kv.b, tone: 'ink', edge: false, icon: 'ph:magnifying-glass-duotone', iconY: 490, iconSize: 84 });
  const sweepAt = S.t('b2~beginning') - 0.15;
  S.add(lens.run(SW.x1, { d: SW.d, ease: 'none' }), sweepAt);
  for (let i = 0; i < ROW.n; i++) {
    const at = sweepAt + 0.1 + (i / (ROW.n - 1)) * SW.d;
    S.add(bar.glint(i, i + 1, { d: 0.4, to: 0.3 }), at - 0.12);
    S.add(kv.read({ sel: i, d: 0.4, to: 0.35 }), at - 0.12);
  }

  // ---------------------------------------------------------------- b3: where it matches: a hit, warm
  S.add(ask.shrink({ d: 0.45 }), 'b3+0.25');
  S.add(lens.out({ d: 0.35 }), 'b3~skip-0.35');
  S.add(fx.out(bar.labelEl, { d: 0.3 }), 'b3~skip-0.35');
  S.add(bar.paint(0, ROW.n, CH15.hit, { d: 0.9 }), 'b3~skip-0.15');
  S.add(kv.reuse(ROW.n, { d: 0.9 }), 'b3~skip-0.15');
  const hitNote = bar.note('hit: skip prefill', { a: 0, b: ROW.n });
  S.add(fx.in(hitNote, { from: 'fade', d: 0.45 }), 'b3~prefill+0.1');
  S.add(fx.dim(searchLabel, { to: 0.45 }), 'b3~skip');
  const warm = S.text('warm', { x: kv.r + 26, y: kv.cy + 1, size: 36, weight: 700, color: 'helps', family: 'display' });
  S.add(fx.in(warm, { from: 'left', d: 0.55 }), 'b3~warm-0.15');
  const tag = ch15Tag(S, { x: kv.l, y: kv.b + 88, lines: 'prompt caching: reuse across requests' });
  S.add(fx.in(tag, { from: 'up', d: 0.55 }), 'b3~prompt-0.1');

  // ---------------------------------------------------------------- b4: where it does not: a miss, prefilled
  S.add(bar.glint(ROW.n, BAR.n, { d: 0.6, to: 0.4 }), 'b4~no-0.1');
  S.add(fx.dim([warm, tag], { to: 0.45 }), 'b4~miss-0.2');
  S.add(bar.paint(ROW.n, BAR.n, CH15.miss, { d: 0.45 }), 'b4~miss-0.15');
  const missNote = bar.note('miss: prefill', { a: ROW.n, b: BAR.n });
  S.add(fx.in(missNote, { from: 'fade', d: 0.4 }), 'b4~miss+0.25');
  flashModel('b4~prefilled-0.05');
  S.add(bar.glint(ROW.n, BAR.n, { d: 0.5, to: 0.35 }), 'b4~prefilled');

  // the mechanism steps back; the two jobs close up side by side
  const back = 'b4~prefilled+0.35';
  S.add(fx.dim([barDim, kv, model, rowLabel, warm, tag], { to: 0.3, d: 0.6 }), back);
  S.add(fx.undim(cardL.dimG, { d: 0.6 }), back);
  S.add(fx.xform(cardL.holder, { x: 80 }, { d: 0.8 }), back);
  S.add(fx.xform(cardR.holder, { x: -80 }, { d: 0.8 }), back);
  // only the search can hit or miss
  const ring = S.rect({ x: CARD.rx - 12, y: CARD.y - 12, w: CARD.w + 24, h: CARD.h + 24, r: 30, stroke: 'helps', sw: 3 }, cardR.holder);
  S.set(ring, { autoAlpha: 0 }, 0);
  S.add(fx.draw(ring, { d: 0.7 }), 'b4~Only');
  const onlyThis = S.text('only this can hit or miss', { x: CARD.rx + CARD.w / 2, y: CARD.y + CARD.h + 46, size: 28, weight: 650, color: 'helps', anchor: 'middle' }, cardR.holder);
  S.add(fx.in(onlyThis, { from: 'down', d: 0.5 }), 'b4~Only+0.3');
  S.add(fx.undim(searchLabel), 'b4~search');
  S.add(fx.pulse(search, { scale: 1.25, d: 0.5 }), 'b4~search');
  // appends never can: the answer ticks flash coral
  S.add(fx.out(ansLabel, { d: 0.25 }), 'b4~hit-0.2');
  S.add(fx.in(appendTag, { from: 'up', d: 0.45 }), 'b4~hit+0.05');
  ticks.forEach((tk, k) => {
    S.add(tk.recolor('bytes', { d: 0.22 }), S.t('b4~hit-0.1') + k * 0.03);
    S.add(tk.recolor('struct', { d: 0.4 }), S.t('b4~hit+0.55') + k * 0.03);
  });
  // closing hold: the header says it
  S.add(fx.out(head.parts, { d: 0.25, stagger: 0.02 }), 'b4>-0.15');
  S.add(fx.in(head2, { from: 'up', dist: 16, d: 0.45 }), 'b4>+0.05');
});
