/* Shared builders for chapter 7, "From text to vectors". Loaded before every ch07 scene; read-only for
   scene authors.

   Visual language for the chapter (keep it in every scene):
   - Top band: at most one short heading, centred at y 150, changed beat by beat (ch07Heading). Its key
     term may take a colour ('a vector' blue, 'multiply and add' amber); the rest is white.
   - Numbers you read: the film's soft blue cells, mono digits, typographic minus, violet text for
     negatives (libVector / libMatVec). s01's vector is CH07.X; s02's input is its first five numbers.
   - A token's vector you do not read: a shaded strip (ch07Vec), blue for positive, violet for negative.
     Its pattern is fixed by the token, so the same token always shows the same strip: 'fox' in s03 is
     row 4271 of the embedding table in s04-s06, and 'dog' looks the same at both positions in s07.
   - The embedding / output table (s04, s05, s06): ch07Table, rows are those same strips, row numbers in
     grey mono down the left edge, ellipses where rows are skipped (CH07.tableRows).
   - "No arithmetic here" is a grey calculator with a slash drawn through it (ch07NoCalc): s03's arrows,
     s04 above the table.
   - Colour = meaning: blue = values, tokens, table rows; grey = stored weights at rest, unused rows,
     things multiplied by zero; amber = multiply-and-add only (first seen in s01.b3); coral = memory
     reads (copying a row, a gather, rows read); teal = zero operations, the position fix.
   - Seek-safe motion: fades here are written from tween progress (ch07Fade), never by an autoAlpha that
     two tweens share, and a heading change makes a new <text> rather than rewriting one (fx.swap is not
     seek-safe when used twice on the same element). */

const CH07 = {
  X: ['0.4', '-1.2', '0.0', '0.9', '0.3', '-0.5', '1.1', '0.2'],  // s01's vector; s02 'in' = X[0..4]
  W1: ['0.5', '0.25', '-0.7', '1.0', '-1.0'],                     // s02 row 1: products 0.2, −0.3, 0, 0.9, −0.3; sum 0.5
  VOCAB: 128256,            // rows in the embedding table ("about a hundred and twenty-eight thousand")
  WIDTH: 8192,              // numbers per row = the model's width
  FOX: 4271,                // fox's token ID (illustrative)
  ids: { fox: 4271 },       // words whose strip is a specific table row
  tableRows: [0, 1, 2, '…', 4271, '…', 128254, 128255],
  HEAD_Y: 150,
};

/** A proxy tween that calls apply(eased progress 0..1) over d s; seek-safe in both directions. */
function ch07Drive(d, apply, ease) {
  const p = { v: 0 }, e = gsap.parseEase(ease || 'none');
  const go = () => apply(e(p.v));
  return gsap.fromTo(p, { v: 0 }, {
    v: 1, duration: Math.max(0.001, d), ease: 'none', immediateRender: false,
    onStart: go, onUpdate: go, onReverseComplete: () => apply(0),
  });
}

/** Hide elements at build time (to be revealed by ch07Fade). Returns the first one. */
function ch07Hide(els) {
  (Array.isArray(els) ? els : [els]).filter(Boolean).forEach(e => { e.style.opacity = 0; e.style.visibility = 'hidden'; });
  return Array.isArray(els) ? els[0] : els;
}

/**
 * Fade elements from opacity a to b, written from the tween's progress (hidden at 0), so every frame is
 * the same however it is reached. o: {d 0.5, ease 'power2.out', stagger 0, dy0, dy1}: with dy0/dy1 the
 * element also slides vertically (translate written to its transform attribute: only for elements that
 * nothing else transforms, e.g. a plain <text> or a holder <g> you do not xform).
 */
function ch07Fade(els, a, b, o = {}) {
  const list = (Array.isArray(els) ? els : [els]).filter(Boolean);
  const d = o.d ?? 0.5, slide = o.dy0 !== undefined || o.dy1 !== undefined;
  const tl = gsap.timeline();
  list.forEach((e, i) => tl.add(ch07Drive(d, k => {
    const v = a + (b - a) * k;
    e.style.opacity = v;
    e.style.visibility = v > 0.001 ? 'inherit' : 'hidden';
    if (slide) e.setAttribute('transform', `translate(0,${((o.dy0 ?? 0) + ((o.dy1 ?? 0) - (o.dy0 ?? 0)) * k).toFixed(2)})`);
  }, o.ease || 'power2.out'), i * (o.stagger ?? 0)));
  return tl;
}

/** data-audit="ignore" on els while this tween runs (d s), or from its start on if d is omitted. Seek-safe. */
function ch07Ignore(els, d) {
  const list = (Array.isArray(els) ? els : [els]).filter(Boolean);
  const set = on => list.forEach(e => (on ? e.setAttribute('data-audit', 'ignore') : e.removeAttribute('data-audit')));
  if (d === undefined) return ch07Drive(0.001, p => set(p > 0));
  return ch07Drive(d, p => set(p > 0 && p < 1));
}

