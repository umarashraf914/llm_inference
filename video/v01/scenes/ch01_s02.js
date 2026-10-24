/* ch01_s02 · how the numbers were found (fig 3)
   The weights on the left, the training loop on the right: guess, compare, nudge every weight,
   repeat trillions of times, and out comes the file. */
V.scene('ch01_s02', S => {
  const { fx } = S;

  // ---------------------------------------------------------------- the values, at every stage
  // training-time values: the file value plus a small seeded offset (never the file value itself)
  const rnd = S.rand(7);
  const TRAIN = CH01_VALUES.map((v, i) => {
    const fixed = [0.118, -0.684, 0.035, 1.412, -0.317];
    if (i < 5) return fixed[i];
    let d = (rnd() * 2 - 1) * 0.035;
    if (Math.abs(d) < 0.006) d = 0.006 * Math.sign(d || 1);
    return Math.round((v + d) * 1000) / 1000;
  });
  // one nudge: each last digit moves a few thousandths toward the file value, never reaching it
  const NUDGED = TRAIN.map((v, i) => {
    const fixed = [0.121, -0.688, 0.032, 1.417, -0.314];
    if (i < 5) return fixed[i];
    const f = CH01_VALUES[i], step = Math.min(0.004, Math.abs(f - v) / 2);
    return Math.round((v + Math.sign(f - v) * Math.max(0.001, step)) * 1000) / 1000;
  });
  const fmt3 = v => (v < 0 ? '−' : '') + Math.abs(v).toFixed(3);

  // ---------------------------------------------------------------- the grid (the weights), left
  const G = { x: 96, cy: 610, cw: 84, ch: 48, gap: 8 };
  const gridHolder = S.g();
  const grid = S.grid({ x: G.x, y: G.cy - (4 * (G.ch + G.gap) - G.gap) / 2, rows: 4, cols: 10, cw: G.cw, ch: G.ch, gap: G.gap, r: 8,
    tone: 'struct', values: TRAIN, fmt: fmt3, size: 20 }, gridHolder);
  const GB = { l: G.x, r: G.x + grid.w, t: G.cy - grid.h / 2, b: G.cy + grid.h / 2, cx: G.x + grid.w / 2 };
  const weightsLabel = S.text('the weights', { x: GB.cx, y: GB.b + 40, size: 26, anchor: 'middle', color: 'muted', weight: 550 });

  // every tile's text is driven from one clock, so any frame is right however it is reached
  const T = { nudge: S.t('b2~nudge+0.25'), repeat: S.t('b3~Repeat'), out: S.t('b4~Out+0.1') };
  const flickRnd = (i, k) => { let s = (i * 7919 + k * 104729 + 17) >>> 0; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 2000) / 1000 - 1; };
  let shown = -1;
  const paint = t => {
    let vals, f, key;
    if (t < T.nudge) { vals = TRAIN; f = fmt3; key = 'train'; }
    else if (t < T.repeat) { vals = NUDGED; f = fmt3; key = 'nudged'; }
    else if (t < T.out) {
      const k = Math.floor((t - T.repeat) * 9);   // nine new sets of values a second while it loops
      key = 'flick' + k;
      const u = Math.min(1, (t - T.repeat) / (T.out - T.repeat));
      vals = NUDGED.map((v, i) => {
        const tgt = CH01_VALUES[i], base = v + (tgt - v) * u * 0.8;
        let w = Math.round((base + flickRnd(i, k) * 0.012 * (1 - u * 0.6)) * 1000) / 1000;
        if (Math.abs(w - tgt) < 0.0005) w = Math.round((tgt + 0.002) * 1000) / 1000;   // never the file value yet
        return w;
      });
      f = fmt3;
    } else { vals = CH01_VALUES; f = ch01Fmt; key = 'file'; }
    if (key === shown) return;
    shown = key;
    grid.cells.forEach((c, i) => {
      c.label.textContent = f(vals[i]);
      c.label.setAttribute('fill', S.tone(vals[i] < 0 ? 'violet' : 'ink'));
    });
  };
  const clock = { t: 0 };
  S.add(gsap.fromTo(clock, { t: 0 }, { t: S.duration, duration: S.duration, ease: 'none', immediateRender: false, onUpdate: () => paint(clock.t) }), 0);
  S.call(() => paint(0), 0);

  S.add(fx.in(gridHolder, { from: 'fade', d: 0.6 }), 0.1);
  S.add(fx.in(weightsLabel, { from: 'up', d: 0.5 }), 0.4);

  // ---------------------------------------------------------------- tag top-right
  const tag = S.pill('training, briefly', { x: 1690, y: 150, h: 44, size: 24, tone: 'neutral', style: 'outline' });
  S.add(fx.in(tag, { from: 'down', d: 0.5 }), 'b1+0.2');

  // ---------------------------------------------------------------- b1: no black box
  const box = S.g();
  S.rect({ x: GB.l - 16, y: GB.t - 16, w: grid.w + 32, h: grid.h + 32, r: 16, fill: '#05080f', stroke: '#ffffff', strokeOpacity: 0.18, sw: 2 }, box);
  S.text('trained', { x: GB.cx, y: G.cy, size: 40, anchor: 'middle', color: 'muted', weight: 650, family: 'display' }, box);
  box.setAttribute('data-audit', 'ignore');   // an opaque lid over the grid: the tiles under it are hidden
  S.add(gsap.fromTo(box, { autoAlpha: 0, y: -60 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }), 'b1~black-0.35');
  S.add(gsap.to(box, { autoAlpha: 0, y: -90, duration: 0.6, ease: 'power2.in' }), 'b1~Hide-0.25');

  // the loop: three stations round a ring, right
  const cyc = S.cycle({ x: 1440, y: 620, r: 225, cardW: 360, cardH: 64, size: 26, tone: 'struct', start: -90,
    stations: [{ label: 'guess the next word' }, { label: 'compare with the real one' }, { label: 'nudge every weight' }] });
  cyc.ring.setAttribute('stroke-opacity', 0.45);
  cyc.dot.setAttribute('data-audit', 'ignore');   // runs behind the opaque station cards
  S.add(fx.draw(cyc.ring, { d: 0.9 }), 'b1~Hide-0.1');
  S.add(fx.in(cyc.arrows, { from: 'fade', d: 0.3, stagger: 0.1 }), 'b1~Hide+0.5');
  // stations stay opaque (so the ring never shows through them); only their label and outline dim
  cyc.stations.forEach((st, i) => {
    st.titleEl.setAttribute('opacity', 0.4);
    st.bg.setAttribute('stroke-opacity', 0.3);
    S.add(gsap.fromTo(st, { autoAlpha: 0, scale: 0.9, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out' }), `b1~Hide+${0.3 + i * 0.15}`);
  });
  const light = (i, at) => cyc.stations.forEach((st, j) => {
    S.add(gsap.to(st.titleEl, { attr: { opacity: j === i ? 1 : 0.4 }, duration: 0.35 }), at);
    S.add(gsap.to(st.bg, { attr: { 'stroke-opacity': j === i ? 1 : 0.3 }, duration: 0.35 }), at);
  });

  // the sentence with its hidden next word, top band
  const SY = 200;
  const sentence = (words, x0, parent) => {
    let x = x0;
    const pills = words.map(w => {
      const p = S.pill(w, { x, y: SY, h: 52, size: 28, tone: 'struct', anchor: 'start' }, parent);
      x += p.w + 12;
      return p;
    });
    return { pills, end: x };
  };
  const s1 = S.g();
  const first = sentence(['the', 'cat', 'sat', 'on', 'the'], 480, s1);
  const slot = S.g(null, s1);
  const slotX = first.end, slotW = 120;
  S.rect({ x: slotX, y: SY - 26, w: slotW, h: 52, r: 16, fill: 'none', stroke: 'muted', sw: 2, dash: '7 7' }, slot);
  S.add(fx.in(first.pills, { from: 'up', d: 0.45, stagger: 0.07 }), 'b1~real-0.1');
  S.add(fx.in(slot, { from: 'fade', d: 0.4 }), 'b1~text');

  // 'guess': station 1, and 'sofa' pops into the blank
  light(0, 'b1~guess-0.2');
  const sofa = S.pill('sofa', { x: slotX + slotW / 2, y: SY, h: 52, size: 28, tone: 'struct' }, s1);
  S.add(fx.pop(sofa), 'b1~guess+0.1');

  // ---------------------------------------------------------------- b2: compare, then nudge
  light(1, 'b2');
  const mat = S.g(null, s1);
  const matPill = S.pill('mat', { x: slotX + slotW / 2, y: SY + 72, h: 52, size: 28, tone: 'helps' }, mat);
  S.icon('ph:check-circle-duotone', { x: slotX + slotW / 2 + matPill.w / 2 + 28, y: SY + 72, size: 40, color: 'helps' }, mat);
  S.add(fx.in(mat, { from: 'up', d: 0.45 }), 'b2~mat-0.15');
  const cross = S.icon('ph:x-circle-duotone', { x: slotX + slotW / 2 + sofa.w / 2 + 28, y: SY, size: 40, color: 'muted' }, s1);
  const wrong = S.text('wrong guess', { x: slotX + slotW / 2 + sofa.w / 2 + 58, y: SY, size: 24, color: 'muted', weight: 550 }, s1);
  S.add(fx.pop(cross), 'b2~mat+0.25');
  S.add(fx.in(wrong, { from: 'left', d: 0.4 }), 'b2~mat+0.35');
  S.add(gsap.to(sofa, { opacity: 0.5, duration: 0.4 }), 'b2~mat+0.25');

  light(2, 'b2~nudge-0.15');
  // amber work flows from the nudge station into the weights, and a shimmer crosses the grid
  const st3 = cyc.stations[2];
  S.flow({ d: `M${st3.l + 10},${st3.cy} C${st3.l - 60},${st3.cy} ${GB.r + 80},${G.cy} ${GB.r - 4},${G.cy}`, from: 'b2~nudge-0.1', to: 'b2~nudge+1.0',
    speed: 520, every: 0.07, size: 6, color: 'compute' });
  const clipId = 'ch01s02-gridclip';
  const cp = S.el('clipPath', { id: clipId }, S.el('defs', null, S.layers.back));
  S.rect({ x: GB.l, y: GB.t, w: grid.w, h: grid.h }, cp);
  const sheen = S.g({ 'clip-path': `url(#${clipId})` });
  const band = S.rect({ x: GB.l - 160, y: GB.t - 10, w: 120, h: grid.h + 20, fill: 'compute', fillOpacity: 0.3 }, sheen);
  sheen.setAttribute('data-audit', 'ignore');
  S.add(gsap.fromTo(band, { x: 0, autoAlpha: 1 }, { x: grid.w + 200, duration: 0.7, ease: 'power1.inOut' }), T.nudge - 0.35);
  S.add(gsap.to(band, { autoAlpha: 0, duration: 0.2 }), T.nudge + 0.4);
  S.add(gsap.fromTo(grid.cells.map(c => c.bg), { attr: { stroke: S.tone('struct') } },
    { attr: { stroke: S.tone('compute') }, duration: 0.15, yoyo: true, repeat: 1, stagger: { each: 0.012, grid: [4, 10], axis: 'x', from: 'start' } }), T.nudge - 0.3);
  const nudgeTag = S.text('every weight, a tiny amount', { x: GB.cx, y: GB.t - 36, size: 26, anchor: 'middle', color: 'compute', weight: 600 });
  S.add(fx.in(nudgeTag, { from: 'up', d: 0.4 }), 'b2~tiny');
  S.add(fx.out(nudgeTag, { d: 0.35 }), 'b3~Repeat+0.6');

  // ---------------------------------------------------------------- b3: repeat, trillions of times
  // the dot runs the loop, faster and faster, then slows
  S.add(fx.orbit(cyc, { from: 0, to: 9, d: S.t('b3~Nobody') - S.t('b3~Repeat'), ease: 'power2.in' }), 'b3~Repeat');
  S.add(fx.orbit(cyc, { from: 9, to: 12, d: S.t('b4~Out') - S.t('b3~Nobody') - 0.3, ease: 'power2.out' }), 'b3~Nobody');
  const blur = S.circle({ x: cyc.cx, y: cyc.cy, r: cyc.r, fill: 'none', stroke: 'compute', sw: 10, opacity: 0 });
  blur.setAttribute('data-audit', 'ignore');
  S.add(gsap.fromTo(blur, { opacity: 0 }, { opacity: 0.55, duration: 2.6, ease: 'power2.in' }), 'b3~Repeat+0.6');
  S.add(gsap.to(blur, { opacity: 0, duration: 2.5, ease: 'power2.out' }), 'b3~Nobody');
  S.add(gsap.to(cyc.stations.map(st => st.titleEl), { attr: { opacity: 0.25 }, duration: 0.5 }), 'b3~Repeat+0.2');
  S.add(gsap.to(cyc.stations.map(st => st.bg), { attr: { 'stroke-opacity': 0.2 }, duration: 0.5 }), 'b3~Repeat+0.2');

  // a new sentence on each of the first laps (dot passes the top at k = 1, 2, 3)
  const lapT = k => S.t('b3~Repeat') + (S.t('b3~Nobody') - S.t('b3~Repeat')) * Math.sqrt(k / 9);
  const others = [['a', 'dog', 'ran', 'across', 'the', 'park'], ['water', 'boils', 'at', '100', 'degrees'], ['the', 'capital', 'of', 'France', 'is', 'Paris']];
  const sGroups = others.map(ws => { const g = S.g(); sentence(ws, 480, g); return g; });
  S.add(fx.out(s1, { d: 0.25 }), lapT(1) - 0.2);
  sGroups.forEach((g, i) => {
    S.add(gsap.fromTo(g, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }), lapT(i + 1));
    if (i < sGroups.length - 1) S.add(gsap.to(g, { autoAlpha: 0, duration: 0.15 }), lapT(i + 2) - 0.15);
  });
  S.add(gsap.to(sGroups[2], { autoAlpha: 0, duration: 0.4 }), lapT(3) + 0.55);
  S.add(gsap.to(cyc.stations, { autoAlpha: 0, duration: 0.4 }), 'b3~trillions-0.3');
  const tril = S.text('trillions of nudges', { x: cyc.cx, y: cyc.cy + 8, size: 34, anchor: 'middle', color: 'compute', weight: 650 });
  S.add(fx.in(tril, { from: 'up', d: 0.5 }), 'b3~trillions');

  // 'Nobody': one weight is plucked out; what is it for?
  const PI = 13;  // −0.54 in the file
  const pc = grid.cells[PI];
  const pluck = S.g();
  const pTile = S.g(null, pluck);
  S.rect({ x: -G.cw / 2, y: -G.ch / 2, w: G.cw, h: G.ch, r: 8, fill: '#0c1326' }, pTile);
  S.rect({ x: -G.cw / 2, y: -G.ch / 2, w: G.cw, h: G.ch, r: 8, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.9, sw: 1.5 }, pTile);
  const pLabel = S.text('', { x: 0, y: 1, size: 20, anchor: 'middle', family: 'mono', weight: 500, color: 'violet' }, pTile);
  S.call(() => { pLabel.textContent = pc.label.textContent; }, 'b3~Nobody-0.05');
  S.xset(pluck, { x: pc.cx, y: pc.cy, s: 1 });
  S.set(pluck, { autoAlpha: 0 }, 0);
  const PX = 760, PY = 330;
  S.add(gsap.set(pluck, { autoAlpha: 1 }), 'b3~Nobody');
  S.add(gsap.to(pc, { opacity: 0.15, duration: 0.2 }), 'b3~Nobody');
  S.add(fx.xform(pluck, { x: PX, y: PY, s: 2.4 }, { d: 0.9, ease: 'power3.out' }), 'b3~Nobody');
  const q = S.text('?', { x: PX + 150, y: PY + 4, size: 96, anchor: 'middle', color: 'muted', weight: 700, family: 'display' });
  const qLabel = S.text('what is it for?', { x: PX, y: PY + 100, size: 30, anchor: 'middle', color: 'muted', weight: 550 });
  S.add(fx.pop(q), 'b3~say-0.1');
  S.add(fx.in(qLabel, { from: 'up', d: 0.45 }), 'b3~what');

  // ---------------------------------------------------------------- b4: out comes the file
  S.add(fx.out([q, qLabel], { d: 0.3 }), 'b4-0.8');
  S.add(fx.out([tril, cyc.ring, ...cyc.arrows, tag], { d: 0.4 }), 'b4-0.3');
  S.add(gsap.set(cyc.dot, { autoAlpha: 0 }), 'b4-0.3');
  S.add(fx.xform(pluck, { x: pc.cx, y: pc.cy, s: 1 }, { d: 0.5, ease: 'power2.in' }), 'b4-0.45');
  S.add(gsap.set(pluck, { autoAlpha: 0 }), 'b4+0.05');
  S.add(gsap.to(pc, { opacity: 1, duration: 0.01 }), 'b4+0.05');
  // the flicker stops and every tile settles on its file value
  S.add(gsap.fromTo(grid.cells.map(c => c.bg), { attr: { 'stroke-opacity': 0.45 } }, { attr: { 'stroke-opacity': 1 }, duration: 0.25, yoyo: true, repeat: 1 }), T.out);
  const settled = S.text('the file values', { x: GB.cx, y: GB.t - 36, size: 26, anchor: 'middle', color: 'struct', weight: 600 });
  S.add(fx.in(settled, { from: 'up', d: 0.35 }), T.out + 0.1);
  // the grid folds into the file
  S.xset(gridHolder, { x: 0, y: 0, s: 1, ox: GB.cx, oy: G.cy });
  S.call(() => gridHolder.setAttribute('data-audit', 'ignore'), 'b4~numbers+0.15');   // shrinking into the file: a picture now
  S.add(fx.xform(gridHolder, { x: 960 - GB.cx, y: 540 - 20 - G.cy, s: 0.06 }, { d: 0.9, ease: 'power3.in' }), 'b4~numbers+0.2');
  S.add(gsap.to(gridHolder, { autoAlpha: 0, duration: 0.3 }), 'b4~numbers+0.85');
  S.add(fx.out([weightsLabel, settled], { d: 0.3 }), 'b4~numbers');
  const file = S.g();
  const fileIcon = S.icon('ph:file-duotone', { x: 960, y: 520, size: 220, color: 'struct' }, file);
  const fileLabel = S.text('a trained model', { x: 960, y: 670, size: 34, anchor: 'middle', color: 'muted', weight: 550 }, file);
  S.add(fx.pop(fileIcon, { from: 0.5, d: 0.6 }), 'b4~numbers+0.95');
  S.add(fx.in(fileLabel, { from: 'up', d: 0.5 }), 'b4~That is-0.2');
});
