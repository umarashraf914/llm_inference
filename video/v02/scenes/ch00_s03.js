/* ch00_s03 · what is inside the package (cold open)
   Movement 1 (b1): Push into package: 132 identical Streaming Multiprocessors (SMs).
   Movement 2 (b2): Memory ladder: 1 tick in registers vs 479 ticks in HBM3.
   Movement 3 (b3): 64 warps hiding latency & thread divergence branch.
   Movement 4 (b4): The memory wall barrier.
   Movement 5 (b5): Grand title: Inside the GPU. */

V.scene('ch00_s03', S => {
  const { fx } = S;
  const GX = 960, GY = 500;

  // Scene heading (fades out in b5 for grand title)
  const heading = S.heading('Inside the package', { y: 130 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // ---------------------------------------------------------------- Movement 1 (b1): 132 SM Grid
  const m1 = S.g();
  const die = ch00Die(S, { cx: GX, cy: GY - 20, size: 280, parent: m1 });
  const smHighlight = S.rect({
    x: die.cx - die.half + 12 + 5 * (256 / 12) + 1,
    y: die.cy - die.half + 12 + 4 * (256 / 11) + 1,
    w: 256 / 12 - 2, h: 256 / 11 - 2, r: 2,
    fill: S.tone('helps'), stroke: S.tone('helps'), sw: 2,
    filter: 'url(#glow-helps)'
  }, m1);
  const smCallout = S.callout('1 of 132 SMs', {
    x: die.cx + 220, y: die.cy - 60,
    from: [die.cx + die.half - 60, die.cy - 30],
    tone: 'helps', anchor: 'start', size: 22
  });
  m1.appendChild(smCallout);

  // ---------------------------------------------------------------- Movement 2 (b2): Memory Ladder
  const ladderGroup = S.g();
  const ladder = ch00MemoryLadder(S, { cx: GX, cy: GY, w: 980, parent: ladderGroup });

  // ---------------------------------------------------------------- Movement 3 (b3): 64 Warps & Divergence
  const m3Group = S.g();
  // Left: 4 Schedulers with warp status
  const schedBox = S.card({
    x: 260, y: GY - 170, w: 660, h: 340, tone: 'struct', title: ''
  }, m3Group);
  const schedTitle = S.text('64 warps per multiprocessor', {
    x: 590, y: GY - 125, size: 24, anchor: 'middle', color: 'struct', weight: 650
  }, m3Group);
  const schedSub = S.text('instant warp swapping hides memory stalls', {
    x: 590, y: GY - 88, size: 20, anchor: 'middle', color: 'muted', weight: 550
  }, m3Group);

  const warpRows = [];
  for (let i = 0; i < 4; i++) {
    const wy = GY - 40 + i * 50;
    const sName = S.text(`scheduler ${i + 1}`, {
      x: 300, y: wy + 6, size: 20, color: 'muted', weight: 600, family: 'mono'
    }, m3Group);

    const pActive = S.pill('active warp', {
      x: 580, y: wy, h: 42, tone: 'compute', size: 20, weight: 650
    });
    m3Group.appendChild(pActive);

    const pReady = S.pill('15 ready warps', {
      x: 770, y: wy, h: 42, tone: 'struct', size: 20, weight: 600
    });
    m3Group.appendChild(pReady);

    warpRows.push({ sName, pActive, pReady });
  }

  // Right: Branch divergence schematic
  const divBox = S.card({
    x: 960, y: GY - 170, w: 660, h: 340, tone: 'neutral', title: ''
  }, m3Group);
  const divTitle = S.text('branch divergence', {
    x: 1290, y: GY - 125, size: 24, anchor: 'middle', color: 'ink', weight: 650
  }, m3Group);
  const divSub = S.text('a single wrong turn cuts throughput in half', {
    x: 1290, y: GY - 88, size: 20, anchor: 'middle', color: 'muted', weight: 550
  }, m3Group);

  const pathA = S.pill('path a: 16 threads active (50%)', {
    x: 1290, y: GY - 15, h: 44, tone: 'compute', size: 20, weight: 650
  });
  m3Group.appendChild(pathA);

  const pathB = S.pill('path b: 16 threads stalled (50% idle)', {
    x: 1290, y: GY + 55, h: 44, tone: 'neutral', size: 20, weight: 600
  });
  m3Group.appendChild(pathB);

  // ---------------------------------------------------------------- Movement 4 (b4): The Memory Wall
  const m4Group = S.g();
  const pkg = ch00Package(S, { cx: GX, cy: GY - 20, scale: 1.1, parent: m4Group });
  const wallPill = S.pill('the memory wall', {
    x: GX, y: GY + 240, h: 46, tone: 'bytes', size: 24, weight: 700
  });
  m4Group.appendChild(wallPill);

  // ---------------------------------------------------------------- Movement 5 (b5): Grand Title
  const titleGroup = S.g();
  const mainTitle = S.text('Inside the GPU', {
    x: GX, y: GY - 30, size: 76, anchor: 'middle', family: 'display', weight: 700, color: 'ink'
  }, titleGroup);
  const subTitle = S.text('the architecture of high-throughput inference', {
    x: GX, y: GY + 52, size: 28, anchor: 'middle', color: 'helps', weight: 550
  }, titleGroup);

  const takeaway = S.takeaway('the architecture of high-throughput inference', {
    tone: 'helps'
  });

  // Initial hidden states
  S.set([m1, smHighlight, smCallout, ladderGroup, m3Group, m4Group, titleGroup, takeaway], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 132 SM Grid
  S.add(fx.in(m1, { from: 'fade', d: 0.6 }), 'b1~package-0.2');
  S.add(fx.in([smHighlight, smCallout], { from: 'fade', d: 0.4 }), 'b1~clock-0.2');

  // ---------------------------------------------------------------- b2: Memory Ladder
  S.add(fx.out(m1, { d: 0.3 }), 'b2-0.2');
  S.add(fx.in(ladderGroup, { from: 'fade', d: 0.5 }), 'b2~fetching-0.2');
  S.add(fx.pulse(ladder.rows[0].bar, { scale: 1.08, d: 0.4 }), 'b2~one');
  S.add(fx.pulse(ladder.rows[3].bar, { scale: 1.05, d: 0.4 }), 'b2~hundred');

  // ---------------------------------------------------------------- b3: 64 Warps & Divergence
  S.add(fx.out(ladderGroup, { d: 0.3 }), 'b3-0.2');
  S.add(fx.in(m3Group, { from: 'fade', d: 0.5 }), 'b3~sixty-four-0.2');
  S.add(fx.pulse(pathB, { scale: 1.06, d: 0.4 }), 'b3~throughput');

  // ---------------------------------------------------------------- b4: The Memory Wall
  S.add(fx.out(m3Group, { d: 0.3 }), 'b4-0.2');
  S.add(fx.in(m4Group, { from: 'fade', d: 0.5 }), 'b4~machine-0.2');
  S.add(fx.pulse(wallPill, { scale: 1.1, d: 0.5 }), 'b4~wall');

  // ---------------------------------------------------------------- b5: Grand Title
  // Completely clear m4Group and heading before title enters
  S.add(fx.out([heading.titleEl, m4Group], { d: 0.3 }), 'b5-0.35');
  S.add(fx.in(titleGroup, { from: 'fade', d: 0.6 }), 'b5');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