/**
 * The chapter heading: one line in the top band, changed beat by beat with a soft vertical crossfade.
 * o: {x 960, y 150, size 54, maxW 1500, parent}
 * Returns <g> with helpers that RETURN tweens (call them in time order):
 *   .show(text | [{t, c}], {color 'ink', d 0.6})   crossfade from the current line (if any) to this one;
 *        segments colour a key term: [{t: 'a vector', c: 'struct'}, {t: ': a list of numbers'}]
 *   .hide({d 0.45})                                 fade the current line out
 * and .items[] (one <text> per .show, in call order).
 *   const head = ch07Heading(S);
 *   S.add(head.show([{ t: 'a vector', c: 'struct' }, { t: ': a list of numbers' }]), 'b1~A vector-0.1');
 */
function ch07Heading(S, o = {}) {
  const g = S.g(null, o.parent);
  const x = o.x ?? 960, y = o.y ?? CH07.HEAD_Y, size = o.size ?? 54;
  let cur = null;
  g.items = [];
  g.show = (content, so = {}) => {
    const t = S.text(content, { x, y, size: so.size ?? size, weight: 700, family: 'display', anchor: 'middle', color: so.color || 'ink', maxW: o.maxW ?? 1500 }, g);
    ch07Hide(t);
    g.items.push(t);
    const d = so.d ?? 0.6, prev = cur;
    cur = t;
    const tl = gsap.timeline();
    if (prev) tl.add(ch07Fade(prev, 1, 0, { d: d * 0.5, ease: 'power2.in', dy0: 0, dy1: -12 }), 0);
    tl.add(ch07Fade(t, 0, 1, { d: d * 0.8, ease: 'power2.out', dy0: 14, dy1: 0 }), prev ? d * 0.35 : 0);
    return tl;
  };
  g.hide = (ho = {}) => {
    const prev = cur;
    cur = null;
    return prev ? ch07Fade(prev, 1, 0, { d: ho.d ?? 0.45, ease: 'power2.in', dy0: 0, dy1: -12 }) : gsap.timeline();
  };
  return g;
}

/** A row number / token ID as printed: '4271' (four digits, no comma, as in 'ID 4271' and '#4271'), '128,254'. */
function ch07RowNum(k) { return k < 10000 ? String(k) : ch07Comma(k); }
function ch07Comma(k) { return String(k).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

/** A stable seed for a token: a word ('fox' maps to its ID in CH07.ids) or a token ID / row number. */
function ch07Seed(token) {
  const key = String(token).trim().toLowerCase();
  const id = typeof token === 'number' ? token : CH07.ids[key];
  if (id !== undefined) return (Math.imul(id + 1, 2654435761) >>> 0) || 1;
  let h = 2166136261;
  for (const ch of key) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) || 1;
}

/**
 * A token's vector as a shaded strip (libVector style 'heat'), its pattern fixed by the token:
 * ch07Vec(S, {token: 'fox', n: 20}) and row 4271 of ch07Table (n 20 by default) are the same strip; with
 * a different n the first cells still match, but pass the table's n when the two are shown together.
 * o: token (word or ID), n 16 cells, and any libVector option (x, y, anchor, dir, cw, ch, gap, gain,
 *    length, label, lengthLabel, hidden ...). Returns the libVector (helpers .pop .in .flash .sweep .paint).
 */
function ch07Vec(S, o = {}, parent) {
  return libVector(S, { style: 'heat', n: 16, ...o, seed: o.seed ?? ch07Seed(o.token ?? 0) }, parent);
}

/**
 * The embedding table (and its twin, the output projection): one ch07Vec strip per row, row numbers in
 * grey mono down the left edge, vertical ellipses where rows are skipped.
 * o: x, y (top-left of the strips; the numbers hang to the left of x), rows (CH07.tableRows; IDs and '…'),
 *    n 20 cells per row, cw 22, rowH 40, gap 12, ellH 56, gain (strip contrast), numbers true,
 *    numFmt (row number -> text; default ch07RowNum: '4271', '128,254'),
 *    widthLabel (e.g. '8,192 numbers per row': a bracket across the top), hidden false.
 * Returns <g> with .rows[] (each a <g> holding .strip and .num, with .k .t .b .cy), .rowAt(k), .ells[],
 *    .widthG (bracket + .widthEl) and geometry .x .y .w .h .l .r .t .b .cx .cy (strips only).
 * Helpers (return tweens): .build({d 0.4, stagger 0.1}) rows and ellipses appear top-down (hidden
 *    until then); .copy(k, {parent}) a new strip identical to row k, at the same place (visible: wrap it
 *    in a holder you hide, move and fade).
 *   const T = ch07Table(S, { x: 760, y: 300, widthLabel: '8,192 numbers per row', hidden: true });
 *   S.add(T.build(), 'b1~embedding');
 */
