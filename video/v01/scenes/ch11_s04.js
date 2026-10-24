/* ch11_s04 · a point, then two ceilings (figs 122, 123)
   Checked: Y(v) = 900 − 250·log10 v: 3.35 → 768.7, 33.5 → 518.7, 335 → 268.7, 989 → 151.2; the slant meets the
   flat at intensity 989 / 3.35 = 295.2 → X = 320 + 250·log10 295.2 = 937.6.
   b1  plain axes, ticks 0-6, 'x' and 'y'; a point at (987, 525) 'one point: one x, one y'; dashed guides to the
       '4' and '3' ticks; the end labels become 'operations per byte' and 'operations per second'.
   b2  the point slides right and back ('position: the workload'); a dashed vertical rises to a grey bar
       ('ceiling: the chip'); all of it fades, leaving the titled axes.
   b3  the ticks morph to log (1 … 10,000 across, 1 … 100 up), titles gain '(log)'; 'H100'; the amber flat
       ceiling at y 151, 'peak arithmetic' / '989 trillion/s'; small amber arrows rise and stop at it.
   b4  'bandwidth: 3.35 trillion bytes/s'; coral dots at 3.35, 33.5, 335 with '× 10 across, × 10 up'.
   b5  'bytes/s × ops/byte = ops/s' (bytes struck); the coral slant through the dots to the corner (938, 151);
       'bandwidth × intensity' along it; a ghost slant lifts 80 px and settles back.
   Layout: axes x 320-1320 along y 900, up x 320 to y 150; sidebar x 1400-1820 (header y 180, line y 270). */
