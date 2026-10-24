/* Shared builders for chapter 3, "Inside a production request". Loaded before every ch03 scene.
 *
 * The chapter's visual language (use these so a thing looks the same in every scene):
 * - The user's end is a libDevice laptop (or phone); a machine is a libServer; GPUs are libChip with hbm
 *   (amber die, coral stacks); a data centre is libDataCentre. A request is a blue libToken ('your question').
 * - The network is a grey dashed line with a globe at its midpoint ............................ ch03Wire
 * - Different people's requests are blue chips in slightly different shades ................ ch03Shade
 * - Properties of production land as icon tags ('shared', 'always on', 'paid by the hour' in s01;
 *   s04 b4 stamps 'concurrent', 'shared', 'paid for' with the same icons: CH03.icons) ......... ch03Tag
 * - Caveats ('estimates and projections' s03, 'illustrative' s10) land as a grey rubber stamp . ch03Stamp
 * - The tray of eight requests run together (s02 b1, again as squares in s04 b2) ............ ch03Batch
 * - The crowd of conversations (s04; its last frame is s05's first: same options, same field) ch03Crowd
 * - 'model / remembers: nothing', the stateless block (s05 b2, small again in s07 b5) ........ ch03ModelBlock
 * - The plugin box of tools, later tools and skills (s08 b3, s09 b4) ....................... ch03Plugin
 * - The context window drawn to scale (s09, s10): CH03.window (200,000 tokens = 1,600 px from x 160).
 * Colour: blue = requests, tokens, context; amber = arithmetic (GPU dies); coral = memory, the weights;
 * teal = a saving; grey = infrastructure and caveats. Builders return the root <g>; helpers return tweens
 * for S.add and are hidden until they play where noted. Call one element's helpers in time order.
 */

const CH03 = {
  /** the context window to scale (s09, s10): X(tokens) is the x of a token count along the bar */
  window: { x: 160, w: 1600, tokens: 200000, X: t => 160 + t * 1600 / 200000 },
  /** icon ids with a fixed meaning in this chapter */
  icons: {
    you: 'ph:user-duotone',             // stored for you (badge on a server, a row, a pill)
    everyone: 'ph:globe-duotone',       // stored once for everyone (the provider's prompt)
    network: 'ph:globe-hemisphere-west-duotone',
    shared: 'ph:users-three-duotone',   // production: shared by many
    alwaysOn: 'ph:power-duotone',       // production: always on
    hour: 'ph:clock-duotone',           // production: paid by the hour (with coin)
    coin: 'ph:coin-duotone',
    concurrent: 'ph:stack-duotone',     // s04: concurrent
    tool: 'ph:wrench-duotone',
    skill: 'ph:puzzle-piece-duotone',
  },
};

/** A blue for request k: slightly different blues, deterministic (one per person). */
function ch03Shade(S, k, seed = 7) {
  const r = S.rand(((seed * 7919) ^ (k * 104729 + 13)) >>> 0);
  r();
  const hex = c => S.tone(c).replace('#', '');
  const towards = ['9cc6ff', '3f68d4', '8f8dff', '4fc3ff'][(k + Math.floor(r() * 4)) % 4];
  const t = 0.3 + 0.3 * r();
  const a = hex('struct');
  const out = [0, 2, 4].map(i => {
    const p = parseInt(a.slice(i, i + 2), 16), q = parseInt(towards.slice(i, i + 2), 16);
    return Math.round(p + (q - p) * t).toString(16).padStart(2, '0');
  });
  return '#' + out.join('');
}

