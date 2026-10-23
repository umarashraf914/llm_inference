/* video/lib/tokens.js — shared film library: text and tokens.
 *
 *   libTokenize(text, o)            text -> token strings: 'Short wavelengths,' -> ['Short', ' wave', 'lengths', ',']
 *   libToken(S, o, parent)          one token chip: a rounded pill, optional ID / icon / badge / stripe, a colour state
 *   libTokenStrip(S, o, parent)     a row of chips: append, stream, push, states, prefix highlight, cut, split,
 *                                   reorder, reflow, wrap, context window
 *   libChatWindow(S, o, parent)     a chat app panel whose answer streams in token by token
 *   libBubble(S, o, parent)         a standalone speech bubble (a user's question, a reply), with typing
 *   libPromptStack(S, o, parent)    the assembled prompt as labelled segments drawn to a token scale
 *
 * Conventions (all of them):
 * - Build with S primitives into `parent` (default S.main). Every helper RETURNS a tween or timeline: place it
 *   with S.add(tween, at). Nothing here adds to S.tl, reads the clock or uses Math.random, so every frame is
 *   the same however it is reached (played or seeked).
 * - Anything with an entrance helper (pop, reveal, grow, drawOn, ...) is hidden at build time and appears
 *   when that helper runs; anything without one is visible as built.
 * - Helpers keep a plan of where things are (like fx.xform): call one component's helpers in time order.
 * - The root <g> of a strip, chat window, bubble or prompt stack is yours: fx.in / fx.out / fx.dim it, OR
 *   move/scale it with S.xset + fx.xform (not both: wrap it in a holder S.g() for that). A single libToken's
 *   root is moved by its own helpers (moveTo, travel, flyIn): use its .in() / .out(), not fx.in / fx.move.
 * - Colour = meaning. Token states (option `state`, helper `setState`):
 *     'token' (default) blue · 'new' blue with a white outline and glow (just made) · 'cached' teal (held, a hit)
 *     'prefill' amber (arithmetic to do) · 'recompute' blue with an amber outline · 'changed' violet (the edit)
 *     'bytes' coral · 'dim' grey (out of reach, not the subject) · 'ghost' dashed outline (not there yet, never
 *     computed) · 'slot' empty dashed slot · 'solid' solid blue (emphasis) · 'stop' grey with a white outline
 *     (the stop token) · 'plain' no pill, muted text (an ellipsis '…') · or {tone, style: 'soft'|'solid'|
 *     'outline'|'ghost'} · or {color: '#hex'} (a custom shade, e.g. one colour per word).
 * - Text a viewer must read is >= 24 px. Smaller chips (size < 24) are pictures: pass decorative: true, which
 *   marks them data-audit="ignore".
 */

