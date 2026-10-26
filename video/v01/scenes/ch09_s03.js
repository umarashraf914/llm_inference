/* ch09_s03 · read, never written (figs 108, 105)
   One composition, left to right: the coral block '140 GB of weights' (lock on its corner), the bus (hair-thin
   coral lines), the amber chip, two users joined to the chip by thin blue lines. Nothing clears.
   b1  header 'The weights are read, never written' / 'nothing about them changes while the service runs'; a
       coral arrow lifts a copy of one tile out of the block ('read = copy out'); a pencil hovers ('write =
       change'), is crossed out, and the lock shuts; inset 'training: rewritten every step' / 'serving: read
       only'.
   b2  the bus, the chip and two users ('weather tomorrow?', 'fix my code'); questions travel in as blue pills,
       coral streams cross the bus, answers travel back; 'the same 140 GB, / for every request from every user'
       becomes teal 'one copy serves everyone' with a faint teal outline round it all; both questions ride one
       stream: 'batching: later'.
   b3  'every forward pass': a '140 GB' packet crosses for each token (token 1, 2, 3), each the same time;
       'at most ≈ 24 a second · H100 what-if' (3.35 TB/s ÷ 140 GB = 23.9); footnote 'strictly ≈ 139 GB:
       embedding rows are only gathered' (141.2 − 2.1 GB).
   b4  the chip's own '≈ 0.1 GB' box; a ribbon of layer slices ('layer 1', 'layer 2', '… layer 80') passes
       through it a few at a time; time-lapse, the counter races, '500 tokens → 70 TB' (500 × 140 GB); a fresh
       ribbon sets off.
   b5  teal arrow 'one copy serves everyone' to the users; coral arrow 'the same bytes, fetched every token'
       along the bus; the camera pushes in on the bus gap, which glows and pulses; takeaway 'close and wide, but
       not on the die'.
   Layout: block centre (340, 540); bus x 520-1110 at y 540; chip centre (1220, 540), 180 px; users x 1680 at
   y 380 / 700. */
