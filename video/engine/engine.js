/* Motion-graphic engine: deterministic GSAP scenes on a 1920x1080 SVG stage.
 *
 * A scene is a pure function of time. The renderer calls V.load(id, timing) once, then V.seek(t)
 * for every frame and screenshots the page. Nothing may depend on wall-clock time or Math.random:
 * use S.rand(seed) and drive every change through the scene timeline S.tl.
 *
 * Read video/v01/ANIMATION_GUIDE.md for how to write scenes with this API.
 */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const W = 1920, H = 1080, SAFE = 64;

  gsap.registerPlugin(DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin, CustomEase);
  gsap.config({ force3D: false, nullTargetWarn: false });
  gsap.ticker.lagSmoothing(0);
  gsap.ticker.sleep(); // the renderer drives time, never the ticker

  // ---------------------------------------------------------------- palette
  const TONE = {
    compute: '#ffb84d', bytes: '#ff6b6b', helps: '#2fd9a7', struct: '#6ea8ff', violet: '#b48cff',
    ink: '#eef2fb', muted: '#a7b1cc', faint: '#6b7898', line: '#2a3452', bg: '#060a14', panel: '#111a30',
    white: '#ffffff', neutral: '#a7b1cc',
  };
  const TONES = ['compute', 'bytes', 'helps', 'struct', 'violet', 'neutral'];
  const color = c => (c == null ? TONE.ink : (TONE[c] || c));
  const FAMILY = { sans: 'Inter', display: 'Inter Display', mono: 'JetBrains Mono' };

  function hexA(hex, a) {
    const h = color(hex).replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // ---------------------------------------------------------------- dom helpers
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v === undefined || v === null || v === false) continue;
      if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else e.setAttribute(k, v);
    }
    if (parent) parent.appendChild(e);
    return e;
  }

  // ---------------------------------------------------------------- text measurement
  const mctx = document.createElement('canvas').getContext('2d');
  function measure(str, o = {}) {
    const size = o.size || 32, weight = o.weight || 500, fam = FAMILY[o.family || 'sans'] || o.family;
    mctx.font = `${weight} ${size}px "${fam}"`;
    const m = mctx.measureText(String(str));
    return m.width + (o.ls || 0) * size * Math.max(0, String(str).length - 1);
  }

  // ---------------------------------------------------------------- formatting
  const fmt = {
    int: v => Math.round(v).toLocaleString('en-US'),
    fixed: d => v => Number(v).toFixed(d),
    comma: d => v => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }),
    pct: d => v => Number(v).toFixed(d) + '%',
    raw: v => String(v),
    /** 10¹⁵ style; v may be the value (1e15) or, with exp: true, the exponent */
    pow10: v => '10' + String(Math.round(Math.log10(v))).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹⁻'['0123456789-'.indexOf(c)]).join(''),
    sup: s => String(s).split('').map(c => { const i = '0123456789-'.indexOf(c); return i < 0 ? c : '⁰¹²³⁴⁵⁶⁷⁸⁹⁻'[i]; }).join(''),
  };

  // ---------------------------------------------------------------- deterministic random
  function rand(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e9) / 1e9; };
  }

  // ---------------------------------------------------------------- global defs
  let defsBuilt = false;
  function buildDefs(svg) {
    if (defsBuilt) return;
    defsBuilt = true;
    const d = el('defs', null, svg);
    for (const t of TONES) {
      const c = t === 'neutral' ? '#a7b1cc' : TONE[t];
      const g = el('linearGradient', { id: `card-${t}`, x1: 0, y1: 0, x2: 0, y2: 1 }, d);
      el('stop', { offset: 0, 'stop-color': c, 'stop-opacity': t === 'neutral' ? 0.10 : 0.20 }, g);
      el('stop', { offset: 1, 'stop-color': c, 'stop-opacity': t === 'neutral' ? 0.04 : 0.07 }, g);
      const gs = el('linearGradient', { id: `solid-${t}`, x1: 0, y1: 0, x2: 0, y2: 1 }, d);
      el('stop', { offset: 0, 'stop-color': c, 'stop-opacity': 1 }, gs);
      el('stop', { offset: 1, 'stop-color': c, 'stop-opacity': 0.72 }, gs);
      const bar = el('linearGradient', { id: `bar-${t}`, x1: 0, y1: 0, x2: 1, y2: 0 }, d);
      el('stop', { offset: 0, 'stop-color': c, 'stop-opacity': 0.75 }, bar);
      el('stop', { offset: 1, 'stop-color': c, 'stop-opacity': 1 }, bar);
      const pg = el('radialGradient', { id: `pglow-${t}` }, d);
      el('stop', { offset: 0, 'stop-color': c, 'stop-opacity': 0.55 }, pg);
      el('stop', { offset: 0.4, 'stop-color': c, 'stop-opacity': 0.18 }, pg);
      el('stop', { offset: 1, 'stop-color': c, 'stop-opacity': 0 }, pg);
      const f = el('filter', { id: `glow-${t}`, x: '-50%', y: '-50%', width: '200%', height: '200%' }, d);
      el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 10, result: 'b' }, f);
      el('feFlood', { 'flood-color': c, 'flood-opacity': 0.55, result: 'c' }, f);
      el('feComposite', { in: 'c', in2: 'b', operator: 'in', result: 'g' }, f);
      const m = el('feMerge', null, f);
      el('feMergeNode', { in: 'g' }, m);
      el('feMergeNode', { in: 'SourceGraphic' }, m);
    }
    const sh = el('filter', { id: 'shadow', x: '-20%', y: '-20%', width: '140%', height: '160%' }, d);
    el('feDropShadow', { dx: 0, dy: 10, stdDeviation: 14, 'flood-color': '#000', 'flood-opacity': 0.45 }, sh);
    const soft = el('filter', { id: 'soft', x: '-50%', y: '-50%', width: '200%', height: '200%' }, d);
    el('feGaussianBlur', { stdDeviation: 18 }, soft);
    const dots = el('pattern', { id: 'dots', width: 32, height: 32, patternUnits: 'userSpaceOnUse' }, d);
    el('circle', { cx: 16, cy: 16, r: 1.1, fill: '#ffffff', 'fill-opacity': 0.055 }, dots);
    const die = el('pattern', { id: 'die-grid', width: 22, height: 22, patternUnits: 'userSpaceOnUse' }, d);
    el('rect', { x: 2, y: 2, width: 18, height: 18, rx: 3, fill: TONE.compute, 'fill-opacity': 0.16 }, die);
    for (const [id, c, a] of [['amb-blue', '#3358b8', 0.20], ['amb-violet', '#6a44b8', 0.12]]) {
      const rg = el('radialGradient', { id }, d);
      el('stop', { offset: 0, 'stop-color': c, 'stop-opacity': a }, rg);
      el('stop', { offset: 0.55, 'stop-color': c, 'stop-opacity': a * 0.35 }, rg);
      el('stop', { offset: 1, 'stop-color': c, 'stop-opacity': 0 }, rg);
    }
    const vg = el('radialGradient', { id: 'vignette', cx: '50%', cy: '45%', r: '75%' }, d);
    el('stop', { offset: '60%', 'stop-color': '#000', 'stop-opacity': 0 }, vg);
    el('stop', { offset: '100%', 'stop-color': '#000', 'stop-opacity': 0.55 }, vg);
  }

  // ---------------------------------------------------------------- icons
  function iconDef(id) { return (window.ICONS || {})[id]; }

  // ---------------------------------------------------------------- scenes
  const scenes = {};
  let cur = null;

  function scene(id, def) {
    if (typeof def === 'function') def = { build: def };
    scenes[id] = def;
  }

  function timeSpec(S, spec) {
    if (spec === undefined || spec === null) return 0;
    if (typeof spec === 'number') return spec;
    let s = String(spec).trim();
    let off = 0;
    const m = s.match(/^(.*?)([+-]\s*\d*\.?\d+)$/);
    if (m && !/^-?\d*\.?\d+$/.test(s)) { s = m[1].trim(); off = parseFloat(m[2].replace(/\s/g, '')); }
    if (/^-?\d*\.?\d+$/.test(s)) return parseFloat(s) + off;
    if (s === 'start') return 0 + off;
    if (s === 'end') return S.duration + off;
    let mm;
    if ((mm = s.match(/^(b\d+)>$/))) { const b = S.beat(mm[1]); return b.end + off; }
    if ((mm = s.match(/^(b\d+)@(\d*\.?\d+)$/))) { const b = S.beat(mm[1]); return b.start + b.dur * parseFloat(mm[2]) + off; }
    if ((mm = s.match(/^(b\d+)~(.+)$/))) { return S.word(mm[1], mm[2]) + off; }
    if ((mm = s.match(/^(b\d+)$/))) { const b = S.beat(mm[1]); return b.start + off; }
    throw new Error(`bad time spec ${spec}`);
  }

  function makeContext(id, timing, opts) {
    const film = document.getElementById('film');
    buildDefs(film);
    const root = el('g', { id: 'scene-root' }, film);
    const camera = el('g', { id: 'camera' }, root);
    const layers = {};
    for (const n of ['back', 'main', 'front']) layers[n] = el('g', { id: `layer-${n}` }, camera);
    const hud = el('g', { id: 'hud' }, root);

    const beats = {};
    (timing.beats || []).forEach(b => { beats[b.id] = b; });
    const warnings = [];
    const tl = gsap.timeline({ paused: true });

    const S = {
      id, timing, tl, root, camera, hud, layers, warnings,
      W, H, SAFE, cx: W / 2, cy: H / 2,
      duration: timing.duration,
      main: layers.main,
      tone: color, hexA, fmt, rand, measure, TONE,
      beat(bid) {
        const b = beats[bid];
        if (!b) throw new Error(`scene ${id}: no beat ${bid} (have ${Object.keys(beats).join(',')})`);
        return b;
      },
      beats: timing.beats || [],
      t(spec) { return timeSpec(S, spec); },
      /** estimated time a word is spoken inside a beat (phoneme-weighted estimate, about ±0.2 s) */
      word(bid, w) {
        const b = S.beat(bid);
        const want = w.toLowerCase().replace(/[^a-z0-9.,']/g, '');
        const words = b.words || [];
        for (const x of words) {
          const k = x.w.toLowerCase().replace(/[^a-z0-9.,']/g, '');
          if (k === want || k.startsWith(want)) return x.start;
        }
        warnings.push(`word '${w}' not found in ${bid}; using beat start`);
        return b.start;
      },
      add(anim, at) { tl.add(anim, timeSpec(S, at)); return anim; },
      set(target, vars, at) { tl.set(target, vars, timeSpec(S, at === undefined ? 0 : at)); },
      call(fn, at) { tl.call(fn, null, timeSpec(S, at)); },
      el(tag, attrs, parent) { return el(tag, attrs, parent || S.main); },
      g(attrs, parent) { return el('g', attrs, parent || S.main); },
      warn(msg) { warnings.push(msg); },
    };
    installPrimitives(S);
    installComponents(S);
    installFx(S);
    return S;
  }

  // ================================================================ primitives
  function installPrimitives(S) {
    S.rect = (o, p) => el('rect', {
      x: o.x, y: o.y, width: o.w, height: o.h, rx: o.r ?? 0, ry: o.r ?? 0,
      fill: o.fill === undefined ? 'none' : (String(o.fill).startsWith('url') ? o.fill : color(o.fill)),
      'fill-opacity': o.fillOpacity, stroke: o.stroke ? color(o.stroke) : undefined, 'stroke-width': o.sw,
      'stroke-opacity': o.strokeOpacity, 'stroke-dasharray': o.dash, opacity: o.opacity, filter: o.filter,
      class: o.cls,
    }, p || S.main);
    S.circle = (o, p) => el('circle', {
      cx: o.x, cy: o.y, r: o.r, fill: o.fill === undefined ? 'none' : (String(o.fill).startsWith('url') ? o.fill : color(o.fill)),
      'fill-opacity': o.fillOpacity, stroke: o.stroke ? color(o.stroke) : undefined, 'stroke-width': o.sw,
      'stroke-opacity': o.strokeOpacity, 'stroke-dasharray': o.dash, opacity: o.opacity, filter: o.filter,
    }, p || S.main);
    S.line = (o, p) => el('line', {
      x1: o.x1, y1: o.y1, x2: o.x2, y2: o.y2, stroke: color(o.stroke || 'line'), 'stroke-width': o.sw || 2,
      'stroke-linecap': o.cap || 'round', 'stroke-dasharray': o.dash, opacity: o.opacity, 'stroke-opacity': o.strokeOpacity,
    }, p || S.main);
    S.path = (o, p) => el('path', {
      d: o.d, fill: o.fill === undefined ? 'none' : (String(o.fill).startsWith('url') ? o.fill : color(o.fill)),
      'fill-opacity': o.fillOpacity, stroke: o.stroke ? color(o.stroke) : undefined, 'stroke-width': o.sw,
      'stroke-linecap': o.cap || 'round', 'stroke-linejoin': o.join || 'round', 'stroke-dasharray': o.dash,
      opacity: o.opacity, 'stroke-opacity': o.strokeOpacity, filter: o.filter,
    }, p || S.main);

    /**
     * Text. str may be a string or an array of segments {t, c, w, f, s, o}.
     * o: {x, y, size, weight, color, anchor: start|middle|end, family: sans|display|mono,
     *     ls (em), opacity, maxW (shrinks to fit and warns), baseline: middle|alphabetic|hanging}
     */
    S.text = (str, o = {}, p) => {
      const size0 = o.size || 32;
      let size = size0;
      const fam = o.family || 'sans';
      const plain = Array.isArray(str) ? str.map(s => s.t).join('') : String(str);
      if (o.maxW) {
        const w = measure(plain, { size, weight: o.weight || 500, family: fam, ls: o.ls });
        if (w > o.maxW) {
          size = Math.floor(size * o.maxW / w);
          if (size < size0 * 0.85) S.warn(`text "${plain.slice(0, 40)}" shrunk ${size0}→${size}px to fit ${o.maxW}px`);
        }
      }
      const t = el('text', {
        x: o.x || 0, y: o.y || 0, 'font-size': size, 'font-weight': o.weight || 500,
        fill: color(o.color || 'ink'), 'text-anchor': o.anchor || 'start',
        'dominant-baseline': o.baseline || 'middle', opacity: o.opacity,
        'letter-spacing': o.ls ? `${o.ls}em` : undefined,
        'font-family': FAMILY[fam] ? `'${FAMILY[fam]}'` : fam,
        class: fam === 'mono' ? 'mono' : (o.tnum ? 'tnum' : undefined),
        style: o.italic ? { fontStyle: 'italic' } : undefined,
      }, p || S.main);
      if (Array.isArray(str)) {
        for (const s of str) {
          el('tspan', {
            text: s.t, fill: s.c ? color(s.c) : undefined, 'font-weight': s.w, 'font-size': s.s,
            'font-family': s.f ? `'${FAMILY[s.f] || s.f}'` : undefined, opacity: s.o,
          }, t);
        }
      } else {
        t.textContent = plain;
      }
      t.__size = size; t.__family = fam; t.__weight = o.weight || 500; t.__plain = plain;
      return t;
    };

    /** Wrapped paragraph. o: {x, y, w, size, lh (line-height multiplier), anchor, color, weight}. Returns <g> with .lines and .height */
    S.para = (str, o = {}, p) => {
      const size = o.size || 32, lh = (o.lh || 1.3) * size, maxW = o.w || 800;
      const words = String(str).split(/\s+/);
      const lines = [];
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (measure(test, { size, weight: o.weight || 400, family: o.family }) > maxW && line) { lines.push(line); line = w; }
        else line = test;
      }
      if (line) lines.push(line);
      const g = el('g', null, p || S.main);
      lines.forEach((ln, i) => S.text(ln, { ...o, y: (o.y || 0) + i * lh, maxW: undefined }, g));
      g.lines = [...g.children];
      g.height = lines.length * lh;
      return g;
    };

    /** An icon from the generated bundle, centred on (x, y). o: {size, color, opacity} */
    S.icon = (id, o = {}, p) => {
      const size = o.size || 64;
      const g = el('g', { opacity: o.opacity }, p || S.main);
      const d = iconDef(id);
      if (!d) {
        S.warn(`icon ${id} missing; run tools/build_icons.py`);
        S.rect({ x: (o.x || 0) - size / 2, y: (o.y || 0) - size / 2, w: size, h: size, r: 8, stroke: 'bytes', dash: '6 4', sw: 2 }, g);
        return g;
      }
      const [vx, vy, vw, vh] = d.vb;
      const s = el('svg', {
        x: (o.x || 0) - size / 2, y: (o.y || 0) - size * vh / vw / 2, width: size, height: size * vh / vw,
        viewBox: `${vx} ${vy} ${vw} ${vh}`, overflow: 'visible',
      }, g);
      s.innerHTML = d.body;
      if (d.mono) s.style.color = color(o.color || 'ink');
      g.__icon = id;
      return g;
    };
  }

  // ================================================================ components
  function installComponents(S) {
    /**
     * A card: rounded panel with optional icon, title and subtitle.
     * o: {x, y, w, h, tone, title, sub, icon, iconSize, layout: left|top|center, r, size, subSize, solid}
     * Returns <g> with .bg .titleEl .subEl .iconEl and anchors .cx .cy .l .r .t .b
     */
    S.card = (o, p) => {
      const tone = o.tone || 'neutral';
      const g = el('g', null, p || S.main);
      const r = o.r ?? 20;
      // opaque base so lines and particles passing behind a card are hidden by it
      if (!o.solid && o.opaque !== false) S.rect({ x: o.x, y: o.y, w: o.w, h: o.h, r, fill: '#0c1326', filter: o.shadow === false ? undefined : 'url(#shadow)' }, g);
      const bg = S.rect({
        x: o.x, y: o.y, w: o.w, h: o.h, r,
        fill: o.solid ? `url(#solid-${tone})` : `url(#card-${tone})`,
        stroke: tone === 'neutral' ? '#ffffff' : tone, strokeOpacity: tone === 'neutral' ? 0.14 : 0.55, sw: o.sw ?? 2,
        filter: o.solid && o.shadow !== false ? 'url(#shadow)' : undefined,
      }, g);
      g.bg = bg;
      const layout = o.layout || (o.icon ? 'left' : 'center');
      const size = o.size || 34, subSize = o.subSize || Math.round(size * 0.72);
      const iconSize = o.iconSize || Math.min(o.h - 36, 72);
      const tcol = o.solid ? '#0a0f1e' : (o.titleColor || 'ink');
      const scol = o.solid ? '#16203a' : (o.subColor || 'muted');
      const hasSub = !!o.sub;
      if (layout === 'left') {
        const ix = o.x + 28 + iconSize / 2;
        if (o.icon) g.iconEl = S.icon(o.icon, { x: ix, y: o.y + o.h / 2, size: iconSize, color: o.iconColor || (tone === 'neutral' ? 'ink' : tone) }, g);
        const tx = o.icon ? ix + iconSize / 2 + 22 : o.x + 28;
        const maxW = o.x + o.w - 24 - tx;
        g.titleEl = S.text(o.title || '', { x: tx, y: o.y + o.h / 2 - (hasSub ? subSize * 0.62 : 0), size, weight: 650, color: tcol, maxW }, g);
        if (hasSub) g.subEl = S.text(o.sub, { x: tx, y: o.y + o.h / 2 + size * 0.58, size: subSize, weight: 450, color: scol, maxW }, g);
      } else if (layout === 'top') {
        const contentH = (o.icon ? iconSize + 18 : 0) + size + (hasSub ? subSize * 1.3 : 0);
        const top = o.y + (o.h - contentH) / 2;
        const iy = top + iconSize / 2;
        if (o.icon) g.iconEl = S.icon(o.icon, { x: o.x + o.w / 2, y: iy, size: iconSize, color: o.iconColor || (tone === 'neutral' ? 'ink' : tone) }, g);
        const ty = (o.icon ? iy + iconSize / 2 + 18 : top) + size / 2;
        g.titleEl = S.text(o.title || '', { x: o.x + o.w / 2, y: ty, size, weight: 650, color: tcol, anchor: 'middle', maxW: o.w - 40 }, g);
        if (hasSub) g.subEl = S.text(o.sub, { x: o.x + o.w / 2, y: ty + size * 0.62 + subSize * 0.62, size: subSize, weight: 450, color: scol, anchor: 'middle', maxW: o.w - 40 }, g);
      } else {
        const cy = o.y + o.h / 2;
        g.titleEl = S.text(o.title || '', { x: o.x + o.w / 2, y: cy - (hasSub ? subSize * 0.62 : 0), size, weight: 650, color: tcol, anchor: 'middle', maxW: o.w - 40 }, g);
        if (hasSub) g.subEl = S.text(o.sub, { x: o.x + o.w / 2, y: cy + size * 0.58, size: subSize, weight: 450, color: scol, anchor: 'middle', maxW: o.w - 40 }, g);
      }
      Object.assign(g, { cx: o.x + o.w / 2, cy: o.y + o.h / 2, l: o.x, r: o.x + o.w, t: o.y, b: o.y + o.h, w: o.w, h: o.h, x: o.x, y: o.y });
      return g;
    };

    /** A rounded pill with centred text. o: {x, y (centre), h, tone, size, mono, padX, style: soft|solid|outline|ghost, w (fixed), anchor: start|middle} */
    S.pill = (text, o = {}, p) => {
      const h = o.h || 56, size = o.size || 28, padX = o.padX ?? 22, tone = o.tone || 'struct';
      const fam = o.mono ? 'mono' : 'sans';
      const tw = measure(text, { size, weight: o.weight || 600, family: fam });
      const w = o.w || tw + padX * 2;
      const x = (o.anchor || 'middle') === 'middle' ? o.x - w / 2 : o.x;
      const y = o.y - h / 2;
      const g = el('g', null, p || S.main);
      const style = o.style || 'soft';
      const c = color(tone);
      if (style === 'soft' && o.opaque !== false) S.rect({ x, y, w, h, r: o.r ?? Math.min(h / 2, 16), fill: '#0c1326' }, g);
      g.bg = S.rect({
        x, y, w, h, r: o.r ?? Math.min(h / 2, 16),
        fill: style === 'solid' ? `url(#solid-${tone})` : style === 'soft' ? `url(#card-${tone})` : style === 'ghost' ? 'none' : TONE.bg,
        stroke: c, strokeOpacity: style === 'solid' ? 0 : style === 'ghost' ? 0.35 : 0.7, sw: 2, dash: style === 'ghost' ? '6 6' : undefined,
      }, g);
      g.label = S.text(text, {
        x: x + w / 2, y: o.y + 1, size, weight: o.weight || 600, anchor: 'middle', family: fam,
        color: style === 'solid' ? '#0a0f1e' : (o.color || (style === 'ghost' ? 'muted' : 'ink')),
      }, g);
      Object.assign(g, { w, h, x, y, cx: x + w / 2, cy: o.y, l: x, r: x + w, t: y, b: y + h, text });
      return g;
    };

    /** A row of pills, laid out left to right (or centred). o: {x, y, gap, align: middle|start, ...pill} Returns array (with .w) */
    S.pills = (items, o = {}, p) => {
      const gap = o.gap ?? 14, size = o.size || 28, padX = o.padX ?? 22, fam = o.mono ? 'mono' : 'sans';
      const widths = items.map(t => o.w || measure(t, { size, weight: o.weight || 600, family: fam }) + padX * 2);
      const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
      let x = (o.align || 'middle') === 'middle' ? o.x - total / 2 : o.x;
      const g = el('g', null, p || S.main);
      const out = items.map((t, i) => {
        const pl = S.pill(t, { ...o, x, anchor: 'start', w: widths[i] }, g);
        x += widths[i] + gap;
        return pl;
      });
      out.g = g; out.w = total;
      return out;
    };

    /**
     * A grid of cells. o: {x, y, rows, cols, cw, ch, gap, tone, values (2-D or flat), fmt, size, r, style}
     * Returns {g, cells (flat), at(r,c)}
     */
    S.grid = (o, p) => {
      const g = el('g', null, p || S.main);
      const cw = o.cw || 48, ch = o.ch || 48, gap = o.gap ?? 6;
      const cells = [];
      for (let r = 0; r < o.rows; r++) for (let c = 0; c < o.cols; c++) {
        const x = o.x + c * (cw + gap), y = o.y + r * (ch + gap);
        const cg = el('g', null, g);
        const tone = typeof o.tone === 'function' ? o.tone(r, c) : (o.tone || 'struct');
        S.rect({ x, y, w: cw, h: ch, r: o.r ?? 6, fill: '#0c1326' }, cg);
        cg.bg = S.rect({ x, y, w: cw, h: ch, r: o.r ?? 6, fill: `url(#card-${tone})`, stroke: tone, strokeOpacity: 0.45, sw: 1.5 }, cg);
        let v = o.values ? (Array.isArray(o.values[0]) ? o.values[r][c] : o.values[r * o.cols + c]) : undefined;
        if (v !== undefined && v !== null && v !== '') {
          cg.label = S.text(o.fmt ? o.fmt(v) : String(v), { x: x + cw / 2, y: y + ch / 2 + 1, size: o.size || Math.min(22, ch * 0.42), anchor: 'middle', family: o.mono === false ? 'sans' : 'mono', weight: 500, color: o.textColor || 'ink' }, cg);
        }
        Object.assign(cg, { r, c, x, y, w: cw, h: ch, cx: x + cw / 2, cy: y + ch / 2 });
        cells.push(cg);
      }
      return { g, cells, at: (r, c) => cells[r * o.cols + c], w: o.cols * (cw + gap) - gap, h: o.rows * (ch + gap) - gap };
    };

    /**
     * An arrow. o: {x1, y1, x2, y2, bend (px, perpendicular), color, sw, head, dash, startGap, endGap}
     * Returns <g> with .line (path) and .head; animate with S.fx.drawArrow(a)
     */
    S.arrow = (o, p) => {
      const g = el('g', null, p || S.main);
      let { x1, y1, x2, y2 } = o;
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      x1 += ux * (o.startGap || 0); y1 += uy * (o.startGap || 0);
      x2 -= ux * (o.endGap || 0); y2 -= uy * (o.endGap || 0);
      const bend = o.bend || 0;
      const mx = (x1 + x2) / 2 - uy * bend, my = (y1 + y2) / 2 + ux * bend;
      const d = bend ? `M${x1},${y1} Q${mx},${my} ${x2},${y2}` : `M${x1},${y1} L${x2},${y2}`;
      const c = color(o.color || 'muted');
      g.line = S.path({ d, stroke: c, sw: o.sw || 3, dash: o.dash }, g);
      // head direction = tangent at the end
      const tx = bend ? x2 - mx : x2 - x1, ty = bend ? y2 - my : y2 - y1;
      const tl = Math.hypot(tx, ty) || 1, hx = tx / tl, hy = ty / tl, hs = o.head ?? 16;
      if (hs) {
        const hd = `M${x2 - hx * hs - hy * hs * 0.6},${y2 - hy * hs + hx * hs * 0.6} L${x2},${y2} L${x2 - hx * hs + hy * hs * 0.6},${y2 - hy * hs - hx * hs * 0.6}`;
        g.head = S.path({ d: hd, stroke: c, sw: o.sw || 3 }, g);
      }
      g.d = d;
      return g;
    };

    /**
     * Particles flowing along a path between two times. Deterministic in time.
     * o: {d | path, from, to (time specs), speed (px/s), every (s between particles), size, color, shape: dot|chip, glow}
     */
    S.flow = (o, p) => {
      const g = el('g', null, p || S.main);
      const path = o.path || S.path({ d: o.d, stroke: 'none' }, g);
      const L = path.getTotalLength();
      const speed = o.speed || 600, every = o.every || 0.12, life = L / speed;
      const pool = Math.ceil(life / every) + 2;
      const c = color(o.color || 'bytes');
      const parts = [];
      const sz = o.size || 6;
      const glowTone = o.tone || (TONES.includes(o.color) ? o.color : 'bytes');
      for (let i = 0; i < pool; i++) {
        const e = el('g', { opacity: 0 }, g);
        if (o.glow !== false) el('circle', { cx: 0, cy: 0, r: sz * 3.2, fill: `url(#pglow-${glowTone})` }, e);
        if (o.shape === 'chip') S.rect({ x: -sz, y: -sz * 0.6, w: sz * 2, h: sz * 1.2, r: 3, fill: c }, e);
        else el('circle', { cx: 0, cy: 0, r: sz, fill: c }, e);
        parts.push(e);
      }
      const t0 = S.t(o.from ?? 0), t1 = S.t(o.to ?? S.duration);
      const fade = Math.min(0.15, life / 4);
      const proxy = { t: 0 };
      const update = () => {
        const tt = proxy.t; // seconds since t0
        parts.forEach(e => e.setAttribute('opacity', 0));
        const kmin = Math.max(0, Math.ceil((tt - life) / every)), kmax = Math.floor(Math.min(tt, t1 - t0) / every);
        for (let k = kmin; k <= kmax; k++) {
          const age = tt - k * every;
          if (age < 0 || age > life) continue;
          const pt = path.getPointAtLength(Math.min(L, age * speed));
          const e = parts[k % pool];
          const a = Math.min(1, age / fade, (life - age) / fade);
          e.setAttribute('transform', `translate(${pt.x.toFixed(2)},${pt.y.toFixed(2)})`);
          e.setAttribute('opacity', Math.max(0, a) * (o.opacity ?? 1));
        }
      };
      S.tl.fromTo(proxy, { t: 0 }, { t: t1 - t0 + life, duration: t1 - t0 + life, ease: 'none', onUpdate: update, immediateRender: false }, t0);
      g.path = path;
      return g;
    };

    /**
     * A bar drawn to scale. o: {x, y, w (full length), h, frac (0..1), tone, track (bool), r, vertical}
     * Returns <g> with .fill (animate with S.fx.grow) and .track; .len = filled length
     */
    S.bar = (o, p) => {
      const g = el('g', null, p || S.main);
      const tone = o.tone || 'struct', r = o.r ?? Math.min(8, o.h / 2);
      const frac = Math.max(0, Math.min(1, o.frac ?? 1));
      if (o.track !== false) g.track = S.rect({ x: o.x, y: o.y, w: o.vertical ? o.h : o.w, h: o.vertical ? o.w : o.h, r, fill: '#ffffff', fillOpacity: 0.05, stroke: '#ffffff', strokeOpacity: 0.08, sw: 1 }, g);
      if (o.vertical) {
        const L = o.w * frac;
        g.fill = S.rect({ x: o.x, y: o.y + o.w - L, w: o.h, h: Math.max(L, 0.001), r: Math.min(r, L / 2), fill: `url(#solid-${tone})` }, g);
        g.len = L; g.vertical = true;
      } else {
        const L = Math.max(o.w * frac, 0.001);
        g.fill = S.rect({ x: o.x, y: o.y, w: L, h: o.h, r: Math.min(r, L / 2), fill: `url(#bar-${tone})` }, g);
        g.len = L;
      }
      Object.assign(g, { x: o.x, y: o.y, w: o.w, h: o.h, tone });
      return g;
    };

    /** A number that can count. o: {x, y, size, color, family (mono default), anchor, value, fmt, prefix, suffix, weight} */
    S.counter = (o, p) => {
      const t = S.text('', { ...o, family: o.family || 'mono', weight: o.weight || 600 }, p);
      t.__fmt = o.fmt || fmt.int; t.__prefix = o.prefix || ''; t.__suffix = o.suffix || '';
      t.textContent = t.__prefix + t.__fmt(o.value ?? 0) + t.__suffix;
      return t;
    };

    /**
     * An XY chart. o: {x, y, w, h, xmin, xmax, ymin, ymax, xlog, ylog, xticks, yticks, xfmt, yfmt, xlabel, ylabel, grid}
     * Returns <g> with X(v), Y(v), and .plot(points, style) -> path
     */
    S.chart = (o, p) => {
      const g = el('g', null, p || S.main);
      const lx = v => (o.xlog ? Math.log10(v) : v), ly = v => (o.ylog ? Math.log10(v) : v);
      const X = v => o.x + (lx(v) - lx(o.xmin)) / (lx(o.xmax) - lx(o.xmin)) * o.w;
      const Y = v => o.y + o.h - (ly(v) - ly(o.ymin)) / (ly(o.ymax) - ly(o.ymin)) * o.h;
      g.axes = el('g', null, g);
      if (o.grid !== false) {
        (o.xticks || []).forEach(v => S.line({ x1: X(v), y1: o.y, x2: X(v), y2: o.y + o.h, stroke: '#ffffff', strokeOpacity: 0.06, sw: 1.5 }, g.axes));
        (o.yticks || []).forEach(v => S.line({ x1: o.x, y1: Y(v), x2: o.x + o.w, y2: Y(v), stroke: '#ffffff', strokeOpacity: 0.06, sw: 1.5 }, g.axes));
      }
      S.line({ x1: o.x, y1: o.y + o.h, x2: o.x + o.w, y2: o.y + o.h, stroke: 'faint', sw: 2.5 }, g.axes);
      S.line({ x1: o.x, y1: o.y, x2: o.x, y2: o.y + o.h, stroke: 'faint', sw: 2.5 }, g.axes);
      (o.xticks || []).forEach(v => S.text(o.xfmt ? o.xfmt(v) : fmt.int(v), { x: X(v), y: o.y + o.h + 30, size: 22, anchor: 'middle', color: 'muted', family: 'mono' }, g.axes));
      (o.yticks || []).forEach(v => S.text(o.yfmt ? o.yfmt(v) : fmt.int(v), { x: o.x - 16, y: Y(v), size: 22, anchor: 'end', color: 'muted', family: 'mono' }, g.axes));
      if (o.xlabel) g.xlabel = S.text(o.xlabel, { x: o.x + o.w / 2, y: o.y + o.h + 72, size: 26, anchor: 'middle', color: 'muted' }, g.axes);
      if (o.ylabel) {
        g.ylabel = S.text(o.ylabel, { x: 0, y: 0, size: 26, anchor: 'middle', color: 'muted' }, g.axes);
        g.ylabel.setAttribute('transform', `translate(${o.x - (o.ylabelGap || 92)},${o.y + o.h / 2}) rotate(-90)`);
      }
      g.X = X; g.Y = Y;
      g.plot = (pts, st = {}) => S.path({ d: pts.map((q, i) => `${i ? 'L' : 'M'}${X(q[0])},${Y(q[1])}`).join(' '), stroke: st.color || 'struct', sw: st.sw || 4, dash: st.dash }, st.parent || g);
      Object.assign(g, { x: o.x, y: o.y, w: o.w, h: o.h });
      return g;
    };

    /**
     * An equation laid out term by term on one line, centred on x (or starting at x when anchor: start).
     * parts: strings or {t, tone, w, family, size, id}. Returns <g> with .parts (each a <text> with .cx, .l, .r)
     */
    S.equation = (parts, o = {}, p) => {
      const g = el('g', null, p || S.main);
      const size = o.size || 48, gap = o.gap ?? size * 0.38;
      const norm = parts.map(q => (typeof q === 'string' ? { t: q } : q));
      const widths = norm.map(q => measure(q.t, { size: q.size || size, weight: q.w || 600, family: q.family || o.family || 'sans' }));
      const total = widths.reduce((a, b) => a + b, 0) + gap * (norm.length - 1);
      let x = (o.anchor || 'middle') === 'middle' ? o.x - total / 2 : o.x;
      g.parts = norm.map((q, i) => {
        const t = S.text(q.t, { x, y: o.y, size: q.size || size, weight: q.w || 600, family: q.family || o.family || 'sans', color: q.tone || q.color || (o.color || 'ink') }, g);
        Object.assign(t, { l: x, r: x + widths[i], cx: x + widths[i] / 2, w: widths[i], id: q.id });
        x += widths[i] + gap;
        return t;
      });
      g.w = total; g.l = g.parts[0].l; g.r = g.parts[g.parts.length - 1].r;
      return g;
    };

    /** A label with a thin leader line from (fx, fy) to the text. o: {x, y, from:[fx,fy], tone, size, anchor} */
    S.callout = (text, o = {}, p) => {
      const g = el('g', null, p || S.main);
      if (o.from) g.leader = S.line({ x1: o.from[0], y1: o.from[1], x2: o.x, y2: o.y, stroke: o.tone || 'muted', sw: 2, strokeOpacity: 0.7 }, g);
      // a centred label sits just beyond the leader's end, on the side away from where the leader starts
      const sz = o.size || 26, mid = o.anchor === 'middle';
      const ly = mid && o.from ? o.y + (o.y <= o.from[1] ? -1 : 1) * sz * 0.75 : o.y;
      g.label = S.text(text, { x: o.x + (o.anchor === 'end' ? -10 : mid ? 0 : 10), y: ly, size: sz, color: o.tone || 'muted', anchor: o.anchor || 'start', weight: 550 }, g);
      return g;
    };

    /** A bracket spanning (x1,y)→(x2,y) with a label below (or above with up: true). */
    S.bracket = (o, p) => {
      const g = el('g', null, p || S.main);
      const dir = o.up ? -1 : 1, d = 14 * dir;
      g.line = S.path({ d: `M${o.x1},${o.y} l0,${d} L${o.x2},${o.y + d} l0,${-d}`, stroke: o.tone || 'muted', sw: 2.5 }, g);
      if (o.label) g.label = S.text(o.label, { x: (o.x1 + o.x2) / 2, y: o.y + d + 30 * dir, size: o.size || 26, anchor: 'middle', color: o.tone || 'muted', weight: 550 }, g);
      return g;
    };

    /**
     * Illustrated GPU package: a compute die in the middle, HBM stacks either side, wide buses between.
     * o: {x, y (centre), scale, stacks (per side, default 3), labels (bool)}
     * Returns <g> with .die, .stacks[], .buses[] (paths from each stack to the die, for S.flow), .dieCenter
     */
    S.gpu = (o = {}, p) => {
      const s = o.scale || 1, n = o.stacks || 3;
      const g = el('g', null, p || S.main);
      const cx = o.x ?? W / 2, cy = o.y ?? H / 2;
      const pw = 760 * s, ph = 420 * s;
      g.substrate = S.rect({ x: cx - pw / 2, y: cy - ph / 2, w: pw, h: ph, r: 26 * s, fill: '#0f1830', stroke: '#ffffff', strokeOpacity: 0.12, sw: 2, filter: 'url(#shadow)' }, g);
      const dw = 300 * s, dh = 300 * s;
      g.die = el('g', null, g);
      S.rect({ x: cx - dw / 2, y: cy - dh / 2, w: dw, h: dh, r: 14 * s, fill: '#1a1408', stroke: 'compute', strokeOpacity: 0.8, sw: 2.5 }, g.die);
      S.rect({ x: cx - dw / 2 + 12 * s, y: cy - dh / 2 + 12 * s, w: dw - 24 * s, h: dh - 24 * s, r: 8 * s, fill: 'url(#die-grid)' }, g.die);
      g.dieRect = { x: cx - dw / 2, y: cy - dh / 2, w: dw, h: dh };
      g.stacks = []; g.buses = [];
      const sw = 120 * s, sh = 92 * s, gapY = 14 * s;
      const totalH = n * sh + (n - 1) * gapY;
      for (const side of [-1, 1]) {
        for (let i = 0; i < n; i++) {
          const sx = side < 0 ? cx - pw / 2 + 36 * s : cx + pw / 2 - 36 * s - sw;
          const sy = cy - totalH / 2 + i * (sh + gapY);
          const st = el('g', null, g);
          S.rect({ x: sx, y: sy, w: sw, h: sh, r: 10 * s, fill: '#2a1218', stroke: 'bytes', strokeOpacity: 0.85, sw: 2 }, st);
          for (let k = 1; k < 5; k++) S.line({ x1: sx + 10 * s, y1: sy + k * sh / 5, x2: sx + sw - 10 * s, y2: sy + k * sh / 5, stroke: 'bytes', strokeOpacity: 0.4, sw: 1.5 }, st);
          Object.assign(st, { x: sx, y: sy, w: sw, h: sh, cx: sx + sw / 2, cy: sy + sh / 2 });
          g.stacks.push(st);
          const bx1 = side < 0 ? sx + sw : sx, bx2 = side < 0 ? cx - dw / 2 : cx + dw / 2;
          const by = sy + sh / 2, dy = cy - dh / 2 + dh * (i + 0.5) / n;
          const d = `M${bx1},${by} C${(bx1 + bx2) / 2},${by} ${(bx1 + bx2) / 2},${dy} ${bx2},${dy}`;
          const bus = S.path({ d, stroke: 'bytes', sw: 6 * s, strokeOpacity: 0.28 }, g);
          bus.__d = d;
          g.buses.push(bus);
        }
      }
      if (o.labels !== false) {
        g.dieLabel = S.text('compute die', { x: cx, y: cy + dh / 2 + 34 * s, size: Math.max(22, 26 * s), anchor: 'middle', color: 'compute', weight: 600 }, g);
        g.hbmLabel = S.text('HBM', { x: cx - pw / 2 + 36 * s + sw / 2, y: cy + totalH / 2 + 34 * s, size: Math.max(22, 26 * s), anchor: 'middle', color: 'bytes', weight: 600 }, g);
        g.hbmLabel2 = S.text('HBM', { x: cx + pw / 2 - 36 * s - sw / 2, y: cy + totalH / 2 + 34 * s, size: Math.max(22, 26 * s), anchor: 'middle', color: 'bytes', weight: 600 }, g);
      }
      Object.assign(g, { cx, cy, w: pw, h: ph, l: cx - pw / 2, r: cx + pw / 2, t: cy - ph / 2, b: cy + ph / 2 });
      return g;
    };

    /** Time lanes. o: {x, y, w, laneH, gap, lanes: [{label, tone}], t0, t1, labelW}. Returns <g> with X(t), laneY(i), seg(i, ta, tb, opts) */
    S.lanes = (o, p) => {
      const g = el('g', null, p || S.main);
      const lw = o.labelW ?? 220, laneH = o.laneH || 64, gap = o.gap ?? 22;
      const x0 = o.x + lw, w = o.w - lw;
      const X = t => x0 + (t - o.t0) / (o.t1 - o.t0) * w;
      const laneY = i => o.y + i * (laneH + gap);
      o.lanes.forEach((ln, i) => {
        S.text(ln.label, { x: o.x, y: laneY(i) + laneH / 2, size: o.size || 26, color: ln.tone || 'muted', weight: 600 }, g);
        S.rect({ x: x0, y: laneY(i), w, h: laneH, r: 10, fill: '#ffffff', fillOpacity: 0.03, stroke: '#ffffff', strokeOpacity: 0.06, sw: 1 }, g);
      });
      g.X = X; g.laneY = laneY; g.laneH = laneH;
      g.seg = (i, ta, tb, st = {}) => {
        const tone = st.tone || o.lanes[i].tone || 'struct';
        const sg = el('g', null, st.parent || g);
        sg.bg = S.rect({ x: X(ta), y: laneY(i) + 6, w: Math.max(2, X(tb) - X(ta)), h: laneH - 12, r: 8, fill: st.idle ? 'none' : `url(#solid-${tone})`, stroke: tone, sw: 2, dash: st.idle ? '7 6' : undefined, strokeOpacity: st.idle ? 0.6 : 0 }, sg);
        if (st.label) sg.label = S.text(st.label, { x: (X(ta) + X(tb)) / 2, y: laneY(i) + laneH / 2 + 1, size: st.size || 22, anchor: 'middle', color: st.idle ? tone : '#0a0f1e', weight: 650 }, sg);
        return sg;
      };
      return g;
    };

    /**
     * A cycle of stations around a circle, with a dot that can run round it (S.fx.orbit).
     * o: {x, y, r, stations: [{label, icon, tone, sub}], tone, size, cardW, cardH, start (deg, default -90 = top)}
     * Returns <g> with .ring (circle), .stations[] (cards), .arrows[], .dot, .angleOf(i)
     */
    S.cycle = (o, p) => {
      const g = el('g', null, p || S.main);
      const n = o.stations.length, r = o.r || 260, start = (o.start ?? -90) * Math.PI / 180;
      const tone = o.tone || 'struct';
      g.ring = S.circle({ x: o.x, y: o.y, r, stroke: tone, sw: 3, strokeOpacity: 0.35, fill: 'none' }, g);
      g.angleOf = i => start + i * 2 * Math.PI / n;
      g.arrows = [];
      for (let i = 0; i < n; i++) {
        // arrowheads on the ring between stations, pointing clockwise
        const a = g.angleOf(i) + Math.PI / n;
        const ax = o.x + r * Math.cos(a), ay = o.y + r * Math.sin(a);
        const tx = -Math.sin(a), ty = Math.cos(a), hs = 14;
        g.arrows.push(S.path({ d: `M${ax - tx * hs - ty * hs * 0.6},${ay - ty * hs + tx * hs * 0.6} L${ax},${ay} L${ax - tx * hs + ty * hs * 0.6},${ay - ty * hs - tx * hs * 0.6}`, stroke: tone, sw: 3, strokeOpacity: 0.8 }, g));
      }
      const cw = o.cardW || 300, chh = o.cardH || 96;
      g.dot = S.circle({ x: o.x + r * Math.cos(start), y: o.y + r * Math.sin(start), r: 11, fill: o.dotTone || 'compute', opacity: 0 }, g);
      g.stations = o.stations.map((st, i) => {
        const a = g.angleOf(i);
        const cx = o.x + r * Math.cos(a), cy = o.y + r * Math.sin(a);
        const c = S.card({ x: cx - cw / 2, y: cy - chh / 2, w: cw, h: chh, tone: st.tone || tone, title: st.label, sub: st.sub, icon: st.icon, size: o.size || 28, iconSize: Math.min(56, chh - 30) }, g);
        return c;
      });
      Object.assign(g, { cx: o.x, cy: o.y, r });
      return g;
    };

    /**
     * Horizontal bars to scale, one per row, with a label on the left and the value text on the right.
     * o: {x, y, w (bar area), rowH, gap, labelW, items: [{label, value, text, tone}], max, min, log, size}
     * Returns <g> with .rows[] each {g, label, bar, value, y}
     */
    S.barChart = (o, p) => {
      const g = el('g', null, p || S.main);
      const rowH = o.rowH || 56, gap = o.gap ?? 26, lw = o.labelW ?? 320, size = o.size || 28;
      const vals = o.items.map(it => it.value);
      const max = o.max ?? Math.max(...vals), min = o.min ?? (o.log ? Math.min(...vals) / 10 : 0);
      const frac = v => o.log ? (Math.log10(v) - Math.log10(min)) / (Math.log10(max) - Math.log10(min)) : (v - min) / (max - min);
      g.rows = o.items.map((it, i) => {
        const y = o.y + i * (rowH + gap);
        const rg = el('g', null, g);
        const label = S.text(it.label, { x: o.x + lw - 24, y: y + rowH / 2, size, anchor: 'end', color: it.labelColor || 'ink', weight: 550, maxW: lw - 30 }, rg);
        const f = Math.max(0.002, Math.min(1, frac(it.value)));
        const bar = S.bar({ x: o.x + lw, y, w: o.w, h: rowH, frac: f, tone: it.tone || 'struct', track: o.track !== false }, rg);
        const vx = o.valueInside ? o.x + lw + 16 : o.x + lw + (o.track === false ? o.w * f : o.w) + 22;
        const value = S.text(it.text ?? String(it.value), { x: vx, y: y + rowH / 2 + 1, size, family: 'mono', color: it.valueColor || 'ink', weight: 600 }, rg);
        return { g: rg, label, bar, value, y, h: rowH };
      });
      return g;
    };

    /**
     * A simple table. o: {x, y, cols: [{w, align, mono, color}], rows: [[cells]], rowH, size, header: [..], zebra}
     * Returns <g> with .rowEls[] (each a <g> with .cells[])
     */
    S.table = (o, p) => {
      const g = el('g', null, p || S.main);
      const rowH = o.rowH || 64, size = o.size || 28;
      const totalW = o.cols.reduce((a, c) => a + c.w, 0);
      const all = o.header ? [o.header, ...o.rows] : o.rows;
      g.rowEls = all.map((row, ri) => {
        const y = o.y + ri * rowH;
        const rg = el('g', null, g);
        const isHead = o.header && ri === 0;
        if (!isHead && o.zebra !== false && ri % 2 === (o.header ? 1 : 0)) S.rect({ x: o.x, y, w: totalW, h: rowH, r: 10, fill: '#ffffff', fillOpacity: 0.035 }, rg);
        let x = o.x;
        rg.cells = row.map((cell, ci) => {
          const c = o.cols[ci];
          const ax = c.align === 'right' ? x + c.w - 20 : c.align === 'center' ? x + c.w / 2 : x + 20;
          const t = S.text(String(cell), { x: ax, y: y + rowH / 2 + 1, size: isHead ? size * 0.78 : size, anchor: c.align === 'right' ? 'end' : c.align === 'center' ? 'middle' : 'start',
            family: c.mono && !isHead ? 'mono' : 'sans', color: isHead ? 'faint' : (c.color || 'ink'), weight: isHead ? 650 : 520, ls: isHead ? 0.08 : undefined, maxW: c.w - 30 }, rg);
          x += c.w;
          return t;
        });
        if (isHead) S.line({ x1: o.x, y1: y + rowH - 4, x2: o.x + totalW, y2: y + rowH - 4, stroke: '#ffffff', strokeOpacity: 0.12, sw: 1.5 }, rg);
        rg.y = y;
        return rg;
      });
      g.w = totalW; g.h = all.length * rowH;
      return g;
    };

    /**
     * The scene's takeaway line, in a band near the bottom of the frame. Same look in every scene.
     * o: {y (centre, default 952), tone (accent bar colour), size}. Returns <g> with .label .bg
     */
    S.takeaway = (text, o = {}, p) => {
      const g = el('g', null, p || S.hud);
      const size = o.size || 34, y = o.y ?? 952;
      const w = Math.min(1700, measure(text, { size, weight: 600 }) + 120);
      g.bg = S.rect({ x: W / 2 - w / 2, y: y - 38, w, h: 76, r: 38, fill: '#0c1326', fillOpacity: 0.92, stroke: '#ffffff', strokeOpacity: 0.10, sw: 1.5 }, g);
      g.bar = S.rect({ x: W / 2 - w / 2 + 26, y: y - 12, w: 6, h: 24, r: 3, fill: o.tone || 'compute' }, g);
      g.label = S.text(text, { x: W / 2 + 10, y: y + 1, size, weight: 600, anchor: 'middle', color: 'ink', maxW: w - 100 }, g);
      return g;
    };

    /**
     * A headline number: big value (optionally counting), unit, and a label under it.
     * o: {x, y, value, fmt, unit, label, tone, size, anchor}. Returns <g> with .num (counter) .unitEl .labelEl
     */
    S.stat = (o, p) => {
      const g = el('g', null, p || S.main);
      const size = o.size || 84, anchor = o.anchor || 'middle';
      g.num = S.counter({ x: o.x, y: o.y, size, value: o.value ?? 0, fmt: o.fmt || fmt.int, color: o.tone || 'ink', anchor, family: o.family || 'display', weight: 750, suffix: o.unit ? '' : '' }, g);
      if (o.unit) {
        const nw = measure(g.num.textContent, { size, weight: 750, family: o.family || 'display' });
        const ux = anchor === 'middle' ? o.x + nw / 2 + 12 : anchor === 'end' ? o.x + 12 : o.x + nw + 12;
        g.unitEl = S.text(o.unit, { x: ux, y: o.y + size * 0.12, size: size * 0.42, weight: 600, color: o.tone || 'ink', opacity: 0.85 }, g);
      }
      if (o.label) g.labelEl = S.text(o.label, { x: o.x, y: o.y + size * 0.78, size: o.labelSize || Math.max(26, size * 0.34), anchor, color: 'muted', weight: 500 }, g);
      return g;
    };

    /** A soft halo highlight behind a region. o: {x, y, w, h, tone, r} */
    S.halo = (o, p) => S.rect({ x: o.x - (o.pad ?? 14), y: o.y - (o.pad ?? 14), w: o.w + 2 * (o.pad ?? 14), h: o.h + 2 * (o.pad ?? 14), r: o.r ?? 22, fill: o.tone || 'compute', fillOpacity: 0.12, stroke: o.tone || 'compute', strokeOpacity: 0.7, sw: 2.5 }, p || S.layers.back);

    /** Big title + subtitle block, centred. Returns <g> with .titleEl .subEl */
    S.heading = (title, o = {}, p) => {
      const g = el('g', null, p || S.main);
      g.titleEl = S.text(title, { x: o.x ?? W / 2, y: o.y ?? 150, size: o.size || 56, weight: 700, anchor: o.anchor || 'middle', family: 'display', maxW: o.maxW || 1600, color: o.color }, g);
      if (o.sub) g.subEl = S.text(o.sub, { x: o.x ?? W / 2, y: (o.y ?? 150) + (o.size || 56) * 0.95, size: o.subSize || 30, weight: 450, anchor: o.anchor || 'middle', color: 'muted', maxW: o.maxW || 1600 }, g);
      return g;
    };
  }

  // ================================================================ fx
  // ---------------------------------------------------------------- predictable transforms
  // GSAP's own svgOrigin/transformOrigin compensation can surprise when an element is scaled and moved
  // several times. xform keeps an explicit plan per element: translate (x, y) then scale s about the
  // origin (ox, oy), written straight to the transform attribute.
  function applyXf(e, st) {
    e.setAttribute('transform', `translate(${(+st.x).toFixed(3)},${(+st.y).toFixed(3)}) translate(${st.ox},${st.oy}) scale(${(+st.s).toFixed(5)}) translate(${-st.ox},${-st.oy})`);
  }

  function installFx(S) {
    /** Set an element's planned transform now (build time). st: {x, y, s, ox, oy} */
    S.xset = (el, st) => {
      el.__xf = { x: 0, y: 0, s: 1, ox: 0, oy: 0, ...(el.__xf || {}), ...st };
      applyXf(el, el.__xf);
      return el;
    };
    const resolveDir = (from, dist) => ({
      up: { y: dist }, down: { y: -dist }, left: { x: dist }, right: { x: -dist },
    }[from] || {});
    const list = x => (Array.isArray(x) ? x : [x]).filter(Boolean);

    S.fx = {
      /** Fade/slide in. o: {from: up|down|left|right|fade|scale, d, dist, stagger, ease, scale} */
      in(els, o = {}) {
        const from = o.from || 'up', dist = o.dist ?? 36;
        const start = { autoAlpha: 0, ...resolveDir(from, dist) };
        const end = { autoAlpha: 1, x: 0, y: 0, duration: o.d ?? 0.7, ease: o.ease || 'power3.out', stagger: o.stagger ?? 0.07 };
        if (from === 'scale' || o.scale) { start.scale = o.scale ?? 0.85; end.scale = 1; start.transformOrigin = end.transformOrigin = o.origin || '50% 50%'; }
        return gsap.fromTo(list(els), start, end);
      },
      /** Fade/slide out. o: {to: up|down|left|right|fade, d, dist, stagger} */
      out(els, o = {}) {
        const v = { autoAlpha: 0, duration: o.d ?? 0.45, ease: o.ease || 'power2.in', stagger: o.stagger ?? 0.03 };
        const dist = o.dist ?? 30;
        if (o.to === 'up') v.y = -dist; else if (o.to === 'down') v.y = dist; else if (o.to === 'left') v.x = -dist; else if (o.to === 'right') v.x = dist;
        return gsap.to(list(els), v);
      },
      /** Pop in with overshoot. */
      pop(els, o = {}) {
        return gsap.fromTo(list(els), { autoAlpha: 0, scale: o.from ?? 0.4, transformOrigin: '50% 50%' },
          { autoAlpha: 1, scale: 1, duration: o.d ?? 0.55, ease: o.ease || 'back.out(2.2)', stagger: o.stagger ?? 0.05, transformOrigin: '50% 50%' });
      },
      /** Draw a stroke on (path, line, rect, circle). */
      draw(els, o = {}) {
        return gsap.fromTo(list(els), { drawSVG: o.from || '0%', autoAlpha: 1 }, { drawSVG: o.to || '100%', duration: o.d ?? 0.9, ease: o.ease || 'power2.inOut', stagger: o.stagger ?? 0.08 });
      },
      /** Draw an arrow made with S.arrow: line draws, then the head pops. */
      drawArrow(a, o = {}) {
        const d = o.d ?? 0.7;
        const t = gsap.timeline();
        t.fromTo(a.line, { drawSVG: '0%', autoAlpha: 1 }, { drawSVG: '100%', duration: d, ease: o.ease || 'power2.inOut' }, 0);
        if (a.head) t.fromTo(a.head, { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(3)' }, d * 0.85);
        return t;
      },
      /** Count a counter from → to. o: {d, ease, fmt} */
      count(t, from, to, o = {}) {
        const f = o.fmt || t.__fmt || fmt.int, pre = t.__prefix || '', suf = t.__suffix || '';
        const proxy = { v: from };
        return gsap.fromTo(proxy, { v: from }, {
          v: to, duration: o.d ?? 1.2, ease: o.ease || 'power2.out', immediateRender: false,
          onUpdate: () => { t.textContent = pre + f(proxy.v) + suf; },
          onStart: () => { t.textContent = pre + f(from) + suf; },
        });
      },
      /** Grow a bar made with S.bar from zero. */
      grow(bar, o = {}) {
        const target = bar.fill || bar;
        return gsap.fromTo(target, { scaleX: bar.vertical ? 1 : 0, scaleY: bar.vertical ? 0 : 1, autoAlpha: 1, transformOrigin: bar.vertical ? '50% 100%' : '0% 50%' },
          { scaleX: 1, scaleY: 1, duration: o.d ?? 1.0, ease: o.ease || 'power3.out' });
      },
      /** Typewriter on a text element; the element's text is its final content. */
      type(t, o = {}) {
        const full = t.__plain || t.textContent;
        const proxy = { n: 0 };
        return gsap.fromTo(proxy, { n: 0 }, {
          n: full.length, duration: o.d ?? Math.max(0.4, full.length * 0.035), ease: 'none', immediateRender: true,
          onUpdate: () => { t.textContent = full.slice(0, Math.round(proxy.n)); },
        });
      },
      /** Brief scale pulse. */
      pulse(els, o = {}) {
        return gsap.fromTo(list(els), { scale: 1, transformOrigin: '50% 50%' }, { scale: o.scale ?? 1.08, duration: (o.d ?? 0.5) / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' });
      },
      /** Dim to a low opacity (and back with undim). */
      dim(els, o = {}) { return gsap.to(list(els), { opacity: o.to ?? 0.22, duration: o.d ?? 0.5, ease: 'power2.out' }); },
      undim(els, o = {}) { return gsap.to(list(els), { opacity: 1, duration: o.d ?? 0.5, ease: 'power2.out' }); },
      /** Move to an offset (x/y are transforms relative to where the element was drawn). */
      move(els, o = {}) { return gsap.to(list(els), { x: o.x, y: o.y, scale: o.scale, duration: o.d ?? 0.8, ease: o.ease || 'power3.inOut', stagger: o.stagger ?? 0, transformOrigin: o.origin || '50% 50%' }); },
      /** Change fill and/or stroke colour. */
      recolor(els, o = {}) {
        const v = { duration: o.d ?? 0.5, ease: 'power1.inOut' };
        if (o.fill) v.fill = color(o.fill);
        if (o.stroke) v.stroke = color(o.stroke);
        return gsap.to(list(els), v);
      },
      /** Swap a text element's content with a crossfade-like flip. */
      swap(t, text, o = {}) {
        const d = o.d ?? 0.4;
        const tl = gsap.timeline();
        tl.to(t, { autoAlpha: 0, y: -12, duration: d / 2, ease: 'power2.in' });
        tl.call(() => { t.textContent = text; }, null, d / 2);
        tl.set(t, { y: 12 }, d / 2);
        tl.to(t, { autoAlpha: 1, y: 0, duration: d / 2, ease: 'power2.out' }, d / 2);
        // make the swap reversible when seeking backwards
        const before = t.textContent;
        tl.eventCallback('onReverseComplete', () => { t.textContent = before; });
        return tl;
      },
      /** Strike through a text element. */
      strike(t, o = {}) {
        const b = t.getBBox();
        const ln = S.line({ x1: b.x - 6, y1: b.y + b.height / 2, x2: b.x + b.width + 6, y2: b.y + b.height / 2, stroke: o.tone || 'bytes', sw: o.sw || 4 }, t.parentNode);
        ln.__strike = true;
        return gsap.fromTo(ln, { drawSVG: '0%', autoAlpha: 1 }, { drawSVG: '100%', duration: o.d ?? 0.4, ease: 'power2.out' });
      },
      /**
       * Move and/or scale an element predictably. to: {x, y, s, ox, oy} — translation in parent units,
       * scale s about origin (ox, oy) in the element's own coordinates. Each call continues from the
       * state the previous call (or S.xset) left, so schedule an element's xforms in time order.
       * Do not mix with fx.in/fx.move/pop on the same element: wrap it in a group and xform the group.
       */
      xform(el, to, o = {}) {
        const from = { x: 0, y: 0, s: 1, ox: 0, oy: 0, ...(el.__xf || {}), ...(o.from || {}) };
        const end = { ...from, ...to };
        if (to.scale !== undefined) end.s = to.scale;
        delete end.scale;
        el.__xf = end;
        const p = { ...from };
        applyXf(el, el.__xf0 || (el.__xf0 = from));
        return gsap.fromTo(p, { ...from }, {
          ...end, duration: o.d ?? 0.8, ease: o.ease || 'power3.inOut', immediateRender: false,
          onUpdate: () => applyXf(el, p), onStart: () => applyXf(el, p),
          onReverseComplete: () => applyXf(el, from),
        });
      },
      /** Run the dot of an S.cycle round the ring: from station i to station j (j may exceed n for extra laps). */
      orbit(cyc, o = {}) {
        const n = cyc.stations.length, from = o.from ?? 0, to = o.to ?? n;
        const proxy = { k: from };
        const place = () => {
          const a = cyc.angleOf(0) + proxy.k * 2 * Math.PI / n;
          cyc.dot.setAttribute('cx', cyc.cx + cyc.r * Math.cos(a));
          cyc.dot.setAttribute('cy', cyc.cy + cyc.r * Math.sin(a));
        };
        const t = gsap.timeline();
        t.set(cyc.dot, { autoAlpha: 1 }, 0);
        t.fromTo(proxy, { k: from }, { k: to, duration: o.d ?? 2, ease: o.ease || 'power1.inOut', onUpdate: place, immediateRender: false }, 0);
        return t;
      },
      /** Camera move: centre the view on (x, y) at a zoom. */
      cam(o = {}) {
        const sc = o.scale ?? 1, x = o.x ?? W / 2, y = o.y ?? H / 2;
        return gsap.to(S.camera, { x: W / 2 - x * sc, y: H / 2 - y * sc, scale: sc, transformOrigin: '0 0', duration: o.d ?? 1.4, ease: o.ease || 'power2.inOut' });
      },
    };
  }

  // ================================================================ ambient background
  // Lives outside the scene root so it never fades with a scene; driven by global film time so it is
  // continuous across cuts.
  let ambient = null;
  function buildAmbient(film) {
    const g = el('g', { id: 'ambient' }, film);
    el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#dots)' }, g);
    const a = el('circle', { cx: 600, cy: 380, r: 700, fill: 'url(#amb-blue)' }, g);
    const b = el('circle', { cx: 1400, cy: 720, r: 620, fill: 'url(#amb-violet)' }, g);
    el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#vignette)' }, g);
    ambient = { g, a, b };
  }
  function moveAmbient(T) {
    if (!ambient) return;
    ambient.a.setAttribute('cx', 760 + 380 * Math.sin(T * 0.021));
    ambient.a.setAttribute('cy', 420 + 120 * Math.sin(T * 0.017 + 1.3));
    ambient.b.setAttribute('cx', 1180 + 420 * Math.cos(T * 0.016 + 0.4));
    ambient.b.setAttribute('cy', 660 + 140 * Math.cos(T * 0.023));
  }

  // ================================================================ chrome (chapter kicker, title cards)
  function drawChrome(S, timing) {
    const ch = timing.chapter;
    if (!ch || !ch.kicker || timing.kind === 'title') return;
    const g = el('g', { id: 'kicker' }, document.getElementById('film'));
    const t = S.text(ch.kicker.toUpperCase(), { x: 72, y: 62, size: 20, weight: 650, color: 'faint', ls: 0.14 }, g);
    const w = measure(ch.kicker.toUpperCase(), { size: 20, weight: 650, ls: 0.14 });
    S.line({ x1: 72, y1: 84, x2: 72 + Math.min(w, 120), y2: 84, stroke: 'faint', sw: 2, strokeOpacity: 0.6 }, g);
    if (ch.enter) S.tl.fromTo(g, { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'power3.out' }, 0.2);
    if (ch.exit) S.tl.to(g, { autoAlpha: 0, duration: 0.5 }, Math.max(0, S.duration - 0.55));
    t.__chrome = true;
  }

  function buildTitleCard(S, timing) {
    const ch = timing.chapter || {};
    const g = S.g();
    const num = S.text(ch.number || '', { x: W / 2, y: 420, size: 150, weight: 800, family: 'display', anchor: 'middle', color: 'compute', opacity: 0.95 }, g);
    const title = S.text(ch.title || '', { x: W / 2, y: 600, size: 78, weight: 700, family: 'display', anchor: 'middle', maxW: 1600 }, g);
    const rule = S.line({ x1: W / 2 - 160, y1: 690, x2: W / 2 + 160, y2: 690, stroke: 'compute', sw: 3, strokeOpacity: 0.7 }, g);
    S.add(S.fx.in(num, { from: 'scale', scale: 0.9, d: 0.9 }), 0.15);
    S.add(S.fx.in(title, { from: 'up', d: 0.9 }), 0.45);
    S.add(S.fx.draw(rule, { d: 0.9 }), 0.7);
  }

  // ================================================================ audit
  function effOpacity(e) {
    let o = 1;
    for (let n = e; n && n.nodeType === 1 && n.id !== 'film'; n = n.parentNode) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
      o *= parseFloat(cs.opacity || '1');
      const ao = n.getAttribute && n.getAttribute('opacity');
      if (ao !== null && ao !== undefined && ao !== '' && n.style.opacity === '') o *= parseFloat(ao);
    }
    return o;
  }

  function audit(o = {}) {
    const issues = [];
    const texts = [...document.querySelectorAll('#film text')];
    const vis = [];
    for (const t of texts) {
      if (!t.textContent.trim()) continue;
      const op = effOpacity(t);
      if (op < 0.2) continue;
      const r = t.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const ctm = t.getScreenCTM();
      const scale = ctm ? Math.hypot(ctm.a, ctm.b) : 1;
      const px = parseFloat(t.getAttribute('font-size') || '32') * scale;
      const label = t.textContent.trim().slice(0, 48);
      if (t.closest('[data-audit="ignore"]')) continue;   // decorative: e.g. a shrunken grid that stands for "the file"
      if (px < (o.minPx || 20)) issues.push({ kind: 'small', text: label, px: Math.round(px) });
      if (r.left < SAFE - 24 || r.top < SAFE - 40 || r.right > W - SAFE + 24 || r.bottom > H - SAFE + 24)
        issues.push({ kind: 'offscreen', text: label, box: [r.left, r.top, r.right, r.bottom].map(Math.round) });
      vis.push({ t, r, label, op });
    }
    // text that straddles the edge of a filled shape (half on a card, half off it) reads as a mistake
    const shapes = [];
    for (const s of document.querySelectorAll('#scene-root rect, #scene-root circle')) {
      const f = s.getAttribute('fill');
      if (!f || f === 'none' || s.closest('pattern, defs, clipPath, mask')) continue;
      if (s.getAttribute('data-audit') === 'ignore' || s.closest('[data-audit="ignore"]')) continue;
      const r = s.getBoundingClientRect();
      if (r.width < 18 || r.height < 18 || (r.width > W - 10 && r.height > H - 10)) continue;
      const fo = parseFloat(s.getAttribute('fill-opacity') || '1');
      const op = effOpacity(s) * fo;
      if (op < 0.25) continue;
      shapes.push({ s, r });
    }
    // visible strokes (lines, curves, arrows) sampled into points, to catch text sitting on a line
    const strokePts = [];
    for (const s of document.querySelectorAll('#scene-root path, #scene-root line, #scene-root polyline')) {
      const st = s.getAttribute('stroke');
      if (!st || st === 'none' || s.closest('defs, pattern') || s.closest('[data-audit="ignore"]')) continue;
      if (effOpacity(s) * parseFloat(s.getAttribute('stroke-opacity') || '1') < 0.3) continue;
      const box = s.getBoundingClientRect();
      if (box.width < 1 && box.height < 1) continue;
      let L = 0;
      try { L = s.getTotalLength(); } catch (e) { continue; }
      const ctm = s.getScreenCTM();
      if (!ctm || !L) continue;
      const n = Math.min(500, Math.ceil(L / 6));
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const p = s.getPointAtLength(L * i / n);
        pts.push([ctm.a * p.x + ctm.c * p.y + ctm.e, ctm.b * p.x + ctm.d * p.y + ctm.f]);
      }
      strokePts.push({ s, pts, box });
    }
    for (const v of vis) {
      if (v.t.closest('#kicker')) continue;
      const a = v.r;
      const core = { left: a.left + 2, right: a.right - 2, top: a.top + a.height * 0.22, bottom: a.bottom - a.height * 0.22 };
      for (const { s, pts, box } of strokePts) {
        if (s.parentNode === v.t.parentNode && s.__strike) continue;
        if (box.right < core.left || box.left > core.right || box.bottom < core.top || box.top > core.bottom) continue;
        if (pts.some(([x, y]) => x > core.left && x < core.right && y > core.top && y < core.bottom)) {
          issues.push({ kind: 'text-on-line', text: v.label });
          break;
        }
      }
      for (const { s, r } of shapes) {
        const ix = Math.min(core.right, r.right) - Math.max(core.left, r.left);
        const iy = Math.min(core.bottom, r.bottom) - Math.max(core.top, r.top);
        if (ix <= 1 || iy <= 1) continue;
        const inside = core.left >= r.left - 1 && core.right <= r.right + 1 && core.top >= r.top - 1 && core.bottom <= r.bottom + 1;
        if (!inside) {
          issues.push({ kind: 'crosses-shape-edge', text: v.label, shape: (s.parentNode.textContent || s.tagName).trim().slice(0, 30) || s.tagName });
          break;
        }
      }
    }
    for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
      const a = vis[i].r, b = vis[j].r;
      const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ix <= 2 || iy <= 2) continue;
      // text boxes include line-gap padding; require real overlap of the glyph cores
      const coreA = a.height * 0.7, coreB = b.height * 0.7;
      if (iy < Math.min(coreA, coreB) * 0.35) continue;
      const area = ix * iy, small = Math.min(a.width * a.height, b.width * b.height);
      if (area / small > 0.12) issues.push({ kind: 'overlap', a: vis[i].label, b: vis[j].label, frac: +(area / small).toFixed(2) });
    }
    return issues;
  }

  // ================================================================ public api
  const V = {
    W, H, SAFE, TONE, fmt, scene, scenes, color, hexA, measure, rand,
    async load(id, timing, opts = {}) {
      await document.fonts.ready;
      const film = document.getElementById('film');
      film.innerHTML = '';
      defsBuilt = false;
      buildDefs(film);
      buildAmbient(film);
      if (opts.debug) film.classList.add('debug');
      const S = makeContext(id, timing, opts);
      cur = S;
      if (timing.kind === 'title') buildTitleCard(S, timing);
      else {
        const def = scenes[id];
        if (!def) throw new Error(`no scene registered with id ${id}`);
        def.build(S);
      }
      drawChrome(S, timing);
      // default entrance and exit of the whole scene
      const def = scenes[id] || {};
      if (def.fadeIn !== false) S.tl.fromTo(S.root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power1.out' }, 0);
      if (def.fadeOut !== false) S.tl.to(S.root, { autoAlpha: 0, duration: 0.45, ease: 'power1.in' }, Math.max(0, S.duration - 0.5));
      // guarantee the timeline spans the whole scene
      S.tl.set({}, {}, S.duration);
      if (opts.debug) drawDebug(S);
      V.seek(0);
      return { duration: S.duration, warnings: S.warnings };
    },
    seek(t) {
      if (!cur) return;
      const tt = Math.max(0, Math.min(t, cur.duration));
      cur.tl.seek(tt, false);
      moveAmbient((cur.timing.globalStart || 0) + tt);
    },
    audit,
    warnings() { return cur ? cur.warnings : []; },
    current() { return cur; },
  };

  function drawDebug(S) {
    const g = el('g', { opacity: 0.5 }, document.getElementById('film'));
    for (let x = 0; x <= W; x += 120) {
      el('line', { x1: x, y1: 0, x2: x, y2: H, stroke: '#4b5a80', 'stroke-width': x % 480 ? 0.6 : 1.4 }, g);
      el('text', { x: x + 4, y: 18, fill: '#7f90bb', 'font-size': 14, 'font-family': 'JetBrains Mono', text: x }, g);
    }
    for (let y = 0; y <= H; y += 120) {
      el('line', { x1: 0, y1: y, x2: W, y2: y, stroke: '#4b5a80', 'stroke-width': y % 480 ? 0.6 : 1.4 }, g);
      el('text', { x: 4, y: y - 4, fill: '#7f90bb', 'font-size': 14, 'font-family': 'JetBrains Mono', text: y }, g);
    }
    el('rect', { x: SAFE, y: SAFE, width: W - 2 * SAFE, height: H - 2 * SAFE, fill: 'none', stroke: '#ff6b6b', 'stroke-dasharray': '8 8', 'stroke-width': 1.5 }, g);
  }

  window.V = V;
})();
