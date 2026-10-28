/* ch16_s07 · a shared pool, emptied by pressure (fig 53)
   The cache is a fixed pool of blocks on one machine that everyone competes for. When a new request needs room
   the least recently used blocks are dropped: no timer, only pressure. A minute later yours may survive on a
   quiet machine and be gone on a busy one; a day later they are gone everywhere. A quoted lifetime of a few
   minutes is a guideline about typical load: warmth is likely, not certain, and fades rather than expires.
   b1  a locker, crossed out; the pool panel draws and fills row by row (yours: three at the top left, the shared
       preamble cluster); request strips queue at the right.
   b2  every block's clock dial; a strip needing four blocks; the four oldest go dashed and drop out, the
       newcomer's blocks take their places, 'least recently used goes first'; a stopwatch, crossed out.
   b3  the panel splits into a quiet and a busy machine, '1 minute later': yours survive on the quiet one and are
       churned out on the busy one; 'a day later' the panels merge and refill ×1, ×2, ×3; yours are nowhere.
   b4  the camera pans right to a schematic chart: two falling curves, the quoted lifetime, a crossed-out timer
       step; 'demand for space, not elapsed time'. The chart, its labels and that line centre as one block.
   Layout: the world group W pans by -1920 in b4 (the chart is built at world x + 1920). Panel x 404-1516,
   y 300-700, blocks 64 × 46 at (466 + 76 c, 353 + 58 r), 6 rows × 14 columns (schematic). */
