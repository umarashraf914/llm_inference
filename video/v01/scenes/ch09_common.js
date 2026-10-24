/* Shared builders for chapter 9, "The weights, and what they cost to move". Loaded before every ch09 scene.
 *
 * Visual language of the chapter (keep it consistent):
 *   coral (bytes)   the weights as bytes: the 140 GB block, the memory beside the chip, the bus, packets.
 *   amber (compute) the chip itself: libChip in s01 and s03, the compute die in s02.
 *   blue (struct)   structure: the package slab, the users' pills, and the chip's own tiny store (≈ 0.1 GB).
 *   teal (helps)    what helps: 'load once', 'one copy serves everyone'.
 *   Text is white for what matters now, grey for notes; numbers in mono.
 *
 * Recurring objects:
 *   ch09Memory     THE memory beside the chip: a coral-outlined container (340 × 170 at s = 1) that holds the
 *                  solid coral '140 GB' block once filled. s01 ends with it filled, alone, at CH09.memEnd
 *                  (frame centre, s = 1, '140 GB' showing). s02 opens from exactly there; s03's block is the
 *                  same object.
 *   ch09Chip       the chip: libChip, amber, 110 px at s = 1.
 *   ch09ChipStore  the chip's own storage: a small blue box (s01 b4 at the axis origin, s03 b4 inside the chip).
 *   ch09Bus        the wide bus: many hair-thin coral lines between two spans (s02's fan, s03's bus).
 * Every builder returns a root <g>. ch09Memory and ch09Chip are placed with S.xset and moved with fx.xform
 * (their .place helper): never fx.in / fx.move / fx.pop their roots (that would overwrite the transform);
 * fade them with autoAlpha-only tweens, or wrap them in a holder.
 */

const CH09 = {
  mem: { w: 340, h: 170, r: 20, pad: 14 },     // the container at s = 1; the block sits pad px inside it
  memEnd: { x: 960, y: 540, s: 1 },            // where s01 leaves the filled container; s02 starts here
  chipSize: 110,
};

/**
 * ch09Memory — the memory beside the chip: a coral-outlined container, empty or holding the 140 GB block.
 * Drawn centred on its own origin, then placed with S.xset(root, {x, y, s}).
 * o: {x = 960, y = 540 (centre), s = 1, w = 340, h = 170, filled = false (the block shows from the start),
 *     label = '140 GB' (on the block; null for none), labelSize = 40}
 * Returns <g> root with .frame (the coral outline), .base, .blockHolder (a <g> around the block, in the
 *   container's own coordinates: S.xset / fx.xform it to bring the block in from elsewhere), .block
 *   (libMemBlock, solid coral, with .labelEl), .inner {x, y, w, h} (the block's rect, local) and .w .h
 * Helpers (return tweens / timelines; call in time order):
 *   .place({x, y, s}, {d = 1, ease})     glide / scale the whole container (fx.xform on the root)
 *   .glow({tone = 'bytes', d = 0.9, hold = 0})  the outline lights up in a tone and settles back
 *   .brighten({d = 0.6})                  the outline goes to full strength and stays (s01's last move)
 *   .label(on, {d = 0.4})                 fade the block's '140 GB' in or out (hide it below ~0.6 scale)
 * Example (s02 opening, picking up s01's last frame):
 *   const mem = ch09Memory(S, { ...CH09.memEnd, filled: true });
 */
