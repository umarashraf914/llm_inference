/* ch18_s01 · lower precision attacks both bottlenecks (fig 95)
   Movement 1 (b1): Lower precision attacks compute and memory simultaneously.
   Movement 2 (b2): Arithmetic side: tensor cores process 2x calculations per second.
   Movement 3 (b3): Memory side: 50% fewer bytes cross the bus per weight. */

V.scene('ch18_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('lower precision attacks both bottlenecks', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Dual lever visual
  const dl = ch18DualLever(S, { cx: GX, cy: 500 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('lower precision accelerates arithmetic while cutting memory traffic in half', {
    tone: 'helps'
  });

  // Initial states
  S.set([dl.bg, dl.title, dl.leverBox, dl.leverTitle], { autoAlpha: 0 });
  S.set([dl.topCard, dl.topTitle, dl.topDesc], { autoAlpha: 0 });
  S.set([dl.botCard, dl.botTitle, dl.botDesc, dl.footer, takeaway], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Central lever appears
  S.add(fx.in([dl.bg, dl.title], { from: 'up', d: 0.5 }), 'b1~single-0.2');
  S.add(fx.in([dl.leverBox, dl.leverTitle], { from: 'fade', d: 0.4 }), 'b1~attacks');

  // ---------------------------------------------------------------- b2: Arithmetic speedup (Top)
  S.add(fx.in([dl.topCard, dl.topTitle, dl.topDesc], { from: 'fade', d: 0.4 }), 'b2~arithmetic-0.2');
  S.add(fx.pulse([dl.topCard, dl.topTitle], { scale: 1.03, d: 0.4 }), 'b2~twice');

  // ---------------------------------------------------------------- b3: Memory traffic savings (Bottom)
  S.add(fx.in([dl.botCard, dl.botTitle, dl.botDesc], { from: 'fade', d: 0.4 }), 'b3~memory-0.2');
  S.add(fx.pulse([dl.botCard, dl.botTitle], { scale: 1.03, d: 0.4 }), 'b3~fewer');
  S.add(fx.in(dl.footer, { from: 'fade', d: 0.4 }), 'b3~data');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b3>-0.8');
});
