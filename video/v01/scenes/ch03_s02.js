/* ch03_s02 · five pieces of software (fig 17)
   One request's path through the serving stack: Router (which machine), Scheduler (batch with others),
   Memory manager (which weights, which memory), Kernels (the arithmetic), all wired by Orchestration.
   Only Kernels does arithmetic: amber; the other four are blue and exist because arithmetic is not the
   hard part. Under each card, a small demo of its job; the request itself walks the first two. */
V.scene('ch03_s02', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const PANEL = { x: 140, y: 196, w: 1640, h: 680 };
  const FR = { x: 176, y: 286, w: 1568, h: 560 };            // the orchestration frame
  const CW = 330, CH = 150, CY = 318, GAP = 60;
  const CX = [0, 1, 2, 3].map(i => 960 - (4 * CW + 3 * GAP) / 2 + i * (CW + GAP));   // card left edges
  const MID = CX.map(x => x + CW / 2);
  const SUBY = CY + CH + 36;                                  // the one sub-label line
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };

  // ---------------------------------------------------------------- the panel and five empty outlines
  const panel = S.g();
  S.rect({ x: PANEL.x, y: PANEL.y, w: PANEL.w, h: PANEL.h, r: 30, fill: '#0c1326', fillOpacity: 0.55, stroke: '#ffffff', strokeOpacity: 0.1, sw: 2 }, panel);
  const title = S.text('The stack a request passes through', { x: PANEL.x + 44, y: PANEL.y + 48, size: 32, weight: 650, color: 'ink' });
  S.add(fx.in(panel, { from: 'fade', d: 0.6 }), 0.05);
  S.add(fx.in(title, { from: 'up', d: 0.5 }), 0.25);
  S.add(fx.out(title, { d: 0.4 }), 'b1~router-0.2');

  const frameLine = ignore(S.rect({ x: FR.x, y: FR.y, w: FR.w, h: FR.h, r: 24, stroke: 'faint', sw: 2 }));
  const frameTint = ignore(S.rect({ x: FR.x, y: FR.y, w: FR.w, h: FR.h, r: 24, fill: 'struct', fillOpacity: 0.05, stroke: 'struct', strokeOpacity: 0.7, sw: 2.5 }));
  S.set(frameTint, { autoAlpha: 0 }, 0);
  const outlines = CX.map(x => ignore(S.rect({ x, y: CY, w: CW, h: CH, r: 20, stroke: 'faint', sw: 2 })));
  S.set([frameLine, ...outlines], { autoAlpha: 0 }, 0);
  S.add(gsap.set([frameLine, ...outlines], { autoAlpha: 1 }), 0.45);
  S.add(fx.draw([frameLine, ...outlines], { d: 0.9, stagger: 0.14 }), 0.45);
  const parts = S.pill('5 parts', { x: PANEL.x + PANEL.w - 100, y: PANEL.y + 46, h: 46, size: 26, tone: 'struct', style: 'outline' });
  S.add(fx.pop(parts), 'b1~five');
  S.add(fx.out(parts, { d: 0.4 }), 'b2-0.3');

  // ---------------------------------------------------------------- the four cards: a dim (grey) and a lit layer each
  const CARDS = [
    { title: 'Router', icon: 'ph:signpost-duotone', sub: 'which machine', tone: 'struct' },
    { title: 'Scheduler', icon: 'ph:queue-duotone', sub: 'batch with others', tone: 'struct' },
    { title: 'Memory manager', icon: 'ph:memory-duotone', sub: 'which weights, which memory', tone: 'struct' },
    { title: 'Kernels', icon: 'ph:function-duotone', sub: 'the actual arithmetic', tone: 'compute' },
  ];
  const cards = CARDS.map((c, i) => {
    const o = { x: CX[i], y: CY, w: CW, h: CH, title: c.title, icon: c.icon, layout: 'top', size: 30, iconSize: 52 };
    const dim = ignore(S.card({ ...o, tone: 'neutral', titleColor: 'muted', iconColor: 'muted', shadow: false }));   // the grey copy under the lit card
    const lit = S.card({ ...o, tone: c.tone });
    const sub = S.text(c.sub, { x: MID[i], y: SUBY, size: 24, anchor: 'middle', color: 'muted', weight: 550 });
    S.set([dim, lit, sub], { autoAlpha: 0 }, 0);
    return { dim, lit, sub };
  });
  const light = (i, at) => {
    S.add(gsap.set(cards[i].dim, { autoAlpha: 1 }), at);
    S.add(fx.in(cards[i].lit, { from: 'scale', scale: 0.92, d: 0.45 }), at);
    S.add(fx.in(cards[i].sub, { from: 'up', d: 0.4, dist: 14 }), S.t(at) + 0.2);
  };
  // connector arrows, faint until the request takes them
  const arrows = [0, 1, 2].map(i => S.arrow({ x1: CX[i] + CW + 8, y1: CY + CH / 2, x2: CX[i + 1] - 8, y2: CY + CH / 2, color: 'faint', sw: 3, head: 11 }));
  S.set(arrows, { autoAlpha: 0 }, 0);
  S.add(fx.in(arrows, { from: 'fade', d: 0.4, stagger: 0.1 }), 1.3);
  const lightArrow = (i, at, tone = 'struct') =>
    S.add(gsap.to([arrows[i].line, arrows[i].head], { attr: { stroke: S.tone(tone) }, duration: 0.35 }), at);

  // ---------------------------------------------------------------- b1: the request waits; Router picks the machine
  const RY = 670;
  const req = ignore(libToken(S, { text: 'request', x: 270, y: RY, size: 24, hidden: true, case: 'label' }));
  S.add(req.pop({ d: 0.5 }), 'b1~request');
  light(0, 'b1~router-0.1');
  const SVX = 470, SVY = [RY - 76, RY, RY + 76];
  const routerDemo = S.g();
  const fan = SVY.map(y => ignore(S.line({ x1: 340, y1: RY, x2: SVX - 62, y2: y, stroke: 'faint', sw: 2.5 }, routerDemo)));
  const servers = SVY.map((y, k) => libServer(S, { x: SVX, y, w: 110, detail: 'min', seed: 5 + k }, routerDemo));
  S.set([...fan, ...servers], { autoAlpha: 0 }, 0);
  S.add(gsap.set(fan, { autoAlpha: 1 }), 'b1~router+0.1');
  S.add(fx.draw(fan, { d: 0.45, stagger: 0.08 }), 'b1~router+0.1');
  S.add(fx.in(servers, { from: 'left', d: 0.4, dist: 20, stagger: 0.1 }), 'b1~router+0.2');
  const pick = S.arrow({ x1: 340, y1: RY, x2: SVX - 60, y2: RY, color: 'struct', sw: 4, head: 14 }, routerDemo);
  S.set(pick, { autoAlpha: 0 }, 0);
  S.add(gsap.set(pick, { autoAlpha: 1 }), 'b1~picks');
  S.add(fx.drawArrow(pick, { d: 0.4 }), 'b1~picks');
  S.add(fx.dim([servers[0], servers[2], fan[0], fan[2]], { to: 0.35, d: 0.4 }), 'b1~the machine');
  S.add(servers[1].glow({ tone: 'struct', d: 0.4 }), 'b1~machine');
  // the request rides the arrow onto the chosen machine
  S.add(req.moveTo([SVX, RY], { d: 0.6, ease: 'power2.inOut' }), 'b1~machine-0.2');
  S.add(fx.out(cards[0].sub, { d: 0.3 }), 'b1~scheduler-0.2');

  // ---------------------------------------------------------------- b1: Scheduler batches it with seven others
  light(1, 'b1~scheduler-0.1');
  lightArrow(0, 'b1~scheduler');
  const batch = ch03Batch(S, { x: MID[1], y: 720, h: 26, gap: 6, pad: 10, label: 'batch', labelSize: 24 });
  const trayParts = [batch.firstChild, batch.tray, batch.labelEl];
  S.set(trayParts, { autoAlpha: 0 }, 0);
  S.set(batch.chips, { autoAlpha: 0 }, 0);
  const LOOSE = [[690, 610], [790, 585], [860, 620], [935, 582], [612, 572], [780, 650], [930, 660], [680, 668]];
  S.add(req.moveTo(LOOSE[0], { d: 0.7, ease: 'power2.inOut' }), 'b1~batches-0.3');
  S.add(servers[1].unglow({ d: 0.4 }), 'b1~batches');
  batch.chips.slice(1).forEach((c, k) => { S.add(c.moveTo(LOOSE[k + 1], { d: 0.01 }), 0.02); });
  S.add(batch.chips[0].setState('token', { d: 0.01 }), 0.02);
  batch.chips.slice(1).forEach((c, k) => S.add(c.in({ from: 'down', dist: 40, d: 0.4 }), T('b1~other') + k * 0.11));
  // 'run together': the tray appears and all eight snap into it; the request becomes the first chip
  const RUN = T('b1~run');
  S.add(fx.in(trayParts.slice(0, 2), { from: 'fade', d: 0.35, stagger: 0 }), RUN - 0.15);
  S.add(req.moveTo([batch.slotAt(0).x, batch.slotAt(0).y], { d: 0.45 }), RUN);
  S.add(gsap.to(req.body, { scale: 0.45, duration: 0.45, ease: 'power3.inOut', transformOrigin: '50% 50%' }), RUN);
  S.add(req.out({ d: 0.2 }), RUN + 0.3);
  S.add(gsap.set(batch.chips[0], { autoAlpha: 1 }), RUN + 0.3);
  batch.chips.slice(1).forEach((c, k) => S.add(c.moveTo([batch.slotAt(k + 1).x, batch.slotAt(k + 1).y], { d: 0.5, ease: 'back.out(1.4)' }), RUN + 0.04 * k));
  S.add(fx.in(batch.labelEl, { from: 'up', d: 0.35, dist: 12 }), RUN + 0.35);
  S.add(fx.out([cards[1].sub, batch.labelEl], { d: 0.35 }), 'b2-0.3');

  // ---------------------------------------------------------------- b2: Memory manager puts the weights in the chips' memory
  light(2, 'b2~memory-0.1');
  lightArrow(1, 'b2~memory');
  const memDemo = S.g();
  const chips = [MID[2] - 78, MID[2] + 78].map((x, k) => libChip(S, { x, y: 690, size: 54, hbm: 1, state: 'idle', seed: 21 + k }, memDemo));
  S.set(chips, { autoAlpha: 0 }, 0);
  chips.forEach((c, k) => { S.add(gsap.set(c, { autoAlpha: 1 }), T('b2~decides') + k * 0.15); S.add(c.drawOn({ d: 0.7 }), T('b2~decides') + k * 0.15); });
  // eight coral weight tiles, two for each memory stack
  const slots = [];
  chips.forEach(c => c.stacks.forEach(st => [0, 1].forEach(j => slots.push({ x: st.x + 3, y: st.y + 3 + j * (st.h - 6) / 2, w: st.w - 6, h: (st.h - 6) / 2 - 3 }))));
  const tw = slots[0].w, th = slots[0].h, rowW = 8 * tw + 7 * 12;
  const tiles = slots.map((sl, k) => {
    const x0 = MID[2] - rowW / 2 + k * (tw + 12), y0 = 572;
    const t = S.rect({ x: x0, y: y0, w: tw, h: th, r: 2, fill: 'url(#card-bytes)', stroke: 'bytes', sw: 1.5 }, memDemo);
    t.__to = [sl.x - x0, sl.y - y0];
    return t;
  });
  S.set(tiles, { autoAlpha: 0 }, 0);
  S.add(fx.in(tiles, { from: 'down', dist: 16, d: 0.35, stagger: 0.05 }), 'b2~weights');
  const INTO = T("b2~chip's") - 0.1;
  // tile k goes to stack slot k: order by chip, then stack, then top/bottom
  tiles.forEach((t, k) => S.add(gsap.to(t, { x: t.__to[0], y: t.__to[1], duration: 0.55, ease: 'power3.inOut' }), INTO + k * 0.06));
  S.add(fx.out(cards[2].sub, { d: 0.3 }), 'b2~Kernels-0.25');

  // ---------------------------------------------------------------- b2: Kernels, the five-row multiply-and-add in miniature
  light(3, 'b2~Kernels-0.1');
  lightArrow(2, 'b2~Kernels');
  const INP = [2, 1, 5, 1, 1], WTS = [0.13, -0.7, 0.02, 1.44, -0.3];
  const PROD = INP.map((x, i) => Math.round(x * WTS[i] * 100) / 100);       // 0.26, −0.7, 0.1, 1.44, −0.3 → 0.8
  const SUM = Math.round(PROD.reduce((a, b) => a + b, 0) * 100) / 100;
  const KX = CX[3], KY = i => 572 + i * 32;
  const mini = S.g();
  const cell = (x, y, w, text, tone, color, g) => {
    const c = S.g(null, g);
    S.rect({ x, y: y - 13, w, h: 26, r: 6, fill: '#0c1326' }, c);
    S.rect({ x, y: y - 13, w, h: 26, r: 6, fill: `url(#card-${tone})`, stroke: tone, strokeOpacity: 0.6, sw: 1.5 }, c);
    S.text(text, { x: x + w / 2, y: y + 1, size: 20, anchor: 'middle', family: 'mono', weight: 600, color }, c);
    return c;
  };
  const rowsEl = INP.map((x, i) => {
    const g = S.g(null, mini);
    cell(KX + 18, KY(i), 34, String(x), 'struct', 'ink', g);
    S.text('×', { x: KX + 70, y: KY(i) + 1, size: 22, anchor: 'middle', color: 'compute', weight: 600 }, g);
    cell(KX + 86, KY(i), 70, libNum(WTS[i]), 'struct', WTS[i] < 0 ? 'violet' : 'ink', g);
    return g;
  });
  const prods = PROD.map((p, i) => cell(KX + 172, KY(i), 70, libNum(p), 'compute', p < 0 ? 'violet' : 'ink', mini));
  const brace = ignore(S.path({ d: `M${KX + 252},${KY(0) - 10} l8,0 L${KX + 260},${KY(4) + 10} l-8,0 M${KX + 260},${KY(2)} l10,0`, stroke: 'compute', sw: 2 }, mini));
  const out = cell(KX + 274, KY(2), 46, libNum(SUM), 'compute', 'ink', mini);
  S.set([...rowsEl, ...prods, brace, out], { autoAlpha: 0 }, 0);
  S.add(fx.in(rowsEl, { from: 'left', dist: 16, d: 0.35, stagger: 0.07 }), 'b2~programs-0.1');
  S.add(fx.in(prods, { from: 'left', dist: 14, d: 0.3, stagger: 0.07 }), 'b2~the chip');
  S.add(gsap.set(brace, { autoAlpha: 1 }), 'b2~do-0.1');
  S.add(fx.draw(brace, { d: 0.3 }), 'b2~do-0.1');
  S.add(fx.in(out, { from: 'left', dist: 12, d: 0.3 }), 'b2~do+0.15');
  // 'arithmetic': the picture tiles into a dense grid of the same operation, too fast to follow
  const GR = { x: KX + 12, y: 548, cols: 14, rows: 12, cw: 18, ch: 13, gx: 4, gy: 5 };
  const grid = ignore(S.g());
  const gcells = [];
  for (let r = 0; r < GR.rows; r++) for (let c = 0; c < GR.cols; c++)
    gcells.push(S.rect({ x: GR.x + c * (GR.cw + GR.gx), y: GR.y + r * (GR.ch + GR.gy), w: GR.cw, h: GR.ch, r: 2, fill: 'compute', fillOpacity: 0.18 }, grid));
  S.set(grid, { autoAlpha: 0 }, 0);
  const ARITH = T('b2~arithmetic');
  S.add(gsap.to(mini, { autoAlpha: 0, scale: 0.6, transformOrigin: `${KX + 160}px 636px`, duration: 0.4, ease: 'power2.in' }), ARITH - 0.1);
  S.add(gsap.to(grid, { autoAlpha: 1, duration: 0.4 }), ARITH + 0.1);
  // deterministic shimmer: each frame lights a different seeded set of cells
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h ^ (h >>> 16)) / 4294967296; };
  const shimmer = t => {
    if (t >= ARITH - 0.1) mini.setAttribute('data-audit', 'ignore'); else mini.removeAttribute('data-audit');   // shrinking away
    const f = Math.floor((t - ARITH) * 30);
    gcells.forEach((c, k) => c.setAttribute('fill-opacity', f < 0 ? 0.18 : (0.16 + 0.8 * Math.pow(hash(k, f), 3)).toFixed(3)));
  };
  const clock = { t: 0 };
  S.add(gsap.fromTo(clock, { t: 0 }, { t: S.duration, duration: S.duration, ease: 'none', immediateRender: false, onUpdate: () => shimmer(clock.t) }), 0);
  shimmer(0);
  S.add(fx.out(cards[3].sub, { d: 0.3 }), 'b2~Orchestration-0.25');

  // ---------------------------------------------------------------- b2: Orchestration wires it all together
  const FY = FR.y + FR.h;
  const fLabel = S.g();
  const flW = S.measure('Orchestration', { size: 28, weight: 650 }) + 36;
  S.rect({ x: FR.x + 40, y: FY - 22, w: flW, h: 44, r: 22, fill: '#0c1326' }, fLabel);
  const flBg = S.rect({ x: FR.x + 40, y: FY - 22, w: flW, h: 44, r: 22, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.7, sw: 2 }, fLabel);
  const flText = S.text('Orchestration', { x: FR.x + 40 + flW / 2, y: FY + 1, size: 28, weight: 650, anchor: 'middle', color: 'ink' }, fLabel);
  const fSub = S.g();
  const fsW = S.measure('wiring it together', { size: 24, weight: 550 }) + 28;
  S.rect({ x: FR.x + 40 + flW + 14, y: FY - 18, w: fsW, h: 36, r: 18, fill: '#0c1326' }, fSub);
  S.text('wiring it together', { x: FR.x + 40 + flW + 14 + fsW / 2, y: FY + 1, size: 24, weight: 550, anchor: 'middle', color: 'muted' }, fSub);
  S.set([fLabel, fSub], { autoAlpha: 0 }, 0);
  const ORCH = T('b2~Orchestration');
  S.add(gsap.to(frameTint, { autoAlpha: 1, duration: 0.6 }), ORCH - 0.1);
  S.add(fx.in(fLabel, { from: 'up', d: 0.45, dist: 12 }), ORCH);
  S.add(fx.in(fSub, { from: 'left', d: 0.4, dist: 12 }), ORCH + 0.3);
  [0, 1, 2].forEach(i => {
    lightArrow(i, T('b2~wires') + i * 0.22, 'ink');
    S.add(fx.pulse(arrows[i], { scale: 1.25, d: 0.4 }), T('b2~wires') + i * 0.22);
  });

  // ---------------------------------------------------------------- b3: only one of the five does arithmetic
  S.add(fx.out(fSub, { d: 0.35 }), 'b3-0.2');
  S.add(fx.dim([routerDemo, batch, memDemo], { to: 0.25, d: 0.5 }), 'b3');
  const ONE = T('b3~one');
  [0, 1, 2].forEach(i => S.add(gsap.to(cards[i].lit, { autoAlpha: 0, duration: 0.5 }), ONE + i * 0.08));
  S.add(gsap.to(frameTint, { autoAlpha: 0, duration: 0.5 }), ONE + 0.24);
  S.add(gsap.to(flBg, { attr: { fill: 'url(#card-neutral)', stroke: '#ffffff', 'stroke-opacity': 0.2 }, duration: 0.5 }), ONE + 0.24);
  S.add(gsap.to(flText, { attr: { fill: S.tone('muted') }, duration: 0.5 }), ONE + 0.24);
  S.add(gsap.to(arrows.flatMap(a => [a.line, a.head]), { attr: { stroke: S.tone('faint') }, duration: 0.5 }), ONE + 0.24);
  S.add(fx.pulse(cards[3].lit, { scale: 1.05, d: 0.5 }), 'b3~five');
  const take = S.takeaway('1 of 5 does arithmetic', { tone: 'compute' });
  S.add(fx.in(take, { from: 'up', d: 0.5 }), 'b3~does-0.1');

  // 'why each exists': the four relight one at a time, each with a question that turns into a tick
  const badgeAt = [...[0, 1, 2].map(i => [CX[i] + CW - 4, CY + 4]), [FR.x + 40 + flW + 2, FY - 16]];
  const RELIT = T('b3~This');
  const WHY = T('b3~why');
  badgeAt.forEach(([x, y], k) => {
    const q = ignore(S.g());
    S.circle({ x, y, r: 19, fill: '#0c1326', stroke: 'struct', sw: 2 }, q);
    S.text('?', { x, y: y + 1, size: 24, anchor: 'middle', weight: 700, color: 'ink' }, q);
    const tick = ignore(S.g());
    S.circle({ x, y, r: 19, fill: '#0c1326' }, tick);
    S.icon('ph:check-circle-duotone', { x, y, size: 40, color: 'helps' }, tick);
    S.set([q, tick], { autoAlpha: 0 }, 0);
    const at = RELIT + k * 0.28;
    if (k < 3) S.add(gsap.to(cards[k].lit, { autoAlpha: 1, duration: 0.4 }), at);
    else {
      S.add(gsap.to(frameTint, { autoAlpha: 1, duration: 0.4 }), at);
      S.add(gsap.to(flBg, { attr: { fill: 'url(#card-struct)', stroke: S.tone('struct'), 'stroke-opacity': 0.7 }, duration: 0.4 }), at);
      S.add(gsap.to(flText, { attr: { fill: S.tone('ink') }, duration: 0.4 }), at);
    }
    S.add(fx.pop(q, { d: 0.4 }), at + 0.05);
    S.add(gsap.to(q, { autoAlpha: 0, duration: 0.2 }), WHY + k * 0.16);
    S.add(fx.pop(tick, { d: 0.4 }), WHY + k * 0.16);
  });
});
