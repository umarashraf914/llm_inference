/* ch10_s01 · prefill and decode (fig 109)
   b1  a small GPU package top-left, coral particles on its buses, '140 GB per pass'; two empty lanes,
       'Prefill' and 'Decode'.
   b2  'Prefill · the whole prompt at once': t1…t8 slide in ('real prompts: thousands'); the slab stack and
       '80 layers' draw on; on 'together' the eight lift as one front and a row of eight climbs the stack, each
       slab flashing amber as it passes: 'every position, every layer, in parallel'.
   b3  the front leaves the top; the pills brighten; a fan of score bars flicks out of t8 and the outlined t9
       pops out: 'ready to generate'.
   b4  'Decode · one token at a time': t9 drops into the bottom lane and climbs alone; t10 pops out; t10, t11,
       t12 each climb in turn ('passes: 1 … 4'); a grey 'stop' pops out, the slabs go dark; 'length limit'.
   b5  'same chip · same weights · same code'; one coral load leaves the HBM and enters both stacks: eight
       thin lines in the top lane ('1 load : 8 tokens'), one in the bottom ('1 load : 1 token'); the line
       becomes 'how many tokens share each load'.
   Layout: GPU centre (250, 175); lanes x 110-1810, top y 290-600, bottom y 650-960; pills from x 200, 96
   apart; stacks x 1360-1640. */
