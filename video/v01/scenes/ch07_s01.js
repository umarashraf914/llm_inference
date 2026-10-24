/* ch07_s01 · a list and a grid (fig 84)
   One continuous shot. b1: a faint echo of the last chapter's line; a vector of eight numbers; it becomes
   the top row of a 4 × 8 matrix. b2: a copy of that row (one token) splits left, the grid (a block of
   weights) goes right and turns grey. b3: the pull-back: the grid becomes the first tile of a wall of
   560 (our 70B model), the vector slides in, and the first amber of the chapter sweeps through it. */
V.scene('ch07_s01', S => {
  const { fx } = S;
  const head = ch07Heading(S);

  // ---------------------------------------------------------------- layout
  const CELL = { size: 34, ch: 72, gap: 14 };             // hero cells: 116 x 72, 14 px apart -> 1,026 px row
  const GX = 960, GY = 560;                               // the 4 x 8 grid's centre
  const ROW_Y = i => 431 + 86 * i;                        // row centres (grid 395..725)
  const ROWS = [
    CH07.X,
    ['-0.7', '0.6', '1.3', '-0.2', '0.8', '0.1', '-0.9', '0.5'],
    ['0.2', '-0.4', '0.7', '1.0', '-1.1', '0.3', '0.6', '-0.8'],
    ['1.2', '0.5', '-0.3', '-0.6', '0.0', '0.9', '-0.2', '0.4'],
  ];
  // b2: copy to the left, grid to the right, both at 0.72 (34 px digits read at 24 px)
  const B2S = 0.72, COPY_C = [490, 560], GRID_C = [1420, 560];
  // b3: a wall of 20 x 28 tiles, each one the grid at 1/23 scale (44 x 14 px), 4 px apart
  const WL = { x0: 510, y0: 290, cols: 20, rows: 28, tw: 44, th: 14, px: 48, py: 18 };
  const WALL_W = WL.cols * WL.px - 4, WALL_H = WL.rows * WL.py - 4;      // 956 x 500
  const TILE_S = WL.tw / 1026;                                            // grid -> tile scale
  const T0 = [WL.x0 + WL.tw / 2, WL.y0 + WL.th / 2];                     // tile 0 centre (532, 297)
  const STRIP_S = 0.3, STRIP_C = [WL.x0 - 48 - 1026 * STRIP_S / 2, T0[1]];  // the vector waiting left of tile 0
  const CX = WL.x0 + WALL_W + 50;                                         // counter column (1516)

  // ---------------------------------------------------------------- the wall (b3), drawn first, behind
  // 560 tiles, each a grey frame with the grid's 8 x 4 cells as a fine texture, plus an amber overlay for
  // the multiply sweep. Revealed tile by tile in reading order; the grid itself lands on tile 0.
  const wall = S.g({ 'data-audit': 'ignore' }, S.layers.back);
  const tiles = [];
  for (let r = 0; r < WL.rows; r++) for (let c = 0; c < WL.cols; c++) {
    const x = WL.x0 + c * WL.px, y = WL.y0 + r * WL.py;
    const tg = S.g(null, wall);
    S.rect({ x, y, w: WL.tw, h: WL.th, r: 2.5, fill: '#0c1326' }, tg);
    S.rect({ x, y, w: WL.tw, h: WL.th, r: 2.5, fill: 'neutral', fillOpacity: 0.1, stroke: 'neutral', strokeOpacity: 0.55, sw: 1 }, tg);
    let d = '';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) d += `M${(x + 2 + j * 5.05).toFixed(2)},${(y + 1.9 + i * 2.6).toFixed(2)}h4v1.8h-4z`;
    S.path({ d, fill: 'neutral', fillOpacity: 0.32 }, tg);
    const glow = S.rect({ x, y, w: WL.tw, h: WL.th, r: 2.5, fill: 'compute', fillOpacity: 0.7, stroke: 'compute', sw: 1.2 }, tg);
    ch07Hide([tg, glow]);
    tiles.push({ g: tg, glow, r, c });
  }

  // ---------------------------------------------------------------- b1: the echo, then a vector
  // the last chapter's line, faint, for the first sentence only
  S.add(head.show('data movement is expensive', { color: 'faint', d: 0.01 }), 0);
  S.add(head.hide({ d: 0.5 }), 'b1~two-0.1');
  S.add(head.show([{ t: 'a vector', c: 'struct' }, { t: ': a list of numbers' }]), 'b1~A vector-0.1');

  const gridHolder = S.g();                              // the whole grid: split right in b2, shrinks in b3
  const row0Holder = S.g(null, gridHolder);              // the vector: starts centred, glides up to row 0
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

  // a copy of the top row lifts out and floats left while the grid makes room on the right
  const copyHolder = S.g();
  const copy = row0.clone({ parent: copyHolder });
  ch07Hide(copyHolder);
  S.add(ch07Fade(copyHolder, 0, 1, { d: 0.12 }), 'b2~vector-0.1');
  S.add(ch07Ignore(copyHolder, 1.55), 'b2~vector-0.1');
  S.add(copy.sweep({ stagger: 0.04 }), 'b2~vector-0.1');
  S.add(fx.xform(copyHolder, { y: -22, ox: GX, oy: ROW_Y(0) }, { d: 0.35, ease: 'power2.out' }), 'b2~vector');
  S.add(fx.xform(copyHolder, { x: COPY_C[0] - GX, y: COPY_C[1] - ROW_Y(0), s: B2S }, { d: 1.05, ease: 'power3.inOut' }), 'b2~vector+0.3');
  S.add(fx.xform(gridHolder, { x: GRID_C[0] - GX, y: GRID_C[1] - GY, s: B2S, ox: GX, oy: GY }, { d: 1.15, ease: 'power3.inOut' }), 'b2~vector+0.2');
  const tagTok = S.text('one token, as numbers', { x: COPY_C[0], y: COPY_C[1] + 36 * B2S + 44, size: 30, anchor: 'middle', color: 'muted', weight: 550 });
  const tagW = S.text('a block of weights', { x: GRID_C[0], y: GRID_C[1] + 165 * B2S + 44, size: 30, anchor: 'middle', color: 'muted', weight: 550 });
  ch07Hide([tagTok, tagW]);
  S.add(ch07Fade(tagTok, 0, 1, { d: 0.5, dy0: 10, dy1: 0 }), 'b2~one-0.05');
  // "a matrix holds a block of weights": the grid's cells turn to faint grey decimals
  rows.forEach((rv, i) => S.add(rv.paint('all', 'neutral', { d: 0.5, stagger: 0.035, textColor: 'faint' }), S.t('b2~block') - 0.2 + i * 0.06));
  S.add(ch07Fade(tagW, 0, 1, { d: 0.5, dy0: 10, dy1: 0 }), 'b2~weights-0.15');

  // ---------------------------------------------------------------- b3: a few hundred such grids
  S.add(head.show('a model: a few hundred grids'), 'b3~model-0.15');
  S.add(ch07Fade([tagTok, tagW], 1, 0, { d: 0.35, ease: 'power2.in' }), 'b3~few-0.3');
  // the pull-back: the grid shrinks onto tile 0, the vector to a short strip waiting at the wall's left
  S.add(ch07Ignore([gridHolder, copyHolder]), 'b3~few-0.12');
  S.add(ch07Fade(copy.cells.map(c => c.label), 1, 0, { d: 0.45, ease: 'power1.in' }), 'b3~few-0.12');
  S.add(fx.xform(gridHolder, { x: T0[0] - GX, y: T0[1] - GY, s: TILE_S }, { d: 1.35, ease: 'power3.inOut' }), 'b3~few-0.12');
  S.add(fx.xform(copyHolder, { x: STRIP_C[0] - GX, y: STRIP_C[1] - ROW_Y(0), s: STRIP_S }, { d: 1.35, ease: 'power3.inOut' }), 'b3~few-0.12');
  S.add(ch07Fade(gridHolder, 1, 0, { d: 0.2 }), 'b3~few+1.12');
  S.add(ch07Fade(tiles[0].g, 0, 1, { d: 0.2 }), 'b3~few+1.12');

  // the wall fills in reading order while the counter counts the tiles
  const cTilde = S.text('~', { x: CX, y: 492, size: 64, family: 'mono', weight: 600, color: 'ink' });
  const cNum = S.text('1', { x: CX + 42, y: 492, size: 64, family: 'mono', weight: 600, color: 'ink' });
  const cLbl = S.text('matrices', { x: CX, y: 556, size: 30, color: 'muted', weight: 550 });
  const cTag = S.pill('our 70B model', { x: CX, y: 616, h: 44, size: 24, tone: 'struct', style: 'outline', anchor: 'start' });
  ch07Hide([cTilde, cNum, cLbl, cTag]);
  S.add(ch07Fade([cNum, cLbl], 0, 1, { d: 0.4, dy0: 10, dy1: 0 }), 'b3~few+1.05');
  const FILL_D = 1.6;
  S.add(ch07Drive(FILL_D, p => {
    const n = 1 + p * (tiles.length - 1);
    for (let i = 1; i < tiles.length; i++) {
      const v = Math.max(0, Math.min(1, n - i));
      tiles[i].g.style.opacity = v;
      tiles[i].g.style.visibility = v > 0.001 ? 'inherit' : 'hidden';
    }
    cNum.textContent = S.fmt.int(Math.floor(n));
  }, 'power1.inOut'), 'b3~few+1.2');
  S.add(ch07Fade(cTilde, 0, 1, { d: 0.35 }), `b3~few+${(1.2 + FILL_D).toFixed(2)}`);
  S.add(ch07Fade(cTag, 0, 1, { d: 0.45, dy0: 10, dy1: 0 }), `b3~few+${(1.3 + FILL_D).toFixed(2)}`);

  // "multiplying vectors by them": the vector slides into the first matrix and an amber sweep runs
  // through the wall in reading order (matrix after matrix), a soft band a few rows tall
  S.add(fx.xform(copyHolder, { x: T0[0] - GX, y: T0[1] - ROW_Y(0), s: TILE_S }, { d: 0.75, ease: 'power2.in' }), 'b3~multiplying-0.2');
  S.add(ch07Fade(copyHolder, 1, 0, { d: 0.22, ease: 'power1.in' }), 'b3~multiplying+0.38');
  const SWEEP = 2.8, PULSE = 0.5;
  S.add(ch07Drive(SWEEP + PULSE, p => {
    const T = p * (SWEEP + PULSE);
    tiles.forEach(t => {
      const u = (T - (t.r + t.c / WL.cols) / WL.rows * SWEEP) / PULSE;
      const v = u > 0 && u < 1 ? 0.8 * Math.sin(Math.PI * u) : 0;
      t.glow.style.opacity = v;
      t.glow.style.visibility = v > 0.001 ? 'inherit' : 'hidden';
    });
  }), 'b3~multiplying+0.5');
  S.add(head.show([{ t: 'one operation: ' }, { t: 'multiply and add', c: 'compute' }]), 'b3~multiply#2-0.15');
});
