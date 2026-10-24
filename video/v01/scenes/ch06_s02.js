/* ch06_s02 · the arithmetic and the numbers live apart (fig 71)
   b1  s01's worker grid folds into the die of the chapter's GPU package (four squares per face cell);
       'The chip = compute die', 'does the arithmetic', 'holds almost nothing' and a magnifier on the die.
   b2  the memory stacks light up ('The memory', 'holds the weights', 'does no arithmetic'); the empty gap
       between the two flashes; the bus draws on, memory to die.
   b3  weight tiles stream across the bus and flash amber as the die uses them; a token counter with a
       progress bar ticks once per full crossing; '140 GB, every token'; the parked 30 ms bar slides in,
       loses its '?' and gets its name, 'moving the weights'.
   b4  a ghost of the memory slides onto the die and the stream stops; it fades, the stream resumes and the
       bus thickens into a translucent coral wall; the camera dives into one wire.
   Layout: package s 1.25 about (960, 600), gap 240: board x 484-1436, y 355-895; die x 541-916, y 412-787;
   bus x 916-1216; memory x 1216-1379. Labels above at y 318, lines below at y 938/980, magnifier inset
   left (x 135-425). HUD: counter top-centre (y 63-129), bar parked top-right. */
V.scene('ch06_s02', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const bump = u => (u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u));
  const E = n => gsap.parseEase(n);
  const eIO2 = E('power2.inOut'), eIO3 = E('power3.inOut');
  const clock = (t0, t1, fn) => ch06Clock(S, t0, t1, fn);
  const BYTES = S.tone('bytes'), COMPUTE = S.tone('compute');

  // ================================================================ the world (the camera dives into it in b4)
  const world = S.g();
  const PK = { x: 960, y: 600, s: 1.25, gap: 240 };
  const pkg = ch06Package(S, { x: PK.x, y: PK.y, s: PK.s, gap: PK.gap, wires: 14, tagSize: 24 }, world);
  const D = pkg.dieBox;                                       // x 541.25-916.25, y 412.5-787.5
  const ST = [0, 1, 2].map(i => pkg.stackBox(i));             // x 1216.25-1378.75
  const busL = D.x + D.w, busR = ST[0].x, busC = (busL + busR) / 2;
  const lines = pkg.bus.flatMap(b => b.lines);
  const wireY = (i, k) => pkg.P(0, pkg.bus[i].lines[k].y)[1];

  // build-time state: board, die and tag hidden; the face empty (the grid becomes it); stacks and bus hidden
  S.set([pkg.board, pkg.die, pkg.tagEl], { autoAlpha: 0 }, 0);
  pkg.face.setAttribute('fill-opacity', 0);
  S.set(pkg.stacks.map(st => st.inner), { autoAlpha: 0 }, 0);
  S.set(lines, { autoAlpha: 0 }, 0);

  // ================================================================ b1: the grid folds into the die
  // s01's last frame: 48 x 12 squares at x 230-1690, y 607-968 (CH06.GRID_END applied to CH06.GRID)
  const GE = CH06.GRID_END, G0 = CH06.GRID;
  const gx = GE.x + GE.ox + GE.s * (G0.x - GE.ox), gy = GE.y + GE.oy + GE.s * (G0.y - GE.oy);
  const grid = ch06Grid(S, { x: gx, y: gy, pitch: G0.pitch * GE.s, sq: G0.sq * GE.s, fo: GE.fo }, world);
  // each face cell (12 x 12) takes four neighbouring squares of a row
  const FP = 22, FQ = 18.6, F0 = (300 - (11 * FP + FQ)) / 2, dieLX = -(300 + PK.gap + 130) / 2;
  grid.cells.forEach(c => {
    const [fx0, fy0] = pkg.P(dieLX + F0 + Math.floor(c.c / 4) * FP, -150 + F0 + c.r * FP);
    c.tx = fx0; c.ty = fy0; c.lag = 0.28 * (1 - c.c / 47) + 0.04 * c.r / 11;
  });
  const sq0 = grid.sq, sq1 = FQ * PK.s;
  const tM = 0.35, tMd = 0.95, tSwap = tM + 0.28 + tMd + 0.05;
  clock(tM, tSwap + 0.3, t => {
    grid.cells.forEach(c => {
      const k = eIO3(cl((t - tM - c.lag) / tMd));
      const sq = lerp(sq0, sq1, k);
      c.setAttribute('x', lerp(c.hx, c.tx, k).toFixed(2)); c.setAttribute('y', lerp(c.hy, c.ty, k).toFixed(2));
      c.setAttribute('width', sq.toFixed(2)); c.setAttribute('height', sq.toFixed(2));
      // four stacked squares at 0.21 read as one at about 0.6; then they hand over to the face
      const f = lerp(GE.fo, 0.21, k) * (1 - cl((t - tSwap) / 0.3));
      c.setAttribute('fill-opacity', f.toFixed(3));
    });
    pkg.face.setAttribute('fill-opacity', (0.6 * cl((t - tSwap) / 0.3)).toFixed(3));
  });
  S.add(fx.in(pkg.board, { from: 'fade', d: 0.7 }), tM + 0.25);
  S.add(fx.in(pkg.die, { from: 'fade', d: 0.6 }), tM + 0.55);
  S.add(fx.in(pkg.tagEl, { from: 'fade', d: 0.5 }), tM + 0.9);
  S.add(gsap.fromTo(pkg.stacks.map(st => st.inner), { autoAlpha: 0, y: 12 }, { autoAlpha: 0.28, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06, immediateRender: false }), tM + 0.8);

  // labels above: 'The chip  = compute die' centred over the die, 'The memory' over the stacks
  const LY = 318, LS = 44;
  const wChip = S.measure('The chip', { size: LS, weight: 700, family: 'display' });
  const wEq = S.measure('= compute die', { size: 28, weight: 550 });
  const chipX = D.cx - (wChip + 16 + wEq) / 2;
  const chipLbl = S.text('The chip', { x: chipX, y: LY, size: LS, weight: 700, family: 'display', color: 'compute' }, world);
  const chipEq = S.text('= compute die', { x: chipX + wChip + 16, y: LY + 4, size: 28, weight: 550, color: 'muted' }, world);
  const memLbl = S.text('The memory', { x: ST[0].cx, y: LY, size: LS, weight: 700, family: 'display', anchor: 'middle', color: 'bytes' }, world);
  S.add(fx.in(chipLbl, { from: 'up', d: 0.6, dist: 20 }), 'b1~chip-0.1');
  S.add(fx.in(chipEq, { from: 'left', d: 0.5, dist: 20 }), 'b1~compute-0.1');
  S.add(pkg.flashDie({ d: 0.6 }), 'b1~piece-0.05');

  // lines below the board
  const L1Y = 938, L2Y = 980;
  const chip1 = S.text('does the arithmetic', { x: D.cx, y: L1Y, size: 30, weight: 600, anchor: 'middle', color: 'compute' }, world);
  const chip2 = S.text('holds almost nothing', { x: D.cx, y: L2Y, size: 30, weight: 550, anchor: 'middle', color: 'muted' }, world);
  const mem1 = S.text('holds the weights', { x: ST[0].cx, y: L1Y, size: 30, weight: 600, anchor: 'middle', color: 'bytes' }, world);
  const mem2 = S.text('does no arithmetic', { x: ST[0].cx, y: L2Y, size: 30, weight: 550, anchor: 'middle', color: 'muted' }, world);
  S.add(fx.in(chip1, { from: 'up', d: 0.5, dist: 16 }), 'b1~calculates-0.1');
  S.add(fx.in(chip2, { from: 'up', d: 0.5, dist: 16 }), 'b1~thousandth-0.15');

  // the magnifier: a lens on the die, an inset to the left with the chip's tiny store
  const LENS = { x: 640, y: 520, r: 44 }, INS = { x: 280, y: 600, r: 145 };
  const mag = S.g(null, world);
  const conn = S.g(null, mag);
  {
    const dx = INS.x - LENS.x, dy = INS.y - LENS.y, dd = Math.hypot(dx, dy), ux = dx / dd, uy = dy / dd;
    const a = (LENS.r - INS.r) / dd, b = Math.sqrt(1 - a * a);
    [1, -1].forEach(sg => {
      const nx = a * ux - sg * b * uy, ny = a * uy + sg * b * ux;
      const ln = S.line({ x1: LENS.x + LENS.r * nx, y1: LENS.y + LENS.r * ny, x2: INS.x + INS.r * nx, y2: INS.y + INS.r * ny, stroke: 'ink', strokeOpacity: 0.35, sw: 1.5 }, conn);
      ln.setAttribute('data-audit', 'ignore');
    });
  }
  const lens = S.circle({ x: LENS.x, y: LENS.y, r: LENS.r, fill: '#ffffff', fillOpacity: 0.06, stroke: 'ink', sw: 3 }, mag);
  const inset = S.g(null, mag);
  S.circle({ x: INS.x, y: INS.y, r: INS.r, fill: '#0c1326', stroke: 'ink', sw: 3 }, inset);
  // enlarged worker squares (amber outlines) round a small blue tray holding three coral weight tiles
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    const x = INS.x - 118 + c * 50, y = INS.y - 118 + r * 50;
    if (r >= 1 && r <= 3 && c >= 1 && c <= 3) continue;               // the tray sits in the middle
    if (Math.hypot(x + 18 - INS.x, y + 18 - INS.y) > INS.r - 30) continue;
    S.rect({ x, y, w: 36, h: 36, r: 5, stroke: 'compute', strokeOpacity: 0.8, sw: 2 }, inset);
  }
  const tray = S.g(null, inset);
  S.rect({ x: INS.x - 56, y: INS.y - 30, w: 112, h: 60, r: 10, fill: 'url(#card-struct)', stroke: 'struct', sw: 2.5 }, tray);
  [-30, 0, 30].forEach(dx => S.rect({ x: INS.x + dx - 10, y: INS.y - 10, w: 20, h: 20, r: 4, fill: 'bytes', fillOpacity: 0.85 }, tray));
  const insTag = S.g(null, mag);
  S.text('≈ 0.1 GB in all', { x: INS.x, y: INS.y + INS.r + 40, size: 28, weight: 650, anchor: 'middle', color: 'ink' }, insTag);
  S.text('≈ 1/1,000 of the model', { x: INS.x, y: INS.y + INS.r + 78, size: 26, weight: 550, anchor: 'middle', color: 'muted' }, insTag);
  S.set([lens, conn, inset, insTag], { autoAlpha: 0 }, 0);
  const tMag = T('b1~thousandth') - 0.25;
  S.add(gsap.fromTo(lens, { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'power3.out', transformOrigin: '50% 50%', immediateRender: false }), tMag);
  S.add(fx.in(conn, { from: 'fade', d: 0.4 }), tMag + 0.2);
  S.add(fx.in(inset, { from: 'fade', d: 0.5 }), tMag + 0.3);
  S.add(fx.in(insTag, { from: 'up', d: 0.5, dist: 14 }), tMag + 0.6);

  // ================================================================ b2: the memory, the gap, the bus
  S.add(fx.out(mag, { d: 0.4 }), T('b2') - 0.2);
  S.add(gsap.fromTo(pkg.stacks.map(st => st.inner), { opacity: 0.28 }, { opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.07, immediateRender: false }), 'b2~memory-0.05');
  S.add(fx.in(memLbl, { from: 'up', d: 0.6, dist: 20 }), 'b2~memory-0.1');
  S.add(fx.in(mem1, { from: 'up', d: 0.5, dist: 16 }), 'b2~holds-0.1');
  S.add(fx.in(mem2, { from: 'up', d: 0.5, dist: 16 }), 'b2~does-0.1');
  // 'separate silicon': the empty gap between them flashes twice
  const gapBox = S.rect({ x: busL + 8, y: D.y - 4, w: busR - busL - 16, h: D.h + 8, r: 10, stroke: 'ink', sw: 2.5, dash: '9 8', opacity: 0 }, world);
  const tGap = T('b2~separate') - 0.05;
  clock(tGap, tGap + 1.2, t => gapBox.setAttribute('opacity', (0.85 * Math.max(bump((t - tGap) / 0.55), bump((t - tGap - 0.6) / 0.55))).toFixed(3)));
  // 'a bus': the wires draw on from the memory to the die
  S.add(gsap.fromTo(lines, { drawSVG: '100% 100%', autoAlpha: 1 }, { drawSVG: '0% 100%', duration: 0.7, ease: 'power2.inOut', stagger: 0.5 / lines.length, immediateRender: false }), 'b2~bus-0.1');
  const STRIP_T = (PK.y - 196 * PK.s + D.y) / 2;                    // middle of the board's top strip
  const busTag = S.text('bus = a bundle of wires', { x: busC, y: STRIP_T, size: 24, weight: 550, anchor: 'middle', color: 'muted' }, world);
  S.add(fx.in(busTag, { from: 'fade', d: 0.5 }), 'b2~bundle-0.1');

  // ================================================================ b3: the stream, every token
  const tFlow0 = T('b3') + 0.06, tStop = T('b4~one') - 0.04, tGo = T('b4~memory'), tPush = T('b4~need') - 0.2;
  const W1 = [tFlow0, tStop], W2 = [tGo, tPush], L1 = W1[1] - W1[0];
  const flowT = t => Math.max(0, Math.min(t, W1[1]) - W1[0]) + Math.max(0, Math.min(t, W2[1]) - W2[0]);
  const TOKEN = 2.3, TT = 0.62, FL = 0.2, TS = 12;
  const xs = busR - 4, xe = busL + 2;
  const tiles = S.g(null, world);
  const rnd = S.rand(62);
  const pool = [];
  for (let tau = 0; ; tau += 1 / 44) {
    const tj = tau + rnd() * 0.012;
    const t0 = tj < L1 ? W1[0] + tj : W2[0] + tj - L1;
    if (t0 > W2[1]) break;
    const i = Math.floor(rnd() * 3), k = Math.floor(rnd() * 14);
    const e = S.rect({ x: 0, y: 0, w: TS, h: TS, r: 3, fill: 'bytes', opacity: 0 }, tiles);
    Object.assign(e, { t0, wy: wireY(i, k), vis: false });
    pool.push(e);
  }
  const paintTiles = t => pool.forEach(e => {
    const u = (t - e.t0) / TT;
    if (u < 0 || u > 1 + FL / TT) { if (e.vis) { e.setAttribute('opacity', 0); e.vis = false; } return; }
    e.vis = true;
    let x, op, sz, fill;
    if (u <= 1) { x = lerp(xs, xe, u); op = cl(u / 0.08); sz = TS; fill = BYTES; }
    else { const v = (t - e.t0 - TT) / FL; x = xe - 18 * v; op = 1 - v; sz = TS + 8 * v; fill = COMPUTE; }
    e.setAttribute('x', (x - sz / 2).toFixed(2)); e.setAttribute('y', (e.wy - sz / 2).toFixed(2));
    e.setAttribute('width', sz.toFixed(2)); e.setAttribute('height', sz.toFixed(2));
    e.setAttribute('fill', fill); e.setAttribute('opacity', op.toFixed(3));
  });

  // HUD (outside the world): the token counter, a pill with a progress bar of the crossing
  const hud = S.g();
  const CT = { x: 960, y: 96, w: 200, h: 66 };
  const counter = S.g(null, hud);
  S.rect({ x: CT.x - CT.w / 2, y: CT.y - CT.h / 2, w: CT.w, h: CT.h, r: 16, fill: '#0c1326', stroke: 'struct', strokeOpacity: 0.85, sw: 2.5 }, counter);
  const NTOK = Math.floor(flowT(tPush) / TOKEN) + 1;
  const tokTexts = [...Array(NTOK)].map((_, j) => S.text(`token ${j + 1}`, { x: CT.x, y: CT.y - 7, size: 30, weight: 650, family: 'mono', anchor: 'middle', color: 'ink', opacity: j === 0 ? 1 : 0 }, counter));
  const PB = { x: CT.x - 74, y: CT.y + 20, w: 148 };
  S.line({ x1: PB.x, y1: PB.y, x2: PB.x + PB.w, y2: PB.y, stroke: 'faint', sw: 5, cap: 'round' }, counter);
  const prog = S.rect({ x: PB.x, y: PB.y - 2.5, w: 0, h: 5, r: 2.5, fill: 'bytes' }, counter);
  const paintCounter = t => {
    const f = flowT(t), j = Math.min(NTOK - 1, Math.floor(f / TOKEN));
    tokTexts.forEach((e, n) => e.setAttribute('opacity', n === j ? 1 : 0));
    prog.setAttribute('width', (PB.w * cl((f - j * TOKEN) / TOKEN)).toFixed(2));
  };
  S.set(counter, { autoAlpha: 0 }, 0);
  S.add(fx.in(counter, { from: 'down', d: 0.5, dist: 14 }), T('b3') - 0.15);
  const paint = t => { paintTiles(t); paintCounter(t); };
  paint(T('b3'));
  clock(T('b3'), tPush + 0.4, paint);

  // '140 GB, every token' under the bus, in the board's bottom strip; later a leader joins it to the flow
  const STRIP_B = D.y + D.h + (PK.y + 236 * PK.s - D.y - D.h) / 2;
  const gbTag = S.text('140 GB, every token', { x: busC, y: STRIP_B, size: 30, weight: 650, anchor: 'middle', color: 'bytes' }, world);
  S.add(fx.in(gbTag, { from: 'up', d: 0.5, dist: 14 }), 'b3~every#2-0.1');
  const lowWire = wireY(2, 13);
  const leader = S.g(null, world);
  const leadLine = S.line({ x1: busC, y1: STRIP_B - 22, x2: busC, y2: lowWire + 4, stroke: 'bytes', sw: 2.5 }, leader);
  S.circle({ x: busC, y: lowWire, r: 4.5, fill: 'bytes' }, leader);
  leadLine.setAttribute('data-audit', 'ignore');
  S.set(leader, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(leader, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, immediateRender: false }), 'b3~waiting-0.1');
  S.add(gsap.fromTo(leadLine, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.45, ease: 'power2.out', immediateRender: false }), 'b3~waiting-0.1');

  // the parked 30 ms bar: brightens, slides in a little, loses its '?' and gets its name
  const bar = ch06Bar(S, { parked: true, name: 'moving the weights' }, hud);
  const SLID = { x: 1340, y: 50, s: 0.24, ox: 0, oy: 0 };
  S.add(fx.xform(bar, SLID, { d: 0.9, ease: 'power3.inOut' }), 'b3~coral-0.1');
  S.add(gsap.fromTo(bar.body, { opacity: CH06.PARK.dim }, { opacity: 1, duration: 0.7, ease: 'power2.out', immediateRender: false }), 'b3~coral');
  S.add(bar.dissolveQ({ d: 0.5 }), 'b3~percent-0.1');
  S.add(bar.showName({ d: 0.5 }), 'b3~moving-0.1');
  // the name at a readable size, just above the bar's tag, on a short coral stem
  const tagCx = SLID.x + SLID.s * (CH06.BAR.tag.x + CH06.BAR.tag.w / 2), tagTop = SLID.y + SLID.s * CH06.BAR.tag.y;
  const callout = S.g(null, hud);
  const nameBig = S.text('moving the weights', { x: tagCx, y: tagTop - 38, size: 32, weight: 650, anchor: 'middle', color: 'bytes' }, callout);
  S.line({ x1: tagCx, y1: tagTop - 19, x2: tagCx, y2: tagTop - 2, stroke: 'bytes', sw: 2.5 }, callout);
  S.add(fx.in(callout, { from: 'down', d: 0.5, dist: 12 }), 'b3~moving-0.05');

  // ================================================================ b4: one place? the wall, then into one wire
  // a ghost of the memory slides onto the die; the stream has stopped
  const ghost = S.g(null, world);
  ST.forEach(b => S.rect({ x: b.x, y: b.y, w: b.w, h: b.h, r: 12, fill: 'bytes', fillOpacity: 0.16, stroke: 'bytes', strokeOpacity: 0.9, sw: 2.5, dash: '8 7' }, ghost));
  const dxGhost = D.cx - ST[0].cx;
  S.set(ghost, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(ghost, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, immediateRender: false }), 'b4~one-0.15');
  S.add(gsap.fromTo(ghost, { x: 0 }, { x: dxGhost, duration: 0.6, ease: 'power3.inOut', immediateRender: false }), 'b4~one');
  S.add(gsap.to(ghost, { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }), 'b4~no-0.1');

  // the bus band thickens into a translucent coral wall
  const wall = S.rect({ x: busL, y: D.y - 6, w: busR - busL, h: D.h + 12, fill: 'bytes', fillOpacity: 0 }, world);
  wall.setAttribute('data-audit', 'ignore');
  const tWall = T('b4~memory') + 0.05;
  S.add(gsap.fromTo(wall, { attr: { 'fill-opacity': 0 } }, { attr: { 'fill-opacity': 0.26 }, duration: 0.6, ease: 'power2.out', immediateRender: false }), tWall);
  S.add(gsap.fromTo(lines, { attr: { 'stroke-width': 1.6, 'stroke-opacity': 0.5 } }, { attr: { 'stroke-width': 2.6, 'stroke-opacity': 0.85 }, duration: 0.6, ease: 'power2.out', immediateRender: false }), tWall);
  S.add(fx.out(busTag, { d: 0.25 }), tWall - 0.1);
  const wallLbl = S.text('the memory wall', { x: busC, y: STRIP_T, size: 30, weight: 700, anchor: 'middle', color: 'bytes' }, world);
  S.add(fx.in(wallLbl, { from: 'fade', d: 0.4 }), 'b4~wall-0.15');

  // 'no need for this series': the camera dives into the middle wire of the middle stack
  const tEnd = S.duration - 0.45;
  const P0 = { x: busC, y: wireY(1, 7) }, ZMAX = 160;
  S.add(fx.out([hud], { d: 0.35 }), tPush - 0.15);
  S.add(gsap.to(tiles, { opacity: 0, duration: 0.25, ease: 'power2.in' }), tPush);
  S.add(gsap.fromTo(wall, { attr: { 'fill-opacity': 0.26 } }, { attr: { 'fill-opacity': 0 }, duration: 0.9, ease: 'power2.in', immediateRender: false }), tPush + 0.2);
  clock(tPush, tEnd, t => {
    const u = cl((t - tPush) / (tEnd - tPush)), e = eIO2(u);
    const s = Math.exp(Math.log(ZMAX) * e);
    const px = lerp(P0.x, 960, e), py = lerp(P0.y, 540, e);
    if (u > 0) world.setAttribute('data-audit', 'ignore'); else world.removeAttribute('data-audit');   // text grows huge
    world.setAttribute('transform', u <= 0 ? '' : `translate(${(px - s * P0.x).toFixed(2)},${(py - s * P0.y).toFixed(2)}) scale(${s.toFixed(4)})`);
  });
});
