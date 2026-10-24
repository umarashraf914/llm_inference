/* Shared builders for chapter 18, Where that leaves us. Loaded before every ch18 scene; read-only for
   scene authors (s02-s04 use these as they are; build variants inside your own scene file).

   Chapter visual language (the recap: every picture is arithmetic the film has already done):
     amber  'compute' = arithmetic: peak, operations, the 0.1 ms sliver, a chip's ÷ / × signs when lit (s02)
     coral  'bytes'   = memory: bandwidth, bytes per token / per read, the 30 ms bar, streams on a bus
     white  'ink'     = results (295, 206, 29.2 ms, a chip's answer)
     grey   'muted'   = caveats, brackets, tags ('× 300', '0.1 ms was 0.14', 'weights only')
     blue   'struct'  = tokens, cards, structure; tokens are always libToken pills
     teal   'helps'   = a way out: escape-route arrows (s03), goodput (s02)
   Numbers are JetBrains Mono, words Inter. Key numbers 48-60 px, chip text 24-34 px, labels ≥ 26 px.
   Stopwatches use a coral hand: the 30 ms is time spent waiting on memory.

   Builders:
     CH18                          shared tones and sizes
     ch18Gpu(S, o, parent)         small GPU package icon (libChip with HBM stacks) with its name on the right
     ch18Watch(S, o, parent)       the chapter's stopwatch (libStopwatch, coral hand, mono readout)
     ch18Chip(S, o, parent)        a result chip: mono (or sans) parts in one rounded plate, each part its own
                                   <text> so a sign can light amber or a number can count; optional tiny token
                                   pill before the text and an optional smaller grey second line
*/

const CH18 = {
  tone: { arith: 'compute', mem: 'bytes', result: 'ink', caveat: 'muted', token: 'struct', helps: 'helps' },
  num: 54,          // key numbers in a worked row (s01)
  word: 46,         // equation words (s01)
  chip: 26,         // result chips (s02 26 px, s03 24 px)
  gpu: { size: 40, labelSize: 40 },
};

/**
 * ch18Gpu — the small GPU package icon (die on a blue slab, coral HBM stacks either side: the look of S.gpu
 * at icon size) with its name to the right, e.g. 'H100', 'H200'. A thin wrapper on libChip({hbm}) so every
 * ch18 scene draws the same chip at the same size.
 * o: {x, y (centre of the package), size = 40 (die side; the package is about 2.04 × size wide and
 *     1.24 × size tall), hbm = 2 (stacks a side), label, labelSize = 40, labelGap = 18, labelPos = 'right',
 *     state = 'on' | 'idle' | 'busy', seed}
 * Returns the libChip root: .labelEl, .stacks[], .bus(i) (path d from stack i to the die, for S.flow),
 *   .drawOn() .pulse() .flash() .wake() .sleep() and anchors .l .r .t .b .cx .cy (package only).
 *   .nameR is the right edge of the name (for laying out what follows it).
 */
function ch18Gpu(S, o = {}, parent) {
  const size = o.size ?? CH18.gpu.size;
  const chip = libChip(S, {
    x: o.x ?? 960, y: o.y ?? 540, size, hbm: o.hbm ?? 2, tone: 'compute', state: o.state || 'on', seed: o.seed ?? 7,
    label: o.label || null, labelPos: o.labelPos || 'right', labelSize: o.labelSize ?? CH18.gpu.labelSize,
    labelGap: o.labelGap ?? 18, labelTone: 'ink',
  }, parent);
  if (o.label) chip.nameR = chip.r + (o.labelGap ?? 18) + S.measure(o.label, { size: o.labelSize ?? CH18.gpu.labelSize, weight: 650 });
  return chip;
}

