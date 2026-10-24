/* Shared builders for chapter 17, "What the user feels". Loaded before every ch17 scene; read-only for
   scene authors.

   Visual language of the chapter (keep it in every scene):
   - The two waits keep fixed colours: the pause before the first token (TTFT, prefill) is amber
     'compute'; the gap between tokens (TPOT, decode) is coral 'bytes'. Teal 'helps' only for a saving
     (a cache hit, a target met); blue 'struct' for tokens and requests (libToken pills); white and grey
     for everything that is neither (s01's Latency / Throughput cards are neutral white outlines).
   - The user's end is a block of small person icons (ch17Users), the server's end is the same small
     GPU package (ch17Gpu). s01 builds its stage on them (GPU far left at x 200, users far right at
     x 1716-1790); s04's streaming lanes and s05's crowd and GPU reuse the same two builders.
   - Every caveat ('illustrative', 'H100, weights only', 'idealised: ...') is the same small grey tag
     (ch17Tag), bottom-right of the frame by default, so the viewer learns where to look for it.
   - Seek-safe motion: everything here returns plain elements; scenes animate them with the engine's fx
     and with timeline tweens, never with wall-clock time. */

/**
 * ch17Tag — the chapter's small grey caveat tag: an outlined neutral pill with muted 24 px text.
 * Default placement: bottom-right, its right edge at x 1824 and its centre at y 984 (inside the safe
 * area, clear of a takeaway band, which this chapter does not use there).
 * o: {x = 1824, y = 984, anchor = 'end' | 'start' | 'middle', size = 24, h = 42, tone = 'neutral'}
 * Returns the pill <g> (engine S.pill: .bg .label .w .l .r .cx .cy), hidden: enter it with
 * fx.in(tag, {from: 'fade'}) and leave with fx.out.
 * Example: const ill = ch17Tag(S, 'illustrative');  S.add(S.fx.in(ill, { from: 'fade' }), 'b2~reverse');
 */
function ch17Tag(S, text, o = {}, parent) {
  const size = o.size ?? 24, h = o.h ?? 42, anchor = o.anchor || 'end';
  const w = S.measure(text, { size, weight: 550 }) + 36;
  const x = anchor === 'end' ? (o.x ?? 1824) - w : anchor === 'middle' ? (o.x ?? 960) - w / 2 : (o.x ?? 96);
  const tag = S.pill(text, { x, y: o.y ?? 984, h, w, size, weight: 550, anchor: 'start', tone: o.tone || 'neutral', style: 'outline', color: 'muted' }, parent);
  tag.bg.setAttribute('stroke-opacity', 0.38);
  tag.style.opacity = 0; tag.style.visibility = 'hidden';
  return tag;
}

/**
 * ch17Gpu — the chapter's GPU: libChip's small package icon (amber die, two coral HBM stacks a side).
 * o: any libChip option; defaults {size: 70 (the die), hbm: 2, tone: 'compute'}. The package is about
 *    2 x size wide and 1.15 x size tall. Returns the libChip root (.drawOn .busy .compute .flash .pulse
 *    .port(side, gap) ...). Example: const gpu = ch17Gpu(S, { x: 200, y: 710 }); S.add(gpu.drawOn(), 'b4');
 */
function ch17Gpu(S, o = {}, parent) {
  return libChip(S, { size: 70, hbm: 2, tone: 'compute', ...o }, parent);
}

/**
 * ch17Users — a block of small user icons (ph:user-circle-duotone), laid out in columns, each in its own
 * <g> so it can be popped, flown in or badged on its own.
 * o: {x, y (centre of the block), n = 10, cols = 2, gapX = 74, gapY = 60, size = 46, tone = 'ink',
 *     order = 'rows' | 'cols' (how n fills the grid; rows: left to right, then down),
 *     screen = false (true: a small dark screen with a caret beside each user, for s05's crowd),
 *     hidden = true (each user starts hidden; reveal with fx.pop(users.list) or your own motion)}
 * Returns {g, list: [<g> per user, each with .cx .cy .icon (.screen)], at(i) -> [x, y], w, h, l, r, t, b}.
 * Example: const U = ch17Users(S, { x: 1753, y: 710 }); S.add(S.fx.pop(U.list, { stagger: 0.04 }), 'b4');
 */
function ch17Users(S, o = {}, parent) {
  const n = o.n ?? 10, cols = o.cols ?? 2, rows = Math.ceil(n / cols);
  const gx = o.gapX ?? 74, gy = o.gapY ?? 60, size = o.size ?? 46;
  const w = (cols - 1) * gx, h = (rows - 1) * gy;
  const x0 = (o.x ?? 1753) - w / 2, y0 = (o.y ?? 710) - h / 2;
  const g = S.g(null, parent);
  const list = [];
  for (let i = 0; i < n; i++) {
    const c = o.order === 'cols' ? Math.floor(i / rows) : i % cols;
    const r = o.order === 'cols' ? i % rows : Math.floor(i / cols);
    const cx = x0 + c * gx, cy = y0 + r * gy;
    const u = S.g(null, g);
    u.icon = S.icon('ph:user-circle-duotone', { x: cx, y: cy, size, color: o.tone || 'ink' }, u);
    if (o.screen) {
      const sw = size * 0.62, sh = size * 0.44, sx = cx + size * 0.62, sy = cy - sh / 2;
      u.screen = S.g(null, u);
      S.rect({ x: sx, y: sy, w: sw, h: sh, r: 3, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.35, sw: 1.5 }, u.screen);
      u.caret = S.rect({ x: sx + 5, y: sy + 5, w: 2.5, h: sh - 10, r: 1, fill: 'ink' }, u.screen);
    }
    Object.assign(u, { cx, cy, i });
    if (o.hidden !== false) { u.style.opacity = 0; u.style.visibility = 'hidden'; }
    list.push(u);
  }
  return { g, list, at: i => [list[i].cx, list[i].cy], w: w + size, h: h + size, l: x0 - size / 2, r: x0 + w + size / 2, t: y0 - size / 2, b: y0 + h + size / 2 };
}
