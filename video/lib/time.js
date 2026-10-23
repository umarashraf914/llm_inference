/* video/lib/time.js — shared film library: time.
 *
 *   libStopwatch   an analogue-plus-digital stopwatch: case, crown, 60 minute ticks, a sweeping hand,
 *                  an elapsed-time ring and a digital readout in ms (or s). Runs, laps, flickers, swaps
 *                  its readout for words ('?', 'tens of ms'), flashes, carries target marks, gets crossed out.
 *   libTimeAxis    a horizontal time ruler in ms or s (linear or log): ticks, labels, labelled spans that
 *                  grow along it (bars and to-scale slivers), markers, dimension brackets, chips streaming
 *                  onto it, and anything pinned to a time. It draws itself on and rescales smoothly,
 *                  carrying everything placed on it.
 *   libTimeline    lanes on one shared time axis, for 'made' vs 'seen', cold vs warm, TTFT and TPOT:
 *                  S.lanes draws the label column and tracks; the time axis underneath carries spans,
 *                  token chips, streams, arrows between lanes, brackets, markers and bands.
 *
 * Conventions (all three):
 * - Build with S primitives into `parent` (default S.main); everything is visible as built unless a
 *   helper that reveals it (grow, draw, play, cross…) is scheduled, which hides it until then.
 * - Helpers RETURN tweens or timelines; place them with S.add(tween, at). Nothing here touches S.tl,
 *   reads the clock or uses Math.random: every frame is the same however it is reached.
 * - Helpers keep a plan (like fx.xform): call an element's helpers in the order they play.
 * - The returned roots carry no transforms of their own, so fx.in / fx.out / fx.dim work on them. To
 *   move or scale a whole component, wrap it in a holder S.g() and S.xset / fx.xform the holder.
 * - Colour = meaning: amber compute (arithmetic time), coral bytes (time spent moving data),
 *   teal helps (time saved), blue struct (tokens, neutral spans), grey for "nothing happens".
 * - Times are numbers in the component's unit ('ms' by default, or 's'); the stopwatch is always in ms.
 */

/* ------------------------------------------------------------------ private helpers */
var _libTime = (function () {
  let uid = 0;
  const DARK = '#0a0f1e', BASE = '#0c1326';
  const GRAD = ['compute', 'bytes', 'helps', 'struct', 'violet', 'neutral'];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const f2 = v => (Math.round(v * 100) / 100).toString();

  /** '1,234.5', '−0.7' (typographic minus), fixed decimals */
  function num(v, dec = 0) {
    const r = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return (v < 0 && Number(r.replace(/,/g, '')) !== 0 ? '−' : '') + r;
  }
  /** decimals needed to write v exactly (at most `max`) */
  function decOf(v, max = 3) {
    for (let d = 0; d < max; d++) { const k = Math.pow(10, d); if (Math.abs(v * k - Math.round(v * k)) < 1e-6 * k) return d; }
    return max;
  }
  const trim = v => num(v, decOf(v));
  const unitSec = u => (u === 'ms' ? 0.001 : u === 's' ? 1 : u === 'min' ? 60 : u === 'h' ? 3600 : 1);
  /** a duration in the best unit: 0.1 ms, 41.8 ms, 20 s, 100 s, 15 min, 24 h (v is in `unit`) */
  function human(v, unit) {
    if (!['ms', 's', 'min', 'h'].includes(unit)) return trim(v) + (unit ? ' ' + unit : '');
    const s = v * unitSec(unit), a = Math.abs(s), whole = k => Math.abs(a / k - Math.round(a / k)) < 1e-9;
    const [f, u] = a === 0 ? [unitSec(unit), unit] : a >= 3600 && whole(3600) ? [3600, 'h'] : a >= 300 && whole(60) ? [60, 'min']
      : a >= 1 ? [1, 's'] : a >= 1e-5 ? [1e-3, 'ms'] : [1e-6, 'µs'];
    return trim(Math.round(s / f * 1000) / 1000) + ' ' + u;
  }
  /** rounded-rectangle path with per-corner radii [tl, tr, br, bl] */
  function rr(x, y, w, h, r) {
    if (!(w > 0.01) || !(h > 0.01)) return '';
    const [a, b, c, d] = r.map(v => Math.max(0, Math.min(v, w / 2, h / 2)));
    const X = x + w, Y = y + h;
    return `M${f2(x + a)},${f2(y)}H${f2(X - b)}` + (b ? `A${f2(b)},${f2(b)} 0 0 1 ${f2(X)},${f2(y + b)}` : '') +
      `V${f2(Y - c)}` + (c ? `A${f2(c)},${f2(c)} 0 0 1 ${f2(X - c)},${f2(Y)}` : '') +
      `H${f2(x + d)}` + (d ? `A${f2(d)},${f2(d)} 0 0 1 ${f2(x)},${f2(Y - d)}` : '') +
      `V${f2(y + a)}` + (a ? `A${f2(a)},${f2(a)} 0 0 1 ${f2(x + a)},${f2(y)}` : '') + 'Z';
  }
  /** fill for a bar of a tone: the engine's vertical gradient when it exists, else the flat colour */
  const solid = (S, tone) => (GRAD.includes(tone) ? `url(#solid-${tone})` : S.tone(tone));
  const tint = (S, tone) => (GRAD.includes(tone) ? `url(#card-${tone})` : S.hexA(tone, 0.16));
  /** outside-label colour for a tone (neutral greys read as muted text) */
  const ink = (S, tone) => (tone === 'neutral' || tone === 'faint' || tone === 'line' ? S.tone('muted') : S.tone(tone));

  /**
   * Planned state. obj.__live is what is drawn now; obj.__plan is the state after every helper called so
   * far. drive() returns a tween from the plan to `to`; the first time a key is driven, its build-time
   * value becomes the tween's start (so "grow" hides a span until it grows, like fx.xform's first state).
   */
  function plannable(obj, init, render) {
    obj.__live = { ...init }; obj.__plan = { ...init }; obj.__touched = {}; obj.__render = render;
    return obj;
  }
  const lerpState = (a, b, q) => {
    const r = {};
    for (const k in b) r[k] = typeof b[k] === 'number' && typeof a[k] === 'number' ? a[k] + (b[k] - a[k]) * q : (q > 0 ? b[k] : a[k]);
    return r;
  };
  /** o: {d, ease, from (override start values), interp(from, to, q) → live values} */
  function drive(obj, to, o = {}) {
    const from = {};
    for (const k in to) from[k] = o.from && k in o.from ? o.from[k] : obj.__plan[k];
    for (const k in to) {
      if (!obj.__touched[k]) { obj.__live[k] = from[k]; obj.__touched[k] = true; }
      obj.__plan[k] = to[k];
    }
    obj.__render();
    const interp = o.interp || lerpState;
    const p = { q: 0 };
    const set = q => { Object.assign(obj.__live, interp(from, to, q)); obj.__render(); };
    return gsap.fromTo(p, { q: 0 }, {
      q: 1, duration: Math.max(0.001, o.d ?? 0.8), ease: o.ease || 'power2.inOut', immediateRender: false,
      onStart: () => set(p.q), onUpdate: () => set(p.q), onReverseComplete: () => set(0),
    });
  }

  /** The time → x mapping shared by an axis and everything placed on it. */
  function makeScale(o) {
    const sc = { x: o.x, w: o.w, log: !!o.log, clip: o.clip !== false, items: [] };
    plannable(sc, { t0: o.t0, t1: o.t1, dl: 1 }, () => sc.items.forEach(it => it.__render()));
    sc.u = v => (sc.log ? Math.log10(Math.max(v, 1e-12)) : v);
    sc.X = t => { const L = sc.__live; const a = sc.u(L.t0), b = sc.u(L.t1); return sc.x + (sc.u(t) - a) / ((b - a) || 1) * sc.w; };
    sc.T = px => { const L = sc.__live; const a = sc.u(L.t0), b = sc.u(L.t1); const v = a + (px - sc.x) / sc.w * (b - a); return sc.log ? Math.pow(10, v) : v; };
    /** 1 inside the axis window, fading to 0 within 24 px outside it (when clipping) */
    sc.vis = x => (sc.clip ? clamp(1 - Math.max(sc.x - x, x - sc.x - sc.w, 0) / 24, 0, 1) : 1);
    sc.clampX = x => (sc.clip ? clamp(x, sc.x, sc.x + sc.w) : x);
    sc.add = it => { sc.items.push(it); it.__render(); return it; };
    return sc;
  }

  /** major/minor tick values for a domain. spec: step | [values] | false; minor: subdivisions | 0 */
  function ticks(t0, t1, log, spec, minor, pxW) {
    if (spec === false) return { major: [], minor: [] };
    if (Array.isArray(spec)) return { major: spec.slice(), minor: [] };
    const out = { major: [], minor: [] };
    if (log) {
      const a = Math.ceil(Math.log10(t0) - 1e-9), b = Math.floor(Math.log10(t1) + 1e-9);
      const every = typeof spec === 'number' ? Math.max(1, Math.round(spec)) : Math.max(1, Math.ceil((b - a + 1) / 9));
      for (let k = a; k <= b; k += every) out.major.push(Math.pow(10, k));
      if (minor !== 0 && every === 1) for (let k = a - 1; k <= b; k++) for (let m = 2; m <= 9; m++) { const v = m * Math.pow(10, k); if (v > t0 && v < t1) out.minor.push(v); }
      return out;
    }
    const span = t1 - t0;
    let step = typeof spec === 'number' ? spec : 0;
    if (!step) {
      const raw = span / 6, p = Math.pow(10, Math.floor(Math.log10(raw)));
      let best = null;
      for (const m of [1, 2, 2.5, 5, 10]) { const n = span / (m * p); const score = Math.abs(n - 6) + (n > 10 ? 99 : 0); if (!best || score < best[1]) best = [m * p, score]; }
      step = best[0];
    }
    const first = Math.ceil(t0 / step - 1e-9) * step;
    for (let v = first; v <= t1 + step * 1e-6; v += step) out.major.push(Math.round(v / step) * step === 0 ? 0 : +(Math.round(v / step) * step).toPrecision(12));
    let sub = minor;
    if (sub === undefined || sub === null || sub === true) {
      const m = +(step / Math.pow(10, Math.floor(Math.log10(step)))).toPrecision(3);
      sub = m === 2 ? 4 : m === 2.5 ? 5 : 5;
    }
    if (sub > 1 && pxW / (span / step) / sub >= 9) {
      const ms = step / sub;
      for (let v = Math.ceil(t0 / ms - 1e-9) * ms; v <= t1 + ms * 1e-6; v += ms) {
        const r = +(Math.round(v / ms) * ms).toPrecision(12);
        if (Math.abs(r / step - Math.round(r / step)) > 1e-6) out.minor.push(r);
      }
    }
    return out;
  }

  /** a chip that marks a token on a time axis (libToken when it is loaded) */
  function chip(S, o, parent) {
    if (typeof libToken === 'function') return libToken(S, { text: o.text || '', x: 0, y: 0, size: o.size, h: o.h, w: o.w, minW: o.minW, state: o.state || 'token' }, parent);
    const h = o.h || 44, w = o.w || h, g = S.g(null, parent);
    S.rect({ x: -w / 2, y: -h / 2, w, h, r: Math.min(12, h / 3), fill: BASE }, g);
    S.rect({ x: -w / 2, y: -h / 2, w, h, r: Math.min(12, h / 3), fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.75, sw: 2 }, g);
    if (o.text) g.label = S.text(o.text, { x: 0, y: 1, size: o.size || 24, anchor: 'middle', weight: 600 }, g);
    Object.assign(g, { w, h, cx: 0, cy: 0 });
    return g;
  }
  /** chip drop-in: falls a little and settles (hidden until then) */
  const drop = (c, o = {}) => gsap.fromTo(c, { autoAlpha: 0, y: -(o.dist ?? 22) }, { autoAlpha: 1, y: 0, duration: o.d ?? 0.32, ease: o.ease || 'power2.out' });

  return { DARK, BASE, GRAD, clamp, f2, num, decOf, trim, human, unitSec, rr, solid, tint, ink, plannable, drive, makeScale, ticks, chip, drop, uid: () => ++uid };
})();


