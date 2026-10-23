/* video/lib/tokens.js — shared film library: text and tokens.
 *
 *   libTokenize(text, o)            text -> token strings: 'Short wavelengths,' -> ['Short', ' wave', 'lengths', ',']
 *   libToken(S, o, parent)          one token chip: a rounded blue pill, optional ID, a colour state
 *   libTokenStrip(S, o, parent)     a row of chips: append, stream, states, prefix highlight, cut, split, wrap
 *   libChatWindow(S, o, parent)     a chat app panel whose answer streams in token by token
 *   libPromptStack(S, o, parent)    the assembled prompt as labelled segments drawn to a token scale
 *
 * Every helper RETURNS a tween or timeline: place it with S.add(tween, at). Nothing here adds to
 * S.tl itself, reads the clock or uses Math.random, so every frame is the same however it is reached.
 * Helpers that change the same element over time keep a plan (like fx.xform): call them in time order.
 *
 * Token colour states (option `state`, helper `setState`):
 *   'token' (default) soft blue · 'new' blue with a white outline and glow (just generated)
 *   'cached' teal (held / a hit) · 'prefill' amber (arithmetic to do) · 'recompute' blue with an amber outline
 *   'changed' violet (the edited token) · 'bytes' coral · 'dim' grey (out of reach, not the subject)
 *   'ghost' dashed outline (not there yet / never computed) · 'slot' empty dashed slot (no text)
 *   'solid' solid blue (emphasis) · or any {tone, style: 'soft'|'solid'|'outline'|'ghost'}
 */

