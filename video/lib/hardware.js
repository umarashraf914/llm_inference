/* video/lib/hardware.js — shared film library: hardware.
 *
 *   libChip(S, o, parent)        a compact stylised accelerator chip at any size: pins, die, a fine grid of
 *                                cores, name label. With hbm: n it is a small GPU package icon instead (die
 *                                flanked by coral HBM stacks). States idle / on / busy, sparks, flash, draw-on.
 *   libChipGrid(S, o, parent)    rows × cols of libChip: "thousands of chips", a server's GPUs, a fan of chips
 *   libSpecSheet(S, o, parent)   a chip specification card: header (chip icon + name) and rows of
 *                                label · value · tag; placeholders that resolve, focus one row, count, flip
 *   libServer(S, o, parent)      a rack-mount server, front view: drive bays, vents, status lights, badge,
 *                                a spinner for "generating", and a drawer that opens onto its GPUs
 *   libRack(S, o, parent)        a rack cabinet of server units with status lights, optionally tinted
 *   libDataCentre(S, o, parent)  a row of racks (an aisle) or a hall of rows, optionally inside a building
 *                                with roof fans; one unit can be a real libServer for camera pull-backs
 *   libDevice(S, o, parent)      the user's end of a request: a laptop (lid closes and opens) or a phone,
 *                                with a live screen, an optional chip inside, ports for cables
 *
 * Which chip drawing to use:
 *   libChip            icon to medium size (20–300 px): rows of chips, a chip in a card, a chip at the end of a
 *                      pipe, the GPUs inside a server, a "GPU icon" leading a table row (hbm: 1–2).
 *   S.gpu (engine)     the detailed GPU package illustration (die, 3 stacks a side, wide buses with .__d for
 *                      S.flow, 'compute die' / 'HBM' labels): the hero package of chapters 2, 6, 9, 12, 13.
 *   The two share one look (amber die, coral stacks, blue slab) so a libChip can stand in for S.gpu at small size.
 *
 * Conventions (all functions):
 * - Build with S primitives into `parent` (default S.main). Everything is visible as built, except what an
 *   option says starts hidden (e.g. libSpecSheet start: 'placeholder'). Use S.fx.in / fx.pop on the ROOT for
 *   entrances, or the component's own .drawOn() / .reveal().
 * - Helpers RETURN tweens or timelines: place them with S.add(tween, at). Nothing here adds to S.tl, reads
 *   the clock or uses Math.random (seeded with S.rand), so any frame is the same however it is reached.
 * - Helpers that change a state (setState, focus, power, open, close, glow, sleep…) plan it like fx.xform
 *   does: call one component's state helpers in time order. They may overlap in time: a later one takes over
 *   as soon as it starts, the same whether the frame is reached playing forwards or seeking backwards.
 *   Effects (compute, activity, blink, flash, ping, pulse) are independent layers and overlap freely.
 * - The root's transform is yours: fx.in/fx.pop it, or S.xset/fx.xform it (not both on the same element;
 *   wrap in a S.g() holder if you need both). Helpers only ever animate inner parts.
 * - Coordinates are in the parent's space. Objects (chip, server, rack, data centre, device) are placed by
 *   their CENTRE (x, y); panels (spec sheet) by their top-left corner, like S.card.
 * - Colour = meaning: amber compute (the chip, its cores, activity lights), coral bytes (HBM stacks),
 *   teal helps (power / healthy light, a highlighted machine that helps), blue struct (package slab,
 *   screens, neutral data). Text is ink or muted. All readable text is ≥ 24 px; decorative micro-detail
 *   (cores, bays, vents, LEDs) is marked data-audit="ignore".
 */

/* ------------------------------------------------------------------ private helpers */
var _libHW = (function () {
  const NS = 'http://www.w3.org/2000/svg';
  const GRAD = ['compute', 'bytes', 'helps', 'struct', 'violet', 'neutral'];
  const BASE = '#0c1326', DARK = '#0a0f1e', GREY = '#8d97b3';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const f2 = v => Math.round(v * 100) / 100;
  const smooth = t => t * t * (3 - 2 * t);
  let uid = 0;
  const nextId = p => `${p}-${++uid}`;

  function hexRGB(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  /** mix two colours (tone names or hex): t = 0 → a, 1 → b */
  function mix(S, a, b, t) {
    const A = hexRGB(S.tone(a)), B = hexRGB(S.tone(b));
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * clamp(t, 0, 1)).toString(16).padStart(2, '0')).join('');
  }
  /** card gradient for a tone when the engine has one, else the flat colour */
  const soft = (S, tone) => (GRAD.includes(tone) ? `url(#card-${tone})` : S.tone(tone));

  /** gradients this library uses, added to the film's <defs> once per scene load */
  function defs() {
    if (document.getElementById('hw-body')) return;
    const d = document.querySelector('#film defs');
    if (!d) return;
    const mk = (tag, attrs, p) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); p.appendChild(e); return e; };
    const lin = (id, stops, dir = [0, 0, 0, 1]) => {
      const g = mk('linearGradient', { id, x1: dir[0], y1: dir[1], x2: dir[2], y2: dir[3] }, d);
      stops.forEach(([o, c, a]) => mk('stop', { offset: o, 'stop-color': c, 'stop-opacity': a ?? 1 }, g));
    };
    lin('hw-body', [[0, '#2e2414'], [1, '#161109']]);            // chip package: warm dark
    lin('hw-die', [[0, '#231a0b'], [1, '#110c05']]);             // silicon die
    lin('hw-sheen', [[0, '#ffffff', 0.13], [0.42, '#ffffff', 0.02], [1, '#ffffff', 0]], [0, 0, 1, 1]);
    lin('hw-slab', [[0, '#172647'], [1, '#0e1731']]);            // GPU package substrate (blue slab)
    lin('hw-hbm', [[0, '#3b1820'], [1, '#230f16']]);             // HBM stack
    lin('hw-steel', [[0, '#26334f'], [0.5, '#1c2741'], [1, '#151e34']]);   // server chassis
    lin('hw-cab', [[0, '#141d33'], [1, '#0b1222']]);             // rack cabinet
    lin('hw-glass', [[0, '#13213f'], [1, '#0a1226']]);           // screens
    lin('hw-glass-on', [[0, '#1b3466'], [1, '#0e1c3d']]);
    lin('hw-shell', [[0, '#26324f'], [1, '#18223a']]);           // laptop lid back / phone back
    lin('hw-hall', [[0, '#101a34'], [1, '#080e1c']]);            // data-centre interior
  }

  /** a libChip's drawn extent {w, h} (pins / slab included, label excluded) for a body size and stack count */
  function chipExtent(s, hbm) {
    if (hbm) return { w: s * 2.04, h: s * 1.24 };
    const n = Math.round(clamp(s / 16, 2, 10)), pl = clamp(s * 0.07, 3, 15), pt = clamp(s * 0.76 / n * 0.32, 1.3, 5.5);
    return { w: s + 2 * pl + pt, h: s + 2 * pl + pt, pl, pt, n };
  }

  /** rounded-rectangle subpath (for batched paths) */
  function rr(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    return `M${f2(x + r)},${f2(y)}h${f2(w - 2 * r)}a${f2(r)},${f2(r)} 0 0 1 ${f2(r)},${f2(r)}v${f2(h - 2 * r)}a${f2(r)},${f2(r)} 0 0 1 ${f2(-r)},${f2(r)}` +
      `h${f2(-(w - 2 * r))}a${f2(r)},${f2(r)} 0 0 1 ${f2(-r)},${f2(-r)}v${f2(-(h - 2 * r))}a${f2(r)},${f2(r)} 0 0 1 ${f2(r)},${f2(-r)}z`;
  }
  /** circle subpath */
  const circ = (x, y, r) => `M${f2(x - r)},${f2(y)}a${f2(r)},${f2(r)} 0 1 0 ${f2(2 * r)},0a${f2(r)},${f2(r)} 0 1 0 ${f2(-2 * r)},0z`;

  /** explicit transform: scale (sx, sy) about (cx, cy), then translate (dx, dy); rotation a degrees about (cx, cy) */
  function xf(el, cx, cy, sx = 1, sy = sx, dx = 0, dy = 0, a = 0) {
    el.setAttribute('transform', `translate(${f2(cx + dx)},${f2(cy + dy)})${a ? ` rotate(${f2(a)})` : ''} scale(${sx.toFixed(4)},${sy.toFixed(4)}) translate(${f2(-cx)},${f2(-cy)})`);
  }

  /** a value tween on a proxy that re-renders through `apply`, seek-safe in both directions */
  function drive(from, to, apply, o = {}) {
    const p = { v: from };
    const go = () => apply(p.v);
    return gsap.fromTo(p, { v: from }, {
      v: to, duration: o.d ?? 0.8, ease: o.ease || 'power2.inOut', immediateRender: false,
      onStart: go, onUpdate: go, onReverseComplete: () => apply(from),
    });
  }
  /**
   * A channel of planned drives on one piece of state (a chip's core levels, a server's power light…).
   * Helpers on one component are created in time order, so a drive created later is scheduled later. When two
   * overlap, the earlier one stands aside as soon as the later one has started: GSAP renders a timeline's
   * children in reverse order when seeking backwards, and without this the frame would depend on direction.
   */
  function channel() {
    const list = [];
    return (from, to, apply, o) => {
      const idx = list.length, me = {};
      list.push(me);
      me.tw = drive(from, to, v => {
        for (let k = idx + 1; k < list.length; k++) if (list[k].tw.progress() > 0) return;
        apply(v);
      }, o);
      return me.tw;
    };
  }
  /** swap a text element's content with a quick fade through zero; pure function of progress */
  function swapText(el, from, to, o = {}, set, ch) {
    const put = set || (t => { el.textContent = t; });
    return (ch || drive)(0, 1, p => {
      put(p < 0.5 ? from : to);
      el.style.opacity = Math.abs(1 - 2 * p).toFixed(3);
    }, { d: o.d ?? 0.45, ease: 'none' });
  }
  /** '3.35 TB/s' → ['3.35', 'TB/s']; '?' → ['?', '']: numbers set in mono, units in sans */
  function splitUnit(v) {
    const m = String(v).match(/^(.*?\d[\d.,]*|\?)\s+([^\d\s].*)$/);
    return m ? [m[1], m[2]] : [String(v), ''];
  }
  /** write a value into a <text> as a mono number tspan and a smaller sans unit tspan */
  function setValueText(el, v, o) {
    const [num, unit] = o.unit != null ? [String(v), o.unit] : splitUnit(v);
    while (el.firstChild) el.removeChild(el.firstChild);
    const a = document.createElementNS(NS, 'tspan');
    a.textContent = num; a.setAttribute('font-family', "'JetBrains Mono'");
    el.appendChild(a);
    if (unit) {
      const b = document.createElementNS(NS, 'tspan');
      b.textContent = '\u2009' + unit;
      b.setAttribute('font-family', "'Inter'"); b.setAttribute('font-size', o.unitSize); b.setAttribute('font-weight', 550);
      if (o.unitColor) b.setAttribute('fill', o.unitColor);
      el.appendChild(b);
    }
    return { num, unit };
  }
  /** width of a value written by setValueText */
  function valueWidth(S, v, o) {
    const [num, unit] = o.unit != null ? [String(v), o.unit] : splitUnit(v);
    return S.measure(num, { size: o.size, weight: 600, family: 'mono' }) + (unit ? S.measure('\u2009' + unit, { size: o.unitSize, weight: 550 }) : 0);
  }
  /** a seeded permutation rank: rank[i] in 0..n-1 */
  function ranks(S, n, seed) {
    const r = S.rand(seed || 1);
    const keys = Array.from({ length: n }, (_, i) => [r(), i]).sort((a, b) => a[0] - b[0]);
    const out = new Array(n);
    keys.forEach(([, i], k) => { out[i] = k; });
    return out;
  }
  /** selection → index list. number | [i, j, …] | 'all' */
  function sel(s, n) {
    if (s === 'all' || s == null) return Array.from({ length: n }, (_, i) => i);
    if (typeof s === 'number') return s >= 0 && s < n ? [s] : [];
    return s.filter(i => i >= 0 && i < n);
  }
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };

  /** label (+ optional sub) placed below / above / right of a box {l, r, t, b, cx, cy} */
  function label(S, g, box, o) {
    if (o.label == null || o.label === '') return {};
    const size = o.labelSize, pos = o.labelPos || 'below';
    const lg = S.g(null, g);
    const subSize = o.subSize ?? Math.max(24, Math.round(size * 0.78));
    let el, sub;
    const col = o.labelTone || 'ink';
    if (pos === 'right') {
      const x = box.r + (o.labelGap ?? 18);
      const y = o.sub ? box.cy - subSize * 0.62 : box.cy;
      el = S.text(o.label, { x, y, size, weight: 650, color: col, family: o.labelFamily || 'sans' }, lg);
      if (o.sub) sub = S.text(o.sub, { x, y: box.cy + size * 0.5, size: subSize, weight: 500, color: 'muted' }, lg);
    } else if (pos === 'above') {
      const y = box.t - (o.labelGap ?? 12) - size * 0.62 - (o.sub ? subSize * 1.25 : 0);
      el = S.text(o.label, { x: box.cx, y, size, weight: 650, color: col, anchor: 'middle', family: o.labelFamily || 'sans' }, lg);
      if (o.sub) sub = S.text(o.sub, { x: box.cx, y: y + size * 0.6 + subSize * 0.65, size: subSize, weight: 500, color: 'muted', anchor: 'middle' }, lg);
    } else {
      const y = box.b + (o.labelGap ?? 12) + size * 0.62;
      el = S.text(o.label, { x: box.cx, y, size, weight: 650, color: col, anchor: 'middle', family: o.labelFamily || 'sans' }, lg);
      if (o.sub) sub = S.text(o.sub, { x: box.cx, y: y + size * 0.6 + subSize * 0.65, size: subSize, weight: 500, color: 'muted', anchor: 'middle' }, lg);
    }
    return { g: lg, el, sub };
  }

  /** a small badge: a disc with an icon, or a pill with text. Returns <g> with .bg .iconEl .labelEl */
  function badge(S, g, x, y, b, scale) {
    const tone = b.tone || 'struct';
    const bg = S.g(null, g);
    if (b.text) {
      const size = Math.max(24, Math.round((b.size ?? 26)));
      const pw = S.measure(b.text, { size, weight: 650 }) + 30 + (b.icon ? size + 8 : 0), ph = size * 1.7;
      const left = x - pw / 2;
      S.rect({ x: left, y: y - ph / 2, w: pw, h: ph, r: ph / 2, fill: BASE }, bg);
      bg.bg = S.rect({ x: left, y: y - ph / 2, w: pw, h: ph, r: ph / 2, fill: soft(S, tone), stroke: tone, strokeOpacity: 0.85, sw: 2 }, bg);
      let tx = x;
      if (b.icon) { bg.iconEl = S.icon(b.icon, { x: left + 15 + size / 2, y, size: size * 1.05, color: tone }, bg); tx = left + 15 + size + 8 + (pw - 30 - size - 8) / 2; }
      bg.labelEl = S.text(b.text, { x: tx, y: y + 1, size, weight: 650, anchor: 'middle', color: 'ink' }, bg);
      Object.assign(bg, { w: pw, h: ph, cx: x, cy: y });
    } else {
      const r = Math.max(16, (b.r ?? 22) * (scale || 1));
      S.circle({ x, y, r, fill: BASE }, bg);
      bg.bg = S.circle({ x, y, r, fill: soft(S, tone), stroke: tone, strokeOpacity: 0.9, sw: 2 }, bg);
      if (b.icon) bg.iconEl = S.icon(b.icon, { x, y, size: r * 1.25, color: tone }, bg);
      Object.assign(bg, { w: 2 * r, h: 2 * r, cx: x, cy: y });
    }
    return bg;
  }

  /** a circular-arrow glyph centred on (x, y), radius r (for "the server is generating") */
  function spinnerPath(x, y, r) {
    const a0 = -80 * Math.PI / 180, a1 = 220 * Math.PI / 180;
    const p = a => [x + r * Math.cos(a), y + r * Math.sin(a)];
    const [sx, sy] = p(a0), [ex, ey] = p(a1);
    const tx = -Math.sin(a1), ty = Math.cos(a1), hs = r * 0.62;   // tangent at the end (clockwise)
    const head = `M${f2(ex - tx * hs - ty * hs * 0.75)},${f2(ey - ty * hs + tx * hs * 0.75)} L${f2(ex + tx * hs * 0.15)},${f2(ey + ty * hs * 0.15)} L${f2(ex - tx * hs + ty * hs * 0.75)},${f2(ey - ty * hs - tx * hs * 0.75)}`;
    return { arc: `M${f2(sx)},${f2(sy)} A${f2(r)},${f2(r)} 0 1 1 ${f2(ex)},${f2(ey)}`, head };
  }

  /** a fan: ring + blades, centred on (x, y), radius r. Returns {g, rotor} (rotate rotor with xf) */
  function fan(S, g, x, y, r, o = {}) {
    const fg = S.g(null, g);
    S.circle({ x, y, r, fill: '#070b15', stroke: '#ffffff', strokeOpacity: 0.18, sw: Math.max(1, r * 0.08) }, fg);
    const rotor = S.g(null, fg);
    let d = '';
    const nb = o.blades || 5;
    for (let i = 0; i < nb; i++) {
      const a = i * 2 * Math.PI / nb, b = a + 0.9;
      const p1 = [x + r * 0.22 * Math.cos(a), y + r * 0.22 * Math.sin(a)];
      const p2 = [x + r * 0.84 * Math.cos(a + 0.25), y + r * 0.84 * Math.sin(a + 0.25)];
      const p3 = [x + r * 0.8 * Math.cos(b), y + r * 0.8 * Math.sin(b)];
      d += `M${f2(p1[0])},${f2(p1[1])} Q${f2(p2[0])},${f2(p2[1])} ${f2(p3[0])},${f2(p3[1])} Q${f2(x + r * 0.45 * Math.cos(a + 0.75))},${f2(y + r * 0.45 * Math.sin(a + 0.75))} ${f2(p1[0])},${f2(p1[1])}z`;
    }
    S.path({ d, fill: o.color || '#5d6a8c', fillOpacity: 0.9 }, rotor);
    S.circle({ x, y, r: r * 0.2, fill: '#2a3452', stroke: '#ffffff', strokeOpacity: 0.2, sw: 1 }, rotor);
    fg.rotor = rotor; fg.cx = x; fg.cy = y;
    return fg;
  }

  /**
   * The face of one server unit, as path strings (shared by libServer, libRack, libDataCentre so a
   * detailed server sits seamlessly among batched neighbours). x, y top-left; detail: 'full' | 'lite' | 'min'.
   */
  function unitShapes(x, y, w, h, detail) {
    const r = Math.max(1.5, h * 0.1);
    const e = Math.max(2.5, w * 0.035);                       // rack ears
    const out = { r, e, chassis: rr(x, y, w, h, r), ears: '', bays: '', bayLines: '', vents: '', leds: [], screws: '' };
    out.ears = rr(x, y, e, h, Math.min(r, e / 2)) + rr(x + w - e, y, e, h, Math.min(r, e / 2));
    if (detail === 'full') out.screws = circ(x + e / 2, y + h * 0.27, e * 0.2) + circ(x + e / 2, y + h * 0.73, e * 0.2) + circ(x + w - e / 2, y + h * 0.27, e * 0.2) + circ(x + w - e / 2, y + h * 0.73, e * 0.2);
    const nb = detail === 'full' ? 8 : detail === 'lite' ? 4 : 3;
    const bx0 = x + e + w * 0.035, bx1 = x + w * 0.56;
    const bw = (bx1 - bx0) / (nb + (nb - 1) * 0.2), bgap = bw * 0.2, bh = h * 0.64, by = y + (h - bh) / 2;
    out.bayRects = [];
    for (let i = 0; i < nb; i++) {
      const bx = bx0 + i * (bw + bgap);
      out.bays += rr(bx, by, bw, bh, Math.min(bw, bh) * 0.12);
      out.bayRects.push({ x: bx, y: by, w: bw, h: bh });
      if (detail !== 'min') out.bayLines += `M${f2(bx + bw * 0.25)},${f2(by + bh * 0.16)}h${f2(bw * 0.5)}`;
      if (detail === 'full') out.leds.push({ x: bx + bw / 2, y: by + bh * 0.82, r: Math.max(1.4, Math.min(bw * 0.16, h * 0.035)), bay: i });
    }
    // perforated vent block
    const vx0 = x + w * 0.6, vx1 = x + w * 0.85, rows = detail === 'min' ? 2 : 3;
    const vr = Math.max(0.8, h * (detail === 'min' ? 0.05 : 0.032));
    const cols = Math.max(3, Math.round((vx1 - vx0) / (vr * 4.2)));
    for (let rI = 0; rI < rows; rI++) for (let c = 0; c < cols; c++) {
      const vx = vx0 + (c + (rI % 2) * 0.5) * (vx1 - vx0) / cols, vy = y + h * (0.5 + (rI - (rows - 1) / 2) * (detail === 'min' ? 0.3 : 0.22));
      out.vents += circ(vx, vy, vr);
    }
    out.power = { x: x + w * 0.915, y: y + h * 0.37, r: Math.max(1.2, h * 0.07) };
    out.act = { x: x + w * 0.915, y: y + h * 0.66, r: Math.max(1, h * 0.05) };
    out.face = { l: x + e, r: x + w - e };
    return out;
  }

  return { NS, GRAD, BASE, DARK, GREY, chipExtent, clamp, lerp, f2, smooth, nextId, hexRGB, mix, soft, defs, rr, circ, xf, drive, channel, swapText, splitUnit, setValueText, valueWidth, ranks, sel, ignore, label, badge, spinnerPath, fan, unitShapes };
})();


