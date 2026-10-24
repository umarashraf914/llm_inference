/* video/lib/kit.js — shared film library: the seek-safe scene kit (painters, fades, tracks, dash draws). */

/**
 * The scene kit: the small seek-safe helpers the hand-built scenes use. const K = libKit(S);
 *   K.T(spec) time of a cue; K.cl, K.lerp, K.E(name) ease fn, K.EIO
 *   K.clock(a, b, fn(t)) painter over [a, b]; K.whole(fn(t)) painter over the whole scene (runs fn(0) now)
 *   K.hide(els); K.setO(el, v); K.fade(els, a, b, at, d = 0.45, stagger = 0)  style opacity from progress
 *   K.ignore(els, at, d)  data-audit="ignore" while [at, at + d]
 *   K.pulse(el, at, peak, d)  attribute opacity 0 → peak → 0 (for flash rects created with opacity 0)
 *   K.track(el, keys, ox, oy) keyframed translate / scale (about ox, oy) / attribute opacity; keys from K.K(t, {x, y, s, o, e});
 *     a key keeps every value an earlier key set unless it sets its own
 *   K.draw(path, len, at, d)  a stroke drawing on (dash offset), seek-safe
 */
function libKit(S) {
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
  // each key carries every value set by an earlier key unless it sets its own (an ease applies to its own leg only)
  const carry = keys => { let acc = {}; return keys.map(([t, st]) => { const { e, ...v } = st; acc = { ...acc, ...v }; return [t, e ? { ...acc, e } : { ...acc }]; }); };
  const track = (el, keys0, ox = 0, oy = 0) => { const keys = carry(keys0); whole(t => {
    const st = stateAt(keys, t), s = st.s ?? 1, o = st.o ?? 1;
    el.setAttribute('transform', `translate(${(ox + (st.x ?? 0)).toFixed(1)},${(oy + (st.y ?? 0)).toFixed(1)}) scale(${s.toFixed(4)}) translate(${-ox},${-oy})`);
    el.setAttribute('opacity', o.toFixed(3));
    el.style.visibility = o > 0.002 ? 'inherit' : 'hidden';
  }); };
  const draw = (p, len, at, d) => { p.setAttribute('stroke-dasharray', `${len} ${len}`); whole(t => p.setAttribute('stroke-dashoffset', (len * (1 - EIO(cl((t - at) / d)))).toFixed(1))); };
  return { T, cl, lerp, E, EIO, drive, clock, whole, setO, hide, fade, ignore, pulse, stateAt, track, K: (t, st) => [t, st], draw };
}
