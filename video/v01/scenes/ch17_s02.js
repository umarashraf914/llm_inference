/* ch17_s02 · two waits, and the phase behind each (fig 143)
   Two waits: the pause before the first token (TTFT, made by prefill: the whole prompt through every layer
   before any output) and each gap after it (TPOT, made by decode: one complete forward pass per token, about
   42 ms on an H100). Typical TTFT is half a second for a short prompt, seconds for a long one; real chips run
   below full speed and queues add more. The two sit at opposite ends of the roofline: decode at about 1 op/byte
   on the slanted ceiling, prefill (≈ 2,000) past the ridge at 989 / 3.35 = 295 (checked).
   b1  a chat window; the 'send' marker; the pause bar grows, the first pill lands ('The'); the bar fills amber,
       'time to first token' / 'TTFT'; eight more pills, a coral bracket in a gap, 'time per output token' /
       'TPOT, or inter-token latency'.
   b2  the window fades, the timeline rises to the top band (only 'TTFT' and 'TPOT' stay); the prefill panel: the
       prompt block passes up the 80-layer stack, lighting it amber; '≈ 0.5 s, typical', then 'several seconds,
       typical' as the block and the pause stretch; 'full speed' tick; a grey 'queue' pushes the rest right.
   b3  the decode panel: '≈ 42 ms on H100'; single pills climb the stack three times, lighting it coral.
   b4  verdicts 'feels responsive?' and 'reads comfortably?'; the pills stutter and settle; the panels shrink onto
       a small roofline (amber prefill past the '295' ridge, coral decode far left); 'opposite resource profiles'.
   Layout: timeline y 540 in b1, y 200 from b2; panels x 240-900 (prefill, amber) and 1020-1680 (decode, coral),
   y 400-1010, stacks of 80 bars (pitch 5) from y 870 up; roofline origin (725, 930), 110 px per decade across,
   90 px per decade up. */