/* ================================================================== libChip */
/**
 * libChip — a compact stylised accelerator chip: gold pins on four sides, a warm dark package, a silicon die
 * with a fine grid of cores, a pin-1 dot and a soft sheen. Crisp from a 20 px icon to a 300 px hero. With
 * hbm: n it is instead a small GPU package icon: the die on a blue slab, flanked by n coral HBM stacks a side
 * (the look of S.gpu, at icon size, without buses or labels).
 *
 * o: {x = 960, y = 540        centre of the chip (the package, without the label),
 *     size = 120              side of the chip body (or of the die, with hbm) in px,
 *     tone = 'compute'        body / pins / cores colour (amber: the chip is where arithmetic happens),
 *     style = 'solid'         'solid' | 'outline' (hollow outline + pins, no cores: "a chip outline"),
 *     state = 'on'            'on' (dim amber cores: the normal icon) | 'idle' (grey cores, desaturated:
 *                             asleep / waiting) | 'busy' (cores lit bright amber, die glowing),
 *     hbm = 0                 HBM stacks per side (0 = plain chip with pins; 1–3 = GPU package icon),
 *     cores = auto            cores per side of the die grid (default from size: 2 … 12),
 *     label = null            name, e.g. 'H100'; labelPos = 'below' | 'above' | 'right' | 'inside' (on the
 *                             die, size ≥ 120), labelSize = auto (≥ 24), labelTone = 'ink', sub = null
 *                             (a muted second line), labelGap = 12,
 *     seed = 7                seeds the core order for wakes, sparks and draw-on}
 * Returns <g> (root) with .art (the drawing), .body {x,y,w,h} (the silicon), .die {x,y,w,h}, .cores[],
 *   .stacks[] (hbm: each {x,y,w,h,cx,cy,side}), .labelEl .subEl, and anchors .cx .cy .w .h .l .r .t .b
 *   (the drawing, pins included, label excluded) and .size.
 * Helpers (return tweens):
 *   .drawOn({d = 1.1})                outline draws, die and pins fade up, cores pop in seeded order, label in
 *   .setState('idle'|'on'|'busy', {d = 0.8, spread = 0.6})   cores change state in a seeded ripple
 *   .wake(o) / .sleep(o)              = setState('on') / setState('idle'); .busy(o) = setState('busy')
 *   .compute({d = 2, rate = 2.2, seed})  sparks: random cores flash bright amber for d seconds (work being
 *                                     done), then settle back to the planned state
 *   .flash({d = 0.5, to = 0.6})       the die flashes amber once (bytes arrived and were used)
 *   .pulse({d = 0.6, scale = 1.07, tone = 'compute'})   a soft bloom, a glowing outline and a small swell
 *   .rename(text, {d = 0.45})         swap the name label (e.g. 'GPU' → 'H100'; needs a label at build)
 *   .port(side, gap = 0) → {x, y}     a point on the edge ('left'|'right'|'top'|'bottom') for pipes and flows
 *   .bus(i) → path d                  (hbm) from stack i's inner edge to the die, for S.flow({d: chip.bus(0)})
 * Example:
 *   const chip = libChip(S, { x: 1440, y: 520, size: 180, label: 'H100', state: 'idle' });
 *   S.add(chip.drawOn(), 'b1~chip');
 *   S.add(chip.wake(), 'b2~wakes');
 *   S.add(chip.compute({ d: 3 }), 'b2~arithmetic');
 *   S.flow({ d: `M300,520 L${chip.port('left', 6).x},520`, from: 'b2', to: 'b3', color: 'bytes' });
 */
