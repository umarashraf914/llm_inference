/* Shared builders for chapter 8, "Layers, attention, and the parameter count". Loaded before every ch08
   scene; read-only for scene authors.

   Visual language for the chapter (keep it in every scene):
   - The running example is the five tokens 'the cat sat down it' (CH08.tokens), drawn as libToken pills.
   - A token's vector is a tall thin shaded strip with no digits (ch08Vec): blue cells for positive values,
     violet for negative. Its pattern is fixed by the token with the same hash ch07 uses, so 'cat' looks the
     same here as in chapter 7. Plain input strips use gain CH08.IN_GAIN; a vector a layer has worked on is
     'richer': a new pattern (ch08Vec {round: k}) and a higher gain (CH08.gain(k)).
   - ch08Column: a token pill with its strip standing on it (s01, s03, s12).
   - The stack of 80 layers is ch08Tower (libLayerStack, flat view, blue, each slab with its own faint
     weight-grid texture). s01 ends on it centred at x 1000, base y 880, 365 wide, 620 tall (top 260); while
     four or fewer slabs show they are 30 thick and 104 apart. Pick up from there in later scenes.
   - Weight matrices are blue-grey tiles, each with its own seeded grid texture (ch08WeightTile); their names
     are typeset as W with a subscript (ch08W): W_Q, W_K, W_V, W_O.
   - Colour = meaning: blue = vectors, tokens, layers; amber = arithmetic (a layer working, a score, a
     multiply); coral = weights read from memory; teal = the cache, a saving; grey = notes and tags.
   - Seek-safe fades: ch08Fade writes opacity from tween progress, so an element faded more than once shows
     the same frame however the playhead reaches it. */

const CH08 = {
  tokens: ['the', 'cat', 'sat', 'down', 'it'],
  WIDTH: 8192,          // residual width: numbers per token vector
  LAYERS: 80,
  HEADS: 64, KV_HEADS: 8, HEAD_DIM: 128, KV_WIDTH: 1024,
  FFN: 28672,           // feed-forward width (3.5 × 8,192)
  VOCAB: 128256,
  IN_GAIN: 0.75,        // a plain input strip
  /** strip contrast after k layers (k = 0: the input, 0.75; one layer: 1.5; then +0.3 a layer, up to 2.6) */
  gain: k => (k <= 0 ? 0.75 : Math.min(2.6, 1.5 + 0.3 * (k - 1))),
};

/** A stable seed for a token (a word, or a token ID): the same hash as ch07Seed, so strips match chapter 7. */
function ch08Seed(token) {
  if (typeof token === 'number') return (Math.imul(token + 1, 2654435761) >>> 0) || 1;
  const key = String(token).trim().toLowerCase();
  let h = 2166136261;
  for (const ch of key) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) || 1;
}

/** A proxy tween calling apply(eased progress 0..1) over d s; seek-safe in both directions. */
function ch08Drive(d, apply, ease) {
  const p = { v: 0 }, e = gsap.parseEase(ease || 'none');
  const go = () => apply(e(p.v));
  return gsap.fromTo(p, { v: 0 }, {
    v: 1, duration: Math.max(0.001, d), ease: 'none', immediateRender: false,
    onStart: go, onUpdate: go, onReverseComplete: () => apply(0),
  });
}

/** Hide elements at build time (to be revealed by ch08Fade). */
function ch08Hide(els) {
  (Array.isArray(els) ? els : [els]).filter(Boolean).forEach(e => { e.style.opacity = 0; e.style.visibility = 'hidden'; });
}

/**
 * Fade elements from opacity a to b, written from the tween's progress (hidden at 0).
 * o: {d 0.5, ease 'power2.out', stagger 0}. Returns a timeline.
 */
function ch08Fade(els, a, b, o = {}) {
  const list = (Array.isArray(els) ? els : [els]).filter(Boolean);
  const tl = gsap.timeline();
  list.forEach((e, i) => tl.add(ch08Drive(o.d ?? 0.5, k => {
    const v = a + (b - a) * k;
    e.style.opacity = v;
    e.style.visibility = v > 0.001 ? 'inherit' : 'hidden';
  }, o.ease || 'power2.out'), i * (o.stagger ?? 0)));
  return tl;
}

