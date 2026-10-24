/* ch08_s12 · back to words: one forward pass (figs 103, 104)
   b1  header 'From a vector to a word'; the 80-slab stack on the left over the input row 'the cat sat down
       it'; five columns rise out of its top; four dim and the last (above 'it') slides right and grows into
       'final vector', '8,192 numbers'.
   b2  a tall blue-grey 'output projection' draws on, rows numbered '0, 1, 2, ⋮, 128,255'; coral particles
       stream out of its rows, tag 'every row, every token'; the final vector sweeps down every row while an
       amber strip 'score every token' fills ('about 128,000 numbers'); on 'Softmax' the strip becomes a few
       share bars, one tall, and a pill drops out: 'purred', 'pick one', '1 token'.
   b3  the pieces regroup into one straight path: 'embedding lookup', '80 layers', 'output projection',
       'pick one', each lighting as named; a bracket 'one forward pass'; the pick flies round a return arrow
       'append, go round again' to the end of the input row and the path lights again; 'arithmetic on arrays
       of numbers'.
   b4  the stack moves to the centre beside the seven tiles of one layer ('7 per layer', '6 in the classic
       design'), 'times 60 to 100+ layers', 'the weights are the model'; then everything collapses into one
       number, '70.6 B parameters' (70.55 B rounded), over a fraction bar with a blank denominator and a '×'
       slot. Hold.
   Layout: stack x 130-590, slab 1 at y 940 (pitch 5.6); input row y 990; final vector x 680; output
   projection x 800-880, y 220-960; strip x 1060-1090; share bars from x 1240, baseline y 760. */
