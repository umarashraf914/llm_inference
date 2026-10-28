/* ch17_s04 · why one operation gets its own silicon (figs 93, 94)
   Movement 1 (b1): Why 528 specialized tensor cores on one die.
   Movement 2 (b2): Transformers spend 92% of arithmetic on matrix multiply.
   Movement 3 (b3): Peak performance assumes zero stalls (never reached).
   Movement 4 (b4): Superbly tuned kernels reach 50% to 80% of peak. */

V.scene('ch17_s04', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('why one operation gets its own silicon', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Transformer arithmetic and efficiency visual
  const tp = ch17TransformerPie(S, { cx: GX, cy: 500 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('peak is a hardware ceiling; software quality is measured by what fraction of peak it sustains', {
    tone: 'helps'
  });

  // Initial states
  S.set([tp.leftCard, tp.leftTitle, tp.leftSub, tp.gemmBar, tp.normBar, tp.softBar, tp.leftPill], { autoAlpha: 0 });
  tp.pElements.forEach(e => S.set([e.box, e.nl, e.vl], { autoAlpha: 0 }));
  S.set([tp.rightCard, tp.rightTitle, tp.rightSub, tp.rightPill, takeaway], { autoAlpha: 0 });
  tp.eElements.forEach(e => S.set([e.box, e.nl, e.vl, e.barTrack, e.barFill], { autoAlpha: 0 }));

  // ---------------------------------------------------------------- b1: Why 528 specialized units
  S.add(fx.in([tp.leftCard, tp.leftTitle, tp.leftSub], { from: 'up', d: 0.5 }), 'b1~dedicate-0.2');

  // ---------------------------------------------------------------- b2: Transformers spend 92% on GEMMs
  S.add(fx.in([tp.gemmBar, tp.normBar, tp.softBar], { from: 'fade', d: 0.4 }), 'b2~transformers:-0.2');
  tp.pElements.forEach((e, idx) => {
    S.add(fx.in([e.box, e.nl, e.vl], { from: 'fade', d: 0.35 }), `b2~transformers:-${0.1 - idx * 0.2}`);
  });
  S.add(fx.in(tp.leftPill, { from: 'up', d: 0.4 }), 'b2~ninety');
  S.add(fx.pulse([tp.leftCard, tp.gemmBar], { scale: 1.03, d: 0.4 }), 'b2~multiplication.');

  // ---------------------------------------------------------------- b3: Peak assumes zero stalls
  S.add(fx.in([tp.rightCard, tp.rightTitle, tp.rightSub], { from: 'up', d: 0.5 }), 'b3~Peak-0.2');
  S.add(fx.in([tp.eElements[0].box, tp.eElements[0].nl, tp.eElements[0].vl, tp.eElements[0].barTrack, tp.eElements[0].barFill], { from: 'fade', d: 0.4 }), 'b3~assumes');

  // ---------------------------------------------------------------- b4: 50% to 80% sustained efficiency
  S.add(fx.in([tp.eElements[1].box, tp.eElements[1].nl, tp.eElements[1].vl, tp.eElements[1].barTrack, tp.eElements[1].barFill], { from: 'fade', d: 0.4 }), 'b4~superbly-0.2');
  S.add(fx.in([tp.eElements[2].box, tp.eElements[2].nl, tp.eElements[2].vl, tp.eElements[2].barTrack, tp.eElements[2].barFill], { from: 'fade', d: 0.4 }), 'b4~tuned');
  S.add(fx.pulse([tp.eElements[1].box, tp.eElements[1].vl, tp.eElements[1].barFill], { scale: 1.03, d: 0.4 }), 'b4~eighty');
  S.add(fx.in(tp.rightPill, { from: 'up', d: 0.4 }), 'b4~software');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
