/* ch01_s02 · a slab of switches (fig 2)
   Movement 1 (b1-b2): Zoom into a single transistor: source, drain, gate electrode, voltage pulse, snap switch.
   Movement 2 (b3): Four transistors form an arithmetic adder: inputs 1 + 1 produce sum 0, carry 1.
   Movement 3 (b4): Multiplies into a massive repeating grid of eighty billion switches, forming the GPU die. */

V.scene('ch01_s02', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('A slab of switches', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Transistor schematic builder
  const tGroup = S.g();
  const tr = ch01Transistor(S, { cx: GX, cy: GY - 20, parent: tGroup });

  // Initially hide transistor components
  S.set(tGroup, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Zoom into single transistor
  S.add(fx.in(tGroup, { from: 'scale', d: 0.6 }), 'b1~chip');
  S.add(fx.draw([tr.sourceLine, tr.drainLine, tr.gateLine], { d: 0.5 }), 'b1~switches-0.2');

  // ---------------------------------------------------------------- b2: Voltage pulse & switch snap
  const vWave = S.circle({ x: tr.cx, y: tr.cy - 120, r: 12, fill: S.tone('compute') });
  vWave.setAttribute('data-audit', 'ignore');
  S.set(vWave, { autoAlpha: 0 });

  S.add(gsap.set(vWave, { autoAlpha: 1 }), 'b2~voltage-0.3');
  S.add(gsap.fromTo(vWave,
    { y: tr.cy - 120, scale: 0.8 },
    { y: tr.cy - 10, scale: 1.4, duration: 0.45, ease: 'power2.in' }
  ), 'b2~voltage-0.2');
  S.add(gsap.to(vWave, { autoAlpha: 0, duration: 0.15 }), 'b2~tap-0.1');

  // Switch arm snaps shut to connect source and drain
  S.add(gsap.to(tr.switchArm, {
    attr: { x2: tr.cx + 60, y2: tr.cy + 40, stroke: S.tone('helps') },
    duration: 0.18, ease: 'back.out(2)'
  }), 'b2~tap');

  // Switch indicators update: OFF -> ON
  S.add(fx.out(tr.badgeOff, { d: 0.2 }), 'b2~tap-0.05');
  S.add(fx.in(tr.badgeOn, { from: 'fade', d: 0.25 }), 'b2~tap+0.05');

  // Voltage drops, switch snaps open again
  S.add(gsap.to(tr.switchArm, {
    attr: { x2: tr.cx + 55, y2: tr.cy + 12, stroke: S.tone('violet') },
    duration: 0.25, ease: 'power2.out'
  }), 'b2~position+0.2');
  S.add(fx.out(tr.badgeOn, { d: 0.2 }), 'b2~position+0.2');
  S.add(fx.in(tr.badgeOff, { from: 'fade', d: 0.2 }), 'b2~position+0.25');

  // ---------------------------------------------------------------- b3: 4 transistors form an adder circuit
  // Smooth crossfade from single transistor to logic adder
  S.add(fx.out(tGroup, { d: 0.3 }), 'b3-0.1');

  const adderGroup = S.g();
  const aW = 720, aH = 340;
  const adderCard = S.card({
    x: GX - aW / 2, y: GY - aH / 2 - 20, w: aW, h: aH,
    tone: 'struct', title: ''
  }, adderGroup);
  const adderTitle = S.text('BINARY HALF-ADDER CIRCUIT', {
    x: GX, y: GY - aH / 2 + 15, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  }, adderGroup);
  S.add(fx.in(adderGroup, { from: 'scale', d: 0.5 }), 'b3');

  // 4 mini transistor logic symbols inside the adder
  const miniT = [];
  const coords = [
    { x: GX - 150, y: GY - 50, name: 'T1' },
    { x: GX - 150, y: GY + 30, name: 'T2' },
    { x: GX + 50, y: GY - 50, name: 'T3' },
    { x: GX + 50, y: GY + 30, name: 'T4' },
  ];
  coords.forEach(c => {
    const mg = S.g(null, adderGroup);
    S.rect({ x: c.x - 45, y: c.y - 25, w: 90, h: 50, r: 8, fill: '#14203b', stroke: S.tone('struct'), sw: 2 }, mg);
    S.text(c.name, { x: c.x, y: c.y + 7, size: 22, anchor: 'middle', family: 'mono', color: 'muted', weight: 700 }, mg);
    miniT.push(mg);
  });

  // Connecting wires within adder (stop cleanly at pill bounds)
  const wires = S.g(null, adderGroup);
  S.path({ d: `M${GX - 230},${GY - 50} L${GX - 195},${GY - 50}`, stroke: S.tone('struct'), sw: 3 }, wires);
  S.path({ d: `M${GX - 230},${GY + 30} L${GX - 195},${GY + 30}`, stroke: S.tone('struct'), sw: 3 }, wires);
  S.path({ d: `M${GX - 105},${GY - 50} L${GX + 5},${GY - 50}`, stroke: S.tone('struct'), sw: 2.5 }, wires);
  S.path({ d: `M${GX - 105},${GY + 30} L${GX + 5},${GY + 30}`, stroke: S.tone('struct'), sw: 2.5 }, wires);
  S.path({ d: `M${GX + 95},${GY - 50} L${GX + 185},${GY - 50}`, stroke: S.tone('struct'), sw: 3 }, wires);
  S.path({ d: `M${GX + 95},${GY + 30} L${GX + 185},${GY + 30}`, stroke: S.tone('struct'), sw: 3 }, wires);

  // Input badges: A = 1, B = 1
  const inA = S.pill('A = 1', { x: GX - 275, y: GY - 50, h: 42, tone: 'compute', size: 22, weight: 700 }, adderGroup);
  const inB = S.pill('B = 1', { x: GX - 275, y: GY + 30, h: 42, tone: 'compute', size: 22, weight: 700 }, adderGroup);

  // Output badges: Sum = 0, Carry = 1
  const outSum = S.pill('Sum = 0', { x: GX + 260, y: GY - 50, h: 42, tone: 'violet', size: 22, weight: 700 }, adderGroup);
  const outCarry = S.pill('Carry = 1', { x: GX + 260, y: GY + 30, h: 42, tone: 'helps', size: 22, weight: 700 }, adderGroup);

  const formulaText = S.text('1 + 1 = 10 (binary two)', {
    x: GX, y: GY + 105, size: 24, anchor: 'middle', family: 'mono', weight: 700, color: 'ink'
  }, adderGroup);

  S.set(adderGroup, { autoAlpha: 0 });
  S.add(fx.in(adderGroup, { from: 'scale', d: 0.55 }), 'b3~circuit-0.2');
  S.add(fx.in([inA, inB], { from: 'left', d: 0.4 }), 'b3~binary');
  S.add(fx.pulse(miniT, { scale: 1.08, stagger: 0.08, d: 0.4 }), 'b3~adds');
  S.add(fx.in([outSum, outCarry, formulaText], { from: 'right', d: 0.45 }), 'b3~numbers');

  // ---------------------------------------------------------------- b4: Eighty billion multiplier grid
  S.add(fx.out(adderGroup, { d: 0.4 }), 'b4-0.2');

  // Massive grid of repeating circuits tiling the screen
  const gridHolder = S.g();
  const cols = 28, rows = 14;
  const cw = 56, ch = 34, gap = 8;
  const gw = cols * (cw + gap) - gap, gh = rows * (ch + gap) - gap;
  const gx0 = GX - gw / 2, gy0 = GY - gh / 2 + 10;
  const chipCells = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = S.rect({
        x: gx0 + c * (cw + gap), y: gy0 + r * (ch + gap),
        w: cw, h: ch, r: 3,
        fill: '#0f1c38', stroke: S.tone('struct'), sw: 1, strokeOpacity: 0.6
      }, gridHolder);
      cell.setAttribute('data-audit', 'ignore');
      chipCells.push(cell);
    }
  }

  // Die frame encasing the 80B grid
  const dieFrame = S.rect({
    x: GX - gw / 2 - 20, y: GY - gh / 2 - 10,
    w: gw + 40, h: gh + 40, r: 14,
    fill: 'none', stroke: S.tone('compute'), sw: 3
  }, gridHolder);
  dieFrame.setAttribute('data-audit', 'ignore');

  const gpuBanner = S.card({
    x: GX - 270, y: GY - 75, w: 540, h: 150,
    tone: 'compute', title: 'COMPLETE GPU PROCESSOR DIE', layout: 'top', size: 22
  }, gridHolder);
  const gpuStat = S.text('80,000,000,000 Transistors', {
    x: GX, y: GY + 30, size: 30, anchor: 'middle', family: 'mono', weight: 700, color: 'compute'
  }, gridHolder);

  S.set([gridHolder, gpuBanner, gpuStat], { autoAlpha: 0 });
  S.add(fx.in(gridHolder, { from: 'scale', d: 0.7 }), 'b4~eighty-0.2');
  S.add(gsap.fromTo(chipCells,
    { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' },
    { autoAlpha: 1, scale: 1, duration: 0.8, stagger: { each: 0.002, from: 'center' }, ease: 'power2.out' }
  ), 'b4~eighty-0.1');

  S.add(fx.in([gpuBanner, gpuStat], { from: 'fade', d: 0.5 }), 'b4~modern');

  // Takeaway pill
  const takeaway = S.pill('transistor: the single building block of all logic', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
