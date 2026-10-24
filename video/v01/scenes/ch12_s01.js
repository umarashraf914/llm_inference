/* ch12_s01 · the two numbers, counted from the shapes (fig 128)
   One two-row ledger: prefill on top, decode 400 px below, the same lanes on one shared scale
   (1,000 px = 290 trillion operations on the amber lanes, 146 GB on the coral lanes).
   b1  prefill: 2,000 tokens × 140 billion operations each = 280 trillion (+ attention ≈ 290 trillion)
   b2  the weights cross the bus once (140 GB, + 6 GB) → about 2,000 operations per byte
   b3  decode: one token, 140 billion operations (a hairline), the same 140 GB every time; the chip holds 0.1 GB
   b4  decode's fraction cancels to 1 op per byte: 2,000 against 1 */
V.scene('ch12_s01', S => {
  const { fx } = S;

  // ================================================================ layout (all in one place)
  const LX = 560, FULL = 1000, LEND = LX + FULL, TAGX = LEND + 15;      // lanes and end tags
  const OPS_FULL = 290e12, BYTES_FULL = 146e9;                          // what 1,000 px means
  const W280 = FULL * 280e12 / OPS_FULL;      // 965.5 px: 2,000 tokens × 140 billion
  const W140 = FULL * 140e9 / BYTES_FULL;     // 958.9 px: the weights, 140 GB
  const BH = 30;                              // bar thickness
  const row = dy => ({ dy, head: 160 + dy, opsL: 244 + dy, opsY: 262 + dy, bytesL: 334 + dy, bytesY: 352 + dy,
    sub: 408 + dy, pill: 466 + dy, num: 450 + dy, fbar: 468 + dy, den: 487 + dy });
  const P = row(0), D = row(400);             // prefill row, decode row
  const GRID = { x: 96, y: 196, cols: 40, rows: 50, px: 8, py: 6, w: 6, h: 4 };   // 2,000 pills, x 96–414, y 196–494
  const COLX = 255;                           // centre of the input column
  const STK = { x: 487, w: 64, h: 40, step: 5, n: 5 };   // the weight stacks, x 445–529
  const FX = 1200;                            // centre of the fraction slots
  const MIDP = P.opsY + 60, MIDD = D.opsY + 60;          // stack centres: between each row's two lanes

  // ================================================================ seek-safe drivers
  // Bars that grow in step with a particle train and tags that count or relabel are pure functions of
  // scene time, written by one clock tween that spans the scene (so any frame is the same however reached).
  const drivers = [];
  const drive = f => drivers.push(f);
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const prog = (t, a, b) => clamp01((t - a) / (b - a));
  const ease2 = p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  const ease3o = p => 1 - Math.pow(1 - p, 3);
  const at = spec => S.t(spec);
  /** A text whose content, fade and small flips are functions of time.
   *  spec: {in (entrance time), segs: [{at, text: string | p => string, d (for counting), flip}], out} */
  function program(el, spec) {
    drive(t => {
      let k = 0;
      spec.segs.forEach((s, i) => { if (t >= s.at) k = i; });
      const s = spec.segs[k];
      const p = s.d ? clamp01((t - s.at) / s.d) : 1;
      const txt = typeof s.text === 'function' ? s.text(t < s.at ? 0 : p) : s.text;
      if (el.textContent !== txt) el.textContent = txt;
      let a = 1, dy = 0;
      if (spec.in !== undefined) { const q = ease3o(prog(t, spec.in, spec.in + 0.45)); a = q; dy = (1 - q) * 16; }
      spec.segs.forEach((sg, i) => {
        if (!i || !sg.flip) return;
        if (t >= sg.at - 0.18 && t < sg.at) { const q = (sg.at - t) / 0.18; a = Math.min(a, q); dy = -(1 - q) * 10; }
        else if (t >= sg.at && t < sg.at + 0.2) { const q = (t - sg.at) / 0.2; a = Math.min(a, q); dy = (1 - q) * 10; }
      });
      if (spec.out !== undefined) a = Math.min(a, 1 - prog(t, spec.out, spec.out + 0.35));
      el.setAttribute('opacity', a.toFixed(3));
      el.setAttribute('transform', `translate(0,${dy.toFixed(2)})`);
    });
  }

  // ================================================================ layers (z-order)
  const leftG = S.g(), tracksG = S.g(), barsG = S.g(), flowG = S.g(), movG = S.g(), stackG = S.g(), labelG = S.g(), lensG = S.g();
  const hide = e => { e.style.opacity = 0; e.style.visibility = 'hidden'; };
  const label = (str, o, p) => S.text(str, { size: 24, weight: 550, color: 'muted', ...o }, p || labelG);

  // ================================================================ builders local to this scene
  /** A result pill: dark fill, tone outline, mixed-colour text. x = left edge, y = centre. */
  function resultPill(segs, x, y, tone) {
    const size = 26, h = 44, txt = segs.map(s => s.t).join('');
    const w = S.measure(txt, { size, weight: 600 }) + 48;
    const g = S.g(null, labelG);
    S.rect({ x, y: y - h / 2, w, h, r: h / 2, fill: '#0c1326' }, g);
    g.bg = S.rect({ x, y: y - h / 2, w, h, r: h / 2, stroke: tone, sw: 2.5, strokeOpacity: 0.95 }, g);
    g.label = S.text(segs, { x: x + w / 2, y: y + 1, size, weight: 600, anchor: 'middle' }, g);
    return Object.assign(g, { w, h, l: x, r: x + w, cx: x + w / 2, cy: y });
  }
  /** The empty outline where a result pill will land, holding a grey '? ops per byte'. */
  function placeholder(fin) {
    const g = S.g(null, labelG);
    g.bg = S.rect({ x: fin.l, y: fin.cy - 22, w: fin.w, h: 44, r: 22, stroke: 'muted', sw: 2, strokeOpacity: 0.65 }, g);
    g.label = S.text('? ops per byte', { x: fin.cx, y: fin.cy + 1, size: 26, weight: 600, anchor: 'middle', color: 'muted' }, g);
    return g;
  }
  /** A small stack of five blue weight tiles (the weights in the memory beside the chip), centred at (STK.x, cy). */
  function weightStack(cy) {
    const g = S.g(null, stackG);
    const tw = STK.w + STK.step * (STK.n - 1), th = STK.h + STK.step * (STK.n - 1);
    const x0 = STK.x - tw / 2, y0 = cy - th / 2;
    g.tiles = [];
    for (let i = STK.n - 1; i >= 0; i--) {                 // back to front; tile 0 is the front one
      const tx = x0 + i * STK.step, ty = y0 + (STK.n - 1 - i) * STK.step;
      const tg = S.g(null, g);
      S.rect({ x: tx, y: ty, w: STK.w, h: STK.h, r: 6, fill: '#0c1326' }, tg);
      S.rect({ x: tx, y: ty, w: STK.w, h: STK.h, r: 6, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.65, sw: 1.5 }, tg);
      let d = '';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) d += `M${tx + 6 + c * 9},${ty + 7 + r * 9.5}h6v6h-6z`;
      S.path({ d, fill: 'struct', fillOpacity: 0.34 }, tg);
      tg.flash = S.rect({ x: tx, y: ty, w: STK.w, h: STK.h, r: 6, fill: 'compute', fillOpacity: 0.5, stroke: 'compute', sw: 2 }, tg);
      tg.flash.style.opacity = 0;
      g.tiles[i] = tg;
    }
    g.label = label('weights', { x: STK.x, y: y0 + th + 22, anchor: 'middle' }, g);
    return Object.assign(g, { l: x0, r: x0 + tw, t: y0, b: y0 + th, cy });
  }
  /** Tiles flash amber one after another, front to back. */
  const flashTiles = (stk, each = 0.11, d = 0.34) => {
    const tl = gsap.timeline();
    stk.tiles.forEach((tg, i) => tl.fromTo(tg.flash, { opacity: 0 }, { opacity: 1, duration: d / 2, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }, i * each));
    return tl;
  };
  /** A lane: a faint full-scale track. */
  const track = y => {
    const r = S.rect({ x: LX, y, w: FULL, h: BH, r: 6, fill: '#ffffff', fillOpacity: 0.035, stroke: '#ffffff', strokeOpacity: 0.10, sw: 1 }, tracksG);
    hide(r);
    return r;
  };
  /** A bar on a lane, width driven later. */
  const bar = (y, tone, parent = barsG) => S.rect({ x: LX, y, w: 0.001, h: BH, r: 6, fill: `url(#solid-${tone})` }, parent);
  /** A heading written on: the phase name in white, the rest in grey. */
  function heading(name, rest, y) {
    const a = S.text(name, { x: 96, y, size: 34, weight: 700, color: 'ink' }, labelG);
    const b = S.text(rest, { x: 96 + S.measure(name, { size: 34, weight: 700 }) + 12, y, size: 34, weight: 500, color: 'muted' }, labelG);
    return { a, b, els: [a, b] };
  }
  const typeOn = (h, d = 0.9) => {
    const tl = gsap.timeline(), n1 = h.a.__plain.length, n2 = h.b.__plain.length;
    tl.add(fx.type(h.a, { d: d * n1 / (n1 + n2) }), 0);
    tl.add(fx.type(h.b, { d: d * n2 / (n1 + n2) }), d * n1 / (n1 + n2));
    return tl;
  };
  /** A particle train: `n` bytes leave a stack and run along a lane (the same bus speed in both rows). */
  const SPEED = 520, EVERY = 0.03, TRAIN = 10;
  function train(t0, cy, laneY, parent = flowG) {
    const d = `M${STK.x + 12},${cy + 12} C${STK.x + 45},${cy + 12} ${LX - 18},${laneY} ${LX + 12},${laneY} L${LX + W140},${laneY}`;
    const f = S.flow({ d, from: t0, to: t0 + TRAIN * EVERY, speed: SPEED, every: EVERY, size: 5, color: '#ffc2c2', tone: 'bytes' }, parent);
    f.setAttribute('data-audit', 'ignore');
    const L = f.path.getTotalLength();
    return { f, L, t0, te: t0 + TRAIN * EVERY, x: s => (s <= 0 ? -1e9 : f.path.getPointAtLength(Math.min(L, s)).x) };
  }

  // ================================================================ b1 · the placeholders: "operations per byte, phase by phase"
  const finP = resultPill([{ t: '= about ', c: 'muted' }, { t: '2,000', c: 'compute', w: 700 }, { t: ' ops per byte', c: 'ink' }], LX, P.pill, 'compute');
  const finD = resultPill([{ t: '= about ', c: 'muted' }, { t: '1', c: 'bytes', w: 700 }, { t: ' op per byte', c: 'ink' }], LX, D.pill, 'bytes');
  const phP = placeholder(finP), phD = placeholder(finD);
  [phP, phD].forEach((ph, i) => {
    S.add(fx.draw(ph.bg, { d: 0.8, ease: 'power2.inOut' }), 'b1~Operations-0.15' + (i ? '+0.2' : ''));
    S.add(fx.in(ph.label, { from: 'fade', d: 0.5 }), `b1~Operations+${0.35 + i * 0.2}`);
  });
  S.add(fx.pulse(phP, { scale: 1.07, d: 0.45 }), 'b1~phase-0.05');
  S.add(fx.pulse(phD, { scale: 1.07, d: 0.45 }), 'b1~phase#2-0.05');
  S.add(fx.dim([phP, phD], { to: 0.4, d: 0.5 }), 'b1~phase#2+0.45');

  // ================================================================ b1 · prefill: 2,000 tokens, 140 billion operations each
  const headP = heading('Prefill', '· 70B model · 2,000-token prompt', P.head);
  S.add(typeOn(headP, 0.95), 'b1~Prefill-0.1');

  // the prompt: 2,000 pills, 40 × 50, one <path> per row so it can fill row by row
  const gridG = S.g(null, leftG);
  const gridRows = [];
  for (let r = 0; r < GRID.rows; r++) {
    let d = '';
    for (let c = 0; c < GRID.cols; c++) d += `M${GRID.x + c * GRID.px},${GRID.y + r * GRID.py}h${GRID.w}v${GRID.h}h${-GRID.w}z`;
    gridRows.push(S.path({ d, fill: 'struct', fillOpacity: 0.9 }, gridG));
  }
  const gridTag = label('2,000 tokens', { x: COLX, y: GRID.y + GRID.rows * GRID.py + 22, anchor: 'middle' });
  S.add(gsap.fromTo(gridRows, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18, stagger: 0.019, ease: 'power1.out' }), 'b1~two-0.1');
  S.add(fx.in(gridTag, { from: 'up', d: 0.5 }), 'b1~tokens-0.1');

  // the weights beside the chip
  const stkP = weightStack(MIDP);
  S.add(fx.in(stkP, { from: 'fade', d: 0.5 }), 'b1~tokens+0.15');

  // one pill lifts out, passes through the weights (each tile flashes amber) and leaves as arithmetic
  const cell = { x: GRID.x + 39 * GRID.px + GRID.w / 2, y: GRID.y + 21 * GRID.py + GRID.h / 2 };
  const pillP = libToken(S, { text: '', x: cell.x, y: cell.y, w: 30, h: 16, hidden: true }, movG);
  S.add(pillP.pop({ from: 0.2, d: 0.45 }), 'b1~at-0.1');
  S.add(pillP.travel(`M${cell.x},${cell.y} C${cell.x + 30},${cell.y - 14} ${STK.x - 40},${MIDP} ${STK.x},${MIDP}`, { d: 0.6, ease: 'power2.in' }), 'b1~hundred-0.05');
  S.add(flashTiles(stkP), 'b1~hundred+0.45');
  S.add(pillP.setState('prefill', { d: 0.2 }), 'b1~hundred+0.6');
  S.add(pillP.travel(`M${STK.x},${MIDP} C${STK.x + 40},${MIDP} ${LX - 30},${P.opsY + BH / 2} ${LX + 16},${P.opsY + BH / 2}`, { d: 0.55, ease: 'power2.out' }), 'b1~hundred+0.95');
  S.add(pillP.out({ d: 0.3 }), 'b1~operations#2+0.05');
  const sparkP = S.circle({ x: LX + 16, y: P.opsY + BH / 2, r: 16, fill: 'url(#pglow-compute)' }, movG);
  S.add(gsap.fromTo(sparkP, { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1.6, duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.out', transformOrigin: '50% 50%' }), 'b1~operations#2+0.05');

  // the equation, one line: '2 × 70 billion = 140 billion ops per token', then '140 billion × 2,000 = 280 trillion'
  const EQ = { y: 208, size: 28, gap: 11 };
  const eqG = S.g(null, labelG);
  const eqText = (t, x, color) => S.text(t, { x, y: EQ.y, size: EQ.size, weight: 600, color }, eqG);
  const ew = t => S.measure(t, { size: EQ.size, weight: 600 });
  let ex = LX;
  const a1 = eqText('2 × 70 billion', ex, 'compute'); ex += ew('2 × 70 billion') + EQ.gap;
  const a2 = eqText('=', ex, 'muted'); ex += ew('=') + EQ.gap;
  const a3x = ex;
  const a3 = eqText('140 billion', ex, 'compute'); ex += ew('140 billion') + EQ.gap;
  const a4 = eqText('ops per token', ex, 'compute');
  ex = LX + ew('140 billion') + EQ.gap;
  const b1 = eqText('×', ex, 'muted'); ex += ew('×') + EQ.gap;
  const b2 = eqText('2,000', ex, 'struct'); ex += ew('2,000') + EQ.gap;
  const b3 = eqText('=', ex, 'muted'); ex += ew('=') + EQ.gap;
  const b4 = eqText('280 trillion', ex, 'compute');
  S.add(fx.in(a1, { from: 'up', d: 0.5 }), 'b1~hundred-0.15');
  S.add(fx.in([a2, a3], { from: 'up', d: 0.5, stagger: 0.1 }), 'b1~forty-0.15');
  S.add(fx.in(a4, { from: 'up', d: 0.5 }), 'b1~operations#2-0.15');
  // the morph: '140 billion' slides to the front, the rest leaves, the new terms land
  S.add(fx.out([a1, a2, a4], { to: 'up', d: 0.3, dist: 12 }), 'b1~two#2-0.2');
  S.add(gsap.fromTo(a3, { x: 0 }, { x: LX - a3x, duration: 0.55, ease: 'power3.inOut', immediateRender: false }), 'b1~two#2+0.05');
  S.add(fx.in([b1, b2], { from: 'left', d: 0.45, dist: 16, stagger: 0.08 }), 'b1~two#2+0.45');
  S.add(fx.in([b3, b4], { from: 'left', d: 0.45, dist: 16, stagger: 0.08 }), 'b1~eighty-0.25');

  // ================================================================ b1 · 280 trillion on the operations lane
  const trkPo = track(P.opsY), trkPb = track(P.bytesY), trkDo = track(D.opsY), trkDb = track(D.bytesY);
  const lblPo = label('operations', { x: LX, y: P.opsL }), lblPb = label('bytes moved', { x: LX, y: P.bytesL });
  const lblDo = label('operations', { x: LX, y: D.opsL }), lblDb = label('bytes moved', { x: LX, y: D.bytesL });
  S.add(fx.type(lblPo, { d: 0.45 }), 'b1~two#2');
  S.add(fx.in(trkPo, { from: 'fade', d: 0.4 }), 'b1~two#2');
  // the whole prompt pulses (a wave of amber down the rows) and a wave runs through the weights
  S.add(gsap.fromTo(gridRows, { attr: { fill: S.tone('struct') } }, { attr: { fill: S.tone('compute') }, duration: 0.22, yoyo: true, repeat: 1, stagger: 0.008, ease: 'sine.inOut', immediateRender: false }), 'b1~two#2-0.1');
  S.add(flashTiles(stkP, 0.06, 0.26), 'b1~two#2+0.3');
  const opsP = bar(P.opsY, 'compute');
  const sweep = [at('b1~two#2') + 0.35, at('b1~trillion') + 0.15];
  drive(t => opsP.setAttribute('width', Math.max(0.001, W280 * ease2(prog(t, sweep[0], sweep[1]))).toFixed(2)));
  const tagPo = S.text('', { x: TAGX, y: P.opsY + BH / 2, size: 26, weight: 600, color: 'compute', tnum: true }, labelG);
  const tagPoW = S.g(null, labelG); tagPoW.appendChild(tagPo);
  program(tagPo, { in: sweep[0], segs: [
    { at: sweep[0], d: sweep[1] - sweep[0], text: p => `${Math.round(280 * ease2(p))} trillion` },
    { at: at('b1~ninety') - 0.1, text: 'about 290 trillion', flip: true },
  ] });

  // attention: a lighter segment of 34 px clicks onto the end (its true share is 2–4%, so it is schematic)
  const attn = S.rect({ x: LX + W280 + 2, y: P.opsY, w: FULL - W280 - 2, h: BH, r: 5, fill: 'compute', fillOpacity: 0.42, stroke: 'compute', strokeOpacity: 0.9, sw: 1.5 }, barsG);
  S.add(gsap.fromTo(attn, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.35, ease: 'back.out(2.5)' }), 'b1~adds-0.15');
  const attnTag = label('attention: a few %, schematic', { x: LEND, y: P.opsY + BH + 24, anchor: 'end' });
  S.add(fx.in(attnTag, { from: 'up', d: 0.45, dist: 12 }), 'b1~few-0.1');

  // ================================================================ b2 · the weights cross the bus once
  S.add(fx.dim([eqG, attnTag], { to: 0.4, d: 0.5 }), 'b2-0.1');
  S.add(fx.type(lblPb, { d: 0.5 }), 'b2~cross-0.25');
  S.add(fx.in(trkPb, { from: 'fade', d: 0.4 }), 'b2~cross-0.25');
  const trP = train(at('b2~cross') - 0.05, MIDP, P.bytesY + BH / 2);
  const bytesP = bar(P.bytesY, 'bytes');
  const wTrail = (tr, t) => Math.max(0.001, Math.min(W140, tr.x((t - tr.te) * SPEED) - LX));
  drive(t => bytesP.setAttribute('width', wTrail(trP, t).toFixed(2)));
  const tagPb = S.text('', { x: TAGX, y: P.bytesY + BH / 2, size: 26, weight: 600, color: 'bytes', tnum: true }, labelG);
  const tagPbW = S.g(null, labelG); tagPbW.appendChild(tagPb);
  const growP = [trP.te + 12 / SPEED, trP.te + (trP.L - 10) / SPEED];
  program(tagPb, { in: growP[0], segs: [
    { at: growP[0], text: () => `${Math.round(140 * wTrail(trP, Math.max(growP[0], Math.min(growP[1] + 0.2, curT))) / W140)} GB` },
    { at: at('b2~six') + 0.05, text: 'about 146 GB', flip: true },
  ] });
  // the extra 6 GB: one hatched block, schematic (activations and cache writes, not split)
  const defs = S.el('defs', null, S.main);
  const pat = S.el('pattern', { id: 'ch12-hatch', width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  S.rect({ x: 0, y: 0, w: 2.6, h: 7, fill: 'bytes', fillOpacity: 0.9 }, pat);
  const blockG = S.g(null, barsG);
  S.rect({ x: LX + W140 + 2, y: P.bytesY, w: FULL - W140 - 2, h: BH, r: 5, fill: 'bytes', fillOpacity: 0.16 }, blockG);
  S.rect({ x: LX + W140 + 2, y: P.bytesY, w: FULL - W140 - 2, h: BH, r: 5, fill: 'url(#ch12-hatch)', stroke: 'bytes', strokeOpacity: 0.95, sw: 1.5 }, blockG);
  S.add(gsap.fromTo(blockG, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.35, ease: 'back.out(2.5)' }), 'b2~six-0.12');
  const subP = label('weights, plus activations and cache writes', { x: LEND, y: P.sub, anchor: 'end' });
  S.add(fx.type(subP, { d: 1.1 }), 'b2~activations-0.1');

  // ---------------------------------------------------------------- the prefill fraction, then its result
  const fracP = S.g(null, labelG);
  const w290 = S.measure('about 290 trillion', { size: 26, weight: 600 }), w146 = S.measure('about 146 GB', { size: 26, weight: 600 });
  const numP = S.text('about 290 trillion', { x: FX, y: P.num, size: 26, weight: 600, color: 'compute', anchor: 'middle', tnum: true }, fracP);
  const denP = S.text('about 146 billion bytes', { x: FX, y: P.den, size: 26, weight: 600, color: 'bytes', anchor: 'middle', tnum: true }, fracP);
  const denPc = S.text('about 146 GB', { x: FX, y: P.den, size: 26, weight: 600, color: 'bytes', anchor: 'middle', tnum: true }, fracP);
  const fbarP = S.line({ x1: FX - 160, y1: P.fbar, x2: FX + 160, y2: P.fbar, stroke: 'ink', sw: 2.5, strokeOpacity: 0.8 }, fracP);
  [numP, denP, denPc, fbarP].forEach(hide);
  const fly = at('b2~record') + 0.3;
  S.add(fx.dim(subP, { to: 0.4, d: 0.4 }), fly - 0.2);
  S.add(gsap.fromTo(numP, { autoAlpha: 1, x: TAGX + w290 / 2 - FX, y: P.opsY + BH / 2 - P.num }, { autoAlpha: 1, x: 0, y: 0, duration: 0.6, ease: 'power2.inOut' }), fly);
  S.add(gsap.fromTo(denPc, { autoAlpha: 1, x: TAGX + w146 / 2 - FX, y: P.bytesY + BH / 2 - P.den }, { autoAlpha: 1, x: 0, y: 0, duration: 0.6, ease: 'power2.inOut' }), fly + 0.12);
  S.add(gsap.to(denPc, { autoAlpha: 0, duration: 0.2 }), fly + 0.62);
  S.add(fx.in(denP, { from: 'fade', d: 0.25 }), fly + 0.62);
  S.add(fx.draw(fbarP, { d: 0.35 }), fly + 0.35);
  // the fraction collapses leftward into the pill, which replaces its placeholder
  const col = fly + 1.0;
  S.add(fx.xform(fracP, { x: finP.cx - FX, y: finP.cy - P.fbar, s: 0.3, ox: FX, oy: P.fbar }, { d: 0.45, ease: 'power2.in' }), col);
  S.add(gsap.to(fracP, { opacity: 0, duration: 0.3, ease: 'power1.in' }), col + 0.1);
  S.add(fx.out(phP, { d: 0.15 }), col + 0.25);
  S.add(fx.pop(finP, { from: 0.8, d: 0.5 }), col + 0.32);

  // ================================================================ b3 · decode: one token, the same lanes
  S.add(fx.dim([gridG, gridTag, stkP, lblPo, lblPb], { to: 0.4, d: 0.5 }), 'b3-0.2');
  S.add(fx.out(subP, { d: 0.4 }), 'b3-0.2');
  const headD = heading('Decode', '· one token · batch size one', D.head);
  S.add(typeOn(headD, 0.85), 'b3~Decode-0.1');
  S.add(fx.type(lblDo, { d: 0.45 }), 'b3~Decode+0.3');
  S.add(fx.in(trkDo, { from: 'fade', d: 0.4 }), 'b3~Decode+0.3');
  S.add(fx.type(lblDb, { d: 0.5 }), 'b3~Decode+0.55');
  S.add(fx.in(trkDb, { from: 'fade', d: 0.4 }), 'b3~Decode+0.55');
  const pillD = libToken(S, { text: '', x: COLX, y: MIDD, w: 44, h: 24, hidden: true }, leftG);
  S.add(pillD.in({ from: 'down', d: 0.55, dist: 40 }), 'b3~one-0.1');
  const stkD = weightStack(MIDD);
  S.add(fx.in(stkD, { from: 'fade', d: 0.5 }), 'b3~next-0.1');
  // a copy of the token runs through the weights and comes out as 140 billion operations
  const runD = libToken(S, { text: '', x: COLX, y: MIDD, w: 44, h: 24, hidden: true }, movG);
  S.add(gsap.set(runD, { autoAlpha: 1 }), 'b3~token');
  S.add(runD.travel(`M${COLX},${MIDD} C${COLX + 80},${MIDD} ${STK.x - 80},${MIDD} ${STK.x},${MIDD}`, { d: 0.55, ease: 'power2.in' }), 'b3~token');
  S.add(flashTiles(stkD), 'b3~token+0.5');
  S.add(runD.setState('prefill', { d: 0.2 }), 'b3~token+0.65');
  S.add(runD.travel(`M${STK.x},${MIDD} C${STK.x + 40},${MIDD} ${LX - 30},${D.opsY + BH / 2} ${LX + 16},${D.opsY + BH / 2}`, { d: 0.5, ease: 'power2.out' }), 'b3~hundred-0.15');
  S.add(runD.out({ d: 0.25 }), 'b3~hundred+0.3');
  const sparkD = S.circle({ x: LX + 16, y: D.opsY + BH / 2, r: 16, fill: 'url(#pglow-compute)' }, movG);
  S.add(gsap.fromTo(sparkD, { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1.6, duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.out', transformOrigin: '50% 50%' }), 'b3~hundred+0.3');
  // the operations bar, to scale: 140 billion of 290 trillion is 0.48 px, so a magnifier shows it
  const sc = libScaleCompare(S, { x: LX, y: D.opsY, w: FULL, h: BH, max: OPS_FULL, hairline: 0, items: [{ value: 140e9, tone: 'compute' }] }, barsG);
  S.add(sc.in({ d: 0.25 }), 'b3~hundred+0.4');
  const lens = sc.magnify({ i: 0, x: 780, y: D.opsY + BH / 2, r: 50, ring: 18, tag: false, parent: lensG });
  S.add(lens.open({ d: 0.95 }), 'b3~and-0.1');
  const tagDo = label('about 140 billion', { x: 845, y: D.opsY + 2, size: 26, weight: 600, color: 'compute' });
  const scaleTag = label('drawn to scale: 1/2,000 of the bar above', { x: 845, y: D.opsY + 34 });
  S.add(fx.in(tagDo, { from: 'left', d: 0.5, dist: 16 }), 'b3~billion-0.2');
  S.add(fx.in(scaleTag, { from: 'up', d: 0.5, dist: 12 }), 'b3~operations-0.1');

  // the same 140 GB: one pass grows the bar under the prefill weights; then twice more, every time
  const t1 = at('b3~on') - 0.3;
  const trD = [train(t1, MIDD, D.bytesY + BH / 2), train(at('b3~every') - 0.15, MIDD, D.bytesY + BH / 2), train(at('b3~every') + 0.7, MIDD, D.bytesY + BH / 2)];
  const bytesD = bar(D.bytesY, 'bytes');
  drive(t => bytesD.setAttribute('width', wTrail(trD[0], t).toFixed(2)));
  const tagDb = S.text('', { x: TAGX, y: D.bytesY + BH / 2, size: 26, weight: 600, color: 'bytes', tnum: true }, labelG);
  const growD = [trD[0].te + 12 / SPEED, trD[0].te + (trD[0].L - 10) / SPEED];
  program(tagDb, { in: growD[0], segs: [
    { at: growD[0], text: () => `${Math.round(140 * wTrail(trD[0], Math.max(growD[0], Math.min(growD[1] + 0.2, curT))) / W140)} GB` },
  ] });
  // each later pass sweeps a bright band along the full bar
  const sheen = S.rect({ x: LX, y: D.bytesY, w: 1, h: BH, r: 4, fill: '#ffffff', fillOpacity: 0.3 }, barsG);
  sheen.setAttribute('data-audit', 'ignore');
  drive(t => {
    let on = false;
    for (const tr of trD.slice(1)) {
      const head = tr.x((t - tr.t0) * SPEED), tail = tr.x((t - tr.te) * SPEED);
      const x0 = Math.max(LX, tail < 0 ? LX : tail - 40), x1 = Math.min(LX + W140, head + 6);
      if ((t - tr.t0) * SPEED > 0 && (t - tr.te) * SPEED < tr.L && x1 > x0) {
        sheen.setAttribute('x', x0.toFixed(1)); sheen.setAttribute('width', (x1 - x0).toFixed(1)); on = true;
      }
    }
    sheen.setAttribute('opacity', on ? 1 : 0);
  });
  // a thin white guide: the decode bar ends exactly under the prefill weights segment
  const guide = S.line({ x1: LX + W140, y1: D.bytesY - 4, x2: LX + W140, y2: P.bytesY + BH + 4, stroke: 'ink', sw: 1.5, strokeOpacity: 0.6 }, tracksG);
  S.add(fx.draw(guide, { d: 0.6, ease: 'power2.out' }), growD[1] + 0.1);
  const subD = label('the same weights, every time', { x: LEND, y: D.sub, anchor: 'end' });
  S.add(fx.type(subD, { d: 0.8 }), 'b3~every+0.1');

  // the chip itself holds about a tenth of a gigabyte (beside the stack that stands for 140 GB)
  const chip = libChip(S, { x: 335, y: MIDD + 76, size: 40, style: 'outline', tone: 'compute' }, labelG);
  const chipTag = label('chip holds ≈ 0.1 GB', { x: 335, y: MIDD + 124, anchor: 'middle' });
  S.add(chip.drawOn({ d: 0.6 }), 'b3~chip-0.1');
  S.add(fx.in(chipTag, { from: 'up', d: 0.5, dist: 12 }), 'b3~tenth-0.25');
  S.add(fx.out([chip, chipTag], { d: 0.4 }), 'b3>-0.1');

  // ================================================================ b4 · decode's fraction: 1 op per byte
  // clear the stage down to the headings, the bars with their end tags and the result pills
  const gone = [gridG, gridTag, stkP, stkD, pillD, lblPo, lblPb, lblDo, lblDb, subD, eqG, attnTag, scaleTag];
  S.add(fx.out(gone, { d: 0.45, stagger: 0.02 }), 'b4-0.25');
  S.add(lens.close({ d: 0.6 }), 'b4-0.25');
  S.add(gsap.fromTo(tagDo, { x: 0, y: 0 }, { x: LX + 18 - 845, y: BH / 2 - 2, duration: 0.6, ease: 'power3.inOut', immediateRender: false }), 'b4+0.15');

  const fracD = S.g(null, labelG);
  const numD = S.equation([{ t: '2', tone: 'compute' }, { t: '×', tone: 'muted' }, { t: '70 billion', tone: 'compute' }], { x: FX, y: D.num, size: 26 }, fracD);
  const denD = S.equation([{ t: '70 billion', tone: 'bytes' }, { t: '×', tone: 'muted' }, { t: '2', tone: 'bytes' }, { t: 'bytes', tone: 'bytes' }], { x: FX, y: D.den, size: 26 }, fracD);
  const fbarD = S.line({ x1: FX - 140, y1: D.fbar, x2: FX + 140, y2: D.fbar, stroke: 'ink', sw: 2.5, strokeOpacity: 0.8 }, fracD);
  hide(fbarD);
  S.add(fx.in(numD.parts, { from: 'down', d: 0.45, dist: 14, stagger: 0.06 }), 'b4~both-0.1');
  S.add(fx.draw(fbarD, { d: 0.3 }), 'b4~both+0.1');
  S.add(fx.in(denD.parts, { from: 'up', d: 0.45, dist: 14, stagger: 0.06 }), 'b4~both+0.15');
  // cancel: the two 2s, then the two 70 billions (a slash through each, and the cancelled terms grey out)
  const slash = (eqG_, part) => {
    const ln = S.line({ x1: part.l - 5, y1: D.num + 0, x2: part.r + 5, y2: D.num, stroke: 'ink', sw: 3 }, eqG_);
    const y = +part.getAttribute('y');
    ln.setAttribute('y1', y + 13); ln.setAttribute('y2', y - 13);
    ln.__strike = true;
    hide(ln);
    return ln;
  };
  const cancel = (pairs, when) => pairs.forEach(([eg, part], i) => {
    const ln = slash(eg, part);
    S.add(fx.draw(ln, { d: 0.25, ease: 'power2.out' }), `${when}+${i * 0.1}`);
    S.add(gsap.to(part, { opacity: 0.4, duration: 0.3 }), `${when}+${i * 0.1 + 0.15}`);
  });
  cancel([[numD, numD.parts[0]], [denD, denD.parts[2]]], 'b4~shapes-0.15');
  cancel([[numD, numD.parts[2]], [denD, denD.parts[0]]], 'b4~alone-0.2');
  const colD = at('b4~alone') + 0.25;
  S.add(fx.xform(fracD, { x: finD.cx - FX, y: finD.cy - D.fbar, s: 0.3, ox: FX, oy: D.fbar }, { d: 0.42, ease: 'power2.in' }), colD);
  S.add(gsap.to(fracD, { opacity: 0, duration: 0.28, ease: 'power1.in' }), colD + 0.08);
  S.add(fx.out(phD, { d: 0.15 }), colD + 0.22);
  S.add(fx.pop(finD, { from: 0.8, d: 0.5 }), colD + 0.28);

  // two thousand against one
  S.add(fx.pulse([finP, finD], { scale: 1.07, d: 0.5 }), 'b4~two+0.1');
  const take = S.takeaway('Same model, same chip: 2,000 against 1', { tone: 'ink' });
  S.add(fx.in(take, { from: 'up', d: 0.6 }), 'b4~against-0.25');

  // one operation from each identical byte: the decode bar becomes a row of bytes, each with one amber dot
  const NB = 48, pitch = W140 / NB;
  const blocksG = S.g(null, barsG), dotsG = S.g(null, barsG);
  const blocks = [], dots = [];
  for (let k = 0; k < NB; k++) {
    blocks.push(S.rect({ x: LX + k * pitch + 1, y: D.bytesY, w: pitch - 4, h: BH, r: 3, fill: 'url(#solid-bytes)' }, blocksG));
    dots.push(S.circle({ x: LX + k * pitch + 1 + (pitch - 4) / 2, y: D.bytesY - 10, r: 4, fill: 'compute' }, dotsG));
  }
  S.add(gsap.to(bytesD, { opacity: 0.22, duration: 0.6 }), 'b4~Decode-0.1');
  S.add(gsap.fromTo(blocks, { autoAlpha: 0, scaleY: 0.4, transformOrigin: '50% 50%' }, { autoAlpha: 1, scaleY: 1, duration: 0.3, stagger: 0.014, ease: 'power2.out' }), 'b4~Decode-0.1');
  S.add(gsap.fromTo(dots, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.014, ease: 'back.out(2)' }), 'b4~one#2-0.15');
  // identical bytes: the guide pulses and both 140 GB segments flash together
  S.add(gsap.fromTo(guide, { attr: { 'stroke-width': 1.5, 'stroke-opacity': 0.6 } }, { attr: { 'stroke-width': 3.5, 'stroke-opacity': 1 }, duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), 'b4~each-0.1');
  const flashP = S.rect({ x: LX, y: P.bytesY, w: W140, h: BH, r: 6, fill: '#ffffff', fillOpacity: 0.3 }, barsG);
  const flashD = S.rect({ x: LX, y: D.bytesY, w: W140, h: BH, r: 6, fill: '#ffffff', fillOpacity: 0.3 }, barsG);
  [flashP, flashD].forEach(f => { f.setAttribute('data-audit', 'ignore'); hide(f); });
  S.add(gsap.fromTo([flashP, flashD], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' }), 'b4~identical-0.1');

  // ================================================================ the clock that runs every driver
  let curT = 0;
  const clock = { t: 0 };
  S.tl.fromTo(clock, { t: 0 }, { t: S.duration, duration: S.duration, ease: 'none', immediateRender: true,
    onUpdate: () => { curT = clock.t; drivers.forEach(f => f(clock.t)); } }, 0);
  drivers.forEach(f => f(0));
});
