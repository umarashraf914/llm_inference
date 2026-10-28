/* ch04_s05 · the loop on the server (fig 30)
   Each new token goes three places: (1) down the line to you, (2) into the cache, a running record of
   everything processed (each token appends its keys and values: notes kept for this answer), and (3) back
   in as the next input: autoregressive. So decode makes one token at a time; token 9 needs token 8.
   The loop runs until a stop token or a length limit; each turn the cache grows by one entry.
   The loop really runs: Sunny in b1, tomorrow…winds in b3, and…evening in b4, stop in b5.
   Layout: the output node (960, 300) sits above the model block (750-1170 × 400-540), joined to it by a short
   dashed riser; every token rises out of the block to the node. Three arrows leave the node: (1) level to the
   laptop, whose middle is on y 300; (2) level right, turning down at x 1640 onto the top of the cache,
   a libKVCache stack panel (1528-1752 × 362-580) of ten empty slots that fill from the bottom, one K|V entry a
   turn (the stop token makes none, so one slot stays free); (3) a loop round the block's left side, entering
   its left edge level at y 470. Each badge sits on its arrow, its label above (1, 2) or beside it (3). Copies
   of a token slide out from under it along arrows 1 and 2, and the token itself goes round 3. Under the panel:
   K / V (604), the cache label (640), one sub-label row (676), a notes row (712). Under the block:
   'autoregressive' (592), 'output becomes input' (632). Slots y 770; 'done' and the length-limit gauge share
   y 718 above the last slots. */
