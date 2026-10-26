/* ch20_s01 · the capacity wall and the 405b model (figs 108, 109)
   Movement 1 (b1): Capacity wall: frontier models exceed single-chip physical limits.
   Movement 2 (b2): H100 = 80 GB; H200 = 141 GB.
   Movement 3 (b3): Llama 3 405B @ 16-bit = 810 GB (requires 11 H100s).
   Movement 4 (b4): 8-GPU chassis = 640 GB; weights spill 170 GB into 2nd chassis. */

V.scene('ch20_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('The capacity wall and the 405b model', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Capacity wall visual
  const cw = ch20CapacityWall(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('models exceeding 640 GB must span multiple chassis and cross external network links', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([cw.card, cw.title, cw.b1Card, cw.b1Title, cw.b1Sub, cw.b1Pill], { autoAlpha: 0 });
  cw.b1Gpus.forEach(g => S.set([g.gb, g.gl], { autoAlpha: 0 }));
  S.set([cw.b2Card, cw.b2Title, cw.b2Sub, cw.b2Pill, cw.footer], { autoAlpha: 0 });
  cw.b2Gpus.forEach(g => S.set([g.gb, g.gl], { autoAlpha: 0 }));
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Capacity wall concept
  S.add(fx.in([cw.card, cw.title], { from: 'scale', d: 0.5 }), 'b1~bandwidth-0.2');

  // ---------------------------------------------------------------- b2: Single-chip limits (80 GB vs 141 GB)
  S.add(fx.in([cw.b1Card, cw.b1Title], { from: 'scale', d: 0.4 }), 'b2~hundred-0.2');
  S.add(fx.in(cw.b1Sub, { from: 'fade', d: 0.35 }), 'b2~hundred');
  cw.b1Gpus.forEach((g, idx) => {
    S.add(fx.in(g.gb, { from: 'scale', d: 0.35 }), `b2~eighty:-${0.2 - idx * 0.1}`);
    S.add(fx.in(g.gl, { from: 'fade', d: 0.35 }), `b2~eighty:-${0.2 - idx * 0.1}`);
  });
  S.add(fx.in(cw.b1Pill, { from: 'up', d: 0.4 }), 'b2~physically');

  // ---------------------------------------------------------------- b3: 405B takes 810 GB (needs 11 GPUs)
  S.add(fx.pulse([cw.b1Card, cw.b1Pill], { scale: 1.04, d: 0.4 }), 'b3~eight');

  // ---------------------------------------------------------------- b4: Spillover into Chassis 2
  S.add(fx.in([cw.b2Card, cw.b2Title], { from: 'scale', d: 0.4 }), 'b4~chassis-0.2');
  S.add(fx.in(cw.b2Sub, { from: 'fade', d: 0.35 }), 'b4~chassis');
  cw.b2Gpus.forEach((g, idx) => {
    S.add(fx.in(g.gb, { from: 'scale', d: 0.35 }), `b4~spill:-${0.2 - idx * 0.1}`);
    S.add(fx.in(g.gl, { from: 'fade', d: 0.35 }), `b4~spill:-${0.2 - idx * 0.1}`);
  });
  S.add(fx.in(cw.b2Pill, { from: 'up', d: 0.4 }), 'b4~cluster');
  S.add(fx.pulse([cw.b2Card, cw.b2Pill], { scale: 1.05, d: 0.4 }), 'b4~network.');
  S.add(fx.in(cw.footer, { from: 'up', d: 0.4 }), 'b4~network.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