V.scene('ch10_s01', S => {
  const K = ch10Kit(S), { T, cl, lerp, E, EIO, clock, whole, setO, hide, fade, pulse } = K;

  // ================================================================ b1: the package, the lanes
  const gpuG = S.g();
  const gpu = S.gpu({ x: 250, y: 178, scale: 0.3, labels: false }, gpuG);
  hide(gpuG);
  fade(gpuG, 0, 1, 0.3, 0.6);
  const busL = S.text('140 GB per pass', { x: 392, y: 178, size: 26, weight: 700, color: 'bytes' });
  hide(busL);
  fade(busL, 0, 1, T('b1~that') - 0.1, 0.4);
  const parts = S.g();
  parts.setAttribute('data-audit', 'ignore');
  const pr = S.rand(10);
  const pts = Array.from({ length: 30 }, (_, i) => ({ bus: gpu.buses[i % gpu.buses.length], ph: pr(), el: S.circle({ x: 0, y: 0, r: 2.6, fill: 'bytes', opacity: 0 }, parts) }));
  const tTrip = T('b1~that') - 0.1;
  whole(t => {
    const on = cl((t - tTrip) / 0.4) * (1 - 0.7 * cl((t - T('b2')) / 0.6));
    pts.forEach(p => {
      if (on <= 0) { p.el.setAttribute('opacity', 0); return; }
      const L = p.bus.getTotalLength(), u = (t * 0.7 + p.ph) % 1, q = p.bus.getPointAtLength(L * u);
      p.el.setAttribute('cx', q.x.toFixed(1)); p.el.setAttribute('cy', q.y.toFixed(1));
      p.el.setAttribute('opacity', (on * Math.min(1, u * 6, (1 - u) * 6)).toFixed(3));
    });
  });
  const LANES = [{ y: 290, name: 'Prefill', sub: ' · the whole prompt at once', cue: 'b2~prefill' }, { y: 650, name: 'Decode', sub: ' · one token at a time', cue: 'b4~decode' }];
  const LH = 310;
  const lanes = LANES.map(L => {
    const g = S.g();
    S.rect({ x: 110, y: L.y, w: 1700, h: LH, r: 26, fill: '#0b1224', fillOpacity: 0.7, stroke: 'struct', strokeOpacity: 0.55, sw: 2 }, g);
    const tw = S.measure(L.name, { size: 36, weight: 750 });
    S.text(L.name, { x: 144, y: L.y + 42, size: 36, weight: 750, family: 'display', color: 'ink' }, g);
    g.sub = S.text(L.sub.trim(), { x: 144 + tw + 12, y: L.y + 44, size: 28, weight: 600, color: 'muted' }, g);   // SVG drops the leading space
    hide(g.sub);
    fade(g.sub, 0, 1, T(L.cue) - 0.1, 0.45);
    return g;
  });
  hide(lanes);
  fade(lanes, 0, 1, T('b1~two') - 0.1, 0.5, 0.15);

  // ================================================================ b2: prefill
  const PX = i => 200 + i * 96, PY0 = 455, PY1 = 815;
  const tEight = T('b2~Eight') - 0.1;
  const prompt = Array.from({ length: 8 }, (_, i) => {
    const w = S.g();
    const p = ch10Pill(S, { text: `t${i + 1}`, x: PX(i), y: PY0, kind: 'prompt' }, w);
    w.pill = p;
    return w;
  });
  const tTog = T('b2~together') - 0.1, CLIMB = 1.15;
  prompt.forEach((w, i) => K.track(w, [K.K(tEight + 0.08 * i, { x: -60, y: 0, o: 0 }), K.K(tEight + 0.08 * i + 0.4, { x: 0, y: 0, o: 1, e: 'power3.out' }),
    K.K(tTog, { x: 0, y: 0 }), K.K(tTog + 0.3, { x: 0, y: -14 }), K.K(tTog + CLIMB + 0.4, { x: 0, y: -14 }), K.K(tTog + CLIMB + 0.7, { x: 0, y: 0 })]));
  const note = S.text('real prompts: thousands', { x: PX(0) - 40, y: 516, size: 24, weight: 600, color: 'muted' });
  hide(note);
  fade(note, 0, 1, tEight + 0.8, 0.4);
  const SX = 1360;
  const stacks = [ch10Stack(S, { x: SX, y: 565 }), ch10Stack(S, { x: SX, y: 925 })];
  stacks.forEach(st => st.slabs.forEach(s => s.setAttribute('opacity', 0)));
  const tStack = T('b2~climb') - 0.1;
  whole(t => stacks.forEach(st => st.slabs.forEach((s, i) => s.setAttribute('opacity', cl((t - tStack - 0.04 * i) / 0.2).toFixed(3)))));
  const l80 = S.pill('80 layers', { x: 1730, y: 625, tone: 'neutral', size: 22, h: 40 });
  hide(l80);
  fade(l80, 0, 1, tStack + 0.3, 0.4);
  // a front of eight climbs the stack
  const front = (st, n, t0, d, bright) => {
    const g = S.g();
    g.setAttribute('data-audit', 'ignore');
    const cw = 22, gap = 9, tw = n * cw + (n - 1) * gap;
    for (let i = 0; i < n; i++) S.rect({ x: st.cx - tw / 2 + i * (cw + gap), y: -8, w: cw, h: 16, r: 4, fill: 'url(#solid-struct)', stroke: 'white', strokeOpacity: 0.6, sw: 1 }, g);
    whole(t => {
      const k = cl((t - t0) / d), y = lerp(st.bot + 26, st.top - 26, E('power1.inOut')(k));
      g.setAttribute('transform', `translate(0,${y.toFixed(1)})`);
      setO(g, k <= 0 || k >= 1 ? 0 : Math.min(1, k * 8, (1 - k) * 6));
    });
    st.front(t0, d, K);
    return g;
  };
  front(stacks[0], 8, tTog + 0.15, CLIMB);
  const cap = S.text('every position, every layer, in parallel', { x: PX(0) - 40, y: 560, size: 26, weight: 650, color: 'ink' });
  hide(cap);
  fade(cap, 0, 1, T('b2~parallel') - 0.15, 0.4);

  // ================================================================ b3: updated, and the first answer token
  const tUpd = T('b3~updated') - 0.2;
  prompt.forEach((w, i) => S.add(gsap.fromTo(w.pill.hi, { attr: { opacity: 0 } }, { attr: { opacity: 0.22 }, duration: 0.4, immediateRender: false }), tUpd + 0.04 * i));
  // a fan of score bars out of t8, then t9
  const tFan = T('b3~first') - 0.25;
  const fan = S.g();
  fan.setAttribute('data-audit', 'ignore');
  const H = [6, 22, 9, 4, 13, 5];
  H.forEach((h, i) => S.rect({ x: PX(7) + 46 + i * 7, y: PY0 - h / 2, w: 4, h, r: 1, fill: 'compute' }, fan));
  hide(fan);
  fade(fan, 0, 1, tFan, 0.2);
  fade(fan, 1, 0, tFan + 0.7, 0.3);
  const t9a = S.g();
  ch10Pill(S, { text: 't9', x: PX(8), y: PY0, kind: 'answer' }, t9a);
  const tT9 = tFan + 0.35;
  const tDrop = T('b4~each') - 0.2;
  // t9: pops out of t8, then (b4) drops into the bottom lane's first slot
  K.track(t9a, [K.K(tT9, { x: -40, y: 0, s: 0.5, o: 0 }), K.K(tT9 + 0.4, { x: 0, y: 0, s: 1, o: 1, e: 'back.out(1.8)' }),
    K.K(tDrop, { x: 0, y: 0 }), K.K(tDrop + 0.8, { x: PX(0) - PX(8), y: PY1 - PY0, e: 'power2.inOut' })], PX(8), PY0);
  const ready = S.text('ready to generate', { x: PX(8) + 54, y: PY0, size: 24, weight: 600, color: 'muted' });
  hide(ready);
  fade(ready, 0, 1, tT9 + 0.3, 0.35);

  // ================================================================ b4: decode, one token per pass
  const tB4 = T('b4') - 0.15;
  fade([cap, note, ready], 1, 0, tB4, 0.35);
  // passes: t9 → t10, t10 → t11, t11 → t12, t12 → stop
  const PASS = [[tDrop + 0.95, 1.0], [T('b4~again') - 0.05, 0.55], [T('b4~again#2') + 0.05, 0.5], [T('b4~until') + 0.12, 0.42]];
  const climbers = [t9a];
  const answers = [];
  ['t10', 't11', 't12', 'stop'].forEach((txt, i) => {
    const w = S.g();
    const p = ch10Pill(S, { text: txt, x: PX(i + 1), y: PY1, kind: txt === 'stop' ? 'stop' : 'answer' }, w);
    const [t0, d] = PASS[i], tp = t0 + d + 0.02;
    K.track(w, [K.K(tp, { x: -30, s: 0.5, o: 0 }), K.K(tp + 0.3, { x: 0, s: 1, o: 1, e: 'back.out(1.8)' })], PX(i + 1), PY1);
    answers.push(w);
    climbers.push(w);
    void p;
  });
  PASS.forEach(([t0, d], i) => {
    front(stacks[1], 1, t0, d);
    // the climbing pill lifts while its pass runs
    const w = climbers[i];
    const lift = S.g();
    w.parentNode.insertBefore(lift, w);
    lift.appendChild(w);
    whole(t => { const k = cl((t - t0) / 0.15) * (1 - cl((t - t0 - d) / 0.2)); lift.setAttribute('transform', `translate(0,${(-12 * k).toFixed(1)})`); });
  });
  const passes = S.text('passes: 0', { x: 1780, y: 690, size: 26, weight: 700, family: 'mono', anchor: 'end', color: 'ink' });
  hide(passes);
  fade(passes, 0, 1, PASS[0][0] - 0.1, 0.3);
  whole(t => { passes.textContent = `passes: ${PASS.filter(([t0, d]) => t >= t0 + d * 0.5).length}`; });
  const tStop = PASS[3][0] + PASS[3][1];
  const ruler = S.g();
  S.icon('ph:ruler-duotone', { x: PX(5) + 4, y: PY1, size: 34, color: 'muted' }, ruler);
  S.text('length limit', { x: PX(5) + 30, y: PY1, size: 24, weight: 600, color: 'muted' }, ruler);
  hide(ruler);
  fade(ruler, 0, 1, T('b4~length') - 0.1, 0.35);

  // ================================================================ b5: how many tokens share each load
  const tB5 = T('b5') - 0.15;
  fade([passes, ruler, l80, busL], 1, 0, tB5, 0.35);
  whole(t => { const k = cl((t - tB5) / 0.5); stacks[1].setAttribute('opacity', (t < tB5 ? lerp(1, 0.3, cl((t - tStop - 0.2) / 0.5)) : lerp(0.3, 1, k)).toFixed(3)); });
  const same = S.text('same chip · same weights · same code', { x: 960, y: 625, size: 26, weight: 600, anchor: 'middle', color: 'muted' });
  hide(same);
  fade(same, 0, 1, T('b5~Same') - 0.1, 0.4);
  const tHow = T('b5~tokens') - 0.15;
  fade(same, 1, 0, tHow, 0.3);
  const how = S.text('how many tokens share each load', { x: 960, y: 625, size: 28, weight: 700, anchor: 'middle', color: 'ink' });
  hide(how);
  fade(how, 0, 1, tHow + 0.3, 0.4);
  // one coral load from the HBM to both stacks, then to the tokens
  const tLoad = T('b5~each') - 0.1;
  const loadG = S.g();
  loadG.setAttribute('data-audit', 'ignore');
  const src = [gpu.stacks[3].cx, gpu.stacks[3].cy];
  // along the top margin, then down into the top stack; and down the right margin into the bottom stack
  const toTop = S.path({ d: `M${src[0]},${src[1]} C${src[0] + 200},250 ${SX},250 ${SX + 140},250 L${SX + 140},${stacks[0].top - 8}`, stroke: 'bytes', sw: 3 }, loadG);
  const toBot = S.path({ d: `M${src[0]},${src[1]} C${src[0] + 200},250 ${SX},250 1846,250 L1846,${stacks[1].slabY(5)} L${SX + 290},${stacks[1].slabY(5)}`, stroke: 'bytes', sw: 3 }, loadG);
  K.draw(toTop, 1600, tLoad, 0.55);
  K.draw(toBot, 2400, tLoad, 0.7);
  const fanTop = S.g(null, loadG), fanBot = S.g(null, loadG);
  prompt.forEach((w, i) => S.path({ d: `M${SX - 6},${stacks[0].slabY(2)} C${SX - 200},${stacks[0].slabY(2)} ${PX(i) + 40},${PY0 + 60} ${PX(i)},${PY0 + 24}`, stroke: 'bytes', sw: 1.6, strokeOpacity: 0.85 }, fanTop));
  S.path({ d: `M${SX - 6},${stacks[1].slabY(2)} C${SX - 300},${stacks[1].slabY(2)} ${PX(3) + 40},${PY1 + 70} ${PX(3)},${PY1 + 24}`, stroke: 'bytes', sw: 1.6, strokeOpacity: 0.85 }, fanBot);
  [...fanTop.children, ...fanBot.children].forEach(p => K.draw(p, 1300, tLoad + 0.5, 0.5));
  const lt = S.text('1 load : 8 tokens', { x: 1110, y: 400, size: 28, weight: 750, family: 'mono', anchor: 'middle', color: 'bytes' });
  const lb = S.text('1 load : 1 token', { x: 1110, y: 760, size: 28, weight: 750, family: 'mono', anchor: 'middle', color: 'bytes' });
  hide([lt, lb]);
  fade([lt, lb], 0, 1, tLoad + 0.8, 0.4, 0.15);
  void EIO; void pulse;
});
