/* ch03_s05 · what one request carries (fig 20)
   A request carries the conversation so far, the new question and settings. The whole conversation is
   re-sent every time because the model remembers nothing between requests (stateless). Conversation
   only, with 20-token questions and 200-token answers, turn n sends 20n + 200(n − 1) tokens:
   20, 240, 460 … 2,000 at turn 10, drawn to scale at 0.6 px per token from x 300. */
V.scene('ch03_s05', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };

  // ---------------------------------------------------------------- the first frame: s04's last (the same crowd, frozen, dimmed)
  const crowd = ch03Crowd(S, { x: 120, y: 210, w: 1680, h: 430, n: 48, size: 26, seed: 3 });
  crowd.setAttribute('opacity', 0.35);
  const ENV = { x: 420, y: 160, w: 700, h: 360 };
  const ECX = ENV.x + ENV.w / 2, ECY = ENV.y + ENV.h / 2;
  const pickK = crowd.squares.reduce((b, c, k, a) => (Math.hypot(c.cx - ECX, c.cy - ECY) < Math.hypot(a[b].cx - ECX, a[b].cy - ECY) ? k : b), 0);
  const P = crowd.squares[pickK];
  const hero = libToken(S, { text: '', x: P.cx, y: P.cy, w: 26, h: 26, r: 6, decorative: true });
  S.set(hero, { autoAlpha: 0 }, 0);
  S.add(gsap.to(hero, { autoAlpha: 1, duration: 0.3 }), 0.25);
  S.add(fx.cam({ x: P.cx, y: P.cy, scale: 3.2, d: 0.75, ease: 'power2.in' }), 'b1~One-0.4');
  S.add(gsap.to(crowd, { autoAlpha: 0, duration: 0.35 }), 'b1~One-0.05');
  const UNFOLD = T('b1~One') + 0.35;
  S.add(gsap.to(hero, { autoAlpha: 0, duration: 0.15 }), UNFOLD);
  S.add(fx.cam({ x: 960, y: 540, scale: 1, d: 0.01 }), UNFOLD);

  // ---------------------------------------------------------------- b1: the request unfolds into an envelope with three compartments
  const env = S.g();
  S.path({ d: `M${ENV.x + 10},${ENV.y} L${ECX},${ENV.y - 56} L${ENV.x + ENV.w - 10},${ENV.y} Z`, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.25, sw: 2 }, env);
  S.rect({ x: ENV.x, y: ENV.y, w: ENV.w, h: ENV.h, r: 22, fill: '#0c1326' }, env);
  S.rect({ x: ENV.x, y: ENV.y, w: ENV.w, h: ENV.h, r: 22, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.28, sw: 2 }, env);
  const title = S.text('What arrives at the server', { x: ENV.x + 30, y: ENV.y + 38, size: 28, weight: 650, color: 'ink' }, env);
  // the three compartments: dashed and empty until each fills
  const comp = (x, y, w, h) => {
    const g = S.g(null, env);
    g.empty = ignore(S.rect({ x, y, w, h, r: 14, stroke: '#ffffff', strokeOpacity: 0.25, sw: 2, dash: '7 6' }, g));
    g.full = S.g(null, g);
    S.set(g.full, { autoAlpha: 0 }, 0);
    Object.assign(g, { x, y, w, h });
    return g;
  };
  const C1 = comp(ENV.x + 30, ENV.y + 70, 380, 160), C2 = comp(ENV.x + 430, ENV.y + 70, 240, 160), C3 = comp(ENV.x + 30, ENV.y + 250, 640, 92);
  // the conversation so far: earlier messages, alternating sides
  S.rect({ x: C1.x, y: C1.y, w: C1.w, h: C1.h, r: 14, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.55, sw: 2 }, C1.full);
  S.text('the conversation so far', { x: C1.x + 20, y: C1.y + 32, size: 26, weight: 650, color: 'ink' }, C1.full);
  [[0, 0.62], [1, 0.48], [0, 0.7], [1, 0.4]].forEach(([side, f], i) => {
    const w = (C1.w - 60) * f, x = side ? C1.x + C1.w - 20 - w : C1.x + 20;
    S.rect({ x, y: C1.y + 62 + i * 23, w, h: 14, r: 7, fill: 'struct', fillOpacity: side ? 0.3 : 0.5 }, C1.full);
  });
  // the new question: one bright bubble
  S.rect({ x: C2.x, y: C2.y, w: C2.w, h: C2.h, r: 14, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 1, sw: 2.5 }, C2.full);
  S.text('the new question', { x: C2.x + C2.w / 2, y: C2.y + 32, size: 24, anchor: 'middle', weight: 650, color: 'ink' }, C2.full);
  S.rect({ x: C2.x + 30, y: C2.y + 70, w: C2.w - 60, h: 52, r: 18, fill: 'struct', fillOpacity: 0.9 }, C2.full);
  S.icon('ph:question-duotone', { x: C2.x + C2.w / 2, y: C2.y + 96, size: 34, color: '#0a0f1e' }, C2.full);
  // settings: how long, how random, when to stop
  S.rect({ x: C3.x, y: C3.y, w: C3.w, h: C3.h, r: 14, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.35, sw: 2 }, C3.full);
  const SET = ['settings: ', 'how long', ', ', 'how random', ', ', 'when to stop'];
  const setText = S.text(SET.join(''), { x: C3.x + 20, y: C3.y + 30, size: 24, weight: 550, color: 'muted' }, C3.full);
  const mw = s => S.measure(s, { size: 24, weight: 550 });
  const iconUnder = (i, id) => {
    const pre = mw(SET.slice(0, i).join('')), w = mw(SET[i]);
    return S.icon(id, { x: C3.x + 20 + pre + w / 2, y: C3.y + 66, size: 30, color: 'muted' }, C3.full);
  };
  const setIcons = [iconUnder(1, 'ph:ruler-duotone'), iconUnder(3, 'ph:chart-pie-slice-duotone'), iconUnder(5, 'ph:octagon-duotone')];
  S.xset(env, { x: 960 - ECX, y: 540 - ECY, s: 26 * 3.2 / ENV.w, ox: ECX, oy: ECY });
  S.set(env, { autoAlpha: 0 }, 0);
  S.add(gsap.to(env, { autoAlpha: 1, duration: 0.2 }), UNFOLD);
  S.add(fx.xform(env, { x: 0, y: 0, s: 1 }, { d: 0.75, ease: 'power3.out' }), UNFOLD);
  S.call(() => env.setAttribute('data-audit', 'ignore'), 0);
  S.call(() => env.removeAttribute('data-audit'), UNFOLD + 0.8);
  const fill = (c, at) => {
    S.add(gsap.to(c.empty, { autoAlpha: 0, duration: 0.3 }), at);
    S.add(fx.in(c.full, { from: 'scale', scale: 0.94, d: 0.4 }), at);
  };
  fill(C1, 'b1~conversation-0.1');
  S.add(fx.out(title, { d: 0.3 }), 'b1~conversation');
  fill(C2, 'b1~new-0.1');
  fill(C3, 'b1~settings-0.1');
  S.set(setIcons, { autoAlpha: 0 }, 0);
  S.add(fx.pop(setIcons[0], { d: 0.4 }), 'b1~settings+0.35');
  S.add(fx.pop(setIcons[1], { d: 0.4 }), 'b1~random');
  S.add(fx.pop(setIcons[2], { d: 0.4 }), 'b1~random+0.35');

  // ---------------------------------------------------------------- b1: how random the draw should be: ch01's spinner, once, lands on dog
  const W = { x: 1290, y: 444, r: 92 };
  const spin = S.g();
  const wheel = S.g(null, spin);
  S.circle({ x: W.x, y: W.y, r: W.r + 6, fill: '#0c1326', stroke: 'struct', sw: 2, strokeOpacity: 0.5 }, wheel);
  const SLICES = [{ deg: 268.2, op: 0.95, icon: 'fluent:cat-face' }, { deg: 89.3, op: 0.55, icon: 'fluent:dog-face' }, { deg: 2.44, op: 0.35 }, { deg: 0.11, op: 0.25 }];
  const pt = (deg, rr) => { const a = (deg - 90) * Math.PI / 180; return [W.x + rr * Math.cos(a), W.y + rr * Math.sin(a)]; };
  let a0 = 0;
  SLICES.forEach(sl => {
    const a1 = a0 + sl.deg, [x0, y0] = pt(a0, W.r), [x1, y1] = pt(a1, W.r);
    S.path({ d: `M${W.x},${W.y} L${x0.toFixed(2)},${y0.toFixed(2)} A${W.r},${W.r} 0 ${sl.deg > 180 ? 1 : 0},1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`, fill: 'struct', fillOpacity: sl.op, stroke: '#0c1326', sw: 1.5 }, wheel);
    if (sl.icon) { const [ix, iy] = pt(a0 + sl.deg / 2, W.r * 0.58); S.icon(sl.icon, { x: ix, y: iy, size: 34 }, wheel); }
    a0 = a1;
  });
  S.circle({ x: W.x, y: W.y, r: 10, fill: '#0c1326', stroke: 'ink', sw: 2.5 }, wheel);
  ignore(spin);
  const pointer = S.path({ d: `M${W.x - 13},${W.y - W.r - 28} L${W.x + 13},${W.y - W.r - 28} L${W.x},${W.y - W.r + 4} Z`, fill: 'ink', stroke: '#0c1326', sw: 2 }, spin);
  const legend = S.g();
  const legRow = (y, icon, txt) => { const g = S.g(null, legend); S.icon(icon, { x: W.x + W.r + 46, y, size: 32 }, g); g.t = S.text(txt, { x: W.x + W.r + 72, y: y + 1, size: 26, weight: 650, color: 'ink', case: 'keep' }, g); return g; };
  const legCat = legRow(W.y - 26, 'fluent:cat-face', 'cat 74.5%'), legDog = legRow(W.y + 26, 'fluent:dog-face', 'dog 24.8%');
  S.set([spin, legend], { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(spin, { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power3.out' }), 'b1~how random-0.1');
  S.add(fx.in(legend, { from: 'left', d: 0.4, dist: 16 }), 'b1~random+0.2');
  // one spin: the slice under the top pointer is at wheel angle (360 − θ); dog spans 268.2–357.5, so θ = 47 + 360
  const SP = T('b1~draw'), SPD = 1.0;
  const theta = t => (t <= SP ? 0 : t >= SP + SPD ? 407 : 407 * (1 - Math.pow(1 - (t - SP) / SPD, 3)));
  S.add(gsap.to(legCat, { opacity: 0.4, duration: 0.3 }), SP + SPD);
  S.add(gsap.fromTo(legDog.t, { filter: 'none' }, { filter: 'url(#glow-struct)', duration: 0.3, yoyo: true, repeat: 1 }), SP + SPD);
  S.add(fx.out([spin, legend], { d: 0.4 }), 'b2+0.05');

  // ---------------------------------------------------------------- b2: re-sent every time; the model remembers nothing
  const model = ch03ModelBlock(S, { x: 1350, y: 200, h: 150, size: 30 });
  S.set(model, { autoAlpha: 0 }, 0);
  S.add(fx.in(model, { from: 'right', d: 0.6, dist: 40 }), 'b2~surprise');
  // the whole envelope folds into a parcel and travels into the model, then a fresh copy is back for next time
  const RS = T('b2~re-sent') - 0.15;
  const MB = { x: model.l + model.block.w / 2, y: model.cy };
  S.call(() => env.setAttribute('data-audit', 'ignore'), RS);
  S.add(fx.xform(env, { x: 0, y: 0, s: 0.18 }, { d: 0.45, ease: 'power3.in' }), RS);
  S.add(fx.xform(env, { x: MB.x - ECX, y: MB.y - ECY, s: 0.07 }, { d: 0.6, ease: 'power2.inOut' }), RS + 0.45);
  S.add(gsap.to(env, { autoAlpha: 0, duration: 0.15 }), RS + 0.95);
  S.add(model.block.flash({ d: 0.5 }), RS + 1.0);
  S.add(fx.xform(env, { x: 0, y: 0, s: 1 }, { d: 0.01 }), RS + 1.2);
  S.add(gsap.to(env, { autoAlpha: 1, duration: 0.45 }), RS + 1.25);
  S.call(() => env.removeAttribute('data-audit'), RS + 1.25);
  S.add(model.forget({ d: 0.8 }), 'b2~remembers-0.1');
  const stateless = S.text('stateless', { x: model.cx, y: model.b + 58, size: 44, anchor: 'middle', weight: 700, family: 'display', color: 'ink' });
  S.set(stateless, { autoAlpha: 0 }, 0);
  S.add(fx.in(stateless, { from: 'up', d: 0.5 }), 'b2~stateless-0.1');

  // ---------------------------------------------------------------- b3: everything shrinks to a textless thumbnail at top centre
  const SH = T('b3~Counting') - 0.25;
  const texts = [...env.querySelectorAll('text'), ...model.querySelectorAll('text')];
  S.add(gsap.to(texts, { autoAlpha: 0, duration: 0.25 }), SH);
  S.call(() => { env.setAttribute('data-audit', 'ignore'); model.setAttribute('data-audit', 'ignore'); }, SH);
  S.add(fx.xform(env, { x: 800 - ECX, y: 150 - ECY, s: 0.2 }, { d: 0.7, ease: 'power3.inOut' }), SH + 0.1);
  S.xset(model, { x: 0, y: 0, s: 1, ox: model.cx, oy: model.cy });
  S.add(fx.xform(model, { x: 952 - model.cx, y: 150 - model.cy, s: 0.3 }, { d: 0.7, ease: 'power3.inOut' }), SH + 0.1);
  S.xset(stateless, { x: 0, y: 0, s: 1, ox: model.cx, oy: model.b + 58 });
  S.add(fx.xform(stateless, { x: 1150 - model.cx, y: 152 - (model.b + 58), s: 0.8 }, { d: 0.7, ease: 'power3.inOut' }), SH + 0.1);
  S.call(() => stateless.setAttribute('data-audit', 'ignore'), SH);
  S.call(() => stateless.removeAttribute('data-audit'), SH + 0.85);
  const tag = S.pill('conversation only, illustrative', { x: 300, y: 300, h: 42, size: 24, tone: 'neutral', style: 'outline', anchor: 'start' });
  S.set(tag, { autoAlpha: 0 }, 0);
  S.add(fx.in(tag, { from: 'up', d: 0.4, dist: 12 }), 'b3~only');

  // ---------------------------------------------------------------- b3: the ladder, to scale at 0.6 px per token
  const PX = 0.6, X0 = 300, BH = 44, Q = 20, A = 200;
  const tokensAt = n => Q * n + A * (n - 1);            // turn n: n questions, n − 1 answers
  const ROWY = { 1: 380, 2: 480, 3: 570, 10: 720 };
  const rows = {};
  const buildRow = (n, y, o = {}) => {
    const g = S.g();
    g.lbl = S.text(`turn ${n}`, { x: 270, y: y + 1, size: 28, anchor: 'end', weight: 600, color: o.ghost ? 'muted' : 'ink' }, g);
    g.segs = [];
    let x = X0;
    for (let k = 1; k <= n; k++) {
      const parts = k < n ? [['Q', Q], ['A', A]] : [['Q', Q]];
      for (const [kind, tok] of parts) {
        const w = tok * PX, isNew = k === n;
        const fillOp = isNew ? 1 : kind === 'Q' ? 0.55 : 0.32;
        const el = S.rect({ x, y: y - BH / 2, w: 0, h: BH, r: 3, fill: 'struct', fillOpacity: o.ghost ? 0 : fillOp, stroke: o.ghost ? 'faint' : '#0c1326', sw: o.ghost ? 2 : 1.5, dash: o.ghost ? '6 5' : undefined }, g);
        g.segs.push({ x0: x - X0, w, el, kind, k, isNew });
        x += w;
      }
    }
    g.total = tokensAt(n);
    g.ghost = !!o.ghost;
    g.len = g.total * PX;
    g.val = S.text('', { x: X0 + g.len + 18, y: y + 1, size: 30, weight: 650, family: 'mono', color: o.ghost ? 'muted' : 'ink' }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    rows[n] = g;
    return g;
  };
  [1, 2, 3, 10].forEach(n => buildRow(n, ROWY[n]));
  // each row grows over [t0, t0 + d]; the painter sets segment widths and the counting value
  const GROW = {};
  const growRow = (n, t0, d) => { GROW[n] = { t0, d }; S.add(fx.in(rows[n], { from: 'fade', d: 0.3 }), t0 - 0.3); };
  growRow(1, T('b3~twenty-token') - 0.05, 0.35);
  growRow(2, T('b3~turn') + 0.15, 1.9);
  growRow(3, T('b3~forty') + 0.35, 0.7);
  growRow(10, T('b3~ten') + 0.2, 0.95);
  const fmtN = v => Math.round(v).toLocaleString('en-US');
  // Q1 / A1 / Q2 labels above turn 2 as each segment draws
  const segLbls = rows[2].segs.map((s, i) => {
    const t = S.text(['Q1', 'A1', 'Q2'][i], { x: X0 + s.x0 + s.w / 2, y: ROWY[2] - BH / 2 - 18, size: 22, anchor: 'middle', weight: 600, color: s.isNew ? 'ink' : 'muted' });
    S.set(t, { autoAlpha: 0 }, 0);
    const g2 = GROW[2];
    S.add(fx.in(t, { from: 'up', d: 0.3, dist: 10 }), g2.t0 + g2.d * (s.x0 / rows[2].len));
    return t;
  });
  // the vertical ellipsis between turn 3 and turn 10
  const dots = [0, 1, 2].map(i => S.circle({ x: 230, y: 626 + i * 18, r: 4, fill: 'muted' }));
  S.set(dots, { autoAlpha: 0 }, 0);
  S.add(fx.pop(dots, { d: 0.3, stagger: 0.08 }), T('b3~turn#2') - 0.1);
  // 'a twenty-token question': only the bright sliver at turn 10's right end glows
  const Q20 = T('b3~a twenty-token') + 0.3;
  const last = rows[10].segs[rows[10].segs.length - 1].el;
  S.add(gsap.to(rows[10].segs.slice(0, -1).map(s => s.el), { attr: { 'fill-opacity': 0.12 }, duration: 0.4 }), T('b3~ask'));
  S.add(gsap.fromTo(last, { filter: 'none' }, { filter: 'url(#glow-struct)', duration: 0.4, ease: 'power2.out', immediateRender: false }), Q20 - 0.3);
  const ring = ignore(S.rect({ x: X0 + rows[10].len - 12 - 8, y: ROWY[10] - BH / 2 - 8, w: 12 + 16, h: BH + 16, r: 8, stroke: 'ink', sw: 2.5 }));
  S.set(ring, { autoAlpha: 0 }, 0);
  S.add(fx.pop(ring, { d: 0.4, from: 1.6 }), Q20 - 0.3);
  const q20 = S.text('20 new tokens', { x: X0 + rows[10].len - 6, y: ROWY[10] - BH / 2 - 26, size: 24, anchor: 'middle', weight: 650, color: 'ink' });
  S.set(q20, { autoAlpha: 0 }, 0);
  S.add(fx.in(q20, { from: 'up', d: 0.35, dist: 10 }), Q20 - 0.1);

  // ---------------------------------------------------------------- b4: longer conversations run off the frame; a hardware problem
  const ghosts = [[12, 800], [15, 862]].map(([n, y]) => buildRow(n, y, { ghost: true }));
  const GH = T('b4~long conversation');
  ghosts.forEach((g, i) => {
    const n = [12, 15][i];
    GROW[n] = { t0: GH + i * 0.35, d: 1.6 };
    S.add(fx.in(g, { from: 'fade', d: 0.3 }), GH + i * 0.35 - 0.2);
    S.add(gsap.to(g, { autoAlpha: 0, duration: 0.8 }), T('b4~turn') + 0.4 + i * 0.2);
  });
  S.add(fx.out([ring, q20], { d: 0.35 }), 'b4');
  S.add(gsap.to(rows[10].segs.slice(0, -1).map(s => s.el), { attr: { 'fill-opacity': (i, el) => (el.__op ?? 0.45) }, duration: 0.5 }), 'b4');
  const take = S.takeaway('conversation length → hardware problem', { tone: 'struct' });
  S.add(fx.in(take, { from: 'up', d: 0.5 }), 'b4~hardware-0.1');
  const up = S.g();
  S.arrow({ x1: 1730, y1: 610, x2: 1730, y2: 470, color: 'bytes', sw: 4, head: 16 }, up);
  S.text('?', { x: 1780, y: 540, size: 56, anchor: 'middle', weight: 700, family: 'display', color: 'bytes' }, up);
  S.text('cost', { x: 1730, y: 646, size: 26, anchor: 'middle', weight: 600, color: 'muted' }, up);
  S.set(up, { autoAlpha: 0 }, 0);
  S.add(fx.in(up, { from: 'down', d: 0.5, dist: 20 }), 'b4~growing-0.1');

  // ---------------------------------------------------------------- one clock paints the wheel and the bars
  const paint = t => {
    wheel.setAttribute('transform', `rotate(${theta(t).toFixed(2)} ${W.x} ${W.y})`);
    for (const n of Object.keys(GROW)) {
      const { t0, d } = GROW[n], row = rows[n];
      const u = Math.min(1, Math.max(0, (t - t0) / d)), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const L = row.len * e;
      row.segs.forEach(s => s.el.setAttribute('width', Math.max(0, Math.min(s.w, L - s.x0)).toFixed(2)));
      row.val.textContent = u <= 0 || row.ghost ? '' : fmtN(row.total * e);
    }
  };
  // remember each turn-10 segment's resting opacity for the un-dim in b4
  rows[10].segs.forEach(s => { s.el.__op = +s.el.getAttribute('fill-opacity'); });
  const clock = { t: 0 };
  S.add(gsap.fromTo(clock, { t: 0 }, { t: S.duration, duration: S.duration, ease: 'none', immediateRender: false, onUpdate: () => paint(clock.t) }), 0);
  paint(0);
});
