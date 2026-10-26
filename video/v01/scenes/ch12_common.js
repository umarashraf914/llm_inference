/* Shared builders for chapter 12, "Placing the two phases". Loaded before every ch12 scene.
 *
 * Visual language of the chapter (keep it consistent):
 *   prefill = amber (compute), decode = coral (bytes): s01's result pills, s02's roofline dots.
 *   operations amber, bytes / bandwidth coral, tokens / weights / the token rate blue, text white and grey.
 *   s01: a two-row ledger (prefill over decode) of to-scale bars, lanes starting at x 560, 1,000 px full scale.
 *   s02: the H100 roofline (libRoofline defaults: decode (320, 769), ridge (938, 151), prefill (1145, 151)).
 *   s03 / s04: the ceiling equation below, built by ch12Ceiling, whose terms keep fixed centres so s04
 *   can pick it up exactly where s03 leaves it and slide it up 45 px.
 */

/**
 * ch12Ceiling — the top-band equation of s03 and s04:
 *   [max tokens per second] = [bandwidth] ÷ [bytes per token]   [≈ 24 tokens/s]
 *                                 |               |        |
 *                            (this chip) (16-bit weights) (one token per read)
 * Each term has a fixed centre; the two coral terms morph in place into their numbers ('3.35 TB/s',
 * '140 GB per token'); the white-outlined result box sits at x 1330–1630; three grey condition chips sit
 * under the terms they govern, each joined by a thin line up to its term ('140 GB' and 'per token' are
 * separate anchors inside the last term).
 *
 * o: {y = 200 (equation centre line), size = 36, chipY = 275 (chip centres), chipSize = 24, chipH = 40,
 *     state = 'symbols' | 'numbers' (which version of the two coral terms is showing at build time),
 *     hidden = true   (true: every part starts hidden and enters with the helpers below, as in s03;
 *                      false: everything is drawn as at the end of s03, as s04 needs it),
 *     result = '≈ 24 tokens/s', chips = ['this chip', '16-bit weights', 'one token per read']}
 * Returns <g> (the whole band; s04 moves it with g.slide; do not fx.in / fx.move the root) with:
 *   .terms {rate, eq, bw, div, bpt}: each {g (entrance holder), sym (<g> with the word text), num (<g> with the
 *          number text, bw and bpt only), cx, y}; .bpt.anchors {gb: x of '140 GB', perToken: x of 'per token'}
 *   .result {g, bg, label, l, r, cx}
 *   .chips[i] {g, base, bg, label, line, cx, t, b, l, r, target: [x, y] (where its line meets the term)}
 *   .halo (the glow's soft backdrop)
 *   .y .chipY (planned, before any slide; add g.dy after a slide)
 * Helpers (each returns a tween or timeline for S.add; call them in time order):
 *   .enter(name, {d = 0.55, from = 'up'})  a term lands ('rate' | 'eq' | 'bw' | 'div' | 'bpt')
 *   .morph(name, {d = 0.5})                 'bw' | 'bpt': the word flips out, the number flips in, same centre
 *   .showResult({d = 0.7})                  the box outline draws on, its label fades up
 *   .showChip(i, {d = 0.5})                 chip i pops in and its line draws up to the term
 *   .tintChip(i, tone = 'helps', {d = 0.5}) chip i's outline and its line recolour (s04: teal)
 *   .glow({d = 0.9})                        a soft white halo swells behind the equation and the terms swell 4%, once
 *   .slide(dy = -45, {d = 0.9})             the band moves as one group (s04: up 45 px); updates g.dy
 * Example (s03):
 *   const C = ch12Ceiling(S, {});
 *   S.add(C.enter('rate'), "b1~Decode's-0.2");
 *   S.add(C.enter('eq'), 'b1~over-0.2');  ...  S.add(C.morph('bw'), 'b1~three-0.2');
 * Example (s04, picks up the s03 end state):
 *   const C = ch12Ceiling(S, { hidden: false, state: 'numbers' });
 *   S.add(C.slide(-45), 'b1-0.3');
 *   S.add(C.tintChip(0), 'b1~one per');
 */
