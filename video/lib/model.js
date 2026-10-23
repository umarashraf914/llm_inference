/* video/lib/model.js — shared film library: the model's arithmetic.
 *
 *   libNum(v, o)                     a number as the film prints it: typographic minus, no leading plus
 *   libVector(S, o, parent)          a vector: a row or column of number cells (blue; violet text for
 *                                    negatives), truncated with an ellipsis for long vectors, or a shaded strip
 *   libMatVec(S, o, parent)          matrix × vector: row-by-row multiply-adds in amber that fill the output
 *   libLayerStack(S, o, parent)      N transformer layers as thin slabs (perspective or flat); a token climbs
 *                                    through them; one layer opens into 'attention' + 'feed-forward'
 *   libAttention(S, o, parent)       tokens in a row: the query's arcs back to the keys, weights, values
 *                                    blended into the query, a causal mask
 *   libAttentionGrid(S, o, parent)   the score grid (a row per token asking, a column per token asked) and
 *                                    its causal triangle
 *
 * Conventions (all of them):
 * - Build with S primitives into `parent` (default S.main). Everything is visible as built unless the
 *   option `hidden` says otherwise; entrance helpers (.pop, .in, .build) hide their elements until they run.
 * - Helpers RETURN tweens/timelines; place them with S.add(tween, at). Nothing here touches S.tl, reads the
 *   clock or uses Math.random (seeded variety comes from S.rand), so a frame is the same however it is reached.
 * - Helpers keep a plan of what they changed (like fx.xform): call one component's helpers in time order.
 * - To move or scale a component, wrap it in a holder S.g() and S.xset / fx.xform the holder. Never put raw
 *   GSAP x/y/scale on a component root, and never fx.in / fx.pop a root you also xform.
 * - Colour = meaning: amber compute for arithmetic (a multiply, a product, a running total, a score), blue
 *   struct for values, tokens and structure, violet for negative values, teal helps for a saving / a cache,
 *   coral bytes for memory traffic, grey for masked / unused.
 * - Ranges: a single index, [a, b] (inclusive; negatives count from the end) or 'all'. Vector and matrix
 *   indices are 0-based display positions; layer numbers in libLayerStack are 1-based (layer 1 = bottom).
 */

