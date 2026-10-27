/* ch02_s03 · paid once, spread thin (fig 13)
   The load is a one-off cost: shared over a day's 2.88 million tokens it is ~7 millionths of a second
   each (amortising). Then a hint: a cost that every token seems to pay again. */
V.scene('ch02_s03', S => {
  const { fx } = S;
  const TL = { x0: 200, x1: 1720, y: 520, h: 34 };

  // ---------------------------------------------------------------- b1: the model's working life
  const loadG = S.g();
  const load = S.rect({ x: TL.x0, y: TL.y - TL.h / 2, w: 180, h: TL.h, r: 6, fill: 'url(#bar-bytes)' }, loadG);
  const loadLbl = S.text('load: many seconds', { x: TL.x0, y: TL.y + 54, size: 26, color: 'bytes', weight: 600 }, loadG);
  S.add(gsap.fromTo(load, { attr: { width: 0 } }, { attr: { width: 180 }, duration: 0.5, ease: 'power2.out' }), 'b1~a load');
  S.add(fx.in(loadLbl, { from: 'up', d: 0.35 }), 'b1~load+0.1');
  const arr = S.arrow({ x1: TL.x0 + 190, y1: TL.y, x2: TL.x0 + 232, y2: TL.y, color: 'muted', sw: 3, head: 10 });
  S.set(arr, { autoAlpha: 0 }, 0);
  S.add(gsap.set(arr, { autoAlpha: 1 }), 'b1~a token');
  S.add(fx.drawArrow(arr, { d: 0.3 }), 'b1~a token');
  const BX = TL.x0 + 240;
  const band = S.rect({ x: BX, y: TL.y - TL.h / 2, w: TL.x1 - BX, h: TL.h, r: 6, fill: 'struct', fillOpacity: 0.06, stroke: 'struct', sw: 2 });
  const serveLbl = S.text('serve: a token every 30 ms', { x: (BX + TL.x1) / 2, y: TL.y + 54, size: 26, anchor: 'middle', color: 'struct', weight: 600 });
  S.add(gsap.fromTo(band, { attr: { width: 0 } }, { attr: { width: TL.x1 - BX }, duration: 1.6, ease: 'power1.inOut' }), 'b1~a token+0.2');
  S.add(fx.in(serveLbl, { from: 'up', d: 0.4 }), 'b1~every');
  const ticks = S.g();
  ticks.setAttribute('data-audit', 'ignore');
  const tickEls = [];
  for (let x = BX + 8; x < TL.x1 - 4; x += 12) tickEls.push(S.line({ x1: x, y1: TL.y - 9, x2: x, y2: TL.y + 9, stroke: 'struct', sw: 2 }, ticks));
  S.set(tickEls, { autoAlpha: 0 }, 0);
  S.add(gsap.to(tickEls, { autoAlpha: 1, duration: 0.05, stagger: 1.6 / tickEls.length, ease: 'none' }), 'b1~a token+0.25');
  const hours = S.text('hours →', { x: TL.x1, y: TL.y - 46, size: 26, anchor: 'end', color: 'muted', weight: 550 });
  S.add(fx.in(hours, { from: 'left', d: 0.35 }), 'b1~hours');

  // ---------------------------------------------------------------- b2: paid once, shared among millions
  const once = S.pill('× 1', { x: TL.x0 + 90, y: TL.y - 52, h: 40, size: 24, tone: 'neutral', style: 'outline' });
  S.add(fx.pop(once), 'b2~paid');
  // a full day: the load shrinks to its true width (0.35 px), the ticks merge
  const DAY = S.t("b2~day's");
  S.add(fx.swap(hours, '24 hours'), DAY);
  S.add(fx.out([once, loadLbl, arr, serveLbl], { d: 0.3 }), DAY);
  S.add(gsap.to(load, { attr: { width: 0.35 }, duration: 0.9, ease: 'power3.inOut' }), DAY);
  S.add(gsap.to(band, { attr: { x: TL.x0 + 2, width: TL.x1 - TL.x0 - 2 }, duration: 0.9, ease: 'power3.inOut' }), DAY);
  S.add(gsap.to(band, { attr: { 'fill-opacity': 0.75 }, duration: 0.6 }), DAY + 0.3);
  S.add(gsap.to(ticks, { autoAlpha: 0, duration: 0.5 }), DAY + 0.2);
  const ptr = S.g();
  S.line({ x1: TL.x0, y1: TL.y + 22, x2: TL.x0, y2: TL.y + 46, stroke: 'muted', sw: 2 }, ptr);
  S.text('load', { x: TL.x0, y: TL.y + 66, size: 24, anchor: 'middle', color: 'muted', weight: 550 }, ptr);
  S.add(fx.in(ptr, { from: 'up', d: 0.35 }), DAY + 0.8);
  const counter = S.counter({ x: 960, y: 300, size: 60, value: 0, anchor: 'middle', color: 'struct', family: 'mono', weight: 650 });
  const cLbl = S.text('tokens', { x: 960, y: 250, size: 26, anchor: 'middle', color: 'muted', weight: 550 });
  const cWork = S.text('one conversation, all day: 86,400 s ÷ 0.03 s', { x: 960, y: 360, size: 26, anchor: 'middle', color: 'muted', weight: 550 });
  S.add(fx.in([cLbl, counter], { from: 'fade', d: 0.4 }), DAY);
  S.add(fx.count(counter, 0, 2880000, { d: 1.6, ease: 'power2.out' }), DAY + 0.1);
  S.add(fx.in(cWork, { from: 'up', d: 0.4 }), DAY + 0.6);
  // the load's share of one token, to scale
  const low = S.g();
  const work = S.text('load share = 20 s ÷ 2,880,000 ≈ 7 millionths of a second', { x: 960, y: 690, size: 30, anchor: 'middle', color: 'ink', weight: 600 }, low);
  const tokBar = S.rect({ x: 460, y: 752, w: 1000, h: 36, r: 6, fill: 'url(#bar-struct)' }, low);
  const tokLbl = S.text('30 ms: the token itself', { x: 1480, y: 771, size: 26, color: 'struct', weight: 600 }, low);
  const share = S.circle({ x: 460, y: 836, r: 4, fill: 'bytes' }, low);
  const shareLbl = S.text('load share: a quarter of a pixel  ·  ≈ 0.02%', { x: 486, y: 838, size: 26, color: 'muted', weight: 550 }, low);
  S.add(fx.in(work, { from: 'up', d: 0.45 }), 'b2~seven');
  S.add(gsap.fromTo(tokBar, { attr: { width: 0 } }, { attr: { width: 1000 }, duration: 0.6, ease: 'power2.out' }), 'b2~millionths');
  S.add(fx.in(tokLbl, { from: 'left', d: 0.35 }), 'b2~millionths+0.4');
  S.add(fx.pop(share), 'b2~second');
  S.add(fx.in(shareLbl, { from: 'left', d: 0.35 }), 'b2~second+0.1');

  // ---------------------------------------------------------------- b3: amortising; then a cost that will not spread
  S.add(fx.dim([counter, cLbl, cWork, low], { to: 0.3 }), 'b3');
  const fixed = S.text('fixed cost ÷ lots of work → tiny', { x: 960, y: 408, size: 32, anchor: 'middle', color: 'helps', weight: 650 });
  const amort = S.text('amortising', { x: 960, y: 456, size: 36, anchor: 'middle', color: 'helps', weight: 700, family: 'display' });
  // a tag of its own, clear of the word, so the two do not read as one phrase
  const AMW = S.measure('amortising', { size: 36, weight: 700, family: 'display' });
  const many = S.pill('first of many', { x: 960 + AMW / 2 + 20, y: 456, anchor: 'start', h: 38, size: 22, padX: 14, tone: 'neutral', color: 'muted' });
  S.add(fx.in(fixed, { from: 'up', d: 0.4 }), 'b3~fixed-0.1');
  S.add(fx.in(amort, { from: 'up', d: 0.4 }), 'b3~amortising-0.1');
  S.add(fx.in(many, { from: 'left', d: 0.35 }), 'b3~comes');
  // the camera pushes in on the timeline's right end; three tokens each carry their own 140 GB
  S.add(fx.out([fixed, amort, many, hours, ptr], { d: 0.3 }), 'b3~Next-0.35');
  S.add(fx.out([counter, cLbl, cWork, low], { d: 0.4 }), 'b3~Next');
  // centred on the three tokens and their question (x 1,150-1,730, y 264-544)
  S.add(fx.cam({ x: 1440, y: 410, scale: 1.45, d: 1.2 }), 'b3~Next');
  const PX = [1240, 1440, 1640];
  const toks = PX.map((x, i) => {
    const g = S.g();
    const pill = S.rect({ x: x - 34, y: TL.y - 24, w: 68, h: 48, r: 14, fill: '#0c1326', stroke: 'struct', sw: 2.5 }, g);
    S.rect({ x: x - 34, y: TL.y - 24, w: 68, h: 48, r: 14, fill: 'url(#card-struct)' }, g);
    const blk = S.rect({ x: x - 90, y: TL.y - 110, w: 180, h: 60, r: 8, fill: 'url(#bar-bytes)' }, g);
    S.text('140 GB', { x, y: TL.y - 79, size: 28, anchor: 'middle', family: 'mono', weight: 650, color: '#0a0f1e' }, g);
    S.add(gsap.fromTo(g, { autoAlpha: 0, scale: 0.3, transformOrigin: `50% 100%` }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(1.8)' }), S.t('b3~one token') + i * 0.35);
    return g;
  });
  const q = S.text('?', { x: 1440, y: 300, size: 72, anchor: 'middle', color: 'ink', weight: 700, family: 'display' });
  const qLbl = S.text('paid again, every token?', { x: 1440, y: 352, size: 30, anchor: 'middle', color: 'ink', weight: 600 });
  S.add(fx.pop(q), 'b3~refuses');
  S.add(fx.in(qLbl, { from: 'up', d: 0.4 }), 'b3~refuses+0.15');
});
