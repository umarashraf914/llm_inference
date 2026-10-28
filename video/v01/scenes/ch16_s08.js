/* ch16_s08 · a day later, and the preamble that survives (fig 54)
   Case A's follow-up sent a day later: the history (question 1 and answer 1) was evicted overnight and prefill
   rebuilds it from the kept text. The preamble is the most shared text in the system, computed once per machine
   and reused by every request, so it is almost never least recently used: hit 770, prefill 18 = 7 + 7 + 4
   (checked: 788 - 770), against 4 a minute later. That only helps on the same machine, so the router sends each
   request where its prefix already sits. Shared survives; yours does not.
   b1  a day-night clock spins; the table returns to the corner scoreboard; the arriving row (system, tools,
       question 1, answer 1, new, '788'); the cache row's history dashed, 'evicted overnight'; prefill rebuilds it
       through a gear; the database: 'the text was kept'.
   b2  the cache preamble turns teal; the camera rises: nine users, arrows down to one block, 'the most shared text
       in the system'; a gear spins once, 'computed once per machine'; the arrows pulse, 'reused by every request'.
   b3  back to the rows; a pool inset whose preamble dials keep resetting while grey blocks age and drop, 'kept
       warm by everyone else'; the hit; plate 'hit 770 · prefill 18 tokens', '7 + 7 + 4'; the scoreboard row
       'a day later | 770 | 18' slides in under 'A', the 4 and the 18 glow.
   b4  the camera pulls out: a request, a router, three servers (the middle one holds this prefix); 'route by
       prefix'.
   b5  back to the rows: a crowd over the preamble, one grey user over the history; a ghost of s01's cold bar
       gains a teal front, 'the preamble usually survives'; 'shared survives, yours does not'.
   Layout: rows as s03 (arriving y 440, in the cache y 566, h 58, from x 250); the world W moves down 300 for the
   top band (built at world y < 120); the pool inset x 1430-1866, y 790-1010. */
