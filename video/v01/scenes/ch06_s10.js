/* ch06_s10 · one lever against three ceilings (fig 78)
   b1  top-left: amber 'Compute scales with one thing' over 'transistor density'; an inset of s01's worker
       grid where one square splits into 4, then 16; an arrow climbs off the top: 'no hard ceiling reached yet'.
   b2  top-right: the package zooms in, 'generic GPU' becomes 'H100 · 80 GB' (six sites, five in use); a
       pointer names a 'stack'; on 'pins' a close-up: one tower of layers on a dense field of connections.
       Bottom: three coral cards build, 'rate per pin' × 'pins per stack' × 'stacks per chip'.
   b3  the numbers drop in (≈ 5.23 Gbit/s, 1,024, 5); '5,120 wires' flies in and splits into '1,024 × 5';
       the result line: 5.23 Gbit/s × 5,120 ≈ 26.8 trillion bits/s ÷ 8 ≈ 3.35 TB/s.
   b4  a dashed ceiling drops over each card on its phrase, each with its reason drawn in the card.
   b5  the arrow keeps climbing; the cards press up against their ceilings; '1 lever' vs '3 constrained levers'.
   Checks: 5 × 1,024 = 5,120; 5.23e9 × 5,120 = 2.68e13 bits/s; ÷ 8 = 3.35e12 B/s.
   Layout: top-left x 120-1220, y 100-330; package / close-up x 1110-1810, y 150-510; cards y 600-860. */
