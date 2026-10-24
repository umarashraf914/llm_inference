/* ch13_s06 · what actually re-enters the model each step (fig 137)
   Checked: 1,032 tokens a step against 1 is ≈ 1,000× the work; bars to scale at 0.872 px per token
   (1,032 → 900 px, 1 → 0.87 px, drawn 3 px so it shows; 1,100 → 959 px as the text grows).
   b1  the model block (20 layer slabs); top lane 'The loop as first drawn': nine pills, '…', 'all 1,032 tokens,
       every step'; a step counter 1, 2, 3, the whole row streaming into the model each tick; '?'.
   b2  bars between the lanes: amber '1,032 tokens per step', teal '1 token per step', '≈ 1,000×'; the amber bar
       lengthens; bottom lane 'What actually happens': nine dashed pills with K and V tiles, one amber pill that
       alone flows into the model; teal threads back to every dashed pill light its tiles.
   b3  the top lane is struck, dims and slides off; the amber pill turns dashed and joins the row, a new amber
       pill arrives and flows in alone; 'one token in, plus the cache'.
   Layout: model x 1500-1760, y 250-842; top lane pills y 340, bars y 480 / 535, bottom lane pills y 720
   (K and V tiles y 680-694, threads below the row), pill centres x 195 + 86 i. */