V.scene('ch11_s04', S => {
  const K = ch11Kit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const roof = ch11Roof(S, {});
  const { X, Y } = roof;
  hide([roof.xTicks, roof.yTicks, roof.xTitle, roof.yTitle]);
  K.draw(roof.axes, 1800, 0.4, 0.8);

  // ================================================================ b1: a point is a pair
  const plain = S.g();
  const PX = i => 320 + i * 1000 / 6, PY = i => 900 - i * 125;
  const px = [], py = [];
  for (let i = 0; i <= 6; i++) {
    px.push(S.text(String(i), { x: PX(i), y: 932, size: 24, weight: 600, family: 'mono', anchor: 'middle', color: 'muted' }, plain));
    py.push(S.text(String(i), { x: 302, y: PY(i), size: 24, weight: 600, family: 'mono', anchor: 'end', color: 'muted' }, plain));
    S.path({ d: `M${PX(i)},900 V910 M310,${PY(i)} H320`, stroke: 'white', strokeOpacity: 0.55, sw: 2 }, plain);
  }
  const xEnd = S.text('x', { x: 1346, y: 900, size: 28, weight: 700, color: 'ink' }, plain);
  const yEnd = S.text('y', { x: 320, y: 126, size: 28, weight: 700, anchor: 'middle', color: 'ink' }, plain);
  hide(plain);
  fade(plain, 0, 1, 0.8, 0.5);
  const P = [987, 525];
  const pt = S.circle({ x: P[0], y: P[1], r: 11, fill: 'url(#solid-struct)', stroke: 'white', strokeOpacity: 0.7, sw: 1.5 });
  const ptL = S.text('one point: one x, one y', { x: P[0] + 24, y: P[1] - 28, size: 26, weight: 650, color: 'ink' });
  hide([pt, ptL]);
  const tPair = T('b1~pair') - 0.1;
  S.add(K.drive(0.35, k => { setO(pt, k); pt.setAttribute('r', (11 * E('back.out(2.5)')(k)).toFixed(2)); }), tPair);
  fade(ptL, 0, 1, tPair + 0.2, 0.3);
  const gDown = S.path({ d: `M${P[0]},${P[1]} V900`, stroke: 'white', strokeOpacity: 0.7, sw: 2, dash: '6 6' });
  const gLeft = S.path({ d: `M${P[0]},${P[1]} H320`, stroke: 'white', strokeOpacity: 0.7, sw: 2, dash: '6 6' });
  [gDown, gLeft].forEach(g => { g.setAttribute('data-audit', 'ignore'); hide(g); });
  const tDown = T('b1~Down') - 0.1, tAcross = T('b1~Across') - 0.1;
  fade(gDown, 0, 1, tDown, 0.4);
  fade(gLeft, 0, 1, tAcross, 0.4);
  whole(t => { px[4].setAttribute('fill', S.tone(t > tDown + 0.3 ? 'ink' : 'muted')); py[3].setAttribute('fill', S.tone(t > tAcross + 0.3 ? 'ink' : 'muted')); });
  const xT = S.text('operations per byte', { x: 820, y: 974, size: 26, weight: 700, anchor: 'middle', color: 'ink' });
  const yT = S.text('operations per second', { x: 224, y: 525, size: 26, weight: 700, anchor: 'middle', color: 'compute' });
  yT.setAttribute('transform', 'rotate(-90 224 525)');
  hide([xT, yT]);
  const tInt = T('b1~intensity') - 0.1, tFast = T('b1~how') - 0.1;
  fade(xEnd, 1, 0, tInt, 0.3);
  fade(xT, 0, 1, tInt + 0.2, 0.35);
  fade(yEnd, 1, 0, tFast, 0.3);
  fade(yT, 0, 1, tFast + 0.2, 0.35);

  // ================================================================ b2: position from the workload, ceiling from the chip
  const tB2 = T('b2') - 0.1;
  fade([gDown, gLeft, ptL], 1, 0, tB2, 0.3);
  const hLine = S.path({ d: `M560,${P[1]} H1300`, stroke: 'struct', strokeOpacity: 0.7, sw: 2, dash: '6 6' });
  hLine.setAttribute('data-audit', 'ignore');
  hide(hLine);
  const tLR = T('b2~leftright') - 0.1;
  fade(hLine, 0, 1, tLR - 0.1, 0.3);
  const posT = S.pill('position: the workload', { x: 0, y: 0, tone: 'struct', size: 22, h: 40 });
  hide(posT);
  fade(posT, 0, 1, tLR, 0.3);
  const slide = t => { const k = cl((t - tLR) / 1.4); return 160 * Math.sin(Math.PI * 2 * k) * (k > 0 && k < 1 ? 1 : 0); };
  whole(t => { const dx = slide(t); pt.setAttribute('transform', `translate(${dx.toFixed(1)},0)`); posT.setAttribute('transform', `translate(${(P[0] + dx).toFixed(1)},${P[1] - 44})`); });
  const vLine = S.path({ d: `M${P[0]},${P[1]} V214`, stroke: 'white', strokeOpacity: 0.6, sw: 2, dash: '6 6' });
  vLine.setAttribute('data-audit', 'ignore');
  const cBar = S.path({ d: `M${P[0] - 50},204 H${P[0] + 50}`, stroke: 'muted', sw: 6 });
  const cT = S.text('ceiling: the chip', { x: P[0] + 66, y: 204, size: 24, weight: 650, color: 'muted' });
  const tCe = T('b2~ceiling') - 0.1;
  K.draw(vLine, 320, tCe, 0.5);
  hide([cBar, cT]);
  fade(cBar, 0, 1, tCe + 0.4, 0.25);
  fade(cT, 0, 1, tCe + 0.5, 0.3);
  fade([hLine, posT], 1, 0, tCe - 0.1, 0.3);
  const tTrust = T('b2~not') - 0.1;
  fade([pt, vLine, cBar, cT], 1, 0, tTrust, 0.4);

  // ================================================================ b3: logarithmic axes; the flat ceiling
  const tLog = T('b3~logarithmic') - 0.1;
  // the plain ticks slide toward their log neighbours and fade; the log ticks fade in
  whole(t => { const k = EIO(cl((t - tLog) / 0.8)); plain.setAttribute('transform', `translate(0,${(10 * k).toFixed(1)})`); });
  fade(plain, 1, 0, tLog, 0.5);
  fade([xT, yT], 1, 0, tLog, 0.4);
  fade([roof.xTicks, roof.yTicks], 0, 1, tLog + 0.3, 0.5);
  fade([roof.xTitle, roof.yTitle], 0, 1, tLog + 0.5, 0.5);
  const side = S.text('H100', { x: 1420, y: 180, size: 40, weight: 800, family: 'display', color: 'ink' });
  hide(side);
  fade(side, 0, 1, T('b3~H') - 0.1, 0.4);
  const flat = S.path({ d: roof.flatD, stroke: 'compute', sw: 5 });
  K.draw(flat, 1010, T('b3~flat') - 0.1, 0.8);
  const fTag = S.g();
  S.text('peak arithmetic', { x: 1310, y: 190, size: 24, weight: 700, anchor: 'end', color: 'compute' }, fTag);
  S.text('989 trillion/s', { x: 1310, y: 225, size: 24, weight: 700, family: 'mono', anchor: 'end', color: 'compute' }, fTag);
  hide(fTag);
  fade(fTag, 0, 1, T('b3~nine') - 0.1, 0.4);
  const arrows = S.g();
  arrows.setAttribute('data-audit', 'ignore');
  const AX = [420, 580, 740, 900, 1060];
  const arr = AX.map(x => { const g = S.g(null, arrows); S.path({ d: 'M0,0 V-40 M-8,-30 L0,-40 L8,-30', stroke: 'compute', sw: 3 }, g); return g; });
  const tAr = T('b3~however') - 0.1;
  whole(t => arr.forEach((a, i) => {
    const k = cl((t - tAr - 0.08 * i) / 0.7), y = lerp(880, roof.Y(989) + 46, E('power2.in')(k));
    a.setAttribute('transform', `translate(${AX[i]},${y.toFixed(1)})`);
    setO(a, k <= 0 ? 0 : 1 - cl((t - T('b4') + 0.1) / 0.3));
  }));

  // ================================================================ b4: the slanted ceiling, point by point
  const bwL = S.text('bandwidth: 3.35 trillion bytes/s', { x: 1420, y: 270, size: 26, weight: 700, color: 'bytes' });
  hide(bwL);
  fade(bwL, 0, 1, T('b4~bandwidth') - 0.1, 0.35);
  const DOTS = [[1, 3.35, '3.35'], [10, 33.5, '33.5'], [100, 335, '335']];
  const tFeed = T('b4~feed') - 0.1, tTen = T('b4~ten#2') - 0.1;
  const dots = DOTS.map(([i, v, s], n) => {
    const g = S.g();
    S.circle({ x: X(i), y: Y(v), r: 9, fill: 'bytes' }, g);
    const tg = n === 0 ? S.text(s, { x: X(i) + 18, y: Y(v) + 26, size: 24, weight: 700, family: 'mono', color: 'bytes' }, g)
      : S.text(s, { x: X(i) - 16, y: Y(v) - 22, size: 24, weight: 700, family: 'mono', anchor: 'end', color: 'bytes' }, g);
    hide(g);
    fade(g, 0, 1, n === 0 ? tFeed : tTen + 0.35 * (n - 1), 0.3);
    g.tag = tg;
    return g;
  });
  const steps = S.g();
  S.path({ d: `M${X(1) + 12},${Y(3.35) + 40} H${X(10)} M${X(10) - 10},${Y(3.35) + 34} L${X(10)},${Y(3.35) + 40} L${X(10) - 10},${Y(3.35) + 46}`, stroke: 'ink', sw: 2 }, steps);
  S.path({ d: `M${X(10) + 40},${Y(3.35) + 30} V${Y(33.5)} M${X(10) + 34},${Y(33.5) + 10} L${X(10) + 40},${Y(33.5)} L${X(10) + 46},${Y(33.5) + 10}`, stroke: 'ink', sw: 2 }, steps);
  steps.setAttribute('data-audit', 'ignore');
  const stepT = S.text('× 10 across, × 10 up', { x: X(10) + 58, y: Y(10), size: 24, weight: 650, color: 'ink' });
  hide([steps, stepT]);
  fade([steps, stepT], 0, 1, tTen + 0.5, 0.35);

  // ================================================================ b5: a multiplication is a straight line
  const tMul = T('b5~multiplication') - 0.1;
  fade(bwL, 1, 0, tMul, 0.3);
  const ueq = S.g();
  const US = 26, parts = ['bytes/s × ops/', 'byte', ' = ops/s'];
  S.text([{ t: 'bytes', c: 'bytes' }, { t: '/s × ops/', c: 'ink' }, { t: 'byte', c: 'bytes' }, { t: ' = ops/s', c: 'compute' }], { x: 1420, y: 270, size: US, weight: 700, family: 'mono' }, ueq);
  const w = s => S.measure(s, { size: US, weight: 700, family: 'mono' });
  const s1 = S.path({ d: `M1416,270 H${1424 + w('bytes')}`, stroke: 'muted', sw: 3 }, ueq);
  const x2 = 1420 + w(parts[0]);
  const s2 = S.path({ d: `M${x2 - 4},270 H${x2 + w('byte') + 4}`, stroke: 'muted', sw: 3 }, ueq);
  [s1, s2].forEach(p => { p.setAttribute('data-audit', 'ignore'); K.draw(p, 120, tMul + 0.6, 0.3); });
  hide(ueq);
  fade(ueq, 0, 1, tMul + 0.2, 0.35);
  const tLine = T('b5~straight') - 0.1;
  const slant = S.path({ d: roof.slantD, stroke: 'bytes', sw: 5 });
  K.draw(slant, 900, tLine, 0.8);
  fade([...dots.map(d => d.tag), steps, stepT, ueq], 1, 0, tLine + 0.6, 0.35);
  // parallel to the slant, 50 px above it; its axis-aligned box necessarily takes in the line, so the audit skips it
  const sl = S.text('bandwidth × intensity', { x: 548, y: 458, size: 28, weight: 750, anchor: 'middle', color: 'bytes' });
  sl.setAttribute('transform', 'rotate(-45 548 458)');
  sl.setAttribute('data-audit', 'ignore');
  hide(sl);
  fade(sl, 0, 1, tLine + 0.8, 0.4);
  const ghost = S.path({ d: roof.slantD, stroke: 'bytes', sw: 4, strokeOpacity: 0.45, dash: '10 8' });
  ghost.setAttribute('data-audit', 'ignore');
  const tLift = T('b5~Faster') - 0.1;
  whole(t => {
    const up = EIO(cl((t - tLift) / 0.6)) * (1 - EIO(cl((t - tLift - 1.4) / 0.6)));
    ghost.setAttribute('transform', `translate(0,${(-80 * up).toFixed(1)})`);
    setO(ghost, cl((t - tLift) / 0.2) * (1 - cl((t - tLift - 1.9) / 0.3)));
  });
  void pulse;
});