function libChip(S, o = {}, parent) {
  const H = _libHW; H.defs();
  const s = o.size ?? 120, cx = o.x ?? 960, cy = o.y ?? 540;
  const tone = o.tone || 'compute', hbm = o.hbm || 0, outline = o.style === 'outline';
  const AMB = S.tone(tone);
  const root = S.g(null, parent);
  const art = S.g(null, root);
  const haloG = S.g(null, art);
  const sw = H.clamp(s * 0.018, 1.2, 3.2);
  let hw, hh, body, pins = null, slab = null;
  const strokeEls = [];          // outlines that draw on
  const fillEls = [];            // fills that fade up
  root.stacks = [];

  if (!hbm) {
    // ---- plain chip: pins on four sides, package, die
    const E = H.chipExtent(s, 0), n = E.n, span = s * 0.76, step = span / n, pl = E.pl, pt = E.pt;
    let d = '';
    for (let j = 0; j < n; j++) {
      const t = -span / 2 + (j + 0.5) * step;
      d += `M${H.f2(cx + t)},${H.f2(cy - s / 2)}v${H.f2(-pl)}M${H.f2(cx + t)},${H.f2(cy + s / 2)}v${H.f2(pl)}` +
        `M${H.f2(cx - s / 2)},${H.f2(cy + t)}h${H.f2(-pl)}M${H.f2(cx + s / 2)},${H.f2(cy + t)}h${H.f2(pl)}`;
    }
    pins = S.path({ d, stroke: tone, sw: pt, strokeOpacity: 0.62, cap: 'round' }, art);
    hw = hh = s / 2 + pl + pt / 2;
    body = { x: cx - s / 2, y: cy - s / 2, w: s, h: s };
    const rb = s * 0.12;
    fillEls.push(S.rect({ x: body.x, y: body.y, w: s, h: s, r: rb, fill: outline ? H.BASE : 'url(#hw-body)', fillOpacity: outline ? 0.9 : 1, filter: s >= 80 && !outline ? 'url(#shadow)' : undefined }, art));
    if (!outline) fillEls.push(S.rect({ x: body.x, y: body.y, w: s, h: s, r: rb, fill: 'url(#hw-sheen)' }, art));
    if (!outline && s >= 60) fillEls.push(H.ignore(S.rect({ x: body.x + sw * 1.6, y: body.y + sw * 1.6, w: s - sw * 3.2, h: s - sw * 3.2, r: rb * 0.8, stroke: '#ffffff', strokeOpacity: 0.07, sw: Math.max(1, sw * 0.6) }, art)));
    root.bodyLine = S.rect({ x: body.x, y: body.y, w: s, h: s, r: rb, stroke: tone, strokeOpacity: 0.92, sw }, art);
    strokeEls.push(root.bodyLine);
    const inset = s * 0.17, ds = s - 2 * inset;
    root.die = { x: cx - ds / 2, y: cy - ds / 2, w: ds, h: ds };
    const dieEl = S.rect({ x: root.die.x, y: root.die.y, w: ds, h: ds, r: s * 0.045, fill: outline ? 'none' : 'url(#hw-die)', stroke: tone, strokeOpacity: outline ? 0.4 : 0.42, sw: sw * 0.7, dash: outline ? `${H.f2(s * 0.05)} ${H.f2(s * 0.04)}` : undefined }, art);
    (outline ? strokeEls : fillEls).push(dieEl);
    if (s >= 44 && !outline) fillEls.push(S.circle({ x: body.x + s * 0.085, y: body.y + s * 0.085, r: Math.max(1.2, s * 0.022), fill: tone, fillOpacity: 0.7 }, art));
  } else {
    // ---- GPU package icon: blue slab, die in the middle, coral HBM stacks either side
    const gap = s * 0.1, stw = s * 0.3, pad = s * 0.12;
    const W = s + 2 * (gap + stw) + 2 * pad, Hh = s + 2 * pad;
    hw = W / 2; hh = Hh / 2;
    S.rect({ x: cx - W / 2, y: cy - Hh / 2, w: W, h: Hh, r: s * 0.09, fill: 'url(#hw-slab)', filter: s >= 60 ? 'url(#shadow)' : undefined }, art);
    slab = S.rect({ x: cx - W / 2, y: cy - Hh / 2, w: W, h: Hh, r: s * 0.09, stroke: 'struct', strokeOpacity: 0.55, sw }, art);
    strokeEls.push(slab);
    if (s >= 64) {      // tiny surface-mount parts along the slab's top and bottom edges
      let cd = '';
      const nC = Math.round(W / (s * 0.16));
      for (let i = 0; i < nC; i++) {
        const px = cx - W / 2 + pad + (i + 0.5) * (W - 2 * pad) / nC;
        cd += H.rr(px - s * 0.022, cy - Hh / 2 + pad * 0.32, s * 0.044, s * 0.026, 1) + H.rr(px - s * 0.022, cy + Hh / 2 - pad * 0.32 - s * 0.026, s * 0.044, s * 0.026, 1);
      }
      fillEls.push(H.ignore(S.path({ d: cd, fill: '#c9a96a', fillOpacity: 0.5 }, art)));
    }
    const sg = s * 0.07, sh = (s - (hbm - 1) * sg) / hbm;
    const traces = [];
    for (const side of [-1, 1]) for (let i = 0; i < hbm; i++) {
      const sx = side < 0 ? cx - s / 2 - gap - stw : cx + s / 2 + gap, sy = cy - s / 2 + i * (sh + sg);
      const st = S.g(null, art);
      S.rect({ x: sx, y: sy, w: stw, h: sh, r: s * 0.03, fill: 'url(#hw-hbm)', stroke: 'bytes', strokeOpacity: 0.88, sw: sw * 0.9 }, st);
      const nl = sh > 26 ? 4 : sh > 14 ? 2 : 0;
      let ld = '';
      for (let k = 1; k <= nl; k++) ld += `M${H.f2(sx + stw * 0.16)},${H.f2(sy + k * sh / (nl + 1))}h${H.f2(stw * 0.68)}`;
      if (ld) S.path({ d: ld, stroke: 'bytes', strokeOpacity: 0.42, sw: Math.max(1, sw * 0.6) }, st);
      Object.assign(st, { x: sx, y: sy, w: stw, h: sh, cx: sx + stw / 2, cy: sy + sh / 2, side });
      root.stacks.push(st);
      const ex = side < 0 ? sx + stw : sx, dx = side < 0 ? cx - s / 2 : cx + s / 2;
      for (const f of [0.3, 0.5, 0.7]) traces.push(`M${H.f2(ex)},${H.f2(sy + sh * f)}L${H.f2(dx)},${H.f2(sy + sh * f)}`);
    }
    fillEls.push(...root.stacks);
    fillEls.push(H.ignore(S.path({ d: traces.join(''), stroke: 'bytes', strokeOpacity: 0.45, sw: Math.max(0.8, s * 0.008) }, art)));
    body = { x: cx - s / 2, y: cy - s / 2, w: s, h: s };
    const rb = s * 0.06;
    fillEls.push(S.rect({ x: body.x, y: body.y, w: s, h: s, r: rb, fill: 'url(#hw-body)' }, art));
    fillEls.push(S.rect({ x: body.x, y: body.y, w: s, h: s, r: rb, fill: 'url(#hw-sheen)' }, art));
    root.bodyLine = S.rect({ x: body.x, y: body.y, w: s, h: s, r: rb, stroke: tone, strokeOpacity: 0.92, sw }, art);
    strokeEls.push(root.bodyLine);
    const inset = s * 0.07;
    root.die = { x: body.x + inset, y: body.y + inset, w: s - 2 * inset, h: s - 2 * inset };
  }
  root.body = body;

  // ---- glow under the cores (busy), and the flash overlay
  const D = root.die;
  const glowEl = S.rect({ x: D.x, y: D.y, w: D.w, h: D.h, r: s * 0.04, fill: tone, opacity: 0, filter: s >= 90 ? `url(#glow-${H.GRAD.includes(tone) ? tone : 'compute'})` : undefined }, art);
  H.ignore(glowEl);

  // ---- cores
  const coresG = H.ignore(S.g(null, art));
  const cores = [];
  if (!outline) {
    const k = o.cores ?? Math.round(H.clamp(D.w / 15, 2, 12));
    const pp = D.w * 0.07, g = Math.max(1, D.w * 0.026);
    const split = k >= 8 && k % 2 === 0;           // big dies: four quadrants either side of a cross channel
    const extra = split ? g * 1.6 : 0;
    const cw = (D.w - 2 * pp - (k - 1) * g - extra) / k;
    const pos = i => pp + i * (cw + g) + (split && i >= k / 2 ? extra : 0);
    for (let r = 0; r < k; r++) for (let c = 0; c < k; c++) {
      cores.push(S.rect({ x: D.x + pos(c), y: D.y + pos(r), w: cw, h: cw, r: Math.min(cw * 0.2, 3), fill: tone, fillOpacity: 0.24 }, coresG));
    }
  }
  root.cores = cores;
  const nC = cores.length;
  const rank = H.ranks(S, Math.max(1, nC), o.seed ?? 7);

  const flashEl = H.ignore(S.rect({ x: body.x, y: body.y, w: body.w, h: body.h, r: s * 0.08, fill: tone, opacity: 0 }, art));

  // ---- name label
  const box = { l: cx - hw, r: cx + hw, t: cy - hh, b: cy + hh, cx, cy };
  let plate = null;
  if (o.label != null && o.labelPos === 'inside') {
    const size = o.labelSize ?? Math.round(H.clamp(s * 0.17, 24, 64));
    const tw = S.measure(o.label, { size, weight: 700, family: 'display' });
    plate = S.rect({ x: cx - tw / 2 - size * 0.4, y: cy - size * 0.75, w: tw + size * 0.8, h: size * 1.5, r: size * 0.3, fill: '#120d06', fillOpacity: 0.92, stroke: tone, strokeOpacity: 0.35, sw: 1.5 }, art);
    root.labelEl = S.text(o.label, { x: cx, y: cy + 1, size, weight: 700, family: 'display', anchor: 'middle', color: o.labelTone || 'ink', maxW: D.w * 0.9 }, art);
    root.labelG = root.labelEl;
  } else {
    const lab = H.label(S, root, box, { ...o, labelSize: o.labelSize ?? Math.round(H.clamp(s * 0.22, 24, 44)) });
    root.labelEl = lab.el; root.subEl = lab.sub; root.labelG = lab.g;
  }

  // ---- state painting: planned base levels (setState) + independent spark layers (compute) + flashes
  const LV = { idle: 0, on: 1, busy: 2 };
  const level0 = LV[o.state || 'on'] ?? 1;
  let plan = new Array(nC).fill(level0);                 // the planned base, for chaining helpers
  const live = { base: plan.slice(), sparks: [], flashes: [] };   // what is on screen now
  function coreStyle(L) {
    if (L <= 1) return { fill: H.mix(S, H.GREY, AMB, L), op: H.lerp(0.15, 0.24, L) };
    return { fill: AMB, op: H.lerp(0.24, 0.95, Math.min(1, L - 1)) };
  }
  function paint() {
    let sum = 0;
    for (let i = 0; i < nC; i++) {
      let env = 0;
      for (const L of live.sparks) if (L[i] > env) env = L[i];
      const b = live.base[i], lv = b + (2 - b) * env;
      const st = coreStyle(lv);
      cores[i].setAttribute('fill', st.fill);
      cores[i].setAttribute('fill-opacity', st.op.toFixed(3));
      sum += b;
    }
    const mean = nC ? sum / nC : level0, m1 = Math.min(1, mean);
    const c = H.mix(S, H.GREY, AMB, 0.3 + 0.7 * m1);
    root.bodyLine.setAttribute('stroke', c);
    root.bodyLine.setAttribute('stroke-opacity', H.lerp(0.6, 0.92, m1).toFixed(3));
    if (pins) { pins.setAttribute('stroke', c); pins.setAttribute('stroke-opacity', H.lerp(0.38, 0.62, m1).toFixed(3)); }
    glowEl.setAttribute('opacity', (Math.max(0, mean - 1) * 0.3).toFixed(3));
    flashEl.setAttribute('opacity', Math.max(0, ...live.flashes).toFixed(3));
  }
  paint();

  const stateCh = H.channel();
  root.setState = (name, so = {}) => {
    const to = LV[name] ?? 1, from = plan.slice(), spread = so.spread ?? 0.6;
    plan = new Array(nC).fill(to);
    if (!nC) return gsap.timeline();
    return stateCh(0, 1, p => {
      live.base = from.map((f, i) => H.lerp(f, to, H.smooth(H.clamp((p - spread * rank[i] / nC) / (1 - spread), 0, 1))));
      paint();
    }, { d: so.d ?? 0.8, ease: 'none' });
  };
  root.wake = so => root.setState('on', so);
  root.sleep = so => root.setState('idle', so);
  root.busy = so => root.setState('busy', so);

  root.compute = (co = {}) => {
    const d = co.d ?? 2, rate = co.rate ?? 2.2;
    const rnd = S.rand((co.seed ?? 11) * 7919 + nC + live.sparks.length * 131);
    const A = 0.05, DEC = 0.3;
    const ev = cores.map(() => {
      const out = [];
      let t = -rnd() / rate;
      for (;;) { t += -Math.log(1 - rnd() * 0.999) / rate; if (t > d - A - DEC) break; if (t >= 0) out.push(t); }
      return out;
    });
    const slot = new Float32Array(nC);
    live.sparks.push(slot);
    return H.drive(0, d, t => {
      for (let i = 0; i < nC; i++) {
        let env = 0;
        for (const t0 of ev[i]) { const dt = t - t0; if (dt < 0) break; const e = dt < A ? dt / A : 1 - (dt - A) / DEC; if (e > env) env = e; }
        slot[i] = Math.max(0, env);
      }
      paint();
    }, { d, ease: 'none' });
  };

  root.flash = (fo = {}) => {
    const k = live.flashes.push(0) - 1;
    return H.drive(0, 1, p => { live.flashes[k] = Math.sin(Math.PI * p) * (fo.to ?? 0.6); paint(); }, { d: fo.d ?? 0.5, ease: 'none' });
  };

  // a soft bloom behind the chip (pulse), and the outline's glow
  const glowTone = t => (H.GRAD.includes(t) ? t : 'compute');
  const halo = H.ignore(S.circle({ x: cx, y: cy, r: Math.max(hw, hh) * 1.55, fill: `url(#pglow-${glowTone(tone)})`, opacity: 0 }, haloG));
  root.halo = halo;
  const pulseCh = H.channel();
  root.pulse = (po = {}) => {
    const k = (po.scale ?? 1.07) - 1, gt = glowTone(po.tone || tone);
    return pulseCh(0, 1, p => {
      const e = Math.sin(Math.PI * p);
      H.xf(art, cx, cy, 1 + k * e);
      halo.setAttribute('fill', `url(#pglow-${gt})`);
      halo.setAttribute('opacity', (0.95 * e).toFixed(3));
      if (e > 0.05) root.bodyLine.setAttribute('filter', `url(#glow-${gt})`); else root.bodyLine.removeAttribute('filter');
    }, { d: po.d ?? 0.6, ease: 'none' });
  };

  root.drawOn = (dO = {}) => {
    const d = dO.d ?? 1.1;
    const t = gsap.timeline();
    t.fromTo(strokeEls, { drawSVG: '0%' }, { drawSVG: '100%', duration: d * 0.6, ease: 'power2.inOut', stagger: 0.05 }, 0);
    t.fromTo(fillEls, { opacity: 0 }, { opacity: 1, duration: d * 0.45, ease: 'power1.out' }, d * 0.3);
    if (pins) t.fromTo(pins, { opacity: 0 }, { opacity: 1, duration: d * 0.35, ease: 'power1.out' }, d * 0.4);
    if (plate) t.fromTo(plate, { opacity: 0 }, { opacity: 1, duration: d * 0.3 }, d * 0.6);
    if (nC) {
      const show = p => cores.forEach((c, i) => c.setAttribute('opacity', H.clamp((p * 1.7 - 0.7 * rank[i] / nC), 0, 1).toFixed(3)));
      show(0);
      t.add(H.drive(0, 1, show, { d: d * 0.55, ease: 'none' }), d * 0.45);
    }
    if (root.labelG) t.fromTo(root.labelG, { opacity: 0 }, { opacity: 1, duration: d * 0.4 }, d * 0.6);
    return t;
  };

  let labelPlan = o.label;
  const labelCh = H.channel();
  root.rename = (text, ro = {}) => {
    if (!root.labelEl) return gsap.timeline();
    const from = labelPlan; labelPlan = text;
    return H.swapText(root.labelEl, from, text, ro, null, labelCh);
  };

  root.port = (side, gap = 0) => {
    if (side === 'left') return { x: cx - hw - gap, y: cy };
    if (side === 'right') return { x: cx + hw + gap, y: cy };
    if (side === 'top') return { x: cx, y: cy - hh - gap };
    return { x: cx, y: cy + hh + gap };
  };
  root.bus = i => {
    const st = root.stacks[i];
    if (!st) return '';
    const x1 = st.side < 0 ? st.x + st.w : st.x, x2 = st.side < 0 ? cx - s / 2 : cx + s / 2;
    return `M${H.f2(x1)},${H.f2(st.cy)} L${H.f2(x2)},${H.f2(st.cy)}`;
  };
  Object.assign(root, { art, cx, cy, size: s, w: 2 * hw, h: 2 * hh, l: cx - hw, r: cx + hw, t: cy - hh, b: cy + hh, tone });
  return root;
}


/* ================================================================== libChipGrid */
/**
 * libChipGrid — rows × cols of libChip, evenly spaced and centred on (x, y): "thousands of chips" as a dense
 * block, the GPUs in a server, a row of chips to compare. The chips are full libChips (their helpers work).
 *
 * o: {x = 960, y = 540 (centre), rows = 2, cols = 8, size = 40, gap = size × 0.5 (between packages,
 *     pins included), chip = {}   options passed to every libChip (state, hbm, style, tone…; labels off),
 *     labels = null               per-chip labels (array, row-major), seed = 3}
 * Returns <g> (root) with .chips[] (row-major) and .at(r, c), anchors .cx .cy .w .h .l .r .t .b
 * Helpers (return timelines):
 *   .reveal({d = 0.5, stagger = 0.03, from = 'center'})   chips pop in ('center' | 'start' | 'end' | 'random')
 *   .setState(name, {d = 0.6, stagger = 0.04, from})       every chip changes state, rippling across the grid
 *   .compute({d = 2, rate = 1.6})                          every chip sparks, each with its own seed
 * Example:
 *   const farm = libChipGrid(S, { x: 360, y: 700, rows: 4, cols: 12, size: 26 });
 *   S.add(farm.reveal(), 'b3~thousands');
 *   S.add(farm.compute({ d: 2.5 }), 'b3~thousands+0.6');
 */
function libChipGrid(S, o = {}, parent) {
  const H = _libHW;
  const rows = o.rows ?? 2, cols = o.cols ?? 8, size = o.size ?? 40;
  const cx = o.x ?? 960, cy = o.y ?? 540;
  const root = S.g(null, parent);
  const { w: pw, h: ph } = H.chipExtent(size, (o.chip || {}).hbm || 0);
  const gap = o.gap ?? size * 0.5;
  const W = cols * pw + (cols - 1) * gap, Hh = rows * ph + (rows - 1) * gap;
  root.chips = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    root.chips.push(libChip(S, { ...(o.chip || {}), size, label: o.labels ? o.labels[i] : null, seed: (o.seed ?? 3) * 31 + i, x: cx - W / 2 + pw / 2 + c * (pw + gap), y: cy - Hh / 2 + ph / 2 + r * (ph + gap) }, root));
  }
  root.at = (r, c) => root.chips[r * cols + c];
  const orderOf = from => {
    const n = root.chips.length;
    if (from === 'random') return H.ranks(S, n, (o.seed ?? 3) + 101);
    if (from === 'end') return root.chips.map((_, i) => n - 1 - i);
    if (from === 'start') return root.chips.map((_, i) => i);
    const d = root.chips.map(ch => Math.hypot(ch.cx - cx, ch.cy - cy));
    const sorted = d.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
    const out = new Array(n); sorted.forEach(([, i], k) => { out[i] = k; });
    return out;
  };
  root.reveal = (ro = {}) => {
    const ord = orderOf(ro.from || 'center');
    return gsap.fromTo(root.chips, { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: ro.d ?? 0.5, ease: 'back.out(2)', transformOrigin: '50% 50%', stagger: (i) => ord[i] * (ro.stagger ?? 0.03) });
  };
  root.setState = (name, so = {}) => {
    const ord = orderOf(so.from || 'start');
    const t = gsap.timeline();
    root.chips.forEach((ch, i) => t.add(ch.setState(name, { d: so.d ?? 0.6 }), ord[i] * (so.stagger ?? 0.04)));
    return t;
  };
  root.compute = (co = {}) => {
    const t = gsap.timeline();
    root.chips.forEach((ch, i) => t.add(ch.compute({ d: co.d ?? 2, rate: co.rate ?? 1.6, seed: (o.seed ?? 3) * 977 + i * 13 }), 0));
    return t;
  };
  Object.assign(root, { cx, cy, w: W, h: Hh, l: cx - W / 2, r: cx + W / 2, t: cy - Hh / 2, b: cy + Hh / 2 });
  return root;
}


/* ================================================================== libSpecSheet */
/**
 * libSpecSheet — a chip's specification card. Two layouts:
 *   'sheet' (default): a card with a header (chip icon or document icon, the chip's name, an optional kicker
 *     such as 'SPEC SHEET') and rows: a tone accent bar, the row's name, its value (text or pill) and an
 *     optional tag ('an amount' / 'a rate'). Rows can start as grey placeholder lines that later resolve.
 *   'row': a compact chip card on one line, e.g. [chip] H100 · 3.35 TB/s, with optional muted note lines
 *     under the name ('holds 80 GB') — for tables of chips (ch02_s05) and lower-third strips.
 *
 * o: {x = 640, y = 260 (top-left), w = 640 ('row': 420), h = auto,
 *     title = 'H100'          the header / card name (null: no header),
 *     kicker = null           small upper-case text at the header's right, e.g. 'spec sheet',
 *     icon = 'chip'           header icon: 'chip' (a libChip) | 'doc' (a printed sheet) | any icon id | null,
 *     fold = false            draw the card as a printed page with a folded corner,
 *     rows = []               each {label, value, unit, tone = 'struct', tag, tagTone = 'neutral'} or null
 *                             (a placeholder line that never resolves). A value's number is set in mono and
 *                             its unit in sans, split automatically ('3.35 TB/s' → 3.35 + TB/s); or give the
 *                             number as value and the unit as unit. The 'row' layout shows values, not labels,
 *     start = 'shown'         'shown' | 'placeholder' (grey lines until .reveal) | 'empty' (nothing until .reveal),
 *     phLen = 'varied'        placeholder line length: 'varied' (seeded 48–88 % of the row) or a fraction (1 = full),
 *     rowStyle = 'split'      'split' (name left, value right) | 'inline' ('operations per second: ?', in tone),
 *     valueStyle = 'text'     'text' (in the row's tone) | 'pill' (white in a soft pill of the row's tone),
 *     size = 28 (row names), valueSize = 30, titleSize = 40 ('row': 36), rowH = auto (2.3 × size), pad = 36,
 *     tone = 'neutral'        the card's outline tone, note = null (a muted line under the rows; 'row': under
 *                             the name, string or array of lines), seed = 5}
 * Returns <g> (root) with .face (the card; .flip scales it), .bg, .titleEl, .kickerEl, .iconEl, .noteEl
 *   (array for 'row' notes), .rows[] each {g (holder: yours to S.xset / fx.xform, e.g. to lift a row out of
 *   the sheet), body, content, ph, band, accent, labelEl, valueEl (number + unit tspans), valueG (value and
 *   its pill), tagEl, tagG, x, y, w, h, cy, valueX}, anchors .x .y .w .h .l .r .t .b .cx .cy
 * Helpers (return tweens/timelines; state helpers plan, call in time order):
 *   .reveal(i | [i…] | 'all', {d = 0.55, stagger = 0.12})   rows land (placeholder line resolves into text)
 *   .brighten(i | [i…], {d = 0.4})     placeholder lines brighten (tinted to the row's tone): "these two"
 *   .focus(i | null, {dim = 0.3, d = 0.5})   highlight row i (tone band) and dim the others; null clears
 *   .dimRows(i | [i…] | 'all', to = 0.3, {d})   dim rows without a highlight (to = 1 restores)
 *   .glow(i | [i…] | 'all', {part = 'row' | 'value' | 'tag', d = 0.8, tone})   a brief glow on each
 *   .setValue(i, text, {d = 0.45})     swap a row's value text ('?' → '3.35')
 *   .count(i, from, to, {d = 1.2, fmt})   count a row's value; fmt returns the whole value, e.g.
 *                                     v => v.toFixed(2) + ' TB/s' (default: integer, or 2 decimals)
 *   .flip({title, values: {i: text}, notes}, {d = 0.9})   the card flips over and comes back as another chip
 * Example:
 *   const sheet = libSpecSheet(S, { x: 1000, y: 180, title: 'chip spec sheet', start: 'placeholder', rowStyle: 'inline',
 *     rows: [null, { label: 'operations per second', value: '?', tone: 'compute' }, null, { label: 'bytes per second', value: '?', tone: 'bytes' }, null, null] });
 *   S.add(S.fx.in(sheet, { from: 'right' }), 'b1~two');
 *   S.add(sheet.brighten([1, 3]), 'b1~specification');
 *   S.add(sheet.reveal(1), 'b2~calculates');
 */