/* ------------------------------------------------------------------ libStopwatch */
/**
 * libStopwatch — an analogue-plus-digital stopwatch: a dark case with crown and pusher, 60 minute ticks
 * (a longer one every 5), a hand that sweeps once per `span`, a thin elapsed ring that fills behind the
 * hand, and a digital readout in a plate. Reads from 120 to 400 px; at 48–100 px with readout 'none' it
 * works as an icon (e.g. crossed out: "no time in it").
 *
 * o: {x = 960, y = 480 (dial centre), size = 240 (dial diameter, px),
 *     tone = 'neutral'  colour of the hand and the elapsed ring: 'bytes' for time spent waiting on memory,
 *                       'compute' for arithmetic time, 'helps' for time saved; neutral = white,
 *     span = 60         ms per turn of the hand (60 ms: one tick per ms, 30 ms points straight down);
 *                       use 60000 (one turn a minute) for seconds-scale runs,
 *     value = 0         ms shown at build;  text = null  readout text at build instead (e.g. '?'),
 *     unit = 'ms'       readout unit: 'ms' | 's' | 'auto' (ms below 1 s, then s);  decimals = 0;
 *     approx = false    prefix '≈ ';  fmt  (ms => string) replaces unit/decimals/approx,
 *     readout = 'below' 'below' | 'right' | 'inside' (low on the face, no ring; the hand crosses it near
 *                       6 o'clock, so prefer it for runs that stay off the bottom of the dial) | 'none',
 *     readoutSize = max(26, size·0.15) (inside: max(24, size·0.12)), readoutW (fixed plate width; default: fits what it shows,
 *                       digits at the width of the largest value counted to, so it never jitters),
 *     texts = []        words the readout will show (only used for the widget's bounds),
 *     max = span        largest value the readout will count to (plate width; flicker range),
 *     label = ''        muted caption under the readout (e.g. 'slowed down'), labelSize = 26,
 *     marks = []        target marks on the bezel: [{ms, tone = 'helps'}],
 *     ring = true       the elapsed ring (off with readout 'inside');  buttons = true  crown and pusher}
 * Returns <g> with .body .face .hand .ring .readout (text) .plate .labelEl .crown .marks[] .crossEl and
 *   geometry .cx .cy .rad (dial radius) .l .r .t .b (whole widget, crown to label), .w .h.
 * Helpers (return tweens/timelines; call in time order):
 *   .run(fromMs, toMs, {d = 1.5, ease = 'none', press = true}) — hand sweeps and the readout counts;
 *        the crown clicks at start and stop. A run starts at fromMs even if the watch showed something else.
 *   .set(ms, {d = 0.4, ease})   glide to a value (d: 0.01 snaps);  .reset({d = 0.45}) back to 0
 *   .laps(n, lapMs, {every = 0.6}) — n runs 0 → lapMs, each `every` s, resetting at each (a steady beat)
 *   .flicker(d, {seed = 1, rate = 20}) — readout flickers through seeded random values up to `max`,
 *        the hand whirls; afterwards the watch shows what it showed before (follow with .set(0) to stop at 0)
 *   .show(text, {d = 0.4})      readout flips to words: '?', 'tens of ms', '≈ 20 s'; the plate resizes to fit.
 *        The next run / set flips back to digits (show(null) does it on its own)
 *   .flash({tone = 'bytes', d = 0.8}) the readout and rim glow once
 *   .cross({tone = 'muted', d = 0.45, dim = 0.5}) a stroke draws across the watch; the watch dims
 *   .mark(i, {tone = 'muted', d = 0.4}) recolour target mark i (e.g. grey once the hand has passed it)
 *   .press()  the crown clicks;  .in({d = 0.6}) scale-fade in about the dial centre (hidden until then)
 * Example:
 *   const sw = libStopwatch(S, { x: 1500, y: 300, size: 220, text: '?', label: 'slowed down' });
 *   S.add(sw.in(), 'b1');
 *   S.add(sw.run(0, 30, { d: 2 }), 'b1~One');            // '?' → 0 → '30 ms', hand to 6 o'clock
 *   S.add(sw.show('= 0.03 s'), 'b1~hundredths');
 *   S.add(sw.flash({ tone: 'bytes' }), 'b2~memory');
 */
