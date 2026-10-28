/* Shared builders for chapter 14, "Why a key depends on its context". Loaded before every ch14 scene;
   read-only for the other animators. Plain functions taking S. Every helper RETURNS a tween/timeline for
   S.add, and an element's helpers must be called in time order.

   The chapter's visual language (keep it in every scene)
   - Tokens: libToken pills 't1' … 't5' (ch14Tokens): size 30, fixed width 96, 28 apart. The token whose key
     we follow (t5) is in libToken state 'new' (a white rim, slightly brighter). The changed token is 'XX' in
     state 'changed' (violet): violet marks the changed token and anything carrying it, in this chapter only.
   - Dependence on earlier tokens: thin blue arcs from the earlier pills into t5 (ch14Tokens .showArcs).
   - Vectors (a token's vector, an input, a key): horizontal blue heat strips, no digits (ch14Bar).
   - Weight matrices: the ch08 look, a blue-grey tile carrying its own seeded weight-grid texture, named W with
     a subscript (ch14Matrix, ch14W). A white padlock badge (ch14Lock) marks anything fixed.
   - Operators: an amber '×' (the multiply is arithmetic), a white '=' (ch14Op). 'Same' is teal, '≠' white.
   - Notes and provenance: small grey tags (ch14Tag).
   - No coral: nothing in this chapter is about bytes, except s06's one bytes readout.

   CH14                                  constants: tokens, tones, sizes
   ch14Drive(d, apply, ease)             a seek-safe proxy tween calling apply(eased progress 0..1)
   ch14Fade(els, a, b, o)                a seek-safe opacity fade a → b (style.opacity), for dims and returns
   ch14Retext(t, from, to, d)            a seek-safe text change (old text before the tween, new after)
   ch14Tokens(S, o, parent)              the 't1' … 't5' strip, with dependence arcs into the query token
   ch14Bar(S, o, parent)                 a vector as a horizontal blue heat strip, with an optional label below
   ch14Matrix(S, o, parent)              the blue-grey weight tile W_K (texture, name, sub-label, padlock)
   ch14Lock(S, o, parent)                the white padlock badge, with .snap()
   ch14W(S, sub, o, parent)              'W' with a subscript, as a <text>
   ch14Op(S, sym, o, parent)             '×' (amber) or '=' / '≠' (white), display face
   ch14Tag(S, text, o, parent)           a small grey tag pill, optionally with an icon (or 'pill': a mini token)
*/

const CH14 = {
  tokens: ['t1', 't2', 't3', 't4', 't5'],
  token: 'struct', changed: 'violet', matrix: 'neutral', mult: 'compute', same: 'helps',
  BASE: '#0c1326',
  pillSize: 30, pillW: 96, pillGap: 28,
  label: 30,          // px: labels under bars and tiles
  tag: 26,            // px: grey tags
};

/** A proxy tween calling apply(eased progress 0..1) over d s; seek-safe in both directions. */
function ch14Drive(d, apply, ease) {
  const p = { v: 0 }, e = gsap.parseEase(ease || 'none');
  const go = () => apply(e(p.v));
  return gsap.fromTo(p, { v: 0 }, {
    v: 1, duration: Math.max(0.001, d), ease: 'none', immediateRender: false,
    onStart: go, onUpdate: go, onReverseComplete: () => apply(0),
  });
}

/**
 * Fade elements from opacity a to b by writing style.opacity from tween progress (hidden at 0). Seek-safe and
 * independent of GSAP's autoAlpha, so it can dim something that also entered with fx.in / pop (fade a child
 * or a wrapper, not the very element fx.in animated). o: {d 0.5, ease 'power2.out', stagger 0}.
 */
function ch14Fade(els, a, b, o = {}) {
  const list = (Array.isArray(els) ? els : [els]).filter(Boolean);
  const tl = gsap.timeline();
  list.forEach((e, i) => tl.add(ch14Drive(o.d ?? 0.5, k => {
    const v = a + (b - a) * k;
    e.style.opacity = v;
    e.style.visibility = v > 0.001 ? 'inherit' : 'hidden';
  }, o.ease || 'power2.out'), i * (o.stagger ?? 0)));
  return tl;
}

/** A text change that is a pure function of time: `from` before the tween, `to` after it, with a quick dip. */
function ch14Retext(t, from, to, d = 0.4) {
  const p = { v: 0 }, tl = gsap.timeline();
  tl.fromTo(t, { opacity: 1 }, { opacity: 0, duration: d / 2, ease: 'power1.in', immediateRender: false }, 0);
  tl.fromTo(p, { v: 0 }, { v: 1, duration: d, ease: 'none', immediateRender: false,
    onUpdate: () => { t.textContent = p.v < 0.5 ? from : to; },
    onReverseComplete: () => { t.textContent = from; } }, 0);
  tl.fromTo(t, { opacity: 0 }, { opacity: 1, duration: d / 2, ease: 'power1.out', immediateRender: false }, d / 2);
  return tl;
}