function libSpecSheet(S, o = {}, parent) {
  const H = _libHW; H.defs();
  const layout = o.layout || 'sheet';
  const root = S.g(null, parent);
  const face = S.g(null, root);
  root.face = face;
  const rowsIn = (o.rows || []).map(r => (r == null ? { placeholder: true } : typeof r === 'string' ? { label: r } : { ...r }));
  const size = o.size ?? 28;
  const cardTone = o.tone || 'neutral';
  const x = o.x ?? 640, y = o.y ?? 260;
  const soft = t => H.soft(S, t);
  const fmtOf = (v, f) => (f ? f(v) : (Math.abs(v - Math.round(v)) < 1e-9 ? S.fmt.int(v) : String(Math.round(v * 100) / 100)));

  // ------------------------------------------------ the card (shared by both layouts)
  function card(w, h) {
    const r = o.r ?? (layout === 'row' ? 18 : 24);
    const fold = o.fold ? Math.min(56, w * 0.09) : 0;
    const d = fold
      ? `M${x + r},${y} H${x + w - fold} L${x + w},${y + fold} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`
      : H.rr(x, y, w, h, r);
    S.path({ d, fill: H.BASE, filter: 'url(#shadow)' }, face);
    root.bg = S.path({ d, fill: `url(#card-${H.GRAD.includes(cardTone) ? cardTone : 'neutral'})`, stroke: cardTone === 'neutral' ? '#ffffff' : cardTone, strokeOpacity: cardTone === 'neutral' ? 0.16 : 0.55, sw: 2 }, face);
    if (fold) S.path({ d: `M${x + w - fold},${y} V${y + fold * 0.8} Q${x + w - fold},${y + fold} ${x + w - fold * 0.8},${y + fold} H${x + w} Z`, fill: '#26324f', stroke: '#ffffff', strokeOpacity: 0.2, sw: 1.5 }, face);
    return { r, fold };
  }

  // ------------------------------------------------ a row's value: mono number + sans unit, optional pill
  const rows = [];
  function writeValue(row, text) {
    H.setValueText(row.valueEl, text, { unit: row.unit, unitSize: row.usize, unitColor: row.unitColor });
    row.cur = text;
    if (row.pill) {
      const vw = H.valueWidth(S, text, { unit: row.unit, size: row.vsize, unitSize: row.usize });
      const pw = vw + 30, ph = Math.round(row.vsize * 1.55), right = row.valueX + 15;
      for (const el of row.pill) { el.setAttribute('x', H.f2(right - pw)); el.setAttribute('width', H.f2(pw)); el.setAttribute('y', H.f2(row.cy - ph / 2)); el.setAttribute('height', ph); }
    }
    if (root.relayout) root.relayout();
  }

  let W, Hh;
  if (layout === 'row') {
    // ================================================ compact chip card: [chip] NAME · value · value / notes
    W = o.w ?? 420;
    const notes = o.note == null ? [] : Array.isArray(o.note) ? o.note : [o.note];
    const tsize = o.titleSize ?? 36, nsize = o.noteSize ?? 24, vsize = o.valueSize ?? Math.round(tsize * 0.86);
    Hh = o.h ?? Math.round(tsize * 2.4 + notes.length * nsize * 1.3);
    card(W, Hh);
    const pad = o.pad ?? 24;
    const iconS = Math.min(Hh * 0.46, 60);
    const blockH = tsize + notes.length * nsize * 1.3;
    const ty = y + (Hh - blockH) / 2 + tsize / 2;
    if (o.icon !== null) root.iconEl = libChip(S, { size: iconS, x: x + pad + iconS * 0.62, y: y + Hh / 2, label: null, ...(typeof o.icon === 'object' ? o.icon : {}) }, face);
    const tx = o.icon === null ? x + pad : x + pad + iconS * 1.24 + 18;
    root.titleEl = S.text(o.title ?? '', { x: tx, y: ty, size: tsize, weight: 700, family: 'display', color: 'ink' }, face);
    root.noteEl = notes.map((n, i) => S.text(n, { x: tx, y: ty + tsize * 0.55 + nsize * (0.75 + 1.3 * i), size: nsize, weight: 500, color: 'muted' }, face));
    rowsIn.forEach(ri => {
      const g = S.g(null, face), body = S.g(null, g), content = S.g(null, body);
      const tone = ri.tone || 'struct';
      const sep = S.text('·', { x: 0, y: ty, size: tsize, weight: 600, color: 'faint' }, content);
      const valueG = S.g(null, content);
      const valueEl = S.text('', { x: 0, y: ty + 1, size: vsize, weight: 600, family: 'mono', color: tone }, valueG);
      rows.push({ g, body, content, valueG, valueEl, sep, tone, unit: ri.unit, vsize, usize: Math.round(vsize * 0.82), cy: ty, anchor: 'start', valueX: 0, plan: ri.value ?? '', label: ri.label, x, y, w: W, h: Hh });
    });
    root.relayout = () => {
      let cur = tx + S.measure(root.titleEl.textContent, { size: tsize, weight: 700, family: 'display' });
      rows.forEach(row => {
        row.sep.setAttribute('x', H.f2(cur + 12));
        row.valueX = cur + 12 + S.measure('·', { size: tsize, weight: 600 }) + 12;
        row.valueEl.setAttribute('x', H.f2(row.valueX));
        cur = row.valueX + H.valueWidth(S, row.cur ?? '', { unit: row.unit, size: row.vsize, unitSize: row.usize });
      });
      return cur;
    };
    rows.forEach(row => writeValue(row, row.plan));
    const end = root.relayout();
    if (end > x + W - pad + 1) S.warn(`libSpecSheet card '${o.title}': content is ${Math.round(end - x + pad)}px wide, w is ${W}`);
  } else {
    // ================================================ full sheet
    W = o.w ?? 640;
    const pad = o.pad ?? 36;
    const vsize = o.valueSize ?? Math.round(size * 1.07);
    const rowH = o.rowH ?? Math.round(size * 2.3);
    const tsize = o.titleSize ?? 40;
    const hasHead = o.title != null;
    const headH = hasHead ? Math.round(tsize * 2.25) : 0;
    const noteH = o.note ? 52 : 0;
    const bodyTop = hasHead ? headH + pad * 0.4 : pad * 0.8;
    Hh = o.h ?? Math.round(bodyTop + rowsIn.length * rowH + pad * 0.8 + noteH);
    const { fold } = card(W, Hh);
    if (hasHead) {
      const hy = y + headH / 2 + 4;
      let tx = x + pad;
      if (o.icon !== null) {
        const iconS = Math.round(tsize * 1.25);
        const ic = { x: x + pad + iconS / 2, y: hy };
        if (o.icon === 'doc') root.iconEl = S.icon('ph:file-text-duotone', { ...ic, size: iconS, color: 'muted' }, face);
        else if (typeof o.icon === 'string' && o.icon !== 'chip') root.iconEl = S.icon(o.icon, { ...ic, size: iconS, color: 'muted' }, face);
        else root.iconEl = libChip(S, { size: iconS * 0.74, ...ic, label: null, ...(typeof o.icon === 'object' ? o.icon : {}) }, face);
        tx = x + pad + iconS + 20;
      }
      const kRight = x + W - pad - fold * 0.6;
      const kw = o.kicker ? S.measure(String(o.kicker).toUpperCase(), { size: 24, weight: 650, ls: 0.12 }) + 24 : 0;
      root.titleEl = S.text(o.title, { x: tx, y: hy, size: tsize, weight: 700, family: 'display', color: 'ink', maxW: kRight - kw - tx }, face);
      if (o.kicker) root.kickerEl = S.text(String(o.kicker).toUpperCase(), { x: kRight, y: hy + 2, size: 24, weight: 650, color: 'faint', ls: 0.12, anchor: 'end' }, face);
      root.rule = S.line({ x1: x + pad * 0.6, y1: y + headH, x2: x + W - pad * 0.6, y2: y + headH, stroke: '#ffffff', strokeOpacity: 0.12, sw: 1.5 }, face);
    }
    const tagged = rowsIn.filter(r => r.tag);
    const tagSize = 24;
    const tagW = tagged.length ? Math.max(...tagged.map(r => S.measure(r.tag, { size: tagSize, weight: 600 }))) + 32 : 0;
    const right = x + W - pad;
    const valueRight = tagW ? right - tagW - 22 : right;
    const accentX = x + pad, labelX = x + pad + 22;
    const pr = S.rand(o.seed ?? 5);
    const y0 = y + bodyTop;
    const inline = o.rowStyle === 'inline', pillStyle = o.valueStyle === 'pill';
    const start = o.start || 'shown';
    rowsIn.forEach((ri, i) => {
      const ry = y0 + i * rowH, cy = ry + rowH / 2;
      const tone = ri.tone || 'struct';
      const g = S.g(null, face);
      const band = S.rect({ x: x + pad * 0.45, y: ry + 5, w: W - pad * 0.9, h: rowH - 10, r: 12, fill: soft(tone), stroke: tone, strokeOpacity: 0.55, sw: 1.5, opacity: 0 }, g);
      const flash = H.ignore(S.rect({ x: x + pad * 0.45, y: ry + 5, w: W - pad * 0.9, h: rowH - 10, r: 12, fill: tone, opacity: 0 }, g));
      const body = S.g(null, g);
      if (i > 0) H.ignore(S.line({ x1: labelX, y1: ry, x2: right, y2: ry, stroke: '#ffffff', strokeOpacity: 0.06, sw: 1 }, body));
      const phH = Math.max(10, Math.round(size * 0.42));
      const ph = S.rect({ x: labelX, y: cy - phH / 2, w: (valueRight - labelX) * (typeof o.phLen === 'number' ? o.phLen : 0.48 + 0.4 * pr()), h: phH, r: phH / 2, fill: '#ffffff', fillOpacity: 0.1 }, body);
      const content = S.g(null, body);
      const row = { g, body, content, band, flash, ph, tone, x, y: ry, w: W, h: rowH, cy, placeholder: !!ri.placeholder, plan: ri.value ?? '', label: ri.label, unit: ri.unit, vsize, usize: Math.round(vsize * 0.8) };
      if (!ri.placeholder) {
        row.accent = S.rect({ x: accentX, y: cy - rowH * 0.2, w: 6, h: rowH * 0.4, r: 3, fill: tone }, content);
        if (inline) {
          const lt = (ri.label ?? '') + (ri.value != null ? ':' : '');
          row.labelEl = S.text(lt, { x: labelX, y: cy, size: vsize, weight: 600, color: tone }, content);
          row.valueX = labelX + S.measure(lt, { size: vsize, weight: 600 }) + 14;
          row.anchor = 'start';
        } else {
          row.labelEl = S.text(ri.label ?? '', { x: labelX, y: cy, size, weight: 550, color: 'ink', maxW: valueRight - labelX - 150 }, content);
          row.valueX = pillStyle ? valueRight - 15 : valueRight;
          row.anchor = 'end';
        }
        if (ri.value != null) {
          row.valueG = S.g(null, content);
          if (pillStyle) row.pill = [S.rect({ x: 0, y: 0, w: 10, h: 10, r: 14, fill: H.BASE }, row.valueG), S.rect({ x: 0, y: 0, w: 10, h: 10, r: 14, fill: soft(tone), stroke: tone, strokeOpacity: 0.75, sw: 2 }, row.valueG)];
          row.unitColor = pillStyle ? S.tone('muted') : undefined;
          row.valueEl = S.text('', { x: row.valueX, y: cy + 1, size: vsize, weight: 600, family: 'mono', color: pillStyle ? 'ink' : tone, anchor: row.anchor }, row.valueG);
          writeValue(row, ri.value);
        }
        if (ri.tag) {
          row.tagG = S.g(null, content);
          const tt = ri.tagTone || 'neutral';
          S.rect({ x: right - tagW, y: cy - 21, w: tagW, h: 42, r: 21, fill: H.BASE }, row.tagG);
          row.tagBg = S.rect({ x: right - tagW, y: cy - 21, w: tagW, h: 42, r: 21, fill: tt === 'neutral' ? 'none' : soft(tt), stroke: tt === 'neutral' ? '#ffffff' : tt, strokeOpacity: tt === 'neutral' ? 0.3 : 0.7, sw: 1.5 }, row.tagG);
          row.tagEl = S.text(ri.tag, { x: right - tagW / 2, y: cy + 1, size: tagSize, weight: 600, color: tt === 'neutral' ? 'muted' : 'ink', anchor: 'middle' }, row.tagG);
          row.tagX = right - tagW / 2;
        }
      }
      // start state: placeholder lines show for 'placeholder' rows always, and for real rows when start = 'placeholder'
      const showPh = ri.placeholder ? start !== 'empty' : start === 'placeholder';
      ph.setAttribute('opacity', showPh ? 1 : 0);
      if (!ri.placeholder && start !== 'shown') { content.style.opacity = 0; content.style.visibility = 'hidden'; }
      rows.push(row);
    });
    if (o.note) root.noteEl = S.text(o.note, { x: labelX, y: y + Hh - pad * 0.5 - 14, size: 24, weight: 500, color: 'muted' }, face);
  }
  root.rows = rows;

  // ------------------------------------------------ helpers
  const n = rows.length;
  const real = idx => H.sel(idx, n).filter(i => !rows[i].placeholder);

  root.reveal = (idx = 'all', ro = {}) => {
    const t = gsap.timeline();
    real(idx).forEach((i, k) => {
      const row = rows[i], at = k * (ro.stagger ?? 0.12), d = ro.d ?? 0.55;
      if (row.ph) t.fromTo(row.ph, { opacity: Number(row.ph.getAttribute('opacity')) || 0 }, { opacity: 0, duration: d * 0.5, ease: 'power1.in' }, at);
      t.fromTo(row.content, { autoAlpha: 0, x: -18 }, { autoAlpha: 1, x: 0, duration: d, ease: 'power3.out' }, at + d * 0.2);
    });
    return t;
  };
  root.brighten = (idx, bo = {}) => {
    const t = gsap.timeline();
    H.sel(idx, n).forEach(i => {
      const row = rows[i];
      if (!row.ph) return;
      t.fromTo(row.ph, { attr: { 'fill-opacity': 0.1 }, fill: '#ffffff' }, { attr: { 'fill-opacity': row.placeholder ? 0.28 : 0.6 }, fill: row.placeholder ? '#ffffff' : S.tone(row.tone), duration: bo.d ?? 0.4, ease: 'power2.out' }, 0);
    });
    return t;
  };
  let opPlan = rows.map(() => 1), bandPlan = rows.map(() => 0);
  const focusCh = H.channel(), flipCh = H.channel();
  rows.forEach(row => { row.valCh = H.channel(); row.glowCh = H.channel(); });
  function planTo(ops, bands, d) {
    const fo = opPlan.slice(), fb = bandPlan.slice();
    opPlan = ops; bandPlan = bands;
    return focusCh(0, 1, p => rows.forEach((row, i) => {
      row.body.style.opacity = H.lerp(fo[i], ops[i], p).toFixed(3);
      if (row.band) row.band.setAttribute('opacity', H.lerp(fb[i], bands[i], p).toFixed(3));
    }), { d: d ?? 0.5, ease: 'power2.inOut' });
  }
  root.focus = (i, fo = {}) => {
    if (i == null) return planTo(rows.map(() => 1), rows.map(() => 0), fo.d);
    const dim = fo.dim ?? 0.3;
    return planTo(rows.map((_, k) => (k === i ? 1 : dim)), rows.map((_, k) => (k === i ? 1 : 0)), fo.d);
  };
  root.dimRows = (idx, to = 0.3, dO = {}) => {
    const set = new Set(H.sel(idx, n));
    return planTo(opPlan.map((v, k) => (set.has(k) ? to : v)), bandPlan.slice(), dO.d);
  };
  root.glow = (idx, go = {}) => {
    const part = go.part || 'row', d = go.d ?? 0.8;
    const t = gsap.timeline();
    real(idx).forEach((i, k) => {
      const row = rows[i], at = k * (go.stagger ?? 0);
      const gt = H.GRAD.includes(go.tone || row.tone) ? (go.tone || row.tone) : 'struct';
      if (part === 'row' && row.flash) {
        t.add(row.glowCh(0, 1, p => { row.flash.setAttribute('fill', S.tone(gt)); row.flash.setAttribute('opacity', (Math.sin(Math.PI * p) * 0.28).toFixed(3)); }, { d, ease: 'none' }), at);
        return;
      }
      const tgt = part === 'tag' ? row.tagG : row.valueG;
      if (!tgt) return;
      const vw = row.cur != null ? H.valueWidth(S, row.cur, { unit: row.unit, size: row.vsize, unitSize: row.usize }) : 0;
      const ox = part === 'tag' ? row.tagX : row.anchor === 'end' ? row.valueX - vw / 2 : row.valueX + vw / 2;
      t.add(row.glowCh(0, 1, p => {
        const e = Math.sin(Math.PI * p);
        H.xf(tgt, ox, row.cy, 1 + 0.08 * e);
        if (e > 0.03) tgt.setAttribute('filter', `url(#glow-${gt})`); else tgt.removeAttribute('filter');
      }, { d, ease: 'none' }), at);
    });
    return t;
  };
  root.setValue = (i, text, so = {}) => {
    const row = rows[i];
    if (!row || !row.valueEl) return gsap.timeline();
    const from = row.plan; row.plan = text;
    return H.swapText(row.valueEl, from, text, so, cur => writeValue(row, cur), row.valCh);
  };
  root.count = (i, from, to, co = {}) => {
    const row = rows[i];
    if (!row || !row.valueEl) return gsap.timeline();
    const f = v => fmtOf(v, co.fmt);
    row.plan = f(to);
    return row.valCh(from, to, v => writeValue(row, f(v)), { d: co.d ?? 1.2, ease: co.ease || 'power2.out' });
  };
  let flipPlan = { title: o.title ?? '', values: rows.map(r => r.plan), notes: Array.isArray(root.noteEl) ? root.noteEl.map(e => e.textContent) : [] };
  root.flip = (to = {}, fo = {}) => {
    const from = flipPlan;
    const next = { title: to.title ?? from.title, values: from.values.slice(), notes: to.notes ?? from.notes };
    if (to.values) for (const k in to.values) next.values[k] = to.values[k];
    flipPlan = next;
    rows.forEach((row, i) => { row.plan = next.values[i]; });
    const fcx = x + W / 2, fcy = y + Hh / 2;
    const show = st => {
      if (root.titleEl) root.titleEl.textContent = st.title;
      if (Array.isArray(root.noteEl)) root.noteEl.forEach((e, k) => { if (st.notes[k] != null) e.textContent = st.notes[k]; });
      rows.forEach((row, i) => { if (row.valueEl && st.values[i] != null && row.cur !== st.values[i]) writeValue(row, st.values[i]); });
      if (root.relayout) root.relayout();
    };
    return flipCh(0, 1, p => {
      H.xf(face, fcx, fcy, 1, Math.max(0.02, Math.abs(Math.cos(Math.PI * p))));
      show(p < 0.5 ? from : next);
    }, { d: fo.d ?? 0.9, ease: 'power1.inOut' });
  };

  Object.assign(root, { x, y, w: W, h: Hh, l: x, r: x + W, t: y, b: y + Hh, cx: x + W / 2, cy: y + Hh / 2 });
  return root;
}