/* ------------------------------------------------------------------ private helpers */
var _libModel = (function () {
  const BASE = '#0c1326';
  const GRAD = ['compute', 'bytes', 'helps', 'struct', 'violet', 'neutral'];
  const MINUS = '−';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const f2 = v => Math.round(v * 100) / 100;
  const isEll = v => v === '…' || v === '...' || v === '⋯' || v === '⋮';

  /** the film's number style: '−0.7', '0.13', '1,024' (comma: true) */
  function num(v, o = {}) {
    if (v === null || v === undefined || v === '') return '';
    if (typeof v === 'string') return v.replace(/^[-−]/, MINUS).replace(/^\+/, '');
    if (o.fmt) return String(o.fmt(v));
    const a = Math.abs(v);
    let s;
    if (o.dp !== undefined && o.dp !== null) s = o.comma ? a.toLocaleString('en-US', { minimumFractionDigits: o.dp, maximumFractionDigits: o.dp }) : a.toFixed(o.dp);
    else { const x = Math.round(a * 1e6) / 1e6; s = o.comma ? x.toLocaleString('en-US', { maximumFractionDigits: 6 }) : String(x); }
    const neg = v < 0 && parseFloat(s.replace(/,/g, '')) !== 0;
    return (neg ? MINUS : '') + s;
  }
  function parse(v) {
    if (typeof v === 'number') return v;
    if (v === null || v === undefined || v === '' || isEll(v)) return NaN;
    return parseFloat(String(v).replace(MINUS, '-').replace(/,/g, ''));
  }
  function hide(e) { e.style.opacity = 0; e.style.visibility = 'hidden'; return e; }
  function hexRGB(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  /** mix two colours (tone names or hex): t = 0 -> a, 1 -> b */
  function mix(S, a, b, t) {
    const A = hexRGB(S.tone(a)), B = hexRGB(S.tone(b));
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  /** index list from a range spec: i | [a, b] (inclusive, negatives from the end) | 'all' | [[i, j, ...]] */
  function idx(range, n) {
    const fix = i => (i < 0 ? n + i : i);
    if (range === undefined || range === null || range === 'all') return [...Array(n).keys()];
    if (Array.isArray(range) && Array.isArray(range[0])) return range[0].map(fix).filter(i => i >= 0 && i < n);
    if (Array.isArray(range)) {
      const a = fix(range[0]), b = fix(range[1] ?? range[0]);
      const out = [];
      for (let i = Math.max(0, a); i <= Math.min(n - 1, b); i++) out.push(i);
      return out;
    }
    const i = fix(range);
    return i >= 0 && i < n ? [i] : [];
  }
  /** text colour of a value cell */
  function textTone(v, tone, o = {}) {
    if (o.textColor) return typeof o.textColor === 'function' ? o.textColor(v) : o.textColor;
    if (tone === 'neutral') return 'muted';
    const neg = o.negTone === undefined ? 'violet' : o.negTone;
    return neg && parse(v) < 0 ? neg : 'ink';
  }
  /** one cell skin: sp = {tone, style: soft|slot|heat|unlit|solid, amt (heat 0..1)} */
  function skin(S, b, sp, parent) {
    const g = S.g(null, parent);
    const tone = sp.tone || 'struct', st = sp.style || 'soft';
    const gt = GRAD.includes(tone) ? tone : 'struct';
    const R = { x: b.x, y: b.y, w: b.w, h: b.h, r: b.r };
    if (st === 'slot') {
      S.rect({ ...R, fill: '#ffffff', fillOpacity: 0.02, stroke: tone, strokeOpacity: 0.55, sw: 2, dash: '6 5' }, g);
    } else if (st === 'heat') {
      S.rect({ ...R, fill: BASE }, g);
      S.rect({ ...R, fill: tone, fillOpacity: f2(0.1 + 0.78 * clamp(sp.amt ?? 0.5)), stroke: tone, strokeOpacity: f2(0.25 + 0.45 * clamp(sp.amt ?? 0.5)), sw: 1 }, g);
    } else if (st === 'unlit') {
      S.rect({ ...R, fill: BASE }, g);
      S.rect({ ...R, fill: '#ffffff', fillOpacity: 0.035, stroke: '#ffffff', strokeOpacity: 0.13, sw: 1.5 }, g);
    } else if (st === 'solid') {
      S.rect({ ...R, fill: `url(#solid-${gt})` }, g);
    } else {
      S.rect({ ...R, fill: BASE }, g);
      S.rect({ ...R, fill: `url(#card-${gt})`, stroke: tone, strokeOpacity: tone === 'neutral' ? 0.3 : 0.5, sw: 1.5 }, g);
    }
    g.__sp = { tone, style: st, amt: sp.amt };
    return g;
  }
  /** a cell: <g> with .skinG .skin and (optionally) .label; geometry .x .y .w .h .cx .cy */
  function cell(S, b, sp, parent) {
    const cg = S.g(null, parent);
    cg.skinG = S.g(null, cg);
    cg.skin = skin(S, b, sp, cg.skinG);
    cg.__sp = cg.skin.__sp;
    Object.assign(cg, { x: b.x, y: b.y, w: b.w, h: b.h, rr: b.r, cx: b.x + b.w / 2, cy: b.y + b.h / 2, ovs: {} });
    return cg;
  }
  function cellText(S, c, text, o = {}) {
    let size = o.size || 26;
    const tw = S.measure(text, { size, family: o.family || 'mono', weight: o.weight || 500 });
    if (tw > c.w - 14) size = Math.max(18, Math.floor(size * (c.w - 14) / tw));
    const t = S.text(text, { x: c.cx, y: c.cy + 1, size, anchor: 'middle', family: o.family || 'mono', weight: o.weight || 500, color: o.color || 'ink' }, c);
    c.__tc = S.tone(o.color || 'ink');
    return t;
  }
  /** a flash overlay for a cell, one per tone, made on first use (sits under the label) */
  function overlay(S, c, tone, kind = 'flash') {
    const key = tone + ':' + kind;
    if (c.ovs[key]) return c.ovs[key];
    const white = tone === 'white' || tone === 'ink';
    const col = white ? '#ffffff' : tone;
    const ov = kind === 'lit'
      ? S.rect({ x: c.x, y: c.y, w: c.w, h: c.h, r: c.rr, fill: col, fillOpacity: 0.8, stroke: col, strokeOpacity: 0.9, sw: 1.5 }, c)
      : S.rect({ x: c.x, y: c.y, w: c.w, h: c.h, r: c.rr, fill: col, fillOpacity: white ? 0.16 : 0.34, stroke: col, strokeOpacity: white ? 0.9 : 1, sw: 2.5 }, c);
    c.insertBefore(ov, c.skinG.nextSibling);
    ov.style.opacity = 0;
    c.ovs[key] = ov;
    return ov;
  }
  /** cells flash a tone and return (o: tone 'compute', d 0.5, hold 0.1, stagger 0, peak 1) */
  function flash(S, cells, o = {}) {
    const tl = gsap.timeline();
    const d = o.d ?? 0.5, hold = o.hold ?? 0.1, st = o.stagger ?? 0;
    cells.forEach((c, i) => {
      const ov = overlay(S, c, o.tone || 'compute');
      const t = i * st;
      tl.fromTo(ov, { opacity: 0 }, { opacity: o.peak ?? 1, duration: d * 0.3, ease: 'power2.out', immediateRender: false }, t);
      tl.fromTo(ov, { opacity: o.peak ?? 1 }, { opacity: 0, duration: d * 0.7, ease: 'power2.in', immediateRender: false }, t + d * 0.3 + hold);
    });
    return tl;
  }
  /** cells cross-fade to a new skin (spec: tone | {tone, style, amt} | (cell, i) => spec); text recolours to match */
  function paint(S, cells, spec, o = {}) {
    const tl = gsap.timeline();
    const d = o.d ?? 0.45, st = o.stagger ?? 0;
    cells.forEach((c, i) => {
      let sp = typeof spec === 'function' ? spec(c, i) : spec;
      if (typeof sp === 'string') sp = { tone: sp, style: c.__sp.style === 'slot' ? 'soft' : (o.style || c.__sp.style) };
      sp = { ...c.__sp, ...sp };
      const prev = c.skin;
      const nk = skin(S, { x: c.x, y: c.y, w: c.w, h: c.h, r: c.rr }, sp, c.skinG);
      nk.style.opacity = 0;
      c.skin = nk; c.__sp = nk.__sp;
      const t = i * st;
      tl.fromTo(nk, { opacity: 0 }, { opacity: 1, duration: d, ease: 'power1.inOut', immediateRender: false }, t);
      tl.fromTo(prev, { opacity: 1 }, { opacity: 0, duration: d, ease: 'power1.inOut', immediateRender: false }, t);
      if (c.label) {
        const nc = S.tone(o.textColor || textTone(c.v, sp.tone, o.textOpts || {}));
        if (nc !== c.__tc) tl.fromTo(c.label, { attr: { fill: c.__tc } }, { attr: { fill: nc }, duration: d, ease: 'power1.inOut', immediateRender: false }, t);
        c.__tc = nc;
      }
    });
    return tl;
  }
  /** a cell's text cross-fades to new text (a new <text>, so seeking never depends on textContent) */
  function relabel(S, c, text, o = {}) {
    const old = c.label;
    const t = cellText(S, c, text, o);
    hide(t);
    c.label = t;
    const d = o.d ?? 0.4, tl = gsap.timeline();
    if (old) tl.fromTo(old, { autoAlpha: 1 }, { autoAlpha: 0, duration: d * 0.5, ease: 'power1.in', immediateRender: false }, 0);
    tl.fromTo(t, { autoAlpha: 0, y: o.dy ?? 10 }, { autoAlpha: 1, y: 0, duration: d * 0.75, ease: 'power2.out', immediateRender: false }, old ? d * 0.25 : 0);
    if (old) tl.add(inFlight([old, t], d), 0);
    return tl;
  }
  /** a proxy tween: apply(p) for p 0..1 over d, seek-safe in both directions */
  function drive(d, apply, o = {}) {
    const p = { v: 0 };
    const go = () => apply(p.v);
    return gsap.fromTo(p, { v: 0 }, {
      v: 1, duration: Math.max(0.001, d), ease: o.ease || 'none', immediateRender: false,
      onStart: go, onUpdate: go, onReverseComplete: () => apply(0),
    });
  }
  /** while this tween runs (d s), els carry data-audit="ignore": copies in flight overlap on purpose (seek-safe) */
  function inFlight(els, d) {
    const list = (Array.isArray(els) ? els : [els]).filter(Boolean);
    return drive(d, p => list.forEach(e => (p > 0 && p < 1 ? e.setAttribute('data-audit', 'ignore') : e.removeAttribute('data-audit'))));
  }
  /** from this instant on, els carry data-audit="ignore" (seek-safe) */
  function ignoreFrom(els) {
    const list = (Array.isArray(els) ? els : [els]).filter(Boolean);
    return drive(0.001, p => list.forEach(e => (p > 0 ? e.setAttribute('data-audit', 'ignore') : e.removeAttribute('data-audit'))));
  }
  /** set a text element's content at one instant (seek-safe): before -> after */
  function tick(el, before, after) {
    return drive(0.001, p => { el.textContent = p > 0 ? after : before; });
  }
  /** planned value of el[key] (helpers record what they changed, in call order) */
  function plan(el, key, v, def) {
    el.__plan = el.__plan || {};
    const prev = key in el.__plan ? el.__plan[key] : def;
    if (v !== undefined) el.__plan[key] = v;
    return prev;
  }
  /** opacity tween from the planned opacity */
  function fadeTo(el, to, d, ease) {
    const from = plan(el, 'op', to, 1);
    return gsap.fromTo(el, { opacity: from }, { opacity: to, duration: d, ease: ease || 'power2.out', immediateRender: false });
  }
  /** rounded-rect path */
  function rr(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    if (!r) return `M${f2(x)},${f2(y)}h${f2(w)}v${f2(h)}h${f2(-w)}Z`;
    return `M${f2(x + r)},${f2(y)}H${f2(x + w - r)}A${f2(r)},${f2(r)} 0 0 1 ${f2(x + w)},${f2(y + r)}V${f2(y + h - r)}A${f2(r)},${f2(r)} 0 0 1 ${f2(x + w - r)},${f2(y + h)}H${f2(x + r)}A${f2(r)},${f2(r)} 0 0 1 ${f2(x)},${f2(y + h - r)}V${f2(y + r)}A${f2(r)},${f2(r)} 0 0 1 ${f2(x + r)},${f2(y)}Z`;
  }
  /** 45° hatching clipped to a rectangle, as path data */
  function hatch(x, y, w, h, step = 12) {
    let d = '';
    for (let c = step / 2; c < w + h; c += step) {
      const a = Math.max(0, c - h), b = Math.min(c, w);
      if (b - a < 0.5) continue;
      d += `M${f2(x + a)},${f2(y + c - a)}L${f2(x + b)},${f2(y + c - b)}`;
    }
    return d;
  }
  /** a small soft chip (amber product, blue result): <g> with .label; hidden */
  function chip(S, text, o, parent) {
    const g = S.g(null, parent);
    const size = o.size ?? 24, h = o.h ?? 46;
    const w = Math.max(o.minW ?? h * 1.3, S.measure(text, { size, family: 'mono', weight: 600 }) + 30);
    const x = o.x - w / 2, y = o.y - h / 2, tone = o.tone || 'compute';
    S.rect({ x, y, w, h, r: Math.min(14, h / 2), fill: BASE }, g);
    S.rect({ x, y, w, h, r: Math.min(14, h / 2), fill: `url(#card-${GRAD.includes(tone) ? tone : 'compute'})`, stroke: tone, strokeOpacity: 0.9, sw: 2 }, g);
    if (text !== '') g.label = S.text(text, { x: o.x, y: o.y + 1, size, family: 'mono', weight: 600, anchor: 'middle', color: o.color || 'ink' }, g);
    Object.assign(g, { cx: o.x, cy: o.y, w, h });
    hide(g);
    return g;
  }
  return { BASE, GRAD, MINUS, clamp, f2, isEll, num, parse, hide, mix, idx, textTone, skin, cell, cellText, overlay, flash, paint, relabel, drive, inFlight, ignoreFrom, tick, plan, fadeTo, rr, hatch, chip };
})();

/* ------------------------------------------------------------------ libNum */
/**
 * libNum — a number as the film prints it: typographic minus (−0.7), no leading plus, no float noise.
 *   v: number or string ('-1.2' -> '−1.2'; strings keep their digits, so '0.0' stays '0.0').
 *   o: dp (fixed decimals; default: as many as the value needs), comma (thousands separators), fmt (v => str).
 * Returns a string.
 *   libNum(-0.7)              // '−0.7'
 *   libNum(0.2 + -0.3)        // '−0.1'
 *   libNum(8192, { comma: true })   // '8,192'
 */
function libNum(v, o = {}) { return _libModel.num(v, o); }

/* ------------------------------------------------------------------ libVector */
/**
 * libVector — a vector: a row (or column) of number cells. Blue cells, white numbers, violet text for
 * negative values, a typographic minus. Long vectors are truncated with an ellipsis ('0.4 −1.2 … 0.7',
 * '8,192 numbers'). As a shaded strip (style 'heat') it is the film's compact picture of a token's vector:
 * no digits, each cell's shade is its value (blue positive, violet negative).
 * o: x 960, y 540 (the centre; top-left with anchor 'start'), anchor 'middle' | 'start',
 *    values [] numbers | strings ('0.0' keeps its digits) | null (an empty dashed slot, filled by .set)
 *       | '…' (an ellipsis slot). Default: n blank slots (heat: n seeded values in −1..1).
 *    n 8 (heat 16): cell count when values is omitted.
 *    dir 'row' | 'col'.
 *    style 'numbers' | 'heat' (shaded, no text) | 'blank' (tinted cells, no text).
 *    length (true length, e.g. 8192): when longer than the values given, an ellipsis is put before the last
 *       `tail` (1) values, and those count from the end. Put '…' in values yourself for other layouts
 *       (e.g. a one-hot [0, 0, '…', 1, '…', 0] with indices [0, 1, null, 4271, null, 128255]).
 *    indices: the true index of every entry (null for ellipses). Default: inferred from length.
 *    cw (fits the widest number; heat: row 20 / col 46), ch 60 (heat: row 46 / col 20), gap 8 (heat 3),
 *    r 9 (heat 3), size 28 (mono), dp / fmt / comma (number format, see libNum),
 *    tone 'struct' | any tone | (k, v) => tone (k = true index), negTone 'violet' (text colour of negatives;
 *       heat: the cell colour of negatives; null = no special colour), textColor (str | v => str),
 *    gain 1 (heat: contrast; 1.4 'richer'), seed 11 (heat values when none given),
 *    label ('in', 'query', ...) at labelPos 'start' (row: left of it) | 'end' | 'above' | 'below'
 *       (col default 'above'); labelSize 28, labelColor 'muted'.
 *    lengthLabel: true ('8,192 numbers' from length) | string: a bracket along the vector with the label;
 *       lengthPos 'above' (row) | 'below' | 'right' (col) | 'left'.
 *    index: true (every cell's true index) | 'ends' | [k, ...] (those true indices): small grey numbers
 *       beside the cells (row: below, col: left); idxFmt (default with commas).
 *    hidden false: start with every cell hidden (reveal with .pop / .in).
 * Returns <g> with .cells[] (each <g>: .skin .label .v (value) .k (true index) .i (display index) and
 *    geometry .x .y .w .h .cx .cy), .ells[] (ellipsis groups), .body, .decor, .labelEl, .lengthEl,
 *    .idxEls[], and geometry .x .y .w .h .l .r .t .b .cx .cy, .cw .ch .gap .dir .length.
 * Helpers (return tweens/timelines; call in time order):
 *    .pop({stagger 0.06, d 0.45, from 'start' | 'end' | 'center'})  cells pop in in order (hidden until then)
 *    .in({d 0.7, from 'up'})               the whole vector slides/fades in (hidden until then)
 *    .set(range, value | values[], {d 0.4, stagger 0, tone})  new value(s); an empty slot fills blue
 *    .flash(range, {tone 'compute', d 0.5, stagger 0.05, hold 0.1})   cells flash and return
 *    .sweep({d 0.45, stagger 0.05})        a soft white highlight runs through the cells in order
 *    .paint(range, tone | {tone, style}, {d 0.45, stagger 0})   recolour for good (e.g. 'helps', 'neutral')
 *    .reshade(values | {seed, gain}, {d 0.6, stagger 0.02})   heat style: cross-fade to new shades
 *    .cellAt(k) -> the cell with true index k · .pos(i) -> [cx, cy] of display cell i
 *    .clone({...overrides, parent}) -> a new libVector with the same options (a copy to lift out)
 *   const v = libVector(S, { values: [0.4, -1.2, 0.0, 0.9, 0.3, -0.5, 1.1, 0.2], x: 960, y: 420, dp: 1 });
 *   S.add(v.pop({ stagger: 0.15 }), 'b1~list');
 *   const e = libVector(S, { values: [0.12, -0.83, 0.4, 0.05, -0.61, 0.27], length: 8192, lengthLabel: true, x: 960, y: 640 });
 *   S.add(e.pop(), 'b2~eight');
 *   S.add(v.flash('all', { stagger: 0.08 }), 'b3~multiply');
 */
function libVector(S, o = {}, parent) {
  const M = _libModel;
  const dir = o.dir === 'col' || o.dir === 'column' ? 'col' : 'row';
  const style = o.style || 'numbers';
  const heat = style === 'heat', blank = style === 'blank';
  const rnd = S.rand(o.seed ?? 11);
  let vals = o.values ? o.values.slice() : null;
  if (!vals) {
    const n = o.n ?? (heat ? 16 : 8);
    vals = Array.from({ length: n }, () => (heat ? Math.round((rnd() * 2 - 1) * 100) / 100 : null));
  }
  const nNum = vals.filter(v => !M.isEll(v)).length;
  const L = o.length ?? nNum;
  if (L > nNum && !vals.some(M.isEll)) vals.splice(Math.max(1, vals.length - (o.tail ?? 1)), 0, '…');
  let ks = o.indices ? o.indices.slice() : null;
  if (!ks) {
    ks = vals.map(() => null);
    const first = vals.findIndex(M.isEll);
    if (first < 0) vals.forEach((v, i) => { ks[i] = i; });
    else {
      let last = first;
      vals.forEach((v, i) => { if (M.isEll(v)) last = i; });
      for (let i = 0; i < first; i++) ks[i] = i;
      for (let i = last + 1, k = L - (vals.length - last - 1); i < vals.length; i++, k++) ks[i] = k;
    }
  }
  const size = o.size ?? 28;
  const fmtv = v => M.num(v, o);
  let cw = o.cw, ch = o.ch;
  if (heat) { cw = cw ?? (dir === 'row' ? 20 : 46); ch = ch ?? (dir === 'row' ? 46 : 20); }
  else {
    ch = ch ?? 60;
    const texts = vals.filter(v => !M.isEll(v) && v !== null && v !== undefined).map(fmtv);
    const widest = texts.length ? Math.max(...texts.map(t => S.measure(t, { size, family: 'mono', weight: 500 }))) : 0;
    cw = cw ?? (texts.length ? Math.max(Math.round(ch * 1.1), Math.ceil(widest + 34)) : Math.round(ch * 1.6));
  }
  const gap = o.gap ?? (heat ? 3 : 8), r = o.r ?? (heat ? 3 : 9);
  const along = dir === 'row' ? cw : ch;
  const ellLen = o.ellLen ?? Math.round(heat ? Math.max(24, along * 2.2) : Math.max(30, along * 0.62));
  let run = 0;
  const pos = vals.map(v => { const p = run; run += (M.isEll(v) ? ellLen : along) + gap; return p; });
  const bodyLen = run - gap;
  const W = dir === 'row' ? bodyLen : cw, H = dir === 'row' ? ch : bodyLen;
  const mid = (o.anchor || 'middle') === 'middle';
  const left = mid ? (o.x ?? 960) - W / 2 : (o.x ?? 0), top = mid ? (o.y ?? 540) - H / 2 : (o.y ?? 0);
  const vmax = Math.max(1e-9, ...vals.filter(v => !M.isEll(v)).map(v => Math.abs(M.parse(v)) || 0));
  const gain = o.gain ?? 1;
  const amtOf = v => M.clamp((0.12 + 0.7 * Math.abs(M.parse(v) || 0) / vmax) * gain, 0.06, 1);
  const negTone = o.negTone === undefined ? 'violet' : o.negTone;
  const toneOf = (k, v) => {
    if (typeof o.tone === 'function') return o.tone(k, v);
    if (heat && negTone && M.parse(v) < 0) return negTone;
    return o.tone || 'struct';
  };

  const g = S.g(null, parent);
  const body = S.g(null, g), decor = S.g(null, g);
  g.body = body; g.decor = decor;
  g.cells = []; g.ells = []; g.items = []; g.idxEls = [];
  const idxSet = o.index === true ? null : o.index === 'ends' ? 'ends' : Array.isArray(o.index) ? new Set(o.index) : undefined;
  const idxFmt = o.idxFmt || (k => S.fmt.int(k));
  vals.forEach((v, i) => {
    const p = pos[i];
    const bx = dir === 'row' ? left + p : left, by = dir === 'row' ? top : top + p;
    if (M.isEll(v)) {
      const eg = S.g(null, body);
      const ecx = dir === 'row' ? bx + ellLen / 2 : bx + cw / 2, ecy = dir === 'row' ? by + ch / 2 : by + ellLen / 2;
      const sp = heat ? 6 : 11, rr = heat ? 2.2 : 3.4;
      for (let q = -1; q <= 1; q++) S.circle({ x: dir === 'row' ? ecx + q * sp : ecx, y: dir === 'row' ? ecy : ecy + q * sp, r: rr, fill: 'muted' }, eg);
      Object.assign(eg, { cx: ecx, cy: ecy, ell: true });
      g.ells.push(eg); g.items.push(eg);
      return;
    }
    const k = ks[i];
    const tone = toneOf(k, v);
    const slot = (v === null || v === undefined) && !blank && !heat;
    const sp = heat ? { tone, style: 'heat', amt: amtOf(v) } : slot ? { tone, style: 'slot' } : { tone, style: 'soft' };
    const c = M.cell(S, { x: bx, y: by, w: cw, h: ch, r }, sp, body);
    c.v = v; c.k = k; c.i = g.cells.length; c.__size = size;
    if (!heat && !blank && !slot) c.label = M.cellText(S, c, fmtv(v), { size, color: M.textTone(v, tone, o) });
    const showIdx = o.index && k !== null && k !== undefined && (idxSet === null || (idxSet === 'ends' ? (k === ks.find(x => x !== null) || k === L - 1) : (idxSet && idxSet.has(k))));
    if (showIdx) {
      const it = dir === 'row'
        ? S.text(idxFmt(k), { x: c.cx, y: by + ch + 22, size: o.idxSize ?? 24, anchor: 'middle', family: 'mono', color: 'muted' }, c)
        : S.text(idxFmt(k), { x: bx - 14, y: c.cy + 1, size: o.idxSize ?? 24, anchor: 'end', family: 'mono', color: 'muted' }, c);
      c.idxEl = it; g.idxEls.push(it);
    }
    g.cells.push(c); g.items.push(c);
  });
  const right = left + W, bottom = top + H, cx = left + W / 2, cy = top + H / 2;
  if (o.label) {
    const lp = o.labelPos || (dir === 'row' ? 'start' : 'above');
    const ls = o.labelSize ?? 28;
    const P = { start: [left - 20, cy, 'end'], end: [right + 20, cy, 'start'], above: [cx, top - ls * 0.95, 'middle'], below: [cx, bottom + ls * 0.95 + (o.index && dir === 'row' ? 30 : 0), 'middle'] }[lp];
    g.labelEl = S.text(o.label, { x: P[0], y: P[1], size: ls, anchor: P[2], color: o.labelColor || 'muted', weight: 600 }, decor);
  }
  if (o.lengthLabel) {
    const text = o.lengthLabel === true ? `${S.fmt.int(L)} numbers` : o.lengthLabel;
    const side = o.lengthPos || (dir === 'row' ? 'above' : 'right');
    const lg = S.g(null, decor), d = 12, off = 12, ls = o.lengthSize ?? 26, tone = o.lengthTone || 'muted';
    let pd, lx, ly, la = 'middle';
    if (side === 'above' || side === 'below') {
      const s = side === 'above' ? -1 : 1, yb = (s < 0 ? top : bottom + (o.index ? 34 : 0)) + s * off;
      pd = `M${left},${yb} l0,${s * d} L${right},${yb + s * d} l0,${-s * d}`;
      lx = cx; ly = yb + s * (d + ls * 0.85);
    } else {
      const s = side === 'right' ? 1 : -1, xb = (s > 0 ? right : left) + s * off;
      pd = `M${xb},${top} l${s * d},0 L${xb + s * d},${bottom} l${-s * d},0`;
      lx = xb + s * (d + 14); ly = cy; la = s > 0 ? 'start' : 'end';
    }
    g.lengthBracket = S.path({ d: pd, stroke: tone, sw: 2.5, strokeOpacity: 0.85 }, lg);
    g.lengthEl = S.text(text, { x: lx, y: ly, size: ls, anchor: la, color: tone, weight: 550 }, lg);
    g.lengthG = lg;
  }
  Object.assign(g, { x: left, y: top, w: W, h: H, l: left, r: right, t: top, b: bottom, cx, cy, cw, ch, gap, dir, length: L, style });
  if (o.hidden) { g.items.forEach(M.hide); if (decor.childNodes.length) M.hide(decor); }

  const pick = range => M.idx(range, g.cells.length).map(i => g.cells[i]);
  g.cellAt = k => g.cells.find(c => c.k === k) || null;
  g.pos = i => [g.cells[i].cx, g.cells[i].cy];
  g.pop = (po = {}) => {
    let items = g.items.slice();
    if (po.from === 'end') items.reverse();
    if (po.from === 'center') { const m = (items.length - 1) / 2; items = items.map((e, i) => [e, Math.abs(i - m)]).sort((a, b) => a[1] - b[1]).map(e => e[0]); }
    const tl = gsap.timeline();
    const st = po.stagger ?? 0.06;
    tl.fromTo(items, { autoAlpha: 0, scale: po.scale ?? 0.5, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: po.d ?? 0.45, ease: po.ease || 'back.out(2)', stagger: st, transformOrigin: '50% 50%' }, 0);
    tl.add(M.inFlight(items, (po.d ?? 0.45) + st * (items.length - 1)), 0);
    if (decor.childNodes.length) tl.fromTo(decor, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'power1.out' }, Math.min(0.3, st * items.length * 0.5));
    return tl;
  };
  g.in = (io = {}) => S.fx.in([body, decor], { from: io.from || 'up', d: io.d ?? 0.7, stagger: io.stagger ?? 0.1, dist: io.dist });
  g.set = (range, values, so = {}) => {
    const cells = pick(range);
    const vs = Array.isArray(values) ? values : cells.map(() => values);
    const tl = gsap.timeline();
    cells.forEach((c, n) => {
      const v = vs[n], at = n * (so.stagger ?? 0);
      const tone = so.tone || toneOf(c.k, v);
      if (heat) { tl.add(M.paint(S, [c], { tone, style: 'heat', amt: amtOf(v) }, { d: so.d ?? 0.4 }), at); c.v = v; return; }
      if (c.__sp.style === 'slot' || so.tone) tl.add(M.paint(S, [c], { tone, style: 'soft' }, { d: so.d ?? 0.4 }), at);
      c.v = v;
      if (v !== null && v !== undefined && v !== '' && !blank) tl.add(M.relabel(S, c, fmtv(v), { size, color: M.textTone(v, tone, o), d: so.d ?? 0.4 }), at);
    });
    return tl;
  };
  g.flash = (range = 'all', fo = {}) => M.flash(S, pick(range), { stagger: 0.05, ...fo });
  g.sweep = (so = {}) => M.flash(S, g.cells, { tone: 'white', d: so.d ?? 0.45, stagger: so.stagger ?? 0.05, hold: 0.02, peak: so.peak ?? 0.9 });
  g.paint = (range, tone, po = {}) => M.paint(S, pick(range), tone, { ...po, textOpts: o });
  g.reshade = (next, ro = {}) => {
    let nv = Array.isArray(next) ? next : null;
    if (!nv) { const rr = S.rand(next.seed ?? 99); nv = g.cells.map(() => Math.round((rr() * 2 - 1) * 100) / 100); }
    const gn = Array.isArray(next) ? gain : (next.gain ?? gain);
    const tl = M.paint(S, g.cells, (c, i) => {
      const v = nv[i] ?? c.v;
      c.v = v;
      return { tone: toneOf(c.k, v), style: 'heat', amt: M.clamp((0.12 + 0.7 * Math.abs(M.parse(v) || 0) / vmax) * gn, 0.06, 1) };
    }, { d: ro.d ?? 0.6, stagger: ro.stagger ?? 0.02 });
    return tl;
  };
  g.clone = (oo = {}) => libVector(S, { ...o, ...oo }, oo.parent ?? parent);
  return g;
}

/* ------------------------------------------------------------------ libMatVec */
/**
 * libMatVec — matrix × vector, the film's one heavy operation. A grid of weight tiles, the input vector
 * (along the top edge, one number per column, or as a column at the left), and the output vector (a column
 * of empty slots at the right, one per row). A row pass lays the input along a row: each pair lights amber
 * and drops its product into a lane under the matrix; the products are carried one by one into an amber
 * running-total box, whose total flies up into that row's output cell. Fast passes run rows in parallel.
 * o: x 560, y 360 (top-left of the matrix tiles),
 *    W [[...], ...] weights (rows × cols; null = blank tile); rows / cols (default from W, else 4 × 5),
 *    input [...] the input vector (cols values; default blank), inputAt 'top' | 'left',
 *    output: values shown when a row's result lands (default W·input, rounded); showOut true | false |
 *       [i, ...] (rows whose result shows its number; the others fill blue without one),
 *    cw 104, ch 60, gap 10, r 9, size 26, dp / fmt (numbers, see libNum),
 *    tone 'struct' | (r, c) => tone (weight tiles; 'neutral' = grey decimals),
 *    products true (build the products lane and the running-total box; needed by .multiply/.accumulate),
 *    laneGap 66 (matrix bottom to lane), inGap 20 (top) / 60 (left), outGap 56,
 *    labels {W: '4 × 5 matrix', input: 'in', output: 'out'} (any omitted = none; W sits left of the
 *       matrix with inputAt 'top', else below), labelSize 28,
 *    counters false | true (multiplications + additions) | [{label, kind: 'mul' | 'add' | 'mac' | 'ops'}]
 *       ('mac' counts multiply-accumulates, 'ops' counts 2 per weight), counterAt {x, y} (first line's left
 *       end; default under the lane), counterSize 30.
 * Returns <g> with .cells[] (row-major tiles: .skin .label .v .r .c, geometry), .at(r, c), .rowsG[], .input
 *    (libVector), .ghost (libVector row in the top lane, inputAt 'left' only), .lane (whichever vector sits in
 *    the top lane), .output (libVector column), .acc (running-total box), .frame (the amber row frame),
 *    .counterEls[] ({label, num}), .WLabel, and geometry .x .y .w .h .colCx(j) .rowCy(i) .laneY .outX.
 * Helpers (return timelines; call in time order; speed multiplies every rate, so speed 2 = twice as fast):
 *    .in({d 0.8, stagger 0.03})            input, tiles (cascade) and output slots appear (hidden until then)
 *    .layInput({d 1.0})                    inputAt 'left': a copy of the input column swings up into the top lane
 *    .focus(i, {dim 0.3, d 0.4})           amber frame on row i, the other rows dim  · .unfocus({d})
 *    .multiply(i, {speed, stagger 0.28})   each pair in row i lights amber, its product drops into the lane
 *    .accumulate(i, {speed, stagger 0.5})  the products are carried one by one into the running-total box
 *    .emit(i, {speed})                     the total flies up into output cell i, which fills blue
 *    .row(i, {speed})                      multiply + accumulate + emit, in one timeline
 *    .pulse(rows, {speed, parallel true, stagger 0.16})   compact passes: each tile of the rows flashes amber
 *        left to right, the result hops into the output (no products drawn); parallel rows run together
 *    .run({speed 1, detail 1, fast 3, rows 'all', d})    the whole product: the first `detail` rows in full,
 *        the rest in parallel at `fast` × speed. d (s) fits the whole run to that duration.
 *    .flashAll({stagger 0.07, d 0.45})     every tile flashes amber once, in reading order
 *   const mv = libMatVec(S, { x: 620, y: 360, W, input: [0.4, -1.2, 0, 0.9, 0.3], labels: { input: 'in', output: 'out' }, counters: true, showOut: [0] });
 *   S.add(mv.in(), 'b1');
 *   S.add(mv.multiply(0), 'b1~multiply each');
 *   S.add(mv.accumulate(0), 'b2~Add');
 *   S.add(mv.emit(0), 'b2~zero point');
 *   S.add(mv.pulse([1, 2, 3], { speed: 3 }), 'b3~Every row');
 */
function libMatVec(S, o = {}, parent) {
  const M = _libModel;
  const Wv = o.W || null;
  const rows = o.rows ?? (Wv ? Wv.length : 4), cols = o.cols ?? (Wv ? Wv[0].length : 5);
  const xin = o.input || Array(cols).fill(null);
  const cw = o.cw ?? 104, ch = o.ch ?? 60, gap = o.gap ?? 10, r = o.r ?? 9, size = o.size ?? 26;
  const nf = { dp: o.dp, fmt: o.fmt };
  const X0 = o.x ?? 560, Y0 = o.y ?? 360;
  const Ww = cols * (cw + gap) - gap, Wh = rows * (ch + gap) - gap;
  const colX = j => X0 + j * (cw + gap), rowY = i => Y0 + i * (ch + gap);
  const colCx = j => colX(j) + cw / 2, rowCy = i => rowY(i) + ch / 2;
  const inAt = o.inputAt || 'top';
  const labels = o.labels || {};
  const lsz = o.labelSize ?? 28;
  const products = o.products !== false;
  const sumRow = i => {
    if (!Wv) return null;
    let s = 0;
    for (let j = 0; j < cols; j++) { const a = M.parse(Wv[i][j]), b = M.parse(xin[j]); if (isNaN(a) || isNaN(b)) return null; s += a * b; }
    return Math.round(s * 1e6) / 1e6;
  };
  const outVals = o.output || [...Array(rows).keys()].map(sumRow);
  const showOut = i => (o.showOut === undefined || o.showOut === true ? true : o.showOut === false ? false : o.showOut.includes(i));

  const g = S.g(null, parent);
  const back = S.g(null, g), matG = S.g(null, g), mid = S.g(null, g), front = S.g(null, g);
  g.back = back; g.front = front;
  // ---------------------------------------------------------------- the matrix
  g.rowsG = []; g.cells = [];
  for (let i = 0; i < rows; i++) {
    const rg = S.g(null, matG);
    g.rowsG.push(rg);
    for (let j = 0; j < cols; j++) {
      const v = Wv ? Wv[i][j] : null;
      const tone = typeof o.tone === 'function' ? o.tone(i, j) : (o.tone || 'struct');
      const c = M.cell(S, { x: colX(j), y: rowY(i), w: cw, h: ch, r }, { tone, style: 'soft' }, rg);
      c.v = v; c.r = i; c.c = j; c.__size = size;
      if (v !== null && v !== undefined) c.label = M.cellText(S, c, M.num(v, nf), { size, color: M.textTone(v, tone, o) });
      g.cells.push(c);
    }
  }
  g.at = (i, j) => g.cells[i * cols + j];
  // ---------------------------------------------------------------- input, output
  const laneTop = Y0 - (o.inGap ?? 20) - ch;
  const vecO = { cw, ch, gap, r, size, dp: o.dp, fmt: o.fmt, anchor: 'start' };
  if (inAt === 'left') {
    const inH = cols * (ch + gap) - gap;
    g.input = libVector(S, { ...vecO, values: xin, dir: 'col', x: X0 - (o.inGap ?? 60) - cw, y: Y0 + Wh / 2 - inH / 2, label: labels.input, labelPos: 'above', labelSize: lsz }, back);
    g.ghost = libVector(S, { ...vecO, values: xin, dir: 'row', x: X0, y: laneTop, hidden: true }, mid);
    g.lane = g.ghost;
  } else {
    g.input = libVector(S, { ...vecO, values: xin, dir: 'row', x: X0, y: laneTop, label: labels.input, labelPos: 'start', labelSize: lsz }, back);
    g.lane = g.input;
  }
  const outX = X0 + Ww + (o.outGap ?? 56);
  g.output = libVector(S, { ...vecO, values: Array(rows).fill(null), dir: 'col', x: outX, y: Y0, label: inAt === 'top' ? undefined : labels.output, labelPos: 'above', labelSize: lsz }, back);
  if (inAt === 'top' && labels.output) {
    g.output.labelEl = S.text(labels.output, { x: outX + cw / 2, y: laneTop + ch / 2, size: lsz, anchor: 'middle', color: 'muted', weight: 600 }, g.output.decor);
  }
  // ---------------------------------------------------------------- products lane, running total, frame
  const pch = Math.round(ch * 0.8);
  const laneY = Y0 + Wh + (o.laneGap ?? 66) + pch / 2;
  const accW = Math.max(cw, 96), accX = outX + cw / 2;
  if (products) {
    g.acc = S.g(null, mid);
    S.rect({ x: accX - accW / 2, y: laneY - ch / 2, w: accW, h: ch, r: r + 2, fill: M.BASE, filter: 'url(#shadow)' }, g.acc);
    g.accBg = S.rect({ x: accX - accW / 2, y: laneY - ch / 2, w: accW, h: ch, r: r + 2, fill: 'url(#card-compute)', stroke: 'compute', strokeOpacity: 0.95, sw: 2.5 }, g.acc);
    Object.assign(g.acc, { x: accX - accW / 2, y: laneY - ch / 2, w: accW, h: ch, rr: r + 2, cx: accX, cy: laneY, ovs: {}, skinG: g.accBg });
    M.hide(g.acc);
  }
  g.frame = S.rect({ x: X0 - 8, y: rowY(0) - 8, w: Ww + 16, h: ch + 16, r: r + 6, stroke: 'compute', sw: 3, strokeOpacity: 0.95 }, front);
  M.hide(g.frame);
  // ---------------------------------------------------------------- labels and counters
  let below = (products ? laneY + pch / 2 : Y0 + Wh) + 46;
  if (labels.W) {
    if (inAt === 'top' && !o.wLabelBelow) g.WLabel = S.text(labels.W, { x: X0 - 26, y: Y0 + Wh / 2, size: lsz, anchor: 'end', color: 'muted', weight: 600 }, back);
    else { g.WLabel = S.text(labels.W, { x: X0 + Ww / 2, y: below, size: lsz, anchor: 'middle', color: 'muted', weight: 600 }, back); below += 52; }
  }
  const kinds = o.counters === true ? [{ label: 'multiplications', kind: 'mul' }, { label: 'additions', kind: 'add' }] : (o.counters || []);
  const csz = o.counterSize ?? 30;
  const cAt = o.counterAt || { x: X0, y: below + 6 };
  const labW = kinds.length ? Math.max(...kinds.map(k => S.measure(k.label + ':', { size: csz, weight: 550 }))) : 0;
  g.counterEls = kinds.map((k, n) => {
    const y = cAt.y + n * Math.round(csz * 1.45);
    const cg = S.g(null, back);
    const label = S.text(k.label + ':', { x: cAt.x, y, size: csz, color: 'muted', weight: 550 }, cg);
    const num = S.text('0', { x: cAt.x + labW + 14, y, size: csz, family: 'mono', weight: 600, color: 'compute' }, cg);
    return { g: cg, label, num, kind: k.kind };
  });
  Object.assign(g, { x: X0, y: Y0, w: Ww, h: Wh, rows, cols, colCx, rowCy, laneY, outX, cw, ch, gap });

  // ---------------------------------------------------------------- plan + small builders
  const P = { focus: null, frameOn: false, cnt: { mul: 0, add: 0, mac: 0, ops: 0 }, chips: null, accOn: false, accText: null, laid: inAt === 'top' };
  g.rowsG.forEach(rg => M.plan(rg, 'op', undefined, 1));
  /** counter changes at one instant: delta = {mul, add, mac, ops} */
  const bump = (tl, at, delta) => {
    g.counterEls.forEach(ce => {
      const dv = delta[ce.kind] || 0;
      if (!dv) return;
      const before = S.fmt.int(P.cnt[ce.kind]);
      P.cnt[ce.kind] += dv;
      tl.add(M.tick(ce.num, before, S.fmt.int(P.cnt[ce.kind])), at);
    });
    if (!g.counterEls.length) for (const k in delta) P.cnt[k] += delta[k];
  };
  /** counters run from their planned values by delta over d (s) */
  const runCounters = (tl, at, delta, d) => {
    g.counterEls.forEach(ce => {
      const dv = delta[ce.kind] || 0;
      if (!dv) return;
      const a = P.cnt[ce.kind], b = a + dv, step = ce.kind === 'ops' ? 2 : 1;
      P.cnt[ce.kind] = b;
      tl.add(M.drive(d, p => { ce.num.textContent = S.fmt.int(a + step * Math.round((b - a) / step * p)); }), at);
    });
  };
  const rowOps = (target, d) => {
    const tl = gsap.timeline();
    g.rowsG.forEach((rg, i) => { const to = target(i); if (M.plan(rg, 'op', undefined, 1) !== to) tl.add(M.fadeTo(rg, to, d), 0); });
    return tl;
  };
  const accLabel = (text, tl, at, d) => {
    const prev = P.accText;
    const t = S.text(text, { x: accX, y: laneY + 1, size: size + 2, family: 'mono', weight: 650, anchor: 'middle', color: M.parse(text) < 0 ? 'violet' : 'ink' }, g.acc);
    M.hide(t);
    if (prev) tl.fromTo(prev, { autoAlpha: 1 }, { autoAlpha: 0, duration: d * 0.5, immediateRender: false }, at);
    tl.fromTo(t, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: d, ease: 'power2.out', immediateRender: false }, at + (prev ? d * 0.25 : 0));
    if (prev) tl.add(M.inFlight([prev, t], d * 1.3), at);
    P.accText = t;
  };

  // ---------------------------------------------------------------- helpers
  g.in = (io = {}) => {
    const tl = gsap.timeline();
    const st = io.stagger ?? 0.03;
    tl.add(g.input.pop({ stagger: 0.06 }), 0);
    tl.fromTo(g.cells, { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: io.d ?? 0.55, ease: 'back.out(1.8)', stagger: { each: st, grid: [rows, cols], from: 'start' }, transformOrigin: '50% 50%' }, 0.15);
    tl.add(M.inFlight(g.cells, (io.d ?? 0.55) + st * (rows + cols)), 0.15);
    tl.add(g.output.pop({ stagger: 0.05 }), 0.35);
    const extra = [g.WLabel, ...g.counterEls.map(c => c.g)].filter(Boolean);
    if (extra.length) tl.fromTo(extra, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.08 }, 0.5);
    return tl;
  };
  g.layInput = (lo = {}) => {
    const tl = gsap.timeline();
    if (!g.ghost) return tl;
    const d = lo.d ?? 1.0;
    g.ghost.cells.forEach((c, j) => {
      const src = g.input.cells[j];
      const dx = src.cx - c.cx, dy = src.cy - c.cy;
      const t = j * (lo.stagger ?? 0.06);
      tl.fromTo(c, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, immediateRender: false }, t);
      tl.fromTo(c, { x: dx }, { x: 0, duration: d, ease: 'power2.inOut', immediateRender: false }, t);
      tl.fromTo(c, { y: dy }, { y: 0, duration: d, ease: 'power3.inOut', immediateRender: false }, t);
    });
    tl.add(M.flash(S, g.input.cells, { tone: 'white', d: 0.5, stagger: 0.06, peak: 0.8 }), 0);
    tl.add(M.inFlight(g.ghost.cells, d + cols * (lo.stagger ?? 0.06)), 0);
    P.laid = true;
    return tl;
  };
  g.focus = (i, fo = {}) => {
    const tl = gsap.timeline();
    const d = fo.d ?? 0.4;
    if (!P.frameOn) {
      tl.fromTo(g.frame, { autoAlpha: 0, attr: { y: rowY(i) - 8 } }, { autoAlpha: 1, duration: d, ease: 'power2.out', immediateRender: false }, 0);
      M.plan(g.frame, 'y', rowY(i) - 8);
    } else if (P.focus !== i) {
      const fy = M.plan(g.frame, 'y', rowY(i) - 8);
      tl.fromTo(g.frame, { attr: { y: fy } }, { attr: { y: rowY(i) - 8 }, duration: d, ease: 'power3.inOut', immediateRender: false }, 0);
    }
    tl.add(rowOps(k => (k === i ? 1 : (fo.dim ?? 0.3)), d), 0);
    P.focus = i; P.frameOn = true;
    return tl;
  };
  g.unfocus = (uo = {}) => {
    const tl = gsap.timeline();
    const d = uo.d ?? 0.4;
    if (P.frameOn) tl.fromTo(g.frame, { autoAlpha: 1 }, { autoAlpha: 0, duration: d, immediateRender: false }, 0);
    tl.add(rowOps(() => 1, d), 0);
    P.frameOn = false; P.focus = null;
    return tl;
  };
  g.multiply = (i, mo = {}) => {
    const sp = mo.speed ?? 1, st = (mo.stagger ?? 0.28) / sp;
    const tl = gsap.timeline();
    const pre = P.focus === i && P.frameOn ? 0 : 0.4 / sp;
    if (pre) tl.add(g.focus(i, { d: 0.4 / sp }), 0);
    const chips = [], plus = [];
    for (let j = 0; j < cols; j++) {
      const t = pre + j * st;
      const xc = g.lane.cells[j], wc = g.at(i, j);
      const dot = S.circle({ x: xc.cx, y: xc.cy + ch / 2, r: 6.5, fill: 'struct' }, front);
      M.hide(dot);
      tl.fromTo(dot, { autoAlpha: 1, attr: { cy: xc.cy + ch / 2 } }, { attr: { cy: wc.cy }, duration: 0.24 / sp, ease: 'power2.in', immediateRender: false }, t);
      tl.fromTo(dot, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.08 / sp, immediateRender: false }, t + 0.24 / sp);
      tl.add(M.flash(S, [xc], { tone: 'white', d: 0.45 / sp, peak: 0.85 }), t);
      tl.add(M.flash(S, [wc], { tone: 'compute', d: 0.7 / sp, hold: 0.12 / sp }), t + 0.2 / sp);
      const a = M.parse(wc.v), b = M.parse(xc.v);
      const pv = mo.products ? mo.products[j] : (isNaN(a) || isNaN(b) ? '' : Math.round(a * b * 1e6) / 1e6);
      const cp = M.chip(S, M.num(pv, nf), { x: colCx(j), y: laneY, h: pch, size: size - 2, minW: Math.min(cw - 6, pch * 1.6), color: M.textTone(pv, 'compute', o) }, front);
      cp.v = pv;
      const dy = wc.cy - laneY;
      tl.fromTo(cp, { autoAlpha: 0, scale: 0.4, x: 0, y: dy, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, x: 0, y: dy, duration: 0.3 / sp, ease: 'back.out(2.4)', immediateRender: false }, t + 0.26 / sp);
      tl.fromTo(cp, { y: dy }, { y: 0, duration: 0.45 / sp, ease: 'power2.inOut', immediateRender: false }, t + 0.5 / sp);
      tl.add(M.inFlight(cp, 0.72 / sp), t + 0.25 / sp);
      bump(tl, t + 0.26 / sp, { mul: 1, mac: 1, ops: 1 });
      if (j > 0) {
        const px = (colX(j) - gap / 2);
        const pl = S.text('+', { x: px, y: laneY + 1, size: 28, anchor: 'middle', color: 'muted', weight: 500 }, front);
        M.hide(pl);
        tl.fromTo(pl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 / sp, immediateRender: false }, t + 0.8 / sp);
        plus.push(pl);
      }
      chips.push(cp);
    }
    P.chips = { row: i, chips, plus };
    return tl;
  };
  g.accumulate = (i, ao = {}) => {
    const sp = ao.speed ?? 1, st = (ao.stagger ?? 0.5) / sp;
    const tl = gsap.timeline();
    const C = P.chips && P.chips.row === i ? P.chips : null;
    if (!C || !g.acc) return tl;
    if (!P.accOn) {
      tl.fromTo(g.acc, { autoAlpha: 0, scale: 0.8, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.3 / sp, ease: 'back.out(2)', immediateRender: false }, 0);
      P.accOn = true;
    }
    accLabel('0', tl, 0.05 / sp, 0.25 / sp);
    let sum = 0;
    const lift = pch + 10, d = 0.62 / sp;
    C.chips.forEach((cp, k) => {
      const t = 0.3 / sp + k * st;
      const dx = accX - cp.cx;
      tl.fromTo(cp, { y: 0 }, { y: -lift, duration: d * 0.32, ease: 'power2.out', immediateRender: false }, t);
      tl.fromTo(cp, { x: 0 }, { x: dx, duration: d * 0.6, ease: 'power2.inOut', immediateRender: false }, t + d * 0.18);
      tl.fromTo(cp, { y: -lift }, { y: 0, duration: d * 0.25, ease: 'power2.in', immediateRender: false }, t + d * 0.75);
      tl.fromTo(cp, { autoAlpha: 1, scale: 1 }, { autoAlpha: 0, scale: 0.7, duration: d * 0.12, immediateRender: false }, t + d * 0.92);
      tl.add(M.inFlight(cp, d * 1.05), t);
      if (k < C.plus.length && C.plus[k]) tl.fromTo(C.plus[k], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2 / sp, immediateRender: false }, t);
      sum = Math.round((sum + (M.parse(cp.v) || 0)) * 1e6) / 1e6;
      accLabel(M.num(sum, nf), tl, t + d * 0.95, 0.22 / sp);
      tl.add(M.flash(S, [g.acc], { tone: 'compute', d: 0.35 / sp, hold: 0, peak: 0.7 }), t + d * 0.95);
      bump(tl, t + d * 0.95, { add: 1, ops: 1 });
    });
    P.sum = sum;
    return tl;
  };
  g.emit = (i, eo = {}) => {
    const sp = eo.speed ?? 1;
    const tl = gsap.timeline();
    const val = outVals[i];
    const shown = showOut(i) && val !== null && val !== undefined;
    const cp = M.chip(S, shown ? M.num(val, nf) : '', { x: accX, y: laneY, h: ch - 8, size, tone: 'struct', minW: cw - 10, color: M.textTone(val, 'struct', o) }, front);
    const oc = g.output.cells[i];
    const dy = oc.cy - laneY, d = 0.55 / sp;
    tl.fromTo(cp, { autoAlpha: 0, scale: 0.8, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.18 / sp, immediateRender: false }, 0);
    tl.fromTo(cp, { y: 0 }, { y: dy, duration: d, ease: 'power3.inOut', immediateRender: false }, 0.05 / sp);
    tl.fromTo(cp, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.15 / sp, immediateRender: false }, 0.05 / sp + d);
    tl.add(M.inFlight(cp, 0.25 / sp + d), 0);
    tl.add(g.output.set(i, shown ? val : null, { d: 0.3 / sp, tone: 'struct' }), 0.05 / sp + d * 0.85);
    if (P.accText) { tl.fromTo(P.accText, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2 / sp, immediateRender: false }, 0); P.accText = null; }
    if (P.accOn && eo.keepAcc !== true) { tl.fromTo(g.acc, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3 / sp, immediateRender: false }, 0.2 / sp + d); P.accOn = false; }
    return tl;
  };
  g.row = (i, ro = {}) => {
    const tl = gsap.timeline();
    tl.add(g.multiply(i, ro));
    tl.add(g.accumulate(i, ro), '+=' + (0.15 / (ro.speed ?? 1)));
    tl.add(g.emit(i, ro), '-=' + (0.05 / (ro.speed ?? 1)));
    return tl;
  };
  g.pulse = (rs = 'all', po = {}) => {
    const list = rs === 'all' ? [...Array(rows).keys()] : Array.isArray(rs) ? rs : [rs];
    const sp = po.speed ?? 1, st = (po.stagger ?? 0.16) / sp, parallel = po.parallel !== false;
    const tl = gsap.timeline();
    if (P.frameOn) { tl.fromTo(g.frame, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25, immediateRender: false }, 0); P.frameOn = false; P.focus = null; }
    tl.add(rowOps(k => (list.includes(k) ? 1 : M.plan(g.rowsG[k], 'op', undefined, 1)), 0.3), 0);
    const rowDur = cols * st + 0.3 / sp;
    list.forEach((ri, n) => {
      const t0 = 0.15 + (parallel ? 0 : n * (rowDur + 0.12 / sp));
      if (n === 0 || !parallel) tl.add(M.flash(S, g.lane.cells, { tone: 'white', d: 0.35 / sp, stagger: st, peak: 0.8 }), t0);
      tl.add(M.flash(S, g.cells.slice(ri * cols, ri * cols + cols), { tone: 'compute', d: 0.45 / sp, stagger: st, hold: 0.04 / sp }), t0);
      const oc = g.output.cells[ri];
      const dot = S.circle({ x: colX(cols - 1) + cw, y: rowCy(ri), r: 7, fill: 'compute' }, front);
      M.hide(dot);
      const ta = t0 + cols * st;
      tl.fromTo(dot, { autoAlpha: 1, attr: { cx: colX(cols - 1) + cw - 4 } }, { attr: { cx: oc.x + 8 }, duration: 0.2 / sp, ease: 'power1.in', immediateRender: false }, ta - 0.1 / sp);
      tl.fromTo(dot, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.08 / sp, immediateRender: false }, ta + 0.1 / sp);
      const val = outVals[ri];
      const shown = showOut(ri) && val !== null && val !== undefined;
      tl.add(g.output.set(ri, shown ? val : null, { d: 0.3 / sp, tone: 'struct' }), ta + 0.08 / sp);
      tl.add(M.flash(S, [oc], { tone: 'compute', d: 0.4 / sp, hold: 0 }), ta + 0.08 / sp);
      runCounters(tl, t0, { mul: cols, add: cols, mac: cols, ops: 2 * cols }, cols * st);
    });
    return tl;
  };
  g.run = (ro = {}) => {
    const list = !ro.rows || ro.rows === 'all' ? [...Array(rows).keys()] : ro.rows;
    const sp = ro.speed ?? 1, det = Math.min(list.length, ro.detail ?? 1);
    const tl = gsap.timeline();
    list.slice(0, det).forEach(ri => tl.add(g.row(ri, { speed: sp })));
    if (list.length > det) tl.add(g.pulse(list.slice(det), { speed: sp * (ro.fast ?? 3), parallel: ro.parallel !== false }), '+=' + 0.1 / sp);
    if (ro.d) tl.timeScale(tl.duration() / ro.d);
    return tl;
  };
  g.flashAll = (fo = {}) => M.flash(S, g.cells, { tone: 'compute', d: fo.d ?? 0.45, stagger: fo.stagger ?? 0.07, hold: 0.04 });
  return g;
}

