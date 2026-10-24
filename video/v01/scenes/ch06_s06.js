/* ch06_s06 · latency is not bandwidth (fig 76)
   b1  top lane: an amber chip sends a blue 'ask'; a dashed wait stretches right under a running stopwatch;
       'arrive' lands. Bottom lane: six coral tracks of packets moving at the same pace, an arrivals counter
       +6 per column; on 'at once' the tracks double to twelve (+12 per column), the top wait unchanged.
   b2  the lanes sink and dim. A container ship ('latency: weeks', 'bandwidth: huge'), a second ship
       (→ '×2', the weeks pulse but stay), a motorbike courier ('minutes', 'tiny'). Caption.
   b3  the lanes return; 'fixed by distance'. One request at a time: a blue dot makes the trip on top and one
       packet below, so the tracks run dry; then back-to-back launches fill every track (teal, the fix).
   b4  only two words stay, 'latency' and 'bandwidth', and the gap between them widens.
   Pace: b1 trip 3.6 s over 1,120 px (311 px/s); b3 trips 1.9 s (589 px/s). Tracks x 350-1470, y 600-860. */
V.scene('ch06_s06', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = n => gsap.parseEase(n);
  const eIO2 = E('power2.inOut');
  const ignoreIn = (els, a, b) => ch06Clock(S, a, b, t => els.forEach(e => (t > a && t < b ? e.setAttribute('data-audit', 'ignore') : e.removeAttribute('data-audit'))));
  const X0 = 350, X1 = 1470, LEN = X1 - X0;

  // ================================================================ the lanes (they sink in b2, return in b3)
  const lanes = S.g();
  const top = S.g(null, lanes), bot = S.g(null, lanes);
  // ---------------------------------------------------------------- top lane: latency
  const LY = 300;
  const headT = S.text([{ t: 'Latency: ', c: 'ink', w: 700 }, { t: 'how long one request takes', c: 'muted' }], { x: 150, y: 168, size: 40, weight: 600, family: 'display' }, top);
  const chip = S.g(null, top);
  S.rect({ x: 163, y: LY - 27, w: 54, h: 54, r: 8, fill: '#1a1408', stroke: 'compute', sw: 3 }, chip);
  let cf = '';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cf += `M${172 + c * 13},${LY - 18 + r * 13}h9v9h-9z`;
  S.path({ d: cf, fill: 'compute', fillOpacity: 0.7 }, chip);
  const ask = S.pill('ask', { x: 285, y: LY, tone: 'struct', size: 26, h: 46 }, top);
  const wait = S.line({ x1: X0 - 20, y1: LY, x2: X0 - 20, y2: LY, stroke: 'muted', sw: 3, dash: '12 10', cap: 'butt' }, top);
  wait.setAttribute('data-audit', 'ignore');
  const waitLbl = S.text('wait', { x: (X0 + X1) / 2, y: LY + 36, size: 26, weight: 550, anchor: 'middle', color: 'muted' }, top);
  const arrive = S.pill('arrive', { x: X1 + 85, y: LY, tone: 'struct', size: 26, h: 46 }, top);
  const sw = libStopwatch(S, { x: (X0 + X1) / 2, y: LY - 86, size: 92, readout: 'none', span: 4000, buttons: true }, top);
  const fixedTag = S.text('fixed by distance', { x: (X0 + X1) / 2, y: LY + 36, size: 26, weight: 600, anchor: 'middle', color: 'muted' }, top);
  const dot = S.circle({ x: X0, y: LY, r: 10, fill: 'struct', opacity: 0 }, top);
  [headT, chip, ask, waitLbl, arrive, fixedTag].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  S.add(fx.in(chip, { from: 'fade', d: 0.4 }), 'b1~chip-0.2');
  S.add(fx.in(ask, { from: 'left', d: 0.4, dist: 20 }), 'b1~sends-0.05');
  const tW0 = T('b1~sends') + 0.15, tW1 = T('b1~arrive') - 0.05;
  ch06Clock(S, tW0, tW1, t => wait.setAttribute('x2', lerp(X0 - 20, X1 + 20, eIO2(cl((t - tW0) / (tW1 - tW0)))).toFixed(1)));
  S.add(sw.in({ d: 0.4 }), tW0 - 0.1);
  S.add(sw.run(0, 3600, { d: tW1 - tW0 }), tW0);
  S.add(fx.in(waitLbl, { from: 'fade', d: 0.4 }), tW0 + 1.2);
  S.add(fx.in(arrive, { from: 'left', d: 0.45, dist: 20 }), tW1);
  S.add(fx.in(headT, { from: 'up', d: 0.5, dist: 14 }), 'b1~is-0.1');

  // ---------------------------------------------------------------- bottom lane: bandwidth
  const TY0 = 600, TH = 260;
  const headB = S.text([{ t: 'Bandwidth: ', c: 'bytes', w: 700 }, { t: 'how much travels at once', c: 'muted' }], { x: 150, y: 538, size: 40, weight: 600, family: 'display' }, bot);
  const trackLines = [...Array(12)].map(() => S.line({ x1: X0, y1: 0, x2: X1, y2: 0, stroke: 'bytes', strokeOpacity: 0.28, sw: 2, cap: 'butt' }, bot));
  const pk = S.path({ d: '', fill: 'bytes' }, bot);
  [pk, ...trackLines].forEach(e => e.setAttribute('data-audit', 'ignore'));
  const endCap = S.line({ x1: X1 + 4, y1: TY0 - 6, x2: X1 + 4, y2: TY0 + TH + 6, stroke: 'ink', strokeOpacity: 0.35, sw: 2 }, bot);
  const startCap = S.line({ x1: X0 - 4, y1: TY0 - 6, x2: X0 - 4, y2: TY0 + TH + 6, stroke: 'ink', strokeOpacity: 0.35, sw: 2 }, bot);
  const arrG = S.g(null, bot);
  S.text('arrivals', { x: 1530, y: 690, size: 26, weight: 550, color: 'muted' }, arrG);
  const arrN = S.text('0', { x: 1530, y: 742, size: 52, weight: 700, family: 'mono', color: 'bytes' }, arrG);
  const dryTag = S.text('one at a time: runs dry', { x: X0, y: TY0 + TH + 40, size: 28, weight: 600, color: 'muted' }, bot);
  const fullTag = S.text('many in flight: stays full', { x: X1, y: TY0 + TH + 40, size: 28, weight: 650, anchor: 'end', color: 'helps' }, bot);
  [headB, arrG, dryTag, fullTag].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  S.set([bot], { autoAlpha: 0 }, 0);
  const tBot = T('b1~Bandwidth') - 0.15;
  S.add(gsap.fromTo(bot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, immediateRender: false }), tBot);
  S.add(fx.in(headB, { from: 'up', d: 0.5, dist: 14 }), tBot);
  S.add(fx.in(arrG, { from: 'fade', d: 0.4 }), tBot + 0.3);

  // the stream: b1 columns every DT on all active tracks (prefilled, already flowing); b3 one at a time,
  // then back to back on every track
  const V1 = LEN / 3.6, DT = 0.55, PL = 30;
  const tS0 = tBot + 0.1, tStop = T('b2') + 0.2, tDbl = T('b1~at') - 0.1;
  const V3 = LEN / 1.9, TRIP3 = 1.9, GAP3 = 5;
  const tBack = T('b3') + 0.15, tD0 = tBack + 1.0, tF0 = T('b3~in') - 0.05;
  const dblU = t => eIO2(cl((t - tDbl) / 0.5));
  const trackY = (j, u) => j < 6 ? lerp(TY0 + (j + 0.5) * TH / 6, TY0 + (2 * j + 0.5) * TH / 12, u) : TY0 + (2 * (j - 6) + 1.5) * TH / 12;
  const rectAt = (front, y, h) => {
    const a = Math.max(X0, front - PL), b = Math.min(X1, front);
    return b > a ? `M${a.toFixed(1)},${(y - h / 2).toFixed(1)}h${(b - a).toFixed(1)}v${h.toFixed(1)}h${(a - b).toFixed(1)}z` : '';
  };
  const paintBot = t => {
    const u = dblU(t), h = lerp(14, 9, u);
    trackLines.forEach((ln, j) => {
      const y = trackY(j, u).toFixed(1);
      ln.setAttribute('y1', y); ln.setAttribute('y2', y);
      ln.setAttribute('opacity', j < 6 ? 1 : u.toFixed(3));
    });
    let d = '', arrivals = 0;
    // b1: columns launched every DT since well before tS0, last launch at tStop
    for (let tl = tS0 - 3.6 - DT * 2; tl <= Math.min(t, tStop); tl += DT) {
      const front = X0 + V1 * (t - tl);
      const n = t >= tDbl ? 12 : 6;
      if (front > X0 && front - PL < X1) for (let j = 0; j < n; j++) d += rectAt(front, trackY(j, u), h);
      const ta = tl + LEN / V1;                                   // this column's arrival
      if (ta > tS0 && ta <= t) arrivals += ta >= tDbl ? 12 : 6;
    }
    // b3: one request at a time (each waits for the last), then back to back on all twelve
    for (let k = 0, tl = tD0; tl <= Math.min(t, tF0); k++, tl += TRIP3) {
      const front = X0 + V3 * (t - tl);
      if (front > X0 && front - PL < X1) d += rectAt(front, trackY((k * 5 + 3) % 12, 1), 9);
    }
    for (let tl = tF0; tl <= t; tl += (PL + GAP3) / V3) {
      const front = X0 + V3 * (t - tl);
      if (front > X0 && front - PL < X1) for (let j = 0; j < 12; j++) d += rectAt(front, trackY(j, 1), 9);
    }
    pk.setAttribute('d', d);
    arrN.textContent = arrivals.toLocaleString('en-US');
    // the top lane's request in b3: a blue dot makes every trip at the same pace
    let dx = -1;
    for (let tl = tD0; tl <= t; tl += TRIP3) { const x = X0 + V3 * (t - tl); if (x <= X1) dx = x; }
    dot.setAttribute('opacity', dx >= 0 ? 1 : 0);
    if (dx >= 0) dot.setAttribute('cx', dx.toFixed(1));
  };
  paintBot(0);
  ch06Clock(S, 0, S.duration, paintBot);

  // ================================================================ b2: ships and a courier
  const tSink = T('b2') + 0.05;
  S.add(gsap.fromTo(lanes, { y: 0, opacity: 1 }, { y: 680, opacity: 0.12, duration: 0.9, ease: 'power3.inOut', immediateRender: false }), tSink);
  S.add(fx.out(arrG, { d: 0.3 }), tSink);
  ignoreIn([lanes], tSink, tBack + 0.9);
  const ships = S.g();
  const ship2 = S.icon('fluent:ship', { x: 400, y: 372, size: 290 }, ships);
  const ship1 = S.icon('fluent:ship', { x: 560, y: 410, size: 290 }, ships);
  const latW = S.text('latency: weeks', { x: 560, y: 610, size: 32, weight: 600, anchor: 'middle', color: 'muted' }, ships);
  const bwHuge = S.text('bandwidth: huge', { x: 560, y: 658, size: 32, weight: 650, anchor: 'middle', color: 'bytes' }, ships);
  const bwX2 = S.text('bandwidth: ×2', { x: 560, y: 658, size: 32, weight: 650, anchor: 'middle', color: 'bytes' }, ships);
  [ship1, ship2, latW, bwHuge, bwX2].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  S.add(fx.in(ship1, { from: 'right', d: 0.7, dist: 60 }), 'b2~container-0.15');
  S.add(fx.in(latW, { from: 'up', d: 0.45, dist: 12 }), 'b2~weeks-0.1');
  S.add(fx.in(bwHuge, { from: 'up', d: 0.45, dist: 12 }), 'b2~goods-0.15');
  S.add(fx.in(ship2, { from: 'left', d: 0.6, dist: 80 }), 'b2~second-0.1');
  S.add(gsap.to(bwHuge, { autoAlpha: 0, duration: 0.25 }), 'b2~doubles-0.05');
  S.add(fx.in(bwX2, { from: 'up', d: 0.4, dist: 10 }), T('b2~doubles') + 0.15);
  S.add(gsap.fromTo(latW, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.14, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%', immediateRender: false }), 'b2~not-0.05');
  const bike = S.g();
  const scooter = S.icon('fluent:motor-scooter', { x: 1400, y: 420, size: 250 }, bike);
  const parcel = S.icon('fluent:package', { x: 1466, y: 396, size: 56 }, bike);
  const latM = S.text('latency: minutes', { x: 1400, y: 610, size: 32, weight: 600, anchor: 'middle', color: 'muted' }, bike);
  const bwTiny = S.text('bandwidth: tiny', { x: 1400, y: 658, size: 32, weight: 650, anchor: 'middle', color: 'bytes' }, bike);
  [scooter, parcel, latM, bwTiny].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  S.add(fx.in([scooter, parcel], { from: 'right', d: 0.6, dist: 60, stagger: 0.12 }), 'b2~motorbike-0.15');
  S.add(fx.in(latM, { from: 'up', d: 0.45, dist: 12 }), 'b2~courier-0.1');
  S.add(fx.in(bwTiny, { from: 'up', d: 0.45, dist: 12 }), 'b2~is-0.05');
  const indep = S.text([{ t: 'independent', c: 'ink', w: 700 }, { t: '  ·  more ships, same weeks', c: 'muted' }], { x: 960, y: 770, size: 34, weight: 550, anchor: 'middle' });
  S.set(indep, { autoAlpha: 0 }, 0);
  S.add(fx.in(indep, { from: 'up', d: 0.5, dist: 12 }), 'b2~reverse-0.1');

  // ================================================================ b3: back, one at a time, then many
  S.add(fx.out([ships, bike, indep], { to: 'up', d: 0.5, dist: 40, stagger: 0.05 }), T('b3') - 0.2);
  S.add(gsap.fromTo(lanes, { y: 680, opacity: 0.12 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.inOut', immediateRender: false }), tBack);
  S.add(gsap.to(waitLbl, { autoAlpha: 0, duration: 0.25 }), 'b3~distance-0.3');
  S.add(fx.in(fixedTag, { from: 'up', d: 0.45, dist: 10 }), 'b3~distance-0.1');
  S.add(fx.in(dryTag, { from: 'up', d: 0.45, dist: 10 }), 'b3~physics-0.1');
  S.add(fx.dim(dryTag, { to: 0.4 }), tF0 + 0.3);
  S.add(fx.in(fullTag, { from: 'up', d: 0.45, dist: 10 }), 'b3~pipe-0.2');

  // ================================================================ b4: hold them apart
  const tEnd = T('b4') - 0.1;
  S.add(gsap.to(lanes, { opacity: 0, duration: 0.6, ease: 'power2.in' }), tEnd);
  const wL = S.measure('latency', { size: 84, weight: 700, family: 'display' }), wB = S.measure('bandwidth', { size: 84, weight: 700, family: 'display' });
  const GAPW = 170, xL = 960 - (wL + GAPW + wB) / 2;
  const wLat = S.text('latency', { x: xL + wL, y: 540, size: 84, weight: 700, family: 'display', anchor: 'end', color: 'muted' });
  const wBw = S.text('bandwidth', { x: xL + wL + GAPW, y: 540, size: 84, weight: 700, family: 'display', color: 'bytes' });
  S.add(fx.in(wLat, { from: 'right', d: 0.7, dist: 40 }), tEnd + 0.4);
  S.add(fx.in(wBw, { from: 'left', d: 0.7, dist: 40 }), tEnd + 0.4);
  const tApart = T('b4~Hold') - 0.05;
  S.add(gsap.to(wLat, { x: -45, duration: 0.9, ease: 'power3.inOut' }), tApart);
  S.add(gsap.to(wBw, { x: 45, duration: 0.9, ease: 'power3.inOut' }), tApart);
});
