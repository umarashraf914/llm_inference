/* ch01_s07 · softmax: scores become shares (fig 9)
   Scores → e to each score → divide by the total → shares that add to one. Each point of gap
   multiplies the odds by about 2.7: the exponential exaggerates every gap.
   Numbers are blue (results); each operation flashes amber as it happens. */
V.scene('ch01_s07', S => {
  const { fx } = S;
  const ROW = i => 380 + i * 100;
  const COL = { label: 370, icon: 330, score: 600, e: 850, share: 1110, bar: 1220 };
  const BARU = 480;                                   // 480 px = 100%
  const C = [
    { label: 'cat', icon: 'fluent:cat-face', v: 8.2, ex: '3,641', share: 0.7449, shareTxt: '74.5%' },
    { label: 'dog', icon: 'fluent:dog-face', v: 7.1, ex: '1,212', share: 0.2480, shareTxt: '24.8%' },
    { label: 'the', icon: null, v: 3.5, ex: '33', share: 0.00678, shareTxt: '0.68%' },
    { label: 'banana', icon: 'fluent:banana', v: 0.4, ex: '1.5', share: 0.000306, shareTxt: '0.03%' },
  ];

  // ---------------------------------------------------------------- b1: the four bars collapse into a table
  const rows = C.map((c, i) => {
    const g = S.g();
    g.lab = S.g(null, g);
    if (c.icon) S.icon(c.icon, { x: 420, y: ROW(i), size: 52 }, g.lab);
    S.text(c.label, { x: 460, y: ROW(i), size: 34, weight: 600, color: 'ink', case: 'keep' }, g.lab);
    g.bar = S.rect({ x: 640, y: ROW(i) - 24, w: c.v * 100, h: 48, r: 6, fill: 'url(#bar-struct)' }, g);
    g.score = S.text(c.v.toFixed(1), { x: 640 + c.v * 100 + 18, y: ROW(i) + 1, size: 34, family: 'mono', weight: 600, color: 'struct' }, g);
    return g;
  });
  S.add(fx.pulse(rows[0].bar, { scale: 1.04, d: 0.5 }), 'b1~eight');
  const hdrs = [['score', COL.score], ['e to the score', COL.e], ['share', COL.share]].map(([t, x]) =>
    S.text(t, { x, y: 312, size: 28, anchor: 'middle', color: 'muted', weight: 600 }));
  rows.forEach((g, i) => {
    const c = C[i], at = S.t('b1~shares') - 0.1 + i * 0.06;
    S.add(gsap.to(g.bar, { attr: { width: 0 }, duration: 0.3, ease: 'power2.in' }), at - 0.15);
    S.add(gsap.to(g.score, { x: COL.score - (640 + c.v * 100 + 18) - 26, duration: 0.6, ease: 'power3.inOut' }), at + 0.12);
    S.add(gsap.to(g.lab, { x: -90, duration: 0.6, ease: 'power3.inOut' }), at);
  });
  S.add(fx.in(hdrs, { from: 'down', d: 0.4, stagger: 0.1 }), 'b1~shares+0.3');
  const hdrLine = S.line({ x1: 300, y1: 336, x2: 1700, y2: 336, stroke: 'faint', sw: 1.5 });
  S.add(fx.draw(hdrLine, { d: 0.6 }), 'b1~shares+0.3');
  const tagIll = S.text('illustrative', { x: COL.score, y: 262, size: 24, anchor: 'middle', color: 'muted', weight: 550 });
  const tagReal = S.g();
  S.icon('ph:check-circle-duotone', { x: 902, y: 262, size: 30, color: 'ink' }, tagReal);
  S.text('real arithmetic', { x: 926, y: 262, size: 26, color: 'ink', weight: 600 }, tagReal);
  S.add(fx.in(tagIll, { from: 'up', d: 0.35 }), 'b1~made');
  S.add(fx.in(tagReal, { from: 'up', d: 0.35 }), 'b1~arithmetic');

  // ---------------------------------------------------------------- b2: step one, the exponential
  S.add(fx.out([tagIll, tagReal], { d: 0.3 }), 'b2');
  const RC = { x: 470, y: 160, w: 980, h: 64 };
  const recipe = S.g();
  S.rect({ x: RC.x, y: RC.y, w: RC.w, h: RC.h, r: 16, fill: '#0c1326' }, recipe);
  const recipeBg = S.rect({ x: RC.x, y: RC.y, w: RC.w, h: RC.h, r: 16, fill: 'url(#card-compute)', stroke: 'compute', sw: 2, strokeOpacity: 0.85 }, recipe);
  const half1 = S.text('e to each score,', { x: RC.x + 40, y: RC.y + RC.h / 2 + 1, size: 32, weight: 650, color: 'ink' }, recipe);
  const h1w = S.measure('e to each score,', { size: 32, weight: 650 });
  const half2 = S.text('then divide by the total', { x: RC.x + 52 + h1w, y: RC.y + RC.h / 2 + 1, size: 32, weight: 650, color: 'ink' }, recipe);
  half2.setAttribute('opacity', 0.3);
  S.add(fx.in(recipe, { from: 'down', d: 0.45 }), 'b2~Step-0.1');
  const eCard = S.g();
  S.rect({ x: 1480, y: 164, w: 220, h: 56, r: 14, fill: '#0c1326', stroke: 'muted', sw: 1.5, strokeOpacity: 0.6 }, eCard);
  S.text('e ≈ 2.718', { x: 1590, y: 193, size: 30, anchor: 'middle', family: 'mono', weight: 600, color: 'compute' }, eCard);
  S.add(fx.pop(eCard), 'b2~number');
  S.add(fx.out(eCard, { d: 0.35 }), 'b2>-0.4');

  // 'power': each score lifts into a superscript over an amber e, then resolves to its value
  const eCells = C.map((c, i) => {
    const g = S.g();
    g.expr = S.g(null, g);
    S.text('e', { x: COL.e - 18, y: ROW(i) + 4, size: 42, anchor: 'middle', weight: 600, color: 'compute' }, g.expr);
    g.sup = S.text(c.v.toFixed(1), { x: COL.e + 2, y: ROW(i) - 16, size: 26, family: 'mono', weight: 600, color: 'struct' }, g.expr);
    g.val = S.text(c.ex, { x: COL.e, y: ROW(i) + 1, size: 34, anchor: 'middle', family: 'mono', weight: 600, color: 'struct' }, g);
    return g;
  });
  eCells.forEach((g, i) => {
    S.add(gsap.fromTo(g.expr, { autoAlpha: 0, x: COL.score - COL.e, y: 10 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.55, ease: 'power3.out' }), S.t('b2~power') + i * 0.08);
    const at = S.t('b2~three') - 0.1 + (i === 0 ? 0 : 0.6 + i * 0.25);
    S.add(gsap.to(g.expr, { autoAlpha: 0, duration: 0.2 }), at);
    S.add(gsap.fromTo(g.val, { autoAlpha: 0, scale: 0.7, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }), at + 0.1);
  });

  // ---------------------------------------------------------------- b3: always positive; step two, divide by the total
  const note = S.g();
  const noteHead = S.text('always positive', { x: 1480, y: 420, size: 28, anchor: 'middle', color: 'ink', weight: 650 }, note);
  const noteBody = S.text('score −1 → 0.37', { x: 1480, y: 480, size: 32, anchor: 'middle', family: 'mono', weight: 600, color: 'struct' }, note);
  S.add(fx.in(noteBody, { from: 'up', d: 0.4 }), 'b3~negative');
  S.add(fx.in(noteHead, { from: 'up', d: 0.4 }), 'b3~positive');
  S.add(gsap.fromTo(eCells.map(g => g.val), { filter: 'none' }, { filter: 'url(#glow-struct)', duration: 0.35, yoyo: true, repeat: 1 }), 'b3~positive');
  S.add(fx.pulse(hdrs[2], { scale: 1.15, d: 0.5 }), 'b3~share');
  S.add(fx.out(note, { d: 0.35 }), 'b3~Step-0.1');
  S.add(gsap.to(half2, { attr: { opacity: 1 }, duration: 0.4 }), 'b3~Step');
  S.add(gsap.to(half1, { attr: { opacity: 0.45 }, duration: 0.4 }), 'b3~Step');
  // copies of the values drop into a total under the column
  const total = S.text('total ≈ 4,888', { x: COL.e, y: 790, size: 34, anchor: 'middle', family: 'mono', weight: 650, color: 'struct' });
  const totLine = S.line({ x1: COL.e - 110, y1: 744, x2: COL.e + 110, y2: 744, stroke: 'muted', sw: 2 });
  const drops = C.map((c, i) => S.text(c.ex, { x: COL.e, y: ROW(i) + 1, size: 34, anchor: 'middle', family: 'mono', weight: 600, color: 'struct' }));
  drops.forEach(d => d.setAttribute('data-audit', 'ignore'));
  S.set(drops, { autoAlpha: 0 }, 0);
  drops.forEach((d, i) => {
    const at = S.t('b3~Step') + 0.2 + i * 0.12;
    S.add(gsap.fromTo(d, { autoAlpha: 0.9, y: 0 }, { autoAlpha: 0, y: 790 - ROW(i), duration: 0.6, ease: 'power2.in' }), at);
  });
  S.add(fx.draw(totLine, { d: 0.4 }), S.t('b3~Step') + 0.5);
  S.add(fx.in(total, { from: 'up', d: 0.4 }), S.t('b3~Step') + 0.75);
  // 'each': amber arrows from each value into the share column
  const divArrows = C.map((c, i) => S.arrow({ x1: COL.e + 78, y1: ROW(i), x2: COL.share - 66, y2: ROW(i), color: 'compute', sw: 3, head: 12 }));
  S.set(divArrows, { autoAlpha: 0 }, 0);
  divArrows.forEach((a, i) => { S.add(gsap.set(a, { autoAlpha: 1 }), S.t('b3~each') + i * 0.1); S.add(fx.drawArrow(a, { d: 0.35 }), S.t('b3~each') + i * 0.1); });
  S.add(fx.pulse(total, { scale: 1.1, d: 0.5 }), 'b3~four');
  // the shares land as they are spoken, each with a bar to scale
  const shares = C.map((c, i) => {
    const g = S.g();
    g.txt = S.text(c.shareTxt, { x: COL.share, y: ROW(i) + 1, size: 34, anchor: 'middle', family: 'mono', weight: 650, color: 'struct' }, g);
    g.bar = S.rect({ x: COL.bar, y: ROW(i) - 22, w: Math.max(1.5, c.share * BARU), h: 44, r: c.share > 0.05 ? 6 : 0.5, fill: 'url(#bar-struct)' }, g);
    return g;
  });
  [['b3~seventy-four', [0]], ['b3~twenty-four', [1]], ['b3~other', [2, 3]]].forEach(([at, idx]) => idx.forEach(i => {
    S.add(fx.in(shares[i].txt, { from: 'left', d: 0.4 }), at);
    S.add(gsap.fromTo(shares[i].bar, { attr: { width: 0 } }, { attr: { width: Math.max(1.5, C[i].share * BARU) }, duration: 0.6, ease: 'power3.out' }), at);
  }));
  S.add(gsap.to(divArrows, { autoAlpha: 0, duration: 0.4 }), 'b3~other+0.6');

  // ---------------------------------------------------------------- b4: they add to one; softmax; probability
  const foot = S.text('four candidates only, for clarity', { x: 1460, y: 790, size: 24, anchor: 'middle', color: 'muted', weight: 550 });
  S.add(fx.in(foot, { from: 'up', d: 0.35 }), 'b4~just');
  // copies of the share bars join end to end into one full bar
  const stack = S.g();
  let sx = COL.bar;
  const stackBars = C.map((c, i) => { const w = Math.max(1.5, c.share * BARU); const r = S.rect({ x: sx, y: 852, w, h: 40, r: 0, fill: i % 2 ? 'url(#bar-struct)' : 'struct', stroke: '#0c1326', sw: 1 }, stack); r.from = ROW(i) - 22 - 852; sx += w; return r; });
  const one = S.text('= 1.00', { x: COL.bar + BARU + 20, y: 873, size: 32, family: 'mono', weight: 650, color: 'ink' }, stack);
  S.set(stackBars, { autoAlpha: 0 }, 0);
  stackBars.forEach((r, i) => S.add(gsap.fromTo(r, { autoAlpha: 1, x: 0, y: r.from }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.inOut' }), S.t('b4~exactly') + i * 0.08));
  S.add(fx.in(one, { from: 'left', d: 0.4 }), S.t('b4~exactly') + 0.6);
  S.add(fx.out(foot, { d: 0.3 }), 'b4~softmax-0.2');
  const smTitle = S.text('softmax', { x: 960, y: 192, size: 38, anchor: 'middle', weight: 700, family: 'display', color: 'compute' });
  S.add(gsap.to([half1, half2], { autoAlpha: 0, duration: 0.3 }), 'b4~softmax-0.2');
  S.add(fx.in(smTitle, { from: 'fade', d: 0.4 }), 'b4~softmax');
  const extra = S.text('one of the few extra steps', { x: 960, y: 262, size: 26, anchor: 'middle', color: 'muted', weight: 550 });
  S.add(fx.in(extra, { from: 'fade', d: 0.35 }), 'b4~extra');
  S.add(fx.swap(hdrs[2], 'probability'), 'b4~probability-0.1');
  // end of b4: tidy up; the recipe card shrinks to its title
  S.add(fx.out([extra, stack, total, totLine], { d: 0.4 }), 'b4>-0.1');
  S.add(fx.dim(hdrs, { to: 0.35 }), 'b4>-0.1');
  S.add(gsap.to(recipeBg, { attr: { x: 960 - 110, width: 220 }, duration: 0.5, ease: 'power3.inOut' }), 'b4>-0.1');
  S.add(gsap.to(recipe.firstChild, { attr: { x: 960 - 110, width: 220 }, duration: 0.5, ease: 'power3.inOut' }), 'b4>-0.1');

  // ---------------------------------------------------------------- b5: each point of gap multiplies the odds by 2.7
  S.add(fx.dim(eCells.map(g => g.val), { to: 0.15 }), 'b5');
  const x27 = S.text('each point of gap: × 2.7', { x: COL.score, y: 262, size: 26, anchor: 'middle', color: 'compute', weight: 650 });
  S.add(fx.in(x27, { from: 'up', d: 0.4 }), 'b5~Each');
  const vbr = (x, y1, y2, dir = 1) => S.path({ d: `M${x - 12 * dir},${y1} L${x},${y1} L${x},${y2} L${x - 12 * dir},${y2}`, stroke: 'compute', sw: 3 });
  const sb1 = vbr(COL.score + 52, ROW(0) - 6, ROW(1) + 6), sb1L = S.text('gap 1.1', { x: COL.score + 70, y: (ROW(0) + ROW(1)) / 2, size: 28, weight: 650, color: 'compute' });
  const pb1 = vbr(1610, ROW(0) - 6, ROW(1) + 6), pb1L = S.text('× 3.0', { x: 1628, y: (ROW(0) + ROW(1)) / 2, size: 30, weight: 700, color: 'compute' });
  S.set([sb1, pb1], { autoAlpha: 0 }, 0);
  S.add(gsap.set(sb1, { autoAlpha: 1 }), 'b5~one');
  S.add(fx.draw(sb1, { d: 0.4 }), 'b5~one');
  S.add(fx.in(sb1L, { from: 'left', d: 0.35 }), 'b5~one+0.2');
  S.add(gsap.set(pb1, { autoAlpha: 1 }), 'b5~three');
  S.add(fx.draw(pb1, { d: 0.4 }), 'b5~three');
  S.add(fx.in(pb1L, { from: 'left', d: 0.35 }), 'b5~three+0.2');
  S.add(gsap.fromTo([shares[0].bar, shares[1].bar], { filter: 'none' }, { filter: 'url(#glow-struct)', duration: 0.4 }), 'b5~three');
  S.add(gsap.to([shares[0].bar, shares[1].bar], { filter: 'none', duration: 0.4 }), 'b5>');

  // ---------------------------------------------------------------- b6: the little word 'the', 110 times less likely
  S.add(fx.out([sb1, sb1L, pb1, pb1L], { d: 0.35 }), 'b6');
  const sb2 = vbr(COL.score + 52, ROW(0) - 6, ROW(2) + 6), sb2L = S.text('gap 4.7', { x: COL.score + 70, y: ROW(1), size: 28, weight: 650, color: 'compute' });
  const pb2 = vbr(1610, ROW(0) - 6, ROW(2) + 6), pb2L = S.text('× 110', { x: 1628, y: ROW(1), size: 30, weight: 700, color: 'compute' });
  S.set([sb2, pb2], { autoAlpha: 0 }, 0);
  S.add(gsap.set(sb2, { autoAlpha: 1 }), 'b6~four');
  S.add(fx.draw(sb2, { d: 0.45 }), 'b6~four');
  S.add(fx.in(sb2L, { from: 'left', d: 0.35 }), 'b6~four+0.25');
  const chain1 = ['2.7', '× 2.7', '× 2.7', '× 2.7'], chainX = [COL.score + 70, 0, 0, 0];
  let cx = COL.score + 70;
  const links = chain1.map((t, k) => { const e = S.text(t, { x: cx, y: ROW(1) + 64, size: 30, family: 'mono', weight: 650, color: 'compute' }); cx += S.measure(t, { size: 30, family: 'mono', weight: 650 }) + 14; return e; });
  const tail = S.text('× 2.0  ≈ 110', { x: COL.score + 70, y: ROW(1) + 112, size: 30, family: 'mono', weight: 650, color: 'compute' });
  links.forEach((e, k) => S.add(fx.in(e, { from: 'left', d: 0.3 }), S.t('b6~once') + k * 0.28));
  S.add(fx.in(tail, { from: 'left', d: 0.35 }), 'b6~hundred-0.3');
  S.add(gsap.set(pb2, { autoAlpha: 1 }), 'b6~hundred');
  S.add(fx.draw(pb2, { d: 0.45 }), 'b6~hundred');
  S.add(fx.in(pb2L, { from: 'left', d: 0.35 }), 'b6~hundred+0.25');
  const take = S.takeaway('the exponential exaggerates every gap', { tone: 'compute' });
  S.add(fx.in(take, { from: 'up', d: 0.5 }), 'b6~exaggerates-0.2');

  // the table and everything on it move down as one block, so it sits in the middle of the space under the recipe
  // banner and the 'softmax' title (which stay at the top): 90 px while it fills, 120 once the total and the stacked
  // bar have gone after b4
  const keep = new Set([recipe, eCard, smTitle, extra]);
  const table = S.g();
  [...S.main.children].filter(e => e !== table && !keep.has(e)).forEach(e => table.appendChild(e));
  S.main.insertBefore(table, S.main.firstChild);
  S.set(table, { y: 90 }, 0);
  S.add(gsap.fromTo(table, { y: 90 }, { y: 120, duration: 0.7, ease: 'power2.inOut', immediateRender: false }), S.t('b5') - 0.4);
});
