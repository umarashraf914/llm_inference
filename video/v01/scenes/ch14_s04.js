/* ch14_s04 · measured, not asserted (fig 43)
   The demo's measured distances between token 5's keys in the two runs (one tiny 4-layer transformer, random
   weights, token 2 changed): layer 1 0.000000, layer 2 3.538930, layer 3 16.746760, layer 4 20.102747. Bars to
   linear scale, 20.102747 = 500 px: 0, 88, 416.5, 500 px.
   b1  the model icon (four slabs) and its label; tags causal attention, feed-forward, residual; the two run
       strips above it pass down through it, each leaving a faint trace; XX glows violet.
   b2  the eight-cell keys of run 1 (blue) and run 2 (violet); per-number amber differences; they stack into one
       'distance' beside the ruler; '0 = every number matched', 'schematic'; the demo shrinks away; header and
       four empty rows.
   b3  rows fill as spoken, layer 1 at the bottom: identical, then three growing violet bars; a white arrow up
       the bar tips: 'as the mixing compounds', 'this run'.
   b4  'random weights, never trained'; rows 2-4 scramble and settle while row 1 holds still; marks; caption.
   Layout: left third x 80-500 (strips y 300 / 370, model y 470-675, tags y 790-900); table rows (layer 4 at top)
   y 360 / 470 / 580 / 690: label x 760, readout x 880, bar x 1140-1640, status x 1676. */
