/* ch12_s02 · both phases on the roofline (fig 129)
   The H100 roofline in ch11's storyboard geometry (libRoofline defaults: 250 px per decade on both axes,
   intensity 1 at x 320, 1 trillion/s at y 900): decode (320, 769), ridge (938, 151), prefill (1145, 151).
   A sidebar (x 1400–1820) shows what each phase leaves busy and idle.
   b1  prefill drops onto the flat ceiling, × 7 right of the ridge; gauges: arithmetic 100%, bus ≈ 15%
   b2  decode drops onto the slope, × 295 left of the ridge, reads 3.35 trillion/s; gauges: bus ≈ 100%, arithmetic 0.34%
   b3  ch05's thesis bar returns: under 1% arithmetic, the rest 'waiting for weights'; an hourglass on decode
   b4  the two points, × 2,000 apart; a teal arrow up the slope: move the left one rightward
   Numbers (checked in Python): ridge 989 / 3.35 = 295.2; 2,000 / 295 = 6.8 ≈ 7; decode arithmetic busy
   3.35 / 989 = 0.339% → '0.34%'; prefill bus busy (989 / 2,000) / 3.35 = 14.8% → '≈ 15%'. */
V.scene('ch12_s02', S => {
  const { fx } = S;
  const at = spec => S.t(spec);

  // ================================================================ seek-safe drivers (one clock, as in s01)
  const drivers = [];
  const drive = f => drivers.push(f);
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const prog = (t, a, b) => clamp01((t - a) / (b - a));
  const e2io = p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  const e3o = p => 1 - Math.pow(1 - p, 3);
  const hideEl = e => { if (e) { e.style.visibility = 'hidden'; e.style.opacity = 0; } };

  // ================================================================ the roofline, in its starting state
  const chartG = S.g();
  const R = libRoofline(S, { yticks: [1, 10, 100], show: { roof: true, regions: true, ridge: true } }, chartG);
  // region tints stay, their words do not; the ridge keeps its marker and dashed drop, and is named on the tick row
  hideEl(R.regionLabels.memory); hideEl(R.regionLabels.compute);
  hideEl(R.ridgeEl.label); hideEl(R.ridgeEl.tag); hideEl(R.ridgeEl.tagBg);
  const RX = R.ridgeX, RY = R.ridgeY;                       // 937.5, 151.2
  const XP = R.X(2000), XD = R.X(1), YD = R.roofY(1);       // 1145.3; 320, 768.7
  S.text([{ t: 'ridge, ' }, { t: '295', f: 'mono' }], { x: RX, y: R.b + 36, size: 24, anchor: 'middle', weight: 600, color: 'ink' }, chartG);
  S.text([{ t: '989', f: 'mono' }, { t: ' trillion/s' }], { x: 1180, y: 130, size: 24, weight: 600, color: 'compute' }, chartG);
  S.text('H100', { x: 340, y: 142, size: 28, anchor: 'middle', weight: 600, color: 'muted' }, chartG);

  // ================================================================ the two workloads
  const pre = R.point(2000, { label: 'prefill, intensity 2,000', labelSide: 'below' });
  const dec = R.point(1, { label: 'decode, intensity 1' });

  // brackets measuring distance along the intensity axis
  const br7 = R.bracket(R.ridgeI, 2000, { y: 116, label: '× 7' });          // above the flat ceiling
  const br295 = R.bracket(1, R.ridgeI, { y: 870, label: '× 295' });
  const br2000 = R.bracket(1, 2000, { y: 870, label: '× 2,000' });

  // decode's speed read off the vertical axis: a dotted guide and a two-line coral tag left of the axis
  const decGuide = dec.guide('y', {});
  const decTag = S.g();
  const tagNum = S.text('3.35', { x: R.l - 15, y: YD - 4, size: 26, anchor: 'end', family: 'mono', weight: 600, color: 'bytes' }, decTag);
  const tagUnit = S.text('trillion/s', { x: R.l - 15, y: YD + 24, size: 24, anchor: 'end', weight: 550, color: 'bytes' }, decTag);

  // ================================================================ sidebar: what is busy, what is idle
  const SB = { l: 1400, r: 1820 };
  const GW = SB.r - SB.l;
  const defs = S.el('defs', null, S.main);
  const pat = S.el('pattern', { id: 'ch12s02-hatch', width: 9, height: 9, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  S.rect({ x: 0, y: 0, w: 3, h: 9, fill: 'muted', fillOpacity: 0.42 }, pat);

  /** A phase header: a coloured dot and the phase name. */
  function header(name, tone) {
    const g = S.g();
    S.circle({ x: SB.l + 10, y: 205, r: 10, fill: tone, stroke: '#060a14', sw: 2 }, g);
    S.text(name, { x: SB.l + 32, y: 206, size: 34, weight: 700, color: tone }, g);
    return g;
  }
  const headP = header('prefill', 'compute');
  const headD = header('decode', 'bytes');

  /** A horizontal gauge: label and readout on one row, a 30 px bar under it; busy part solid, idle part hatched. */
  function gauge(label, tone, ly) {
    const g = S.g();
    const by = ly + 22, bh = 30;
    S.text(label, { x: SB.l, y: ly, size: 28, weight: 550, color: 'ink' }, g);
    const readout = S.text('', { x: SB.r, y: ly, size: 30, weight: 600, family: 'mono', anchor: 'end', color: tone }, g);
    const approx = S.text('≈', { x: SB.r, y: ly, size: 30, weight: 600, anchor: 'end', color: tone }, g);   // sans: mono pads it
    S.rect({ x: SB.l, y: by, w: GW, h: bh, r: 6, fill: '#ffffff', fillOpacity: 0.035, stroke: '#ffffff', strokeOpacity: 0.16, sw: 1.5 }, g);
    const idle = S.rect({ x: SB.r, y: by + 1, w: 0, h: bh - 2, r: 5, fill: 'url(#ch12s02-hatch)' }, g);
    const busy = S.rect({ x: SB.l, y: by, w: 0, h: bh, r: 6, fill: `url(#solid-${tone})` }, g);
    const flash = S.rect({ x: SB.l, y: by, w: GW, h: bh, r: 6, fill: '#ffffff', fillOpacity: 0.32 }, g);
    flash.setAttribute('data-audit', 'ignore');
    hideEl(flash);
    /** f: busy fraction (0..1); idleOp: opacity of the hatched idle part; txt: the readout ('' = none); ap: prefix '≈' */
    const set = (f, idleOp, txt, ap) => {
      const w = f <= 0 ? 0 : Math.max(3, f * GW);
      busy.setAttribute('width', w.toFixed(2));
      const ix = SB.l + w + (w > 0 ? 2 : 0), iw = Math.max(0, SB.r - ix);
      idle.setAttribute('x', ix.toFixed(2));
      idle.setAttribute('width', iw.toFixed(2));
      idle.setAttribute('opacity', idleOp.toFixed(3));
      if (readout.textContent !== txt) {
        readout.textContent = txt;
        approx.setAttribute('x', (SB.r - S.measure(txt, { size: 30, weight: 600, family: 'mono' }) - 9).toFixed(1));
      }
      approx.setAttribute('opacity', ap && txt ? 1 : 0);
    };
    return { g, set, busy, idle, flash, readout, by, bh };
  }
  const gA = gauge('arithmetic busy', 'compute', 290);
  const gB = gauge('bus busy', 'bytes', 400);
  hideEl(headD);
  // the key to the hatching: idle
  const idleKey = S.g();
  S.rect({ x: SB.l, y: 487, w: 44, h: 22, r: 4, fill: '#ffffff', fillOpacity: 0.035, stroke: '#ffffff', strokeOpacity: 0.16, sw: 1.5 }, idleKey);
  S.rect({ x: SB.l + 1, y: 488, w: 42, h: 20, r: 3, fill: 'url(#ch12s02-hatch)' }, idleKey);
  S.text('idle', { x: SB.l + 58, y: 498, size: 26, weight: 550, color: 'muted' }, idleKey);

  // the busy fractions, as functions of scene time
  const A_DEC = 3.35 / 989, B_PRE = (989 / 2000) / 3.35;       // 0.00339, 0.148
  const tA1 = at('b1~arithmetic') - 0.1, dA1 = 0.8;            // fills to 100%
  const tB1 = at('b1~bandwidth') - 0.1, dB1 = 0.7;             // fills to ≈ 15%, stops
  const tB2 = at('b2~bus') - 0.05, dB2 = 1.1;                  // fills to ≈ 100%
  const tA2 = at('b2~under') - 0.12, dA2 = 0.95;               // drains to 0.34%
  const pctA = v => (v >= 9.95 ? `${Math.round(v)}%` : v >= 0.995 ? `${v.toFixed(1)}%` : `${v.toFixed(2)}%`);
  drive(t => {
    let f = 0;
    if (t >= tA1) f = e3o(prog(t, tA1, tA1 + dA1));
    if (t >= tA2) f = 1 + (A_DEC - 1) * e2io(prog(t, tA2, tA2 + dA2));
    gA.set(f, t >= tA2 ? 1 : 0, t >= tA1 ? pctA(f * 100) : '');
  });
  drive(t => {
    let f = 0;
    if (t >= tB1) f = B_PRE * e3o(prog(t, tB1, tB1 + dB1));
    if (t >= tB2) f = B_PRE + (1 - B_PRE) * e2io(prog(t, tB2, tB2 + dB2));
    const idleOp = prog(t, tB1 + dB1 - 0.05, tB1 + dB1 + 0.3);
    gB.set(f, idleOp, t >= tB1 ? `${Math.round(f * 100)}%` : '', true);
  });

  // ================================================================ b3's thesis bar (ch05), redrawn small in the sidebar
  const TB = { y: 620, h: 60, sliver: 2 };
  const thesisG = S.g();
  const barG = S.g(null, thesisG);
  S.rect({ x: SB.l, y: TB.y - TB.h / 2, w: TB.sliver, h: TB.h, r: 1, fill: 'compute' }, barG);
  const coral = S.rect({ x: SB.l + TB.sliver + 1, y: TB.y - TB.h / 2, w: GW - TB.sliver - 1, h: TB.h, r: 6, fill: 'url(#solid-bytes)' }, barG);
  const tagG = S.g(null, thesisG);
  S.line({ x1: SB.l + 1, y1: TB.y + TB.h / 2 + 6, x2: SB.l + 1, y2: TB.y + TB.h / 2 + 26, stroke: 'compute', sw: 2, strokeOpacity: 0.8 }, tagG);
  S.text('arithmetic, under 1%', { x: SB.l - 5, y: TB.y + TB.h / 2 + 48, size: 26, weight: 600, color: 'compute' }, tagG);
  const waitLbl = S.text('waiting for weights', { x: SB.l + TB.sliver + 1 + (GW - TB.sliver - 1) / 2, y: TB.y + 1, size: 30, weight: 650, anchor: 'middle', color: 'ink' }, thesisG);
  const sw = libStopwatch(S, { x: SB.l + 38, y: TB.y - TB.h / 2 - 62, size: 76, value: 30, readout: 'right', readoutSize: 28, tone: 'neutral' }, thesisG);
  hideEl(barG); hideEl(tagG);

  // ================================================================ the hourglass that settles on decode (drawn, seek-safe sand)
  const HG = { x: XD - 26, y: YD - 50 };
  const hgHold = S.g();
  const hg = S.g(null, hgHold);
  const hx = HG.x, hy = HG.y;
  S.path({ d: `M${hx - 14},${hy - 21} L${hx + 14},${hy - 21} L${hx + 3},${hy} L${hx + 14},${hy + 21} L${hx - 14},${hy + 21} L${hx - 3},${hy} Z`, fill: '#0c1326', stroke: 'ink', sw: 2.5, join: 'round' }, hg);
  const sandTop = S.path({ d: '', fill: 'bytes' }, hg);
  const sandBot = S.path({ d: '', fill: 'bytes' }, hg);
  const stream = S.line({ x1: hx, y1: hy, x2: hx, y2: hy + 18, stroke: 'bytes', sw: 1.6, cap: 'butt' }, hg);
  S.rect({ x: hx - 19, y: hy - 27, w: 38, h: 6, r: 3, fill: 'ink' }, hg);
  S.rect({ x: hx - 19, y: hy + 21, w: 38, h: 6, r: 3, fill: 'ink' }, hg);
  hideEl(hg);
  S.xset(hgHold, { s: 1.2, ox: hx, oy: hy + 27 });          // drawn at 1.0, shown 20% larger, standing on its base
  const tH0 = at('b3~able') - 0.05, tH1 = at('b4') + 1.0;
  drive(t => {
    const k = 0.25 + 0.6 * prog(t, tH0 + 0.4, tH1);           // fraction of the sand already run through
    const ys = hy - 17 + 14 * k, a = Math.max(0, (hy - 2 - ys) * 10 / 15);
    sandTop.setAttribute('d', k < 0.999 ? `M${hx - a},${ys.toFixed(2)} L${hx + a},${ys.toFixed(2)} L${hx},${hy - 1} Z` : '');
    const yp = hy + 19 - 12 * Math.sqrt(k), b = 3 + 8 * Math.sqrt(k);
    sandBot.setAttribute('d', `M${hx - 11},${hy + 19} L${hx + 11},${hy + 19} L${hx + b * 0.35},${yp.toFixed(2)} L${hx - b * 0.35},${yp.toFixed(2)} Z`);
    stream.setAttribute('y2', (yp - 1).toFixed(2));
    stream.setAttribute('opacity', t > tH0 + 0.4 && k < 0.85 ? 1 : 0);
  });

  // ================================================================ b1 · prefill, seven times right of the ridge
  S.add(pre.in({ d: 0.7 }), 'b1~prefill-0.45');
  S.add(br7.in({ d: 0.6 }), 'b1~seven-0.15');
  // the sidebar slides in, empty: the phase it describes, two gauges
  S.add(fx.in([headP, gA.g, gB.g], { from: 'left', d: 0.6, stagger: 0.1 }), 'b1~right+0.05');
  S.add(fx.in(idleKey, { from: 'fade', d: 0.4 }), 'b1~spare');
  S.add(gsap.fromTo(gA.flash, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22, yoyo: true, repeat: 1, ease: 'sine.inOut' }), 'b1~flat-0.05');

  // ================================================================ b2 · decode, three hundred times left, low on the slope
  S.add(br7.out({ d: 0.35 }), 'b1>-0.1');
  S.add(dec.in({ d: 0.7 }), 'b2~Decode-0.4');
  S.add(br295.in({ d: 0.7 }), 'b2~nearly-0.1');
  S.add(decGuide.in({ d: 0.45 }), 'b2~low-0.15');
  S.add(fx.type(tagNum, { d: 0.3 }), 'b2~low+0.15');
  S.add(fx.type(tagUnit, { d: 0.4 }), 'b2~low+0.4');
  S.add(gsap.fromTo(R.glow.slope, { autoAlpha: 0 }, { autoAlpha: 0.95, duration: 0.4, yoyo: true, repeat: 1, ease: 'sine.inOut' }), 'b2~slanted-0.1');
  // the gauges switch to decode
  S.add(fx.out(headP, { to: 'up', d: 0.3, dist: 14 }), 'b2~bus-0.5');
  S.add(fx.in(headD, { from: 'up', d: 0.45, dist: 14 }), 'b2~bus-0.15');
  S.add(fx.dim(pre, { to: 0.4, d: 0.5 }), 'b2~bus-0.4');

  // ================================================================ b3 · where the ninety-nine percent went
  S.add(fx.out([headD, gA.g, gB.g, idleKey], { d: 0.4, stagger: 0.05 }), 'b3-0.35');
  S.add(br295.out({ d: 0.35 }), 'b3-0.35');
  S.add(fx.in(barG, { from: 'left', d: 0.7 }), 'b3+0.05');
  S.add(sw.in({ d: 0.5 }), 'b3+0.25');
  S.add(fx.in(tagG, { from: 'up', d: 0.5, dist: 14 }), 'b3+0.45');
  S.add(fx.type(waitLbl, { d: 0.75 }), 'b3~ninety-0.05');
  S.add(R.glowRoof({ d: 1.0 }), 'b3~Nothing-0.05');
  S.add(fx.pulse(dec.dropper, { scale: 1.35, d: 0.5 }), "b3~workload's-0.05");
  S.add(fx.in(hg, { from: 'down', d: 0.55, dist: 26, ease: 'back.out(2)' }), 'b3~able-0.2');
  S.add(R.tint('memory', 2.5, { d: 0.9 }), 'b3~able');

  // ================================================================ b4 · two points, two thousand times apart
  // only the axes, the ceilings, the ridge and the two labelled dots remain; the picture slides to centre
  S.add(fx.out([barG, tagG, waitLbl, sw], { d: 0.35, stagger: 0.02 }), 'b3>');
  S.add(fx.out(hgHold, { d: 0.35 }), 'b3>');
  S.add(decGuide.out({ d: 0.35 }), 'b3>');
  S.add(fx.out(decTag, { d: 0.35 }), 'b3>');
  S.add(R.tint('memory', 1, { d: 0.6 }), 'b3>');
  S.add(fx.undim(pre, { d: 0.5 }), 'b3>+0.25');
  S.add(fx.cam({ x: 760, y: 540, scale: 1, d: 1.1, ease: 'power2.inOut' }), 'b3>+0.25');
  S.add(fx.pulse([pre.dropper, dec.dropper], { scale: 1.3, d: 0.5 }), 'b4~points-0.1');
  S.add(br2000.in({ d: 0.8 }), 'b4~two thousand+0.1');
  const arrow = R.arrowAlong(1, 165, { tone: 'helps', sw: 5 });
  hideEl(arrow.line); hideEl(arrow.head);
  S.add(arrow.draw({ d: 1.2 }), 'b4~move-0.15');

  // ================================================================ the clock that runs every driver
  const clock = { t: 0 };
  S.tl.fromTo(clock, { t: 0 }, { t: S.duration, duration: S.duration, ease: 'none', immediateRender: true,
    onUpdate: () => drivers.forEach(f => f(clock.t)) }, 0);
  drivers.forEach(f => f(0));
});
