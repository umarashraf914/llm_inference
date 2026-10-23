/* video/lib/memory.js — shared film library: memory and data movement.
 *
 *   libMemBlock    a block of bytes: the coral "140 GB", a memory card, or an HBM stack (resizable to scale)
 *   libMemoryBar   a chip's memory capacity, to scale: weights, KV cache, free, the rim, and the overhang
 *   libKVCache     the key/value cache: one K|V slab per token (a row, a stack, a pool, or tokens × layers)
 *   libByteStream  memory → thick coral conduit → chip, with particles, a rate label and a passing amount
 *
 * Conventions (all four):
 * - Build with S primitives into `parent` (default S.main). Everything is visible as built except what a
 *   helper brings in later (empty KV slots, a packet). Enter with S.fx.in(root) or the component's .in().
 * - Helpers RETURN tweens or timelines; place them with S.add(tween, at). They never touch S.tl. The one
 *   exception is libByteStream .flow(from, to), which wraps S.flow and so takes time specs, like S.flow.
 * - Helpers plan state in call order, like fx.xform: call one component's helpers in time order.
 * - Coordinates are in the parent's space. To move or scale a component, wrap it in a holder S.g() and
 *   S.xset / S.fx.xform the holder; never tween the component root's x/y/scale with raw GSAP.
 * - Colour = meaning: coral bytes (weights, traffic, the cache's bytes), teal helps (a reused prefix, a hit,
 *   "yours"), amber compute (the chip), grey for invalid or evicted, blue for neutral structure.
 * - Root groups never take DOM-reserved names: the reuse helper is .reuse(), not .prefix(); a cell's empty
 *   outline is .slotEl, not .slot.
 * - Everything is a pure function of time: frames match whether reached by playing or seeking either way.
 */

/* ------------------------------------------------------------------ private helpers */
var _libMem = (function () {
  'use strict';
  const GRAD = ['compute', 'bytes', 'helps', 'struct', 'violet', 'neutral'];
  const DARK = '#0a0f1e', BASE = '#0c1326';
  const GREY = { k: '#5a6380', v: '#262d42', s: '#6f7a98', ink: '#2a3045', vink: '#8e98b5', edge: '#8a94b0' };
  const f2 = v => (Math.round(v * 100) / 100).toString();
  let uid = 0;

  function hexRGB(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  /** mix two colours (tone names or hex): t = 0 → a, 1 → b */
  function mix(S, a, b, t) {
    const A = hexRGB(S.tone(a)), B = hexRGB(S.tone(b));
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  /** solid fill for a tone: the engine's vertical gradient when it exists, else the flat colour */
  const solid = (S, tone) => (GRAD.includes(tone) ? `url(#solid-${tone})` : S.tone(tone));
  const card = tone => `url(#card-${GRAD.includes(tone) ? tone : 'neutral'})`;
  /** rounded-rectangle path with per-corner radii [tl, tr, br, bl] */
  function rr(x, y, w, h, r) {
    if (!(w > 0.01) || !(h > 0.01)) return '';
    const [a, b, c, d] = r.map(v => Math.max(0, Math.min(v, w / 2, h / 2)));
    const X = x + w, Y = y + h;
    return `M${f2(x + a)},${f2(y)}H${f2(X - b)}` + (b ? `A${f2(b)},${f2(b)} 0 0 1 ${f2(X)},${f2(y + b)}` : '') +
      `V${f2(Y - c)}` + (c ? `A${f2(c)},${f2(c)} 0 0 1 ${f2(X - c)},${f2(Y)}` : '') +
      `H${f2(x + d)}` + (d ? `A${f2(d)},${f2(d)} 0 0 1 ${f2(x)},${f2(Y - d)}` : '') +
      `V${f2(y + a)}` + (a ? `A${f2(a)},${f2(a)} 0 0 1 ${f2(x + a)},${f2(y)}` : '') + 'Z';
  }
  /** 45° hatching clipped exactly to a rectangle, as one path (no <pattern>: safe under the camera) */
  function hatch(x, y, w, h, step = 14) {
    if (!(w > 1) || !(h > 1)) return '';
    let d = '';
    for (let c = step / 2; c < w + h; c += step) {
      const a = Math.max(0, c - h), b = Math.min(c, w);
      if (b - a < 0.5) continue;
      d += `M${f2(x + a)},${f2(y + c - a)}L${f2(x + b)},${f2(y + c - b)}`;
    }
    return d;
  }
  /** decimals that suit a value: 140 → 0, 3.3 → 1, 0.33 → 2 */
  const decFor = v => { const a = Math.abs(v); return a >= 9.95 || a < 0.0005 ? 0 : a >= 0.995 ? 1 : 2; };
  /** a GB-style number; dec fixes the decimals, else they follow the value */
  function num(v, dec) {
    const k = dec ?? decFor(v);
    return Number(v).toLocaleString('en-US', { minimumFractionDigits: k, maximumFractionDigits: k });
  }
  /** selection → index list. number | [i, j, …] | {from, to} (inclusive) | 'all' */
  function sel(s, n) {
    if (s === 'all' || s == null) return Array.from({ length: n }, (_, i) => i);
    if (typeof s === 'number') return s >= 0 && s < n ? [s] : [];
    if (Array.isArray(s)) return s.filter(i => i >= 0 && i < n);
    const a = Math.max(0, s.from ?? 0), b = Math.min(n - 1, s.to ?? n - 1);
    const out = [];
    for (let i = a; i <= b; i++) out.push(i);
    return out;
  }
  /** a value tween on a proxy that re-renders through `apply`, seek-safe in both directions */
  function drive(from, to, apply, o = {}) {
    const p = { v: from };
    const go = () => apply(p.v);
    return gsap.fromTo(p, { v: from }, {
      v: to, duration: o.d ?? 1, ease: o.ease || 'power2.inOut', immediateRender: false,
      onStart: go, onUpdate: go, onReverseComplete: o.back || (() => apply(from)),
    });
  }
  /**
   * Seek-safe text changes. set(str) writes the text. count runs fmt(from → to) and, sought back before its
   * start, restores `prev` (the text planned before it); swap fades out, changes the text, fades back in.
   */
  function countText(set, from, to, fmt, prev, o = {}) {
    return drive(from, to, v => set(fmt(v)), { d: o.d ?? 1.2, ease: o.ease || 'power2.out', back: () => set(prev) });
  }
  function swapText(el, set, before, after, o = {}) {
    const d = o.d ?? 0.4;
    const t = gsap.timeline();
    t.fromTo(el, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -12, duration: d / 2, ease: 'power2.in', immediateRender: false }, 0);
    t.add(drive(0, 1, v => set(v < 0.5 ? before : after), { d: 0.001, ease: 'none', back: () => set(before) }), d / 2);
    t.fromTo(el, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: d / 2, ease: 'power2.out', immediateRender: false }, d / 2);
    return t;
  }
  /** an instant, reversible attribute change at a point in a timeline */
  function setAttr(t, el, from, to, at) {
    t.fromTo(el, { attr: from }, { attr: to, duration: 0.001, immediateRender: false }, at);
  }
  /** an instant, reversible visibility change at a point in a timeline */
  function setVis(t, el, from, to, at) {
    t.fromTo(el, { autoAlpha: from }, { autoAlpha: to, duration: 0.001, immediateRender: false }, at);
  }
  /** a short dark crack across a slab */
  function crack(x, y, w, h) {
    const P = (u, v) => `${f2(x + w * u)},${f2(y + h * v)}`;
    return `M${P(0.6, -0.02)}L${P(0.43, 0.32)}L${P(0.6, 0.54)}L${P(0.4, 0.78)}L${P(0.52, 1.02)}`;
  }
  /**
   * A value label as one <text>: [name ][pre][number][ unit], the number (and pre) in mono, the rest sans.
   * Returns the <text> with .numEl (tspan) and .width() (current width in px).
   */
  function vlabel(S, o, p) {
    const segs = [];
    if (o.name) segs.push({ t: o.name + ' ' });
    if (o.pre) segs.push({ t: o.pre, f: 'mono' });
    segs.push({ t: o.num ?? '', f: 'mono' });
    if (o.unit) segs.push({ t: ' ' + o.unit });
    const size = o.size ?? 28, weight = o.weight ?? 650;
    const t = S.text(segs, { x: o.x ?? 0, y: o.y ?? 0, size, weight, color: o.color, anchor: o.anchor }, p);
    const sp = [...t.childNodes];
    t.numEl = sp[(o.name ? 1 : 0) + (o.pre ? 1 : 0)];
    t.width = () => sp.reduce((a, n) => a + S.measure(n.textContent, { size, weight, family: n.getAttribute('font-family') ? 'mono' : 'sans' }), 0);
    return t;
  }
  /** '140 GB' → [{t: '140', f: 'mono'}, {t: ' GB'}]: an amount's number in mono, its unit in sans; else null */
  function amountParts(text) {
    const m = String(text).match(/^([≈~+\-−]?\s*[\d.,]+)(\s+\S.*)?$/);
    return m ? [{ t: m[1], f: 'mono' }, { t: m[2] || '' }] : null;
  }
  /** an <text> for a label that may be an amount; returns it with .set(text) and .width() */
  function amountText(S, text, o, p) {
    const parts = o.family === 'mono' ? amountParts(text) : null;
    const t = S.text(parts || String(text), { ...o, family: parts ? 'sans' : o.family }, p);
    const fam = n => (n.getAttribute && n.getAttribute('font-family') ? 'mono' : (parts ? 'sans' : o.family || 'sans'));
    t.set = str => {
      const q = parts ? amountParts(str) : null;
      if (q && t.childNodes.length === 2) { t.childNodes[0].textContent = q[0].t; t.childNodes[1].textContent = q[1].t; }
      else t.textContent = str;
    };
    t.width = () => (t.childNodes.length > 1 ? [...t.childNodes].reduce((a, n) => a + S.measure(n.textContent, { size: o.size, weight: o.weight, family: fam(n) }), 0)
      : S.measure(t.textContent, { size: o.size, weight: o.weight, family: parts ? 'mono' : o.family }));
    return t;
  }
  return { GRAD, DARK, BASE, GREY, mix, solid, card, rr, hatch, num, decFor, sel, drive, countText, swapText, setAttr, setVis, crack, vlabel, amountText, id: p => `${p}-${++uid}` };
})();


