/* ch20_s05 · the generational interconnect gap (fig 113)
   Movement 1 (b1): Interconnect bandwidth grows, but ratio to local memory stays fixed.
   Movement 2 (b2): A100: HBM 2,039 GB/s vs NVLink 300 GB/s (6.8x gap).
   Movement 3 (b3): H100: HBM 3,352 GB/s vs NVLink 450 GB/s (7.4x gap).
   Movement 4 (b4): B200: HBM 8,000 GB/s vs NVLink 900 GB/s (8.9x gap). */

V.scene('ch20_s05', S => {
  const { fx } = S;

  // Heading
  const heading = S.heading('the generational interconnect gap', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Generational Gap Visual (Atlas Fig 113)
  const gap = ch20GenerationalGap(S, { cx: 960, cy: 510 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('local memory remains roughly 7 to 9 times faster than peer GPU communication across all generations', {
    tone: 'bytes'
  });

  // Initial states
  S.set([gap.bg, gap.title, gap.footer], { autoAlpha: 0 });
  gap.genRows.forEach(c => {
    S.set([c.rowCard, c.nameLbl, c.descLbl, c.ratioPill, c.hbmBar, c.hbmLbl, c.nvBar, c.nvLbl], { autoAlpha: 0 });
  });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Generational ratio stays fixed
  S.add(fx.in([gap.bg, gap.title], { from: 'fade', d: 0.5 }), 'b1~rapidly-0.2');

  // ---------------------------------------------------------------- b2: A100 (6.8x gap)
  const a100 = gap.genRows[0];
  S.add(fx.in([a100.rowCard, a100.nameLbl, a100.descLbl], { from: 'fade', d: 0.4 }), 'b2~hundred-0.2');
  S.add(fx.in([a100.hbmBar, a100.hbmLbl, a100.nvBar, a100.nvLbl], { from: 'fade', d: 0.35 }), 'b2~hundred');
  S.add(fx.in(a100.ratioPill, { from: 'up', d: 0.4 }), 'b2~seven');

  // ---------------------------------------------------------------- b3: H100 (7.4x gap)
  const h100 = gap.genRows[1];
  S.add(fx.in([h100.rowCard, h100.nameLbl, h100.descLbl], { from: 'fade', d: 0.4 }), 'b3~hundred-0.2');
  S.add(fx.in([h100.hbmBar, h100.hbmLbl, h100.nvBar, h100.nvLbl], { from: 'fade', d: 0.35 }), 'b3~hundred');
  S.add(fx.in(h100.ratioPill, { from: 'up', d: 0.4 }), 'b3~seven-point-four-fold');

  // ---------------------------------------------------------------- b4: B200 (8.9x gap) & takeaway
  const b200 = gap.genRows[2];
  S.add(fx.in([b200.rowCard, b200.nameLbl, b200.descLbl], { from: 'fade', d: 0.4 }), 'b4~Blackwell-0.2');
  S.add(fx.in([b200.hbmBar, b200.hbmLbl, b200.nvBar, b200.nvLbl], { from: 'fade', d: 0.35 }), 'b4~Blackwell');
  S.add(fx.in(b200.ratioPill, { from: 'up', d: 0.4 }), 'b4~eight');
  S.add(fx.pulse([a100.ratioPill, h100.ratioPill, b200.ratioPill], { scale: 1.04, stagger: 0.1, d: 0.4 }), 'b4~board.');
  S.add(fx.in(gap.footer, { from: 'up', d: 0.4 }), 'b4~board.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