/* ------------------------------------------------------------------ internals */
const __TOK = (() => {
  const BASE = '#0c1326', DARK = '#0a0f1e';
  const GRAD = ['compute', 'bytes', 'helps', 'struct', 'violet', 'neutral'];
  const f2 = v => Math.round(v * 100) / 100;

  function hexRGB(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  /** mix two colours (tone names or hex): t = 0 -> a, 1 -> b */
  function mix(S, a, b, t) {
    const A = hexRGB(S.tone(a)), B = hexRGB(S.tone(b));
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }

  // A skin spec: base (opaque underlay), grad (engine card gradient tone), flat + fo (flat tint), solid (solid
  // gradient tone or colour), stroke/so/sw/dash (outline), glow (filter tone), text (label colour), noText.
  const soft = t => ({ base: true, grad: t, flat: t === 'neutral' ? null : t, fo: 0.1,
    stroke: t === 'neutral' ? '#ffffff' : t, so: t === 'neutral' ? 0.28 : 0.8, sw: 2, text: 'ink' });
  const STATES = {
    token: soft('struct'), struct: soft('struct'),
    new: { ...soft('struct'), stroke: '#ffffff', so: 0.95, sw: 2.5, glow: 'struct', fo: 0.16 },
    cached: soft('helps'), helps: soft('helps'),
    prefill: soft('compute'), compute: soft('compute'),
    recompute: { ...soft('struct'), stroke: 'compute', so: 1, sw: 3 },
    changed: soft('violet'), violet: soft('violet'),
    bytes: soft('bytes'),
    dim: { base: true, grad: 'neutral', stroke: '#ffffff', so: 0.12, sw: 2, text: 'faint' },
    ghost: { stroke: 'struct', so: 0.7, sw: 2, dash: '7 6', text: 'muted' },
    slot: { stroke: 'struct', so: 0.55, sw: 2, dash: '7 6', text: 'muted', noText: true },
    solid: { base: true, solid: 'struct', text: DARK },
    stop: { base: true, grad: 'neutral', stroke: '#ffffff', so: 0.85, sw: 3, text: 'ink' },
    plain: { none: true, text: 'muted' },
  };
  function state(st, S) {
    if (st && typeof st === 'object') {
      if (st.color) {
        const c = st.color;
        if (st.style === 'solid') return { base: true, solid: c, text: DARK };
        return { base: true, flat: c, fo: 0.2, stroke: c, so: 0.85, sw: 2, text: 'ink' };
      }
      const tone = st.tone || 'struct', style = st.style || 'soft';
      if (style === 'solid') return { base: true, solid: tone, text: DARK };
      if (style === 'outline') return { base: true, grad: 'neutral', stroke: tone, so: 1, sw: 3, text: 'ink' };
      if (style === 'ghost') return { stroke: tone, so: 0.7, sw: 2, dash: '7 6', text: 'muted' };
      return soft(tone);
    }
    if (STATES[st || 'token']) return STATES[st || 'token'];
    if (GRAD.includes(st)) return soft(st);
    if (S) S.warn(`tokens: unknown state '${st}', using 'token'`);
    return STATES.token;
  }
  /** One skin <g>: the rects that paint a pill in a state. b: {x, y, w, h, r} */
  function skin(S, b, st, parent) {
    const g = S.g(null, parent);
    if (st.none) return g;
    const R = { x: b.x, y: b.y, w: b.w, h: b.h, r: b.r };
    if (st.base) S.rect({ ...R, fill: BASE }, g);
    if (st.solid) S.rect({ ...R, fill: GRAD.includes(st.solid) ? `url(#solid-${st.solid})` : st.solid }, g);
    if (st.grad) S.rect({ ...R, fill: `url(#card-${st.grad})` }, g);
    if (st.flat) S.rect({ ...R, fill: st.flat, fillOpacity: st.fo }, g);
    if (st.sw) g.edge = S.rect({ ...R, stroke: st.stroke, strokeOpacity: st.so, sw: st.sw, dash: st.dash, filter: st.glow ? `url(#glow-${st.glow})` : undefined }, g);
    return g;
  }
  /** Indices from a range spec: i, [a, b] (inclusive; negatives count from the end), an array of indices, or 'all'. */
  function idx(range, n) {
    const fix = i => (i < 0 ? n + i : i);
    if (range === undefined || range === 'all') return [...Array(n).keys()];
    if (Array.isArray(range)) {
      if (range.length > 2 || range.__list) return range.map(fix).filter(i => i >= 0 && i < n);
      const a = fix(range[0]), b = fix(range[1] ?? range[0]);
      const out = [];
      for (let i = Math.max(0, a); i <= Math.min(n - 1, b); i++) out.push(i);
      return out;
    }
    const i = fix(range);
    return i >= 0 && i < n ? [i] : [];
  }
  /** A rounded-rect path with separate radii on top and bottom (title bars etc.). */
  function rrPath(x, y, w, h, rt, rb) {
    return `M${x + rt},${y} H${x + w - rt} ${rt ? `A${rt},${rt} 0 0 1 ${x + w},${y + rt}` : ''} V${y + h - rb} ${rb ? `A${rb},${rb} 0 0 1 ${x + w - rb},${y + h}` : ''} H${x + rb} ${rb ? `A${rb},${rb} 0 0 1 ${x},${y + h - rb}` : ''} V${y + rt} ${rt ? `A${rt},${rt} 0 0 1 ${x + rt},${y}` : ''} Z`;
  }
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const easeInOut = p => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  /** A stable illustrative token ID from the text (not a real tokenizer's ID: say so on screen). */
  function fakeId(t) {
    let h = 2166136261;
    for (const c of String(t)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    return 100 + (h % 99800);
  }
  /** Hide an element at build time in a way GSAP's autoAlpha tweens understand. */
  function hide(e) { e.style.opacity = 0; e.style.visibility = 'hidden'; }
  /** A blue shade for request k (slightly different blues, deterministic). */
  function shade(S, k, seed) {
    const r = S.rand(((seed || 7) * 7919 + k * 104729) >>> 0);
    r(); const a = r(), b = r();
    const toward = a < 0.5 ? '#a9c8ff' : '#4d7fe6';
    return mix(S, 'struct', b < 0.33 ? '#7d8cff' : toward, 0.18 + 0.32 * r());
  }
  /** Chip metrics shared by libToken and the strip's layout. */
  function metrics(S, o) {
    const size = o.size || 30, h = o.h || Math.round(size * 1.85);
    const weight = o.weight || 600, fam = o.mono ? 'mono' : 'sans';
    const padX = o.padX ?? Math.round(size * 0.62);
    const text = String(o.text ?? '').trim();
    const tw = text ? S.measure(text, { size, weight, family: fam }) : 0;
    const iconS = o.icon ? Math.round(size * 1.1) : 0;
    const iconGap = o.icon && text ? Math.round(size * 0.3) : 0;
    const contentW = iconS + iconGap + tw;
    const hasId = o.id !== undefined && o.id !== null && o.id !== false;
    const idPos = o.idPos || 'below';
    const inline = hasId && idPos === 'inline';
    const idSize = o.idSize || Math.max(24, Math.round(size * 0.8));
    const idRaw = hasId ? (o.id === true ? String(fakeId(text)) : String(o.id)) : '';
    const idStr = inline ? (o.idPrefix ?? 'ID ') + idRaw : idRaw;
    const iw = inline ? S.measure(idStr, { size: idSize, weight: 500, family: 'mono' }) : 0;
    const dg = Math.round(padX * 0.7);
    const wNarrow = Math.max(o.minW ?? h, contentW + 2 * padX);
    const w = o.w || (inline ? padX + contentW + dg * 2 + 2 + iw + padX : wNarrow);
    return { size, h, weight, fam, padX, text, tw, iconS, iconGap, contentW, hasId, idPos, inline, idSize, idStr, iw, dg, wNarrow, w };
  }
  /**
   * Line layout for chips of widths ws: returns [{x (left), y (centre), line}].
   * L: {x, y, maxW, align: start|middle, gap, lineH, vertical}
   */
  function layout(ws, L) {
    const out = [];
    if (L.vertical) {
      ws.forEach((w, i) => out.push({ x: L.align === 'middle' ? L.x - w / 2 : L.x, y: L.y + i * L.lineH, line: i }));
      return out;
    }
    const lines = [[]];
    let cur = 0;
    ws.forEach((w, i) => {
      const ln = lines[lines.length - 1];
      const need = (ln.length ? L.gap : 0) + w;
      if (L.maxW && ln.length && cur + need > L.maxW + 0.5) { lines.push([i]); cur = w; } else { ln.push(i); cur += need; }
    });
    lines.forEach((ln, li) => {
      const tot = ln.reduce((a, i) => a + ws[i], 0) + L.gap * Math.max(0, ln.length - 1);
      let x = L.align === 'middle' ? L.x - tot / 2 : L.x;
      ln.forEach(i => { out[i] = { x, y: L.y + li * L.lineH, line: li }; x += ws[i] + L.gap; });
    });
    return out;
  }
  /** A text change that is a pure function of time: before the tween the old text, after it the new. */
  function retext(t, from, to, d = 0.3) {
    const p = { v: 0 };
    const tl = gsap.timeline();
    tl.fromTo(t, { opacity: 1 }, { opacity: 0, duration: d / 2, ease: 'power1.in', immediateRender: false }, 0);
    tl.fromTo(p, { v: 0 }, { v: 1, duration: d, ease: 'none', immediateRender: false,
      onUpdate: () => { t.textContent = p.v < 0.5 ? from : to; } }, 0);
    tl.fromTo(t, { opacity: 0 }, { opacity: 1, duration: d / 2, ease: 'power1.out', immediateRender: false }, d / 2);
    return tl;
  }
  /** The tone a state stands for (icons, badges): 'cached' -> helps, 'prefill' -> compute ... */
  function toneOf(st) {
    if (st && typeof st === 'object') return st.color || st.tone || 'struct';
    return { cached: 'helps', helps: 'helps', prefill: 'compute', compute: 'compute', changed: 'violet', violet: 'violet',
      bytes: 'bytes', dim: 'muted', stop: 'ink', plain: 'muted' }[st] || 'struct';
  }
  return { toneOf, BASE, DARK, GRAD, f2, mix, STATES, state, skin, idx, rrPath, clamp, easeInOut, fakeId, hide, shade, metrics, layout, retext };
})();

/* ------------------------------------------------------------------ libTokenize */
/**
 * libTokenize — split text into plausible LLM tokens: each word with its leading space is one token,
 * punctuation is its own token, and words listed in `splits` break into pieces.
 *   text: the string.
 *   o.splits {}: {word: [pieces]} matched on the bare lower-case word, e.g. {wavelengths: ['wave', 'lengths']}.
 * Returns an array of strings (leading spaces kept) whose concatenation is the original text.
 * Illustrative only: real tokenizers differ; scenes that show IDs or splits should say 'illustrative'.
 *   const toks = libTokenize('Short wavelengths, the blues', { splits: { wavelengths: ['wave', 'lengths'] } });
 *   // ['Short', ' wave', 'lengths', ',', ' the', ' blues']
 */
function libTokenize(text, o = {}) {
  const splits = o.splits || {};
  const raw = String(text).match(/ ?[A-Za-z'’]+| ?[0-9]+| ?[^\sA-Za-z0-9]|\s+/g) || [];
  const out = [];
  for (const t of raw) {
    const key = t.trim().toLowerCase();
    if (splits[key]) {
      const lead = t.startsWith(' ') ? ' ' : '';
      const word = t.trim();
      let k = 0;   // cut the original word at the piece lengths, keeping its capitalisation
      splits[key].forEach((p, i) => { out.push((i === 0 ? lead : '') + word.slice(k, k + p.length)); k += p.length; });
    } else out.push(t);
  }
  return out;
}

/* ------------------------------------------------------------------ libToken */
/**
 * libToken — one token chip: a rounded pill with the token's text in a colour state, with an optional
 * token ID beneath (or above, or inline 'fox | ID 4271'), an icon before the text, and a thin packet frame.
 * o: text '' ('' = an unlabelled chip), x 0, y 0 (centre y), anchor 'middle' (x = centre) | 'start' (x = left
 *    edge), size 30 (font px), h round(size*1.85), w (fixed width; default fits the content), minW h, padX
 *    round(size*0.62), r round(h*0.3), state 'token' (see the list at the top), mono false, weight 600,
 *    id (number | string | true = an illustrative stable ID), idPos 'below' | 'above' | 'inline', idPrefix
 *    'ID ' (inline), idSize max(24, size*0.8), idColor 'muted', idHidden false (inline: the chip starts
 *    narrow, showing only the text, and .showId() widens it), icon (icon id, drawn before the text),
 *    iconColor (state's text colour), frame false (true: a thin rectangular packet frame round the chip),
 *    hidden false, decorative false (size < 24: marks it data-audit="ignore").
 * Returns <g> with .body (scaled by pop/pulse), .skin (current skin), .label, .iconEl, .idEl, .idG (inline),
 *    .frameEl, and geometry as drawn: .x .y (top) .w .h .l .r .t .b .cx .cy .rad .wNarrow, .text, .state.
 *    .__dx/.__dy is the planned offset (where helpers have moved it).
 * Helpers (each returns a tween/timeline for S.add; call in time order):
 *    .pop({d: 0.5, from: 0.5}) pop in · .in({from: 'up', d: 0.6, dist: 30}) slide in · .out({d: 0.35})
 *    .flyIn([x, y], {d: 0.8}) fly in from a point (parent coords) · .moveTo([x, y], {d: 0.7}) centre to a point
 *    .moveBy(dx, dy, {d}) · .travel(pathD | <path>, {d: 1, ease, appear}) the centre follows a path (start it at
 *        the chip's current centre; appear: fades in as it sets off)
 *    .setState(state, {d: 0.4}) crossfade to another colour state · .swap(text, {state, d: 0.35}) relabel
 *    .pulse({scale: 1.12, d: 0.5}) · .glow({tone: 'white', hold: 0.6, d: 0.3}) a ring flashes (hold: Infinity
 *        keeps it; .unglow() removes it) · .glowId({hold}) ring round the ID only
 *    .showId({d: 0.5}) the ID appears (inline + idHidden: the chip widens to reveal it)
 *    .stripe(tones, {d: 0.5}) a band in the neighbours' colours appears along the chip's bottom (what attention
 *        mixed in) · .badge(text, {tone: 'helps', d: 0.4}) a small numbered disc clips onto the top-right corner
 *    .textOff({d: 0.4}) / .textOn() the letters fade (the model's view: plain pills)
 *   const tok = libToken(S, { text: 'fox', x: 760, y: 500, id: 4271, idPos: 'inline', idHidden: true });
 *   S.add(tok.flyIn([200, 500]), 'b2~fox');
 *   S.add(tok.showId(), 'b2~number');
 *   S.add(tok.glowId(), 'b2~token');
 */
function libToken(S, o = {}, parent) {
  const T = __TOK;
  const M = T.metrics(S, o);
  const { size, h, padX, text, tw, iconS, iconGap, contentW, inline, idSize, idStr, iw, dg, wNarrow, w } = M;
  const cy = o.y || 0;
  const wStart = inline && o.idHidden ? wNarrow : w;
  const x = (o.anchor || 'middle') === 'middle' ? (o.x || 0) - wStart / 2 : (o.x || 0);
  const y = cy - h / 2, r = Math.min(h / 2, o.r ?? Math.round(h * 0.3));
  if (size < 24 && !o.decorative && text) S.warn(`libToken '${text}': ${size}px text; pass decorative: true if it is only a picture`);
  const g = S.g(null, parent);
  if (o.decorative) g.setAttribute('data-audit', 'ignore');
  if (o.frame) {
    const fp = Math.round(h * 0.16);
    g.frameEl = S.rect({ x: x - fp, y: y - fp, w: wStart + 2 * fp, h: h + 2 * fp, r: 6, stroke: o.frameTone || 'struct', strokeOpacity: 0.55, sw: 1.5 }, g);
  }
  const body = S.g(null, g);
  const skinG = S.g(null, body);
  let st = T.state(o.state, S);
  g.skin = T.skin(S, { x, y, w: wStart, h, r }, st, skinG);
  const stripeG = S.g(null, body);
  // content: [icon][gap][text], centred in the text part of the chip
  const textPartW = inline ? padX + contentW + padX : (o.w ? w : wNarrow);
  const c0 = x + textPartW / 2 - contentW / 2;
  if (o.icon) g.iconEl = S.icon(o.icon, { x: c0 + iconS / 2, y: cy, size: iconS, color: o.iconColor || (st.text === T.DARK ? T.DARK : T.toneOf(o.state)) }, body);
  if (text) {
    g.label = S.text(text, { x: c0 + iconS + iconGap + tw / 2, y: cy + 1, size, weight: M.weight, family: M.fam, anchor: 'middle', color: st.text,
      maxW: o.w ? Math.max(10, w - padX) : undefined }, body);
    if (st.noText) g.label.style.opacity = 0;
  }
  if (inline) {
    g.idG = S.g(null, body);
    const dx = x + padX + contentW + dg;
    g.divider = S.line({ x1: dx, y1: y + h * 0.24, x2: dx, y2: y + h * 0.76, stroke: '#ffffff', strokeOpacity: 0.3, sw: 2 }, g.idG);
    g.idEl = S.text(idStr, { x: dx + 2 + dg, y: cy + 1, size: idSize, weight: 500, family: 'mono', color: o.idColor || 'muted' }, g.idG);
    if (o.idHidden) g.idG.style.opacity = 0;
    g.idBox = { x: dx - 2, w: x + w - (dx - 2) };
  } else if (M.hasId) {
    const iy = M.idPos === 'above' ? y - 10 - idSize * 0.55 : y + h + 10 + idSize * 0.55;
    g.idEl = S.text(idStr, { x: x + w / 2, y: iy, size: idSize, weight: 500, family: 'mono', anchor: 'middle', color: o.idColor || 'muted' }, g);
  }
  Object.assign(g, { body, skinG, stripeG, x, y, w, h, wNarrow, l: x, t: y, b: y + h, cx: x + wStart / 2, cy, rad: r, text, size, state: o.state || 'token' });
  g.r = x + w;
  g.__dx = 0; g.__dy = 0; g.__w = wStart; g.__st = st; g.__textOn = !st.noText;
  if (o.hidden) T.hide(g);

  // ---- motion (planned offset on the root: GSAP x/y)
  const go = (to, d, ease) => {
    const from = { x: g.__dx, y: g.__dy };
    g.__dx = to[0]; g.__dy = to[1];
    return gsap.fromTo(g, from, { x: to[0], y: to[1], duration: d, ease: ease || 'power3.inOut', immediateRender: false });
  };
  g.moveTo = (pt, mo = {}) => go([pt[0] - g.cx, pt[1] - g.cy], mo.d ?? 0.7, mo.ease);
  g.moveBy = (dx, dy, mo = {}) => go([g.__dx + (dx || 0), g.__dy + (dy || 0)], mo.d ?? 0.5, mo.ease);
  g.pop = (po = {}) => {
    const d = po.d ?? 0.5, tl = gsap.timeline();
    tl.fromTo(g, { autoAlpha: 0 }, { autoAlpha: 1, duration: Math.min(0.18, d * 0.4), ease: 'power1.out' }, 0);
    tl.fromTo(body, { scale: po.from ?? 0.5, transformOrigin: '50% 50%' }, { scale: 1, duration: d, ease: po.ease || 'back.out(2.2)', transformOrigin: '50% 50%' }, 0);
    return tl;
  };
  g.in = (io = {}) => {
    const dist = io.dist ?? 30, from = io.from || 'up';
    const off = { up: [0, dist], down: [0, -dist], left: [dist, 0], right: [-dist, 0] }[from] || [0, 0];
    return gsap.fromTo(g, { autoAlpha: 0, x: g.__dx + off[0], y: g.__dy + off[1] },
      { autoAlpha: 1, x: g.__dx, y: g.__dy, duration: io.d ?? 0.6, ease: io.ease || 'power3.out' });
  };
  g.out = (oo = {}) => gsap.fromTo(g, { autoAlpha: 1 }, { autoAlpha: 0, duration: oo.d ?? 0.35, ease: 'power2.in', immediateRender: false });
  g.flyIn = (pt, fo = {}) => {
    const d = fo.d ?? 0.8, tl = gsap.timeline();
    tl.fromTo(g, { autoAlpha: 0, x: pt[0] - g.cx, y: pt[1] - g.cy }, { autoAlpha: 1, x: g.__dx, y: g.__dy, duration: d, ease: fo.ease || 'power3.inOut' }, 0);
    tl.fromTo(body, { scale: fo.scale ?? 0.85, transformOrigin: '50% 50%' }, { scale: 1, duration: d, ease: 'power2.out', transformOrigin: '50% 50%' }, 0);
    return tl;
  };
  g.travel = (path, to = {}) => {
    const pe = typeof path === 'string' ? S.path({ d: path }, parent || S.main) : path;
    const L = pe.getTotalLength(), end = pe.getPointAtLength(L);
    const fromD = [g.__dx, g.__dy];
    g.__dx = end.x - g.cx; g.__dy = end.y - g.cy;
    const d = to.d ?? 1, proxy = { t: 0 }, tl = gsap.timeline();
    if (to.appear) tl.fromTo(g, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'power1.out' }, 0);
    tl.fromTo(proxy, { t: 0 }, { t: 1, duration: d, ease: to.ease || 'power1.inOut', immediateRender: false,
      onUpdate: () => {
        if (proxy.t <= 0) { gsap.set(g, { x: fromD[0], y: fromD[1] }); return; }
        const p = pe.getPointAtLength(L * proxy.t);
        gsap.set(g, { x: p.x - g.cx, y: p.y - g.cy });
      } }, 0);
    return tl;
  };
  // ---- looks
  g.setState = (state, so = {}) => {
    const nst = T.state(state, S), prev = g.skin, prevCol = S.tone(g.__st.text), prevOn = g.__textOn;
    const nk = T.skin(S, { x, y, w: g.__w, h, r }, nst, skinG);
    nk.style.opacity = 0;
    g.skin = nk; g.__st = nst; g.state = state;
    const d = so.d ?? 0.4, tl = gsap.timeline();
    tl.fromTo(nk, { opacity: 0 }, { opacity: 1, duration: d, ease: 'power1.inOut', immediateRender: false }, 0);
    tl.fromTo(prev, { opacity: 1 }, { opacity: 0, duration: d, ease: 'power1.inOut', immediateRender: false }, 0);
    if (g.label) {
      const col = S.tone(nst.text);
      if (col !== prevCol) tl.fromTo(g.label, { attr: { fill: prevCol } }, { attr: { fill: col }, duration: d, ease: 'power1.inOut', immediateRender: false }, 0);
      const on = !nst.noText;
      if (on !== prevOn) { tl.fromTo(g.label, { opacity: prevOn ? 1 : 0 }, { opacity: on ? 1 : 0, duration: d, immediateRender: false }, 0); g.__textOn = on; }
    }
    return tl;
  };
  g.swap = (txt, so = {}) => {
    const tl = gsap.timeline();
    const now = g.label ? (g.__text ?? text) : '';
    const nt = String(txt).trim();
    if (g.label) {
      if (S.measure(nt, { size, weight: M.weight, family: M.fam }) > g.__w - padX * 0.6) S.warn(`libToken.swap: '${nt}' is wider than its chip`);
      tl.add(T.retext(g.label, now, nt, so.d ?? 0.35), 0);
      g.__text = nt;
    }
    if (so.state) tl.add(g.setState(so.state, { d: so.d ?? 0.35 }), 0);
    return tl;
  };
  g.textOff = (to = {}) => { const on = g.__textOn; g.__textOn = false; return g.label ? gsap.fromTo(g.label, { opacity: on ? 1 : 0 }, { opacity: 0, duration: to.d ?? 0.4, ease: 'power1.inOut', immediateRender: false }) : gsap.timeline(); };
  g.textOn = (to = {}) => { const on = g.__textOn; g.__textOn = true; return g.label ? gsap.fromTo(g.label, { opacity: on ? 1 : 0 }, { opacity: 1, duration: to.d ?? 0.4, ease: 'power1.inOut', immediateRender: false }) : gsap.timeline(); };
  g.pulse = (po = {}) => gsap.fromTo(body, { scale: 1, transformOrigin: '50% 50%' },
    { scale: po.scale ?? 1.12, duration: (po.d ?? 0.5) / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%', immediateRender: false });
  const rings = {};
  const ring = (key, bx, bw, tone) => {
    if (!rings[key]) {
      const c = tone === 'white' || !tone ? '#ffffff' : S.tone(tone);
      rings[key] = S.rect({ x: bx - 5, y: y - 5, w: bw + 10, h: h + 10, r: r + 5, stroke: c, sw: 2.5, filter: `url(#glow-${tone && tone !== 'white' ? tone : 'struct'})` }, body);
      rings[key].setAttribute('data-audit', 'ignore');
      rings[key].style.opacity = 0;
      rings[key].__on = false;
    }
    return rings[key];
  };
  const flash = (rg, go) => {
    const d = go.d ?? 0.3, tl = gsap.timeline(), was = rg.__on;
    tl.fromTo(rg, { opacity: was ? 1 : 0 }, { opacity: 1, duration: d, ease: 'power2.out', immediateRender: false }, 0);
    if (go.hold !== Infinity) { tl.fromTo(rg, { opacity: 1 }, { opacity: 0, duration: d * 1.6, ease: 'power2.in', immediateRender: false }, d + (go.hold ?? 0.6)); rg.__on = false; } else rg.__on = true;
    return tl;
  };
  g.glow = (go = {}) => flash(ring('all-' + (go.tone || 'white'), x, g.__w, go.tone), go);
  g.unglow = (uo = {}) => {
    const tl = gsap.timeline();
    Object.values(rings).forEach(rg => { if (rg.__on) { tl.fromTo(rg, { opacity: 1 }, { opacity: 0, duration: uo.d ?? 0.4, immediateRender: false }, 0); rg.__on = false; } });
    return tl;
  };
  g.glowId = (go = {}) => {
    if (g.idBox) return flash(ring('id', g.idBox.x, g.idBox.w, go.tone), go);
    if (!g.idEl) return gsap.timeline();
    if (!rings.idb) {
      const iw2 = S.measure(idStr, { size: idSize, weight: 500, family: 'mono' }) + 24, ih = idSize * 1.5;
      const iy = parseFloat(g.idEl.getAttribute('y'));
      rings.idb = S.rect({ x: x + w / 2 - iw2 / 2, y: iy - ih / 2, w: iw2, h: ih, r: ih / 2, stroke: '#ffffff', sw: 2.5, filter: 'url(#glow-struct)' }, g);
      rings.idb.setAttribute('data-audit', 'ignore'); rings.idb.style.opacity = 0; rings.idb.__on = false;
    }
    return flash(rings.idb, go);
  };
  g.showId = (so = {}) => {
    const d = so.d ?? 0.5, tl = gsap.timeline();
    if (inline) {
      if (g.__w < w) {
        skinG.querySelectorAll('rect').forEach(rc => tl.fromTo(rc, { attr: { width: g.__w } }, { attr: { width: w }, duration: d, ease: 'power3.inOut', immediateRender: false }, 0));
        if (g.frameEl) { const fp = Math.round(h * 0.16); tl.fromTo(g.frameEl, { attr: { width: g.__w + 2 * fp } }, { attr: { width: w + 2 * fp }, duration: d, ease: 'power3.inOut', immediateRender: false }, 0); }
        g.__w = w;
      }
      tl.fromTo(g.idG, { opacity: 0 }, { opacity: 1, duration: d * 0.7, ease: 'power1.out', immediateRender: false }, d * 0.45);
    } else if (g.idEl) {
      tl.fromTo(g.idEl, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: d, ease: 'power2.out' }, 0);
    }
    return tl;
  };
  g.stripe = (tones, so = {}) => {
    const list = (Array.isArray(tones) ? tones : [tones]).map(t => S.tone(t));
    const bh = Math.max(5, Math.round(h * 0.13)), inset = Math.max(r * 0.75, 8), by = y + h - bh - Math.round(h * 0.11);
    const bw = (g.__w - 2 * inset) / list.length;
    const sg = S.g(null, stripeG);
    sg.setAttribute('data-audit', 'ignore');
    list.forEach((c, k) => S.rect({ x: x + inset + k * bw + (k ? 1.5 : 0), y: by, w: bw - (k < list.length - 1 ? 1.5 : 0) - (k ? 1.5 : 0), h: bh, r: bh / 2, fill: c, fillOpacity: 0.95 }, sg));
    return gsap.fromTo(sg, { autoAlpha: 0, scaleX: 0.2, transformOrigin: '50% 50%' }, { autoAlpha: 1, scaleX: 1, duration: so.d ?? 0.5, ease: 'power3.out', transformOrigin: '50% 50%' });
  };
  g.badge = (txt, bo = {}) => {
    const br = Math.max(17, Math.round(size * 0.52));
    const bx = x + g.__w - Math.round(br * 0.35), by = y + Math.round(br * 0.2);
    const bg = S.g(null, g);
    const tone = bo.tone || 'helps';
    S.circle({ x: bx, y: by, r: br, fill: T.BASE }, bg);
    S.circle({ x: bx, y: by, r: br, fill: `url(#solid-${T.GRAD.includes(tone) ? tone : 'helps'})` }, bg);
    const bt = S.text(String(txt), { x: bx, y: by + 1, size: Math.max(24, Math.round(br * 1.25)), weight: 750, anchor: 'middle', color: T.DARK }, bg);
    bt.setAttribute('data-audit', 'ignore');   // the digit sits inside its own disc, which overlaps the chip edge by design
    g.badgeEl = bg;
    return gsap.fromTo(bg, { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: bo.d ?? 0.4, ease: 'back.out(2.6)', transformOrigin: '50% 50%' });
  };
  return g;
}

/* ------------------------------------------------------------------ libTokenStrip */
/**
 * libTokenStrip — a row of token chips (the film's basic picture of text), laid out left to right and
 * wrapping inside maxW (or stacked as a column). One layout engine places every chip, so appends, splits,
 * reorders and reflows all glide to their new places.
 * o: x 0 (left edge; the centre with align 'middle'), y 0 (centre of the first line), tokens [] (strings or
 *    {t, id, state, w, icon}), size 30, h round(size*1.85), gap 10, padX, w (fixed chip width: columns of two
 *    strips line up), minW h, maxW (wrap width; default one line), lineGap round(h*0.45) (+ room for IDs),
 *    align 'start' | 'middle' (each line centred on x), vertical false (a column), state 'token' (default
 *    state), shades false (true or a seed: each chip a slightly different blue, e.g. different users'
 *    requests), mono false, weight 600, ids false (true: illustrative stable IDs from the text; or give tokens
 *    {t, id}), idPos 'below' | 'above', idSize, slots 0 (empty dashed slots after the tokens; append fills
 *    them), slotW (default w or h*1.6), joined false (start as one sentence bar; .cut() breaks it into chips;
 *    one line only), hidden false (start with every chip hidden: .reveal() them), window (a context-window
 *    outline: {n (chip slots) | w (px), label, tone 'struct', dashed true}), decorative false.
 * Returns <g> (root) with .content (inner group: scrolled by .shift/.push), .tokens[] (libToken chips in
 *    order, each with .i, .line), .slots[], .items[] (chips and slots in layout order), .bar (joined bar),
 *    .windowEl, .windowLabel, .lineH, .h, .size and .l .r .t .b .w of the initial layout.
 * Helpers (each returns a tween/timeline; call them in time order; a range is i | [a, b] | 'all' | [i, j, k, ...]):
 *    .append(t | {t, id, state}, {from: [x, y] | via: pathD, d, state})  a chip joins the end (or fills the first
 *        slot): pops in, flies in from a point, or rides a path (e.g. a return arrow) and lands. tl.token = chip
 *    .stream(list, {every: 0.25, ...append})   append several, one every `every` s
 *    .push(t, {keep, d: 0.5, drop: true})      sliding window: append, scroll left so the last `keep` chips show,
 *        and the ones that fall out drop below the line and turn grey ('out of reach')
 *    .reveal(range | 'slots', {every: 0.08, d}) pop in chips that already exist (hidden until then)
 *    .setState(range, state, {d: 0.4, stagger: 0})   recolour (stagger > 0 sweeps left to right)
 *    .highlight(n, {tone: 'helps', label, d: 0.8, pad: 8})  a band behind the first n chips ('prefix'); call
 *        again to grow or shrink it (0 collapses it); any earlier label fades. tl.labelEl = the label
 *    .cut({d: 0.9})                 joined sentence bar -> separate chips (cut marks, then they part)
 *    .split(i, pieces, {d: 0.9})    chip i cracks into pieces in place; the rest make room. tl.pieces = chips
 *    .reorder(order, {d: 0.9})      new order (array of current token indices); chips that jump forward arc over
 *    .relayout({maxW, vertical, align, x, y, gap, lineGap}, {d: 0.9, stagger: 0.02})  reflow: a grid, a column...
 *    .swap(i, text, {state})        relabel chip i ('t2' -> 'XX') · .textOff(range) / .textOn(range) letters fade
 *    .showIds({stagger: 0.05}) · .badges(range, labels, {tone, stagger}) · .stripe(i, tones)
 *    .pulse(range, {stagger: 0.12, scale}) · .glow(range, {tone, hold}) · .drop(range, {dy, state: 'dim'})
 *    .lift(range, {dy: -14})        raise chips a little (brighten them yourself with setState)
 *    .shift(n, {d: 0.6})            scroll the content so chip n sits at the strip's left edge
 *    .showWindow({d: 0.6}) / .solidWindow({d: 0.5}) the context-window outline appears / turns solid
 *    .bracket(a, b, {label, up, tone, size}) -> a bracket <g> under (or over) chips a..b, hidden until its
 *        .drawOn({d: 0.6}) (fade it with fx.out)
 * Geometry (planned, in the strip's coordinates, after the helpers called so far):
 *    .at(i) -> {x1, x2, cx, cy, t, b} · .span(a, b) · .next(t) -> {x, y} centre where the next append lands
 *   const s = libTokenStrip(S, { x: 960, y: 260, align: 'middle', tokens: ['the', ' quick', ' brown', ' fox', ' jumps'], joined: true });
 *   S.add(fx.in(s, { from: 'fade' }), 'b1');
 *   S.add(s.cut(), 'b1~cut');
 *   S.add(s.append(' over', { via: returnArrow.d }), 'b2~appended');
 *   S.add(s.highlight(3, { label: 'prefix' }), 'b3~token for token');
 */
function libTokenStrip(S, o = {}, parent) {
  const T = __TOK;
  const size = o.size || 30, h = o.h || Math.round(size * 1.85), gap = o.gap ?? 10;
  const weight = o.weight || 600, fam = o.mono ? 'mono' : 'sans';
  const padX = o.padX ?? Math.round(size * 0.62), minW = o.minW ?? h;
  const idSize = o.idSize || Math.max(24, Math.round(size * 0.8));
  const norm = t => (t && typeof t === 'object' ? t : { t: String(t) });
  const specs = (o.tokens || []).map(norm);
  const anyIds = !!o.ids || specs.some(t => t.id !== undefined && t.id !== null);
  const idPos = o.idPos || 'below';
  const idRoom = anyIds ? idSize + 14 : 0;
  const slotW = o.slotW || o.w || Math.round(h * 1.6);
  const L = { x: o.x || 0, y: o.y || 0, maxW: o.maxW, align: o.align || 'start', gap, vertical: !!o.vertical,
    lineH: h + (o.lineGap ?? Math.round(h * (o.vertical ? 0.25 : 0.45))) + idRoom };
  const root = S.g(null, parent);
  if (o.decorative) root.setAttribute('data-audit', 'ignore');
  if (size < 24 && !o.decorative) S.warn(`libTokenStrip: ${size}px chips; pass decorative: true if they are only a picture`);
  const winG = S.g(null, root);
  const content = S.g(null, root);
  const hiG = S.g(null, content), barG = S.g(null, content), tokG = S.g(null, content), decoG = S.g(null, content);
  let made = 0;
  const chipSpec = (it, extra = {}) => {
    const st = it.state || extra.state || o.state;
    return { text: it.t, size, h, w: it.w || o.w, padX, minW, weight, mono: o.mono, state: st, icon: it.icon,
      id: it.id ?? (o.ids ? true : undefined), idPos: idPos === 'above' ? 'above' : 'below', idSize, decorative: o.decorative };
  };
  const widthOf = sp => T.metrics(S, sp).w;
  const make = (sp, p) => {
    const k = made++;
    if (o.shades && !sp.state) sp = { ...sp, state: { color: T.shade(S, k, o.shades === true ? 7 : o.shades) } };
    const c = libToken(S, { ...sp, x: p.x, y: p.y, anchor: 'start' }, tokG);
    c.kind = 'token'; c.x0 = p.x; c.cy0 = p.y; c.line = p.line; c.__drop = 0; c.__lift = 0;
    return c;
  };
  const makeSlot = p => {
    const c = libToken(S, { text: '', x: p.x, y: p.y, anchor: 'start', size, h, w: slotW, state: 'slot' }, tokG);
    c.kind = 'slot'; c.x0 = p.x; c.cy0 = p.y; c.line = p.line; c.__drop = 0; c.__lift = 0;
    return c;
  };
  // ---- initial chips
  const sps = specs.map(it => ({ ...chipSpec(it), raw: it.t }));
  const ws = sps.map(widthOf).concat(Array(o.slots || 0).fill(slotW));
  const P0 = T.layout(ws, L);
  root.items = sps.map((sp, i) => { const c = make(sp, P0[i]); c.raw = sp.raw; return c; });
  for (let k = 0; k < (o.slots || 0); k++) root.items.push(makeSlot(P0[sps.length + k]));
  const sync = () => {
    root.tokens = root.items.filter(c => c.kind === 'token');
    root.slots = root.items.filter(c => c.kind === 'slot');
    root.tokens.forEach((c, i) => { c.i = i; });
  };
  sync();
  if (o.hidden) root.items.forEach(c => T.hide(c));

  // ---- plan helpers
  const geom = c => ({ x1: c.x0 + c.__dx, x2: c.x0 + c.__dx + c.__w, cx: c.x0 + c.__dx + c.__w / 2, cy: c.cy0 + c.__dy, t: c.cy0 + c.__dy - h / 2, b: c.cy0 + c.__dy + h / 2 });
  const scrollX = () => (content.__xf ? content.__xf.x : 0);
  const relayoutInto = (tl, at, ro = {}) => {
    const P = T.layout(root.items.map(c => c.__w), L);
    const d = ro.d ?? 0.6, ease = ro.ease || 'power3.inOut';
    root.items.forEach((c, k) => {
      c.line = P[k].line;
      const tx = P[k].x - c.x0, ty = P[k].y - c.cy0 + c.__drop + c.__lift;
      if (Math.abs(tx - c.__dx) < 0.01 && Math.abs(ty - c.__dy) < 0.01) return;
      const arc = ro.arc && tx < c.__dx - c.__w ? -(h * 1.15) : 0;
      if (arc) {
        tl.fromTo(c, { x: c.__dx }, { x: tx, duration: d, ease, immediateRender: false }, at + k * (ro.stagger || 0));
        tl.fromTo(c, { y: c.__dy }, { y: c.__dy + arc, duration: d / 2, ease: 'power2.out', immediateRender: false }, at + k * (ro.stagger || 0));
        tl.fromTo(c, { y: c.__dy + arc }, { y: ty, duration: d / 2, ease: 'power2.in', immediateRender: false }, at + k * (ro.stagger || 0) + d / 2);
      } else {
        tl.fromTo(c, { x: c.__dx, y: c.__dy }, { x: tx, y: ty, duration: d, ease, immediateRender: false }, at + k * (ro.stagger || 0));
      }
      c.__dx = tx; c.__dy = ty;
    });
  };
  const pick = range => {
    if (range === 'slots') return root.slots.slice();
    if (range === 'all') return root.items.slice();
    return T.idx(range, root.tokens.length).map(i => root.tokens[i]);
  };

  // ---- joined sentence bar (one line): chips start as plain words in a bar; .cut() parts them
  if (o.joined && root.tokens.length) {
    const sp = S.measure(' ', { size, weight, family: fam });
    const tws = root.tokens.map(c => S.measure(c.text, { size, weight, family: fam }));
    const lead = root.tokens.map((c, i) => (i > 0 && /^\s/.test(c.raw) ? sp : 0));
    const total = tws.reduce((a, b) => a + b, 0) + lead.reduce((a, b) => a + b, 0);
    const first = root.tokens[0], last = root.tokens[root.tokens.length - 1];
    const mid = (first.l + last.r) / 2;
    let jx = mid - total / 2;
    root.__cutMarks = [];
    root.tokens.forEach((c, i) => {
      jx += lead[i];
      c.__dx = jx + tws[i] / 2 - (c.l + c.w / 2);
      gsap.set(c, { x: c.__dx });
      c.skinG.style.opacity = 0;
      if (i > 0) {
        const mx = jx - lead[i] / 2;
        const m = S.line({ x1: mx, y1: L.y - h * 0.36, x2: mx, y2: L.y + h * 0.36, stroke: '#ffffff', sw: 2.5, strokeOpacity: 0.9 }, decoG);
        m.setAttribute('data-audit', 'ignore');
        m.style.opacity = 0;
        root.__cutMarks.push(m);
      }
      jx += tws[i];
    });
    const bw = total + 2 * padX;
    root.bar = T.skin(S, { x: mid - bw / 2, y: L.y - h / 2, w: bw, h, r: first.rad }, T.state(o.state || 'token', S), barG);
  }

  // ---- context-window outline
  if (o.window) {
    const wo = o.window, pad = wo.pad ?? 10;
    const ww = wo.w ?? (wo.n * ((o.w || slotW) + gap) - gap);
    const tone = wo.tone || 'struct';
    const wx = (L.align === 'middle' ? L.x - ww / 2 : L.x) - pad, wy = L.y - h / 2 - pad;
    root.windowEl = S.rect({ x: wx, y: wy, w: ww + 2 * pad, h: h + 2 * pad, r: (root.tokens[0] ? root.tokens[0].rad : 16) + pad, stroke: tone, strokeOpacity: 0.6, sw: 2, dash: wo.dashed === false ? undefined : '10 8' }, winG);
    root.windowSolid = S.rect({ x: wx, y: wy, w: ww + 2 * pad, h: h + 2 * pad, r: (root.tokens[0] ? root.tokens[0].rad : 16) + pad, stroke: tone, strokeOpacity: 0.9, sw: 2.5, fill: tone, fillOpacity: 0.05 }, winG);
    root.windowSolid.style.opacity = 0;
    if (wo.label) root.windowLabel = S.text(wo.label, { x: wx + ww + 2 * pad, y: wy - 26, size: wo.size || 26, weight: 550, anchor: 'end', color: 'muted' }, winG);
    Object.assign(root, { winBox: { x: wx, y: wy, w: ww + 2 * pad, h: h + 2 * pad } });
  }

  const allG = root.items.map(geom);
  const L0 = allG.length ? Math.min(...allG.map(q => q.x1)) : L.x, R0 = allG.length ? Math.max(...allG.map(q => q.x2)) : L.x;
  const lastLine = root.items.length ? Math.max(...root.items.map(c => c.line)) : 0;
  Object.assign(root, { lineH: L.lineH, h, size, gap, l: L0, r: R0, w: R0 - L0, t: L.y - h / 2, b: L.y + h / 2 + lastLine * L.lineH });

  // ---- geometry
  root.at = i => { const q = geom(pick(i)[0]); const s = scrollX(); return { ...q, x1: q.x1 + s, x2: q.x2 + s, cx: q.cx + s }; };
  root.span = (a, b) => {
    const qs = T.idx([a, b ?? a], root.tokens.length).map(i => root.at(i));
    const x1 = Math.min(...qs.map(q => q.x1)), x2 = Math.max(...qs.map(q => q.x2));
    const t = Math.min(...qs.map(q => q.t)), bb = Math.max(...qs.map(q => q.b));
    return { x1, x2, cx: (x1 + x2) / 2, t, b: bb, cy: (t + bb) / 2 };
  };
  root.next = t => {
    const w = t === undefined ? slotW : widthOf(chipSpec(norm(t)));
    const si = root.items.findIndex(c => c.kind === 'slot');
    const ws2 = root.items.map(c => c.__w);
    const k = si >= 0 ? si : ws2.length;
    if (si >= 0) ws2[si] = w; else ws2.push(w);
    const p = T.layout(ws2, L)[k];
    return { x: p.x + w / 2 + scrollX(), y: p.y };
  };
  root.bracket = (a, b, bo = {}) => {
    const sp = root.span(a, b);
    const below = idPos === 'below' ? idRoom : 0, above = idPos === 'above' ? idRoom : 0;
    const br = S.bracket({ x1: sp.x1 + 4, x2: sp.x2 - 4, y: bo.up ? sp.t - 12 - above : sp.b + 12 + below, label: bo.label, up: bo.up, tone: bo.tone, size: bo.size }, bo.parent || root);
    br.style.opacity = 0; br.style.visibility = 'hidden';
    br.drawOn = (dO = {}) => {
      const d = dO.d ?? 0.6, tl = gsap.timeline();
      tl.fromTo(br, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0);
      tl.fromTo(br.line, { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: d, ease: 'power2.inOut' }, 0);
      if (br.label) tl.fromTo(br.label, { autoAlpha: 0, y: bo.up ? 8 : -8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, d * 0.6);
      return tl;
    };
    return br;
  };

  // ---- adding chips
  root.append = (t, ao = {}) => {
    const it = norm(t);
    const sp = { ...chipSpec(it, { state: ao.state }), raw: it.t };
    const w = widthOf(sp);
    const tl = gsap.timeline();
    const si = root.items.findIndex(c => c.kind === 'slot');
    const ws2 = root.items.map(c => c.__w);
    const k = si >= 0 ? si : ws2.length;
    if (si >= 0) ws2[si] = w; else ws2.push(w);
    const p = T.layout(ws2, L)[k];
    const chip = make(sp, p);
    chip.raw = it.t;
    const d = ao.d ?? (ao.via ? 1 : ao.from ? 0.8 : 0.5);
    const landAt = ao.via ? d + 0.15 : ao.from ? d * 0.8 : 0.08;
    if (si >= 0) {
      const slot = root.items[si];
      root.items.splice(si, 1, chip);
      tl.fromTo(slot, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25, immediateRender: false }, Math.max(0, landAt - 0.1));
    } else root.items.push(chip);
    sync();
    relayoutInto(tl, ao.via || ao.from ? Math.max(0, landAt - 0.35) : 0.02, { d: 0.45 });
    if (ao.via) {
      tl.add(chip.travel(ao.via, { d, appear: true }), 0);
      tl.add(chip.moveTo([chip.cx, chip.cy], { d: 0.3, ease: 'power2.out' }), d);
    } else if (ao.from) tl.add(chip.flyIn(ao.from, { d }), 0);
    else tl.add(chip.pop({ d }), 0);
    tl.token = chip;
    return tl;
  };
  root.stream = (list, so = {}) => {
    const tl = gsap.timeline(), every = so.every ?? 0.25;
    list.forEach((t, k) => tl.add(root.append(t, so), k * every));
    return tl;
  };
  root.push = (t, po = {}) => {
    const tl = gsap.timeline(), d = po.d ?? 0.5;
    const ap = root.append(t, { ...po, d: po.popD });
    tl.add(ap, 0);
    const keep = po.keep ?? (o.window && o.window.n) ?? root.tokens.length;
    const n = root.tokens.length;
    if (n > keep) {
      const first = root.tokens[n - keep];
      const target = -(first.x0 + first.__dx - L.x);
      tl.add(S.fx.xform(content, { x: target }, { d, ease: 'power2.inOut' }), 0);
      if (po.drop !== false) {
        root.tokens.slice(0, n - keep).forEach((c, i) => {
          if (c.__drop) return;
          c.__drop = po.dy ?? Math.round(h * 0.95);
          tl.add(root.drop.one(c, { d }), 0.05);
        });
      }
    }
    tl.token = ap.token;
    return tl;
  };
  root.reveal = (range, ro = {}) => {
    const cs = pick(range), tl = gsap.timeline(), every = ro.every ?? 0.08;
    cs.forEach((c, k) => tl.add(c.pop({ d: ro.d ?? 0.5 }), k * every));
    if (!cs.length) tl.set({}, {}, 0.01);
    return tl;
  };

  // ---- looks
  const each = (range, fn, stagger) => { const tl = gsap.timeline(); pick(range).forEach((c, k) => tl.add(fn(c, k), k * (stagger || 0))); if (!tl.getChildren().length) tl.set({}, {}, 0.01); return tl; };
  root.setState = (range, state, so = {}) => each(range, c => c.setState(state, so), so.stagger);
  root.pulse = (range, po = {}) => each(range, c => c.pulse(po), po.stagger ?? 0.12);
  root.glow = (range, go = {}) => each(range, c => c.glow(go), go.stagger);
  root.textOff = (range, to = {}) => each(range, c => c.textOff(to), to.stagger);
  root.textOn = (range, to = {}) => each(range, c => c.textOn(to), to.stagger);
  root.swap = (i, text, so = {}) => pick(i)[0].swap(text, so);
  root.stripe = (i, tones, so = {}) => pick(i)[0].stripe(tones, so);
  root.badges = (range, labels, bo = {}) => each(range, (c, k) => c.badge(Array.isArray(labels) ? labels[k] : labels, bo), bo.stagger ?? 0.1);
  root.showIds = (so = {}) => {
    const els = root.tokens.map(c => c.idEl).filter(Boolean);
    return gsap.fromTo(els, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: so.d ?? 0.45, ease: 'power2.out', stagger: so.stagger ?? 0.05 });
  };
  root.drop = (range, dop = {}) => {
    const tl = gsap.timeline();
    pick(range).forEach((c, k) => { c.__drop += dop.dy ?? Math.round(h * 0.95); tl.add(root.drop.one(c, dop), k * (dop.stagger || 0)); });
    return tl;
  };
  root.drop.one = (c, dop = {}) => {
    const tl = gsap.timeline(), d = dop.d ?? 0.6;
    const from = c.__dy;
    // the planned y = layout y + drop + lift
    const P = T.layout(root.items.map(q => q.__w), L)[root.items.indexOf(c)];
    c.__dy = P.y - c.cy0 + c.__drop + c.__lift;
    tl.fromTo(c, { y: from }, { y: c.__dy, duration: d, ease: 'power2.inOut', immediateRender: false }, 0);
    tl.add(c.setState(dop.state || 'dim', { d }), 0);
    return tl;
  };
  root.lift = (range, lo = {}) => {
    const tl = gsap.timeline();
    pick(range).forEach(c => {
      c.__lift += lo.dy ?? -14;
      const from = c.__dy; c.__dy += lo.dy ?? -14;
      tl.fromTo(c, { y: from }, { y: c.__dy, duration: lo.d ?? 0.45, ease: 'power2.out', immediateRender: false }, 0);
    });
    return tl;
  };
  root.shift = (n, so = {}) => {
    const c = pick(n)[0];
    return S.fx.xform(content, { x: -(c.x0 + c.__dx - L.x) }, { d: so.d ?? 0.6, ease: so.ease || 'power2.inOut' });
  };
  root.relayout = (lo = {}, ro = {}) => {
    ['maxW', 'align', 'x', 'y', 'gap'].forEach(k => { if (lo[k] !== undefined) L[k] = lo[k]; });
    if (lo.vertical !== undefined) L.vertical = lo.vertical;
    if (lo.lineGap !== undefined || lo.vertical !== undefined) L.lineH = h + (lo.lineGap ?? Math.round(h * (L.vertical ? 0.25 : 0.45))) + idRoom;
    const tl = gsap.timeline();
    relayoutInto(tl, 0, { d: ro.d ?? 0.9, stagger: ro.stagger ?? 0.02, ease: ro.ease });
    if (!tl.getChildren().length) tl.set({}, {}, 0.01);
    return tl;
  };
  root.reorder = (order, ro = {}) => {
    const toks = order.map(i => root.tokens[i]);
    const rest = root.items.filter(c => !toks.includes(c));
    root.items = toks.concat(rest);
    sync();
    const tl = gsap.timeline();
    relayoutInto(tl, 0, { d: ro.d ?? 0.9, arc: ro.arc !== false, stagger: 0 });
    if (!tl.getChildren().length) tl.set({}, {}, 0.01);
    return tl;
  };

  // ---- prefix highlight: one band per line; chain calls to grow or shrink it
  const bands = [];
  let hiLabel = null, hiN = 0;
  root.highlight = (n, ho = {}) => {
    const tone = ho.tone || 'helps', pad = ho.pad ?? 8, d = ho.d ?? 0.8;
    n = Math.max(0, Math.min(n, root.tokens.length));
    const lines = {};
    root.tokens.slice(0, n).forEach(c => {
      const q = geom(c);
      const ln = lines[c.line] || (lines[c.line] = { x1: Infinity, x2: -Infinity, cy: q.cy });
      ln.x1 = Math.min(ln.x1, q.x1); ln.x2 = Math.max(ln.x2, q.x2);
    });
    const nLines = Math.max(0, ...root.items.map(c => c.line)) + 1;
    while (bands.length < nLines) {
      const li = bands.length, first = root.items.find(c => c.line === li) || root.items[0];
      const by = (first ? geom(first).cy : L.y + li * L.lineH) - h / 2 - pad;
      const x0 = first ? geom(first).x1 - pad : L.x - pad;
      const rc = S.rect({ x: x0, y: by, w: 0, h: h + 2 * pad, r: Math.min((h + 2 * pad) / 2, (first ? first.rad : 16) + pad),
        fill: tone, fillOpacity: 0.15, stroke: tone, strokeOpacity: 0.9, sw: 2.5 }, hiG);
      rc.__w = 0; rc.__x = x0;
      bands.push(rc);
    }
    const tl = gsap.timeline();
    const order = n >= hiN ? bands.map((b, i) => i) : bands.map((b, i) => bands.length - 1 - i);
    hiN = n;
    const per = d / Math.max(1, Object.keys(lines).length);
    let at = 0;
    for (const li of order) {
      const rc = bands[li], seg = lines[li];
      const tx = seg ? seg.x1 - pad : rc.__x, tw = seg ? seg.x2 - seg.x1 + 2 * pad : 0;
      if (Math.abs(tw - rc.__w) < 0.01 && Math.abs(tx - rc.__x) < 0.01) continue;
      tl.fromTo(rc, { attr: { x: rc.__x, width: rc.__w } }, { attr: { x: tx, width: tw }, duration: per, ease: 'power2.inOut', immediateRender: false }, at);
      at += per * 0.9;
      rc.__w = tw; rc.__x = tx;
    }
    if (hiLabel) { tl.fromTo(hiLabel, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, immediateRender: false }, 0); hiLabel = null; }
    if (ho.label && n > 0) {
      const ln0 = lines[Math.min(...Object.keys(lines).map(Number))];
      const above = idPos === 'above' ? idRoom : 0;
      const lab = S.text(ho.label, { x: (ln0.x1 + ln0.x2) / 2, y: ln0.cy - h / 2 - pad - 28 - above, size: ho.size || 28, weight: 600, anchor: 'middle', color: tone }, decoG);
      T.hide(lab);
      tl.fromTo(lab, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out', immediateRender: false }, Math.max(0, at - 0.1));
      tl.labelEl = lab;
      hiLabel = lab;
    }
    if (!tl.getChildren().length) tl.set({}, {}, 0.01);
    return tl;
  };

  // ---- joined bar -> chips
  root.cut = (co = {}) => {
    const d = co.d ?? 0.9, tl = gsap.timeline();
    (root.__cutMarks || []).forEach((m, k) => {
      tl.fromTo(m, { autoAlpha: 1, drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 0.22, ease: 'power2.out', immediateRender: false }, k * 0.04);
      tl.fromTo(m, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25, immediateRender: false }, 0.32 + k * 0.04);
    });
    const t0 = 0.22;
    if (root.bar) tl.fromTo(root.bar, { opacity: 1 }, { opacity: 0, duration: d * 0.35, ease: 'power1.in', immediateRender: false }, t0 + d * 0.05);
    relayoutInto(tl, t0, { d: d * 0.75 });
    root.tokens.forEach((c, k) => tl.fromTo(c.skinG, { opacity: 0 }, { opacity: 1, duration: d * 0.35, ease: 'power1.out', immediateRender: false }, t0 + d * 0.42 + k * 0.02));
    return tl;
  };

  // ---- split chip i into pieces, in place
  root.split = (i, pieces, so = {}) => {
    const d = so.d ?? 0.9, tl = gsap.timeline();
    const tok = pick(i)[0];
    const at = root.items.indexOf(tok);
    const sps2 = pieces.map(p => ({ ...chipSpec({ t: p }, { state: so.state || tok.state }), raw: p }));
    const ws2 = root.items.map(c => c.__w);
    ws2.splice(at, 1, ...sps2.map(widthOf));
    const P = T.layout(ws2, L);
    // where the original label's letters are now
    const fullW = S.measure(tok.text, { size, weight, family: fam });
    const q = geom(tok);
    let jx = q.cx - fullW / 2;
    const madeP = sps2.map((sp, k) => {
      const pc = make(sp, P[at + k]);
      pc.raw = (k === 0 && /^\s/.test(tok.raw || '') ? ' ' : '') + sp.raw;
      const pw = S.measure(sp.text, { size, weight, family: fam });
      pc.__dx = jx + pw / 2 - (pc.x0 + pc.w / 2);
      pc.__dy = q.cy - pc.cy0;
      gsap.set(pc, { x: pc.__dx, y: pc.__dy });
      T.hide(pc);
      pc.skinG.style.opacity = 0;
      jx += pw;
      return pc;
    });
    if (tok.label) tl.fromTo(tok.label, { opacity: 1 }, { opacity: 0, duration: 0.01, immediateRender: false }, 0);
    tl.fromTo(tok, { autoAlpha: 1 }, { autoAlpha: 0, duration: d * 0.4, ease: 'power1.in', immediateRender: false }, 0.12);
    madeP.forEach(pc => tl.fromTo(pc, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: false }, 0));
    root.items.splice(at, 1, ...madeP);
    sync();
    relayoutInto(tl, 0.12, { d: d * 0.75 });
    madeP.forEach(pc => tl.fromTo(pc.skinG, { opacity: 0 }, { opacity: 1, duration: d * 0.35, ease: 'power1.out', immediateRender: false }, 0.12 + d * 0.4));
    tl.pieces = madeP;
    return tl;
  };

  // ---- context window
  root.showWindow = (wo = {}) => {
    const tl = gsap.timeline();
    if (!root.windowEl) return tl.set({}, {}, 0.01);
    tl.fromTo(root.windowEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: wo.d ?? 0.6, ease: 'power1.out' }, 0);
    if (root.windowLabel) tl.fromTo(root.windowLabel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, (wo.d ?? 0.6) * 0.5);
    return tl;
  };
  root.solidWindow = (wo = {}) => {
    const tl = gsap.timeline(), d = wo.d ?? 0.5;
    if (!root.windowEl) return tl.set({}, {}, 0.01);
    tl.fromTo(root.windowSolid, { opacity: 0 }, { opacity: 1, duration: d, immediateRender: false }, 0);
    tl.fromTo(root.windowEl, { opacity: 1 }, { opacity: 0, duration: d, immediateRender: false }, 0);
    if (root.windowLabel) tl.fromTo(root.windowLabel, { attr: { fill: S.tone('muted') } }, { attr: { fill: S.tone('ink') }, duration: d, immediateRender: false }, 0);
    return tl;
  };
  return root;
}

