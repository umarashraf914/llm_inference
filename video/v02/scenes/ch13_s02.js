/* ch13_s02 · why context switching costs zero cycles (fig 67)
   Movement 1 (b1): CPU thread switch: save & reload to RAM burns cycles.
   Movement 2 (b2): GPU resident warp switch costs exactly 0 cycles.
   Movement 3 (b3): 65,536 registers give every thread a private physical slice.
   Movement 4 (b4): Paid in silicon area once, rather than cycles constantly. */

V.scene('ch13_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Why context switching costs zero cycles', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Context switch comparison
  const cs = ch13ContextSwitch(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('zero-cycle switching is paid in massive register silicon', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([cs.leftCard, cs.leftTitle, cs.leftSub, cs.leftPill], { autoAlpha: 0 });
  cs.lElements.forEach(e => S.set([e.box, e.lbl], { autoAlpha: 0 }));
  S.set([cs.rightCard, cs.rightTitle, cs.rightSub, cs.rightPill], { autoAlpha: 0 });
  cs.rElements.forEach(e => S.set([e.box, e.lbl], { autoAlpha: 0 }));
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: CPU expensive save/restore
  S.add(fx.in([cs.leftCard, cs.leftTitle], { from: 'scale', d: 0.5 }), 'b1~ordinary-0.2');
  S.add(fx.in(cs.leftSub, { from: 'fade', d: 0.4 }), 'b1~switching');
  cs.lElements.forEach((e, idx) => {
    S.add(fx.in([e.box, e.lbl], { from: 'up', d: 0.35 }), `b1~expensive.:-${0.2 - idx * 0.25}`);
  });
  S.add(fx.in(cs.leftPill, { from: 'up', d: 0.4 }), 'b1~reload');

  // ---------------------------------------------------------------- b2: GPU zero-cycle switch
  S.add(fx.in([cs.rightCard, cs.rightTitle], { from: 'scale', d: 0.5 }), 'b2~chip,-0.2');
  S.add(fx.in(cs.rightSub, { from: 'fade', d: 0.4 }), 'b2~resident');
  cs.rElements.forEach((e, idx) => {
    S.add(fx.in([e.box, e.lbl], { from: 'up', d: 0.35 }), `b2~zero:-${0.2 - idx * 0.25}`);
  });
  S.add(fx.pulse([cs.rightTitle, cs.rElements[3].box], { scale: 1.05, d: 0.4 }), 'b2~restored.');

  // ---------------------------------------------------------------- b3: 65,536 registers partition
  S.add(fx.pulse([cs.rightCard, cs.rightSub], { scale: 1.04, d: 0.4 }), 'b3~sixty-five');

  // ---------------------------------------------------------------- b4: Paid in silicon area once
  S.add(fx.in(cs.rightPill, { from: 'up', d: 0.4 }), 'b4~points-0.2');
  S.add(fx.pulse(cs.rightPill, { scale: 1.05, d: 0.4 }), 'b4~silicon');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
