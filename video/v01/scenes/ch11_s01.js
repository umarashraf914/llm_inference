/* ch11_s01 · the slowest step sets the pace (fig 119)
   b1  a laundry line: wash 30 min, dry 60 min, fold 10 min; four baskets on the conveyor, every station busy,
       the icons working; a basket leaves: 'one load every 60 min'.
   b2  faster washing (15) and folding (5) change nothing (white flashes; the counter pulses, unchanged); a white
       ring and tag 'bottleneck' on the dryer; wash and fold revert, the dryer drops to 40 (teal), the queue
       shortens: 'one load every 40 min'.
   b3  the laundry shrinks into a strip at the top (scale 0.45, (960, 300) → (960, 110)); the chip's two
       stations: coral 'memory', a pipe with byte particles, amber 'arithmetic' with sparks; 'two possible
       bottlenecks' → 'bound by: whichever runs out first'.
   b4  memory bound: a trickle, the arithmetic greys with an hourglass: 'memory bound: arithmetic idle' + 'decode';
       compute bound: a dense stream inside a dotted outline of the spare width, gauge 100 %: 'compute bound:
       bandwidth spare'; then 'memory bound wastes arithmetic' / 'compute bound wastes bandwidth'.
   b5  the band dims; two region labels with a white divider and a white dot: 'one limit at a time'; faint coral
       and amber washes either side.
   Layout: cards 360 × 210 at x 480 / 960 / 1440, y 300-510; conveyor y 580; counter (960, 680); chip band:
   memory (480, 520), pipe x 680-1240, arithmetic (1440, 520). */