/* ------------------------------------------------------------------ libChatWindow */
/**
 * libChatWindow — a clean chat-app panel: title bar, the user's message in a bubble (top right, with an
 * avatar), and the assistant's answer (sparkle icon, wrapped text) that streams in token by token. Each token
 * lands as a faint blue pill and relaxes into plain text; a steady caret (it never blinks unless asked) sits
 * after the newest token. Long answers scroll up inside the answer area, fading at its top edge.
 * o: x 300, y 130, w 1320, h 620 (frame, top-left), title 'Assistant' ('' = none), titleBar true, question '',
 *    answer (string, tokenized with libTokenize + o.splits; or an array of token strings), size 32 (answer
 *    px), qSize size, lineH round(size*1.45), weight 450, relax 0.3 (s a landed pill takes to settle), caret
 *    true, composer false (input field + send button at the bottom), placeholder 'Message', avatar true,
 *    tone 'struct' (frame outline, pills, caret). Layout overrides (px): qy (bubble centre y), qRight (bubble
 *    right edge), ax (answer left), ay (first line centre), aw (wrap width), iconX, maxLines (visible lines).
 * Returns <g> with .frame .titleBar .titleEl .bubbleG .bubble .questionEl .avatar .sparkle .answerG .caret
 *    .composer .sendBtn, .tokens[] (each {g, text, raw, flash, stand, i, line, x, w, y}), .lines, .maxLines,
 *    .ax .ay .aw .lineH, and frame geometry .x .y .w .h .l .r .t .b .cx .cy.
 * Helpers (return tweens/timelines; call in time order):
 *    .drawOn({d: 0.8})             the window and its chrome appear, with the question (unless it is typed)
 *    .typeQuestion({d})            the question types into the bubble as it grows (empty until then)
 *    .send({d: 0.5})               the send button pulses
 *    .stream({from, to | count, every: 0.1, times, relax})   tokens land one by one (from defaults to the next
 *        unstreamed token; to is exclusive; times = landing times relative to the tween). tween.times[]
 *    .pillify(a, b, {spread, d: 0.4}) tokens a..b stand apart as blue pills (pause the stream first)
 *    .unpillify(a, b, {d})         relax them back into text
 *    .glow(a, b, {hold: 0.8})      white ring round tokens a..b, on and off
 *    .dimTokens(a, b, {to: 0.5}) / .undimTokens(a, b)
 *    .ghosts(a, b, {d: 0.5})       unstreamed tokens a..b show as dashed outlines: what was never computed
 *    .bracket(a, b, {label, tone}) -> a bracket <g> under tokens a..b, hidden until its .drawOn()
 *    .blink({n: 3, period: 0.9})   the caret blinks n times (deterministic), e.g. while waiting
 *    .showCaret() / .hideCaret()
 * Geometry: .span(a, b) -> {x1, x2, cx, y, t, b} (ignores scrolling) · .find(text, nth = 1) -> token index
 *   const chat = libChatWindow(S, { question: 'Why is the sky blue?', answer: ANSWER, splits: { wavelengths: ['wave', 'lengths'] } });
 *   S.add(chat.drawOn({ question: false }), 'b1');
 *   S.add(chat.typeQuestion(), 'b1+0.4');
 *   S.add(chat.stream({ to: chat.find(' blues') + 1, every: 0.03 }), 'b2-2.22');
 *   S.add(chat.pillify(chat.find(' blues') - 5, chat.find(' blues')), 'b2');
 */
