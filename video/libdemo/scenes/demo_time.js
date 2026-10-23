/* demo_time · the time family (lib/time.js) in its main states.
   b1 libStopwatch at three sizes: run + flash, flicker + laps, words + marks, crossed out.
   b2 libTimeAxis: the film's 30 ms bar (sliver, dimension line, trim to 29.2 ms) and two to-scale rows.
   b3 libTimeAxis: chips streaming onto a 1 s ruler, the ruler rescaling to 16 s; a log axis with markers.
   b4 libTimeline: 'made' vs 'seen' lanes, streams, arrows, brackets and a sweeping band. */
V.scene('demo_time', S => {
  const { fx } = S;
  const title = (t, at, until) => {
    const el = S.text(t, { x: 960, y: 150, size: 30, anchor: 'middle', color: 'faint', weight: 600, family: 'mono' });
    S.add(fx.in(el, { from: 'fade', d: 0.4 }), at);
    if (until) S.add(fx.out(el, { d: 0.3 }), until);
    return el;
  };
  const caption = (t, x, y, parent) => S.text(t, { x, y, size: 26, anchor: 'middle', color: 'muted', weight: 500 }, parent);

  // ================================================================ b1: stopwatches
  title('libStopwatch', 'b1', 'b2-0.1');
  const m1 = S.g();
  const A = libStopwatch(S, { x: 430, y: 520, size: 360, tone: 'bytes', text: '?', label: 'slowed down' }, m1);
  const B = libStopwatch(S, { x: 1010, y: 520, size: 220 }, m1);
  const C = libStopwatch(S, { x: 1420, y: 470, size: 150, readout: 'right', texts: ['tens of ms'], marks: [{ ms: 15, tone: 'helps' }, { ms: 42, tone: 'compute' }] }, m1);
  const D = libStopwatch(S, { x: 1500, y: 760, size: 100, readout: 'none' }, m1);
  const capA = caption('run 0 → 30 ms, flash', 430, 912, m1);
  const capB = caption('flicker, then laps of 30 ms', 1010, 912, m1);
  const capC = caption('words, target marks', 1530, 590, m1);
  const capD = caption('crossed out', 1500, 860, m1);
  S.add(A.in(), 'b1');
  S.add(B.in(), 'b1+0.1');
  S.add(C.in(), 'b1+0.2');
  S.add(D.in(), 'b1+0.3');
  S.add(fx.in([capA, capB, capC, capD], { from: 'up', d: 0.5, stagger: 0.08 }), 'b1+0.3');
  S.add(A.run(0, 30, { d: 2.0 }), 'b1+0.6');
  S.add(A.flash({ tone: 'bytes' }), 'b1+2.8');
  S.add(B.flicker(1.3, { seed: 3 }), 'b1+0.5');
  S.add(B.set(0, { d: 0.01 }), 'b1+1.8');
  S.add(B.laps(3, 30, { every: 0.55 }), 'b1+1.9');
  S.add(C.show('tens of ms'), 'b1+0.9');
  S.add(C.run(0, 42, { d: 1.4 }), 'b1+1.8');
  S.add(C.mark(0, { tone: 'muted' }), 'b1+2.3');
  S.add(D.cross(), 'b1+2.2');
  S.add(fx.out(m1, { d: 0.35 }), 'b2-0.1');

  // ================================================================ b2: time axis, spans
  title('libTimeAxis · spans', 'b2+0.2', 'b3-0.1');
  const m2 = S.g();
  // the film's 30 ms bar: a sliver of arithmetic, the rest, a dimension line
  const bar = libTimeAxis(S, { x: 210, y: 420, w: 1500, t0: 0, t1: 30, ticks: false, line: false, barH: 76, gap: 0 }, m2);
  const sliver = bar.span(0, 0.1, { tone: 'compute', square: 'right', label: 'arithmetic, 0.1 ms', labelPos: 'above' });
  const rest = bar.span(0.1, 30, { tone: 'bytes', square: 'left', label: 'something else' });
  const dim = bar.bracket(0, 30, { label: '≈ 30 ms per token', y: 458 });
  S.add(rest.grow({ d: 1.0 }), 'b2+0.3');
  S.add(sliver.grow({ d: 0.3 }), 'b2+1.0');
  S.add(dim.draw(), 'b2+1.1');
  S.add(sliver.to(0, 0.14, { d: 0.5 }), 'b2+2.5');
  S.add(rest.to(0.14, 29.2, { d: 0.5 }), 'b2+2.5');
  S.add(dim.to(0, 29.2, { d: 0.5 }), 'b2+2.5');
  // two rows on one ruler: a sliver against a long bar, the long one counting as it grows
  const rows = libTimeAxis(S, { x: 260, y: 880, w: 1400, t0: 0, t1: 45, ticks: 5, rows: 2, barH: 56, rowGap: 18, gap: 18 }, m2);
  const ar = rows.span(0, 0.14, { tone: 'compute', row: 0, label: 'arithmetic {v}' });
  const rd = rows.span(0, 41.8, { tone: 'bytes', row: 1, label: 'reading the weights {v}' });
  const done = rows.marker(41.8, { label: 'token done' });
  S.add(rows.draw({ d: 0.9 }), 'b2+0.5');
  S.add(ar.grow({ d: 0.3 }), 'b2+1.2');
  S.add(rd.grow({ d: 1.6, ease: 'power1.inOut' }), 'b2+1.4');
  S.add(done.draw(), 'b2+3.0');
  S.add(fx.out(m2, { d: 0.35 }), 'b3-0.1');

  // ================================================================ b3: stream, rescale, log axis
  title('libTimeAxis · stream, rescale, log', 'b3+0.2', 'b4-0.1');
  const m3 = S.g();
  const ruler = libTimeAxis(S, { x: 260, y: 470, w: 1400, t0: 0, t1: 1, unit: 's', ticks: 0.1, minor: 0, arrow: true }, m3);
  const st = ruler.stream({ from: 0.03, every: 0.03, count: 33, h: 40, w: 30 });
  const sec = ruler.bracket(0, 1, { label: '33 tokens', side: 'above', style: 'bracket', y: 372 });
  S.add(ruler.draw({ d: 0.7 }), 'b3+0.2');
  S.add(st.play({ d: 1.9 }), 'b3+0.6');
  S.add(sec.draw(), 'b3+2.4');
  S.add(ruler.rescale(0, 16, { ticks: 2, d: 1.1 }), 'b3+2.75');
  const lg = libTimeAxis(S, { x: 260, y: 820, w: 1400, t0: 0.1, t1: 1e5, log: true, rows: 1, barH: 40 }, m3);
  const mk1 = lg.marker(0.14, { label: 'arithmetic 0.14 ms', tone: 'compute', anchor: 'start' });
  const mk2 = lg.marker(41.8, { label: 'one token 41.8 ms', tone: 'bytes' });
  const mk3 = lg.marker(20000, { label: 'from disk 20 s', tone: 'muted' });
  S.add(lg.draw({ d: 0.9 }), 'b3+0.5');
  S.add(mk1.draw(), 'b3+1.3');
  S.add(mk2.draw(), 'b3+1.7');
  S.add(mk3.draw(), 'b3+2.1');
  S.add(fx.out(m3, { d: 0.35 }), 'b4-0.1');

  // ================================================================ b4: lanes, made vs seen
  title('libTimeline', 'b4+0.1');
  const m4 = S.g();
  const tl = libTimeline(S, {
    x: 150, y: 380, w: 1620, labelW: 250, laneH: 64, gap: 110, t0: 0, t1: 400,
    lanes: [{ label: 'made', icon: 'ph:cpu-duotone', tone: 'ink', iconTone: 'compute' }, { label: 'seen', icon: 'ph:laptop-duotone', tone: 'ink', iconTone: 'struct' }],
  }, m4);
  const made = tl.stream(0, { from: 30, every: 30, count: 13 });
  const seen = tl.stream(1, { from: 95, every: 30, count: 11 });
  const arrows = [0, 1, 2].map(k => tl.arrow(0, made.times[k], 1, seen.times[k]));
  const b30 = tl.bracket(0, 90, 120, { label: '30 ms' });
  const b65 = tl.bracket(1, 30, 95, { label: '65 ms trip', side: 'below', tone: 'struct' });
  const band = tl.band(150, 215, { tone: 'helps', label: '≈ 2 in flight' });
  S.add(tl.draw({ d: 0.8 }), 'b4');
  S.add(made.play({ d: 1.8 }), 'b4+0.5');
  S.add(seen.play({ d: 1.8 * (seen.times[10] - seen.times[0]) / (made.times[12] - made.times[0]) }), `b4+${(0.5 + made.at(0) + 65 * 1.8 / 360).toFixed(3)}`);
  arrows.forEach((a, k) => S.add(a.draw({ d: 0.3 }), `b4+${(0.5 + made.at(k) + 0.05).toFixed(3)}`));
  S.add(b30.draw(), 'b4+1.4');
  S.add(b65.draw(), 'b4+1.6');
  S.add(band.grow({ d: 0.4 }), 'b4+1.9');
  S.add(band.moveTo(300, 365, { d: 1.0 }), 'b4+2.4');
});
