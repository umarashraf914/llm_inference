/* ch10_s07 · the same toll, and what amortising means (fig 117)
   Checked: 140 GB ÷ 10 = 14 GB; ÷ 200 = 0.7 GB; ÷ 2,000 = 0.07 GB = 70 MB.
   b1  the decode lane: coral flow from 'load once' to one token tile; a weight tile rides along, flashes once:
       'uses of this weight' 0 → 1 ('1 input vector'); then the prefill lane: the flow fans into a row of tiles
       to '2,000 tokens'; the weight tile glides along the row flashing at each: 1 → 2,000.
   b2  both toll gates stamp '140 GB' at once; '× 2,000' between the lanes; the counters pulse.
   b3  a thought bubble 'slow because the model is large', ticked, then 'misses the point'; the counters pulse.
   b4  the lanes shrink into a dim strip at the top; 'amortise: spread a fixed cost over more work';
       'earlier: the start-up load'; 'cost per token = 140 GB ÷ tokens sharing the read' ('amortise = divide').
   b5  rows to scale: 1 token 140 GB, 10 → 14 GB, 200 → 0.7 GB, 2,000 → 0.07 GB (= 70 MB); a '140 GB' chip on
       every row; teal '÷ 10' arrows.
   b6  'prefill: spread across thousands' on the 2,000 row; 'decode, one request' and a padlock on the 1 row;
       a spotlight on it: 'nobody to share it with'.
   Layout: lanes x 110-1810 (prefill y 150-260, decode y 320-430), drawn there and moved as one picture: centred
   alone (+250), up to +108 when the thought bubble comes under them (b3), then shrunk into a strip. b4: the
   strip, the band (y 416) and the formula (y 512) centred as one block (+168.5); b5: the block back up and the
   rows (y 607 / 692 / 777 / 862, bars from x 508, 1,200 px = 140 GB) under it, the whole frame centred. */