/* ------------------------------------------------------------------ libLayerStack */
/**
 * libLayerStack — the model's stack of N transformer layers (80 in ours) as thin slabs: in perspective (a
 * tower of plates with a lid) or flat (a ladder of bars; with dir 'right', a segmented bar of N segments).
 * It can grow (4 slabs fast-forwarding to 80, re-spacing as it fills), run a wave of light up its layers,
 * carry a token up through them (each layer flashing as the token passes), recolour layers, highlight one,
 * and open one: the layers above it lift away (an exploded view), and an inset shows its two parts,
 * 'attention' (first, below) and 'feed-forward' (above).
 * o: x 960 (centre x; dir 'right': left end), y 860 (base: bottom of the lowest slab; dir 'right': centre y),
 *    n 80, shown n (slabs visible at build; .grow reveals the rest), hidden false (nothing visible until
 *    .build), view 'perspective' | 'flat', dir 'up' | 'right' (flat only),
 *    w 380 (slab width; dir 'right': the bar's height, 90), h 560 (extent along the stack; dir 'right': 1400),
 *    maxPitch 72 (widest spacing: a few slabs sit close together; once full, the stack fits h),
 *    thick 16 (perspective) / 14 (flat): thickest slab, skew w*0.2 and depth w*0.2 (the perspective lid),
 *    tone 'struct', texture false (each slab carries its own faint weight-grid texture, seeded per layer),
 *    seed 7, numbers [] (layer numbers printed beside slabs, e.g. [1, 40, 80], or 'ends'), numSide 'left',
 *    label (e.g. '80 layers'; true = `${n} layers`) at labelPos 'below' | 'above' | 'right' | 'left',
 *    detail {x, y, w 430, h 330}: where .open() puts its inset (default: right of the stack),
 *    slots ['attention', 'feed-forward'] (bottom to top), slotSubs [] (second lines), detailTitle
 *    (L => `layer ${L}`). Leave about depth + 30 px above a perspective stack for .open's lift.
 * Returns <g> with .slabs[] (index 0 = layer 1; each {outer, liftG, faces, tex, veil, hot, ring, layer}),
 *    .numEls[], .labelEl, .front (a group above the slabs for your own markers), .detail (after the first
 *    .open: the inset <g> with .panel .attn .ffn .arrow), .geom(), .slabY(L) (centre y of layer L's front
 *    edge, planned layout), .slabX(L) (dir 'right'), .top() (y of the stack's top), .x .y .w .h .n.
 * Helpers (return timelines; call in time order):
 *    .build({d 1.0})                    slabs drop in bottom to top (hidden until then)
 *    .grow(to, {d 1.4, counter})        more slabs fade in at the top and the stack re-spaces to fit;
 *        counter: an S.counter (or any <text>) that shows the count as it grows
 *    .pass({tone 'compute', d 1.2, from 1, to shown, counter})   a wave of light runs up the layers
 *    .climb(el, {d 1.6, from 1, to shown, tone 'compute', flash true, counter, x, enter 60, exit 50})
 *        el (a holder <g> whose content is drawn centred on (0, 0); null = a default token strip) rises from
 *        below the stack to above it, each layer flashing as it passes. The timeline carries .el.
 *    .paint(range, tone, {d 0.4, stagger 0})   recolour layers for good (range of layer numbers: L | [a, b])
 *    .highlight(L, {dim 0.45, d 0.5})   a white outline on layer L, the others darken (dim = their brightness)
 *    .unhighlight({d 0.5})
 *    .open(L, {d 1.0, title, dim 0.45, lift})   highlight L, lift the layers above it (lift px, default
 *        depth + 30 in perspective, 0 flat), and open the inset: leader lines, panel 'layer L', 'attention'
 *        under 'feed-forward' with an arrow between. Open another layer later and it moves over.
 *    .close({d 0.6})                    the inset closes, the stack closes up, the layers undarken
 *    .shimmer({d 1.2, seed})            every slab's texture flickers to a new one (texture: true)
 *    .bracket({from 1, to shown, side 'right', label, tone 'muted', size 28, gap}) -> <g>: a bracket along
 *        the stack, at the planned layout (visible as built: give it an entrance)
 *   const st = libLayerStack(S, { x: 700, y: 900, n: 80, shown: 4, label: '80 layers', numbers: [1, 40, 80], hidden: true });
 *   S.add(st.build(), 'b1~stack');
 *   S.add(st.grow(80, { counter: cnt }), 'b2~eighty');
 *   S.add(st.climb(null, { d: 1.6 }), 'b3~climbs');
 *   S.add(st.open(40), 'b4~attention');
 */
