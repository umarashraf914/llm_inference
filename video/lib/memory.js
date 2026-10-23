/* video/lib/memory.js — shared film library: memory and data movement.
 *
 *   libMemBlock    the coral block of bytes ("140 GB"), or a memory card / HBM stack
 *   libMemoryBar   a chip's memory capacity, to scale: weights, KV cache, free, the rim, and overflow
 *   libKVCache     the key/value cache: slabs per token (row, stack or tokens × layers grid)
 *   libByteStream  memory → conduit → chip, with particles, a rate label and a passing amount
 *
 * Conventions (all four):
 * - Build with S primitives into `parent` (default S.main); everything is visible as built. Use fx.in /
 *   the component's own .in() for entrances.
 * - Helpers RETURN tweens or timelines; place them with S.add(tween, at). They never touch S.tl,
 *   except .flow() on a byte stream, which (like S.flow, which it uses) takes its own time specs.
 * - Helpers plan state in build order, like fx.xform: call a component's helpers in time order.
 * - Coordinates are in the parent's space. If you move or scale a component, wrap it in a holder
 *   S.g() and S.xset / fx.xform the holder, never the component root with raw GSAP x/y/scale.
 * - Colour = meaning: coral bytes (weights, traffic, the cache's bytes), teal helps (a reused prefix,
 *   a hit, "yours"), amber compute (the chip), grey for invalid/evicted, blue for neutral structure.
 */

/* ------------------------------------------------------------------ private helpers */
var _libMem = (function () {
  const GRAD = ['compute', 'bytes', 'helps', 'struct', 'violet', 'neutral'];
  const DARK = '#0a0f1e', BASE = '#0c1326';
  const f2 = v => (Math.round(v * 100) / 100).toString();

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
  /** GB-style number: precision follows the size of `ref` (the value being counted towards) */
  function num(v, ref) {
    const r = Math.abs(ref ?? v);
    const dec = r >= 10 ? 0 : r >= 1 ? 1 : 2;
    return Number(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
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
      onStart: go, onUpdate: go, onReverseComplete: () => apply(from),
    });
  }
  /** a short dark "crack" across a slab */
  function crack(x, y, w, h) {
    const P = (u, v) => `${f2(x + w * u)},${f2(y + h * v)}`;
    return `M${P(0.62, -0.02)}L${P(0.44, 0.34)}L${P(0.6, 0.55)}L${P(0.41, 0.8)}L${P(0.5, 1.02)}`;
  }
  return { GRAD, DARK, BASE, mix, solid, rr, hatch, num, sel, drive, crack };
})();


/**
 * libMemBlock — a block of bytes. The film's coral "140 GB" (the weights as an amount), a memory card,
 * or a small HBM stack. Width can be resized to scale with an amount.
 *
 * o: {x = 760, y = 480 (top-left), w = 400, h = 110, r = 16,
 *     gb = 140            the amount the block stands for (sets px-per-GB for resize),
 *     label = '140 GB'    main text (null for none; defaults to `${gb} GB`),
 *     sub = ''            second line (e.g. 'weights'), smaller,
 *     tone = 'bytes',
 *     style = 'solid'     'solid' (filled, dark text) | 'card' (tinted panel, ink + coral text)
 *                         | 'outline' (dashed: "needed", a ghost) | 'stack' (HBM stack: layer lines, label below),
 *     layers = 6          layer lines for style 'stack',
 *     size = 34           label size (sub is 0.76×), family = 'mono' for the label}
 * Returns <g> with .bg .labelEl .subEl and anchors .x .y .w .h .l .r .t .b .cx .cy
 * Helpers (return tweens):
 *   .resize(gb, {d = 0.9, anchor: 'left'|'center'|'right'|'bottom'|'top', axis: 'x'|'y', label})
 *        — scales the block's width (or height, axis 'y') with the amount and counts the label to it
 *        (label: a format function, default `${n} GB`). The text moves outside when the block gets too small.
 *   .flash({tone = 'compute', d = 0.5}) — a brief glow over the block (e.g. "used by the chip").
 * Example:
 *   const blk = libMemBlock(S, { x: 200, y: 235, w: 1000, h: 50, gb: 140, label: '140 GB' });
 *   S.add(S.fx.in(blk, { from: 'left' }), 'b1~gigabytes');
 *   S.add(blk.resize(70, { d: 0.8 }), 'b2~eight');          // halves to "70 GB"
 */
function libMemBlock(S, o = {}, parent) {
  const M = _libMem;
  const g = S.g(null, parent);
  const x = o.x ?? 760, y = o.y ?? 480, w = o.w ?? 400, h = o.h ?? 110, r = o.r ?? Math.min(16, h / 3);
  const tone = o.tone || 'bytes', style = o.style || 'solid';
  const gb0 = o.gb ?? 140;
  const size = o.size ?? 34, subSize = Math.round(size * 0.76);
  const fmtL = o.fmt || (v => `${M.num(v, gb0)} GB`);
  const label = o.label === undefined ? fmtL(gb0) : o.label;
  const c = S.tone(tone);
  // body
  if (style !== 'outline') S.rect({ x, y, w, h, r, fill: M.BASE, filter: o.shadow === false ? undefined : 'url(#shadow)' }, g).__memBase = true;
  let bg;
  if (style === 'solid') bg = S.rect({ x, y, w, h, r, fill: M.solid(S, tone) }, g);
  else if (style === 'card') bg = S.rect({ x, y, w, h, r, fill: `url(#card-${M.GRAD.includes(tone) ? tone : 'neutral'})`, stroke: c, strokeOpacity: 0.7, sw: 2 }, g);
  else if (style === 'outline') bg = S.rect({ x, y, w, h, r, fill: c, fillOpacity: 0.06, stroke: c, strokeOpacity: 0.85, sw: 2.5, dash: '9 7' }, g);
  else bg = S.rect({ x, y, w, h, r, fill: M.mix(S, tone, '#0c1326', 0.78), stroke: c, strokeOpacity: 0.9, sw: 2 }, g);
  g.bg = bg;
  const base = g.querySelector('rect');
  let lines = null;
  if (style === 'stack') {
    const n = o.layers ?? 6;
    let d = '';
    for (let k = 1; k < n; k++) d += `M${x + 12},${y + k * h / n}H${x + w - 12}`;
    lines = S.path({ d, stroke: c, strokeOpacity: 0.45, sw: 1.5 }, g);
    lines.setAttribute('data-audit', 'ignore');
  }
  // text
  const inkMain = style === 'solid' ? M.DARK : style === 'card' ? 'ink' : c;
  const inkSub = style === 'solid' ? '#1d2440' : style === 'card' ? c : 'muted';
  const outside = style === 'stack';
  const ty = outside ? y + h + 36 : y + h / 2 - (o.sub ? subSize * 0.62 : 0);
  if (label != null) g.labelEl = S.text(label, { x: x + w / 2, y: ty, size, weight: 650, anchor: 'middle', color: outside ? c : inkMain, family: o.family || (style === 'card' ? 'sans' : 'mono') }, g);
  if (o.sub) g.subEl = S.text(o.sub, { x: x + w / 2, y: outside ? ty + size * 1.05 : y + h / 2 + size * 0.58, size: subSize, weight: 500, anchor: 'middle', color: outside ? 'muted' : inkSub, family: style === 'card' ? 'mono' : 'sans' }, g);
  const glow = S.rect({ x, y, w, h, r, fill: 'compute', opacity: 0 }, g);
  glow.setAttribute('data-audit', 'ignore');
  Object.assign(g, { x, y, w, h, l: x, r: x + w, t: y, b: y + h, cx: x + w / 2, cy: y + h / 2, gb: gb0, tone, style });

  const plan = { gb: gb0 };
  g.resize = (gb, ro = {}) => {
    const from = plan.gb; plan.gb = gb;
    const axis = ro.axis || 'x', anchor = ro.anchor || (axis === 'x' ? 'left' : 'bottom');
    const f = ro.label || fmtL;
    const ref = Math.max(from, gb);
    const shapes = [base, bg, glow].filter(Boolean);
    const apply = v => {
      const k = v / gb0;
      let nx = x, ny = y, nw = w, nh = h;
      if (axis === 'x') { nw = Math.max(0.5, w * k); nx = anchor === 'left' ? x : anchor === 'right' ? x + w - nw : x + (w - nw) / 2; }
      else { nh = Math.max(0.5, h * k); ny = anchor === 'top' ? y : anchor === 'bottom' ? y + h - nh : y + (h - nh) / 2; }
      const rad = Math.min(r, nw / 2, nh / 2);
      shapes.forEach(s => { s.setAttribute('x', nx); s.setAttribute('y', ny); s.setAttribute('width', nw); s.setAttribute('height', nh); s.setAttribute('rx', rad); s.setAttribute('ry', rad); });
      if (lines) {
        const n = o.layers ?? 6;
        let d = '';
        for (let q = 1; q < n; q++) d += `M${nx + 12},${ny + q * nh / n}H${nx + nw - 12}`;
        lines.setAttribute('d', nw > 30 ? d : '');
      }
      if (g.labelEl) {
        g.labelEl.textContent = f(v, ref);
        const tw = S.measure(g.labelEl.textContent, { size: g.labelEl.__size, weight: 650, family: g.labelEl.__family });
        const fits = outside || (axis === 'x' ? nw >= tw + 28 : nh >= (o.sub ? size * 2.2 : size * 1.4));
        if (outside) { g.labelEl.setAttribute('x', nx + nw / 2); g.labelEl.setAttribute('y', ny + nh + 36); }
        else if (fits) { g.labelEl.setAttribute('x', nx + nw / 2); g.labelEl.setAttribute('y', ny + nh / 2 - (o.sub ? subSize * 0.62 : 0)); g.labelEl.setAttribute('text-anchor', 'middle'); g.labelEl.setAttribute('fill', S.tone(inkMain)); }
        else if (axis === 'x') { g.labelEl.setAttribute('x', nx + nw + 16); g.labelEl.setAttribute('y', ny + nh / 2); g.labelEl.setAttribute('text-anchor', 'start'); g.labelEl.setAttribute('fill', c); }
        else { g.labelEl.setAttribute('x', nx + nw / 2); g.labelEl.setAttribute('y', ny - 26); g.labelEl.setAttribute('text-anchor', 'middle'); g.labelEl.setAttribute('fill', c); }
        if (g.subEl) g.subEl.setAttribute('opacity', fits ? 1 : 0);
      }
    };
    return M.drive(from, gb, apply, { d: ro.d ?? 0.9, ease: ro.ease || 'power2.inOut' });
  };
  g.flash = (fo = {}) => {
    glow.setAttribute('fill', S.tone(fo.tone || 'compute'));
    const d = fo.d ?? 0.5;
    return gsap.fromTo(glow, { opacity: 0 }, { opacity: fo.to ?? 0.5, duration: d / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false });
  };
  return g;
}


