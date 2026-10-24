/* ch17_s05 · throughput against goodput (fig 146)
   Throughput is every token generated per second; goodput keeps only the tokens delivered inside the promised
   latency targets (illustrative: first token ≤ 1 s, next ≤ 50 ms), judged per request, because averages hide rare
   delays. Huge slow batches make the counter impressive while every user waits 40 s for a first token: goodput
   zero. Goodput = throughput × the share in time: 1,000 tokens/s × 70% = 700 tokens/s (illustrative).
   b1  the GPU's stream; the throughput bar and counter; the gate drops onto the pipe, the goodput outline fills
       teal from the passing tokens; the targets card; trains judged whole, a slow one dropped; 'average' struck.
   b2  the crowd; a torrent and a racing counter; blank screens and a stopwatch to 40 s; every token grey,
       'missed target'; goodput drains to 0.
   b3  a push in on the bin; 1,000 tokens/s × 70% in time = 700 tokens/s, the goodput bar at 70%, 300 grey
       tokens in the bin.
   b4  'Goodput' large in teal at the centre, 'Throughput' small and grey above it; a crowd and a test bench.
   Layout: GPU (200, 560); pipe y 560 from x 290; gate x 760 (stopwatch above, bin below at y 700); bars x 440-1180
   at y 200 (throughput) and 300 (goodput), counters at x 1200; targets card x 1480-1860, y 196; crowd y 930. */
