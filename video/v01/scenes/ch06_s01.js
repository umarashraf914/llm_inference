/* ch06_s01 · a few fast workers, thousands of slow ones (fig 70)
   b1     the 30 ms bar from ch05 at full size; its coral 99% asks the question, then it parks top-right.
   b2-b3  two bands: the CPU (four blue worker cards out of a laptop, switching tasks out of step) over
          the GPU (48 x 12 amber squares that fill row by row, then pulse in unison).
   b4     a token's 70 billion multiplications: a pile, sorted into trays (groups); the top tray feeds
          both bands at once: four at a time off a growing queue vs 576 at a time.
   b5     'graphics': the acronym unfolds; the grid becomes a 16:9 screen (32 x 18 = 576) whose pixels
          light at once; then a chain of five tokens, each waiting for the last, with one square awake.
   b6     not chosen for cleverness: the grid brightens and widens, three words land.
   Layout: label column x 110-360, content x 420-1497, right column x 1540-1810. Top band y 196-524
   (cards 232-416, queue y 472), divider y 540, bottom band 556-988 (grid 690-957). */
V.scene('ch06_s01', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const bump = u => (u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u));
  const E = n => gsap.parseEase(n);
  const eO3 = E('power3.out'), eO2 = E('power2.out'), eIO2 = E('power2.inOut'), eI2 = E('power2.in');
  const clock = (t0, t1, fn) => ch06Clock(S, t0, t1, fn);
  const fade = (els, a, b, at, d = 0.5) => S.add(gsap.fromTo(els, { opacity: a }, { opacity: b, duration: d, ease: 'power2.out', immediateRender: false }), at);
  const xf = (el, x, y, s = 1, rot = 0) => el.setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)})${s !== 1 ? ` scale(${s.toFixed(4)})` : ''}${rot ? ` rotate(${rot.toFixed(2)})` : ''}`);
  const op = (el, v) => el.setAttribute('opacity', Math.max(0, Math.min(1, v)).toFixed(3));

  // an amber multiplication tile: a dark square with an amber '×', centred on its own origin
  const xTile = (s, parent) => {
    const g = S.g(null, parent);
    S.rect({ x: -s / 2, y: -s / 2, w: s, h: s, r: s * 0.2, fill: '#2b1d07', stroke: 'compute', strokeOpacity: 0.95, sw: Math.max(1.3, s * 0.05) }, g);
    const a = s * 0.21;
    S.path({ d: `M${-a},${-a} L${a},${a} M${a},${-a} L${-a},${a}`, stroke: 'compute', sw: Math.max(1.6, s * 0.09) }, g);
    return g;
  };

  // ================================================================ b1: the bar from ch05, then park it
  const bar = ch06Bar(S);
  S.set(bar.tag, { autoAlpha: 0 }, 0);
  S.add(fx.in(bar.body, { from: 'fade', d: 0.8 }), 0.05);
  S.add(fx.in(bar.tag, { from: 'down', d: 0.6, dist: 16 }), 0.5);
  // 'the coral ninety-nine percent': the coral part pulses once, the '?' tag brightens
  S.add(gsap.fromTo(bar.rest, { attr: { 'fill-opacity': 0.62 } }, { attr: { 'fill-opacity': 0.95 }, duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), 'b1~coral');
  S.add(gsap.fromTo(bar.q, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.3, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%', immediateRender: false }), 'b1~ninety');
  S.add(gsap.fromTo(bar.tagBg, { attr: { 'stroke-opacity': 0.9 } }, { attr: { 'stroke-opacity': 1 }, duration: 0.3, immediateRender: false }), 'b1~ninety');
  S.add(gsap.fromTo(bar.tagBg, { attr: { fill: 'url(#card-bytes)' } }, { attr: { fill: 'url(#solid-bytes)' }, duration: 0.01, immediateRender: false }), 'b1~ninety');
  S.add(gsap.fromTo(bar.q, { attr: { fill: S.tone('bytes') } }, { attr: { fill: '#0a0f1e' }, duration: 0.01, immediateRender: false }), 'b1~ninety');
  S.add(gsap.fromTo(bar.tagBg, { attr: { fill: 'url(#solid-bytes)' } }, { attr: { fill: 'url(#card-bytes)' }, duration: 0.01, immediateRender: false }), 'b1~Start-0.25');
  S.add(gsap.fromTo(bar.q, { attr: { fill: '#0a0f1e' } }, { attr: { fill: S.tone('bytes') }, duration: 0.01, immediateRender: false }), 'b1~Start-0.25');
  // 'Start with the chip': the bar shrinks to the top-right corner and stays there, dimmed
  S.add(bar.park({ d: 1.0 }), 'b1~Start-0.1');

  // the two bands and the divider between them
  const topBand = S.g(), botBand = S.g();
  const topPanel = S.rect({ x: 96, y: 196, w: 1728, h: 328, r: 26, fill: 'struct', fillOpacity: 0.035 }, topBand);
  const botPanel = S.rect({ x: 96, y: 556, w: 1728, h: 432, r: 26, fill: 'compute', fillOpacity: 0.03 }, botBand);
  const divider = S.line({ x1: 120, y1: 540, x2: 1800, y2: 540, stroke: 'faint', sw: 2, strokeOpacity: 0.7 }, topBand);
  S.set([topPanel, botPanel, divider], { autoAlpha: 0 }, 0);
  S.add(fx.in([topPanel, botPanel], { from: 'fade', d: 0.7, stagger: 0.12 }), 'b1~chip-0.1');
  S.add(fx.draw(divider, { d: 0.9 }), 'b1~chip-0.2');

  // ================================================================ b2: the CPU, a few fast workers
  const LAP = { x: 212, y: 286 };
  const lap = libDevice(S, { kind: 'laptop', x: LAP.x, y: LAP.y, w: 176, screen: 'chat' }, topBand);
  const cpuLabel = S.text('CPU', { x: 110, y: 394, size: 56, weight: 700, family: 'display', color: 'struct' }, topBand);
  const cpuCap = [S.text('a few fast', { x: 110, y: 442, size: 28, weight: 500, color: 'muted' }, topBand),
    S.text('workers', { x: 110, y: 476, size: 28, weight: 500, color: 'muted' }, topBand)];
  S.add(fx.in(lap, { from: 'up', d: 0.6 }), 'b2~laptop-0.1');
  S.add(fx.in(cpuLabel, { from: 'left', d: 0.6 }), 'b2~C-0.1');
  S.add(fx.in(cpuCap, { from: 'up', d: 0.5, stagger: 0.1 }), 'b2~few-0.1');

  const TASKS = ['ph:calculator-duotone', 'ph:envelope-simple-duotone', 'ph:folder-duotone', 'ph:globe-duotone'];
  const CARD = { x0: 420, pitch: 308, y: 226, w: 272, h: 194 };
  const CY = CARD.y + CARD.h / 2;                           // 323
  const cards = [0, 1, 2, 3].map(k => {
    const x = CARD.x0 + k * CARD.pitch;
    const holder = S.g(null, topBand);
    const c = S.card({ x, y: CARD.y, w: CARD.w, h: CARD.h, tone: 'struct', r: 22 }, holder);
    S.icon('ph:user-gear-duotone', { x: x + 90, y: CY, size: 112, color: 'struct' }, holder);
    const slot = S.rect({ x: x + 166, y: CY - 40, w: 80, h: 80, r: 18, fill: '#0c1326', stroke: 'struct', strokeOpacity: 0.4, sw: 2 }, holder);
    const tasks = TASKS.map((id, m) => {
      const ic = S.icon(id, { x: x + 206, y: CY, size: 50, color: 'ink' }, holder);
      op(ic, m === k ? 1 : 0);                             // each card starts on a different task
      return ic;
    });
    return { holder, bg: c.bg, slot, tasks, sx: x + 206, x, cx: x + CARD.w / 2 };
  });
  // the cards slide out of the laptop into their places
  S.add(gsap.fromTo(cards.map(c => c.holder), {
    autoAlpha: 0, x: (i, h) => LAP.x - cards[i].cx, y: LAP.y - CY, scale: 0.18, transformOrigin: '50% 50%',
  }, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.85, ease: 'power3.out', stagger: 0.13, transformOrigin: '50% 50%' }), 'b2~processor-0.15');

  // 'quick to switch tasks': each card's task icon flicks on to the next, every card on its own beat
  const PER = [0.82, 1.14, 0.96, 1.31], PH = [0.05, 0.47, 0.26, 0.7];
  const c0 = T('b2~quick') - 0.05, cEnd = T('b4~so') - 0.45;
  const scaleAbout = (el, cx, cy, k) => el.setAttribute('transform', `translate(${cx},${cy}) scale(${k.toFixed(4)}) translate(${-cx},${-cy})`);
  clock(c0, cEnd + 0.3, t => cards.forEach((cd, k) => {
    const off = 1 - cl((t - cEnd) / 0.3);
    const u = (t - c0 - PH[k]) / PER[k], m = Math.floor(u);
    let cur = k, prev = -1, local = 9;
    if (m >= 0) { cur = (k + m + 1) % 4; prev = (k + m) % 4; local = (u - m) * PER[k]; }
    cd.tasks.forEach((ic, i) => {
      let o = 0, s = 1;
      if (local < 0.1) { if (i === prev) { const q = local / 0.1; o = 1 - q; s = 1 - 0.45 * q; } }
      else if (i === cur) { const q = cl((local - 0.1) / 0.14); o = q; s = 0.55 + 0.45 * eO3(q); }
      op(ic, o * off);
      scaleAbout(ic, cd.sx, CY, s);
    });
    cd.slot.setAttribute('stroke-opacity', (0.4 + 0.45 * bump(local / 0.3)).toFixed(3));
  }));

  // ================================================================ b3: the GPU, thousands of slow ones
  const gridHolder = S.g(null, botBand);
  const bezel = S.g(null, gridHolder);                     // the monitor (b5), drawn behind the squares
  const grid = ch06Grid(S, { hidden: true }, gridHolder);
  const G = CH06.GRID, N = grid.cells.length;              // 576
  const gpuLabel = S.text('GPU', { x: 110, y: 772, size: 56, weight: 700, family: 'display', color: 'compute' }, botBand);
  const gpuCap = [S.text('thousands of', { x: 110, y: 820, size: 28, weight: 500, color: 'muted' }, botBand),
    S.text('slow ones', { x: 110, y: 854, size: 28, weight: 500, color: 'muted' }, botBand)];
  S.add(fx.in(gpuLabel, { from: 'left', d: 0.6 }), 'b3~G#2-0.1');
  S.add(fx.in(gpuCap, { from: 'up', d: 0.5, stagger: 0.1 }), 'b3~thousands-0.1');
  // the squares fill in row by row from the left, each lighting bright and settling
  const r0 = T('b3~graphics') + 0.05, rSpan = 2.5;
  clock(r0, r0 + rSpan + 0.3, t => grid.cells.forEach(c => {
    const q = cl((t - r0 - c.i * rSpan / N) / 0.22);
    op(c, q);
    c.setAttribute('fill-opacity', (G.fo + (1 - G.fo) * (1 - q)).toFixed(3));
  }));
  // 'the same thing at once': every square pulses together, on one steady beat
  const pulse0 = T('b3~same') - 0.1;
  clock(pulse0, pulse0 + 2.7, t => { let v = 0; for (let k = 0; k < 4; k++) v = Math.max(v, bump((t - pulse0 - 0.62 * k) / 0.42)); op(grid.flash, 0.75 * v); });

  // ================================================================ b4: 70 billion multiplications, in groups
  const tDim = T('b4') - 0.05;
  fade([topBand, botBand], 1, 0.1, tDim, 0.5);
  const trayHolder = S.g();                                 // trays and tiles; later shrinks to the right edge
  const TR = { x: 470, y0: 330, pitch: 68, w: 380, h: 54, n: 5, tile: 38 };
  const trays = [...Array(TR.n)].map((_, i) => S.rect({ x: TR.x, y: TR.y0 + i * TR.pitch, w: TR.w, h: TR.h, r: 12, fill: '#120f0a', stroke: 'compute', strokeOpacity: 0.35, sw: 2 }, trayHolder));
  const more = S.g(null, trayHolder);
  [0, 1, 2].map(k => S.circle({ x: TR.x + TR.w / 2, y: 680 + k * 14, r: 4, fill: 'muted' }, more));
  S.set([...trays, more], { autoAlpha: 0 }, 0);
  // the pile: 40 identical tiles heaped in rows of 10, 9, 8, 7, 6
  const rnd = S.rand(61);
  const pile = [];
  [10, 9, 8, 7, 6].forEach((n, row) => {
    for (let j = 0; j < n; j++) {
      const px = 660 + (j - (n - 1) / 2) * 40 + (rnd() - 0.5) * 10, py = 712 - row * 33 + (rnd() - 0.5) * 8;
      pile.push({ g: xTile(TR.tile, trayHolder), px, py, rot: (rnd() - 0.5) * 28, order: pile.length });
    }
  });
  pile.forEach(p => op(p.g, 0));
  // sorted top-first into the trays, eight to a tray
  const byHeight = [...pile].sort((a, b) => a.py - b.py || a.px - b.px);
  byHeight.forEach((p, k) => {
    p.tray = Math.floor(k / 8); p.slot = k % 8; p.k = k;
    p.tx = TR.x + 36 + p.slot * 44; p.ty = TR.y0 + p.tray * TR.pitch + TR.h / 2;
  });
  const tPile = T('b4') + 0.05, tSort = T('b4~huge') - 0.2;
  clock(tPile, tSort + 40 * 0.012 + 0.7, t => pile.forEach(p => {
    const a = cl((t - tPile - p.order * 0.022) / 0.42), ea = eO3(a);
    const b = eIO2(cl((t - tSort - p.k * 0.012) / 0.66));
    xf(p.g, lerp(p.px, p.tx, b), lerp(p.py - 90 * (1 - ea), p.ty, b), 1, p.rot * (1 - b));
    op(p.g, a * 3);
  }));
  S.add(fx.in(trays, { from: 'fade', d: 0.5, stagger: 0.07 }), 'b4~huge-0.1');
  S.add(fx.in(more, { from: 'up', d: 0.5 }), 'b4~groups');

  // the counter beside the pile, running up the orders of magnitude to seventy billion
  const OV = { x: 900 };
  const mulNum = S.counter({ x: OV.x, y: 566, size: 60, value: 0, prefix: '≈ ', color: 'ink' });
  const mulLbl = S.text('multiplications per token', { x: OV.x, y: 628, size: 32, weight: 550, color: 'compute' });
  S.add(fx.in(mulNum, { from: 'up', d: 0.5 }), 'b4~seventy-0.3');
  const cnt0 = T('b4~seventy') - 0.1;
  clock(cnt0, cnt0 + 1.0, t => {
    const p = eO2(cl((t - cnt0) / 1.0));
    mulNum.textContent = '≈ ' + (p >= 1 ? 7e10 : Math.round(Math.pow(10, p * Math.log10(7e10)))).toLocaleString('en-US');
  });
  S.add(fx.in(mulLbl, { from: 'up', d: 0.5 }), 'b4~multiplications-0.1');
  // one tray is one group: no tile in it waits on another
  const tag1 = S.text('within a group, no tile waits', { x: 890, y: 357, size: 30, weight: 550, color: 'muted' });
  const tag2 = S.text('named next chapter: vector × matrix', { x: 890, y: 399, size: 26, weight: 500, color: 'faint' });
  S.add(fx.in(tag1, { from: 'left', d: 0.5 }), 'b4~where-0.05');
  S.add(gsap.fromTo(trays[0], { attr: { 'stroke-opacity': 0.35 } }, { attr: { 'stroke-opacity': 0.95 }, duration: 0.4, immediateRender: false }), 'b4~where-0.05');
  S.add(fx.in(tag2, { from: 'left', d: 0.5 }), 'b4~waits+0.25');
  S.add(fx.out([tag1, tag2, mulNum, mulLbl], { d: 0.35, stagger: 0.04 }), 'b4~so-0.25');
  S.add(gsap.fromTo(trays[0], { attr: { 'stroke-opacity': 0.95 } }, { attr: { 'stroke-opacity': 0.55 }, duration: 0.4, immediateRender: false }), 'b4~so-0.25');

  // 'so a GPU clears thousands': the stack of trays moves to the right edge and feeds both bands
  const STK = { x: 1068, y: 35.4, s: 0.4, ox: 660, oy: 493 };  // stack x 1652-1804, y 463-616; tray 0 slot j -> (1666.4 + 17.6 j, 474)
  S.add(fx.xform(trayHolder, STK, { d: 0.7, ease: 'power3.inOut' }), 'b4~so-0.1');
  fade([topBand, botBand], 0.1, 1, T('b4~so') + 0.3, 0.5);   // bands come up as the stack arrives
  const tS = T('b4~so') + 0.62;                             // the split (≈ 'clears')
  const STEP = [0, 1, 2].map(c => tS + 0.7 + 0.75 * c);     // the four cards take four, the grid clears 576
  const tQ = STEP[2] + 0.42;                                // the queue clears (b5 'Queues clear')

  // the counters at the right edge
  const RX = 1652;
  const cpuCnt = S.g(), gpuCnt = S.g();
  S.text('cleared', { x: RX, y: 288, size: 26, weight: 550, color: 'muted' }, cpuCnt);
  const cpuNum = S.text('0', { x: RX, y: 334, size: 44, weight: 600, family: 'mono', color: 'struct' }, cpuCnt);
  S.text('cleared', { x: RX, y: 762, size: 26, weight: 550, color: 'muted' }, gpuCnt);
  const gpuNum = S.text('0', { x: RX, y: 808, size: 44, weight: 600, family: 'mono', color: 'compute' }, gpuCnt);
  const schem = S.text('schematic', { x: 1810, y: 976, size: 24, weight: 550, color: 'faint', anchor: 'end' });
  S.add(fx.in([cpuCnt, gpuCnt], { from: 'left', d: 0.5, stagger: 0.08 }), tS - 0.1);
  S.add(fx.in(schem, { from: 'fade', d: 0.5 }), tS + 0.3);

  // top stream: tiles leave the top tray and queue under the four cards; each step the front four
  // hop up into the cards while more join the back, so the queue grows
  const Q = { x0: 437, pitch: 40, y: 474, tile: 32, every: 0.06 };
  const NQ = Math.floor((STEP[2] - tS) / Q.every) + 1;      // tiles that join before the last step
  const qTiles = [...Array(NQ)].map((_, k) => { const g = xTile(Q.tile); op(g, 0); return g; });
  const slid = t => STEP.reduce((s, T0) => s + eIO2(cl((t - T0) / 0.35)), 0);
  const restX = (k, t) => Q.x0 + Q.pitch * (k - 4 * slid(t));
  clock(tS - 0.01, tQ + 0.9, t => {
    qTiles.forEach((g, k) => {
      const a = tS + k * Q.every, c = Math.floor(k / 4), served = c < 3;
      if (t < a) { op(g, 0); return; }
      const e = eO3(cl((t - a) / 0.45));
      let x = lerp(1666.4 + 17.6 * (k % 8), restX(k, t), e), y = Q.y, s = lerp(0.4 * 38 / Q.tile, 1, e), o = cl((t - a) / 0.06);
      if (served && t >= STEP[c]) {                         // its turn: hop up into card j
        const j = k - 4 * c, u = cl((t - STEP[c]) / 0.42), eu = eIO2(u);
        x = lerp(Q.x0 + Q.pitch * j, cards[j].sx, eu); y = lerp(Q.y, CY, eu) - 46 * Math.sin(Math.PI * u);
        const w = cl((t - STEP[c] - 0.6) / 0.16);            // worked on, then gone
        s = 1 - 0.4 * w; o = 1 - w;
      } else if (!served) {                                  // still waiting when the queue clears
        const w = cl((t - tQ - 0.012 * (NQ - k)) / 0.25);
        o *= 1 - w; y += 10 * w;
      }
      xf(g, x, y, s); op(g, o);
    });
    // each card flashes as its tile lands; the counter adds four
    cards.forEach((cd, j) => {
      let v = 0; STEP.forEach(T0 => { v = Math.max(v, bump((t - T0 - 0.4) / 0.4)); });
      cd.bg.setAttribute('stroke-opacity', (0.55 + 0.45 * v).toFixed(3));
      cd.slot.setAttribute('stroke-opacity', (0.4 + 0.6 * v).toFixed(3));
    });
    cpuNum.textContent = String(4 * STEP.filter(T0 => t >= T0 + 0.45).length);
  });
  // the top tray empties into the two streams
  const top8 = byHeight.slice(0, 8);
  clock(tS - 0.01, tS + 0.6, t => top8.forEach((p, j) => op(p.g, 1 - cl((t - tS - j * Q.every) / 0.05))));

  // bottom stream: tiles run along a feed line over the grid and rain down, one per square; the whole
  // grid flashes and clears them together, again and again
  const FEED = 650;
  const feedD = `M1648,500 C1612,516 1614,${FEED} 1572,${FEED} L425,${FEED}`;
  const feedLine = S.path({ d: feedD, stroke: 'compute', sw: 2, strokeOpacity: 0.35, dash: '3 7' });
  S.set(feedLine, { autoAlpha: 0 }, 0);
  S.add(fx.in(feedLine, { from: 'fade', d: 0.3 }), tS - 0.05);
  S.flow({ d: feedD, from: tS, to: STEP[2] - 0.1, speed: 1300, every: 0.06, size: 5, color: 'compute', shape: 'chip', glow: false });
  const rain = STEP.map(() => [...Array(G.rows)].map((_, r) => {
    const g = S.g();
    let dq = '', dx = '';
    const a = G.sq * 0.21;
    for (let c = 0; c < G.cols; c++) {
      const x = G.x + c * G.pitch, y = G.y + r * G.pitch, cx = x + G.sq / 2, cy = y + G.sq / 2;
      dq += `M${x},${y}h${G.sq}v${G.sq}h${-G.sq}z`;
      dx += `M${cx - a},${cy - a}L${cx + a},${cy + a}M${cx + a},${cy - a}L${cx - a},${cy + a}`;
    }
    S.path({ d: dq, fill: '#2b1d07', stroke: 'compute', sw: 1.2 }, g);
    S.path({ d: dx, stroke: 'compute', sw: 1.8 }, g);
    g.setAttribute('data-audit', 'ignore');
    op(g, 0);
    g.dy = -34;                                             // each row drops onto its own squares
    return g;
  }));
  clock(tS - 0.01, tQ + 0.2, t => {
    rain.forEach((rows, c) => rows.forEach((g, r) => {
      const s0 = STEP[c] - 0.52 + 0.024 * r, u = cl((t - s0) / 0.22);
      xf(g, 0, g.dy * (1 - eI2(u)));
      op(g, cl((t - s0) / 0.1) * (1 - cl((t - STEP[c] - 0.06) / 0.14)));
    }));
    let v = 0; STEP.forEach(T0 => { v = Math.max(v, bump((t - T0) / 0.34)); });
    op(grid.flash, 0.85 * v);
    gpuNum.textContent = (576 * STEP.filter(T0 => t >= T0 + 0.05).length).toLocaleString('en-US');
  });
  S.add(fx.out([trayHolder, feedLine], { d: 0.4 }), tQ);
  S.add(fx.out([cpuCnt, gpuCnt, schem], { d: 0.4, stagger: 0.05 }), 'b5~historical');

  // ================================================================ b5: graphics, pixels, and chains
  // 'graphics': GPU unfolds into Graphics / Processing / Unit and folds back
  const acro = [['G', 'raphics'], ['P', 'rocessing'], ['U', 'nit']].map(([a, b], i) =>
    S.text([{ t: a, c: 'compute' }, { t: b, c: 'ink' }], { x: i === 2 ? 105 : 110, y: 726 + i * 46, size: 38, weight: 650 }, botBand));   // U's side bearing
  S.set(acro, { autoAlpha: 0 }, 0);
  S.add(fx.out([gpuLabel, ...gpuCap], { d: 0.25 }), 'b5~graphics-0.2');
  S.add(fx.in(acro, { from: 'left', d: 0.45, stagger: 0.09 }), 'b5~graphics');
  S.add(fx.out(acro, { d: 0.3, stagger: 0.04 }), 'b5~colouring-0.65');
  S.add(fx.in(gpuLabel, { from: 'fade', d: 0.4 }), 'b5~colouring-0.35');
  S.add(fx.in(gpuCap, { from: 'fade', d: 0.4 }), 'b5~colouring-0.3');
  fade(topBand, 1, 0.4, T('b5~graphics'), 0.6);

  // 'colouring pixels': the 576 squares rearrange into 32 x 18, a 16:9 screen, and light at once
  // cols 0-31 shrink straight into the screen's top 12 rows; cols 32-47 fold in under them, two grid rows
  // to a screen row (even rows to the left half, odd rows to the right)
  const MON = { x: 680, y: 590, cols: 32, pitch: 17, sq: 14.35 };
  grid.cells.forEach(c => {
    c.fold = c.c >= 32;
    const mc = c.fold ? (c.r % 2) * 16 + (c.c - 32) : c.c, mr = c.fold ? 12 + Math.floor(c.r / 2) : c.r;
    c.mx = MON.x + mc * MON.pitch; c.my = MON.y + mr * MON.pitch;
    const sun = Math.hypot(mc - 22.5, mr - 5.2);
    const hill1 = 11.4 + 1.7 * Math.sin(mc * 0.33 + 0.6) + 0.8 * Math.sin(mc * 0.85);
    const hill2 = 14.2 + 1.1 * Math.sin(mc * 0.27 + 2.2);
    c.img = mr >= hill2 ? 0.34 : mr >= hill1 ? 0.15 : sun < 3.1 ? 1 : sun < 4.5 ? 0.72 : 0.2 + 0.4 * mr / 11;
  });
  const monW = (MON.cols - 1) * MON.pitch + MON.sq, monH = 17 * MON.pitch + MON.sq;   // 541 x 303
  const mcx = MON.x + monW / 2;
  S.rect({ x: MON.x - 18, y: MON.y - 18, w: monW + 36, h: monH + 36, r: 14, fill: '#0a0f1c', stroke: 'ink', strokeOpacity: 0.55, sw: 3 }, bezel);
  S.path({ d: `M${mcx - 22},${MON.y + monH + 18} L${mcx + 22},${MON.y + monH + 18} L${mcx + 30},${MON.y + monH + 50} L${mcx - 30},${MON.y + monH + 50} Z`, fill: '#1a2238', stroke: 'ink', strokeOpacity: 0.45, sw: 2 }, bezel);
  S.rect({ x: mcx - 76, y: MON.y + monH + 48, w: 152, h: 12, r: 6, fill: '#1a2238', stroke: 'ink', strokeOpacity: 0.45, sw: 2 }, bezel);
  S.set(bezel, { autoAlpha: 0 }, 0);
  const monLbl = S.g();
  S.text('1920 × 1080', { x: 1290, y: 712, size: 42, weight: 600, family: 'mono', color: 'ink' }, monLbl);
  S.text('≈ 2 million pixels', { x: 1290, y: 764, size: 30, weight: 550, color: 'muted' }, monLbl);
  const tM = T('b5~colouring') - 0.2, tLight = T('b5~same') - 0.1, tBack = T('b5~work') - 0.15;
  const morph = (c, ux, uy) => {
    const sq = lerp(G.sq, MON.sq, Math.max(ux, uy));
    c.setAttribute('x', lerp(c.hx, c.mx, ux).toFixed(2)); c.setAttribute('y', lerp(c.hy, c.my, uy).toFixed(2));
    c.setAttribute('width', sq.toFixed(2)); c.setAttribute('height', sq.toFixed(2));
  };
  // progress [x, y] of one square's move: going, the left block first, then the folding third; coming
  // back, the folding third first, then the left block
  const phase = (c, t, t0, back) => {
    const lag = c.fold ? (back ? 0 : 0.35) : (back ? 0.3 : 0) + 0.1 * c.c / 31;   // the fold moves as rigid rows
    const k = t - t0 - lag;
    return [eIO2(cl(k / 0.6)), eIO2(cl(k / 0.6))];
  };
  clock(tM, tM + 1.05, t => grid.cells.forEach(c => {
    const [ux, uy] = phase(c, t, tM, false);
    morph(c, ux, uy); c.setAttribute('fill-opacity', lerp(G.fo, 0.2, ux).toFixed(3));
  }));
  S.add(fx.in(bezel, { from: 'fade', d: 0.5 }), tM + 0.45);
  S.add(fx.in(monLbl, { from: 'left', d: 0.5 }), 'b5~pixels-0.1');
  clock(tLight, tLight + 0.16, t => { const k = cl((t - tLight) / 0.16); grid.cells.forEach(c => c.setAttribute('fill-opacity', lerp(0.2, c.img, k).toFixed(3))); });
  clock(tBack, tBack + 1.2, t => grid.cells.forEach(c => {
    const [vx, vy] = phase(c, t, tBack + 0.15, true);
    morph(c, 1 - vx, 1 - vy); c.setAttribute('fill-opacity', lerp(c.img, G.fo, cl((t - tBack) / 0.35)).toFixed(3));
  }));
  S.add(fx.out([bezel, monLbl], { d: 0.35 }), tBack);

  // 'chains': five tokens, each written only after the last; one square works, the rest sit dark
  const chain = libTokenStrip(S, { x: 430, y: 606, tokens: ['Sunlight', ' looks', ' white', ',', ' but'], size: 28, gap: 58, state: 'ghost', hidden: true });
  const links = [0, 1, 2, 3].map(i => S.arrow({ x1: chain.at(i).x2 + 9, y1: 606, x2: chain.at(i + 1).x1 - 9, y2: 606, color: 'struct', sw: 2.5, head: 11 }));
  links.forEach(a => S.set([a.line, a.head], { autoAlpha: 0 }, 0));
  const lit = grid.cells[1 * G.cols + 10];
  const tChain = T('b5~chains') - 0.2;
  const L = [0, 1, 2, 3, 4].map(i => T('b5~each') - 0.25 + 0.72 * i);
  S.add(chain.reveal('all', { every: 0.07 }), tChain);
  L.forEach((tl, i) => {
    S.add(chain.setState(i, 'new', { d: 0.25 }), tl);
    S.add(chain.setState(i, 'token', { d: 0.3 }), tl + 0.42);
    if (i < 4) S.add(fx.drawArrow(links[i], { d: 0.25 }), tl + 0.42);
  });
  clock(tChain - 0.1, L[4] + 0.8, t => {
    const k = cl((t - tChain + 0.1) / 0.35);
    grid.cells.forEach(c => { if (c !== lit) c.setAttribute('fill-opacity', lerp(G.fo, 0.1, k).toFixed(3)); });
    let v = 0; L.forEach(tl => { v = Math.max(v, bump((t - tl + 0.12) / 0.4)); });
    lit.setAttribute('fill-opacity', (G.fo + 0.45 * v).toFixed(3));
  });
  const chainTags = S.g();
  const chTag1 = S.text('each waits for the last', { x: chain.at(4).x2 + 56, y: 590, size: 30, weight: 550, color: 'muted' }, chainTags);
  const chTag2 = S.text('returns later', { x: chain.at(4).x2 + 56, y: 627, size: 24, weight: 500, color: 'faint' }, chainTags);
  S.add(fx.in(chTag1, { from: 'left', d: 0.5 }), 'b5~needing-0.1');
  S.add(fx.in(chTag2, { from: 'left', d: 0.5 }), 'b5~like-0.1');

  // ================================================================ b6: not chosen for cleverness
  const t6 = T('b6') - 0.15;
  S.add(fx.out([chain, ...links, chTag1, chTag2], { d: 0.35, stagger: 0.02 }), t6);
  fade(topBand, 0.4, 0.18, t6 + 0.1, 0.7);
  S.add(fx.out([gpuLabel, ...gpuCap, divider, botPanel], { d: 0.4 }), t6);
  const GE = CH06.GRID_END;
  S.add(fx.xform(gridHolder, { x: GE.x, y: GE.y, s: GE.s, ox: GE.ox, oy: GE.oy }, { d: 1.2, ease: 'power3.inOut' }), t6 + 0.15);
  clock(t6 + 0.1, t6 + 1.1, t => { const k = eO2(cl((t - t6 - 0.1) / 1.0)); grid.cells.forEach(c => c.setAttribute('fill-opacity', lerp(c === lit ? G.fo : 0.1, GE.fo, k).toFixed(3))); });
  const head = S.text('not chosen for cleverness', { x: 960, y: 466, size: 54, weight: 700, family: 'display', anchor: 'middle', color: 'ink' });
  S.add(fx.in(head, { from: 'up', d: 0.7 }), 'b6~Not-0.1');
  const WORDS = ['vast', 'identical', 'independent'];
  const ws = WORDS.map(w => S.measure(w, { size: 46, weight: 650 }));
  const gap = 72, tot = ws.reduce((a, b) => a + b, 0) + gap * (WORDS.length - 1);
  let wx = 960 - tot / 2;
  const words = WORDS.map((w, i) => { const e = S.text(w, { x: wx + ws[i] / 2, y: 540, size: 46, weight: 650, anchor: 'middle', color: 'compute' }); wx += ws[i] + gap; return e; });
  words.forEach((e, i) => S.add(fx.in(e, { from: 'up', d: 0.55, dist: 24 }), `b6~${WORDS[i]}-0.15`));
  // every square at once, on 'multiplications' and on 'good at'
  [T('b6~multiplications') - 0.05, T('b6~good') - 0.05].forEach(tp => clock(tp, tp + 0.6, t => op(grid.flash, 0.7 * bump((t - tp) / 0.55))));
});