/**
 * libMemoryBar — a chip's memory, drawn to scale: a capacity track ending in a rim (the capacity
 * marker), filled left to right (or bottom-up) by labelled segments (weights, KV cache, …), with the
 * free remainder labelled and anything past the rim drawn as a hatched overhang ("won't fit").
 *
 * o: {x = 260, y = 420 (top-left of the track), w = 1200 (track length, horizontal), h = 64 (thickness),
 *     capacity = 80        GB the memory holds (H100 80, H200 141, B200 192),
 *     scale                px per GB; default w / capacity (vertical: h / capacity). Give several bars the
 *                          same scale to compare them; the track length is then capacity × scale,
 *     vertical = false     fill bottom-up (then w = thickness, default 120; h = length, default 560),
 *     title = ''           above the track (horizontal) or below it (vertical), e.g. 'H100 · 80 GB',
 *     capLabel             text at the rim; default `${capacity} GB`; false for none,
 *     rim = true           draw the capacity marker,
 *     segments = []        [{id, gb = 0, name = id, tone = 'bytes', style: 'solid'|'soft'|'outline', dec}]
 *                          laid end to end in order; e.g. {id:'weights', gb:140} then {id:'kv', name:'KV cache', style:'soft'},
 *     free = true          label the empty remainder ('61 GB free'),
 *     overLabel = 'over'   suffix for the overhang label ('60 GB over'); false for none,
 *     size = 28, unit = 'GB'}
 * Labels sit inside a segment when they fit and move outside (below / to the right) when they do not,
 * cross-fading as a segment grows; outside labels never collide.
 * Returns <g> with .track .rim .titleEl .capEl .segs{id: {g, inEl, overEl, labelIn, labelOut}} .freeEl .overEl
 *   and .pos(gb) (coordinate along the bar), .point(gb) → [x, y] on the bar's centre line, .scale, .L (track px),
 *   .x .y .w .h .l .r .t .b
 * Helpers (return tweens/timelines; call in time order):
 *   .in({d = 0.9})              fade the bar in and sweep its segments up from zero
 *   .grow(id, gb, {d = 1, ease}) resize one segment (the ones after it ride along); labels count; past the rim
 *                               the overhang appears and the rim turns coral
 *   .overflow({d = 0.9})        flash the overhang and pulse its label: "it does not fit"
 *   .marker(gb, {label, tone = 'ink', side})  → <g> (static): a dashed line across the bar at gb, labelled
 *                               ('140 GB needed'); side 'above'|'below' (horizontal) or 'right'|'left' (vertical)
 *   .span(a, b, {label, tone = 'bytes'})      → <g> (static): a hatched region from a to b GB ('≈ 40 GB short')
 * Example:
 *   const h200 = libMemoryBar(S, { x: 260, y: 420, w: 1400, capacity: 141, title: 'H200 memory',
 *     segments: [{ id: 'weights', gb: 140 }, { id: 'kv', name: 'KV cache', gb: 0, style: 'soft' }] });
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
  // the rectangle covering values a..b (a < b)
  const box = (a, b) => (V ? { x: x0, y: P(b), w: T, h: (b - a) * scale } : { x: P(a), y: y0, w: (b - a) * scale, h: T });
  // radii [tl,tr,br,bl] for a run a..b: rounded at the start of the track, at the rim end when it reaches it
  const radii = (startR, endR) => (V ? [endR, endR, startR, startR] : [startR, endR, endR, startR]);

  // ---------------------------------------------------------------- track, layers
  g.track = S.g(null, g);
  const tb = V ? { x: x0, y: y0, w: T, h: L } : { x: x0, y: y0, w: L, h: T };
  S.rect({ ...tb, r: R, fill: M.BASE }, g.track);
  S.rect({ ...tb, r: R, fill: '#ffffff', fillOpacity: 0.035, stroke: '#ffffff', strokeOpacity: 0.16, sw: 1.5 }, g.track);
  const segLayer = S.g(null, g), overLayer = S.g(null, g), flashLayer = S.g(null, g), labLayer = S.g(null, g);
  const flash = S.path({ d: '', fill: 'bytes', opacity: 0 }, flashLayer);
  flash.setAttribute('data-audit', 'ignore');

  // ---------------------------------------------------------------- segments
  const segs = (o.segments || []).map(sp => {
    const s = { id: sp.id, name: sp.name ?? sp.id, tone: sp.tone || 'bytes', style: sp.style || 'solid', dec: sp.dec, ref: sp.gb ?? 0 };
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
    const lab = (inside) => S.text([{ t: s.name }, { t: '  ' }, { t: '', f: 'mono' }], {
      x: x0, y: y0, size, weight: 650, anchor: inside && !V ? 'middle' : (V ? 'start' : 'middle'),
      color: inside ? (dark ? M.DARK : 'ink') : s.tone,
    }, labLayer);
    s.labelIn = lab(true); s.labelOut = lab(false);
    s.labelIn.setAttribute('opacity', 0); s.labelOut.setAttribute('opacity', 0);
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
  if (o.title) {
    g.titleEl = V ? S.text(o.title, { x: x0 + T / 2, y: y0 + L + 44, size: o.titleSize ?? 30, weight: 650, anchor: 'middle' }, g)
      : S.text(o.title, { x: x0, y: y0 - 42, size: o.titleSize ?? 30, weight: 650 }, g);
  }
  if (capText && o.rim !== false) {
    if (V) g.capEl = S.text(capText, { x: x0 + T + 26, y: y0, size: 26, weight: 600, family: 'mono', color: 'muted' }, g);
    else {
      const tw = g.titleEl ? x0 + S.measure(o.title, { size: o.titleSize ?? 30, weight: 650 }) : -1e9;
      const cw = S.measure(capText, { size: 26, weight: 600, family: 'mono' });
      const clash = tw + 24 > x0 + L - cw / 2;
      g.capEl = S.text(capText, { x: clash ? x0 + L + 14 : x0 + L, y: y0 - 42, size: 26, weight: 600, family: 'mono', color: 'muted', anchor: clash ? 'start' : 'middle' }, g);
    }
  }
  const mkSide = (parts, color) => {
    const t = S.text(parts, { x: x0, y: y0, size, weight: 600, color, anchor: V ? 'start' : 'middle' }, labLayer);
    t.setAttribute('opacity', 0);
    return t;
  };
  g.freeEl = o.free === false ? null : mkSide([{ t: '', f: 'mono' }, { t: ` ${unit} free` }], 'muted');
  g.freeIn = o.free === false ? null : mkSide([{ t: '', f: 'mono' }, { t: ` ${unit} free` }], 'muted');
  const overWord = o.overLabel === undefined ? 'over' : o.overLabel;
  g.overEl = overWord === false ? null : mkSide([{ t: '+', f: 'mono' }, { t: '', f: 'mono' }, { t: ` ${unit} ${overWord}` }], 'bytes');

  // ---------------------------------------------------------------- layout (a pure function of live state)
  const live = { k: 1, v: {} };
  const plan = {};
  segs.forEach(s => { live.v[s.id] = s.ref; plan[s.id] = s.ref; });
  const tw = t => [...t.childNodes].reduce((a, n) => a + S.measure(n.textContent, { size, weight: 650, family: n.getAttribute('font-family') && /Mono/.test(n.getAttribute('font-family')) ? 'mono' : 'sans' }), 0);
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const fade = (len, need) => clamp01((len - need) / 36);

  function placeOutside(items) {
    // items: {el, c (desired centre along the free axis), w (extent)}; resolve collisions in order
    const gap = V ? 10 : 22;
    items.sort((a, b) => (V ? b.c - a.c : a.c - b.c));
    if (!V) {
      let right = -1e9;
      for (const it of items) { const l = Math.max(it.c - it.w / 2, right + gap, x0); it.pos = l + it.w / 2; right = l + it.w; }
    } else {
      let top = 1e9;
      for (const it of items) { const c = Math.min(it.c, top - gap - it.w / 2); it.pos = c; top = c - it.w / 2; }
    }
    for (const it of items) {
      if (V) { it.el.setAttribute('x', x0 + T + 24); it.el.setAttribute('y', it.pos); it.el.setAttribute('text-anchor', 'start'); }
      else { it.el.setAttribute('x', it.pos); it.el.setAttribute('y', y0 + T + 36); it.el.setAttribute('text-anchor', 'middle'); }
    }
  }

  function layout() {
    let acc = 0;
    const outs = [];
    const lineH = size * 1.25;
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
        s.inEl.setAttribute('d', M.rr(bx.x, bx.y, bx.w, bx.h, radii(startR, endR)));
      } else s.inEl.setAttribute('d', '');
      // overhang part (past the rim)
      const oa = Math.max(a, cap), ob = Math.max(b, cap);
      if (ob - oa > 1e-6) {
        const bx = box(oa, ob);
        const sg = oa > cap + 1e-6 ? 1.5 : 0;
        if (V) { bx.h -= sg; } else { bx.x += sg; bx.w -= sg; }
        s.overEl.setAttribute('d', M.rr(bx.x, bx.y, bx.w, bx.h, radii(0, R)));
        s.hatchEl.setAttribute('d', M.hatch(bx.x + 3, bx.y + 3, bx.w - 6, bx.h - 6, 16));
      } else { s.overEl.setAttribute('d', ''); s.hatchEl.setAttribute('d', ''); }
      // labels
      const shown = live.v[s.id] * live.k;
      const txt = M.num(shown, s.dec != null ? Math.pow(10, -s.dec) * 0.999 + (s.dec === 0 ? 10 : 0) : s.ref) + ` ${unit}`;
      [s.labelIn, s.labelOut].forEach(t => { t.childNodes[2].textContent = txt; });
      const w = tw(s.labelIn);
      const inLen = (ib - ia) * scale;
      const fit = v > 1e-6 ? (V ? (T >= w + 28 ? fade(inLen, lineH + 12) : 0) : (T >= size + 14 ? fade(inLen, w + 36) : 0)) : 0;
      s.labelIn.setAttribute('opacity', fit);
      const mid = ib - ia > 1e-6 ? (ia + ib) / 2 : (oa + ob) / 2;
      if (V) { s.labelIn.setAttribute('x', x0 + T / 2); s.labelIn.setAttribute('text-anchor', 'middle'); s.labelIn.setAttribute('y', P(mid) + 1); }
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
      const ft = M.num(free, Math.max(free, 1));
      g.freeEl.childNodes[0].textContent = ft; g.freeIn.childNodes[0].textContent = ft;
      const w = tw(g.freeIn);
      const len = free * scale;
      const fit = show ? (V ? (T >= w + 28 ? fade(len, lineH + 12) : 0) : (T >= size + 14 ? fade(len, w + 40) : 0)) : 0;
      g.freeIn.setAttribute('opacity', fit);
      if (V) { g.freeIn.setAttribute('x', x0 + T / 2); g.freeIn.setAttribute('text-anchor', 'middle'); g.freeIn.setAttribute('y', P(total + free / 2) + 1); }
      else { g.freeIn.setAttribute('x', P(total + free / 2)); g.freeIn.setAttribute('y', y0 + T / 2 + 1); }
      const outOp = show ? 1 - fit : 0;
      g.freeEl.setAttribute('opacity', outOp);
      if (outOp > 0.01) outs.push({ el: g.freeEl, c: V ? P(cap) + lineH / 2 : P(cap) - w / 2, w: V ? lineH : w });
    }
    // overhang total
    const over = total - cap;
    if (g.overEl) {
      const show = over > cap * 0.002;
      g.overEl.childNodes[1].textContent = M.num(over, Math.max(over, 10));
      g.overEl.setAttribute('opacity', show ? 1 : 0);
      if (show) outs.push({ el: g.overEl, c: P(cap + over / 2), w: V ? lineH : tw(g.overEl) });
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
    const ref0 = s.ref, ref = Math.max(from, gb);
    return M.drive(from, gb, v => { s.ref = v === from && from > gb ? ref0 : ref; live.v[id] = v; layout(); }, { d: go.d ?? 1, ease: go.ease || 'power2.inOut' });
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
    const side = mo.side || (V ? 'right' : 'above');
    if (V) {
      const yy = P(gb);
      mg.line = S.line({ x1: x0 - 18, y1: yy, x2: x0 + T + 18, y2: yy, stroke: tone, sw: 2.5, dash: '8 7' }, mg);
      if (mo.label) mg.label = S.text(mo.label, { x: side === 'left' ? x0 - 30 : x0 + T + 30, y: yy, size: mo.size ?? 28, weight: 600, color: tone, anchor: side === 'left' ? 'end' : 'start' }, mg);
    } else {
      const xx = P(gb);
      mg.line = S.line({ x1: xx, y1: y0 - 18, x2: xx, y2: y0 + T + 18, stroke: tone, sw: 2.5, dash: '8 7' }, mg);
      if (mo.label) mg.label = S.text(mo.label, { x: xx, y: side === 'below' ? y0 + T + 44 : y0 - 42, size: mo.size ?? 28, weight: 600, color: tone, anchor: mo.anchor || 'middle' }, mg);
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
      sg.label = V ? S.text(so.label, { x: so.side === 'left' ? x0 - 30 : x0 + T + 30, y: bx.y + bx.h / 2, size: so.size ?? 28, weight: 600, color: tone, anchor: so.side === 'left' ? 'end' : 'start' }, sg)
        : S.text(so.label, { x: bx.x + bx.w / 2, y: so.side === 'above' ? y0 - 42 : y0 + T + 36, size: so.size ?? 28, weight: 600, color: tone, anchor: 'middle' }, sg);
    }
    return sg;
  };
  return g;
}


/**
 * libKVCache — the key/value cache: one slab per token (and per layer), each slab a key half (K, solid)
 * and a value half (V, a darker shade of the same colour), filling as tokens are processed.
 *
 * o: {x = 400, y = 400 (top-left of the slab area),
 *     layout = 'row'       'row' (tokens left → right; perRow wraps it into a pool of blocks)
 *                          | 'stack' (tokens bottom → top, thin wide slabs: "the stack grows by one")
 *                          | 'grid' (one column per token, one row per layer, layer 1 at the bottom),
 *     slots = 12           token slots (the cache's room; empty slots show as dashed outlines),
 *     filled = 0           slots already full at build time,
 *     layers = 6           grid rows (grid only; 80 is fine as a picture, mark its holder data-audit="ignore"),
 *     perRow               row layout: wrap after this many slots (a pool of fixed-size blocks),
 *     cw, ch, gap, gapY    slab size and spacing; defaults row 64×64 gap 10 · stack 240×26 gap 7 · grid 44×24 gap 8/6,
 *     tone = 'bytes'       slab colour: coral (bytes); 'struct' for blue K/V tiles, 'helps' for a teal store,
 *     letters              'K'/'V' inside each slab; default on when the slab is big enough (row layout),
 *     empty = true         show empty slots as dashed outlines,
 *     frame = true         a panel round the slots; frameTone = 'neutral' ('helps' for "KV cache" in HBM),
 *     label = 'KV cache'   title above the frame (null for none); sub = '' muted text after it,
 *     legend = false       a 'K keys  V values' key at the frame's top right (use when letters are off),
 *     tokens               labels under the columns (row/grid), e.g. ['t1', 't2', …],
 *     layerLabels = true   grid: 'L1' at the bottom row and 'L<layers>' at the top}
 * Returns <g> with .cells (flat; for grid .cell(t, l)), .slotCenter(i, l = 0) → [x, y], .slotBox(i) → {x,y,w,h},
 *   .frameEl .labelEl .halo, .area {x, y, w, h}, .count() (slots planned full so far)
 * Helpers (return timelines; call in time order; `sel` = index | [i, j, …] | {from, to} | 'all'):
 *   .append(n = 1, {d = 0.45, stagger = 0.12, from: 'down'|'up'|'left'|'right'|[x, y], tone, layerStagger})
 *        fill the next n empty slots (grid: a token's column fills layer 1 → layer N)
 *   .fill(sel, {…same})       fill particular slots (e.g. refill evicted blocks, other users' blocks with tone 'neutral')
 *   .read({d = 0.6, stagger = 0, layers}) every full slab brightens at once: "all of it is read, every step"
 *   .prefix(n, {d = 0.8, label, rings})   teal highlight sweeps over the first n slots: the reused prefix;
 *                                         n = 0 collapses it. The timeline's .label is the label element
 *   .mark(sel, {tone = 'helps', d})       outline slots (e.g. "yours"); tone null removes the outline
 *   .invalidate(sel, {stagger = 0.3, layers}) slabs crack and turn grey with a dashed edge: stale, must be redone
 *   .evict(sel = 'all', {stagger = 0.06, d}) slabs drop out, leaving empty slots (also clears grey/outline)
 *   .clear({…}) = evict every full slot
 * Example:
 *   const kv = libKVCache(S, { x: 300, y: 600, slots: 20, filled: 12, label: 'KV cache' });
 *   S.add(S.fx.in(kv), 'b1');
 *   S.add(kv.append(8, { stagger: 0.18 }), 'b1~appends');
 *   S.add(kv.prefix(20, { label: 'hit: reused' }), 'b3~skip');
 *   S.add(kv.invalidate({ from: 2, to: 19 }, { stagger: 0.12 }), 'b4~wrong');
 */