V.scene('ch16_s07', S => {
  const K = libKit(S), { T, cl, E, EIO, whole, setO, hide, fade } = K;
  const tB2 = T('b2') - 0.1, tB4 = T('b4') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const hsh = i => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const W = S.g();
  const pos = (r, c) => [466 + 76 * c, 353 + 58 * r];
  const kind = (r, c) => (r === 0 && c < 3 ? 'you' : r === 1 && c < 4 ? 'pre' : 'other');
  const OLD = [[2, 5], [3, 9], [4, 2], [5, 11]], isOld = (r, c) => OLD.some(([a, b]) => a === r && b === c);
  const age = (r, c) => (kind(r, c) === 'you' ? 0.12 : kind(r, c) === 'pre' ? 0.03 : isOld(r, c) ? 0.97 : 0.15 + 0.7 * hsh(r * 14 + c));
  const sortPlan = p => [p[0], ...p.slice(1).sort((a, b) => a[0] - b[0])];

  const tPool = T('b1~fixed') - 0.1, tDial = tB2 + 0.1, tLRU = T('b2~least') - 0.1;
  const tSplit = T('b3~minute') - 0.2, tGone = T('b3~gone') - 0.3, tDay = T('b3~day') - 0.15;
  const tFill = (r, c) => tPool + 0.4 + 0.13 * r + 0.012 * c;
  // a block with its clock dial, in a holder that can move; the dial shows while the block is there
  const blockAt = (parent, r, c, plan, dialFrom, dialAge = age(r, c)) => {
    const h = S.g(null, parent), [x, y] = pos(r, c);
    ch16Block(S, { x, y, w: 64, h: 46, plan }, h);
    const d = S.g(null, h);
    d.setAttribute('data-audit', 'ignore');
    S.circle({ x: x + 27, y: y - 18, r: 8, fill: CH16.BASE, stroke: '#c8d2ea', strokeOpacity: 0.8, sw: 1.5 }, d);
    const a = (-90 + 330 * dialAge) * Math.PI / 180;
    S.path({ d: `M${x + 27},${y - 18} l${(6 * Math.cos(a)).toFixed(2)},${(6 * Math.sin(a)).toFixed(2)}`, stroke: '#ffffff', sw: 1.8 }, d);
    whole(t => { const op = ch16PlanOp(plan, t, cl); setO(d, cl((t - dialFrom) / 0.4) * Math.min(1, (op.grey || 0) + (op.held || 0) + (op.coral || 0))); });
    return h;
  };
  const frame = (parent, at) => {
    const f = S.rect({ x: 404, y: 300, w: 1112, h: 400, r: 20, fill: '#1a0f14', fillOpacity: 0.55, stroke: 'bytes', sw: 3 }, parent);
    if (at != null) { K.draw(f, 3100, at, 0.7); whole(t => f.setAttribute('fill-opacity', (0.55 * cl((t - at - 0.3) / 0.4)).toFixed(3))); }
    return f;
  };

  // ================================================================ b1: not a private locker, a fixed pool
  const why = S.text('Why is a minute warm and a day cold?', { x: 960, y: 150, size: 38, weight: 750, anchor: 'middle', color: 'ink' }, W);
  rise(why, T('b1~Why') - 0.1, 10);
  fade(why, 1, 0, tB2, 0.4);
  const locker = S.g(null, W);
  S.icon('ph:lockers-duotone', { x: 960, y: 500, size: 150, color: 'muted' }, locker);
  S.pill('a private locker?', { x: 960, y: 610, tone: 'neutral', size: 26, h: 44 }, locker);
  rise(locker, T('b1~cache') - 0.2, 10);
  const lx = S.path({ d: 'M880,420 L1040,580 M1040,420 L880,580', stroke: 'muted', sw: 6 }, W);
  lx.setAttribute('data-audit', 'ignore');
  K.draw(lx, 460, T('b1~not') - 0.05, 0.35);
  fade([locker, lx], 1, 0, tPool - 0.3, 0.35);
  const P0 = S.g(null, W);
  frame(P0, tPool);
  const title = S.text("one machine's cache memory", { x: 960, y: 272, size: 28, weight: 750, anchor: 'middle', color: 'bytes' }, W);
  rise(title, tPool + 0.2, 6);
  const Q = [[0, 13, T('b3~quiet') - 0.2], [5, 6, T('b3~busy') - 0.4]];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 14; c++) {
    const k = kind(r, c), tf = tFill(r, c);
    let plan = [[0, 'empty'], [tf, k === 'other' ? 'grey' : 'held', 0.25]];
    if (isOld(r, c)) plan.push([tLRU + 0.1, 'dash', 0.25], [tLRU + 0.8, 'empty', 0.25]);
    Q.forEach(([qr, qc, tq]) => { if (qr === r && qc === c) plan.push([tq + 0.5, 'dash', 0.12], [tq + 0.75, 'grey', 0.2]); });
    plan = sortPlan(plan);
    const h = blockAt(P0, r, c, plan, tDial);
    if (isOld(r, c)) whole(t => h.setAttribute('transform', `translate(0,${(36 * E('power2.in')(cl((t - tLRU - 0.35) / 0.5))).toFixed(1)})`));
  }
  const youT = S.pill('you', { x: pos(0, 1)[0], y: 300 - 26, tone: 'helps', size: 24, h: 38 }, W);
  rise(youT, tFill(0, 2) + 0.3, 6);
  const sub = S.g(null, W);
  S.text('yours: the three on the left', { x: 960, y: 744, size: 26, weight: 700, anchor: 'middle', color: 'helps' }, sub);
  S.text('the rest: other people', { x: 960, y: 780, size: 26, weight: 650, anchor: 'middle', color: 'muted' }, sub);
  rise(sub, tFill(5, 13) + 0.2, 8);
  fade(sub, 1, 0, tB2, 0.3);
  const preT = S.pill('shared preamble', { x: 390 - S.measure('shared preamble', { size: 22, weight: 600 }) / 2 - 20, y: pos(1, 0)[1], tone: 'helps', size: 22, h: 36 }, W);
  rise(preT, tFill(1, 3) + 0.3, 0);
  // requests queue at the right edge
  const tComp = T('b1~competes') - 0.15;
  const qL = S.text('new requests', { x: 1700, y: 352, size: 24, weight: 700, anchor: 'middle', color: 'struct' }, W);
  rise(qL, tComp, 6);
  const qStrips = [[390, 210], [436, 150], [482, 250]].map(([y, w], i) => {
    const s = S.rect({ x: 1570, y: y - 15, w, h: 30, r: 8, fill: '#1d3566', stroke: 'struct', sw: 2 }, W);
    K.track(s, [K.K(tComp + 0.15 * i, { x: 360, o: 0 }), K.K(tComp + 0.15 * i + 0.5, { x: 0, o: 1, e: 'power3.out' })]);
    return s;
  });

  // ================================================================ b2: least recently used goes first
  const tNew = T('b2~new') - 0.1;
  const tLand = tLRU + 1.4;
  OLD.forEach(([r, c], i) => {
    const h = S.g(null, P0);
    const sx = 1600 + 76 * i, sy = 570, [px, py] = pos(r, c);
    const blue = S.rect({ x: -32, y: -23, w: 64, h: 46, r: 9, fill: '#1d3566', stroke: 'struct', sw: 2 }, h);
    const blk = S.g(null, h);
    ch16Block(S, { x: 0, y: 0, w: 64, h: 46, plan: [[0, 'empty'], [tLand + 0.7, 'grey', 0.3]] }, blk);
    const d = S.g(null, h);
    d.setAttribute('data-audit', 'ignore');
    S.circle({ x: 27, y: -18, r: 8, fill: CH16.BASE, stroke: '#c8d2ea', strokeOpacity: 0.8, sw: 1.5 }, d);
    S.path({ d: 'M27,-18 v-6', stroke: '#ffffff', sw: 1.8 }, d);
    whole(t => {
      const kIn = E('power3.out')(cl((t - tNew) / 0.6)), kGo = EIO(cl((t - tLand - 0.08 * i) / 0.75));
      const x = sx + 400 * (1 - kIn) + (px - sx) * kGo, y = sy + (py - sy) * kGo;
      h.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      setO(blue, (t > tNew ? 1 : 0) * (1 - cl((t - tLand - 0.6) / 0.3)));
      setO(d, cl((t - tLand - 0.8) / 0.3));
    });
  });
  const need = S.text('needs 4 blocks', { x: 1600 + 114, y: 618, size: 24, weight: 700, anchor: 'middle', color: 'struct' }, W);
  rise(need, tNew + 0.4, 6);
  fade(need, 1, 0, tLand, 0.3);
  const lru = S.pill('least recently used goes first', { x: 960, y: 750, tone: 'neutral', size: 26, h: 44 }, W);
  rise(lru, tLRU + 0.6, 8);
  const tTimer = T('b2~Nothing') - 0.1;
  const timer = S.g(null, W);
  S.icon('ph:timer-duotone', { x: 1714, y: 720, size: 76, color: 'muted' }, timer);
  rise(timer, tTimer, 8);
  const tx = S.path({ d: 'M1674,680 L1754,760 M1754,680 L1674,760', stroke: 'muted', sw: 5 }, W);
  tx.setAttribute('data-audit', 'ignore');
  K.draw(tx, 230, tTimer + 0.5, 0.3);
  const press = S.text('pure pressure', { x: 1714, y: 800, size: 24, weight: 700, anchor: 'middle', color: 'muted' }, W);
  rise(press, T('b2~pure') - 0.1, 6);

  // ================================================================ b3: quiet and busy, a minute later; a day later
  const outB3 = [youT, preT, title, lru, timer, tx, press, qL, ...qStrips];
  fade(outB3, 1, 0, tSplit - 0.25, 0.3);
  K.track(P0, [K.K(tSplit, { x: 0, s: 1, o: 1 }), K.K(tSplit + 1.0, { x: -480, s: 0.6, e: 'power3.inOut' }), K.K(tDay, {}), K.K(tDay + 0.5, { o: 0 })], 960, 500);
  // the busy machine: built in the state the pool has reached, then churned
  const P1 = S.g(null, W);
  frame(P1, null);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 14; c++) {
    const k = kind(r, c);
    let plan;
    if (k === 'you') plan = [[0, 'held'], [tGone + 0.15 * c, 'dash', 0.2], [tGone + 0.6 + 0.15 * c, 'empty', 0.3]];
    else if (k === 'pre') plan = [[0, 'held']];
    else {
      plan = [[0, 'grey']];
      if (hsh(r * 31 + c * 7) < 0.55) { const tc = tSplit + 1.1 + 3.6 * hsh(r * 14 + c + 99); plan.push([tc, 'dash', 0.1], [tc + 0.25, 'grey', 0.15]); }
      [0, 1, 2].forEach(w => { const tw = tDay + 0.9 + 0.8 * w + 0.025 * c + 0.01 * r; plan.push([tw, 'dash', 0.08], [tw + 0.22, 'grey', 0.12]); });
      plan = sortPlan(plan);
    }
    blockAt(P1, r, c, plan, 0, isOld(r, c) ? 0 : age(r, c));
  }
  // a torrent of request strips into the busy machine (panel coordinates: they scale with it)
  for (let i = 0; i < 16; i++) {
    const r = Math.floor(hsh(i + 7) * 6), c = 4 + Math.floor(hsh(i + 13) * 10), [px, py] = pos(r, c), at = tSplit + 1.0 + 0.24 * i;
    const s = S.rect({ x: -30, y: -10, w: 60, h: 20, r: 6, fill: '#3d6bd6', stroke: 'struct', sw: 1.5 }, P1);
    s.setAttribute('data-audit', 'ignore');
    whole(t => { const k = EIO(cl((t - at) / 0.5)); s.setAttribute('transform', `translate(${(1820 + (px - 1820) * k).toFixed(1)},${(py + 160 * (1 - k) * (hsh(i) - 0.5)).toFixed(1)})`); setO(s, t > at && k < 1 ? 1 : 0); });
  }
  // a trickle into the quiet one
  Q.forEach(([r, c, tq]) => {
    const [px, py] = pos(r, c);
    const s = S.rect({ x: -30, y: -10, w: 60, h: 20, r: 6, fill: '#3d6bd6', stroke: 'struct', sw: 1.5 }, P0);
    s.setAttribute('data-audit', 'ignore');
    whole(t => { const k = EIO(cl((t - tq) / 0.55)); s.setAttribute('transform', `translate(${(1700 + (px - 1700) * k).toFixed(1)},${py})`); setO(s, t > tq && k < 1 ? 1 : 0); });
  });
  K.track(P1, [K.K(tSplit - 0.01, { x: 0, s: 1, o: 0 }), K.K(tSplit, { o: 1 }), K.K(tSplit + 1.0, { x: 480, s: 0.6, e: 'power3.inOut' }), K.K(tDay, {}), K.K(tDay + 0.8, { x: 0, y: 30, s: 0.8, e: 'power3.inOut' })], 960, 500);
  K.ignore([P0, P1], tSplit, 1.1);
  K.ignore([P0, P1], tDay, 0.9);
  const mLab = (x, name, at) => {
    const g = S.g(null, W);
    S.text(name, { x, y: 308, size: 30, weight: 750, anchor: 'middle', color: 'ink' }, g);
    S.text('1 minute later', { x, y: 346, size: 24, weight: 650, anchor: 'middle', color: 'muted' }, g);
    rise(g, at, 8);
    fade(g, 1, 0, tDay, 0.3);
    return g;
  };
  mLab(480, 'quiet machine', tSplit + 0.8);
  mLab(1440, 'busy machine', tSplit + 1.0);
  const surv = S.pill('yours survive', { x: 480, y: 680, tone: 'helps', size: 24, h: 40 }, W);
  rise(surv, T('b3~survive') - 0.1, 6);
  const gone = S.pill('yours are gone', { x: 1440, y: 680, tone: 'neutral', size: 24, h: 40 }, W);
  rise(gone, tGone + 0.9, 6);
  fade([surv, gone], 1, 0, tDay, 0.3);
  // a day later: the sun swings across, the pool refills again and again
  const sun = S.g(null, W), moon = S.g(null, W);
  S.icon('ph:sun-duotone', { x: 0, y: 0, size: 64, color: 'compute' }, sun);
  S.icon('ph:moon-stars-duotone', { x: 0, y: 0, size: 60, color: '#a9cbff' }, moon);
  [sun, moon].forEach(e => e.setAttribute('data-audit', 'ignore'));
  whole(t => {
    const k = cl((t - tDay) / 2.6), x = 360 + 1200 * EIO(k), y = 250 - 70 * Math.sin(Math.PI * k);
    const on = t > tDay && k < 1 ? 1 : 0, mx = cl((k - 0.4) / 0.2);
    sun.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
    moon.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
    setO(sun, on * (1 - mx) * cl((t - tDay) / 0.3));
    setO(moon, on * mx * (1 - cl((k - 0.85) / 0.15)));
  });
  const dayL = S.text('a day later', { x: 960, y: 150, size: 34, weight: 750, anchor: 'middle', color: 'ink' }, W);
  rise(dayL, tDay + 0.1, 8);
  const ref = S.text('', { x: 960, y: 746, size: 30, weight: 750, anchor: 'middle', color: 'muted' }, W);
  whole(t => {
    const n = [0, 1, 2].filter(w => t > tDay + 0.9 + 0.8 * w).length;
    ref.textContent = n ? `refilled ${['×1', '×1, ×2', '×1, ×2, ×3 …'][n - 1]}` : '';
    setO(ref, n ? 1 - cl((t - tB4) / 0.4) : 0);
  });
  const nowhere = S.pill('yours: nowhere', { x: 960, y: 802, tone: 'neutral', size: 24, h: 40 }, W);
  rise(nowhere, tDay + 2.8, 6);

  // ================================================================ b4: a guideline, not a guarantee (the chart, at world x + 1920)
  const tPan = tB4 + 0.05;
  K.track(W, [K.K(tPan, { x: 0 }), K.K(tPan + 1.1, { x: -1920, e: 'power3.inOut' })]);
  K.ignore(W, tPan, 1.2);
  fade([dayL, nowhere, P1], 1, 0, tB4, 0.4);
  const OX = 1920, X0 = OX + 360, X1 = OX + 1500, Y0 = 760, Y1 = 300;
  const Xs = u => X0 + (X1 - X0) * u, Ys = p => Y0 - (Y0 - Y1) * p;
  const ch = S.g(null, W);
  S.path({ d: `M${X0},${Y1 - 20} V${Y0} H${X1 + 20}`, stroke: '#ffffff', strokeOpacity: 0.5, sw: 2.5 }, ch);
  S.text('chance your blocks are still there', { x: X0, y: Y1 - 76, size: 26, weight: 700, color: 'muted' }, ch);
  S.text('time since your last message', { x: (X0 + X1) / 2, y: Y0 + 50, size: 26, weight: 700, anchor: 'middle', color: 'muted' }, ch);
  S.pill('schematic', { x: X1 - 40, y: Y1 - 76, tone: 'neutral', size: 22, h: 36 }, ch);
  rise(ch, tPan + 0.8, 0, 0.5);
  const curve = (tau) => { let d = ''; for (let i = 0; i <= 80; i++) { const u = i / 80; d += `${i ? 'L' : 'M'}${Xs(u).toFixed(1)},${Ys(Math.exp(-u / tau)).toFixed(1)}`; } return d; };
  const cq = S.path({ d: curve(0.6), stroke: 'helps', sw: 4 }, W), cb = S.path({ d: curve(0.13), stroke: 'compute', sw: 4 }, W);
  [cq, cb].forEach(p => p.setAttribute('data-audit', 'ignore'));
  K.draw(cq, 1400, tPan + 1.2, 1.0);
  K.draw(cb, 1300, tPan + 1.5, 1.0);
  // the quiet curve's label sits over its end, inside the chart, so the chart and its labels centre as one block
  const lq = S.text('quiet machine', { x: X1, y: Ys(Math.exp(-0.83 / 0.6)) - 24, size: 26, weight: 750, anchor: 'end', color: 'helps' }, W);
  rise(lq, tPan + 2.0, 6);
  const lb = S.text('busy machine', { x: Xs(0.42), y: Ys(0.2), size: 26, weight: 750, color: 'compute' }, W);
  rise(lb, tPan + 2.3, 6);
  const tFew = T('b4~few') - 0.1;
  const ql = S.path({ d: `M${Xs(0.25)},${Y1 - 10} V${Y0}`, stroke: '#ffffff', strokeOpacity: 0.8, sw: 2.5, dash: '3 7' }, W);
  ql.setAttribute('data-audit', 'ignore');
  K.draw(ql, 480, tFew, 0.4);
  const qlL = S.text('quoted lifetime: a guideline', { x: Xs(0.25) + 16, y: Y1 + 70, size: 26, weight: 700, color: 'ink' }, W);
  rise(qlL, tFew + 0.3, 6);
  const tNotT = T('b4~not#2') - 0.1;
  const step = S.path({ d: `M${X0},${Y1} H${Xs(0.25)} V${Y0} H${X1}`, stroke: '#9aa4bd', sw: 3, dash: '10 8' }, W);
  step.setAttribute('data-audit', 'ignore');
  hide(step);
  fade(step, 0, 0.9, tNotT - 0.6, 0.3);
  const stL = S.text('a timer: not how it works', { x: X0 + 14, y: Y1 - 26, size: 24, weight: 700, color: '#9aa4bd' }, W);
  rise(stL, tNotT - 0.4, 6);
  const sw = S.measure('a timer: not how it works', { size: 24, weight: 700 });
  const sx = S.path({ d: `M${X0 + 8},${Y1 - 26} H${X0 + 20 + sw}`, stroke: '#9aa4bd', sw: 3 }, W);
  sx.setAttribute('data-audit', 'ignore');
  K.draw(sx, sw + 20, tNotT + 0.2, 0.3);
  fade(step, 0.9, 0, tNotT + 1.3, 0.5);
  fade([stL, sx], 1, 0, tNotT + 1.3, 0.5);
  const tFade = T('b4~fades') - 0.1;
  [cq, cb].forEach(p => { const gl = p.cloneNode(); gl.setAttribute('stroke-width', '12'); gl.setAttribute('stroke-opacity', '0.25'); gl.removeAttribute('stroke-dasharray'); gl.removeAttribute('stroke-dashoffset'); W.insertBefore(gl, p); hide(gl); fade(gl, 0, 1, tFade, 0.5); });
  const dem = S.text('demand for space, not elapsed time', { x: OX + 960, y: Y0 + 130, size: 32, weight: 750, anchor: 'middle', color: 'ink' }, W);
  rise(dem, tFade + 0.4, 8);
});
