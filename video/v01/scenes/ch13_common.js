/* Shared builders for chapter 13, The KV cache. Loaded before every ch13 scene (read-only for scene authors).
 *
 * Chapter visual language (keep it across scenes):
 *   - Tokens are libToken pills. Blue = a token already there. Amber (libToken state 'prefill') = the token
 *     being computed in this step. Dashed ('ghost') = already in the cache, not recomputed (s06).
 *   - Coral = bytes read: the staircase's arcs (s01, s05), particles leaving the cache (s05, s11).
 *   - Teal = kept / a saving: the 'keep it' store (s01), padlocks on settled rows and tiles (s02, s03).
 *   - Keys and values: blue K|V slabs from libKVCache (tone 'struct'), e.g. a one-slot row above a pill.
 *   - The cache-size formula sits in one bar in the top band (s07–s10): ch13Formula, same place every time.
 *
 *   ch13Staircase(S, o, parent)  the decode staircase of token rows with coral read arcs (s01; silhouette in s05)
 *   ch13Formula(S, o, parent)    the two-line bar 'cache per token =' / '2 × layers × KV heads × head dim × bytes'
 *   ch13Retext(t, from, to, d)   a seek-safe text change (old text before the tween, new after it)
 */

/** A text change that is a pure function of time: `from` before the tween, `to` after it, with a quick dip. */
function ch13Retext(t, from, to, d = 0.35) {
  const p = { v: 0 }, tl = gsap.timeline();
  tl.fromTo(t, { opacity: 1 }, { opacity: 0, duration: d / 2, ease: 'power1.in', immediateRender: false }, 0);
  tl.fromTo(p, { v: 0 }, { v: 1, duration: d, ease: 'none', immediateRender: false,
    onUpdate: () => { t.textContent = p.v < 0.5 ? from : to; } }, 0);
  tl.fromTo(t, { opacity: 0 }, { opacity: 1, duration: d / 2, ease: 'power1.out', immediateRender: false }, d / 2);
  return tl;
}

/**
 * ch13Staircase — one row of token pills per decode step, left-aligned, each row one pill longer than the
 * one above ('t1' 't2' …). The last pill of a row is the token computed in that step (amber once lit). Its
 * coral arcs (coral = bytes read) reach back over every earlier pill in the row, plus a small loop onto
 * itself; a grey 'reads n' tag sits at the row's right end; a faint dotted diagonal traces the right edges.
 * Rows sit on faint dashed slots (the guide) until they fill. Built on libAttention (the film's arcs and
 * chips); the self-loop is drawn here, on the right half of the newest pill, so it never crosses the arcs.
 *
 * o: x 500 (left edge of the pills), y 360 (centre of the first row), rows [4, 5, 6] (pills per row),
 *    size 36 (pill text px; the rest scales with it: pill w 2.8·size, gap 0.83·size, row pitch 4.9·size,
 *    tag text 0.75·size; below size 32 the tags fall under 24 px, so treat a smaller staircase as a picture
 *    and mark its holder data-audit="ignore"; decorative: true then keeps its pills from warning), w, gap,
 *    pitch (override the derived sizes).
 * Returns the root <g> with:
 *    .rows[i] = {g (the row: dim it, fade it), at (libAttention), toks[] (libToken chips), q (newest pill),
 *               arcs[] (to earlier pills, nearest first), self (loop), tag (pill), y, l, r (newest pill's
 *               right edge), n}
 *    .guideG (dashed slots, in parent behind the rows), .diag (dotted line), and .x .size .w .gap .pitch .h,
 *    .rowY(i), .colX(j) (centre x of pill j), .r (right end of the longest row, tags excluded).
 * Helpers (each returns a timeline for S.add; call in time order):
 *    .showGuide({stagger 0.12})  the dashed slots appear row by row (the silhouette before it is filled)
 *    .hideGuide({d 0.5})
 *    .enter(i, {d 0.5, stagger 0.06, amber false})  row i's pills slide in from the left, one by one; with
 *                                amber, the newest pill is already amber when it lands
 *    .light(i)                   the newest pill turns amber and glows (it is the one being computed)
 *    .read(i, {d 0.55, stagger 0.3, self true, flash null})  arcs draw from the newest pill back to each
 *                                earlier pill, nearest first, then the loop onto itself; flash: a tone
 *                                ('bytes', 'compute') in which each pill rings as its arc lands
 *    .readSelf(i, {d 0.5})       the loop alone (read(i, {self: false}) first)
 *    .forget(i, {d 0.6})         every arc of row i fades to nothing (read can draw them fresh again)
 *    .tag(i)                     'reads n' pops at the row's right end
 *    .drawDiag({d 1})            the dotted diagonal draws along the right edges, top to bottom
 *    .pulseRows({stagger 0.18, rows: all, scale 1.1})  the rows' pills pulse, top to bottom
 *   const st = ch13Staircase(S, { x: 500, y: 360 });
 *   S.add(st.enter(0), 'b2~Each row');  S.add(st.light(0), 'b2~newest');  S.add(st.read(0), 'b2~attends');
 */