function libChatWindow(S, o = {}, parent) {
  const T = __TOK;
  const X = o.x ?? 300, Y = o.y ?? 130, W = o.w ?? 1320, H = o.h ?? 620;
  const size = o.size || 32, qSize = o.qSize || size, weight = o.weight || 450;
  const lineH = o.lineH || Math.round(size * 1.45), tone = o.tone || 'struct';
  const pad = Math.round(Math.max(28, size * 1.05));
  const tbH = o.titleBar === false ? 0 : Math.max(50, Math.round(size * 1.55));
  const R = Math.min(26, Math.round(H * 0.06) + 8);
  const root = S.g(null, parent);
  const chrome = S.g(null, root);
  // ---- frame
  root.frame = S.g(null, chrome);
  S.rect({ x: X, y: Y, w: W, h: H, r: R, fill: '#0b1224', filter: 'url(#shadow)' }, root.frame);
  S.rect({ x: X, y: Y, w: W, h: H, r: R, fill: 'url(#card-neutral)', stroke: tone, strokeOpacity: 0.5, sw: 2 }, root.frame);
  if (tbH) {
    root.titleBar = S.g(null, chrome);
    S.path({ d: T.rrPath(X + 1, Y + 1, W - 2, tbH - 1, R - 1, 0), fill: '#ffffff', fillOpacity: 0.035 }, root.titleBar);
    S.line({ x1: X + 1, y1: Y + tbH, x2: X + W - 1, y2: Y + tbH, stroke: '#ffffff', strokeOpacity: 0.08, sw: 1.5 }, root.titleBar);
    for (let k = 0; k < 3; k++) S.circle({ x: X + 30 + k * 22, y: Y + tbH / 2, r: 6.5, fill: '#ffffff', fillOpacity: 0.16 }, root.titleBar);
    const title = o.title ?? 'Assistant';
    if (title) root.titleEl = S.text(title, { x: X + W / 2, y: Y + tbH / 2 + 1, size: 24, weight: 600, anchor: 'middle', color: 'muted' }, root.titleBar);
  }
  // ---- composer (optional)
  const compH = o.composer ? Math.max(56, Math.round(size * 1.75)) : 0;
  const compY = Y + H - Math.round(pad * 0.7) - compH;
  if (o.composer) {
    root.composer = S.g(null, chrome);
    S.rect({ x: X + pad, y: compY, w: W - 2 * pad, h: compH, r: compH / 2, fill: '#ffffff', fillOpacity: 0.045, stroke: '#ffffff', strokeOpacity: 0.12, sw: 1.5 }, root.composer);
    root.placeholder = S.text(o.placeholder ?? 'Message', { x: X + pad + 28, y: compY + compH / 2 + 1, size: 24, weight: 450, color: 'faint' }, root.composer);
    root.sendBtn = S.g(null, root.composer);
    const br = compH / 2 - 8, bx = X + W - pad - 8 - br, by = compY + compH / 2;
    S.circle({ x: bx, y: by, r: br, fill: tone }, root.sendBtn);
    S.path({ d: `M${bx},${by + br * 0.48} V${by - br * 0.46} M${bx - br * 0.4},${by - br * 0.06} L${bx},${by - br * 0.48} L${bx + br * 0.4},${by - br * 0.06}`, stroke: T.DARK, sw: 3.2 }, root.sendBtn);
    Object.assign(root.sendBtn, { cx: bx, cy: by });
  }
  // ---- question bubble (right aligned) and avatar. bubbleG: shown by drawOn; bubbleIn: by typeQuestion
  const avSize = Math.round(qSize * 1.3);
  const qRight = o.qRight ?? (X + W - pad - (o.avatar === false ? 0 : avSize + 16));
  const qPadX = Math.round(qSize * 0.72), bubH = Math.round(qSize * 1.8);
  const qy = o.qy ?? (Y + tbH + Math.round(pad * 0.75) + bubH / 2);
  const q = String(o.question ?? '');
  const qW = q ? S.measure(q, { size: qSize, weight: 500 }) : 0;
  root.bubbleG = S.g(null, root);
  const bubbleIn = S.g(null, root.bubbleG);
  if (q) root.bubble = S.rect({ x: qRight - qW - 2 * qPadX, y: qy - bubH / 2, w: qW + 2 * qPadX, h: bubH, r: Math.min(bubH / 2, 24), fill: '#ffffff', fillOpacity: 0.085, stroke: '#ffffff', strokeOpacity: 0.12, sw: 1.5 }, bubbleIn);
  if (q) root.questionEl = S.text(q, { x: qRight - qPadX, y: qy + 1, size: qSize, weight: 500, anchor: 'end', color: 'ink' }, bubbleIn);
  if (q && o.avatar !== false) root.avatar = S.icon('ph:user-circle-duotone', { x: qRight + 16 + avSize / 2, y: qy, size: avSize, color: 'muted' }, root.bubbleG);
  // ---- answer area
  const icon = Math.round(size * 1.1);
  const iconX = o.iconX ?? (X + pad + icon / 2);
  const ax = o.ax ?? (iconX + icon / 2 + Math.round(size * 0.55));
  const aw = o.aw ?? (X + W - pad - ax);
  const ay = o.ay ?? (q ? qy + bubH / 2 + Math.round(pad * 0.9) + lineH / 2 : Y + tbH + pad + lineH / 2);
  const bottom = (o.composer ? compY - pad * 0.5 : Y + H - pad * 0.6);
  const maxLines = o.maxLines ?? Math.max(1, Math.floor((bottom - (ay - lineH / 2)) / lineH));
  const answerG = S.g(null, root);
  const scroller = S.g(null, answerG);
  root.sparkle = S.icon('ph:sparkle-fill', { x: iconX, y: ay, size: icon, color: tone }, scroller);
  // ---- tokens, laid out word by word (a word = a token with a leading space plus the pieces glued to it)
  const toks = Array.isArray(o.answer) ? o.answer.slice() : libTokenize(o.answer || '', { splits: o.splits });
  const spW = S.measure(' ', { size, weight });
  const words = [];
  toks.forEach((t, k) => { if (!words.length || /^\s/.test(t)) words.push([k]); else words[words.length - 1].push(k); });
  const tw = toks.map(t => S.measure(t.trim(), { size, weight }));
  const pos = [];
  let cx = 0, line = 0;
  words.forEach((wd, wi) => {
    const lead = /^\s/.test(toks[wd[0]]) && cx > 0 ? spW : 0;
    const wW = lead + wd.reduce((a, k) => a + tw[k], 0);
    let startLead = lead;
    if (cx > 0 && cx + wW > aw) { line++; cx = 0; startLead = 0; }
    wd.forEach((k, j) => { const l = j === 0 ? startLead : 0; pos[k] = { x: ax + cx + l, w: tw[k], line, word: wi }; cx += l + tw[k]; });
  });
  const pPad = Math.round(size * 0.2), pH = Math.round(size * 1.42);
  root.tokens = toks.map((t, k) => {
    const p = pos[k], ly = ay + p.line * lineH;
    const outer = S.g(null, scroller);            // dims (GSAP opacity)
    const mid = S.g(null, outer);                 // pillify spread (GSAP x); ghost outline lives here
    const inner = S.g(null, mid);                 // stream: landed / scrolled (attribute opacity, from the stream proxy)
    inner.setAttribute('opacity', 0);
    const box = { x: p.x - pPad, y: ly - pH / 2, w: p.w + 2 * pPad, h: pH, r: Math.min(12, pH / 2) };
    const flash = S.rect({ ...box, fill: tone, fillOpacity: 0.22, stroke: tone, strokeOpacity: 0.7, sw: 1.5 }, inner);
    flash.setAttribute('opacity', 0);
    const stand = S.rect({ ...box, fill: tone, fillOpacity: 0.2, stroke: tone, strokeOpacity: 0.85, sw: 2 }, inner);
    stand.style.opacity = 0;
    const text = S.text(t.trim() || ' ', { x: p.x, y: ly + 1, size, weight, color: 'ink' }, inner);
    return { g: outer, mid, inner, flash, stand, box, text, raw: t, i: k, line: p.line, word: p.word, x: p.x, w: p.w, y: ly, __sx: 0, __a: 0, __f: 0, __dim: 1 };
  });
  root.lines = toks.length ? pos[toks.length - 1].line + 1 : 0;
  // ---- caret: caretG takes the pillify spread (GSAP x); the rect is placed by the stream
  const caretH = Math.round(size * 1.12);
  const caretG = S.g(null, answerG);
  if (o.caret !== false) root.caret = S.rect({ x: ax, y: ay - caretH / 2, w: 3, h: caretH, r: 1.5, fill: tone }, caretG);
  root.caretG = caretG;
  const caretAt = k => (k < 0 ? { x: ax, y: ay } : { x: root.tokens[k].x + root.tokens[k].w + 4, y: root.tokens[k].y });
  Object.assign(root, { x: X, y: Y, w: W, h: H, l: X, r: X + W, t: Y, b: Y + H, cx: X + W / 2, cy: Y + H / 2, ax, ay, aw, lineH, maxLines, answerG, size });

  // ---- streaming: one proxy per call, driving the landed state, pill flash, caret and scroll
  let nextK = 0;
  const target = ln => Math.max(0, ln - maxLines + 1);   // lines scrolled off when line ln is the newest
  let scrollBase = 0;
  root.stream = (so = {}) => {
    const from = so.from ?? nextK;
    const to = Math.min(root.tokens.length, so.to ?? (so.count !== undefined ? from + so.count : root.tokens.length));
    const every = so.every ?? 0.1, relax = so.relax ?? o.relax ?? 0.3;
    const times = [];
    for (let k = from; k < to; k++) times.push(so.times ? so.times[k - from] : (k - from) * every);
    const s0 = scrollBase;
    const steps = [];
    let lastT = s0;
    for (let k = from; k < to; k++) { const tg = Math.max(lastT, target(root.tokens[k].line)); if (tg > lastT) { steps.push([times[k - from], tg - lastT]); lastT = tg; } }
    scrollBase = lastT;
    nextK = Math.max(nextK, to);
    const dur = (times.length ? times[times.length - 1] : 0) + Math.max(relax, 0.35) + 0.02;
    const proxy = { t: 0 };
    let lastCaret = '';
    const render = () => {
      const tt = proxy.t;
      let sc = s0;
      for (const [ts, dl] of steps) sc += dl * T.easeInOut((tt - ts) / 0.35);
      const tr = sc ? `translate(0,${(-sc * lineH).toFixed(2)})` : '';
      scroller.setAttribute('transform', tr);
      if (root.caret) root.caret.setAttribute('transform', tr);
      const fadeOf = ln => T.clamp(1 - (sc - ln) / 0.7);
      if (sc > 0 || steps.length) root.sparkle.setAttribute('opacity', fadeOf(0).toFixed(3));
      let newest = from - 1;
      for (let k = from; k < to; k++) {
        const tk = root.tokens[k], age = tt - times[k - from];
        const landed = age >= 0;
        if (landed) newest = k;
        const a = landed ? T.clamp(age / 0.06) * fadeOf(tk.line) : 0;
        const f = landed ? Math.pow(T.clamp(1 - age / relax), 1.6) : 0;
        if (Math.abs(a - tk.__a) > 1e-4) { tk.inner.setAttribute('opacity', a.toFixed(3)); tk.__a = a; }
        if (Math.abs(f - tk.__f) > 1e-4) { tk.flash.setAttribute('opacity', f.toFixed(3)); tk.__f = f; }
      }
      if (sc > 0) for (let k = 0; k < from; k++) {
        const tk = root.tokens[k], a = fadeOf(tk.line);
        if (Math.abs(a - tk.__a) > 1e-4) { tk.inner.setAttribute('opacity', a.toFixed(3)); tk.__a = a; }
      }
      if (root.caret) {
        const c = caretAt(newest), key = `${c.x},${c.y}`;
        if (key !== lastCaret) { root.caret.setAttribute('x', c.x); root.caret.setAttribute('y', c.y - caretH / 2); lastCaret = key; }
      }
    };
    const tw2 = gsap.fromTo(proxy, { t: 0 }, { t: dur, duration: dur, ease: 'none', immediateRender: false, onUpdate: render, onStart: render, onReverseComplete: () => { proxy.t = 0; render(); } });
    tw2.times = times;
    return tw2;
  };

  // ---- question typing (bubble grows from the right as the text types)
  root.typeQuestion = (to = {}) => {
    if (!q) return gsap.timeline().set({}, {}, 0.01);
    const d = to.d ?? Math.max(0.5, q.length * 0.045);
    const proxy = { n: 0 };
    const render = () => {
      const s = q.slice(0, Math.round(proxy.n));
      root.questionEl.textContent = s;
      const w = Math.max(bubH, (s ? S.measure(s, { size: qSize, weight: 500 }) : 0) + 2 * qPadX);
      root.bubble.setAttribute('x', qRight - w); root.bubble.setAttribute('width', w);
    };
    const tl = gsap.timeline();
    tl.fromTo(bubbleIn, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0);
    tl.fromTo(proxy, { n: 0 }, { n: q.length, duration: d, ease: 'none', onUpdate: render, onStart: render, immediateRender: true }, 0.15);
    return tl;
  };
  root.drawOn = (dO = {}) => {
    const d = dO.d ?? 0.8, tl = gsap.timeline();
    tl.fromTo(chrome, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: d, ease: 'power3.out' }, 0);
    if (q) tl.fromTo(root.bubbleG, { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.6 }, d * 0.3);
    tl.fromTo([root.sparkle, root.caret].filter(Boolean), { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.6 }, d * 0.45);
    return tl;
  };
  root.send = (so = {}) => {
    const tl = gsap.timeline();
    if (root.sendBtn) tl.fromTo(root.sendBtn, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.22, duration: (so.d ?? 0.5) / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%', immediateRender: false }, 0);
    else tl.set({}, {}, 0.01);
    return tl;
  };
  root.blink = (bo = {}) => {
    const n = bo.n ?? 3, per = bo.period ?? 0.9, tl = gsap.timeline();
    if (!root.caret) return tl.set({}, {}, 0.01);
    for (let k = 0; k < n; k++) {
      tl.fromTo(root.caret, { opacity: 1 }, { opacity: 0, duration: 0.08, immediateRender: false }, k * per + per * 0.5);
      tl.fromTo(root.caret, { opacity: 0 }, { opacity: 1, duration: 0.08, immediateRender: false }, (k + 1) * per);
    }
    return tl;
  };
  root.showCaret = (co = {}) => gsap.fromTo(root.caret, { autoAlpha: 0 }, { autoAlpha: 1, duration: co.d ?? 0.25 });
  root.hideCaret = (co = {}) => gsap.fromTo(root.caret, { autoAlpha: 1 }, { autoAlpha: 0, duration: co.d ?? 0.3, immediateRender: false });

  // ---- pills that stand apart, glow, dim, ghosts
  const rng = (a, b) => T.idx([a, b ?? a], root.tokens.length).map(i => root.tokens[i]);
  const caretSpread = (tl, d) => {
    // the caret follows the newest landed token's spread when that token is on a spread line
    const k = nextK - 1;
    const want = k >= 0 ? root.tokens[k].__sx : 0;
    const from = caretG.__sx || 0;
    if (Math.abs(want - from) > 0.01) tl.fromTo(caretG, { x: from }, { x: want, duration: d, ease: 'power2.inOut', immediateRender: false }, 0);
    caretG.__sx = want;
  };
  root.pillify = (a, b, po = {}) => {
    const spread = po.spread ?? Math.round(2 * pPad + 8), d = po.d ?? 0.4, tl = gsap.timeline();
    const ts = rng(a, b);
    const lastLine = ts[ts.length - 1].line, lastI = ts[ts.length - 1].i;
    ts.forEach((tk, k) => {
      const from = tk.__sx; tk.__sx = k * spread;
      tl.fromTo(tk.mid, { x: from }, { x: tk.__sx, duration: d, ease: 'power2.inOut', immediateRender: false }, 0);
      tl.fromTo(tk.stand, { opacity: 0 }, { opacity: 1, duration: d, ease: 'power1.out', immediateRender: false }, 0);
    });
    root.tokens.filter(t => t.i > lastI && t.line === lastLine).forEach(tk => {
      const from = tk.__sx; tk.__sx = (ts.length - 1) * spread;
      tl.fromTo(tk.mid, { x: from }, { x: tk.__sx, duration: d, ease: 'power2.inOut', immediateRender: false }, 0);
    });
    caretSpread(tl, d);
    return tl;
  };
  root.unpillify = (a, b, po = {}) => {
    const d = po.d ?? 0.4, tl = gsap.timeline();
    const ts = rng(a, b), lastI = ts[ts.length - 1].i, lastLine = ts[ts.length - 1].line;
    ts.concat(root.tokens.filter(t => t.i > lastI && t.line === lastLine)).forEach(tk => {
      const from = tk.__sx; tk.__sx = 0;
      if (from) tl.fromTo(tk.mid, { x: from }, { x: 0, duration: d, ease: 'power2.inOut', immediateRender: false }, 0);
    });
    ts.forEach(tk => tl.fromTo(tk.stand, { opacity: 1 }, { opacity: 0, duration: d, ease: 'power1.in', immediateRender: false }, 0));
    caretSpread(tl, d);
    return tl;
  };
  root.span = (a, b) => {
    const ts = rng(a, b);
    const x1 = Math.min(...ts.map(t => t.x - pPad + t.__sx)), x2 = Math.max(...ts.map(t => t.x + t.w + pPad + t.__sx));
    const y = ts[0].y;
    return { x1, x2, cx: (x1 + x2) / 2, y, t: y - pH / 2, b: y + pH / 2 };
  };
  root.find = (str, nth = 1) => {
    let seen = 0;
    for (const tk of root.tokens) if (tk.raw === str || tk.raw.trim() === String(str).trim()) { if (++seen === nth) return tk.i; }
    S.warn(`libChatWindow.find: '${str}' #${nth} not in the answer`);
    return -1;
  };
  root.glow = (a, b, go = {}) => {
    const sp = root.span(a, b);
    const ring = S.rect({ x: sp.x1 - 6, y: sp.t - 6, w: sp.x2 - sp.x1 + 12, h: pH + 12, r: Math.min(16, (pH + 12) / 2), stroke: '#ffffff', sw: 2.5, filter: 'url(#glow-struct)' }, scroller);
    ring.setAttribute('data-audit', 'ignore');
    ring.style.opacity = 0;
    const d = go.d ?? 0.3, tl = gsap.timeline();
    tl.fromTo(ring, { opacity: 0 }, { opacity: 1, duration: d, ease: 'power2.out', immediateRender: false }, 0);
    if (go.hold !== Infinity) tl.fromTo(ring, { opacity: 1 }, { opacity: 0, duration: d * 1.6, ease: 'power2.in', immediateRender: false }, d + (go.hold ?? 0.8));
    tl.ring = ring;
    return tl;
  };
  const dimTo = (a, b, v, d) => {
    const tl = gsap.timeline();
    rng(a, b).forEach(tk => { if (Math.abs(tk.__dim - v) > 1e-3) tl.fromTo(tk.g, { opacity: tk.__dim }, { opacity: v, duration: d, ease: 'power2.out', immediateRender: false }, 0); tk.__dim = v; });
    if (!tl.getChildren().length) tl.set({}, {}, 0.01);
    return tl;
  };
  root.dimTokens = (a, b, dop = {}) => dimTo(a, b, dop.to ?? 0.5, dop.d ?? 0.5);
  root.undimTokens = (a, b, dop = {}) => dimTo(a, b, 1, dop.d ?? 0.5);
  root.ghosts = (a, b, go = {}) => {
    const tl = gsap.timeline(), ts = rng(a, b);
    ts.forEach((tk, k) => {
      if (!tk.ghost) {
        tk.ghost = S.rect({ ...tk.box, stroke: tone, strokeOpacity: 0.6, sw: 2, dash: '6 6' }, tk.mid);
        tk.ghost.setAttribute('data-audit', 'ignore');
      }
      tl.fromTo(tk.ghost, { autoAlpha: 0 }, { autoAlpha: 1, duration: go.d ?? 0.5, ease: 'power1.out' }, k * (go.stagger ?? 0.04));
    });
    return tl;
  };
  root.bracket = (a, b, bo = {}) => {
    const sp = root.span(a, b);
    const br = S.bracket({ x1: sp.x1 + 4, x2: sp.x2 - 4, y: sp.b + 10, label: bo.label, tone: bo.tone, size: bo.size }, scroller);
    br.style.opacity = 0; br.style.visibility = 'hidden';
    br.drawOn = (dO = {}) => {
      const d = dO.d ?? 0.6, tl = gsap.timeline();
      tl.fromTo(br, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0);
      tl.fromTo(br.line, { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: d, ease: 'power2.inOut' }, 0);
      if (br.label) tl.fromTo(br.label, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, d * 0.6);
      return tl;
    };
    return br;
  };
  return root;
}

