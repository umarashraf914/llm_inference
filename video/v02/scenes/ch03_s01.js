/* ch03_s01 · the ratio of two hundred and ninety-five (fig 10)
   Movement 1 (b1): Title card: One decode step on 70B model. Two parallel perspectives: time vs work.
   Movement 2 (b2): Memory time: 140 GB ÷ 3,352 GB/s = 41.8 ms (coral).
   Movement 3 (b3): Arithmetic time: 140B ops ÷ 989.4 TFLOP/s = 0.141 ms (amber).
   Movement 4 (b4): Gap: 41.8 ÷ 0.141 = 295× ratio. Arithmetic active only 0.34% of the time.
   Movement 5 (b5): Work per byte: decode is 1 op/byte; ridge is 295 ops/byte. Identical ratio. */

V.scene('ch03_s01', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('The ratio of two hundred and ninety-five', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Sub-header badge
  const headerCard = S.card({
    x: GX - 480, y: 170, w: 960, h: 72,
    tone: 'neutral', title: ''
  });
  const headerText = S.text('ONE DECODE STEP · 70B MODEL ON H100 · TWO PERSPECTIVES', {
    x: GX, y: 213, size: 22, anchor: 'middle', weight: 700, color: 'ink'
  });

  // Top Container: Time perspective (milliseconds)
  const timeCard = S.card({
    x: GX - 640, y: 260, w: 1280, h: 275,
    tone: 'neutral', title: ''
  });
  const timeTitle = S.text('PERSPECTIVE 1: DURATION IN MILLISECONDS', {
    x: GX - 600, y: 300, size: 22, weight: 700, color: 'ink'
  });

  // Reading weights row
  const memRowY = 350;
  const memLabel = S.text('Reading 140 GB weights', { x: GX - 600, y: memRowY, size: 22, color: 'bytes', weight: 700 });
  const memEq = S.text('140 GB ÷ 3,352 GB/s =', { x: GX - 160, y: memRowY, size: 22, family: 'mono', color: 'muted', weight: 600 });
  const memPill = S.pill('41.8 ms', { x: GX + 260, y: memRowY - 2, h: 42, tone: 'bytes', size: 22, weight: 700 });

  // Arithmetic row
  const compRowY = 415;
  const compLabel = S.text('Computing 140B FLOPs', { x: GX - 600, y: compRowY, size: 22, color: 'compute', weight: 700 });
  const compEq = S.text('140B ops ÷ 989.4 TFLOP/s =', { x: GX - 160, y: compRowY, size: 22, family: 'mono', color: 'muted', weight: 600 });
  const compPill = S.pill('0.141 ms', { x: GX + 260, y: compRowY - 2, h: 42, tone: 'compute', size: 22, weight: 700 });

  // Gap callout badge centered inside time card
  const ratioBadge = S.pill('41.8 ms ÷ 0.141 ms = 295× TIME GAP  (Compute active 0.34% of step)', {
    x: GX, y: 480, h: 44, tone: 'bytes', size: 22, weight: 700
  });

  // Bottom Container: Work intensity perspective (ops per byte)
  const workCard = S.card({
    x: GX - 640, y: 565, w: 1280, h: 275,
    tone: 'neutral', title: ''
  });
  const workTitle = S.text('PERSPECTIVE 2: WORK PER BYTE OF MEMORY', {
    x: GX - 600, y: 605, size: 22, weight: 700, color: 'ink'
  });

  // Decode demand row
  const decY = 665;
  const decLabel = S.text('Decode workload demand:', { x: GX - 600, y: decY, size: 22, color: 'compute', weight: 700 });
  const decVal = S.text('1 operation per byte read', { x: GX - 140, y: decY, size: 24, family: 'mono', color: 'compute', weight: 700 });
  const decPill = S.pill('1 op / byte', { x: GX + 400, y: decY - 2, h: 42, tone: 'compute', size: 22, weight: 700 });

  // Hardware ridge supply row
  const hwY = 750;
  const hwLabel = S.text('H100 hardware capability:', { x: GX - 600, y: hwY, size: 22, color: 'bytes', weight: 700 });
  const hwVal = S.text('989.4 TFLOP/s ÷ 3,352 GB/s =', { x: GX - 140, y: hwY, size: 22, family: 'mono', color: 'muted', weight: 600 });
  const hwPill = S.pill('295 ops / byte (Ridge)', { x: GX + 400, y: hwY - 2, h: 42, tone: 'helps', size: 22, weight: 700 });

  // Initial visibility
  S.set([headerCard, headerText, timeCard, timeTitle, workCard, workTitle], { autoAlpha: 0 });
  S.set([memLabel, memEq, memPill, compLabel, compEq, compPill, ratioBadge], { autoAlpha: 0 });
  S.set([decLabel, decVal, decPill, hwLabel, hwVal, hwPill], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Cards intro
  S.add(fx.in([headerCard, headerText], { from: 'up', d: 0.4 }), 'b1~Take-0.2');
  S.add(fx.in([timeCard, timeTitle, workCard, workTitle], { from: 'scale', d: 0.5, stagger: 0.1 }), 'b1~count');

  // ---------------------------------------------------------------- b2: Memory time (41.8 ms)
  S.add(fx.in([memLabel, memEq, memPill], { from: 'left', d: 0.5 }), 'b2~time-0.2');
  S.add(fx.pulse(memPill, { scale: 1.08, d: 0.4 }), 'b2~forty-one');

  // ---------------------------------------------------------------- b3: Compute time (0.141 ms)
  S.add(fx.in([compLabel, compEq, compPill], { from: 'left', d: 0.5 }), 'b3~arithmetic-0.2');
  S.add(fx.pulse(compPill, { scale: 1.08, d: 0.4 }), 'b3~takes');

  // ---------------------------------------------------------------- b4: The 295x gap & 0.34% active
  S.add(fx.in(ratioBadge, { from: 'right', d: 0.5 }), 'b4~Divide-0.2');
  S.add(fx.pulse(ratioBadge, { scale: 1.1, d: 0.5 }), 'b4~ninety-five');

  // ---------------------------------------------------------------- b5: Work per byte matches 295
  S.add(fx.in([decLabel, decVal, decPill], { from: 'up', d: 0.4 }), 'b5~work-0.2');
  S.add(fx.in([hwLabel, hwVal, hwPill], { from: 'up', d: 0.4 }), 'b5~chip-0.2');
  S.add(fx.pulse([decPill, hwPill], { scale: 1.08, d: 0.5 }), 'b5~ninety-five');

  // Concluding Takeaway pill
  const takeaway = S.pill('both time and work reveal the same truth: decode leaves compute 99.66% idle', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
