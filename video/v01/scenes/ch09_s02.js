/* ch09_s02 · close and wide: what the memory beside the chip is (figs 105, 107)
   b1  the coral container from s01 grows into the package seen from above: blue slab 'one package', amber die
       'the chip' (= compute die), six empty stack sites.
   b2  five sites fill coral, the sixth grey ('sixth stack, not enabled'); the camera zooms into the bottom-left
       stack, which crossfades into a side elevation: eight thin dies stack up, fine vertical lines through them,
       'die' on the top three, '8 dies × 2 GB = 16 GB'; back out, the five stacks light in turn as a counter
       steps 16 to 80 GB; a spec card 'Memory capacity: 80 GB' ticks.
   b3  'HBM · high bandwidth memory'; header 'not faster wires', 'per wire: about a laptop's speed'; the top view
       crossfades into a side elevation (slab, stack 'HBM' left, die right); 'millimetres' across the gap; a fan
       of 48 hair-thin coral wires (standing for 5 × 1,024 = 5,120) with particles; header 'close and wide'; an
       inset laptop board, 'centimetres' apart with a sparse band, '128 wires'; amber '40×' (5,120 / 128).
   b4  header 'wide needs short'; the camera eases in on the fan; the counter pulses; the wires thin and carry
       square pulses; a wire stretched out to 'centimetres' smears its square pulse into a soft wave, 'high and
       low blur'; a hand drags the stack away, the fan stretches, frays, greys, and snaps back.
   b5  pull back; header 'a placement, not a technology'; bars to scale: '80 GB · one H100' under an outline
       '140 GB · the model' (60 GB over), 'more than one chip: later in the series'; a price tag; takeaway
       'close and wide · small and expensive'.
   Layout: top view centred (960, 560), slab 900 × 500; side elevation slab x 300-1500, y 700-740, stack x
   470-650, die x 800-1180; inset x 1290-1830, y 180-430. */
