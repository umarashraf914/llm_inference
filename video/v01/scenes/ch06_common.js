/* Shared builders for chapter 6, "Two numbers, two different physics". Loaded before every ch06 scene;
   read-only for scene authors.

   Visual language for the chapter (keep it in every scene):
   - amber 'compute' = arithmetic: the GPU's worker grid (s01), the compute die, multiplication tiles.
     coral 'bytes' = memory and data movement: the 30 ms bar's remainder, memory blocks, weight tiles on
     the bus. blue 'struct' = structure: CPU worker cards, token pills, bits. Grey = tags and asides.
   - The 30 ms bar (ch06Bar), exactly as ch05 left it: 1,500 px = 30 ms, a 5 px amber sliver, the coral
     remainder 'the memory wall, 99%', and a coral name tag with a blank box and a '?'. s01 opens on it at
     full size and parks it small at the top-right (CH06.PARK, about 300 px wide, dimmed); it stays parked
     through s01 and s02, where s02 fills its box ('moving the weights') and dissolves the '?'.
   - The GPU's worker grid (ch06Grid): 48 x 12 small amber squares (576 drawn, standing for thousands),
     at CH06.GRID. s01 ends with it brightened and enlarged (CH06.GRID_END); s02 starts from that state.
     A small one (e.g. cols 6, rows 4) is the 'amber worker grid' inset of s10 and the recap tile of s13.
   - Seek-safe motion: ch06Drive / ch06Clock write state from tween progress (a pure function of time),
     so every frame is the same however it is reached. Use one clock per element per time window. */

const CH06 = {
  // the 30 ms bar at full size: bar 210-1710 x 500-580, sliver 210-215 (0.1 ms at 50 px per ms)
  BAR: { x0: 210, x1: 1710, y: 500, h: 80, xs: 215, tag: { x: 1000, y: 384, w: 420, h: 76 }, stemX: 1210 },
  // the bar's root, parked: S.xset/fx.xform state (translate, then scale about 0,0). The parked copy covers
  // about x 1500-1800, y 122-161; the body is dimmed to `dim`.
  PARK: { x: 1458, y: 45.2, s: 0.2, ox: 0, oy: 0, dim: 0.45 },
  // the GPU worker grid: top-left (x, y), 48 x 12 squares of `sq` px at `pitch`, base fill-opacity `fo`
  GRID: { x: 420, y: 672, cols: 48, rows: 12, pitch: 25, sq: 21, fo: 0.6 },
  // s01's last frame: the grid's holder xformed by {x, y, s, ox, oy} (x 230-1690, y 607-968), squares at fo 0.8
  GRID_END: { x: -58, y: 0, s: 1.22, ox: 1018, oy: 968, fo: 0.8 },
};

/** A tween over d seconds that calls apply(eased progress 0..1); seek-safe in both directions. */
function ch06Drive(d, apply, ease) {
  const p = { v: 0 }, e = gsap.parseEase(ease || 'none');
  const go = () => apply(e(p.v));
  return gsap.fromTo(p, { v: 0 }, {
    v: 1, duration: Math.max(0.001, d), ease: 'none', immediateRender: false,
    onStart: go, onUpdate: go, onReverseComplete: () => apply(0),
  });
}

/**
 * Schedule fn(t) to run with the absolute scene time t for every frame between t0 and t1 (time specs).
 * Before t0 nothing is written (build-time state shows); after t1 the state is fn(t1).
 *   ch06Clock(S, 'b4~clears', 'b5+0.5', t => { ...set attributes from t... });
 */
function ch06Clock(S, t0, t1, fn) {
  const a = S.t(t0), b = S.t(t1);
  return S.add(ch06Drive(b - a, p => fn(a + p * (b - a))), a);
}

/**
 * The 30 ms bar exactly as ch05 leaves it, every part visible. Parts (each its own element, no transforms):
 *   .rest (coral remainder) .sliver (amber, 5 px) .outline .inside ('the memory wall, 99%')
 *   .arith (group: .arithLabel 'arithmetic, under 1%' + its L-shaped pointer onto the sliver)
 *   .tag (group: stem, .tagBg, .box (dashed blank name box), .q '?', .nameEl (o.name, hidden until .showName))
 * Structure: root (transform holder: S.xset / fx.xform / .park) > .body (fade and dim it: fx.in, fx.dim).
 * o: {insideText, name ('' by default; s02 passes 'moving the weights'), parked (start parked, dimmed)}
 * Helpers (return tweens/timelines; call in time order):
 *   .park({d = 1.0, ease}) shrink to CH06.PARK and dim; marks the root data-audit="ignore" (its text is tiny)
 *   .showName({d = 0.5}) the box turns solid and the name fades in · .dissolveQ({d = 0.5}) the '?' dissolves
 */
