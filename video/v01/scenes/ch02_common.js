/* Shared builders for chapter 2. Loaded before every ch02 scene. */

/**
 * The generate-loop panel exactly as ch01_s05 left it: 'text so far' (nine pills), 'run the whole model'
 * (coral box with the 40-tile grid), 'one new token', and the return arrow 'append, go round again'.
 * Full-size geometry: panel x 200–1720, y 300–800. Build into a group you can S.xset / fx.xform.
 * Returns {g, panel, title, boxes{text, model, out}, tiles[], pills[], slots[], retPath, retLbl, retD,
 *   addPill(word) -> pill at the next slot, lightTurn(at, {stagger, hold}) -> schedules one turn of the tiles}.
 */
function ch02Loop(S, o = {}) {
  const g = o.parent || S.g();
  const PNL = { x: 200, y: 300, w: 1520, h: 500 };
  const panel = S.card({ x: PNL.x, y: PNL.y, w: PNL.w, h: PNL.h, tone: 'neutral', title: '' }, g);
  const title = S.text(o.title || 'the generate loop', { x: 960, y: PNL.y + 48, size: 36, anchor: 'middle', weight: 700, family: 'display', color: 'ink' }, g);
  const BY = 525, BH = 180;
  const B = {
    text: { x: 250, w: 520, tone: 'struct', name: 'text so far' },
    model: { x: 860, w: 380, tone: 'bytes', name: 'run the whole model' },
    out: { x: 1320, w: 350, tone: 'struct', name: 'one new token' },
  };
  const boxes = {};
  for (const [k, b] of Object.entries(B)) {
    const bg = S.g(null, g);
    S.rect({ x: b.x, y: BY - BH / 2, w: b.w, h: BH, r: 18, fill: '#0c1326' }, bg);
    bg.bg = S.rect({ x: b.x, y: BY - BH / 2, w: b.w, h: BH, r: 18, fill: `url(#card-${b.tone})`, stroke: b.tone, sw: 2.5, strokeOpacity: 0.8 }, bg);
    bg.name = S.text(b.name, { x: b.x + b.w / 2, y: BY - BH / 2 - 28, size: 28, anchor: 'middle', weight: 650, color: b.tone }, bg);
    Object.assign(bg, { l: b.x, r: b.x + b.w, cx: b.x + b.w / 2, cy: BY });
    boxes[k] = bg;
  }
  S.arrow({ x1: boxes.text.r + 10, y1: BY, x2: boxes.model.l - 10, y2: BY, color: 'muted', sw: 3, head: 14 }, g);
  S.arrow({ x1: boxes.model.r + 10, y1: BY, x2: boxes.out.l - 10, y2: BY, color: 'muted', sw: 3, head: 14 }, g);
  const RY = 700;
  const retD = `M${boxes.out.cx},${BY + BH / 2 + 8} L${boxes.out.cx},${RY} L${boxes.text.cx},${RY} L${boxes.text.cx},${BY + BH / 2 + 12}`;
  const retPath = S.path({ d: retD, stroke: 'struct', sw: 3, strokeOpacity: 0.8 }, g);
  S.path({ d: `M${boxes.text.cx - 10},${BY + BH / 2 + 26} L${boxes.text.cx},${BY + BH / 2 + 12} L${boxes.text.cx + 10},${BY + BH / 2 + 26}`, stroke: 'struct', sw: 3 }, g);
  const retLbl = S.text('append, go round again', { x: 960, y: RY + 42, size: 26, anchor: 'middle', color: 'muted', weight: 550 }, g);
  // the weights
  const G = { cw: 30, ch: 20, gap: 4 };
  const gw = 10 * (G.cw + G.gap) - G.gap, gh = 4 * (G.ch + G.gap) - G.gap;
  const tiles = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) {
    const t = S.rect({ x: boxes.model.cx - gw / 2 + c * (G.cw + G.gap), y: BY - gh / 2 + 6 + r * (G.ch + G.gap), w: G.cw, h: G.ch, r: 4,
      fill: 'url(#card-struct)', stroke: 'struct', sw: 1.2, strokeOpacity: 0.6 }, g);
    t.row = r;
    tiles.push(t);
  }
  // the text so far
  const WORDS = o.words || ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog', '.'];
  const PS = 24, PH = 40, GAPX = 8, INNER = B.text.w - 36;
  const pw = WORDS.map(w => S.measure(w, { size: PS, weight: 600, case: 'keep' }) + 24);
  const slots = [];
  let x = 0, row = 0;
  pw.forEach((w, i) => {
    if (x + w > INNER) { x = 0; row++; }
    slots.push({ x: B.text.x + 18 + x + w / 2, y: BY - 32 + row * 58, w });
    x += w + GAPX;
  });
  const shown = o.shown ?? 9;
  const pills = WORDS.map((w, i) => {
    const p = S.pill(w, { x: slots[i].x, y: slots[i].y, h: PH, w: pw[i], size: PS, tone: 'struct', case: 'keep' }, g);
    if (i >= shown) S.set(p, { autoAlpha: 0 }, 0);
    return p;
  });
  // one turn: each row of tiles lights coral (a weight being read), top to bottom
  const lightTurn = (at, { stagger = 0.09, hold = 0.35 } = {}) => {
    for (let r = 0; r < 4; r++) {
      const ts = tiles.filter(t => t.row === r), t0 = (typeof at === 'number' ? at : S.t(at)) + r * stagger;
      S.add(gsap.set(ts, { attr: { fill: 'url(#card-bytes)', stroke: S.tone('bytes'), 'stroke-opacity': 1 } }), t0);
      S.add(gsap.set(ts, { attr: { fill: 'url(#card-struct)', stroke: S.tone('struct'), 'stroke-opacity': 0.6 } }), t0 + hold);
    }
  };
  return { g, panel, title, boxes, tiles, pills, slots, retPath, retLbl, retD, RY, BY, lightTurn };
}
