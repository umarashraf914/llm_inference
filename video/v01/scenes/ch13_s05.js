/* ch13_s05 · the key-value cache (fig 136)
   Left half: a GPU package — die (250, 600), two small HBM stacks above and below it, a bus to one enlarged HBM
   stack (x 560-880, y 310-890) whose teal 'KV cache' region (x 590-850, y 470-870) holds one coral slab per token,
   K half and V half (slab i at y 860 - 21 (i + 1) + 5). Right half: the panel 'Each decode step' (three boxes),
   then b3's counters, b3's racks, b4's staircase (rows 4 … 8). Coral particles always mean the cache being read.
   Passes of the loop (compute, append, read): one in b2 on its words, three in b3 (faster each time), two in b4
   (each adding a staircase row). The cache: 6 slabs, then 7 … 12.
   b1  package; 'the running record' slabs in the stack, split into K and V; push into the stack: 'KV cache'.
   b2  ease back; the panel; compute (a slab on the die), append (it slides along the bus to the top), read.
   b3  three faster passes; 'K and V computed: 1,000' against a struck 499,500; 'quadratic → linear'; four racks,
       each with a 'KV cache' badge; 'obvious once seen'.
   b4  the read stream thickens; the staircase from scene 1, rows added in step with new slabs; 'reads: still
       growing'.
   b5  all but the cache region and its stream dims; takeaway; 'why so many later fixes exist'. */
