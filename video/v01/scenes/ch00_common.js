/* Shared builders for chapter 0, the cold open. Loaded before every ch00 scene; read-only for scene authors.

   The chapter is one continuous shot cut into three scenes, so anything that crosses a cut is drawn by
   the same code from the same numbers here, and the cut is invisible:
     s01 -> s02   the stamp '≈ 30 ms' / 'per token'                       ch00Stamp
     s02 -> s03   the 30 ms bar: sliver, grey rest, labels, pill, ?, tag  ch00Bar
   and two icons that s02 and s03 both use:                                ch00ModelFile, ch00Chip
   The stopwatch (s01, s03), the chat window (s01) and the spec sheet (s03) come straight from lib/.

   Visual language for the chapter: one dark stage, no camera moves.
   white = the 30 ms itself (ticks, the stamp, its readout) · blue = tokens, the chat, the model
   amber = arithmetic (the sliver, the chip) · grey = the unexplained 99% · coral = memory (s03 only). */

const CH00 = {
  // the stamp: s01's last frame and s02's first
  STAMP: { x: 960, y: 500, size: 96, subY: 580, subSize: 40 },
  // the 30 ms bar (s02, s03): 1,500 px stand for 30 ms, 50 px per ms, so 0.1 ms of arithmetic is 5 px
  BAR: {
    x0: 210, x1: 1710, y: 640, h: 80, pxPerMs: 50, sliverMs: 0.1,
    dimY: 750, dimLabelY: 790, dimLabelSize: 40,            // dimension line and '≈ 30 ms per token'
    pill: [1710, 590], q: [1240, 560], tag: [240, 580],      // 'one token', the '?', the tag's left end
  },
};

/**
 * The stamp '≈ 30 ms' (96 px mono, white, centred on 960,500) over 'per token' (40 px, grey, 960,580).
 * Returns <g> with .num and .sub (two separate texts, so a scene can move, scale or fade either one) and
 * .numHolder, a group around .num that is free for S.xset / fx.xform (or a scene's own transform);
 * .num itself stays untransformed. o: {x, y, size, subY, subSize, sub ('per token'; '' = none)}.
 */
function ch00Stamp(S, o = {}, parent) {
  const C = CH00.STAMP;
  const x = o.x ?? C.x, y = o.y ?? C.y;
  const g = S.g(null, parent);
  g.numHolder = S.g(null, g);
  g.num = S.text('≈ 30 ms', { x, y, size: o.size ?? C.size, weight: 600, family: 'mono', anchor: 'middle', color: 'ink' }, g.numHolder);
  const sub = o.sub ?? 'per token';
  if (sub) g.sub = S.text(sub, { x, y: o.subY ?? C.subY, size: o.subSize ?? C.subSize, weight: 500, anchor: 'middle', color: 'muted' }, g);
  Object.assign(g, { x, y });
  return g;
}

/**
 * The 30 ms bar exactly as s02 leaves it and s03 finds it, everything visible:
 *   outline 210-1710 x 640-720; amber sliver 210-215 (0.1 ms); flat grey rest 215-1710 with
 *   'something else: over 99%' inside; dimension line at y 750 with '≈ 30 ms per token' under it (y 790);
 *   'one token' chip at (1710, 590); a soft '?' at (1240, 560); the amber tag 'arithmetic: under 1%'
 *   (left end 240, 580) with an L-shaped pointer onto the sliver's top.
 * s02 builds it and hides parts until they arrive (S.set(part, {autoAlpha: 0}, 0) or fx.in); s03 builds
 * it as is. Every part is its own element (none carries a transform), so fx.in / fx.out / fx.dim are safe
 * on each; move the whole bar with fx.xform on the returned root (it carries no transform of its own).
 * o: {tagText ('arithmetic: under 1%'), insideText ('something else: over 99%'), dimText ('≈ 30 ms per token')}
 * Returns <g> with .outline .sliver .rest .inside .dim (line + end ticks) .dimLabel .pill (libToken)
 *   .q .tag .pointer and geometry .X(ms) (x of a time on the bar) .x0 .x1 .xs (sliver's right edge) .y .h .t .b .cy
 */
