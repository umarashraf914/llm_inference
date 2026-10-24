/* ch11_s03 · a scale where small things survive (fig 121)
   Checked: linear 0-10,000 over 1,500 px = 0.15 px per unit: 300 → 45 px, 30 → 4.5 px, 3 → 0.45 px, 1 → 0.15 px;
   log lane 375 px per factor of ten: 3 → 178.9 px, 30 → 553.9 px, 300 → 928.9 px; inset 100 px per decade:
   (1, 3) → (1350, 392.3), (10, 30) → (1450, 292.3), (100, 300) → (1550, 192.3).
   b1  rows '1', '3', '30', '300'; 'ordinary scale' and its axis 0 … 10,000; the 300 bar a 45 px stub, the 30 bar
       a 4.5 px hairline under a magnifier ring; '3' and '1' grey beside empty rows.
   b2  the top chart dims; the log lane draws ('log scale', ticks 1 … 10,000 every 375 px); '× 10' in every gap;
       a struck '+ 10'; markers 3, 30, 300; brackets show the two spans equal (375 px).
   b3  the top chart goes; an inset pair of log axes; a '1' marker joins and glows with '300'; three points on a
       45-degree line, '× 10 across, × 10 up'; 'straight line = multiplying'.
   Layout: rows y 200 / 260 / 320 / 380, bars from x 210, axis y 420; log lane y 700 from x 210 to 1710; inset
   origin (1350, 440). */
