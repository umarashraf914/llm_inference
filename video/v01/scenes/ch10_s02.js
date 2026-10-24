/* ch10_s02 · why one phase can be parallel and the other cannot (fig 110)
   b1  header 'Why one runs in parallel and one cannot'; two dimmed rows ('Prefill: the prompt already exists'
       t1…t8; 'Decode: each waits for the last' t9 then dashed t10, t11, t12) and a grey grid of 2,025 dots
       'thousands of workers' ('schematic'); 'same model, same chip: the difference is timing'; the eight
       brighten at once: 'all eight together'.
   b2  'earlier: each token needs the one before'; an hourglass on t10; t9 flashes and t10 fills, the hourglass
       moves on; chain links between the decode pills.
   b3  the camera eases toward the grid; a time strip draws under it; eight arrows from the prompt: the whole
       grid amber in one unbroken stretch (one solid bar on 'prefill'); then the decode row feeds it one link at
       a time: a flash across the whole grid, dark while the next token is chosen ('decode': short ticks, long
       grey gaps, running far past the prefill bar); 'idle: nothing to give them'; then the grid goes and the
       rows read 'known in advance' / 'not known yet'.
   Layout: rows from x 170 (top y 400, bottom y 630); grid x 1320-1780, y 300-760; strip y 880 / 920. */