/* ================================================================== libServer */
/**
 * libServer — a rack-mount server seen from the front: a steel chassis with rack ears, a row of drive bays,
 * a perforated vent block and status lights (a teal power light that glows steady, an amber activity light).
 * Detail scales with size: a 420 px hero has screws, bay lights and handles; a 100 px icon stays clean.
 * Optional: a badge (an icon disc or a text pill), a spinner ("generating"), and a drawer that slides out
 * below the chassis to show the GPUs inside (libChip packages) drawing in one by one.
 *
 * o: {x = 960, y = 540 (centre of the chassis), w = 420, h = w × 0.235,
 *     detail = auto             'full' (w ≥ 240: screws, bay lights, handles) | 'lite' (≥ 90) | 'min',
 *     tone = 'neutral'          chassis outline tint ('compute' / 'bytes' / 'helps' to colour a machine by role),
 *     on = true                 power light lit at build (false: dark until .power(true)),
 *     badge = null              {icon, tone = 'struct'} (a disc at the top-right corner) or {text, icon, tone}
 *                               (a pill above the right end): e.g. {icon: 'ph:user-duotone'}, {text: 'KV cache', tone: 'helps'},
 *     spinner = false           draw a circular arrow on the face (hidden until .spin / .tick),
 *     spinnerTone = 'struct',
 *     gpus = 0                  GPUs in the drawer (0 = no drawer), gpuHbm = 1 (stacks a side per GPU),
 *     label = null, sub = null, labelSize = 30   text under the chassis (moves down when the drawer opens),
 *     seed = 9}
 * Returns <g> (root) with .chassis, .gpus[] (libChips, in the drawer), .tray {x,y,w,h} (drawer, open size),
 *   .badgeEl, .labelEl, .subEl, .leds[] (bay lights, full detail), .powerLed, and anchors .cx .cy .w .h .l .r .t .b
 * Helpers (return tweens/timelines; state helpers plan, call in time order):
 *   .open({d = 0.7, stagger = 0.22, draw = true})   the drawer slides out; GPUs draw on one by one (the
 *                                     first time; the GPUs are hidden until then unless draw: false)
 *   .close({d = 0.5})                 the drawer slides shut
 *   .power(on, {d = 0.4})             the power light (and bay lights) on / off
 *   .activity({d = 2, rate = 3})      bay and activity lights blink amber at random (seeded) for d seconds
 *   .glow({tone = 'helps', d = 0.5}) / .unglow({d})   a coloured halo round the chassis that stays: "this one"
 *   .spin({d = 2, turns = d × 0.8}) / .tick({d = 0.6})   the spinner turns steadily / once; .halt() hides it
 *   .port(side, gap = 0) → {x, y}     a point on the chassis edge for wires and pills
 * Example:
 *   const srv = libServer(S, { x: 1500, y: 470, w: 420, gpus: 4, label: 'A server' });
 *   S.add(S.fx.in(srv, { from: 'right' }), 'b1');
 *   S.add(srv.open(), 'b2~few');
 *   S.add(srv.activity({ d: 3 }), 'b2~never');
 */
function libServer(S, o = {}, parent) {
  const H = _libHW; H.defs();
  const w = o.w ?? 420, h = o.h ?? Math.round(w * 0.235);
  const cx = o.x ?? 960, cy = o.y ?? 540;
  const x0 = cx - w / 2, y0 = cy - h / 2;
  const tone = o.tone || 'neutral';
  const detail = o.detail || (w >= 240 ? 'full' : w >= 90 ? 'lite' : 'min');
  const root = S.g(null, parent);
  const U = H.unitShapes(x0, y0, w, h, detail);
  const sw = Math.max(1.2, Math.min(2.5, w / 180));

  // ---- drawer (behind the chassis): a top view of the inside, revealed by a clip that grows downward
  const gpuN = o.gpus || 0;
  let trayG = null, clipRect = null;
  root.gpus = [];
  if (gpuN) {
    const tw = w - 2 * U.e - w * 0.02;
    const gRows = gpuN > 4 ? 2 : 1, perRow = Math.ceil(gpuN / gRows);
    const gs = Math.min(w * 0.13, (tw * 0.92) / (perRow * 2.3));      // a package icon is 2.04 × size wide
    const fr = Math.max(6, w * 0.026), fanH = 2 * fr + w * 0.04;
    const th = Math.round(fanH + gRows * gs * 1.24 + (gRows - 1) * gs * 0.3 + w * 0.06);
    const tx = cx - tw / 2, ty = y0 + h - 4;
    const cid = H.nextId('hw-tray');
    const cp = document.createElementNS(H.NS, 'clipPath');
    cp.setAttribute('id', cid);
    root.appendChild(cp);
    clipRect = document.createElementNS(H.NS, 'rect');
    Object.entries({ x: tx - 4, y: ty, width: tw + 8, height: 0 }).forEach(([k, v]) => clipRect.setAttribute(k, v));
    cp.appendChild(clipRect);
    const clipG = S.g({ 'clip-path': `url(#${cid})` }, root);
    trayG = S.g(null, clipG);
    S.rect({ x: tx, y: ty, w: tw, h: th, r: 10, fill: '#0a1122', stroke: '#ffffff', strokeOpacity: 0.16, sw }, trayG);
    // fans along the back, a few traces, the GPUs
    const nf = Math.max(3, Math.round(tw / (fr * 4.2)));
    const fanRow = ty + 4 + w * 0.012 + fr;
    root.fans = [];
    for (let i = 0; i < nf; i++) root.fans.push(H.fan(S, trayG, tx + (i + 0.5) * tw / nf, fanRow, fr));
    H.ignore(S.line({ x1: tx + 14, y1: fanRow + fr + w * 0.014, x2: tx + tw - 14, y2: fanRow + fr + w * 0.014, stroke: '#ffffff', strokeOpacity: 0.08, sw: 1 }, trayG));
    const gTop = ty + fanH + w * 0.015;
    for (let i = 0; i < gpuN; i++) {
      const r = Math.floor(i / perRow), c = i % perRow, inRow = r === gRows - 1 ? gpuN - perRow * (gRows - 1) : perRow;
      root.gpus.push(libChip(S, { x: cx + (c - (inRow - 1) / 2) * (tw / perRow), y: gTop + gs * 0.62 + r * gs * 1.54, size: gs, hbm: o.gpuHbm ?? 1, seed: (o.seed ?? 9) + i * 17 }, trayG));
    }
    root.tray = { x: tx, y: ty, w: tw, h: th };
    H.ignore(trayG);
  }

  // ---- chassis
  const chassisG = S.g(null, root);
  root.chassis = chassisG;
  root.glowEl = S.path({ d: U.chassis, stroke: 'helps', sw: 3, opacity: 0, filter: 'url(#glow-helps)' }, chassisG);
  H.ignore(root.glowEl);
  S.path({ d: U.chassis, fill: detail === 'min' ? '#18223a' : 'url(#hw-steel)', filter: w >= 160 ? 'url(#shadow)' : undefined }, chassisG);
  const deco = H.ignore(S.g(null, chassisG));
  S.path({ d: U.ears, fill: '#0e1528', stroke: '#ffffff', strokeOpacity: 0.08, sw: 1 }, deco);
  if (U.screws) S.path({ d: U.screws, fill: '#3a4766' }, deco);
  S.path({ d: U.bays, fill: '#0a0f1c', stroke: '#ffffff', strokeOpacity: 0.1, sw: Math.max(0.6, sw * 0.5) }, deco);
  if (U.bayLines) S.path({ d: U.bayLines, stroke: '#ffffff', strokeOpacity: 0.16, sw: Math.max(0.8, h * 0.02), cap: 'round' }, deco);
  if (!o.spinner) S.path({ d: U.vents, fill: '#060a14', fillOpacity: 0.95 }, deco);
  if (detail !== 'min') H.ignore(S.line({ x1: x0 + U.e + 2, y1: y0 + 2.5, x2: x0 + w - U.e - 2, y2: y0 + 2.5, stroke: '#ffffff', strokeOpacity: 0.1, sw: 1.2 }, deco));
  root.outline = S.path({ d: U.chassis, stroke: tone === 'neutral' ? '#ffffff' : tone, strokeOpacity: tone === 'neutral' ? 0.26 : 0.75, sw }, chassisG);

  // ---- lights
  const ledG = H.ignore(S.g(null, chassisG));
  root.leds = U.leds.map(L => S.circle({ x: L.x, y: L.y, r: L.r, fill: 'helps', opacity: 0.55 }, ledG));
  const P = U.power;
  root.powerGlow = S.circle({ x: P.x, y: P.y, r: P.r * 3.4, fill: 'url(#pglow-helps)', opacity: 0 }, ledG);
  root.powerLed = S.circle({ x: P.x, y: P.y, r: P.r, fill: 'helps' }, ledG);
  const A = U.act;
  root.actGlow = S.circle({ x: A.x, y: A.y, r: A.r * 3.4, fill: 'url(#pglow-compute)', opacity: 0 }, ledG);
  root.actLed = S.circle({ x: A.x, y: A.y, r: A.r, fill: '#4a3a1c' }, ledG);
  // lights: a planned power level (power) and independent blink layers (activity), combined in one paint
  let powered = o.on !== false;
  const lights = { pw: powered ? 1 : 0, blinks: [] };
  const AMBC = S.tone('compute'), TEAL = S.tone('helps');
  const paintLights = () => {
    const v = lights.pw;
    root.powerLed.setAttribute('fill', H.mix(S, '#1d3a33', 'helps', v));
    root.powerGlow.setAttribute('opacity', (0.9 * v).toFixed(3));
    const on = i => lights.blinks.some(b => b[i]);
    const a = on(0);
    root.actLed.setAttribute('fill', a ? AMBC : '#4a3a1c');
    root.actGlow.setAttribute('opacity', a ? 0.9 : 0);
    root.leds.forEach((l, k) => {
      const b = on(k + 1);
      l.setAttribute('fill', b ? AMBC : TEAL);
      l.setAttribute('opacity', b ? 1 : (0.12 + 0.43 * v).toFixed(3));
    });
  };
  paintLights();

  // ---- spinner
  if (o.spinner) {
    const sr = h * 0.2, sx = x0 + w * 0.725, sy = cy;
    const sp = H.spinnerPath(sx, sy, sr);
    S.circle({ x: sx, y: sy, r: sr * 1.75, fill: '#0a1020', stroke: '#ffffff', strokeOpacity: 0.12, sw: 1.2 }, deco);
    root.spinnerG = S.g({ opacity: 0 }, chassisG);
    const rot = S.g(null, root.spinnerG);
    S.path({ d: sp.arc, stroke: o.spinnerTone || 'struct', sw: Math.max(2, sr * 0.3), cap: 'round' }, rot);
    S.path({ d: sp.head, stroke: o.spinnerTone || 'struct', sw: Math.max(2, sr * 0.3), cap: 'round', join: 'round' }, rot);
    root.spinnerRot = rot; root.spinnerAt = { x: sx, y: sy };
    H.ignore(root.spinnerG);
  }

  // ---- badge
  if (o.badge) {
    const b = o.badge;
    if (b.text) root.badgeEl = H.badge(S, root, x0 + w - Math.max(90, (S.measure(b.text, { size: b.size ?? 26, weight: 650 }) + 60) / 2) - 6, y0 - 34, b);
    else root.badgeEl = H.badge(S, root, x0 + w - U.e - h * 0.15, y0 - h * 0.05, b, h / 98);
  }

  // ---- label
  const lab = H.label(S, root, { l: x0, r: x0 + w, t: y0, b: y0 + h, cx, cy }, { ...o, labelSize: o.labelSize ?? 30, labelGap: o.labelGap ?? 16 });
  root.labelEl = lab.el; root.subEl = lab.sub; root.labelG = lab.g;

  // ---- helpers
  let openPlan = 0;
  const openCh = H.channel(), powerCh = H.channel(), glowCh = H.channel(), angCh = H.channel(), visCh = H.channel();
  const applyOpen = v => {
    if (!clipRect) return;
    const th = root.tray.h;
    clipRect.setAttribute('height', H.f2(th * v + 6));
    H.xf(trayG, 0, 0, 1, 1, 0, -th * (1 - v));
    if (root.labelG) H.xf(root.labelG, 0, 0, 1, 1, 0, (th - 4) * v);
  };
  if (clipRect) applyOpen(0);
  root.open = (oo = {}) => {
    const t = gsap.timeline();
    if (!clipRect) return t;
    const from = openPlan; openPlan = 1;
    const d = oo.d ?? 0.7;
    t.add(openCh(from, 1, applyOpen, { d, ease: 'power3.out' }), 0);
    if (oo.draw !== false && !root.__drawn) { root.__drawn = true; root.gpus.forEach((g, i) => t.add(g.drawOn({ d: 0.8 }), d * 0.55 + i * (oo.stagger ?? 0.22))); }
    return t;
  };
  root.close = (co = {}) => {
    if (!clipRect) return gsap.timeline();
    const from = openPlan; openPlan = 0;
    return openCh(from, 0, applyOpen, { d: co.d ?? 0.5, ease: 'power2.in' });
  };
  root.power = (on, po = {}) => {
    const from = powered ? 1 : 0; powered = !!on;
    return powerCh(from, on ? 1 : 0, v => { lights.pw = v; paintLights(); }, { d: po.d ?? 0.4, ease: 'power1.inOut' });
  };
  root.activity = (ao = {}) => {
    const d = ao.d ?? 2, rate = ao.rate ?? 3;
    const rnd = S.rand((ao.seed ?? o.seed ?? 9) * 131 + 7 + lights.blinks.length * 17);
    const n = 1 + root.leds.length;
    const ev = Array.from({ length: n }, () => { const out = []; let t = rnd() * 0.3; while (t < d - 0.2) { out.push(t); t += 0.08 + rnd() * 2 / rate; } return out; });
    const slot = new Uint8Array(n);
    lights.blinks.push(slot);
    return H.drive(0, d, t => {
      for (let i = 0; i < n; i++) {
        let on = 0;
        if (t < d) for (const t0 of ev[i]) { const dt = t - t0; if (dt < 0) break; if (dt < 0.09) on = 1; }
        slot[i] = on;
      }
      paintLights();
    }, { d, ease: 'none' });
  };
  let glowPlan = 0, glowTone = 'helps';
  const base0 = tone === 'neutral' ? '#ffffff' : tone, so0 = tone === 'neutral' ? 0.26 : 0.75;
  const paintGlow = (v, tn) => {
    root.glowEl.setAttribute('stroke', S.tone(tn));
    root.glowEl.setAttribute('filter', `url(#glow-${H.GRAD.includes(tn) ? tn : 'helps'})`);
    root.glowEl.setAttribute('opacity', v.toFixed(3));
    root.outline.setAttribute('stroke', H.mix(S, base0, tn, v));
    root.outline.setAttribute('stroke-opacity', H.lerp(so0, 0.95, v).toFixed(3));
  };
  root.glow = (go = {}) => {
    const from = glowPlan, tn = go.tone || 'helps'; glowPlan = 1; glowTone = tn;
    return glowCh(from, 1, v => paintGlow(v, tn), { d: go.d ?? 0.5 });
  };
  root.unglow = (go = {}) => {
    const from = glowPlan, tn = glowTone; glowPlan = 0;
    return glowCh(from, 0, v => paintGlow(v, tn), { d: go.d ?? 0.5 });
  };
  let spinAngle = 0, spinVis = 0;
  const showSpinner = (to, d) => { const from = spinVis; spinVis = to; return visCh(from, to, v => root.spinnerG.setAttribute('opacity', v.toFixed(3)), { d }); };
  const turn = (deg, d, ease) => {
    if (!root.spinnerRot) return gsap.timeline();
    const a0 = spinAngle; spinAngle += deg;
    const { x: sx, y: sy } = root.spinnerAt;
    const t = gsap.timeline();
    if (!spinVis) t.add(showSpinner(1, 0.2), 0);
    t.add(angCh(a0, a0 + deg, a => H.xf(root.spinnerRot, sx, sy, 1, 1, 0, 0, a), { d, ease }), 0);
    return t;
  };
  root.spin = (so = {}) => { const d = so.d ?? 2; return turn(360 * (so.turns ?? Math.max(1, Math.round(d * 0.8))), d, 'none'); };
  root.tick = (so = {}) => turn(360, so.d ?? 0.6, 'power2.inOut');
  root.halt = (ho = {}) => (root.spinnerG && spinVis ? showSpinner(0, ho.d ?? 0.3) : gsap.timeline());
  root.port = (side, gap = 0) => {
    if (side === 'left') return { x: x0 - gap, y: cy };
    if (side === 'right') return { x: x0 + w + gap, y: cy };
    if (side === 'top') return { x: cx, y: y0 - gap };
    return { x: cx, y: y0 + h + gap };
  };
  Object.assign(root, { cx, cy, w, h, l: x0, r: x0 + w, t: y0, b: y0 + h, detail });
  return root;
}


