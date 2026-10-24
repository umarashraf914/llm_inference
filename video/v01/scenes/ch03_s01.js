/* ch03_s01 · the machine at the other end (fig 16)
   b1  laptop left, server right, the network between: the question goes out, the answer comes back.
   b2  one small chip against a few GPUs; the laptop closes, the server never switches off.
   b3  the camera pulls back to a data centre (powered, cooled, day and night), then pushes into one server:
       a question arrives and is handled in a fraction of a second.
   b4  shared by many, always on, paid by the hour: production.
   World coordinates equal screen coordinates in b1-b2 (camera at rest). From the push-in in b3 the server
   is shown at 1.2x, centred at (960, 480); everything around it from then on lives in the HUD. */
V.scene('ch03_s01', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const LX = 340, SX = 1580, Y = 470, SW = 440;          // laptop centre x, server centre x, the line's y, server width

  // ================================================================ the server: one unit of a data-centre hall
  // The hall is built around the scene's server (heroAt) and stays hidden until the pull-back in b3.
  const dc = libDataCentre(S, {
    rows: 3, racks: 12, units: 8, hero: { row: 1, rack: 5, unit: 3 }, heroAt: { x: SX, y: Y, w: SW },
    heroOpts: { gpus: 4, gpuHbm: 1, seed: 11 }, label: null, blinkers: 70, seed: 4,
  });
  const srv = dc.hero;
  const PL = { x: +srv.powerLed.getAttribute('cx'), y: +srv.powerLed.getAttribute('cy') };

  // ================================================================ b1: the question goes out, the answer comes back
  const user = S.g();
  const lap = libDevice(S, { x: LX, y: Y, w: 330, chip: true }, user);
  const wire = ch03Wire(S, { x1: LX + 158, y1: Y, x2: srv.l - 18, y2: Y }, user);
  S.add(fx.in(lap, { from: 'left', d: 0.8 }), 0.1);
  S.add(fx.in(srv, { from: 'right', d: 0.8 }), 0.25);
  S.add(wire.drawOn({ d: 1.1 }), 0.75);
  S.add(lap.ping({ d: 0.6 }), 'b1~laptop-0.1');

  // "your question" appears on the screen, rides the line through the globe and is taken in by the server
  const scr = lap.port('screen');
  const q = libToken(S, { text: 'your question', x: scr.x, y: scr.y, size: 26 });
  const qEnd = srv.l - 14 - q.w / 2;
  S.add(q.pop({ d: 0.45 }), 'b1~question-0.3');
  S.add(q.travel(`M${q.cx},${q.cy} L${wire.x1 + q.w / 2 + 6},${Y} L${qEnd},${Y}`, { d: 1.45, ease: 'power1.inOut' }), 'b1~crosses-0.15');
  S.add(wire.pulseGlobe(), 'b1~network-0.2');
  S.add(q.moveBy(34, 0, { d: 0.3, ease: 'power2.in' }), 'b1~server-0.1');
  S.add(q.out({ d: 0.3 }), 'b1~server-0.1');
  S.add(srv.activity({ d: 1.0, rate: 7, seed: 3 }), 'b1~server');
  // a smaller "answer" leaves the server and comes back to the screen
  const ans = libToken(S, { text: 'answer', x: srv.l - 14, y: Y, size: 24, anchor: 'start' });
  ans.style.opacity = 0; ans.style.visibility = 'hidden';
  S.add(ans.pop({ d: 0.4 }), 'b1~answer-0.2');
  S.add(ans.travel(`M${ans.cx},${ans.cy} L${wire.x1 + ans.w / 2 + 6},${Y} L${scr.x},${scr.y}`, { d: 0.85, ease: 'power2.inOut' }), 'b1~answer');
  S.add(lap.ping({ d: 0.6 }), 'b1~back');
  S.add(ans.out({ d: 0.35 }), 'b1>');

  // ================================================================ b2: one small chip; a few GPUs, never off
  const card = (cx, title, sub) => S.card({ x: cx - 240, y: 680, w: 480, h: 128, tone: 'neutral', title, sub, size: 38, subSize: 28, layout: 'center' });
  const lapCard = card(LX, 'Your laptop', 'one small chip, on when opened');
  const srvCard = card(SX, 'A server', 'a few GPUs, always on');
  S.add(fx.in(lapCard, { from: 'up', d: 0.6 }), 'b2~laptop-0.3');
  S.add(fx.in(lapCard.subEl, { from: 'up', d: 0.5, dist: 14 }), 'b2~one-0.15');
  S.add(lap.chip.pulse({ scale: 1.6, d: 0.9 }), 'b2~chip-0.2');

  S.add(fx.in(srvCard, { from: 'up', d: 0.6 }), 'b2~server-0.25');
  S.add(srv.open({ draw: false, d: 0.8 }), 'b2~few-0.3');
  S.add(fx.in(srvCard.subEl, { from: 'up', d: 0.5, dist: 14 }), 'b2~few-0.1');
  // "big chips built for this work": four GPU packages draw in, one by one, then get to work
  const tBig = T('b2~big');
  srv.gpus.forEach((gp, i) => S.add(gp.drawOn({ d: 0.8 }), tBig - 0.15 + i * 0.36));
  srv.gpus.forEach((gp, i) => S.add(gp.compute({ d: 2.2, rate: 2.4, seed: 5 + i }), T('b2~work') - 0.1 + i * 0.05));
  S.add(srv.activity({ d: 2.6, rate: 4, seed: 8 }), 'b2~work-0.2');

  // "never switches off": the server's power light pings and stays lit while the laptop closes and reopens
  const ringG = S.g(null, srv);
  ringG.setAttribute('data-audit', 'ignore');
  const pings = [0, 1].map(() => S.circle({ x: PL.x, y: PL.y, r: 8, stroke: 'helps', sw: 2.5, opacity: 0 }, ringG));
  const pingAt = (c, at) => S.add(gsap.fromTo(c, { attr: { r: 8 }, opacity: 0.95 }, { attr: { r: 34 }, opacity: 0, duration: 0.9, ease: 'power2.out', immediateRender: false }), at);
  pingAt(pings[0], 'b2~never-0.05');
  pingAt(pings[1], 'b2~off-0.1');
  S.add(lap.close({ d: 0.55 }), 'b2~never-0.1');
  S.add(lap.open({ d: 0.55 }), 'b2~off');

  // ================================================================ b3: a warehouse of servers, then back into one
  S.add(fx.out([lapCard, srvCard], { d: 0.35 }), 'b3-0.15');
  S.add(srv.close({ d: 0.45 }), 'b3-0.15');
  S.add(fx.out(user, { d: 0.35 }), 'b3+0.05');

  // the pull-back: rack, aisle, then the whole building, which settles centred at (900, 610), 1,100 px wide
  const B = dc.building;
  const s1 = 1100 / B.w;
  const C1 = { x: B.x + B.w / 2 + 60 / s1, y: B.y + B.h / 2 - 70 / s1, scale: s1 };
  const pull = gsap.timeline();
  pull.fromTo(dc.racksG, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power1.out' }, 0);
  pull.fromTo(dc.buildingG, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power1.inOut' }, 0.9);
  pull.add(fx.cam({ ...C1, d: 2.6, ease: 'expo.inOut' }), 0);
  S.add(pull, 'b3+0.15');
  S.add(dc.blink({ d: 6.4, rate: 2.2 }), 'b3+0.3');

  // decorations drawn in screen space for the pulled-back camera
  const toScr = (C, wx, wy) => ({ x: 960 + (wx - C.x) * C.scale, y: 540 + (wy - C.y) * C.scale });
  const bTL = toScr(C1, B.x, B.y), bBR = toScr(C1, B.x + B.w, B.y + B.h);
  const hall = S.g(null, S.hud);
  const dcLabel = S.text('data centre', { x: bBR.x + 44, y: (bTL.y + bBR.y) / 2 - 40, size: 46, weight: 700, family: 'display' }, hall);
  S.add(fx.in(dcLabel, { from: 'left', d: 0.6 }), 'b3~servers-0.25');

  // powered: a supply point to the right, its line drawn to the wall, power flowing in
  const py = bBR.y - 120, px = bBR.x + 220;
  const pLine = S.line({ x1: px - 34, y1: py, x2: bBR.x + 3, y2: py, stroke: 'muted', sw: 3 }, hall);
  pLine.setAttribute('data-audit', 'ignore');
  const bolt = S.g(null, hall);
  S.circle({ x: px, y: py, r: 34, fill: '#0c1326', stroke: 'muted', strokeOpacity: 0.5, sw: 2 }, bolt);
  S.icon('fluent:high-voltage', { x: px, y: py, size: 44 }, bolt);
  S.add(fx.pop(bolt, { d: 0.5 }), 'b3~powered-0.25');
  S.add(fx.draw(pLine, { d: 0.45 }), 'b3~powered-0.05');
  S.flow({ d: `M${px - 40},${py} L${bBR.x + 4},${py}`, from: T('b3~powered') + 0.35, to: 'b3~inside-0.9', speed: 190, every: 0.22, size: 4, color: 'ink', glow: false }, hall);

  // cooled: the rooftop fans turn
  S.add(dc.spinFans({ d: 3.4, turns: 4.5, ease: 'power1.inOut' }), 'b3~cooled-0.15');

  // day and night: the sun and then the moon cross an arc over the roof
  const AC = { x: (bTL.x + bBR.x) / 2, y: bTL.y + 40, rx: (bBR.x - bTL.x) / 2 + 110, ry: 180 };
  const arcPt = th => ({ x: AC.x - AC.rx * Math.cos(th), y: AC.y - AC.ry * Math.sin(th) });
  const arc = S.path({ d: `M${AC.x - AC.rx},${AC.y} A${AC.rx},${AC.ry} 0 0 1 ${AC.x + AC.rx},${AC.y}`, stroke: 'faint', sw: 2, dash: '4 10' }, hall);
  arc.setAttribute('data-audit', 'ignore');
  S.add(gsap.fromTo(arc, { autoAlpha: 0 }, { autoAlpha: 0.8, duration: 0.5 }), 'b3~day-0.4');
  const sky = (id, t0, d) => {
    const g = S.g(null, hall);
    const ic = S.icon(id, { x: 0, y: 0, size: 58 }, g);
    const p = { th: 0 };
    const put = () => { const q2 = arcPt(p.th); g.setAttribute('transform', `translate(${q2.x.toFixed(2)},${q2.y.toFixed(2)})`); };
    put();
    const tl = gsap.timeline();
    tl.fromTo(ic, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 0);
    tl.fromTo(p, { th: 0 }, { th: Math.PI, duration: d, ease: 'none', onUpdate: put, immediateRender: false }, 0);
    tl.fromTo(ic, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25, immediateRender: false }, d - 0.25);
    S.add(tl, t0);
    return g;
  };
  sky('fluent:sun', T('b3~day') - 0.15, 1.3);
  sky('fluent:crescent-moon', T('b3~night') + 0.15, 1.4);

  // "almost everything ahead happens inside one server": this one lights up, the rest step back
  S.add(srv.glow({ tone: 'struct', d: 0.5 }), 'b3~Almost-0.1');
  S.add(gsap.fromTo(dc.racksG, { opacity: 1 }, { opacity: 0.5, duration: 0.6, immediateRender: false }), 'b3~everything');
  S.add(fx.out(hall, { d: 0.4 }), 'b3~inside-0.7');

  // the push-in: the hall falls away and one server is left, centred
  const C2 = { x: SX, y: Y + 50, scale: 1.2 };            // the server lands at screen (960, 480)
  S.add(fx.cam({ ...C2, d: 1.6, ease: 'power3.inOut' }), 'b3~inside-0.45');
  S.add(gsap.fromTo(dc.buildingG, { opacity: 1 }, { opacity: 0, duration: 0.6, immediateRender: false }), 'b3~inside-0.4');
  S.add(gsap.fromTo(dc.racksG, { opacity: 0.5 }, { opacity: 0, duration: 0.8, immediateRender: false }), 'b3~inside-0.1');
  S.add(srv.unglow({ d: 0.6 }), 'b3~one+0.5');
  const sv = toScr(C2, SX, Y), sL = sv.x - SW * C2.scale / 2, sR = sv.x + SW * C2.scale / 2;

  // the user's end comes back small at the far left; a question arrives; the stopwatch barely moves
  const mini = S.g(null, S.hud);
  const ml = libDevice(S, { x: 236, y: sv.y, w: 170 }, mini);
  const NET = { x: 506, y: sv.y };                         // the globe: every user's line runs through it
  const mw = ch03Wire(S, { x1: 318, y1: sv.y, x2: sL - 16, y2: sv.y, globe: NET, globeSize: 44 }, S.hud);
  S.add(fx.in(ml, { from: 'left', d: 0.6 }), 'b3~one-0.1');
  S.add(mw.drawOn({ d: 0.6 }), 'b3~one+0.15');
  const q2 = libToken(S, { text: 'your question', x: 326, y: sv.y, size: 24, anchor: 'start' }, S.hud);
  q2.style.opacity = 0; q2.style.visibility = 'hidden';
  const q2End = sL - 12 - q2.w / 2;
  S.add(q2.travel(`M${q2.cx},${q2.cy} L${q2End},${sv.y}`, { d: 0.6, ease: 'power2.inOut', appear: true }), 'b3~in a-0.45');
  S.add(q2.moveBy(30, 0, { d: 0.25, ease: 'power2.in' }), 'b3~in a+0.15');
  S.add(q2.out({ d: 0.25 }), 'b3~in a+0.15');

  const sw = libStopwatch(S, { x: 1470, y: sv.y - 10, size: 150, span: 1000, readout: 'none', tone: 'struct' }, S.hud);
  const swLabel = S.text('a fraction of a second', { x: 1470, y: sv.y + 96, size: 28, weight: 550, color: 'muted', anchor: 'middle' }, S.hud);
  S.add(sw.in({ d: 0.5 }), 'b3~one');
  S.add(sw.run(0, 240, { d: 0.45 }), 'b3~in a+0.2');
  S.add(srv.activity({ d: 0.6, rate: 9, seed: 12 }), 'b3~in a+0.2');
  S.add(fx.in(swLabel, { from: 'up', d: 0.5 }), 'b3~fraction-0.05');
  // and the answer goes back
  const a2 = libToken(S, { text: 'answer', x: sL - 14, y: sv.y, size: 24, anchor: 'start' }, S.hud);
  a2.style.opacity = 0; a2.style.visibility = 'hidden';
  S.add(a2.travel(`M${a2.cx},${a2.cy} L${336 + a2.w / 2},${sv.y}`, { d: 0.6, ease: 'power2.inOut', appear: true }), 'b3~second-0.35');
  S.add(a2.out({ d: 0.3 }), 'b3~second+0.35');
  S.add(ml.ping({ d: 0.5 }), 'b3~second+0.2');

  // ================================================================ b4: shared, always on, paid by the hour
  S.add(fx.out(swLabel, { d: 0.4 }), 'b4-0.3');
  S.add(fx.dim(sw, { to: 0.55, d: 0.5 }), 'b4-0.3');

  // shared by many: more people, on more devices, through the same network, into the same server
  const more = [
    libDevice(S, { kind: 'phone', x: 236, y: sv.y - 190, w: 62 }, mini),
    libDevice(S, { x: 236, y: sv.y + 195, w: 150 }, mini),
  ];
  const mw2 = [
    ch03Wire(S, { x1: 236 + 48, y1: sv.y - 178, x2: NET.x - 22, y2: NET.y - 16, globe: false }, S.hud),
    ch03Wire(S, { x1: 236 + 82, y1: sv.y + 182, x2: NET.x - 22, y2: NET.y + 16, globe: false }, S.hud),
  ];
  S.add(fx.in(more, { from: 'left', d: 0.6, stagger: 0.12 }), 'b4~Shared-0.2');
  mw2.forEach((w, i) => S.add(w.drawOn({ d: 0.5 }), T('b4~Shared') + 0.1 + i * 0.12));
  // requests keep arriving from all three, until the end
  [[mw2[0].x1, mw2[0].y1, 0.62], [326, sv.y, 0.47], [mw2[1].x1, mw2[1].y1, 0.71]].forEach(([x0, y0, every], i) => {
    S.flow({ d: `M${x0},${y0} L${NET.x},${NET.y} L${sL - 6},${sv.y}`, from: T('b4~Shared') + 0.45 + i * 0.17, to: 'end', speed: 330, every, size: 6, color: 'struct', shape: 'chip' }, S.hud);
  });
  S.add(srv.activity({ d: 5.2, rate: 4, seed: 21 }), 'b4~Shared');

  // three tags stamp in under the server, one per phrase
  const tagRow = S.g(null, S.hud);
  const tags = [['shared', [CH03.icons.shared]], ['always on', [CH03.icons.alwaysOn]], ['paid by the hour', [CH03.icons.hour, CH03.icons.coin]]]
    .map(([t, ic]) => ch03Tag(S, t, { x: 0, y: sv.y + 205, icons: ic, anchor: 'start', size: 30 }, tagRow));
  const TG = 30, total = tags.reduce((a, t) => a + t.w, 0) + TG * (tags.length - 1);
  let tx = 960 - total / 2;
  tags.forEach(t => { S.xset(t, { x: tx }); tx += t.w + TG; });
  S.add(tags[0].stamp(), 'b4~Shared-0.2');
  S.add(tags[1].stamp(), 'b4~always-0.2');
  pingAt(pings[0], 'b4~always');
  S.add(tags[2].stamp(), 'b4~paid-0.2');

  // production
  const prod = S.text('production', { x: 960, y: sv.y - 190, size: 56, weight: 700, family: 'display', anchor: 'middle' }, S.hud);
  S.add(fx.in(prod, { from: 'scale', scale: 1.18, d: 0.6 }), 'b4~production-0.2');
});