V.scene('ch10_s02', S => {
  const K = ch10Kit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;

  const hd = S.text('Why one runs in parallel and one cannot', { x: 110, y: 130, size: 46, weight: 700, family: 'display', color: 'ink' });
  const tim = S.text('same model, same chip: the difference is timing', { x: 110, y: 186, size: 28, weight: 600, color: 'muted' });
  hide([hd, tim]);
  fade(hd, 0, 1, 0.3, 0.5);
  fade(tim, 0, 1, T('b1~Timing') - 0.1, 0.4);
  fade([hd, tim], 1, 0, T('b2') - 0.1, 0.4);
  const world = S.g();

  // ================================================================ the two rows
  const TX = i => 170 + i * 92, DX = i => 170 + i * 112, TY = 400, DY = 630;
  const h1 = S.text('Prefill: the prompt already exists', { x: 130, y: 330, size: 30, weight: 700, color: 'ink' }, world);
  const h2 = S.text('Decode: each waits for the last', { x: 130, y: 534, size: 30, weight: 700, color: 'ink' }, world);
  const top = Array.from({ length: 8 }, (_, i) => ch10Pill(S, { text: `t${i + 1}`, x: TX(i), y: TY, kind: 'prompt' }, world));
  const d9 = ch10Pill(S, { text: 't9', x: DX(0), y: DY, kind: 'answer' }, world);
  const slots = [1, 2, 3].map(i => ch10Pill(S, { text: `t${9 + i}`, x: DX(i), y: DY, kind: 'slot' }, world));
  const fills = [1, 2, 3].map(i => ch10Pill(S, { text: `t${9 + i}`, x: DX(i), y: DY, kind: 'answer' }, world));
  hide([h1, h2, ...top, d9, ...slots, ...fills]);
  fade([h1, h2], 0, 1, 0.5, 0.5);
  fade([...top, d9, ...slots], 0, 0.4, 0.6, 0.5);
  const tKnown = T('b1~known') - 0.1;
  fade(top, 0.4, 1, tKnown, 0.25);
  fade([d9, ...slots], 0.4, 1, T('b2') - 0.1, 0.4);
  const all8 = S.text('all eight together', { x: TX(7) + 60, y: TY, size: 26, weight: 650, color: 'struct' }, world);
  hide(all8);
  fade(all8, 0, 1, tKnown + 0.15, 0.35);
  fade(all8, 1, 0, T('b3') - 0.1, 0.35);

  // ================================================================ the grid of workers
  const GX = 1320, GY = 300, GS = 460, PITCH = GS / 45;
  const defs = S.el('defs', {});
  const pat = (id, fill) => { const p = S.el('pattern', { id, x: GX, y: GY, width: PITCH, height: PITCH, patternUnits: 'userSpaceOnUse' }, defs); S.el('circle', { cx: PITCH / 2, cy: PITCH / 2, r: 2.3, fill }, p); };
  pat('ch10s02-grey', S.tone('faint'));
  pat('ch10s02-amber', S.tone('compute'));
  const grid = S.g(null, world);
  S.rect({ x: GX, y: GY, w: GS, h: GS, fill: 'url(#ch10s02-grey)' }, grid);
  const amber = S.rect({ x: GX, y: GY, w: GS, h: GS, fill: 'url(#ch10s02-amber)', opacity: 0 }, grid);
  grid.setAttribute('data-audit', 'ignore');
  const gL = S.text('thousands of workers', { x: GX + GS / 2, y: GY + GS + 34, size: 26, weight: 650, anchor: 'middle', color: 'muted' }, world);
  const gT = S.text('schematic', { x: GX + GS, y: GY - 22, size: 22, weight: 600, anchor: 'end', color: 'muted' }, world);
  hide([grid, gL, gT]);
  fade([grid, gL, gT], 0, 1, 0.8, 0.5);

  // ================================================================ b2: a chain
  const tB2 = T('b2') - 0.1;
  const chipC = S.text('earlier: each token needs the one before', { x: 110, y: 1004, size: 24, weight: 600, color: 'muted' });
  hide(chipC);
  fade(chipC, 0, 1, T('b2~met') - 0.1, 0.4);
  fade(chipC, 1, 0, T('b2~chain') + 0.3, 0.4);
  const hg = S.icon('ph:hourglass-medium-duotone', { x: 0, y: 0, size: 30, color: 'muted' }, world);
  const tNo = T('b2~no') - 0.1, tCh = T('b2~chosen') - 0.1;
  // the hourglass sits over the slot being waited for: t10, then t11, then t12
  whole(t => {
    const k1 = EIO(cl((t - tCh - 0.25) / 0.3)), k2 = EIO(cl((t - tCh - 0.8) / 0.3));
    const x = lerp(lerp(DX(1), DX(2), k1), DX(3), k2);
    hg.setAttribute('transform', `translate(${x.toFixed(1)},${DY - 44})`);
    setO(hg, cl((t - tNo) / 0.3) * (1 - cl((t - T('b3') + 0.1) / 0.3)));
  });
  const flash = p => { const r = S.rect({ x: p.l - 4, y: p.t - 4, w: p.w + 8, h: p.h + 8, r: p.h / 2 + 4, fill: 'compute', opacity: 0 }, world); r.setAttribute('data-audit', 'ignore'); world.insertBefore(r, p); return r; };
  pulse(flash(d9), tCh, 0.7, 0.4);
  fade(fills[0], 0, 1, tCh + 0.2, 0.25);
  fade(slots[0], 1, 0, tCh + 0.2, 0.25);
  pulse(flash(fills[0]), tCh + 0.55, 0.7, 0.4);
  fade(fills[1], 0, 1, tCh + 0.75, 0.25);
  fade(slots[1], 1, 0, tCh + 0.75, 0.25);
  pulse(flash(fills[1]), tCh + 1.1, 0.7, 0.4);
  fade(fills[2], 0, 1, tCh + 1.3, 0.25);
  fade(slots[2], 1, 0, tCh + 1.3, 0.25);
  const links = [0, 1, 2].map(i => S.icon('ph:link-simple-bold', { x: (DX(i) + DX(i + 1)) / 2, y: DY, size: 26, color: 'struct' }, world));
  hide(links);
  fade(links, 0, 1, T('b2~chain') - 0.15, 0.3, 0.12);

  // ================================================================ b3: independent work, never a chain
  const tB3 = T('b3') - 0.1;
  whole(t => {
    const k = EIO(cl((t - tB3) / 1.0)) * (1 - EIO(cl((t - T('b3~one') + 0.1) / 0.9))), z = lerp(1, 1.06, k);
    world.setAttribute('transform', `translate(${(1550 - 1550 * z).toFixed(1)},${(560 - 560 * z).toFixed(1)}) scale(${z.toFixed(4)})`);
  });
  K.ignore(world, tB3, 1.1);
  // the time strip under the grid
  const SX0 = GX, SX1 = GX + GS + 30, R1 = 880, R2 = 922;
  const strip = S.g(null, world);
  S.path({ d: `M${SX0},${R1 + 21} H${SX1}`, stroke: 'white', strokeOpacity: 0.2, sw: 1.5 }, strip);
  S.text('time →', { x: SX1, y: R1 - 30, size: 22, weight: 600, anchor: 'end', color: 'muted' }, strip);
  S.text('prefill', { x: SX0 - 14, y: R1, size: 22, weight: 600, anchor: 'end', color: 'muted' }, strip);
  S.text('decode', { x: SX0 - 14, y: R2, size: 22, weight: 600, anchor: 'end', color: 'muted' }, strip);
  [R1, R2].forEach(y => S.rect({ x: SX0, y: y - 8, w: SX1 - SX0, h: 16, r: 4, fill: 'white', fillOpacity: 0.05 }, strip));
  hide(strip);
  fade(strip, 0, 1, tB3 + 0.4, 0.5);
  // prefill: eight arrows at once; the whole grid amber in one unbroken stretch
  const tInd = T('b3~independent') - 0.1, PB = 1.0;
  const arrows = S.g(null, world);
  arrows.setAttribute('data-audit', 'ignore');
  top.forEach((p, i) => { const a = S.path({ d: `M${p.cx},${TY + 24} C${p.cx + 120},${TY + 80} ${GX - 260},${GY + 150 + i * 16} ${GX - 8},${GY + 150 + i * 16}`, stroke: 'struct', sw: 2, strokeOpacity: 0.8 }, arrows); K.draw(a, 1400, tInd, 0.35); });
  fade(arrows, 1, 0, tInd + PB + 0.1, 0.3);
  const pbar = S.rect({ x: SX0, y: R1 - 8, w: 0, h: 16, r: 4, fill: 'compute' }, world);
  const PBW = 120;
  whole(t => pbar.setAttribute('width', (PBW * cl((t - tInd - 0.3) / PB)).toFixed(1)));
  // decode: one link at a time — a flash across the grid, then dark while the next token is chosen
  const tNev = T('b3~never') - 0.05, GAP = 0.85, FL = 0.22;
  const flashes = Array.from({ length: 3 }, (_, i) => tNev + i * GAP);
  const lapse = Array.from({ length: 5 }, (_, i) => flashes[2] + 0.5 + i * 0.12);      // the last five, quickly
  whole(t => {
    let o = 0;
    const on = (a, d) => { if (t > a && t < a + d) o = Math.max(o, Math.sin(Math.PI * (t - a) / d)); };
    if (t > tInd + 0.3 && t < tInd + 0.3 + PB) o = Math.min(1, (t - tInd - 0.3) / 0.15, (tInd + 0.3 + PB - t) / 0.15);
    flashes.forEach(a => on(a, FL * 1.6));
    lapse.forEach(a => on(a, 0.1));
    amber.setAttribute('opacity', (0.95 * o).toFixed(3));
  });
  const feed = S.path({ d: `M${DX(3) + 40},${DY} C${DX(3) + 400},${DY} ${GX - 260},${GY + GS - 60} ${GX - 8},${GY + GS - 60}`, stroke: 'struct', sw: 2.5, strokeOpacity: 0.8 }, world);
  feed.setAttribute('data-audit', 'ignore');
  K.draw(feed, 1300, tNev - 0.3, 0.3);
  const ticks = S.g(null, world);
  const TW = PBW / 8, TSTEP = 58;
  [...flashes, ...lapse].forEach((a, i) => { const r = S.rect({ x: SX0 + i * TSTEP, y: R2 - 8, w: TW, h: 16, r: 3, fill: 'compute' }, ticks); hide(r); fade(r, 0, 1, a, 0.08); });
  const idle = S.text('idle: nothing to give them', { x: SX0 + 3.5 * TSTEP, y: R2 + 40, size: 24, weight: 650, anchor: 'middle', color: 'ink' }, world);
  hide(idle);
  fade(idle, 0, 1, T('b3~sit') - 0.1, 0.35);
  // one distinction: the grid and strip go; the rows get their labels
  const tOne = T('b3~one') - 0.1;
  fade([grid, gL, gT, strip, pbar, ticks, idle, feed], 1, 0, tOne, 0.5);
  fade(links, 1, 0.5, tOne, 0.4);
  const kA = S.text('known in advance', { x: TX(7) + 60, y: TY, size: 30, weight: 750, color: 'struct' }, world);
  const kN = S.text('not known yet', { x: DX(3) + 60, y: DY, size: 30, weight: 750, color: 'muted' }, world);
  hide([kA, kN]);
  fade(kA, 0, 1, tOne + 0.4, 0.4);
  fade(kN, 0, 1, tOne + 0.6, 0.4);
  void E;
});
