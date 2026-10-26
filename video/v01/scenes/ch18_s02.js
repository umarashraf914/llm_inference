/* ch18_s02 · the chain, in five links (fig 147)
   Five statements, each carrying one piece of arithmetic (checked): compute grew 80× against bandwidth's 17× in a
   decade, 80 ÷ 17 ≈ 4.7; a forward pass streams every weight, 70 bn × 2 bytes = 140 GB; prefill amortises that
   read and decode does not, 140 GB ÷ 4.8 TB/s = 29.2 ms; the KV cache adds 2 × 80 × 8 × 128 × 2 B = 327,680 B
   ≈ 320 KB per token held; goodput is what is sold, throughput × share on time.
   b1  the heading and five empty cards linked top to bottom; the 30 ms stopwatch and its bracket; card 1 (two
       arrows to scale, 120 : 26 px for 80 : 17) and card 2 (a coral stream on a GPU's bus).
   b2  card 3 (one read fanning to many pills, the same read for one pill); card 4 (KV slabs, the chip built term
       by term).
   b3  card 5 (the goodput gate in miniature); all cards bright, the view eases back 5%, every chip's ÷ and ×
       light amber top to bottom; the bracket glows.
   Layout: cards x 120-1500, 128 px tall with 40 px gaps (y 160-960); numbered circles x 172; icons x 220-330;
   titles x 360 (30 px); chips from x 950; stopwatch (1680, 500); bracket x 1525. */