function libStopwatch(S, o = {}, parent) {
  const T = _libTime;
  const cx = o.x ?? 960, cy = o.y ?? 480, size = o.size ?? 240, R = size / 2;
  const tone = o.tone || 'neutral';
  const unit = o.unit || 'ms';
  const span = o.span ?? (unit === 's' ? 60000 : 60);
  const dec = o.decimals ?? 0;
  const accent = tone === 'neutral' ? S.tone('ink') : S.tone(tone);
  const fmt = o.fmt || (ms => {
    const a = o.approx ? '≈ ' : '';
    if (unit === 's' || (unit === 'auto' && ms >= 1000)) return a + T.num(ms / 1000, unit === 'auto' ? (ms < 10000 ? 1 : 0) : dec) + ' s';
    return a + T.num(ms, dec) + ' ms';
  });
  const id = 'lsw' + T.uid();
  const g = S.g(null, parent);
  const sw = (k, min) => Math.max(min, R * k);

  // ---------------------------------------------------------------- materials
  const defs = S.el('defs', null, g);
  const cg = S.el('radialGradient', { id: id + 'c', cx: '34%', cy: '24%', r: '85%' }, defs);
  S.el('stop', { offset: 0, 'stop-color': '#2a3858' }, cg);
  S.el('stop', { offset: 0.5, 'stop-color': '#141e38' }, cg);
  S.el('stop', { offset: 1, 'stop-color': '#0a1022' }, cg);
  const fgd = S.el('radialGradient', { id: id + 'f', cx: '50%', cy: '42%', r: '62%' }, defs);
  S.el('stop', { offset: 0, 'stop-color': '#121b33' }, fgd);
  S.el('stop', { offset: 1, 'stop-color': '#070c19' }, fgd);

  // ---------------------------------------------------------------- body: buttons, case, face, ticks
  const body = S.g(null, g);
  g.body = body;
  if (o.buttons !== false) {
    g.pusher = S.g({ transform: `rotate(42 ${cx} ${cy})` }, body);
    S.rect({ x: cx - R * 0.065, y: cy - R * 1.10, w: R * 0.13, h: R * 0.16, r: R * 0.03, fill: '#1d2846', stroke: '#ffffff', strokeOpacity: 0.22, sw: sw(0.012, 1) }, g.pusher);
    g.crown = S.g(null, body);
    S.rect({ x: cx - R * 0.07, y: cy - R * 1.12, w: R * 0.14, h: R * 0.16, r: R * 0.02, fill: '#1a2440', stroke: '#ffffff', strokeOpacity: 0.2, sw: sw(0.012, 1) }, g.crown);
    S.rect({ x: cx - R * 0.17, y: cy - R * 1.23, w: R * 0.34, h: R * 0.12, r: R * 0.05, fill: '#2a3656', stroke: '#ffffff', strokeOpacity: 0.3, sw: sw(0.012, 1) }, g.crown);
  }
  g.caseEl = S.circle({ x: cx, y: cy, r: R, fill: `url(#${id}c)`, stroke: '#ffffff', strokeOpacity: 0.24, sw: sw(0.022, 1.5), filter: 'url(#shadow)' }, body);
  S.circle({ x: cx, y: cy, r: R * 0.955, stroke: '#ffffff', strokeOpacity: 0.07, sw: sw(0.012, 1) }, body);
  g.face = S.circle({ x: cx, y: cy, r: R * 0.9, fill: `url(#${id}f)`, stroke: '#000000', strokeOpacity: 0.35, sw: sw(0.02, 1.5) }, body);
  let dMin = '', dMaj = '';
  for (let i = 0; i < 60; i++) {
    const a = i * Math.PI / 30, s = Math.sin(a), c = -Math.cos(a), maj = i % 5 === 0;
    const r1 = R * (maj ? 0.725 : 0.79), r2 = R * 0.86;
    const seg = `M${T.f2(cx + s * r1)},${T.f2(cy + c * r1)}L${T.f2(cx + s * r2)},${T.f2(cy + c * r2)}`;
    if (maj) dMaj += seg; else dMin += seg;
  }
  S.path({ d: dMin, stroke: '#ffffff', strokeOpacity: 0.32, sw: sw(0.011, 1), cap: 'butt' }, body);
  S.path({ d: dMaj, stroke: '#ffffff', strokeOpacity: 0.85, sw: sw(0.026, 1.8), cap: 'butt' }, body);
  // the elapsed ring: a faint track and an arc in the hand's colour
  const RA = R * 0.6, WA = sw(0.075, 3);
  if (o.ring ?? (o.readout !== 'inside')) {
    S.circle({ x: cx, y: cy, r: RA, stroke: '#ffffff', strokeOpacity: 0.06, sw: WA }, body);
    g.ring = S.path({ d: '', stroke: accent, strokeOpacity: tone === 'neutral' ? 0.5 : 0.85, sw: WA, cap: 'butt' }, body);
  }
  // target marks on the bezel
  g.marks = (o.marks || []).map(m => {
    const a = (m.ms / span) * Math.PI * 2, s = Math.sin(a), c = -Math.cos(a), px = Math.cos(a), py = Math.sin(a);
    const tip = R * 0.79, base = R * 1.05, hw = Math.max(5, R * 0.075);
    const P = (r, k) => `${T.f2(cx + s * r + px * k)},${T.f2(cy + c * r + py * k)}`;
    const mk = S.path({ d: `M${P(tip, 0)}L${P(base, hw)}L${P(base, -hw)}Z`, fill: m.tone || 'helps', stroke: T.BASE, sw: 1.5 }, body);
    mk.__fill = S.tone(m.tone || 'helps');
    return mk;
  });
  // the hand: a tapered needle with a counterweight, rotated about the centre
  const handCol = accent;
  g.hand = S.g(null, body);
  const bw = sw(0.03, 1.6), tw = sw(0.009, 0.7), tip = R * 0.84, tail = R * 0.2;
  S.path({ d: `M${T.f2(cx - bw)},${cy}L${T.f2(cx - tw)},${T.f2(cy - tip)}L${T.f2(cx + tw)},${T.f2(cy - tip)}L${T.f2(cx + bw)},${cy}L${T.f2(cx + bw * 1.2)},${T.f2(cy + tail)}L${T.f2(cx - bw * 1.2)},${T.f2(cy + tail)}Z`, fill: handCol }, g.hand);
  S.circle({ x: cx, y: cy + tail, r: sw(0.05, 2.5), fill: handCol }, g.hand);
  S.circle({ x: cx, y: cy, r: sw(0.07, 3.5), fill: handCol }, g.hand);
  S.circle({ x: cx, y: cy, r: sw(0.03, 1.5), fill: T.DARK }, g.hand);

  // ---------------------------------------------------------------- readout
  const mode = o.readout || 'below';
  const rs = Math.round(o.readoutSize ?? Math.max(mode === 'inside' ? 24 : 26, size * (mode === 'inside' ? 0.12 : 0.15)));
  // The plate fits what it shows: digits get the width of the widest value the watch will count to
  // (so it never jitters while counting); words get their own width, and a swap glides between the two.
  const wOf = t => S.measure(t, { size: rs, weight: 600, family: 'mono' });
  const pad = rs * 1.1;
  let numW = Math.max(wOf(fmt(o.value ?? 0)), wOf(fmt(o.max ?? span))), maxW = numW;
  const regNum = str => { numW = Math.max(numW, wOf(str)); maxW = Math.max(maxW, numW); };
  const regTxt = str => { if (str != null) maxW = Math.max(maxW, wOf(str)); };
  [o.text, ...(o.texts || [])].forEach(regTxt);
  const W = t => (o.readoutW ? o.readoutW - pad : t == null ? numW : wOf(t)) + pad;
  const plateH = Math.round(rs * 1.62);
  const px0 = cx + R * 1.12 + 6, py = mode === 'right' ? cy - plateH / 2 : cy + R * 1.0 + Math.max(12, R * 0.12);
  const ro = S.g(null, g);
  if (mode === 'below' || mode === 'right') g.plate = S.rect({ x: 0, y: py, w: 10, h: plateH, r: Math.round(plateH * 0.3), fill: T.BASE, fillOpacity: 0.96, stroke: '#ffffff', strokeOpacity: 0.14, sw: 1.5 }, ro);
  const roT = S.g(null, ro);
  const ry = mode === 'inside' ? cy + R * 0.46 : py + plateH / 2 + 1;
  if (mode !== 'none') g.readout = S.text('', { x: cx, y: ry, size: rs, weight: 600, family: 'mono', anchor: 'middle', color: 'ink' }, roT);
  const placePlate = pw => {
    if (!g.plate) return;
    const x0 = mode === 'right' ? px0 : cx - pw / 2;
    g.plate.setAttribute('x', T.f2(x0)); g.plate.setAttribute('width', T.f2(pw));
    g.readout.setAttribute('x', T.f2(x0 + pw / 2));
  };
  // caption
  const ls = o.labelSize || 26;
  if (o.label) {
    const ly = mode === 'below' ? py + plateH + 14 + ls * 0.6 : mode === 'right' ? py + plateH + 12 + ls * 0.6 : cy + R + 16 + ls * 0.6;
    g.labelEl = S.text(o.label, { x: mode === 'right' ? px0 + 4 : cx, y: ly, size: ls, color: 'muted', weight: 500, anchor: mode === 'right' ? 'start' : 'middle' }, g);
  }
  // the cross ("no time in it"), hidden until .cross()
  g.crossEl = S.g(null, g);
  const k = R * 0.8;
  S.line({ x1: cx - k, y1: cy - k, x2: cx + k, y2: cy + k, stroke: T.BASE, sw: sw(0.13, 7) }, g.crossEl);
  g.crossLine = S.line({ x1: cx - k, y1: cy - k, x2: cx + k, y2: cy + k, stroke: 'muted', sw: sw(0.065, 3.5) }, g.crossEl);
  g.crossEl.style.opacity = 0;

  function bounds() {   // the widest the widget gets (plate at its widest)
    const top = cy - R * (o.buttons === false ? 1 : 1.23);
    let bot = cy + R, l = cx - R, r = cx + R;
    const pw = o.readoutW ?? maxW + pad;
    if (g.plate) { bot = Math.max(bot, py + plateH); l = Math.min(l, mode === 'right' ? px0 : cx - pw / 2); r = Math.max(r, mode === 'right' ? px0 + pw : cx + pw / 2); }
    if (g.labelEl) {
      const lw = S.measure(o.label, { size: ls, weight: 500 }), lx = +g.labelEl.getAttribute('x');
      bot = Math.max(bot, +g.labelEl.getAttribute('y') + ls * 0.6);
      l = Math.min(l, mode === 'right' ? lx : lx - lw / 2); r = Math.max(r, mode === 'right' ? lx + lw : lx + lw / 2);
    }
    Object.assign(g, { cx, cy, rad: R, t: top, b: bot, l, r, w: r - l, h: bot - top });
  }

  // ---------------------------------------------------------------- state and drawing
  const flickVal = (fp, k) => { const rnd = S.rand((fp.seed * 7919 + k * 104729) >>> 0); rnd(); return Math.floor(rnd() * (fp.max + 1)); };
  T.plannable(g, { ms: o.value ?? 0, txt: o.text ?? null, sw: 1, sa: null, sb: null, fq: 0, fp: null }, () => {
    const L = g.__live;
    const flick = L.fq > 0 && L.fq < 1 && L.fp;
    let ang = (L.ms / span) * 360;
    if (flick) ang += L.fq * L.fp.d * 1000;    // ≈ 2.8 turns a second: a blur, not a reading
    g.hand.setAttribute('transform', `rotate(${ang.toFixed(3)} ${cx} ${cy})`);
    if (g.ring) {
      const f = flick ? 0 : T.clamp(L.ms / span, 0, 1);
      let d = '';
      if (f > 0.9999) d = `M${cx},${T.f2(cy - RA)}A${RA},${RA} 0 1 1 ${cx},${T.f2(cy + RA)}A${RA},${RA} 0 1 1 ${cx},${T.f2(cy - RA)}`;
      else if (f > 0.0005) { const a = f * Math.PI * 2; d = `M${cx},${T.f2(cy - RA)}A${RA},${RA} 0 ${f > 0.5 ? 1 : 0} 1 ${T.f2(cx + RA * Math.sin(a))},${T.f2(cy - RA * Math.cos(a))}`; }
      g.ring.setAttribute('d', d);
    }
    if (g.readout) {
      const txt = flick ? fmt(flickVal(L.fp, Math.floor(L.fq * L.fp.d * L.fp.rate))) : (L.txt != null ? L.txt : fmt(L.ms));
      if (g.readout.textContent !== txt) g.readout.textContent = txt;
      const s = L.sw > 0 && L.sw < 1 ? L.sw : 1, fade = Math.abs(1 - 2 * s);
      roT.setAttribute('opacity', s < 1 ? fade.toFixed(3) : 1);
      roT.setAttribute('transform', s < 1 ? `translate(0 ${((s < 0.5 ? -1 : 1) * (1 - fade) * rs * 0.35).toFixed(2)})` : '');
      const e = s * s * (3 - 2 * s);
      placePlate(s < 1 ? W(L.sa) + (W(L.sb) - W(L.sa)) * e : W(flick ? null : L.txt));
    }
  });
  g.__render();
  bounds();

  // ---------------------------------------------------------------- helpers
  g.press = (po = {}) => {
    if (!g.crown) return gsap.timeline();
    return gsap.fromTo(g.crown, { y: 0 }, { y: R * 0.05, duration: po.d ?? 0.07, yoyo: true, repeat: 1, ease: 'power1.inOut', immediateRender: false });
  };
  const toDigits = tl => { if (g.__plan.txt != null) tl.add(g.show(null, { d: 0.3 }), 0); };
  g.run = (from, to, ro2 = {}) => {
    regNum(fmt(from)); regNum(fmt(to)); bounds();
    const d = ro2.d ?? 1.5;
    const tl = gsap.timeline();
    toDigits(tl);
    tl.add(T.drive(g, { ms: to }, { from: { ms: from }, d, ease: ro2.ease || 'none' }), 0);
    if (ro2.press !== false) { tl.add(g.press(), 0); tl.add(g.press(), d); }
    return tl;
  };
  g.set = (ms, so = {}) => {
    regNum(fmt(ms)); bounds();
    const tl = gsap.timeline();
    toDigits(tl);
    tl.add(T.drive(g, { ms }, { d: so.d ?? 0.4, ease: so.ease || 'power2.inOut' }), 0);
    return tl;
  };
  g.reset = (so = {}) => g.set(0, { d: so.d ?? 0.45, ease: so.ease || 'power3.inOut' });
  g.laps = (n, lapMs, lo = {}) => {
    const every = lo.every ?? 0.6, tl = gsap.timeline();
    for (let i = 0; i < n; i++) tl.add(g.run(lo.from ?? 0, lapMs, { d: every, press: false }), i * every);
    return tl;
  };
  g.flicker = (d = 1.5, fo = {}) => {
    const fp = { d, seed: fo.seed ?? 1, rate: fo.rate ?? 20, max: fo.max ?? o.max ?? span };
    regNum(fmt(fp.max)); bounds();
    return T.drive(g, { fq: 1, fp }, { from: { fq: 0 }, d, ease: 'none' });
  };
  g.show = (text, so = {}) => {
    regTxt(text); bounds();
    return T.drive(g, { txt: text, sw: 1 }, {
      from: { sw: 0 }, d: so.d ?? 0.4, ease: 'none',
      interp: (a, b, q) => ({ txt: q < 0.5 ? a.txt : b.txt, sw: q, sa: a.txt, sb: b.txt }),
    });
  };
  g.flash = (fo = {}) => {
    const c = S.tone(fo.tone || 'bytes'), d = fo.d ?? 0.8, tl = gsap.timeline();
    if (g.readout) tl.fromTo(g.readout, { attr: { fill: S.tone('ink') } }, { attr: { fill: c }, duration: d * 0.3, yoyo: true, repeat: 1, repeatDelay: d * 0.4, ease: 'power2.out', immediateRender: false }, 0);
    if (g.plate) tl.fromTo(g.plate, { attr: { stroke: '#ffffff', 'stroke-opacity': 0.14 } }, { attr: { stroke: c, 'stroke-opacity': 0.9 }, duration: d * 0.3, yoyo: true, repeat: 1, repeatDelay: d * 0.4, immediateRender: false }, 0);
    tl.fromTo(g.caseEl, { attr: { stroke: '#ffffff', 'stroke-opacity': 0.24 } }, { attr: { stroke: c, 'stroke-opacity': 0.95 }, duration: d * 0.3, yoyo: true, repeat: 1, repeatDelay: d * 0.4, immediateRender: false }, 0);
    return tl;
  };
  g.cross = (co = {}) => {
    const d = co.d ?? 0.45, tl = gsap.timeline();
    if (co.tone) g.crossLine.setAttribute('stroke', S.tone(co.tone));
    tl.fromTo(g.crossEl, { opacity: 0 }, { opacity: 1, duration: 0.12, immediateRender: false }, 0);
    tl.fromTo(g.crossEl.children, { drawSVG: '0%' }, { drawSVG: '100%', duration: d, ease: 'power2.out', immediateRender: false }, 0);
    if (co.dim !== 0) tl.fromTo([body, ro], { opacity: 1 }, { opacity: co.dim ?? 0.5, duration: d, ease: 'power1.out', immediateRender: false }, 0);
    return tl;
  };
  g.mark = (i, mo = {}) => {
    const mk = g.marks[i], c = S.tone(mo.tone || 'muted'), from = mk.__fill;
    mk.__fill = c;
    return gsap.fromTo(mk, { attr: { fill: from } }, { attr: { fill: c }, duration: mo.d ?? 0.4, ease: 'power1.inOut', immediateRender: false });
  };
  g.in = (io = {}) => gsap.fromTo(g, { autoAlpha: 0, scale: io.scale ?? 0.86, svgOrigin: `${cx} ${cy}` },
    { autoAlpha: 1, scale: 1, svgOrigin: `${cx} ${cy}`, duration: io.d ?? 0.6, ease: io.ease || 'back.out(1.6)' });
  return g;
}


