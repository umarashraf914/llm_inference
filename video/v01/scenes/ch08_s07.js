/* ch08_s07 · the residual stream (figs 99, 98)
   b1  a broad blue band (the residual stream of 'sat') draws up the frame; 'the residual stream' / '8,192
       numbers per token'; a width bracket '8,192' at its foot; header 'One thing flows up' / 'Q, K, V made
       fresh each stop'.
   b2  at layer 1 a loop branches right: Q, K, V pop, an amber flash passes, they fade ('made, used,
       discarded'); the result rejoins at a '+' and the band above brightens; faster at layers 2 and 3; a
       second '8,192' bracket and 'updated' at the top.
   b3  replay: Q fades, K and V drop into a teal shelf, one compartment per layer: 'the cache'.
   b4  the camera eases in; neighbour bands 'the' and 'cat' on the left; below layer 1 'sat' is plain ('from
       the embedding'); threads mix them in at layer 1 and the band above carries their colours; layer 2's
       K carries them too: 'depends on earlier tokens'; 'reusable? later'.
   b5  pull back: all but the band dims, ghost stations above suggest 80, the band pulses: 'only the stream
       flows'.
   Layout: band x 865-975 from y 1080 up (off the top); stations y 820 / 580 / 340; loops to x 1330;
   shelf x 1560-1800. */