function libKVCache(S, o = {}, parent) {
  const M = _libMem;
  const g = S.g(null, parent);
  const lay = o.layout || 'row';
  const GRID = lay === 'grid', STACK = lay === 'stack';
  const n = o.slots ?? (GRID ? 12 : STACK ? 8 : 12);
  const NL = GRID ? (o.layers ?? 6) : 1;
  const per = !GRID && !STACK ? Math.max(1, Math.min(n, o.perRow || n)) : n;
  const D = GRID ? [44, 24, 8, 6] : STACK ? [240, 26, 0, 7] : [64, 64, 10, 10];
  const cw = o.cw ?? D[0], ch = o.ch ?? D[1];
  const gx = o.gap ?? D[2], gy = o.gapY ?? (STACK ? (o.gap ?? D[3]) : (o.gapY ?? (GRID ? D[3] : (o.gap ?? D[3]))));
  const x0 = o.x ?? 400, y0 = o.y ?? 400;
  const tone = o.tone || 'bytes';
  const cols = GRID ? n : STACK ? 1 : per, rows = GRID ? NL : STACK ? n : Math.ceil(n / per);
  const AW = cols * cw + (cols - 1) * gx, AH = rows * ch + (rows - 1) * gy;
  const pos = (i, l = 0) => (GRID ? [x0 + i * (cw + gx), y0 + (NL - 1 - l) * (ch + gy)]
    : STACK ? [x0, y0 + (n - 1 - i) * (ch + gy)] : [x0 + (i % per) * (cw + gx), y0 + Math.floor(i / per) * (ch + gy)]);
  const r = o.r ?? Math.max(2, Math.min(8, Math.min(cw, ch) / 5));
  const sgap = Math.max(2, Math.round(Math.min(cw * 0.08, 6)));
  const hw = (cw - sgap) / 2;
  const letters = o.letters ?? (hw >= 22 && ch >= 34);
  const cols0 = t => ({ k: M.solid(S, t), v: M.mix(S, t, '#0c1326', 0.62), s: S.tone(t) });

  // ---------------------------------------------------------------- frame, title, legend, axis labels
  const pad = o.pad ?? (GRID ? 16 : 16);
  const fb = { x: x0 - pad, y: y0 - pad, w: AW + 2 * pad, h: AH + 2 * pad };
  if (o.frame !== false) {
    const ft = o.frameTone || 'neutral';
    S.rect({ ...fb, r: 18, fill: M.BASE, filter: 'url(#shadow)' }, g);
    g.frameEl = S.rect({ ...fb, r: 18, fill: `url(#card-${M.GRAD.includes(ft) ? ft : 'neutral'})`, stroke: ft === 'neutral' ? '#ffffff' : ft, strokeOpacity: ft === 'neutral' ? 0.14 : 0.6, sw: 2 }, g);
  }
  const label = o.label === undefined ? 'KV cache' : o.label;
  const ty = fb.y - 32;
  if (label) {
    g.labelEl = S.text(label, { x: fb.x + 2, y: ty, size: o.labelSize ?? 30, weight: 650, color: o.labelColor || 'ink' }, g);
    if (o.sub) g.subEl = S.text(o.sub, { x: fb.x + 2 + S.measure(label, { size: o.labelSize ?? 30, weight: 650 }) + 16, y: ty + 1, size: 26, weight: 500, color: 'muted' }, g);
  }
  if (o.legend) {
    const lg = S.g(null, g);
    const C = cols0(tone);
    const items = [['K', 'keys', C.k, null], ['V', 'values', C.v, C.s]];
    let xr = fb.x + fb.w - 2;
    for (let q = items.length - 1; q >= 0; q--) {
      const [, word, fill, stroke] = items[q];
      const w = S.measure(word, { size: 24, weight: 550 });
      S.text(word, { x: xr, y: ty, size: 24, weight: 550, color: 'muted', anchor: 'end' }, lg);
      xr -= w + 10;
      S.rect({ x: xr - 14, y: ty - 10, w: 14, h: 20, r: 3, fill, stroke: stroke || undefined, sw: 1.5 }, lg);
      xr -= 14 + 24;
    }
    g.legendEl = lg;
  }
  if (GRID && o.layerLabels !== false) {
    const lx = fb.x - 14;
    S.text('L1', { x: lx, y: pos(0, 0)[1] + ch / 2, size: 24, family: 'mono', color: 'muted', anchor: 'end' }, g);
    if (NL > 1) S.text(`L${NL}`, { x: lx, y: pos(0, NL - 1)[1] + ch / 2, size: 24, family: 'mono', color: 'muted', anchor: 'end' }, g);
  }
  if (o.tokens && !STACK) {
    o.tokens.forEach((t, i) => { if (t != null && i < n) S.text(t, { x: pos(i, 0)[0] + cw / 2, y: fb.y + fb.h + 28, size: 24, family: 'mono', color: 'muted', anchor: 'middle' }, g); });
  }

  // ---------------------------------------------------------------- slabs
  const back = S.g(null, g);                 // prefix halo lives behind the slabs
  const cellLayer = S.g(null, g);
  const cells = [];                          // index t * NL + l
  const C0 = cols0(tone);
  for (let i = 0; i < n; i++) for (let l = 0; l < NL; l++) {
    const [x, y] = pos(i, l);
    const c = S.g(null, cellLayer);
    if (o.empty !== false) c.slot = S.rect({ x, y, w: cw, h: ch, r, fill: '#ffffff', fillOpacity: 0.025, stroke: '#ffffff', strokeOpacity: 0.22, sw: 1.5, dash: ch < 14 ? '3 3' : '5 5' }, c);
    c.body = S.g(null, c);
    c.k = S.rect({ x, y, w: hw, h: ch, r, fill: C0.k }, c.body);
    c.v = S.rect({ x: x + hw + sgap, y, w: hw, h: ch, r, fill: C0.v, stroke: C0.s, strokeOpacity: 0.9, sw: 1.5 }, c.body);
    if (letters) {
      c.kl = S.text('K', { x: x + hw / 2, y: y + ch / 2 + 1, size: 24, weight: 700, family: 'mono', anchor: 'middle', color: M.DARK }, c.body);
      c.vl = S.text('V', { x: x + hw + sgap + hw / 2, y: y + ch / 2 + 1, size: 24, weight: 700, family: 'mono', anchor: 'middle', color: C0.s }, c.body);
    }
    Object.assign(c, { t: i, l, x, y, w: cw, h: ch, cx: x + cw / 2, cy: y + ch / 2 });
    const on = i < (o.filled ?? 0);
    c.__p = { on, tone, bad: false, ring: null };
    if (!on) gsap.set(c.body, { autoAlpha: 0 });
    cells.push(c);
  }
  const cellAt = (i, l = 0) => cells[i * NL + l];
  // lazily built per-cell overlays (built at helper-call time, i.e. build time: deterministic)
  const ring = c => c.ringEl || (c.ringEl = (() => {
    const e = S.rect({ x: c.x - 4, y: c.y - 4, w: cw + 8, h: ch + 8, r: r + 3, stroke: 'helps', sw: ch < 14 ? 2 : 2.5 }, c);
    gsap.set(e, { autoAlpha: 0 });
    return e;
  })());
  const inv = c => c.invEl || (c.invEl = (() => {
    const e = S.g(null, c);
    S.rect({ x: c.x, y: c.y, w: hw, h: ch, r, fill: '#59627c' }, e);
    S.rect({ x: c.x + hw + sgap, y: c.y, w: hw, h: ch, r, fill: '#2d3449', stroke: '#6b7593', sw: 1.5 }, e);
    if (letters) {
      S.text('K', { x: c.x + hw / 2, y: c.y + ch / 2 + 1, size: 24, weight: 700, family: 'mono', anchor: 'middle', color: '#2a3045' }, e);
      S.text('V', { x: c.x + hw + sgap + hw / 2, y: c.y + ch / 2 + 1, size: 24, weight: 700, family: 'mono', anchor: 'middle', color: '#7c87a6' }, e);
    }
    S.rect({ x: c.x - 3, y: c.y - 3, w: cw + 6, h: ch + 6, r: r + 2, stroke: '#8a94b0', sw: 2, dash: '5 4' }, e);
    const ck = S.path({ d: M.crack(c.x, c.y, cw, ch), stroke: '#0a0f1e', sw: Math.max(2, Math.min(3.5, cw / 18)) }, e);
    ck.setAttribute('data-audit', 'ignore');
    e.crack = ck;
    gsap.set(e, { autoAlpha: 0 });
    return e;
  })());
  const glint = c => c.glintEl || (c.glintEl = (() => {
    const e = S.rect({ x: c.x - 1, y: c.y - 1, w: cw + 2, h: ch + 2, r, fill: '#ffffff', opacity: 0 }, c);
    e.setAttribute('data-audit', 'ignore');
    return e;
  })());
  const pick = (s, layers) => {
    const ls = layers == null ? null : M.sel(layers, NL);
    const out = [];
    for (const i of M.sel(s, n)) for (let l = 0; l < NL; l++) if (!ls || ls.includes(l)) out.push(cellAt(i, l));
    return out;
  };

  // ---------------------------------------------------------------- prefix halo
  const hp = Math.min(10, pad - 4);
  const halo = S.rect({ x: x0 - hp, y: y0 - hp, w: 0, h: AH + 2 * hp, r: 12, fill: 'helps', fillOpacity: 0.14, stroke: 'helps', strokeOpacity: 0.85, sw: 2 }, back);
  gsap.set(halo, { autoAlpha: 0 });
  // geometry of a halo covering slots 0..k-1 (row/grid: grows rightwards; stack: grows upwards)
  const haloGeom = k => {
    if (k <= 0) return STACK ? { x: x0 - hp, y: y0 + AH + hp, width: cw + 2 * hp, height: 0 } : { x: x0 - hp, y: y0 - hp, width: 0, height: AH + 2 * hp };
    if (STACK) { const top = pos(k - 1)[1]; return { x: x0 - hp, y: top - hp, width: cw + 2 * hp, height: y0 + AH - top + 2 * hp }; }
    const right = pos(Math.min(k, per) - 1)[0] + cw;
    return { x: x0 - hp, y: y0 - hp, width: right - x0 + 2 * hp, height: (per < n ? (Math.floor((k - 1) / per) + 1) * (ch + gy) - gy : AH) + 2 * hp };
  };
  g.halo = halo;

  // ---------------------------------------------------------------- plan + helpers
  const plan = { prefix: 0 };
  const fromVec = (c, from) => {
    if (Array.isArray(from)) return { x: from[0] - c.cx, y: from[1] - c.cy };
    const dd = 26;
    return { up: { y: dd }, down: { y: -dd }, left: { x: dd }, right: { x: -dd } }[from] || { y: -dd };
  };
  g.fill = (s, fo = {}) => {
    const t = gsap.timeline();
    const d = fo.d ?? 0.45, st = fo.stagger ?? 0.12;
    const ls = fo.layerStagger ?? (GRID ? Math.min(0.05, 0.7 / NL) : 0);
    const from = fo.from ?? (STACK ? 'down' : GRID ? 'down' : 'down');
    const tn = fo.tone || tone, C = cols0(tn);
    M.sel(s, n).forEach((i, q) => {
      for (let l = 0; l < NL; l++) {
        const c = cellAt(i, l);
        if (fo.layers != null && !M.sel(fo.layers, NL).includes(l)) continue;
        const p = c.__p, at = q * st + l * ls;
        const was = { ...p };
        // colours swap while the slab is out of sight
        if (p.tone !== tn) {
          t.fromTo(c.k, { attr: { fill: cols0(was.tone).k } }, { attr: { fill: C.k }, duration: 0.001, immediateRender: false }, at);
          t.fromTo(c.v, { attr: { fill: cols0(was.tone).v, stroke: cols0(was.tone).s } }, { attr: { fill: C.v, stroke: C.s }, duration: 0.001, immediateRender: false }, at);
          if (c.vl) t.fromTo(c.vl, { attr: { fill: cols0(was.tone).s } }, { attr: { fill: C.s }, duration: 0.001, immediateRender: false }, at);
        }
        if (was.bad) t.fromTo(inv(c), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, immediateRender: false }, at);
        const v = fromVec(c, from);
        t.fromTo(c.body, { autoAlpha: was.on ? 1 : 0, x: was.on ? 0 : (v.x || 0), y: was.on ? 0 : (v.y || 0) },
          { autoAlpha: 1, x: 0, y: 0, duration: Array.isArray(from) ? d * 1.6 : d, ease: Array.isArray(from) ? 'power2.inOut' : 'power3.out', immediateRender: false }, at);
        Object.assign(p, { on: true, tone: tn, bad: false });
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
    const st = eo.stagger ?? 0.06, d = eo.d ?? 0.4;
    const list = M.sel(s, n).filter(i => cellAt(i, 0).__p.on);
    list.forEach((i, q) => {
      for (let l = 0; l < NL; l++) {
        const c = cellAt(i, l), p = c.__p;
        if (!p.on) continue;
        const at = q * st;
        t.fromTo(c.body, { autoAlpha: 1, y: 0, x: 0 }, { autoAlpha: 0, y: eo.drop ?? 18, duration: d, ease: 'power2.in', immediateRender: false }, at);
        if (p.bad) t.fromTo(inv(c), { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: eo.drop ?? 18, duration: d, ease: 'power2.in', immediateRender: false }, at);
        if (p.ring) t.fromTo(ring(c), { autoAlpha: 1 }, { autoAlpha: 0, duration: d * 0.6, immediateRender: false }, at);
        // reset the overlays' offset once hidden, so a later refill starts clean
        if (p.bad) t.fromTo(inv(c), { y: eo.drop ?? 18 }, { y: 0, duration: 0.001, immediateRender: false }, at + d + 0.01);
        Object.assign(p, { on: false, bad: false, ring: null });
      }
    });
    return t;
  };
  g.clear = (co = {}) => g.evict('all', co);
  g.read = (ro = {}) => {
    const d = ro.d ?? 0.6;
    const list = pick('all', ro.layers).filter(c => c.__p.on);
    const els = list.map(glint);
    if (!els.length) return gsap.timeline();
    return gsap.fromTo(els, { opacity: 0 }, { opacity: ro.to ?? 0.5, duration: d / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', stagger: ro.stagger ?? 0, immediateRender: false });
  };
  g.mark = (s, mo = {}) => {
    const t = gsap.timeline();
    const tn = mo.tone === undefined ? 'helps' : mo.tone, d = mo.d ?? 0.4;
    pick(s, mo.layers).forEach((c, q) => {
      const p = c.__p, e = ring(c), at = q * (mo.stagger ?? 0.04);
      if (tn) {
        if (p.ring !== tn) t.fromTo(e, { attr: { stroke: S.tone(p.ring || tn) } }, { attr: { stroke: S.tone(tn) }, duration: p.ring ? d : 0.001, immediateRender: false }, at);
        if (!p.ring) t.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: d, immediateRender: false }, at);
      } else if (p.ring) t.fromTo(e, { autoAlpha: 1 }, { autoAlpha: 0, duration: d, immediateRender: false }, at);
      p.ring = tn;
    });
    return t;
  };
  g.reuse = (k, po = {}) => {
    const t = gsap.timeline();
    const d = po.d ?? 0.8;
    const from = plan.prefix, to = Math.max(0, Math.min(n, k));
    plan.prefix = to;
    const A = haloGeom(from), B = haloGeom(to);
    t.fromTo(halo, { autoAlpha: from > 0 ? 1 : 0, attr: A }, { autoAlpha: to > 0 ? 1 : 0, attr: B, duration: d, ease: 'power2.inOut', immediateRender: false }, 0);
    const rings = po.rings ?? !GRID;
    if (rings) {
      const lo = Math.min(from, to), hi = Math.max(from, to);
      const span = [];
      for (let i = lo; i < hi; i++) span.push(i);
      const tn = to > from ? 'helps' : null;
      span.forEach((i, q) => {
        const frac = hi > lo ? (to > from ? (i - lo + 1) / (hi - lo) : (hi - i) / (hi - lo)) : 1;
        for (let l = 0; l < NL; l++) {
          const c = cellAt(i, l), p = c.__p, e = ring(c);
          const at = d * 0.85 * frac;
          if (tn) {
            if (p.ring && p.ring !== tn) t.fromTo(e, { attr: { stroke: S.tone(p.ring) } }, { attr: { stroke: S.tone(tn) }, duration: 0.25, immediateRender: false }, at);
            else if (!p.ring) { t.fromTo(e, { attr: { stroke: S.tone(tn) } }, { attr: { stroke: S.tone(tn) }, duration: 0.001, immediateRender: false }, at); t.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, immediateRender: false }, at); }
          } else if (p.ring) t.fromTo(e, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25, immediateRender: false }, at);
          p.ring = tn;
        }
      });
    }
    if (po.label && to > 0) {
      const lab = STACK ? S.text(po.label, { x: B.x + B.width + 22, y: B.y + B.height / 2, size: po.size ?? 28, weight: 600, color: 'helps' }, g)
        : S.text(po.label, { x: B.x + B.width / 2, y: (o.frame !== false ? fb.y + fb.h : B.y + B.height) + (o.tokens ? 64 : 34), size: po.size ?? 28, weight: 600, color: 'helps', anchor: 'middle' }, g);
      t.fromTo(lab, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, d * 0.75);
      t.label = lab;
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
        if (!p.on || p.bad) continue;
        const e = inv(c), at = q * st;
        t.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: d, ease: 'power2.out', immediateRender: false }, at);
        t.fromTo(e.crack, { drawSVG: '0%' }, { drawSVG: '100%', duration: d * 0.8, ease: 'power2.out', immediateRender: false }, at + 0.05);
        if (p.ring) { t.fromTo(ring(c), { autoAlpha: 1 }, { autoAlpha: 0, duration: d, immediateRender: false }, at); p.ring = null; }
        p.bad = true;
      }
    });
    return t;
  };

  Object.assign(g, {
    cells, cell: cellAt, area: { x: x0, y: y0, w: AW, h: AH }, frame: fb,
    slotCenter: (i, l = 0) => { const [x, y] = pos(i, l); return [x + cw / 2, y + ch / 2]; },
    slotBox: i => { const [x, y] = pos(i, 0); return GRID ? { x, y: y0, w: cw, h: AH } : { x, y, w: cw, h: ch }; },
    count: () => { let k = 0; for (let i = 0; i < n; i++) if (cellAt(i, 0).__p.on) k++; return k; },
    x: fb.x, y: fb.y, w: fb.w, h: fb.h, l: fb.x, r: fb.x + fb.w, t: fb.y, b: fb.y + fb.h, cx: fb.x + fb.w / 2, cy: fb.y + fb.h / 2,
  });
  return g;
}