V.scene('ch11_s03', S => {
  const K = ch11Kit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const X0 = 210, L = 1500;

  // ================================================================ b1: the ordinary scale
  const top = S.g();
  const RY = { 1: 200, 3: 260, 30: 320, 300: 380 };
  const VALS = [[1, 'b1~one'], [3, 'b1~three'], [30, 'b1~thirty'], [300, 'b1~hundred']];
  const labs = {};
  VALS.forEach(([v, cue]) => { const e = S.text(String(v), { x: 180, y: RY[v], size: 30, weight: 750, family: 'mono', anchor: 'end', color: 'struct' }, top); labs[v] = e; hide(e); fade(e, 0, 1, T(cue) - 0.1, 0.25); });
  const tScale = T('b1~ordinary') - 0.1;
  const title = S.text('ordinary scale', { x: X0, y: 140, size: 30, weight: 700, color: 'ink' }, top);
  const axis = S.path({ d: `M${X0},420 H${X0 + L} M${X0},412 V428 M${X0 + L},412 V428`, stroke: 'white', strokeOpacity: 0.5, sw: 2 }, top);
  const a0 = S.text('0', { x: X0, y: 450, size: 24, weight: 600, family: 'mono', anchor: 'middle', color: 'muted' }, top);
  const a1 = S.text('10,000', { x: X0 + L, y: 450, size: 24, weight: 600, family: 'mono', anchor: 'middle', color: 'muted' }, top);
  hide([title, a0, a1]);
  fade(title, 0, 1, tScale, 0.35);
  K.draw(axis, 1600, tScale + 0.1, 0.6);
  fade([a0, a1], 0, 1, T('b1~ten') - 0.1, 0.35);
  const b300 = S.rect({ x: X0, y: RY[300] - 14, w: 0, h: 28, r: 3, fill: 'url(#solid-struct)' }, top);
  const b30 = S.rect({ x: X0, y: RY[30] - 14, w: 4.5, h: 28, fill: 'struct' }, top);
  hide(b30);
  const tStub = T('b1~three#3') - 0.1;
  whole(t => b300.setAttribute('width', (45 * EIO(cl((t - tStub) / 0.4))).toFixed(2)));
  const tHair = T('b1~thirty#2') - 0.1;
  fade(b30, 0, 1, tHair, 0.2);
  const ring = S.circle({ x: X0 + 2, y: RY[30], r: 26, fill: 'none', stroke: 'white', sw: 2.5 }, top);
  hide(ring);
  fade(ring, 0, 1, tHair + 0.15, 0.3);
  const tGone = T('b1~gone') - 0.3;
  // '3' and '1' turn grey beside their empty rows
  whole(t => [1, 3].forEach(v => labs[v].setAttribute('fill', S.tone(t > tGone ? 'faint' : 'struct'))));

  // ================================================================ b2: the log scale
  const tB2 = T('b2') - 0.1;
  fade(top, 1, 0.4, tB2, 0.4);
  const LY = 700, PX = v => X0 + Math.log10(v) * 375;
  const lane = S.g();
  S.text('log scale', { x: X0, y: 630, size: 30, weight: 700, color: 'ink' }, lane);
  const lAxis = S.path({ d: `M${X0},${LY} H${X0 + L}`, stroke: 'white', strokeOpacity: 0.5, sw: 2.5 }, lane);
  hide(lane);
  fade(lane, 0, 1, tB2 + 0.2, 0.4);
  K.draw(lAxis, 1500, tB2 + 0.2, 0.6);
  const ticks = [1, 10, 100, 1000, 10000].map((v, i) => {
    const g = S.g();
    S.path({ d: `M${PX(v)},${LY - 10} V${LY + 10}`, stroke: 'white', strokeOpacity: 0.6, sw: 2 }, g);
    S.text(v.toLocaleString('en-US'), { x: PX(v), y: LY + 42, size: 24, weight: 650, family: 'mono', anchor: 'middle', color: 'muted' }, g);
    hide(g);
    S.add(K.drive(0.3, k => { setO(g, k); g.setAttribute('transform', `translate(0,${(-20 * (1 - E('power2.out')(k))).toFixed(1)})`); }), tB2 + 0.5 + 0.15 * i);
    return g;
  });
  const x10 = [0, 1, 2, 3].map(i => { const e = S.text('× 10', { x: X0 + 375 * (i + 0.5), y: LY + 42, size: 24, weight: 750, family: 'mono', anchor: 'middle', color: 'ink' }); hide(e); return e; });
  fade(x10, 0, 1, T('b2~ten') - 0.1, 0.3, 0.08);
  const ghost = S.g();
  S.text('+ 10', { x: X0 + 187, y: 610, size: 26, weight: 650, family: 'mono', anchor: 'middle', color: 'muted' }, ghost);
  const gx = S.path({ d: `M${X0 + 150},610 H${X0 + 224}`, stroke: 'muted', sw: 3 }, ghost);
  gx.setAttribute('data-audit', 'ignore');
  hide(ghost);
  const tNot = T('b2~not') - 0.1;
  fade(ghost, 0, 1, tNot, 0.25);
  K.draw(gx, 80, tNot + 0.35, 0.25);
  fade(ghost, 1, 0, tNot + 1.2, 0.35);
  const marker = (v, at) => {
    const g = S.g();
    S.circle({ x: PX(v), y: LY, r: 11, fill: 'url(#solid-struct)', stroke: 'white', strokeOpacity: 0.7, sw: 1.5 }, g);
    S.text(String(v), { x: PX(v), y: LY - 34, size: 28, weight: 750, family: 'mono', anchor: 'middle', color: 'struct' }, g);
    hide(g);
    S.add(K.drive(0.35, k => { setO(g, k); g.setAttribute('transform', `translate(0,${(-40 * (1 - E('bounce.out')(k))).toFixed(1)})`); }), at);
    return g;
  };
  const tM = T('b2~So') + 0.05;
  const m3 = marker(3, tM), m30 = marker(30, tM + 0.4), m300 = marker(300, tM + 0.8);
  const br = S.g();
  [[3, 30], [30, 300]].forEach(([a, b]) => { S.path({ d: `M${PX(a) + 3},588 v-10 H${PX(b) - 3} v10`, stroke: 'white', sw: 2.5 }, br); S.text('375 px', { x: (PX(a) + PX(b)) / 2, y: 560, size: 22, weight: 650, family: 'mono', anchor: 'middle', color: 'ink' }, br); });
  hide(br);
  fade(br, 0, 1, T('b2~evenly') - 0.1, 0.4);

  // ================================================================ b3: both axes ahead; a straight line multiplies
  const tB3 = T('b3') - 0.1;
  fade(top, 0.4, 0, tB3, 0.4);
  fade(x10, 1, 0, tB3, 0.3);
  fade(br, 1, 0, tB3, 0.3);
  const ins = S.g();
  const O = [1350, 440], D = 100;
  const axX = S.path({ d: `M${O[0]},${O[1]} H${O[0] + 3 * D}`, stroke: 'white', strokeOpacity: 0.6, sw: 2 }, ins);
  const axY = S.path({ d: `M${O[0]},${O[1]} V${O[1] - 3 * D}`, stroke: 'white', strokeOpacity: 0.6, sw: 2 }, ins);
  const tl = S.g(null, ins);
  ['1', '10', '100', '1,000'].forEach((s, i) => {
    S.text(s, { x: O[0] + i * D, y: O[1] + 22, size: 20, weight: 600, family: 'mono', anchor: 'middle', color: 'muted' }, tl);
    S.text(s, { x: O[0] - 12, y: O[1] - i * D, size: 20, weight: 600, family: 'mono', anchor: 'end', color: 'muted' }, tl);
  });
  const tAx = T('b3~Both') - 0.1;
  K.draw(axX, 300, tAx, 0.5);
  K.draw(axY, 300, tAx + 0.2, 0.5);
  hide(tl);
  fade(tl, 0, 1, tAx + 0.5, 0.4);
  const m1 = marker(1, T('b3~one') - 0.15);
  const glow = [1, 300].map(v => { const c = S.circle({ x: PX(v), y: LY, r: 26, fill: 'url(#pglow-struct)', opacity: 0 }); c.setAttribute('data-audit', 'ignore'); return c; });
  glow.forEach(c => pulse(c, T('b3~together') - 0.4, 1, 1.0));
  const tLine = T('b3~straight') - 0.1;
  const pts = [[1350, 392.3], [1450, 292.3], [1550, 192.3]];
  const dots = pts.map(([x, y], i) => { const c = S.circle({ x, y, r: 8, fill: 'url(#solid-struct)' }, ins); hide(c); fade(c, 0, 1, tLine + 0.15 * i, 0.2); return c; });
  const line = S.path({ d: `M${1350 - 20},${392.3 + 20} L${1570},${192.3 - 20}`, stroke: 'struct', sw: 3.5 }, ins);
  line.setAttribute('data-audit', 'ignore');
  K.draw(line, 360, tLine + 0.5, 0.5);
  const steps = S.g(null, ins);
  S.path({ d: 'M1352,404 H1448 M1440,398 L1448,404 L1440,410', stroke: 'ink', sw: 2 }, steps);
  S.path({ d: 'M1462,390 V296 M1456,304 L1462,296 L1468,304', stroke: 'ink', sw: 2 }, steps);
  steps.setAttribute('data-audit', 'ignore');
  const stepT = S.text('× 10 across, × 10 up', { x: 1478, y: 360, size: 22, weight: 650, color: 'ink' }, ins);
  hide([steps, stepT]);
  fade([steps, stepT], 0, 1, tLine + 1.0, 0.35);
  const mult = S.text('straight line = multiplying', { x: 1500, y: 494, size: 28, weight: 750, anchor: 'middle', color: 'ink' });
  hide(mult);
  fade(mult, 0, 1, T('b3~multiplying') - 0.1, 0.4);
  void m3; void m30; void m300; void m1; void dots; void ticks;
});