/* ------------------------------------------------------------------ libBubble */
/**
 * libBubble — a speech bubble on its own: a user's question beside an avatar, a short reply, a thought in a
 * crowd. Neutral grey for a person (tail bottom-right), blue for the assistant (tail bottom-left).
 * o: text '', x 960, y 540 (centre of the bubble body), anchor 'middle' | 'start' (x = left) | 'end' (x = right),
 *    size 30, weight 500, tone 'neutral' | 'struct' | 'helps' ..., side 'right' | 'left' | 'none' (tail corner),
 *    maxW (wrap onto several lines), padX round(size*0.75), lh 1.3, avatar false (true: a user icon beside
 *    the tail; or an icon id), avatarSize round(size*1.4), hidden false.
 * Returns <g> with .bg (path), .lines[] (texts), .avatar, and .x .y .w .h .l .r .t .b .cx .cy.
 * Helpers: .pop({d: 0.5}) pop in from the tail · .type({d}) the text types in (bubble visible) · .shrink({d: 0.5})
 *    shrinks back into its tail and fades · .glow({hold}) a ring flashes
 *   const q = libBubble(S, { text: 'weather tomorrow?', x: 1600, y: 300, avatar: true });
 *   S.add(q.pop(), 'b2');
 *   S.add(q.type(), 'b2+0.2');
 *   S.add(q.shrink(), 'b2~travels');
 */