V.scene('ch10_s07', S => {
  const K = ch10Kit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;

  // ================================================================ the two lanes
  const lanesG = S.g();
  const GX = 404;   // the toll gate, clear of the 'load once' box (x 140-340) even under its stamp
  const mkLane = (y, title) => {
    const g = S.g(null, lanesG);
    S.rect({ x: 110, y, w: 1700, h: 110, r: 20, fill: '#0b1224', fillOpacity: 0.8, stroke: 'struct', strokeOpacity: 0.5, sw: 2 }, g);
    S.text(title, { x: 140, y: y + 26, size: 24, weight: 700, color: 'ink' }, g);
    const cy = y + 72;
    const box = S.g(null, g);
    S.rect({ x: 140, y: cy - 24, w: 200, h: 48, r: 10, fill: 'url(#card-bytes)', stroke: 'bytes', sw: 2 }, box);
    S.icon('ph:memory-duotone', { x: 166, y: cy, size: 30, color: 'bytes' }, box);
    S.text('load once', { x: 190, y: cy + 1, size: 24, weight: 700, color: 'bytes' }, box);
    S.icon('ph:barricade-duotone', { x: GX, y: cy, size: 36, color: 'muted' }, g).setAttribute('data-audit', 'ignore');   // the stamp lands on it
    const stamp = S.pill('140 GB', { x: GX, y: cy, tone: 'bytes', size: 22, h: 36, style: 'solid', mono: true }, g);
    hide(stamp);
    const cntL = S.text('uses of this weight', { x: 1790, y: cy - 22, size: 20, weight: 600, anchor: 'end', color: 'muted' }, g);
    const cnt = S.text('0', { x: 1790, y: cy + 14, size: 34, weight: 750, family: 'mono', anchor: 'end', color: 'compute' }, g);
    const cntGlow = S.rect({ x: 1640, y: cy - 6, w: 160, h: 40, r: 10, fill: 'compute', opacity: 0 }, g);
    cntGlow.setAttribute('data-audit', 'ignore');
    Object.assign(g, { cy, stamp, cnt, cntL, cntGlow });
    return g;
  };
  const pre = mkLane(150, 'Prefill: one load, thousands of tokens');
  const dec = mkLane(320, 'Decode: one load, one token');
  hide([pre, dec]);
  const tDec = 0.4, tPre = T('b1~In#3') - 0.1;
  fade(dec, 0, 1, tDec, 0.5);
  fade(pre, 0, 1, tPre, 0.5);
  // tokens: one tile in decode; a row out to '2,000 tokens' in prefill
  const TX0 = 560, TP = 44, NT = 18;
  const tok = (x, y, parent) => S.rect({ x: x - 17, y: y - 17, w: 34, h: 34, r: 6, fill: 'url(#solid-struct)' }, parent);
  const decTok = tok(TX0, dec.cy, dec);
  const preToks = Array.from({ length: NT }, (_, i) => tok(TX0 + i * TP, pre.cy, pre));
  S.text('…', { x: TX0 + NT * TP + 4, y: pre.cy, size: 30, weight: 700, color: 'struct' }, pre);
  S.text('2,000 tokens', { x: TX0 + NT * TP + 40, y: pre.cy, size: 24, weight: 700, color: 'struct' }, pre);
  // the coral flow, from the gate to the tokens (a fan in prefill)
  const flow = (lane, toXs, t0, toY) => {
    const g = S.g(null, lane);
    g.setAttribute('data-audit', 'ignore');
    const paths = toXs.map(x => S.path({ d: `M${GX + 24},${lane.cy} C${GX + 86},${lane.cy} ${x - 40},${toY} ${x},${toY - 18}`, stroke: 'bytes', sw: 1.4, strokeOpacity: 0.5 }, g));
    paths.forEach(p => K.draw(p, 1600, t0, 0.5));
    const pr = S.rand(7 + toXs.length), dots = Array.from({ length: 16 }, () => ({ p: paths[Math.floor(pr() * paths.length)], ph: pr(), el: S.circle({ x: 0, y: 0, r: 3, fill: 'bytes', opacity: 0 }, g) }));
    whole(t => {
      const on = cl((t - t0 - 0.3) / 0.4), surge = 1 + 0.8 * Math.max(0, Math.sin(Math.PI * cl((t - T('b2~toll') + 0.1) / 0.8)));
      dots.forEach(d => {
        if (on <= 0) { d.el.setAttribute('opacity', 0); return; }
        const L = d.p.getTotalLength(), u = (t * 0.6 + d.ph) % 1, q = d.p.getPointAtLength(L * u);
        d.el.setAttribute('cx', q.x.toFixed(1)); d.el.setAttribute('cy', q.y.toFixed(1));
        d.el.setAttribute('opacity', Math.min(1, on * 0.8 * surge * Math.min(1, u * 6, (1 - u) * 6)).toFixed(3));
      });
    });
  };
  flow(dec, [TX0], tDec + 0.4, dec.cy);
  flow(pre, preToks.filter((_, i) => i % 3 === 0).map((_, i) => TX0 + i * 3 * TP), tPre + 0.3, pre.cy);
  // the weight tile: decode, one use; prefill, a use at every token
  const wTile = (lane, xs, t0, dt) => {
    const w = S.rect({ x: -9, y: -9, w: 18, h: 18, r: 3, fill: 'bytes', stroke: 'white', strokeOpacity: 0.6, sw: 1 }, lane);
    w.setAttribute('data-audit', 'ignore');
    const t1 = t0 + 0.5 + dt * xs.length;
    whole(t => {
      let x;
      if (t < t0 + 0.5) x = lerp(GX + 24, xs[0], EIO(cl((t - t0) / 0.5)));
      else x = lerp(xs[0], xs[xs.length - 1], cl((t - t0 - 0.5) / Math.max(0.01, dt * (xs.length - 1))));
      w.setAttribute('transform', `translate(${x.toFixed(1)},${lane.cy - 30})`);
      setO(w, t > t0 && t < t1 + 0.3 ? Math.min(1, (t - t0) * 6, (t1 + 0.3 - t) * 4) : 0);
    });
    return t1;
  };
  const tW = T('b1~each') - 0.1;
  wTile(dec, [TX0], tW, 0.6);
  const flD = S.rect({ x: TX0 - 22, y: dec.cy - 22, w: 44, h: 44, r: 8, fill: 'compute', opacity: 0 }, dec);
  flD.setAttribute('data-audit', 'ignore');
  const tMac = T('b1~multiply') - 0.1;
  pulse(flD, tMac, 0.9, 0.5);
  whole(t => { dec.cnt.textContent = t >= tMac + 0.25 ? '1' : '0'; });
  const inV = S.text('1 input vector', { x: TX0, y: 462, size: 24, weight: 600, anchor: 'middle', color: 'muted' }, lanesG);
  hide(inV);
  fade(inV, 0, 1, tMac + 0.2, 0.3);
  fade(inV, 1, 0, tPre, 0.3);
  const tGl = T('b1~it') - 0.3, GD = 0.07;
  const preX = preToks.map((_, i) => TX0 + i * TP);
  wTile(pre, preX, tGl, GD);
  preToks.forEach((p, i) => { const f = S.rect({ x: preX[i] - 21, y: pre.cy - 21, w: 42, h: 42, r: 8, fill: 'compute', opacity: 0 }, pre); f.setAttribute('data-audit', 'ignore'); pulse(f, tGl + 0.5 + GD * i - 0.05, 0.85, 0.25); });
  whole(t => { const k = cl((t - tGl - 0.5) / (GD * NT + 0.4)); pre.cnt.textContent = t < tGl + 0.5 ? '0' : Math.max(1, Math.round(2000 * k)).toLocaleString('en-US'); });

  // ================================================================ b2: the same toll; payoff × 2,000
  const tToll = T('b2~toll') - 0.1;
  [pre, dec].forEach(l => S.add(K.drive(1.4, k => { const s = k < 0.2 ? lerp(1.6, 1, E('back.out(2)')(k / 0.2)) : 1; setO(l.stamp, k < 0.85 ? Math.min(1, k * 8) : (1 - k) / 0.15); l.stamp.setAttribute('transform', `translate(${GX - GX * s},${l.cy - l.cy * s}) scale(${s})`); }), tToll));
  const x2k = S.pill('× 2,000', { x: 1650, y: 290, tone: 'compute', size: 26, h: 44, style: 'solid', mono: true }, lanesG);
  hide(x2k);
  const tTh = T('b2~thousands') - 0.1;
  fade(x2k, 0, 1, tTh, 0.35);
  const tTh2 = T('b3~work') - 0.1;
  [pre, dec].forEach(l => { pulse(l.cntGlow, tTh + 0.2, 0.3, 0.6); pulse(l.cntGlow, tTh2, 0.3, 0.6); });

  // ================================================================ b3: true, but beside the point
  const tBub = T('b3~because') - 0.1;
  // the lanes (moved +108 by now) and the bubble under them, centred as one block
  const bub = S.g();
  S.rect({ x: 600, y: 668, w: 720, h: 90, r: 45, fill: '#0c1326', stroke: 'white', strokeOpacity: 0.35, sw: 2 }, bub);
  S.circle({ x: 640, y: 784, r: 12, fill: '#0c1326', stroke: 'white', strokeOpacity: 0.35, sw: 2 }, bub);
  S.circle({ x: 618, y: 812, r: 7, fill: '#0c1326', stroke: 'white', strokeOpacity: 0.35, sw: 2 }, bub);
  S.text('slow because the model is large', { x: 930, y: 714, size: 32, weight: 650, anchor: 'middle', color: 'ink' }, bub);
  const bTick = S.icon('ph:check-bold', { x: 1270, y: 712, size: 36, color: 'helps' }, bub);
  const miss = S.text('misses the point', { x: 960, y: 808, size: 28, weight: 650, anchor: 'middle', color: 'muted' });
  hide([bub, bTick, miss]);
  S.add(K.drive(0.6, k => { setO(bub, k); bub.setAttribute('transform', `translate(0,${(30 * (1 - E('power3.out')(k))).toFixed(1)})`); }), tBub);
  fade(bTick, 0, 1, T('b3~True') - 0.1, 0.3);
  fade(miss, 0, 1, T('b3~beside') - 0.1, 0.35);
  fade([bub, miss], 1, 0, T('b3~work') - 0.15, 0.35);

  // ================================================================ b4: amortise = divide
  const tB4 = T('b4') - 0.1;
  fade(x2k, 1, 0, tB4, 0.3);
  // the lanes as one picture: centred alone (+250), up for the bubble (+108), then shrunk into a strip at the top of
  // the b4 block (+302.5), which moves up with it in b5 (+134)
  const tUp = T('b5') - 0.7, up = t => EIO(cl((t - tUp) / 0.7));
  whole(t => {
    const pre = lerp(250, 108, EIO(cl((t - tBub) / 0.7))), k = EIO(cl((t - tB4) / 0.8)), s = lerp(1, 0.42, k);
    lanesG.setAttribute('transform', `translate(${(960 - 960 * s).toFixed(1)},${lerp(pre, lerp(302.5, 134, up(t)), k).toFixed(1)}) scale(${s.toFixed(4)})`);
  });
  fade(lanesG, 1, 0.16, tB4, 0.8);
  K.ignore(lanesG, tB4, S.duration - tB4);
  const fG = S.g();             // the band and the formula: centred under the strip in b4, up 168.5 in b5
  whole(t => fG.setAttribute('transform', `translate(0,${(168.5 * (1 - up(t))).toFixed(1)})`));
  const band = S.g(null, fG);
  S.rect({ x: 110, y: 387, w: 1700, h: 58, r: 14, fill: '#0c1326', stroke: 'helps', strokeOpacity: 0.5, sw: 2 }, band);
  S.text([{ t: 'amortise: ', c: 'helps' }, { t: 'spread a fixed cost over more work', c: 'ink' }], { x: 960, y: 417, size: 30, weight: 700, anchor: 'middle' }, band);
  hide(band);
  fade(band, 0, 1, tB4 + 0.4, 0.4);
  const callb = S.text('earlier: the start-up load', { x: 1780, y: 417, size: 22, weight: 600, anchor: 'end', color: 'muted' }, fG);
  hide(callb);
  fade(callb, 0, 1, T('b4~startup') - 0.1, 0.3);
  fade(callb, 1, 0, T('b4~startup') + 1.8, 0.4);
  // the formula in its box, and its tag beside it, centred as a pair
  const FY = 512, FS = 34;
  const fparts = [['cost per token', 'ink', 'b4~division'], ['=', 'ink', 'b4~division'], ['140 GB', 'bytes', 'b4~hundred'], ['÷', 'ink', 'b4~over#2'], ['tokens sharing the read', 'struct', 'b4~tokens']];
  const fw = fparts.map(([s]) => S.measure(s, { size: FS, weight: 750 }));
  const FX0 = 960 - (20 + fw.reduce((a, b) => a + b + 18, 0) + 20 + S.measure('amortise = divide', { size: 24, weight: 600 })) / 2;
  let fx = FX0 + 20;
  const fEls = fparts.map(([s, c, cue], i) => { const e = S.text(s, { x: fx, y: FY, size: FS, weight: 750, color: c }, fG); fx += fw[i] + 18; hide(e); fade(e, 0, 1, T(cue) - 0.1 + (i === 1 ? 0.2 : 0), 0.3); return e; });
  const fBox = S.rect({ x: FX0, y: FY - 34, w: fx - FX0, h: 68, r: 14, fill: 'none', stroke: 'white', strokeOpacity: 0.25, sw: 2 }, fG);
  hide(fBox);
  fade(fBox, 0, 1, T('b4~division') - 0.1, 0.3);
  const divT = S.text('amortise = divide', { x: fx + 20, y: FY, size: 24, weight: 600, color: 'muted' }, fG);
  hide(divT);
  fade(divT, 0, 1, T('b4~read') - 0.1, 0.35);
  void fEls;

  // ================================================================ b5: the share falls in exact proportion
  // the rows, from the '÷ 10' tags at the left to the '140 GB' value at the right, centred (OX)
  const RY = [607, 692, 777, 862], OX = 38, BX = 470 + OX, BW = 1200, RH = 44;
  const ROWS = [['1 token', 140, '140 GB', 'b5~One'], ['10 tokens', 14, '14 GB', 'b5~Ten'], ['200 tokens', 0.7, '0.7 GB', 'b5~each'], ['2,000 tokens', 0.07, '0.07 GB', 'b5~Two']];
  const note = S.text('bars to scale', { x: BX + BW, y: RY[0] - 46, size: 22, weight: 600, anchor: 'end', color: 'muted' });
  hide(note);
  fade(note, 0, 1, T('b5') - 0.1, 0.35);
  const rowEls = ROWS.map(([lab, gb, val, cue], i) => {
    const g = S.g();
    const t0 = T(cue) - 0.1 + (i === 2 ? -0.5 : 0);
    S.text(lab, { x: 160 + OX, y: RY[i], size: 24, weight: 700, color: 'struct' }, g);
    const bar = S.rect({ x: BX, y: RY[i] - RH / 2, w: 0, h: RH, r: 4, fill: 'url(#solid-bytes)' }, g);
    const w = Math.max(1.5, BW * gb / 140);
    whole(t => bar.setAttribute('width', (w * EIO(cl((t - t0 - 0.1) / 0.6))).toFixed(2)));
    const v = S.text(val, { x: BX + w + 16, y: RY[i], size: 26, weight: 750, family: 'mono', color: 'bytes' }, g);
    if (i === 3) S.text('= 70 MB', { x: BX + w + 16 + S.measure(val, { size: 26, weight: 750, family: 'mono' }) + 16, y: RY[i], size: 24, weight: 600, color: 'muted' }, g);
    hide(g);
    fade(g, 0, 1, t0, 0.35);
    void v;
    return g;
  });
  // the identical read on every row, and the ÷ 10 steps
  const tNev = T('b5~never') - 0.1;
  const chips = RY.map(y => { const c = S.pill('140 GB', { x: 396 + OX, y, tone: 'bytes', size: 20, h: 34, mono: true }); hide(c); return c; });   // clear of '2,000 tokens'
  fade(chips, 0, 1, tNev, 0.3, 0.08);
  const div10 = [[0, 1], [2, 3]].map(([a, b]) => {
    const g = S.g();
    const p = S.path({ d: `M${136 + OX},${RY[a] + 8} C${112 + OX},${RY[a] + 30} ${112 + OX},${RY[b] - 30} ${136 + OX},${RY[b] - 8}`, stroke: 'helps', sw: 2.5 }, g);
    S.path({ d: `M${126 + OX},${RY[b] - 18} L${136 + OX},${RY[b] - 8} L${140 + OX},${RY[b] - 22}`, stroke: 'helps', sw: 2.5 }, g);
    p.setAttribute('data-audit', 'ignore');
    S.text('÷ 10', { x: 106 + OX, y: (RY[a] + RY[b]) / 2, size: 22, weight: 700, anchor: 'end', color: 'helps' }, g);
    hide(g);
    return g;
  });
  fade(div10, 0, 1, tNev + 0.5, 0.35, 0.2);

  // ================================================================ b6: decode has nobody to share with
  const tPf = T('b6~Prefill') - 0.1;
  const pTag = S.pill('prefill: spread across thousands', { x: 980 + OX, y: RY[3], tone: 'helps', size: 24, h: 42, anchor: 'start' });
  hide(pTag);
  S.add(K.drive(0.5, k => { setO(pTag, k); pTag.setAttribute('transform', `translate(${(80 * (1 - E('power3.out')(k))).toFixed(1)},0)`); }), tPf);
  const tSt = T('b6~stuck') - 0.1;
  const dTag = S.pill('decode, one request', { x: 900 + OX, y: RY[0], tone: 'bytes', size: 24, h: 36, color: 'ink' });
  const lock = S.icon('ph:lock-simple-duotone', { x: 900 + OX + dTag.w / 2 + 30, y: RY[0], size: 34, color: 'ink' });
  hide([dTag, lock]);
  S.add(K.drive(0.5, k => { setO(dTag, k); dTag.setAttribute('transform', `translate(${(-80 * (1 - E('power3.out')(k))).toFixed(1)},0)`); }), tSt);
  fade(lock, 0, 1, tSt + 0.45, 0.2);
  // the spotlight: everything but the decode row dims
  const tNo = T('b6~nobody') - 0.1;
  const veilA = S.rect({ x: 0, y: 0, w: 1920, h: RY[0] - 34, fill: '#060a14', opacity: 0 });
  const veilB = S.rect({ x: 0, y: RY[0] + 34, w: 1920, h: 1080, fill: '#060a14', opacity: 0 });
  [veilA, veilB].forEach(v => { v.setAttribute('data-audit', 'ignore'); S.add(gsap.fromTo(v, { attr: { opacity: 0 } }, { attr: { opacity: 0.8 }, duration: 0.6, immediateRender: false }), tNo); });
  K.ignore([...rowEls.slice(1), ...chips.slice(1), ...div10, pTag, band, fBox, divT, note, ...fEls], tNo + 0.3, S.duration - tNo);
  const nob = S.text('nobody to share it with', { x: 960, y: RY[0] + 74, size: 34, weight: 750, anchor: 'middle', color: 'ink' });
  hide(nob);
  fade(nob, 0, 1, tNo + 0.4, 0.45);
});
