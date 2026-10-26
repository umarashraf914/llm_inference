/* ch07_s05 · written as a multiply, done as a gather (fig 88)
   b1  a one-hot strip draws across the top (grey 0s, a white 1 at '#4271'); 'one-hot × table = row 4271'.
   b2  a ghost of s02's picture flickers; braces '128,256' along the strip and down the table; the strip turns
       and stands down the table's left edge, its 1 beside row 4271; one column outlines in amber
       ('128,256 multiplications per output number'); all but one of its cells grey ('128,255 of them × 0').
   b3  '× 8,192 output numbers' → '≈ 1.05 billion multiplications' while amber outlines sweep every column;
       the card and counter are struck; the gather: a coral arrow from the 1 to row 4271, the row slides
       out, three more rows join it: 'gather'.
   b4  two cost cards: multiply (operations) and gather (memory reads); then one line stays.
   Checks: 128,256 × 8,192 = 1,050,673,152 ≈ 1.05 billion; 128,256 − 1 = 128,255.
   Layout: table strips x 740-1237, y 300-736; vertical one-hot at x 580; card and counter x 60-530;
   gathered rows x 1300-1797. */
V.scene('ch07_s05', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const E = n => gsap.parseEase(n);
  const clock = (a, b, fn) => S.add(ch07Drive(b - a, k => fn(a + k * (b - a))), a);

  // the table, as s04 left it (no counter, no width label)
  const TB = ch07Table(S, { x: 740, y: 300 });
  const CELLW = 22, PITCH = 25;
  const r4271 = TB.rowAt(4271);

  // ================================================================ b1: the one-hot strip and the equation
  const OH = { x: 560, y: 175, s: 36, p: 40, n: 20, one: 9 };
  const strip = S.g();
  const ohCells = [...Array(OH.n)].map((_, i) => {
    const g = S.g(null, strip), x = OH.x + i * OH.p, one = i === OH.one;
    S.rect({ x, y: OH.y - OH.s / 2, w: OH.s, h: OH.s, r: 6, fill: one ? '#2a3550' : '#0c1326', stroke: one ? 'white' : 'muted', strokeOpacity: one ? 1 : 0.45, sw: one ? 2.5 : 1.5 }, g);
    S.text(one ? '1' : '0', { x: x + OH.s / 2, y: OH.y + 1, size: 22, weight: one ? 800 : 500, family: 'mono', anchor: 'middle', color: one ? 'white' : 'faint' }, g);
    return g;
  });
  const ellL = S.text('…', { x: OH.x - 28, y: OH.y, size: 32, weight: 700, anchor: 'middle', color: 'muted' }, strip);
  const ellR = S.text('…', { x: OH.x + OH.n * OH.p + 14, y: OH.y, size: 32, weight: 700, anchor: 'middle', color: 'muted' }, strip);
  const oneX = OH.x + OH.one * OH.p + OH.s / 2;
  const tag = S.text('#4271', { x: oneX, y: OH.y - 42, size: 24, weight: 700, family: 'mono', anchor: 'middle', color: 'white' }, strip);
  ch07Hide([...ohCells, ellL, ellR, tag]);
  S.add(ch07Fade([ellL, ...ohCells, ellR], 0, 1, { d: 0.3, stagger: 0.05 }), 'b1~one-hot-0.1');
  S.add(ch07Fade(tag, 0, 1, { d: 0.4, dy0: -8, dy1: 0 }), "b1~fox's-0.1");
  const ohLbl = S.text('one-hot: 128,256 entries, one of them 1', { x: 960, y: OH.y + 48, size: 26, weight: 550, anchor: 'middle', color: 'muted' });
  ch07Hide(ohLbl);
  S.add(ch07Fade(ohLbl, 0, 1, { d: 0.45 }), 'b1~single-0.1');
  // the equation card, middle left
  const eqCard = S.g();
  S.card({ x: 60, y: 380, w: 470, h: 92, tone: 'neutral', r: 18 }, eqCard);
  S.text([{ t: 'one-hot × table = ' }, { t: 'row 4271', c: 'struct' }], { x: 295, y: 427, size: 32, weight: 650, anchor: 'middle', color: 'ink' }, eqCard);
  ch07Hide(eqCard);
  S.add(ch07Fade(eqCard, 0, 1, { d: 0.5, dy0: 12, dy1: 0 }), 'b1~times-0.1');

  // ================================================================ b2: it stands down the side
  // a ghost of s02: a short input lying along one row of a small grid
  const ghost = S.g();
  for (let c = 0; c < 5; c++) S.rect({ x: 100 + c * 30, y: 140, w: 24, h: 24, r: 4, fill: 'struct', fillOpacity: 0.5 }, ghost);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) S.rect({ x: 100 + c * 30, y: 182 + r * 26, w: 24, h: 20, r: 3, stroke: 'muted', strokeOpacity: 0.6, sw: 1.5 }, ghost);
  S.rect({ x: 92, y: 176, w: 156, h: 32, r: 6, stroke: 'compute', sw: 2 }, ghost);
  ch07Hide(ghost);
  const tGh = T('b2~Unlike') - 0.05;
  S.add(ch07Drive(1.2, k => { const v = 0.65 * Math.sin(Math.PI * k) * (0.75 + 0.25 * Math.sin(k * 40)); ghost.style.opacity = v; ghost.style.visibility = v > 0.01 ? 'inherit' : 'hidden'; }), tGh);
  // braces: '128,256' along the strip and down the table
  S.add(ch07Fade(ohLbl, 1, 0, { d: 0.3 }), T('b2~long') - 0.3);
  const brS = S.bracket({ x1: OH.x, x2: OH.x + OH.n * OH.p - 4, y: OH.y + 26, label: '128,256', tone: 'muted', size: 26 });
  const brT = S.g();
  const BX = TB.r + 20;
  S.path({ d: `M${BX},${TB.t} l12,0 L${BX + 12},${TB.b} l-12,0`, stroke: 'muted', sw: 2.5 }, brT);
  S.text('128,256', { x: BX + 26, y: TB.cy, size: 26, weight: 550, color: 'muted' }, brT);
  ch07Hide([brS, brT]);
  S.add(ch07Fade([brS, brT], 0, 1, { d: 0.45, stagger: 0.2 }), 'b2~long-0.05');
  // the strip turns 90° and stands along the table's left edge, one entry beside each row
  const VX = 580;
  const tTurn = T('b2~stands') - 0.1;
  S.add(ch07Fade(brS, 1, 0, { d: 0.25 }), tTurn - 0.1);
  const turn = gsap.timeline();
  turn.fromTo(strip, { rotation: 0, x: 0, y: 0, svgOrigin: `${oneX} ${OH.y}` }, { rotation: 90, x: VX - oneX, y: r4271.cy - OH.y, svgOrigin: `${oneX} ${OH.y}`, duration: 0.9, ease: 'power3.inOut', immediateRender: false }, 0);
  S.add(turn, tTurn);
  S.add(ch07Fade(strip, 1, 0, { d: 0.3 }), tTurn + 0.75);
  S.add(ch07Ignore(strip, 1.1), tTurn);                          // rotated text, mid-turn
  const vEntries = [];
  [...TB.rows, ...TB.ells].sort((a, b) => a.t - b.t).forEach(it => {
    const g = S.g();
    if (it.k === undefined) {
      for (let q = -1; q <= 1; q++) S.circle({ x: VX, y: it.cy + q * 11, r: 3.4, fill: 'muted' }, g);
    } else {
      const one = it.k === 4271;
      S.rect({ x: VX - 18, y: it.cy - 18, w: 36, h: 36, r: 6, fill: one ? '#2a3550' : '#0c1326', stroke: one ? 'white' : 'muted', strokeOpacity: one ? 1 : 0.45, sw: one ? 2.5 : 1.5 }, g);
      S.text(one ? '1' : '0', { x: VX, y: it.cy + 1, size: 22, weight: one ? 800 : 500, family: 'mono', anchor: 'middle', color: one ? 'white' : 'faint' }, g);
    }
    ch07Hide(g);
    vEntries.push(g);
  });
  S.add(ch07Fade(vEntries, 0, 1, { d: 0.3, stagger: 0.04 }), tTurn + 0.7);
  S.add(ch07Fade(brT, 1, 0.35, { d: 0.4 }), tTurn + 1.0);

  // 'a column of pairs': one column outlined in amber; the counter
  const COL = 8;
  const colX = c => TB.x + c * PITCH - 3;
  const colRect = c => S.rect({ x: colX(c), y: TB.t - 6, w: CELLW + 6, h: TB.h + 12, r: 5, stroke: 'compute', sw: 2.5 });
  const col = colRect(COL);
  col.setAttribute('data-audit', 'ignore');
  ch07Hide(col);
  S.add(ch07Fade(col, 0, 1, { d: 0.35 }), 'b2~column-0.1');
  const ctr = S.g();
  S.card({ x: 60, y: 520, w: 470, h: 300, tone: 'compute', r: 20 }, ctr);
  const c1 = S.text('128,256 multiplications', { x: 90, y: 566, size: 32, weight: 750, color: 'compute' }, ctr);
  const c2 = S.text('per output number', { x: 90, y: 604, size: 26, weight: 550, color: 'muted' }, ctr);
  const c3 = S.text('128,255 of them × 0', { x: 90, y: 652, size: 26, weight: 600, color: 'faint' }, ctr);
  const c4 = S.text('× 8,192 output numbers', { x: 90, y: 708, size: 28, weight: 650, color: 'ink' }, ctr);
  const c5 = S.text('≈ 1.05 billion multiplications', { x: 90, y: 764, size: 28, weight: 750, color: 'compute' }, ctr);
  ch07Hide([ctr, c3, c4, c5]);
  S.add(ch07Fade(ctr, 0, 1, { d: 0.45, dy0: 12, dy1: 0 }), 'b2~column');
  // 'all but one times zero': the column's cells grey out, except row 4271's
  const greys = S.g();
  TB.rows.filter(r => r.k !== 4271).forEach(r => S.rect({ x: TB.x + COL * PITCH, y: r.t, w: CELLW, h: 40, r: 3, fill: '#2b3247' }, greys));
  greys.setAttribute('data-audit', 'ignore');
  ch07Hide(greys);
  S.add(ch07Fade(greys, 0, 0.92, { d: 0.4 }), 'b2~all-0.05');
  S.add(ch07Fade(c3, 0, 1, { d: 0.4 }), 'b2~times-0.1');
  S.add(ch07Drive(0.5, k => { greys.style.opacity = (0.92 - 0.6 * Math.sin(Math.PI * k)).toFixed(3); }), 'b2~adds-0.1');

  // ================================================================ b3: a billion, struck; the gather
  S.add(ch07Fade(c4, 0, 1, { d: 0.4 }), 'b3~about-0.1');
  const tSum = T('b3~billion') - 0.1;
  S.add(ch07Fade(c5, 0, 1, { d: 0.3 }), tSum);
  clock(tSum, tSum + 1.0, t => {
    const v = 1.05 * E('power2.out')(cl((t - tSum) / 1.0));
    c5.textContent = `≈ ${v.toFixed(2)} billion multiplications`;
  });
  // amber outlines sweep every column
  const sweep = S.g();
  const sweepCols = [...Array(20)].map((_, c) => colRect(c));
  sweepCols.forEach(e => { sweep.appendChild(e); e.setAttribute('data-audit', 'ignore'); });
  sweep.setAttribute('data-audit', 'ignore');
  clock(tSum, tSum + 1.6, t => sweepCols.forEach((e, c) => {
    const u = (t - tSum) / 1.6 * 24 - c;
    e.setAttribute('opacity', (u <= 0 ? 0 : Math.max(0.35, 1 - 0.25 * u)).toFixed(3));
  }));
  sweepCols.forEach(e => e.setAttribute('opacity', 0));
  // 'The maths says multiply': strike the card and the counter, dim both
  const strikeA = S.line({ x1: 50, y1: 470, x2: 540, y2: 382, stroke: 'muted', sw: 4 });
  const strikeB = S.line({ x1: 50, y1: 812, x2: 540, y2: 528, stroke: 'muted', sw: 4 });
  [strikeA, strikeB].forEach(e => e.setAttribute('data-audit', 'ignore'));
  ch07Hide([strikeA, strikeB]);
  const tStrike = T('b3~maths') - 0.1;
  S.add(ch07Fade([strikeA, strikeB], 0, 1, { d: 0.3, stagger: 0.12 }), tStrike);
  S.add(ch07Fade([eqCard, ctr, strikeA, strikeB], 1, 0.3, { d: 0.5 }), tStrike + 0.5);
  // 'gather': the strip and the outlines go; a coral arrow from the 1 to row 4271; rows slide out
  const tG = T('b3~gather') - 0.15;
  S.add(ch07Fade([...vEntries.filter(g => !g.querySelector('text') || g.textContent.indexOf('1') < 0), col, sweep, greys, brT], 1, 0, { d: 0.4 }), tG);
  const arrow = S.arrow({ x1: VX + 20, y1: r4271.cy + 18, x2: TB.x - 8, y2: r4271.cy + 18, color: 'bytes', sw: 4, head: 14, bend: 30 });
  ch07Hide(arrow);
  S.add(ch07Fade(arrow, 0, 1, { d: 0.01 }), tG);
  S.add(fx.drawArrow(arrow, { d: 0.4 }), tG);
  const GX = 1300, GY0 = 380;
  const gathered = [4271, 1, 128254, 2];
  const gHold = gathered.map((k, i) => {
    const h = S.g();
    TB.copy(k, { parent: h });
    ch07Hide(h);
    const r = TB.rowAt(k);
    const tk = i === 0 ? tG + 0.35 : T('b3~fetching') - 0.1 + 0.18 * (i - 1);
    S.add(ch07Fade(h, 0, 1, { d: 0.15 }), tk);
    S.add(gsap.fromTo(h, { x: 0, y: 0 }, { x: GX - TB.x, y: GY0 + i * 52 - r.t, duration: 0.8, ease: 'power3.inOut', immediateRender: false }), tk);
    return h;
  });
  const gLbl = S.text('gather', { x: GX + TB.w / 2, y: GY0 - 34, size: 34, weight: 750, anchor: 'middle', color: 'bytes' });
  ch07Hide(gLbl);
  S.add(ch07Fade(gLbl, 0, 1, { d: 0.45, dy0: 10, dy1: 0 }), T('b3~rows') + 0.2);

  // ================================================================ b4: two costs; the habit
  const t4 = T('b4') - 0.15;
  S.add(ch07Fade([eqCard, ctr, strikeA, strikeB], 0.3, 0, { d: 0.45 }), t4);
  const costCard = (x, tone, icon, a, b) => {
    const g = S.g();
    S.card({ x, y: 860, w: 700, h: 120, tone, r: 22 }, g);
    S.icon(icon, { x: x + 62, y: 920, size: 64, color: tone }, g);
    S.text([{ t: a, c: tone, w: 750 }, { t: b, c: 'ink' }], { x: x + 112, y: 921, size: 32, weight: 600 }, g);
    ch07Hide(g);
    return g;
  };
  const cMul = costCard(180, 'compute', 'ph:calculator-duotone', 'multiply: ', 'counted in operations');
  const cGat = costCard(1040, 'bytes', 'ph:memory-duotone', 'gather: ', 'counted in memory reads');
  S.add(ch07Fade(cMul, 0, 1, { d: 0.5, dy0: 30, dy1: 0 }), 'b4~Multiply-0.1');
  S.add(ch07Fade(cGat, 0, 1, { d: 0.5, dy0: 30, dy1: 0 }), T('b4~Multiply') + 0.2);
  S.add(gsap.fromTo(cMul, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.05, duration: 0.22, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%', immediateRender: false }), 'b4~operations-0.05');
  S.add(gsap.fromTo(cGat, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.05, duration: 0.22, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%', immediateRender: false }), 'b4~memory-0.05');
  // 'a habit worth keeping': everything dims but one line
  const tH = T('b4~habit') - 0.15;
  const keep = [TB, ...vEntries, arrow, ...gHold, gLbl, cMul, cGat];
  S.add(ch07Fade(keep, 1, 0.15, { d: 0.6 }), tH);
  S.add(ch07Ignore(keep), tH);
  const plateW = S.measure('written as a multiply, done as something cheaper', { size: 46, weight: 700, family: 'display' }) + 90;
  const habit = S.g();
  S.rect({ x: 960 - plateW / 2, y: 540 - 56, w: plateW, h: 112, r: 26, fill: '#0b1124', fillOpacity: 0.94, stroke: 'ink', strokeOpacity: 0.18, sw: 2 }, habit);
  S.text([{ t: 'written as a ' }, { t: 'multiply', c: 'compute' }, { t: ', done as something ' }, { t: 'cheaper', c: 'helps' }], { x: 960, y: 542, size: 46, weight: 700, family: 'display', anchor: 'middle', color: 'ink' }, habit);
  ch07Hide(habit);
  S.add(ch07Fade(habit, 0, 1, { d: 0.6, dy0: 12, dy1: 0 }), tH + 0.3);
});
