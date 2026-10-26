/* ch17_s04 · two levers, and why the phases split (fig 145)
   TTFT for a long prompt is a compute problem: 2,000 tokens ≈ 290 trillion ops / 989 trillion/s = 0.29 s at full
   speed. TPOT is a bandwidth problem: 140 GB / 3.35 TB/s = 41.8 ms on an H100; an H200 has the same arithmetic and
   4.8 TB/s: 29.2 ms, while the prompt's ~146 GB of bytes (43.6 ms, 30.4 ms) stay far inside the 293 ms of
   arithmetic, so the pause barely moves. Prefilling a new prompt on arrival stalls every stream for its 293 ms:
   one gap becomes 293 + 42 = 335 ms, 8× the usual (all checked).
   b1  the two panels and their gauges; a long prompt fills the amber grid; 'compute: keep the arithmetic units
       fed'; a few units flicker dark and are refilled.
   b2  'bandwidth: move fewer bytes per token', byte particles shrink; the chip card H100 → H200: same arithmetic,
       4.8 TB/s; the coral gauge 42 → 29 ms; the amber gauge twitches but holds at 0.29 s.
   b3  three streaming lanes; a fourth user's prompt prefilled on arrival stalls them all: '≈ 335 ms, 8× the
       usual gap'; the coral gauge kicks to 335 ms and falls back.
   b4  the panels pull apart into prefill machines and decode machines; 'keys and values' travel between them,
       'KV transfer'; the six-stop route flashes with its KV transfer stop.
   Layout: panels x 120-900 (amber) and 1020-1800 (coral), y 130-740; gauges at (280, 370) and (1180, 370);
   the lower strip y 780-1000 (chip card, then lanes at y 820 / 880 / 940, 1.5 px per ms from x 230). */
