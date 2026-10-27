/* ch12_s03 · the hard throughput ceiling (fig 130)
   Decode's position turned into a speed limit: max tokens per second = bandwidth ÷ bytes per token.
   Centre-right, a GPU package: an amber die (libChip) between two coral HBM stacks, a bus conduit each side
   (libByteStream) with particles at one steady speed, and a ring round the die that fills as the bytes arrive.
   One full ring = one 140 GB crossing = one token: a blue pill pops out of the die and arcs into the tray on
   the left. The ring runs about 29 times slower than the real 41.8 ms ('slowed down'); the counter under the
   tray always shows the true rate, 23.9 tokens a second.
   b1  the equation builds term by term (ch12Ceiling), the 30 ms callout flips, the numbers land: ≈ 24 tokens/s
   b2  a faster kernel: arithmetic 0.14 ms → 0 ms, and nothing changes; the die just waits for bytes
   b3  the bus is the limit; a ceiling locks over the tray; the three conditions land under their terms */
V.scene('ch12_s03', {
  fadeOut: false,                                  // s04 opens on this scene's last frame
  build: S => {
  const { fx } = S;
  const at = spec => S.t(spec);

  // ================================================================ layout (all in one place)
  // the equation band and the picture under it (y 150-820) sit 100 px lower, by camera, so the whole is centred
  S.xset(S.camera, { x: 0, y: 100, s: 1 });
  const DIE = { x: 1250, y: 560, size: 240 };               // libChip body 240 + pins: about 275 px across
  const RING = { r: 175, sw: 10 };                          // clears the die's pins (≈ 158 px) by 17 px
  const STK = { w: 90, h: 220, y: 450, lcx: 960, rcx: 1540 };
  const BUS = { w: 72, lx1: STK.lcx + STK.w / 2, lx2: 1112, rx1: STK.rcx - STK.w / 2, rx2: 1388 };
  const TRAY = { l: 140, r: 620, t: 520, b: 600, cy: 560 };
  const SLOT = { x0: 174, pitch: 36, n: 12 };               // pill centres 174 … 570
  const PILL = { w: 26, h: 40 };
  const CYCLE = 1.2;                                        // one ring per 1.2 s (real: 41.8 ms, ≈ 29× faster)
  const FLIGHT = 1.0;                                       // die → tray
  // the ring is phased so that a ring completes just after 'twenty-four': the first pill leaves on the word
  const R0 = at('b1~twenty') + 0.1 - 12 * CYCLE;            // ≈ 1.29 s, as the first bytes reach the die
  const PILL0 = 12;                                         // completions before it reset the ring only

  // ================================================================ seek-safe drivers (as in ch12_s01)
  const drivers = [];
  const drive = f => drivers.push(f);
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const smooth = p => p * p * (3 - 2 * p);
  const sineIO = p => 0.5 - 0.5 * Math.cos(Math.PI * p);
  const hide = e => { e.style.opacity = 0; e.style.visibility = 'hidden'; };
  const drawOn = (el, o = {}) => {
    const tl = gsap.timeline();
    tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, ease: 'none' }, 0);
    tl.fromTo(el, { drawSVG: o.from || '0%' }, { drawSVG: '100%', duration: o.d ?? 0.5, ease: o.ease || 'power2.inOut' }, 0);
    return tl;
  };
  /** A grey outlined tag, like the chapter's condition chips. */
  const greyTag = (text, x, y, parent) => {
    const g = S.g(null, parent);
    const size = 26, h = 44, w = S.measure(text, { size, weight: 550 }) + 36;
    S.rect({ x: x - w / 2, y: y - h / 2, w, h, r: h / 2, fill: '#0c1326' }, g);
    g.bg = S.rect({ x: x - w / 2, y: y - h / 2, w, h, r: h / 2, stroke: 'muted', sw: 2, strokeOpacity: 0.7 }, g);
    g.label = S.text(text, { x, y: y + 1, size, weight: 550, anchor: 'middle', color: 'muted' }, g);
    return Object.assign(g, { w, h, l: x - w / 2, r: x + w / 2 });
  };

  // ================================================================ layers (z-order)
  const busG = S.g(), ringG = S.g(), pkgG = S.g(), dieFx = S.g(), labelG = S.g(), trayG = S.g(), pillG = S.g(), topG = S.g();

  // ================================================================ the package
  // the two bus conduits (drawn first, so their ends tuck under the stacks and the die)
  const busL = libByteStream(S, { x1: BUS.lx1, y1: DIE.y, x2: BUS.lx2, width: BUS.w, rate: null, source: false, sink: false }, busG);
  const busR = libByteStream(S, { x1: BUS.rx1, y1: DIE.y, x2: BUS.rx2, width: BUS.w, rate: null, source: false, sink: false }, busG);
  const buses = [busL, busR];
  // a coral bloom on the walls, for b3 ('the limit')
  const busGlow = buses.map(b => {
    const gg = S.g(null, busG);
    const x0 = Math.min(b.start[0], b.end[0]) - 6, x1 = Math.max(b.start[0], b.end[0]) + 6;
    [-1, 1].forEach(sg => S.line({ x1: x0, y1: DIE.y + sg * BUS.w / 2, x2: x1, y2: DIE.y + sg * BUS.w / 2, stroke: 'bytes', sw: 4, cap: 'butt' }, gg)
      .setAttribute('filter', 'url(#glow-bytes)'));
    gg.setAttribute('data-audit', 'ignore');
    hide(gg);
    return gg;
  });
  // HBM stacks
  const stacks = [STK.lcx, STK.rcx].map(cx => libMemBlock(S, { x: cx - STK.w / 2, y: STK.y, w: STK.w, h: STK.h, style: 'stack', label: 'HBM', size: 26, layers: 7 }, pkgG));
  // the die: dim amber ('on')
  const die = libChip(S, { x: DIE.x, y: DIE.y, size: DIE.size, tone: 'compute', state: 'on', seed: 12 }, pkgG);
  // the ring: a faint track, a coral fill that grows with the bytes, a bright head, a flash at each completion
  const C = 2 * Math.PI * RING.r;
  const ringTrack = S.circle({ x: DIE.x, y: DIE.y, r: RING.r, stroke: '#ffffff', strokeOpacity: 0.09, sw: RING.sw }, ringG);
  const ringFill = S.circle({ x: DIE.x, y: DIE.y, r: RING.r, stroke: 'bytes', sw: RING.sw }, ringG);
  ringFill.setAttribute('transform', `rotate(-90 ${DIE.x} ${DIE.y})`);
  ringFill.setAttribute('stroke-linecap', 'round');
  const ringFlash = S.circle({ x: DIE.x, y: DIE.y, r: RING.r, stroke: '#ffd0d0', sw: RING.sw }, ringG);
  const ringHead = S.circle({ x: DIE.x, y: DIE.y - RING.r, r: 22, fill: 'url(#pglow-bytes)' }, ringG);
  const ringGlow = S.circle({ x: DIE.x, y: DIE.y, r: RING.r, stroke: 'bytes', sw: RING.sw + 4 }, ringG);
  ringGlow.setAttribute('filter', 'url(#glow-bytes)');
  [ringFill, ringFlash, ringHead, ringGlow].forEach(e => e.setAttribute('data-audit', 'ignore'));
  ringGlow.style.opacity = 0;
  // the die's own flash at each completion (the arithmetic on the bytes that arrived)
  const B = die.body;
  const dieFlash = S.rect({ x: B.x, y: B.y, w: B.w, h: B.h, r: DIE.size * 0.12, fill: 'compute' }, dieFx);
  dieFlash.setAttribute('data-audit', 'ignore');

  // the package enters
  S.add(fx.in(stacks, { from: 'fade', d: 0.6, stagger: 0.1 }), 0.15);
  S.add(die.drawOn({ d: 1.0 }), 0.2);
  S.add(fx.in([busL, busR], { from: 'fade', d: 0.5 }), 0.4);
  S.add(drawOn(ringTrack, { d: 0.8, ease: 'power2.out' }), 0.55);
  // particles at one steady speed, from the start to the end of the scene
  buses.forEach(b => b.flow(0.45, S.duration, { speed: 140, every: 0.1, lanes: 3, size: 6 }));
  // 'Decode's top speed': the conduits brighten (the die stays dim amber)
  buses.forEach(b => {
    S.set(b.body, { opacity: 0.45 }, 0);
    S.add(gsap.fromTo(b.body, { opacity: 0.45 }, { opacity: 1, duration: 0.6, ease: 'power2.out', immediateRender: false }), 'b1~top-0.15');
    S.add(gsap.fromTo(b.walls, { attr: { 'stroke-opacity': 0.45 } }, { attr: { 'stroke-opacity': 1 }, duration: 0.6, ease: 'power2.out' }), 'b1~top-0.15');
  });

  // ring tags: what a ring is, and that it is slowed down
  const ringTag = S.text([{ t: '1 ring = ', c: 'muted' }, { t: '140 GB', c: 'bytes', w: 650 }], { x: 1084, y: 412, size: 26, weight: 550, anchor: 'end' }, labelG);
  const slowTag = S.text('slowed down', { x: 1460, y: 412, size: 26, weight: 550, color: 'muted' }, labelG);
  S.add(fx.in(ringTag, { from: 'right', d: 0.5, dist: 16 }), 'b1~gigabytes-0.3');
  S.add(fx.in(slowTag, { from: 'left', d: 0.5, dist: 16 }), 'b1~gigabytes+0.3');

  // ================================================================ the equation (top band)
  const E = ch12Ceiling(S, {}, topG);
  S.add(E.enter('rate'), "b1~Decode's+0.3");
  S.add(E.enter('eq'), 'b1~bandwidth-0.3');
  S.add(E.enter('bw'), 'b1~bandwidth-0.12');
  S.add(E.enter('div'), 'b1~over-0.15');
  S.add(E.enter('bpt'), 'b1~bytes-0.15');

  // ---------------------------------------------------------------- the 30 ms callout, flipped
  const CO = { x: 1446, y1: 292, y2: 345 };
  const callG = S.g(null, topG);
  const watch = libStopwatch(S, { x: 1410, y: CO.y1 + 2, size: 46, readout: 'none', tone: 'bytes', value: 30, buttons: true }, callG);
  const coLine = S.text([{ t: '≈ 30 ms', c: 'ink', w: 650 }, { t: ' per token · H200', c: 'muted' }], { x: CO.x, y: CO.y1, size: 26, weight: 550 }, callG);
  const fA = S.text('bytes ÷ bandwidth', { x: CO.x, y: CO.y2, size: 28, weight: 600, color: 'bytes' }, callG);
  const fB = S.text('bandwidth ÷ bytes', { x: CO.x, y: CO.y2, size: 28, weight: 600, color: 'bytes' }, callG);
  hide(fB);
  S.add(watch.in({ d: 0.5 }), 'b1~thirty-0.2');
  S.add(fx.in(coLine, { from: 'left', d: 0.5, dist: 16 }), 'b1~thirty');
  S.add(fx.in(fA, { from: 'up', d: 0.45, dist: 12 }), 'b1~division-0.3');
  // 'flipped': a half turn about the formula's own centre line
  const flip = gsap.timeline();
  flip.fromTo(fA, { scaleY: 1, transformOrigin: '50% 50%' }, { scaleY: 0, duration: 0.2, ease: 'power2.in', transformOrigin: '50% 50%' }, 0);
  flip.set(fA, { autoAlpha: 0 }, 0.2);
  flip.fromTo(fB, { autoAlpha: 1, scaleY: 0, transformOrigin: '50% 50%' }, { autoAlpha: 1, scaleY: 1, duration: 0.24, ease: 'power2.out', transformOrigin: '50% 50%' }, 0.2);
  S.add(flip, 'b1~flipped-0.1');
  // a white curved arrow from the flipped formula to the equation's 'bandwidth ÷ bytes per token'
  const arrow = S.arrow({ x1: CO.x - 14, y1: CO.y2 + 6, x2: 960, y2: 238, bend: -46, color: 'ink', sw: 2.5, head: 13 }, callG);
  hide(arrow.line); if (arrow.head) hide(arrow.head);
  S.add(fx.drawArrow(arrow, { d: 0.6 }), 'b1~flipped+0.3');

  // ---------------------------------------------------------------- the what-if tag (H100: 140 GB needs two chips)
  const wiText = 'H100: a what-if, needs 2 chips';
  const wiW = S.measure(wiText, { size: 26, weight: 550 });
  const whatIf = S.text(wiText, { x: 400 - wiW / 2, y: 270, size: 26, weight: 550, color: 'muted' }, topG);
  S.add(fx.type(whatIf, { d: 0.9 }), 'b1~pretending-0.05');

  // ---------------------------------------------------------------- the numbers, then the result
  S.add(E.morph('bw', { d: 0.55 }), 'b1~three-0.2');
  S.add(E.morph('bpt', { d: 0.55 }), 'b1~hundred and-0.25');
  S.add(E.showResult({ d: 0.7 }), 'b1~twenty-0.2');

  // ================================================================ the tray and the counter
  const trayFill = S.rect({ x: TRAY.l, y: TRAY.t, w: TRAY.r - TRAY.l, h: TRAY.b - TRAY.t, r: 16, fill: '#ffffff', fillOpacity: 0.035 }, trayG);
  const trayEdge = S.path({ d: `M${TRAY.r},${TRAY.t} H${TRAY.l + 16} Q${TRAY.l},${TRAY.t} ${TRAY.l},${TRAY.t + 16} V${TRAY.b - 16} Q${TRAY.l},${TRAY.b} ${TRAY.l + 16},${TRAY.b} H${TRAY.r}`, stroke: 'faint', sw: 2.5 }, trayG);
  const counter = S.counter({ x: 380, y: 664, size: 60, value: 0, fmt: S.fmt.fixed(1), anchor: 'middle', color: 'struct' }, trayG);
  const cLabel = S.text('tokens per second', { x: 380, y: 720, size: 26, weight: 550, anchor: 'middle', color: 'muted' }, trayG);
  [trayFill, counter, cLabel].forEach(hide);
  const tTray = at('b1~twenty') - 0.15;
  S.add(fx.in(trayFill, { from: 'fade', d: 0.5 }), tTray);
  S.add(drawOn(trayEdge, { d: 0.6 }), tTray);
  S.add(fx.in([counter, cLabel], { from: 'up', d: 0.5, stagger: 0.08 }), tTray + 0.35);
  S.add(fx.count(counter, 0, 23.9, { d: 1.1, ease: 'power2.out' }), tTray + 0.55);

  // ================================================================ b2 · a faster kernel changes nothing
  S.add(fx.out([callG, whatIf], { d: 0.4, stagger: 0.04 }), 'b2-0.15');
  const kTag = greyTag('faster kernel', DIE.x, 780, labelG);
  hide(kTag);
  S.add(fx.in(kTag, { from: 'up', d: 0.5, dist: 14 }), 'b2~no-0.05');
  S.add(die.busy({ d: 0.45, spread: 0.5 }), 'b2~no');
  S.add(die.pulse({ d: 0.6, scale: 1.04 }), 'b2~cleverer-0.1');
  // the amber readout on the die: arithmetic 0.14 ms → 0 ms
  const plate = S.g(null, dieFx);
  S.rect({ x: DIE.x - 98, y: DIE.y - 48, w: 196, h: 96, r: 14, fill: '#120d06', fillOpacity: 0.94, stroke: 'compute', strokeOpacity: 0.45, sw: 1.5 }, plate);
  S.text('arithmetic', { x: DIE.x, y: DIE.y - 20, size: 26, weight: 550, anchor: 'middle', color: 'compute' }, plate);
  const arith = S.counter({ x: DIE.x, y: DIE.y + 20, size: 36, value: 0.14, anchor: 'middle', color: 'compute',
    fmt: v => (v < 0.005 ? '0 ms' : `${v.toFixed(2)} ms`) }, plate);
  hide(plate);
  S.add(fx.in(plate, { from: 'scale', scale: 0.9, d: 0.45 }), 'b2~kernel-0.15');
  S.add(fx.count(arith, 0.14, 0, { d: 1.3, ease: 'power1.inOut' }), at('b2~instant') - 1.25);
  S.add(die.wake({ d: 0.6, spread: 0.4 }), 'b2~instant');
  // 'waits for bytes': the die goes quiet; the bytes keep their pace; the rate does not move
  S.add(die.sleep({ d: 0.7, spread: 0.5 }), 'b2~waits-0.1');
  S.add(gsap.fromTo(ringGlow, { opacity: 0 }, { opacity: 0.55, duration: 0.45, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), 'b2~waits');
  const noChange = S.text('no change', { x: 470, y: 666, size: 26, weight: 550, color: 'muted' }, trayG);
  hide(noChange);
  S.add(fx.in(noChange, { from: 'left', d: 0.5, dist: 14 }), 'b2~bytes-0.1');

  // ================================================================ b3 · the bus is the limit
  S.add(fx.out([kTag, plate], { d: 0.4 }), 'b3-0.15');
  S.add(gsap.fromTo(busGlow, { autoAlpha: 0 }, { autoAlpha: 0.9, duration: 0.6, ease: 'power2.out' }), 'b3~every-0.2');
  const busLabel = S.text([{ t: 'the limit: ', c: 'bytes', w: 650 }, { t: 'how fast the bus delivers weights', c: 'muted' }], { x: DIE.x, y: 800, size: 28, weight: 550, anchor: 'middle' }, labelG);
  hide(busLabel);
  S.add(fx.in(busLabel, { from: 'up', d: 0.55, dist: 14 }), 'b3~every+0.1');
  // the ceiling locks over the tray
  const ceil = S.g(null, trayG);
  const ceilLine = S.line({ x1: TRAY.l - 16, y1: TRAY.t, x2: TRAY.r + 16, y2: TRAY.t, stroke: 'ink', sw: 4, cap: 'butt' }, ceil);
  const ceilTicks = S.path({ d: `M${TRAY.l - 16},${TRAY.t - 9} v18 M${TRAY.r + 16},${TRAY.t - 9} v18`, stroke: 'ink', sw: 4 }, ceil);
  const ceilTag = S.text('24 tokens/s max', { x: 380, y: 488, size: 26, weight: 650, anchor: 'middle', color: 'ink' }, ceil);
  [ceilLine, ceilTicks, ceilTag].forEach(hide);
  S.add(drawOn(ceilLine, { d: 0.45, from: '50% 50%', ease: 'power3.out' }), 'b3~serving-0.1');
  S.add(fx.pop(ceilTicks, { from: 0.3, d: 0.35 }), at('b3~serving') + 0.25);
  S.add(fx.in(ceilTag, { from: 'up', d: 0.45, dist: 12 }), at('b3~serving') + 0.15);
  // the three conditions, each under the term it governs
  S.add(E.showChip(0), 'b3~this-0.15');
  S.add(E.showChip(1), 'b3~sixteen-0.15');
  S.add(E.showChip(2), 'b3~one token-0.2');
  // 'the most one answer can stream' / 'the most the chip can make'
  S.add(gsap.fromTo(ceilLine, { attr: { 'stroke-width': 4 } }, { attr: { 'stroke-width': 8 }, duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), 'b3~most-0.05');
  S.add(fx.pulse(ceilTag, { scale: 1.08, d: 0.6 }), 'b3~most-0.05');
  S.add(fx.pulse(counter, { scale: 1.12, d: 0.6 }), 'b3~most#2-0.05');

  // ================================================================ the ring and the pills (one clock)
  // completions at R0 + k·CYCLE; from the 12th on, each sends a pill to the tray
  const pillPath = S.path({ d: `M${DIE.x},${DIE.y - 90} C${DIE.x},${DIE.y - 215} 1130,328 1000,332 C740,336 700,${TRAY.cy} ${TRAY.r - 20},${TRAY.cy}` }, pillG);
  const PL = pillPath.getTotalLength();
  const endFade = S.duration;
  const emits = [];
  for (let k = PILL0; R0 + k * CYCLE < endFade - 0.6; k++) emits.push(R0 + k * CYCLE);
  const pills = emits.map(() => {
    const w = S.g(null, pillG);
    libToken(S, { text: '', x: 0, y: 0, w: PILL.w, h: PILL.h, state: 'solid' }, w);
    w.setAttribute('opacity', 0);
    return w;
  });
  const slotX = i => SLOT.x0 + SLOT.pitch * i;
  // the tray shifts one slot left as each pill past the twelfth lands
  const SHIFT = 0.3;
  const shiftAt = t => {
    let s = 0;
    for (let j = SLOT.n; j < emits.length; j++) s += smooth(clamp01((t - (emits[j] + FLIGHT - SHIFT)) / SHIFT));
    return s;
  };
  drive(t => {
    // ---- ring
    const on = t >= R0;
    const frac = on ? ((t - R0) % CYCLE) / CYCLE : 0;
    const len = C * frac;
    ringFill.setAttribute('stroke-dasharray', `${len.toFixed(2)} ${C.toFixed(2)}`);
    ringFill.setAttribute('opacity', on && len > 0.5 ? 1 : 0);
    const a = -Math.PI / 2 + 2 * Math.PI * frac;
    ringHead.setAttribute('cx', (DIE.x + RING.r * Math.cos(a)).toFixed(2));
    ringHead.setAttribute('cy', (DIE.y + RING.r * Math.sin(a)).toFixed(2));
    ringHead.setAttribute('opacity', on ? 0.9 : 0);
    // the flash just after a completion
    const since = on && t >= R0 + CYCLE ? (t - R0) % CYCLE : 9;
    const f = since < 0.4 ? 1 - since / 0.4 : 0;
    ringFlash.setAttribute('opacity', (0.9 * f).toFixed(3));
    ringFlash.setAttribute('stroke-width', (RING.sw + 10 * (1 - f)).toFixed(2));
    dieFlash.setAttribute('opacity', (0.2 * (since < 0.35 ? Math.sin(Math.PI * Math.min(1, since / 0.35)) : 0)).toFixed(3));
    // ---- pills
    const sh = shiftAt(t);
    pills.forEach((p, j) => {
      const t0 = emits[j];
      if (t < t0) { p.setAttribute('opacity', 0); return; }
      let x, y, sc = 1, op = 1;
      if (t < t0 + FLIGHT) {
        const q = (t - t0) / FLIGHT;
        const target = slotX(Math.min(j, SLOT.n - 1));
        const L = PL + (TRAY.r - 20 - target);
        const s = sineIO(q) * L;
        if (s <= PL) { const pt = pillPath.getPointAtLength(s); x = pt.x; y = pt.y; }
        else { x = TRAY.r - 20 - (s - PL); y = TRAY.cy; }
        sc = 0.45 + 0.55 * smooth(clamp01(q / 0.22));
        op = clamp01(q / 0.08);
      } else {
        const pos = j - sh;
        x = slotX(pos); y = TRAY.cy;
        op = clamp01(1 + 2 * pos);
      }
      p.setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${sc.toFixed(3)})`);
      p.setAttribute('opacity', op.toFixed(3));
    });
  });

  // ================================================================ the clock that runs every driver
  const clock = { t: 0 };
  S.tl.fromTo(clock, { t: 0 }, { t: S.duration, duration: S.duration, ease: 'none', immediateRender: true,
    onUpdate: () => drivers.forEach(f => f(clock.t)) }, 0);
  drivers.forEach(f => f(0));
}});
