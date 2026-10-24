/* ch01_s06 · a score for every token (fig 8)
   Out of one turn comes a score (logit) for every token in the vocabulary, not a word.
   Scores are results: blue. Values illustrative, shape real. */
V.scene('ch01_s06', S => {
  const { fx } = S;

  // ---------------------------------------------------------------- b1: through the 'one new token' box
  const loop = S.g();
  const LB = [[250, 520, 'struct', 'text so far'], [860, 380, 'bytes', 'run the whole model'], [1320, 350, 'struct', 'one new token']];
  LB.forEach(([x, w, tone, name]) => {
    S.rect({ x, y: 435, w, h: 180, r: 18, fill: '#0c1326' }, loop);
    S.rect({ x, y: 435, w, h: 180, r: 18, fill: `url(#card-${tone})`, stroke: tone, sw: 2.5, strokeOpacity: 0.8 }, loop);
    S.text(name, { x: x + w / 2, y: 407, size: 28, anchor: 'middle', weight: 650, color: tone }, loop);
  });
  S.path({ d: 'M1495,623 L1495,700 L510,700 L510,627', stroke: 'struct', sw: 3, strokeOpacity: 0.8 }, loop);
  [[780, 850], [1250, 1310]].forEach(([a, b]) => S.arrow({ x1: a, y1: 525, x2: b, y2: 525, color: 'muted', sw: 3, head: 14 }, loop));
  loop.setAttribute('data-audit', 'ignore');
  S.add(fx.cam({ x: 1495, y: 525, scale: 7, d: 1.3, ease: 'power3.in' }), 'b1~What-0.1');
  S.add(gsap.to(loop, { autoAlpha: 0, duration: 0.35 }), S.t('b1~What') + 0.85);
  S.add(fx.cam({ x: 960, y: 540, scale: 1, d: 0.01 }), S.t('b1~What') + 1.25);

  // the text so far, then a blank
  const WORDS = ['curled', 'up', 'asleep', 'on', 'the', 'sofa', 'was', 'a'];
  const TY = 190;
  let x = 470;
  const pills = WORDS.map(w => { const p = S.pill(w, { x, y: TY, h: 56, size: 30, tone: 'struct', anchor: 'start' }); x += p.w + 12; return p; });
  const slot = S.g();
  S.rect({ x, y: TY - 28, w: 110, h: 56, r: 16, fill: 'none', stroke: 'ink', sw: 2.5, dash: '8 7' }, slot);
  S.text('?', { x: x + 55, y: TY + 1, size: 34, anchor: 'middle', weight: 700, color: 'ink' }, slot);
  const t0 = S.t('b1~curled'), t1 = S.t('b1~was a') + 0.23;
  pills.forEach((p, i) => S.add(fx.pop(p), t0 + (t1 - t0) * i / (WORDS.length - 1)));
  S.add(fx.in(slot, { from: 'fade', d: 0.3 }), 'b1~blank-0.1');
  S.add(gsap.fromTo(slot, { opacity: 1 }, { opacity: 0.35, duration: 0.5, yoyo: true, repeat: 33, ease: 'sine.inOut' }), S.t('b1~blank') + 0.3);
  const heading = S.text('it scores every token it knows', { x: 960, y: 280, size: 34, anchor: 'middle', color: 'muted', weight: 600 });
  S.add(fx.in(heading, { from: 'up', d: 0.45 }), 'b1~scores');

  // ---------------------------------------------------------------- b2: four scores, to scale
  const ROW = i => 380 + i * 100, BX = 640, U = 100;   // 100 px per unit of score
  const C = [
    { label: 'cat', icon: 'fluent:cat-face', v: 8.2, at: 'b2~Cat', vat: 'b2~eight' },
    { label: 'dog', icon: 'fluent:dog-face', v: 7.1, at: 'b2~Dog', vat: 'b2~seven' },
    { label: 'the', icon: null, v: 3.5, at: 'b2~The', vat: 'b2~three' },
    { label: 'banana', icon: 'fluent:banana', v: 0.4, at: 'b2~Banana', vat: 'b2~four' },
  ];
  const chart = S.g();
  const rows = C.map((c, i) => {
    const g = S.g(null, chart);
    if (c.icon) g.icon = S.icon(c.icon, { x: 420, y: ROW(i), size: 52 }, g);
    g.label = S.text(c.label, { x: 460, y: ROW(i), size: 34, weight: 600, color: 'ink' }, g);
    g.bar = S.bar({ x: BX, y: ROW(i) - 24, w: c.v * U, h: 48, frac: 1, tone: 'struct', track: false }, g);
    g.val = S.text(c.v.toFixed(1).replace(/^0/, '0'), { x: BX + c.v * U + 18, y: ROW(i) + 1, size: 34, family: 'mono', weight: 600, color: 'struct' }, g);
    S.add(fx.in([g.icon, g.label].filter(Boolean), { from: 'left', d: 0.35 }), `${c.at}-0.15`);
    S.add(fx.grow(g.bar, { d: 0.6 }), `${c.at}`);
    S.add(fx.in(g.val, { from: 'left', d: 0.3 }), `${c.vat}`);
    return g;
  });

  // ---------------------------------------------------------------- b3: and so on, through the whole vocabulary
  const clipId = 'ch01s06-tail';
  const cp = S.el('clipPath', { id: clipId }, S.el('defs', null, S.layers.back));
  S.rect({ x: 300, y: 730, w: 1400, h: 120 }, cp);
  const tail = S.g({ 'clip-path': `url(#${clipId})` });
  tail.setAttribute('data-audit', 'ignore');
  const strip = S.g(null, tail);
  const rnd = S.rand(5);
  for (let k = 0; k < 220; k++) {
    const v = 0.05 + Math.pow(rnd(), 3) * 2.6;
    S.rect({ x: BX, y: 740 + k * 9, w: v * U, h: 6, r: 2, fill: 'struct', fillOpacity: 0.55 }, strip);
  }
  S.set(tail, { autoAlpha: 0 }, 0);
  S.add(gsap.to(tail, { autoAlpha: 1, duration: 0.3 }), 'b3~And');
  S.add(gsap.fromTo(strip, { y: 0 }, { y: -1800, duration: S.t('b3~tokens') + 0.4 - S.t('b3~And'), ease: 'power1.in' }), 'b3~And');
  S.add(gsap.to(tail, { autoAlpha: 0, duration: 0.4 }), 'b3~tokens+0.4');
  const more = S.g();
  const moreN = S.counter({ x: 900, y: 892, size: 34, value: 0, anchor: 'end', color: 'struct', family: 'mono', weight: 650 }, more);
  const moreT1 = S.text('and', { x: 900 - 158, y: 892, size: 34, anchor: 'end', color: 'muted', weight: 550 }, more);
  const moreT2 = S.text('more, all scored', { x: 920, y: 892, size: 34, color: 'muted', weight: 550 }, more);
  S.add(fx.in(more, { from: 'up', d: 0.4 }), 'b3~And');
  S.add(fx.count(moreN, 0, 128252, { d: 2.6, ease: 'power2.out' }), 'b3~And+0.1');
  S.add(fx.swap(heading, 'vocabulary: every token it knows'), 'b3~vocabulary-0.1');
  S.add(fx.swap(heading, 'higher = better fit'), 'b3~Higher-0.1');
  S.add(gsap.fromTo(rows[0].bar, { filter: 'none' }, { filter: 'url(#glow-struct)', duration: 0.4, yoyo: true, repeat: 3 }), 'b3~Higher');
  S.add(fx.swap(heading, 'logits: the raw scores'), 'b3~logits-0.15');

  // ---------------------------------------------------------------- b4: the shape is real
  S.add(fx.out(more, { d: 0.35 }), 'b4');
  S.add(fx.out(chart, { d: 0.45 }), 'b4~shape-0.2');
  const HB = { x: 340, y: 800, w: 20, gap: 7, u: 52 };
  const HV = [8.2, 7.1, 3.5, 2.1, 1.5, 1.2, 1.0, 0.85, 0.72];
  for (let k = 0; k < 42; k++) HV.push(0.6 * Math.exp(-k / 12) + 0.06);
  const hist = S.g();
  const hbars = HV.map((v, k) => S.rect({ x: HB.x + k * (HB.w + HB.gap), y: HB.y - v * HB.u, w: HB.w, h: v * HB.u, r: 3, fill: 'struct', fillOpacity: k < 2 ? 1 : 0.75 }, hist));
  const base = S.line({ x1: HB.x - 10, y1: HB.y, x2: 1760, y2: HB.y, stroke: 'faint', sw: 2 }, hist);
  const bx = k => HB.x + k * (HB.w + HB.gap) + HB.w / 2;
  const hIcons = [S.icon('fluent:cat-face', { x: bx(0), y: HB.y - 8.2 * HB.u - 26, size: 34 }, hist), S.icon('fluent:dog-face', { x: bx(1) + 12, y: HB.y - 7.1 * HB.u - 26, size: 34 }, hist)];
  S.set(hbars, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(hbars.slice(0, 9), { autoAlpha: 0, scaleY: 0, transformOrigin: '50% 100%' }, { autoAlpha: 1, scaleY: 1, duration: 0.45, stagger: 0.05, ease: 'power3.out' }), 'b4~shape');
  S.add(fx.in([base, ...hIcons], { from: 'fade', d: 0.4 }), 'b4~shape');
  S.add(gsap.fromTo(hbars.slice(9), { autoAlpha: 0, scaleY: 0, transformOrigin: '50% 100%' }, { autoAlpha: 1, scaleY: 1, duration: 0.25, stagger: 0.012, ease: 'power2.out' }), 'b4~trail-0.1');
  const illus = S.text('values illustrative, shape real', { x: 1240, y: 520, size: 30, anchor: 'middle', color: 'muted', weight: 550 });
  S.add(fx.in(illus, { from: 'up', d: 0.4 }), 'b4~real');
  const two = S.text('one or two stand out', { x: bx(1) + 50, y: HB.y - 7.1 * HB.u - 26, size: 28, color: 'struct', weight: 600 });
  S.add(fx.in(two, { from: 'left', d: 0.4 }), 'b4~stand');

  // ---------------------------------------------------------------- b5: something else picks
  S.add(fx.dim([hist, two], { to: 0.25 }), 'b5');
  S.add(fx.out(illus, { d: 0.3 }), 'b5');
  const picks = S.text('the model picks a word', { x: 960, y: 470, size: 52, anchor: 'middle', color: 'ink', weight: 650, family: 'display' });
  const scoresOut = S.text('≈ 128,000 scores out', { x: 960, y: 580, size: 44, anchor: 'middle', color: 'struct', weight: 650 });
  const elsePicks = S.text('something else picks', { x: 960, y: 660, size: 40, anchor: 'middle', color: 'ink', weight: 600 });
  S.add(fx.in(picks, { from: 'up', d: 0.45 }), 'b5~misconception');
  S.add(fx.strike(picks, { tone: 'bytes', d: 0.45 }), 'b5~produces');
  S.add(gsap.to(picks, { opacity: 0.5, duration: 0.4 }), 'b5~produces+0.3');
  S.add(fx.in(scoresOut, { from: 'up', d: 0.45 }), 'b5~numbers-0.2');
  S.add(fx.in(elsePicks, { from: 'up', d: 0.45 }), 'b5~something-0.1');
});
