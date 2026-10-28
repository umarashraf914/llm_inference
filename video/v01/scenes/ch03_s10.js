/* ch03_s10 · what you pay for before you type (fig 25)
   The preamble, to scale at 2,000 tokens = 500 px: provider's system prompt 2,000, tool definitions 450,
   your custom instructions 300, one loaded skill 2,000; total 4,750 (1,187.5 px), before any catalogue
   (+1,200 for forty skills listed). A 20-token question is 5 px: 4,750 ÷ 20 = 237.5, nearly 240×.
   In a 200,000-token window (1,600 px) the preamble is 38 px: it counts against the window every turn.
   Illustrative figures; the shape is not. */
V.scene('ch03_s10', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const PX = 500 / 2000, BH = 48;
  const ROWS = [
    { label: "provider's system prompt", tok: 2000, badge: 'ph:globe-duotone' },
    { label: 'tool definitions', tok: 450 },
    { label: 'your custom instructions', tok: 300, badge: 'ph:user-duotone' },
    { label: 'one loaded skill', tok: 2000 },
  ];
  // b1's chart (labels to RX - 20, bars from RX, values after them) centred; the stacked bar from SX, with
  // the question and the answer tokens after it, centred too
  const RY = [300, 380, 460, 540], RX = 835, SX = 300, SY = 470;
  let acc = 0;
  ROWS.forEach(r => { r.w = r.tok * PX; r.sx = SX + acc * PX; acc += r.tok; });
  const TOTAL = acc;                                       // 4,750 → 1,187.5 px, ends at x 1,487.5
  const fmtN = v => Math.round(v).toLocaleString('en-US');

  // ---------------------------------------------------------------- b1: the preamble, row by row
  // the camera keeps each stage centred: the rows (y 200-564) 150 px lower in b1, the stacked bar 80 in b2, the
  // full layout with the context window as drawn in b3, the bar and its captions 95 lower in b4
  S.xset(S.camera, { x: 0, y: 150, s: 1 });
  const h1 = S.text('What sits in front of your first word', { x: 960, y: 126, size: 40, anchor: 'middle', weight: 700, family: 'display', color: 'ink' });
  const h2 = S.text('and who put it there', { x: 960, y: 176, size: 32, anchor: 'middle', weight: 600, color: 'muted' });
  S.add(fx.in([h1, h2], { from: 'up', d: 0.5, stagger: 0.12 }), 0.15);
  S.add(fx.out([h1, h2], { d: 0.4 }), 'b1~provider-0.2');
  const tag = S.pill('the preamble', { x: RX, y: 222, h: 44, size: 26, tone: 'struct', style: 'outline', anchor: 'start' });
  S.set(tag, { autoAlpha: 0 }, 0);
  S.add(fx.pop(tag, { d: 0.4 }), 'b1~preamble');
  const CUES = ['b1~provider', 'b1~tool', 'b1~your', 'b1~one'];
  const rows = ROWS.map((r, i) => {
    const g = { };
    g.lbl = S.text(r.label, { x: RX - 20, y: RY[i] + 1, size: 28, anchor: 'end', weight: 600, color: 'ink' });
    g.bar = S.g();
    g.rect = S.rect({ x: RX, y: RY[i] - BH / 2, w: r.w, h: BH, r: 6, fill: i % 2 ? '#5b8def' : '#4a78d8', stroke: '#0c1326', sw: 2 }, g.bar);
    g.val = S.text(fmtN(r.tok), { x: RX + r.w + 16, y: RY[i] + 1, size: 30, weight: 650, family: 'mono', color: 'ink' });
    if (r.badge) {
      g.badge = S.g();
      S.circle({ x: RX + 22, y: RY[i], r: 17, fill: '#0c1326', stroke: 'ink', sw: 1.5 }, g.badge);
      S.icon(r.badge, { x: RX + 22, y: RY[i], size: 24, color: 'ink' }, g.badge);
    }
    const parts = [g.lbl, g.bar, g.val, g.badge].filter(Boolean);
    S.set(parts, { autoAlpha: 0 }, 0);
    const at = T(CUES[i]) - 0.1;
    S.add(fx.in(g.lbl, { from: 'right', d: 0.35, dist: 14 }), at);
    S.add(gsap.set(g.bar, { autoAlpha: 1 }), at);
    S.add(gsap.fromTo(g.rect, { attr: { width: 0 } }, { attr: { width: r.w }, duration: 0.6, ease: 'power3.out', immediateRender: false }), at);
    S.add(fx.in(g.val, { from: 'left', d: 0.3, dist: 12 }), at + 0.45);
    if (g.badge) S.add(fx.pop(g.badge, { d: 0.4 }), at + 0.35);
    return g;
  });

  // ---------------------------------------------------------------- b2: end to end: 4,750 tokens, before any catalogue
  const rule = S.line({ x1: 140, y1: SY - 84, x2: 1780, y2: SY - 84, stroke: '#ffffff', strokeOpacity: 0.16, sw: 2 });
  S.set(rule, { autoAlpha: 0 }, 0);
  S.add(gsap.set(rule, { autoAlpha: 1 }), 'b2-0.2');
  S.add(fx.draw(rule, { d: 0.6 }), 'b2-0.2');
  const SLIDE = T('b2') + 0.2;
  S.add(fx.cam({ x: 960, y: 460, scale: 1, d: 0.8, ease: 'power2.inOut' }), 'b2-0.2');
  rows.forEach((g, i) => {
    const r = ROWS[i];
    S.add(fx.out(g.lbl, { d: 0.3 }), SLIDE - 0.1);
    S.add(gsap.to(g.bar, { x: r.sx - RX, y: SY - RY[i], duration: 0.8, ease: 'power3.inOut' }), SLIDE + i * 0.08);
    S.add(gsap.to(g.val, { x: r.sx + r.w / 2 - (RX + r.w + 16), y: SY - RY[i], autoAlpha: 0, duration: 0.6, ease: 'power3.inOut' }), SLIDE + i * 0.08);
    // the badge lands centred under its own segment, saying whose it is
    if (g.badge) S.add(gsap.to(g.badge, { x: r.sx + r.w / 2 - RX - 22, y: SY + 52 - RY[i], duration: 0.8, ease: 'power3.inOut' }), SLIDE + i * 0.08);
    // the value, inside its segment once the bar lands
    g.inVal = S.text(fmtN(r.tok), { x: r.sx + r.w / 2, y: SY + 1, size: r.w > 100 ? 28 : 24, anchor: 'middle', weight: 700, family: 'mono', color: '#0a0f1e' });
    S.set(g.inVal, { autoAlpha: 0 }, 0);
    S.add(fx.in(g.inVal, { from: 'fade', d: 0.3 }), SLIDE + i * 0.08 + 0.75);
  });
  S.call(() => rows.forEach(g => g.val.setAttribute('data-audit', 'ignore')), SLIDE);
  S.add(fx.out(tag, { d: 0.3 }), SLIDE);
  const total = S.text('', { x: SX, y: SY - 76, size: 30, weight: 650, color: 'ink' });
  const cnt = { v: 0 };
  S.add(gsap.fromTo(cnt, { v: 0 }, { v: TOTAL, duration: 1.4, ease: 'power2.out', immediateRender: false, onUpdate: () => { total.textContent = `total ${fmtN(cnt.v)} tokens`; } }), SLIDE + 1.1);
  // 'before any catalogue': the forty-skill catalogue this setup does not list (1,200 tokens, 300 px)
  const GX0 = SX + TOTAL * PX, GW = 1200 * PX;
  const ghost = S.g();
  ignore(S.rect({ x: GX0, y: SY + 70 - 14, w: GW, h: 28, r: 5, fill: 'struct', fillOpacity: 0.06, stroke: 'struct', sw: 2, dash: '8 6' }, ghost));
  S.text('+1,200 if 40 skills were listed', { x: GX0 + GW / 2, y: SY + 112, size: 26, anchor: 'middle', weight: 600, color: 'muted' }, ghost);
  S.set(ghost, { autoAlpha: 0 }, 0);
  S.add(fx.in(ghost, { from: 'fade', d: 0.25 }), 'b2~before-0.05');
  S.add(fx.out(ghost, { d: 0.25 }), 'b2~nearly-0.25');
  // the question: 20 tokens = 5 px; 4,750 ÷ 20 ≈ 240×
  const QX = GX0 + 8.5;
  const q = S.rect({ x: QX, y: SY - BH / 2, w: 5, h: BH, fill: '#d6e6ff' });
  const qLbl = S.text('your question ≈ 20', { x: QX + 2.5, y: SY + 60, size: 26, anchor: 'middle', weight: 600, color: 'ink' });
  S.set([q, qLbl], { autoAlpha: 0 }, 0);
  S.add(fx.in(q, { from: 'fade', d: 0.2 }), 'b2~two');
  S.add(fx.in(qLbl, { from: 'up', d: 0.35, dist: 10 }), T('b2~two') + 0.1);
  const brk = S.bracket({ x1: SX, x2: QX + 5, y: SY - 32, up: true, label: '≈ 240×', tone: 'ink', size: 30 });
  S.set(brk, { autoAlpha: 0 }, 0);
  S.add(fx.in(brk, { from: 'up', d: 0.4, dist: 10 }), 'b2~forty');

  // ---------------------------------------------------------------- b3: every turn it counts against your window, and you pay
  S.add(fx.out(brk, { d: 0.3 }), 'b3-0.1');
  S.add(fx.cam({ d: 0.8, ease: 'power2.inOut' }), 'b3-0.4');
  const turnT = S.text('', { x: 1650, y: 150, size: 34, anchor: 'end', weight: 700, family: 'mono', color: 'ink' });
  const TICKS = [T('b3~turn'), T('b3~turn') + 1.55, T('b3~turn') + 3.1, T('b3~turn') + 4.65];
  const coins = TICKS.map((t, k) => {
    const c = S.g();
    S.path({ d: `M1714,${172 - k * 12} a26,9 0 1,0 52,0 a26,9 0 1,0 -52,0 Z`, fill: 'helps', fillOpacity: 0.85, stroke: '#0c1326', sw: 2 }, c);
    ignore(c);
    S.set(c, { autoAlpha: 0 }, 0);
    S.add(gsap.fromTo(c, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'bounce.out', immediateRender: false }), t + 0.1);
    return c;
  });
  const coinLbl = S.text('paid', { x: 1740, y: 210, size: 22, anchor: 'middle', weight: 600, color: 'muted' });
  S.set(coinLbl, { autoAlpha: 0 }, 0);
  S.add(fx.in(coinLbl, { from: 'fade', d: 0.3 }), TICKS[0] + 0.3);
  // the context window, the same scale as the skills scene: 200,000 tokens = 1,600 px, the preamble 38 px
  const WY = 860, WX = 160, WW = 1600, PRE = TOTAL * WW / 200000;
  const win = S.g();
  S.rect({ x: WX, y: WY - 18, w: WW, h: 36, r: 6, fill: '#0c1326', stroke: 'ink', strokeOpacity: 0.8, sw: 2 }, win);
  const winLbl = S.text('context window: 200,000 tokens', { x: WX, y: WY - 40, size: 26, weight: 650, color: 'ink' }, win);
  const pre = S.rect({ x: WX, y: WY - 18, w: 0, h: 36, fill: 'struct' }, win);
  S.set(win, { autoAlpha: 0 }, 0);
  S.add(fx.in(win, { from: 'up', d: 0.45, dist: 14 }), 'b3~counts-0.1');
  TICKS.forEach(t => S.add(gsap.fromTo(pre, { attr: { width: 0, fill: '#d6e6ff' } }, { attr: { width: PRE, fill: S.tone('struct') }, duration: 0.45, ease: 'power2.out', immediateRender: false }), Math.max(t, T('b3~counts'))));
  // 'reading it in': a sweep across the stacked bar
  const sweep = ignore(S.rect({ x: SX, y: SY - BH / 2 - 4, w: 60, h: BH + 8, r: 8, fill: '#ffffff', fillOpacity: 0.22 }));
  S.set(sweep, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(sweep, { autoAlpha: 1, attr: { x: SX - 60 } }, { attr: { x: GX0 }, duration: 0.9, ease: 'power1.inOut', immediateRender: false }), 'b3~reading-0.1');
  S.add(gsap.to(sweep, { autoAlpha: 0, duration: 0.15 }), T('b3~reading') + 0.8);
  // 'looking back over it for each answer token': each new token reaches back over the whole preamble
  const LOOK = T('b3~looking') - 0.1;
  const ans = [0, 1, 2, 3].map(k => {
    const x = QX + 22 + k * 26;
    const tk = ignore(S.rect({ x: x - 9, y: SY - 14, w: 18, h: 28, r: 6, fill: 'struct', stroke: '#d6e6ff', sw: 1.5 }));
    const arc = ignore(S.path({ d: `M${x},${SY - 18} C${x},${SY - 210 - k * 10} ${SX + 40},${SY - 210 - k * 10} ${SX + 20},${SY - BH / 2 - 4}`, stroke: 'struct', sw: 2, strokeOpacity: 0.45 }));
    S.set([tk, arc], { autoAlpha: 0 }, 0);
    const at = LOOK + k * 0.5;
    S.add(fx.pop(tk, { d: 0.3 }), at);
    S.add(gsap.set(arc, { autoAlpha: 1 }), at + 0.1);
    S.add(fx.draw(arc, { d: 0.45 }), at + 0.1);
    return [tk, arc];
  });
  const attn = S.text('attention, later', { x: 1500, y: SY - 160, size: 26, weight: 600, color: 'muted' });
  S.set(attn, { autoAlpha: 0 }, 0);
  S.add(fx.in(attn, { from: 'fade', d: 0.35 }), LOOK + 0.6);

  // ---------------------------------------------------------------- b4: illustrative; storage invisible, token count not
  const B4 = T('b4') - 0.1;
  S.add(fx.out([turnT, coinLbl, ...coins, win, attn, ...ans.map(a => a[1])], { d: 0.4, stagger: 0 }), B4);
  S.add(fx.cam({ x: 960, y: 445, scale: 1, d: 0.8, ease: 'power2.inOut' }), B4 + 0.1);
  const stamp = ch03Stamp(S, 'illustrative', { x: 1000, y: SY - 190, size: 34, rotate: -5 });
  S.add(stamp.stamp(), 'b4~illustrative-0.1');
  const badges = rows.filter(g => g.badge).map(g => g.badge);
  badges.forEach((b, i) => S.add(fx.pulse(b, { scale: 1.3, d: 0.5 }), T('b4~Storage') + i * 0.15));
  const cap1 = S.text('storage: invisible to you', { x: SX, y: SY + 130, size: 30, weight: 650, color: 'muted' });
  const cap2 = S.text('token count: not', { x: SX, y: SY + 176, size: 30, weight: 650, color: 'ink' });
  S.set([cap1, cap2], { autoAlpha: 0 }, 0);
  S.add(fx.in(cap1, { from: 'up', d: 0.4, dist: 12 }), 'b4~Storage');
  S.add(fx.in(cap2, { from: 'up', d: 0.4, dist: 12 }), 'b4~Token');
  S.add(gsap.fromTo(rows.map(g => g.rect), { filter: 'none' }, { filter: 'url(#glow-struct)', duration: 0.5, yoyo: true, repeat: 1, immediateRender: false }), 'b4~largest-0.1');

  // ---------------------------------------------------------------- one clock paints the turn counter
  const paint = t => {
    const n = TICKS.filter(x => t >= x).length;
    turnT.textContent = n ? `turn ${n}${n === TICKS.length ? '…' : ''}` : '';
  };
  const clock = { t: 0 };
  S.add(gsap.fromTo(clock, { t: 0 }, { t: S.duration, duration: S.duration, ease: 'none', immediateRender: false, onUpdate: () => paint(clock.t) }), 0);
  paint(0);
});