V.scene('ch08_s07', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = n => gsap.parseEase(n);
  const clock = (a, b, fn) => S.add(ch08Drive(b - a, k => fn(a + k * (b - a))), a);
  const fade = (els, a, b, at, d = 0.45) => S.add(ch08Fade(els, a, b, { d }), at);
  const VIOLET = S.tone('violet'), PINK = '#f2a7cf';

  const world = S.g();
  const BX0 = 865, BW = 110, BXC = BX0 + BW / 2, BBOT = 1080, BTOP = -760, ST = [820, 580, 340];

  // ================================================================ b1: the band
  const band = S.rect({ x: BX0, y: BBOT, w: BW, h: 0, r: 0, fill: 'struct', fillOpacity: 0.32, stroke: 'struct', strokeOpacity: 0.7, sw: 2 }, world);
  band.setAttribute('data-audit', 'ignore');
  const tB0 = 0.4, tB1 = T('b1~stack') + 0.3;
  clock(tB0, tB1, t => { const h = (BBOT - BTOP) * E('power2.inOut')(cl((t - tB0) / (tB1 - tB0))); band.setAttribute('y', (BBOT - h).toFixed(1)); band.setAttribute('height', h.toFixed(1)); });
  // brightening above each station as the layer adds its result back on
  const segs = ST.map((y, k) => { const r = S.rect({ x: BX0, y: BTOP, w: BW, h: y - 40 - BTOP, fill: 'struct', fillOpacity: 0 }, world); r.setAttribute('data-audit', 'ignore'); return r; });
  const baseL = S.g(null, world);
  S.text('the residual stream', { x: BX0 + BW + 20, y: 958, size: 30, weight: 700, color: 'struct' }, baseL);
  S.text('8,192 numbers per token', { x: BX0 + BW + 20, y: 996, size: 24, weight: 550, color: 'muted' }, baseL);
  ch08Hide(baseL);
  fade(baseL, 0, 1, T('b1~one') - 0.1);
  const wbr = y => { const g = S.g(null, world); S.path({ d: `M${BX0},${y - 10} v10 H${BX0 + BW} v-10`, stroke: 'ink', strokeOpacity: 0.8, sw: 2.5 }, g); S.text('8,192', { x: BX0 - 14, y: y - 4, size: 24, weight: 650, family: 'mono', anchor: 'end', color: 'ink' }, g); g.querySelector('path').setAttribute('data-audit', 'ignore'); ch08Hide(g); return g; };
  const br0 = wbr(970);
  fade(br0, 0, 1, T('b1~wide') - 0.1);
  const hd1 = S.text('One thing flows up', { x: 110, y: 130, size: 46, weight: 700, family: 'display', color: 'ink' });
  const hd2 = S.text('Q, K, V made fresh each stop', { x: 110, y: 186, size: 32, weight: 600, color: 'muted' });
  ch08Hide([hd1, hd2]);
  fade([hd1, hd2], 0, 1, T('b1~residual') - 0.1, 0.5);

  // ================================================================ b2: three stations
  fade([hd1, hd2], 1, 0, T('b2') + 0.1, 0.4);
  const PXS = [1130, 1200, 1270], LOOPX = 1330;
  const st = ST.map((y, k) => {
    const g = S.g(null, world);
    const loop = S.path({ d: `M${BX0 + BW},${y + 40} H${LOOPX - 14} Q${LOOPX},${y + 40} ${LOOPX},${y + 26} V${y - 26} Q${LOOPX},${y - 40} ${LOOPX - 14},${y - 40} H${BX0 + BW + 18}`, stroke: 'struct', strokeOpacity: 0.85, sw: 3 }, g);
    const head = S.path({ d: `M${BX0 + BW + 30},${y - 49} L${BX0 + BW + 18},${y - 40} L${BX0 + BW + 30},${y - 31}`, stroke: 'struct', sw: 3 }, g);
    [loop, head].forEach(e => e.setAttribute('data-audit', 'ignore'));
    const plus = S.g(null, g);
    S.circle({ x: BX0 + BW, y: y - 40, r: 15, fill: '#0c1326', stroke: 'ink', sw: 2.5 }, plus);
    S.text('+', { x: BX0 + BW, y: y - 39, size: 24, weight: 800, anchor: 'middle', color: 'ink' }, plus);
    const lbl = S.text(`layer ${k + 1}`, { x: BX0 + BW + 22, y: y + 2, size: 24, weight: 650, color: 'muted' }, g);
    const pills = ['Q', 'K', 'V'].map((n, i) => { const p = S.g(null, g); S.rect({ x: PXS[i] - 26, y: y - 20, w: 52, h: 40, r: 10, fill: 'url(#card-struct)', stroke: 'struct', sw: 2 }, p); S.text(n, { x: PXS[i], y: y + 1, size: 24, weight: 700, anchor: 'middle', color: 'ink' }, p); return p; });
    const flash = S.rect({ x: PXS[0] - 30, y: y - 24, w: PXS[2] - PXS[0] + 60, h: 48, r: 12, fill: 'compute', opacity: 0 }, g);
    flash.setAttribute('data-audit', 'ignore');
    ch08Hide([loop, head, plus, lbl, ...pills]);
    Object.assign(g, { loop, head, plus, lbl, pills, flash, y });
    return g;
  });
  // one station's run: the loop draws, Q K V pop, a flash, they fade, the result rejoins at '+'
  const runStation = (s, k, t0, sp) => {
    S.add(ch08Fade([s.loop, s.head, s.lbl], 0, 1, { d: 0.3 * sp }), t0);
    S.add(ch08Fade(s.pills, 0, 1, { d: 0.2 * sp, stagger: 0.08 * sp }), t0 + 0.25 * sp);
    S.add(gsap.fromTo(s.flash, { attr: { opacity: 0 } }, { attr: { opacity: 0.45 }, duration: 0.2 * sp, yoyo: true, repeat: 1, immediateRender: false }), t0 + 0.7 * sp);
    S.add(ch08Fade(s.pills, 1, 0, { d: 0.35 * sp }), t0 + 1.15 * sp);
    S.add(ch08Fade(s.plus, 0, 1, { d: 0.25 * sp }), t0 + 1.4 * sp);
    S.add(gsap.fromTo(segs[k], { attr: { 'fill-opacity': 0 } }, { attr: { 'fill-opacity': 0.09 }, duration: 0.4, immediateRender: false }), t0 + 1.55 * sp);
  };
  const tS1 = T('b2~reads') - 0.1;
  runStation(st[0], 0, tS1, 1.0);
  const note = S.text('made, used, discarded', { x: LOOPX + 20, y: ST[0] + 1, size: 24, weight: 600, color: 'muted' }, world);
  ch08Hide(note);
  fade(note, 0, 1, T('b2~discards') - 0.1);
  fade(note, 1, 0, T('b2~name'), 0.4);
  runStation(st[1], 1, T('b2~adds') - 0.1, 0.55);
  runStation(st[2], 2, T('b2~adds') + 0.75, 0.55);
  const br3 = wbr(ST[2] - 66);
  const upd = S.text('updated', { x: BX0 + BW + 18, y: ST[2] - 76, size: 26, weight: 650, color: 'struct' }, world);
  ch08Hide(upd);
  fade(br3, 0, 1, T('b2~Hence') - 0.1);
  fade(upd, 0, 1, T('b2~residual') - 0.1);

  // ================================================================ b3: K and V into the cache
  const SHX = 1560, SHW = 240;
  const shelf = S.g(null, world);
  const comps = ST.map((y, k) => {
    const c = S.g(null, shelf);
    S.rect({ x: SHX, y: y - 55, w: SHW, h: 110, r: 12, fill: '#0b2421', stroke: 'helps', sw: 2.5 }, c);
    S.text(`layer ${k + 1}`, { x: SHX + 14, y: y - 34, size: 22, weight: 650, color: 'helps' }, c);
    return c;
  });
  const cacheTag = S.text('the cache', { x: SHX + SHW / 2, y: ST[2] - 96, size: 30, weight: 750, anchor: 'middle', color: 'helps' }, shelf);
  ch08Hide(shelf);
  const t3 = T('b3') - 0.1;
  fade(shelf, 0, 1, t3, 0.5);
  // fresh Q K V at each station again; Q fades, K and V fly into that layer's compartment
  const kept = [];
  st.forEach((s, k) => {
    const t0 = t3 + 0.5 + 0.9 * k;
    const ghost = ['Q', 'K', 'V'].map((n, i) => { const p = S.g(null, world); S.rect({ x: PXS[i] - 26, y: s.y - 20, w: 52, h: 40, r: 10, fill: 'url(#card-struct)', stroke: 'struct', sw: 2 }, p); S.text(n, { x: PXS[i], y: s.y + 1, size: 24, weight: 700, anchor: 'middle', color: 'ink' }, p); ch08Hide(p); return p; });
    S.add(ch08Fade(ghost, 0, 1, { d: 0.2, stagger: 0.05 }), t0);
    S.add(ch08Fade(ghost[0], 1, 0, { d: 0.3 }), t0 + 0.45);
    [1, 2].forEach(i => {
      const tx = SHX + (i === 1 ? 80 : 165) - PXS[i], ty = 14;
      S.add(gsap.fromTo(ghost[i], { x: 0, y: 0 }, { x: tx, y: ty, duration: 0.6, ease: 'power2.inOut', immediateRender: false }), t0 + 0.4);
    });
    S.add(ch08Ignore(ghost, 1.1), t0 + 0.35);
    kept.push(ghost);
  });

  // ================================================================ b4: earlier tokens mix in
  const t4 = T('b4') - 0.1;
  const camEase = (t, a, b, d) => E('power2.inOut')(cl((t - a) / d));
  const tIn = t4, tOut = T('b5') - 0.05;
  const camAt = t => {
    const kIn = camEase(t, tIn, 0, 1.2), kOut = camEase(t, tOut, 0, 1.2);
    let s = 1 + 0.06 * kIn, ox = 1200, oy = 700;
    s = lerp(s, 0.8, kOut); const oyy = lerp(oy, 1000, kOut), oxx = lerp(ox, 960, kOut);
    world.setAttribute('transform', `translate(${(oxx - s * oxx).toFixed(2)},${(oyy - s * oyy).toFixed(2)}) scale(${s.toFixed(4)})`);
  };
  camAt(0);
  clock(tIn, S.duration, camAt);
  S.add(ch08Ignore(world, S.duration - tIn - 0.01), tIn);
  // the neighbour bands for 'the' and 'cat'
  const nbDefs = S.el('defs', {});
  const nb = (x, col, word) => {
    const g = S.g(null, world);
    // fades out toward the top so it never reaches the chapter header
    const gid = `ch08s07-nb-${word}`, lg = S.el('linearGradient', { id: gid, gradientUnits: 'userSpaceOnUse', x1: 0, y1: 150, x2: 0, y2: 380 }, nbDefs);
    [[0, 0], [1, 1]].forEach(([off, op]) => S.el('stop', { offset: off, 'stop-color': col, 'stop-opacity': op }, lg));
    S.rect({ x: x - 22, y: 150, w: 44, h: BBOT - 150, fill: `url(#${gid})`, fillOpacity: 0.28, stroke: `url(#${gid})`, strokeOpacity: 0.7, sw: 1.5 }, g);
    S.text(word, { x, y: 1040, size: 26, weight: 700, anchor: 'middle', color: col, case: 'keep' }, g);
    ch08Hide(g);
    return g;
  };
  const nbThe = nb(640, VIOLET, 'the'), nbCat = nb(750, PINK, 'cat');
  const satL = S.text('sat', { x: BXC, y: 1040, size: 26, weight: 700, anchor: 'middle', color: 'ink', case: 'keep' }, world);
  ch08Hide(satL);
  fade([nbThe, nbCat, satL], 0, 1, t4 + 0.2, 0.5);
  const fromEmb = S.text('from the embedding', { x: BX0 + BW + 22, y: 918, size: 24, weight: 600, color: 'muted' }, world);
  ch08Hide(fromEmb);
  fade(fromEmb, 0, 1, T('b4~embedding') - 0.1);
  // threads from 'the' and 'cat' into 'sat' at layer 1; above it the band carries their colours
  const thr = S.g(null, world);
  [[640, VIOLET], [750, PINK]].forEach(([x, col]) => S.path({ d: `M${x + 22},${ST[0] + 30} C${x + 120},${ST[0] + 30} ${BX0 - 60},${ST[0] - 30} ${BX0},${ST[0] - 30}`, stroke: col, sw: 3 }, thr));
  thr.querySelectorAll('path').forEach(e => e.setAttribute('data-audit', 'ignore'));
  ch08Hide(thr);
  const stripes = S.g(null, world);
  S.rect({ x: BX0 + 12, y: BTOP, w: 8, h: ST[0] - 30 - BTOP, fill: VIOLET, fillOpacity: 0.85 }, stripes);
  S.rect({ x: BX0 + BW - 20, y: BTOP, w: 8, h: ST[0] - 30 - BTOP, fill: PINK, fillOpacity: 0.85 }, stripes);
  stripes.setAttribute('data-audit', 'ignore');
  ch08Hide(stripes);
  const tMix = T('b4~already') - 0.1;
  fade(thr, 0, 1, tMix, 0.4);
  fade(stripes, 0, 1, tMix + 0.4, 0.5);
  // the K kept at layer 2 carries the same colours
  const k2 = kept[1][1];
  const kStr = S.g(null, k2);
  S.rect({ x: PXS[1] - 20, y: ST[1] - 14, w: 5, h: 28, r: 2, fill: VIOLET }, kStr);
  S.rect({ x: PXS[1] + 15, y: ST[1] - 14, w: 5, h: 28, r: 2, fill: PINK }, kStr);
  ch08Hide(kStr);
  fade(kStr, 0, 1, T('b4~key') - 0.1, 0.35);
  const dep = S.text('depends on earlier tokens', { x: SHX + SHW / 2, y: ST[1] + 86, size: 22, weight: 650, anchor: 'middle', color: 'ink' }, world);
  ch08Hide(dep);
  fade(dep, 0, 1, T('b4~depends') - 0.1);
  const reuse = S.text('reusable? later', { x: SHX + SHW / 2, y: ST[2] - 136, size: 24, weight: 650, anchor: 'middle', color: 'helps' }, world);
  ch08Hide(reuse);
  fade(reuse, 0, 1, T('b4~reused') - 0.15, 0.35);

  // ================================================================ b5: only the stream flows
  const dims = [...st, shelf, ...kept.flatMap(g => g.slice(1)), nbThe, nbCat, thr, stripes, dep, reuse, fromEmb, baseL, br0, br3, upd, satL];
  S.add(ch08Fade(dims, 1, 0.22, { d: 0.6 }), tOut);
  const ghosts = S.g(null, world);
  [ST[2] - 240, ST[2] - 480, ST[2] - 720].forEach(y => {
    S.path({ d: `M${BX0 + BW},${y + 40} H${LOOPX - 14} Q${LOOPX},${y + 40} ${LOOPX},${y + 26} V${y - 26} Q${LOOPX},${y - 40} ${LOOPX - 14},${y - 40} H${BX0 + BW + 18}`, stroke: 'struct', strokeOpacity: 0.4, sw: 2.5, dash: '8 7' }, ghosts);
    S.path({ d: `M${BX0},${y - 70} v10 H${BX0 + BW} v-10`, stroke: 'ink', strokeOpacity: 0.4, sw: 2 }, ghosts);
  });
  ghosts.querySelectorAll('path').forEach(e => e.setAttribute('data-audit', 'ignore'));
  ch08Hide(ghosts);
  fade(ghosts, 0, 1, tOut + 0.6, 0.6);
  // one pulse up the band
  const pulse = S.rect({ x: BX0, y: BBOT, w: BW, h: 120, fill: 'white', opacity: 0 }, world);
  pulse.setAttribute('data-audit', 'ignore');
  const tPu = T('b5~flows') - 0.4;
  clock(tPu, tPu + 1.4, t => { const u = cl((t - tPu) / 1.4); pulse.setAttribute('y', lerp(BBOT, BTOP, E('power1.in')(u)).toFixed(1)); pulse.setAttribute('opacity', (0.28 * Math.sin(Math.PI * u)).toFixed(3)); });
  const cap = S.text('only the stream flows', { x: 380, y: 540, size: 48, weight: 750, family: 'display', anchor: 'middle', color: 'struct' });
  ch08Hide(cap);
  fade(cap, 0, 1, T('b5~only') - 0.1, 0.5);
});