/** data-audit="ignore" on els while this tween runs (d s): text shrinking in a camera move. Seek-safe. */
function ch08Ignore(els, d) {
  const list = (Array.isArray(els) ? els : [els]).filter(Boolean);
  return ch08Drive(d, p => list.forEach(e => (p > 0 && p < 1 ? e.setAttribute('data-audit', 'ignore') : e.removeAttribute('data-audit'))));
}

/**
 * A token's vector as a tall thin shaded strip (libVector style 'heat', a column by default).
 * o: token (word or ID: fixes the pattern), round 0 (layers it has been through: round k > 0 gives a new,
 *    richer pattern, CH08.gain(k)), and any libVector option (x, y centre, anchor, dir, n 8, cw 38, ch 13,
 *    gap 2.5, gain, seed, hidden ...). Returns the libVector (.pop .in .flash .sweep .reshade ...).
 */
function ch08Vec(S, o = {}, parent) {
  const k = o.round ?? 0;
  const seed = o.seed ?? ((ch08Seed(o.token ?? 0) + 7919 * k) >>> 0);
  return libVector(S, { style: 'heat', dir: 'col', n: 8, cw: 38, ch: 13, gap: 2.5, gain: CH08.gain(k), ...o, seed }, parent);
}

/** Height of a ch08Vec column strip with n cells of ch px and gap px between them. */
function ch08VecH(n = 8, ch = 13, gap = 2.5) { return n * ch + (n - 1) * gap; }

/**
 * A token column: the token's pill with its vector strip standing on it, 8 px above.
 * o: token, x (centre), y (centre of the pill), size 28 (pill text), barGap 8, hidden false, and ch08Vec
 *    options for the strip (n, cw, ch, gap, round, gain).
 * Returns <g> with .pill (libToken), .bar (a holder <g> around the strip: move or fade it on its own),
 *    .vec (the ch08Vec), and geometry .x .barT .barB .barL .barR .pillT .pillB.
 */
function ch08Column(S, o = {}, parent) {
  const g = S.g(null, parent);
  const size = o.size ?? 28, ph = Math.round(size * 1.85);
  const n = o.n ?? 8, ch = o.ch ?? 13, gap = o.gap ?? 2.5, cw = o.cw ?? 38;
  const H = ch08VecH(n, ch, gap);
  const x = o.x ?? 960, py = o.y ?? 860;
  const barB = py - ph / 2 - (o.barGap ?? 8), barT = barB - H;
  g.bar = S.g(null, g);
  g.vec = ch08Vec(S, { token: o.token, round: o.round, gain: o.gain, n, ch, gap, cw, x, y: barT + H / 2, hidden: o.hidden }, g.bar);
  g.pill = libToken(S, { text: o.token, x, y: py, size, hidden: o.hidden }, g);
  Object.assign(g, { x, barT, barB, barL: x - cw / 2, barR: x + cw / 2, pillT: py - ph / 2, pillB: py + ph / 2, token: o.token });
  return g;
}

/**
 * A faint weight-grid texture: cols × rows small cells in three shades, seeded (the same seed gives the
 * same texture), one <path> per shade so it stays cheap. Marked data-audit="ignore" (it is a picture).
 * o: x, y, w, h (the area), cols 12, rows 3, seed 1, tone 'struct', ops [0.10, 0.24, 0.42] (the three
 *    shades), m 0.16 (gap round each cell, as a fraction of the cell).
 * Returns <g> with .reseed(seed, {d 0.5}): a timeline cross-fading to a new texture (seek-safe; call in
 *    time order, each call adds one more layer built at build time).
 */
function ch08Texture(S, o = {}, parent) {
  const g = S.g(null, parent);
  g.setAttribute('data-audit', 'ignore');
  const cols = o.cols ?? 12, rows = o.rows ?? 3, ops = o.ops || [0.10, 0.24, 0.42], m = o.m ?? 0.16;
  const cw = o.w / cols, chh = o.h / rows;
  const f = v => v.toFixed(2);
  const layer = seed => {
    const rnd = S.rand(seed), bk = ['', '', ''];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const v = rnd(), k = v < 0.5 ? 0 : v < 0.82 ? 1 : 2;
      const x = o.x + c * cw + cw * m, y = o.y + r * chh + chh * m;
      bk[k] += `M${f(x)},${f(y)}h${f(cw * (1 - 2 * m))}v${f(chh * (1 - 2 * m))}h${f(-cw * (1 - 2 * m))}Z`;
    }
    const lg = S.g(null, g);
    bk.forEach((d, k) => { if (d) S.path({ d, fill: o.tone || 'struct', fillOpacity: ops[k] }, lg); });
    return lg;
  };
  let cur = layer(o.seed ?? 1);
  g.reseed = (seed, ro = {}) => {
    const prev = cur, next = layer(seed);
    ch08Hide(next);
    cur = next;
    const tl = gsap.timeline();
    tl.add(ch08Fade(next, 0, 1, { d: ro.d ?? 0.5, ease: 'power1.inOut' }), 0);
    tl.add(ch08Fade(prev, 1, 0, { d: ro.d ?? 0.5, ease: 'power1.inOut' }), 0);
    return tl;
  };
  return g;
}

