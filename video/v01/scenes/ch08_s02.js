/* ch08_s02 · what a weighted average is (fig 93)
   b1  'A plain average counts everything equally': tiles 10, 20, 30; chips '× 1/3' with equal amber bars;
       '(10 + 20 + 30) / 3 = 20'; the marker drops on 20.
   b2  'A weighted average lets some count more': the chips flip to 0.5, 0.3, 0.2 and the bars resize to
       scale; products 5, 6, 6 fly into '5 + 6 + 6 = 17'; the marker slides to 17.
   b3  '0.5 + 0.3 + 0.2 = 1'; the 10-30 span brightens, 'stays in range'; an arrow from 20 pulls to 17.
   b4  the chips swap to 0.2, 0.3, 0.5; '2 + 6 + 15 = 23'; marker to 23; the tiles pulse (untouched);
       'what the values are' / 'how much each counts' with a divider, tagged 'attention'.
   The tiles never move or change size. Bars: 400 px per weight of 1.
   Checks: 10·0.5 + 20·0.3 + 30·0.2 = 17; 10·0.2 + 20·0.3 + 30·0.5 = 23; (10 + 20 + 30) / 3 = 20. */
V.scene('ch08_s02', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const E = n => gsap.parseEase(n);
  const clock = (a, b, fn) => S.add(ch08Drive(b - a, k => fn(a + k * (b - a))), a);
  const fade = (els, a, b, at, d = 0.45) => S.add(ch08Fade(els, a, b, { d }), at);

  // headers, top-left
  const hA = S.text('A plain average counts everything equally', { x: 120, y: 150, size: 46, weight: 700, family: 'display', color: 'ink' });
  const hB = S.text([{ t: 'A weighted average lets ' }, { t: 'some count more', c: 'compute' }], { x: 120, y: 150, size: 46, weight: 700, family: 'display', color: 'ink' });
  ch08Hide([hA, hB]);
  fade(hA, 0, 1, 0.8, 0.6);

  // ================================================================ the tiles, chips, bars
  const VALS = [10, 20, 30], TX = [330, 560, 790], TY = 360;
  const tiles = VALS.map((v, i) => {
    const g = S.g();
    S.rect({ x: TX[i] - 75, y: TY - 55, w: 150, h: 110, r: 18, fill: '#0c1326' }, g);
    S.rect({ x: TX[i] - 75, y: TY - 55, w: 150, h: 110, r: 18, fill: 'url(#card-struct)', stroke: 'struct', sw: 3 }, g);
    S.text(String(v), { x: TX[i], y: TY + 3, size: 58, weight: 700, family: 'mono', anchor: 'middle', color: 'ink' }, g);
    return g;
  });
  const tileGlow = VALS.map((v, i) => S.rect({ x: TX[i] - 75, y: TY - 55, w: 150, h: 110, r: 18, stroke: 'white', sw: 4, opacity: 0 }));
  tileGlow.forEach(e => e.setAttribute('data-audit', 'ignore'));
  const tA = [T('b1~ten'), T('b1~twenty'), T('b1~thirty')];
  tiles.forEach((g, i) => S.add(fx.in(g, { from: 'scale', d: 0.45, scale: 0.85 }), tA[i] - 0.1));
  // chips: '× w' in amber; each set of three is its own <text>s, crossfaded
  const CY = 486, BY = 548, PX = 400;
  const chipBox = TX.map(x => S.rect({ x: x - 66, y: CY - 26, w: 132, h: 52, r: 14, fill: '#24190a', stroke: 'compute', sw: 2.5 }));
  ch08Hide(chipBox);
  const chipSet = labels => labels.map((l, i) => { const e = S.text(`× ${l}`, { x: TX[i], y: CY + 1, size: 30, weight: 700, family: 'mono', anchor: 'middle', color: 'compute' }); ch08Hide(e); return e; });
  const W0 = chipSet(['1/3', '1/3', '1/3']), W1 = chipSet(['0.5', '0.3', '0.2']), W2 = chipSet(['0.2', '0.3', '0.5']);
  // bars, drawn to scale: width = 400 × weight, centred under the tile
  const bars = TX.map(x => S.rect({ x, y: BY - 9, w: 0, h: 18, r: 5, fill: 'compute' }));
  const tChip = T('b1~is') - 0.1;
  fade(chipBox, 0, 1, tChip);
  fade(W0, 0, 1, tChip + 0.1);
  // weights over time: [t, i, from, to]
  const WT = { b1: tChip + 0.2, f1: T('b2~half') - 0.1, f2: T('b2~three') - 0.1, f3: T('b2~two') - 0.1, g: T('b4~Change') + 0.1 };
  const wAt = (i, t) => {
    const k = (t0, d = 0.5) => E('power2.inOut')(cl((t - t0) / d));
    let w = (1 / 3) * k(WT.b1, 0.6);
    const step1 = [WT.f1, WT.f2, WT.f3][i], v1 = [0.5, 0.3, 0.2][i], v2 = [0.2, 0.3, 0.5][i];
    w += (v1 - 1 / 3) * k(step1);
    w += (v2 - v1) * k(WT.g + 0.1 * i, 0.7);
    return w;
  };
  const paintBars = t => bars.forEach((b, i) => { const w = PX * wAt(i, t); b.setAttribute('x', (TX[i] - w / 2).toFixed(2)); b.setAttribute('width', w.toFixed(2)); });
  paintBars(0);
  clock(WT.b1, WT.g + 1.0, paintBars);
  // 'each counting equally': the three bars pulse together
  S.add(gsap.fromTo(bars, { attr: { 'fill-opacity': 1 } }, { attr: { 'fill-opacity': 0.5 }, duration: 0.2, yoyo: true, repeat: 1, immediateRender: false }), 'b1~equally-0.1');
  // the chip flips, one per spoken weight
  [WT.f1, WT.f2, WT.f3].forEach((t, i) => { fade(W0[i], 1, 0, t, 0.2); fade(W1[i], 0, 1, t + 0.15, 0.3); });

  // ================================================================ the equation box and the number line
  const EB = { x: 1160, y: 300, w: 660, h: 160, cx: 1490, cy: 380 };
  const eqBox = S.g();
  S.card({ x: EB.x, y: EB.y, w: EB.w, h: EB.h, tone: 'compute', r: 22 }, eqBox);
  ch08Hide(eqBox);
  fade(eqBox, 0, 1, T('b1~ten') - 0.2, 0.5);
  const eqA = S.equation([{ t: '(10 + 20 + 30)', tone: 'ink' }, { t: '/ 3', tone: 'compute' }, { t: '= 20', tone: 'struct' }], { x: EB.cx, y: EB.cy, size: 42, family: 'mono', gap: 18 });
  const eqB = S.equation([{ t: '5', tone: 'compute' }, { t: '+', tone: 'muted' }, { t: '6', tone: 'compute' }, { t: '+', tone: 'muted' }, { t: '6', tone: 'compute' }, { t: '= 17', tone: 'struct' }], { x: EB.cx, y: EB.cy, size: 54, family: 'mono', gap: 22 });
  const eqC = S.equation([{ t: '2', tone: 'compute' }, { t: '+', tone: 'muted' }, { t: '6', tone: 'compute' }, { t: '+', tone: 'muted' }, { t: '15', tone: 'compute' }, { t: '= 23', tone: 'struct' }], { x: EB.cx, y: EB.cy, size: 54, family: 'mono', gap: 22 });
  ch08Hide([...eqA.parts, ...eqB.parts, ...eqC.parts]);
  fade(eqA.parts[0], 0, 1, T('b1~ten') + 0.1, 0.5);
  fade(eqA.parts[1], 0, 1, T('b1~is') - 0.15, 0.4);
  fade(eqA.parts[2], 0, 1, T('b1~twenty#2') - 0.05, 0.4);
  // the number line: 10 → x 420, 30 → x 1500 (54 px per unit)
  const NL = { x0: 420, x1: 1500, y: 880 }, NX = v => NL.x0 + (NL.x1 - NL.x0) * (v - 10) / 20;
  const line = S.g();
  S.line({ x1: NL.x0 - 60, y1: NL.y, x2: NL.x1 + 60, y2: NL.y, stroke: 'ink', strokeOpacity: 0.5, sw: 3 }, line);
  [10, 15, 20, 25, 30].forEach(v => {
    S.line({ x1: NX(v), y1: NL.y - 10, x2: NX(v), y2: NL.y + 10, stroke: 'ink', strokeOpacity: 0.6, sw: 2.5 }, line);
    S.text(String(v), { x: NX(v), y: NL.y + 38, size: 28, weight: 600, family: 'mono', anchor: 'middle', color: 'muted' }, line);
  });
  const span = S.rect({ x: NX(10), y: NL.y - 4, w: NX(30) - NX(10), h: 8, r: 4, fill: 'struct', opacity: 0 });
  span.setAttribute('data-audit', 'ignore');
  ch08Hide(line);
  fade(line, 0, 1, 1.4, 0.6);
  // the marker: a white pointer with its value
  const mk = S.g();
  S.path({ d: `M0,${NL.y - 14} l-12,-20 h24 Z`, fill: 'white' }, mk);
  S.line({ x1: 0, y1: NL.y - 14, x2: 0, y2: NL.y + 12, stroke: 'white', sw: 3 }, mk);
  const mkVal = S.text('20', { x: 0, y: NL.y - 56, size: 32, weight: 750, family: 'mono', anchor: 'middle', color: 'white' }, mk);
  mk.querySelector('line').setAttribute('data-audit', 'ignore');
  ch08Hide(mk);
  const tDrop = T('b1~twenty#2') + 0.1;
  const MV = [[tDrop, 20, 20], [T('b2~seventeen') + 0.1, 20, 17], [T('b4~moves') - 0.1, 17, 23]];
  const mkAt = t => {
    let v = 20;
    MV.forEach(([t0, a, b], j) => { if (t >= t0) v = a + (b - a) * E('power2.inOut')(cl((t - t0) / 0.8)); });
    const drop = E('bounce.out')(cl((t - tDrop) / 0.5));
    mk.setAttribute('transform', `translate(${NX(v).toFixed(2)},${(-40 * (1 - drop)).toFixed(2)})`);
    mkVal.textContent = String(Math.round(v));
  };
  mkAt(0);
  fade(mk, 0, 1, tDrop, 0.2);
  clock(tDrop, MV[2][0] + 0.9, mkAt);

  // ================================================================ b2: weights; products into the box
  fade(hA, 1, 0, T('b2') - 0.1, 0.3);
  fade(hB, 0, 1, T('b2') + 0.1, 0.5);
  const PY = 606;
  const prods = ['5', '6', '6'].map((p, i) => S.text(p, { x: TX[i], y: PY, size: 40, weight: 750, family: 'mono', anchor: 'middle', color: 'compute' }));
  ch08Hide(prods);
  const tP = [T('b2~Five'), T('b2~six'), T('b2~six#2')];
  prods.forEach((e, i) => fade(e, 0, 1, tP[i] - 0.1, 0.3));
  // they fly into the box as the old equation leaves
  const tFly = T('b2~makes') - 0.15;
  fade(eqA.parts, 1, 0, tP[0] - 0.2, 0.35);
  const targets = [eqB.parts[0], eqB.parts[2], eqB.parts[4]];
  prods.forEach((e, i) => {
    const dx = targets[i].cx - TX[i], dy = EB.cy - PY;
    S.add(gsap.fromTo(e, { x: 0, y: 0 }, { x: dx, y: dy, duration: 0.6, ease: 'power3.inOut', immediateRender: false }), tFly + 0.06 * i);
    fade(e, 1, 0, tFly + 0.6 + 0.06 * i, 0.1);
  });
  S.add(ch08Ignore(prods, 0.9), tFly);
  fade([eqB.parts[0], eqB.parts[2], eqB.parts[4]], 0, 1, tFly + 0.62, 0.1);
  fade([eqB.parts[1], eqB.parts[3]], 0, 1, tFly + 0.5, 0.3);
  fade(eqB.parts[5], 0, 1, T('b2~seventeen') - 0.1, 0.4);

  // ================================================================ b3: in range, pulled towards ten
  const sum = S.text([{ t: '0.5 + 0.3 + 0.2 = ', c: 'compute' }, { t: '1', c: 'white', w: 800 }], { x: TX[1], y: 650, size: 30, weight: 650, family: 'mono', anchor: 'middle' });
  ch08Hide(sum);
  fade(sum, 0, 1, T('b3~add') - 0.1);
  const range = S.bracket({ x1: NX(10), x2: NX(30), y: NL.y - 90, label: 'stays in range', tone: 'struct', size: 28, up: true });
  ch08Hide(range);
  const tRange = T('b3~between') - 0.1;
  fade(range, 0, 1, tRange);
  S.add(gsap.fromTo(span, { attr: { opacity: 0 } }, { attr: { opacity: 0.85 }, duration: 0.5, immediateRender: false }), tRange);
  const pull = S.arrow({ x1: NX(20), y1: NL.y + 76, x2: NX(17) + 4, y2: NL.y + 76, color: 'compute', sw: 4, head: 14 });
  ch08Hide(pull);
  fade(pull, 0, 1, T('b3~pulled') - 0.1, 0.01);
  S.add(fx.drawArrow(pull, { d: 0.5 }), T('b3~pulled') - 0.1);
  S.add(gsap.fromTo([chipBox[0], W1[0]], { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.15, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%', immediateRender: false }), 'b3~counts-0.05');

  // ================================================================ b4: only the weights change
  const t4 = T('b4') - 0.1;
  fade([sum, pull, range], 1, 0, t4, 0.35);
  S.add(gsap.to(span, { attr: { opacity: 0 }, duration: 0.35 }), t4);
  W1.forEach((e, i) => { fade(e, 1, 0, WT.g + 0.1 * i, 0.2); fade(W2[i], 0, 1, WT.g + 0.1 * i + 0.15, 0.3); });
  fade(eqB.parts, 1, 0, T('b4~answer') - 0.3, 0.3);
  fade(eqC.parts.slice(0, 5), 0, 1, T('b4~answer') - 0.05, 0.4);
  fade(eqC.parts[5], 0, 1, T('b4~moves') + 0.2, 0.4);
  // the tiles, untouched, pulse white once
  S.add(gsap.fromTo(tileGlow, { attr: { opacity: 0 } }, { attr: { opacity: 1 }, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), 'b4~no-0.05');
  // the separation: values above the divider, how much each counts below it
  const lblV = S.text('what the values are', { x: TX[1], y: 268, size: 30, weight: 650, anchor: 'middle', color: 'struct' });
  const lblW = S.text('how much each counts', { x: TX[2] + 110, y: CY + 1, size: 30, weight: 650, color: 'compute' });
  const div = S.line({ x1: TX[0] - 110, y1: 432, x2: 960, y2: 432, stroke: 'ink', strokeOpacity: 0.5, sw: 2 });
  const attn = S.pill('attention', { x: 1046, y: 432, tone: 'struct', size: 28, h: 48 });
  ch08Hide([lblV, lblW, attn]);
  S.set(div, { autoAlpha: 0 }, 0);
  fade(lblV, 0, 1, T('b4~What') - 0.1);
  fade(lblW, 0, 1, T('b4~how') - 0.1);
  S.add(fx.draw(div, { d: 0.6 }), T('b4~how') + 0.2);
  fade(attn, 0, 1, T('b4~attention') - 0.1);
});
