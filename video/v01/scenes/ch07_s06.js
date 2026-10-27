/* ch07_s06 · the same shape, read two ways (fig 89)
   b1  the input embedding (left) and its twin, the output projection (right), both 128,256 × 8,192, with a
       dim stack of slabs 'inside the model' between; a blue strip sweeps down the right table, every row
       sending an amber score into 'scores: 128,256'.
   b2  a 200-token prompt reads 200 rows: three coral lines in the left table, a hairline bar '0.16% · 3.28 MB'
       ('wider than true scale', '1 MB = a million bytes'); '+16.4 KB per new token'.
   b3  the right table lights top to bottom in coral, its bar fills: '100% · 2.10 GB'; again: 'token 2',
       'token 3'.
   b4  '0 operations' in; '1 multiply + 1 add per weight', '2.10 billion operations' out; 'same size'.
   b5  the tables merge ('shared, in some models') and part ('ours: two separate tables'); a few rows are
       plucked from the left, a broad flow pours through the right.
   b6  'an exception to: every token reads every weight'; '1.05 billion weights ≈ 1.5% of 70B'.
   Checks: 200 / 128,256 = 0.156%; 200 × 16,384 B = 3.28 MB; 128,256 × 8,192 × 2 B = 2.10 GB;
   × 2 ops = 2.10 billion; 1.05e9 / 70e9 = 1.5%.
   Layout: tables x 260-509 and 1420-1669, y 300-627; slabs x 780-1140; ledgers y 690-920. */
