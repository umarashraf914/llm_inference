/* Shared builders for chapter 11, "Arithmetic intensity and the roofline". Loaded before every ch11 scene.

   Visual language (keep it in every scene):
   - amber (compute) arithmetic: operations, the flat 'peak arithmetic' ceiling, sparks.
   - coral (bytes)   memory: bytes, bandwidth, the slanted ceiling, byte particles.
   - white           the bottleneck and the ridge (never coral); blue for tokens and plain structure.
   - Charts are log-log with equal px per factor of ten on both axes, so a slope of one is drawn at 45 degrees.
   Everything is seek-safe: opacity and geometry are written from tween progress, never toggled by callbacks. */

/**
 * The scene kit: the small helpers every ch10 scene uses. const K = ch11Kit(S);
 *   K.T(spec) time of a cue; K.cl, K.lerp, K.E(name) ease fn, K.EIO
 *   K.clock(a, b, fn(t)) painter over [a, b]; K.whole(fn(t)) painter over the whole scene (runs fn(0) now)
 *   K.hide(els); K.setO(el, v); K.fade(els, a, b, at, d = 0.45, stagger = 0)  style opacity from progress
 *   K.ignore(els, at, d)  data-audit="ignore" while [at, at + d]
 *   K.pulse(el, at, peak, d)  attribute opacity 0 → peak → 0 (for flash rects created with opacity 0)
 *   K.track(el, keys, ox, oy) keyframed translate / scale (about ox, oy) / attribute opacity; keys from K.K(t, {x, y, s, o, e})
 *   K.draw(path, len, at, d)  a stroke drawing on (dash offset), seek-safe
 */
function ch11Kit(S) {
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
 * The roofline's log-log frame: equal px per factor of ten on both axes, so a bandwidth line is at 45 degrees.
 * o: {x0 320, y0 900 (intensity 1, 1 trillion ops/s), ppd 250, xDec 4 (ticks 1 … 10,000), yDec 2 (labels 1 … 100),
 *     yTop 150 (top of the vertical axis), peak 989, bw 3.35, tickSize 24, titleSize 26, titles true}
 * Returns <g> with .axes, .xTicks, .yTicks (groups, one child per tick), .xTitle, .yTitle (rotated), and geometry:
 *   .X(intensity) .Y(trillion ops/s) .ridgeI (= peak / bw) .ridge [x, y] .flatD .slantD (path data for the two ceilings)
 */
function ch11Roof(S, o = {}, parent) {
  const x0 = o.x0 ?? 320, y0 = o.y0 ?? 900, ppd = o.ppd ?? 250, xDec = o.xDec ?? 4, yDec = o.yDec ?? 2;
  const xEnd = x0 + xDec * ppd, yTop = o.yTop ?? 150, ts = o.tickSize ?? 24, tt = o.titleSize ?? 26;
  const X = v => x0 + Math.log10(v) * ppd, Y = v => y0 - Math.log10(v) * ppd;
  const g = S.g(null, parent);
  g.axes = S.path({ d: `M${x0},${yTop} V${y0} H${xEnd}`, stroke: 'white', strokeOpacity: 0.55, sw: 2.5 }, g);
  g.xTicks = S.g(null, g);
  g.yTicks = S.g(null, g);
  for (let k = 0; k <= xDec; k++) {
    const t = S.g(null, g.xTicks), v = 10 ** k;
    S.path({ d: `M${X(v)},${y0} V${y0 + 10}`, stroke: 'white', strokeOpacity: 0.55, sw: 2 }, t);
    if (ts) S.text(v.toLocaleString('en-US'), { x: X(v), y: y0 + 32, size: ts, weight: 600, family: 'mono', anchor: 'middle', color: 'muted' }, t);
  }
  for (let k = 0; k <= yDec; k++) {
    const t = S.g(null, g.yTicks), v = 10 ** k;
    S.path({ d: `M${x0 - 10},${Y(v)} H${x0}`, stroke: 'white', strokeOpacity: 0.55, sw: 2 }, t);
    if (ts) S.text(v.toLocaleString('en-US'), { x: x0 - 18, y: Y(v), size: ts, weight: 600, family: 'mono', anchor: 'end', color: 'muted' }, t);
  }
  if (o.titles !== false) {
    g.xTitle = S.text([{ t: 'operations', c: 'compute' }, { t: ' per ', c: 'ink' }, { t: 'byte', c: 'bytes' }, { t: ' (log)', c: 'muted' }], { x: (x0 + xEnd) / 2, y: y0 + 74, size: tt, weight: 700, anchor: 'middle' }, g);
    const ym = (y0 + yTop) / 2, yx = x0 - 96;
    g.yTitle = S.text('trillion operations per second (log)', { x: yx, y: ym, size: tt, weight: 700, anchor: 'middle', color: 'compute' }, g);
    g.yTitle.setAttribute('transform', `rotate(-90 ${yx} ${ym})`);
  }
  const peak = o.peak ?? 989, bw = o.bw ?? 3.35, ridgeI = peak / bw;
  Object.assign(g, { X, Y, x0, y0, ppd, xEnd, yTop, peak, bw, ridgeI, ridge: [X(ridgeI), Y(peak)] });
  g.flatD = `M${x0},${Y(peak).toFixed(1)} H${xEnd}`;
  g.slantD = `M${x0},${Y(bw).toFixed(1)} L${X(ridgeI).toFixed(1)},${Y(peak).toFixed(1)}`;
  return g;
}
