/* ch01_s03 · a dial, then multiply and add (figs 4, 5)
   Part 1 (b1–b3): one weight is one multiplication, a dial on how much an input counts.
   Part 2 (b4–b6): five inputs times five weights, added up: nearly all the arithmetic a model does. */
V.scene('ch01_s03', S => {
  const { fx } = S;
  const fmtN = (v, dp = 2) => {
    const s = Math.abs(v).toFixed(dp).replace(/\.?0+$/, '');
    return (v < -1e-9 && s !== '0' ? '−' : '') + (s === '' ? '0' : s);
  };
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;   // cubic in-out
  // value of a keyframed quantity at time t: keys = [[time, value], ...]
  const keyed = (keys, t, d = 0.7) => {
    let v = keys[0][1];
    for (const [k, val] of keys) { if (t >= k + d) v = val; else if (t > k) { v = v + (val - v) * ease((t - k) / d); break; } else break; }
    return v;
  };
  const box = (o, parent) => {
    const g = S.g(null, parent);
    g.base = S.rect({ x: o.cx - o.w / 2, y: o.cy - o.h / 2, w: o.w, h: o.h, r: 14, fill: '#0c1326' }, g);
    g.bg = S.rect({ x: o.cx - o.w / 2, y: o.cy - o.h / 2, w: o.w, h: o.h, r: 14, fill: o.dashed ? 'none' : `url(#card-${o.tone})`,
      stroke: o.tone, strokeOpacity: o.dashed ? 0.6 : 0.8, sw: 2.5, dash: o.dashed ? '9 8' : undefined }, g);
    if (o.dashed) g.base.setAttribute('opacity', 0);
    g.val = S.text(o.text || '', { x: o.cx, y: o.cy + 1, size: o.size || 40, anchor: 'middle', family: 'mono', weight: 500, color: o.textColor || 'ink' }, g);
    Object.assign(g, { cx: o.cx, cy: o.cy, w: o.w, h: o.h, l: o.cx - o.w / 2, r: o.cx + o.w / 2, t: o.cy - o.h / 2, b: o.cy + o.h / 2 });
    return g;
  };

  // ================================================================ PART 1: one weight, one multiplication
  const EY = 330;
  const P = { inp: 470, times: 615, w: 780, eq: 945, con: 1110, outX: 1430 };
  const part1 = S.g();
  const hdr = (txt, x) => S.text(txt, { x, y: EY - 134, size: 26, anchor: 'middle', color: 'muted', weight: 550 }, part1);
  const inpBox = box({ cx: P.inp, cy: EY, w: 170, h: 100, tone: 'struct' }, part1);
  const inpHdr = hdr('input', P.inp);
  const aNumber = S.text('a number', { x: P.inp, y: EY + 82, size: 24, anchor: 'middle', color: 'muted', weight: 550 }, part1);
  const times = S.text('×', { x: P.times, y: EY, size: 56, anchor: 'middle', color: 'compute', weight: 600 }, part1);
  const wTile = box({ cx: P.w, cy: EY, w: 150, h: 100, tone: 'struct', text: 'w', size: 44 }, part1);
  wTile.val.setAttribute('font-style', 'italic');
  const wHdr = hdr('weight', P.w);
  const eq = S.text('=', { x: P.eq, y: EY, size: 56, anchor: 'middle', color: 'compute', weight: 600 }, part1);
  const conBox = box({ cx: P.con, cy: EY, w: 230, h: 100, tone: 'compute' }, part1);
  const conHdr = hdr('contribution', P.con);
  const outG = S.g();                                        // moves on its own in b4
  const outArrow = S.arrow({ x1: conBox.r + 16, y1: EY, x2: P.outX - 98, y2: EY, color: 'faint', sw: 3, head: 14 }, outG);
  const outBox = box({ cx: P.outX, cy: EY, w: 170, h: 100, tone: 'struct', dashed: true }, outG);
  const outHdr = S.text('output', { x: P.outX, y: EY + 1, size: 28, anchor: 'middle', color: 'muted', weight: 550 }, outG);

  S.add(fx.in([inpBox, inpHdr], { from: 'up', d: 0.5 }), 'b1~input-0.15');
  S.add(fx.in(aNumber, { from: 'up', d: 0.4 }), 'b1~number');
  S.add(fx.pop(times), 'b1~times');
  S.add(fx.in([wTile, wHdr], { from: 'up', d: 0.5 }), 'b1~the weight');
  S.add(fx.pop(eq), 'b1~gives');
  S.add(fx.in([conBox, conHdr], { from: 'up', d: 0.5 }), 'b1~contribution-0.1');
  S.add(fx.drawArrow(outArrow, { d: 0.4 }), 'b1~output-0.1');
  S.add(fx.in([outBox, outHdr], { from: 'fade', d: 0.4 }), 'b1~output+0.1');

  // the dial: −1 to +1.5, 0 at the top, 80° per unit
  const DR = 78, ang = v => v * 80;
  const dial = S.g(null, part1);
  S.circle({ x: P.w, y: EY, r: DR + 6, fill: '#0c1326' }, dial);
  S.circle({ x: P.w, y: EY, r: DR, fill: 'url(#card-struct)', stroke: 'struct', sw: 2.5, strokeOpacity: 0.85 }, dial);
  for (let v = -1; v <= 1.5001; v += 0.25) {
    const a = ang(v) * Math.PI / 180, major = Math.abs(v * 2 - Math.round(v * 2)) < 1e-6;
    const r1 = DR - (major ? 14 : 8), r2 = DR - 3;
    S.line({ x1: P.w + r1 * Math.sin(a), y1: EY - r1 * Math.cos(a), x2: P.w + r2 * Math.sin(a), y2: EY - r2 * Math.cos(a), stroke: 'muted', sw: major ? 2.5 : 1.5 }, dial);
  }
  [[-1, '−1'], [1.5, '1.5']].forEach(([v, t]) => {   // 0 is the major tick at the top
    const a = ang(v) * Math.PI / 180, rr = 118;
    S.text(t, { x: P.w + rr * Math.sin(a), y: EY - rr * Math.cos(a), size: 22, anchor: 'middle', family: 'mono', color: 'muted' }, dial);
  });
  const needle = S.g(null, dial);
  S.line({ x1: P.w, y1: EY + 10, x2: P.w, y2: EY - DR + 16, stroke: 'ink', sw: 4 }, needle);
  S.circle({ x: P.w, y: EY, r: 7, fill: 'ink' }, dial);
  const dialVal = S.text('', { x: P.w, y: EY + 40, size: 24, anchor: 'middle', family: 'mono', weight: 600, color: 'ink' }, dial);
  S.set(dial, { autoAlpha: 0 }, 0);
  S.add(gsap.to(wTile, { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.35 }), 'b1~dial-0.1');
  S.add(gsap.fromTo(dial, { autoAlpha: 0, scale: 0.6, svgOrigin: `${P.w} ${EY}` }, { autoAlpha: 1, scale: 1, svgOrigin: `${P.w} ${EY}`, duration: 0.5, ease: 'back.out(1.6)' }), 'b1~dial+0.1');

  // the contribution axis
  const AX = { x0: 960, y: 560, u: 125 };
  const axis = S.g();
  const axLine = S.line({ x1: AX.x0 - 3.3 * AX.u, y1: AX.y, x2: AX.x0 + 3.3 * AX.u, y2: AX.y, stroke: 'faint', sw: 3 }, axis);
  const axTicks = [-2, -1, 0, 1, 2].map(v => {
    const tg = S.g(null, axis);
    S.line({ x1: AX.x0 + v * AX.u, y1: AX.y - (v ? 10 : 16), x2: AX.x0 + v * AX.u, y2: AX.y + (v ? 10 : 16), stroke: 'muted', sw: v ? 2 : 3 }, tg);
    S.text(fmtN(v), { x: AX.x0 + v * AX.u, y: AX.y + 42, size: 22, anchor: 'middle', family: 'mono', color: 'muted' }, tg);
    return tg;
  });
  const bar = S.rect({ x: AX.x0, y: AX.y - 17, w: 0, h: 34, r: 6, fill: 'compute' }, axis);
  const barDot = S.circle({ x: AX.x0, y: AX.y, r: 9, fill: 'muted' }, axis);
  S.add(fx.draw(axLine, { d: 0.6 }), 'b1~dial+0.2');
  S.add(fx.in(axTicks, { from: 'fade', d: 0.3, stagger: 0.05 }), 'b1~dial+0.4');
  S.set([bar, barDot], { autoAlpha: 0 }, 0);
  S.add(gsap.to([bar, barDot], { autoAlpha: 1, duration: 0.3 }), 'b2~zero');

  // b2: feed in a two, then turn the dial
  const W = { two: S.t('b2~two'), zero: S.t('b2~zero'), one: S.t('b2~one'), minus: S.t('b2~minus'), settle: S.t('b3>') - 0.25 };
  const DIAL_KEYS = [[0, 0], [W.zero - 0.1, 0], [W.one - 0.1, 1.44], [W.minus - 0.1, -0.7], [W.settle, 0.13]];
  S.add(gsap.to(aNumber, { autoAlpha: 0, duration: 0.3 }), 'b2~two');
  const tag = S.text('ignored', { x: AX.x0, y: AX.y + 96, size: 32, anchor: 'middle', color: 'ink', weight: 600 }, axis);
  S.add(fx.in(tag, { from: 'up', d: 0.4 }), 'b2~ignored-0.2');
  S.add(fx.swap(tag, 'dominates'), 'b2~dominates-0.15');
  S.add(fx.swap(tag, 'pushes the other way'), 'b2~pushes-0.15');
  S.add(gsap.to(inpBox, { opacity: 0.4, duration: 0.3 }), 'b2~zero+0.1');
  S.add(gsap.to(inpBox, { opacity: 1, duration: 0.3 }), 'b2~one');
  S.add(fx.pulse([dial, conBox, inpBox], { scale: 1.05, d: 0.5 }), 'b2>-0.5');

  // ---------------------------------------------------------------- b3: seventy billion dials
  S.add(gsap.to(tag, { autoAlpha: 0, duration: 0.3 }), 'b3');
  const wall = S.g(null, S.layers.back);
  wall.setAttribute('data-audit', 'ignore');
  const rnd = S.rand(11), DIALS = [];
  for (let r = 0; r < 13; r++) for (let c = 0; c < 31; c++) {
    const x = 30 + c * 62 + (r % 2) * 31, y = 120 + r * 64;
    DIALS.push({ x, y, a: (rnd() * 2 - 1) * 110 });
  }
  const circD = DIALS.map(d => `M${d.x - 17},${d.y} a17,17 0 1,0 34,0 a17,17 0 1,0 -34,0`).join('');
  S.path({ d: circD, stroke: 'struct', sw: 1.5, strokeOpacity: 0.9 }, wall);
  const needlesP = S.path({ d: '', stroke: 'ink', sw: 2, strokeOpacity: 0.9 }, wall);
  const SOLO = DIALS.findIndex(d => d.x > 1600 && d.y > 760);
  const solo = S.g();
  S.circle({ x: DIALS[SOLO].x, y: DIALS[SOLO].y, r: 17, fill: 'none', stroke: 'struct', sw: 2 }, solo);
  const soloNeedle = S.line({ x1: DIALS[SOLO].x, y1: DIALS[SOLO].y, x2: DIALS[SOLO].x, y2: DIALS[SOLO].y - 14, stroke: 'ink', sw: 2.5 }, solo);
  solo.setAttribute('data-audit', 'ignore');
  S.set([wall, solo], { autoAlpha: 0 }, 0);
  S.add(gsap.to(wall, { autoAlpha: 0.3, duration: 0.8 }), 'b3~seventy-0.1');
  S.add(gsap.to(solo, { autoAlpha: 1, duration: 0.3 }), 'b3~single-0.2');
  const T3 = { single: S.t('b3~single'), combine: S.t('b3~combine'), end: S.t('b4') + 0.3 };
  const counter = S.counter({ x: 1810, y: 168, size: 50, value: 1, anchor: 'end', color: 'ink', family: 'mono', weight: 600 }, S.hud);
  const cLabel = S.text('dials', { x: 1810, y: 218, size: 26, anchor: 'end', color: 'muted', weight: 550 }, S.hud);
  S.add(fx.in([counter, cLabel], { from: 'down', d: 0.4 }), 'b3~seventy-0.2');
  S.add(fx.count(counter, 1, 70e9, { d: 1.4, ease: 'expo.in' }), 'b3~seventy');

  // ---------------------------------------------------------------- one clock paints the dial, bar, contribution and wall
  const paint = t => {
    const v = keyed(DIAL_KEYS, t);
    needle.setAttribute('transform', `rotate(${ang(v).toFixed(2)} ${P.w} ${EY})`);
    dialVal.textContent = fmtN(v);
    const fed = t >= W.two;
    inpBox.val.textContent = fed ? '2' : '';
    const c = 2 * v;
    conBox.val.textContent = t >= W.zero - 0.1 ? fmtN(c) : '';
    const len = Math.abs(c) * AX.u;
    bar.setAttribute('x', c >= 0 ? AX.x0 : AX.x0 - len);
    bar.setAttribute('width', Math.max(0, len));
    bar.setAttribute('fill', S.tone(c >= 0 ? 'compute' : 'violet'));
    conBox.val.setAttribute('fill', S.tone(c < 0 ? 'violet' : 'ink'));
    barDot.setAttribute('opacity', len < 6 ? 1 : 0);
    // wall: the lone dial turns on 'single'; a wave of turning sweeps left to right on 'combine'
    const sweep = (t - T3.combine) * 1400;
    needlesP.setAttribute('d', DIALS.map((d, i) => {
      if (i === SOLO) return '';
      const bump = Math.exp(-Math.pow((d.x - sweep) / 160, 2));
      const a = (d.a + 75 * bump) * Math.PI / 180;
      return `M${d.x},${d.y} L${(d.x + 14 * Math.sin(a)).toFixed(1)},${(d.y - 14 * Math.cos(a)).toFixed(1)}`;
    }).join(''));
    const sa = DIALS[SOLO].a + 120 * ease(Math.min(1, Math.max(0, (t - T3.single) / 0.9)));
    soloNeedle.setAttribute('transform', `rotate(${sa.toFixed(1)} ${DIALS[SOLO].x} ${DIALS[SOLO].y})`);
    // groups in the middle of a shrink or grow are pictures in motion, not layout
    const moving = (t >= T4.p1Shrink) || false;
    if (moving) part1.setAttribute('data-audit', 'ignore'); else part1.removeAttribute('data-audit');
    if (typeof part2 !== 'undefined') {
      if (t >= T4.p2Shrink && t < T4.p2Back) part2.setAttribute('data-audit', 'ignore'); else part2.removeAttribute('data-audit');
    }
  };
  const T4 = { p1Shrink: S.t('b4') - 0.6, p2Shrink: S.t('b6~large') - 0.2, p2Back: S.t('b6~Later') + 1.0 };
  const clock = { t: 0 };
  S.add(gsap.fromTo(clock, { t: 0 }, { t: S.duration, duration: S.duration, ease: 'none', immediateRender: false, onUpdate: () => paint(clock.t) }), 0);
  S.call(() => paint(0), 0);

  // ================================================================ PART 2: five rows, multiply and add
  S.add(fx.out([wall, solo, counter, cLabel, axis], { d: 0.45 }), 'b4-0.45');
  const RY = i => 280 + i * 105;
  const C2 = { inp: 300, times: 395, w: 495, chip: 650, addL: 920, addCx: 1050, addCy: 490, outCx: 1500 };
  // part 1 shrinks into row 1
  S.xset(part1, { x: 0, y: 0, s: 1, ox: P.inp, oy: EY });
  S.add(fx.xform(part1, { x: C2.inp - P.inp, y: RY(0) - EY, s: 0.66 }, { d: 0.75, ease: 'power3.inOut' }), 'b4-0.5');
  S.add(gsap.to(part1, { autoAlpha: 0, duration: 0.3 }), 'b4+0.15');

  var part2 = S.g();
  const INP = [2, 1, 5, 1, 1], WTS = CH01_VALUES.slice(0, 5), PROD = INP.map((x, i) => Math.round(x * WTS[i] * 100) / 100);
  const rows = INP.map((x, i) => {
    const g = S.g(null, part2);
    g.inp = box({ cx: C2.inp, cy: RY(i), w: 120, h: 76, tone: 'struct', text: String(x), size: 34 }, g);
    g.times = S.text('×', { x: C2.times, y: RY(i), size: 44, anchor: 'middle', color: 'compute', weight: 600 }, g);
    g.w = box({ cx: C2.w, cy: RY(i), w: 140, h: 76, tone: 'struct', text: ch01Fmt(WTS[i]), size: 32, textColor: WTS[i] < 0 ? 'violet' : 'ink' }, g);
    return g;
  });
  const colHdrIn = S.text('made-up inputs', { x: C2.inp, y: RY(0) - 74, size: 24, anchor: 'middle', color: 'muted', weight: 550 }, part2);
  const colHdrW = S.text('weights', { x: C2.w, y: RY(0) - 74, size: 24, anchor: 'middle', color: 'muted', weight: 550 }, part2);
  S.add(gsap.fromTo(rows[0], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }), 'b4+0.05');
  S.add(fx.in(rows.slice(1), { from: 'up', d: 0.45, stagger: 0.12 }), 'b4~Five+0.15');
  S.add(fx.in([colHdrIn, colHdrW], { from: 'up', d: 0.4 }), 'b4~made-up');

  // the add box and the output box, with converging arrows
  const addBox = S.g(null, part2);
  addBox.bgBox = box({ cx: C2.addCx, cy: C2.addCy, w: 270, h: 150, tone: 'compute', size: 44 }, addBox);
  addBox.bgBox.val.setAttribute('y', C2.addCy + 22);
  const addTitle = S.text('add them up', { x: C2.addCx, y: C2.addCy - 38, size: 26, anchor: 'middle', color: 'compute', weight: 650 }, addBox);
  const arrowsIn = rows.map((r, i) => S.arrow({ x1: C2.chip + 66, y1: RY(i), x2: C2.addL - 10, y2: C2.addCy + (i - 2) * 22, color: 'faint', sw: 2.5, head: 12, bend: 0 }, part2));
  // the output: part 1's dashed outline glides here, then fills in blue
  S.xset(outG, { x: 0, y: 0, s: 1, ox: P.outX, oy: EY });
  S.add(fx.xform(outG, { x: C2.outCx - P.outX, y: C2.addCy - EY, s: 1.25 }, { d: 0.8, ease: 'power3.inOut' }), 'b4-0.5');
  S.add(gsap.to(outArrow, { autoAlpha: 0, duration: 0.3 }), 'b4-0.5');
  const outFinal = S.g(null, part2);
  const outB = box({ cx: C2.outCx, cy: C2.addCy, w: 220, h: 150, tone: 'struct', size: 48 }, outFinal);
  outB.val.setAttribute('y', C2.addCy + 22);
  const outTitle = S.text('one output', { x: C2.outCx, y: C2.addCy - 38, size: 26, anchor: 'middle', color: 'struct', weight: 650 }, outFinal);
  const addToOut = S.arrow({ x1: C2.addCx + 150, y1: C2.addCy, x2: C2.outCx - 126, y2: C2.addCy, color: 'faint', sw: 3, head: 14 }, part2);
  S.add(gsap.to(outG, { autoAlpha: 0, duration: 0.35 }), 'b4+0.4');
  S.add(fx.in(outFinal, { from: 'fade', d: 0.4 }), 'b4+0.4');
  S.add(fx.in(addBox, { from: 'fade', d: 0.45 }), 'b4~Five+0.4');
  S.set([...arrowsIn, addToOut], { autoAlpha: 0 }, 0);
  S.add(gsap.set([...arrowsIn, addToOut], { autoAlpha: 1 }), 'b4~Five+0.5');
  S.add(fx.drawArrow(arrowsIn, { d: 0.5, stagger: 0.06 }), 'b4~Five+0.5');
  S.add(fx.drawArrow(addToOut, { d: 0.4 }), 'b4~Five+0.8');

  // 'multiplied': each row flashes amber and drops its product chip
  const chips = PROD.map((p, i) => {
    const c = S.pill(fmtN(p), { x: C2.chip, y: RY(i), h: 52, w: 116, size: 28, tone: 'compute', mono: true, color: p < 0 ? 'violet' : 'ink' }, part2);
    c.setAttribute('data-audit', 'ignore');   // product chips pop, then ride the arrows into the box
    return c;
  });
  rows.forEach((r, i) => {
    const at = S.t('b4~multiplied') + i * 0.22;
    S.add(gsap.fromTo([r.inp.bg, r.w.bg], { attr: { stroke: S.tone('struct') } }, { attr: { stroke: S.tone('compute') }, duration: 0.18, yoyo: true, repeat: 1 }), at);
    S.add(fx.pop(chips[i]), at + 0.15);
  });
  // 'Add': the chips ride the arrows into the box; the running total ticks
  const RUN = [0.26, -0.44, -0.34, 1.1, 0.8];
  chips.forEach((c, i) => {
    const at = S.t('b4~Add') + i * 0.28;
    S.add(gsap.fromTo(c, { x: 0, y: 0 }, { x: C2.addCx - C2.chip, y: C2.addCy + 22 - RY(i), duration: 0.5, ease: 'power2.in' }), at);
    S.add(gsap.to(c, { autoAlpha: 0, duration: 0.12 }), at + 0.45);
  });
  const runTimes = RUN.map((_, i) => S.t('b4~Add') + i * 0.28 + 0.5);
  const paintRun = t => {
    let k = -1;
    runTimes.forEach((rt, i) => { if (t >= rt) k = i; });
    addBox.bgBox.val.textContent = k < 0 ? '' : fmtN(RUN[k]);
    addBox.bgBox.val.setAttribute('fill', S.tone(k >= 0 && RUN[k] < 0 ? 'violet' : 'ink'));
    outB.val.textContent = t >= S.t('b4~point') + 0.45 ? '0.8' : '';
  };
  const clock2 = { t: 0 };
  S.add(gsap.fromTo(clock2, { t: 0 }, { t: S.duration, duration: S.duration, ease: 'none', immediateRender: false, onUpdate: () => paintRun(clock2.t) }), 0);
  // 'point': 0.8 flies into the output box
  const fly = S.text('0.8', { x: C2.addCx, y: C2.addCy + 22, size: 44, anchor: 'middle', family: 'mono', weight: 500, color: 'ink' });
  S.set(fly, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(fly, { autoAlpha: 1, x: 0 }, { x: C2.outCx - C2.addCx, duration: 0.45, ease: 'power2.inOut' }), 'b4~point');
  S.add(gsap.set(fly, { autoAlpha: 0 }), S.t('b4~point') + 0.45);
  fly.setAttribute('data-audit', 'ignore');

  // ---------------------------------------------------------------- b5: multiply, then add
  const take1 = S.takeaway('multiply, then add', { tone: 'compute' });
  S.add(fx.in(take1, { from: 'up', d: 0.5 }), 'b5~Multiply');
  const flowOrder = [...rows.map(r => r.inp), ...rows.map(r => r.w), addBox, outFinal];
  flowOrder.forEach((el, i) => S.add(fx.pulse(el, { scale: 1.06, d: 0.45 }), S.t('b5~That') + i * 0.07));
  const extra = S.text('+ a few extra steps', { x: C2.outCx, y: C2.addCy + 112, size: 26, anchor: 'middle', color: 'muted', weight: 550 }, part2);
  S.add(fx.in(extra, { from: 'up', d: 0.4 }), 'b5~extra');

  // ---------------------------------------------------------------- b6: at enormous scale, a stack of layers
  S.add(gsap.to(extra, { autoAlpha: 0, duration: 0.3 }), 'b6');
  S.xset(part2, { x: 0, y: 0, s: 1, ox: 900, oy: 490 });
  S.add(fx.xform(part2, { x: 960 - 900, y: 520 - 490, s: 0.05 }, { d: 0.7, ease: 'power3.in' }), 'b6~large-0.1');
  S.add(gsap.to(part2, { autoAlpha: 0, duration: 0.2 }), S.t('b6~large') + 0.5);
  // the sheet: hundreds of identical cells
  const sheet = S.g();
  sheet.setAttribute('data-audit', 'ignore');
  const SC = { cols: 22, rows: 9, w: 40, h: 28, gap: 6 };
  const sw = SC.cols * (SC.w + SC.gap) - SC.gap, sh = SC.rows * (SC.h + SC.gap) - SC.gap;
  const cells = [];
  for (let r = 0; r < SC.rows; r++) for (let c = 0; c < SC.cols; c++) {
    const x = 960 - sw / 2 + c * (SC.w + SC.gap), y = 520 - sh / 2 + r * (SC.h + SC.gap);
    const cg = S.g(null, sheet);
    S.rect({ x, y, w: SC.w, h: SC.h, r: 5, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.55, sw: 1 }, cg);
    S.path({ d: `M${x + 7},${y + 7} L${x + 26},${y + 14} M${x + 7},${y + 14} L${x + 26},${y + 14} M${x + 7},${y + 21} L${x + 26},${y + 14}`, stroke: 'compute', sw: 1.4, strokeOpacity: 0.9 }, cg);
    S.circle({ x: x + 31, y: y + 14, r: 3, fill: 'compute' }, cg);
    cg.d = Math.hypot(c - SC.cols / 2, r - SC.rows / 2);
    cells.push(cg);
  }
  S.add(gsap.fromTo(cells, { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' },
    { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power2.out', stagger: (i, el) => el.d * 0.09 }), S.t('b6~large') + 0.45);
  const sheetLbl = S.text('this pattern, at enormous scale', { x: 960, y: 520 + sh / 2 + 50, size: 28, anchor: 'middle', color: 'muted', weight: 550 });
  S.add(fx.in(sheetLbl, { from: 'up', d: 0.4 }), 'b6~chatbot-0.3');
  // 'stack': the sheet becomes a tower of thin layers
  S.add(gsap.to([sheet, sheetLbl], { autoAlpha: 0, duration: 0.4 }), 'b6~stack-0.1');
  const tower = S.g();
  const slabs = [];
  for (let k = 0; k < 10; k++) {
    const y = 760 - k * 46, x0 = 960 - 330, x1 = 960 + 230, dx = 100, dy = 46;
    const sg = S.g(null, tower);
    S.path({ d: `M${x0},${y} L${x1},${y} L${x1 + dx},${y - dy} L${x0 + dx},${y - dy} Z`, fill: 'url(#card-struct)', stroke: 'struct', sw: 1.5, strokeOpacity: 0.8 }, sg);
    S.path({ d: `M${x0},${y} L${x1},${y} L${x1},${y + 10} L${x0},${y + 10} Z`, fill: 'struct', fillOpacity: 0.55 }, sg);
    S.path({ d: `M${x1},${y} L${x1 + dx},${y - dy} L${x1 + dx},${y - dy + 10} L${x1},${y + 10} Z`, fill: 'struct', fillOpacity: 0.35 }, sg);
    for (let j = 1; j < 8; j++) S.line({ x1: x0 + j * (x1 - x0) / 8, y1: y, x2: x0 + dx + j * (x1 - x0) / 8, y2: y - dy, stroke: 'struct', sw: 1, strokeOpacity: 0.35 }, sg);
    slabs.push(sg);
  }
  tower.setAttribute('data-audit', 'ignore');
  S.add(gsap.fromTo(slabs, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power3.out', stagger: 0.1 }), 'b6~stack');
  const layersLbl = S.text('layers', { x: 1390, y: 560, size: 36, anchor: 'start', color: 'struct', weight: 650 });
  const laterTag = S.text('opened up later', { x: 1390, y: 610, size: 26, anchor: 'start', color: 'muted', weight: 550 });
  const tBrace = S.path({ d: 'M1350,780 l14,0 L1364,300 l-14,0', stroke: 'muted', sw: 2.5 });
  S.add(fx.draw(tBrace, { d: 0.5 }), 'b6~layers');
  S.add(fx.in([layersLbl, laterTag], { from: 'left', d: 0.45, stagger: 0.1 }), 'b6~layers');
  // 'Later': the tower collapses back into the diagram
  S.add(gsap.to(slabs.slice().reverse(), { autoAlpha: 0, y: 30, duration: 0.25, stagger: 0.04 }), 'b6~Later-0.2');
  S.add(fx.out([layersLbl, laterTag, tBrace], { d: 0.3 }), 'b6~Later-0.2');
  S.add(fx.xform(part2, { x: 0, y: 0, s: 1 }, { d: 0.7, ease: 'power3.out' }), 'b6~Later+0.2');
  S.add(gsap.to(part2, { autoAlpha: 1, duration: 0.3 }), 'b6~Later+0.2');
  // 'multiplies': one multiply and one add beside each weight
  const pairs = rows.map((r, i) => S.text('× +', { x: C2.w + 96, y: RY(i), size: 26, anchor: 'start', color: 'compute', weight: 700 }, part2));
  S.add(fx.in(pairs, { from: 'left', d: 0.3, stagger: 0.12 }), 'b6~multiplies');
  const take2 = S.takeaway('each weight: one multiply, one add', { tone: 'compute' });
  S.add(fx.out(take1, { d: 0.3 }), 'b6~multiplies-0.3');
  S.add(fx.in(take2, { from: 'up', d: 0.45 }), 'b6~multiplies');
});
