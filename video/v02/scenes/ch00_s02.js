/* ch00_s02 · the five-thousand-wire bottle (cold open)
   Movement 1 (b1): Stopwatch: 0.1 ms arithmetic vs 30 ms memory wait (300x slower).
   Movement 2 (b2): The physical H100 package: compute die flanked by 5 HBM3 stacks and 5,120 wires.
   Movement 3 (b3): 140 GB streaming across the bus every token: the chip is starved for data. */

V.scene('ch00_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Scene heading
  const heading = S.heading('The five-thousand-wire bottle', { y: 130 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // ---------------------------------------------------------------- Movement 1 (b1): Stopwatch & ratio
  const m1Group = S.g();

  // Stopwatch on left
  const sw = libStopwatch(S, {
    x: 680, y: 460, size: 210, span: 30, value: 0,
    tone: 'bytes', unit: 'ms', readout: 'below'
  }, m1Group);
  if (sw.plate) {
    const curH = parseFloat(sw.plate.getAttribute('height') || '42');
    const curY = parseFloat(sw.plate.getAttribute('y') || '0');
    sw.plate.setAttribute('height', String(curH + 10));
    sw.plate.setAttribute('y', String(curY - 5));
  }

  // Comparison pill stack on right
  const compGroup = S.g(null, m1Group);
  const compX = 1180, compY = 460;
  const compCard = S.card({
    x: compX - 220, y: compY - 120, w: 440, h: 240,
    tone: 'neutral', title: ''
  }, compGroup);

  const compTitle = S.text('token generation time', {
    x: compX, y: compY - 70, size: 22, anchor: 'middle', color: 'ink', weight: 650
  }, compGroup);

  const pArith = S.pill('arithmetic: ≈ 0.1 ms', {
    x: compX, y: compY - 14, h: 42, tone: 'compute', size: 20, weight: 650, mono: true
  });
  compGroup.appendChild(pArith);

  const pWait = S.pill('waiting for memory: ≈ 30 ms', {
    x: compX, y: compY + 44, h: 42, tone: 'bytes', size: 20, weight: 650, mono: true
  });
  compGroup.appendChild(pWait);

  const ratioLabel = S.text('300× time spent waiting', {
    x: compX, y: compY + 98, size: 20, anchor: 'middle', color: 'muted', weight: 600
  }, compGroup);

  // ---------------------------------------------------------------- Movement 2 & 3 (b2-b3): Package & Flows
  const pkg = ch00Package(S, { cx: GX, cy: 510, scale: 1.15 });

  // Weight moved stat pill below package
  const rateTag = S.pill('140 GB read every single token', {
    x: GX, y: 795, h: 40, tone: 'bytes', size: 20, weight: 650, mono: true
  });
  pkg.group.appendChild(rateTag);

  // Takeaway band
  const takeaway = S.takeaway('the chip is not slow; it is starved for data', {
    tone: 'bytes'
  });

  // Initial hidden states
  S.set([m1Group, pkg.group, rateTag, takeaway], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 0.1 ms arithmetic vs 30 ms wait
  S.add(fx.in(m1Group, { from: 'fade', d: 0.5 }), 'b1');
  S.add(sw.run(0, 30, { d: 2.2, ease: 'power2.out' }), 'b1~tenth-0.2');
  S.add(fx.pulse(pWait, { scale: 1.06, d: 0.4 }), 'b1~waiting');

  // ---------------------------------------------------------------- b2: The 5,120-wire bus & 5 HBM stacks
  S.add(fx.out(m1Group, { d: 0.35 }), 'b2-0.2');
  S.add(fx.in(pkg.group, { from: 'fade', d: 0.6 }), 'b2~stacks-0.2');
  S.add(fx.pulse(pkg.buses, { scale: 1.05, stagger: 0.04, d: 0.45 }), 'b2~wires');

  // ---------------------------------------------------------------- b3: 140 GB streaming across wires
  S.add(fx.in(rateTag, { from: 'up', d: 0.4 }), 'b3~weight-0.2');

  // Particle flows along each of the 5 buses from HBM to die
  pkg.buses.forEach(b => {
    S.flow({
      d: b.__d,
      from: 'b3~weight',
      to: 'end-0.5',
      speed: 380,
      every: 0.18,
      size: 7,
      color: S.tone('bytes')
    });
  });

  // Die pulse as data strikes
  S.add(gsap.to(pkg.dieRect, {
    stroke: S.tone('compute'), strokeOpacity: 1,
    fill: '#241a0e', repeat: 8, yoyo: true, duration: 0.35, ease: 'sine.inOut'
  }), 'b3~token');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b3>-0.8');
});