/**
 * libMemBlock — a block of bytes. The film's coral "140 GB" (the weights as an amount), a memory card,
 * or an HBM stack. Its width (or height) can be resized to scale with an amount.
 *
 * o: {x = 760, y = 480 (top-left), w = 400, h = 110, r = min(16, h/3),
 *     gb = 140              the amount the block stands for (sets px per GB for .resize),
 *     label = '140 GB'      main text; default `${gb} GB`; null for none; fmt = v => text for .resize,
 *     sub = ''              a second, smaller line (e.g. 'weights'),
 *     tone = 'bytes',
 *     style = 'solid'       'solid' (filled, dark text) | 'card' (tinted panel, ink + coloured text)
 *                           | 'outline' (dashed: "needed", a ghost) | 'stack' (HBM stack: die layers, text below),
 *     layers = 6            die layers for style 'stack',
 *     size = 34             label size (sub is 0.76×); family: default 'mono' for an amount ('140 GB'), else 'sans',
 *     shadow = true}
 * Returns <g> with .bg .labelEl .subEl and anchors .x .y .w .h .l .r .t .b .cx .cy
 * Helpers (return tweens):
 *   .resize(gb, {d = 0.9, ease, axis: 'x'|'y' = 'x', anchor: 'left'|'center'|'right'|'top'|'bottom', label: v => text})
 *        scales the block's width (or height) with the amount and counts its label; the text steps outside
 *        when the block gets too small for it.
 *   .flash({tone = 'compute', d = 0.5, to = 0.5})  a brief glow over the block (e.g. "the chip uses it").
 * Example:
 *   const blk = libMemBlock(S, { x: 200, y: 235, w: 1000, h: 50, gb: 140, size: 30 });
 *   S.add(S.fx.in(blk, { from: 'left' }), 'b1~gigabytes');
 *   S.add(blk.resize(70, { d: 0.8 }), 'b2~eight');          // halves to "70 GB"
 *   S.add(blk.resize(35, { d: 0.8 }), 'b2>-0.8');           // and again: "35 GB"
 */
function libMemBlock(S, o = {}, parent) {
  const M = _libMem;
  const g = S.g(null, parent);
  const x = o.x ?? 760, y = o.y ?? 480, w = o.w ?? 400, h = o.h ?? 110, r = o.r ?? Math.min(16, h / 3);
  const tone = o.tone || 'bytes', style = o.style || 'solid';
  const gb0 = o.gb ?? 140;
  const size = o.size ?? 34, subSize = Math.round(size * 0.76);
  const fmtL = o.fmt || (v => `${M.num(v)} GB`);
  const label = o.label === undefined ? fmtL(gb0) : o.label;
  const c = S.tone(tone);
  const shapes = [];
  if (style !== 'outline') shapes.push(S.rect({ x, y, w, h, r, fill: M.BASE, filter: o.shadow === false ? undefined : 'url(#shadow)' }, g));
  let bg;
  if (style === 'solid') bg = S.rect({ x, y, w, h, r, fill: M.solid(S, tone) }, g);
  else if (style === 'card') bg = S.rect({ x, y, w, h, r, fill: M.card(tone), stroke: c, strokeOpacity: 0.7, sw: 2 }, g);
  else if (style === 'outline') bg = S.rect({ x, y, w, h, r, fill: c, fillOpacity: 0.06, stroke: c, strokeOpacity: 0.85, sw: 2.5, dash: '9 7' }, g);
  else bg = S.rect({ x, y, w, h, r, fill: M.mix(S, tone, M.BASE, 0.74), stroke: c, strokeOpacity: 0.9, sw: 2 }, g);
  shapes.push(bg);
  g.bg = bg;
  let lines = null;
  const nLayers = o.layers ?? 6;
  const r2 = v => (Math.round(v * 100) / 100).toString();
  const layerPath = (X, Y, W, H) => {
    let d = '';
    if (W > 30) for (let k = 1; k < nLayers; k++) d += `M${r2(X + 10)},${r2(Y + k * H / nLayers)}H${r2(X + W - 10)}`;
    return d;
  };
  if (style === 'stack') {
    lines = S.path({ d: layerPath(x, y, w, h), stroke: c, strokeOpacity: 0.55, sw: 2 }, g);
    lines.setAttribute('data-audit', 'ignore');
  }
  const glow = S.rect({ x, y, w, h, r, fill: 'compute', opacity: 0 }, g);
  glow.setAttribute('data-audit', 'ignore');
  shapes.push(glow);
  // text
  const inkMain = style === 'solid' ? M.DARK : style === 'card' ? 'ink' : c;
  const inkSub = style === 'solid' ? '#1d2440' : style === 'card' ? c : 'muted';
  const outside = style === 'stack';
  // amounts ('140 GB') in mono, names ('memory') in sans
  const fam = o.family || (style !== 'card' && label != null && /^[≈~+\-−]?\s*[\d.,]/.test(String(label)) ? 'mono' : 'sans');
  const ty = outside ? y + h + 34 : y + h / 2 - (o.sub ? subSize * 0.62 : 0);
  if (label != null) g.labelEl = M.amountText(S, label, { x: x + w / 2, y: ty, size, weight: 650, anchor: 'middle', color: outside ? c : inkMain, family: fam }, g);
  if (o.sub) g.subEl = M.amountText(S, o.sub, { x: x + w / 2, y: outside ? ty + size * 0.98 : y + h / 2 + size * 0.58, size: subSize, weight: 500, anchor: 'middle', color: outside ? 'muted' : inkSub, family: style === 'card' ? 'mono' : 'sans' }, g);
  Object.assign(g, { x, y, w, h, l: x, r: x + w, t: y, b: y + h, cx: x + w / 2, cy: y + h / 2, gb: gb0, tone, style });

  const plan = { gb: gb0 };
  g.resize = (gb, ro = {}) => {
    const from = plan.gb; plan.gb = gb;
    const axis = ro.axis || 'x', anchor = ro.anchor || (axis === 'x' ? 'left' : 'bottom');
    const f = ro.label || fmtL;
    const apply = v => {
      const k = v / gb0;
      let nx = x, ny = y, nw = w, nh = h;
      if (axis === 'x') { nw = Math.max(0.5, w * k); nx = anchor === 'left' ? x : anchor === 'right' ? x + w - nw : x + (w - nw) / 2; }
      else { nh = Math.max(0.5, h * k); ny = anchor === 'top' ? y : anchor === 'bottom' ? y + h - nh : y + (h - nh) / 2; }
      const rad = Math.min(r, nw / 2, nh / 2);
      shapes.forEach(s => { s.setAttribute('x', nx); s.setAttribute('y', ny); s.setAttribute('width', nw); s.setAttribute('height', nh); s.setAttribute('rx', rad); s.setAttribute('ry', rad); });
      if (lines) lines.setAttribute('d', layerPath(nx, ny, nw, nh));
      if (g.labelEl) {
        const L = g.labelEl;
        L.set(f(v));
        const tw = L.width();
        const fits = outside || (axis === 'x' ? nw >= tw + 28 : nh >= (o.sub ? size * 2.3 : size * 1.4) && nw >= tw + 20);
        if (outside) { L.setAttribute('x', nx + nw / 2); L.setAttribute('y', ny + nh + 34); }
        else if (fits) { L.setAttribute('x', nx + nw / 2); L.setAttribute('y', ny + nh / 2 - (o.sub ? subSize * 0.62 : 0)); L.setAttribute('text-anchor', 'middle'); L.setAttribute('fill', S.tone(inkMain)); }
        else if (axis === 'x') { L.setAttribute('x', nx + nw + 16); L.setAttribute('y', ny + nh / 2); L.setAttribute('text-anchor', 'start'); L.setAttribute('fill', c); }
        else { L.setAttribute('x', nx + nw / 2); L.setAttribute('y', ny - 28); L.setAttribute('text-anchor', 'middle'); L.setAttribute('fill', c); }
        if (g.subEl) {
          g.subEl.setAttribute('opacity', fits ? 1 : 0);
          g.subEl.setAttribute('x', nx + nw / 2);
          g.subEl.setAttribute('y', outside ? ny + nh + 34 + size * 0.98 : ny + nh / 2 + size * 0.58);
        }
      }
    };
    return M.drive(from, gb, apply, { d: ro.d ?? 0.9, ease: ro.ease || 'power2.inOut' });
  };
  g.flash = (fo = {}) => {
    const d = fo.d ?? 0.5;
    const t = gsap.timeline();
    M.setAttr(t, glow, { fill: S.tone('compute') }, { fill: S.tone(fo.tone || 'compute') }, 0);
    t.fromTo(glow, { opacity: 0 }, { opacity: fo.to ?? 0.5, duration: d / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }, 0);
    return t;
  };
  return g;
}


/**
 * libMemoryBar — a chip's memory, drawn to scale: a capacity track ending in a rim (the capacity marker),
 * filled left to right (or bottom up) by labelled segments (weights, KV cache, …), with the free remainder
 * labelled and anything past the rim drawn as a hatched overhang ("won't fit").
 *
 * o: {x = 260, y = 420 (top-left of the track), w = 1200 (track length), h = 64 (thickness),
 *     capacity = 80        GB the memory holds (H100 80, H200 141, B200 192),
 *     scale                px per GB; default w / capacity (vertical: h / capacity). Give several bars the same
 *                          scale to compare them: each track is then capacity × scale long,
 *     vertical = false     fill bottom up (then w = thickness, default 120; h = length, default 560),
 *     title = ''           above the track (vertical: below it), e.g. 'H200 memory'; titleSize = 30,
 *     capLabel             at the rim; default `${capacity} GB`; false for none,
 *     rim = true           draw the capacity marker,
 *     segments = []        [{id, gb = 0, name = id, tone = 'bytes', style = 'solid'|'soft'|'outline', dec}]
 *                          laid end to end in order, e.g. {id: 'weights', gb: 140} then
 *                          {id: 'kv', name: 'KV cache', style: 'soft'}; dec fixes a label's decimals,
 *     free = true          label the empty remainder ('1 GB free'),
 *     overLabel = 'over'   word for the overhang label ('+29 GB over'); false for none,
 *     size = 28, unit = 'GB'}
 * Labels sit inside a segment when they fit and step outside (below; vertical: to the right) when they do
 * not, cross-fading as a segment grows. Outside labels never collide. Numbers follow the value's size
 * (140, 3.3, 0.33) unless a segment's dec fixes them.
 * Returns <g> with .track .rim .titleEl .capEl .segs{id: {g, inEl, overEl, labelIn, labelOut}} .freeEl .overEl,
 *   .pos(gb) (coordinate along the bar), .point(gb) → [x, y] on its centre line, .scale, .L (track px),
 *   .capacity, .total() (planned GB so far) and .x .y .w .h .l .r .t .b
 * Helpers (return tweens/timelines; call in time order):
 *   .in({d = 0.9})                 fade the bar in and sweep its segments up from zero
 *   .grow(id, gb, {d = 1, ease})   resize one segment (later ones ride along); its label counts; past the rim
 *                                  the overhang appears and the rim turns coral. Also shrinks (gb lower).
 *   .overflow({d = 0.9})           flash the overhang and pulse its label: "it does not fit"
 *   .marker(gb, {label, tone = 'ink', side, size = 28})  → static <g> (.line .label): a dashed line across the
 *                                  bar at gb, e.g. '140 GB needed'; side 'above'|'below' or 'right'|'left'
 *   .span(a, b, {label, tone = 'bytes', side})          → static <g> (.bg .label): a hatched region a..b GB
 *                                  ('≈ 40 GB short'). Enter both with S.fx.in.
 * Example:
 *   const h200 = libMemoryBar(S, { x: 220, y: 300, w: 1300, capacity: 141, title: 'H200 memory',
 *     segments: [{ id: 'weights', gb: 140 }, { id: 'kv', name: 'KV cache', style: 'soft' }] });
 *   S.add(h200.in(), 'b1');
 *   S.add(h200.grow('kv', 33, { d: 1.6 }), 'b2~hundred');   // 33 GB of cache: 32 GB past the rim
 *   S.add(h200.overflow(), 'b2~fit');
 */
