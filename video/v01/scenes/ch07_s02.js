/* ch07_s02 · multiply and add, row by row (fig 85)
   One continuous shot on one layout: 'in' (left third) × a 4 × 5 matrix (centre) = 'out' (right third),
   a small counter top right. Everything starts in place at 50%.
   b1: the input, then the matrix row by row, come up to full. 'first row': the other rows dim and a ghost
       copy of 'in' tips over (a rigid 90° turn, numbers kept upright) and slides up to lie along row 1;
       the five pairs multiply into amber chips (libMatVec.multiply).
   b2: the chips are carried into the running total, 0 → 0.2 → −0.1 → −0.1 → 0.8 → 0.5, which flies into
       the top 'out' cell.
   b3: three outline copies of the input drop onto rows 2-4, which flash amber together and fill their
       'out' cells (libMatVec.pulse); counter 20 / 20. Row 1 is framed again and the chapter-one picture
       (2, 1, 5, 1, 1 × 0.13, −0.7, 0.02, 1.44, −0.3 → 0.8) appears top left: 'one row = this'.
   b4: the counter moves to the top centre and enlarges; each tile flashes once in reading order and keeps
       an amber outline (used, once); 'each weight: 1 multiply + 1 add'.
   b5: the pull-back. The camera retreats while the matrix grows columns to the right (pushing 'out' along)
       and rows downward ('in' and 'out' stretch with it) into a grid running off the bottom of the frame,
       '8,192' along its top; an amber wave runs down it. At the right, a tall amber bar 'vector × matrix'
       beside a hairline 'everything else', marked 'schematic'. */
