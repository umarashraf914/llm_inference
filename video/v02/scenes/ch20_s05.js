/* ch20_s05 · the generational interconnect gap (fig 113)
   Movement 1 (b1): Interconnect bandwidth grows, but ratio to local memory stays fixed.
   Movement 2 (b2): A100: HBM 2,039 GB/s vs NVLink 300 GB/s (6.8x gap).
   Movement 3 (b3): H100: HBM 3,352 GB/s vs NVLink 450 GB/s (7.4x gap).
   Movement 4 (b4): B200: HBM 8,000 GB/s vs NVLink 900 GB/s (8.9x gap). */

V.scene('ch20_s05', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('The generational interconnect gap', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Generational Gap Visual
  const gap = ch20GenerationalGap(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('local memory remains roughly 7 to 9 times faster than peer GPU communication across all generations', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([gap.card, gap.title, gap.footer], { autoAlpha: 0 });
  gap.colEls.forEach(c => {
    S.set(c.bc, { autoAlpha: 0 });
    S.set([c.tn, c.ta, c.th, c.tv, c.tr], { autoAlpha: 0 });
  });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Generational ratio stays fixed
  S.add(fx.in([gap.card, gap.title], { from: 'scale', d: 0.5 }), 'b1~rapidly-0.2');

  // ---------------------------------------------------------------- b2: A100 (6.8x gap)
  const a100 = gap.colEls[0];
  S.add(fx.in(a100.bc, { from: 'scale', d: 0.4 }), 'b2~hundred-0.2');
  S.add(fx.in([a100.tn, a100.ta, a100.th, a100.tv], { from: 'fade', d: 0.35 }), 'b2~hundred');
  S.add(fx.in(a100.tr, { from: 'up', d: 0.4 }), 'b2~seven');

  // ---------------------------------------------------------------- b3: H100 (7.4x gap)
  const h100 = gap.colEls[1];
  S.add(fx.in(h100.bc, { from: 'scale', d: 0.4 }), 'b3~hundred-0.2');
  S.add(fx.in([h100.tn, h100.ta, h100.th, h100.tv], { from: 'fade', d: 0.35 }), 'b3~hundred');
  S.add(fx.in(h100.tr, { from: 'up', d: 0.4 }), 'b3~seven-point-four-fold');

  // ---------------------------------------------------------------- b4: B200 (8.9x gap) & takeaway
  const b200 = gap.colEls[2];
  S.add(fx.in(b200.bc, { from: 'scale', d: 0.4 }), 'b4~Blackwell-0.2');
  S.add(fx.in([b200.tn, b200.ta, b200.th, b200.tv], { from: 'fade', d: 0.35 }), 'b4~Blackwell');
  S.add(fx.in(b200.tr, { from: 'up', d: 0.4 }), 'b4~eight');
  S.add(fx.pulse([a100.bc, h100.bc, b200.bc], { scale: 1.03, stagger: 0.1, d: 0.4 }), 'b4~board.');
  S.add(fx.in(gap.footer, { from: 'up', d: 0.4 }), 'b4~board.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