function libMemoryBar(S, o = {}, parent) {
  const M = _libMem;
  const g = S.g(null, parent);
  const V = !!o.vertical;
  const cap = o.capacity ?? 80;
  const scale = o.scale ?? (V ? (o.h ?? 560) : (o.w ?? 1200)) / cap;
  const L = cap * scale, T = V ? (o.w ?? 120) : (o.h ?? 64);
  const x0 = o.x ?? 260, y0 = o.y ?? 420;
  const R = o.r ?? Math.min(14, T / 3);
  const size = o.size ?? 28, unit = o.unit ?? 'GB';
  const P = gb => (V ? y0 + L - gb * scale : x0 + gb * scale);
  const box = (a, b) => (V ? { x: x0, y: P(b), w: T, h: (b - a) * scale } : { x: P(a), y: y0, w: (b - a) * scale, h: T });
  // radii [tl,tr,br,bl] for a run: startR at the bottom/left end, endR at the far end
  const radii = (startR, endR) => (V ? [endR, endR, startR, startR] : [startR, endR, endR, startR]);

  // ---------------------------------------------------------------- track, layers
  g.track = S.g(null, g);
  const tb = V ? { x: x0, y: y0, w: T, h: Math.max(L, 1) } : { x: x0, y: y0, w: Math.max(L, 1), h: T };
  const tr = Math.min(R, tb.w / 2, tb.h / 2);
  S.rect({ ...tb, r: tr, fill: M.BASE }, g.track);
  S.rect({ ...tb, r: tr, fill: '#ffffff', fillOpacity: 0.035, stroke: '#ffffff', strokeOpacity: 0.16, sw: 1.5 }, g.track);
  const segLayer = S.g(null, g), overLayer = S.g(null, g), flashLayer = S.g(null, g), labLayer = S.g(null, g);
  const flash = S.path({ d: '', fill: 'bytes', opacity: 0 }, flashLayer);
  flash.setAttribute('data-audit', 'ignore');

  // ---------------------------------------------------------------- segments
  const segs = (o.segments || []).map(sp => {
    const s = { id: sp.id, name: sp.name ?? sp.id, tone: sp.tone || 'bytes', style: sp.style || 'solid', dec: sp.dec, gb: sp.gb ?? 0 };
    const c = S.tone(s.tone);
    s.g = S.g(null, segLayer);
    if (s.style === 'solid') s.inEl = S.path({ d: '', fill: M.solid(S, s.tone) }, s.g);
    else if (s.style === 'soft') s.inEl = S.path({ d: '', fill: c, fillOpacity: 0.3, stroke: c, strokeOpacity: 0.95, sw: 2 }, s.g);
    else s.inEl = S.path({ d: '', fill: c, fillOpacity: 0.08, stroke: c, strokeOpacity: 0.9, sw: 2, dash: '8 6' }, s.g);
    s.overG = S.g(null, overLayer);
    s.overEl = S.path({ d: '', fill: c, fillOpacity: 0.12, stroke: c, strokeOpacity: 0.95, sw: 2.5, dash: '9 7' }, s.overG);
    s.hatchEl = S.path({ d: '', stroke: c, strokeOpacity: 0.32, sw: 2 }, s.overG);
    s.hatchEl.setAttribute('data-audit', 'ignore');
    const dark = s.style === 'solid';
    const mk = inside => {
      const t = M.vlabel(S, { name: s.name, unit, size, weight: 650, anchor: 'middle', color: inside ? (dark ? M.DARK : 'ink') : s.tone }, labLayer);
      t.setAttribute('opacity', 0);
      return t;
    };
    s.labelIn = mk(true); s.labelOut = mk(false);
    return s;
  });
  const byId = {};
  segs.forEach(s => { byId[s.id] = s; });

  // ---------------------------------------------------------------- rim, title, free / over labels
  if (o.rim !== false) {
    g.rim = V ? S.line({ x1: x0 - 16, y1: y0, x2: x0 + T + 16, y2: y0, stroke: 'ink', sw: 3.5 }, g)
      : S.line({ x1: x0 + L, y1: y0 - 16, x2: x0 + L, y2: y0 + T + 16, stroke: 'ink', sw: 3.5 }, g);
  }
  const capText = o.capLabel === undefined ? `${M.num(cap)} ${unit}` : o.capLabel;
  const capParts = o.capLabel === undefined ? [{ t: M.num(cap), f: 'mono' }, { t: ' ' + unit }] : capText;
  const titleSize = o.titleSize ?? 30;
  if (o.title) {
    g.titleEl = V ? S.text(o.title, { x: x0 + T / 2, y: y0 + L + 46, size: titleSize, weight: 650, anchor: 'middle' }, g)
      : S.text(o.title, { x: x0, y: y0 - 44, size: titleSize, weight: 650 }, g);
  }
  if (capText && o.rim !== false) {
    if (V) g.capEl = S.text(capParts, { x: x0 + T + 28, y: y0, size: 26, weight: 600, color: 'muted' }, g);
    else {
      const tw = g.titleEl ? x0 + S.measure(o.title, { size: titleSize, weight: 650 }) : -1e9;
      const cw = S.measure(capText, { size: 26, weight: 600, family: 'mono' });
      const clash = tw + 24 > x0 + L - cw / 2;
      g.capEl = S.text(capParts, { x: clash ? x0 + L + 14 : x0 + L, y: y0 - 44, size: 26, weight: 600, color: 'muted', anchor: clash ? 'start' : 'middle' }, g);
    }
  }
  const side = (o2, color) => {
    const t = M.vlabel(S, { ...o2, size, weight: 600, color, anchor: 'middle' }, labLayer);
    t.setAttribute('opacity', 0);
    return t;
  };
  g.freeEl = o.free === false ? null : side({ unit: `${unit} free` }, 'muted');
  g.freeIn = o.free === false ? null : side({ unit: `${unit} free` }, 'muted');
  const overWord = o.overLabel === undefined ? 'over' : o.overLabel;
  g.overEl = overWord === false ? null : side({ pre: '+', unit: `${unit} ${overWord}` }, 'bytes');

  // ---------------------------------------------------------------- layout (a pure function of live state)
  const live = { k: 1, v: {} };
  const plan = {};
  segs.forEach(s => { live.v[s.id] = s.gb; plan[s.id] = s.gb; });
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const fade = (len, need) => clamp01((len - need) / 36);
  const lineH = size * 1.25;

  function setAnchor(t, a) { if (t.getAttribute('text-anchor') !== a) t.setAttribute('text-anchor', a); }
  function placeOutside(items) {
    // items: {el, c (desired centre along the bar), w (extent along the bar)}; resolve collisions in order
    if (!V) {
      items.sort((a, b) => a.c - b.c);
      let right = -1e9;
      for (const it of items) { const l = Math.max(it.c - it.w / 2, right + 22, x0); it.pos = l + it.w / 2; right = l + it.w; }
      for (const it of items) { it.el.setAttribute('x', it.pos); it.el.setAttribute('y', y0 + T + 38); setAnchor(it.el, 'middle'); }
    } else {
      items.sort((a, b) => b.c - a.c);
      let top = 1e9;
      for (const it of items) { const c = Math.min(it.c, top - 10 - it.w / 2); it.pos = c; top = c - it.w / 2; }
      for (const it of items) { it.el.setAttribute('x', x0 + T + 26); it.el.setAttribute('y', it.pos); setAnchor(it.el, 'start'); }
    }
  }

  function layout() {
    let acc = 0;
    const outs = [];
    segs.forEach((s, i) => {
      const v = Math.max(0, live.v[s.id] || 0) * live.k;
      const a = acc, b = acc + v;
      acc = b;
      // inside part (up to the rim), with a 3 px gap between neighbours
      const ia = Math.min(a, cap), ib = Math.min(b, cap);
      const g0 = i > 0 && a > 1e-6 ? 1.5 : 0, g1 = ib < cap - 1e-6 && b > ia ? 1.5 : 0;
      if (ib - ia > 1e-6) {
        const bx = box(ia, ib);
        const startR = ia < 1e-6 ? R : 3, endR = ib > cap - 1e-6 ? (b > cap + 1e-6 ? 0 : R) : 3;
        if (V) { bx.h -= g0 + g1; bx.y += g1; } else { bx.x += g0; bx.w -= g0 + g1; }
        s.inEl.setAttribute('d', M.rr(bx.x, bx.y, Math.max(bx.w, 0.8), Math.max(bx.h, 0.8), radii(startR, endR)));
      } else s.inEl.setAttribute('d', '');
      // overhang part (past the rim)
      const oa = Math.max(a, cap), ob = Math.max(b, cap);
      if (ob - oa > 1e-6) {
        const bx = box(oa, ob);
        const sg = oa > cap + 1e-6 ? 1.5 : 0;
        if (V) bx.h -= sg; else { bx.x += sg; bx.w -= sg; }
        s.overEl.setAttribute('d', M.rr(bx.x, bx.y, bx.w, bx.h, radii(0, R)));
        s.hatchEl.setAttribute('d', M.hatch(bx.x + 3, bx.y + 3, bx.w - 6, bx.h - 6, 16));
      } else { s.overEl.setAttribute('d', ''); s.hatchEl.setAttribute('d', ''); }
      // labels
      const txt = M.num(live.v[s.id] * live.k, s.dec);
      s.labelIn.numEl.textContent = txt; s.labelOut.numEl.textContent = txt;
      const w = s.labelIn.width();
      const inLen = (ib - ia) * scale;
      const fit = v > 1e-6 ? (V ? (T >= w + 28 ? fade(inLen, lineH + 12) : 0) : (T >= size + 14 ? fade(inLen, w + 36) : 0)) : 0;
      s.labelIn.setAttribute('opacity', fit);
      const mid = ib - ia > 1e-6 ? (ia + ib) / 2 : (oa + ob) / 2;
      if (V) { s.labelIn.setAttribute('x', x0 + T / 2); s.labelIn.setAttribute('y', P(mid) + 1); }
      else { s.labelIn.setAttribute('x', P(mid)); s.labelIn.setAttribute('y', y0 + T / 2 + 1); }
      const outOp = v > 1e-6 ? 1 - fit : 0;
      s.labelOut.setAttribute('opacity', outOp);
      if (outOp > 0.01) outs.push({ el: s.labelOut, c: P(mid), w: V ? lineH : w });
    });
    const total = acc;
    // free remainder
    const free = cap - total;
    if (g.freeEl) {
      const show = free > cap * 0.002 && live.k > 0.999;
      const ft = M.num(free);
      g.freeEl.numEl.textContent = ft; g.freeIn.numEl.textContent = ft;
      const w = g.freeIn.width();
      const len = free * scale;
      const fit = show ? (V ? (T >= w + 28 ? fade(len, lineH + 12) : 0) : (T >= size + 14 ? fade(len, w + 40) : 0)) : 0;
      g.freeIn.setAttribute('opacity', fit);
      if (V) { g.freeIn.setAttribute('x', x0 + T / 2); g.freeIn.setAttribute('y', P(total + free / 2) + 1); }
      else { g.freeIn.setAttribute('x', P(total + free / 2)); g.freeIn.setAttribute('y', y0 + T / 2 + 1); }
      const outOp = show ? 1 - fit : 0;
      g.freeEl.setAttribute('opacity', outOp);
      if (outOp > 0.01) outs.push({ el: g.freeEl, c: V ? P(total + free / 2) : P(cap) - w / 2, w: V ? lineH : w });
    }
    // overhang total
    const over = total - cap;
    if (g.overEl) {
      const show = over > cap * 0.002;
      g.overEl.numEl.textContent = M.num(over);
      g.overEl.setAttribute('opacity', show ? 1 : 0);
      if (show) outs.push({ el: g.overEl, c: P(cap + over / 2), w: V ? lineH : g.overEl.width() });
    }
    placeOutside(outs);
    // the rim turns coral when something hangs past it
    if (g.rim) g.rim.setAttribute('stroke', S.tone(over > 0.01 ? 'bytes' : 'ink'));
    if (over > 0.01) { const bx = box(cap, total); flash.setAttribute('d', M.rr(bx.x, bx.y, bx.w, bx.h, radii(0, R))); }
    else flash.setAttribute('d', '');
  }
  layout();

  // ---------------------------------------------------------------- anchors and helpers
  Object.assign(g, {
    x: x0, y: y0, w: tb.w, h: tb.h, l: x0, r: x0 + tb.w, t: y0, b: y0 + tb.h, scale, L, capacity: cap,
    segs: byId, pos: P, point: gb => (V ? [x0 + T / 2, P(gb)] : [P(gb), y0 + T / 2]),
    total: () => segs.reduce((a, s) => a + plan[s.id], 0),
  });
  g.in = (io = {}) => {
    live.k = 0; layout();
    const t = gsap.timeline();
    t.fromTo(g, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'power2.out' }, 0);
    t.add(M.drive(0, 1, v => { live.k = v; layout(); }, { d: io.d ?? 0.9, ease: 'power3.out' }), 0.15);
    return t;
  };
  g.grow = (id, gb, go = {}) => {
    const s = byId[id];
    if (!s) throw new Error(`libMemoryBar: no segment ${id}`);
    const from = plan[id]; plan[id] = gb;
    return M.drive(from, gb, v => { live.v[id] = v; layout(); }, { d: go.d ?? 1, ease: go.ease || 'power2.inOut' });
  };
  g.overflow = (fo = {}) => {
    const d = fo.d ?? 0.9;
    const t = gsap.timeline();
    t.fromTo(flash, { opacity: 0 }, { opacity: 0.42, duration: d * 0.3, ease: 'power2.out', immediateRender: false }, 0);
    t.fromTo(flash, { opacity: 0.42 }, { opacity: 0, duration: d * 0.7, ease: 'power2.in', immediateRender: false }, d * 0.3);
    if (g.overEl) t.fromTo(g.overEl, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.12, duration: d * 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%', immediateRender: false }, 0.05);
    if (g.rim) t.fromTo(g.rim, { attr: { 'stroke-width': 3.5 } }, { attr: { 'stroke-width': 7 }, duration: d * 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }, 0);
    return t;
  };
  g.marker = (gb, mo = {}) => {
    const mg = S.g(null, g);
    const tone = mo.tone || 'ink';
    const sd = mo.side || (V ? 'right' : 'above');
    if (V) {
      const yy = P(gb);
      mg.line = S.line({ x1: x0 - 18, y1: yy, x2: x0 + T + 18, y2: yy, stroke: tone, sw: 2.5, dash: '8 7' }, mg);
      if (mo.label) mg.label = S.text(mo.label, { x: sd === 'left' ? x0 - 32 : x0 + T + 32, y: yy, size: mo.size ?? 28, weight: 600, color: tone, anchor: sd === 'left' ? 'end' : 'start' }, mg);
    } else {
      const xx = P(gb);
      mg.line = S.line({ x1: xx, y1: y0 - 18, x2: xx, y2: y0 + T + 18, stroke: tone, sw: 2.5, dash: '8 7' }, mg);
      if (mo.label) mg.label = S.text(mo.label, { x: xx, y: sd === 'below' ? y0 + T + 46 : y0 - 44, size: mo.size ?? 28, weight: 600, color: tone, anchor: mo.anchor || 'middle' }, mg);
    }
    return mg;
  };
  g.span = (a, b, so = {}) => {
    const sg = S.g(null, g);
    const tone = so.tone || 'bytes', c = S.tone(tone);
    const lo = Math.min(a, b), hi = Math.max(a, b);
    const bx = box(lo, hi);
    sg.bg = S.rect({ ...bx, r: 4, fill: c, fillOpacity: 0.12, stroke: c, strokeOpacity: 0.9, sw: 2, dash: '7 6' }, sg);
    sg.hatch = S.path({ d: M.hatch(bx.x + 3, bx.y + 3, bx.w - 6, bx.h - 6, 14), stroke: c, strokeOpacity: 0.4, sw: 2 }, sg);
    sg.hatch.setAttribute('data-audit', 'ignore');
    if (so.label) {
      sg.label = V ? S.text(so.label, { x: so.side === 'left' ? x0 - 32 : x0 + T + 32, y: bx.y + bx.h / 2, size: so.size ?? 28, weight: 600, color: tone, anchor: so.side === 'left' ? 'end' : 'start' }, sg)
        : S.text(so.label, { x: bx.x + bx.w / 2, y: so.side === 'above' ? y0 - 44 : y0 + T + 38, size: so.size ?? 28, weight: 600, color: tone, anchor: 'middle' }, sg);
    }
    return sg;
  };
  return g;
}


