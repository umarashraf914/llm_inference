/* ch11_s08 · what the roofline ignores (fig 127)
   Checked: small H100 roofline, 170 px per factor of ten from (620, 880): flat y = 880 - 170 log10(989) = 370.8;
   slant at intensity 1: 880 - 170 log10(3.35) = 790.7; ridge x = 620 + 170 log10(295.2) = 1039.9; right edge
   1300. Workload dots (intensity, share of the roof → x, y): (1.6, .6 → 655, 794) (4, 1 → 722, 688)
   (9, .42 → 782, 693) (15, .12 → 820, 747) (25, .7 → 858, 579) (55, .3 → 916, 584) (70, 1 → 934, 477)
   (160, .5 → 995, 467) (500, .75 → 1079, 392) (800, .2 → 1114, 490) (1200, 1 → 1144, 371) (2400, .35 → 1195, 448)
   (3000, .035 → 1211, 618) (5500, .6 → 1256, 409): none above the roof.
   b1  three empty cards; 'One memory level' fills: HBM stack, one pipe, chip; three cache blocks build out from the
       chip with a bracket 'cache hierarchy'; they pulse outward; 'working areas'; a divider, a server icon,
       'cache: running record', and '≠' on the divider.
   b2  'No launch latency': lanes 'ideal' and 'real' with a 'start-up' gap; 'Perfect pipelining': memory, pipe and
       arithmetic with a steady flow; the flow breaks, the arithmetic greys, a 'bubble' floats up.
   b3  the small roofline draws; its outline brightens; grey workload dots land on or under it: 'real workloads'.
   b4  a 'SIMPLIFIED' stamp across the three cards; 'arithmetic starved' (coral, left of the ridge) and 'memory bus
       starved' (amber, right); the roof pulses: 'since 2009'.
   b5  the cards brighten under the stamp; takeaway 'trust it where it applies'.
   Layout: cards 480 x 150 at x 400 / 960 / 1520, y 160-310; one illustration at a time in y 380-880. */