function libBubble(S, o = {}, parent) {
  const T = __TOK;
  const size = o.size || 30, weight = o.weight || 500, padX = o.padX ?? Math.round(size * 0.75);
  const lh = (o.lh || 1.3) * size, tone = o.tone || 'neutral', side = o.side || (tone === 'neutral' ? 'right' : 'left');
  const words = String(o.text ?? '').split(/\s+/).filter(Boolean);
  const lines = [];
  let ln = '';
  for (const w of words) {
    const t = ln ? ln + ' ' + w : w;
    if (o.maxW && ln && S.measure(t, { size, weight }) > o.maxW - 2 * padX) { lines.push(ln); ln = w; } else ln = t;
  }
  if (ln || !lines.length) lines.push(ln);
  const tw = Math.max(...lines.map(l => S.measure(l, { size, weight })), size);
  const w = tw + 2 * padX, h = Math.round(lines.length * lh + size * 0.85);
  const anchor = o.anchor || 'middle';
  const cx0 = o.x ?? 960;
  const x = anchor === 'middle' ? cx0 - w / 2 : anchor === 'end' ? cx0 - w : cx0;
  const y = (o.y ?? 540) - h / 2, r = Math.min(h / 2, Math.round(size * 0.8));
  const g = S.g(null, parent);
  const body = S.g(null, g);
  // one outline: a rounded body whose bottom corner on the tail side flicks out into a small tail
  const tl = Math.round(size * 0.45), tx = side === 'right' ? x + w + tl * 0.5 : x - tl * 0.5;
  const f = T.f2;
  let d;
  if (side === 'right') {
    d = `M${f(x + r)},${f(y)} H${f(x + w - r)} A${r},${r} 0 0 1 ${f(x + w)},${f(y + r)} V${f(y + h - r * 0.7)} ` +
      `Q${f(x + w)},${f(y + h)} ${f(x + w + tl * 0.5)},${f(y + h + tl * 0.45)} Q${f(x + w - r * 0.35)},${f(y + h + 1)} ${f(x + w - r * 1.3)},${f(y + h)} ` +
      `H${f(x + r)} A${r},${r} 0 0 1 ${f(x)},${f(y + h - r)} V${f(y + r)} A${r},${r} 0 0 1 ${f(x + r)},${f(y)} Z`;
  } else if (side === 'left') {
    d = `M${f(x + w - r)},${f(y)} H${f(x + r)} A${r},${r} 0 0 0 ${f(x)},${f(y + r)} V${f(y + h - r * 0.7)} ` +
      `Q${f(x)},${f(y + h)} ${f(x - tl * 0.5)},${f(y + h + tl * 0.45)} Q${f(x + r * 0.35)},${f(y + h + 1)} ${f(x + r * 1.3)},${f(y + h)} ` +
      `H${f(x + w - r)} A${r},${r} 0 0 0 ${f(x + w)},${f(y + h - r)} V${f(y + r)} A${r},${r} 0 0 0 ${f(x + w - r)},${f(y)} Z`;
  } else d = T.rrPath(x, y, w, h, r, r);
  const fill = tone === 'neutral' ? '#ffffff' : S.tone(tone);
  S.path({ d, fill: T.BASE }, body);
  g.bg = S.path({ d, fill, fillOpacity: tone === 'neutral' ? 0.09 : 0.18, stroke: tone === 'neutral' ? '#ffffff' : tone, strokeOpacity: tone === 'neutral' ? 0.16 : 0.7, sw: 1.5 }, body);
  g.lines = lines.map((l, i) => S.text(l, { x: x + padX, y: y + h / 2 + (i - (lines.length - 1) / 2) * lh + 1, size, weight, color: 'ink' }, body));
  if (o.avatar) {
    const as = o.avatarSize || Math.round(size * 1.4);
    const ax = side === 'left' ? x - 14 - as / 2 : x + w + 14 + as / 2;
    g.avatar = S.icon(typeof o.avatar === 'string' ? o.avatar : 'ph:user-circle-duotone', { x: ax, y: y + h - as / 2 + 6, size: as, color: tone === 'neutral' ? 'muted' : tone }, g);
  }
  Object.assign(g, { body, x, y, w, h, l: x, r: x + w, t: y, b: y + h, cx: x + w / 2, cy: y + h / 2, tailX: tx, tailY: y + h + tl * 0.45 });
  if (o.hidden) T.hide(g);
  const origin = `${side === 'left' ? 0 : side === 'right' ? 100 : 50}% 100%`;
  g.pop = (po = {}) => {
    const t2 = gsap.timeline();
    t2.fromTo(g, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0);
    t2.fromTo(body, { scale: 0.4, transformOrigin: origin }, { scale: 1, duration: po.d ?? 0.5, ease: 'back.out(2)', transformOrigin: origin }, 0);
    return t2;
  };
  g.type = (to = {}) => {
    const full = lines.join('\n'), n = full.length;
    const p = { v: 0 };
    const render = () => {
      let k = Math.round(p.v);
      lines.forEach((l, i) => { const s = l.slice(0, Math.max(0, k)); g.lines[i].textContent = s; k -= l.length + 1; });
    };
    return gsap.fromTo(p, { v: 0 }, { v: n, duration: to.d ?? Math.max(0.4, n * 0.04), ease: 'none', onUpdate: render, onStart: render, immediateRender: true });
  };
  g.shrink = (so = {}) => {
    const t2 = gsap.timeline(), d = so.d ?? 0.5;
    t2.fromTo(body, { scale: 1, transformOrigin: origin }, { scale: 0.2, duration: d, ease: 'power2.in', transformOrigin: origin, immediateRender: false }, 0);
    t2.fromTo(g, { autoAlpha: 1 }, { autoAlpha: 0, duration: d * 0.6, ease: 'power1.in', immediateRender: false }, d * 0.4);
    return t2;
  };
  g.glow = (go = {}) => {
    if (!g.ring) {
      g.ring = S.path({ d: T.rrPath(x - 6, y - 6, w + 12, h + 12, r + 6, r + 6), stroke: '#ffffff', sw: 2.5, filter: 'url(#glow-struct)' }, body);
      g.ring.setAttribute('data-audit', 'ignore'); g.ring.style.opacity = 0;
    }
    const d2 = go.d ?? 0.3, t2 = gsap.timeline();
    t2.fromTo(g.ring, { opacity: 0 }, { opacity: 1, duration: d2, immediateRender: false }, 0);
    t2.fromTo(g.ring, { opacity: 1 }, { opacity: 0, duration: d2 * 1.6, immediateRender: false }, d2 + (go.hold ?? 0.6));
    return t2;
  };
  return g;
}