/* ------------------------------------------------------------------ internals */
const __TOK = (() => {
  const SOFT = t => ({ fill: `url(#card-${t})`, stroke: t, so: 0.75, sw: 2, text: 'ink', base: true });
  const STATES = {
    token: SOFT('struct'), struct: SOFT('struct'),
    new: { fill: 'url(#card-struct)', stroke: '#ffffff', so: 0.95, sw: 2.5, text: 'ink', base: true, glow: true },
    cached: SOFT('helps'), helps: SOFT('helps'),
    prefill: SOFT('compute'), compute: SOFT('compute'),
    recompute: { fill: 'url(#card-struct)', stroke: 'compute', so: 1, sw: 3, text: 'ink', base: true },
    changed: SOFT('violet'), violet: SOFT('violet'),
    bytes: SOFT('bytes'),
    dim: { fill: 'url(#card-neutral)', stroke: '#ffffff', so: 0.13, sw: 2, text: 'faint', base: true },
    ghost: { fill: 'none', stroke: 'struct', so: 0.6, sw: 2, dash: '7 6', text: 'muted', base: false },
    slot: { fill: 'none', stroke: 'struct', so: 0.5, sw: 2, dash: '7 6', text: 'muted', base: false, noText: true },
    solid: { fill: 'url(#solid-struct)', stroke: 'struct', so: 0, sw: 0, text: '#0a0f1e', base: true },
  };
  function state(st) {
    if (st && typeof st === 'object') {
      const tone = st.tone || 'struct', style = st.style || 'soft';
      if (style === 'solid') return { fill: `url(#solid-${tone})`, stroke: tone, so: 0, sw: 0, text: '#0a0f1e', base: true };
      if (style === 'outline') return { fill: 'url(#card-struct)', stroke: tone, so: 1, sw: 3, text: 'ink', base: true };
      if (style === 'ghost') return { fill: 'none', stroke: tone, so: 0.6, sw: 2, dash: '7 6', text: 'muted', base: false };
      return SOFT(tone);
    }
    return STATES[st || 'token'] || SOFT(st);
  }
  /** One skin: opaque base + tinted, stroked pill. b: {x, y, w, h, r} */
  function skin(S, b, st, parent) {
    const g = S.g(null, parent);
    if (st.base) S.rect({ x: b.x, y: b.y, w: b.w, h: b.h, r: b.r, fill: '#0c1326' }, g);
    const t = S.rect({ x: b.x, y: b.y, w: b.w, h: b.h, r: b.r, fill: st.fill, stroke: st.sw ? st.stroke : undefined,
      strokeOpacity: st.so, sw: st.sw, dash: st.dash, filter: st.glow ? 'url(#glow-struct)' : undefined }, g);
    g.tint = t;
    return g;
  }
  /** Indices from a range spec: i, [a, b] (inclusive; negatives count from the end), or 'all'. */
  function idx(range, n) {
    const fix = i => (i < 0 ? n + i : i);
    if (range === undefined || range === 'all') return [...Array(n).keys()];
    if (Array.isArray(range)) { const a = fix(range[0]), b = fix(range[1] ?? range[0]); const out = []; for (let i = Math.max(0, a); i <= Math.min(n - 1, b); i++) out.push(i); return out; }
    return [fix(range)];
  }
  /** A rounded-rect path with separate left/right corner radii (for title bars etc.). */
  function rrPath(x, y, w, h, rl, rr, top = true, bottom = true) {
    const tl = top ? rl : 0, tr = top ? rr : 0, br = bottom ? rr : 0, bl = bottom ? rl : 0;
    return `M${x + tl},${y} H${x + w - tr} ${tr ? `A${tr},${tr} 0 0 1 ${x + w},${y + tr}` : ''} V${y + h - br} ${br ? `A${br},${br} 0 0 1 ${x + w - br},${y + h}` : ''} H${x + bl} ${bl ? `A${bl},${bl} 0 0 1 ${x},${y + h - bl}` : ''} V${y + tl} ${tl ? `A${tl},${tl} 0 0 1 ${x + tl},${y}` : ''} Z`;
  }
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const easeOut = p => 1 - Math.pow(1 - clamp(p), 3);
  const easeInOut = p => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  /** A stable illustrative token ID from the text (not a real tokenizer's ID: say so on screen). */
  function fakeId(t) {
    let h = 2166136261;
    for (const c of String(t)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    return 100 + (h % 99800);
  }
  /** Hide an element at build time in a way GSAP's autoAlpha tweens understand. */
  function hide(e) { e.style.opacity = 0; e.style.visibility = 'hidden'; }
  return { STATES, state, skin, idx, rrPath, clamp, easeOut, easeInOut, fakeId, hide };
})();

/* ------------------------------------------------------------------ libTokenize */
/**
 * libTokenize — split text into plausible LLM tokens: each word with its leading space is one token,
 * punctuation is its own token, and words listed in `splits` break into pieces.
 *   text: the string. o.splits: {word: [pieces]} (matched on the bare lower-case word), e.g.
 *   {wavelengths: ['wave', 'lengths']} -> ' wave', 'lengths'. Default {}.
 * Returns an array of strings (leading spaces kept) whose concatenation is the original text.
 * Illustrative only: real tokenizers differ; scenes that show IDs or counts should say 'illustrative'.
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
      // keep the original capitalisation: cut the original word at the piece lengths
      let word = t.trim(), k = 0;
      splits[key].forEach((p, i) => { out.push((i === 0 ? lead : '') + word.slice(k, k + p.length)); k += p.length; });
    } else out.push(t);
  }
  return out;
}

/* ------------------------------------------------------------------ libToken */
/**
 * libToken — one token chip: a rounded pill with the token's text, in a colour state, with an
 * optional token ID beneath it (or inline, 'fox · ID 4271' style).
 * o: text ('' = an unlabelled chip), x, y (centre y), anchor 'middle' (x is the centre) | 'start' (x is
 *    the left edge), size 30 (font px), h round(size*1.85), w (fixed width; default fits the text),
 *    minW h (narrowest chip, for ',' and '.'), padX round(size*0.62), r min(h/2, h*0.3),
 *    state 'token' (see the state list at the top of this file), mono false, weight 600,
 *    id (number|string|true = illustrative stable ID) shown beneath; idPos 'below' | 'inline';
 *    idSize max(24, size*0.8), idColor 'muted'.
 * Returns <g> with .skin (current skin <g>), .skins[], .label, .idEl, .divider (inline), and geometry
 *    .x .y .w .h .l .r .t .b .cx .cy (as drawn; tweens move the <g>, not these numbers), .text, .state.
 * Helpers (each returns a tween/timeline for S.add):
 *    .setState(state, {d: 0.4})   crossfade to another colour state
 *    .pop({d: 0.5, from: 0.5})    pop in (hidden until then)
 *    .flyIn([fx, fy], {d: 0.8})   fly in from a point (parent coords), fading up (hidden until then)
 *    .pulse({scale: 1.12, d: 0.5}) brief scale pulse · .glow({hold: 0.6, d: 0.3}) white ring flashes on and off
 *   const tok = libToken(S, { text: 'fox', x: 400, y: 500, id: 4271, idPos: 'inline' });
 *   S.add(tok.pop(), 'b2~fox');
 *   S.add(tok.glow(), 'b2~token');
 *   S.add(tok.setState('cached'), 'b3~kept');
 */
function libToken(S, o = {}, parent) {
  const T = __TOK;
  const size = o.size || 30, h = o.h || Math.round(size * 1.85);
  const padX = o.padX ?? Math.round(size * 0.62), weight = o.weight || 600, fam = o.mono ? 'mono' : 'sans';
  const text = String(o.text ?? '').trim();
  const tw = text ? S.measure(text, { size, weight, family: fam }) : 0;
  const inline = o.id !== undefined && o.id !== null && o.id !== false && o.idPos === 'inline';
  const idText = o.id === true ? String(T.fakeId(text)) : o.id;
  const idSize = o.idSize || Math.max(24, Math.round(size * 0.8));
  const idStr = inline ? `ID ${idText}` : null;
  const iw = inline ? S.measure(idStr, { size: idSize, weight: 500, family: 'mono' }) : 0;
  let w = o.w || Math.max(o.minW ?? h, tw + 2 * padX + (inline ? iw + padX * 1.6 + 2 : 0));
  const x = (o.anchor || 'middle') === 'middle' ? (o.x || 0) - w / 2 : (o.x || 0);
  const y = (o.y || 0) - h / 2, r = o.r ?? Math.min(h / 2, Math.round(h * 0.3));
  const g = S.g(null, parent);
  g.skinG = S.g(null, g);
  const st = T.state(o.state);
  g.skin = T.skin(S, { x, y, w, h, r }, st, g.skinG);
  g.skins = [g.skin];
  g.__st = st; g.__lab = S.tone(st.text);
  if (text) {
    const lx = inline ? x + padX + tw / 2 : x + w / 2;
    g.label = S.text(text, { x: lx, y: (o.y || 0) + 1, size, weight, family: fam, anchor: 'middle', color: st.text });
    g.skinG.parentNode.appendChild(g.label);
    if (st.noText) g.label.style.opacity = 0;
  }
  if (inline) {
    const dx = x + padX + tw + padX * 0.8;
    g.divider = S.line({ x1: dx, y1: y + h * 0.22, x2: dx, y2: y + h * 0.78, stroke: '#ffffff', strokeOpacity: 0.28, sw: 2 }, g);
    g.idEl = S.text(idStr, { x: dx + padX * 0.8, y: (o.y || 0) + 1, size: idSize, weight: 500, family: 'mono', color: o.idColor || 'muted' }, g);
  } else if (idText !== undefined && idText !== null && idText !== false) {
    g.idEl = S.text(String(idText), { x: x + w / 2, y: y + h + 12 + idSize * 0.55, size: idSize, weight: 500, family: 'mono', anchor: 'middle', color: o.idColor || 'muted' }, g);
  }
  Object.assign(g, { x, y, w, h, r, l: x, r_: x + w, t: y, b: y + h, cx: x + w / 2, cy: o.y || 0, text, state: o.state || 'token', size });
  g.r = x + w; g.rad = r;
  g.__dx = 0; g.__dy = 0;

  g.setState = (state, so = {}) => {
    const nst = T.state(state), prev = g.skin, prevCol = g.__lab, prevNo = !!g.__st.noText;
    const nk = T.skin(S, { x, y, w, h, r }, nst, g.skinG);
    nk.style.opacity = 0;
    g.skins.push(nk); g.skin = nk; g.__st = nst; g.__lab = S.tone(nst.text); g.state = state;
    const d = so.d ?? 0.4, tl = gsap.timeline();
    tl.fromTo(nk, { opacity: 0 }, { opacity: 1, duration: d, ease: 'power1.inOut', immediateRender: false }, 0);
    tl.fromTo(prev, { opacity: 1 }, { opacity: 0, duration: d, ease: 'power1.inOut', immediateRender: false }, 0);
    if (g.label) {
      if (prevCol !== g.__lab) tl.fromTo(g.label, { attr: { fill: prevCol } }, { attr: { fill: g.__lab }, duration: d, ease: 'power1.inOut', immediateRender: false }, 0);
      if (prevNo !== !!nst.noText) tl.fromTo(g.label, { opacity: prevNo ? 0 : 1 }, { opacity: prevNo ? 1 : 0, duration: d, immediateRender: false }, 0);
    }
    return tl;
  };
  g.pop = (po = {}) => gsap.fromTo(g, { autoAlpha: 0, scale: po.from ?? 0.5, transformOrigin: '50% 50%' },
    { autoAlpha: 1, scale: 1, duration: po.d ?? 0.5, ease: po.ease || 'back.out(2.2)', transformOrigin: '50% 50%' });
  g.flyIn = (pt, fo = {}) => {
    const t = gsap.fromTo(g, { autoAlpha: 0, x: pt[0] - g.cx + g.__dx, y: pt[1] - g.cy + g.__dy, scale: fo.scale ?? 0.9, transformOrigin: '50% 50%' },
      { autoAlpha: 1, x: g.__dx, y: g.__dy, scale: 1, duration: fo.d ?? 0.8, ease: fo.ease || 'power3.out', transformOrigin: '50% 50%' });
    return t;
  };
  g.pulse = (po = {}) => gsap.fromTo(g, { scale: 1, transformOrigin: '50% 50%' },
    { scale: po.scale ?? 1.12, duration: (po.d ?? 0.5) / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%', immediateRender: false });
  g.glow = (go = {}) => {
    if (!g.ring) {
      g.ring = S.rect({ x: x - 5, y: y - 5, w: w + 10, h: h + 10, r: r + 5, stroke: '#ffffff', sw: 2.5, filter: 'url(#glow-struct)' }, g);
      g.ring.setAttribute('data-audit', 'ignore');
      g.ring.style.opacity = 0;
    }
    const d = go.d ?? 0.3, tl = gsap.timeline();
    tl.fromTo(g.ring, { opacity: 0 }, { opacity: 1, duration: d, ease: 'power2.out', immediateRender: false }, 0);
    if (go.hold !== Infinity) tl.to(g.ring, { opacity: 0, duration: d * 1.6, ease: 'power2.in' }, d + (go.hold ?? 0.6));
    return tl;
  };
  return g;
}

/* ------------------------------------------------------------------ libTokenStrip */
/**
 * libTokenStrip — a row of token chips (the film's basic unit of text), left to right, wrapping onto
 * more lines inside maxW. Tokens can be appended (pop in at the end, or fly in from a point), streamed,
 * recoloured by state, highlighted as a prefix, cut out of a sentence bar, split into pieces, scrolled
 * like a sliding window, and dropped out of reach.
 * o: x (left edge; the centre with align 'middle'), y (centre of the first line), tokens [] (strings or
 *    {t, id, state, w}), size 30, h round(size*1.85), gap 10, padX, w (fixed chip width: columns of
 *    two strips line up), minW h, maxW (wrap width; default none = one line), lineGap round(h*0.45)
 *    (+ room for IDs), align 'start' | 'middle' (centres the initial line), state 'token' (default state),
 *    mono false, weight 600, ids false (true: illustrative stable IDs from the text; or give tokens {t, id}),
 *    idSize, slots 0 (empty dashed slots after the tokens, consumed by append), slotW (default w or h*1.6),
 *    joined false (start as one sentence bar; .cut() breaks it into chips; one line only), hidden false
 *    (start with every token hidden: reveal them with .reveal()).
 * Returns <g> (root) with .content (inner group: holds chips; scrolled by .shift), .tokens[] (libToken
 *    chips, in order, each with .i, .line), .slots[], .bar (joined sentence bar), .lineH, .h, and
 *    .l .t .r .b of the initial layout. Move/scale the whole strip with S.xset/fx.xform on the root.
 * Helpers (all return a tween/timeline; call them in time order):
 *    .append(t | {t, id, state}, {from: [x, y], d, state})  build a chip at the end and pop/fly it in
 *    .stream(list, {every: 0.25, d})        append several, one every `every` s
 *    .reveal(range, {every: 0.08, d})       pop in chips that already exist (range: i | [a, b] | 'all')
 *    .setState(range, state, {d: 0.4, stagger: 0})   recolour (stagger > 0 sweeps left to right)
 *    .highlight(n, {tone: 'helps', label, d: 0.8, pad: 8})  teal band behind the first n chips; call again
 *        to grow/shrink it (0 collapses it). The timeline carries .labelEl (fade it with fx.out).
 *    .cut({d: 0.9})                         joined sentence bar -> separate chips (cut marks, then they part)
 *    .split(i, pieces, {d: 0.9})            chip i cracks into pieces in place; later chips make room
 *    .showIds({stagger: 0.05})              fade the IDs in (hidden until then)
 *    .pulse(range, {stagger: 0.12, scale}) · .glow(range, {hold}) · .drop(range, {dy: 70, d: 0.6})
 *    .shift(n, {d: 0.6})                    scroll the content so chip n sits at the strip's left edge
 *    .span(a, b) -> {x1, x2, cx, t, b} (geometry, ignoring .shift) · .bracket(a, b, {label, up, tone, size})
 *        builds an S.bracket under (or over) chips a..b (visible: give it an entrance) · .next() -> {x, y}
 *   const s = libTokenStrip(S, { x: 320, y: 260, tokens: [' the', ' quick', ' brown', ' fox', ' jumps'], joined: true });
 *   S.add(fx.in(s, { from: 'fade' }), 'b1');
 *   S.add(s.cut(), 'b1~cut');
 *   S.add(s.append(' over', { from: [1500, 700] }), 'b2~appended');
 *   S.add(s.highlight(3, { label: 'prefix' }), 'b3~token for token');
 */
function libTokenStrip(S, o = {}, parent) {
  const T = __TOK;
  const size = o.size || 30, h = o.h || Math.round(size * 1.85), gap = o.gap ?? 10;
  const weight = o.weight || 600, fam = o.mono ? 'mono' : 'sans';
  const padX = o.padX ?? Math.round(size * 0.62), minW = o.minW ?? h;
  const idSize = o.idSize || Math.max(24, Math.round(size * 0.8));
  const anyIds = !!o.ids || (o.tokens || []).some(t => t && typeof t === 'object' && t.id !== undefined);
  const lineH = h + (o.lineGap ?? Math.round(h * 0.45)) + (anyIds ? idSize + 14 : 0);
  const root = S.g(null, parent);
  const content = S.g(null, root);
  const hiG = S.g(null, content);          // prefix highlight bands, behind the chips
  const barG = S.g(null, content);         // joined sentence bar
  const tokG = S.g(null, content);
  const decoG = S.g(null, content);        // brackets, cut marks
  const norm = t => (t && typeof t === 'object' ? t : { t: String(t) });
  const chipW = t => o.w || Math.max(minW, S.measure(String(t).trim(), { size, weight, family: fam }) + 2 * padX);
  const slotW = o.slotW || o.w || Math.round(h * 1.6);

  // ---- layout cursor: left edge per line, next x, line index
  const x0 = o.x || 0, y0 = o.y || 0;
  const cur = { left: x0, x: x0, line: 0 };
  const items = (o.tokens || []).map(norm);
  if ((o.align || 'start') === 'middle') {
    // centre the initial first line on x; later lines (and wraps) start at x - maxW/2
    const ws = items.map(it => it.w || chipW(it.t));
    let tot = 0, n = 0;
    for (const w of ws) { if (o.maxW && tot + w > o.maxW && n) break; tot += w + (n ? gap : 0); n++; }
    const slotsW = (o.slots || 0) * (slotW + gap);
    cur.left = x0 - (o.maxW ? o.maxW / 2 : (tot + slotsW) / 2);
    cur.x = x0 - (tot + (o.maxW ? 0 : slotsW)) / 2;
  }
  const place = w => {
    if (o.maxW && cur.x + w > cur.left + o.maxW + 0.5 && cur.x > cur.left) { cur.line++; cur.x = cur.left; }
    const p = { x: cur.x, line: cur.line, y: y0 + cur.line * lineH };
    cur.x += w + gap;
    return p;
  };
  const make = (it, p, w, hidden) => {
    const tok = libToken(S, { text: it.t, x: p.x, y: p.y, anchor: 'start', size, h, w, padX, minW, weight, mono: o.mono,
      state: it.state || o.state, id: it.id ?? (o.ids ? true : undefined), idSize }, tokG);
    tok.line = p.line; tok.raw = it.t;
    if (hidden) T.hide(tok);
    return tok;
  };
  root.tokens = items.map((it, i) => { const w = it.w || chipW(it.t); const tk = make(it, place(w), w, o.hidden); tk.i = i; return tk; });
  // empty slots after the tokens
  root.slots = [];
  {
    const save = { ...cur };
    for (let k = 0; k < (o.slots || 0); k++) {
      const p = place(slotW);
      const sl = libToken(S, { text: '', x: p.x, y: p.y, anchor: 'start', size, h, w: slotW, state: 'slot' }, tokG);
      sl.line = p.line;
      root.slots.push(sl);
    }
    Object.assign(cur, save);
  }
  const relayIdx = () => root.tokens.forEach((t, i) => { t.i = i; });

  // ---- joined sentence bar (one line): chips start as plain words in a bar, .cut() parts them
  if (o.joined && root.tokens.length) {
    const sp = S.measure(' ', { size, weight, family: fam });
    const tws = root.tokens.map(t => S.measure(t.text, { size, weight, family: fam }));
    const lead = root.tokens.map((t, i) => (i > 0 && /^\s/.test(t.raw) ? sp : 0));
    const total = tws.reduce((a, b) => a + b, 0) + lead.reduce((a, b) => a + b, 0);
    const first = root.tokens[0], last = root.tokens[root.tokens.length - 1];
    const mid = (first.l + last.r) / 2;
    let jx = mid - total / 2;
    root.__cutMarks = [];
    root.tokens.forEach((t, i) => {
      jx += lead[i];
      const jcx = jx + tws[i] / 2;
      t.__dx = jcx - t.cx;
      gsap.set(t, { x: t.__dx });
      t.skin.style.opacity = 0;
      if (i > 0) {
        const mx = jx - lead[i] / 2;
        const m = S.line({ x1: mx, y1: y0 - h * 0.34, x2: mx, y2: y0 + h * 0.34, stroke: '#ffffff', sw: 2.5, strokeOpacity: 0.85 }, decoG);
        m.setAttribute('data-audit', 'ignore');
        m.style.opacity = 0;
        root.__cutMarks.push(m);
      }
      jx += tws[i];
    });
    const bw = total + 2 * padX;
    root.bar = T.skin(S, { x: mid - bw / 2, y: y0 - h / 2, w: bw, h, r: first.rad }, T.state('token'), barG);
  }

  const L = root.tokens.length ? Math.min(...root.tokens.map(t => t.l)) : x0;
  const R = root.tokens.length ? Math.max(...root.tokens.map(t => t.r)) : x0;
  Object.assign(root, { content, lineH, h, size, gap, l: L, r: R, t: y0 - h / 2, b: y0 + h / 2 + cur.line * lineH, w: R - L });

  // ---- geometry
  root.span = (a, b) => {
    const ts = T.idx([a, b ?? a], root.tokens.length).map(i => root.tokens[i]);
    const x1 = Math.min(...ts.map(t => t.l + t.__dx)), x2 = Math.max(...ts.map(t => t.r + t.__dx));
    const t = Math.min(...ts.map(t => t.t + t.__dy)), bb = Math.max(...ts.map(t => t.b + t.__dy));
    return { x1, x2, cx: (x1 + x2) / 2, t, b: bb, y: (t + bb) / 2 };
  };
  root.next = () => {
    const w = slotW;
    let x = cur.x, line = cur.line;
    if (o.maxW && x + w > cur.left + o.maxW + 0.5 && x > cur.left) { line++; x = cur.left; }
    return { x: x + w / 2, y: y0 + line * lineH };
  };
  root.bracket = (a, b, bo = {}) => {
    const sp = root.span(a, b);
    const idsB = anyIds ? idSize + 14 : 0;
    return S.bracket({ x1: sp.x1 + 4, x2: sp.x2 - 4, y: bo.up ? sp.t - 12 : sp.b + 12 + idsB, label: bo.label, up: bo.up, tone: bo.tone, size: bo.size }, decoG);
  };

  // ---- build-time append (returns the entrance)
  root.append = (t, ao = {}) => {
    const it = norm(t);
    const w = it.w || chipW(it.t);
    const tl = gsap.timeline();
    // consume the first remaining slot: it fades as the token lands; later slots move up behind it
    const slot = root.slots.shift();
    const p = place(w);
    const tok = make({ ...it, state: it.state || ao.state }, p, w, false);
    tok.i = root.tokens.length;
    root.tokens.push(tok);
    if (slot) {
      tl.fromTo(slot, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25, immediateRender: false }, 0);
      const delta = w - slotW;
      root.slots.forEach(s => {
        const from = s.__dx; s.__dx += delta;
        if (delta) tl.fromTo(s, { x: from }, { x: s.__dx, duration: 0.45, ease: 'power3.inOut', immediateRender: false }, 0.05);
      });
    }
    tl.add(ao.from ? tok.flyIn(ao.from, { d: ao.d ?? 0.8 }) : tok.pop({ d: ao.d ?? 0.5 }), 0);
    tl.token = tok;
    return tl;
  };
  root.stream = (list, so = {}) => {
    const tl = gsap.timeline(), every = so.every ?? 0.25;
    list.forEach((t, k) => tl.add(root.append(t, so), k * every));
    return tl;
  };
  root.reveal = (range, ro = {}) => {
    const ts = T.idx(range, root.tokens.length).map(i => root.tokens[i]);
    return gsap.fromTo(ts, { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: ro.d ?? 0.5, ease: 'back.out(2.2)', stagger: ro.every ?? 0.08, transformOrigin: '50% 50%' });
  };
  root.setState = (range, state, so = {}) => {
    const tl = gsap.timeline();
    T.idx(range, root.tokens.length).forEach((i, k) => tl.add(root.tokens[i].setState(state, so), k * (so.stagger || 0)));
    return tl;
  };
  root.pulse = (range, po = {}) => {
    const tl = gsap.timeline();
    T.idx(range, root.tokens.length).forEach((i, k) => tl.add(root.tokens[i].pulse(po), k * (po.stagger ?? 0.12)));
    return tl;
  };
  root.glow = (range, go = {}) => {
    const tl = gsap.timeline();
    T.idx(range, root.tokens.length).forEach((i, k) => tl.add(root.tokens[i].glow(go), k * (go.stagger || 0)));
    return tl;
  };
  root.showIds = (so = {}) => {
    const els = root.tokens.map(t => t.idEl).filter(Boolean);
    return gsap.fromTo(els, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: so.d ?? 0.45, ease: 'power2.out', stagger: so.stagger ?? 0.05 });
  };
  root.shift = (n, so = {}) => {
    const t = root.tokens[T.idx(n, root.tokens.length)[0]];
    return S.fx.xform(content, { x: -(t.l - L) }, { d: so.d ?? 0.6, ease: so.ease || 'power2.inOut' });
  };
  root.drop = (range, dop = {}) => {
    const tl = gsap.timeline(), dy = dop.dy ?? 70, d = dop.d ?? 0.6;
    T.idx(range, root.tokens.length).forEach((i, k) => {
      const t = root.tokens[i], from = t.__dy;
      t.__dy += dy;
      tl.fromTo(t, { y: from }, { y: t.__dy, duration: d, ease: 'power2.inOut', immediateRender: false }, k * (dop.stagger || 0));
      tl.add(t.setState(dop.state || 'dim', { d }), k * (dop.stagger || 0));
    });
    return tl;
  };

  // ---- prefix highlight: one band per line, swept left to right; chain calls to grow or shrink it
  const hiRects = [];
  let hiN = 0;
  root.highlight = (n, ho = {}) => {
    const tone = ho.tone || 'helps', pad = ho.pad ?? 8, d = ho.d ?? 0.8;
    n = Math.max(0, Math.min(n, root.tokens.length));
    const lines = {};
    root.tokens.slice(0, n).forEach(t => {
      const L0 = lines[t.line] || (lines[t.line] = { x1: Infinity, x2: -Infinity, y: t.cy + t.__dy });
      L0.x1 = Math.min(L0.x1, t.l + t.__dx); L0.x2 = Math.max(L0.x2, t.r + t.__dx);
    });
    const nl = Math.max(cur.line, ...root.tokens.map(t => t.line)) + 1;
    while (hiRects.length < nl) {
      const ln = hiRects.length;
      const rct = S.rect({ x: L - pad, y: y0 + ln * lineH - h / 2 - pad, w: 0, h: h + 2 * pad, r: Math.min((h + 2 * pad) / 2, root.tokens[0] ? root.tokens[0].rad + pad : 16),
        fill: tone, fillOpacity: 0.16, stroke: tone, strokeOpacity: 0.85, sw: 2.5 }, hiG);
      rct.__w = 0; rct.__x = L - pad;
      hiRects.push(rct);
    }
    const tl = gsap.timeline();
    const grow = n >= hiN;
    const order = grow ? hiRects.map((r, i) => i) : hiRects.map((r, i) => hiRects.length - 1 - i);
    let at = 0;
    const per = d / Math.max(1, Object.keys(lines).length || 1);
    for (const ln of order) {
      const rct = hiRects[ln], seg = lines[ln];
      const tx = seg ? seg.x1 - pad : rct.__x, tw = seg ? seg.x2 - seg.x1 + 2 * pad : 0;
      if (tw === rct.__w && tx === rct.__x) continue;
      tl.fromTo(rct, { attr: { x: rct.__x, width: rct.__w } }, { attr: { x: tx, width: tw }, duration: per, ease: 'power2.inOut', immediateRender: false }, at);
      at += per * 0.9;
      rct.__w = tw; rct.__x = tx;
    }
    hiN = n;
    if (ho.label && n > 0) {
      const sp = root.span(0, n - 1);
      const lab = S.text(ho.label, { x: Math.min(sp.cx, (lines[0] ? (lines[0].x1 + lines[0].x2) / 2 : sp.cx)), y: (lines[0] ? lines[0].y : sp.t) - h / 2 - pad - 26, size: ho.size || 28, weight: 600, anchor: 'middle', color: tone }, decoG);
      lab.style.opacity = 0;
      tl.fromTo(lab, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out', immediateRender: false }, Math.max(0, at - 0.1));
      tl.labelEl = lab;
    }
    if (!tl.getChildren().length) tl.set({}, {}, 0.01);
    return tl;
  };

  // ---- joined bar -> chips
  root.cut = (co = {}) => {
    const d = co.d ?? 0.9, tl = gsap.timeline();
    (root.__cutMarks || []).forEach((m, k) => {
      tl.fromTo(m, { autoAlpha: 1, drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 0.22, ease: 'power2.out', immediateRender: false }, k * 0.04);
      tl.to(m, { autoAlpha: 0, duration: 0.25 }, 0.3 + k * 0.04);
    });
    const t0 = 0.22;
    if (root.bar) tl.fromTo(root.bar, { opacity: 1 }, { opacity: 0, duration: d * 0.35, ease: 'power1.in', immediateRender: false }, t0 + d * 0.05);
    root.tokens.forEach((t, k) => {
      const from = t.__dx; t.__dx = 0;
      tl.fromTo(t, { x: from }, { x: 0, duration: d * 0.75, ease: 'power3.inOut', immediateRender: false }, t0 + k * 0.02);
      tl.fromTo(t.skin, { opacity: 0 }, { opacity: 1, duration: d * 0.35, ease: 'power1.out', immediateRender: false }, t0 + d * 0.42 + k * 0.02);
    });
    return tl;
  };

  // ---- split chip i into pieces, in place
  root.split = (i, pieces, so = {}) => {
    const d = so.d ?? 0.9, tl = gsap.timeline();
    i = T.idx(i, root.tokens.length)[0];
    const tok = root.tokens[i];
    const ws = pieces.map(p => chipW(p));
    const total = ws.reduce((a, b) => a + b, 0) + gap * (pieces.length - 1);
    const delta = total - tok.w;
    // where the original label's letters are now
    const fullW = S.measure(tok.text, { size, weight, family: fam });
    let jx = tok.cx + tok.__dx - fullW / 2;
    let px = tok.l + tok.__dx;
    const made = pieces.map((p, k) => {
      const pt = libToken(S, { text: p, x: px, y: tok.cy, anchor: 'start', size, h, w: ws[k], padX, minW, weight, mono: o.mono, state: so.state || tok.state }, tokG);
      pt.line = tok.line; pt.raw = (k === 0 && /^\s/.test(tok.raw) ? ' ' : '') + p;
      const pw = S.measure(p, { size, weight, family: fam });
      pt.__dx = jx + pw / 2 - pt.cx;
      pt.__dy = tok.__dy;
      gsap.set(pt, { x: pt.__dx, y: pt.__dy });
      T.hide(pt);
      pt.skin.style.opacity = 0;
      jx += pw; px += ws[k] + gap;
      return pt;
    });
    if (tok.label) tl.fromTo(tok.label, { opacity: 1 }, { opacity: 0, duration: 0.01, immediateRender: false }, 0);
    tl.fromTo(tok, { autoAlpha: 1 }, { autoAlpha: 0, duration: d * 0.4, ease: 'power1.in', immediateRender: false }, 0.12);
    made.forEach((pt, k) => {
      tl.fromTo(pt, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: false }, 0);
      const from = pt.__dx; pt.__dx = 0;
      tl.fromTo(pt, { x: from }, { x: 0, duration: d * 0.75, ease: 'power3.inOut', immediateRender: false }, 0.12 + k * 0.02);
      tl.fromTo(pt.skin, { opacity: 0 }, { opacity: 1, duration: d * 0.35, ease: 'power1.out', immediateRender: false }, 0.12 + d * 0.4);
    });
    // later chips on the same line, and the slots, make room
    const movers = root.tokens.slice(i + 1).filter(t => t.line === tok.line).concat(root.slots.filter(s => s.line === tok.line));
    movers.forEach(t => {
      const from = t.__dx; t.__dx += delta;
      tl.fromTo(t, { x: from }, { x: t.__dx, duration: d * 0.75, ease: 'power3.inOut', immediateRender: false }, 0.12);
    });
    if (tok.line === cur.line) cur.x += delta;
    root.tokens.splice(i, 1, ...made);
    relayIdx();
    tl.pieces = made;
    return tl;
  };
  return root;
}

/* ------------------------------------------------------------------ libChatWindow */
/**
 * libChatWindow — a clean chat-app panel: title bar, the user's message in a bubble (top right, with an
 * avatar), and the assistant's answer (sparkle icon, wrapped text) that streams in token by token. Each
 * token lands as a faint blue pill and relaxes into plain text; a steady caret (no blinking unless asked)
 * sits after the newest token. Long answers scroll up inside the answer area, fading at its top edge.
 * o: x, y, w 1320, h 620 (frame, top-left), title 'Assistant' ('' = none), titleBar true, question '',
 *    answer (string, tokenized with libTokenize + o.splits; or an array of token strings), size 32
 *    (answer px), qSize size+2, lineH round(size*1.45) (px), weight 450, relax 0.3 (s a landed pill takes
 *    to settle), caret true, composer false (input field + send button at the bottom), placeholder
 *    'Message', avatar true, tone 'struct' (frame outline). Layout overrides (absolute px): qy (bubble
 *    centre y), qRight (bubble right edge), ax (answer left), ay (first line centre), aw (wrap width),
 *    iconX (sparkle centre x), maxLines (visible answer lines; default fills the frame).
 * Returns <g> with .frame .titleBar .titleEl .bubble .questionEl .avatar .sparkle .answerG .caret
 *    .composer .sendBtn, .tokens[] (each {g, text, flash, stand, i, line, x, w, y, word}), .lines,
 *    .ax .ay .aw .lineH, and frame geometry .x .y .w .h .l .r .t .b .cx .cy.
 * Helpers (return tweens/timelines; call in time order):
 *    .drawOn({d: 0.8})                   the window and its chrome appear (hidden until then)
 *    .typeQuestion({d})                  the question types into the bubble as it grows (empty until then)
 *    .send({d: 0.5})                     the send button pulses (and the composer text clears, if any)
 *    .stream({from, to | count, every: 0.1, times, relax})   tokens land one by one (from defaults to the
 *        next unstreamed token; to is exclusive). The tween carries .times[] (relative landing times).
 *    .pillify(a, b, {spread: 20, d: 0.4}) tokens a..b stand apart as blue pills (pause the stream first)
 *    .unpillify(a, b, {d})               relax them back into text
 *    .glow(a, b, {hold: 0.8})            white ring round tokens a..b, on and off
 *    .dimTokens(a, b, {to: 0.5}) / .undimTokens(a, b)
 *    .blink({n: 3, period: 0.9})         the caret blinks n times (deterministic), e.g. while waiting
 *    .showCaret() / .hideCaret()         the caret fades in / out
 *    .span(a, b) -> {x1, x2, cx, y, t, b} on-screen box of tokens a..b (ignores scrolling)
 *   const chat = libChatWindow(S, { x: 300, y: 130, w: 1320, h: 630, question: 'Why is the sky blue?', answer: ANSWER });
 *   S.add(chat.drawOn(), 'b1');
 *   S.add(chat.typeQuestion(), 'b1+0.4');
 *   S.add(chat.stream({ count: 74, every: 0.03 }), 'b2-2.22');
 *   S.add(chat.pillify(68, 73), 'b2');
 */
function libChatWindow(S, o = {}, parent) {
  const T = __TOK;
  const X = o.x ?? 300, Y = o.y ?? 130, W = o.w ?? 1320, H = o.h ?? 620;
  const size = o.size || 32, qSize = o.qSize || size + 2, weight = o.weight || 450;
  const lineH = o.lineH || Math.round(size * 1.45), tone = o.tone || 'struct';
  const pad = Math.round(Math.max(28, size * 1.1));
  const tbH = o.titleBar === false ? 0 : Math.max(52, Math.round(size * 1.6));
  const root = S.g(null, parent);
  const chrome = S.g(null, root);
  // ---- frame
  root.frame = S.g(null, chrome);
  S.rect({ x: X, y: Y, w: W, h: H, r: 26, fill: '#0b1224', filter: 'url(#shadow)' }, root.frame);
  S.rect({ x: X, y: Y, w: W, h: H, r: 26, fill: 'url(#card-neutral)', stroke: tone, strokeOpacity: 0.55, sw: 2 }, root.frame);
  if (tbH) {
    root.titleBar = S.g(null, chrome);
    S.path({ d: T.rrPath(X + 1, Y + 1, W - 2, tbH - 1, 25, 25, true, false), fill: '#ffffff', fillOpacity: 0.035 }, root.titleBar);
    S.line({ x1: X + 1, y1: Y + tbH, x2: X + W - 1, y2: Y + tbH, stroke: '#ffffff', strokeOpacity: 0.08, sw: 1.5 }, root.titleBar);
    for (let k = 0; k < 3; k++) S.circle({ x: X + 30 + k * 22, y: Y + tbH / 2, r: 6.5, fill: '#ffffff', fillOpacity: 0.16 }, root.titleBar);
    const title = o.title ?? 'Assistant';
    if (title) root.titleEl = S.text(title, { x: X + W / 2, y: Y + tbH / 2 + 1, size: 24, weight: 600, anchor: 'middle', color: 'muted' }, root.titleBar);
  }
  // ---- composer (optional)
  const compH = o.composer ? Math.max(56, Math.round(size * 1.75)) : 0;
  const compY = Y + H - pad * 0.7 - compH;
  if (o.composer) {
    root.composer = S.g(null, chrome);
    S.rect({ x: X + pad, y: compY, w: W - 2 * pad, h: compH, r: compH / 2, fill: '#ffffff', fillOpacity: 0.045, stroke: '#ffffff', strokeOpacity: 0.12, sw: 1.5 }, root.composer);
    root.placeholder = S.text(o.placeholder ?? 'Message', { x: X + pad + 28, y: compY + compH / 2 + 1, size: 24, weight: 450, color: 'faint' }, root.composer);
    root.sendBtn = S.g(null, root.composer);
    const br = compH / 2 - 8, bx = X + W - pad - 8 - br, by = compY + compH / 2;
    S.circle({ x: bx, y: by, r: br, fill: tone }, root.sendBtn);
    S.path({ d: `M${bx},${by + br * 0.48} V${by - br * 0.46} M${bx - br * 0.4},${by - br * 0.06} L${bx},${by - br * 0.48} L${bx + br * 0.4},${by - br * 0.06}`, stroke: '#0a0f1e', sw: 3.2 }, root.sendBtn);
    Object.assign(root.sendBtn, { cx: bx, cy: by });
  }
  // ---- question bubble (right aligned) and avatar
  const avSize = Math.round(qSize * 1.3);
  const qRight = o.qRight ?? (X + W - pad - (o.avatar === false ? 0 : avSize + 16));
  const qPadX = Math.round(qSize * 0.72), bubH = Math.round(qSize * 1.8);
  const qy = o.qy ?? (Y + tbH + pad * 0.75 + bubH / 2);
  const q = String(o.question ?? '');
  const qW = q ? S.measure(q, { size: qSize, weight: 500 }) : 0;
  root.bubbleG = S.g(null, root);
  root.bubble = S.rect({ x: qRight - qW - 2 * qPadX, y: qy - bubH / 2, w: qW + 2 * qPadX, h: bubH, r: Math.min(bubH / 2, 24), fill: '#ffffff', fillOpacity: 0.085, stroke: '#ffffff', strokeOpacity: 0.12, sw: 1.5 }, root.bubbleG);
  root.questionEl = S.text(q, { x: qRight - qPadX, y: qy + 1, size: qSize, weight: 500, anchor: 'end', color: 'ink' }, root.bubbleG);
  if (!q) root.bubbleG.style.opacity = 0;
  if (o.avatar !== false) root.avatar = S.icon('ph:user-circle-duotone', { x: qRight + 16 + avSize / 2, y: qy, size: avSize, color: 'muted' }, root.bubbleG);
  // ---- answer area
  const icon = Math.round(size * 1.1);
  const iconX = o.iconX ?? (X + pad + icon / 2);
  const ax = o.ax ?? (iconX + icon / 2 + Math.round(size * 0.55));
  const aw = o.aw ?? (X + W - pad - ax);
  const ay = o.ay ?? (q ? qy + bubH / 2 + pad * 0.9 + lineH / 2 : Y + tbH + pad + lineH / 2);
  const bottom = (o.composer ? compY - pad * 0.5 : Y + H - pad * 0.6);
  const maxLines = o.maxLines ?? Math.max(1, Math.floor((bottom - (ay - lineH / 2)) / lineH));
  const answerG = S.g(null, root);
  const scroller = S.g(null, answerG);
  root.sparkle = S.icon('ph:sparkle-fill', { x: iconX, y: ay, size: icon, color: tone }, scroller);
  // ---- tokens: lay out word by word (a word = a token with a leading space plus the pieces glued to it)
  const toks = Array.isArray(o.answer) ? o.answer.slice() : libTokenize(o.answer || '', { splits: o.splits });
  const spW = S.measure(' ', { size, weight });
  const words = [];
  toks.forEach((t, k) => {
    if (!words.length || /^\s/.test(t)) words.push([k]); else words[words.length - 1].push(k);
  });
  const tw = toks.map(t => S.measure(t.trim(), { size, weight }));
  const pos = [];
  let cx = 0, line = 0;
  words.forEach((wd, wi) => {
    const lead = /^\s/.test(toks[wd[0]]) && cx > 0 ? spW : 0;
    const wW = lead + wd.reduce((a, k) => a + tw[k], 0);
    let startLead = lead;
    if (cx > 0 && cx + wW > aw) { line++; cx = 0; startLead = 0; }
    wd.forEach((k, j) => {
      const l = j === 0 ? startLead : 0;
      pos[k] = { x: ax + cx + l, w: tw[k], line, word: wi };
      cx += l + tw[k];
    });
  });
  const pPad = Math.round(size * 0.2), pH = Math.round(size * 1.42);
  root.tokens = toks.map((t, k) => {
    const p = pos[k], ly = ay + p.line * lineH;
    const outer = S.g(null, scroller);            // dims (GSAP opacity)
    const mid = S.g(null, outer);                 // pillify spread (GSAP x)
    const inner = S.g(null, mid);                 // stream: landed / scrolled (attribute opacity, from the stream proxy)
    inner.setAttribute('opacity', 0);
    const flash = S.rect({ x: p.x - pPad, y: ly - pH / 2, w: p.w + 2 * pPad, h: pH, r: Math.min(12, pH / 2), fill: tone, fillOpacity: 0.22, stroke: tone, strokeOpacity: 0.7, sw: 1.5 }, inner);
    flash.setAttribute('opacity', 0);
    const stand = S.rect({ x: p.x - pPad, y: ly - pH / 2, w: p.w + 2 * pPad, h: pH, r: Math.min(12, pH / 2), fill: tone, fillOpacity: 0.2, stroke: tone, strokeOpacity: 0.85, sw: 2 }, inner);
    stand.style.opacity = 0;
    const text = S.text(t.trim() || ' ', { x: p.x, y: ly + 1, size, weight, color: 'ink' }, inner);
    return { g: outer, mid, inner, flash, stand, text, raw: t, i: k, line: p.line, word: p.word, x: p.x, w: p.w, y: ly, __sx: 0, __a: 0, __f: 0 };
  });
  root.lines = toks.length ? pos[toks.length - 1].line + 1 : 0;
  // ---- caret
  const caretH = Math.round(size * 1.12);
  if (o.caret !== false) {
    root.caret = S.rect({ x: ax, y: ay - caretH / 2, w: 3, h: caretH, r: 1.5, fill: tone }, answerG);
  }
  const caretAt = k => (k < 0 ? { x: ax, y: ay } : { x: root.tokens[k].x + root.tokens[k].w + 4, y: root.tokens[k].y });
  Object.assign(root, { x: X, y: Y, w: W, h: H, l: X, r: X + W, t: Y, b: Y + H, cx: X + W / 2, cy: Y + H / 2, ax, ay, aw, lineH, maxLines, answerG, size });
  if (root.lines > maxLines && !o.scroll === false) S.warn(`libChatWindow: answer has ${root.lines} lines, ${maxLines} visible; it will scroll`);

  // ---- streaming: one proxy per call, driving the landed state, pill flash, caret and scroll
  let nextK = 0;
  const target = ln => Math.max(0, ln - maxLines + 1);   // lines scrolled off when line ln is the newest
  let scrollBase = 0;                                   // scroll (in lines) when the next stream starts
  root.stream = (so = {}) => {
    const from = so.from ?? nextK;
    const to = Math.min(root.tokens.length, so.to ?? (so.count !== undefined ? from + so.count : root.tokens.length));
    const every = so.every ?? 0.1, relax = so.relax ?? o.relax ?? 0.3;
    const times = [];
    for (let k = from; k < to; k++) times.push(so.times ? so.times[k - from] : (k - from) * every);
    const s0 = scrollBase;
    // the scroll steps inside this range: [time, delta lines]
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
      scroller.setAttribute('transform', sc ? `translate(0,${(-sc * lineH).toFixed(2)})` : '');
      if (root.caret) root.caret.setAttribute('transform', sc ? `translate(0,${(-sc * lineH).toFixed(2)})` : '');
      // fade lines as they scroll above the top of the answer area
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
      // earlier tokens (landed before this stream) still fade as the text scrolls
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
    const d = to.d ?? Math.max(0.5, q.length * 0.045);
    const proxy = { n: 0 };
    const minW = bubH;
    const render = () => {
      const s = q.slice(0, Math.round(proxy.n));
      root.questionEl.textContent = s;
      const w = Math.max(minW, (s ? S.measure(s, { size: qSize, weight: 500 }) : 0) + 2 * qPadX);
      root.bubble.setAttribute('x', qRight - w); root.bubble.setAttribute('width', w);
    };
    const tl = gsap.timeline();
    tl.fromTo(root.bubbleG, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0);
    tl.fromTo(proxy, { n: 0 }, { n: q.length, duration: d, ease: 'none', onUpdate: render, immediateRender: true, onStart: render }, 0.15);
    render();
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

  // ---- pills that stand apart, glow, dim
  const rng = (a, b) => T.idx([a, b ?? a], root.tokens.length).map(i => root.tokens[i]);
  root.pillify = (a, b, po = {}) => {
    const spread = po.spread ?? Math.round(2 * pPad + 6), d = po.d ?? 0.4, tl = gsap.timeline();
    const ts = rng(a, b);
    const lastLine = ts[ts.length - 1].line, lastI = ts[ts.length - 1].i;
    ts.forEach((tk, k) => {
      const from = tk.__sx; tk.__sx = k * spread;
      tl.fromTo(tk.mid, { x: from }, { x: tk.__sx, duration: d, ease: 'power2.inOut', immediateRender: false }, 0);
      tl.fromTo(tk.stand, { opacity: 0 }, { opacity: 1, duration: d, ease: 'power1.out', immediateRender: false }, 0);
    });
    // later tokens on that line make room
    root.tokens.filter(t => t.i > lastI && t.line === lastLine).forEach(tk => {
      const from = tk.__sx; tk.__sx = (ts.length - 1) * spread;
      tl.fromTo(tk.mid, { x: from }, { x: tk.__sx, duration: d, ease: 'power2.inOut', immediateRender: false }, 0);
    });
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
    return tl;
  };
  root.span = (a, b) => {
    const ts = rng(a, b);
    const x1 = Math.min(...ts.map(t => t.x - pPad + t.__sx)), x2 = Math.max(...ts.map(t => t.x + t.w + pPad + t.__sx));
    const y = ts[0].y;
    return { x1, x2, cx: (x1 + x2) / 2, y, t: y - pH / 2, b: y + pH / 2 };
  };
  root.glow = (a, b, go = {}) => {
    const sp = root.span(a, b);
    const ring = S.rect({ x: sp.x1 - 6, y: sp.t - 6, w: sp.x2 - sp.x1 + 12, h: pH + 12, r: Math.min(16, (pH + 12) / 2), stroke: '#ffffff', sw: 2.5, filter: 'url(#glow-struct)' }, scroller);
    ring.setAttribute('data-audit', 'ignore');
    ring.style.opacity = 0;
    const d = go.d ?? 0.3, tl = gsap.timeline();
    tl.fromTo(ring, { opacity: 0 }, { opacity: 1, duration: d, ease: 'power2.out', immediateRender: false }, 0);
    if (go.hold !== Infinity) tl.to(ring, { opacity: 0, duration: d * 1.6, ease: 'power2.in' }, d + (go.hold ?? 0.8));
    tl.ring = ring;
    return tl;
  };
  root.dimTokens = (a, b, dop = {}) => gsap.fromTo(rng(a, b).map(t => t.g), { opacity: 1 }, { opacity: dop.to ?? 0.5, duration: dop.d ?? 0.5, ease: 'power2.out', immediateRender: false });
  root.undimTokens = (a, b, dop = {}) => gsap.fromTo(rng(a, b).map(t => t.g), { opacity: dop.from ?? 0.5 }, { opacity: 1, duration: dop.d ?? 0.5, ease: 'power2.out', immediateRender: false });
  return root;
}

/* ------------------------------------------------------------------ libPromptStack */
/**
 * libPromptStack — the assembled prompt drawn to a token scale: labelled segments (provider's system
 * prompt, tool definitions, custom instructions, a skill, the conversation, the new question) laid end
 * to end in one bar ('stack'), or as one bar per row on a common baseline ('rows') that .toStack() slides
 * together. Optional total counter and context-window outline at the same scale.
 * o: x, y (stack: left / top of the bar; rows: the bars' common baseline / top of the first row), h 56,
 *    scale (px per token) or w (px for the whole prompt), segments [{label, tokens, tone 'struct', state
 *    (a token state, overrides tone), icon (badge id), value (text; default the token count), w (schematic
 *    width override)}], layout 'stack' | 'rows', gap 3 (px carved between stacked segments), r 10,
 *    size 26 (labels), labels 'auto' (inside if it fits, else above with a tick) | 'inside' | 'outside' | 'none',
 *    values true (token counts: below the bar in stack, right of the bar in rows), rowGap 24,
 *    stackAt {x, y} (rows layout: where .toStack() lands; default x, below the last row),
 *    total false (true: 'total N tokens' counter at the bar's right end; totalPrefix, totalSuffix),
 *    capacity (tokens: a dashed context-window outline at the same scale), capacityLabel.
 * Returns <g> with .segs[] (each {g, body, barG, skin, label, value, badge, rowLabel, rowValue, tokens, x, w, i}),
 *    .X(tokens) (stack x of a token offset), .scale, .total (tokens), .totalEl, .frame, .frameLabel,
 *    .w (stack width) and .l .r .t .b of the stacked bar.
 * Helpers (return tweens/timelines):
 *    .grow(range, {d: 0.8, stagger: 0.25})   segments grow from their left ends, then labels fade in
 *    .land(i, [x, y], {d: 0.8})              a segment flies in from a point and lands in place
 *    .toStack({d: 1.1, stagger: 0.08})       rows slide end to end into the stacked bar (row labels fade)
 *    .count({d: 1.2})                        the total counter runs up to the sum
 *    .paint(range, state, {d: 0.4})          recolour segments (e.g. 'cached' teal for a hit)
 *    .highlight(tokens, {tone: 'helps', label, d: 0.9})   a band sweeps over the first `tokens` tokens
 *    .append(seg, {d: 0.7})                  add a segment at the end (it grows in)
 *    .showFrame({d: 0.8})                    the context-window outline draws on
 *   const ps = libPromptStack(S, { x: 420, y: 280, scale: 0.25, layout: 'rows', total: true, stackAt: { x: 140, y: 680 },
 *     segments: [{ label: "provider's system prompt", tokens: 2000, icon: 'ph:globe-duotone' }, { label: 'tool definitions', tokens: 450 }] });
 *   ps.segs.forEach((sg, i) => S.add(ps.grow(i), `b1+${i}`));
 *   S.add(ps.toStack(), 'b2');
 *   S.add(ps.count(), 'b2+0.6');
 */
function libPromptStack(S, o = {}, parent) {
  const T = __TOK;
  const segsIn = (o.segments || []).map(s => ({ tone: 'struct', ...s }));
  const totalTok = segsIn.reduce((a, s) => a + (s.tokens || 0), 0);
  const scale = o.scale ?? (o.w ? o.w / Math.max(1, totalTok) : 0.25);
  const h = o.h || 56, gap = o.gap ?? 3, r = o.r ?? 10, size = o.size || 26;
  const vSize = Math.max(24, size - 2);
  const rows = o.layout === 'rows';
  const rowGap = o.rowGap ?? 24;
  const sx = rows ? (o.stackAt ? o.stackAt.x : o.x) : o.x;
  const sy = rows ? (o.stackAt ? o.stackAt.y : o.y + segsIn.length * (h + rowGap) + 80) : o.y;
  const root = S.g(null, parent);
  const backG = S.g(null, root), rowG = S.g(null, root), segG = S.g(null, root), labG = S.g(null, root), topG = S.g(null, root);
  const X = t => sx + t * scale;
  root.X = X; root.scale = scale; root.total = totalTok;
  const labelMode = o.labels || 'auto';
  // ---- context-window outline
  if (o.capacity) {
    const cw = o.capacity * scale;
    root.frame = S.rect({ x: sx - 6, y: sy - 8, w: cw + 12, h: h + 16, r: r + 6, stroke: 'struct', strokeOpacity: 0.55, sw: 2, dash: '10 8' }, backG);
    root.frameLabel = S.text(o.capacityLabel ?? `context window: ${S.fmt.int(o.capacity)} tokens`, { x: sx + cw, y: sy - 34, size, weight: 550, anchor: 'end', color: 'muted' }, backG);
  }
  // ---- segments at their stack geometry
  let cum = 0;
  const placedAbove = [], placedBelow = [];   // boxes of outside labels / values, by tier
  root.segs = segsIn.map((s, i) => {
    const x = s.x0 !== undefined ? s.x0 : (s.w !== undefined ? sx + cum : X(cum));
    const w = s.w ?? (s.tokens || 0) * scale;
    cum += s.w !== undefined ? s.w / scale : (s.tokens || 0);
    const g = S.g(null, segG), body = S.g(null, g), barG = S.g(null, body), lab = S.g(null, body);
    const carve = i < segsIn.length - 1 ? Math.min(gap, w * 0.2) : 0;
    const bw = Math.max(1.5, w - carve);
    const st = T.state(s.state || (s.style === 'solid' ? { tone: s.tone, style: 'solid' } : s.style === 'ghost' ? { tone: s.tone, style: 'ghost' } : s.tone));
    const geom = { x, y: sy, w: bw, h, r: Math.min(r, bw / 2) };
    const sk = T.skin(S, geom, st, barG);
    const seg = { g, body, barG, lab, skin: sk, skins: [sk], st, tokens: s.tokens || 0, x, w, bw, i, geom, spec: s };
    // inside label / badge / outside label, decided by room
    const iconSize = Math.round(h * 0.55);
    const lw = s.label ? S.measure(s.label, { size, weight: 600 }) : 0;
    const iconIn = s.icon && bw >= iconSize + 24;
    const room = bw - 28 - (iconIn ? iconSize + 10 : 0);
    const inside = s.label && labelMode !== 'none' && labelMode !== 'outside' && (labelMode === 'inside' || (lw <= room && h >= size * 1.3));
    if (iconIn) seg.badge = S.icon(s.icon, { x: x + 14 + iconSize / 2, y: sy + h / 2, size: iconSize, color: st.text === 'ink' ? (typeof s.tone === 'string' ? s.tone : 'struct') : st.text }, lab);
    if (inside) {
      const lx = iconIn ? x + 14 + iconSize + 10 + room / 2 + 7 : x + bw / 2;
      seg.label = S.text(s.label, { x: lx, y: sy + h / 2 + 1, size, weight: 600, anchor: 'middle', color: st.text, maxW: Math.max(20, room) }, lab);
    } else if (s.label && labelMode !== 'none') {
      // outside, above, in the lowest tier where it neither collides nor sits on another tier's tick
      const cx = x + bw / 2;
      const lx1 = Math.max(cx - lw / 2, sx - 4), box0 = [lx1, lx1 + lw];
      let tier = 0;
      for (; tier < 4; tier++) {
        const clash = (placedAbove[tier] || []).some(b => !(box0[1] + 16 < b[0] || box0[0] - 16 > b[1]));
        const onTick = placedAbove.slice(0, tier).some(list => (list || []).some(b => cx > b[0] - 10 && cx < b[1] + 10));
        if (!clash && !onTick) break;
      }
      (placedAbove[tier] = placedAbove[tier] || []).push(box0);
      const ly = sy - 30 - tier * Math.round(size * 1.35);
      seg.label = S.text(s.label, { x: box0[0], y: ly, size, weight: 600, color: st.text === 'ink' ? 'ink' : st.text }, lab);
      seg.tick = S.line({ x1: cx, y1: sy - 4, x2: cx, y2: ly + size * 0.55, stroke: '#ffffff', strokeOpacity: 0.35, sw: 1.5 }, lab);
      seg.outside = true;
    }
    if (o.values !== false && s.tokens !== undefined && !rows) {
      const vt = s.value ?? S.fmt.int(s.tokens);
      const vw = S.measure(vt, { size: vSize, weight: 500, family: 'mono' });
      const cx = x + bw / 2;
      const box0 = [Math.max(sx, cx - vw / 2), Math.max(sx, cx - vw / 2) + vw];
      let tier = 0;
      for (; tier < 4; tier++) if (!(placedBelow[tier] || []).some(b => !(box0[1] + 14 < b[0] || box0[0] - 14 > b[1]))) break;
      (placedBelow[tier] = placedBelow[tier] || []).push(box0);
      seg.value = S.text(vt, { x: box0[0], y: sy + h + 26 + tier * Math.round(vSize * 1.3), size: vSize, weight: 500, family: 'mono', color: 'muted' }, lab);
    }
    return seg;
  });
  // ---- rows layout: each segment shown as its own bar on a common baseline, with label and value
  if (rows) {
    root.segs.forEach((seg, i) => {
      const ry = o.y + i * (h + rowGap);
      S.xset(seg.g, { x: o.x - seg.x, y: ry - sy });
      seg.lab.style.opacity = 0;               // stack labels appear after .toStack()
      const rg = S.g(null, rowG);
      const s = seg.spec;
      const iconSize = Math.round(h * 0.6);
      if (s.label) {
        seg.rowLabel = S.text(s.label, { x: o.x - 24, y: ry + h / 2 + 1, size, weight: 550, anchor: 'end', color: 'ink' }, rg);
        if (s.icon) {
          const lw = S.measure(s.label, { size, weight: 550 });
          seg.rowBadge = S.icon(s.icon, { x: o.x - 24 - lw - 14 - iconSize / 2, y: ry + h / 2, size: iconSize, color: typeof s.tone === 'string' ? s.tone : 'struct' }, rg);
        }
      }
      if (o.values !== false) {
        const vt = s.value ?? S.fmt.int(s.tokens || 0);
        seg.rowValue = S.text(vt, { x: o.x + seg.w + 20, y: ry + h / 2 + 1, size, weight: 500, family: 'mono', color: 'ink' }, seg.body);
      }
      seg.row = rg; seg.ry = ry;
    });
  }
  const stackW = root.segs.length ? root.segs[root.segs.length - 1].x + root.segs[root.segs.length - 1].w - sx : 0;
  Object.assign(root, { w: stackW, l: sx, r: sx + stackW, t: sy, b: sy + h, h, x: sx, y: sy });
  // ---- total counter
  if (o.total) {
    root.totalEl = S.counter({ x: sx + stackW + 26, y: sy + h / 2 + 1, size: o.totalSize || 34, value: totalTok, fmt: S.fmt.int,
      prefix: o.totalPrefix ?? 'total ', suffix: o.totalSuffix ?? ' tokens', family: 'sans', weight: 650, color: 'ink' }, topG);
  }

  // ---- helpers
  const pick = range => T.idx(range, root.segs.length).map(i => root.segs[i]);
  root.grow = (range, go = {}) => {
    const d = go.d ?? 0.8, tl = gsap.timeline();
    pick(range).forEach((seg, k) => {
      const at = k * (go.stagger ?? 0.25);
      tl.fromTo(seg.barG, { scaleX: 0, autoAlpha: 1, transformOrigin: '0% 50%' }, { scaleX: 1, duration: d, ease: 'power3.out', transformOrigin: '0% 50%' }, at);
      const labs = rows ? [seg.row, seg.rowValue].filter(Boolean) : [seg.lab];
      tl.fromTo(labs, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power1.out' }, at + d * 0.55);
    });
    return tl;
  };
  root.land = (i, pt, lo = {}) => {
    const seg = pick(i)[0];
    const cx = seg.x + seg.w / 2, cy = sy + h / 2;
    return gsap.fromTo(seg.body, { autoAlpha: 0, x: pt[0] - cx, y: pt[1] - cy, scale: 0.92, transformOrigin: '50% 50%' },
      { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: lo.d ?? 0.8, ease: lo.ease || 'power3.inOut', transformOrigin: '50% 50%' });
  };
  root.toStack = (to = {}) => {
    const d = to.d ?? 1.1, tl = gsap.timeline();
    tl.add(S.fx.out(root.segs.map(s => s.row).filter(Boolean), { d: 0.35 }), 0);
    tl.add(S.fx.out(root.segs.map(s => s.rowValue).filter(Boolean), { d: 0.3 }), d * 0.55);
    root.segs.forEach((seg, k) => tl.add(S.fx.xform(seg.g, { x: 0, y: 0 }, { d, ease: 'power3.inOut' }), 0.15 + k * (to.stagger ?? 0.08)));
    tl.fromTo(root.segs.map(s => s.lab), { opacity: 0 }, { opacity: 1, duration: 0.45, immediateRender: false }, 0.15 + d);
    return tl;
  };
  root.count = (co = {}) => S.fx.count(root.totalEl, 0, totalTok, { d: co.d ?? 1.2, fmt: S.fmt.int });
  root.paint = (range, state, po = {}) => {
    const d = po.d ?? 0.4, tl = gsap.timeline();
    pick(range).forEach((seg, k) => {
      const nst = T.state(state), prev = seg.skin;
      const nk = T.skin(S, seg.geom, nst, seg.barG);
      nk.style.opacity = 0;
      seg.skins.push(nk); seg.skin = nk; seg.st = nst;
      tl.fromTo(nk, { opacity: 0 }, { opacity: 1, duration: d, ease: 'power1.inOut', immediateRender: false }, k * (po.stagger || 0));
      tl.fromTo(prev, { opacity: 1 }, { opacity: 0, duration: d, ease: 'power1.inOut', immediateRender: false }, k * (po.stagger || 0));
    });
    return tl;
  };
  const hi = { rect: null, w: 0 };
  root.highlight = (tokens, ho = {}) => {
    const tone = ho.tone || 'helps', d = ho.d ?? 0.9;
    if (!hi.rect) {
      hi.rect = S.rect({ x: sx - 5, y: sy - 6, w: 0, h: h + 12, r: r + 4, fill: tone, fillOpacity: 0.22, stroke: tone, strokeOpacity: 0.95, sw: 3 }, topG);
    }
    const tw = tokens > 0 ? X(Math.min(tokens, totalTok)) - sx + 10 : 0;
    const tl = gsap.timeline();
    tl.fromTo(hi.rect, { attr: { width: hi.w } }, { attr: { width: tw }, duration: d, ease: 'power2.inOut', immediateRender: false }, 0);
    hi.w = tw;
    if (ho.label && tokens > 0) {
      const lab = S.text(ho.label, { x: sx + tw / 2, y: sy - 34, size: ho.size || 28, weight: 600, anchor: 'middle', color: tone }, topG);
      lab.style.opacity = 0;
      tl.fromTo(lab, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, d * 0.8);
      tl.labelEl = lab;
    }
    return tl;
  };
  root.append = (s, ao = {}) => {
    s = { tone: 'struct', ...s };
    const last = root.segs[root.segs.length - 1];
    const x = last ? last.x + last.w : sx;
    // re-carve the previous last segment's right edge so the new one sits a gap away
    const w = s.w ?? (s.tokens || 0) * scale;
    const sub = libPromptStack(S, { ...o, x: x + (last ? gap : 0), y: sy, layout: 'stack', segments: [s], total: false, capacity: 0, scale }, segG);
    const seg = sub.segs[0];
    seg.i = root.segs.length;
    root.segs.push(seg);
    root.total += s.tokens || 0;
    return root.grow(seg.i, { d: ao.d ?? 0.7 });
  };
  root.showFrame = (fo = {}) => {
    const tl = gsap.timeline();
    if (!root.frame) return tl.set({}, {}, 0.01);
    tl.fromTo(root.frame, { drawSVG: '0%', autoAlpha: 1 }, { drawSVG: '100%', duration: fo.d ?? 0.8, ease: 'power2.inOut' }, 0);
    tl.fromTo(root.frameLabel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, (fo.d ?? 0.8) * 0.6);
    return tl;
  };
  return root;
}
