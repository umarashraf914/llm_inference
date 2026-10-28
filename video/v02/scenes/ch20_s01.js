/* ch20_s01 · the capacity wall and the 405b model (figs 108, 109)
   Movement 1 (b1): Capacity wall: frontier models exceed single-chip physical limits.
   Movement 2 (b2): H100 = 80 GB; H200 = 141 GB.
   Movement 3 (b3): Llama 3 405B @ 16-bit = 810 GB (requires 11 H100s).
   Movement 4 (b4): 8-GPU chassis = 640 GB; weights spill 170 GB into 2nd chassis. */

V.scene('ch20_s01', S => {
  const { fx } = S;

  // Heading
  const heading = S.heading('the capacity wall and the 405b model', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Capacity wall visual (Atlas Figs 108, 109)
  const cw = ch20CapacityWall(S, { cx: 960, cy: 510 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('models exceeding 640 gb must span multiple chassis and cross external network links', {
    tone: 'bytes'
  });

  // Initial states
  S.set([cw.bg, cw.title, cw.bar16Bg, cw.bar16Fill, cw.bar16Lbl, cw.bar16Val], { autoAlpha: 0 });
  S.set([cw.bar8Bg, cw.bar8Fill, cw.bar8Lbl, cw.bar8Val], { autoAlpha: 0 });
  S.set([cw.b1Card, cw.b1Title, cw.b1Sub, cw.b1Pill], { autoAlpha: 0 });
  cw.b1Gpus.forEach(g => S.set([g.gb, g.gl1, g.gl2], { autoAlpha: 0 }));
  S.set([cw.b2Card, cw.b2Title, cw.b2Sub, cw.b2Pill, cw.cableLine, cw.cablePill], { autoAlpha: 0 });
  cw.b2Gpus.forEach(g => S.set([g.gb, g.gl1, g.gl2], { autoAlpha: 0 }));
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Capacity wall concept
  S.add(fx.in([cw.bg, cw.title], { from: 'fade', d: 0.5 }), 'b1~bandwidth-0.2');

  // ---------------------------------------------------------------- b2: Single-chip limits & 8-bit comparison
  S.add(fx.in([cw.bar8Bg, cw.bar8Fill, cw.bar8Lbl, cw.bar8Val], { from: 'fade', d: 0.4 }), 'b2~hundred-0.2');
  S.add(fx.in([cw.b1Card, cw.b1Title, cw.b1Sub], { from: 'fade', d: 0.4 }), 'b2~hundred');
  cw.b1Gpus.forEach((g, idx) => {
    S.add(fx.in(g.gb, { from: 'fade', d: 0.35 }), `b2~eighty:-${0.2 - idx * 0.08}`);
    S.add(fx.in([g.gl1, g.gl2], { from: 'fade', d: 0.35 }), `b2~eighty:-${0.2 - idx * 0.08}`);
  });
  S.add(fx.in(cw.b1Pill, { from: 'up', d: 0.4 }), 'b2~physically');

  // ---------------------------------------------------------------- b3: 16-bit 405B takes 810 GB (spills out)
  S.add(fx.in([cw.bar16Bg, cw.bar16Fill, cw.bar16Lbl, cw.bar16Val], { from: 'fade', d: 0.4 }), 'b3~eight');
  S.add(fx.pulse([cw.b1Card, cw.b1Pill], { scale: 1.02, d: 0.4 }), 'b3~eight');

  // ---------------------------------------------------------------- b4: Spillover into Chassis 2
  S.add(fx.in([cw.b2Card, cw.b2Title, cw.b2Sub], { from: 'fade', d: 0.4 }), 'b4~chassis-0.2');
  cw.b2Gpus.forEach((g, idx) => {
    S.add(fx.in(g.gb, { from: 'fade', d: 0.35 }), `b4~spill:-${0.2 - idx * 0.08}`);
    S.add(fx.in([g.gl1, g.gl2], { from: 'fade', d: 0.35 }), `b4~spill:-${0.2 - idx * 0.08}`);
  });
  S.add(fx.in(cw.b2Pill, { from: 'up', d: 0.4 }), 'b4~cluster');
  S.add(fx.in([cw.cableLine, cw.cablePill], { from: 'fade', d: 0.4 }), 'b4~network.');
  S.add(fx.pulse([cw.b2Card, cw.cablePill], { scale: 1.02, d: 0.4 }), 'b4~network.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