function ch00Bar(S, o = {}, parent) {
  const B = CH00.BAR;
  const root = S.g(null, parent);
  const X = ms => B.x0 + ms * B.pxPerMs;
  const xs = X(B.sliverMs), y = B.y, h = B.h;
  // fills first, the outline on top so the sliver's 5 px stay crisp against it
  root.rest = S.rect({ x: xs, y, w: B.x1 - xs, h, fill: 'muted', fillOpacity: 0.3 }, root);
  root.sliver = S.rect({ x: B.x0, y, w: xs - B.x0, h, fill: 'compute' }, root);
  root.outline = S.rect({ x: B.x0, y, w: B.x1 - B.x0, h, r: 3, stroke: 'ink', strokeOpacity: 0.5, sw: 2 }, root);
  root.inside = S.text(o.insideText ?? 'something else: over 99%', { x: (B.x0 + B.x1) / 2, y: y + h / 2 + 1, size: 36, weight: 600, anchor: 'middle', color: 'ink' }, root);
  // the dimension line: end ticks at both ends of the bar, the label below it
  root.dim = S.g(null, root);
  S.line({ x1: B.x0, y1: B.dimY, x2: B.x1, y2: B.dimY, stroke: 'muted', sw: 2 }, root.dim);
  S.line({ x1: B.x0, y1: B.dimY - 12, x2: B.x0, y2: B.dimY + 12, stroke: 'muted', sw: 2 }, root.dim);
  S.line({ x1: B.x1, y1: B.dimY - 12, x2: B.x1, y2: B.dimY + 12, stroke: 'muted', sw: 2 }, root.dim);
  root.dimLabel = S.text(o.dimText ?? '≈ 30 ms per token', { x: (B.x0 + B.x1) / 2, y: B.dimLabelY, size: B.dimLabelSize, weight: 600, anchor: 'middle', color: 'ink' }, root);
  // what the 30 ms produce
  root.pill = libToken(S, { text: 'one token', x: B.pill[0], y: B.pill[1], size: 28, case: 'label' }, root);
  // the open question over the grey
  root.q = S.text('?', { x: B.q[0], y: B.q[1], size: 96, weight: 400, family: 'display', anchor: 'middle', color: 'muted', opacity: 0.7 }, root);
  // the amber tag and its pointer onto the sliver's top
  const mid = (B.x0 + xs) / 2;
  root.tag = S.text(o.tagText ?? 'arithmetic: under 1%', { x: B.tag[0], y: B.tag[1], size: 30, weight: 600, color: 'compute' }, root);
  root.pointer = S.g(null, root);
  S.path({ d: `M${B.tag[0] - 10},${B.tag[1]} H${mid} V${y - 6}`, stroke: 'compute', sw: 2.5 }, root.pointer);
  S.path({ d: `M${mid - 6},${y - 15} L${mid},${y - 5} L${mid + 6},${y - 15}`, stroke: 'compute', sw: 2.5 }, root.pointer);
  Object.assign(root, { X, x0: B.x0, x1: B.x1, xs, y, h, t: y, b: y + h, cy: y + h / 2 });
  return root;
}

/** The model as a file: the same blue document icon ch01 opens ('a trained model'). o: {x, y, size = 96,
 *  tone = 'struct', label, labelSize = 36 (label left-anchored 30 px right of the icon)}. Returns <g> with .icon .labelEl */
function ch00ModelFile(S, o = {}, parent) {
  const g = S.g(null, parent);
  const size = o.size ?? 96, x = o.x ?? 960, y = o.y ?? 540;
  g.icon = S.icon('ph:file-duotone', { x, y, size, color: o.tone || 'struct' }, g);
  if (o.label) g.labelEl = S.text(o.label, { x: x + size / 2 + 30, y, size: o.labelSize ?? 36, weight: 550, color: o.labelColor || 'ink' }, g);
  Object.assign(g, { cx: x, cy: y, size });
  return g;
}

/** The chip, amber: libChip with the chapter's settings (style 'outline' for the faint fan in s03).
 *  o: any libChip option; defaults size 96, tone 'compute'. */
function ch00Chip(S, o = {}, parent) {
  return libChip(S, { size: 96, tone: 'compute', ...o }, parent);
}
