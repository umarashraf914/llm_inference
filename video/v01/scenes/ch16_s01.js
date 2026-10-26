/* ch16_s01 · warm and cold, as a count (fig 47)
   The weather prompt is 1,032 tokens. A minute later 1,027 are held and 5 prefilled (warm); a day later 0 are
   held and all 1,032 prefilled (cold): 1,032 / 5 = 206.4, '≈ 206×' (checked). Bars to scale, 1,400 px for
   1,032 tokens: teal 1,393 px, the amber sliver 6.8 px. The difference is whether your blocks are still in
   the GPU's memory; only the text survives, and prefill rebuilds the keys and values from it.
   b1  a thermometer becomes a count; the weather tag; the upper bar: 1,032 tokens, 1,027 held, prefill 5, warm.
   b2  the lower bar: 0 held, prefill 1,032 at an even pace, cold; the plate '≈ 206×'; the same-setup tag.
   b3  the upper tier shrinks into the top band; the GPU package draws; the teal part drops into six blocks;
       they glide into the HBM (warm: still resident); grey blocks push them out (cold: evicted).
   b4  the database with the text; the dashed outlines vanish; prefill rebuilds six blocks from the text.
   b5  everything dims; 'a vague sense of readiness' struck; 'how many arriving tokens are already held here?'
   Layout: bars x 396-1796, y 250 / 430 (h 40), row labels x 70; plate y 342; after the tilt the upper tier is
   scaled 0.8 about (960, 100). Lower tier: blocks row y 560, database (300, 720), gear (760, 720), package
   x 1196-1784, y 560-880 with two HBM stacks of 2 × 5 slots. */
