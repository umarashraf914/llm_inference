/* ch07_s02 · the tensor memory accelerator (figs 35, 36)
   Movement 1 (b1): Legacy copy loop: threads spend precious arithmetic issue slots fetching data.
   Movement 2 (b2): Cost on 64×64 tile: 128 threads issue 512 copy instructions (slots lost from math).
   Movement 3 (b3): Hopper innovation: TMA dedicated hardware copy engine.
   Movement 4 (b4): TMA descriptor: base address, tile shape, row stride. 1 thread issues 1 instruction.
   Movement 5 (b5): Background streaming: all 64 rows transferred while threads continue computing. */

V.scene('ch07_s02', S => {
  const { fx } = S;
  const GX = 960, GY = 505;

  // Heading
  const heading = S.heading('the tensor memory accelerator', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // TMA Flow and Descriptor builder (Figs 35, 36)
  const tma = ch07TmaFlow(S, { cx: GX, cy: GY, w: 1420, h: 540 });

  // Initial visibility
  S.set([tma.bg, tma.title], { autoAlpha: 0 });
  S.set(tma.flow, { autoAlpha: 0 });
  S.set(tma.desc, { autoAlpha: 0 });
  S.set(tma.comp, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Legacy thread copy & flow
  S.add(fx.in([tma.bg, tma.title, ...tma.flow], { from: 'fade', d: 0.5 }), 'b1~spend-0.2');

  // ---------------------------------------------------------------- b2: 512 copy instructions lost
  S.add(fx.in(tma.comp.slice(0, 3), { from: 'fade', d: 0.5 }), 'b2~twelve-0.2');
  S.add(fx.pulse(tma.comp[0], { scale: 1.03, d: 0.5 }), 'b2~slots');

  // ---------------------------------------------------------------- b3: TMA hardware arrival
  S.add(fx.in(tma.comp.slice(3), { from: 'fade', d: 0.5 }), 'b3~accelerator-0.2');
  S.add(fx.pulse(tma.comp[3], { scale: 1.03, d: 0.5 }), 'b3~independently');

  // ---------------------------------------------------------------- b4: Descriptor & 1 instruction
  S.add(fx.in(tma.desc, { from: 'fade', d: 0.5 }), 'b4~descriptor-0.2');
  S.add(fx.pulse(tma.desc.slice(2), { scale: 1.05, d: 0.4 }), 'b4~single');

  // ---------------------------------------------------------------- b5: Background streaming
  S.add(fx.pulse([tma.comp[3], tma.comp[4]], { scale: 1.04, d: 0.5 }), 'b5~computing');

  // Concluding Takeaway band
  const takeaway = S.takeaway('tma overlaps memory staging with compute without spending thread instructions', {
    tone: 'helps'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
