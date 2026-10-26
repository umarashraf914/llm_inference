/* ch01_s01 · inside the package (fig 1)
   Movement 1 (b1): Outer package draws on, revealing central compute die flanked by HBM3 memory stacks.
   Movement 2 (b2-b3): Physical dimensions (29 mm × 29 mm = 814 mm²), 80 billion switches, and density (100M/mm²).
   Movement 3 (b4-b5): Photolithography exposure wave and the 132-multiprocessor silicon budget breakdown. */

V.scene('ch01_s01', S => {
  const { fx } = S;
  const GX = 960, GY = 530;

  // Scene Title
  const heading = S.heading('Inside the package', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // The complete physical package builder from ch01_common.js
  const pkg = ch01Package(S, { cx: GX, cy: GY, ph: 640 });

  // ---------------------------------------------------------------- b1: The physical package & memory stacks
  S.set([pkg.base, pkg.interposer, pkg.die, ...pkg.stacks.map(s => s.g), ...pkg.screws], { autoAlpha: 0 });

  // Animate package base and mounting fixtures
  S.add(fx.in(pkg.base, { from: 'scale', d: 0.6 }), 'b1');
  S.add(fx.in(pkg.screws, { from: 'fade', stagger: 0.08, d: 0.4 }), 'b1+0.2');
  S.add(fx.in(pkg.interposer, { from: 'fade', d: 0.5 }), 'b1~silicon-0.2');

  // Compute die pops into view with amber glow
  S.add(fx.pop(pkg.die, { from: 0.8, d: 0.65 }), 'b1~square-0.1');

  // Memory stacks slide in from the flanks
  pkg.stacks.forEach((st, idx) => {
    const fromDir = st.cx < GX ? 'left' : 'right';
    S.add(fx.in(st.g, { from: fromDir, d: 0.5 }), `b1~memory+${idx * 0.1}`);
  });

  // ---------------------------------------------------------------- b2: Dimensions: 29 mm × 29 mm, 814 mm², 80B transistors
  const dimGroup = S.g();
  const dW = pkg.dieSize;

  // Horizontal dimension bracket (top of the die)
  const topBracketY = GY - dW / 2 - 20;
  const topBracket = S.g(null, dimGroup);
  S.line({ x1: GX - dW / 2, y1: topBracketY + 8, x2: GX - dW / 2, y2: topBracketY - 8, stroke: S.tone('compute'), sw: 2 }, topBracket);
  S.line({ x1: GX + dW / 2, y1: topBracketY + 8, x2: GX + dW / 2, y2: topBracketY - 8, stroke: S.tone('compute'), sw: 2 }, topBracket);
  S.line({ x1: GX - dW / 2, y1: topBracketY, x2: GX + dW / 2, y2: topBracketY, stroke: S.tone('compute'), sw: 2 }, topBracket);
  const topDimText = S.text('29 mm', { x: GX, y: topBracketY - 18, size: 24, anchor: 'middle', weight: 700, family: 'mono', color: 'compute' }, topBracket);

  // Vertical dimension bracket (bottom of the die - clear of memory stacks)
  const btmBracketY = GY + dW / 2 + 20;
  const btmBracket = S.g(null, dimGroup);
  S.line({ x1: GX - dW / 2, y1: btmBracketY - 8, x2: GX - dW / 2, y2: btmBracketY + 8, stroke: S.tone('compute'), sw: 2 }, btmBracket);
  S.line({ x1: GX + dW / 2, y1: btmBracketY - 8, x2: GX + dW / 2, y2: btmBracketY + 8, stroke: S.tone('compute'), sw: 2 }, btmBracket);
  S.line({ x1: GX - dW / 2, y1: btmBracketY, x2: GX + dW / 2, y2: btmBracketY, stroke: S.tone('compute'), sw: 2 }, btmBracket);
  const btmDimText = S.text('29 mm', { x: GX, y: btmBracketY + 22, size: 24, anchor: 'middle', weight: 700, family: 'mono', color: 'compute' }, btmBracket);

  // Area badge bottom-right of the die
  const areaBadge = S.pill('814 mm²', { x: GX + dW / 2 - 76, y: GY - dW / 2 + 36, h: 42, tone: 'compute', size: 22, weight: 700 }, dimGroup);

  S.set([topBracket, btmBracket, areaBadge], { autoAlpha: 0 });
  S.add(fx.in(topBracket, { from: 'up', d: 0.4 }), 'b2~twenty-nine-0.2');
  S.add(fx.in(btmBracket, { from: 'down', d: 0.4 }), 'b2~twenty-nine');
  S.add(fx.in(areaBadge, { from: 'fade', d: 0.4 }), 'b2~side+0.1');

  // Large HUD counter for 80 billion transistors
  const counterCard = S.card({
    x: 1420, y: 150, w: 420, h: 145, tone: 'compute',
    title: ''
  }, S.hud);
  const counterTitle = S.text('TRANSISTOR COUNT', { x: 1450, y: 184, size: 22, color: 'compute', weight: 700 }, S.hud);
  const counterVal = S.counter({
    x: 1450, y: 230, size: 40, value: 0, anchor: 'start', color: 'compute', family: 'mono', weight: 700
  }, S.hud);
  const counterSub = S.text('80,000,000,000 switches', { x: 1450, y: 270, size: 22, color: 'muted', weight: 600 }, S.hud);

  S.set([counterCard, counterTitle, counterVal, counterSub], { autoAlpha: 0 });
  S.add(fx.in([counterCard, counterTitle, counterVal, counterSub], { from: 'right', d: 0.45 }), 'b2~eighty-0.2');
  S.add(fx.count(counterVal, 0, 80e9, { d: 2.2, ease: 'power2.out', fmt: v => Math.round(v / 1e9) + ' Billion' }), 'b2~eighty-0.1');

  // ---------------------------------------------------------------- b3: 1 mm² density inset
  const mSize = dW / 29; // exact pixel size of 1 mm
  const markerX = GX + 40, markerY = GY + 40;
  const marker = S.rect({
    x: markerX, y: markerY, w: mSize, h: mSize,
    fill: S.tone('helps'), stroke: S.tone('helps'), sw: 2
  });

  const callout = S.card({
    x: 80, y: 720, w: 460, h: 165, tone: 'helps',
    title: ''
  });
  const calloutTitle = S.text('DENSITY: 1 mm² SLICE', { x: 110, y: 752, size: 22, color: 'helps', weight: 700 });
  const densityNumber = S.text('≈ 100 Million', { x: 110, y: 802, size: 36, weight: 700, family: 'mono', color: 'helps' });
  const densitySub = S.text('switches per square millimetre', { x: 110, y: 848, size: 22, weight: 600, color: 'ink' });

  // Connective leader line from marker to callout
  const leader = S.line({
    x1: markerX, y1: markerY + mSize, x2: 310, y2: 720,
    stroke: S.tone('helps'), sw: 2, dash: '4 4'
  });

  S.set([marker, callout, calloutTitle, densityNumber, densitySub, leader], { autoAlpha: 0 });
  S.add(fx.in(marker, { from: 'scale', d: 0.4 }), 'b3~hundred-0.2');
  S.add(fx.draw(leader, { d: 0.4 }), 'b3~hundred');
  S.add(fx.in([callout, calloutTitle, densityNumber, densitySub], { from: 'left', d: 0.5 }), 'b3~million');
  S.add(fx.pulse(marker, { scale: 2.2, d: 0.6 }), 'b3~switches');

  // ---------------------------------------------------------------- b4: Photolithography UV exposure sweep
  const uvBar = S.rect({
    x: GX - dW / 2 - 30, y: GY - dW / 2 - 20, w: 30, h: dW + 40, r: 4,
    fill: '#b48cff', opacity: 0.8, filter: 'url(#glow-violet)'
  });
  uvBar.setAttribute('data-audit', 'ignore');
  S.set(uvBar, { autoAlpha: 0 });

  S.add(gsap.set(uvBar, { autoAlpha: 0.9 }), 'b4~printed-0.2');
  S.add(gsap.fromTo(uvBar,
    { x: GX - dW / 2 - 40 },
    { x: GX + dW / 2 + 20, duration: 1.4, ease: 'power2.inOut' }
  ), 'b4~printed-0.1');
  S.add(gsap.to(uvBar, { autoAlpha: 0, duration: 0.3 }), 'b4~photograph');

  // Pulse the die texture to simulate newly revealed etched circuits
  S.add(gsap.fromTo(pkg.gridLines, { strokeOpacity: 0.18 }, { strokeOpacity: 0.7, duration: 0.4, yoyo: true, repeat: 1 }), 'b4~printed+0.6');

  // ---------------------------------------------------------------- b5: Silicon budget & 132 SM breakdown
  // Clean up previous callouts & fade out flanking memory stacks to spotlight the die surface
  S.add(fx.out([dimGroup, callout, calloutTitle, densityNumber, densitySub, leader, marker, counterCard, counterTitle, counterVal, counterSub, pkg.stacksGroup], { d: 0.4 }), 'b5-0.2');

  // Die texts dissolve, revealing the full 132 SM sub-grid
  S.add(fx.out([pkg.dieLabel, pkg.dieSub], { d: 0.3 }), 'b5');
  S.add(gsap.to(pkg.smGrid, { opacity: 1, duration: 0.6, ease: 'power1.out' }), 'b5~silicon');
  S.add(gsap.fromTo(pkg.smCells,
    { scale: 0.5, transformOrigin: '50% 50%' },
    { scale: 1, duration: 0.5, stagger: { each: 0.005, grid: [11, 12], from: 'center' }, ease: 'back.out(1.5)' }
  ), 'b5~multiprocessor-0.1');

  // Budget label overlay
  const budgetTitle = S.text('132 MULTIPROCESSORS', {
    x: GX, y: GY - dW / 2 - 24, size: 24, anchor: 'middle', weight: 700, family: 'mono', color: 'compute'
  });
  const budgetSub = S.text('every SM, cache, and bus wire shares this surface', {
    x: GX, y: GY + dW / 2 + 38, size: 22, anchor: 'middle', weight: 550, color: 'ink'
  });
  S.set([budgetTitle, budgetSub], { autoAlpha: 0 });
  S.add(fx.in(budgetTitle, { from: 'up', d: 0.4 }), 'b5~multiprocessor');
  S.add(fx.in(budgetSub, { from: 'down', d: 0.4 }), 'b5~cache');

  // Concluding Takeaway pill
  const takeaway = S.pill('silicon budget: how area on this square is spent', {
    x: GX, y: 990, h: 48, tone: 'compute', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
