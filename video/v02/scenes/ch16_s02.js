/* ch16_s02 · prefill versus decode on the roofline (fig 86)
   Movement 1 (b1): Language model phases plotted on the H100 roofline.
   Movement 2 (b2): Decode: 1 token at a time -> 1 op/byte (starved on memory roof).
   Movement 3 (b3): Prefill: thousands of tokens -> ~2,000 op/byte (saturates compute ceiling).
   Movement 4 (b4): Same model and hardware live on opposite sides of the ridge. */

V.scene('ch16_s02', S => {
  const { fx } = S;

  // Heading
  const heading = S.heading('prefill versus decode on the roofline', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Roofline visual
  const R = ch16Roofline(S, {
    show: { roof: true, ceilings: false, regions: true, ridge: true, peakTag: false, slopeLabel: false },
    regionLabels: ['', '']
  });

  // Decode point at 1 op/byte
  const dec = R.point(1, { label: 'decode: 1 op/byte', tone: 'bytes', readout: false });

  // Prefill point at ~2,000 op/byte
  const pre = R.point(2000, { label: 'prefill: ~2,000 op/byte', tone: 'compute', labelSide: 'below' });

  // Intensity span bracket
  const br = R.bracket(1, 2000, { y: 730, label: '× 2,000 intensity span', tone: 'ink' });

  // Concluding Takeaway band
  const takeaway = S.takeaway('decode lives far left of the ridge; prefill lives far to the right', {
    tone: 'struct'
  });

  // Initial states
  S.set([takeaway], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Roofline in view
  S.add(R.drawAxes({ d: 0.6 }), 'b1~place-0.2');

  // ---------------------------------------------------------------- b2: Decode lands at 1 op/byte
  S.add(dec.in({ d: 0.7 }), 'b2~Decode-0.2');
  S.add(fx.pulse(dec.dot, { scale: 1.2, d: 0.4 }), 'b2~operation');

  // ---------------------------------------------------------------- b3: Prefill lands at ~2,000 op/byte
  S.add(pre.in({ d: 0.7 }), 'b3~Prefill-0.2');
  S.add(fx.pulse(pre.dot, { scale: 1.2, d: 0.4 }), 'b3~thousand');

  // ---------------------------------------------------------------- b4: Opposite sides of the ridge
  S.add(br.in({ d: 0.6 }), 'b4~opposite-0.2');
  S.add(fx.pulse([dec.dot, pre.dot], { scale: 1.15, d: 0.4, stagger: 0.15 }), 'b4~saturates');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
