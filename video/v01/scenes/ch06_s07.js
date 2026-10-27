/* ch06_s07 · a rate times a time gives an amount (fig 75)
   b1  'a rate = amount ÷ time': 'bytes' over 'second' with 'per' sitting on the bar, which becomes a plain
       division line; the heading rewrites to 'rate × time = amount' and the fraction parks top-left.
   b2  what-if tag; a coral pipe '3.35 TB/s' pours into a tall bucket while a stopwatch runs to 30 ms; the
       flow stops with it; '3.35 TB/s × 0.03 s = 100.5 GB'; fill line '≈ 100 GB'.
   b3  the '140 GB needed' line sits above the fill; the gap shades coral, '≈ 40 GB short', '≈ 72%'. Then
       everything dims and two cards say it both ways, joined by 'short by ×1.39, either way'.
   Checks: 3.35e12 × 0.03 = 100.5e9; 100.5 / 140 = 0.718; 140 − 100.5 = 39.5; 140 / 3.35 = 41.8 ms;
   140 / 100.5 = 41.8 / 30 = 1.39.
   Bucket x 1018-1318, y 360-720, 2.4 px per GB (140 GB at y 384, 100.5 GB at y 479). */
V.scene('ch06_s07', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = n => gsap.parseEase(n);
  const eIO2 = E('power2.inOut');

  // ================================================================ b1: a rate is an amount over a time
  // b2's picture (the parked fraction at the pipe's mouth, the pipe, the bucket, the stopwatch and its readout)
  // spans 150 + DX to 1360 + DX: DX centres it
  const DX = 238;
  const headA = S.text([{ t: 'a rate', c: 'bytes' }, { t: ' = amount ÷ time', c: 'ink' }], { x: 960, y: 112, size: 50, weight: 700, family: 'display', anchor: 'middle' });
  const headB = S.text([{ t: 'rate', c: 'bytes' }, { t: ' × time = ', c: 'ink' }, { t: 'amount', c: 'struct' }], { x: 960, y: 112, size: 50, weight: 700, family: 'display', anchor: 'middle' });
  S.set(headB, { autoAlpha: 0 }, 0);
  S.add(fx.in(headA, { from: 'up', d: 0.6, dist: 16 }), 'b1~rate-0.1');

  const frac = S.g();
  const FB = { w: 220, h: 76 }, FY = 500;
  const box = (label, y) => {
    const g = S.g(null, frac);
    S.rect({ x: 960 - FB.w / 2, y: y - FB.h / 2, w: FB.w, h: FB.h, r: 16, fill: '#0c1326' }, g);
    S.rect({ x: 960 - FB.w / 2, y: y - FB.h / 2, w: FB.w, h: FB.h, r: 16, fill: 'url(#card-struct)', stroke: 'struct', sw: 2.5 }, g);
    S.text(label, { x: 960, y: y + 2, size: 42, weight: 650, anchor: 'middle', color: 'ink' }, g);
    return g;
  };
  const bBytes = box('bytes', FY - 66), bSec = box('second', FY + 66);
  // the bar in two halves, with 'per' sitting in the gap; the halves close when 'per' melts
  const barL = S.line({ x1: 960 - 150, y1: FY, x2: 960 - 54, y2: FY, stroke: 'ink', sw: 4 }, frac);
  const barR = S.line({ x1: 960 + 54, y1: FY, x2: 960 + 150, y2: FY, stroke: 'ink', sw: 4 }, frac);
  const bar = [barL, barR];
  const perG = S.g(null, frac);
  S.rect({ x: 960 - 46, y: FY - 24, w: 92, h: 48, r: 12, fill: '#0b1124' }, perG);
  S.text('per', { x: 960, y: FY - 1, size: 34, weight: 650, anchor: 'middle', color: 'bytes', italic: true, case: 'keep' }, perG);   // the operator on the bar: lowercase
  [bBytes, bSec, perG].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  S.add(fx.in(bBytes, { from: 'down', d: 0.5, dist: 16 }), 'b1~bytes-0.15');
  S.add(fx.draw(bar, { d: 0.4 }), 'b1~bytes');
  S.add(fx.in(bSec, { from: 'up', d: 0.5, dist: 16 }), 'b1~second-0.15');
  S.add(fx.in(perG, { from: 'fade', d: 0.3 }), 'b1~per-0.1');
  // 'does the dividing': 'per' melts into the bar, which is now just a division line
  S.add(gsap.to(perG, { autoAlpha: 0, scaleX: 0.2, transformOrigin: '50% 50%', duration: 0.45, ease: 'power2.in' }), 'b1~dividing-0.1');
  S.add(gsap.fromTo(barL, { attr: { x2: 960 - 54 } }, { attr: { x2: 960 }, duration: 0.4, ease: 'power2.inOut', immediateRender: false }), T('b1~dividing') + 0.15);
  S.add(gsap.fromTo(barR, { attr: { x1: 960 + 54 } }, { attr: { x1: 960 }, duration: 0.4, ease: 'power2.inOut', immediateRender: false }), T('b1~dividing') + 0.15);
  S.add(gsap.fromTo(bar, { attr: { 'stroke-width': 4 } }, { attr: { 'stroke-width': 6 }, duration: 0.25, yoyo: true, repeat: 1, immediateRender: false }), T('b1~dividing') + 0.55);
  // 'a rate times a time': the heading rewrites, the fraction parks top-left
  const tRw = T('b1~times') - 0.1;
  S.add(gsap.to(headA, { autoAlpha: 0, duration: 0.3 }), tRw);
  S.add(fx.in(headB, { from: 'up', d: 0.45, dist: 12 }), tRw + 0.2);
  S.add(fx.xform(frac, { x: 150 + DX - 960, y: 280 - FY, s: 0.6, ox: 960, oy: FY }, { d: 0.9, ease: 'power3.inOut' }), T('b1~gives') - 0.1);   // to the pipe's mouth

  // ================================================================ b2: 3.35 TB/s for 30 ms
  // the heading and the bucket picture (y 70-780) sit 90 px lower through b2; the camera eases back as the
  // two cards fill the bottom band in b3
  S.add(fx.cam({ x: 960, y: 450, scale: 1, d: 0.8, ease: 'power2.inOut' }), T('b2') - 0.3);
  const whatIf = S.text('what-if: the 30 ms came from the H200', { x: 960, y: 170, size: 26, weight: 550, anchor: 'middle', color: 'muted' });
  S.set(whatIf, { autoAlpha: 0 }, 0);
  S.add(fx.in(whatIf, { from: 'fade', d: 0.45 }), 'b2~faster-0.1');

  const BK = { x: 780 + DX, y: 360, w: 300, h: 360 }, PXG = 2.4, BOT = BK.y + BK.h;
  const yOf = gb => BOT - PXG * gb;
  const scene = S.g();
  // the bucket: open at the top, a faint scale of 20 GB ticks on its left wall
  const bucket = S.g(null, scene);
  S.rect({ x: BK.x, y: BK.y, w: BK.w, h: BK.h, r: 4, fill: 'struct', fillOpacity: 0.04 }, bucket);
  const fill = S.rect({ x: BK.x + 3, y: BOT, w: BK.w - 6, h: 0, fill: 'bytes', fillOpacity: 0.55 }, scene);
  const walls = S.path({ d: `M${BK.x - 12},${BK.y} H${BK.x} V${BOT} H${BK.x + BK.w} V${BK.y} H${BK.x + BK.w + 12}`, stroke: 'ink', strokeOpacity: 0.8, sw: 4 }, bucket);
  for (let gb = 20; gb <= 140; gb += 20) S.line({ x1: BK.x, y1: yOf(gb), x2: BK.x + 12, y2: yOf(gb), stroke: 'ink', strokeOpacity: 0.35, sw: 2 }, bucket);
  // the pipe: in from the left, an elbow down into the bucket
  const PY = 318, PH = 24, PX0 = 300 + DX, PX1 = 830 + DX;
  const pipe = S.g(null, scene);
  S.path({ d: `M${PX0},${PY} H${PX1 + PH} V${BK.y + 18} H${PX1} V${PY + PH} H${PX0} Z`, fill: '#2a1218', stroke: 'bytes', sw: 2.5 }, pipe);
  const flowD = S.path({ d: '', fill: 'bytes' }, pipe);
  const stream = S.rect({ x: PX1 + 4, y: BK.y + 18, w: PH - 8, h: 0, fill: 'bytes', fillOpacity: 0.8 }, scene);
  const rateLbl = S.text('3.35 TB/s', { x: (PX0 + PX1) / 2, y: PY - 34, size: 36, weight: 700, family: 'mono', anchor: 'middle', color: 'bytes' }, scene);
  [flowD, stream, walls].forEach(e => e.setAttribute('data-audit', 'ignore'));
  [bucket, pipe, rateLbl].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  S.add(fx.in(bucket, { from: 'up', d: 0.6, dist: 20 }), T('b2') + 0.1);
  S.add(fx.in(pipe, { from: 'left', d: 0.6, dist: 40 }), T('b2') + 0.3);
  S.add(fx.in(rateLbl, { from: 'up', d: 0.45, dist: 12 }), 'b2~Three-0.1');

  // the stopwatch above, running 0 → 30 ms; the pour runs exactly as long
  const tR0 = T('b2~terabytes') - 0.1, tR1 = T('b2~milliseconds#2') + 0.2;
  const sw = libStopwatch(S, {
    x: 930 + DX, y: 256, size: 108, span: 60, value: 0, readout: 'right', readoutSize: 30, buttons: true,
    fmt: ms => (ms >= 29.95 ? '0.03 s = 30 ms' : `${(ms / 1000).toFixed(3)} s`), texts: ['0.03 s = 30 ms'], max: 30,
  });
  S.add(sw.in({ d: 0.45 }), T('b2~Three') - 0.2);
  S.add(sw.run(0, 30, { d: tR1 - tR0 }), tR0);
  const GB1 = 100.5;
  const paint = t => {
    const u = cl((t - tR0) / (tR1 - tR0)), on = t > tR0 && t < tR1;
    const h = PXG * GB1 * u;
    fill.setAttribute('y', (BOT - h).toFixed(2)); fill.setAttribute('height', h.toFixed(2));
    // the falling stream from the elbow to the surface, only while it pours
    stream.setAttribute('height', on ? Math.max(0, BOT - h - BK.y - 18).toFixed(2) : 0);
    // dashes moving right inside the pipe while it pours
    let d = '';
    if (on) for (let x = PX0 + ((t - tR0) * 420) % 40; x < PX1 - 14; x += 40) d += `M${x.toFixed(1)},${PY + 9}h18v6h-18z`;
    flowD.setAttribute('d', d);
  };
  paint(0);
  ch06Clock(S, tR0 - 0.01, tR1 + 0.05, paint);

  // the equation builds beneath the bucket
  const eq = S.equation([{ t: '3.35 TB/s', tone: 'bytes' }, { t: '× 0.03 s', tone: 'ink' }, { t: '= 100.5 GB', tone: 'struct' }], { x: 930 + DX, y: 764, size: 40, gap: 18, family: 'mono' });
  S.set(eq.parts, { autoAlpha: 0 }, 0);
  S.add(fx.in(eq.parts[0], { from: 'up', d: 0.4, dist: 12 }), 'b2~terabytes');
  S.add(fx.in(eq.parts[1], { from: 'up', d: 0.4, dist: 12 }), 'b2~times-0.05');
  S.add(fx.in(eq.parts[2], { from: 'up', d: 0.4, dist: 12 }), 'b2~about-0.1');
  const LX = BK.x + BK.w + 26;
  const fillLine = S.line({ x1: BK.x + 3, y1: yOf(GB1), x2: LX - 8, y2: yOf(GB1), stroke: 'struct', sw: 2.5 }, scene);
  const fillLbl = S.text('≈ 100 GB', { x: LX, y: yOf(GB1), size: 30, weight: 700, color: 'struct' }, scene);
  [fillLine, fillLbl].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  S.add(fx.in([fillLine, fillLbl], { from: 'fade', d: 0.4 }), T('b2~gigabytes') - 0.45);

  // ================================================================ b3: short of 140, and the other side
  const need = S.line({ x1: BK.x - 20, y1: yOf(140), x2: LX - 8, y2: yOf(140), stroke: 'ink', sw: 2.5, dash: '10 8' }, scene);
  const needLbl = S.text('140 GB needed', { x: LX, y: yOf(140), size: 30, weight: 650, color: 'ink' }, scene);
  const gap = S.rect({ x: BK.x + 3, y: yOf(140), w: BK.w - 6, h: PXG * (140 - GB1), fill: 'bytes', fillOpacity: 0.16 }, scene);
  const gapHatch = S.g(null, scene);
  for (let k = 0; k < 11; k++) S.line({ x1: BK.x + 6 + k * 26, y1: yOf(GB1) - 2, x2: BK.x + 6 + k * 26 + 30, y2: yOf(140) + 2, stroke: 'bytes', strokeOpacity: 0.35, sw: 2 }, gapHatch);
  gapHatch.setAttribute('data-audit', 'ignore');
  const shortLbl = S.text('≈ 40 GB short', { x: LX, y: (yOf(140) + yOf(GB1)) / 2, size: 30, weight: 700, color: 'bytes' }, scene);
  const pct = S.text('100.5 ÷ 140 ≈ 72%', { x: LX, y: yOf(GB1) + 46, size: 24, weight: 550, color: 'muted' }, scene);
  [need, needLbl, gap, gapHatch, shortLbl, pct].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  S.add(fx.draw(need, { d: 0.5 }), 'b3~hundred-0.1');
  S.add(fx.in(needLbl, { from: 'left', d: 0.45, dist: 12 }), 'b3~forty-0.1');
  S.add(fx.in([gap, gapHatch], { from: 'fade', d: 0.5 }), 'b3~needed');
  S.add(fx.in(shortLbl, { from: 'left', d: 0.45, dist: 12 }), T('b3~needed') + 0.3);
  S.add(fx.in(pct, { from: 'up', d: 0.4, dist: 10 }), 'b3~whole-0.1');
  // 'from the other side': everything above dims to 30%
  const tSide = T('b3~from') - 0.1;
  S.add(fx.cam({ d: 0.8, ease: 'power2.inOut' }), tSide - 0.3);
  S.add(gsap.to([scene, eq, headB, frac, whatIf, sw], { opacity: 0.3, duration: 0.5, ease: 'power2.out' }), tSide);
  // two cards in the bottom band, joined by a bracket
  const CY = 896, CH = 92, CW = 640, CXL = 960 - CW - 30, CXR = 960 + 30;
  const card = (x, header, parts) => {
    const g = S.g();
    S.text(header, { x: x + CW / 2, y: CY - CH / 2 - 26, size: 26, weight: 600, anchor: 'middle', color: 'muted' }, g);
    S.card({ x, y: CY - CH / 2, w: CW, h: CH, tone: 'neutral', r: 18 }, g);
    S.text(parts, { x: x + CW / 2, y: CY + 2, size: 27, weight: 650, family: 'mono', anchor: 'middle', color: 'ink' }, g);
    return g;
  };
  const cL = card(CXL, 'rate × time', [{ t: '3.35 TB/s × 30 ms ≈ 100 GB ' }, { t: '< 140 GB', c: 'bytes' }]);
  const cR = card(CXR, 'amount ÷ rate', [{ t: '140 GB ÷ 3.35 TB/s ≈ 41.8 ms ' }, { t: '> 30 ms', c: 'bytes' }]);
  const br = S.bracket({ x1: CXL + 40, x2: CXR + CW - 40, y: CY + CH / 2 + 14, label: 'short by ×1.39, either way', tone: 'bytes', size: 30 });
  [cL, cR, br].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  S.add(fx.in(cL, { from: 'up', d: 0.55, dist: 16 }), tSide + 0.2);
  S.add(fx.in(cR, { from: 'up', d: 0.55, dist: 16 }), T('b3~forty#2') - 0.15);
  S.add(fx.in(br, { from: 'fade', d: 0.3 }), T('b3~not#2') - 0.1);
  S.add(fx.draw(br.line, { d: 0.5 }), T('b3~not#2') - 0.1);
});