/**
 * libKVCache — the key/value cache: one slab per token (and per layer), each a K half (keys, solid) and a
 * V half (values, a darker shade with a bright edge), held in a panel. Slabs fill in as tokens are processed.
 *
 * o: {x = 400, y = 400 (top-left of the slab area; the panel sits `pad` outside it),
 *     layout = 'row'       'row' (tokens left → right; perRow wraps it into a pool of fixed-size blocks)
 *                          | 'stack' (thin wide slabs, bottom → top: "the stack grows by one")
 *                          | 'grid' (one column per token, one row per layer, layer 1 at the bottom),
 *     slots = 12           token slots: the cache's room (stack: 8); empty slots show as dashed outlines,
 *     filled = 0           slots already full at build time,
 *     layers = 6           grid rows (grid only; 80 works as a picture: mark its holder data-audit="ignore"),
 *     perRow               row layout: wrap after this many slots (a pool of blocks, e.g. 40 slots, perRow 10),
 *     cw, ch, gap, gapY    slab size and spacing; defaults row 64×64 gap 10 · stack 240×26 gap 7 · grid 44×24 gap 8/6,
 *     r                    slab corner radius (default from the slab size),
 *     tone = 'bytes'       slab colour: coral bytes; 'helps' for a teal store, 'struct' for blue K/V tiles,
 *     shade = 0            0..0.4: each layer (grid) or slab a slightly different shade ("its own K and V"),
 *     letters              'K'/'V' (24 px) inside each slab; default on when it fits (64×64: on; 48×48: off),
 *     empty = true         show empty slots as dashed outlines,
 *     frame = true         a panel round the slots; frameTone = 'neutral' ('helps' for "the cache" shelf),
 *     pad = 16             panel padding,
 *     label = 'KV cache'   title above the panel's left edge (null for none); labelSize = 30;
 *     sub = ''             muted text after the title,
 *     legend = false       a 'keys  values' key at the panel's top right (use when letters are off),
 *     tokens               labels under the columns (row without perRow, grid), e.g. ['t1', 't2', …] or
 *                          ['layer 1', 'layer 2', 'layer 3'] for a shelf of compartments,
 *     layerLabels = true   grid: 'L1' beside the bottom row and 'L<layers>' beside the top one}
 * Returns <g> with .cells (flat; .cell(t, l) for the grid), each cell with .slotEl .slab .base (.k .v) .kl .vl
 *   (the letters) .x .y .cx .cy,
 *   .pick(sel, layers) → cells, .slotCenter(i, l = 0) → [x, y], .slotBox(i) → {x, y, w, h} (a grid column),
 *   .frameEl .labelEl .subEl .legendEl .tokenEls .halo, .area {x, y, w, h} .frame {x, y, w, h}, .count()
 *   (slots planned full so far) and anchors .x .y .w .h .l .r .t .b .cx .cy (the panel)
 * Helpers (return timelines; call in time order; sel = index | [i, j, …] | {from, to} | 'all'):
 *   .append(n = 1, {d = 0.45, stagger = 0.12, from = 'down'|'up'|'left'|'right'|[x, y], tone, layerStagger})
 *        fill the next n empty slots; a grid fills a token's column from layer 1 up. from [x, y] flies each
 *        slab in from that point (e.g. the edge of the chip that made it); it shows from 30% of the way.
 *   .fill(sel, {…same, layers})     fill particular slots: refill evicted blocks, recompute invalid ones
 *                                   (their crack lifts), or other users' blocks with tone 'neutral'
 *   .read({d = 0.6, stagger = 0, sel, layers, to = 0.5})   full slabs flash at once: "all of it is read"
 *   .reuse(n, {d = 0.8, label, tint = true, rings = false}) the reused prefix: a teal band sweeps over the
 *        first n slots and their slabs turn teal; n = 0 sweeps it away. The timeline's .label is the label.
 *   .tint(sel, tone, {d = 0.4, stagger = 0.04, layers})     cross-fade slabs to another tone ('helps' teal,
 *        'neutral' grey "old t2"); tone null restores their own colour
 *   .mark(sel, {tone = 'helps', d = 0.4, stagger = 0.04, layers})  outline slots ("yours"); tone null removes
 *   .invalidate(sel, {stagger = 0.3, d = 0.35, layers})   slabs crack and go grey (dashed edge from 30 px): stale
 *   .evict(sel = 'all', {stagger = 0.06, d = 0.4, drop = 18, grey = false})  slabs drop out, leaving empty
 *        slots (grey: they first turn grey, "least recently used"); clears tints, cracks and outlines
 *   .clear({…}) = .evict('all', {…})
 * Example:
 *   const kv = libKVCache(S, { x: 300, y: 600, slots: 20, filled: 12, label: 'KV cache' });
 *   S.add(S.fx.in(kv), 'b1');
 *   S.add(kv.append(8, { stagger: 0.18 }), 'b1~appends');
 *   S.add(kv.reuse(20, { label: 'hit: reused' }), 'b3~skip');
 *   S.add(kv.invalidate({ from: 2, to: 19 }, { stagger: 0.12 }), 'b4~wrong');
 */