V.scene('ch07_s02', S => {
  const { fx } = S;

  // ---------------------------------------------------------------- layout (world = screen until b5)
  const CW = 120, CH = 68, GAP = 12, SIZE = 32;
  const PX = CW + GAP, PY = CH + GAP;                      // 132 x 80 pitch
  const X0 = 636, Y0 = 480;                                // matrix top-left
  const WW = 5 * PX - GAP, WH = 4 * PY - GAP;              // 648 x 308
  const MCX = X0 + WW / 2, MCY = Y0 + WH / 2;              // 960, 634
  const LANE_T = Y0 - 20 - CH;                             // the ghost lane's top (libMatVec inGap 20)
  // libMatVec ties the input column's left gap to the lane gap (both inGap): build with 20 (the ghost lies
  // 20 px above row 1) and slide the input column left into the left third, leaving room for the '×'.
  const IN_SHIFT = -130;
  const OUT_X = X0 + WW + 150;                             // 1434: the output column (outGap 150, room for '=')
  const W = [
    CH07.W1,                                               // 0.5, 0.25, −0.7, 1.0, −1.0
    ['-0.7', '0.6', '1.3', '-0.2', '0.8'],                 // rows 2-4: faint, never read
    ['0.2', '-0.4', '0.7', '1.0', '-1.1'],
    ['1.2', '0.5', '-0.3', '-0.6', '0.0'],
  ];
  // the counter, top right: right edge at x 1800 once it reads '20'
  const CSZ = 30;
  const labW = Math.max(...['multiplications:', 'additions:'].map(t => S.measure(t, { size: CSZ, weight: 550 })));
  const numW = S.measure('20', { size: CSZ, family: 'mono', weight: 600 });
  const C_W = labW + 14 + numW, C_X = 1800 - C_W, C_Y = 176, C_LH = Math.round(CSZ * 1.45);

  const mv = libMatVec(S, {
    x: X0, y: Y0, W, input: CH07.X.slice(0, 5), inputAt: 'left',
    cw: CW, ch: CH, gap: GAP, size: SIZE, inGap: 20, outGap: 150, laneGap: 52,
    labels: { input: 'in', output: 'out' }, labelSize: 30,
    counters: true, counterAt: { x: C_X, y: C_Y }, counterSize: CSZ, showOut: [0],
  });
  mv.input.setAttribute('transform', `translate(${IN_SHIFT},0)`);
  // rows 2-4: faint values (they are never read)
  mv.cells.filter(c => c.r > 0 && c.label).forEach(c => { c.label.setAttribute('fill', S.tone('faint')); c.__tc = S.tone('faint'); });
  const rowCells = i => mv.cells.filter(c => c.r === i);
  const IN_R = X0 - 20 + IN_SHIFT;                         // 486: the input column's right edge
  const IN_CX = IN_R - CW / 2;                             // 426
  const IN_T = MCY - (5 * PY - GAP) / 2;                   // 440: its top

  const times = S.text('×', { x: (IN_R + X0) / 2, y: MCY, size: 64, anchor: 'middle', color: 'compute', weight: 500 });
  const equals = S.text('=', { x: (X0 + WW + OUT_X) / 2, y: MCY, size: 64, anchor: 'middle', color: 'muted', weight: 500 });
  const wLabel = S.text('4 × 5 matrix', { x: MCX, y: LANE_T - 42, size: 28, anchor: 'middle', color: 'muted', weight: 600 });

  // the counter lives in the HUD (it is gone before the camera moves) inside a holder it can grow with
  const cHold = S.g(null, S.hud);
  mv.counterEls.forEach(ce => cHold.appendChild(ce.g));

  // opening state: everything in place at 50%
  [mv.input, mv.output, cHold, wLabel, times, equals, ...mv.cells].forEach(e => { e.style.opacity = 0.5; });

  // a scale pulse about each element's centre (cx, cy), written to its transform attribute (seek-safe)
  const pulseAt = (els, at, o = {}) => els.forEach((e, i) => S.add(ch07Drive(o.d ?? 0.4, k => {
    const s = 1 + (o.amp ?? 0.08) * Math.sin(Math.PI * k);
    if (Math.abs(s - 1) < 1e-4) e.removeAttribute('transform');
    else e.setAttribute('transform', `matrix(${s.toFixed(4)},0,0,${s.toFixed(4)},${(e.cx * (1 - s)).toFixed(2)},${(e.cy * (1 - s)).toFixed(2)})`);
  }), S.t(at) + i * (o.stagger ?? 0)));

  // ---------------------------------------------------------------- b1: five inputs, four rows of five
  S.add(ch07Fade(mv.input, 0.5, 1, { d: 0.4 }), 'b1~five-0.15');
  S.add(mv.input.sweep({ stagger: 0.12, d: 0.4 }), 'b1~five');
  pulseAt(mv.input.cells, 'b1~five', { stagger: 0.12, amp: 0.07 });
  ['b1~four', 'b1~rows', 'b1~of', 'b1~five#2'].forEach((at, i) => {
    S.add(ch07Fade(rowCells(i), 0.5, 1, { d: 0.35 }), `${at}-0.12`);
    S.add(mv.flashCells({ row: i }, { tone: 'white', d: 0.42, stagger: 0.035, peak: 0.75, hold: 0.02 }), `${at}-0.1`);
  });
  S.add(ch07Fade(times, 0.5, 1, { d: 0.4 }), 'b1~four-0.12');
  S.add(ch07Fade([wLabel, mv.output, equals, cHold], 0.5, 1, { d: 0.45 }), 'b1~five#2-0.05');

  // 'first row': the other rows dim, row 1 takes the amber frame
  S.add(mv.focus(0, { dim: 0.3, d: 0.45 }), 'b1~first-0.15');
  // the ghost: a copy of 'in' tips over as one rigid column (each cell stays upright) and slides up
  // to lie along row 1, 0.4 over 0.5 ... 0.3 over −1.0
  const ghost = mv.ghost;
  const G0 = [IN_CX, MCY], G1 = [MCX, LANE_T + CH / 2], GV = [330, 270];   // centre path: a curve via GV
  const LAY = 'b1~first', LAY_D = 1.15;
  S.add(ch07Ignore(ghost.cells, LAY_D + 0.05), LAY);
  S.add(ch07Fade(ghost.cells, 0, 0.85, { d: 0.22 }), LAY);
  S.add(ch07Fade(ghost.cells, 0.85, 1, { d: 0.25 }), S.t(LAY) + LAY_D - 0.2);
  S.add(ch07Drive(LAY_D, k => {
    const kr = Math.min(1, k * 1.3), th = -Math.PI / 2 * kr;      // the turn leads the slide
    const pitch = PY + (PX - PY) * kr;
    const u = 1 - k;
    const cx = u * u * G0[0] + 2 * u * k * GV[0] + k * k * G1[0];
    const cy = u * u * G0[1] + 2 * u * k * GV[1] + k * k * G1[1];
    ghost.cells.forEach((c, j) => {
      const d = (j - 2) * pitch;
      const px = cx - d * Math.sin(th), py = cy + d * Math.cos(th);
      const dx = px - c.cx, dy = py - c.cy;
      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) c.removeAttribute('transform');
      else c.setAttribute('transform', `translate(${dx.toFixed(2)},${dy.toFixed(2)})`);
    });
  }, 'power2.inOut'), LAY);
  S.add(mv.input.flash('all', { tone: 'white', d: 0.45, stagger: 0.05, peak: 0.7 }), LAY);

  // 'multiply each pair': five amber products, 0.25 s apart; the counter ticks to 5
  S.add(mv.multiply(0, { stagger: 0.25 }), 'b1~multiply-0.15');

  // ---------------------------------------------------------------- b2: add the products; 0.5 is out[0]
  // running total 0, 0.2, −0.1, −0.1, 0.8, 0.5 (0.5 s apart); the last step lands just before 'zero'
  S.add(mv.accumulate(0, { stagger: 0.5 }), 'b2~Add-0.3');
  S.add(mv.emit(0), 'b2~zero-0.05');
  S.add(mv.output.flash(0, { tone: 'white', d: 0.5, peak: 0.8 }), 'b2~first-0.05');

  // ---------------------------------------------------------------- b3: every row does the same
  S.add(ch07Fade(wLabel, 1, 0, { d: 0.4, ease: 'power2.in' }), 'b3-0.3');
  // three outline copies of the input drop from the lane onto rows 2, 3 and 4 ...
  const copies = [1, 2, 3].map(i => {
    const g = S.g();
    for (let j = 0; j < 5; j++) S.rect({ x: X0 + j * PX - 3, y: Y0 + i * PY - 3, w: CW + 6, h: CH + 6, r: 11, stroke: 'struct', sw: 2.5, strokeOpacity: 0.95 }, g);
    ch07Hide(g);
    return Object.assign(g, { row: i });
  });
  copies.forEach((g, n) => {
    const at = S.t('b3~Every-0.05') + n * 0.08;
    S.add(ch07Fade(g, 0, 1, { d: 0.5, ease: 'power2.inOut', dy0: LANE_T - (Y0 + g.row * PY), dy1: 0 }), at);
    S.add(ch07Ignore(g, 0.55), at);
  });
  // ... and all three run the same move together: amber flashes in parallel, totals into out[1..3]
  S.add(mv.pulse([1, 2, 3], { speed: 0.9, drops: false }), 'b3~row+0.12');
  S.add(ch07Fade(copies, 1, 0, { d: 0.4 }), 'b3~filling+0.15');
  S.add(mv.output.sweep({ stagger: 0.08 }), 'b3~output-0.1');

  // 'the multiply-and-add from the very start': row 1 framed again; the chapter-one picture, top left
  S.add(mv.focus(0, { dim: 1, d: 0.4 }), 'b3~multiply-0.15');
  const inset = S.g();
  {
    const IX = 112, IY = 120, IW = 660, IH = 248, RY = k => IY + 74 + 36 * k;
    S.rect({ x: IX, y: IY, w: IW, h: IH, r: 18, fill: '#0c1326', filter: 'url(#shadow)' }, inset);
    S.rect({ x: IX, y: IY, w: IW, h: IH, r: 18, fill: 'url(#card-neutral)', stroke: 'neutral', strokeOpacity: 0.5, sw: 1.5 }, inset);
    S.text('one row = this', { x: IX + 24, y: IY + 32, size: 26, weight: 650, color: 'ink' }, inset);
    const box = (x, y, w, h, tone, text, o = {}) => {
      S.rect({ x, y, w, h, r: o.r ?? 7, fill: '#0c1326' }, inset);
      S.rect({ x, y, w, h, r: o.r ?? 7, fill: `url(#card-${tone})`, stroke: tone, strokeOpacity: 0.7, sw: o.sw ?? 1.5 }, inset);
      if (text) return S.text(text, { x: x + w / 2, y: y + h / 2 + 1, size: o.size ?? 24, anchor: 'middle', family: o.family ?? 'mono', weight: o.weight ?? 500, color: o.color ?? 'ink' }, inset);
      return null;
    };
    // chapter one's example: inputs 2, 1, 5, 1, 1 times the file's first five weights; 0.26 − 0.7 + 0.1 + 1.44 − 0.3 = 0.8
    const XS = [2, 1, 5, 1, 1], WS = ['0.13', '-0.7', '0.02', '1.44', '-0.3'];
    const AY = RY(2);
    XS.forEach((v, k) => {
      const y = RY(k);
      box(136, y - 15, 48, 30, 'struct', String(v));
      S.text('×', { x: 200, y, size: 24, anchor: 'middle', color: 'compute', weight: 600 }, inset);
      box(216, y - 15, 92, 30, 'struct', libNum(WS[k]), { color: WS[k].startsWith('-') ? 'violet' : 'ink' });
      S.line({ x1: 318, y1: y, x2: 408, y2: AY + (y - AY) * 0.25, stroke: 'compute', sw: 2, strokeOpacity: 0.55 }, inset);
    });
    box(416, AY - 28, 184, 56, 'compute', 'add them up', { family: 'sans', weight: 600, r: 10, sw: 2 });
    S.arrow({ x1: 610, y1: AY, x2: 640, y2: AY, color: 'muted', sw: 2.5, head: 9 }, inset);
    inset.out = S.g(null, inset);
    Object.assign(inset.out, { cx: 688, cy: AY });
    S.rect({ x: 648, y: AY - 24, w: 80, h: 48, r: 9, fill: '#0c1326' }, inset.out);
    S.rect({ x: 648, y: AY - 24, w: 80, h: 48, r: 9, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.9, sw: 2 }, inset.out);
    S.text('0.8', { x: 688, y: AY + 1, size: 26, anchor: 'middle', family: 'mono', weight: 600 }, inset.out);
    S.text('one output', { x: 688, y: AY + 50, size: 24, anchor: 'middle', color: 'muted', weight: 550 }, inset);
  }
  ch07Hide(inset);
  S.add(ch07Fade(inset, 0, 1, { d: 0.6, dy0: 14, dy1: 0 }), 'b3~from-0.25');
  pulseAt([inset.out], 'b3~start-0.05', { amp: 0.12, d: 0.5 });

  // ---------------------------------------------------------------- b4: twenty weights, each used once
  S.add(ch07Fade(inset, 1, 0, { d: 0.4, ease: 'power2.in' }), 'b4~Twenty-0.25');
  S.add(mv.unfocus({ d: 0.4 }), 'b4~Twenty-0.1');
  S.add(ch07Fade(ghost, 1, 0, { d: 0.5 }), 'b4~Twenty');
  // the counter slides to the top centre and grows (1.5×)
  const CB = { x: C_X + C_W / 2, y: C_Y + C_LH / 2 };
  S.xset(cHold, { ox: CB.x, oy: CB.y });
  S.add(fx.xform(cHold, { x: 960 - CB.x, y: 206 - CB.y, s: 1.5 }, { d: 0.9, ease: 'power3.inOut' }), 'b4~Twenty-0.1');
  // each line pulses as it is said
  mv.counterEls.forEach((ce, n) => Object.assign(ce.g, { cx: C_X + C_W / 2, cy: C_Y + n * C_LH }));
  pulseAt([mv.counterEls[0].g], 'b4~twenty#2-0.05', { amp: 0.08, d: 0.55 });
  pulseAt([mv.counterEls[1].g], 'b4~twenty#3-0.05', { amp: 0.08, d: 0.55 });

  // 'used exactly once': every tile flashes amber once, in reading order, and keeps an amber outline
  const ONCE = 'b4~used-0.2', ST = 0.1;
  S.add(mv.flashAll({ stagger: ST, d: 0.45 }), ONCE);
  const marks = S.g();
  mv.cells.forEach((c, i) => {
    const m = S.rect({ x: c.x - 3, y: c.y - 3, w: CW + 6, h: CH + 6, r: 11, stroke: 'compute', sw: 2.5, strokeOpacity: 0.9 }, marks);
    ch07Hide(m);
    S.add(ch07Fade(m, 0, 0.85, { d: 0.25 }), S.t(ONCE) + i * ST + 0.12);
  });
  const useLabel = S.text([{ t: 'each weight: ' }, { t: '1 multiply + 1 add', c: 'compute' }],
    { x: MCX, y: mv.laneY, size: 32, anchor: 'middle', color: 'muted', weight: 600 });
  ch07Hide(useLabel);
  S.add(ch07Fade(useLabel, 0, 1, { d: 0.5, dy0: 10, dy1: 0 }), 'b4~once+0.2');
  pulseAt(mv.counterEls.map(ce => ce.g), 'b4~operation-0.05', { amp: 0.06, d: 0.55 });

  // ---------------------------------------------------------------- b5: scaled up
  S.add(ch07Fade([cHold, useLabel, marks], 1, 0, { d: 0.4, ease: 'power2.in' }), 'b5~Scaled-0.3');
  // the camera: (X0, Y0) ends at screen (290, 330) at 0.16 ×
  const CS = 0.16, SX0 = 290, SY0 = 330;
  const camX = X0 - (SX0 - 960) / CS, camY = Y0 - (SY0 - 540) / CS;
  const TX = 960 - camX * CS, TY = 540 - camY * CS;        // the camera's final translate
  const scr = (wx, wy) => [TX + CS * wx, TY + CS * wy];    // world -> screen at the end
  const NC = 38, NR = 80;                                  // the vast grid: 38 columns on screen, rows off the bottom
  const GW = NC * PX - GAP;
  const OUT_X1 = X0 + GW + 150;                            // where 'out' ends up (same 150 gap)
  const OUT_S0 = OUT_X, OUT_S1 = scr(OUT_X1, 0)[0];        // its screen x, before and after
  const BOT_S0 = Y0 + WH, BOT_S1 = 1300;                   // the grid's bottom edge on screen, before and after
  const PB = 'b5~Scaled-0.1', PB_D = 1.6, PB_EASE = 'power2.inOut';

  // tiles shaped like the real cells (rounded, r 9), one path per column (no <pattern>: see the guide)
  const tile = (x, y, w = CW, h = CH, r = 9) => `M${x + r},${y}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 ${-r},${r}h${-(w - 2 * r)}a${r},${r} 0 0 1 ${-r},${-r}v${-(h - 2 * r)}a${r},${r} 0 0 1 ${r},${-r}z`;
  const clip = S.el('clipPath', { id: 'ch07s02-grow' }, S.layers.back);
  const clipR = S.rect({ x: -20000, y: Y0 - 400, w: 60000, h: 400 + WH }, clip);
  const field = S.g({ 'data-audit': 'ignore', 'clip-path': 'url(#ch07s02-grow)' }, S.layers.back);
  const colPaths = [];
  for (let c = 0; c < NC; c++) {
    let d = '';
    for (let r = c < 5 ? 4 : 0; r < NR; r++) d += tile(X0 + c * PX, Y0 + r * PY);
    const p = S.path({ d, fill: 'struct', fillOpacity: 0.2, stroke: 'struct', strokeOpacity: 0.42, sw: 1.5 }, field);
    if (c >= 5) p.style.opacity = 0;
    colPaths.push(p);
  }
  // 'in' and 'out' stretch into long columns (same pitch as the rows)
  let dIn = '', dOut = '';
  for (let k = 5; k < NR; k++) dIn += tile(IN_CX - CW / 2, IN_T + k * PY);
  for (let r = 4; r < NR; r++) dOut += tile(OUT_X, Y0 + r * PY);
  // drawn like the real cells (a dim fill and a brighter edge), the edge kept at ~1.6 px on screen
  const extIn = S.path({ d: dIn, fill: 'struct', fillOpacity: 0.2, stroke: 'struct', strokeOpacity: 0.6, sw: 1.6 }, field);
  const outExt = S.g(null, field);
  const extOut = S.path({ d: dOut, fill: 'struct', fillOpacity: 0.2, stroke: 'struct', strokeOpacity: 0.6, sw: 1.6 }, outExt);
  // the amber wave (b5): bands of five rows
  const NB = 16, waveBands = [];
  for (let b = 0; b < NB; b++) {
    let d = '';
    for (let r = b * 5; r < b * 5 + 5; r++) for (let c = 0; c < NC; c++) d += tile(X0 + c * PX, Y0 + r * PY);
    const p = S.path({ d, fill: 'compute', fillOpacity: 0.7 }, field);
    p.style.opacity = 0; p.style.visibility = 'hidden';
    waveBands.push(p);
  }
  // our 4 × 5 keeps a blue outline: the corner of the big one
  const ring = S.rect({ x: X0 - 10, y: Y0 - 10, w: WW + 20, h: WH + 20, r: 12, stroke: 'struct', sw: 2 });
  ring.setAttribute('data-audit', 'ignore');
  ch07Hide(ring);

  S.add(ch07Ignore([mv, times, equals, ghost]), PB);
  S.add(ch07Fade([times, equals, mv.input.labelEl, mv.output.labelEl], 1, 0, { d: 0.4, ease: 'power2.in' }), PB);
  S.add(fx.cam({ x: camX, y: camY, scale: CS, d: PB_D, ease: PB_EASE }), PB);
  const moved = [mv.output, equals, outExt];
  S.add(ch07Drive(PB_D, e => {
    const s = 1 + (CS - 1) * e, tx = TX * e, ty = TY * e;
    // 'out' slides steadily on screen; its world x follows, and the columns it has passed appear
    const wx = (OUT_S0 + (OUT_S1 - OUT_S0) * e - tx) / s;
    const dx = wx - OUT_X;
    moved.forEach(m => (Math.abs(dx) < 0.01 ? m.removeAttribute('transform') : m.setAttribute('transform', `translate(${dx.toFixed(2)},0)`)));
    for (let c = 5; c < NC; c++) {
      const v = Math.max(0, Math.min(1, (wx - (X0 + c * PX + CW + 20)) / 100));
      colPaths[c].style.opacity = v;
    }
    // rows grow downward: the bottom edge descends steadily on screen, off the frame
    const sb = BOT_S0 + (BOT_S1 - BOT_S0) * e;
    clipR.setAttribute('height', (400 + (sb - ty) / s - Y0).toFixed(2));
    const rv = Math.max(0, Math.min(1, (e - 0.55) / 0.4));
    ring.style.opacity = rv;
    ring.style.visibility = rv > 0.001 ? 'inherit' : 'hidden';
    ring.setAttribute('stroke-width', (2.5 / s).toFixed(2));
    [extIn, extOut].forEach(x => x.setAttribute('stroke-width', (1.6 / s).toFixed(2)));
    colPaths.forEach(x => x.setAttribute('stroke-width', (1.5 / s).toFixed(2)));
  }, PB_EASE), PB);

  // HUD labels at the end of the move: 'in', 'out', and '8,192' along the top edge
  const hudLabels = S.g(null, S.hud);
  const [inSx, inSy] = scr(IN_CX, IN_T), [outSx] = scr(OUT_X1 + CW / 2, 0);
  const gL = SX0, gR = scr(X0 + GW, 0)[0];
  S.text('in', { x: inSx, y: inSy - 30, size: 28, anchor: 'middle', color: 'muted', weight: 600 }, hudLabels);
  S.text('out', { x: outSx, y: SY0 - 30, size: 28, anchor: 'middle', color: 'muted', weight: 600 }, hudLabels);
  const yb = SY0 - 14;
  S.path({ d: `M${gL},${yb} l0,-12 L${gR},${yb - 12} l0,12`, stroke: 'muted', sw: 2.5, strokeOpacity: 0.85 }, hudLabels);
  S.text('8,192', { x: (gL + gR) / 2, y: yb - 40, size: 32, anchor: 'middle', family: 'mono', weight: 600, color: 'ink' }, hudLabels);
  ch07Hide(hudLabels);
  S.add(ch07Fade(hudLabels, 0, 1, { d: 0.5 }), S.t(PB) + PB_D - 0.25);

  // 'only heavy operation': a tall amber bar rises at the right ...
  const BASE = 850, BAR_TOP = 340, BW = 110;
  const barA = { cx: 1440 }, barB = { cx: 1700 };
  const bars = S.g(null, S.hud);
  const aBar = S.rect({ x: barA.cx - BW / 2, y: BASE, w: BW, h: 0.001, r: 6, fill: 'url(#solid-compute)' }, bars);
  const aLbl = S.text('vector × matrix', { x: barA.cx, y: BASE + 42, size: 28, anchor: 'middle', color: 'ink', weight: 600 }, bars);
  ch07Hide([aBar, aLbl]);
  S.add(ch07Fade(aBar, 0, 1, { d: 0.15 }), 'b5~only-0.1');
  S.add(ch07Drive(0.9, k => {
    const h = Math.max(0.001, (BASE - BAR_TOP) * k);
    aBar.setAttribute('y', (BASE - h).toFixed(2));
    aBar.setAttribute('height', h.toFixed(2));
  }, 'power2.out'), 'b5~only-0.1');
  S.add(ch07Fade(aLbl, 0, 1, { d: 0.45, dy0: 10, dy1: 0 }), 'b5~only+0.1');
  // ... while an amber wave runs down the grid (the same multiply-and-add, row after row)
  const SWEEP = 1.6, PULSE = 0.5;
  S.add(mv.flashCells('all', { tone: 'compute', d: 0.5, hold: 0.05 }), 'b5~heavy');
  S.add(ch07Drive(SWEEP + PULSE, p => {
    const T = p * (SWEEP + PULSE);
    waveBands.forEach((w, b) => {
      const u = (T - b / NB * SWEEP) / PULSE;
      const v = u > 0 && u < 1 ? 0.75 * Math.sin(Math.PI * u) : 0;
      w.style.opacity = v;
      w.style.visibility = v > 0.001 ? 'inherit' : 'hidden';
    });
  }), 'b5~heavy');
  // 'rounding error': a hairline grey bar beside it
  const bBar = S.rect({ x: barB.cx - BW / 2, y: BASE - 3, w: BW, h: 3, r: 1, fill: 'muted' }, bars);
  const bLbl = S.text('everything else', { x: barB.cx, y: BASE + 42, size: 28, anchor: 'middle', color: 'muted', weight: 600 }, bars);
  const note = S.text('schematic', { x: (barA.cx + barB.cx) / 2, y: BASE + 94, size: 24, anchor: 'middle', color: 'faint', weight: 500, italic: true }, bars);
  ch07Hide([bBar, bLbl, note]);
  S.add(ch07Fade(bBar, 0, 1, { d: 0.35 }), 'b5~rounding-0.15');
  S.add(ch07Fade(bLbl, 0, 1, { d: 0.45, dy0: 10, dy1: 0 }), 'b5~rounding');
  S.add(ch07Fade(note, 0, 1, { d: 0.45 }), 'b5~rounding+0.45');
});