function libLayerStack(S, o = {}, parent) {
  const M = _libModel;
  const n = o.n ?? 80;
  const persp = (o.view || 'perspective') !== 'flat';
  const horiz = !persp && o.dir === 'right';
  const w = o.w ?? (horiz ? 90 : 380);
  const len = o.h ?? (horiz ? 1400 : 560);
  const dx = persp ? (o.skew ?? Math.round(w * 0.2)) : 0, dy = persp ? (o.depth ?? Math.round(w * 0.2)) : 0;
  const X = o.x ?? (horiz ? 260 : 960), Y = o.y ?? (horiz ? 540 : 860);
  const maxPitch = o.maxPitch ?? (horiz ? 60 : 72);
  const thickMax = o.thick ?? (persp ? 16 : 14);
  const tone0 = o.tone || 'struct';
  const shown0 = Math.min(n, o.shown ?? n);
  const x0 = persp ? X - (w + dx) / 2 : X - w / 2;
  const f2 = M.f2;

  function geom(m) {
    const mm = Math.max(1, m);
    let t = thickMax, p = maxPitch;
    for (let k = 0; k < 4; k++) {
      p = mm > 1 ? Math.min(maxPitch, (len - t - dy) / (mm - 1)) : maxPitch;
      t = M.clamp(p * (persp ? 0.5 : 0.56), 2.4, thickMax);
    }
    return { p, t };
  }
  // face shades (mix of the navy base towards the tone), a little brighter towards the top of the stack
  const SH = persp ? { top: 0.2, front: 0.5, side: 0.28 } : { face: 0.46 };
  const colOf = (tone, kind, i) => M.mix(S, M.BASE, tone, M.clamp(SH[kind] * (0.8 + 0.35 * i / Math.max(1, n - 1))));

  const g = S.g(null, parent);
  const back = S.g(null, g), stackG = S.g(null, g), front = S.g(null, g);
  g.back = back; g.front = front;
  const rnd = S.rand(o.seed ?? 7);
  const TC = o.texCols ?? (persp ? 14 : horiz ? 1 : 24), TR = o.texRows ?? (persp ? 4 : horiz ? 8 : 1);
  const TEXOP = [0.07, 0.17, 0.32];
  /** texture path data for one slab, relative to its reference point, in three shade buckets */
  function texPaths(rf, t) {
    const bk = ['', '', ''];
    for (let a = 0; a < TC; a++) for (let b = 0; b < TR; b++) {
      const v = rf();
      const k = v < 0.5 ? 0 : v < 0.82 ? 1 : 2;
      const m = 0.14;
      if (persp) {
        const P = (u, vv) => `${f2(x0 + u * w + vv * dx)},${f2(-vv * dy)}`;
        const u0 = (a + m) / TC, u1 = (a + 1 - m) / TC, v0 = (b + m * 1.3) / TR, v1 = (b + 1 - m * 1.3) / TR;
        bk[k] += `M${P(u0, v0)}L${P(u1, v0)}L${P(u1, v1)}L${P(u0, v1)}Z`;
      } else if (horiz) {
        const yy = Y - w / 2 + (b + m) * w / TR, hh = w / TR * (1 - 2 * m);
        bk[k] += `M${f2(t * 0.2)},${f2(yy)}h${f2(t * 0.6)}v${f2(hh)}h${f2(-t * 0.6)}Z`;
      } else {
        const xx = x0 + (a + m) * w / TC, ww = w / TC * (1 - 2 * m);
        bk[k] += `M${f2(xx)},${f2(t * 0.22)}h${f2(ww)}v${f2(t * 0.56)}h${f2(-ww)}Z`;
      }
    }
    return bk;
  }
  g.slabs = [];
  for (let i = 0; i < n; i++) {
    const outer = S.g(null, stackG), liftG = S.g(null, outer);
    const sl = { outer, liftG, layer: i + 1, i, tone: tone0 };
    if (persp) {
      sl.top = S.path({ d: '', fill: colOf(tone0, 'top', i), stroke: tone0, strokeOpacity: 0.5, sw: 1 }, liftG);
      sl.front = S.path({ d: '', fill: colOf(tone0, 'front', i) }, liftG);
      sl.side = S.path({ d: '', fill: colOf(tone0, 'side', i) }, liftG);
      sl.faces = [[sl.top, 'top'], [sl.front, 'front'], [sl.side, 'side']];
    } else {
      sl.face = S.path({ d: '', fill: colOf(tone0, 'face', i), stroke: tone0, strokeOpacity: 0.45, sw: 1 }, liftG);
      sl.faces = [[sl.face, 'face']];
    }
    if (o.texture) {
      sl.tex = S.g(null, liftG);
      sl.tex.setAttribute('data-audit', 'ignore');
      sl.texPaths = texPaths(rnd, geom(n).t).map((d, k) => S.path({ d, fill: tone0, fillOpacity: TEXOP[k] }, sl.tex));
    }
    sl.veil = S.path({ d: '', fill: M.BASE }, liftG);
    sl.veil.style.opacity = 0;
    M.plan(sl.veil, 'op', 0);
    sl.hot = S.path({ d: '', fill: 'compute', fillOpacity: 0.55, stroke: 'compute', sw: 1.5 }, liftG);
    sl.hot.style.opacity = 0; sl.hotTone = 'compute';
    sl.ring = S.path({ d: '', stroke: '#ffffff', sw: 2.5, strokeOpacity: 0.95 }, liftG);
    sl.ring.style.opacity = 0;
    if (i >= shown0 || o.hidden) M.hide(outer);
    g.slabs.push(sl);
  }
  const numList = o.numbers === 'ends' ? [1, n] : (o.numbers || []);
  g.numEls = numList.map(L => {
    const t = S.text(String(L), { x: 0, y: 0, size: o.numSize ?? 24, family: 'mono', color: 'muted', anchor: horiz ? 'middle' : (o.numSide === 'right' ? 'start' : 'end') }, front);
    t.layer = L;
    if (L > shown0 || o.hidden) M.hide(t);
    return t;
  });

  /** slab i (0-based) at pitch p, thickness t, with the slabs from index sL up lifted by lift px */
  function slabBox(i, p, t, sL = n, lift = 0) {
    if (horiz) return { x: X + i * p + (i >= sL ? lift : 0), y: Y - w / 2, t };
    return { x: x0, y: Y - t - i * p - (i >= sL ? lift : 0), t };
  }
  function layout(m, sL = n, lift = 0) {
    const { p, t } = geom(m);
    g.slabs.forEach((sl, i) => {
      const b = slabBox(i, p, t, sL, lift);
      let sil;
      if (persp) {
        const yT = b.y;
        sl.top.setAttribute('d', `M${f2(x0)},${f2(yT)}L${f2(x0 + w)},${f2(yT)}L${f2(x0 + w + dx)},${f2(yT - dy)}L${f2(x0 + dx)},${f2(yT - dy)}Z`);
        sl.front.setAttribute('d', `M${f2(x0)},${f2(yT)}h${f2(w)}v${f2(t)}h${f2(-w)}Z`);
        sl.side.setAttribute('d', `M${f2(x0 + w)},${f2(yT)}L${f2(x0 + w + dx)},${f2(yT - dy)}v${f2(t)}L${f2(x0 + w)},${f2(yT + t)}Z`);
        sil = `M${f2(x0)},${f2(yT + t)}L${f2(x0)},${f2(yT)}L${f2(x0 + dx)},${f2(yT - dy)}L${f2(x0 + w + dx)},${f2(yT - dy)}L${f2(x0 + w + dx)},${f2(yT - dy + t)}L${f2(x0 + w)},${f2(yT + t)}Z`;
        if (sl.tex) sl.tex.setAttribute('transform', `translate(0,${f2(yT)})`);
      } else if (horiz) {
        sil = M.rr(b.x, b.y, t, w, Math.min(t / 2, 5));
        sl.face.setAttribute('d', sil);
        if (sl.tex) sl.tex.setAttribute('transform', `translate(${f2(b.x)},0)`);
      } else {
        sil = M.rr(x0, b.y, w, t, Math.min(t / 2, 6));
        sl.face.setAttribute('d', sil);
        if (sl.tex) sl.tex.setAttribute('transform', `translate(0,${f2(b.y)})`);
      }
      sl.hot.setAttribute('d', sil); sl.ring.setAttribute('d', sil); sl.veil.setAttribute('d', sil);
    });
    g.numEls.forEach(te => {
      const b = slabBox(te.layer - 1, p, t, sL, lift);
      if (horiz) { te.setAttribute('x', f2(b.x + t / 2)); te.setAttribute('y', f2(Y + w / 2 + 26)); }
      else {
        const right = o.numSide === 'right';
        te.setAttribute('x', f2(right ? x0 + w + dx + 18 : x0 - 18));
        te.setAttribute('y', f2(b.y + t / 2 + (persp && right ? -dy / 2 : 0) + 1));
      }
    });
  }
  const P = { shown: shown0, sL: n, lift: 0 };
  layout(shown0);
  const box = L => { const { p, t } = geom(P.shown); return slabBox(L - 1, p, t, P.sL, P.lift); };
  g.geom = () => ({ ...geom(P.shown), dx, dy, x0, w, n, shown: P.shown, lift: P.lift });
  g.slabY = L => (horiz ? Y : box(L).y + box(L).t / 2);
  g.slabX = L => (horiz ? box(L).x + box(L).t / 2 : X);
  g.top = () => (horiz ? Y - w / 2 : box(P.shown).y - dy);
  if (o.label) {
    const text = o.label === true ? `${n} layers` : o.label;
    const lp = o.labelPos || 'below', ls = o.labelSize ?? 28;
    const { p, t } = geom(n);
    const topY = horiz ? Y - w / 2 : Y - t - (n - 1) * p - dy;
    const L = horiz
      ? { below: [X + ((n - 1) * p + t) / 2, Y + w / 2 + (numList.length ? 66 : 40), 'middle'], above: [X + ((n - 1) * p + t) / 2, Y - w / 2 - 32, 'middle'], left: [X - 24, Y, 'end'], right: [X + (n - 1) * p + t + 24, Y, 'start'] }[lp]
      : { below: [X + dx / 2, Y + 40, 'middle'], above: [X + dx / 2, topY - 34, 'middle'], right: [x0 + w + dx + (o.numSide === 'right' && numList.length ? 80 : 26), (Y + topY) / 2, 'start'], left: [x0 - (o.numSide !== 'right' && numList.length ? 80 : 26), (Y + topY) / 2, 'end'] }[lp];
    g.labelEl = S.text(text, { x: L[0], y: L[1], size: ls, anchor: L[2], color: o.labelColor || 'muted', weight: 600 }, front);
    if (o.hidden) M.hide(g.labelEl);
  }
  Object.assign(g, { x: X, y: Y, w, h: len, n, dx, dy, x0 });

  const layers = range => {
    if (range === undefined || range === 'all') return [...Array(n).keys()];
    if (typeof range === 'number') return range >= 1 && range <= n ? [range - 1] : [];
    const a = Math.max(1, range[0]), b = Math.min(n, range[1] ?? range[0]);
    const out = [];
    for (let i = a; i <= b; i++) out.push(i - 1);
    return out;
  };
  const setCount = (c, v) => { if (c) c.textContent = (c.__prefix || '') + (c.__fmt || S.fmt.int)(v) + (c.__suffix || ''); };
  const flashSlab = (tl, i, t, tone, d = 0.55) => {
    const sl = g.slabs[i];
    if (sl.hotTone !== tone) { sl.hot.setAttribute('fill', S.tone(tone)); sl.hot.setAttribute('stroke', S.tone(tone)); sl.hotTone = tone; }
    tl.fromTo(sl.hot, { opacity: 0 }, { opacity: 1, duration: d * 0.22, ease: 'power2.out', immediateRender: false }, t);
    tl.fromTo(sl.hot, { opacity: 1 }, { opacity: 0, duration: d * 0.78, ease: 'power2.in', immediateRender: false }, t + d * 0.22);
  };

  g.build = (bo = {}) => {
    const tl = gsap.timeline();
    const list = g.slabs.slice(0, P.shown).map(s => s.outer);
    const d = bo.d ?? 1.0;
    const st = Math.min(0.12, d * 0.6 / Math.max(1, list.length));
    tl.fromTo(list, { autoAlpha: 0, y: -26 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: st }, 0);
    const extra = [...g.numEls.filter(t => t.layer <= P.shown), g.labelEl].filter(Boolean);
    if (extra.length) tl.fromTo(extra, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, Math.min(d * 0.6, st * list.length));
    return tl;
  };
  g.grow = (to, go = {}) => {
    const from = P.shown, sL = P.sL, lift = P.lift;
    to = Math.min(n, to);
    P.shown = to;
    const c = go.counter;
    const apply = m => {
      layout(m, sL, lift);
      for (let i = from; i < n; i++) {
        const a = M.clamp(m - i, 0, 1), e = g.slabs[i].outer;
        e.style.opacity = a; e.style.visibility = a > 0 ? 'inherit' : 'hidden';
      }
      g.numEls.forEach(te => { if (te.layer > from) { const a = M.clamp(m - te.layer + 1, 0, 1); te.style.opacity = a; te.style.visibility = a > 0 ? 'inherit' : 'hidden'; } });
      setCount(c, Math.round(m));
    };
    const pr = { m: from };
    return gsap.fromTo(pr, { m: from }, {
      m: to, duration: go.d ?? 1.4, ease: go.ease || 'power2.inOut', immediateRender: false,
      onStart: () => apply(pr.m), onUpdate: () => apply(pr.m), onReverseComplete: () => apply(from),
    });
  };
  g.pass = (po = {}) => {
    const tl = gsap.timeline();
    const a = (po.from ?? 1) - 1, b = (po.to ?? P.shown) - 1, d = po.d ?? 1.2;
    const cnt = Math.max(1, b - a);
    const fd = po.flashD ?? M.clamp(d * 0.3, 0.16, 0.55);
    for (let i = a; i <= b; i++) flashSlab(tl, i, (i - a) / cnt * d, po.tone || 'compute', fd);
    if (po.counter) tl.add(M.drive(d, q => setCount(po.counter, Math.round(a + 1 + (b - a) * q))), 0);
    return tl;
  };
  g.climb = (el, co = {}) => {
    const tl = gsap.timeline();
    const a = (co.from ?? 1) - 1, b = (co.to ?? P.shown) - 1, d = co.d ?? 1.6;
    let holder = el;
    if (!holder) {
      holder = S.g(null, front);
      const tv = libVector(S, { style: 'heat', n: 12, cw: 15, ch: 34, gap: 2, x: 0, y: 0, seed: co.seed ?? 5 }, holder);
      const rim = S.rect({ x: tv.l - 6, y: tv.t - 6, w: tv.w + 12, h: tv.h + 12, r: 9, fill: M.BASE, stroke: '#ffffff', sw: 2, strokeOpacity: 0.85 }, holder);
      holder.insertBefore(rim, holder.firstChild);
      holder.vec = tv;
    }
    const tone = co.tone || 'compute';
    const fd = co.flashD ?? M.clamp(d * 0.22, 0.14, 0.5);
    if (horiz) {
      const xs = g.slabX(a + 1) - (co.enter ?? 70), xe = g.slabX(b + 1) + (co.exit ?? 70), yy = co.y ?? Y;
      S.xset(holder, { x: xs, y: yy, s: 1 });
      M.hide(holder);
      tl.fromTo(holder, { autoAlpha: 0 }, { autoAlpha: 1, duration: Math.min(0.25, d * 0.12), immediateRender: false }, 0);
      tl.add(S.fx.xform(holder, { x: xe }, { d, ease: 'none' }), 0);
      tl.add(M.inFlight(holder, d), 0);
      if (co.flash !== false) for (let i = a; i <= b; i++) flashSlab(tl, i, (g.slabX(i + 1) - xs) / (xe - xs) * d - fd * 0.15, tone, fd);
      if (co.counter) {
        const sx = g.slabs.map((s, i) => g.slabX(i + 1));
        tl.add(M.drive(d, q => { const xn = xs + (xe - xs) * q; let L = a; for (let i = a; i <= b; i++) if (sx[i] <= xn) L = i; setCount(co.counter, L + 1); }), 0);
      }
    } else {
      const xx = co.x ?? (persp ? X + dx / 2 : X);
      const ys = Y + (co.enter ?? 60), ye = g.top() - (co.exit ?? 50);
      S.xset(holder, { x: xx, y: ys, s: 1 });
      M.hide(holder);
      tl.fromTo(holder, { autoAlpha: 0 }, { autoAlpha: 1, duration: Math.min(0.25, d * 0.12), immediateRender: false }, 0);
      tl.add(S.fx.xform(holder, { y: ye }, { d, ease: 'none' }), 0);
      tl.add(M.inFlight(holder, d), 0);
      if (co.flash !== false) for (let i = a; i <= b; i++) flashSlab(tl, i, Math.max(0, (ys - g.slabY(i + 1)) / (ys - ye) * d - fd * 0.15), tone, fd);
      if (co.counter) {
        const sy = g.slabs.map((s, i) => g.slabY(i + 1));
        tl.add(M.drive(d, q => { const yn = ys + (ye - ys) * q; let L = a; for (let i = a; i <= b; i++) if (sy[i] >= yn) L = i; setCount(co.counter, L + 1); }), 0);
      }
    }
    tl.el = holder;
    return tl;
  };
  g.paint = (range, tone, po = {}) => {
    const tl = gsap.timeline();
    const d = po.d ?? 0.4, st = po.stagger ?? 0;
    layers(range).forEach((i, k) => {
      const sl = g.slabs[i], prev = sl.tone;
      sl.faces.forEach(([f, kind]) => {
        tl.fromTo(f, { attr: { fill: colOf(prev, kind, i) } }, { attr: { fill: colOf(tone, kind, i) }, duration: d, ease: 'power1.inOut', immediateRender: false }, k * st);
        if (kind === 'top' || kind === 'face') tl.fromTo(f, { attr: { stroke: S.tone(prev) } }, { attr: { stroke: S.tone(tone) }, duration: d, immediateRender: false }, k * st);
      });
      if (sl.texPaths) tl.fromTo(sl.texPaths, { attr: { fill: S.tone(prev) } }, { attr: { fill: S.tone(tone) }, duration: d, immediateRender: false }, k * st);
      sl.tone = tone;
    });
    return tl;
  };
  const HL = { on: null };
  const veilTo = (tl, i, op, d) => {
    const v = g.slabs[i].veil, from = M.plan(v, 'op', op, 0);
    if (from !== op) tl.fromTo(v, { opacity: from }, { opacity: op, duration: d, ease: 'power2.out', immediateRender: false }, 0);
  };
  g.highlight = (L, ho = {}) => {
    const tl = gsap.timeline();
    const d = ho.d ?? 0.5, dim = ho.dim ?? 0.45;
    g.slabs.forEach((sl, i) => veilTo(tl, i, i === L - 1 ? 0 : M.f2(1 - dim), d));
    if (HL.on !== null && HL.on !== L - 1) tl.fromTo(g.slabs[HL.on].ring, { opacity: 1 }, { opacity: 0, duration: d * 0.6, immediateRender: false }, 0);
    if (HL.on !== L - 1) tl.fromTo(g.slabs[L - 1].ring, { opacity: 0 }, { opacity: 1, duration: d, immediateRender: false }, 0);
    HL.on = L - 1;
    return tl;
  };
  g.unhighlight = (uo = {}) => {
    const tl = gsap.timeline();
    const d = uo.d ?? 0.5;
    g.slabs.forEach((sl, i) => veilTo(tl, i, 0, d));
    if (HL.on !== null) tl.fromTo(g.slabs[HL.on].ring, { opacity: 1 }, { opacity: 0, duration: d * 0.6, immediateRender: false }, 0);
    HL.on = null;
    return tl;
  };
  /** the layers from index sL up lift by `lift` px (and back with lift 0) */
  const liftTo = (sL, lift, d) => {
    const s0 = P.sL, l0 = P.lift, m = P.shown;
    P.sL = lift ? sL : n; P.lift = lift;
    // moving the gap from one layer to another: close the old one while opening the new one
    const pr = { v: 0 };
    const apply = v => {
      if (s0 === sL || !l0) layout(m, lift ? sL : s0, l0 + (lift - l0) * v);
      else {
        // two gaps at once: approximate by shifting each slab by the sum of the gaps below it
        const { p, t } = geom(m);
        layout(m, n, 0);
        g.slabs.forEach((sl, i) => {
          const off = (i >= s0 ? l0 * (1 - v) : 0) + (i >= sL ? lift * v : 0);
          sl.liftG.setAttribute('transform', `translate(0,${f2(-off)})`);
        });
        g.numEls.forEach(te => { const i = te.layer - 1; const b = slabBox(i, p, t); te.setAttribute('y', f2(b.y + t / 2 + 1 - ((i >= s0 ? l0 * (1 - v) : 0) + (i >= sL ? lift * v : 0)))); });
        if (v >= 1) { g.slabs.forEach(sl => sl.liftG.removeAttribute('transform')); layout(m, sL, lift); }
      }
    };
    return gsap.fromTo(pr, { v: 0 }, {
      v: 1, duration: d, ease: 'power3.inOut', immediateRender: false,
      onStart: () => apply(pr.v), onUpdate: () => apply(pr.v),
      onReverseComplete: () => { g.slabs.forEach(sl => sl.liftG.removeAttribute('transform')); layout(m, s0, l0); },
    });
  };
  const DT = { built: false, open: false, leaders: null, title: null };
  function buildDetail() {
    const sx = horiz ? X + (n - 1) * maxPitch : x0 + w + dx;
    const D = { w: 430, h: 330, ...(o.detail || {}) };
    D.x = D.x ?? Math.min(1824 - D.w, sx + 130);
    D.y = D.y ?? Math.max(130, Math.min(1000 - D.h, (horiz ? Y : (Y + g.top()) / 2) - D.h / 2));
    const dg = S.g(null, front);
    dg.panel = S.card({ x: D.x, y: D.y, w: D.w, h: D.h, tone: 'neutral', title: '' }, dg);
    const pad = 22, titleH = 62, arrowH = 34;
    const chh = (D.h - titleH - pad - arrowH) / 2;
    const slots = o.slots || ['attention', 'feed-forward'], subs = o.slotSubs || [];
    const yF = D.y + titleH, yA = yF + chh + arrowH;
    dg.ffn = S.card({ x: D.x + pad, y: yF, w: D.w - 2 * pad, h: chh, tone: 'struct', title: slots[1], sub: subs[1], size: 30, r: 14 }, dg);
    dg.attn = S.card({ x: D.x + pad, y: yA, w: D.w - 2 * pad, h: chh, tone: 'struct', title: slots[0], sub: subs[0], size: 30, r: 14 }, dg);
    const ax = D.x + D.w / 2;
    dg.arrow = S.arrow({ x1: ax, y1: yA - 5, x2: ax, y2: yF + chh + 5, color: 'muted', sw: 2.5, head: 10 }, dg);
    M.hide(dg);
    Object.assign(dg, D);
    g.detail = dg;
    DT.built = true;
  }
  g.open = (L, oo = {}) => {
    if (!DT.built) buildDetail();
    const tl = gsap.timeline();
    const d = oo.d ?? 1.0;
    tl.add(g.highlight(L, { dim: oo.dim ?? 0.45, d: d * 0.5 }), 0);
    const lift = oo.lift ?? (persp ? dy + 30 : 0);
    if (lift || P.lift) tl.add(liftTo(L, lift, d * 0.6), 0);
    const D = g.detail;
    const b = box(L), t = b.t;
    let a1, a2;
    if (horiz) { a1 = [b.x + t, b.y]; a2 = [b.x + t, b.y + w]; }
    else if (persp) { a1 = [x0 + w + dx, b.y - dy]; a2 = [x0 + w, b.y + t]; }
    else { a1 = [x0 + w, b.y]; a2 = [x0 + w, b.y + t]; }
    const lg = S.g(null, back);
    const wedge = S.path({ d: `M${f2(a1[0])},${f2(a1[1])}L${f2(D.x)},${f2(D.y + 12)}L${f2(D.x)},${f2(D.y + D.h - 12)}L${f2(a2[0])},${f2(a2[1])}Z`, fill: '#ffffff', fillOpacity: 0.04 }, lg);
    const l1 = S.line({ x1: a1[0], y1: a1[1], x2: D.x, y2: D.y + 12, stroke: 'muted', sw: 1.5, strokeOpacity: 0.6 }, lg);
    const l2 = S.line({ x1: a2[0], y1: a2[1], x2: D.x, y2: D.y + D.h - 12, stroke: 'muted', sw: 1.5, strokeOpacity: 0.6 }, lg);
    M.hide(wedge); M.hide(l1); M.hide(l2);
    if (DT.leaders) tl.fromTo(DT.leaders, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25, immediateRender: false }, 0);
    DT.leaders = lg;
    tl.fromTo([l1, l2], { drawSVG: '0%', autoAlpha: 1 }, { drawSVG: '100%', autoAlpha: 1, duration: d * 0.45, ease: 'power2.inOut', immediateRender: false }, d * 0.5);
    tl.fromTo(wedge, { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.45, immediateRender: false }, d * 0.6);
    const title = S.text(oo.title ?? (o.detailTitle ? o.detailTitle(L) : `layer ${L}`), { x: D.x + 24, y: D.y + 34, size: 28, weight: 650, color: 'ink' }, D);
    M.hide(title);
    if (DT.title) tl.fromTo(DT.title, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, immediateRender: false }, 0);
    DT.title = title;
    if (!DT.open) {
      tl.fromTo(D, { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: d * 0.5, ease: 'power3.out', immediateRender: false }, d * 0.55);
      tl.fromTo([D.attn, D.arrow, D.ffn], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: d * 0.4, stagger: d * 0.1, ease: 'power3.out', immediateRender: false }, d * 0.65);
    }
    tl.fromTo(title, { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.35, immediateRender: false }, d * 0.6);
    DT.open = true;
    return tl;
  };
  g.close = (co = {}) => {
    const tl = gsap.timeline();
    const d = co.d ?? 0.6;
    if (DT.open) {
      tl.fromTo([g.detail, DT.leaders], { autoAlpha: 1 }, { autoAlpha: 0, duration: d * 0.6, immediateRender: false }, 0);
      DT.open = false; DT.leaders = null;
    }
    if (P.lift) tl.add(liftTo(n, 0, d), d * 0.2);
    tl.add(g.unhighlight({ d }), d * 0.2);
    return tl;
  };
  g.shimmer = (so = {}) => {
    const tl = gsap.timeline();
    if (!o.texture) return tl;
    const r2 = S.rand(so.seed ?? 31), d = so.d ?? 1.2;
    const { t } = geom(P.shown);
    g.slabs.forEach((sl, i) => {
      if (i >= P.shown) return;
      const ng = S.g(null, sl.tex);
      const np = texPaths(r2, t).map((pd, k) => S.path({ d: pd, fill: sl.tone, fillOpacity: TEXOP[k] }, ng));
      ng.style.opacity = 0;
      const at = r2() * d * 0.6;
      tl.fromTo(ng, { opacity: 0 }, { opacity: 1, duration: d * 0.4, immediateRender: false }, at);
      tl.fromTo(sl.texPaths, { opacity: 1 }, { opacity: 0, duration: d * 0.4, immediateRender: false }, at);
      sl.texPaths = np;
    });
    return tl;
  };
  g.bracket = (bo = {}) => {
    const a = bo.from ?? 1, b = bo.to ?? P.shown;
    const bg = S.g(null, front);
    const tone = bo.tone || 'muted', size = bo.size ?? 28, dd = 14;
    const A = box(a), B = box(b);
    if (horiz) {
      const xa = A.x, xb = B.x + B.t, yb = Y - w / 2 - 16;
      bg.line = S.path({ d: `M${f2(xa)},${f2(yb)} l0,${-dd} L${f2(xb)},${f2(yb - dd)} l0,${dd}`, stroke: tone, sw: 2.5 }, bg);
      if (bo.label) bg.label = S.text(bo.label, { x: (xa + xb) / 2, y: yb - dd - 26, size, anchor: 'middle', color: tone, weight: 600 }, bg);
      return bg;
    }
    const yb = A.y + A.t, yt = B.y - (persp ? dy : 0);
    const right = (bo.side || 'right') === 'right';
    const xb = right ? x0 + w + dx + (bo.gap ?? (o.numSide === 'right' && g.numEls.length ? 70 : 22)) : x0 - (bo.gap ?? (o.numSide !== 'right' && g.numEls.length ? 70 : 22));
    const s = right ? 1 : -1;
    bg.line = S.path({ d: `M${f2(xb)},${f2(yb)} l${s * dd},0 L${f2(xb + s * dd)},${f2(yt)} l${-s * dd},0`, stroke: tone, sw: 2.5 }, bg);
    if (bo.label) bg.label = S.text(bo.label, { x: xb + s * (dd + 16), y: (yb + yt) / 2, size, anchor: right ? 'start' : 'end', color: tone, weight: 600 }, bg);
    return bg;
  };
  return g;
}