V.scene('ch17_s05', S => {
  const K = libKit(S), { T, cl, E, EIO, whole, setO, hide, fade } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const hsh = i => { const v = Math.sin(i * 12.9898 + 0.3) * 43758.5453; return v - Math.floor(v); };
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const W = S.g();  // everything but the b4 words: pushed in on in b3

  // ---------------------------------------------------------------- times
  const tTh = T('b1~Throughput') - 0.1, tGood = T('b1~Goodput') - 0.1, tTarg = T('b1~promised') - 0.1;
  const tJudge = T('b1~judged') - 0.1, tAvg = T('b1~averages') - 0.1, tRare = T('b1~rare') - 0.1;
  const tPack = T('b2~Pack') - 0.1, tImp = T('b2~counter') - 0.1, tBlank = T('b2~blank') - 0.1, tMiss = T('b2~missed') - 0.1, tZero = T('b2~Goodput') - 0.1;
  const tNob = T('b3~nobody') - 0.1, tEq = T('b3~Goodput') - 0.1, tShare = T('b3~share') - 0.1, tArr = T('b3~arrived') - 0.1;
  const tLate1s = tBlank + 0.5;  // the stopwatch passes 1 s: from here every token reaching the gate is late

  // ================================================================ the machine, the pipe, the gate, the bin
  const gpu = ch17Gpu(S, { x: 200, y: 560 }, W);
  rise(gpu, 0.4, 0, 0.4);
  const pipe = S.g(null, W);
  S.rect({ x: 290, y: 545, w: 1420, h: 30, r: 15, fill: '#0c1326', stroke: 'struct', strokeOpacity: 0.4, sw: 2 }, pipe);
  rise(pipe, 0.5, 0, 0.4);
  const gate = S.g(null, W);
  S.rect({ x: 744, y: 500, w: 10, h: 110, r: 3, fill: '#c8d2ea' }, gate);
  S.rect({ x: 776, y: 500, w: 10, h: 110, r: 3, fill: '#c8d2ea' }, gate);
  S.rect({ x: 736, y: 492, w: 58, h: 10, r: 3, fill: '#c8d2ea' }, gate);
  S.icon('ph:timer-duotone', { x: 765, y: 452, size: 50, color: 'ink' }, gate);
  K.track(gate, [K.K(tGood, { y: -80, o: 0 }), K.K(tGood + 0.45, { y: 0, o: 1, e: 'bounce.out' })]);
  const gateMarks = S.text('≤ 1 s · ≤ 50 ms', { x: 800, y: 453, size: 22, weight: 700, color: 'muted' }, W);
  rise(gateMarks, tTarg + 0.4, 0);
  const bin = S.g(null, W);
  S.path({ d: 'M700,660 L720,740 H810 L830,660', stroke: '#8b95ad', sw: 3 }, bin);
  rise(bin, tGood + 0.3, 0, 0.4);
  const binL = S.text('missed target', { x: 765, y: 772, size: 24, weight: 700, anchor: 'middle', color: 'muted' }, W);
  rise(binL, tMiss, 6);
  // the 300 grey tokens of b3, stacked in the bin
  const pile = S.g(null, W);
  for (let i = 0; i < 300; i++) S.rect({ x: 724 + 4.2 * (i % 20), y: 734 - 4.2 * Math.floor(i / 20), w: 3, h: 3, fill: '#8b95ad' }, pile);
  pile.setAttribute('data-audit', 'ignore');
  hide(pile);
  fade(pile, 0, 1, tArr, 0.5);

  // ================================================================ the two bars, their counters, the targets card
  const BX = 440, BW = 740;
  const thL = S.text('Throughput · all tokens per second', { x: BX, y: 164, size: 26, weight: 750, color: 'struct' }, W);
  const thB = S.rect({ x: BX, y: 182, w: 0, h: 36, r: 8, fill: 'url(#card-struct)', stroke: 'struct', sw: 2.5 }, W);
  const thG = S.rect({ x: BX - 10, y: 172, w: BW + 20, h: 56, r: 16, fill: 'url(#pglow-struct)', opacity: 0 }, W);
  thG.setAttribute('data-audit', 'ignore');
  W.insertBefore(thG, thB);
  const thC = S.text('', { x: BX + BW + 20, y: 201, size: 30, weight: 800, family: 'mono', color: 'struct' }, W);
  rise(thL, tTh, 6);
  whole(t => {
    thB.setAttribute('width', Math.max(0.01, BW * EIO(cl((t - tTh) / 0.8))).toFixed(1));
    setO(thB, t > tTh ? 1 : 0);
    // the counter: about 1,000 a second; races during the huge batches; settles at 1,000 in b3
    let v = 1000 + 25 * Math.sin(t * 7);
    if (t > tImp) v += 21000 * E('power2.in')(cl((t - tImp) / 6)) * (1 - cl((t - tEq) / 0.6));
    if (t > tEq) v = 1000;
    thC.textContent = `${fmt(v)} tokens/s`;
    setO(thC, cl((t - tTh - 0.4) / 0.3));
    thG.setAttribute('opacity', (cl((t - tImp) / 0.4) * (1 - cl((t - tEq) / 0.5)) * (0.7 + 0.3 * Math.sin(t * 6))).toFixed(3));
  });
  const gdL = S.text('Goodput · only the ones in time', { x: BX, y: 264, size: 26, weight: 750, color: 'helps' }, W);
  const gdO = S.rect({ x: BX, y: 282, w: BW, h: 36, r: 8, stroke: '#8b95ad', sw: 2, dash: '8 6' }, W);
  const gdF = S.rect({ x: BX, y: 282, w: 0, h: 36, r: 8, fill: 'url(#card-helps)', stroke: 'helps', sw: 2.5 }, W);
  const gdC = S.text('', { x: BX + BW + 20, y: 301, size: 30, weight: 800, family: 'mono', color: 'helps' }, W);
  rise(gdL, tGood, 6);
  rise(gdO, tGood, 0, 0.4);
  const gFrac = t => {
    if (t < tB2) return 0.82 * cl((t - tGood - 1.2) / 6);
    if (t < tB3) return 0.82 * (1 - EIO(cl((t - tLate1s - 1.0) / (tZero + 0.6 - tLate1s - 1.0))));
    return 0.7 * EIO(cl((t - tArr) / 0.8));
  };
  whole(t => {
    const f = gFrac(t);
    gdF.setAttribute('width', Math.max(0.01, BW * f).toFixed(1));
    setO(gdF, f > 0.002 ? 1 : 0);
    gdC.textContent = t > tArr ? '700 tokens/s' : '0';
    setO(gdC, t > tZero ? 1 : 0);
  });
  const card = S.g(null, W);
  S.rect({ x: 1480, y: 170, w: 380, h: 52, r: 14, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.3, sw: 2 }, card);
  const cA = S.text('first token ≤ 1 s', { x: 1500, y: 197, size: 24, weight: 750, color: 'ink' }, card);
  const cAw = S.measure('first token ≤ 1 s', { size: 24, weight: 750 });
  S.text('·', { x: 1500 + cAw + 10, y: 197, size: 24, weight: 750, color: 'muted' }, card);
  S.text('next ≤ 50 ms', { x: 1500 + cAw + 28, y: 197, size: 24, weight: 750, color: 'ink' }, card);
  whole(t => cA.setAttribute('fill', S.tone(t > tLate1s ? 'muted' : 'ink')));
  K.track(card, [K.K(tTarg, { x: 120, o: 0 }), K.K(tTarg + 0.5, { x: 0, o: 1, e: 'power3.out' })]);
  const ill = ch17Tag(S, 'illustrative', { x: 1860, y: 252 }, W);
  fade(ill, 0, 1, tTarg + 0.4, 0.3);

  // ================================================================ the stream: per-request trains, judged at the gate
  const N = 90, P = 1.7;
  const lateAt = (id, t) => {
    const train = Math.floor(id / 6);
    if (t > tLate1s) return t < tEq + 0.3 || hsh(id + 3) < 0.3;      // b2 everything; from the equation, 30% (the share that missed)
    if (t > tJudge) return train % 9 === 4;                            // one slow request among quick ones
    return hsh(id) < 0.07;
  };
  const parts = [];
  for (let i = 0; i < N; i++) {
    const c = S.rect({ x: -6, y: -6, w: 12, h: 12, r: 3, fill: 'struct' }, W);
    c.setAttribute('data-audit', 'ignore');
    parts.push(c);
  }
  whole(t => {
    const torrent = cl((t - tImp) / 0.6) * (1 - cl((t - tEq) / 0.5));
    const on = t > 0.9 && t < tB4 + 0.2;
    parts.forEach((c, i) => {
      if (!on || (i >= 40 && torrent < 0.5)) { setO(c, 0); return; }
      const nVis = torrent > 0.5 ? N : 40;
      const rate = 1 + 0.8 * torrent;
      const ph = (t - 0.9) * rate / P + i / nVis, cyc = Math.floor(ph), u = ph - cyc, id = cyc * nVis + i;
      // trains: after 'judged per request', two of every eight slots are empty, leaving gaps between requests
      const gap = t > tJudge && t < tB2 && (i % 8) >= 6;
      const late = lateAt(id, t - P * u / rate * 0.45);
      let x, y, op = 1, col = 'struct', s = 1 + 0.4 * torrent;
      if (u < 0.45) { x = 300 + (765 - 300) * (u / 0.45); y = 560; }
      else if (t < tGood) { x = 765 + (1700 - 765) * ((u - 0.45) / 0.55); y = 560; op = 1 - cl((u - 0.9) / 0.1); }
      else if (late) { const k = (u - 0.45) / 0.55; x = 765 + 8 * Math.sin(i); y = 575 + 150 * E('power2.in')(k); col = '#8b95ad'; op = 1 - cl((k - 0.8) / 0.2); }
      else { const k = (u - 0.45) / 0.55, gx = BX + BW * (0.05 + 0.9 * hsh(id + 11)); x = 790 + (gx - 790) * E('power2.inOut')(k); y = 560 - (560 - 300) * E('power2.out')(k); col = 'helps'; op = 1 - cl((k - 0.75) / 0.25); }
      c.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s.toFixed(2)})`);
      c.setAttribute('fill', col.startsWith('#') ? col : S.tone(col));
      setO(c, gap ? 0 : op * (t > tB3 && t < tEq + 0.4 ? 0.4 : 1));
    });
  });
  // averages hide rare delays: a smooth bracket over all the trains, struck through
  const avg = S.g(null, W);
  const ap = S.path({ d: 'M310,512 v-10 H740 v10', stroke: '#8b95ad', sw: 2.5 }, avg);
  ap.setAttribute('data-audit', 'ignore');
  S.text('average', { x: 525, y: 482, size: 26, weight: 700, anchor: 'middle', color: 'muted' }, avg);
  rise(avg, tAvg, 6);
  const aw = S.measure('average', { size: 26, weight: 700 });
  const ax = S.path({ d: `M${525 - aw / 2 - 6},483 H${525 + aw / 2 + 6}`, stroke: '#8b95ad', sw: 3 }, W);
  ax.setAttribute('data-audit', 'ignore');
  K.draw(ax, aw + 12, tRare + 0.3, 0.3);
  fade([avg, ax], 1, 0, tRare + 0.9, 0.35);
  const binG = S.rect({ x: 690, y: 640, w: 150, h: 110, r: 20, fill: 'url(#pglow-struct)', opacity: 0 }, W);
  binG.setAttribute('data-audit', 'ignore');
  K.pulse(binG, tRare, 1, 0.7);

  // ================================================================ b2: huge slow batches
  const crowd = ch17Users(S, { x: 1140, y: 930, n: 24, cols: 12, gapX: 92, gapY: 64, size: 40, screen: true }, W);
  crowd.list.forEach((u, i) => { u.style.opacity = ''; u.style.visibility = ''; rise(u, tPack + 0.03 * i, 8, 0.3); });
  crowd.list.forEach(u => whole(t => u.caret.setAttribute('opacity', Math.floor(t * 2.2) % 2 ? '0.15' : '1')));
  const tray = S.g(null, W);
  S.rect({ x: 120, y: 640, w: 180, h: 70, r: 10, fill: '#0c1326', stroke: 'struct', sw: 2 }, tray);
  for (let i = 0; i < 24; i++) S.rect({ x: 130 + 20 * (i % 8), y: 650 + 18 * Math.floor(i / 8), w: 16, h: 12, r: 3, fill: 'url(#card-struct)', stroke: 'struct', sw: 1 }, tray);
  tray.setAttribute('data-audit', 'ignore');
  rise(tray, tPack + 0.5, 10);
  const sw = S.g(null, W);
  S.icon('ph:timer-duotone', { x: 340, y: 860, size: 80, color: 'ink' }, sw);
  const swT = S.text('', { x: 340, y: 940, size: 34, weight: 800, family: 'mono', anchor: 'middle', color: 'ink' }, sw);
  whole(t => { swT.textContent = `${Math.round(40 * E('power1.in')(cl((t - tBlank) / 3.2)))} s`; });
  rise(sw, tBlank - 0.2, 8);
  fade([crowd.g, tray, sw, card, ill, gateMarks], 1, 0, tEq - 0.2, 0.4);

  // ================================================================ b3: goodput is throughput times the share in time
  K.track(W, [K.K(tNob, { s: 1 }), K.K(tNob + 1.2, { s: 1.18, e: 'power2.inOut' }), K.K(tEq - 0.3, {}), K.K(tEq + 0.6, { s: 1, e: 'power2.inOut' })], 765, 520);
  K.ignore(W, tNob, tEq + 0.7 - tNob);
  const eq = S.g();
  const e1 = S.text('1,000 tokens/s', { x: BX, y: 860, size: 34, weight: 800, color: 'struct' }, eq);
  const w1 = S.measure('1,000 tokens/s', { size: 34, weight: 800 });
  const e2 = S.text('× 70% in time', { x: BX + w1 + 18, y: 860, size: 34, weight: 800, color: 'ink' }, eq);
  const w2 = S.measure('× 70% in time', { size: 34, weight: 800 });
  const e3 = S.text('= 700 tokens/s', { x: BX + w1 + w2 + 36, y: 860, size: 34, weight: 800, color: 'helps' }, eq);
  rise(e1, tEq + 0.3, 6);
  rise(e2, tShare, 6);
  rise(e3, tArr, 6);
  const ill2 = ch17Tag(S, 'illustrative', { x: BX + w1 + w2 + 36 + S.measure('= 700 tokens/s', { size: 34, weight: 800 }) + 24, y: 860, anchor: 'start' });
  fade(ill2, 0, 1, tArr + 0.3, 0.3);
  fade([eq, ill2], 1, 0, tB4, 0.35);

  // ================================================================ b4: goodput is what production optimises
  fade(W, 1, 0, tB4 + 0.2, 0.5);
  const thBig = S.text('Throughput', { x: 960, y: 380, size: 44, weight: 750, anchor: 'middle', color: 'muted' });
  K.track(thBig, [K.K(tB4 + 0.2, { x: BX + 85 - 960, y: 164 - 380, s: 0.6, o: 0 }), K.K(tB4 + 1.1, { x: 0, y: 0, s: 1, o: 1, e: 'power3.inOut' })], 960, 380);
  const gdBig = S.text('Goodput', { x: 960, y: 540, size: 110, weight: 850, anchor: 'middle', color: 'helps' });
  K.track(gdBig, [K.K(tB4 + 0.2, { x: BX + 50 - 960, y: 264 - 540, s: 0.24, o: 0 }), K.K(tB4 + 1.2, { x: 0, y: 0, s: 1, o: 1, e: 'power3.inOut' })], 960, 540);
  K.ignore([thBig, gdBig], tB4 + 0.2, 1.1);
  const gw = S.measure('Goodput', { size: 110, weight: 850 }), tw = S.measure('Throughput', { size: 44, weight: 750 });
  const crowdI = S.icon('ph:users-three-duotone', { x: 960 + gw / 2 + 70, y: 530, size: 84, color: 'helps' });
  rise(crowdI, T('b4~operates') - 0.1, 8);
  const bench = S.g();
  S.icon('ph:timer-duotone', { x: 960 + tw / 2 + 52, y: 372, size: 46, color: 'muted' }, bench);
  S.path({ d: `M${960 + tw / 2 + 24},400 h56 M${960 + tw / 2 + 30},400 v14 M${960 + tw / 2 + 74},400 v14`, stroke: '#8b95ad', sw: 3 }, bench);
  rise(bench, T('b4~benchmarks') - 0.1, 8);
  void gpu;
});
