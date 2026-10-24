/* ch02_s01 · one turn, thirty milliseconds (fig 11)
   One turn of the generate loop takes about 30 ms; laid end to end that is ~33 tokens a second,
   comfortably faster than anyone reads; and it can be derived from two numbers. */
V.scene('ch02_s01', S => {
  const { fx } = S;

  // ---------------------------------------------------------------- the loop panel, from the first frame
  const loopG = S.g();
  const L = ch02Loop(S, { parent: loopG, shown: 9 });
  const sw = libStopwatch(S, { x: 1440, y: 186, size: 140, text: '?', readout: 'right', label: '' });
  S.add(sw.in({ d: 0.5 }), 0.2);

  // b1: one turn, slowed down
  S.flow({ d: `M${L.boxes.text.r - 20},${L.BY} L${L.boxes.model.l + 20},${L.BY}`, from: 'b1~One', to: S.t('b1~One') + 0.9, speed: 400, every: 0.07, size: 6, color: 'struct' });
  L.lightTurn(S.t('b1~One') + 0.6, { stagger: 0.55, hold: 1.4 });
  S.add(sw.run(0, 30, { d: S.t('b1~thirty') - S.t('b1~One') }), 'b1~One');
  S.add(gsap.fromTo(L.title, { filter: 'none' }, { filter: 'url(#glow-struct)', duration: 0.4, yoyo: true, repeat: 1 }), 'b1~the generate');
  // the draw: ch01's spinner flickers at the left edge of 'one new token'
  const spin = S.g();
  const SP = { x: L.boxes.out.l + 42, y: L.BY };
  S.circle({ x: SP.x, y: SP.y, r: 22, fill: 'struct', fillOpacity: 0.9, stroke: '#0c1326', sw: 2 }, spin);
  S.path({ d: `M${SP.x},${SP.y} L${SP.x},${SP.y - 22} A22,22 0 0,0 ${SP.x - 22},${SP.y} Z`, fill: 'struct', fillOpacity: 0.45 }, spin);
  spin.setAttribute('data-audit', 'ignore');
  S.add(gsap.fromTo(spin, { autoAlpha: 0, rotation: 0, svgOrigin: `${SP.x} ${SP.y}` }, { autoAlpha: 1, rotation: 540, svgOrigin: `${SP.x} ${SP.y}`, duration: 0.7, ease: 'power2.out' }), 'b1~draw');
  S.add(gsap.to(spin, { autoAlpha: 0, duration: 0.3 }), S.t('b1~draw') + 0.8);
  // the new token
  const dot = L.pills[9];
  const dx0 = L.boxes.out.cx - L.slots[9].x, dy0 = L.BY - L.slots[9].y;
  S.add(gsap.fromTo(dot, { autoAlpha: 0, x: dx0, y: dy0, scale: 0.5, transformOrigin: '50% 50%' }, { autoAlpha: 1, x: dx0, y: dy0, scale: 1.3, duration: 0.3, ease: 'back.out(2)' }), 'b1~thirty');
  const slowed = S.text('slowed down', { x: 1532, y: 268, size: 24, color: 'muted', weight: 550 });
  const hund = S.text('= 0.03 s', { x: 1700, y: 268, size: 26, family: 'mono', color: 'muted', weight: 600 });
  S.add(fx.in(slowed, { from: 'up', d: 0.35 }), 'b1~thirty+0.2');
  S.add(fx.in(hund, { from: 'up', d: 0.35 }), 'b1~three');

  // ---------------------------------------------------------------- b2: thirty-three tokens a second
  // the '.' rides the return arrow and joins the row
  const ride = gsap.timeline();
  ride.to(dot, { scale: 1, y: L.RY - L.slots[9].y, duration: 0.25, ease: 'power1.in' })
    .to(dot, { x: 0, duration: 0.45, ease: 'none' })
    .to(dot, { y: 0, duration: 0.25, ease: 'power1.out' });
  S.add(ride, 'b2-0.3');
  // the panel parks in the top band, still turning slowly
  S.xset(loopG, { x: 0, y: 0, s: 1, ox: 960, oy: 550 });
  S.add(fx.xform(loopG, { y: 250 - 550, s: 0.55 }, { d: 0.9, ease: 'power3.inOut' }), 'b2+0.5');
  S.add(gsap.to(loopG, { opacity: 0.4, duration: 0.6 }), 'b2+0.7');
  for (let k = 0; k < 6; k++) L.lightTurn(S.t('b2') + 1.5 + k * 1.6);
  S.add(fx.out([slowed, hund], { d: 0.3 }), 'b2+0.5');
  loopG.setAttribute('data-audit', 'ignore');

  // the one-second ruler, 1,400 px = 1 s
  const R = { x0: 260, x1: 1660, y: 600 };
  const ruler = S.g();
  const rline = S.line({ x1: R.x0, y1: R.y, x2: R.x1, y2: R.y, stroke: 'muted', sw: 3 }, ruler);
  const ticks = [];
  for (let k = 0; k <= 10; k++) {
    const x = R.x0 + k * 140, major = k === 0 || k === 10;
    const tg = S.g(null, ruler);
    S.line({ x1: x, y1: R.y - (major ? 14 : 8), x2: x, y2: R.y + (major ? 14 : 8), stroke: 'muted', sw: major ? 3 : 2 }, tg);
    if (major) S.text(k ? '1 s' : '0', { x, y: R.y + 42, size: 26, anchor: 'middle', family: 'mono', color: 'muted' }, tg);
    ticks.push(tg);
  }
  S.add(fx.draw(rline, { d: 0.7 }), 'b2+0.6');
  S.add(fx.in(ticks, { from: 'fade', d: 0.25, stagger: 0.04 }), 'b2+0.9');
  const slow4 = S.text('slowed 4×', { x: R.x0, y: R.y + 84, size: 24, color: 'muted', weight: 550 });
  S.add(fx.in(slow4, { from: 'up', d: 0.35 }), 'b2+1.0');
  // one pill every 30 ms (42 px), on a 4× slower clock: every 0.12 s of screen time
  const P0 = S.t('b2~thirty-three');
  const pills = [];
  for (let k = 0; k < 33; k++) {
    const x = R.x0 + 21 + k * 42.4;
    const p = S.rect({ x: x - 17, y: R.y - 54, w: 34, h: 34, r: 9, fill: 'url(#card-struct)', stroke: 'struct', sw: 1.5 });
    S.add(gsap.fromTo(p, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: 'power2.out' }), P0 + k * 0.12);
    pills.push(p);
  }
  const counter = S.counter({ x: 1560, y: 470, size: 52, value: 0, anchor: 'end', color: 'struct', family: 'mono', weight: 650 });
  const cLbl = S.text('tokens in 1 s', { x: 1580, y: 474, size: 26, color: 'muted', weight: 550 });
  S.add(fx.in([counter, cLbl], { from: 'fade', d: 0.3 }), P0 - 0.1);
  S.add(fx.count(counter, 0, 33, { d: 33 * 0.12, ease: 'none', fmt: v => String(Math.round(v)) }), P0);

  // ch00's chat window, streaming on the same 4× clock
  const chat = libChatWindow(S, { x: 380, y: 690, w: 1160, h: 210, title: '', size: 26, question: 'Why is the sky blue?',
    answer: 'The sky looks blue because sunlight scatters off the air, and short blue wavelengths scatter most.', qy: 730, ay: 790, maxLines: 2 });
  S.add(chat.drawOn({ d: 0.5 }), 'b2+0.8');
  S.add(chat.stream({ count: 26, every: 0.12 }), P0);
  S.add(chat.glow(14, 20, { hold: 0.8 }), 'b2~as fast');

  // ---------------------------------------------------------------- b3: the target, comfortably faster than reading
  S.add(fx.out([slow4, chat], { d: 0.4 }), 'b3');
  const target = S.g();
  S.icon('ph:check-circle-duotone', { x: 1600, y: 410, size: 40, color: 'ink' }, target);
  S.text('the target', { x: 1628, y: 410, size: 28, color: 'ink', weight: 650 }, target);
  S.add(fx.in(target, { from: 'left', d: 0.4 }), 'b3~the target');
  const notArb = S.text('not arbitrary', { x: 960, y: 780, size: 32, anchor: 'middle', color: 'muted', weight: 600 });
  S.add(fx.in(notArb, { from: 'up', d: 0.4 }), 'b3~not');
  // a reader: one token every ≈ 160 ms = 224 px
  const reader = S.g();
  const eye = S.icon('ph:eye-duotone', { x: R.x0 - 50, y: R.y + 78, size: 40, color: 'muted' }, reader);
  const rTicks = [];
  for (let k = 0; k <= 6; k++) rTicks.push(S.line({ x1: R.x0 + k * 224, y1: R.y + 62, x2: R.x0 + k * 224, y2: R.y + 94, stroke: 'muted', sw: 5 }, reader));
  const rTag = S.text('a reader: ≈ 6 tokens/s', { x: R.x0, y: R.y + 124, size: 24, color: 'muted', weight: 550 }, reader);
  S.add(fx.in(eye, { from: 'fade', d: 0.3 }), 'b3~comfortably');
  rTicks.forEach((t, k) => S.add(gsap.fromTo(t, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }), S.t('b3~comfortably') + 0.1 + k * 0.18));
  S.add(fx.in(rTag, { from: 'left', d: 0.35 }), S.t('b3~comfortably') + 1.2);
  const rule = S.text('rule of thumb: comfortably faster than reading', { x: 960, y: 840, size: 30, anchor: 'middle', color: 'ink', weight: 600 });
  S.add(fx.in(rule, { from: 'up', d: 0.4 }), 'b3~faster');
  S.add(gsap.fromTo(counter, { filter: 'none' }, { filter: 'url(#glow-struct)', duration: 0.35, yoyo: true, repeat: 1 }), 'b3~anyone');

  // ---------------------------------------------------------------- b4: you will derive it
  const fadeAll = [ruler, ...pills, counter, cLbl, target, notArb, reader, rule];
  S.add(gsap.to(fadeAll, { autoAlpha: 0, duration: 0.5 }), 'b4');
  S.add(fx.xform(loopG, { x: -640, y: 610 - 550, s: 0.33 }, { d: 0.9, ease: 'power3.inOut' }), 'b4');
  S.add(gsap.to(loopG, { opacity: 0.3, duration: 0.5 }), 'b4');
  // the reading lifts off and becomes the stamp
  S.add(gsap.to(sw, { autoAlpha: 0, duration: 0.35 }), 'b4');
  const stamp = S.g();
  S.rect({ x: 960 - 260, y: 210, w: 520, h: 84, r: 20, fill: '#0c1326', stroke: 'ink', sw: 2, strokeOpacity: 0.6 }, stamp);
  S.text('≈ 30 ms per token', { x: 960, y: 253, size: 44, anchor: 'middle', family: 'mono', weight: 650, color: 'ink' }, stamp);
  const about = S.text('the number this film is about', { x: 960, y: 330, size: 26, anchor: 'middle', color: 'muted', weight: 550 });
  S.add(gsap.fromTo(stamp, { autoAlpha: 0, x: 560, y: -30, scale: 0.5, transformOrigin: '50% 50%' }, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.8, ease: 'power3.inOut' }), 'b4+0.1');
  S.add(fx.in(about, { from: 'up', d: 0.4 }), 'b4+0.7');
  const sheet = libSpecSheet(S, { x: 700, y: 390, w: 520, title: 'chip spec sheet', icon: 'doc', start: 'placeholder', rowStyle: 'inline', size: 26,
    rows: [null, { label: 'operations per second', value: '?', tone: 'compute' }, null, { label: 'bytes per second', value: '?', tone: 'bytes' }, null, null] });
  S.set(sheet, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(sheet, { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }), 'b4~derive');
  S.add(gsap.fromTo(L.boxes.model.bg, { attr: { 'stroke-width': 2.5 } }, { attr: { 'stroke-width': 9 }, duration: 0.35, yoyo: true, repeat: 1 }), "b4~the model's");
  S.add(gsap.to(loopG, { opacity: 0.8, duration: 0.3, yoyo: true, repeat: 1 }), "b4~the model's");
  S.add(sheet.brighten([1, 3]), 'b4~specification');
  S.add(sheet.reveal([1, 3]), S.t('b4~specification') + 0.5);
});
