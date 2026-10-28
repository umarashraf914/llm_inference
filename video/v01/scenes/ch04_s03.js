/* ch04_s03 · shifted, not stretched (fig 28)
   Two lanes on one time axis: 'made' (server) and 'seen' (your screen). Each token's trip down the open
   line is one slanted arrow of the same length: one-way 130 ÷ 2 = 65 ms. A token every 30 ms, so about
   65 / 30 ≈ 2 are in flight at once. The trip delays only the first word; reading the prompt in takes
   hundreds of ms (schematic). Held back to the end, a 500-token answer (500 × 30 ms = 15 s) shows
   nothing for 15 s. A constant delay shifts the stream without stretching it.
   One painter draws the lanes' contents from a view {L: ms at x = 300, k: px per ms} that is animated,
   so the pull-back (b4) and the switch to seconds (b5) are changes of view, not of drawing. */
V.scene('ch04_s03', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const XL = 300, XR = 1760, YM = 330, YS = 540, YG = 720, AXY = 840, PH = 36, TRIP = 65, STEP = 30, N = 13;

  // ---------------------------------------------------------------- the view, as a function of scene time
  const CLOSE = { L: -20, k: 3.2 }, BACK = { L: -320, k: 1.8 }, SECS = { L: -500, k: 0.0875 };
  const PB = T('b4~Reading') - 0.05, HB = T('b5') - 0.1, RET = T('b6~shifts') - 0.25;
  const KEYS = [[0, CLOSE], [PB, CLOSE], [PB + 1.0, BACK], [HB, BACK], [HB + 1.0, SECS], [RET, SECS], [RET + 1.0, CLOSE]];
  const ease = u => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const viewAt = t => {
    for (let i = 1; i < KEYS.length; i++) {
      const [t0, a] = KEYS[i - 1], [t1, b] = KEYS[i];
      if (t <= t1) {
        if (t1 === t0 || t <= t0) return a;
        const u = ease((t - t0) / (t1 - t0));
        // interpolate the left edge and the log of the scale, so a big rescale reads as one smooth zoom
        return { L: a.L + (b.L - a.L) * u, k: Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * u) };
      }
    }
    return KEYS[KEYS.length - 1][1];
  };

  // ---------------------------------------------------------------- the lanes, their icons and the axis
  const laneG = S.g();
  [YM, YS].forEach(y => S.line({ x1: XL, y1: y, x2: XR, y2: y, stroke: '#ffffff', strokeOpacity: 0.14, sw: 2 }, laneG));
  libServer(S, { x: 200, y: YM, w: 110, detail: 'min', seed: 3 }, laneG);
  libDevice(S, { x: 200, y: YS, w: 104 }, laneG);
  const madeL = S.text('made', { x: XL, y: YM - 44, size: 28, weight: 650, color: 'ink' });
  const seenL = S.text('seen', { x: XL, y: YS - 44, size: 28, weight: 650, color: 'ink' });
  S.set([laneG, madeL, seenL], { autoAlpha: 0 }, 0);
  S.add(fx.in([laneG, madeL, seenL], { from: 'fade', d: 0.6, stagger: 0.1 }), 0.15);
  const axis = S.g();
  S.line({ x1: XL, y1: AXY, x2: XR, y2: AXY, stroke: 'muted', sw: 2 }, axis);
  const msTicks = [], sTicks = [];
  for (let ms = -300; ms <= 400; ms += 50) {
    const g = S.g(null, axis);
    g.l = S.line({ x1: 0, y1: AXY, x2: 0, y2: AXY + 8, stroke: 'muted', sw: 2 }, g);
    g.t = ms >= 0 ? S.text(ms === 400 ? '400 ms' : String(ms), { x: 0, y: AXY + 30, size: 22, anchor: 'middle', weight: 550, color: 'muted' }, g) : null;
    g.ms = ms; msTicks.push(g);
  }
  for (let s = 0; s <= 16; s += 2) {
    const g = S.g(null, axis);
    g.l = S.line({ x1: 0, y1: AXY, x2: 0, y2: AXY + 8, stroke: 'muted', sw: 2 }, g);
    g.t = S.text(s === 16 ? '16 s' : String(s), { x: 0, y: AXY + 30, size: 22, anchor: 'middle', weight: 550, color: 'muted' }, g);
    g.ms = s * 1000; sTicks.push(g);
  }
  S.set(axis, { autoAlpha: 0 }, 0);
  S.add(fx.in(axis, { from: 'fade', d: 0.5 }), 0.4);

  // ---------------------------------------------------------------- the tokens: a made pill, an arrow, a seen pill each
  const MADE = [T('b1~made') - 0.05].concat(Array.from({ length: N - 1 }, (_, i) => T('b3~token') + 0.05 + i * 0.2));
  const ARR = MADE.map((t, k) => (k === 0 ? [T('b1~onto') - 0.1, 1.3] : [t + 0.05, 0.3]));
  const SEEN = MADE.map((t, k) => (k === 0 ? T('b1~Sixty-five') - 0.05 : ARR[k][0] + ARR[k][1]));
  const toks = MADE.map((_, k) => {
    const mk = (y) => {
      const g = S.g();
      g.base = S.rect({ x: 0, y: y - PH / 2, w: 90, h: PH, r: 10, fill: '#0c1326' }, g);
      g.body = S.rect({ x: 0, y: y - PH / 2, w: 90, h: PH, r: 10, fill: 'url(#card-struct)', stroke: 'struct', sw: 2 }, g);
      if (k === 0) g.lbl = S.text('Sunny', { x: 0, y: y + 1, size: 22, anchor: 'middle', weight: 600, color: 'ink' }, g);
      return g;
    };
    const arr = ignore(S.g());
    const line = S.path({ d: 'M0,0', stroke: 'helps', sw: 3 }, arr);
    const head = S.path({ d: 'M0,0', fill: 'helps' }, arr);
    return { made: mk(YM), seen: mk(YS), arr, line, head };
  });
  const tickT = S.g(), tick65 = S.g();
  const tickTl = S.line({ x1: 0, y1: YM + 24, x2: 0, y2: YM + 40, stroke: 'ink', sw: 2 }, tickT);
  const tickTt = S.text('t', { x: 0, y: YM + 62, size: 26, anchor: 'middle', weight: 650, color: 'ink' }, tickT);
  const tick65l = S.line({ x1: 0, y1: YS + 24, x2: 0, y2: YS + 40, stroke: 'ink', sw: 2 }, tick65);
  const tick65t = S.text('t + 65 ms', { x: 0, y: YS + 62, size: 26, anchor: 'middle', weight: 650, color: 'ink' }, tick65);
  S.set([tickT, tick65], { autoAlpha: 0 }, 0);
  S.add(fx.in(tickT, { from: 'fade', d: 0.3 }), MADE[0] + 0.2);
  S.add(fx.in(tick65, { from: 'fade', d: 0.3 }), SEEN[0] + 0.2);

  // ---------------------------------------------------------------- b1: one token, made then seen 65 ms later
  const AX0 = XL + (0 - CLOSE.L) * CLOSE.k + 41;          // the first arrow's start, in the close-up view
  const flight = S.text('in flight, not held back', { x: AX0 + 150, y: 418, size: 26, weight: 650, color: 'helps' });
  const oneWay = S.text('one one-way trip: 130 ÷ 2 = 65 ms', { x: AX0 + 150, y: 456, size: 26, weight: 600, color: 'ink' });
  S.set([flight, oneWay], { autoAlpha: 0 }, 0);
  S.add(fx.in(flight, { from: 'left', d: 0.35, dist: 10 }), ARR[0][0] + 0.3);
  S.add(fx.in(oneWay, { from: 'left', d: 0.35, dist: 10 }), 'b1~half');

  // ---------------------------------------------------------------- b2: one moment; nothing waits for the answer to finish
  S.add(fx.out([flight, oneWay], { d: 0.35 }), 'b2-0.2');
  S.add(fx.pulse([tickT, tick65], { scale: 1.15, d: 0.5 }), 'b2~one');
  const oneEv = S.text('made and shown: one event', { x: AX0 + 150, y: 436, size: 30, weight: 650, color: 'ink' });
  S.set(oneEv, { autoAlpha: 0 }, 0);
  S.add(fx.in(oneEv, { from: 'up', d: 0.35, dist: 10 }), 'b2~one');
  S.add(fx.out(oneEv, { d: 0.3 }), 'b2~Nothing-0.25');
  const ghost = S.g();
  const GX0 = 860, GX1 = 1700;
  S.rect({ x: GX0, y: YM - PH / 2, w: GX1 - GX0, h: PH, r: 10, fill: '#0c1326', stroke: 'muted', sw: 2, dash: '7 6' }, ghost);
  S.text('answer complete', { x: (GX0 + GX1) / 2, y: YM + 1, size: 26, anchor: 'middle', weight: 600, color: 'muted' }, ghost);
  S.rect({ x: GX0, y: YS - PH / 2, w: GX1 - GX0, h: PH, r: 10, stroke: 'muted', strokeOpacity: 0.6, sw: 2, dash: '3 7' }, ghost);
  const never = S.text('never happens', { x: (GX0 + GX1) / 2, y: (YM + YS) / 2 + 1, size: 30, anchor: 'middle', weight: 700, color: 'muted' }, ghost);
  S.set(ghost, { autoAlpha: 0 }, 0);
  const NW = T('b2~Nothing') - 0.1;
  S.add(gsap.fromTo(ghost, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, yoyo: true, repeat: 1, repeatDelay: 0.1 }), NW);
  S.add(gsap.to(ghost, { autoAlpha: 1, duration: 0.1 }), NW + 0.45);
  const gx = ch04Cross(S, { x: GX0, y: YM - 30, w: GX1 - GX0, h: YS - YM + 60, inset: 0.05, sw: 6 });
  S.add(gx.draw({ d: 0.45 }), NW + 0.55);
  S.add(fx.out([ghost, gx], { d: 0.35, stagger: 0 }), T('b2~finish') + 0.2);
  const exc = S.pill('exception: non-streaming', { x: 1640, y: 200, h: 40, size: 22, tone: 'neutral', style: 'outline' });
  S.set(exc, { autoAlpha: 0 }, 0);
  S.add(fx.in(exc, { from: 'fade', d: 0.3 }), T('b2~finish') + 0.2);
  S.add(fx.out(exc, { d: 0.3 }), T('b3') + 0.2);

  // ---------------------------------------------------------------- b3: a token every 30 ms; every trip the same length
  const cap = S.text('each arrow: one trip, same length', { x: 1040, y: 220, size: 30, anchor: 'middle', weight: 650, color: 'helps' });
  S.set(cap, { autoAlpha: 0 }, 0);
  S.add(fx.in(cap, { from: 'up', d: 0.35, dist: 10 }), 'b3~same-0.1');
  // the 30 ms brackets, top and bottom, between neighbouring tokens (close-up view: 30 ms = 105 px)
  const xC = ms => XL + (ms - CLOSE.L) * CLOSE.k, HW = Math.min(90, STEP * CLOSE.k * 0.86) / 2;
  const brk = (y, up) => S.bracket({ x1: xC(5 * STEP) + HW, x2: xC(6 * STEP) + HW, y: up ? y - PH / 2 - 6 : y + PH / 2 + 6, up, label: '30 ms', tone: 'ink', size: 24 });
  const brTop = brk(YM, true), brBot = brk(YS + TRIP * CLOSE.k, false);
  // the bottom bracket sits under the same two tokens as they land, shifted right by the trip
  S.xset(brBot, { x: 0, y: 0, s: 1 });
  S.set([brTop, brBot], { autoAlpha: 0 }, 0);
  const brBotFix = S.bracket({ x1: xC(5 * STEP + TRIP) + HW, x2: xC(6 * STEP + TRIP) + HW, y: YS + PH / 2 + 6, up: false, label: '30 ms', tone: 'ink', size: 24 });
  S.set(brBotFix, { autoAlpha: 0 }, 0);
  const PACE = T('b3~exactly') - 0.1;
  S.add(fx.in([brTop, brBotFix], { from: 'fade', d: 0.3, stagger: 0 }), PACE);
  S.add(fx.pulse([brTop, brBotFix], { scale: 1.12, d: 0.45 }), PACE + 0.3);
  S.add(fx.out([brTop, brBotFix], { d: 0.3, stagger: 0 }), PACE + 1.1);
  const SW0 = T('b3~model') - 0.4, SWD = 1.3;
  const sweep = ignore(S.rect({ x: 0, y: YM - 40, w: 6, h: YS - YM + 80, r: 3, fill: 'ink', fillOpacity: 0.5 }));
  S.set(sweep, { autoAlpha: 0 }, 0);
  S.add(gsap.to(sweep, { autoAlpha: 1, duration: 0.2 }), SW0);
  S.add(gsap.to(sweep, { autoAlpha: 0, duration: 0.25 }), SW0 + SWD);
  const inFl = S.text('≈ 2 in flight (65 / 30)', { x: 1040, y: 220, size: 30, anchor: 'middle', weight: 650, color: 'ink' });
  S.set(inFl, { autoAlpha: 0 }, 0);
  S.add(fx.out(cap, { d: 0.25 }), SW0);
  S.add(fx.in(inFl, { from: 'up', d: 0.35, dist: 10 }), SW0 + 0.15);

  // ---------------------------------------------------------------- b4: the trip delays only the first word; reading the prompt in takes hundreds
  const FW = T('b4~first') - 0.1;
  S.add(fx.out(inFl, { d: 0.3 }), 'b4-0.2');
  const tripLbl = S.text('trip: tens of ms, once', { x: AX0 + 150, y: 436, size: 28, weight: 650, color: 'helps' });
  S.set(tripLbl, { autoAlpha: 0 }, 0);
  S.add(fx.in(tripLbl, { from: 'left', d: 0.35, dist: 10 }), FW + 0.1);
  S.add(fx.out(tripLbl, { d: 0.3 }), PB - 0.3);
  S.add(fx.out([madeL, seenL], { d: 0.3 }), PB - 0.3);
  S.add(gsap.to([tickTt, tick65], { autoAlpha: 0, duration: 0.25 }), PB - 0.3);
  const xB = ms => XL + (ms - BACK.L) * BACK.k;
  const amber = S.rect({ x: 0, y: YM - PH / 2, w: 0, h: PH, r: 8, fill: 'url(#bar-compute)', stroke: 'compute', sw: 2 });
  const amberL = S.text('reading the prompt in: hundreds of ms', { x: (xB(-250) + xB(-8)) / 2, y: YM - 46, size: 26, anchor: 'middle', weight: 650, color: 'compute' });
  const reqL = S.text('request arrives', { x: xB(-250), y: YM + 62, size: 26, anchor: 'middle', weight: 600, color: 'ink' });
  const firstL = S.text('first token made', { x: xB(0) + 30, y: YM + 62, size: 26, anchor: 'start', weight: 600, color: 'ink' });
  const reqTick = S.line({ x1: xB(-250), y1: YM + 24, x2: xB(-250), y2: YM + 40, stroke: 'ink', sw: 2 });
  const schem = S.pill('schematic lengths', { x: 1640, y: 200, h: 40, size: 22, tone: 'neutral', style: 'outline' });
  S.set([amber, amberL, reqL, firstL, reqTick, schem], { autoAlpha: 0 }, 0);
  S.add(gsap.to(amber, { autoAlpha: 1, duration: 0.3 }), PB + 0.8);
  S.add(fx.in([amberL, reqL, firstL, reqTick], { from: 'fade', d: 0.35, stagger: 0.1 }), PB + 1.0);
  S.add(fx.in(schem, { from: 'fade', d: 0.3 }), PB + 1.2);
  S.call(() => toks.forEach(o => [o.made, o.seen].forEach(g => g.lbl && g.setAttribute('data-audit', 'ignore'))), PB);

  // ---------------------------------------------------------------- b5: held back, the answer shows nothing for 15 s, then all at once
  S.add(fx.out([amber, amberL, reqL, firstL, reqTick, schem], { d: 0.35, stagger: 0 }), HB - 0.1);
  S.add(fx.in([madeL, seenL], { from: 'fade', d: 0.35 }), HB + 0.6);
  const gl = S.g();
  S.line({ x1: XL, y1: YG, x2: XR, y2: YG, stroke: '#ffffff', strokeOpacity: 0.14, sw: 2, dash: '8 8' }, gl);
  libDevice(S, { x: 200, y: YG, w: 104 }, gl).setAttribute('opacity', 0.5);
  const glL = S.text('seen, if held back', { x: XL, y: YG - 44, size: 28, weight: 650, color: 'muted' }, gl);
  S.set(gl, { autoAlpha: 0 }, 0);
  S.add(fx.in(gl, { from: 'up', d: 0.45, dist: 14 }), HB + 0.7);
  const xS = ms => XL + (ms - SECS.L) * SECS.k;
  const bandM = S.rect({ x: xS(0), y: YM - 12, w: 0, h: 24, r: 4, fill: 'struct', fillOpacity: 0.9 });
  const bandS = S.rect({ x: xS(TRIP), y: YS - 12, w: 0, h: 24, r: 4, fill: 'struct', fillOpacity: 0.9 });
  S.set([bandM, bandS], { autoAlpha: 0 }, 0);
  const RUN0 = HB + 1.1, RUN1 = T('b5~then') - 0.05;     // 15 s of tokens, played in this window
  S.add(gsap.set([bandM, bandS], { autoAlpha: 1 }), RUN0);
  S.add(gsap.to(bandM, { attr: { width: 15000 * SECS.k }, duration: RUN1 - RUN0, ease: 'none' }), RUN0);
  S.add(gsap.to(bandS, { attr: { width: 15000 * SECS.k }, duration: RUN1 - RUN0, ease: 'none' }), RUN0);
  const sw = libStopwatch(S, { x: 1020, y: 630, size: 96, span: 60000, unit: 's', readout: 'right', tone: 'neutral' });
  S.set(sw, { autoAlpha: 0 }, 0);
  S.add(gsap.to(sw, { autoAlpha: 1, duration: 0.3 }), RUN0 - 0.2);
  S.add(sw.run(0, 15000, { d: RUN1 - RUN0, ease: 'none' }), RUN0);
  // 'all at once': all 500 drop into the held-back lane together, at 15 s
  const dump = S.g();
  S.rect({ x: xS(15000), y: YG - 18, w: 70, h: 36, r: 8, fill: 'url(#card-struct)', stroke: 'struct', sw: 2 }, dump);
  S.text('all 500', { x: xS(15000) + 35, y: YG - 34, size: 24, anchor: 'middle', weight: 650, color: 'ink' }, dump);
  S.set(dump, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(dump, { autoAlpha: 0, y: -120 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'bounce.out' }), 'b5~all-0.1');
  const nothing = S.g();
  S.rect({ x: xS(0), y: YG - 18, w: 15000 * SECS.k - 4, h: 36, r: 6, fill: 'faint', fillOpacity: 0.35 }, nothing);
  S.text('15 s of nothing', { x: xS(7500), y: YG + 1, size: 25, anchor: 'middle', weight: 700, color: 'ink' }, nothing);
  S.set(nothing, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(nothing, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, yoyo: true, repeat: 2 }), 'b5~notice-0.3');

  // ---------------------------------------------------------------- b6: shifted, not stretched
  S.add(fx.out([gl, sw, dump, nothing, bandM, bandS], { d: 0.4, stagger: 0 }), RET - 0.2);
  const brTop2 = S.bracket({ x1: xC(5 * STEP) + HW, x2: xC(6 * STEP) + HW, y: YM - PH / 2 - 6, up: true, label: '30 ms', tone: 'ink', size: 24 });
  const brBot2 = S.bracket({ x1: xC(5 * STEP + TRIP) + HW, x2: xC(6 * STEP + TRIP) + HW, y: YS + PH / 2 + 6, up: false, label: '30 ms', tone: 'ink', size: 24 });
  S.set([brTop2, brBot2], { autoAlpha: 0 }, 0);
  S.add(fx.in([brTop2, brBot2], { from: 'fade', d: 0.3, stagger: 0 }), 'b6~stretching-0.1');
  S.add(fx.pulse([brTop2, brBot2], { scale: 1.12, d: 0.45 }), T('b6~stretching') + 0.25);
  const shifted = S.text('shifted, not stretched', { x: 1040, y: 220, size: 36, anchor: 'middle', weight: 700, family: 'display', color: 'ink' });
  S.set(shifted, { autoAlpha: 0 }, 0);
  S.add(fx.in(shifted, { from: 'up', d: 0.45, dist: 12 }), T('b6~stretching') + 0.3);
  S.call(() => toks.forEach(o => [o.made, o.seen].forEach(g => g.lbl && g.removeAttribute('data-audit'))), RET + 1.0);

  // ---------------------------------------------------------------- the painter: lay out every token, arrow and tick from the view
  const vis = (t, a, d = 0.2) => Math.max(0, Math.min(1, (t - a) / d));
  const paint = t => {
    const v = viewAt(t), X = ms => XL + (ms - v.L) * v.k;
    const pw = Math.max(4, Math.min(90, STEP * v.k * 0.86));
    const tokOn = t < HB + 0.4 || t > RET + 0.2;           // the close-up tokens hide in the seconds view
    const fadeTok = t < HB ? 1 : t < HB + 0.4 ? 1 - (t - HB) / 0.4 : t > RET + 0.2 ? Math.min(1, (t - RET - 0.2) / 0.5) : 0;
    toks.forEach((o, k) => {
      const m = X(k * STEP), s = X(k * STEP + TRIP);
      [[o.made, m, YM, vis(t, MADE[k])], [o.seen, s, YS, vis(t, SEEN[k])]].forEach(([g, x, y, a]) => {
        g.base.setAttribute('x', x.toFixed(2)); g.base.setAttribute('width', pw.toFixed(2));
        g.body.setAttribute('x', x.toFixed(2)); g.body.setAttribute('width', pw.toFixed(2));
        if (g.lbl) { g.lbl.setAttribute('x', (x + pw / 2).toFixed(2)); g.lbl.setAttribute('opacity', pw > 80 ? 1 : 0); }
        g.setAttribute('opacity', (tokOn ? a * fadeTok : 0).toFixed(3));
      });
      // the arrow from the made pill's centre to the seen pill's centre, drawn up to its progress
      const [a0, ad] = ARR[k], p = Math.max(0, Math.min(1, (t - a0) / ad));
      const x1 = m + pw / 2, y1 = YM + PH / 2 + 4, x2 = s + pw / 2, y2 = YS - PH / 2 - 4;
      const ex = x1 + (x2 - x1) * p, ey = y1 + (y2 - y1) * p;
      o.line.setAttribute('d', `M${x1.toFixed(2)},${y1.toFixed(2)} L${ex.toFixed(2)},${ey.toFixed(2)}`);
      const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L, hs = 11;
      o.head.setAttribute('d', p >= 0.98 ? `M${x2},${y2} L${x2 - ux * hs - uy * hs * 0.6},${y2 - uy * hs + ux * hs * 0.6} L${x2 - ux * hs + uy * hs * 0.6},${y2 - uy * hs - ux * hs * 0.6} Z` : 'M0,0');
      // lit: the sweep (b3) lights the arrows in flight at its time; the first word's arrow (b4)
      let op = 0.85;
      if (t >= SW0 && t <= SW0 + SWD) {
        const sMs = 60 + (300 - 60) * (t - SW0) / SWD;
        op = sMs >= k * STEP && sMs <= k * STEP + TRIP ? 1 : 0.25;
        if (k === 0) sweep.setAttribute('x', (X(sMs) + pw / 2 - 3).toFixed(2));
      } else if (t >= FW && t < PB) op = k === 0 ? 1 : 0.25;
      o.line.setAttribute('stroke-width', op === 1 ? 4.5 : 3);
      o.arr.setAttribute('opacity', (p > 0 && tokOn ? op * fadeTok : 0).toFixed(3));
    });
    // the 't' and 't + 65 ms' ticks follow the first token
    const m0 = X(0) + pw / 2, s0 = X(TRIP) + pw / 2;
    [tickTl].forEach(l => { l.setAttribute('x1', m0); l.setAttribute('x2', m0); });
    tickTt.setAttribute('x', m0);
    [tick65l].forEach(l => { l.setAttribute('x1', s0); l.setAttribute('x2', s0); });
    tick65t.setAttribute('x', s0);
    // the amber prefill block (pull-back view)
    amber.setAttribute('x', X(-250).toFixed(2));
    amber.setAttribute('width', Math.max(0, X(-8) - X(-250)).toFixed(2));
    // axis ticks: ms ticks in the close-up and pull-back views, seconds ticks in the seconds view
    // ms labels only while 50 ms is wide enough to read (k ≥ 1.6), seconds labels once 2 s is (k ≤ 0.14)
    const msW = Math.max(0, Math.min(1, (v.k - 1.45) / 0.3)), secsW = Math.max(0, Math.min(1, (0.14 - v.k) / 0.04));
    msTicks.forEach(g => {
      const x = X(g.ms), inside = x >= XL - 1 && x <= XR + 1;
      g.setAttribute('transform', `translate(${x.toFixed(2)},0)`);
      g.setAttribute('opacity', inside ? msW.toFixed(3) : 0);
    });
    sTicks.forEach(g => {
      const x = X(g.ms), inside = x >= XL - 1 && x <= XR + 1;
      g.setAttribute('transform', `translate(${x.toFixed(2)},0)`);
      g.setAttribute('opacity', inside ? secsW.toFixed(3) : 0);
    });
  };
  // tick labels are drawn at x 0 and placed by translate
  const clock = { t: 0 };
  S.add(gsap.fromTo(clock, { t: 0 }, { t: S.duration, duration: S.duration, ease: 'none', immediateRender: false, onUpdate: () => paint(clock.t) }), 0);
  paint(0);
});
