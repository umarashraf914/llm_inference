/* ch01_s01 · inside the package (fig 1)
   Movement 1 (b1): Outer package draws on, revealing central compute die flanked by HBM3 memory stacks.
   Movement 2 (b2-b3): Physical dimensions (29 mm × 29 mm = 814 mm²), 80 billion switches, and density (100M/mm²).
   Movement 3 (b4-b5): Photolithography exposure wave and the 132-multiprocessor silicon budget breakdown. */

V.scene('ch01_s01', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Scene Title
  const heading = S.heading('Inside the package', { y: 130 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // The complete physical package builder
  const pkg = ch01Package(S, { cx: GX, cy: GY, ph: 640 });

  // ---------------------------------------------------------------- b1: Physical package & memory stacks
  S.set([pkg.base, pkg.interposer, pkg.die, ...pkg.stacks.map(s => s.g), ...pkg.screws], { autoAlpha: 0 });

  S.add(fx.in(pkg.base, { from: 'fade', d: 0.6 }), 'b1');
  S.add(fx.in(pkg.screws, { from: 'fade', stagger: 0.08, d: 0.4 }), 'b1+0.2');
  S.add(fx.in(pkg.interposer, { from: 'fade', d: 0.5 }), 'b1~silicon-0.2');
  S.add(fx.in(pkg.die, { from: 'fade', d: 0.65 }), 'b1~square-0.1');

  pkg.stacks.forEach((st, idx) => {
    const fromDir = st.cx < GX ? 'left' : 'right';
    S.add(fx.in(st.g, { from: fromDir, d: 0.5 }), `b1~memory+${idx * 0.1}`);
  });

  // ---------------------------------------------------------------- b2: Dimensions (29 mm × 29 mm, 814 mm², 80B transistors)
  const dimGroup = S.g();
  const dW = pkg.dieSize;

  // Dimension bracket (29 mm × 29 mm)
  const topBracket = S.bracket({
    x1: GX - dW / 2, x2: GX + dW / 2, y: GY - dW / 2 - 16,
    label: '29 mm × 29 mm', up: true
  }, dimGroup);

  // Area badge bottom-right of the die
  const areaBadge = S.pill('814 mm²', {
    x: GX + dW / 2 - 76, y: GY - dW / 2 + 36, h: 40, tone: 'compute', size: 22, weight: 650, mono: true
  }, dimGroup);

  // Transistor count stat display on top-right
  const statGroup = S.g(null, S.hud);
  const statCard = S.card({
    x: 1420, y: 150, w: 420, h: 140, tone: 'compute', title: ''
  }, statGroup);
  const counterTitle = S.text('transistor count', {
    x: 1630, y: 185, size: 22, anchor: 'middle', color: 'compute', weight: 650
  }, statGroup);
  const counterVal = S.counter({
    x: 1630, y: 232, size: 40, value: 0, anchor: 'middle',
    color: 'compute', family: 'mono', weight: 700
  }, statGroup);
  const counterSub = S.text('80 billion switches', {
    x: 1630, y: 268, size: 20, anchor: 'middle', color: 'muted', weight: 550
  }, statGroup);

  S.set([topBracket, areaBadge, statGroup], { autoAlpha: 0 });
  S.add(fx.in(topBracket, { from: 'fade', d: 0.4 }), 'b2~twenty-nine-0.2');
  S.add(fx.in(areaBadge, { from: 'fade', d: 0.4 }), 'b2~side+0.1');
  S.add(fx.in(statGroup, { from: 'right', d: 0.45 }), 'b2~eighty-0.2');
  S.add(fx.count(counterVal, 0, 80, { d: 2.2, ease: 'power2.out', fmt: v => Math.round(v) + ' billion' }), 'b2~eighty-0.1');

  // ---------------------------------------------------------------- b3: 1 mm² density inset
  const mSize = dW / 29; // exact pixel size of 1 mm
  const markerX = GX + 40, markerY = GY + 40;
  const marker = S.rect({
    x: markerX, y: markerY, w: mSize, h: mSize,
    fill: S.tone('helps'), stroke: S.tone('helps'), sw: 2
  });

  const callout = S.card({
    x: 80, y: 720, w: 460, h: 160, tone: 'helps', title: ''
  });
  const calloutTitle = S.text('density: 1 mm² slice', { x: 310, y: 755, size: 22, anchor: 'middle', color: 'helps', weight: 650 });
  const densityNumber = S.text('≈ 100 million', { x: 310, y: 805, size: 36, anchor: 'middle', weight: 700, family: 'mono', color: 'helps' });
  const densitySub = S.text('switches per square millimetre', { x: 310, y: 850, size: 20, anchor: 'middle', weight: 550, color: 'ink' });

  // Connective leader line from marker to callout
  const leader = S.line({
    x1: markerX, y1: markerY + mSize, x2: 310, y2: 720,
    stroke: S.tone('helps'), sw: 2, dash: '4 4'
  });

  S.set([marker, callout, calloutTitle, densityNumber, densitySub, leader], { autoAlpha: 0 });
  S.add(fx.in(marker, { from: 'fade', d: 0.4 }), 'b3~hundred-0.2');
  S.add(fx.draw(leader, { d: 0.4 }), 'b3~hundred');
  S.add(fx.in([callout, calloutTitle, densityNumber, densitySub], { from: 'left', d: 0.5 }), 'b3~million');
  S.add(fx.pulse(marker, { scale: 1.8, d: 0.6 }), 'b3~switches');

  // ---------------------------------------------------------------- b4: Photolithography UV exposure sweep
  const uvBar = S.rect({
    x: GX - dW / 2 - 30, y: GY - dW / 2 - 20, w: 30, h: dW + 40, r: 4,
    fill: '#b48cff', opacity: 0.8, filter: 'url(#glow-violet)'
  });
  uvBar.setAttribute('data-audit', 'ignore');
  S.set(uvBar, { autoAlpha: 0 });

  S.add(gsap.set(uvBar, { autoAlpha: 0.9 }), 'b4~printed-0.2');
  S.add(gsap.fromTo(uvBar,
    { attr: { x: GX - dW / 2 - 40 } },
    { attr: { x: GX + dW / 2 + 10 }, duration: 1.4, ease: 'power2.inOut' }
  ), 'b4~printed-0.1');
  S.add(gsap.to(uvBar, { autoAlpha: 0, duration: 0.3 }), 'b4~photograph');

  S.add(gsap.fromTo(pkg.gridLines, { strokeOpacity: 0.18 }, { strokeOpacity: 0.7, duration: 0.4, yoyo: true, repeat: 1 }), 'b4~printed+0.6');

  // ---------------------------------------------------------------- b5: Silicon budget & 132 SM breakdown
  S.add(fx.out([dimGroup, callout, calloutTitle, densityNumber, densitySub, leader, marker, statGroup, pkg.stacksGroup], { d: 0.4 }), 'b5-0.2');
  S.add(fx.out([pkg.dieLabel, pkg.dieSub], { d: 0.3 }), 'b5');
  S.add(gsap.to(pkg.smGrid, { opacity: 1, duration: 0.6, ease: 'power1.out' }), 'b5~silicon');
  S.add(gsap.fromTo(pkg.smCells,
    { scale: 0.5, transformOrigin: '50% 50%' },
    { scale: 1, duration: 0.5, stagger: { each: 0.005, grid: [11, 12], from: 'center' }, ease: 'back.out(1.5)' }
  ), 'b5~multiprocessor-0.1');

  // Budget label overlay
  const budgetTitle = S.text('132 multiprocessors', {
    x: GX, y: GY - dW / 2 - 24, size: 24, anchor: 'middle', weight: 700, family: 'mono', color: 'compute'
  });
  const budgetSub = S.text('every SM, cache, and bus wire shares this surface', {
    x: GX, y: GY + dW / 2 + 38, size: 22, anchor: 'middle', weight: 550, color: 'ink'
  });
  S.set([budgetTitle, budgetSub], { autoAlpha: 0 });
  S.add(fx.in(budgetTitle, { from: 'up', d: 0.4 }), 'b5~multiprocessor');
  S.add(fx.in(budgetSub, { from: 'down', d: 0.4 }), 'b5~cache');

  // Concluding Takeaway
  const takeaway = S.takeaway('silicon budget: how area on this square is spent', {
    tone: 'compute'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