V.scene('ch09_s03', S => {
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = n => gsap.parseEase(n);
  const EIO = E('power2.inOut');
  const drive = (d, fn) => { const p = { v: 0 }; return gsap.fromTo(p, { v: 0 }, { v: 1, duration: Math.max(0.001, d), ease: 'none', immediateRender: false, onStart: () => fn(p.v), onUpdate: () => fn(p.v), onReverseComplete: () => fn(0) }); };
  const clock = (a, b, fn) => S.add(drive(b - a, k => fn(a + k * (b - a))), a);
  const whole = fn => { fn(0); clock(0, S.duration, fn); };
  const setO = (e, v) => { e.style.opacity = v; e.style.visibility = v > 0.001 ? 'inherit' : 'hidden'; };
  const hide = els => [].concat(els).forEach(e => setO(e, 0));
  const fade = (els, a, b, at, d = 0.45, stagger = 0) => [].concat(els).forEach((e, i) => S.add(drive(d, k => setO(e, lerp(a, b, E('power2.out')(k)))), at + i * stagger));
  const ignore = (els, at, d) => clock(at, at + d, t => [].concat(els).forEach(e => (t > at && t < at + d ? e.setAttribute('data-audit', 'ignore') : e.removeAttribute('data-audit'))));
  const pulse = (el, at, peak, d = 0.6) => S.add(gsap.fromTo(el, { attr: { opacity: 0 } }, { attr: { opacity: peak }, duration: d / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), at);

  // ================================================================ header; the world (the camera moves it in b5)
  const hd = S.text('The weights are read, never written', { x: 110, y: 130, size: 46, weight: 700, family: 'display', color: 'ink' });
  const sub = S.text('nothing about them changes while the service runs', { x: 110, y: 186, size: 30, weight: 600, color: 'muted' });
  hide([hd, sub]);
  fade([hd, sub], 0, 1, 0.3, 0.5, 0.25);
  const world = S.g();
  const BC = [340, 540], BUS0 = 520, BUS1 = 1110, CH = [1220, 540], CS = 180, U = [[1680, 380], [1680, 700]];
  const mem = ch09Memory(S, { x: BC[0], y: BC[1], s: 1.06, filled: true, label: '140 GB of weights', labelSize: 32 }, world);
  const lockG = S.g(null, world);
  const lockO = S.icon('ph:lock-simple-open-duotone', { x: BC[0] + 168, y: BC[1] - 80, size: 40, color: 'ink' }, lockG);
  const lockC = S.icon('ph:lock-simple-duotone', { x: BC[0] + 168, y: BC[1] - 80, size: 40, color: 'ink' }, lockG);
  hide([mem, lockC]);
  fade(mem, 0, 1, 0.6, 0.6);
  hide(lockO);
  fade(lockO, 0, 1, 1.0, 0.4);

  // ================================================================ b1: read = copy out; write = change
  const tRead = T('b1~only') - 0.1;
  const tile = S.rect({ x: -22, y: -22, w: 44, h: 44, r: 6, fill: 'url(#solid-bytes)', stroke: 'white', strokeOpacity: 0.5, sw: 1.5 }, world);
  const tileSrc = [250, 474], tileDst = [250, 322];
  whole(t => {
    const k = E('power3.out')(cl((t - tRead - 0.2) / 0.7));
    tile.setAttribute('transform', `translate(${tileSrc[0]},${lerp(tileSrc[1], tileDst[1], k).toFixed(1)})`);
    setO(tile, cl((t - tRead) / 0.2) * (1 - cl((t - T('b2') + 0.2) / 0.4)));
  });
  const rArr = S.arrow({ x1: 250, y1: 438, x2: 250, y2: 352, color: 'bytes', sw: 4 }, world);
  hide(rArr);
  fade(rArr, 0, 1, tRead + 0.1, 0.4);
  const rLab = S.text('read = copy out', { x: 250, y: 268, size: 25, weight: 700, anchor: 'middle', color: 'bytes' }, world);
  hide(rLab);
  fade(rLab, 0, 1, T('b1~copied') - 0.1, 0.4);
  const pen = S.g(null, world);
  S.icon('ph:pencil-simple-duotone', { x: 470, y: 350, size: 54, color: 'ink' }, pen);
  const penX = S.path({ d: 'M440,320 L500,380', stroke: 'muted', sw: 5 }, pen);
  penX.setAttribute('stroke-dasharray', '90 90');
  penX.setAttribute('data-audit', 'ignore');
  const tWr = T('b1~never') - 0.1, tCh = T('b1~never#2') - 0.1;
  hide(pen);
  whole(t => { const k = cl((t - tWr) / 0.4); setO(pen, k * (1 - 0.6 * cl((t - tCh - 0.3) / 0.4)) * (1 - cl((t - T('b2') + 0.15) / 0.35))); pen.setAttribute('transform', `translate(0,${(-6 * Math.sin(t * 4) * k).toFixed(1)})`); });
  whole(t => penX.setAttribute('stroke-dashoffset', (90 * (1 - EIO(cl((t - tCh - 0.1) / 0.35)))).toFixed(1)));
  const wLab = S.text('write = change', { x: 480, y: 268, size: 25, weight: 700, anchor: 'middle', color: 'ink' }, world);
  hide(wLab);
  fade(wLab, 0, 1, tCh, 0.4);
  fade(lockO, 1, 0, tCh + 0.4, 0.15);
  fade(lockC, 0, 1, tCh + 0.4, 0.15);
  const tTr = T('b1~Training') - 0.1;
  fade([rLab, wLab], 1, 0.4, tTr, 0.4);
  const inset1 = S.text('training: rewritten every step', { x: 110, y: 898, size: 26, weight: 600, color: 'muted' });
  const inset2 = S.text('serving: read only', { x: 110, y: 942, size: 28, weight: 700, color: 'ink' });
  hide([inset1, inset2]);
  fade(inset1, 0, 1, tTr + 0.1, 0.4);
  fade(inset2, 0, 1, T('b1~Serving') - 0.1, 0.4);

  // ================================================================ b2: two users, one copy
  const tB2 = T('b2') - 0.15;
  fade([rLab, wLab], 0.4, 0, tB2, 0.35);
  fade([rArr, inset1, inset2], 1, 0, tB2, 0.35);
  fade(sub, 1, 0.3, tB2, 0.4);
  const bus = ch09Bus(S, { x1: BUS0, x2: BUS1, y1: 540, h1: 96, h2: 96, n: 44, sw: 1.1, opacity: 0.7 }, world);
  hide(bus);
  fade(bus, 0, 1, tB2 + 0.1, 0.01);
  S.add(bus.draw({ d: 0.8 }), tB2 + 0.1);
  const busHi = S.rect({ x: BUS0, y: 488, w: BUS1 - BUS0, h: 104, r: 8, fill: 'bytes', opacity: 0 }, world);
  busHi.setAttribute('data-audit', 'ignore');
  const chip = ch09Chip(S, { x: CH[0], y: CH[1], size: CS }, world);
  const chipFlash = S.rect({ x: CH[0] - CS / 2 - 10, y: CH[1] - CS / 2 - 10, w: CS + 20, h: CS + 20, r: 22, fill: 'compute', opacity: 0 }, world);
  chipFlash.setAttribute('data-audit', 'ignore');
  hide(chip);
  fade(chip, 0, 1, tB2 + 0.3, 0.5);
  // the users and their lines
  const users = U.map(([x, y], i) => {
    const g = S.g(null, world);
    S.path({ d: `M${CH[0] + CS / 2 + 12},${CH[1] + (i ? 30 : -30)} L${x - 52},${y}`, stroke: 'struct', strokeOpacity: 0.7, sw: 2 }, g).setAttribute('data-audit', 'ignore');
    S.icon('ph:user-circle-duotone', { x, y, size: 84, color: 'struct' }, g);
    return g;
  });
  const lineP = i => [[CH[0] + CS / 2 + 12, CH[1] + (i ? 30 : -30)], [U[i][0] - 52, U[i][1]]];
  const tUsers = tB2 + 0.5;
  users.forEach((u, i) => S.add(drive(0.6, k => { const e = E('power3.out')(k); u.setAttribute('transform', `translate(${lerp(160, 0, e).toFixed(1)},0)`); setO(u, k); }), tUsers + 0.15 * i));
  users.forEach(u => setO(u, 0));
  const bubbles = ['weather tomorrow?', 'fix my code'].map((q, i) => { const b = S.pill(q, { x: U[i][0], y: U[i][1] - 74, tone: 'struct', size: 24, h: 44, case: 'keep' }, world); hide(b); return b; });
  fade(bubbles, 0, 1, tUsers + 0.4, 0.35, 0.2);
  // questions in as pills, a coral stream, answers back out
  const tQ = T('b2~questions') - 0.1;
  const qp = [0, 1].map(i => { const p = S.rect({ x: -16, y: -9, w: 32, h: 18, r: 9, fill: 'url(#solid-struct)' }, world); hide(p); return p; });
  const ap = [0, 1].map(i => { const p = S.rect({ x: -16, y: -9, w: 32, h: 18, r: 9, fill: 'struct', fillOpacity: 0.55, stroke: 'struct', sw: 2 }, world); hide(p); return p; });
  const travel = (el, i, t0, d, back) => S.add(drive(d, k => {
    const [a, b] = lineP(i), e = EIO(k), u = back ? e : 1 - e;
    el.setAttribute('transform', `translate(${lerp(a[0], b[0], u).toFixed(1)},${lerp(a[1], b[1], u).toFixed(1)})`);
    setO(el, k <= 0 || k >= 1 ? 0 : Math.min(1, k * 6, (1 - k) * 6));
  }), t0);
  qp.forEach((p, i) => travel(p, i, tQ + 0.25 * i, 0.9, false));
  fade(bubbles, 1, 0, tQ + 0.6, 0.4);
  // coral streams across the bus (a window of particles), with an amber flash in the chip
  const streamG = S.g(null, world);
  streamG.setAttribute('data-audit', 'ignore');
  const sr = S.rand(31), sParts = Array.from({ length: 60 }, () => ({ y: 540 + (sr() - 0.5) * 84, ph: sr(), el: S.rect({ x: -4, y: -1.5, w: 8, h: 3, r: 1, fill: 'bytes', opacity: 0 }, streamG) }));
  const streamOn = [[tQ + 0.6, tQ + 2.6], [T('b2~batching') - 0.1, T('b2~pass') + 0.4]];
  whole(t => {
    let on = 0;
    streamOn.forEach(([a, b]) => { on = Math.max(on, cl((t - a) / 0.3) * (1 - cl((t - b) / 0.3))); });
    sParts.forEach(p => {
      const u = (t * 0.8 + p.ph) % 1;
      p.el.setAttribute('transform', `translate(${lerp(BUS0, BUS1, u).toFixed(1)},${p.y.toFixed(1)})`);
      p.el.setAttribute('opacity', (on * 0.9 * Math.min(1, u * 10, (1 - u) * 10)).toFixed(3));
    });
  });
  pulse(chipFlash, tQ + 1.2, 0.3, 0.7);
  ap.forEach((p, i) => travel(p, i, tQ + 1.9 + 0.2 * i, 0.9, true));
  // the same 140 GB → one copy serves everyone
  const same = S.g(null, world);
  S.text('the same 140 GB,', { x: BC[0], y: 676, size: 28, weight: 700, anchor: 'middle', color: 'ink' }, same);
  S.text('for every request from every user', { x: BC[0], y: 714, size: 24, weight: 600, anchor: 'middle', color: 'muted' }, same);
  hide(same);
  fade(same, 0, 1, T('b2~same') - 0.1, 0.4);
  const tOne = T('b2~one') - 0.1;
  fade(same, 1, 0, tOne, 0.35);
  const oneTag = S.text('one copy serves everyone', { x: BC[0], y: 690, size: 30, weight: 750, anchor: 'middle', color: 'helps' }, world);
  hide(oneTag);
  fade(oneTag, 0, 1, tOne + 0.2, 0.4);
  const wrap = S.rect({ x: 120, y: 254, w: 1680, h: 560, r: 30, fill: 'none', stroke: 'helps', strokeOpacity: 0.5, sw: 2.5, dash: '12 10' }, world);
  wrap.setAttribute('data-audit', 'ignore');
  hide(wrap);
  fade(wrap, 0, 0.7, tOne + 0.3, 0.6);
  // batching: both questions on one stream
  const tBat = T('b2~batching') - 0.1;
  const qp2 = [0, 1].map(() => { const p = S.rect({ x: -16, y: -9, w: 32, h: 18, r: 9, fill: 'url(#solid-struct)' }, world); hide(p); return p; });
  qp2.forEach((p, i) => travel(p, i, tBat, 0.9, false));
  pulse(chipFlash, tBat + 0.9, 0.3, 0.7);
  const batT = S.text('batching: later', { x: CH[0], y: CH[1] + CS / 2 + 44, size: 24, weight: 600, anchor: 'middle', color: 'muted' }, world);
  hide(batT);
  fade(batT, 0, 1, tBat + 0.3, 0.4);

  // ================================================================ b3: every forward pass moves all of it
  const tB3 = T('b3') - 0.1;
  fade([...users, batT], 1, 0.3, tB3, 0.4);
  fade(batT, 0.3, 0, tB3 + 1.0, 0.3);
  fade(oneTag, 1, 0.35, tB3, 0.4);
  fade(wrap, 0.7, 0.3, tB3, 0.4);
  S.add(gsap.fromTo(busHi, { attr: { opacity: 0 } }, { attr: { opacity: 0.08 }, duration: 0.5, immediateRender: false }), tB3);
  const efp = S.text('every forward pass', { x: (BUS0 + BUS1) / 2, y: 456, size: 28, weight: 700, anchor: 'middle', color: 'bytes' }, world);
  hide(efp);
  fade(efp, 0, 1, tB3 + 0.2, 0.4);
  // packets: '140 GB' blocks crossing in the same time each
  const PD = 1.2;
  const packet = (t0, label = true) => {
    const g = S.g(null, world);
    g.setAttribute('data-audit', 'ignore');   // it moves across the bus
    S.rect({ x: -62, y: -30, w: 124, h: 60, r: 10, fill: 'url(#solid-bytes)' }, g);
    if (label) S.text('140 GB', { x: 0, y: 1, size: 24, weight: 700, family: 'mono', anchor: 'middle', color: '#0a0f1e' }, g);
    S.add(drive(PD, k => {
      const x = lerp(BUS0 - 10, CH[0], E('power1.inOut')(k));
      g.setAttribute('transform', `translate(${x.toFixed(1)},540) scale(${lerp(1, 0.6, cl((k - 0.8) / 0.2)).toFixed(3)})`);
      setO(g, k <= 0 || k >= 1 ? 0 : Math.min(1, k * 8, (1 - k) * 6));
    }), t0);
    pulse(chipFlash, t0 + PD - 0.1, 0.35, 0.5);
    hide(g);
    return g;
  };
  const tP = [T('b3~every') - 0.1, T('b3~one') - 0.1, T('b3~arithmetic') - 0.3];
  tP.forEach(t0 => packet(t0));
  const tokN = S.text('token 0', { x: CH[0], y: CH[1] - CS / 2 - 40, size: 30, weight: 700, family: 'mono', anchor: 'middle', color: 'ink' }, world);
  hide(tokN);
  fade(tokN, 0, 1, tP[0] + PD - 0.2, 0.3);
  // the counter: one per packet in b3; racing in the b4 time-lapse; once more on 'or saved'
  const tB4 = T('b4') - 0.1, tAgain = T('b4~again') - 0.1, tSaved = T('b4~or') - 0.1;
  const LAPSE0 = T('b4~again#2') + 0.2, LAPSE1 = tSaved - 0.3, tR4 = tB4 + 1.5;
  const lapseK = t => E('power2.in')(cl((t - LAPSE0) / (LAPSE1 - LAPSE0)));
  whole(t => {
    let n = tP.filter(x => t >= x + PD - 0.1).length;
    if (t >= tR4) n = 4;
    if (t > LAPSE0) n = 4 + Math.round(496 * lapseK(t));
    if (t >= tSaved + 0.4) n = 501;
    tokN.textContent = `token ${Math.max(1, n)}`;
  });
  const rate = S.text('at most ≈ 24 a second · H100 what-if', { x: CH[0], y: CH[1] + CS / 2 + 44, size: 24, weight: 600, anchor: 'middle', color: 'muted' }, world);
  const foot = S.text('strictly ≈ 139 GB: embedding rows are only gathered', { x: 960, y: 1012, size: 22, weight: 600, anchor: 'middle', color: 'muted' });
  hide([rate, foot]);
  fade(rate, 0, 1, T('b3~one') + 0.6, 0.4);
  fade(foot, 0, 1, T('b3~across') - 0.1, 0.4);

  // ================================================================ b4: pure overhead
  fade([rate, foot], 1, 0, tB4, 0.35);
  const store = ch09ChipStore(S, { x: CH[0], y: CH[1], size: 56, label: '≈ 0.1 GB', labelSize: 20, labelPos: 'below' }, world);   // label clear of the die's frame
  hide(store);
  fade(store, 0, 1, tB4, 0.4);
  // a ribbon of layer slices, passing through the chip's store a few at a time
  const ribbon = (t0, labels) => {
    const g = S.g(null, world);
    g.setAttribute('data-audit', 'ignore');
    const N = 18, SPC = 24, slices = [];
    for (let i = 0; i < N; i++) slices.push(S.rect({ x: -9, y: -26, w: 18, h: 52, r: 3, fill: 'bytes', fillOpacity: 0.85 }, g));
    const labs = labels ? [[0, 'layer 1', -48], [1, 'layer 2', 50], [N - 1, '… layer 80', -48]].map(([i, s, dy]) => [i, S.text(s, { x: 0, y: dy, size: 22, weight: 650, anchor: 'middle', color: 'bytes' })]) : [];
    labs.forEach(([, e]) => { world.appendChild(e); e.setAttribute('data-audit', 'ignore'); e.setAttribute('opacity', 0); });
    const speed = 600, dur = (CH[0] + 50 - BUS0 + N * SPC) / speed;
    clock(t0, t0 + dur, t => {
      const head = BUS0 - 10 + (t - t0) * speed;
      slices.forEach((s, i) => {
        const x = head - i * SPC, inChip = x > CH[0] - 34 && x < CH[0] + 34, past = x >= CH[0] + 34;
        s.setAttribute('transform', `translate(${x.toFixed(1)},540)`);
        s.setAttribute('opacity', (x < BUS0 - 10 || past ? 0 : inChip ? 1 : 0.85).toFixed(2));
        if (inChip) s.setAttribute('fill', S.tone('compute')); else s.setAttribute('fill', S.tone('bytes'));
      });
      labs.forEach(([i, e]) => { const x = head - i * SPC, vis = x > BUS0 + 70 && x < CH[0] - 70 ? 1 : 0; e.setAttribute('transform', `translate(${x.toFixed(1)},540)`); e.setAttribute('opacity', (vis * (1 - cl((t - tAgain) / 0.35))).toFixed(3)); });
    });
    slices.forEach(s => s.setAttribute('opacity', 0));
    return { labs: labs.map(l => l[1]), dur };
  };
  const r1 = ribbon(tB4 + 0.2, true);
  // the time-lapse: plain packets, faster and faster
  const lapse = S.text('time-lapse', { x: (BUS0 + BUS1) / 2, y: 410, size: 24, weight: 600, anchor: 'middle', color: 'muted' }, world);
  hide(lapse);
  fade(lapse, 0, 1, LAPSE0, 0.3);
  fade(lapse, 1, 0, tSaved, 0.3);
  const lapseG = S.g(null, world);
  lapseG.setAttribute('data-audit', 'ignore');
  const lp = Array.from({ length: 10 }, () => S.rect({ x: -40, y: -22, w: 80, h: 44, r: 8, fill: 'url(#solid-bytes)', opacity: 0 }, lapseG));
  whole(t => {
    const on = cl((t - LAPSE0) / 0.2) * (1 - cl((t - LAPSE1) / 0.2));
    // phase accumulates faster and faster: packets per second rises from 1.5 to 12
    const tt = Math.max(0, t - LAPSE0), ph = 1.5 * tt + 3.5 * tt * tt;
    lp.forEach((p, i) => {
      const u = ((ph + i / lp.length * 6) % 1);
      p.setAttribute('transform', `translate(${lerp(BUS0 + 30, CH[0], u).toFixed(1)},540)`);
      p.setAttribute('opacity', (on * 0.9 * Math.min(1, u * 8, (1 - u) * 8)).toFixed(3));
    });
  });
  const total = S.text('', { x: (BUS0 + BUS1) / 2, y: 640, size: 32, weight: 700, family: 'mono', anchor: 'middle', color: 'bytes' }, world);
  hide(total);
  fade(total, 0, 1, LAPSE0 + 0.2, 0.3);
  whole(t => { const n = Math.round(500 * lapseK(t)); total.textContent = `${Math.max(1, n)} tokens → ${(n * 0.14).toFixed(n >= 500 ? 0 : 1)} TB`; });
  const r2 = ribbon(tSaved + 0.3, false);
  void r2;

  // ================================================================ b5: two consequences
  const tB5 = T('b5') - 0.1;
  fade(total, 1, 0, tB5, 0.35);
  fade(efp, 1, 0.4, tB5, 0.4);
  const tTeal = T('b5~One') - 0.1;
  fade(users, 0.3, 1, tTeal, 0.4);
  const tealA = S.g(null, world);
  const taD = `M${BC[0] + 40},${BC[1] - 100} Q${960},${70} ${U[0][0] - 70},${(U[0][1] + U[1][1]) / 2 - 40}`;
  const ta = S.path({ d: taD, stroke: 'helps', sw: 7 }, tealA);
  ta.setAttribute('stroke-dasharray', '2000 2000');
  ta.setAttribute('data-audit', 'ignore');
  const taHead = S.path({ d: `M${U[0][0] - 96},${(U[0][1] + U[1][1]) / 2 - 64} L${U[0][0] - 70},${(U[0][1] + U[1][1]) / 2 - 40} L${U[0][0] - 104},${(U[0][1] + U[1][1]) / 2 - 30}`, stroke: 'helps', sw: 7 }, tealA);
  const taL = S.text('one copy serves everyone', { x: 960, y: 232, size: 34, weight: 750, anchor: 'middle', color: 'helps' }, tealA);
  hide([taHead, taL]);
  whole(t => ta.setAttribute('stroke-dashoffset', (2000 * (1 - EIO(cl((t - tTeal) / 0.9)))).toFixed(1)));
  fade(taHead, 0, 1, tTeal + 0.8, 0.2);
  fade(taL, 0, 1, tTeal + 0.5, 0.4);
  fade(oneTag, 0.35, 0, tTeal, 0.3);
  const tCor = T('b5~fetched') - 0.1;
  const coralA = S.g(null, world);
  const caLen = BUS1 - BUS0 - 40;
  const ca = S.path({ d: `M${BUS0 + 10},640 H${BUS1 - 30}`, stroke: 'bytes', sw: 9 }, coralA);
  ca.setAttribute('stroke-dasharray', `${caLen} ${caLen}`);
  ca.setAttribute('data-audit', 'ignore');
  const caHead = S.path({ d: `M${BUS1 - 46},622 L${BUS1 - 18},640 L${BUS1 - 46},658`, stroke: 'bytes', sw: 9 }, coralA);
  const caL = S.text('the same bytes, fetched every token', { x: (BUS0 + BUS1) / 2, y: 692, size: 28, weight: 700, anchor: 'middle', color: 'bytes' }, coralA);
  hide([caHead, caL]);
  whole(t => ca.setAttribute('stroke-dashoffset', (caLen * (1 - EIO(cl((t - tCor) / 0.7)))).toFixed(1)));
  fade(caHead, 0, 1, tCor + 0.6, 0.2);
  fade(caL, 0, 1, tCor + 0.3, 0.4);
  // close is not on: push in on the gap, which glows
  const tPush = T('b5~not') - 0.1;
  fade([taL, caL], 1, 0.4, tPush, 0.4);
  fade(tealA, 1, 0.45, tPush, 0.6);
  fade(hd, 1, 0, tPush, 0.5);
  fade(sub, 0.3, 0, tPush, 0.5);
  fade(tokN, 1, 0.4, tPush, 0.4);
  const gapGlow = S.rect({ x: BUS0, y: 486, w: BUS1 - BUS0, h: 108, r: 10, fill: 'url(#pglow-bytes)', opacity: 0 }, world);
  gapGlow.setAttribute('data-audit', 'ignore');
  const GC = [(BUS0 + BUS1) / 2, 540];
  whole(t => {
    const k = EIO(cl((t - tPush) / 1.4)), z = lerp(1, 1.9, k);
    world.setAttribute('transform', `translate(${(960 - GC[0] * z + (GC[0] - 960) * (1 - k) * z).toFixed(1)},${(540 - GC[1] * z).toFixed(1)}) scale(${z.toFixed(4)})`);
    const pay = T('b5~pays') - 0.15, pp = (t - pay) / 0.8;
    gapGlow.setAttribute('opacity', (0.85 * cl((t - tPush - 0.6) / 0.6) + (pp > 0 && pp < 1 ? 0.5 * Math.sin(Math.PI * pp) : 0)).toFixed(3));
  });
  ignore([world], tPush, S.duration - tPush);
  const take = S.takeaway('close and wide, but not on the die', { tone: 'bytes' });
  hide(take);
  fade(take, 0, 1, T('b5~every#2') - 0.1, 0.5);
});
