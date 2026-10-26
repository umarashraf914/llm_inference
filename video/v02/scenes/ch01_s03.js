/* ch01_s03 · instructions, cycles and threads (fig 3)
   Movement 1 (b1): Three foundational pillars established: Instruction, Clock cycle, Thread.
   Movement 2 (b2): Instruction panel populated with assembly operations: ADD, FETCH, JUMP.
   Movement 3 (b3-b4): Clock cycle panel pulsates with 1.83 GHz waveform and 0.55 ns duration bracket.
   Movement 4 (b5): Thread panel animates instruction sequence and expands to parallel lockstep lanes. */

V.scene('ch01_s03', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('Instructions, cycles and threads', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Three structural panels side by side
  const panelW = 490, panelH = 580;
  const colCenters = [360, 960, 1560];

  // Panel 1: Instruction
  const p1 = S.card({
    x: colCenters[0] - panelW / 2, y: GY - panelH / 2, w: panelW, h: panelH,
    tone: 'struct', title: ''
  });
  const p1Title = S.text('1 · INSTRUCTION', {
    x: colCenters[0], y: GY - panelH / 2 + 40, size: 26, anchor: 'middle', weight: 700, color: 'struct'
  });
  const p1Sub = S.text('What the silicon is told to do', {
    x: colCenters[0], y: GY - panelH / 2 + 78, size: 22, anchor: 'middle', color: 'muted', weight: 600
  });

  // Panel 2: Clock cycle
  const p2 = S.card({
    x: colCenters[1] - panelW / 2, y: GY - panelH / 2, w: panelW, h: panelH,
    tone: 'compute', title: ''
  });
  const p2Title = S.text('2 · CLOCK CYCLE', {
    x: colCenters[1], y: GY - panelH / 2 + 40, size: 26, anchor: 'middle', weight: 700, color: 'compute'
  });
  const p2Sub = S.text('The fundamental unit of time', {
    x: colCenters[1], y: GY - panelH / 2 + 78, size: 22, anchor: 'middle', color: 'muted', weight: 600
  });

  // Panel 3: Thread
  const p3 = S.card({
    x: colCenters[2] - panelW / 2, y: GY - panelH / 2, w: panelW, h: panelH,
    tone: 'helps', title: ''
  });
  const p3Title = S.text('3 · THREAD', {
    x: colCenters[2], y: GY - panelH / 2 + 40, size: 26, anchor: 'middle', weight: 700, color: 'helps'
  });
  const p3Sub = S.text('A sequence of commands in flight', {
    x: colCenters[2], y: GY - panelH / 2 + 78, size: 22, anchor: 'middle', color: 'muted', weight: 600
  });

  S.set([p1, p1Title, p1Sub, p2, p2Title, p2Sub, p3, p3Title, p3Sub], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Three cards appear
  S.add(fx.in([p1, p1Title, p1Sub], { from: 'left', d: 0.5 }), 'b1~three-0.1');
  S.add(fx.in([p2, p2Title, p2Sub], { from: 'up', d: 0.5 }), 'b1~cycle-0.2');
  S.add(fx.in([p3, p3Title, p3Sub], { from: 'right', d: 0.5 }), 'b1~thread-0.2');

  // ---------------------------------------------------------------- b2: Inside Panel 1 (Instruction examples)
  const cmds = [
    { op: 'ADD', args: 'R1, R2, R3', desc: 'add two registers', tone: 'compute' },
    { op: 'FETCH', args: '[0x4F00]', desc: 'load value from memory', tone: 'bytes' },
    { op: 'JUMP', args: 'label_loop', desc: 'branch to address', tone: 'violet' },
  ];
  const cmdCards = cmds.map((cmd, idx) => {
    const cg = S.g();
    const y0 = GY - 80 + idx * 125;
    const cardBg = S.rect({
      x: colCenters[0] - 200, y: y0, w: 400, h: 96, r: 12,
      fill: '#121a30', stroke: S.tone(cmd.tone), sw: 2, strokeOpacity: 0.8
    }, cg);
    const opText = S.text(cmd.op, {
      x: colCenters[0] - 175, y: y0 + 38, size: 24, family: 'mono', weight: 700, color: cmd.tone
    }, cg);
    const argsText = S.text(cmd.args, {
      x: colCenters[0] - 70, y: y0 + 38, size: 22, family: 'mono', weight: 600, color: 'ink'
    }, cg);
    const descText = S.text(cmd.desc, {
      x: colCenters[0] - 175, y: y0 + 72, size: 22, color: 'muted', weight: 550
    }, cg);
    return cg;
  });

  S.set(cmdCards, { autoAlpha: 0 });
  S.add(fx.in(cmdCards[0], { from: 'left', d: 0.4 }), 'b2~add');
  S.add(fx.in(cmdCards[1], { from: 'left', d: 0.4 }), 'b2~fetch');
  S.add(fx.in(cmdCards[2], { from: 'left', d: 0.4 }), 'b2~jump');

  // ---------------------------------------------------------------- b3: Inside Panel 2 (Clock frequency & waveform)
  const waveGroup = S.g();
  const waveY = GY;

  // Sine/square clock wave path
  const wavePath = S.path({
    d: `M${colCenters[1] - 200},${waveY} ` +
       `h40 v-50 h40 v100 h40 v-100 h40 v100 h40 v-100 h40 v100 h40 v-100 h40 v100 h40 v-50 h40`,
    stroke: S.tone('compute'), sw: 3, fill: 'none'
  }, waveGroup);

  const freqBadge = S.pill('1.83 GHz', {
    x: colCenters[1], y: GY + 115, h: 44, tone: 'compute', size: 24, weight: 700
  }, waveGroup);
  const freqSub = S.text('1,830,000,000 ticks a second', {
    x: colCenters[1], y: GY + 165, size: 22, anchor: 'middle', weight: 600, family: 'sans', color: 'ink'
  }, waveGroup);

  S.set([wavePath, freqBadge, freqSub], { autoAlpha: 0 });
  S.add(fx.draw(wavePath, { d: 0.8 }), 'b3~tick');
  S.add(fx.in(freqBadge, { from: 'scale', d: 0.4 }), 'b3~billion');
  S.add(fx.in(freqSub, { from: 'fade', d: 0.4 }), 'b3~second');

  // ---------------------------------------------------------------- b4: Duration bracket (0.55 nanoseconds)
  const bracketGroup = S.g();
  const bY = waveY - 70;
  // Bracket measuring one period (80px wide)
  const bX1 = colCenters[1] - 40, bX2 = colCenters[1] + 40;
  S.line({ x1: bX1, y1: bY - 6, x2: bX1, y2: bY + 6, stroke: S.tone('compute'), sw: 2 }, bracketGroup);
  S.line({ x1: bX2, y1: bY - 6, x2: bX2, y2: bY + 6, stroke: S.tone('compute'), sw: 2 }, bracketGroup);
  S.line({ x1: bX1, y1: bY, x2: bX2, y2: bY, stroke: S.tone('compute'), sw: 2 }, bracketGroup);

  const durText = S.text('0.55 ns', {
    x: colCenters[1], y: bY - 16, size: 22, anchor: 'middle', family: 'mono', weight: 700, color: 'compute'
  }, bracketGroup);
  const durSub = S.pill('half a nanosecond', {
    x: colCenters[1], y: GY + 215, h: 36, tone: 'neutral', size: 22, weight: 600
  }, bracketGroup);

  S.set(bracketGroup, { autoAlpha: 0 });
  S.add(fx.in(bracketGroup, { from: 'down', d: 0.4 }), 'b4~nanosecond-0.2');

  // ---------------------------------------------------------------- b5: Inside Panel 3 (Thread lanes & parallel lockstep)
  const threadGroup = S.g();
  const threadX = colCenters[2] - 120;

  // Single primary thread lane on left
  const mainLane = S.g(null, threadGroup);
  const trackLine = S.line({
    x1: threadX, y1: GY - 130, x2: threadX, y2: GY + 170,
    stroke: S.tone('helps'), sw: 3, dash: '6 4'
  }, mainLane);
  const threadTag = S.text('Thread 0', {
    x: threadX, y: GY - 145, size: 22, anchor: 'middle', family: 'mono', weight: 700, color: 'helps'
  }, mainLane);

  // Sequence of instruction blocks stepping down the lane
  const instBlocks = [0, 1, 2, 3].map(i => {
    return S.rect({
      x: threadX - 32, y: GY - 110 + i * 70, w: 64, h: 48, r: 6,
      fill: '#152b3c', stroke: S.tone('helps'), sw: 2
    }, mainLane);
  });

  // Parallel lockstep lanes appearing on the right
  const parallelLanes = S.g(null, threadGroup);
  const pCount = 5;
  for (let p = 1; p <= pCount; p++) {
    const px = threadX + p * 48;
    S.line({
      x1: px, y1: GY - 130, x2: px, y2: GY + 170,
      stroke: S.tone('helps'), sw: 1.5, strokeOpacity: 0.4, dash: '4 4'
    }, parallelLanes);
    for (let i = 0; i < 4; i++) {
      const b = S.rect({
        x: px - 18, y: GY - 110 + i * 70, w: 36, h: 48, r: 4,
        fill: '#152b3c', stroke: S.tone('helps'), sw: 1, strokeOpacity: 0.6
      }, parallelLanes);
      b.setAttribute('data-audit', 'ignore');
    }
  }

  const parallelTag = S.text('thousands of parallel threads', {
    x: colCenters[2] + 40, y: GY + 215, size: 22, anchor: 'middle', weight: 600, color: 'helps'
  }, parallelLanes);

  S.set([mainLane, parallelLanes], { autoAlpha: 0 });
  S.add(fx.in(mainLane, { from: 'down', d: 0.5 }), 'b5~sequence-0.2');
  S.add(gsap.fromTo(instBlocks,
    { scale: 0.7, autoAlpha: 0 },
    { scale: 1, autoAlpha: 1, stagger: 0.1, duration: 0.4, ease: 'back.out(2)' }
  ), 'b5~executed');

  S.add(fx.in(parallelLanes, { from: 'right', d: 0.5 }), 'b5~many threads-0.1');

  // Concluding Takeaway pill
  const takeaway = S.pill('at this scale, time is counted in ticks, not seconds', {
    x: GX, y: 990, h: 48, tone: 'compute', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
