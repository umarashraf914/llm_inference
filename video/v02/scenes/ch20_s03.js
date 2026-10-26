/* ch20_s03 · scale-up versus scale-out (fig 111)
   Movement 1 (b1): Clustering divides cleanly: scale up vs scale out.
   Movement 2 (b2): Scale-up connects GPUs inside single enclosure via NVSwitch.
   Movement 3 (b3): Scale-out connects separate chassis across room via network cables.
   Movement 4 (b4): Boundary penalty: crossing chassis drops bandwidth by 9x. */

V.scene('ch20_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Scale-up versus scale-out', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Scale-up vs Scale-out Visual
  const comp = ch20ScaleUpVsOut(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('the scale-up versus scale-out boundary is the defining bottleneck of distributed AI', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([comp.leftCard, comp.leftTitle, comp.leftSub, comp.leftPill], { autoAlpha: 0 });
  comp.lElements.forEach(el => S.set([el.box, el.lt], { autoAlpha: 0 }));

  S.set([comp.rightCard, comp.rightTitle, comp.rightSub, comp.rightPill], { autoAlpha: 0 });
  comp.rElements.forEach(el => S.set([el.box, el.rt], { autoAlpha: 0 }));

  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Two domains introduced
  S.add(fx.in([comp.leftCard, comp.leftTitle], { from: 'scale', d: 0.4 }), 'b1~divides-0.2');
  S.add(fx.in(comp.leftSub, { from: 'fade', d: 0.35 }), 'b1~divides');
  S.add(fx.in([comp.rightCard, comp.rightTitle], { from: 'scale', d: 0.4 }), 'b1~domains:-0.2');
  S.add(fx.in(comp.rightSub, { from: 'fade', d: 0.35 }), 'b1~domains:');

  // ---------------------------------------------------------------- b2: Scale-up inside the box
  comp.lElements.forEach((el, idx) => {
    S.add(fx.in(el.box, { from: 'scale', d: 0.35 }), `b2~connects:-${0.2 - idx * 0.1}`);
    S.add(fx.in(el.lt, { from: 'fade', d: 0.35 }), `b2~connects:-${0.2 - idx * 0.1}`);
  });
  S.add(fx.in(comp.leftPill, { from: 'up', d: 0.4 }), 'b2~switches.');

  // ---------------------------------------------------------------- b3: Scale-out between boxes
  comp.rElements.forEach((el, idx) => {
    S.add(fx.in(el.box, { from: 'scale', d: 0.35 }), `b3~separate:-${0.2 - idx * 0.1}`);
    S.add(fx.in(el.rt, { from: 'fade', d: 0.35 }), `b3~separate:-${0.2 - idx * 0.1}`);
  });
  S.add(fx.in(comp.rightPill, { from: 'up', d: 0.4 }), 'b3~cables.');

  // ---------------------------------------------------------------- b4: The 9x penalty boundary
  S.add(fx.pulse([comp.rightCard, comp.rightPill], { scale: 1.04, d: 0.45 }), 'b4~penalty');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
