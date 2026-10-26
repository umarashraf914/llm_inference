/* ch15_s01 · generations and the diverging curves (figs 76, 77, 78)
   Movement 1 (b1): 4 GPU generations across 7 years.
   Movement 2 (b2): 16-bit compute grew 18x (125 -> 2,250 TFLOP/s).
   Movement 3 (b3): Bandwidth grew only 9x (0.9 -> 8.0 TB/s): the memory wall.
   Movement 4 (b4): The ridge doubled from 139 to ~300. */

V.scene('ch15_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Generations and the diverging curves', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Timeline
  const tl = ch15GenTimeline(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('hardware improves, but arithmetic races ahead of bandwidth', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([tl.card, tl.title, tl.footer], { autoAlpha: 0 });
  tl.colEls.forEach(c => {
    S.set(c.bc, { autoAlpha: 0 });
    S.set([c.gnText, c.flopBox, c.flopVal, c.bwBox, c.bwVal, c.ridgeVal], { autoAlpha: 0 });
  });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Generational columns
  S.add(fx.in([tl.card, tl.title], { from: 'scale', d: 0.5 }), 'b1~Roughly-0.2');
  tl.colEls.forEach((c, idx) => {
    S.add(fx.in(c.bc, { from: 'scale', d: 0.4 }), `b1~architecture:-${0.2 - idx * 0.2}`);
    S.add(fx.in(c.gnText, { from: 'fade', d: 0.35 }), `b1~architecture:-${0.2 - idx * 0.2}`);
  });

  // ---------------------------------------------------------------- b2: Compute grew 18-fold
  tl.colEls.forEach((c, idx) => {
    S.add(fx.in(c.flopBox, { from: 'scale', d: 0.35 }), `b2~eighteen-fold::-${0.1 - idx * 0.2}`);
    S.add(fx.in(c.flopVal, { from: 'fade', d: 0.35 }), `b2~eighteen-fold::-${0.1 - idx * 0.2}`);
  });
  S.add(fx.pulse([tl.colEls[0].flopBox, tl.colEls[3].flopBox], { scale: 1.08, d: 0.4 }), 'b2~twenty-two');

  // ---------------------------------------------------------------- b3: Bandwidth grew 9-fold (memory wall)
  tl.colEls.forEach((c, idx) => {
    S.add(fx.in(c.bwBox, { from: 'scale', d: 0.35 }), `b3~nine-fold::-${0.1 - idx * 0.2}`);
    S.add(fx.in(c.bwVal, { from: 'fade', d: 0.35 }), `b3~nine-fold::-${0.1 - idx * 0.2}`);
  });
  S.add(fx.pulse([tl.colEls[0].bwBox, tl.colEls[3].bwBox], { scale: 1.08, d: 0.4 }), 'b3~terabytes');

  // ---------------------------------------------------------------- b4: Ridge doubled & conclusion
  tl.colEls.forEach((c, idx) => {
    S.add(fx.in(c.ridgeVal, { from: 'fade', d: 0.35 }), `b4~doubled:-${0.1 - idx * 0.2}`);
  });
  S.add(fx.in(tl.footer, { from: 'up', d: 0.4 }), 'b4~memory-bound');
  S.add(fx.pulse(tl.footer, { scale: 1.05, d: 0.4 }), 'b4~code.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
