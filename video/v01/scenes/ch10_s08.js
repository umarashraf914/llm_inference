/* ch10_s08 · the coincidence is specific to sixteen bits (fig 118)
   Checked: 70 bn weights at 4 / 2 / 1 / 0.5 bytes = 280 / 140 / 70 / 35 GB; 140 bn operations each;
   ops per byte 0.5 / 1 / 2 / 4; tokens per read to reach 295: 590 / 295 / 147.5 → 148 / 73.75 → 74.
   b1  header 'The coincidence is specific to 16 bits'; the table with only the 16-bit row (2 blocks, 140 GB,
       140 bn, bar '1 per byte'); the 32-bit row slides in above (4 blocks, 280 GB, '0.5 per byte').
   b2  8-bit (1 block, 70 GB, '2 per byte') and 4-bit (half a block, 35 GB, '4 per byte'); the amber 140 bn
       column flashes while the coral steps down; 'quantization: fewer bits per weight'.
   b3  bytes and model columns dim; the batching mini-diagram (one coral read fanning to three users,
       'batching: tokens share one read'); the 16-bit bar stretches × 1, 2, 3.
   b4  the bar settles; the teal column 'tokens per read to reach 295' fills 295, 590, 148, 74; footnote
       '16-bit arithmetic, H100; weights only'.
   b5  'the ridge: next chapter'; the table dims; three lines: 'operations = 2 × parameters', 'bytes =
       parameters × bytes per weight', 'their ratio: maths or memory?' and a white box '1'.
   Layout: header centred. Table x 110-1340, header row y 300, rows y 380 / 460 / 540 / 620 (32, 16, 8, 4-bit);
   bars from x 880 at 70 px per op/byte. The batching diagram (b3) and then the teal column (b4) take the right,
   centred on x 1610. All of it is one pane: the table alone centred (+235, +70), left to +5 when the diagram
   comes, and up 70 at 'payoff' to make room for the three lines. */
