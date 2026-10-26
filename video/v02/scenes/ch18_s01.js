/* ch18_s01 · lower precision pays off twice (fig 95)
   Movement 1 (b1): Single lever attacks both bottlenecks simultaneously.
   Movement 2 (b2): Arithmetic side: 2x operations through tensor cores.
   Movement 3 (b3): Memory side: 50% fewer bytes crossing the bus. */

V.scene('ch18_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Lower precision pays off twice', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Dual lever visual
  const dl = ch18DualLever(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('lower precision accelerates arithmetic while cutting memory traffic in half', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([dl.card, dl.title, dl.chipBox, dl.chipText], { autoAlpha: 0 });
  S.set([dl.topCard, dl.topTitle, dl.topDesc, dl.botCard, dl.botTitle, dl.botDesc, dl.footer], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Central lever chip
  S.add(fx.in([dl.card, dl.title], { from: 'scale', d: 0.5 }), 'b1~precision-0.2');
  S.add(fx.in([dl.chipBox, dl.chipText], { from: 'scale', d: 0.5 }), 'b1~single-0.2');
  S.add(fx.pulse([dl.chipBox, dl.chipText], { scale: 1.05, d: 0.4 }), 'b1~bottlenecks');

  // ---------------------------------------------------------------- b2: Arithmetic 2x speedup
  S.add(fx.in([dl.topCard, dl.topTitle], { from: 'scale', d: 0.5 }), 'b2~arithmetic-0.2');
  S.add(fx.in(dl.topDesc, { from: 'fade', d: 0.4 }), 'b2~narrower');
  S.add(fx.pulse([dl.topCard, dl.topTitle], { scale: 1.05, d: 0.4 }), 'b2~twice');

  // ---------------------------------------------------------------- b3: Memory 50% bandwidth reduction
  S.add(fx.in([dl.botCard, dl.botTitle], { from: 'scale', d: 0.5 }), 'b3~memory-0.2');
  S.add(fx.in(dl.botDesc, { from: 'fade', d: 0.4 }), 'b3~narrower');
  S.add(fx.pulse([dl.botCard, dl.botTitle], { scale: 1.05, d: 0.4 }), 'b3~fewer');
  S.add(fx.in(dl.footer, { from: 'up', d: 0.4 }), 'b3~work.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b3>-0.8');
});
