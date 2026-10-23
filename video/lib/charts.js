/* video/lib/charts.js — shared film library: charts.
 *
 *   libRoofline       the roofline: log-log axes, the bandwidth slope (coral) and the compute ceiling
 *                     (amber), the ridge, the two regions, workload points that drop onto the roof and
 *                     slide along it with a live readout, probes, brackets, a second chip's roof
 *   libScaleCompare   quantities drawn to one scale when they differ enormously (140 GB vs 0.12 GB,
 *                     30 ms vs 0.1 ms): rows, or a sliver inside a whole; a magnifier (round lens or
 *                     rectangular inset) for the tiny one; copies that tile the whole; a log-scale morph
 *   libGrowthCurve    curves on axes that rescale live: linear vs quadratic by default, or any f(x);
 *                     progressive drawing, labelled points, gap arrows, dashed extensions, a per-step strip
 *
 * Conventions (all three):
 * - Build with S primitives into `parent` (default S.main). Each returns its root <g> with named handles.
 * - Helpers RETURN tweens or timelines; place them with S.add(tween, at). Nothing here adds to S.tl,
 *   reads the clock or uses Math.random (S.rand(seed) only), so every frame is the same however reached.
 * - Helpers that change the same thing over time keep a plan (like fx.xform): call them in time order.
 * - Visible as built, except parts documented as hidden (the roofline's region tints, ridge marker, …,
 *   and every magnifier, which starts closed). An entrance helper (.in, .draw, .drop …) hides its target
 *   from the start of the scene until it plays, exactly like fx.in / fx.draw.
 * - Coordinates are in the parent's space. To move or scale a whole chart, wrap it in a holder S.g()
 *   and S.xset / fx.xform the holder, never the chart root with raw GSAP x/y/scale.
 * - Colour = meaning: amber compute (the ceiling, operations, the quadratic work), coral bytes (the
 *   bandwidth slope, memory traffic), teal helps (a saving, linear growth), blue struct (neutral data),
 *   white for the ridge, probes and brackets, grey for axes and schematic notes. Text ≥ 24 px.
 */

/* ------------------------------------------------------------------ private helpers */
var _libChart = (function () {
  let uidN = 0;
  const uid = p => `lc-${p}-${++uidN}`;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const r2 = v => Math.round(v * 100) / 100;
  const L10 = Math.log10;
  const GRAD = ['compute', 'bytes', 'helps', 'struct', 'violet', 'neutral'];
  const BASE = '#0c1326', DARK = '#0a0f1e';

  /** 3 significant figures, comma-grouped: 3.35, 33.5, 335, 989, 3,350, 0.339 */
  function sig(v, n = 3) {
    if (!isFinite(v)) return '∞';
    if (v === 0) return '0';
    const r = Number(Number(v).toPrecision(n));
    const e = Math.floor(L10(Math.abs(r)));
    const dec = Math.max(0, n - 1 - e);
    return r.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  /** a tick number: integers comma-grouped, decimals trimmed */
  function num(v) {
    if (Math.abs(v - Math.round(v)) < 1e-9) return Math.round(v).toLocaleString('en-US');
    return Number(Number(v).toPrecision(4)).toLocaleString('en-US', { maximumFractionDigits: 3 });
  }
  /** compact tick number: 10,000 · 250k · 2.5M · 10B */
  function compact(v) {
    const a = Math.abs(v);
    const t = (x, s) => Number(x.toPrecision(3)).toLocaleString('en-US', { maximumFractionDigits: 1 }) + s;
    if (a >= 1e9) return t(v / 1e9, 'B');
    if (a >= 1e6) return t(v / 1e6, 'M');
    if (a >= 1e5) return t(v / 1e3, 'k');
    return num(v);
  }
  /** a value tween on a proxy that re-renders through `apply`, seek-safe in both directions */
  function drive(from, to, apply, o = {}) {
    const p = { v: from };
    const go = () => apply(p.v);
    return gsap.fromTo(p, { v: from }, {
      v: to, duration: o.d ?? 1, ease: o.ease || 'power2.inOut', immediateRender: false,
      onStart: go, onUpdate: go, onReverseComplete: () => apply(from),
    });
  }
  /** hidden at build (an entrance helper fades it in with autoAlpha) */
  function hide(el) { if (el) { el.style.visibility = 'hidden'; el.style.opacity = '0'; } return el; }
  const list = x => (Array.isArray(x) ? x : [x]).filter(Boolean);
  function fadeIn(els, o = {}) {
    return gsap.fromTo(list(els), { autoAlpha: 0 }, { autoAlpha: o.to ?? 1, duration: o.d ?? 0.5, ease: o.ease || 'power2.out', stagger: o.stagger ?? 0 });
  }
  function fadeOut(els, o = {}) {
    return gsap.to(list(els), { autoAlpha: 0, duration: o.d ?? 0.4, ease: o.ease || 'power2.in', stagger: o.stagger ?? 0 });
  }
  /** draw a stroke on (solid strokes only: drawSVG replaces a dash pattern) */
  function draw(els, o = {}) {
    const t = gsap.timeline(), L = list(els), stg = o.stagger ?? 0;
    L.forEach((e, i) => {
      t.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, i * stg);
      t.fromTo(e, { drawSVG: o.from || '0%' }, { drawSVG: o.to || '100%', duration: o.d ?? 0.8, ease: o.ease || 'power2.inOut' }, i * stg);
    });
    return t;
  }
  /** grow a (possibly dashed) <line> from its first end to its second, keeping the dash pattern */
  function growLine(ln, o = {}) {
    const x1 = +ln.getAttribute('x1'), y1 = +ln.getAttribute('y1'), x2 = +ln.getAttribute('x2'), y2 = +ln.getAttribute('y2');
    const set = f => { ln.setAttribute('x2', r2(x1 + (x2 - x1) * f)); ln.setAttribute('y2', r2(y1 + (y2 - y1) * f)); };
    const t = gsap.timeline();
    t.fromTo(ln, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0);
    t.add(drive(o.from ?? 0, 1, set, { d: o.d ?? 0.6, ease: o.ease || 'power2.out' }), 0);
    return t;
  }
  /** an open arrowhead at (x, y) pointing along (ux, uy) */
  function headD(x, y, ux, uy, s = 14) {
    return `M${r2(x - ux * s - uy * s * 0.6)},${r2(y - uy * s + ux * s * 0.6)} L${r2(x)},${r2(y)} L${r2(x - ux * s + uy * s * 0.6)},${r2(y - uy * s - ux * s * 0.6)}`;
  }
  /** solid fill for a tone */
  const solid = (S, tone) => (GRAD.includes(tone) ? `url(#solid-${tone})` : S.tone(tone));

  // ---- ticks that stay readable at any domain (labels never closer than minPx; extra ones fade in/out)
  function linTicks(min, max, len, minPx) {
    const span = max - min;
    if (!(span > 0) || !(len > 0)) return [];
    const pxPer = len / span;
    const steps = [];
    for (let k = Math.floor(L10(minPx / pxPer)) - 1; k <= Math.ceil(L10(span)) + 1; k++) steps.push(10 ** k, 5 * 10 ** k);
    steps.sort((a, b) => a - b);
    const opOf = s => clamp((s * pxPer - minPx) / (0.45 * minPx), 0, 1);
    const fine = steps.find(s => s * pxPer > minPx);
    if (!fine) return [];
    const i0 = Math.ceil(min / fine - 1e-9), i1 = Math.floor(max / fine + 1e-9);
    if (i1 - i0 > 400) return [];
    const out = [];
    for (let i = i0; i <= i1; i++) {
      const v = Number((i * fine).toPrecision(12));
      let op = opOf(fine);
      for (const s of steps) if (s > fine && Math.abs(v / s - Math.round(v / s)) < 1e-7) op = Math.max(op, opOf(s));
      if (Math.abs(v) < 1e-12) op = 1;
      out.push({ v, op });
    }
    return out;
  }
  function logTicks(min, max, len, minPx) {
    const l0 = L10(min), l1 = L10(max), dec = len / (l1 - l0);
    if (!(dec > 0)) return [];
    const ks = [1, 2, 4, 8, 16];
    const opOf = k => clamp((k * dec - minPx) / (0.45 * minPx), 0, 1);
    const fine = ks.find(k => k * dec > minPx) || 16;
    const out = [];
    for (let j = Math.ceil(l0 - 1e-9); j <= Math.floor(l1 + 1e-9); j++) {
      if (j % fine) continue;
      let op = opOf(fine);
      for (const k of ks) if (k > fine && j % k === 0) op = Math.max(op, opOf(k));
      out.push({ v: 10 ** j, op });
    }
    return out;
  }
  /** decades (and the 2..9 minor values) inside [min, max] */
  function decades(min, max) {
    const maj = [], min_ = [];
    for (let j = Math.floor(L10(min)); j <= Math.ceil(L10(max)); j++) {
      const d = 10 ** j;
      if (d >= min * 0.9999 && d <= max * 1.0001) maj.push(d);
      for (let m = 2; m <= 9; m++) { const v = m * d; if (v > min && v < max) min_.push(v); }
    }
    return { maj, min: min_ };
  }

  return { uid, clamp, lerp, smooth, r2, L10, GRAD, BASE, DARK, sig, num, compact, drive, hide, list, fadeIn, fadeOut, draw, growLine, headD, solid, linTicks, logTicks, decades };
})();


/**
 * libRoofline — the roofline chart: arithmetic intensity (operations per byte, log) across, attainable
 * speed (operations per second, log) up. Memory sets a slanted ceiling, bandwidth × intensity (coral);
 * arithmetic sets a flat one, the peak (amber); their corner is the ridge (peak ÷ bandwidth, 295 on an
 * H100). Below the roof a workload's point sits; left of the ridge it is memory bound, right compute bound.
 *
 * The defaults reproduce the ch11/ch12 storyboard geometry exactly: 250 px per decade on both axes,
 * intensity 1 at x 320, 1 trillion ops/s at y 900, the axes at x 260 / y 900, so the H100's ridge (295)
 * sits at (938, 151), decode (1 op/byte, 3.35) at (320, 769) and prefill (≈ 2,000) at (1145, 151).
 *
 * o: {x = 260, y = 110, w = 1100, h = 790      the plot box (axes along its left and bottom edges),
 *     xmin = 10^-0.24 (≈ 0.575), xmax = 10^4.16, ymin = 1, ymax = 10^3.16   the log domain,
 *     peak = 989                 flat ceiling, in the y unit (here trillion ops/s),
 *     bw = 3.35                  slope: y units per x unit (trillion bytes/s), so attainable = min(peak, bw × I),
 *     xticks, yticks             tick values; default every decade in the domain ([] for none),
 *     xfmt, yfmt                 tick label formats; default comma integers ('1,000'),
 *     minor = true               small 2..9 ticks on both axes, grid = true faint decade gridlines,
 *     xtitle = 'operations per byte (log)', ytitle = 'trillion operations per second (log)'   ('' for none),
 *     titleTones = ['muted', 'muted'], titleSize = 26, tickSize = 24,
 *     sw = 5                     roof stroke width,
 *     show = {roof: true, ceilings: false, regions: false, ridge: false, peakTag: false, slopeLabel: false}
 *                                which hidden-by-default parts start visible,
 *     regionLabels = ['memory bound', 'compute bound'], regionSize = 30,
 *     ridgeLabel = 'the ridge', ridgeTag = '295' (sig(peak ÷ bw)), peakTag = ['peak arithmetic', '989 trillion/s'],
 *     slopeLabel = 'bandwidth × intensity'}
 * Returns <g> with
 *   .axes .xticks[] .yticks[] .xtitle .ytitle .grid
 *   .flatL .flatR (the amber ceiling left / right of the ridge) .slopeL .slopeR (coral, right part dashed)
 *   .roof [slopeL, flatR] .glow {slope, flat} .tints {memory, compute} .regionLabels {memory, compute}
 *   .ridgeEl (.dot .ring .drop .label .tag) .peakTagEl .slopeLabelEl .marks (layer for points)
 *   and X(I) Y(P) I(x) P(y) attain(I) roofY(I), .ridgeI .ridgeX .ridgeY .peak .bw, .x .y .w .h .l .r .t .b
 * Helpers (return tweens/timelines):
 *   .in({d = 1.8})            axes, ticks and titles, then the roof (slope, then flat)
 *   .drawAxes({d = 0.8})      axes draw, ticks and titles fade in
 *   .drawFlat({d = 0.9})      the full-width flat ceiling, left to right
 *   .drawSlope({d = 0.8, to: 'ridge'|'top'})   the slope up to the corner (or on, dashed, to the clipped top)
 *   .drawRoof({d = 1.2})      slope then flat: the roof alone
 *   .extendSlope({d = 0.6})   the dashed slope past the corner, out of the clipped top (arrowhead)
 *   .traceRoof({d = 1.6, dim = 0.25})   a white tracer runs along the lower line; the roof brightens and
 *                             the parts that are not roof (flat left of the ridge, dashed slope) dim
 *   .glowRoof({d = 0.9, hold = false}) the roof thickens and glows (a pulse, or stays with hold)
 *   .showRegions({d = 0.6, which: 'both'|'memory'|'compute', labels = true})   tints and their labels
 *   .showRidge({d = 0.7, label = true, tag = true})   marker pops, dashed drop to the axis, label, axis tag
 *   .tagPeak({d}) .tagSlope({d})   the flat ceiling's two-line tag; the slope's parallel label
 *   .ghostSlope({factor = 2, dy, d = 0.6, hold = 0.5})   a ghost slope lifts parallel and settles back
 *   .point(I, po) → point handle (see below)        .probe(I, pr) → probe handle (see below)
 *   .bracket(I1, I2, {y, label, tone = 'ink', size = 28, tick = 12})  → <g> (.in() .out()): a bracket
 *                             between two intensities with its label above ('× 2,000')
 *   .addRoof({peak, bw, sw = 3, opacity = 1, label})  → <g> (.draw({d})): a second chip's roof
 *   .scatter({n = 10, seed = 7, tone = 'neutral', r = 8, onRoof = 0.25}) → <g> (.dots[], .in()): real
 *                             workloads, on the roof or below it, never above
 *   .arrowAlong(I1, I2, {tone = 'helps', off = 26, sw = 5}) → <g> (.draw({d})): an arrow riding just above
 *                             the roof from I1 to I2 ("move the decode point right")
 * Point handle  pt = R.point(I, {tone = 'auto' (coral left of the ridge, amber right), label, labelSide:
 *   'auto'|'right'|'left'|'above'|'below', readout = false | true | fmt, unit = '', r = 11, P (fixed y value:
 *   a point off the roof)})  → <g> with .dot .labelEl .readoutEl .x .y, and
 *     .in({d = 0.7, from: 'drop'|'pop'})   drops onto the roof (a ripple where it lands), label fades
 *     .moveTo(I2, {d = 1.6, ease})        slides along the roof (round the corner), the readout counting
 *     .guide('x'|'y', {tag, tone = 'ink'}) → <g> (.in()): a dotted line to that axis, tag beside the axis
 *     .out({d})
 * Probe handle  pb = R.probe(I, {tags = true, fmt = sig})  → <g> with .line .slopeMark .flatMark .slopeTag
 *   .flatTag .dot: a dashed vertical at intensity I meeting both ceilings (an arrow at the top when the
 *   slope's value is off the chart), each tagged with its value.
 *     .in({d = 0.9})   the line rises from the axis, each meeting marked as it passes
 *     .settle({d = 0.5})  a white dot settles on the lower ceiling, its tag glows, the other dims
 *     .out({d})
 * Example:
 *   const R = libRoofline(S);                                    // H100, storyboard geometry
 *   S.add(R.drawAxes(), 'b1'); S.add(R.drawFlat(), 'b1~flat'); S.add(R.drawSlope(), 'b2~slanted');
 *   S.add(R.showRidge(), 'b3~ridge'); S.add(R.showRegions(), 'b3~memory');
 *   const dec = R.point(1, { label: 'decode', readout: true });
 *   S.add(dec.in(), 'b4~Decode'); S.add(dec.moveTo(2000, { d: 2 }), 'b4~rightward');
 */