function ch09Memory(S, o = {}, parent) {
  const w = o.w ?? CH09.mem.w, h = o.h ?? CH09.mem.h, r = CH09.mem.r, pad = CH09.mem.pad;
  const root = S.g(null, parent);
  root.base = S.rect({ x: -w / 2, y: -h / 2, w, h, r, fill: '#0c1326', filter: 'url(#shadow)' }, root);
  S.rect({ x: -w / 2, y: -h / 2, w, h, r, fill: 'url(#card-bytes)' }, root);
  root.frame = S.rect({ x: -w / 2, y: -h / 2, w, h, r, stroke: 'bytes', strokeOpacity: 0.8, sw: 3 }, root);
  root.blockHolder = S.g(null, root);
  root.inner = { x: -w / 2 + pad, y: -h / 2 + pad, w: w - 2 * pad, h: h - 2 * pad };
  root.block = libMemBlock(S, {
    ...root.inner, r: r - pad / 2, gb: 140, label: o.label === undefined ? '140 GB' : o.label,
    size: o.labelSize ?? 40, tone: 'bytes', style: 'solid', shadow: false,
  }, root.blockHolder);
  if (!o.filled) { root.blockHolder.style.opacity = 0; root.blockHolder.style.visibility = 'hidden'; }
  // a glowing copy of the outline, for .glow / .brighten
  const glowEl = S.rect({ x: -w / 2, y: -h / 2, w, h, r, stroke: 'bytes', sw: 4, filter: 'url(#glow-bytes)' }, root);
  glowEl.style.opacity = 0;
  glowEl.setAttribute('data-audit', 'ignore');
  Object.assign(root, { w, h });
  S.xset(root, { x: o.x ?? 960, y: o.y ?? 540, s: o.s ?? 1 });

  root.place = (st, a = {}) => S.fx.xform(root, st, { d: a.d ?? 1, ease: a.ease || 'power3.inOut' });
  root.glow = (a = {}) => {
    const tone = a.tone || 'bytes', d = a.d ?? 0.9, t = gsap.timeline();
    t.set(glowEl, { attr: { stroke: S.tone(tone), filter: `url(#glow-${tone})` } }, 0);
    t.fromTo(glowEl, { opacity: 0 }, { opacity: 1, duration: d * 0.35, ease: 'power2.out', immediateRender: false }, 0);
    t.to(glowEl, { opacity: 0, duration: d * 0.65, ease: 'power2.in' }, d * 0.35 + (a.hold ?? 0));
    return t;
  };
  root.brighten = (a = {}) => gsap.fromTo(root.frame, { attr: { 'stroke-opacity': 0.8, 'stroke-width': 3 } },
    { attr: { 'stroke-opacity': 1, 'stroke-width': 4 }, duration: a.d ?? 0.6, ease: 'power2.out', immediateRender: false });
  root.label = (on, a = {}) => {
    const el = root.block.labelEl;
    return on ? gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: a.d ?? 0.4, ease: 'power2.out', immediateRender: false })
      : gsap.to(el, { autoAlpha: 0, duration: a.d ?? 0.3, ease: 'power2.in' });
  };
  return root;
}

/**
 * ch09Chip — the chip itself: an amber libChip drawn on its own origin, placed with S.xset.
 * o: {x = 960, y = 540 (centre), s = 1, size = 110, state = 'on' | 'idle' | 'busy', seed = 9}
 * Returns <g> root with .chip (the libChip: .pulse .flash .compute .busy …) and .size.
 * Helper: .place({x, y, s}, {d = 1, ease}) glides / scales it (fx.xform). Name it with your own text.
 */
function ch09Chip(S, o = {}, parent) {
  const root = S.g(null, parent);
  const size = o.size ?? CH09.chipSize;
  root.chip = libChip(S, { x: 0, y: 0, size, tone: 'compute', state: o.state ?? 'on', seed: o.seed ?? 9 }, root);
  root.size = size;
  S.xset(root, { x: o.x ?? 960, y: o.y ?? 540, s: o.s ?? 1 });
  root.place = (st, a = {}) => S.fx.xform(root, st, { d: a.d ?? 1, ease: a.ease || 'power3.inOut' });
  return root;
}

/**
 * ch09ChipStore — what the chip itself can hold (≈ 0.1 GB in all): a small blue box, blue outline on a
 * blue tint. Schematic size: far too small to draw to scale beside 140 GB, so keep it small.
 * o: {x, y (centre), size = 24 (or w, h), label = null, labelSize = 26, labelPos = 'below' | 'inside' | 'right'}
 * Returns <g> with .box (the outline rect), .labelEl and anchors .l .r .t .b .cx .cy
 */
