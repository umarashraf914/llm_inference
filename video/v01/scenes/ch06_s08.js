/* ch06_s08 · reading a specification sheet (fig 80)
   b1  two tags: blue 'an amount: gigabytes', coral 'a rate: gigabytes per second'; the H100 sheet slides in.
   b2  four rows land on their names (name · value pill coloured by meaning · 'an amount' / 'a rate'); side
       notes show only while their row is spoken; the three rate tags glow, then the one amount tag.
   b3  the capacity and bandwidth rows lift out as two cards: a tank ('does it fit?') and a pipe ('how fast
       is it read?'); the top tags pulse on 'count and rate again'; 'separate limits'.
   b4  a 140 GB block drops into the 80 GB tank and overflows: 140 ÷ 80 = 1.75 → at least 2 chips; then the
       cards fold back into the sheet, whole, all four tags lit.
   Checks: 989 TFLOP/s = 9.89e14 ≈ 10¹⁵; 140 / 80 = 1.75 → 2 chips.
   Layout: tags y 120; sheet x 460-1460, y 180-730, rows y 340/440/540/640; side notes x ≥ 1485.
   Cards x 190-790 and 1130-1730, y 250-690. */
V.scene('ch06_s08', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const ignoreIn = (els, a, b) => ch06Clock(S, a, b, t => els.forEach(e => (t > a && t < b ? e.setAttribute('data-audit', 'ignore') : e.removeAttribute('data-audit'))));
  const glow = (el, at, k = 1.15) => S.add(gsap.fromTo(el, { scale: 1, transformOrigin: '50% 50%' }, { scale: k, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%', immediateRender: false }), at);

  // ================================================================ b1: amount vs rate; the sheet
  const tagAmt = S.pill('an amount: gigabytes', { x: 690, y: 118, tone: 'struct', size: 28, h: 54 });
  const tagRate = S.pill('a rate: gigabytes per second', { x: 1240, y: 118, tone: 'bytes', size: 28, h: 54 });
  S.add(fx.in(tagAmt, { from: 'up', d: 0.5, dist: 14 }), 'b1~amount-0.1');
  S.add(fx.in(tagRate, { from: 'up', d: 0.5, dist: 14 }), 'b1~rate-0.1');

  const SH = { x: 460, y: 180, w: 1000, h: 550 };
  const sheet = S.g();
  const page = S.g(null, sheet);
  S.path({ d: `M${SH.x + 18},${SH.y} H${SH.x + SH.w - 46} L${SH.x + SH.w},${SH.y + 46} V${SH.y + SH.h - 18} Q${SH.x + SH.w},${SH.y + SH.h} ${SH.x + SH.w - 18},${SH.y + SH.h} H${SH.x + 18} Q${SH.x},${SH.y + SH.h} ${SH.x},${SH.y + SH.h - 18} V${SH.y + 18} Q${SH.x},${SH.y} ${SH.x + 18},${SH.y} Z`, fill: '#141d35', stroke: 'ink', strokeOpacity: 0.3, sw: 2, filter: 'url(#shadow)' }, page);
  S.path({ d: `M${SH.x + SH.w - 46},${SH.y} V${SH.y + 46} H${SH.x + SH.w}`, fill: '#1f2a48', stroke: 'ink', strokeOpacity: 0.3, sw: 2 }, page);
  S.icon('ph:file-text-duotone', { x: SH.x + 56, y: SH.y + 58, size: 56, color: 'muted' }, page);
  S.text('H100', { x: SH.x + 98, y: SH.y + 60, size: 50, weight: 750, family: 'display', color: 'ink' }, page);
  S.text('specification sheet', { x: SH.x + 252, y: SH.y + 64, size: 26, weight: 550, color: 'muted' }, page);
  S.line({ x1: SH.x + 30, y1: SH.y + 108, x2: SH.x + SH.w - 30, y2: SH.y + 108, stroke: 'ink', strokeOpacity: 0.18, sw: 2 }, page);
  S.set(sheet, { autoAlpha: 0 }, 0);
  S.add(fx.in(sheet, { from: 'down', d: 0.7, dist: 40 }), 'b1~Take-0.1');

  const ROWS = [
    { name: 'Memory capacity', val: '80 GB', tone: 'struct', tag: 'an amount' },
    { name: 'Memory bandwidth', val: '3.35 TB/s', tone: 'bytes', tag: 'a rate' },
    { name: 'Peak compute', val: '989 TFLOP/s', tone: 'compute', tag: 'a rate', note: '16-bit · 989 trillion ≈ 10¹⁵' },
    { name: 'Power draw', val: '700 W', tone: 'neutral', tag: 'a rate', note: 'watt = energy per second' },
  ];
  const RY = [340, 440, 540, 640];
  const rows = ROWS.map((r, i) => {
    const g = S.g(null, sheet), y = RY[i];
    if (i) S.line({ x1: SH.x + 30, y1: y - 50, x2: SH.x + SH.w - 30, y2: y - 50, stroke: 'ink', strokeOpacity: 0.08, sw: 1.5 }, g);
    r.nameEl = S.text(r.name, { x: SH.x + 40, y, size: 32, weight: 600, color: 'ink' }, g);
    r.pill = S.pill(r.val, { x: 980, y, tone: r.tone, size: 32, h: 58, mono: true }, g);
    r.tagEl = S.text(r.tag, { x: SH.x + SH.w - 40, y, size: 28, weight: 650, anchor: 'end', color: r.tag === 'a rate' ? 'bytes' : 'struct' }, g);
    if (r.note) {
      r.noteEl = S.text(r.note, { x: SH.x + SH.w + 26, y, size: 24, weight: 550, color: 'muted' });
      S.set(r.noteEl, { autoAlpha: 0 }, 0);
    }
    [r.nameEl, r.pill, r.tagEl].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
    r.g = g;
    return r;
  });
  const land = (r, tName, tPill, tTag) => {
    S.add(fx.in(r.nameEl, { from: 'left', d: 0.45, dist: 16 }), tName);
    S.add(fx.in(r.pill, { from: 'up', d: 0.45, dist: 12 }), tPill);
    S.add(fx.in(r.tagEl, { from: 'right', d: 0.45, dist: 16 }), tTag);
  };
  land(rows[0], 'b2~Memory-0.1', 'b2~eighty-0.1', 'b2~amount-0.15');
  land(rows[1], 'b2~Bandwidth-0.1', 'b2~Bandwidth+0.1', 'b2~rate-0.15');
  land(rows[2], 'b2~Peak-0.1', 'b2~nine-0.1', 'b2~rate#2-0.15');
  land(rows[3], 'b2~Power-0.1', 'b2~seven-0.1', 'b2~rate#3-0.15');
  // earlier rows dim a little as the next arrives
  [['b2~Bandwidth-0.1', 0], ['b2~Peak-0.1', 1], ['b2~Power-0.1', 2]].forEach(([at, i]) => S.add(gsap.to(rows[i].g, { opacity: 0.62, duration: 0.4 }), at));
  // side notes only while their row is spoken
  S.add(fx.in(rows[2].noteEl, { from: 'left', d: 0.4, dist: 12 }), 'b2~tera-0.1');
  S.add(fx.out(rows[2].noteEl, { d: 0.3 }), 'b2~Power-0.2');
  S.add(fx.in(rows[3].noteEl, { from: 'left', d: 0.4, dist: 12 }), 'b2~energy-0.1');
  S.add(fx.out(rows[3].noteEl, { d: 0.3 }), T('b3') - 0.1);
  // the three rate tags glow together, then the one amount tag
  const tGlow = T('b2~too') + 0.05;
  S.add(gsap.to(rows.map(r => r.g), { opacity: 1, duration: 0.3 }), tGlow - 0.2);
  [1, 2, 3].forEach(i => glow(rows[i].tagEl, tGlow));
  glow(rows[0].tagEl, tGlow + 0.55);
  const three = S.text([{ t: 'three rates', c: 'bytes' }, { t: ', ', c: 'muted' }, { t: 'one amount', c: 'struct' }], { x: 960, y: SH.y + SH.h + 52, size: 32, weight: 650, anchor: 'middle' });
  S.set(three, { autoAlpha: 0 }, 0);
  S.add(fx.in(three, { from: 'up', d: 0.45, dist: 12 }), tGlow + 0.2);

  // ================================================================ b3: capacity and bandwidth, lifted out
  const tDim = T('b3') + 0.05, tLift = T('b3~mistaking') - 0.15;
  S.add(gsap.to([rows[2].g, rows[3].g], { opacity: 0.25, duration: 0.5 }), tDim);
  S.add(fx.out(three, { d: 0.35 }), tDim);
  S.add(gsap.to(sheet, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }), tLift);
  ignoreIn([sheet], tLift, T('b4~sheet') + 0.3);
  const CW = 600, CH = 440, CYT = 250, CXS = [190, 1130];
  const liftCard = (k, r) => {
    const outer = S.g(), g = S.g(null, outer);
    const x = CXS[k];
    S.card({ x, y: CYT, w: CW, h: CH, tone: r.tone, r: 26 }, g);
    S.text(r.name, { x: x + 36, y: CYT + 62, size: 36, weight: 700, color: 'ink' }, g);
    S.pill(r.val, { x: x + 36, y: CYT + 150, tone: r.tone, size: 44, h: 76, mono: true, anchor: 'start' }, g);
    S.text(r.tag, { x: x + 36, y: CYT + 236, size: 32, weight: 650, color: r.tone }, g);
    outer.inner = g; outer.x = x;
    // starts as its row in the sheet (half size), lifts to its place
    const rcx = x + CW / 2, rcy = CYT + CH / 2;
    S.set(outer, { autoAlpha: 0 }, 0);
    S.add(gsap.fromTo(outer, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, immediateRender: false }), tLift);
    S.add(fx.xform(g, { x: 0, y: 0, s: 1, ox: rcx, oy: rcy }, { from: { x: 960 - rcx, y: RY[k] - rcy, s: 0.5, ox: rcx, oy: rcy }, d: 0.9, ease: 'power3.inOut' }), tLift);
    return outer;
  };
  const capCard = liftCard(0, ROWS[0]), bwCard = liftCard(1, ROWS[1]);
  ignoreIn([capCard, bwCard], tLift, tLift + 0.9);

  // the tank in the capacity card: open at the top, holds 80 GB
  const TK = { x: CXS[0] + 370, w: 180, top: 470, bot: 640 };
  const tank = S.g(null, capCard.inner);
  S.rect({ x: TK.x, y: TK.top, w: TK.w, h: TK.bot - TK.top, fill: 'struct', fillOpacity: 0.08 }, tank);
  const tankWalls = S.path({ d: `M${TK.x - 10},${TK.top} H${TK.x} V${TK.bot} H${TK.x + TK.w} V${TK.top} H${TK.x + TK.w + 10}`, stroke: 'struct', sw: 4 }, tank);
  tankWalls.setAttribute('data-audit', 'ignore');
  S.text('80 GB', { x: TK.x + TK.w / 2, y: TK.bot - 26, size: 28, weight: 700, family: 'mono', anchor: 'middle', color: 'struct' }, tank);
  const fitQ = S.text('does it fit?', { x: CXS[0] + CW / 2, y: CYT + CH + 42, size: 32, weight: 600, anchor: 'middle', color: 'ink' });
  S.set([tank, fitQ], { autoAlpha: 0 }, 0);
  S.add(fx.in(tank, { from: 'up', d: 0.5, dist: 14 }), 'b3~Capacity says-0.1');
  S.add(fx.in(fitQ, { from: 'up', d: 0.45, dist: 12 }), 'b3~whether-0.1');
  // the pipe in the bandwidth card, dashes flowing through it
  const PP = { x: CXS[1] + 340, w: 220, y: 555, h: 40 };
  const pipe = S.g(null, bwCard.inner);
  S.rect({ x: PP.x, y: PP.y - PP.h / 2, w: PP.w, h: PP.h, r: 8, fill: '#2a1218', stroke: 'bytes', sw: 3 }, pipe);
  const pipeFlow = S.path({ d: '', fill: 'bytes' }, pipe);
  const pipeArrow = S.path({ d: `M${PP.x + PP.w + 12},${PP.y - 16} L${PP.x + PP.w + 30},${PP.y} L${PP.x + PP.w + 12},${PP.y + 16}`, stroke: 'bytes', sw: 4 }, pipe);
  [pipeFlow, pipeArrow].forEach(e => e.setAttribute('data-audit', 'ignore'));
  const fastQ = S.text('how fast is it read?', { x: CXS[1] + CW / 2, y: CYT + CH + 42, size: 32, weight: 600, anchor: 'middle', color: 'ink' });
  S.set([pipe, fastQ], { autoAlpha: 0 }, 0);
  S.add(fx.in(pipe, { from: 'left', d: 0.5, dist: 14 }), 'b3~Bandwidth says-0.1');
  S.add(fx.in(fastQ, { from: 'up', d: 0.45, dist: 12 }), 'b3~fast-0.1');
  ch06Clock(S, T('b3~Bandwidth says'), S.duration, t => {
    let d = '';
    for (let x = PP.x + 8 + ((t * 160) % 34); x < PP.x + PP.w - 22; x += 34) d += `M${x.toFixed(1)},${PP.y - 4}h16v8h-16z`;
    pipeFlow.setAttribute('d', d);
  });
  // 'count and rate again': the two tags at the top pulse
  glow(tagAmt, T('b3~count') - 0.05, 1.1);
  glow(tagRate, T('b3~rate') - 0.05, 1.1);
  const sep = S.text('separate limits', { x: 960, y: CYT + CH / 2, size: 30, weight: 600, anchor: 'middle', color: 'muted' });
  S.set(sep, { autoAlpha: 0 }, 0);
  S.add(fx.in(sep, { from: 'fade', d: 0.45 }), 'b3~fail-0.1');

  // ================================================================ b4: 140 GB won't fit in 80
  const blkH = (TK.bot - TK.top) * 140 / 80, blkW = TK.w - 14;
  const blk = S.g();
  const blkR = S.rect({ x: TK.x + 7, y: TK.bot - blkH, w: blkW, h: blkH, r: 6, fill: '#3a1820', stroke: 'bytes', sw: 3 }, blk);
  const blkT = S.text('140 GB', { x: TK.x + TK.w / 2, y: TK.bot - blkH + 34, size: 30, weight: 700, family: 'mono', anchor: 'middle', color: 'bytes' }, blk);
  // the part above the rim, shaded: the overflow
  const over = S.rect({ x: TK.x + 7, y: TK.bot - blkH, w: blkW, h: blkH - (TK.bot - TK.top), r: 6, fill: 'bytes', fillOpacity: 0.32 }, blk);
  const rimLine = S.line({ x1: TK.x - 16, y1: TK.top, x2: TK.x + TK.w + 16, y2: TK.top, stroke: 'ink', sw: 3, dash: '8 6' }, blk);
  [over, rimLine].forEach(e => e.setAttribute('data-audit', 'ignore'));
  S.set(blk, { autoAlpha: 0 }, 0);
  S.set([over, rimLine], { autoAlpha: 0 }, 0);
  const tDrop = T('b4~hundred') - 0.1;
  S.add(gsap.fromTo(blk, { autoAlpha: 1, y: -260 }, { y: 0, duration: 0.6, ease: 'bounce.out', immediateRender: false }), tDrop);
  S.set(blk, { autoAlpha: 0 }, tDrop - 0.001);
  S.add(fx.in([over, rimLine], { from: 'fade', d: 0.4 }), tDrop + 0.65);
  S.add(gsap.fromTo(over, { attr: { 'fill-opacity': 0.32 } }, { attr: { 'fill-opacity': 0.6 }, duration: 0.3, yoyo: true, repeat: 3, ease: 'sine.inOut', immediateRender: false }), 'b4~fit-0.1');
  ignoreIn([blk, tank], tDrop, tDrop + 0.7);
  const chips = S.text([{ t: '140 ÷ 80 = 1.75', c: 'ink' }, { t: '  →  ', c: 'muted' }, { t: 'at least 2 chips', c: 'bytes' }], { x: CXS[0] + CW / 2, y: CYT + CH + 100, size: 32, weight: 650, anchor: 'middle' });
  const later = S.text('splitting: later in the series', { x: CXS[0] + CW / 2, y: CYT + CH + 146, size: 24, weight: 550, anchor: 'middle', color: 'muted' });
  S.set([chips, later], { autoAlpha: 0 }, 0);
  S.add(fx.in(chips, { from: 'up', d: 0.5, dist: 12 }), 'b4~two-0.1');
  S.add(fx.in(later, { from: 'fade', d: 0.45 }), T('b4~chips') + 0.3);
  // 'a sheet like this': the cards fold back into their rows; the sheet is whole again, all tags lit
  const tBack = T('b4~sheet') - 0.15;
  S.add(fx.out([chips, later, sep, fitQ, fastQ, blk], { d: 0.35, stagger: 0.02 }), tBack - 0.1);
  [capCard, bwCard].forEach((c, k) => {
    const rcx = CXS[k] + CW / 2, rcy = CYT + CH / 2;
    S.add(fx.xform(c.inner, { x: 960 - rcx, y: RY[k] - rcy, s: 0.5, ox: rcx, oy: rcy }, { d: 0.8, ease: 'power3.inOut' }), tBack);
    S.add(gsap.to(c, { autoAlpha: 0, duration: 0.35 }), tBack + 0.5);
  });
  ignoreIn([capCard, bwCard], tBack, S.duration);
  S.add(gsap.to(sheet, { opacity: 1, duration: 0.6, ease: 'power2.inOut' }), tBack + 0.4);
  S.add(gsap.to(rows.map(r => r.g), { opacity: 1, duration: 0.4 }), tBack + 0.4);
  rows.forEach((r, i) => glow(r.tagEl, tBack + 1.0 + 0.12 * i, 1.12));
});
