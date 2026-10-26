/* ch01_s04 · text becomes tokens (fig 6)
   A sentence is cut into token pills; rarer words split; words versus tokens to scale; the model
   sees only pieces, makes them one at a time, and everything is counted in tokens. */
V.scene('ch01_s04', S => {
  const { fx } = S;
  const TY = 260, SIZE = 40, PADX = 22, GAP = 16;

  // ---------------------------------------------------------------- b1: the chat bubble and the echo of the cold open
  const bubble = S.icon('ph:chat-circle-text-duotone', { x: 160, y: TY, size: 96, color: 'struct' });
  S.add(fx.pop(bubble, { from: 0.6, d: 0.6 }), 0.15);
  const echo = S.g();
  echo.setAttribute('data-audit', 'ignore');
  const echoPills = [0, 1, 2, 3, 4, 5].map(i => S.pill(['Why', 'is', 'the', 'sky', 'blue', '?'][i], { x: 420 + i * 110, y: 150, h: 40, size: 22, tone: 'struct', case: 'keep' }, echo));
  S.set(echoPills, { autoAlpha: 0 }, 0);
  echoPills.forEach((p, i) => {
    const at = S.t('b1~Remember') + i * 0.12;
    S.add(gsap.fromTo(p, { autoAlpha: 0, x: -80 }, { autoAlpha: 0.7, x: 0, duration: 0.4, ease: 'power2.out' }), at);
    S.add(gsap.to(p, { autoAlpha: 0, x: 120, duration: 0.6, ease: 'power1.in' }), at + 1.1);
  });

  // the sentence bar, then five pills
  const WORDS = ['the', 'quick', 'brown', 'fox', 'jumps'];
  const ww = WORDS.map(w => S.measure(w, { size: SIZE, weight: 600, case: 'keep' }));
  const sp = S.measure(' ', { size: SIZE, weight: 600 }) + 6;
  const barW = ww.reduce((a, b) => a + b, 0) + sp * (WORDS.length - 1) + 2 * PADX;
  const BX = 300;
  const bar = S.rect({ x: BX, y: TY - 36, w: barW, h: 72, r: 18, fill: 'url(#card-struct)', stroke: 'struct', sw: 2, strokeOpacity: 0.8 });
  // word positions inside the bar, and in the pill row
  let x = BX + PADX;
  const inBar = ww.map(w => { const c = x + w / 2; x += w + sp; return c; });
  let px = BX;
  const inRow = ww.map(w => { const c = px + (w + 2 * PADX) / 2; px += w + 2 * PADX + GAP; return c; });
  const rowEnd = px - GAP;
  const pills = WORDS.map((w, i) => {
    const g = S.g();
    g.box = S.rect({ x: inRow[i] - (ww[i] + 2 * PADX) / 2, y: TY - 34, w: ww[i] + 2 * PADX, h: 68, r: 16, fill: 'url(#card-struct)', stroke: 'struct', sw: 2, strokeOpacity: 0.85 }, g);
    g.base = S.rect({ x: inRow[i] - (ww[i] + 2 * PADX) / 2, y: TY - 34, w: ww[i] + 2 * PADX, h: 68, r: 16, fill: '#0c1326' }, g);
    g.insertBefore(g.base, g.box);
    g.word = S.text(w, { x: inRow[i], y: TY + 1, size: SIZE, anchor: 'middle', weight: 600, color: 'ink', case: 'keep' }, g);
    g.dx = inBar[i] - inRow[i];
    return g;
  });
  // before the cut, each word sits at its place in the bar, with no pill of its own
  pills.forEach(p => { S.set(p, { x: p.dx, autoAlpha: 0 }, 0); S.set([p.box, p.base], { autoAlpha: 0 }, 0); });
  S.set(bar, { autoAlpha: 0 }, 0);
  // 'Text': the words fly from the bubble into the bar
  S.add(gsap.fromTo(bar, { autoAlpha: 0, scaleX: 0.2, transformOrigin: '0% 50%' }, { autoAlpha: 1, scaleX: 1, duration: 0.4, ease: 'power3.out' }), 'b1~Text-0.3');
  pills.forEach((p, i) => S.add(gsap.fromTo(p, { autoAlpha: 0, x: p.dx - 24, y: 0 }, { autoAlpha: 1, x: p.dx, duration: 0.3, ease: 'power2.out' }), S.t('b1~Text') - 0.15 + i * 0.05));
  // 'cut': scissor marks between the words, then the bar breaks into pills
  const cuts = inBar.slice(0, -1).map((c, i) => {
    const xc = (c + ww[i] / 2 + inBar[i + 1] - ww[i + 1] / 2) / 2;
    return S.line({ x1: xc, y1: TY - 48, x2: xc, y2: TY + 48, stroke: 'ink', sw: 2.5, dash: '6 5' });
  });
  const scissors = S.icon('ph:scissors-duotone', { x: BX - 40, y: TY - 70, size: 44, color: 'muted' });
  S.add(fx.in(scissors, { from: 'left', d: 0.3 }), 'b1~cut-0.2');
  S.add(gsap.to(scissors, { x: barW + 20, duration: 0.7, ease: 'power1.inOut' }), 'b1~cut+0.1');
  S.add(fx.out(scissors, { d: 0.25 }), 'b1~cut+0.75');
  S.set(cuts, { autoAlpha: 0 }, 0);
  cuts.forEach((c, i) => { S.add(gsap.set(c, { autoAlpha: 1 }), S.t('b1~cut') + 0.2 + i * 0.13); S.add(fx.draw(c, { d: 0.18 }), S.t('b1~cut') + 0.2 + i * 0.13); });
  const split = S.t('b1~cut') + 0.95;
  S.add(gsap.to(bar, { autoAlpha: 0, duration: 0.2 }), split - 0.1);
  S.add(gsap.to(cuts, { autoAlpha: 0, duration: 0.2 }), split - 0.25);
  pills.forEach(p => {
    S.add(gsap.to([p.box, p.base], { autoAlpha: 1, duration: 0.3 }), split);
    S.add(gsap.to(p, { x: 0, duration: 0.6, ease: 'power3.out' }), split);
  });
  // 'make': the pills pulse in turn, a counter runs 1 to 5
  const counter = S.counter({ x: rowEnd + 70, y: TY + 2, size: 52, value: 1, anchor: 'middle', color: 'struct', family: 'mono', weight: 650 });
  const five = S.text('five tokens', { x: (BX + rowEnd) / 2, y: TY + 84, size: 30, anchor: 'middle', color: 'muted', weight: 550 });
  S.set(counter, { autoAlpha: 0 }, 0);
  S.add(gsap.to(counter, { autoAlpha: 1, duration: 0.2 }), 'b1~make');
  pills.forEach((p, i) => S.add(fx.pulse(p, { scale: 1.1, d: 0.3 }), S.t('b1~make') + i * 0.12));
  S.add(fx.count(counter, 1, 5, { d: 0.55, fmt: v => String(Math.round(v)) }), 'b1~make');
  S.add(fx.in(five, { from: 'up', d: 0.4 }), 'b1~five#2');

  // ---------------------------------------------------------------- b2: rarer words split; words versus tokens
  S.add(fx.out([five, counter], { d: 0.3 }), 'b2~Rarer-0.2');
  const EX = { cx: 1500, y: 470 };
  const exWord = S.g();
  const parts = ['un', 'believ', 'ably'], pw = parts.map(p => S.measure(p, { size: 34, weight: 600, case: 'keep' }));
  const exBarW = pw.reduce((a, b) => a + b, 0) + 2 * PADX;
  S.rect({ x: EX.cx - exBarW / 2, y: EX.y - 32, w: exBarW, h: 64, r: 16, fill: 'url(#card-struct)', stroke: 'struct', sw: 2, strokeOpacity: 0.8 }, exWord);
  S.text('unbelievably', { x: EX.cx, y: EX.y + 1, size: 34, anchor: 'middle', weight: 600, case: 'keep' }, exWord);
  S.add(fx.in(exWord, { from: 'up', d: 0.4 }), 'b2~Rarer');
  const exPills = [];
  let ex = EX.cx - (pw.reduce((a, b) => a + b, 0) + parts.length * 2 * 18 + 2 * 14) / 2;
  parts.forEach((p, i) => {
    const w = pw[i] + 36;
    exPills.push(S.pill(p, { x: ex + w / 2, y: EX.y, h: 60, w, size: 34, tone: 'struct', case: 'keep' }));
    ex += w + 14;
  });
  S.set(exPills, { autoAlpha: 0 }, 0);
  S.add(gsap.to(exWord, { autoAlpha: 0, duration: 0.2 }), 'b2~split-0.1');
  S.add(gsap.fromTo(exPills, { autoAlpha: 0, scale: 0.85, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: 'back.out(2)' }), 'b2~split+0.12');
  const illus = S.text('illustrative split', { x: EX.cx, y: EX.y + 66, size: 24, anchor: 'middle', color: 'muted', weight: 550 });
  S.add(fx.in(illus, { from: 'up', d: 0.35 }), 'b2~three');

  // the two bars, one scale: 500 words = 600 px
  const BL = 300, U = 600 / 500;
  const bars = S.g();
  const wordsBar = S.bar({ x: BL, y: 690, w: 500 * U, h: 46, frac: 1, tone: 'struct' }, bars);
  const wordsLbl = S.text('500 words', { x: BL + 500 * U + 24, y: 690 + 23, size: 30, color: 'ink', weight: 600 }, bars);
  const tokBar = S.bar({ x: BL, y: 770, w: 600 * U, h: 46, frac: 1, tone: 'struct' }, bars);
  const range = S.rect({ x: BL + 600 * U, y: 770, w: 200 * U, h: 46, r: 6, fill: 'struct', fillOpacity: 0.3, stroke: 'struct', strokeOpacity: 0.7, sw: 1.5, dash: '6 5' }, bars);
  const tokLbl1 = S.text('about 600–800 tokens', { x: BL + 800 * U + 24, y: 770 + 10, size: 30, color: 'ink', weight: 600 }, bars);
  const tokLbl2 = S.text('1.2–1.6 per word', { x: BL + 800 * U + 24, y: 770 + 44, size: 24, color: 'muted', weight: 550 }, bars);
  S.add(fx.in(bars, { from: 'fade', d: 0.3 }), 'b2~Five-0.15');
  S.add(fx.grow(wordsBar, { d: 0.6 }), 'b2~Five');
  S.add(fx.in(wordsLbl, { from: 'left', d: 0.4 }), 'b2~words#2');
  S.add(fx.grow(tokBar, { d: 0.6 }), 'b2~make');
  S.add(gsap.fromTo(range, { autoAlpha: 0, scaleX: 0, transformOrigin: '0% 50%' }, { autoAlpha: 1, scaleX: 1, duration: 0.5, ease: 'power2.out' }), 'b2~six');
  S.add(fx.in([tokLbl1, tokLbl2], { from: 'left', d: 0.4, stagger: 0.1 }), 'b2~eight');

  // ---------------------------------------------------------------- b3: the model sees only pieces, one at a time
  S.add(fx.dim([...exPills, illus, bars], { to: 0.3 }), 'b3');
  const words = pills.map(p => p.word);
  S.add(gsap.to(words, { autoAlpha: 0, duration: 0.5, stagger: 0.05 }), 'b3~letters-0.1');
  const seen = S.text('what the model sees', { x: (BX + rowEnd) / 2, y: TY + 84, size: 28, anchor: 'middle', color: 'muted', weight: 550 });
  S.add(fx.in(seen, { from: 'up', d: 0.4 }), 'b3~only');
  const sixth = S.g();
  const sx = rowEnd + GAP + 60;
  S.rect({ x: sx - 60, y: TY - 34, w: 120, h: 68, r: 16, fill: '#0c1326' }, sixth);
  S.rect({ x: sx - 60, y: TY - 34, w: 120, h: 68, r: 16, fill: 'url(#card-struct)', stroke: 'ink', sw: 2.5 }, sixth);
  S.add(fx.pop(sixth), 'b3~one-0.05');
  S.add(gsap.fromTo(sixth, { filter: 'none' }, { filter: 'url(#glow-struct)', duration: 0.3, yoyo: true, repeat: 1 }), 'b3~time');

  // ---------------------------------------------------------------- b4: tokens are the unit
  S.add(fx.out([...exPills, illus, bars, sixth, seen], { d: 0.4 }), 'b4-0.2');
  S.add(gsap.to(words, { autoAlpha: 1, duration: 0.4 }), 'b4');
  const cards = [['tokens per second', 'b4~second'], ['cost per token', 'b4~Cost'], ['milliseconds per token', 'b4~Milliseconds']].map(([t, at], i) => {
    const y = 470 + i * 120;
    const g = S.g();
    S.rect({ x: 1110, y: y - 46, w: 640, h: 92, r: 18, fill: '#0c1326' }, g);
    S.rect({ x: 1110, y: y - 46, w: 640, h: 92, r: 18, fill: 'url(#card-struct)', stroke: 'struct', sw: 2, strokeOpacity: 0.7 }, g);
    S.rect({ x: 1140, y: y - 18, w: 54, h: 36, r: 10, fill: 'struct', fillOpacity: 0.35, stroke: 'struct', sw: 2 }, g);
    S.text(t, { x: 1220, y: y + 1, size: 34, color: 'ink', weight: 600 }, g);
    S.add(fx.in(g, { from: 'right', d: 0.5 }), `${at}-0.25`);
    return g;
  });
  const unit = S.text('the unit everything is counted in', { x: 680, y: 590, size: 34, anchor: 'middle', color: 'struct', weight: 650 });
  S.add(fx.in(unit, { from: 'up', d: 0.5 }), 'b4~unit');
});
