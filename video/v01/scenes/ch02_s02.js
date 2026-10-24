/* ch02_s02 · one file, three homes (fig 12)
   140 GB lives on a disk, in the memory beside the chip, and (almost none of it) on the chip itself,
   drawn on one true scale (1,000 px = 140 GB). Reads: disk ≈ 20 s, memory tens of ms. */
V.scene('ch02_s02', S => {
  const { fx } = S;
  const X0 = 200, U = 1000 / 140;          // px per GB

  // ---------------------------------------------------------------- b1: bytes, two per weight, 140 GB
  const fileIcon = S.icon('ph:file-duotone', { x: 260, y: 165, size: 110, color: 'struct' });
  S.add(fx.pop(fileIcon, { from: 0.6 }), 0.2);
  const tiles = S.g();
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) S.rect({ x: 205 + c * 22, y: 135 + r * 22, w: 18, h: 18, r: 3, fill: 'url(#card-bytes)', stroke: 'bytes', sw: 1.2 }, tiles);
  tiles.setAttribute('data-audit', 'ignore');
  S.set(tiles, { autoAlpha: 0 }, 0);
  S.add(gsap.to(fileIcon, { autoAlpha: 0, scale: 1.3, transformOrigin: '50% 50%', duration: 0.3 }), 'b1~counted-0.4');
  S.add(gsap.fromTo(tiles, { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(1.6)' }), 'b1~counted-0.2');
  const cap = S.text('file sizes: counted in bytes', { x: 420, y: 140, size: 30, color: 'muted', weight: 550 });
  const two = S.text('2 bytes', { x: 420, y: 200, size: 30, family: 'mono', color: 'bytes', weight: 650 });
  const later = S.text('why two: later', { x: 560, y: 200, size: 24, color: 'muted', weight: 550 });
  S.add(fx.in(cap, { from: 'left', d: 0.4 }), 'b1~counted');
  S.add(fx.pulse(tiles.children[7], { scale: 1.8, d: 0.6 }), 'b1~each weight');
  S.add(fx.in([two, later], { from: 'left', d: 0.4, stagger: 0.15 }), 'b1~takes');
  S.add(fx.out([cap, two, later], { d: 0.3 }), 'b1~seventy-0.3');
  const eq = S.equation([{ t: '70,000,000,000 weights', tone: 'ink' }, { t: '× 2 bytes', tone: 'bytes' }, { t: '= 140,000,000,000 bytes', tone: 'ink' }], { x: 1010, y: 165, size: 36 });
  S.add(fx.in(eq.parts[0], { from: 'up', d: 0.4 }), 'b1~seventy');
  S.add(fx.in(eq.parts[1], { from: 'up', d: 0.4 }), 'b1~make');
  S.add(fx.in(eq.parts[2], { from: 'up', d: 0.4 }), 'b1~a hundred');
  S.add(fx.swap(eq.parts[2], '= 140 GB'), 'b1~gigabytes-0.1');
  const gbNote = S.text('1 GB = 1 billion bytes', { x: 1500, y: 214, size: 24, anchor: 'end', color: 'muted', weight: 550 });
  S.add(fx.in(gbNote, { from: 'up', d: 0.35 }), 'b1~gigabytes+0.2');
  // the tiles compress into the solid block, the model, 1,000 px = 140 GB
  const modelG = S.g();
  const model = S.rect({ x: X0, y: 235, w: 140 * U, h: 50, r: 6, fill: 'url(#bar-bytes)' }, modelG);
  const modelLbl = S.text('140 GB', { x: X0 + 140 * U + 18, y: 261, size: 30, family: 'mono', weight: 650, color: 'bytes' }, modelG);
  S.set(model, { autoAlpha: 0 }, 0);
  S.add(gsap.to(tiles, { autoAlpha: 0, y: 100, duration: 0.4, ease: 'power2.in' }), 'b1~gigabytes+0.3');
  S.add(gsap.fromTo(model, { autoAlpha: 0, attr: { width: 130 } }, { autoAlpha: 1, attr: { width: 140 * U }, duration: 0.8, ease: 'power3.out' }), 'b1~gigabytes+0.5');
  S.add(fx.in(modelLbl, { from: 'left', d: 0.4 }), 'b1~gigabytes+1.0');

  // ---------------------------------------------------------------- b2: three places
  S.add(fx.out([...eq.parts, gbNote], { d: 0.35 }), 'b2');
  const rowTitle = (y, icon, a, b) => {
    const g = S.g();
    S.icon(icon, { x: X0 + 18, y, size: 40, color: 'struct' }, g);
    const t = S.text([{ t: a, c: 'ink', w: 650 }, { t: '  ·  ' + b, c: 'muted', w: 550 }], { x: X0 + 52, y, size: 30 }, g);
    return g;
  };
  const ROWS = { disk: 400, mem: 595, chip: 790 };
  // disk: runs off the frame: truncated, not shrunk
  const diskT = rowTitle(350, 'ph:hard-drives-duotone', 'A disk', 'keeps it between uses');
  const diskBar = S.rect({ x: X0, y: ROWS.disk - 25, w: 1800, h: 50, r: 6, fill: 'none', stroke: 'struct', sw: 2.5 });
  const diskCopy = S.rect({ x: X0 + 2, y: ROWS.disk - 21, w: 140 * U - 4, h: 42, r: 4, fill: 'url(#bar-bytes)', opacity: 0.6 });
  const farMore = S.text('far more →', { x: 1800, y: 340, size: 26, anchor: 'end', color: 'muted', weight: 550 });
  S.add(fx.in(diskT, { from: 'left', d: 0.4 }), 'b2~A disk-0.1');
  S.add(gsap.fromTo(diskBar, { attr: { width: 0 } }, { attr: { width: 1800 }, duration: 0.8, ease: 'power2.inOut' }), 'b2~A disk');
  S.add(gsap.fromTo(diskCopy, { autoAlpha: 0, x: -200 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out' }), 'b2~stores');
  S.add(fx.in(farMore, { from: 'left', d: 0.35 }), 'b2~stores+0.3');
  // memory beside the chip: exactly 1,000 px
  const memT = rowTitle(545, 'ph:memory-duotone', 'Memory beside the chip', 'in use');
  const memBar = S.rect({ x: X0, y: ROWS.mem - 25, w: 140 * U, h: 50, r: 6, fill: 'none', stroke: 'struct', sw: 2.5 });
  const sized = S.text('sized to fit the model', { x: X0 + 140 * U, y: 548, size: 24, anchor: 'end', color: 'muted', weight: 550 });
  S.add(fx.in(memT, { from: 'left', d: 0.4 }), 'b2~The memory-0.1');
  S.add(gsap.fromTo(memBar, { attr: { width: 0 } }, { attr: { width: 140 * U }, duration: 0.7, ease: 'power2.inOut' }), 'b2~The memory');
  S.add(gsap.to(modelG, { y: ROWS.mem - 260, duration: 0.7, ease: 'power3.inOut' }), 'b2~while');
  S.add(gsap.to(modelLbl, { autoAlpha: 0, duration: 0.3 }), 'b2~while');
  S.add(fx.in(sized, { from: 'up', d: 0.35 }), 'b2~model+0.2');
  // the chip itself: 0.87 px at this scale, drawn as a 1 px hairline
  const chipT = rowTitle(740, 'ph:cpu-duotone', 'The chip itself', 'does the arithmetic');
  const hair = S.rect({ x: X0, y: ROWS.chip - 25, w: 1, h: 50, fill: 'compute' });
  const under = S.text('to scale: under 1 px', { x: X0 + 22, y: ROWS.chip, size: 26, color: 'muted', weight: 550 });
  S.add(fx.in(chipT, { from: 'left', d: 0.4 }), 'b2~The chip-0.1');
  S.add(gsap.fromTo(hair, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }), 'b2~almost');
  S.add(fx.in(under, { from: 'left', d: 0.35 }), 'b2~nothing');

  // ---------------------------------------------------------------- b3: the magnifier
  S.add(fx.dim([farMore, sized, under], { to: 0.3 }), 'b3');
  const MG = { x: 1620, y: 830, r: 110 };
  const mag = S.g();
  const leader = S.line({ x1: X0 + 2, y1: ROWS.chip, x2: MG.x - MG.r, y2: MG.y, stroke: 'muted', sw: 1.5, strokeOpacity: 0.6 }, mag);
  leader.setAttribute('data-audit', 'ignore');
  S.circle({ x: MG.x, y: MG.y, r: MG.r, fill: '#0c1326', stroke: 'ink', sw: 3 }, mag);
  const cells = [];
  for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
    const x = MG.x - 84 + c * 24, y = MG.y - 84 + r * 24;
    if (Math.hypot(x + 9 - MG.x, y + 9 - MG.y) > MG.r - 20) continue;
    cells.push(S.rect({ x, y, w: 18, h: 18, r: 3, fill: 'none', stroke: 'compute', sw: 1.6 }, mag));
  }
  const hot = cells[Math.floor(cells.length / 2)];
  S.add(gsap.fromTo(mag, { autoAlpha: 0, scale: 0.2, svgOrigin: `${X0} ${ROWS.chip}` }, { autoAlpha: 1, scale: 1, svgOrigin: `${X0} ${ROWS.chip}`, duration: 0.8, ease: 'power3.out' }), 'b3');
  const each = S.text('each: a few hundred thousand bytes', { x: 1480, y: 866, size: 26, anchor: 'end', color: 'ink', weight: 600 });
  const inAll = S.text('≈ 0.1 GB in all · ≈ 1/1,000 of the model', { x: 1480, y: 806, size: 26, anchor: 'end', color: 'ink', weight: 600 });
  S.add(gsap.to(hot, { attr: { fill: S.tone('compute'), 'fill-opacity': 0.7 }, duration: 0.3 }), 'b3~each');
  S.add(fx.in(each, { from: 'right', d: 0.4 }), 'b3~each');
  S.add(fx.in(inAll, { from: 'right', d: 0.4 }), 'b3~tenth');

  // ---------------------------------------------------------------- b4: twenty seconds versus tens of milliseconds
  S.add(fx.dim([mag, each, inAll], { to: 0.3 }), 'b4');
  S.add(fx.dim([diskT, memT, chipT], { to: 0.6 }), 'b4');
  const tc = S.text('10× time-compressed', { x: 1640, y: 200, size: 24, anchor: 'middle', color: 'muted', weight: 550 });
  S.add(fx.in(tc, { from: 'fade', d: 0.3 }), 'b4');
  const diskPath = S.g();
  const dp = S.path({ d: `M${X0 + 30},${ROWS.disk + 25} C${X0 - 40},${ROWS.disk + 120} ${X0 - 40},${ROWS.chip - 120} ${X0},${ROWS.chip - 26}`, stroke: 'bytes', sw: 1.5, strokeOpacity: 0.5, dash: '5 6' }, diskPath);
  const ifTag = S.text('if read straight from disk', { x: 262, y: 462, size: 24, color: 'muted', weight: 550 }, diskPath);
  dp.setAttribute('data-audit', 'ignore');
  S.add(fx.in(diskPath, { from: 'fade', d: 0.3 }), 'b4~off');
  S.flow({ path: dp, from: 'b4~off', to: S.t('b4~off') + 2.0, speed: 260, every: 0.09, size: 5, color: 'bytes' });
  const diskSW = libStopwatch(S, { x: 1450, y: 480, size: 80, span: 30000, value: 0, unit: 's', approx: true, readout: 'right', max: 20000, buttons: false });
  const diskNote = S.text('fast drive ≈ 7 GB/s · varies', { x: 1390, y: 480, size: 24, anchor: 'end', color: 'muted', weight: 550 });
  S.add(diskSW.in({ d: 0.4 }), 'b4~off-0.3');
  S.add(diskSW.run(0, 20000, { d: 2.0 }), 'b4~off');
  S.add(fx.in(diskNote, { from: 'right', d: 0.35 }), 'b4~takes');
  // memory: one dense burst, over within a frame
  const memPath = S.path({ d: `M${X0 + 120},${ROWS.mem + 25} C${X0 + 80},${ROWS.mem + 90} ${X0 + 30},${ROWS.chip - 90} ${X0 + 1},${ROWS.chip - 26}`, stroke: 'bytes', sw: 4, strokeOpacity: 0 });
  memPath.setAttribute('data-audit', 'ignore');
  S.add(gsap.fromTo(memPath, { attr: { 'stroke-opacity': 0 } }, { attr: { 'stroke-opacity': 1 }, duration: 0.05, yoyo: true, repeat: 1, repeatDelay: 0.1 }), 'b4~tens');
  const memSW = libStopwatch(S, { x: 1450, y: 662, size: 80, text: '?', readout: 'right', texts: ['tens of ms'], buttons: false });
  S.add(memSW.in({ d: 0.4 }), 'b4~From');
  S.add(memSW.show('tens of ms'), 'b4~tens');
  const brk = S.path({ d: 'M1680,480 L1700,480 L1700,662 L1680,662', stroke: 'ink', sw: 3 });
  const fast = S.text('≈ 500× faster', { x: 1668, y: 571, size: 30, anchor: 'end', color: 'ink', weight: 700 });
  S.set(brk, { autoAlpha: 0 }, 0);
  S.add(gsap.set(brk, { autoAlpha: 1 }), 'b4~milliseconds');
  S.add(fx.draw(brk, { d: 0.4 }), 'b4~milliseconds');
  S.add(fx.in(fast, { from: 'right', d: 0.4 }), 'b4~milliseconds+0.2');

  // ---------------------------------------------------------------- b5: loaded once; the disk drops out
  S.add(fx.dim([diskSW, memSW, brk, fast, diskNote, tc], { to: 0.3 }), 'b5');
  S.add(fx.out(diskPath, { d: 0.35 }), 'b5');
  const load = S.arrow({ x1: 900, y1: ROWS.disk + 30, x2: 900, y2: ROWS.mem - 32, color: 'bytes', sw: 4, head: 16 });
  const loadL = S.text('load once, at start-up', { x: 876, y: 488, size: 28, anchor: 'end', color: 'bytes', weight: 650 });
  S.set(load, { autoAlpha: 0 }, 0);
  S.add(gsap.set(load, { autoAlpha: 1 }), 'b5~loaded');
  S.add(fx.drawArrow(load, { d: 0.5 }), 'b5~loaded');
  S.add(fx.in(loadL, { from: 'right', d: 0.4 }), 'b5~once');
  S.add(gsap.fromTo(model, { filter: 'none' }, { filter: 'url(#glow-bytes)', duration: 0.3, yoyo: true, repeat: 1 }), 'b5~once+0.3');
  const stays = S.text('stays while the service runs', { x: X0, y: 655, size: 26, color: 'muted', weight: 550 });
  S.add(fx.in(stays, { from: 'up', d: 0.35 }), 'b5~stays');
  S.add(gsap.to([diskT, diskBar, diskCopy, load, loadL], { opacity: 0.2, duration: 0.6 }), 'b5~plays');
  S.add(fx.swap(farMore, 'start-up only, never per token'), 'b5~plays');
  S.add(gsap.to(farMore, { opacity: 0.8, duration: 0.3 }), 'b5~plays+0.2');
  S.add(gsap.fromTo(memBar, { filter: 'none' }, { filter: 'url(#glow-struct)', duration: 0.5 }), 'b5~This film');
  const take = S.takeaway("memory beside the chip: this film's home", { tone: 'struct' });
  S.add(fx.in(take, { from: 'up', d: 0.5 }), 'b5~This film');
});