/* ------------------------------------------------------------------ libTimeAxis */
/**
 * libTimeAxis — a horizontal time ruler, and everything placed on it. Linear (or log, decade ticks) in
 * ms or s; ticks with mono labels (unit on the last label), optional start/end words ('request arrives',
 * 'budget: 30 ms'); labelled spans drawn to scale above the line, from full bars down to 1 px slivers;
 * markers, dimension brackets, chips streaming onto it, and pins for anything else. Everything placed
 * on the axis follows it when it rescales (0–400 ms → 0–16 s, or extended to the left), and things
 * outside the window fade at its ends.
 *
 * o: {x = 260, y = 700 (the axis line), w = 1400, t0 = 0, t1 = 30,
 *     unit = 'ms' ('ms' | 's' | 'year' (plain 1995, 2017; spans read '22 years') | any word | ''),
 *     log = false (t0 > 0; ticks at powers of ten, labels like '100 ms', '1 s'),
 *     ticks = auto (a step, e.g. 0.1 | an array of values | false), minor = auto (subdivisions | 0),
 *     labels = true (| 'ends' | false), unitOn = 'last' ('all' on log axes | 'none'), fmt (v, isLast) => label,
 *     startLabel, endLabel (replace the first / last label, or add one at t0 / t1),
 *     side = 'below' (tick labels under the line | 'above'), size = 24 (tick label px, ≥ 24),
 *     line = true, tone = 'faint' (line colour), arrow = false (a small head: time runs right),
 *     caption = '' (a muted word under the labels, e.g. 'time'), clip = true (fade what leaves the window),
 *     rows = 1, barH = 48, rowGap = 16, gap = 16 (spans sit in rows above the line; row 0 is the top one)}
 * Returns <g> with .X(t) (time → x, as it is now) .T(x) .rowTop(i) .rowY(i) (centre) .line .scale .labelY
 *   .under (bottom of the tick labels) and anchors .x .y .w .l .r. Every label (.labelEl) can take fx.swap,
 *   fx.in or fx.dim: the component's own fades act on wrapper groups, never on the text.
 * Helpers (return tweens/timelines unless noted; call each element's helpers in time order):
 *   .span(ta, tb, so) → a span <g> (built visible) with .bar .labelEl .grow() .to() .recolor(), where
 *        so: {tone = 'struct', style = 'solid' | 'soft' | 'outline' | 'ghost' (dashed), row = 0, y (top), h = barH,
 *             label ('{v}' is replaced by the span's length, which counts as it grows: 'reading weights {v}'),
 *             labelPos = 'auto' (inside if it fits — riding the end, as 'tip', when it counts {v} — else right
 *                        of the end) | 'inside' (centred) | 'tip' | 'right' | 'left'
 *                        | 'above' | 'below' (with a short leader: use for a sliver inside a longer bar), lift = 30,
 *             labelColor, size = 26, decimals (of {v}; default from the length), fmt (v => text for {v}),
 *             square = '' | 'left' | 'right' | 'both' (flat ends where two spans join), r = 8, minW = 1 (px)}
 *        span.grow({d = 1, from = 'left' | 'right' | 'center', ease}) grows along the axis (hidden until then)
 *        span.to(ta, tb, {d = 0.8}) moves or resizes it (a sliver widening 0.1 → 0.14 ms, a bar trimmed)
 *        span.recolor(tone, {d = 0.5}) crossfades the fill to another tone
 *   .grow(span, o) — the same as span.grow(o)
 *   .marker(t, mo) → <g> a vertical line up from the axis with a label on top (built visible), where
 *        mo: {label, tone = 'ink', style = 'line' | 'ghost' (dashed), y1 (top; default above row 0), y2 = axis y,
 *             size = 26, dot = true}; helpers .draw({d = 0.5}) (rises from the axis), .moveTo(t, {d = 0.8})
 *   .bracket(ta, tb, bo) → <g> a dimension line |—— 30 ms ——| (or a bracket), where
 *        bo: {label, tone = 'muted', side = 'below' | 'above', style = 'dim' | 'bracket', y, size = 26};
 *        the label sits in a gap in the line, or beyond it when the gap is too small.
 *        Helpers .draw({d = 0.6}) (opens from its centre), .to(ta, tb, {d = 0.8})
 *   .pin(t) → <g> whose x = 0 is time t (draw anything inside it; it rides the axis); .moveTo(t, {d})
 *   .stream({from = every, every = 30, count = 10 | times = [..] (irregular: a stall), y = rowY(0), h = 40, w,
 *            text, texts[], state}) →
 *        {chips[], times[], play({d = 2 | slow (× real time), ease}) → timeline of chips dropping in at their
 *        times (hidden until then), at(k) → seconds into play() when chip k lands}
 *   .rescale(t0, t1, {d = 1.2, ease, ticks, minor, labels, startLabel, endLabel}) — the window slides
 *        or zooms; the old ticks fade as the new ones arrive
 *   .draw({d = 1}) — the line draws left to right and ticks appear as it passes them (hidden until then)
 * Example (the film's 30 ms bar):
 *   const ax = libTimeAxis(S, { x: 210, y: 720, w: 1500, t0: 0, t1: 30, ticks: false, line: false, barH: 80, gap: 0 });
 *   const sliver = ax.span(0, 0.1, { tone: 'compute', square: 'right', label: 'arithmetic, under 1%', labelPos: 'above' });
 *   const rest = ax.span(0.1, 30, { tone: 'bytes', square: 'left', label: 'something else' });
 *   const dim = ax.bracket(0, 30, { label: '≈ 30 ms per token', y: 760 });
 *   S.add(rest.grow({ d: 1.2 }), 'b1~thirty'); S.add(dim.draw(), 'b1~thirty+0.4'); S.add(sliver.to(0, 0.14), 'b3~came');
 */
