V.scene('ch01_s02', S => {
  const { fx } = S;
  const head = S.heading('Where thirty milliseconds comes from', { y: 140, size: 56 });
  S.add(fx.in(head.titleEl), 'b1-0.5');
  // the equation, term by term
  const eq = S.equation([
    { t: 'time per token', tone: 'ink' }, { t: '=', tone: 'muted' },
    { t: 'bytes to read', tone: 'bytes' }, { t: '÷', tone: 'muted' }, { t: 'bytes per second', tone: 'struct' },
  ], { x: 960, y: 270, size: 44 });
  S.add(fx.in(eq.parts[0], { from: 'up' }), 'b1~Time');
  S.add(fx.in(eq.parts[1], { from: 'fade' }), 'b1~bytes-0.2');
  S.add(fx.in(eq.parts[2], { from: 'up' }), 'b1~bytes');
  S.add(fx.in(eq.parts[3], { from: 'fade' }), 'b1~divided');
  S.add(fx.in(eq.parts[4], { from: 'up' }), 'b1~many');

  const rows = [
    { chip: 'H100', bw: '3.35 TB/s', ms: 41.8, beat: 'b2', w: 'H' },
    { chip: 'H200', bw: '4.8 TB/s', ms: 29.2, beat: 'b3', w: 'H' },
    { chip: 'B200', bw: '8 TB/s', ms: 17.5, beat: 'b3', w: 'B' },
  ];
  const y0 = 400, dy = 150, barX = 860, barW = 620, maxMs = 45;
  const weights = S.card({ x: 160, y: 380, w: 300, h: 380, tone: 'bytes', title: '140 GB', sub: 'of weights', layout: 'top', icon: 'ph:database-duotone', iconSize: 96, size: 52, subSize: 30 });
  S.add(fx.in(weights, { from: 'left' }), 'b2~hundred');
  rows.forEach((r, i) => {
    const y = y0 + i * dy;
    const g = S.g();
    const chip = S.pill(r.chip, { x: 520, y: y + 30, anchor: 'start', h: 64, size: 30, tone: 'struct', w: 150 }, g);
    const bw = S.text(r.bw, { x: 690, y: y + 31, size: 28, family: 'mono', color: 'struct' }, g);
    const bar = S.bar({ x: barX, y: y + 8, w: barW, h: 44, frac: r.ms / maxMs, tone: 'bytes' }, g);
    const val = S.counter({ x: barX + barW * r.ms / maxMs + 22, y: y + 31, size: 34, color: 'ink', fmt: S.fmt.fixed(1), suffix: ' ms', value: 0 }, g);
    r.g = g; r.bar = bar; r.val = val; r.y = y;
    const at = i === 0 ? 'b2~H' : i === 1 ? 'b3~H' : 'b3~B';
    S.add(fx.in([chip, bw], { from: 'left', stagger: 0.1 }), at);
    S.add(fx.grow(bar, { d: 1.2 }), `${at}+0.5`);
    S.add(fx.in(val, { from: 'fade', d: 0.3 }), `${at}+0.5`);
    S.add(fx.count(val, 0, r.ms, { d: 1.2, fmt: S.fmt.fixed(1) }), `${at}+0.5`);
  });
  // b4: the middle row is the thirty
  const halo = S.halo({ x: 500, y: y0 + dy - 6, w: 1240, h: 74, tone: 'compute' });
  const badge = S.pill('≈ 30 ms', { x: 1640, y: y0 + dy + 31, h: 60, size: 30, tone: 'compute', style: 'solid' });
  S.add(fx.in(halo, { from: 'fade' }), 'b4~middle');
  S.add(fx.dim([rows[0].g, rows[2].g], { to: 0.35 }), 'b4~middle');
  S.add(fx.pop(badge), 'b4~thirty');
  const tag = S.takeaway('Not a guess. A division.', { tone: 'compute' });
  S.add(fx.in(tag, { from: 'up' }), 'b4~division');
});