V.scene('ch09_s02', S => {
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = n => gsap.parseEase(n);
  const EIO = E('power2.inOut');
  const drive = (d, fn) => { const p = { v: 0 }; return gsap.fromTo(p, { v: 0 }, { v: 1, duration: Math.max(0.001, d), ease: 'none', immediateRender: false, onStart: () => fn(p.v), onUpdate: () => fn(p.v), onReverseComplete: () => fn(0) }); };
  const clock = (a, b, fn) => S.add(drive(b - a, k => fn(a + k * (b - a))), a);
  const whole = fn => { fn(0); clock(0, S.duration, fn); };
  const setO = (e, v) => { e.style.opacity = v; e.style.visibility = v > 0.001 ? 'inherit' : 'hidden'; };
  const hide = els => [].concat(els).forEach(e => setO(e, 0));
  // seek-safe fade: opacity written from tween progress
  const fade = (els, a, b, at, d = 0.45, stagger = 0) => [].concat(els).forEach((e, i) => S.add(drive(d, k => setO(e, lerp(a, b, E('power2.out')(k)))), at + i * stagger));
  const ignore = (els, at, d) => clock(at, at + d, t => [].concat(els).forEach(e => (t > at && t < at + d ? e.setAttribute('data-audit', 'ignore') : e.removeAttribute('data-audit'))));
  const BYTES = S.tone('bytes'), MUTED = S.tone('muted');
  const mix = (c1, c2, k) => { const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); const a = p(c1), b = p(c2); return '#' + a.map((v, i) => Math.round(lerp(v, b[i], k)).toString(16).padStart(2, '0')).join(''); };

  // headers: one line, replaced on each change
  const head = (txt, at, until) => { const h = S.text(txt, { x: 110, y: 130, size: 46, weight: 700, family: 'display', color: 'ink' }); hide(h); fade(h, 0, 1, at, 0.45); if (until) fade(h, 1, 0, until - 0.05, 0.3); return h; };

  // ================================================================ b1: the package from above
  const holder = S.g();
  ch09Memory(S, { ...CH09.memEnd, filled: true }, holder);
  const tGrow = 0.5;
  whole(t => {
    const k = EIO(cl((t - tGrow) / 0.9)), s = lerp(1, 2.3, k);
    holder.setAttribute('transform', `translate(${960 - 960 * s},${540 - 540 * s}) scale(${s.toFixed(4)})`);
    setO(holder, 1 - cl((t - tGrow - 0.25) / 0.6));
  });
  const top = S.g();             // the top view; the camera works on this group
  const PCX = 960, PCY = 560, PW = 900, PH = 500;
  S.rect({ x: PCX - PW / 2, y: PCY - PH / 2, w: PW, h: PH, r: 28, fill: '#0f1830', stroke: 'struct', strokeOpacity: 0.55, sw: 2.5 }, top);
  const pkgL = S.text('one package', { x: PCX - PW / 2 + 30, y: PCY - PH / 2 + 32, size: 24, weight: 650, color: 'struct' }, top);
  const DIE = 320;
  const die = S.g(null, top);
  S.rect({ x: PCX - DIE / 2, y: PCY - DIE / 2, w: DIE, h: DIE, r: 14, fill: '#1a1408', stroke: 'compute', strokeOpacity: 0.85, sw: 2.5 }, die);
  S.rect({ x: PCX - DIE / 2 + 14, y: PCY - DIE / 2 + 14, w: DIE - 28, h: DIE - 28, r: 8, fill: 'url(#die-grid)' }, die);
  const dieGlow = S.rect({ x: PCX - DIE / 2 - 8, y: PCY - DIE / 2 - 8, w: DIE + 16, h: DIE + 16, r: 18, fill: 'compute', opacity: 0 }, top);
  dieGlow.setAttribute('data-audit', 'ignore');
  const SW = 140, SH = 104, SG = 16, STOT = 3 * SH + 2 * SG;
  const sites = [];
  [-1, 1].forEach(side => [0, 1, 2].forEach(i => {
    const x = side < 0 ? PCX - PW / 2 + 40 : PCX + PW / 2 - 40 - SW, y = PCY - STOT / 2 + i * (SH + SG);
    const g = S.g(null, top);
    S.rect({ x, y, w: SW, h: SH, r: 10, fill: 'none', stroke: 'bytes', strokeOpacity: 0.5, sw: 2, dash: '7 6' }, g);
    const fill = S.g(null, g);
    S.rect({ x, y, w: SW, h: SH, r: 10, fill: '#2a1218', stroke: 'bytes', strokeOpacity: 0.9, sw: 2 }, fill);
    for (let k = 1; k < 5; k++) S.path({ d: `M${x + 12},${y + k * SH / 5} H${x + SW - 12}`, stroke: 'bytes', strokeOpacity: 0.4, sw: 1.5 }, fill);
    const ring = S.rect({ x: x - 5, y: y - 5, w: SW + 10, h: SH + 10, r: 13, fill: 'none', stroke: 'bytes', sw: 3, opacity: 0 }, g);
    ring.setAttribute('data-audit', 'ignore');
    hide(fill);
    Object.assign(g, { fill, ring, x, y, cx: x + SW / 2, cy: y + SH / 2 });
    sites.push(g);
  }));
  // sites: 0-2 left (top to bottom), 3-5 right; the sixth (not enabled) is the bottom-right one
  const ORDER = [0, 3, 1, 4, 2], SIXTH = 5, ZOOM = 2;
  hide(top);
  fade(top, 0, 1, tGrow + 0.3, 0.6);
  hide(pkgL);
  fade(pkgL, 0, 1, T('b1~package') - 0.1, 0.4);
  const chipL = S.text('the chip', { x: 920, y: PCY + DIE / 2 + 42, size: 28, weight: 700, anchor: 'middle', color: 'compute' });
  const dieEq = S.text('= compute die', { x: 990, y: PCY + DIE / 2 + 42, size: 24, weight: 600, color: 'muted' });
  hide([chipL, dieEq]);
  fade(chipL, 0, 1, T('b1~chip#2') - 0.1, 0.4);
  fade(dieEq, 0, 1, T('b1~compute') - 0.1, 0.4);
  const pulse = (el, at, peak, d = 0.6) => S.add(gsap.fromTo(el, { attr: { opacity: 0 } }, { attr: { opacity: peak }, duration: d / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), at);
  pulse(dieGlow, T('b1~chip#2') - 0.1, 0.22, 0.8);
  pulse(dieGlow, T('b1~piece') - 0.1, 0.35, 0.5);

  // ================================================================ b2: the stacks
  const tAr = T('b2~Around') - 0.05;
  ORDER.forEach((s, i) => fade(sites[s].fill, 0, 1, tAr + 0.12 * i, 0.3));
  const sixFill = sites[SIXTH].fill;
  sixFill.querySelectorAll('rect, path').forEach(e => { e.setAttribute('stroke', MUTED); if (e.tagName === 'rect') e.setAttribute('fill', '#1b2133'); });
  fade(sixFill, 0, 0.5, tAr + 0.7, 0.4);
  const sixTag = S.pill('sixth stack, not enabled', { x: PCX + PW / 2 + 22, y: sites[SIXTH].cy, tone: 'neutral', size: 22, h: 40, anchor: 'start' });
  hide(sixTag);
  fade(sixTag, 0, 1, tAr + 0.9, 0.4);
  // the camera: into the bottom-left stack and back
  const zs = sites[2], tZin = T('b2~memory') - 0.15, tZout = T('b2~has') - 0.1;
  whole(t => {
    const k = EIO(cl((t - tZin) / 0.8)) * (1 - EIO(cl((t - tZout) / 0.7)));
    const z = lerp(1, 3.2, k), fx = lerp(PCX, zs.cx, k), fy = lerp(PCY, zs.cy, k);
    top.setAttribute('transform', `translate(${(960 - fx * z).toFixed(1)},${(560 - fy * z).toFixed(1)}) scale(${z.toFixed(4)})`);
  });
  ignore([top], tZin, tZout + 0.8 - tZin);
  fade(top, 1, 0, tZin + 0.5, 0.35);
  fade(top, 0, 1, tZout + 0.15, 0.35);
  fade([sixTag, chipL, dieEq], 1, 0, tZin, 0.3);
  fade([sixTag, chipL, dieEq], 0, 1, tZout + 0.4, 0.35);
  // the side elevation of one stack: eight dies, through-lines
  const st8 = S.g();
  const LW = 420, LH = 26, LG = 6, LX = 960 - LW / 2, LB = 740;
  const layers = Array.from({ length: 8 }, (_, i) => S.rect({ x: LX, y: LB - (i + 1) * (LH + LG) + LG, w: LW, h: LH, r: 4, fill: '#2a1218', stroke: 'bytes', strokeOpacity: 0.9, sw: 2 }, st8));
  const tsv = S.path({ d: Array.from({ length: 14 }, (_, i) => `M${LX + 22 + i * (LW - 44) / 13},${LB - 8 * (LH + LG) + LG} V${LB}`).join(' '), stroke: 'bytes', strokeOpacity: 0.55, sw: 1.2 }, st8);
  tsv.setAttribute('data-audit', 'ignore');
  tsv.setAttribute('stroke-dasharray', '300 300');
  const dieLs = [5, 6, 7].map(i => S.text('die', { x: LX + LW + 18, y: LB - (i + 1) * (LH + LG) + LG + LH / 2, size: 22, weight: 600, color: 'muted' }, st8));
  const st8tag = S.text('8 dies × 2 GB = 16 GB', { x: 960, y: 420, size: 34, weight: 700, family: 'mono', anchor: 'middle', color: 'bytes' }, st8);
  hide([...layers, ...dieLs, st8tag]);
  const tBond = T('b2~bonded') - 0.1;
  layers.forEach((l, i) => fade(l, 0, 1, tBond + 0.09 * i, 0.2));
  whole(t => tsv.setAttribute('stroke-dashoffset', (300 * (1 - EIO(cl((t - tBond - 0.75) / 0.5)))).toFixed(1)));
  fade(dieLs, 0, 1, tBond + 0.9, 0.3, 0.08);
  fade(st8tag, 0, 1, tBond + 1.0, 0.35);
  hide(st8);
  fade(st8, 0, 1, tZin + 0.55, 0.35);
  fade(st8, 1, 0, tZout, 0.35);
  // five stacks light in turn; 16 → 80 GB
  const tFive = T('b2~five') - 0.15;
  ORDER.forEach((s, i) => pulse(sites[s].ring, tFive + 0.18 * i, 0.9, 0.6));
  const cnt = S.text('16 GB', { x: 960, y: 862, size: 40, weight: 700, family: 'mono', anchor: 'middle', color: 'bytes' });
  hide(cnt);
  fade(cnt, 0, 1, tFive - 0.05, 0.25);
  whole(t => { cnt.textContent = `${16 * Math.max(1, Math.min(5, 1 + Math.floor((t - tFive) / 0.18)))} GB`; });
  const spec = S.g();
  S.rect({ x: 1440, y: 300, w: 425, h: 92, r: 16, fill: '#0c1326', stroke: 'white', strokeOpacity: 0.22, sw: 2 }, spec);
  S.text([{ t: 'Memory capacity: ', c: 'muted' }, { t: '80 GB', c: 'ink', f: 'mono' }], { x: 1478, y: 347, size: 26, weight: 650 }, spec);
  const tick = S.icon('ph:check-circle-duotone', { x: 1830, y: 346, size: 34, color: 'helps' }, spec);
  hide([spec, tick]);
  const tSpec = T('b2~eighty') - 0.1;
  S.add(drive(0.6, k => { const e = E('power3.out')(k); spec.setAttribute('transform', `translate(${lerp(200, 0, e).toFixed(1)},0)`); setO(spec, k); }), tSpec);
  fade(tick, 0, 1, tSpec + 0.6, 0.3);

  // ================================================================ b3: high bandwidth, close and wide
  const tB3 = T('b3') - 0.1;
  fade([spec, sixTag, chipL, dieEq, cnt], 1, 0, tB3, 0.35);
  const hbmL = S.text('HBM · high bandwidth memory', { x: 960, y: 268, size: 32, weight: 700, anchor: 'middle', color: 'ink' });
  hide(hbmL);
  fade(hbmL, 0, 1, T('b3~high') - 0.1, 0.4);
  const tNot = T('b3~Not') - 0.1, tSits = T('b3~It#2') - 0.1, tClose = T('b3~close') - 0.1;
  head('not faster wires', tNot, tClose);
  const perWire = S.text("per wire: about a laptop's speed", { x: 960, y: 868, size: 26, weight: 600, anchor: 'middle', color: 'muted' });
  hide(perWire);
  fade(perWire, 0, 1, tNot + 0.3, 0.4);
  fade([top, hbmL], 1, 0, tSits, 0.5);
  // the side elevation of the package
  const el = S.g();
  const SLX = 300, SLY = 700, STX = 470, STW = 180, DX = 800, DW = 380, DY = 620;
  S.rect({ x: SLX, y: SLY, w: 1200, h: 40, r: 8, fill: 'struct', fillOpacity: 0.3, stroke: 'struct', strokeOpacity: 0.8, sw: 2 }, el);
  const stack = S.g(null, el);
  for (let i = 0; i < 8; i++) S.rect({ x: STX, y: SLY - 4 - (i + 1) * 22 + 4, w: STW, h: 18, r: 3, fill: '#2a1218', stroke: 'bytes', strokeOpacity: 0.9, sw: 1.8 }, stack);
  const eTsv = S.path({ d: Array.from({ length: 7 }, (_, i) => `M${STX + 20 + i * (STW - 40) / 6},${SLY - 4 - 8 * 22 + 4} V${SLY - 4}`).join(' '), stroke: 'bytes', strokeOpacity: 0.45, sw: 1 }, stack);
  eTsv.setAttribute('data-audit', 'ignore');
  const hbm2 = S.text('HBM', { x: STX + STW / 2, y: SLY - 4 - 8 * 22 - 24, size: 30, weight: 750, anchor: 'middle', color: 'bytes' }, stack);
  const dieE = S.g(null, el);
  S.rect({ x: DX, y: DY, w: DW, h: SLY - 4 - DY, r: 6, fill: '#1a1408', stroke: 'compute', strokeOpacity: 0.9, sw: 2.5 }, dieE);
  S.text('compute die', { x: DX + DW / 2, y: DY - 26, size: 26, weight: 650, anchor: 'middle', color: 'compute' }, dieE);
  hide(el);
  fade(el, 0, 1, tSits + 0.3, 0.6);
  const dim = S.g(null, el);
  S.path({ d: `M${STX + STW + 4},580 H${DX - 4} M${STX + STW + 14},572 L${STX + STW + 4},580 L${STX + STW + 14},588 M${DX - 14},572 L${DX - 4},580 L${DX - 14},588`, stroke: 'ink', sw: 2 }, dim);
  S.text('millimetres', { x: (STX + STW + DX) / 2, y: 552, size: 21, weight: 650, anchor: 'middle', color: 'ink' }, dim);   // 21: clear of the stack
  hide(dim);
  fade(dim, 0, 1, T('b3~millimetres') - 0.1, 0.4);
  // the fan: 48 hair-thin wires stand for 5,120; recomputed each frame so the stack can be dragged in b4
  const NWI = 48, wr = S.rand(4711), fray = Array.from({ length: NWI }, () => [wr() - 0.5, wr() - 0.5]);
  const fanG = S.g(null, el);
  fanG.setAttribute('data-audit', 'ignore');
  const wires = Array.from({ length: NWI }, () => S.path({ d: '', stroke: 'bytes', sw: 1.1, strokeOpacity: 0.8 }, fanG));
  el.insertBefore(fanG, stack);
  const tFan = T('b3~those') - 0.1;
  const tDrag = T('b4~cannot') - 0.1, tThin = T('b4~hair') - 0.1;
  const dragAt = t => -190 * EIO(cl((t - tDrag) / 0.8)) * (1 - E('back.in(1.6)')(cl((t - tDrag - 1.3) / 0.35)));
  const wireGeom = (i, t) => {
    const dx = dragAt(t), x1 = STX + STW + dx, x2 = DX, y1 = 540 + 150 * (i + 0.5) / NWI, y2 = 628 + 66 * (i + 0.5) / NWI;
    const fr = cl(-dx / 190) ** 1.5 * 26, mx = (x1 + x2) / 2;
    return { x1, x2, y1, y2, d: `M${x1.toFixed(1)},${y1.toFixed(1)} C${(mx + fray[i][0] * fr).toFixed(1)},${(y1 + fray[i][1] * fr).toFixed(1)} ${(mx - fray[i][1] * fr).toFixed(1)},${(y2 + fray[i][0] * fr).toFixed(1)} ${x2},${y2.toFixed(1)}` };
  };
  whole(t => {
    const dk = cl(-dragAt(t) / 190), grow = EIO(cl((t - tFan) / 0.9));
    const col = mix(BYTES, MUTED, cl(dk * 1.6)), sw = lerp(1.1, 0.6, EIO(cl((t - tThin) / 0.5)));
    stack.setAttribute('transform', `translate(${dragAt(t).toFixed(1)},0)`);
    wires.forEach((w, i) => {
      const g = wireGeom(i, t);
      w.setAttribute('d', g.d);
      w.setAttribute('stroke', col);
      w.setAttribute('stroke-width', sw.toFixed(2));
      const k = cl(grow * 1.4 - Math.abs(i - NWI / 2) / NWI * 0.8);
      w.setAttribute('stroke-dasharray', '400 400');
      w.setAttribute('stroke-dashoffset', (400 * (1 - k)).toFixed(1));
    });
  });
  const wCnt = S.text('5 × 1,024 = 5,120 wires', { x: 725, y: 792, size: 30, weight: 700, family: 'mono', anchor: 'middle', color: 'bytes' }, el);
  hide(wCnt);
  fade(wCnt, 0, 1, tFan + 0.5, 0.4);
  fade(perWire, 1, 0, tFan, 0.35);
  // particles along every wire (b3), square pulses (b4)
  const tmpPath = S.path({ d: '', stroke: 'none' }, fanG);
  const PN = 36, pr = S.rand(99), parts = Array.from({ length: PN }, () => ({ i: Math.floor(pr() * NWI), ph: pr(), el: S.rect({ x: -3, y: -1.5, w: 6, h: 3, r: 1, fill: 'bytes', opacity: 0 }, fanG) }));
  const tPart = tFan + 0.8;
  whole(t => {
    const on = cl((t - tPart) / 0.4) * (1 - cl((t - tDrag + 0.2) / 0.3));
    parts.forEach(p => {
      if (on <= 0) { p.el.setAttribute('opacity', 0); return; }
      const u = (t * 0.9 + p.ph) % 1, g = wireGeom(p.i, t);
      tmpPath.setAttribute('d', g.d);
      const L = tmpPath.getTotalLength(), q = tmpPath.getPointAtLength(L * u);
      const sq = cl((t - tThin) / 0.4);
      p.el.setAttribute('transform', `translate(${q.x.toFixed(1)},${q.y.toFixed(1)}) scale(${lerp(1, 1.5, sq).toFixed(2)},${lerp(1, 1.8, sq).toFixed(2)})`);
      p.el.setAttribute('opacity', (on * 0.95 * Math.min(1, u * 8, (1 - u) * 8)).toFixed(3));
    });
  });
  // the inset: a laptop board, centimetres apart, 128 wires
  head('close and wide', tClose, T('b4') - 0.1);
  const ins = S.g();
  S.rect({ x: 1290, y: 180, w: 540, h: 250, r: 16, fill: '#0c1326', stroke: 'white', strokeOpacity: 0.2, sw: 2 }, ins);
  S.text('laptop', { x: 1312, y: 206, size: 22, weight: 650, color: 'muted' }, ins);
  S.rect({ x: 1320, y: 362, w: 480, h: 14, r: 4, fill: 'struct', fillOpacity: 0.3, stroke: 'struct', strokeOpacity: 0.7, sw: 1.5 }, ins);
  S.rect({ x: 1340, y: 322, w: 90, h: 38, r: 4, fill: '#2a1218', stroke: 'bytes', sw: 1.8 }, ins);
  S.rect({ x: 1660, y: 328, w: 120, h: 32, r: 4, fill: '#1a1408', stroke: 'compute', sw: 1.8 }, ins);
  S.path({ d: 'M1434,300 H1656 M1444,293 L1434,300 L1444,307 M1646,293 L1656,300 L1646,307', stroke: 'ink', sw: 1.8 }, ins);
  S.text('centimetres', { x: 1545, y: 278, size: 22, weight: 650, anchor: 'middle', color: 'ink' }, ins);
  const insW = S.path({ d: Array.from({ length: 8 }, (_, i) => `M1432,${331 + i * 3.6} H1658`).join(' '), stroke: 'bytes', sw: 1.2, strokeOpacity: 0.8 }, ins);
  insW.setAttribute('data-audit', 'ignore');
  insW.setAttribute('stroke-dasharray', '230 230');
  const insT = S.text('128 wires', { x: 1545, y: 404, size: 22, weight: 650, anchor: 'middle', color: 'bytes' }, ins);
  hide([ins, insT]);
  fade(ins, 0, 1, tClose + 0.1, 0.45);
  const tWide = T('b3~wide') - 0.1;
  whole(t => insW.setAttribute('stroke-dashoffset', (230 * (1 - EIO(cl((t - tWide) / 0.5)))).toFixed(1)));
  fade(insT, 0, 1, tWide + 0.3, 0.35);
  const x40 = S.text('40×', { x: 1250, y: 492, size: 46, weight: 750, family: 'mono', anchor: 'middle', color: 'compute' });
  hide(x40);
  fade(x40, 0, 1, tWide + 0.4, 0.4);

  // ================================================================ b4: wide needs short
  const tB4 = T('b4') - 0.1, tB5 = T('b5') - 0.1;
  head('wide needs short', tB4, tB5);
  // the camera eases in on the fan, and back out for b5
  whole(t => {
    const k = EIO(cl((t - tB4 - 0.1) / 0.9)) * (1 - EIO(cl((t - tB5) / 0.8))), z = lerp(1, 1.35, k);
    el.setAttribute('transform', `translate(${(725 - 725 * z).toFixed(1)},${(610 - 610 * z).toFixed(1)}) scale(${z.toFixed(4)})`);
  });
  ignore([el], tB4, 1.1);
  ignore([el], tB5, 1.0);
  pulse(S.rect({ x: 480, y: 768, w: 490, h: 48, r: 10, fill: 'bytes', opacity: 0 }, el), T('b4~Thousands') - 0.1, 0.22, 0.6);
  // a wire stretched out to centimetres: its square pulse smears into a soft wave
  const tStr = T('b4~only') - 0.1, tSnap = tStr + 1.6;
  const LONG0 = 640, LONG1 = 1700, LY = 975;
  const longW = S.path({ d: '', stroke: 'bytes', sw: 2.2 });
  const cmL = S.text('centimetres', { x: LONG1, y: LY - 34, size: 24, weight: 650, anchor: 'end', color: 'ink' });
  const blurT = S.pill('high and low blur', { x: 1180, y: LY - 34, tone: 'neutral', size: 22, h: 40 });
  longW.setAttribute('data-audit', 'ignore');
  whole(t => {
    const reach = EIO(cl((t - tStr) / 0.5)) * (1 - EIO(cl((t - tSnap) / 0.35)));
    const xe = lerp(LONG0, LONG1, reach), pos = cl((t - tStr - 0.4) / 1.1);
    let d = `M${LONG0},${LY}`;
    for (let x = LONG0; x <= xe; x += 4) {
      // a square pulse travelling right; the further it goes, the softer its edges
      const c = lerp(LONG0, LONG1, pos), soft = lerp(2, 70, (c - LONG0) / (LONG1 - LONG0)), wdt = 70;
      const y = -16 * (0.5 * (Math.tanh((x - (c - wdt)) / soft) - Math.tanh((x - (c + wdt)) / soft)));
      d += ` L${x.toFixed(0)},${(LY + (pos > 0 && pos < 1 ? y : 0)).toFixed(1)}`;
    }
    longW.setAttribute('d', d);
    setO(longW, reach > 0.01 ? 1 : 0);
  });
  hide([cmL, blurT]);
  fade(cmL, 0, 1, tStr + 0.4, 0.3);
  fade(blurT, 0, 1, tStr + 0.9, 0.35);
  fade([cmL, blurT], 1, 0, tSnap, 0.3);
  fade([ins, insT, x40], 1, 0.3, tSnap + 0.1, 0.4);
  // a hand drags the stack away: the fan stretches, frays and greys, then snaps back
  const hand = S.icon('ph:hand-grabbing-duotone', { x: STX + STW / 2, y: 610, size: 54, color: 'muted' }, stack);
  hide(hand);
  fade(hand, 0, 1, tDrag - 0.3, 0.25);
  fade(hand, 1, 0, tDrag + 1.75, 0.3);

  // ================================================================ b5: a placement, not a technology
  head('a placement, not a technology', tB5 + 0.05);
  fade([ins, insT, x40], 0.3, 0, tB5, 0.35);
  fade(dim, 1, 0, tB5, 0.35);
  fade(wCnt, 1, 0, tB5, 0.35);
  const bars = S.g();
  const GBX = 7, BX0 = 400;
  S.rect({ x: BX0, y: 816, w: 140 * GBX, h: 34, r: 6, fill: 'none', stroke: 'bytes', sw: 2.5 }, bars);
  S.text('140 GB · the model', { x: BX0 + 140 * GBX - 14, y: 834, size: 22, weight: 700, anchor: 'end', color: 'bytes' }, bars);
  S.rect({ x: BX0, y: 860, w: 80 * GBX, h: 34, r: 6, fill: 'url(#solid-bytes)' }, bars);
  S.text('80 GB · one H100', { x: BX0 + 16, y: 878, size: 22, weight: 700, color: '#0a0f1e' }, bars);
  S.text('+60 GB', { x: BX0 + 110 * GBX, y: 878, size: 22, weight: 650, family: 'mono', anchor: 'middle', color: 'muted' }, bars);
  const later = S.text('more than one chip: later in the series', { x: BX0 + 140 * GBX + 24, y: 834, size: 22, weight: 600, color: 'muted' });
  hide([bars, later]);
  const tMem = T('b5~memory') - 0.15;
  S.add(drive(0.5, k => { setO(bars, k); bars.setAttribute('transform', `translate(0,${lerp(20, 0, E('power2.out')(k)).toFixed(1)})`); }), tMem);
  fade(later, 0, 1, T('b5~small') - 0.1, 0.35);
  const tag = S.icon('ph:tag-duotone', { x: STX - 50, y: 600, size: 48, color: 'ink' });
  hide(tag);
  fade(tag, 0, 1, T('b5~expensive') - 0.2, 0.35);
  const take = S.takeaway('close and wide · small and expensive', { tone: 'bytes' });
  hide(take);
  fade(take, 0, 1, T('b5~expensive') + 0.1, 0.45);
});