/**
 * ch03Wire — the network between a user's device and a server: a grey dashed line with a globe on an
 * opaque disc at its midpoint (s01; s07 b3 'a dashed network line runs right from the laptop').
 * o: {x1, y1, x2, y2, globe = true | {x, y} (somewhere else on the line), globeSize = 50, tone = 'muted',
 *     sw = 3, dash = '10 10'}
 * Returns <g> (root, free for fx.in / fx.out / fx.dim) with .line, .globe (or null), .d (the path, for
 *   libToken.travel and S.flow), .mid {x, y}, .len, and helpers:
 *   .drawOn({d = 0.8})  the dashes extend from (x1, y1) to (x2, y2) through a growing mask (so the dash
 *                       pattern survives; fx.draw would remove it); the globe pops as the line reaches it.
 *                       Line and globe are hidden until then.
 *   .pulseGlobe({d = 0.5, scale = 1.25})  the globe swells once (a request passing through the network)
 * The line is marked data-audit="ignore", since chips ride over it.
 */
function ch03Wire(S, o = {}, parent) {
  const g = S.g(null, parent);
  const { x1, y1, x2, y2 } = o;
  const d = `M${x1},${y1} L${x2},${y2}`;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const sw = o.sw ?? 3;
  // a mask whose white stroke is drawn on reveals the dashed line progressively
  const id = `ch03-wire-${ch03Wire.n = (ch03Wire.n || 0) + 1}`;
  const mask = S.el('mask', { id, maskUnits: 'userSpaceOnUse', x: Math.min(x1, x2) - 40, y: Math.min(y1, y2) - 40, width: Math.abs(x2 - x1) + 80, height: Math.abs(y2 - y1) + 80 }, g);
  const reveal = S.path({ d, stroke: '#ffffff', sw: sw + 12, cap: 'butt' }, mask);
  g.line = S.path({ d, stroke: o.tone || 'muted', sw, dash: o.dash || '10 10', cap: 'butt', strokeOpacity: 0.85 }, g);
  g.line.setAttribute('mask', `url(#${id})`);
  g.line.setAttribute('data-audit', 'ignore');
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  g.mid = { x: mx, y: my };
  g.globe = null;
  let gAt = 0.5;
  if (o.globe !== false) {
    const gp = typeof o.globe === 'object' ? o.globe : g.mid;
    gAt = len ? Math.hypot(gp.x - x1, gp.y - y1) / len : 0.5;
    const size = o.globeSize ?? 50;
    g.globe = S.g(null, g);
    const inner = S.g(null, g.globe);
    S.circle({ x: gp.x, y: gp.y, r: size * 0.62, fill: '#0c1326', stroke: o.tone || 'muted', strokeOpacity: 0.35, sw: 2 }, inner);
    S.icon(CH03.icons.network, { x: gp.x, y: gp.y, size, color: o.tone || 'muted' }, inner);
    g.globe.inner = inner;
    Object.assign(g.globe, { cx: gp.x, cy: gp.y });
  }
  Object.assign(g, { d, len, x1, y1, x2, y2 });
  g.drawOn = (dO = {}) => {
    const dd = dO.d ?? 0.8, tl = gsap.timeline();
    tl.fromTo(g.line, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0);
    tl.fromTo(reveal, { drawSVG: '0%' }, { drawSVG: '100%', duration: dd, ease: dO.ease || 'power2.inOut' }, 0);
    if (g.globe) tl.fromTo(g.globe, { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2.2)', transformOrigin: '50% 50%' }, dd * gAt * 0.8);
    return tl;
  };
  g.pulseGlobe = (po = {}) => (g.globe ? gsap.fromTo(g.globe.inner, { scale: 1, transformOrigin: '50% 50%' },
    { scale: po.scale ?? 1.25, duration: (po.d ?? 0.5) / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%', immediateRender: false }) : gsap.timeline());
  return g;
}

/** shared: an outlined pill (or stamp plate) that lands like a rubber stamp */
function ch03__stamped(S, g, body, ring, o) {
  g.stamp = (so = {}) => {
    const d = so.d ?? 0.3, tl = gsap.timeline();
    tl.fromTo(body, { autoAlpha: 0, scale: so.from ?? 1.45, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: d, ease: 'power3.in', transformOrigin: '50% 50%' }, 0);
    tl.fromTo(ring, { autoAlpha: 0, scale: 1, transformOrigin: '50% 50%' }, { autoAlpha: 0.7, scale: 1, duration: 0.01 }, d);
    tl.fromTo(ring, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.18, autoAlpha: 0, duration: 0.45, ease: 'power2.out', transformOrigin: '50% 50%', immediateRender: false }, d + 0.01);
    return tl;
  };
  return g;
}

/**
 * ch03Tag — a property of production as a tag: icon(s) and a word in an outlined pill (s01 b4 'shared',
 * 'always on', 'paid by the hour'; s04 b4 'concurrent', 'shared', 'paid for'). Use CH03.icons.
 * o: {x, y (centre), icons = [] (drawn left of the text), tone = 'neutral' (outline and icon colour; e.g.
 *     'struct' to make one the brightest), size = 30, h = 2 × size, anchor = 'middle' | 'start'}
 * Returns <g> (root, free for fx.dim / fx.out / fx.xform) with .body, .label, .w .h .l .r .t .b .cx .cy, and
 *   .stamp({d = 0.3, from = 1.45})  drops from a larger scale and lands; a ring flashes out. Hidden until then.
 */
function ch03Tag(S, text, o = {}, parent) {
  const size = o.size ?? 30, h = o.h ?? Math.round(size * 2), tone = o.tone || 'neutral';
  const icons = o.icons || [], is = Math.round(size * 1.15), ig = Math.round(size * 0.12);
  const tw = S.measure(text, { size, weight: 650 });
  const iw = icons.length ? icons.length * is + (icons.length - 1) * ig + Math.round(size * 0.4) : 0;
  const padX = Math.round(size * 0.8), w = padX * 2 + iw + tw;
  const x = (o.anchor || 'middle') === 'middle' ? o.x - w / 2 : o.x, y = o.y - h / 2;
  const col = tone === 'neutral' ? 'ink' : tone;
  const g = S.g(null, parent);
  const body = S.g(null, g);
  S.rect({ x, y, w, h, r: h / 2, fill: '#0c1326' }, body);
  S.rect({ x, y, w, h, r: h / 2, fill: `url(#card-${tone})`, stroke: tone === 'neutral' ? '#ffffff' : tone, strokeOpacity: tone === 'neutral' ? 0.45 : 0.85, sw: 2.5 }, body);
  icons.forEach((id, i) => S.icon(id, { x: x + padX + is / 2 + i * (is + ig), y: o.y, size: is, color: tone === 'neutral' ? 'ink' : tone }, body));
  g.label = S.text(text, { x: x + padX + iw, y: o.y + 1, size, weight: 650, color: col === 'ink' ? 'ink' : 'ink' }, body);
  const ring = S.rect({ x, y, w, h, r: h / 2, stroke: tone === 'neutral' ? '#ffffff' : tone, sw: 2 }, g);
  ring.setAttribute('data-audit', 'ignore');
  ring.style.opacity = 0; ring.style.visibility = 'hidden';
  Object.assign(g, { body, w, h, l: x, r: x + w, t: y, b: y + h, cx: x + w / 2, cy: o.y });
  return ch03__stamped(S, g, body, ring, o);
}

/**
 * ch03Stamp — a grey rubber stamp for a caveat: 'estimates and projections' (s03 b4), 'illustrative'
 * (s10 b4). Upper-case, letter-spaced text inside a double outline on an opaque plate, tilted.
 * o: {x, y (centre), size = 28, tone = 'muted', rotate = -6 (degrees)}
 * Returns <g> with .body, .label, .w .h, and .stamp({d = 0.3, from = 1.45}) (hidden until then).
 * The plate hides what is under it, but the audit still compares text boxes: do not land it on other text
 * (or mark what it covers data-audit="ignore" while it is there).
 */
function ch03Stamp(S, text, o = {}, parent) {
  const size = o.size ?? 28, tone = o.tone || 'muted';
  const str = String(text).toUpperCase();
  const tw = S.measure(str, { size, weight: 750, ls: 0.12 });
  const w = tw + size * 1.6, h = size * 2.1, x = o.x - w / 2, y = o.y - h / 2;
  const g = S.g(null, parent);
  const tilt = S.g({ transform: `rotate(${o.rotate ?? -6} ${o.x} ${o.y})` }, g);
  const body = S.g(null, tilt);
  S.rect({ x, y, w, h, r: 8, fill: '#0c1326', fillOpacity: 0.94, stroke: tone, strokeOpacity: 0.9, sw: 3 }, body);
  S.rect({ x: x + 6, y: y + 6, w: w - 12, h: h - 12, r: 5, stroke: tone, strokeOpacity: 0.55, sw: 1.5 }, body);
  g.label = S.text(str, { x: o.x, y: o.y + 1, size, weight: 750, color: tone, anchor: 'middle', ls: 0.12 }, body);
  const ring = S.rect({ x, y, w, h, r: 8, stroke: tone, sw: 2 }, tilt);
  ring.setAttribute('data-audit', 'ignore');
  ring.style.opacity = 0; ring.style.visibility = 'hidden';
  Object.assign(g, { body, w, h, cx: o.x, cy: o.y });
  return ch03__stamped(S, g, body, ring, o);
}

/**
 * ch03Batch — the batch: requests from eight different people (eight blues, ch03Shade) sitting in one tray,
 * to run together (s02 b1 'batch', as pills; s04 b2 'the same eight-pill tray', as squares).
 * o: {x, y (centre of the tray), n = 8, shape = 'pill' | 'square', h = 34 (chip height), gap = 10, pad = 12,
 *     label = 'batch' (above the tray's left end; null for none), labelSize = 26, seed = 7}
 * Returns <g> (root) with .tray (outline rect), .labelEl, .chips[] (libToken; visible as built: fly them in
 *   with chip.flyIn([x, y]) or chip.pop(), or fx.in the root), .slot(i) → {x, y} (chip centre),
 *   .w .h .l .r .t .b .cx .cy.
 */
function ch03Batch(S, o = {}, parent) {
  const n = o.n ?? 8, h = o.h ?? 34, gap = o.gap ?? 10, pad = o.pad ?? 12;
  const cw = (o.shape || 'pill') === 'square' ? h : Math.round(h * 1.7);
  const inner = n * cw + (n - 1) * gap, W = inner + 2 * pad, H = h + 2 * pad;
  const x = o.x - W / 2, y = o.y - H / 2;
  const g = S.g(null, parent);
  S.rect({ x, y, w: W, h: H, r: Math.min(18, H / 2), fill: '#0c1326' }, g);
  g.tray = S.rect({ x, y, w: W, h: H, r: Math.min(18, H / 2), fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.3, sw: 2 }, g);
  if (o.label !== null) g.labelEl = S.text(o.label ?? 'batch', { x: x + 4, y: y - (o.labelSize ?? 26) * 0.85, size: o.labelSize ?? 26, weight: 600, color: 'muted' }, g);
  g.slot = i => ({ x: x + pad + i * (cw + gap) + cw / 2, y: o.y });
  g.chips = Array.from({ length: n }, (_, i) => libToken(S, { text: '', x: g.slot(i).x, y: o.y, w: cw, h, r: Math.round(h * 0.3), state: { color: ch03Shade(S, i, o.seed ?? 7) }, decorative: true }, g));
  Object.assign(g, { w: W, h: H, l: x, r: x + W, t: y, b: y + H, cx: o.x, cy: o.y });
  return g;
}

/**
 * ch03Crowd — the crowd: many conversations as small blue squares scattered over a field at seeded
 * positions, in different blues. s04 builds and animates it; s04's last frame and s05's first frame show the
 * same field, frozen and dimmed: build it with the same options in both and the squares match exactly.
 * o: {x = 120, y = 210, w = 1680, h = 430 (the field), n = 48, size = 26, seed = 3,
 *     edge = 14 (fainter squares straddling the field's left and right edges: 'more implied')}
 * Returns <g> with .squares[] (libToken chips; each has .cx .cy and its own .moveTo / .travel / .pop),
 *   .edge[] (the faint ones, inside a group at opacity 0.35), .all (both).
 */
function ch03Crowd(S, o = {}, parent) {
  const X = o.x ?? 120, Y = o.y ?? 210, W = o.w ?? 1680, H = o.h ?? 430, n = o.n ?? 48, sz = o.size ?? 26;
  const r = S.rand(o.seed ?? 3);
  const cols = Math.max(1, Math.round(Math.sqrt(n * W / H))), rows = Math.ceil(n / cols);
  const cw = W / cols, chh = H / rows, jx = Math.max(0, cw - sz * 1.6) / 2, jy = Math.max(0, chh - sz * 1.6) / 2;
  const g = S.g(null, parent);
  const mk = (cx, cy, k, p) => libToken(S, { text: '', x: cx, y: cy, w: sz, h: sz, r: Math.round(sz * 0.24), state: { color: ch03Shade(S, k, (o.seed ?? 3) + 11) }, decorative: true }, p);
  g.squares = [];
  for (let k = 0; k < n; k++) {
    const c = k % cols, rI = Math.floor(k / cols);
    g.squares.push(mk(X + (c + 0.5) * cw + (r() * 2 - 1) * jx, Y + (rI + 0.5) * chh + (r() * 2 - 1) * jy, k, g));
  }
  const eg = S.g({ opacity: 0.35 }, g);
  g.edge = [];
  const ne = o.edge ?? 14;
  for (let k = 0; k < ne; k++) {
    const left = k % 2 === 0, rI = Math.floor(k / 2) % Math.max(1, rows + 1);
    const cx = left ? X - cw * (0.15 + 0.5 * r()) : X + W + cw * (0.15 + 0.5 * r());
    g.edge.push(mk(cx, Y + (rI + r()) * H / (rows + 1), n + k, eg));
  }
  g.all = g.squares.concat(g.edge);
  return g;
}

/**
 * ch03ModelBlock — 'the model remembers nothing between requests': a coral block 'model' (the weights)
 * with a dashed box beside it headed 'remembers:' (s05 b2, large, upper right; s07 b5, small, far right).
 * o: {x, y (top-left), h = 150, blockW = 1.25 × h, boxW = auto (fits the heading), gap = 18, size = 30,
 *     empty = false (true: the box already reads 'nothing', as in s07)}
 * Returns <g> with .block (libMemBlock), .box (dashed rect), .headEl ('remembers:'), .memory (faint lines
 *   inside the box: what a viewer might expect it to keep), .nothingEl ('nothing'), anchors
 *   .l .r .t .b .w .h .cx .cy, and
 *   .forget({d = 0.8})  the faint lines drop out of the box and fade, then 'nothing' appears.
 */
function ch03ModelBlock(S, o = {}, parent) {
  const h = o.h ?? 150, bw = o.blockW ?? Math.round(h * 1.25), gap = o.gap ?? 18, size = o.size ?? 30;
  const hs = Math.max(24, Math.round(size * 0.86));
  const boxW = o.boxW ?? Math.round(S.measure('remembers:', { size: hs, weight: 550 }) + hs * 1.4);
  const x = o.x, y = o.y;
  const g = S.g(null, parent);
  g.block = libMemBlock(S, { x, y, w: bw, h, label: 'model', family: 'sans', size, tone: 'bytes', style: 'solid' }, g);
  const bx = x + bw + gap;
  g.box = S.rect({ x: bx, y, w: boxW, h, r: 14, fill: '#0c1326', fillOpacity: 0.6, stroke: 'muted', strokeOpacity: 0.7, sw: 2, dash: '8 7' }, g);
  g.headEl = S.text('remembers:', { x: bx + boxW / 2, y: y + hs * 1.05, size: hs, weight: 550, color: 'muted', anchor: 'middle' }, g);
  const mTop = y + hs * 2.1, mH = h - hs * 2.1 - hs * 0.6;
  g.memory = S.g(null, g);
  g.memory.setAttribute('data-audit', 'ignore');
  const lines = [0.72, 0.55, 0.66];
  lines.forEach((f, i) => S.rect({ x: bx + hs * 0.7, y: mTop + i * mH / 3 + mH / 6 - 4, w: (boxW - hs * 1.4) * f, h: 8, r: 4, fill: '#ffffff', fillOpacity: 0.28 }, g.memory));
  g.nothingEl = S.text('nothing', { x: bx + boxW / 2, y: mTop + mH / 2, size: hs, weight: 650, color: 'ink', anchor: 'middle' }, g);
  if (o.empty) g.memory.style.opacity = 0; else { g.nothingEl.style.opacity = 0; g.nothingEl.style.visibility = 'hidden'; }
  g.forget = (fo = {}) => {
    const d = fo.d ?? 0.8, tl = gsap.timeline();
    tl.fromTo(g.memory, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: 26, duration: d * 0.55, ease: 'power2.in' }, 0);
    tl.fromTo(g.nothingEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.45, ease: 'power2.out' }, d * 0.55);
    return tl;
  };
  const W = bw + gap + boxW;
  Object.assign(g, { l: x, r: x + W, t: y, b: y + h, w: W, h, cx: x + W / 2, cy: y + h / 2 });
  return g;
}

/**
 * ch03Plugin — a plugin: one labelled box holding tool chips (wrench) and, from s09, skill chips (puzzle
 * piece). s08 b3 builds it with tools only; s09 b4 brings it back with skills joining (build it with the
 * final count and hide / pop the skill chips yourself).
 * o: {x, y (centre), tools = 3, skills = 0, chipH = 52, gap = 12, pad = 18, label = 'plugin', size = 28}
 * Returns <g> with .box, .labelEl (inside the box, top-left), .tools[], .skills[], .chips (libToken icon
 *   chips), anchors .l .r .t .b .w .h .cx .cy.
 */
function ch03Plugin(S, o = {}, parent) {
  const nt = o.tools ?? 3, ns = o.skills ?? 0, ch = o.chipH ?? 52, gap = o.gap ?? 12, pad = o.pad ?? 18, size = o.size ?? 28;
  const cw = Math.round(ch * 1.35), n = nt + ns;
  const lh = size * 1.6;
  const W = Math.max(n * cw + (n - 1) * gap, S.measure(o.label ?? 'plugin', { size, weight: 650 })) + 2 * pad, H = lh + ch + 2 * pad;
  const x = o.x - W / 2, y = o.y - H / 2;
  const g = S.g(null, parent);
  S.rect({ x, y, w: W, h: H, r: 18, fill: '#0c1326' }, g);
  g.box = S.rect({ x, y, w: W, h: H, r: 18, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.32, sw: 2 }, g);
  g.labelEl = S.text(o.label ?? 'plugin', { x: x + pad, y: y + pad + lh * 0.42, size, weight: 650, color: 'ink' }, g);
  const cy = y + pad + lh + ch / 2;
  const chip = (i, icon, state) => libToken(S, { text: '', icon, x: x + pad + i * (cw + gap) + cw / 2, y: cy, w: cw, h: ch, size: Math.round(ch * 0.62), state }, g);
  g.tools = Array.from({ length: nt }, (_, i) => chip(i, CH03.icons.tool, 'token'));
  g.skills = Array.from({ length: ns }, (_, i) => chip(nt + i, CH03.icons.skill, 'token'));
  g.chips = g.tools.concat(g.skills);
  Object.assign(g, { l: x, r: x + W, t: y, b: y + H, w: W, h: H, cx: o.x, cy: o.y });
  return g;
}