V.scene('ch17_s04', S => {
  const K = libKit(S), { T, cl, E, EIO, whole, setO, hide, fade } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const hsh = i => { const v = Math.sin(i * 12.9898 + 0.7) * 43758.5453; return v - Math.floor(v); };

  // ================================================================ the panels and their gauges
  const tPull = T('b4~serving') - 0.1, tSplit = T('b4~split') - 0.1;
  const panel = (x, tone, title, side) => {
    const h = S.g(), g = S.g(null, h);
    S.rect({ x, y: 130, w: 780, h: 610, r: 24, fill: '#0c1326', fillOpacity: 0.75, stroke: tone, strokeOpacity: 0.85, sw: 2.5 }, g);
    S.icon('ph:sliders-horizontal-duotone', { x: x + 52, y: 186, size: 40, color: tone }, g);
    S.text(title, { x: x + 84, y: 187, size: 34, weight: 800, color: tone }, g);
    K.track(h, [K.K(0.6, { x: -260 * side, o: 0 }), K.K(1.3, { x: 0, o: 1, e: 'power3.out' }), K.K(tPull, {}), K.K(tPull + 0.8, { x: 70 * side, e: 'power3.inOut' })]);
    g.h = h;
    return g;
  };
  const PL = panel(120, 'compute', 'Improving TTFT', -1), PR = panel(1020, 'bytes', 'Improving TPOT', 1);
  K.ignore([PL.h, PR.h], 0.6, 0.8);
  K.ignore([PL.h, PR.h], tPull, 0.9);
  const gauge = (parent, cx, cy, tone, valOf, textOf) => {
    const g = S.g(null, parent);
    S.path({ d: `M${cx - 64},${cy} A64,64 0 0 1 ${cx + 64},${cy}`, stroke: '#ffffff', strokeOpacity: 0.25, sw: 8, cap: 'round' }, g);
    const arc = S.path({ d: '', stroke: tone, sw: 8, cap: 'round' }, g);
    const nd = S.path({ d: `M${cx},${cy} V${cy - 56}`, stroke: '#ffffff', sw: 3.5 }, g);
    S.circle({ x: cx, y: cy, r: 6, fill: '#ffffff' }, g);
    const val = S.text('', { x: cx + 96, y: cy - 18, size: 44, weight: 800, color: tone, family: 'mono' }, g);
    [arc, nd].forEach(e => e.setAttribute('data-audit', 'ignore'));
    whole(t => {
      const v = valOf(t), a = Math.PI * (1 - cl(v)), ex = cx + 64 * Math.cos(a), ey = cy - 64 * Math.sin(a);
      arc.setAttribute('d', `M${cx - 64},${cy} A64,64 0 0 1 ${ex.toFixed(1)},${ey.toFixed(1)}`);
      nd.setAttribute('transform', `rotate(${(-90 + 180 * cl(v)).toFixed(1)},${cx},${cy})`);
      val.textContent = textOf(t);
    });
    g.val = val;
    return g;
  };
  // amber: 0.29 s, a twitch on 'the pause barely moves'
  const tBarely = T('b2~barely') - 0.1;
  const gA = gauge(PL, 280, 370, 'compute', t => 0.58 + 0.025 * Math.sin(Math.PI * cl((t - tBarely) / 0.5)) * Math.sin(t * 40), () => '0.29 s');
  const subA = S.text('2,000-token prompt, at full speed', { x: 376, y: 400, size: 24, weight: 650, color: 'muted' }, PL);
  const deriv = S.text('290 trillion ops ÷ 989 trillion/s', { x: 376, y: 436, size: 26, weight: 650, color: 'muted' }, PL);
  // coral: 42 ms → 29 ms (H200); 42 ms again in b3, a kick to 335 ms at the stall
  const tShrink = T('b2~shrink') - 0.1, tStall = T('b3~stall') - 0.05;
  const msOf = t => {
    if (t < tB3) return 41.8 + (29.2 - 41.8) * EIO(cl((t - tShrink) / 0.6));
    const kick = cl((t - tStall) / 0.25) * (1 - cl((t - tStall - 0.9) / 0.5));
    return 41.8 + (335 - 41.8) * kick;
  };
  const gC = gauge(PR, 1180, 370, 'bytes', t => msOf(t) / 100, t => `${Math.round(msOf(t))} ms`);
  fade([gA, gC, subA], 0, 1, 1.3, 0.4);
  fade(deriv, 0, 1, 1.5, 0.4);
  const tick = S.g(null, PR);
  S.circle({ x: 1440, y: 336, r: 14, fill: 'helps' }, tick);
  S.path({ d: 'M1433,336 L1438,342 L1448,330', stroke: '#0a0f1e', sw: 3 }, tick);
  rise(tick, tShrink + 0.6, 0);
  fade(tick, 1, 0, tB3, 0.3);
  const g29 = S.rect({ x: 1260, y: 322, w: 140, h: 60, r: 18, fill: 'url(#pglow-bytes)', opacity: 0 }, PR);
  g29.setAttribute('data-audit', 'ignore');
  K.pulse(g29, T('b2~thirty') - 0.05, 1, 0.7);

  // ================================================================ b1: TTFT is a compute problem
  const line = (parent, x, txt, tone, at, out) => { const e = S.text(txt, { x, y: 246, size: 28, weight: 700, color: tone }, parent); rise(e, at, 6); fade(e, 1, 0, out, 0.3); return e; };
  line(PL, 164, 'compute: keep the arithmetic units fed', 'compute', T('b1~compute') - 0.1, tB2);
  const tLong = T('b1~long') - 0.1, tFed = T('b1~fed') - 0.15;
  const grid = S.g(null, PL), sq = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 14; c++) sq.push([S.rect({ x: 420 + 30 * c, y: 500 + 30 * r, w: 24, h: 24, r: 4, fill: '#2a2210', stroke: 'compute', strokeOpacity: 0.35, sw: 1.5 }, grid), r, c]);
  grid.setAttribute('data-audit', 'ignore');
  const prompt = S.rect({ x: 170, y: 560, w: 200, h: 60, r: 10, fill: 'url(#card-struct)', stroke: 'struct', sw: 2.5 }, PL);
  prompt.setAttribute('data-audit', 'ignore');
  const promptL = S.text('long prompt', { x: 270, y: 591, size: 24, weight: 700, anchor: 'middle', color: 'ink' }, PL);
  const flick = sq.filter((_, i) => hsh(i) < 0.12);
  whole(t => {
    const k = EIO(cl((t - tLong) / 1.2));
    prompt.setAttribute('width', (200 * (1 - k) + 2).toFixed(1));
    prompt.setAttribute('x', (170 + 230 * k).toFixed(1));
    setO(prompt, t > tLong - 0.4 ? (1 - cl((k - 0.85) / 0.15)) * cl((t - tLong + 0.4) / 0.3) : 0);
    setO(promptL, cl((t - tLong + 0.4) / 0.3) * (1 - cl((t - tLong - 0.1) / 0.2)));
    sq.forEach(([e, r, c], i) => {
      const lit = t > tLong + 0.2 + 0.05 * c;
      const off = flick.some(f => f[0] === e) && t > tFed && t < tFed + 0.35 + 0.15 * (i % 3);
      e.setAttribute('fill', lit && !off ? S.tone('compute') : '#2a2210');
      e.setAttribute('fill-opacity', lit && !off ? '0.85' : '1');
    });
  });
  // work particles refill the flickering units
  flick.slice(0, 6).forEach(([e, r, c], j) => {
    const p = S.circle({ x: 0, y: 0, r: 5, fill: 'struct' }, PL);
    p.setAttribute('data-audit', 'ignore');
    whole(t => { const k = cl((t - tFed - 0.05 * j) / 0.35); p.setAttribute('cx', (380 + (432 + 30 * c - 380) * k).toFixed(1)); p.setAttribute('cy', (590 + (512 + 30 * r - 590) * k).toFixed(1)); setO(p, k > 0 && k < 1 ? 1 : 0); });
  });

  // ================================================================ b2: TPOT is a bandwidth problem; H100 → H200
  line(PR, 1064, 'bandwidth: move fewer bytes per token', 'bytes', T('b2~bandwidth') - 0.1, T('b2~Swap') - 0.1);
  fade(deriv, 1, 0, T('b2~Swap') - 0.1, 0.3);
  const pipe = S.g(null, PR);
  S.rect({ x: 1080, y: 560, w: 660, h: 64, r: 32, fill: '#1a0f14', stroke: 'bytes', sw: 2.5 }, pipe);
  S.text('weights, every token', { x: 1410, y: 668, size: 24, weight: 650, anchor: 'middle', color: 'bytes' }, pipe);
  const tPart = T('b2~bandwidth') + 0.2, tFew = T('b2~fewer') - 0.1;
  for (let i = 0; i < 16; i++) {
    const p = S.rect({ x: 0, y: 0, w: 22, h: 22, r: 4, fill: 'bytes' }, pipe);
    p.setAttribute('data-audit', 'ignore');
    whole(t => {
      const u = ((t - tPart) * 0.45 + i / 16) % 1, s = 1 - 0.5 * cl((t - tFew) / 0.5), sz = 22 * s;
      p.setAttribute('x', (1100 + 620 * u - sz / 2).toFixed(1)); p.setAttribute('y', (592 - sz / 2).toFixed(1));
      p.setAttribute('width', sz.toFixed(1)); p.setAttribute('height', sz.toFixed(1));
      setO(p, t > tPart ? Math.sin(Math.PI * u) : 0);
    });
  }
  const tSwap = T('b2~Swap') - 0.1, t200 = T('b2~H#2') - 0.1, tSame = T('b2~same') - 0.1, tFast = T('b2~faster') - 0.1;
  const card = S.g(), cardIn = S.g(null, card);
  S.rect({ x: 760, y: 790, w: 400, h: 200, r: 18, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.3, sw: 2 }, cardIn);
  S.icon('ph:cpu-duotone', { x: 806, y: 836, size: 44, color: 'muted' }, cardIn);
  const nm100 = S.text('H100', { x: 840, y: 838, size: 36, weight: 800, color: 'ink' }, cardIn);
  const nm200 = S.text('H200', { x: 840, y: 838, size: 36, weight: 800, color: 'ink' }, cardIn);
  S.text('989 trillion ops/s', { x: 790, y: 904, size: 30, weight: 750, color: 'compute' }, cardIn);
  const bw = S.text('3.35 TB/s', { x: 790, y: 952, size: 30, weight: 750, color: 'bytes', family: 'mono' }, cardIn);
  const bwG = S.rect({ x: 776, y: 928, w: 220, h: 48, r: 14, fill: 'url(#pglow-bytes)', opacity: 0 }, cardIn);
  bwG.setAttribute('data-audit', 'ignore');
  cardIn.insertBefore(bwG, bw);
  K.pulse(bwG, tFast + 0.2, 1, 1.0);
  whole(t => {
    const f = cl((t - t200) / 0.4), sx = Math.abs(Math.cos(Math.PI * f));
    cardIn.setAttribute('transform', `translate(960,0) scale(${Math.max(0.02, sx).toFixed(3)},1) translate(-960,0)`);
    setO(nm100, f < 0.5 ? 1 : 0); setO(nm200, f >= 0.5 ? 1 : 0);
    const k = EIO(cl((t - tFast) / 0.8));
    bw.textContent = `${(3.35 + (4.8 - 3.35) * k).toFixed(k > 0.99 ? 1 : 2)} TB/s`;
  });
  K.ignore(card, t200, 0.45);
  K.track(card, [K.K(tSwap, { y: 60, o: 0 }), K.K(tSwap + 0.5, { y: 0, o: 1, e: 'power3.out' }), K.K(tB3, {}), K.K(tB3 + 0.4, { y: 40, o: 0 })]);
  const sameN = S.text('same arithmetic', { x: 376, y: 436, size: 26, weight: 700, color: 'muted' }, PL);
  rise(sameN, tSame, 6);
  fade(sameN, 1, 0, tB3, 0.3);

  // ================================================================ b3: a change can hurt the other
  const LX = ms => 230 + 1.5 * ms, LANE = [820, 880, 940], TOK = 41.8, PRE = 293;
  const lanes = S.g();
  const users = LANE.map(y => S.icon('ph:user-circle-duotone', { x: 180, y, size: 40, color: 'ink' }, lanes));
  void users;
  LANE.forEach(y => S.line({ x1: 210, y1: y, x2: 1500, y2: y, stroke: '#ffffff', strokeOpacity: 0.12, sw: 1.5 }, lanes));
  rise(lanes, tB3 + 0.4, 10);
  const tNew = T('b3~new') - 0.1, tArr = T('b3~on') - 0.1, tQuick = T('b3~quicker') - 0.1;
  const blockStart = 5 * TOK + 25;  // the prefill lands between two of the lanes' tokens
  // tokens before the block arrive at a steady rhythm; the ones after wait for the block to end
  LANE.forEach((y, l) => {
    for (let k = 0; k < 12; k++) {
      const ms = k < 6 ? (k * TOK + 8 * l) : (blockStart + PRE + (k - 5) * TOK - 25 + 8 * l);
      if (LX(ms) > 1480) continue;
      const at = k < 6 ? tB3 + 0.6 + 0.22 * k + 0.05 * l : tStall + 0.35 + 0.18 * (k - 6) + 0.05 * l;
      const p = S.rect({ x: LX(ms) - 16, y: y - 12, w: 32, h: 24, r: 7, fill: 'url(#card-struct)', stroke: 'struct', sw: 2 });
      p.setAttribute('data-audit', 'ignore');
      rise(p, at, -8, 0.2);
      fade(p, 1, 0, tPull, 0.3);  // after the last post-stall token has landed
    }
  });
  // the fourth user, with a long prompt, prefilled on arrival
  const u4 = S.g();
  S.icon('ph:user-circle-duotone', { x: 1580, y: 880, size: 44, color: 'ink' }, u4);
  S.rect({ x: 1620, y: 860, w: 200, h: 40, r: 10, fill: 'url(#card-struct)', stroke: 'struct', sw: 2.5 }, u4);
  S.text('new prompt', { x: 1720, y: 881, size: 22, weight: 700, anchor: 'middle', color: 'ink' }, u4);
  rise(u4, tNew, 8);
  const blk = S.g();
  S.rect({ x: LX(blockStart), y: 796, w: 1.5 * PRE, h: 168, r: 12, fill: 'compute', fillOpacity: 0.32, stroke: 'compute', sw: 3 }, blk);
  S.text('prefill ≈ 0.29 s', { x: LX(blockStart + PRE / 2), y: 881, size: 28, weight: 800, anchor: 'middle', color: 'ink' }, blk);
  K.track(blk, [K.K(tArr, { y: -60, o: 0 }), K.K(tArr + 0.45, { y: 0, o: 1, e: 'bounce.out' })]);
  const simp = S.pill('simplest scheduler', { x: LX(blockStart + PRE / 2), y: 1000, tone: 'neutral', size: 22, h: 36 });
  rise(simp, tArr + 0.5, 6);
  const p4 = S.rect({ x: 1560, y: 914, w: 32, h: 24, r: 7, fill: 'url(#card-struct)', stroke: 'struct', sw: 2 });
  p4.setAttribute('data-audit', 'ignore');
  rise(p4, tQuick + 0.2, -8, 0.25);
  const glA = S.rect({ x: 180, y: 290, w: 300, h: 160, r: 30, fill: 'url(#pglow-compute)', opacity: 0 }, PL);
  glA.setAttribute('data-audit', 'ignore');
  PL.insertBefore(glA, PL.firstChild.nextSibling);
  K.pulse(glA, tQuick + 0.2, 1, 0.9);
  // the stall: the top lane's gap, bracketed
  const g0 = LX(5 * TOK) + 16, g1 = LX(blockStart + PRE + TOK - 25) - 16;
  const stB = S.g();
  const sp = S.path({ d: `M${g0},${LANE[0] - 22} v-8 H${g1} v8`, stroke: '#ffffff', sw: 2.5 }, stB);
  sp.setAttribute('data-audit', 'ignore');
  S.text('≈ 335 ms, 8× the usual gap', { x: (g0 + g1) / 2, y: 762, size: 26, weight: 800, anchor: 'middle', color: 'ink' }, stB);
  rise(stB, tStall + 0.6, 6);
  fade([lanes, blk, simp, u4, p4, stB], 1, 0, tPull, 0.35);

  // ================================================================ b4: split the two phases
  fade([grid, prompt, pipe, subA], 1, 0, tPull, 0.35);
  const racks = (x, tone, label) => {
    const g = S.g();
    for (let i = 0; i < 3; i++) S.icon('ph:hard-drives-duotone', { x: x + 120 * i, y: 560, size: 96, color: tone }, g);
    S.text(label, { x: x + 120, y: 650, size: 30, weight: 800, anchor: 'middle', color: tone }, g);
    rise(g, tSplit, 10, 0.5);
    return g;
  };
  racks(320 - 70, 'compute', 'prefill machines');
  racks(1240 + 70, 'bytes', 'decode machines');
  const tHw = T('b4~different') - 0.1;
  const route = S.path({ d: 'M440,750 C520,840 1400,840 1480,750', stroke: 'helps', sw: 3 });
  route.setAttribute('data-audit', 'ignore');
  K.draw(route, 1200, tHw, 0.5);
  const kvB = S.g();
  S.rect({ x: -88, y: -22, w: 176, h: 44, r: 12, fill: 'url(#card-helps)', stroke: 'helps', sw: 2.5 }, kvB);
  S.text('keys and values', { x: 0, y: 1, size: 24, weight: 750, anchor: 'middle', color: 'ink' }, kvB);
  kvB.setAttribute('data-audit', 'ignore');
  whole(t => {
    const u = EIO(cl((t - tHw - 0.3) / 1.1)), b = 1 - u;
    const x = b * b * b * 440 + 3 * b * b * u * 520 + 3 * b * u * u * 1400 + u * u * u * 1480, y = b * b * b * 750 + 3 * b * b * u * 840 + 3 * b * u * u * 840 + u * u * u * 750;
    kvB.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
    setO(kvB, t > tHw + 0.3 ? 1 : 0);
  });
  const kvT = S.pill('KV transfer', { x: 960, y: 868, tone: 'helps', size: 24, h: 40 });
  rise(kvT, tHw + 0.4, 6);
  // the six-stop route from chapter 4, in miniature, with its KV transfer stop lit
  const mini = S.g();
  const STOPS = ['ph:signpost-duotone', 'ph:queue-duotone', 'ph:file-text-duotone', 'ph:arrows-left-right-duotone', 'ph:arrows-clockwise-duotone', 'ph:laptop-duotone'];
  S.rect({ x: 690, y: 930, w: 540, h: 76, r: 16, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.2, sw: 1.5 }, mini);
  S.line({ x1: 740, y1: 968, x2: 1180, y2: 968, stroke: '#8b95ad', strokeOpacity: 0.5, sw: 2 }, mini);
  STOPS.forEach((ic, i) => {
    const x = 740 + 88 * i;
    if (i === 3) S.circle({ x, y: 968, r: 26, fill: '#0c1326', stroke: 'helps', sw: 3 }, mini);
    else S.circle({ x, y: 968, r: 22, fill: '#0c1326', stroke: '#8b95ad', strokeOpacity: 0.5, sw: 1.5 }, mini);
    S.icon(ic, { x, y: 968, size: 30, color: i === 3 ? 'helps' : 'muted' }, mini);
  });
  mini.setAttribute('data-audit', 'ignore');
  whole(t => setO(mini, cl((t - tHw - 0.6) / 0.3) * (1 - cl((t - tHw - 2.2) / 0.4))));
});
