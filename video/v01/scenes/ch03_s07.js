/* ch03_s07 · stored in three places, read in one (fig 22)
   Two questions get confused: does it reach the context (always yes: system prompt, tool definitions,
   loaded skills) and does it cross the network from your device (a product decision about storage).
   Three places to keep text (your device; the server, for you; the server, for everyone) all feed one
   assembled prompt in a fixed order, most shared first. The server may briefly keep work done on text
   it has seen, and reuses it only for an identical beginning (a prefix): most shared first makes the
   prefix longest; newest first, and nothing matches. */
V.scene('ch03_s07', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const tick = (x, y, size = 40) => { const g = S.g(); S.circle({ x, y, r: size * 0.45, fill: '#0c1326' }, g); S.icon('ph:check-circle-duotone', { x, y, size, color: 'helps' }, g); S.set(g, { autoAlpha: 0 }, 0); return g; };

  // ---------------------------------------------------------------- the pills: one colour per kind of text, fixed widths
  const PS = 24, PH = 48, GAP = 10;
  const KIND = {
    provider: { text: "provider's prompt", c: '#5b8def' },
    dev: { text: "developer's prompt", c: '#5b8def' },
    yours: { text: 'your instructions', c: '#86b6ff' },
    files: { text: 'project files', c: '#86b6ff' },
    custom: { text: 'custom instructions', c: '#86b6ff' },
    conv: { text: 'conversation so far', c: '#4a6fc4' },
    newest: { text: 'newest message', c: '#a9cdff' },
    answer: { c: '#8f8dff', w: 170 },
    fresh: { c: '#d2e6ff' },
    sInstr: { c: '#3fb0e0', w: 200 }, sConv: { c: '#5560c8', w: 330 }, sMsg: { c: '#b0b8ff', w: 170 },
  };
  const pw = k => (k === 'fresh' ? pw('newest') : KIND[k].w ?? Math.round(S.measure(KIND[k].text, { size: PS, weight: 600 }) + 34));
  const mkPill = (kind, x, y, o = {}, parent) => {
    const g = S.g(null, parent), w = o.w ?? pw(kind), c = KIND[kind].c;
    S.rect({ x, y: y - PH / 2, w, h: PH, r: 14, fill: '#0c1326' }, g);
    g.bg = S.rect({ x, y: y - PH / 2, w, h: PH, r: 14, fill: c, fillOpacity: o.text === false ? 0.55 : 0.28, stroke: c, sw: 2, dash: o.dash }, g);
    if (o.text !== false) g.lbl = S.text(o.label ?? KIND[kind].text, { x: x + w / 2, y: y + 1, size: PS, anchor: 'middle', weight: 600, color: 'ink' }, g);
    Object.assign(g, { x, w, cx: x + w / 2, cy: y, kind });
    return g;
  };
  const mkStrip = (kinds, x0, y, o = {}, parent) => {
    const g = S.g(null, parent);
    let x = x0;
    const xs = kinds.map(k => { const r = x; x += pw(k) + GAP; return r; });
    const total = x - GAP - x0;
    g.frame = S.rect({ x: x0 - 10, y: y - PH / 2 - 10, w: total + 20, h: PH + 20, r: 20, fill: '#0c1326', fillOpacity: 0.7, stroke: '#ffffff', strokeOpacity: 0.22, sw: 2 }, g);
    g.pills = kinds.map((k, i) => mkPill(k, xs[i], y, { text: o.text }, g));
    g.teal = ignore(S.rect({ x: x0 - 4, y: y - PH / 2 - 4, w: 0, h: PH + 8, r: 14, fill: 'helps', fillOpacity: 0.26, stroke: 'helps', sw: 2.5 }, g));
    if (o.label) g.lbl = S.text(o.label, { x: x0 - 8, y: y - PH / 2 - 32, size: 26, weight: 650, color: o.labelTone || 'ink' }, g);
    Object.assign(g, { x0, y, total, xs, kinds });
    g.span = n => g.xs[n - 1] + pw(kinds[n - 1]) - x0 + 4 + 4;   // teal width over the first n pills
    return g;
  };

  // ---------------------------------------------------------------- b1: does it reach the context? always yes
  const card = (x, w) => {
    const g = S.g();
    S.rect({ x, y: 170, w, h: 420, r: 26, fill: '#0c1326', filter: 'url(#shadow)' }, g);
    g.bg = S.rect({ x, y: 170, w, h: 420, r: 26, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.6, sw: 2.5 }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  };
  const L = card(140, 760);
  S.text('Does it reach the context?', { x: 180, y: 232, size: 38, weight: 700, family: 'display', color: 'ink' }, L);
  const lSub = S.text('always yes, no exceptions', { x: 180, y: 282, size: 26, weight: 550, color: 'muted' }, L);
  const lPills = [['provider', 'system prompt'], ['yours', 'tool definitions'], ['newest', 'loaded skill']].map(([k, t], i) => mkPill(k, 180, 370 + i * 70, { label: t, w: S.measure(t, { size: PS, weight: 600 }) + 34 }, L));
  const lTicks = lPills.map(p => tick(p.x + p.w + 34, p.cy));
  S.add(fx.in(L, { from: 'up', d: 0.6 }), 0.2);
  S.add(fx.pop(lTicks[0], { d: 0.4 }), 'b1~Yes');
  S.add(fx.pop(lTicks[1], { d: 0.4 }), 'b1~tool');
  S.add(fx.pop(lTicks[2], { d: 0.4 }), 'b1~loaded');
  S.add(fx.swap(lSub, 'forced by the architecture'), 'b1~forces-0.1');

  // ---------------------------------------------------------------- b2: does it cross the network from your device? that varies
  const settled = S.g();
  S.circle({ x: 520, y: 440, r: 40, fill: '#0c1326' }, settled);
  S.icon('ph:check-circle-duotone', { x: 520, y: 440, size: 84, color: 'helps' }, settled);
  S.text('already settled', { x: 520, y: 520, size: 28, anchor: 'middle', weight: 600, color: 'ink' }, settled);
  S.set(settled, { autoAlpha: 0 }, 0);
  const B2 = T('b2') - 0.1;
  lPills.forEach((p, i) => S.add(gsap.to([p, lTicks[i]], { x: 520 - (p.x + p.w / 2), y: 440 - p.cy, scale: 0.3, autoAlpha: 0, transformOrigin: '50% 50%', duration: 0.5, ease: 'power2.in' }), B2 + i * 0.05));
  S.add(fx.pop(settled, { d: 0.5 }), B2 + 0.45);
  S.add(gsap.to(L.bg, { attr: { 'fill-opacity': 0.4 }, duration: 0.4 }), B2);
  S.add(gsap.to(lSub, { autoAlpha: 0, duration: 0.3 }), B2);
  const R = card(1020, 760);
  S.text('Does it cross the network', { x: 1060, y: 232, size: 38, weight: 700, family: 'display', color: 'ink' }, R);
  S.text('from your device?', { x: 1060, y: 280, size: 38, weight: 700, family: 'display', color: 'ink' }, R);
  const rSub = S.text('that varies', { x: 1060, y: 336, size: 26, weight: 550, color: 'muted' }, R);
  S.set(rSub, { autoAlpha: 0 }, 0);
  S.icon('ph:laptop-duotone', { x: 1150, y: 470, size: 72, color: 'ink' }, R);
  S.icon('ph:hard-drives-duotone', { x: 1650, y: 470, size: 72, color: 'ink' }, R);
  const net = ignore(S.line({ x1: 1210, y1: 470, x2: 1590, y2: 470, stroke: 'struct', sw: 4 }, R));
  S.add(fx.in(R, { from: 'up', d: 0.6 }), B2 + 0.1);
  S.add(fx.in(rSub, { from: 'up', d: 0.4, dist: 12 }), 'b2~That');
  S.add(fx.swap(rSub, 'product decision: where it is stored'), 'b2~product-0.1');
  S.add(gsap.to([L, settled], { autoAlpha: 0, duration: 0.5 }), 'b2~decision');

  // ---------------------------------------------------------------- b3: three places
  const B3 = T('b3') - 0.1;
  S.add(gsap.to(R, { autoAlpha: 0, scale: 0.92, transformOrigin: '50% 50%', duration: 0.5, ease: 'power2.in' }), B3);
  const SHELF = [{ y: 150, h: 200 }, { y: 375, h: 200 }, { y: 600, h: 220 }];
  const shelfG = SHELF.map((s, i) => {
    const g = S.g();
    S.rect({ x: 96, y: s.y, w: 524, h: s.h, r: 22, fill: '#0c1326' }, g);
    S.rect({ x: 96, y: s.y, w: 524, h: s.h, r: 22, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.18, sw: 2 }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  });
  const IX = 166;
  const laptop = libDevice(S, { x: IX, y: SHELF[0].y + 104, w: 104 }, shelfG[0]);
  const badgeIcon = (x, y, id, g) => { S.circle({ x, y, r: 17, fill: '#0c1326', stroke: 'struct', sw: 2 }, g); S.icon(id, { x, y, size: 24, color: 'struct' }, g); };
  const srvYou = libServer(S, { x: IX, y: SHELF[1].y + 104, w: 112, detail: 'min', seed: 4 }, shelfG[1]);
  badgeIcon(IX + 50, SHELF[1].y + 80, 'ph:user-duotone', shelfG[1]);
  const srvAll = libServer(S, { x: IX, y: SHELF[2].y + 112, w: 112, detail: 'min', seed: 6 }, shelfG[2]);
  badgeIcon(IX + 50, SHELF[2].y + 88, 'ph:globe-duotone', shelfG[2]);
  const titles = ['On your device', 'On the server, for you', 'On the server, for everyone'].map((t, i) =>
    S.text(t, { x: 236, y: SHELF[i].y + 44, size: 26, weight: 650, color: 'ink' }, shelfG[i]));
  const sub3 = S.text('one copy, shared by all', { x: 236, y: SHELF[2].y + 80, size: 24, weight: 550, color: 'muted' }, shelfG[2]);
  S.set(sub3, { autoAlpha: 0 }, 0);
  const pDev = mkPill('dev', 236, SHELF[0].y + 126, {}, shelfG[0]);
  const pFiles = mkPill('files', 236, SHELF[1].y + 100, {}, shelfG[1]);
  const pCustom = mkPill('custom', 236, SHELF[1].y + 156, {}, shelfG[1]);
  const pProv = mkPill('provider', 236, SHELF[2].y + 156, {}, shelfG[2]);
  S.set([pDev, pFiles, pCustom, pProv], { autoAlpha: 0 }, 0);
  const SH = [T('b3~Your') - 0.2, T('b3~The server') - 0.2, T('b3~Or') - 0.1];
  shelfG.forEach((g, i) => S.add(fx.in(g, { from: 'left', d: 0.5, dist: 30 }), SH[i]));
  S.add(fx.in(pDev, { from: 'left', d: 0.4, dist: 20 }), 'b3~developer');
  S.add(fx.in(pFiles, { from: 'left', d: 0.4, dist: 20 }), 'b3~project');
  S.add(fx.in(pCustom, { from: 'left', d: 0.4, dist: 20 }), 'b3~custom');
  S.add(fx.in(sub3, { from: 'up', d: 0.35, dist: 10 }), 'b3~one copy');
  S.add(fx.in(pProv, { from: 'left', d: 0.4, dist: 20 }), 'b3~provider');
  // each title goes once the next shelf starts, leaving icons and pills
  S.add(fx.out(titles[0], { d: 0.3 }), SH[1]);
  S.add(fx.out(titles[1], { d: 0.3 }), SH[2]);
  S.add(fx.out([titles[2], sub3], { d: 0.3 }), 'b4-0.1');
  // 'sent with every call': a network line runs right from the laptop; a copy of the pill rides out three times
  const NY = SHELF[0].y + 104;
  const nLine = ignore(S.line({ x1: 640, y1: NY, x2: 1480, y2: NY, stroke: 'muted', sw: 3, dash: '10 10' }));
  const nSrv = libServer(S, { x: 1580, y: NY, w: 170, detail: 'min', seed: 8 });
  S.set([nLine, nSrv], { autoAlpha: 0 }, 0);
  S.add(gsap.to(nLine, { autoAlpha: 0.85, duration: 0.4 }), 'b3~sent');
  S.add(fx.in(nSrv, { from: 'right', d: 0.4, dist: 20 }), 'b3~sent');
  for (let k = 0; k < 3; k++) {
    const c = ignore(mkPill('dev', 640, NY));
    const t0 = T('b3~every') - 0.2 + k * 0.5;
    S.set(c, { autoAlpha: 0 }, 0);
    S.add(gsap.fromTo(c, { autoAlpha: 0, x: 0 }, { autoAlpha: 1, duration: 0.15, immediateRender: false }), t0);
    S.add(gsap.fromTo(c, { x: 0 }, { x: 1480 - 640 - pw('dev'), duration: 0.9, ease: 'power1.in', immediateRender: false }), t0);
    S.add(gsap.to(c, { autoAlpha: 0, duration: 0.2 }), t0 + 0.75);
  }
  // 'never sent by you': a crossed arrow from the laptop to the provider's prompt
  const never = S.g();
  const nArr = S.arrow({ x1: 650, y1: NY + 40, x2: 650, y2: SHELF[2].y + 150, color: 'muted', sw: 3, head: 12, dash: '8 7' }, never);
  S.path({ d: `M634,${(NY + SHELF[2].y + 190) / 2 - 16} l32,32 m0,-32 l-32,32`, stroke: 'bytes', sw: 4, cap: 'round' }, never);
  S.text('never sent by you', { x: 684, y: (NY + SHELF[2].y + 190) / 2 + 1, size: 26, weight: 600, color: 'muted' }, never);
  ignore(nArr);
  S.set(never, { autoAlpha: 0 }, 0);
  S.add(fx.in(never, { from: 'fade', d: 0.45 }), T('b3~provider') + 0.4);
  S.add(fx.out([never, nLine, nSrv], { d: 0.35 }), 'b4-0.4');

  // ---------------------------------------------------------------- b4: glued into one prompt, most shared first
  const top = mkStrip(['provider', 'yours', 'conv', 'newest'], 720, 480, { label: null });
  S.set(top.frame, { autoAlpha: 0 }, 0);
  S.set(top.pills, { autoAlpha: 0 }, 0);
  const asm = S.text('one assembled prompt', { x: 712, y: 480 - PH / 2 - 32, size: 26, weight: 650, color: 'ink' }, top);
  S.set(asm, { autoAlpha: 0 }, 0);
  S.add(gsap.set(top.frame, { autoAlpha: 1 }), 'b4~All');
  S.add(gsap.fromTo(top.frame, { attr: { width: 0 } }, { attr: { width: top.total + 20 }, duration: 0.7, ease: 'power3.out', immediateRender: false }), 'b4~All');
  S.add(fx.in(asm, { from: 'up', d: 0.4, dist: 10 }), T('b4~All') + 0.2);
  const fly = (p, from, at) => S.add(gsap.fromTo(p, { autoAlpha: 0, x: from[0] - p.cx, y: from[1] - p.cy }, { autoAlpha: 1, x: 0, y: 0, duration: 0.65, ease: 'power3.inOut' }), at);
  fly(top.pills[0], [pProv.cx, pProv.cy], T('b4~most') - 0.15);
  S.add(fx.out(asm, { d: 0.3 }), T('b4~most') + 0.5);
  fly(top.pills[1], [pCustom.cx, (pFiles.cy + pCustom.cy) / 2], T('b4~yours') - 0.2);
  fly(top.pills[2], [top.pills[2].cx, 300], T('b4~conversation') - 0.15);
  fly(top.pills[3], [IX, NY], T('b4~newest') - 0.2);
  const ord = S.g();
  S.arrow({ x1: 720, y1: 552, x2: 720 + top.total, y2: 552, color: 'muted', sw: 2.5, head: 12 }, ord);
  const ordLbl = S.text('most shared → most specific', { x: 720 + top.total / 2, y: 588, size: 26, anchor: 'middle', weight: 600, color: 'muted' }, ord);
  S.set(ord, { autoAlpha: 0 }, 0);
  S.add(fx.in(ord, { from: 'fade', d: 0.4 }), 'b4~order');
  // a developer's prompt or the provider's: same destination, same length, same cost
  S.add(fx.out(ordLbl, { d: 0.3 }), 'b4~developer-0.2');
  const ghost = ignore(mkPill('dev', 720, 480, { dash: '7 6' }));
  ghost.bg.setAttribute('fill-opacity', 0.12);
  S.set(ghost, { autoAlpha: 0 }, 0);
  const DV = T('b4~developer');
  S.add(gsap.fromTo(ghost, { autoAlpha: 0, x: pDev.x - 720, y: pDev.cy - 480 }, { autoAlpha: 0.95, x: 0, y: -66, duration: 0.7, ease: 'power3.inOut' }), DV - 0.1);
  S.add(gsap.to(ghost, { y: 0, duration: 0.45, ease: 'power2.in' }), 'b4~provider-0.1');
  S.add(gsap.to(top.pills[0].lbl, { autoAlpha: 0, duration: 0.2 }), T('b4~provider') + 0.3);
  const sameLbl = S.text('same tokens, same work', { x: 720 + pw('provider') / 2, y: 410, size: 26, anchor: 'middle', weight: 600, color: 'helps' });
  S.set(sameLbl, { autoAlpha: 0 }, 0);
  S.add(fx.in(sameLbl, { from: 'up', d: 0.4, dist: 10 }), 'b4~same-0.1');
  const STV = T('b4~Only');
  const feeds = SHELF.map((s, i) => ignore(S.path({ d: `M622,${s.y + s.h / 2} C670,${s.y + s.h / 2} 660,480 708,480`, stroke: 'muted', sw: 2.5, strokeOpacity: 0.8 })));
  S.set(feeds, { autoAlpha: 0 }, 0);
  S.add(gsap.set(feeds, { autoAlpha: 1 }), STV);
  S.add(fx.draw(feeds, { d: 0.6, stagger: 0.12 }), STV);
  S.add(fx.out([ghost, sameLbl], { d: 0.35 }), STV);
  S.add(gsap.to(top.pills[0].lbl, { autoAlpha: 1, duration: 0.3 }), STV + 0.1);
  const take = S.takeaway('storage varies, destination never does', { tone: 'struct' });
  S.add(fx.in(take, { from: 'up', d: 0.5 }), 'b4~storage-0.2');

  // ---------------------------------------------------------------- b5: the strip lifts: your request; the server may keep work
  const B5 = T('b5') - 0.1;
  S.add(fx.out([ord, take, ...feeds, ...shelfG], { d: 0.45, stagger: 0 }), B5);
  const SX = 160, Y1 = 300, Y2 = 480, Y3 = 660;
  S.xset(top, { x: 0, y: 0, s: 1, ox: 720, oy: 480 });
  S.add(fx.xform(top, { x: SX - 720, y: Y1 - 480, s: 1 }, { d: 0.9, ease: 'power3.inOut' }), B5 + 0.2);
  const reqLbl = S.text('your request', { x: 712, y: 480 - PH / 2 - 32, size: 26, weight: 650, color: 'ink' }, top);
  S.set(reqLbl, { autoAlpha: 0 }, 0);
  S.add(fx.in(reqLbl, { from: 'up', d: 0.4, dist: 10 }), B5 + 0.9);
  const model = ch03ModelBlock(S, { x: 1440, y: 150, h: 120, size: 30, empty: true });
  S.set(model, { autoAlpha: 0 }, 0);
  S.add(fx.in(model, { from: 'right', d: 0.5, dist: 30 }), 'b5~remembers-0.2');
  const kept = S.g();
  const KS = { x: 1630, y: 560 };
  libServer(S, { x: KS.x, y: KS.y, w: 220, detail: 'lite', seed: 12 }, kept);
  const slabs = [0, 1, 2, 3].map(i => S.rect({ x: KS.x - 100, y: KS.y - 46 - i * 17, w: 200, h: 12, r: 3, fill: 'url(#bar-bytes)', stroke: 'bytes', sw: 1 }, kept));
  const keptLbl = S.text('kept work', { x: KS.x, y: KS.y - 136, size: 26, anchor: 'middle', weight: 650, color: 'bytes' }, kept);
  S.icon('ph:clock-duotone', { x: KS.x + 150, y: KS.y - 70, size: 40, color: 'muted' }, kept);
  const nextTag = S.pill('→ next chapter', { x: KS.x, y: KS.y + 70, h: 40, size: 22, tone: 'neutral', style: 'outline' }, kept);
  S.set([kept, nextTag, keptLbl, ...slabs], { autoAlpha: 0 }, 0);
  const RUN = T('b5~running') - 0.2;
  S.add(gsap.set(kept, { autoAlpha: 1 }), RUN);
  S.add(fx.in(kept.firstChild, { from: 'up', d: 0.4 }), RUN);
  slabs.forEach((s, i) => {
    S.add(gsap.fromTo(s, { autoAlpha: 0, attr: { width: 0 } }, { autoAlpha: 1, attr: { width: 200 }, duration: 0.3, ease: 'power2.out', immediateRender: false }), RUN + 0.4 + i * 0.3);
    S.add(gsap.fromTo(top.pills[i].bg, { attr: { stroke: KIND[top.kinds[i]].c } }, { attr: { stroke: S.tone('bytes') }, duration: 0.15, yoyo: true, repeat: 1, immediateRender: false }), RUN + 0.4 + i * 0.3);
  });
  S.add(fx.in(keptLbl, { from: 'up', d: 0.35, dist: 10 }), RUN + 1.0);
  S.add(fx.pop(nextTag, { d: 0.4 }), 'b5~next');

  // ---------------------------------------------------------------- b6: a beginning identical token for token: the prefix
  const B6 = T('b6') - 0.1;
  S.add(fx.out([model, kept], { d: 0.4, stagger: 0 }), B6);
  const stranger = mkStrip(['provider', 'sInstr', 'sConv', 'sMsg'], SX, Y2, { text: false, label: "a stranger's request", labelTone: 'muted' });
  const nextTurn = mkStrip(['provider', 'yours', 'conv', 'newest', 'answer', 'fresh'], SX, Y3, { text: false, label: 'your next turn' });
  S.set([stranger, nextTurn], { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(stranger, { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: 0.55, ease: 'power3.out' }), B6 + 0.3);
  // the first sweep: both strips match only through the provider's prompt
  const SW1 = T('b6~token') - 0.1;
  [top, stranger].forEach(st => S.add(gsap.fromTo(st.teal, { attr: { width: 0 } }, { attr: { width: st.span(1) }, duration: 0.8, ease: 'power2.inOut', immediateRender: false }), SW1));
  const prefLbl = S.text('prefix', { x: SX + pw('provider') / 2, y: Y1 + PH / 2 + 44, size: 28, anchor: 'middle', weight: 700, color: 'helps' });
  S.set(prefLbl, { autoAlpha: 0 }, 0);
  S.add(fx.in(prefLbl, { from: 'up', d: 0.35, dist: 10 }), T('b6~prefix') - 0.2);
  // most shared first: the next turn repeats your whole request, and the answer
  const MS = T('b6~Most') - 0.1;
  S.add(fx.out(prefLbl, { d: 0.3 }), MS);
  S.add(gsap.to([...stranger.pills, stranger.frame], { opacity: 0.35, duration: 0.4 }), MS);
  S.add(fx.out(stranger.lbl, { d: 0.3 }), MS);
  S.add(gsap.fromTo(nextTurn, { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: 0.55, ease: 'power3.out' }), MS + 0.1);
  const SW2 = T('b6~makes') - 0.2;
  S.add(gsap.to(top.teal, { attr: { width: top.span(4) }, duration: 0.9, ease: 'power2.inOut' }), SW2);
  S.add(gsap.fromTo(nextTurn.teal, { attr: { width: 0 } }, { attr: { width: nextTurn.span(5) }, duration: 1.0, ease: 'power2.inOut', immediateRender: false }), SW2);
  const further = S.text('matches further', { x: SX + nextTurn.span(5) - 8, y: Y3 + PH / 2 + 40, size: 26, anchor: 'end', weight: 650, color: 'helps' });
  S.set(further, { autoAlpha: 0 }, 0);
  S.add(fx.in(further, { from: 'up', d: 0.35, dist: 10 }), SW2 + 1.0);
  // newest first, and nothing matches; then everything snaps back
  const NF = T('b6~Newest') - 0.05, BACK = Math.min(T('b6~matches') + 0.55, S.duration - 0.9);
  const tealW = { top: top.span(4), stranger: stranger.span(1), next: nextTurn.span(5) };
  [[top, 'top'], [stranger, 'stranger'], [nextTurn, 'next']].forEach(([st, key]) => {
    const n = st.pills.length, last = st.pills[n - 1], lw = pw(st.kinds[n - 1]) + GAP;
    S.add(gsap.to(last, { x: -(last.x - st.x0), y: 0, duration: 0.5, ease: 'power3.inOut' }), NF);
    st.pills.slice(0, -1).forEach(p => S.add(gsap.to(p, { x: lw, duration: 0.5, ease: 'power3.inOut' }), NF));
    S.add(gsap.to(st.teal, { attr: { width: 0 }, duration: 0.3, ease: 'power2.in' }), NF + 0.1);
    S.add(gsap.to([...st.pills], { x: 0, duration: 0.45, ease: 'power3.inOut' }), BACK);
    S.add(gsap.to(st.teal, { attr: { width: tealW[key] }, duration: 0.5, ease: 'power2.out' }), BACK + 0.35);
  });
  S.add(fx.out(further, { d: 0.25 }), NF);
  const nothing = S.text('nothing matches', { x: 1500, y: Y2 + 1, size: 32, anchor: 'middle', weight: 650, color: 'muted' });
  S.set(nothing, { autoAlpha: 0 }, 0);
  S.add(fx.in(nothing, { from: 'fade', d: 0.3 }), 'b6~nothing-0.1');
  S.add(fx.out(nothing, { d: 0.3 }), BACK);
  S.call(() => [top, stranger, nextTurn].forEach(st => st.setAttribute('data-audit', 'ignore')), NF);
  S.call(() => [top, stranger, nextTurn].forEach(st => st.removeAttribute('data-audit')), BACK + 0.5);
});