function libKVCache(S, o = {}, parent) {
  const M = _libMem;
  const g = S.g(null, parent);
  const lay = o.layout || 'row';
  const GRID = lay === 'grid', STACK = lay === 'stack';
  const n = o.slots ?? (STACK ? 8 : 12);
  const NL = GRID ? (o.layers ?? 6) : 1;
  const per = !GRID && !STACK ? Math.max(1, Math.min(n, o.perRow || n)) : n;
  const cw = o.cw ?? (GRID ? 44 : STACK ? 240 : 64), ch = o.ch ?? (GRID ? 24 : STACK ? 26 : 64);
  const gx = GRID ? (o.gap ?? 8) : STACK ? 0 : (o.gap ?? 10);
  const gy = GRID ? (o.gapY ?? 6) : STACK ? (o.gap ?? 7) : (o.gapY ?? o.gap ?? 10);
  const x0 = o.x ?? 400, y0 = o.y ?? 400;
  const tone = o.tone || 'bytes';
  const cols = GRID ? n : STACK ? 1 : per, rows = GRID ? NL : STACK ? n : Math.ceil(n / per);
  const AW = cols * cw + (cols - 1) * gx, AH = rows * ch + (rows - 1) * gy;
  const pos = (i, l = 0) => (GRID ? [x0 + i * (cw + gx), y0 + (NL - 1 - l) * (ch + gy)]
    : STACK ? [x0, y0 + (n - 1 - i) * (ch + gy)] : [x0 + (i % per) * (cw + gx), y0 + Math.floor(i / per) * (ch + gy)]);
  const r = o.r ?? Math.max(2, Math.min(8, Math.min(cw, ch) / 5));
  const ri = Math.min(2, r);
  const sgap = Math.max(2, Math.round(Math.min(cw * 0.06, 4)));
  const hw = (cw - sgap) / 2;
  const letters = o.letters ?? (hw >= 26 && ch >= 40);
  const lsz = Math.min(30, Math.max(24, Math.round(Math.min(hw, ch) * 0.8)));
  const shadeAmt = o.shade ?? 0;
  const rnd = S.rand(7919 + n * 31 + NL);
  const shadeOf = [];
  for (let i = 0; i < Math.max(n, NL); i++) shadeOf.push(rnd());
  /** colours of a slab in a tone: k fill, v fill, edge, k letter, v letter */
  const colours = (t, i, l) => {
    if (t === 'invalid') return { k: M.GREY.k, v: M.GREY.v, s: M.GREY.s, kl: M.GREY.ink, vl: M.GREY.vink };
    const sh = shadeAmt ? shadeAmt * shadeOf[GRID ? l : i] : 0;
    const k = sh ? M.mix(S, t, M.BASE, sh) : M.solid(S, t);
    return { k, v: M.mix(S, t, M.BASE, 0.64 + sh * 0.25), s: S.tone(t), kl: M.DARK, vl: S.tone(t) };
  };

  // ---------------------------------------------------------------- panel, title, legend, axis labels
  const pad = o.pad ?? 16;
  const fb = { x: x0 - pad, y: y0 - pad, w: AW + 2 * pad, h: AH + 2 * pad };
  if (o.frame !== false) {
    const ft = o.frameTone || 'neutral';
    S.rect({ ...fb, r: 18, fill: M.BASE, filter: 'url(#shadow)' }, g);
    g.frameEl = S.rect({ ...fb, r: 18, fill: M.card(ft), stroke: ft === 'neutral' ? '#ffffff' : ft, strokeOpacity: ft === 'neutral' ? 0.14 : 0.6, sw: 2 }, g);
  }
  const label = o.label === undefined ? 'KV cache' : o.label;
  const ty = fb.y - 34;
  if (label) {
    const ls = o.labelSize ?? 30;
    g.labelEl = S.text(label, { x: fb.x + 2, y: ty, size: ls, weight: 650, color: o.labelColor || 'ink' }, g);
    if (o.sub) g.subEl = S.text(o.sub, { x: fb.x + 2 + S.measure(label, { size: ls, weight: 650 }) + 16, y: ty + 1, size: 26, weight: 500, color: 'muted' }, g);
  }
  if (o.legend) {
    const lg = S.g(null, g);
    const C = colours(tone, 0, 0);
    const items = [['keys', C.k, null], ['values', C.v, C.s]];
    let xr = fb.x + fb.w - 2;
    for (let q = items.length - 1; q >= 0; q--) {
      const [word, fill, stroke] = items[q];
      S.text(word, { x: xr, y: ty, size: 24, weight: 550, color: 'muted', anchor: 'end' }, lg);
      xr -= S.measure(word, { size: 24, weight: 550 }) + 10;
      S.rect({ x: xr - 14, y: ty - 10, w: 14, h: 20, r: 3, fill, stroke: stroke || undefined, sw: 1.5 }, lg);
      xr -= 14 + 26;
    }
    g.legendEl = lg;
  }
  if (GRID && o.layerLabels !== false) {
    const lx = fb.x - 14;
    S.text('L1', { x: lx, y: pos(0, 0)[1] + ch / 2, size: 24, family: 'mono', color: 'muted', anchor: 'end' }, g);
    if (NL > 1) S.text(`L${NL}`, { x: lx, y: pos(0, NL - 1)[1] + ch / 2, size: 24, family: 'mono', color: 'muted', anchor: 'end' }, g);
  }
  const tokY = fb.y + fb.h + 30;
  if (o.tokens && !STACK && per === n) {
    g.tokenEls = o.tokens.map((t, i) => (t != null && i < n ? S.text(t, { x: pos(i, 0)[0] + cw / 2, y: tokY, size: 24, family: 'mono', color: 'muted', anchor: 'middle' }, g) : null));
  }

  // ---------------------------------------------------------------- the reuse band (behind the slabs)
  const back = S.g(null, g);
  const hp0 = Math.min(10, Math.max(4, pad - 4));
  const hp = GRID || !STACK ? Math.min(hp0, Math.max(3, gx / 2 - 1)) : hp0;   // along the row: half the gap
  const vp = STACK ? Math.min(hp0, Math.max(3, gy / 2 - 1)) : hp0;
  const halo = S.rect({ x: x0 - hp, y: y0 - vp, w: 0, h: AH + 2 * vp, r: Math.min(14, r + hp), fill: 'helps', fillOpacity: 0.16, stroke: 'helps', strokeOpacity: 0.9, sw: 2 }, back);
  gsap.set(halo, { autoAlpha: 0 });
  const haloGeom = k => {
    if (k <= 0) return STACK ? { x: x0 - hp, y: y0 + AH + vp, width: cw + 2 * hp, height: 0 } : { x: x0 - hp, y: y0 - vp, width: 0, height: AH + 2 * vp };
    if (STACK) { const top = pos(k - 1)[1]; return { x: x0 - hp, y: top - vp, width: cw + 2 * hp, height: y0 + AH - top + 2 * vp }; }
    const right = pos(Math.min(k, per) - 1)[0] + cw;
    return { x: x0 - hp, y: y0 - vp, width: right - x0 + 2 * hp, height: (per < n ? (Math.floor((k - 1) / per) + 1) * (ch + gy) - gy : AH) + 2 * vp };
  };
  g.halo = halo;

  // ---------------------------------------------------------------- slabs
  // A cell: an empty-slot outline, then the slab (moved for fill/evict) holding its faces, one K/V
  // letter pair and its overlays. A face is the K and V shapes in one state: null (its own tone), a tint
  // tone ('helps', 'neutral', …) or 'invalid'. State changes cross-fade faces; the letters only change
  // colour, so a slab never shows two sets of letters at once.
  const cellLayer = S.g(null, g);
  const cells = [];                          // index t * NL + l
  const kd = (x, y) => M.rr(x, y, hw, ch, [r, ri, ri, r]);
  const vd = (x, y) => M.rr(x + hw + sgap, y, hw, ch, [ri, r, r, ri]);
  function face(c, t, into) {
    const fg = S.g(null, into);
    const C = colours(t, c.t, c.l);
    fg.k = S.path({ d: kd(c.x, c.y), fill: C.k }, fg);
    fg.v = S.path({ d: vd(c.x, c.y), fill: C.v, stroke: C.s, strokeOpacity: 0.9, sw: 1.5 }, fg);
    return fg;
  }
  for (let i = 0; i < n; i++) for (let l = 0; l < NL; l++) {
    const [x, y] = pos(i, l);
    const c = S.g(null, cellLayer);
    Object.assign(c, { t: i, l, x, y, w: cw, h: ch, cx: x + cw / 2, cy: y + ch / 2 });
    c.slotEl = S.rect({ x, y, w: cw, h: ch, r, fill: '#ffffff', fillOpacity: o.empty === false ? 0 : 0.025, stroke: '#ffffff', strokeOpacity: o.empty === false ? 0 : 0.24, sw: 1.5, dash: ch < 16 ? '3 3' : '5 5' }, c);
    c.slab = S.g(null, c);
    c.faces = S.g(null, c.slab);
    c.base = face(c, tone, c.faces);
    c.k = c.base.k; c.v = c.base.v;
    if (letters) {
      const C = colours(tone, i, l);
      c.kl = S.text('K', { x: x + hw / 2, y: y + ch / 2 + 1, size: lsz, weight: 700, family: 'mono', anchor: 'middle', color: C.kl }, c.slab);
      c.vl = S.text('V', { x: x + hw + sgap + hw / 2, y: y + ch / 2 + 1, size: lsz, weight: 700, family: 'mono', anchor: 'middle', color: C.vl }, c.slab);
    }
    c.over = S.g(null, c.slab);             // crack, glint and ring live here (built when first needed)
    const on = i < (o.filled ?? 0);
    c.__p = { on, tone, face: null, ring: null };
    if (on) gsap.set(c.slotEl, { autoAlpha: 0 });
    else gsap.set(c.slab, { autoAlpha: 0 });
    cells.push(c);
  }
  const cellAt = (i, l = 0) => cells[i * NL + l];
  // faces and overlays are built lazily at helper-call (build) time: deterministic
  const faceEl = (c, k) => {
    if (k === null || k === undefined) return c.base;
    c.alt = c.alt || {};
    if (!c.alt[k]) { c.alt[k] = face(c, k, c.faces); gsap.set(c.alt[k], { autoAlpha: 0 }); }
    return c.alt[k];
  };
  const marks = c => c.marksEl || (c.marksEl = (() => {
    const e = S.g(null, c.over);
    if (ch >= 30 && cw >= 30) S.rect({ x: c.x - 3, y: c.y - 3, w: cw + 6, h: ch + 6, r: r + 2, stroke: M.GREY.edge, sw: 2, dash: '5 4' }, e);
    e.crack = S.path({ d: M.crack(c.x, c.y, cw, ch), stroke: M.DARK, sw: Math.max(2, Math.min(3.5, cw / 18)) }, e);
    e.crack.setAttribute('data-audit', 'ignore');
    gsap.set(e, { autoAlpha: 0 });
    return e;
  })());
  const glint = c => c.glintEl || (c.glintEl = (() => {
    const e = S.rect({ x: c.x - 1, y: c.y - 1, w: cw + 2, h: ch + 2, r, fill: '#ffffff', opacity: 0 }, c.over);
    e.setAttribute('data-audit', 'ignore');
    return e;
  })());
  const ring = c => c.ringEl || (c.ringEl = (() => {
    const e = S.rect({ x: c.x - 4, y: c.y - 4, w: cw + 8, h: ch + 8, r: r + 3, stroke: 'helps', sw: ch < 16 ? 2 : 2.5 }, c.over);
    gsap.set(e, { autoAlpha: 0 });
    return e;
  })());
  const pick = (s, layers) => {
    const ls = layers == null ? null : M.sel(layers, NL);
    const out = [];
    for (const i of M.sel(s, n)) for (let l = 0; l < NL; l++) if (!ls || ls.includes(l)) out.push(cellAt(i, l));
    return out;
  };
  const fromVec = (c, from) => {
    if (Array.isArray(from)) return { x: from[0] - c.cx, y: from[1] - c.cy };
    const dd = Math.max(18, Math.min(30, ch * 0.5));
    return { up: { y: dd }, down: { y: -dd }, left: { x: dd }, right: { x: -dd } }[from] || { y: -dd };
  };
  const toneOf = (c, k) => (k === null || k === undefined ? c.__p.tone : k);
  // cross-fade a cell from face a to face b over d (instantly when d is 0); letters tween colour
  const swapFace = (t, c, a, b, at, d) => {
    if (a === b) return;
    const ia = d > 0 ? { duration: d, ease: 'power1.inOut', immediateRender: false } : { duration: 0.001, immediateRender: false };
    t.fromTo(faceEl(c, a), { autoAlpha: 1 }, { autoAlpha: 0, ...ia }, at);
    t.fromTo(faceEl(c, b), { autoAlpha: 0 }, { autoAlpha: 1, ...ia }, at);
    if (letters) {
      const A = colours(toneOf(c, a), c.t, c.l), B = colours(toneOf(c, b), c.t, c.l);
      if (A.kl !== B.kl) t.fromTo(c.kl, { attr: { fill: A.kl } }, { attr: { fill: B.kl }, ...ia }, at);
      if (A.vl !== B.vl) t.fromTo(c.vl, { attr: { fill: A.vl } }, { attr: { fill: B.vl }, ...ia }, at);
    }
    if (a === 'invalid') t.fromTo(marks(c), { autoAlpha: 1 }, { autoAlpha: 0, ...ia }, at);
    if (b === 'invalid') {
      t.fromTo(marks(c), { autoAlpha: 0 }, { autoAlpha: 1, ...ia }, at);
      if (d > 0) t.fromTo(marks(c).crack, { drawSVG: '0%' }, { drawSVG: '100%', duration: d * 0.8, ease: 'power2.out', immediateRender: false }, at + 0.05);
    }
  };

  // ---------------------------------------------------------------- helpers
  const plan = { reuse: 0, label: null };
  g.fill = (s, fo = {}) => {
    const t = gsap.timeline();
    const d = fo.d ?? 0.45, st = fo.stagger ?? 0.12;
    const ls = fo.layerStagger ?? (GRID ? Math.min(0.05, 0.7 / NL) : 0);
    const from = fo.from ?? 'down';
    const fly = Array.isArray(from);
    const tn = fo.tone || tone;
    const lsel = fo.layers == null ? null : M.sel(fo.layers, NL);
    M.sel(s, n).forEach((i, q) => {
      for (let l = 0; l < NL; l++) {
        if (lsel && !lsel.includes(l)) continue;
        const c = cellAt(i, l), p = c.__p, at = q * st + l * ls;
        if (p.on && p.face !== 'invalid') continue;
        if (p.on) {
          // recompute: the crack lifts and the slab comes back in its own colour
          swapFace(t, c, 'invalid', null, at, d * 0.7);
          t.fromTo(c.slab, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.08, duration: d * 0.35, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%', immediateRender: false }, at);
          p.face = null;
          continue;
        }
        if (p.tone !== tn) {
          // the base face changes colour while the slot is empty and the slab hidden
          const A = colours(p.tone, i, l), B = colours(tn, i, l);
          M.setAttr(t, c.base.k, { fill: A.k }, { fill: B.k }, at);
          M.setAttr(t, c.base.v, { fill: A.v, stroke: A.s }, { fill: B.v, stroke: B.s }, at);
          if (letters) { M.setAttr(t, c.kl, { fill: A.kl }, { fill: B.kl }, at); M.setAttr(t, c.vl, { fill: A.vl }, { fill: B.vl }, at); }
          p.tone = tn;
        }
        const v = fromVec(c, from);
        t.fromTo(c.slotEl, { autoAlpha: 1 }, { autoAlpha: 0, duration: d * 0.6, immediateRender: false }, at + (fly ? d * 0.9 : 0.05));
        if (fly) {
          // a slab flown in from a point (the chip that made it) emerges a little way out, then glides home
          const D = d * 1.8;
          t.fromTo(c.slab, { x: v.x, y: v.y }, { x: 0, y: 0, duration: D, ease: 'power2.inOut', immediateRender: false }, at);
          t.fromTo(c.slab, { autoAlpha: 0 }, { autoAlpha: 1, duration: D * 0.3, ease: 'power1.out', immediateRender: false }, at + D * 0.3);
        } else t.fromTo(c.slab, { autoAlpha: 0, x: v.x || 0, y: v.y || 0 }, { autoAlpha: 1, x: 0, y: 0, duration: d, ease: 'power3.out', immediateRender: false }, at);
        p.on = true;
      }
    });
    return t;
  };
  g.append = (k = 1, ao = {}) => {
    const free = [];
    for (let i = 0; i < n && free.length < k; i++) if (!cellAt(i, 0).__p.on) free.push(i);
    if (free.length < k) S.warn(`libKVCache.append: asked for ${k}, only ${free.length} empty slots`);
    return g.fill(free, ao);
  };
  g.evict = (s = 'all', eo = {}) => {
    const t = gsap.timeline();
    const st = eo.stagger ?? 0.06, d = eo.d ?? 0.4, drop = eo.drop ?? 18;
    const list = M.sel(s, n).filter(i => cellAt(i, 0).__p.on);
    list.forEach((i, q) => {
      for (let l = 0; l < NL; l++) {
        const c = cellAt(i, l), p = c.__p;
        if (!p.on) continue;
        let at = q * st;
        let shown = p.face;                              // the face showing as the slab leaves
        if (eo.grey && shown !== 'invalid' && shown !== 'neutral') { swapFace(t, c, shown, 'neutral', at, 0.25); shown = 'neutral'; at += 0.3; }
        t.fromTo(c.slab, { autoAlpha: 1, x: 0, y: 0 }, { autoAlpha: 0, y: drop, duration: d, ease: 'power2.in', immediateRender: false }, at);
        t.fromTo(c.slotEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.8, immediateRender: false }, at + d * 0.4);
        // once hidden, reset the slab to its plain state so a refill starts clean
        const z = at + d + 0.02;
        t.fromTo(c.slab, { y: drop }, { y: 0, duration: 0.001, immediateRender: false }, z);
        swapFace(t, c, shown, null, z, 0);
        if (p.ring) M.setVis(t, ring(c), 1, 0, z);
        Object.assign(p, { on: false, ring: null, face: null });
      }
    });
    return t;
  };
  g.clear = (co = {}) => g.evict('all', co);
  g.read = (ro = {}) => {
    const d = ro.d ?? 0.6;
    const els = pick(ro.sel ?? 'all', ro.layers).filter(c => c.__p.on).map(glint);
    if (!els.length) return gsap.timeline();
    return gsap.fromTo(els, { opacity: 0 }, { opacity: ro.to ?? 0.5, duration: d / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', stagger: ro.stagger ?? 0, immediateRender: false });
  };
  g.tint = (s, tn, to = {}) => {
    const t = gsap.timeline();
    const d = to.d ?? 0.4, st = to.stagger ?? 0.04;
    pick(s, to.layers).forEach((c, q) => {
      const p = c.__p;
      const want = !tn || tn === p.tone ? null : tn;
      if (!p.on || p.face === 'invalid' || p.face === want) return;
      swapFace(t, c, p.face, want, q * st, d);
      p.face = want;
    });
    return t;
  };
  g.mark = (s, mo = {}) => {
    const t = gsap.timeline();
    const tn = mo.tone === undefined ? 'helps' : mo.tone, d = mo.d ?? 0.4;
    pick(s, mo.layers).forEach((c, q) => {
      const p = c.__p, e = ring(c), at = q * (mo.stagger ?? 0.04);
      if (tn) {
        if (p.ring !== tn) M.setAttr(t, e, { stroke: S.tone(p.ring || 'helps') }, { stroke: S.tone(tn) }, at);
        if (!p.ring) t.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: d, immediateRender: false }, at);
      } else if (p.ring) t.fromTo(e, { autoAlpha: 1 }, { autoAlpha: 0, duration: d, immediateRender: false }, at);
      p.ring = tn;
    });
    return t;
  };
  g.reuse = (k, po = {}) => {
    const t = gsap.timeline();
    const d = po.d ?? 0.8;
    const from = plan.reuse, to = Math.max(0, Math.min(n, k));
    plan.reuse = to;
    const A = haloGeom(from), B = haloGeom(to);
    t.fromTo(halo, { autoAlpha: from > 0 ? 1 : 0, attr: A }, { autoAlpha: to > 0 ? 1 : 0, attr: B, duration: d, ease: 'power2.inOut', immediateRender: false }, 0);
    const lo = Math.min(from, to), hi = Math.max(from, to);
    for (let i = lo; i < hi; i++) {
      // each slab changes as the band's edge passes it
      const frac = to > from ? (i - lo + 0.5) / (hi - lo) : (hi - i - 0.5) / (hi - lo);
      const at = d * 0.9 * frac;
      for (let l = 0; l < NL; l++) {
        const c = cellAt(i, l), p = c.__p;
        const want = to > from && p.tone !== 'helps' ? 'helps' : null;
        if (po.tint !== false && p.on && p.face !== 'invalid' && p.face !== want) { swapFace(t, c, p.face, want, at, 0.3); p.face = want; }
        if (po.rings) {
          const e = ring(c);
          if (to > from && !p.ring) { M.setAttr(t, e, { stroke: S.tone('helps') }, { stroke: S.tone('helps') }, at); t.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, immediateRender: false }, at); p.ring = 'helps'; }
          else if (to < from && p.ring) { t.fromTo(e, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25, immediateRender: false }, at); p.ring = null; }
        }
      }
    }
    if (plan.label && (po.label || to === 0)) { t.fromTo(plan.label, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, immediateRender: false }, 0); plan.label = null; }
    if (po.label && to > 0) {
      const lab = STACK ? S.text(po.label, { x: fb.x + fb.w + 22, y: B.y + B.height / 2, size: po.size ?? 28, weight: 600, color: 'helps' }, g)
        : S.text(po.label, { x: B.x + B.width / 2, y: (o.frame !== false ? fb.y + fb.h : B.y + B.height) + (g.tokenEls ? 70 : 36), size: po.size ?? 28, weight: 600, color: 'helps', anchor: 'middle' }, g);
      gsap.set(lab, { autoAlpha: 0 });
      t.fromTo(lab, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', immediateRender: false }, d * 0.75);
      t.label = lab;
      plan.label = lab;
    }
    return t;
  };
  g.invalidate = (s, io = {}) => {
    const t = gsap.timeline();
    const st = io.stagger ?? 0.3, d = io.d ?? 0.35;
    const lsel = io.layers == null ? null : M.sel(io.layers, NL);
    M.sel(s, n).forEach((i, q) => {
      for (let l = 0; l < NL; l++) {
        if (lsel && !lsel.includes(l)) continue;
        const c = cellAt(i, l), p = c.__p;
        if (!p.on || p.face === 'invalid') continue;
        const at = q * st;
        swapFace(t, c, p.face, 'invalid', at, d);
        if (p.ring) { t.fromTo(ring(c), { autoAlpha: 1 }, { autoAlpha: 0, duration: d, immediateRender: false }, at); p.ring = null; }
        p.face = 'invalid';            // a recompute (fill) brings back the slab's own colour
      }
    });
    return t;
  };

  Object.assign(g, {
    cells, cell: cellAt, pick, area: { x: x0, y: y0, w: AW, h: AH }, frame: fb,
    slotCenter: (i, l = 0) => { const [x, y] = pos(i, l); return [x + cw / 2, y + ch / 2]; },
    slotBox: i => { const [x, y] = pos(i, 0); return GRID ? { x, y: y0, w: cw, h: AH } : { x, y, w: cw, h: ch }; },
    count: () => { let k = 0; for (let i = 0; i < n; i++) if (cellAt(i, 0).__p.on) k++; return k; },
    x: fb.x, y: fb.y, w: fb.w, h: fb.h, l: fb.x, r: fb.x + fb.w, t: fb.y, b: fb.y + fb.h, cx: fb.x + fb.w / 2, cy: fb.y + fb.h / 2,
  });
  return g;
}


