/* ch02_s03 · bandwidth is wires times speed (fig 7)
   Movement 1 (b1): Bus definition and formula: bandwidth = wires × bit rate ÷ 8.
   Movement 2 (b2): RTX 4090 gaming bus: 384 wires at 21.0 Gb/s = 1,008 GB/s.
   Movement 3 (b3-b4): H100 memory bus: 5,120 wires at 5.24 Gb/s = 3,352 GB/s. Wide beats fast! */

V.scene('ch02_s03', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('Bandwidth is wires times speed', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Bus comparison diagram builder from ch02_common.js
  const bus = ch02BusDiagram(S, { cx: GX, cy: GY + 20 });

  // Formula badge at top
  const formulaPill = S.pill('Bandwidth = wires × bit rate per wire ÷ 8 bits per byte', {
    x: GX, y: 185, h: 42, tone: 'neutral', size: 22, weight: 600
  });

  S.set([formulaPill, bus.topCard, bus.topTitle, bus.topWires, bus.topBw,
         bus.btmCard, bus.btmTitle, bus.btmWires, bus.btmSub, bus.btmBw], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Formula & bus concept
  S.add(fx.in(formulaPill, { from: 'up', d: 0.45 }), 'b1~bandwidth-0.2');

  // ---------------------------------------------------------------- b2: RTX 4090 gaming bus
  S.add(fx.in([bus.topCard, bus.topTitle, bus.topWires, bus.topBw], { from: 'left', d: 0.5 }), 'b2~forty ninety-0.2');

  // ---------------------------------------------------------------- b3: H100 4× slower wires
  S.add(fx.in([bus.btmCard, bus.btmTitle, bus.btmWires], { from: 'right', d: 0.5 }), 'b3~slower-0.2');

  // ---------------------------------------------------------------- b4: H100 13.3× wider wire count & 3.3× throughput
  S.add(fx.in([bus.btmSub, bus.btmBw], { from: 'scale', d: 0.5 }), 'b4~three times-0.2');
  S.add(fx.pulse(bus.btmBw, { scale: 1.12, d: 0.6 }), 'b4~wires');

  // Concluding Takeaway pill
  const takeaway = S.pill('wide beats fast: massive bandwidth comes from wire count', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