function ch06Bar(S, o = {}, parent) {
  const B = CH06.BAR, T = B.tag;
  const root = S.g(null, parent);
  const body = root.body = S.g(null, root);
  const y = B.y, h = B.h, xs = B.xs;
  root.rest = S.rect({ x: xs, y, w: B.x1 - xs, h, fill: 'bytes', fillOpacity: 0.62 }, body);
  root.sliver = S.rect({ x: B.x0, y, w: xs - B.x0, h, fill: 'compute' }, body);
  root.outline = S.rect({ x: B.x0, y, w: B.x1 - B.x0, h, r: 3, stroke: 'ink', strokeOpacity: 0.5, sw: 2 }, body);
  root.inside = S.text(o.insideText ?? 'the memory wall, 99%', { x: (xs + B.x1) / 2, y: y + h / 2 + 1, size: 36, weight: 600, anchor: 'middle', color: 'ink' }, body);
  // 'arithmetic, under 1%' and its pointer onto the sliver's top
  root.arith = S.g(null, body);
  const mid = (B.x0 + xs) / 2, ty = y - 54;
  root.arithLabel = S.text('arithmetic, under 1%', { x: 250, y: ty, size: 30, weight: 600, color: 'compute' }, root.arith);
  S.path({ d: `M240,${ty} H${mid} V${y - 6}`, stroke: 'compute', sw: 2.5 }, root.arith);
  S.path({ d: `M${mid - 6},${y - 15} L${mid},${y - 5} L${mid + 6},${y - 15}`, stroke: 'compute', sw: 2.5 }, root.arith);
  // the coral name tag: a blank box and a '?', on a short stem from the coral part
  root.tag = S.g(null, body);
  S.line({ x1: B.stemX, y1: T.y + T.h, x2: B.stemX, y2: y - 2, stroke: 'bytes', sw: 2.5 }, root.tag);
  S.rect({ ...T, r: 18, fill: '#0c1326' }, root.tag);
  root.tagBg = S.rect({ ...T, r: 18, fill: 'url(#card-bytes)', stroke: 'bytes', strokeOpacity: 0.9, sw: 2.5 }, root.tag);
  root.box = S.rect({ x: T.x + 20, y: T.y + 16, w: 316, h: 44, r: 8, stroke: 'bytes', strokeOpacity: 0.65, sw: 2, dash: '7 6' }, root.tag);
  root.q = S.text('?', { x: T.x + 378, y: T.y + 39, size: 54, weight: 600, family: 'display', anchor: 'middle', color: 'bytes' }, root.tag);
  root.nameEl = S.text(o.name || '', { x: T.x + 178, y: T.y + 39, size: 28, weight: 600, anchor: 'middle', color: 'ink' }, root.tag);
  root.nameEl.style.opacity = 0;
  Object.assign(root, { x0: B.x0, x1: B.x1, xs, y, h, t: y, b: y + h, cy: y + h / 2, X: ms => B.x0 + ms * 50 });

  const P = CH06.PARK, PX = { x: P.x, y: P.y, s: P.s, ox: P.ox, oy: P.oy };
  if (o.parked) {
    S.xset(root, PX);
    body.style.opacity = P.dim;
    root.setAttribute('data-audit', 'ignore');
  }
  root.park = (po = {}) => {
    const tl = gsap.timeline();
    tl.set(root, { attr: { 'data-audit': 'ignore' } }, 0);
    tl.add(S.fx.xform(root, PX, { d: po.d ?? 1.0, ease: po.ease || 'power3.inOut' }), 0);
    tl.fromTo(body, { opacity: 1 }, { opacity: P.dim, duration: (po.d ?? 1.0) * 0.8, ease: 'power2.out', immediateRender: false }, (po.d ?? 1.0) * 0.2);
    return tl;
  };
  root.showName = (so = {}) => {
    const tl = gsap.timeline();
    tl.fromTo(root.box, { attr: { 'stroke-opacity': 0.65 } }, { attr: { 'stroke-opacity': 0 }, duration: so.d ?? 0.5, immediateRender: false }, 0);
    tl.fromTo(root.nameEl, { opacity: 0 }, { opacity: 1, duration: so.d ?? 0.5, ease: 'power2.out', immediateRender: false }, 0.1);
    return tl;
  };
  root.dissolveQ = (qo = {}) => gsap.fromTo(root.q, { opacity: 1, scale: 1, transformOrigin: '50% 50%' },
    { opacity: 0, scale: 1.6, duration: qo.d ?? 0.5, ease: 'power2.in', transformOrigin: '50% 50%', immediateRender: false });
  return root;
}

