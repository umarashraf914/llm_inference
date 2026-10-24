/* ch08_s05 · what context means (fig 95)
   b1  'the river bank' and 'the savings bank', the two banks aligned; threads from each bank to its
       neighbour, and each bank gains a strip of that neighbour's pattern: 'same token, different result'.
   b2  'Context: everything the model can see'; 12 small pills (the prompt so far, bracketed), the newest
       glowing; a wide dashed 'context length' outline, mostly empty; amber threads fan from the newest pill
       to every pill, 'looks at: 12', then 13, 14 as two more arrive.
   b3  pills fill the outline (20 slots, 'schematic'); it turns solid, 'context length' / 'the window';
       then each new pill pushes the window right and the oldest drop and grey: 'out of reach'.
   b4  the fan pulses with each token; 'not only a storage limit' greys aside; 'a recurring cost'.
   Slots: x 140 + 70·i, pills 62 wide at y 760; the window is 20 slots (1,400 px). One painter draws the
   strip, the window, the fan and the counter from the arrival times. */
V.scene('ch08_s05', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const E = n => gsap.parseEase(n);
  const clock = (a, b, fn) => S.add(ch08Drive(b - a, k => fn(a + k * (b - a))), a);
  const fade = (els, a, b, at, d = 0.45) => S.add(ch08Fade(els, a, b, { d }), at);

  // ================================================================ b1: river bank, savings bank
  const R1 = 290, R2 = 480, BKX = 1080;
  const row = (words, xs, y) => words.map((w, i) => libToken(S, { text: w, x: xs[i], y, size: 34 }));
  const rowA = row(['the', 'river', 'bank'], [620, 830, BKX], R1), rowB = row(['the', 'savings', 'bank'], [600, 830, BKX], R2);
  const top = S.g();
  [...rowA, ...rowB].forEach(p => top.appendChild(p));
  const wave = S.icon('ph:waves-bold', { x: BKX + 96, y: R1, size: 40, color: 'struct' }, top);
  const coin = S.icon('ph:coins-bold', { x: BKX + 96, y: R2, size: 38, color: 'struct' }, top);
  const tR1 = T('b1~Bank') - 0.2, tR2 = T('b1~bank#2') - 0.1;
  S.add(ch08Fade([...rowA, wave], 0, 1, { d: 0.5, stagger: 0.08 }), tR1);
  S.add(ch08Fade([...rowB, coin], 0, 1, { d: 0.5, stagger: 0.08 }), tR2);
  ch08Hide([...rowA, ...rowB, wave, coin]);
  // threads back to each neighbour; each bank gains its neighbour's strip
  const thA = S.path({ d: `M${BKX},${R1 - 32} C${BKX - 40},${R1 - 110} ${830 + 40},${R1 - 110} ${830},${R1 - 32}`, stroke: 'struct', sw: 3 }, top);
  const thB = S.path({ d: `M${BKX},${R2 + 32} C${BKX - 40},${R2 + 110} ${830 + 40},${R2 + 110} ${830},${R2 + 32}`, stroke: 'struct', sw: 3 }, top);
  [thA, thB].forEach(e => { e.setAttribute('data-audit', 'ignore'); S.set(e, { autoAlpha: 0 }, 0); });
  const tTh = T('b1~blends') - 0.1;
  S.add(fx.draw([thA, thB], { d: 0.6, stagger: 0.1 }), tTh);
  const stA = S.g(null, top), stB = S.g(null, top);
  ch08Vec(S, { token: 'river', dir: 'row', n: 6, cw: 14, ch: 12, gap: 2, x: BKX, y: R1 + 44 }, stA);
  ch08Vec(S, { token: 'savings', dir: 'row', n: 6, cw: 14, ch: 12, gap: 2, x: BKX, y: R2 - 44 }, stB);
  ch08Hide([stA, stB]);
  fade([stA, stB], 0, 1, tTh + 0.5, 0.4);
  const same = S.text('same token, different result', { x: BKX + 150, y: (R1 + R2) / 2, size: 30, weight: 650, color: 'ink' }, top);
  ch08Hide(same);
  fade(same, 0, 1, T('b1~neighbour') - 0.1);

  // ================================================================ b2-b4: the strip and the window
  const t2 = T('b2') - 0.1;
  S.add(gsap.to(top, { y: -60, opacity: 0, duration: 0.7, ease: 'power2.in' }), t2);
  S.add(ch08Ignore(top, 0.8), t2);
  const headA = S.text('Context:', { x: 960, y: 170, size: 54, weight: 750, family: 'display', anchor: 'middle', color: 'struct' });
  const headB = S.text('everything the model can see', { x: 960, y: 236, size: 42, weight: 650, family: 'display', anchor: 'middle', color: 'ink' });
  ch08Hide([headA, headB]);
  fade(headA, 0, 1, T('b2~Context') - 0.05, 0.5);
  fade(headB, 0, 1, T('b2~everything') - 0.1, 0.5);
  const WORDS = ['Read', 'the', 'notes', 'from', 'our', 'last', 'call', 'and', 'list', 'three', 'risks', 'we', 'face', 'next', 'week', 'with', 'one', 'fix', 'for', 'each', 'and', 'a', 'cost', 'note'];
  const SX = i => 140 + 70 * i, SY = 760, PW = 62, PH = 40, WIN = 20;
  const pills = WORDS.map((w, i) => {
    const g = S.g();
    const bg = S.rect({ x: SX(i) - PW / 2, y: SY - PH / 2, w: PW, h: PH, r: 10, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.7, sw: 1.8 }, g);
    S.text(w, { x: SX(i), y: SY + 1, size: 20, weight: 600, anchor: 'middle', color: 'ink' }, g);
    g.bg = bg;
    g.style.opacity = 0; g.style.visibility = 'hidden';
    return g;
  });
  // arrival times: 12 at once-ish, two more, a quick fill to 20, then four that push the window
  const ta = [];
  const tB = T('b2~everything');
  for (let i = 0; i < 12; i++) ta.push(tB + 0.08 * i);
  ta.push(T('b2~all') + 0.05, T('b2~it') + 0.3);
  for (let i = 14; i < 20; i++) ta.push(T('b3~length') + 0.18 * (i - 14));
  for (let i = 20; i < 24; i++) ta.push(T('b3~fall') - 0.05 + 0.45 * (i - 20));
  const nAt = t => ta.filter(x => x <= t).length;
  // the window: dashed, then solid; it slides right a slot at a time once the strip is longer than it
  const win = S.rect({ x: SX(0) - PW / 2 - 8, y: SY - PH / 2 - 10, w: WIN * 70 + 2, h: PH + 20, r: 14, stroke: 'ink', strokeOpacity: 0.7, sw: 2.5, dash: '10 8' });
  // its labels hang under its left end (the fan rises above the strip)
  const winLbl = S.text('context length', { x: 0, y: SY + PH / 2 + 34, size: 28, weight: 700, color: 'ink' });
  const winSub = S.text('the window', { x: 0, y: SY + PH / 2 + 66, size: 24, weight: 550, color: 'muted' });
  ch08Hide([win, winLbl, winSub]);
  fade(win, 0, 1, T('b2~see') - 0.2, 0.5);
  fade(winLbl, 0, 0.6, T('b2~see'), 0.5);
  const tSolid = T('b3~Context') - 0.05;
  S.add(gsap.fromTo(win, { attr: { 'stroke-dasharray': '10 8', 'stroke-opacity': 0.7 } }, { attr: { 'stroke-dasharray': '1 0', 'stroke-opacity': 1 }, duration: 0.3, immediateRender: false }), tSolid);
  fade(winLbl, 0.6, 1, tSolid, 0.3);
  fade(winSub, 0, 1, T('b3~window') - 0.1, 0.4);
  const schem = S.text('schematic', { x: 1830, y: 900, size: 22, weight: 550, anchor: 'end', color: 'faint' });
  ch08Hide(schem);
  fade(schem, 0, 1, T('b3~size') - 0.1, 0.4);
  // 'the prompt so far' over the first pills, 'newest token' under the newest
  const promptBr = S.g();
  const pbPath = S.path({ d: '', stroke: 'struct', sw: 2.5 }, promptBr);
  const pbLbl = S.text('the prompt so far', { x: 0, y: SY - PH / 2 - 40, size: 26, weight: 650, anchor: 'middle', color: 'struct' }, promptBr);
  ch08Hide(promptBr);
  fade(promptBr, 0, 1, T('b2~prompt') - 0.1, 0.4);
  fade(promptBr, 1, 0, T('b2~Each') - 0.1, 0.35);
  const newest = S.text('newest token', { x: 0, y: SY + 46, size: 24, weight: 650, anchor: 'middle', color: 'struct' });
  ch08Hide(newest);
  fade(newest, 0, 1, T('b2~newest') - 0.1, 0.4);
  const ring = S.rect({ x: 0, y: SY - PH / 2 - 5, w: PW + 10, h: PH + 10, r: 13, stroke: 'white', sw: 2.5 });
  ring.setAttribute('data-audit', 'ignore');
  ch08Hide(ring);
  fade(ring, 0, 1, T('b2~newest') - 0.1, 0.3);
  // the fan: amber threads from the newest pill back to every pill in the window
  const fanP = S.path({ d: '', stroke: 'compute', sw: 1.8, opacity: 0 });
  fanP.setAttribute('data-audit', 'ignore');
  const tFan = T('b2~looks') - 0.1;
  const pulses = [T('b4~more'), T('b4~work'), T('b4~per')];
  const cnt = S.text('looks at: 0', { x: 1830, y: 600, size: 30, weight: 700, family: 'mono', anchor: 'end', color: 'compute' });
  ch08Hide(cnt);
  fade(cnt, 0, 1, tFan, 0.3);
  const outTag = S.text('out of reach', { x: SX(1.5), y: SY + 146, size: 24, weight: 600, anchor: 'middle', color: 'muted' });
  ch08Hide(outTag);
  fade(outTag, 0, 1, ta[20] + 0.5, 0.4);
  const paint = t => {
    const n = nAt(t), w = Math.max(0, n - WIN);
    // the window slides a slot as each pill pushes in
    let wx = 0;
    for (let i = WIN; i < ta.length; i++) wx += E('power2.inOut')(cl((t - ta[i]) / 0.4));
    const winX = SX(0) - PW / 2 - 8 + 70 * wx;
    win.setAttribute('x', winX.toFixed(1));
    winLbl.setAttribute('x', (winX + 6).toFixed(1)); winSub.setAttribute('x', (winX + 6).toFixed(1));
    pills.forEach((g, i) => {
      const a = cl((t - ta[i]) / 0.25);
      const drop = i < WIN - 0 + 4 && ta[i + WIN] !== undefined ? E('power2.in')(cl((t - ta[i + WIN]) / 0.45)) : 0;
      g.style.opacity = (a * (1 - 0.55 * drop)).toFixed(3);
      g.style.visibility = a > 0 ? 'inherit' : 'hidden';
      g.setAttribute('transform', `translate(${(14 * (1 - a)).toFixed(1)},${(90 * drop).toFixed(1)})`);
      g.bg.setAttribute('stroke', drop > 0.5 ? S.tone('muted') : S.tone('struct'));
    });
    const nw = Math.max(0, n - 1);
    ring.setAttribute('x', (SX(nw) - PW / 2 - 5).toFixed(1));
    newest.setAttribute('x', SX(nw).toFixed(1));
    // bracket over the prompt so far
    const x0 = SX(0) - PW / 2, x1 = SX(nw) + PW / 2, yb = SY - PH / 2 - 14;
    pbPath.setAttribute('d', `M${x0},${yb} v-10 H${x1} v10`);
    pbLbl.setAttribute('x', ((x0 + x1) / 2).toFixed(1));
    // the fan, from the newest to every earlier pill still in the window
    let d = '';
    if (n > 1) for (let i = w; i < n - 1; i++) {
      const xa = SX(nw), xb = SX(i), h = 30 + Math.min(150, 0.12 * (xa - xb));
      d += `M${xa},${SY - PH / 2} C${xa},${SY - PH / 2 - h} ${xb},${SY - PH / 2 - h} ${xb},${SY - PH / 2}`;
    }
    fanP.setAttribute('d', d);
    let pu = 0;
    pulses.forEach(tp => { pu = Math.max(pu, Math.sin(Math.PI * cl((t - tp) / 0.45))); });
    const base = t < tFan ? 0 : t < T('b4~recurring') ? 0.55 : 0.3;
    fanP.setAttribute('opacity', (cl((t - tFan) / 0.4) * (base + 0.45 * pu)).toFixed(3));
    fanP.setAttribute('stroke-width', (1.8 + 1.6 * pu).toFixed(2));
    cnt.textContent = `looks at: ${Math.min(n, WIN)}`;
  };
  paint(0);
  clock(0, S.duration, paint);

  // ================================================================ b4: a recurring cost
  fade([headA, headB], 1, 0, T('b4') - 0.1, 0.4);
  const lineA = S.text('not only a storage limit', { x: 960, y: 380, size: 44, weight: 650, family: 'display', anchor: 'middle', color: 'ink' });
  const lineB = S.text('a recurring cost', { x: 960, y: 460, size: 58, weight: 750, family: 'display', anchor: 'middle', color: 'white' });
  ch08Hide([lineA, lineB]);
  fade(lineA, 0, 1, T('b4~storage') - 0.5, 0.45);
  const tRc = T('b4~recurring') - 0.15;
  S.add(gsap.fromTo(lineA, { x: 0 }, { x: -420, duration: 0.7, ease: 'power3.inOut', immediateRender: false }), tRc);
  S.add(gsap.fromTo(lineA, { attr: { fill: S.tone('ink') } }, { attr: { fill: S.tone('faint') }, duration: 0.5, immediateRender: false }), tRc);
  fade(lineB, 0, 1, tRc + 0.25, 0.5);
});