/* ------------------------------------------------------------------ libPromptStack */
/**
 * libPromptStack — the assembled prompt drawn to a token scale: labelled segments (provider's system prompt,
 * tool definitions, custom instructions, a skill, the conversation, the new question) laid end to end in one
 * bar, optionally first shown as one bar per row (rows) that .toStack() slides together. Optional total counter
 * and a context-window outline at the same scale.
 * o: x 160, y 600 (top-left of the stacked bar), h 56, scale (px per token) or w (px for the whole prompt;
 *    default scale 0.25), segments [{label, tokens, tone 'struct', state (a token state: overrides tone),
 *    icon (badge icon id), value (text; default the token count), w (schematic px width: overrides the
 *    scale; say 'schematic' on screen)}], gap 4 (px carved between segments), r 10, size 26 (labels),
 *    labels 'auto' (inside if it fits, else above with a leader tick) | 'inside' | 'outside' | 'none',
 *    values true (token counts under the stacked bar / right of each row bar), rows (start as rows:
 *    {x (left edge of the row bars; default x + 420), y (top of the first row; default y - n*(h+gap) - 80),
 *    gap 22}), total false (true: 'total N tokens' counter right of the stacked bar; totalPrefix 'total ',
 *    totalSuffix ' tokens', totalSize 34), capacity (tokens: a dashed context-window outline at the same
 *    scale), capacityLabel ('context window: N tokens').
 * Returns <g> with .segs[] (each {g, body, barG, inG, label, value, badge, rowLabel, rowValue, tokens, x, w, i}),
 *    .X(tokens) (x of a token offset), .scale, .total, .totalEl, .frame, .frameLabel, .w and .l .r .t .b of the
 *    stacked bar.
 * Helpers (return tweens/timelines; call in time order):
 *    .grow(range, {d: 0.8, stagger: 0.25})  segments grow from their left ends (rows: each row with its label)
 *    .toStack({d: 1.1, stagger: 0.08})      rows slide end to end into the stacked bar, labels swap over
 *    .count({d: 1.2})                       the total counter appears and runs up to the sum
 *    .land(i, [x, y], {d: 0.8})             a segment flies in from a point and lands in place
 *    .append(seg, {d: 0.7})                 add a segment at the end (it grows in)
 *    .paint(range, state, {d: 0.4, stagger}) recolour segments (e.g. 'cached' teal for a hit, 'prefill' amber)
 *    .highlight(tokens, {tone: 'helps', label, d: 0.9})  a band sweeps over the first `tokens` tokens
 *    .notch(tokens, {label, d: 0.4})        a white notch drops across the bar at a token offset ('differs here')
 *    .showLabels(range, {d: 0.4})           labels of segments appear on cue (hidden until then)
 *    .showFrame({d: 0.8})                   the context-window outline draws on
 *   const ps = libPromptStack(S, { x: 140, y: 700, scale: 0.25, rows: { x: 620, y: 230 }, total: true,
 *     segments: [{ label: "provider's system prompt", tokens: 2000, icon: 'ph:globe-duotone' }, { label: 'tool definitions', tokens: 450 }] });
 *   S.add(ps.grow(0), 'b1~provider');
 *   S.add(ps.grow(1), 'b1~tool');
 *   S.add(ps.toStack(), 'b2');
 *   S.add(ps.count(), 'b2+0.6');
 */
