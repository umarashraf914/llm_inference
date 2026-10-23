/* demo_hardware · the hardware family (lib/hardware.js) in its main states.
   b1 chips · b2 spec sheets · b3 the user's device and the server · b4 a data-centre pull-back */
V.scene('demo_hardware', S => {
  const { fx } = S;
  const page = () => S.g();
  const showPage = (g, at, until) => {
    S.add(gsap.fromTo(g, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }), at);
    if (until) S.add(gsap.to(g, { autoAlpha: 0, duration: 0.25 }), until);
  };

  // ================================================================ b1: chips at every size
  const p1 = page();
  showPage(p1, 'b1-0.45', 'b2-0.05');
  const hero = libChip(S, { x: 520, y: 470, size: 240, label: 'H100', sub: 'idle → on → busy', state: 'idle' }, p1);
  S.add(hero.drawOn({ d: 1.1 }), 'b1');
  S.add(hero.wake({ d: 0.8 }), 'b1+1.3');
  S.add(hero.compute({ d: 1.6 }), 'b1+2.0');
  S.add(hero.pulse(), 'b1+3.1');

  // a row of sizes, one per film use
  const sizes = [24, 40, 64, 104];
  const row = sizes.map((s, i) => libChip(S, { x: 1000 + [0, 90, 215, 400][i], y: 300, size: s, seed: i + 2 }, p1));
  S.add(fx.pop(row, { stagger: 0.08 }), 'b1+0.3');
  S.add(row[3].flash(), 'b1+2.2');
  const sizeTag = S.text('20 – 300 px, one drawing', { x: 1210, y: 420, size: 26, color: 'muted', anchor: 'middle' }, p1);
  S.add(fx.in(sizeTag), 'b1+0.6');

  // package icons (hbm) with a name to the right, an outline chip, an idle chip
  const g1 = libChip(S, { x: 1080, y: 560, size: 64, hbm: 1, label: 'H100', labelPos: 'right' }, p1);
  const g2 = libChip(S, { x: 1460, y: 560, size: 64, hbm: 2, label: 'B200', labelPos: 'right', state: 'busy' }, p1);
  S.add(fx.in([g1, g2], { from: 'left', stagger: 0.15 }), 'b1+0.8');
  const outl = libChip(S, { x: 1640, y: 300, size: 64, style: 'outline', seed: 5 }, p1);
  S.add(fx.pop(outl), 'b1+0.6');

  // "thousands of chips": a dense grid that wakes in a ripple
  const farm = libChipGrid(S, { x: 1260, y: 790, rows: 3, cols: 12, size: 22, gap: 12, chip: { state: 'idle' } }, p1);
  S.add(farm.reveal({ stagger: 0.012 }), 'b1+1.0');
  S.add(farm.setState('busy', { stagger: 0.02, from: 'center' }), 'b1+2.0');
  const farmTag = S.text('libChipGrid · 36 chips', { x: 1260, y: 905, size: 26, color: 'muted', anchor: 'middle' }, p1);
  S.add(fx.in(farmTag), 'b1+1.2');

  // ================================================================ b2: spec sheets
  const p2 = page();
  showPage(p2, 'b2+0.15', 'b3-0.05');
  // the cold open's sheet: placeholder lines; two brighten, then resolve
  const cold = libSpecSheet(S, {
    x: 110, y: 150, w: 640, title: 'chip spec sheet', start: 'placeholder', rowStyle: 'inline', rowH: 54,
    rows: [null, { label: 'operations per second', value: '?', tone: 'compute' }, null, { label: 'bytes per second', value: '?', tone: 'bytes' }, null, null],
  }, p2);
  S.add(fx.in(cold, { from: 'left' }), 'b2+0.15');
  S.add(cold.brighten([1, 3]), 'b2+0.5');
  S.add(cold.reveal(1), 'b2+1.0');
  S.add(cold.reveal(3), 'b2+1.5');
  S.add(cold.glow(1), 'b2+2.1');
  S.add(cold.setValue(3, '3.35 TB/s'), 'b2+2.6');

  // the H100's sheet: a printed page; rows land, one is focused, then it flips to the H200
  const h100 = libSpecSheet(S, {
    x: 900, y: 150, w: 900, title: 'H100', kicker: 'spec sheet', icon: 'doc', fold: true, valueStyle: 'pill', start: 'empty',
    rows: [
      { label: 'Memory capacity', value: '80 GB', tone: 'struct', tag: 'an amount' },
      { label: 'Memory bandwidth', value: '3.35 TB/s', tone: 'bytes', tag: 'a rate' },
      { label: 'Peak compute', value: '989 TFLOP/s', tone: 'compute', tag: 'a rate' },
      { label: 'Power draw', value: '700 W', tone: 'neutral', tag: 'a rate' },
    ],
  }, p2);
  S.add(fx.in(h100, { from: 'right' }), 'b2+0.15');
  S.add(h100.reveal('all', { stagger: 0.25 }), 'b2+0.2');
  S.add(h100.focus(1), 'b2+1.6');
  S.add(h100.glow(1, { part: 'value' }), 'b2+2.0');
  S.add(h100.flip({ title: 'H200', values: { 0: '141 GB', 1: '4.8 TB/s' } }), 'b2+2.6');

  // compact chip cards, as in the three-chip table
  const cards = [['H100', '3.35 TB/s', 'holds 80 GB'], ['H200', '4.8 TB/s', 'holds 141 GB'], ['B200', '8 TB/s', 'holds 192 GB']].map(([n, v, note], i) =>
    libSpecSheet(S, { layout: 'row', x: 110 + i * 480, y: 760, w: 440, title: n, rows: [{ value: v, tone: 'bytes' }], note }, p2));
  S.add(fx.in(cards, { stagger: 0.12 }), 'b2+0.4');
  S.add(fx.dim(cards.slice(1), { to: 0.5 }), 'b2+0.9');
  S.add(cards[0].glow(0, { part: 'value' }), 'b2+1.4');
  S.add(cards[0].count(0, 0, 3.35, { fmt: v => v.toFixed(2) + ' TB/s', d: 1.0 }), 'b2+1.4');

  // ================================================================ b3: the user's device and the server
  const p3 = page();
  showPage(p3, 'b3+0.15', 'b4-0.05');
  const lap = libDevice(S, { x: 330, y: 400, w: 340, chip: true, label: 'your laptop', sub: 'one small chip' }, p3);
  const srv = libServer(S, { x: 1440, y: 330, w: 480, gpus: 4, spinner: true, label: 'A server', sub: 'a few GPUs, always on' }, p3);
  const a = lap.port('right', 16), b = srv.port('left', 16);
  const wire = S.path({ d: `M${a.x},${a.y} C${a.x + 260},${a.y} ${b.x - 260},${b.y} ${b.x},${b.y}`, stroke: 'struct', sw: 3, dash: '10 9', strokeOpacity: 0.6 }, p3);
  const globe = S.icon('ph:globe-hemisphere-west-duotone', { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, size: 56, color: 'struct' }, p3);
  S.add(fx.in(wire, { from: 'fade', d: 0.6 }), 'b3+0.2');
  S.add(fx.pop(globe), 'b3+0.3');
  const q = typeof libToken === 'function' ? libToken(S, { text: 'your question', x: a.x + 120, y: a.y - 75 }, p3) : null;
  if (q) {
    S.set(q, { autoAlpha: 0 }, 0);
    S.add(gsap.fromTo(q, { autoAlpha: 1, x: 0, y: 0 }, { x: b.x - a.x - 290, y: b.y - a.y, duration: 1.0, ease: 'power2.inOut' }), 'b3+0.4');
    S.add(gsap.to(q, { autoAlpha: 0, duration: 0.2 }), 'b3+1.25');
  }
  S.add(srv.open(), 'b3+1.2');
  S.add(srv.activity({ d: 2.2 }), 'b3+1.4');
  S.add(srv.spin({ d: 2.0 }), 'b3+1.4');
  S.add(lap.chip.pulse(), 'b3+0.6');
  S.add(lap.close(), 'b3+1.6');
  S.add(lap.open(), 'b3+2.6');

  const phone = libDevice(S, { kind: 'phone', x: 150, y: 800, w: 100, label: 'phone' }, p3);
  S.add(phone.ping(), 'b3+2.0');
  const tiny = [
    libServer(S, { x: 640, y: 800, w: 190, badge: { icon: 'ph:user-duotone' }, label: 'for you' }, p3),
    libServer(S, { x: 900, y: 800, w: 190, badge: { icon: 'ph:globe-duotone', tone: 'violet' }, label: 'for everyone' }, p3),
    libServer(S, { x: 1160, y: 800, w: 190, badge: { text: 'KV cache', tone: 'helps' }, label: 'holds prefix' }, p3),
  ];
  S.add(fx.in(tiny, { stagger: 0.1 }), 'b3+0.2');
  S.add(tiny[2].glow({ tone: 'helps' }), 'b3+1.8');
  const pre = libRack(S, { x: 1540, y: 790, w: 116, units: 5, tone: 'compute', label: 'prefill' }, p3);
  const dec = libRack(S, { x: 1740, y: 790, w: 116, units: 5, tone: 'bytes', label: 'decode' }, p3);
  S.add(fx.in([pre, dec], { stagger: 0.1 }), 'b3+0.3');
  S.add(pre.blink({ d: 2.6 }), 'b3+0.8');
  S.add(dec.blink({ d: 2.6, seed: 9 }), 'b3+0.8');
  S.add(dec.highlight(2, { tone: 'bytes' }), 'b3+2.2');

  // ================================================================ b4: a data-centre pull-back
  const p4 = page();
  showPage(p4, 'b4+0.1');
  const dc = libDataCentre(S, { x: 960, y: 600, rows: 3, racks: 8, units: 8, rackW: 420, hero: { row: 1, rack: 3, unit: 4 } }, p4);
  const u = dc.unitBox(1, 3, 4);
  S.add(fx.cam({ x: u.cx, y: u.cy, scale: 1.6, d: 0.05 }), 'b4');
  S.add(fx.cam({ x: dc.cx, y: dc.cy, scale: 1000 / dc.h, d: 1.8, ease: 'expo.inOut' }), 'b4+0.5');
  S.set(dc.labelEl, { autoAlpha: 0 }, 0);                      // the label lands once the camera settles
  S.add(fx.in(dc.labelEl, { from: 'up', d: 0.5 }), 'b4+2.3');
  S.add(dc.hero.activity({ d: 1.2 }), 'b4');
  S.add(dc.spinFans({ d: 3 }), 'b4+0.6');
  S.add(dc.blink({ d: 2.8 }), 'b4+0.6');
  S.add(dc.highlightRack(1, 3, { tone: 'helps' }), 'b4+2.2');
});
