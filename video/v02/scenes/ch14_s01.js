/* ch14_s01 · sectors, lines, and contiguous access (figs 70, 71)
   Movement 1 (b1): 128-byte line composed of four 32-byte sectors.
   Movement 2 (b2): Whole 32-byte sector transferred even for a single 4-byte read.
   Movement 3 (b3): Coalesced warp: 32 threads × 4B = 128B (100% efficient).
   Movement 4 (b4): Scattered warp: 32 sectors = 1,024B moved for 128B used (8x traffic). */

V.scene('ch14_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Sectors, lines, and contiguous access', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Sectors & lines visual
  const ls = ch14LineSectors(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('contiguous access uses 100% of fetched bytes; scattered access wastes seven-eighths', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([ls.card, ls.title, ls.lineBox, ls.lineLbl, ls.cPan, ls.cTitle, ls.cDesc1, ls.cDesc2], { autoAlpha: 0 });
  ls.sectors.forEach(s => S.set([s.box, s.lbl, s.sub], { autoAlpha: 0 }));
  S.set([ls.sPan, ls.sTitle, ls.sDesc1, ls.sDesc2, ls.footer], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 128-byte line & 4 sectors
  S.add(fx.in([ls.card, ls.title], { from: 'scale', d: 0.5 }), 'b1~memory-0.2');
  S.add(fx.in(ls.lineBox, { from: 'scale', d: 0.5 }), 'b1~thirty-two-byte-0.2');
  S.add(fx.in(ls.lineLbl, { from: 'fade', d: 0.5 }), 'b1~thirty-two-byte');
  ls.sectors.forEach((s, idx) => {
    S.add(fx.in(s.box, { from: 'scale', d: 0.35 }), `b1~sectors,:-${0.2 - idx * 0.2}`);
    S.add(fx.in([s.lbl, s.sub], { from: 'fade', d: 0.35 }), `b1~sectors,:-${0.2 - idx * 0.2}`);
  });

  // ---------------------------------------------------------------- b2: Sector comes whole
  S.add(fx.pulse([ls.sectors[0].box, ls.sectors[0].lbl], { scale: 1.08, d: 0.4 }), 'b2~whole-0.2');

  // ---------------------------------------------------------------- b3: Coalesced perfect match (100% efficient)
  S.add(fx.in([ls.cPan, ls.cTitle], { from: 'scale', d: 0.5 }), 'b3~perfect-0.2');
  S.add(fx.in([ls.cDesc1, ls.cDesc2], { from: 'fade', d: 0.4 }), 'b3~warp,');
  S.add(fx.pulse(ls.cPan, { scale: 1.04, d: 0.4 }), 'b3~wanted.');

  // ---------------------------------------------------------------- b4: Scattered access (8x traffic penalty)
  S.add(fx.in([ls.sPan, ls.sTitle], { from: 'scale', d: 0.5 }), 'b4~Scatter-0.2');
  S.add(fx.in([ls.sDesc1, ls.sDesc2], { from: 'fade', d: 0.4 }), 'b4~sectors,');
  S.add(fx.pulse(ls.sPan, { scale: 1.04, d: 0.4 }), 'b4~traffic.');
  S.add(fx.in(ls.footer, { from: 'up', d: 0.4 }), 'b4~traffic.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