function libPromptStack(S, o = {}, parent) {
  const T = __TOK;
  const specs = (o.segments || []).map(s => ({ tone: 'struct', ...s }));
  const totalTok = specs.reduce((a, s) => a + (s.tokens || 0), 0);
  const scale = o.scale ?? (o.w ? o.w / Math.max(1, totalTok) : 0.25);
  const h = o.h || 56, gap = o.gap ?? 4, r = o.r ?? 10, size = o.size || 26, vSize = Math.max(24, o.valueSize || 24);
  const sx = o.x ?? 160, sy = o.y ?? 600;
  const rows = o.rows ? { gap: 22, ...o.rows } : null;
  if (rows) { rows.x = rows.x ?? sx + 420; rows.y = rows.y ?? sy - specs.length * (h + rows.gap) - 80; }
  const root = S.g(null, parent);
  const backG = S.g(null, root), rowG = S.g(null, root), segG = S.g(null, root), labG = S.g(null, root), topG = S.g(null, root);
  const X = t => sx + t * scale;
  Object.assign(root, { X, scale, total: totalTok });
  const labelMode = o.labels || 'auto';
  const placedAbove = [], placedBelow = [];   // x-extents of outside labels / values, per tier
  const tierFor = (list, box, gapX) => { let k = 0; for (; k < 6; k++) if (!(list[k] || []).some(b => !(box[1] + gapX < b[0] || box[0] - gapX > b[1]))) break; (list[k] = list[k] || []).push(box); return k; };
  // ---- context-window outline
  if (o.capacity) {
    const cw = o.capacity * scale;
    root.frame = S.rect({ x: sx - 7, y: sy - 8, w: cw + 14, h: h + 16, r: r + 6, stroke: 'struct', strokeOpacity: 0.6, sw: 2, dash: '10 8' }, backG);
    const fl = o.capacityLabel ?? `context window: ${S.fmt.int(o.capacity)} tokens`;
    const flw = S.measure(fl, { size, weight: 550 });
    root.frameLabel = S.text(fl, { x: sx + cw + 7, y: sy - 8 - 26, size, weight: 550, anchor: 'end', color: 'muted' }, backG);
    (placedAbove[0] = placedAbove[0] || []).push([sx + cw + 7 - flw, sx + cw + 7]);
  }
  // ---- one segment, drawn at its stack geometry
  let cum = 0;
  const makeSeg = (s, i, x, w, last) => {
    const g = S.g(null, segG), body = S.g(null, g), barG = S.g(null, body), inG = S.g(null, body);
    const carve = last ? 0 : Math.min(gap, w * 0.25);
    const bw = Math.max(1.5, w - carve);
    const st = T.state(s.state || (s.style ? { tone: s.tone, style: s.style } : s.tone), S);
    const geom = { x, y: sy, w: bw, h, r: Math.min(r, bw / 2) };
    const sk = T.skin(S, geom, st, barG);
    const seg = { g, body, barG, inG, skin: sk, st, tokens: s.tokens || 0, x, w, bw, i, geom, spec: s, outs: [], carved: !last };
    const iconSize = Math.round(h * 0.55);
    const lw = s.label ? S.measure(s.label, { size, weight: 600 }) : 0;
    const iconIn = s.icon && bw >= iconSize + 28;
    const room = bw - 32 - (iconIn ? iconSize + 10 : 0);
    const inside = s.label && labelMode !== 'none' && labelMode !== 'outside' && (labelMode === 'inside' || (lw <= room && h >= size * 1.35));
    const tc = st.text === 'ink' ? 'ink' : st.text;
    if (iconIn) seg.badge = S.icon(s.icon, { x: x + 16 + iconSize / 2, y: sy + h / 2, size: iconSize, color: st.text === T.DARK ? T.DARK : (s.state ? (T.GRAD.includes(s.state) ? s.state : 'struct') : s.tone) }, inG);
    if (inside) {
      const lx = iconIn ? x + 16 + iconSize + 10 + room / 2 + 8 : x + bw / 2;
      seg.label = S.text(s.label, { x: lx, y: sy + h / 2 + 1, size, weight: 600, anchor: 'middle', color: tc, maxW: Math.max(20, room + 8) }, inG);
    } else if (s.label && labelMode !== 'none') {
      // above the bar, in the lowest tier where it collides with nothing and sits on no lower tier's tick
      const cx = x + bw / 2;
      const lx1 = Math.max(cx - lw / 2, sx - 4), box = [lx1, lx1 + lw];
      let tier = 0;
      for (; tier < 6; tier++) {
        const clash = (placedAbove[tier] || []).some(b => !(box[1] + 18 < b[0] || box[0] - 18 > b[1]));
        const onTick = placedAbove.slice(0, tier).some(list => (list || []).some(b => cx > b[0] - 10 && cx < b[1] + 10));
        if (!clash && !onTick) break;
      }
      (placedAbove[tier] = placedAbove[tier] || []).push(box);
      const ly = sy - 32 - tier * Math.round(size * 1.4);
      const og = S.g(null, labG);
      seg.label = S.text(s.label, { x: box[0], y: ly, size, weight: 600, color: 'ink' }, og);
      seg.tick = S.line({ x1: cx, y1: sy - 5, x2: cx, y2: ly + size * 0.6, stroke: '#ffffff', strokeOpacity: 0.35, sw: 1.5 }, og);
      if (iconIn === false && s.icon) {
        seg.badge = S.icon(s.icon, { x: box[0] - 10 - size * 0.5, y: ly, size: Math.round(size * 1.05), color: s.tone }, og);
        seg.label.setAttribute('x', box[0]);
      }
      seg.outs.push(og);
    }
    if (o.values !== false && s.tokens !== undefined) {
      const vt = s.value ?? S.fmt.int(s.tokens);
      const vw = S.measure(vt, { size: vSize, weight: 500, family: 'mono' });
      const cx = x + bw / 2;
      const b0 = Math.max(sx, cx - vw / 2);
      const tier = tierFor(placedBelow, [b0, b0 + vw], 16);
      const vg = S.g(null, labG);
      seg.value = S.text(vt, { x: b0, y: sy + h + 28 + tier * Math.round(vSize * 1.35), size: vSize, weight: 500, family: 'mono', color: 'muted' }, vg);
      seg.outs.push(vg);
    }
    return seg;
  };
  root.segs = specs.map((s, i) => {
    const x = X(0) + cum * scale;
    const w = s.w ?? (s.tokens || 0) * scale;
    cum += s.w !== undefined ? s.w / scale : (s.tokens || 0);
    return makeSeg(s, i, x, w, i === specs.length - 1);
  });
  // ---- rows: each segment as its own bar on a common left edge, label on the left, value on the right
  if (rows) {
    root.segs.forEach((seg, i) => {
      const ry = rows.y + i * (h + rows.gap);
      S.xset(seg.g, { x: rows.x - seg.x, y: ry - sy });
      seg.inG.style.opacity = 0;
      seg.outs.forEach(e => { e.style.opacity = 0; });
      const rg = S.g(null, rowG);
      const s = seg.spec, iconSize = Math.round(h * 0.62);
      if (s.label) {
        seg.rowLabel = S.text(s.label, { x: rows.x - 26, y: ry + h / 2 + 1, size, weight: 550, anchor: 'end', color: 'ink' }, rg);
        if (s.icon) {
          const lw = S.measure(s.label, { size, weight: 550 });
          seg.rowBadge = S.icon(s.icon, { x: rows.x - 26 - lw - 14 - iconSize / 2, y: ry + h / 2, size: iconSize, color: s.tone }, rg);
        }
      }
      if (o.values !== false) {
        const vg = S.g(null, rowG);
        seg.rowValue = S.text(s.value ?? S.fmt.int(s.tokens || 0), { x: rows.x + seg.bw + 22, y: ry + h / 2 + 1, size, weight: 500, family: 'mono', color: 'ink' }, vg);
        seg.rowValueG = vg;
      }
      seg.row = rg; seg.ry = ry;
    });
  }
  const lastSeg = root.segs[root.segs.length - 1];
  const stackW = lastSeg ? lastSeg.x + lastSeg.w - sx : 0;
  Object.assign(root, { w: stackW, l: sx, r: sx + stackW, t: sy, b: sy + h, h, x: sx, y: sy });
  // ---- total counter
  if (o.total) {
    root.totalEl = S.counter({ x: sx + stackW + 28, y: sy + h / 2 + 1, size: o.totalSize || 34, value: totalTok, fmt: S.fmt.int,
      prefix: o.totalPrefix ?? 'total ', suffix: o.totalSuffix ?? ' tokens', family: 'sans', tnum: true, weight: 650, color: 'ink' }, topG);
  }

  // ---- helpers
  const pick = range => T.idx(range, root.segs.length).map(i => root.segs[i]);
  const labelsOf = seg => (rows && !root.__stacked ? [seg.row, seg.rowValueG] : [seg.inG, ...seg.outs]).filter(Boolean);
  root.grow = (range, go = {}) => {
    const d = go.d ?? 0.8, tl = gsap.timeline();
    pick(range).forEach((seg, k) => {
      const at = k * (go.stagger ?? 0.25);
      seg.barG.querySelectorAll('rect').forEach(rc => tl.fromTo(rc, { attr: { width: 0 } }, { attr: { width: seg.bw }, duration: d, ease: 'power3.out' }, at));
      if (rows && !root.__stacked) {
        if (seg.row) tl.fromTo(seg.row, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power2.out' }, at);
        if (seg.rowValueG) tl.fromTo(seg.rowValueG, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power1.out' }, at + d * 0.7);
      } else {
        tl.fromTo(labelsOf(seg), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power1.out' }, at + d * 0.55);
      }
    });
    return tl;
  };
  root.toStack = (to = {}) => {
    const d = to.d ?? 1.1, tl = gsap.timeline();
    if (!rows) return tl.set({}, {}, 0.01);
    root.__stacked = true;
    tl.fromTo(root.segs.map(s => s.row).filter(Boolean), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.35, immediateRender: false }, 0);
    tl.fromTo(root.segs.map(s => s.rowValueG).filter(Boolean), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, immediateRender: false }, 0.1);
    root.segs.forEach((seg, k) => tl.add(S.fx.xform(seg.g, { x: 0, y: 0 }, { d, ease: 'power3.inOut' }), 0.15 + k * (to.stagger ?? 0.08)));
    const end = 0.15 + d + (root.segs.length - 1) * (to.stagger ?? 0.08);
    root.segs.forEach(seg => tl.fromTo([seg.inG, ...seg.outs], { opacity: 0 }, { opacity: 1, duration: 0.45, immediateRender: false }, end - 0.1));
    return tl;
  };
  root.count = (co = {}) => {
    const tl = gsap.timeline();
    if (!root.totalEl) return tl.set({}, {}, 0.01);
    tl.fromTo(root.totalEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0);
    tl.add(S.fx.count(root.totalEl, 0, root.total, { d: co.d ?? 1.2, fmt: S.fmt.int }), 0);
    return tl;
  };
  root.land = (i, pt, lo = {}) => {
    const seg = pick(i)[0];
    const cx = seg.x + seg.bw / 2, cy = sy + h / 2;
    const tl = gsap.timeline(), d = lo.d ?? 0.8;
    tl.fromTo(seg.body, { autoAlpha: 0, x: pt[0] - cx, y: pt[1] - cy }, { autoAlpha: 1, x: 0, y: 0, duration: d, ease: lo.ease || 'power3.inOut' }, 0);
    if (seg.outs.length) tl.fromTo(seg.outs, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 }, d * 0.85);
    return tl;
  };
  root.showLabels = (range, so = {}) => {
    const tl = gsap.timeline();
    pick(range).forEach((seg, k) => {
      const els = [seg.label, seg.badge && seg.badge.parentNode === seg.inG ? seg.badge : null, ...seg.outs].filter(Boolean);
      tl.fromTo(els, { autoAlpha: 0 }, { autoAlpha: 1, duration: so.d ?? 0.4, ease: 'power1.out' }, k * (so.stagger ?? 0.1));
    });
    return tl;
  };
  root.paint = (range, state, po = {}) => {
    const d = po.d ?? 0.4, tl = gsap.timeline();
    pick(range).forEach((seg, k) => {
      const nst = T.state(state, S), prev = seg.skin;
      const nk = T.skin(S, seg.geom, nst, seg.barG);
      nk.style.opacity = 0;
      seg.skin = nk; seg.st = nst;
      tl.fromTo(nk, { opacity: 0 }, { opacity: 1, duration: d, ease: 'power1.inOut', immediateRender: false }, k * (po.stagger || 0));
      tl.fromTo(prev, { opacity: 1 }, { opacity: 0, duration: d, ease: 'power1.inOut', immediateRender: false }, k * (po.stagger || 0));
      if (seg.label && seg.label.parentNode === seg.inG) {
        const a = S.tone(seg.__lab || 'ink'), b = S.tone(nst.text);
        if (a !== b) tl.fromTo(seg.label, { attr: { fill: a } }, { attr: { fill: b }, duration: d, immediateRender: false }, k * (po.stagger || 0));
        seg.__lab = nst.text;
      }
    });
    return tl;
  };
  const hi = { rect: null, w: 0, label: null };
  root.highlight = (tokens, ho = {}) => {
    const tone = ho.tone || 'helps', d = ho.d ?? 0.9;
    if (!hi.rect) hi.rect = S.rect({ x: sx - 6, y: sy - 7, w: 0, h: h + 14, r: r + 5, fill: tone, fillOpacity: 0.16, stroke: tone, strokeOpacity: 0.95, sw: 3 }, topG);
    const tw = tokens > 0 ? X(Math.min(tokens, root.total)) - sx + 12 : 0;
    const tl = gsap.timeline();
    tl.fromTo(hi.rect, { attr: { width: hi.w } }, { attr: { width: tw }, duration: d, ease: 'power2.inOut', immediateRender: false }, 0);
    hi.w = tw;
    if (hi.label) { tl.fromTo(hi.label, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, immediateRender: false }, 0); hi.label = null; }
    if (ho.label && tokens > 0) {
      const lab = S.text(ho.label, { x: ho.labelX ?? sx + tw / 2, y: ho.labelY ?? sy - 36, size: ho.size || 28, weight: 600, anchor: 'middle', color: tone }, topG);
      T.hide(lab);
      tl.fromTo(lab, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, d * 0.8);
      tl.labelEl = lab; hi.label = lab;
    }
    return tl;
  };
  root.notch = (tokens, no = {}) => {
    const nx = X(tokens);
    const ng = S.g(null, topG);
    S.line({ x1: nx, y1: sy - 14, x2: nx, y2: sy + h + 14, stroke: '#ffffff', sw: 3.5 }, ng);
    if (no.label) ng.label = S.text(no.label, { x: nx, y: sy + h + 44, size: no.size || 26, weight: 600, anchor: 'middle', color: 'ink' }, ng);
    const tl = gsap.timeline();
    tl.fromTo(ng, { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: no.d ?? 0.4, ease: 'power3.out' }, 0);
    tl.notchEl = ng;
    return tl;
  };
  root.append = (s, ao = {}) => {
    s = { tone: 'struct', ...s };
    const last = root.segs[root.segs.length - 1];
    if (last && !last.carved) {
      // carve the old last segment's right end so the new one sits a gap away
      const carve = Math.min(gap, last.w * 0.25);
      last.barG.querySelectorAll('rect').forEach(rc => rc.setAttribute('width', Math.max(1.5, last.w - carve)));
      last.bw = Math.max(1.5, last.w - carve); last.geom.w = last.bw; last.carved = true;
    }
    const x = last ? last.x + last.w : sx;
    const w = s.w ?? (s.tokens || 0) * scale;
    const seg = makeSeg(s, root.segs.length, x, w, true);
    root.segs.push(seg);
    root.total += s.tokens || 0;
    if (root.totalEl) root.totalEl.textContent = (root.totalEl.__prefix || '') + S.fmt.int(root.total) + (root.totalEl.__suffix || '');
    return root.grow(seg.i, { d: ao.d ?? 0.7 });
  };
  root.showFrame = (fo = {}) => {
    const tl = gsap.timeline();
    if (!root.frame) return tl.set({}, {}, 0.01);
    tl.fromTo(root.frame, { autoAlpha: 0 }, { autoAlpha: 1, duration: fo.d ?? 0.8, ease: 'power1.out' }, 0);
    tl.fromTo(root.frameLabel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, (fo.d ?? 0.8) * 0.5);
    return tl;
  };
  return root;
}
