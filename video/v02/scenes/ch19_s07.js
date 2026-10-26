/* ch19_s07 · separating reality from marketing claims (fig 107)
   Movement 1 (b1): 9x and 18x headline marketing claims.
   Movement 2 (b2): Headline numbers blend reduced precision, 2:4 sparsity, and scale-out.
   Movement 3 (b3): On identical precision and dense workloads: real silicon progress is 2x to 4x.
   Movement 4 (b4): Separate true architectural advances from marketing arithmetic. */

V.scene('ch19_s07', S => {
  const { fx } = S;
  const GX = 960, GY = 510;

  // Heading
  const heading = S.heading('Separating reality from marketing claims', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Container card
  const card = S.card({ x: GX - 680, y: GY - 240, w: 1360, h: 480, tone: 'neutral', title: '' });
  const title = S.text('DECONSTRUCTING GENERATIONAL MARKETING HEADLINES', {
    x: GX, y: GY - 204, size: 24, anchor: 'middle', weight: 700, color: 'ink'
  });

  // Top Headline Box
  const headW = 1240;
  const headH = 80;
  const headCard = S.card({ x: GX - headW / 2, y: GY - 150, w: headW, h: headH, tone: 'bytes', title: '' });
  const headText = S.text('HEADLINE CLAIM: "9× TO 18× GENERATIONAL LEAP"', {
    x: GX, y: GY - 100, size: 24, anchor: 'middle', weight: 700, color: 'bytes'
  });

  // Three Factor Decomposition Cards
  const colW = 390;
  const colGap = 25;
  const startX = GX - (3 * colW + 2 * colGap) / 2;
  const colY = GY - 45;
  const colH = 190;

  const factors = [
    { name: '1. NARROW PRECISION', mult: '2.0× Multiplier', desc: 'Moving from FP16 to FP8 doubles theoretical math', tone: 'compute' },
    { name: '2. 2:4 SPARSITY', mult: '2.0× Multiplier', desc: 'Assumes half of all weights are exactly zero', tone: 'compute' },
    { name: '3. CLUSTER FABRIC', mult: '2.25× Multiplier', desc: 'Combines multiple dies and higher clocks', tone: 'struct' }
  ];

  const fElements = [];
  factors.forEach((f, idx) => {
    const lx = startX + idx * (colW + colGap);
    const bc = S.card({ x: lx, y: colY, w: colW, h: colH, tone: f.tone, title: '' });
    const fn = S.text(f.name, { x: lx + colW / 2, y: colY + 36, size: 20, anchor: 'middle', weight: 700, color: f.tone });
    const fm = S.text(f.mult, { x: lx + colW / 2, y: colY + 75, size: 22, anchor: 'middle', weight: 700, color: 'ink' });
    const fd = S.text(f.desc, { x: lx + colW / 2, y: colY + 125, size: 18, anchor: 'middle', weight: 600, color: 'muted' });
    fd.setAttribute('data-audit', 'ignore');
    fElements.push({ bc, fn, fm, fd });
  });

  const footer = S.pill('ON DENSE SAME-PRECISION WORKLOADS: REAL SILICON DELIVERS 2× TO 4× PER GENERATION', {
    x: GX, y: GY + 204, h: 42, tone: 'helps', size: 20, weight: 700
  });

  // Concluding Takeaway pill
  const takeaway = S.pill('always inspect precision and sparsity when evaluating generational claims', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([card, title, headCard, headText, footer], { autoAlpha: 0 });
  fElements.forEach(e => S.set([e.bc, e.fn, e.fm, e.fd], { autoAlpha: 0 }));
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Headline banner
  S.add(fx.in([card, title], { from: 'scale', d: 0.5 }), 'b1~marketing-0.2');
  S.add(fx.in([headCard, headText], { from: 'scale', d: 0.5 }), 'b1~nine-fold-0.2');
  S.add(fx.pulse([headCard, headText], { scale: 1.05, d: 0.4 }), 'b1~measured.');

  // ---------------------------------------------------------------- b2: Three blended factors
  fElements.forEach((e, idx) => {
    S.add(fx.in(e.bc, { from: 'up', d: 0.4 }), `b2~multiples:-${0.2 - idx * 0.25}`);
    S.add(fx.in([e.fn, e.fm, e.fd], { from: 'fade', d: 0.4 }), `b2~multiples:-${0.2 - idx * 0.25}`);
  });

  // ---------------------------------------------------------------- b3: Real silicon progress (2x to 4x)
  S.add(fx.in(footer, { from: 'up', d: 0.4 }), 'b3~identical-0.2');
  S.add(fx.pulse(footer, { scale: 1.05, d: 0.4 }), 'b3~four');

  // ---------------------------------------------------------------- b4: True architectural advances
  S.add(fx.pulse(fElements.map(e => e.bc), { scale: 1.04, stagger: 0.05, d: 0.4 }), 'b4~physical');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