/**
 * The GPU's worker grid: cols x rows small amber squares (one <rect> each, in row-major order), plus
 * .flash, one <path> of every square at its home place (opacity 0) for a unison flash.
 * o: any CH06.GRID field (x, y, cols, rows, pitch, sq, fo), r (corner, 3), tone ('compute'),
 *    hidden (squares start at opacity 0, for a reveal).
 * Returns <g> with .cells[] (each with .i .r .c .hx .hy (home top-left) .cx .cy), .flash, and geometry
 *   .x .y .w .h .cx .cy .l .r .t .b .cols .rows .pitch .sq .fo.
 * Squares are plain rects so a scene can drive their attributes (fill-opacity, x, y, width, height) from a
 * ch06Clock; move or scale the whole grid with fx.xform on a holder group around it.
 */
function ch06Grid(S, o = {}, parent) {
  const G = { ...CH06.GRID, ...o };
  const root = S.g(null, parent);
  const tone = G.tone || 'compute';
  root.cells = [];
  let fd = '';
  for (let r = 0; r < G.rows; r++) for (let c = 0; c < G.cols; c++) {
    const x = G.x + c * G.pitch, y = G.y + r * G.pitch;
    const e = S.rect({ x, y, w: G.sq, h: G.sq, r: G.r ?? 3, fill: tone, fillOpacity: G.fo }, root);
    if (G.hidden) e.setAttribute('opacity', 0);
    Object.assign(e, { i: root.cells.length, r, c, hx: x, hy: y, cx: x + G.sq / 2, cy: y + G.sq / 2 });
    root.cells.push(e);
    fd += `M${x},${y}h${G.sq}v${G.sq}h${-G.sq}z`;
  }
  root.flash = S.path({ d: fd, fill: tone, opacity: 0 }, root);
  root.flash.setAttribute('data-audit', 'ignore');
  const w = (G.cols - 1) * G.pitch + G.sq, h = (G.rows - 1) * G.pitch + G.sq;
  Object.assign(root, {
    x: G.x, y: G.y, w, h, cx: G.x + w / 2, cy: G.y + h / 2, l: G.x, r: G.x + w, t: G.y, b: G.y + h,
    cols: G.cols, rows: G.rows, pitch: G.pitch, sq: G.sq, fo: G.fo,
  });
  return root;
}

/**
 * The chapter's GPU package (s02's reference image; it returns in s04, s05, s10 and s13): an amber compute
 * die whose face is a grid of small amber squares (s01's worker grid in miniature), coral memory stacks
 * (towers of thin layers) beside it, and a bus of thin parallel coral wires from each stack straight into
 * the die, on a dark package board with a small grey tag at its lower-left corner.
 * Drawn in local units about (0, 0) inside .body (transform: translate(x, y) scale(s)); the root carries no
 * transform, so a scene may fx.xform it (zoom, park) or fx.in / fx.dim it.
 * Local geometry: die 300 x 300 centred at (dieX + 150, 0); each memory column is `stacks` stacks of
 * 130 x 92 (gap 12, so a column is exactly the die's 300 tall); `gap` px of bus between die and memory.
 * o: {x = 960, y = 540 (centre of die + memory), s = 1, side = 'right' (memory to the die's right: s02, s04,
 *     s05) | 'both' (both sides, 3 + 3 = six sites: s10), stacks = 3 (per side), gap = 170, wires = 14
 *     (bus lines per stack; 30+ for 'hair-thin'), wireSw = 1.6, grey = [] (site indices drawn grey: unused;
 *     right column 0..n-1 top to bottom, then the left column), tag = 'generic GPU' ('' = none),
 *     tagSize = 24 (screen px)}
 * Returns <g> with .body, .board, .die (group), .dieRect, .face (the square grid, one path), .stacks[] (groups;
 *   each .side +1 | -1, .grey, .block (its rect), .inner (fade it, not the stack)), .bus[] (one group of <line>s per stack), .tagEl, and geometry in screen units:
 *   .dieBox {x, y, w, h, cx, cy}, .stackBox(i) (as planned so far), .wire(i, k) -> path d along wire k of stack
 *   i, memory -> die, at the gap planned so far (for S.flow, tokens riding the bus), .P(lx, ly) -> [x, y].
 * Helpers (return tweens/timelines; call in time order):
 *   .drawOn({d = 1.2}) board, die, stacks, then the wires draw on · .flashDie({d = 0.5, to = 1}) the die's
 *   outline and face flash once · .setGap(gap, {d = 0.9, ease}) slide the memory toward or away from the
 *   die; the wires shorten or lengthen with it (seek-safe).
 */
