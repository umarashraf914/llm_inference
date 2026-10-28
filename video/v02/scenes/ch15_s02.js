/* ch15_s02 · why wires cannot keep pace with transistors (fig 79)
   Movement 1 (b1): Transistors shrink lithographically over 50 years.
   Movement 2 (b2): Bandwidth requires physical wires that take real space.
   Movement 3 (b3): 1,024 wires on package, 64 on board, 4 across room.
   Movement 4 (b4): Interconnect geometry cannot match transistor lithography. */

V.scene('ch15_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('why wires cannot keep pace with transistors', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Wire scales visual
  const ws = ch15WireScales(S, { cx: GX, cy: 510 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('the memory wall is rooted in physical connection geometry', {
    tone: 'struct'
  });

  // Initial states
  S.set([ws.bg, ws.title, ws.footer, takeaway.el], { autoAlpha: 0 });
  ws.scaleEls.forEach(s => {
    S.set(s.bc, { autoAlpha: 0 });
    S.set([s.st, s.sd, s.sw, s.sDesc], { autoAlpha: 0 });
  });

  // ---------------------------------------------------------------- b1: Transistor scaling
  S.add(fx.in([ws.bg, ws.title], { from: 'up', d: 0.5 }), 'b1~two-0.2');

  // ---------------------------------------------------------------- b2: Wires take physical space
  S.add(fx.in(ws.scaleEls[0].bc, { from: 'fade', d: 0.4 }), 'b2~Bandwidth-0.2');
  S.add(fx.in([ws.scaleEls[0].st, ws.scaleEls[0].sd, ws.scaleEls[0].sw, ws.scaleEls[0].sDesc], { from: 'fade', d: 0.4 }), 'b2~wires,');

  // ---------------------------------------------------------------- b3: Package vs Board vs Room
  S.add(fx.pulse(ws.scaleEls[0].sw, { scale: 1.05, d: 0.4 }), 'b3~thousand');
  S.add(fx.in(ws.scaleEls[1].bc, { from: 'fade', d: 0.4 }), 'b3~dozens-0.2');
  S.add(fx.in([ws.scaleEls[1].st, ws.scaleEls[1].sd, ws.scaleEls[1].sw, ws.scaleEls[1].sDesc], { from: 'fade', d: 0.4 }), 'b3~centimetres');
  S.add(fx.in(ws.scaleEls[2].bc, { from: 'fade', d: 0.4 }), 'b3~four-0.2');
  S.add(fx.in([ws.scaleEls[2].st, ws.scaleEls[2].sd, ws.scaleEls[2].sw, ws.scaleEls[2].sDesc], { from: 'fade', d: 0.4 }), 'b3~cable');

  // ---------------------------------------------------------------- b4: Lithography vs Interconnect geometry
  S.add(fx.pulse([ws.scaleEls[0].bc, ws.scaleEls[2].bc], { scale: 1.03, d: 0.4 }), 'b4~limited');
  S.add(fx.in(ws.footer, { from: 'up', d: 0.4 }), 'b4~rate.');
  S.add(fx.pulse(ws.footer, { scale: 1.03, d: 0.4 }), 'b4~rate.');

  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
