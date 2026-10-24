/* ch13_s02 · the causal triangle (fig 132)
   b1: chapter 8's 5 × 5 score grid returns, every cell unlit; its labels become token 1 … token 5 and the
       column note 'keys it may attend to'; the allowed cells light blue, row by row: token 1 sees itself,
       token 5 sees all five (blue: which positions a token may see is structure, not a score).
   b2: everything ahead hatches out (the causal mask); the header; 15 / 25 cells used. For a long sequence it
       is about half: the 5 × 5 grid shrinks into the corner of a 40 × 40 mesh with the same triangle, then
       eases back.
   b3: the grid steps into the left third, cells only. Decode: no token exists until the one before is
       chosen (row 2's label slot stays empty until the new amber pill drops out of row 1's end, chained to
       it); only then does row 2 light; it looks back only; row 1 padlocks.
   b4: Prefill, every token present, fills its triangle in one shot. Decode adds rows 3, 4, 5 one at a time,
       each chained to the one before, each padlocking the row above.
   b5: the chain comes from the work (the mask at left), not the hardware (an idle chip). The triangle is
       why the phases differ. */
V.scene('ch13_s02', S => {
  const { fx } = S;

  // ---------------------------------------------------------------- small helpers (seek-safe)
  const at = (base, off) => `${base}${off >= 0 ? '+' : ''}${off.toFixed(3)}`;   // 'b1~of' + -0.05 -> 'b1~of-0.050'
  const hide = e => { e.style.opacity = 0; e.style.visibility = 'hidden'; return e; };
  const fa = (e, a, b, d = 0.4, ease = 'power1.inOut') =>
    gsap.fromTo(e, { autoAlpha: a }, { autoAlpha: b, duration: d, ease, immediateRender: false });
  /** a soft bloom over some cells: opacity 0 → 1 → 0 */
  const bloom = (e, o = {}) => {
    const tl = gsap.timeline(), up = o.up ?? 0.25, hold = o.hold ?? 0.25, down = o.down ?? 0.6;
    tl.fromTo(e, { opacity: 0 }, { opacity: o.peak ?? 1, duration: up, ease: 'power2.out', immediateRender: false }, 0);
    tl.fromTo(e, { opacity: o.peak ?? 1 }, { opacity: 0, duration: down, ease: 'power1.inOut', immediateRender: false }, up + hold);
    return tl;
  };
  /** the lit staircase of an n × n grid (cells c ≤ r) as one polygon: a glow shape */
  const stairD = (x0, y0, px, py, cw, ch, n) => {
    const f = v => v.toFixed(2);
    let d = `M${f(x0)},${f(y0)}L${f(x0 + cw)},${f(y0)}`;
    for (let r = 1; r < n; r++) d += `L${f(x0 + (r - 1) * px + cw)},${f(y0 + r * py)}L${f(x0 + r * px + cw)},${f(y0 + r * py)}`;
    return d + `L${f(x0 + (n - 1) * px + cw)},${f(y0 + (n - 1) * py + ch)}L${f(x0)},${f(y0 + (n - 1) * py + ch)}Z`;
  };
  const glowShape = (d, parent) => {
    const p = S.path({ d, fill: 'struct', fillOpacity: 0.32, stroke: 'struct', strokeOpacity: 0.95, sw: 3, filter: 'url(#glow-struct)' }, parent);
    p.style.opacity = 0;
    p.setAttribute('data-audit', 'ignore');
    return p;
  };
  /** a short vertical chain: two interlocking links bridging the gap between two pills (drawn behind them) */
  const chainLink = (x, y, parent) => {
    const g = S.g(null, parent);
    const w = 14, h = 20, ys = [y - 17, y - 3];
    ys.forEach(yy => S.rect({ x: x - w / 2, y: yy, w, h, r: w / 2, stroke: '#0c1326', sw: 7.5 }, g));
    g.links = ys.map(yy => S.rect({ x: x - w / 2, y: yy, w, h, r: w / 2, stroke: 'muted', sw: 3.2 }, g));
    hide(g);
    return g;
  };

  // ---------------------------------------------------------------- b1: the grid of scores, unlit
  const BG = { cx: 960, cy: 571, cw: 104, ch: 78, gap: 8 };
  const BPX = BG.cw + BG.gap, BPY = BG.ch + BG.gap;
  const WORDS = ['the', 'cat', 'sat', 'down', 'it'];
  const meshG = S.g();                                  // the 40 × 40 mesh of b2, behind the grid
  const sg = libAttentionGrid(S, { x: BG.cx, y: BG.cy, tokens: WORDS, cw: BG.cw, ch: BG.ch, gap: BG.gap, hidden: true, maskLabel: 'masked' });
  const [cellsG, maskG, labG, frontG] = Array.from(sg.children);
  // the cells and the hatching ride in one holder (scaled into the mesh's corner in b2)
  const art = S.g(null, sg);
  sg.insertBefore(art, sg.firstChild);
  art.appendChild(cellsG); art.appendChild(maskG);
  const X0 = sg.x, Y0 = sg.y, GW = sg.w, GH = sg.h;
  const TY = Y0 - 78;                                   // the title row above the column labels
  // titles as in chapter 8: 'asks' with a magnifier (rows), 'is asked' with a key (columns)
  const titleAt = (text, x, anchor, icon, parent) => {
    const g = S.g(null, parent);
    const tw = S.measure(text, { size: 26, weight: 600 });
    const l = anchor === 'end' ? x - tw : x - tw / 2;
    S.text(text, { x, y: TY, size: 26, anchor, color: 'muted', weight: 600 }, g);
    S.icon(icon, { x: l - 26, y: TY, size: icon.includes('key') ? 34 : 32, color: 'muted' }, g);
    return g;
  };
  const rowT = titleAt('asks', X0 - 18, 'end', 'ph:magnifying-glass-duotone', labG);
  const colT = titleAt('is asked', X0 + GW / 2 + 22, 'middle', 'ph:key-duotone', labG);
  const colN = hide(titleAt('keys it may attend to', X0 + GW / 2 + 22, 'middle', 'ph:key-duotone', labG));
  S.add(sg.in({ d: 0.6 }), 'b1-0.3');
  // "grid of scores": the words become positions
  sg.rowLabels.forEach((t, i) => S.add(ch13Retext(t, WORDS[i], `token ${i + 1}`, 0.4), at('b1~of', -0.05 + i * 0.05)));
  sg.colLabels.forEach((t, i) => S.add(ch13Retext(t, WORDS[i], `${i + 1}`, 0.4), at('b1~of', 0.05 + i * 0.05)));
  S.add(fa(rowT, 1, 0, 0.35), 'b1~of');
  S.add(fa(colT, 1, 0, 0.3), 'b1~of+0.05');
  S.add(fa(colN, 0, 1, 0.45), 'b1~of+0.3');
  // token 1 sees only itself … token 5 sees all five
  S.add(sg.focusRow(0, { tone: 'muted' }), 'b1~Token-0.15');
  S.add(sg.lightRow(0, { tone: 'struct', d: 0.35 }), 'b1~one-0.15');
  [1, 2, 3].forEach((r, k) => S.add(sg.lightRow(r, { tone: 'struct', stagger: 0.04, d: 0.3 }), at('b1~itself', 0.15 + k * 0.2)));
  S.add(sg.focusRow(4), 'b1~five-0.2');
  S.add(sg.lightRow(4, { tone: 'struct', stagger: 0.07, d: 0.3 }), 'b1~all-0.12');
  S.add(sg.unfocus(), 'b2-0.25');

  // ---------------------------------------------------------------- b2: the causal mask, and about half
  S.add(sg.mask({ d: 0.9 }), 'b2~masked-0.3');
  // the header writes on, laid out from its left edge so it types left to right
  const HEAD = 'Attention is causal', SUB = 'a token sees only what came before it';
  const hw = S.measure(HEAD, { size: 52, weight: 700, family: 'display' }), sw = S.measure(SUB, { size: 30, weight: 450 });
  const head = S.text(HEAD, { x: 960 - hw / 2, y: 140, size: 52, weight: 700, family: 'display' });
  const sub = S.text(SUB, { x: 960 - sw / 2, y: 194, size: 30, weight: 450, color: 'muted' });
  hide(head); hide(sub);
  S.add(fa(head, 0, 1, 0.05), 'b2~causal-0.1');
  S.add(fx.type(head, { d: 0.7 }), 'b2~causal-0.1');
  S.add(fa(sub, 0, 1, 0.05), 'b2~mask#2+0.15');
  S.add(fx.type(sub, { d: 0.85 }), 'b2~mask#2+0.15');
  // the counter, top right of the grid: the lit cells counted, each ringing as it is counted
  const CX = X0 + GW + 56;
  const cnt = S.g();
  const cNum = S.counter({ x: CX, y: Y0 + 34, size: 60, value: 15, suffix: ' / 25', anchor: 'start', color: 'ink', family: 'sans', tnum: true, weight: 650 }, cnt);
  const cLab = S.text('cells used', { x: CX, y: Y0 + 90, size: 26, color: 'muted', weight: 550 }, cnt);
  hide(cnt);
  const ringG = S.g(null, sg);
  const lit = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c <= r; c++) lit.push(sg.cellAt(r, c));
  const rings = lit.map(cl => { const e = S.rect({ x: cl.x, y: cl.y, w: cl.w, h: cl.h, r: 8, fill: '#ffffff', fillOpacity: 0.28, stroke: '#ffffff', strokeOpacity: 0.9, sw: 2 }, ringG); e.style.opacity = 0; return e; });
  S.add(fx.in(cnt, { from: 'left', d: 0.5 }), 'b2~mask#2-0.05');
  S.add(fx.count(cNum, 0, 15, { d: 0.75, ease: 'none' }), 'b2~mask#2+0.05');
  rings.forEach((e, i) => S.add(bloom(e, { up: 0.08, hold: 0.04, down: 0.3 }), at('b2~mask#2', 0.05 + i * 0.05)));

  // "sees only what came before it": the grid becomes the corner of a much longer sequence, a 40 × 40 mesh
  // with the same triangle. The 5 × 5 shrinks into its top-left corner; the mesh grows out, shell by shell.
  const N = 40, SM = GW / (N * BPX - BG.gap);
  const MPX = BPX * SM, MPY = BPY * SM, MCW = BG.cw * SM, MCH = BG.ch * SM;
  const shells = [];
  for (let k = 1; k < N / 5; k++) {
    let dl = '', dm = '';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const m = Math.max(r, c);
      if (m < 5 * k || m >= 5 * k + 5) continue;
      const x = X0 + c * MPX, y = Y0 + r * MPY;
      const seg = `M${x.toFixed(2)},${y.toFixed(2)}h${MCW.toFixed(2)}v${MCH.toFixed(2)}h${(-MCW).toFixed(2)}z`;
      if (c <= r) dl += seg; else dm += seg;
    }
    const g = S.g(null, meshG);
    S.path({ d: dm, fill: '#1a2136' }, g);
    S.path({ d: dl, fill: 'struct', fillOpacity: 0.6 }, g);
    hide(g);
    shells.push(g);
  }
  const meshGlow = glowShape(stairD(X0, Y0, MPX, MPY, MCW, MCH, N), meshG);
  meshG.setAttribute('data-audit', 'ignore');
  art.setAttribute('data-audit', 'ignore');
  S.add(fa([labG, frontG], 1, 0, 0.3), 'b2~sees only-0.15');
  S.add(fx.xform(art, { s: SM, ox: X0, oy: Y0 }, { d: 0.7, ease: 'power2.inOut' }), 'b2~sees only-0.15');
  shells.forEach((g, k) => S.add(fa(g, 0, 1, 0.26, 'power1.out'), at('b2~sees only', 0.48 + k * 0.065)));
  S.add(ch13Retext(cNum, '15 / 25', '≈ half', 0.4), 'b2~came+0.1');
  S.add(bloom(meshGlow, { up: 0.25, hold: 0.15, down: 0.3, peak: 0.9 }), 'b2~so only-0.27');
  // "triangle": back to the 5 × 5 in under a second, done by "used"
  [...shells].reverse().forEach((g, k) => S.add(fa(g, 1, 0, 0.2, 'power1.in'), at('b2~triangle', -0.32 + k * 0.02)));
  S.add(fx.xform(art, { s: 1 }, { d: 0.75, ease: 'power2.inOut' }), 'b2~triangle-0.06');
  S.add(ch13Retext(cNum, '≈ half', '15 / 25', 0.4), 'b2~triangle+0.35');
  S.add(fa([labG, frontG], 0, 1, 0.35), 'b2~triangle+0.45');

  // ---------------------------------------------------------------- b3: the grid steps aside; Decode
  const LG = { cx: 272, cy: 552, s: 0.52 };
  S.add(fa(sub, 1, 0, 0.4, 'power2.in'), 'b3-0.15');
  S.add(fa([labG, frontG], 1, 0, 0.4), 'b3-0.15');
  S.add(fa(cnt, 1, 0, 0.4), 'b3-0.15');
  S.add(fx.xform(sg, { x: LG.cx - BG.cx, y: LG.cy - BG.cy, s: LG.s, ox: BG.cx, oy: BG.cy }, { d: 1.05, ease: 'power3.inOut' }), 'b3');
  const lgGlow = glowShape(stairD(X0, Y0, BPX, BPY, BG.cw, BG.ch, 5), sg);

  // the two mini-grids (Prefill, Decode): the same cells, with a column of token pills on the right
  const MG = { cw: 64, ch: 60, gap: 8, cy: 552 };
  const MPx = MG.cw + MG.gap, MPy = MG.ch + MG.gap;
  const MGW = 5 * MPx - MG.gap;
  const PILL = { w: 58, h: 34, size: 24, dx: 22 };
  const mini = (l, title, parent, chained) => {
    const root = S.g(null, parent);
    const cx = l + MGW / 2;
    const grid = libAttentionGrid(S, { x: cx, y: MG.cy, tokens: ['', '', '', '', ''], cw: MG.cw, ch: MG.ch, gap: MG.gap, hidden: true, icons: false }, root);
    grid.rowLabels.forEach(t => t.remove());
    grid.colLabels.forEach(t => t.remove());
    const titleEl = S.text(title, { x: cx, y: grid.t - 42, size: 38, weight: 700, family: 'display', anchor: 'middle' }, root);
    hide(titleEl);
    const px = grid.r + PILL.dx + PILL.w / 2;
    const rowY = r => grid.t + MG.ch / 2 + r * MPy;
    // the links sit behind the pills: their ends tuck under the pills they join, and a pulse never covers a label
    const linkG = S.g(null, root), slotG = S.g(null, root), pillG = S.g(null, root), lockG = S.g(null, root);
    const links = chained ? [0, 1, 2, 3].map(r => chainLink(px, rowY(r) + MPy / 2, linkG)) : [];
    const slots = [0, 1, 2, 3, 4].map(r => (chained && r > 0
      ? libToken(S, { text: '', x: px, y: rowY(r), w: PILL.w, h: PILL.h, size: PILL.size, state: 'slot', hidden: true }, slotG) : null));
    // created last row first, so an earlier pill sits above the one that slides out from behind it
    const pills = [];
    for (let r = 4; r >= 0; r--) pills[r] = libToken(S, { text: `t${r + 1}`, x: px, y: rowY(r), w: PILL.w, h: PILL.h, size: PILL.size, hidden: true }, pillG);
    const locks = [0, 1, 2, 3].map(r => Array.from({ length: r + 1 }, (_, c) => {
      const cl = grid.cellAt(r, c), g = S.g(null, lockG);
      S.circle({ x: cl.cx, y: cl.cy, r: 15, fill: '#0c1326', fillOpacity: 0.92, stroke: 'helps', strokeOpacity: 0.75, sw: 2 }, g);
      S.icon('ph:lock-simple-duotone', { x: cl.cx, y: cl.cy - 0.5, size: 20, color: 'helps' }, g);
      hide(g);
      return g;
    }));
    const glow = glowShape(stairD(grid.x, grid.y, MPx, MPy, MG.cw, MG.ch, 5), root);
    Object.assign(root, { grid, titleEl, pills, slots, links, locks, glow, px, rowY, cx, l, r: px + PILL.w / 2 });
    root.drawOn = (o = {}) => {
      const tl = gsap.timeline();
      tl.add(fx.in(titleEl, { from: 'up', d: 0.6 }), 0);
      tl.add(grid.in({ d: 0.6 }), 0.05);
      tl.add(gsap.fromTo(grid.maskBands, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, stagger: 0.07, ease: 'power1.out', immediateRender: false }), o.mask ?? 0.45);
      return tl;
    };
    return root;
  };

  // Decode is the subject of b3: drawn at its b4 place, carried bigger into the middle of the right side
  const PL = 530, DL = 1060;                             // left edges of the Prefill and Decode grids (b4, b5)
  const DH = S.g();
  const dec = mini(DL, 'Decode', DH, true);
  const DPC = { x: (dec.l + dec.r) / 2, y: MG.cy };
  S.xset(DH, { x: 1150 - DPC.x, y: 0, s: 1.3, ox: DPC.x, oy: DPC.y });
  const dg = dec.grid, dp = dec.pills;
  S.add(dec.drawOn(), 'b3~chain+0.05');
  S.add(dp[0].pop({ d: 0.45 }), 'b3~earlier-0.1');
  S.add(gsap.fromTo(dec.slots.slice(1), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, stagger: 0.07, ease: 'power1.out', immediateRender: false }), 'b3~earlier+0.05');
  // row 1 lights: token 1 is the one being computed (amber)
  S.add(dg.lightRow(0, { tone: 'struct', d: 0.35 }), 'b3~earlier+0.35');
  S.add(dp[0].setState('prefill', { d: 0.35 }), 'b3~earlier+0.35');
  // "no token exists": row 2's label is an empty slot
  S.add(dec.slots[1].pulse({ scale: 1.14, d: 0.55 }), 'b3~no token-0.05');
  S.add(dec.slots[1].glow({ tone: 'white', hold: 0.35, d: 0.25 }), 'b3~no token-0.05');
  // "until the one before is chosen": token 1 rings; the new token drops out of it into the slot, chained
  S.add(dp[0].glow({ tone: 'compute', hold: 0.3, d: 0.25 }), 'b3~the one before-0.1');
  const drop = (r, o = {}) => {
    const tl = gsap.timeline(), d = o.d ?? 0.55;
    tl.add(dp[r].setState('prefill', { d: 0.01 }), 0);
    tl.add(dp[r].in({ from: 'down', dist: MPy, d, ease: 'power2.inOut' }), 0);
    tl.add(gsap.fromTo(dec.links[r - 1], { autoAlpha: 0, scaleY: 0.2, transformOrigin: '50% 0%' }, { autoAlpha: 1, scaleY: 1, transformOrigin: '50% 0%', duration: d * 0.6, ease: 'power2.out', immediateRender: false }), d * 0.45);
    tl.add(fa(dec.slots[r], 1, 0, 0.2), d * 0.8);
    tl.add(dp[r - 1].setState('token', { d: 0.35 }), d * 0.6);
    tl.add(dp[r].glow({ tone: 'compute', hold: 0.15, d: 0.2 }), d);
    return tl;
  };
  S.add(drop(1), 'b3~chosen-0.35');
  // only then does row 2 light, under the mask (the grid at left is named: it is the rule every row obeys)
  S.add(dg.lightRow(1, { tone: 'struct', stagger: 0.1, d: 0.35 }), 'b3~Under-0.1');
  const CAPY = LG.cy + GH * LG.s / 2 + 40;
  const maskCap = S.text('the causal mask', { x: LG.cx, y: CAPY, size: 28, anchor: 'middle', color: 'muted', weight: 550 });
  S.add(fx.in(maskCap, { from: 'up', d: 0.55 }), 'b3~mask-0.15');
  S.add(bloom(lgGlow, { up: 0.25, hold: 0.2, down: 0.55, peak: 0.8 }), 'b3~mask-0.15');
  // "only looks back": row 2's lit cells glow, under columns 1 and 2
  const c10 = dg.cellAt(1, 0), c11 = dg.cellAt(1, 1);
  const backGlow = glowShape(`M${c10.x},${c10.y}h${c11.x + c11.w - c10.x}v${c10.h}h${-(c11.x + c11.w - c10.x)}z`, dec);
  S.add(bloom(backGlow, { up: 0.3, hold: 0.5, down: 0.6 }), 'b3~only looks-0.15');
  // "never changing those above": a padlock settles on row 1
  S.add(fx.in(dec.locks[0], { from: 'down', dist: 16, d: 0.5 }), 'b3~never-0.15');

  // ---------------------------------------------------------------- b4: Prefill in one shot; Decode row by row
  S.add(fx.xform(DH, { x: 0, y: 0, s: 1 }, { d: 1.05, ease: 'power3.inOut' }), 'b4-0.25');
  const pre = mini(PL, 'Prefill', S.main, false);
  const pg = pre.grid;
  S.add(pre.drawOn({ mask: 0.4 }), 'b4~Prefill-0.05');
  // "with every token present": all five pills at once
  S.add(gsap.timeline().add(pre.pills.map(p => p.pop({ d: 0.45 })), 0), 'b4~every-0.1');
  S.add(gsap.timeline().add(pre.pills.map(p => p.pulse({ scale: 1.12, d: 0.45 })), 0), 'b4~fills-0.1');
  // "in one shot": the whole triangle at once, every token computed in the same step
  const shot = gsap.timeline();
  for (let r = 0; r < 5; r++) shot.add(pg.lightRow(r, { tone: 'struct', stagger: 0, d: 0.22 }), 0);
  shot.add(bloom(pre.glow, { up: 0.15, hold: 0.25, down: 0.6 }), 0);
  shot.add(pre.pills.map(p => p.setState('prefill', { d: 0.25 })), 0);
  S.add(shot, 'b4~one-0.12');
  const tagY = MG.cy + (5 * MPy - MG.gap) / 2 + 58;
  const shotTag = S.pill('one shot', { x: pre.cx, y: tagY, h: 48, size: 28, tone: 'helps' });
  S.add(fx.in(shotTag, { from: 'up', d: 0.5 }), 'b4~shot+0.05');
  // "Decode adds a row at a time": rows 3, 4, 5 tick in, each chained to the one before, each locking the row above
  const tick = r => {
    const tl = gsap.timeline();
    tl.add(drop(r, { d: 0.36 }), 0);
    tl.add(dg.lightRow(r, { tone: 'struct', stagger: 0.03, d: 0.24 }), 0.32);
    tl.add(fx.in(dec.locks[r - 1], { from: 'down', dist: 12, d: 0.35, stagger: 0.03 }), 0.3);
    return tl;
  };
  S.add(tick(2), 'b4~Decode-0.2');
  S.add(tick(3), 'b4~row-0.25');
  S.add(tick(4), 'b4~time-0.3');
  const rowTag = S.pill('one row at a time', { x: dec.cx, y: tagY, h: 48, size: 28, tone: 'compute' }, DH);
  S.add(fx.in(rowTag, { from: 'up', d: 0.5 }), 'b4~row+0.05');

  // ---------------------------------------------------------------- b5: in the work, not the hardware
  S.add(fa([shotTag, rowTag], 1, 0, 0.4, 'power2.in'), 'b5+0.05');
  // "That chain": Decode's links brighten
  const linkEls = dec.links.flatMap(g => g.links);
  S.add(gsap.fromTo(linkEls, { attr: { stroke: S.tone('muted') } }, { attr: { stroke: S.tone('ink') }, duration: 0.4, ease: 'power1.inOut', immediateRender: false }), 'b5~chain-0.1');
  S.add(gsap.timeline().add(dec.links.map((g, i) => fx.pulse(g, { scale: 1.25, d: 0.45 })), 0), 'b5~chain-0.1');
  // "in the work itself": the mask's triangle pulses; a thin grey arrow runs from it to the chain
  S.add(bloom(lgGlow, { up: 0.3, hold: 0.35, down: 0.7 }), 'b5~work-0.15');
  const A0 = [LG.cx, CAPY + 30], A1 = [dec.px, dec.rowY(4) + PILL.h / 2 + 12];
  const arrowG = S.g();
  const aPath = S.path({ d: `M${A0[0]},${A0[1]} C${A0[0]},${A0[1] + 96} ${A1[0]},${A1[1] + 124} ${A1[0]},${A1[1]}`, stroke: 'muted', sw: 3 }, arrowG);
  const hs = 14;
  const aHead = S.path({ d: `M${A1[0] - hs * 0.65},${A1[1] + hs} L${A1[0]},${A1[1]} L${A1[0] + hs * 0.65},${A1[1] + hs}`, stroke: 'muted', sw: 3 }, arrowG);
  hide(aPath); hide(aHead);
  S.add(fa(aPath, 0, 1, 0.05), 'b5~work+0.05');
  S.add(gsap.fromTo(aPath, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.95, ease: 'power2.inOut', immediateRender: false }), 'b5~work+0.05');
  S.add(fx.pop(aHead, { from: 0.3, d: 0.3 }), 'b5~work+0.9');
  S.add(gsap.timeline().add(dec.links.map((g, i) => fx.pulse(g, { scale: 1.25, d: 0.4 })), 0), 'b5~work+1.0');
  // "not the hardware": an idle chip, beside Decode
  const chip = libChip(S, { x: 1676, y: 532, size: 116, state: 'idle', label: 'not the hardware', labelPos: 'below', labelSize: 28, labelTone: 'muted', labelGap: 16 });
  S.add(chip.drawOn({ d: 0.9 }), 'b5~not-0.2');
  // "This triangle is the whole reason": the arrow and the chip step back; both triangles pulse together
  S.add(gsap.fromTo([arrowG, chip], { opacity: 1 }, { opacity: 0.55, duration: 0.6, ease: 'power1.inOut', immediateRender: false }), 'b5~This-0.1');
  S.add(gsap.fromTo(linkEls, { attr: { stroke: S.tone('ink') } }, { attr: { stroke: S.tone('muted') }, duration: 0.6, ease: 'power1.inOut', immediateRender: false }), 'b5~This-0.1');
  S.add(bloom(pre.glow, { up: 0.3, hold: 0.45, down: 0.7 }), 'b5~whole-0.15');
  S.add(bloom(dec.glow, { up: 0.3, hold: 0.45, down: 0.7 }), 'b5~whole-0.15');
  const key = S.text('the triangle: why the phases differ', { x: (pre.l + dec.r) / 2, y: 872, size: 32, anchor: 'middle', color: 'muted', weight: 550 });
  S.add(fx.in(key, { from: 'up', d: 0.6 }), 'b5~whole+0.3');
});