/* ------------------------------------------------------------------ libAttention */
/**
 * libAttention — attention, drawn on the tokens themselves: a row of token chips; the asking token's query
 * reaches back to every earlier token's key along amber arcs; the arcs thicken with the weights (labels and
 * optional bars under each key, to scale); the values flow back along the arcs, in proportion, and blend
 * into the asking token. With causal on, tokens after the query sit behind a mask wall and no arc reaches
 * them (.probe shows one trying).
 * o: x 960, y 600 (centre of the token row), tokens ['the', 'cat', 'sat', 'down', 'it'], query (index,
 *    default the last), weights [] (per token; null/undefined = none, e.g. [0.05, 0.62, 0.28, 0.05, null]),
 *    causal true (keys = tokens before the query; false = every other token), self false (an arc from the
 *    query to itself, weight weights[query]),
 *    size 30, gap 26 (between chips), w (fixed chip width), state 'token' (libToken state),
 *    arcMax 230 (tallest arc), tone 'compute' (arcs), valueTone 'struct' (blended values),
 *    wfmt 'pct' ('62%') | 'dec' ('0.62') | (w) => str, labels true (weight labels under the keys),
 *    bars false | true: amber bars under each key, to scale (barMax 110 px, barW 26),
 *    queryLabel ('asks', under the query), maskLabel 'mask' (the wall's label),
 *    qkv false | true: small Q / K / V badges under the chips (Q on the query, K and V on the keys).
 * Returns <g> with .tokens[] (libToken chips; .cx .l .r .t .b), .arcs[] (per token index; .path, .len),
 *    .selfArc, .labels[] (weight texts), .bars[], .wall, .wallLabel, .queryLabelEl, .badges[], and
 *    .x .y .w .l .r .chipH .arcTop (y of the tallest arc).
 * Helpers (return timelines; call in time order):
 *    .in({stagger 0.08})             the chips pop in (hidden until then)
 *    .ask({d 0.7, stagger 0.08})     faint arcs draw from the query back to each key, nearest first
 *    .weigh(weights?, {d 0.7})       arcs thicken/brighten with the weights; labels (and bars) appear;
 *        call again with new weights to re-weigh
 *    .blend({d 1.1, into 'new'})     a blue drop per key, sized by its weight, runs back along its arc into
 *        the query, which pulses (and takes libToken state `into`, if given)
 *    .mask({d 0.6})                  tokens after the query dim, the mask wall draws between them
 *    .probe(j, {d 1.2})              a grey arc from the query towards future token j stops at the wall
 *    .clear({d 0.4})                 arcs, labels and bars fade out
 *   const at = libAttention(S, { tokens: ['the', 'cat', 'sat', 'down', 'it'], weights: [0.05, 0.62, 0.28, 0.05], bars: true, y: 640 });
 *   S.add(at.in(), 'b1~cat');
 *   S.add(at.ask(), 'b1~meets');
 *   S.add(at.weigh(), 'b3~Softmax');
 *   S.add(at.blend(), 'b4~blend');
 */
