/* ch05_s04 · the arithmetic adds up to a tenth of a millisecond (fig 36)
   The count: 70 billion weights × 2 operations (one multiply, one add) = 140,000,000,000 ≈ 10¹¹
   (really 1.4 × 10¹¹). The rate: ≈ 10¹⁵ a second = 10¹² every millisecond, so 10¹¹ takes 0.1 ms.
   A token takes 30 ms; its arithmetic comes in tiny bursts across all 30, and packed together fills
   0.1 ms (5 px at 50 px/ms). That leaves 29.9 ms, room for 29.9 ÷ 0.1 = 299 ≈ 300 more tokens' worth. */
V.scene('ch05_s04', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const fmt = v => Math.round(v).toLocaleString('en-US');

  // ---------------------------------------------------------------- b1: the chip and its rate; the token and its count
  const CHX = 300, CHY = 360;
  const chipG = S.g();
  const chip = libChip(S, { x: CHX, y: CHY, size: 150, state: 'busy' }, chipG);
  const rateL = S.g(null, chipG);
  const ra = S.text('≈ ', { x: 0, y: CHY + 136, size: 32, weight: 650, color: 'compute' }, rateL);
  const rp = ch05Pow(S, 15, { x: S.measure('≈ ', { size: 32, weight: 650 }), y: CHY + 136, size: 36, anchor: 'start', tone: 'compute', family: 'mono' }, rateL);
  S.text('operations / second', { x: rp.r + 10, y: CHY + 138, size: 28, weight: 650, color: 'compute' }, rateL);
  const rW = rp.r + 10 + S.measure('operations / second', { size: 28, weight: 650 });
  rateL.setAttribute('transform', `translate(${CHX - rW / 2},0)`);
  const spec = S.text('exact spec: next chapter', { x: CHX, y: CHY + 182, size: 24, anchor: 'middle', weight: 550, color: 'muted' }, chipG);
  S.set(chipG, { autoAlpha: 0 }, 0);
  S.add(fx.in(chipG, { from: 'left', d: 0.5, dist: 20 }), 0.2);
  const pour = S.flow({ d: `M${CHX - 200},${CHY} L${CHX + 200},${CHY}`, from: 0.4, to: 'end', speed: 260, every: 0.09, size: 6, color: 'compute' });
  // the token and the multiply-and-add picture in miniature
  const TX = 1590;
  const tok = ch05Token(S, { x: TX, y: 160, size: 30, hidden: true });
  S.add(tok.pop({ d: 0.45 }), 'b1~token-0.3');
  const mad = S.g();
  const RY = i => 236 + i * 40, IX = 1330, WXc = 1430, ADD = { x: 1620, y: 270, w: 214, h: 76 };
  const times = [], tiles = [];
  for (let i = 0; i < 5; i++) {
    S.rect({ x: IX - 25, y: RY(i) - 15, w: 50, h: 30, r: 6, fill: 'url(#card-struct)', stroke: 'struct', sw: 1.5 }, mad);
    times.push(S.text('×', { x: IX + 46, y: RY(i) + 1, size: 26, anchor: 'middle', weight: 700, color: 'compute' }, mad));
    tiles.push(S.rect({ x: WXc + 22, y: RY(i) - 15, w: 50, h: 30, r: 4, fill: 'struct', fillOpacity: 0.6, stroke: 'struct', sw: 1.5 }, mad));
    ignore(S.path({ d: `M${WXc + 80},${RY(i)} C${WXc + 130},${RY(i)} ${ADD.x - 50},${ADD.y + ADD.h / 2} ${ADD.x - 6},${ADD.y + ADD.h / 2}`, stroke: 'faint', sw: 2 }, mad));
  }
  const addBox = S.rect({ x: ADD.x, y: ADD.y, w: ADD.w, h: ADD.h, r: 14, fill: 'url(#card-compute)', stroke: 'compute', sw: 2 }, mad);
  S.text('add them up', { x: ADD.x + ADD.w / 2, y: ADD.y + ADD.h / 2 + 1, size: 26, anchor: 'middle', weight: 700, color: 'ink' }, mad);
  S.set(mad, { autoAlpha: 0 }, 0);
  S.add(fx.in(mad, { from: 'up', d: 0.5, dist: 14 }), 'b1~uses');
  S.add(gsap.fromTo(times, { attr: { fill: S.tone('compute') }, scale: 1, transformOrigin: '50% 50%' }, { scale: 1.6, duration: 0.18, yoyo: true, repeat: 1, stagger: 0.05, transformOrigin: '50% 50%', immediateRender: false }), 'b1~multiplied');
  S.add(gsap.fromTo(addBox, { filter: 'none' }, { filter: 'url(#glow-compute)', duration: 0.3, yoyo: true, repeat: 1, immediateRender: false }), 'b1~added');
  // the count builds, then collapses to ≈ 10¹¹
  const EQ = { x: 1560, y: 500 };
  const e1 = S.text([{ t: '70,000,000,000 weights', c: 'struct' }, { t: '  × 2', c: 'compute' }], { x: EQ.x, y: EQ.y, size: 30, anchor: 'middle', weight: 650, family: 'mono' });
  const e2 = S.text('= 140,000,000,000', { x: EQ.x, y: EQ.y + 48, size: 30, anchor: 'middle', weight: 650, family: 'mono', color: 'compute' });
  S.set([e1, e2], { autoAlpha: 0 }, 0);
  S.add(fx.in(e1, { from: 'up', d: 0.35, dist: 10 }), 'b1~Two');
  S.add(fx.in(e2, { from: 'up', d: 0.35, dist: 10 }), 'b1~hundred');
  const cntO = S.g(), cnt = S.g(null, cntO);          // cntO fades; cnt is placed
  const ca = S.text('≈ ', { x: 0, y: EQ.y + 22, size: 44, weight: 700, color: 'compute' }, cnt);
  const cp = ch05Pow(S, 11, { x: S.measure('≈ ', { size: 44, weight: 700 }), y: EQ.y + 22, size: 48, anchor: 'start', tone: 'compute', family: 'mono' }, cnt);
  S.text('operations', { x: cp.r + 12, y: EQ.y + 24, size: 32, weight: 650, color: 'compute' }, cnt);
  const cW = cp.r + 12 + S.measure('operations', { size: 32, weight: 650 });
  cnt.setAttribute('transform', `translate(${EQ.x - cW / 2},0)`);
  const really = S.text('really 1.4 × 10¹¹', { x: EQ.x, y: EQ.y + 78, size: 24, anchor: 'middle', weight: 550, color: 'muted' });
  S.set([cntO, really], { autoAlpha: 0 }, 0);
  const COL = T('b1~ten') - 0.1;
  S.add(gsap.to([e1, e2], { autoAlpha: 0, scale: 0.7, transformOrigin: '50% 50%', duration: 0.35, ease: 'power2.in' }), COL);
  S.call(() => [e1, e2].forEach(e => e.setAttribute('data-audit', 'ignore')), COL);
  S.add(fx.in(cntO, { from: 'fade', d: 0.35 }), COL + 0.3);
  S.add(fx.in(really, { from: 'up', d: 0.3, dist: 8 }), COL + 0.6);

  // ---------------------------------------------------------------- b2: divide: a trillion every millisecond; a tenth of that is 0.1 ms
  const SP = { x: 460, y: 680, w: 1000, h: 50 };
  const strip = S.g();
  S.rect({ x: SP.x, y: SP.y - SP.h / 2, w: SP.w, h: SP.h, r: 6, fill: '#0c1326', stroke: 'ink', strokeOpacity: 0.6, sw: 2 }, strip);
  for (let k = 1; k < 10; k++) S.line({ x1: SP.x + k * 100, y1: SP.y - SP.h / 2, x2: SP.x + k * 100, y2: SP.y + SP.h / 2, stroke: 'ink', strokeOpacity: 0.35, sw: 1.5 }, strip);
  S.text('1 millisecond', { x: SP.x + SP.w / 2, y: SP.y + 62, size: 28, anchor: 'middle', weight: 650, color: 'ink' }, strip);
  const above = S.g(null, strip);
  const ap = ch05Pow(S, 12, { x: 0, y: SP.y - 58, size: 36, anchor: 'start', tone: 'compute', family: 'mono' }, above);
  S.text('operations', { x: ap.r + 12, y: SP.y - 56, size: 28, weight: 650, color: 'compute' }, above);
  above.setAttribute('transform', `translate(${SP.x + SP.w / 2 - (ap.r + 12 + S.measure('operations', { size: 28, weight: 650 })) / 2},0)`);
  ignore(strip.children[0]);
  S.set(strip, { autoAlpha: 0 }, 0);
  S.add(fx.in(strip, { from: 'up', d: 0.5, dist: 16 }), 'b2~divide');
  const secTag = S.text('1 second = 1,000 ms', { x: SP.x - 20, y: SP.y + 1, size: 24, anchor: 'end', weight: 550, color: 'muted' });
  S.set(secTag, { autoAlpha: 0 }, 0);
  S.add(fx.in(secTag, { from: 'fade', d: 0.35 }), 'b2~thousand');
  // particles fill the whole strip: ten amber ticks
  const fills = Array.from({ length: 10 }, (_, k) => S.rect({ x: SP.x + k * 100 + 3, y: SP.y - SP.h / 2 + 4, w: 94, h: SP.h - 8, r: 4, fill: 'compute', fillOpacity: 0.7 }));
  S.set(fills, { autoAlpha: 0 }, 0);
  S.add(gsap.to(fills, { autoAlpha: 1, duration: 0.2, stagger: 0.06 }), 'b2~trillion');
  const TEN = T('b2~tenth') - 0.05;
  S.add(fx.out(secTag, { d: 0.3 }), TEN);
  S.add(gsap.to(fills.slice(1), { autoAlpha: 0, duration: 0.25, stagger: { each: 0.05, from: 'end' } }), TEN);
  const one = S.text('10¹¹ → 0.1 ms', { x: SP.x + 50, y: SP.y + 108, size: 28, anchor: 'middle', weight: 700, color: 'compute' });
  S.set(one, { autoAlpha: 0 }, 0);
  S.add(fx.in(one, { from: 'up', d: 0.35, dist: 10 }), TEN + 0.6);

  // ---------------------------------------------------------------- b3: thirty milliseconds; the arithmetic in bursts; packed together, 0.1 ms
  const B3 = T('b3') - 0.1;
  S.add(gsap.to([strip, fills[0], one], { autoAlpha: 0, scale: 0.6, transformOrigin: '960px 680px', duration: 0.45, ease: 'power2.in' }), B3);
  S.add(fx.out([spec, really], { d: 0.3, stagger: 0 }), B3);
  const TL = { x0: 210, y: 880, h: 48, px: CH05.PX_PER_MS };
  const axis = S.g();
  const axL = S.line({ x1: TL.x0, y1: TL.y + TL.h / 2 + 4, x2: TL.x0 + 30 * TL.px, y2: TL.y + TL.h / 2 + 4, stroke: 'muted', sw: 2 }, axis);
  S.text('0', { x: TL.x0, y: TL.y + 58, size: 24, anchor: 'middle', weight: 550, color: 'muted' }, axis);
  const endL = S.text('30 ms', { x: TL.x0 + 30 * TL.px, y: TL.y - 46, size: 28, anchor: 'end', weight: 650, color: 'ink' }, axis);
  const swc = ch05Stopwatch(S, { x: TL.x0 - 70, y: TL.y, size: 72, readout: 'none' }, axis);
  S.set(axis, { autoAlpha: 0 }, 0);
  const THIRTY = T('b3~thirty') - 0.1;
  S.add(gsap.set(axis, { autoAlpha: 1 }), THIRTY);
  S.add(fx.draw(axL, { d: 0.8 }), THIRTY);
  S.add(fx.swap(endL, 'budget: 30 ms'), 'b3~budget-0.1');
  const NB = 20;
  const bursts = Array.from({ length: NB }, (_, k) => S.rect({ x: TL.x0 + (k + 0.5) * 30 * TL.px / NB - 1, y: TL.y - TL.h / 2, w: 2, h: TL.h, fill: 'compute' }));
  S.set(bursts, { autoAlpha: 0 }, 0);
  S.add(gsap.to(bursts, { autoAlpha: 1, duration: 0.15, stagger: 0.04 }), 'b3~tiny');
  const bl = S.text('arithmetic comes in bursts', { x: 960, y: TL.y - 46, size: 26, anchor: 'middle', weight: 600, color: 'muted' });
  S.set(bl, { autoAlpha: 0 }, 0);
  S.add(fx.in(bl, { from: 'fade', d: 0.35 }), T('b3~tiny') + 0.3);
  const SQ = T('b3~Squeezed') - 0.1;
  S.add(fx.out(bl, { d: 0.3 }), SQ);
  bursts.forEach((b, k) => S.add(gsap.to(b, { attr: { x: TL.x0 + k * (CH05.SLIVER_PX / NB), width: CH05.SLIVER_PX / NB + 0.2 }, duration: 0.8, ease: 'power3.inOut' }), SQ));
  const sliver = ch05Sliver(S, { x: TL.x0, y: TL.y, h: TL.h, tagSide: 'above', tagGap: 40 });
  S.set(sliver, { autoAlpha: 0 }, 0);
  S.add(gsap.set(sliver, { autoAlpha: 1 }), SQ + 0.8);
  S.add(gsap.set(bursts, { autoAlpha: 0 }), SQ + 0.8);
  S.set(sliver.tagG, { autoAlpha: 0 }, 0);
  S.add(fx.in(sliver.tagG, { from: 'fade', d: 0.35 }), SQ + 0.9);
  const ms01 = S.text('0.1 ms', { x: TL.x0 + 2.5, y: TL.y + 58, size: 26, anchor: 'start', weight: 700, color: 'compute' });
  S.set(ms01, { autoAlpha: 0 }, 0);
  S.add(fx.in(ms01, { from: 'up', d: 0.3, dist: 8 }), 'b3~zero');
  S.add(gsap.to(axis.children[1], { autoAlpha: 0, duration: 0.2 }), T('b3~zero') - 0.1);   // the '0' makes room

  // ---------------------------------------------------------------- b4: 29.9 ms left; why is that time not free?
  const rest = S.g();
  const restR = S.rect({ x: TL.x0 + CH05.SLIVER_PX + 2, y: TL.y - TL.h / 2, w: 30 * TL.px - CH05.SLIVER_PX - 2, h: TL.h, r: 4, fill: 'faint', fillOpacity: 0.08, stroke: 'faint', sw: 2, dash: '8 6' }, rest);
  const restL = S.text('29.9 ms', { x: 960, y: TL.y + 1, size: 28, anchor: 'middle', weight: 700, color: 'ink' }, rest);
  S.set(rest, { autoAlpha: 0 }, 0);
  S.add(fx.in(rest, { from: 'fade', d: 0.4 }), 'b4~leaves');
  const more = S.text('', { x: TL.x0 + 30 * TL.px - 16, y: TL.y + 1, size: 26, anchor: 'end', weight: 650, color: 'muted' });
  const mc = { v: 0 };
  S.add(gsap.fromTo(mc, { v: 0 }, { v: 299, duration: 1.0, ease: 'power2.out', immediateRender: false, onUpdate: () => { more.textContent = mc.v >= 298.5 ? "≈ 300 more tokens' worth" : `${fmt(mc.v)}`; } }), 'b4~three');
  // the two numbers meet in the middle: 10¹¹ ÷ 10¹⁵ = 0.1 ms
  const Q = T('b4~one') - 0.1;
  const divO = S.g(), div = S.g(null, divO);          // divO animates; div is placed
  const dy = 470;
  const d1 = ch05Pow(S, 11, { x: 0, y: dy, size: 60, anchor: 'start', tone: 'compute', family: 'mono' }, div);
  const dd = S.text('÷', { x: d1.r + 24, y: dy, size: 56, weight: 700, color: 'muted' }, div);
  const d2 = ch05Pow(S, 15, { x: d1.r + 24 + S.measure('÷', { size: 56, weight: 700 }) + 24, y: dy, size: 60, anchor: 'start', tone: 'compute', family: 'mono' }, div);
  const de = S.text('= 0.1 ms', { x: d2.r + 24, y: dy, size: 56, weight: 700, family: 'mono', color: 'ink' }, div);
  const dW = d2.r + 24 + S.measure('= 0.1 ms', { size: 56, weight: 700, family: 'mono' });
  div.setAttribute('transform', `translate(${960 - dW / 2},0)`);
  const sub = S.text('two numbers, one division', { x: 960, y: dy + 64, size: 30, anchor: 'middle', weight: 600, color: 'muted' });
  S.set([divO, sub], { autoAlpha: 0 }, 0);
  S.add(gsap.to([rateL, cntO], { autoAlpha: 0, duration: 0.4 }), Q);
  S.add(fx.in(divO, { from: 'scale', scale: 0.85, d: 0.5, origin: '960px 470px' }), Q + 0.2);
  S.add(fx.in(sub, { from: 'up', d: 0.35, dist: 10 }), Q + 0.6);
  S.add(gsap.to([chipG, tok, mad, pour], { autoAlpha: 0, duration: 0.5 }), Q + 0.4);
  const NF = T('b4~free') - 0.15;
  S.add(gsap.to(more, { autoAlpha: 0, duration: 0.3 }), NF - 0.3);
  S.add(gsap.fromTo(restR, { attr: { 'fill-opacity': 0.08 } }, { attr: { 'fill-opacity': 0.3 }, duration: 0.3, yoyo: true, repeat: 1, immediateRender: false }), NF);
  S.add(fx.swap(restL, '29.9 ms: why not free?'), NF + 0.1);
});