/**
 * libByteStream — bytes moving: a thick coral conduit from a memory block to a chip, with particles
 * (S.flow) streaming along it, a rate label (bandwidth), and a packet for a fixed amount ("140 GB")
 * that crosses and is consumed by the chip.
 *
 * o: {x1 = 560, y1 = 540, x2 = 1360, y2 = y1   the conduit's two ends (start at the memory, end at the chip;
 *                                              any straight direction; blocks sit beyond the ends),
 *     width = 44                               conduit thickness (a laptop's narrow bus ≈ 16, HBM ≈ 44–64),
 *     tone = 'bytes',
 *     lanes                                    hairline lanes inside (decorative); default by width,
 *     source = {title: 'memory', sub: '140 GB', w: 260, h: 170, style: 'card'} | false (connect to your own block),
 *     sink = {title: 'chip', w: 190, h: 190} | false,
 *     rate = '3.35 TB/s'                       label beside the conduit (coral, mono); null for none,
 *     rateSub                                  smaller muted word after it, e.g. 'bandwidth',
 *     label                                    muted text on the other side of the conduit (e.g. 'bus'),
 *     meter = false | true | {x, y, label: 'bytes moved', unit: 'GB'}  a counter for .pass({count: true})}
 * Returns <g> with .pipe .source .sink (.sink.die, .sink.labelEl) .rateEl .rateSubEl .labelEl .meter (.num .labelEl)
 *   and .start [x, y] .end [x, y] .d (centre-line path data) .mid [x, y]
 * Helpers:
 *   .flow(from, to, {density: 'trickle'|'steady'|'dense' | every, speed = 520, size, lanes, shape = 'chip'})
 *        particles between two time specs (like S.flow, which it uses; it schedules itself). Returns the flows.
 *   .pass({amount = 140, unit = 'GB', label, d = 1.2, count = false, flash = true, slices = 0}) → timeline:
 *        a packet labelled '140 GB' leaves the memory, crosses, and is consumed by the chip (which flashes
 *        amber); with count, the meter runs 0 → amount over the crossing; slices > 0 draws it as a ribbon.
 *   .flash({d = 0.45}) → the chip flashes amber (arithmetic on the bytes that arrived)
 *   .setRate(text, {d}) → swaps the rate label (e.g. '4.8 TB/s')
 * Example:
 *   const bus = libByteStream(S, { x1: 520, y1: 540, x2: 1380, rate: '3.35 TB/s', meter: true });
 *   S.add(S.fx.in(bus, { from: 'fade' }), 'b1');
 *   bus.flow('b1+0.3', 'b3>', { density: 'steady' });
 *   S.add(bus.pass({ amount: 140, count: true }), 'b2~every');
 */