V.scene('ch11_s01', S => {
  const K = ch11Kit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const TEAL = S.tone('helps');

  // ================================================================ b1: the laundry line
  const laundry = S.g();
  const XS = [480, 960, 1440], CW = 360, CH = 210, CY0 = 300;
  const ST = [['ph:washing-machine-duotone', 'wash', '30 min', 'b1~washing'], ['tabler:wash-tumble-dry', 'dry', '60 min', 'b1~drying'], ['ph:t-shirt-duotone', 'fold', '10 min', 'b1~folding']];
  const texts = [];
  const cards = ST.map(([icon, name, tag, cue], i) => {
    const g = S.g(null, laundry), x = XS[i];
    S.rect({ x: x - CW / 2, y: CY0, w: CW, h: CH, r: 20, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.8, sw: 2 }, g);
    const ic = S.g(null, g);
    S.icon(icon, { x, y: CY0 + 64, size: 74, color: 'struct' }, ic);
    g.ic = ic;
    const nm = S.text(name, { x, y: CY0 + 136, size: 32, weight: 750, anchor: 'middle', color: 'ink' }, g);
    g.tags = {};
    texts.push(nm);
    const t0 = T(cue) - 0.1;
    K.track(g, [K.K(t0, { s: 0.8, o: 0 }), K.K(t0 + 0.4, { s: 1, o: 1, e: 'back.out(1.6)' })], x, CY0 + CH / 2);
    Object.assign(g, { x, tag0: tag });
    return g;
  });
  // the time tags, swapped by cross-fades; a flash rect per card for the white / teal flashes
  const tagText = (card, s, color = 'muted') => { const e = S.text(s, { x: card.x, y: CY0 + 178, size: 28, weight: 700, family: 'mono', anchor: 'middle', color }, card); hide(e); texts.push(e); return e; };
  const flash = card => { const r = S.rect({ x: card.x - CW / 2 + 90, y: CY0 + 158, w: CW - 180, h: 40, r: 10, fill: 'white', opacity: 0 }, card); r.setAttribute('data-audit', 'ignore'); return r; };
  const [wash, dry, fold] = cards;
  const w30 = tagText(wash, '30 min'), w15 = tagText(wash, '15 min', 'ink'), w30b = tagText(wash, '30 min');
  const d60 = tagText(dry, '60 min'), d40 = tagText(dry, '40 min', 'helps');
  const f10 = tagText(fold, '10 min'), f5 = tagText(fold, '5 min', 'ink'), f10b = tagText(fold, '10 min');
  const [fW, fD, fF] = cards.map(flash);
  fade(w30, 0, 1, T('b1~washing') + 0.3, 0.3);
  fade(d60, 0, 1, T('b1~drying') + 0.3, 0.3);
  fade(f10, 0, 1, T('b1~folding') + 0.3, 0.3);
  // the conveyor and the baskets
  const conv = S.g(null, laundry);
  S.rect({ x: 200, y: 572, w: 1520, h: 16, r: 8, fill: 'white', fillOpacity: 0.07, stroke: 'white', strokeOpacity: 0.2, sw: 1.5 }, conv);
  hide(conv);
  fade(conv, 0, 1, T('b1~washing') - 0.1, 0.4);
  const basket = () => { const g = S.g(null, laundry); S.rect({ x: -34, y: -20, w: 68, h: 40, r: 20, fill: 'url(#solid-struct)' }, g); S.icon('ph:basket-duotone', { x: 0, y: 0, size: 26, color: '#0a0f1e' }, g); return g; };
  const tAll = T('b1~all') - 0.1, tLeave = T('b1~once') - 0.1, tB2 = T('b2') - 0.1, tOnly = T('b2~only') - 0.1;
  const baskets = [0, 1, 2, 3, 4].map(basket);
  // positions: at a station (x), queued before the dryer (760 / 680), gone (x 1820)
  const BK = [
    [K.K(tAll, { x: 120, o: 0 }), K.K(tAll + 0.6, { x: 480, o: 1 })],
    [K.K(tAll, { x: 120, o: 0 }), K.K(tAll + 0.7, { x: 760, o: 1 }), K.K(tOnly + 0.3, { x: 760, o: 1 }), K.K(tOnly + 0.8, { x: 760, o: 0 })],
    [K.K(tAll, { x: 120, o: 0 }), K.K(tAll + 0.8, { x: 960, o: 1 })],
    [K.K(tAll, { x: 120, o: 0 }), K.K(tAll + 0.9, { x: 1440, o: 1 }), K.K(tLeave, { x: 1440, o: 1 }), K.K(tLeave + 0.6, { x: 1800, o: 0 })],
    [K.K(tB2 + 1.2, { x: 120, o: 0 }), K.K(tB2 + 1.8, { x: 680, o: 1 }), K.K(tOnly + 0.3, { x: 680, o: 1 }), K.K(tOnly + 0.8, { x: 760, o: 1 })],
  ];
  baskets.forEach((b, i) => K.track(b, BK[i].map(([t, st]) => [t, { ...st, y: 580 }])));
  // the icons work together: the drum turns, heat shimmers, the shirt folds
  const shimmer = S.g(null, dry);
  [-22, 0, 22].forEach(dx => S.path({ d: `M${960 + dx},${CY0 + 22} q6,-8 0,-16 q-6,-8 0,-16`, stroke: 'struct', sw: 2.5, strokeOpacity: 0.8 }, shimmer));
  shimmer.setAttribute('data-audit', 'ignore');
  whole(t => {
    const on = t > tAll + 0.6 && t < T('b3') ? 1 : 0;
    // in the strip the words fade, so each icon settles to the middle of its card
    const mid = (CH / 2 - 64) * EIO(cl((t - T('b3') + 0.1) / 0.6));
    wash.ic.setAttribute('transform', `translate(0,${mid.toFixed(1)}) rotate(${(on * 12 * Math.sin(t * 7)).toFixed(2)} ${480} ${CY0 + 64})`);
    dry.ic.setAttribute('transform', `translate(0,${mid.toFixed(1)})`);
    shimmer.setAttribute('opacity', (on * (0.5 + 0.5 * Math.sin(t * 9))).toFixed(3));
    const sq = on ? 1 - 0.18 * Math.max(0, Math.sin(t * 5)) : 1;
    fold.ic.setAttribute('transform', `translate(0,${(mid + (CY0 + 64) * (1 - sq)).toFixed(1)}) scale(1,${sq.toFixed(3)})`);
  });
  const c60 = S.text('one load every 60 min', { x: 960, y: 680, size: 34, weight: 700, anchor: 'middle', color: 'ink' }, laundry);
  const c40 = S.text('one load every 40 min', { x: 960, y: 680, size: 34, weight: 700, anchor: 'middle', color: 'helps' }, laundry);
  const cGlow = S.rect({ x: 760, y: 652, w: 400, h: 56, r: 14, fill: 'white', opacity: 0 }, laundry);
  cGlow.setAttribute('data-audit', 'ignore');
  hide([c60, c40]);
  texts.push(c60, c40);
  fade(c60, 0, 1, tLeave + 0.3, 0.4);

  // ================================================================ b2: only the bottleneck matters
  const tFw = T('b2~washing') - 0.1, tFf = T('b2~folding') - 0.1;
  fade(w30, 1, 0, tFw, 0.2); fade(w15, 0, 1, tFw + 0.1, 0.25); pulse(fW, tFw, 0.35, 0.5);
  fade(f10, 1, 0, tFf, 0.2); fade(f5, 0, 1, tFf + 0.1, 0.25); pulse(fF, tFf, 0.35, 0.5);
  pulse(cGlow, T('b2~nothing') - 0.1, 0.12, 0.7);
  const ring = S.rect({ x: 960 - CW / 2 - 10, y: CY0 - 10, w: CW + 20, h: CH + 20, r: 26, fill: 'none', stroke: 'white', sw: 4 }, laundry);
  const bTag = S.text('bottleneck', { x: 960, y: CY0 - 36, size: 28, weight: 750, anchor: 'middle', color: 'ink' }, laundry);
  hide([ring, bTag]);
  texts.push(bTag);
  fade([ring, bTag], 0, 1, T('b2~bottleneck') - 0.1, 0.4);
  fade(w15, 1, 0, tOnly, 0.2); fade(w30b, 0, 1, tOnly + 0.1, 0.25);
  fade(f5, 1, 0, tOnly, 0.2); fade(f10b, 0, 1, tOnly + 0.1, 0.25);
  const tHelp = T('b2~helps') - 0.2;
  fade(d60, 1, 0, tHelp, 0.2); fade(d40, 0, 1, tHelp + 0.1, 0.25);
  fD.setAttribute('fill', TEAL);
  pulse(fD, tHelp, 0.4, 0.6);
  fade(c60, 1, 0, tHelp + 0.3, 0.25);
  fade(c40, 0, 1, tHelp + 0.4, 0.3);

  // ================================================================ b3: a chip has two stations
  const tB3 = T('b3') - 0.1;
  // from b3 the laundry line is a small strip at the top and the chip's two stations sit under it (y 106-790):
  // the camera holds the whole 130 px lower, so it is centred
  S.add(S.fx.cam({ x: 960, y: 410, scale: 1, d: 0.8, ease: 'power2.inOut' }), tB3);
  whole(t => {
    const k = EIO(cl((t - tB3) / 1.2)), s = lerp(1, 0.45, k);
    laundry.setAttribute('transform', `translate(${(960 - 960 * s).toFixed(1)},${(lerp(300, 110, k) - 300 * s).toFixed(1)}) scale(${s.toFixed(4)})`);
  });
  K.ignore(laundry, tB3, S.duration - tB3);
  // the strip keeps its icons and the dryer's ring; every word in it fades
  fade([...cards.map(c => c.querySelector('text')), w30b, d40, f10b, c40, bTag], 1, 0, tB3, 0.5);
  const band = S.g();
  const card = (x, tone, icon, name) => {
    const g = S.g(null, band);
    S.rect({ x: x - 180, y: 410, w: 360, h: 220, r: 22, fill: `url(#card-${tone})`, stroke: tone, sw: 2.5 }, g);
    // the icon and its name, as one block, centred in the card (410-630)
    g.ic = S.icon(icon, { x, y: 474, size: 84, color: tone }, g);
    S.text(name, { x, y: 570, size: 34, weight: 750, anchor: 'middle', color: tone }, g);
    return g;
  };
  const mem = card(480, 'bytes', 'ph:memory-duotone', 'memory');
  const ari = card(1440, 'compute', 'ph:cpu-duotone', 'arithmetic');
  const tMem = T('b3~memory') - 0.1, tAri = T('b3~arithmetic') - 0.1;
  K.track(mem, [K.K(tMem, { y: 60, o: 0 }), K.K(tMem + 0.5, { y: 0, o: 1, e: 'power3.out' })]);
  K.track(ari, [K.K(tAri, { y: 60, o: 0 }), K.K(tAri + 0.5, { y: 0, o: 1, e: 'power3.out' })]);
  const pipe = S.g(null, band);
  const pipeR = S.rect({ x: 680, y: 500, w: 560, h: 40, r: 20, fill: '#140c14', stroke: 'bytes', strokeOpacity: 0.6, sw: 2 }, pipe);
  K.draw(pipeR, 1300, tAri + 0.2, 0.5);
  hide(pipeR);
  fade(pipeR, 0, 1, tAri + 0.2, 0.4);
  const spare = S.rect({ x: 684, y: 503, w: 552, h: 34, r: 17, fill: 'none', stroke: 'bytes', sw: 2, dash: '6 6' }, pipe);
  spare.setAttribute('data-audit', 'ignore');
  hide(spare);
  // particles: density and band width depend on the regime; sparks fire at the arithmetic card
  const tMB = T('b4~Memory') - 0.1, tCB = T('b4~Compute') - 0.1;
  const pr = S.rand(11), parts = Array.from({ length: 60 }, (_, i) => ({ ph: pr(), dy: pr() - 0.5, rank: i / 60, el: S.rect({ x: -4, y: -1.5, w: 8, h: 3, r: 1, fill: 'bytes', opacity: 0 }, pipe) }));
  parts.forEach(p => p.el.setAttribute('data-audit', 'ignore'));
  whole(t => {
    const on = cl((t - tAri - 0.6) / 0.4);
    const trickle = cl((t - tMB) / 0.4) * (1 - cl((t - tCB) / 0.4)), dense = cl((t - tCB) / 0.4);
    const density = lerp(lerp(0.5, 0.12, trickle), 1, dense), band = lerp(28, 12, dense);
    parts.forEach(p => {
      const u = (t * 0.55 + p.ph) % 1, vis = p.rank < density ? 1 : 0;
      p.el.setAttribute('transform', `translate(${lerp(690, 1230, u).toFixed(1)},${(520 + p.dy * band).toFixed(1)})`);
      p.el.setAttribute('opacity', (on * vis * 0.9 * Math.min(1, u * 8, (1 - u) * 8)).toFixed(3));
    });
  });
  const sparks = S.g(null, band);
  sparks.setAttribute('data-audit', 'ignore');
  const sp = Array.from({ length: 10 }, (_, i) => ({ a: i / 10 * Math.PI * 2, el: S.circle({ x: 0, y: 0, r: 3.5, fill: 'compute', opacity: 0 }, sparks) }));
  whole(t => {
    const on = cl((t - tAri - 0.6) / 0.4), idle = cl((t - tMB) / 0.4) * (1 - cl((t - tCB) / 0.4));
    sp.forEach((s, i) => {
      const u = (t * 1.6 + i / sp.length) % 1, r = 110 + 50 * u;
      s.el.setAttribute('cx', (1440 + r * Math.cos(s.a + t * 0.3)).toFixed(1));
      s.el.setAttribute('cy', (500 + r * 0.7 * Math.sin(s.a + t * 0.3)).toFixed(1));
      s.el.setAttribute('opacity', (on * (1 - idle * 0.85) * (1 - u)).toFixed(3));
    });
  });
  const two = S.text('two possible bottlenecks', { x: 960, y: 420, size: 30, weight: 700, anchor: 'middle', color: 'ink' });
  const which = S.text('bound by: whichever runs out first', { x: 960, y: 420, size: 30, weight: 700, anchor: 'middle', color: 'ink' });
  hide([two, which]);
  fade(two, 0, 1, tAri + 0.7, 0.4);
  const tWh = T('b3~whichever') - 0.1;
  fade(two, 1, 0, tWh, 0.3);
  fade(which, 0, 1, tWh + 0.25, 0.35);

  // ================================================================ b4: memory bound, compute bound
  fade(which, 1, 0, tMB - 0.1, 0.3);
  const grey = S.rect({ x: 1260, y: 410, w: 360, h: 220, r: 22, fill: '#0a0f1e', opacity: 0 }, band);
  grey.setAttribute('data-audit', 'ignore');
  whole(t => grey.setAttribute('opacity', (0.6 * cl((t - tMB) / 0.4) * (1 - cl((t - tCB) / 0.3))).toFixed(3)));
  const hg = S.icon('ph:hourglass-medium-duotone', { x: 1580, y: 440, size: 40, color: 'ink' }, band);
  const gauge = S.g(null, band);
  S.icon('ph:gauge-duotone', { x: 1514, y: 444, size: 40, color: 'compute' }, gauge);
  S.text('100%', { x: 1538, y: 444, size: 22, weight: 750, family: 'mono', color: 'compute' }, gauge);
  const aGlow = S.rect({ x: 1250, y: 400, w: 380, h: 240, r: 28, fill: 'url(#pglow-compute)', opacity: 0 }, band);
  aGlow.setAttribute('data-audit', 'ignore');
  band.insertBefore(aGlow, ari);
  hide([hg, gauge]);
  fade(hg, 0, 1, tMB + 0.2, 0.3);
  fade(hg, 1, 0, tCB, 0.3);
  fade(gauge, 0, 1, tCB + 0.3, 0.3);
  whole(t => aGlow.setAttribute('opacity', (0.8 * cl((t - tCB) / 0.5) * (1 - cl((t - T('b5') + 0.1) / 0.5))).toFixed(3)));
  fade(spare, 0, 1, tCB + 0.2, 0.4);
  // the tags sit clear of the cards' bottom edge (630): the decode pill reaches under the arithmetic card
  const TAGY = 680;
  const mbTag = S.pill('memory bound: arithmetic idle', { x: 960, y: TAGY, tone: 'bytes', size: 26, h: 48 });
  const decP = S.pill('decode', { x: 960 + mbTag.w / 2 + 16, y: TAGY, anchor: 'start', tone: 'struct', size: 24, h: 42, style: 'solid' });
  const cbTag = S.pill('compute bound: bandwidth spare', { x: 960, y: TAGY, tone: 'compute', size: 26, h: 48 });
  hide([mbTag, decP, cbTag]);
  fade(mbTag, 0, 1, tMB + 0.2, 0.35);
  S.add(K.drive(0.35, k => { setO(decP, k); decP.setAttribute('transform', `translate(${(40 * (1 - E('back.out(2)')(k))).toFixed(1)},0)`); }), T('b4~like') - 0.1);
  fade([mbTag, decP], 1, 0, tCB, 0.3);
  fade(cbTag, 0, 1, tCB + 0.2, 0.35);
  const tBoth = T('b4~Both') - 0.1;
  fade(cbTag, 1, 0, tBoth, 0.3);
  const w1 = S.text('memory bound wastes arithmetic', { x: 480, y: 760, size: 28, weight: 700, anchor: 'middle', color: 'bytes' });
  const w2 = S.text('compute bound wastes bandwidth', { x: 1440, y: 760, size: 28, weight: 700, anchor: 'middle', color: 'compute' });
  hide([w1, w2]);
  fade([w1, w2], 0, 1, tBoth + 0.2, 0.4, 0.15);

  // ================================================================ b5: two regions
  const tB5 = T('b5') - 0.1;
  fade([band, gauge, spare], 1, 0.15, tB5, 0.5);
  fade([w1, w2], 1, 0, tB5, 0.35);
  const washL = S.rect({ x: 300, y: 610, w: 660, h: 180, r: 16, fill: 'bytes', opacity: 0 });
  const washR = S.rect({ x: 960, y: 610, w: 660, h: 180, r: 16, fill: 'compute', opacity: 0 });
  [washL, washR].forEach(r => { r.setAttribute('data-audit', 'ignore'); S.add(gsap.fromTo(r, { attr: { opacity: 0 } }, { attr: { opacity: 0.1 }, duration: 0.6, immediateRender: false }), T('b5~two') - 0.1); });
  const div = S.path({ d: 'M960,620 V780', stroke: 'white', sw: 3 });
  const rl = S.text('memory bound', { x: 930, y: 700, size: 34, weight: 750, anchor: 'end', color: 'bytes' });
  const rr = S.text('compute bound', { x: 990, y: 700, size: 34, weight: 750, color: 'compute' });
  hide([div, rl, rr]);
  fade([rl, div, rr], 0, 1, tB5 + 0.3, 0.45);
  const dot = S.circle({ x: 960, y: 700, r: 9, fill: 'white', opacity: 0 });
  dot.setAttribute('data-audit', 'ignore');
  const tBal = T('b5~balance') - 0.1;
  S.add(gsap.fromTo(dot, { attr: { opacity: 0, r: 4 } }, { attr: { opacity: 1, r: 9 }, duration: 0.3, immediateRender: false }), tBal);
  const dotGlow = S.circle({ x: 960, y: 700, r: 22, fill: 'white', opacity: 0 });
  dotGlow.setAttribute('data-audit', 'ignore');
  pulse(dotGlow, tBal + 0.2, 0.35, 0.8);
  const one = S.text('one limit at a time', { x: 960, y: 590, size: 26, weight: 600, anchor: 'middle', color: 'muted' });
  hide(one);
  fade(one, 0, 1, T('b5~only') - 0.1, 0.35);
  void lerp;
});
