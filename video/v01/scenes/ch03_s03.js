/* ch03_s03 · where the money goes (fig 18)
   Three enormous numbers, each in its own idiom: ≈ ⅔ of AI compute goes to inference (a donut),
   ≈ $700 billion of AI spending by big cloud firms this year (a money counter, buildings stacking),
   20 trillion+ tokens a day from one provider (= 231 million a second). Every engineering decision
   collapses into one number: cost per token. Estimates and projections; the direction is not in doubt. */
V.scene('ch03_s03', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const TX = [400, 960, 1520], TW = 500, TY = 190, TH = 510, TCY = TY + TH / 2;

  const tile = (i, title, sub) => {
    const g = S.g();
    S.rect({ x: TX[i] - TW / 2, y: TY, w: TW, h: TH, r: 26, fill: '#0c1326' }, g);
    g.bg = S.rect({ x: TX[i] - TW / 2, y: TY, w: TW, h: TH, r: 26, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.14, sw: 2 }, g);
    g.titleEl = S.text(title, { x: TX[i], y: TY + 48, size: 30, anchor: 'middle', weight: 650, color: 'ink' }, g);
    if (sub) g.subEl = S.text(sub, { x: TX[i], y: TY + 88, size: 24, anchor: 'middle', weight: 550, color: 'muted' }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  };

  // ---------------------------------------------------------------- b1: follow the money; two thirds of AI compute is inference
  const kicker = S.g();
  S.icon('ph:coin-duotone', { x: 836, y: 128, size: 44, color: 'helps' }, kicker);
  S.text('follow the money', { x: 868, y: 129, size: 32, weight: 650, color: 'helps' }, kicker);
  S.set(kicker, { autoAlpha: 0 }, 0);
  S.add(fx.in(kicker, { from: 'down', d: 0.5, dist: 14 }), 'b1~Follow-0.1');
  S.add(fx.out(kicker, { d: 0.4 }), 'b2-0.2');

  const t1 = tile(0, 'Share of AI compute');
  S.add(fx.in(t1, { from: 'up', d: 0.6 }), 0.15);
  const DC = { x: TX[0], y: TY + 230, r: 100, sw: 40 };
  const pt = deg => [DC.x + DC.r * Math.sin(deg * Math.PI / 180), DC.y - DC.r * Math.cos(deg * Math.PI / 180)];
  const arc = (a0, a1) => { const [x0, y0] = pt(a0), [x1, y1] = pt(a1); return `M${x0.toFixed(2)},${y0.toFixed(2)} A${DC.r},${DC.r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`; };
  const donut = S.g(null, t1);
  S.circle({ x: DC.x, y: DC.y, r: DC.r, stroke: '#ffffff', strokeOpacity: 0.06, sw: DC.sw }, donut);
  const amber = S.path({ d: arc(1.5, 238.5), stroke: 'compute', sw: DC.sw, cap: 'butt' }, donut);
  const grey = S.path({ d: arc(241.5, 358.5), stroke: 'faint', sw: DC.sw, cap: 'butt' }, donut);
  S.set([amber, grey], { autoAlpha: 0 }, 0);
  const TWO = T('b1~two thirds');
  S.add(gsap.set(amber, { autoAlpha: 1 }), TWO - 0.1);
  S.add(fx.draw(amber, { d: 1.2, ease: 'power2.inOut' }), TWO - 0.1);
  S.add(gsap.set(grey, { autoAlpha: 1 }), TWO + 1.1);
  S.add(fx.draw(grey, { d: 0.45, ease: 'power2.out' }), TWO + 1.1);
  const head1 = S.text('≈ ⅔', { x: DC.x, y: DC.y + 4, size: 56, anchor: 'middle', weight: 700, color: 'compute' }, t1);
  S.set(head1, { autoAlpha: 0 }, 0);
  S.add(fx.pop(head1, { from: 0.7, d: 0.45 }), TWO + 0.9);
  const legend = S.g(null, t1);
  const LY = DC.y + DC.r + DC.sw / 2 + 44;
  const leg = (y, tone, text, color) => {
    const g = S.g(null, legend);
    S.rect({ x: TX[0] - 150, y: y - 9, w: 18, h: 18, r: 4, fill: tone }, g);
    S.text(text, { x: TX[0] - 120, y: y + 1, size: 26, weight: 600, color }, g);
    return g;
  };
  const legA = leg(LY, 'compute', 'inference', 'compute'), legB = leg(LY + 38, S.tone('faint'), 'the rest, mostly training', 'muted');
  S.set([legA, legB], { autoAlpha: 0 }, 0);
  S.add(fx.in(legA, { from: 'left', d: 0.4, dist: 14 }), TWO + 0.7);
  S.add(fx.in(legB, { from: 'left', d: 0.4, dist: 14 }), TWO + 1.35);
  const cap1 = S.text('about two thirds, 2026', { x: TX[0], y: TY + TH - 34, size: 24, anchor: 'middle', weight: 550, color: 'muted' }, t1);
  S.set(cap1, { autoAlpha: 0 }, 0);
  S.add(fx.in(cap1, { from: 'up', d: 0.4, dist: 12 }), 'b1~now');
  // b2: tile 1 keeps its title and ≈ ⅔
  S.add(fx.out([donut, legend, cap1], { d: 0.45 }), 'b2-0.1');

  // ---------------------------------------------------------------- b2: big cloud firms' AI spending, ≈ $700 billion
  const t2 = tile(1, "Big cloud firms' AI spending", 'buildings, power, machines');
  S.add(fx.in(t2, { from: 'up', d: 0.6 }), 'b2~Big-0.1');
  const money = S.counter({ x: TX[1], y: TY + 160, size: 56, value: 0, anchor: 'middle', color: 'ink', weight: 700 }, t2);
  money.textContent = '$0';
  const SEVEN = T('b2~seven');
  S.add(fx.count(money, 0, 700, { d: 1.6, ease: 'power2.inOut', fmt: v => (v < 0.5 ? '$0' : `$${Math.round(v)} billion`) }), SEVEN - 0.1);
  // data-centre buildings stack row by row as the money runs
  const BR = 4, BC = 6, BS = 54, bldg = S.g(null, t2);
  const bIcons = [];
  for (let r = 0; r < BR; r++) for (let c = 0; c < BC; c++)
    bIcons.push(S.icon('ph:buildings-duotone', { x: TX[1] + (c - (BC - 1) / 2) * 68, y: TY + TH - 50 - r * 62, size: BS, color: r % 2 ? 'muted' : 'ink' }, bldg));
  S.set(bIcons, { autoAlpha: 0 }, 0);
  bIcons.forEach((ic, k) => S.add(gsap.fromTo(ic, { autoAlpha: 0, y: -18 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }),
    T('b2~spending') + 0.1 + k * (T('b2~dollars') + 0.3 - T('b2~spending')) / bIcons.length));
  // the centre keeps its title and $700 billion; tile 3 builds
  S.add(fx.out([t2.subEl, bldg], { d: 0.4 }), 'b2~One-0.2');

  // ---------------------------------------------------------------- b2: one provider's daily volume, 20 trillion+ tokens
  const t3 = tile(2, "One provider's daily volume");
  S.add(fx.in(t3, { from: 'up', d: 0.6 }), 'b2~One-0.1');
  const toks = S.counter({ x: TX[2], y: TY + 160, size: 56, value: 0, anchor: 'middle', color: 'struct', weight: 700 }, t3);
  toks.textContent = '';
  S.add(fx.count(toks, 0, 20, { d: 1.0, ease: 'power2.out', fmt: v => (v >= 19.999 ? '20 trillion+' : `${Math.round(v)} trillion`) }), T('b2~twenty') - 0.1);
  const perDay = S.text('tokens per day', { x: TX[2], y: TY + 212, size: 28, anchor: 'middle', weight: 600, color: 'muted' }, t3);
  S.set(perDay, { autoAlpha: 0 }, 0);
  S.add(fx.in(perDay, { from: 'up', d: 0.4, dist: 12 }), 'b2~tokens');
  // a per-second ticker: 20 trillion ÷ 86,400 s ≈ 231 million a second, said as 'over 230 million'
  const tick = S.g(null, t3);
  S.line({ x1: TX[2] - 170, y1: TY + 268, x2: TX[2] + 170, y2: TY + 268, stroke: '#ffffff', strokeOpacity: 0.12, sw: 2 }, tick);
  S.icon('ph:clock-duotone', { x: TX[2], y: TY + 322, size: 52, color: 'struct' }, tick);
  const rate = S.text('', { x: TX[2], y: TY + 394, size: 38, anchor: 'middle', weight: 700, color: 'ink', family: 'mono' }, tick);
  const rateL = S.text('per second', { x: TX[2], y: TY + 440, size: 28, anchor: 'middle', weight: 600, color: 'muted' }, tick);
  S.set(tick, { autoAlpha: 0 }, 0);
  const SPIN = T('b2~a day') - 0.2, SETTLE = SPIN + 0.75;
  S.add(fx.in(tick, { from: 'up', d: 0.35, dist: 12 }), SPIN - 0.1);
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h ^ (h >>> 16)) / 4294967296; };
  const paintRate = t => {
    if (t < SPIN) { rate.textContent = ''; return; }
    if (t >= SETTLE) { rate.textContent = 'over 230 million'; return; }
    const f = Math.floor((t - SPIN) * 30);
    rate.textContent = `over ${100 + Math.floor(hash(f, 7) * 900)} million`;
  };

  // ---------------------------------------------------------------- b3: the tiles shrink into the top band
  const BAND = { y: 176, w: 440, h: 112 };
  const compact = [
    ['Share of AI compute', '≈ ⅔ inference', 'compute'],
    ["Big cloud firms' AI spending", '$700 billion', 'ink'],
    ["One provider's daily volume", '20 trillion+ tokens', 'struct'],
  ].map(([title, num, tone], i) => {
    const g = S.g();
    S.rect({ x: TX[i] - BAND.w / 2, y: BAND.y - BAND.h / 2, w: BAND.w, h: BAND.h, r: 20, fill: '#0c1326' }, g);
    S.rect({ x: TX[i] - BAND.w / 2, y: BAND.y - BAND.h / 2, w: BAND.w, h: BAND.h, r: 20, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.14, sw: 2 }, g);
    S.text(title, { x: TX[i], y: BAND.y - 26, size: 24, anchor: 'middle', weight: 600, color: 'muted' }, g);
    S.text(num, { x: TX[i], y: BAND.y + 20, size: 40, anchor: 'middle', weight: 700, color: tone }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  });
  const SHRINK = T('b3~scale') - 0.2;
  [t1, t2, t3].forEach((t, i) => {
    S.xset(t, { x: 0, y: 0, s: 1, ox: TX[i], oy: TCY });
    S.add(fx.xform(t, { x: 0, y: BAND.y - TCY, s: 0.3 }, { d: 0.7, ease: 'power3.inOut' }), SHRINK + i * 0.08);
    S.add(gsap.to(t, { autoAlpha: 0, duration: 0.3 }), SHRINK + 0.4 + i * 0.08);
    S.add(gsap.to(compact[i], { autoAlpha: 1, duration: 0.35 }), SHRINK + 0.45 + i * 0.08);
    // mid-shrink, the tile's text is small on purpose
    S.call(() => t.setAttribute('data-audit', 'ignore'), SHRINK);
  });

  // ---------------------------------------------------------------- b3: three decisions converge on one number
  const CARD = { x: 960, y: 560, w: 520, h: 140 };
  const cTop = CARD.y - CARD.h / 2;
  const LINES = [
    { d: `M${TX[0]},${BAND.y + 62} C${TX[0]},360 ${CARD.x - 90},350 ${CARD.x - 90},${cTop - 6}`, label: 'chip layout', lx: 640, ly: 362, anchor: 'end', at: 'b3~chip' },
    { d: `M${TX[1]},${BAND.y + 62} L${TX[1]},${cTop - 6}`, label: 'memory tiers', lx: 984, ly: 362, anchor: 'start', at: 'b3~memory' },
    { d: `M${TX[2]},${BAND.y + 62} C${TX[2]},360 ${CARD.x + 90},350 ${CARD.x + 90},${cTop - 6}`, label: 'scheduling', lx: 1280, ly: 362, anchor: 'start', at: 'b3~scheduling' },
  ];
  const lines = LINES.map(L => {
    const p = ignore(S.path({ d: L.d, stroke: 'muted', sw: 2.5, strokeOpacity: 0.8 }));
    const lbl = S.text(L.label, { x: L.lx, y: L.ly, size: 28, anchor: L.anchor, weight: 600, color: 'ink' });
    S.set([p, lbl], { autoAlpha: 0 }, 0);
    S.add(gsap.set(p, { autoAlpha: 1 }), S.t(L.at) - 0.1);
    S.add(fx.draw(p, { d: 0.8, ease: 'power2.inOut' }), S.t(L.at) - 0.1);
    S.add(fx.in(lbl, { from: 'fade', d: 0.35 }), S.t(L.at));
    return { p, lbl };
  });
  // the destinations glow as each line arrives; the card lands on 'one number'
  const card = S.g();
  S.rect({ x: CARD.x - CARD.w / 2, y: cTop, w: CARD.w, h: CARD.h, r: 28, fill: '#0c1326', filter: 'url(#shadow)' }, card);
  const cardBg = S.rect({ x: CARD.x - CARD.w / 2, y: cTop, w: CARD.w, h: CARD.h, r: 28, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.9, sw: 3 }, card);
  const cardQ = S.text('one number', { x: CARD.x, y: CARD.y + 2, size: 40, anchor: 'middle', weight: 600, color: 'muted' }, card);
  const cardT = S.text('cost per token', { x: CARD.x, y: CARD.y + 2, size: 56, anchor: 'middle', weight: 700, color: 'ink', family: 'display' }, card);
  S.set(card, { autoAlpha: 0 }, 0);
  S.set(cardT, { autoAlpha: 0 }, 0);
  S.add(fx.in(card, { from: 'scale', scale: 0.85, d: 0.5 }), 'b3~one-0.1');
  S.add(gsap.to(cardQ, { autoAlpha: 0, duration: 0.25 }), 'b3~Cost-0.15');
  S.add(fx.in(cardT, { from: 'scale', scale: 1.15, d: 0.45 }), 'b3~Cost-0.05');
  S.add(fx.out(lines.map(l => l.lbl), { d: 0.4, stagger: 0.05 }), 'b3~token');
  S.add(gsap.to(lines.map(l => l.p), { attr: { 'stroke-opacity': 0.35 }, duration: 0.5 }), 'b3~token');
  S.add(gsap.fromTo(cardBg, { filter: 'none' }, { filter: 'url(#glow-struct)', duration: 0.4, yoyo: true, repeat: 1 }), 'b3~token');

  // ---------------------------------------------------------------- b4: a recent inversion: the balance tips from training to inference
  const BP = { x: TX[0], y: 520, L: 160, hang: 60 };          // centred under the share-of-compute card it pictures
  const bal = S.g();
  S.path({ d: `M${BP.x},${BP.y} L${BP.x},${BP.y + 210} M${BP.x - 44},${BP.y + 210} L${BP.x + 44},${BP.y + 210}`, stroke: 'muted', sw: 5, cap: 'round' }, bal);
  S.path({ d: `M${BP.x - 16},${BP.y + 14} L${BP.x},${BP.y - 6} L${BP.x + 16},${BP.y + 14} Z`, fill: 'muted' }, bal);
  const beam = S.line({ x1: 0, y1: 0, x2: 0, y2: 0, stroke: 'ink', sw: 5, cap: 'round' }, bal);
  const pan = (tone, label) => {
    const g = S.g(null, bal);
    g.str = S.path({ d: '', stroke: 'muted', sw: 2 }, g);
    g.dish = S.path({ d: '', fill: tone, fillOpacity: 0.25, stroke: tone, sw: 3 }, g);
    g.lbl = S.text(label, { x: 0, y: 0, size: 28, anchor: 'middle', weight: 650, color: tone }, g);
    return g;
  };
  const panL = pan('muted', 'training'), panR = pan('compute', 'inference');
  ignore(bal);
  const placePan = (p, x, y) => {
    const dy = y + BP.hang;
    p.str.setAttribute('d', `M${x},${y} L${x - 40},${dy} M${x},${y} L${x + 40},${dy}`);
    p.dish.setAttribute('d', `M${x - 50},${dy} L${x + 50},${dy} Q${x},${dy + 34} ${x - 50},${dy} Z`);
    p.lbl.setAttribute('x', x); p.lbl.setAttribute('y', dy + 50);
  };
  const TIP = T('b4~recent');
  const angleAt = t => { const u = Math.min(1, Math.max(0, (t - TIP) / 1.1)); const e = u < 1 ? 1 - Math.pow(1 - u, 3) * Math.cos(u * 6) : 1; return -12 + 24 * e; };
  const paintBal = t => {
    const a = angleAt(t) * Math.PI / 180, cx = Math.cos(a) * BP.L, sy = Math.sin(a) * BP.L;
    beam.setAttribute('x1', (BP.x - cx).toFixed(2)); beam.setAttribute('y1', (BP.y - sy).toFixed(2));
    beam.setAttribute('x2', (BP.x + cx).toFixed(2)); beam.setAttribute('y2', (BP.y + sy).toFixed(2));
    placePan(panL, BP.x - cx, BP.y - sy);
    placePan(panR, BP.x + cx, BP.y + sy);
  };
  S.set(bal, { autoAlpha: 0 }, 0);
  S.add(fx.in(bal, { from: 'fade', d: 0.5 }), 'b4-0.1');
  S.add(gsap.to(panR.lbl, { attr: { 'font-size': 30 }, duration: 0.3 }), TIP + 0.6);

  // ---------------------------------------------------------------- b4: estimates and projections; serving is where the money goes
  const stamp = ch03Stamp(S, 'estimates and projections', { x: 960, y: 268, size: 28, rotate: -4 });
  S.add(stamp.stamp(), 'b4~uncertain-0.1');
  const take = S.takeaway('serving is where the money goes', { tone: 'helps' });
  S.add(fx.in(take, { from: 'up', d: 0.5 }), 'b4~Serving-0.1');

  // ---------------------------------------------------------------- one clock paints every discrete state
  const clock = { t: 0 };
  const paint = t => { paintRate(t); paintBal(t); };
  S.add(gsap.fromTo(clock, { t: 0 }, { t: S.duration, duration: S.duration, ease: 'none', immediateRender: false, onUpdate: () => paint(clock.t) }), 0);
  paint(0);
});
