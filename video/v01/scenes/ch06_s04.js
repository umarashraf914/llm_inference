/* ch06_s04 · bandwidth is width times frequency (fig 74)
   b1  'bandwidth' in coral; a 'width' bracket and a ticking 'frequency' clock flank it; the equation builds
       in two lines, 'bandwidth =' / 'wires × bits per second per wire', then '÷ 8 → bytes per second'.
   b2  the laptop's pipe: 2 lanes (1 lane = 64 wires), dashes racing at 640 px/s; counter ≈ 96 → ≈ 100 GB/s.
   b3  the H100's pipe: 80 lanes, forty times taller, dashes at 87% of the speed (5.2 vs 6 billion bits/s);
       '40× the wires → ≈ 35× the bandwidth'; counter to 3.35 TB/s; then 'lanes to scale'.
   b4  the equation's 'wires' underlined in teal; the pipes shrink to the corner; the package returns with
       hair-thin wires and its memory slides in until it nearly touches the die: 'wide needs short'.
   Checks: 128 × 6e9 / 8 = 96 GB/s; 5,120 × 5.234e9 / 8 = 3.35 TB/s; 5,120 / 128 = 40; 3.35 TB / 96 GB = 34.9.
   Layout: equation y 92-260; upper pipe x 360-1480 at y 372 (10 px); lower pipe y 545-945 (400 px);
   names left of the pipes (x ≤ 330), counters right (x ≥ 1510). */
