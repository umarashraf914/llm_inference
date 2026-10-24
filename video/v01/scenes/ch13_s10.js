/* ch13_s10 · how big the cache gets (fig 142)
   Checked: 327,680 bytes per token × 1,000 = 0.33 GB, × 10,000 = 3.3 GB, × 100,000 = 32.8 GB ≈ 33 GB, 23% ≈ ¼ of
   the 140 GB of weights. Both bars at 12 px per GB from x 120: weights 1,680 px; cache 3.9, 39, 393 px.
   b1  the weights bar '140 GB' and an empty cache bar; the counter runs to 1,000, then 10,000; table rows.
   b2  100,000 tokens: the cache bar reaches about a quarter of the weights bar; a bracket '≈ ¼ of the model';
       'one conversation'.
   b3  the formula returns in the top band; 'any model shape' and 'any context length' slide in from the left,
       'gigabytes' leaves on the right. The bars stay into the next scene.
   Layout: weights bar y 420-460, cache bar y 520-560; counter at left, y 700; table rows at right, y 680 / 760 /
   840; top band free until b3 (ch13Formula, y 114-330). */
V.scene('ch13_s10', S => {
  const K = libKit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;
  const tB2 = T('b2') - 0.1, tB3 = T('b3') - 0.1;
  const X0 = 120, PX = 12;   // px per GB

  // ================================================================ the two bars, to one scale
  const wb = S.rect({ x: X0, y: 420, w: 0, h: 40, r: 8, fill: 'url(#solid-struct)' });
  whole(t => wb.setAttribute('width', (140 * PX * EIO(cl((t - 0.4) / 0.9))).toFixed(1)));
  const wL = S.text([{ t: 'weights', c: 'struct', w: 750 }, { t: ' · read every step', c: 'muted' }], { x: X0, y: 396, size: 26, weight: 600 });
  const wV = S.text('140 GB', { x: X0 + 140 * PX - 14, y: 441, size: 26, weight: 800, anchor: 'end', color: '#0a0f1e' });
  const track = S.rect({ x: X0, y: 520, w: 140 * PX, h: 40, r: 8, stroke: 'bytes', strokeOpacity: 0.22, sw: 1.5, dash: '6 6' });
  const cL = S.text([{ t: 'KV cache', c: 'bytes', w: 750 }, { t: ' · one conversation', c: 'muted' }], { x: X0, y: 496, size: 26, weight: 600 });
  const scale = S.text('drawn to scale', { x: X0 + 140 * PX, y: 588, size: 22, weight: 600, anchor: 'end', color: 'muted' });
  hide([wL, wV, track, cL, scale]);
  fade(wL, 0, 1, 0.5, 0.4);
  fade(wV, 0, 1, 1.2, 0.3);
  fade([track, cL], 0, 1, 1.0, 0.4);
  fade(scale, 0, 1, 1.6, 0.4);
  // the counter and the cache bar move together: GB = tokens × 327,680 bytes
  const STEPS = [[1000, T('b1~thousand') - 0.1, 0.8], [10000, T('b1~Ten') - 0.1, 1.0], [100000, T('b2~hundred') - 0.1, 1.4]];
  const tokensAt = t => {
    let n = 0;
    STEPS.forEach(([to, at, d], i) => { const from = i ? STEPS[i - 1][0] : 0; if (t >= at) n = lerp(from, to, E('power2.inOut')(cl((t - at) / d))); });
    return n;
  };
  const cb = S.rect({ x: X0, y: 520, w: 0, h: 40, r: 3, fill: 'url(#solid-bytes)' });
  const cV = S.text('', { x: X0, y: 541, size: 26, weight: 800, color: 'bytes' });
  const cnt = S.text('0', { x: X0, y: 712, size: 76, weight: 800, family: 'mono', color: 'ink' });
  const cntL = S.text('tokens in the conversation', { x: X0, y: 772, size: 26, weight: 600, color: 'muted' });
  hide([cnt, cntL]);
  fade([cnt, cntL], 0, 1, 1.4, 0.4);
  whole(t => {
    const n = tokensAt(t), gb = n * 327680 / 1e9, w = gb * PX;
    cb.setAttribute('width', w.toFixed(2));
    cb.setAttribute('rx', Math.min(3, w / 2).toFixed(2));
    cV.setAttribute('x', (X0 + w + 14).toFixed(1));
    cV.textContent = n < 1 ? '' : gb < 1 ? `${gb.toFixed(2)} GB` : gb < 10 ? `${gb.toFixed(1)} GB` : `${Math.round(gb)} GB`;
    cnt.textContent = Math.round(n).toLocaleString('en-US');
  });
  // the table, one row per stop
  const ROWS = [['1,000', '0.33 GB', T('b1~third') - 0.1], ['10,000', '3.3 GB', T('b1~three') - 0.1], ['100,000', '33 GB', T('b2~thirty') - 0.1]];
  ROWS.forEach(([n, gb, at], i) => {
    const g = S.g(), y = 680 + 80 * i;
    S.text(n, { x: 1380, y, size: 34, weight: 750, family: 'mono', anchor: 'end', color: 'ink' }, g);
    S.text('tokens', { x: 1394, y: y + 2, size: 26, weight: 600, color: 'muted' }, g);
    S.text('→', { x: 1520, y, size: 30, weight: 700, anchor: 'middle', color: 'muted' }, g);
    S.text(gb, { x: 1560, y, size: 34, weight: 800, color: 'bytes' }, g);
    K.track(g, [K.K(at, { x: 24, o: 0 }), K.K(at + 0.4, { x: 0, o: 1, e: 'power3.out' })]);
  });

  // ================================================================ b2: about a quarter of the model
  const tQ = T('b2~quarter') - 0.1, qx = X0 + 35 * PX;
  const quarter = S.g();
  const br = S.path({ d: `M${X0},366 v-10 H${qx} v10`, stroke: 'white', sw: 2.5 }, quarter);
  const drop = S.path({ d: `M${X0 + 32.8 * PX},516 V464`, stroke: 'white', sw: 2, dash: '5 5' }, quarter);
  drop.setAttribute('data-audit', 'ignore');
  const qT = S.text('≈ ¼ of the model', { x: (X0 + qx) / 2, y: 330, size: 28, weight: 800, anchor: 'middle', color: 'ink' }, quarter);
  K.draw(br, 460, tQ, 0.45);
  hide([drop, qT]);
  fade(drop, 0, 1, tQ + 0.2, 0.3);
  fade(qT, 0, 1, tQ + 0.35, 0.35);
  // the cache label already says 'one conversation'; it brightens on the words
  const oneGlow = S.rect({ x: X0 + 110, y: 480, w: 240, h: 34, r: 10, fill: 'url(#pglow-bytes)', opacity: 0 });
  oneGlow.setAttribute('data-audit', 'ignore');
  pulse(oneGlow, T('b2~one') - 0.1, 0.8, 0.9);
  fade(quarter, 1, 0, tB3, 0.35);

  // ================================================================ b3: a formula worth memorising
  const f = ch13Formula(S, { hidden: true });
  S.add(f.drawOn({ d: 0.9 }), tB3 + 0.1);
  const tag = (text, tone, x, y, from, at) => {
    const p = S.pill(text, { x, y, tone, size: x < 400 ? 20 : 24, h: 40 });
    K.track(p, [K.K(at, { x: from, o: 0 }), K.K(at + 0.55, { x: 0, o: 1, e: 'power3.out' })]);
    return p;
  };
  const inA = tag('any model shape', 'struct', 162, 190, -120, T('b3~any') - 0.1);
  const inB = tag('any context length', 'struct', 162, 262, -120, T('b3~context') - 0.1);
  const outG = tag('gigabytes', 'bytes', 1752, 226, 120, T('b3~gigabytes') - 0.25);
  const arr = S.path({ d: `M${f.r + 8},226 H${f.r + 50} M${f.r + 42},219 L${f.r + 51},226 L${f.r + 42},233`, stroke: 'bytes', sw: 2.5 });
  arr.setAttribute('data-audit', 'ignore');
  K.draw(arr, 70, T('b3~gigabytes') - 0.35, 0.25);
  void inA; void inB; void outG; void tB2;
});
