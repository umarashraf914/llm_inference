/* Shared builders for chapter 16, "Warm, cold, and what survives". Loaded before every ch16 scene.
   Seek-safe in the libKit way: each builder takes a plan of states up front and paints them per frame.

   The chapter's visual language (as briefed for s01 and kept by every scene)
   - Keys and values: small coral per-token tiles, a stacked pair K over V (ch15's tiles). A BLOCK is a
     rounded coral frame holding four of them (ch16Block).
   - teal = already held, a cache hit (fill on bars and pills; outline and glow on blocks and tiles);
     amber = must be prefilled; blue = arriving or not yet decided; coral = the GPU's memory and the blocks
     in it; grey dashed = nothing held, or evicted; solid grey = other people's blocks.
   - The case layout (s02-s05, s08): 'arriving' over 'in the cache', aligned token for token; cells are
     ch16Cell (segments and pills alike); a result plate (ch16Plate); a scoreboard at top right (ch16Score). */

const CH16 = { BASE: '#0c1326', GREY: '#2b3347', GREYS: '#5d6884', DASH: '#8b95ad', K: '#ff7a85', V: '#9b3a44' };

/** States a cell can show; each is a tint over an opaque base (the 'dash' state hides the base). */
const CH16_TINT = {
  blue: { fill: '#1d3566', stroke: 'struct', strokeOpacity: 0.85, sw: 2 },
  teal: { fill: 'url(#card-helps)', stroke: 'helps', sw: 2.5 },
  amber: { fill: 'url(#card-compute)', stroke: 'compute', sw: 2.5 },
  grey: { fill: CH16.GREY, stroke: CH16.GREYS, sw: 2 },
  dash: { stroke: CH16.DASH, strokeOpacity: 0.8, sw: 2, dash: '7 6' },
};

/** Per-frame opacities for a plan [[t, state, d], ...]: the newest state ramps in over d, the one before fades out. */
function ch16PlanOp(plan, t, cl) {
  let i = 0;
  while (i + 1 < plan.length && t >= plan[i + 1][0]) i++;
  const [t0, s0, d0 = 0.35] = plan[i];
  const prev = i > 0 ? plan[i - 1][1] : s0;
  if (prev === s0) return { [s0]: 1 };
  const k = cl((t - t0) / d0);
  return { [s0]: k, [prev]: 1 - k };
}

/** Diagonal hatching lines clipped to a rect (x, y, w, h), spacing sp: a path d string. */
function ch16Hatch(x, y, w, h, sp = 12) {
  let d = '';
  for (let c = sp / 2; c < w + h; c += sp) {
    // the line x' - x + (y' - y) = c, clipped to the rect
    const xa = x + Math.max(0, c - h), ya = y + Math.min(h, c), xb = x + Math.min(w, c), yb = y + Math.max(0, c - w);
    d += `M${xa.toFixed(1)},${ya.toFixed(1)}L${xb.toFixed(1)},${yb.toFixed(1)}`;
  }
  return d;
}

/**
 * ch16Cell — a token segment or pill: an opaque base, one tint per state, an optional hatch layer and a label.
 * o: {x (left), y (centre), w, h = 56, r = 14, label, size = 26, labelTone = 'ink',
 *     plan: [[t, state, d?], ...] (first entry is the start state; states blue | teal | amber | grey | dash),
 *     hatch: [[t, on (0|1), d?], ...] teal hatching over the cell (s02: 'probably cached by someone else')}
 * Returns <g> with .l .r .cx .cy .w .h .lab, and .check(at) (a teal check at the top right, returns the <g>).
 */
function ch16Cell(S, o, parent) {
  const K = libKit(S);
  const h = o.h ?? 56, r = o.r ?? 14, x = o.x, y = o.y - h / 2, w = o.w;
  const g = S.g(null, parent);
  const base = S.rect({ x, y, w, h, r, fill: CH16.BASE }, g);
  const tints = {};
  const plan = o.plan || [[0, 'blue']];
  const used = new Set(plan.map(p => p[1]));
  for (const st of ['blue', 'grey', 'amber', 'teal', 'dash']) {
    if (!used.has(st)) continue;
    tints[st] = S.rect({ x, y, w, h, r, ...CH16_TINT[st] }, g);
  }
  let hatchEl = null;
  if (o.hatch) {
    hatchEl = S.path({ d: ch16Hatch(x + 3, y + 3, w - 6, h - 6, 12), stroke: 'helps', strokeOpacity: 0.75, sw: 3, cap: 'butt' }, g);
    hatchEl.setAttribute('data-audit', 'ignore');
  }
  if (o.label != null) g.lab = S.text(o.label, { x: x + w / 2, y: o.y + 1, size: o.size ?? 26, weight: 650, anchor: 'middle', color: o.labelTone || 'ink', family: o.mono ? 'mono' : undefined }, g);
  K.whole(t => {
    const op = ch16PlanOp(plan, t, K.cl);
    for (const st in tints) K.setO(tints[st], op[st] || 0);
    K.setO(base, 1 - (op.dash || 0));
    if (hatchEl) K.setO(hatchEl, ch16PlanOp(o.hatch.map(([tt, on, d]) => [tt, on ? 'on' : 'off', d]), t, K.cl).on || 0);
  });
  Object.assign(g, { l: x, r: x + w, cx: x + w / 2, cy: o.y, w, h, t: y, b: y + h });
  g.check = (at, parentG) => {
    const c = S.g(null, parentG || g);
    S.circle({ x: x + w - 2, y: y + 2, r: 11, fill: 'helps' }, c);
    S.path({ d: `M${x + w - 8},${y + 2} L${x + w - 4},${y + 7} L${x + w + 4},${y - 3}`, stroke: '#0a0f1e', sw: 2.5 }, c);
    c.setAttribute('data-audit', 'ignore');
    K.hide(c);
    K.fade(c, 0, 1, at, 0.25);
    return c;
  };
  return g;
}

