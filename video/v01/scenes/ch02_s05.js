/* ch02_s05 · three chips, one division (fig 14)
   time per token = 140 GB ÷ bandwidth: H100 41.8 ms, H200 29.2 ms (the 30 ms), B200 17.5 ms,
   bars to scale at 20 px per ms. 24 tokens/s vs 33 is the same division on a different chip. */
V.scene('ch02_s05', S => {
  const { fx } = S;
  const ROWS = [390, 530, 670], BX = 580, PXMS = 20;
  const CY = 70;   // the chart's block sits this far below where it is drawn (see the end)
  const CH = [
    { name: 'H100', bw: '3.35 TB/s', ms: 41.8, tps: '23.9', tag: ['holds 80 GB: model won’t fit', 'a what-if'], band: '140 GB ÷ 3,350 GB/s = 0.0418 s' },
    { name: 'H200', bw: '4.8 TB/s', ms: 29.17, tps: '34.3', tag: ['holds 141 GB: a tight squeeze'], band: '140 GB ÷ 4,800 GB/s = 0.0292 s' },
    { name: 'B200', bw: '8 TB/s', ms: 17.5, tps: '57.1', tag: [], band: '140 GB ÷ 8,000 GB/s = 0.0175 s' },
  ];

  // ---------------------------------------------------------------- the rule and the worked-line band
  const eq = S.equation([{ t: 'time per token', tone: 'ink' }, { t: '=', tone: 'muted' }, { t: '140 GB', tone: 'bytes' }, { t: '÷', tone: 'muted' }, { t: 'bandwidth', tone: 'bytes' }], { x: 960, y: 165, size: 46 });
  S.add(fx.in(eq.parts, { from: 'up', d: 0.45, stagger: 0.08 }), 0.2);
  const band = S.text('', { x: 960, y: 248, size: 32, anchor: 'middle', family: 'mono', weight: 600, color: 'ink' });
  const bandSub = S.text('1 TB = 1,000 GB', { x: 960, y: 288, size: 24, anchor: 'middle', color: 'muted', weight: 550 });
  S.set(bandSub, { autoAlpha: 0 }, 0);
  const setBand = (txt, at) => S.add(fx.swap(band, txt), at);

  // ---------------------------------------------------------------- the three chips
  const cards = CH.map((c, i) => {
    const g = S.g();
    const y = ROWS[i];
    S.rect({ x: 120, y: y - 58, w: 440, h: 116, r: 16, fill: '#0c1326' }, g);
    g.bg = S.rect({ x: 120, y: y - 58, w: 440, h: 116, r: 16, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.16, sw: 2 }, g);
    S.icon('ph:cpu-duotone', { x: 162, y: y - 22, size: 44, color: 'compute' }, g);
    g.name = S.text([{ t: c.name, c: 'ink', w: 700 }, { t: '  ·  ', c: 'muted', w: 500 }, { t: c.bw, c: 'bytes', w: 650 }], { x: 196, y: y - 22, size: 32 }, g);
    g.tags = c.tag.map((t, k) => S.text(t, { x: 196, y: y + 16 + k * 28, size: 22, color: 'muted', weight: 550 }, g));
    S.set(g.tags, { autoAlpha: 0 }, 0);
    return g;
  });
  S.add(fx.in(cards, { from: 'left', d: 0.5, stagger: 0.12 }), "b1~Nvidia's");
  S.add(gsap.to([cards[1], cards[2]], { opacity: 0.5, duration: 0.4 }), "b1~Nvidia's+0.5");
  // the 30 ms line, bars to scale
  const line30 = S.line({ x1: BX + 30 * PXMS, y1: 340, x2: BX + 30 * PXMS, y2: 720, stroke: 'ink', sw: 2, dash: '8 7', strokeOpacity: 0.7 });
  const lbl30 = S.text('30 ms', { x: BX + 30 * PXMS, y: 748, size: 24, anchor: 'middle', family: 'mono', color: 'muted', weight: 600 });
  const scaleTag = S.text('bars to scale', { x: BX, y: 760, size: 22, color: 'muted', weight: 550 });
  S.add(fx.draw(line30, { d: 0.6 }), "b1~Nvidia's+0.4");
  S.add(fx.in([lbl30, scaleTag], { from: 'fade', d: 0.4 }), "b1~Nvidia's+0.6");
  const bars = CH.map((c, i) => S.rect({ x: BX, y: ROWS[i] - 22, w: c.ms * PXMS, h: 44, r: 6, fill: 'url(#bar-bytes)' }));
  const vals = CH.map((c, i) => S.text(`${c.ms.toFixed(1)} ms`, { x: i === 1 ? BX + 30 * PXMS + 20 : BX + c.ms * PXMS + 16, y: ROWS[i] + 1, size: 30, family: 'mono', weight: 650, color: 'bytes' }));
  const grow = (i, at) => {
    S.add(gsap.fromTo(bars[i], { attr: { width: 0 } }, { attr: { width: CH[i].ms * PXMS }, duration: 0.8, ease: 'power3.out' }), at);
    S.add(fx.in(vals[i], { from: 'left', d: 0.35 }), S.t(at) + 0.6);
  };

  // ---------------------------------------------------------------- b1: H100
  setBand('3.35 TB/s = 3,350 GB/s', 'b1~a terabyte-0.1');
  S.add(fx.in(bandSub, { from: 'up', d: 0.35 }), 'b1~thousand');
  S.add(fx.out(bandSub, { d: 0.3 }), 'b1~forty-one-0.3');
  setBand(CH[0].band, 'b1~forty-one-0.1');
  grow(0, 'b1~forty-one');
  S.add(fx.in(cards[0].tags, { from: 'up', d: 0.35, stagger: 0.1 }), 'b1>-0.4');

  // ---------------------------------------------------------------- b2: H200, the 30 ms; B200
  S.add(gsap.to(cards[1], { opacity: 1, duration: 0.35 }), 'b2~H two');
  setBand(CH[1].band, 'b2~H two');
  grow(1, 'b2~twenty-nine-0.2');
  S.add(gsap.fromTo(bars[1], { filter: 'none' }, { filter: 'url(#glow-bytes)', duration: 0.4, yoyo: true, repeat: 1 }), 'b2~thirty');
  const stamp = S.pill('≈ 30 ms', { x: BX + 30 * PXMS, y: 312, h: 46, size: 28, tone: 'neutral', style: 'outline', mono: true });
  S.add(fx.pop(stamp), 'b2~thirty');
  const check = S.icon('ph:check-circle-duotone', { x: BX + 30 * PXMS + 92, y: 312, size: 40, color: 'helps' });
  S.add(fx.pop(check), 'b2~right');
  S.add(fx.in(cards[1].tags, { from: 'up', d: 0.35 }), 'b2~target');
  S.add(gsap.to(cards[2], { opacity: 1, duration: 0.35 }), 'b2~B two');
  setBand(CH[2].band, 'b2~B two');
  grow(2, 'b2~seventeen-0.2');

  // ---------------------------------------------------------------- b3: a division, the best case
  S.add(fx.dim([...cards[0].tags, ...cards[1].tags], { to: 0.3 }), 'b3');
  setBand('not a guess', 'b3~guess-0.3');
  setBand('not a benchmark', 'b3~benchmark-0.2');
  setBand('a division: the best case', 'b3~division-0.1');
  // model size: 140 GB → 70 GB, every bar halves, then springs back
  const MS = S.t('b3~model size');
  S.add(fx.swap(eq.parts[2], '70 GB'), MS - 0.1);
  S.add(gsap.to(vals, { autoAlpha: 0.15, duration: 0.25 }), MS - 0.1);
  bars.forEach((b, i) => {
    S.add(gsap.to(b, { attr: { width: CH[i].ms * PXMS / 2 }, duration: 0.5, ease: 'power2.inOut' }), MS);
    S.add(gsap.to(b, { attr: { width: CH[i].ms * PXMS }, duration: 0.5, ease: 'back.out(1.6)' }), MS + 1.1);
  });
  S.add(fx.swap(eq.parts[2], '140 GB'), MS + 1.0);
  S.add(gsap.to(vals, { autoAlpha: 1, duration: 0.3 }), MS + 1.4);
  S.add(fx.pulse(eq.parts[4], { scale: 1.12, d: 0.5 }), 'b3~memory speed');
  cards.forEach((c, i) => S.add(fx.pulse(c.name, { scale: 1.06, d: 0.35 }), S.t('b3~memory speed') + 0.15 + i * 0.15));

  // ---------------------------------------------------------------- b4: 24 tokens a second, not 33 — a clash?
  S.add(fx.swap(band, ''), 'b4');
  const quote = (txt, x) => { const g = S.pill(txt, { x, y: 248, h: 54, size: 28, tone: 'struct' }); return g; };
  const qR = quote('≈ 24 tokens/s · later', 1360), qL = quote('30 ms → 33 tokens/s', 560);
  S.add(fx.in(qR, { from: 'down', d: 0.4 }), 'b4~twenty-four');
  S.add(fx.in(qL, { from: 'down', d: 0.4 }), 'b4~not');
  const neq = S.text('≠', { x: 960, y: 250, size: 52, anchor: 'middle', color: 'ink', weight: 700 });
  S.add(gsap.fromTo(neq, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, yoyo: true, repeat: 4 }), 'b4~clash');
  S.add(gsap.to(neq, { autoAlpha: 1, duration: 0.1 }), S.t('b4~clash') + 0.6);
  const colH = S.text('tokens / s', { x: 1710, y: 294, size: 28, anchor: 'middle', color: 'ink', weight: 650 });
  const colS = S.text('= 1 s ÷ time', { x: 1710, y: 326, size: 22, anchor: 'middle', color: 'muted', weight: 550 });
  S.add(fx.in([colH, colS], { from: 'up', d: 0.4, stagger: 0.1 }), 'b4~One second');
  const cells = CH.map((c, i) => S.text(c.tps, { x: 1710, y: ROWS[i] + 1, size: 36, anchor: 'middle', family: 'mono', weight: 650, color: 'struct' }));
  S.add(fx.in(cells[0], { from: 'fade', d: 0.35 }), 'b4~twenty-three');
  const badge = (txt, y) => S.pill(txt, { x: 1710, y, h: 34, size: 20, tone: 'struct', style: 'outline' });
  const b24 = badge('≈ 24 · later', 432);
  S.add(gsap.to(qR, { x: 1710 - 1360, y: 432 - 248 + CY, scale: 0.4, transformOrigin: '50% 50%', duration: 0.5, ease: 'power2.in' }), 'b4~the H');
  S.add(gsap.to(qR, { autoAlpha: 0, duration: 0.22 }), 'b4~the H');
  S.add(fx.in(b24, { from: 'fade', d: 0.3 }), S.t('b4~the H') + 0.45);

  // ---------------------------------------------------------------- b5: same division, different chip
  S.add(fx.in([cells[1], cells[2]], { from: 'fade', d: 0.35, stagger: 0.15 }), 'b5~Same');
  const b33 = badge('33 · rounded from 30 ms', 572);
  S.add(gsap.to(qL, { x: 1710 - 560, y: 572 - 248 + CY, scale: 0.4, transformOrigin: '50% 50%', duration: 0.6, ease: 'power2.in' }), 'b5~Same+0.2');
  S.add(gsap.to(qL, { autoAlpha: 0, duration: 0.22 }), 'b5~Same+0.2');
  S.add(fx.in(b33, { from: 'fade', d: 0.3 }), S.t('b5~Same') + 0.75);
  S.add(fx.swap(neq, '='), 'b5~different');
  S.add(fx.out(neq, { d: 0.4 }), 'b5~chip+0.4');
  const take = S.takeaway('same division, different chips', { tone: 'bytes' });
  S.add(fx.in(take, { from: 'up', d: 0.5 }), 'b5~a habit-0.2');

  // the chart (cards, bars, the 30 ms line, later the tokens/s column) is one block, CY px down so it sits in the
  // middle under the rule and its worked line; until the column comes in b4 it is centred on its own (125 px
  // right), then it makes room
  const top = new Set([band, bandSub, qR, qL, neq, ...eq.parts.map(p => { let n = p; while (n.parentNode !== S.main) n = n.parentNode; return n; })]);
  const chart = S.g();
  [...S.main.children].filter(e => e !== chart && !top.has(e)).forEach(e => chart.appendChild(e));
  S.main.insertBefore(chart, S.main.firstChild);
  S.set(chart, { x: 125, y: CY }, 0);
  S.add(gsap.fromTo(chart, { x: 125 }, { x: 0, duration: 0.8, ease: 'power2.inOut', immediateRender: false }), S.t('b4') - 0.3);
});