function ch13Staircase(S, o = {}, parent) {
  const size = o.size ?? 36;
  const w = o.w ?? Math.round(size * 2.8), gap = o.gap ?? Math.round(size * 0.83);
  const pitch = o.pitch ?? Math.round(size * 4.9), h = Math.round(size * 1.85);
  const X0 = o.x ?? 500, Y0 = o.y ?? 360, counts = o.rows || [4, 5, 6];
  const arcSw = Math.max(2, size * 0.075);
  const root = S.g(null, parent);
  const guideG = S.g(null, root), diagG = S.g(null, root), rowsG = S.g(null, root);
  const rowY = i => Y0 + i * pitch, colX = j => X0 + j * (w + gap) + w / 2;
  const hideNow = e => { e.style.opacity = 0; e.style.visibility = 'hidden'; };

  // ---- the guide: faint dashed slots where the pills will land
  const guides = counts.map((n, i) => {
    const gg = S.g(null, guideG);
    for (let j = 0; j < n; j++) S.rect({ x: colX(j) - w / 2, y: rowY(i) - h / 2, w, h, r: Math.round(h * 0.3), stroke: 'struct', strokeOpacity: 0.32, sw: 2, dash: '7 7' }, gg);
    hideNow(gg);
    return gg;
  });

  // ---- the rows
  const rows = counts.map((n, i) => {
    const y = rowY(i), total = n * w + (n - 1) * gap;
    const g = S.g(null, rowsG);
    const at = libAttention(S, { x: X0 + total / 2, y, tokens: Array.from({ length: n }, (_, k) => `t${k + 1}`), size, w, gap,
      tone: 'bytes', labels: false, arcMax: size * 2.8, arcScale: 0.08, decorative: o.decorative }, g);
    const toks = at.tokens, q = toks[n - 1];
    toks.forEach(tk => hideNow(tk));
    const arcs = [];
    for (let j = n - 2; j >= 0; j--) {             // nearest first
      const a = at.arcs[j];
      a.setAttribute('stroke-width', arcSw);
      a.__op = 0;
      arcs.push(a);
    }
    // the loop onto itself, on the right half of the newest pill (the arcs leave from its left half)
    const wa = q.cy - h / 2 - 8, hw = w / 2, lh = size * 1.2;
    const arcG = at.arcs[n - 2].parentNode;
    const self = S.path({ d: `M${q.cx + 6},${wa} C${q.cx - 4},${wa - lh * 1.2} ${q.cx + hw + 16},${wa - lh} ${q.cx + hw - 12},${wa}`, stroke: 'bytes', sw: arcSw }, arcG);
    self.style.opacity = 0; self.__op = 0;
    const r = q.cx + w / 2;
    const ts = Math.round(size * 0.75);
    const tag = S.pill(`reads ${n}`, { x: r + Math.round(size * 2.5), y, anchor: 'start', h: Math.round(size * 1.22), size: ts, tone: 'neutral', style: 'outline', color: 'muted', padX: Math.round(ts * 0.6) }, g);
    hideNow(tag);
    return { g, at, toks, q, arcs, self, tag, y, l: X0, r, n, guide: guides[i] };
  });

  // ---- the dotted diagonal along the right edges, in the corridor between the pills and their tags: far
  // enough right that it clears every self-loop above a newest pill, extended a little past both ends
  const A = [rows[0].r + size * 1.7, rows[0].y], B = [rows[rows.length - 1].r + size * 1.7, rows[rows.length - 1].y];
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L, ext = pitch * 0.36;
  const D0 = [A[0] - ux * ext, A[1] - uy * ext], D1 = [B[0] + ux * ext, B[1] + uy * ext];
  const diag = S.line({ x1: D0[0], y1: D0[1], x2: D1[0], y2: D1[1], stroke: 'muted', sw: 3, dash: '1 11', strokeOpacity: 0.6 }, diagG);
  hideNow(diag);

  Object.assign(root, { rows, guideG, diag, x: X0, size, w, gap, pitch, h, rowY, colX, r: Math.max(...rows.map(rw => rw.r)) });

  // ---- helpers
  const drawArc = (a, d) => {
    const tl = gsap.timeline(), was = a.__op;
    a.__op = 0.95;
    tl.fromTo(a, { opacity: was }, { opacity: 0.95, duration: 0.12, ease: 'none', immediateRender: false }, 0);
    tl.fromTo(a, { drawSVG: '0%' }, { drawSVG: '100%', duration: d, ease: 'power2.inOut', immediateRender: false }, 0);
    return tl;
  };
  root.showGuide = (go = {}) => {
    const tl = gsap.timeline();
    guides.forEach((gg, i) => tl.fromTo(gg, { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: go.d ?? 0.5, ease: 'power3.out' }, i * (go.stagger ?? 0.12)));
    return tl;
  };
  root.hideGuide = (ho = {}) => gsap.fromTo(guides, { autoAlpha: 1 }, { autoAlpha: 0, duration: ho.d ?? 0.5, ease: 'power1.in', immediateRender: false });
  root.enter = (i, eo = {}) => {
    const rw = rows[i], tl = gsap.timeline(), st = eo.stagger ?? 0.06;
    if (eo.amber) tl.add(rw.q.setState('prefill', { d: 0.01 }), 0);
    rw.toks.forEach((tk, k) => tl.add(tk.in({ from: 'left', dist: eo.dist ?? 28, d: eo.d ?? 0.5 }), k * st));
    if (eo.amber) tl.add(rw.q.glow({ tone: 'compute', hold: 0.3 }), rw.n * st + 0.15);
    return tl;
  };
  root.light = (i, lo = {}) => {
    const rw = rows[i], tl = gsap.timeline();
    tl.add(rw.q.setState('prefill', { d: lo.d ?? 0.4 }), 0);
    tl.add(rw.q.glow({ tone: 'compute', hold: lo.hold ?? 0.7 }), 0);
    tl.add(rw.q.pulse({ scale: 1.1, d: 0.5 }), 0);
    return tl;
  };
  root.read = (i, ro = {}) => {
    const rw = rows[i], tl = gsap.timeline(), d = ro.d ?? 0.55, st = ro.stagger ?? 0.3;
    rw.arcs.forEach((a, k) => {
      tl.add(drawArc(a, d), k * st);
      if (ro.flash) tl.add(rw.toks[a.j].glow({ tone: ro.flash, hold: 0.15, d: 0.2 }), k * st + d * 0.85);
    });
    if (ro.self !== false) tl.add(drawArc(rw.self, ro.selfD ?? 0.45), rw.arcs.length * st);
    return tl;
  };
  root.readSelf = (i, ro = {}) => {
    const rw = rows[i], tl = gsap.timeline();
    tl.add(drawArc(rw.self, ro.d ?? 0.5), 0);
    if (ro.flash) tl.add(rw.q.glow({ tone: ro.flash, hold: 0.2, d: 0.2 }), (ro.d ?? 0.5) * 0.8);
    return tl;
  };
  root.forget = (i, fo = {}) => {
    const tl = gsap.timeline();
    rows[i].arcs.concat([rows[i].self]).forEach(a => {
      const was = a.__op;
      a.__op = 0;
      tl.fromTo(a, { opacity: was }, { opacity: 0, duration: fo.d ?? 0.6, ease: 'power1.inOut', immediateRender: false }, 0);
    });
    return tl;
  };
  root.tag = (i, to = {}) => gsap.fromTo(rows[i].tag, { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: to.d ?? 0.45, ease: 'power3.out' });
  root.drawDiag = (dd = {}) => {
    const tl = gsap.timeline();
    tl.fromTo(diag, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, ease: 'none' }, 0);
    tl.fromTo(diag, { attr: { x2: D0[0], y2: D0[1] } }, { attr: { x2: D1[0], y2: D1[1] }, duration: dd.d ?? 1, ease: 'power2.inOut' }, 0);
    return tl;
  };
  root.pulseRows = (po = {}) => {
    const tl = gsap.timeline(), list = po.rows ?? rows.map((_, i) => i);
    list.forEach((i, k) => rows[i].toks.forEach(tk => tl.add(tk.pulse({ scale: po.scale ?? 1.1, d: po.d ?? 0.45 }), k * (po.stagger ?? 0.18))));
    return tl;
  };
  return root;
}

