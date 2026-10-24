/* ch05_s07 · where the thirty milliseconds goes (fig 39)
   The thesis bar, to scale (50 px per ms): a 5 px amber sliver, the arithmetic, under 1%; the other 99% is
   something else. The clue: the 30 ms came from bytes ÷ bytes per second (140 GB ÷ 4.8 TB/s = 29.2 ms),
   so the remainder turns coral: the memory wall. Two numbers off the spec sheet will explain the whole
   gap, for any model on any chip. Every idea from here on tries to shrink the coral part. */
V.scene('ch05_s07', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const X0 = 210, BW = 30 * CH05.PX_PER_MS, Y = 480, H = 56, SL = CH05.SLIVER_PX;

  // ---------------------------------------------------------------- b1: the title; the bar glides up; under 1% is arithmetic
  const title = S.text('Where the 30 milliseconds goes', { x: 960, y: 156, size: 48, anchor: 'middle', weight: 700, family: 'display', color: 'ink' });
  S.set(title, { autoAlpha: 0 }, 0);
  S.add(gsap.set(title, { autoAlpha: 1 }), 0.2);
  S.add(ch05Wipe(S, title, { d: 0.9 }), 0.2);
  const sw = ch05Stopwatch(S, { x: 150, y: 156, size: 76, readout: 'right', readoutSize: 26 });
  S.set(sw, { autoAlpha: 0 }, 0);
  S.add(gsap.to(sw, { autoAlpha: 1, duration: 0.4 }), 0.4);
  const bar = S.g();
  const rest = S.rect({ x: X0 + SL + 2, y: Y - H / 2, w: BW - SL - 2, h: H, r: 6, fill: '#7c879e', fillOpacity: 0.35, stroke: 'ink', strokeOpacity: 0.5, sw: 2 }, bar);
  const coral = S.rect({ x: X0 + SL + 2, y: Y - H / 2, w: BW - SL - 2, h: H, r: 6, fill: 'url(#bar-bytes)', stroke: 'bytes', sw: 2 }, bar);
  S.set(coral, { autoAlpha: 0 }, 0);
  const sliver = ch05Sliver(S, { x: X0, y: Y, h: H, tagSide: 'below', tagGap: 28, tagSize: 24 }, bar);
  S.set(sliver.tagG, { autoAlpha: 0 }, 0);
  // from the previous scene's place (x 300, y 560) to centre
  S.add(gsap.fromTo(bar, { x: 90, y: 80, autoAlpha: 0.6 }, { x: 0, y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.inOut' }), 0.15);
  S.add(fx.in(sliver.tagG, { from: 'fade', d: 0.4 }), 1.0);
  const aLbl = S.g();
  S.line({ x1: X0 + SL / 2, y1: Y - H / 2 - 8, x2: X0 + SL / 2, y2: Y - H / 2 - 44, stroke: 'compute', sw: 2 }, aLbl);
  S.text('arithmetic, under 1%', { x: X0 - 4, y: Y - H / 2 - 62, size: 30, weight: 700, color: 'compute' }, aLbl);
  ignore(aLbl.firstChild);
  S.set(aLbl, { autoAlpha: 0 }, 0);
  S.add(fx.in(aLbl, { from: 'down', d: 0.4, dist: 12 }), 'b1~Under');
  const rLbl = S.text('something else, 99%', { x: X0 + BW / 2 + 20, y: Y + 2, size: 34, anchor: 'middle', weight: 700, color: 'ink' });
  S.set(rLbl, { autoAlpha: 0 }, 0);
  S.add(gsap.set(rLbl, { autoAlpha: 1 }), 'b1~something');
  S.add(ch05Wipe(S, rLbl, { d: 0.7 }), 'b1~something');

  // ---------------------------------------------------------------- b2: not the chip, not the model; the clue: bytes ÷ bytes per second
  const card = (x, icon, text) => {
    const g = S.g();
    S.rect({ x, y: 640, w: 380, h: 84, r: 18, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.2, sw: 2 }, g);
    S.icon(icon, { x: x + 44, y: 682, size: 42, color: 'ink' }, g);
    S.text(text, { x: x + 80, y: 683, size: 28, weight: 650, color: 'ink' }, g);
    S.circle({ x: x + 346, y: 682, r: 18, fill: '#0c1326' }, g);
    S.icon('ph:check-circle-duotone', { x: x + 346, y: 682, size: 40, color: 'helps' }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  };
  const cChip = card(540, 'ph:cpu-duotone', 'not slow'), cModel = card(1000, 'ph:file-duotone', 'not badly written');
  S.add(fx.in(cChip, { from: 'up', d: 0.4, dist: 12 }), 'b2~chip');
  S.add(fx.in(cModel, { from: 'up', d: 0.4, dist: 12 }), 'b2~model');
  S.add(fx.out([cChip, cModel], { d: 0.35, stagger: 0 }), 'b2~clue-0.3');
  const clue1 = S.text('bytes ÷ bytes per second', { x: 960, y: 690, size: 40, anchor: 'middle', weight: 700, color: 'bytes' });
  const clue2 = S.text('140 GB ÷ 4.8 TB/s = 29.2 ms', { x: 960, y: 752, size: 34, anchor: 'middle', weight: 650, family: 'mono', color: 'bytes' });
  S.set([clue1, clue2], { autoAlpha: 0 }, 0);
  S.add(gsap.set(clue1, { autoAlpha: 1 }), 'b2~clue');
  S.add(ch05Wipe(S, clue1, { d: 0.7 }), 'b2~clue');
  S.add(gsap.set(clue2, { autoAlpha: 1 }), T('b2~clue') + 0.6);
  S.add(ch05Wipe(S, clue2, { d: 0.8 }), T('b2~clue') + 0.6);
  // one soft fade to coral, never a sweep
  S.add(gsap.to(coral, { autoAlpha: 1, duration: 1.2, ease: 'power1.inOut' }), 'b2~memory-0.1');

  // ---------------------------------------------------------------- b3: the memory wall; what fills it; two numbers off the spec sheet
  const B3 = T('b3~already') - 0.1;
  S.add(fx.out([clue1, clue2, sliver.tagG], { d: 0.4, stagger: 0 }), B3);
  S.add(fx.swap(rLbl, 'the memory wall, 99%'), 'b3~memory-0.05');
  S.add(gsap.fromTo(coral, { filter: 'none' }, { filter: 'url(#glow-bytes)', duration: 0.4, yoyo: true, repeat: 1, immediateRender: false }), 'b3~wall');
  const qTag = S.g();
  const QX = 1460, QY = Y - H / 2 - 54;
  S.rect({ x: QX - 70, y: QY - 30, w: 140, h: 60, r: 14, fill: '#0c1326', stroke: 'bytes', sw: 2.5 }, qTag);
  S.rect({ x: QX - 56, y: QY - 18, w: 60, h: 36, r: 6, stroke: 'bytes', sw: 2, dash: '5 4' }, qTag);
  S.text('?', { x: QX + 34, y: QY + 2, size: 40, anchor: 'middle', weight: 800, color: 'bytes' }, qTag);
  S.line({ x1: QX, y1: QY + 30, x2: QX, y2: Y - H / 2 - 4, stroke: 'bytes', sw: 2 }, qTag);
  const qSub = S.text('what fills it: next chapter', { x: QX, y: Y + H / 2 + 40, size: 26, anchor: 'middle', weight: 600, color: 'bytes' });
  S.set([qTag, qSub], { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(qTag, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'bounce.out' }), 'b3~fills-0.1');
  S.add(fx.in(qSub, { from: 'up', d: 0.35, dist: 10 }), T('b3~fills') + 0.3);
  const TWO = T('b3~two') - 0.1;
  S.add(fx.out(qSub, { d: 0.3 }), TWO);
  S.add(gsap.to([aLbl, rLbl], { opacity: 0.3, duration: 0.4 }), TWO);
  const spec = S.g();
  const SP = { x: 700, y: 640, w: 520, h: 150 };
  S.rect({ x: SP.x, y: SP.y, w: SP.w, h: SP.h, r: 20, fill: '#0c1326', filter: 'url(#shadow)' }, spec);
  S.rect({ x: SP.x, y: SP.y, w: SP.w, h: SP.h, r: 20, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.25, sw: 2 }, spec);
  S.icon('ph:file-text-duotone', { x: SP.x + 40, y: SP.y + 36, size: 32, color: 'muted' }, spec);
  S.text('chip spec sheet', { x: SP.x + 68, y: SP.y + 37, size: 24, weight: 600, color: 'muted' }, spec);
  S.text('operations per second', { x: SP.x + 32, y: SP.y + 82, size: 30, weight: 700, color: 'compute' }, spec);
  S.text('bytes per second', { x: SP.x + 32, y: SP.y + 124, size: 30, weight: 700, color: 'bytes' }, spec);
  S.set(spec, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(spec, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }), TWO + 0.6);
  // the whole gap: one brace over the full bar, one arrow from the card
  const BRY = QY - 44;                                     // above the '?' tag
  const brace = ignore(S.path({ d: `M${X0},${BRY + 14} l0,-14 L${X0 + BW},${BRY} l0,14 M${X0 + BW / 2},${BRY} l0,-12`, stroke: 'ink', sw: 2.5 }));
  const arrow = S.arrow({ x1: SP.x + SP.w + 10, y1: SP.y + 60, x2: X0 + BW + 24, y2: BRY + 4, bend: 120, color: 'ink', sw: 2.5, head: 14 });
  ignore(arrow);
  S.set([brace, arrow.line, arrow.head], { autoAlpha: 0 }, 0);
  const GAP = T('b3~whole') - 0.1;
  S.add(gsap.set(brace, { autoAlpha: 1 }), GAP);
  S.add(fx.draw(brace, { d: 0.6 }), GAP);
  S.add(gsap.set(arrow.line, { autoAlpha: 1 }), GAP + 0.4);
  S.add(fx.drawArrow(arrow, { d: 0.6 }), GAP + 0.4);
  const any = S.text('any model, any chip', { x: 1540, y: 700, size: 30, anchor: 'middle', weight: 700, color: 'ink' });
  S.set(any, { autoAlpha: 0 }, 0);
  S.add(fx.in(any, { from: 'fade', d: 0.35 }), 'b3~any');

  // ---------------------------------------------------------------- b4: the thesis; shrink the coral part
  const B4 = T('b4') - 0.15;
  S.add(fx.out([spec, brace, arrow, any, qTag, aLbl, rLbl, sw], { d: 0.45, stagger: 0 }), B4);
  const SH = T('b4~shrink') - 0.4, SHR = 0.94;
  const press = [-26, 0, 26].map(dy => {
    const a = S.arrow({ x1: X0 + BW + 120, y1: Y + dy, x2: X0 + BW + 18, y2: Y + dy, color: 'helps', sw: 4, head: 14 });
    ignore(a);
    S.set([a.line, a.head], { autoAlpha: 0 }, 0);
    return a;
  });
  press.forEach((a, i) => { S.add(gsap.set(a.line, { autoAlpha: 1 }), SH + i * 0.08); S.add(fx.drawArrow(a, { d: 0.35 }), SH + i * 0.08); });
  const newW = (BW - SL - 2) * SHR, dx = (BW - SL - 2) - newW;
  S.add(gsap.to([coral, rest], { attr: { width: newW }, duration: 0.8, ease: 'power2.inOut' }), SH + 0.4);
  press.forEach(a => S.add(gsap.to(a, { x: -dx, duration: 0.8, ease: 'power2.inOut' }), SH + 0.4));
  const shrink = S.text('shrink this', { x: X0 + BW - 260, y: Y - H / 2 - 40, size: 40, anchor: 'middle', weight: 700, color: 'helps' });
  S.set(shrink, { autoAlpha: 0 }, 0);
  S.add(fx.in(shrink, { from: 'up', d: 0.45, dist: 12 }), SH + 0.3);
});
