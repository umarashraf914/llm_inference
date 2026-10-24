/* Shared builders for chapter 5, "The 30 millisecond puzzle". Loaded before every ch05 scene; read-only
   for scene authors.

   Visual language for the chapter (keep it in every scene):
   - Colour = meaning: amber = operations (FLOP, the signs ×, +, ÷, counts and rates of arithmetic, the
     arithmetic's share of the time); blue = tokens and plain numbers (the 'one token' pill, input and weight
     cards); white / grey = time and labels (the stopwatch, the 30 ms budget, rulers, notes). Coral is held
     back until the memory clue (s05 b6's 140 GB card, s07's coral remainder), so it lands as the clue.
   - The 'one token' pill is the same blue libToken chip wherever it appears (s01, s03, s04): ch05Token.
   - The '30 ms' stopwatch is the one the previous chapter ended on (s01, s03, s04, s07): ch05Stopwatch.
   - A power of ten is '10' with a real raised exponent, the exponent its own element (it pulses once per
     zero in s02, computes in place in s05): ch05Pow. Amber when it counts operations.
   - Time drawn to scale uses one scale all chapter: CH05.PX_PER_MS = 50, so the 30 ms budget is 1,500 px
     and the 0.1 ms of arithmetic is a 5 px amber sliver with the grey tag 'all the arithmetic, packed
     together' (s04 timeline, s06 bars, s07 thesis bar): ch05Sliver.
   - 'Writes on' in the storyboards is a left-to-right reveal: ch05Wipe.
   - Text sizes: labels 28-32 px, content 36-48 px, key numbers 56 px and up, mono for every number. */

const CH05 = {
  PX_PER_MS: 50,          // 1,500 px = 30 ms
  BUDGET_MS: 30,          // the per-token time (140 GB ÷ 4.8 TB/s = 29.2 ms, said as 30)
  ARITH_MS: 0.1,          // 10¹¹ operations ÷ 10¹⁵ per second
  SLIVER_PX: 5,           // 0.1 ms × 50 px/ms
  OPS_PER_TOKEN: 140e9,   // 70 billion weights × 2 (one multiply, one add)
  TOKEN_SIZE: 34,         // font size of the 'one token' pill
  PACKED: 'all the arithmetic, packed together',
};

/**
 * The blue 'one token' pill (a libToken chip), identical in every ch05 scene.
 * o: any libToken option; defaults {text: 'one token', size: CH05.TOKEN_SIZE}. Returns the libToken <g>
 * (helpers .pop .in .out .moveTo .flyIn .pulse .glow ..., geometry .cx .cy .l .r .t .b .w .h).
 */
function ch05Token(S, o = {}, parent) {
  return libToken(S, { text: 'one token', size: CH05.TOKEN_SIZE, ...o }, parent);
}

/**
 * The chapter's stopwatch, reading '30 ms' (one token's time, as ch04 ended): white hand, 60 ms per turn
 * so 30 ms points straight down. o: any libStopwatch option; defaults {value: 30, span: 60, size: 220,
 * readout: 'below'}. For an icon-sized watch pass {size: 64-100, readout: 'none'}.
 * Returns the libStopwatch <g> (.in .run .set .show .flash .cross ..., geometry .cx .cy .rad .l .r .t .b).
 */
function ch05Stopwatch(S, o = {}, parent) {
  return libStopwatch(S, { value: 30, span: 60, tone: 'neutral', readout: 'below', size: 220, ...o }, parent);
}

/**
 * A power of ten: '10' with a raised exponent drawn as its own <text>, so it can pulse or change.
 * exp: number or string ('11', '-4', '(11−15)'); '-' becomes a typographic minus.
 * o: {x, y (centre line of the '10'), size 56, anchor 'middle' | 'start' | 'end', tone 'compute',
 *     expTone (= tone), family 'display' | 'mono' | 'sans', weight 700, expScale 0.6}
 * Returns <g> with .baseEl ('10'), .expEl, and geometry .l .r .w .cx .cy, .expX (left of the exponent),
 * .expCx .expCy (its centre, for a callout), .size, .expSize. Put a unit after it at x = g.r + 14.
 */
