/* ch00_s01 · a thousand trillion operations, waiting (cold open)
   Movement 1 (b1): Spec sheet: GPU performs ~1,000 trillion ops every single second.
   Movement 2 (b2): 989.4 trillion operations packed on postage stamp die (814 mm²).
   Movement 3 (b3): Generates answer: engine spends >99% of time waiting for data. */

V.scene('ch00_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('A thousand trillion operations, waiting', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Die Counter Visual
  const dc = ch00DieCounter(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('the vast engine of arithmetic spends more than ninety-nine percent of its time waiting', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([dc.card, dc.title, dc.footer], { autoAlpha: 0 });
  S.set([dc.dieCard, dc.dieTitle, dc.dieSub, dc.dieStat1, dc.dieStat2, dc.diePill], { autoAlpha: 0 });
  S.set([dc.timeCard, dc.timeTitle, dc.waitBar, dc.calcBar, dc.calcLabel, dc.waitLabel, dc.timePill], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Spec sheet thousand trillion ops
  S.add(fx.in([dc.card, dc.title], { from: 'scale', d: 0.5 }), 'b1~specification-0.2');
  S.add(fx.in([dc.dieCard, dc.dieTitle], { from: 'scale', d: 0.4 }), 'b1~modern');
  S.add(fx.in(dc.dieStat1, { from: 'scale', d: 0.4 }), 'b1~thousand');

  // ---------------------------------------------------------------- b2: Postage stamp die (814 mm²)
  S.add(fx.in(dc.dieSub, { from: 'fade', d: 0.35 }), 'b2~additions-0.2');
  S.add(fx.in(dc.dieStat2, { from: 'fade', d: 0.35 }), 'b2~additions');
  S.add(fx.in(dc.diePill, { from: 'up', d: 0.4 }), 'b2~stamp.');
  S.add(fx.pulse([dc.dieCard, dc.dieStat1], { scale: 1.04, d: 0.4 }), 'b2~stamp.');

  // ---------------------------------------------------------------- b3: >99% waiting timeline
  S.add(fx.in([dc.timeCard, dc.timeTitle], { from: 'scale', d: 0.4 }), 'b3~language-0.2');
  S.add(fx.in([dc.waitBar, dc.waitLabel], { from: 'fade', d: 0.4 }), 'b3~waiting.');
  S.add(fx.in([dc.calcBar, dc.calcLabel], { from: 'fade', d: 0.35 }), 'b3~waiting.');
  S.add(fx.in(dc.timePill, { from: 'up', d: 0.4 }), 'b3~waiting.');
  S.add(fx.pulse([dc.timeCard, dc.timePill], { scale: 1.04, d: 0.45 }), 'b3~waiting.');
  S.add(fx.in(dc.footer, { from: 'up', d: 0.4 }), 'b3~waiting.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b3>-0.8');
});
