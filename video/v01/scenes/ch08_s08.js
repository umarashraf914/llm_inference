/* ch08_s08 · where the parameters live, and how many (figs 104, 100)
   b1  header 'Every layer: weight matrices'; a layer slab opens into a panel; four dashed slots, then W_Q, W_K,
       W_V, W_O pop in as named ('combine' under W_O); a blended-result strip passes through W_O and joins a
       slice of the blue stream at a '+'.
   b2  bottom row: 'first' (widening icon): a thin strip goes in, a wide one (28 cells against 8: 3.5 x) comes
       out; 'second' (narrowing icon): wide in, thin out. '6 matrices per layer', tag 'classic design'. On
       'a gate' second slides right and a valve tile slides in beside first; a widening badge; the thin
       strip goes through first and (a copy, over the top) through the gate; first's wide strip hops beside
       the gate's grey openness strip and the cells the gate holds shut dim; the result goes through second,
       thin again, and joins the stream. '7 per layer'; brackets '4 attention', '3 feed-forward'.
   b3  the panel becomes a ledger, 'Matrices in the whole model': each tile shrinks into the first of a row
       of 80 tiny tiles; 'attention 4 x 80 = 320', 'feed-forward 3 x 80 = 240', total 560, 'none shared'.
       A line rises beside it, 'grows with depth'. A pipe along the bottom; coral copies of every row drop
       into it and a counter runs 0 to 560, 'matrices read per token'.
   b4  the ledger slides away; 80 blocks, one per layer, each its own texture; a small blue tower echo,
       'same kind of step'; the blocks take coral outlines one after another: '80 different sets to fetch'.
   Layout: panel x 120-1300, y 190-970 (ledger: to 910); top row y 290, bottom row y 640, tiles 150; stream
   slice x 1150-1230; counter and chart x 1360-1800; pipe y 1000. */
