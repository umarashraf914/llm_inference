/* ch08_s01 · a layer, from outside (figs 91, 96)
   One continuous shot. Five token columns stand in the bottom band. One slab of a faint stack swells into
   the panel 'One transformer layer'. The columns rise through it: through attention, where threads cross
   sideways between them, then through the feed-forward network, one box per column and nothing crossing;
   they leave through the top edge as five vectors of the same shape, richer. Then the camera pulls back:
   the panel shrinks into a slab, its out-bars plug into the next slab, and the stack builds to 80. */
V.scene('ch08_s01', S => {
  const { fx } = S;
  const TOK = CH08.tokens;

  // ---------------------------------------------------------------- layout
  const P = { x: 250, y: 282, w: 1080, h: 400 };                 // the layer panel
  const PB = P.y + P.h;                                         // 682
  const Z0 = P.x + 450, ZW = 600;                               // the column zone inside the panel (700..1300)
  const CX = TOK.map((t, i) => Z0 + ZW / 10 + i * ZW / 5);      // 760 880 1000 1120 1240
  const FFN = { x: P.x + 18, y: P.y + 66, w: P.w - 36, h: 148 };
  const ATT = { x: P.x + 18, y: P.y + 228, w: P.w - 36, h: 148 };
  const SEP = { ffn: -12, att: 14 };                            // b2: the halves ease apart (gap 14 -> 40)
  const GAP_Y = (FFN.y + FFN.h + SEP.ffn + ATT.y + SEP.att) / 2; // the middle of the opened gap
  const TX = P.x + 44;                                          // sub-panel titles
  const BAR = { n: 8, cw: 38, ch: 13, gap: 2.5 };
  const BH = ch08VecH(BAR.n, BAR.ch, BAR.gap);                  // 121.5
  const IN_T = PB - 10;                                         // in-bars tuck 10 px under the lower edge
  const PILL_Y = IN_T + BH + 8 + 26;                            // the pill centre (pill 52 tall)
  const OUT_B = P.y - 12;                                       // out-bars stand 12 px above the top edge
  const LIFT = 40;                                              // the columns start this much lower
  const TR = { w: 24, t: P.y + 6, b: PB - 6 };                  // each column's track through the panel
  const RX = P.x + P.w + 40;                                    // the right-hand label column
  const ATT_MID = ATT.y + ATT.h / 2, FFN_MID = FFN.y + FFN.h / 2;
  // the tower (b4) stands under the column zone: the camera pulls straight back. Its out-bars shrink to
  // exactly fill the gap between two slabs, so a slab is the column zone shrunk by s4.
  const TW = { X: Z0 + ZW / 2, Y: 880, T: 30, P: 104 };
  const s4 = (TW.P - TW.T) / BH;                                // 0.609
  const TWW = ZW * s4;                                          // 365.4
  const X0 = TW.X - TWW / 2;                                    // 817.3
  const slabTop = k => TW.Y - TW.T - (k - 1) * TW.P;            // top edge of slab k while 4 or fewer show
  const GHOST_X = 1580;                                         // b1: the faint stack, in the right third

  // a rising gradient for the column fills: bright at the leading (top) edge
  const defs = S.el('defs', {});
  const grad = S.el('linearGradient', { id: 'ch08s01-rise', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  [[0, 0.95], [0.18, 0.45], [1, 0.28]].forEach(([off, op]) => S.el('stop', { offset: off, 'stop-color': S.tone('struct'), 'stop-opacity': op }, grad));

  // ---------------------------------------------------------------- the ghost stack (b1)
  const ghostG = S.g();
  const ghost = ch08Tower(S, { x: GHOST_X, y: TW.Y, w: TWW }, ghostG);
  ch08Hide(ghostG);
  const gG = ghost.geom();
  const slabAttr = (x, yc, w, t) => ({ x, y: yc - t / 2, width: w, height: t, rx: Math.min(t / 2, 6), ry: Math.min(t / 2, 6) });
  const ghostSlab = slabAttr(gG.x0, ghost.slabY(40), gG.w, gG.t);
  const panelAttr = { x: P.x, y: P.y, width: P.w, height: P.h, rx: 22, ry: 22 };
  // slab 1 in the layer's own coordinates, once the pull-back has scaled it by s4 (column zone -> slab width)
  const slab1Local = { x: Z0, y: PB - TW.T / s4, width: ZW, height: TW.T / s4, rx: 6 / s4, ry: 6 / s4 };

  // the layer and everything that rides with it: b4's camera pull-back scales this group
  const world = S.g();
  // ---------------------------------------------------------------- out-bars (behind the panel: they leave through its top edge)
  const outAll = S.g(null, world);                               // rides down onto slab 1 in b4
  const outCols = TOK.map((t, i) => {
    const h = S.g(null, outAll);
    h.vec = ch08Vec(S, { token: t, round: 0, ...BAR, x: CX[i], y: OUT_B - BH / 2 }, h);
    ch08Hide(h);
    return h;
  });

  // ---------------------------------------------------------------- token columns (pills + in-bars), bottom band
  const colAll = S.g(null, world);
  const cols = TOK.map((t, i) => ch08Column(S, { token: t, x: CX[i], y: PILL_Y, ...BAR, hidden: true }, colAll));
  // the grey '8,192 numbers' tag on the first bar
  const tagG = S.g(null, colAll);
  const c0 = cols[0];
  const tbx = c0.barL - 12;
  S.path({ d: `M${tbx + 9},${c0.barT} H${tbx} V${c0.barB} H${tbx + 9}`, stroke: 'muted', sw: 2.5, strokeOpacity: 0.85 }, tagG);
  S.text(`${S.fmt.int(CH08.WIDTH)} numbers`, { x: tbx - 14, y: (c0.barT + c0.barB) / 2, size: 28, anchor: 'end', color: 'muted', weight: 550 }, tagG);
  ch08Hide(tagG);
  S.set(colAll, { y: LIFT }, 0);

  // ---------------------------------------------------------------- the panel card (starts as one slab of the ghost stack)
  const card = S.g(null, world);
  const cardBase = S.rect({ ...P, r: 22, fill: '#0c1326', filter: 'url(#shadow)' }, card);
  const cardBg = S.rect({ ...P, r: 22, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.65, sw: 2 }, card);
  [cardBase, cardBg].forEach(r => Object.entries(ghostSlab).forEach(([k, v]) => r.setAttribute(k, v)));
  ch08Hide(card);

  // everything inside the panel (shrinks and fades in b4)
  const content = S.g(null, world);
  const header = S.text('One transformer layer', { x: P.x + 32, y: P.y + 36, size: 30, weight: 650, color: 'ink' }, content);
  ch08Hide(header);
  // b1 'two things': two dashed slots
  const slots = [ATT, FFN].map(R => S.rect({ ...R, r: 16, stroke: 'struct', strokeOpacity: 0.5, sw: 2, dash: '9 8' }, content));
  ch08Hide(slots);

  // sub-panels: an outer group that moves apart in b2, an inner one that enters
  const subPanel = (R, parent) => {
    const g = S.g(null, parent);
    g.fill = S.rect({ ...R, r: 16, fill: '#0c1326' }, g);
    g.tint = S.rect({ ...R, r: 16, fill: 'url(#card-struct)' }, g);
    g.edge = S.rect({ ...R, r: 16, stroke: 'struct', strokeOpacity: 0.7, sw: 2 }, g);
    ch08Hide([g.fill, g.tint]);
    S.set(g.edge, { autoAlpha: 0 }, 0);
    return g;
  };
  const ffnBgO = S.g(null, content), attBgO = S.g(null, content);
  const ffnBg = subPanel(FFN, ffnBgO), attBg = subPanel(ATT, attBgO);

  // the glowing seam in the gap the separation opens (b2): a soft blur and a crisp core
  const seam = S.g(null, content);
  seam.setAttribute('data-audit', 'ignore');
  const SX0 = Z0 + 6, SX1 = FFN.x + FFN.w - 14;
  const seamF = S.el('filter', { id: 'ch08s01-seam', filterUnits: 'userSpaceOnUse', x: SX0 - 40, y: GAP_Y - 40, width: SX1 - SX0 + 80, height: 80 }, defs);
  S.el('feGaussianBlur', { stdDeviation: 7 }, seamF);
  S.rect({ x: SX0, y: GAP_Y - 6, w: SX1 - SX0, h: 12, r: 6, fill: 'struct', fillOpacity: 0.95, filter: 'url(#ch08s01-seam)' }, seam);
  S.rect({ x: SX0 + 10, y: GAP_Y - 1.25, w: SX1 - SX0 - 20, h: 2.5, r: 1.25, fill: '#cfe0ff', fillOpacity: 0.75 }, seam);
  ch08Hide(seam);

  // the column tracks and their rising fills
  const trackG = S.g(null, content);
  const fills = CX.map(x => {
    S.rect({ x: x - TR.w / 2, y: TR.t, w: TR.w, h: TR.b - TR.t, r: 8, fill: 'struct', fillOpacity: 0.07, stroke: 'struct', strokeOpacity: 0.28, sw: 1.5 }, trackG);
    return S.rect({ x: x - TR.w / 2, y: TR.b, w: TR.w, h: 0, r: 8, fill: 'url(#ch08s01-rise)' }, trackG);
  });
  ch08Hide(trackG);
  const rise = (i, y0, y1, d, ease = 'power1.inOut') => gsap.fromTo(fills[i], { attr: { y: y0, height: TR.b - y0 } },
    { attr: { y: y1, height: TR.b - y1 }, duration: d, ease, immediateRender: false });

  // attention foreground: threads, title
  const attFgO = S.g(null, content), attFg = S.g(null, attFgO);
  const YB = ATT.y + ATT.h - 22;                                // the threads' base line
  const arcs = [];
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) {
    const apex = 16 + 20 * (j - i);
    const a = S.path({ d: `M${CX[i]},${YB} Q${(CX[i] + CX[j]) / 2},${YB - 2 * apex} ${CX[j]},${YB}`, stroke: 'struct', sw: 2.2, strokeOpacity: 0.6 }, attFg);
    Object.assign(a, { i, j });
    arcs.push(a);
  }
  S.set(arcs, { autoAlpha: 0 }, 0);
  const feet = CX.map(x => S.circle({ x, y: YB, r: 5, fill: 'struct' }, attFg));
  ch08Hide(feet);
  // 'it' lights where cat's information lands
  const itGlow = S.rect({ x: CX[4] - TR.w / 2, y: ATT.y + 10, w: TR.w, h: ATT.h - 20, r: 8, fill: '#ffffff' }, attFg);
  ch08Hide(itGlow);
  const attTitle = S.text('Attention', { x: TX, y: ATT.y + 44, size: 34, weight: 650, color: 'ink' }, attFg);
  const attSub = [
    S.text('moves information', { x: TX, y: ATT.y + 84, size: 26, color: 'muted', weight: 500 }, attFg),
    S.text('between tokens', { x: TX, y: ATT.y + 116, size: 26, color: 'muted', weight: 500 }, attFg),
  ];
  ch08Hide([attTitle, ...attSub]);

  // feed-forward foreground: one small box per column (the same weights in each), title
  const ffnFgO = S.g(null, content), ffnFg = S.g(null, ffnFgO);
  const BX = { w: 62, h: 50 };
  const boxes = CX.map(x => {
    const g = S.g(null, ffnFg);
    const R = { x: x - BX.w / 2, y: FFN_MID - BX.h / 2, w: BX.w, h: BX.h, r: 10 };
    S.rect({ ...R, fill: '#0c1326' }, g);
    g.bg = S.rect({ ...R, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.75, sw: 2 }, g);
    ch08Texture(S, { x: R.x + 9, y: R.y + 9, w: R.w - 18, h: R.h - 18, cols: 5, rows: 3, seed: 21, ops: [0.18, 0.36, 0.6] }, g);
    g.lit = S.rect({ ...R, fill: 'compute', fillOpacity: 0.5, stroke: 'compute', sw: 2.5 }, g);
    ch08Hide(g.lit);
    return g;
  });
  S.set(boxes, { autoAlpha: 0 }, 0);
  const ffnTitle = S.text('Feed-forward network', { x: TX, y: FFN_MID - 18, size: 34, weight: 650, color: 'ink' }, ffnFg);
  const ffnSub = S.text('each token alone', { x: TX, y: FFN_MID + 24, size: 26, color: 'muted', weight: 500 }, ffnFg);
  ch08Hide([ffnTitle, ffnSub]);

  // b3: 'mix, then transform' in the gap the separation opened, arrow pointing from attention up to feed-forward
  const mixG = S.g(null, content);
  const mixArrow = S.arrow({ x1: TX + 8, y1: GAP_Y + 13, x2: TX + 8, y2: GAP_Y - 13, color: 'muted', sw: 2.5, head: 8 }, mixG);
  const mixText = S.text('mix, then transform', { x: TX + 26, y: GAP_Y, size: 26, color: 'muted', weight: 550 }, mixG);
  ch08Hide(mixG);

  // the pulse dots that carry information along the threads
  const dotG = S.g(null, attFg);
  const mkDot = () => {
    const d = S.g(null, dotG);
    S.circle({ x: 0, y: 0, r: 30, fill: 'url(#pglow-struct)' }, d);
    S.circle({ x: 0, y: 0, r: 13, fill: 'struct', fillOpacity: 0.45 }, d);
    S.circle({ x: 0, y: 0, r: 8, fill: '#ffffff' }, d);
    ch08Hide(d);
    return d;
  };
  const travel = (dot, path, d, ease = 'power1.inOut') => {
    const L = path.getTotalLength();
    return ch08Drive(d, p => {
      const pt = path.getPointAtLength(p * L);
      dot.setAttribute('transform', `translate(${pt.x.toFixed(2)},${pt.y.toFixed(2)})`);
      const on = p > 0 && p < 1;
      dot.style.opacity = on ? Math.min(1, p * 8, (1 - p) * 8) : 0;
      dot.style.visibility = on ? 'inherit' : 'hidden';
    }, ease);
  };

  // ---------------------------------------------------------------- right-hand labels
  const leader = (y, parent) => S.line({ x1: P.x + P.w + 8, y1: y, x2: RX - 10, y2: y, stroke: 'muted', sw: 2, strokeOpacity: 0.6 }, parent);
  const onlyTag = S.g();
  leader(ATT_MID, onlyTag);
  S.pill('the only cross-token step', { x: RX, y: ATT_MID, anchor: 'start', h: 50, size: 27, tone: 'struct', style: 'outline' }, onlyTag);
  ch08Hide(onlyTag);
  const mixesL = S.g(), oneL = S.g();
  leader(ATT_MID + SEP.att, mixesL);
  S.text('mixes across positions', { x: RX, y: ATT_MID + SEP.att, size: 30, weight: 550, color: 'ink' }, mixesL);
  leader(FFN_MID + SEP.ffn, oneL);
  S.text('one position at a time', { x: RX, y: FFN_MID + SEP.ffn, size: 30, weight: 550, color: 'ink' }, oneL);
  ch08Hide([mixesL, oneL]);

  // b3: the in/out brackets, '=' between them
  const bx = CX[4] + BAR.cw / 2 + 12;
  const measureG = (t, b, label) => {
    const g = S.g();
    S.path({ d: `M${bx - 9},${t} H${bx} V${b} H${bx - 9}`, stroke: 'muted', sw: 2.5, strokeOpacity: 0.85 }, g);
    g.label = S.text(label, { x: bx + 16, y: (t + b) / 2, size: 30, weight: 550, color: 'ink' }, g);
    g.cy = (t + b) / 2;
    ch08Hide(g);
    return g;
  };
  const inLbl = `vectors in: 5 × ${S.fmt.int(CH08.WIDTH)}`, outLbl = `vectors out: 5 × ${S.fmt.int(CH08.WIDTH)}`;
  const outM = measureG(OUT_B - BH, OUT_B, outLbl);
  const inM = measureG(PB + 2, IN_T + BH, inLbl);
  const lw = Math.max(S.measure(inLbl, { size: 30, weight: 550 }), S.measure(outLbl, { size: 30, weight: 550 }));
  const eqG = S.g();
  const eq = S.text('=', { x: bx + 16 + lw / 2, y: (outM.cy + inM.cy) / 2, size: 96, weight: 500, anchor: 'middle', color: 'ink', family: 'display' }, eqG);
  ch08Hide(eqG);
  const take = S.takeaway('same count, same width', { tone: 'struct' });
  ch08Hide(take);

  // ---------------------------------------------------------------- the tower (b4)
  const towerG = S.g();
  const tower = ch08Tower(S, { x: TW.X, y: TW.Y, w: TWW, shown: 1, hidden: true }, towerG);
  // the lib's texture is cut for 80 thin slabs; while 4 thick slabs show, each carries its own grid instead
  tower.slabs.slice(0, 4).forEach(sl => ch08Hide(sl.tex));
  const slabTex = [1, 2, 3, 4].map(k => ch08Texture(S, { x: X0 + 8, y: slabTop(k) + 5, w: TWW - 16, h: TW.T - 10, cols: 22, rows: 2, seed: 100 + 13 * k, ops: [0.10, 0.22, 0.40] }, tower.slabs[k - 1].liftG));
  const plugG = S.g(), joinG = S.g();
  // the outputs of slabs 2, 3 and 4: the same strips shrunk, a round richer each time
  const joins = [2, 3, 4].map(k => {
    const g = S.g(null, joinG);
    TOK.forEach((t, i) => ch08Vec(S, { token: t, round: k, n: BAR.n, cw: BAR.cw * s4, ch: BAR.ch * s4, gap: BAR.gap * s4, x: X0 + s4 * (CX[i] - Z0), y: slabTop(k) - (TW.P - TW.T) / 2 }, g));
    S.set(g, { autoAlpha: 0 }, 0);
    return g;
  });
  joinG.setAttribute('data-audit', 'ignore');
  // a plug at each join, turned upright so it plugs into the slab above
  const plugs = [1, 2, 3].map(k => {
    const x = X0 + TWW + 34, y = slabTop(k) - (TW.P - TW.T) / 2;
    const o = S.g(null, plugG), r = S.g({ transform: `rotate(-45 ${x} ${y})` }, o);
    S.icon('ph:plug-duotone', { x, y, size: 40, color: 'struct' }, r);
    return o;
  });
  S.set(plugs, { autoAlpha: 0 }, 0);

  // while the stack is short, slab 1 says what it is
  const oneLayerL = S.text('one layer', { x: X0 - 22, y: TW.Y - TW.T / 2, size: 28, anchor: 'end', color: 'muted', weight: 550 });
  ch08Hide(oneLayerL);
  // the depth bracket on the tower's left, which extends as the stack grows
  const DB = { x: X0 - 24, top4: slabTop(4), top80: TW.Y - 620 };
  const depthG = S.g();
  const dLine = S.line({ x1: DB.x, y1: TW.Y, x2: DB.x, y2: TW.Y, stroke: 'muted', sw: 2.5 }, depthG);
  const dBot = S.line({ x1: DB.x, y1: TW.Y, x2: DB.x + 12, y2: TW.Y, stroke: 'muted', sw: 2.5 }, depthG);
  const dTop = S.line({ x1: DB.x, y1: DB.top4, x2: DB.x + 12, y2: DB.top4, stroke: 'muted', sw: 2.5 }, depthG);
  const depthL = S.text('depth', { x: DB.x - 20, y: 640, size: 36, weight: 600, anchor: 'end', color: 'ink' }, depthG);
  ch08Hide([dLine, dBot, dTop, depthL]);
  const rangeTxt = '60 to 100+ in large models';
  const rangeW = S.measure(rangeTxt, { size: 26, weight: 600 }) + 44;
  const range = S.pill(rangeTxt, { x: DB.x - 20 - rangeW, y: 704, anchor: 'start', w: rangeW, h: 46, size: 26, tone: 'neutral', style: 'outline', color: 'muted' });
  ch08Hide(range);

  // the layer count, right of the tower
  const LC = { x: 1500 };
  const counter = S.counter({ x: LC.x, y: 440, size: 132, value: 4, anchor: 'middle', color: 'ink', family: 'mono', weight: 600 });
  const layersL = S.text('layers', { x: LC.x, y: 558, size: 40, anchor: 'middle', color: 'muted', weight: 550 });
  const ownL = S.text('each with its own weights', { x: LC.x, y: 618, size: 30, anchor: 'middle', color: 'muted', weight: 500 });
  ch08Hide([counter, layersL, ownL]);

  // ================================================================ b1: vectors arrive; a slab swells into the layer; attention
  cols.forEach((c, i) => {
    S.add(c.pill.pop({ d: 0.5 }), 0.45 + i * 0.08);
    S.add(c.vec.pop({ stagger: 0.035, from: 'end', d: 0.4 }), 0.6 + i * 0.08);
  });
  S.add(ch08Fade(tagG, 0, 1, { d: 0.5 }), 'b1~enter');

  // 'stack of layers': a faint stack ghosts in on the right; one of its slabs swells into the panel
  S.add(ch08Fade(ghostG, 0, 0.5, { d: 0.5 }), 'b1~stack-0.15');
  S.add(ch08Fade(card, 0, 1, { d: 0.15 }), 'b1~layers-0.05');
  S.add(gsap.fromTo([cardBase, cardBg], { attr: ghostSlab }, { attr: panelAttr, duration: 1.0, ease: 'power3.inOut', immediateRender: false }), 'b1~layers+0.1');
  S.add(ch08Fade(ghostG, 0.5, 0, { d: 0.6, ease: 'power1.in' }), 'b1~layers+0.3');
  S.add(ch08Fade(header, 0, 1, { d: 0.5 }), 'b1~layers+0.8');
  // the columns slide up into the panel's lower edge; their tracks run on through it
  S.add(gsap.fromTo(colAll, { y: LIFT }, { y: 0, duration: 0.7, ease: 'power3.inOut', immediateRender: false }), 'b1~Each+0.1');
  S.add(ch08Fade(trackG, 0, 1, { d: 0.5 }), 'b1~Each+0.5');
  // 'two things': two empty slots
  S.add(ch08Fade(slots, 0, 1, { d: 0.45, stagger: 0.15 }), 'b1~two-0.1');

  // 'First, attention': the lower half draws on, and the columns rise into it
  S.add(ch08Fade([attBg.fill, attBg.tint], 0, 1, { d: 0.6 }), 'b1~First');
  S.add(fx.draw(attBg.edge, { d: 0.9 }), 'b1~First');
  S.add(ch08Fade(slots[0], 1, 0, { d: 0.3 }), 'b1~First+0.5');
  S.add(ch08Fade(attTitle, 0, 1, { d: 0.5 }), 'b1~attention-0.1');
  CX.forEach((x, i) => S.add(rise(i, TR.b, ATT.y, 0.6), S.t('b1~attention') + 0.15 + i * 0.05));
  S.add(ch08Fade(attSub, 0, 1, { d: 0.5, stagger: 0.15 }), 'b1~moves-0.1');
  // threads cross sideways between the columns
  S.add(ch08Fade(feet, 0, 1, { d: 0.3 }), 'b1~information-0.1');
  S.add(fx.draw(arcs, { d: 0.55, stagger: 0.07 }), 'b1~information');
  // a bright pulse runs from 'cat' to 'it'
  const catIt = arcs.find(a => a.i === 1 && a.j === 4);
  const d0 = mkDot();
  S.add(travel(d0, catIt, 0.8), 'b1~tokens-0.15');
  S.add(gsap.fromTo(catIt, { attr: { 'stroke-opacity': 0.6, 'stroke-width': 2.2 } }, { attr: { 'stroke-opacity': 1, 'stroke-width': 3.5 }, duration: 0.3, yoyo: true, repeat: 1, repeatDelay: 0.3, immediateRender: false }), 'b1~tokens-0.15');
  S.add(ch08Drive(1.0, p => { itGlow.style.visibility = p > 0 ? 'inherit' : 'hidden'; itGlow.style.opacity = p < 0.2 ? p / 0.2 * 0.55 : 0.55 - (p - 0.2) / 0.8 * 0.35; }), 'b1~tokens+0.6');
  // 'the only place': the tag
  S.add(ch08Fade(onlyTag, 0, 1, { d: 0.5 }), 'b1~only-0.1');
  S.add(gsap.fromTo(onlyTag, { x: -24 }, { x: 0, duration: 0.6, ease: 'power3.out', immediateRender: false }), 'b1~only-0.1');
  // 'can change another's': information runs along every thread at once, each earlier token to each later one
  const dots = arcs.map(() => mkDot());
  arcs.forEach((a, k) => S.add(travel(dots[k], a, 0.9), S.t('b1~can') + 0.02 * k));
  S.add(gsap.fromTo(arcs, { attr: { 'stroke-opacity': 0.6 } }, { attr: { 'stroke-opacity': 0.95 }, duration: 0.35, yoyo: true, repeat: 1, repeatDelay: 0.3, immediateRender: false }), 'b1~can');

  // ================================================================ b2: the feed-forward network, each token alone; then apart
  S.add(ch08Fade(tagG, 1, 0, { d: 0.4 }), 'b2-0.1');
  S.add(ch08Fade([ffnBg.fill, ffnBg.tint], 0, 1, { d: 0.6 }), 'b2~feed-0.1');
  S.add(fx.draw(ffnBg.edge, { d: 0.9 }), 'b2~feed-0.1');
  S.add(ch08Fade(slots[1], 1, 0, { d: 0.3 }), 'b2~feed+0.4');
  S.add(ch08Fade(ffnTitle, 0, 1, { d: 0.5 }), 'b2~feed+0.2');
  S.add(fx.pop(boxes, { from: 0.6, d: 0.45, stagger: 0.06 }), 'b2~network-0.1');
  // each column carries on up into its own box; the boxes light one after another; nothing crosses
  CX.forEach((x, i) => {
    const t0 = S.t('b2~transforms') + i * 0.3;
    S.add(rise(i, ATT.y, FFN.y, 0.62, 'none'), t0);
    S.add(ch08Drive(1.0, p => {
      const lit = boxes[i].lit;
      lit.style.visibility = p > 0 && p < 1 ? 'inherit' : 'hidden';
      lit.style.opacity = p < 0.22 ? p / 0.22 : 1 - (p - 0.22) / 0.78;
    }), t0 + 0.18);
  });
  S.add(ch08Fade(ffnSub, 0, 1, { d: 0.5 }), 'b2~each-0.1');
  S.add(ch08Drive(0.6, p => { itGlow.style.opacity = 0.2 * (1 - p); itGlow.style.visibility = p < 1 ? 'inherit' : 'hidden'; }), 'b2~transforms');
  // 'treats these two steps separately': the halves ease apart, a glowing gap between them
  S.add(ch08Fade(onlyTag, 1, 0, { d: 0.4 }), 'b2~treats-0.1');
  S.add(ch08Fade([...attSub, ffnSub], 1, 0, { d: 0.4 }), 'b2~treats');
  S.add(gsap.fromTo([attBgO, attFgO], { y: 0 }, { y: SEP.att, duration: 0.9, ease: 'power2.inOut', immediateRender: false }), 'b2~these');
  S.add(gsap.fromTo([ffnBgO, ffnFgO], { y: 0 }, { y: SEP.ffn, duration: 0.9, ease: 'power2.inOut', immediateRender: false }), 'b2~these');
  // with the subtitles gone, the titles settle to the middle of their halves
  S.add(gsap.fromTo(attTitle, { y: 0 }, { y: ATT.h / 2 - 44, duration: 0.8, ease: 'power2.inOut', immediateRender: false }), 'b2~these+0.1');
  S.add(gsap.fromTo(ffnTitle, { y: 0 }, { y: 18, duration: 0.8, ease: 'power2.inOut', immediateRender: false }), 'b2~these+0.1');
  S.add(ch08Fade(seam, 0, 1, { d: 0.6 }), 'b2~two+0.1');
  S.add(ch08Fade(mixesL, 0, 1, { d: 0.5 }), 'b2~steps');
  S.add(ch08Fade(oneL, 0, 1, { d: 0.5 }), 'b2~separately');

  // ================================================================ b3: one vector out per token, just as wide, better
  S.add(ch08Fade([mixesL, oneL], 1, 0, { d: 0.4 }), 'b3-0.1');
  S.add(ch08Fade(mixG, 0, 1, { d: 0.4 }), 'b3+0.05');
  S.add(fx.drawArrow(mixArrow, { d: 0.4 }), 'b3+0.05');
  S.add(fx.type(mixText, { d: 0.7 }), 'b3+0.15');
  // the columns run on to the top edge and five bars leave through it
  CX.forEach((x, i) => {
    const t = S.t('b3~gives') + 0.08 * i;
    S.add(rise(i, FFN.y, TR.t, 0.3, 'power1.in'), t - 0.25);
    S.add(ch08Fade(outCols[i], 0, 1, { d: 0.15 }), t);
    S.add(gsap.fromTo(outCols[i], { y: BH + 20 }, { y: 0, duration: 0.75, ease: 'power3.out', immediateRender: false }), t);
  });
  S.add(ch08Fade(inM, 0, 1, { d: 0.5 }), 'b3~one-0.1');
  S.add(ch08Fade(outM, 0, 1, { d: 0.5 }), 'b3~per-0.1');
  S.add(ch08Fade(eqG, 0, 1, { d: 0.4 }), 'b3~just');
  S.add(gsap.fromTo(eq, { scale: 0.6, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, ease: 'back.out(2.5)', transformOrigin: '50% 50%', immediateRender: false }), 'b3~just');
  // 'but better': the out-bars take a new, richer pattern
  outCols.forEach((h, i) => S.add(h.vec.reshade({ seed: (ch08Seed(TOK[i]) + 7919) >>> 0, gain: CH08.gain(1) }, { d: 0.6, stagger: 0.03 }), S.t('b3~better') - 0.15 + 0.06 * i));
  S.add(ch08Fade(take, 0, 1, { d: 0.5 }), 'b3~carrying');
  S.add(gsap.fromTo(take, { y: 24 }, { y: 0, duration: 0.6, ease: 'power3.out', immediateRender: false }), 'b3~carrying');

  // ================================================================ b4: same shape, so layers stack; eighty of them
  S.add(fx.pulse(eq, { scale: 1.15, d: 0.5 }), 'b4~Same');
  S.add(ch08Fade([inM, outM, eqG, take], 1, 0, { d: 0.4 }), 'b4~shape');
  // the camera pulls back: the whole layer shrinks (uniformly) until its column zone is a slab's width,
  // its bottom edge on the stack's base line; the words inside fade as they get small
  const pull = S.t('b4~shape') + 0.25, PA = 1.1, PB2 = 0.6;
  S.add(fx.xform(world, { x: X0 - s4 * Z0, y: TW.Y - s4 * PB, s: s4, ox: 0, oy: 0 }, { d: PA, ease: 'power2.inOut' }), pull);
  S.add(ch08Ignore(world, PA), pull);
  S.add(ch08Fade(colAll, 1, 0, { d: 0.4 }), pull);
  S.add(ch08Fade(content, 1, 0, { d: 0.6, ease: 'power1.in' }), pull + 0.4);
  // ... then the emptied panel squashes into the bottom slab, and its out-bars ride down onto it
  S.add(gsap.fromTo([cardBase, cardBg], { attr: panelAttr }, { attr: slab1Local, duration: PB2, ease: 'power2.inOut', immediateRender: false }), pull + PA);
  S.add(fx.xform(outAll, { y: slab1Local.y - OUT_B }, { d: PB2, ease: 'power2.inOut' }), pull + PA);
  S.add(ch08Fade(card, 1, 0, { d: 0.25 }), pull + PA + PB2 - 0.1);
  S.add(ch08Fade(tower.slabs[0].outer, 0, 1, { d: 0.25 }), pull + PA + PB2 - 0.1);
  S.add(ch08Fade(oneLayerL, 0, 1, { d: 0.4 }), pull + PA + PB2 - 0.1);
  S.add(ch08Fade(oneLayerL, 1, 0, { d: 0.3 }), 'b4~depth-0.5');
  // 'feeds the next': slabs slide on, each onto the outputs of the one below; a plug clicks at each join
  const landing = [S.t('b4~feeds') - 0.25, S.t('b4~next') - 0.35, S.t('b4~That') - 0.15];
  landing.forEach((at, n) => {
    const k = n + 2;                                    // the slab arriving
    S.add(tower.grow(k, { d: 0.35 }), at);
    S.add(gsap.fromTo(tower.slabs[k - 1].outer, { y: -44 }, { y: 0, duration: 0.45, ease: 'power3.out', immediateRender: false }), at);
    S.add(fx.pop(plugs[n], { from: 0.3, d: 0.4, ease: 'back.out(3)' }), at + 0.32);
    // the new slab's outputs rise out of its top
    S.add(gsap.fromTo(joins[n], { autoAlpha: 0, scaleY: 0.2, transformOrigin: '50% 100%' },
      { autoAlpha: 1, scaleY: 1, duration: 0.35, ease: 'power2.out', transformOrigin: '50% 100%', immediateRender: false }), at + 0.42);
  });
  // 'depth': a bracket runs up the stack; the usual range
  S.add(ch08Fade([dLine, dBot], 0, 1, { d: 0.15 }), 'b4~depth-0.2');
  S.add(gsap.fromTo(dLine, { attr: { y2: TW.Y } }, { attr: { y2: DB.top4 }, duration: 0.6, ease: 'power2.inOut', immediateRender: false }), 'b4~depth-0.2');
  S.add(ch08Fade(dTop, 0, 1, { d: 0.2 }), 'b4~depth+0.35');
  S.add(ch08Fade(depthL, 0, 1, { d: 0.5 }), 'b4~depth');
  S.add(ch08Fade(range, 0, 1, { d: 0.5 }), 'b4~number');
  S.add(gsap.fromTo(range, { x: -20 }, { x: 0, duration: 0.6, ease: 'power3.out', immediateRender: false }), 'b4~number');
  S.add(ch08Fade([counter, layersL], 0, 1, { d: 0.5 }), 'b4~layers+0.1');
  // 'eighty': the joins give way and the stack fast-forwards to 80, the counter with it
  const ff = S.t('b4~eighty') - 0.1, FD = 1.5;
  S.add(ch08Fade([plugG, joinG, outAll, ...slabTex], 1, 0, { d: 0.3 }), ff - 0.25);
  S.add(tower.grow(CH08.LAYERS, { d: FD, counter, ease: 'power2.inOut' }), ff);
  S.add(ch08Fade(tower.slabs.slice(0, 4).map(sl => sl.tex), 0, 1, { d: 0.8 }), ff + 0.6);
  S.add(gsap.fromTo(dLine, { attr: { y2: DB.top4 } }, { attr: { y2: DB.top80 }, duration: FD, ease: 'power2.inOut', immediateRender: false }), ff);
  S.add(gsap.fromTo(dTop, { attr: { y1: DB.top4, y2: DB.top4 } }, { attr: { y1: DB.top80, y2: DB.top80 }, duration: FD, ease: 'power2.inOut', immediateRender: false }), ff);
  // 'its own weights': every slab flickers to its own texture
  S.add(ch08Fade(ownL, 0, 1, { d: 0.5 }), 'b4~with');
  S.add(tower.shimmer({ d: 1.1, seed: 31 }), 'b4~its');
  // ... and each slab sparks once, at its own moment, so the change reads at this size
  const spark = S.rand(57);
  tower.slabs.forEach(sl => S.add(ch08Drive(0.4, p => {
    sl.ring.style.opacity = p > 0 && p < 1 ? 0.45 * Math.sin(Math.PI * p) : 0;
  }), S.t('b4~its') - 0.1 + spark() * 0.9));
  // 'eighty rounds of refinement': five strips climb the stack and grow richer as they rise
  const climbH = S.g(null, tower.front);
  const mini = { n: 6, cw: 16, ch: 9, gap: 2 };
  const dull = S.g(null, climbH), rich = S.g(null, climbH);
  TOK.forEach((t, i) => {
    const x = s4 * (CX[i] - Z0) - TWW / 2;
    ch08Vec(S, { token: t, round: 0, ...mini, x, y: 0 }, dull);
    ch08Vec(S, { token: t, round: 5, ...mini, x, y: 0 }, rich);
  });
  ch08Hide(rich);
  const CD = 2.3;
  S.add(tower.climb(climbH, { d: CD, tone: 'compute', flashD: 0.28 }), 'b4~eighty#2-0.1');
  S.add(ch08Fade(rich, 0, 1, { d: CD, ease: 'power1.in' }), 'b4~eighty#2-0.1');
});
