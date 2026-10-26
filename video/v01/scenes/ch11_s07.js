/* ch11_s07 · deriving the ridge (fig 126)
   Checked: 989 / 3.35 = 295.2; chart 150 px per factor of ten from (1140, 840): Y(3.35) = 761.2, Y(989) = 390.7,
   X(295.2) = 1510.6.
   b1  'bandwidth × intensity = peak', '÷ bandwidth' under both sides, → 'intensity = peak ÷ bandwidth' ('like
       500 ÷ 50'); a spec sheet: 'Peak compute 989 TFLOP/s', 'Memory bandwidth 3.35 TB/s'; a 'workload' pill
       bounces off: 'a property of the chip alone'.
   b2  the spec lines fly into '989 trillion ops/s ÷ 3.35 trillion bytes/s', the '/s' struck: 'ops per byte';
       a counter to 295: '= 295 ops per byte'; the chart's '? ops per byte' becomes 295, a dashed drop to the axis.
   b3  the regions brighten: 'memory bound', 'compute bound'; an underline under the result; 'do it for your
       chip'.
   Layout: derivation centred on x 510 (cards y 230 / 370, sheet y 540, line y 700, result y 820); chart
   x 1140-1760, y 340-840. */
V.scene('ch11_s07', S => {
  const K = ch11Kit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;

  // ================================================================ the small H100 roofline (opening state)
  const roof = ch11Roof(S, { x0: 1140, y0: 840, ppd: 150, xDec: 4, yDec: 2, yTop: 340, tickSize: 20, titles: false });
  const { X, Y } = roof, R = roof.ridge;
  S.text('trillion ops/s', { x: 1140, y: 316, size: 20, weight: 650, anchor: 'middle', color: 'compute' });
  S.text([{ t: 'ops', c: 'compute' }, { t: ' per ', c: 'ink' }, { t: 'byte', c: 'bytes' }], { x: 1450, y: 900, size: 22, weight: 700, anchor: 'middle' });
  const tC = S.path({ d: `M1140,840 V${Y(3.35)} L${R[0]},${R[1]} V840 Z`, fill: 'bytes', opacity: 0.06 });
  const tA = S.path({ d: `M${R[0]},840 V${R[1]} H1760 V840 Z`, fill: 'compute', opacity: 0.08 });
  [tC, tA].forEach(p => p.setAttribute('data-audit', 'ignore'));
  S.path({ d: roof.slantD, stroke: 'bytes', sw: 4 });
  S.path({ d: `M${R[0]},${R[1]} H1760`, stroke: 'compute', sw: 4 });
  const ridge = S.circle({ x: R[0], y: R[1], r: 9, fill: 'white', stroke: '#060a14', sw: 2 });
  const rGlow = S.circle({ x: R[0], y: R[1], r: 24, fill: 'white', opacity: 0 });
  rGlow.setAttribute('data-audit', 'ignore');
  const qBox = S.g();
  const QW = Math.round(S.measure('295 ops per byte', { size: 24, weight: 750 }) + 36), QX = R[0] - 20 - QW;   // sized to the longer label
  S.rect({ x: QX, y: R[1] - 78, w: QW, h: 46, r: 10, fill: '#0c1326', stroke: 'white', sw: 2 }, qBox);
  const qT = S.text('? ops per byte', { x: QX + QW / 2, y: R[1] - 54, size: 24, weight: 750, anchor: 'middle', color: 'ink' }, qBox);
  const aT = S.text('295 ops per byte', { x: QX + QW / 2, y: R[1] - 54, size: 24, weight: 750, anchor: 'middle', color: 'ink' }, qBox);
  hide(aT);
  void ridge;

  // ================================================================ b1: the ridge, solved for intensity
  pulse(rGlow, T('b1~ridge') - 0.15, 0.6, 0.8);
  const FS = 36, CX = 510;
  const row = (parts, y, size = FS) => {
    const ws = parts.map(([s]) => S.measure(s, { size, weight: 750 })), gap = 14, tot = ws.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
    let x = CX - tot / 2;
    return parts.map(([s, c], i) => { const e = S.text(s, { x, y, size, weight: 750, color: c }); e.cx = x + ws[i] / 2; e.w = ws[i]; x += ws[i] + gap; return e; });
  };
  const c1 = row([['bandwidth', 'bytes'], ['×', 'ink'], ['intensity', 'ink'], ['=', 'ink'], ['peak', 'compute']], 230);
  hide(c1);
  ['b1~bandwidth', 'b1~times', 'b1~intensity', 'b1~equals', 'b1~peak'].forEach((cue, i) => fade(c1[i], 0, 1, T(cue) - 0.1, 0.25));
  const tSo = T('b1~so') - 0.1;
  const divL = S.text('÷ bandwidth', { x: (c1[0].cx + c1[2].cx) / 2, y: 274, size: 22, weight: 650, anchor: 'middle', color: 'muted' });
  const divR = S.text('÷ bandwidth', { x: c1[4].cx, y: 274, size: 22, weight: 650, anchor: 'middle', color: 'muted' });
  hide([divL, divR]);
  fade([divL, divR], 0, 1, tSo, 0.3);
  const strike = S.path({ d: `M${c1[0].cx - c1[0].w / 2 - 4},230 H${c1[0].cx + c1[0].w / 2 + 4}`, stroke: 'muted', sw: 3 });
  strike.setAttribute('data-audit', 'ignore');
  K.draw(strike, 200, tSo + 0.4, 0.3);
  const down = S.path({ d: `M${CX},296 V330 M${CX - 8},320 L${CX},332 L${CX + 8},320`, stroke: 'ink', sw: 2.5 });
  down.setAttribute('data-audit', 'ignore');
  hide(down);
  fade(down, 0, 1, tSo + 0.6, 0.3);
  const c2 = row([['intensity', 'ink'], ['=', 'ink'], ['peak', 'compute'], ['÷', 'ink'], ['bandwidth', 'bytes']], 370);
  hide(c2);
  fade(c2, 0, 1, T('b1~equals#2') - 0.1, 0.35, 0.1);
  fade([...c1, divL, divR, strike], 1, 0.4, T('b1~peak#2') + 0.2, 0.4);
  const like = S.text('like 500 ÷ 50', { x: c2[4].cx + c2[4].w / 2 + 24, y: 370, size: 24, weight: 600, color: 'muted' });
  hide(like);
  const tToy = T('b1~toy') - 0.1;
  fade(like, 0, 1, tToy, 0.3);
  fade(like, 1, 0, tToy + 2.0, 0.4);
  const sheet = S.g();
  S.rect({ x: CX - 260, y: 486, w: 520, h: 120, r: 16, fill: '#0c1326', stroke: 'white', strokeOpacity: 0.22, sw: 2 }, sheet);
  const s1 = S.text([{ t: 'Peak compute  ', c: 'muted' }, { t: '989 TFLOP/s', c: 'compute' }], { x: CX - 232, y: 526, size: 30, weight: 700 }, sheet);
  const s2 = S.text([{ t: 'Memory bandwidth  ', c: 'muted' }, { t: '3.35 TB/s', c: 'bytes' }], { x: CX - 232, y: 568, size: 30, weight: 700 }, sheet);
  hide(sheet);
  const tSpec = T('b1~Two') - 0.1;
  S.add(K.drive(0.5, k => { setO(sheet, k); sheet.setAttribute('transform', `translate(${(-80 * (1 - E('power3.out')(k))).toFixed(1)},0)`); }), tSpec);
  const wl = S.pill('workload', { x: 0, y: 0, tone: 'neutral', size: 24, h: 42 });
  const tWl = T('b1~no') - 0.1;
  whole(t => {
    const k = cl((t - tWl) / 1.3), dx = k < 0.5 ? E('power2.in')(k * 2) : 1 - E('power2.out')((k - 0.5) * 2);
    wl.setAttribute('transform', `translate(${lerp(940, 820, dx).toFixed(1)},${lerp(450, 400, dx).toFixed(1)})`);
    setO(wl, t < tWl ? 0 : Math.min(1, (t - tWl) * 5) * (1 - cl((t - T('b2') + 0.2) / 0.3)));
  });
  K.ignore(wl, tWl, 1.4);
  const prop = S.text('a property of the chip alone', { x: CX, y: 428, size: 28, weight: 750, anchor: 'middle', color: 'ink' });
  hide(prop);
  fade(prop, 0, 1, T('b1~chip#2') - 0.1, 0.4);

  // ================================================================ b2: 989 ÷ 3.35 = 295
  const tB2 = T('b2') - 0.1, tFly = T('b2~nine') - 0.1;
  const l3 = row([['989 trillion ops/s', 'compute'], ['÷', 'ink'], ['3.35 trillion bytes/s', 'bytes']], 700, 30);
  hide(l3);
  // copies of the spec values fly down from the sheet into the line
  const fly = (txt, color, from, to, at) => {
    const e = S.text(txt, { x: from[0], y: from[1], size: 30, weight: 700, color, anchor: 'middle' });
    e.setAttribute('data-audit', 'ignore');
    K.track(e, [K.K(at, { x: 0, y: 0, o: 0 }), K.K(at + 0.1, { o: 1 }), K.K(at + 0.8, { x: to[0] - from[0], y: to[1] - from[1], o: 1 }), K.K(at + 1.0, { x: to[0] - from[0], y: to[1] - from[1], o: 0 })]);
    return e;
  };
  fly('989', 'compute', [CX + 120, 526], [l3[0].cx, 700], tFly);
  fly('3.35', 'bytes', [CX + 120, 568], [l3[2].cx, 700], T('b2~three') - 0.1);
  fade(l3[0], 0, 1, tFly + 0.8, 0.3);
  fade(l3[1], 0, 1, T('b2~over') - 0.1, 0.3);
  fade(l3[2], 0, 1, T('b2~three') + 0.7, 0.3);
  const sw = (e, s) => { const fw = S.measure(e.textContent, { size: 30, weight: 700 }), sw2 = S.measure(s, { size: 30, weight: 700 }); const x1 = e.cx + fw / 2 - sw2; const p = S.path({ d: `M${x1 - 2},700 H${e.cx + fw / 2 + 2}`, stroke: 'muted', sw: 3 }); p.setAttribute('data-audit', 'ignore'); return p; };
  const k1 = sw(l3[0], '/s'), k2 = sw(l3[2], '/s');
  const tSt = T('b2~trillion#2') + 0.2;
  [k1, k2].forEach(p => K.draw(p, 40, tSt, 0.25));
  const opb = S.text('ops per byte', { x: CX, y: 744, size: 24, weight: 650, anchor: 'middle', color: 'muted' });
  hide(opb);
  fade(opb, 0, 1, tSt + 0.3, 0.3);
  const tRes = T('b2~two') - 0.1;
  const res = S.g();
  S.rect({ x: CX - 210, y: 790, w: 420, h: 62, r: 14, fill: '#0c1326', stroke: 'white', sw: 2.5 }, res);
  const resT = S.text('= 0 ops per byte', { x: CX, y: 822, size: 32, weight: 800, anchor: 'middle', color: 'ink' }, res);
  hide(res);
  fade(res, 0, 1, tRes, 0.3);
  whole(t => { resT.textContent = `= ${Math.round(295 * E('power2.out')(cl((t - tRes) / 1.2)))} ops per byte`; });
  const tLast = T('b2~last') - 0.1;
  fade(qT, 1, 0, tLast, 0.2);
  fade(aT, 0, 1, tLast + 0.15, 0.25);
  const drop = S.path({ d: `M${R[0]},${R[1] + 12} V840`, stroke: 'white', sw: 2, dash: '6 6' });
  drop.setAttribute('data-audit', 'ignore');
  K.draw(drop, 460, tLast + 0.2, 0.5);
  const axT = S.text('295', { x: R[0], y: 820, size: 22, weight: 800, family: 'mono', anchor: 'middle', color: 'ink' });
  hide(axT);
  fade(axT, 0, 1, tLast + 0.6, 0.3);

  // ================================================================ b3: below, memory bound; above, compute bound
  const tB3 = T('b3') - 0.1;
  fade([sheet, prop, down], 1, 0, tB3, 0.35);
  fade([...c1, divL, divR, strike], 0.4, 0, tB3, 0.35);
  const tMB = T('b3~memory') - 0.1, tCB = T('b3~compute') - 0.1;
  S.add(gsap.fromTo(tC, { attr: { opacity: 0.06 } }, { attr: { opacity: 0.18 }, duration: 0.5, immediateRender: false }), tMB);
  S.add(gsap.fromTo(tA, { attr: { opacity: 0.08 } }, { attr: { opacity: 0.2 }, duration: 0.5, immediateRender: false }), tCB);
  const lMB = S.text('memory bound', { x: 1300, y: 760, size: 28, weight: 750, anchor: 'middle', color: 'bytes' });
  const lCB = S.text('compute bound', { x: 1640, y: 600, size: 28, weight: 750, anchor: 'middle', color: 'compute' });
  hide([lMB, lCB]);
  fade(lMB, 0, 1, tMB + 0.2, 0.35);
  fade(lCB, 0, 1, tCB + 0.2, 0.35);
  const ul = S.path({ d: `M${CX - 210},868 H${CX + 210}`, stroke: 'white', sw: 3 });
  ul.setAttribute('data-audit', 'ignore');
  K.draw(ul, 420, T('b3~characterised') - 0.1, 0.5);
  const own = S.g();
  S.icon('ph:pencil-simple-duotone', { x: CX - 150, y: 912, size: 34, color: 'ink' }, own);
  S.text('do it for your chip', { x: CX - 124, y: 912, size: 28, weight: 750, color: 'ink' }, own);
  hide(own);
  fade(own, 0, 1, T('b3~your') - 0.1, 0.4);
  void lerp; void EIO;
});
