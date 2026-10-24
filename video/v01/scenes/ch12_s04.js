/* ch12_s04 · the only three ways past it (fig 130)
   Opens on ch12_s03's last frame (s03 has no fade-out): the package, the ring, the flowing bytes, the tray of
   pills and the counter are rebuilt in their s03 state and keep moving on s03's clock (t here = t there - 35.73)
   while they fade; the equation band (ch12Ceiling, built in its s03 end state) slides up 45 px.
   Checked: max tokens/s = bandwidth ÷ bytes per token: 3.35 TB/s ÷ 140 GB = 23.9; 4.8 ÷ 0.14 = 34.3;
   8 ÷ 0.14 = 57.1; at 7 px per token/s the bars are 167.5, 240, 400 px. 8-bit: 3.35 TB/s ÷ 70 GB = 47.9;
   4-bit: ÷ 35 GB = 95.7; the stack is 200 / 100 / 50 px for 140 / 70 / 35 GB. Ten per read: 140 GB ÷ 10 =
   14 GB per token, 3.35 TB/s ÷ 14 GB = 239 tokens/s, each request still 23.9.
   b1  header; three teal card outlines; each joins its condition chip, whose line turns teal; card 1 'Raise
       bandwidth' with three bars; card 2 'Shrink bytes per token' with a halving stack.
   b2  card 3 'Amortise the transfer': one read feeds ten pills, '≈ 240 tokens/s', 'weights only', '24/s' each;
       a later trick: one pill, three dashed guesses, firmed up by one coral read.
   b3  examples fade; a film-strip icon on each card; the equation glows; the connectors pulse; a teal path and
       the closing line.
   Layout: equation y 155, chips y 230 (bottoms at 250); cards 520 x 440 at x 120 / 700 / 1280, y 340-780;
   connectors elbow up at y 295; examples in y 500-780; path y 850; takeaway y 952. */
