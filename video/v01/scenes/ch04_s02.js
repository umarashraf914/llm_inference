/* ch04_s02 · why there is no round trip per token (fig 27)
   Making one token: 30 ms. A round trip: same city 5 ms, Seoul–Tokyo 35 ms, Seoul–US west coast 130 ms
   (130 / 30 ≈ 4.3 tokens' worth; typical, not measured). A 500-token answer: streamed, 500 × 30 ms = 15 s;
   a round trip per token, 500 × (30 + 130) ms = 80 s, 65 s of it waiting (80 / 15 ≈ 5.3 ×).
   Nearer routes: Tokyo 500 × 65 ms = 32.5 s, same city 500 × 35 ms = 17.5 s. Bars to scale. */
V.scene('ch04_s02', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const GREY = '#7c879e';

  // ---------------------------------------------------------------- the map strip: Seoul, and three destinations
  const MAP = { x: 160, y: 140, w: 1600, h: 140 };
  const map = S.g();
  S.rect({ x: MAP.x, y: MAP.y, w: MAP.w, h: MAP.h, r: 22, fill: '#0c1326', fillOpacity: 0.85, stroke: '#ffffff', strokeOpacity: 0.12, sw: 2 }, map);
  const land = (d) => S.path({ d, fill: 'struct', fillOpacity: 0.1, stroke: 'struct', strokeOpacity: 0.3, sw: 1.5 }, map);
  land('M180,170 C260,150 420,152 500,166 C540,174 556,188 546,206 C534,224 470,236 380,240 C290,242 200,238 182,226 Z');   // Asia
  land('M556,176 C566,170 576,176 574,196 C572,214 562,226 556,214 Z');                                                         // Korea
  land('M640,170 C660,164 690,176 704,196 C716,214 714,236 700,240 C690,226 668,208 646,192 Z');                               // Japan
  land('M1430,160 C1520,150 1640,152 1730,166 L1740,230 C1650,238 1520,238 1450,228 C1434,212 1428,190 1430,160 Z');            // N. America
  const waves = ignore(S.g(null, map));
  for (let r = 0; r < 3; r++) for (let x = 780 + (r % 2) * 40; x < 1390; x += 80)
    S.path({ d: `M${x},${176 + r * 30} q10,-8 20,0 t20,0`, stroke: 'struct', sw: 1.5, strokeOpacity: 0.25 }, waves);
  const PIN = { seoul: [556, 200], city: [596, 214], tokyo: [700, 206], us: [1470, 196] };
  const pin = (k, label, lx, anchor, tone = 'ink') => {
    const g = S.g(null, map);
    S.icon('ph:map-pin-duotone', { x: PIN[k][0], y: PIN[k][1] - 14, size: 30, color: tone }, g);
    S.text(label, { x: lx, y: 262, size: 22, anchor, weight: 600, color: tone === 'ink' ? 'ink' : 'muted' }, g);
    return g;
  };
  const pins = [pin('seoul', 'Seoul', 548, 'end', 'struct'), pin('city', 'same city', 572, 'start', 'muted'), pin('tokyo', 'Tokyo', 742, 'middle', 'muted'), pin('us', 'US west coast', 1470, 'middle', 'muted')];
  S.set(map, { autoAlpha: 0 }, 0);
  S.set(pins, { autoAlpha: 0 }, 0);
  S.add(fx.in(map, { from: 'fade', d: 0.6 }), 0.1);
  S.add(fx.pop(pins, { d: 0.4, stagger: 0.12 }), 0.4);
  // 'round trip': a dot goes there and back
  const arcD = `M${PIN.seoul[0]},${PIN.seoul[1] - 30} Q1013,96 ${PIN.us[0]},${PIN.us[1] - 30}`;
  const arc = ignore(S.path({ d: arcD, stroke: 'muted', sw: 2, dash: '5 7', strokeOpacity: 0.7 }));
  const dot = S.circle({ x: 0, y: 0, r: 8, fill: 'ink' });
  ignore(dot);
  const rtLbl = S.text('round trip = there and back', { x: 1013, y: 238, size: 26, anchor: 'middle', weight: 600, color: 'ink' });
  S.set([arc, dot, rtLbl], { autoAlpha: 0 }, 0);
  const RT = T('b1~round') - 0.1;
  S.add(gsap.to(arc, { autoAlpha: 1, duration: 0.3 }), RT);
  S.add(gsap.fromTo(dot, { autoAlpha: 1 }, { motionPath: { path: arcD }, duration: 0.85, ease: 'power1.inOut', immediateRender: false }), RT);
  S.add(gsap.fromTo(dot, { motionPath: { path: arcD, start: 1, end: 1 } }, { motionPath: { path: arcD, start: 1, end: 0 }, duration: 0.85, ease: 'power1.inOut', immediateRender: false }), RT + 0.95);
  S.add(gsap.to(dot, { autoAlpha: 0, duration: 0.15 }), RT + 1.8);
  S.add(fx.in(rtLbl, { from: 'fade', d: 0.35 }), RT + 0.4);
  S.add(fx.out([rtLbl, arc], { d: 0.4 }), 'b1~Making-0.2');

  // ---------------------------------------------------------------- b1–b2: one token against one round trip, in ms, to scale
  const C1 = { x0: 560, px: 8, y: [380, 450, 520, 590], axY: 640 };
  const chart1 = S.g();
  const ax1 = S.g(null, chart1);
  S.line({ x1: C1.x0, y1: C1.axY, x2: C1.x0 + 140 * C1.px, y2: C1.axY, stroke: 'muted', sw: 2 }, ax1);
  for (let ms = 0; ms <= 140; ms += 20) {
    S.line({ x1: C1.x0 + ms * C1.px, y1: C1.axY, x2: C1.x0 + ms * C1.px, y2: C1.axY + 8, stroke: 'muted', sw: 2 }, ax1);
    S.text(ms === 140 ? '140 ms' : String(ms), { x: C1.x0 + ms * C1.px, y: C1.axY + 30, size: 22, anchor: 'middle', weight: 550, color: 'muted' }, ax1);
  }
  S.set(ax1, { autoAlpha: 0 }, 0);
  S.add(fx.in(ax1, { from: 'fade', d: 0.5 }), T('b1~Making') - 0.3);
  const BARS1 = [
    { label: 'Making one token', ms: 30, tone: 'struct', cue: 'b1~thirty' },
    { label: 'Same city, there and back', ms: 5, tone: GREY, cue: 'b1~five' },
    { label: 'Seoul to Tokyo', ms: 35, tone: GREY, cue: 'b1~thirty-five' },
    { label: 'Seoul to US west coast', ms: 130, tone: GREY, cue: 'b2~hundred' },
  ];
  const b1 = BARS1.map((b, i) => {
    const y = C1.y[i];
    const lbl = S.text(b.label, { x: C1.x0 - 20, y: y + 1, size: 30, anchor: 'end', weight: 600, color: i === 0 ? 'struct' : 'ink' }, chart1);
    const bar = S.rect({ x: C1.x0, y: y - 20, w: 0, h: 40, r: 5, fill: b.tone, fillOpacity: i === 0 ? 0.9 : 0.75 }, chart1);
    const val = S.text(`${b.ms} ms`, { x: C1.x0 + b.ms * C1.px + 14, y: y + 1, size: 30, weight: 650, family: 'mono', color: 'ink' }, chart1);
    S.set([lbl, val], { autoAlpha: 0 }, 0);
    const at = T(b.cue) - 0.15;
    S.add(fx.in(lbl, { from: 'right', d: 0.35, dist: 14 }), at - 0.15);
    S.add(gsap.to(bar, { attr: { width: b.ms * C1.px }, duration: b.ms > 60 ? 1.0 : 0.5, ease: 'power2.out' }), at);
    S.add(fx.in(val, { from: 'left', d: 0.3, dist: 10 }), at + (b.ms > 60 ? 0.85 : 0.35));
    return { lbl, bar, val };
  });
  const guide = ignore(S.line({ x1: C1.x0 + 30 * C1.px, y1: C1.y[0] + 22, x2: C1.x0 + 30 * C1.px, y2: C1.axY, stroke: 'struct', sw: 2, dash: '7 6' }, chart1));
  S.set(guide, { autoAlpha: 0 }, 0);
  S.add(gsap.set(guide, { autoAlpha: 1 }), T('b1~thirty') + 0.4);
  S.add(fx.draw(guide, { d: 0.5 }), T('b1~thirty') + 0.4);
  const ratio = S.text('≈ 4.3 × one token', { x: C1.x0 + 130 * C1.px, y: C1.y[3] - 38, size: 26, anchor: 'middle', weight: 650, color: 'ink' }, chart1);
  const caveat = S.text('typical, not measured; varies by route', { x: C1.x0, y: C1.axY + 66, size: 24, weight: 550, color: 'muted' }, chart1);
  S.set([ratio, caveat], { autoAlpha: 0 }, 0);
  S.add(fx.in(ratio, { from: 'up', d: 0.35, dist: 10 }), 'b2~four');
  S.add(fx.in(caveat, { from: 'up', d: 0.35, dist: 10 }), 'b2~Typical');

  // ---------------------------------------------------------------- b3: the chart moves up; a 500-token answer, either way, in seconds
  const B3 = T('b3') - 0.15;
  S.add(fx.out([map, ...pins, ax1, ratio, caveat], { d: 0.4, stagger: 0 }), B3);
  S.xset(chart1, { x: 0, y: 0, s: 1, ox: 960, oy: 485 });
  S.add(fx.xform(chart1, { x: 0, y: 236 - 485, s: 0.7 }, { d: 0.8, ease: 'power3.inOut' }), B3 + 0.2);
  S.call(() => chart1.setAttribute('data-audit', 'ignore'), B3);
  const C2 = { x0: 520, px: 12, y1: 500, y2: 640, gy: [700, 752], axY: 800 };
  const head = S.text('A 500-token answer, either way', { x: C2.x0, y: 420, size: 34, weight: 700, color: 'ink' });
  S.set(head, { autoAlpha: 0 }, 0);
  S.add(fx.in(head, { from: 'up', d: 0.45, dist: 12 }), B3 + 0.7);
  const ax2 = S.g();
  S.line({ x1: C2.x0, y1: C2.axY, x2: C2.x0 + 90 * C2.px, y2: C2.axY, stroke: 'muted', sw: 2 }, ax2);
  for (let s = 0; s <= 90; s += 15) {
    S.line({ x1: C2.x0 + s * C2.px, y1: C2.axY, x2: C2.x0 + s * C2.px, y2: C2.axY + 8, stroke: 'muted', sw: 2 }, ax2);
    S.text(s === 90 ? '90 s' : String(s), { x: C2.x0 + s * C2.px, y: C2.axY + 30, size: 22, anchor: 'middle', weight: 550, color: 'muted' }, ax2);
  }
  S.set(ax2, { autoAlpha: 0 }, 0);
  S.add(fx.in(ax2, { from: 'fade', d: 0.5 }), B3 + 0.8);
  const rowLbl = (t, y, color = 'ink') => S.text(t, { x: C2.x0 - 20, y: y + 1, size: 28, anchor: 'end', weight: 600, color });
  // the magnifier: the same zoom for both bars, 1 ms = 1 px, so each 30 ms token is 30 px
  const IN = { x: 1000, w: 480 };
  const inset = (y, pattern) => {
    const g = S.g();
    S.rect({ x: IN.x - 6, y: y - 22, w: IN.w + 12, h: 44, r: 10, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.35, sw: 1.5 }, g);
    let x = IN.x;
    while (x < IN.x + IN.w - 1) for (const [ms, tone] of pattern) {
      const w = Math.min(ms, IN.x + IN.w - x);
      if (w > 0) S.rect({ x, y: y - 14, w: Math.max(0, w - 2), h: 28, r: 3, fill: tone, fillOpacity: tone === 'struct' ? 0.9 : 0.7 }, g);
      x += ms;
      if (x >= IN.x + IN.w) break;
    }
    ignore(g);
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  };
  // bar 1: streamed, one connection
  const r1 = rowLbl('Streamed, one connection', C2.y1, 'struct');
  const bar1 = S.rect({ x: C2.x0, y: C2.y1 - 20, w: 0, h: 40, r: 5, fill: 'struct', fillOpacity: 0.9 });
  const cable = S.g();
  const cableGlow = S.line({ x1: C2.x0, y1: C2.y1 - 27, x2: C2.x0 + 15 * C2.px, y2: C2.y1 - 27, stroke: 'helps', sw: 14, cap: 'round', strokeOpacity: 0 }, cable);
  const cableL = S.line({ x1: C2.x0, y1: C2.y1 - 27, x2: C2.x0 + 15 * C2.px, y2: C2.y1 - 27, stroke: 'helps', sw: 4, cap: 'round', strokeOpacity: 0.7 }, cable);
  ignore(cable);
  const T1 = { x: C2.x0 + 15 * C2.px + 16, size: 30, weight: 650, family: 'mono' };
  const t1 = S.text('15 s', { ...T1, y: C2.y1 + 1, color: 'ink' });
  const cnt = S.counter({ x: T1.x + S.measure('15 s', T1) + 24, y: C2.y1 + 1, size: 26, value: 0, color: 'muted', family: 'mono', weight: 600, anchor: 'start' });
  const in1 = inset(C2.y1, [[30, 'struct']]);
  const zoomCap = S.text('zoomed in: the first half second, 1 ms = 1 px', { x: IN.x - 6, y: C2.y1 - 40, size: 22, weight: 550, color: 'muted' });
  S.set(zoomCap, { autoAlpha: 0 }, 0);
  S.set([r1, cable, t1, cnt], { autoAlpha: 0 }, 0);
  const ST = T('b3~streams') - 0.2;
  S.add(fx.in(r1, { from: 'right', d: 0.35, dist: 12 }), ST - 0.3);
  S.add(fx.in([in1, zoomCap], { from: 'fade', d: 0.35, stagger: 0.15 }), ST);
  S.add(gsap.to(bar1, { attr: { width: 15 * C2.px }, duration: 0.9, ease: 'none' }), ST + 0.4);
  S.add(gsap.to(cnt, { autoAlpha: 1, duration: 0.2 }), ST + 0.4);
  S.add(fx.count(cnt, 0, 500, { d: 0.9, ease: 'none', fmt: v => `${Math.round(v)} tokens` }), ST + 0.4);
  S.add(fx.in(t1, { from: 'left', d: 0.3, dist: 10 }), 'b3~fifteen');
  S.add(fx.in(cable, { from: 'fade', d: 0.4 }), ST + 0.4);
  // bar 2: a round trip per token
  const r2 = rowLbl('A round trip per token', C2.y2);
  const bar2 = S.rect({ x: C2.x0, y: C2.y2 - 20, w: 0, h: 40, r: 5, fill: '#6f7c98', fillOpacity: 0.9 });
  const in2 = inset(C2.y2 - 64, [[30, 'struct'], [130, GREY]]);
  S.set(r2, { autoAlpha: 0 }, 0);
  const RTP = T('b3~A round') - 0.1;
  S.add(fx.in(r2, { from: 'right', d: 0.35, dist: 12 }), RTP - 0.2);
  S.add(fx.in(in2, { from: 'fade', d: 0.35 }), RTP);
  S.add(gsap.to(bar2, { attr: { width: 80 * C2.px }, duration: 2.6, ease: 'none' }), RTP + 0.5);
  const eqA = S.text('30 + 130 = 160 ms', { x: 1760, y: 420, size: 30, anchor: 'end', weight: 650, family: 'mono', color: 'ink' });
  const eqB = S.text('× 500 = 80 s', { x: C2.x0 + 80 * C2.px + 16, y: C2.y2 + 1, size: 30, weight: 650, family: 'mono', color: 'ink' });
  S.set([eqA, eqB], { autoAlpha: 0 }, 0);
  S.add(fx.in(eqA, { from: 'up', d: 0.35, dist: 10 }), 'b3~hundred');
  S.add(fx.in(eqB, { from: 'left', d: 0.35, dist: 10 }), 'b3~eighty');
  // 'sixty-five of them waiting': the grey gathers into one block, the blue into another
  const SF = T('b3~sixty-five') - 0.1;
  const mk = S.rect({ x: C2.x0, y: C2.y2 - 20, w: 15 * C2.px, h: 40, r: 5, fill: 'struct', fillOpacity: 0.9 });
  const wt = S.rect({ x: C2.x0 + 15 * C2.px + 2, y: C2.y2 - 20, w: 65 * C2.px - 2, h: 40, r: 5, fill: GREY, fillOpacity: 0.75 });
  const mkL = S.text('15 s making', { x: C2.x0 + 7.5 * C2.px, y: C2.y2 + 1, size: 24, anchor: 'middle', weight: 700, color: '#0a0f1e' });
  const wtL = S.text('65 s waiting', { x: C2.x0 + 47.5 * C2.px, y: C2.y2 + 1, size: 26, anchor: 'middle', weight: 700, color: '#0a0f1e' });
  S.set([mk, wt, mkL, wtL], { autoAlpha: 0 }, 0);
  S.add(gsap.to(bar2, { autoAlpha: 0, duration: 0.4 }), SF);
  S.add(gsap.fromTo(mk, { autoAlpha: 0, attr: { width: 2 } }, { autoAlpha: 1, attr: { width: 15 * C2.px }, duration: 0.5, ease: 'power2.out', immediateRender: false }), SF);
  S.add(gsap.fromTo(wt, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, immediateRender: false }), SF);
  S.add(fx.in([mkL, wtL], { from: 'fade', d: 0.35, stagger: 0.15 }), SF + 0.4);

  // ---------------------------------------------------------------- b4: the quick part and the slow part; open once, and hold
  const rat = S.text('80 / 15 ≈ 5.3 ×', { x: C2.x0 - 20, y: 572, size: 30, anchor: 'end', weight: 700, color: 'ink' });
  S.set(rat, { autoAlpha: 0 }, 0);
  S.add(fx.in(rat, { from: 'up', d: 0.4, dist: 10 }), 'b4~Making-0.1');
  const m15 = ignore(S.line({ x1: C2.x0 + 15 * C2.px, y1: C2.y1 + 24, x2: C2.x0 + 15 * C2.px, y2: C2.axY, stroke: 'struct', sw: 2, dash: '6 6', strokeOpacity: 0.7 }));
  S.set(m15, { autoAlpha: 0 }, 0);
  const NR = T('b4~Nearer') - 0.1;
  S.add(gsap.set(m15, { autoAlpha: 1 }), NR);
  S.add(fx.draw(m15, { d: 0.4 }), NR);
  const ghosts = [['Tokyo: 32.5 s', 32.5], ['same city: 17.5 s', 17.5]].map(([t, s], i) => {
    const g = S.g();
    S.rect({ x: C2.x0, y: C2.gy[i] - 14, w: s * C2.px, h: 28, r: 4, fill: '#6f7c98', fillOpacity: 0.35, stroke: '#6f7c98', strokeOpacity: 0.6, sw: 1.5, dash: '5 4' }, g);
    S.text(t, { x: C2.x0 + s * C2.px + 14, y: C2.gy[i] + 1, size: 24, weight: 600, color: 'muted' }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    S.add(gsap.fromTo(g, { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power3.out' }), NR + 0.2 + i * 0.2);
    return g;
  });
  const OP = T('b4~opened') - 0.1;
  S.add(gsap.to([mk, wt, mkL, wtL, eqB, r2, ...ghosts], { opacity: 0.35, duration: 0.4 }), OP);
  // a cross over the whole losing option: bar 2 and both ghosts
  const CX0 = C2.x0 - 10, CX1 = C2.x0 + 80 * C2.px + 10, CY0 = C2.y2 - 30, CY1 = C2.gy[1] + 22;
  const xa = ignore(S.line({ x1: CX0, y1: CY0, x2: CX1, y2: CY1, stroke: 'muted', sw: 6, cap: 'round' }));
  const xb = ignore(S.line({ x1: CX1, y1: CY0, x2: CX0, y2: CY1, stroke: 'muted', sw: 6, cap: 'round' }));
  S.set([xa, xb], { autoAlpha: 0 }, 0);
  S.add(gsap.set([xa, xb], { autoAlpha: 1 }), OP + 0.1);
  S.add(fx.draw([xa, xb], { d: 0.35, stagger: 0.2 }), OP + 0.1);
  S.add(gsap.to(cableL, { attr: { 'stroke-opacity': 1, 'stroke-width': 6 }, duration: 0.4 }), OP);
  S.add(gsap.to(cableGlow, { attr: { 'stroke-opacity': 0.3 }, duration: 0.4 }), OP);
  const held = S.text('opened once, held', { x: C2.x0 - 20, y: C2.y1 + 34, size: 26, anchor: 'end', weight: 650, color: 'helps' });
  S.set(held, { autoAlpha: 0 }, 0);
  S.add(fx.in(held, { from: 'left', d: 0.35, dist: 10 }), OP + 0.3);
});