function libTimeAxis(S, o = {}, parent) {
  const T = _libTime, f2 = T.f2;
  const x = o.x ?? 260, y = o.y ?? 700, w = o.w ?? 1400;
  const unit = o.unit ?? 'ms';
  const size = Math.max(24, o.size ?? 24);
  const below = (o.side || 'below') !== 'above';
  const rows = o.rows ?? 1, barH = o.barH ?? 48, rowGap = o.rowGap ?? 16, gap = o.gap ?? 16;
  const tickLen = o.tickLen ?? 12;
  const g = S.g(null, parent);
  const sc = T.makeScale({ x, w, t0: o.t0 ?? 0, t1: o.t1 ?? 30, log: o.log, clip: o.clip });
  const axisG = S.g(null, g), spanG = S.g(null, g), topG = S.g(null, g);
  g.scale = sc; g.X = sc.X; g.T = sc.T; g.axisG = axisG;
  g.rowTop = i => y - gap - (rows - i) * barH - (rows - 1 - i) * rowGap;
  g.rowY = i => g.rowTop(i) + barH / 2;
  const showTicks = o.ticks !== false, showLabels = showTicks && o.labels !== false;
  g.labelY = below ? y + tickLen + 8 + size * 0.55 : y - tickLen - 8 - size * 0.55;
  const under = showLabels && below ? g.labelY + size * 0.6 : y + (showTicks && below ? tickLen : 0);
  Object.assign(g, { x, y, w, l: x, r: x + w, under });
  // ticks and labels appear as the drawing line passes them
  const reveal = px => {
    const dl = sc.__live.dl;
    if (dl >= 1) return 1;
    if (dl <= 0) return 0;
    return T.clamp((x - 20 + (w + 40) * dl - px) / 20, 0, 1);
  };
  const mcache = new Map();
  const meas = (t, sz, wt, fam) => { const k = `${t}|${sz}|${wt}|${fam}`; if (!mcache.has(k)) mcache.set(k, S.measure(t, { size: sz, weight: wt, family: fam })); return mcache.get(k); };

  // ---------------------------------------------------------------- line, arrow, caption
  if (o.line !== false) g.line = S.line({ x1: x, y1: y, x2: x + w, y2: y, stroke: o.tone || 'faint', sw: 2.5, cap: 'butt' }, axisG);
  if (o.arrow) g.arrowEl = S.path({ d: `M${x + w + 4},${y - 8}L${x + w + 16},${y}L${x + w + 4},${y + 8}`, stroke: o.tone || 'faint', sw: 2.5 }, axisG);
  if (o.caption) g.captionEl = S.text(o.caption, { x: x + w / 2, y: under + 30, size: 26, color: 'faint', weight: 550, anchor: 'middle' }, axisG);
  sc.add(T.plannable({}, {}, () => {
    const dl = sc.__live.dl;
    if (g.line) {
      const end = x + w + (o.arrow ? 12 : 0);
      g.line.setAttribute('x2', f2(dl >= 1 ? end : Math.max(x, Math.min(end, x - 20 + (w + 40) * dl))));
      g.line.setAttribute('opacity', dl > 0 ? 1 : 0);
    }
    if (g.arrowEl) g.arrowEl.setAttribute('opacity', reveal(x + w + 10));
    if (g.captionEl) g.captionEl.setAttribute('opacity', reveal(x + w / 2));
  }));

  // ---------------------------------------------------------------- tick sets (one per domain)
  const timeUnit = ['ms', 's', 'min', 'h'].includes(unit), years = unit === 'year';
  function tickSet(dom, sp) {
    const tg = S.g(null, axisG);
    const V = T.ticks(dom.t0, dom.t1, sc.log, sp.ticks, sp.minor, w);
    const at = v => x + (sc.u(v) - sc.u(dom.t0)) / ((sc.u(dom.t1) - sc.u(dom.t0)) || 1) * w;
    const eps = Math.abs(dom.t1 - dom.t0) * 1e-6;
    const majors = V.major.filter(v => v >= dom.t0 - eps && v <= dom.t1 + eps);
    const unitOn = sp.unitOn ?? (sc.log ? 'all' : 'last');
    const lab = sp.fmt || ((v, last) => (years ? String(Math.round(v)) : sc.log && timeUnit ? T.human(v, unit)
      : T.trim(v) + ((unitOn === 'all' || (unitOn === 'last' && last)) && unit ? ' ' + unit : '')));
    // '400 ms': the number centres on its tick and the unit hangs to the right
    const hang = (v, text) => (!sp.fmt && !years && !sc.log && unit && text === T.trim(v) + ' ' + unit ? meas(T.trim(v), size, 500, 'mono') : 0);
    let L = majors.map((v, i) => { const text = lab(v, i === majors.length - 1); return { v, i, text, nw: hang(v, text) }; });
    const near = (a, b) => Math.abs(a - b) <= eps;
    if (sp.startLabel != null) { const f = L.find(l => near(l.v, dom.t0)); if (f) Object.assign(f, { text: sp.startLabel, words: true }); else L.unshift({ v: dom.t0, i: -1, text: sp.startLabel, words: true }); }
    if (sp.endLabel != null) { const f = L.find(l => near(l.v, dom.t1)); if (f) Object.assign(f, { text: sp.endLabel, words: true }); else L.push({ v: dom.t1, i: -1, text: sp.endLabel, words: true }); }
    const mode = sp.labels ?? true;
    if (!showTicks || mode === false) L = [];
    else if (mode === 'ends') L = L.filter((l, i) => i === 0 || i === L.length - 1);
    L.forEach(l => {
      l.px = at(l.v); l.tw = meas(l.text, size, 500, 'mono');
      // numbers centre on their tick; words at the ends hang inwards; nothing leaves the safe area
      const atStart = near(l.v, dom.t0), atEnd = near(l.v, dom.t1);
      l.anchor = (l.words && atStart && !atEnd) || l.px - l.tw / 2 < 96 ? 'start' : (l.words && atEnd) || l.px + l.tw / 2 > 1824 ? 'end' : 'middle';
      if (l.anchor === 'middle' && l.nw && l.px - l.nw / 2 + l.tw <= 1824) { l.anchor = 'start'; l.dx = -l.nw / 2; }
      else l.dx = l.anchor === 'start' ? -2 : l.anchor === 'end' ? 2 : 0;
      l.l = l.anchor === 'start' ? l.px + l.dx : l.anchor === 'end' ? l.px - l.tw + 2 : l.px - l.tw / 2;
      l.r = l.l + l.tw;
    });
    // Thin the labels until neighbours keep 18 px apart. Words and the two ends always stay; the
    // numbers keep a regular pattern through zero (every k-th step), minus any that crowd a word.
    const fixed = L.filter((l, i) => l.words || i === 0 || i === L.length - 1);
    const regular = L.filter(l => !fixed.includes(l));
    const step = !sc.log && majors.length > 1 ? majors[1] - majors[0] : 0;
    const hits = (a, b) => a.l < b.r + 18 && b.l < a.r + 18;
    let keep = L;
    for (const k of [1, 2, 3, 4, 5, 6, 8, 10, 20, 50]) {
      const reg = regular.filter(l => (step ? Math.abs(Math.round(l.v / step)) % k === 0 : l.i % k === 0) && !fixed.some(f => hits(f, l)));
      keep = [...fixed, ...reg].sort((a, b) => a.px - b.px);
      const fx2 = keep.filter(l => fixed.includes(l));
      for (let j = fx2.length - 2; j >= 0; j--) if (fx2.length > 2 && hits(fx2[j], fx2[j + 1]) && !fx2[j].words && j > 0) keep.splice(keep.indexOf(fx2[j]), 1);
      if (keep.every((l, i) => !i || l.l >= keep[i - 1].r + 18)) break;
    }
    const dy = below ? 1 : -1;
    const majEls = showTicks ? majors.map(v => ({ v, el: S.line({ x1: x, y1: y, x2: x, y2: y + dy * tickLen, stroke: o.tickTone || 'muted', sw: 2, strokeOpacity: 0.8, cap: 'butt' }, tg) })) : [];
    const minEl = showTicks && V.minor.length ? S.path({ d: '', stroke: 'faint', sw: 1.5, strokeOpacity: 0.9, cap: 'butt' }, tg) : null;
    const labEls = keep.map(l => ({ ...l, el: S.text(l.text, { x: l.px, y: g.labelY, size, family: 'mono', color: o.labelColor || 'muted', anchor: l.anchor, weight: 500 }, tg) }));
    const item = T.plannable({ g: tg, dom, labels: labEls }, { a: 1 }, () => {
      const a = item.__live.a;
      majEls.forEach(m => {
        const px = sc.X(m.v), op = a * sc.vis(px) * reveal(px);
        m.el.setAttribute('x1', f2(px)); m.el.setAttribute('x2', f2(px)); m.el.setAttribute('opacity', op.toFixed(3));
      });
      if (minEl) {
        let d = '';
        const step = V.minor.length > 1 ? Math.abs(sc.X(V.minor[1]) - sc.X(V.minor[0])) : 99;
        if (step >= 5) V.minor.forEach(v => { const px = sc.X(v); if (px >= x - 0.5 && px <= x + w + 0.5 && reveal(px) > 0.5) d += `M${f2(px)},${y}v${dy * 6}`; });
        minEl.setAttribute('d', d); minEl.setAttribute('opacity', a.toFixed(3));
      }
      labEls.forEach(l => {
        const px = sc.X(l.v);
        l.el.setAttribute('x', f2(px + l.dx));
        l.el.setAttribute('opacity', (a * sc.vis(px) * reveal(px)).toFixed(3));
      });
    });
    return sc.add(item);
  }
  const inherit = (k, ro) => (ro[k] !== undefined ? ro[k] : (o[k] === false || o[k] === 0 ? o[k] : undefined));
  let cur = tickSet({ t0: sc.__live.t0, t1: sc.__live.t1 }, o);
  g.ticks = cur;

  // ---------------------------------------------------------------- spans
  g.span = (ta, tb, so = {}) => {
    const tone = so.tone || 'struct', style = so.style || 'solid';
    const h = so.h ?? barH, top = so.y ?? g.rowTop(so.row ?? 0);
    const sp = S.g(null, so.parent || spanG);
    const rad = so.r ?? Math.min(8, h / 4), sq = so.square || '';
    const cr = [sq === 'left' || sq === 'both' ? 0 : rad, sq === 'right' || sq === 'both' ? 0 : rad];
    const corners = [cr[0], cr[1], cr[1], cr[0]];
    const filled = style === 'solid' || style === 'soft';
    const fillOf = tn => (style === 'solid' ? T.solid(S, tn) : style === 'soft' ? T.tint(S, tn) : 'none');
    if (filled || so.base) sp.base = S.path({ d: '', fill: T.BASE }, sp);
    const skinOf = tn => S.path({ d: '', fill: fillOf(tn), stroke: style === 'solid' ? undefined : tn,
      strokeOpacity: style === 'ghost' ? 0.8 : style === 'outline' ? 0.85 : 0.7, sw: style === 'solid' ? undefined : 2, dash: style === 'ghost' ? '8 6' : undefined }, sp);
    sp.bar = skinOf(tone);
    sp.skins = [sp.bar];
    const lsz = so.size ?? 26, tpl = so.label != null ? String(so.label) : '';
    const decs = so.decimals ?? Math.min(2, T.decOf(Math.abs(tb - ta)));
    const vfmt = so.fmt || (v => (years ? `${T.num(v, decs)} year${Math.abs(v - 1) < 1e-9 ? '' : 's'}` : T.num(v, decs) + (unit ? ' ' + unit : '')));
    const textAt = v => tpl.replace('{v}', vfmt(v));
    const pos0 = so.labelPos || 'auto';
    if (tpl) {
      sp.labelG = S.g(null, sp);
      if (pos0 === 'above' || pos0 === 'below') sp.leader = S.line({ x1: 0, y1: 0, x2: 0, y2: 0, stroke: so.labelColor || T.ink(S, tone), sw: 2, strokeOpacity: 0.85 }, sp.labelG);
      sp.__lin = S.g(null, sp.labelG);
      sp.labelEl = S.text(textAt(tb - ta), { x: 0, y: top + h / 2 + 1, size: lsz, weight: 600 }, sp.__lin);
      // a counting label rides outside the end while the bar is too narrow to hold it, then moves in
      if (tpl.includes('{v}') && (pos0 === 'auto' || pos0 === 'tip')) {
        sp.__lout = S.g(null, sp.labelG);
        sp.labelOut = S.text('', { x: 0, y: top + h / 2 + 1, size: lsz, weight: 600, color: so.labelColor || T.ink(S, tone) }, sp.__lout);
      }
    }
    const lift = so.lift ?? 30;
    T.plannable(sp, { ta, tb, p: 1, dir: 'left' }, () => {
      const L = sp.__live, p = Math.max(0, L.p);
      const X0 = sc.X(L.ta), X1 = sc.X(L.tb), full = X1 - X0;
      let a, b;
      if (L.dir === 'right') { b = X1; a = X1 - full * Math.min(p, 1.2); }
      else if (L.dir === 'center') { const m = (X0 + X1) / 2; a = m - full * p / 2; b = m + full * p / 2; }
      else { a = X0; b = X0 + full * p; }
      a = sc.clampX(a); b = sc.clampX(b);
      const inView = b > x - 0.5 && a < x + w + 0.5;
      const minW = so.minW ?? 1;
      if (p > 0.001 && b - a < minW && (inView || !sc.clip)) { if (L.dir === 'right') a = b - minW; else b = a + minW; }
      const d = p > 0.001 && b - a > 0.01 ? T.rr(a, top, b - a, h, corners) : '';
      sp.skins.forEach(k => k.setAttribute('d', d));
      if (sp.base) sp.base.setAttribute('d', d);
      if (!sp.labelEl) return;
      const txt = textAt(Math.abs(L.tb - L.ta) * Math.min(1, p));
      if (tpl.includes('{v}') && sp.labelEl.textContent !== txt) sp.labelEl.textContent = txt;
      const tw = meas(txt, lsz, 600, 'sans'), twFull = meas(textAt(Math.abs(L.tb - L.ta)), lsz, 600, 'sans');
      const fa = sc.clampX(X0), fb = sc.clampX(X1);
      const pos = pos0 === 'auto' ? (twFull + 28 <= fb - fa ? (tpl.includes('{v}') ? 'tip' : 'inside') : 'right') : pos0;
      let lx, ly = top + h / 2 + 1, anchor = 'middle', op = 1, col = so.labelColor || T.ink(S, tone);
      let outOp = 0;
      if (pos === 'tip') {          // inside, riding the growing end (a counting value reads as it grows)
        const fromRight = L.dir === 'right';
        lx = fromRight ? a + 14 : b - 14; anchor = fromRight ? 'start' : 'end';
        col = so.labelColor || (style === 'solid' ? T.DARK : S.tone('ink'));
        op = T.clamp((b - a - tw - 28) / 24, 0, 1);
        if (sp.labelOut) {
          outOp = p > 0.001 ? 1 - op : 0;
          if (sp.labelOut.textContent !== txt) sp.labelOut.textContent = txt;
          sp.labelOut.setAttribute('x', f2(fromRight ? a - 14 : b + 14));
          sp.labelOut.setAttribute('text-anchor', fromRight ? 'end' : 'start');
        }
      } else if (pos === 'inside') {
        lx = (fa + fb) / 2;
        col = so.labelColor || (style === 'solid' ? T.DARK : S.tone('ink'));
        op = L.dir === 'right' ? T.clamp((lx - tw / 2 - 10 - a) / 24, 0, 1) : L.dir === 'center' ? T.clamp((b - a - tw - 20) / 24, 0, 1) : T.clamp((b - (lx + tw / 2 + 10)) / 24, 0, 1);
      } else if (pos === 'right') { lx = b + 14; anchor = 'start'; op = T.clamp(p * 8, 0, 1); }
      else if (pos === 'left') { lx = a - 14; anchor = 'end'; op = T.clamp(p * 8, 0, 1); }
      else {
        const xc = (a + b) / 2, up = pos === 'above';
        ly = up ? top - lift - lsz * 0.5 : top + h + lift + lsz * 0.5;
        lx = xc; anchor = 'middle';
        if (xc - tw / 2 < x - 16) { anchor = 'start'; lx = xc - 16; }
        else if (xc + tw / 2 > x + w + 16) { anchor = 'end'; lx = xc + 16; }
        const l1 = up ? top - 4 : top + h + 4, l2 = up ? top - lift + 2 : top + h + lift - 2;
        sp.leader.setAttribute('x1', f2(xc)); sp.leader.setAttribute('x2', f2(xc));
        sp.leader.setAttribute('y1', f2(l1)); sp.leader.setAttribute('y2', f2(l2));
        op = T.clamp(p * 6, 0, 1);
      }
      sp.labelEl.setAttribute('x', f2(lx)); sp.labelEl.setAttribute('y', f2(ly));
      sp.labelEl.setAttribute('text-anchor', anchor);
      sp.labelEl.setAttribute('fill', col);
      sp.__lin.setAttribute('opacity', op.toFixed(3));
      if (sp.leader) sp.leader.setAttribute('opacity', op.toFixed(3));
      if (sp.__lout) sp.__lout.setAttribute('opacity', outOp.toFixed(3));
      sp.labelG.setAttribute('opacity', inView ? 1 : 0);
    });
    sc.add(sp);
    Object.assign(sp, { t: top, b: top + h, h, cy: top + h / 2, l: sc.X(ta), r: sc.X(tb), tone });
    sp.grow = (go = {}) => T.drive(sp, { p: 1, dir: go.from || 'left' }, { from: { p: 0 }, d: go.d ?? 1, ease: go.ease || 'power2.inOut' });
    sp.to = (na, nb, to = {}) => T.drive(sp, { ta: na, tb: nb }, { d: to.d ?? 0.8, ease: to.ease || 'power2.inOut' });
    sp.recolor = (tn, ro = {}) => {
      const nk = skinOf(tn), prev = sp.skins[sp.skins.length - 1];
      if (sp.labelG) sp.appendChild(sp.labelG);
      nk.setAttribute('d', prev.getAttribute('d'));
      nk.style.opacity = 0;
      sp.skins.push(nk);
      const d = ro.d ?? 0.5, tl = gsap.timeline();
      tl.fromTo(nk, { opacity: 0 }, { opacity: 1, duration: d, ease: 'power1.inOut', immediateRender: false }, 0);
      tl.fromTo(prev, { opacity: 1 }, { opacity: 0, duration: d, ease: 'power1.inOut', immediateRender: false }, 0);
      return tl;
    };
    return sp;
  };
  g.grow = (sp, go) => sp.grow(go);

  // ---------------------------------------------------------------- markers
  g.marker = (t, mo = {}) => {
    const mg = S.g(null, topG), inner = S.g(null, mg);
    const tone = mo.tone || 'ink', msz = mo.size ?? 26;
    const y1 = mo.y1 ?? g.rowTop(0) - 16, y2 = mo.y2 ?? y;
    mg.line = S.line({ x1: x, y1, x2: x, y2, stroke: tone, sw: mo.sw ?? 2.5, dash: mo.style === 'ghost' ? '7 6' : undefined, cap: mo.style === 'ghost' ? 'butt' : 'round' }, inner);
    if (mo.dot !== false) mg.dot = S.circle({ x, y: y2, r: 6, fill: tone }, inner);
    if (mo.label) { mg.__lg = S.g(null, inner); mg.labelEl = S.text(mo.label, { x, y: y1 - 14 - msz * 0.5, size: msz, color: tone === 'ink' ? 'ink' : T.ink(S, tone), anchor: mo.anchor || 'middle', weight: 600 }, mg.__lg); }
    T.plannable(mg, { t, dp: 1 }, () => {
      const L = mg.__live, px = sc.X(L.t), dp = T.clamp(L.dp, 0, 1);
      mg.line.setAttribute('x1', f2(px)); mg.line.setAttribute('x2', f2(px));
      mg.line.setAttribute('y1', f2(y2 - (y2 - y1) * dp));
      if (mg.dot) { mg.dot.setAttribute('cx', f2(px)); mg.dot.setAttribute('opacity', dp > 0 ? 1 : 0); }
      if (mg.labelEl) { mg.labelEl.setAttribute('x', f2(px)); mg.__lg.setAttribute('opacity', T.clamp((dp - 0.6) * 2.5, 0, 1).toFixed(3)); }
      inner.setAttribute('opacity', (sc.vis(px) * (dp > 0 ? 1 : 0)).toFixed(3));
    });
    sc.add(mg);
    mg.draw = (dO = {}) => T.drive(mg, { dp: 1 }, { from: { dp: 0 }, d: dO.d ?? 0.5, ease: dO.ease || 'power2.out' });
    mg.moveTo = (t2, mO = {}) => T.drive(mg, { t: t2 }, { d: mO.d ?? 0.8, ease: mO.ease || 'power2.inOut' });
    return mg;
  };

  // ---------------------------------------------------------------- brackets / dimension lines
  g.bracket = (ta, tb, bo = {}) => {
    const bg = S.g(null, topG), inner = S.g(null, bg);
    const style = bo.style || 'dim', up = bo.side === 'above', dir = up ? -1 : 1;
    const tone = bo.tone || 'muted', bsz = bo.size ?? 26;
    const yy = bo.y ?? (up ? g.rowTop(0) - 24 : under + 26);
    bg.path = S.path({ d: '', stroke: tone, sw: bo.sw ?? 2.5, cap: 'butt', join: 'miter' }, inner);
    if (bo.label) { bg.__lg = S.g(null, inner); bg.labelEl = S.text(bo.label, { x, y: yy, size: bsz, color: tone === 'muted' ? 'muted' : T.ink(S, tone), anchor: 'middle', weight: 600 }, bg.__lg); }
    const tw = bo.label ? meas(bo.label, bsz, 600, 'sans') : 0;
    T.plannable(bg, { ta, tb, dp: 1 }, () => {
      const L = bg.__live, dp = T.clamp(L.dp, 0, 1);
      const x0 = sc.clampX(sc.X(L.ta)), x1 = sc.clampX(sc.X(L.tb)), m = (x0 + x1) / 2;
      const a = m - (x1 - x0) / 2 * dp, b = m + (x1 - x0) / 2 * dp;
      let d, ly = yy;
      if (style === 'dim') {
        const inGap = tw && x1 - x0 >= tw + 2 * 16 + 24;
        d = `M${f2(a)},${yy - 10}v20M${f2(b)},${yy - 10}v20`;
        if (inGap && b - a > tw + 32) d += `M${f2(a)},${yy}H${f2(m - tw / 2 - 16)}M${f2(m + tw / 2 + 16)},${yy}H${f2(b)}`;
        else if (!inGap) d += `M${f2(a)},${yy}H${f2(b)}`;
        if (!inGap) ly = yy + dir * (bsz * 0.6 + 16);
      } else {
        const leg = -dir * 12;
        d = `M${f2(a)},${yy + leg}V${yy}H${f2(b)}V${yy + leg}`;
        ly = yy + dir * (bsz * 0.6 + 14);
      }
      bg.path.setAttribute('d', dp > 0.001 ? d : '');
      if (bg.labelEl) { bg.labelEl.setAttribute('x', f2(m)); bg.labelEl.setAttribute('y', f2(ly)); bg.__lg.setAttribute('opacity', T.clamp((dp - 0.55) * 2.5, 0, 1).toFixed(3)); }
    });
    sc.add(bg);
    bg.draw = (dO = {}) => T.drive(bg, { dp: 1 }, { from: { dp: 0 }, d: dO.d ?? 0.6, ease: dO.ease || 'power2.out' });
    bg.to = (na, nb, tO = {}) => T.drive(bg, { ta: na, tb: nb }, { d: tO.d ?? 0.8, ease: tO.ease || 'power2.inOut' });
    return bg;
  };

  // ---------------------------------------------------------------- pins and streams
  g.pin = (t, po = {}) => {
    const holder = S.g(null, po.parent || topG), inner = S.g(null, holder);
    T.plannable(holder, { t }, () => {
      const px = sc.X(holder.__live.t);
      holder.setAttribute('transform', `translate(${f2(px)} 0)`);
      holder.setAttribute('opacity', sc.vis(px).toFixed(3));
    });
    sc.add(holder);
    inner.holder = holder;
    inner.moveTo = (t2, mO = {}) => T.drive(holder, { t: t2 }, { d: mO.d ?? 0.8, ease: mO.ease || 'power2.inOut' });
    return inner;
  };
  g.__stream = (so, pinAt, cy) => {
    const every = so.every ?? 30, from = so.from ?? every;
    const times = so.times ? so.times.slice() : Array.from({ length: so.count ?? 10 }, (_, k) => +(from + k * every).toPrecision(12));
    const n = times.length;
    const h = so.h ?? 40;
    const chips = times.map((t, k) => {
      const yg = S.g({ transform: `translate(0 ${f2(cy)})` }, pinAt(t));
      const text = so.texts ? so.texts[k] : so.text;
      return T.chip(S, { text, h, w: so.w, minW: so.minW ?? (text ? undefined : Math.min(h, so.w ?? h)), size: so.size ?? Math.max(24, Math.round(h / 1.85)), state: so.state }, yg);
    });
    const st = { chips, times, __pace: 0 };
    st.play = (po = {}) => {
      const tl = gsap.timeline(), span = times[n - 1] - times[0];
      st.__pace = po.slow != null ? T.unitSec(unit) * po.slow : (po.d ?? 2) / (span || 1);
      chips.forEach((c, k) => tl.add(T.drop(c, { d: po.dropD ?? 0.3, dist: po.dist }), (times[k] - times[0]) * st.__pace));
      return tl;
    };
    st.at = k => (times[k] - times[0]) * st.__pace;
    return st;
  };
  g.stream = (so = {}) => g.__stream(so, t => g.pin(t), so.y ?? g.rowY(0));

  // ---------------------------------------------------------------- rescale and draw
  const domInterp = (a, b, q) => {
    if (sc.log) {
      const u0 = Math.log10(a.t0) + (Math.log10(b.t0) - Math.log10(a.t0)) * q, u1 = Math.log10(a.t1) + (Math.log10(b.t1) - Math.log10(a.t1)) * q;
      return { t0: Math.pow(10, u0), t1: Math.pow(10, u1) };
    }
    const wa = a.t1 - a.t0, wb = b.t1 - b.t0;
    const t0 = a.t0 + (b.t0 - a.t0) * q;
    if (wa > 0 && wb > 0) return { t0, t1: t0 + wa * Math.pow(wb / wa, q) };
    return { t0, t1: a.t1 + (b.t1 - a.t1) * q };
  };
  g.rescale = (t0, t1, ro = {}) => {
    const old = cur, d = ro.d ?? 1.2;
    const sp = { ticks: inherit('ticks', ro), minor: inherit('minor', ro), labels: ro.labels ?? o.labels, fmt: ro.fmt ?? o.fmt, unitOn: ro.unitOn ?? o.unitOn, startLabel: ro.startLabel, endLabel: ro.endLabel };
    const nu = tickSet({ t0, t1 }, sp);
    nu.__live.a = 0; nu.__plan.a = 0; nu.__touched.a = true; nu.__render();
    cur = nu;
    const tl = gsap.timeline();
    tl.add(T.drive(sc, { t0, t1 }, { d, ease: ro.ease || 'power2.inOut', interp: domInterp }), 0);
    // old labels are gone (below 20%) before the new ones pass 20%, so the two sets never read at once
    tl.add(T.drive(old, { a: 0 }, { d: d * 0.5, ease: 'power1.in' }), 0);
    tl.add(T.drive(nu, { a: 1 }, { d: d * 0.5, ease: 'power1.out' }), d * 0.5);
    return tl;
  };
  g.draw = (dO = {}) => T.drive(sc, { dl: 1 }, { from: { dl: 0 }, d: dO.d ?? 1, ease: dO.ease || 'power2.inOut' });
  return g;
}