V.scene('ch13_s05', S => {
  const K = libKit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1, tB5 = T('b5') - 0.1;

  // ================================================================ the package (left half), inside a camera group
  const world = S.g();
  const back = S.g(null, world);
  const sub = S.rect({ x: 90, y: 290, w: 820, h: 610, r: 24, fill: '#0e1528', stroke: '#ffffff', strokeOpacity: 0.12, sw: 2 }, back);
  const smallStack = (x, y) => {
    const g = S.g(null, back);
    S.rect({ x, y, w: 110, h: 110, r: 10, fill: '#2a1418', stroke: 'bytes', strokeOpacity: 0.8, sw: 2 }, g);
    for (let i = 1; i < 6; i++) S.path({ d: `M${x + 8},${y + i * 110 / 6} H${x + 102}`, stroke: 'bytes', strokeOpacity: 0.35, sw: 1.5 }, g);
    return g;
  };
  smallStack(195, 325); smallStack(195, 765);
  const bus = S.g(null, back);
  S.rect({ x: 352, y: 555, w: 216, h: 90, r: 12, fill: '#140c14', stroke: 'bytes', strokeOpacity: 0.6, sw: 2 }, bus);
  [580, 600, 620].forEach(y => S.path({ d: `M360,${y} H560`, stroke: 'bytes', strokeOpacity: 0.12, sw: 1 }, bus));
  const die = libChip(S, { x: 250, y: 600, size: 190, tone: 'compute', state: 'on', seed: 5 }, back);
  const big = S.g(null, back);
  S.rect({ x: 560, y: 310, w: 320, h: 580, r: 16, fill: '#1d1016', stroke: 'bytes', sw: 2.5 }, big);
  S.text('HBM', { x: 720, y: 344, size: 28, weight: 800, anchor: 'middle', color: 'bytes' }, big);
  S.text('weights', { x: 720, y: 392, size: 22, weight: 600, anchor: 'middle', color: 'muted' }, big);
  S.path({ d: 'M590,418 H850', stroke: 'bytes', strokeOpacity: 0.25, sw: 1.5, dash: '6 6' }, big);
  const region = S.rect({ x: 590, y: 466, w: 260, h: 408, r: 10, stroke: 'helps', sw: 2.5 }, world);
  const regionL = S.text('KV cache', { x: 720, y: 444, size: 28, weight: 800, anchor: 'middle', color: 'helps' }, world);
  hide(regionL);
  hide(world);
  fade(world, 0, 1, 0.2, 0.5);
  void sub; void die;

  // ---------------------------------------------------------------- the slabs: 6 at the start, one per pass after
  const SX = 600, SW = 240, SH = 16, slotY = i => 860 - 21 * (i + 1) + 5;
  const slabs = S.g(null, world);
  const mkSlab = (parent) => {
    const g = S.g(null, parent);
    g.k = S.rect({ x: -SW / 2, y: -SH / 2, w: SW / 2 - 1, h: SH, r: 3, fill: 'url(#solid-bytes)' }, g);
    g.v = S.rect({ x: 1, y: -SH / 2, w: SW / 2 - 1, h: SH, r: 3, fill: 'url(#solid-bytes)' }, g);
    g.vEdge = S.path({ d: `M${SW / 2 - 1},${-SH / 2 + 2} V${SH / 2 - 2}`, stroke: '#ffb3b3', sw: 2 }, g);
    return g;
  };
  const tRec = T('b1~running') - 0.1, tKeys = T('b1~keys') - 0.1, tH = T('b1~H') - 0.2;
  const first = [0, 1, 2, 3, 4, 5].map(i => {
    const g = mkSlab(slabs);
    g.setAttribute('transform', `translate(${SX + SW / 2},${slotY(i) + SH / 2})`);
    hide(g);
    fade(g, 0, 1, tRec + 0.06 * i, 0.3);
    return g;
  });
  // 'keys and values': each slab splits into a K half and a V half (the V half darkens and steps off by 4 px)
  const splitK = t => EIO(cl((t - tKeys) / 0.5));
  const KVlab = S.g(null, slabs);
  S.text('K', { x: SX + SW / 4, y: 490, size: 22, weight: 800, anchor: 'middle', color: 'bytes' }, KVlab);
  S.text('V', { x: SX + 3 * SW / 4, y: 490, size: 22, weight: 800, anchor: 'middle', color: '#ff9a9a' }, KVlab);
  hide(KVlab);
  fade(KVlab, 0, 1, tKeys + 0.3, 0.35);
  // the running record, already in its stack; on 'H B M' its region becomes 'KV cache'
  const rec = S.g(null, world);
  S.icon('ph:notepad-duotone', { x: 720, y: 650, size: 64, color: 'bytes' }, rec);
  S.text('the running record', { x: 720, y: 560, size: 26, weight: 750, anchor: 'middle', color: 'bytes' }, rec);
  hide(rec);
  fade(rec, 0, 1, tRec + 0.2, 0.4);
  fade(rec, 1, 0, tH, 0.4);
  K.draw(region, 1400, tH + 0.6, 0.6);
  fade(regionL, 0, 1, tH + 0.8, 0.35);
  // the camera: push into the stack on 'H B M', ease back at b2
  K.track(world, [K.K(tH, { s: 1 }), K.K(tH + 0.9, { s: 1.3 }), K.K(tB2 + 0.1, { s: 1.3 }), K.K(tB2 + 1.1, { s: 1 })], 720, 600);

  // ---------------------------------------------------------------- the passes: compute → append → read
  const PASS = [
    { c: T('b2~computes') - 0.1, a: T('b2~appends') - 0.1, r: T('b2~reads') - 0.1, slide: 0.8 },
    { c: 16.8, a: 17.45, r: 17.95, slide: 0.45 },
    { c: 18.75, a: 19.25, r: 19.65, slide: 0.38 },
    { c: 20.25, a: 20.6, r: 20.9, slide: 0.3 },
    { c: T('b4~staircase') + 0.15, a: T('b4~staircase') + 0.5, r: T('b4~staircase') + 0.8, slide: 0.3 },
    { c: T('b4~step') - 0.4, a: T('b4~step') - 0.05, r: T('b4~step') + 0.25, slide: 0.3 },
  ];
  const nAt = t => 6 + PASS.filter(p => t >= p.a + p.slide).length;
  // a pass's slab: on the die at c, along the bus at a, into its slot
  const mover = S.g(null, world);
  PASS.forEach((p, j) => {
    const g = mkSlab(mover), i = 6 + j;
    const pts = [[250, 600], [568, 600], [720, slotY(i) + SH / 2]];
    const seg = [Math.hypot(318, 0), Math.hypot(152, pts[2][1] - 600)], tot = seg[0] + seg[1];
    const glow = S.rect({ x: -SW / 2 - 8, y: -SH / 2 - 8, w: SW + 16, h: SH + 16, r: 8, fill: 'url(#pglow-compute)', opacity: 0 }, g);
    glow.setAttribute('data-audit', 'ignore');
    g.insertBefore(glow, g.firstChild);
    whole(t => {
      if (t < p.c) { setO(g, 0); return; }
      const q = EIO(cl((t - p.a) / p.slide)) * tot;
      const [x, y] = q <= seg[0] ? [lerp(pts[0][0], pts[1][0], q / seg[0]), 600] : [lerp(pts[1][0], pts[2][0], (q - seg[0]) / seg[1]), lerp(600, pts[2][1], (q - seg[0]) / seg[1])];
      const s = lerp(0.6, 1, cl((q - seg[0]) / seg[1])) * (0.4 + 0.6 * E('back.out(2)')(cl((t - p.c) / 0.35)));
      g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s.toFixed(3)})`);
      glow.setAttribute('opacity', (0.9 * (1 - cl((t - p.a) / 0.4))).toFixed(3));
      setO(g, cl((t - p.c) / 0.15));
    });
  });
  whole(t => {
    const k = splitK(t);
    [...first, ...mover.children].forEach(g => {
      if (!g.v) return;
      const kk = g.parentNode === mover ? 1 : k;
      g.v.setAttribute('x', (1 + 3 * kk).toFixed(1));
      g.v.setAttribute('fill', kk > 0.5 ? '#9b3a44' : 'url(#solid-bytes)');
      g.vEdge.setAttribute('transform', `translate(${(3 * kk).toFixed(1)},0)`);
      g.vEdge.setAttribute('opacity', kk.toFixed(2));
    });
  });

  // ---------------------------------------------------------------- the read stream: every slab back to the die
  const parts = S.g(null, world);
  parts.setAttribute('data-audit', 'ignore');
  const rnd = S.rand(31), RATE = 0.9;
  const P = Array.from({ length: 90 }, (_, k) => ({ ph: rnd(), rank: k / 90, lane: (rnd() - 0.5) * 60, el: S.rect({ x: -4, y: -1.5, w: 8, h: 3, r: 1, fill: 'bytes', opacity: 0 }, parts) }));
  const hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  const tThick = T('b4~reads') - 0.1;
  whole(t => {
    let I = 0.4 * cl((t - PASS[0].r) / 0.4) + 0.6 * cl((t - tThick) / 1.6);
    PASS.forEach(p => { const q = (t - p.r) / 0.6; if (q > 0 && q < 1) I += 0.35 * Math.sin(Math.PI * q); });
    P.forEach((p, k) => {
      const c = Math.floor(t * RATE + p.ph), u = (t * RATE + p.ph) - c, te = (c - p.ph) / RATE;
      const n = nAt(te), s = Math.floor(hash(c, k) * n);
      const x0 = SX + 10 + hash(k, c) * (SW - 20), y0 = slotY(s) + SH / 2;
      let x, y;
      if (u < 0.4) { const q = u / 0.4; x = lerp(x0, 570, q); y = lerp(y0, 600 + p.lane * 0.6, q); }
      else { const q = (u - 0.4) / 0.6; x = lerp(570, 362, q); y = 600 + p.lane * 0.6; }
      p.el.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      p.el.setAttribute('opacity', (p.rank < I ? 0.9 * Math.min(1, u * 10, (1 - u) * 10) : 0).toFixed(3));
    });
  });

  // ================================================================ the panel 'Each decode step' (right half)
  const panel = S.g();
  const pf = S.rect({ x: 990, y: 180, w: 880, h: 200, r: 20, fill: '#0c1326', fillOpacity: 0.85, stroke: '#ffffff', strokeOpacity: 0.14, sw: 2 }, panel);
  S.text('Each decode step', { x: 1430, y: 220, size: 30, weight: 750, anchor: 'middle', color: 'ink' }, panel);
  const BOX = [[['compute one', 'K and V'], 'compute', 1010], [['append', 'to cache'], 'helps', 1305], [['read the', 'whole cache'], 'bytes', 1600]];
  const lit = BOX.map(([txt, tone, x]) => {
    S.rect({ x, y: 262, w: 250, h: 84, r: 14, stroke: tone, strokeOpacity: 0.4, sw: 2 }, panel);
    const on = S.rect({ x, y: 262, w: 250, h: 84, r: 14, fill: `url(#card-${tone})`, stroke: tone, sw: 3, opacity: 0 }, panel);
    const glow = S.rect({ x: x - 12, y: 250, w: 274, h: 108, r: 20, fill: `url(#pglow-${tone})`, opacity: 0 }, panel);
    glow.setAttribute('data-audit', 'ignore');
    panel.insertBefore(glow, on);
    const tx = S.g(null, panel);
    txt.forEach((line, j) => S.text(line, { x: x + 125, y: 290 + 30 * j, size: 24, weight: 700, anchor: 'middle', color: tone }, tx));
    return { on, glow, tx };
  });
  S.path({ d: 'M1266,304 H1294 M1286,297 L1295,304 L1286,311 M1561,304 H1589 M1581,297 L1590,304 L1581,311', stroke: 'muted', sw: 2.5 }, panel);
  hide(panel);
  fade(panel, 0, 1, tB2 + 0.3, 0.5);
  void pf;
  // which box is lit: amber from c to a, teal from a to r, coral from r to the next c
  const tReadsB4 = T('b4~reads') - 0.1;
  whole(t => {
    const lv = [0, 0, 0];
    PASS.forEach((p, j) => {
      const nx = PASS[j + 1] ? PASS[j + 1].c : 1e9;
      const win = (a, b) => cl((t - a) / 0.15) * (1 - cl((t - b) / 0.15));
      lv[0] = Math.max(lv[0], win(p.c, p.a)); lv[1] = Math.max(lv[1], win(p.a, p.r)); lv[2] = Math.max(lv[2], win(p.r, nx));
    });
    lit.forEach((b, i) => { b.on.setAttribute('opacity', lv[i].toFixed(3)); b.tx.setAttribute('opacity', (0.55 + 0.45 * lv[i]).toFixed(3)); });
    const q = (t - tReadsB4) / 0.8;
    lit[2].glow.setAttribute('opacity', (q > 0 && q < 1 ? 0.9 * Math.sin(Math.PI * q) : 0).toFixed(3));
  });

  // ================================================================ b3: made once; every serving system
  const tMade = T('b3~made') - 0.1, tQuad = T('b3~quadratic') - 0.1, tEvery = T('b3~Every') - 0.1;
  const cnt = S.g();
  const cA = S.text('K and V computed:', { x: 1010, y: 520, size: 30, weight: 700, color: 'helps' }, cnt);
  const cN = S.text('0', { x: 1010 + S.measure('K and V computed:', { size: 30, weight: 700 }) + 16, y: 520, size: 34, weight: 800, family: 'mono', color: 'helps' }, cnt);
  const old = S.text('499,500', { x: 1560, y: 520, size: 34, weight: 800, family: 'mono', color: 'compute' }, cnt);
  const strike = S.path({ d: 'M1550,522 H1720', stroke: 'compute', sw: 4 }, cnt);
  strike.setAttribute('data-audit', 'ignore');
  hide([cA, cN, old]);
  fade([cA, cN], 0, 1, tMade, 0.35);
  whole(t => { cN.textContent = Math.round(1000 * E('power2.out')(cl((t - tMade - 0.2) / 1.0))).toLocaleString('en-US'); });
  fade(old, 0, 1, tMade + 0.5, 0.3);
  K.draw(strike, 180, tMade + 0.9, 0.35);
  const lin = S.pill('K and V work: quadratic → linear', { x: 1430, y: 592, tone: 'helps', size: 24, h: 44 }, cnt);
  hide(lin);
  fade(lin, 0, 1, tQuad, 0.35);
  fade(cnt, 1, 0, tEvery, 0.35);
  const racks = S.g();
  [1090, 1310, 1530, 1750].forEach((x, i) => {
    const g = S.g(null, racks);
    S.icon('ph:hard-drives-duotone', { x, y: 790, size: 96, color: 'muted' }, g);
    S.pill('KV cache', { x, y: 868, tone: 'helps', size: 20, h: 32 }, g);
    K.track(g, [K.K(tEvery + 0.1 + 0.12 * i, { x: 60, o: 0 }), K.K(tEvery + 0.6 + 0.12 * i, { x: 0, o: 1, e: 'power3.out' })]);
  });
  const obv = S.text('obvious once seen', { x: 1420, y: 704, size: 26, weight: 650, anchor: 'middle', color: 'muted' }, racks);
  hide(obv);
  fade(obv, 0, 1, T('b3~practical') - 0.2, 0.4);
  fade(racks, 1, 0, tB4, 0.4);

  // ================================================================ b4: every token still reads the whole cache
  const stG = S.g();
  const st = ch13Staircase(S, { x: 1010, y: 480, rows: [4, 5, 6, 7, 8], size: 20, decorative: true }, stG);
  stG.setAttribute('data-audit', 'ignore');
  const tSt = T('b4~staircase') - 0.15;
  [0, 1, 2].forEach(i => {
    S.add(st.enter(i, { amber: true, d: 0.35, stagger: 0.03 }), tSt + 0.12 * i);
    S.add(st.read(i, { d: 0.3, stagger: 0.05 }), tSt + 0.12 * i + 0.3);
    S.add(st.tag(i), tSt + 0.12 * i + 0.5);
  });
  [3, 4].forEach((i, j) => {
    const at = PASS[4 + j].r;
    S.add(st.enter(i, { amber: true, d: 0.3, stagger: 0.03 }), at - 0.15);
    S.add(st.read(i, { d: 0.28, stagger: 0.04 }), at + 0.15);
    S.add(st.tag(i), at + 0.4);
  });
  const still = S.pill('reads: still growing', { x: 1680, y: 610, tone: 'bytes', size: 26, h: 48 });
  hide(still);
  fade(still, 0, 1, T('b4~reading') - 0.1, 0.35);

  // ================================================================ b5: solves one problem, creates the next
  fade([back, panel, stG, still], 1, 0.25, tB5, 0.6);
  const take = S.takeaway('solves one problem, creates the next', { tone: 'bytes' });
  hide(take);
  fade(take, 0, 1, T('b5~solves') - 0.2, 0.5);
  const later = S.text('why so many later fixes exist', { x: 960, y: 1014, size: 24, weight: 600, anchor: 'middle', color: 'muted' });
  hide(later);
  fade(later, 0, 1, T('b5~so') - 0.1, 0.4);
  void cl; void tB3; void pulse;
});
