/* Shared builders for chapter 15, "The prefix rule". Loaded before every ch15 scene (read-only for
   the other animators). Plain functions, each taking S; every helper RETURNS a tween/timeline for
   S.add, and each element's helpers must be called in time order (they keep a plan, like fx.xform).

   The chapter's visual language
   - A prompt is a horizontal BAR cut into token cells (ch15Bar): blue while it is just text, teal where
     it is a hit (reused), amber where it must be prefilled. Labels sit inside the bar, ink on the tint.
   - Keys and values are coral K|V slabs: use libKVCache (lib/memory.js) for every cache row or tray.
   - Matching runs FRONT TO BACK: ch15Sweep is the moving edge (with the magnifier in s01, a teal wash
     in s04 and s06). It stops at the first difference, drawn by ch15DiffLine (a white line).
   - Asides and provenance are small grey tags (ch15Tag); the weather chat is a tag led by CH15.weather.
   - Colours: hit 'helps' (teal), miss / prefill 'compute' (amber), tokens 'struct' (blue),
     keys and values 'bytes' (coral). Labels 26 px, card text 26-44 px. */

const CH15 = {
  hit: 'helps', miss: 'compute', token: 'struct', kv: 'bytes',
  label: 26,                               // px for every bar / tag label in the chapter
  weather: 'ph:cloud-sun-duotone',         // the weather conversation's marker (s02, s04; ch16 and ch17 reuse it)
  BASE: '#0c1326', DARK: '#0a0f1e',
};

/** Rounded-rect path with separate left and right corner radii (rl, rr). */
function ch15RR(x, y, w, h, rl, rr) {
  w = Math.max(0, w);
  rl = Math.min(rl, w / 2, h / 2); rr = Math.min(rr, w / 2, h / 2);
  if (w < 0.5) return '';
  return `M${x + rl},${y}H${x + w - rr}${rr ? `A${rr},${rr} 0 0 1 ${x + w},${y + rr}` : ''}V${y + h - rr}` +
    `${rr ? `A${rr},${rr} 0 0 1 ${x + w - rr},${y + h}` : ''}H${x + rl}${rl ? `A${rl},${rl} 0 0 1 ${x},${y + h - rl}` : ''}` +
    `V${y + rl}${rl ? `A${rl},${rl} 0 0 1 ${x + rl},${y}` : ''}Z`;
}

/**
 * ch15Bar — a prompt drawn as one bar cut into n token cells (the token count is schematic).
 * Looks like a libToken chip stretched long: opaque base, soft tint, coloured outline.
 * o: {x (left), y (centre), h = 40, n = 20 cells, pitch (px per cell; default w / n), w,
 *     tone = 'struct', ticks = 'edges' (short notches top and bottom at each cell boundary)
 *     | 'full' (thin full-height dividers; for bars with no label inside) | false,
 *     r = 12, label (centred inside the bar), labelSize = 26}
 * Returns <g> (visible as built; enter it with fx.in / fx.out / fx.dim) with
 *   .X(i)       x of the boundary before cell i: X(0) is the left end, X(n) the right end
 *   .mid(a, b)  centre x of cells a .. b-1
 *   .labelEl    the centred label, if any (a plain <text>: fx.in / fx.out it)
 *   .l .r .t .b .cy .h .w .n .pitch
 * Helpers:
 *   .paint(a, b, tone, {d = 0.8, wipe = true, ease}) → timeline: cells a .. b-1 take the tone (CH15.hit,
 *        CH15.miss, ...). With wipe the colour runs in from the left (a match sweeping front to back);
 *        otherwise it cross-fades. Later paints sit on top of earlier ones.
 *   .note(text, {a = 0, b = n, tone (text colour, default 'ink'), pos = 'inside' | 'above' | 'below',
 *        size = 26, gap = 14, weight = 600}) → <g> holding .text, HIDDEN; centred on cells a .. b-1.
 *        Enter it with fx.in (it is a fresh group, so fx.in / fx.out / fx.dim are all safe on it).
 *   .glint(a, b, {d = 0.5, to = 0.35}) → timeline: a white flash over cells a .. b-1 (attention, a check).
 * Example:
 *   const bar = ch15Bar(S, { x: 370, y: 452, n: 24, pitch: 60, label: 'turn 2: whole conversation + new words' });
 *   S.add(bar.paint(0, 20, CH15.hit), 'b3~skip');
 *   const hit = bar.note('hit: skip prefill', { a: 0, b: 20 });  S.add(S.fx.in(hit, { from: 'fade' }), 'b3~skip+0.5');
 */
