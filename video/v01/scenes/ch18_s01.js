/* ch18_s01 · the gap is one division (fig 146)
   Three bands that never clear. Top: the puzzle bar, 30 ms in coral with its 0.1 ms amber sliver, '× 300'.
   Centre: the division that makes the gap, (peak ÷ bandwidth) ÷ 1 op per byte = ?, built term by term.
   Bottom: the same division with numbers, one row per chip (H100 295, H200 206), aligned column by column
   under the words, which then fade to a faint skeleton. Last, the bar corrects itself to the real numbers:
   0.14 ms of arithmetic, 29.2 ms per token, a gap of 206.
   Composed from the centre: the bar and its tag are one picture, centred (the bar starts at x 154); the camera
   holds the puzzle at the centre in b1, the puzzle and the division in b2, and all three bands from b3.
   Every number here is checked in script/ch18.json (checks). */
V.scene('ch18_s01', S => {
  const { fx } = S;

  // ---------------------------------------------------------------- the numbers
  const PEAK = 989, BW1 = 3.35, BW2 = 4.8;               // TFLOP/s dense 16-bit; TB/s (H100, H200)
  const GAP1 = PEAK / BW1;                               // 295.2 ops per byte
  const GAP2 = PEAK / BW2;                               // 206.0
  const MS = 30, ARITH = 0.1;                            // the puzzle's round numbers
  const MS_REAL = 140e9 / 4.8e12 * 1e3;                  // 29.17 ms (140 GB ÷ 4.8 TB/s)
  const ARITH_REAL = 140e9 / 989e12 * 1e3;               // 0.1416 ms (140 GFLOP ÷ 989 TFLOP/s)

  // a value driven 0 → 1 as a pure function of time (seek-safe), for paths that draw and re-route
  const drive = (apply, d, ease = 'power2.inOut') => {
    const p = { v: 0 }, go = () => apply(p.v);
    return gsap.fromTo(p, { v: 0 }, { v: 1, duration: d, ease, immediateRender: false, onStart: go, onUpdate: go, onReverseComplete: () => apply(0) });
  };
  const lerp = (a, b, f) => a + (b - a) * f;

  // ================================================================ top band: the puzzle bar (y 90-300)
  const BAR = { x0: 154, y: 160, h: 60, w: 1500 };        // 1,500 px = 30 ms, 50 px per ms: 0.1 ms is 5 px; with its tag, centred
  const X = ms => BAR.x0 + ms * BAR.w / MS;
  const BCY = BAR.y + BAR.h / 2;
  const sc = libScaleCompare(S, {
    layout: 'inline', x: BAR.x0, y: BAR.y, w: BAR.w, h: BAR.h, max: MS, hairline: 1.5,
    items: [{ value: MS, tone: 'bytes', style: 'solid' }, { value: ARITH, tone: 'compute', style: 'solid' }],
  });
  // a soft amber bloom that lights the sliver as it is named
  const bloom = S.circle({ x: X(ARITH) - 2, y: BCY, r: 46, fill: 'url(#pglow-compute)' });
  S.set(bloom, { autoAlpha: 0 }, 0);

  // the dimension line under the bar: it trims with the bar at the end
  const DIM_Y = 242;
  const dim = S.g();
  const dimLine = S.line({ x1: X(0), y1: DIM_Y, x2: X(MS), y2: DIM_Y, stroke: 'ink', sw: 2, strokeOpacity: 0.8 }, dim);
  const tickL = S.line({ x1: X(0), y1: DIM_Y - 11, x2: X(0), y2: DIM_Y + 11, stroke: 'ink', sw: 2, strokeOpacity: 0.8 }, dim);
  const tickR = S.line({ x1: X(MS), y1: DIM_Y - 11, x2: X(MS), y2: DIM_Y + 11, stroke: 'ink', sw: 2, strokeOpacity: 0.8 }, dim);
  S.set([dimLine], { autoAlpha: 0 }, 0);                 // fx.draw would leave a round-capped dot before it runs
  const lbl30 = S.text('30 ms per token', { x: (X(0) + X(MS)) / 2, y: 278, size: 30, weight: 600, anchor: 'middle', color: 'ink' });

  // '0.1 ms arithmetic' above the sliver, on a short amber leader to its top
  const sliverCx = ms => (X(0) + X(ms)) / 2;
  const arith = S.g();
  S.text('0.1 ms arithmetic', { x: X(0) - 14, y: 118, size: 28, weight: 600, color: 'compute' }, arith);
  const leader1 = S.line({ x1: sliverCx(ARITH), y1: 137, x2: sliverCx(ARITH), y2: 155, stroke: 'compute', sw: 2.5 }, arith);
  S.set(leader1, { autoAlpha: 0 }, 0);

  // 'that gap': a grey bracket over the coral part
  const gapBr = S.path({ d: `M${X(0) + 30},155 V144 H${X(MS)} V155`, stroke: 'muted', sw: 2.5, join: 'miter', cap: 'butt' });

  // the tag '× 300' just right of the bar's end (a group: it is struck, slid and rolled at the end)
  const TAG = { x: X(MS) + 18, y: BCY + 1, size: 34 };
  const tagG = S.g();
  const tag = S.text('× 300', { x: TAG.x, y: TAG.y, size: TAG.size, weight: 650, color: 'muted', tnum: true }, tagG);
  const tagW = S.measure('× 300', { size: TAG.size, weight: 650 });
  const tagCx = TAG.x + tagW / 2, tagBottom = TAG.y + 24;

  // ================================================================ b1: thirty milliseconds, a tenth of one
  // While the puzzle is the whole story, it sits at the centre of the frame; on 'It is a division' the camera
  // eases so the bar rises and the ÷ arrives below it, the two bands centred together (y 160-580, centre 370);
  // as the rows begin in b3 it eases on to the full layout.
  const PUZZLE_CY = 198;                                  // centre of the bar with its labels (y 100-296)
  S.xset(S.camera, { x: 0, y: 540 - PUZZLE_CY, s: 1 });
  const tSweep = S.t('b1~Thirty-0.15'), tSliver = S.t('b1~tenth-0.1');
  S.add(sc.in({ d: 0.95, stagger: tSliver - tSweep }), tSweep);
  S.add(fx.draw(dimLine, { d: 0.8, ease: 'power2.out' }), 'b1~milliseconds-0.2');
  S.add(fx.in([tickL, tickR], { from: 'fade', d: 0.3, stagger: 0.55 }), 'b1~milliseconds-0.2');
  S.add(fx.in(lbl30, { from: 'up', d: 0.6 }), 'b1~milliseconds+0.1');
  S.add(gsap.timeline().fromTo(bloom, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' })
    .to(bloom, { autoAlpha: 0.35, duration: 0.9, ease: 'power2.inOut' }), 'b1~tenth-0.05');
  S.add(fx.in(arith.children[0], { from: 'down', d: 0.55, dist: 18 }), 'b1~tenth+0.05');
  S.add(fx.draw(leader1, { d: 0.35, from: '100% 100%' }), 'b1~of+0.05');
  S.add(fx.pulse(bloom, { scale: 1.25, d: 0.6 }), 'b1~arithmetic');

  // 'That gap': the bracket draws over the coral part, then '× 300' clicks on
  S.add(fx.draw(gapBr, { d: 0.75, ease: 'power2.inOut' }), 'b1~gap-0.25');
  S.add(fx.pop(tag, { d: 0.45, from: 0.5 }), 'b1~gap+0.45');

  // 'a division': the labels and the bracket go, the ÷ waits at centre stage
  S.add(fx.out([lbl30, arith, gapBr], { d: 0.4 }), 'b1~division-0.3');
  S.add(fx.cam({ y: 370, d: 1.3, ease: 'power2.inOut' }), 'b1~It is-0.05');
  S.add(gsap.to(bloom, { autoAlpha: 0, duration: 0.4 }), 'b1~division-0.3');

  // ================================================================ the division and its two rows: geometry
  const EQ_Y = 440;                                       // the fraction line and the sign axis
  const R1 = 752, R2 = 874;                               // the H100 and H200 rows
  const NUM = { size: CH18.num, weight: 600, family: 'mono' };
  const SIGN = { size: 54, weight: 500, family: 'sans' };
  const WORD = { size: CH18.word, weight: 650 };
  const mw = (t, f) => S.measure(t, f);
  const wSign = mw('÷', SIGN), gIn = 22, G = 52;
  const fracL = gIn + wSign / 2 + mw('989', NUM);          // a row's '989 ÷ 3.35', about its inner ÷
  const fracR = gIn + wSign / 2 + mw('3.35', NUM);
  const wordW = mw('bandwidth', WORD);
  const fracHalf = wordW / 2 + 14;                         // the fraction line's half length
  const CHIP = { text: '1 op per byte', size: 34 };
  const chipW = Math.ceil(mw(CHIP.text, { size: CHIP.size, weight: 600 }) + CHIP.size * (1.15 + 0.45 + 1.6));
  const resHalf = mw('295', NUM) / 2;
  const gpuW = CH18.gpu.size * 2.04, nameW = mw('H100', { size: CH18.gpu.labelSize, weight: 650 });
  const WATCH = { size: 64, gap: 64, w: 64 + 14 + mw('29.2 ms', { size: 34, weight: 600, family: 'mono' }) + 30 };
  // columns left to right, relative to FX (the fraction's centre); then the whole block is centred at 960
  const rel = {};
  rel.F = 0;
  rel.D = Math.max(fracHalf, fracR) + G + wSign / 2;
  rel.C = rel.D + wSign / 2 + G + chipW / 2;
  rel.E = rel.C + chipW / 2 + G + wSign / 2;
  rel.R = rel.E + wSign / 2 + G + resHalf;
  rel.lab = -Math.max(fracHalf, fracL) - 76 - (gpuW + 18 + nameW);     // left edge of the GPU icon
  rel.watch = rel.R + resHalf + WATCH.gap;                              // left edge of the stopwatch
  const right = rel.watch + WATCH.w;
  const FX = Math.round(960 - (rel.lab + right) / 2);
  const DX = FX + rel.D, CX = FX + rel.C, EX = FX + rel.E, RX = FX + rel.R;
  const LABX = FX + rel.lab, WX = FX + rel.watch;

  // ================================================================ b2: peak over bandwidth, ÷ 1 op per byte
  const eq = S.g();
  const divSign = S.text('÷', { x: DX, y: EQ_Y, size: 60, weight: 500, anchor: 'middle', color: 'ink' }, eq);
  S.add(fx.in(divSign, { from: 'scale', scale: 0.6, d: 0.6 }), 'b1~division-0.05');

  const peakT = S.text('peak', { x: FX, y: EQ_Y - 52, ...WORD, anchor: 'middle', color: 'compute' }, eq);
  const fracLine = S.line({ x1: FX - fracHalf, y1: EQ_Y, x2: FX + fracHalf, y2: EQ_Y, stroke: 'ink', sw: 3 }, eq);
  S.set(fracLine, { autoAlpha: 0 }, 0);
  const bwT = S.text('bandwidth', { x: FX, y: EQ_Y + 50, ...WORD, anchor: 'middle', color: 'bytes' }, eq);
  S.add(fx.in(peakT, { from: 'down', d: 0.6, dist: 24 }), 'b2~peak-0.15');
  S.add(fx.draw(fracLine, { d: 0.45, from: '50% 50%' }), 'b2~bandwidth-0.3');
  S.add(fx.in(bwT, { from: 'up', d: 0.6, dist: 24 }), 'b2~bandwidth-0.15');

  // a bracket hugging a term from below, its label under it
  const underBracket = (x1, x2, yTop, label) => {
    const g = S.g(null, eq);
    g.line = S.path({ d: `M${x1},${yTop} V${yTop + 13} H${x2} V${yTop}`, stroke: 'muted', sw: 2.5, join: 'miter', cap: 'butt' }, g);
    g.label = S.text(label, { x: (x1 + x2) / 2, y: yTop + 44, size: 28, weight: 600, anchor: 'middle', color: 'muted' }, g);
    return g;
  };
  const ridgeBr = underBracket(FX - fracHalf, FX + fracHalf, EQ_Y + 82, 'ridge');
  S.add(fx.draw(ridgeBr.line, { d: 0.5 }), "b2~chip's-0.1");
  S.add(fx.in(ridgeBr.label, { from: 'up', d: 0.5, dist: 14 }), 'b2~ridge-0.1');

  // 'Divide by': the ÷ answers; 'one property of the workload': the white chip slides in beside it
  S.add(fx.pulse(divSign, { scale: 1.25, d: 0.5 }), 'b2~Divide');
  const chip = ch18Chip(S, { x: CX, y: EQ_Y, w: chipW, parts: [CHIP.text], family: 'sans', size: CHIP.size, tone: 'neutral', lead: true }, eq);
  S.add(fx.in(chip, { from: 'right', d: 0.7, dist: 40 }), 'b2~one property-0.15');
  const decodeBr = underBracket(chip.l + 6, chip.r - 6, chip.b + 12, 'decode');
  S.add(fx.draw(decodeBr.line, { d: 0.45 }), "b2~decode's-0.2");
  S.add(fx.in(decodeBr.label, { from: 'up', d: 0.5, dist: 14 }), "b2~decode's");
  S.add(chip.leadEl.glow({ tone: 'struct', hold: 0.5 }), 'b2~one operation');
  S.add(chip.pulse({ scale: 1.05, d: 0.5 }), 'b2~one operation');

  // 'and that is the gap': '= ?', and a thin white line ties the '?' to '× 300'
  const eqSign = S.text('=', { x: EX, y: EQ_Y, ...SIGN, size: 60, anchor: 'middle', color: 'ink' }, eq);
  const qMark = S.text('?', { x: RX, y: EQ_Y, ...NUM, size: 60, anchor: 'middle', color: 'ink' }, eq);
  S.add(fx.in(eqSign, { from: 'left', d: 0.5, dist: 20 }), 'b2~and that-0.1');
  S.add(fx.pop(qMark, { d: 0.5 }), 'b2~that+0.05');

  // the tie: an orthogonal polyline that draws on, re-routes and fades as a pure function of time
  const RAIL = tagCx;                                     // the tie rises into the tag's bottom centre
  const SRC_X = RX + resHalf + 16;                        // the tie leaves just right of the result column
  const polyD = (pts, frac = 1) => {
    const seg = [];
    let L = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
    let left = L * frac, d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length && left > 0; i++) {
      const f = Math.min(1, left / (seg[i - 1] || 1));
      d += ` L${lerp(pts[i - 1][0], pts[i][0], f).toFixed(1)},${lerp(pts[i - 1][1], pts[i][1], f).toFixed(1)}`;
      left -= seg[i - 1];
    }
    return d;
  };
  const makeTie = () => {
    const g = S.g();
    g.path = S.path({ d: 'M0,0', stroke: 'ink', sw: 2.5, strokeOpacity: 0.85, join: 'round' }, g);
    g.dot = S.circle({ x: 0, y: 0, r: 5, fill: 'ink' }, g);
    g.set = (pts, frac) => {
      g.path.setAttribute('d', polyD(pts, frac));
      g.dot.setAttribute('cx', pts[0][0].toFixed(1)); g.dot.setAttribute('cy', pts[0][1].toFixed(1));
    };
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  };
  const qHalf = S.measure('?', { ...NUM, size: 60 }) / 2;
  const tieA = [[RX + qHalf + 18, EQ_Y], [RAIL, EQ_Y], [RAIL, tagBottom]];   // '?' → '× 300'
  const tieB = [[SRC_X, R1], [RAIL, R1], [RAIL, tagBottom]];             // '295' → '× 300'
  const tie = makeTie();
  tie.set(tieA, 0);
  S.add(gsap.set(tie, { autoAlpha: 1 }), 'b2~that+0.15');
  S.add(drive(f => tie.set(tieA, f), 0.6, 'power2.inOut'), 'b2~that+0.15');
  S.add(fx.pulse(tag, { scale: 1.18, d: 0.5 }), 'b2~gap');

  // ================================================================ b3: the rows, one chip each
  S.add(fx.out([ridgeBr, decodeBr], { d: 0.4 }), 'b2>-0.1');

  const row = (y, name, bw, seed) => {
    const r = { y, g: S.g() };
    r.gpu = ch18Gpu(S, { x: LABX + gpuW / 2, y, label: name, seed }, r.g);
    r.peak = S.text('989', { x: FX - gIn - wSign / 2, y, ...NUM, anchor: 'end', color: 'compute' }, r.g);
    r.div1 = S.text('÷', { x: FX, y, ...SIGN, anchor: 'middle', color: 'muted' }, r.g);
    r.bw = S.text(String(bw), { x: FX + gIn + wSign / 2, y, ...NUM, color: 'bytes' }, r.g);
    r.div2 = S.text('÷', { x: DX, y, ...SIGN, anchor: 'middle', color: 'muted' }, r.g);
    r.one = S.text('1', { x: CX, y, ...NUM, anchor: 'middle', color: 'ink' }, r.g);
    r.eq = S.text('=', { x: EX, y, ...SIGN, anchor: 'middle', color: 'muted' }, r.g);
    r.res = S.counter({ x: RX, y, ...NUM, anchor: 'middle', color: 'ink', value: 0 }, r.g);
    r.terms = [r.peak, r.div1, r.bw, r.div2, r.one, r.eq];
    return r;
  };
  const h100 = row(R1, 'H100', '3.35', 7);
  const h200 = row(R2, 'H200', '4.8', 11);
  S.set([h100.res, h200.res], { autoAlpha: 0 }, 0);

  // 'Two hundred and ninety-five on an H one hundred'
  const writeRow = (r, at) => {
    S.add(fx.in(r.gpu, { from: 'left', d: 0.6, dist: 30 }), `${at}-0.25`);
    S.add(fx.in(r.terms, { from: 'down', d: 0.45, dist: 16, stagger: 0.09 }), `${at}+0.05`);
  };
  S.add(fx.cam({ d: 0.9, ease: 'power2.inOut' }), S.t('b3~Two') - 0.4);
  writeRow(h100, 'b3~Two');
  S.add(gsap.set(h100.res, { autoAlpha: 1 }), 'b3~Two+0.55');
  S.add(fx.count(h100.res, 0, GAP1, { d: 0.95, ease: 'power2.out' }), 'b3~Two+0.55');
  S.add(drive(f => tie.set(tieA.map((p, i) => [lerp(p[0], tieB[i][0], f), lerp(p[1], tieB[i][1], f)]), 1), 0.6, 'power2.inOut'), 'b3~ninety-five+0.35');
  S.add(fx.pulse(tag, { scale: 1.12, d: 0.45 }), 'b3~ninety-five+0.85');
  S.add(h100.gpu.pulse({ d: 0.6 }), 'b3~H one');

  // 'On the H two hundred behind the thirty milliseconds'
  writeRow(h200, 'b3~H two');
  const watch = ch18Watch(S, { x: WX + WATCH.size / 2, y: R2, size: WATCH.size, value: 0 }, h200.g);
  S.add(watch.in({ d: 0.5 }), 'b3~thirty-0.45');
  S.add(watch.run(0, MS_REAL, { d: 0.85, ease: 'power2.out' }), 'b3~thirty-0.05');

  // 'same arithmetic speed': both 989s together; 'faster memory': the 4.8
  const glowPulse = (els, tone) => gsap.timeline()
    .fromTo(els, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.16, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0)
    .fromTo(els, { attr: { filter: 'none' } }, { attr: { filter: `url(#glow-${tone})` }, duration: 0.01 }, 0)
    .set(els, { attr: { filter: 'none' } }, 0.9);
  S.add(glowPulse([h100.peak, h200.peak], 'compute'), 'b3~same-0.05');
  S.add(glowPulse([h200.bw], 'bytes'), 'b3~faster-0.05');
  // the word terms go; the signs stay as a faint skeleton over the coloured rows
  S.add(fx.out([peakT, bwT, chip], { d: 0.5 }), 'b3~memory+0.05');
  S.add(fx.dim([fracLine, divSign, eqSign, qMark], { to: 0.22, d: 0.6 }), 'b3~memory+0.05');

  // 'just over two hundred'
  S.add(gsap.set(h200.res, { autoAlpha: 1 }), 'b3~just-0.05');
  S.add(fx.count(h200.res, 0, GAP2, { d: 0.95, ease: 'power2.out' }), 'b3~just-0.05');

  // ================================================================ the bar corrects itself, one step per phrase
  // 'Three hundred': the tag is struck
  S.add(fx.strike(tag, { tone: 'ink', sw: 3, d: 0.3 }), 'b3~Three-0.05');
  const strikeLn = tagG.lastChild;
  // 'came from': 5 → 7 px sliver, 1654 → 1612 trim, dimension line with it; the grey corrections
  const tFix = 'b3~came-0.1', dFix = 0.38;
  S.add(sc.grow(1, ARITH_REAL, { d: dFix, ease: 'power2.inOut' }), tFix);
  S.add(sc.grow(0, MS_REAL, { d: dFix, ease: 'power2.inOut' }), tFix);
  S.add(gsap.fromTo(dimLine, { attr: { x2: X(MS) } }, { attr: { x2: X(MS_REAL) }, duration: dFix, ease: 'power2.inOut', immediateRender: false }), tFix);
  S.add(gsap.fromTo(tickR, { attr: { x1: X(MS), x2: X(MS) } }, { attr: { x1: X(MS_REAL), x2: X(MS_REAL) }, duration: dFix, ease: 'power2.inOut', immediateRender: false }), tFix);
  const arith2 = S.g();
  const fix1 = S.text('0.1 ms was 0.14', { x: X(0) - 14, y: 118, size: 28, weight: 600, color: 'muted' }, arith2);
  const leader2 = S.line({ x1: sliverCx(ARITH_REAL), y1: 137, x2: sliverCx(ARITH_REAL), y2: 155, stroke: 'compute', sw: 2.5 }, arith2);
  S.set(leader2, { autoAlpha: 0 }, 0);
  const fix2 = S.text('30 ms was 29.2', { x: (X(0) + X(MS_REAL)) / 2, y: 278, size: 28, weight: 600, anchor: 'middle', color: 'muted' });
  S.add(fx.in(fix1, { from: 'down', d: 0.38, dist: 14 }), tFix);
  S.add(fx.draw(leader2, { d: 0.3, from: '100% 100%' }), tFix);
  S.add(fx.in(fix2, { from: 'up', d: 0.38, dist: 14 }), tFix);

  // 'round numbers': the struck tag follows the bar's end and rolls to '× 206', tied to the H200's 206
  const tRound = S.t('b3~round') - 0.1;
  const slide = X(MS_REAL) - X(MS);
  S.add(gsap.fromTo(tagG, { x: 0 }, { x: slide, duration: 0.36, ease: 'power2.inOut', immediateRender: false }), tRound);
  S.add(gsap.to(strikeLn, { autoAlpha: 0, duration: 0.2 }), tRound);
  S.add(fx.swap(tag, '× 206', { d: 0.36 }), tRound + 0.02);
  S.add(gsap.fromTo(tag, { fill: S.tone('muted') }, { fill: S.tone('ink'), duration: 0.2, immediateRender: false }), tRound + 0.2);   // now a result: white
  S.add(gsap.to(tie, { autoAlpha: 0, duration: 0.25 }), tRound);
  const MID = R1 + 56;                                   // the gap between the rows
  const tieC = [[RX, R2 - 42], [RX, MID], [RAIL + slide, MID], [RAIL + slide, tagBottom]];   // '206' → '× 206'
  const tie2 = makeTie();
  tie2.set(tieC, 0);
  S.add(gsap.set(tie2, { autoAlpha: 1 }), tRound + 0.3);
  S.add(drive(f => tie2.set(tieC, f), 0.5, 'power2.inOut'), tRound + 0.3);
});