function libAttention(S, o = {}, parent) {
  const M = _libModel;
  const toks = o.tokens || ['the', 'cat', 'sat', 'down', 'it'];
  const n = toks.length, q = o.query ?? n - 1;
  const size = o.size ?? 30, gap = o.gap ?? 26;
  const chH = Math.round(size * 1.85), padX = Math.round(size * 0.62);
  const widths = toks.map(t => o.w || Math.max(chH * 1.25, S.measure(String(t).trim(), { size, weight: 600 }) + 2 * padX));
  const causal = o.causal !== false;
  const wallGap = causal && q < n - 1 ? (o.maskGap ?? 56) : 0;
  const total = widths.reduce((a, b) => a + b, 0) + gap * (n - 1) + wallGap;
  const cx0 = o.x ?? 960, y = o.y ?? 600;
  const g = S.g(null, parent);
  const arcG = S.g(null, g), tokG = S.g(null, g), under = S.g(null, g), front = S.g(null, g);
  let xl = cx0 - total / 2;
  g.tokens = toks.map((t, i) => {
    const cx = xl + widths[i] / 2;
    xl += widths[i] + gap + (i === q ? wallGap : 0);
    const tk = typeof libToken === 'function'
      ? libToken(S, { text: t, x: cx, y, size, h: chH, w: widths[i], state: o.state || 'token' }, tokG)
      : S.pill(String(t).trim(), { x: cx, y, h: chH, size, w: widths[i] }, tokG);
    Object.assign(tk, { cx, l: cx - widths[i] / 2, r: cx + widths[i] / 2, t: y - chH / 2, b: y + chH / 2, i });
    return tk;
  });
  const tone = o.tone || 'compute';
  const arcMax = o.arcMax ?? 230;
  const ya = y - chH / 2 - 8;
  const keys = [...Array(n).keys()].filter(j => j !== q && (!causal || j < q));
  const arcPath = (xa, xb, hh) => `M${M.f2(xa)},${M.f2(ya)} C${M.f2(xa + (xb - xa) * 0.08)},${M.f2(ya - hh)} ${M.f2(xb - (xb - xa) * 0.08)},${M.f2(ya - hh)} ${M.f2(xb)},${M.f2(ya)}`;
  const hOf = dist => Math.min(arcMax, 46 + dist * 0.42);
  const qx = g.tokens[q].cx, qhw = widths[q] / 2;
  // arcs leave the query's top edge spread out: the farthest from the middle, the nearest outermost, so they never cross
  const startX = j => {
    const side = g.tokens[j].cx < qx ? -1 : 1;
    const same = keys.filter(k => (g.tokens[k].cx < qx ? -1 : 1) === side).sort((a, b) => Math.abs(g.tokens[b].cx - qx) - Math.abs(g.tokens[a].cx - qx));
    const lo = o.self ? 16 : 6, hi = Math.max(lo + 2, qhw * 0.78);
    const rank = same.indexOf(j);
    return qx + side * (same.length > 1 ? lo + (hi - lo) * rank / (same.length - 1) : (lo + hi) / 2);
  };
  g.arcs = [];
  keys.forEach(j => {
    const xb = g.tokens[j].cx;
    const pth = S.path({ d: arcPath(startX(j), xb, hOf(Math.abs(xb - qx))), stroke: tone, sw: 2, strokeOpacity: 1 }, arcG);
    pth.style.opacity = 0;
    pth.len = pth.getTotalLength();
    pth.j = j;
    M.plan(pth, 'sw', 2); M.plan(pth, 'op', 0.55);
    g.arcs[j] = pth;
  });
  if (o.self) {
    const sp = S.path({ d: `M${M.f2(qx - 12)},${M.f2(ya)} C${M.f2(qx - 58)},${M.f2(ya - 92)} ${M.f2(qx + 58)},${M.f2(ya - 92)} ${M.f2(qx + 12)},${M.f2(ya)}`, stroke: tone, sw: 2 }, arcG);
    sp.style.opacity = 0; sp.len = sp.getTotalLength(); sp.j = q;
    M.plan(sp, 'sw', 2); M.plan(sp, 'op', 0.55);
    g.selfArc = sp;
    g.arcs[q] = sp;
  }
  const allArcs = () => g.arcs.filter(Boolean);
  g.arcTop = ya - Math.max(0, ...allArcs().map(a => (a === g.selfArc ? 70 : hOf(Math.abs(g.tokens[a.j].cx - qx)) * 0.75)));
  // under the chips: bars, weight labels, query label, badges
  const chipB = y + chH / 2;
  let rowY = chipB + 18;
  if (o.qkv) {
    g.badges = [];
    const by = chipB + 30;
    g.tokens.forEach((tk, i) => {
      const lets = i === q ? ['Q'] : (keys.includes(i) || !causal ? ['K', 'V'] : []);
      lets.forEach((L, k) => {
        const bx = tk.cx + (lets.length === 2 ? (k ? 22 : -22) : 0);
        const bg = S.g(null, under);
        S.rect({ x: bx - 18, y: by - 18, w: 36, h: 36, r: 8, fill: M.BASE }, bg);
        S.rect({ x: bx - 18, y: by - 18, w: 36, h: 36, r: 8, fill: L === 'Q' ? 'url(#solid-struct)' : 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.8, sw: 1.5 }, bg);
        S.text(L, { x: bx, y: by + 1, size: 24, weight: 700, anchor: 'middle', color: L === 'Q' ? '#0a0f1e' : 'ink' }, bg);
        bg.letter = L; bg.i = i;
        g.badges.push(bg);
      });
    });
    rowY = by + 34;
  }
  const barMax = o.barMax ?? 110, barW = o.barW ?? 26;
  const labY = o.bars ? rowY + barMax + 28 : rowY + 16;
  const wf = typeof o.wfmt === 'function' ? o.wfmt : o.wfmt === 'dec' ? (v => M.num(Math.round(v * 100) / 100, { dp: 2 }).replace(/^0(?=\.)/, '')) : (v => `${Math.round(v * 100)}%`);
  g.labels = []; g.bars = [];
  if (o.bars) {
    keys.concat(o.self ? [q] : []).forEach(j => {
      const tk = g.tokens[j];
      const tr = S.rect({ x: tk.cx - barW / 2, y: rowY, w: barW, h: barMax, r: 6, fill: '#ffffff', fillOpacity: 0.04, stroke: '#ffffff', strokeOpacity: 0.08, sw: 1 }, under);
      const b = S.rect({ x: tk.cx - barW / 2, y: rowY + barMax, w: barW, h: 0.01, r: 4, fill: 'url(#solid-compute)' }, under);
      b.style.opacity = 0; tr.style.opacity = 0;
      b.track = tr; b.j = j;
      M.plan(b, 'h', 0);
      g.bars[j] = b;
    });
  }
  if (o.queryLabel) {
    g.queryLabelEl = S.text(o.queryLabel, { x: qx, y: labY, size: o.labelSize ?? 26, anchor: 'middle', color: 'muted', weight: 550 }, under);
  }
  // the mask wall
  const fut = [...Array(n).keys()].filter(j => j > q);
  if (causal && fut.length) {
    const wx = (g.tokens[q].r + g.tokens[q + 1].l) / 2;
    g.wall = S.line({ x1: wx, y1: g.arcTop + 30, x2: wx, y2: chipB + 14, stroke: 'muted', sw: 2.5, dash: '7 7', strokeOpacity: 0.85 }, front);
    g.wallLabel = S.text(o.maskLabel ?? 'mask', { x: wx, y: g.arcTop + 2, size: 26, anchor: 'middle', color: 'muted', weight: 600 }, front);
    M.hide(g.wall); M.hide(g.wallLabel);
    g.wallX = wx;
  }
  Object.assign(g, { x: cx0, y, w: total, l: cx0 - total / 2, r: cx0 + total / 2, chipH: chH, query: q, keys });

  const P = { weights: o.weights ? o.weights.slice() : null, labels: [] };
  g.in = (io = {}) => {
    const tl = gsap.timeline();
    tl.fromTo(g.tokens, { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: io.d ?? 0.5, ease: 'back.out(2.2)', stagger: io.stagger ?? 0.08, transformOrigin: '50% 50%' }, 0);
    tl.add(M.inFlight(g.tokens, (io.d ?? 0.5) + (io.stagger ?? 0.08) * n), 0);
    const extra = [...(g.badges || []), g.queryLabelEl].filter(Boolean);
    if (extra.length) tl.fromTo(extra, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.03 }, (io.stagger ?? 0.08) * n);
    return tl;
  };
  g.ask = (ao = {}) => {
    const tl = gsap.timeline();
    const list = allArcs().slice().sort((a, b) => Math.abs(g.tokens[a.j].cx - qx) - Math.abs(g.tokens[b.j].cx - qx));
    list.forEach((a, k) => {
      tl.fromTo(a, { opacity: 0.55, drawSVG: '0%' }, { opacity: 0.55, drawSVG: '100%', duration: ao.d ?? 0.7, ease: 'power2.inOut', immediateRender: false }, k * (ao.stagger ?? 0.08));
    });
    tl.add(S.fx.pulse(g.tokens[q], { scale: 1.06, d: 0.4 }), 0);
    return tl;
  };
  g.weigh = (ws, wo = {}) => {
    const W = ws || P.weights || [];
    P.weights = W.slice();
    const tl = gsap.timeline();
    const d = wo.d ?? 0.7;
    const wmax = Math.max(1e-9, ...allArcs().map(a => W[a.j] || 0));
    allArcs().forEach(a => {
      const wv = W[a.j] || 0;
      const sw = 1.6 + 11 * wv, op = 0.42 + 0.58 * wv / wmax;
      const sw0 = M.plan(a, 'sw', sw), op0 = M.plan(a, 'op', op);
      tl.fromTo(a, { attr: { 'stroke-width': sw0 }, opacity: op0 }, { attr: { 'stroke-width': sw }, opacity: op, duration: d, ease: 'power2.inOut', immediateRender: false }, 0);
    });
    if (o.labels !== false) {
      const old = P.labels;
      const fresh = [];
      allArcs().forEach(a => {
        const wv = W[a.j];
        if (wv === null || wv === undefined) return;
        const t = S.text(wf(wv), { x: g.tokens[a.j].cx, y: labY, size: o.labelSize ?? 26, anchor: 'middle', family: 'mono', weight: 600, color: tone }, under);
        M.hide(t);
        fresh.push(t);
        g.labels[a.j] = t;
      });
      if (old.length) { tl.fromTo(old, { autoAlpha: 1 }, { autoAlpha: 0, duration: d * 0.4, immediateRender: false }, 0); tl.add(M.inFlight(old.concat(fresh), d * 0.9), 0); }
      tl.fromTo(fresh, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: d * 0.6, stagger: 0.05, ease: 'power2.out', immediateRender: false }, d * 0.3);
      P.labels = fresh;
    }
    g.bars.forEach(b => {
      if (!b) return;
      const wv = W[b.j] || 0;
      const h1 = Math.max(2, barMax * wv / Math.max(wmax, o.barScale ?? 0));
      const h0 = M.plan(b, 'h', h1);
      if (!h0) tl.fromTo([b, b.track], { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, 0);
      tl.fromTo(b, { attr: { height: Math.max(0.01, h0), y: rowY + barMax - Math.max(0.01, h0) } }, { attr: { height: h1, y: rowY + barMax - h1 }, duration: d, ease: 'power3.out', immediateRender: false }, 0.05);
    });
    return tl;
  };
  g.blend = (bo = {}) => {
    const tl = gsap.timeline();
    const W = bo.weights || P.weights || [];
    const d = bo.d ?? 1.1;
    const vt = bo.tone || o.valueTone || 'struct';
    allArcs().forEach((a, k) => {
      const wv = W[a.j] || 0;
      if (wv <= 0) return;
      const dot = S.g({ 'data-audit': 'ignore' }, front);
      const rad = 5 + 13 * Math.sqrt(wv);
      S.circle({ x: 0, y: 0, r: rad * 2.4, fill: `url(#pglow-${M.GRAD.includes(vt) ? vt : 'struct'})` }, dot);
      S.circle({ x: 0, y: 0, r: rad, fill: vt }, dot);
      M.hide(dot);
      const L = a.len;
      const st = k * 0.05;
      tl.add(M.drive(d, p => {
        const pt = a.getPointAtLength(L * (1 - p));
        dot.setAttribute('transform', `translate(${M.f2(pt.x)},${M.f2(pt.y)})`);
        const vis = p > 0 && p < 1;
        dot.style.visibility = vis ? 'inherit' : 'hidden';
        dot.style.opacity = vis ? Math.min(1, p * 8, (1 - p) * 6) : 0;
      }, { ease: 'power1.inOut' }), st);
    });
    const tq = g.tokens[q];
    tl.add(S.fx.pulse(tq, { scale: 1.12, d: 0.45 }), d * 0.92);
    if (bo.into && tq.setState) tl.add(tq.setState(bo.into, { d: 0.4 }), d * 0.9);
    return tl;
  };
  g.mask = (mo = {}) => {
    const tl = gsap.timeline();
    if (!g.wall) return tl;
    const d = mo.d ?? 0.6;
    fut.forEach((j, k) => {
      const tk = g.tokens[j];
      if (tk.setState) tl.add(tk.setState('dim', { d }), k * 0.06);
      else tl.add(M.fadeTo(tk, 0.3, d), k * 0.06);
    });
    tl.fromTo(g.wall, { autoAlpha: 0, scaleY: 0, transformOrigin: '50% 100%' }, { autoAlpha: 1, scaleY: 1, transformOrigin: '50% 100%', duration: d, ease: 'power3.out', immediateRender: false }, 0.1);
    tl.fromTo(g.wallLabel, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: d * 0.8, immediateRender: false }, 0.3);
    return tl;
  };
  g.probe = (j, po = {}) => {
    const tl = gsap.timeline();
    if (!g.wall || j <= q) return tl;
    const xb = g.tokens[j].cx;
    const pth = S.path({ d: arcPath(qx + 10, xb, hOf(Math.abs(xb - qx))), stroke: 'muted', sw: 3, dash: undefined }, arcG);
    pth.style.opacity = 0;
    const L = pth.getTotalLength();
    let lo = 0, hi = L;
    for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (pth.getPointAtLength(m).x < g.wallX - 6) lo = m; else hi = m; }
    const frac = Math.max(1, Math.round(lo / L * 100));
    const d = po.d ?? 1.2;
    tl.fromTo(pth, { opacity: 0.9, drawSVG: '0%' }, { opacity: 0.9, drawSVG: `${frac}%`, duration: d * 0.5, ease: 'power2.out', immediateRender: false }, 0);
    tl.fromTo(g.wall, { attr: { 'stroke-width': 2.5 } }, { attr: { 'stroke-width': 5 }, duration: 0.18, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }, d * 0.5);
    tl.fromTo(pth, { opacity: 0.9 }, { opacity: 0, duration: d * 0.35, immediateRender: false }, d * 0.65);
    return tl;
  };
  g.clear = (co = {}) => {
    const tl = gsap.timeline();
    const d = co.d ?? 0.4;
    allArcs().forEach(a => { const op = M.plan(a, 'op', 0.55); M.plan(a, 'sw', 2); tl.fromTo(a, { opacity: op }, { opacity: 0, duration: d, immediateRender: false }, 0); });
    if (P.labels.length) tl.fromTo(P.labels, { autoAlpha: 1 }, { autoAlpha: 0, duration: d, immediateRender: false }, 0);
    g.bars.forEach(b => {
      if (!b) return;
      if (M.plan(b, 'h', 0)) tl.fromTo([b, b.track], { opacity: 1 }, { opacity: 0, duration: d, immediateRender: false }, 0);
    });
    P.labels = [];
    return tl;
  };
  return g;
}

