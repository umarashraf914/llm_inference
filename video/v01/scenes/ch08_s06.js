/* ch08_s06 · the tempting picture, and what actually happens (figs 97, 98)
   b1  'One natural picture: computed once, carried upward': a dashed grey chain, embedding → W_Q W_K W_V
       → Q K V, which then float up unchanged through dashed slabs 'layer 2'-'layer 5'.
   b2  two grey ticks ('weights fixed after training', 'embedding looked up once'), 'a reasonable reading',
       a '?' over the slabs.
   b3  the picture is struck and shrinks to the left edge ('tempting, but wrong'; teal 'why: explains the
       cache formula'); 'Each layer owns its own three matrices': four rows of three tiles, each its own
       texture; they compress to 80 rows, counter 4 → 80; every tile shimmers.
   b4  one token climbs the stack, an amber flash at every row, 'multiplies per token' 1 → 80; 'not shared,
       not reused'; the camera dives to layers 39 and 40: their W_K tiles side by side, '≠'.
   Layout: left picture centred x 480 (in b1-b2 moved right to the centre); right stack x 940-1640,
   y 290-900 (80 rows, 7.6 px pitch). */
V.scene('ch08_s06', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = n => gsap.parseEase(n);
  const clock = (a, b, fn) => S.add(ch08Drive(b - a, k => fn(a + k * (b - a))), a);
  const fade = (els, a, b, at, d = 0.45) => S.add(ch08Fade(els, a, b, { d }), at);

  // ================================================================ b1: the tempting picture (dashed, grey)
  // the picture, its heading centred over it, is alone in b1-b2: `left` holds it centred (L1, then L2 once the
  // ticks come in on its right), and returns to its place (0) as it is struck and shrinks aside in b3
  const left = S.g(), L1 = 425, L2 = 300;
  S.set(left, { x: L1 }, 0);
  const LX = 480;
  const hdr1 = S.text('One natural picture:', { x: LX, y: 100, size: 40, weight: 700, family: 'display', anchor: 'middle', color: 'ink' }, left);
  const hdr2 = S.text('computed once, carried upward', { x: LX, y: 146, size: 32, weight: 600, anchor: 'middle', color: 'muted' }, left);
  const dbox = (x, y, w, h, label, size = 28) => {
    const g = S.g(null, left);
    S.rect({ x: x - w / 2, y: y - h / 2, w, h, r: 12, stroke: 'muted', sw: 2.5, dash: '8 7' }, g);
    if (label) S.text(label, { x, y: y + 1, size, weight: 600, anchor: 'middle', color: 'muted' }, g);
    return g;
  };
  const emb = dbox(LX, 920, 260, 60, 'embedding');
  const wts = [-1, 0, 1].map(k => { const g = dbox(LX + k * 130, 780, 110, 80, null); ch08W(S, ['Q', 'K', 'V'][k + 1], { x: LX + k * 130, y: 774, size: 36, color: 'muted' }, g); return g; });
  const ar1 = S.arrow({ x1: LX, y1: 886, x2: LX, y2: 826, color: 'muted', sw: 2.5, head: 11, dash: '6 5' }, left);
  const ar2 = S.arrow({ x1: LX, y1: 736, x2: LX, y2: 690, color: 'muted', sw: 2.5, head: 11, dash: '6 5' }, left);
  const PY0 = 660;
  const pills = ['Q', 'K', 'V'].map((n, k) => { const g = S.g(null, left); S.rect({ x: LX + (k - 1) * 90 - 32, y: PY0 - 22, w: 64, h: 44, r: 12, stroke: 'muted', sw: 2.5, dash: '6 5', fill: '#101828' }, g); S.text(n, { x: LX + (k - 1) * 90, y: PY0 + 1, size: 28, weight: 700, anchor: 'middle', color: 'muted' }, g); return g; });
  const slabs = [2, 3, 4, 5].map((n, i) => dbox(LX, 560 - i * 90, 420, 52, null));
  const slabLbl = [2, 3, 4, 5].map((n, i) => S.text(`layer ${n}`, { x: LX + 230, y: 561 - i * 90, size: 24, weight: 550, color: 'faint' }, left));
  ch08Hide([hdr1, hdr2, emb, ...wts, ar1, ar2, ...pills, ...slabs, ...slabLbl]);
  fade([hdr1, hdr2], 0, 1, 0.8, 0.6);
  fade(emb, 0, 1, T('b1~embedding') - 0.15, 0.4);
  fade(ar1, 0, 1, T('b1~by') - 0.1, 0.3);
  [T('b1~W'), T('b1~W#2'), T('b1~W#3')].forEach((t, i) => fade(wts[i], 0, 1, t - 0.1, 0.35));
  fade(ar2, 0, 1, T('b1~once') - 0.2, 0.3);
  fade(pills, 0, 1, T('b1~once') - 0.05, 0.35);
  S.add(ch08Fade([...slabs, ...slabLbl], 0, 1, { d: 0.35, stagger: 0.07 }), T('b1~carry') - 0.2);
  // the three pills float up through the slabs, unchanged
  const tUp = T('b1~carry') + 0.2;
  S.add(gsap.fromTo(pills, { y: 0 }, { y: 212 - PY0, duration: 2.2, ease: 'power1.inOut', immediateRender: false, stagger: 0.08 }), tUp);
  S.add(ch08Ignore(pills, 2.5), tUp);

  // ================================================================ b2: invited by everything so far
  const tick = (txt, x, y) => { const g = S.g(null, left); S.path({ d: `M${x},${y} l8,9 l15,-18`, stroke: 'muted', sw: 3 }, g); S.text(txt, { x: x + 32, y: y - 2, size: 24, weight: 550, color: 'muted' }, g); return g; };
  const tk1 = tick('weights fixed after training', LX + 210, 782), tk2 = tick('embedding looked up once', LX + 150, 922);
  const reas = S.text('a reasonable reading', { x: LX, y: 1000, size: 26, weight: 600, anchor: 'middle', color: 'faint' }, left);
  const q = S.text('?', { x: LX, y: 420, size: 150, weight: 700, family: 'display', anchor: 'middle', color: 'muted' }, left);
  ch08Hide([tk1, tk2, reas, q]);
  S.add(gsap.fromTo(left, { x: L1 }, { x: L2, duration: 0.6, ease: 'power2.inOut', immediateRender: false }), T('b2~fixed') - 0.7);
  fade(reas, 0, 1, T('b2~invites') - 0.1);
  fade(tk1, 0, 1, T('b2~fixed') - 0.1);
  fade(tk2, 0, 1, T('b2~embedding') - 0.1);
  fade(q, 0, 0.8, T('b2~Why') - 0.1, 0.5);
  S.add(gsap.fromTo(q, { y: -30 }, { y: 0, duration: 0.6, ease: 'bounce.out', immediateRender: false }), T('b2~Why') - 0.1);

  // ================================================================ b3: struck; each layer owns its own
  const tNot = T('b3~not') - 0.1;
  const strike = S.line({ x1: 90, y1: 1010, x2: 880, y2: 110, stroke: 'muted', sw: 5 }, left);
  strike.setAttribute('data-audit', 'ignore');
  S.set(strike, { autoAlpha: 0 }, 0);
  S.add(fx.draw(strike, { d: 0.4 }), tNot);
  const leftAll = S.g();
  leftAll.appendChild(left);
  S.add(fx.xform(leftAll, { x: 30, y: 300, s: 0.42, ox: 0, oy: 0 }, { d: 0.8, ease: 'power3.inOut' }), tNot + 0.45);
  S.add(gsap.fromTo(left, { x: L2 }, { x: 0, duration: 0.8, ease: 'power3.inOut', immediateRender: false }), tNot + 0.45);
  S.add(ch08Fade(leftAll, 1, 0.45, { d: 0.6 }), tNot + 0.5);
  S.add(ch08Ignore(leftAll, S.duration - tNot - 0.5), tNot + 0.45);
  const wrong = S.text('tempting, but wrong', { x: 250, y: 780, size: 28, weight: 650, anchor: 'middle', color: 'muted' });
  const why = S.g();
  const whyT = 'why: explains the cache formula', whyW = S.measure(whyT, { size: 24, weight: 600 }) + 32;
  S.rect({ x: 250 - whyW / 2, y: 812, w: whyW, h: 44, r: 12, stroke: 'helps', sw: 2 }, why);
  S.text(whyT, { x: 250, y: 835, size: 24, weight: 600, anchor: 'middle', color: 'helps' }, why);
  ch08Hide([wrong, why]);
  fade(wrong, 0, 1, tNot + 1.1);
  fade(why, 0, 1, tNot + 1.3);
  fade([wrong, why], 1, 0.4, T('b3~owns'), 0.5);
  // the right side: four rows, three tiles each, every one its own texture
  const RX0 = 940, RW = 700, RCX = RX0 + RW / 2;
  const head = S.text([{ t: 'Each layer owns ' }, { t: 'its own', c: 'struct' }, { t: ' three matrices' }], { x: 1280, y: 150, size: 46, weight: 700, family: 'display', anchor: 'middle', color: 'ink' });
  ch08Hide(head);
  fade(head, 0, 1, T('b3~Each') - 0.1, 0.5);
  const rows4 = [0, 1, 2, 3].map(r => {
    const g = S.g(), y = 820 - r * 130;
    S.rect({ x: RX0, y: y - 55, w: RW, h: 110, r: 14, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.6, sw: 2 }, g);
    [0, 1, 2].forEach(k => ch08WeightTile(S, { x: RX0 + 70 + k * 210, y: y - 42, w: 140, h: 84, seed: 101 + r * 13 + k * 5, cols: 10, rows: 6 }, g));
    S.text(String(r + 1), { x: RX0 - 22, y: y + 1, size: 28, weight: 700, family: 'mono', anchor: 'end', color: 'muted' }, g);
    if (r === 0) ['Q', 'K', 'V'].forEach((n, k) => ch08W(S, n, { x: RX0 + 140 + k * 210, y: y + 92, size: 36 }, g));
    ch08Hide(g);
    return g;
  });
  fade(rows4[0], 0, 1, T('b3~owns') - 0.1, 0.5);
  [1, 2, 3].forEach(r => S.add(ch08Fade(rows4[r], 0, 1, { d: 0.35 }), T('b3~three') - 0.3 + 0.18 * r));
  // the compressed stack of 80: one path per shade, rows revealed from the bottom up
  const N = 80, YB = 900, PIT = 7.6, RH = 5.4;
  const rnd = S.rand(97);
  const stack = S.g();
  const slabP = S.path({ d: '', fill: 'struct', fillOpacity: 0.22 }, stack);
  const shadeP = [0.35, 0.55, 0.8].map(o => S.path({ d: '', fill: 'struct', fillOpacity: o }, stack));
  const rowShade = [...Array(N)].map(() => [0, 1, 2].map(() => Math.floor(rnd() * 3)));
  const rowY = r => YB - (r + 1) * PIT;
  const paintStack = (n, shimmer) => {
    let sd = ''; const sh = ['', '', ''];
    for (let r = 0; r < n; r++) {
      const y = rowY(r).toFixed(1);
      sd += `M${RX0},${y}h${RW}v${RH}h${-RW}z`;
      for (let k = 0; k < 3; k++) {
        const s = (rowShade[r][k] + shimmer) % 3;
        sh[s] += `M${RX0 + 70 + k * 210},${y}h140v${RH}h-140z`;
      }
    }
    slabP.setAttribute('d', sd);
    shadeP.forEach((p, i) => p.setAttribute('d', sh[i]));
  };
  stack.setAttribute('data-audit', 'ignore');
  paintStack(0, 0);
  const t80 = T('b3~eighty') - 0.1, t80e = t80 + 1.2, tShim = T('b3~all') - 0.05;
  S.add(ch08Fade(rows4, 1, 0, { d: 0.4 }), t80);
  clock(t80, tShim + 1.2, t => {
    const n = Math.round(4 + 76 * E('power2.inOut')(cl((t - t80) / (t80e - t80))));
    const sh = t > tShim ? Math.floor((t - tShim) * 10) % 3 : 0;
    paintStack(t < t80 ? 0 : n, t < tShim + 1.0 ? sh : 0);
    cnt.textContent = `${n}`;
  });
  const cntG = S.g();
  const cnt = S.text('4', { x: 1760, y: 560, size: 64, weight: 750, family: 'mono', anchor: 'middle', color: 'struct' }, cntG);
  S.text('80 each:', { x: 1760, y: 620, size: 26, weight: 600, anchor: 'middle', color: 'muted' }, cntG);
  const wnames = S.g(null, cntG);
  ['Q', 'K', 'V'].forEach((n, k) => ch08W(S, n, { x: 1700 + k * 60, y: 668, size: 36, color: 'muted' }, wnames));
  ch08Hide(cntG);
  fade(cntG, 0, 1, t80, 0.4);

  // ================================================================ b4: 80 multiplies per token; 39 ≠ 40
  const tClimb = T('b4~happens') - 0.2, tClimbE = T('b4~input') + 0.1;
  fade(cntG, 1, 0, tClimb - 0.3, 0.3);
  const hl = S.rect({ x: RX0 - 6, y: 0, w: RW + 12, h: RH + 6, r: 3, fill: 'compute', opacity: 0 });
  hl.setAttribute('data-audit', 'ignore');
  const tokH = S.g();
  ch08Vec(S, { token: 'sat', dir: 'row', n: 6, cw: 14, ch: 14, gap: 2, x: 0, y: 0 }, tokH);
  tokH.setAttribute('data-audit', 'ignore');
  ch08Hide(tokH);
  fade(tokH, 0, 1, tClimb - 0.2, 0.3);
  const mul = S.g();
  const mulN = S.text('0', { x: 1760, y: 560, size: 64, weight: 750, family: 'mono', anchor: 'middle', color: 'compute' }, mul);
  S.text('multiplies', { x: 1760, y: 620, size: 26, weight: 600, anchor: 'middle', color: 'compute' }, mul);
  S.text('per Token', { x: 1760, y: 654, size: 26, weight: 600, anchor: 'middle', color: 'compute', case: 'keep' }, mul);   // continues 'Multiplies'
  ch08Hide(mul);
  fade(mul, 0, 1, tClimb, 0.35);
  clock(tClimb, tClimbE + 0.4, t => {
    const p = cl((t - tClimb) / (tClimbE - tClimb)), r = Math.min(N - 1, Math.floor(p * N));
    tokH.setAttribute('transform', `translate(${RX0 - 70},${(rowY(r) + RH / 2).toFixed(1)})`);
    hl.setAttribute('y', (rowY(r) - 3).toFixed(1));
    const frac = p * N - Math.floor(p * N);
    hl.setAttribute('opacity', (t < tClimb || t > tClimbE ? 0 : 0.95 * (1 - frac * 0.6)).toFixed(3));
    mulN.textContent = String(t <= tClimb ? 0 : Math.min(80, Math.floor(p * N) + 1));
  });
  const notShared = S.text('not shared, not reused', { x: 1735, y: 730, size: 24, weight: 600, anchor: 'middle', color: 'muted' });
  ch08Hide(notShared);
  fade(notShared, 0, 1, T('b4~different') - 0.1);
  // 'Layer forty': the camera dives towards rows 39-40; their W_K tiles come up side by side
  const tZ = T('b4~Layer') - 0.15;
  const yc = (rowY(38) + rowY(39)) / 2 + RH / 2;
  S.add(fx.xform(stack, { x: 960 - RCX, y: 560 - yc, s: 7, ox: RCX, oy: yc }, { d: 0.9, ease: 'power2.in' }), tZ);
  S.add(ch08Fade([stack, tokH, head], 1, 0, { d: 0.5 }), tZ + 0.4);
  S.add(ch08Fade(leftAll, 0.45, 0, { d: 0.5 }), tZ + 0.4);
  S.add(ch08Fade([wrong, why], 0.4, 0, { d: 0.5 }), tZ + 0.4);
  S.add(ch08Fade([mul, notShared], 1, 0, { d: 0.4 }), tZ);
  const pair = S.g();
  // the pair, centred where the camera dived
  const k39 = ch08WeightTile(S, { x: 660, y: 400, w: 240, h: 240, seed: 3939, cols: 10, rows: 10, name: 'K', nameSize: 44 }, pair);
  const k40 = ch08WeightTile(S, { x: 1020, y: 400, w: 240, h: 240, seed: 4040, cols: 10, rows: 10, name: 'K', nameSize: 44 }, pair);
  S.text('layer 39', { x: 780, y: 360, size: 32, weight: 700, anchor: 'middle', color: 'ink' }, pair);
  S.text('layer 40', { x: 1140, y: 360, size: 32, weight: 700, anchor: 'middle', color: 'ink' }, pair);
  ch08Hide(pair);
  S.add(ch08Fade(pair, 0, 1, { d: 0.5 }), tZ + 0.7);
  S.add(gsap.fromTo(pair, { scale: 0.85, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.6, ease: 'power3.out', transformOrigin: '50% 50%', immediateRender: false }), tZ + 0.7);
  const ne = S.text('≠', { x: 960, y: 520, size: 90, weight: 700, family: 'display', anchor: 'middle', color: 'muted' });
  ch08Hide(ne);
  fade(ne, 0, 1, T('b4~nothing') - 0.1, 0.4);
});