V.scene('ch07_s06', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const E = n => gsap.parseEase(n);
  const clock = (a, b, fn) => S.add(ch07Drive(b - a, k => fn(a + k * (b - a))), a);
  const TP = { n: 12, cw: 18, rowH: 30, gap: 9, ellH: 42 };
  const LX = 260, RX = 1420, TY = 300;

  // ================================================================ the two tables
  // the camera keeps each stage centred: the tables alone (y 203-681) 95 px lower in b1 and b5, as drawn while
  // the reading counts fill the space below (b2-b4), and 150 px lower under the heading in b6
  S.xset(S.camera, { x: 0, y: 95, s: 1 });
  const side = (x, title) => {
    const hold = S.g();
    const tb = ch07Table(S, { x, y: TY, ...TP }, hold);
    const cx = tb.cx;
    const ttl = S.text(title, { x: cx, y: 222, size: 34, weight: 700, family: 'display', anchor: 'middle', color: 'ink' }, hold);
    const shape = S.text('128,256 × 8,192', { x: cx, y: 262, size: 24, weight: 550, family: 'mono', anchor: 'middle', color: 'muted' }, hold);
    return { hold, tb, ttl, shape, cx };
  };
  const L = side(LX, 'Input embedding'), R = side(RX, 'Output projection');
  ch07Hide([L.hold, R.hold]);
  ch07Hide([L.shape, R.shape]);
  // the slabs between them, 'inside the model'
  const slabs = S.g();
  for (let i = 0; i < 7; i++) S.rect({ x: 800 - i * 6, y: 520 - i * 34, w: 320, h: 24, r: 6, fill: '#1c2336', stroke: 'muted', strokeOpacity: 0.4, sw: 1.5 }, slabs);
  const inside = S.text('inside the model', { x: 945, y: 590, size: 26, weight: 550, anchor: 'middle', color: 'faint' });
  ch07Hide([slabs, inside]);
  S.add(ch07Fade(L.hold, 0, 1, { d: 0.6 }), 0.3);
  S.add(gsap.fromTo(L.hold, { x: 420 }, { x: 0, duration: 0.9, ease: 'power3.inOut', immediateRender: false }), 'b1~other-0.2');
  S.add(ch07Fade([slabs, inside], 0, 1, { d: 0.6 }), 'b1~end');
  S.add(ch07Fade(R.hold, 0, 1, { d: 0.6 }), 'b1~output-0.1');
  S.add(ch07Fade([L.shape, R.shape], 0, 1, { d: 0.4 }), 'b1~projection');

  // b1: a blue strip from the slabs sweeps down the right table; each row scores into the counter
  const probeH = S.g();
  const probe = ch07Vec(S, { token: 'hidden', n: TP.n, cw: TP.cw, ch: TP.rowH, gap: 3, anchor: 'start', x: 0, y: 0 }, probeH);
  const probeBox = S.rect({ x: -5, y: -5, w: R.tb.w + 10, h: TP.rowH + 10, r: 6, stroke: 'struct', sw: 2.5 }, probeH);
  probeH.setAttribute('data-audit', 'ignore');
  ch07Hide(probeH);
  const tS0 = T('b1~scores') - 0.45, tS1 = tS0 + 0.35, tS2 = T('b1~token') + 0.45;
  const items = [...R.tb.rows, ...R.tb.ells].sort((a, b) => a.t - b.t);
  const probeAt = t => {
    const a = E('power2.inOut')(cl((t - tS0) / (tS1 - tS0))), b = cl((t - tS1) / (tS2 - tS1));
    const x = 790 + (RX - 790) * a, y = (330 + (TY - 330) * a) + (R.tb.b - TP.rowH - TY) * b;
    probeH.setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)})`);
  };
  probeAt(0);
  S.add(ch07Fade(probeH, 0, 1, { d: 0.25 }), tS0);
  clock(tS0, tS2, probeAt);
  S.add(ch07Fade(probeH, 1, 0, { d: 0.3 }), tS2);
  const scores = S.text('scores: 0', { x: R.cx, y: 668, size: 28, weight: 650, family: 'mono', anchor: 'middle', color: 'compute' });
  ch07Hide(scores);
  S.add(ch07Fade(scores, 0, 1, { d: 0.3 }), tS1);
  const chips = R.tb.rows.map(() => S.rect({ x: 0, y: 0, w: 12, h: 12, r: 3, fill: 'compute', opacity: 0 }));
  chips.forEach(c => c.setAttribute('data-audit', 'ignore'));
  clock(tS1, tS2 + 0.8, t => {
    const b = cl((t - tS1) / (tS2 - tS1));
    scores.textContent = `scores: ${ch07Comma(Math.round(CH07.VOCAB * E('power1.inOut')(cl((t - tS1) / (tS2 + 0.5 - tS1)))))}`;
    R.tb.rows.forEach((r, i) => {
      const tr = tS1 + (r.t - TY) / (R.tb.b - TP.rowH - TY) * (tS2 - tS1), u = cl((t - tr) / 0.5);
      const x0 = RX + R.tb.w + 6, y0 = r.cy - 6, x1 = R.cx - 6, y1 = 650;
      chips[i].setAttribute('x', (x0 + (x1 - x0) * E('power2.in')(u)).toFixed(1));
      chips[i].setAttribute('y', (y0 + (y1 - y0) * E('power2.in')(u)).toFixed(1));
      chips[i].setAttribute('opacity', (t >= tr && u < 1 ? 1 : 0));
    });
  });

  // ================================================================ b2: 200 rows in
  S.add(fx.cam({ d: 0.8, ease: 'power2.inOut' }), T('b2') - 0.3);
  const t2 = T('b2') - 0.1;
  S.add(ch07Fade([scores, inside], 1, 0, { d: 0.4 }), t2);
  const ell1 = L.tb.ells[0];
  const reads = S.g();
  [0.25, 0.5, 0.75].forEach(f => S.line({ x1: LX, y1: ell1.t + f * (ell1.b - ell1.t), x2: LX + L.tb.w, y2: ell1.t + f * (ell1.b - ell1.t), stroke: 'bytes', sw: 2.5, cap: 'butt' }, reads));
  reads.setAttribute('data-audit', 'ignore');
  const of200 = S.text('200 of 128,256', { x: LX + L.tb.w + 24, y: ell1.cy, size: 24, weight: 650, color: 'bytes' });
  ch07Hide([reads, of200]);
  const tR = T('b2~two#2') - 0.1;
  S.add(ch07Fade(reads, 0, 1, { d: 0.2 }), tR);
  S.add(ch07Drive(0.7, k => { reads.style.opacity = (0.55 + 0.45 * Math.cos(k * Math.PI * 4)).toFixed(3); }), tR + 0.2);
  S.add(ch07Fade(of200, 0, 1, { d: 0.4 }), tR + 0.1);
  // the left ledger: a hairline bar, drawn wider than true scale
  const BW = 400, LBX = 190, RBX = 1350, BY = 710;
  const ledger = x => {
    const g = S.g();
    S.text('rows read', { x, y: 690, size: 24, weight: 550, color: 'muted' }, g);
    S.rect({ x, y: BY, w: BW, h: 16, r: 4, fill: '#1c2336', stroke: 'muted', strokeOpacity: 0.35, sw: 1 }, g);
    ch07Hide(g);
    return g;
  };
  const ledL = ledger(LBX), ledR = ledger(RBX);
  const hair = S.rect({ x: LBX, y: BY - 4, w: 3, h: 24, fill: 'bytes' });
  const lblL = S.text('0.16% · 3.28 MB', { x: LBX, y: 790, size: 28, weight: 700, color: 'bytes' });
  const noteA = S.text('wider than true scale', { x: LBX, y: 826, size: 22, weight: 550, color: 'faint' });
  const noteB = S.text('1 MB = a million bytes', { x: LBX, y: 856, size: 22, weight: 550, color: 'faint' });
  const perTok = S.text('+16.4 KB per new token', { x: LBX + 14, y: 752, size: 22, weight: 600, color: 'bytes' });
  ch07Hide([hair, lblL, noteA, noteB, perTok]);
  const tP = T('b2~zero') - 0.1;
  S.add(ch07Fade(ledL, 0, 1, { d: 0.4 }), tP - 0.3);
  S.add(ch07Fade(hair, 0, 1, { d: 0.3, dy0: -8, dy1: 0 }), tP);
  S.add(ch07Fade(lblL, 0, 1, { d: 0.45 }), tP + 0.2);
  S.add(ch07Fade([noteA, noteB], 0, 1, { d: 0.45, stagger: 0.15 }), T('b2~percent') + 0.1);
  // 'never touched': the rest of the left table dims further
  const tN = T('b2~never') - 0.1;
  S.add(ch07Fade([...L.tb.rows, ...L.tb.ells], 1, 0.4, { d: 0.5 }), tN);
  S.add(ch07Fade(perTok, 0, 1, { d: 0.4 }), tN + 0.3);

  // ================================================================ b3: every row out, every token
  const t3 = T('b3') - 0.1;
  S.add(ch07Fade([noteA, noteB, of200, L.shape, R.shape], 1, 0, { d: 0.4 }), t3);
  S.add(ch07Fade(reads, 1, 0.5, { d: 0.4 }), t3);
  // coral row overlays on the right table, written by one painter from the passes
  const lit = items.map(it => S.rect({ x: RX - 4, y: it.t - 2, w: R.tb.w + 8, h: it.b - it.t + 4, r: 5, fill: 'bytes', fillOpacity: 0 }));
  lit.forEach(e => e.setAttribute('data-audit', 'ignore'));
  const tP1 = T('b3~reads') - 0.1, tP2 = T('b3~again') - 0.1, tP3 = T('b3~new') - 0.15, tOut = T('b4~Out') - 0.1;
  const passes = [[tP1, 1, 0.9], [tP2, 1, 0.75], [tP3, 1, 0.75]];
  for (let tp = tP3 + 1.4; tp < tOut - 0.6; tp += 1.4) passes.push([tp, 0.45, 1.1]);
  const tB = T('b5~streams') - 0.1;                                 // b5: the broad flow through every row
  clock(tP1, T('b6') + 0.5, t => items.forEach((it, i) => {
    const f = (it.t - TY) / (R.tb.h);
    let v = 0;
    passes.forEach(([tp, amp, d]) => { const u = (t - tp) / d - f; if (u > 0) v = Math.max(v, amp * Math.max(0, 1 - u * 1.4)); });
    if (t >= tOut && t < tB) v *= 0;
    const ub = (t - tB) / 1.2;
    if (ub > 0) v = Math.max(v, 0.9 * cl(ub * 3) * (1 - cl((ub - 1.2) / 1.5)));
    lit[i].setAttribute('fill-opacity', (0.5 * v).toFixed(3));
  }));
  // the right bar fills to 100%
  const fillR = S.rect({ x: RBX, y: BY, w: 0, h: 16, r: 4, fill: 'bytes' });
  const lblR1 = S.text('100%', { x: RBX, y: 790, size: 28, weight: 700, color: 'bytes' });
  const lblR2 = S.text('100% · 2.10 GB', { x: RBX, y: 790, size: 28, weight: 700, color: 'bytes' });
  const termR = S.text('128,256 × 8,192 × 2 bytes', { x: RBX, y: 826, size: 22, weight: 550, family: 'mono', color: 'muted' });
  ch07Hide([lblR1, lblR2, termR]);
  S.add(ch07Fade(ledR, 0, 1, { d: 0.4 }), tP1 - 0.2);
  clock(tP1, tP1 + 0.9, t => fillR.setAttribute('width', (BW * E('power2.inOut')(cl((t - tP1) / 0.9))).toFixed(2)));
  S.add(ch07Fade(lblR1, 0, 1, { d: 0.35 }), tP1 + 0.6);
  S.add(ch07Fade(lblR1, 1, 0, { d: 0.25 }), 'b3~two-0.15');
  S.add(ch07Fade(lblR2, 0, 1, { d: 0.35 }), 'b3~two');
  S.add(ch07Fade(termR, 0, 1, { d: 0.4 }), T('b3~gigabytes'));
  const tok2 = S.text('token 2', { x: RBX + BW, y: 690, size: 24, weight: 650, family: 'mono', anchor: 'end', color: 'struct' });
  const tok3 = S.text('token 3', { x: RBX + BW, y: 690, size: 24, weight: 650, family: 'mono', anchor: 'end', color: 'struct' });
  ch07Hide([tok2, tok3]);
  S.add(ch07Fade(tok2, 0, 1, { d: 0.2 }), tP2);
  S.add(ch07Fade(tok2, 1, 0, { d: 0.15 }), tP3);
  S.add(ch07Fade(tok3, 0, 1, { d: 0.2 }), tP3 + 0.1);
  S.add(ch07Fade(tok3, 1, 0, { d: 0.35 }), tOut);

  // ================================================================ b4: 0 operations in, 2.1 billion out
  const t4 = T('b4') - 0.1;
  S.add(ch07Fade([perTok, termR], 1, 0, { d: 0.35 }), t4);
  const zeroOps = S.text('0 operations', { x: LBX, y: 920, size: 32, weight: 750, color: 'helps' });
  const perW = S.text('1 multiply + 1 add per weight', { x: RBX, y: 868, size: 24, weight: 600, color: 'compute' });
  const opsR = S.text('0 operations', { x: RBX, y: 920, size: 32, weight: 750, color: 'compute' });
  ch07Hide([zeroOps, perW, opsR]);
  S.add(ch07Fade(zeroOps, 0, 1, { d: 0.45, dy0: 10, dy1: 0 }), 'b4~Zero-0.1');
  S.add(ch07Fade(perW, 0, 1, { d: 0.45 }), 'b4~multiply-0.1');
  const tO0 = T('b4~two') - 0.1, tO1 = T('b4~operations#2') + 0.3;
  S.add(ch07Fade(opsR, 0, 1, { d: 0.3 }), tO0);
  clock(tO0, tO1, t => { const v = 2.10 * E('power2.out')(cl((t - tO0) / (tO1 - tO0))); opsR.textContent = `${v.toFixed(2)} billion operations`; });
  const tSame = T('b4~exactly') - 0.1;
  S.add(ch07Fade([L.shape, R.shape], 0, 1, { d: 0.45 }), tSame);
  const same = S.text('same size', { x: 945, y: 262, size: 28, weight: 700, anchor: 'middle', color: 'white' });
  ch07Hide(same);
  S.add(ch07Fade(same, 0, 1, { d: 0.45 }), T('b4~same') - 0.1);

  // ================================================================ b5: one table or two
  S.add(fx.cam({ x: 960, y: 445, scale: 1, d: 0.8, ease: 'power2.inOut' }), T('b5') - 0.1);
  const t5 = T('b5~one') - 0.1;
  const ledgerAll = [ledL, ledR, hair, lblL, fillR, lblR2, zeroOps, perW, opsR, reads];
  S.add(ch07Fade([...ledgerAll, same, slabs], 1, 0, { d: 0.5 }), t5);
  const DXm = 945 - L.cx;
  S.add(gsap.fromTo(L.hold, { x: 0 }, { x: DXm, duration: 0.9, ease: 'power3.inOut', immediateRender: false }), t5 + 0.2);
  S.add(gsap.fromTo(R.hold, { x: 0 }, { x: 945 - R.cx, duration: 0.9, ease: 'power3.inOut', immediateRender: false }), t5 + 0.2);
  S.add(ch07Fade([L.ttl, R.ttl], 1, 0, { d: 0.3 }), t5 + 0.1);
  S.add(ch07Fade([...L.tb.rows, ...L.tb.ells], 0.4, 1, { d: 0.4 }), t5 + 0.2);
  const shared = S.text('shared, in some models', { x: 945, y: 676, size: 30, weight: 650, anchor: 'middle', color: 'ink' });
  const ours = S.text('ours: two separate tables', { x: 945, y: 676, size: 30, weight: 650, anchor: 'middle', color: 'ink' });
  ch07Hide([shared, ours]);
  S.add(ch07Fade(shared, 0, 1, { d: 0.4 }), t5 + 0.9);
  const tApart = T('b5~Ours') - 0.1;
  S.add(gsap.fromTo(L.hold, { x: DXm }, { x: 0, duration: 0.9, ease: 'power3.inOut', immediateRender: false }), tApart);
  S.add(gsap.fromTo(R.hold, { x: 945 - R.cx }, { x: 0, duration: 0.9, ease: 'power3.inOut', immediateRender: false }), tApart);
  S.add(ch07Fade([L.ttl, R.ttl], 0, 1, { d: 0.4 }), tApart + 0.6);
  S.add(ch07Fade(shared, 1, 0, { d: 0.25 }), tApart);
  S.add(ch07Fade(ours, 0, 1, { d: 0.4 }), tApart + 0.4);
  S.add(ch07Ignore([L.hold, R.hold, shared], tApart + 1.0 - t5), t5);
  // 'gathers a few rows': three thin coral arrows pluck rows from the left table
  const pluck = S.g();
  [L.tb.rowAt(1), L.tb.rowAt(4271), L.tb.rowAt(128254)].forEach(r => {
    const a = S.arrow({ x1: LX + L.tb.w + 10, y1: r.cy, x2: LX + L.tb.w + 90, y2: r.cy, color: 'bytes', sw: 2.5, head: 10 }, pluck);
  });
  ch07Hide(pluck);
  S.add(ch07Fade(pluck, 0, 1, { d: 0.35, dy0: 0, dy1: 0 }), 'b5~gathers-0.1');
  // 'streams them all': a broad coral flow through the right table (the painter above lights every row)
  const flow = S.rect({ x: RX - 40, y: TY - 8, w: 0, h: R.tb.h + 16, r: 10, fill: 'bytes', fillOpacity: 0.16 });
  flow.setAttribute('data-audit', 'ignore');
  clock(tB, tB + 1.6, t => { const u = cl((t - tB) / 1.0), f = 1 - cl((t - tB - 1.0) / 0.6); flow.setAttribute('width', ((R.tb.w + 80) * E('power2.out')(u)).toFixed(1)); flow.setAttribute('opacity', f.toFixed(3)); });

  // ================================================================ b6: the exception
  S.add(fx.cam({ x: 960, y: 390, scale: 1, d: 0.8, ease: 'power2.inOut' }), T('b6') - 0.3);
  const t6 = T('b6') - 0.1;
  S.add(ch07Fade(ours, 1, 0, { d: 0.35 }), t6);
  const head = ch07Heading(S);
  S.add(head.show([{ t: 'an exception to: ', c: 'muted' }, { t: 'every token reads every weight' }], { size: 44 }), 'b6~exception-0.2');
  const sizeTag = S.text('1.05 billion weights ≈ 1.5% of 70B', { x: L.cx, y: 262, size: 24, weight: 600, anchor: 'middle', color: 'struct' });
  ch07Hide(sizeTag);
  S.add(ch07Fade(L.shape, 1, 0, { d: 0.25 }), 'b6~largest-0.2');
  S.add(ch07Fade(sizeTag, 0, 1, { d: 0.45 }), 'b6~largest');
  const noTraffic = S.text('almost no traffic in', { x: LX + L.tb.w + 104, y: L.tb.rowAt(4271).cy, size: 26, weight: 650, color: 'bytes' });
  ch07Hide(noTraffic);
  S.add(ch07Fade(noTraffic, 0, 1, { d: 0.45 }), 'b6~almost-0.1');
  S.add(gsap.fromTo(pluck, { x: 0 }, { x: 10, duration: 0.2, yoyo: true, repeat: 3, ease: 'sine.inOut', immediateRender: false }), 'b6~traffic-0.1');
});