/**
 * A matrix name typeset as W with a subscript: ch08W(S, 'Q', {x, y, size 40, color 'ink', anchor}).
 * The subscript is 0.68 × size (keep size ≥ 36 so it stays ≥ 24 px). Returns the <text>.
 */
function ch08W(S, sub, o = {}, parent) {
  const size = o.size ?? 40;
  const t = S.text('W', { anchor: 'middle', weight: 650, color: 'ink', ...o, size }, parent);
  const ts = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
  ts.textContent = sub;
  ts.setAttribute('font-size', Math.round(size * 0.68));
  ts.setAttribute('dy', (size * 0.26).toFixed(1));
  t.appendChild(ts);
  t.__plain = 'W' + sub;
  return t;
}

/**
 * A weight-matrix tile: a blue-grey rounded tile carrying its own seeded weight-grid texture, with an
 * optional W-subscript name. Tiles with different seeds look different (every layer's own weights).
 * o: x, y (top-left), w 150, h 150, r 14, seed 1, tone 'neutral' (tile) / texTone 'struct' (texture),
 *    cols 8, rows 8, name (subscript letter, e.g. 'Q'), namePos 'below' | 'inside' | 'above', nameSize 40.
 * Returns <g> with .bg .tex (ch08Texture: .reseed) .nameEl, geometry .x .y .w .h .cx .cy .l .r .t .b.
 */
function ch08WeightTile(S, o = {}, parent) {
  const g = S.g(null, parent);
  const x = o.x ?? 0, y = o.y ?? 0, w = o.w ?? 150, h = o.h ?? 150, r = o.r ?? 14, tone = o.tone || 'neutral';
  S.rect({ x, y, w, h, r, fill: '#0c1326' }, g);
  g.bg = S.rect({ x, y, w, h, r, fill: `url(#card-${tone})`, stroke: tone === 'neutral' ? '#ffffff' : tone, strokeOpacity: tone === 'neutral' ? 0.22 : 0.6, sw: 2 }, g);
  const pad = Math.min(w, h) * 0.1;
  g.tex = ch08Texture(S, { x: x + pad, y: y + pad, w: w - 2 * pad, h: h - 2 * pad, cols: o.cols ?? 8, rows: o.rows ?? 8, seed: o.seed ?? 1, tone: o.texTone || 'struct' }, g);
  if (o.name) {
    const ns = o.nameSize ?? 40, pos = o.namePos || 'below';
    const ny = pos === 'inside' ? y + h / 2 : pos === 'above' ? y - ns * 0.75 : y + h + ns * 0.8;
    g.nameEl = ch08W(S, o.name, { x: x + w / 2, y: ny, size: ns }, g);
  }
  Object.assign(g, { x, y, w, h, cx: x + w / 2, cy: y + h / 2, l: x, r: x + w, t: y, b: y + h });
  return g;
}

/**
 * The model's stack of 80 layers in the chapter's look: libLayerStack, flat, blue, each slab with its own
 * faint weight-grid texture. Defaults place it as s01 ends: centre x 1000, base y 880, 365 wide, 620 tall;
 * with four or fewer slabs shown they are 30 thick and 104 apart (80 shown: about 4.4 thick, 7.8 apart).
 * Any libLayerStack option overrides (x, y, w, h, shown, hidden, numbers, label, seed ...).
 * Returns the libLayerStack (.build .grow .pass .climb .paint .highlight .open .shimmer .bracket, .slabs[],
 * .front, .geom() .slabY(L) .top()).
 */
function ch08Tower(S, o = {}, parent) {
  return libLayerStack(S, { view: 'flat', n: CH08.LAYERS, x: 1000, y: 880, w: 365, h: 620, thick: 30, maxPitch: 104, texture: true, tone: 'struct', seed: 8, ...o }, parent);
}
