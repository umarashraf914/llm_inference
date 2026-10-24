/* ch06_s12 · a name and a date (fig 82)
   b1  a timeline, 1995 → today (to scale, 47.7 px a year); the 1995 card 'Wulf and McKee, 1995' ('Hitting
       the Memory Wall'); the 2017 pill 'the transformer'; a bracket '22 years'.
   b2  the coral 'What changed' card at today; the thin coral band draws the whole length: 'the gap, always
       there'; 'not one concern among many'.
   b3  the early marks dim; a gauge 'hunger for bytes' swings to its coral end: 'language-model inference',
       '140 GB per token'.
   b4  the band becomes 'the memory wall'; three icons settle on it (an hourglass, a package with a gap,
       two diverging lines).
   b5  the band glows back to 1995; a walking figure tagged 'AI' comes in from the right and stops against it.
   Layout: timeline y 600, x 220 (1995) → 1700 (today, 2026); 2017 at x 1270. */
V.scene('ch06_s12', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const E = n => gsap.parseEase(n);
  const TL = { x0: 220, x1: 1700, y: 600, y0: 1995, y1: 2026 };
  const X = yr => TL.x0 + (TL.x1 - TL.x0) * (yr - TL.y0) / (TL.y1 - TL.y0);

  // ================================================================ b1: 1995, 2017
  const axis = S.line({ x1: TL.x0 - 30, y1: TL.y, x2: TL.x1 + 30, y2: TL.y, stroke: 'ink', strokeOpacity: 0.55, sw: 3 });
  S.set(axis, { autoAlpha: 0 }, 0);
  S.add(fx.draw(axis, { d: 1.3, ease: 'power2.inOut' }), 0.5);
  const tick = (yr, label, at) => {
    const g = S.g();
    S.line({ x1: X(yr), y1: TL.y - 10, x2: X(yr), y2: TL.y + 10, stroke: 'ink', strokeOpacity: 0.7, sw: 2.5 }, g);
    S.text(label, { x: X(yr), y: TL.y + 40, size: 30, weight: 650, family: label === 'today' ? 'sans' : 'mono', anchor: 'middle', color: 'ink' }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    S.add(fx.in(g, { from: 'up', d: 0.4, dist: 10 }), at);
    return g;
  };
  const t95 = tick(1995, '1995', 0.9), tNow = tick(2026, 'today', 1.6);
  // the 1995 card
  const card95 = S.g();
  S.card({ x: 150, y: 330, w: 470, h: 170, tone: 'struct', r: 22 }, card95);
  S.icon('ph:article-duotone', { x: 206, y: 386, size: 64, color: 'struct' }, card95);
  S.text('Wulf and McKee, 1995', { x: 252, y: 382, size: 32, weight: 700, color: 'ink' }, card95);
  S.text('Hitting the Memory Wall', { x: 252, y: 430, size: 26, weight: 550, color: 'muted', italic: true }, card95);
  S.line({ x1: X(1995), y1: 500, x2: X(1995), y2: TL.y - 12, stroke: 'struct', strokeOpacity: 0.7, sw: 2 }, card95);
  S.set(card95, { autoAlpha: 0 }, 0);
  S.add(fx.in(card95, { from: 'down', d: 0.6, dist: 24 }), 'b1~Wulf-0.15');
  S.add(gsap.fromTo(t95, { scale: 1, transformOrigin: '50% 0%' }, { scale: 1.18, duration: 0.25, yoyo: true, repeat: 1, transformOrigin: '50% 0%', immediateRender: false }), 'b1~nineteen');
  // the 2017 pill
  const t17 = tick(2017, '2017', 'b1~transformer-0.1');
  const pill17 = S.pill('the transformer', { x: X(2017), y: 520, tone: 'struct', size: 30, h: 56 });
  const stem17 = S.line({ x1: X(2017), y1: 548, x2: X(2017), y2: TL.y - 12, stroke: 'struct', strokeOpacity: 0.7, sw: 2 });
  S.set([pill17, stem17], { autoAlpha: 0 }, 0);
  S.add(fx.in([pill17, stem17], { from: 'down', d: 0.5, dist: 16 }), 'b1~transformer-0.1');
  // '22 years'
  const br = S.bracket({ x1: X(1995), x2: X(2017), y: TL.y + 70, label: '22 years', tone: 'muted', size: 28 });
  S.set(br, { autoAlpha: 0 }, 0);
  S.add(fx.in(br, { from: 'fade', d: 0.3 }), T('b1~design') - 0.1);
  S.add(fx.draw(br.line, { d: 0.6 }), T('b1~design') - 0.1);

  // ================================================================ b2: what changed; the gap was always there
  const cardW = S.g();
  S.card({ x: 1380, y: 210, w: 430, h: 210, tone: 'bytes', r: 22 }, cardW);
  S.text('What changed', { x: 1414, y: 262, size: 38, weight: 750, family: 'display', color: 'bytes' }, cardW);
  const notHw = S.text('not the hardware trend,', { x: 1414, y: 318, size: 28, weight: 550, color: 'muted' }, cardW);
  const wl = S.text('the workload', { x: 1414, y: 366, size: 32, weight: 700, color: 'ink' }, cardW);
  S.line({ x1: X(2026), y1: 420, x2: X(2026), y2: TL.y - 12, stroke: 'bytes', strokeOpacity: 0.7, sw: 2 }, cardW);
  S.set([cardW, notHw, wl], { autoAlpha: 0 }, 0);
  S.add(fx.in(cardW, { from: 'down', d: 0.6, dist: 24 }), 'b2~What-0.1');
  S.add(fx.in(wl, { from: 'up', d: 0.45, dist: 10 }), 'b2~workload-0.1');
  S.add(fx.in(notHw, { from: 'up', d: 0.45, dist: 10 }), 'b2~not-0.1');
  // the band, drawn from 1995 to today
  const BH = 16;
  const band = S.rect({ x: TL.x0, y: TL.y - BH / 2, w: 0, h: BH, r: 4, fill: 'bytes', fillOpacity: 0.55 });
  band.setAttribute('data-audit', 'ignore');
  const tBand = T('b2~always') - 0.15;
  S.add(gsap.fromTo(band, { attr: { width: 0 } }, { attr: { width: TL.x1 - TL.x0 }, duration: 1.1, ease: 'power2.inOut', immediateRender: false }), tBand);
  const LBX = (X(1995) + X(2017)) / 2;
  const gapLbl = S.text('the gap, always there', { x: LBX, y: TL.y - 34, size: 28, weight: 650, anchor: 'middle', color: 'bytes' });
  const wallLbl = S.text('the memory wall', { x: LBX, y: TL.y - 34, size: 32, weight: 750, anchor: 'middle', color: 'bytes' });
  S.set([gapLbl, wallLbl], { autoAlpha: 0 }, 0);
  S.add(fx.in(gapLbl, { from: 'up', d: 0.45, dist: 10 }), tBand + 0.7);
  const notOne = S.text('not one concern among many', { x: X(2026) - 16, y: 456, size: 24, weight: 550, anchor: 'end', color: 'muted' });
  S.set(notOne, { autoAlpha: 0 }, 0);
  S.add(fx.in(notOne, { from: 'up', d: 0.45, dist: 10 }), 'b2~dominant-0.1');

  // ================================================================ b3: hunger for bytes
  const tB3 = T('b3') - 0.1;
  S.add(gsap.to([card95, pill17, stem17, br, t17], { opacity: 0.3, duration: 0.5 }), tB3);
  const GC = { x: 1560, y: 880, r: 110 };
  const gauge = S.g();
  const arc = (a0, a1, tone, op) => {
    const p = a => [GC.x + GC.r * Math.cos(a), GC.y - GC.r * Math.sin(a)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return S.path({ d: `M${x0.toFixed(1)},${y0.toFixed(1)} A${GC.r},${GC.r} 0 0,1 ${x1.toFixed(1)},${y1.toFixed(1)}`, stroke: tone, strokeOpacity: op, sw: 16 }, gauge);
  };
  arc(Math.PI, Math.PI * 2 / 3 + 0.02, 'faint', 0.8);
  arc(Math.PI * 2 / 3 - 0.02, Math.PI / 3 + 0.02, 'muted', 0.7);
  arc(Math.PI / 3 - 0.02, 0, 'bytes', 0.95);
  gauge.querySelectorAll('path').forEach(e => { e.setAttribute('stroke-linecap', 'butt'); e.setAttribute('data-audit', 'ignore'); });
  const needle = S.g(null, gauge);
  S.line({ x1: GC.x, y1: GC.y, x2: GC.x, y2: GC.y - GC.r + 22, stroke: 'white', sw: 4 }, needle);
  S.circle({ x: GC.x, y: GC.y, r: 9, fill: 'white' }, gauge);
  needle.querySelector('line').setAttribute('data-audit', 'ignore');
  S.text('hunger for bytes', { x: GC.x, y: GC.y + 36, size: 28, weight: 650, anchor: 'middle', color: 'ink' }, gauge);
  const lmTag = S.text('language-model inference', { x: GC.x, y: GC.y + 74, size: 24, weight: 600, anchor: 'middle', color: 'bytes' });
  const perTok = S.pill('140 GB per token', { x: 1250, y: GC.y - 40, tone: 'bytes', size: 28, h: 54, mono: true });
  S.set([gauge, lmTag, perTok], { autoAlpha: 0 }, 0);
  S.add(fx.in(gauge, { from: 'fade', d: 0.5 }), tB3 + 0.1);
  S.add(gsap.fromTo(needle, { rotation: -78, svgOrigin: `${GC.x} ${GC.y}` }, { rotation: 74, svgOrigin: `${GC.x} ${GC.y}`, duration: 1.1, ease: 'back.out(1.6)', immediateRender: false }), 'b3~byte-hungry-0.4');
  S.set(needle, { rotation: -78, svgOrigin: `${GC.x} ${GC.y}` }, 0);
  S.add(fx.in(lmTag, { from: 'up', d: 0.45, dist: 10 }), 'b3~inference-0.1');
  S.add(fx.in(perTok, { from: 'right', d: 0.5, dist: 16 }), 'b3~workloads-0.1');

  // ================================================================ b4: the memory wall, three icons on it
  const tB4 = T('b4') - 0.1;
  S.add(gsap.to([gauge, lmTag, perTok, notOne], { opacity: 0.3, duration: 0.5 }), tB4);
  S.add(gsap.to(gapLbl, { autoAlpha: 0, duration: 0.3 }), 'b4~wall-0.25');
  S.add(fx.in(wallLbl, { from: 'up', d: 0.45, dist: 10 }), 'b4~wall');
  const IY = TL.y - BH / 2 - 34, IX = [700, 900, 1100];
  // an amber hourglass: arithmetic waiting
  const ic1 = S.g();
  S.icon('ph:hourglass-medium-duotone', { x: IX[0], y: IY - 4, size: 60, color: 'compute' }, ic1);
  // a tiny package with a gap between die and memory
  const ic2 = S.g();
  S.rect({ x: IX[1] - 30, y: IY - 22, w: 36, h: 36, r: 4, fill: '#1a1408', stroke: 'compute', sw: 2.5 }, ic2);
  [0, 1, 2].forEach(i => S.rect({ x: IX[1] + 16, y: IY - 22 + i * 12.5, w: 16, h: 11, r: 2, fill: '#2a1218', stroke: 'bytes', sw: 1.5 }, ic2));
  // two diverging lines, amber and coral
  const ic3 = S.g();
  S.path({ d: `M${IX[2] - 30},${IY + 20} L${IX[2] + 30},${IY - 26}`, stroke: 'compute', sw: 4 }, ic3);
  S.path({ d: `M${IX[2] - 30},${IY + 20} L${IX[2] + 30},${IY + 2}`, stroke: 'bytes', sw: 4 }, ic3);
  [ic2, ic3].forEach(g => g.querySelectorAll('path, rect').forEach(e => e.setAttribute('data-audit', 'ignore')));
  [ic1, ic2, ic3].forEach(g => S.set(g, { autoAlpha: 0 }, 0));
  S.add(fx.in(ic1, { from: 'down', d: 0.5, dist: 30, ease: 'bounce.out' }), 'b4~waiting-0.1');
  S.add(fx.in(ic2, { from: 'down', d: 0.5, dist: 30, ease: 'bounce.out' }), 'b4~apart-0.1');
  S.add(fx.in(ic3, { from: 'down', d: 0.5, dist: 30, ease: 'bounce.out' }), 'b4~growing-0.15');
  // the three icons sit above the band label's row, so the label moves under the band
  S.add(gsap.to(wallLbl, { y: 72, duration: 0.5, ease: 'power2.inOut' }), 'b4~waiting-0.5');

  // ================================================================ b5: a long-standing trend; AI walks in
  const glow = S.rect({ x: TL.x0, y: TL.y - BH / 2 - 6, w: TL.x1 - TL.x0, h: BH + 12, r: 8, fill: 'bytes', fillOpacity: 0 });
  glow.setAttribute('data-audit', 'ignore');
  const tGlow = T('b5~long-standing') - 0.1;
  // the glow runs from today back to 1995
  ch06Clock(S, tGlow, tGlow + 1.6, t => {
    const u = cl((t - tGlow) / 1.1), f = 1 - cl((t - tGlow - 1.1) / 0.5) * 0.5;
    const w = (TL.x1 - TL.x0) * E('power2.out')(u);
    glow.setAttribute('x', (TL.x1 - w).toFixed(1)); glow.setAttribute('width', w.toFixed(1));
    glow.setAttribute('fill-opacity', (0.32 * f * (u > 0 ? 1 : 0)).toFixed(3));
  });
  const ai = S.g(), aiIn = S.g(null, ai);
  const WX = TL.x1 + 46;                                          // its front edge stops at the band's end
  const walker = S.g({ transform: `translate(${2 * WX},0) scale(-1,1)` }, aiIn);
  S.icon('ph:person-simple-walk-duotone', { x: WX, y: TL.y - 50, size: 110, color: 'ink' }, walker);
  S.text('AI', { x: WX, y: TL.y - 128, size: 32, weight: 800, family: 'display', anchor: 'middle', color: 'ink' }, aiIn);
  S.set(ai, { autoAlpha: 0 }, 0);
  const tWalk = T('b5~walked') - 0.2;
  ch06Clock(S, tWalk - 0.01, tWalk + 1.0, t => (t > tWalk - 0.01 && t < tWalk + 1.0 ? ai.setAttribute('data-audit', 'ignore') : ai.removeAttribute('data-audit')));   // enters from off the right edge
  S.add(gsap.fromTo(ai, { autoAlpha: 1, x: 220 }, { x: 0, duration: 1.0, ease: 'power1.in', immediateRender: false }), tWalk);
  S.add(gsap.fromTo(ai, { x: 0 }, { x: 8, duration: 0.35, ease: 'power2.out', immediateRender: false }), tWalk + 1.0);
  S.add(gsap.fromTo(band, { attr: { 'fill-opacity': 0.55 } }, { attr: { 'fill-opacity': 0.9 }, duration: 0.18, yoyo: true, repeat: 1, immediateRender: false }), tWalk + 1.0);
  // the walker's step: a small bob while it walks
  ch06Clock(S, tWalk, tWalk + 1.0, t => aiIn.setAttribute('transform', `translate(0,${(-5 * Math.abs(Math.sin((t - tWalk) * 14))).toFixed(2)})`));
});