function ch06Package(S, o = {}, parent) {
  const s = o.s ?? 1, X0 = o.x ?? 960, Y0 = o.y ?? 540, n = o.stacks ?? 3, both = o.side === 'both';
  const gap0 = o.gap ?? 170, NW = o.wires ?? 14, grey = o.grey || [];
  const SW = 130, SH = 92, SG = 12, DIE = 300;
  const dieX = both ? -DIE / 2 : -(DIE + gap0 + SW) / 2;           // die's left edge, local
  const root = S.g(null, parent);
  const body = root.body = S.g({ transform: `translate(${X0},${Y0}) scale(${s})` }, root);
  const P = (lx, ly) => [X0 + s * lx, Y0 + s * ly];
  // the board: sized for the starting gap, with room under it for the tag
  const memL = both ? dieX - gap0 - SW : dieX, memR = dieX + DIE + gap0 + SW;
  const pad = 46, tagRoom = o.tag === '' ? 0 : 40;
  const bx = memL - pad, by = -DIE / 2 - pad, bw = memR - memL + 2 * pad, bh = DIE + 2 * pad + tagRoom;
  root.board = S.rect({ x: bx, y: by, w: bw, h: bh, r: 26, fill: '#0f1830', stroke: '#ffffff', strokeOpacity: 0.12, sw: 2, filter: 'url(#shadow)' }, body);
  // the die: dark amber body, outline, and a 12 x 12 face of amber squares
  root.die = S.g(null, body);
  root.dieRect = S.rect({ x: dieX, y: -DIE / 2, w: DIE, h: DIE, r: 14, fill: '#1a1408', stroke: 'compute', strokeOpacity: 0.85, sw: 3 }, root.die);
  let fd = '';
  const fp = 22, fq = 18.6, f0 = (DIE - (11 * fp + fq)) / 2;
  for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) fd += `M${(dieX + f0 + c * fp).toFixed(1)},${(-DIE / 2 + f0 + r * fp).toFixed(1)}h${fq}v${fq}h${-fq}z`;
  root.face = S.path({ d: fd, fill: 'compute', fillOpacity: 0.6 }, root.die);
  // memory stacks and their wires
  root.stacks = []; root.bus = [];
  const sides = both ? [1, -1] : [1];
  const plan = { gap: gap0 };
  const memX = (side, g) => (side > 0 ? dieX + DIE + g : dieX - g - SW);
  sides.forEach(side => {
    for (let i = 0; i < n; i++) {
      const idx = root.stacks.length, isGrey = grey.includes(idx);
      const sy = -DIE / 2 + i * (SH + SG);
      const bus = S.g(null, body);
      bus.lines = [...Array(NW)].map((_, k) => {
        const y = sy + 6 + (k + 0.5) * (SH - 12) / NW;
        const xa = side > 0 ? dieX + DIE : memX(side, gap0) + SW, xb = side > 0 ? memX(side, gap0) : dieX;
        const ln = S.line({ x1: xa, y1: y, x2: xb, y2: y, stroke: isGrey ? 'muted' : 'bytes', sw: o.wireSw ?? 1.6, strokeOpacity: isGrey ? 0.18 : 0.5, cap: 'butt' }, bus);
        ln.k = k; ln.y = y;
        return ln;
      });
      if (isGrey) bus.style.display = 'none';                   // an unused site has no bus
      const st = S.g(null, body);                                // .setGap moves st; .drawOn fades st.inner
      st.inner = S.g(null, st);
      const x = memX(side, gap0);
      st.block = S.rect({ x, y: sy, w: SW, h: SH, r: 10, fill: isGrey ? '#171c29' : '#2a1218', stroke: isGrey ? 'muted' : 'bytes', strokeOpacity: isGrey ? 0.45 : 0.9, sw: 2.5 }, st.inner);
      for (let l = 1; l < 8; l++) S.line({ x1: x + 10, y1: sy + l * SH / 8, x2: x + SW - 10, y2: sy + l * SH / 8, stroke: isGrey ? 'muted' : 'bytes', strokeOpacity: isGrey ? 0.25 : 0.45, sw: 1.5 }, st.inner);
      Object.assign(st, { side, grey: isGrey, sy, i: idx });
      root.stacks.push(st); root.bus.push(bus);
    }
  });
  if (o.tag !== '') root.tagEl = S.text(o.tag ?? 'generic GPU', { x: bx + 26, y: by + bh - 26, size: (o.tagSize ?? 24) / s, weight: 550, color: 'muted' }, body);

  const [dx0, dy0] = P(dieX, -DIE / 2);
  root.dieBox = { x: dx0, y: dy0, w: DIE * s, h: DIE * s, cx: dx0 + DIE * s / 2, cy: Y0 };
  root.P = P;
  root.stackBox = i => { const st = root.stacks[i], [x, y] = P(memX(st.side, plan.gap), st.sy); return { x, y, w: SW * s, h: SH * s, cx: x + SW * s / 2, cy: y + SH * s / 2 }; };
  root.wire = (i, k) => {
    const st = root.stacks[i], ln = root.bus[i].lines[k];
    const [xm] = P(st.side > 0 ? memX(1, plan.gap) : memX(-1, plan.gap) + SW, 0), [xd] = P(st.side > 0 ? dieX + DIE : dieX, 0), [, y] = P(0, ln.y);
    return `M${xm.toFixed(1)},${y.toFixed(1)} L${xd.toFixed(1)},${y.toFixed(1)}`;
  };
  root.drawOn = (d0 = {}) => {
    const d = d0.d ?? 1.2, tl = gsap.timeline();
    tl.fromTo(root.board, { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.4, ease: 'power2.out' }, 0);
    tl.fromTo(root.die, { autoAlpha: 0, scale: 0.9, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: d * 0.5, ease: 'power3.out', transformOrigin: '50% 50%' }, d * 0.15);
    tl.fromTo(root.stacks.map(st => st.inner), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: d * 0.4, ease: 'power3.out', stagger: d * 0.05 }, d * 0.3);
    tl.fromTo(root.bus.flatMap(b => b.lines), { drawSVG: '0%', autoAlpha: 1 }, { drawSVG: '100%', duration: d * 0.35, ease: 'power2.inOut', stagger: d * 0.25 / (NW * root.bus.length) }, d * 0.6);
    if (root.tagEl) tl.fromTo(root.tagEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.3 }, d * 0.7);
    return tl;
  };
  root.flashDie = (f0 = {}) => {
    const d = f0.d ?? 0.5, tl = gsap.timeline();
    tl.fromTo(root.dieRect, { attr: { 'stroke-opacity': 0.85 } }, { attr: { 'stroke-opacity': f0.to ?? 1 }, duration: d / 2, yoyo: true, repeat: 1, immediateRender: false }, 0);
    tl.fromTo(root.face, { attr: { 'fill-opacity': 0.6 } }, { attr: { 'fill-opacity': 0.95 }, duration: d / 2, yoyo: true, repeat: 1, immediateRender: false }, 0);
    return tl;
  };
  root.setGap = (g2, go = {}) => {
    const g1 = plan.gap; plan.gap = g2;
    return ch06Drive(go.d ?? 0.9, k => {
      const g = g1 + (g2 - g1) * k;
      root.stacks.forEach((st, i) => {
        st.setAttribute('transform', `translate(${(st.side * (g - gap0)).toFixed(2)},0)`);
        root.bus[i].lines.forEach(ln => { if (k > 0) ln.style.strokeDasharray = 'none'; ln.setAttribute(st.side > 0 ? 'x2' : 'x1', (st.side > 0 ? memX(1, g) : memX(-1, g) + SW).toFixed(2)); });
      });
    }, go.ease || 'power2.inOut');
  };
  return root;
}