/** A K/V tile: K (light coral) stacked over V (dark coral), w × h, centred at (x, y). Returns <g>. */
function ch16KV(S, x, y, w = 12, h = 30, parent) {
  const g = S.g(null, parent);
  S.rect({ x: x - w / 2, y: y - h / 2, w, h: h / 2 - 1, r: 2, fill: CH16.K }, g);
  S.rect({ x: x - w / 2, y: y + 1, w, h: h / 2 - 1, r: 2, fill: CH16.V }, g);
  return g;
}

/**
 * ch16Block — a block: a rounded coral frame holding four K/V tiles. Placed by its centre.
 * o: {x, y, w = 64, h = 46, plan: [[t, state, d?], ...] with states
 *     'coral' (frame and tiles), 'held' (+ teal outline and glow), 'grey' (solid grey, someone else's, with
 *     a tiny user icon), 'dash' (grey dashed outline only: evicted / nothing held), 'empty' (nothing drawn)}
 * Returns <g> with .cx .cy .w .h (move it with a transform on a holder, not on the block itself).
 */
function ch16Block(S, o, parent) {
  const K = libKit(S);
  const w = o.w ?? 64, h = o.h ?? 46, cx = o.x, cy = o.y, x = cx - w / 2, y = cy - h / 2;
  const g = S.g(null, parent);
  g.setAttribute('data-audit', 'ignore');
  const glow = S.rect({ x: x - 12, y: y - 12, w: w + 24, h: h + 24, r: 18, fill: 'url(#pglow-helps)', opacity: 0 }, g);
  const coral = S.g(null, g);
  S.rect({ x, y, w, h, r: 9, fill: '#1a0f14', stroke: 'bytes', sw: 2 }, coral);
  const tw = (w - 16) / 4 - 2;
  for (let i = 0; i < 4; i++) ch16KV(S, x + 8 + tw / 2 + i * (tw + 2.67), cy, tw, h - 14, coral);
  const held = S.rect({ x: x - 3, y: y - 3, w: w + 6, h: h + 6, r: 11, stroke: 'helps', sw: 3 }, g);
  const grey = S.g(null, g);
  S.rect({ x, y, w, h, r: 9, fill: CH16.GREY, stroke: CH16.GREYS, sw: 2 }, grey);
  S.icon('ph:user-duotone', { x: cx, y: cy, size: Math.min(28, h - 14), color: 'muted' }, grey);
  const dash = S.rect({ x, y, w, h, r: 9, stroke: CH16.DASH, strokeOpacity: 0.85, sw: 2, dash: '6 5' }, g);
  const plan = o.plan || [[0, 'coral']];
  K.whole(t => {
    const op = ch16PlanOp(plan, t, K.cl);
    const c = (op.coral || 0) + (op.held || 0);
    K.setO(coral, Math.min(1, c));
    K.setO(held, op.held || 0);
    glow.setAttribute('opacity', (0.7 * (op.held || 0)).toFixed(3));
    K.setO(grey, op.grey || 0);
    K.setO(dash, op.dash || 0);
  });
  Object.assign(g, { cx, cy, w, h });
  return g;
}

/**
 * ch16Plate — the result plate under the rows: 'hit 784 · prefill 4 tokens', hit teal, prefill amber.
 * o: {x (centre), y (centre), hit, pre, size = 30}. Returns <g> (visible as built: rise it in).
 */
