/* ch04_s06 · two things called re-sending (fig 31)
   Within one answer nothing is re-sent: the server holds the state (its notes, in the cache). Between
   turns everything is: the next message is a new request carrying the whole conversation, because
   officially the server is stateless. Its notes may survive, making the repeat cheap to process, but the
   text still travels every turn. Per token nothing repeats; per turn everything does. */
V.scene('ch04_s06', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const PY = 220, PH = 480, CY = 480;

  const title = S.text('Two things called re-sending', { x: 960, y: 140, size: 44, anchor: 'middle', weight: 700, family: 'display', color: 'ink' });
  S.add(fx.in(title, { from: 'up', d: 0.5 }), 0.15);

  // ---------------------------------------------------------------- two miniature wire scenes
  const panel = (x0, head) => {
    const g = S.g();
    g.border = S.rect({ x: x0, y: PY, w: 820, h: PH, r: 26, fill: '#0c1326', fillOpacity: 0.6, stroke: '#ffffff', strokeOpacity: 0.16, sw: 2 }, g);
    S.text(head, { x: x0 + 410, y: PY + 52, size: 32, anchor: 'middle', weight: 700, color: 'ink' }, g);
    g.lap = libDevice(S, { x: x0 + 130, y: CY, w: 140 }, g);
    g.srv = libServer(S, { x: x0 + 680, y: CY, w: 180, detail: 'lite', seed: x0 % 7 }, g);
    g.cable = ignore(S.line({ x1: x0 + 214, y1: CY, x2: x0 + 584, y2: CY, stroke: 'faint', sw: 3 }, g));
    Object.assign(g, { x0, cx: x0 + 410 });
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  };
  const L = panel(100, 'Within one answer'), R = panel(1000, 'Between two turns');
  S.add(fx.in(L, { from: 'up', d: 0.6 }), 0.4);
  S.add(fx.in(R, { from: 'up', d: 0.6 }), 0.6);
  const verdict = (p, a, b) => {
    const g = S.g();
    g.a = S.text(a, { x: p.cx, y: PY + PH + 52, size: 30, anchor: 'middle', weight: 700, color: 'ink' }, g);
    g.b = b ? S.text(b, { x: p.cx, y: PY + PH + 94, size: 26, anchor: 'middle', weight: 600, color: 'muted' }, g) : null;
    S.set([g.a, g.b].filter(Boolean), { autoAlpha: 0 }, 0);
    return g;
  };

  // ---------------------------------------------------------------- b1: within one answer, nothing is re-sent; the server holds the state
  S.flow({ d: `M${L.x0 + 580},${CY + 32} L${L.x0 + 220},${CY + 32}`, from: T('b1~Within'), to: 'end', speed: 260, every: 0.3, size: 10, color: 'struct', shape: 'chip' });
  const zeroUp = S.pill('0 up', { x: L.x0 + 400, y: CY - 40, h: 38, size: 24, tone: 'neutral', style: 'outline' });
  S.set(zeroUp, { autoAlpha: 0 }, 0);
  S.add(fx.in(zeroUp, { from: 'fade', d: 0.35 }), 'b1~nothing');
  const SX = L.x0 + 605, SW = 150, SH = 11, STEP = 15, BASE = CY - 36;
  const slabs = Array.from({ length: 10 }, (_, k) => {
    const s = S.rect({ x: SX, y: BASE - k * STEP, w: SW, h: SH, r: 3, fill: 'url(#bar-bytes)', stroke: 'bytes', sw: 1 });
    S.set(s, { autoAlpha: 0 }, 0);
    return s;
  });
  const GROW = T('b1~state') - 0.1;
  slabs.forEach((s, k) => S.add(gsap.fromTo(s, { autoAlpha: 0, attr: { width: 0 } }, { autoAlpha: 1, attr: { width: SW }, duration: 0.25, ease: 'power2.out', immediateRender: false }), GROW + k * 0.4));
  S.add(fx.pulse(slabs, { scale: 1.05, d: 0.5 }), 'b1~cache');
  const vL = verdict(L, 'nothing is re-sent', 'the server holds the state');
  S.add(fx.in(vL.a, { from: 'up', d: 0.35, dist: 10 }), 'b1~re-sent');
  S.add(fx.in(vL.b, { from: 'up', d: 0.35, dist: 10 }), 'b1~holds');

  // ---------------------------------------------------------------- b2: between turns, everything is: the whole conversation goes up
  const vR = verdict(R, 'everything is re-sent', 'stateless: remembers nothing');
  S.add(fx.in(vR.a, { from: 'up', d: 0.35, dist: 10 }), 'b2~everything');
  const parcel = (at, o = {}) => {
    const g = ignore(S.g());
    const parts = [['question 1', 'token'], ['answer 1', 'token'], ['new', 'new']];
    let x = 0;
    const toks = parts.map(([t, st]) => { const p = libToken(S, { text: t, x, y: 0, size: 24, anchor: 'start', state: st }, g); x += p.w + 6; return p; });
    const W = x - 6;
    toks.forEach(p => S.xset(p, { x: -W / 2 }));
    const startX = R.x0 + 330, startY = CY - 70;
    S.xset(g, { x: startX, y: startY, s: 1, ox: 0, oy: 0 });
    S.set(g, { autoAlpha: 0 }, 0);
    if (o.snap) {
      // the three blocks fly in from different sides and snap together
      toks.forEach((p, i) => S.add(gsap.fromTo(p, { autoAlpha: 0, y: [-70, 60, -50][i], x: (i - 1) * 90 }, { autoAlpha: 1, y: 0, x: 0, duration: 0.45, ease: 'back.out(1.6)', immediateRender: false }), at - 0.5 + i * 0.1));
      S.add(gsap.set(g, { autoAlpha: 1 }), at - 0.5);
    } else S.add(gsap.to(g, { autoAlpha: 1, duration: 0.25 }), at - 0.3);
    // up the cable and into the server
    S.add(fx.xform(g, { x: R.x0 + 680, y: CY - 70, s: 0.35 }, { d: 0.9, ease: 'power2.in' }), at + 0.1);
    S.add(gsap.to(g, { autoAlpha: 0, duration: 0.2 }), at + 0.85);
    S.add(R.srv.glow({ tone: 'struct', d: 0.3 }), at + 0.9);
    S.add(R.srv.unglow({ d: 0.4 }), at + 1.4);
    return g;
  };
  parcel(T('b2~whole') + 0.3, { snap: true });
  // officially stateless: an empty, dotted outline where notes would be
  const empty = ignore(S.rect({ x: R.x0 + 605, y: BASE - 9 * STEP, w: SW, h: 9 * STEP + SH, r: 6, stroke: 'muted', sw: 2, dash: '3 6' }));
  S.set(empty, { autoAlpha: 0 }, 0);
  S.add(fx.in(empty, { from: 'fade', d: 0.4 }), 'b2~stateless-0.1');
  S.add(fx.in(vR.b, { from: 'up', d: 0.35, dist: 10 }), 'b2~stateless');

  // ---------------------------------------------------------------- b3: its notes may survive, but the text still travels
  const ghost = S.g();
  for (let k = 0; k < 6; k++) S.rect({ x: R.x0 + 605, y: BASE - k * STEP, w: SW, h: SH, r: 3, fill: 'helps', fillOpacity: 0.12, stroke: 'helps', strokeOpacity: 0.6, sw: 1.5, dash: '4 4' }, ghost);
  ignore(ghost);
  const may = S.text('notes may still be there', { x: R.x0 + 680, y: CY + 56, size: 24, anchor: 'middle', weight: 650, color: 'helps' });
  S.set([ghost, may], { autoAlpha: 0 }, 0);
  S.add(fx.in(ghost, { from: 'fade', d: 0.5 }), 'b3~notes-0.1');
  S.add(fx.in(may, { from: 'up', d: 0.35, dist: 10 }), 'b3~survive');
  parcel(T('b3~still') + 0.1);
  const trav = S.pill('text travels every turn', { x: R.x0 + 330, y: CY - 130, h: 40, size: 24, tone: 'struct', style: 'outline' });
  S.set(trav, { autoAlpha: 0 }, 0);
  S.add(fx.in(trav, { from: 'up', d: 0.35, dist: 10 }), 'b3~travels');

  // ---------------------------------------------------------------- b4: per token, nothing repeats; per turn, everything does
  const B4 = T('b4') - 0.15;
  S.add(fx.out([title, vL.a, vL.b, vR.a, vR.b], { d: 0.35, stagger: 0 }), B4);
  const perTok = S.text('per token: nothing repeats, costs nothing', { x: L.cx, y: PY + PH + 60, size: 30, anchor: 'middle', weight: 650, color: 'muted' });
  const perTurn = S.text([{ t: 'per turn: everything does, ', c: 'ink' }, { t: 'all counts again', c: 'bytes' }], { x: R.cx, y: PY + PH + 60, size: 30, anchor: 'middle', weight: 650 });
  S.set([perTok, perTurn], { autoAlpha: 0 }, 0);
  S.add(fx.in(perTok, { from: 'up', d: 0.4, dist: 12 }), 'b4~Per-0.1');
  S.add(fx.in(perTurn, { from: 'up', d: 0.4, dist: 12 }), 'b4~Per#2-0.1');
  const pulseB = (p, at) => S.add(gsap.fromTo(p.border, { attr: { 'stroke-opacity': 0.16, 'stroke-width': 2 } }, { attr: { 'stroke-opacity': 0.9, 'stroke-width': 4 }, duration: 0.3, yoyo: true, repeat: 1, immediateRender: false }), at);
  pulseB(L, T('b4~Per'));
  pulseB(R, T('b4~Per#2'));
  S.add(gsap.to([L.border, R.border], { attr: { 'stroke-opacity': 0.5 }, duration: 0.4 }), 'b4~mixing');
});
