/* ch11_s06 · the ratio, not the size (fig 125)
   Checked: chart 280 px per factor of ten, intensity 1 at x 1160, 10 ops/s at y 900. Small chip (500 ops/s,
   50 B/s): slant from (1160, 704.3) to its corner (1440, 424.3); big chip (1,000 / 100): 84.3 px higher, corner
   (1440, 340); probe at 5: x 1355.7, 250 → y 508.6, 500 → y 424.3; at 20: x 1524.3; 80 ÷ 17 = 4.71 → x 1628.
   b1  a ghost roof, its corner ringed; two toy chips: ops/s bars 500 / 1,000, bytes/s bars 50 / 100 ('× 2');
       badges 'ratio 500 ÷ 50 = 10', 'ratio 1,000 ÷ 100 = 10' flash together.
   b2  the table dims; the chart draws both rooflines (× 2 apart); the two 10s fly to the corners, one dashed
       line at x 1440 '10 ops per byte'; probes at 5 (coral dots: memory bound) and 20 (amber: compute bound).
   b3  'ratio → what work it suits' / 'size → how fast', eased apart with a rule between.
   b4  recall card 'compute × 80', 'bandwidth × 17', '80 ÷ 17 ≈ 4.7'; corner markers 10 → 47 '× 4.7'
       ('schematic').
   b5  the small chip's counters run up ×2 then ×10 with fixed bars ('bar scale × 2', '× 10'); the badge's 10
       never changes: 'scale-free'.
   Layout: table x 120-820 (rows y 300 / 500, amber bars from x 330, coral from x 600), the statements and the
   card centred under it (x 470); chart x 1160-1760, y 300-900. The ghost roof is centred while alone (-500, -120);
   the table alone is centred (+490, +170) and slides to +25 as the chart comes in at (+25, -85), the two
   columns on one centre line. */