V.scene('ch12_s04', {
  fadeIn: false,                                   // opens on s03's last frame
  build: S => {
  const K = ch12Kit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const { fx } = S;

  // ================================================================ s03's last frame, still running
  const OFF = 35.733333333333334;                     // ch12_s03's duration
  const DIE = { x: 1250, y: 560, size: 240 }, RING = { r: 175, sw: 10 };
  const STK = { w: 90, h: 220, y: 450, lcx: 960, rcx: 1540 };
  const BUS = { w: 72, lx1: STK.lcx + STK.w / 2, lx2: 1112, rx1: STK.rcx - STK.w / 2, rx2: 1388 };
  const TRAY = { l: 140, r: 620, t: 520, b: 600, cy: 560 };
  const SLOT = { x0: 174, pitch: 36, n: 12 }, PILL = { w: 26, h: 40 };
  const CYCLE = 1.2, FLIGHT = 1.0;
  const R0 = 15.591 + 0.1 - 12 * CYCLE - OFF;         // s03's ring phase ('twenty-four' at 15.591 there)
  const carry = S.g();
  const busG = S.g(null, carry), ringG = S.g(null, carry), pkgG = S.g(null, carry), dieFx = S.g(null, carry);
  const labelG = S.g(null, carry), trayG = S.g(null, carry), pillG = S.g(null, carry);
  const busL = libByteStream(S, { x1: BUS.lx1, y1: DIE.y, x2: BUS.lx2, width: BUS.w, rate: null, source: false, sink: false }, busG);
  const busR = libByteStream(S, { x1: BUS.rx1, y1: DIE.y, x2: BUS.rx2, width: BUS.w, rate: null, source: false, sink: false }, busG);
  [busL, busR].forEach(b => b.walls.forEach(w => w.setAttribute('stroke-opacity', 1)));
  [busL, busR].forEach(b => {
    const gg = S.g(null, busG);
    const x0 = Math.min(b.start[0], b.end[0]) - 6, x1 = Math.max(b.start[0], b.end[0]) + 6;
    [-1, 1].forEach(sg => S.line({ x1: x0, y1: DIE.y + sg * BUS.w / 2, x2: x1, y2: DIE.y + sg * BUS.w / 2, stroke: 'bytes', sw: 4, cap: 'butt' }, gg)
      .setAttribute('filter', 'url(#glow-bytes)'));
    gg.setAttribute('data-audit', 'ignore');
    setO(gg, 0.9);
  });
  // the byte particles: S.flow's own arithmetic (speed 140, every 0.1, 3 lanes, size 6), on s03's clock
  const parts = S.g(null, busG);
  parts.setAttribute('data-audit', 'ignore');
  const lanes = [];
  [[BUS.lx1, 1], [BUS.rx1, -1]].forEach(([x1, dir]) => [0, 1, 2].forEach(i => {
    const off = -25.2 + 25.2 * i;
    lanes.push({ ax: x1 - 10 * dir, y: DIE.y + off * dir, dir, t0: 0.45 + 0.1 * ((i * 0.618) % 1) - OFF,
      pool: Array.from({ length: 12 }, () => { const e = S.g(null, parts); S.circle({ x: 0, y: 0, r: 19.2, fill: 'url(#pglow-bytes)' }, e); S.rect({ x: -6, y: -3.6, w: 12, h: 7.2, r: 3, fill: 'bytes' }, e); return e; }) });
  }));
  const L = 127, LIFE = L / 140;
  whole(t => lanes.forEach(ln => {
    ln.pool.forEach(e => e.setAttribute('opacity', 0));
    const tt = t - ln.t0;
    for (let k = Math.max(0, Math.ceil((tt - LIFE) / 0.1)); k <= Math.floor(tt / 0.1); k++) {
      const age = tt - k * 0.1;
      if (age < 0 || age > LIFE) continue;
      const e = ln.pool[k % 12];
      e.setAttribute('transform', `translate(${(ln.ax + ln.dir * Math.min(L, age * 140)).toFixed(2)},${ln.y.toFixed(2)})`);
      e.setAttribute('opacity', Math.max(0, Math.min(1, age / 0.15, (LIFE - age) / 0.15)));
    }
  }));
  [STK.lcx, STK.rcx].forEach(cx => libMemBlock(S, { x: cx - STK.w / 2, y: STK.y, w: STK.w, h: STK.h, style: 'stack', label: 'HBM', size: 26, layers: 7 }, pkgG));
  const die = libChip(S, { x: DIE.x, y: DIE.y, size: DIE.size, tone: 'compute', state: 'idle', seed: 12 }, pkgG);
  const C2 = 2 * Math.PI * RING.r;
  S.circle({ x: DIE.x, y: DIE.y, r: RING.r, stroke: '#ffffff', strokeOpacity: 0.09, sw: RING.sw }, ringG);
  const ringFill = S.circle({ x: DIE.x, y: DIE.y, r: RING.r, stroke: 'bytes', sw: RING.sw }, ringG);
  ringFill.setAttribute('transform', `rotate(-90 ${DIE.x} ${DIE.y})`);
  ringFill.setAttribute('stroke-linecap', 'round');
  const ringFlash = S.circle({ x: DIE.x, y: DIE.y, r: RING.r, stroke: '#ffd0d0', sw: RING.sw }, ringG);
  const ringHead = S.circle({ x: DIE.x, y: DIE.y - RING.r, r: 22, fill: 'url(#pglow-bytes)' }, ringG);
  [ringFill, ringFlash, ringHead].forEach(e => e.setAttribute('data-audit', 'ignore'));
  const B = die.body;
  const dieFlash = S.rect({ x: B.x, y: B.y, w: B.w, h: B.h, r: DIE.size * 0.12, fill: 'compute' }, dieFx);
  dieFlash.setAttribute('data-audit', 'ignore');
  S.text([{ t: '1 ring = ', c: 'muted' }, { t: '140 GB', c: 'bytes', w: 650 }], { x: 1084, y: 412, size: 26, weight: 550, anchor: 'end' }, labelG);
  S.text('slowed down', { x: 1460, y: 412, size: 26, weight: 550, color: 'muted' }, labelG);
  S.text([{ t: 'the limit: ', c: 'bytes', w: 650 }, { t: 'how fast the bus delivers weights', c: 'muted' }], { x: DIE.x, y: 800, size: 28, weight: 550, anchor: 'middle' }, labelG);
  S.rect({ x: TRAY.l, y: TRAY.t, w: TRAY.r - TRAY.l, h: TRAY.b - TRAY.t, r: 16, fill: '#ffffff', fillOpacity: 0.035 }, trayG);
  S.path({ d: `M${TRAY.r},${TRAY.t} H${TRAY.l + 16} Q${TRAY.l},${TRAY.t} ${TRAY.l},${TRAY.t + 16} V${TRAY.b - 16} Q${TRAY.l},${TRAY.b} ${TRAY.l + 16},${TRAY.b} H${TRAY.r}`, stroke: 'faint', sw: 2.5 }, trayG);
  S.counter({ x: 380, y: 664, size: 60, value: 23.9, fmt: S.fmt.fixed(1), anchor: 'middle', color: 'struct' }, trayG);
  S.text('tokens per second', { x: 380, y: 720, size: 26, weight: 550, anchor: 'middle', color: 'muted' }, trayG);
  S.text('no change', { x: 470, y: 666, size: 26, weight: 550, color: 'muted' }, trayG);
  S.line({ x1: TRAY.l - 16, y1: TRAY.t, x2: TRAY.r + 16, y2: TRAY.t, stroke: 'ink', sw: 4, cap: 'butt' }, trayG);
  S.path({ d: `M${TRAY.l - 16},${TRAY.t - 9} v18 M${TRAY.r + 16},${TRAY.t - 9} v18`, stroke: 'ink', sw: 4 }, trayG);
  S.text('24 tokens/s max', { x: 380, y: 488, size: 26, weight: 650, anchor: 'middle', color: 'ink' }, trayG);
  // the pills: s03's emission schedule and tray shifts, on s03's clock
  const smooth = p => p * p * (3 - 2 * p), sineIO = p => 0.5 - 0.5 * Math.cos(Math.PI * p);
  const pillPath = S.path({ d: `M${DIE.x},${DIE.y - 90} C${DIE.x},${DIE.y - 215} 1130,328 1000,332 C740,336 700,${TRAY.cy} ${TRAY.r - 20},${TRAY.cy}` }, pillG);
  const PL = pillPath.getTotalLength();
  const emits = [];
  for (let k = 12; R0 + k * CYCLE < -0.6; k++) emits.push(R0 + k * CYCLE);
  const pills = emits.map(() => { const w = S.g(null, pillG); libToken(S, { text: '', x: 0, y: 0, w: PILL.w, h: PILL.h, state: 'solid' }, w); w.setAttribute('opacity', 0); return w; });
  const slotX = i => SLOT.x0 + SLOT.pitch * i;
  whole(t => {
    const frac = ((t - R0) % CYCLE) / CYCLE, a = -Math.PI / 2 + 2 * Math.PI * frac;
    ringFill.setAttribute('stroke-dasharray', `${(C2 * frac).toFixed(2)} ${C2.toFixed(2)}`);
    ringFill.setAttribute('opacity', C2 * frac > 0.5 ? 1 : 0);
    ringHead.setAttribute('cx', (DIE.x + RING.r * Math.cos(a)).toFixed(2));
    ringHead.setAttribute('cy', (DIE.y + RING.r * Math.sin(a)).toFixed(2));
    ringHead.setAttribute('opacity', 0.9);
    const since = (t - R0) % CYCLE, f = since < 0.4 ? 1 - since / 0.4 : 0;
    ringFlash.setAttribute('opacity', (0.9 * f).toFixed(3));
    ringFlash.setAttribute('stroke-width', (RING.sw + 10 * (1 - f)).toFixed(2));
    dieFlash.setAttribute('opacity', (0.2 * (since < 0.35 ? Math.sin(Math.PI * Math.min(1, since / 0.35)) : 0)).toFixed(3));
    let sh = 0;
    for (let j = SLOT.n; j < emits.length; j++) sh += smooth(cl((t - (emits[j] + FLIGHT - 0.3)) / 0.3));
    pills.forEach((p, j) => {
      const t0 = emits[j];
      let x, y, sc = 1, op = 1;
      if (t < t0 + FLIGHT) {
        const q = (t - t0) / FLIGHT, target = slotX(Math.min(j, SLOT.n - 1)), Lp = PL + (TRAY.r - 20 - target), s = sineIO(q) * Lp;
        if (s <= PL) { const pt = pillPath.getPointAtLength(s); x = pt.x; y = pt.y; } else { x = TRAY.r - 20 - (s - PL); y = TRAY.cy; }
        sc = 0.45 + 0.55 * smooth(cl(q / 0.22));
        op = cl(q / 0.08);
      } else { const pos = j - sh; x = slotX(pos); y = TRAY.cy; op = cl(1 + 2 * pos); }
      p.setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${sc.toFixed(3)})`);
      p.setAttribute('opacity', op.toFixed(3));
    });
  });
  fade(carry, 1, 0, 0.1, 0.5);

  // ================================================================ the equation band slides up 45 px
  const C = ch12Ceiling(S, { hidden: false, state: 'numbers' });
  S.add(C.slide(-45, { d: 0.9 }), 0.25);
  const hdr = S.text('The only three ways past it', { x: 960, y: 80, size: 32, weight: 700, anchor: 'middle', color: 'ink' });
  S.add(fx.type(hdr, { d: 0.7 }), T('b1~Only') - 0.05);

  // ================================================================ the three cards and their connectors
  const CX = [380, 960, 1540], CHX = [790, 1020, 1290];
  const tRaise = T('b1~Raise') - 0.1, tShrink = T('b1~shrink') - 0.1, tAmort = T('b2~Or') - 0.1, tB3 = T('b3') - 0.1;
  const CARDS = [['Raise bandwidth', 'a different chip', tRaise], ['Shrink bytes per token', 'lower precision, compression', tShrink], ['Amortise the transfer', 'batching, or several at once', tAmort]];
  const tOut = T('b1~Only') + 0.05, tJoin = T('b1~one') - 0.1;
  const cards = CARDS.map(([title, sub, tFill], i) => {
    const x = CX[i] - 260, g = S.g();
    const outline = S.rect({ x, y: 340, w: 520, h: 440, r: 22, stroke: 'helps', strokeOpacity: 0.45, sw: 2 }, g);
    K.draw(outline, 2000, tOut + 0.15 * i, 0.8);
    const fill = S.rect({ x, y: 340, w: 520, h: 440, r: 22, fill: 'url(#card-helps)', stroke: 'helps', sw: 2.5 }, g);
    const tt = S.text(title, { x: CX[i], y: 390, size: 32, weight: 750, anchor: 'middle', color: 'ink' }, g);
    const st = S.text(sub, { x: CX[i], y: 432, size: 24, weight: 600, anchor: 'middle', color: 'helps' }, g);
    const rule = S.path({ d: `M${x + 40},470 H${x + 480}`, stroke: 'helps', strokeOpacity: 0.25, sw: 1.5 }, g);
    hide([fill, tt, st, rule]);
    fade([fill, rule], 0, 1, tFill, 0.4);
    S.add(K.drive(0.45, k => { [tt, st].forEach((e, j) => { const q = cl(k * 1.4 - j * 0.4); setO(e, q); e.setAttribute('transform', `translate(0,${(12 * (1 - E('power3.out')(q))).toFixed(1)})`); }); }), tFill + 0.1);
    // connector: up from the card's top edge, along y 295, up to the chip's bottom (y 250)
    const dx = CHX[i] - CX[i], sg = Math.sign(dx), r = Math.min(12, Math.abs(dx) / 2);
    const d = `M${CX[i]},339 V${295 + r} Q${CX[i]},295 ${CX[i] + sg * r},295 H${CHX[i] - sg * r} Q${CHX[i]},295 ${CHX[i]},${295 - r} V251`;
    const line = S.path({ d, stroke: 'helps', sw: 2.5 }, g);
    line.setAttribute('data-audit', 'ignore');
    const len = 90 + Math.abs(dx) + 10;
    K.draw(line, len, tJoin + 0.25 * i, 0.5);
    const glow = S.path({ d, stroke: 'helps', sw: 9, opacity: 0 }, g);
    glow.setAttribute('filter', 'url(#glow-helps)');
    glow.setAttribute('data-audit', 'ignore');
    S.add(C.tintChip(i, 'helps', { d: 0.45 }), tJoin + 0.25 * i + 0.35);
    return { g, glow };
  });

  // ================================================================ card 1: raise bandwidth (7 px per token/s)
  const ex1 = S.g();
  const BARS = [['H100 · 3.35 TB/s', 167.5, '24/s', 'neutral', tRaise + 0.45], ['H200 · 4.8 TB/s', 240, '34/s', 'helps', T('b1~different') - 0.15], ['B200 · 8 TB/s', 400, '57/s', 'helps', T('b1~chip') - 0.1]];
  BARS.forEach(([name, w, rate, tone, at], i) => {
    const y = 540 + 80 * i;
    const nm = S.text(name, { x: 152, y: y - 30, size: 20, weight: 650, color: tone === 'neutral' ? 'muted' : 'helps' }, ex1);
    const bar = S.rect({ x: 152, y: y - 13, w: 0, h: 26, r: 6, fill: `url(#solid-${tone})` }, ex1);
    const rd = S.text(rate, { x: 152 + w + 12, y: y + 1, size: 24, weight: 700, family: 'mono', color: tone === 'neutral' ? 'muted' : 'helps' }, ex1);
    hide([nm, rd]);
    fade(nm, 0, 1, at, 0.3);
    whole(t => bar.setAttribute('width', (w * E('power3.out')(cl((t - at - 0.1) / 0.6))).toFixed(1)));
    fade(rd, 0, 1, at + 0.55, 0.3);
  });
  const cap1 = S.text('to scale: tokens per second', { x: 152, y: 752, size: 20, weight: 600, color: 'faint' }, ex1);
  hide(cap1);
  fade(cap1, 0, 1, tRaise + 0.9, 0.4);
  fade(ex1, 1, 0.4, tShrink, 0.4);

  // ================================================================ card 2: shrink the bytes (200 px = 140 GB)
  const ex2 = S.g();
  const SB = { x: 740, w: 100, base: 770 };
  const ghost = S.rect({ x: SB.x, y: SB.base - 200, w: SB.w, h: 200, r: 8, stroke: 'bytes', strokeOpacity: 0.45, sw: 2, dash: '6 6' }, ex2);
  const stk = S.rect({ x: SB.x, y: SB.base - 200, w: SB.w, h: 200, r: 8, fill: 'url(#solid-bytes)' }, ex2);
  const seams = Array.from({ length: 7 }, () => S.path({ d: 'M0,0', stroke: '#060a14', strokeOpacity: 0.35, sw: 2 }, ex2));
  S.text('the weights, to scale', { x: SB.x, y: 540, size: 20, weight: 600, color: 'faint' }, ex2);
  const gb = S.text('140 GB', { x: SB.x + SB.w + 14, y: SB.base - 186, size: 22, weight: 700, color: 'bytes' }, ex2);
  const tH1 = T('b1~eight') - 0.1, tH2 = T('b1~second') - 0.2;
  whole(t => {
    const h = 200 - 100 * EIO(cl((t - tH1) / 0.6)) - 50 * EIO(cl((t - tH2) / 0.6));
    stk.setAttribute('y', (SB.base - h).toFixed(1));
    stk.setAttribute('height', h.toFixed(1));
    seams.forEach((p, j) => { const y = SB.base - h * (j + 1) / 8; p.setAttribute('d', `M${SB.x + 4},${y.toFixed(1)} H${SB.x + SB.w - 4}`); });
    gb.setAttribute('y', (SB.base - h + 14).toFixed(1));
    gb.textContent = t < tH1 + 0.3 ? '140 GB' : t < tH2 + 0.3 ? '70 GB' : '35 GB';
  });
  const RD = [['16-bit: 24/s', 'muted', tShrink + 0.5], ['8-bit: ≈ 48/s', 'helps', tH1 + 0.45], ['4-bit: ≈ 96/s', 'helps', tH2 + 0.45]];
  RD.forEach(([s, c, at], i) => {
    const e = S.text(s, { x: 962, y: 600 + 60 * i, size: 24, weight: 700, color: c }, ex2);
    hide(e);
    S.add(K.drive(0.35, k => { setO(e, k); e.setAttribute('transform', `translate(${(-14 * (1 - E('power3.out')(k))).toFixed(1)},0)`); }), at);
  });
  hide(ex2);
  fade(ex2, 0, 1, tShrink + 0.3, 0.4);
  fade(ex2, 1, 0.4, tAmort, 0.4);
  void ghost;

  // ================================================================ card 3: amortise the transfer
  const ex3 = S.g(), batch = S.g(null, ex3), later = S.g(null, ex3);
  const tTen = T('b2~ten') - 0.1;
  const eqL = S.text([{ t: '140 GB', c: 'bytes' }, { t: ' ÷ 10 = ', c: 'ink' }, { t: '14 GB per token', c: 'bytes' }], { x: 1540, y: 506, size: 24, weight: 700, anchor: 'middle' }, batch);
  const src = S.g(null, batch);
  S.rect({ x: 1306, y: 530, w: 60, h: 44, r: 7, fill: 'url(#solid-bytes)' }, src);
  [541, 552, 563].forEach(y => S.path({ d: `M1310,${y} H1362`, stroke: '#060a14', strokeOpacity: 0.35, sw: 2 }, src));
  const PX = i => 1394 + 34 * i;
  const SHADES = ['#5d9bff', '#7fb2ff', '#5a90f0', '#86b9ff', '#6aa0f5', '#78aefc', '#5f97f7', '#8cbcff', '#6ca4fa', '#73aaff'];
  const read = S.path({ d: `M1368,552 H${PX(9)}`, stroke: 'bytes', sw: 4 }, batch);
  const drops = S.path({ d: Array.from({ length: 10 }, (_, i) => `M${PX(i)},554 V580`).join(' '), stroke: 'bytes', sw: 2.5 }, batch);
  [read, drops].forEach(e => e.setAttribute('data-audit', 'ignore'));
  const pills3 = Array.from({ length: 10 }, (_, i) => S.rect({ x: PX(i) - 12, y: 582, w: 24, h: 36, r: 8, fill: SHADES[i] }, batch));
  const per = S.text([{ t: 'each still ', c: 'muted' }, { t: '24/s', c: 'struct', w: 750 }], { x: (PX(0) + PX(9)) / 2, y: 638, size: 20, weight: 650, anchor: 'middle' }, batch);
  const perGlow = pills3.map(p => { const c = S.rect({ x: +p.getAttribute('x') - 8, y: 574, w: 40, h: 52, r: 12, fill: 'url(#pglow-struct)', opacity: 0 }, batch); c.setAttribute('data-audit', 'ignore'); batch.insertBefore(c, pills3[0]); return c; });
  hide([eqL, src, per]);
  fade(src, 0, 1, tTen, 0.3);
  K.draw(read, 360, tTen + 0.2, 0.45);
  hide(drops);
  fade(drops, 0, 1, tTen + 0.55, 0.3);
  pills3.forEach((p, i) => K.track(p, [K.K(tTen + 0.6 + 0.05 * i, { y: -16, o: 0 }), K.K(tTen + 0.95 + 0.05 * i, { y: 0, o: 1, e: 'back.out(2)' })]));
  S.add(K.drive(0.4, k => { setO(eqL, k); eqL.setAttribute('transform', `translate(0,${(10 * (1 - E('power3.out')(k))).toFixed(1)})`); }), tTen + 0.4);
  const brk = S.path({ d: `M${PX(0) - 12},654 v8 H${PX(9) + 12} v-8 M${(PX(0) + PX(9)) / 2 - 60},662 v6`, stroke: 'white', sw: 2.5 }, batch);
  K.draw(brk, 420, T('b2~two') - 0.1, 0.45);
  const tot = S.text('≈ 240 tokens/s', { x: (PX(0) + PX(9)) / 2 - 60, y: 688, size: 24, weight: 750, anchor: 'middle', color: 'helps' }, batch);
  hide(tot);
  fade(tot, 0, 1, T('b2~two') + 0.2, 0.35);
  const wo = S.pill('weights only', { x: 1696, y: 688, tone: 'neutral', size: 20, h: 32 }, batch);
  hide(wo);
  S.add(K.drive(0.35, k => { setO(wo, k); wo.setAttribute('transform', `translate(${(-16 * (1 - E('back.out(2)')(k))).toFixed(1)},0)`); }), T('b2~counting') - 0.1);
  const tEach = T('b2~each#2') - 0.1;
  perGlow.forEach((c, i) => pulse(c, tEach + 0.06 * i, 0.9, 0.5));
  fade(per, 0, 1, tEach + 0.3, 0.35);
  // a later trick: within one answer, guess ahead and check several tokens in one read
  const tLater = T('b2~later') - 0.1, tGuess = T('b2~guess') - 0.1, tCheck = T('b2~check') - 0.1;
  fade(batch, 1, 0.4, tLater, 0.4);
  const one = S.rect({ x: 1318, y: 730, w: 24, h: 36, r: 8, fill: 'url(#solid-struct)' }, later);
  const gx = [1364, 1398, 1432];
  const dashed = gx.map(x => S.rect({ x: x - 12, y: 730, w: 24, h: 36, r: 8, fill: 'struct', fillOpacity: 0.12, stroke: 'struct', strokeOpacity: 0.7, sw: 2, dash: '4 4' }, later));
  const solid = gx.map(x => S.rect({ x: x - 12, y: 730, w: 24, h: 36, r: 8, fill: 'url(#solid-struct)' }, later));
  const tag1 = S.text('several at once · later', { x: 1464, y: 738, size: 20, weight: 650, color: 'muted' }, later);
  const tag2 = S.text('guesses', { x: 1464, y: 764, size: 20, weight: 600, color: 'faint' }, later);
  const feed = S.path({ d: 'M1336,576 V707 M1329,699 L1336,708 L1343,699 M1318,718 H1444', stroke: 'bytes', sw: 3 }, later);
  feed.setAttribute('data-audit', 'ignore');
  hide([one, ...dashed, ...solid, tag1, tag2]);
  fade([one, tag1], 0, 1, tLater + 0.1, 0.35);
  fade(dashed, 0, 1, tGuess, 0.25, 0.1);
  fade(tag2, 0, 1, tGuess + 0.2, 0.3);
  fade(solid, 0, 1, tCheck + 0.3, 0.3, 0.08);
  fade(dashed, 1, 0, tCheck + 0.5, 0.3);
  K.draw(feed, 300, tCheck, 0.5);
  hide(ex3);
  fade(ex3, 0, 1, tAmort + 0.2, 0.3);

  // ================================================================ b3: each gets its own video; the roadmap
  fade([ex1, ex2, ex3], 1, 0, tB3, 0.5);
  const tOwn = T('b3~own') - 0.15;
  CX.forEach((x, i) => {
    const ic = S.icon('ph:film-strip-duotone', { x, y: 610, size: 84, color: 'helps' });
    K.track(ic, [K.K(tOwn + 0.2 * i, { y: -50, o: 0 }), K.K(tOwn + 0.2 * i + 0.5, { y: 0, o: 1, e: 'bounce.out' })]);
  });
  S.add(C.glow({ d: 0.9 }), T('b3~One') - 0.1);
  cards.forEach(c => pulse(c.glow, T('b3~three') - 0.1, 0.9, 0.9));
  const tRoad = T('b3~entire') - 0.2;
  const road = S.path({ d: 'M120,850 H1790 M1776,840 L1792,850 L1776,860', stroke: 'helps', sw: 4 });
  road.setAttribute('data-audit', 'ignore');
  K.draw(road, 1720, tRoad, 0.9);
  CX.forEach((x, i) => {
    const dot = S.circle({ x, y: 850, r: 8, fill: 'helps', stroke: '#060a14', sw: 2 });
    hide(dot);
    fade(dot, 0, 1, tRoad + 0.9 * (x - 120) / 1670, 0.2);
    void i;
  });
  const take = S.takeaway('three escape routes: the entire roadmap', { tone: 'helps' });
  hide(take);
  fade(take, 0, 1, tRoad + 0.1, 0.5);
  void lerp;
}});
