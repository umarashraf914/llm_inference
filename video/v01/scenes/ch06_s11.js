/* ch06_s11 · the divergence, measured (fig 81)
   b1  axes; '2012' and '2022'; log gridlines 1×, 10×, 100× (300 px per ×10), 'each step up: ×10'; a white
       dot splits in two; the amber line rises to ×80.
   b2  the coral line rises to ×17; '≈ +55% a year', '≈ +33% a year'; a double arrow spans the gap at 2022:
       '80 ÷ 17 ≈ 4.7×', 'arithmetic per byte delivered'.
   b3  the corner tag 'schematic curves, real endpoints' brightens; both lines run on, dashed, to 2024 and
       keep pulling apart; the 4.7× pulses.
   Checks: log10(80)·300 = 571; log10(17)·300 = 369; log10(80/17)·300 = 202; 80^0.1 = 1.55; 17^0.1 = 1.33.
   Layout: 2012 at x 300, 2022 at x 1100 (80 px a year); 1× at y 880, 10× at 580, 100× at 280. */
V.scene('ch06_s11', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const X0 = 300, PXY = 80, Y0 = 880, PXD = 300;
  const X = yr => X0 + PXY * (yr - 2012), Y = f => Y0 - PXD * Math.log10(f);
  const growA = 80, growM = 17;
  const yA = yr => Y(Math.pow(growA, (yr - 2012) / 10)), yM = yr => Y(Math.pow(growM, (yr - 2012) / 10));

  // ================================================================ b1: the axes, the log scale, compute
  const axes = S.g();
  const yAxis = S.line({ x1: X0, y1: Y0 + 4, x2: X0, y2: 230, stroke: 'ink', strokeOpacity: 0.6, sw: 2.5 }, axes);
  const xAxis = S.line({ x1: X0 - 4, y1: Y0, x2: X(2024) + 30, y2: Y0, stroke: 'ink', strokeOpacity: 0.6, sw: 2.5 }, axes);
  S.add(fx.draw([yAxis, xAxis], { d: 0.8, stagger: 0.1 }), 0.5);
  const yTitle = S.text('growth since 2012 (log scale)', { x: X0, y: 200, size: 24, weight: 550, color: 'muted' });
  S.set(yTitle, { autoAlpha: 0 }, 0);
  S.add(fx.in(yTitle, { from: 'fade', d: 0.5 }), 0.9);
  const years = [2012, 2022].map(yr => S.text(String(yr), { x: X(yr), y: Y0 + 38, size: 30, weight: 650, family: 'mono', anchor: 'middle', color: 'ink' }));
  const tick22 = S.line({ x1: X(2022), y1: Y0, x2: X(2022), y2: Y0 + 12, stroke: 'ink', strokeOpacity: 0.6, sw: 2 });
  S.set([...years, tick22], { autoAlpha: 0 }, 0);
  S.add(fx.in([...years, tick22], { from: 'up', d: 0.45, dist: 10, stagger: 0.15 }), 'b1~decade-0.1');
  // gridlines at 1×, 10×, 100×
  const grid = S.g();
  [1, 10, 100].forEach(f => {
    if (f > 1) S.line({ x1: X0, y1: Y(f), x2: X(2024) + 30, y2: Y(f), stroke: 'ink', strokeOpacity: 0.12, sw: 1.5, dash: '6 8' }, grid);
    S.text(`${f}×`, { x: X0 - 18, y: Y(f), size: 28, weight: 650, family: 'mono', anchor: 'end', color: 'muted' }, grid);
  });
  const note = S.text('each step up: ×10', { x: X0 - 18, y: (Y(1) + Y(10)) / 2, size: 22, weight: 550, anchor: 'end', color: 'faint' }, grid);
  grid.querySelectorAll('line').forEach(e => e.setAttribute('data-audit', 'ignore'));
  S.set(grid, { autoAlpha: 0 }, 0);
  S.add(fx.in(grid, { from: 'fade', d: 0.6 }), 'b1~log-0.1');
  S.set(note, { autoAlpha: 0 }, 0);
  S.add(fx.in(note, { from: 'fade', d: 0.45 }), 'b1~multiplies-0.1');
  // the corner tag, faint from the start, brightened in b3
  const corner = S.text('schematic curves, real endpoints', { x: 1820, y: 130, size: 26, weight: 600, anchor: 'end', color: 'muted' });
  S.set(corner, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(corner, { autoAlpha: 0 }, { autoAlpha: 0.45, duration: 0.5, immediateRender: false }), 1.2);
  // one white dot at 2012, 1×, splitting into amber and coral
  const dotW = S.circle({ x: X0, y: Y0, r: 11, fill: 'white' });
  const dotA = S.circle({ x: X0, y: Y0, r: 9, fill: 'compute' }), dotM = S.circle({ x: X0, y: Y0, r: 9, fill: 'bytes' });
  S.set([dotW, dotA, dotM], { autoAlpha: 0 }, 0);
  const tDot = T('b1~each') - 0.1;
  S.add(gsap.fromTo(dotW, { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2)', transformOrigin: '50% 50%', immediateRender: false }), tDot);
  S.add(gsap.to(dotW, { autoAlpha: 0, duration: 0.2 }), tDot + 0.7);
  S.add(gsap.fromTo(dotA, { autoAlpha: 1, x: 0, y: 0 }, { x: -7, y: -7, duration: 0.4, ease: 'power2.out', immediateRender: false }), tDot + 0.7);
  S.add(gsap.fromTo(dotM, { autoAlpha: 1, x: 0, y: 0 }, { x: 7, y: 7, duration: 0.4, ease: 'power2.out', immediateRender: false }), tDot + 0.7);
  S.add(gsap.to([dotA, dotM], { x: 0, y: 0, duration: 0.35 }), T('b1~compute') - 0.2);
  // compute: a straight line on the log axis, to ×80
  const lineA = S.line({ x1: X0, y1: Y0, x2: X(2022), y2: yA(2022), stroke: 'compute', sw: 5 });
  const tipA = S.circle({ x: X(2022), y: yA(2022), r: 8, fill: 'compute' });
  const lblA = S.text('compute, ×80', { x: 1040, y: yA(2022) + 9, size: 34, weight: 700, anchor: 'end', color: 'compute' });
  S.set([lineA, tipA, lblA], { autoAlpha: 0 }, 0);
  const tA = T('b1~rose') - 0.1;
  S.add(fx.draw(lineA, { d: 1.2, ease: 'power1.inOut' }), tA);
  S.add(fx.in(tipA, { from: 'fade', d: 0.2 }), tA + 1.15);
  S.add(fx.in(lblA, { from: 'left', d: 0.45, dist: 14 }), 'b1~eighty+0.3');

  // ================================================================ b2: bandwidth, and the gap
  const lineM = S.line({ x1: X0, y1: Y0, x2: X(2022), y2: yM(2022), stroke: 'bytes', sw: 5 });
  const tipM = S.circle({ x: X(2022), y: yM(2022), r: 8, fill: 'bytes' });
  const lblM = S.text('bandwidth, ×17', { x: 1120, y: yM(2022) + 26, size: 34, weight: 700, color: 'bytes' });
  S.set([lineM, tipM, lblM], { autoAlpha: 0 }, 0);
  const tM = T('b2~rose') - 0.1;
  S.add(fx.draw(lineM, { d: 1.2, ease: 'power1.inOut' }), tM);
  S.add(fx.in(tipM, { from: 'fade', d: 0.2 }), tM + 1.15);
  S.add(fx.in(lblM, { from: 'left', d: 0.45, dist: 14 }), 'b2~seventeen');
  const rateA = S.text('≈ +55% a year', { x: 640, y: yA(2016.25) - 26, size: 26, weight: 600, anchor: 'end', color: 'compute' });
  const rateM = S.text('≈ +33% a year', { x: 760, y: yM(2017.75) + 34, size: 26, weight: 600, color: 'bytes' });
  S.set([rateA, rateM], { autoAlpha: 0 }, 0);
  S.add(fx.in([rateA, rateM], { from: 'fade', d: 0.45, stagger: 0.2 }), T('b2~times') + 0.1);
  // the gap at 2022: on a log axis, the vertical distance is the ratio
  const gx = X(2022);
  const gap = S.g();
  const gArrow = S.path({ d: `M${gx},${yA(2022) + 14} V${yM(2022) - 14} M${gx - 8},${yA(2022) + 26} L${gx},${yA(2022) + 14} L${gx + 8},${yA(2022) + 26} M${gx - 8},${yM(2022) - 26} L${gx},${yM(2022) - 14} L${gx + 8},${yM(2022) - 26}`, stroke: 'white', sw: 3 }, gap);
  const gMid = (yA(2022) + yM(2022)) / 2;
  const leader = S.line({ x1: gx + 10, y1: gMid, x2: 1288, y2: gMid, stroke: 'white', strokeOpacity: 0.5, sw: 1.5, dash: '4 5' }, gap);
  const gLbl = S.text('80 ÷ 17 ≈ 4.7×', { x: 1300, y: gMid, size: 40, weight: 750, family: 'display', color: 'white' }, gap);
  const gSub = S.text('arithmetic per byte delivered', { x: 1300, y: gMid + 40, size: 26, weight: 550, color: 'muted' });
  [gArrow, leader].forEach(e => e.setAttribute('data-audit', 'ignore'));
  S.set([gap, gSub], { autoAlpha: 0 }, 0);
  const tGap = T('b2~Eighty') - 0.05;
  S.add(gsap.fromTo(gap, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, immediateRender: false }), tGap);
  S.add(fx.draw(gArrow, { d: 0.45 }), tGap);
  S.add(fx.draw(leader, { d: 0.35 }), tGap + 0.35);
  S.add(gsap.fromTo(gLbl, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.45, immediateRender: false }), tGap + 0.5);
  S.set(gLbl, { autoAlpha: 0 }, 0);
  S.add(fx.in(gSub, { from: 'fade', d: 0.45 }), 'b2~four-0.1');

  // ================================================================ b3: real endpoints, still spreading
  S.add(gsap.to(corner, { autoAlpha: 1, duration: 0.4 }), 'b3~schematic-0.1');
  S.add(gsap.fromTo(corner, { scale: 1, transformOrigin: '100% 50%' }, { scale: 1.08, duration: 0.25, yoyo: true, repeat: 1, transformOrigin: '100% 50%', immediateRender: false }), 'b3~schematic');
  const extA = S.line({ x1: X(2022), y1: yA(2022), x2: X(2024), y2: yA(2024), stroke: 'compute', sw: 4, dash: '10 8', cap: 'butt' });
  const extM = S.line({ x1: X(2022), y1: yM(2022), x2: X(2024), y2: yM(2024), stroke: 'bytes', sw: 4, dash: '10 8', cap: 'butt' });
  [extA, extM].forEach(e => { e.setAttribute('data-audit', 'ignore'); S.set(e, { autoAlpha: 0 }, 0); });
  // reveal the dashed runs with a growing clip of their x2 (drawSVG would replace the dashes)
  const tExt = T('b3~still') - 0.1;
  S.add(gsap.fromTo([extA, extM], { autoAlpha: 1, attr: { x2: X(2022) } }, { attr: { x2: X(2024) }, duration: 0.9, ease: 'power2.out', immediateRender: false }), tExt);
  S.add(gsap.fromTo(extA, { attr: { y2: yA(2022) } }, { attr: { y2: yA(2024) }, duration: 0.9, ease: 'power2.out', immediateRender: false }), tExt);
  S.add(gsap.fromTo(extM, { attr: { y2: yM(2022) } }, { attr: { y2: yM(2024) }, duration: 0.9, ease: 'power2.out', immediateRender: false }), tExt);
  S.add(gsap.fromTo(gLbl, { scale: 1, transformOrigin: '0% 50%' }, { scale: 1.16, duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '0% 50%', immediateRender: false }), 'b3~factor-0.1');
});