/* ------------------------------------------------------------------ libAttentionGrid */
/**
 * libAttentionGrid — the attention score grid: a row per token asking (its query), a column per token
 * asked (its key). Cells light amber by score, row by row; the causal mask hatches out the triangle above
 * the diagonal (everything ahead), band by band; or the lit triangle grows a row at a time, as in decode.
 * o: x 960, y 540 (centre of the cells; top-left with anchor 'start'), tokens ['the', 'cat', 'sat', 'down',
 *    'it'] (row and column labels; or n for 'token 1'…), colLabels (column labels, if different: e.g.
 *    ['1', '2', '3', '4', '5'] when 'token 1' is too wide), cw 88, ch 64, gap 6, size 26 (labels),
 *    scores n×n numbers 0..1 (cell brightness; default seeded, stronger near the diagonal),
 *    lit 'size' (an amber score lights as a square sized by the score) | 'fill' (the whole cell, by opacity),
 *    showScores false (print scores in the cells, dp 1), rowTitle ('asks'), colTitle ('is asked'),
 *    icons true (a magnifier beside rowTitle, a key beside colTitle), maskLabel 'masked',
 *    maskStyle 'hatch' | 'dim' (grey the triangle instead of hatching it), hidden false.
 * Returns <g> with .cells[r][c] (each a cell <g>: .skin .ovs, .r .c, geometry), .rowLabels[], .colLabels[],
 *    .rowTitleEl, .colTitleEl, .maskBands[] (hatched triangle, one band per diagonal), .maskLabel, and
 *    .x .y .w .h .cellAt(r, c).
 * Helpers (return timelines; call in time order):
 *    .in({d 0.6})                       labels and empty cells appear (hidden until then)
 *    .fill({stagger 0.035, d 0.3, causal, tone 'compute'})   cells light by score (amber squares sized by
 *        the score, or o.lit 'fill'), row by row (masked
 *        cells skipped when causal is true or the mask is on)
 *    .lightRow(r, {upto r, tone 'struct', stagger 0.05})   row r lights cells 0..upto (decode adds a row)
 *    .lightCausal({tone 'struct', stagger 0.25})   row 1 lights 1 cell, row 2 two, ... (the triangle)
 *    .mask({d 0.9})                     the upper-right triangle hatches out, one diagonal band at a time
 *    .focusRow(r, {tone 'compute'}) / .unfocus()   an outline on one row
 *    .unlight({d 0.4})                  every lit cell goes dark again
 *   const sg = libAttentionGrid(S, { x: 960, y: 560, tokens: ['the', 'cat', 'sat', 'down', 'it'], rowTitle: 'asks', colTitle: 'is asked' });
 *   S.add(sg.in(), 'b3~grid');
 *   S.add(sg.fill(), 'b3~row per token');
 *   S.add(sg.mask(), 'b4~only back');
 */