/* ================================================================== libRack */
/**
 * libRack — a rack cabinet seen from the front: a dark frame with a vented top cap and feet, rails, and a
 * column of server units, each with drive bays, vents and status lights. Tint it to give a group of machines
 * a role (amber 'prefill machines', coral 'decode machines'). One unit can be a full libServer (hero).
 *
 * o: {x = 960, y = 540 (centre), w = 220, units = 8,
 *     tone = 'neutral'          frame tint and a coloured strip on the cap ('compute', 'bytes', 'helps'…),
 *     hero = null               index of a unit drawn as a full libServer (returned as .hero),
 *     badge = null              {icon | text, tone}, as libServer (at the cap's right corner),
 *     label = null, sub = null, labelSize = 28, on = true, seed = 4}
 * Returns <g> (root) with .units[] (each a <g> with .cx .cy .w .h .led .act), .hero, .badgeEl, .labelEl,
 *   and anchors .cx .cy .w .h .l .r .t .b
 * Helpers (return tweens/timelines):
 *   .fill({d = 0.35, stagger = 0.07, from = 'bottom'})   the units slide in one by one
 *   .blink({d = 2, rate = 2.5})          activity lights blink amber at random for d seconds
 *   .power(on, {d = 0.4})                all power lights on / off
 *   .highlight(i, {tone = 'helps', d = 0.4}) / .unhighlight({d})   a glowing frame round unit i
 * Example:
 *   const prefill = libRack(S, { x: 520, y: 600, w: 160, units: 6, tone: 'compute', label: 'prefill machines' });
 *   S.add(S.fx.in(prefill, { from: 'up' }), 'b4~split');
 *   S.add(prefill.blink({ d: 3 }), 'b4~split+0.5');
 */
function libRack(S, o = {}, parent) {
  const H = _libHW; H.defs();
  const w = o.w ?? 220, nU = o.units ?? 8;
  const cx = o.x ?? 960, cy = o.y ?? 540;
  const tone = o.tone || 'neutral';
  const G = H.rackGeom(w, nU);
  const x0 = cx - w / 2, y0 = cy - G.h / 2;
  const root = S.g(null, parent);
  const sw = Math.max(1.2, Math.min(2.5, w / 110));
  // cabinet
  root.glowEl = H.ignore(S.rect({ x: x0, y: y0, w, h: G.h - G.foot, r: G.r, stroke: 'helps', sw: 3, opacity: 0, filter: 'url(#glow-helps)' }, root));
  const feet = H.ignore(S.g(null, root));
  S.rect({ x: x0 + w * 0.08, y: y0 + G.h - G.foot - 2, w: w * 0.14, h: G.foot + 2, r: 2, fill: '#0b1120' }, feet);
  S.rect({ x: x0 + w * 0.78, y: y0 + G.h - G.foot - 2, w: w * 0.14, h: G.foot + 2, r: 2, fill: '#0b1120' }, feet);
  S.rect({ x: x0, y: y0, w, h: G.h - G.foot, r: G.r, fill: 'url(#hw-cab)', filter: w >= 120 ? 'url(#shadow)' : undefined }, root);
  const deco = H.ignore(S.g(null, root));
  S.rect({ x: x0 + G.f, y: y0 + G.cap, w: w - 2 * G.f, h: G.inH, r: G.r * 0.5, fill: '#060a14' }, deco);
  // cap vents and tone strip
  let vd = '';
  const nv = Math.max(4, Math.round(w / 18));
  for (let i = 0; i < nv; i++) vd += H.rr(x0 + G.f + 4 + i * (w - 2 * G.f - 8) / nv + 2, y0 + G.cap * 0.32, (w - 2 * G.f - 8) / nv - 4, G.cap * 0.32, 1.5);
  S.path({ d: vd, fill: '#060a14' }, deco);
  if (tone !== 'neutral') S.rect({ x: x0 + G.f, y: y0 + G.cap * 0.12, w: w - 2 * G.f, h: Math.max(2, G.cap * 0.12), r: 1.5, fill: tone, opacity: 0.85 }, deco);
  // rails with mounting holes
  let rd = '';
  for (const rx of [x0 + G.f * 0.5, x0 + w - G.f * 0.5]) for (let k = 0; k < nU * 3; k++) rd += H.circ(rx, y0 + G.cap + G.pad + (k + 0.5) * (G.inH - 2 * G.pad) / (nU * 3), Math.max(0.6, G.f * 0.09));
  S.path({ d: rd, fill: '#2b3756' }, deco);
  root.frame = S.rect({ x: x0, y: y0, w, h: G.h - G.foot, r: G.r, stroke: tone === 'neutral' ? '#ffffff' : tone, strokeOpacity: tone === 'neutral' ? 0.18 : 0.7, sw }, root);
  // units
  const uw = w - 2 * G.f - 2 * G.side;
  root.units = [];
  const detail = uw >= 240 ? 'full' : uw >= 90 ? 'lite' : 'min';
  for (let i = 0; i < nU; i++) {
    const ux = x0 + G.f + G.side, uy = y0 + G.cap + G.pad + i * (G.uh + G.ug);
    if (o.hero === i) {
      root.hero = libServer(S, { x: ux + uw / 2, y: uy + G.uh / 2, w: uw, h: G.uh, tone: o.heroTone, seed: (o.seed ?? 4) + i }, root);
      root.hero.cx = ux + uw / 2;
      root.units.push(Object.assign(root.hero, { led: root.hero.powerLed, act: root.hero.actLed }));
      continue;
    }
    const ug = S.g(null, root);
    const U = H.unitShapes(ux, uy, uw, G.uh, detail);
    S.path({ d: U.chassis, fill: '#18223a', stroke: '#ffffff', strokeOpacity: 0.12, sw: Math.max(0.6, sw * 0.5) }, ug);
    const ud = H.ignore(S.g(null, ug));
    S.path({ d: U.ears, fill: '#0e1528' }, ud);
    S.path({ d: U.bays, fill: '#0a0f1c' }, ud);
    if (U.bayLines) S.path({ d: U.bayLines, stroke: '#ffffff', strokeOpacity: 0.14, sw: Math.max(0.6, G.uh * 0.02) }, ud);
    S.path({ d: U.vents, fill: '#060a14' }, ud);
    ug.led = S.circle({ x: U.power.x, y: U.power.y, r: U.power.r, fill: 'helps' }, ud);
    ug.act = S.circle({ x: U.act.x, y: U.act.y, r: U.act.r, fill: '#4a3a1c' }, ud);
    Object.assign(ug, { cx: ux + uw / 2, cy: uy + G.uh / 2, w: uw, h: G.uh, x: ux, y: uy });
    root.units.push(ug);
  }
  // highlight frame (one, moved to the unit highlighted)
  root.hiEl = H.ignore(S.rect({ x: 0, y: 0, w: uw + 8, h: G.uh + 8, r: 5, stroke: 'helps', sw: 2.5, opacity: 0, filter: 'url(#glow-helps)' }, root));
  if (o.badge) {
    const b = o.badge;
    if (b.text) root.badgeEl = H.badge(S, root, cx, y0 - 30, b);
    else root.badgeEl = H.badge(S, root, x0 + w - G.f, y0 + G.cap * 0.2, b, w / 200);
  }
  const lab = H.label(S, root, { l: x0, r: x0 + w, t: y0, b: y0 + G.h, cx, cy }, { ...o, labelSize: o.labelSize ?? 28, labelGap: o.labelGap ?? 14 });
  root.labelEl = lab.el; root.subEl = lab.sub; root.labelG = lab.g;

  let powered = o.on !== false;
  const powerCh = H.channel(), hiCh = H.channel();
  const blinks = [];
  const paintPower = v => root.units.forEach(u => u !== root.hero && u.led && u.led.setAttribute('fill', H.mix(S, '#1d3a33', 'helps', v)));
  const paintAct = () => root.units.forEach((u, i) => { if (u !== root.hero && u.act) u.act.setAttribute('fill', blinks.some(b => b[i]) ? S.tone('compute') : '#4a3a1c'); });
  paintPower(powered ? 1 : 0);
  root.power = (on, po = {}) => {
    const from = powered ? 1 : 0; powered = !!on;
    const t = gsap.timeline();
    t.add(powerCh(from, on ? 1 : 0, paintPower, { d: po.d ?? 0.4 }), 0);
    if (root.hero) t.add(root.hero.power(on, po), 0);
    return t;
  };
  root.blink = (bo = {}) => {
    const d = bo.d ?? 2, rate = bo.rate ?? 2.5;
    const rnd = S.rand((bo.seed ?? o.seed ?? 4) * 53 + 1 + blinks.length * 29);
    const ev = root.units.map(() => { const out = []; let t = rnd() * 0.5; while (t < d - 0.15) { out.push(t); t += 0.1 + rnd() * 2 / rate; } return out; });
    const slot = new Uint8Array(root.units.length);
    blinks.push(slot);
    const t = gsap.timeline();
    t.add(H.drive(0, d, tt => {
      root.units.forEach((u, i) => {
        let on = 0;
        if (tt < d) for (const t0 of ev[i]) { const dt = tt - t0; if (dt < 0) break; if (dt < 0.1) on = 1; }
        slot[i] = on;
      });
      paintAct();
    }, { d, ease: 'none' }), 0);
    if (root.hero) t.add(root.hero.activity({ d, rate, seed: (bo.seed ?? 4) + 3 }), 0);
    return t;
  };
  root.fill = (fo = {}) => {
    const ord = root.units.map((_, i) => ((fo.from || 'bottom') === 'bottom' ? nU - 1 - i : i));
    return gsap.fromTo(root.units, { autoAlpha: 0, x: -w * 0.25 }, { autoAlpha: 1, x: 0, duration: fo.d ?? 0.35, ease: 'power3.out', stagger: i => ord[i] * (fo.stagger ?? 0.07) });
  };
  let hiPlan = 0;
  root.highlight = (i, ho = {}) => {
    const u = root.units[i];
    const tn = ho.tone || 'helps';
    const from = hiPlan; hiPlan = 1;
    return hiCh(from, 1, v => {
      root.hiEl.setAttribute('x', H.f2(u.cx - (uw + 8) / 2)); root.hiEl.setAttribute('y', H.f2(u.cy - (G.uh + 8) / 2));
      root.hiEl.setAttribute('stroke', S.tone(tn));
      root.hiEl.setAttribute('filter', `url(#glow-${H.GRAD.includes(tn) ? tn : 'helps'})`);
      root.hiEl.setAttribute('opacity', v.toFixed(3));
    }, { d: ho.d ?? 0.4 });
  };
  root.unhighlight = (ho = {}) => { const from = hiPlan; hiPlan = 0; return hiCh(from, 0, v => root.hiEl.setAttribute('opacity', v.toFixed(3)), { d: ho.d ?? 0.4 }); };
  root.port = (side, gap = 0) => {
    if (side === 'left') return { x: x0 - gap, y: cy };
    if (side === 'right') return { x: x0 + w + gap, y: cy };
    if (side === 'top') return { x: cx, y: y0 - gap };
    return { x: cx, y: y0 + G.h + gap };
  };
  Object.assign(root, { cx, cy, w, h: G.h, l: x0, r: x0 + w, t: y0, b: y0 + G.h, unitH: G.uh, unitW: uw });
  return root;
}

/** rack geometry from width and unit count (shared by libRack and libDataCentre) */
_libHW.rackGeom = function (w, nU) {
  const f = w * 0.07, side = w * 0.025;
  const uw = w - 2 * f - 2 * side, uh = uw * 0.235, ug = uh * 0.12, pad = uh * 0.22;
  const cap = Math.max(6, w * 0.11), foot = Math.max(3, w * 0.035);
  const inH = nU * uh + (nU - 1) * ug + 2 * pad;
  return { f, side, uh, ug, pad, cap, foot, inH, h: cap + inH + f * 0.9 + foot, r: Math.max(3, w * 0.035) };
};


