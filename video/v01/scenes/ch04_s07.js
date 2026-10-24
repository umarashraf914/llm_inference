/* ch04_s07 · the route one token takes (fig 32)
   One token, end to end: router (which machine), scheduler (batch with others), prefill (read the prompt
   in, make its notes), KV transfer (in large systems, hand the notes to another machine), decode (one
   token at a time), screen (streamed to you). Each box has its own problem and fix; later videos improve
   one each. Underneath all six: a token takes about 30 ms. Where does that time go? */
V.scene('ch04_s07', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const CW = 240, GAP = 36, X0 = 150, CY0 = 400, CH = 180, PATHY = 362, SUBY = 624;
  const cx = i => X0 + i * (CW + GAP) + CW / 2;
  const STATIONS = [
    { name: 'router', icon: 'ph:signpost-duotone', sub: 'which machine', cue: 'b1~router' },
    { name: 'scheduler', icon: 'ph:queue-duotone', sub: 'batch with others', cue: 'b1~scheduler' },
    { name: 'prefill', icon: 'ph:file-text-duotone', sub: 'read the prompt in', cue: 'b1~prefill' },
    { name: 'KV transfer', icon: 'ph:arrows-left-right-duotone', sub: 'hand the notes over', cue: 'b2~K' },
    { name: 'decode', icon: 'ph:arrows-clockwise-duotone', sub: 'one token at a time', cue: 'b2~Decode' },
    { name: 'screen', icon: 'ph:laptop-duotone', sub: 'streamed to you', cue: 'b2~your' },
  ];

  // ---------------------------------------------------------------- the route: header, six cards, the path the token rides
  const world = S.g();
  const head = S.text('One token, end to end', { x: 960, y: 120, size: 44, anchor: 'middle', weight: 700, family: 'display', color: 'ink' }, world);
  S.set(head, { autoAlpha: 0 }, 0);
  S.add(fx.in(head, { from: 'up', d: 0.5 }), 0.15);
  const path = ignore(S.line({ x1: 110, y1: PATHY, x2: cx(5), y2: PATHY, stroke: '#ffffff', strokeOpacity: 0.22, sw: 3 }, world));
  const drops = STATIONS.map((_, i) => ignore(S.line({ x1: cx(i), y1: PATHY, x2: cx(i), y2: CY0, stroke: '#ffffff', strokeOpacity: 0.22, sw: 3 }, world)));
  S.set([path, ...drops], { autoAlpha: 0 }, 0);
  S.add(gsap.set([path, ...drops], { autoAlpha: 1 }), 0.5);
  S.add(fx.draw(path, { d: 1.0 }), 0.5);
  S.add(fx.draw(drops, { d: 0.3, stagger: 0.12 }), 0.8);
  const cards = STATIONS.map((st, i) => {
    const g = S.g(null, world);
    const x = cx(i) - CW / 2;
    S.rect({ x, y: CY0, w: CW, h: CH, r: 20, fill: '#0c1326' }, g);
    g.bg = S.rect({ x, y: CY0, w: CW, h: CH, r: 20, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.2, sw: 2 }, g);
    g.lit = S.rect({ x, y: CY0, w: CW, h: CH, r: 20, fill: 'url(#card-struct)', stroke: 'struct', sw: 3 }, g);
    S.set(g.lit, { autoAlpha: 0 }, 0);
    S.icon(st.icon, { x: x + 40, y: CY0 + 40, size: 40, color: 'ink' }, g);
    S.text(st.name, { x: x + 70, y: CY0 + 41, size: 28, weight: 700, color: 'ink' }, g);
    g.sub = S.text(st.sub, { x: cx(i), y: SUBY, size: 26, anchor: 'middle', weight: 600, color: 'muted' }, world);
    S.set([g, g.sub], { autoAlpha: 0 }, 0);
    S.add(fx.in(g, { from: 'up', d: 0.45, dist: 14 }), 0.7 + i * 0.15);
    return g;
  });
  // the token, and the stop at each card
  const tok = libToken(S, { text: 'token', x: 150, y: PATHY, size: 24, hidden: true }, world);
  S.add(tok.pop({ d: 0.4 }), 'b1~token-0.2');
  const visit = (i, at) => {
    S.add(tok.moveTo([cx(i), PATHY], { d: 0.55, ease: 'power2.inOut' }), at - 0.2);
    S.add(gsap.to(cards[i].lit, { autoAlpha: 1, duration: 0.3 }), at + 0.2);
    S.add(fx.in(cards[i].sub, { from: 'up', d: 0.3, dist: 10 }), at + 0.25);
    if (i > 0) {
      S.add(gsap.to(cards[i - 1].lit, { autoAlpha: 0.35, duration: 0.3 }), at);
      S.add(fx.out(cards[i - 1].sub, { d: 0.25 }), at - 0.1);
    }
  };
  STATIONS.forEach((st, i) => visit(i, T(st.cue)));
  const DEMO = i => ({ x: cx(i), y: CY0 + 120 });

  // ---------------------------------------------------------------- b1: scheduler: others join; prefill: the notes build
  const others = [-1, 1, 2].map((k, j) => {
    const c = ignore(libToken(S, { text: '', x: cx(1) + (j - 1) * 46, y: DEMO(1).y, w: 38, h: 26, r: 8, state: { color: ['#86b6ff', '#5b8def', '#8f8dff'][j] }, decorative: true, hidden: true }, world));
    S.add(c.pop({ d: 0.35 }), T('b1~scheduler') + 0.35 + j * 0.12);
    return c;
  });
  const mine = ignore(libToken(S, { text: '', x: cx(1) - 92, y: DEMO(1).y, w: 38, h: 26, r: 8, decorative: true, hidden: true }, world));
  S.add(mine.pop({ d: 0.35 }), T('b1~scheduler') + 0.3);
  const stack = S.g(null, world);
  const slabs = [0, 1, 2, 3, 4].map(k => S.g(null, stack));
  slabs.forEach((g, k) => {
    S.rect({ x: cx(2) - 62, y: CY0 + 150 - k * 13, w: 58, h: 9, r: 2, fill: 'bytes', fillOpacity: 0.85 }, g);
    S.rect({ x: cx(2) + 4, y: CY0 + 150 - k * 13, w: 58, h: 9, r: 2, fill: 'bytes', fillOpacity: 0.6 }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    S.add(gsap.fromTo(g, { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.2, immediateRender: false }), T('b1~reading') + k * 0.25);
  });
  ignore(stack);

  // ---------------------------------------------------------------- b2: another machine; the KV transfer; decode; your screen
  const mach = [2, 3].map(i => {
    const m = libServer(S, { x: cx(i), y: 740, w: 150, detail: 'min', seed: i }, world);
    S.set(m, { autoAlpha: 0 }, 0);
    S.add(fx.in(m, { from: 'up', d: 0.4, dist: 12 }), T('b2~another') + (i - 2) * 0.2);
    return m;
  });
  // the notes slide from the first machine to the second
  const moving = S.g(null, world);
  for (let k = 0; k < 5; k++) {
    S.rect({ x: cx(2) - 62, y: 700 - k * 11, w: 58, h: 8, r: 2, fill: 'bytes', fillOpacity: 0.85 }, moving);
    S.rect({ x: cx(2) + 4, y: 700 - k * 11, w: 58, h: 8, r: 2, fill: 'bytes', fillOpacity: 0.6 }, moving);
  }
  ignore(moving);
  S.set(moving, { autoAlpha: 0 }, 0);
  const KV = T('b2~transfer') - 0.1;
  S.add(gsap.fromTo(moving, { autoAlpha: 0, x: 0 }, { autoAlpha: 1, duration: 0.25, immediateRender: false }), KV);
  S.add(gsap.to(moving, { x: cx(3) - cx(2), duration: 0.9, ease: 'power2.inOut' }), KV + 0.25);
  const kvL = S.g(null, world);
  S.text('K', { x: cx(3) - 33, y: 630 - 16, size: 22, anchor: 'middle', weight: 700, color: 'ink' }, kvL);
  S.text('V', { x: cx(3) + 33, y: 630 - 16, size: 22, anchor: 'middle', weight: 700, color: 'ink' }, kvL);
  ignore(kvL);
  S.set(kvL, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(kvL, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, yoyo: true, repeat: 3, immediateRender: false }), 'b2~keys');
  // decode: a mini loop spinning inside its card
  const loopIc = S.icon('ph:arrows-clockwise-duotone', { x: DEMO(4).x, y: DEMO(4).y, size: 54, color: 'helps' }, world);
  S.set(loopIc, { autoAlpha: 0 }, 0);
  S.add(gsap.to(loopIc, { autoAlpha: 1, duration: 0.3 }), T('b2~Decode') + 0.2);
  S.add(gsap.fromTo(loopIc, { rotation: 0, svgOrigin: `${DEMO(4).x} ${DEMO(4).y}` }, { rotation: 1440, svgOrigin: `${DEMO(4).x} ${DEMO(4).y}`, duration: 8, ease: 'none', immediateRender: false }), T('b2~Decode') + 0.2);
  // screen: a teal cable into the laptop
  const cab = ignore(S.line({ x1: cx(5) - 100, y1: DEMO(5).y, x2: cx(5) - 30, y2: DEMO(5).y, stroke: 'helps', sw: 5, cap: 'round' }, world));
  const lapIc = S.icon('ph:laptop-duotone', { x: cx(5) + 20, y: DEMO(5).y, size: 60, color: 'ink' }, world);
  S.set([cab, lapIc], { autoAlpha: 0 }, 0);
  S.add(fx.in([lapIc, cab], { from: 'fade', d: 0.35, stagger: 0.15 }), T('b2~your') + 0.2);

  // ---------------------------------------------------------------- b3: each box its own problem and fix; a map worth returning to
  const B3 = T('b3') - 0.15;
  S.add(fx.out(cards[5].sub, { d: 0.3 }), B3);
  S.add(gsap.to(cards.map(c => c.lit), { autoAlpha: 1, duration: 0.4 }), B3 + 0.1);
  S.add(gsap.to([...mach, moving, kvL], { autoAlpha: 0, duration: 0.4 }), B3);
  const l1 = S.text('each box: its own problem, its own fix', { x: 960, y: 690, size: 32, anchor: 'middle', weight: 650, color: 'ink' }, world);
  const l2 = S.text('every term made precise as we go', { x: 960, y: 736, size: 28, anchor: 'middle', weight: 550, color: 'muted' }, world);
  S.set([l1, l2], { autoAlpha: 0 }, 0);
  S.add(fx.in(l1, { from: 'up', d: 0.4, dist: 10 }), 'b3~box');
  S.add(fx.in(l2, { from: 'up', d: 0.4, dist: 10 }), 'b3~fix');
  const brk = S.bracket({ x1: X0, x2: cx(5) + CW / 2, y: PATHY - 30, up: true, label: 'later videos: one box each', tone: 'struct', size: 26 }, world);
  S.set(brk, { autoAlpha: 0 }, 0);
  S.add(fx.in(brk, { from: 'down', d: 0.4, dist: 10 }), 'b3~later');
  S.add(fx.out(tok, { d: 0.3 }), 'b3~later-0.2');
  const pin = S.icon('ph:push-pin-duotone', { x: 960 - S.measure('One token, end to end', { size: 44, weight: 700, family: 'display' }) / 2 - 40, y: 112, size: 44, color: 'bytes' }, world);
  S.set(pin, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(pin, { autoAlpha: 0, y: -50 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'bounce.out' }), 'b3~map');

  // ---------------------------------------------------------------- b4: underneath all six, one question; 30 ms; where does that time go?
  const UN = T('b4~Underneath') - 0.1;
  S.add(fx.out([l1, l2, brk], { d: 0.35, stagger: 0 }), UN);
  S.add(gsap.to([...cards, path, ...drops, loopIc, cab, lapIc, ...slabs, ...others, mine], { opacity: 0.45, duration: 0.5 }), UN);
  const band = S.g(null, world);
  S.rect({ x: X0, y: CY0 + CH + 40, w: cx(5) + CW / 2 - X0, h: 74, r: 18, fill: 'bytes', fillOpacity: 0.08, stroke: 'bytes', strokeOpacity: 0.5, sw: 2 }, band);
  S.text('this film: the ground underneath', { x: 960, y: CY0 + CH + 78, size: 32, anchor: 'middle', weight: 700, color: 'ink' }, band);
  S.set(band, { autoAlpha: 0 }, 0);
  S.add(fx.in(band, { from: 'up', d: 0.5, dist: 16 }), UN + 0.4);
  // the camera tilts down to the question
  const QY = 1380, qg = S.g();
  const ms = S.text('30 ms', { x: 900, y: QY + 30, size: 150, anchor: 'end', weight: 800, family: 'display', color: 'ink' }, qg);
  const sw = libStopwatch(S, { x: 1050, y: QY - 10, size: 150, span: 60, readout: 'none', tone: 'struct' }, qg);
  const q = S.text('?', { x: 1250, y: QY + 34, size: 170, anchor: 'middle', weight: 800, family: 'display', color: 'bytes' }, qg);
  S.set([ms, sw, q], { autoAlpha: 0 }, 0);
  const TILT = T('b4~thirty') - 0.6;
  S.add(fx.cam({ x: 960, y: QY - 20, scale: 1, d: 1.4, ease: 'power2.inOut' }), TILT);
  S.add(gsap.to([ms, sw], { autoAlpha: 1, duration: 0.4 }), TILT + 0.7);
  S.add(gsap.to(world, { autoAlpha: 0, duration: 0.6 }), TILT + 0.6);   // the route has left the frame
  S.call(() => world.setAttribute('data-audit', 'ignore'), TILT);
  S.add(sw.run(0, 30, { d: 0.6 }), TILT + 1.0);
  S.add(gsap.fromTo(q, { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 60%' }, { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power2.out', immediateRender: false }), 'b4~that');
});