function ch15Bar(S, o = {}, parent) {
  const n = o.n ?? 20, h = o.h ?? 40, r = o.r ?? 12;
  const pitch = o.pitch ?? (o.w ?? 1200) / n, w = n * pitch;
  const x = o.x ?? 360, y = (o.y ?? 540) - h / 2;
  const tone = o.tone || 'struct';
  const X = i => x + i * pitch;
  const g = S.g(null, parent);
  const fills = S.g(null, g), paints = S.g(null, g), top = S.g(null, g), notes = S.g(null, g);
  // a soft skin: opaque base, the card gradient, a flat tint, an outline (the libToken 'soft' look)
  const skin = (into, tn) => {
    const sk = S.g(null, into);
    sk.parts = [
      S.path({ d: '', fill: CH15.BASE }, sk),
      S.path({ d: '', fill: `url(#card-${tn})` }, sk),
      S.path({ d: '', fill: tn, fillOpacity: tn === 'neutral' ? 0.04 : 0.1, stroke: tn === 'neutral' ? '#ffffff' : tn, strokeOpacity: tn === 'neutral' ? 0.28 : 0.85, sw: 2 }, sk),
    ];
    sk.set = (x0, x1) => {
      const d = ch15RR(x0, y, x1 - x0, h, x0 <= x + 0.5 ? r : 0, x1 >= x + w - 0.5 ? r : 0);
      sk.parts.forEach(p => p.setAttribute('d', d));
    };
    return sk;
  };
  skin(fills, tone).set(x, x + w);
  if (o.ticks !== false && pitch >= 4) {
    let d = '';
    const full = o.ticks === 'full', k = Math.min(8, h * 0.2);
    for (let i = 1; i < n; i++) d += full ? `M${X(i)},${y + 5}v${h - 10}` : `M${X(i)},${y + 2}v${k}M${X(i)},${y + h - 2}v${-k}`;
    const tk = S.path({ d, stroke: '#ffffff', strokeOpacity: full ? 0.14 : 0.3, sw: 1.5, cap: 'butt' }, top);
    tk.setAttribute('data-audit', 'ignore');
  }
  if (o.label) g.labelEl = S.text(o.label, { x: x + w / 2, y: y + h / 2 + 1, size: o.labelSize ?? CH15.label, weight: 600, anchor: 'middle', color: 'ink' }, notes);
  Object.assign(g, { X, mid: (a, b) => (X(a) + X(b)) / 2, l: x, r: x + w, t: y, b: y + h, cy: y + h / 2, h, w, n, pitch });

  g.paint = (a, b, tn, po = {}) => {
    const sk = skin(paints, tn), x0 = X(a), x1 = X(b);
    const p = { v: 0 }, tl = gsap.timeline();
    const draw = () => sk.set(x0, po.wipe === false ? x1 : x0 + (x1 - x0) * p.v);
    sk.set(x0, x1);
    gsap.set(sk, { autoAlpha: 0 });
    if (po.wipe === false) {
      tl.fromTo(sk, { autoAlpha: 0 }, { autoAlpha: 1, duration: po.d ?? 0.6, ease: 'power1.inOut', immediateRender: false }, 0);
    } else {
      tl.fromTo(sk, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, immediateRender: false }, 0);
      tl.fromTo(p, { v: 0 }, { v: 1, duration: po.d ?? 0.8, ease: po.ease || 'power1.inOut', immediateRender: false, onUpdate: draw, onStart: draw }, 0);
    }
    return tl;
  };
  g.note = (text, no = {}) => {
    const a = no.a ?? 0, b = no.b ?? n, size = no.size ?? CH15.label, gap = no.gap ?? 14;
    const pos = no.pos || 'inside';
    const ty = pos === 'above' ? y - gap - size * 0.55 : pos === 'below' ? y + h + gap + size * 0.55 : y + h / 2 + 1;
    const ng = S.g(null, notes);
    ng.text = S.text(text, { x: g.mid(a, b), y: ty, size, weight: no.weight ?? 600, anchor: 'middle', color: no.tone || 'ink' }, ng);
    gsap.set(ng, { autoAlpha: 0 });
    return ng;
  };
  g.glint = (a, b, go = {}) => {
    const e = S.path({ d: ch15RR(X(a) + 2, y + 2, X(b) - X(a) - 4, h - 4, 8, 8), fill: '#ffffff', opacity: 0 }, top);
    e.setAttribute('data-audit', 'ignore');
    const d = go.d ?? 0.5;
    return gsap.fromTo(e, { opacity: 0 }, { opacity: go.to ?? 0.35, duration: d / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false });
  };
  return g;
}

