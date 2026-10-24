/* ch05_s02 · reading the big numbers (fig 34)
   Powers of ten: 10³ thousand, 10⁶ million, 10⁹ billion, 10¹² trillion, 10¹⁵ quadrillion (a thousand
   million million); each step × 1,000. On an ordinary scale the quadrillion fills the width (1,500 px)
   and the trillion is 1.5 px; on a log scale (100 px per power of ten) all five fit: 300 … 1,500 px.
   A chip ≈ 10¹⁵ operations a second; a token ≈ 10¹¹: four powers of ten apart, × 10,000. */
V.scene('ch05_s02', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const PITCH = 130, Y0 = 250, LX = 300, DX = 320, BH = 44;
  const ROWS = [
    { e: 3, name: 'thousand', cue: 'b1~three' },
    { e: 6, name: 'million', cue: 'b2~million' },
    { e: 9, name: 'billion', cue: 'b2~billion' },
    { e: 12, name: 'trillion', cue: 'b2~trillion' },
    { e: 15, name: 'quadrillion', cue: 'b2~fifteen' },
  ];
  const DS = 40, cw = S.measure('0', { size: DS, weight: 600, family: 'mono' }), GAPW = cw * 0.45;
  const zx = j => DX + cw + GAPW + j * cw + Math.floor(j / 3) * GAPW;   // the x of zero j

  // ---------------------------------------------------------------- a row: the pill (10 with its exponent), its name, its digits, its bar
  const mkRow = (r, i, tone = 'struct') => {
    const y = Y0 + i * PITCH, g = S.g();
    g.pill = S.g(null, g);
    S.rect({ x: 100, y: y - 32, w: 160, h: 64, r: 18, fill: '#0c1326' }, g.pill);
    g.pillBg = S.rect({ x: 100, y: y - 32, w: 160, h: 64, r: 18, fill: `url(#card-${tone})`, stroke: tone, sw: 2 }, g.pill);
    g.pow = ch05Pow(S, r.e, { x: 180, y: y + 2, size: 40, tone: 'ink', family: 'mono' }, g.pill);
    g.name = S.text(r.name, { x: 180, y: y + 56, size: 22, anchor: 'middle', weight: 550, color: 'muted' }, g);
    g.digits = S.g(null, g);
    g.one = S.text('1', { x: DX, y: y + 2, size: DS, weight: 600, family: 'mono', color: 'ink' }, g.digits);
    g.zeros = Array.from({ length: r.e }, (_, j) => S.text('0', { x: zx(j), y: y + 2, size: DS, weight: 600, family: 'mono', color: 'ink' }, g.digits));
    g.bar = S.rect({ x: LX, y: y - BH / 2, w: 0, h: BH, r: 4, fill: tone, fillOpacity: 0.85 });
    g.cnt = S.text(String(r.e), { x: LX + 14, y: y + 2, size: 26, weight: 700, family: 'mono', color: '#0a0f1e' });
    S.set([g, g.bar, g.cnt], { autoAlpha: 0 }, 0);
    Object.assign(g, { y, e: r.e });
    return g;
  };
  const rows = ROWS.map((r, i) => mkRow(r, i));

  // ---------------------------------------------------------------- b1: ten to the three; the exponent counts the zeros
  const r1 = rows[0];
  S.set(r1.zeros, { autoAlpha: 0 }, 0);
  S.add(gsap.set(r1, { autoAlpha: 1 }), T(ROWS[0].cue) - 0.4);
  S.set([r1.pill, r1.name, r1.one], { autoAlpha: 0 }, 0);
  S.add(fx.in([r1.pill, r1.name], { from: 'left', d: 0.4, dist: 14 }), T(ROWS[0].cue) - 0.4);
  S.add(fx.in(r1.one, { from: 'fade', d: 0.25 }), 'b1~one');
  r1.zeros.forEach((z, j) => {
    const at = T('b1~followed') + 0.1 + j * 0.4;
    S.add(gsap.fromTo(z, { autoAlpha: 0, y: -30 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }), at);
    S.add(gsap.fromTo(r1.pow.expEl, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.5, duration: 0.15, yoyo: true, repeat: 1, transformOrigin: '50% 50%', immediateRender: false }), at);
  });
  const callG = S.g();
  S.path({ d: `M${r1.pow.expCx + 4},${r1.pow.expCy - 14} L${r1.pow.expCx + 40},${Y0 - 92} L${r1.pow.expCx + 70},${Y0 - 92}`, stroke: 'ink', sw: 2 }, callG);
  S.text('exponent = number of zeros', { x: r1.pow.expCx + 80, y: Y0 - 91, size: 28, weight: 650, color: 'ink' }, callG);
  ignore(callG.firstChild);
  S.set(callG, { autoAlpha: 0 }, 0);
  S.add(fx.in(callG, { from: 'fade', d: 0.4 }), 'b1~exponent');
  S.add(fx.out(callG, { d: 0.3 }), 'b2-0.1');

  // ---------------------------------------------------------------- b2: a million, a billion, a trillion, a quadrillion; each step × 1,000
  rows.slice(1).forEach((g, i) => {
    const at = T(ROWS[i + 1].cue) - 0.15;
    S.add(gsap.set(g, { autoAlpha: 1 }), at);
    S.set([g.pill, g.name, g.one, ...g.zeros], { autoAlpha: 0 }, 0);
    S.add(fx.in([g.pill, g.name], { from: 'left', d: 0.35, dist: 14 }), at);
    S.add(gsap.to([g.one, ...g.zeros.slice(0, -3)], { autoAlpha: 1, duration: 0.25 }), at + 0.05);
    g.zeros.slice(-3).forEach((z, j) => {
      S.add(gsap.fromTo(z, { autoAlpha: 0, y: -24, attr: { fill: S.tone('compute') } }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'back.out(2)', immediateRender: false }), at + 0.2 + j * 0.1);
      S.add(gsap.to(z, { attr: { fill: S.tone('ink') }, duration: 0.5 }), at + 1.0);
    });
  });
  // a thousand million million: the 10¹⁵ string in three groups
  const r5 = rows[4], TMM = T('b2~a thousand') - 0.05;
  S.add(gsap.to(rows.slice(0, 4), { opacity: 0.4, duration: 0.4 }), TMM);
  const grp = [[DX, zx(2) + cw, 'thousand'], [zx(3), zx(8) + cw, 'million'], [zx(9), zx(14) + cw, 'million']].map(([x1, x2, l]) => {
    const b = S.bracket({ x1, x2, y: r5.y + 28, label: l, tone: 'ink', size: 24 });
    S.set(b, { autoAlpha: 0 }, 0);
    return b;
  });
  grp.forEach((b, i) => S.add(fx.in(b, { from: 'fade', d: 0.3 }), [TMM, T('b2~million#2') - 0.1, T('b2~million#3') - 0.1][i]));
  const STEP = T('b2~Each') - 0.1;
  S.add(fx.out(grp, { d: 0.3, stagger: 0 }), STEP);
  S.add(gsap.to(rows.slice(0, 4), { opacity: 1, duration: 0.4 }), STEP);
  const tags = [0, 1, 2, 3].map(i => {
    const t = S.text('× 1,000', { x: 180, y: Y0 + i * PITCH + 84, size: 20, anchor: 'middle', weight: 700, color: 'compute' });
    S.set(t, { autoAlpha: 0 }, 0);
    S.add(fx.in(t, { from: 'fade', d: 0.3 }), STEP + 0.2 + i * 0.15);
    return t;
  });
  S.add(fx.out(tags, { d: 0.3, stagger: 0 }), T('b2~last') + 0.3);

  // ---------------------------------------------------------------- b3: ordinary scale, then the log scale
  const B3 = T('b3') - 0.1;
  S.add(gsap.to(rows.map(g => g.digits), { autoAlpha: 0, duration: 0.35 }), B3);
  const axis = S.text('ordinary scale', { x: 1050, y: 860, size: 28, anchor: 'middle', weight: 600, color: 'muted' });
  S.set(axis, { autoAlpha: 0 }, 0);
  S.add(fx.in(axis, { from: 'fade', d: 0.35 }), B3 + 0.3);
  const ORD = [0, 0, 0, 1.5, 1500];
  const GROW = T('b3~quadrillion') - 0.2;
  rows.forEach((g, i) => {
    S.add(gsap.set(g.bar, { autoAlpha: 1 }), GROW);
    S.add(gsap.to(g.bar, { attr: { width: ORD[i] }, duration: i === 4 ? 1.0 : 0.3, ease: 'power2.out' }), GROW);
  });
  const small = S.g();
  S.path({ d: `M${LX + 30},${Y0 - 26} l14,0 L${LX + 44},${Y0 + 2 * PITCH + 26} l-14,0`, stroke: 'muted', sw: 2.5 }, small);
  S.text('too small to draw', { x: LX + 62, y: Y0 + PITCH + 1, size: 28, weight: 600, color: 'muted' }, small);
  S.set(small, { autoAlpha: 0 }, 0);
  S.add(fx.in(small, { from: 'fade', d: 0.35 }), 'b3~vanish-0.2');
  const LOG = T('b3~count') - 0.1;
  S.add(fx.out(small, { d: 0.3 }), LOG);
  S.add(fx.swap(axis, 'log scale: length = zeros'), LOG);
  rows.forEach((g, i) => S.add(gsap.to(g.bar, { attr: { width: g.e * 100 }, duration: 1.0, ease: 'power3.inOut' }), LOG + 0.1));
  S.add(fx.in(rows.map(g => g.cnt), { from: 'fade', d: 0.3, stagger: 0.08 }), LOG + 0.9);
  const ticks = ignore(S.g());
  for (let k = 1; k <= 5; k++) S.line({ x1: LX + k * 300, y1: Y0 - 40, x2: LX + k * 300, y2: Y0 + 4 * PITCH + 40, stroke: '#ffffff', strokeOpacity: 0.12, sw: 1.5, dash: '4 6' }, ticks);
  const gapL = S.text('× 1,000', { x: LX + 450, y: Y0 + 4 * PITCH + 66, size: 24, anchor: 'middle', weight: 700, color: 'compute' });
  S.set([ticks, gapL], { autoAlpha: 0 }, 0);
  S.add(fx.in(ticks, { from: 'fade', d: 0.4 }), LOG + 0.6);
  S.add(fx.in(gapL, { from: 'fade', d: 0.35 }), LOG + 1.0);

  // ---------------------------------------------------------------- b4: a chip, 10¹⁵ a second; a token, 10¹¹: × 10,000
  const B4 = T('b4') - 0.1;
  S.add(fx.out([axis, gapL], { d: 0.3, stagger: 0 }), B4);
  S.add(gsap.to(rows.slice(0, 4), { opacity: 0.3, duration: 0.4 }), B4);
  S.add(gsap.to([rows[0].bar, rows[1].bar, rows[2].bar, rows[3].bar, rows[0].cnt, rows[1].cnt, rows[2].cnt, rows[3].cnt], { opacity: 0.3, duration: 0.4 }), B4);
  const CHIP = T('b4~fifteen') - 0.1;
  S.add(gsap.to(r5.bar, { attr: { fill: S.tone('compute') }, duration: 0.4 }), CHIP);
  S.add(gsap.to(r5.pillBg, { attr: { fill: 'url(#card-compute)', stroke: S.tone('compute') }, duration: 0.4 }), CHIP);
  const chipT = S.text('a chip, per second', { x: LX + 1500 - 16, y: r5.y + 2, size: 26, anchor: 'end', weight: 700, color: '#0a0f1e' });
  S.set(chipT, { autoAlpha: 0 }, 0);
  S.add(fx.in(chipT, { from: 'fade', d: 0.35 }), CHIP + 0.3);
  // 10¹¹ joins between the billion and trillion rows
  const ELV = T('b4~eleven') - 0.4;
  [rows[3], rows[4]].forEach(g => S.add(gsap.to([g, g.bar, g.cnt, ...(g === r5 ? [chipT] : [])], { y: PITCH, duration: 0.6, ease: 'power2.inOut' }), ELV));
  const r11 = mkRow({ e: 11, name: 'hundred billion' }, 3, 'compute');
  S.set([r11.one, ...r11.zeros], { autoAlpha: 0 }, 0);
  const tokT = S.text('one token', { x: LX + 1100 - 16, y: r11.y + 2, size: 26, anchor: 'end', weight: 700, color: '#0a0f1e' });
  S.set(tokT, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(r11, { autoAlpha: 0, x: -80 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power3.out' }), ELV + 0.4);
  S.add(gsap.set(r11.bar, { autoAlpha: 1 }), ELV + 0.5);
  S.add(gsap.fromTo(r11.bar, { attr: { width: 0 } }, { attr: { width: 1100 }, duration: 0.8, ease: 'power3.out', immediateRender: false }), ELV + 0.5);
  S.add(fx.in([r11.cnt, tokT], { from: 'fade', d: 0.3, stagger: 0.2 }), ELV + 1.0);
  // four powers of ten apart: × 10,000
  const FOUR = T('b4~Four') - 0.1;
  const guide = ignore(S.line({ x1: LX + 1100, y1: r11.y + BH / 2 + 4, x2: LX + 1100, y2: 940, stroke: 'ink', sw: 2, dash: '5 6' }));
  S.set(guide, { autoAlpha: 0 }, 0);
  S.add(gsap.set(guide, { autoAlpha: 1 }), FOUR);
  S.add(fx.draw(guide, { d: 0.4 }), FOUR);
  const brk = S.bracket({ x1: LX + 1100, x2: LX + 1500, y: 936, label: '4 powers of ten', tone: 'ink', size: 28 });
  S.set(brk, { autoAlpha: 0 }, 0);
  S.add(fx.in(brk, { from: 'fade', d: 0.35 }), FOUR + 0.3);
  S.add(fx.swap(brk.label, '× 10,000'), 'b4~ten#3-0.05');
});