/* ================================================================== libDataCentre */
/**
 * libDataCentre — production scale: a row of racks (an aisle) or several rows (a hall), optionally inside a
 * building outline with a roof line, rooftop fans and a label. Drawn as a few batched paths, so hundreds of
 * racks stay cheap and crisp under a camera pull-back. One unit can be a real libServer (o.hero), so a scene
 * can start close on a server and pull back until it is one unit in one rack among many.
 *
 * o: {x = 960, y = 540 (centre of the racks, building excluded), rows = 1, racks = 8 (per row), units = 8,
 *     rackW = 120, gapX = rackW × 0.16, gapY = rack height × 0.35 (between rows),
 *     building = rows > 1     draw the building: walls, roof line, rooftop units with fans,
 *     label = 'data centre'   (building only; null for none), labelSize = auto (≈ 3% of the building width, ≥ 28),
 *     fans = racks ÷ 2        rooftop fans, tone = 'neutral' (rack tint),
 *     hero = null             {row, rack, unit}: that unit is drawn as a full libServer (.hero), built with
 *                             heroOpts = {} (any libServer options: gpus, label, spinner, badge…),
 *     heroAt = null           {x, y, w}: place the whole hall so the hero unit is centred on (x, y) and w wide
 *                             (rackW then follows from w); the scene's server IS dc.hero, and the racks and
 *                             building around it (.racksG, .buildingG) can be hidden until the pull-back,
 *     detail = auto           batched unit detail 'full' | 'lite' | 'min' (from the unit width),
 *     blinkers = 40           how many activity lights can blink (seeded subset), seed = 2}
 * Returns <g> (root) with .hero, .racksG (all batched racks), .buildingG (walls, roof, fans; or none), .floor
 *   (aisle line, no building), .fans[], .building {x,y,w,h} (or null), .labelEl, and
 *   .rackBox(row, rack) → {x, y, w, h, cx, cy}, .unitBox(row, rack, unit) → {x, y, w, h, cx, cy}
 *   (targets for fx.cam), anchors .cx .cy .w .h .l .r .t .b (the whole drawing, building included)
 * Helpers (return tweens/timelines):
 *   .blink({d = 2, rate = 2})            activity lights across the hall blink amber
 *   .spinFans({d = 2, turns = d × 0.7})  the rooftop fans turn ("cooled day and night")
 *   .highlightRack(row, rack, {tone = 'helps', d = 0.4})   a glowing outline round one rack (stays)
 * Example:
 *   const dc = libDataCentre(S, { x: 960, y: 560, rows: 3, racks: 10, units: 10, rackW: 440, hero: { row: 1, rack: 4, unit: 5 } });
 *   const u = dc.unitBox(1, 4, 5);
 *   S.add(S.fx.cam({ x: u.cx, y: u.cy, scale: 1, d: 0.01 }), 0);          // start close on the hero server
 *   S.add(S.fx.cam({ x: dc.cx, y: dc.cy, scale: 1000 / dc.h, d: 1.6 }), 'b3');   // pull back to the hall
 *   S.set(dc.labelEl, { autoAlpha: 0 }, 0); S.add(S.fx.in(dc.labelEl), 'b3+1.7');   // label once the camera settles
 * The label is sized for the pulled-back view (≈ 3% of the building width); in a pull-back hide it until the
 * camera settles, or it is huge and off-screen on the way out.
 */
function libDataCentre(S, o = {}, parent) {
  const H = _libHW; H.defs();
  const nR = o.rows ?? 1, nK = o.racks ?? 8, nU = o.units ?? 8;
  const hero = o.hero;
  const at = hero && o.heroAt;
  const rw = at && at.w ? at.w / 0.81 : (o.rackW ?? 120);      // a unit is 0.81 × the rack width
  const G = H.rackGeom(rw, nU);
  const gapX = o.gapX ?? rw * 0.16, gapY = o.gapY ?? G.h * 0.35;
  const RW = nK * rw + (nK - 1) * gapX, RH = nR * G.h + (nR - 1) * gapY;
  const uw = rw - 2 * G.f - 2 * G.side;
  let X0, Y0;
  if (at) {        // place the hall so the hero unit's centre lands on (heroAt.x, heroAt.y)
    X0 = at.x - (hero.rack * (rw + gapX) + G.f + G.side + uw / 2);
    Y0 = at.y - (hero.row * (G.h + gapY) + G.cap + G.pad + hero.unit * (G.uh + G.ug) + G.uh / 2);
  } else { X0 = (o.x ?? 960) - RW / 2; Y0 = (o.y ?? 540) - RH / 2; }
  const root = S.g(null, parent);
  const tone = o.tone || 'neutral';
  const detail = o.detail || (uw >= 240 ? 'full' : uw >= 90 ? 'lite' : 'min');
  const rackBox = (r, k) => { const x = X0 + k * (rw + gapX), y = Y0 + r * (G.h + gapY); return { x, y, w: rw, h: G.h, cx: x + rw / 2, cy: y + G.h / 2 }; };
  const unitBox = (r, k, u) => { const b = rackBox(r, k); const x = b.x + G.f + G.side, y = b.y + G.cap + G.pad + u * (G.uh + G.ug); return { x, y, w: uw, h: G.uh, cx: x + uw / 2, cy: y + G.uh / 2 }; };
  root.rackBox = rackBox; root.unitBox = unitBox;
  const isHero = (r, k, u) => hero && hero.row === r && hero.rack === k && hero.unit === u;

  // ---- building
  const building = o.building ?? nR > 1;
  let bx = X0, by = Y0, bw = RW, bh = RH;
  root.fans = [];
  if (building) {
    const P = rw * 0.35 + RW * 0.04;
    bx = X0 - P; bw = RW + 2 * P;
    const roofH = Math.max(rw * 0.45, RH * 0.1);
    by = Y0 - P - roofH; bh = RH + 2 * P + roofH;
    const swB = Math.max(2, bw * 0.0025);
    const bg = S.g(null, root);
    root.buildingG = bg;
    S.rect({ x: bx, y: by + roofH, w: bw, h: bh - roofH, r: swB * 3, fill: 'url(#hw-hall)', stroke: '#ffffff', strokeOpacity: 0.24, sw: swB }, bg);
    // roof: parapet band and rooftop units with fans
    S.rect({ x: bx - swB * 3, y: by + roofH - swB * 6, w: bw + swB * 6, h: swB * 6, r: swB * 2, fill: '#1a2440', stroke: '#ffffff', strokeOpacity: 0.22, sw: swB * 0.8 }, bg);
    const nf = o.fans ?? Math.max(2, Math.round(nK / 2));
    const fu = Math.min(roofH * 0.75, bw / (nf * 1.8), rw * 0.55);
    for (let i = 0; i < nf; i++) {
      const fx = bx + (i + 0.5) * bw / nf, fy = by + roofH - swB * 6 - fu * 0.5;
      S.rect({ x: fx - fu * 0.62, y: fy - fu * 0.5, w: fu * 1.24, h: fu, r: fu * 0.08, fill: '#141d33', stroke: '#ffffff', strokeOpacity: 0.18, sw: swB * 0.7 }, bg);
      root.fans.push(H.fan(S, bg, fx, fy, fu * 0.38));
    }
    // floor lines under each row (the aisles)
    let fl = '';
    for (let r = 0; r < nR; r++) { const yb = Y0 + r * (G.h + gapY) + G.h; fl += `M${H.f2(X0 - P * 0.5)},${H.f2(yb + 1)}H${H.f2(X0 + RW + P * 0.5)}`; }
    H.ignore(S.path({ d: fl, stroke: '#ffffff', strokeOpacity: 0.1, sw: swB }, bg));
    root.building = { x: bx, y: by, w: bw, h: bh, roofH };
    H.ignore(bg);
  } else {
    root.building = null;
    let fl = '';
    for (let r = 0; r < nR; r++) { const yb = Y0 + r * (G.h + gapY) + G.h; fl += `M${H.f2(X0 - rw * 0.2)},${H.f2(yb + 1)}H${H.f2(X0 + RW + rw * 0.2)}`; }
    root.floor = H.ignore(S.path({ d: fl, stroke: '#ffffff', strokeOpacity: 0.12, sw: Math.max(1.5, rw / 80) }, root));
  }

  // ---- racks, batched
  let cab = '', inner = '', units = '', ears = '', bays = '', vents = '', leds = '', caps = '';
  const blinkers = [];
  for (let r = 0; r < nR; r++) for (let k = 0; k < nK; k++) {
    const b = rackBox(r, k);
    cab += H.rr(b.x, b.y, rw, G.h - G.foot, G.r);
    cab += H.rr(b.x + rw * 0.08, b.y + G.h - G.foot - 1, rw * 0.14, G.foot + 1, 1) + H.rr(b.x + rw * 0.78, b.y + G.h - G.foot - 1, rw * 0.14, G.foot + 1, 1);
    inner += H.rr(b.x + G.f, b.y + G.cap, rw - 2 * G.f, G.inH, G.r * 0.5);
    caps += H.rr(b.x + G.f + 2, b.y + G.cap * 0.32, rw - 2 * G.f - 4, G.cap * 0.32, 1.5);
    for (let u = 0; u < nU; u++) {
      if (isHero(r, k, u)) continue;
      const ub = unitBox(r, k, u);
      const U = H.unitShapes(ub.x, ub.y, ub.w, ub.h, detail);
      units += U.chassis; ears += U.ears; bays += U.bays; vents += U.vents;
      leds += H.circ(U.power.x, U.power.y, U.power.r);
      blinkers.push(U.act);
    }
  }
  const rg = H.ignore(S.g(null, root));
  root.racksG = rg;
  S.path({ d: cab, fill: '#111a2e', stroke: tone === 'neutral' ? '#ffffff' : tone, strokeOpacity: tone === 'neutral' ? 0.16 : 0.6, sw: Math.max(1, rw / 120) }, rg);
  S.path({ d: inner, fill: '#060a14' }, rg);
  S.path({ d: caps, fill: '#060a14' }, rg);
  S.path({ d: units, fill: '#18223a', stroke: '#ffffff', strokeOpacity: 0.1, sw: Math.max(0.5, rw / 300) }, rg);
  S.path({ d: ears, fill: '#0e1528' }, rg);
  S.path({ d: bays, fill: '#0a0f1c' }, rg);
  S.path({ d: vents, fill: '#060a14' }, rg);
  S.path({ d: leds, fill: 'helps', fillOpacity: 0.85 }, rg);
  // activity lights: a seeded subset are real circles that can blink; the rest are a static path
  const nb = Math.min(blinkers.length, o.blinkers ?? 40);
  const pick = H.ranks(S, blinkers.length, (o.seed ?? 2) + 5);
  let staticAct = '';
  root.actLeds = [];
  blinkers.forEach((L, i) => {
    if (pick[i] < nb) root.actLeds.push(S.circle({ x: L.x, y: L.y, r: L.r, fill: '#4a3a1c' }, rg));
    else staticAct += H.circ(L.x, L.y, L.r);
  });
  if (staticAct) S.path({ d: staticAct, fill: '#4a3a1c' }, rg);
  root.hiEl = H.ignore(S.rect({ x: 0, y: 0, w: rw + 12, h: G.h + 12, r: G.r + 4, stroke: 'helps', sw: Math.max(2.5, rw / 60), opacity: 0, filter: 'url(#glow-helps)' }, root));
  if (hero) {
    const ub = unitBox(hero.row, hero.rack, hero.unit);
    root.hero = libServer(S, { seed: o.seed ?? 2, ...(o.heroOpts || {}), x: ub.cx, y: ub.cy, w: ub.w, h: ub.h }, root);
  }
  // ---- label
  if (building && o.label !== null) {
    const ls = o.labelSize ?? Math.round(Math.max(28, bw * 0.03));
    root.labelEl = S.text(o.label ?? 'data centre', { x: bx, y: by - ls * 0.9, size: ls, weight: 650, color: 'ink', family: 'display' }, root);
  }

  const blinks = [], fanCh = H.channel(), hiCh = H.channel();
  const amb = S.tone('compute');
  const paintAct = () => root.actLeds.forEach((l, i) => l.setAttribute('fill', blinks.some(b => b[i]) ? amb : '#4a3a1c'));
  root.blink = (bo = {}) => {
    const d = bo.d ?? 2, rate = bo.rate ?? 2;
    const r2 = S.rand((bo.seed ?? o.seed ?? 2) * 71 + 3 + blinks.length * 37);
    const ev = root.actLeds.map(() => { const out = []; let t = r2() * 0.8; while (t < d - 0.15) { out.push(t); t += 0.12 + r2() * 2 / rate; } return out; });
    const slot = new Uint8Array(root.actLeds.length);
    blinks.push(slot);
    return H.drive(0, d, t => {
      root.actLeds.forEach((l, i) => {
        let on = 0;
        if (t < d) for (const t0 of ev[i]) { const dt = t - t0; if (dt < 0) break; if (dt < 0.12) on = 1; }
        slot[i] = on;
      });
      paintAct();
    }, { d, ease: 'none' });
  };
  let fanAngle = 0;
  root.spinFans = (so = {}) => {
    const d = so.d ?? 2, deg = 360 * (so.turns ?? Math.max(1, d * 0.7));
    const a0 = fanAngle; fanAngle += deg;
    return fanCh(a0, a0 + deg, a => root.fans.forEach(f => H.xf(f.rotor, f.cx, f.cy, 1, 1, 0, 0, a)), { d, ease: so.ease || 'none' });
  };
  let hiPlan = 0;
  root.highlightRack = (r, k, ho = {}) => {
    const b = rackBox(r, k), tn = ho.tone || 'helps';
    const from = hiPlan; hiPlan = 1;
    return hiCh(from, 1, v => {
      root.hiEl.setAttribute('x', H.f2(b.x - 6)); root.hiEl.setAttribute('y', H.f2(b.y - 6));
      root.hiEl.setAttribute('stroke', S.tone(tn));
      root.hiEl.setAttribute('filter', `url(#glow-${H.GRAD.includes(tn) ? tn : 'helps'})`);
      root.hiEl.setAttribute('opacity', v.toFixed(3));
    }, { d: ho.d ?? 0.4 });
  };
  const lblH = root.labelEl ? (o.labelSize ?? Math.round(Math.max(28, bw * 0.03))) * 1.5 : 0;
  const L = building ? bx : X0, T = (building ? by : Y0) - lblH, Wd = building ? bw : RW, Hd = (building ? bh : RH) + lblH;
  Object.assign(root, { cx: L + Wd / 2, cy: T + Hd / 2, w: Wd, h: Hd, l: L, r: L + Wd, t: T, b: T + Hd, racksBox: { x: X0, y: Y0, w: RW, h: RH } });
  return root;
}


/* ================================================================== libDevice */
/**
 * libDevice — the user's side of a request. A laptop, drawn three-quarter front: a lid with a glowing screen,
 * a keyboard deck in perspective with a touchpad, and (optionally) a small chip inside, shown x-ray on the
 * deck. Or a phone: a slim body with a screen, side buttons and a camera island. Screens show a tiny chat
 * by default; .screen is a clipped group for your own content. style: 'icon' uses the full-colour Fluent
 * emoji (fluent:laptop / fluent:mobile-phone) for very small uses.
 *
 * o: {kind = 'laptop' | 'phone', x = 960, y = 540 (centre of the device),
 *     w = 320 (laptop) / 150 (phone); style 'icon': 140 / 90,
 *     style = 'drawn'           'drawn' (default: in the film's palette, with every helper) | 'icon' (the
 *                               full-colour Fluent emoji; off-palette, so only for tiny uses; helpers limited
 *                               to ping / sleep / wake / port),
 *     screen = 'chat'           screen content: 'chat' (a tiny conversation, decorative) | 'blank',
 *     on = true                 screen lit at build (false: dark until .wake),
 *     chip = false              (laptop) a small amber chip on the deck: "one small chip, inside"; .chip,
 *     badge = null              {icon | text, tone}, at the top-right corner,
 *     label = null, sub = null, labelSize = 30}
 * Returns <g> (root) with .screen (clipped content group), .glass {x,y,w,h} (screen rectangle), .lid, .deck,
 *   .chip (a libChip), .badgeEl, .labelEl, .subEl, and anchors .cx .cy .w .h .l .r .t .b
 * Helpers (return tweens/timelines; state helpers plan, call in time order):
 *   .close({d = 0.7}) / .open({d = 0.7})   (laptop) the lid folds down onto the deck, screen going dark / and back
 *   .sleep({d = 0.4}) / .wake({d = 0.4})   the screen turns off / on
 *   .ping({tone = 'struct', d = 0.6})      the screen brightens once: something arrived
 *   .port(side, gap = 0) → {x, y}          'left' | 'right' (the deck's sides, laptop; body sides, phone) |
 *                                          'top' | 'bottom' | 'screen' (the screen's centre)
 * Example:
 *   const lap = libDevice(S, { x: 330, y: 470, w: 320, chip: true, label: 'your device' });
 *   S.add(S.fx.in(lap, { from: 'left' }), 'b1');
 *   S.add(lap.chip.pulse(), 'b2~small chip');
 *   S.add(lap.close(), 'b2~never'); S.add(lap.open(), 'b2~never+1.4');
 */