function ch05Pow(S, exp, o = {}, parent) {
  const size = o.size ?? 56, fam = o.family || 'display', weight = o.weight ?? 700;
  const es = Math.round(size * (o.expScale ?? 0.6));
  const tone = o.tone || 'compute';
  const e = String(exp).replace(/-/g, '−');
  const bw = S.measure('10', { size, weight, family: fam });
  const ew = S.measure(e, { size: es, weight, family: fam });
  const gap = Math.round(size * 0.05), w = bw + gap + ew;
  const anchor = o.anchor || 'middle', x = o.x ?? 0, y = o.y ?? 0;
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  const ey = y - size * 0.36;
  const g = S.g(null, parent);
  g.baseEl = S.text('10', { x: x0, y, size, weight, family: fam, color: tone }, g);
  g.expEl = S.text(e, { x: x0 + bw + gap, y: ey, size: es, weight, family: fam, color: o.expTone || tone }, g);
  Object.assign(g, { l: x0, r: x0 + w, w, cx: x0 + w / 2, cy: y, expX: x0 + bw + gap, expCx: x0 + bw + gap + ew / 2, expCy: ey, size, expSize: es });
  return g;
}

/**
 * Write an element on, left to right (the storyboards' 'writes on'). The element is wrapped in a holder
 * <g> whose clip rect grows from zero width, driven by tween progress, so every frame is the same however
 * it is reached. The holder is hidden until the wipe starts, and the clip is removed once it completes, so
 * the element may later grow, move or fade freely. Call once per element, at build time.
 * o: {d 0.9, ease 'power2.inOut', pad 14 (clip margin round the element's box)}.
 * Returns the tween (for S.add); tween.holder is the wrapper.
 */
function ch05Wipe(S, el, o = {}) {
  const parent = el.parentNode;
  const holder = S.g(null, parent);
  parent.insertBefore(holder, el);
  holder.appendChild(el);
  const b = holder.getBBox(), pad = o.pad ?? 14;
  const id = `ch05-wipe-${(ch05Wipe.n = (ch05Wipe.n || 0) + 1)}`;
  const cp = S.el('clipPath', { id }, S.el('defs', null, holder));
  const W = b.width + 2 * pad;
  const rect = S.el('rect', { x: b.x - pad, y: b.y - pad, width: 0, height: b.height + 2 * pad }, cp);
  const p = { k: 0 };
  const apply = () => {
    rect.setAttribute('width', (W * p.k).toFixed(2));
    holder.style.visibility = p.k > 0 ? 'visible' : 'hidden';
    if (p.k >= 1) holder.removeAttribute('clip-path');
    else holder.setAttribute('clip-path', `url(#${id})`);
  };
  apply();
  const tw = gsap.fromTo(p, { k: 0 }, {
    k: 1, duration: o.d ?? 0.9, ease: o.ease || 'power2.inOut', immediateRender: false,
    onStart: apply, onUpdate: apply, onReverseComplete: apply,
  });
  tw.holder = holder;
  return tw;
}

/**
 * The arithmetic for one token packed into one block, on the chapter's time scale: 0.1 ms = 5 px amber
 * (s04's timeline, s06's bars, s07's thesis bar), with the small grey tag under (or over) it on a short
 * leader. o: {x (left edge, where the bar starts), y (bar centre), h 48, ms CH05.ARITH_MS (width =
 * ms × CH05.PX_PER_MS), tag true | false | text (default CH05.PACKED), tagSide 'below' | 'above',
 * tagGap 26 (leader length), tagSize 26}. The block is opaque amber; it stays legible at 5 px because it
 * is full-height and the tag points at it.
 * Returns <g> with .block (the rect), .tagG (leader + text; fade it on its own), .tagEl, .leader, and
 * geometry .l .r .w .cy .t .b (block only).
 */
function ch05Sliver(S, o = {}, parent) {
  const w = (o.ms ?? CH05.ARITH_MS) * CH05.PX_PER_MS, h = o.h ?? 48;
  const x = o.x ?? 210, cy = o.y ?? 540;
  const g = S.g(null, parent);
  g.block = S.rect({ x, y: cy - h / 2, w, h, r: Math.min(1.5, w / 2), fill: 'compute' }, g);
  if (o.tag !== false) {
    const text = typeof o.tag === 'string' ? o.tag : CH05.PACKED;
    const dir = (o.tagSide || 'below') === 'below' ? 1 : -1, size = o.tagSize ?? 26, gap = o.tagGap ?? 26;
    const lx = x + w / 2, y0 = cy + dir * (h / 2 + 6), y1 = cy + dir * (h / 2 + gap);
    g.tagG = S.g(null, g);
    g.leader = S.line({ x1: lx, y1: y0, x2: lx, y2: y1, stroke: 'muted', sw: 2, strokeOpacity: 0.7 }, g.tagG);
    g.tagEl = S.text(text, { x: lx - 6, y: y1 + dir * size * 0.85, size, color: 'muted', weight: 550 }, g.tagG);
  }
  Object.assign(g, { l: x, r: x + w, w, cy, t: cy - h / 2, b: cy + h / 2 });
  return g;
}
