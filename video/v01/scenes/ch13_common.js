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
 *    and mark its holder data-audit="ignore"), w, gap, pitch (override the derived sizes).
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
      tone: 'bytes', labels: false, arcMax: size * 2.8, arcScale: 0.08 }, g);
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