/**
 * ch13Formula — the cache-size formula in its bar in the top band (s07–s10): the same place and size in every
 * scene. Line 1 is 'cache per token =' (muted); line 2 holds the five factors, set as an equation with each
 * '×' centred between its neighbours:
 *     2 × layers × KV heads × head dim × bytes            mode 'words'
 *     2 × 80 × 8 × 128 × 2 = 327,680 bytes                 mode 'numbers' (the coral result is optional)
 * Under each factor are two note rows: a value row (mono numbers such as '80'; also the room for a scene's own
 * small K and V tiles under the '2') and a grey label row ('layers'). The '×' before factor i belongs to factor
 * i and lands with it. Labels need room: the default slots fit 'one key, one value' under the '2' in words
 * mode, and 'K and V' … 'bytes' in numbers mode without a result (with a result the numbers close up and there
 * is no room for labels). A warning says when two labels would run together.
 *
 * o: x 960 (centre), y 114 (top of the bar), mode 'words' | 'numbers', landed [0, 1, 2, 3, 4] (factors shown
 *    at build; the others are dashed blank slots until .land), labels [5] / values [5] (notes shown at build,
 *    null for none), result true | false | text (numbers mode: '= 327,680 bytes' after the factors; false:
 *    the factors are centred on their own; the result shows at build in numbers mode, or lands in .toNumbers),
 *    hidden false (true: the bar, the head and the whole line wait for .drawOn), size 46,
 *    room {words 150, numbers 130 (0 with a result)}: the least width per factor, so labels beneath stay apart
 *    ({words: 0} sets the symbolic line tight when it carries no labels). The bar's size never changes.
 * Returns <g> with .bar .headEl .terms[i] {g (holder, moved by fx.xform), inner, word, num, slot}, .ops[i] (i ≥ 1,
 *    the '×' before factor i), .resultG, and geometry .l .r .t .b .cx .w .h, .headY .rowY .valueY .labelY,
 *    .termX(i, mode) (centre x of factor i in that layout), .termW(i, mode).
 * Helpers (each returns a timeline for S.add; call them in time order, the state is planned):
 *    .drawOn({d 0.9})                   the bar fades up, the head types on, then the line (landed factors,
 *                                       their notes, the blank slots) fades in
 *    .land(i, {label, value, valueTone, d 0.55})   factor i and its '×' drop into place; its notes fade in
 *                                       (only for a factor not in `landed`)
 *    .setLabel(i, text|null, {d 0.4})   crossfade the grey label under factor i (null: fade it out)
 *    .setValue(i, text|null, {tone 'ink', d 0.4})   crossfade the value under factor i
 *    .swap(i, text, {tone, d 0.45})     factor i's text becomes another ('8' → '64'), centred where it was
 *    .tint(i, tone|null, {d 0.4})       recolour factor i and its '×' ('muted' = flickers grey; null = back)
 *    .glow(i, {tone 'bytes', d 1.1, hold 0.35})   factor i flashes in a tone with a soft bloom, then returns
 *    .toNumbers({d 1, result true, keepValues false})  each factor becomes its number, the line closes up
 *                                       around the centre, the values beneath fade (they rose into the line)
 *                                       and the result lands
 *    .toWords({d 1})                    back to the symbolic line (the result fades)
 *   const f = ch13Formula(S, { landed: [], hidden: true });
 *   S.add(f.drawOn(), 'b1+0.2');
 *   S.add(f.land(0, { label: 'one key, one value' }), 'b1~two-0.2');
 *   S.add(f.land(1, { label: 'layers' }), 'b1~layers-0.2');
 *   S.add(f.setValue(1, '80', { tone: 'bytes' }), 'b3~eighty#2');
 */