V.scene('ch14_s04', S => {
  const K = libKit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1;
  const VIOLET = S.tone('violet');
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };

  // ================================================================ b1: a tiny transformer, run twice
  const left = S.g();
  const MX = 290;
  const tChk = T('b1~check') - 0.1;
  const model = S.g(null, left);
  for (let i = 0; i < 4; i++) {
    const y = 635 - 55 * i;
    const sl = S.rect({ x: MX - 170, y, w: 340, h: 40, r: 10, fill: 'url(#card-struct)', stroke: 'struct', sw: 2 }, model);
    K.track(sl, [K.K(tChk + 0.12 * i, { y: 20, o: 0 }), K.K(tChk + 0.12 * i + 0.4, { y: 0, o: 1, e: 'power3.out' })]);
  }
  const mL = S.text('tiny transformer: 4 layers', { x: MX, y: 720, size: 28, weight: 700, anchor: 'middle', color: 'ink' }, left);
  rise(mL, tChk + 0.5);
  const tags = [['causal attention', 'ph:eye-duotone', 'b1~causal'], ['feed-forward', 'ph:fast-forward-duotone', 'b1~feed'], ['residual', 'ph:arrow-bend-double-up-right-duotone', 'b1~residual']].map(([s, ic, cue], i) => {
    const g = ch14Tag(S, s, { x: MX, y: 790 + 56 * i, icon: ic, size: 24 }, left);
    rise(g, T(cue) - 0.1, 10, 0.35);
    return g;
  });
  fade(tags, 1, 0, T('b1~changed') + 0.3, 0.4);
  const strip = (y, name, changed, at) => {
    const g = S.g(null, left);
    S.text(name, { x: 82, y, size: 24, weight: 700, color: 'muted' }, g);
    const ps = ['t1', changed ? 'XX' : 't2', 't3', 't4', 't5'].map((s, j) => {
      const p = S.g(null, g);
      libToken(S, { text: s, x: 214 + 60 * j, y, size: 24, w: 52, state: changed && j === 1 ? 'changed' : 'token' }, p);
      return p;
    });
    rise(g, at, -10, 0.35);
    return { g, ps };
  };
  const tRun = T('b1~run') - 0.1;
  const r1 = strip(300, 'run 1', false, tRun), r2 = strip(370, 'run 2', true, tRun + 0.25);
  // each run passes down through the model, leaving a faint trace
  [r1, r2].forEach((r, i) => {
    const at = tRun + 0.6 + 0.8 * i, y0 = i ? 370 : 300;
    const ghost = S.g(null, left);
    ghost.setAttribute('data-audit', 'ignore');
    for (let j = 0; j < 5; j++) S.rect({ x: 214 + 60 * j - 26, y: -18, w: 52, h: 36, r: 10, fill: i && j === 1 ? VIOLET : 'struct', opacity: 0.8 }, ghost);
    whole(t => {
      const k = EIO(cl((t - at) / 0.8));
      ghost.setAttribute('transform', `translate(0,${lerp(y0, 700, k).toFixed(1)})`);
      ghost.setAttribute('opacity', (k > 0 && k < 1 ? 0.7 * Math.sin(Math.PI * k) : 0).toFixed(3));
    });
    const trace = S.rect({ x: MX - 150, y: 470, w: 300, h: 205, r: 10, fill: i ? VIOLET : 'struct', opacity: 0 }, left);
    trace.setAttribute('data-audit', 'ignore');
    left.insertBefore(trace, model);
    whole(t => trace.setAttribute('opacity', (0.1 * cl((t - at - 0.3) / 0.4)).toFixed(3)));
  });
  const xxGlow = S.rect({ x: 214 + 60 - 36, y: 344, w: 72, h: 52, r: 16, fill: 'url(#pglow-violet)', opacity: 0 }, left);
  xxGlow.setAttribute('data-audit', 'ignore');
  pulse(xxGlow, T('b1~changed') - 0.1, 1, 1.0);

  // centred while it is the only thing on screen, then into the left third
  K.track(left, [K.K(tB2 - 0.2, { x: 670 }), K.K(tB2 + 0.6, { x: 0 })]);

  // ================================================================ b2: compare number by number, roll into one distance
  const demo = S.g();
  const DX = i => 980 + 62 * i, rnd = S.rand(8);
  const diffs = Array.from({ length: 8 }, () => 8 + 30 * rnd());
  const tKeys = T('b2~keys') - 0.15, tNum = T('b2~number') - 0.1, tOne = T('b2~one') - 0.1;
  const rowA = S.g(null, demo), rowB = S.g(null, demo);
  for (let i = 0; i < 8; i++) {
    S.rect({ x: DX(i) - 25, y: 400, w: 50, h: 40, r: 6, fill: 'struct', opacity: (0.45 + 0.5 * rnd()).toFixed(2) }, rowA);
    S.rect({ x: DX(i) - 25, y: 540, w: 50, h: 40, r: 6, fill: VIOLET, opacity: (0.45 + 0.5 * rnd()).toFixed(2) }, rowB);
  }
  S.text('run 1', { x: 940, y: 421, size: 24, weight: 700, anchor: 'end', color: 'struct' }, rowA);
  S.text('run 2', { x: 940, y: 561, size: 24, weight: 700, anchor: 'end', color: 'violet' }, rowB);
  rise(rowA, tKeys, -10);
  rise(rowB, tKeys + 0.2, -10);
  // the rows close up, and an amber difference tick grows between each pair
  K.track(rowB, [K.K(tNum, { y: 0 }), K.K(tNum + 0.4, { y: -40 })]);
  const ticks = diffs.map((h, i) => {
    const r = S.rect({ x: DX(i) - 4, y: 470, w: 8, h: 0, r: 3, fill: 'url(#solid-compute)' }, demo);
    r.setAttribute('data-audit', 'ignore');
    const at = tNum + 0.4 + 0.07 * i;
    // grow between the pair, then slide into one stack at x 1560 (bottom 560)
    const below = diffs.slice(0, i).reduce((a, b) => a + b, 0);
    whole(t => {
      const g = E('power3.out')(cl((t - at) / 0.3)), m = EIO(cl((t - tOne - 0.04 * i) / 0.6));
      const x = lerp(DX(i) - 4, 1556, m), yb = lerp(480 + h / 2, 590 - below * 0.9, m), hh = h * g * lerp(1, 0.9, m);
      r.setAttribute('x', x.toFixed(1)); r.setAttribute('y', (yb - hh).toFixed(1)); r.setAttribute('height', hh.toFixed(1));
      r.setAttribute('width', lerp(8, 30, m).toFixed(1));
    });
    return r;
  });
  const ruler = S.icon('ph:ruler-duotone', { x: 1640, y: 450, size: 54, color: 'muted' }, demo);
  const dist = S.text('distance', { x: 1571, y: 620, size: 26, weight: 750, anchor: 'middle', color: 'compute' }, demo);
  rise(ruler, tOne, 10);
  rise(dist, tOne + 0.6, 10);
  const zero = ch14Tag(S, '0 = every number matched', { x: 1180, y: 660, size: 24 }, demo);
  const sch = ch14Tag(S, 'schematic', { x: 1260, y: 346, size: 22 }, demo);
  rise(zero, T('b2~Zero') - 0.1, 10);
  rise(sch, tKeys + 0.4, 10);
  const tShrink = T('b2~matched') + 0.1;
  K.track(demo, [K.K(tShrink, { s: 1, o: 1 }), K.K(tShrink + 0.45, { s: 0.3, o: 0, e: 'power2.in' })], 1280, 500);
  void ticks;

  // ================================================================ the table (header and empty rows at the end of b2)
  const tTab = tShrink + 0.35;
  const h1 = S.text('Change token 2', { x: 1290, y: 150, size: 44, weight: 750, anchor: 'middle', color: 'ink' });
  const h2 = S.text("measure token 5's key", { x: 1290, y: 202, size: 30, weight: 600, anchor: 'middle', color: 'muted' });
  rise(h1, tTab); rise(h2, tTab + 0.15);
  const DIST = [0, 3.538930, 16.746760, 20.102747], RY = l => 690 - 110 * l, BX = 1140, BW = 500;
  const tRow = [T('b3~one') - 0.1, T('b3~two') - 0.1, T('b3~three') - 0.1, T('b3~four') - 0.1];
  const tScr = T('b4~sizes') - 0.1;
  const rows = DIST.map((d, l) => {
    const g = S.g();
    const y = RY(l);
    S.text(`layer ${l + 1}`, { x: 760, y, size: 30, weight: 750, color: 'ink' }, g);
    S.rect({ x: BX, y: y - 16, w: BW, h: 32, r: 6, stroke: '#ffffff', strokeOpacity: 0.1, sw: 1.5, dash: '5 6' }, g);
    rise(g, tTab + 0.3 + 0.08 * l, 10, 0.35);
    const ro = S.text('', { x: 896, y, size: 32, weight: 700, family: 'mono', color: l ? 'ink' : 'helps' }, g);
    const bar = S.rect({ x: BX, y: y - 16, w: 0, h: 32, r: 6, fill: VIOLET }, g);
    const st = S.text(l ? 'different' : 'identical', { x: 1676, y, size: 28, weight: 750, color: l ? 'ink' : 'helps' }, g);
    hide(st);
    fade(st, 0, 1, tRow[l] + 0.6, 0.3);
    whole(t => {
      const k = E('power2.out')(cl((t - tRow[l]) / 0.7));
      // b4: rows 2-4 scramble as if re-run with new random weights, then settle back
      const sc = l && t > tScr && t < tScr + 1.3 ? Math.sin(Math.PI * (t - tScr) / 1.3) : 0;
      const jit = sc ? (Math.sin(t * 37 + l * 11) * 0.5 + 0.5) * sc : 0;
      const v = d * k;
      ro.textContent = t < tRow[l] ? '' : sc ? (d * (0.4 + 1.2 * jit)).toFixed(6) : v.toFixed(6);
      bar.setAttribute('width', Math.min(BW, BW * (sc ? d * (0.5 + jit) : v) / 20.102747).toFixed(1));
    });
    return { g, y };
  });
  // layer 1: a teal tick, which pulses on 'the pattern'
  const tick = S.g();
  S.icon('ph:check-circle-duotone', { x: 1840, y: RY(0), size: 40, color: 'helps' }, tick);
  K.track(tick, [K.K(tRow[0] + 0.6, { s: 0.4, o: 0 }), K.K(tRow[0] + 1.0, { s: 1, o: 1, e: 'back.out(2.5)' })], 1840, RY(0));
  const tickGlow = S.circle({ x: 1840, y: RY(0), r: 32, fill: 'url(#pglow-helps)', opacity: 0 });
  tickGlow.setAttribute('data-audit', 'ignore');
  const tPat = T('b4~pattern') - 0.1;
  pulse(tickGlow, tPat, 1, 0.9);
  // growing: a white arrow up the bar tips
  const tGrow = T('b3~growing') - 0.1;
  const arrow = S.path({ d: `M${BX + 4},${RY(0)} L${BX + 88},${RY(1)} L${BX + 416.5},${RY(2)} L${BX + 500},${RY(3) - 22} M${BX + 488},${RY(3) - 18} L${BX + 501},${RY(3) - 24} L${BX + 497},${RY(3) - 10}`, stroke: 'white', sw: 2.5 });
  arrow.setAttribute('data-audit', 'ignore');
  K.draw(arrow, 820, tGrow, 0.8);
  fade(arrow, 1, 0, tB4, 0.3);
  const mix = S.text('as the mixing compounds', { x: 1630, y: 296, size: 26, weight: 650, anchor: 'end', color: 'muted' });
  rise(mix, T('b3~mixing') - 0.1, 10);
  const run = ch14Tag(S, 'this run', { x: 1770, y: 296, size: 22 });
  rise(run, T('b3~this') - 0.1, 10);
  // b4: random weights; the pattern is the point
  const rnd2 = ch14Tag(S, 'random weights, never trained', { x: 1290, y: 790, size: 24 });
  rise(rnd2, T('b4~weights') - 0.1, 10);
  [1, 2, 3].forEach((l, i) => {
    const m = S.g();
    S.circle({ x: 1820, y: RY(l), r: 8, fill: 'white' }, m);
    rise(m, tPat + 0.3 + 0.12 * i, 0, 0.25);
  });
  const take = S.takeaway('measured, not asserted', { tone: 'helps' });
  hide(take);
  fade(take, 0, 1, tPat + 0.4, 0.5);
  void rows; void tB2; void tB3; void lerp;
});
