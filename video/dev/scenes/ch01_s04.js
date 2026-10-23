V.scene('ch01_s04', S => {
  const { fx } = S;
  const cyc = S.cycle({ x: 520, y: 540, r: 260, stations: [
    { label: 'text so far', icon: 'ph:text-align-left-duotone', tone: 'struct' },
    { label: 'run the model', icon: 'ph:cpu-duotone', tone: 'compute' },
    { label: 'one new token', icon: 'ph:plus-circle-duotone', tone: 'helps' }], cardW: 300, cardH: 92 });
  S.add(fx.draw(cyc.ring, { d: 1 }), 'b1');
  S.add(fx.pop(cyc.stations, { stagger: 0.25 }), 'b1+0.3');
  S.add(fx.in(cyc.arrows, { from: 'fade' }), 'b1+1');
  S.add(fx.orbit(cyc, { from: 0, to: 6, d: 4 }), 'b1~round');
  const bc = S.barChart({ x: 980, y: 300, w: 560, labelW: 300, rowH: 54, items: [
    { label: 'from a disk', value: 20000, text: '≈ 20,000 ms', tone: 'bytes' },
    { label: 'from HBM', value: 42, text: '≈ 42 ms', tone: 'bytes' }], log: true, min: 1, max: 20000, track: true });
  S.add(fx.in(bc.rows.map(r => r.label), { from: 'right' }), 'b2');
  bc.rows.forEach((r, i) => { S.add(fx.grow(r.bar), i ? 'b2~forty' : 'b2~twenty'); S.add(fx.in(r.value, { from: 'fade' }), i ? 'b2~forty+0.6' : 'b2~twenty+0.6'); });
  const tb = S.table({ x: 980, y: 560, cols: [{ w: 330 }, { w: 220, mono: true, align: 'right' }, { w: 200, color: 'muted' }],
    header: ['LINE', 'VALUE', 'KIND'], rows: [['Memory capacity', '80 GB', 'an amount'], ['Memory bandwidth', '3.35 TB/s', 'a rate'], ['Peak compute', '989 TFLOP/s', 'a rate'], ['Power draw', '700 W', 'a rate']], rowH: 58, size: 26 });
  S.add(fx.in(tb.rowEls, { from: 'up', stagger: 0.12 }), 'b3');
});