function ch12Ceiling(S, o = {}, parent) {
  const { fx } = S;
  const y = o.y ?? 200, size = o.size ?? 36, chipY = o.chipY ?? 275, chipSize = o.chipSize ?? 24, chipH = o.chipH ?? 40;
  const hidden = o.hidden ?? true, numbers = o.state === 'numbers';
  const g = S.g(null, parent);
  g.dy = 0;
  const hide = e => { e.style.opacity = 0; e.style.visibility = 'hidden'; };
  const W = (t, w = 600) => S.measure(t, { size, weight: w });

  // ------------------------------------------------------------------ the terms (fixed centres)
  const term = (name, cx, symText, tone, numText) => {
    const t = { g: S.g(null, g), cx, y };
    t.sym = S.g(null, t.g);
    S.text(symText, { x: cx, y, size, weight: 600, anchor: 'middle', color: tone }, t.sym);
    if (numText) {
      t.num = S.g(null, t.g);
      if (Array.isArray(numText)) S.text(numText, { x: cx, y, size, weight: 600, anchor: 'middle', color: tone }, t.num);
      else S.text(numText, { x: cx, y, size, weight: 600, anchor: 'middle', color: tone }, t.num);
      hide(numbers ? t.sym : t.num);
    }
    if (hidden) hide(t.g);
    return t;
  };
  const T = g.terms = {
    rate: term('rate', 380, 'max tokens per second', 'struct'),   // clear of the '=' even when the terms swell
    eq: term('eq', 640, '=', 'ink'),
    bw: term('bw', 790, 'bandwidth', 'bytes', '3.35 TB/s'),
    div: term('div', 930, '÷', 'ink'),
    bpt: term('bpt', 1130, 'bytes per token', 'bytes', [{ t: '140 GB' }, { t: ' per token' }]),
  };
  // where '140 GB' and 'per token' sit inside the centred '140 GB per token'
  const wAll = W('140 GB per token'), wGB = W('140 GB'), wPT = W('per token');
  T.bpt.anchors = { gb: 1130 - wAll / 2 + wGB / 2, perToken: 1130 + wAll / 2 - wPT / 2 };

  // ------------------------------------------------------------------ the result box
  const R = { l: 1330, r: 1630, h: 64 };
  const rg = S.g(null, g);
  S.rect({ x: R.l, y: y - R.h / 2, w: R.r - R.l, h: R.h, r: 16, fill: '#0c1326' }, rg);
  const rbg = S.rect({ x: R.l, y: y - R.h / 2, w: R.r - R.l, h: R.h, r: 16, stroke: 'ink', sw: 2.5, strokeOpacity: 0.9 }, rg);
  const rlabel = S.text(o.result ?? '≈ 24 tokens/s', { x: (R.l + R.r) / 2, y: y + 1, size, weight: 650, anchor: 'middle', color: 'ink' }, rg);
  g.result = { g: rg, bg: rbg, label: rlabel, l: R.l, r: R.r, cx: (R.l + R.r) / 2 };
  if (hidden) hide(rg);

  // ------------------------------------------------------------------ the three condition chips
  const names = o.chips || ['this chip', '16-bit weights', 'one token per read'];
  const cxs = [790, 1020, 1290];
  const targets = [[790, y + size * 0.62], [T.bpt.anchors.gb, y + size * 0.62], [T.bpt.anchors.perToken, y + size * 0.62]];
  g.chips = names.map((txt, i) => {
    const cg = S.g(null, g);
    const w = S.measure(txt, { size: chipSize, weight: 550 }) + 32, cx = cxs[i];
    const c = { g: cg, cx, w, l: cx - w / 2, r: cx + w / 2, t: chipY - chipH / 2, b: chipY + chipH / 2, target: targets[i] };
    c.line = S.line({ x1: cx, y1: c.t - 2, x2: targets[i][0], y2: targets[i][1], stroke: 'faint', sw: 2 }, cg);
    c.base = S.rect({ x: c.l, y: c.t, w, h: chipH, r: chipH / 2, fill: '#0c1326' }, cg);
    c.bg = S.rect({ x: c.l, y: c.t, w, h: chipH, r: chipH / 2, stroke: 'muted', sw: 2, strokeOpacity: 0.7 }, cg);
    c.label = S.text(txt, { x: cx, y: chipY + 1, size: chipSize, weight: 550, anchor: 'middle', color: 'muted' }, cg);
    if (hidden) [c.line, c.base, c.bg, c.label].forEach(hide);
    return c;
  });
  // a soft white halo behind the equation, for .glow()
  g.halo = S.rect({ x: 145, y: y - 46, w: 1515, h: 92, r: 46, fill: '#ffffff', fillOpacity: 0.10, filter: 'url(#soft)' }, g);
  g.insertBefore(g.halo, g.firstChild);
  g.halo.setAttribute('data-audit', 'ignore');
  hide(g.halo);
  Object.assign(g, { y, chipY, size });

  // ------------------------------------------------------------------ helpers
  g.enter = (name, a = {}) => fx.in(T[name].g, { from: a.from || 'up', d: a.d ?? 0.55, dist: 24 });
  g.morph = (name, a = {}) => {
    const t = T[name], d = a.d ?? 0.5, tl = gsap.timeline();
    tl.fromTo(t.sym, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -14, duration: d * 0.45, ease: 'power2.in' }, 0);
    tl.fromTo(t.num, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: d * 0.55, ease: 'power2.out' }, d * 0.45);
    return tl;
  };
  g.showResult = (a = {}) => {
    const d = a.d ?? 0.7, tl = gsap.timeline();
    tl.set(rg, { autoAlpha: 1 }, 0);
    tl.fromTo(rg.firstChild, { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.4 }, 0);
    tl.fromTo(rbg, { drawSVG: '0%' }, { drawSVG: '100%', duration: d, ease: 'power2.inOut' }, 0);
    tl.fromTo(rlabel, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: d * 0.6, ease: 'power3.out' }, d * 0.4);
    return tl;
  };
  g.showChip = (i, a = {}) => {
    const c = g.chips[i], d = a.d ?? 0.5, tl = gsap.timeline();
    tl.fromTo([c.base, c.bg, c.label], { autoAlpha: 0, scale: 0.7, transformOrigin: `${c.cx}px ${chipY}px` },
      { autoAlpha: 1, scale: 1, duration: d, ease: 'back.out(2)', transformOrigin: `${c.cx}px ${chipY}px` }, 0);
    tl.fromTo(c.line, { autoAlpha: 1, drawSVG: '0%' }, { autoAlpha: 1, drawSVG: '100%', duration: d * 0.8, ease: 'power2.out' }, d * 0.4);
    return tl;
  };
  g.tintChip = (i, tone = 'helps', a = {}) => {
    const c = g.chips[i], d = a.d ?? 0.5, col = S.tone(tone);
    const tl = gsap.timeline();
    tl.to(c.line, { attr: { stroke: col }, duration: d }, 0);
    tl.to(c.bg, { attr: { stroke: col, 'stroke-opacity': 0.9 }, duration: d }, 0);
    tl.to(c.label, { attr: { fill: col }, duration: d }, 0);
    return tl;
  };
  g.glow = (a = {}) => {
    const d = a.d ?? 0.9, parts = [T.rate.g, T.eq.g, T.bw.g, T.div.g, T.bpt.g, rg];
    const tl = gsap.timeline();
    tl.fromTo(g.halo, { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.4, ease: 'power2.out' }, 0);
    tl.to(g.halo, { autoAlpha: 0, duration: d * 0.6, ease: 'power2.in' }, d * 0.4);
    tl.fromTo(parts, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.04, duration: d / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0);
    return tl;
  };
  g.slide = (dy = -45, a = {}) => {
    g.dy += dy;
    return fx.xform(g, { y: g.dy }, { d: a.d ?? 0.9, ease: a.ease || 'power2.inOut' });
  };
  return g;
}


