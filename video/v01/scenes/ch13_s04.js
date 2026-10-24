/* ch13_s04 · what a cache is, in general (fig 135)
   Checked: 37 × 48 = 1,776; 52 × 17 = 884.
   b1  two cards fade up, still; the two-line header writes on.
   b2  left: '37 × 48', the calculator pulses four times, tally 1 … 4 ('computed 4×'). Right: one pulse, a note
       '37 × 48 = 1,776', read three times ('read 3×'). A balance: coral 'space' drops on one pan, teal 'time
       saved' rises on the other. A second note '52 × 17 = 884' is never read: it greys, 'never reused: wasted
       space'.
   b3  the grey note and the balance fade; the useful note flies down and becomes the first entry of a teal
       stack that gains one entry per step, every entry glowing each step; 'grows every token'; 'key-value
       cache'; 'the central problem ahead'.
   Layout: header y 120 / 172; cards x 300-860 and 1060-1620, y 230-590; balance pivot (960, 700); stack centred
   x 960, growing up from y 900. */
V.scene('ch13_s04', S => {
  const K = libKit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const { fx } = S;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1;

  // ================================================================ b1: two cards, then the definition
  const h1 = S.text('A cache is something kept', { x: 960, y: 120, size: 44, weight: 750, anchor: 'middle', color: 'ink' });
  const h2 = S.text('so it need not be made again', { x: 960, y: 172, size: 32, weight: 600, anchor: 'middle', color: 'muted' });
  S.add(fx.type(h1, { d: 0.8 }), T('b1~cache') - 0.15);
  S.add(fx.type(h2, { d: 0.8 }), T('b1~so') - 0.1);
  const card = (x, tone, title) => {
    const g = S.g();
    S.rect({ x, y: 230, w: 560, h: 360, r: 22, fill: `url(#card-${tone})`, stroke: tone, sw: 2.5 }, g);
    S.text(title, { x: x + 280, y: 278, size: 30, weight: 750, anchor: 'middle', color: tone }, g);
    S.path({ d: `M${x + 40},312 H${x + 520}`, stroke: tone, strokeOpacity: 0.25, sw: 1.5 }, g);
    return g;
  };
  const L = card(300, 'compute', 'work it out every time'), R = card(1060, 'helps', 'work it out once, keep it');
  K.track(L, [K.K(0.7, { y: 24, o: 0 }), K.K(1.3, { y: 0, o: 1, e: 'power3.out' })]);
  K.track(R, [K.K(0.85, { y: 24, o: 0 }), K.K(1.45, { y: 0, o: 1, e: 'power3.out' }), K.K(tB3 + 0.4, { o: 1 }), K.K(tB3 + 0.9, { o: 0.55 })]);
  const calc = (x, tone, parent) => {
    const g = S.g(null, parent);
    g.glow = S.circle({ x, y: 420, r: 64, fill: `url(#pglow-${tone})`, opacity: 0 }, g);
    g.glow.setAttribute('data-audit', 'ignore');
    S.icon('ph:calculator-duotone', { x, y: 420, size: 92, color: tone }, g);
    return g;
  };
  const cL = calc(390, 'compute', L), cR = calc(1150, 'helps', R);

  // ================================================================ b2: left, every time; right, once and kept
  const tWork = T('b2~Work') - 0.1;
  const prob = S.text('37 × 48', { x: 600, y: 410, size: 36, weight: 700, family: 'mono', anchor: 'middle', color: 'ink' }, L);
  hide(prob);
  fade(prob, 0, 1, tWork, 0.35);
  const tal = S.g(null, L), tallyAt = [0, 1, 2, 3].map(i => tWork + 0.3 + 0.75 * i);
  const comp = S.text('computed 1×', { x: 600, y: 520, size: 24, weight: 650, anchor: 'middle', color: 'compute' }, L);
  hide(comp);
  tallyAt.forEach((at, i) => {
    pulse(cL.glow, at, 0.9, 0.5);
    S.add(fx.pulse(cL.lastChild, { scale: 1.12, d: 0.4 }), at);
    const m = S.path({ d: `M${560 + 20 * i},448 V488`, stroke: 'compute', sw: 4 }, tal);
    K.draw(m, 44, at + 0.1, 0.2);
  });
  fade(comp, 0, 1, tallyAt[0] + 0.15, 0.25);
  whole(t => { comp.textContent = `computed ${Math.max(1, tallyAt.filter(a => t >= a + 0.1).length)}×`; });
  // right: one pulse, then the note
  const tOnce = T('b2~once') - 0.1;
  pulse(cR.glow, tOnce, 0.9, 0.5);
  S.add(fx.pulse(cR.lastChild, { scale: 1.12, d: 0.4 }), tOnce);
  const note = (cx, cy, text, parent) => {
    const g = S.g(null, parent);
    g.glow = S.rect({ x: cx - 170, y: cy - 52, w: 340, h: 104, r: 16, fill: 'url(#pglow-helps)', opacity: 0 }, g);
    g.glow.setAttribute('data-audit', 'ignore');
    g.body = S.path({ d: `M${cx - 152},${cy - 38} H${cx + 134} L${cx + 152},${cy - 20} V${cy + 38} H${cx - 152} Z`, fill: '#123b36', stroke: 'helps', sw: 2.5 }, g);
    g.fold = S.path({ d: `M${cx + 134},${cy - 38} V${cy - 20} H${cx + 152}`, stroke: 'helps', sw: 2 }, g);
    g.label = S.text(text, { x: cx - 6, y: cy + 2, size: 26, weight: 700, family: 'mono', anchor: 'middle', color: 'ink' }, g);
    return g;
  };
  const n1 = note(1440, 380, '37 × 48 = 1,776', R);
  const tNote = T('b2~note') - 0.1;
  K.track(n1, [K.K(tNote, { s: 0.6, o: 0 }), K.K(tNote + 0.4, { s: 1, o: 1, e: 'back.out(2)' })], 1440, 380);
  const readAt = [0, 1, 2].map(i => T('b2~read') - 0.05 + 0.5 * i);
  readAt.forEach(at => pulse(n1.glow, at, 1, 0.45));
  const reads = S.text('read 1×', { x: 1440, y: 446, size: 22, weight: 650, anchor: 'middle', color: 'helps' }, R);
  hide(reads);
  fade(reads, 0, 1, readAt[0], 0.25);
  whole(t => { reads.textContent = `read ${Math.max(1, readAt.filter(a => t >= a).length)}×`; });
  // the second note, never read
  const tAgain = T('b2~read#2') - 0.1;
  const n2 = note(1440, 512, '52 × 17 = 884', R);
  K.track(n2, [K.K(tAgain, { s: 0.6, o: 0 }), K.K(tAgain + 0.3, { s: 1, o: 1, e: 'back.out(2)' }), K.K(tAgain + 0.35, { o: 1 }), K.K(tAgain + 0.75, { o: 0.5 }), K.K(tB3 + 0.5, { o: 0.5 }), K.K(tB3 + 0.9, { o: 0 })], 1440, 512);
  whole(t => {
    const g = cl((t - tAgain - 0.35) / 0.4), c = S.tone(g > 0.5 ? 'muted' : 'helps');
    n2.body.setAttribute('stroke', c); n2.fold.setAttribute('stroke', c);
    n2.body.setAttribute('fill', g > 0.5 ? '#1a2133' : '#123b36');
  });
  const waste = S.text('never reused: wasted space', { x: 1440, y: 566, size: 22, weight: 650, anchor: 'middle', color: 'muted' }, R);
  hide(waste);
  fade(waste, 0, 1, tAgain + 0.55, 0.3);
  fade(waste, 1, 0, tB3 + 0.5, 0.35);
  // the balance: space on one pan, time saved on the other
  const tMem = T('b2~memory') - 0.1;
  const bal = S.g();
  S.path({ d: 'M960,700 V880 M900,890 H1020 M960,880 L925,890 M960,880 L995,890', stroke: 'muted', sw: 4 }, bal);
  S.circle({ x: 960, y: 700, r: 8, fill: 'muted' }, bal);
  const beam = S.path({ d: 'M0,0', stroke: 'ink', sw: 5 }, bal);
  const panL = S.g(null, bal), panR = S.g(null, bal);
  [panL, panR].forEach(p => {
    S.path({ d: 'M-70,0 L0,-62 L70,0', stroke: 'muted', sw: 2 }, p);
    S.path({ d: 'M-84,0 Q0,26 84,0 Z', fill: '#1a2133', stroke: 'muted', sw: 2.5 }, p);
  });
  const space = S.g(null, panL), saved = S.g(null, panR);
  S.rect({ x: -66, y: -58, w: 132, h: 54, r: 10, fill: 'url(#solid-bytes)' }, space);
  S.text('space', { x: 0, y: -30, size: 26, weight: 750, anchor: 'middle', color: '#0a0f1e' }, space);
  S.rect({ x: -80, y: -58, w: 160, h: 54, r: 10, fill: 'url(#solid-helps)' }, saved);
  S.text('time saved', { x: 0, y: -30, size: 26, weight: 750, anchor: 'middle', color: '#0a0f1e' }, saved);
  bal.setAttribute('data-audit', 'ignore');
  const tDrop = tMem + 0.35;
  K.track(space, [K.K(tDrop, { y: -70, o: 0 }), K.K(tDrop + 0.4, { y: 0, o: 1, e: 'bounce.out' })]);
  K.track(saved, [K.K(tDrop + 0.45, { y: 24, o: 0 }), K.K(tDrop + 0.9, { y: 0, o: 1, e: 'power3.out' })]);
  whole(t => {
    // the beam tips toward space as it lands, then levels part-way once time saved rises
    const a = (9 * EIO(cl((t - tDrop - 0.25) / 0.4)) - 4 * EIO(cl((t - tDrop - 0.6) / 0.5))) * Math.PI / 180;
    const ex = 190 * Math.cos(a), ey = 190 * Math.sin(a);
    beam.setAttribute('d', `M${(960 - ex).toFixed(1)},${(700 + ey).toFixed(1)} L${(960 + ex).toFixed(1)},${(700 - ey).toFixed(1)}`);
    panL.setAttribute('transform', `translate(${(960 - ex).toFixed(1)},${(700 + ey + 62).toFixed(1)})`);
    panR.setAttribute('transform', `translate(${(960 + ex).toFixed(1)},${(700 - ey + 62).toFixed(1)})`);
  });
  hide(bal);
  fade(bal, 0, 1, tMem, 0.4);
  fade(bal, 1, 0, tB3 + 0.3, 0.4);
  fade(L, 1, 0.55, tB3 + 0.4, 0.5);

  // ================================================================ b3: the note becomes the key-value cache
  // n1 flies down and becomes the first entry; then one entry per step, all glowing each step
  const tFly = tB3 + 0.3, BASEY = 900, PITCH = 16, EW = 220, EH = 12;
  const STEP = 0.7, t0 = tFly + 0.8;
  const steps = [];
  for (let t = t0; t < S.duration - 0.6; t += STEP) steps.push(t);
  const flyer = S.rect({ x: 1310, y: 342, w: 260, h: 76, r: 10, fill: '#123b36', stroke: 'helps', sw: 2.5 });
  flyer.setAttribute('data-audit', 'ignore');
  hide(flyer);
  whole(t => {
    const p = EIO(cl((t - tFly) / 0.8));
    const from = [1310, 342, 260, 76], to = [960 - EW / 2, BASEY - EH, EW, EH];
    ['x', 'y', 'width', 'height'].forEach((a, j) => flyer.setAttribute(a, lerp(from[j], to[j], p).toFixed(1)));
    flyer.setAttribute('fill', p > 0.6 ? S.tone('helps') : '#123b36');
    setO(flyer, t > tFly && t < t0 + 0.05 ? 1 : 0);
  });
  // n1 itself leaves the card as the flyer takes off
  fade(n1, 1, 0, tFly, 0.15);
  fade(reads, 1, 0, tB3, 0.3);
  const stack = S.g();
  stack.setAttribute('data-audit', 'ignore');
  const entries = steps.map((_, i) => S.rect({ x: 960 - EW / 2, y: BASEY - EH - PITCH * i, w: EW, h: EH, r: 3, fill: 'helps' }, stack));
  const glows = steps.map((_, i) => S.rect({ x: 960 - EW / 2, y: BASEY - EH - PITCH * i, w: EW, h: EH, r: 3, fill: 'white', opacity: 0 }, stack));
  whole(t => {
    // entry 0 is the note itself; entry i (i ≥ 1) is added at steps[i]; every entry glows each step
    const nOn = t < t0 ? 0 : steps.filter(s => t >= s).length;
    let gl = 0;
    steps.forEach(s => { const p = (t - s) / 0.45; if (p > 0 && p < 1) gl = Math.max(gl, Math.sin(Math.PI * p)); });
    entries.forEach((e, i) => {
      const land = i === 0 ? t0 : steps[i];
      const k = i === 0 ? (t >= t0 ? 1 : 0) : E('back.out(2)')(cl((t - land) / 0.3));
      e.setAttribute('opacity', i < nOn || (i === 0 && t >= t0) ? (0.55 + 0.45 * k).toFixed(3) : 0);
      e.setAttribute('transform', `translate(0,${(-10 * (1 - k)).toFixed(1)})`);
    });
    glows.forEach((g, i) => { g.setAttribute('opacity', (i < nOn ? 0.5 * gl : 0).toFixed(3)); g.setAttribute('transform', entries[i].getAttribute('transform')); });
  });
  const tGrow = T('b3~grows') - 0.1, tKV = T('b3~key') - 0.1;
  const grow = S.g();
  S.path({ d: 'M1100,830 V770 M1092,780 L1100,768 L1108,780', stroke: 'bytes', sw: 3 }, grow);
  S.text('grows every token', { x: 1118, y: 800, size: 28, weight: 750, color: 'bytes' }, grow);
  hide(grow);
  fade(grow, 0, 1, tGrow, 0.35);
  const kvL = S.text('key-value cache', { x: 820, y: 800, size: 32, weight: 800, anchor: 'end', color: 'helps' });
  const ahead = S.text('the central problem ahead', { x: 960, y: 936, size: 24, weight: 650, anchor: 'middle', color: 'muted' });
  hide([kvL, ahead]);
  S.add(K.drive(0.4, k => { setO(kvL, k); kvL.setAttribute('transform', `translate(${(16 * (1 - E('power3.out')(k))).toFixed(1)},0)`); }), tKV);
  fade(ahead, 0, 1, tKV + 0.4, 0.4);
  void tB2;
});