V.scene('ch13_s06', S => {
  const K = libKit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const { fx } = S;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1;
  const CX = i => 195 + 86 * i, MX = 1500;

  // ================================================================ the model block
  const model = S.g();
  S.text('model', { x: 1630, y: 222, size: 28, weight: 750, anchor: 'middle', color: 'ink' }, model);
  for (let j = 0; j < 20; j++) {
    const r = S.rect({ x: MX, y: 250 + 30 * j, w: 260, h: 22, r: 5, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.7, sw: 1.5 }, model);
    K.track(r, [K.K(0.3 + 0.03 * j, { x: 30, o: 0 }), K.K(0.7 + 0.03 * j, { x: 0, o: 1, e: 'power3.out' })]);
  }
  const mGlow = ['struct', 'compute'].map(tone => { const r = S.rect({ x: MX - 20, y: 230, w: 300, h: 632, r: 24, fill: `url(#pglow-${tone})`, opacity: 0 }, model); r.setAttribute('data-audit', 'ignore'); model.insertBefore(r, model.firstChild); return r; });

  // ================================================================ b1: the loop as first drawn
  const top = S.g();
  const tDrawn = T('b1~first') - 0.1;
  const h1 = S.text('The loop as first drawn', { x: 120, y: 220, size: 34, weight: 750, color: 'ink' }, top);
  const s1 = S.text('the whole text, fed in again', { x: 120, y: 262, size: 24, weight: 600, color: 'muted' }, top);
  S.add(fx.type(h1, { d: 0.6 }), tDrawn);
  S.add(fx.type(s1, { d: 0.6 }), tDrawn + 0.5);
  const topPills = [];
  for (let i = 0; i < 9; i++) {
    const g = S.g(null, top);
    libToken(S, { text: '', x: CX(i), y: 340, w: 70, h: 44, state: 'token' }, g);
    K.track(g, [K.K(tDrawn + 0.4 + 0.05 * i, { x: -20, o: 0 }), K.K(tDrawn + 0.8 + 0.05 * i, { x: 0, o: 1, e: 'power3.out' })]);
    topPills.push(g);
  }
  const ell = S.text('…', { x: CX(9) - 20, y: 336, size: 40, weight: 700, anchor: 'middle', color: 'muted' }, top);
  const allL = S.text('all 1,032 tokens, every step', { x: 120, y: 404, size: 24, weight: 650, color: 'struct' }, top);
  hide([ell, allL]);
  fade([ell, allL], 0, 1, tDrawn + 1.0, 0.35, 0.15);
  // three steps, each streaming the whole row into the model
  const tRe = T('b1~reenter') - 0.1, ticks = [0, 1, 2].map(k => tRe + 0.6 * k);
  const counter = S.text('step 1', { x: 1260, y: 300, size: 26, weight: 700, family: 'mono', anchor: 'middle', color: 'muted' }, top);
  hide(counter);
  fade(counter, 0, 1, ticks[0], 0.2);
  whole(t => { counter.textContent = `step ${Math.max(1, ticks.filter(a => t >= a).length)}`; });
  const streams = S.g(null, top);
  streams.setAttribute('data-audit', 'ignore');
  ticks.forEach(at => {
    for (let i = 0; i < 10; i++) {
      const r = S.rect({ x: -12, y: -9, w: 24, h: 18, r: 6, fill: 'struct', opacity: 0 }, streams);
      const x0 = i < 9 ? CX(i) : CX(9) - 20, a = at + 0.025 * i;
      whole(t => {
        const p = cl((t - a) / 0.55), x = lerp(x0, MX + 10, E('power2.in')(p));
        r.setAttribute('transform', `translate(${x.toFixed(1)},340)`);
        r.setAttribute('opacity', (p > 0 && p < 1 ? 0.85 * Math.min(1, p * 6, (1 - p) * 6) : 0).toFixed(3));
      });
    }
    pulse(mGlow[0], at + 0.45, 0.6, 0.5);
  });
  const qm = S.text('?', { x: 1030, y: 342, size: 52, weight: 800, anchor: 'middle', color: 'muted' }, top);
  hide(qm);
  fade(qm, 0, 1, T('b1~step') - 0.1, 0.35);

  // ================================================================ b2: a thousand times the work
  const bars = S.g();
  const tTh = T('b2~thousand') - 0.1, tWorse = T('b2~worse') - 0.1;
  const amb = S.rect({ x: 160, y: 467, w: 0, h: 26, r: 6, fill: 'url(#solid-compute)' }, bars);
  const ambL = S.text('1,032 tokens per step', { x: 1075, y: 481, size: 26, weight: 700, color: 'compute' }, bars);
  const teal = S.rect({ x: 160, y: 522, w: 0, h: 26, r: 1.5, fill: 'helps' }, bars);
  const tealL = S.text('1 token per step', { x: 176, y: 536, size: 26, weight: 700, color: 'helps' }, bars);
  const thou = S.text('≈ 1,000×', { x: 620, y: 536, size: 30, weight: 800, color: 'ink' }, bars);
  hide([ambL, tealL, thou]);
  whole(t => {
    const w = 900 * EIO(cl((t - tTh) / 0.7)) + 59 * EIO(cl((t - tWorse) / 0.8));
    amb.setAttribute('width', w.toFixed(1));
    ambL.setAttribute('x', (175 + w).toFixed(1));
    ambL.textContent = `${Math.round(1032 + 68 * EIO(cl((t - tWorse) / 0.8))).toLocaleString('en-US')} tokens per step`;
    teal.setAttribute('width', (3 * cl((t - tTh - 0.3) / 0.2)).toFixed(1));
  });
  fade(ambL, 0, 1, tTh + 0.5, 0.3);
  fade(tealL, 0, 1, tTh + 0.6, 0.3);
  fade(thou, 0, 1, tTh + 0.9, 0.35);

  // ================================================================ b2: what actually happens
  const bot = S.g();
  const tOnly = T('b2~Only') - 0.1;
  const h2 = S.text('What actually happens', { x: 120, y: 600, size: 34, weight: 750, color: 'ink' }, bot);
  const s2 = S.text('one token, plus the cache', { x: 120, y: 642, size: 24, weight: 600, color: 'helps' }, bot);
  S.add(fx.type(h2, { d: 0.6 }), tOnly);
  S.add(fx.type(s2, { d: 0.6 }), tOnly + 0.4);
  const tiles = [];
  const mkCached = (i, at) => {
    const g = S.g(null, bot);
    libToken(S, { text: '', x: CX(i), y: 720, w: 70, h: 44, state: 'ghost' }, g);
    const kv = S.g(null, g);
    const k = S.rect({ x: CX(i) - 16, y: 680, w: 15, h: 14, r: 3, fill: 'struct', opacity: 0.45 }, kv);
    const v = S.rect({ x: CX(i) + 1, y: 680, w: 15, h: 14, r: 3, fill: '#1f3a68', stroke: 'struct', sw: 1, opacity: 0.45 }, kv);
    K.track(g, [K.K(at, { y: -14, o: 0 }), K.K(at + 0.35, { y: 0, o: 1, e: 'power3.out' })]);
    tiles.push({ k, v });
    return g;
  };
  for (let i = 0; i < 9; i++) mkCached(i, tOnly + 0.3 + 0.05 * i);
  const cacheL = S.text('already in the cache, not recomputed', { x: 120, y: 840, size: 24, weight: 650, color: 'muted' }, bot);
  hide(cacheL);
  fade(cacheL, 0, 1, tOnly + 0.9, 0.35);
  // the newest token: amber, the only one that goes through
  const tNewest = T('b2~newest') - 0.1;
  const amberTok = S.g(null, bot);
  const aTok = libToken(S, { text: '', x: CX(9), y: 720, w: 70, h: 44, state: 'prefill' }, amberTok);
  K.track(amberTok, [K.K(tNewest, { y: -14, o: 0 }), K.K(tNewest + 0.35, { y: 0, o: 1, e: 'back.out(2)' })]);
  const flowIn = (x0, at) => {
    const r = S.rect({ x: -30, y: -20, w: 60, h: 40, r: 12, fill: 'url(#solid-compute)', opacity: 0 }, bot);
    r.setAttribute('data-audit', 'ignore');
    whole(t => {
      const p = cl((t - at) / 0.7), x = lerp(x0, MX + 20, E('power2.inOut')(p)), s = lerp(1, 0.6, p);
      r.setAttribute('transform', `translate(${x.toFixed(1)},720) scale(${s.toFixed(3)})`);
      r.setAttribute('opacity', (p > 0 && p < 1 ? Math.min(1, (1 - p) * 5) : 0).toFixed(3));
    });
    pulse(mGlow[1], at + 0.6, 0.8, 0.6);
  };
  flowIn(CX(9), T('b2~goes') - 0.1);
  // teal threads from the newest token back to every cached token: reused, not recomputed
  const threads = (from, n, at, parent) => {
    const g = S.g(null, parent);
    g.setAttribute('data-audit', 'ignore');
    for (let j = n - 1; j >= 0; j--) {
      const d = CX(from) - CX(j), dep = Math.min(78, 16 + d * 0.085);
      const p = S.path({ d: `M${CX(from) - 8},744 C${CX(from) - 8 - d * 0.15},${744 + dep} ${CX(j) + d * 0.15},${744 + dep} ${CX(j)},744`, stroke: 'helps', sw: 2.2 }, g);
      K.draw(p, d * 1.3 + 40, at + 0.05 * (n - 1 - j), 0.45);
    }
    return g;
  };
  const tKeys = T('b2~keys') - 0.1;
  const th1 = threads(9, 9, tKeys, bot);
  whole(t => tiles.forEach(({ k, v }, j) => {
    const lit = cl((t - tKeys - 0.05 * (8 - j) - 0.35) / 0.25);
    k.setAttribute('fill', S.tone(lit > 0.5 ? 'helps' : 'struct')); v.setAttribute('stroke', S.tone(lit > 0.5 ? 'helps' : 'struct'));
    k.setAttribute('opacity', (0.45 + 0.55 * lit).toFixed(3)); v.setAttribute('opacity', (0.45 + 0.55 * lit).toFixed(3));
  }));

  // ================================================================ b3: the sequence grows, the work per step does not
  const strikeT = S.path({ d: 'M110,222 H520', stroke: 'muted', sw: 4 }, top);
  strikeT.setAttribute('data-audit', 'ignore');
  K.draw(strikeT, 430, tB3, 0.35);
  K.track(top, [K.K(tB3 + 0.4, { x: 0, o: 1 }), K.K(tB3 + 1.1, { x: -220, o: 0, e: 'power2.in' })]);
  fade(bars, 1, 0, tB3, 0.4);
  // the amber token is now cached: dashed, with its own K and V tile, lit
  const tGrow = T('b3~grows') - 0.1;
  S.add(aTok.setState('ghost', { d: 0.4 }), tGrow);
  const kv9 = S.g(null, bot);
  S.rect({ x: CX(9) - 16, y: 680, w: 15, h: 14, r: 3, fill: 'helps' }, kv9);
  S.rect({ x: CX(9) + 1, y: 680, w: 15, h: 14, r: 3, fill: '#1f3a68', stroke: 'helps', sw: 1 }, kv9);
  hide(kv9);
  fade(kv9, 0, 1, tGrow + 0.3, 0.3);
  fade(th1, 1, 0, tGrow - 0.1, 0.3);
  // a new amber token arrives, threads back to all ten, and flows in alone
  const nTok = S.g(null, bot);
  libToken(S, { text: '', x: CX(10), y: 720, w: 70, h: 44, state: 'prefill' }, nTok);
  K.track(nTok, [K.K(tGrow + 0.4, { x: 160, o: 0 }), K.K(tGrow + 0.9, { x: 0, o: 1, e: 'power3.out' })]);
  threads(10, 10, tGrow + 1.0, bot);
  flowIn(CX(10), T('b3~step') - 0.1);
  const key = S.text('one token in, plus the cache', { x: 640, y: 340, size: 44, weight: 800, anchor: 'middle', color: 'helps' });
  hide(key);
  S.add(K.drive(0.5, k => { setO(key, k); key.setAttribute('transform', `translate(0,${(14 * (1 - E('power3.out')(k))).toFixed(1)})`); }), T('b3~does') - 0.1);
  void topPills; void ell; void tB2; void EIO;
});
