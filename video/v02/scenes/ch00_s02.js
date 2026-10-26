/* ch00_s02 · the five-thousand-wire bottle (cold open)
   Movement 1 (b1): Arithmetic takes ~0.1 ms; rest spent waiting for memory.
   Movement 2 (b2): Bus of 5,120 tiny wires between memory and die sets the pace.
   Movement 3 (b3): 140 GB moved per token: chip is not slow, it is starved for data. */

V.scene('ch00_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('The five-thousand-wire bottle', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Five Thousand Wires Visual
  const wires = ch00FiveThousandWires(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('the chip is not slow; it is starved for data', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([wires.card, wires.title, wires.footer], { autoAlpha: 0 });
  wires.colEls.forEach(col => {
    S.set(col.bc, { autoAlpha: 0 });
    S.set([col.ct, col.cs, col.cb, col.cd], { autoAlpha: 0 });
  });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 0.1 ms arithmetic
  S.add(fx.in([wires.card, wires.title], { from: 'scale', d: 0.5 }), 'b1~arithmetic-0.2');
  const c1 = wires.colEls[0];
  S.add(fx.in(c1.bc, { from: 'scale', d: 0.4 }), 'b1~token');
  S.add(fx.in([c1.ct, c1.cs], { from: 'fade', d: 0.35 }), 'b1~token');
  S.add(fx.in([c1.cb, c1.cd], { from: 'fade', d: 0.35 }), 'b1~memory.');

  // ---------------------------------------------------------------- b2: 5,120 wires
  const c2 = wires.colEls[1];
  S.add(fx.in(c2.bc, { from: 'scale', d: 0.4 }), 'b2~stacks-0.2');
  S.add(fx.in([c2.ct, c2.cs], { from: 'fade', d: 0.35 }), 'b2~stacks');
  S.add(fx.in([c2.cb, c2.cd], { from: 'fade', d: 0.35 }), 'b2~pace.');
  S.add(fx.pulse([c2.bc, c2.cs], { scale: 1.04, d: 0.4 }), 'b2~pace.');

  // ---------------------------------------------------------------- b3: 140 GB moved per token & starved
  const c3 = wires.colEls[2];
  S.add(fx.in(c3.bc, { from: 'scale', d: 0.4 }), 'b3~weight-0.2');
  S.add(fx.in([c3.ct, c3.cs], { from: 'fade', d: 0.35 }), 'b3~weight');
  S.add(fx.in([c3.cb, c3.cd], { from: 'fade', d: 0.35 }), 'b3~data.');
  S.add(fx.pulse([c3.bc, c3.cs], { scale: 1.04, d: 0.4 }), 'b3~data.');
  S.add(fx.in(wires.footer, { from: 'up', d: 0.4 }), 'b3~data.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b3>-0.8');
});