/**
 * ch14Tokens — the chapter's token strip (libTokenStrip), with thin blue dependence arcs from each earlier
 * pill into the query pill. The arcs nest without crossing: each lands on its own spot along the query
 * pill's top edge (the farthest token lands rightmost).
 * o: x 960 (centre), y 250 (centre of the pills), tokens CH14.tokens, changed (index or null: that pill reads
 *    'XX' in state 'changed', violet), query 4 (the pill the arcs land on; state 'new'), size 30, w 96, gap 28,
 *    hidden true (reveal the pills with .reveal()), arcTone 'struct', arcSw 3, arcFrom [0 .. query-1],
 *    arcLift 30 + 0.15 × span (px above the pill tops; override with a number or a function of span).
 * Returns the libTokenStrip (.tokens[] .at(i) .reveal .setState .pulse .glow ...) plus:
 *    .arcsG (holder <g> of the arcs, behind the pills: its opacity is the arcs' brightness), .arcs[] (<path>
 *    per source token, each with .j), .query, .top (y of the pill tops), .arcTop (y the tallest arc reaches).
 * Helpers (timelines; call in time order):
 *    .showArcs({d 0.7, stagger 0.22, to 1, order 'far'|'near'})  each arc draws from its token into the query
 *        pill (farthest first by default) while the holder fades to `to` (e.g. 0.45 for 'faint')
 *    .arcsTo(opacity, {d 0.5})   brighten or dim the drawn arcs
 *    .hideArcs({d 0.4})          the arcs fade out (showArcs can draw them again)
 *   const tk = ch14Tokens(S, { x: 960, y: 250 });
 *   S.add(tk.reveal('all', { every: 0.08 }), 'b1');
 *   S.add(tk.showArcs(), 'b1~depends');
 */
function ch14Tokens(S, o = {}, parent) {
  const toks = (o.tokens || CH14.tokens).slice();
  const ci = o.changed ?? null, qi = o.query ?? toks.length - 1;
  const items = toks.map((t, i) => ({ t: i === ci ? 'XX' : t, state: i === ci ? 'changed' : i === qi ? 'new' : 'token' }));
  const root = S.g(null, parent);
  const arcsG = S.g(null, root);
  const strip = libTokenStrip(S, {
    x: o.x ?? 960, y: o.y ?? 250, align: 'middle', tokens: items, size: o.size ?? CH14.pillSize,
    w: o.w ?? CH14.pillW, gap: o.gap ?? CH14.pillGap, hidden: o.hidden ?? true,
  }, root);
  const q = strip.at(qi), top = q.t;
  const from = o.arcFrom || toks.map((_, i) => i).filter(i => i < qi);
  const lift = typeof o.arcLift === 'function' ? o.arcLift : (span => (o.arcLift ?? (30 + 0.15 * span)));
  const nArc = from.length, spread = Math.min(12, (q.x2 - q.x1 - 40) / Math.max(1, nArc - 1));
  let arcTop = top;
  const arcs = from.map((j, k) => {
    const s = strip.at(j);
    // farthest source (k = 0) lands rightmost, so the arcs nest without crossing
    const x1 = s.cx, x2 = q.cx + ((nArc - 1) / 2 - k) * spread;
    const h = lift(Math.abs(x2 - x1)), c = h / 0.75;      // a cubic with both handles at height c peaks at 0.75 c
    arcTop = Math.min(arcTop, top - h);
    const p = S.path({ d: `M${x1.toFixed(1)},${top - 2} C${x1.toFixed(1)},${(top - c).toFixed(1)} ${x2.toFixed(1)},${(top - c).toFixed(1)} ${x2.toFixed(1)},${top - 2}`,
      stroke: o.arcTone || 'struct', sw: o.arcSw ?? 3, strokeOpacity: 0.9 }, arcsG);
    p.j = j;
    p.style.visibility = 'hidden';
    return p;
  });
  arcsG.style.opacity = 0;
  let shown = 0;   // planned holder opacity, so each fade starts where the last one left it
  const fadeHolder = (to, d, ease) => {
    const a = shown; shown = to;
    return ch14Drive(d, k => { arcsG.style.opacity = a + (to - a) * k; }, ease || 'power2.out');
  };
  strip.showArcs = (so = {}) => {
    const tl = gsap.timeline(), d = so.d ?? 0.7, st = so.stagger ?? 0.22;
    const order = so.order === 'near' ? arcs.slice().reverse() : arcs;
    tl.add(fadeHolder(so.to ?? 1, 0.3), 0);
    order.forEach((p, k) => tl.fromTo(p, { drawSVG: '0%', visibility: 'inherit' },
      { drawSVG: '100%', visibility: 'inherit', duration: d, ease: 'power2.inOut', immediateRender: false }, k * st));
    return tl;
  };
  strip.arcsTo = (to, ao = {}) => fadeHolder(to, ao.d ?? 0.5, ao.ease);
  strip.hideArcs = (ho = {}) => fadeHolder(0, ho.d ?? 0.4, 'power2.in');
  Object.assign(strip, { arcsG, arcs, query: qi, top, arcTop, root });
  return strip;
}

