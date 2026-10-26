/* ch11_s02 · operations per byte (fig 120)
   b1  the formula card fades in; a chip icon with a white '?' (a number to come); a stopwatch crossed out
       (before you run anything); 'arithmetic intensity =' then amber 'operations performed' over coral 'bytes
       moved'.
   b2  two lanes, each a pipe from an HBM stack to a chip; a coral cube travels in; high intensity: the cube
       stays while sparks fire again and again (tally 1 … 8), 'high intensity: reuses each byte'; low intensity:
       cubes arrive one after another, one spark each, an hourglass between, 'low intensity: one use per byte'.
   b3  recalled, not rebuilt: 'decode · one token' and '1 op per byte'; '2 ops per weight ÷ 2 bytes per weight'
       brightens on 'from the shapes alone'; the card scales up 15 % and a white underline sweeps beneath it.
   Layout: card x 560-1360, y 150-330; lanes x 300-1500 at y 520 / 720; recall line y 600, tag y 680. */
V.scene('ch11_s02', S => {
  const K = ch11Kit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;

  // ================================================================ b1: the formula
  const card = S.g();
  // the fraction measured from its words: the bar spans the numerator, the card holds both with room
  const wAi = S.measure('arithmetic intensity =', { size: 36, weight: 750 }), wNum = S.measure('operations performed', { size: 30, weight: 750 });
  const FX = Math.round(574 + wAi + 30 + wNum / 2), CARD_W = Math.round(FX + wNum / 2 + 36 - 540);
  S.rect({ x: 540, y: 150, w: CARD_W, h: 180, r: 22, fill: '#0c1326', stroke: 'white', strokeOpacity: 0.25, sw: 2 }, card);
  const ai = S.text('arithmetic intensity =', { x: 574, y: 241, size: 36, weight: 750, color: 'ink' }, card);
  const num = S.text('operations performed', { x: FX, y: 202, size: 30, weight: 750, anchor: 'middle', color: 'compute' }, card);
  const bar = S.path({ d: `M${Math.round(FX - wNum / 2 - 8)},241 H${Math.round(FX + wNum / 2 + 8)}`, stroke: 'ink', sw: 3 }, card);
  const den = S.text('bytes moved', { x: FX, y: 282, size: 30, weight: 750, anchor: 'middle', color: 'bytes' }, card);
  hide([card, ai, num, den]);
  fade(card, 0, 1, T('b1~ratio') - 0.2, 0.5);
  // 'arithmetic intensity =' types in
  const aiText = 'arithmetic intensity =', tAi = T('b1~arithmetic') - 0.1;
  fade(ai, 0, 1, tAi, 0.05);
  whole(t => { const n = Math.round(aiText.length * cl((t - tAi) / 0.6)); ai.textContent = aiText.slice(0, Math.max(1, n)); });
  fade(num, 0, 1, T('b1~operations') - 0.1, 0.35);
  K.draw(bar, Math.round(wNum + 16), T('b1~bytes') - 0.15, 0.3);
  S.add(K.drive(0.4, k => { setO(den, k); den.setAttribute('transform', `translate(0,${(-24 * (1 - E('power2.out')(k))).toFixed(1)})`); }), T('b1~bytes') + 0.1);
  const chipQ = S.g();
  S.icon('ph:cpu-duotone', { x: 488, y: 240, size: 48, color: 'compute' }, chipQ);
  S.text('?', { x: 446, y: 240, size: 36, weight: 800, anchor: 'end', color: 'ink' }, chipQ);
  hide(chipQ);
  fade(chipQ, 0, 1, T('b1~number') - 0.1, 0.35);
  const watch = S.g();
  const WX = 540 + CARD_W + 54;
  S.icon('ph:timer-duotone', { x: WX, y: 240, size: 48, color: 'muted' }, watch);
  const cross = S.path({ d: `M${WX - 28},212 L${WX + 28},268`, stroke: 'muted', sw: 4 }, watch);
  cross.setAttribute('data-audit', 'ignore');
  hide(watch);
  const tBef = T('b1~before') - 0.1;
  fade(watch, 0, 1, tBef, 0.3);
  K.draw(cross, 80, tBef + 0.35, 0.3);

  // ================================================================ b2: high and low intensity
  const tB2 = T('b2') - 0.1;
  fade(chipQ, 1, 0, tB2, 0.3);
  const LY = [520, 720];
  const lanes = LY.map(y => {
    const g = S.g();
    S.icon('ph:memory-duotone', { x: 340, y, size: 52, color: 'bytes' }, g);
    S.rect({ x: 380, y: y - 14, w: 980, h: 28, r: 14, fill: '#140c14', stroke: 'bytes', strokeOpacity: 0.55, sw: 2 }, g);
    S.icon('ph:cpu-duotone', { x: 1410, y, size: 60, color: 'compute' }, g);
    return g;
  });
  const tDr = T('b2~dragged') - 0.1, tHi = T('b2~High') - 0.1, tLo = T('b2~Low') - 0.1, tB3 = T('b3') - 0.1;
  lanes.forEach((g, i) => whole(t => {
    const on = cl((t - tDr) / 0.4), mine = i === 0 ? cl((t - tHi) / 0.3) * (1 - cl((t - tLo) / 0.3) * 0.5) : cl((t - tLo) / 0.3);
    setO(g, on * (0.45 + 0.55 * mine) * (1 - cl((t - tB3) / 0.4)));
  }));
  const labHi = S.text('high intensity: reuses each byte', { x: 300, y: 462, size: 28, weight: 700, color: 'ink' });
  const labLo = S.text('low intensity: one use per byte', { x: 300, y: 662, size: 28, weight: 700, color: 'ink' });
  hide([labHi, labLo]);
  fade(labHi, 0, 1, tHi, 0.35);
  fade(labLo, 0, 1, tLo, 0.35);
  fade([labHi, labLo], 1, 0, tB3, 0.35);
  const fx = S.g();
  fx.setAttribute('data-audit', 'ignore');
  const cube = (y, t0, travel, stay, drop) => {
    const c = S.rect({ x: -12, y: -12, w: 24, h: 24, r: 4, fill: 'url(#solid-bytes)', stroke: 'white', strokeOpacity: 0.5, sw: 1 }, fx);
    whole(t => {
      const k = EIO(cl((t - t0) / travel)), dk = cl((t - t0 - travel - stay) / 0.35);
      const x = lerp(400, 1366, k);
      c.setAttribute('transform', `translate(${x.toFixed(1)},${(y + 40 * dk * dk).toFixed(1)})`);
      setO(c, t < t0 ? 0 : (1 - dk) * (1 - cl((t - tB3) / 0.3)));
    });
  };
  const spark = (y, at) => {
    const g = S.g(null, fx);
    for (let i = 0; i < 6; i++) S.path({ d: `M${1410 + 36 * Math.cos(i * Math.PI / 3)},${y + 36 * Math.sin(i * Math.PI / 3)} L${1410 + 54 * Math.cos(i * Math.PI / 3)},${y + 54 * Math.sin(i * Math.PI / 3)}`, stroke: 'compute', sw: 3 }, g);
    g.setAttribute('opacity', 0);
    pulse(g, at, 1, 0.3);
  };
  // the high lane: one cube, then eight sparks while it stays, then the next cube
  cube(LY[0], tDr + 0.1, 0.8, tHi + 2.9 - (tDr + 0.9), 0);
  const tally = S.text('0', { x: 1470, y: LY[0], size: 30, weight: 750, family: 'mono', color: 'compute' });
  hide(tally);
  fade(tally, 0, 1, tHi + 0.1, 0.25);
  const SPK = Array.from({ length: 8 }, (_, i) => tHi + 0.25 + 0.32 * i);
  SPK.forEach(a => spark(LY[0], a));
  whole(t => { tally.textContent = String(SPK.filter(a => t >= a).length); });
  cube(LY[0], tHi + 2.9, 0.7, 10, 0);
  fade(tally, 1, 0, tB3, 0.3);
  // the low lane: cubes one after another, one spark each, an hourglass between
  const LOW = Array.from({ length: 5 }, (_, i) => tLo + 0.1 + 0.75 * i);
  LOW.forEach(a => { cube(LY[1], a, 0.5, 0.15, 1); spark(LY[1], a + 0.5); });
  const hg = S.icon('ph:hourglass-medium-duotone', { x: 1480, y: LY[1], size: 36, color: 'muted' });
  hg.setAttribute('opacity', 0);
  LOW.forEach(a => pulse(hg, a + 0.65, 0.9, 0.5));

  // ================================================================ b3: decode is one
  const dec = S.pill('decode · one token', { x: 760, y: 600, tone: 'struct', size: 30, h: 58, style: 'solid' });
  const res = S.pill('1 op per byte', { x: 1150, y: 600, tone: 'neutral', size: 30, h: 58, color: 'ink' });
  const resBox = S.rect({ x: res.l - 3, y: res.t - 3, w: res.w + 6, h: res.h + 6, r: 31, fill: 'none', stroke: 'white', sw: 2.5 });
  const tag = S.text('2 ops per weight ÷ 2 bytes per weight', { x: 960, y: 680, size: 28, weight: 600, anchor: 'middle', color: 'muted' });
  const tagW = S.text('2 ops per weight ÷ 2 bytes per weight', { x: 960, y: 680, size: 28, weight: 600, anchor: 'middle', color: 'ink' });
  tagW.setAttribute('data-audit', 'ignore');
  hide([dec, res, resBox, tag, tagW]);
  S.add(K.drive(0.5, k => { setO(dec, k); dec.setAttribute('transform', `translate(${(-80 * (1 - E('power3.out')(k))).toFixed(1)},0)`); }), T('b3~as') - 0.1);
  fade([res, resBox], 0, 1, T('b3~is') - 0.1, 0.35);
  fade(tag, 0, 1, T('b3~two') - 0.1, 0.35);
  const tSh = T('b3~shapes') - 0.2;
  fade(tagW, 0, 1, tSh, 0.25);
  fade(tagW, 1, 0, tSh + 0.8, 0.5);
  const tUse = T('b3~single') - 0.1;
  fade(watch, 1, 0, tUse - 0.2, 0.3);
  K.track(card, [K.K(tUse, { s: 1 }), K.K(tUse + 0.6, { s: 1.15, e: 'back.out(1.4)' })], 960, 240);
  K.ignore(card, tUse, 0.7);
  const ul = S.path({ d: 'M500,366 H1420', stroke: 'white', sw: 3 });
  ul.setAttribute('data-audit', 'ignore');
  K.draw(ul, 920, tUse + 0.4, 0.6);
  void E;
});