/**
 * ch15Sweep — the front-to-back comparison: an edge of light that runs left to right across a bar
 * (and the cache row or second bar under it), optionally carrying an icon (the magnifier in s01),
 * leaving a wash behind it and popping small ticks as it passes given x positions (segment boundaries).
 * o: {x (start), y1, y2 (the edge's extent), tone = 'helps', edge = true, wash = false (a translucent
 *     band of the tone from the start to the edge), ticks = [] (x positions), tickY (default y1 - 12),
 *     icon (icon id), iconY (default the middle of y1..y2), iconSize = 72, iconTone = 'ink'}
 * Returns <g> (hidden until the first .run) with .edgeEl .washEl .iconEl .tickEls[] and
 *   .run(x2, {d = 1.6, ease = 'power1.inOut'}) → timeline: appears (first call), runs to x2; call again
 *        later to continue, or to replay from a new start with {from: x}
 *   .out({d = 0.4}) → timeline: the sweep fades (its ticks and wash too)
 *   .x() → the edge's planned x after the calls so far
 * Every moving part is data-audit="ignore": it is a cursor, and labels it passes are not 'on a line'.
 */
function ch15Sweep(S, o = {}, parent) {
  const tone = o.tone || 'helps';
  const y1 = o.y1 ?? 400, y2 = o.y2 ?? 520;
  const g = S.g(null, parent);
  g.setAttribute('data-audit', 'ignore');
  const x0 = o.x ?? 360;
  const st = { x: x0, from: x0 };
  if (o.wash) g.washEl = S.rect({ x: x0, y: y1, w: 0, h: y2 - y1, r: 6, fill: tone, fillOpacity: 0.14 }, g);
  const edge = S.g(null, g);
  if (o.edge !== false) {
    S.rect({ x: -30, y: y1 - 6, w: 60, h: y2 - y1 + 12, fill: `url(#pglow-${tone === 'ink' ? 'struct' : tone})`, opacity: 0.9 }, edge);
    S.rect({ x: -2.5, y: y1 - 4, w: 5, h: y2 - y1 + 8, r: 2.5, fill: tone }, edge);
  }
  g.edgeEl = edge;
  const ty = o.tickY ?? y1 - 12;
  g.tickEls = (o.ticks || []).map(tx => {
    const t = S.path({ d: `M${tx - 9},${ty - 10}L${tx},${ty}L${tx + 9},${ty - 10}`, stroke: tone, sw: 3 }, g);
    t.__x = tx; t.setAttribute('opacity', 0);
    return t;
  });
  if (o.icon) {
    const iy = o.iconY ?? (y1 + y2) / 2;
    g.iconEl = S.g(null, g);
    S.icon(o.icon, { x: 0, y: iy, size: o.iconSize ?? 72, color: o.iconTone || 'ink' }, g.iconEl);
  }
  const place = () => {
    edge.setAttribute('transform', `translate(${st.x.toFixed(2)},0)`);
    if (g.iconEl) g.iconEl.setAttribute('transform', `translate(${st.x.toFixed(2)},0)`);
    if (g.washEl) { g.washEl.setAttribute('x', st.from); g.washEl.setAttribute('width', Math.max(0, st.x - st.from)); }
    g.tickEls.forEach(t => t.setAttribute('opacity', Math.max(0, Math.min(1, (st.x - t.__x) / 14)).toFixed(3)));
  };
  place();
  gsap.set(g, { autoAlpha: 0 });
  let plan = { x: x0, from: x0 }, shown = false;
  g.run = (x2, ro = {}) => {
    const tl = gsap.timeline();
    const a = { ...plan, ...(ro.from != null ? { x: ro.from, from: ro.from } : {}) };
    const b = { x: x2, from: a.from };
    plan = b;
    if (!shown) { tl.fromTo(g, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'power1.out', immediateRender: false }, 0); shown = true; }
    tl.fromTo(st, { ...a }, { ...b, duration: ro.d ?? 1.6, ease: ro.ease || 'power1.inOut', immediateRender: false, onUpdate: place, onStart: place }, 0);
    return tl;
  };
  g.out = (oo = {}) => { shown = false; return gsap.fromTo(g, { autoAlpha: 1 }, { autoAlpha: 0, duration: oo.d ?? 0.4, ease: 'power1.in', immediateRender: false }); };
  g.x = () => plan.x;
  return g;
}

/**
 * ch15DiffLine — the first difference: a white vertical line dropped at x across one or more rows, with
 * a short label ('the first difference', 'differs here') above or below it.
 * o: {x, y1, y2, label, labelPos = 'above' | 'below', tone = 'ink', size = 26, sw = 4, gap = 14}
 * Returns <g> (hidden) with .lineEl .labelEl, and
 *   .drop({d = 0.5}) → timeline: the line grows down from y1, then the label fades in
 *   .slide(x2, {d = 0.6}) → timeline: the line (and label) move sideways to x2 (s06: the notch moves)
 */