V.scene('ch18_s02', S => {
  const K = libKit(S), { T, cl, E, EIO, whole, setO, hide, fade } = K;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const CY = i => 224 + 168 * i;
  const W = S.g();
  const TITLES = ['compute outgrows bandwidth', 'a forward pass streams every weight', 'prefill amortises, decode does not', 'the KV cache adds to the bill', 'goodput is what is actually sold'];
  const tTitle = ['b1~Compute', 'b1~forward', 'b2~Prefill', 'b2~K', 'b3~goodput'].map(c => T(c) - 0.1);
  const tDiv = T('b3~division') - 0.1, tNothing = T('b3~nothing') - 0.1;

  // ================================================================ b1: five links, one stopwatch
  const head = S.text('The chain, in five links', { x: 120, y: 128, size: 28, weight: 700, color: 'muted' }, W);
  rise(head, 0.6, 6);
  fade(head, 1, 0, tTitle[1], 0.3);
  const cards = TITLES.map((title, i) => {
    const h = S.g(null, W), g = S.g(null, h), y = CY(i);  // h takes the entrance, g the dimming (both style opacity)
    S.rect({ x: 120, y: y - 64, w: 1380, h: 128, r: 18, fill: '#0c1326', fillOpacity: 0.8, stroke: 'struct', strokeOpacity: 0.7, sw: 2 }, g);
    S.circle({ x: 172, y, r: 24, fill: '#1d3566', stroke: 'struct', sw: 2 }, g);
    S.text(String(i + 1), { x: 172, y: y + 1, size: 26, weight: 800, anchor: 'middle', color: 'ink' }, g);
    const tt = S.text('', { x: 360, y: y + 1, size: 28, weight: 750, color: 'ink' }, g);   // 28: the longest title clears its chip
    whole(t => { tt.textContent = title.slice(0, Math.round(title.length * cl((t - tTitle[i]) / 0.7))); });
    rise(h, 0.8 + 0.18 * i, 10, 0.4);
    // the card being spoken about is bright; finished cards dim to 60%; all return for the closing beat
    const done = i < 4 ? tTitle[i + 1] : 1e9;
    whole(t => setO(g, t > done && t < tDiv ? 0.6 : 1));
    g.icon = S.g(null, g);
    return g;
  });
  for (let i = 0; i < 4; i++) {
    const l = S.icon('ph:link-duotone', { x: 172, y: CY(i) + 84, size: 34, color: 'struct' }, W);
    l.setAttribute('transform', `rotate(90,172,${CY(i) + 84})`);
    const h = S.g(null, W);
    h.appendChild(l);
    rise(h, 1.0 + 0.18 * i, 0, 0.3);
  }
  const tWatch = T('b1~thirty') - 0.1;
  const watch = ch18Watch(S, { x: 1680, y: 480, size: 200, readout: 'below', readoutSize: 40, decimals: 0, value: 30, max: 30 }, W);
  rise(watch, tWatch, 10, 0.45);
  const br = S.path({ d: 'M1505,160 Q1525,160 1525,180 V530 Q1525,560 1545,560 Q1525,560 1525,590 V940 Q1525,960 1505,960', stroke: '#c8d2ea', sw: 3 }, W);
  br.setAttribute('data-audit', 'ignore');
  K.draw(br, 900, tWatch + 0.3, 0.8);
  whole(t => { const g = cl((t - tNothing) / 0.5); br.setAttribute('stroke', g > 0 ? '#ffffff' : '#c8d2ea'); br.setAttribute('stroke-width', (3 + 2 * g).toFixed(2)); });
  const brG = br.cloneNode();
  brG.setAttribute('stroke-width', '12'); brG.setAttribute('stroke-opacity', '0.25'); brG.setAttribute('stroke', '#ffffff');
  brG.removeAttribute('stroke-dasharray'); brG.removeAttribute('stroke-dashoffset');
  W.insertBefore(brG, br);
  hide(brG);
  fade(brG, 0, 1, tNothing, 0.6);
  // card 1: two arrows to scale, amber 120 px (80×) and coral 26 px (17×)
  const ar = (x, h, tone, at) => {
    const p = S.path({ d: '', stroke: tone, sw: 6 }, cards[0].icon);
    p.setAttribute('data-audit', 'ignore');
    whole(t => { const k = E('power3.out')(cl((t - at) / 0.6)), y0 = CY(0) + 60, y1 = y0 - h * k; p.setAttribute('d', k > 0 ? `M${x},${y0} V${y1.toFixed(1)} M${x - 10},${(y1 + 12).toFixed(1)} L${x},${y1.toFixed(1)} L${x + 10},${(y1 + 12).toFixed(1)}` : ''); });
  };
  ar(250, 120, 'compute', T('b1~eighty') - 0.1);
  ar(300, 26, 'bytes', T('b1~seventeen') - 0.1);
  const chip = (i, o, at) => { const c = ch18Chip(S, { x: 966, y: CY(i), anchor: 'start', ...o }, cards[i]); S.set(c, { autoAlpha: 0 }, 0); S.add(c.write(), at); return c; };
  const c1 = chip(0, { parts: ['80', '÷', '17', '≈', '4.7'] }, T('b1~ridge') - 0.1);
  // card 2: a GPU with a coral stream on its bus
  ch18Gpu(S, { x: 262, y: CY(1), size: 34 }, cards[1].icon);
  const strm = S.path({ d: `M222,${CY(1) + 34} H330`, stroke: 'bytes', sw: 4, dash: '8 8' }, cards[1].icon);
  strm.setAttribute('data-audit', 'ignore');
  const tEvery = T('b1~every') - 0.1;
  whole(t => { strm.setAttribute('stroke-dashoffset', (-60 * Math.max(0, t - tEvery)).toFixed(1)); setO(strm, cl((t - tEvery) / 0.3)); });
  const c2 = chip(1, { parts: ['70 bn', '×', '2 bytes', '=', '140 GB'], tone: 'bytes' }, T('b1~hundred') - 0.1);

  // ================================================================ b2: amortised or not; the KV cache
  const ic3 = cards[2].icon, y3 = CY(2);
  const tFan = T('b2~amortises') - 0.1, tLone = T('b2~decode') - 0.1;
  const s1 = S.path({ d: `M222,${y3 - 28} H262 M262,${y3 - 28} L290,${y3 - 44} M262,${y3 - 28} L290,${y3 - 28} M262,${y3 - 28} L290,${y3 - 12}`, stroke: 'bytes', sw: 4 }, ic3);
  const s2 = S.path({ d: `M222,${y3 + 30} H290`, stroke: 'bytes', sw: 4 }, ic3);
  [s1, s2].forEach(p => p.setAttribute('data-audit', 'ignore'));
  K.draw(s1, 160, tFan + 0.2, 0.4);
  K.draw(s2, 80, tLone, 0.4);
  const pills = S.g(null, ic3);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) S.rect({ x: 296 + 18 * c, y: y3 - 52 + 14 * r, w: 14, h: 10, r: 3, fill: 'url(#card-struct)', stroke: 'struct', sw: 1.2 }, pills);
  pills.setAttribute('data-audit', 'ignore');
  rise(pills, tFan + 0.5, 0, 0.25);
  const lone = S.rect({ x: 296, y: y3 + 25, w: 14, h: 10, r: 3, fill: 'url(#card-struct)', stroke: 'struct', sw: 1.2 }, ic3);
  lone.setAttribute('data-audit', 'ignore');
  rise(lone, tLone + 0.4, 0, 0.25);
  const c3 = chip(2, { parts: ['140 GB', '÷', '4.8 TB/s', '=', '29.2 ms'], tone: 'bytes' }, T('b2~pays') - 0.1);
  S.add(watch.flash ? watch.flash() : gsap.timeline(), T('b2~full') - 0.1);
  // card 4: KV slabs, K over V, the stack growing by one
  const ic4 = cards[3].icon, y4 = CY(3);
  const tKV = T('b2~K') - 0.1;
  for (let k = 0; k < 4; k++) {
    const g = S.g(null, ic4), y = y4 + 40 - 24 * k;
    S.rect({ x: 236, y: y - 9, w: 40, h: 18, r: 3, fill: '#ff7a85' }, g);
    S.rect({ x: 278, y: y - 9, w: 40, h: 18, r: 3, fill: '#9b3a44' }, g);
    g.setAttribute('data-audit', 'ignore');
    if (k === 3) rise(g, tKV + 0.4, -10, 0.35);
  }
  // built term by term on 'three hundred and twenty', then the result under it on 'kilobytes'
  const c4 = ch18Chip(S, { x: 950, y: CY(3), anchor: 'start', parts: ['2', '×', '80', '×', '8', '×', '128', '×', '2 B'], tone: 'bytes', line2: { t: '≈ 320 KB', tone: 'ink', size: 26 } }, cards[3]);
  S.set(c4, { autoAlpha: 0 }, 0);
  S.add(c4.write({ line2: false, stagger: 0.16 }), T('b2~three') - 0.1);
  S.add(S.fx.in(c4.line2El, { from: 'up', d: 0.35 }), T('b2~kilobytes') - 0.1);

  // ================================================================ b3: goodput; every link is arithmetic
  const ic5 = cards[4].icon, y5 = CY(4);
  S.rect({ x: 222, y: y5 + 2, w: 108, h: 14, r: 7, fill: '#0c1326', stroke: 'struct', strokeOpacity: 0.5, sw: 1.5 }, ic5);
  S.rect({ x: 268, y: y5 - 16, w: 5, h: 44, fill: '#c8d2ea' }, ic5);
  S.rect({ x: 283, y: y5 - 16, w: 5, h: 44, fill: '#c8d2ea' }, ic5);
  S.icon('ph:timer-duotone', { x: 278, y: y5 - 36, size: 26, color: 'ink' }, ic5);
  S.path({ d: `M262,${y5 + 38} L267,${y5 + 58} H289 L294,${y5 + 38}`, stroke: '#8b95ad', sw: 2 }, ic5);
  ic5.setAttribute('data-audit', 'ignore');
  const tGood = tTitle[4];
  for (let i = 0; i < 8; i++) {
    const p = S.rect({ x: -4, y: -4, w: 8, h: 8, r: 2, fill: 'struct' }, ic5);
    const late = i % 4 === 2;
    whole(t => {
      const u = ((t - tGood) * 0.7 + i / 8) % 1;
      let x, y, col = S.tone('struct');
      if (u < 0.5) { x = 226 + (278 - 226) * (u / 0.5); y = y5 + 9; }
      else if (late) { x = 278; y = y5 + 9 + 40 * ((u - 0.5) / 0.5); col = '#8b95ad'; }
      else { x = 278 + (326 - 278) * ((u - 0.5) / 0.5); y = y5 + 9; col = S.tone('helps'); }
      p.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      p.setAttribute('fill', col);
      setO(p, t > tGood + 0.3 ? 1 : 0);
    });
  }
  // the icons of cards 2, 4 and 5 arrive with their titles (1 and 3 draw themselves)
  [1, 3, 4].forEach(i => { hide(cards[i].icon); fade(cards[i].icon, 0, 1, tTitle[i] + 0.1, 0.35); });
  const c5 = chip(4, { parts: ['throughput', '×', 'share on time'], tone: 'helps' }, T('b3~actually') - 0.1);
  // all bright; the view eases back; the signs light amber top to bottom
  K.track(W, [K.K(tDiv, { s: 1 }), K.K(tDiv + 1.0, { s: 0.95, e: 'power2.inOut' })], 960, 560);
  K.ignore(W, tDiv, 1.1);
  [c1, c2, c3, c4, c5].forEach((c, i) => S.add(c.lightOps({ stagger: 0.12 }), tDiv + 0.5 + 0.55 * i));
});
