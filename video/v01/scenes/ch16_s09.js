/* ch16_s09 · warm because shared, cheap because warm (fig 55)
   A cached read (an input token already held) skips prefill, so it is cheap to serve; providers price it at
   roughly a tenth of a fresh one. Illustratively, case C's 777 input tokens bill like 770 × 0.1 + 7 = 84 fresh
   ones (checked); to scale at 777 units = 1,000 px that is a 108 px bar. Real discounts vary.
   b1  left: the shared block with its nine users and its keys and values (coral, teal-outlined); right: a price
       tag, a teal pill 'cached read: an input hit', a crossed-out prefill gear, 'cheap to serve'; two bars to
       scale: fresh 400 px, cached 40 px, 'about 1/10'.
   b2  the bill for case C: '770 cached × 0.1 = 77', '+ 7 fresh = 84'; bars to scale, 108 px 'billed like 84'
       against 1,000 px 'all fresh: 777'; 'illustrative; real discounts vary'.
   b3  the bill fades; the arrows pulse into the shared block, 'the one block everybody shares'; 'warm because
       shared, cheap because warm'.
   Layout: left half x 120-820 (users y 360, block y 530, tiles y 620); right half x 1000-1860 (tag y 350, pill
   y 440, price bars y 540 / 608); bill x 120, y 772-870; bill bars x 820-1820, y 800 / 866; bottom line y 960.
   The two halves (x 134-1690 as drawn) are moved 48 right, centred as a pair; the bill and the bottom line are
   centred as drawn. */