/**
 * ch18Watch — the chapter's stopwatch: libStopwatch with a coral hand and ring (time spent on memory), one
 * decimal for values like 29.2 ms, the readout to the right at 34 px by default.
 * o: any libStopwatch option; defaults {size: 64, tone: 'bytes', readout: 'right', readoutSize: 34,
 *    decimals: 1, span: 60, max: 30}. Big hero watches (s02's '30 ms'): pass size 220, readout 'below',
 *    decimals 0.
 * Returns the libStopwatch <g> (.run .set .show .flash .in, geometry .l .r .t .b .cx .cy).
 */
function ch18Watch(S, o = {}, parent) {
  return libStopwatch(S, { size: 64, tone: 'bytes', readout: 'right', readoutSize: 34, decimals: 1, span: 60, max: 30, ...o }, parent);
}

/**
 * ch18Chip — a result chip that carries its own arithmetic: '80 ÷ 17 ≈ 4.7', '70 bn × 2 bytes = 140 GB',
 * '1 op per byte'. One rounded plate (opaque base + tinted card gradient, like S.pill 'soft'), the text laid
 * out part by part so each sign or number is its own element.
 *
 * o: {x, y (centre y), anchor = 'middle' | 'start' (x is the centre or the left edge),
 *     parts = [str | {t, tone, w (weight), op}]   a string part is white; single-character signs
 *                       (÷ × = ≈ → + −) are marked op automatically and drawn muted until lit,
 *     size = 26, family = 'mono' | 'sans', weight = 600, gap = size × 0.4 (between parts; a part's own
 *     spaces count too, so 'bn' and '× 2' read naturally),
 *     tone = 'neutral' (plate outline and tint: 'bytes' for a coral chip, 'helps' teal ...),
 *     h = size × 1.9 (one line) | size × 3.3 (two lines), padX = size × 0.8,
 *     lead = false | true | {w, h, state}   a tiny blue token pill before the text (decorative),
 *     line2 = null | str | {t, tone = 'muted', size = max(22, round(size × 0.85))}   a second, smaller line
 *                       under the first (its own element: to write it on later, call .write({line2: false})
 *                       and then fx.in(chip.line2El)),
 *     w (fixed plate width; default fits), r}
 * Returns <g> with .plate (the tinted rect) .parts[] (each <text> with .l .r .cx .w) .ops[] (the sign parts)
 *   .leadEl .line2El and geometry .l .r .t .b .cx .cy .w .h.
 * Helpers (return tweens):
 *   .write({d = 0.35, stagger = 0.12, line2 = true})   plate fades in, then the parts appear one by one
 *                                         (term by term); line2: false leaves the second line hidden
 *   .lightOps({tone = 'compute', d = 0.35, stagger = 0.1, glow = true, signs = '÷×'})   the operation signs
 *                                         turn amber and swell once, left to right ('=' and '≈' stay grey;
 *                                         pass signs: '÷×=≈→' to light every sign)
 *   .pulse({scale = 1.06, d = 0.5})       the whole chip swells once
 * Example:
 *   const c1 = ch18Chip(S, { x: 950, y: 224, anchor: 'start', parts: ['80', '÷', '17', '≈', '4.7'] });
 *   S.add(c1.write(), 'b1~ridge-0.2');  S.add(c1.lightOps(), 'b3~division');
 */