V.scene('ch16_s01', S => {
  const K = libKit(S), { T, cl, E, EIO, whole, setO, hide, fade } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1, tB5 = T('b5') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const BX = 396, BW = 1400, BH = 40, Y1 = 250, Y2 = 430, U = BW / 1032;
  const fmt = n => Math.round(n).toLocaleString('en-US');

  // ================================================================ b1: warm is a count
  const thermo = S.g();
  S.icon('ph:thermometer-duotone', { x: 960, y: 540, size: 140, color: 'muted' }, thermo);
  S.pill('warm / cold', { x: 960, y: 650, tone: 'neutral', size: 26, h: 44 }, thermo);
  rise(thermo, T('b1~Warm') - 0.3, 10);
  const tCount = T('b1~counts') - 0.05;
  fade(thermo, 1, 0, tCount, 0.3);
  const cnt0 = S.text('0', { x: 960, y: 560, size: 84, weight: 800, family: 'mono', anchor: 'middle', color: 'ink' });
  cnt0.setAttribute('data-audit', 'ignore');
  whole(t => {
    cnt0.textContent = fmt(1032 * E('power2.out')(cl((t - tCount - 0.15) / 0.8)));
    const k = cl((t - tCount) / 0.3), out = EIO(cl((t - tCount - 1.25) / 0.5));
    setO(cnt0, k * (1 - out));
    cnt0.setAttribute('transform', `translate(${(420 * out).toFixed(1)},${(-200 * out).toFixed(1)})`);
  });
  // the weather conversation, top left throughout
  const wIcon = S.icon('ph:cloud-sun-duotone', { x: 96, y: 152, size: 56, color: 'muted' });
  rise(wIcon, T('b1~minute') - 0.1, 8);
  const wLab = S.text('the weather conversation', { x: 138, y: 153, size: 26, weight: 650, color: 'muted' });
  rise(wLab, T('b1~weather') - 0.1, 6);
  fade(wLab, 1, 0, T('b1~warm#2'), 0.4);

  const upper = S.g();
  const rowLab = (txt, y, at) => { const e = S.text(txt, { x: 70, y: y + 1, size: 26, weight: 750, color: 'ink' }, upper); rise(e, at, 0); return e; };
  const L1 = rowLab('a minute later', Y1, T('b1~minute') - 0.1), L2 = rowLab('a day later', Y2, T('b2~day') - 0.1);
  const W1 = S.measure('a minute later', { size: 26, weight: 750 }), W2 = S.measure('a day later', { size: 26, weight: 750 });
  const warmS = S.text('· warm', { x: 70 + W1 + 9, y: Y1 + 1, size: 26, weight: 750, color: 'helps' }, upper);
  rise(warmS, T('b1~That') - 0.05, 0);
  const coldS = S.text('· cold', { x: 70 + W2 + 9, y: Y2 + 1, size: 26, weight: 750, color: 'muted' }, upper);
  rise(coldS, T('b2~coldest') - 0.1, 0);
  // the upper bar: an outline growing to 1,400 px, then 1,027 teal and a 5-unit amber sliver
  const tOut1 = T('b1~one') - 0.1, tAll = T('b1~all') - 0.05;
  const bar1 = S.g(null, upper);
  const o1 = S.rect({ x: BX, y: Y1 - BH / 2, w: BW, h: BH, r: 8, fill: CH16.BASE, stroke: 'struct', strokeOpacity: 0.8, sw: 2 }, bar1);
  whole(t => { const k = E('power3.out')(cl((t - tOut1) / 0.9)); o1.setAttribute('width', Math.max(0.01, BW * k).toFixed(1)); setO(o1, k > 0 ? 1 : 0); });
  const teal1 = S.rect({ x: BX, y: Y1 - BH / 2, w: 0, h: BH, r: 8, fill: 'url(#card-helps)', stroke: 'helps', sw: 2.5 }, bar1);
  whole(t => { const k = EIO(cl((t - tAll) / 1.0)); teal1.setAttribute('width', Math.max(0.01, 1027 * U * k).toFixed(1)); setO(teal1, k > 0 ? 1 : 0); });
  const amb1 = S.rect({ x: BX + 1027 * U, y: Y1 - BH / 2, w: 5 * U, h: BH, fill: 'compute' }, bar1);
  amb1.setAttribute('data-audit', 'ignore');
  hide(amb1);
  fade(amb1, 0, 1, T('b1~five') + 0.1, 0.25);
  const n1 = S.text('1,032 tokens', { x: BX + BW, y: Y1 - 42, size: 24, weight: 700, anchor: 'end', color: 'struct' }, upper);
  rise(n1, T('b1~thirtytwo') - 0.1, 6);
  const held1 = S.text('1,027 held', { x: BX + 1027 * U / 2, y: Y1 + 1, size: 26, weight: 750, anchor: 'middle', color: 'ink' }, bar1);
  rise(held1, tAll + 0.9, 0);
  const ptr1 = S.g(null, bar1);
  const pl = S.path({ d: `M${BX + 1029.5 * U},${Y1 + BH / 2 + 2} V${Y1 + 34}`, stroke: 'compute', sw: 2.5 }, ptr1);
  pl.setAttribute('data-audit', 'ignore');
  S.text('prefill 5', { x: BX + BW, y: Y1 + 50, size: 24, weight: 750, anchor: 'end', color: 'compute' }, ptr1);
  rise(ptr1, T('b1~five') + 0.3, 6);

  // ================================================================ b2: a day later, nothing held
  const bar2 = S.g(null, upper);
  const o2 = S.rect({ x: BX, y: Y2 - BH / 2, w: BW, h: BH, r: 8, stroke: CH16.DASH, strokeOpacity: 0.85, sw: 2, dash: '8 7' }, bar2);
  rise(o2, T('b2~day') + 0.1, 0, 0.5);
  const tFill2 = T('b2~all') - 0.05, dFill2 = T('b2~prefilled') + 0.3 - tFill2;
  const amb2 = S.rect({ x: BX, y: Y2 - BH / 2, w: 0, h: BH, r: 8, fill: 'url(#card-compute)', stroke: 'compute', sw: 2.5 }, bar2);
  whole(t => { const k = cl((t - tFill2) / dFill2); amb2.setAttribute('width', Math.max(0.01, BW * k).toFixed(1)); setO(amb2, k > 0 ? 1 : 0); });
  K.ignore(amb2, tFill2, dFill2 + 0.05);
  const z2 = S.text('0 of 1,032 held', { x: BX + BW / 2, y: Y2 + 1, size: 26, weight: 700, anchor: 'middle', color: 'muted' }, bar2);
  rise(z2, T('b2~nothing') - 0.1, 0);
  fade(z2, 1, 0, tFill2 - 0.3, 0.3);
  const p2 = S.text('prefill 1,032', { x: BX + BW / 2, y: Y2 + 1, size: 26, weight: 750, anchor: 'middle', color: 'ink' }, bar2);
  rise(p2, tFill2 + dFill2 - 0.1, 0);
  const plate = S.g(null, upper);
  S.rect({ x: 780, y: 314, w: 600, h: 56, r: 14, fill: CH16.BASE, stroke: '#ffffff', strokeOpacity: 0.35, sw: 2 }, plate);
  S.text('1,032 ÷ 5 ≈ 206× the prefill work', { x: 1080, y: 343, size: 30, weight: 800, anchor: 'middle', color: 'ink' }, plate);
  rise(plate, T('b2~two') - 0.1, 8);
  const sameW = S.measure('same question, model, hardware', { size: 24, weight: 600 }) + 44;
  const sameG = S.g();
  S.pill('same question, model, hardware', { x: BX + BW - sameW / 2, y: 516, tone: 'neutral', size: 24, h: 40 }, sameG);
  rise(sameG, T('b2~times') - 0.1, 6);

  // ================================================================ b3: the only difference is the cache
  const tOnly = T('b3~only') - 0.1, tTilt = tOnly + 0.6;
  const flash = S.rect({ x: BX + BW - sameW - 10, y: 516 - 28, w: sameW + 20, h: 56, r: 22, fill: 'url(#pglow-struct)', opacity: 0 });
  flash.setAttribute('data-audit', 'ignore');
  K.pulse(flash, tOnly, 1, 0.5);
  fade(sameG, 1, 0, tOnly + 0.5, 0.3);
  // the upper tier shrinks into the top band and dims; the bars' own labels fade, the row labels stay
  fade([held1, ptr1, n1, p2, plate], 1, 0, tOnly, 0.35);
  K.track(upper, [K.K(tTilt, { s: 1, o: 1 }), K.K(tTilt + 0.9, { s: 0.8, o: 0.5, e: 'power3.inOut' })], 960, 100);
  K.ignore(upper, tTilt, 1.0);
  // the GPU package: a compute die between two HBM stacks of 2 × 5 block slots
  const pkg = S.g();
  S.rect({ x: 1196, y: 560, w: 588, h: 320, r: 24, fill: '#0f1830', stroke: '#ffffff', strokeOpacity: 0.14, sw: 2 }, pkg);
  S.rect({ x: 1405, y: 635, w: 170, h: 170, r: 12, fill: '#1a1408', stroke: 'compute', strokeOpacity: 0.85, sw: 2.5 }, pkg);
  S.rect({ x: 1415, y: 645, w: 150, h: 150, r: 8, fill: 'url(#die-grid)' }, pkg);
  S.text('compute', { x: 1490, y: 705, size: 22, weight: 700, anchor: 'middle', color: 'compute' }, pkg);
  S.text('die', { x: 1490, y: 735, size: 22, weight: 700, anchor: 'middle', color: 'compute' }, pkg);
  const STX = [1216, 1604], slot = (s, c, r) => [STX[s] + 45 + 70 * c, 616 + 52 * r];
  STX.forEach(x => {
    S.rect({ x, y: 580, w: 160, h: 280, r: 12, fill: '#2a1218', stroke: 'bytes', strokeOpacity: 0.9, sw: 2.5 }, pkg);
    S.text('HBM', { x: x + 80, y: 908, size: 24, weight: 700, anchor: 'middle', color: 'bytes' }, pkg);
  });
  const slotsG = S.g(null, pkg);
  slotsG.setAttribute('data-audit', 'ignore');
  for (let s = 0; s < 2; s++) for (let c = 0; c < 2; c++) for (let r = 0; r < 5; r++) { const [x, y] = slot(s, c, r); S.rect({ x: x - 30, y: y - 22, w: 60, h: 44, r: 8, stroke: 'bytes', strokeOpacity: 0.3, sw: 1.5, dash: '4 4' }, slotsG); }
  S.text('GPU', { x: 1490, y: 536, size: 26, weight: 750, anchor: 'middle', color: 'muted' }, pkg);
  const tPkg = tTilt + 0.5;
  rise(pkg, tPkg, 14, 0.6);
  // other people's blocks, there from the start
  const OTH = [[0, 0, 3], [0, 1, 3], [0, 0, 4], [1, 1, 0], [1, 0, 2], [1, 1, 3], [1, 0, 4], [1, 1, 4]];
  const others = S.g(null, pkg);
  OTH.forEach(([s, c, r]) => { const [x, y] = slot(s, c, r); ch16Block(S, { x, y, w: 60, h: 44, plan: [[0, 'grey']] }, others); });
  // the teal part of the upper bar drops and breaks into six blocks
  const tBlk = T('b3~fixedsize') - 0.1, tRes = T('b3~resident') - 0.1, tEv = T('b3~evicted') - 0.1;
  const ROWX = i => 400 + 80 * i, ROWY = 560;
  const drop = S.rect({ x: 0, y: 0, w: 0, h: 0, r: 8, fill: 'url(#card-helps)', stroke: 'helps', sw: 2.5 });
  drop.setAttribute('data-audit', 'ignore');
  const sx = v => 960 + (v - 960) * 0.8, sy = v => 100 + (v - 100) * 0.8;
  whole(t => {
    const k = E('power3.inOut')(cl((t - tBlk) / 0.7)), out = cl((t - tBlk - 0.6) / 0.3);
    const a = [sx(BX), sy(Y1 - BH / 2), 1027 * U * 0.8, BH * 0.8], b = [ROWX(0) - 30, ROWY - 22, ROWX(5) - ROWX(0) + 60, 44];
    const v = a.map((av, i) => av + (b[i] - av) * k);
    drop.setAttribute('x', v[0].toFixed(1)); drop.setAttribute('y', v[1].toFixed(1)); drop.setAttribute('width', v[2].toFixed(1)); drop.setAttribute('height', v[3].toFixed(1));
    setO(drop, t > tBlk ? 1 - out : 0);
  });
  const MINE = [[0, 0, 0], [0, 1, 0], [0, 0, 1], [0, 1, 1], [0, 0, 2], [1, 0, 1]];
  const OUT = i => [980 + 80 * (i % 2), 600 + 64 * Math.floor(i / 2)];
  const mine = MINE.map(([s, c, r], i) => {
    const h = S.g();
    const tA = tBlk + 0.55 + 0.06 * i;
    const blk = ch16Block(S, { x: 0, y: 0, w: 60, h: 44, plan: [[0, 'empty'], [tA, 'held', 0.25], [tEv + 0.35 + 0.12 * i, 'dash', 0.3], [T('b4~stopped') + 0.1 * i, 'empty', 0.3]] }, h);
    const [px, py] = slot(s, c, r), [ox, oy] = OUT(i), tIn = tRes + 0.1 * i, tPush = tEv + 0.12 * i;
    whole(t => {
      const kIn = E('power3.inOut')(cl((t - tIn) / 0.8)), kOut = E('power2.out')(cl((t - tPush - 0.2) / 0.6));
      let x = ROWX(i) + (px - ROWX(i)) * kIn, y = ROWY + (py - ROWY) * kIn;
      x += (ox - px) * kOut; y += (oy - py) * kOut;
      h.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
    });
    return { h, blk };
  });
  const blkL = S.text('blocks: a few tokens each', { x: (ROWX(0) + ROWX(5)) / 2, y: 622, size: 26, weight: 700, anchor: 'middle', color: 'bytes' });
  rise(blkL, T('b3~few') - 0.1, 6);
  const blkN = S.text('schematic: a real chat fills many', { x: (ROWX(0) + ROWX(5)) / 2, y: 658, size: 22, weight: 600, anchor: 'middle', color: 'muted' });
  rise(blkN, T('b3~few') + 0.3, 6);
  fade([blkL, blkN], 1, 0, tRes - 0.1, 0.3);
  const warmT = S.pill('warm: still resident', { x: 1490, y: 966, tone: 'helps', size: 26, h: 44 });
  rise(warmT, tRes + 0.8, 8);
  fade(warmT, 1, 0, tEv - 0.3, 0.3);
  // other people's requests arrive from the right and take the slots
  const newcomers = S.g(null, pkg);
  MINE.forEach(([s, c, r], i) => {
    const [px, py] = slot(s, c, r), h = S.g(null, newcomers);
    ch16Block(S, { x: 0, y: 0, w: 60, h: 44, plan: [[0, 'grey']] }, h);
    const tPush = tEv + 0.12 * i;
    whole(t => {
      const k = E('power2.out')(cl((t - tPush + 0.25) / 0.6));
      h.setAttribute('transform', `translate(${(px + (1960 - px) * (1 - k)).toFixed(1)},${py})`);
      setO(h, t > tPush - 0.25 ? 1 : 0);
    });
  });
  const coldT = S.pill('cold: evicted', { x: 1490, y: 966, tone: 'neutral', size: 26, h: 44 });
  rise(coldT, tEv + 0.6, 8);

  // ================================================================ b4: only the text survives
  const db = S.g();
  // the row database → prefill → package runs through the package's centre (y 720), so the arrow meets it square on
  S.icon('ph:database-duotone', { x: 300, y: 720, size: 130, color: 'struct' }, db);
  S.icon('ph:file-text-duotone', { x: 300, y: 740, size: 40, color: '#a9cbff' }, db);
  rise(db, T('b4~small') - 0.15, 10);
  const dbT = S.pill('text: small, kept', { x: 300, y: 830, tone: 'struct', size: 24, h: 42 });
  rise(dbT, T('b4~database') - 0.1, 6);
  fade(coldT, 1, 0, T('b4~stopped') - 0.2, 0.3);
  const tReb = T('b4~prefill') - 0.1;
  const gear = S.g();
  S.icon('ph:gear-six-duotone', { x: 0, y: 0, size: 96, color: 'compute' }, gear);
  whole(t => gear.setAttribute('transform', `translate(760,720) rotate(${(240 * EIO(cl((t - tReb - 0.3) / 2.6))).toFixed(1)})`));
  const gearG = S.g();
  gearG.appendChild(gear);
  rise(gearG, tReb, 8);
  const gearL = S.text('prefill', { x: 760, y: 796, size: 26, weight: 800, anchor: 'middle', color: 'compute' });
  rise(gearL, tReb + 0.15, 6);
  const gearT = S.text('text in, keys and values out', { x: 760, y: 838, size: 24, weight: 650, anchor: 'middle', color: 'muted' });
  rise(gearT, tReb + 0.6, 6);
  const a1 = S.path({ d: 'M372,720 H700 M688,710 L701,720 L688,730', stroke: 'struct', sw: 3 });
  const a2 = S.path({ d: 'M820,720 H1184 M1172,710 L1185,720 L1172,730', stroke: 'bytes', sw: 3 });
  [a1, a2].forEach(p => p.setAttribute('data-audit', 'ignore'));
  K.draw(a1, 360, tReb + 0.1, 0.4);
  K.draw(a2, 400, tReb + 0.55, 0.4);
  const FREE = [[0, 1, 2], [0, 1, 4], [1, 0, 0], [1, 1, 1], [1, 1, 2], [1, 0, 3]];
  FREE.forEach(([s, c, r], i) => {
    const [x, y] = slot(s, c, r), tA = tReb + 1.0 + 0.32 * i;
    ch16Block(S, { x, y, w: 60, h: 44, plan: [[0, 'empty'], [tA, 'dash', 0.15], [tA + 0.15, 'coral', 0.2], [tA + 0.45, 'held', 0.25]] }, pkg);
  });

  // ================================================================ b5: a precise question
  const dimmed = [upper, pkg, db, dbT, gearG, gearL, gearT, a1, a2, ...mine.map(m => m.h), wIcon];
  fade(dimmed.filter(e => e !== upper), 1, 0.22, tB5, 0.5);
  fade(upper, 1, 0.4, tB5, 0.5);
  const back = S.rect({ x: 500, y: 430, w: 920, h: 380, r: 24, fill: CH16.BASE, fillOpacity: 0.92, stroke: '#ffffff', strokeOpacity: 0.12, sw: 1.5 });
  rise(back, tB5 + 0.1, 0, 0.4);
  const vs = 'a vague sense of readiness', vw = S.measure(vs, { size: 32, weight: 650 });
  const vague = S.text('', { x: 960 - vw / 2, y: 492, size: 32, weight: 650, color: 'muted' });
  const tVg = tB5 + 0.25;
  whole(t => { vague.textContent = vs.slice(0, Math.round(vs.length * cl((t - tVg) / 0.8))); });
  const vx = S.path({ d: `M${960 - vw / 2 - 8},494 H${960 + vw / 2 + 8}`, stroke: 'muted', sw: 3.5 });
  vx.setAttribute('data-audit', 'ignore');
  K.draw(vx, vw + 16, T('b5~precise') - 0.05, 0.35);
  const qs = 'how many arriving tokens are already held here?', qw = S.measure(qs, { size: 30, weight: 800 });
  const qBox = S.rect({ x: 960 - qw / 2 - 30, y: 558, w: qw + 60, h: 72, r: 18, fill: 'url(#card-helps)', stroke: 'helps', sw: 2.5 });
  rise(qBox, T('b5~How') - 0.15, 0, 0.35);
  const q = S.text('', { x: 960 - qw / 2, y: 595, size: 30, weight: 800, color: 'ink' });
  const tQ = T('b5~How') - 0.05;
  whole(t => { q.textContent = qs.slice(0, Math.round(qs.length * cl((t - tQ) / 1.6))); });
  const ctr = S.text('1,027', { x: 960, y: 724, size: 64, weight: 800, family: 'mono', anchor: 'middle', color: 'helps' });
  const tC = tQ + 1.4;
  whole(t => {
    const ph = Math.floor(Math.max(0, t - tC) / 0.7) % 2;
    ctr.textContent = ph ? '0' : '1,027';
    ctr.setAttribute('fill', S.tone(ph ? 'compute' : 'helps'));
    setO(ctr, cl((t - tC) / 0.25));
  });
});