V.scene('ch11_s08', S => {
  const K = ch11Kit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;

  // ================================================================ the three cards
  const tThree = T('b1~three') - 0.1, tOne = T('b1~One') - 0.1, tNo = T('b2~No') - 0.1, tPerf = T('b2~Perfect') - 0.1;
  const tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1, tLand = T('b4~every') - 0.12, tAss = T('b5~assumptions') - 0.1;
  const CARDS = [
    [400, 'One memory level', 'no cache hierarchy', tOne, tNo],
    [960, 'No launch latency', 'work starts instantly', tNo, tPerf],
    [1520, 'Perfect pipelining', 'no bubbles', tPerf, tB3],
  ];
  const cards = CARDS.map(([x, title, sub, tFill, tDim], i) => {
    const g = S.g();
    const outline = S.rect({ x: x - 240, y: 160, w: 480, h: 150, r: 18, stroke: 'struct', strokeOpacity: 0.5, sw: 2 }, g);
    K.draw(outline, 1300, tThree + 0.15 * i, 0.6);
    const fill = S.rect({ x: x - 240, y: 160, w: 480, h: 150, r: 18, fill: 'url(#card-struct)', stroke: 'struct', sw: 2.5 }, g);
    const badge = S.g(null, g);
    S.circle({ x: x - 196, y: 235, r: 22, fill: '#0c1326', stroke: 'struct', sw: 2 }, badge);
    S.text(String(i + 1), { x: x - 196, y: 236, size: 24, weight: 750, family: 'mono', anchor: 'middle', color: 'struct' }, badge);
    const tt = S.text(title, { x: x + 22, y: 216, size: 32, weight: 750, anchor: 'middle', color: 'ink' }, g);
    const st = S.text(sub, { x: x + 22, y: 266, size: 24, weight: 600, anchor: 'middle', color: 'muted' }, g);
    hide([fill, badge, tt, st]);
    fade(badge, 0, 1, tThree + 0.15 * i + 0.3, 0.35);
    fade([fill, tt], 0, 1, tFill, 0.4);
    fade(st, 0, 1, tFill + 0.2, 0.4);
    fade(st, 1, 0, tDim, 0.35);
    // dims when the next card fills; all three come back for the stamp, sink under it, return for 'assumptions'
    K.track(g, [K.K(tDim, { o: 1, y: 0 }), K.K(tDim + 0.4, { o: 0.6 }), K.K(tB4 + 0.05, { o: 0.6 }), K.K(tB4 + 0.45, { o: 1 }),
      K.K(tLand + 0.2, { o: 1, y: 0 }), K.K(tLand + 0.26, { o: 0.5, y: 6, e: 'power2.out' }), K.K(tLand + 0.5, { y: 0 }),
      K.K(tAss, { o: 0.5 }), K.K(tAss + 0.5, { o: 1 })]);
    return g;
  });

  // ================================================================ b1: one memory level, ignoring the cache hierarchy
  const ill1 = S.g();
  const hbm = S.g(null, ill1);
  for (let i = 0; i < 5; i++) {
    S.rect({ x: 480, y: 548 + i * 30, w: 160, h: 24, r: 5, fill: 'url(#solid-bytes)', stroke: '#060a14', sw: 1.5 }, hbm);
    S.path({ d: `M488,${551 + i * 30} H632`, stroke: 'white', strokeOpacity: 0.35, sw: 1.5 }, hbm);
  }
  S.text('HBM', { x: 560, y: 740, size: 30, weight: 750, anchor: 'middle', color: 'bytes' }, hbm);
  const chip = S.g(null, ill1);
  S.icon('ph:cpu-duotone', { x: 1360, y: 620, size: 140, color: 'compute' }, chip);
  S.text('chip', { x: 1360, y: 740, size: 30, weight: 750, anchor: 'middle', color: 'compute' }, chip);
  K.track(hbm, [K.K(tOne, { y: 50, o: 0 }), K.K(tOne + 0.5, { y: 0, o: 1, e: 'power3.out' })]);
  K.track(chip, [K.K(tOne + 0.25, { y: 50, o: 0 }), K.K(tOne + 0.75, { y: 0, o: 1, e: 'power3.out' })]);
  const pipeG = S.g(null, ill1);
  const pipe = S.rect({ x: 640, y: 606, w: 656, h: 28, r: 14, fill: '#140c14', stroke: 'bytes', strokeOpacity: 0.6, sw: 2 }, pipeG);
  hide(pipe);
  fade(pipe, 0, 1, tOne + 0.6, 0.4);
  K.draw(pipe, 1400, tOne + 0.6, 0.6);
  const bytes1 = S.g(null, ill1);
  bytes1.setAttribute('data-audit', 'ignore');
  const r1 = S.rand(7), p1 = Array.from({ length: 30 }, () => ({ ph: r1(), dy: r1() - 0.5, el: S.rect({ x: -4, y: -1.5, w: 8, h: 3, r: 1, fill: 'bytes', opacity: 0 }, bytes1) }));
  whole(t => {
    const on = cl((t - tOne - 1.1) / 0.4);
    p1.forEach(p => {
      const u = (t * 0.6 + p.ph) % 1;
      p.el.setAttribute('transform', `translate(${lerp(652, 1290, u).toFixed(1)},${(620 + p.dy * 16).toFixed(1)})`);
      p.el.setAttribute('opacity', (on * 0.9 * Math.min(1, u * 10, (1 - u) * 10)).toFixed(3));
    });
  });
  // the cache levels: smallest touching the chip, each next one larger and farther out (drawn over the pipe)
  const tCache = T('b1~cache') - 0.1;
  const BLK = [[1252, 44, 64], [1140, 72, 104], [990, 110, 150]];
  const blocks = BLK.map(([x, w, h], i) => {
    const g = S.g(null, ill1);
    g.glow = S.rect({ x: x - 14, y: 620 - h / 2 - 14, w: w + 28, h: h + 28, r: 14, fill: 'url(#pglow-struct)', opacity: 0 }, g);
    g.glow.setAttribute('data-audit', 'ignore');
    S.rect({ x, y: 620 - h / 2, w, h, r: 8, fill: '#0a1122' }, g);
    S.rect({ x, y: 620 - h / 2, w, h, r: 8, fill: 'url(#card-struct)', stroke: 'struct', sw: 2.5 }, g);
    K.track(g, [K.K(tCache + 0.2 * i, { x: 1296 - x - w, o: 0 }), K.K(tCache + 0.2 * i + 0.5, { x: 0, o: 1, e: 'power3.out' })]);
    return g;
  });
  const tHier = T('b1~hierarchy');
  const brk = S.path({ d: 'M990,704 v10 H1296 v-10 M1143,714 v8', stroke: 'white', sw: 2.5 }, ill1);
  K.draw(brk, 400, tHier + 0.1, 0.45);
  const brkT = S.text('cache hierarchy', { x: 1143, y: 750, size: 26, weight: 700, anchor: 'middle', color: 'ink' }, ill1);
  hide(brkT);
  fade(brkT, 0, 1, tHier + 0.35, 0.35);
  const tSmall = T('b1~small') - 0.1;
  blocks.forEach((b, i) => pulse(b.glow, tSmall + 0.43 * i, 0.9, 0.7));
  const tWork = T('b1~working') - 0.1;
  pulse(blocks[0].glow, tWork, 1, 0.9);
  const work = S.g(null, ill1);
  S.path({ d: 'M1274,584 V554', stroke: 'struct', sw: 2 }, work);
  S.pill('working areas', { x: 1274, y: 530, tone: 'struct', size: 24, h: 44 }, work);
  hide(work);
  fade(work, 0, 1, tWork + 0.1, 0.35);
  // not the server's cache: same word, different job
  const tServ = T('b1~server') - 0.1;
  const div = S.path({ d: 'M1460,440 V800', stroke: 'muted', strokeOpacity: 0.7, sw: 2 }, ill1);
  div.setAttribute('data-audit', 'ignore');
  K.draw(div, 380, tServ, 0.5);
  const serv = S.icon('ph:hard-drives-duotone', { x: 1640, y: 596, size: 104, color: 'muted' }, ill1);
  K.track(serv, [K.K(tServ + 0.25, { y: 30, o: 0 }), K.K(tServ + 0.7, { y: 0, o: 1, e: 'power3.out' })]);
  const sTag = S.pill('cache: running record', { x: 1640, y: 690, tone: 'neutral', size: 24, h: 44 }, ill1);
  hide(sTag);
  fade(sTag, 0, 1, T('b1~running') - 0.1, 0.35);
  const neq = S.g(null, ill1);
  S.circle({ x: 1460, y: 620, r: 27, fill: '#0c1326', stroke: 'muted', sw: 2 }, neq);
  S.text('≠', { x: 1460, y: 622, size: 40, weight: 700, anchor: 'middle', color: 'muted' }, neq);
  K.track(neq, [K.K(T('b1~different') - 0.1, { y: -40, o: 0 }), K.K(T('b1~different') + 0.35, { y: 0, o: 1, e: 'bounce.out' })]);
  fade(ill1, 1, 0, tNo, 0.4);

  // ================================================================ b2a: launch latency
  const ill2a = S.g();
  const LANES = [[560, 'ideal', 700], [680, 'real', 860]];
  LANES.forEach(([y, name]) => {
    S.text(name, { x: 676, y, size: 28, weight: 700, anchor: 'end', color: 'ink' }, ill2a);
    S.rect({ x: 700, y: y - 32, w: 800, h: 64, r: 12, fill: '#0b1222', stroke: 'white', strokeOpacity: 0.16, sw: 2 }, ill2a);
  });
  const arrowT = S.g(null, ill2a);
  S.path({ d: 'M700,750 H1490 M1480,744 L1490,750 L1480,756', stroke: 'muted', sw: 2 }, arrowT);
  S.text('time', { x: 1500, y: 750, size: 22, weight: 600, color: 'muted' }, arrowT);
  hide(ill2a);
  fade(ill2a, 0, 1, tNo + 0.2, 0.4);
  const tRun = T('b2~latency') + 0.1, SPD = 800 / 2.4;
  const gapR = S.rect({ x: 700, y: 656, w: 0, h: 48, r: 8, fill: 'neutral', fillOpacity: 0.22, stroke: 'neutral', strokeOpacity: 0.6, sw: 2, dash: '6 5' }, ill2a);
  const gapT = S.text('start-up', { x: 780, y: 681, size: 22, weight: 650, anchor: 'middle', color: 'muted' }, ill2a);
  const jobs = LANES.map(([y, , x]) => {
    const r = S.rect({ x, y: y - 24, w: 0, h: 48, r: 8, fill: 'url(#solid-struct)' }, ill2a);
    const l = S.text('work', { x: x + 240, y: y + 1, size: 24, weight: 700, anchor: 'middle', color: '#0a0f1e' }, ill2a);
    return { r, l, x };
  });
  const head = S.path({ d: 'M0,512 V724', stroke: 'white', sw: 2.5 }, ill2a);
  head.setAttribute('data-audit', 'ignore');
  hide([gapT, head]);
  jobs.forEach(j => hide(j.l));
  whole(t => {
    const px = 700 + Math.max(0, t - tRun) * SPD;
    gapR.setAttribute('width', cl((px - 700) / 160) * 160);
    setO(gapR, px > 701 ? 1 : 0);
    setO(gapT, cl((px - 840) / 20));
    jobs.forEach(j => {
      const w = Math.max(0, Math.min(480, px - j.x));
      j.r.setAttribute('width', w.toFixed(1));
      setO(j.r, w > 0.5 ? 1 : 0);
      setO(j.l, cl((w - 300) / 40));
    });
    head.setAttribute('transform', `translate(${Math.min(px, 1500).toFixed(1)},0)`);
    setO(head, t > tRun && px < 1500 ? 1 : 0);
  });
  fade(ill2a, 1, 0, tPerf, 0.35);

  // ================================================================ b2b: perfect pipelining, then a bubble
  const ill2b = S.g();
  const station = (x, tone, icon, name) => {
    const g = S.g(null, ill2b);
    S.rect({ x: x - 150, y: 525, w: 300, h: 190, r: 20, fill: `url(#card-${tone})`, stroke: tone, sw: 2.5 }, g);
    S.icon(icon, { x, y: 594, size: 76, color: tone }, g);
    S.text(name, { x, y: 672, size: 30, weight: 750, anchor: 'middle', color: tone }, g);
    return g;
  };
  const memC = station(600, 'bytes', 'ph:memory-duotone', 'memory');
  const pipe2 = S.rect({ x: 750, y: 606, w: 420, h: 28, r: 14, fill: '#140c14', stroke: 'bytes', strokeOpacity: 0.6, sw: 2 }, ill2b);
  const ariC = station(1320, 'compute', 'ph:cpu-duotone', 'arithmetic');
  K.track(memC, [K.K(tPerf + 0.1, { y: 50, o: 0 }), K.K(tPerf + 0.6, { y: 0, o: 1, e: 'power3.out' })]);
  K.track(ariC, [K.K(tPerf + 0.3, { y: 50, o: 0 }), K.K(tPerf + 0.8, { y: 0, o: 1, e: 'power3.out' })]);
  hide(pipe2);
  fade(pipe2, 0, 1, tPerf + 0.4, 0.4);
  // the flow: bytes emitted in [g0, g1] never appear, so a gap travels down the pipe
  const RATE = 1 / 0.9, tBub = T('b2~bubbles') - 0.05, g0 = tBub - 0.95, g1 = tBub + 0.15;
  const bytes2 = S.g(null, ill2b);
  bytes2.setAttribute('data-audit', 'ignore');
  const r2 = S.rand(19), p2 = Array.from({ length: 36 }, () => ({ ph: r2(), dy: r2() - 0.5, el: S.rect({ x: -4, y: -1.5, w: 8, h: 3, r: 1, fill: 'bytes', opacity: 0 }, bytes2) }));
  ill2b.insertBefore(bytes2, ariC);
  whole(t => {
    const on = cl((t - tPerf - 0.8) / 0.3);
    p2.forEach(p => {
      const u = (t * RATE + p.ph) % 1, born = t - u / RATE, gap = born > g0 && born < g1 ? 0 : 1;
      p.el.setAttribute('transform', `translate(${lerp(760, 1162, u).toFixed(1)},${(620 + p.dy * 14).toFixed(1)})`);
      p.el.setAttribute('opacity', (on * gap * 0.9 * Math.min(1, u * 10, (1 - u) * 10)).toFixed(3));
    });
  });
  const idle = t => cl((t - tBub) / 0.3);
  const sparks = S.g(null, ill2b);
  sparks.setAttribute('data-audit', 'ignore');
  const sp = Array.from({ length: 10 }, (_, i) => ({ a: i / 10 * Math.PI * 2, el: S.circle({ x: 0, y: 0, r: 3.5, fill: 'compute', opacity: 0 }, sparks) }));
  whole(t => {
    const on = cl((t - tPerf - 1.0) / 0.4) * (1 - idle(t));
    sp.forEach((s, i) => {
      const u = (t * 1.6 + i / sp.length) % 1, r = 168 + 36 * u;
      s.el.setAttribute('cx', (1320 + r * Math.cos(s.a + t * 0.3)).toFixed(1));
      s.el.setAttribute('cy', (620 + r * 0.62 * Math.sin(s.a + t * 0.3)).toFixed(1));
      s.el.setAttribute('opacity', (on * (1 - u)).toFixed(3));
    });
  });
  const grey = S.rect({ x: 1170, y: 525, w: 300, h: 190, r: 20, fill: '#0a0f1e', opacity: 0 }, ill2b);
  grey.setAttribute('data-audit', 'ignore');
  whole(t => grey.setAttribute('opacity', (0.62 * idle(t)).toFixed(3)));
  const bub = S.g(null, ill2b);
  S.circle({ x: 0, y: 0, r: 34, fill: '#c9d2e3', fillOpacity: 0.1, stroke: '#aab4c8', sw: 2.5 }, bub);
  S.path({ d: 'M-21,-10 A23,23 0 0 1 -6,-25', stroke: 'white', strokeOpacity: 0.75, sw: 3.5 }, bub);
  S.circle({ x: 12, y: 14, r: 3, fill: 'white', opacity: 0.4 }, bub);
  bub.setAttribute('data-audit', 'ignore');
  whole(t => {
    const k = cl((t - tBub - 0.1) / 0.8), o = cl((t - tBub - 0.1) / 0.3);
    bub.setAttribute('transform', `translate(${(1320 + 6 * Math.sin(t * 3.2)).toFixed(1)},${lerp(560, 452, E('power2.out')(k)).toFixed(1)})`);
    bub.setAttribute('opacity', o.toFixed(3));
    bub.style.visibility = o > 0.002 ? 'inherit' : 'hidden';
  });
  const bubT = S.text('bubble', { x: 1372, y: 452, size: 26, weight: 700, color: 'muted' }, ill2b);
  hide(bubT);
  fade(bubT, 0, 1, tBub + 0.5, 0.35);
  fade(ill2b, 1, 0, tB3, 0.4);

  // ================================================================ b3: the roof is a best case
  const ill3 = S.g();
  const roof = ch11Roof(S, { x0: 620, y0: 880, ppd: 170, xDec: 4, yDec: 3, yTop: 345, tickSize: 0, titles: false }, ill3);
  const { X, Y } = roof, R = roof.ridge;
  const tRoof = T('b3~roof') - 0.15;
  K.draw(roof.axes, 1250, tRoof, 0.6);
  hide([roof.xTicks, roof.yTicks]);
  fade([roof.xTicks, roof.yTicks], 0, 1, tRoof + 0.4, 0.4);
  const tC = S.path({ d: `M620,880 V${Y(3.35).toFixed(1)} L${R[0].toFixed(1)},${R[1].toFixed(1)} V880 Z`, fill: 'bytes', opacity: 0 }, ill3);
  const tA = S.path({ d: `M${R[0].toFixed(1)},880 V${R[1].toFixed(1)} H1300 V880 Z`, fill: 'compute', opacity: 0 }, ill3);
  [tC, tA].forEach(p => p.setAttribute('data-audit', 'ignore'));
  const tStarve = T('b4~starves') - 0.1, tBus = T('b4~memory') - 0.1;
  whole(t => {
    const base = cl((t - tRoof - 0.6) / 0.5);
    tC.setAttribute('opacity', (0.06 * base + 0.18 * cl((t - tStarve) / 0.5)).toFixed(3));
    tA.setAttribute('opacity', (0.08 * base + 0.16 * cl((t - tBus) / 0.5)).toFixed(3));
  });
  const outlineD = `M620,${Y(3.35).toFixed(1)} L${R[0].toFixed(1)},${R[1].toFixed(1)} H1300`;
  const glow = S.path({ d: outlineD, stroke: 'white', sw: 16, opacity: 0 }, ill3);
  glow.setAttribute('data-audit', 'ignore');
  const lines = S.g(null, ill3);
  const slant = S.path({ d: roof.slantD, stroke: 'bytes', sw: 4 }, lines);
  const flat = S.path({ d: `M${R[0].toFixed(1)},${R[1].toFixed(1)} H1300`, stroke: 'compute', sw: 4 }, lines);
  K.draw(slant, 600, tRoof + 0.2, 0.6);
  K.draw(flat, 270, tRoof + 0.75, 0.35);
  const ridge = S.circle({ x: R[0], y: R[1], r: 9, fill: 'white', stroke: '#060a14', sw: 2 }, ill3);
  const rTag = S.text('295', { x: R[0] - 20, y: R[1], size: 22, weight: 700, family: 'mono', anchor: 'end', color: 'ink' }, ill3);
  hide([ridge, rTag]);
  fade([ridge, rTag], 0, 1, tRoof + 1.05, 0.3);
  const tBest = T('b3~best') - 0.1, tSince = T('b4~since') - 0.1;
  whole(t => {
    lines.setAttribute('opacity', (0.72 + 0.28 * cl((t - tBest) / 0.4)).toFixed(3));
    const p1 = cl((t - tBest) / 0.9), p2 = cl((t - tSince) / 0.9);
    const bump = (p1 > 0 && p1 < 1 ? Math.sin(Math.PI * p1) : 0) + (p2 > 0 && p2 < 1 ? Math.sin(Math.PI * p2) : 0);
    glow.setAttribute('opacity', (0.1 * cl((t - tBest) / 0.4) + 0.22 * bump).toFixed(3));
  });
  // real workloads land on the roof or under it, never above
  const roofAt = I => Math.min(989, 3.35 * I);
  const DOTS = [[1.6, 0.6], [4, 1], [9, 0.42], [15, 0.12], [25, 0.7], [55, 0.3], [70, 1], [160, 0.5], [500, 0.75], [800, 0.2], [1200, 1], [2400, 0.35], [3000, 0.035], [5500, 0.6]];
  const order = [6, 2, 10, 4, 12, 0, 8, 3, 13, 5, 1, 9, 7, 11];
  const tDots = T('b3~on') - 0.25;
  const dotG = S.g(null, ill3);
  order.forEach((di, k) => {
    const [I, f] = DOTS[di], at = tDots + 0.085 * k;
    const c = S.circle({ x: X(I), y: Y(roofAt(I) * f), r: 8, fill: 'neutral', stroke: '#060a14', sw: 2 }, dotG);
    K.track(c, [K.K(at, { y: -28, o: 0 }), K.K(at + 0.4, { y: 0, o: 1, e: 'bounce.out' })]);
  });
  whole(t => dotG.style.opacity = (1 - 0.45 * cl((t - tStarve) / 0.5)).toFixed(3));
  const real = S.g(null, ill3);
  const realP = S.pill('real workloads', { x: 1520, y: 820, tone: 'neutral', size: 24, h: 44 }, real);
  S.circle({ x: realP.l - 24, y: 820, r: 8, fill: 'neutral', stroke: '#060a14', sw: 2 }, real);
  hide(real);
  fade(real, 0, 1, tDots + 0.3, 0.35);
  fade(real, 1, 0, tB4, 0.35);
  hide(ill3);
  fade(ill3, 0, 1, tRoof, 0.3);

  // ================================================================ b4: simplified on every count; what it still tells you
  const stamp = S.g();
  const sIn = S.g(null, stamp);
  sIn.setAttribute('transform', 'rotate(-3 960 236)');
  S.rect({ x: 290, y: 176, w: 1340, h: 120, r: 14, stroke: '#b9c1d3', sw: 5 }, sIn);
  S.rect({ x: 301, y: 187, w: 1318, h: 98, r: 9, stroke: '#b9c1d3', sw: 2 }, sIn);
  // letter-spacing trails the last letter, so the text sits half a spacing right of centre
  S.text('SIMPLIFIED', { x: 960 + 0.55 * 84 / 2, y: 240, size: 84, weight: 800, anchor: 'middle', color: '#b9c1d3', ls: 0.55 }, sIn);
  stamp.setAttribute('data-audit', 'ignore');
  // lands on 'every count'; lifts away on 'assumptions' so the three cards read cleanly for the takeaway
  K.track(stamp, [K.K(tLand, { s: 1.5, o: 0 }), K.K(tLand + 0.22, { s: 1, o: 0.92, e: 'power4.in' }), K.K(tAss, { s: 1, o: 0.92 }), K.K(tAss + 0.5, { s: 1.06, o: 0, e: 'power2.in' })], 960, 236);
  const ring = S.rect({ x: 290, y: 176, w: 1340, h: 120, r: 14, stroke: 'white', sw: 3, opacity: 0 });
  ring.setAttribute('data-audit', 'ignore');
  whole(t => {
    const k = cl((t - tLand - 0.22) / 0.5), s = 1 + 0.06 * E('power2.out')(k);
    ring.setAttribute('transform', `translate(960,236) rotate(-3) scale(${s.toFixed(4)}) translate(-960,-236)`);
    ring.setAttribute('opacity', (k > 0 && k < 1 ? 0.5 * (1 - k) : 0).toFixed(3));
  });
  const starA = S.pill('arithmetic starved', { x: 840, y: 800, tone: 'bytes', size: 24, h: 44 });
  const starB = S.pill('memory bus starved', { x: 1175, y: 560, tone: 'compute', size: 22, h: 42 });
  hide([starA, starB]);
  fade(starA, 0, 1, tStarve + 0.15, 0.35);
  fade(starB, 0, 1, tBus + 0.15, 0.35);
  const since = S.text('since 2009', { x: 1300, y: 343, size: 22, weight: 650, anchor: 'end', color: 'muted' });
  hide(since);
  fade(since, 0, 1, tSince + 0.3, 0.4);

  // ================================================================ b5: trust it where it applies
  const take = S.takeaway('trust it where it applies', { tone: 'struct' });
  hide(take);
  fade(take, 0, 1, T('b5~trust') - 0.1, 0.5);
  void cards; void EIO; void ridge;
});
