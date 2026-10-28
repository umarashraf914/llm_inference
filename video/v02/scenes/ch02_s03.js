/* ch02_s03 · bandwidth is wires times speed (fig 7)
   Movement 1 (b1): Bus definition and formula: bandwidth = wires × bit rate ÷ 8.
   Movement 2 (b2): RTX 4090 gaming bus: 384 wires at 21.0 Gb/s = 1,008 GB/s.
   Movement 3 (b3-b4): H100 memory bus: 5,120 wires at 5.24 Gb/s = 3,352 GB/s. Wide beats fast! */

V.scene('ch02_s03', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('Bandwidth is wires times speed', { y: 130 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Bus comparison diagram builder
  const bus = ch02BusDiagram(S, { cx: GX, cy: GY + 20 });

  // Formula badge at top
  const formulaPill = S.pill('bandwidth = wires × bit rate per wire ÷ 8 bits per byte', {
    x: GX, y: 195, h: 42, tone: 'neutral', size: 22, weight: 600
  });

  // Concluding Takeaway
  const takeaway = S.takeaway('wide beats fast: massive bandwidth comes from wire count', {
    tone: 'bytes'
  });

  // Initial hidden states
  S.set([formulaPill, bus.topGroup, bus.btmGroup, takeaway], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Formula & bus concept
  S.add(fx.in(formulaPill, { from: 'up', d: 0.45 }), 'b1~bandwidth-0.2');

  // ---------------------------------------------------------------- b2: RTX 4090 gaming bus
  S.add(fx.in(bus.topGroup, { from: 'fade', d: 0.5 }), 'b2~forty ninety-0.2');
  S.add(fx.pulse(bus.topBw, { scale: 1.08, d: 0.4 }), 'b2~forty ninety+0.4');

  // ---------------------------------------------------------------- b3: H100 4× slower wires
  S.add(fx.in(bus.btmGroup, { from: 'fade', d: 0.5 }), 'b3~slower-0.2');

  // ---------------------------------------------------------------- b4: H100 13.3× wider wire count & 3.3× throughput
  S.add(fx.pulse(bus.btmBw, { scale: 1.1, d: 0.6 }), 'b4~wires');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