V.scene('ch16_s08', S => {
  const K = libKit(S), { T, cl, E, EIO, whole, setO, hide, fade } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1, tB5 = T('b5') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const hsh = i => { const v = Math.sin(i * 12.9898 + 1.7) * 43758.5453; return v - Math.floor(v); };
  const AY = 440, CY = 566, H = 58;
  const L = ch16Lay(S, [{ label: 'system', w: 220 }, { label: 'tools', w: 180 }, { label: 'question 1', w: 220 }, { label: 'answer 1', w: 300 }, { label: 'new', w: 170 }], { x0: 250, gap: 6 });
  const W = S.g();
  const tReb = T('b1~prefill') - 0.1, tHit = T('b3~hit#2') - 0.1;

  // ================================================================ b1: a day later, the history evicted overnight
  const clock = S.g(null, W);
  S.circle({ x: 960, y: 150, r: 34, fill: CH16.BASE, stroke: '#c8d2ea', strokeOpacity: 0.8, sw: 3 }, clock);
  const hand = S.path({ d: 'M960,150 V124', stroke: '#ffffff', sw: 3.5 }, clock);
  S.icon('ph:sun-duotone', { x: 906, y: 150, size: 34, color: 'compute' }, clock);
  S.icon('ph:moon-stars-duotone', { x: 1014, y: 150, size: 32, color: '#a9cbff' }, clock);
  S.text('a day later', { x: 960, y: 214, size: 28, weight: 750, anchor: 'middle', color: 'ink' }, clock);
  rise(clock, 0.6, 8);
  whole(t => hand.setAttribute('transform', `rotate(${(720 * EIO(cl((t - 0.8) / 2.2))).toFixed(1)},960,150)`));
  // the table from s06 returns to the corner as the scoreboard, and gains 'a day later' under 'A'
  const tIns = T('b3~four') - 0.1;
  const score = ch16Score(S, {
    rows: [{ case: 'time t', hit: 0, pre: 777 }, { case: 'A', hit: 784, pre: 4 }, { case: 'a day later', hit: 770, pre: 18, at: tIns }, { case: 'B', hit: 775, pre: 2 }, { case: 'C', hit: 770, pre: 7 }],
    glow: [{ row: 1, col: 'pre', at: tIns + 0.5 }, { row: 2, col: 'pre', at: tIns + 0.5 }],
  });
  [3, 4].forEach(i => K.track(score.rowEls[i], [K.K(tIns, { y: -36 }), K.K(tIns + 0.4, { y: 0, e: 'power2.out' })]));
  K.track(score, [K.K(0.6, { x: -560, y: 260, s: 1.6, o: 0 }), K.K(0.8, { o: 1 }), K.K(1.7, { x: 0, y: 0, s: 1, o: 1, e: 'power3.inOut' })], 1870, 40);
  K.ignore(score, 0.6, 1.2);
  const lab = (txt, y, tone) => { const e = S.text(txt, { x: 226, y: y + 1, size: 26, weight: 750, anchor: 'end', color: tone }, W); rise(e, 0.9, 0); return e; };
  lab('arriving', AY, 'muted');
  lab('in the cache', CY, 'bytes');
  const rowA = S.g(null, W), rowC = S.g(null, W);
  const arrPlan = [[[0, 'blue'], [tHit, 'teal']], [[0, 'blue'], [tHit + 0.1, 'teal']], [[0, 'blue'], [tReb, 'amber']], [[0, 'blue'], [tReb + 0.15, 'amber']], [[0, 'blue'], [tHit + 0.3, 'amber']]];
  const arr = L.map((c, i) => {
    const cell = ch16Cell(S, { x: c.x, y: AY, w: c.w, h: H, label: c.label, size: 26, plan: arrPlan[i] }, rowA);
    K.track(cell, [K.K(1.0 + 0.12 * i, { x: -24, o: 0 }), K.K(1.45 + 0.12 * i, { x: 0, o: 1, e: 'power3.out' })]);
    return cell;
  });
  const sum = S.text('770 + 7 + 7 + 4 = 788', { x: L.end + 22, y: AY + 1, size: 26, weight: 750, color: 'ink' }, W);
  rise(sum, 1.8, 0);
  const tCopy = tReb + 0.3;
  const cachePlan = [[[0, 'blue'], [tB2 + 0.1, 'teal']], [[0, 'blue'], [tB2 + 0.2, 'teal']], [[0, 'dash'], [tCopy + 0.8, 'amber']], [[0, 'dash'], [tCopy + 0.95, 'amber']]];
  const cache = L.slice(0, 4).map((c, i) => {
    const cell = ch16Cell(S, { x: c.x, y: CY, w: c.w, h: H, label: c.label, size: 26, labelTone: i >= 2 ? 'muted' : 'ink', plan: cachePlan[i] }, rowC);
    rise(cell, 1.1 + 0.1 * i, 0, 0.35);
    return cell;
  });
  const ev = S.pill('evicted overnight', { x: (L[2].x + L[3].r) / 2, y: 630, tone: 'neutral', size: 24, h: 40 }, W);
  rise(ev, T('b1~evicted') - 0.1, 6);
  fade(ev, 1, 0, tCopy + 1.0, 0.3);
  // prefill rebuilds it: copies of the arriving history go down through a gear into the dashed outlines
  const GX = L[3].x - 3, GY = (AY + CY) / 2;
  const gear = S.g(null, W), gearI = S.g(null, gear);
  S.icon('ph:gear-six-duotone', { x: 0, y: 0, size: 50, color: 'compute' }, gearI);
  gear.setAttribute('transform', `translate(${GX},${GY})`);
  gear.setAttribute('data-audit', 'ignore');
  whole(t => gearI.setAttribute('transform', `rotate(${(300 * EIO(cl((t - tCopy) / 1.4))).toFixed(1)})`));
  hide(gear);
  fade(gear, 0, 1, tReb + 0.1, 0.25);
  fade(gear, 1, 0, tCopy + 1.6, 0.3);
  [2, 3].forEach((i, k) => {
    const c = L[i], cp = S.rect({ x: -c.w * 0.35, y: -14, w: c.w * 0.7, h: 28, r: 8, fill: 'url(#card-compute)', stroke: 'compute', sw: 2 }, W);
    cp.setAttribute('data-audit', 'ignore');
    whole(t => {
      const u = cl((t - tCopy - 0.12 * k) / 0.8), a = E('power2.inOut')(Math.min(1, u * 2)), b = E('power2.inOut')(Math.max(0, u * 2 - 1));
      const x = c.cx + (GX - c.cx) * a + (c.cx - GX) * b, y = AY + (GY - AY) * a + (CY - GY) * b;
      cp.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      setO(cp, u > 0 && u < 1 ? 1 : 0);
    });
  });
  const db = S.g(null, W);
  S.icon('ph:database-duotone', { x: 200, y: 700, size: 84, color: 'struct' }, db);
  S.icon('ph:file-text-duotone', { x: 200, y: 712, size: 28, color: '#a9cbff' }, db);
  rise(db, T('b1~text') - 0.5, 8);
  const dbT = S.text('the text was kept', { x: 200, y: 772, size: 22, weight: 700, anchor: 'middle', color: 'struct' }, W);
  rise(dbT, T('b1~text') - 0.2, 6);

  // ================================================================ b2: the most shared text in the system (top band, world y < 120)
  const tRise = tB2 + 0.4, tBack = tB3 + 0.1, tOut = tB4 + 0.1, tRet = tB5 + 0.05;
  K.ignore(W, tRise, 0.95);
  K.ignore(W, tBack, 0.95);
  fade([clock, db, dbT], 1, 0, tRise, 0.3);
  const top = S.g(null, W);
  const head = S.text('the most shared text in the system', { x: 960, y: -196, size: 32, weight: 750, anchor: 'middle', color: 'ink' }, top);
  rise(head, tRise + 0.6, 8);
  const blkG = S.g(null, top);
  S.rect({ x: 760, y: 12, w: 400, h: 56, r: 14, fill: CH16.BASE }, blkG);
  const blk = S.rect({ x: 760, y: 12, w: 400, h: 56, r: 14, fill: '#1d3566', stroke: 'struct', sw: 2.5 }, blkG);
  S.text('system prompt', { x: 960, y: 41, size: 26, weight: 650, anchor: 'middle', color: 'ink' }, blkG);
  rise(blkG, tRise + 0.7, 8);
  const sameL = S.text('the same system prompt, token for token', { x: 960, y: 98, size: 24, weight: 650, anchor: 'middle', color: 'muted' }, top);
  rise(sameL, tRise + 1.0, 6);
  const tUsers = T('b2~most') - 0.1, tOnce = T('b2~once') - 0.1, tReuse = T('b2~reused') - 0.1;
  const arrows = [];
  for (let i = 0; i < 9; i++) {
    const ux = 560 + 100 * i, at = tUsers + 0.14 * i;
    const u = S.icon('ph:user-duotone', { x: ux, y: -122, size: 44, color: 'struct' }, top);
    rise(u, at, 6, 0.3);
    const p = S.path({ d: `M${ux},-94 C${ux},-40 ${780 + 40 * i},-30 ${780 + 40 * i},6`, stroke: 'struct', sw: 2.5 }, top);
    p.setAttribute('data-audit', 'ignore');
    K.draw(p, 200, at + 0.15, 0.35);
    whole(t => { const k = Math.sin(Math.PI * cl((t - tReuse - 0.14 * i) / 0.45)); p.setAttribute('stroke', k > 0.05 ? S.tone('helps') : S.tone('struct')); p.setAttribute('stroke-width', (2.5 + 2.5 * k).toFixed(2)); });
    arrows.push(p);
  }
  whole(t => blk.setAttribute('stroke', S.tone(t > tReuse + 1.4 ? 'helps' : 'struct')));
  const g2h = S.g(null, top), g2 = S.g(null, g2h), g2i = S.g(null, g2);  // g2h takes the rise, g2 the position
  S.icon('ph:gear-six-duotone', { x: 0, y: 0, size: 54, color: 'compute' }, g2i);
  g2.setAttribute('transform', 'translate(1210,40)');
  g2.setAttribute('data-audit', 'ignore');
  whole(t => g2i.setAttribute('transform', `rotate(${(360 * EIO(cl((t - tOnce - 0.1) / 1.0))).toFixed(1)})`));
  rise(g2h, tOnce - 0.2, 0, 0.3);
  const onceT = S.text('computed once per machine', { x: 1250, y: 41, size: 24, weight: 700, color: 'compute' }, top);
  rise(onceT, tOnce + 0.2, 6);
  const reuseT = S.text('reused by every request', { x: 720, y: 41, size: 24, weight: 700, anchor: 'end', color: 'helps' }, top);
  rise(reuseT, tReuse + 0.4, 6);
  [0, 1].forEach(i => { const c = cache[i], r = S.rect({ x: c.l - 8, y: c.t - 8, w: c.w + 16, h: c.h + 16, r: 20, fill: 'url(#pglow-helps)', opacity: 0 }, W); r.setAttribute('data-audit', 'ignore'); W.insertBefore(r, rowC); K.pulse(r, tReuse + 1.3, 1, 0.8); });

  // ================================================================ b3: kept warm by everyone else
  fade(top, 1, 0, tBack, 0.4);
  const inset = S.g(null, W);
  S.rect({ x: 1430, y: 790, w: 436, h: 220, r: 14, fill: '#1a0f14', fillOpacity: 0.6, stroke: 'bytes', sw: 2 }, inset);
  const IP = (r, c) => [1462 + 52 * c, 816 + 34 * r];
  const tIn = tBack + 0.6;
  const pulses = [0, 1, 2, 3, 4, 5, 6, 7].map(k => tIn + 0.4 + 1.2 * k);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) {
    const pre = r === 1 && c < 4, [x, y] = IP(r, c);
    const ev1 = tIn + 1.6 + 2.2 * Math.floor(hsh(r * 8 + c) * 4) + 0.12 * c;
    const plan = pre ? [[0, 'held']] : (hsh(r * 13 + c * 5) < 0.45 ? [[0, 'grey'], [ev1, 'dash', 0.15], [ev1 + 0.35, 'empty', 0.2], [ev1 + 0.9, 'grey', 0.25]] : [[0, 'grey']]);
    ch16Block(S, { x, y, w: 40, h: 26, plan }, inset);
    const d = S.g(null, inset), hd = S.path({ d: `M${x + 17},${y - 11} v-4`, stroke: '#ffffff', sw: 1.4 }, d);
    S.circle({ x: x + 17, y: y - 11, r: 5, fill: 'none', stroke: '#c8d2ea', strokeOpacity: 0.8, sw: 1.2 }, d);
    d.setAttribute('data-audit', 'ignore');
    const a0 = 360 * hsh(r * 8 + c + 50);
    whole(t => {
      // preamble dials snap back to 'just now' with each pulse; the others keep ageing
      let ang;
      if (pre) { const last = pulses.filter(p => t > p).pop(); ang = last == null ? 30 : Math.min(300, 60 * (t - last)); }
      else ang = a0 + 40 * Math.max(0, t - tIn);
      hd.setAttribute('transform', `rotate(${ang.toFixed(1)},${x + 17},${y - 11})`);
      const op = ch16PlanOp(plan, t, cl);
      setO(d, Math.min(1, (op.grey || 0) + (op.held || 0)));
    });
  }
  // pulses into the preamble blocks, and a grey eviction sweep that skips them
  const pulseR = S.rect({ x: IP(1, 0)[0] - 26, y: IP(1, 0)[1] - 18, w: 52 * 3 + 52, h: 36, r: 10, fill: 'url(#pglow-helps)', opacity: 0 }, inset);
  pulseR.setAttribute('data-audit', 'ignore');
  pulses.forEach(p => K.pulse(pulseR, p, 1, 0.5));
  const sweep = S.rect({ x: 0, y: 794, w: 18, h: 212, r: 6, fill: '#8b95ad', opacity: 0.35 }, inset);
  sweep.setAttribute('data-audit', 'ignore');
  whole(t => { const k = ((t - tIn - 1.0) / 2.2) % 1; sweep.setAttribute('x', (1436 + 412 * Math.max(0, k)).toFixed(1)); setO(sweep, t > tIn + 1.0 ? 1 : 0); });
  rise(inset, tIn, 10, 0.5);
  const warmT = S.text('kept warm by everyone else', { x: 1648, y: 766, size: 24, weight: 700, anchor: 'middle', color: 'helps' }, W);
  rise(warmT, T('b3~thousands') + 0.3, 6);
  const plate = ch16Plate(S, { x: (250 + L.end) / 2, y: 724, hit: '770', pre: '18 tokens' }, W);
  rise(plate, tHit + 0.5, 10);
  // 7 + 7 + 4 sits under the 18 it adds up to (the plate's text ends 32 px inside its right edge)
  const pm = s => S.measure(s, { size: 30, weight: 800 });
  const x18 = plate.r - 32 - pm('prefill 18 tokens') + pm('prefill 18') - pm('18') / 2;
  const brk = S.text('7 + 7 + 4', { x: x18, y: 782, size: 24, weight: 700, anchor: 'middle', color: 'compute' }, W);
  rise(brk, T('b3~eighteen') - 0.1, 6);

  // ================================================================ b4: route by prefix
  // the one camera: up for the top band (b2), back (b3), out to the router (b4), back (b5)
  K.track(W, [
    K.K(tRise, { y: 0, s: 1, o: 1 }), K.K(tRise + 0.9, { y: 300, e: 'power3.inOut' }), K.K(tBack, {}), K.K(tBack + 0.9, { y: 0, e: 'power3.inOut' }),
    K.K(tOut, {}), K.K(tOut + 0.8, { s: 0.6, o: 0.12, e: 'power3.inOut' }), K.K(tRet, {}), K.K(tRet + 0.8, { s: 1, o: 1, e: 'power3.inOut' }),
  ], 960, 560);
  K.ignore(W, tOut, 0.85);
  K.ignore(W, tRet, 0.85);
  const R = S.g();
  const parcel = S.g(null, R);
  S.icon('ph:package-duotone', { x: 0, y: 0, size: 76, color: 'struct' }, parcel);
  S.icon('lucide:router', { x: 960, y: 560, size: 96, color: 'ink' }, R);
  const SV = [[1580, 360], [1580, 560], [1580, 760]];
  const ghostP = [], live = [];
  SV.forEach(([x, y], i) => {
    if (i === 1) { const gl = S.rect({ x: x - 80, y: y - 70, w: 160, h: 140, r: 30, fill: 'url(#pglow-helps)' }, R); gl.setAttribute('data-audit', 'ignore'); }
    S.icon('ph:hard-drives-duotone', { x, y, size: 96, color: i === 1 ? 'helps' : 'muted' }, R);
    const p = S.path({ d: `M1020,560 C1240,560 1300,${y} ${x - 64},${y}`, stroke: i === 1 ? 'helps' : '#8b95ad', sw: 3, dash: i === 1 ? undefined : '8 8' }, R);
    p.setAttribute('data-audit', 'ignore');
    (i === 1 ? live : ghostP).push(p);
  });
  const p0 = S.path({ d: 'M380,560 H900', stroke: 'struct', sw: 3 }, R);
  p0.setAttribute('data-audit', 'ignore');
  const holds = S.pill('holds this prefix', { x: 1580, y: 650, tone: 'helps', size: 24, h: 40 }, R);
  const routeT = S.pill('route by prefix', { x: 960, y: 660, tone: 'neutral', size: 24, h: 40 }, R);
  const reqL = S.text('a request', { x: 320, y: 630, size: 24, weight: 700, anchor: 'middle', color: 'struct' }, R);
  hide(R);
  fade(R, 0, 1, tOut + 0.4, 0.4);
  fade(R, 1, 0, tRet - 0.1, 0.4);
  hide(routeT);
  fade(routeT, 0, 1, T('b4~router') - 0.1, 0.3);
  const tSend = T('b4~sends') - 0.1;
  fade(ghostP, 1, 0.15, tSend + 0.6, 0.5);
  whole(t => {
    const k = cl((t - tSend) / 1.6);
    let x, y;
    if (k < 0.4) { x = 320 + (960 - 320) * E('power2.inOut')(k / 0.4); y = 560; }
    else { const u = E('power2.inOut')((k - 0.4) / 0.6), b = (1 - u); x = b * b * b * 960 + 3 * b * b * u * 1240 + 3 * b * u * u * 1300 + u * u * u * 1500; y = b * b * b * 560 + 3 * b * b * u * 560 + 3 * b * u * u * 560 + u * u * u * 560; }
    parcel.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
    setO(parcel, 1 - cl((k - 0.92) / 0.08));
  });
  K.ignore(parcel, tSend, 1.7);
  void holds; void reqL; void live;

  // ================================================================ b5: shared survives, yours does not
  const crowd = S.g(null, W);
  for (let i = 0; i < 6; i++) S.icon('ph:user-duotone', { x: 290 + 64 * i, y: 376, size: 34, color: 'helps' }, crowd);
  rise(crowd, tRet + 0.8, 6);
  whole(t => crowd.setAttribute('opacity', (t > tRet + 1.2 ? 0.75 + 0.25 * Math.sin((t - tRet) * 5) : 1).toFixed(3)));
  const lone = S.icon('ph:user-duotone', { x: (L[2].x + L[3].r) / 2, y: 376, size: 34, color: '#6b7590' }, W);
  rise(lone, tRet + 1.0, 6);
  const tYours = T('b5~Yours') - 0.1;
  const ghost = S.g(null, W);
  const GB = [250, 870, L.end - 250];
  S.rect({ x: GB[0], y: GB[1] - 18, w: GB[2], h: 36, r: 8, fill: 'url(#card-compute)', stroke: 'compute', sw: 2 }, ghost);
  const gT = S.rect({ x: GB[0], y: GB[1] - 18, w: 0, h: 36, r: 8, fill: 'url(#card-helps)', stroke: 'helps', sw: 2.5 }, ghost);
  S.text('cold, a day later', { x: GB[0], y: GB[1] - 36, size: 22, weight: 650, color: 'muted' }, ghost);
  const tGh = T('b5~usually') - 0.1;
  whole(t => gT.setAttribute('width', Math.max(0.01, 0.38 * GB[2] * EIO(cl((t - tGh - 0.5) / 0.7))).toFixed(1)));
  rise(ghost, tGh, 8);
  const survT = S.text('the preamble usually survives', { x: GB[0] + 0.38 * GB[2] / 2, y: GB[1] + 1, size: 24, weight: 750, anchor: 'middle', color: 'ink' }, W);
  rise(survT, tGh + 1.0, 0);
  const last = S.text('shared survives, yours does not', { x: (250 + L.end) / 2, y: 950, size: 30, weight: 750, anchor: 'middle', color: 'ink' }, W);
  rise(last, tYours + 0.3, 8);
  void arr; void arrows; void tB3;
});