function ch18Chip(S, o = {}, parent) {
  const size = o.size ?? CH18.chip, fam = o.family || 'mono', wt = o.weight ?? 600;
  const OPS = '÷×=≈→+−';
  const parts = (o.parts || []).map(p => (typeof p === 'string' ? { t: p } : { ...p }))
    .map(p => ({ ...p, op: p.op ?? (p.t.trim().length === 1 && OPS.includes(p.t.trim())) }));
  const gap = o.gap ?? size * 0.4, padX = o.padX ?? size * 0.8;
  const widths = parts.map(p => S.measure(p.t, { size, weight: p.w || wt, family: fam }));
  const lead = o.lead ? { w: Math.round(size * 1.15), h: Math.round(size * 0.78), state: 'token', ...(o.lead === true ? {} : o.lead) } : null;
  const leadGap = lead ? size * 0.45 : 0;
  const textW = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, parts.length - 1) + (lead ? lead.w + leadGap : 0);
  const l2 = o.line2 ? (typeof o.line2 === 'string' ? { t: o.line2 } : o.line2) : null;
  const l2size = l2 ? (l2.size ?? Math.max(22, Math.round(size * 0.85))) : 0;
  const l2w = l2 ? S.measure(l2.t, { size: l2size, weight: 500, family: fam }) : 0;
  const w = o.w ?? Math.max(textW, l2w) + padX * 2;
  const h = o.h ?? (l2 ? size * 3.3 : size * 1.9);
  const cy = o.y ?? 540;
  const l = (o.anchor || 'middle') === 'start' ? (o.x ?? 0) : (o.x ?? 960) - w / 2;
  const tone = o.tone || 'neutral', r = o.r ?? Math.min(h / 2, 16);
  const g = S.g(null, parent);
  S.rect({ x: l, y: cy - h / 2, w, h, r, fill: '#0c1326' }, g);
  g.plate = S.rect({ x: l, y: cy - h / 2, w, h, r, fill: `url(#card-${tone})`, stroke: tone, strokeOpacity: 0.7, sw: 2 }, g);
  const y1 = l2 ? cy - size * 0.62 : cy + 1;
  let x = l + (w - textW) / 2;
  if (lead) {
    g.leadEl = libToken(S, { text: '', x: x + lead.w / 2, y: y1, w: lead.w, h: lead.h, size: 16, state: lead.state, decorative: true }, g);
    x += lead.w + leadGap;
  }
  g.parts = parts.map((p, i) => {
    const t = S.text(p.t, { x, y: y1, size, weight: p.w || wt, family: fam, color: p.tone || (p.op ? 'muted' : 'ink') });
    g.appendChild(t);
    Object.assign(t, { l: x, r: x + widths[i], cx: x + widths[i] / 2, w: widths[i], op: p.op, tone0: p.tone || (p.op ? 'muted' : 'ink') });
    x += widths[i] + gap;
    return t;
  });
  g.ops = g.parts.filter(t => t.op);
  if (l2) g.line2El = S.text(l2.t, { x: l + w / 2, y: cy + size * 0.78, size: l2size, weight: 500, family: fam, anchor: 'middle', color: l2.tone || 'muted' }, g);
  Object.assign(g, { l, r: l + w, t: cy - h / 2, b: cy + h / 2, cx: l + w / 2, cy, w, h });

  g.write = (a = {}) => {
    const t = gsap.timeline(), d = a.d ?? 0.35, st = a.stagger ?? 0.12;
    t.fromTo(g, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0);
    const plateEls = [...g.children].filter(c => c.tagName === 'rect');
    t.fromTo(plateEls, { autoAlpha: 0 }, { autoAlpha: 1, duration: d, ease: 'power2.out' }, 0);
    const seq = [g.leadEl, ...g.parts, a.line2 === false ? null : g.line2El].filter(Boolean);
    if (a.line2 === false && g.line2El) t.set(g.line2El, { autoAlpha: 0 }, 0);
    t.fromTo(seq, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: d, ease: 'power3.out', stagger: st }, d * 0.6);
    return t;
  };
  g.lightOps = (a = {}) => {
    const c = S.tone(a.tone || 'compute'), t = gsap.timeline(), st = a.stagger ?? 0.1, signs = a.signs || '÷×';
    g.ops.filter(op => signs.includes(op.textContent.trim())).forEach((op, i) => {
      t.fromTo(op, { fill: S.tone(op.tone0) }, { fill: c, duration: a.d ?? 0.35, ease: 'power1.inOut', immediateRender: false }, i * st);
      if (a.glow !== false) t.fromTo(op, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.3, duration: 0.18, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%', immediateRender: false }, i * st);
    });
    return t;
  };
  g.pulse = (a = {}) => gsap.fromTo(g, { scale: 1, transformOrigin: '50% 50%' }, { scale: a.scale ?? 1.06, duration: (a.d ?? 0.5) / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' });
  return g;
}