function ch13Formula(S, o = {}, parent) {
  const size = o.size ?? 46, cx = o.x ?? 960, y0 = o.y ?? 114;
  const vSize = Math.round(size * 0.68), lSize = 26, hSize = 32;
  const WORDS = ['2', 'layers', 'KV heads', 'head dim', 'bytes'];
  const NUMS = ['2', '80', '8', '128', '2'];
  const wFam = i => (i === 0 ? 'mono' : 'sans');
  const meas = (t, fam) => S.measure(t, { size, weight: 600, family: fam });
  const opW = meas('×', 'sans'), pad = Math.round(size * 0.5), gap = opW + 2 * pad;
  const wordW = WORDS.map((t, i) => meas(t, wFam(i))), numW = NUMS.map(t => meas(t, 'mono'));
  const resAmt = '327,680', resUnit = ' bytes';
  const resW = meas('=', 'sans') + pad + meas(resAmt, 'mono') + meas(resUnit, 'sans');
  const withRes = o.result !== false;
  const resText = typeof o.result === 'string' ? o.result : null;
  // each factor sits in a slot at least `room` wide, so the labels beneath it have air between them; each '×'
  // is centred between the glyphs on either side of it (not between the slots), so the spacing reads evenly
  const room = { words: o.room?.words ?? 150, numbers: o.room?.numbers ?? (withRes ? 0 : 130) };
  const layout = (mode, res, rm = room[mode]) => {
    const ws = mode === 'numbers' ? numW : wordW, sl = ws.map(w => Math.max(w, rm));
    const total = sl.reduce((a, b) => a + b, 0) + gap * 4 + (mode === 'numbers' && res ? pad + resW : 0);
    let x = cx - total / 2;
    const xs = [], ops = [];
    sl.forEach((w, i) => { if (i) x += gap; xs.push(x + w / 2); x += w; });
    // centre what is visible (first glyph to last glyph or the result), not the slots
    const vl = xs[0] - ws[0] / 2, vr = mode === 'numbers' && res ? xs[4] + ws[4] / 2 + pad + resW : xs[4] + ws[4] / 2;
    const sh = cx - (vl + vr) / 2;
    for (let i = 0; i < 5; i++) xs[i] += sh;
    for (let i = 1; i < 5; i++) ops[i] = ((xs[i - 1] + ws[i - 1] / 2) + (xs[i] - ws[i] / 2)) / 2;
    return { xs, ops, resL: xs[4] + ws[4] / 2 + pad, total };
  };
  const LW = layout('words'), LN = layout('numbers', withRes);
  const mode0 = o.mode || 'words', L0 = mode0 === 'numbers' ? LN : LW;
  let mode = mode0;
  // the bar is the same size in every scene, whatever the mode and options
  const padX = 80;
  const W = Math.max(layout('words', false, 150).total, layout('numbers', true, 0).total, layout('numbers', false, 130).total) + 2 * padX;
  const headY = y0 + 38, rowY = y0 + 98, valueY = rowY + 50, labelY = valueY + 38, H = labelY + 30 - y0;

  const g = S.g(null, parent);
  const vis = (e, a) => { e.style.opacity = a; e.style.visibility = a > 0 ? 'inherit' : 'hidden'; e.__op = a; return e; };
  const fade = (e, to, d, ease = 'power1.inOut') => {
    const from = e.__op ?? 1; e.__op = to;
    return gsap.fromTo(e, { autoAlpha: from }, { autoAlpha: to, duration: d, ease, immediateRender: false });
  };
  const fill = (e, tone, d) => {
    const from = e.__fill, to = S.tone(tone); e.__fill = to;
    return gsap.fromTo(e, { attr: { fill: from } }, { attr: { fill: to }, duration: d, ease: 'power1.inOut', immediateRender: false });
  };
  const txt = (str, x, y, so, p) => { const t = S.text(str, { x, y, anchor: 'middle', ...so }, p); t.__fill = S.tone(so.color || 'ink'); return t; };

  // ---- the bar and its head line
  const barG = S.g(null, g);
  S.rect({ x: cx - W / 2, y: y0, w: W, h: H, r: 22, fill: '#0c1326', filter: 'url(#shadow)' }, barG);
  const bar = S.rect({ x: cx - W / 2, y: y0, w: W, h: H, r: 22, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.32, sw: 1.5 }, barG);
  const headEl = txt('cache per token =', cx, headY, { size: hSize, weight: 550, color: 'muted' }, g);
  const termsG = S.g(null, g);

  // ---- factors, each in a holder (moved between layouts) with an inner group (lands); notes ride in the holder
  const landed = new Set(o.landed ?? [0, 1, 2, 3, 4]);
  const terms = WORDS.map((wd, i) => {
    const holder = S.g(null, termsG), x = L0.xs[i];
    const slotW = (mode0 === 'numbers' ? numW[i] : wordW[i]) + 22, slotH = Math.round(size * 1.12);
    const slot = S.rect({ x: x - slotW / 2, y: rowY - slotH / 2, w: slotW, h: slotH, r: 12, stroke: 'muted', strokeOpacity: 0.55, sw: 2, dash: '7 7' }, holder);
    vis(slot, landed.has(i) ? 0 : 1);
    const inner = S.g(null, holder);
    const word = vis(txt(wd, x, rowY, { size, weight: 600, family: wFam(i) }, inner), mode0 === 'words' ? 1 : 0);
    const num = vis(txt(NUMS[i], x, rowY, { size, weight: 600, family: 'mono' }, inner), mode0 === 'numbers' ? 1 : 0);
    if (!landed.has(i)) vis(inner, 0);
    return { g: holder, inner, word, num, slot, cur: mode0 === 'numbers' ? num : word, x, label: null, value: null, notes: [] };
  });
  const ops = terms.map((tm, i) => {
    if (!i) return null;
    const holder = S.g(null, termsG), inner = S.g(null, holder);
    holder.el = txt('×', L0.ops[i], rowY, { size, weight: 600, color: 'muted' }, inner);
    holder.inner = inner;
    if (!landed.has(i)) vis(inner, 0);
    return holder;
  });
  // ---- the result, placed for the numbers layout
  const resultG = S.g(null, termsG);
  const rx = LN.resL;
  if (resText) txt(resText, rx, rowY, { size, weight: 600, color: 'bytes', anchor: 'start' }, resultG);
  else {
    S.text([{ t: '=', c: 'muted' }], { x: rx, y: rowY, size, weight: 600 }, resultG);
    const ax = rx + meas('=', 'sans') + pad;
    S.text([{ t: resAmt, c: 'bytes', f: 'mono' }, { t: resUnit, c: 'bytes' }], { x: ax, y: rowY, size, weight: 600 }, resultG);
  }
  vis(resultG, mode0 === 'numbers' && withRes ? 1 : 0);

  // ---- notes beneath a factor: a value row and a label row; each change makes a new element and crossfades
  const notesFit = () => {
    for (let i = 0; i < 4; i++) {
      const a = terms[i].labelText, b = terms[i + 1].labelText;
      if (!a || !b) continue;
      const P = (mode === 'numbers' ? LN : LW).xs, span = P[i + 1] - P[i], need = (S.measure(a, { size: lSize, weight: 550 }) + S.measure(b, { size: lSize, weight: 550 })) / 2 + 32;
      if (need > span) S.warn(`ch13Formula: labels "${a}" and "${b}" run together (${Math.round(need - span)} px short; set o.room)`);
    }
  };
  const note = (i, kind, text, no = {}) => {
    const tm = terms[i], tl = gsap.timeline(), d = no.d ?? 0.4;
    const old = tm[kind];
    if (old) tl.add(fade(old, 0, d * 0.6, 'power1.in'), 0);
    tm[kind] = null;
    if (kind === 'label') tm.labelText = text || null;
    if (text != null && text !== '') {
      const e = kind === 'value'
        ? txt(String(text), tm.x, valueY, { size: vSize, weight: 600, family: 'mono', color: no.tone || 'ink' }, tm.g)
        : txt(String(text), tm.x, labelY, { size: lSize, weight: 550, color: 'muted' }, tm.g);
      vis(e, 0);
      tl.add(gsap.fromTo(e, { autoAlpha: 0, y: kind === 'value' ? -10 : 8 }, { autoAlpha: 1, y: 0, duration: d, ease: 'power2.out', immediateRender: false }), old ? d * 0.62 : 0);
      e.__op = 1;
      tm[kind] = e;
      tm.notes.push(e);
    }
    if (kind === 'label') notesFit();
    return tl;
  };
  (o.labels || []).forEach((t, i) => { if (t) { const e = txt(t, terms[i].x, labelY, { size: lSize, weight: 550, color: 'muted' }, terms[i].g); e.__op = 1; terms[i].label = e; terms[i].labelText = t; } });
  (o.values || []).forEach((t, i) => { if (t != null) { const e = txt(String(t), terms[i].x, valueY, { size: vSize, weight: 600, family: 'mono' }, terms[i].g); e.__op = 1; terms[i].value = e; } });
  notesFit();

  // ---- hidden until drawOn
  const hidden = !!o.hidden;
  if (hidden) { vis(barG, 0); vis(headEl, 0); vis(termsG, 0); }

  Object.assign(g, {
    bar, headEl, terms, ops, resultG,
    l: cx - W / 2, r: cx + W / 2, t: y0, b: y0 + H, cx, w: W, h: H, headY, rowY, valueY, labelY,
    termX: (i, m) => (m === 'numbers' ? LN : LW).xs[i], termW: (i, m) => (m === 'numbers' ? numW : wordW)[i],
  });

  // ---- helpers
  g.drawOn = (dd = {}) => {
    const tl = gsap.timeline(), d = dd.d ?? 0.9;
    if (!hidden) return tl;
    tl.fromTo(barG, { autoAlpha: 0, scale: 0.97, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: d * 0.7, ease: 'power3.out', immediateRender: false }, 0);
    tl.set(headEl, { autoAlpha: 1 }, d * 0.25);
    tl.add(S.fx.type(headEl, { d: d * 0.75 }), d * 0.25);
    // the factors already landed (with their notes) and the blank slots of the rest
    tl.fromTo(termsG, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', immediateRender: false }, d * 0.55);
    headEl.__op = 1;
    return tl;
  };
  g.land = (i, lo = {}) => {
    const tm = terms[i], tl = gsap.timeline(), d = lo.d ?? 0.55;
    tl.add(fade(tm.slot, 0, d * 0.6), 0);
    tl.add(S.fx.in(tm.inner, { from: 'up', dist: 22, d }), 0);
    if (ops[i]) tl.add(S.fx.in(ops[i].inner, { from: 'fade', d: d * 0.8 }), 0.05);
    if (lo.value != null) tl.add(note(i, 'value', lo.value, { tone: lo.valueTone }), d * 0.6);
    if (lo.label != null) tl.add(note(i, 'label', lo.label), d * 0.75);
    return tl;
  };
  g.setLabel = (i, text, so = {}) => note(i, 'label', text, so);
  g.setValue = (i, text, so = {}) => note(i, 'value', text, so);
  g.swap = (i, text, so = {}) => {
    const tm = terms[i], tl = gsap.timeline(), d = so.d ?? 0.45;
    const fam = /^[\d.,]+$/.test(text) ? 'mono' : 'sans';
    // drawn at the build position: the holder carries it to wherever the factor now sits
    const e = vis(txt(text, tm.x, rowY, { size, weight: 600, family: fam, color: so.tone || 'ink' }, tm.inner), 0);
    tl.add(fade(tm.cur, 0, d * 0.4, 'power1.in'), 0);
    tl.add(gsap.fromTo(e, { autoAlpha: 0, scale: 0.8, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: d, ease: 'back.out(2)', immediateRender: false }), d * 0.42);
    e.__op = 1;
    tm.cur = e;
    return tl;
  };
  g.tint = (i, tone, so = {}) => {
    const tm = terms[i], tl = gsap.timeline(), d = so.d ?? 0.4;
    tl.add(fill(tm.cur, tone || 'ink', d), 0);
    if (ops[i]) tl.add(fill(ops[i].el, tone || 'muted', d), 0);
    return tl;
  };
  g.glow = (i, go = {}) => {
    const tm = terms[i], tl = gsap.timeline(), d = go.d ?? 1.1, tone = go.tone || 'bytes', hold = go.hold ?? 0.35;
    const cur = tm.cur, bloom = cur.cloneNode(true);
    bloom.removeAttribute('style');
    bloom.setAttribute('fill', S.tone(tone));
    bloom.setAttribute('filter', `url(#glow-${tone})`);
    bloom.setAttribute('data-audit', 'ignore');
    tm.inner.insertBefore(bloom, cur);
    vis(bloom, 0);
    const up = d * 0.3, down = d - up - hold;
    const was = cur.__fill;
    tl.fromTo(bloom, { autoAlpha: 0 }, { autoAlpha: 1, duration: up, ease: 'power2.out', immediateRender: false }, 0);
    tl.fromTo(cur, { attr: { fill: was } }, { attr: { fill: S.tone(tone) }, duration: up, ease: 'power2.out', immediateRender: false }, 0);
    tl.fromTo(bloom, { autoAlpha: 1 }, { autoAlpha: 0, duration: down, ease: 'power1.inOut', immediateRender: false }, up + hold);
    tl.fromTo(cur, { attr: { fill: S.tone(tone) } }, { attr: { fill: was }, duration: down, ease: 'power1.inOut', immediateRender: false }, up + hold);
    return tl;
  };
  const relayout = (to, ro = {}) => {
    const tl = gsap.timeline(), d = ro.d ?? 1, L = to === 'numbers' ? LN : LW;
    terms.forEach((tm, i) => {
      tl.add(S.fx.xform(tm.g, { x: L.xs[i] - L0.xs[i] }, { d, ease: 'power3.inOut' }), 0);
      const target = to === 'numbers' ? tm.num : tm.word;
      if (tm.cur !== target) {
        tl.add(fade(tm.cur, 0, d * 0.4, 'power1.in'), 0);
        tl.add(fade(target, 1, d * 0.5, 'power1.out'), d * 0.42);
        tm.cur = target;
      }
      if (to === 'numbers' && !ro.keepValues && tm.value) {
        tl.add(gsap.fromTo(tm.value, { autoAlpha: tm.value.__op, y: 0 }, { autoAlpha: 0, y: -26, duration: d * 0.5, ease: 'power2.in', immediateRender: false }), 0);
        tm.value.__op = 0; tm.value = null;
      }
    });
    ops.forEach((op, i) => { if (op) tl.add(S.fx.xform(op, { x: L.ops[i] - L0.ops[i] }, { d, ease: 'power3.inOut' }), 0); });
    mode = to;
    return tl;
  };
  g.toNumbers = (no = {}) => {
    const tl = relayout('numbers', no), d = no.d ?? 1;
    if (withRes && no.result !== false && resultG.__op !== 1) {
      resultG.__op = 1;
      tl.add(gsap.fromTo(resultG, { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out', immediateRender: false }), d * 0.85);
    }
    return tl;
  };
  g.toWords = (wo = {}) => {
    const tl = relayout('words', wo);
    if (resultG.__op) tl.add(fade(resultG, 0, 0.35, 'power1.in'), 0);
    return tl;
  };
  return g;
}