/**
 * ch14Bar — a vector as a horizontal blue heat strip (libVector style 'heat', no digits): a token's vector, an
 * input, a key. The same seed gives the same pattern, so 'the same vector' can be drawn twice and match.
 * o: x 960, y 540 (centre), n 12 cells, cw 26, ch 52, gap 3, seed 5, gain 1, tone 'struct' (or a function, as
 *    libVector), negTone null (every cell blue, shaded by size: in this chapter violet means 'changed', so
 *    a plain vector never shows violet cells; pass 'violet' for libVector's negative-value shading), label (text under the bar, CH14.label px,
 *    muted), labelGap 42 (bar bottom to label centre), labelColor 'muted', hidden false.
 * Returns the libVector (.cells .pop .in .sweep .flash .paint .reshade; geometry .l .r .t .b .cx .cy .w .h)
 *    plus .labelEl (a plain <text>, outside the vector's own group: fx.in / ch14Retext it), .haloEl, and
 *    .glow({tone 'struct', d 0.5, sweep true}) / .unglow({d 0.4}): a soft outlined halo round the bar (behind
 *    it) fades in, and a white highlight runs along the cells.
 */
function ch14Bar(S, o = {}, parent) {
  const holder = S.g(null, parent);
  const haloG = S.g(null, holder);
  const v = libVector(S, {
    x: o.x ?? 960, y: o.y ?? 540, dir: 'row', style: 'heat', n: o.n ?? 12, cw: o.cw ?? 26, ch: o.ch ?? 52,
    gap: o.gap ?? 3, seed: o.seed ?? 5, gain: o.gain ?? 1, tone: o.tone || 'struct',
    negTone: o.negTone ?? null, hidden: o.hidden,
  }, holder);
  v.holder = holder;
  if (o.label) v.labelEl = S.text(o.label, { x: v.cx, y: v.b + (o.labelGap ?? 42), size: o.labelSize ?? CH14.label, anchor: 'middle', color: o.labelColor || 'muted', weight: 600 }, parent);
  const pad = 12;
  v.haloEl = S.rect({ x: v.l - pad, y: v.t - pad, w: v.w + 2 * pad, h: v.h + 2 * pad, r: 14, fill: o.glowTone || 'struct', fillOpacity: 0.14, stroke: o.glowTone || 'struct', strokeOpacity: 0.85, sw: 2.5 }, haloG);
  v.haloEl.style.opacity = 0;
  let hv = 0;
  v.glow = (go = {}) => {
    const tl = gsap.timeline(), a = hv; hv = 1;
    if (go.tone) { const c = S.tone(go.tone); tl.set(v.haloEl, { attr: { fill: c, stroke: c } }, 0); }
    tl.add(ch14Drive(go.d ?? 0.5, k => { v.haloEl.style.opacity = a + (1 - a) * k; }, 'power2.out'), 0);
    if (go.sweep !== false) tl.add(v.sweep({ stagger: 0.03 }), 0.1);
    return tl;
  };
  v.unglow = (uo = {}) => { const a = hv; hv = 0; return ch14Drive(uo.d ?? 0.4, k => { v.haloEl.style.opacity = a * (1 - k); }, 'power2.in'); };
  return v;
}

/** 'W' with a subscript (ch08's typesetting): ch14W(S, 'K', {x, y, size 46, color 'ink', anchor 'middle'}). Keep size ≥ 36. */
function ch14W(S, sub, o = {}, parent) {
  const size = o.size ?? 46;
  const t = S.text('W', { anchor: 'middle', weight: 650, color: 'ink', ...o, size }, parent);
  const ts = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
  ts.textContent = sub;
  ts.setAttribute('font-size', Math.round(size * 0.68));
  ts.setAttribute('dy', (size * 0.26).toFixed(1));
  t.appendChild(ts);
  t.__plain = 'W' + sub;
  return t;
}

