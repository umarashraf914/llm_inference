/* ch20_s03 · scale-up versus scale-out (fig 111)
   Movement 1 (b1): Clustering divides cleanly: scale up vs scale out.
   Movement 2 (b2): Scale-up connects GPUs inside single enclosure via NVSwitch.
   Movement 3 (b3): Scale-out connects separate chassis across room via network cables.
   Movement 4 (b4): Boundary penalty: crossing chassis drops bandwidth by 9x. */

V.scene('ch20_s03', S => {
  const { fx } = S;

  // Heading
  const heading = S.heading('scale-up versus scale-out', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Scale-up vs Scale-out Visual (Atlas Fig 111)
  const comp = ch20ScaleUpVsOut(S, { cx: 960, cy: 510 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('the scale-up versus scale-out boundary is the defining bottleneck of distributed AI', {
    tone: 'bytes'
  });

  // Initial states
  S.set([comp.leftBg, comp.leftTitle, comp.leftSub, comp.diagBg1, comp.swBox, comp.swLbl, comp.fBox1, comp.l1, comp.l2, comp.l3, comp.l4, comp.leftPill], { autoAlpha: 0 });
  comp.lGpus.forEach(g => S.set([g.gb, g.gl], { autoAlpha: 0 }));

  S.set([comp.rightBg, comp.rightTitle, comp.rightSub, comp.diagBg2, comp.boxA, comp.boxALbl1, comp.boxALbl2, comp.boxB, comp.boxBLbl1, comp.boxBLbl2], { autoAlpha: 0 });
  S.set([comp.cableL, comp.cableTag, comp.fBox2, comp.r1, comp.r2, comp.r3, comp.r4, comp.rightPill], { autoAlpha: 0 });

  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Two domains introduced
  S.add(fx.in([comp.leftBg, comp.leftTitle, comp.leftSub], { from: 'fade', d: 0.4 }), 'b1~divides-0.2');
  S.add(fx.in([comp.rightBg, comp.rightTitle, comp.rightSub], { from: 'fade', d: 0.4 }), 'b1~domains:-0.2');

  // ---------------------------------------------------------------- b2: Scale-up inside the chassis
  S.add(fx.in([comp.diagBg1, comp.swBox, comp.swLbl], { from: 'fade', d: 0.4 }), 'b2~connects-0.2');
  comp.lGpus.forEach((g, idx) => {
    S.add(fx.in([g.gb, g.gl], { from: 'fade', d: 0.35 }), `b2~connects:-${0.2 - idx * 0.04}`);
  });
  S.add(fx.in([comp.fBox1, comp.l1, comp.l2, comp.l3, comp.l4, comp.leftPill], { from: 'fade', d: 0.4 }), 'b2~switches.');

  // ---------------------------------------------------------------- b3: Scale-out between boxes
  S.add(fx.in([comp.diagBg2, comp.boxA, comp.boxALbl1, comp.boxALbl2, comp.boxB, comp.boxBLbl1, comp.boxBLbl2], { from: 'fade', d: 0.4 }), 'b3~separate-0.2');
  S.add(fx.in([comp.cableL, comp.cableTag], { from: 'fade', d: 0.4 }), 'b3~cables.');
  S.add(fx.in([comp.fBox2, comp.r1, comp.r2, comp.r3, comp.r4, comp.rightPill], { from: 'fade', d: 0.4 }), 'b3~cables.');

  // ---------------------------------------------------------------- b4: The 9x penalty boundary
  S.add(fx.pulse([comp.rightBg, comp.cableTag, comp.rightPill], { scale: 1.02, d: 0.45 }), 'b4~penalty');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