V.scene('ch16_s09', S => {
  const K = libKit(S), { T, cl, E, EIO, whole, setO, hide, fade } = K;
  const tB3 = T('b3') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };

  // ================================================================ b1: a cached read is cheap to serve
  const left = S.g();
  const arrows = [];
  for (let i = 0; i < 9; i++) {
    const ux = 150 + 80 * i;
    S.icon('ph:user-duotone', { x: ux, y: 360, size: 40, color: 'struct' }, left);
    const p = S.path({ d: `M${ux},386 C${ux},440 ${330 + 35 * i},450 ${330 + 35 * i},498`, stroke: 'struct', sw: 2.5 }, left);
    p.setAttribute('data-audit', 'ignore');
    arrows.push(p);
  }
  S.rect({ x: 270, y: 502, w: 400, h: 56, r: 14, fill: CH16.BASE }, left);
  const blk = S.rect({ x: 270, y: 502, w: 400, h: 56, r: 14, fill: '#1d3566', stroke: 'struct', sw: 2.5 }, left);
  S.text('system prompt', { x: 470, y: 531, size: 26, weight: 650, anchor: 'middle', color: 'ink' }, left);
  for (let i = 0; i < 14; i++) {
    const x = 290 + 26 * i;
    ch16KV(S, x + 7, 620, 14, 34, left);
    S.rect({ x: x - 3, y: 600, w: 20, h: 40, r: 5, stroke: 'helps', sw: 1.8 }, left);
  }
  S.text('its keys and values, held', { x: 470, y: 672, size: 24, weight: 700, anchor: 'middle', color: 'bytes' }, left);
  rise(left, 0.5, 10, 0.5);
  const tCheap = T('b1~cheap#2') - 0.1;
  const cheap = S.pill('cheap to serve', { x: 470, y: 730, tone: 'helps', size: 26, h: 44 });
  rise(cheap, tCheap, 6);
  // right half: the price of an input token
  const tagG = S.g();
  S.icon('ph:tag-duotone', { x: 1030, y: 350, size: 56, color: 'compute' }, tagG);
  S.text('price per input token', { x: 1072, y: 351, size: 28, weight: 750, color: 'ink' }, tagG);
  rise(tagG, 0.8, 8);
  const tRead = T('b1~cached') - 0.1, tSkip = T('b1~skips') - 0.1, tTenth = T('b1~tenth') - 0.25;
  const pill = ch16Cell(S, { x: 1004, y: 440, w: 110, h: 50, r: 16, label: 'token', size: 24, plan: [[0, 'teal']] });
  rise(pill, tRead, 6);
  const readT = S.text('cached read: an input hit', { x: 1134, y: 441, size: 26, weight: 700, color: 'helps' });
  rise(readT, tRead + 0.2, 6);
  const gear = S.g();
  S.icon('ph:gear-six-duotone', { x: 1560, y: 440, size: 50, color: 'compute' }, gear);
  S.text('prefill', { x: 1600, y: 441, size: 24, weight: 700, color: 'compute' }, gear);
  rise(gear, tSkip - 0.1, 6);
  const gx = S.path({ d: 'M1532,412 L1588,468 M1588,412 L1532,468', stroke: 'muted', sw: 4.5 });
  gx.setAttribute('data-audit', 'ignore');
  K.draw(gx, 170, tSkip + 0.35, 0.3);
  const bar = (y, label, tone, w, at, tag) => {
    const g = S.g();
    S.text(label, { x: 1270, y: y + 1, size: 26, weight: 700, anchor: 'end', color: tone }, g);
    const r = S.rect({ x: 1290, y: y - 18, w: 0, h: 36, r: 6, fill: `url(#card-${tone})`, stroke: tone, sw: 2.5 }, g);
    whole(t => r.setAttribute('width', Math.max(0.01, w * E('power3.out')(cl((t - at - 0.2) / 0.6))).toFixed(1)));
    if (tag) S.text(tag, { x: 1290 + w + 14, y: y + 1, size: 26, weight: 750, color: tone }, g);
    rise(g, at, 0, 0.3);
    return g;
  };
  bar(540, 'fresh input token', 'compute', 400, tTenth);
  bar(608, 'cached input token', 'helps', 40, tTenth + 0.25, 'about 1/10');

  // ================================================================ b2: an illustrative bill for case C
  const tIll = T('b2~Illustratively') - 0.1;
  const bill = S.g();
  const billH = S.text('case C, illustrative', { x: 120, y: 790, size: 26, weight: 700, color: 'muted' }, bill);
  rise(billH, tIll, 6);
  const l1 = S.text('770 cached × 0.1 = 77', { x: 120, y: 838, size: 32, weight: 750, color: 'helps' }, bill);
  rise(l1, T('b2~seven') - 0.1, 6);
  const l2 = S.text('+ 7 fresh = 84', { x: 120, y: 888, size: 32, weight: 750, color: 'compute' }, bill);
  rise(l2, T('b2~input') - 0.1, 6);
  const U = 1000 / 777;
  const bb = (y, w, tone, label, at, inside) => {
    const g = S.g(null, bill);
    const r = S.rect({ x: 820, y: y - 20, w: 0, h: 40, r: 7, fill: `url(#card-${tone})`, stroke: tone, sw: 2.5 }, g);
    whole(t => r.setAttribute('width', Math.max(0.01, w * EIO(cl((t - at) / 0.7))).toFixed(1)));
    S.text(label, inside ? { x: 820 + w / 2, y: y + 1, size: 26, weight: 750, anchor: 'middle', color: 'ink' } : { x: 820 + w + 14, y: y + 1, size: 26, weight: 750, color: tone }, g);
    rise(g, at, 0, 0.3);
    return g;
  };
  bb(866, 777 * U, 'compute', 'all fresh: 777', T('b2~seventyseven') - 0.1, true);
  bb(800, 84 * U, 'helps', 'billed like 84', T('b2~eightyfour') - 0.15, false);
  const scaleN = S.text('to scale: 777 tokens = 1,000 px', { x: 1820, y: 756, size: 22, weight: 600, anchor: 'end', color: 'muted' }, bill);
  rise(scaleN, T('b2~seventyseven') + 0.3, 0);
  const foot = S.text('illustrative; real discounts vary', { x: 1820, y: 922, size: 22, weight: 600, anchor: 'end', color: 'muted' }, bill);
  rise(foot, T('b2~fresh') - 0.1, 6);

  // ================================================================ b3: warm because shared, cheap because warm
  fade(bill, 1, 0, tB3, 0.45);
  const tW = T('b3~warmth') - 0.1;
  const head = S.text('the one block everybody shares', { x: 470, y: 286, size: 30, weight: 750, anchor: 'middle', color: 'ink' });
  rise(head, tB3 + 0.2, 8);
  arrows.forEach((p, i) => whole(t => { const k = Math.sin(Math.PI * cl((t - tW - 0.12 * i) / 0.5)); p.setAttribute('stroke', k > 0.05 ? S.tone('helps') : S.tone('struct')); p.setAttribute('stroke-width', (2.5 + 2.5 * k).toFixed(2)); }));
  whole(t => blk.setAttribute('stroke', S.tone(t > tW + 1.2 ? 'helps' : 'struct')));
  const end = S.text('warm because shared, cheap because warm', { x: 960, y: 960, size: 36, weight: 800, anchor: 'middle', color: 'ink' });
  rise(end, T('b3~shared') - 0.1, 10);
  // the two halves, centred as a pair (see the header)
  const halves = S.g();
  [...S.main.children].filter(e => e !== halves && e !== bill && e !== end).forEach(e => halves.appendChild(e));
  halves.setAttribute('transform', 'translate(48,0)');
});