function ch09ChipStore(S, o = {}, parent) {
  const w = o.w ?? o.size ?? 24, h = o.h ?? o.size ?? 24, x = (o.x ?? 960) - w / 2, y = (o.y ?? 540) - h / 2;
  const g = S.g(null, parent);
  const r = Math.min(6, w / 4);
  S.rect({ x, y, w, h, r, fill: '#0c1326' }, g);
  g.box = S.rect({ x, y, w, h, r, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.95, sw: 2.5 }, g);
  if (o.label) {
    const pos = o.labelPos || 'below', ls = o.labelSize ?? 26;
    const at = pos === 'inside' ? [x + w / 2, y + h / 2 + 1, 'middle'] : pos === 'right' ? [x + w + 14, y + h / 2, 'start'] : [x + w / 2, y + h + ls * 0.9, 'middle'];
    g.labelEl = S.text(o.label, { x: at[0], y: at[1], size: ls, anchor: at[2], weight: 600, family: 'mono', color: pos === 'inside' ? 'ink' : 'struct' }, g);
  }
  Object.assign(g, { l: x, r: x + w, t: y, b: y + h, cx: x + w / 2, cy: y + h / 2, w, h });
  return g;
}

/**
 * ch09Bus — the wide bus between the memory and the chip: n hair-thin coral lines from a vertical span at
 * x1 to one at x2. Equal spans give a parallel band (s03); unequal spans or centres give a fan (s02).
 * o: {x1, x2, y1 = 540 (centre at x1), y2 = y1 (centre at x2), h1 = 80 (span at x1), h2 = h1, n = 48,
 *     sw = 1.1, tone = 'bytes', opacity = 0.75}
 * Returns <g> with .lines[] (one <path> per wire), .d[] (each wire's path data, for S.flow / libToken.travel),
 *   .mid (the middle wire's d) and .x1 .x2 .y1 .y2 .h1 .h2
 * Helpers: .draw({d = 0.9, spread = 0.4}) → timeline: the wires draw on from x1 to x2, rippling out from
 *   the middle over `spread` s (hidden until it plays).
 *   .recolor(tone, {d = 0.5}) → tween of every wire's stroke (e.g. 'neutral' when the signal frays).
 */
function ch09Bus(S, o = {}, parent) {
  const g = S.g(null, parent);
  const x1 = o.x1 ?? 700, x2 = o.x2 ?? 1200, y1 = o.y1 ?? 540, y2 = o.y2 ?? y1, h1 = o.h1 ?? 80, h2 = o.h2 ?? h1;
  const n = o.n ?? 48;
  const f2 = v => Math.round(v * 100) / 100;
  g.d = []; g.lines = [];
  for (let k = 0; k < n; k++) {
    const f = n === 1 ? 0.5 : k / (n - 1);
    const ya = y1 - h1 / 2 + f * h1, yb = y2 - h2 / 2 + f * h2;
    const d = ya === yb ? `M${f2(x1)},${f2(ya)} L${f2(x2)},${f2(yb)}`
      : `M${f2(x1)},${f2(ya)} C${f2(x1 + (x2 - x1) * 0.45)},${f2(ya)} ${f2(x1 + (x2 - x1) * 0.55)},${f2(yb)} ${f2(x2)},${f2(yb)}`;
    g.d.push(d);
    g.lines.push(S.path({ d, stroke: o.tone || 'bytes', sw: o.sw ?? 1.1, strokeOpacity: o.opacity ?? 0.75, cap: 'butt' }, g));
  }
  g.mid = g.d[Math.floor(n / 2)];
  Object.assign(g, { x1, x2, y1, y2, h1, h2 });
  g.draw = (a = {}) => {
    const t = gsap.timeline(), spread = a.spread ?? 0.4, mid = (n - 1) / 2;
    g.lines.forEach((ln, k) => t.fromTo(ln, { drawSVG: '0%', autoAlpha: 1 }, { drawSVG: '100%', duration: a.d ?? 0.9, ease: 'power2.inOut' },
      mid ? spread * Math.abs(k - mid) / mid : 0));
    return t;
  };
  g.recolor = (tone, a = {}) => gsap.to(g.lines, { stroke: S.tone(tone), duration: a.d ?? 0.5, ease: 'power1.inOut' });
  return g;
}