function libByteStream(S, o = {}, parent) {
  const M = _libMem;
  const g = S.g(null, parent);
  const x1 = o.x1 ?? 560, y1 = o.y1 ?? 540, x2 = o.x2 ?? 1360, y2 = o.y2 ?? y1;
  const W = o.width ?? 44, tone = o.tone || 'bytes', c = S.tone(tone);
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const ang = Math.atan2(dy, dx) * 180 / Math.PI;
  const at = (s, k = 0) => [x1 + ux * s + nx * k, y1 + uy * s + ny * k];   // s along, k across (+k = right-hand side)

  // ---------------------------------------------------------------- layers (bottom → top)
  const pipe = S.g(null, g), flowLayer = S.g(null, g), packLayer = S.g(null, g), ends = S.g(null, g), labels = S.g(null, g);
  flowLayer.setAttribute('data-audit', 'ignore');

  // ---------------------------------------------------------------- conduit (drawn along +x, then rotated into place)
  pipe.setAttribute('transform', `translate(${x1},${y1}) rotate(${ang.toFixed(3)})`);
  const rr = Math.min(W / 2, 10);
  S.rect({ x: -6, y: -W / 2, w: len + 12, h: W, r: rr, fill: M.BASE }, pipe);
  g.body = S.rect({ x: -6, y: -W / 2, w: len + 12, h: W, r: rr, fill: c, fillOpacity: 0.13 }, pipe);
  const deco = S.g(null, pipe);
  deco.setAttribute('data-audit', 'ignore');
  const nLanes = o.lanes ?? (W >= 56 ? 5 : W >= 36 ? 3 : W >= 20 ? 1 : 0);
  for (let i = 1; i <= nLanes; i++) {
    const yy = -W / 2 + i * W / (nLanes + 1);
    S.line({ x1: 0, y1: yy, x2: len, y2: yy, stroke: c, strokeOpacity: 0.16, sw: 1 }, deco);
  }
  S.line({ x1: 0, y1: 0, x2: len, y2: 0, stroke: c, strokeOpacity: 0.07, sw: W * 0.55, cap: 'butt' }, deco);
  g.walls = [-1, 1].map(sg => S.line({ x1: -4, y1: sg * W / 2, x2: len + 4, y2: sg * W / 2, stroke: c, strokeOpacity: 0.75, sw: 2.5, cap: 'butt' }, pipe));
  g.pipe = pipe;
  g.d = `M${x1},${y1} L${x2},${y2}`;

  // ---------------------------------------------------------------- ends
  const ext = (w, h) => Math.abs(ux) * w / 2 + Math.abs(uy) * h / 2;   // half-extent of a box along the conduit
  if (o.source !== false) {
    const so = o.source || {};
    const w = so.w ?? 260, h = so.h ?? 170;
    const e = ext(w, h) - 3;
    const cx = x1 - ux * e, cy = y1 - uy * e;
    g.source = libMemBlock(S, { x: cx - w / 2, y: cy - h / 2, w, h, style: so.style || 'card', tone, label: so.title ?? 'memory', sub: so.sub ?? '140 GB', size: so.size ?? 34, layers: so.layers, gb: so.gb ?? 140 }, ends);
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
    const cell = 22, inset = 14;
    const nxC = Math.floor((w - 2 * inset + 4) / cell), nyC = Math.floor((h - 2 * inset + 4) / cell);
    const ox = X + (w - (nxC * cell - 4)) / 2, oy = Y + (h - (nyC * cell - 4)) / 2;
    let dd = '';
    for (let a = 0; a < nyC; a++) for (let b = 0; b < nxC; b++) dd += M.rr(ox + b * cell, oy + a * cell, 18, 18, [3, 3, 3, 3]);
    const grid = S.path({ d: dd, fill: 'compute', fillOpacity: 0.17 }, sk);
    grid.setAttribute('data-audit', 'ignore');
    sk.glow = S.rect({ x: X, y: Y, w, h, r: 16, fill: 'compute', opacity: 0 }, sk);
    sk.glow.setAttribute('data-audit', 'ignore');
    if (si.title !== null) sk.labelEl = S.text(si.title ?? 'chip', { x: cx, y: Y + h + 36, size: si.size ?? 30, weight: 650, color: 'compute', anchor: 'middle' }, sk);
    Object.assign(sk, { x: X, y: Y, w, h, l: X, r: X + w, t: Y, b: Y + h, cx, cy, die: sk });
    g.sink = sk;
  }

  // ---------------------------------------------------------------- labels beside the conduit
  const [mx, my] = at(len / 2);
  const horiz = Math.abs(ny) >= Math.abs(nx);
  const side = (k, text, so) => {
    // k < 0: the "up" side (above a horizontal conduit, right of a vertical one)
    const sgn = horiz ? (ny > 0 ? k : -k) : (nx > 0 ? -k : k);
    const off = W / 2 + (so.gap ?? 34);
    let px = mx, py = my, anchor = 'middle';
    if (horiz) py = my + (sgn < 0 ? -off : off);
    else { px = mx + (sgn < 0 ? off - 10 : -(off - 10)); anchor = sgn < 0 ? 'start' : 'end'; }
    return S.text(text, { x: px, y: py, anchor, ...so }, labels);
  };
  if (o.rate !== null) {
    g.rateEl = side(-1, o.rate ?? '3.35 TB/s', { size: o.rateSize ?? 36, weight: 650, family: 'mono', color: tone });
    if (o.rateSub) {
      const rb = { size: o.rateSize ?? 36, weight: 650, family: 'mono' };
      const rw = S.measure(g.rateEl.textContent, rb);
      const rx = +g.rateEl.getAttribute('x'), anc = g.rateEl.getAttribute('text-anchor');
      const right = anc === 'middle' ? rx + rw / 2 : anc === 'start' ? rx + rw : rx;
      if (anc === 'middle') {   // keep the pair centred over the conduit
        const sw = S.measure(o.rateSub, { size: 26, weight: 500 });
        const shift = (sw + 14) / 2;
        g.rateEl.setAttribute('x', rx - shift);
        g.rateSubEl = S.text(o.rateSub, { x: right - shift + 14, y: +g.rateEl.getAttribute('y') + 3, size: 26, weight: 500, color: 'muted' }, labels);
      } else g.rateSubEl = S.text(o.rateSub, { x: right + 14, y: +g.rateEl.getAttribute('y') + 3, size: 26, weight: 500, color: 'muted' }, labels);
    }
  }
  if (o.label) g.labelEl = side(1, o.label, { size: o.labelSize ?? 28, weight: 550, color: 'muted' });

  // ---------------------------------------------------------------- meter
  if (o.meter) {
    const mo = o.meter === true ? {} : o.meter;
    const sk = g.sink;
    const mxp = mo.x ?? (sk ? sk.cx : x2), myp = mo.y ?? (sk ? sk.t - 92 : y2 - 140);
    const mg = S.g(null, labels);
    mg.num = S.counter({ x: mxp, y: myp, size: mo.size ?? 44, value: 0, anchor: 'middle', color: 'ink', fmt: v => `${M.num(v, mo.ref ?? 140)} ${mo.unit ?? 'GB'}` }, mg);
    mg.labelEl = S.text(mo.label ?? 'bytes moved', { x: mxp, y: myp + (mo.size ?? 44) * 0.9, size: 26, weight: 550, color: 'muted', anchor: 'middle' }, mg);
    g.meter = mg;
  }

  // ---------------------------------------------------------------- anchors, helpers
  Object.assign(g, { start: [x1, y1], end: [x2, y2], mid: [mx, my], len, width: W });
  g.flow = (from, to, fo = {}) => {
    const dens = fo.density ?? 'steady';
    const every = fo.every ?? ({ trickle: 0.42, steady: 0.13, dense: 0.07 }[dens] || 0.13);
    const k = fo.lanes ?? (W >= 40 ? 3 : W >= 24 ? 2 : 1);
    const size = fo.size ?? Math.max(3, Math.min(7, W * 0.13));
    const spread = W / 2 - size * 1.6;
    const out = [];
    for (let i = 0; i < k; i++) {
      const off = k === 1 ? 0 : -spread + (2 * spread) * i / (k - 1);
      const [ax, ay] = at(-10, off), [bx, by] = at(len + 10, off);
      const lag = every * ((i * 0.618) % 1);
      out.push(S.flow({ d: `M${ax},${ay} L${bx},${by}`, from: S.t(from) + lag, to: S.t(to), speed: fo.speed ?? 520, every, size, color: tone, tone: M.GRAD.includes(tone) ? tone : 'bytes', shape: fo.shape || 'chip', opacity: fo.opacity }, flowLayer));
    }
    return out;
  };
  g.flash = (fo = {}) => {
    if (!g.sink) return gsap.timeline();
    const d = fo.d ?? 0.45;
    return gsap.fromTo(g.sink.glow, { opacity: 0 }, { opacity: fo.to ?? 0.45, duration: d / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false });
  };
  g.setRate = (text, ro = {}) => S.fx.swap(g.rateEl, text, ro);
  g.pass = (po = {}) => {
    const amount = po.amount ?? 140, unit = po.unit ?? 'GB', d = po.d ?? 1.2;
    const plen = po.length ?? Math.min(220, Math.max(90, len * 0.2));
    const ph = Math.max(6, W - 10);
    const pk = S.g(null, packLayer);
    const box = S.g(null, pk);
    box.setAttribute('transform', `rotate(${ang.toFixed(3)})`);
    const slices = po.slices ?? 0;
    if (slices > 0) {
      const sw = (plen - (slices - 1) * 3) / slices;
      for (let i = 0; i < slices; i++) S.rect({ x: -plen / 2 + i * (sw + 3), y: -ph / 2, w: sw, h: ph, r: Math.min(3, sw / 2), fill: M.solid(S, tone) }, box);
    } else S.rect({ x: -plen / 2, y: -ph / 2, w: plen, h: ph, r: Math.min(10, ph / 2), fill: M.solid(S, tone), filter: 'url(#shadow)' }, box);
    const text = po.label ?? `${M.num(amount)} ${unit}`;
    const tsz = po.size ?? Math.min(28, Math.round(ph * 0.62));
    const fits = text && slices === 0 && horiz && S.measure(text, { size: tsz, weight: 700, family: 'mono' }) + 20 <= plen && ph >= 26;
    if (fits) pk.labelEl = S.text(text, { x: 0, y: 1, size: tsz, weight: 700, family: 'mono', anchor: 'middle', color: M.DARK }, pk);
    gsap.set(pk, { autoAlpha: 0 });
    const s0 = -plen / 2 - 4, s1 = len + plen / 2 + 4;
    const place = s => { const [px, py] = at(s); pk.setAttribute('transform', `translate(${px.toFixed(2)},${py.toFixed(2)})`); };
    place(s0);
    const t = gsap.timeline();
    t.fromTo(pk, { autoAlpha: 0 }, { autoAlpha: 1, duration: Math.min(0.2, d * 0.2), immediateRender: false }, 0);
    t.add(M.drive(s0, s1, place, { d, ease: po.ease || 'power1.inOut' }), 0);
    t.fromTo(pk, { autoAlpha: 1 }, { autoAlpha: 0, duration: Math.min(0.2, d * 0.2), immediateRender: false }, d - Math.min(0.2, d * 0.2));
    if (po.flash !== false && g.sink) t.add(g.flash({ d: 0.5 }), d - 0.22);
    if (po.count && g.meter) t.add(S.fx.count(g.meter.num, 0, amount, { d, ease: po.ease || 'power1.inOut' }), 0);
    t.packet = pk;
    return t;
  };
  return g;
}
