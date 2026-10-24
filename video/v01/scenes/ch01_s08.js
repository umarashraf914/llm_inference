/* ch01_s08 · the draw: sampling (fig 10)
   The model gives the same shares every time; a token is drawn at random in proportion to them,
   like a spinner. Same model, same shares, different draw. */
V.scene('ch01_s08', S => {
  const { fx } = S;

  // ---------------------------------------------------------------- the text so far, as in s06
  const WORDS = ['curled', 'up', 'asleep', 'on', 'the', 'sofa', 'was', 'a'];
  const TY = 190;
  const row = S.g();
  let x = 470;
  WORDS.forEach(w => { const p = S.pill(w, { x, y: TY, h: 56, size: 30, tone: 'struct', anchor: 'start' }, row); x += p.w + 12; });
  const slot = S.g(null, row);
  const SL = { x, w: 110 };
  S.rect({ x, y: TY - 28, w: 110, h: 56, r: 16, fill: 'none', stroke: 'ink', sw: 2.5, dash: '8 7' }, slot);
  const qm = S.text('?', { x: x + 55, y: TY + 1, size: 34, anchor: 'middle', weight: 700, color: 'ink' }, slot);
  S.add(gsap.fromTo(qm, { opacity: 1 }, { opacity: 0.35, duration: 0.5, yoyo: true, repeat: 15, ease: 'sine.inOut' }), 0.4);

  // ---------------------------------------------------------------- b1: the same shares, every time
  const bars = S.g();
  const BR = [{ icon: 'fluent:cat-face', share: 0.745, txt: '74.5%', y: 470 }, { icon: 'fluent:dog-face', share: 0.248, txt: '24.8%', y: 560 }];
  const barEls = BR.map(b => {
    const g = S.g(null, bars);
    S.icon(b.icon, { x: 196, y: b.y, size: 48 }, g);
    g.bar = S.rect({ x: 240, y: b.y - 22, w: b.share * 480, h: 44, r: 6, fill: 'url(#bar-struct)' }, g);
    S.text(b.txt, { x: 240 + b.share * 480 + 16, y: b.y + 1, size: 32, family: 'mono', weight: 650, color: 'struct' }, g);
    return g;
  });
  const sameLbl = S.text('same shares, every time', { x: 420, y: 396, size: 30, anchor: 'middle', color: 'ink', weight: 600 });
  S.add(fx.in(sameLbl, { from: 'up', d: 0.4 }), 'b1~same-0.1');
  S.add(fx.pulse(bars, { scale: 1.04, d: 0.45 }), 'b1~same+0.2');
  S.add(fx.pulse(bars, { scale: 1.04, d: 0.45 }), 'b1~every');

  // ---------------------------------------------------------------- b2: a spinner with slices to scale
  const W = { x: 1260, y: 580, r: 250 };
  const SLICES = [
    { deg: 268.2, op: 0.95, icon: 'fluent:cat-face' },
    { deg: 89.3, op: 0.55, icon: 'fluent:dog-face' },
    { deg: 2.44, op: 0.35 },
    { deg: 0.11, op: 0.25 },
  ];
  const wheelG = S.g();
  const wheel = S.g(null, wheelG);
  S.circle({ x: W.x, y: W.y, r: W.r + 8, fill: '#0c1326', stroke: 'struct', sw: 2, strokeOpacity: 0.5 }, wheel);
  let a0 = 0;
  const pt = (deg, r) => { const a = (deg - 90) * Math.PI / 180; return [W.x + r * Math.cos(a), W.y + r * Math.sin(a)]; };
  SLICES.forEach(sl => {
    const a1 = a0 + sl.deg, [x0, y0] = pt(a0, W.r), [x1, y1] = pt(a1, W.r);
    S.path({ d: `M${W.x},${W.y} L${x0},${y0} A${W.r},${W.r} 0 ${sl.deg > 180 ? 1 : 0},1 ${x1},${y1} Z`, fill: 'struct', fillOpacity: sl.op, stroke: '#0c1326', sw: 2 }, wheel);
    if (sl.icon) { const [ix, iy] = pt(a0 + sl.deg / 2, W.r * 0.6); S.icon(sl.icon, { x: ix, y: iy, size: 64 }, wheel); }
    a0 = a1;
  });
  S.circle({ x: W.x, y: W.y, r: 22, fill: '#0c1326', stroke: 'ink', sw: 3 }, wheel);
  wheelG.setAttribute('data-audit', 'ignore');
  const pointer = S.path({ d: `M${W.x - 22},${W.y - W.r - 44} L${W.x + 22},${W.y - W.r - 44} L${W.x},${W.y - W.r + 6} Z`, fill: 'ink', stroke: '#0c1326', sw: 2 });
  S.set([wheelG, pointer], { autoAlpha: 0 }, 0);
  S.add(fx.out(sameLbl, { d: 0.3 }), 'b2~proportion-0.2');
  // the bars bend round into the wheel
  barEls.forEach((g, i) => S.add(gsap.to(g, { x: W.x - 420, y: W.y - BR[i].y, scale: 0.3, autoAlpha: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'power2.in' }), S.t('b2~proportion') + i * 0.08));
  S.add(gsap.fromTo(wheelG, { autoAlpha: 0, scale: 0.4, rotation: -120, svgOrigin: `${W.x} ${W.y}` }, { autoAlpha: 1, scale: 1, rotation: 0, svgOrigin: `${W.x} ${W.y}`, duration: 0.8, ease: 'power3.out' }), S.t('b2~proportion') + 0.35);
  S.add(gsap.fromTo(pointer, { autoAlpha: 0, y: -30 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'back.out(2)' }), 'b2~spinner');
  const samp = S.text('sampling', { x: W.x, y: W.y + W.r + 66, size: 34, anchor: 'middle', color: 'ink', weight: 650 });
  S.add(fx.in(samp, { from: 'up', d: 0.4 }), 'b2~sampling');

  // ---------------------------------------------------------------- b3: spin once, spin again, many spins
  const T = { s1: S.t('b3~Spin'), s2: S.t('b3~Spin#2'), run: S.t('b3~time'), fork: S.t('b3~appended') };
  // wheel angle θ (clockwise); the slice under the fixed top pointer is at wheel angle (360 − θ) mod 360
  const SPINS = [[T.s1, 1.1, 0, 226 + 720], [T.s2, 1.15, 946, 47 + 1800], [T.run, 1.4, 1847, 4727]];
  const eo = u => 1 - Math.pow(1 - u, 3);
  const theta = t => {
    let th = 0;
    for (const [t0, d, from, to] of SPINS) { if (t >= t0 + d) th = to; else if (t > t0) { th = from + (to - from) * eo((t - t0) / d); break; } else break; }
    return th;
  };
  const tally = S.text('', { x: 420, y: 690, size: 30, anchor: 'middle', family: 'mono', weight: 650, color: 'struct' });
  const tallyCap = S.text('expected, per 1,000 spins', { x: 420, y: 736, size: 24, anchor: 'middle', color: 'muted', weight: 550 });
  S.set([tally, tallyCap], { autoAlpha: 0 }, 0);
  S.add(gsap.to(tally, { autoAlpha: 1, duration: 0.3 }), 'b3~time');
  S.add(fx.in(tallyCap, { from: 'up', d: 0.35 }), S.t('b3~time') + 0.4);
  const paint = t => {
    wheel.setAttribute('transform', `rotate(${theta(t).toFixed(2)} ${W.x} ${W.y})`);
    const u = Math.min(1, Math.max(0, (t - T.run) / 1.4));
    tally.textContent = `cat ${Math.round(745 * u)} · dog ${Math.round(248 * u)} · other ${Math.round(7 * u)}`;
  };
  const clock = { t: 0 };
  S.add(gsap.fromTo(clock, { t: 0 }, { t: S.duration, duration: S.duration, ease: 'none', immediateRender: false, onUpdate: () => paint(clock.t) }), 0);
  S.call(() => paint(0), 0);
  // the winners drop into the slot
  const slotC = SL.x + SL.w / 2;
  const catPill = S.pill('cat', { x: slotC, y: TY, h: 56, size: 30, tone: 'struct' }, row);
  const dogPill = S.pill('dog', { x: slotC, y: TY, h: 56, size: 30, tone: 'struct' }, row);
  S.set([catPill, dogPill], { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(catPill, { autoAlpha: 0, y: -50 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power3.out' }), T.s1 + 1.15);
  S.add(gsap.to(catPill, { autoAlpha: 0, y: -50, duration: 0.3, ease: 'power2.in' }), T.s2 - 0.15);
  S.add(gsap.fromTo(dogPill, { autoAlpha: 0, y: -50 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power3.out' }), T.s2 + 1.2);
  S.add(gsap.to(qm, { autoAlpha: 0, duration: 0.2 }), T.s1 + 1.1);

  // 'appended': the row shrinks left and the sentence forks
  S.xset(row, { x: 0, y: 0, s: 1, ox: 470, oy: TY });
  S.add(gsap.to(dogPill, { autoAlpha: 0, duration: 0.25 }), T.fork - 0.1);
  S.add(gsap.to(slot, { autoAlpha: 0, duration: 0.25 }), T.fork - 0.1);
  S.add(fx.xform(row, { x: 160 - 470, s: 0.8 }, { d: 0.7, ease: 'power3.inOut' }), T.fork);
  const endX = 160 + (SL.x - 12 - 470) * 0.8;          // the row's right end after the move
  const branch = (y, words, at) => {
    const g = S.g();
    const path = S.path({ d: `M${endX + 6},${TY} C${endX + 30},${TY} ${endX + 20},${y} ${endX + 48},${y}`, stroke: 'struct', sw: 2.5, strokeOpacity: 0.7 }, g);
    let bx = endX + 56;
    const ps = words.map(w => { const p = S.pill(w, { x: bx, y, h: 46, size: 26, tone: 'struct', anchor: 'start' }, g); bx += p.w + 10; return p; });
    S.set(path, { autoAlpha: 0 }, 0);
    S.add(gsap.set(path, { autoAlpha: 1 }), at);
    S.add(fx.draw(path, { d: 0.35 }), at);
    ps.forEach((p, i) => S.add(fx.pop(p), at + 0.3 + i * 0.5));
    return g;
  };
  branch(140, ['cat', 'purring', 'softly'], T.fork + 0.6);
  branch(244, ['dog', 'snoring', 'loudly'], T.fork + 0.75);

  // ---------------------------------------------------------------- b4: nothing in the model changed
  S.add(fx.out([tally, tallyCap], { d: 0.35 }), 'b4');
  const model = S.g();
  model.setAttribute('data-audit', 'ignore');
  const tiles = ch01Tiles(S, { cx: 420, cy: 600, cw: 34, ch: 24, gap: 5, size: 11, parent: model });
  const lock = S.icon('ph:lock-simple-duotone', { x: 420, y: 520, size: 52, color: 'struct' }, model);
  const sameModel = S.text('same model', { x: 420, y: 700, size: 30, anchor: 'middle', color: 'muted', weight: 600 });
  S.add(fx.in(model, { from: 'up', d: 0.5 }), 'b4~nothing-0.1');
  S.add(fx.in(sameModel, { from: 'up', d: 0.4 }), 'b4~model');
  const ring = S.circle({ x: W.x, y: W.y, r: W.r + 18, fill: 'none', stroke: 'compute', sw: 5 });
  ring.setAttribute('data-audit', 'ignore');
  S.set(ring, { autoAlpha: 0 }, 0);
  S.add(gsap.set(ring, { autoAlpha: 1 }), 'b4~draw-0.3');
  S.add(fx.draw(ring, { d: 0.6 }), 'b4~draw-0.3');
  const take = S.takeaway('same model, same shares, different draw', { tone: 'struct' });
  S.add(fx.in(take, { from: 'up', d: 0.5 }), 'b4~lies');
});