V.scene('ch11_s06', S => {
  const K = ch11Kit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const X = i => 1160 + Math.log10(i) * 280, Y = v => 900 - Math.log10(v / 10) * 280;

  // ================================================================ b1: two toy chips
  const g0 = S.g();             // the ghost roof, alone and centred
  g0.setAttribute('transform', 'translate(-500,-120)');
  const ghost = S.path({ d: 'M1160,800 L1440,520 H1760', stroke: 'muted', strokeOpacity: 0.4, sw: 3 }, g0);
  const ring = S.circle({ x: 1440, y: 520, r: 22, fill: 'none', stroke: 'white', sw: 3, opacity: 0 }, g0);
  ring.setAttribute('data-audit', 'ignore');
  pulse(ring, T('b1~corner') - 0.2, 1, 0.8);
  fade(ghost, 1, 0, T('b1~Two') - 0.1, 0.4);
  const toy = S.text('toy numbers', { x: 120, y: 170, size: 24, weight: 600, color: 'muted' });
  const rowS = S.text('small chip', { x: 120, y: 300, size: 30, weight: 750, color: 'ink' });
  const rowB = S.text('big chip', { x: 120, y: 500, size: 30, weight: 750, color: 'ink' });
  const hOps = S.text('ops/s', { x: 330, y: 236, size: 26, weight: 700, color: 'compute' });
  const hByt = S.text('bytes/s', { x: 600, y: 236, size: 26, weight: 700, color: 'bytes' });
  hide([toy, rowS, rowB, hOps, hByt]);
  fade([toy, rowS, rowB, hOps, hByt], 0, 1, T('b1~Two'), 0.4, 0.08);
  const bar = (x, y, w, tone, val, at) => {
    const g = S.g();
    const r = S.rect({ x, y: y - 18, w: 0, h: 36, r: 6, fill: `url(#solid-${tone})` }, g);
    const t = S.text(val, { x: x + 12, y: y + 1, size: 24, weight: 750, family: 'mono', color: 'white' }, g);
    whole(tt => r.setAttribute('width', (w * EIO(cl((tt - at) / 0.5))).toFixed(1)));
    hide(t);
    fade(t, 0, 1, at + 0.35, 0.25);
    Object.assign(g, { r, t });
    return g;
  };
  const tFive = T('b1~five') - 0.1, tFifty = T('b1~fifty') - 0.1, tTwice = T('b1~twice') - 0.1;
  const sO = bar(330, 300, 110, 'compute', '500', tFive), sB = bar(600, 300, 110, 'bytes', '50', tFifty);
  const bO = bar(330, 500, 220, 'compute', '1,000', tTwice), bB = bar(600, 500, 220, 'bytes', '100', tTwice + 0.15);
  const x2 = [S.text('× 2', { x: 385, y: 430, size: 24, weight: 700, family: 'mono', anchor: 'middle', color: 'muted' }), S.text('× 2', { x: 655, y: 430, size: 24, weight: 700, family: 'mono', anchor: 'middle', color: 'muted' })];
  hide(x2);
  fade(x2, 0, 1, tTwice + 0.5, 0.3);
  // badges: the '10' is its own text so it can fly to the chart
  const badge = (y, pre) => {
    const g = S.g();
    g.bg = S.rect({ x: 330, y: y - 22, w: 490, h: 44, r: 12, fill: '#0c1326', stroke: 'white', strokeOpacity: 0.6, sw: 2 }, g);
    g.pre = S.text(pre, { x: 350, y: y + 1, size: 26, weight: 700, family: 'mono', color: 'ink' }, g);
    g.tenX = 350 + S.measure(pre, { size: 26, weight: 700, family: 'mono' });
    g.fl = S.rect({ x: 330, y: y - 22, w: 490, h: 44, r: 12, fill: 'white', opacity: 0 }, g);
    g.fl.setAttribute('data-audit', 'ignore');
    return g;
  };
  const bdgS = badge(360, 'ratio 500 ÷ 50 = '), bdgB = badge(560, 'ratio 1,000 ÷ 100 = ');
  const tens = [bdgS, bdgB].map((b, i) => S.text('10', { x: b.tenX, y: i ? 561 : 361, size: 26, weight: 800, family: 'mono', color: 'ink' }));
  hide([bdgS, bdgB, ...tens]);
  const tOv = T('b1~Operations') - 0.1;
  fade([bdgS, bdgB, ...tens], 0, 1, tOv, 0.4);
  const tTen = T('b1~ten') - 0.1;
  pulse(bdgS.fl, tTen, 0.25, 0.6);
  pulse(bdgB.fl, tTen, 0.25, 0.6);

  // ================================================================ b2: both corners at the ratio
  const tB2 = T('b2') - 0.1;
  fade([toy, hOps, hByt, ...x2], 1, 0, tB2, 0.35);
  const rows = [rowS, rowB, sO, sB, bO, bB];
  fade(rows, 1, 0.4, tB2, 0.4);
  const chart = S.g();
  const ax = S.path({ d: 'M1160,300 V900 H1760', stroke: 'white', strokeOpacity: 0.55, sw: 2.5 }, chart);
  [[1, '1'], [10, '10'], [100, '100']].forEach(([i, s]) => { S.path({ d: `M${X(i)},900 V910`, stroke: 'white', strokeOpacity: 0.55, sw: 2 }, chart); S.text(s, { x: X(i), y: 934, size: 22, weight: 600, family: 'mono', anchor: 'middle', color: 'muted' }, chart); });
  [[10, '10'], [100, '100'], [1000, '1,000']].forEach(([v, s]) => { S.path({ d: `M1150,${Y(v)} H1160`, stroke: 'white', strokeOpacity: 0.55, sw: 2 }, chart); S.text(s, { x: 1142, y: Y(v), size: 22, weight: 600, family: 'mono', anchor: 'end', color: 'muted' }, chart); });
  S.text([{ t: 'operations', c: 'compute' }, { t: ' per ', c: 'ink' }, { t: 'byte', c: 'bytes' }], { x: 1460, y: 974, size: 24, weight: 700, anchor: 'middle' }, chart);
  const yt = S.text('operations per second', { x: 1060, y: 600, size: 24, weight: 700, anchor: 'middle', color: 'compute' }, chart);
  yt.setAttribute('transform', 'rotate(-90 1060 600)');
  hide(chart);
  const tBoth = T('b2~Both') - 0.1;
  fade(chart, 0, 1, tBoth, 0.4);
  const roofG = (bw, sw, at) => {
    const g = S.g();
    const s1 = S.path({ d: `M1160,${Y(bw)} L1440,${Y(bw * 10)}`, stroke: 'bytes', sw }, g);
    const s2 = S.path({ d: `M1440,${Y(bw * 10)} H1760`, stroke: 'compute', sw }, g);
    K.draw(s1, 400, at, 0.4);
    K.draw(s2, 320, at + 0.35, 0.35);
    return g;
  };
  const small = roofG(50, 2.5, tBoth + 0.3), big = roofG(100, 5, tBoth + 0.9);
  const brk = S.g();
  S.path({ d: `M1156,${Y(100) + 2} h-8 V${Y(50) - 2} h8`, stroke: 'ink', sw: 2 }, brk);
  S.text('× 2', { x: 1138, y: (Y(50) + Y(100)) / 2, size: 22, weight: 700, family: 'mono', anchor: 'end', color: 'ink' }, brk);
  hide(brk);
  fade(brk, 0, 1, tBoth + 1.5, 0.3);
  // the two 10s fly to the corners and become one dashed vertical
  const tRat = T('b2~ratio') - 0.1;
  fade([bdgS, bdgB], 1, 0, tRat + 0.2, 0.4);
  tens.forEach((t, i) => {
    const sx = t === tens[0] ? bdgS.tenX : bdgB.tenX, sy = i ? 561 : 361, cy = (i ? Y(1000) : Y(500)) - 85;   // the chart sits 85 higher
    K.track(t, [K.K(tRat, { x: 0, y: 0 }), K.K(tRat + 0.8, { x: 1440 - sx - 14, y: cy - sy - 30, e: 'power2.inOut' })]);
    fade(t, 1, 0, tRat + 0.9, 0.3);
  });
  K.ignore(tens, tRat, 1.3);
  const vline = S.path({ d: 'M1440,300 V900', stroke: 'white', sw: 2.5, dash: '8 7' });
  vline.setAttribute('data-audit', 'ignore');
  const vTag = S.text('10 ops per byte', { x: 1452, y: 870, size: 24, weight: 700, color: 'ink' });
  const vGlow = S.path({ d: 'M1440,300 V900', stroke: 'white', sw: 10, strokeOpacity: 0.25, opacity: 0 });
  vGlow.setAttribute('data-audit', 'ignore');
  hide([vline, vTag]);
  fade([vline, vTag], 0, 1, tRat + 0.9, 0.4);
  pulse(vGlow, T('b2~same') - 0.1, 1, 0.9);
  // probes at 5 and 20
  const probe = (i, at) => { const p = S.path({ d: `M${X(i)},300 V900`, stroke: 'struct', sw: 2, dash: '5 6' }); p.setAttribute('data-audit', 'ignore'); hide(p); fade(p, 0, 1, at, 0.3); return p; };
  const dotT = (x, y, tone, s, at, anchor) => {
    const g = S.g();
    S.circle({ x, y, r: 8, fill: tone }, g);
    S.text(s, { x: anchor === 'end' ? x - 14 : x + 14, y: anchor === 'end' ? y - 20 : y + 22, size: 22, weight: 750, family: 'mono', anchor: anchor || 'start', color: tone }, g);
    hide(g); fade(g, 0, 1, at, 0.3); return g;
  };
  const t5 = T('b2~five') - 0.1, t20 = T('b2~twenty') - 0.1;
  const p5 = [probe(5, t5), dotT(X(5), Y(250), 'bytes', '250', t5 + 0.25, 'end'), dotT(X(5), Y(500), 'bytes', '500', t5 + 0.35, 'end')];
  const p20 = [probe(20, t20), dotT(X(20), Y(500), 'compute', '500', t20 + 0.25), dotT(X(20), Y(1000), 'compute', '1,000', t20 + 0.35)];

  // ================================================================ b3: two different questions
  const tB3r = T('b3~ratio') - 0.1;
  fade([...p5, ...p20, vline, vTag], 1, 0, tB3r, 0.35);
  fade([chart, small, big, brk], 1, 0.3, tB3r, 0.4);
  fade(rows, 0.4, 1, tB3r, 0.4);
  const q1 = S.text('ratio → what work it suits', { x: 470, y: 700, size: 32, weight: 750, anchor: 'middle', color: 'ink' });
  const q2 = S.text('size → how fast', { x: 470, y: 760, size: 32, weight: 750, anchor: 'middle', color: 'ink' });
  hide([q1, q2]);
  fade(q1, 0, 1, T('b3~what') - 0.1, 0.35);
  fade(q2, 0, 1, T('b3~absolute') - 0.1, 0.35);
  const tQ = T('b3~Two') - 0.1;
  K.track(q1, [K.K(tQ, { y: 0 }), K.K(tQ + 0.5, { y: -10 })]);
  K.track(q2, [K.K(tQ, { y: 0 }), K.K(tQ + 0.5, { y: 10 })]);
  const qr = S.path({ d: 'M250,730 H690', stroke: 'muted', sw: 1.5 });
  qr.setAttribute('data-audit', 'ignore');
  K.draw(qr, 440, tQ + 0.3, 0.4);

  // ================================================================ b4: the memory wall moves the corner
  const tB4 = T('b4') - 0.1;
  fade([q1, q2, qr], 1, 0, tB4, 0.35);
  fade(rows, 1, 0.3, tB4, 0.4);
  fade([chart, small, brk], 0.3, 1, tB4, 0.4);
  const tE = T('b4~eighty') - 0.1;
  const card = S.g();
  // sized to its lines and centred under the table
  const cw = Math.max(S.measure('bandwidth × 17', { size: 28, weight: 750, family: 'mono' }), S.measure('80 ÷ 17 ≈ 4.7', { size: 30, weight: 800, family: 'mono' })) + 52;
  S.rect({ x: 470 - cw / 2, y: 662, w: cw, h: 160, r: 16, fill: '#0c1326', stroke: 'white', strokeOpacity: 0.2, sw: 2 }, card);
  const c1 = S.text('compute × 80', { x: 470 - cw / 2 + 26, y: 700, size: 28, weight: 750, family: 'mono', color: 'compute' }, card);
  const c2 = S.text('bandwidth × 17', { x: 470 - cw / 2 + 26, y: 742, size: 28, weight: 750, family: 'mono', color: 'bytes' }, card);
  const c3 = S.text('80 ÷ 17 ≈ 4.7', { x: 470 - cw / 2 + 26, y: 788, size: 30, weight: 800, family: 'mono', color: 'ink' }, card);
  hide([card, c1, c2, c3]);
  fade(card, 0, 1, tE, 0.3);
  fade(c1, 0, 1, tE, 0.3);
  fade(c2, 0, 1, T('b4~bandwidth') - 0.1, 0.3);
  fade(c3, 0, 1, T('b4~seventeen') + 0.2, 0.3);
  const tPush = T('b4~pushing') - 0.1;
  const mk = S.g();
  [X(10), X(47)].forEach(x => S.path({ d: `M${x},858 V882`, stroke: 'white', sw: 3 }, mk));
  S.path({ d: `M${X(10) + 6},866 H${X(47) - 8} M${X(47) - 18},860 L${X(47) - 8},866 L${X(47) - 18},872`, stroke: 'white', sw: 2.5 }, mk);
  mk.setAttribute('data-audit', 'ignore');
  const mkT = S.text('× 4.7', { x: (X(10) + X(47)) / 2, y: 842, size: 24, weight: 750, family: 'mono', anchor: 'middle', color: 'ink' });
  const sch = S.text('schematic', { x: (X(10) + X(47)) / 2, y: 806, size: 22, weight: 600, anchor: 'middle', color: 'muted' });
  hide([mk, mkT, sch]);
  fade(mk, 0, 1, tPush, 0.35);
  fade([mkT, sch], 0, 1, tPush + 0.3, 0.35);

  // ================================================================ b5: scale-free
  const tB5 = T('b5') - 0.1;
  fade([card, c1, c2, c3, mk, mkT, sch], 1, 0, tB5, 0.35);
  fade([chart, small], 1, 0.3, tB5, 0.4);
  fade([rowS, sO, sB], 0.3, 1, tB5, 0.4);
  // the small chip's badge returns, with live numbers
  const bdg2 = S.g();
  S.rect({ x: 330, y: 338, w: 490, h: 44, r: 12, fill: '#0c1326', stroke: 'white', strokeOpacity: 0.6, sw: 2 }, bdg2);
  const bdgT = S.text('ratio 500 ÷ 50 = ', { x: 350, y: 361, size: 26, weight: 700, family: 'mono', color: 'ink' }, bdg2);
  const bdg10 = S.text('10', { x: 0, y: 361, size: 26, weight: 800, family: 'mono', color: 'ink' }, bdg2);
  hide(bdg2);
  fade(bdg2, 0, 1, tB5 + 0.2, 0.4);
  const tSF = T('b5~scalefree') - 0.1;
  const scaleT = S.text('bar scale × 2', { x: 840, y: 300, size: 24, weight: 650, color: 'muted' });
  const scaleT2 = S.text('bar scale × 10', { x: 840, y: 300, size: 24, weight: 650, color: 'muted' });
  hide([scaleT, scaleT2]);
  const step = t => (t < tSF ? 0 : t < tSF + 1.2 ? 1 : 2);
  const fmtN = v => v.toLocaleString('en-US');
  whole(t => {
    const k1 = EIO(cl((t - tSF) / 0.6)), k2 = EIO(cl((t - tSF - 1.2) / 0.6));
    const ops = Math.round(500 * (1 + k1) * (1 + 9 * k2)), byt = Math.round(50 * (1 + k1) * (1 + 9 * k2));   // 500 → 1,000 → 10,000
    if (t > tB5) { sO.t.textContent = fmtN(ops); sB.t.textContent = fmtN(byt); }
    const s = `ratio ${fmtN([500, 1000, 10000][step(t)])} ÷ ${fmtN([50, 100, 1000][step(t)])} = `;
    bdgT.textContent = s;
    bdg10.setAttribute('x', (350 + S.measure(s, { size: 26, weight: 700, family: 'mono' })).toFixed(1));
  });
  fade(scaleT, 0, 1, tSF + 0.1, 0.3);
  fade(scaleT, 1, 0, tSF + 1.1, 0.25);
  fade(scaleT2, 0, 1, tSF + 1.3, 0.3);
  const sf = S.text('scale-free', { x: 120, y: 430, size: 32, weight: 800, color: 'ink' });
  hide(sf);
  fade(sf, 0, 1, T('b5~many') - 0.1, 0.4);
  // the chart's column, and the table's: alone and centred, then left of the chart, on one centre line
  const chG = S.g(), tblG = S.g();
  [chart, small, big, brk, vline, vTag, vGlow, ...p5, ...p20, mk, mkT, sch].forEach(e => chG.appendChild(e));
  chG.setAttribute('transform', 'translate(25,-85)');
  [...S.main.children].filter(e => e !== chG && e !== tblG && e !== g0).forEach(e => tblG.appendChild(e));
  const tSl = T('b2') - 0.65;
  whole(t => { const k = EIO(cl((t - tSl) / 0.7)); tblG.setAttribute('transform', `translate(${lerp(490, 25, k).toFixed(1)},${lerp(170, 0, k).toFixed(1)})`); });
  void E; void bdgB; void setO; void ghost;
});
