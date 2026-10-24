/* ch05_s03 · a count and a rate (fig 35)
   10¹¹ operations is a count (how many a job needs, no time in it); 10¹⁵ operations a second is a rate
   (time built in). Written almost the same: FLOP for the count, FLOPS for the rate. Checking the units
   catches the confusion. Count ÷ rate = time, like 300 km ÷ 100 km/h = 3 h: the whole calculation ahead. */
V.scene('ch05_s03', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const LC = 480, RC = 1440;

  // ---------------------------------------------------------------- b1: the two amber pills from the table fly apart and become the counters
  const divider = ignore(S.line({ x1: 960, y1: 170, x2: 960, y2: 760, stroke: '#ffffff', strokeOpacity: 0.14, sw: 2 }));
  S.set(divider, { autoAlpha: 0 }, 0);
  S.add(gsap.to(divider, { autoAlpha: 1, duration: 0.5 }), 0.5);
  const pill = (e, y) => {
    const g = S.g();
    S.rect({ x: 880, y: y - 32, w: 160, h: 64, r: 18, fill: '#0c1326' }, g);
    S.rect({ x: 880, y: y - 32, w: 160, h: 64, r: 18, fill: 'url(#card-compute)', stroke: 'compute', sw: 2 }, g);
    ch05Pow(S, e, { x: 960, y: y + 2, size: 40, tone: 'ink', family: 'mono' }, g);
    return g;
  };
  const p11 = pill(11, 440), p15 = pill(15, 540);
  S.add(gsap.to(p11, { x: LC - 960 - 120, y: 290 - 440, autoAlpha: 0, duration: 0.8, ease: 'power3.inOut' }), 0.6);
  S.add(gsap.to(p15, { x: RC - 960 - 170, y: 290 - 540, autoAlpha: 0, duration: 0.8, ease: 'power3.inOut' }), 0.7);
  const title = (t, x) => S.text(t, { x, y: 206, size: 44, anchor: 'middle', weight: 700, family: 'display', color: 'ink' });
  const tL = title('A count', LC), tR = title('A rate', RC);
  const counter = (e, unit, x) => {
    const outer = S.g(), g = S.g(null, outer);           // outer: fades; inner: placed with xset
    const pw = ch05Pow(S, e, { x: 0, y: 290, size: 48, anchor: 'start', tone: 'compute', family: 'mono' }, g);
    S.text(unit, { x: pw.r + 14, y: 292, size: 32, weight: 650, color: 'compute' }, g);
    const w = pw.r + 14 + S.measure(unit, { size: 32, weight: 650 });
    S.xset(g, { x: x - w / 2 });
    return outer;
  };
  const cL = counter(11, 'operations', LC), cR = counter(15, 'operations / second', RC);
  S.set([tL, cL, tR, cR], { autoAlpha: 0 }, 0);
  S.add(fx.in(tL, { from: 'up', d: 0.4, dist: 10 }), 0.9);
  S.add(fx.in(cL, { from: 'fade', d: 0.4 }), 1.2);
  // the count: a stack of tiny operation chips, the token on top, no clock
  const stack = S.g();
  const chips = Array.from({ length: 14 }, (_, k) => S.rect({ x: LC - 34, y: 640 - k * 14, w: 68, h: 10, r: 3, fill: 'compute', fillOpacity: 0.85 }, stack));
  ignore(stack);
  S.set(chips, { autoAlpha: 0 }, 0);
  chips.forEach((c, k) => S.add(gsap.fromTo(c, { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: 0.18, immediateRender: false }), T('b1~count') + k * 0.12));
  const tok = ch05Token(S, { x: LC, y: 640 - 14 * 14 - 18, size: 26, hidden: true });
  S.add(tok.pop({ d: 0.4 }), T('b1~count') + 14 * 0.12);
  const noClock = S.g();
  S.icon('ph:timer-duotone', { x: LC + 150, y: 560, size: 60, color: 'muted' }, noClock);
  const strike = S.line({ x1: LC + 118, y1: 592, x2: LC + 182, y2: 528, stroke: 'bytes', sw: 4, cap: 'round' }, noClock);
  ignore(noClock);
  S.set([noClock, strike], { autoAlpha: 0 }, 0);
  S.add(fx.in(noClock, { from: 'fade', d: 0.3 }), T('b1~job'));
  S.add(gsap.set(strike, { autoAlpha: 1 }), 'b1~no');
  S.add(fx.draw(strike, { d: 0.3 }), 'b1~no');
  const subL = S.text('no time in it', { x: LC, y: 712, size: 28, anchor: 'middle', weight: 600, color: 'muted' });
  S.set(subL, { autoAlpha: 0 }, 0);
  S.add(fx.in(subL, { from: 'up', d: 0.35, dist: 10 }), 'b1~time');
  // the rate: a chip pours operations down a pipe at a steady speed, past a stopwatch
  const RATE = T('b1~Ten#2') - 0.1;
  S.add(fx.in(tR, { from: 'up', d: 0.4, dist: 10 }), RATE);
  S.add(fx.in(cR, { from: 'fade', d: 0.4 }), RATE + 0.3);
  const chip = libChip(S, { x: 1080, y: 520, size: 70, state: 'busy' });
  const pipe = ignore(S.rect({ x: 1130, y: 504, w: 680, h: 32, r: 16, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.2, sw: 2 }));
  const sw = libStopwatch(S, { x: 1520, y: 420, size: 90, span: 1000, readout: 'none', tone: 'compute' });
  S.set([chip, pipe, sw], { autoAlpha: 0 }, 0);
  S.add(fx.in([chip, pipe, sw], { from: 'fade', d: 0.4, stagger: 0.12 }), 'b1~rate-0.2');
  const pour = S.flow({ d: 'M1140,520 L1800,520', from: T('b1~rate'), to: 'end', speed: 300, every: 0.08, size: 7, color: 'compute' });
  S.add(sw.run(0, 6000, { d: T('b4') - T('b1~rate'), ease: 'none', press: false }), 'b1~rate');
  const subR = S.text('time is built in', { x: RC, y: 712, size: 28, anchor: 'middle', weight: 600, color: 'muted' });
  S.set(subR, { autoAlpha: 0 }, 0);
  S.add(fx.in(subR, { from: 'up', d: 0.35, dist: 10 }), 'b1~built');

  // ---------------------------------------------------------------- b2: FLOP for the count, FLOPS for the rate
  S.add(gsap.to([subL, subR, stack, tok, noClock, chip, pipe, sw], { opacity: 0.25, duration: 0.4 }), 'b2');
  const wF = S.text('FLOP', { x: LC, y: 850, size: 80, anchor: 'middle', weight: 800, family: 'display', color: 'ink' });
  const wFS = S.text([{ t: 'FLOP', c: 'ink' }, { t: 'S', c: 'compute' }], { x: RC, y: 850, size: 80, anchor: 'middle', weight: 800, family: 'display' });
  const sCap = S.text('S = per second', { x: RC, y: 912, size: 26, anchor: 'middle', weight: 650, color: 'compute' });
  S.set([wF, wFS, sCap], { autoAlpha: 0 }, 0);
  S.add(fx.in(wF, { from: 'up', d: 0.4, dist: 14 }), 'b2~Flop');
  S.add(fx.in(wFS, { from: 'up', d: 0.4, dist: 14 }), 'b2~flops');
  S.add(fx.in(sCap, { from: 'fade', d: 0.35 }), T('b2~flops') + 0.35);

  // ---------------------------------------------------------------- b3: confusing the two; checking the units
  const CF = T('b3~Confusing') - 0.05;
  S.add(fx.out(sCap, { d: 0.25 }), CF);
  S.add(gsap.to(wF, { x: 960 - LC - 60, duration: 0.45, ease: 'power2.in' }), CF);
  S.add(gsap.to(wFS, { x: 960 - RC + 60, duration: 0.45, ease: 'power2.in' }), CF);
  S.add(gsap.fromTo([wF, wFS], { opacity: 1 }, { opacity: 0.35, duration: 0.12, yoyo: true, repeat: 3, immediateRender: false }), CF + 0.45);
  S.add(gsap.to([wF, wFS], { x: 0, duration: 0.4, ease: 'back.out(2)' }), CF + 0.95);
  S.call(() => [wF, wFS].forEach(w => w.setAttribute('data-audit', 'ignore')), CF);
  S.call(() => [wF, wFS].forEach(w => w.removeAttribute('data-audit')), CF + 1.4);
  // the sentence card, and its correction
  const CY = 980;
  const cardO = S.g(), card = S.g(null, cardO);       // cardO: slides and fades; card: placed with xset
  const mkLine = (suffix, tone) => {
    const g = S.g(null, card);
    const pre = 'this chip does ';
    const a = S.text(pre, { x: 0, y: CY + 1, size: 30, weight: 600, color: 'ink' }, g);
    const pw = ch05Pow(S, 15, { x: S.measure(pre, { size: 30, weight: 600 }), y: CY + 1, size: 34, anchor: 'start', tone: 'ink', family: 'sans' }, g);
    const b = S.text(suffix, { x: pw.r + 12, y: CY + 1, size: 30, weight: 700, color: tone }, g);
    g.w = pw.r + 12 + S.measure(suffix, { size: 30, weight: 700 });
    g.sufX = pw.r + 12;
    return g;
  };
  const wrong = mkLine('FLOP', 'muted'), right = mkLine('FLOPS', 'helps');
  const CW = right.w + 60;
  S.rect({ x: -30, y: CY - 34, w: CW, h: 68, r: 16, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.25, sw: 2 }, card);
  card.insertBefore(card.lastChild, card.firstChild);
  S.xset(card, { x: 960 - CW / 2 + 30 });
  S.set(right, { autoAlpha: 0 }, 0);
  S.set(cardO, { autoAlpha: 0 }, 0);
  const CK = T('b3~checking') - 0.15;
  S.add(gsap.fromTo(cardO, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out' }), CK);
  const mag = S.icon('ph:magnifying-glass-duotone', { x: 0, y: CY - 4, size: 58, color: 'helps' });
  ignore(mag);
  S.set(mag, { autoAlpha: 0 }, 0);
  const mx0 = 960 - CW / 2 + 30, mx1 = mx0 + wrong.sufX + 80;
  S.add(gsap.fromTo(mag, { autoAlpha: 1, x: mx0 }, { x: mx1, duration: 0.6, ease: 'power1.inOut', immediateRender: false }), CK + 0.3);
  const gap = ignore(S.rect({ x: mx0 + wrong.sufX + 80, y: CY - 22, w: 24, h: 44, r: 6, fill: 'helps', fillOpacity: 0.35 }));
  S.set(gap, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(gap, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, yoyo: true, repeat: 1, immediateRender: false }), CK + 0.9);
  S.add(gsap.to(wrong, { autoAlpha: 0, duration: 0.25 }), CK + 1.25);
  S.add(gsap.to(right, { autoAlpha: 1, duration: 0.25 }), CK + 1.25);
  S.add(gsap.to(mag, { autoAlpha: 0, duration: 0.2 }), CK + 1.25);
  const ok = S.g();
  S.circle({ x: 960 + CW / 2 + 40, y: CY, r: 20, fill: '#0c1326' }, ok);
  S.icon('ph:check-circle-duotone', { x: 960 + CW / 2 + 40, y: CY, size: 44, color: 'helps' }, ok);
  S.set(ok, { autoAlpha: 0 }, 0);
  S.add(fx.pop(ok, { d: 0.4 }), CK + 1.45);

  // ---------------------------------------------------------------- b4: count ÷ rate = time; like distance ÷ speed
  const B4 = T('b4') - 0.1;
  S.add(fx.out([cardO, ok, wF, wFS], { d: 0.35, stagger: 0 }), B4);
  S.add(gsap.to([subL, subR, stack, tok, noClock, chip, pipe, sw, divider, pour], { autoAlpha: 0, duration: 0.4 }), B4);
  S.add(gsap.to([cL, cR], { opacity: 0.25, duration: 0.4 }), B4);
  const EY = 520;
  const eq = S.equation([{ t: 'count', tone: 'compute' }, { t: '÷', tone: 'muted' }, { t: 'rate', tone: 'compute' }, { t: '=', tone: 'muted' }, { t: 'time', tone: 'ink' }], { x: 960, y: EY, size: 72 });
  S.set(eq.parts, { autoAlpha: 0 }, 0);
  // the two titles fly to the centre and become 'count' and 'rate'
  S.add(gsap.to(tL, { x: eq.parts[0].cx - LC, y: EY - 206, autoAlpha: 0, duration: 0.6, ease: 'power3.inOut' }), B4 + 0.2);
  S.add(gsap.to(tR, { x: eq.parts[2].cx - RC, y: EY - 206, autoAlpha: 0, duration: 0.6, ease: 'power3.inOut' }), B4 + 0.3);
  S.add(fx.in([eq.parts[0], eq.parts[2]], { from: 'fade', d: 0.3, stagger: 0.1 }), B4 + 0.6);
  S.add(fx.in([eq.parts[1], eq.parts[3], eq.parts[4]], { from: 'up', d: 0.35, dist: 12, stagger: 0.12 }), 'b4~rate');
  S.call(() => [tL, tR].forEach(t => t.setAttribute('data-audit', 'ignore')), B4);
  const car = S.g();
  S.icon('ph:car-duotone', { x: 690, y: EY + 112, size: 48, color: 'muted' }, car);
  S.text('300 km ÷ 100 km/h = 3 h', { x: 730, y: EY + 114, size: 34, weight: 600, family: 'mono', color: 'muted' }, car);
  S.set(car, { autoAlpha: 0 }, 0);
  S.add(fx.in(car, { from: 'up', d: 0.4, dist: 12 }), 'b4~distance');
  const ENT = T('b4~entire') - 0.1;
  S.add(fx.out(car, { d: 0.35 }), ENT);
  const eq2 = S.equation([{ t: 'count', tone: 'compute' }, { t: '÷', tone: 'muted' }, { t: 'rate', tone: 'compute' }, { t: '=', tone: 'muted' }, { t: 'seconds', tone: 'ink' }], { x: 960, y: EY, size: 84 });
  S.set(eq2.parts, { autoAlpha: 0 }, 0);
  S.add(gsap.to(eq.parts, { autoAlpha: 0, duration: 0.35 }), ENT + 0.1);
  S.add(gsap.to(eq2.parts, { autoAlpha: 1, duration: 0.35 }), ENT + 0.1);
  S.add(gsap.fromTo(eq2.parts, { filter: 'none' }, { filter: 'url(#glow-compute)', duration: 0.5, yoyo: true, repeat: 1, immediateRender: false }), ENT + 0.5);
});
