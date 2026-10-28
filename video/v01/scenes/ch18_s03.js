/* ch18_s03 · the road ahead (fig 148)
   For decode, flip the 30 ms division: tokens per second = bandwidth ÷ bytes per token, and bytes per token =
   bytes per read ÷ tokens sharing each read, so the line reads bandwidth ÷ (bytes per read ÷ tokens sharing).
   Checked: H100 3.35 TB/s ÷ 140 GB = 24 tokens/s; H200 4.8 ÷ 140 ≈ 34; 8-bit halves the read: ≈ 48; ten users
   sharing each read: 3.35 TB/s ÷ (140 GB ÷ 10) ≈ 239, '≈ 240 in all' (without the brackets it would read 2.4);
   decode at batch 1 uses 1/295 of the arithmetic: '> 99% idle'. The eight later videos each pull on one term.
   b1  the 29.2 ms line flips to ≈ 34 tokens/s; the division writes on and its denominator splits into a bracketed
       pair; three teal arrows; the panel of eight dimmed cards.
   b2  cards 2-5 named and wired: 2 and 5 to bandwidth, 3 and 4 to bytes per read; chips A and B.
   b3  cards 6-9: 6 to bytes per read, 7 and 8 to tokens sharing (chip C; '> 99% idle at batch 1'), 9 to all
       three; the six-stop route in miniature with a token travelling it.
   b4  every wire pulses into its term, card 9's again; the arrows nudge; the wiring glows and the panel dims.
   Layout: the division y 102-158 (boxes 'bandwidth' 560-760, 'bytes per read' 885-1175, 'tokens sharing each
   read' 1265-1730); ports y 330 at x 660 / 1030 / 1498, chips y 228; panel x 120-1800, y 330-1010; cards 360 × 200
   at x 168 / 576 / 984 / 1392, y 420 and 680; rails y 360 / 378 / 396; gutters x 144 / 552 / 960 / 1368. */