/* ------------------------------------------------------------------ libTimeline */
/**
 * libTimeline — lanes on one shared time axis: 'made' vs 'seen', cold vs warm, three users' streams,
 * 'ideal' vs 'real'. S.lanes draws the label column and the lane tracks (same look as any S.lanes);
 * a libTimeAxis underneath carries the time scale, so spans, chips, arrows between lanes, brackets,
 * markers and bands all follow it when it rescales.
 *
 * o: {x = 160, y = 360 (top of the first lane), w = 1600 (label column + tracks), labelW = 220,
 *     laneH = 64, gap = 22, size = 26 (lane labels),
 *     lanes = [{label, tone (label colour; default muted), icon (an icon id drawn left of the label),
 *               iconTone (default tone), ghost (dashed empty track, e.g. 'seen, if held back'),
 *               hidden (until .showLane(i))}],
 *     t0 = 0, t1 = 400, unit = 'ms', log, clip,
 *     axis = {} (libTimeAxis options for the ruler under the lanes: ticks, minor, labels, startLabel,
 *            endLabel, caption, arrow…) | false (no ruler; the scale still works), axisGap = 22,
 *     chipH = min(44, laneH − 16) (token chips), iconSize = min(44, laneH − 16)}
 * Returns <g> with .axis (the libTimeAxis) .X(t) .laneY(i) (top) .laneCY(i) .laneH .lanes[] ({g, label,
 *   track, icon}) and anchors .x .y .w .x0 (left of the tracks) .b (bottom of the last lane).
 * Helpers (return elements as noted; elements' helpers return tweens; call in time order):
 *   .span(i, ta, tb, so) → a libTimeAxis span filling lane i (labelPos 'auto': inside, or right of a sliver)
 *   .token(i, t, {text, state, h = chipH, w}) → a token chip centred on time t in lane i (built visible;
 *        its .drop() / .pop() hide it until then)
 *   .stream(i, {from, every = 30, count = 10 | times = [..], text, texts[], state, h, w}) →
 *        {chips[], times[], play({d | slow}), at(k)} (see libTimeAxis.stream)
 *   .arrow(i, ta, j, tb, {tone = 'muted', sw = 2.5, label}) → arrow from the chip at ta in lane i to the chip
 *        at tb in lane j (made → seen); .draw({d = 0.5}) draws it on (hidden until then)
 *   .bracket(i, ta, tb, {label, side = 'above' | 'below', tone, style = 'dim' | 'bracket', y}) → axis bracket
 *        just above (or below) lane i: '30 ms' between two chips, TTFT, TPOT. Between two lanes, leave
 *        gap ≥ 70 for it; below the last lane it sits under the ruler's labels.
 *   .marker(t, {label, tone = 'ink', style = 'line' | 'ghost', lanes = [first, last]}) → a vertical line
 *        across the lanes down to the axis, label on top ('send', 'token done ≈ 42 ms')
 *   .band(ta, tb, {tone = 'struct', label, lanes = [first, last]}) → a translucent block across lanes
 *        (a prefill block that stalls everyone, a highlight sweeping along); .moveTo(ta, tb, {d}),
 *        .grow({d}) (from the left; hidden until then)
 *   .pin(i, t) → <g> centred on (time t, lane i's centre line); .moveTo(t, {d})
 *   .showLane(i, {d = 0.6}) → tween bringing in a lane built with hidden: true
 *   .rescale(t0, t1, o) → the axis and everything on it rescale together (see libTimeAxis)
 *   .draw({d = 1}) → lanes slide in, then the ruler draws on (hidden until then)
 * Example (made vs seen):
 *   const tl = libTimeline(S, { y: 420, t0: 0, t1: 400, lanes: [{ label: 'made', icon: 'ph:cpu-duotone' }, { label: 'seen', icon: 'ph:laptop-duotone' }], gap: 70 });
 *   const made = tl.stream(0, { from: 30, every: 30, count: 12 }), seen = tl.stream(1, { from: 95, every: 30, count: 10 });
 *   S.add(made.play({ slow: 10 }), 'b3'); S.add(seen.play({ slow: 10 }), 'b3+0.65');
 *   const b = tl.bracket(0, 30, 60, { label: '30 ms' }); S.add(b.draw(), 'b3~exactly');
 */
