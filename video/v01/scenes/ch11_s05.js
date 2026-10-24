/* ch11_s05 · the lower ceiling wins (figs 123, 124)
   Same chart and coordinates as ch11_s04. Checked: at intensity 10 the slant is 33.5 (y 518.7); at 1,000 it is
   3,350 (y 19, far above the clip at 110) while the flat is 989 (y 151.2); the dashed extension leaves the clip
   at x 937.6 + (151.2 − 110) = 978.8.
   b1  both ceilings stop a pushing arrow; the sidebar builds 'attainable =' / 'min(peak,' / 'bandwidth ×
       intensity)'; each line pulses as it is named.
   b2  probes: at 10 the slant (33.5) is lower; at 1,000 the flat (989) is, the slant's 3,350 far off the chart.
   b3  the slant extends dashed past the corner; a white tracer runs along whichever line is lower; the roof
       brightens, the rest dims; it pulses on 'the lower one always wins'.
   b4  'memory bound' (coral tint) and 'compute bound' (amber tint); a workload dot climbs the slant, its readout
       rising to 989, then slides along the flat ('100%'); pushed further right it stays at 989.
   b5  the ridge marker at (938, 151) with a dashed drop; the roof glows; 'the roofline · H100'; the credit
       'Williams, Waterman,' / 'Patterson · 2009'; the rule returns.
   Layout: as ch11_s04; sidebar x 1400-1820 (header y 180, lines y 270 / 310 / 350). */
