/* Shared builders for chapter 10, "Two phases with opposite profiles". Loaded before every ch10 scene.

   Visual language (keep it in every scene):
   - blue (struct)   tokens and the model's layers; weights at rest.
   - amber (compute) arithmetic: a slab or tile flashing while it works, operation counts.
   - coral (bytes)   weights as bytes being moved: loads, the 140 GB, the bus.
   - teal (helps)    what helps: sharing a load across many tokens.
   - Prompt tokens are solid blue pills 't1'…; answer tokens are blue pills with a white outline; grey pills
     for 'stop'. The model is a compact stack of thin blue slabs standing for its 80 layers.
   Everything here is seek-safe: opacity and geometry are written from tween progress (painters), never
   toggled by callbacks. */

/**
 * The scene kit: the small helpers every ch10 scene uses. const K = ch10Kit(S);
 *   K.T(spec) time of a cue; K.cl, K.lerp, K.E(name) ease fn, K.EIO
 *   K.clock(a, b, fn(t)) painter over [a, b]; K.whole(fn(t)) painter over the whole scene (runs fn(0) now)
 *   K.hide(els); K.setO(el, v); K.fade(els, a, b, at, d = 0.45, stagger = 0)  style opacity from progress
 *   K.ignore(els, at, d)  data-audit="ignore" while [at, at + d]
 *   K.pulse(el, at, peak, d)  attribute opacity 0 → peak → 0 (for flash rects created with opacity 0)
 *   K.track(el, keys, ox, oy) keyframed translate / scale (about ox, oy) / attribute opacity; keys from K.K(t, {x, y, s, o, e})
 *   K.draw(path, len, at, d)  a stroke drawing on (dash offset), seek-safe
 */
function ch10Kit(S) {
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

/**
 * A token pill. o: {text, x, y (centre), kind 'prompt' | 'answer' | 'stop' | 'slot', size 24, h 44, w (auto)}.
 * Returns <g> with .bg .label .hi (a white overlay, opacity 0: brighten it to show 'updated') and .w .h .cx .cy.
 */
function ch10Pill(S, o = {}, parent) {
  const g = S.g(null, parent);
  const size = o.size ?? 24, h = o.h ?? 44, kind = o.kind || 'prompt';
  const w = o.w ?? Math.max(h * 1.6, S.measure(o.text, { size, weight: 650 }) + 30);
  const x = o.x - w / 2, y = o.y - h / 2, r = h / 2;
  const st = {
    prompt: { fill: 'url(#solid-struct)', stroke: 'none', text: '#0a0f1e' },
    answer: { fill: 'url(#card-struct)', stroke: 'white', text: 'ink' },
    stop: { fill: 'url(#card-neutral)', stroke: 'muted', text: 'muted' },
    slot: { fill: 'none', stroke: 'struct', text: 'muted', dash: '6 6' },
  }[kind];
  if (kind !== 'prompt' && kind !== 'slot') S.rect({ x, y, w, h, r, fill: '#0c1326' }, g);
  g.bg = S.rect({ x, y, w, h, r, fill: st.fill, stroke: st.stroke, sw: kind === 'answer' ? 2.5 : 2, dash: st.dash }, g);
  g.hi = S.rect({ x, y, w, h, r, fill: 'white', opacity: 0 }, g);
  g.hi.setAttribute('data-audit', 'ignore');
  g.label = S.text(o.text, { x: o.x, y: o.y + 1, size, weight: 700, anchor: 'middle', color: st.text }, g);
  Object.assign(g, { w, h, cx: o.x, cy: o.y, l: x, r: x + w, t: y, b: y + h });
  return g;
}

/**
 * The model as a compact stack of thin blue slabs (standing for its 80 layers).
 * o: {x (left), y (bottom edge of the lowest slab), w 280, n 10, pitch 20, th 10}.
 * Returns <g> with .slabs[] (each <rect>, with .flash: an amber overlay, opacity 0), .slabY(i) centre y of slab i,
 *   .top / .bot (y of the stack's top and bottom edge), .x .w .cx, and
 *   .front(t0, d, K)   flashes each slab as a front passes it, bottom to top, over d s from t0 (K = ch10Kit).
 */
function ch10Stack(S, o = {}, parent) {
  const g = S.g(null, parent);
  const x = o.x ?? 1360, w = o.w ?? 280, n = o.n ?? 10, pitch = o.pitch ?? 20, th = o.th ?? 10, y0 = o.y ?? 560;
  g.slabY = i => y0 - th / 2 - i * pitch;
  g.slabs = Array.from({ length: n }, (_, i) => {
    const r = S.rect({ x, y: g.slabY(i) - th / 2, w, h: th, r: 3, fill: 'struct', fillOpacity: 0.6 }, g);
    r.flash = S.rect({ x: x - 3, y: g.slabY(i) - th / 2 - 3, w: w + 6, h: th + 6, r: 4, fill: 'compute', opacity: 0 }, g);
    r.flash.setAttribute('data-audit', 'ignore');
    return r;
  });
  g.setAttribute('data-audit', 'ignore');
  Object.assign(g, { x, w, cx: x + w / 2, n, pitch, top: g.slabY(n - 1) - th / 2, bot: y0 });
  g.front = (t0, d, K) => g.slabs.forEach((s, i) => K.pulse(s.flash, t0 + d * (i + 0.5) / n - 0.12, 0.9, 0.34));
  return g;
}