V.scene('ch18_s03', S => {
  const K = libKit(S), { T, cl, E, EIO, whole, setO, hide, fade } = K;
  const tB2 = T('b2') - 0.1, tB4 = T('b4') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const EY = 130, PORT = { A: 660, B: 1030, C: 1498 }, RAIL = { A: 360, B: 378, C: 396 }, TONE = { A: 'bytes', B: 'bytes', C: 'struct' };

  // ================================================================ b1: flip the division, split the denominator
  const tFor = T('b1~For') - 0.1, tFlip = T('b1~flip') - 0.1, tTok = T('b1~tokens') - 0.1, tSplit = T('b1~bytes#3') - 0.1;
  const tShare = T('b1~tokens#2') - 0.1, tThree = T('b1~three') - 0.1, tEarlier = T('b1~from') - 0.1;
  const flipG = S.g();
  const fl1 = S.text('140 GB ÷ 4.8 TB/s = 29.2 ms', { x: 960, y: EY + 1, size: 34, weight: 650, anchor: 'middle', color: 'muted', family: 'mono' }, flipG);
  const fl2 = S.text('4.8 TB/s ÷ 140 GB ≈ 34 tokens/s', { x: 960, y: EY + 1, size: 34, weight: 650, anchor: 'middle', color: 'muted', family: 'mono' }, flipG);
  whole(t => {
    const f = cl((t - tFlip) / 0.5), sy = Math.abs(Math.cos(Math.PI * f));
    flipG.setAttribute('transform', `translate(0,${EY}) scale(1,${Math.max(0.02, sy).toFixed(3)}) translate(0,${-EY})`);
    setO(fl1, f < 0.5 ? 1 : 0); setO(fl2, f >= 0.5 ? 1 : 0);
    setO(flipG, cl((t - tFor) / 0.4) * (1 - cl((t - tTok) / 0.3)));
  });
  K.ignore(flipG, tFlip, 0.55);
  const eq = S.g();
  const box = (x, w, label, tone, parent = eq) => {
    const g = S.g(null, parent);
    S.rect({ x, y: 102, w, h: 56, r: 12, fill: '#0c1326' }, g);
    g.r = S.rect({ x, y: 102, w, h: 56, r: 12, fill: `url(#card-${tone})`, stroke: tone, sw: 2.5 }, g);
    g.t = S.text(label, { x: x + w / 2, y: EY + 1, size: 31, weight: 700, anchor: 'middle', color: 'ink' }, g);   // 31: room inside each box
    return g;
  };
  const tps = S.text('tokens per second', { x: 500, y: EY + 1, size: 34, weight: 750, anchor: 'end', color: 'ink' }, eq);
  const eqS = S.text('=', { x: 528, y: EY + 1, size: 34, weight: 750, anchor: 'middle', color: 'ink' }, eq);
  const bA = box(560, 200, 'bandwidth', 'bytes');
  const div1 = S.text('÷', { x: 822, y: EY + 1, size: 38, weight: 750, anchor: 'middle', color: 'ink' }, eq);
  const bB = box(885, 290, 'bytes per token', 'bytes');
  const bBt2 = S.text('bytes per read', { x: 1030, y: EY + 1, size: 31, weight: 700, anchor: 'middle', color: 'ink' }, bB);
  const lpar = S.text('(', { x: 862, y: EY - 2, size: 46, weight: 500, anchor: 'middle', color: 'ink' }, eq);
  const div2 = S.text('÷', { x: 1238, y: EY + 1, size: 38, weight: 750, anchor: 'middle', color: 'ink' }, eq);
  const bC = box(1265, 465, 'tokens sharing each read', 'struct');
  const rpar = S.text(')', { x: 1790, y: EY - 2, size: 46, weight: 500, anchor: 'middle', color: 'ink' }, eq);
  [[tps, 0], [eqS, 0.45], [bA, T('b1~bandwidth') - 0.1 - tTok], [div1, T('b1~over') - 0.1 - tTok], [bB, T('b1~bytes') - 0.1 - tTok]].forEach(([e, dt]) => rise(e, tTok + 0.05 + dt, 8, 0.35));
  fade(bB.t, 1, 0, tSplit, 0.2);
  hide(bBt2);
  fade(bBt2, 0, 1, tSplit + 0.2, 0.25);
  [div2, bC].forEach((e, k) => K.track(e, [K.K(tSplit + 0.15 * k, { x: -240, o: 0 }), K.K(tSplit + 0.15 * k + 0.5, { x: 0, o: 1, e: 'power3.out' })]));
  K.ignore([div2, bC], tSplit, 0.7);  // they slide out from under 'bytes per read'
  [lpar, rpar].forEach(e => { hide(e); fade(e, 0, 1, tSplit + 0.6, 0.3); });
  const glowC = S.rect({ x: 1255, y: 92, w: 485, h: 76, r: 20, fill: 'url(#pglow-struct)', opacity: 0 });
  glowC.setAttribute('data-audit', 'ignore');
  S.main.insertBefore(glowC, eq);
  K.pulse(glowC, tShare, 1, 0.8);
  // three teal arrows: up beside bandwidth, down beside bytes per read, up beside tokens sharing
  const arrow = (x, up, at) => {
    const g = S.g(), d = up ? -1 : 1;
    const tip = EY + 14 * d;  // d = -1 points up
    S.path({ d: `M${x},${EY - 14 * d} V${tip} M${x - 9},${tip - 10 * d} L${x},${tip} L${x + 9},${tip - 10 * d}`, stroke: 'helps', sw: 3.5 }, g);
    g.setAttribute('data-audit', 'ignore');
    rise(g, at, 0, 0.3);
    return g;
  };
  const arA = arrow(776, true, tThree), arB = arrow(1192, false, tThree + 0.25), arC = arrow(1750, true, tThree + 0.5);
  const nudge = (g, up, at) => S.add(K.drive(0.5, k => { const v = Math.sin(Math.PI * k) * 8 * (up ? -1 : 1); g.setAttribute('transform', `translate(0,${v.toFixed(1)})`); }), at);
  // the panel and its eight cards, dimmed
  const panel = S.g();
  S.rect({ x: 120, y: 330, w: 1680, h: 680, r: 28, fill: 'struct', fillOpacity: 0.05, stroke: 'struct', strokeOpacity: 0.45, sw: 2 }, panel);
  rise(panel, tEarlier, 10, 0.5);
  const ptitle = S.text('Where the series goes from here', { x: 168, y: 372, size: 28, weight: 700, color: 'muted' });
  rise(ptitle, tEarlier + 0.2, 6);
  fade(ptitle, 1, 0, tB2 - 0.2, 0.3);
  const COLX = [168, 576, 984, 1392], ROWY = [420, 680];
  const CARDS = [
    [2, 'inside the GPU', 'b2~inside', ['A']], [3, 'the code on it', 'b2~code', ['B']], [4, 'fewer bits', 'b2~Fewer', ['B']], [5, 'across many chips', 'b2~many', ['A']],
    [6, 'part of itself', 'b3~part', ['B']], [7, 'serving at scale', 'b3~Serving', ['C']], [8, 'idle units in decode', 'b3~idle', ['C']], [9, 'one real request', 'b3~one', ['A', 'B', 'C']],
  ];
  const tName = CARDS.map(c => T(c[2]) - 0.1);
  const cards = CARDS.map(([n, label, cue, terms], i) => {
    const c = i % 4, r = Math.floor(i / 4), x = COLX[c], y = ROWY[r];
    const g = S.g(null, panel), inner = S.g(null, g);
    S.rect({ x, y, w: 360, h: 200, r: 18, fill: '#0c1326', stroke: 'struct', strokeOpacity: 0.6, sw: 2 }, inner);
    S.text(String(n), { x: x + 18, y: y + 28, size: 22, weight: 700, color: 'muted', family: 'mono' }, inner);
    const ic = S.g(null, inner);
    const lab = S.text(label, { x: x + 180, y: y + 164, size: 28, weight: 750, anchor: 'middle', color: 'ink' }, g);
    const next = i < 7 ? tName[i + 1] : tB4;
    hide(lab);
    fade(lab, 0, 1, tName[i] + 0.15, 0.3);
    fade(lab, 1, 0, next - 0.1, 0.25);
    whole(t => setO(inner, t > tB4 ? 1 : t > tName[i] ? 1 : 0.3));
    Object.assign(g, { ic, cx: x + 180, top: y, col: c, row: r, terms });
    return g;
  });
  const icAt = (i, dy = -14) => [COLX[i % 4] + 180, ROWY[Math.floor(i / 4)] + 86 + dy];
  // icons
  { const [x, y] = icAt(0); S.icon('ph:cpu-duotone', { x, y, size: 76, color: 'compute' }, cards[0].ic); }
  { const [x, y] = icAt(1); S.icon('ph:code-duotone', { x, y, size: 76, color: 'struct' }, cards[1].ic); }
  { const [x, y] = icAt(2);
    const d16 = S.text('0110100111010010', { x, y: y + 1, size: 30, weight: 700, anchor: 'middle', color: 'struct', family: 'mono' }, cards[2].ic);
    const d8 = S.text('01101001', { x, y: y + 1, size: 30, weight: 700, anchor: 'middle', color: 'struct', family: 'mono' }, cards[2].ic);
    const tF = tName[2] + 0.3;
    whole(t => { const k = cl((t - tF) / 0.4); setO(d16, 1 - k); setO(d8, k); });
  }
  { const [x, y] = icAt(3); S.icon('ph:cpu-duotone', { x: x - 60, y, size: 64, color: 'compute' }, cards[3].ic); S.icon('ph:cpu-duotone', { x: x + 60, y, size: 64, color: 'compute' }, cards[3].ic); S.icon('ph:link-duotone', { x, y, size: 40, color: 'struct' }, cards[3].ic); }
  { const [x, y] = icAt(4);
    S.circle({ x, y, r: 38, fill: '#1d3566', stroke: 'struct', sw: 2.5 }, cards[4].ic);
    const a0 = -Math.PI / 2, a1 = a0 + Math.PI / 3;
    S.path({ d: `M${x},${y} L${(x + 38 * Math.cos(a0)).toFixed(1)},${(y + 38 * Math.sin(a0)).toFixed(1)} A38,38 0 0 1 ${(x + 38 * Math.cos(a1)).toFixed(1)},${(y + 38 * Math.sin(a1)).toFixed(1)} Z`, fill: 'compute', stroke: 'compute', sw: 2 }, cards[4].ic);
  }
  { const [x, y] = icAt(5); S.icon('ph:users-three-duotone', { x, y, size: 86, color: 'struct' }, cards[5].ic); }
  { const [x, y] = icAt(6);
    const sleep = S.g(null, cards[6].ic), awake = S.g(null, cards[6].ic);
    S.icon('ph:cpu-duotone', { x, y, size: 76, color: '#6b7590' }, sleep);
    S.text('z', { x: x + 46, y: y - 30, size: 26, weight: 800, color: 'muted' }, sleep);
    S.icon('ph:cpu-duotone', { x, y, size: 76, color: 'compute' }, awake);
    const tW = tName[6] + 0.2;
    whole(t => { const k = cl((t - tW) / 0.4); setO(sleep, 1 - k); setO(awake, k); });
  }
  { const [x, y] = icAt(7); S.icon('ph:path-duotone', { x, y, size: 80, color: 'struct' }, cards[7].ic); }
  const idle = S.pill('> 99% idle at batch 1', { x: COLX[2] + 180, y: ROWY[1] + 236, tone: 'compute', size: 24, h: 40 });
  rise(idle, tName[6] + 0.5, 6);
  fade(idle, 1, 0, tName[7] - 0.1, 0.25);

  // ================================================================ wires, ports, port lines, chips
  const ports = {}, portLines = {};
  const firstOf = term => Math.min(...CARDS.map((c, i) => (c[3].includes(term) ? tName[i] : 1e9)));
  ['A', 'B', 'C'].forEach(term => {
    const x = PORT[term], at = firstOf(term) + 0.6;
    ports[term] = S.circle({ x, y: 330, r: 8, fill: TONE[term], stroke: '#060a14', sw: 2 });
    rise(ports[term], tEarlier + 0.4, 0, 0.3);
    const pl = S.path({ d: `M${x},322 V160`, stroke: TONE[term], sw: 3 });
    pl.setAttribute('data-audit', 'ignore');
    K.draw(pl, 170, at, 0.4);
    portLines[term] = pl;
  });
  const wires = [];
  cards.forEach((g, i) => g.terms.forEach((term, j) => {
    const cx = g.cx, rail = RAIL[term], px = PORT[term];
    const d = g.row === 0 ? `M${cx},${g.top} V${rail} H${px} V330` : `M${cx},${g.top} V650 H${COLX[g.col] - 24} V${rail} H${px} V330`;
    const p = S.path({ d, stroke: TONE[term], sw: 3 });
    p.setAttribute('data-audit', 'ignore');
    S.main.insertBefore(p, panel.nextSibling);
    K.draw(p, 0, tName[i] + 0.2 + 0.1 * j, 0.6);
    wires.push({ p, d, term, card: i });
  }));
  // a light running up each wire, through its port, into its term
  const runner = (w, at) => {
    const r = S.path({ d: `${w.d} V160`, stroke: '#ffffff', sw: 5, cap: 'round' });
    r.setAttribute('data-audit', 'ignore');
    const L = Math.ceil(r.getTotalLength());
    r.setAttribute('stroke-dasharray', `40 ${L + 60}`);
    whole(t => { const k = cl((t - at) / 0.8); r.setAttribute('stroke-dashoffset', (40 - (L + 40) * k).toFixed(1)); setO(r, k > 0 && k < 1 ? 1 : 0); });
  };
  const tPulse = T('b4~division') - 0.1, tMost = T('b4~most') - 0.1, tMove = T('b4~moving') - 0.1, tArg = T('b4~single') - 0.1;
  wires.forEach(w => runner(w, tPulse));
  wires.filter(w => w.card === 7).forEach(w => runner(w, tMost));
  const glowAll = S.g();
  wires.forEach(w => { const gp = S.path({ d: w.d, stroke: '#ffffff', sw: 4 }, glowAll); gp.setAttribute('data-audit', 'ignore'); });
  Object.values(PORT).forEach(x => { const gp = S.path({ d: `M${x},322 V160`, stroke: '#ffffff', sw: 4 }, glowAll); gp.setAttribute('data-audit', 'ignore'); });
  hide(glowAll);
  fade(glowAll, 0, 0.9, tArg, 0.5);
  const eqPulse = S.rect({ x: 240, y: 86, w: 1580, h: 90, r: 30, fill: 'url(#pglow-struct)', opacity: 0 });
  eqPulse.setAttribute('data-audit', 'ignore');
  S.main.insertBefore(eqPulse, eq);
  K.pulse(eqPulse, tPulse, 1, 0.9);
  nudge(arA, true, tMove); nudge(arB, false, tMove + 0.15); nudge(arC, true, tMove + 0.3);
  // chips on the port lines (24 px, each led by the 24 tokens/s baseline)
  const chipAt = (term, parts, at, out, line2) => {
    const c = ch18Chip(S, { x: PORT[term], y: 228, size: 24, parts, tone: TONE[term] === 'struct' ? 'struct' : 'bytes', line2: line2 || null });
    S.set(c, { autoAlpha: 0 }, 0);
    S.add(c.write({ stagger: 0.06 }), at);
    S.add(S.fx.out(c, { d: 0.3 }), out);
    return c;
  };
  chipAt('A', ['H100', '24', '→', 'H200', '≈', '34', 'tokens/s'], tName[0] + 0.9, tName[2] + 0.1);
  S.add(K.drive(0.5, k => arB.setAttribute('transform', `translate(0,${(8 * Math.sin(Math.PI * k)).toFixed(1)})`)), tName[1] + 0.8);
  chipAt('B', ['16-bit', '24', '→', '8-bit', '≈', '48', 'tokens/s'], tName[2] + 0.5, tName[4]);
  S.add(K.drive(0.5, k => arA.setAttribute('transform', `translate(0,${(-8 * Math.sin(Math.PI * k)).toFixed(1)})`)), tName[3] + 0.8);
  chipAt('C', ['1 user', '24', '→', '10 users', '≈', '240', 'in all'], tName[5] + 0.9, tName[6], { t: 'weights only', size: 22 });
  // card 9: the six-stop route in miniature along the panel's bottom strip
  const tEnd = T('b3~end') - 0.1, tStack = T('b3~whole') - 0.1;
  const route = S.g();
  const STOPS = ['ph:signpost-duotone', 'ph:queue-duotone', 'ph:file-text-duotone', 'ph:arrows-left-right-duotone', 'ph:arrows-clockwise-duotone', 'ph:laptop-duotone'];
  const SX = i => 200 + (1720 - 200) * i / 5;
  const rl = S.path({ d: 'M200,950 H1720', stroke: '#8b95ad', strokeOpacity: 0.6, sw: 2.5 }, route);
  rl.setAttribute('data-audit', 'ignore');
  K.draw(rl, 1520, tEnd, 0.6);
  STOPS.forEach((ic, i) => {
    const g = S.g(null, route);
    S.circle({ x: SX(i), y: 950, r: 24, fill: '#0c1326', stroke: '#8b95ad', strokeOpacity: 0.7, sw: 2 }, g);
    S.icon(ic, { x: SX(i), y: 950, size: 30, color: 'muted' }, g);
    rise(g, tEnd + 0.1 * i, 0, 0.25);
  });
  const pill = S.rect({ x: -16, y: -11, w: 32, h: 22, r: 7, fill: 'url(#card-struct)', stroke: 'struct', sw: 2 }, route);
  whole(t => { const k = EIO(cl((t - tEnd - 0.3) / (tStack + 0.3 - tEnd - 0.3))); pill.setAttribute('transform', `translate(${(200 + 1520 * k).toFixed(1)},${922})`); setO(pill, t > tEnd + 0.3 ? 1 : 0); });
  const rGlow = S.rect({ x: 170, y: 916, w: 1580, h: 68, r: 24, fill: 'url(#pglow-struct)', opacity: 0 }, route);
  rGlow.setAttribute('data-audit', 'ignore');
  route.insertBefore(rGlow, route.firstChild);
  K.pulse(rGlow, tStack + 0.3, 1, 0.8);
  route.setAttribute('data-audit', 'ignore');
  fade(route, 1, 0, tB4, 0.4);
  // b4: the panel dims so the division and its wiring hold the frame
  fade(panel, 1, 0.5, tArg + 0.2, 0.6);
});