function libAttentionGrid(S, o = {}, parent) {
  const M = _libModel;
  const toks = o.tokens || Array.from({ length: o.n ?? 5 }, (_, i) => `token ${i + 1}`);
  const n = toks.length;
  const cw = o.cw ?? 88, ch = o.ch ?? 64, gap = o.gap ?? 6, size = o.size ?? 26;
  const Wd = n * (cw + gap) - gap, Ht = n * (ch + gap) - gap;
  const mid = (o.anchor || 'middle') === 'middle';
  const x0 = mid ? (o.x ?? 960) - Wd / 2 : (o.x ?? 0), y0 = mid ? (o.y ?? 540) - Ht / 2 : (o.y ?? 0);
  const rnd = S.rand(o.seed ?? 3);
  const scores = o.scores || toks.map((_, r) => toks.map((_, c) => M.f2(M.clamp(0.15 + rnd() * 0.65 + (r === c ? 0.2 : 0)))));
  const g = S.g(null, parent);
  const cellsG = S.g(null, g), maskG = S.g(null, g), labG = S.g(null, g), front = S.g(null, g);
  g.cells = [];
  for (let r = 0; r < n; r++) {
    const row = [];
    for (let c = 0; c < n; c++) {
      const cl = M.cell(S, { x: x0 + c * (cw + gap), y: y0 + r * (ch + gap), w: cw, h: ch, r: 8 }, { style: 'unlit' }, cellsG);
      cl.r = r; cl.c = c; cl.score = scores[r][c];
      if (o.showScores) { cl.label = M.cellText(S, cl, M.num(scores[r][c], { dp: 1 }), { size: 24 }); }
      row.push(cl);
    }
    g.cells.push(row);
  }
  g.cellAt = (r, c) => g.cells[r][c];
  g.rowLabels = toks.map((t, r) => S.text(t, { x: x0 - 18, y: y0 + r * (ch + gap) + ch / 2 + 1, size, anchor: 'end', color: 'ink', weight: 550 }, labG));
  g.colLabels = (o.colLabels || toks).map((t, c) => S.text(t, { x: x0 + c * (cw + gap) + cw / 2, y: y0 - 26, size, anchor: 'middle', color: 'ink', weight: 550, maxW: cw + gap - 12 }, labG));
  const icons = o.icons !== false;
  if (o.colTitle) {
    const tw = S.measure(o.colTitle, { size: 26, weight: 600 });
    const tx = x0 + Wd / 2 + (icons ? 22 : 0);
    g.colTitleEl = S.text(o.colTitle, { x: tx, y: y0 - 78, size: 26, anchor: 'middle', color: 'muted', weight: 600 }, labG);
    if (icons) g.colIcon = S.icon('ph:key-duotone', { x: tx - tw / 2 - 26, y: y0 - 78, size: 34, color: 'muted' }, labG);
  }
  if (o.rowTitle) {
    const rx = x0 - 18;
    g.rowTitleEl = S.text(o.rowTitle, { x: rx, y: y0 - 78, size: 26, anchor: 'end', color: 'muted', weight: 600 }, labG);
    if (icons) g.rowIcon = S.icon('ph:magnifying-glass-duotone', { x: rx - S.measure(o.rowTitle, { size: 26, weight: 600 }) - 26, y: y0 - 78, size: 32, color: 'muted' }, labG);
  }
  // the mask: one hatched band per diagonal (c - r = k)
  g.maskBands = [];
  const dimMask = o.maskStyle === 'dim';
  for (let k = 1; k < n; k++) {
    const bg = S.g(null, maskG);
    let hd = '';
    for (let r = 0; r + k < n; r++) {
      const c = r + k, x = x0 + c * (cw + gap), y = y0 + r * (ch + gap);
      S.rect({ x, y, w: cw, h: ch, r: 8, fill: dimMask ? '#1a2033' : '#141a2b', stroke: '#ffffff', strokeOpacity: 0.1, sw: 1.5 }, bg);
      if (!dimMask) hd += M.hatch(x + 3, y + 3, cw - 6, ch - 6, 12);
    }
    if (hd) S.path({ d: hd, stroke: '#8792b0', sw: 1.6, strokeOpacity: 0.32 }, bg);
    bg.setAttribute('data-audit', 'ignore');
    M.hide(bg);
    g.maskBands.push(bg);
  }
  if (n > 1) {
    // centroid of the masked cells, nudged towards the top-right corner
    let sx = 0, sy = 0, m = 0;
    for (let r = 0; r < n; r++) for (let c = r + 1; c < n; c++) { sx += x0 + c * (cw + gap) + cw / 2; sy += y0 + r * (ch + gap) + ch / 2; m++; }
    const lx = sx / m + cw * 0.15, ly = sy / m - ch * 0.15;
    const text = o.maskLabel ?? 'masked';
    const tw = S.measure(text, { size: 26, weight: 650 });
    const ml = S.g(null, front);
    S.rect({ x: lx - tw / 2 - 16, y: ly - 22, w: tw + 32, h: 44, r: 12, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.18, sw: 1.5 }, ml);
    S.text(text, { x: lx, y: ly + 1, size: 26, anchor: 'middle', color: 'muted', weight: 650 }, ml);
    M.hide(ml);
    g.maskLabel = ml;
  }
  g.rowFrame = S.rect({ x: x0 - 6, y: y0 - 6, w: Wd + 12, h: ch + 12, r: 12, stroke: 'compute', sw: 3 }, front);
  M.hide(g.rowFrame);
  Object.assign(g, { x: x0, y: y0, w: Wd, h: Ht, l: x0, r: x0 + Wd, t: y0, b: y0 + Ht, cx: x0 + Wd / 2, cy: y0 + Ht / 2, n });
  if (o.hidden) { g.cells.flat().forEach(M.hide); M.hide(labG); }

  const P = { masked: false, lit: new Set(), frame: null };
  /** a score as an amber square inside the cell, its side growing with the score (a Hinton square) */
  const square = cl => {
    if (cl.sq) return cl.sq;
    const sc = M.clamp(cl.score), side = Math.max(0.2, Math.sqrt(sc)) * (Math.min(cl.w, cl.h) - 12);
    const sq = S.rect({ x: cl.cx - side / 2, y: cl.cy - side / 2, w: side, h: side, r: Math.min(7, side / 4), fill: 'url(#solid-compute)', fillOpacity: M.f2(0.55 + 0.45 * sc) }, cl);
    cl.insertBefore(sq, cl.skinG.nextSibling);
    sq.style.opacity = 0;
    cl.sq = sq;
    return sq;
  };
  const litTl = (tl, cl, tone, at, d) => {
    const sized = tone === 'compute' && o.lit !== 'fill';
    const ov = sized ? square(cl) : M.overlay(S, cl, tone, 'lit');
    const target = sized ? 1 : tone === 'compute' ? M.f2(0.1 + 0.9 * M.clamp(cl.score)) : 0.7;
    const from = M.plan(ov, 'op', target, 0);
    if (sized && !from) tl.fromTo(ov, { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: target, scale: 1, duration: d * 1.3, ease: 'back.out(1.8)', transformOrigin: '50% 50%', immediateRender: false }, at);
    else tl.fromTo(ov, { opacity: from }, { opacity: target, duration: d, ease: 'power2.out', immediateRender: false }, at);
    P.lit.add(ov);
  };
  g.in = (io = {}) => {
    const tl = gsap.timeline();
    const d = io.d ?? 0.6;
    tl.fromTo(labG, { autoAlpha: 0 }, { autoAlpha: 1, duration: d }, 0);
    tl.fromTo(g.cells.flat(), { autoAlpha: 0, scale: 0.7, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: d * 0.7, ease: 'back.out(1.8)', stagger: { each: 0.02, grid: [n, n], from: 'start' }, transformOrigin: '50% 50%' }, 0.1);
    tl.add(M.inFlight(g.cells.flat(), d * 0.7 + 0.02 * n * n), 0.1);
    return tl;
  };
  g.fill = (fo = {}) => {
    const tl = gsap.timeline();
    const st = fo.stagger ?? 0.035, d = fo.d ?? 0.3, causal = fo.causal ?? P.masked;
    let k = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (causal && c > r) continue;
      litTl(tl, g.cells[r][c], fo.tone || 'compute', k * st, d);
      k++;
    }
    return tl;
  };
  g.lightRow = (r, lo = {}) => {
    const tl = gsap.timeline();
    const upto = lo.upto ?? r;
    for (let c = 0; c <= upto; c++) litTl(tl, g.cells[r][c], lo.tone || 'struct', c * (lo.stagger ?? 0.05), lo.d ?? 0.3);
    return tl;
  };
  g.lightCausal = (lo = {}) => {
    const tl = gsap.timeline();
    for (let r = 0; r < n; r++) tl.add(g.lightRow(r, { tone: lo.tone || 'struct', stagger: lo.cellStagger ?? 0.04, d: lo.d ?? 0.3 }), r * (lo.stagger ?? 0.25));
    return tl;
  };
  g.mask = (mo = {}) => {
    const tl = gsap.timeline();
    const d = mo.d ?? 0.9;
    const st = d * 0.6 / Math.max(1, n - 1);
    g.maskBands.forEach((bg, k) => tl.fromTo(bg, { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.4, ease: 'power1.out', immediateRender: false }, k * st));
    if (g.maskLabel) tl.fromTo(g.maskLabel, { autoAlpha: 0, scale: 0.9, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2)', immediateRender: false }, d * 0.7);
    // the masked cells sit under the hatching (and the label's plate) from here on: not layout any more
    const under = [];
    for (let r = 0; r < n; r++) for (let c = r + 1; c < n; c++) under.push(g.cells[r][c]);
    tl.add(M.ignoreFrom(under), d * 0.7);
    P.masked = true;
    return tl;
  };
  g.focusRow = (r, fo = {}) => {
    const tl = gsap.timeline();
    const yy = y0 + r * (ch + gap) - 6;
    if (fo.tone) g.rowFrame.setAttribute('stroke', S.tone(fo.tone));
    if (P.frame === null) tl.fromTo(g.rowFrame, { autoAlpha: 0, attr: { y: yy } }, { autoAlpha: 1, duration: 0.35, immediateRender: false }, 0);
    else tl.fromTo(g.rowFrame, { attr: { y: P.frame } }, { attr: { y: yy }, duration: 0.4, ease: 'power3.inOut', immediateRender: false }, 0);
    P.frame = yy;
    return tl;
  };
  g.unfocus = () => {
    const tl = gsap.timeline();
    if (P.frame !== null) tl.fromTo(g.rowFrame, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, immediateRender: false }, 0);
    P.frame = null;
    return tl;
  };
  g.unlight = (uo = {}) => {
    const tl = gsap.timeline();
    P.lit.forEach(ov => { const from = M.plan(ov, 'op', 0, 0); if (from) tl.fromTo(ov, { opacity: from }, { opacity: 0, duration: uo.d ?? 0.4, immediateRender: false }, 0); });
    return tl;
  };
  return g;
}