/**
 * The scene kit: the small helpers every hand-built ch12 scene uses. const K = ch12Kit(S);
 *   K.T(spec) time of a cue; K.cl, K.lerp, K.E(name) ease fn, K.EIO
 *   K.clock(a, b, fn(t)) painter over [a, b]; K.whole(fn(t)) painter over the whole scene (runs fn(0) now)
 *   K.hide(els); K.setO(el, v); K.fade(els, a, b, at, d = 0.45, stagger = 0)  style opacity from progress
 *   K.ignore(els, at, d)  data-audit="ignore" while [at, at + d]
 *   K.pulse(el, at, peak, d)  attribute opacity 0 → peak → 0 (for flash rects created with opacity 0)
 *   K.track(el, keys, ox, oy) keyframed translate / scale (about ox, oy) / attribute opacity; keys from K.K(t, {x, y, s, o, e})
 *   K.draw(path, len, at, d)  a stroke drawing on (dash offset), seek-safe
 */
function ch12Kit(S) {
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = n => gsap.parseEase(n);
  const EIO = E('power2.inOut');
  const drive = (d, fn) => { const p = { v: 0 }; return gsap.fromTo(p, { v: 0 }, { v: 1, duration: Math.max(0.001, d), ease: 'none', immediateRender: false, onStart: () => fn(p.v), onUpdate: () => fn(p.v), onReverseComplete: () => fn(0) }); };
  const clock = (a, b, fn) => S.add(drive(b - a, k => fn(a + k * (b - a))), a);
  const whole = fn => { fn(0); clock(0, S.duration, fn); };
  const setO = (e, v) => { e.style.opacity = v; e.style.visibility = v > 0.001 ? 'inherit' : 'hidden'; };
  const hide = els => [].concat(els).filter(Boolean).forEach(e => setO(e, 0));
  const fade = (els, a, b, at, d = 0.45, stagger = 0) => [].concat(els).filter(Boolean).forEach((e, i) => S.add(drive(d, k => setO(e, lerp(a, b, E('power2.out')(k)))), at + i * stagger));
  const ignore = (els, at, d) => clock(at, at + d, t => [].concat(els).forEach(e => (t > at && t < at + d ? e.setAttribute('data-audit', 'ignore') : e.removeAttribute('data-audit'))));
  const pulse = (el, at, peak, d = 0.6) => S.add(gsap.fromTo(el, { attr: { opacity: 0 } }, { attr: { opacity: peak }, duration: d / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), at);
  const stateAt = (keys, t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, b] = keys[i];
      if (t < t1) {
        const [t0, a] = keys[i - 1], u = (b.e ? E(b.e) : EIO)(cl((t - t0) / (t1 - t0))), o = {};
        for (const k of Object.keys(b)) if (k !== 'e' && typeof b[k] === 'number') o[k] = lerp(a[k] ?? b[k], b[k], u);
        return { ...a, ...o };
      }
    }
    return keys[keys.length - 1][1];
  };
  const track = (el, keys, ox = 0, oy = 0) => whole(t => {
    const st = stateAt(keys, t), s = st.s ?? 1, o = st.o ?? 1;
    el.setAttribute('transform', `translate(${(ox + (st.x ?? 0)).toFixed(1)},${(oy + (st.y ?? 0)).toFixed(1)}) scale(${s.toFixed(4)}) translate(${-ox},${-oy})`);
    el.setAttribute('opacity', o.toFixed(3));
    el.style.visibility = o > 0.002 ? 'inherit' : 'hidden';
  });
  const draw = (p, len, at, d) => { p.setAttribute('stroke-dasharray', `${len} ${len}`); whole(t => p.setAttribute('stroke-dashoffset', (len * (1 - EIO(cl((t - at) / d)))).toFixed(1))); };
  return { T, cl, lerp, E, EIO, drive, clock, whole, setO, hide, fade, ignore, pulse, stateAt, track, K: (t, st) => [t, st], draw };
}
