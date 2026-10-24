/* ch10_s04 · summing over the whole model (fig 113)
   Checked: one layer = 2 × 8,192² + 2 × 8,192 × 1,024 + 3 × 8,192 × 28,672 = 855,638,016 → '855.6 M'.
   b1  a panel 'one layer: all matrix multiplies'; tiles pop in as named (query, key, value, combine,
       feed-forward 1, feed-forward 2); 'gate' slides in ('our model'); an amber '× 2' clicks onto each.
   b2  the tiles merge into one slab 'one layer: 855.6 M weights', which copies into the stack at the right as
       a counter runs to 80 (each slab with an amber '× 2' mark); caps: 'output projection' (× 2) and
       'embedding' (a grey '?', resolved later); '70 billion parameters'; the formula builds:
       'operations per token = 2 × parameter count'.
   b3  the '× 2' marks ripple up the stack (the '?' stays), the formula glows: 'holds matrix by matrix'; a price
       tag '70B' swings onto the stack: 'nothing else about the architecture'.
   Layout: panel x 110-900, y 220-720; stack x 1230-1530 (slab 1 at y 850, pitch 7); formula y 860. */
V.scene('ch10_s04', S => {
  const K = ch10Kit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;

  // ================================================================ b1: one layer's matrices
  const panel = S.g();
  S.rect({ x: 110, y: 220, w: 790, h: 500, r: 22, fill: '#0b1224', stroke: 'struct', strokeOpacity: 0.55, sw: 2 }, panel);
  S.text('one layer: all matrix multiplies', { x: 140, y: 262, size: 28, weight: 700, color: 'ink' }, panel);
  hide(panel);
  fade(panel, 0, 1, 0.4, 0.5);
  const TW = 160, TH = 100;
  const DEF = [['query', 150, 310, 'b1~query'], ['key', 340, 310, 'b1~key'], ['value', 530, 310, 'b1~value'], ['combine', 720, 310, 'b1~combine'],
    ['feed-forward 1', 150, 500, 'b1~feed'], ['feed-forward 2', 340, 500, 'b1~two'], ['gate', 530, 500, 'b1~three']];
  const tiles = DEF.map(([name, x, y, cue], i) => {
    const g = S.g();
    S.rect({ x, y, w: TW, h: TH, r: 10, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.85, sw: 2 }, g);
    const rnd = S.rand(40 + i);
    let d = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) if (rnd() > 0.45) d += `M${x + 14 + c * 19},${y + 14 + r * 19}h13v13h-13Z`;
    S.path({ d, fill: 'struct', fillOpacity: 0.35 }, g).setAttribute('data-audit', 'ignore');
    S.text(name, { x: x + TW / 2, y: y + TH + 26, size: 24, weight: 650, anchor: 'middle', color: 'ink' }, g);
    g.x2 = S.pill('× 2', { x: x + TW - 38, y: y + 26, tone: 'compute', size: 20, h: 32, style: 'solid', mono: true }, g);
    hide(g.x2);
    Object.assign(g, { cx: x + TW / 2, cy: y + TH / 2, cue });
    return g;
  });
  tiles.forEach((g, i) => {
    const t0 = T(g.cue) - 0.1;
    if (i === 6) K.track(g, [K.K(t0, { x: 240, o: 0 }), K.K(t0 + 0.6, { x: 0, o: 1, e: 'power3.out' })]);
    else K.track(g, [K.K(t0, { s: 0.7, o: 0 }), K.K(t0 + 0.35, { s: 1, o: 1, e: 'back.out(1.6)' })], g.cx, g.cy);
  });
  const ours = S.text('our model', { x: 530 + TW + 16, y: 550, size: 22, weight: 600, color: 'muted' });
  hide(ours);
  fade(ours, 0, 1, T('b1~ours') - 0.1, 0.35);
  const tX2 = T('b1~ours') + 0.05;
  tiles.forEach((g, i) => S.add(K.drive(0.25, k => { setO(g.x2, k); g.x2.setAttribute('transform', `translate(0,${(-14 * (1 - E('back.out(2)')(k))).toFixed(1)})`); }), tX2 + 0.09 * i));

  // ================================================================ b2: add them all
  const tAdd = T('b2~Add') - 0.1;
  // the tiles collapse into one slab
  const merge = S.g();
  tiles.forEach(g => merge.appendChild(g));
  K.track(merge, [K.K(tAdd, { s: 1, o: 1 }), K.K(tAdd + 0.5, { s: 0.25, o: 0, e: 'power2.in' })], 505, 470);
  fade(ours, 1, 0, tAdd, 0.3);
  K.ignore(merge, tAdd, 0.55);
  const slab = S.rect({ x: 150, y: 458, w: 710, h: 24, r: 6, fill: 'url(#solid-struct)' });
  const slabL = S.text('one layer: 855.6 M weights', { x: 505, y: 520, size: 28, weight: 700, anchor: 'middle', color: 'ink' });
  hide([slab, slabL]);
  fade(slab, 0, 1, tAdd + 0.35, 0.3);
  fade(slabL, 0, 1, tAdd + 0.5, 0.35);
  // a copy flies to the stack; the stack builds as a counter runs to 80
  const SX = 1230, SW = 300, SY = k => 850 - (k - 1) * 7;
  const fly = S.rect({ x: 0, y: -12, w: 710, h: 24, r: 6, fill: 'url(#solid-struct)' });
  fly.setAttribute('data-audit', 'ignore');
  const tFly = tAdd + 0.75;
  whole(t => {
    const k = EIO(cl((t - tFly) / 0.6));
    fly.setAttribute('transform', `translate(${lerp(150, SX, k).toFixed(1)},${lerp(470, SY(1), k).toFixed(1)}) scale(${lerp(1, SW / 710, k).toFixed(4)},${lerp(1, 0.2, k).toFixed(3)})`);
    setO(fly, k > 0 && k < 1 ? 1 : 0);
  });
  const stack = S.g();
  stack.setAttribute('data-audit', 'ignore');
  const slabs = [], marks = [];
  for (let k = 1; k <= 80; k++) {
    slabs.push(S.rect({ x: SX, y: SY(k) - 2.2, w: SW, h: 4.4, r: 1.5, fill: 'struct', fillOpacity: 0.65, opacity: 0 }, stack));
    marks.push(S.rect({ x: SX - 20, y: SY(k) - 1.6, w: 12, h: 3.2, r: 1, fill: 'compute', opacity: 0 }, stack));
  }
  const tBuild = tFly + 0.55, BD = 1.4;
  const tRip = T('b3~matrix') - 0.1;
  whole(t => {
    const n = Math.floor(80 * cl((t - tBuild) / BD) + (t >= tBuild ? 1 : 0));
    slabs.forEach((s, i) => s.setAttribute('opacity', i < n ? 1 : 0));
    marks.forEach((m, i) => {
      const u = (t - tRip - i * 0.012) / 0.25;
      m.setAttribute('opacity', (i < n ? 0.75 : 0) + (u > 0 && u < 1 ? 0.25 * Math.sin(Math.PI * u) : 0));
      m.setAttribute('width', (12 + (u > 0 && u < 1 ? 10 * Math.sin(Math.PI * u) : 0)).toFixed(1));
    });
  });
  const cnt = S.text('layers: 0', { x: SX + SW / 2, y: 936, size: 28, weight: 700, family: 'mono', anchor: 'middle', color: 'ink' });
  hide(cnt);
  fade(cnt, 0, 1, tBuild - 0.1, 0.25);
  whole(t => { cnt.textContent = `layers: ${Math.max(1, Math.min(80, Math.floor(1 + 79 * cl((t - tBuild) / BD))))}`; });
  // the caps: output projection (× 2) on top, embedding (?) underneath
  const capO = S.g(), capE = S.g();
  S.rect({ x: SX, y: 262, w: SW, h: 14, r: 4, fill: 'url(#solid-struct)' }, capO);
  S.text('output projection', { x: SX + SW + 20, y: 269, size: 24, weight: 650, color: 'ink' }, capO);
  S.text('× 2', { x: SX - 28, y: 269, size: 22, weight: 750, family: 'mono', anchor: 'end', color: 'compute' }, capO);
  S.rect({ x: SX, y: 868, w: SW, h: 14, r: 4, fill: 'url(#solid-struct)' }, capE);
  S.text('embedding', { x: SX + SW + 20, y: 875, size: 24, weight: 650, color: 'ink' }, capE);
  const qE = S.text('?', { x: SX - 28, y: 876, size: 26, weight: 800, anchor: 'end', color: 'muted' }, capE);
  hide([capO, capE]);
  fade(capE, 0, 1, T('b2~embedding') - 0.1, 0.4);
  fade(capO, 0, 1, T('b2~output') - 0.1, 0.4);
  const params = S.text('70 billion parameters', { x: SX + SW / 2, y: 212, size: 32, weight: 750, anchor: 'middle', color: 'struct' });
  hide(params);
  fade(params, 0, 1, T('b2~projection') + 0.3, 0.4);
  // the formula
  const FY = 860, FS = 40;
  const parts = [['operations per token', 'ink', 'b2~operations'], ['=', 'ink', 'b2~are'], ['2', 'compute', 'b2~twice'], ['×', 'ink', 'b2~the#3'], ['parameter count', 'struct', 'b2~parameter']];
  const widths = parts.map(([s]) => S.measure(s, { size: FS, weight: 750 })), gap = 18;
  let fx = 505 - (widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1)) / 2;
  const fEls = parts.map(([s, c, cue], i) => { const e = S.text(s, { x: fx, y: FY, size: FS, weight: 750, color: c }); fx += widths[i] + gap; hide(e); fade(e, 0, 1, T(cue) - 0.1, 0.3); return e; });
  const fGlow = S.rect({ x: 505 - 430, y: FY - 36, w: 860, h: 72, r: 16, fill: 'compute', opacity: 0 });
  fGlow.setAttribute('data-audit', 'ignore');

  // ================================================================ b3: it survives the sum
  pulse(fGlow, tRip + 0.3, 0.16, 1.0);
  const holds = S.text('holds matrix by matrix', { x: 505, y: 924, size: 26, weight: 600, anchor: 'middle', color: 'muted' });
  hide(holds);
  fade(holds, 0, 1, tRip + 0.4, 0.4);
  // a price tag swings onto the stack: 70B
  const tTag = T('b3~advertises') - 0.1;
  const PT = [SX + SW + 40, 520];
  const tag = S.g();
  S.path({ d: `M${SX + SW - 4},${PT[1] - 30} L${PT[0]},${PT[1]}`, stroke: 'muted', sw: 2 }, tag);
  S.path({ d: `M${PT[0]},${PT[1]} L${PT[0] + 26},${PT[1] - 30} H${PT[0] + 150} V${PT[1] + 30} H${PT[0] + 26} Z`, fill: '#1b1608', stroke: 'compute', sw: 2.5 }, tag);
  S.circle({ x: PT[0] + 20, y: PT[1], r: 5, fill: '#060a14', stroke: 'compute', sw: 2 }, tag);
  S.text('70B', { x: PT[0] + 92, y: PT[1] + 1, size: 32, weight: 800, anchor: 'middle', color: 'compute' }, tag);
  whole(t => {
    const k = cl((t - tTag) / 0.9), a = -55 * (1 - E('elastic.out(1, 0.45)')(k));
    tag.setAttribute('transform', `rotate(${a.toFixed(2)} ${PT[0]} ${PT[1]})`);
    setO(tag, cl((t - tTag) / 0.15));
  });
  K.ignore(tag, tTag, 0.9);
  const own = S.g();
  S.text('nothing else about', { x: PT[0] + 80, y: PT[1] + 66, size: 24, weight: 600, anchor: 'middle', color: 'muted' }, own);
  S.text('the architecture', { x: PT[0] + 80, y: PT[1] + 96, size: 24, weight: 600, anchor: 'middle', color: 'muted' }, own);
  hide(own);
  fade(own, 0, 1, T('b3~on#2') - 0.1, 0.4);
  void qE; void lerp;
});