V.scene('ch17_s02', S => {
  const K = libKit(S), { T, cl, E, EIO, whole, setO, hide, fade } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const lerp = (a, b, k) => a + (b - a) * k;

  // ---------------------------------------------------------------- the timeline's geometry, as a function of time
  const tSend = T('b1~Press') - 0.05, tGrow = T('b1~two') - 0.1, tFirst = T('b1~first') + 0.1, tFill = T('b1~time') - 0.1;
  const tEach = T('b1~Each') - 0.1, tUp = tB2 + 0.1, tHalf = T('b2~Half') - 0.1, tSev = T('b2~several') - 0.1;
  const tFull = T('b2~Real') - 0.1, tQ = T('b2~queues') - 0.1, tStut = T('b4~stutters') - 0.1, tSettle = T('b4~breaking') - 0.1;
  const tR = T('b4~opposite') - 0.25;  // the panels shrink onto the roofline
  const NP = 9, WORDS = ['The', ' capital', ' of', ' France', ' is', ' Paris', ',', ' known', ' for'];
  const pillAt = i => (i === 0 ? tFirst : tEach + 0.15 + 0.24 * (i - 1));
  const geo = t => {
    const up = EIO(cl((t - tUp) / 0.9));
    const y = lerp(540, 200, up);
    const q = EIO(cl((t - tQ) / 0.5)) * 100;                      // the queue pushes everything right
    const bw0 = 500 * E('power1.inOut')(cl((t - tGrow) / (tFirst - tGrow)));
    const bw = lerp(bw0, 280, up) + 400 * EIO(cl((t - tSev) / 0.8)); // 0.5 s, then several seconds
    const x0 = 260 + q, x1 = x0 + bw;
    const pitch = lerp(110, 90, up), pw = lerp(70, 60, up);
    return { y, up, q, x0, x1, pitch, pw, px: i => x1 + 30 + pitch * i };
  };
  const jit = (i, t) => 22 * Math.sin(i * 2.7 + 1) * Math.sin(Math.PI * cl((t - tStut) / (tSettle + 0.6 - tStut)));

  // ================================================================ b1: two waits
  const chat = S.g();
  S.rect({ x: 480, y: 130, w: 960, h: 290, r: 22, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.16, sw: 2 }, chat);
  const bub = S.g(null, chat);
  const qs = 'What is the capital of France?', qw = S.measure(qs, { size: 26, weight: 600 });
  S.rect({ x: 1410 - qw - 40, y: 160, w: qw + 40, h: 52, r: 18, fill: '#1d3566', stroke: 'struct', sw: 2 }, bub);
  S.text(qs, { x: 1390 - qw, y: 187, size: 26, weight: 600, color: 'ink' }, bub);
  const reply = S.text('', { x: 520, y: 300, size: 30, weight: 600, color: 'ink' }, chat);
  const caret = S.rect({ x: 520, y: 282, w: 3, h: 36, r: 1, fill: 'ink' }, chat);
  caret.setAttribute('data-audit', 'ignore');
  const sendI = S.g(null, chat);
  S.icon('ph:paper-plane-right-duotone', { x: 1396, y: 378, size: 40, color: 'struct' }, sendI);
  sendI.setAttribute('data-audit', 'ignore');
  rise(chat, 0.3, 10, 0.5);
  whole(t => {
    const n = [...Array(NP).keys()].filter(i => t > pillAt(i) + 0.15).length, s = WORDS.slice(0, n).join('');
    reply.textContent = s;
    caret.setAttribute('x', (520 + (s ? S.measure(s, { size: 30, weight: 600 }) + 6 : 0)).toFixed(1));
    setO(caret, Math.floor(t * 2.4) % 2 ? 0.2 : 1);
    sendI.setAttribute('opacity', (0.55 + 0.45 * Math.sin(Math.PI * cl((t - tSend) / 0.5))).toFixed(3));
  });
  fade(chat, 1, 0, tUp - 0.1, 0.4);
  // the axis, the send marker, the pause bar, the pills
  const tl = S.g();
  const axis = S.line({ x1: 240, y1: 540, x2: 1860, y2: 540, stroke: '#ffffff', strokeOpacity: 0.22, sw: 2 }, tl);
  const sendTick = S.line({ x1: 240, y1: 516, x2: 240, y2: 564, stroke: 'ink', sw: 3 }, tl);
  const sendL = S.text('send', { x: 240, y: 496, size: 26, weight: 700, anchor: 'middle', color: 'ink' }, tl);
  const queue = S.rect({ x: 260, y: 522, w: 0, h: 36, r: 6, fill: '#3a4560', stroke: '#8b95ad', sw: 2 }, tl);
  const pauseO = S.rect({ x: 260, y: 522, w: 0, h: 36, r: 8, stroke: 'compute', sw: 2.5 }, tl);
  const pauseF = S.rect({ x: 260, y: 522, w: 0, h: 36, r: 8, fill: 'compute', fillOpacity: 0.38 }, tl);
  const pauseFs = S.rect({ x: 260, y: 522, w: 0, h: 36, r: 0, fill: 'compute', fillOpacity: 0.55 }, tl);  // full-speed part, brighter
  const fullT = S.line({ x1: 0, y1: 0, x2: 0, y2: 0, stroke: 'compute', sw: 3, dash: '5 5' }, tl);
  [queue, pauseO, pauseF, pauseFs, fullT].forEach(e => e.setAttribute('data-audit', 'ignore'));
  const pills = [...Array(NP).keys()].map(i => { const r = S.rect({ x: 0, y: 0, w: 70, h: 36, r: 10, fill: 'url(#card-struct)', stroke: 'struct', sw: 2 }, tl); r.setAttribute('data-audit', 'ignore'); return r; });
  const glowP = pills.map(() => { const r = S.rect({ x: 0, y: 0, w: 90, h: 56, r: 18, fill: 'url(#pglow-struct)', opacity: 0 }, tl); r.setAttribute('data-audit', 'ignore'); tl.insertBefore(r, tl.firstChild); return r; });
  // brackets
  const brT = S.path({ d: '', stroke: 'compute', sw: 3 }, tl), brP = S.path({ d: '', stroke: 'bytes', sw: 3 }, tl);
  [brT, brP].forEach(e => e.setAttribute('data-audit', 'ignore'));
  const ttftLong = S.text('time to first token', { x: 0, y: 0, size: 28, weight: 700, anchor: 'middle', color: 'compute' }, tl);
  const ttft = S.text('TTFT', { x: 0, y: 0, size: 28, weight: 800, anchor: 'middle', color: 'compute' }, tl);
  const tpotLong = S.text('time per output token', { x: 0, y: 0, size: 28, weight: 700, anchor: 'middle', color: 'bytes' }, tl);
  const tpotSub = S.text('TPOT, or inter-token latency', { x: 0, y: 0, size: 26, weight: 650, anchor: 'middle', color: 'bytes' }, tl);
  const tpot = S.text('TPOT', { x: 0, y: 0, size: 28, weight: 800, anchor: 'middle', color: 'bytes' }, tl);
  const ms42 = S.text('≈ 42 ms on H100', { x: 0, y: 0, size: 26, weight: 700, color: 'bytes' }, tl);
  const tBrT = tFill + 0.4, tGap = tEach + 0.25, tTpotL = T('b1~time#2') - 0.05, t42 = tB3 + 0.4;
  whole(t => {
    const G = geo(t), y = G.y;
    axis.setAttribute('y1', y); axis.setAttribute('y2', y);
    sendTick.setAttribute('y1', y - 24); sendTick.setAttribute('y2', y + 24);
    sendL.setAttribute('y', y - 44);
    setO(axis, cl((t - tSend) / 0.3)); setO(sendTick, cl((t - tSend) / 0.2));
    setO(sendL, cl((t - tSend) / 0.2) * (1 - cl((t - tFirst - 0.1) / 0.3)));
    // the queue, then the pause bar: outline as it grows, amber fill from 'time to first token'
    queue.setAttribute('y', y - 18); queue.setAttribute('x', 260); queue.setAttribute('width', Math.max(0.01, G.q).toFixed(1)); setO(queue, G.q > 1 ? 1 : 0);
    [pauseO, pauseF, pauseFs].forEach(r => { r.setAttribute('y', y - 18); r.setAttribute('x', G.x0.toFixed(1)); });
    pauseO.setAttribute('width', Math.max(0.01, G.x1 - G.x0).toFixed(1)); setO(pauseO, t > tGrow ? 1 : 0);
    const f = EIO(cl((t - tFill) / 0.7));
    pauseF.setAttribute('width', Math.max(0.01, (G.x1 - G.x0) * f).toFixed(1)); setO(pauseF, f > 0 ? 1 : 0);
    // real chips run below full speed: the arithmetic alone would end at the tick (45% along); beyond it, paler
    const fs = cl((t - tFull) / 0.4), tx = G.x0 + (G.x1 - G.x0) * 0.45;
    pauseFs.setAttribute('width', ((tx - G.x0) * fs).toFixed(1)); setO(pauseFs, fs > 0 ? 1 : 0);
    fullT.setAttribute('x1', tx.toFixed(1)); fullT.setAttribute('x2', tx.toFixed(1)); fullT.setAttribute('y1', y - 30); fullT.setAttribute('y2', y + 30); setO(fullT, fs);
    pills.forEach((p, i) => {
      const k = E('back.out(2)')(cl((t - pillAt(i)) / 0.3));
      const x = G.px(i) + jit(i, t);
      p.setAttribute('x', x.toFixed(1)); p.setAttribute('width', G.pw.toFixed(1)); p.setAttribute('y', (y - 18 - 26 * (1 - k)).toFixed(1));
      setO(p, cl((t - pillAt(i)) / 0.12));
      glowP[i].setAttribute('x', (x + G.pw / 2 - 45).toFixed(1)); glowP[i].setAttribute('y', (y - 28).toFixed(1));
    });
    // brackets: TTFT under the pause bar; TPOT under a gap (the first, then hopping to the second)
    const by = y + 26;
    brT.setAttribute('d', `M${G.x0 + 2},${by} v10 H${G.x1 - 2} v-10`); setO(brT, cl((t - tBrT) / 0.3));
    const gi = t < tGap + 0.6 ? 0 : 1, hop = EIO(cl((t - tGap - 0.6) / 0.3));
    const gx0 = G.px(0) + G.pw + G.pitch * hop + jit(gi, t), gx1 = G.px(1) + G.pitch * hop + jit(gi + 1, t);
    brP.setAttribute('d', `M${gx0 + 2},${by} v10 H${gx1 - 2} v-10`); setO(brP, cl((t - tGap) / 0.2));
    const cT = (G.x0 + G.x1) / 2, cP = (gx0 + gx1) / 2;
    ttftLong.setAttribute('x', cT.toFixed(1)); ttftLong.setAttribute('y', y + 70);
    ttft.setAttribute('x', cT.toFixed(1)); ttft.setAttribute('y', y + (G.up > 0.5 ? 66 : 104));
    tpotLong.setAttribute('x', cP.toFixed(1)); tpotLong.setAttribute('y', y + 70);
    tpotSub.setAttribute('x', cP.toFixed(1)); tpotSub.setAttribute('y', y + 104);
    tpot.setAttribute('x', cP.toFixed(1)); tpot.setAttribute('y', y + 66);
    ms42.setAttribute('x', (cP + 50).toFixed(1)); ms42.setAttribute('y', y + 67);
    const longOut = 1 - cl((t - tUp) / 0.3);
    setO(ttftLong, cl((t - tBrT - 0.1) / 0.3) * longOut);
    setO(ttft, t < tUp ? cl((t - tBrT - 0.3) / 0.3) * longOut : cl((t - tUp - 0.6) / 0.3));
    setO(tpotLong, cl((t - tTpotL) / 0.3) * longOut);
    setO(tpotSub, cl((t - tTpotL - 0.25) / 0.3) * longOut);
    setO(tpot, cl((t - tUp - 0.6) / 0.3));
    setO(ms42, cl((t - t42) / 0.3) * (1 - cl((t - tB4) / 0.3)));
  });
  K.ignore(tl, tUp, 1.0);
  const tPause = S.text('a pause', { x: 0, y: 0, size: 26, weight: 650, anchor: 'middle', color: 'muted' });
  whole(t => { const G = geo(t); tPause.setAttribute('x', ((G.x0 + G.x1) / 2).toFixed(1)); tPause.setAttribute('y', G.y + 54); setO(tPause, cl((t - tGrow - 0.3) / 0.3) * (1 - cl((t - tFill) / 0.3))); });

  // ================================================================ b2: prefill makes the pause
  const panel = (x, tone, title, at) => {
    const h = S.g(), g = S.g(null, h);  // h takes the entrance, g the shrink onto the roofline
    S.rect({ x, y: 400, w: 660, h: 610, r: 22, fill: '#0c1326', fillOpacity: 0.7, stroke: tone, strokeOpacity: 0.8, sw: 2.5 }, g);
    const tt = S.text(title, { x: x + 330, y: 444, size: 32, weight: 800, anchor: 'middle', color: tone }, g);
    const bars = [];
    for (let k = 0; k < 80; k++) bars.push(S.rect({ x: x + 150, y: 868 - 5 * k, w: 360, h: 3, r: 1, fill: '#3a4560' }, g));
    bars.forEach(b => b.setAttribute('data-audit', 'ignore'));
    rise(h, at, 14, 0.5);
    g.title = tt; g.bars = bars; g.cx = x + 330;
    return g;
  };
  const PF = panel(240, 'compute', 'prefill', tUp + 0.5), DC = panel(1020, 'bytes', 'decode', tB3 + 0.1);
  hide(DC.title);
  fade(DC.title, 0, 1, tB3 + 0.4, 0.3);
  hide(PF.title);
  fade(PF.title, 0, 1, tUp + 0.9, 0.3);
  // connectors from the brackets to the panels
  const conT = S.path({ d: '', stroke: 'compute', strokeOpacity: 0.7, sw: 2.5, dash: '6 6' }), conP = S.path({ d: '', stroke: 'bytes', strokeOpacity: 0.7, sw: 2.5, dash: '6 6' });
  [conT, conP].forEach(e => e.setAttribute('data-audit', 'ignore'));
  whole(t => {
    const G = geo(t), cT = (G.x0 + G.x1) / 2, cP = G.px(1) + G.pw / 2 + G.pitch / 2;
    conT.setAttribute('d', `M${cT.toFixed(1)},${G.y + 84} C${cT.toFixed(1)},340 ${PF.cx},350 ${PF.cx},408`);
    conP.setAttribute('d', `M${cP.toFixed(1)},${G.y + 84} C${cP.toFixed(1)},340 ${DC.cx},350 ${DC.cx},408`);
    setO(conT, cl((t - tUp - 0.9) / 0.4) * (1 - cl((t - tB4) / 0.4)));
    setO(conP, cl((t - tB3 - 0.2) / 0.4) * (1 - cl((t - tB4) / 0.4)));
  });
  // the prompt block: rises through every layer (lighting it amber), leaves the top; then short, then long
  const tPass = T('b2~whole') - 0.1, tOut = T('b2~before') - 0.1;
  const block = S.g();
  const minis = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 16; c++) minis.push([S.rect({ x: 0, y: 0, w: 16, h: 12, r: 3, fill: 'url(#card-struct)', stroke: 'struct', sw: 1.5 }, block), r, c]);
  block.setAttribute('data-audit', 'ignore');
  whole(t => {
    const n = t < tHalf ? 10 : t < tSev ? 6 : 6 + Math.round(10 * EIO(cl((t - tSev) / 0.8)));
    const w = n * 20 - 4, x0 = PF.cx - w / 2;
    const climb = EIO(cl((t - tPass) / (tOut - tPass))), leave = cl((t - tOut) / 0.4);
    const y0 = t < tOut + 0.4 ? lerp(930, 440, climb) - 40 * leave : 930;  // after leaving the top, a new block waits below
    minis.forEach(([m, r, c]) => { m.setAttribute('x', (x0 + 20 * c).toFixed(1)); m.setAttribute('y', (y0 + 16 * r).toFixed(1)); setO(m, c < n ? 1 : 0); });
    const shown = t < tUp + 0.6 ? 0 : t < tOut + 0.4 ? 1 - leave : cl((t - tHalf) / 0.3);
    setO(block, shown * (1 - cl((t - tR) / 0.3)));
    const yClimb = lerp(930, 440, climb);
    PF.bars.forEach((b, k) => b.setAttribute('fill', t > tPass && yClimb < 868 - 5 * k ? S.tone('compute') : '#3a4560'));
  });
  K.pulse(glowP[0], tOut + 0.35, 1, 0.8);
  const tag = (txt, at, out) => {
    const g = S.g();
    const e = S.pill(txt, { x: 0, y: 150, tone: 'compute', size: 24, h: 40 }, g);
    whole(t => { const G = geo(t); g.setAttribute('transform', `translate(${((G.x0 + G.x1) / 2).toFixed(1)},0)`); });
    hide(e);
    fade(e, 0, 1, at, 0.3);
    if (out) fade(e, 1, 0, out, 0.3);
    return g;
  };
  tag('≈ 0.5 s, typical', tHalf, tSev);
  tag('several seconds, typical', tSev + 0.3, tFull);
  const fullL = S.text('full speed', { x: 0, y: 150, size: 24, weight: 700, anchor: 'middle', color: 'compute' });
  whole(t => { const G = geo(t); fullL.setAttribute('x', (G.x0 + (G.x1 - G.x0) * 0.45).toFixed(1)); setO(fullL, cl((t - tFull - 0.2) / 0.3) * (1 - cl((t - tB3) / 0.3))); });
  const qL = S.text('queue', { x: 310, y: 150, size: 24, weight: 700, anchor: 'middle', color: 'muted' });
  whole(t => setO(qL, cl((t - tQ - 0.3) / 0.3) * (1 - cl((t - tB3) / 0.3))));

  // ================================================================ b3: decode makes each gap
  const tClimb = T('b3~its') - 0.15;
  const one = S.rect({ x: DC.cx - 10, y: 0, w: 20, h: 14, r: 4, fill: 'url(#card-struct)', stroke: 'struct', sw: 1.5 });
  one.setAttribute('data-audit', 'ignore');
  const CL = 0.75;
  whole(t => {
    const j = Math.max(0, Math.min(2, Math.floor((t - tClimb) / CL))), u = cl((t - tClimb - CL * j) / CL);
    const y = lerp(930, 430, EIO(u));
    one.setAttribute('y', y.toFixed(1));
    setO(one, t > tB3 + 0.4 && t < tClimb + 3 * CL ? 1 : 0);
    DC.bars.forEach((b, k) => b.setAttribute('fill', t > tClimb && (j > 0 || y < 868 - 5 * k) ? S.tone('bytes') : '#3a4560'));
  });
  [1, 2, 3].forEach(i => K.pulse(glowP[i], tClimb + CL * i - 0.05, 1, 0.5));

  // ================================================================ b4: both are felt; opposite ends of the roofline
  fade([PF.title, DC.title], 1, 0, tB4, 0.3);
  const verdict = (txt, tone, at, xf) => {
    const e = S.text(txt, { x: 0, y: 310, size: 28, weight: 750, anchor: 'middle', color: tone });
    whole(t => { const G = geo(t); e.setAttribute('x', xf(G).toFixed(1)); });
    rise(e, at, 6);
    fade(e, 1, 0, T('b4~Both') - 0.1, 0.3);
    return e;
  };
  verdict('feels responsive?', 'compute', T('b4~feels') - 0.1, G => (G.x0 + G.x1) / 2);
  verdict('reads comfortably?', 'bytes', T('b4~reads') - 0.1, G => G.px(1) + G.pw / 2 + G.pitch / 2);
  // the panels shrink into dots and fly onto a small roofline
  const RX = I => 725 + 110 * (Math.log10(I) + 0.2), RY = P => 930 - 90 * Math.log10(P);
  const ridge = [RX(989 / 3.35), RY(989)], dP = [RX(2000), RY(989)], dD = [RX(1), RY(3.35)];
  K.track(PF, [K.K(tR, { x: 0, y: 0, s: 1, o: 1 }), K.K(tR + 0.8, { x: dP[0] - PF.cx, y: dP[1] - 705, s: 0.03, o: 0, e: 'power3.in' })], PF.cx, 705);
  K.track(DC, [K.K(tR, { x: 0, y: 0, s: 1, o: 1 }), K.K(tR + 0.8, { x: dD[0] - DC.cx, y: dD[1] - 705, s: 0.03, o: 0, e: 'power3.in' })], DC.cx, 705);
  K.ignore([PF, DC, block], tR, 0.9);
  const roof = S.g();
  S.path({ d: `M725,${RY(10 ** 3.2)} V930 H1215`, stroke: '#ffffff', strokeOpacity: 0.5, sw: 2 }, roof);
  S.path({ d: `M725,${RY(3.35 * 10 ** -0.2).toFixed(1)} L${ridge[0].toFixed(1)},${ridge[1].toFixed(1)}`, stroke: 'bytes', sw: 4 }, roof);
  S.path({ d: `M${ridge[0].toFixed(1)},${ridge[1].toFixed(1)} H1205`, stroke: 'compute', sw: 4 }, roof);
  S.path({ d: `M${ridge[0].toFixed(1)},${ridge[1].toFixed(1)} V930`, stroke: '#ffffff', sw: 2, dash: '5 6' }, roof);
  S.text('295', { x: ridge[0], y: 958, size: 24, weight: 700, anchor: 'middle', color: 'ink' }, roof);
  roof.setAttribute('data-audit', 'ignore');
  rise(roof, tR + 0.2, 0, 0.5);
  const dot = (p, tone, label, lx, ly, anchor) => {
    const g = S.g();
    S.circle({ x: p[0], y: p[1], r: 11, fill: tone, stroke: '#060a14', sw: 2 }, g);
    S.text(label, { x: lx, y: ly, size: 26, weight: 750, anchor, color: tone }, g);
    rise(g, tR + 0.8, 0, 0.3);
    return g;
  };
  dot(dP, 'compute', 'prefill', dP[0], dP[1] - 30, 'middle');
  dot(dD, 'bytes', 'decode', dD[0] - 22, dD[1] + 1, 'end');
  const fin = S.text('opposite resource profiles', { x: 965, y: 1004, size: 28, weight: 750, anchor: 'middle', color: 'ink' });
  rise(fin, tR + 1.1, 6);
});
