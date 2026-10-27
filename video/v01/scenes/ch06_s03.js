/* ch06_s03 · bits, bytes, and a hundred and forty gigabytes (figs 72, 73)
   b1  the wire from s02 thins into a trace on a dark scope (left half); a single pulse crosses it; ten
       blue bands 0-9; the trace steps 7 2 9 4; the chip warms, the trace jitters, the 7 sags into band 6
       and the 4 into band 3: the readout is struck and corrected to the wrong digit.
   b2  right half: two bands 'high = 1', 'low = 0'; the trace 1 0 1 1 0 under the same jitter; one '1'
       droops to two thirds of its height and still reads '1' (teal tick). An engineering choice. The
       left half fades.
   b3  the readout's '0' flies left and becomes a bit cell; the row grows to a byte (2 → 256 patterns);
       two coral byte blocks slide together into a weight (65,536 patterns); the equation from ch02 comes
       back in the bottom band; a 140 GB file bounces off a tiny chip into a big memory block.
   b4  '16 bits: the common default' / 'fewer bits: later'; then 'parameters × bytes each = bytes'.
   Layout: scopes x 110-910 and 1010-1810, y 230-600 (plot 250-580); headings y 130, readouts y 196; in b1-b2
   both sit 160 lower, and the ten-level scope starts centred. Bit/byte column x 150-920, y 268-680; bottom
   band y 760-1000 (equation, then chip and memory right), centred as one. */