V.scene('ch11_s05', S => {
  const K = ch11Kit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const roof = ch11Roof(S, {});
  const { X, Y } = roof, R = roof.ridge, YF = Y(989);

  // ================================================================ the opening state (as ch11_s04 left it)
  const tints = S.g();
  const tC = S.path({ d: `M320,900 V${Y(3.35)} L${R[0]},${R[1]} V900 Z`, fill: 'bytes', opacity: 0 }, tints);
  const tA = S.path({ d: `M${R[0]},900 V${R[1]} H1320 V900 Z`, fill: 'compute', opacity: 0 }, tints);
  tints.setAttribute('data-audit', 'ignore');
  const flatL = S.path({ d: `M320,${YF} H${R[0]}`, stroke: 'compute', sw: 5 });
  const flatR = S.path({ d: `M${R[0]},${YF} H1320`, stroke: 'compute', sw: 5 });
  const slant = S.path({ d: roof.slantD, stroke: 'bytes', sw: 5 });
  const fTag = S.g();
  S.text('peak arithmetic', { x: 1310, y: 190, size: 24, weight: 700, anchor: 'end', color: 'compute' }, fTag);
  S.text('989 trillion/s', { x: 1310, y: 225, size: 24, weight: 700, family: 'mono', anchor: 'end', color: 'compute' }, fTag);
  const sl = S.text('bandwidth × intensity', { x: 548, y: 458, size: 28, weight: 750, anchor: 'middle', color: 'bytes' });
  sl.setAttribute('transform', 'rotate(-45 548 458)');
  sl.setAttribute('data-audit', 'ignore');
  const head = S.text('H100', { x: 1420, y: 180, size: 40, weight: 800, family: 'display', color: 'ink' });
  const head2 = S.text('the roofline · H100', { x: 1420, y: 180, size: 40, weight: 800, family: 'display', color: 'ink' });
  hide(head2);

  // ================================================================ b1: no workload passes either ceiling
  const tNo = T('b1~workload') - 0.1;
  fade([fTag, sl], 1, 0.4, tNo, 0.4);
  const push = (x, y0, y1, at) => {
    const g = S.g();
    S.path({ d: 'M0,0 V-36 M-8,-26 L0,-36 L8,-26', stroke: 'ink', sw: 3 }, g);
    g.setAttribute('data-audit', 'ignore');
    whole(t => { const k = cl((t - at) / 0.7); g.setAttribute('transform', `translate(${x},${lerp(y0, y1, E('power2.in')(k)).toFixed(1)})`); setO(g, k <= 0 ? 0 : 1 - cl((t - T('b2') + 0.1) / 0.3)); });
  };
  push(1010, 420, YF + 44, tNo + 0.3);
  push(500, 820, Y(3.35 * 10 ** (180 / 250)) + 44, tNo + 0.45);
  const rule = S.g();
  const r1 = S.text('attainable =', { x: 1420, y: 270, size: 30, weight: 750, color: 'ink' }, rule);
  const r2a = S.text('min(', { x: 1420, y: 310, size: 30, weight: 750, family: 'mono', color: 'ink' }, rule);
  const r2b = S.text('peak,', { x: 1420 + S.measure('min(', { size: 30, weight: 750, family: 'mono' }), y: 310, size: 30, weight: 750, family: 'mono', color: 'compute' }, rule);
  const r3a = S.text('bandwidth × intensity', { x: 1452, y: 350, size: 28, weight: 750, color: 'bytes' }, rule);
  const r3b = S.text(')', { x: 1452 + S.measure('bandwidth × intensity', { size: 28, weight: 750 }) + 6, y: 350, size: 30, weight: 750, family: 'mono', color: 'ink' }, rule);
  hide([r1, r2a, r2b, r3a, r3b]);
  const tAtt = T('b1~attainable') - 0.1;
  fade(r1, 0, 1, tAtt, 0.05);
  whole(t => { const n = Math.round(12 * cl((t - tAtt) / 0.5)); r1.textContent = 'attainable ='.slice(0, Math.max(1, n)); });
  fade(r2a, 0, 1, T('b1~minimum') - 0.1, 0.3);
  const tPk = T('b1~peak') - 0.1, tBw = T('b1~bandwidth') - 0.1;
  fade(r2b, 0, 1, tPk, 0.3);
  fade([r3a, r3b], 0, 1, tBw, 0.3, 0.3);
  const glowLine = (d, tone, at) => { const p = S.path({ d, stroke: tone, sw: 14, strokeOpacity: 0.35, opacity: 0 }); p.setAttribute('data-audit', 'ignore'); pulse(p, at, 1, 0.8); return p; };
  glowLine(roof.flatD, 'compute', tPk + 0.1);
  glowLine(roof.slantD, 'bytes', tBw + 0.2);

  // ================================================================ b2: two probes
  const tB2 = T('b2') - 0.1;
  const probe = (x, at, until) => {
    const g = S.g();
    const p = S.path({ d: `M${x},110 V900`, stroke: 'white', strokeOpacity: 0.7, sw: 2, dash: '6 6' }, g);
    p.setAttribute('data-audit', 'ignore');
    hide(g);
    fade(g, 0, 1, at, 0.3);
    fade(g, 1, 0, until, 0.3);
    return g;
  };
  const t10 = T('b2~ten') - 0.1, t33 = T('b2~thirtythree') - 0.1, t1k = T('b2~thousand') - 0.2, tPeak = T('b2~peak') - 0.1;
  probe(570, t10, t1k);
  const tag33 = S.text('33.5', { x: 586, y: Y(33.5) + 26, size: 26, weight: 750, family: 'mono', color: 'bytes' });
  const tag989a = S.text('989', { x: 586, y: YF + 26, size: 26, weight: 750, family: 'mono', color: 'compute' });
  hide([tag33, tag989a]);
  fade([tag33, tag989a], 0, 1, t10 + 0.3, 0.3);
  fade(tag989a, 1, 0.35, t33, 0.3);
  const g33 = S.rect({ x: 578, y: Y(33.5) + 8, w: 76, h: 36, r: 8, fill: 'bytes', opacity: 0 });
  g33.setAttribute('data-audit', 'ignore');
  pulse(g33, t33, 0.3, 0.8);
  const dotA = S.circle({ x: 570, y: Y(33.5), r: 9, fill: 'white' });
  hide(dotA);
  fade(dotA, 0, 1, t33 + 0.3, 0.3);
  fade([tag33, dotA], 1, 0, t1k, 0.3);
  fade(tag989a, 0.35, 0, t1k, 0.3);
  probe(1070, t1k + 0.2, T('b3') - 0.1);
  const tag989b = S.text('989', { x: 1030, y: 185, size: 26, weight: 750, family: 'mono', anchor: 'end', color: 'compute' });
  const up = S.path({ d: 'M1060,124 L1070,110 L1080,124', stroke: 'white', sw: 2.5 });
  const tag3350 = S.text('3,350', { x: 1110, y: 130, size: 26, weight: 750, family: 'mono', color: 'bytes' });
  hide([tag989b, up, tag3350]);
  fade([tag989b, up, tag3350], 0, 1, t1k + 0.5, 0.3, 0.1);
  const g989 = S.rect({ x: 960, y: 167, w: 76, h: 36, r: 8, fill: 'compute', opacity: 0 });
  g989.setAttribute('data-audit', 'ignore');
  pulse(g989, tPeak, 0.3, 0.8);
  const dotB = S.circle({ x: 1070, y: YF, r: 9, fill: 'white' });
  hide(dotB);
  fade(dotB, 0, 1, tPeak + 0.2, 0.3);

  // ================================================================ b3: keep the lower line: a roof
  const tB3 = T('b3') - 0.1;
  fade([tag989b, up, tag3350, dotB], 1, 0, tB3, 0.3);
  fade(rule, 1, 0, tB3, 0.35);
  fade([fTag, sl], 0.4, 0, tB3, 0.35);
  const ext = S.path({ d: `M${R[0]},${R[1]} L${R[0] + (R[1] - 110)},110`, stroke: 'bytes', sw: 4, dash: '10 8' });
  const extHead = S.path({ d: `M${R[0] + 41 - 14},112 L${R[0] + 41},110 L${R[0] + 41 - 2},124`, stroke: 'bytes', sw: 3 });
  ext.setAttribute('data-audit', 'ignore');
  hide([ext, extHead]);
  const tKeep = T('b3~Keep') - 0.1;
  fade([ext, extHead], 0, 1, tKeep, 0.35);
  const roofD = `M320,${Y(3.35).toFixed(1)} L${R[0].toFixed(1)},${R[1].toFixed(1)} H1320`;
  const tracer = S.path({ d: roofD, stroke: 'white', sw: 3 });
  tracer.setAttribute('data-audit', 'ignore');
  const tTr = tKeep + 0.6;
  K.draw(tracer, 1300, tTr, 1.6);
  fade(tracer, 1, 0, tTr + 1.9, 0.5);
  fade([flatL, ext, extHead], 1, 0.25, tTr + 1.7, 0.5);
  const roofHi = S.path({ d: roofD, stroke: 'white', sw: 9, strokeOpacity: 0.18, opacity: 0 });
  roofHi.setAttribute('data-audit', 'ignore');
  pulse(roofHi, T('b3~lower#2') - 0.1, 1, 0.9);

  // ================================================================ b4: memory bound, compute bound
  const tMB = T('b4~memory') - 0.1, tCB = T('b4~compute') - 0.1;
  S.add(gsap.fromTo(tC, { attr: { opacity: 0 } }, { attr: { opacity: 0.1 }, duration: 0.5, immediateRender: false }), tMB);
  S.add(gsap.fromTo(tA, { attr: { opacity: 0 } }, { attr: { opacity: 0.14 }, duration: 0.5, immediateRender: false }), tCB);
  const lMB = S.text('memory bound', { x: 640, y: 800, size: 32, weight: 750, anchor: 'middle', color: 'bytes' });
  const lCB = S.text('compute bound', { x: 1130, y: 800, size: 32, weight: 750, anchor: 'middle', color: 'compute' });
  hide([lMB, lCB]);
  fade(lMB, 0, 1, tMB + 0.2, 0.35);
  fade(lCB, 0, 1, tCB + 0.2, 0.35);
  // the workload dot: up the slant (intensity 1 → 295), then along the flat to 1,200 and, pushed, to 1,320
  const tUp = T('b4~more') - 0.1, tSpd = T('b4~speed') - 0.1, tFull = T('b4~already') - 0.1, tPush = T('b4~improving') - 0.1;
  const dot = S.circle({ x: 0, y: 0, r: 11, fill: 'white' });
  const read = S.text('3.35', { x: 0, y: 0, size: 26, weight: 750, family: 'mono', color: 'ink' });
  const fmt = v => (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : v.toFixed(0));
  whole(t => {
    let x;
    if (t < tSpd + 0.3) x = lerp(320, R[0], EIO(cl((t - tUp) / (tSpd + 0.3 - tUp))));
    else if (t < tPush) x = lerp(R[0], 1200, EIO(cl((t - tCB) / 0.8)));
    else x = lerp(1200, 1320, EIO(cl((t - tPush - 0.2) / 0.7)));
    const i = 10 ** ((x - 320) / 250), v = Math.min(989, 3.35 * i), y = Y(v);
    dot.setAttribute('cx', x.toFixed(1)); dot.setAttribute('cy', y.toFixed(1));
    read.setAttribute('x', (x + 20).toFixed(1)); read.setAttribute('y', (y + (x < R[0] - 4 ? 30 : 34)).toFixed(1));
    read.textContent = fmt(v);
  });
  hide([dot, read]);
  fade([dot, read], 0, 1, tUp - 0.2, 0.3);
  const gauge = S.g();
  S.icon('ph:gauge-duotone', { x: 1172, y: 236, size: 36, color: 'compute' }, gauge);
  S.text('100%', { x: 1194, y: 236, size: 24, weight: 750, family: 'mono', color: 'compute' }, gauge);
  hide(gauge);
  fade(gauge, 0, 1, tFull, 0.35);
  const pushA = S.g();
  S.path({ d: 'M1090,196 H1170 M1160,188 L1172,196 L1160,204', stroke: 'muted', sw: 3 }, pushA);
  pushA.setAttribute('data-audit', 'ignore');
  whole(t => { const k = EIO(cl((t - tPush) / 0.9)); pushA.setAttribute('transform', `translate(${(120 * k).toFixed(1)},0)`); });
  hide(pushA);
  fade(pushA, 0, 1, tPush, 0.25);

  // ================================================================ b5: the ridge; the roofline
  const tB5 = T('b5') - 0.1;
  fade([dot, read, gauge, pushA, lMB, lCB], 1, 0, tB5, 0.35);
  const tRidge = T('b5~ridge') - 0.15;
  const ridge = S.circle({ x: R[0], y: R[1], r: 10, fill: 'white', stroke: '#060a14', sw: 2 });
  const rDrop = S.path({ d: `M${R[0]},${R[1] + 12} V900`, stroke: 'white', strokeOpacity: 0.7, sw: 2, dash: '6 6' });
  rDrop.setAttribute('data-audit', 'ignore');
  const rL = S.text('the ridge', { x: 990, y: 195, size: 28, weight: 750, color: 'ink' });
  hide([ridge, rL]);
  S.add(K.drive(0.35, k => { setO(ridge, k); ridge.setAttribute('r', (10 * E('back.out(2.5)')(k)).toFixed(2)); }), tRidge);
  K.draw(rDrop, 760, tRidge + 0.2, 0.5);
  fade(rL, 0, 1, tRidge + 0.15, 0.35);
  const tAll = T('b5~entire') - 0.1;
  const glowS = S.path({ d: roofD, stroke: 'white', sw: 12, strokeOpacity: 0.22 });
  glowS.setAttribute('data-audit', 'ignore');
  hide(glowS);
  fade(glowS, 0, 1, tAll, 0.5);
  whole(t => { const k = EIO(cl((t - tAll) / 0.5)); slant.setAttribute('stroke-width', lerp(5, 7, k).toFixed(2)); flatR.setAttribute('stroke-width', lerp(5, 7, k).toFixed(2)); });
  const tRl = T('b5~roofline') - 0.1;
  fade(head, 1, 0, tRl, 0.3);
  fade(head2, 0, 1, tRl + 0.2, 0.35);
  const credit = S.g();
  S.text('Williams, Waterman,', { x: 1420, y: 270, size: 28, weight: 600, color: 'muted' }, credit);
  S.text('Patterson · 2009', { x: 1420, y: 310, size: 28, weight: 600, color: 'muted' }, credit);
  hide(credit);
  const tYr = T('b5~two') - 0.1, tRule = T('b5~one') - 0.1;
  fade(credit, 0, 1, tYr, 0.4);
  fade(credit, 1, 0, tRule, 0.3);
  fade(rule, 0, 1, tRule + 0.3, 0.4);
  const ruleGlow = S.rect({ x: 1404, y: 244, w: 416, h: 130, r: 14, fill: 'white', opacity: 0 });
  ruleGlow.setAttribute('data-audit', 'ignore');
  pulse(ruleGlow, tRule + 0.6, 0.1, 0.8);
});
