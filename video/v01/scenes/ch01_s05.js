/* ch01_s05 · the generate loop (fig 7)
   Text so far → run the whole model → one new token → append, go round again. Every turn lights
   every weight (coral: a weight being read). 500 tokens = 500 runs of the whole model. */
V.scene('ch01_s05', S => {
  const { fx } = S;

  // ---------------------------------------------------------------- the panel and its three boxes
  const PNL = { x: 200, y: 300, w: 1520, h: 500 };
  const panel = S.card({ x: PNL.x, y: PNL.y, w: PNL.w, h: PNL.h, tone: 'neutral', title: '' });
  const title = S.text('One turn of the loop', { x: 960, y: PNL.y + 48, size: 36, anchor: 'middle', weight: 700, family: 'display', color: 'ink' });
  const BY = 525, BH = 180;
  const B = {
    text: { x: 250, w: 520, tone: 'struct', name: 'text so far' },
    model: { x: 860, w: 380, tone: 'bytes', name: 'run the whole model' },
    out: { x: 1320, w: 350, tone: 'struct', name: 'one new token' },
  };
  const boxes = {}, names = [];
  for (const [k, b] of Object.entries(B)) {
    const g = S.g();
    S.rect({ x: b.x, y: BY - BH / 2, w: b.w, h: BH, r: 18, fill: '#0c1326' }, g);
    g.bg = S.rect({ x: b.x, y: BY - BH / 2, w: b.w, h: BH, r: 18, fill: `url(#card-${b.tone})`, stroke: b.tone, sw: 2.5, strokeOpacity: 0.8 }, g);
    const nm = S.text(b.name, { x: b.x + b.w / 2, y: BY - BH / 2 - 28, size: 28, anchor: 'middle', weight: 650, color: b.tone }, g);
    names.push(nm);
    Object.assign(g, { l: b.x, r: b.x + b.w, cx: b.x + b.w / 2 });
    boxes[k] = g;
  }
  const a1 = S.arrow({ x1: boxes.text.r + 10, y1: BY, x2: boxes.model.l - 10, y2: BY, color: 'muted', sw: 3, head: 14 });
  const a2 = S.arrow({ x1: boxes.model.r + 10, y1: BY, x2: boxes.out.l - 10, y2: BY, color: 'muted', sw: 3, head: 14 });
  const RY = 700;
  const retD = `M${boxes.out.cx},${BY + BH / 2 + 8} L${boxes.out.cx},${RY} L${boxes.text.cx},${RY} L${boxes.text.cx},${BY + BH / 2 + 12}`;
  const ret = S.g();
  const retPath = S.path({ d: retD, stroke: 'struct', sw: 3, strokeOpacity: 0.8 }, ret);
  const retHead = S.path({ d: `M${boxes.text.cx - 10},${BY + BH / 2 + 26} L${boxes.text.cx},${BY + BH / 2 + 12} L${boxes.text.cx + 10},${BY + BH / 2 + 26}`, stroke: 'struct', sw: 3 }, ret);
  const retLbl = S.text('append, go round again', { x: 960, y: RY + 42, size: 26, anchor: 'middle', color: 'muted', weight: 550 });

  S.add(fx.in(panel, { from: 'fade', d: 0.5 }), 0.1);
  S.add(fx.in(title, { from: 'up', d: 0.5 }), 0.3);
  S.add(fx.in(Object.values(boxes), { from: 'up', d: 0.5, stagger: 0.12 }), 0.45);
  S.add(fx.drawArrow([a1, a2], { d: 0.4 }), 1.0);
  S.set([retPath, retHead], { autoAlpha: 0 }, 0);
  S.add(gsap.set([retPath, retHead], { autoAlpha: 1 }), 1.2);
  S.add(fx.draw(retPath, { d: 0.8 }), 1.2);
  S.add(fx.in(retLbl, { from: 'up', d: 0.4 }), 1.6);

  // the weights inside the coral box
  const G = { cw: 30, ch: 20, gap: 4 };
  const gw = 10 * (G.cw + G.gap) - G.gap, gh = 4 * (G.ch + G.gap) - G.gap;
  const tiles = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) {
    const x = boxes.model.cx - gw / 2 + c * (G.cw + G.gap), y = BY - gh / 2 + 6 + r * (G.ch + G.gap);
    const t = S.rect({ x, y, w: G.cw, h: G.ch, r: 4, fill: 'url(#card-struct)', stroke: 'struct', sw: 1.2, strokeOpacity: 0.6 });
    t.r = r; t.c = c;
    tiles.push(t);
  }
  S.set(tiles, { autoAlpha: 0 }, 0);
  S.add(gsap.to(tiles, { autoAlpha: 1, duration: 0.3, stagger: 0.01 }), 0.9);

  // ---------------------------------------------------------------- the text so far, as pills
  const WORDS = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog'];
  const PS = 24, PH = 40, GAPX = 8, INNER = B.text.w - 36;
  const pw = WORDS.map(w => S.measure(w, { size: PS, weight: 600, case: 'keep' }) + 24);
  const slots = [];
  let x = 0, row = 0;
  pw.forEach((w, i) => {
    if (x + w > INNER) { x = 0; row++; }
    slots.push({ x: B.text.x + 18 + x + w / 2, y: BY - 32 + row * 58 });
    x += w + GAPX;
  });
  const pill = (w, i, tone = 'struct') => S.pill(w, { x: slots[i].x, y: slots[i].y, h: PH, w: pw[i], size: PS, tone, case: 'keep' });
  // the five from the previous scene drop in from the top band
  const top = WORDS.slice(0, 5).map((w, i) => S.pill(w, { x: 360 + i * 130, y: 200, h: 56, size: 32, tone: 'struct', case: 'keep' }));
  S.add(gsap.to(top, { autoAlpha: 0, y: 40, duration: 0.4, stagger: 0.05, ease: 'power2.in' }), 0.9);
  const row0 = WORDS.slice(0, 5).map((w, i) => pill(w, i));
  S.add(gsap.fromTo(row0, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.05, ease: 'power3.out' }), 1.15);

  // ---------------------------------------------------------------- the turns
  const OUTC = { x: boxes.out.cx, y: BY };
  const turns = [
    { word: 'over', flow: S.t('b1~whole'), out: S.t('b1~new') - 0.05, back: S.t('b2~appended') - 0.1, travel: 0.8 },
    { word: 'the', flow: S.t('b2~again'), out: S.t('b2~again') + 0.6, back: S.t('b2~again') + 0.75, travel: 0.5 },
    { word: 'lazy', flow: S.t('b2~again') + 1.35, out: S.t('b2~again') + 1.85, back: S.t('b2~again') + 1.95, travel: 0.45 },
    { word: 'dog', flow: S.t('b2~again') + 2.5, out: S.t('b2~again') + 2.95, back: S.t('b2~again') + 3.05, travel: 0.4 },
  ];
  turns.forEach((tn, k) => {
    const i = 5 + k;
    // the text goes in: a stream of blue along the first arrow
    S.flow({ d: `M${boxes.text.r - 20},${BY} L${boxes.model.l + 20},${BY}`, from: tn.flow, to: tn.flow + 0.45, speed: 500, every: 0.06, size: 6, color: 'struct' });
    // the new token pops in the output box, then rides the return arrow to the end of the row
    const p = pill(tn.word, i);
    p.setAttribute('data-audit', 'ignore');   // rides the return arrow, across its line, by design
    const dx0 = OUTC.x - slots[i].x, dy0 = OUTC.y - slots[i].y, dyR = RY - slots[i].y;
    S.set(p, { autoAlpha: 0 }, 0);
    S.add(gsap.fromTo(p, { autoAlpha: 0, x: dx0, y: dy0, scale: 0.5, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1.2, duration: 0.3, ease: 'back.out(2)' }), tn.out);
    const tl = gsap.timeline();
    const d = tn.travel;
    tl.to(p, { scale: 1, y: dyR, duration: d * 0.25, ease: 'power1.in' })
      .to(p, { x: 0, duration: d * 0.5, ease: 'none' })
      .to(p, { y: 0, duration: d * 0.25, ease: 'power1.out' });
    S.add(tl, tn.back);
  });
  // the grid lights coral, top row to bottom, on each turn, and in a blur while the counter runs to 500
  const BLUR = { from: S.t('b3~running'), to: S.t('b4') + 0.4 };
  const lit = t => {
    const rowLit = [false, false, false, false];
    turns.forEach(tn => { for (let r = 0; r < 4; r++) { const s = tn.flow + 0.3 + r * 0.09; if (t >= s && t < s + 0.35) rowLit[r] = true; } });
    if (t >= BLUR.from && t < BLUR.to) { const ph = ((t - BLUR.from) / 0.22) % 1; for (let r = 0; r < 4; r++) if (Math.abs(ph - r / 4) < 0.22) rowLit[r] = true; }
    const hold = S.t('b4~token');                                  // b4: one held turn, every tile lit once more
    for (let r = 0; r < 4; r++) { const s = hold - 1.6 + r * 0.12; if (t >= s && t < s + 0.5) rowLit[r] = true; }
    return rowLit;
  };
  const coral = S.tone('bytes'), blue = S.tone('struct');
  let lastKey = '';
  const paint = t => {
    const rl = lit(t), key = rl.join();
    if (key === lastKey) return;
    lastKey = key;
    tiles.forEach(tl => {
      tl.setAttribute('fill', rl[tl.r] ? 'url(#card-bytes)' : 'url(#card-struct)');
      tl.setAttribute('stroke', rl[tl.r] ? coral : blue);
      tl.setAttribute('stroke-opacity', rl[tl.r] ? 1 : 0.6);
    });
  };
  const clock = { t: 0 };
  S.add(gsap.fromTo(clock, { t: 0 }, { t: S.duration, duration: S.duration, ease: 'none', immediateRender: false, onUpdate: () => paint(clock.t) }), 0);

  // the counter: model runs
  const counter = S.counter({ x: 1700, y: 196, size: 56, value: 0, anchor: 'end', color: 'ink', family: 'mono', weight: 650 }, S.hud);
  const cLbl = S.text('model runs', { x: 1700, y: 246, size: 26, anchor: 'end', color: 'muted', weight: 550 }, S.hud);
  S.add(fx.in([counter, cLbl], { from: 'down', d: 0.4 }), 'b1~new-0.35');
  turns.forEach((tn, k) => S.add(fx.count(counter, k, k + 1, { d: 0.2, fmt: v => String(Math.round(v)) }), tn.out));
  S.add(fx.swap(title, 'the generate loop'), 'b2~generate-0.1');

  // ---------------------------------------------------------------- b3: five hundred tokens, five hundred runs
  S.add(fx.out([title, retLbl, cLbl], { d: 0.35 }), 'b3~five');
  const eq = S.equation([{ t: '500 tokens', tone: 'struct' }, { t: '÷ 1.2–1.6 tokens per word', tone: 'muted' }, { t: '≈ 310–420 words', tone: 'ink' }], { x: 960, y: 872, size: 34 });
  S.add(fx.in(eq.parts[0], { from: 'up', d: 0.45 }), 'b3~five');
  S.add(fx.in(eq.parts.slice(1), { from: 'up', d: 0.45, stagger: 0.25 }), 'b3~few-0.1');
  S.flow({ d: `M${boxes.text.r - 20},${BY} L${boxes.model.l + 20},${BY}`, from: BLUR.from, to: BLUR.to, speed: 900, every: 0.05, size: 6, color: 'struct' });
  S.flow({ d: retD, from: BLUR.from, to: BLUR.to, speed: 1800, every: 0.08, size: 6, color: 'struct' });
  S.add(fx.count(counter, 4, 500, { d: S.t('b3~times') + 0.3 - BLUR.from, ease: 'power2.in', fmt: v => String(Math.round(v)) }), BLUR.from);
  const big = S.text('70 billion weights, every turn', { x: boxes.model.cx, y: PNL.y + 48, size: 30, anchor: 'middle', color: 'bytes', weight: 650 });
  S.add(fx.in(big, { from: 'down', d: 0.45 }), 'b3~seventy-billion-parameter');

  // ---------------------------------------------------------------- b4: the shape of the entire problem
  S.add(fx.out([eq.parts, big].flat(), { d: 0.4 }), 'b4+0.2');
  S.add(gsap.fromTo(retPath, { attr: { 'stroke-width': 3 } }, { attr: { 'stroke-width': 7 }, duration: 0.4, yoyo: true, repeat: 1 }), 'b4~token');
  S.add(gsap.fromTo([retPath, retHead], { filter: 'none' }, { filter: 'url(#glow-struct)', duration: 0.4 }), 'b4~token');
  const take = S.takeaway('the whole model, once per token', { tone: 'bytes' });
  S.add(fx.in(take, { from: 'up', d: 0.5 }), 'b4~Almost');
});