V.scene('ch06_s03', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = n => gsap.parseEase(n);
  const eIO2 = E('power2.inOut'), eO2 = E('power2.out'), eIO3 = E('power3.inOut');
  const ramp = (t, a, d, e = eIO2) => e(cl((t - a) / d));
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`; };
  const CORAL = S.tone('bytes'), INK = S.tone('ink'), BLUE = S.tone('struct'), ORANGE = '#ff8a3d';
  // mark elements data-audit="ignore" strictly inside (a, b): seek-safe in both directions
  const ignoreIn = (els, a, b) => ch06Clock(S, a, b, t => els.forEach(e => (t > a && t < b ? e.setAttribute('data-audit', 'ignore') : e.removeAttribute('data-audit'))));
  const fadeTo = (els, to, at, d = 0.5) => S.add(gsap.to(els, { opacity: to, duration: d, ease: 'power2.out' }), at);

  // one jitter for both traces: a sum of sines in x (relative to the trace start) and time
  const jit = (xr, t) => 0.55 * Math.sin(0.093 * xr + 11.3 * t) + 0.3 * Math.sin(0.31 * xr - 7.1 * t + 1.7) + 0.15 * Math.sin(0.71 * xr + 17 * t + 0.4);

  // a dark oscilloscope box with a fine grid
  const scope = (x, parent) => {
    const g = S.g(null, parent);
    S.rect({ x, y: 230, w: 800, h: 370, r: 16, fill: '#070c19', stroke: 'faint', strokeOpacity: 0.6, sw: 2 }, g);
    const grid = S.g(null, g);
    for (let gx = x + 40; gx < x + 800; gx += 40) S.line({ x1: gx, y1: 236, x2: gx, y2: 594, stroke: '#ffffff', strokeOpacity: 0.045, sw: 1, cap: 'butt' }, grid);
    for (let gy = 250; gy < 600; gy += 40) S.line({ x1: x + 6, y1: gy, x2: x + 794, y2: gy, stroke: '#ffffff', strokeOpacity: 0.045, sw: 1, cap: 'butt' }, grid);
    grid.setAttribute('data-audit', 'ignore');
    return g;
  };
  const tracePair = parent => {
    const glow = S.path({ d: '', stroke: 'ink', sw: 11, opacity: 0 }, parent);
    glow.setAttribute('stroke-opacity', 0.16); glow.setAttribute('stroke-linejoin', 'round');
    const core = S.path({ d: '', stroke: 'ink', sw: 3, opacity: 0 }, parent);
    core.setAttribute('stroke-linejoin', 'round');
    [glow, core].forEach(e => e.setAttribute('data-audit', 'ignore'));
    return { glow, core };
  };
  const pathD = (x0, x1, yf) => { let d = ''; for (let x = x0; x <= x1 + 0.01; x += 3) d += `${d ? 'L' : 'M'}${x.toFixed(1)},${yf(x).toFixed(1)}`; return d; };

  // ================================================================ left half: ten levels
  // b1: the ten-level scope is alone, so `left` starts centred (LX0 px right) and moves to its half as the
  // two-level scope arrives (b2). Both scopes sit DY lower, centred top to bottom, until b3 needs the bottom
  // band: then `right` moves up into its quadrant
  const LX0 = 450, DY = 160;
  const left = S.g();
  S.set(left, { x: LX0, y: DY }, 0);
  const scopeL = scope(110, left);
  S.set(scopeL, { autoAlpha: 0 }, 0);
  const XL0 = 170, XL1 = 890, SWL = 180, BAND = 33;
  const levY = n => 580 - BAND * n - BAND / 2;
  const bandsL = S.g(null, left);
  const bandRects = [...Array(10)].map((_, n) => {
    const r = S.rect({ x: 150, y: 580 - BAND * (n + 1), w: 750, h: BAND, fill: 'struct', fillOpacity: n % 2 ? 0.1 : 0.05 }, bandsL);
    if (n) S.line({ x1: 150, y1: 580 - BAND * n, x2: 900, y2: 580 - BAND * n, stroke: 'struct', strokeOpacity: 0.28, sw: 1.2, cap: 'butt' }, bandsL);
    S.text(String(n), { x: 131, y: levY(n) + 1, size: 22, weight: 600, family: 'mono', anchor: 'middle', color: 'struct' }, bandsL);
    return r;
  });
  S.set(bandsL, { autoAlpha: 0 }, 0);
  const headL = S.text('ten levels?', { x: 510, y: 130, size: 44, weight: 700, family: 'display', anchor: 'middle', color: 'ink' }, left);
  const voltL = S.text('voltage', { x: 114, y: 212, size: 22, weight: 550, color: 'muted' }, left);
  const timeL = S.text('time →', { x: 906, y: 624, size: 22, weight: 550, anchor: 'end', color: 'muted' }, left);
  const trL = tracePair(left);
  const SEQL = [7, 2, 9, 4];
  const digL = SEQL.map((v, i) => S.text(String(v), { x: XL0 + SWL * (i + 0.5), y: 196, size: 40, weight: 650, family: 'mono', anchor: 'middle', color: 'ink', opacity: 0 }, left));
  // the misreads: the digit greys, a strike draws through it, and the wrong digit lands beside it
  const MIS = [{ i: 0, to: 6, sag: 40, t: T('b1~warm') + 0.4 }, { i: 3, to: 3, sag: 38, t: T('b1~warm') + 1.05 }];
  MIS.forEach(m => {
    const d = digL[m.i], x = +d.getAttribute('x');
    m.strike = S.line({ x1: x - 17, y1: 199, x2: x + 17, y2: 193, stroke: 'muted', sw: 3 }, left);
    m.strike.setAttribute('data-audit', 'ignore');
    m.wrong = S.text(String(m.to), { x: x + 40, y: 196, size: 40, weight: 650, family: 'mono', anchor: 'middle', color: 'ink' }, left);
    S.set(m.strike, { autoAlpha: 0 }, 0);
    S.set(m.wrong, { autoAlpha: 0 }, 0);
    S.add(gsap.to(d, { attr: { fill: S.tone('muted') }, duration: 0.25 }), m.t + 0.3);
    S.add(fx.draw(m.strike, { d: 0.25 }), m.t + 0.4);
    S.add(fx.in(m.wrong, { from: 'up', d: 0.35, dist: 12 }), m.t + 0.55);
    // the band it fell into lights up for a moment
    S.add(gsap.fromTo(bandRects[m.to], { attr: { 'fill-opacity': m.to % 2 ? 0.1 : 0.05 } }, { attr: { 'fill-opacity': 0.34 }, duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), m.t + 0.3);
  });
  const caption = S.text('billions of readings a second', { x: 510, y: 650, size: 26, weight: 550, anchor: 'middle', color: 'muted' }, left);
  S.set(caption, { autoAlpha: 0 }, 0);

  // the thermometer: the tube fills and warms from blue to orange
  const TH = { x: 862, y: 126 };
  const thermo = S.g(null, left);
  S.rect({ x: TH.x - 9, y: TH.y - 40, w: 18, h: 62, r: 9, fill: '#0c1326', stroke: 'muted', strokeOpacity: 0.8, sw: 2.5 }, thermo);
  const bulb = S.circle({ x: TH.x, y: TH.y + 30, r: 14, fill: BLUE, stroke: 'muted', strokeOpacity: 0.8, sw: 2.5 }, thermo);
  const merc = S.rect({ x: TH.x - 4, y: TH.y + 10, w: 8, h: 12, r: 3, fill: BLUE }, thermo);
  S.set(thermo, { autoAlpha: 0 }, 0);

  // timing of the left trace
  const tWire0 = 0.15, tWire1 = 1.15, tWire2 = 2.2;              // the wire thins, then moves into the scope
  const tPulse = T('b1~yes') - 0.15;                             // one bit crosses
  const tSteps = T('b1~could') - 0.1;                            // the trace draws the steps 7 2 9 4
  const tWarm = T('b1~warm') - 0.05;
  const yFlatL = levY(0);
  const leftY = (x, t) => {
    let y = yFlatL;
    const pu = (t - tPulse) / 1.3;                               // a pulse 100 px wide, 210 px tall
    if (pu > 0 && pu < 1) { const pc = lerp(XL0 - 70, XL1 + 70, pu), dd = Math.abs(x - pc); y -= 210 * cl((58 - dd) / 8); }
    const xd = lerp(XL0, XL1 + 12, ramp(t, tSteps, 1.5));
    if (x <= xd && t >= tSteps) {
      const i = Math.min(3, Math.floor((x - XL0) / SWL)), s0 = XL0 + i * SWL;
      const sag = k => { const m = MIS.find(q => q.i === k); return m ? m.sag * ramp(t, m.t, 0.35) : 0; };
      const cur = levY(SEQL[i]) + sag(i), prev = i ? levY(SEQL[i - 1]) + sag(i - 1) : yFlatL;
      y = lerp(prev, cur, cl((x - s0) / 8));
    }
    return y + 7 * ramp(t, tWarm, 0.6) * jit(x - XL0, t);
  };

  // ================================================================ right half: two levels
  const right = S.g();
  S.set(right, { y: DY }, 0);
  const scopeR = scope(1010, right);
  const XR0 = 1180, XR1 = 1790, SWR = 122, YH = 285, YLo = 545, THR = 415;
  const bandsR = S.g(null, right);
  S.rect({ x: 1030, y: 250, w: 770, h: THR - 250, fill: 'struct', fillOpacity: 0.11 }, bandsR);
  S.rect({ x: 1030, y: THR, w: 770, h: 580 - THR, fill: 'struct', fillOpacity: 0.05 }, bandsR);
  const thr = S.line({ x1: 1030, y1: THR, x2: 1800, y2: THR, stroke: 'struct', strokeOpacity: 0.55, sw: 1.5, dash: '7 7', cap: 'butt' }, bandsR);
  thr.setAttribute('data-audit', 'ignore');
  const hiLbl = S.text('high = 1', { x: 1042, y: 270, size: 26, weight: 650, color: 'struct' }, right);
  const loLbl = S.text('low = 0', { x: 1042, y: 562, size: 26, weight: 650, color: 'struct' }, right);
  const headR = S.text('two levels', { x: 1410, y: 130, size: 44, weight: 700, family: 'display', anchor: 'middle', color: 'ink' }, right);
  const trR = tracePair(right);
  const SEQR = [1, 0, 1, 1, 0];
  const digR = SEQR.map((v, i) => S.text(String(v), { x: XR0 + SWR * (i + 0.5), y: 196, size: 40, weight: 650, family: 'mono', anchor: 'middle', color: 'ink', opacity: 0 }, right));
  [scopeR, bandsR, hiLbl, loLbl, headR].forEach(e => S.set(e, { autoAlpha: 0 }, 0));
  const tStepsR = T('b2~called') - 0.2, tNoiseR = T('b2~noise') - 0.1, tSag = T('b2~sag') - 0.05;
  const SAGR = (YLo - YH) / 3;                                   // droops to two thirds of its height
  const rightY = (x, t) => {
    const i = Math.min(4, Math.floor((x - XR0) / SWR)), s0 = XR0 + i * SWR;
    const lv = k => (SEQR[k] ? YH : YLo) + (k === 3 ? SAGR * ramp(t, tSag, 0.6) : 0);
    const y = lerp(i ? lv(i - 1) : YLo, lv(i), cl((x - s0) / 8));
    return y + 7 * ramp(t, tNoiseR, 0.5) * jit(x - XR0, t);
  };
  // 'read correctly': a teal tick beside the readout of the drooped '1'
  const okTag = S.g(null, right);
  const okX = XR0 + SWR * 3.5;
  S.path({ d: `M${okX - 34},${142} l9,10 l17,-20`, stroke: 'helps', sw: 4 }, okTag);
  S.text('read correctly', { x: okX + 2, y: 142, size: 26, weight: 600, color: 'helps' }, okTag);
  const okLine = S.line({ x1: okX, y1: 160, x2: okX, y2: 172, stroke: 'helps', sw: 2.5 }, okTag);
  okLine.setAttribute('data-audit', 'ignore');
  S.set(okTag, { autoAlpha: 0 }, 0);
  const engTag = S.text('an engineering choice, not a mathematical one', { x: 1410, y: 648, size: 26, weight: 550, anchor: 'middle', color: 'muted' }, right);
  S.set(engTag, { autoAlpha: 0 }, 0);

  // ================================================================ one painter for both traces
  const paint = t => {
    // left: the wire from s02 (coral, wide) thins and slides into the scope, then it is the trace
    const { glow, core } = trL;
    if (t < tWire2) {
      const a = ramp(t, tWire0, tWire1 - tWire0), b = ramp(t, tWire1, tWire2 - tWire1, eIO3);
      const y = lerp(540 - DY, yFlatL, b);                       // from the full-width wire on screen (left is offset)
      core.setAttribute('d', `M${lerp(-20 - LX0, XL0, b).toFixed(1)},${y.toFixed(1)} L${lerp(1940 - LX0, XL1, b).toFixed(1)},${y.toFixed(1)}`);
      core.setAttribute('stroke-width', lerp(220, 3, a).toFixed(2));
      core.setAttribute('stroke', mix(CORAL, INK, b));
      core.setAttribute('opacity', lerp(0.85, 1, a).toFixed(3));
      glow.setAttribute('opacity', 0);
    } else {
      const d = pathD(XL0, XL1, x => leftY(x, t));
      core.setAttribute('d', d); glow.setAttribute('d', d);
      core.setAttribute('stroke-width', 3); core.setAttribute('stroke', INK);
      core.setAttribute('opacity', 1); glow.setAttribute('opacity', 1);
    }
    const xd = lerp(XL0, XL1 + 12, ramp(t, tSteps, 1.5));
    digL.forEach((e, i) => e.setAttribute('opacity', (t >= tSteps ? cl((xd - XL0 - SWL * (i + 1) + 40) / 40) : 0).toFixed(3)));
    // the thermometer
    const w = ramp(t, tWarm, 0.7);
    const mh = lerp(12, 46, w), col = mix(BLUE, ORANGE, w);
    merc.setAttribute('y', (TH.y + 22 - mh).toFixed(2)); merc.setAttribute('height', mh.toFixed(2));
    merc.setAttribute('fill', col); bulb.setAttribute('fill', col);
    // right: draws on from the left, as the readout lands digit by digit
    const xr = lerp(XR0, XR1 + 8, ramp(t, tStepsR, 1.4));
    if (t >= tStepsR) {
      const d = pathD(XR0, Math.min(XR1, xr), x => rightY(x, t));
      trR.core.setAttribute('d', d); trR.glow.setAttribute('d', d);
      trR.core.setAttribute('opacity', 1); trR.glow.setAttribute('opacity', 1);
    } else { trR.core.setAttribute('opacity', 0); trR.glow.setAttribute('opacity', 0); }
    digR.forEach((e, i) => e.setAttribute('opacity', (t >= tStepsR ? cl((xr - XR0 - SWR * (i + 1) + 30) / 30) : 0).toFixed(3)));
  };
  paint(0);
  ch06Clock(S, 0, S.duration, paint);

  // ---------------------------------------------------------------- b1 cues
  S.add(fx.in(scopeL, { from: 'fade', d: 0.8 }), tWire1 + 0.3);
  S.add(fx.in(voltL, { from: 'fade', d: 0.4 }), 'b1~voltage-0.1');
  S.add(fx.in(timeL, { from: 'fade', d: 0.4 }), 'b1~wire-0.1');
  S.add(fx.in(headL, { from: 'up', d: 0.5, dist: 16 }), 'b1~Ten-0.1');
  S.add(gsap.fromTo(bandsL, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: 'power2.out', immediateRender: false }), 'b1~levels-0.2');
  S.add(gsap.fromTo(bandRects, { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'power3.out', stagger: 0.05, immediateRender: false }), 'b1~levels-0.2');
  S.add(fx.in(caption, { from: 'up', d: 0.5, dist: 12 }), 'b1~billions-0.1');
  S.add(fx.in(thermo, { from: 'fade', d: 0.4 }), tWarm - 0.25);
  S.add(fx.dim(caption, { to: 0.35 }), tWarm);

  // ---------------------------------------------------------------- b2 cues
  S.add(gsap.fromTo(left, { x: LX0 }, { x: 0, duration: 0.8, ease: 'power2.inOut', immediateRender: false }), T('b2') - 0.6);
  S.add(fx.in(scopeR, { from: 'fade', d: 0.6 }), T('b2') - 0.2);
  S.add(fx.in(headR, { from: 'up', d: 0.5, dist: 16 }), 'b2~Two-0.1');
  S.add(fx.in(bandsR, { from: 'fade', d: 0.5 }), 'b2~levels-0.15');
  S.add(fx.in(hiLbl, { from: 'left', d: 0.4, dist: 14 }), 'b2~one-0.1');
  S.add(fx.in(loLbl, { from: 'left', d: 0.4, dist: 14 }), 'b2~zero-0.1');
  S.add(fx.in(okTag, { from: 'up', d: 0.45, dist: 10 }), 'b2~correctly-0.25');
  S.add(fx.in(engTag, { from: 'up', d: 0.5, dist: 12 }), 'b2~engineering-0.1');
  S.add(fx.out(left, { d: 0.7 }), 'b2~counted-0.1');

  // ================================================================ b3: bits, a byte, a weight
  S.add(gsap.fromTo(right, { y: DY }, { y: 0, duration: 0.6, ease: 'power2.inOut', immediateRender: false }), T('b3') - 0.85);
  fadeTo(right, 0.3, T('b3') - 0.2, 0.5);
  const CELL = { x: 150, y: 268, s: 64, p: 76 }, CY = CELL.y + CELL.s / 2;
  const ROW = [0, 1, 0, 1, 0, 1, 0, 1];
  const cellsG = S.g();
  const cells = ROW.map((v, k) => {
    const g = S.g(null, cellsG);
    const x = CELL.x + k * CELL.p;
    S.rect({ x, y: CELL.y, w: CELL.s, h: CELL.s, r: 10, fill: '#0c1326' }, g);
    S.rect({ x, y: CELL.y, w: CELL.s, h: CELL.s, r: 10, fill: 'url(#card-struct)', stroke: 'struct', sw: 2.5 }, g);
    if (k) S.text(String(v), { x: x + CELL.s / 2, y: CY + 1, size: 34, weight: 650, family: 'mono', anchor: 'middle', color: 'ink' }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  });
  // the readout's '0' (second digit) lifts off the right trace and flies into the first cell
  const fl0 = digR[1], flX = +fl0.getAttribute('x');
  const flier = S.text('0', { x: flX, y: 196, size: 40, weight: 650, family: 'mono', anchor: 'middle', color: 'ink' });
  S.set(flier, { autoAlpha: 0 }, 0);
  const tFly = T('b3') - 0.15;
  S.add(gsap.fromTo(flier, { autoAlpha: 1, x: 0, y: 0 }, { x: CELL.x + CELL.s / 2 - flX, y: CY + 1 - 196, duration: 0.75, ease: 'power3.inOut', immediateRender: false }), tFly);
  S.add(gsap.fromTo(flier, { attr: { 'font-size': 40 } }, { attr: { 'font-size': 34 }, duration: 0.75, ease: 'power3.inOut', immediateRender: false }), tFly);
  S.set(fl0, { autoAlpha: 0 }, tFly);
  S.add(fx.in(cells[0], { from: 'fade', d: 0.4 }), 'b3~bits-0.15');
  const bitLbl = S.text('1 bit = one yes-or-no', { x: CELL.x, y: CELL.y + CELL.s + 40, size: 28, weight: 600, color: 'struct' });
  S.add(fx.in(bitLbl, { from: 'up', d: 0.45, dist: 12 }), 'b3~bits');
  // 'a byte': the row grows to eight cells; a grey counter of patterns doubles with each cell
  const tRow = T('b3~byte') - 0.15, every = 0.08;
  cells.slice(1).forEach((g, j) => S.add(fx.in(g, { from: 'left', d: 0.35, dist: 14 }), tRow + every * j));
  S.add(fx.out(bitLbl, { d: 0.3 }), tRow - 0.05);
  const patsG = S.g();
  const pats = [...Array(8)].map((_, n) => S.text(`${(2 ** (n + 1)).toLocaleString('en-US')} patterns`, { x: CELL.x + 8 * CELL.p + 8, y: CY, size: 26, weight: 550, color: 'muted', opacity: 0 }, patsG));
  ch06Clock(S, tRow - 0.05, tRow + every * 8, t => {
    const n = Math.max(0, Math.min(7, Math.floor((t - tRow) / every) + 1));
    pats.forEach((e, k) => e.setAttribute('opacity', t < tRow - 0.04 ? 0 : k === n ? 1 : 0));
  });
  const byteBr = S.bracket({ x1: CELL.x, x2: CELL.x + 7 * CELL.p + CELL.s, y: CELL.y + CELL.s + 12, label: 'one byte', tone: 'struct', size: 28 });
  S.set(byteBr, { autoAlpha: 0 }, 0);
  S.add(fx.in(byteBr, { from: 'fade', d: 0.4 }), tRow + every * 8 + 0.05);
  S.add(fx.draw(byteBr.line, { d: 0.5 }), tRow + every * 8 + 0.05);

  // 'takes two': two coral byte blocks slide together into one weight
  const BW = 296, BY = 446, BH = 64;
  const blocks = [0, 1].map(k => {
    const g = S.g();
    const x = CELL.x + k * (BW + 4);
    S.rect({ x, y: BY, w: BW, h: BH, r: 12, fill: '#0c1326' }, g);
    S.rect({ x, y: BY, w: BW, h: BH, r: 12, fill: 'url(#card-bytes)', stroke: 'bytes', sw: 2.5 }, g);
    S.text('1 byte · 8 bits', { x: x + BW / 2, y: BY + BH / 2 + 1, size: 26, weight: 600, anchor: 'middle', color: 'ink' }, g);
    return g;
  });
  const tTwo = T('b3~takes') - 0.1;
  S.add(fx.in(blocks[0], { from: 'left', d: 0.6, dist: 90 }), tTwo);
  S.add(fx.in(blocks[1], { from: 'right', d: 0.6, dist: 90 }), tTwo);
  ignoreIn(blocks, tTwo - 0.01, tTwo + 0.65);
  S.add(fx.dim([cellsG, flier, byteBr, patsG], { to: 0.4 }), tTwo);
  const wLbl = S.text([{ t: '1 weight = ' }, { t: '2 bytes', c: 'bytes' }, { t: ' = 16 bits' }], { x: CELL.x, y: BY + BH + 40, size: 30, weight: 650, color: 'ink' });
  const wPat = S.text('65,536 patterns', { x: CELL.x, y: BY + BH + 78, size: 26, weight: 550, color: 'muted' });
  S.add(fx.in(wLbl, { from: 'up', d: 0.45, dist: 12 }), 'b3~two');
  S.add(fx.in(wPat, { from: 'up', d: 0.45, dist: 12 }), T('b3~two') + 0.35);

  // "That's why": the labels fade; the equation from ch02 returns whole in the bottom band
  const tWhy = T('b3~why') - 0.42;
  S.add(fx.dim([byteBr, patsG, wLbl, wPat, cellsG, flier, ...blocks], { to: 0.2 }), tWhy);
  const eq = S.equation([{ t: '70 billion weights', tone: 'ink' }, { t: '× 2 bytes', tone: 'bytes' }, { t: '= 140 GB', tone: 'ink' }], { x: 714, y: 800, size: 46, gap: 34 });   // the band (equation, chip, memory) centred
  const [eqW, eq2, eq140] = eq.parts;
  const gbNote = S.text('1 GB = 1 billion bytes', { x: eq140.cx, y: 858, size: 24, weight: 550, anchor: 'middle', color: 'muted' });
  S.add(fx.in(eq, { from: 'up', d: 0.6, dist: 18 }), tWhy + 0.1);
  S.add(fx.in(gbNote, { from: 'fade', d: 0.4 }), tWhy + 0.5);
  const box2 = S.rect({ x: eq2.l - 14, y: 800 - 36, w: eq2.w + 28, h: 72, r: 12, stroke: 'white', sw: 2.5 });
  S.set(box2, { autoAlpha: 0 }, 0);
  S.add(fx.draw(box2, { d: 0.6 }), 'b3~seventy');

  // a 140 GB file bounces off a tiny chip and settles into a big memory block
  const CHIP = { x: 1354, y: 905, s: 38 }, MEM = { x: 1454, y: 830, w: 200, h: 136 };
  const chipO = S.g();
  S.rect({ x: CHIP.x - CHIP.s / 2, y: CHIP.y - CHIP.s / 2, w: CHIP.s, h: CHIP.s, r: 6, fill: '#1a1408', stroke: 'compute', sw: 2.5 }, chipO);
  S.text('chip', { x: CHIP.x, y: CHIP.y + 46, size: 24, weight: 600, anchor: 'middle', color: 'compute' }, chipO);
  const memB = S.g();
  const memRect = S.rect({ x: MEM.x, y: MEM.y, w: MEM.w, h: MEM.h, r: 14, fill: '#2a1218', stroke: 'bytes', sw: 3 }, memB);
  for (let l = 1; l < 8; l++) S.line({ x1: MEM.x + 14, y1: MEM.y + l * MEM.h / 8, x2: MEM.x + MEM.w - 14, y2: MEM.y + l * MEM.h / 8, stroke: 'bytes', strokeOpacity: 0.3, sw: 1.5 }, memB);
  memB.setAttribute('data-audit', 'ignore');
  const tChip = T('b3~weights') - 0.2;
  S.add(fx.in([chipO, memB], { from: 'fade', d: 0.45, stagger: 0.1 }), tChip);
  const file = S.g();
  const fileIn = S.g(null, file);
  const fileBack = S.rect({ x: -30, y: -50, w: 60, h: 74, r: 8, fill: '#0c1326' }, fileIn);
  S.icon('ph:file-duotone', { x: 0, y: -14, size: 72, color: 'bytes' }, fileIn);
  S.text('140 GB', { x: 0, y: 40, size: 24, weight: 700, family: 'mono', anchor: 'middle', color: 'bytes' }, fileIn);
  fileBack.setAttribute('data-audit', 'ignore');
  S.set(file, { autoAlpha: 0 }, 0);
  const P0 = [eq140.cx, 800 - 112], C1 = [1274, 590], P1 = [CHIP.x, CHIP.y - CHIP.s / 2 - 26], C2 = [1434, 660], P2 = [MEM.x + MEM.w / 2, MEM.y + MEM.h / 2 + 6];
  const bez = (a, c, b, u) => [0, 1].map(i => (1 - u) * (1 - u) * a[i] + 2 * (1 - u) * u * c[i] + u * u * b[i]);
  const tF0 = T('b3~make#2') - 0.1, tF1 = tF0 + 0.55, tF2 = tF1 + 0.65;
  S.add(fx.in(file, { from: 'fade', d: 0.25 }), tF0 - 0.25);
  S.add(fx.out(engTag, { d: 0.3 }), tF0 - 0.6);   // the file appears where the dimmed caption sits
  ch06Clock(S, tF0 - 0.25, tF2 + 0.3, t => {
    let p;
    if (t < tF0) p = P0;
    else if (t < tF1) p = bez(P0, C1, P1, E('power2.in')((t - tF0) / (tF1 - tF0)));
    else p = bez(P1, C2, P2, E('sine.inOut')(cl((t - tF1) / (tF2 - tF1))));
    file.setAttribute('transform', `translate(${p[0].toFixed(2)},${p[1].toFixed(2)})`);
    if (t > tF0 && t < tF2) file.setAttribute('data-audit', 'ignore');   // in flight: it crosses the dimmed caption
    else file.removeAttribute('data-audit');
  });
  // the tiny chip flinches as the file hits it; the memory takes it in
  S.add(gsap.fromTo(chipO, { x: 0 }, { x: 5, duration: 0.06, yoyo: true, repeat: 3, ease: 'sine.inOut', immediateRender: false }), tF1);
  S.add(gsap.fromTo(memRect, { attr: { fill: '#2a1218' } }, { attr: { fill: '#4a1d26' }, duration: 0.3, yoyo: true, repeat: 1, immediateRender: false }), tF2 - 0.05);
  const onlyTag = S.text('only fits in the memory', { x: MEM.x + MEM.w / 2, y: MEM.y + MEM.h + 36, size: 24, weight: 600, anchor: 'middle', color: 'bytes' });
  S.add(fx.in(onlyTag, { from: 'up', d: 0.45, dist: 10 }), tF2 + 0.05);

  // ================================================================ b4: sixteen bits; parameters × bytes
  const side1 = S.text('16 bits: the common default', { x: CELL.x, y: 640, size: 26, weight: 600, color: 'muted' });
  const side2 = S.text('fewer bits: later in the series', { x: CELL.x, y: 676, size: 26, weight: 550, color: 'faint' });
  S.add(gsap.to([wLbl, ...blocks], { opacity: 0.75, duration: 0.4 }), T('b4') - 0.1);
  S.add(fx.in(side1, { from: 'left', d: 0.45, dist: 14 }), 'b4~Sixteen-0.1');
  S.add(fx.in(side2, { from: 'left', d: 0.45, dist: 14 }), 'b4~Shrinking-0.1');

  const tRule = T('b4~Parameters') - 0.15;
  S.add(gsap.to([right, cellsG, byteBr, patsG, wLbl, wPat, ...blocks, eq, box2, gbNote, chipO, memB, file, onlyTag, side1, side2, flier], { opacity: 0.12, duration: 0.6, ease: 'power2.out' }), tRule);
  const dimmed = [right, cellsG, byteBr, patsG, wLbl, wPat, ...blocks, eq, box2, gbNote, chipO, memB, file, onlyTag, side1, side2, flier];
  ignoreIn(dimmed, tRule, S.duration);
  const rule = S.g();
  const ruleTxt = [{ t: 'parameters × ' }, { t: 'bytes', c: 'bytes' }, { t: ' each = ' }, { t: 'bytes', c: 'bytes' }];
  const rw = S.measure('parameters × bytes each = bytes', { size: 64, weight: 700, family: 'display' });
  S.rect({ x: 960 - rw / 2 - 56, y: 540 - 70, w: rw + 112, h: 140, r: 26, fill: '#0c1326', stroke: 'ink', strokeOpacity: 0.18, sw: 2 }, rule);
  S.text(ruleTxt, { x: 960, y: 542, size: 64, weight: 700, family: 'display', anchor: 'middle', color: 'ink' }, rule);
  const ruleLine = S.line({ x1: 960 - rw / 2, y1: 600, x2: 960 + rw / 2, y2: 600, stroke: 'bytes', sw: 3 }, rule);
  ruleLine.setAttribute('data-audit', 'ignore');
  S.set(ruleLine, { autoAlpha: 0 }, 0);
  S.add(fx.in(rule, { from: 'up', d: 0.6, dist: 18 }), tRule + 0.1);
  S.add(fx.draw(ruleLine, { d: 0.7 }), 'b4~constantly-0.2');
});
