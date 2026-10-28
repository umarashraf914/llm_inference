/* ch14_s01 · sectors, lines, and contiguous access (figs 70, 71)
   Movement 1 (b1): Memory moves data in 32-byte sectors, four to a 128-byte line.
   Movement 2 (b2): Sector comes whole even if only 4 bytes asked for (28 bytes unused).
   Movement 3 (b3): Coalesced warp reads 32 numbers = 128 bytes (100% efficient).
   Movement 4 (b4): Scattered warp pulls 32 separate sectors = 1,024 bytes (87.5% wasted). */

V.scene('ch14_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('sectors, lines, and contiguous access', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Cache line and sectors (Atlas Figs 70, 71)
  const lineSec = ch14LineSectors(S, { cx: GX, cy: 500 });

  // Takeaway band
  const takeaway = S.takeaway('contiguous access uses 100% of fetched bytes; scattered access wastes seven-eighths', {
    tone: 'bytes'
  });

  // Initial states
  S.set([lineSec.bg, lineSec.title, lineSec.lineBox, lineSec.lineLbl], { autoAlpha: 0 });
  lineSec.sectors.forEach(s => S.set([s.box, s.lbl, s.sub], { autoAlpha: 0 }));
  S.set([lineSec.cPan, lineSec.cTitle, lineSec.cDesc1, lineSec.cDesc2], { autoAlpha: 0 });
  S.set([lineSec.sPan, lineSec.sTitle, lineSec.sDesc1, lineSec.sDesc2, lineSec.footer, takeaway.el], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 128-byte line & 4 sectors
  S.add(fx.in([lineSec.bg, lineSec.title], { from: 'up', d: 0.5 }), 'b1~memory-0.2');
  S.add(fx.in([lineSec.lineBox, lineSec.lineLbl], { from: 'fade', d: 0.5 }), 'b1~memory');
  lineSec.sectors.forEach((s, idx) => {
    S.add(fx.in([s.box, s.lbl, s.sub], { from: 'fade', d: 0.4 }), `b1~sectors,-${0.2 - idx * 0.25}`);
  });

  // ---------------------------------------------------------------- b2: Sector comes whole (28 B unused)
  if (lineSec.sectors[0]) {
    S.add(fx.pulse([lineSec.sectors[0].box, lineSec.sectors[0].lbl], { scale: 1.08, d: 0.4 }), 'b2~whole');
  }

  // ---------------------------------------------------------------- b3: Coalesced warp (100% efficient)
  S.add(fx.in([lineSec.cPan, lineSec.cTitle, lineSec.cDesc1, lineSec.cDesc2], { from: 'up', d: 0.5 }), 'b3~perfect-0.2');
  S.add(fx.pulse([lineSec.cPan, lineSec.cDesc2], { scale: 1.05, d: 0.4 }), 'b3~hundred');

  // ---------------------------------------------------------------- b4: Scattered warp (8x traffic, 87.5% wasted)
  S.add(fx.in([lineSec.sPan, lineSec.sTitle, lineSec.sDesc1, lineSec.sDesc2], { from: 'up', d: 0.5 }), 'b4~Scatter-0.2');
  S.add(fx.pulse([lineSec.sPan, lineSec.sDesc2], { scale: 1.05, d: 0.4 }), 'b4~traffic.');
  S.add(fx.in(lineSec.footer, { from: 'fade', d: 0.4 }), 'b4~traffic.-0.2');
  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