/**
 * libByteStream — bytes moving: a thick coral conduit from a memory block to a chip, with particles
 * (S.flow) streaming along it, a rate label (bandwidth), and a packet for a fixed amount ("140 GB") that
 * crosses and is consumed by the chip, which flashes amber.
 *
 * o: {x1 = 560, y1 = 540, x2 = 1360, y2 = y1   the conduit's ends: memory end, chip end (any straight
 *                                              direction; the blocks sit beyond the ends),
 *     width = 56                               conduit thickness (a laptop's narrow pipe ≈ 14, HBM 56–72),
 *     tone = 'bytes'                           ('struct' for tokens on a wire, 'compute' for amber work),
 *     wall                                     wall colour (default the tone; 'struct' for a blue outline),
 *     lanes                                    hairline lanes inside (decorative); default by width,
 *     source = {}                              the memory block: any libMemBlock options; defaults
 *                                              {style: 'stack', w: 200, h: 200, label: 'memory', sub: '140 GB'};
 *                                              false to connect to a block of your own,
 *     sink = {title = 'chip', w = 190, h = 190, size = 30} | false,
 *     rate = '3.35 TB/s'                       label beside the conduit (mono, in the tone); null for none,
 *     rateSub                                  a smaller muted word after it, e.g. 'bandwidth'; rateSize = 36,
 *     rateSide                                 'above' (default) | 'below' for a horizontal conduit,
 *                                              'right' (default) | 'left' for a vertical one,
 *     label                                    muted text on the other side from the rate (e.g. 'bus'),
 *     meter = false | true | {x, y, label = 'bytes moved', unit = 'GB', size = 44}   a counter for .pass}
 * Returns <g> with .pipe .body .walls .source (a libMemBlock) .sink (.glow .labelEl) .rateEl .rateSubEl .labelEl
 *   .meter (.num .labelEl), and .start [x, y] .end [x, y] .mid [x, y] .d (centre-line path) .len .width
 * Helpers:
 *   .flow(from, to, {density = 'steady' ('trickle'|'steady'|'dense') | every, speed = 520, size, lanes,
 *        shape = 'chip', opacity, tone}) particles between two time specs. It wraps S.flow and, like S.flow,
 *        schedules itself (the one helper that does); it returns the flow groups. Speed should mean something.
 *   .pass({amount = 140, unit = 'GB', label, d = 1.2, ease, count = false, countFrom = 0, flash = true, slices = 0, length})
 *        → timeline: a packet labelled '140 GB' leaves the memory, crosses and is consumed by the chip, which
 *        flashes; with count the meter runs countFrom → countFrom + amount over the crossing (0 → 140 per
 *        token; countFrom 140 for a running total); slices > 0 draws it as a ribbon. The packet shows only
 *        inside the conduit; a label too big for it rides beside, on the side away from the rate.
 *        The timeline's .packet is the packet group.
 *   .flash({d = 0.45, to = 0.45}) → the chip flashes amber (arithmetic on the bytes that arrived)
 *   .setRate(text, {d = 0.4}) → swaps the rate label (e.g. '4.8 TB/s'). Rate and meter changes are seek-safe:
 *        call setRate/countRate (not S.fx.swap/count) to change them, as often as needed.
 *   .countRate(to, {from = 0, d = 1.2, dec, unit}) → the rate label counts up to a value ('3.35 TB/s'),
 *        keeping the unit of the label as built
 * Example:
 *   const bus = libByteStream(S, { x1: 520, y1: 560, x2: 1380, rate: '3.35 TB/s', rateSub: 'bandwidth', meter: true });
 *   S.add(S.fx.in(bus, { from: 'fade' }), 'b1');
 *   bus.flow('b1+0.3', 'b3>', { density: 'steady' });
 *   S.add(bus.pass({ amount: 140, count: true }), 'b2~every');
 */
