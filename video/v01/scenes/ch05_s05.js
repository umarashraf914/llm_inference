/* ch05_s05 · doing the division slowly, units and all (fig 37)
   10¹¹ is eleven tens multiplied together, 10¹⁵ fifteen; dividing cancels eleven pairs and leaves four
   tens on the bottom: 10^(11−15) = 10⁻⁴ seconds = 0.0001 s = 0.1 ms. Units: operations cancel; per second
   is ÷ second, which flips to the top: seconds, a duration. Multiplying instead gives operations² per
   second, nothing at all. Check the units: 140 GB ÷ 4.8 TB/s → 29.2 ms passes the same test. */
V.scene('ch05_s05', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const NY = 360, BY = 432, DY = 512, PX = 140, US = 44;
  // b1-b2: the fraction, then the fraction over its rows of tens, are alone: fracG holds the fraction centred
  // (FX0 px right), then fraction and rows centred (FX) as the rows unfold; it moves to its place on the left as
  // the ladder arrives on the right in b3
  const FX0 = 478, FX = 330, fracG = S.g();
  S.set(fracG, { x: FX0 }, 0);
  S.add(gsap.fromTo(fracG, { x: FX0 }, { x: FX, duration: 0.7, ease: 'power2.inOut', immediateRender: false }), T('b1~eleven#2') - 1.1);
  S.add(gsap.fromTo(fracG, { x: FX }, { x: 0, duration: 0.7, ease: 'power2.inOut', immediateRender: false }), T('b3') - 0.6);

  // ---------------------------------------------------------------- the fraction: 10¹¹ operations over 10¹⁵ operations per second
  const num = S.g(null, fracG), den = S.g(null, fracG);
  const p11 = ch05Pow(S, 11, { x: PX, y: NY, size: 72, anchor: 'start', tone: 'compute', family: 'mono' }, num);
  const uN = S.text('operations', { x: p11.r + 18, y: NY + 4, size: US, weight: 650, color: 'ink' }, num);
  const p15 = ch05Pow(S, 15, { x: PX, y: DY, size: 72, anchor: 'start', tone: 'compute', family: 'mono' }, den);
  const uD = S.text('operations', { x: p15.r + 18, y: DY + 4, size: US, weight: 650, color: 'ink' }, den);
  const perX = p15.r + 18 + S.measure('operations', { size: US, weight: 650 }) + 16;
  const uPer = S.text('per Second', { x: perX, y: DY + 4, size: US, weight: 650, color: 'ink', case: 'keep' }, den);   // continues 'Operations': 'per' stays small
  const barW = perX + S.measure('per Second', { size: US, weight: 650, case: 'keep' }) - PX + 40;
  const bar = S.line({ x1: PX - 20, y1: BY, x2: PX - 20 + barW, y2: BY, stroke: 'ink', sw: 4, cap: 'round' }, fracG);
  S.set([num, den, bar], { autoAlpha: 0 }, 0);
  S.add(ch05Wipe(S, num, { d: 0.7 }), 0.4);
  S.add(gsap.set(bar, { autoAlpha: 1 }), 1.1);
  S.add(fx.draw(bar, { d: 0.5 }), 1.1);
  S.add(gsap.set(num, { autoAlpha: 1 }), 0.4);
  S.add(gsap.set(den, { autoAlpha: 1 }), 1.5);
  S.add(ch05Wipe(S, den, { d: 0.8 }), 1.5);

  // ---------------------------------------------------------------- b1: the powers unfold into rows of '10' tiles
  const TW = 40, TX = 22, PITCH = TW + TX, RX = 140, TY = [670, 750];
  const tileRow = (n, y) => Array.from({ length: n }, (_, k) => {
    const g = S.g(null, fracG);
    S.rect({ x: RX + k * PITCH, y: y - 20, w: TW, h: 40, r: 6, fill: 'url(#card-compute)', stroke: 'compute', sw: 1.5 }, g);
    S.text('10', { x: RX + k * PITCH + TW / 2, y: y + 1, size: 22, anchor: 'middle', weight: 700, family: 'mono', color: 'ink' }, g);
    if (k < n - 1) g.x = S.text('×', { x: RX + k * PITCH + TW + TX / 2, y: y + 1, size: 22, anchor: 'middle', weight: 700, color: 'compute' }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  });
  const top = tileRow(11, TY[0]), bot = tileRow(15, TY[1]);
  const tBar = ignore(S.line({ x1: RX - 10, y1: (TY[0] + TY[1]) / 2, x2: RX + 15 * PITCH - TX + 10, y2: (TY[0] + TY[1]) / 2, stroke: 'ink', sw: 2.5, strokeOpacity: 0.7 }, fracG));
  S.set(tBar, { autoAlpha: 0 }, 0);
  const c11 = S.text('11 tens', { x: RX + 11 * PITCH - TX + 18, y: TY[0] + 1, size: 26, weight: 600, color: 'muted' }, fracG);
  const c15 = S.text('15 tens', { x: RX + 15 * PITCH - TX + 18, y: TY[1] + 1, size: 26, weight: 600, color: 'muted' }, fracG);
  S.set([c11, c15], { autoAlpha: 0 }, 0);
  // the digit string flashes; its zeros light one at a time with the tile beneath
  const DSX = PX, cw = S.measure('0', { size: 34, weight: 600, family: 'mono' }), DSY = 274;
  const digs = '100,000,000,000'.split('').map((ch, i) => S.text(ch, { x: DSX + i * cw, y: DSY, size: 34, weight: 600, family: 'mono', color: 'ink' }, fracG));
  S.set(digs, { autoAlpha: 0 }, 0);
  const UNF = T('b1~eleven#2') - 0.1;
  S.add(gsap.to(digs, { autoAlpha: 1, duration: 0.25 }), UNF);
  S.add(gsap.set(tBar, { autoAlpha: 1 }), UNF + 0.3);
  S.add(fx.draw(tBar, { d: 0.5 }), UNF + 0.3);
  top.forEach((t, k) => S.add(gsap.fromTo(t, { autoAlpha: 0, y: NY - TY[0] }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out', immediateRender: false }), UNF + 0.3 + k * 0.05));
  S.add(fx.in(c11, { from: 'left', d: 0.3, dist: 10 }), UNF + 1.0);
  S.call(() => top.forEach(t => t.setAttribute('data-audit', 'ignore')), UNF);
  S.call(() => top.forEach(t => t.removeAttribute('data-audit')), UNF + 1.4);
  const zeros = digs.filter((d, i) => '100,000,000,000'[i] === '0');
  const ONE = T('b1~one') - 0.05;
  zeros.forEach((z, k) => {
    S.add(gsap.fromTo(z, { attr: { fill: S.tone('ink') } }, { attr: { fill: S.tone('compute') }, duration: 0.08, immediateRender: false }), ONE + k * 0.06);
    S.add(gsap.fromTo(top[k].firstChild, { attr: { 'stroke-width': 1.5 } }, { attr: { 'stroke-width': 3.5 }, duration: 0.08, immediateRender: false }), ONE + k * 0.06);
  });
  // the eleventh tile has no zero of its own: the string has eleven digits after the 1 counting the ones place
  S.add(gsap.to(digs, { autoAlpha: 0, duration: 0.3 }), ONE + 0.9);
  S.add(gsap.to(top.map(t => t.firstChild), { attr: { 'stroke-width': 1.5 }, duration: 0.3 }), ONE + 0.9);
  const FIF = T('b1~fifteen') - 0.6;
  bot.forEach((t, k) => S.add(gsap.fromTo(t, { autoAlpha: 0, y: DY - TY[1] }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out', immediateRender: false }), FIF + 0.3 + k * 0.05));
  S.add(fx.in(c15, { from: 'left', d: 0.3, dist: 10 }), FIF + 1.2);
  S.call(() => bot.forEach(t => t.setAttribute('data-audit', 'ignore')), FIF);
  S.call(() => bot.forEach(t => t.removeAttribute('data-audit')), FIF + 1.6);

  // ---------------------------------------------------------------- b2: eleven pairs cancel; four tens stay on the bottom
  const CAN = T('b2~cancels') - 0.1;
  const strikes = [];
  for (let k = 0; k < 11; k++) {
    const at = k === 0 ? CAN : T('b2~Eleven') - 0.1 + (k - 1) * 0.12;
    [top[k], bot[k]].forEach((t, r) => {
      const st = ignore(S.line({ x1: RX + k * PITCH - 4, y1: TY[r] + 16, x2: RX + k * PITCH + TW + 4, y2: TY[r] - 16, stroke: 'ink', sw: 3, cap: 'round' }, fracG));
      S.set(st, { autoAlpha: 0 }, 0);
      S.add(gsap.set(st, { autoAlpha: 1 }), at);
      S.add(fx.draw(st, { d: 0.18 }), at);
      S.add(gsap.to([t, st], { autoAlpha: 0, duration: 0.3 }), at + 0.35);
      strikes.push(st);
    });
  }
  const pairs = S.text('', { x: RX + 11 * PITCH - TX + 18, y: TY[0] + 1, size: 26, weight: 650, color: 'ink' }, fracG);
  const pc = { v: 0 };
  S.add(gsap.to(c11, { autoAlpha: 0, duration: 0.2 }), CAN);
  S.add(gsap.fromTo(pc, { v: 0 }, { v: 11, duration: 0.12 * 10 + 0.4, ease: 'none', immediateRender: false, onUpdate: () => { const n = Math.min(11, Math.floor(pc.v) + 1); pairs.textContent = `${n} pair${n > 1 ? 's' : ''}`; } }), CAN);
  S.set(pairs, { autoAlpha: 0 }, 0);
  S.add(gsap.to(pairs, { autoAlpha: 1, duration: 0.2 }), CAN);
  const oneT = S.text('1', { x: RX + TW / 2, y: TY[0] + 1, size: 30, anchor: 'middle', weight: 700, family: 'mono', color: 'ink' }, fracG);
  S.set(oneT, { autoAlpha: 0 }, 0);
  S.add(fx.in(oneT, { from: 'fade', d: 0.3 }), T('b2~Eleven') + 1.4);
  const FOUR = T('b2~four') - 0.1;
  S.add(fx.out([pairs, c15], { d: 0.3, stagger: 0 }), FOUR);
  S.add(gsap.fromTo(bot.slice(11), { filter: 'none' }, { filter: 'url(#glow-compute)', duration: 0.4, immediateRender: false }), FOUR);
  const left4 = S.text('4 left, on the bottom', { x: RX + 13 * PITCH, y: TY[1] + 56, size: 26, anchor: 'middle', weight: 650, color: 'compute' }, fracG);
  S.set(left4, { autoAlpha: 0 }, 0);
  S.add(fx.in(left4, { from: 'up', d: 0.35, dist: 10 }), FOUR + 0.2);
  const head = S.text('dividing powers of ten: subtract the exponents', { x: 960, y: 150, size: 38, anchor: 'middle', weight: 700, color: 'ink' });
  S.set(head, { autoAlpha: 0 }, 0);
  S.add(gsap.set(head, { autoAlpha: 1 }), 'b2~subtracting-0.1');
  S.add(ch05Wipe(S, head, { d: 0.8 }), 'b2~subtracting-0.1');

  // ---------------------------------------------------------------- b3: the ladder: 10^(11−15) = 10⁻⁴ s = 0.0001 s = 0.1 ms
  const LX = 1300, LY = [360, 530, 650];
  const line = (exp, unit, y) => {
    const g = S.g();
    const eq = S.text('=', { x: LX, y, size: 48, weight: 700, color: 'muted' }, g);
    const pw = ch05Pow(S, exp, { x: LX + 46, y, size: 56, anchor: 'start', tone: 'compute', family: 'mono' }, g);
    if (unit) S.text(unit, { x: pw.r + 16, y: y + 3, size: 40, weight: 650, color: 'ink' }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  };
  const la = line('(11−15)', null, LY[0]), lb = line(-4, null, LY[0]), lc = line(-4, 'seconds', LY[0]);
  S.add(gsap.set(la, { autoAlpha: 1 }), 'b3-0.1');
  S.add(ch05Wipe(S, la, { d: 0.6 }), 'b3-0.1');
  const M4 = T('b3~is') - 0.05;
  S.add(gsap.to(la, { autoAlpha: 0, duration: 0.3 }), M4);
  S.call(() => [la, lb].forEach(e => e.setAttribute('data-audit', 'ignore')), M4);
  S.call(() => [la, lb].forEach(e => e.removeAttribute('data-audit')), M4 + 0.45);
  S.add(gsap.fromTo(lb, { autoAlpha: 0, scale: 1.2, transformOrigin: `${LX + 120}px ${LY[0]}px` }, { autoAlpha: 1, scale: 1, duration: 0.4, immediateRender: false }), M4);
  S.add(gsap.to(lb, { autoAlpha: 0, duration: 0.2 }), T('b3~So') + 0.1);
  S.add(gsap.to(lc, { autoAlpha: 1, duration: 0.3 }), T('b3~So') + 0.1);
  const note = S.text('10⁻⁴ = 1 / 10,000', { x: LX + 46, y: LY[0] + 70, size: 28, weight: 600, family: 'mono', color: 'muted' });
  S.set(note, { autoAlpha: 0 }, 0);
  S.add(fx.in(note, { from: 'up', d: 0.35, dist: 10 }), 'b3~fraction');
  const l2 = S.text([{ t: '= ', c: 'muted' }, { t: '0.000', c: 'ink' }, { t: '1', c: 'compute' }, { t: ' seconds', c: 'ink' }], { x: LX, y: LY[1], size: 44, weight: 650, family: 'mono' });
  S.set(l2, { autoAlpha: 0 }, 0);
  S.add(gsap.set(l2, { autoAlpha: 1 }), 'b3~ten-thousandth-0.1');
  S.add(ch05Wipe(S, l2, { d: 0.6 }), 'b3~ten-thousandth-0.1');
  // the decimal point hops three places right
  const mcw = S.measure('0', { size: 44, weight: 650, family: 'mono' }), dotX0 = LX + S.measure('= 0', { size: 44, weight: 650, family: 'mono' }) + mcw * 0.5;
  const hop = ignore(S.circle({ x: dotX0, y: LY[1] + 14, r: 5, fill: 'compute' }));
  S.set(hop, { autoAlpha: 0 }, 0);
  const HP = T('b3~or') - 0.05;
  S.add(gsap.set(hop, { autoAlpha: 1 }), HP);
  for (let k = 0; k < 3; k++) {
    S.add(gsap.to(hop, { x: (k + 1) * mcw, duration: 0.18, ease: 'none' }), HP + k * 0.22);
    S.add(gsap.to(hop, { y: -20, duration: 0.09, yoyo: true, repeat: 1, ease: 'power1.out' }), HP + k * 0.22);
  }
  S.add(gsap.to(hop, { autoAlpha: 0, duration: 0.2 }), HP + 0.75);
  const l3 = S.g();
  const l3t = S.text([{ t: '= ', c: 'muted' }, { t: '0.1 milliseconds', c: 'ink' }], { x: LX, y: LY[2], size: 44, weight: 700, family: 'mono' }, l3);
  const l3w = S.measure('= 0.1 milliseconds', { size: 44, weight: 700, family: 'mono' });
  const box = S.rect({ x: LX + 40, y: LY[2] - 34, w: l3w - 22, h: 68, r: 12, stroke: 'compute', sw: 3 }, l3);
  S.set(l3, { autoAlpha: 0 }, 0);
  S.add(fx.in(l3, { from: 'up', d: 0.4, dist: 12 }), HP + 0.6);

  // ---------------------------------------------------------------- b4: the units cancel; per second flips to the top: seconds
  const B4 = T('b4') - 0.1;
  const dimmed = [...top.slice(11), ...bot.slice(11), oneT, left4, head, note, lc, l2, tBar, p11, p15];
  S.add(gsap.to(dimmed, { opacity: 0.3, duration: 0.4 }), B4);
  S.add(gsap.fromTo([uN, uD, uPer], { filter: 'none' }, { filter: 'url(#glow-struct)', duration: 0.4, yoyo: true, repeat: 1, immediateRender: false }), 'b4~units');
  const GO = T('b4~go') - 0.15;
  [uN, uD].forEach(u => {
    const bb = { x: u === uN ? p11.r + 18 : p15.r + 18, y: u === uN ? NY : DY, w: S.measure('operations', { size: US, weight: 650 }) };
    const st = ignore(S.line({ x1: bb.x - 4, y1: bb.y + 4, x2: bb.x + bb.w + 4, y2: bb.y + 4, stroke: 'bytes', sw: 4, cap: 'round' }));
    S.set(st, { autoAlpha: 0 }, 0);
    S.add(gsap.set(st, { autoAlpha: 1 }), GO);
    S.add(fx.draw(st, { d: 0.3 }), GO);
    S.add(gsap.to([u, st], { autoAlpha: 0, duration: 0.35 }), GO + 0.45);
  });
  // 'per second' rewrites as '1 / second', then the second flips to the top
  const oneOver = S.text('1 / second', { x: perX, y: DY + 4, size: US, weight: 650, color: 'ink' });
  S.set(oneOver, { autoAlpha: 0 }, 0);
  const DV = T('b4~divided') - 0.1;
  S.add(gsap.to(uPer, { autoAlpha: 0, duration: 0.25 }), DV);
  S.add(gsap.to(oneOver, { autoAlpha: 1, duration: 0.25 }), DV + 0.15);
  const secTop = S.text('second', { x: p11.r + 18, y: NY + 4, size: US, weight: 650, color: 'ink' });
  S.set(secTop, { autoAlpha: 0 }, 0);
  const FL = T('b4~flips') - 0.1;
  S.add(gsap.to(oneOver, { autoAlpha: 0, y: -40, duration: 0.35, ease: 'power2.in' }), FL);
  S.add(gsap.fromTo(secTop, { autoAlpha: 0, y: DY - NY, x: perX - (p11.r + 18) }, { autoAlpha: 1, y: 0, x: 0, duration: 0.7, ease: 'power3.inOut', immediateRender: false }), FL);
  S.call(() => secTop.setAttribute('data-audit', 'ignore'), FL);
  S.call(() => secTop.removeAttribute('data-audit'), FL + 0.75);
  const res = S.g();
  S.text('= seconds', { x: PX - 20 + barW + 30, y: BY + 4, size: 52, weight: 700, color: 'ink' }, res);
  const chk = S.g(null, res);
  const chkX = PX - 20 + barW + 30 + S.measure('= seconds', { size: 52, weight: 700 }) + 40;
  S.circle({ x: chkX, y: BY, r: 22, fill: '#0c1326' }, chk);
  S.icon('ph:check-circle-duotone', { x: chkX, y: BY, size: 50, color: 'helps' }, chk);
  S.set(res, { autoAlpha: 0 }, 0);
  S.add(fx.in(res, { from: 'left', d: 0.4, dist: 14 }), 'b4~Seconds-0.1');

  // ---------------------------------------------------------------- b5: multiply instead: operations² per second, not anything
  const B5 = T('b5') - 0.15;
  S.add(gsap.to([lc, l2, l3, note], { x: 300, autoAlpha: 0, duration: 0.6, ease: 'power2.in' }), B5);
  // beside the fraction, centred on its bar; the title centred at the top, the sum centred below it (WC)
  const WP = { x: 1270, y: BY - 155, w: 560, h: 310 }, XC = WP.x + WP.w / 2, WC = WP.y + 195;
  const wrong = S.g();
  S.rect({ x: WP.x, y: WP.y, w: WP.w, h: WP.h, r: 22, fill: '#0c1326', stroke: 'muted', strokeOpacity: 0.6, sw: 2 }, wrong);
  S.text('the wrong way', { x: XC, y: WP.y + 58, size: 30, anchor: 'middle', weight: 700, color: 'muted' }, wrong);
  const w1 = S.text('operations × operations', { x: XC, y: WC - 15, size: 36, anchor: 'middle', weight: 650, color: 'muted' }, wrong);
  const w1b = S.text('per Second', { x: XC, y: WC + 35, size: 36, anchor: 'middle', weight: 650, color: 'muted', case: 'keep' }, wrong);
  const w2 = S.text('operations² per second', { x: XC, y: WC + 14, size: 40, anchor: 'middle', weight: 700, color: 'ink' }, wrong);
  S.set([wrong, w2], { autoAlpha: 0 }, 0);
  S.add(fx.in(wrong, { from: 'right', d: 0.5, dist: 30 }), B5 + 0.4);
  const SQ = T('b5~squared') - 0.1;
  S.add(gsap.to([w1, w1b], { autoAlpha: 0, scale: 0.85, transformOrigin: `${XC}px ${WC}px`, duration: 0.35 }), SQ);
  S.add(gsap.to(w2, { autoAlpha: 1, duration: 0.35 }), SQ + 0.2);
  const xs = S.g();
  S.path({ d: `M${XC - 110},${WC - 60} L${XC + 110},${WC + 60} M${XC + 110},${WC - 60} L${XC - 110},${WC + 60}`, stroke: 'muted', sw: 8, cap: 'round' }, xs);
  ignore(xs);
  S.set(xs, { autoAlpha: 0 }, 0);
  S.add(fx.pop(xs, { d: 0.35, from: 1.6 }), 'b5~duration-0.1');
  S.add(gsap.to(wrong, { opacity: 0.55, scale: 0.94, svgOrigin: `${WP.x + WP.w / 2} ${WP.y + WP.h / 2}`, duration: 0.5 }), 'b5~Something');   // shrinks about its own centre

  // ---------------------------------------------------------------- b6: three cards under one banner: check the units
  const B6 = T('b6') - 0.15;
  const all = [num, den, bar, secTop, oneOver, res, ...dimmed.filter(e => e !== lc && e !== l2 && e !== note), wrong, xs, w2];
  S.add(gsap.to(all, { autoAlpha: 0, duration: 0.5 }), B6);
  S.call(() => all.forEach(e => e.setAttribute('data-audit', 'ignore')), B6);
  const CARDS = [
    { t: 'operations ÷ operations/s → seconds', tone: 'compute', ok: true },
    { t: 'operations × operations/s', tone: 'neutral', ok: false },
    { t: '140 GB ÷ 4.8 TB/s → 29.2 ms', tone: 'bytes', ok: true },
  ];
  const CWd = 550, CGap = 24, CX0 = 960 - (3 * CWd + 2 * CGap) / 2, CYc = 600;
  const cards = CARDS.map((c, i) => {
    const g = S.g(), x = CX0 + i * (CWd + CGap);
    S.rect({ x, y: CYc - 80, w: CWd, h: 160, r: 20, fill: '#0c1326' }, g);
    S.rect({ x, y: CYc - 80, w: CWd, h: 160, r: 20, fill: `url(#card-${c.tone})`, stroke: c.tone === 'neutral' ? '#ffffff' : c.tone, strokeOpacity: c.tone === 'neutral' ? 0.25 : 0.7, sw: 2 }, g);
    S.text(c.t, { x: x + CWd / 2, y: CYc - 24, size: 24, anchor: 'middle', weight: 650, family: 'mono', color: c.ok ? 'ink' : 'muted' }, g);
    S.circle({ x: x + CWd / 2, y: CYc + 34, r: 22, fill: '#0c1326' }, g);
    if (c.ok) S.icon('ph:check-circle-duotone', { x: x + CWd / 2, y: CYc + 34, size: 50, color: 'helps' }, g);
    else S.icon('ph:x-circle-duotone', { x: x + CWd / 2, y: CYc + 34, size: 50, color: 'muted' }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    S.add(fx.in(g, { from: 'scale', scale: 0.9, d: 0.45 }), B6 + 0.4 + i * 0.2);
    return g;
  });
  const banner = S.g();
  S.rect({ x: 660, y: 368, w: 600, h: 84, r: 42, fill: 'helps', fillOpacity: 0.14, stroke: 'helps', sw: 2.5 }, banner);
  const bt = S.text('check the units', { x: 960, y: 411, size: 44, anchor: 'middle', weight: 700, family: 'display', color: 'helps' }, banner);
  S.set(banner, { autoAlpha: 0 }, 0);
  S.add(gsap.set(banner, { autoAlpha: 1 }), B6 + 1.0);
  S.add(ch05Wipe(S, banner, { d: 0.7 }), B6 + 1.0);
  const mag = S.icon('ph:magnifying-glass-duotone', { x: 1340, y: 410, size: 70, color: 'helps' });
  S.set(mag, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(mag, { autoAlpha: 0, rotation: -120, scale: 0.6, svgOrigin: '1340 410' }, { autoAlpha: 1, rotation: 0, scale: 1.25, svgOrigin: '1340 410', duration: 0.8, ease: 'back.out(1.8)', immediateRender: false }), 'b6~including-0.1');
});