V.scene('ch08_s12', S => {
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = n => gsap.parseEase(n);
  const EIO = E('power2.inOut');
  const clock = (a, b, fn) => S.add(ch08Drive(b - a, k => fn(a + k * (b - a))), a);
  const whole = fn => { fn(0); clock(0, S.duration, fn); };
  const fade = (els, a, b, at, d = 0.45, stagger = 0) => S.add(ch08Fade(els, a, b, { d, stagger }), at);
  const stateAt = (keys, t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, b] = keys[i];
      if (t < t1) {
        const [t0, a] = keys[i - 1], u = (b.e ? E(b.e) : EIO)(cl((t - t0) / (t1 - t0)));
        const o = {};
        for (const k of Object.keys(b)) if (k !== 'e' && typeof b[k] === 'number') o[k] = lerp(a[k] ?? b[k], b[k], u);
        return { ...a, ...o };
      }
    }
    return keys[keys.length - 1][1];
  };
  const K = (t, st) => [t, st];
  const track = (el, keys, ox = 0, oy = 0) => whole(t => {
    const st = stateAt(keys, t), s = st.s ?? 1, o = st.o ?? 1;
    el.setAttribute('transform', `translate(${(ox + (st.x ?? 0)).toFixed(1)},${(oy + (st.y ?? 0)).toFixed(1)}) scale(${s.toFixed(4)}) translate(${-ox},${-oy})`);
    el.setAttribute('opacity', o.toFixed(3));
    el.style.visibility = o > 0.002 ? 'inherit' : 'hidden';
  });
  const small = (s, x, y, o = {}) => S.text(s, { x, y, size: 22, weight: 600, anchor: 'middle', color: 'muted', ...o });

  const hd = S.text('From a vector to a word', { x: 110, y: 130, size: 46, weight: 700, family: 'display', color: 'ink' });
  ch08Hide(hd);
  fade(hd, 0, 1, 0.3, 0.5);
  fade(hd, 1, 0, T('b4') - 0.2, 0.4);
  const tB3 = T('b3') - 0.15, tB4 = T('b4') - 0.1;

  // ================================================================ the input row and the stack
  const WORDS = ['the', 'cat', 'sat', 'down', 'it'], RY = 990;
  let rx = 140;
  const row = S.g();
  const pills = WORDS.map(w => {
    const pw = S.measure(w, { size: 24, weight: 600 }) + 44, p = S.pill(w, { x: rx + pw / 2, y: RY, tone: 'struct', size: 24, h: 40 }, row);
    p.cxx = rx + pw / 2; rx += pw + 10;
    return p;
  });
  const rowEnd = rx;
  ch08Hide(row);
  fade(row, 0, 1, 0.2, 0.4);
  fade(row, 1, 0, tB4, 0.4);
  const STX = 130, STW = 460, SY = k => 940 - (k - 1) * 5.6;
  const stack = S.g();
  for (let k = 1; k <= 80; k++) S.rect({ x: STX, y: SY(k) - 1.8, w: STW, h: 3.6, r: 1.5, fill: 'struct', fillOpacity: 0.6 }, stack);
  stack.setAttribute('data-audit', 'ignore');
  const SC = [STX + STW / 2, (SY(1) + SY(80)) / 2];
  // b1 here; b3 station '80 layers' (centre 580, 640, x0.4); b4 the centre (760, 560, x0.8); then into the number
  const tColl = T('b4~divides') - 0.1;
  track(stack, [K(0.1, { o: 0 }), K(0.5, { o: 1 }), K(tB3, { x: 0, y: 0, s: 1 }), K(tB3 + 0.8, { x: 580 - SC[0], y: 640 - SC[1], s: 0.4 }),
    K(tB4 + 0.1, { x: 580 - SC[0], y: 640 - SC[1], s: 0.4 }), K(tB4 + 0.9, { x: 760 - SC[0], y: 560 - SC[1], s: 0.8 }),
    K(tColl, { x: 760 - SC[0], y: 560 - SC[1], s: 0.8, o: 1 }), K(tColl + 0.6, { x: 820 - SC[0], y: 465 - SC[1], s: 0.1, o: 0, e: 'power2.in' })], SC[0], SC[1]);

  // ================================================================ b1: five columns; the last becomes the final vector
  const tRise = T('b1~top') - 0.1, tOnly = T('b1~only') - 0.1;
  const cols = pills.map((p, i) => {
    const g = S.g();
    ch08Vec(S, { token: WORDS[i], round: 80, x: p.cxx, y: 410, n: 8, cw: 22, ch: 11, gap: 2 }, g);
    const t0 = tRise + 0.12 * i;
    const last = i === 4;
    const keys = [K(t0, { y: 70, o: 0 }), K(t0 + 0.6, { y: 0, o: 1, e: 'power3.out' })];
    if (!last) keys.push(K(tOnly, { y: 0, o: 1 }), K(tOnly + 0.4, { y: 0, o: 0.22 }), K(tB3, { y: 0, o: 0.22 }), K(tB3 + 0.4, { y: 0, o: 0 }));
    else keys.push(K(tOnly + 0.3, { x: 0, y: 0, s: 1 }), K(tOnly + 1.2, { x: 680 - p.cxx, y: 190, s: 2.6 }), K(tB3, { x: 680 - p.cxx, y: 190, s: 2.6, o: 1 }), K(tB3 + 0.45, { x: 680 - p.cxx, y: 190, s: 2.6, o: 0 }));
    track(g, keys, p.cxx, 410);
    return g;
  });
  S.add(ch08Ignore(cols[4], 1.0), tOnly + 0.25);
  const fvN = S.text('final vector', { x: 680, y: 436, size: 26, weight: 700, anchor: 'middle', color: 'struct' });
  const fvL = small('8,192 numbers', 680, 768);
  ch08Hide([fvN, fvL]);
  fade([fvN, fvL], 0, 1, tOnly + 1.1, 0.4, 0.15);
  fade(fvL, 1, 0, T('b2~Softmax') - 0.2, 0.3);
  fade(fvN, 1, 0, tB3, 0.35);

  // ================================================================ b2: the output projection, the scores, one pick
  const MX = 800, MW = 80, MY = 220, MH = 740, MC = [MX + MW / 2, MY + MH / 2];
  const mat = S.g();
  S.rect({ x: MX, y: MY, w: MW, h: MH, r: 6, fill: '#0c1326' }, mat);
  S.rect({ x: MX, y: MY, w: MW, h: MH, r: 6, fill: 'url(#card-neutral)', stroke: 'white', strokeOpacity: 0.3, sw: 2 }, mat);
  ch08Texture(S, { x: MX + 6, y: MY + 8, w: MW - 12, h: MH - 16, cols: 6, rows: 60, seed: 812 }, mat);
  const mClip = S.el('clipPath', { id: 'ch08s12-mat' }, S.el('defs', {}));
  const mCR = S.el('rect', { x: MX - 4, y: MY - 4, width: MW + 8, height: 0 }, mClip);
  mat.setAttribute('clip-path', 'url(#ch08s12-mat)');
  const tOP = T('b2~output') - 0.1;
  whole(t => mCR.setAttribute('height', ((MH + 8) * EIO(cl((t - tOP) / 0.8))).toFixed(1)));
  const matG = S.g();          // the matrix and its fixed labels move together in b3
  matG.appendChild(mat);
  const mName = S.text('output projection', { x: MC[0], y: 194, size: 28, weight: 700, anchor: 'middle', color: 'ink' });
  const nums = S.g();
  [['0', MY + 14], ['1', MY + 36], ['2', MY + 58], ['⋮', MY + 100], ['128,255', MY + MH - 14]].forEach(([s, y]) => S.text(s, { x: MX + MW + 12, y, size: 20, weight: 600, family: 'mono', color: 'muted' }, nums));
  ch08Hide([mName, nums]);
  fade(mName, 0, 1, tOP + 0.2, 0.4);
  fade(nums, 0, 1, tOP + 0.6, 0.4);
  fade([mName, nums], 1, 0, tB3, 0.35);
  // b3: station 'output projection' (centre 830, 640, x0.27); b4: gone
  track(matG, [K(tB3, { x: 0, y: 0, s: 1 }), K(tB3 + 0.8, { x: 830 - MC[0], y: 640 - MC[1], s: 0.27 }), K(tB4, { x: 830 - MC[0], y: 640 - MC[1], s: 0.27, o: 1 }), K(tB4 + 0.4, { x: 830 - MC[0], y: 640 - MC[1], s: 0.27, o: 0 })], MC[0], MC[1]);
  // coral particles stream out of the rows: read in full, every token
  const tRead = T('b2~read') - 0.1, tSwEnd = T('b2~scores') + 0.1;
  const parts = S.g();
  parts.setAttribute('data-audit', 'ignore');
  const pr = S.rand(1212);
  const pts = Array.from({ length: 70 }, () => ({ y: MY + 10 + pr() * (MH - 20), ph: pr(), el: S.circle({ x: MX, y: 0, r: 3.5, fill: 'bytes', opacity: 0 }, parts) }));
  whole(t => {
    const on = cl((t - tRead) / 0.4) * (1 - cl((t - tSwEnd) / 0.5));
    pts.forEach(p => {
      const u = ((t / 1.3 + p.ph) % 1);
      p.el.setAttribute('cx', (MX + MW + 10 + u * 120).toFixed(1));
      p.el.setAttribute('cy', p.y.toFixed(1));
      p.el.setAttribute('opacity', (on * 0.85 * Math.min(1, u * 6, (1 - u) * 3)).toFixed(3));
    });
  });
  const every = S.pill('every row, every token', { x: MC[0], y: 1006, tone: 'bytes', size: 22, h: 40 });
  ch08Hide(every);
  fade(every, 0, 1, tRead + 0.3, 0.4);
  fade(every, 1, 0, tSwEnd, 0.35);
  // the sweep: a line runs down every row; the amber strip fills in step
  const tSw = T('b2~about') - 0.2;
  const SXs = 1060, SWs = 30;
  const strip = S.g();
  S.rect({ x: SXs, y: MY, w: SWs, h: MH, r: 4, fill: '#120f08', stroke: 'compute', strokeOpacity: 0.6, sw: 2 }, strip);
  const sFill = S.g(null, strip);
  ch08Texture(S, { x: SXs + 3, y: MY + 3, w: SWs - 6, h: MH - 6, cols: 1, rows: 90, seed: 77, tone: 'compute', ops: [0.25, 0.55, 0.9], m: 0.1 }, sFill);
  const sClip = S.el('clipPath', { id: 'ch08s12-strip' }, S.el('defs', {}));
  const sCR = S.el('rect', { x: SXs - 2, y: MY - 2, width: SWs + 4, height: 0 }, sClip);
  sFill.setAttribute('clip-path', 'url(#ch08s12-strip)');
  const sLab = S.text('score every token', { x: SXs + SWs + 22, y: 570, size: 26, weight: 700, color: 'compute' });
  const sNum = S.text('about 128,000 numbers', { x: SXs + SWs + 22, y: 606, size: 22, weight: 600, color: 'muted' });
  ch08Hide([strip, sLab, sNum]);
  fade(strip, 0, 1, tSw - 0.3, 0.3);
  fade([sLab, sNum], 0, 1, tSw + 0.4, 0.4, 0.2);
  const sweep = S.g();
  const swLine = S.path({ d: `M${MX - 6},0 H${SXs + SWs + 6}`, stroke: 'white', sw: 2.5 }, sweep);
  const beam = S.path({ d: '', stroke: 'struct', strokeOpacity: 0.7, sw: 2 }, sweep);
  sweep.setAttribute('data-audit', 'ignore');
  whole(t => {
    const k = cl((t - tSw) / (tSwEnd - tSw)), y = MY + MH * k, on = cl((t - tSw) / 0.2) * (1 - cl((t - tSwEnd) / 0.3));
    swLine.setAttribute('transform', `translate(0,${y.toFixed(1)})`);
    beam.setAttribute('d', `M${680 + 30},600 L${MX},${y.toFixed(1)}`);
    sweep.setAttribute('opacity', (0.85 * on).toFixed(3));
    sCR.setAttribute('height', ((MH + 4) * k).toFixed(1));
  });
  // Softmax: the strip gives way to a few share bars; one pill drops out
  const tSm = T('b2~Softmax') - 0.1;
  fade([strip, sLab, sNum], 1, 0, tSm, 0.4);
  const HS = [10, 6, 190, 14, 5, 9, 4], BX0 = 1240, BB = 760;
  const bars = S.g();
  const barEls = HS.map((h, i) => S.rect({ x: BX0 + i * 36, y: BB, w: 24, h: 0, r: 3, fill: 'compute', fillOpacity: i === 2 ? 1 : 0.6 }, bars));
  S.path({ d: `M${BX0 - 12},${BB} H${BX0 + 6 * 36 + 36}`, stroke: 'white', strokeOpacity: 0.35, sw: 2 }, bars);
  const shL = small('shares', BX0 + 3 * 36 + 12, BB + 30);
  bars.appendChild(shL);
  ch08Hide(bars);
  fade(bars, 0, 1, tSm + 0.1, 0.3);
  whole(t => barEls.forEach((b, i) => { const h = HS[i] * E('power3.out')(cl((t - tSm - 0.2 - 0.04 * i) / 0.6)); b.setAttribute('y', (BB - h).toFixed(1)); b.setAttribute('height', h.toFixed(1)); }));
  fade(bars, 1, 0, tB3, 0.35);
  // the pick: from the tall bar to 'pick one'; b3 to the path's last station, then round to the input row
  const PICK = 'purred', pkW = S.measure(PICK, { size: 24, weight: 600 }) + 44;
  const pk = S.pill(PICK, { x: 0, y: 0, tone: 'struct', size: 24, h: 40, style: 'solid' });
  const tPk = T('b2~one') - 0.1, tApp = T('b3~appended') - 0.1;
  const slotX = rowEnd + pkW / 2;
  const P0 = [1040, 640], P1 = [1260, 700], P2 = [1240, RY], P3 = [slotX, RY];
  const bez = (u, a, b, c, d) => (1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * b + 3 * (1 - u) * u * u * c + u ** 3 * d;
  whole(t => {
    let x, y, o = 1;
    const k1 = EIO(cl((t - tPk) / 0.7)), k2 = EIO(cl((t - tB3) / 0.8)), k3 = EIO(cl((t - tApp) / 1.2));
    if (t < tPk) o = 0;
    x = lerp(BX0 + 2 * 36 + 12, 1620, k1); y = lerp(BB - 200, 600, k1) - 60 * Math.sin(Math.PI * k1);
    if (k2 > 0) { x = lerp(1620, P0[0], k2); y = lerp(600, P0[1], k2); }
    if (k3 > 0) { x = bez(k3, P0[0], P1[0], P2[0], P3[0]); y = bez(k3, P0[1], P1[1], P2[1], P3[1]); }
    if (t > tB4) o = 1 - cl((t - tB4) / 0.4);
    pk.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
    pk.setAttribute('opacity', o.toFixed(3));
    pk.style.visibility = o > 0.002 ? 'inherit' : 'hidden';
  });
  S.add(ch08Ignore(pk, 0.9), tB3);
  S.add(ch08Ignore(pk, 1.3), tApp);
  const pkN = small('pick one', 1620, 548, { size: 26, weight: 700, color: 'ink' }), pkL = small('1 token', 1620, 652);
  ch08Hide([pkN, pkL]);
  fade([pkN, pkL], 0, 1, tPk + 0.5, 0.35, 0.15);
  fade([pkN, pkL], 1, 0, tB3, 0.3);

  // ================================================================ b3: one straight path
  const path = S.g();
  const boxA = S.g(null, path);
  S.rect({ x: 130, y: 600, w: 260, h: 80, r: 14, fill: 'url(#card-struct)', stroke: 'struct', sw: 2 }, boxA);
  S.text('embedding lookup', { x: 260, y: 641, size: 26, weight: 700, anchor: 'middle', color: 'ink' }, boxA);
  S.rect({ x: 816, y: 538, w: 28, h: 204, r: 5, fill: 'none', stroke: 'white', strokeOpacity: 0.55, sw: 2 }, path);   // frames the shrunken matrix
  const arr = (x1, y1, x2, y2) => S.arrow({ x1, y1, x2, y2, color: 'muted', sw: 2.5 }, path);
  const arrows = [arr(260, RY - 24, 260, 688), arr(394, 640, 478, 640), arr(680, 640, 806, 640), arr(852, 640, 984, 640)];
  const lB = S.text('80 layers', { x: 580, y: 752, size: 24, weight: 650, anchor: 'middle', color: 'ink' }, path);
  const lC = S.text('output projection', { x: 830, y: 770, size: 24, weight: 650, anchor: 'middle', color: 'ink' }, path);
  const lD = S.text('pick one', { x: 1040, y: 690, size: 24, weight: 650, anchor: 'middle', color: 'ink' }, path);
  ch08Hide(path);
  fade(path, 0, 1, tB3 + 0.5, 0.45);
  fade(path, 1, 0, tB4, 0.4);
  // each station lights as named, and again after 'appended'
  const glow = (x, y, w, h) => { const r = S.rect({ x, y, w, h, r: 16, fill: 'none', stroke: 'white', sw: 3, opacity: 0 }, path); r.setAttribute('data-audit', 'ignore'); return r; };
  const glows = [glow(122, 592, 276, 96), glow(480, 545, 200, 190), glow(808, 530, 44, 220), glow(982, 612, 116, 56)];
  const cues = ['b3~Embedding', 'b3~eighty', 'b3~output', 'b3~pick'];
  const tAgain = T('b3~next') - 0.1;
  whole(t => glows.forEach((g, i) => {
    const pulse = t0 => { const u = (t - t0) / 0.7; return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0; };
    g.setAttribute('opacity', (0.85 * Math.max(pulse(T(cues[i]) - 0.15), pulse(tAgain + 0.35 * i))).toFixed(3));
  }));
  const fwd = S.bracket({ x1: 130, x2: 1098, y: 470, up: true, label: 'one forward pass', tone: 'struct', size: 30 });
  const arith = small('arithmetic on arrays of numbers', 614, 508, { size: 24 });
  ch08Hide([fwd, arith]);
  fade(fwd, 0, 1, T('b3~that') - 0.1, 0.4);
  fade(arith, 0, 1, T('b3~arithmetic') - 0.1, 0.4);
  fade([fwd, arith], 1, 0, tB4, 0.4);
  // the return arrow
  const ret = S.path({ d: `M${P0[0] + pkW / 2 + 6},${P0[1] + 12} C${P1[0]},${P1[1]} ${P2[0]},${P2[1]} ${slotX + pkW / 2 + 16},${RY}`, stroke: 'struct', sw: 2.5, dash: '9 7' });
  ret.setAttribute('data-audit', 'ignore');
  const retL = S.text('append, go round again', { x: 1250, y: 880, size: 26, weight: 650, color: 'struct' });
  ch08Hide([ret, retL]);
  fade(ret, 0, 1, tApp - 0.3, 0.35);
  fade(retL, 0, 1, tApp, 0.4);
  fade([ret, retL], 1, 0, tB4, 0.4);

  // ================================================================ b4: the weights are the model
  const tiles = S.g();
  const TP = [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1]];
  TP.forEach(([c, r], i) => ch08WeightTile(S, { x: 1080 + c * 90, y: 440 + r * 100, w: 70, h: 70, r: 10, seed: 900 + 13 * i, cols: 6, rows: 6 }, tiles));
  const t7 = T('b4~Seven') - 0.05;
  track(tiles, [K(t7 + 0.2, { o: 0, s: 0.9 }), K(t7 + 0.7, { o: 1, s: 1, e: 'back.out(1.5)' }), K(tColl, { x: 0, y: 0, s: 1, o: 1 }),
    K(tColl + 0.6, { x: 820 - 1245, y: 465 - 525, s: 0.1, o: 0, e: 'power2.in' })], 1245, 525);
  S.add(ch08Ignore(tiles, 0.7), tColl);
  const l7 = S.text('7 per layer', { x: 1245, y: 404, size: 30, weight: 700, anchor: 'middle', color: 'ink' });
  const l6 = small('6 in the classic design', 1245, 650, { size: 24 });
  const l80 = S.text('times 60 to 100+ layers', { x: 540, y: 560, size: 30, weight: 650, anchor: 'end', color: 'ink' });
  const capW = S.text('the weights are the model', { x: 960, y: 880, size: 48, weight: 750, family: 'display', anchor: 'middle', color: 'ink' });
  ch08Hide([l7, l6, l80, capW]);
  fade(l7, 0, 1, t7 + 0.5, 0.4);
  fade(l6, 0, 1, T('b4~six') - 0.1, 0.4);
  fade(l80, 0, 1, T('b4~times') - 0.1, 0.4);
  fade(capW, 0, 1, T('b4~are') - 0.1, 0.5);
  fade([l7, l6, l80, capW], 1, 0, tColl, 0.35);
  // the number, over a fraction bar, with a '×' slot
  const num = S.g();
  S.rect({ x: 480, y: 408, w: 680, h: 114, r: 18, fill: '#0b1224', stroke: 'compute', sw: 3 }, num);
  S.text('70.6 B parameters', { x: 820, y: 466, size: 64, weight: 800, family: 'display', anchor: 'middle', color: 'struct' }, num);
  track(num, [K(tColl + 0.35, { o: 0, s: 0.85 }), K(tColl + 0.95, { o: 1, s: 1, e: 'back.out(1.4)' })], 820, 465);
  const bar = S.path({ d: 'M470,566 H1170', stroke: 'ink', sw: 4 });
  bar.setAttribute('stroke-dasharray', '700 700');
  const tBar = tColl + 1.0;
  ch08Hide(bar);
  fade(bar, 0, 1, tBar, 0.05);
  whole(t => bar.setAttribute('stroke-dashoffset', (700 * (1 - EIO(cl((t - tBar) / 0.6)))).toFixed(1)));
  const den = S.rect({ x: 730, y: 596, w: 180, h: 76, r: 12, fill: 'none', stroke: 'muted', sw: 2.5, dash: '10 8' });
  const times = S.text('×', { x: 1250, y: 566, size: 64, weight: 700, anchor: 'middle', color: 'ink' });
  const slot = S.rect({ x: 1310, y: 510, w: 170, h: 112, r: 14, fill: 'none', stroke: 'muted', sw: 2.5, dash: '10 8' });
  ch08Hide([den, times, slot]);
  fade(den, 0, 1, tBar + 0.4, 0.4);
  fade([times, slot], 0, 1, tBar + 0.8, 0.4, 0.2);
});