function ch16Plate(S, o, parent) {
  const size = o.size ?? 30;
  const a = `hit ${o.hit}`, b = '·', c = `prefill ${o.pre}`;
  const gap = size * 0.45;  // SVG drops leading spaces, so the dot's spacing is measured in
  const wa = S.measure(a, { size, weight: 800 }) + gap, wb = S.measure(b, { size, weight: 800 }) + gap, wc = S.measure(c, { size, weight: 800 });
  const tw = wa + wb + wc, W = tw + 64, H = size * 2.2;
  const g = S.g(null, parent);
  S.rect({ x: o.x - W / 2, y: o.y - H / 2, w: W, h: H, r: 16, fill: CH16.BASE, stroke: '#ffffff', strokeOpacity: 0.35, sw: 2 }, g);
  const x0 = o.x - tw / 2;
  S.text(a, { x: x0, y: o.y + 1, size, weight: 800, color: 'helps' }, g);
  S.text(b, { x: x0 + wa, y: o.y + 1, size, weight: 800, color: 'muted' }, g);
  S.text(c, { x: x0 + wa + wb, y: o.y + 1, size, weight: 800, color: 'compute' }, g);
  Object.assign(g, { l: o.x - W / 2, r: o.x + W / 2, t: o.y - H / 2, b: o.y + H / 2, w: W, h: H });
  return g;
}

/**
 * ch16Score — the scoreboard at top right: columns 'case', 'hit', 'prefill', one row per case.
 * o: {x (right edge) = 1870, y (top) = 40, rows: [{case, hit, pre, at (null: present from the start)}],
 *     glow: [{row, col ('hit' | 'pre'), at}]}. Rows rise in at their time. Returns <g> with .rowEls[] .t .b .l .r
 */
function ch16Score(S, o, parent) {
  const K = libKit(S);
  const right = o.x ?? 1870, top = o.y ?? 40, RH = 36, W = 400;
  const cols = [right - W + 20, right - 150, right - 24];  // case (start), hit (end), prefill (end)
  const g = S.g(null, parent);
  const n = o.rows.length;
  const frame = S.rect({ x: right - W, y: top, w: W, h: 44 + RH * Math.max(1, n) + 8, r: 14, fill: CH16.BASE, fillOpacity: 0.92, stroke: '#ffffff', strokeOpacity: 0.18, sw: 1.5 }, g);
  // the frame grows with the rows it holds
  K.whole(t => { const shown = o.rows.filter(rw => rw.at == null || t > rw.at).length; frame.setAttribute('height', String(50 + RH * shown + (shown ? 6 : 0))); });
  S.text('case', { x: cols[0], y: top + 24, size: 22, weight: 700, color: 'muted' }, g);
  S.text('hit', { x: cols[1], y: top + 24, size: 22, weight: 700, anchor: 'end', color: 'helps' }, g);
  S.text('prefill', { x: cols[2], y: top + 24, size: 22, weight: 700, anchor: 'end', color: 'compute' }, g);
  S.line({ x1: right - W + 14, y1: top + 42, x2: right - 14, y2: top + 42, stroke: '#ffffff', strokeOpacity: 0.15, sw: 1.5 }, g);
  g.cells = [];
  g.rowEls = o.rows.map((rw, i) => {
    const rg = S.g(null, g), yy = top + 44 + RH * i + RH / 2 + 2;
    S.text(rw.case, { x: cols[0], y: yy, size: 24, weight: 650, color: 'ink' }, rg);
    const hc = S.text(String(rw.hit), { x: cols[1], y: yy, size: 24, weight: 750, anchor: 'end', color: 'helps', family: 'mono' }, rg);
    const pc = S.text(String(rw.pre), { x: cols[2], y: yy, size: 24, weight: 750, anchor: 'end', color: 'compute', family: 'mono' }, rg);
    g.cells.push({ hit: hc, pre: pc, y: yy });
    if (rw.at != null) {
      K.hide(rg);
      S.add(K.drive(0.4, k => { K.setO(rg, k); rg.setAttribute('transform', `translate(${(14 * (1 - K.E('power3.out')(k))).toFixed(1)},0)`); }), rw.at);
    }
    return rg;
  });
  (o.glow || []).forEach(({ row, col, at }) => {
    const c = g.cells[row][col], cw = S.measure(c.textContent, { size: 24, weight: 750, family: 'mono' });
    const gl = S.rect({ x: (col === 'hit' ? cols[1] : cols[2]) - cw - 10, y: g.cells[row].y - 17, w: cw + 20, h: 34, r: 10, fill: col === 'hit' ? 'url(#pglow-helps)' : 'url(#pglow-compute)', opacity: 0 }, g);
    gl.setAttribute('data-audit', 'ignore');
    g.insertBefore(gl, g.rowEls[0]);
    K.pulse(gl, at, 1, 1.2);
  });
  Object.assign(g, { l: right - W, r: right, t: top, rowY: i => top + 44 + RH * i + RH / 2 + 2 });
  return g;
}
