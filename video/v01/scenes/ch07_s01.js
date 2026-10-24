/* ch07_s01 · a list and a grid (fig 84)
   One continuous shot.
   b1: a faint echo of the last chapter's line; a vector of eight numbers; it rises to become the top row
       of a 4 × 8 matrix, three more rows dropping in on 'rows', 'of', 'eight'.
   b2: 'A vector': the top row lights; a copy lifts out and is carried (an arc over the grid) to the left
       third, as the grid makes room on the right. 'A matrix': the grid lights; 'block of weights': it turns
       to faint grey decimals (stored weights at rest).
   b3: the pull-back. The grid flies to the top-left corner and becomes tile 0 of a wall of 20 × 28 = 560
       identical tiles; the camera keeps pulling back while the wall fills row by row and the counter runs to
       '~560'. The vector, now a short strip, slides into the first matrix and the chapter's first amber
       ripples through the wall, matrix after matrix. */
V.scene('ch07_s01', S => {
  const { fx } = S;
  const head = ch07Heading(S);

  // ---------------------------------------------------------------- layout
  const CELL = { size: 34, cw: 116, ch: 72, gap: 14 };   // hero cells, 130 px pitch: a 1,026 x 330 grid
  const GX = 960, GY = 560;                               // the 4 x 8 grid's centre
  const ROW_Y = i => 431 + 86 * i;                        // row centres (grid spans y 395..725)
  const GW = 8 * 116 + 7 * 14, GH = 4 * 72 + 3 * 14;      // 1026 x 330
  const ROWS = [
    CH07.X,
    ['-0.7', '0.6', '1.3', '-0.2', '0.8', '0.1', '-0.9', '0.5'],
    ['0.2', '-0.4', '0.7', '1.0', '-1.1', '0.3', '0.6', '-0.8'],
    ['1.2', '0.5', '-0.3', '-0.6', '0.0', '0.9', '-0.2', '0.4'],
  ];
  // b2: the copy in the left third, the grid in the right third, both at 0.72 (34 px digits read at 24 px)
  const B2S = 0.72, COPY_C = [490, 560], GRID_C = [1420, 560];
  // b3: the wall. Each tile is the grid itself at 1/21 scale (49 x 15.8 px), 4 px apart: 20 x 28 = 560.
  const TS = 49 / GW;
  const WL = { x0: 540, y0: 250, cols: 20, rows: 28, tw: GW * TS, th: GH * TS };
  WL.px = WL.tw + 4; WL.py = WL.th + 4;
  const T0 = [WL.x0 + WL.tw / 2, WL.y0 + WL.th / 2];      // tile 0 centre (564.5, 257.9)
  const Z0 = 3;                                           // camera zoom on the wall when the grid lands
  const STRIP_S = 0.25, CR = 468;                         // left column: the strip and the counter end at x 468
  const STRIP_C = [CR - GW * STRIP_S / 2, T0[1]];         // the vector waits left of tile 0

  // A curved carry for an xform-planned group: x/y follow a quadratic curve through the control offset
  // `via`, s interpolates, all on one eased progress. Writes the same transform as fx.xform and leaves
  // el.__xf at the end state, so later fx.xform calls continue from it. (fx.xform only moves in straight lines.)
  const carry = (el, to, via, o = {}) => {
    const a = { ...el.__xf }, b = { ...a, ...to };
    el.__xf = b;
    return ch07Drive(o.d ?? 1, k => {
      const u = 1 - k;
      const x = u * u * a.x + 2 * u * k * via.x + k * k * b.x;
      const y = u * u * a.y + 2 * u * k * via.y + k * k * b.y;
      const s = a.s + (b.s - a.s) * k;
      el.setAttribute('transform', `translate(${x.toFixed(3)},${y.toFixed(3)}) translate(${a.ox},${a.oy}) scale(${s.toFixed(5)}) translate(${-a.ox},${-a.oy})`);
    }, o.ease || 'power2.inOut');
  };

  // ---------------------------------------------------------------- the wall (b3), drawn first, behind
  // 560 tiles, each the grid's 8 x 4 cells in grey (weights at rest), with an amber overlay for the
  // multiply ripple. The wall group carries the camera move: it starts zoomed Z0x about tile 0, where the
  // grid lands, and pulls back to 1 while the tiles fill in reading order.
  const wall = S.g({ 'data-audit': 'ignore' }, S.layers.back);
  S.xset(wall, { s: Z0, ox: T0[0], oy: T0[1] });
  const tiles = [];
  const cw = 116 * TS, chh = 72 * TS, pxc = 130 * TS, pyc = 86 * TS;
  for (let r = 0; r < WL.rows; r++) for (let c = 0; c < WL.cols; c++) {
    const x = WL.x0 + c * WL.px, y = WL.y0 + r * WL.py;
    const tg = S.g(null, wall);
    S.rect({ x: x - 0.8, y: y - 0.8, w: WL.tw + 1.6, h: WL.th + 1.6, r: 1.6, fill: '#0b1224', stroke: 'neutral', strokeOpacity: 0.16, sw: 0.6 }, tg);
    let d = '';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) d += `M${(x + j * pxc).toFixed(2)},${(y + i * pyc).toFixed(2)}h${cw.toFixed(2)}v${chh.toFixed(2)}h${(-cw).toFixed(2)}z`;
    S.path({ d, fill: 'neutral', fillOpacity: 0.36 }, tg);
    // the ripple lights the tile's own cells amber (its numbers being multiplied), not a slab over them
    const glow = S.g(null, tg);
    S.rect({ x: x - 0.8, y: y - 0.8, w: WL.tw + 1.6, h: WL.th + 1.6, r: 1.6, fill: 'compute', fillOpacity: 0.12, stroke: 'compute', strokeOpacity: 0.6, sw: 0.8 }, glow);
    S.path({ d, fill: 'compute', fillOpacity: 0.95 }, glow);
    ch07Hide([tg, glow]);
    tiles.push({ g: tg, glow, r, c });
  }
  // tile 0 keeps a blue outline: the grid we have been looking at
  const ring0 = S.rect({ x: WL.x0 - 2.2, y: WL.y0 - 2.2, w: WL.tw + 4.4, h: WL.th + 4.4, r: 2.5, fill: 'none', stroke: 'struct', sw: 1.4 }, wall);
  ch07Hide(ring0);

  // ---------------------------------------------------------------- b1: the echo, then a vector
  // the last chapter's line, faint, for the first sentence only
  S.add(head.show('data movement is expensive', { color: 'faint', d: 0.01 }), 0);
  S.add(head.hide({ d: 0.5 }), 'b1~two-0.1');
  S.add(head.show([{ t: 'a vector', c: 'struct' }, { t: ': a list of numbers' }]), 'b1~A vector-0.1');

  const gridHolder = S.g();                              // the whole grid: to the right in b2, the wall in b3
  const row0Holder = S.g(null, gridHolder);              // the vector: starts centred, rises to row 0
  const row0 = libVector(S, { values: CH07.X, x: GX, y: ROW_Y(0), ...CELL }, row0Holder);
  S.xset(row0Holder, { y: 540 - ROW_Y(0) });
  S.add(row0.pop({ stagger: 0.15, d: 0.45 }), 'b1~list-0.12');

  // "like these eight": a bracket under the row
  const eightG = S.g();
  const eight = S.bracket({ x1: row0.l, x2: row0.r, y: 540 + 36 + 16, label: '8 numbers', size: 28 }, eightG);
  ch07Hide([eightG, eight.label]);
  S.add(ch07Fade(eightG, 0, 1, { d: 0.05 }), 'b1~these-0.05');
  S.add(fx.draw(eight.line, { d: 0.45 }), 'b1~these-0.05');
  S.add(ch07Fade(eight.label, 0, 1, { d: 0.4 }), 'b1~eight-0.1');
  S.add(ch07Fade(eightG, 1, 0, { d: 0.3, ease: 'power2.in' }), 'b1~A matrix-0.25');

  // "a matrix is a grid of them": the row rises to become the top row; three rows drop in beneath
  S.add(head.show([{ t: 'a matrix', c: 'struct' }, { t: ': a grid of numbers' }]), 'b1~matrix-0.1');
  S.add(fx.xform(row0Holder, { y: 0 }, { d: 0.8, ease: 'power3.inOut' }), 'b1~grid-0.2');
  const rows = [row0];
  for (let i = 1; i < 4; i++) rows.push(libVector(S, { values: ROWS[i], x: GX, y: ROW_Y(i), ...CELL }, gridHolder));
  ['b1~rows', 'b1~of#3', 'b1~eight#2'].forEach((at, i) => S.add(rows[i + 1].in({ from: 'down', dist: 44, d: 0.45 }), `${at}-0.12`));
  const sizeLbl = S.text([{ t: '4 × 8 = ' }, { t: '32', c: 'ink' }, { t: ' numbers' }], { x: GX, y: 725 + 54, size: 30, anchor: 'middle', color: 'muted', weight: 550 });
  ch07Hide(sizeLbl);
  S.add(ch07Fade(sizeLbl, 0, 1, { d: 0.45, dy0: 10, dy1: 0 }), 'b1~eight#2+0.25');

  // ---------------------------------------------------------------- b2: two terms; one token, a block of weights
  S.add(ch07Fade(sizeLbl, 1, 0, { d: 0.35, ease: 'power2.in' }), 'b2~linear-0.2');
  S.add(head.show("two terms, that's all"), 'b2~linear-0.1');

  // "A vector": the top row lights; a copy lifts out and is carried over the grid to the left third,
  // while the grid glides to the right third to make room
  S.add(row0.sweep({ stagger: 0.05 }), 'b2~vector-0.15');
  const copyHolder = S.g();
  const copy = row0.clone({ parent: copyHolder });
  ch07Hide(copyHolder);
  S.xset(copyHolder, { ox: GX, oy: ROW_Y(0) });
  S.add(ch07Fade(copyHolder, 0, 1, { d: 0.1 }), 'b2~stands-0.25');
  S.add(ch07Ignore(copyHolder, 1.75), 'b2~stands-0.25');
  S.add(fx.xform(copyHolder, { y: -128, s: 0.92 }, { d: 0.45, ease: 'power2.out' }), 'b2~stands-0.2');
  S.add(carry(copyHolder, { x: COPY_C[0] - GX, y: COPY_C[1] - ROW_Y(0), s: B2S }, { x: -420, y: -128 }, { d: 1.1 }), 'b2~stands+0.32');
  S.add(fx.xform(gridHolder, { x: GRID_C[0] - GX, y: GRID_C[1] - GY, s: B2S, ox: GX, oy: GY }, { d: 1.15, ease: 'power3.inOut' }), 'b2~stands+0.08');
  const tagTok = S.text('one token, as numbers', { x: COPY_C[0], y: COPY_C[1] + 36 * B2S + 44, size: 30, anchor: 'middle', color: 'muted', weight: 550 });
  const tagW = S.text('a block of weights', { x: GRID_C[0], y: GRID_C[1] + (GH / 2) * B2S + 44, size: 30, anchor: 'middle', color: 'muted', weight: 550 });
  ch07Hide([tagTok, tagW]);
  S.add(ch07Fade(tagTok, 0, 1, { d: 0.5, dy0: 10, dy1: 0 }), 'b2~token+0.3');
  // "A matrix": the whole grid lights; "a block of weights": its cells turn to faint grey decimals
  rows.forEach((rv, i) => S.add(rv.sweep({ stagger: 0.04 }), S.t('b2~matrix') - 0.1 + i * 0.05));
  rows.forEach((rv, i) => S.add(rv.paint('all', 'neutral', { d: 0.5, stagger: 0.035, textColor: 'faint' }), S.t('b2~block') - 0.2 + i * 0.06));
  S.add(ch07Fade(tagW, 0, 1, { d: 0.5, dy0: 10, dy1: 0 }), 'b2~weights-0.15');

  // ---------------------------------------------------------------- b3: a few hundred such grids
  S.add(head.show('a model: a few hundred grids'), 'b3~model-0.15');
  S.add(ch07Fade([tagTok, tagW], 1, 0, { d: 0.35, ease: 'power2.in' }), 'b3~few-0.4');
  // the pull-back, part 1: the grid flies to the top-left corner, where tile 0 will be; the vector shrinks
  // to a short strip waiting at the wall's left edge
  const PB = 'b3~few-0.15', PB_D = 1.15;
  S.add(ch07Ignore([gridHolder, copyHolder]), PB);
  // its digits fade and it becomes the chapter's shaded strip (a vector you no longer read): blue for
  // positive, violet for negative, shade = size
  S.add(ch07Fade(copy.cells.map(c => c.label), 1, 0, { d: 0.4, ease: 'power1.in' }), PB);
  const vmax = Math.max(...CH07.X.map(v => Math.abs(parseFloat(v))));
  S.add(copy.paint('all', (c, i) => {
    const v = parseFloat(CH07.X[i]);
    return { tone: v < 0 ? 'violet' : 'struct', style: 'heat', amt: Math.min(1, (0.14 + 0.7 * Math.abs(v) / vmax) * 1.25) };
  }, { d: 0.5 }), S.t(PB) + 0.3);
  S.add(fx.xform(gridHolder, { x: T0[0] - GX, y: T0[1] - GY, s: TS * Z0 }, { d: PB_D, ease: 'power3.inOut' }), PB);
  S.add(fx.xform(copyHolder, { x: STRIP_C[0] - GX, y: STRIP_C[1] - ROW_Y(0), s: STRIP_S }, { d: PB_D, ease: 'power3.inOut' }), PB);
  // part 2: the grid hands over to tile 0 and the camera keeps pulling back while the wall fills
  const P2 = S.t(PB) + PB_D - 0.05, FILL_D = 1.35;
  S.add(ch07Fade(gridHolder, 1, 0, { d: 0.2 }), P2);
  S.add(ch07Fade([tiles[0].g, ring0], 0, 1, { d: 0.2 }), P2);
  S.add(fx.xform(wall, { s: 1 }, { d: 1.6, ease: 'power2.inOut' }), P2);

  // the counter, right-aligned in the left column: runs 1 -> 560 as the tiles appear, then gains its '~'
  const NUM = { size: 64, family: 'mono', weight: 600 };
  const cNum = S.text('1', { x: CR, y: 470, ...NUM, anchor: 'end', color: 'ink' });
  const cTilde = S.text('~', { x: CR - S.measure('560', NUM) - 4, y: 470, ...NUM, anchor: 'end', color: 'ink' });
  const cLbl = S.text('matrices', { x: CR, y: 534, size: 30, anchor: 'end', color: 'muted', weight: 550 });
  const pillW = S.measure('our 70B model', { size: 24, weight: 600 }) + 44;
  const cTag = S.pill('our 70B model', { x: CR - pillW, y: 598, h: 44, size: 24, tone: 'struct', style: 'outline', anchor: 'start' });
  ch07Hide([cTilde, cNum, cLbl, cTag]);
  S.add(ch07Fade([cNum, cLbl], 0, 1, { d: 0.35, dy0: 10, dy1: 0 }), P2);
  S.add(ch07Drive(FILL_D, p => {
    const n = 1 + p * (tiles.length - 1);
    for (let i = 1; i < tiles.length; i++) {
      const v = Math.max(0, Math.min(1, n - i));
      tiles[i].g.style.opacity = v;
      tiles[i].g.style.visibility = v > 0.001 ? 'inherit' : 'hidden';
    }
    cNum.textContent = S.fmt.int(Math.floor(n + 1e-6));
  }, 'power1.inOut'), P2 + 0.05);
  S.add(ch07Fade(cTilde, 0, 1, { d: 0.3 }), P2 + 0.05 + FILL_D);
  S.add(ch07Fade(cTag, 0, 1, { d: 0.4, dy0: 10, dy1: 0 }), P2 + 0.15 + FILL_D);

  // "multiplying vectors by them": the strip slides into the first matrix, and the chapter's first amber
  // ripples through the wall in reading order, matrix after matrix: a soft band a few rows tall
  S.add(fx.xform(copyHolder, { x: T0[0] - GX, y: T0[1] - ROW_Y(0), s: TS }, { d: 0.7, ease: 'power2.inOut' }), 'b3~multiplying-0.15');
  S.add(ch07Fade(copyHolder, 1, 0, { d: 0.18, ease: 'power1.in' }), 'b3~multiplying+0.42');
  const SWEEP = 3.3, PULSE = 0.6;
  S.add(ch07Drive(SWEEP + PULSE, p => {
    const T = p * (SWEEP + PULSE);
    tiles.forEach(t => {
      const u = (T - (t.r + t.c / WL.cols) / WL.rows * SWEEP) / PULSE;
      const v = u > 0 && u < 1 ? 0.8 * Math.sin(Math.PI * u) : 0;   // back to grey after: weights at rest
      t.glow.style.opacity = v;
      t.glow.style.visibility = v > 0.001 ? 'inherit' : 'hidden';
    });
  }), 'b3~multiplying+0.45');
  S.add(head.show([{ t: 'one operation: ' }, { t: 'multiply and add', c: 'compute' }]), 'b3~multiply#2-0.15');
});
