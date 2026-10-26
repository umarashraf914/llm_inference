/* ch16_s03 · two real operations: array add versus matrix multiply (fig 87)
   Movement 1 (b1): How algorithm sets arithmetic intensity.
   Movement 2 (b2): Vector add: c[i] = a[i] + b[i] -> 0.17 op/byte (memory-bound).
   Movement 3 (b3): Matrix multiply: 1,024x1,024 -> 341 op/byte (compute-bound).
   Movement 4 (b4): 2,000x gap; chip sets the ridge, math sets the side. */

V.scene('ch16_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Two real operations: array add versus matrix multiply', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Algorithm comparison cards
  const ac = ch16AlgorithmCards(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('arithmetic intensity is a property of the algorithm, not the chip', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([ac.leftCard, ac.leftTitle, ac.leftSub, ac.leftPill], { autoAlpha: 0 });
  ac.lElements.forEach(e => S.set([e.box, e.lt], { autoAlpha: 0 }));
  S.set([ac.rightCard, ac.rightTitle, ac.rightSub, ac.rightPill], { autoAlpha: 0 });
  ac.rElements.forEach(e => S.set([e.box, e.rt], { autoAlpha: 0 }));
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Two algorithm cards appear
  S.add(fx.in([ac.leftCard, ac.leftTitle], { from: 'scale', d: 0.5 }), 'b1~basic-0.2');
  S.add(fx.in(ac.leftSub, { from: 'fade', d: 0.4 }), 'b1~operations');
  S.add(fx.in([ac.rightCard, ac.rightTitle], { from: 'scale', d: 0.5 }), 'b1~intensity-0.2');
  S.add(fx.in(ac.rightSub, { from: 'fade', d: 0.4 }), 'b1~intensity');

  // ---------------------------------------------------------------- b2: Vector addition (0.17 op/B)
  ac.lElements.forEach((e, idx) => {
    S.add(fx.in([e.box, e.lt], { from: 'fade', d: 0.35 }), `b2~Adding:-${0.2 - idx * 0.2}`);
  });
  S.add(fx.in(ac.leftPill, { from: 'up', d: 0.4 }), 'b2~addition,-0.2');
  S.add(fx.pulse([ac.leftCard, ac.leftPill], { scale: 1.04, d: 0.4 }), 'b2~seven');

  // ---------------------------------------------------------------- b3: Matrix multiplication (341 op/B)
  ac.rElements.forEach((e, idx) => {
    S.add(fx.in([e.box, e.rt], { from: 'fade', d: 0.35 }), `b3~Multiplying:-${0.2 - idx * 0.2}`);
  });
  S.add(fx.in(ac.rightPill, { from: 'up', d: 0.4 }), 'b3~billion-0.2');
  S.add(fx.pulse([ac.rightCard, ac.rightPill], { scale: 1.04, d: 0.4 }), 'b3~forty-one');

  // ---------------------------------------------------------------- b4: 2,000x gap & conclusion
  S.add(fx.pulse([ac.leftPill, ac.rightPill], { scale: 1.05, stagger: 0.1, d: 0.4 }), 'b4~thousand');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
