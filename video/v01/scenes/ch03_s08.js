/* ch03_s08 · a tool is two different things (fig 23)
   A tool's description (name, inputs, output) is text in the context; its code never is. The model
   only emits text shaped like a call; the serving system spots it, ordinary software runs the code,
   and the result returns as text. The code can live anywhere, even in a plugin. Only documentation
   costs tokens: a long description costs tokens every turn, a thousand lines of code cost none. */
V.scene('ch03_s08', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const WX = 1400;                                       // the wall: context on the left, code on the right

  // ---------------------------------------------------------------- b1: for a tool, two very different things exist
  const head = S.text('For a tool, two very different things exist', { x: 960, y: 128, size: 40, anchor: 'middle', weight: 700, family: 'display', color: 'ink' });
  S.add(fx.in(head, { from: 'up', d: 0.5 }), 0.15);
  S.add(fx.out(head, { d: 0.4 }), 'b2');
  const wrench = S.g();
  S.circle({ x: 960, y: 330, r: 64, fill: '#0c1326', stroke: 'struct', sw: 2.5 }, wrench);
  S.icon('ph:wrench-duotone', { x: 960, y: 330, size: 72, color: 'ink' }, wrench);
  S.set(wrench, { autoAlpha: 0 }, 0);
  S.add(fx.pop(wrench, { d: 0.5 }), 'b1~tool');
  S.add(gsap.to(wrench, { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 50%', duration: 0.35, ease: 'power2.in' }), 'b1~Its-0.15');

  const DC = { x: 160, y: 200, w: 740, h: 270 };
  const desc = S.g();
  S.rect({ x: DC.x, y: DC.y, w: DC.w, h: DC.h, r: 24, fill: '#0c1326', filter: 'url(#shadow)' }, desc);
  S.rect({ x: DC.x, y: DC.y, w: DC.w, h: DC.h, r: 24, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.65, sw: 2.5 }, desc);
  S.icon('ph:file-text-duotone', { x: DC.x + 44, y: DC.y + 48, size: 40, color: 'struct' }, desc);
  S.text('The description', { x: DC.x + 78, y: DC.y + 49, size: 32, weight: 700, color: 'ink' }, desc);
  const LINES = ['name: get_weather', 'arguments (inputs): city', 'returns: temperature'];
  const dLines = LINES.map((t, i) => S.text(t, { x: DC.x + 44, y: DC.y + 112 + i * 50, size: 28, weight: 500, family: 'mono', color: 'ink' }, desc));
  S.set(dLines, { autoAlpha: 0 }, 0);
  S.set(desc, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(desc, { autoAlpha: 0, x: 960 - (DC.x + DC.w / 2), scale: 0.4, transformOrigin: '50% 50%' }, { autoAlpha: 1, x: 0, scale: 1, duration: 0.7, ease: 'power3.out' }), 'b1~Its-0.1');
  S.add(fx.in(dLines[0], { from: 'left', d: 0.35, dist: 14 }), 'b1~name');
  S.add(fx.in(dLines[1], { from: 'left', d: 0.35, dist: 14 }), 'b1~inputs');
  S.add(fx.in(dLines[2], { from: 'left', d: 0.35, dist: 14 }), 'b1~output');

  const IC = { x: 1440, y: 200, w: 380, h: 270 };
  const impl = S.g();
  S.rect({ x: IC.x, y: IC.y, w: IC.w, h: IC.h, r: 24, fill: '#0c1326', filter: 'url(#shadow)' }, impl);
  S.rect({ x: IC.x, y: IC.y, w: IC.w, h: IC.h, r: 24, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.22, sw: 2 }, impl);
  S.icon('ph:file-code-duotone', { x: IC.x + 38, y: IC.y + 46, size: 38, color: 'muted' }, impl);
  S.text('The implementation', { x: IC.x + 68, y: IC.y + 47, size: 30, weight: 700, color: 'ink' }, impl);
  S.text('the code that actually runs', { x: IC.x + 22, y: IC.y + 88, size: 24, weight: 550, color: 'muted' }, impl);
  // code lines inside a clip, scrolled by the painter while the code runs
  const cid = 's08-code-clip';
  const cp = S.el('clipPath', { id: cid }, impl);
  S.rect({ x: IC.x + 20, y: IC.y + 112, w: IC.w - 40, h: 140 }, cp);
  const codeWin = S.g(null, impl);
  codeWin.setAttribute('clip-path', `url(#${cid})`);
  const code = ignore(S.g(null, codeWin));
  const cr = S.rand(17), CODE_N = 24, CL = 20;
  const codeTones = ['#ffffff', 'struct', 'compute', 'helps', 'violet'];
  for (let i = 0; i < CODE_N; i++) {
    const ind = [0, 24, 24, 48, 48, 24][i % 6];
    let x = IC.x + 30 + ind;
    const n = 1 + Math.floor(cr() * 3);
    for (let k = 0; k < n && x < IC.x + IC.w - 60; k++) {
      const w = 24 + cr() * 90;
      S.rect({ x, y: IC.y + 118 + i * CL, w: Math.min(w, IC.x + IC.w - 40 - x), h: 8, r: 4, fill: codeTones[Math.floor(cr() * codeTones.length)], fillOpacity: 0.32 }, code);
      x += w + 10;
    }
  }
  S.set(impl, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(impl, { autoAlpha: 0, x: 960 - (IC.x + IC.w / 2), scale: 0.4, transformOrigin: '50% 50%' }, { autoAlpha: 1, x: 0, scale: 1, duration: 0.7, ease: 'power3.out' }), 'b1~Its-0.05');
  // the two cards grow out of the wrench: small on purpose for a moment
  S.call(() => { desc.setAttribute('data-audit', 'ignore'); impl.setAttribute('data-audit', 'ignore'); }, 0);
  S.call(() => { desc.removeAttribute('data-audit'); impl.removeAttribute('data-audit'); }, T('b1~Its') + 0.7);

  // the context strip along the bottom, the model at its right end
  const SY = 800, SX0 = 132;
  const strip = S.g();
  S.rect({ x: 120, y: SY - 34, w: 1080, h: 68, r: 18, fill: '#0c1326' }, strip);
  S.rect({ x: 120, y: SY - 34, w: 1080, h: 68, r: 18, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.5, sw: 2 }, strip);
  S.text('context', { x: 124, y: SY - 58, size: 26, weight: 650, color: 'struct' }, strip);
  const sysP = libToken(S, { text: 'system prompt', x: SX0, y: SY, size: 24, anchor: 'start' }, strip);
  const model = libMemBlock(S, { x: 1222, y: SY - 38, w: 150, h: 76, label: 'model', family: 'sans', size: 28, tone: 'bytes', style: 'solid', shadow: false });
  S.set([strip, model], { autoAlpha: 0 }, 0);
  S.add(fx.in(strip, { from: 'up', d: 0.5, dist: 20 }), 'b1~text-0.6');
  S.add(fx.in(model, { from: 'right', d: 0.5, dist: 20 }), 'b1~text-0.5');
  // 'text in the context': the card shrinks into a pill and drops into the strip
  const descP = libToken(S, { text: 'tool description', x: sysP.r + 10, y: SY, size: 24, anchor: 'start' });
  S.set(descP, { autoAlpha: 0 }, 0);
  const TIC = T('b1~text') - 0.05;
  S.xset(desc, { x: 0, y: 0, s: 1, ox: DC.x + DC.w / 2, oy: DC.y + DC.h / 2 });
  S.add(fx.xform(desc, { x: descP.cx - (DC.x + DC.w / 2), y: SY - (DC.y + DC.h / 2), s: 0.24 }, { d: 0.7, ease: 'power3.in' }), TIC);
  S.add(gsap.to(desc, { autoAlpha: 0, duration: 0.15 }), TIC + 0.6);
  S.add(descP.pop({ d: 0.45 }), TIC + 0.6);
  S.call(() => desc.setAttribute('data-audit', 'ignore'), TIC);
  // 'its code never is': a wall between the code and the context
  const wall = ignore(S.line({ x1: WX, y1: 180, x2: WX, y2: 900, stroke: 'muted', sw: 6, cap: 'round' }));
  const wallLbl = S.text('never enters the context', { x: WX + 24, y: 530, size: 26, weight: 600, color: 'muted' });
  S.set([wall, wallLbl], { autoAlpha: 0 }, 0);
  S.add(gsap.set(wall, { autoAlpha: 1 }), 'b1~never-0.1');
  S.add(fx.draw(wall, { d: 0.55 }), 'b1~never-0.1');
  S.add(fx.in(wallLbl, { from: 'left', d: 0.4, dist: 14 }), 'b1~never+0.3');

  // ---------------------------------------------------------------- b2: the model emits a call; the serving system runs the code
  const gear = S.g();
  S.circle({ x: WX, y: 640, r: 42, fill: '#0c1326', stroke: 'ink', sw: 2.5 }, gear);
  const gearIc = S.icon('ph:gear-six-duotone', { x: WX, y: 640, size: 54, color: 'ink' }, gear);
  const gearLbl = S.text('serving system', { x: WX - 56, y: 641, size: 26, anchor: 'end', weight: 600, color: 'ink' });
  S.set([gear, gearLbl], { autoAlpha: 0 }, 0);
  S.add(fx.pop(gear, { d: 0.45 }), 'b2~model');
  S.add(fx.in(gearLbl, { from: 'right', d: 0.35, dist: 12 }), T('b2~model') + 0.2);
  // emitted tokens assemble into the call
  const callP = libToken(S, { text: "get_weather(city: 'Seoul')", x: descP.r + 10, y: SY, size: 24, mono: true, anchor: 'start' });
  S.set(callP, { autoAlpha: 0 }, 0);
  const EMIT = T('b2~emits') - 0.1;
  const chips = [0, 1, 2, 3, 4].map(i => {
    const c = libToken(S, { text: '', x: model.l - 10, y: SY, w: 34, h: 30, r: 8, decorative: true, hidden: true });
    const tx = callP.l + 20 + i * ((callP.w - 40) / 4);
    S.add(c.travel(`M${model.l - 10},${SY} Q${(model.l + tx) / 2},${SY - 90} ${tx},${SY}`, { d: 0.45, ease: 'power2.out', appear: true }), EMIT + i * 0.28);
    S.add(c.out({ d: 0.2 }), T('b2~call') + 0.05);
    return c;
  });
  S.add(model.flash({ d: 0.5 }), EMIT);
  S.add(callP.pop({ d: 0.45, from: 0.85 }), T('b2~call') + 0.05);
  // 'the serving system spots it': a bracket round the call, tied to the gear
  const br = ignore(S.rect({ x: callP.l - 8, y: SY - callP.h / 2 - 8, w: callP.w + 16, h: callP.h + 16, r: 14, stroke: 'ink', sw: 2.5, dash: '8 6' }));
  const tie = ignore(S.path({ d: `M${callP.cx + 60},${SY - callP.h / 2 - 8} C${callP.cx + 60},706 ${WX - 120},706 ${WX - 30},672`, stroke: 'ink', sw: 2, strokeOpacity: 0.6, dash: '4 6' }));
  S.set([br, tie], { autoAlpha: 0 }, 0);
  S.add(gsap.set(br, { autoAlpha: 1 }), 'b2~spots-0.1');
  S.add(fx.draw(br, { d: 0.45 }), 'b2~spots-0.1');
  S.add(gsap.set(tie, { autoAlpha: 1 }), 'b2~spots+0.1');
  S.add(fx.draw(tie, { d: 0.5 }), 'b2~spots+0.1');
  S.add(gsap.fromTo(gearIc, { rotation: 0, svgOrigin: `${WX} 640` }, { rotation: 360, svgOrigin: `${WX} 640`, duration: 3.6, ease: 'power1.inOut', immediateRender: false }), 'b2~spots');
  // 'runs the code': a copy of the call crosses the wall to the code, whose lines scroll
  const RUNT = T('b2~runs') - 0.25;
  const callCopy = ignore(libToken(S, { text: 'call', x: callP.cx, y: SY, size: 24, hidden: true }));
  S.add(callCopy.travel(`M${callP.cx},${SY} C${callP.cx},660 ${WX - 120},560 ${WX},600 S${IC.x + 120},${IC.y + IC.h + 60} ${IC.x + IC.w / 2},${IC.y + IC.h - 20}`, { d: 0.9, ease: 'power1.inOut', appear: true }), RUNT);
  S.add(callCopy.out({ d: 0.2 }), RUNT + 0.85);
  const glowImpl = ignore(S.rect({ x: IC.x, y: IC.y, w: IC.w, h: IC.h, r: 24, stroke: 'ink', sw: 3 }));
  S.set(glowImpl, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(glowImpl, { autoAlpha: 0 }, { autoAlpha: 0.8, duration: 0.25, yoyo: true, repeat: 3, immediateRender: false }), RUNT + 0.9);
  const SCROLL = { t0: RUNT + 0.9, d: 1.3 };
  // 'result returns as text': the result comes back over the wall and joins the strip
  const resP = libToken(S, { text: '18°C, clear', x: callP.r + 10, y: SY, size: 24, anchor: 'start', state: 'token', hidden: true });
  ignore(resP);
  const RES = T('b2~result') - 0.1;
  S.add(resP.flyIn([IC.x + IC.w / 2, IC.y + IC.h - 20], { d: 0.9 }), RES);
  S.call(() => resP.setAttribute('data-audit', 'ignore'), RES);
  S.call(() => resP.removeAttribute('data-audit'), RES + 1.0);
  S.add(fx.out([br, tie], { d: 0.35 }), RES + 0.2);
  // the model picks up again
  S.add(model.flash({ d: 0.5 }), RES + 1.0);
  [0, 1, 2].forEach(i => {
    const c = libToken(S, { text: '', x: model.l - 10, y: SY, w: 26, h: 24, r: 7, decorative: true, hidden: true });
    S.add(c.travel(`M${model.l - 10},${SY} Q${model.l - 50},${SY - 70} ${model.l - 70 - i * 22},${SY - 64}`, { d: 0.4, ease: 'power2.out', appear: true }), RES + 1.05 + i * 0.25);
    S.add(c.out({ d: 0.25 }), RES + 1.6 + i * 0.25);
  });

  // ---------------------------------------------------------------- b3: the code can live anywhere, even in a plugin
  const ANY = T('b3~anywhere') - 0.2;
  S.add(gsap.to(impl, { autoAlpha: 0, scale: 0.85, transformOrigin: '50% 50%', duration: 0.4 }), ANY);
  const homes = S.g();
  const srv = libServer(S, { x: 1530, y: 380, w: 160, detail: 'lite', seed: 3 }, homes);
  const lap = libDevice(S, { x: 1730, y: 380, w: 140 }, homes);
  const codeChip = (x, y) => {
    const g = S.g(null, homes);
    S.rect({ x: x - 50, y: y - 24, w: 100, h: 48, r: 12, fill: '#0c1326' }, g);
    S.rect({ x: x - 50, y: y - 24, w: 100, h: 48, r: 12, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.35, sw: 2 }, g);
    S.icon('ph:file-code-duotone', { x: x - 22, y, size: 30, color: 'muted' }, g);
    S.text('code', { x: x + 16, y: y + 1, size: 22, anchor: 'middle', weight: 600, color: 'ink' }, g);
    return g;
  };
  const chipS = codeChip(1530, 290), chipL = codeChip(1730, 290);
  S.set([homes], { autoAlpha: 0 }, 0);
  S.add(gsap.to(homes, { autoAlpha: 1, duration: 0.3 }), ANY + 0.2);
  S.add(gsap.fromTo(chipS, { y: -60 }, { y: 0, duration: 0.5, ease: 'bounce.out', immediateRender: false }), ANY + 0.2);
  S.add(gsap.fromTo(chipL, { y: -60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'bounce.out', immediateRender: false }), ANY + 0.45);
  const plugin = ch03Plugin(S, { x: 1630, y: 760, tools: 3 });
  S.set(plugin, { autoAlpha: 0 }, 0);
  S.add(fx.in(plugin, { from: 'up', d: 0.5, dist: 20 }), 'b3~plugin-0.1');
  plugin.tools.forEach((t, i) => S.add(t.pop({ d: 0.4 }), T('b3~bundle') + i * 0.12));
  // the model never sees a line, only enough description to call it
  const eye = S.g();
  S.circle({ x: WX, y: 400, r: 36, fill: '#0c1326', stroke: 'muted', sw: 2.5 }, eye);
  S.icon('ph:eye-slash-duotone', { x: WX, y: 400, size: 46, color: 'ink' }, eye);
  S.set(eye, { autoAlpha: 0 }, 0);
  S.add(fx.pop(eye, { d: 0.45 }), 'b3~never-0.05');
  const enough = S.text('enough to call it', { x: descP.cx, y: SY - 66, size: 26, anchor: 'middle', weight: 650, color: 'helps' });
  S.set(enough, { autoAlpha: 0 }, 0);
  S.add(descP.glow({ tone: 'helps', hold: 1.6 }), 'b3~enough-0.1');
  S.add(fx.in(enough, { from: 'up', d: 0.4, dist: 10 }), 'b3~enough');

  // ---------------------------------------------------------------- b4: a long description costs tokens every turn; code costs none
  const B4 = T('b4') - 0.2;
  S.add(fx.out(enough, { d: 0.3 }), B4);
  const meter = (x, title) => {
    const g = S.g();
    S.rect({ x, y: 200, w: 480, h: 270, r: 24, fill: '#0c1326' }, g);
    S.rect({ x, y: 200, w: 480, h: 270, r: 24, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.18, sw: 2 }, g);
    S.text(title, { x: x + 240, y: 246, size: 30, anchor: 'middle', weight: 650, color: 'ink' }, g);
    g.num = S.text('', { x: x + 240, y: 330, size: 60, anchor: 'middle', weight: 700, family: 'mono', color: 'struct' }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  };
  const mL = meter(240, 'long description'), mR = meter(800, '1,000 lines of code');
  S.add(fx.in(mL, { from: 'up', d: 0.5 }), 'b4~long-0.1');
  const turns = [1, 2, 3].map(i => {
    const t = S.text(`turn ${i}`, { x: 240 + 100 + (i - 1) * 140, y: 420, size: 26, anchor: 'middle', weight: 600, color: 'muted' }, mL);
    S.set(t, { autoAlpha: 0 }, 0);
    return t;
  });
  const PER = 800;                                        // an illustrative long description, in tokens
  const TURN_T = [T('b4~costs'), T('b4~every'), T('b4~turn')];
  turns.forEach((t, i) => {
    S.add(fx.in(t, { from: 'up', d: 0.3, dist: 10 }), TURN_T[i] - 0.1);
    S.add(gsap.to(t, { attr: { fill: S.tone('ink') }, duration: 0.2 }), TURN_T[i]);
  });
  const illus = S.text('illustrative', { x: 240 + 240, y: 446 - 0, size: 22, anchor: 'middle', weight: 550, color: 'muted' }, mL);
  S.set(illus, { autoAlpha: 0 }, 0);
  S.add(fx.in(illus, { from: 'fade', d: 0.3 }), TURN_T[2] + 0.3);
  S.add(gsap.to(turns, { attr: { y: 400 }, duration: 0.3 }), TURN_T[2] + 0.2);
  S.add(fx.in(mR, { from: 'up', d: 0.5 }), 'b4~thousand-0.2');
  const zeroT = T('b4~none') - 0.2;
  S.add(gsap.to(mR.num, { attr: { fill: S.tone('helps') }, duration: 0.01 }), 0.02);
  const zeroSub = S.text('the model never reads it', { x: 800 + 240, y: 412, size: 24, anchor: 'middle', weight: 550, color: 'muted' }, mR);
  S.set(zeroSub, { autoAlpha: 0 }, 0);
  S.add(fx.in(zeroSub, { from: 'up', d: 0.35, dist: 10 }), zeroT + 0.4);
  S.add(gsap.fromTo(mR.num, { filter: 'none' }, { filter: 'url(#glow-helps)', duration: 0.4, yoyo: true, repeat: 1, immediateRender: false }), zeroT);
  S.add(gsap.to([homes, plugin, eye], { opacity: 0.4, duration: 0.5 }), 'b4~documentation-0.2');
  S.add(descP.glow({ tone: 'struct', hold: 2.0 }), 'b4~documentation');
  const take = S.takeaway('cost: documentation, not behaviour', { tone: 'helps' });
  S.add(fx.in(take, { from: 'up', d: 0.5 }), 'b4~documentation-0.1');

  // ---------------------------------------------------------------- one clock paints the code scroll and the counters
  const fmtN = v => Math.round(v).toLocaleString('en-US');
  const paint = t => {
    const u = Math.min(1, Math.max(0, (t - SCROLL.t0) / SCROLL.d));
    code.setAttribute('transform', `translate(0,${(-u * (CODE_N - 7) * CL).toFixed(2)})`);
    const n = TURN_T.filter(x => t >= x).length;
    mL.num.textContent = `${fmtN(n * PER)} tokens`;
    mR.num.textContent = t >= zeroT ? '0 tokens' : '';
  };
  const clock = { t: 0 };
  S.add(gsap.fromTo(clock, { t: 0 }, { t: S.duration, duration: S.duration, ease: 'none', immediateRender: false, onUpdate: () => paint(clock.t) }), 0);
  paint(0);
});
