/* ch13_s02 · why context switching costs zero cycles (fig 67)
   Movement 1 (b1): CPU context switch saves/reloads registers, burning dozens of cycles.
   Movement 2 (b2): GPU resident warp switch costs zero cycles; nothing saved or restored.
   Movement 3 (b3): 65,536 registers ensure every resident thread owns dedicated physical storage.
   Movement 4 (b4): Hardware pointer simply changes target; paid in silicon area, not cycles. */

V.scene('ch13_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('why context switching costs zero cycles', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // CPU vs GPU Context Switch (Atlas Fig 67)
  const sw = ch13ContextSwitch(S, { cx: GX, cy: 500 });

  // Takeaway band
  const takeaway = S.takeaway('zero-cycle switching is paid in massive register silicon', {
    tone: 'struct'
  });

  // Initial states
  S.set([sw.leftCard, sw.leftTitle, sw.leftSub, sw.leftPill], { autoAlpha: 0 });
  sw.lElements.forEach(e => S.set([e.box, e.lbl], { autoAlpha: 0 }));
  S.set([sw.rightCard, sw.rightTitle, sw.rightSub, sw.rightPill, takeaway.el], { autoAlpha: 0 });
  sw.rElements.forEach(e => S.set([e.box, e.lbl], { autoAlpha: 0 }));

  // ---------------------------------------------------------------- b1: CPU expensive switch
  S.add(fx.in([sw.leftCard, sw.leftTitle, sw.leftSub], { from: 'up', d: 0.5 }), 'b1~ordinary-0.2');
  sw.lElements.forEach((e, idx) => {
    S.add(fx.in([e.box, e.lbl], { from: 'fade', d: 0.4 }), `b1~thread's:-${0.2 - idx * 0.25}`);
  });
  S.add(fx.in(sw.leftPill, { from: 'up', d: 0.4 }), 'b1~another\'s.-0.2');
  S.add(fx.pulse([sw.leftCard, sw.leftPill], { scale: 1.05, d: 0.4 }), 'b1~another\'s.');

  // ---------------------------------------------------------------- b2: GPU zero-cycle switch
  S.add(fx.in([sw.rightCard, sw.rightTitle, sw.rightSub], { from: 'up', d: 0.5 }), 'b2~chip,-0.2');
  sw.rElements.forEach((e, idx) => {
    S.add(fx.in([e.box, e.lbl], { from: 'fade', d: 0.4 }), `b2~resident:-${0.2 - idx * 0.25}`);
  });
  S.add(fx.pulse([sw.rightCard, sw.rightTitle], { scale: 1.05, d: 0.4 }), 'b2~restored.');

  // ---------------------------------------------------------------- b3: 65,536 registers partition
  if (sw.rElements[0]) {
    S.add(fx.pulse([sw.rElements[0].box, sw.rElements[0].lbl], { scale: 1.06, d: 0.4 }), 'b3~sixty-five');
  }

  // ---------------------------------------------------------------- b4: Pointer changes target in silicon
  S.add(fx.in(sw.rightPill, { from: 'up', d: 0.4 }), 'b4~hardware-0.2');
  S.add(fx.pulse(sw.rightPill, { scale: 1.05, d: 0.4 }), 'b4~constantly.');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
