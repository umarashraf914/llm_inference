/* ch02_s01 · two numbers and the words around them (figs 4, 5)
   Movement 1 (b1-b2): Two specification numbers: Arithmetic Rate (amber) and Memory Bandwidth (coral).
   Movement 2 (b3-b4): Count versus Rate. Flop vs Flop/s. Unit cancellation equation: 140B ops / 989.4T ops/s = 0.14 ms.
   Movement 3 (b5): Latency (courier round-trip) vs Bandwidth (multi-lane volume). */

V.scene('ch02_s01', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Scene heading
  const heading = S.heading('Two numbers on the spec sheet', { y: 130 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // ---------------------------------------------------------------- b1: Two large specification cards
  const cardW = 540, cardH = 340;
  const c1X = GX - 290, c2X = GX + 290;

  // Left card: Arithmetic Rate (amber)
  const rateCard = S.card({
    x: c1X - cardW / 2, y: GY - cardH / 2 - 20, w: cardW, h: cardH,
    tone: 'compute', title: ''
  });
  const rateTitle = S.text('arithmetic rate', { x: c1X, y: GY - 140, size: 24, anchor: 'middle', color: 'compute', weight: 650 });
  const rateNumber = S.text('989.4 trillion', { x: c1X, y: GY - 70, size: 42, anchor: 'middle', family: 'mono', color: 'compute', weight: 700 });
  const rateUnit = S.text('FLOP/s (operations per second)', { x: c1X, y: GY - 15, size: 22, anchor: 'middle', color: 'ink', weight: 600 });
  const rateSub = S.pill('16-bit dense tensor compute', { x: c1X, y: GY + 55, h: 40, tone: 'compute', size: 22, weight: 600 });

  // Right card: Memory Bandwidth (coral)
  const bwCard = S.card({
    x: c2X - cardW / 2, y: GY - cardH / 2 - 20, w: cardW, h: cardH,
    tone: 'bytes', title: ''
  });
  const bwTitle = S.text('memory bandwidth', { x: c2X, y: GY - 140, size: 24, anchor: 'middle', color: 'bytes', weight: 650 });
  const bwNumber = S.text('3,352 GB/s', { x: c2X, y: GY - 70, size: 42, anchor: 'middle', family: 'mono', color: 'bytes', weight: 700 });
  const bwUnit = S.text('bytes arriving per second', { x: c2X, y: GY - 15, size: 22, anchor: 'middle', color: 'ink', weight: 600 });
  const bwSub = S.pill('3.35 TB/s across 5,120 wires', { x: c2X, y: GY + 55, h: 40, tone: 'bytes', size: 22, weight: 600 });

  const twoCards = [rateCard, rateTitle, rateNumber, rateUnit, rateSub, bwCard, bwTitle, bwNumber, bwUnit, bwSub];

  // ---------------------------------------------------------------- b2: Distinction banners (Count vs Rate, Latency vs Bandwidth)
  const diffBar = S.g();
  const b1Pill = S.pill('count vs rate', { x: c1X, y: GY + 200, h: 44, tone: 'compute', size: 22, weight: 650 }, diffBar);
  const b2Pill = S.pill('latency vs bandwidth', { x: c2X, y: GY + 200, h: 44, tone: 'bytes', size: 22, weight: 650 }, diffBar);

  // ---------------------------------------------------------------- b3: Count (FLOP) versus Rate (FLOP/s)
  const countRateGroup = S.g();
  const crW = 560, crH = 260;

  // Discrete FLOP panel (left)
  const flopCard = S.card({
    x: c1X - crW / 2, y: GY - crH / 2 - 40, w: crW, h: crH,
    tone: 'struct', title: ''
  }, countRateGroup);
  const flopTitle = S.text('1 FLOP = one operation', { x: c1X, y: GY - 125, size: 24, anchor: 'middle', color: 'struct', weight: 650 }, countRateGroup);
  const flopCoin = S.pill('count: a single addition or multiply', { x: c1X, y: GY - 65, h: 44, tone: 'struct', size: 22, weight: 600 }, countRateGroup);
  const flopDesc = S.text('a static count with no time in it', { x: c1X, y: GY - 10, size: 22, anchor: 'middle', color: 'muted', weight: 550 }, countRateGroup);

  // Rate FLOP/s panel (right)
  const rateMeterCard = S.card({
    x: c2X - crW / 2, y: GY - crH / 2 - 40, w: crW, h: crH,
    tone: 'compute', title: ''
  }, countRateGroup);
  const meterTitle = S.text('FLOP/s = rate', { x: c2X, y: GY - 125, size: 24, anchor: 'middle', color: 'compute', weight: 650 }, countRateGroup);
  const meterVal = S.pill('rate: operations per second', { x: c2X, y: GY - 65, h: 44, tone: 'compute', size: 22, weight: 600 }, countRateGroup);
  const meterDesc = S.text('how many operations finish each second', { x: c2X, y: GY - 10, size: 22, anchor: 'middle', color: 'muted', weight: 550 }, countRateGroup);

  // ---------------------------------------------------------------- b4: Unit cancellation formula
  const eqGroup = S.g();
  const eqY = GY + 180;
  const eqCard = S.card({
    x: GX - 480, y: eqY - 60, w: 960, h: 120,
    tone: 'compute', title: ''
  }, eqGroup);

  const formula = S.text('140 billion ops  ÷  989.4 trillion ops/s  =  0.14 ms', {
    x: GX, y: eqY - 12, size: 26, anchor: 'middle', family: 'mono', color: 'compute', weight: 700
  }, eqGroup);
  const unitNote = S.text('operations cancel cleanly: count ÷ (count / second) = seconds', {
    x: GX, y: eqY + 28, size: 22, anchor: 'middle', color: 'ink', weight: 550
  }, eqGroup);

  // ---------------------------------------------------------------- b5: Latency vs Bandwidth
  const pipeGroup = S.g();
  const pW = 540, pH = 360;

  // Latency card (left)
  const latCard = S.card({
    x: c1X - pW / 2, y: GY - pH / 2 - 20, w: pW, h: pH,
    tone: 'violet', title: ''
  }, pipeGroup);
  const latTitle = S.text('latency (response time)', { x: c1X, y: GY - 145, size: 24, anchor: 'middle', color: 'violet', weight: 650 }, pipeGroup);
  const latDef = S.pill('how long one request takes', { x: c1X, y: GY - 85, h: 44, tone: 'violet', size: 22, weight: 600 }, pipeGroup);
  S.line({ x1: c1X - 200, y1: GY + 10, x2: c1X + 200, y2: GY + 10, stroke: S.tone('violet'), sw: 3, dash: '8 6' }, pipeGroup);
  const courier = S.circle({ x: c1X - 160, y: GY + 10, r: 12, fill: S.tone('violet') }, pipeGroup);
  courier.setAttribute('data-audit', 'ignore');
  const latSub = S.text('measured in nanoseconds or milliseconds', { x: c1X, y: GY + 85, size: 22, anchor: 'middle', color: 'muted', weight: 550 }, pipeGroup);

  // Bandwidth card (right)
  const bwDefCard = S.card({
    x: c2X - pW / 2, y: GY - pH / 2 - 20, w: pW, h: pH,
    tone: 'bytes', title: ''
  }, pipeGroup);
  const bwDefTitle = S.text('bandwidth (volume rate)', { x: c2X, y: GY - 145, size: 24, anchor: 'middle', color: 'bytes', weight: 650 }, pipeGroup);
  const bwDefPill = S.pill('how many bytes arrive per second', { x: c2X, y: GY - 85, h: 44, tone: 'bytes', size: 22, weight: 600 }, pipeGroup);
  for (let l = -2; l <= 2; l++) {
    const pl = S.line({ x1: c2X - 200, y1: GY + 10 + l * 14, x2: c2X + 200, y2: GY + 10 + l * 14, stroke: S.tone('bytes'), sw: 4 }, pipeGroup);
    pl.setAttribute('data-audit', 'ignore');
  }
  const bwSubText = S.text('measured in gigabytes per second', { x: c2X, y: GY + 85, size: 22, anchor: 'middle', color: 'muted', weight: 550 }, pipeGroup);

  // Concluding Takeaway
  const takeaway = S.takeaway('count is work, rate is speed; latency is wait, bandwidth is volume', {
    tone: 'compute'
  });

  // Initial hidden states
  S.set([twoCards, diffBar, countRateGroup, eqGroup, pipeGroup, takeaway], { autoAlpha: 0 });

  // Animations
  S.add(fx.in([rateCard, rateTitle, rateNumber, rateUnit, rateSub], { from: 'left', d: 0.55 }), 'b1~Arithmetic-0.2');
  S.add(fx.in([bwCard, bwTitle, bwNumber, bwUnit, bwSub], { from: 'right', d: 0.55 }), 'b1~memory-0.2');

  S.add(fx.in(b1Pill, { from: 'down', d: 0.4 }), 'b2~count-0.1');
  S.add(fx.in(b2Pill, { from: 'down', d: 0.4 }), 'b2~latency-0.1');

  S.add(fx.out([twoCards, diffBar], { d: 0.35 }), 'b3-0.2');
  S.add(fx.in(countRateGroup, { from: 'fade', d: 0.5 }), 'b3~operation-0.2');

  S.add(fx.in(eqGroup, { from: 'fade', d: 0.45 }), 'b4~Divide-0.2');
  S.add(fx.pulse(formula, { scale: 1.05, d: 0.5 }), 'b4~milliseconds');

  S.add(fx.out([countRateGroup, eqGroup], { d: 0.25 }), 'b5-0.3');
  S.add(fx.in(pipeGroup, { from: 'fade', d: 0.4 }), 'b5');
  S.add(gsap.fromTo(courier, { x: c1X - 160 }, { x: c1X + 160, duration: 1.2, repeat: 1, yoyo: true, ease: 'sine.inOut' }), 'b5~return');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