function libDevice(S, o = {}, parent) {
  const H = _libHW; H.defs();
  const kind = o.kind || 'laptop';
  const cx = o.x ?? 960, cy = o.y ?? 540;
  const root = S.g(null, parent);
  if (o.style === 'icon') {
    const w = o.w ?? (kind === 'phone' ? 90 : 140);
    root.iconEl = S.icon(kind === 'phone' ? 'fluent:mobile-phone' : 'fluent:laptop', { x: cx, y: cy, size: w }, root);
    const hh = kind === 'phone' ? w * 0.5 : w * 0.42;
    const lab = H.label(S, root, { l: cx - w / 2, r: cx + w / 2, t: cy - hh, b: cy + hh, cx, cy }, { ...o, labelSize: o.labelSize ?? 28 });
    root.labelEl = lab.el; root.subEl = lab.sub; root.labelG = lab.g;
    root.port = (side, gap = 0) => (side === 'left' ? { x: cx - w / 2 - gap, y: cy } : side === 'right' ? { x: cx + w / 2 + gap, y: cy } : side === 'top' ? { x: cx, y: cy - hh - gap } : { x: cx, y: cy + hh + gap });
    root.ping = (po = {}) => H.drive(0, 1, p => H.xf(root.iconEl, cx, cy, 1 + 0.08 * Math.sin(Math.PI * p)), { d: po.d ?? 0.6, ease: 'none' });
    root.sleep = () => gsap.to(root.iconEl, { opacity: 0.4, duration: 0.4 });
    root.wake = () => gsap.to(root.iconEl, { opacity: 1, duration: 0.4 });
    root.close = root.sleep; root.open = root.wake;
    Object.assign(root, { cx, cy, w, h: 2 * hh, l: cx - w / 2, r: cx + w / 2, t: cy - hh, b: cy + hh });
    return root;
  }

  let glass, lidFront, lidBack, hingeY, L = {};
  const screenOn = o.on !== false && o.screen !== 'off';
  if (kind === 'phone') {
    const w = o.w ?? 150, h = Math.round(w * 2.02), r = w * 0.17;
    const x0 = cx - w / 2, y0 = cy - h / 2, sw = Math.max(1.5, w / 80);
    const btn = H.ignore(S.g(null, root));
    S.rect({ x: x0 - w * 0.025, y: y0 + h * 0.2, w: w * 0.03, h: h * 0.07, r: 2, fill: '#2a3656' }, btn);
    S.rect({ x: x0 - w * 0.025, y: y0 + h * 0.3, w: w * 0.03, h: h * 0.1, r: 2, fill: '#2a3656' }, btn);
    S.rect({ x: x0 + w - w * 0.005, y: y0 + h * 0.26, w: w * 0.03, h: h * 0.13, r: 2, fill: '#2a3656' }, btn);
    S.rect({ x: x0, y: y0, w, h, r, fill: 'url(#hw-shell)', filter: 'url(#shadow)' }, root);
    root.bodyLine = S.rect({ x: x0, y: y0, w, h, r, stroke: '#ffffff', strokeOpacity: 0.28, sw }, root);
    const b = w * 0.045;
    glass = { x: x0 + b, y: y0 + b, w: w - 2 * b, h: h - 2 * b, r: r - b };
    L = { x0, y0, w, h };
    lidFront = S.g(null, root);
  } else {
    const w = o.w ?? 320;
    const lidW = w * 0.84, lidH = w * 0.56, deckD = w * 0.12, lip = w * 0.028;
    const H0 = lidH + deckD + lip;
    const top = cy - H0 / 2;
    hingeY = top + lidH;
    const sw = Math.max(1.5, w / 160);
    L = { w, lidW, lidH, deckD, lip, top, x0: cx - w / 2, y0: top, h: H0, sw };
    // deck (keyboard base in perspective)
    root.deck = S.g(null, root);
    const backW = lidW * 1.0, frontW = w;
    const deckD_ = `M${H.f2(cx - backW / 2)},${H.f2(hingeY)} L${H.f2(cx + backW / 2)},${H.f2(hingeY)} L${H.f2(cx + frontW / 2)},${H.f2(hingeY + deckD)} L${H.f2(cx - frontW / 2)},${H.f2(hingeY + deckD)} Z`;
    S.path({ d: deckD_, fill: 'url(#hw-steel)', stroke: '#ffffff', strokeOpacity: 0.22, sw }, root.deck);
    // keyboard: rows of key segments in perspective
    const kd = H.ignore(S.g(null, root.deck));
    const rowsK = 3;
    let keys = '';
    for (let k = 0; k < rowsK; k++) {
      const t0 = 0.16 + k * 0.2, t1 = t0 + 0.13;
      const wA = H.lerp(backW, frontW, t0) * 0.8, wB = H.lerp(backW, frontW, t1) * 0.8;
      const yA = hingeY + deckD * t0, yB = hingeY + deckD * t1;
      const nk = 13;
      for (let j = 0; j < nk; j++) {
        if (o.chip && j >= 5 && j <= 7) continue;
        const a0 = -0.5 + j / nk + 0.006, a1 = -0.5 + (j + 1) / nk - 0.006;
        keys += `M${H.f2(cx + wA * a0)},${H.f2(yA)}L${H.f2(cx + wA * a1)},${H.f2(yA)}L${H.f2(cx + wB * a1)},${H.f2(yB)}L${H.f2(cx + wB * a0)},${H.f2(yB)}Z`;
      }
    }
    S.path({ d: keys, fill: '#0b1222', fillOpacity: 0.95 }, kd);
    // touchpad
    const tA = 0.78, tB = 0.95, tw0 = H.lerp(backW, frontW, tA) * 0.22, tw1 = H.lerp(backW, frontW, tB) * 0.22;
    S.path({ d: `M${H.f2(cx - tw0 / 2)},${H.f2(hingeY + deckD * tA)}L${H.f2(cx + tw0 / 2)},${H.f2(hingeY + deckD * tA)}L${H.f2(cx + tw1 / 2)},${H.f2(hingeY + deckD * tB)}L${H.f2(cx - tw1 / 2)},${H.f2(hingeY + deckD * tB)}Z`, fill: '#0f182c', stroke: '#ffffff', strokeOpacity: 0.12, sw: 1 }, kd);
    // front lip
    S.path({ d: `M${H.f2(cx - frontW / 2)},${H.f2(hingeY + deckD)} H${H.f2(cx + frontW / 2)} V${H.f2(hingeY + deckD + lip * 0.4)} Q${H.f2(cx + frontW / 2)},${H.f2(hingeY + deckD + lip)} ${H.f2(cx + frontW / 2 - lip)},${H.f2(hingeY + deckD + lip)} H${H.f2(cx - frontW / 2 + lip)} Q${H.f2(cx - frontW / 2)},${H.f2(hingeY + deckD + lip)} ${H.f2(cx - frontW / 2)},${H.f2(hingeY + deckD + lip * 0.4)} Z`, fill: '#121a2e', stroke: '#ffffff', strokeOpacity: 0.18, sw }, root.deck);
    H.ignore(S.path({ d: `M${H.f2(cx - w * 0.07)},${H.f2(hingeY + deckD + 0.5)} Q${H.f2(cx)},${H.f2(hingeY + deckD + lip * 0.75)} ${H.f2(cx + w * 0.07)},${H.f2(hingeY + deckD + 0.5)}`, stroke: '#ffffff', strokeOpacity: 0.16, sw: 1 }, root.deck));
    if (o.chip) {
      const cs = Math.max(18, deckD * 0.6);
      const chipHolder = S.g(null, root.deck);
      root.chip = libChip(S, { x: cx, y: hingeY + deckD * 0.42, size: cs, label: null, seed: 21 }, chipHolder);
      H.xf(chipHolder, cx, hingeY + deckD * 0.42, 1, 0.72);    // a little perspective: it lies on the deck
    }
    // lid: front (screen) and back (shell, shown once the lid passes vertical while closing)
    lidBack = S.g({ opacity: 0 }, root);
    const shellD = `M${H.f2(cx - backW / 2)},${H.f2(hingeY)} L${H.f2(cx + backW / 2)},${H.f2(hingeY)} L${H.f2(cx + frontW / 2 * 0.985)},${H.f2(hingeY - lidH)} L${H.f2(cx - frontW / 2 * 0.985)},${H.f2(hingeY - lidH)} Z`;
    S.path({ d: shellD, fill: 'url(#hw-shell)', stroke: '#ffffff', strokeOpacity: 0.25, sw }, lidBack);
    H.ignore(S.circle({ x: cx, y: hingeY - lidH * 0.5, r: lidW * 0.05, fill: '#ffffff', fillOpacity: 0.12 }, lidBack));
    lidFront = S.g(null, root);
    const lr = w * 0.03;
    S.path({ d: `M${H.f2(cx - lidW / 2)},${H.f2(hingeY)} V${H.f2(top + lr)} Q${H.f2(cx - lidW / 2)},${H.f2(top)} ${H.f2(cx - lidW / 2 + lr)},${H.f2(top)} H${H.f2(cx + lidW / 2 - lr)} Q${H.f2(cx + lidW / 2)},${H.f2(top)} ${H.f2(cx + lidW / 2)},${H.f2(top + lr)} V${H.f2(hingeY)} Z`, fill: '#0d1426', stroke: '#ffffff', strokeOpacity: 0.26, sw, filter: 'url(#shadow)' }, lidFront);
    const bz = w * 0.03;
    glass = { x: cx - lidW / 2 + bz, y: top + bz, w: lidW - 2 * bz, h: lidH - bz * 1.6, r: w * 0.012 };
    H.ignore(S.circle({ x: cx, y: top + bz * 0.5, r: Math.max(1.2, w * 0.005), fill: '#2f3b5c' }, lidFront));
    H.ignore(S.line({ x1: cx - lidW / 2 + 2, y1: hingeY - 1, x2: cx + lidW / 2 - 2, y2: hingeY - 1, stroke: '#ffffff', strokeOpacity: 0.12, sw: 1.5 }, lidFront));
  }

  // ---- screen (shared): glass, light, clipped content, ping overlay
  S.rect({ x: glass.x, y: glass.y, w: glass.w, h: glass.h, r: glass.r, fill: 'url(#hw-glass)' }, lidFront);
  const lightEl = S.rect({ x: glass.x, y: glass.y, w: glass.w, h: glass.h, r: glass.r, fill: 'url(#hw-glass-on)', opacity: screenOn ? 1 : 0 }, lidFront);
  const cid = H.nextId('hw-screen');
  const cp = document.createElementNS(H.NS, 'clipPath');
  cp.setAttribute('id', cid);
  lidFront.appendChild(cp);
  const cr = document.createElementNS(H.NS, 'rect');
  Object.entries({ x: glass.x, y: glass.y, width: glass.w, height: glass.h, rx: glass.r }).forEach(([k, v]) => cr.setAttribute(k, v));
  cp.appendChild(cr);
  const contentG = S.g({ 'clip-path': `url(#${cid})`, opacity: screenOn ? 1 : 0 }, lidFront);
  root.screen = S.g(null, contentG);
  if ((o.screen === 'off' ? 'chat' : (o.screen || 'chat')) === 'chat') {
    const cg = H.ignore(S.g(null, root.screen));
    const u = glass.w / 100;
    const gx = glass.x, gy = glass.y + (kind === 'phone' ? glass.h * 0.12 : glass.h * 0.08);
    const bh = kind === 'phone' ? glass.w * 0.17 : glass.h * 0.17;
    // the user's bubble (right, blue) and the answer (left, grey lines)
    S.rect({ x: gx + glass.w * 0.42, y: gy + bh * 0.3, w: glass.w * 0.5, h: bh, r: bh * 0.42, fill: 'struct', fillOpacity: 0.85 }, cg);
    S.rect({ x: gx + glass.w * 0.49, y: gy + bh * 0.3 + bh * 0.42, w: glass.w * 0.3, h: Math.max(2, bh * 0.16), r: 2, fill: '#0a0f1e', fillOpacity: 0.55 }, cg);
    const ay = gy + bh * 1.8;
    S.circle({ x: gx + 9 * u, y: ay + bh * 0.25, r: Math.max(2, bh * 0.22), fill: 'helps', fillOpacity: 0.85 }, cg);
    const lines = kind === 'phone' ? [0.62, 0.7, 0.5, 0.66, 0.4] : [0.66, 0.72, 0.58, 0.44];
    lines.forEach((f, i) => S.rect({ x: gx + 16 * u, y: ay + i * bh * 0.55, w: glass.w * f, h: Math.max(2, bh * 0.2), r: 2, fill: '#ffffff', fillOpacity: 0.32 }, cg));
  }
  H.ignore(S.rect({ x: glass.x, y: glass.y, w: glass.w, h: glass.h, r: glass.r, fill: 'url(#hw-sheen)', opacity: 0.7 }, lidFront));   // a glass reflection
  const pingEl = H.ignore(S.rect({ x: glass.x, y: glass.y, w: glass.w, h: glass.h, r: glass.r, fill: 'struct', opacity: 0 }, lidFront));
  if (kind === 'phone') {
    H.ignore(S.rect({ x: cx - L.w * 0.15, y: glass.y + L.w * 0.04, w: L.w * 0.3, h: L.w * 0.075, r: L.w * 0.0375, fill: '#05080f' }, lidFront));
    H.ignore(S.rect({ x: cx - L.w * 0.17, y: glass.y + glass.h - L.w * 0.06, w: L.w * 0.34, h: Math.max(2, L.w * 0.022), r: 2, fill: '#ffffff', fillOpacity: 0.45 }, lidFront));
  }
  root.glass = glass;
  root.lid = lidFront;

  // ---- badge, label
  const bb = kind === 'phone' ? { l: L.x0, r: L.x0 + L.w, t: L.y0, b: L.y0 + L.h } : { l: cx - L.w / 2, r: cx + L.w / 2, t: L.top, b: L.top + L.h };
  if (o.badge) root.badgeEl = o.badge.text ? H.badge(S, root, bb.r - 40, bb.t - 30, o.badge) : H.badge(S, root, bb.r - (kind === 'phone' ? 6 : L.w * 0.08), bb.t + 6, o.badge, (bb.r - bb.l) / 300);
  const lab = H.label(S, root, { ...bb, cx, cy }, { ...o, labelSize: o.labelSize ?? 30, labelGap: o.labelGap ?? 16 });
  root.labelEl = lab.el; root.subEl = lab.sub; root.labelG = lab.g;

  // ---- helpers
  // the screen's light = planned power (sleep / wake) × how open the lid is (close / open)
  let on = screenOn ? 1 : 0;
  const live = { scr: on, lid: 0 };
  const scrCh = H.channel(), lidCh = H.channel(), pingCh = H.channel();
  const paintScreen = () => { const v = live.scr * (1 - H.clamp(live.lid * 2, 0, 1)); lightEl.setAttribute('opacity', v.toFixed(3)); contentG.setAttribute('opacity', v.toFixed(3)); };
  root.sleep = (so = {}) => { const from = on; on = 0; return scrCh(from, 0, v => { live.scr = v; paintScreen(); }, { d: so.d ?? 0.4 }); };
  root.wake = (so = {}) => { const from = on; on = 1; return scrCh(from, 1, v => { live.scr = v; paintScreen(); }, { d: so.d ?? 0.4 }); };
  root.ping = (po = {}) => {
    const tn = S.tone(po.tone || 'struct');
    return pingCh(0, 1, p => { pingEl.setAttribute('fill', tn); pingEl.setAttribute('opacity', (0.32 * Math.sin(Math.PI * p)).toFixed(3)); }, { d: po.d ?? 0.6, ease: 'none' });
  };
  let lidPlan = 0;   // 0 open, 1 closed
  const applyLid = v => {
    if (kind !== 'laptop') return;
    const k = L.deckD / L.lidH;
    const sF = Math.cos(Math.min(1, v * 1.25) * Math.PI / 2);         // front face: 1 → 0 over the first 80%
    const sB = v <= 0.8 ? 0 : -k * Math.sin((v - 0.8) / 0.2 * Math.PI / 2);   // back shell: 0 → −k (onto the deck)
    H.xf(lidFront, cx, hingeY, 1, Math.max(0.001, sF));
    lidFront.setAttribute('opacity', sF < 0.02 ? 0 : 1);
    H.xf(lidBack, cx, hingeY, 1, Math.min(-0.001, sB));
    lidBack.setAttribute('opacity', v > 0.8 ? 1 : 0);
    live.lid = v; paintScreen();
  };
  root.close = (co = {}) => {
    if (kind !== 'laptop') return root.sleep(co);
    const from = lidPlan; lidPlan = 1;
    return lidCh(from, 1, applyLid, { d: co.d ?? 0.7, ease: 'power2.in' });
  };
  root.open = (oo = {}) => {
    if (kind !== 'laptop') return root.wake(oo);
    const from = lidPlan; lidPlan = 0;
    return lidCh(from, 0, applyLid, { d: oo.d ?? 0.7, ease: 'power2.out' });
  };

  const bw = bb.r - bb.l, bh2 = bb.b - bb.t;
  root.port = (side, gap = 0) => {
    if (side === 'screen') return { x: glass.x + glass.w / 2, y: glass.y + glass.h / 2 };
    if (kind === 'laptop' && (side === 'left' || side === 'right')) {
      const yy = hingeY + L.deckD * 0.5;
      return { x: side === 'left' ? cx - L.w / 2 - gap : cx + L.w / 2 + gap, y: yy };
    }
    if (side === 'left') return { x: bb.l - gap, y: cy };
    if (side === 'right') return { x: bb.r + gap, y: cy };
    if (side === 'top') return { x: cx, y: bb.t - gap };
    return { x: cx, y: bb.b + gap };
  };
  Object.assign(root, { kind, cx, cy, w: bw, h: bh2, l: bb.l, r: bb.r, t: bb.t, b: bb.b });
  return root;
}
