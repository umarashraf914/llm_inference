/* ch18_s04 · closing (fig 149)
   A quiet ending: one token beside the 30 ms stopwatch, a coral stream under it and a still amber dot; the two
   lines of the film; then the end card: what comes next, the title and the series.
   b1  the pill, the stopwatch '30 ms', the stream and the dot; amber 'Arithmetic is cheap.' above, coral 'Data
       movement is expensive.' beneath.
   b2  everything rises and fades; 'Next: Inside the GPU'; 'The Memory Wall' and 'The Engineering Behind LLM
       Inference · video 1 of 9'.
   Layout: pill (870, 540), stopwatch (1030, 540); stream y 612 from x 700 to 1220; lines y 430 / 700; end card:
   title y 500, subtitle y 580, next card y 880. */
V.scene('ch18_s04', S => {
  const K = libKit(S), { T, cl, E, whole, setO, hide, fade } = K;
  const tB2 = T('b2') - 0.1;
  const rise = (e, at, dy = 12, d = 0.5) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };

  // ================================================================ b1: the two lines of the film
  const still = S.g(), stillIn = S.g(null, still);
  const pill = S.g(null, stillIn);
  S.rect({ x: 820, y: 516, w: 100, h: 48, r: 14, fill: '#0c1326' }, pill);
  S.rect({ x: 820, y: 516, w: 100, h: 48, r: 14, fill: 'url(#card-struct)', stroke: 'struct', sw: 2.5 }, pill);
  pill.setAttribute('data-audit', 'ignore');
  K.track(pill, [K.K(0.4, { y: -30, o: 0 }), K.K(1.0, { y: 0, o: 1, e: 'power3.out' })]);
  const watch = ch18Watch(S, { x: 1010, y: 540, size: 110, readout: 'right', readoutSize: 34, decimals: 0, value: 30, max: 30 }, stillIn);
  rise(watch, 0.6, 8, 0.6);
  const stream = S.path({ d: 'M700,612 H1220', stroke: 'bytes', sw: 4, dash: '14 10' }, stillIn);
  stream.setAttribute('data-audit', 'ignore');
  whole(t => { stream.setAttribute('stroke-dashoffset', (-50 * t).toFixed(1)); setO(stream, cl((t - 0.8) / 0.5)); });
  const dot = S.circle({ x: 1246, y: 612, r: 7, fill: 'compute' }, stillIn);
  dot.setAttribute('data-audit', 'ignore');
  whole(t => setO(dot, t < 1.2 ? 0 : 0.85 + 0.15 * Math.cos(Math.PI * 2 * cl((t - 1.3) / 0.5))));
  const l1 = S.text('Arithmetic is cheap.', { x: 960, y: 430, size: 48, weight: 800, anchor: 'middle', color: 'compute' }, stillIn);
  rise(l1, T('b1~Arithmetic') - 0.1, 10);
  const l2 = S.text('Data movement is expensive.', { x: 960, y: 700, size: 48, weight: 800, anchor: 'middle', color: 'bytes' }, stillIn);
  rise(l2, T('b1~Data') - 0.1, 10);
  S.add(K.drive(0.7, k => { setO(still, 1 - k); still.setAttribute('transform', `translate(0,${(-30 * E('power2.in')(k)).toFixed(1)})`); }), tB2);
  K.ignore(still, tB2, 0.75);

  // ================================================================ b2: what comes next; the end card
  const next = S.g();
  S.rect({ x: 760, y: 846, w: 400, h: 68, r: 18, fill: '#0c1326', stroke: 'struct', strokeOpacity: 0.7, sw: 2 }, next);
  S.icon('ph:cpu-duotone', { x: 806, y: 880, size: 40, color: 'struct' }, next);
  S.text('Next: Inside the GPU', { x: 840, y: 881, size: 28, weight: 750, color: 'ink' }, next);
  rise(next, T('b2~inside') - 0.15, 10, 0.6);
  const title = S.text('The Memory Wall', { x: 960, y: 500, size: 88, weight: 850, anchor: 'middle', color: 'ink' });
  rise(title, T('b2~the#2') - 0.05, 14, 0.8);
  const sub = S.text('The Engineering Behind LLM Inference · video 1 of 9', { x: 960, y: 580, size: 30, weight: 600, anchor: 'middle', color: 'muted' });
  rise(sub, T('b2~the#2') + 0.3, 8, 0.8);
});