V.scene('ch08_s08', S => {
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = n => gsap.parseEase(n);
  const EIO = E('power2.inOut');
  const clock = (a, b, fn) => S.add(ch08Drive(b - a, k => fn(a + k * (b - a))), a);
  const whole = fn => { fn(0); clock(0, S.duration, fn); };
  const fade = (els, a, b, at, d = 0.45, stagger = 0) => S.add(ch08Fade(els, a, b, { d, stagger }), at);
  const BYTES = S.tone('bytes');

  // keyframed transform + opacity, one painter per element over the whole scene (seek-safe).
  // keys: [[t, {x, y, o, s, arc, e}], ...]; x/y offsets, s scale about (ox, oy), arc lifts the path midway.
  const stateAt = (keys, t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, b] = keys[i];
      if (t < t1) {
        const [t0, a] = keys[i - 1], u = (b.e ? E(b.e) : EIO)(cl((t - t0) / (t1 - t0)));
        return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) - (b.arc || 0) * Math.sin(Math.PI * u), o: lerp(a.o, b.o, u), s: lerp(a.s ?? 1, b.s ?? 1, u) };
      }
    }
    return keys[keys.length - 1][1];
  };
  const track = (el, keys, ox = 0, oy = 0) => whole(t => {
    const st = stateAt(keys, t), s = st.s ?? 1;
    el.setAttribute('transform', `translate(${(ox + st.x).toFixed(1)},${(oy + st.y).toFixed(1)}) scale(${s.toFixed(4)}) translate(${-ox},${-oy})`);
    el.setAttribute('opacity', st.o.toFixed(3));
    el.style.visibility = st.o > 0.002 ? 'inherit' : 'hidden';
  });
  const K = (t, x, y, o, more = {}) => [t, { x, y, o, ...more }];

  const PX = 120, PY = 190, PW = 1180, PH = 780;
  const TY = 290, TXS = [240, 460, 680, 900], TS = 150, FY = 640, FC = FY + TS / 2;
  const BX = 1150, BW = 80;

  // ================================================================ header and panel
  const hdA = S.text('Every layer: weight matrices', { x: 960, y: 130, size: 46, weight: 700, family: 'display', anchor: 'middle', color: 'ink' });
  ch08Hide(hdA);
  fade(hdA, 0, 1, 0.3, 0.5);
  const led = S.g();                         // everything that later slides away as the ledger
  const panel = S.rect({ x: PX, y: PY, w: PW, h: PH, r: 18, fill: '#0b1224', stroke: 'struct', strokeOpacity: 0.45, sw: 2 }, led);
  const slabY = 590;
  const tOpen0 = T('b1~layer') - 0.05, tOpen1 = tOpen0 + 0.8, tFold0 = T('b3') + 0.1, tFold1 = tFold0 + 0.6;
  whole(t => {
    // a thin layer slab (fades in on 'one'), opens into the panel; in b3 the bottom pulls up to 910
    const kO = EIO(cl((t - tOpen0) / (tOpen1 - tOpen0))), kF = EIO(cl((t - tFold0) / (tFold1 - tFold0)));
    const top = lerp(slabY - 15, PY, kO), bot = lerp(lerp(slabY + 15, PY + PH, kO), 910, kF);
    panel.setAttribute('y', top.toFixed(1)); panel.setAttribute('height', (bot - top).toFixed(1));
    panel.setAttribute('opacity', cl((t - (T('b1~one') - 0.15)) / 0.3).toFixed(3));
  });
  const pTag = S.text('one layer', { x: PX + 28, y: PY + 30, size: 24, weight: 650, color: 'muted' }, led);
  ch08Hide(pTag);
  fade(pTag, 0, 1, tOpen1 - 0.2, 0.4);

  // strips (vectors) live under the tiles, so a strip passing through a tile is hidden behind it
  const colLayer = S.g(null, led);
  const CW = 20, CHH = 4.4, CG = 0.9;
  const mkCol = (n, seed, tone = 'struct', vals) => {
    const g = S.g(null, colLayer), rnd = S.rand(seed), H = n * CHH + (n - 1) * CG;
    g.cells = []; g.vals = [];
    for (let i = 0; i < n; i++) {
      const v = vals ? vals[i] : 0.3 + 0.7 * rnd();
      g.cells.push(S.rect({ x: -CW / 2, y: -H / 2 + i * (CHH + CG), w: CW, h: CHH, r: 1, fill: tone, fillOpacity: +v.toFixed(2) }, g));
      g.vals.push(v);
    }
    g.setAttribute('data-audit', 'ignore');
    return g;
  };

  // ================================================================ b1: attention's four
  const tileW = (x, y, seed, labels) => {
    const w = S.g(null, led);
    const tile = ch08WeightTile(S, { x, y, w: TS, h: TS, seed, cols: 8, rows: 8 }, w);
    if (labels) labels(w);
    Object.assign(w, { tile, cx: x + TS / 2, cy: y + TS / 2 });
    return w;
  };
  const slots = TXS.map(x => { const r = S.rect({ x, y: TY, w: TS, h: TS, r: 14, fill: 'none', stroke: 'white', strokeOpacity: 0.3, sw: 2, dash: '8 7' }, led); return r; });
  ch08Hide(slots);
  fade(slots, 0, 1, T('b1~four') - 0.1, 0.35, 0.08);
  fade(slots, 1, 0, T('b1~combine') + 0.4, 0.3);
  const NAMES = ['Q', 'K', 'V', 'O'], CUES = ['b1~query', 'b1~key', 'b1~value', 'b1~combine'];
  const att = NAMES.map((n, i) => tileW(TXS[i], TY, 31 + 7 * i, w => {
    w.nameEl = ch08W(S, n, { x: TXS[i] + TS / 2, y: TY + TS + 32, size: 40 }, w);
    if (n === 'O') w.sub = S.text('combine', { x: TXS[i] + TS / 2, y: TY + TS + 82, size: 24, weight: 600, anchor: 'middle', color: 'muted' }, w);
  }));
  const popKeys = (t, more = []) => [K(t - 0.05, 0, 0, 0, { s: 0.86 }), K(t + 0.4, 0, 0, 1, { s: 1, e: 'back.out(1.6)' }), ...more];
  const attKeys = att.map((w, i) => popKeys(T(CUES[i]) - 0.1));
  // W_O's name glows on 'written W O'
  const oGlow = S.rect({ x: TXS[3] + 40, y: TY + TS + 10, w: 70, h: 46, r: 10, fill: 'compute', opacity: 0 }, att[3]);
  att[3].insertBefore(oGlow, att[3].nameEl);
  oGlow.setAttribute('data-audit', 'ignore');
  S.add(gsap.fromTo(oGlow, { attr: { opacity: 0 } }, { attr: { opacity: 0.28 }, duration: 0.3, yoyo: true, repeat: 1, immediateRender: false }), T('b1~written') + 0.3);

  // the stream slice at the panel's right edge, with W_O's '+'
  const bandG = S.g(null, led);
  const band = S.rect({ x: BX, y: 262, w: BW, h: 688, fill: 'struct', fillOpacity: 0.26, stroke: 'struct', strokeOpacity: 0.6, sw: 2 }, bandG);
  band.setAttribute('data-audit', 'ignore');
  const bandHi = S.rect({ x: BX, y: 262, w: BW, h: TY + TS / 2 - 14 - 262, fill: 'struct', opacity: 0 }, bandG);
  bandHi.setAttribute('data-audit', 'ignore');
  const bandTag = S.text('the stream', { x: BX + BW / 2, y: 238, size: 22, weight: 650, anchor: 'middle', color: 'struct' }, bandG);
  const plus = (y, g) => { S.circle({ x: BX, y, r: 14, fill: '#0c1326', stroke: 'ink', sw: 2.5 }, g); S.text('+', { x: BX, y: y + 1, size: 22, weight: 800, anchor: 'middle', color: 'ink' }, g); };
  const plusO = S.g(null, led); plus(TY + TS / 2, plusO);
  const arrO = S.arrow({ x1: TXS[3] + TS + 4, y1: TY + TS / 2, x2: BX - 18, y2: TY + TS / 2, color: 'struct', sw: 3 }, led);
  ch08Hide([band, bandTag, plusO, arrO]);
  const tBl = T('b1~blended');
  fade([band, bandTag], 0, 1, tBl - 0.5, 0.4);
  fade(arrO, 0, 1, T('b1~into') - 0.1, 0.3);
  fade(plusO, 0, 1, T("b1~stream's") - 0.15, 0.3);
  S.add(gsap.fromTo(bandHi, { attr: { opacity: 0 } }, { attr: { opacity: 0.14 }, duration: 0.5, immediateRender: false }), T('b1~update') - 0.1);
  // the blended result: a blue strip in the gap before W_O, through it, out and along to the '+'
  const blend = mkCol(8, 501);
  const bY = TY + TS / 2, oX = TXS[3] + TS / 2;
  track(blend, [K(tBl - 0.15, 865, bY, 0), K(tBl + 0.15, 865, bY, 1), K(tBl + 0.55, oX, bY, 1),
    K(tBl + 0.75, oX, bY, 1), K(tBl + 1.15, 1095, bY, 1), K(tBl + 1.75, BX - 6, bY, 0, { s: 0.6 })]);

  // ================================================================ b2: feed-forward
  const ffLabel = (w, cx, icon, word) => {
    w.icon = S.icon(icon, { x: cx, y: FY + TS + 34, size: 38, color: 'muted' }, w);
    w.word = S.text(word, { x: cx, y: FY + TS + 74, size: 22, weight: 600, anchor: 'middle', color: 'muted' }, w);
  };
  const first = tileW(TXS[0], FY, 71, w => ffLabel(w, TXS[0] + TS / 2, 'ph:arrows-out-line-vertical-bold', 'first'));
  const second = tileW(TXS[1], FY, 83, w => ffLabel(w, TXS[1] + TS / 2, 'ph:arrows-in-line-vertical-bold', 'second'));
  const gate = tileW(TXS[1], FY, 97, w => ffLabel(w, TXS[1] + TS / 2, 'ms:valve', 'gate'));
  // the gate's own widening badge (top edge)
  const badge = S.g(null, gate);
  S.circle({ x: TXS[1] + TS / 2, y: FY, r: 21, fill: '#0c1326', stroke: 'muted', sw: 2 }, badge);
  S.icon('ph:arrows-out-line-vertical-bold', { x: TXS[1] + TS / 2, y: FY, size: 26, color: 'ink' }, badge);
  ch08Hide(badge);
  fade(badge, 0, 1, T('b2~second') + 0.1, 0.35);

  const tW1 = T('b2~widening'), tN1 = T('b2~narrowing'), tG = T('b2~gate'), tW2 = T('b2~second');
  const SHIFT = TXS[2] - TXS[1];
  const ffKeys = {
    first: popKeys(tW1 - 0.15),
    second: popKeys(tN1 - 0.15, [K(tG - 0.05, 0, 0, 1), K(tG + 0.55, SHIFT, 0, 1)]),
    gate: [K(tG + 0.2, 0, 70, 0), K(tG + 0.8, 0, 0, 1)],
  };
  const fX = TXS[0] + TS / 2, gapA = TXS[0] + TS + 35, sX0 = TXS[1] + TS / 2, gapB = TXS[1] + TS + 35, sX1 = sX0 + SHIFT;
  const inX = PX + 82;
  // classic: thin in -> first -> wide -> second -> thin
  const thin1 = mkCol(8, 611), wide1 = mkCol(28, 612), out1 = mkCol(8, 613);
  track(thin1, [K(tW1 - 0.3, inX, FC, 0), K(tW1, inX, FC, 1), K(tW1 + 0.45, fX, FC, 1), K(tW1 + 0.5, fX, FC, 0)]);
  track(wide1, [K(tW1 + 0.34, fX, FC, 0), K(tW1 + 0.35, fX, FC, 1), K(tW1 + 0.8, gapA, FC, 1), K(tN1 + 0.15, gapA, FC, 1), K(tN1 + 0.6, sX0, FC, 1), K(tN1 + 0.65, sX0, FC, 0)]);
  track(out1, [K(tN1 + 0.49, sX0, FC, 0), K(tN1 + 0.5, sX0, FC, 1), K(tN1 + 0.95, gapB, FC, 1), K(tG - 0.35, gapB, FC, 1), K(tG - 0.05, gapB, FC, 0)]);
  // gated: thin in -> first (wide) and, over the top, -> gate (grey openness, wide)
  const gRnd = S.rand(733), gVals = Array.from({ length: 28 }, () => { const r = gRnd(); return r < 0.4 ? 0.12 + 0.2 * r : 0.55 + 0.45 * r; });
  const thin2 = mkCol(8, 621), thin2b = mkCol(8, 621), wide2 = mkCol(28, 622), gOut = mkCol(28, 0, 'ink', gVals), out2 = mkCol(8, 623);
  const tIn2 = tW2 + 0.1;
  track(thin2, [K(tIn2 - 0.3, inX, FC, 0), K(tIn2, inX, FC, 1), K(tIn2 + 0.45, fX, FC, 1), K(tIn2 + 0.5, fX, FC, 0)]);
  track(thin2b, [K(tIn2 - 0.3, inX, FC, 0), K(tIn2, inX, FC, 1), K(tIn2 + 0.8, sX0, FC, 1, { arc: 150 }), K(tIn2 + 0.85, sX0, FC, 0)]);
  // 'how much': the gate's strip steps left, first's wide strip hops over the gate and lands beside it
  const tHow = T('b2~how'), tPass = T('b2~passes');
  const gL = gapB - 13, gR = gapB + 13;
  track(wide2, [K(tIn2 + 0.34, fX, FC, 0), K(tIn2 + 0.35, fX, FC, 1), K(tIn2 + 0.8, gapA, FC, 1), K(tHow - 0.1, gapA, FC, 1), K(tHow + 0.55, gR, FC, 1, { arc: 150 }),
    K(tPass - 0.05, gR, FC, 1), K(tPass + 0.35, sX1, FC, 1), K(tPass + 0.4, sX1, FC, 0)]);
  track(gOut, [K(tIn2 + 0.74, sX0, FC, 0), K(tIn2 + 0.75, sX0, FC, 1), K(tIn2 + 1.2, gapB, FC, 1), K(tHow - 0.1, gapB, FC, 1), K(tHow + 0.3, gL, FC, 1),
    K(tPass - 0.2, gL, FC, 1), K(tPass + 0.15, gL, FC, 0)]);
  // the shut cells of first's strip dim, one after another, with an amber touch (the multiply)
  const tShut = T('b2~each#2') - 0.1;
  wide2.cells.forEach((c, i) => {
    if (gVals[i] >= 0.4) return;
    const t0 = tShut + i * 0.025, v = wide2.vals[i];
    whole(t => { const k = cl((t - t0) / 0.3); c.setAttribute('fill-opacity', lerp(v, 0.1, k).toFixed(3)); });
  });
  const mulFlash = S.rect({ x: gL - CW / 2 - 6, y: FC - 80, w: gR - gL + CW + 12, h: 160, r: 6, fill: 'compute', opacity: 0 }, colLayer);
  mulFlash.setAttribute('data-audit', 'ignore');
  S.add(gsap.fromTo(mulFlash, { attr: { opacity: 0 } }, { attr: { opacity: 0.14 }, duration: 0.35, yoyo: true, repeat: 1, immediateRender: false }), tShut);
  // through second, thin again, and on to the stream
  const tOut = tPass + 0.25;
  track(out2, [K(tOut - 0.01, sX1, FC, 0), K(tOut, sX1, FC, 1), K(tOut + 0.4, sX1 + 110, FC, 1), K(tOut + 0.95, BX - 6, FC, 0, { s: 0.6 })]);
  const plusF = S.g(null, led); plus(FC, plusF);
  const arrF = S.arrow({ x1: TXS[2] + TS + 4, y1: FC, x2: BX - 18, y2: FC, color: 'struct', sw: 3 }, led);
  led.insertBefore(arrF, colLayer);
  led.insertBefore(arrO, colLayer);
  ch08Hide([plusF, arrF]);
  fade(arrF, 0, 1, tOut + 0.1, 0.3);
  fade(plusF, 0, 1, tOut + 0.6, 0.3);

  // the count at the right: 6, then 7
  const cnt = S.g();
  const n6 = S.text('6', { x: 1450, y: 540, size: 150, weight: 750, family: 'display', anchor: 'middle', color: 'ink' }, cnt);
  const n7 = S.text('7', { x: 1450, y: 540, size: 150, weight: 750, family: 'display', anchor: 'middle', color: 'ink' }, cnt);
  const cM = S.text('matrices', { x: 1530, y: 512, size: 34, weight: 650, color: 'ink' }, cnt);
  const cP = S.text('per layer', { x: 1530, y: 558, size: 30, weight: 550, color: 'muted' }, cnt);
  const classic = S.pill('classic design', { x: 1560, y: 660, tone: 'neutral', size: 24, h: 44 }, cnt);
  ch08Hide([n6, n7, cM, cP, classic]);
  const tSix = T('b2~six'), tSeven = T('b2~seven');
  fade([n6, cM, cP], 0, 1, tSix - 0.1, 0.4);
  fade(classic, 0, 1, tSix + 0.3, 0.4);
  fade(n6, 1, 0, tSeven - 0.1, 0.3);
  fade(n7, 0, 1, tSeven - 0.05, 0.35);
  fade(classic, 1, 0, tSeven + 0.1, 0.4);
  // brackets
  const brA = S.bracket({ x1: TXS[0], x2: TXS[3] + TS, y: TY - 16, up: true, label: '4 attention', tone: 'muted', size: 26 }, led);
  const brF = S.bracket({ x1: TXS[0], x2: TXS[2] + TS, y: FY + TS + 104, label: '3 feed-forward', tone: 'muted', size: 26 }, led);
  ch08Hide([brA, brF]);
  fade([brA, brF], 0, 1, tSeven + 0.15, 0.4, 0.15);

  // ================================================================ b3: the ledger
  const tB3 = T('b3') - 0.15;
  const hdB = S.text('Matrices in the whole model', { x: 960, y: 130, size: 46, weight: 700, family: 'display', anchor: 'middle', color: 'ink' });
  ch08Hide(hdB);
  fade(hdA, 1, 0, tB3, 0.35);
  fade(hdB, 0, 1, tB3 + 0.3, 0.45);
  const strays = [pTag, bandG, plusO, plusF, arrO, arrF, brA, brF, badge, cnt,
    ...att.flatMap(w => [w.nameEl, w.sub]), ...[first, second, gate].flatMap(w => [w.icon, w.word])];
  fade(strays, 1, 0, tB3, 0.35);
  // rows
  const RY = [285, 345, 405, 465], FRY = [600, 660, 720], SX0 = 400, PITCH = 9.75, TW8 = 7.5, NT = 80;
  const rowG = S.g(null, led);
  const rowLbl = [];
  NAMES.forEach((n, i) => {
    const g = S.g(null, rowG);
    ch08W(S, n, { x: 205, y: RY[i], size: 36 }, g);
    S.text('× 80', { x: 310, y: RY[i], size: 26, weight: 600, family: 'mono', color: 'muted' }, g);
    rowLbl.push(g);
  });
  [['ph:arrows-out-line-vertical-bold', 'first'], ['ms:valve', 'gate'], ['ph:arrows-in-line-vertical-bold', 'second']].forEach(([ic, w], i) => {
    const g = S.g(null, rowG);
    S.icon(ic, { x: 180, y: FRY[i], size: 30, color: 'muted' }, g);
    S.text(w, { x: 204, y: FRY[i], size: 24, weight: 600, color: 'muted' }, g);
    S.text('× 80', { x: 310, y: FRY[i], size: 26, weight: 600, family: 'mono', color: 'muted' }, g);
    rowLbl.push(g);
  });
  ch08Hide(rowLbl);
  const tRows = tFold0 + 0.25;
  fade(rowLbl, 0, 1, tRows, 0.35, 0.05);
  // the 80 tiny tiles of each row: three shades in one path each, revealed left to right by a clip
  const defs = S.el('defs', {});
  const allY = [...RY, ...FRY];
  const strips = allY.map((y, r) => {
    const g = S.g(null, rowG), rnd = S.rand(900 + r), bk = ['', '', ''];
    for (let i = 0; i < NT; i++) { const v = rnd(), k = v < 0.45 ? 0 : v < 0.8 ? 1 : 2; bk[k] += `M${(SX0 + i * PITCH).toFixed(2)},${y - 13}h${TW8}v26h${-TW8}Z`; }
    const cp = S.el('clipPath', { id: `ch08s08-row${r}` }, defs);
    const cr = S.el('rect', { x: SX0 - 2, y: y - 20, width: 0, height: 40 }, cp);
    g.setAttribute('clip-path', `url(#ch08s08-row${r})`);
    bk.forEach((d, k) => S.path({ d, fill: 'struct', fillOpacity: [0.35, 0.55, 0.85][k] }, g));
    g.setAttribute('data-audit', 'ignore');
    const t0 = tRows + 0.2 + 0.05 * r;
    whole(t => { const k = E('power1.inOut')(cl((t - t0) / 0.8)); cr.setAttribute('width', (k > 0 ? NT * PITCH * k + 4 : 0).toFixed(1)); });
    Object.assign(g, { y, bk });
    return g;
  });
  // each big tile shrinks into the first tiny tile of its row
  const order = [...att, first, gate, second];
  const shrink = (w, r) => {
    const tx = SX0 + TW8 / 2 - w.cx, ty = allY[r] - w.cy, t0 = tFold0 + 0.03 * r;
    return [K(t0, 0, 0, 1), K(t0 + 0.5, tx, ty, 1, { s: 0.18 }), K(t0 + 0.75, tx, ty, 0, { s: 0.18 })];
  };
  att.forEach((w, i) => track(w, [...attKeys[i], ...shrink(w, i)], w.cx, w.cy));
  track(first, [...ffKeys.first, ...shrink(first, 4)], first.cx, first.cy);
  track(gate, [...ffKeys.gate, ...shrink(gate, 5)], gate.cx, gate.cy);
  // second sits SHIFT to the right by then; its shrink starts from there
  const sh2 = shrink(second, 6).map(([t, st]) => [t, { ...st, x: st.x === 0 ? SHIFT : st.x }]);
  track(second, [...ffKeys.second, ...sh2], second.cx, second.cy);
  // subtotals and total
  const subA = S.text('attention   4 × 80 = 320', { x: 1180, y: 525, size: 26, weight: 650, anchor: 'end', color: 'ink' }, led);
  const subF = S.text('feed-forward   3 × 80 = 240', { x: 1180, y: 780, size: 26, weight: 650, anchor: 'end', color: 'ink' }, led);
  const rule = S.path({ d: `M160,815 H1180`, stroke: 'white', strokeOpacity: 0.25, sw: 2 }, led);
  const totL = S.text('total', { x: 170, y: 862, size: 30, weight: 700, color: 'ink' }, led);
  const totN = S.text('0', { x: 1180, y: 862, size: 44, weight: 700, family: 'mono', anchor: 'end', color: 'ink' }, led);
  const shared = S.pill('none shared', { x: 960, y: 862, tone: 'neutral', size: 24, h: 44 }, led);
  ch08Hide([subA, subF, rule, totL, totN, shared]);
  fade(subA, 0, 1, tRows + 0.9, 0.35);
  fade(subF, 0, 1, tRows + 1.1, 0.35);
  fade([rule, totL, totN], 0, 1, T('b3~five') - 0.35, 0.3);
  const tTot = T('b3~five');
  whole(t => { totN.textContent = String(Math.round(560 * E('power2.out')(cl((t - tTot) / 0.9)))); });
  fade(shared, 0, 1, T('b3~none') - 0.1, 0.35);
  // the depth line
  const chart = S.g();
  const CO = [1400, 640];
  S.path({ d: `M${CO[0]},${CO[1] - 340} V${CO[1]} H${CO[0] + 380}`, stroke: 'white', strokeOpacity: 0.35, sw: 2.5 }, chart);
  S.text('parameters', { x: CO[0], y: CO[1] - 362, size: 22, weight: 600, color: 'muted' }, chart);
  S.text('layers', { x: CO[0] + 190, y: CO[1] + 32, size: 22, weight: 600, anchor: 'middle', color: 'muted' }, chart);
  const gl = S.path({ d: `M${CO[0]},${CO[1]} L${CO[0] + 360},${CO[1] - 310}`, stroke: 'struct', sw: 4 }, chart);
  const gLen = Math.hypot(360, 310);
  gl.setAttribute('stroke-dasharray', `${gLen} ${gLen}`);
  const glDots = [0.25, 0.5, 0.75, 1].map(k => S.circle({ x: CO[0] + 360 * k, y: CO[1] - 310 * k, r: 6, fill: 'struct' }, chart));
  const gTag = S.text('grows with depth', { x: CO[0] + 190, y: CO[1] + 80, size: 28, weight: 700, anchor: 'middle', color: 'struct' }, chart);
  ch08Hide([chart, gTag]);
  const tGr = T('b3~grows');
  fade(chart, 0, 1, tGr - 0.4, 0.4);
  whole(t => {
    const k = E('power1.inOut')(cl((t - tGr) / 1.1));
    gl.setAttribute('stroke-dashoffset', (gLen * (1 - k)).toFixed(1));
    glDots.forEach((d, i) => d.setAttribute('opacity', cl((k - (i + 1) * 0.25 + 0.05) / 0.05).toFixed(2)));
  });
  fade(gTag, 0, 1, T('b3~proportion') - 0.1, 0.4);
  // the pipe, its coral particles, and the per-token count
  const PY0 = 1000, PX0 = 300, PX1 = 1620;
  const pipe = S.g();
  S.rect({ x: PX0, y: PY0 - 15, w: PX1 - PX0, h: 30, r: 15, fill: '#140c14', stroke: 'bytes', strokeOpacity: 0.55, sw: 2 }, pipe);
  S.text('memory', { x: PX0 - 20, y: PY0, size: 24, weight: 650, anchor: 'end', color: 'muted' }, pipe);
  S.icon('ph:cpu-duotone', { x: PX1 + 40, y: PY0, size: 40, color: 'muted' }, pipe);
  S.text('chip', { x: PX1 + 70, y: PY0, size: 24, weight: 650, color: 'muted' }, pipe);
  const parts = S.g(null, pipe);
  parts.setAttribute('data-audit', 'ignore');
  const NP = 46, pr = S.rand(4242), pDots = Array.from({ length: NP }, () => ({ ph: pr(), dy: (pr() - 0.5) * 14, el: S.circle({ x: PX0, y: PY0, r: 4.5, fill: 'bytes', opacity: 0 }, parts) }));
  ch08Hide(pipe);
  const tEv = T('b3~every');
  fade(pipe, 0, 1, tEv - 0.3, 0.45);
  whole(t => {
    const on = cl((t - tEv) / 0.6);
    pDots.forEach(p => {
      const u = ((t * 0.32 + p.ph) % 1);
      p.el.setAttribute('cx', (PX0 + 20 + u * (PX1 - PX0 - 40)).toFixed(1));
      p.el.setAttribute('cy', (PY0 + p.dy).toFixed(1));
      p.el.setAttribute('opacity', (on * 0.9 * Math.min(1, u * 8, (1 - u) * 8)).toFixed(3));
    });
  });
  // coral copies of every row drop into the pipe
  const tRd = T('b3~reads') - 0.1;
  allY.forEach((y, r) => {
    const g = S.g(null, pipe);
    strips[r].bk.forEach(d => S.path({ d, fill: 'bytes', fillOpacity: 0.85 }, g));
    g.setAttribute('data-audit', 'ignore');
    const t0 = tRd + 0.08 * r;
    whole(t => {
      const k = cl((t - t0) / 0.7), e = E('power2.in')(k);
      const sx = lerp(1, 0.3, e), dy = (PY0 - y) * e, cx = SX0 + NT * PITCH / 2;
      g.setAttribute('transform', `translate(${cx},${(y + dy).toFixed(1)}) scale(${sx.toFixed(3)},${lerp(1, 0.4, e).toFixed(3)}) translate(${-cx},${-y})`);
      g.setAttribute('opacity', (k <= 0 || k >= 1 ? 0 : Math.min(1, k * 6, (1 - k) * 4)).toFixed(3));
    });
  });
  const rdN = S.text('0', { x: 1590, y: 870, size: 54, weight: 700, family: 'mono', anchor: 'middle', color: 'bytes' });
  const rdL = S.text('matrices read per token', { x: 1590, y: 926, size: 24, weight: 600, anchor: 'middle', color: 'muted' });
  ch08Hide([rdN, rdL]);
  fade([rdN, rdL], 0, 1, tRd - 0.2, 0.35);
  whole(t => { rdN.textContent = String(Math.round(560 * cl((t - tRd - 0.3) / 1.1))); });

  // ================================================================ b4: 80 different sets
  const tB4 = T('b4') - 0.15;
  // the panel is alone until the count comes in on its right (b2, 'six'): until then it sits LX1 right, centred
  const LX1 = 250, tSlide = T('b2~six') - 0.9;
  const ledX = t => LX1 * (1 - E('power2.inOut')(cl((t - tSlide) / 0.8))) - 1400 * E('power2.in')(cl((t - tB4) / 0.8));
  whole(t => led.setAttribute('transform', `translate(${ledX(t).toFixed(1)},0)`));
  S.add(ch08Ignore(led, 0.85), tB4);
  fade(led, 1, 0, tB4 + 0.8, 0.1);
  fade([chart, gTag, rdN, rdL], 1, 0, tB4, 0.4);
  const GX = 360, GY = 250, BWd = 84, BHt = 58, GAP = 12;
  const grid = S.g();
  const blocks = Array.from({ length: 80 }, (_, i) => {
    const c = i % 10, r = Math.floor(i / 10), x = GX + c * (BWd + GAP), y = GY + r * (BHt + GAP);
    const g = S.g(null, grid);
    S.rect({ x, y, w: BWd, h: BHt, r: 8, fill: '#0c1326' }, g);
    S.rect({ x, y, w: BWd, h: BHt, r: 8, fill: 'url(#card-neutral)', stroke: 'white', strokeOpacity: 0.22, sw: 1.5 }, g);
    ch08Texture(S, { x: x + 7, y: y + 7, w: BWd - 14, h: BHt - 14, cols: 7, rows: 4, seed: 300 + 17 * i }, g);
    g.ring = S.rect({ x: x - 1, y: y - 1, w: BWd + 2, h: BHt + 2, r: 9, fill: 'none', stroke: 'bytes', sw: 2.5, opacity: 0 }, g);
    return g;
  });
  grid.setAttribute('data-audit', 'ignore');
  const gCap = S.text("one block = one layer's 7 matrices", { x: GX + (10 * BWd + 9 * GAP) / 2, y: GY - 34, size: 24, weight: 600, anchor: 'middle', color: 'muted' });
  ch08Hide(gCap);
  const tGrid = tB4 + 0.5;
  whole(t => blocks.forEach((b, i) => {
    const o = cl((t - (tGrid + 0.011 * i)) / 0.3);
    b.setAttribute('opacity', o.toFixed(3)); b.style.visibility = o > 0.002 ? 'inherit' : 'hidden';
  }));
  fade(gCap, 0, 1, tGrid + 0.4, 0.4);
  const tNot = T('b4~not') - 0.05, tEnd = T('b4~fetch') + 0.2;
  whole(t => blocks.forEach((b, i) => {
    const t0 = tNot + (tEnd - tNot) * i / 80;
    b.ring.setAttribute('opacity', (0.9 * cl((t - t0) / 0.2)).toFixed(3));
  }));
  // a small blue echo of the tower: the same kind of step
  const echoG = S.g();
  ch08Tower(S, { x: 1600, y: 740, w: 180, h: 360, seed: 8 }, echoG);
  const echoT = S.text('same kind of step', { x: 1600, y: 790, size: 26, weight: 650, anchor: 'middle', color: 'struct' }, echoG);
  ch08Hide(echoG);
  fade(echoG, 0, 1, T('b4~same') - 0.2, 0.45);
  const cap = S.text('80 different sets to fetch', { x: GX + (10 * BWd + 9 * GAP) / 2, y: 880, size: 42, weight: 750, family: 'display', anchor: 'middle', color: 'bytes' });
  ch08Hide(cap);
  fade(cap, 0, 1, T('b4~different') - 0.15, 0.45);
});