V.scene('ch10_s08', S => {
  const K = ch10Kit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;

  const hd = S.text('The coincidence is specific to 16 bits', { x: 960, y: 130, size: 46, weight: 700, family: 'display', anchor: 'middle', color: 'ink' });
  hide(hd);
  fade(hd, 0, 1, 0.3, 0.5);
  // ================================================================ the table
  const COL = { lab: 130, bpw: 360, model: 560, ops: 715, bar: 880 }, HY = 300, RY = { 32: 380, 16: 460, 8: 540, 4: 620 }, UNIT = 70;
  const head = S.g();
  [['bytes / weight', COL.bpw], ['model', COL.model], ['operations', COL.ops], ['ops per byte', COL.bar]].forEach(([s, x]) => S.text(s, { x, y: HY, size: 24, weight: 650, color: 'muted' }, head));
  S.path({ d: `M110,${HY + 26} H1340`, stroke: 'white', strokeOpacity: 0.18, sw: 2 }, head);   // to the end of '4 per byte'
  hide(head);
  fade(head, 0, 1, 0.5, 0.4);
  const ROWS = [
    { b: 16, tag: 'floating point', blocks: 2, gb: '140 GB', opb: 1, at: 0.7, from: 0 },
    { b: 32, tag: 'floating point', blocks: 4, gb: '280 GB', opb: 0.5, at: T('b1~thirty') - 0.1, from: -50 },
    { b: 8, tag: 'integer', blocks: 1, gb: '70 GB', opb: 2, at: T('b2~Eight') - 0.1, from: 50 },
    { b: 4, tag: 'integer', blocks: 0.5, gb: '35 GB', opb: 4, at: T('b2~fourbit') - 0.1, from: 50 },
  ];
  const tStretch = T('b3~multiplies') - 0.1, tSettle = T('b4') - 0.1;
  // the 16-bit bar while tokens share the read: × 1, then 2, then 3, then back to 1
  const mult = t => 1 + EIO(cl((t - tStretch) / 0.5)) + EIO(cl((t - tStretch - 0.9) / 0.5)) - 2 * EIO(cl((t - tSettle) / 0.5));
  const rows = {};
  ROWS.forEach(R => {
    const y = RY[R.b], g = S.g();
    S.text(`${R.b}-bit`, { x: COL.lab, y: y - 8, size: 30, weight: 750, color: 'ink' }, g);
    S.text(R.tag, { x: COL.lab, y: y + 22, size: 20, weight: 600, color: 'muted' }, g);
    const bpw = S.g(null, g);
    for (let i = 0; i < Math.ceil(R.blocks); i++) S.rect({ x: COL.bpw + i * 36, y: y - 15, w: R.blocks - i >= 1 ? 30 : 15, h: 30, r: 4, fill: 'url(#solid-bytes)' }, bpw);
    const model = S.text(R.gb, { x: COL.model, y, size: 28, weight: 750, family: 'mono', color: 'bytes' }, g);
    const ops = S.text('140 bn', { x: COL.ops, y, size: 28, weight: 750, family: 'mono', color: 'compute' }, g);
    const opsGlow = S.rect({ x: COL.ops - 10, y: y - 22, w: 120, h: 44, r: 10, fill: 'compute', opacity: 0 }, g);
    opsGlow.setAttribute('data-audit', 'ignore');
    g.insertBefore(opsGlow, ops);
    const bar = S.rect({ x: COL.bar, y: y - 12, w: 0, h: 24, r: 4, fill: 'url(#solid-compute)' }, g);
    const val = S.text(`${R.opb} per byte`, { x: COL.bar + R.opb * UNIT + 16, y, size: 26, weight: 700, family: 'mono', color: 'compute' }, g);
    whole(t => {
      const k = EIO(cl((t - R.at - 0.2) / 0.5)), m = R.b === 16 ? mult(t) : 1;
      bar.setAttribute('width', (R.opb * UNIT * k * m).toFixed(1));
      val.setAttribute('transform', `translate(${(R.opb * UNIT * (m - 1)).toFixed(1)},0)`);
    });
    S.add(K.drive(0.5, k => { setO(g, k); g.setAttribute('transform', `translate(0,${(R.from * (1 - E('power3.out')(k))).toFixed(1)})`); }), R.at);
    hide(g);
    Object.assign(rows, { [R.b]: { g, bpw, model, ops, opsGlow, bar, val } });
  });
  // the operations never move; the coral steps down
  const tNev = T('b2~never') - 0.1;
  [32, 16, 8, 4].forEach((b, i) => { pulse(rows[b].opsGlow, tNev + 0.1 * i, 0.3, 0.6); });
  const quant = S.pill('quantization: fewer bits per weight', { x: 725, y: RY[4] + 70, tone: 'neutral', size: 24, h: 44, color: 'ink' });   // centred under the table
  hide(quant);
  fade(quant, 0, 1, T('b2~quantization') - 0.1, 0.35);

  // ================================================================ b3: batching multiplies it
  const tB3 = T('b3') - 0.1;
  fade(quant, 1, 0, tB3, 0.3);
  [32, 16, 8, 4].forEach(b => fade([rows[b].bpw, rows[b].model], 1, 0.3, tB3, 0.4));
  // the batching diagram at the right, centred on x 1610 and on the rows; the teal column takes its place in b4
  const TCX = 1610, bat = S.g();
  const src = [TCX - 135, 470];
  S.text('read', { x: src[0], y: src[1] - 30, size: 22, weight: 700, anchor: 'middle', color: 'bytes' }, bat);
  [430, 470, 510].forEach((y, i) => {
    const p = S.path({ d: `M${src[0] + 10},${src[1]} C${src[0] + 120},${src[1]} ${src[0] + 150},${y} ${src[0] + 230},${y}`, stroke: 'bytes', sw: 2.5 }, bat);
    p.setAttribute('data-audit', 'ignore');
    K.draw(p, 400, tB3 + 0.3 + 0.1 * i, 0.4);
    S.icon('ph:user-circle-duotone', { x: src[0] + 260, y, size: 36, color: 'struct' }, bat);
  });
  S.circle({ x: src[0], y: src[1], r: 8, fill: 'bytes' }, bat);
  const batL = S.text('batching: tokens share one read', { x: TCX, y: 566, size: 24, weight: 700, anchor: 'middle', color: 'helps' }, bat);
  hide(bat);
  fade(bat, 0, 1, tB3 + 0.2, 0.4);
  fade(bat, 1, 0, tSettle, 0.3);
  const share = S.text('× tokens sharing: 1', { x: COL.bar, y: RY[16] + 38, size: 22, weight: 650, family: 'mono', color: 'helps' });
  hide(share);
  fade(share, 0, 1, tStretch - 0.1, 0.3);
  fade(share, 1, 0, tSettle, 0.3);
  whole(t => { share.textContent = `× tokens sharing: ${t < tStretch + 0.3 ? 1 : t < tStretch + 1.1 ? 2 : 3}`; });
  void batL;

  // ================================================================ b4: tokens per read to reach 295
  const colH = S.text('tokens per read to reach 295', { x: TCX, y: HY + 28, size: 22, weight: 700, anchor: 'middle', color: 'helps' });
  const colBg = S.rect({ x: 1440, y: HY + 50, w: 340, h: 300, r: 14, fill: 'helps', fillOpacity: 0.07, stroke: 'helps', strokeOpacity: 0.4, sw: 1.5 });
  hide([colH, colBg]);
  fade([colBg, colH], 0, 1, tSettle + 0.2, 0.4);
  const foot = S.text('16-bit arithmetic, H100; weights only', { x: 725, y: 690, size: 22, weight: 600, anchor: 'middle', color: 'muted' });   // centred under the table
  hide(foot);
  fade(foot, 0, 1, tSettle + 0.5, 0.4);
  const cell = (b, s, cue, off = 0) => { const e = S.text(s, { x: TCX, y: RY[b], size: 34, weight: 800, family: 'mono', anchor: 'middle', color: 'helps' }); hide(e); fade(e, 0, 1, T(cue) - 0.1 + off, 0.35); return e; };
  const cells = [cell(16, '295', 'b4~tokens'), cell(32, '590', 'b4~twice'), cell(8, '148', 'b4~half'), cell(4, '74', 'b4~quarter')];

  // ================================================================ b5: the ridge; one rule each, and their ratio
  const tB5 = T('b5') - 0.1;
  const ridge = S.text('the ridge: next chapter', { x: TCX, y: 700, size: 22, weight: 600, anchor: 'middle', color: 'muted' });
  const hGlow = S.rect({ x: 1440, y: HY + 8, w: 340, h: 40, r: 10, fill: 'helps', opacity: 0 });
  hGlow.setAttribute('data-audit', 'ignore');
  hide(ridge);
  pulse(hGlow, tB5, 0.3, 0.9);
  fade(ridge, 0, 1, tB5 + 0.3, 0.4);
  const tPay = T('b5~payoff') - 0.1;
  const tableAll = [head, ...Object.values(rows).map(r => r.g), colH, colBg, foot, ridge];
  fade(tableAll, 1, 0.25, tPay, 0.5);
  fade(cells, 1, 0.25, tPay, 0.5);
  // the table and everything beside it as one pane: centred alone, left when the diagram comes, up for the lines
  const pane = S.g();
  [...S.main.children].filter(e => e !== pane && e !== hd).forEach(e => pane.appendChild(e));
  whole(t => pane.setAttribute('transform', `translate(${lerp(235, 5, EIO(cl((t - tB3) / 0.7))).toFixed(1)},${(70 * (1 - EIO(cl((t - tPay) / 0.6)))).toFixed(1)})`));
  const L = (parts, y, cue, size = 38) => { const e = S.text(parts.map(([t, c]) => ({ t, c })), { x: 960, y, size, weight: 750, anchor: 'middle' }); hide(e); fade(e, 0, 1, T(cue) - 0.1, 0.4); return e; };
  L([['operations = ', 'compute'], ['2', 'compute'], [' × ', 'ink'], ['parameters', 'struct']], 790, 'b5~one');
  L([['bytes = ', 'bytes'], ['parameters', 'struct'], [' × bytes per weight', 'bytes']], 852, 'b5~one#2');
  // the last line and its answer box as one unit, centred
  const lw = S.measure('their ratio: maths or memory?', { size: 38, weight: 750 });
  const last = L([['their ratio: maths or memory?', 'ink']], 914, 'b5~their');
  last.setAttribute('transform', `translate(${-(30 + 64) / 2},0)`);
  const one = S.g();
  const lx = 960 - (30 + 64) / 2 + lw / 2 + 30;
  S.rect({ x: lx, y: 914 - 32, w: 64, h: 64, r: 12, fill: '#0c1326', stroke: 'white', sw: 3 }, one);
  S.text('1', { x: lx + 32, y: 916, size: 40, weight: 800, family: 'mono', anchor: 'middle', color: 'ink' }, one);
  hide(one);
  S.add(K.drive(0.4, k => { setO(one, k); const s = lerp(1.5, 1, E('back.out(2)')(k)); one.setAttribute('transform', `translate(${(lx + 32) * (1 - s)},${914 * (1 - s)}) scale(${s})`); }), T('b5~is#2') - 0.1);
  void last; void lerp;
});