/** An operator in the display face: '×' amber, '=' and '≠' white. o: {x, y, size 64, color}. Returns the <text>. */
function ch14Op(S, sym, o = {}, parent) {
  const color = o.color || (sym === '×' ? CH14.mult : 'ink');
  return S.text(sym, { x: o.x, y: o.y, size: o.size ?? 64, weight: 500, anchor: 'middle', family: 'display', color }, parent);
}

/**
 * ch14Lock — the white padlock badge: a dark disc with a white rim and a padlock, marking something fixed.
 * o: x, y (centre), r 26, color 'ink', shown false (hidden until .snap()).
 * Returns <g> with .body (the disc and padlock), .ring, and .snap({d 0.4}): it drops onto its spot from 1.8×
 *    with a hard settle, and a ring clicks outward once. After that it never moves.
 */
function ch14Lock(S, o = {}, parent) {
  const x = o.x ?? 0, y = o.y ?? 0, r = o.r ?? 26;
  const g = S.g(null, parent);
  const ring = S.circle({ x, y, r, stroke: '#ffffff', sw: 2.5, strokeOpacity: 0.8 }, g);
  ring.style.opacity = 0;
  const body = S.g(null, g);
  S.circle({ x, y, r, fill: CH14.BASE, filter: 'url(#shadow)' }, body);
  S.circle({ x, y, r, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.6, sw: 2 }, body);
  S.icon('ph:lock-simple-duotone', { x, y: y - 1, size: Math.round(r * 1.3), color: o.color || 'ink' }, body);
  if (!o.shown) { body.style.opacity = 0; body.style.visibility = 'hidden'; }
  Object.assign(g, { body, ring, x, y, r });
  g.snap = (so = {}) => {
    const tl = gsap.timeline(), d = so.d ?? 0.4;
    tl.fromTo(body, { autoAlpha: 0, scale: 1.8, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: d, ease: 'back.out(2.4)', transformOrigin: '50% 50%' }, 0);
    tl.add(ch14Drive(0.55, k => {
      ring.style.opacity = k > 0 && k < 1 ? 0.9 * (1 - k) : 0;
      ring.setAttribute('r', (r * (1 + 0.9 * k)).toFixed(2));
    }, 'power2.out'), d * 0.75);
    return tl;
  };
  return g;
}

/**
 * ch14Matrix — a weight matrix as a blue-grey tile with its own seeded weight-grid texture (the ch08 look),
 * its name typeset under it (W with a subscript) and an optional grey sub-label under the name. A padlock
 * badge sits on the top-right corner (hidden until .lock(), unless locked: true).
 * o: x, y (centre of the tile), size 220 (or w, h), r 16, seed 1 (a different seed = a different layer's
 *    weights), cols 8, rows 8, name 'K' (subscript; null for none), nameSize 46, nameGap 42 (tile bottom to the
 *    name's centre), sub (grey sub-label, e.g. 'key matrix'), subSize 28, subGap 46 (name to sub-label),
 *    locked false, lockR 28.
 * Returns <g> with .back (an empty group behind the tile: decks, shadows), .tile (the tile itself: bg +
 *    texture; scale or fade it), .bg, .tex, .nameEl, .subEl, .lockEl (ch14Lock), and geometry .cx .cy .w .h
 *    .l .r .t .b .nameY .subY.
 * Helpers: .lock({d}) → the padlock snaps on (ch14Lock.snap).
 */