function ch15DiffLine(S, o = {}, parent) {
  const tone = o.tone || 'ink', size = o.size ?? CH15.label, gap = o.gap ?? 14;
  const x = o.x ?? 960, y1 = o.y1 ?? 400, y2 = o.y2 ?? 560;
  const g = S.g(null, parent), inner = S.g(null, g);
  g.lineEl = S.line({ x1: x, y1, x2: x, y2, stroke: tone === 'ink' ? '#ffffff' : tone, sw: o.sw ?? 4 }, inner);
  if (o.label) {
    const below = o.labelPos === 'below';
    g.labelEl = S.text(o.label, { x, y: below ? y2 + gap + size * 0.55 : y1 - gap - size * 0.55, size, weight: 600, anchor: 'middle', color: tone }, inner);
  }
  gsap.set(g, { autoAlpha: 0 });
  let px = 0;
  g.drop = (dO = {}) => {
    const d = dO.d ?? 0.5, tl = gsap.timeline();
    tl.fromTo(g, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: false }, 0);
    tl.fromTo(g.lineEl, { attr: { y2: y1 } }, { attr: { y2 }, duration: d, ease: 'power2.out', immediateRender: false }, 0);
    if (g.labelEl) tl.fromTo(g.labelEl, { autoAlpha: 0, y: 0 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power1.out', immediateRender: false }, d * 0.6);
    return tl;
  };
  g.slide = (x2, so = {}) => {
    const from = px; px = x2 - x;
    return gsap.fromTo(inner, { x: from }, { x: px, duration: so.d ?? 0.6, ease: so.ease || 'power2.inOut', immediateRender: false });
  };
  return g;
}

/**
 * ch15Tag — a small grey tag for asides and provenance ('prompt caching: reuse across requests',
 * 'not stored here', 'provider'), optionally led by an icon (CH15.weather for the weather chat).
 * One line, or two (the second smaller and fainter: 'weather chat, 1,032 tokens' / 'to scale by area').
 * o: {x, y (centre), anchor = 'start' | 'middle' | 'end', lines = string | [line1, line2], icon,
 *     iconTone = 'muted', tone = 'neutral' (outline colour; 'helps' etc. for a coloured tag),
 *     size = 26, textTone = 'muted', padX = 16}
 * Returns <g> (visible as built; enter it with fx.in) with .bg .lineEls[] .iconEl and .l .r .t .b .w .h .cx .cy
 */
function ch15Tag(S, o = {}, parent) {
  const lines = Array.isArray(o.lines) ? o.lines : [o.lines ?? ''];
  const size = o.size ?? CH15.label, s2 = Math.max(24, Math.round(size * 0.92));
  const padX = o.padX ?? 16, iconS = o.icon ? Math.round(size * (lines.length > 1 ? 1.9 : 1.3)) : 0, ig = o.icon ? 12 : 0;
  const tw = Math.max(...lines.map((l, i) => S.measure(l, { size: i ? s2 : size, weight: i ? 500 : 550 })));
  const lh = size * 1.3, h = Math.round(lines.length > 1 ? size + s2 * 1.25 + 22 : size * 1.65);
  const w = padX * 2 + iconS + ig + tw;
  const anchor = o.anchor || 'start';
  const x = anchor === 'middle' ? o.x - w / 2 : anchor === 'end' ? o.x - w : o.x, y = o.y - h / 2;
  const tone = o.tone || 'neutral';
  const g = S.g(null, parent);
  S.rect({ x, y, w, h, r: Math.min(14, h / 2), fill: CH15.BASE, fillOpacity: 0.9 }, g);
  g.bg = S.rect({ x, y, w, h, r: Math.min(14, h / 2), fill: tone === 'neutral' ? '#ffffff' : tone, fillOpacity: tone === 'neutral' ? 0.04 : 0.08,
    stroke: tone === 'neutral' ? '#ffffff' : tone, strokeOpacity: tone === 'neutral' ? 0.2 : 0.6, sw: 1.5 }, g);
  if (o.icon) g.iconEl = S.icon(o.icon, { x: x + padX + iconS / 2, y: o.y, size: iconS, color: o.iconTone || 'muted' }, g);
  const tx = x + padX + iconS + ig;
  g.lineEls = lines.map((l, i) => S.text(l, {
    x: tx, y: lines.length > 1 ? o.y + (i ? s2 * 0.62 + 2 : -size * 0.55) : o.y + 1,
    size: i ? s2 : size, weight: i ? 500 : 550, color: i ? 'faint' : (o.textTone || 'muted'),
  }, g));
  Object.assign(g, { l: x, r: x + w, t: y, b: y + h, w, h, cx: x + w / 2, cy: o.y });
  return g;
}
