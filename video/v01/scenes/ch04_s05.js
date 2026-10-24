/* ch04_s05 · the loop on the server (fig 30)
   Each new token goes three places: (1) down the line to you, (2) into the cache, a running record of
   everything processed (each token appends its keys and values: notes kept for this answer), and (3) back
   in as the next input: autoregressive. So decode makes one token at a time; token 9 needs token 8.
   The loop runs until a stop token or a length limit; each turn the cache grows by one entry.
   The loop really runs: Sunny in b1, tomorrow…winds in b3, and…evening in b4, stop in b5. */
V.scene('ch04_s05', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const WORDS = ['Sunny', 'tomorrow', 'with', 'light', 'winds', 'and', 'a', 'warm', 'evening', 'stop'];
  const SPOT = { x: 960, y: 360 }, MB = { x: 750, y: 445, w: 420, h: 150 };
  const SLOT = k => ({ x: 276 + k * 152, y: 770 }), SW = 140, SH = 52;
  const STACK = { x: 1540, w: 200, base: 610, step: 21, h: 15 };
  const slabY = k => STACK.base - k * STACK.step;

  // ---------------------------------------------------------------- the loop: the model, the spot, three arrows, the laptop, the cache, the slots
  const model = S.g();
  S.rect({ x: MB.x, y: MB.y, w: MB.w, h: MB.h, r: 24, fill: '#0c1326' }, model);
  const mBg = S.rect({ x: MB.x, y: MB.y, w: MB.w, h: MB.h, r: 24, fill: 'url(#card-struct)', stroke: 'struct', sw: 3 }, model);
  S.text('run the whole model', { x: 960, y: MB.y + MB.h / 2 + 1, size: 34, anchor: 'middle', weight: 700, color: 'ink' }, model);
  S.set(model, { autoAlpha: 0 }, 0);
  S.add(fx.in(model, { from: 'scale', scale: 0.92, d: 0.6 }), 0.2);
  const lap = libDevice(S, { x: 190, y: 380, w: 160 });
  S.set(lap, { autoAlpha: 0 }, 0);
  S.add(fx.in(lap, { from: 'left', d: 0.5, dist: 20 }), 0.5);
  const A1 = S.arrow({ x1: 880, y1: SPOT.y, x2: 290, y2: SPOT.y + 10, color: 'struct', sw: 3.5, head: 14 });
  const A2 = S.arrow({ x1: 1040, y1: SPOT.y, x2: STACK.x - 20, y2: SPOT.y + 30, color: 'bytes', sw: 3.5, head: 14 });
  const A3 = S.arrow({ x1: 905, y1: SPOT.y + 24, x2: MB.x + 6, y2: MB.y + 60, bend: 60, color: 'helps', sw: 3.5, head: 14 });
  const arrows = [A1, A2, A3];
  arrows.forEach(a => { ignore(a); S.set([a.line, a.head], { autoAlpha: 0 }, 0); });
  const badge = (n, x, y, tone) => {
    const g = S.g();
    S.circle({ x, y, r: 17, fill: '#0c1326', stroke: tone, sw: 2 }, g);
    S.text(String(n), { x, y: y + 1, size: 22, anchor: 'middle', weight: 700, color: 'ink' }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  };
  const badges = [badge(1, 850, 326, 'struct'), badge(2, 1074, 326, 'bytes'), badge(3, 868, 418, 'helps')];
  // stubs on 'three places', then each arrow extends on its cue
  const STUB = T('b1~three') - 0.1;
  arrows.forEach((a, i) => {
    S.add(gsap.set(a.line, { autoAlpha: 1 }), STUB + i * 0.15);
    S.add(gsap.fromTo(a.line, { drawSVG: '0%' }, { drawSVG: '22%', duration: 0.35, ease: 'power2.out', immediateRender: false }), STUB + i * 0.15);
    S.add(fx.in(badges[i], { from: 'fade', d: 0.3 }), STUB + i * 0.15 + 0.1);
  });
  const extend = (a, at) => {
    S.add(gsap.fromTo(a.line, { drawSVG: '22%' }, { drawSVG: '100%', duration: 0.5, ease: 'power2.inOut', immediateRender: false }), at);
    S.add(gsap.fromTo(a.head, { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(3)', immediateRender: false }), at + 0.45);
  };
  extend(A1, T('b1~to you') - 0.3);
  extend(A2, T('b2~into') - 0.15);
  extend(A3, T('b3') - 0.3);
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
  const slabs = [];
  const turn = (k, t0, o = {}) => {
    const d = o.d ?? 1.6, word = WORDS[k], stop = word === 'stop';
    const p = libToken(S, { text: word, x: SPOT.x, y: SPOT.y, size: 26, frame: stop, hidden: true });
    ignore(p);
    S.add(gsap.fromTo(p, { autoAlpha: 0, y: 110 }, { autoAlpha: 1, y: 0, duration: d * 0.22, ease: 'power3.out', immediateRender: false }), t0);
    const s = libToken(S, { text: word, x: SLOT(k).x, y: SLOT(k).y, size: 24, frame: stop, hidden: true });
    S.add(s.pop({ d: 0.4 }), t0 + d * 0.2);
    S.add(gsap.to(slots[k].num, { autoAlpha: 0, duration: 0.15 }), t0 + d * 0.2);
    if (stop) return { p, s };
    if (!o.noLaptop) {
      const c = ignore(libToken(S, { text: word, x: SPOT.x, y: SPOT.y, size: 26, hidden: true }));
      const tl = o.lapAt ?? t0 + d * 0.28;
      S.add(c.travel(`M${SPOT.x},${SPOT.y} L270,${SPOT.y + 10}`, { d: d * 0.32, ease: 'power2.in', appear: true }), tl);
      S.add(c.out({ d: 0.15 }), tl + d * 0.3);
      S.add(lap.ping({ d: 0.5 }), tl + d * 0.3);
    }
    if (!o.noSlab) {
      const sl = S.g();
      const halves = k > 0 || o.split;
      ignore(sl);
      sl.whole = S.rect({ x: STACK.x, y: slabY(k), w: STACK.w, h: STACK.h, r: 3, fill: 'url(#bar-bytes)', stroke: 'bytes', sw: 1 }, sl);
      sl.K = S.rect({ x: STACK.x, y: slabY(k), w: STACK.w / 2 - 4, h: STACK.h, r: 3, fill: 'bytes', fillOpacity: 0.85 }, sl);
      sl.V = S.rect({ x: STACK.x + STACK.w / 2 + 4, y: slabY(k), w: STACK.w / 2 - 4, h: STACK.h, r: 3, fill: 'bytes', fillOpacity: 0.6 }, sl);
      S.set(halves ? sl.whole : [sl.K, sl.V], { autoAlpha: 0 }, 0);
      S.set(sl, { autoAlpha: 0 }, 0);
      const ts = o.slabAt ?? t0 + d * 0.3;
      S.add(gsap.fromTo(sl, { autoAlpha: 0, x: SPOT.x + 40 - STACK.x, y: SPOT.y - slabY(k) }, { autoAlpha: 1, x: 0, y: 0, duration: d * 0.3, ease: 'power2.inOut', immediateRender: false }), ts);
      if (k > 0) {
        const plus = S.text('+1', { x: STACK.x + STACK.w + 26, y: slabY(k) + 8, size: 24, weight: 700, color: 'bytes' });
        S.set(plus, { autoAlpha: 0 }, 0);
        S.add(gsap.fromTo(plus, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -24, duration: 0.6, ease: 'power1.out', immediateRender: false }), ts + d * 0.3);
      }
      slabs[k] = sl;
    }
    const tb = o.backAt ?? t0 + d * 0.62;
    if (o.back !== false) {
      S.add(p.travel(`M${SPOT.x},${SPOT.y} C820,${SPOT.y + 10} 700,430 ${MB.x + 18},${MB.y + 62}`, { d: d * 0.3, ease: 'power2.in' }), tb);
      S.add(p.out({ d: 0.15 }), tb + d * 0.26);
      S.add(gsap.fromTo(mBg, { attr: { 'stroke-width': 3 } }, { attr: { 'stroke-width': 6 }, duration: 0.15, yoyo: true, repeat: 1, immediateRender: false }), tb + d * 0.3);
    }
    return { p, s };
  };

  // ---------------------------------------------------------------- b1: Sunny; first, down the line to you
  const t1 = turn(0, 1.1, { d: 1.6, lapAt: T('b1~you') - 0.05, slabAt: T('b2~into'), backAt: T('b3') - 0.2 });
  const stream = S.text('the stream: 1 of 3', { x: 580, y: 412, size: 26, anchor: 'middle', weight: 600, color: 'muted' });
  S.set(stream, { autoAlpha: 0 }, 0);
  S.add(gsap.to(A1.line, { attr: { 'stroke-width': 6 }, duration: 0.3 }), 'b1~all');
  S.add(gsap.fromTo([badges[1], badges[2]], { opacity: 1 }, { opacity: 0.4, duration: 0.25, yoyo: true, repeat: 3, immediateRender: false }), 'b1~all');
  S.add(fx.in(stream, { from: 'up', d: 0.35, dist: 10 }), 'b1~stream');
  S.add(fx.out(stream, { d: 0.3 }), 'b2-0.2');
  S.add(gsap.to(A1.line, { attr: { 'stroke-width': 3.5 }, duration: 0.3 }), 'b2-0.2');

  // ---------------------------------------------------------------- b2: second, into the cache, a running record
  const cacheL = S.text('cache: a running record', { x: STACK.x + STACK.w / 2, y: 660, size: 28, anchor: 'middle', weight: 650, color: 'bytes' });
  const cacheS = S.text('of everything processed so far', { x: STACK.x + STACK.w / 2, y: 698, size: 24, anchor: 'middle', weight: 550, color: 'muted' });
  S.set([cacheL, cacheS], { autoAlpha: 0 }, 0);
  S.add(fx.in(cacheL, { from: 'up', d: 0.35, dist: 10 }), 'b2~cache');
  S.add(fx.in(cacheS, { from: 'up', d: 0.35, dist: 10 }), 'b2~record');
  const kept = S.g();
  S.icon('ph:clock-duotone', { x: STACK.x + 30, y: 698, size: 30, color: 'muted' }, kept);
  S.text('kept work', { x: STACK.x + 54, y: 699, size: 24, weight: 650, color: 'bytes' }, kept);
  S.set(kept, { autoAlpha: 0 }, 0);
  S.add(fx.out(cacheS, { d: 0.3 }), 'b2~kept-0.1');
  S.add(fx.in(kept, { from: 'fade', d: 0.35 }), T('b2~kept') + 0.2);
  S.add(fx.pulse(slabs[0], { scale: 1.08, d: 0.8 }), 'b2~kept');

  // ---------------------------------------------------------------- b3: keys and values, notes kept for this answer; the loop turns four times
  S.add(fx.out(kept, { d: 0.3 }), 'b3-0.1');
  const SPLIT = T('b3~two') - 0.05;
  S.add(gsap.to(slabs[0].whole, { autoAlpha: 0, duration: 0.3 }), SPLIT);
  S.add(gsap.fromTo([slabs[0].K, slabs[0].V], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, immediateRender: false }), SPLIT);
  const kv = S.g();
  S.text('K', { x: STACK.x + STACK.w / 4 - 2, y: slabY(0) - 18, size: 24, anchor: 'middle', weight: 700, color: 'ink' }, kv);
  S.text('V', { x: STACK.x + 3 * STACK.w / 4 + 2, y: slabY(0) - 18, size: 24, anchor: 'middle', weight: 700, color: 'ink' }, kv);
  S.set(kv, { autoAlpha: 0 }, 0);
  S.add(fx.in(kv, { from: 'fade', d: 0.3 }), SPLIT + 0.2);
  S.add(fx.out(kv, { d: 0.3 }), T('b3~Think') - 0.2);
  const kvS = S.text('keys and values, appended', { x: STACK.x + STACK.w / 2, y: 698, size: 24, anchor: 'middle', weight: 550, color: 'muted' });
  S.set(kvS, { autoAlpha: 0 }, 0);
  S.add(fx.in(kvS, { from: 'up', d: 0.35, dist: 10 }), SPLIT + 0.4);
  [1, 2, 3, 4].forEach((k, i) => turn(k, T('b3~numbers') + 0.5 + i * 1.65));
  const notes = S.g();
  S.icon('ph:notepad-duotone', { x: 1460, y: 500, size: 52, color: 'ink' }, notes);
  S.text('notes, kept for this answer', { x: 1500, y: 560, size: 24, anchor: 'end', weight: 600, color: 'ink' }, notes);
  S.set(notes, { autoAlpha: 0 }, 0);
  S.add(fx.in(notes, { from: 'up', d: 0.4, dist: 12 }), 'b3~notes-0.1');

  // ---------------------------------------------------------------- b4: third, the next input: autoregressive; decode, one token at a time
  S.add(fx.out([kvS, notes], { d: 0.3, stagger: 0 }), 'b4-0.15');
  S.add(gsap.to(A3.line, { attr: { 'stroke-width': 6 }, duration: 0.3, yoyo: true, repeat: 1 }), 'b4~token');
  const auto = S.text('autoregressive', { x: 960, y: 648, size: 40, anchor: 'middle', weight: 700, family: 'display', color: 'helps' });
  const autoS = S.text('output becomes input', { x: 960, y: 690, size: 26, anchor: 'middle', weight: 600, color: 'muted' });
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
  const done = S.text('done', { x: SLOT(9).x, y: SLOT(9).y - SH / 2 - 22, size: 26, anchor: 'middle', weight: 700, color: 'helps' });
  S.set(done, { autoAlpha: 0 }, 0);
  S.add(fx.in(done, { from: 'up', d: 0.3, dist: 8 }), STOP + 0.5);
  S.add(gsap.to(arrows.flatMap(a => [a.line, a.head]), { opacity: 0.35, duration: 0.4 }), STOP + 0.6);
  const gauge = S.g();
  S.icon('ph:gauge-duotone', { x: 1290, y: 668, size: 44, color: 'muted' }, gauge);
  S.text('length limit', { x: 1320, y: 669, size: 26, weight: 600, color: 'muted' }, gauge);
  S.set(gauge, { autoAlpha: 0 }, 0);
  S.add(fx.in(gauge, { from: 'up', d: 0.35, dist: 10 }), 'b5~length');
  const grow = S.text('+1 entry per turn', { x: STACK.x + STACK.w / 2, y: 660, size: 28, anchor: 'middle', weight: 650, color: 'bytes' });
  S.set(grow, { autoAlpha: 0 }, 0);
  S.add(fx.in(grow, { from: 'up', d: 0.35, dist: 10 }), 'b5~Each');
  const FEED = T('b5~feeds') - 0.1;
  S.add(gsap.to([A1.line, A1.head, A3.line, A3.head], { opacity: 1, duration: 0.3 }), FEED);
  S.add(gsap.to([A1.line, A3.line], { attr: { 'stroke-width': 6 }, duration: 0.3 }), FEED);
  const take = S.takeaway('feeding itself while feeding you', { tone: 'helps' });
  S.add(fx.in(take, { from: 'up', d: 0.5 }), FEED + 0.2);
});