function ch07Table(S, o = {}, parent) {
  const rows = o.rows || CH07.tableRows;
  const n = o.n ?? 20, cw = o.cw ?? 22, rowH = o.rowH ?? 40, gap = o.gap ?? 12, ellH = o.ellH ?? 56;
  const x = o.x ?? 700, y = o.y ?? 280;
  const w = n * (cw + 3) - 3;
  const g = S.g(null, parent);
  g.rows = []; g.ells = [];
  let yy = y;
  rows.forEach(k => {
    if (k === '…' || k === '...' || k === '⋮') {
      const eg = S.g(null, g);
      for (const cx of (o.numbers === false ? [x + w / 2] : [x - 52, x + w / 2])) {
        for (let q = -1; q <= 1; q++) S.circle({ x: cx, y: yy + ellH / 2 + q * 11, r: 3.4, fill: 'muted' }, eg);
      }
      Object.assign(eg, { t: yy, b: yy + ellH, cy: yy + ellH / 2 });
      g.ells.push(eg);
      yy += ellH + gap;
      return;
    }
    const rg = S.g(null, g);
    rg.strip = ch07Vec(S, { token: k, n, cw, ch: rowH, gap: 3, anchor: 'start', x, y: yy, gain: o.gain }, rg);
    if (o.numbers !== false) rg.num = S.text((o.numFmt || ch07RowNum)(k), { x: x - 18, y: yy + rowH / 2 + 1, size: 24, family: 'mono', anchor: 'end', color: 'muted' }, rg);
    Object.assign(rg, { k, t: yy, b: yy + rowH, cy: yy + rowH / 2 });
    g.rows.push(rg);
    yy += rowH + gap;
  });
  const h = yy - gap - y;
  Object.assign(g, { x, y, w, h, l: x, r: x + w, t: y, b: y + h, cx: x + w / 2, cy: y + h / 2 });
  if (o.widthLabel) {
    g.widthG = S.g(null, g);
    const yb = y - 14;
    S.path({ d: `M${x},${yb} l0,-12 L${x + w},${yb - 12} l0,12`, stroke: 'muted', sw: 2.5, strokeOpacity: 0.85 }, g.widthG);
    g.widthEl = S.text(o.widthLabel, { x: x + w / 2, y: yb - 40, size: 28, anchor: 'middle', color: 'muted', weight: 550 }, g.widthG);
  }
  const items = [...g.rows, ...g.ells].sort((a, b) => a.t - b.t);
  if (o.hidden) ch07Hide(items);
  g.rowAt = k => g.rows.find(r => r.k === k) || null;
  g.build = (bo = {}) => {
    ch07Hide(items);
    return ch07Fade(items, 0, 1, { d: bo.d ?? 0.4, stagger: bo.stagger ?? 0.1, dy0: -10, dy1: 0 });
  };
  g.copy = (k, co = {}) => {
    const r = g.rowAt(k);
    return ch07Vec(S, { token: k, n, cw, ch: rowH, gap: 3, anchor: 'start', x, y: r ? r.t : y, gain: o.gain }, co.parent ?? parent);
  };
  return g;
}

/**
 * A crossed-out calculator: "no arithmetic here" (s03 on each arrow, s04 above the table). Grey by default:
 * it marks an absence, so it takes no meaning colour.
 * o: x, y (centre), size 56, tone 'muted' (icon), slashTone 'muted'. Hidden until .show().
 * Returns <g> with .icon .slash and helpers (return tweens; call in time order):
 *   .show({d 0.7})   the icon fades in, then the slash draws through it, top-left to bottom-right
 *   .hide({d 0.35})  fade it all out
 *   const nc = ch07NoCalc(S, { x: 760, y: 330, size: 48 });
 *   S.add(nc.show(), 'b3~Neither');
 */
function ch07NoCalc(S, o = {}, parent) {
  const x = o.x ?? 960, y = o.y ?? 540, sz = o.size ?? 56, h = sz * 0.5;
  const g = S.g(null, parent);
  g.icon = S.icon('ph:calculator-duotone', { x, y, size: sz, color: o.tone || 'muted' }, g);
  const pts = { x1: x - h, y1: y - h, x2: x + h, y2: y + h }, L = Math.hypot(2 * h, 2 * h);
  const keyline = S.line({ ...pts, stroke: '#0b1224', sw: Math.max(7, sz * 0.16) }, g);   // so the slash reads over the icon
  g.slash = S.line({ ...pts, stroke: o.slashTone || 'muted', sw: Math.max(3.5, sz * 0.07) }, g);
  const lines = [keyline, g.slash];
  lines.forEach(l => { l.setAttribute('stroke-linecap', 'round'); l.setAttribute('stroke-dasharray', L.toFixed(2)); l.setAttribute('stroke-dashoffset', L.toFixed(2)); });
  ch07Hide(g);
  g.show = (so = {}) => {
    const d = so.d ?? 0.7, tl = gsap.timeline();
    tl.add(ch07Fade(g, 0, 1, { d: d * 0.5 }), 0);
    tl.add(ch07Drive(d * 0.55, k => lines.forEach(l => l.setAttribute('stroke-dashoffset', (L * (1 - k)).toFixed(2))), 'power2.inOut'), d * 0.45);
    return tl;
  };
  g.hide = (ho = {}) => ch07Fade(g, 1, 0, { d: ho.d ?? 0.35, ease: 'power2.in' });
  return g;
}