function libByteStream(S, o = {}, parent) {
  const M = _libMem;
  const g = S.g(null, parent);
  const x1 = o.x1 ?? 560, y1 = o.y1 ?? 540, x2 = o.x2 ?? 1360, y2 = o.y2 ?? y1;
  const W = o.width ?? 56, tone = o.tone || 'bytes', c = S.tone(tone), cw = S.tone(o.wall || tone);
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const ang = Math.atan2(dy, dx) * 180 / Math.PI;
  const at = (s, k = 0) => [x1 + ux * s + nx * k, y1 + uy * s + ny * k];   // s along, k across
  const horiz = Math.abs(ny) >= Math.abs(nx);

  // ---------------------------------------------------------------- layers (bottom → top)
  const pipe = S.g(null, g), flowLayer = S.g(null, g), packLayer = S.g(null, g), ends = S.g(null, g), labels = S.g(null, g);
  flowLayer.setAttribute('data-audit', 'ignore');

  // ---------------------------------------------------------------- conduit (drawn along +x, then rotated into place)
  pipe.setAttribute('transform', `translate(${x1},${y1}) rotate(${ang.toFixed(3)})`);
  const rr = Math.min(W / 2, 10);
  const deco = S.g(null, pipe);
  deco.setAttribute('data-audit', 'ignore');
  if (W >= 10) S.rect({ x: -6, y: -W / 2 - 9, w: len + 12, h: W + 18, r: rr + 9, fill: c, fillOpacity: 0.05 }, deco);
  S.rect({ x: -6, y: -W / 2, w: len + 12, h: W, r: rr, fill: M.BASE }, pipe);
  // a tube: brighter at the walls, darker in the middle
  const gid = M.id('libmem-tube');
  const lg = S.el('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, pipe);
  [[0, 0.34], [0.2, 0.13], [0.5, 0.07], [0.8, 0.13], [1, 0.34]].forEach(([off, a]) => S.el('stop', { offset: off, 'stop-color': c, 'stop-opacity': a }, lg));
  g.body = S.rect({ x: -6, y: -W / 2, w: len + 12, h: W, r: rr, fill: `url(#${gid})` }, pipe);
  const nLanes = o.lanes ?? (W >= 64 ? 5 : W >= 40 ? 3 : W >= 20 ? 1 : 0);
  let ld = '';
  for (let i = 1; i <= nLanes; i++) { const yy = -W / 2 + i * W / (nLanes + 1); ld += `M0,${yy.toFixed(2)}H${len.toFixed(2)}`; }
  if (ld) S.path({ d: ld, stroke: c, strokeOpacity: nLanes > 12 ? 0.22 : 0.15, sw: nLanes > 12 ? 0.8 : 1 }, deco);
  g.walls = [-1, 1].map(sg => S.line({ x1: -4, y1: sg * W / 2, x2: len + 4, y2: sg * W / 2, stroke: cw, strokeOpacity: 0.8, sw: W >= 20 ? 2.5 : 2, cap: 'butt' }, pipe));
  g.pipe = pipe;
  g.d = `M${x1},${y1} L${x2},${y2}`;

  // ---------------------------------------------------------------- ends
  const ext = (w, h) => Math.abs(ux) * w / 2 + Math.abs(uy) * h / 2;   // half-extent of a box along the conduit
  if (o.source !== false) {
    const so = { style: 'stack', w: 200, h: 200, label: 'memory', sub: '140 GB', size: 32, tone, ...(o.source || {}) };
    const e = ext(so.w, so.h) - 3;
    const cx = x1 - ux * e, cy = y1 - uy * e;
    g.source = libMemBlock(S, { ...so, x: cx - so.w / 2, y: cy - so.h / 2 }, ends);
  }
  if (o.sink !== false) {
    const si = o.sink || {};
    const w = si.w ?? 190, h = si.h ?? 190;
    const e = ext(w, h) - 3;
    const cx = x2 + ux * e, cy = y2 + uy * e;
    const sk = S.g(null, ends);
    const X = cx - w / 2, Y = cy - h / 2;
    S.rect({ x: X, y: Y, w, h, r: 16, fill: '#1a1408', stroke: 'compute', strokeOpacity: 0.85, sw: 2.5, filter: 'url(#shadow)' }, sk);
    // the die's working areas: one path of small squares (zoom-safe, unlike a <pattern>)
    const cell = 22, inset = 16;
    const nxC = Math.max(1, Math.floor((w - 2 * inset + 4) / cell)), nyC = Math.max(1, Math.floor((h - 2 * inset + 4) / cell));
    const ox = X + (w - (nxC * cell - 4)) / 2, oy = Y + (h - (nyC * cell - 4)) / 2;
    let dd = '';
    for (let a = 0; a < nyC; a++) for (let b = 0; b < nxC; b++) dd += M.rr(ox + b * cell, oy + a * cell, 18, 18, [3, 3, 3, 3]);
    const grid = S.path({ d: dd, fill: 'compute', fillOpacity: 0.2 }, sk);
    grid.setAttribute('data-audit', 'ignore');
    sk.glow = S.rect({ x: X, y: Y, w, h, r: 16, fill: 'compute', opacity: 0 }, sk);
    sk.glow.setAttribute('data-audit', 'ignore');
    if (si.title !== null) sk.labelEl = S.text(si.title ?? 'chip', { x: cx, y: Y + h + 34, size: si.size ?? 30, weight: 650, color: 'compute', anchor: 'middle' }, sk);
    Object.assign(sk, { x: X, y: Y, w, h, l: X, r: X + w, t: Y, b: Y + h, cx, cy });
    g.sink = sk;
  }

  // ---------------------------------------------------------------- labels beside the conduit
  const [mx, my] = at(len / 2);
  const side = (k, text, so) => {
    // k < 0: above a horizontal conduit, right of a vertical one
    const off = W / 2 + (so.gap ?? 36);
    let px = mx, py = my, anchor = 'middle';
    if (horiz) py = my + k * off;
    else { px = mx - k * (off - 10); anchor = k < 0 ? 'start' : 'end'; }
    return S.text(text, { x: px, y: py, anchor, ...so }, labels);
  };
  const rateSize = o.rateSize ?? 36;
  const rk = ['below', 'left'].includes(o.rateSide) ? 1 : -1;
  const rateW = str => S.measure(str, { size: rateSize, weight: 650, family: 'mono' });
  let setRateText = null;
  if (o.rate !== null) {
    const built = String(o.rate ?? '3.35 TB/s');
    g.rateEl = side(rk, built, { size: rateSize, weight: 650, family: 'mono', color: tone });
    const rx = +g.rateEl.getAttribute('x'), ry = +g.rateEl.getAttribute('y'), anc = g.rateEl.getAttribute('text-anchor');
    if (o.rateSub) {
      const sw = S.measure(o.rateSub, { size: 26, weight: 500 });
      if (anc === 'end') g.rateSubEl = S.text(o.rateSub, { x: rx, y: ry + rateSize * 0.95, size: 26, weight: 500, color: 'muted', anchor: 'end' }, labels);
      else g.rateSubEl = S.text(o.rateSub, { x: rx, y: ry + 3, size: 26, weight: 500, color: 'muted' }, labels);
      if (anc === 'middle') g.rateEl.setAttribute('text-anchor', 'start');
      // the rate and its word stay a pair: centred over the conduit (or after the rate), whatever the rate reads
      setRateText = str => {
        g.rateEl.textContent = str;
        const w = rateW(str);
        if (anc === 'middle') { const l = rx - (w + 14 + sw) / 2; g.rateEl.setAttribute('x', l.toFixed(2)); g.rateSubEl.setAttribute('x', (l + w + 14).toFixed(2)); }
        else if (anc === 'start') g.rateSubEl.setAttribute('x', (rx + w + 14).toFixed(2));
      };
    } else setRateText = str => { g.rateEl.textContent = str; };
    setRateText(built);
  }
  const plan = { rate: o.rate === null ? null : String(o.rate ?? '3.35 TB/s'), meter: null };
  if (o.label) g.labelEl = side(-rk, o.label, { size: o.labelSize ?? 28, weight: 550, color: 'muted' });

  // ---------------------------------------------------------------- meter
  if (o.meter) {
    const mo = o.meter === true ? {} : o.meter;
    const sk = g.sink, msz = mo.size ?? 44;
    const mxp = mo.x ?? (sk ? sk.cx : x2), myp = mo.y ?? (sk ? sk.t - msz * 1.9 : y2 - 140);
    const mg = S.g(null, labels);
    mg.num = S.counter({ x: mxp, y: myp, size: msz, value: 0, anchor: 'middle', color: 'ink', fmt: v => `${M.num(v)} ${mo.unit ?? 'GB'}` }, mg);
    plan.meter = mg.num.textContent;
    mg.labelEl = S.text(mo.label ?? 'bytes moved', { x: mxp, y: myp + msz * 0.92, size: 26, weight: 550, color: 'muted', anchor: 'middle' }, mg);
    g.meter = mg;
  }

  // ---------------------------------------------------------------- anchors, helpers
  Object.assign(g, { start: [x1, y1], end: [x2, y2], mid: [mx, my], len, width: W });
  g.flow = (from, to, fo = {}) => {
    const dens = fo.density ?? 'steady';
    const every = fo.every ?? ({ trickle: 0.45, steady: 0.13, dense: 0.07 }[dens] || 0.13);
    const k = fo.lanes ?? (W >= 40 ? 3 : W >= 24 ? 2 : 1);
    const size = fo.size ?? Math.max(3, Math.min(8, W * 0.12));
    const spread = Math.max(0, W / 2 - size * 1.8);
    const ft = fo.tone || tone;
    const out = [];
    for (let i = 0; i < k; i++) {
      const off = k === 1 ? 0 : -spread + (2 * spread) * i / (k - 1);
      const [ax, ay] = at(-10, off), [bx, by] = at(len + 10, off);
      const lag = every * ((i * 0.618) % 1);
      out.push(S.flow({ d: `M${ax},${ay} L${bx},${by}`, from: S.t(from) + lag, to: S.t(to), speed: fo.speed ?? 520, every, size,
        color: ft, tone: M.GRAD.includes(ft) ? ft : 'bytes', shape: fo.shape || 'chip', opacity: fo.opacity }, flowLayer));
    }
    return out;
  };
  g.flash = (fo = {}) => {
    if (!g.sink) return gsap.timeline();
    const d = fo.d ?? 0.45;
    return gsap.fromTo(g.sink.glow, { opacity: 0 }, { opacity: fo.to ?? 0.45, duration: d / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false });
  };
  g.setRate = (text, ro = {}) => {
    const before = plan.rate; plan.rate = text;
    return M.swapText(g.rateEl, setRateText, before, text, ro);
  };
  g.countRate = (to, ro = {}) => {
    const built = String(o.rate ?? '3.35 TB/s').trim();
    const unit = ro.unit ?? built.replace(/^[≈~\s]*[-\d.,]+\s*/, '');
    const dec = ro.dec ?? ((String(to).split('.')[1] || '').length);
    const pre = (built.match(/^[≈~]\s*/) || [''])[0];
    const f = v => `${pre}${Number(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })} ${unit}`;
    const before = plan.rate; plan.rate = f(to);
    return M.countText(setRateText, ro.from ?? 0, to, f, before, ro);
  };
  g.pass = (po = {}) => {
    const amount = po.amount ?? 140, unit = po.unit ?? 'GB', d = po.d ?? 1.2;
    const plen = po.length ?? Math.min(240, Math.max(96, len * 0.22));
    const ph = Math.max(6, W - 12);
    const pk = S.g(null, packLayer);
    const halo = S.el('ellipse', { cx: 0, cy: 0, rx: plen * 0.75, ry: ph * 1.1, fill: `url(#pglow-${M.GRAD.includes(tone) ? tone : 'bytes'})`, opacity: 0.9 }, pk);
    halo.setAttribute('data-audit', 'ignore');
    halo.setAttribute('transform', `rotate(${ang.toFixed(3)})`);
    const box = S.g(null, pk);
    box.setAttribute('transform', `rotate(${ang.toFixed(3)})`);
    const slices = po.slices ?? 0;
    const parts = [];                          // [rect, local x, width, radius]: clipped to the conduit as it moves
    if (slices > 0) {
      const sw = (plen - (slices - 1) * 3) / slices;
      for (let i = 0; i < slices; i++) { const px = -plen / 2 + i * (sw + 3), pr = Math.min(3, sw / 2); parts.push([S.rect({ x: px, y: -ph / 2, w: sw, h: ph, r: pr, fill: M.solid(S, tone) }, box), px, sw, pr]); }
    } else { const pr = Math.min(10, ph / 2); parts.push([S.rect({ x: -plen / 2, y: -ph / 2, w: plen, h: ph, r: pr, fill: M.solid(S, tone) }, box), -plen / 2, plen, pr]); }
    const text = po.label ?? `${M.num(amount)} ${unit}`;
    const tsz = po.size ?? Math.min(30, Math.max(24, Math.round(ph * 0.6)));
    const tw = text ? S.measure(text, { size: tsz, weight: 700, family: 'mono' }) : 0;
    if (text && slices === 0 && horiz && tw + 22 <= plen && ph >= 30) pk.labelEl = M.amountText(S, text, { x: 0, y: 1, size: tsz, weight: 700, family: 'mono', anchor: 'middle', color: M.DARK }, pk);
    else if (text) {
      // too thin (or sideways) for text inside: it rides beside the packet, on the side away from the rate
      const k = -rk, off = W / 2 + 26;
      pk.labelEl = horiz ? M.amountText(S, text, { x: 0, y: k * (off + 4), size: Math.max(24, tsz), weight: 700, family: 'mono', anchor: 'middle', color: tone }, pk)
        : M.amountText(S, text, { x: -k * off, y: 0, size: Math.max(24, tsz), weight: 700, family: 'mono', anchor: k < 0 ? 'start' : 'end', color: tone }, pk);
      pk.beside = true;
    }
    gsap.set(pk, { autoAlpha: 0 });
    const s0 = -plen / 2 - 4, s1 = len + plen / 2 + 4;
    // the label fades out before it would slide under the memory block or the chip
    const lhw = pk.labelEl ? (horiz ? pk.labelEl.width() / 2 : Math.max(24, tsz) * 0.6) + 10 : 0;
    // a riding label also gives way to a static label on its side of the conduit, at the midpoint
    const midHalf = pk.beside && g.labelEl ? (horiz ? S.measure(g.labelEl.textContent, { size: o.labelSize ?? 28, weight: 550 }) / 2 : (o.labelSize ?? 28) * 0.6) + 12 : -1;
    const place = s => {
      const [px, py] = at(s);
      pk.setAttribute('transform', `translate(${px.toFixed(2)},${py.toFixed(2)})`);
      // the packet shows only inside the conduit: it leaves the memory and enters the chip, never overlaps them
      let shown = 0;
      for (const [el, lx, lw, lr] of parts) {
        const a = Math.max(lx, -s), b = Math.min(lx + lw, len - s), w = Math.max(0, b - a);
        el.setAttribute('x', a.toFixed(2)); el.setAttribute('width', w.toFixed(2));
        const rr2 = Math.min(lr, w / 2); el.setAttribute('rx', rr2.toFixed(2)); el.setAttribute('ry', rr2.toFixed(2));
        shown += w;
      }
      halo.setAttribute('opacity', (0.9 * Math.min(1, shown / (plen * 0.5))).toFixed(3));
      if (pk.labelEl) {
        let room = Math.min(g.source ? s - lhw : 1e9, g.sink ? len - s - lhw : 1e9);
        if (midHalf > 0) room = Math.min(room, Math.abs(s - len / 2) - lhw - midHalf);
        pk.labelEl.setAttribute('opacity', Math.max(0, Math.min(1, room / 24)).toFixed(3));
      }
    };
    place(s0);
    const fd = Math.min(0.2, d * 0.2);
    const t = gsap.timeline();
    t.fromTo(pk, { autoAlpha: 0 }, { autoAlpha: 1, duration: fd, immediateRender: false }, 0);
    t.add(M.drive(s0, s1, place, { d, ease: po.ease || 'power1.inOut' }), 0);
    t.fromTo(pk, { autoAlpha: 1 }, { autoAlpha: 0, duration: fd, immediateRender: false }, d - fd);
    if (po.flash !== false && g.sink) t.add(g.flash({ d: 0.5 }), d - 0.22);
    if (po.count && g.meter) {
      const c0 = po.countFrom ?? 0, num = g.meter.num, before = plan.meter;
      plan.meter = num.__fmt(c0 + amount);
      t.add(M.countText(str => { num.textContent = str; }, c0, c0 + amount, num.__fmt, before, { d, ease: po.ease || 'power1.inOut' }), 0);
    }
    t.packet = pk;
    return t;
  };
  return g;
}
