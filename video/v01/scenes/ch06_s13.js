/* ch06_s13 · the line to remember (fig 83)
   b1  four recap tiles rise along the bottom (s01's worker grid, the bus with its weight flow, three cards
       under ceilings, the two diverging lines), then a stack of papers; they dim. Two empty card outlines
       draw in the centre, amber and coral; a soft glow builds behind them.
   b2  the tiles leave; the amber card fills 'Arithmetic · cheap', the coral one 'Data movement · expensive';
       hold. */
V.scene('ch06_s13', S => {
  const { fx } = S;
  const T = s => S.t(s);

  // ================================================================ b1: the recap row
  const TW = 280, TH = 170, TY = 820, TX = [250, 570, 890, 1210];
  const tiles = TX.map(x => {
    const g = S.g();
    S.card({ x, y: TY, w: TW, h: TH, tone: 'neutral', r: 18 }, g);
    return g;
  });
  // 1: the amber worker grid
  ch06Grid(S, { x: TX[0] + 34, y: TY + 28, cols: 9, rows: 5, pitch: 24, sq: 19, fo: 0.75 }, tiles[0]);
  // 2: the bus, weights flowing from memory into the die
  const b = TX[1];
  S.rect({ x: b + 24, y: TY + 30, w: 96, h: 110, r: 8, fill: '#1a1408', stroke: 'compute', sw: 2.5 }, tiles[1]);
  [0, 1, 2].forEach(i => S.rect({ x: b + 196, y: TY + 30 + i * 38, w: 60, h: 32, r: 5, fill: '#2a1218', stroke: 'bytes', sw: 2 }, tiles[1]));
  const wires = [];
  for (let k = 0; k < 9; k++) {
    const y = TY + 38 + k * 12;
    S.line({ x1: b + 120, y1: y, x2: b + 196, y2: y, stroke: 'bytes', strokeOpacity: 0.45, sw: 1.4, cap: 'butt' }, tiles[1]);
    wires.push(y);
  }
  const flow = S.path({ d: '', fill: 'bytes' }, tiles[1]);
  flow.setAttribute('data-audit', 'ignore');
  ch06Clock(S, 0, S.duration, t => {
    let d = '';
    wires.forEach((y, k) => { for (let j = 0; j < 2; j++) { const u = ((t * 0.9 + k * 0.37 + j * 0.5) % 1); d += `M${(b + 190 - 66 * u).toFixed(1)},${y - 2.5}h7v5h-7z`; } });
    flow.setAttribute('d', d);
  });
  // 3: three coral cards under dashed ceilings
  [0, 1, 2].forEach(i => {
    const x = TX[2] + 30 + i * 80;
    S.rect({ x, y: TY + 72, w: 60, h: 72, r: 8, fill: '#2a1218', stroke: 'bytes', sw: 2 }, tiles[2]);
    S.line({ x1: x - 6, y1: TY + 60, x2: x + 66, y2: TY + 60, stroke: 'ink', strokeOpacity: 0.8, sw: 2.5, dash: '7 5', cap: 'butt' }, tiles[2]);
  });
  // 4: the two diverging lines
  const d0 = [TX[3] + 34, TY + 140];
  S.line({ x1: d0[0], y1: d0[1], x2: TX[3] + 250, y2: TY + 32, stroke: 'compute', sw: 4 }, tiles[3]);
  S.line({ x1: d0[0], y1: d0[1], x2: TX[3] + 250, y2: TY + 98, stroke: 'bytes', sw: 4 }, tiles[3]);
  S.circle({ x: d0[0], y: d0[1], r: 6, fill: 'white' }, tiles[3]);
  tiles.forEach(g => g.querySelectorAll('line').forEach(e => e.setAttribute('data-audit', 'ignore')));
  S.add(fx.in(tiles, { from: 'down', d: 0.6, dist: 120, stagger: 0.12 }), 'b1~Every-0.1');
  // a small stack of papers at the end of the row
  const papers = S.g();
  [0, 1, 2].forEach(k => S.icon('ph:article-duotone', { x: 1600 + k * 16, y: TY + TH / 2 - k * 14, size: 96, color: k === 2 ? 'struct' : 'muted', opacity: k === 2 ? 1 : 0.6 }, papers));
  S.add(fx.in(papers, { from: 'right', d: 0.6, dist: 60 }), 'b1~paper-0.15');
  S.add(gsap.to(tiles, { opacity: 0.32, duration: 0.6 }), T('b1~series') - 0.4);
  S.add(gsap.to(papers, { opacity: 0.32, duration: 0.6 }), T('b1~takes') - 0.1);

  // two empty card outlines draw in the centre; a soft glow builds behind them
  const CW = 640, CH = 380, CY = 320, CXA = 960 - CW - 30, CXM = 990;
  // soft glows: wide ellipses of the tone's radial fade, behind each card
  const glowA = S.el('ellipse', { cx: CXA + CW / 2, cy: CY + CH / 2, rx: CW * 0.68, ry: CH * 0.78, fill: 'url(#pglow-compute)', opacity: 0 });
  const glowM = S.el('ellipse', { cx: CXM + CW / 2, cy: CY + CH / 2, rx: CW * 0.68, ry: CH * 0.78, fill: 'url(#pglow-bytes)', opacity: 0 });
  const fillA = S.rect({ x: CXA, y: CY, w: CW, h: CH, r: 30, fill: 'url(#card-compute)' });
  const fillM = S.rect({ x: CXM, y: CY, w: CW, h: CH, r: 30, fill: 'url(#card-bytes)' });
  const outA = S.rect({ x: CXA, y: CY, w: CW, h: CH, r: 30, stroke: 'compute', sw: 3.5 });
  const outM = S.rect({ x: CXM, y: CY, w: CW, h: CH, r: 30, stroke: 'bytes', sw: 3.5 });
  [glowA, glowM].forEach(e => e.setAttribute('data-audit', 'ignore'));
  S.set([outA, outM, fillA, fillM], { autoAlpha: 0 }, 0);
  S.add(fx.draw([outA, outM], { d: 0.9, stagger: 0.15 }), 'b1~one line-0.05');
  S.add(gsap.fromTo([glowA, glowM], { attr: { opacity: 0 } }, { attr: { opacity: 0.5 }, duration: 1.4, ease: 'power2.inOut', immediateRender: false }), 'b1~remember-0.1');

  // ================================================================ b2: the line
  S.add(fx.out([...tiles, papers], { to: 'down', d: 0.6, dist: 60, stagger: 0.05 }), T('b2') - 0.35);
  const wordA = S.text('Arithmetic', { x: CXA + CW / 2, y: CY + CH / 2 - 40, size: 66, weight: 750, family: 'display', anchor: 'middle', color: 'compute' });
  const subA = S.text('cheap', { x: CXA + CW / 2, y: CY + CH / 2 + 62, size: 54, weight: 600, anchor: 'middle', color: 'ink' });
  const wordM = S.text('Data movement', { x: CXM + CW / 2, y: CY + CH / 2 - 40, size: 66, weight: 750, family: 'display', anchor: 'middle', color: 'bytes' });
  const subM = S.text('expensive', { x: CXM + CW / 2, y: CY + CH / 2 + 62, size: 54, weight: 600, anchor: 'middle', color: 'ink' });
  [wordA, subA, wordM, subM].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  S.add(fx.in(fillA, { from: 'fade', d: 0.5 }), 'b2~Arithmetic-0.1');
  S.add(fx.in(wordA, { from: 'up', d: 0.55, dist: 16 }), 'b2~Arithmetic-0.05');
  S.add(fx.in(subA, { from: 'up', d: 0.5, dist: 12 }), 'b2~cheap-0.1');
  S.add(fx.in(fillM, { from: 'fade', d: 0.5 }), 'b2~Data-0.1');
  S.add(fx.in(wordM, { from: 'up', d: 0.55, dist: 16 }), 'b2~Data-0.05');
  S.add(fx.in(subM, { from: 'up', d: 0.5, dist: 12 }), 'b2~expensive-0.1');
});