V.scene('ch06_s04', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = n => gsap.parseEase(n);
  const eO2 = E('power2.out');
  const ignoreIn = (els, a, b) => ch06Clock(S, a, b, t => els.forEach(e => (t > a && t < b ? e.setAttribute('data-audit', 'ignore') : e.removeAttribute('data-audit'))));

  // ================================================================ b1: the equation
  const eqG = S.g();
  const L1 = 132, L2 = 206;
  const wBw = S.measure('bandwidth', { size: 56, weight: 700, family: 'display' }), wEq = S.measure('=', { size: 56, weight: 700, family: 'display' });
  const x1 = 960 - (wBw + 22 + wEq) / 2;
  const bwWord = S.text('bandwidth', { x: x1, y: L1, size: 56, weight: 700, family: 'display', color: 'bytes' }, eqG);
  const eqSign = S.text('=', { x: x1 + wBw + 22, y: L1, size: 56, weight: 700, family: 'display', color: 'ink' }, eqG);
  S.add(fx.in(bwWord, { from: 'up', d: 0.6, dist: 18 }), 'b1~bandwidth-0.1');

  // 'width': a vertical bracket to the left, like the height of a bundle of wires
  const brX = x1 - 54;
  const widthG = S.g(null, eqG);
  const brPath = S.path({ d: `M${brX + 12},${L1 - 34} H${brX} V${L1 + 34} H${brX + 12}`, stroke: 'muted', sw: 3 }, widthG);
  S.text('width', { x: brX - 16, y: L1, size: 30, weight: 600, anchor: 'end', color: 'muted' }, widthG);
  S.set(widthG, { autoAlpha: 0 }, 0);
  S.add(fx.in(widthG, { from: 'right', d: 0.45, dist: 14 }), 'b1~width-0.1');
  S.add(fx.draw(brPath, { d: 0.45 }), 'b1~width-0.1');

  // 'frequency': a small clock whose hand ticks four times a second
  const CK = { x: x1 + wBw + 22 + wEq + 70, y: L1, r: 26 };
  const clockG = S.g(null, eqG);
  S.circle({ x: CK.x, y: CK.y, r: CK.r, fill: '#0c1326', stroke: 'muted', sw: 3 }, clockG);
  for (let k = 0; k < 12; k++) {
    const a = k * Math.PI / 6;
    S.line({ x1: CK.x + Math.sin(a) * (CK.r - 7), y1: CK.y - Math.cos(a) * (CK.r - 7), x2: CK.x + Math.sin(a) * (CK.r - 3), y2: CK.y - Math.cos(a) * (CK.r - 3), stroke: 'muted', sw: k % 3 ? 1.2 : 2 }, clockG);
  }
  const hand = S.line({ x1: CK.x, y1: CK.y, x2: CK.x, y2: CK.y - CK.r + 8, stroke: 'ink', sw: 3 }, clockG);
  S.circle({ x: CK.x, y: CK.y, r: 3.5, fill: 'ink' }, clockG);
  S.text('frequency', { x: CK.x + CK.r + 16, y: CK.y, size: 30, weight: 600, color: 'muted' }, clockG);
  clockG.querySelectorAll('line').forEach(l => l.setAttribute('data-audit', 'ignore'));
  S.set(clockG, { autoAlpha: 0 }, 0);
  S.add(fx.in(clockG, { from: 'left', d: 0.45, dist: 14 }), 'b1~frequency-0.1');
  ch06Clock(S, 0, S.duration, t => {
    const a = Math.floor(t * 4) * Math.PI / 6;
    hand.setAttribute('x2', (CK.x + Math.sin(a) * (CK.r - 8)).toFixed(2));
    hand.setAttribute('y2', (CK.y - Math.cos(a) * (CK.r - 8)).toFixed(2));
  });

  // line 2, each term lighting as it is spoken; then '÷ 8 → bytes per second' in coral
  const eq2 = S.equation([
    { t: 'wires', tone: 'ink' }, { t: '×', tone: 'muted' }, { t: 'bits per second per wire', tone: 'ink' },
    { t: '÷ 8 → bytes per second', tone: 'bytes' }], { x: 960, y: L2, size: 40, gap: 18 }, eqG);
  const [tWires, tTimes, tBits, tDiv] = eq2.parts;
  S.set(eq2.parts, { autoAlpha: 0 }, 0);
  S.add(fx.in(eqSign, { from: 'fade', d: 0.4 }), 'b1~how-0.1');
  const light = (el, at) => {
    S.add(fx.in(el, { from: 'up', d: 0.4, dist: 12 }), at);
    S.add(gsap.fromTo(el, { attr: { fill: S.tone('compute') } }, { attr: { fill: el.getAttribute('fill') }, duration: 0.7, ease: 'power2.out', immediateRender: false }), T(at) + 0.25);
  };
  light(tWires, 'b1~wires-0.15');
  S.add(fx.in(tTimes, { from: 'fade', d: 0.3 }), 'b1~times#2-0.1');
  light(tBits, 'b1~often-0.15');
  S.add(fx.in(tDiv, { from: 'left', d: 0.5, dist: 16 }), T('b1~sends') + 0.8);

  // ================================================================ the two pipes
  const PX0 = 360, PX1 = 1480, PL = PX1 - PX0, LANE = 5;
  const pipes = S.g();
  const rnd = S.rand(64);
  const makePipe = (o) => {
    const g = S.g(null, pipes);
    const h = o.lanes * LANE;
    const y0 = o.cy - h / 2;
    const body = S.rect({ x: PX0, y: y0, w: PL, h, r: Math.min(4, h / 4), fill: 'struct', fillOpacity: 0.05 }, g);
    const lanes = S.g(null, g);
    for (let j = 0; j < o.lanes; j++) S.line({ x1: PX0, y1: y0 + (j + 0.5) * LANE, x2: PX1, y2: y0 + (j + 0.5) * LANE, stroke: 'struct', strokeOpacity: 0.13, sw: 1, cap: 'butt' }, lanes);
    const dots = S.path({ d: '', fill: 'bytes' }, g);
    const outline = S.rect({ x: PX0 - 2, y: y0 - 2, w: PL + 4, h: h + 4, r: Math.min(6, h / 3), stroke: 'struct', strokeOpacity: 0.9, sw: 2 }, g);
    [lanes, dots].forEach(e => e.setAttribute('data-audit', 'ignore'));
    const phase = [...Array(o.lanes)].map(() => rnd() * o.sp);
    // dash k of lane j enters at t0 + (k·sp + φ)/v and runs to the far end: a steady, seek-safe stream
    const paint = t => {
      if (t < o.t0) { dots.setAttribute('d', ''); return; }
      let d = '';
      phase.forEach((ph, j) => {
        const s = o.v * (t - o.t0) - ph, yc = y0 + (j + 0.5) * LANE - o.dh / 2;
        for (let k = Math.max(0, Math.ceil((s - PL) / o.sp)); k <= Math.floor(s / o.sp); k++) {
          const x = PX0 + s - k * o.sp - o.dw;
          if (x < PX0) continue;
          d += `M${x.toFixed(1)},${yc.toFixed(1)}h${o.dw}v${o.dh}h${-o.dw}z`;
        }
      });
      dots.setAttribute('d', d);
    };
    Object.assign(g, { body, lanes, dots, outline, paint, y0, h, cy: o.cy });
    return g;
  };

  // ---------------------------------------------------------------- b2: the laptop's narrow pipe
  const V0 = 640;                                             // px/s for 6 billion bits a second per wire
  const tUp = T('b2') - 0.1;
  const up = makePipe({ lanes: 2, cy: 372, v: V0, sp: 46, dw: 12, dh: 3.4, t0: tUp + 0.5 });
  const upName = S.text('laptop', { x: 330, y: 372, size: 34, weight: 700, family: 'display', anchor: 'end', color: 'ink' }, pipes);
  const upWires = S.text('≈ 128 wires', { x: PX0, y: 334, size: 28, weight: 600, color: 'ink' }, pipes);
  const upRate = S.text('≈ 6 billion bits/s each', { x: PX1, y: 334, size: 28, weight: 600, anchor: 'end', color: 'ink' }, pipes);
  const upCap = S.text('narrow pipe, running fast', { x: PX0, y: 412, size: 28, weight: 550, color: 'muted' }, pipes);
  const upTag = S.text('typical laptop, rounded', { x: PX1, y: 412, size: 24, weight: 550, anchor: 'end', color: 'faint' }, pipes);
  [up, upName, upWires, upRate, upCap, upTag].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  S.add(gsap.fromTo(up, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, immediateRender: false }), tUp);
  S.add(fx.draw(up.outline, { d: 0.8 }), tUp);
  S.add(fx.in(upName, { from: 'right', d: 0.5, dist: 16 }), 'b2~laptop-0.1');
  S.add(fx.in(upCap, { from: 'up', d: 0.45, dist: 12 }), 'b2~narrow-0.1');
  S.add(fx.in(upWires, { from: 'up', d: 0.45, dist: 12 }), 'b2~pipe-0.1');
  S.add(fx.in(upRate, { from: 'up', d: 0.45, dist: 12 }), 'b2~running-0.1');
  // its counter runs to ≈ 96 GB/s, then rounds to ≈ 100 GB/s
  const upCnt = S.counter({ x: 1510, y: 372, size: 38, value: 0, color: 'bytes', prefix: '≈ ', suffix: ' GB/s', family: 'mono', weight: 650 }, pipes);
  const up100 = S.text('≈ 100 GB/s', { x: 1510, y: 372, size: 38, weight: 650, family: 'mono', color: 'bytes' }, pipes);
  S.set([upCnt, up100], { autoAlpha: 0 }, 0);
  const tC = T('b2~Not') - 0.1;
  S.add(fx.in(upCnt, { from: 'fade', d: 0.3 }), tC);
  ch06Clock(S, tC, tC + 1.3, t => { upCnt.textContent = `≈ ${Math.round(96 * eO2(cl((t - tC) / 1.3)))} GB/s`; });
  S.add(gsap.to(upCnt, { autoAlpha: 0, duration: 0.25 }), 'b2~hundred-0.1');
  S.add(fx.in(up100, { from: 'up', d: 0.35, dist: 10 }), 'b2~hundred');
  S.add(fx.in(upTag, { from: 'fade', d: 0.4 }), 'b2~gigabytes-0.1');

  // ---------------------------------------------------------------- b3: the H100's wide pipe
  const tLo = T('b3~wide') - 0.1;
  S.add(fx.dim([upWires, upRate, upCap, upTag, upName], { to: 0.3 }), tLo);
  S.add(fx.dim(eqG, { to: 0.4 }), tLo);
  const lo = makePipe({ lanes: 80, cy: 745, v: V0 * 5.2 / 6, sp: 46, dw: 10, dh: 2.4, t0: tLo + 0.45 });
  const loName = S.text('H100', { x: 330, y: 745, size: 34, weight: 700, family: 'display', anchor: 'end', color: 'ink' }, pipes);
  const loWires = S.text('5,120 wires', { x: PX0, y: 516, size: 28, weight: 600, color: 'ink' }, pipes);
  const loRate = S.text('≈ 5.2 billion bits/s each', { x: PX1, y: 516, size: 28, weight: 600, anchor: 'end', color: 'ink' }, pipes);
  // the caption sits on the pipe, on a dark plate
  const capW = S.measure('wide pipe, running steadily', { size: 30, weight: 600 }) + 44;
  const loCap = S.g(null, pipes);
  S.rect({ x: 920 - capW / 2, y: 745 - 28, w: capW, h: 56, r: 14, fill: '#0c1326', fillOpacity: 0.92, stroke: 'struct', strokeOpacity: 0.5, sw: 1.5 }, loCap);
  S.text('wide pipe, running steadily', { x: 920, y: 746, size: 30, weight: 600, anchor: 'middle', color: 'ink' }, loCap);
  const loCap2 = S.text('far more, at about the same clock', { x: PX0, y: 984, size: 28, weight: 550, color: 'muted' }, pipes);
  [lo, loName, loWires, loRate, loCap, loCap2].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  S.add(gsap.fromTo(lo, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, immediateRender: false }), tLo);
  S.add(gsap.fromTo(lo.body, { attr: { height: 0, y: 745 } }, { attr: { height: lo.h, y: lo.y0 }, duration: 0.9, ease: 'power3.inOut', immediateRender: false }), tLo);
  S.add(gsap.fromTo(lo.lanes, { scaleY: 0, transformOrigin: '50% 50%' }, { scaleY: 1, duration: 0.9, ease: 'power3.inOut', transformOrigin: '50% 50%', immediateRender: false }), tLo);
  S.add(fx.draw(lo.outline, { d: 0.9 }), tLo + 0.2);
  S.add(fx.in(loName, { from: 'right', d: 0.5, dist: 16 }), tLo + 0.2);
  S.add(fx.in(loCap, { from: 'fade', d: 0.5 }), 'b3~running-0.1');
  S.add(fx.in(loWires, { from: 'up', d: 0.45, dist: 12 }), 'b3~five-0.1');
  // '40× the wires → ≈ 35× the bandwidth', between the pipes
  const x40 = S.text([{ t: '40× the wires', c: 'ink' }, { t: '  →  ', c: 'muted' }, { t: '≈ 35× the bandwidth', c: 'bytes' }], { x: 920, y: 464, size: 30, weight: 650, anchor: 'middle' });
  S.set(x40, { autoAlpha: 0 }, 0);
  S.add(fx.in(x40, { from: 'up', d: 0.5, dist: 12 }), 'b3~wires-0.1');
  S.add(fx.in(loRate, { from: 'up', d: 0.45, dist: 12 }), 'b3~each-0.1');
  S.add(fx.in(loCap2, { from: 'up', d: 0.45, dist: 12 }), 'b3~slower-0.15');
  // its counter runs to 3.35 TB/s
  const loCnt = S.counter({ x: 1510, y: 745, size: 54, value: 0, color: 'bytes', suffix: ' TB/s', family: 'mono', weight: 700, fmt: v => Number(v).toFixed(2) }, pipes);
  S.set(loCnt, { autoAlpha: 0 }, 0);
  const tC2 = T('b3~for') - 0.05, tC2e = T('b3~second') + 0.1;
  S.add(fx.in(loCnt, { from: 'fade', d: 0.3 }), tC2);
  ch06Clock(S, tC2, tC2e, t => { loCnt.textContent = `${(3.35 * eO2(cl((t - tC2) / (tC2e - tC2)))).toFixed(2)} TB/s`; });
  const scaleTag = S.text('lanes to scale: 1 lane = 64 wires', { x: 920, y: 464, size: 26, weight: 550, anchor: 'middle', color: 'muted' });
  S.set(scaleTag, { autoAlpha: 0 }, 0);
  S.add(fx.out(x40, { d: 0.35 }), tC2e + 0.05);
  S.add(fx.in(scaleTag, { from: 'fade', d: 0.45 }), tC2e + 0.45);

  // one painter for both streams
  const paint = t => { up.paint(t); lo.paint(t); };
  paint(0);
  ch06Clock(S, 0, S.duration, paint);

  // ================================================================ b4: wider, so shorter
  const tW = T('b4~wider') - 0.15;
  S.add(gsap.to(eqG, { opacity: 1, duration: 0.5, ease: 'power2.out' }), tW - 0.3);
  const wUnder = S.line({ x1: tWires.l, y1: L2 + 28, x2: tWires.r, y2: L2 + 28, stroke: 'helps', sw: 4 });
  S.set(wUnder, { autoAlpha: 0 }, 0);
  S.add(fx.draw(wUnder, { d: 0.5 }), tW);
  // the pipes shrink into the bottom-left corner
  const tS = T('b4~long') - 0.45;
  const pipesAll = S.g();
  pipesAll.appendChild(pipes); pipesAll.appendChild(x40); pipesAll.appendChild(scaleTag);
  S.add(fx.xform(pipesAll, { x: -96, y: 52, s: 0.3, ox: 150, oy: 1000 }, { d: 1.0, ease: 'power3.inOut' }), tS);
  S.add(gsap.to(pipesAll, { opacity: 0.55, duration: 0.8 }), tS + 0.2);
  ignoreIn([pipesAll], tS, S.duration);
  // the package returns, its bus now hair-thin lines, and the memory slides in against the die
  const PS = 1.1;
  const pkg = ch06Package(S, { x: 1000, y: 640, s: PS, wires: 40, wireSw: 0.75 });
  S.set(pkg, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(pkg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, immediateRender: false }), tS + 0.55);
  S.add(pkg.drawOn({ d: 1.0 }), tS + 0.55);
  const GAP1 = 16, tG = T('b4~so') - 0.05;
  S.add(pkg.setGap(GAP1, { d: 1.0 }), tG);
  const bw0 = +pkg.board.getAttribute('width');
  S.add(gsap.fromTo(pkg.board, { attr: { width: bw0 } }, { attr: { width: bw0 - (170 - GAP1) }, duration: 1.0, ease: 'power2.inOut', immediateRender: false }), tG);
  const short = S.text('wide needs short', { x: 1000 - PS * (170 - GAP1) / 2, y: 950, size: 36, weight: 700, family: 'display', anchor: 'middle', color: 'ink' });
  S.set(short, { autoAlpha: 0 }, 0);
  S.add(fx.in(short, { from: 'up', d: 0.5, dist: 14 }), tG + 0.6);
  const hard = S.text("why it's hard: later this chapter", { x: tDiv.r, y: L2 + 48, size: 24, weight: 550, anchor: 'end', color: 'muted' });
  S.set(hard, { autoAlpha: 0 }, 0);
  S.add(fx.in(hard, { from: 'up', d: 0.4, dist: 10 }), T('b4~chip') - 0.1);
});