function libRoofline(S, o = {}, parent) {
  const C = _libChart, { L10 } = C;
  const g = S.g(null, parent);
  const x0 = o.x ?? 260, y0 = o.y ?? 110, w = o.w ?? 1100, h = o.h ?? 790;
  const xmin = o.xmin ?? 10 ** -0.24, xmax = o.xmax ?? 10 ** 4.16;
  const ymin = o.ymin ?? 1, ymax = o.ymax ?? 10 ** 3.16;
  const peak = o.peak ?? 989, bw = o.bw ?? 3.35, sw = o.sw ?? 5;
  const show = Object.assign({ roof: true, ceilings: false, regions: false, ridge: false, peakTag: false, slopeLabel: false }, o.show || {});
  const xb = y0 + h, xr = x0 + w;                       // axis lines: bottom y, right end

  // ---- scale: built on S.chart (log-log); its own 22 px labels are replaced by 24 px ones below
  const defs = S.el('defs', null, g);
  const gridG = S.g(null, g);
  const tintG = S.g(null, g);
  const chart = S.chart({ x: x0, y: y0, w, h, xmin, xmax, ymin, ymax, xlog: true, ylog: true, xticks: [], yticks: [], grid: false }, g);
  const X = chart.X, Y = chart.Y;
  const Iof = px => 10 ** (L10(xmin) + (px - x0) / w * (L10(xmax) - L10(xmin)));
  const Pof = py => 10 ** (L10(ymin) + (xb - py) / h * (L10(ymax) - L10(ymin)));
  const attain = I => Math.min(peak, bw * I);
  const roofY = I => Y(attain(I));
  const ridgeI = peak / bw, rx = X(ridgeI), ry = Y(peak);
  const decX = w / (L10(xmax) - L10(xmin)), decY = h / (L10(ymax) - L10(ymin));
  if (ridgeI <= xmin || ridgeI >= xmax) S.warn(`libRoofline: ridge ${C.sig(ridgeI)} is outside the x domain`);
  if (peak >= ymax) S.warn('libRoofline: peak is above ymax; the flat ceiling is clipped');

  // ---- axes: lines (from S.chart), ticks, minor ticks, gridlines, titles
  g.axes = chart.axes;
  const axisLines = [...chart.axes.querySelectorAll('line')];
  const tickG = S.g(null, chart.axes);
  const tsz = o.tickSize ?? 24;
  const xd = C.decades(xmin, xmax), yd = C.decades(ymin, ymax);
  const xt = o.xticks ?? xd.maj, yt = o.yticks ?? yd.maj;
  const xfmt = o.xfmt || C.num, yfmt = o.yfmt || C.num;
  g.grid = gridG;
  if (o.grid !== false) {
    xt.forEach(v => S.line({ x1: X(v), y1: y0, x2: X(v), y2: xb, stroke: '#ffffff', strokeOpacity: 0.06, sw: 1.5 }, gridG));
    yt.forEach(v => S.line({ x1: x0, y1: Y(v), x2: xr, y2: Y(v), stroke: '#ffffff', strokeOpacity: 0.06, sw: 1.5 }, gridG));
  }
  if (o.minor !== false) {
    xd.min.forEach(v => S.line({ x1: X(v), y1: xb, x2: X(v), y2: xb + 6, stroke: 'faint', sw: 1.5, strokeOpacity: 0.7 }, tickG));
    yd.min.forEach(v => S.line({ x1: x0 - 6, y1: Y(v), x2: x0, y2: Y(v), stroke: 'faint', sw: 1.5, strokeOpacity: 0.7 }, tickG));
  }
  xt.forEach(v => S.line({ x1: X(v), y1: xb, x2: X(v), y2: xb + 11, stroke: 'faint', sw: 2 }, tickG));
  yt.forEach(v => S.line({ x1: x0 - 11, y1: Y(v), x2: x0, y2: Y(v), stroke: 'faint', sw: 2 }, tickG));
  g.xticks = xt.map(v => S.text(xfmt(v), { x: X(v), y: xb + 36, size: tsz, anchor: 'middle', color: 'muted', family: 'mono' }, chart.axes));
  g.yticks = yt.map(v => S.text(yfmt(v), { x: x0 - 20, y: Y(v), size: tsz, anchor: 'end', color: 'muted', family: 'mono' }, chart.axes));
  g.xticks.forEach((t, i) => { t.__v = xt[i]; });
  const tsize = o.titleSize ?? 26, tt = o.titleTones || ['muted', 'muted'];
  const xtitle = o.xtitle ?? 'operations per byte (log)', ytitle = o.ytitle ?? 'trillion operations per second (log)';
  if (xtitle) g.xtitle = S.text(xtitle, { x: x0 + w / 2, y: xb + 80, size: tsize, anchor: 'middle', color: tt[0], weight: 500, maxW: w }, chart.axes);
  if (ytitle) {
    const yw = Math.max(0, ...yt.map(v => S.measure(yfmt(v), { size: tsz, family: 'mono' })));
    g.ytitle = S.text(ytitle, { x: 0, y: 0, size: tsize, anchor: 'middle', color: tt[1], weight: 500, maxW: h }, chart.axes);
    g.ytitle.setAttribute('transform', `translate(${C.r2(x0 - 20 - yw - 22 - tsize / 2)},${C.r2(y0 + h / 2)}) rotate(-90)`);
  }

  // ---- the plot (clipped to the box): ceilings, roof, ghost and probe lines
  const clipId = C.uid('roofclip');
  const cp = S.el('clipPath', { id: clipId }, defs);
  S.rect({ x: x0 - 1, y: y0, w: w + 2, h: h + 1 }, cp).setAttribute('fill', '#fff');
  const plot = S.g({ 'clip-path': `url(#${clipId})` }, g);
  const ghostG = S.g(null, plot);
  // slope from where it enters the box (left edge or bottom) to the ridge; on to where it leaves the box
  const sI0 = Math.max(xmin, ymin / bw), sI1 = Math.min(xmax, ymax / bw);
  const pS0 = [X(sI0), Y(bw * sI0)], pS1 = [X(sI1), Y(bw * sI1)];
  const P = (x, y) => `${C.r2(x)},${C.r2(y)}`;
  g.flatL = S.path({ d: `M${P(x0, ry)} L${P(rx, ry)}`, stroke: 'compute', sw: sw - 1 }, plot);
  g.flatR = S.path({ d: `M${P(rx, ry)} L${P(xr, ry)}`, stroke: 'compute', sw }, plot);
  g.slopeL = S.path({ d: `M${P(...pS0)} L${P(rx, ry)}`, stroke: 'bytes', sw }, plot);
  g.slopeR = S.line({ x1: rx, y1: ry, x2: pS1[0], y2: pS1[1], stroke: 'bytes', sw: sw - 1, dash: '10 9', cap: 'butt' }, plot);
  const exitTop = pS1[1] <= y0 + 0.5;
  const u = [(pS1[0] - rx), (pS1[1] - ry)], ul = Math.hypot(...u) || 1;
  g.slopeHead = S.path({ d: C.headD(pS1[0], pS1[1] + (exitTop ? 2 : 0), u[0] / ul, u[1] / ul, 16), stroke: 'bytes', sw: sw - 1 }, g);
  g.roof = [g.slopeL, g.flatR];
  const roofD = `M${P(...pS0)} L${P(rx, ry)} L${P(xr, ry)}`;
  const roofPath = S.path({ d: roofD, stroke: 'none' }, g);
  // glow overlays (shown by traceRoof / glowRoof)
  g.glow = {
    slope: S.path({ d: `M${P(...pS0)} L${P(rx, ry)}`, stroke: 'bytes', sw: sw + 2, filter: 'url(#glow-bytes)' }, g),
    flat: S.path({ d: `M${P(rx, ry)} L${P(xr, ry)}`, stroke: 'compute', sw: sw + 2, filter: 'url(#glow-compute)' }, g),
  };
  C.hide(g.glow.slope); C.hide(g.glow.flat);
  if (!show.ceilings) { C.hide(g.flatL); C.hide(g.slopeR); C.hide(g.slopeHead); }
  if (!show.roof) { C.hide(g.slopeL); C.hide(g.flatR); }

  // ---- region tints (a soft vertical gradient under each part of the roof) and their labels
  const tintGrad = (tone) => {
    const id = C.uid('tint');
    const lg = S.el('linearGradient', { id, x1: 0, y1: ry, x2: 0, y2: xb, gradientUnits: 'userSpaceOnUse' }, defs);
    S.el('stop', { offset: 0, 'stop-color': S.tone(tone), 'stop-opacity': 0.17 }, lg);
    S.el('stop', { offset: 1, 'stop-color': S.tone(tone), 'stop-opacity': 0.05 }, lg);
    return `url(#${id})`;
  };
  const memD = `M${P(pS0[0], xb)} L${P(...pS0)} L${P(rx, ry)} L${P(rx, xb)} Z`;
  const cmpD = `M${P(rx, xb)} L${P(rx, ry)} L${P(xr, ry)} L${P(xr, xb)} Z`;
  g.tints = { memory: S.path({ d: memD, fill: tintGrad('bytes') }, tintG), compute: S.path({ d: cmpD, fill: tintGrad('compute') }, tintG) };
  const rl = o.regionLabels || ['memory bound', 'compute bound'], rsz = o.regionSize ?? 30;
  const ly = xb - Math.min(100, h * 0.13);
  g.regionLabels = {
    memory: S.text(rl[0], { x: (x0 + rx) / 2, y: ly, size: rsz, anchor: 'middle', color: 'bytes', weight: 600 }, g),
    compute: S.text(rl[1], { x: (rx + xr) / 2, y: ly, size: rsz, anchor: 'middle', color: 'compute', weight: 600 }, g),
  };
  { // the memory label must sit under the slope
    const lw = S.measure(rl[0], { size: rsz, weight: 600 });
    const right = (x0 + rx) / 2 + lw / 2;
    if (right > rx - 8 || Y(bw * Iof(right)) > ly - rsz * 0.7 - 10) S.warn(`libRoofline: region label '${rl[0]}' does not fit under the slope; pass regionLabels or a bigger box`);
  }
  if (!show.regions) { C.hide(g.tints.memory); C.hide(g.tints.compute); C.hide(g.regionLabels.memory); C.hide(g.regionLabels.compute); }

  // ---- the ridge marker, the peak tag, the slope label
  const ridge = S.g(null, g);
  const dropWrap = S.g(null, ridge);
  ridge.drop = S.line({ x1: rx, y1: ry + 16, x2: rx, y2: xb, stroke: 'ink', sw: 2, dash: '6 8', strokeOpacity: 0.6, cap: 'butt' }, dropWrap);
  const dropDim = new Map();          // point → how much its label covers the drop line (0..1)
  const applyDrop = () => { let k = 0; for (const v of dropDim.values()) k = Math.max(k, v); dropWrap.setAttribute('opacity', C.r2(1 - 0.85 * k)); };
  ridge.ring = S.circle({ x: rx, y: ry, r: 18, stroke: 'ink', sw: 2, strokeOpacity: 0.55 }, ridge);
  ridge.dot = S.circle({ x: rx, y: ry, r: 9, fill: 'ink', stroke: C.DARK, sw: 2 }, ridge);
  const rla = o.ridgeLabelAt || [18, 104];
  ridge.label = S.text(o.ridgeLabel ?? 'the ridge', { x: rx + rla[0], y: ry + rla[1], size: 28, weight: 600, color: 'ink' }, ridge);
  const rtag = String(o.ridgeTag ?? C.sig(ridgeI));
  const rtw = S.measure(rtag, { size: tsz, family: 'mono', weight: 600 }) + 22;
  ridge.tagBg = S.rect({ x: rx - rtw / 2, y: xb + 36 - 19, w: rtw, h: 38, r: 10, fill: C.BASE, stroke: '#ffffff', strokeOpacity: 0.45, sw: 1.5 }, ridge);
  ridge.tag = S.text(rtag, { x: rx, y: xb + 37, size: tsz, anchor: 'middle', family: 'mono', weight: 600, color: 'ink' }, ridge);
  g.ridgeEl = ridge;
  // x tick labels too close to the ridge's axis tag (they step aside whenever the tag shows)
  const tagHits = g.xticks.filter(e => Math.abs(X(e.__v) - rx) < rtw / 2 + 14 + S.measure(e.textContent, { size: tsz, family: 'mono' }) / 2);
  if (!show.ridge) C.hide(ridge);
  else tagHits.forEach(C.hide);
  const ptag = o.peakTag || ['peak arithmetic', `${C.sig(peak)} trillion/s`];
  g.peakTagEl = S.g(null, g);
  ptag.forEach((t, i) => S.text(t, { x: xr - 18, y: ry + 40 + i * 34, size: 26, anchor: 'end', color: 'compute', weight: i ? 600 : 500, family: i ? 'mono' : 'sans', opacity: i ? 1 : 0.85 }, g.peakTagEl));
  if (!show.peakTag) C.hide(g.peakTagEl);
  { // parallel to the slope, just above it (rotated text: the audit only sees its axis-aligned box, so it is exempt)
    const ang = Math.atan2(-(decY), decX);              // the slope's direction in px (rising)
    const Ic = Math.sqrt(Math.max(xmin, sI0) * ridgeI) * 0.9;
    const cx = X(Ic), cy = Y(bw * Ic), off = 30;
    const nx = Math.sin(ang), ny = -Math.cos(ang);        // normal towards the upper-left
    g.slopeLabelEl = S.text(o.slopeLabel ?? 'bandwidth × intensity', { x: 0, y: 0, size: 28, anchor: 'middle', color: 'bytes', weight: 600 }, g);
    g.slopeLabelEl.setAttribute('transform', `translate(${C.r2(cx + nx * off)},${C.r2(cy + ny * off)}) rotate(${C.r2(ang * 180 / Math.PI)})`);
    g.slopeLabelEl.setAttribute('data-audit', 'ignore');
    if (!show.slopeLabel) C.hide(g.slopeLabelEl);
  }
  g.marks = S.g(null, g);

  Object.assign(g, {
    X, Y, I: Iof, P: Pof, attain, roofY, ridgeI, ridgeX: rx, ridgeY: ry, peak, bw, decX, decY,
    x: x0, y: y0, w, h, l: x0, r: xr, t: y0, b: xb,
  });

  // ------------------------------------------------------------------ helpers
  const lenOf = el => { try { return el.getTotalLength(); } catch (e) { return 1; } };
  g.drawAxes = (a = {}) => {
    const d = a.d ?? 0.8, t = gsap.timeline();
    t.add(C.draw(axisLines, { d, ease: 'power2.out' }), 0);
    t.add(C.fadeIn([tickG, gridG], { d: d * 0.8 }), d * 0.3);
    t.add(C.fadeIn([...g.xticks, ...g.yticks], { d: 0.4, stagger: 0.03 }), d * 0.35);
    t.add(C.fadeIn([g.xtitle, g.ytitle].filter(Boolean), { d: 0.5 }), d * 0.6);
    return t;
  };
  g.drawFlat = (a = {}) => {
    const d = a.d ?? 0.9, L1 = rx - x0, L2 = xr - rx, f = L1 / (L1 + L2);
    const t = gsap.timeline();
    t.add(C.draw(g.flatL, { d: d * f, ease: 'none' }), 0);
    t.add(C.draw(g.flatR, { d: d * (1 - f), ease: 'power2.out' }), d * f);
    return t;
  };
  g.drawSlope = (a = {}) => {
    const d = a.d ?? 0.8, t = gsap.timeline();
    t.add(C.draw(g.slopeL, { d, ease: a.to === 'top' ? 'none' : 'power2.inOut' }), 0);
    if (a.to === 'top') t.add(g.extendSlope({ d: a.dExt ?? d * 0.6 }), d);
    return t;
  };
  g.drawRoof = (a = {}) => {
    const d = a.d ?? 1.2, L1 = lenOf(g.slopeL), L2 = lenOf(g.flatR), f = L1 / (L1 + L2);
    const t = gsap.timeline();
    t.add(C.draw(g.slopeL, { d: d * f, ease: 'power1.in' }), 0);
    t.add(C.draw(g.flatR, { d: d * (1 - f), ease: 'power2.out' }), d * f);
    return t;
  };
  g.extendSlope = (a = {}) => {
    const d = a.d ?? 0.6, t = gsap.timeline();
    t.add(C.growLine(g.slopeR, { d, ease: 'power1.inOut' }), 0);
    t.fromTo(g.slopeHead, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, d * 0.9);
    return t;
  };
  g.in = (a = {}) => {
    const d = a.d ?? 1.8, t = gsap.timeline();
    t.add(g.drawAxes({ d: d * 0.45 }), 0);
    t.add(g.drawRoof({ d: d * 0.55 }), d * 0.45);
    return t;
  };
  g.traceRoof = (a = {}) => {
    const d = a.d ?? 1.6, dim = a.dim ?? 0.25, t = gsap.timeline();
    const L = roofPath.getTotalLength(), L1 = lenOf(g.slopeL), f = L1 / L;
    const tr = S.g(null, g);
    S.circle({ x: 0, y: 0, r: 26, fill: 'url(#pglow-struct)' }, tr);
    S.circle({ x: 0, y: 0, r: 9, fill: 'ink' }, tr);
    C.hide(tr);
    const place = v => { const p = roofPath.getPointAtLength(v * L); tr.setAttribute('transform', `translate(${C.r2(p.x)},${C.r2(p.y)})`); };
    place(0);
    t.fromTo(tr, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0);
    t.add(C.drive(0, 1, place, { d, ease: 'none' }), 0);
    t.add(C.draw(g.glow.slope, { d: d * f, ease: 'none' }), 0);
    t.add(C.draw(g.glow.flat, { d: d * (1 - f), ease: 'none' }), d * f);
    t.to(tr, { autoAlpha: 0, duration: 0.3 }, d);
    t.to([g.flatL, g.slopeR, g.slopeHead], { opacity: dim, duration: 0.5, ease: 'power2.out' }, d * 0.2);
    return t;
  };
  g.glowRoof = (a = {}) => {
    const d = a.d ?? 0.9, t = gsap.timeline();
    t.fromTo([g.glow.slope, g.glow.flat], { autoAlpha: 0, drawSVG: '0% 100%' }, { autoAlpha: 1, drawSVG: '0% 100%', duration: d * 0.4, ease: 'power2.out' }, 0);
    t.fromTo(g.roof, { attr: { 'stroke-width': sw } }, { attr: { 'stroke-width': sw + 3 }, duration: d * 0.4, ease: 'power2.out' }, 0);
    if (!a.hold) {
      t.to([g.glow.slope, g.glow.flat], { autoAlpha: 0, duration: d * 0.6, ease: 'power2.in' }, d * 0.4);
      t.to(g.roof, { attr: { 'stroke-width': sw }, duration: d * 0.6, ease: 'power2.inOut' }, d * 0.4);
    }
    return t;
  };
  g.showRegions = (a = {}) => {
    const which = a.which || 'both', t = gsap.timeline();
    const ks = which === 'both' ? ['memory', 'compute'] : [which];
    ks.forEach((k, i) => {
      t.add(C.fadeIn(g.tints[k], { d: a.d ?? 0.6 }), i * 0.15);
      if (a.labels !== false) t.fromTo(g.regionLabels[k], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.15 + i * 0.15);
    });
    return t;
  };
  g.showRidge = (a = {}) => {
    const d = a.d ?? 0.7, t = gsap.timeline();
    t.set(ridge, { autoAlpha: 1 }, 0);
    t.fromTo([ridge.dot, ridge.ring], { autoAlpha: 0, scale: 0.2, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(2.4)', stagger: 0.06 }, 0);
    t.add(C.growLine(ridge.drop, { d: d * 0.8, ease: 'power2.inOut' }), 0.15);
    if (a.label !== false) t.fromTo(ridge.label, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power3.out' }, 0.25);
    else t.set(ridge.label, { autoAlpha: 0 }, 0);
    if (a.tag !== false) {
      t.fromTo([ridge.tagBg, ridge.tag], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, d * 0.8);
      if (tagHits.length) t.to(tagHits, { autoAlpha: 0, duration: 0.3 }, d * 0.8);
    } else t.set([ridge.tagBg, ridge.tag], { autoAlpha: 0 }, 0);
    return t;
  };
  g.tagPeak = (a = {}) => gsap.fromTo(g.peakTagEl, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: a.d ?? 0.6, ease: 'power3.out' });
  g.tagSlope = (a = {}) => C.fadeIn(g.slopeLabelEl, { d: a.d ?? 0.6 });
  g.ghostSlope = (a = {}) => {
    const dy = a.dy ?? L10(a.factor ?? 2) * decY;
    const gh = S.g(null, ghostG);
    S.line({ x1: pS0[0] - 2 * w, y1: pS0[1] + 2 * w * decY / decX, x2: pS1[0] + 2 * w, y2: pS1[1] - 2 * w * decY / decX, stroke: 'bytes', sw: sw - 1, strokeOpacity: 0.55, dash: '14 10', cap: 'butt' }, gh);
    C.hide(gh);
    S.xset(gh, { x: 0, y: 0 });
    const d = a.d ?? 0.6, hold = a.hold ?? 0.5, t = gsap.timeline();
    t.fromTo(gh, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0);
    t.add(S.fx.xform(gh, { y: -dy }, { d, ease: 'power2.out' }), 0.05);
    t.add(S.fx.xform(gh, { y: 0 }, { d, ease: 'power2.inOut' }), 0.05 + d + hold);
    t.to(gh, { autoAlpha: 0, duration: 0.25 }, 0.05 + 2 * d + hold - 0.1);
    return t;
  };

  // ---- points
  const autoTone = I => (I < ridgeI * 0.999 ? 'bytes' : 'compute');
  const mixHex = (a, b, t) => {
    const p = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  g.point = (I0, po = {}) => {
    const pg = S.g(null, po.parent || g.marks);
    const auto = !po.tone || po.tone === 'auto';
    const tone = auto ? autoTone(I0) : po.tone;
    const r = po.r ?? 11;
    const dropper = S.g(null, pg);
    const halo = S.circle({ x: 0, y: 0, r: r * 2.4, fill: `url(#pglow-${C.GRAD.includes(tone) && tone !== 'neutral' ? tone : 'struct'})` }, dropper);
    const dot = S.circle({ x: 0, y: 0, r, fill: tone, stroke: C.DARK, sw: 3 }, dropper);
    const ripple = S.circle({ x: 0, y: 0, r, stroke: tone, sw: 2.5 }, pg);
    C.hide(ripple);
    halo.setAttribute('data-audit', 'ignore');
    const lab = S.g(null, pg);
    const labelEl = po.label ? S.text(po.label, { x: 0, y: 0, size: po.size ?? 28, weight: 600, color: po.labelColor || (tone === 'neutral' ? 'muted' : tone) }, lab) : null;
    const fmt = typeof po.readout === 'function' ? po.readout : C.sig;
    const readoutEl = po.readout ? S.text('', { x: 0, y: 0, size: 26, weight: 600, family: 'mono', color: 'ink' }, lab) : null;
    const lw = labelEl ? S.measure(po.label, { size: po.size ?? 28, weight: 600 }) : 0;
    const fixedP = po.P;
    const yOf = I => (fixedP != null ? Y(fixedP) : roofY(I));
    const place = I => {
      const x = X(I), y = yOf(I);
      for (const c of [halo, dot, ripple]) { c.setAttribute('cx', C.r2(x)); c.setAttribute('cy', C.r2(y)); }
      const rtxt = readoutEl ? fmt(fixedP != null ? fixedP : attain(I)) + (po.unit || '') : '';
      if (readoutEl) readoutEl.textContent = rtxt;
      const bw_ = Math.max(lw, readoutEl ? S.measure(rtxt, { size: 26, weight: 600, family: 'mono' }) : 0);
      let lx, ly;
      const side = po.labelSide || (fixedP != null ? 'right' : 'auto');
      if (side === 'right') { lx = x + r + 14; ly = y - (readoutEl && labelEl ? 16 : 0); }
      else if (side === 'left') { lx = x - r - 14 - bw_; ly = y - (readoutEl && labelEl ? 16 : 0); }
      else if (side === 'above') { lx = x - bw_ / 2; ly = y - r - 26 - (readoutEl && labelEl ? 32 : 0); }
      else if (side === 'below') { lx = x - bw_ / 2; ly = y + r + 28; }
      else {   // on the roof: below-right of the dot (under the slope, under the flat), kept inside the box
        const k = C.smooth((x - (rx - 40)) / 80);
        lx = Math.min(x + r + 10 - 4 * k, xr - 8 - bw_);
        ly = y + C.lerp(r + 20, r + 22, k);
      }
      if (auto && fixedP == null) {        // coral while memory bound, amber once compute bound (blended at the ridge)
        const k = C.smooth((L10(I) - L10(ridgeI)) / 0.12 + 0.5);
        const c = mixHex(S.tone('bytes'), S.tone('compute'), k);
        dot.setAttribute('fill', c); ripple.setAttribute('stroke', c);
        if (labelEl && !po.labelColor) labelEl.setAttribute('fill', c);
      }
      if (labelEl) { labelEl.setAttribute('x', C.r2(lx)); labelEl.setAttribute('y', C.r2(ly)); }
      if (readoutEl) { readoutEl.setAttribute('x', C.r2(lx)); readoutEl.setAttribute('y', C.r2(ly + (labelEl ? 33 : 0))); }
      // a label sliding over the ridge's dashed drop line fades the line under it
      const over = Math.min(lx + bw_ + 12 - rx, rx - lx + 12);
      dropDim.set(pg, ly + 30 > ry + 16 && over > 0 ? C.smooth(over / 24) : 0);
      applyDrop();
      pg.x = x; pg.y = y; pg.I = I;
    };
    let plan = I0;
    place(I0);
    Object.assign(pg, { dot, halo, labelEl, readoutEl, dropper, label: lab, tone });
    pg.in = (a = {}) => {
      const t = gsap.timeline();
      if ((a.from || 'drop') === 'drop') {
        t.fromTo(dropper, { autoAlpha: 0, y: -(a.dist ?? 90) }, { autoAlpha: 1, y: 0, duration: a.d ?? 0.7, ease: 'power3.in' }, 0);
        t.fromTo(ripple, { autoAlpha: 0.9, attr: { r } }, { autoAlpha: 0, attr: { r: r * 3.2 }, duration: 0.6, ease: 'power2.out', immediateRender: false }, (a.d ?? 0.7) - 0.02);
        t.fromTo(dot, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.25, duration: 0.12, yoyo: true, repeat: 1, ease: 'sine.out', transformOrigin: '50% 50%' }, (a.d ?? 0.7) - 0.02);
      } else {
        t.fromTo(dropper, { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: a.d ?? 0.5, ease: 'back.out(2.4)' }, 0);
      }
      t.fromTo(lab, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'power2.out' }, (a.d ?? 0.7) * 0.7);
      return t;
    };
    pg.moveTo = (I2, a = {}) => {
      const from = plan; plan = I2;
      return C.drive(L10(from), L10(I2), v => place(10 ** v), { d: a.d ?? 1.6, ease: a.ease || 'power2.inOut' });
    };
    pg.out = (a = {}) => C.fadeOut(pg, { d: a.d ?? 0.4 });
    pg.guide = (axis, a = {}) => {
      const gg = S.g(null, pg);
      const x = X(plan), y = yOf(plan), tone_ = a.tone || 'ink';
      if (axis === 'y') {
        gg.line = S.line({ x1: x - r - 4, y1: y, x2: x0 + 2, y2: y, stroke: tone_, sw: 2.5, dash: '2 7', strokeOpacity: 0.85 }, gg);
        if (a.tag) gg.tag = S.text(a.tag, { x: x0 - 16, y, size: a.size ?? 26, anchor: 'end', family: 'mono', weight: 600, color: a.tagTone || tone }, gg);
      } else {
        gg.line = S.line({ x1: x, y1: y + r + 4, x2: x, y2: xb - 2, stroke: tone_, sw: 2.5, dash: '2 7', strokeOpacity: 0.85 }, gg);
        if (a.tag) gg.tag = S.text(a.tag, { x, y: xb + 37, size: a.size ?? 26, anchor: 'middle', family: 'mono', weight: 600, color: a.tagTone || tone }, gg);
      }
      gg.in = (b = {}) => {
        const t = gsap.timeline();
        t.add(C.growLine(gg.line, { d: b.d ?? 0.5 }), 0);
        if (gg.tag) t.add(C.fadeIn(gg.tag, { d: 0.4 }), (b.d ?? 0.5) * 0.7);
        return t;
      };
      gg.out = (b = {}) => C.fadeOut(gg, { d: b.d ?? 0.35 });
      return gg;
    };
    return pg;
  };

  // ---- probes: a dashed vertical at one intensity, meeting both ceilings
  g.probe = (I, pr = {}) => {
    const pg = S.g(null, pr.parent || g.marks);
    const x = X(I), fmt = pr.fmt || C.sig;
    const vS = bw * I, vF = peak;
    const yS = Y(vS), yF = Y(vF);
    const sOff = yS < y0;                                  // the slope's value is above the chart
    const top = sOff ? y0 + 2 : Math.min(yS, yF) - 40;
    pg.line = S.line({ x1: x, y1: xb, x2: x, y2: top, stroke: 'ink', sw: 2.5, dash: '8 8', strokeOpacity: 0.8, cap: 'butt' }, pg);
    pg.head = sOff ? S.path({ d: C.headD(x, y0 - 4, 0, -1, 14), stroke: 'ink', sw: 2.5 }, pg) : null;
    pg.slopeMark = sOff ? null : S.circle({ x, y: yS, r: 8, fill: C.BASE, stroke: 'bytes', sw: 3 }, pg);
    pg.flatMark = S.circle({ x, y: yF, r: 8, fill: C.BASE, stroke: 'compute', sw: 3 }, pg);
    const lower = vS < vF ? 'slope' : 'flat';
    if (pr.tags !== false) {
      // the slope's tag sits below-right of its meeting (clear of the rising line); the flat's below-left
      pg.slopeTag = sOff
        ? S.text(fmt(vS), { x: x + 16, y: y0 + 24, size: 26, family: 'mono', weight: 600, color: 'bytes' }, pg)
        : S.text(fmt(vS), { x: x + 16, y: yS + 26, size: 26, family: 'mono', weight: 600, color: 'bytes' }, pg);
      pg.flatTag = S.text(fmt(vF), { x: x - 16, y: yF + 28, size: 26, family: 'mono', weight: 600, color: 'compute', anchor: 'end' }, pg);
    }
    pg.dot = S.circle({ x, y: lower === 'slope' ? yS : yF, r: 10, fill: 'ink', stroke: C.DARK, sw: 2.5 }, pg);
    C.hide(pg.dot);
    pg.in = (a = {}) => {
      const d = a.d ?? 0.9, t = gsap.timeline();
      const span = xb - top, at = yy => d * C.clamp((xb - yy) / span, 0, 1);
      t.add(C.growLine(pg.line, { d, ease: 'none' }), 0);
      if (pg.head) t.fromTo(pg.head, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, d * 0.95);
      if (pg.slopeMark) t.fromTo(pg.slopeMark, { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' }, at(yS));
      t.fromTo(pg.flatMark, { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' }, at(yF));
      if (pg.slopeTag) t.add(C.fadeIn(pg.slopeTag, { d: 0.35 }), sOff ? d : at(yS) + 0.05);
      if (pg.flatTag) t.add(C.fadeIn(pg.flatTag, { d: 0.35 }), at(yF) + 0.05);
      return t;
    };
    pg.settle = (a = {}) => {
      const d = a.d ?? 0.5, t = gsap.timeline();
      const win = lower === 'slope' ? pg.slopeTag : pg.flatTag, lose = lower === 'slope' ? pg.flatTag : pg.slopeTag;
      t.fromTo(pg.dot, { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: d, ease: 'back.out(2.2)' }, 0);
      if (lose) t.to(lose, { opacity: 0.35, duration: d }, 0);
      if (win) t.fromTo(win, { scale: 1, transformOrigin: '0% 50%' }, { scale: 1.15, duration: d / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '0% 50%' }, 0);
      return t;
    };
    pg.out = (a = {}) => C.fadeOut(pg, { d: a.d ?? 0.4 });
    Object.assign(pg, { x, I, lower });
    return pg;
  };

  // ---- annotation: brackets, second roofs, real workloads, an arrow along the roof
  g.bracket = (I1, I2, a = {}) => {
    const bg = S.g(null, a.parent || g.marks);
    const xa = X(Math.min(I1, I2)), xz = X(Math.max(I1, I2)), y = a.y ?? (xb - 30), tk = a.tick ?? 12;
    const tone = a.tone || 'ink';
    bg.line = S.path({ d: `M${C.r2(xa)},${y + tk} L${C.r2(xa)},${y} L${C.r2(xz)},${y} L${C.r2(xz)},${y + tk}`, stroke: tone, sw: 2.5, join: 'miter' }, bg);
    if (a.label) bg.label = S.text(a.label, { x: (xa + xz) / 2, y: y - 24, size: a.size ?? 28, anchor: 'middle', color: tone, weight: 650, family: a.mono ? 'mono' : 'sans' }, bg);
    bg.in = (b = {}) => {
      const t = gsap.timeline();
      t.add(C.draw(bg.line, { d: b.d ?? 0.6, from: '50% 50%', to: '0% 100%', ease: 'power2.out' }), 0);
      if (bg.label) t.fromTo(bg.label, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }, (b.d ?? 0.6) * 0.5);
      return t;
    };
    bg.out = (b = {}) => C.fadeOut(bg, { d: b.d ?? 0.35 });
    return bg;
  };
  g.addRoof = (a = {}) => {
    const rg = S.g({ opacity: a.opacity }, plot);
    const pk = a.peak, b = a.bw, s = a.sw ?? 3;
    const rI = pk / b, rX = X(rI), rY = Y(pk);
    const i0 = Math.max(xmin, ymin / b);
    rg.slope = S.path({ d: `M${P(X(i0), Y(b * i0))} L${P(rX, rY)}`, stroke: a.slopeTone || 'bytes', sw: s }, rg);
    rg.flat = S.path({ d: `M${P(rX, rY)} L${P(xr, rY)}`, stroke: a.flatTone || 'compute', sw: s }, rg);
    Object.assign(rg, { ridgeI: rI, ridgeX: rX, ridgeY: rY, roofY: I => Y(Math.min(pk, b * I)) });
    rg.draw = (c = {}) => {
      const d = c.d ?? 1.0, L1 = lenOf(rg.slope), L2 = lenOf(rg.flat), f = L1 / (L1 + L2), t = gsap.timeline();
      t.add(C.draw(rg.slope, { d: d * f, ease: 'power1.in' }), 0);
      t.add(C.draw(rg.flat, { d: d * (1 - f), ease: 'power2.out' }), d * f);
      return t;
    };
    return rg;
  };
  g.scatter = (a = {}) => {
    const sg = S.g(null, a.parent || g.marks);
    const rnd = S.rand(a.seed ?? 7), n = a.n ?? 10, tone = a.tone || 'neutral', r = a.r ?? 8;
    const lo = L10(xmin) + 0.35, hi = L10(xmax) - 0.35;
    sg.dots = [];
    for (let i = 0; i < n; i++) {
      const lx = lo + (hi - lo) * (i + 0.15 + 0.7 * rnd()) / n;
      const I = 10 ** lx;
      const onRoof = rnd() < (a.onRoof ?? 0.25);
      const P_ = attain(I) / (onRoof ? 1 : 10 ** (0.12 + 0.9 * rnd()));
      const yy = Math.min(Y(P_), xb - r - 6);
      sg.dots.push(S.circle({ x: X(I), y: yy, r, fill: tone === 'neutral' ? '#a7b1cc' : tone, stroke: C.DARK, sw: 2.5, opacity: 0.9 }, sg));
    }
    sg.in = (b = {}) => gsap.fromTo(sg.dots, { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: b.d ?? 0.45, ease: 'back.out(2.4)', stagger: b.stagger ?? 0.07 });
    sg.out = (b = {}) => C.fadeOut(sg, { d: b.d ?? 0.4 });
    return sg;
  };
  g.arrowAlong = (I1, I2, a = {}) => {
    const ag = S.g(null, a.parent || g.marks);
    const off = a.off ?? 26, tone = a.tone || 'helps', n = 48;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const I = 10 ** (L10(I1) + (L10(I2) - L10(I1)) * i / n);
      pts.push([X(I), roofY(I)]);
    }
    // offset each point along the local normal, towards the upper-left (outside the roof)
    const op = pts.map((p, i) => {
      const a_ = pts[Math.max(0, i - 1)], b_ = pts[Math.min(n, i + 1)];
      let tx = b_[0] - a_[0], ty = b_[1] - a_[1];
      const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      let nx = ty, ny = -tx;
      if (ny > 0) { nx = -nx; ny = -ny; }
      return [p[0] + nx * off, p[1] + ny * off];
    });
    const s0 = a.startGap ?? 14, e0 = a.endGap ?? 4;
    const trim = (arr, len0, fromEnd) => {      // drop a length from one end
      const out = fromEnd ? arr.slice().reverse() : arr.slice();
      let acc = 0;
      while (out.length > 2) {
        const sl = Math.hypot(out[1][0] - out[0][0], out[1][1] - out[0][1]);
        if (acc + sl > len0) { const k = (len0 - acc) / sl; out[0] = [out[0][0] + (out[1][0] - out[0][0]) * k, out[0][1] + (out[1][1] - out[0][1]) * k]; break; }
        acc += sl; out.shift();
      }
      return fromEnd ? out.reverse() : out;
    };
    const tp = trim(trim(op, s0, false), e0, true);
    ag.line = S.path({ d: tp.map((p, i) => `${i ? 'L' : 'M'}${C.r2(p[0])},${C.r2(p[1])}`).join(' '), stroke: tone, sw: a.sw ?? 5 }, ag);
    const e = tp[tp.length - 1], f = tp[tp.length - 2], el_ = Math.hypot(e[0] - f[0], e[1] - f[1]) || 1;
    ag.head = S.path({ d: C.headD(e[0], e[1], (e[0] - f[0]) / el_, (e[1] - f[1]) / el_, 18), stroke: tone, sw: a.sw ?? 5 }, ag);
    ag.draw = (b = {}) => {
      const d = b.d ?? 0.9, t = gsap.timeline();
      t.add(C.draw(ag.line, { d, ease: 'power2.inOut' }), 0);
      t.fromTo(ag.head, { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(3)' }, d * 0.88);
      return t;
    };
    ag.out = (b = {}) => C.fadeOut(ag, { d: b.d ?? 0.35 });
    return ag;
  };
  return g;
}


/**
 * libScaleCompare — quantities drawn to ONE scale when they differ enormously: the big one fills the
 * width, the tiny one is a sliver or a hairline at its true size (never inflated), so the gap is seen,
 * not just stated. Rows (140 GB of weights over 0.12 GB on the chip), or 'inline': the whole as a track
 * with its parts laid in from the left end (30 ms per token, 0.1 ms of it arithmetic). A magnifier
 * (round lens or rectangular inset) shows the tiny one enlarged; copies of the tiny one can tile the
 * whole ("300 tokens' worth"); bars can morph to a log scale. Anything under `hairline` px is drawn
 * at the hairline width (the true width would not render) and flagged .hair on its row.
 *
 * o: {x = 210, y = 420 (top-left of the first bar), w = 1500 (px for `max`),
 *     max                     value drawn at w; default the largest item value,
 *     items = [{value, label, text, tone = 'struct', style = 'solid'|'outline'|'grey'|'ghost', px, off, fmt}]
 *                             label: name above the bar (or left of it); text: value text at the bar's end
 *                             (default none); px: force a drawn length (a schematic stand-in); off: tag at
 *                             the frame edge when the bar runs off it ('≈ 3,200 km →'); fmt: number format
 *                             for .grow to count text with,
 *     layout = 'rows' | 'inline'   inline: items[0] is the whole, the rest are parts from its left end,
 *     h = 56 (bar thickness), gap = 76 (between rows), labelPos = 'above' | 'left', labelW = 320 (for left),
 *     size = 28 (labels), textSize = 28 (value texts), hairline = 1.5, edge = 1990 (x a bar may run to)}
 * Returns <g> with .rows[] each {g, value, len (drawn px), hair, x, y, cy, h, r (right end), solid, outline,
 *   grey, base, labelEl, textEl, offEl}, .X(v) (x for a value from the left end), .L(v) (length for a value),
 *   .whole (inline: rows[0]) and .x .y .w
 * Helpers (return tweens/timelines unless noted; call in time order):
 *   .in({d = 1.0, stagger = 0.3})      bars sweep in from the left end, labels and texts fade in
 *   .grow(i, value, {d = 0.9, text})   resize a bar to scale (text counts with item.fmt, or swaps to `text`)
 *   .restyle(i, style, {d = 0.5})      crossfade a bar to 'solid'|'outline'|'grey'|'ghost'
 *   .toLog({min, d = 1.4}) / .toLinear({d})   morph every bar between the linear and a log scale
 *                                     (log: length ∝ log(value / min); default min = smallest value / 10)
 *   .tag(i, text, {side: 'end'|'above'|'below'|'inside', tone = 'muted', size = 26, dx, dy}) → <g> (.in() .out())
 *   .pointer(i, text, {tone = 'ink', len = 64, side = 'above', size = 26, at}) → <g> (.in() .out()): a short line
 *                                     dropping onto the bar (its middle, or at value `at`) from a tag
 *   .dimension(i, label, {gap = 34, tone = 'muted', size = 28}) → <g> (.in() .out()): a dimension line
 *                                     under the bar, end ticks, label in a gap at its centre
 *   .bracket(v1, v2, {row = 0, side = 'above', label, tone = 'ink', size = 28}) → <g> (.in() .out())
 *   .magnify(mo) → lens handle with .open({d = 0.9}) .close({d = 0.7}) .content (a <g> to draw into)
 *        .M {zoom, X(x), Y(y)} (frame → lens coordinates), .ring .leader .disc (round) | .panel .guides
 *        .window (inset) and .tagEl. mo: {i (default the smallest item), shape = 'circle' | 'inset',
 *        round: x, y (lens centre; default up-right of the bar), r = 120, ring = 22, zoom (default: the bar
 *        spans half the lens), at (value on the bar to centre on);
 *        inset: x, y, w = 1000, h = 170 (panel), window = [v0, v1] (the stretch of the bar to enlarge),
 *        barH = 60; both: tag (default '× zoom'; false for none), content(g, M) to draw your own picture
 *        instead of the enlarged bars (e.g. the chip's working areas)}
 *   .tile({i = 1, into = 0, n, d = 3.5, ease = 'power2.in', counter: {x, y, size = 48, tone, fmt}}) → timeline
 *        (with .group .counter): copies of bar i stamp end to end along bar `into` from its left end,
 *        accelerating; inline, the copies start right after the original. n copies in all (inline counts
 *        the original). The counter, if any, runs 1 → n in step.
 * Example:
 *   const sc = libScaleCompare(S, { y: 380, items: [
 *     { value: 140, label: 'the model', text: '140 GB', tone: 'bytes' },
 *     { value: 0.12, label: 'on the chip', text: '0.12 GB', tone: 'compute' }] });
 *   S.add(sc.in(), 'b1');
 *   const lens = sc.magnify({ x: 1300, y: 760 });  S.add(lens.open(), 'b2~tiny');
 */
function libScaleCompare(S, o = {}, parent) {
  const C = _libChart;
  const g = S.g(null, parent);
  const x0 = o.x ?? 210, y0 = o.y ?? 420, W = o.w ?? 1500;
  const inline = o.layout === 'inline';
  const bh = o.h ?? 56, gap = o.gap ?? 76, size = o.size ?? 28, tsz = o.textSize ?? 28;
  const hair = o.hairline ?? 1.5, edge = o.edge ?? 1990;
  const items = (o.items || [
    { value: 140, label: 'the model', text: '140 GB', tone: 'bytes' },
    { value: 0.12, label: 'on the chip', text: '0.12 GB', tone: 'compute' },
  ]).map((it, i) => ({ tone: 'struct', style: inline && i === 0 ? 'outline' : 'solid', ...it }));
  const max = o.max ?? Math.max(...items.map(it => it.value));
  const minV = Math.min(...items.filter(it => it.value > 0).map(it => it.value));
  // scale state: m = 0 linear .. 1 log
  const st = { m: 0, lmin: minV / 10 };
  const lenAt = (v, m = st.m, lmin = st.lmin) => {
    const lin = W * v / max;
    const lg = v > lmin ? W * Math.log(v / lmin) / Math.log(max / lmin) : 0;
    return C.lerp(lin, Math.max(0, lg), m);
  };
  const vals = items.map(it => it.value);           // planned values
  const live = items.map(it => it.value);           // values as rendered
  const STY = {
    solid: { solid: 1, grey: 0, outline: 0, base: 0 }, outline: { solid: 0, grey: 0, outline: 1, base: 1 },
    grey: { solid: 0, grey: 1, outline: 0.35, base: 1 }, ghost: { solid: 0, grey: 0, outline: 0.7, base: 0 },
  };
  const styles = items.map(it => it.style);

  const barsG = S.g(null, g);
  g.rows = items.map((it, i) => {
    const y = inline ? y0 : y0 + i * (bh + gap);
    const rg = S.g(null, barsG);
    const tone = it.tone, s = STY[it.style] || STY.solid;
    const row = { g: rg, item: it, x: x0, y, h: bh, cy: y + bh / 2, tone };
    row.base = S.rect({ x: x0, y, w: 1, h: bh, r: 8, fill: C.BASE }, rg);
    row.grey = S.rect({ x: x0, y, w: 1, h: bh, r: 8, fill: '#a7b1cc', fillOpacity: 0.26 }, rg);
    row.solid = S.rect({ x: x0, y, w: 1, h: bh, r: 8, fill: `url(#solid-${C.GRAD.includes(tone) ? tone : 'struct'})` }, rg);
    row.outline = S.rect({ x: x0, y, w: 1, h: bh, r: 8, stroke: tone === 'neutral' ? '#ffffff' : tone, sw: 2, strokeOpacity: tone === 'neutral' ? 0.4 : 0.8, dash: it.style === 'ghost' ? '8 7' : undefined }, rg);
    for (const k of ['solid', 'grey', 'outline', 'base']) row[k].style.opacity = s[k];
    if (it.label) {
      row.labelEl = o.labelPos === 'left'
        ? S.text(it.label, { x: x0 - 24, y: row.cy, size, anchor: 'end', weight: 600, color: it.labelColor || 'ink', maxW: (o.labelW ?? 320) - 30 }, rg)
        : S.text(it.label, { x: x0, y: y - 30, size, weight: 600, color: it.labelColor || 'ink' }, rg);
    }
    if (it.text != null) row.textEl = S.text(String(it.text), { x: x0, y: row.cy + 1, size: tsz, family: 'mono', weight: 600, color: it.textColor || (tone === 'neutral' ? 'ink' : tone) }, rg);
    if (it.off) row.offEl = S.text(it.off, { x: 1824, y: y - 30, size: 26, anchor: 'end', weight: 600, color: tone === 'neutral' ? 'muted' : tone }, rg);
    return row;
  });
  const startOf = i => {                     // left end of bar i (inline parts are laid end to end)
    if (!inline || i === 0) return x0;
    let x = x0;
    for (let k = 1; k < i; k++) x += Math.max(lenAt(live[k]), live[k] > 0 ? hair : 0);
    return x;
  };
  const drawnLen = (i, v) => {
    const it = items[i];
    if (it.px != null) return it.px * v / it.value;
    const L = lenAt(v);
    return v > 0 ? Math.max(L, hair) : 0;
  };
  function render() {
    g.rows.forEach((row, i) => {
      const L = drawnLen(i, live[i]), x = startOf(i);
      const vis = Math.min(L, edge - x);
      const r = Math.min(8, vis / 2, bh / 2);
      for (const k of ['base', 'grey', 'solid', 'outline']) {
        row[k].setAttribute('x', C.r2(x)); row[k].setAttribute('width', C.r2(Math.max(vis, 0.001)));
        row[k].setAttribute('rx', C.r2(r)); row[k].setAttribute('ry', C.r2(r));
      }
      Object.assign(row, { x, len: L, r: x + vis, hair: live[i] > 0 && lenAt(live[i]) < hair, value: live[i] });
      if (row.textEl) {
        row.textEl.setAttribute('x', C.r2(x + Math.min(L, edge) + (lenAt(live[i]) < 6 && live[i] > 0 ? bh / 2 + 26 : 18)));
        row.textEl.style.display = x + L > 1800 ? 'none' : '';
      }
    });
  }
  render();
  g.X = v => x0 + lenAt(v);
  g.L = v => lenAt(v);
  Object.assign(g, { x: x0, y: y0, w: W, whole: inline ? g.rows[0] : null, max });

  // ------------------------------------------------------------------ helpers
  g.in = (a = {}) => {
    const d = a.d ?? 1.0, stg = a.stagger ?? 0.3, t = gsap.timeline();
    g.rows.forEach((row, i) => {
      const fin = vals[i];
      const set = v => { live[i] = v; render(); };
      t.fromTo(row.g, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, i * stg);
      // the sweep: from zero to the planned value (tiny ones simply appear)
      t.add(C.drive(0, fin, set, { d: lenAt(fin) < 6 ? 0.25 : d, ease: 'power3.out' }), i * stg);
      const txt = [row.labelEl, row.textEl, row.offEl].filter(Boolean);
      if (txt.length) t.fromTo(txt, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power2.out' }, i * stg + Math.min(d, 0.5));
    });
    return t;
  };
  g.grow = (i, v, a = {}) => {
    const from = vals[i]; vals[i] = v;
    const row = g.rows[i], it = items[i];
    const t = gsap.timeline();
    t.add(C.drive(from, v, x => {
      live[i] = x; render();
      if (row.textEl && it.fmt) row.textEl.textContent = it.fmt(x);
    }, { d: a.d ?? 0.9, ease: a.ease || 'power2.inOut' }), 0);
    if (row.textEl && a.text != null && !it.fmt) t.add(S.fx.swap(row.textEl, String(a.text), { d: 0.4 }), 0);
    return t;
  };
  g.restyle = (i, style, a = {}) => {
    const row = g.rows[i], from = STY[styles[i]] || STY.solid, to = STY[style] || STY.solid;
    styles[i] = style;
    const t = gsap.timeline();
    for (const k of ['solid', 'grey', 'outline', 'base']) {
      if (from[k] !== to[k]) t.fromTo(row[k], { opacity: from[k] }, { opacity: to[k], duration: a.d ?? 0.5, ease: 'power1.inOut', immediateRender: false }, 0);
    }
    return t;
  };
  let planM = 0, planLmin = st.lmin;
  g.toLog = (a = {}) => {
    const lmin = a.min ?? planLmin;
    const m0 = planM, l0 = planLmin;
    planM = 1; planLmin = lmin;
    return C.drive(0, 1, f => { st.m = C.lerp(m0, 1, f); st.lmin = l0 * (lmin / l0) ** f; render(); }, { d: a.d ?? 1.4, ease: 'power2.inOut' });
  };
  g.toLinear = (a = {}) => {
    const m0 = planM; planM = 0;
    return C.drive(0, 1, f => { st.m = C.lerp(m0, 0, f); render(); }, { d: a.d ?? 1.4, ease: 'power2.inOut' });
  };

  const annot = (gg, inFn) => {
    gg.in = inFn || ((b = {}) => gsap.fromTo(gg, { autoAlpha: 0 }, { autoAlpha: 1, duration: b.d ?? 0.45, ease: 'power2.out' }));
    gg.out = (b = {}) => C.fadeOut(gg, { d: b.d ?? 0.35 });
    return gg;
  };
  const planEnd = i => startOf(i) + drawnLen(i, vals[i]);
  g.tag = (i, text, a = {}) => {
    const row = g.rows[i], tg = S.g(null, g);
    const side = a.side || 'end', sz = a.size ?? 26, tone = a.tone || 'muted';
    const xe = Math.min(planEnd(i), 1800);
    let x, y, anchor = 'start';
    if (side === 'end') { x = xe + 18; y = row.cy + 1; }
    else if (side === 'above') { x = startOf(i); y = row.y - 30; }
    else if (side === 'below') { x = startOf(i); y = row.y + bh + 30; }
    else { x = startOf(i) + 22; y = row.cy + 1; }
    tg.label = S.text(text, { x: x + (a.dx || 0), y: y + (a.dy || 0), size: sz, weight: 600, color: side === 'inside' ? (a.tone || 'ink') : tone, anchor, family: a.mono ? 'mono' : 'sans' }, tg);
    return annot(tg, (b = {}) => gsap.fromTo(tg, { autoAlpha: 0, x: side === 'end' ? -10 : 0, y: side === 'end' ? 0 : 8 }, { autoAlpha: 1, x: 0, y: 0, duration: b.d ?? 0.5, ease: 'power3.out' }));
  };
  g.pointer = (i, text, a = {}) => {
    const row = g.rows[i], pg = S.g(null, g);
    const tone = a.tone || 'ink', len = a.len ?? 64, up = (a.side || 'above') === 'above';
    const px = a.at != null ? startOf(i) + lenAt(a.at) : startOf(i) + Math.max(drawnLen(i, vals[i]), 0) / 2;
    const ya = up ? row.y - 6 : row.y + bh + 6, yb = up ? ya - len : ya + len;
    pg.line = S.line({ x1: px, y1: yb, x2: px, y2: ya, stroke: tone, sw: 2.5 }, pg);
    pg.head = S.path({ d: C.headD(px, ya, 0, up ? 1 : -1, 10), stroke: tone, sw: 2.5 }, pg);
    pg.label = S.text(text, { x: px - 8 + (a.dx || 0), y: yb + (up ? -22 : 24), size: a.size ?? 26, weight: 600, color: tone }, pg);
    return annot(pg, (b = {}) => {
      const t = gsap.timeline();
      t.fromTo(pg.label, { autoAlpha: 0, y: up ? -8 : 8 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 0);
      t.add(C.draw(pg.line, { d: b.d ?? 0.35, ease: 'power2.in' }), 0.1);
      t.fromTo(pg.head, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, 0.1 + (b.d ?? 0.35) * 0.85);
      return t;
    });
  };
  g.dimension = (i, label, a = {}) => {
    const row = g.rows[i], dg = S.g(null, g);
    const xa = startOf(i), xz = Math.min(planEnd(i), 1830), y = row.y + bh + (a.gap ?? 34), tone = a.tone || 'muted';
    const sz = a.size ?? 28, lw = S.measure(label, { size: sz, weight: 600 }) + 36, cx = (xa + xz) / 2;
    dg.ticks = [S.line({ x1: xa, y1: y - 12, x2: xa, y2: y + 12, stroke: tone, sw: 2 }, dg), S.line({ x1: xz, y1: y - 12, x2: xz, y2: y + 12, stroke: tone, sw: 2 }, dg)];
    dg.left = S.line({ x1: cx - lw / 2, y1: y, x2: xa, y2: y, stroke: tone, sw: 2 }, dg);
    dg.right = S.line({ x1: cx + lw / 2, y1: y, x2: xz, y2: y, stroke: tone, sw: 2 }, dg);
    dg.label = S.text(label, { x: cx, y: y + 1, size: sz, anchor: 'middle', weight: 600, color: a.labelTone || 'ink' }, dg);
    return annot(dg, (b = {}) => {
      const t = gsap.timeline(), d = b.d ?? 0.7;
      t.add(C.draw([dg.left, dg.right], { d, ease: 'power2.out' }), 0);
      t.fromTo(dg.ticks, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, d * 0.85);
      t.fromTo(dg.label, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0);
      return t;
    });
  };
  g.bracket = (v1, v2, a = {}) => {
    const row = g.rows[a.row ?? 0], bg = S.g(null, g);
    const up = (a.side || 'above') === 'above', tone = a.tone || 'ink', tk = 12;
    const xa = startOf(a.row ?? 0) + lenAt(Math.min(v1, v2)), xz = Math.min(startOf(a.row ?? 0) + lenAt(Math.max(v1, v2)), 1830);
    const y = up ? row.y - (a.gap ?? 20) : row.y + bh + (a.gap ?? 20), dir = up ? 1 : -1;
    bg.line = S.path({ d: `M${C.r2(xa)},${y + dir * tk} L${C.r2(xa)},${y} L${C.r2(xz)},${y} L${C.r2(xz)},${y + dir * tk}`, stroke: tone, sw: 2.5, join: 'miter' }, bg);
    if (a.label) bg.label = S.text(a.label, { x: (xa + xz) / 2, y: y - dir * 26, size: a.size ?? 28, anchor: 'middle', weight: 650, color: tone }, bg);
    return annot(bg, (b = {}) => {
      const t = gsap.timeline();
      t.add(C.draw(bg.line, { d: b.d ?? 0.6, from: '50% 50%', to: '0% 100%', ease: 'power2.out' }), 0);
      if (bg.label) t.fromTo(bg.label, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.2);
      return t;
    });
  };

  // ---- the magnifier: a round lens on a leader, or a rectangular inset on two guide lines
  g.magnify = (mo = {}) => {
    const i = mo.i ?? vals.indexOf(Math.min(...vals));
    const row = g.rows[i], it = items[i];
    const L = drawnLen(i, vals[i]), x1 = startOf(i);
    const mg = S.g(null, mo.parent || g);
    const shape = mo.shape || 'circle';
    const contentDefault = (cg, M) => {
      g.rows.forEach((rw, j) => {
        if (!inline && j !== i && shape === 'inset') return;
        const Lj = lenAt(vals[j]), xj = startOf(j);
        if (!(Lj > 0)) return;
        const st_ = styles[j];
        const yA = shape === 'inset' ? M.barY : M.Y(rw.y), hA = shape === 'inset' ? M.barH : bh * M.zoom;
        const rr = Math.min(8, Lj * M.zoom / 2, hA / 2);
        if (st_ === 'solid') S.rect({ x: M.X(xj), y: yA, w: Lj * M.zoom, h: hA, r: rr, fill: `url(#solid-${C.GRAD.includes(rw.tone) ? rw.tone : 'struct'})` }, cg);
        else S.rect({ x: M.X(xj), y: yA, w: Lj * M.zoom, h: hA, r: rr, fill: st_ === 'grey' ? '#a7b1cc' : C.BASE, fillOpacity: st_ === 'grey' ? 0.26 : 1, stroke: rw.tone === 'neutral' ? '#ffffff' : rw.tone, strokeOpacity: 0.6, sw: 2 }, cg);
      });
    };
    if (shape === 'circle') {
      const R = mo.r ?? 120, rs = mo.ring ?? bh / 2 + 8;
      const fx = mo.at != null ? x1 + lenAt(mo.at) : x1 + L / 2, fy = row.cy;
      const cx = mo.x ?? Math.min(fx + 420, 1824 - R), cy = mo.y ?? Math.max(fy - 250, 110 + R);
      const zoom = mo.zoom ?? (R * 0.5) / Math.max(L, 0.5);
      const M = { zoom, cx, cy, r: R, X: px => cx + (px - fx) * zoom, Y: py => cy + (py - fy) * zoom };
      const dx = cx - fx, dy = cy - fy, dl = Math.hypot(dx, dy) || 1;
      mg.ring = S.circle({ x: fx, y: fy, r: rs, stroke: 'ink', sw: 2.5 }, mg);
      mg.leader = S.line({ x1: fx + dx / dl * rs, y1: fy + dy / dl * rs, x2: cx - dx / dl * R, y2: cy - dy / dl * R, stroke: 'ink', sw: 2, strokeOpacity: 0.7 }, mg);
      const disc = S.g(null, mg);
      S.circle({ x: cx, y: cy, r: R, fill: C.BASE, filter: 'url(#shadow)' }, disc);
      const clipId = C.uid('lens');
      const cp = S.el('clipPath', { id: clipId }, disc);
      S.circle({ x: cx, y: cy, r: R - 1 }, cp).setAttribute('fill', '#fff');
      const cg = S.g({ 'clip-path': `url(#${clipId})`, 'data-audit': 'ignore' }, disc);   // a clipped picture
      S.circle({ x: cx, y: cy, r: R, fill: '#ffffff', fillOpacity: 0.03 }, cg);
      (mo.content || contentDefault)(cg, M);
      S.circle({ x: cx, y: cy, r: R, stroke: 'ink', sw: 3, strokeOpacity: 0.9 }, disc);
      const tag = mo.tag === false ? null : (mo.tag ?? `× ${C.sig(zoom, 2)}`);
      if (tag) mg.tagEl = S.text(tag, { x: cx, y: cy + R + 32, size: 26, anchor: 'middle', weight: 600, color: 'muted', family: 'mono' }, mg);
      Object.assign(mg, { disc, content: cg, M, fx, fy });
      const closed = { x: fx - cx, y: fy - cy, s: rs / R, ox: cx, oy: cy };
      S.xset(disc, closed);
      C.hide(mg.ring); C.hide(mg.leader); C.hide(disc); if (mg.tagEl) C.hide(mg.tagEl);
      mg.open = (b = {}) => {
        const d = b.d ?? 0.9, t = gsap.timeline();
        t.add(C.draw(mg.ring, { d: d * 0.3, ease: 'power2.out' }), 0);
        t.add(C.draw(mg.leader, { d: d * 0.3, ease: 'power2.inOut' }), d * 0.25);
        t.fromTo(disc, { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.2 }, d * 0.35);
        t.add(S.fx.xform(disc, { x: 0, y: 0, s: 1 }, { d: d * 0.6, ease: 'power3.out' }), d * 0.35);
        if (mg.tagEl) t.fromTo(mg.tagEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, d * 0.9);
        return t;
      };
      mg.close = (b = {}) => {
        const d = b.d ?? 0.7, t = gsap.timeline();
        if (mg.tagEl) t.to(mg.tagEl, { autoAlpha: 0, duration: 0.2 }, 0);
        t.add(S.fx.xform(disc, closed, { d: d * 0.6, ease: 'power3.in' }), 0);
        t.to(disc, { autoAlpha: 0, duration: d * 0.15 }, d * 0.5);
        t.to(mg.leader, { drawSVG: '100% 100%', duration: d * 0.3, ease: 'power2.in' }, d * 0.5);
        t.to(mg.ring, { autoAlpha: 0, duration: d * 0.25 }, d * 0.75);
        return t;
      };
    } else {
      const wv = mo.window || [0, vals[i] * 10];          // values, measured from the scale's left end
      const sx0 = x0 + lenAt(wv[0]), sx1 = x0 + lenAt(wv[1]);
      const sy0 = row.y - 10, sy1 = row.y + bh + 10;
      const pw = mo.w ?? 1000, ph = mo.h ?? 170;
      const px = mo.x ?? C.clamp((sx0 + sx1) / 2 - pw / 2, 110, 1810 - pw), py = mo.y ?? Math.max(120, sy0 - 90 - ph);
      const zoom = pw / Math.max(sx1 - sx0, 0.01);
      const barH = mo.barH ?? 60;
      const M = { zoom, px, py, pw, ph, barH, barY: py + (mo.barTop ?? (ph - barH) * 0.4), X: X_ => px + (X_ - sx0) * zoom, Y: Y_ => Y_ };
      mg.window = S.rect({ x: sx0 - 3, y: sy0, w: Math.max(sx1 - sx0 + 6, 6), h: sy1 - sy0, r: 6, stroke: 'ink', sw: 2, strokeOpacity: 0.8 }, mg);
      mg.guides = [
        S.line({ x1: sx0 - 3, y1: sy0, x2: px, y2: py + ph, stroke: 'muted', sw: 1.5, strokeOpacity: 0.7 }, mg),
        S.line({ x1: sx1 + 3, y1: sy0, x2: px + pw, y2: py + ph, stroke: 'muted', sw: 1.5, strokeOpacity: 0.7 }, mg),
      ];
      const panel = S.g(null, mg);
      S.rect({ x: px, y: py, w: pw, h: ph, r: 14, fill: C.BASE, filter: 'url(#shadow)' }, panel);
      const clipId = C.uid('inset');
      const cp = S.el('clipPath', { id: clipId }, panel);
      S.rect({ x: px + 1, y: py + 1, w: pw - 2, h: ph - 2, r: 13 }, cp).setAttribute('fill', '#fff');
      const cg = S.g({ 'clip-path': `url(#${clipId})`, 'data-audit': 'ignore' }, panel);   // a clipped picture
      (mo.content || contentDefault)(cg, M);
      S.rect({ x: px, y: py, w: pw, h: ph, r: 14, stroke: 'ink', sw: 2, strokeOpacity: 0.75 }, panel);
      const tag = mo.tag === false ? null : (mo.tag ?? `× ${C.sig(zoom, 2)}`);
      if (tag) mg.tagEl = S.text(tag, { x: px + pw - 18, y: py + 28, size: 24, anchor: 'end', weight: 600, color: 'muted', family: 'mono' }, mg);
      Object.assign(mg, { panel, content: cg, M });
      const s0 = Math.max((sx1 - sx0 + 6) / pw, 0.02);
      const closed = { x: (sx0 + sx1) / 2 - (px + pw / 2), y: (sy0 + sy1) / 2 - (py + ph / 2), s: s0, ox: px + pw / 2, oy: py + ph / 2 };
      S.xset(panel, closed);
      C.hide(mg.window); mg.guides.forEach(C.hide); C.hide(panel); if (mg.tagEl) C.hide(mg.tagEl);
      mg.open = (b = {}) => {
        const d = b.d ?? 0.9, t = gsap.timeline();
        t.add(C.draw(mg.window, { d: d * 0.3, ease: 'power2.out' }), 0);
        t.add(C.draw(mg.guides, { d: d * 0.45, ease: 'power2.inOut' }), d * 0.2);
        t.fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.15 }, d * 0.3);
        t.add(S.fx.xform(panel, { x: 0, y: 0, s: 1 }, { d: d * 0.6, ease: 'power3.out' }), d * 0.3);
        if (mg.tagEl) t.fromTo(mg.tagEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, d * 0.85);
        return t;
      };
      mg.close = (b = {}) => {
        const d = b.d ?? 0.7, t = gsap.timeline();
        if (mg.tagEl) t.to(mg.tagEl, { autoAlpha: 0, duration: 0.2 }, 0);
        t.add(S.fx.xform(panel, closed, { d: d * 0.6, ease: 'power3.in' }), 0);
        t.to(panel, { autoAlpha: 0, duration: d * 0.15 }, d * 0.5);
        t.to(mg.guides, { drawSVG: '0% 0%', duration: d * 0.35, ease: 'power2.in' }, d * 0.4);
        t.to(mg.window, { autoAlpha: 0, duration: d * 0.25 }, d * 0.75);
        return t;
      };
    }
    return mg;
  };

  // ---- copies of the tiny one, tiling the big one
  g.tile = (a = {}) => {
    const i = a.i ?? 1, into = a.into ?? 0;
    const unit = Math.max(lenAt(vals[i]), hair), rowI = g.rows[into];
    const k0 = inline && into === 0 && startOf(i) === x0 ? 1 : 0;
    const n = a.n ?? Math.round(lenAt(vals[into]) / unit);
    const tg = S.g(null, g);
    const clipId = C.uid('tile');
    const cp = S.el('clipPath', { id: clipId }, tg);
    const cr = S.rect({ x: x0 + k0 * unit, y: rowI.y - 2, w: 0.001, h: bh + 4 }, cp);
    cr.setAttribute('fill', '#fff');
    const inner = S.g({ 'clip-path': `url(#${clipId})` }, tg);
    const xa = x0 + k0 * unit, xz = x0 + n * unit;
    // one bar the shape of the whole (rounded like it); the clip shows only the copies stamped so far
    tg.copies = S.rect({ x: x0, y: rowI.y, w: xz - x0, h: bh, r: Math.min(8, bh / 2), fill: `url(#solid-${C.GRAD.includes(g.rows[i].tone) ? g.rows[i].tone : 'compute'})` }, inner);
    if (unit >= 3) {                      // a seam between every copy: they read as copies, not one bar
      let d = '';
      for (let k = Math.max(k0, 1); k < n; k++) d += `M${C.r2(x0 + k * unit)},${rowI.y + 3}v${bh - 6}`;
      tg.seams = S.path({ d, stroke: C.DARK, sw: unit >= 8 ? 1.5 : 1, strokeOpacity: 0.55, cap: 'butt' }, inner);
    }
    g.tiles = tg;
    let ctr = null;
    if (a.counter) {
      const c = a.counter;
      ctr = S.counter({ x: c.x ?? x0 + lenAt(vals[into]) / 2, y: c.y ?? rowI.y - 60, size: c.size ?? 48, anchor: c.anchor || 'middle', color: c.tone || g.rows[i].tone, value: k0 ? 1 : 0, fmt: c.fmt || S.fmt.int, prefix: c.prefix, suffix: c.suffix }, g);
      C.hide(ctr);
      g.tileCounter = ctr;
    }
    const set = v => {
      const k = Math.floor(v + 1e-6);
      cr.setAttribute('width', C.r2(Math.max(0.001, (k - k0) * unit)));
      if (ctr) ctr.textContent = (ctr.__prefix || '') + (ctr.__fmt)(Math.max(k, k0 ? 1 : 0)) + (ctr.__suffix || '');
    };
    C.hide(tg);
    const t = gsap.timeline();
    t.fromTo(tg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0);
    if (ctr) t.fromTo(ctr, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0);
    t.add(C.drive(k0, n, set, { d: a.d ?? 3.5, ease: a.ease || 'power2.in' }), 0);
    t.group = tg; t.counter = ctr;
    return t;
  };
  return g;
}


/**
 * libGrowthCurve — curves on axes that rescale live. By default the film's two shapes of growth:
 * Linear (teal, flat work per token) and Quadratic (amber, each token costs more), drawn schematic so
 * they meet at x = cross (10): at 10 tokens "about equal", at 10,000 the quadratic is 1,000× worse.
 * Any f(x) works (exponential lines on a log axis, falling curves, a step), so one chart serves
 * "two ways to grow", "compute ×80 vs bandwidth ×17" and "how fast a cache cools".
 * Ticks are live: when the domain changes, tick labels slide with it and fade in/out so they never
 * crowd, and curves, labels, marks and gap arrows all follow.
 *
 * o: {x = 1000, y = 260, w = 720, h = 500       the plot box (axes along its left and bottom edges),
 *     xmin = 0 (1 when xlog), xmax = 10, ymin = 0 (1 when ylog), ymax = 'auto' (8% above the highest curve)
 *     xlog = false, ylog = false,
 *     cross = 10                 default series meet here: linear n, quadratic n² / cross,
 *     series = [{id: 'linear', f: n => n, tone: 'helps', label: 'Linear'},
 *               {id: 'quadratic', f: n => n * n / cross, tone: 'compute', label: 'Quadratic'}]
 *                                each {id, f, tone, label, sw = 5, dash, from = xmin, to = Infinity (end of
 *                                the curve; past it .extend draws a dashed continuation), auto = true (counts
 *                                for ymax 'auto'), labelSize = 30},
 *     xticks, yticks = 'auto'    live nice ticks; or [v | {v, label}] fixed; or false,
 *     xfmt = num, yfmt = compact ('2,500', '250k', '2.5M'), tickSize = 24, minPx = [110, 54] (label spacing),
 *     xlabel = '', ylabel = '', title = '' (above the plot, left), tag = '' (above the plot, right: 'schematic'),
 *     grid = true (faint lines at y ticks),
 *     strip = false | {h = 76, label = ''}   a band under the x axis for per-step bars (.steps)}
 * Returns <g> with .axes .title .tagEl .xlabelEl .ylabelEl .curves{id: <path>} .labels{id: <g> (.text)}
 *   .series{id}, and .X(v) .Y(v) (at the current domain), .x .y .w .h
 * Helpers (return tweens/timelines; call in time order):
 *   .drawAxes({d = 0.8})          axes draw on, ticks/titles fade in
 *   .draw(id, {d = 1.4, to, ease}) draw a curve on from where it stands to x = to (default its end); its
 *                                 label rides at the tip; until it plays the curve is hidden
 *   .rescale({xmax, ymax = 'auto', xmin, ymin, d = 1.6})   the axes stretch (geometrically for big ratios)
 *   .extend(id, x2, {d = 1})      a dashed continuation past the series' end to x = x2
 *   .overshoot(id, {d = 1.2, top = -30})   the curve runs on, off the top of the frame
 *   .mark(x, {ids, label, tone = 'ink', guide = true, size = 26}) → <g> (.in() .out()): dots where the
 *                                 curves cross x, a dashed guide, a label above ('about equal')
 *   .gap(x, idA, idB, {label, sub, side = 'right', tone = 'ink'}) → <g> (.in() .out()): a double-headed
 *                                 arrow between two curves at x, labelled ('80 ÷ 17 ≈ 4.7×')
 *   .tag(id, text, {tone, size = 26}) → <text> (.in() .out()): a line under the series label ('× 1,000')
 *   .steps(id, {n = 10}) → <g>    per-step bars f(k) − f(k−1) in the strip, growing as the curve is drawn
 * Example:
 *   const gc = libGrowthCurve(S, { title: 'Two ways to grow', tag: 'schematic', xlabel: 'tokens', ylabel: 'total work' });
 *   S.add(gc.drawAxes(), 'b4'); S.add(gc.draw('linear'), 'b4~Linear'); S.add(gc.draw('quadratic'), 'b4~Quadratic');
 *   const eq = gc.mark(10, { label: 'about equal' }); S.add(eq.in(), 'b4~ten tokens');
 *   S.add(eq.out(), 'b4~ten thousand-0.3'); S.add(gc.rescale({ xmax: 10000 }), 'b4~ten thousand');
 */
function libGrowthCurve(S, o = {}, parent) {
  const C = _libChart, { L10 } = C;
  const g = S.g(null, parent);
  const x0 = o.x ?? 1000, y0 = o.y ?? 260, w = o.w ?? 720, h = o.h ?? 500;
  const xlog = !!o.xlog, ylog = !!o.ylog, cross = o.cross ?? 10;
  const isYears = spec => Array.isArray(spec) && spec.length > 0 && spec.every(t => { const v = typeof t === 'object' ? t.v : t; return Number.isInteger(v) && v >= 1800 && v <= 2200; });
  const strip = o.strip ? { h: 76, label: '', ...(o.strip === true ? {} : o.strip) } : null;
  const sH = strip ? strip.h + 10 : 0;
  const tsz = o.tickSize ?? 24;
  const minPx = o.minPx || [110, 54];
  const series = (o.series || [
    { id: 'linear', f: n => n, tone: 'helps', label: 'Linear' },
    { id: 'quadratic', f: n => n * n / cross, tone: 'compute', label: 'Quadratic' },
  ]).map(s => ({ sw: 5, from: null, to: Infinity, auto: true, labelSize: 30, ...s }));
  const byId = {};
  series.forEach(s => { byId[s.id] = s; });
  const sOf = id => { const s = byId[id]; if (!s) throw new Error(`libGrowthCurve: no series ${id}`); return s; };

  const autoY = (xmn, xmx, ymn) => {
    let top = -Infinity;
    for (const s of series) {
      if (!s.auto) continue;
      const a = Math.max(s.from ?? xmn, xmn), b = Math.min(s.to, xmx);
      for (let k = 0; k <= 64; k++) { const v = s.f(xlog ? 10 ** (L10(a) + (L10(b) - L10(a)) * k / 64) : a + (b - a) * k / 64); if (isFinite(v)) top = Math.max(top, v); }
    }
    if (!isFinite(top)) top = 1;
    return ylog ? top * 1.6 : ymn + (top - ymn) * 1.08;
  };
  const base = { xmin: o.xmin ?? (xlog ? 1 : 0), xmax: o.xmax ?? 10, ymin: o.ymin ?? (ylog ? 1 : 0) };
  base.ymax = o.ymax == null || o.ymax === 'auto' ? autoY(base.xmin, base.xmax, base.ymin) : o.ymax;
  const st = { ...base, reveal: {}, ext: {}, over: {} };
  series.forEach(s => { st.reveal[s.id] = s.to; st.ext[s.id] = null; st.over[s.id] = 0; });
  const plan = JSON.parse(JSON.stringify({ ...st, reveal: {}, ext: {}, over: {} }));
  series.forEach(s => { plan.reveal[s.id] = s.to; plan.ext[s.id] = null; plan.over[s.id] = 0; });
  const touched = {};

  const X = v => xlog ? x0 + (L10(v) - L10(st.xmin)) / (L10(st.xmax) - L10(st.xmin)) * w : x0 + (v - st.xmin) / (st.xmax - st.xmin) * w;
  const Y = v => {
    if (ylog) return v > 0 ? y0 + h - (L10(v) - L10(st.ymin)) / (L10(st.ymax) - L10(st.ymin)) * h : y0 + h + 1e5;
    return y0 + h - (v - st.ymin) / (st.ymax - st.ymin) * h;
  };
  const Xinv = px => xlog ? 10 ** (L10(st.xmin) + (px - x0) / w * (L10(st.xmax) - L10(st.xmin))) : st.xmin + (px - x0) / w * (st.xmax - st.xmin);

  // ---- layers
  const defs = S.el('defs', null, g);
  const gridG = S.g(null, g);
  g.axes = S.g(null, g);
  const stripG = S.g(null, g);
  const curveG = S.g(null, g);
  const markG = S.g(null, g);
  const labelG = S.g(null, g);
  const axisX = S.line({ x1: x0, y1: y0 + h, x2: x0 + w, y2: y0 + h, stroke: 'faint', sw: 2.5 }, g.axes);
  const axisY = S.line({ x1: x0, y1: y0, x2: x0, y2: y0 + h, stroke: 'faint', sw: 2.5 }, g.axes);
  const tickG = S.g(null, g.axes);
  if (strip) {
    S.line({ x1: x0, y1: y0 + h + sH, x2: x0 + w, y2: y0 + h + sH, stroke: 'faint', sw: 1.5, strokeOpacity: 0.6 }, stripG);
    if (strip.label) g.stripLabel = S.text(strip.label, { x: x0 - 16, y: y0 + h + sH - strip.h / 2, size: tsz, anchor: 'end', color: 'muted' }, stripG);
  }
  const tickY = y0 + h + sH + 34;
  if (o.title) g.title = S.text(o.title, { x: x0, y: y0 - 56, size: 34, weight: 650, color: 'ink', family: 'display' }, g);
  if (o.tag) g.tagEl = S.text(o.tag, { x: x0 + w, y: y0 - 52, size: 24, anchor: 'end', color: 'muted', weight: 500 }, g);
  if (o.xlabel) g.xlabelEl = S.text(o.xlabel, { x: x0 + w / 2, y: tickY + 44, size: 26, anchor: 'middle', color: 'muted', weight: 500 }, g.axes);
  if (o.ylabel) {
    g.ylabelEl = S.text(o.ylabel, { x: 0, y: 0, size: 26, anchor: 'middle', color: 'muted', weight: 500, maxW: h }, g.axes);
    g.ylabelEl.setAttribute('transform', `translate(${x0 - (o.ylabelGap ?? 126)},${y0 + h / 2}) rotate(-90)`);
  }

  // ---- curves: one path per series (+ a dashed extension), each clipped to the box (or beyond, overshooting)
  const xfmt = o.xfmt || (isYears(o.xticks) ? String : C.num), yfmt = o.yfmt || C.compact;
  series.forEach(s => {
    const cid = C.uid('gclip');
    const cp = S.el('clipPath', { id: cid }, defs);
    s.clip = S.rect({ x: x0 - 2, y: y0, w: w + 4, h: h + 2 }, cp);
    s.clip.setAttribute('fill', '#fff');
    const sg = S.g({ 'clip-path': `url(#${cid})` }, curveG);
    s.path = S.path({ d: '', stroke: s.tone, sw: s.sw, dash: s.dash }, sg);
    s.extPath = S.path({ d: '', stroke: s.tone, sw: s.sw - 1, dash: '10 9', strokeOpacity: 0.75, cap: 'butt' }, sg);
    s.labelWrap = S.g(null, labelG);
    s.labelText = s.label ? S.text(s.label, { x: 0, y: 0, size: s.labelSize, weight: 650, color: s.tone }, s.labelWrap) : null;
    s.tags = [];
    s.stepBars = null;
  });
  g.curves = {}; g.labels = {}; g.series = byId;
  series.forEach(s => { g.curves[s.id] = s.path; g.labels[s.id] = s.labelWrap; s.labelWrap.text = s.labelText; });

  // sample f on [a, b] into subpaths clipped to the band [top, bot] (crossings found exactly)
  const BAND = 40;
  function trace(f, a, b, top, bot, exitY) {
    if (!(b > a)) return { subs: [], tip: null, exit: null };
    const n = 180, xs = [];
    for (let k = 0; k <= n; k++) xs.push(xlog ? 10 ** (L10(a) + (L10(b) - L10(a)) * k / n) : a + (b - a) * k / n);
    const py = x => { const v = f(x); return isFinite(v) ? Y(v) : (v > 0 ? -1e9 : 1e9); };
    const inside = y => y >= top - BAND && y <= bot + BAND;
    const cross = (xa, xb, lim) => {          // x where py = lim between xa and xb
      let lo = xa, hi = xb;
      const sa = py(xa) - lim;
      for (let k = 0; k < 40; k++) { const m = xlog ? Math.sqrt(lo * hi) : (lo + hi) / 2; if ((py(m) - lim) * sa > 0) lo = m; else hi = m; }
      return xlog ? Math.sqrt(lo * hi) : (lo + hi) / 2;
    };
    const subs = []; let cur = null, exit = null;
    for (let k = 0; k <= n; k++) {
      const x = xs[k], y = py(x);
      const inn = inside(y);
      if (k > 0) {
        const xp = xs[k - 1], yp = py(xp), innP = inside(yp);
        if (innP && !inn) { const lim = y < top - BAND ? top - BAND : bot + BAND; const xc = cross(xp, x, lim); cur.push([X(xc), lim]); cur = null; }
        else if (!innP && inn) { const lim = yp < top - BAND ? top - BAND : bot + BAND; const xc = cross(xp, x, lim); cur = [[X(xc), lim]]; subs.push(cur); }
        if (exit == null && yp >= exitY && y < exitY) exit = cross(xp, x, exitY);
      }
      if (inn) { if (!cur) { cur = []; subs.push(cur); } cur.push([X(x), y]); }
    }
    const last = subs.length ? subs[subs.length - 1] : null;
    const tipPt = last && last.length ? last[last.length - 1] : null;
    return { subs, tip: tipPt, exit };
  }
  const dOf = subs => subs.filter(s => s.length > 1).map(s => s.map((p, i) => `${i ? 'L' : 'M'}${C.r2(p[0])},${C.r2(p[1])}`).join('')).join(' ');

  // ---- live ticks
  const pool = new Map();
  const tickEl = (axis, v, label) => {
    const key = `${axis}:${v}`;
    if (!pool.has(key)) {
      const e = { axis, v };
      e.text = S.text(label, { x: 0, y: 0, size: tsz, anchor: axis === 'x' ? 'middle' : 'end', color: 'muted', family: 'mono' }, tickG);
      e.mark = S.line(axis === 'x' ? { x1: 0, y1: y0 + h, x2: 0, y2: y0 + h + 10, stroke: 'faint', sw: 2 } : { x1: x0 - 10, y1: 0, x2: x0, y2: 0, stroke: 'faint', sw: 2 }, tickG);
      if (axis === 'y' && o.grid !== false) e.grid = S.line({ x1: x0, y1: 0, x2: x0 + w, y2: 0, stroke: '#ffffff', sw: 1.5, strokeOpacity: 0.06 }, gridG);
      pool.set(key, e);
    }
    return pool.get(key);
  };
  const fixedTicks = (spec, mn, mx, log) => spec.map(t => (typeof t === 'object' ? t : { v: t })).filter(t => t.v >= mn * (1 - 1e-9) && t.v <= mx * (1 + 1e-9) + (log ? 0 : 1e-9)).map(t => ({ v: t.v, label: t.label, op: 1 }));
  function renderTicks() {
    for (const e of pool.values()) { e.text.setAttribute('opacity', 0); e.mark.setAttribute('opacity', 0); if (e.grid) e.grid.setAttribute('opacity', 0); }
    const xs = o.xticks === false ? [] : Array.isArray(o.xticks) ? fixedTicks(o.xticks, st.xmin, st.xmax, xlog) : (xlog ? C.logTicks : C.linTicks)(st.xmin, st.xmax, w, minPx[0]);
    const ys = o.yticks === false ? [] : Array.isArray(o.yticks) ? fixedTicks(o.yticks, st.ymin, st.ymax, ylog) : (ylog ? C.logTicks : C.linTicks)(st.ymin, st.ymax, h, minPx[1]);
    for (const t of xs) {
      const e = tickEl('x', t.v, t.label ?? xfmt(t.v)), x = X(t.v);
      if (x < x0 - 1 || x > x0 + w + 1) continue;
      e.text.setAttribute('x', C.r2(x)); e.text.setAttribute('y', tickY); e.text.setAttribute('opacity', C.r2(t.op));
      e.mark.setAttribute('x1', C.r2(x)); e.mark.setAttribute('x2', C.r2(x)); e.mark.setAttribute('opacity', C.r2(t.op));
    }
    for (const t of ys) {
      const e = tickEl('y', t.v, t.label ?? yfmt(t.v)), y = Y(t.v);
      if (y < y0 - 1 || y > y0 + h + 1) continue;
      e.text.setAttribute('x', x0 - 18); e.text.setAttribute('y', C.r2(y)); e.text.setAttribute('opacity', C.r2(t.op));
      e.mark.setAttribute('y1', C.r2(y)); e.mark.setAttribute('y2', C.r2(y)); e.mark.setAttribute('opacity', C.r2(t.op));
      if (e.grid && Math.abs(y - (y0 + h)) > 2) { e.grid.setAttribute('y1', C.r2(y)); e.grid.setAttribute('y2', C.r2(y)); e.grid.setAttribute('opacity', C.r2(t.op)); }
    }
  }

  // ---- render everything from the state
  const marks = [], gaps = [];
  function render() {
    renderTicks();
    const blocks = [];
    series.forEach(s => {
      const a = s.from ?? st.xmin;
      const ov = st.over[s.id];
      const top = C.lerp(y0, o.overTop ?? -40, C.smooth(ov * 3)), right = C.lerp(x0 + w, 1990, ov);
      s.clip.setAttribute('y', C.r2(top)); s.clip.setAttribute('height', C.r2(y0 + h + 2 - top)); s.clip.setAttribute('width', C.r2(right - x0 + 2));
      // drawn from a to the reveal point, never past the series' end or the visible right edge
      const endX = Math.max(a, Math.min(st.reveal[s.id], s.to, Xinv(right)));
      const tr = trace(s.f, a, endX, top, y0 + h, y0);
      s.path.setAttribute('d', dOf(tr.subs));
      // extension
      if (st.ext[s.id] != null && s.to !== Infinity) {
        const te = trace(s.f, s.to, Math.min(st.ext[s.id], Xinv(right)), top, y0 + h, y0);
        s.extPath.setAttribute('d', dOf(te.subs));
      } else s.extPath.setAttribute('d', '');
      // label block at the tip, or where the curve leaves the top of the box
      const visEnd = Math.min(s.to, st.xmax);
      const frac = visEnd > a ? (Math.min(st.reveal[s.id], visEnd) - a) / (visEnd - a) : 1;
      const op = C.smooth((frac - 0.12) / 0.2);
      let lx = null, ly = null, anchor = 'start';
      const pos = ov > 0 ? 'above' : (s.labelPos || 'end');
      const exitIn = tr.exit != null && X(tr.exit) <= x0 + w + 0.5;
      // the point the label hangs on: where the curve leaves the box's top, else its last point inside the box
      let tip = null;
      if (exitIn) tip = [X(tr.exit), y0];
      else if (tr.tip) {
        const tx = Math.min(endX, st.xmax), ty = Y(s.f(tx));
        tip = endX > st.xmax || tr.tip[0] > x0 + w ? [X(tx), Math.max(ty, y0)] : tr.tip;
      }
      if (tip) {
        if (pos === 'above') { lx = tip[0] - 12; ly = Math.max(tip[1] - 30, y0 + 14); anchor = 'end'; }
        else if (pos === 'below') { lx = tip[0] + 12; ly = tip[1] + 30; }
        else if (exitIn) { lx = tip[0] + 16; ly = y0 + 22; }
        else { lx = tip[0] + 16; ly = Math.max(tip[1], y0 + 14); }
      }
      if (lx != null && (s.labelText || s.tags.length)) blocks.push({ s, lx, ly, op, anchor, free: pos !== 'end', n: (s.labelText ? 1 : 0) + s.tags.length });
      else if (s.labelText) s.labelText.setAttribute('opacity', 0);
      // per-step bars
      if (s.stepBars) {
        const n = s.stepBars.n, k = s.stepBars.k, sg = s.stepBars.g;
        const slotW = X(1) - X(0), bwid = Math.max(1, Math.min(slotW * 0.72 / k, 46)), idx = s.stepBars.idx;
        const smax = stepMax();
        s.stepBars.bars.forEach((b, j) => {
          const i1 = j + 1, dv = s.f(i1) - s.f(j);
          const grow = C.clamp(st.reveal[s.id] - j, 0, 1);
          const bh_ = Math.max(0, (strip.h - 8) * dv / smax * grow);
          const cx = X(j + 0.5) + (idx - (k - 1) / 2) * bwid * 1.08;
          b.setAttribute('x', C.r2(cx - bwid / 2)); b.setAttribute('width', C.r2(bwid));
          b.setAttribute('y', C.r2(y0 + h + sH - bh_)); b.setAttribute('height', C.r2(Math.max(bh_, 0.001)));
          b.setAttribute('opacity', grow > 0 ? C.clamp((slotW - 3) / 9, 0, 1) : 0);
        });
        void sg;
      }
    });
    // label blocks: keep them apart vertically
    const LH = 34;
    const ends = blocks.filter(b => !b.free).sort((p, q) => p.ly - q.ly);
    for (let i = 1; i < ends.length; i++) {
      const p = ends[i - 1], q = ends[i];
      const need = p.ly + (p.n - 1) * LH + LH + 4;
      if (q.ly < need && Math.abs(q.lx - p.lx) < 260) q.ly = need;
    }
    blocks.forEach(b => {
      // an 'above' block grows upwards from its anchor line
      let yy = b.anchor === 'end' ? b.ly - (b.n - 1) * LH : b.ly;
      const put = (t, op) => { t.setAttribute('x', C.r2(b.lx)); t.setAttribute('y', C.r2(yy)); t.setAttribute('text-anchor', b.anchor); if (op != null) t.setAttribute('opacity', C.r2(op)); yy += LH; };
      if (b.s.labelText) put(b.s.labelText, b.op);
      b.s.tags.forEach(t => put(t));
    });
    // marks and gaps follow the domain
    marks.forEach(m => m.place());
    gaps.forEach(m => m.place());
  }
  let stepMaxV = 1;
  const stepMax = () => stepMaxV;
  render();

  Object.assign(g, { X, Y, x: x0, y: y0, w, h });

  // ------------------------------------------------------------------ helpers
  g.drawAxes = (a = {}) => {
    const d = a.d ?? 0.8, t = gsap.timeline();
    t.add(C.draw([axisY, axisX], { d, ease: 'power2.out', stagger: 0.1 }), 0);
    t.add(C.fadeIn([tickG, gridG, stripG], { d: 0.5 }), d * 0.4);
    t.add(C.fadeIn([g.xlabelEl, g.ylabelEl, g.title, g.tagEl].filter(Boolean), { d: 0.5, stagger: 0.08 }), d * 0.5);
    return t;
  };
  g.draw = (id, a = {}) => {
    const s = sOf(id);
    const a0 = s.from ?? base.xmin;
    if (!touched[id]) { touched[id] = true; st.reveal[id] = a0; plan.reveal[id] = a0; render(); }
    // drawn to its natural end, a curve then stays whole through later rescales (reveal = its end, ∞ if open)
    const natural = a.to == null;
    const from = Math.min(plan.reveal[id], natural && s.to === Infinity ? plan.xmax : s.to);
    const to = a.to ?? (s.to === Infinity ? plan.xmax : s.to);
    const fin = natural ? s.to : to;
    plan.reveal[id] = fin;
    return C.drive(from, to, v => { st.reveal[id] = v >= to - 1e-9 * Math.max(1, Math.abs(to)) ? fin : v; render(); },
      { d: a.d ?? 1.4, ease: a.ease || 'power1.inOut' });
  };
  g.rescale = (a = {}) => {
    const f0 = { xmin: plan.xmin, xmax: plan.xmax, ymin: plan.ymin, ymax: plan.ymax };
    const f1 = { xmin: a.xmin ?? f0.xmin, xmax: a.xmax ?? f0.xmax, ymin: a.ymin ?? f0.ymin };
    f1.ymax = a.ymax == null || a.ymax === 'auto' ? autoY(f1.xmin, f1.xmax, f1.ymin) : a.ymax;
    Object.assign(plan, f1);
    const geo = (p, q) => p > 0 && q > 0 && (q / p > 3 || p / q > 3);
    const mix = (p, q, t) => (geo(p, q) ? p * (q / p) ** t : C.lerp(p, q, t));
    return C.drive(0, 1, t => {
      for (const k of ['xmin', 'xmax', 'ymin', 'ymax']) st[k] = mix(f0[k], f1[k], t);
      render();
    }, { d: a.d ?? 1.6, ease: a.ease || 'power2.inOut' });
  };
  g.extend = (id, x2, a = {}) => {
    const s = sOf(id);
    if (s.to === Infinity) { S.warn(`libGrowthCurve.extend: series ${id} has no 'to'`); return gsap.timeline(); }
    const from = plan.ext[id] ?? s.to;
    plan.ext[id] = x2;
    return C.drive(from, x2, v => { st.ext[id] = v; render(); }, { d: a.d ?? 1, ease: a.ease || 'power1.inOut' });
  };
  g.overshoot = (id, a = {}) => {
    // the box stops clipping this curve: it runs on past the box's edge and off the top of the frame
    const o0 = plan.over[id];
    plan.over[id] = 1;
    const r0 = plan.reveal[id];
    plan.reveal[id] = Infinity;
    return C.drive(o0, 1, v => { st.over[id] = v; st.reveal[id] = v > o0 ? Infinity : r0; render(); }, { d: a.d ?? 1.2, ease: a.ease || 'power1.in' });
  };
  const annot = (gg, inFn) => {
    gg.in = inFn || ((b = {}) => gsap.fromTo(gg, { autoAlpha: 0 }, { autoAlpha: 1, duration: b.d ?? 0.45, ease: 'power2.out' }));
    gg.out = (b = {}) => C.fadeOut(gg, { d: b.d ?? 0.35 });
    return gg;
  };
  g.mark = (xv, a = {}) => {
    const mg = S.g(null, markG);
    const ids = a.ids || series.map(s => s.id), tone = a.tone || 'ink';
    mg.guide = a.guide === false ? null : S.line({ x1: 0, y1: 0, x2: 0, y2: 0, stroke: tone, sw: 2, dash: '6 7', strokeOpacity: 0.6, cap: 'butt' }, mg);
    mg.dots = ids.map(id => S.circle({ x: 0, y: 0, r: 9, fill: sOf(id).tone, stroke: C.DARK, sw: 2.5 }, mg));
    const side = a.side || 'left';
    mg.label = a.label ? S.text(a.label, { x: 0, y: 0, size: a.size ?? 26, anchor: side === 'left' ? 'end' : side === 'right' ? 'start' : 'middle', weight: 600, color: tone }, mg) : null;
    mg.place = () => {
      const x = X(xv), ys = ids.map(id => Y(sOf(id).f(xv)));
      const top = Math.min(...ys), vis = x >= x0 - 1 && x <= x0 + w + 1;
      mg.dots.forEach((d, i) => { d.setAttribute('cx', C.r2(x)); d.setAttribute('cy', C.r2(ys[i])); d.setAttribute('opacity', vis && ys[i] >= y0 - 1 ? 1 : 0); });
      if (mg.guide) { mg.guide.setAttribute('x1', C.r2(x)); mg.guide.setAttribute('x2', C.r2(x)); mg.guide.setAttribute('y1', y0 + h); mg.guide.setAttribute('y2', C.r2(Math.max(top + 14, y0))); mg.guide.setAttribute('opacity', vis ? 1 : 0); }
      if (mg.label) {
        const lx = side === 'left' ? x - 16 : side === 'right' ? x + 16 : x;
        mg.label.setAttribute('x', C.r2(lx)); mg.label.setAttribute('y', C.r2(Math.max(top - (side === 'above' ? 34 : 26), y0 - 20))); mg.label.setAttribute('opacity', vis ? 1 : 0);
      }
    };
    marks.push(mg); mg.place();
    return annot(mg, (b = {}) => {
      const t = gsap.timeline();
      t.set(mg, { autoAlpha: 1 }, 0);
      if (mg.guide) t.fromTo(mg.guide, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0);
      t.fromTo(mg.dots, { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2.6)', stagger: 0.06 }, 0.05);
      if (mg.label) t.fromTo(mg.label, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 0.15);
      return t;
    });
  };
  g.gap = (xv, ia, ib, a = {}) => {
    const gg = S.g(null, markG);
    const tone = a.tone || 'ink', right = (a.side || 'right') === 'right';
    gg.line = S.line({ x1: 0, y1: 0, x2: 0, y2: 0, stroke: tone, sw: 2.5 }, gg);
    gg.heads = [S.path({ d: '', stroke: tone, sw: 2.5 }, gg), S.path({ d: '', stroke: tone, sw: 2.5 }, gg)];
    gg.label = a.label ? S.text(a.label, { x: 0, y: 0, size: a.size ?? 28, weight: 650, color: tone, anchor: right ? 'start' : 'end' }, gg) : null;
    gg.sub = a.sub ? S.text(a.sub, { x: 0, y: 0, size: 24, weight: 500, color: 'muted', anchor: right ? 'start' : 'end' }, gg) : null;
    gg.place = () => {
      const x = X(xv) + (a.dx ?? 0);
      let ya = Y(sOf(ia).f(xv)), yb = Y(sOf(ib).f(xv));
      if (ya > yb) [ya, yb] = [yb, ya];
      const p = 6;
      gg.line.setAttribute('x1', C.r2(x)); gg.line.setAttribute('x2', C.r2(x)); gg.line.setAttribute('y1', C.r2(ya + p)); gg.line.setAttribute('y2', C.r2(yb - p));
      gg.heads[0].setAttribute('d', C.headD(x, ya + p, 0, -1, 12)); gg.heads[1].setAttribute('d', C.headD(x, yb - p, 0, 1, 12));
      const my = (ya + yb) / 2 + (a.dy ?? 0), lx = right ? x + 18 : x - 18;
      if (gg.label) { gg.label.setAttribute('x', C.r2(lx)); gg.label.setAttribute('y', C.r2(my - (gg.sub ? 15 : 0))); }
      if (gg.sub) { gg.sub.setAttribute('x', C.r2(lx)); gg.sub.setAttribute('y', C.r2(my + 19)); }
    };
    gaps.push(gg); gg.place();
    return annot(gg, (b = {}) => {
      const t = gsap.timeline();
      t.set(gg, { autoAlpha: 1 }, 0);
      t.fromTo([gg.line, ...gg.heads], { autoAlpha: 0, scaleY: 0.2, transformOrigin: '50% 50%' }, { autoAlpha: 1, scaleY: 1, duration: b.d ?? 0.5, ease: 'power3.out' }, 0);
      const txt = [gg.label, gg.sub].filter(Boolean);
      if (txt.length) t.fromTo(txt, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.08 }, 0.2);
      return t;
    });
  };
  g.tag = (id, text, a = {}) => {
    const s = sOf(id);
    const t = S.text(text, { x: 0, y: 0, size: a.size ?? 26, weight: 600, color: a.tone || s.tone, family: a.mono === false ? 'sans' : 'mono' }, s.labelWrap);
    s.tags.push(t);
    render();
    t.in = (b = {}) => gsap.fromTo(t, { autoAlpha: 0 }, { autoAlpha: 1, duration: b.d ?? 0.45, ease: 'power2.out' });
    t.out = (b = {}) => C.fadeOut(t, { d: b.d ?? 0.35 });
    return t;
  };
  g.steps = (id, a = {}) => {
    const s = sOf(id);
    if (!strip) { S.warn('libGrowthCurve.steps needs o.strip'); return S.g(null, stripG); }
    const n = a.n ?? 10;
    const sg = S.g(null, stripG);
    const bars = [];
    for (let j = 0; j < n; j++) bars.push(S.rect({ x: 0, y: 0, w: 1, h: 1, r: 3, fill: C.solid(S, s.tone) }, sg));
    const idx = series.filter(q => q.stepBars).length;
    s.stepBars = { n, bars, g: sg, k: 1, idx };
    const all = series.filter(q => q.stepBars);
    all.forEach(q => { q.stepBars.k = all.length; });
    stepMaxV = Math.max(1e-12, ...all.map(q => { let m = 0; for (let j = 1; j <= q.stepBars.n; j++) m = Math.max(m, q.f(j) - q.f(j - 1)); return m; }));
    render();
    return sg;
  };
  return g;
}