V.scene('ch04_s05', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const WORDS = ['Sunny', 'tomorrow', 'with', 'light', 'winds', 'and', 'a', 'warm', 'evening', 'stop'];
  const SPOT = { x: 960, y: 300 }, MB = { x: 750, y: 400, w: 420, h: 140 };
  const SLOT = k => ({ x: 276 + k * 152, y: 770 }), SW = 140, SH = 52;
  const STACK = { x: 1540, w: 200, cx: 1640, n: 10, ch: 14, gap: 6, pad: 12, top: 362 };
  const LAP = { x: 330, w: 160 };
  LAP.y = SPOT.y;                                         // the laptop's middle on the arrow's line, like every device's
  const IN3 = { x: MB.x - 6, y: MB.y + MB.h / 2 };        // where arrow 3 meets the block's left edge

  // an arrow along any path: the line, and a head at `end` pointing along the unit vector `dir`
  const pathArrow = (d, end, dir, tone) => {
    const g = S.g(), hs = 14, [ux, uy] = dir;
    g.line = S.path({ d, stroke: tone, sw: 3.5 }, g);
    g.head = S.path({ d: `M${end.x - ux * hs - uy * hs * 0.6},${end.y - uy * hs + ux * hs * 0.6} L${end.x},${end.y} `
      + `L${end.x - ux * hs + uy * hs * 0.6},${end.y - uy * hs - ux * hs * 0.6}`, stroke: tone, sw: 3.5 }, g);
    g.d = d;
    return ignore(g);
  };
  const pointAt = (a, f) => a.line.getPointAtLength(a.line.getTotalLength() * f);

  // ---------------------------------------------------------------- the loop: the block, the node, three arrows, the laptop, the slots
  const model = S.g();
  S.rect({ x: MB.x, y: MB.y, w: MB.w, h: MB.h, r: 24, fill: '#0c1326' }, model);
  const mBg = S.rect({ x: MB.x, y: MB.y, w: MB.w, h: MB.h, r: 24, fill: 'url(#card-struct)', stroke: 'struct', sw: 3 }, model);
  S.text('run the whole model', { x: 960, y: MB.y + MB.h / 2 + 1, size: 34, anchor: 'middle', weight: 700, color: 'ink' }, model);
  ignore(S.line({ x1: SPOT.x, y1: MB.y - 2, x2: SPOT.x, y2: SPOT.y + 12, stroke: 'struct', sw: 2.5, strokeOpacity: 0.55, dash: '5 6' }, model));
  S.set(model, { autoAlpha: 0 }, 0);
  S.add(fx.in(model, { from: 'scale', scale: 0.92, d: 0.6 }), 0.2);
  const lap = libDevice(S, { x: LAP.x, y: LAP.y, w: LAP.w });
  S.set(lap, { autoAlpha: 0 }, 0);
  S.add(fx.in(lap, { from: 'left', d: 0.5, dist: 20 }), 0.5);
  const LAPIN = LAP.x + 0.42 * LAP.w + 16;                // just clear of the laptop's lid
  const A1 = pathArrow(`M${SPOT.x},${SPOT.y} L${LAPIN},${SPOT.y}`, { x: LAPIN, y: SPOT.y }, [-1, 0], 'struct');
  const A2 = pathArrow(`M${SPOT.x},${SPOT.y} L${STACK.cx - 20},${SPOT.y} Q${STACK.cx},${SPOT.y} ${STACK.cx},${SPOT.y + 20} `
    + `L${STACK.cx},${STACK.top - 2}`, { x: STACK.cx, y: STACK.top - 2 }, [0, 1], 'bytes');
  const A3 = pathArrow(`M${SPOT.x},${SPOT.y} C900,345 700,330 690,430 C688,455 705,${IN3.y} ${IN3.x},${IN3.y}`, IN3, [1, 0], 'helps');
  const arrows = [A1, A2, A3];
  arrows.forEach(a => S.set([a.line, a.head], { autoAlpha: 0 }, 0));
  // the node every token pops out at, over the arrows' common start
  const node = S.circle({ x: SPOT.x, y: SPOT.y, r: 9, fill: '#0c1326', stroke: 'struct', sw: 2.5 });
  S.set(node, { autoAlpha: 0 }, 0);
  S.add(fx.in(node, { from: 'fade', d: 0.4 }), 0.5);
  // the cache: ten empty slots in a panel under arrow 2's tip; it appears as arrow 2 reaches it
  const cache = libKVCache(S, { layout: 'stack', x: STACK.x, y: STACK.top + STACK.pad, slots: STACK.n, cw: STACK.w,
    ch: STACK.ch, gap: STACK.gap, pad: STACK.pad, label: null });
  S.set(cache, { autoAlpha: 0 }, 0);
  // its first entry shows as one bar until 'two bundles' splits it into K and V
  const c0 = cache.cells[0];
  const whole = S.rect({ x: c0.x, y: c0.y, w: c0.w, h: c0.h, r: 3, fill: 'url(#bar-bytes)', stroke: 'bytes', sw: 1 }, c0.slab);
  S.set(c0.base, { autoAlpha: 0 }, 0);
  // the copies of each token travel under it, so they slide out from beneath the token at the node
  const under = S.g();
  // each badge sits on its arrow: midway on 1, halfway along the level run of 2, at the outside of the loop on 3
  const L3 = A3.line.getTotalLength();
  let f3 = 0;
  for (let s = 0; s <= 200; s++) if (A3.line.getPointAtLength(L3 * s / 200).x < A3.line.getPointAtLength(L3 * f3).x) f3 = s / 200;
  const F = [0.5, (1300 - SPOT.x) / A2.line.getTotalLength(), f3];
  const badge = (n, a, f, tone) => {
    const p = pointAt(a, f), g = S.g();
    S.circle({ x: p.x, y: p.y, r: 17, fill: '#0c1326', stroke: tone, sw: 2 }, g);
    S.text(String(n), { x: p.x, y: p.y + 1, size: 24, anchor: 'middle', weight: 700, color: 'ink' }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    g.p = p;
    return g;
  };
  const badges = arrows.map((a, i) => badge(i + 1, a, F[i], ['struct', 'bytes', 'helps'][i]));
  const tag = (text, x, y, tone, anchor = 'middle') => {
    const t = S.text(text, { x, y, size: 24, anchor, weight: 650, color: tone });
    S.set(t, { autoAlpha: 0 }, 0);
    return t;
  };
  const toYou = tag('to you', badges[0].p.x, SPOT.y - 40, 'struct');
  const toCache = tag('into the cache', badges[1].p.x, SPOT.y - 40, 'bytes');
  const toNext = tag('next input', badges[2].p.x - 30, badges[2].p.y + 1, 'helps', 'end');
  // on 'three places' each arrow grows out to its badge; then each runs on to where it goes, on its cue
  const STUB = T('b1~three') - 0.1;
  arrows.forEach((a, i) => {
    S.add(gsap.set(a.line, { autoAlpha: 1 }), STUB + i * 0.15);
    S.add(gsap.fromTo(a.line, { drawSVG: '0%' }, { drawSVG: `${F[i] * 100}%`, duration: 0.45, ease: 'power2.out', immediateRender: false }), STUB + i * 0.15);
    S.add(fx.pop(badges[i], { d: 0.35 }), STUB + i * 0.15 + 0.3);
  });
  const extend = (a, f, at) => {
    S.add(gsap.fromTo(a.line, { drawSVG: `${f * 100}%` }, { drawSVG: '100%', duration: 0.5, ease: 'power2.inOut', immediateRender: false }), at);
    S.add(gsap.fromTo(a.head, { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(3)', immediateRender: false }), at + 0.45);
  };
  extend(A1, F[0], T('b1~to you') - 0.3);
  S.add(fx.in(toYou, { from: 'up', d: 0.35, dist: 8 }), T('b1~to you') - 0.1);
  extend(A2, F[1], T('b2~into') - 0.15);
  S.add(fx.in(cache, { from: 'fade', d: 0.4 }), T('b2~into') - 0.1);
  S.add(fx.in(toCache, { from: 'up', d: 0.35, dist: 8 }), T('b2~into'));
  extend(A3, F[2], T('b3') - 0.3);
  // the ten slots under the loop, numbered faintly until filled
  const slots = WORDS.map((_, k) => {
    const g = S.g();
    S.rect({ x: SLOT(k).x - SW / 2, y: SLOT(k).y - SH / 2, w: SW, h: SH, r: 12, stroke: '#ffffff', strokeOpacity: 0.22, sw: 2, dash: '6 6' }, g);
    g.num = S.text(String(k + 1), { x: SLOT(k).x, y: SLOT(k).y + 1, size: 22, anchor: 'middle', weight: 600, color: 'faint' }, g);
    return g;
  });
  S.set(slots, { autoAlpha: 0 }, 0);
  S.add(fx.in(slots, { from: 'up', d: 0.35, dist: 10, stagger: 0.04 }), 0.6);

  // ---------------------------------------------------------------- one turn of the loop for token k
  const CACHE_RUN = `M${SPOT.x},${SPOT.y} L${STACK.cx - 20},${SPOT.y} Q${STACK.cx},${SPOT.y} ${STACK.cx},${SPOT.y + 20} L${STACK.cx},${STACK.top - 14}`;
  const turn = (k, t0, o = {}) => {
    const d = o.d ?? 1.6, word = WORDS[k], stop = word === 'stop';
    const p = libToken(S, { text: word, x: SPOT.x, y: SPOT.y, size: 26, frame: stop, hidden: true });
    ignore(p);
    S.add(gsap.fromTo(p, { autoAlpha: 0, y: MB.y + 20 - SPOT.y }, { autoAlpha: 1, y: 0, duration: d * 0.22, ease: 'power3.out', immediateRender: false }), t0);
    const s = libToken(S, { text: word, x: SLOT(k).x, y: SLOT(k).y, size: 24, frame: stop, hidden: true });
    S.add(s.pop({ d: 0.4 }), t0 + d * 0.2);
    S.add(gsap.to(slots[k].num, { autoAlpha: 0, duration: 0.15 }), t0 + d * 0.2);
    if (stop) return { p, s };
    // (1) a copy runs down the line to you
    const c = ignore(libToken(S, { text: word, x: SPOT.x, y: SPOT.y, size: 26, hidden: true }, under));
    const tl = o.lapAt ?? t0 + d * 0.28;
    S.add(c.travel(A1.d, { d: d * 0.32, ease: 'power2.in', appear: true }), tl);
    S.add(c.out({ d: 0.15 }), tl + d * 0.3);
    S.add(lap.ping({ d: 0.5 }), tl + d * 0.3);
    // (2) a copy runs into the cache, and becomes its entry: a K|V slab from the arrow's tip into the next free slot
    const ts = o.slabAt ?? t0 + d * 0.3;
    const cc = ignore(libToken(S, { text: word, x: SPOT.x, y: SPOT.y, size: 26, hidden: true }, under));
    S.add(cc.travel(CACHE_RUN, { d: d * 0.26, ease: 'power2.in', appear: true }), ts);
    S.add(cc.out({ d: 0.12 }), ts + d * 0.22);
    S.add(cache.fill(k, { from: [STACK.cx, STACK.top], d: Math.max(0.18, d * 0.12) }), ts + d * 0.2);
    if (k > 0) {
      const plus = S.text('+1', { x: cache.frame.x + cache.frame.w + 16, y: cache.cells[k].cy + 1, size: 24, weight: 700, color: 'bytes' });
      S.set(plus, { autoAlpha: 0 }, 0);
      S.add(gsap.fromTo(plus, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -24, duration: 0.6, ease: 'power1.out', immediateRender: false }), ts + d * 0.42);
    }
    // (3) the token itself loops back in as the next input
    const tb = o.backAt ?? t0 + d * 0.62;
    S.add(p.travel(A3.d, { d: d * 0.3, ease: 'power2.in' }), tb);
    S.add(p.out({ d: 0.15 }), tb + d * 0.26);
    S.add(gsap.fromTo(mBg, { attr: { 'stroke-width': 3 } }, { attr: { 'stroke-width': 6 }, duration: 0.15, yoyo: true, repeat: 1, immediateRender: false }), tb + d * 0.3);
    return { p, s };
  };

  // ---------------------------------------------------------------- b1: Sunny; first, down the line to you
  turn(0, 1.1, { d: 1.6, lapAt: T('b1~you') - 0.05, slabAt: T('b2~into'), backAt: T('b3') - 0.2 });
  const stream = S.text('the stream: 1 of 3', { x: LAP.x, y: LAP.y + 0.354 * LAP.w + 34, size: 24, anchor: 'middle', weight: 600, color: 'muted' });
  S.set(stream, { autoAlpha: 0 }, 0);
  S.add(gsap.to(A1.line, { attr: { 'stroke-width': 6 }, duration: 0.3 }), 'b1~all');
  S.add(gsap.fromTo([badges[1], badges[2]], { opacity: 1 }, { opacity: 0.4, duration: 0.25, yoyo: true, repeat: 3, immediateRender: false }), 'b1~all');
  S.add(fx.in(stream, { from: 'up', d: 0.35, dist: 10 }), 'b1~stream');
  S.add(fx.out(stream, { d: 0.3 }), 'b2-0.2');
  S.add(gsap.to(A1.line, { attr: { 'stroke-width': 3.5 }, duration: 0.3 }), 'b2-0.2');

  // ---------------------------------------------------------------- b2: second, into the cache, a running record
  const LBL = { kv: 604, cache: 640, sub: 676, notes: 712 };
  // an icon and a text, centred together under the stack
  const row = (icon, text, y, tone, iconTone, size = 24) => {
    const g = S.g(), w = 30 + 10 + S.measure(text, { size, weight: 650 }), x0 = STACK.cx - w / 2;
    S.icon(icon, { x: x0 + 15, y, size: 30, color: iconTone }, g);
    S.text(text, { x: x0 + 40, y: y + 1, size, weight: 650, color: tone }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  };
  const cacheL = S.text('cache: a running record', { x: STACK.cx, y: LBL.cache, size: 28, anchor: 'middle', weight: 650, color: 'bytes' });
  const cacheS = S.text('of everything processed so far', { x: STACK.cx, y: LBL.sub, size: 24, anchor: 'middle', weight: 550, color: 'muted' });
  S.set([cacheL, cacheS], { autoAlpha: 0 }, 0);
  S.add(fx.in(cacheL, { from: 'up', d: 0.35, dist: 10 }), 'b2~cache');
  S.add(fx.in(cacheS, { from: 'up', d: 0.35, dist: 10 }), 'b2~record');
  const kept = row('ph:clock-duotone', 'kept work', LBL.sub, 'bytes', 'muted');
  S.add(fx.out(cacheS, { d: 0.3 }), 'b2~kept-0.1');
  S.add(fx.in(kept, { from: 'fade', d: 0.35 }), T('b2~kept') + 0.2);
  S.add(fx.pulse(cache.cells[0].slab, { scale: 1.08, d: 0.8 }), 'b2~kept');

  // ---------------------------------------------------------------- b3: keys and values, notes kept for this answer; the loop turns four times
  S.add(fx.out(kept, { d: 0.3 }), 'b3-0.1');
  const SPLIT = T('b3~two') - 0.05;
  S.add(gsap.to(whole, { autoAlpha: 0, duration: 0.3 }), SPLIT);
  S.add(gsap.fromTo(c0.base, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, immediateRender: false }), SPLIT);
  // K and V name the panel's two columns from below
  const kv = S.g(), half = c0.v.getBBox();
  S.text('K', { x: c0.x + (half.x - c0.x) / 2 - 1, y: LBL.kv, size: 24, anchor: 'middle', weight: 700, color: 'ink' }, kv);
  S.text('V', { x: half.x + half.width / 2, y: LBL.kv, size: 24, anchor: 'middle', weight: 700, color: 'ink' }, kv);
  S.set(kv, { autoAlpha: 0 }, 0);
  S.add(fx.in(kv, { from: 'fade', d: 0.3 }), SPLIT + 0.2);
  const kvS = S.text('keys and values, appended', { x: STACK.cx, y: LBL.sub, size: 24, anchor: 'middle', weight: 550, color: 'muted' });
  S.set(kvS, { autoAlpha: 0 }, 0);
  S.add(fx.in(kvS, { from: 'up', d: 0.35, dist: 10 }), SPLIT + 0.4);
  [1, 2, 3, 4].forEach((k, i) => turn(k, T('b3~numbers') + 0.5 + i * 1.65));
  const notes = row('ph:notepad-duotone', 'notes, kept for this answer', LBL.notes, 'ink', 'ink');
  S.add(fx.in(notes, { from: 'up', d: 0.4, dist: 10 }), 'b3~notes-0.1');

  // ---------------------------------------------------------------- b4: third, the next input: autoregressive; decode, one token at a time
  S.add(fx.out([kvS, notes], { d: 0.3, stagger: 0 }), 'b4-0.15');
  S.add(fx.in(toNext, { from: 'right', d: 0.35, dist: 8 }), T('b4~next') - 0.1);
  S.add(gsap.to(A3.line, { attr: { 'stroke-width': 6 }, duration: 0.3, yoyo: true, repeat: 1 }), 'b4~token');
  const auto = S.text('autoregressive', { x: 960, y: 592, size: 40, anchor: 'middle', weight: 700, family: 'display', color: 'helps' });
  const autoS = S.text('output becomes input', { x: 960, y: 632, size: 26, anchor: 'middle', weight: 600, color: 'muted' });
  S.set([auto, autoS], { autoAlpha: 0 }, 0);
  S.add(fx.in(auto, { from: 'up', d: 0.45, dist: 12 }), 'b4~autoregressive-0.1');
  S.add(fx.in(autoS, { from: 'up', d: 0.35, dist: 10 }), T('b4~autoregressive') + 0.4);
  const dec = S.text('decode: one token at a time', { x: 206, y: 722, size: 26, weight: 650, color: 'ink' });
  S.set(dec, { autoAlpha: 0 }, 0);
  S.add(fx.in(dec, { from: 'left', d: 0.35, dist: 12 }), 'b4~decode');
  turn(5, T('b4~answer') - 0.4, { d: 1.4 });
  turn(6, T('b4~decode') + 0.4, { d: 1.2 });
  // several at once? the ghosts bounce off slots 8 to 10
  const SEV = T('b4~several') - 0.1;
  [7, 8, 9].forEach((k, i) => {
    const g = ignore(libToken(S, { text: '', x: SLOT(k).x, y: SLOT(k).y, w: 110, h: 44, r: 12, decorative: true, hidden: true }));
    S.add(gsap.fromTo(g, { autoAlpha: 0, y: -110 }, { autoAlpha: 0.8, y: -6, duration: 0.3, ease: 'power2.in', immediateRender: false }), SEV + i * 0.05);
    S.add(gsap.to(g, { y: -70, autoAlpha: 0, duration: 0.45, ease: 'power2.out' }), SEV + 0.32 + i * 0.05);
  });
  const lock = S.g();
  S.circle({ x: SLOT(8).x + SW / 2 - 4, y: SLOT(8).y - SH / 2 + 2, r: 18, fill: '#0c1326', stroke: 'muted', sw: 2 }, lock);
  const lockC = S.icon('ph:lock-simple-duotone', { x: SLOT(8).x + SW / 2 - 4, y: SLOT(8).y - SH / 2 + 1, size: 24, color: 'ink' }, lock);
  const lockO = S.icon('ph:lock-simple-open-duotone', { x: SLOT(8).x + SW / 2 - 4, y: SLOT(8).y - SH / 2 + 1, size: 24, color: 'helps' }, lock);
  ignore(lock);
  const needs = S.text('needs token 8', { x: SLOT(8).x, y: SLOT(8).y + SH / 2 + 30, size: 24, anchor: 'middle', weight: 600, color: 'muted' });
  S.set([lock, lockO, needs], { autoAlpha: 0 }, 0);
  S.add(fx.pop(lock, { d: 0.4 }), SEV + 0.7);
  S.add(fx.in(needs, { from: 'up', d: 0.3, dist: 8 }), SEV + 0.8);
  const N8 = T('b4~nine') - 0.2;
  turn(7, N8, { d: 1.0 });
  S.add(gsap.to(lockC, { autoAlpha: 0, duration: 0.15 }), N8 + 0.45);
  S.add(gsap.to(lockO, { autoAlpha: 1, duration: 0.15 }), N8 + 0.45);
  S.add(fx.out([lock, needs], { d: 0.3, stagger: 0 }), N8 + 0.9);
  turn(8, N8 + 0.8, { d: 1.0 });

  // ---------------------------------------------------------------- b5: until a stop token or a length limit; the server feeds itself while it feeds you
  S.add(fx.out([auto, autoS, dec, cacheL], { d: 0.35, stagger: 0 }), 'b5-0.1');
  const STOP = T('b5~stop') - 0.2;
  turn(9, STOP, { d: 1.0 });
  const END_Y = 718;
  const done = S.text('done', { x: SLOT(9).x, y: END_Y, size: 26, anchor: 'middle', weight: 700, color: 'helps' });
  S.set(done, { autoAlpha: 0 }, 0);
  S.add(fx.in(done, { from: 'up', d: 0.3, dist: 8 }), STOP + 0.5);
  S.add(gsap.to([...arrows.flatMap(a => [a.line, a.head]), ...badges, toYou, toCache, toNext], { opacity: 0.35, duration: 0.4 }), STOP + 0.6);
  // the other way out, beside 'done' over the last slots
  const gauge = S.g(), gw = 40 + S.measure('or a length limit', { size: 26, weight: 600 });
  const gx = SLOT(9).x - SW / 2 - 40 - gw;
  S.icon('ph:gauge-duotone', { x: gx + 17, y: END_Y, size: 34, color: 'muted' }, gauge);
  S.text('or a length limit', { x: gx + 40, y: END_Y + 1, size: 26, weight: 600, color: 'muted' }, gauge);
  S.set(gauge, { autoAlpha: 0 }, 0);
  S.add(fx.in(gauge, { from: 'up', d: 0.35, dist: 10 }), 'b5~length');
  const grow = S.text('+1 entry per turn', { x: STACK.cx, y: LBL.cache, size: 28, anchor: 'middle', weight: 650, color: 'bytes' });
  S.set(grow, { autoAlpha: 0 }, 0);
  S.add(fx.in(grow, { from: 'up', d: 0.35, dist: 10 }), 'b5~Each');
  const FEED = T('b5~feeds') - 0.1;
  S.add(gsap.to([A1.line, A1.head, A3.line, A3.head, badges[0], badges[2], toYou, toNext], { opacity: 1, duration: 0.3 }), FEED);
  S.add(gsap.to([A1.line, A3.line], { attr: { 'stroke-width': 6 }, duration: 0.3 }), FEED);
  const take = S.takeaway('feeding itself while feeding you', { tone: 'helps' });
  S.add(fx.in(take, { from: 'up', d: 0.5 }), FEED + 0.2);
});