function ch14Matrix(S, o = {}, parent) {
  const g = S.g(null, parent);
  const w = o.w ?? o.size ?? 220, h = o.h ?? o.size ?? 220, r = o.r ?? 16;
  const cx = o.x ?? 960, cy = o.y ?? 540, x = cx - w / 2, y = cy - h / 2;
  g.back = S.g(null, g);
  const tile = S.g(null, g);
  S.rect({ x, y, w, h, r, fill: CH14.BASE, filter: 'url(#shadow)' }, tile);
  g.bg = S.rect({ x, y, w, h, r, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.26, sw: 2 }, tile);
  // the texture: cols × rows cells in three shades, one <path> per shade (a picture, not text)
  const tex = S.g(null, tile);
  tex.setAttribute('data-audit', 'ignore');
  const cols = o.cols ?? 8, rows = o.rows ?? 8, pad = Math.min(w, h) * 0.1, m = 0.16;
  const cw = (w - 2 * pad) / cols, chh = (h - 2 * pad) / rows, rnd = S.rand(o.seed ?? 1), bk = ['', '', ''];
  const f = v => v.toFixed(2);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const v = rnd(), k = v < 0.5 ? 0 : v < 0.82 ? 1 : 2;
    bk[k] += `M${f(x + pad + j * cw + cw * m)},${f(y + pad + i * chh + chh * m)}h${f(cw * (1 - 2 * m))}v${f(chh * (1 - 2 * m))}h${f(-cw * (1 - 2 * m))}Z`;
  }
  [0.10, 0.24, 0.42].forEach((op, k) => { if (bk[k]) S.path({ d: bk[k], fill: 'struct', fillOpacity: op }, tex); });
  g.tile = tile; g.tex = tex;
  const nameY = y + h + (o.nameGap ?? 42), subY = nameY + (o.subGap ?? 46);
  if (o.name !== null) g.nameEl = ch14W(S, o.name ?? 'K', { x: cx, y: nameY, size: o.nameSize ?? 46 }, g);
  if (o.sub) g.subEl = S.text(o.sub, { x: cx, y: subY, size: o.subSize ?? 28, anchor: 'middle', color: 'muted', weight: 550 }, g);
  const lr = o.lockR ?? 28;
  g.lockEl = ch14Lock(S, { x: x + w - 10, y: y + 10, r: lr, shown: !!o.locked }, g);
  g.lock = lo => g.lockEl.snap(lo);
  Object.assign(g, { cx, cy, w, h, l: x, r: x + w, t: y, b: y + h, x, y, nameY, subY });
  return g;
}

/**
 * ch14Tag — a small grey tag: a dark pill with a faint rim and muted text, optionally with an icon before the
 * text. icon: an icon id, or 'pill' for a miniature token chip (blue). Used for footnotes ('almost every
 * layer'), provenance ('illustrative', 'schematic: …') and the small icon tags of s01.
 * o: x, y (centre y), anchor 'middle' | 'start' | 'end', size 26, h round(size × 1.75), padX 16, icon,
 *    iconSize round(size × 1.15), iconColor 'muted', color 'muted' (text), weight 550, rim 0.2.
 * Returns <g> with .label .iconEl .bg, geometry .w .h .l .r .t .b .cx .cy. Visible as built: enter it with
 *    fx.in / fx.pop and fade it with fx.out / fx.dim.
 */
function ch14Tag(S, text, o = {}, parent) {
  const size = o.size ?? CH14.tag, h = o.h ?? Math.round(size * 1.75), padX = o.padX ?? 16;
  const iconSize = o.iconSize ?? Math.round(size * 1.15), ig = o.icon ? iconSize + 10 : 0;
  const segs = /_\w/.test(text) ? V.subs(text, size) : null;      // 'same W_K': a real subscript, not an underscore
  const tw = segs ? segs.reduce((a, sg) => a + S.measure(sg.t, { size: sg.s || size, weight: o.weight ?? 550 }), 0) : S.measure(text, { size, weight: o.weight ?? 550 });
  const w = padX * 2 + ig + tw;
  const anchor = o.anchor || 'middle';
  const x = anchor === 'middle' ? (o.x ?? 0) - w / 2 : anchor === 'end' ? (o.x ?? 0) - w : (o.x ?? 0);
  const y = (o.y ?? 0) - h / 2;
  const g = S.g(null, parent);
  S.rect({ x, y, w, h, r: h / 2, fill: CH14.BASE, fillOpacity: 0.94 }, g);
  g.bg = S.rect({ x, y, w, h, r: h / 2, fill: 'none', stroke: '#ffffff', strokeOpacity: o.rim ?? 0.2, sw: 1.5 }, g);
  if (o.icon === 'pill') {
    const pw = iconSize, ph = Math.round(iconSize * 0.62), px = x + padX, py = (o.y ?? 0) - ph / 2;
    const ig2 = S.g(null, g);
    S.rect({ x: px, y: py, w: pw, h: ph, r: ph * 0.32, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.9, sw: 2 }, ig2);
    g.iconEl = ig2;
  } else if (o.icon) {
    g.iconEl = S.icon(o.icon, { x: x + padX + iconSize / 2, y: o.y ?? 0, size: iconSize, color: o.iconColor || 'muted' }, g);
  }
  g.label = S.text(segs || text, { x: x + padX + ig, y: (o.y ?? 0) + 1, size, weight: o.weight ?? 550, color: o.color || 'muted' }, g);
  Object.assign(g, { w, h, l: x, r: x + w, t: y, b: y + h, cx: x + w / 2, cy: o.y ?? 0 });
  return g;
}