function libTimeline(S, o = {}, parent) {
  const T = _libTime, f2 = T.f2;
  const g = S.g(null, parent);
  const lanes = o.lanes || [{ label: 'made' }, { label: 'seen' }];
  const n = lanes.length;
  const x = o.x ?? 160, y = o.y ?? 360, w = o.w ?? 1600;
  const labelW = o.labelW ?? 220, laneH = o.laneH ?? 64, gap = o.gap ?? 22;
  const iconSize = o.iconSize ?? Math.min(44, laneH - 16);
  const iconW = lanes.some(l => l.icon) ? iconSize + 18 : 0;
  const chipH = o.chipH ?? Math.min(44, laneH - 16);
  const lg = S.lanes({
    x: x + iconW, y, w: w - iconW, labelW: labelW - iconW, laneH, gap, size: o.size, t0: o.t0 ?? 0, t1: o.t1 ?? 400,
    lanes: lanes.map(l => ({ label: l.label || '', tone: l.tone || 'muted' })),
  }, g);
  const kids = [...lg.children];
  g.laneY = lg.laneY; g.laneH = laneH;
  g.laneCY = i => lg.laneY(i) + laneH / 2;
  g.lanes = lanes.map((l, i) => {
    const lgp = S.g(null, lg), label = kids[2 * i], track = kids[2 * i + 1];
    lgp.appendChild(label); lgp.appendChild(track);
    let icon = null;
    if (l.icon) icon = S.icon(l.icon, { x: x + iconSize / 2, y: g.laneCY(i), size: iconSize, color: l.iconTone || l.tone || 'muted' }, lgp);
    if (l.ghost) { track.setAttribute('fill', 'none'); track.setAttribute('stroke-dasharray', '9 8'); track.setAttribute('stroke-opacity', 0.32); track.setAttribute('stroke-width', 2); }
    if (l.hidden) gsap.set(lgp, { autoAlpha: 0 });
    return { g: lgp, label, track, icon, i };
  });
  const x0 = x + labelW, tw = w - labelW;
  const axisY = lg.laneY(n - 1) + laneH + (o.axisGap ?? 22);
  const ao = o.axis === false ? { line: false, ticks: false } : (o.axis || {});
  g.axis = libTimeAxis(S, { t0: o.t0 ?? 0, t1: o.t1 ?? 400, unit: o.unit ?? 'ms', log: o.log, clip: o.clip, ...ao, x: x0, y: axisY, w: tw, rows: 1, gap: 0, barH: laneH }, g);
  const sc = g.axis.scale, top = S.g(null, g);
  g.X = g.axis.X;
  Object.assign(g, { x, y, w, x0, b: lg.laneY(n - 1) + laneH, axisY });

  g.span = (i, ta, tb, so = {}) => g.axis.span(ta, tb, { ...so, y: lg.laneY(i) + 6, h: laneH - 12 });
  g.pin = (i, t) => {
    const inner = g.axis.pin(t);
    const yg = S.g({ transform: `translate(0 ${f2(g.laneCY(i))})` }, inner);
    yg.moveTo = inner.moveTo;
    return yg;
  };
  g.token = (i, t, to = {}) => {
    const h = to.h ?? chipH;
    const c = T.chip(S, { text: to.text, h, w: to.w, minW: to.w ?? (to.text ? undefined : h), size: to.size ?? Math.max(24, Math.round(h / 1.85)), state: to.state }, g.pin(i, t));
    c.drop = dO => T.drop(c, dO);
    if (!c.pop) c.pop = pO => gsap.fromTo(c, { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: (pO && pO.d) ?? 0.5, ease: 'back.out(2.2)' });
    return c;
  };
  g.stream = (i, so = {}) => g.axis.__stream({ h: chipH, ...so }, t => g.pin(i, t), 0);

  g.arrow = (i, ta, j, tb, ao2 = {}) => {
    const ag = S.g(null, top), inner = S.g(null, ag);
    const tone = ao2.tone || 'muted', sw = ao2.sw ?? 2.5, down = j > i ? 1 : -1;
    const yA = g.laneCY(i) + down * (chipH / 2 + 8), yB = g.laneCY(j) - down * (chipH / 2 + 8);
    ag.line = S.path({ d: '', stroke: tone, sw }, inner);
    ag.head = S.path({ d: '', stroke: tone, sw }, inner);
    if (ao2.label) { ag.__lg = S.g(null, inner); ag.labelEl = S.text(ao2.label, { x: 0, y: (yA + yB) / 2, size: ao2.size ?? 26, color: T.ink(S, tone), weight: 550 }, ag.__lg); }
    T.plannable(ag, { ta, tb, dp: 1 }, () => {
      const L = ag.__live, xa = sc.X(L.ta), xb = sc.X(L.tb), dp = T.clamp(L.dp, 0, 1);
      const ex = xa + (xb - xa) * dp, ey = yA + (yB - yA) * dp;
      ag.line.setAttribute('d', dp > 0.001 ? `M${f2(xa)},${f2(yA)}L${f2(ex)},${f2(ey)}` : '');
      const dx = xb - xa, dy = yB - yA, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, hs = 11;
      ag.head.setAttribute('d', `M${f2(ex - ux * hs - uy * hs * 0.6)},${f2(ey - uy * hs + ux * hs * 0.6)}L${f2(ex)},${f2(ey)}L${f2(ex - ux * hs + uy * hs * 0.6)},${f2(ey - uy * hs - ux * hs * 0.6)}`);
      ag.head.setAttribute('opacity', T.clamp((dp - 0.75) * 5, 0, 1).toFixed(3));
      if (ag.labelEl) { ag.labelEl.setAttribute('x', f2(Math.max(xa, xb) + 16)); ag.__lg.setAttribute('opacity', T.clamp((dp - 0.6) * 2.5, 0, 1).toFixed(3)); }
      inner.setAttribute('opacity', Math.min(sc.vis(xa), sc.vis(xb)).toFixed(3));
    });
    sc.add(ag);
    ag.draw = (dO = {}) => T.drive(ag, { dp: 1 }, { from: { dp: 0 }, d: dO.d ?? 0.5, ease: dO.ease || 'power2.inOut' });
    return ag;
  };
  g.bracket = (i, ta, tb, bo = {}) => {
    const up = (bo.side || 'above') === 'above';
    const yb = i === n - 1 && o.axis !== false ? g.axis.under + 30 : lg.laneY(i) + laneH + 16;   // under the ruler's labels
    return g.axis.bracket(ta, tb, { ...bo, side: up ? 'above' : 'below', y: bo.y ?? (up ? lg.laneY(i) - 16 : yb) });
  };
  const laneSpan = ls => { const [a, b] = ls || [0, n - 1]; return [lg.laneY(a), lg.laneY(b) + laneH, b === n - 1]; };
  g.marker = (t, mo = {}) => {
    const [ya, yb, toAxis] = laneSpan(mo.lanes);
    const mk = g.axis.marker(t, { ...mo, y1: mo.y1 ?? ya - 14, y2: mo.y2 ?? (toAxis && o.axis !== false ? axisY : yb + 14) });
    top.appendChild(mk);
    return mk;
  };
  g.band = (ta, tb, bo = {}) => {
    const [ya, yb] = laneSpan(bo.lanes);
    const bg = S.g(null, top), inner = S.g(null, bg);
    const tone = bo.tone || 'struct', bsz = bo.size ?? 26, y1 = ya - 10, y2 = yb + 10;
    bg.rect = S.rect({ x: x0, y: y1, w: 1, h: y2 - y1, r: 10, fill: tone, fillOpacity: bo.fillOpacity ?? 0.14, stroke: tone, strokeOpacity: 0.65, sw: 2 }, inner);
    if (bo.label) { bg.__lg = S.g(null, inner); bg.labelEl = S.text(bo.label, { x: x0, y: y1 - 14 - bsz * 0.5, size: bsz, color: T.ink(S, tone), anchor: 'middle', weight: 600 }, bg.__lg); }
    T.plannable(bg, { ta, tb, p: 1 }, () => {
      const L = bg.__live, a = sc.clampX(sc.X(L.ta)), full = sc.clampX(sc.X(L.tb));
      const b = a + (full - a) * T.clamp(L.p, 0, 1), ww = Math.max(0, b - a);
      bg.rect.setAttribute('x', f2(a)); bg.rect.setAttribute('width', f2(ww));
      bg.rect.setAttribute('rx', f2(Math.min(10, ww / 2))); bg.rect.setAttribute('ry', f2(Math.min(10, ww / 2)));
      if (bg.labelEl) { bg.labelEl.setAttribute('x', f2((a + full) / 2)); bg.__lg.setAttribute('opacity', T.clamp(L.p * 3 - 1, 0, 1).toFixed(3)); }
      inner.setAttribute('opacity', ww > 0.5 ? 1 : 0);
    });
    sc.add(bg);
    bg.moveTo = (na, nb, mO = {}) => T.drive(bg, { ta: na, tb: nb }, { d: mO.d ?? 0.8, ease: mO.ease || 'power2.inOut' });
    bg.grow = (gO = {}) => T.drive(bg, { p: 1 }, { from: { p: 0 }, d: gO.d ?? 0.6, ease: gO.ease || 'power2.out' });
    return bg;
  };
  g.showLane = (i, sO = {}) => gsap.fromTo(g.lanes[i].g, { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: sO.d ?? 0.6, ease: 'power3.out' });
  g.rescale = (t0, t1, ro) => g.axis.rescale(t0, t1, ro);
  g.draw = (dO = {}) => {
    const d = dO.d ?? 1, tl = gsap.timeline();
    tl.add(gsap.fromTo(g.lanes.filter((l, i) => !lanes[i].hidden).map(l => l.g), { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out', stagger: 0.1 }), 0);
    if (o.axis !== false) tl.add(g.axis.draw({ d }), 0.25);
    return tl;
  };
  return g;
}
