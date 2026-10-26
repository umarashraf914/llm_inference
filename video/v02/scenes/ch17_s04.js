/* ch17_s04 · why one operation gets its own silicon (figs 93, 94)
   Movement 1 (b1): Why 528 specialized tensor cores on one die.
   Movement 2 (b2): Transformers spend 92% of arithmetic on matrix multiply.
   Movement 3 (b3): Peak performance assumes zero stalls (never reached).
   Movement 4 (b4): Superbly tuned kernels reach 50% to 80% of peak. */

V.scene('ch17_s04', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Why one operation gets its own silicon', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Transformer arithmetic and efficiency visual
  const tp = ch17TransformerPie(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('peak is a hardware ceiling; software quality is measured by what fraction of peak it sustains', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([tp.leftCard, tp.leftTitle, tp.leftSub, tp.leftPill], { autoAlpha: 0 });
  tp.pElements.forEach(e => S.set([e.box, e.nl, e.vl], { autoAlpha: 0 }));
  S.set([tp.rightCard, tp.rightTitle, tp.rightSub, tp.rightPill], { autoAlpha: 0 });
  tp.eElements.forEach(e => S.set([e.box, e.nl, e.vl], { autoAlpha: 0 }));
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Why 528 specialized units
  S.add(fx.in([tp.leftCard, tp.leftTitle], { from: 'scale', d: 0.5 }), 'b1~dedicate-0.2');
  S.add(fx.in(tp.leftSub, { from: 'fade', d: 0.4 }), 'b1~specialized');

  // ---------------------------------------------------------------- b2: Transformers spend 92% on GEMMs
  tp.pElements.forEach((e, idx) => {
    S.add(fx.in([e.box, e.nl, e.vl], { from: 'fade', d: 0.35 }), `b2~transformers:-${0.2 - idx * 0.2}`);
  });
  S.add(fx.in(tp.leftPill, { from: 'up', d: 0.4 }), 'b2~ninety');
  S.add(fx.pulse([tp.leftCard, tp.pElements[0].box], { scale: 1.05, d: 0.4 }), 'b2~multiplication.');

  // ---------------------------------------------------------------- b3: Peak assumes zero stalls
  S.add(fx.in([tp.rightCard, tp.rightTitle], { from: 'scale', d: 0.5 }), 'b3~Peak-0.2');
  S.add(fx.in(tp.rightSub, { from: 'fade', d: 0.4 }), 'b3~performance');
  S.add(fx.in([tp.eElements[0].box, tp.eElements[0].nl, tp.eElements[0].vl], { from: 'fade', d: 0.4 }), 'b3~assumes');

  // ---------------------------------------------------------------- b4: 50% to 80% sustained efficiency
  S.add(fx.in([tp.eElements[1].box, tp.eElements[1].nl, tp.eElements[1].vl], { from: 'fade', d: 0.4 }), 'b4~superbly-0.2');
  S.add(fx.in([tp.eElements[2].box, tp.eElements[2].nl, tp.eElements[2].vl], { from: 'fade', d: 0.4 }), 'b4~tuned');
  S.add(fx.pulse([tp.eElements[1].box, tp.eElements[1].vl], { scale: 1.06, d: 0.4 }), 'b4~eighty');
  S.add(fx.in(tp.rightPill, { from: 'up', d: 0.4 }), 'b4~software');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