V.scene('ch06_s10', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = n => gsap.parseEase(n);
  const eIO2 = E('power2.inOut');
  const ignoreIn = (els, a, b) => ch06Clock(S, a, b, t => els.forEach(e => (t > a && t < b ? e.setAttribute('data-audit', 'ignore') : e.removeAttribute('data-audit'))));

  // ================================================================ b1: compute, one lever
  const comp = S.g();
  const cTop = S.g(null, comp);
  S.card({ x: 140, y: 118, w: 560, h: 84, tone: 'compute', r: 20 }, cTop);
  S.text('Compute scales with one thing', { x: 420, y: 161, size: 31, weight: 700, anchor: 'middle', color: 'compute' }, cTop);
  const cDen = S.g(null, comp);
  S.card({ x: 230, y: 222, w: 380, h: 66, tone: 'compute', r: 16 }, cDen);
  S.text('transistor density', { x: 420, y: 256, size: 30, weight: 600, anchor: 'middle', color: 'ink' }, cDen);
  S.add(fx.in(cTop, { from: 'up', d: 0.6, dist: 16 }), 'b1~Transistors-0.2');
  S.add(fx.in(cDen, { from: 'up', d: 0.6, dist: 16 }), 'b1~Transistors+0.2');
  // the inset: 6 x 4 amber squares; one subdivides into 4, then 16, in the same area
  const IN = { x: 646, y: 220, p: 22, q: 18 };
  const inset = S.g();
  S.rect({ x: IN.x - 10, y: IN.y - 10, w: 6 * IN.p + 16, h: 4 * IN.p + 16, r: 10, fill: '#0c1326', stroke: 'compute', strokeOpacity: 0.35, sw: 1.5 }, inset);
  const SR = 1, SC = 3;
  let base = '';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) if (r !== SR || c !== SC) base += `M${IN.x + c * IN.p},${IN.y + r * IN.p}h${IN.q}v${IN.q}h${-IN.q}z`;
  S.path({ d: base, fill: 'compute', fillOpacity: 0.7 }, inset);
  const sub = n => { const g = S.g(null, inset), a = IN.q / n; let d = ''; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) d += `M${(IN.x + SC * IN.p + c * a + 0.6).toFixed(2)},${(IN.y + SR * IN.p + r * a + 0.6).toFixed(2)}h${(a - 1.2).toFixed(2)}v${(a - 1.2).toFixed(2)}h${(1.2 - a).toFixed(2)}z`; S.path({ d, fill: 'compute', fillOpacity: 0.95 }, g); return g; };
  const s1 = sub(1), s2 = sub(2), s4 = sub(4);
  S.set(inset, { autoAlpha: 0 }, 0);
  S.set([s2, s4], { autoAlpha: 0 }, 0);
  S.add(fx.in(inset, { from: 'fade', d: 0.45 }), 'b1~tiny-0.1');
  const tSplit = T('b1~densely') - 0.05;
  S.add(gsap.to(s1, { autoAlpha: 0, duration: 0.15 }), tSplit);
  S.add(gsap.fromTo(s2, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, immediateRender: false }), tSplit);
  S.add(gsap.to(s2, { autoAlpha: 0, duration: 0.15 }), tSplit + 0.5);
  S.add(gsap.fromTo(s4, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, immediateRender: false }), tSplit + 0.5);
  S.add(fx.out(inset, { d: 0.45 }), T('b1~yet') + 0.1);
  // the arrow climbing up and off the top of the frame
  const ARR = 'M706,150 C790,140 830,70 860,-60';
  const climb = S.path({ d: ARR, stroke: 'compute', sw: 7 }, comp);
  climb.setAttribute('stroke-linecap', 'round');
  const climbFlow = S.path({ d: ARR, stroke: '#fff3d6', sw: 3, opacity: 0 }, comp);
  climbFlow.setAttribute('stroke-dasharray', '14 26');
  [climb, climbFlow].forEach(e => e.setAttribute('data-audit', 'ignore'));
  S.set(climb, { autoAlpha: 0 }, 0);
  S.add(fx.draw(climb, { d: 0.7 }), 'b1~No-0.1');
  const noCeil = S.text('no hard ceiling reached yet', { x: 900, y: 128, size: 28, weight: 600, color: 'compute' }, comp);
  S.set(noCeil, { autoAlpha: 0 }, 0);
  S.add(fx.in(noCeil, { from: 'left', d: 0.45, dist: 14 }), 'b1~ceiling-0.1');

  // ================================================================ b2: the package, its stacks and pins
  S.add(fx.dim(noCeil, { to: 0.35 }), T('b2') - 0.05);
  const PK0 = { x: 1500, y: 300, s: 0.45 }, PK1 = { x: 1460, y: 316, s: 0.7 };
  const pkHold = S.g();
  const pkg = ch06Package(S, { x: 0, y: 0, s: 1, side: 'both', stacks: 3, grey: [5], wires: 14, tagSize: 24 / PK0.s * PK0.s }, pkHold);
  pkg.tagEl.setAttribute('font-size', 24 / PK0.s);
  const pkXf = (x, y, s) => `translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${s.toFixed(4)})`;
  pkHold.setAttribute('transform', pkXf(PK0.x, PK0.y, PK0.s));
  S.set(pkHold, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(pkHold, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7, immediateRender: false }), 0.5);   // no fx.in: its x/y would reset the transform
  const tZ = T('b2') + 0.1;
  ch06Clock(S, tZ, tZ + 1.2, t => {
    const u = eIO2(cl((t - tZ) / 1.2));
    pkHold.setAttribute('transform', pkXf(lerp(PK0.x, PK1.x, u), lerp(PK0.y, PK1.y, u), Math.exp(lerp(Math.log(PK0.s), Math.log(PK1.s), u))));
    pkg.tagEl.setAttribute('font-size', (24 / lerp(PK0.s, PK1.s, u)).toFixed(2));
  });
  // the tag swaps: grey 'generic GPU' → blue 'H100 · 80 GB'
  const BX = PK1.x + PK1.s * (-150 - 300 - 46 + 26), BY = PK1.y + PK1.s * (236 - 26);
  const h100 = S.text('H100 · 80 GB', { x: BX, y: BY, size: 26, weight: 700, color: 'struct' });
  S.set(h100, { autoAlpha: 0 }, 0);
  S.add(gsap.to(pkg.tagEl, { autoAlpha: 0, duration: 0.3 }), tZ + 0.9);
  S.add(fx.in(h100, { from: 'fade', d: 0.4 }), tZ + 1.1);
  // a pointer names one tower 'stack'; the grey count of active stacks
  const stX = PK1.x + PK1.s * (150 + 170 + 65), stY = PK1.y + PK1.s * -150;
  const stackLbl = S.g();
  S.text('stack', { x: stX, y: stY - 64, size: 28, weight: 650, anchor: 'middle', color: 'bytes' }, stackLbl);
  const stPtr = S.line({ x1: stX, y1: stY - 46, x2: stX, y2: stY - 6, stroke: 'bytes', sw: 2.5 }, stackLbl);
  stPtr.setAttribute('data-audit', 'ignore');
  const active = S.text('H100: 5 active stacks', { x: PK1.x, y: PK1.y + PK1.s * 236 + 34, size: 26, weight: 550, anchor: 'middle', color: 'muted' });
  [stackLbl, active].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  S.add(fx.in(stackLbl, { from: 'down', d: 0.45, dist: 12 }), 'b2~stacks-0.1');
  S.add(fx.in(active, { from: 'fade', d: 0.45 }), T('b2~stacks') + 0.4);
  S.add(gsap.fromTo(pkg.stacks.filter(st => !st.grey).map(st => st.inner), { opacity: 1 }, { opacity: 0.55, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), 'b2~layers-0.15');
  // 'pins': the package steps back; a close-up of one tower on its field of connections
  const tPins = T('b2~pins') - 0.15;
  S.add(gsap.to([pkHold, h100, stackLbl], { opacity: 0, duration: 0.4 }), tPins);
  ignoreIn([pkHold, h100, stackLbl], tPins, S.duration);
  const close = S.g();
  const TW = { x: 1170, y: 180, w: 230 };
  for (let l = 0; l < 8; l++) S.rect({ x: TW.x, y: TW.y + l * 25, w: TW.w, h: 20, r: 4, fill: '#2a1218', stroke: 'bytes', strokeOpacity: 0.9, sw: 2 }, close);
  S.rect({ x: TW.x - 30, y: TW.y + 8 * 25 + 12, w: TW.w + 60, h: 12, r: 3, fill: '#1f2a48' }, close);
  let bumps = '';
  for (let k = 0; k < 23; k++) bumps += `M${TW.x + 5 + k * 10},${TW.y + 8 * 25 + 4}h5v8h-5z`;
  S.path({ d: bumps, fill: 'compute', fillOpacity: 0.85 }, close);
  S.text('one stack, side on', { x: TW.x + TW.w / 2, y: TW.y + 8 * 25 + 50, size: 24, weight: 550, anchor: 'middle', color: 'muted' }, close);
  const FD = { x: 1470, y: 200, cols: 30, rows: 18, p: 9 };
  let field = '';
  for (let r = 0; r < FD.rows; r++) for (let c = 0; c < FD.cols; c++) field += `M${FD.x + c * FD.p + 4},${FD.y + r * FD.p + 4}m-2,0a2,2 0 1,0 4,0a2,2 0 1,0 -4,0`;
  S.rect({ x: FD.x - 10, y: FD.y - 10, w: FD.cols * FD.p + 20, h: FD.rows * FD.p + 20, r: 10, fill: '#0c1326', stroke: 'compute', strokeOpacity: 0.4, sw: 1.5 }, close);
  S.path({ d: field, fill: 'compute', fillOpacity: 0.8 }, close);
  S.text('pins under it, from below', { x: FD.x + FD.cols * FD.p / 2, y: TW.y + 8 * 25 + 50, size: 24, weight: 550, anchor: 'middle', color: 'muted' }, close);
  S.set(close, { autoAlpha: 0 }, 0);
  S.add(fx.in(close, { from: 'fade', d: 0.5 }), tPins + 0.25);

  // the three coral cards, joined by ×
  const CW = 400, CH = 260, CYT = 600, CXS = [210, 760, 1310];
  const NAMES = ['rate per pin', 'pins per stack', 'stacks per chip'];
  const cards = CXS.map((x, k) => {
    const outer = S.g(), g = S.g(null, outer);
    S.card({ x, y: CYT, w: CW, h: CH, tone: 'bytes', r: 24 }, g);
    S.text(NAMES[k], { x: x + CW / 2, y: CYT + 44, size: 32, weight: 700, anchor: 'middle', color: 'bytes' }, g);
    outer.inner = g; outer.x = x; outer.cx = x + CW / 2;
    S.set(outer, { autoAlpha: 0 }, 0);
    return outer;
  });
  const times = [0, 1].map(k => S.text('×', { x: CXS[k] + CW + 75, y: CYT + CH / 2, size: 56, weight: 700, anchor: 'middle', color: 'muted' }));
  times.forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  S.add(fx.in(cards[0], { from: 'up', d: 0.5, dist: 20 }), 'b2~rate-0.1');
  S.add(fx.in(times[0], { from: 'fade', d: 0.3 }), 'b2~times-0.1');
  S.add(fx.in(cards[1], { from: 'up', d: 0.5, dist: 20 }), 'b2~pins#2-0.1');
  S.add(fx.in(times[1], { from: 'fade', d: 0.3 }), 'b2~times#2-0.1');
  S.add(fx.in(cards[2], { from: 'up', d: 0.5, dist: 20 }), 'b2~stacks#2-0.15');

  // ================================================================ b3: the H100's numbers
  const VALS = ['≈ 5.23 Gbit/s', '1,024', '5'];
  const vals = VALS.map((v, k) => S.text(v, { x: cards[k].cx, y: CYT + 112, size: 46, weight: 700, family: 'mono', anchor: 'middle', color: 'ink' }, cards[k].inner));
  vals.forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  S.add(fx.in(vals[2], { from: 'down', d: 0.5, dist: 40 }), 'b3~five-0.05');
  S.add(fx.in(vals[1], { from: 'down', d: 0.5, dist: 40 }), 'b3~thousand-0.05');
  S.add(fx.in(vals[0], { from: 'down', d: 0.5, dist: 40 }), 'b3~pins-0.1');
  // '5,120 wires' flies in and splits into '1,024 × 5'
  const wA = S.text('5,120 wires', { x: 960, y: 470, size: 40, weight: 700, family: 'mono', anchor: 'end', color: 'ink' });
  const wB = S.text('= 1,024 × 5', { x: 984, y: 470, size: 40, weight: 700, family: 'mono', color: 'bytes' });
  [wA, wB].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  S.add(gsap.fromTo(wA, { autoAlpha: 0, x: 220 }, { autoAlpha: 1, x: 120, duration: 0.6, ease: 'power3.out', immediateRender: false }), 'b3~five#2-0.1');
  S.add(gsap.to(wA, { x: 0, duration: 0.5, ease: 'power2.inOut' }), 'b3~wires-0.2');
  S.add(fx.in(wB, { from: 'left', d: 0.5, dist: 30 }), 'b3~wires');
  const result = S.text([{ t: '5.23 Gbit/s × 5,120 ≈ 26.8 trillion bits/s ÷ 8 ≈ ' }, { t: '3.35 TB/s', w: 800 }], { x: 960, y: 916, size: 32, weight: 650, anchor: 'middle', color: 'bytes' });
  S.set(result, { autoAlpha: 0 }, 0);
  S.add(fx.in(result, { from: 'up', d: 0.5, dist: 14 }), 'b3~earlier-0.1');

  // ================================================================ b4: a ceiling over each term
  const t4 = T('b4') - 0.05;
  S.add(fx.dim([result, wA, wB], { to: 0.25 }), t4);
  S.add(gsap.to([close, active], { opacity: 0, duration: 0.5 }), t4);
  ignoreIn([close, active], t4, S.duration);
  const CEIL = CYT - 20;
  const ceils = cards.map(c => {
    const l = S.line({ x1: c.x - 14, y1: CEIL, x2: c.x + CW + 14, y2: CEIL, stroke: 'ink', sw: 3.5, dash: '14 9', cap: 'butt' });
    S.set(l, { autoAlpha: 0 }, 0);
    return l;
  });
  const drop = (k, at) => S.add(gsap.fromTo(ceils[k], { autoAlpha: 0, y: -50 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'bounce.out', immediateRender: false }), at);
  const reason = (k, txt, at) => {
    const e = S.text(txt, { x: cards[k].cx, y: CEIL - 30, size: 28, weight: 650, anchor: 'middle', color: 'muted' });
    S.set(e, { autoAlpha: 0 }, 0);
    S.add(fx.in(e, { from: 'up', d: 0.45, dist: 10 }), at);
    return e;
  };
  const IY = CYT + 196;                                           // illustration row inside the cards
  // card 1: a tiny voltage trace whose clean edges smear together
  const trace = S.path({ d: '', stroke: 'ink', sw: 3 }, cards[0].inner);
  trace.setAttribute('stroke-linejoin', 'round');
  trace.setAttribute('data-audit', 'ignore');
  const tBlur = T('b4~high') - 0.1;
  const traceD = k => {                                           // k = 0 crisp square wave → 1 smeared
    let d = '';
    const x0 = cards[0].x + 60, w = CW - 120, bits = [1, 0, 1, 1, 0, 1, 0, 0], bw = w / bits.length;
    for (let x = 0; x <= w; x += 2) {
      const i = Math.min(bits.length - 1, Math.floor(x / bw)), f = x / bw - i;
      const prev = i ? bits[i - 1] : 0, cur = bits[i];
      const rise = lerp(0.06, 0.95, k);
      const v = lerp(prev, cur, cl(f / rise));
      const amp = lerp(1, 0.55, k);
      const y = IY + 26 - 52 * (0.5 + (v - 0.5) * amp) + 4 * k * Math.sin(x * 0.4);
      d += `${d ? 'L' : 'M'}${(x0 + x).toFixed(1)},${y.toFixed(1)}`;
    }
    return d;
  };
  trace.setAttribute('d', traceD(0));
  S.set(trace, { autoAlpha: 0 }, 0);
  ch06Clock(S, tBlur, tBlur + 1.2, t => trace.setAttribute('d', traceD(eIO2(cl((t - tBlur) / 1.2)))));
  drop(0, 'b4~Pins-0.1');
  S.add(fx.in(trace, { from: 'fade', d: 0.4 }), 'b4~Pins');
  const r1 = reason(0, 'signal integrity', 'b4~switch');
  // card 2: the dense field of dots under one stack
  const dots2 = S.g(null, cards[1].inner);
  let fd2 = '';
  for (let r = 0; r < 6; r++) for (let c = 0; c < 30; c++) fd2 += `M${cards[1].x + 66 + c * 9.2 + 2},${IY - 6 + r * 9 + 2}m-2,0a2,2 0 1,0 4,0a2,2 0 1,0 -4,0`;
  S.path({ d: fd2, fill: 'compute', fillOpacity: 0.85 }, dots2);
  S.set(dots2, { autoAlpha: 0 }, 0);
  drop(1, 'b4~Only so many-0.1');
  S.add(fx.in(dots2, { from: 'fade', d: 0.4 }), 'b4~connections-0.1');
  const r2 = reason(1, 'only so many fit', 'b4~fit-0.1');
  // card 3: the package outline, stacks crowding its edges
  const pk3 = S.g(null, cards[2].inner);
  const P3 = { x: cards[2].cx, y: IY + 14, w: 230, h: 76 };
  S.rect({ x: P3.x - P3.w / 2, y: P3.y - P3.h / 2, w: P3.w, h: P3.h, r: 8, stroke: 'ink', strokeOpacity: 0.7, sw: 2.5 }, pk3);
  S.rect({ x: P3.x - 34, y: P3.y - 30, w: 68, h: 60, r: 5, fill: '#1a1408', stroke: 'compute', sw: 2 }, pk3);
  [-1, 1].forEach(sd => [0, 1, 2].forEach(i => S.rect({ x: sd > 0 ? P3.x + 40 : P3.x - P3.w / 2 + 3, y: P3.y - P3.h / 2 + 3 + i * 24, w: P3.w / 2 - 43, h: 21, r: 3, fill: (sd < 0 && i === 2) ? '#171c29' : '#2a1218', stroke: (sd < 0 && i === 2) ? 'muted' : 'bytes', sw: 1.5 }, pk3)));
  S.set(pk3, { autoAlpha: 0 }, 0);
  drop(2, 'b4~package-0.1');
  S.add(fx.in(pk3, { from: 'fade', d: 0.4 }), 'b4~package');
  const r3 = reason(2, 'package edges', 'b4~edges-0.1');
  // 'hard to speed up': the three ceilings flash together
  const tHard = T('b4~hard') - 0.05;
  S.add(gsap.fromTo(ceils, { attr: { 'stroke-width': 3.5 } }, { attr: { 'stroke-width': 7 }, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), tHard);
  const why = S.text('why memory is hard to speed up', { x: 960, y: 975, size: 28, weight: 600, anchor: 'middle', color: 'muted' });
  S.set(why, { autoAlpha: 0 }, 0);
  S.add(fx.in(why, { from: 'up', d: 0.45, dist: 10 }), tHard + 0.2);

  // ================================================================ b5: one lever against three
  const t5 = T('b5') - 0.1;
  S.add(gsap.to(noCeil, { opacity: 1, duration: 0.4 }), t5);
  S.add(fx.out([wA, wB], { d: 0.4 }), t5);
  // 'Compute keeps climbing': light runs up the arrow, past the top of the frame
  ch06Clock(S, t5, S.duration, t => {
    climbFlow.setAttribute('opacity', cl((t - t5) / 0.3).toFixed(3));
    climbFlow.setAttribute('stroke-dashoffset', (-(t - t5) * 160).toFixed(1));
  });
  // 'three ceilings': the cards press up against their ceilings and stop
  const tPress = T('b5~ceilings') - 0.2;
  cards.forEach((c, k) => S.add(gsap.fromTo(c.inner, { y: 0 }, { y: -17, duration: 0.55, ease: 'back.out(3)', immediateRender: false }), tPress + 0.08 * k));
  S.add(gsap.to([r1, r2, r3], { y: -6, opacity: 0.6, duration: 0.4 }), tPress);
  ignoreIn(cards, tPress, tPress + 0.9);
  const lever = S.text([{ t: 'one lever', c: 'compute' }, { t: ' vs ', c: 'muted' }, { t: 'three ceilings', c: 'bytes' }], { x: 960, y: 470, size: 50, weight: 700, family: 'display', anchor: 'middle' });
  const lever2 = S.text([{ t: '1 lever', c: 'compute' }, { t: '   vs   ', c: 'muted' }, { t: '3 constrained levers', c: 'bytes' }], { x: 960, y: 470, size: 50, weight: 700, family: 'display', anchor: 'middle' });
  [lever, lever2].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  S.add(fx.in(lever, { from: 'up', d: 0.55, dist: 14 }), 'b5~set-0.1');
  S.add(gsap.to(lever, { autoAlpha: 0, duration: 0.3 }), 'b5~mechanism-0.15');
  S.add(fx.in(lever2, { from: 'up', d: 0.5, dist: 12 }), T('b5~mechanism') + 0.1);
});
