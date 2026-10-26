/* ch11_s01 · six transistors against one capacitor (fig 53)
   Movement 1 (b1): Memory hierarchy follows from the physics of the cell.
   Movement 2 (b2): SRAM uses 6 transistors in active feedback; single-cycle read.
   Movement 3 (b3): DRAM uses 1 transistor + 1 tiny capacitor storing electrical charge.
   Movement 4 (b4): DRAM is ultra dense (80 GB), but leaks like a bucket with a hole. */

V.scene('ch11_s01', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Six transistors against one capacitor', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Side-by-side cells
  const cells = ch11CellComparison(S, { cx: GX, cy: 520 });

  // Concluding Takeaway pill
  const takeaway = S.pill('SRAM is fast but bulky; DRAM is dense but physically leaky', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([cells.leftCard, cells.leftTitle, cells.leftSub, cells.leftBox, cells.leftPill], { autoAlpha: 0 });
  cells.tBlocks.forEach(tb => S.set([tb.tb, tb.tl], { autoAlpha: 0 }));
  S.set([cells.rightCard, cells.rightTitle, cells.rightSub, cells.rightBox, cells.dramT, cells.dramTLbl, cells.dramCap, cells.dramCapLbl, cells.dramCharge, cells.rightPill], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Memory hierarchy & cell physics
  S.add(fx.in([cells.leftCard, cells.leftTitle], { from: 'scale', d: 0.5 }), 'b1~hierarchy-0.2');
  S.add(fx.in(cells.leftSub, { from: 'up', d: 0.5 }), 'b1~hierarchy');
  S.add(fx.in([cells.rightCard, cells.rightTitle], { from: 'scale', d: 0.5 }), 'b1~physics-0.2');
  S.add(fx.in(cells.rightSub, { from: 'up', d: 0.5 }), 'b1~physics');

  // ---------------------------------------------------------------- b2: SRAM 6 Transistors & single-cycle
  S.add(fx.in(cells.leftBox, { from: 'fade', d: 0.4 }), 'b2~uses-0.2');
  cells.tBlocks.forEach((tb, idx) => {
    S.add(fx.in(tb.tb, { from: 'scale', d: 0.35 }), `b2~six:-${0.1 - idx * 0.08}`);
    S.add(fx.in(tb.tl, { from: 'fade', d: 0.3 }), `b2~six:-${0.1 - idx * 0.08}`);
  });
  S.add(fx.in(cells.leftPill, { from: 'up', d: 0.4 }), 'b2~single-0.2');
  S.add(fx.pulse([cells.leftTitle, cells.leftPill], { scale: 1.05, d: 0.4 }), 'b2~cycle');

  // ---------------------------------------------------------------- b3: DRAM 1 Transistor + 1 Capacitor
  S.add(fx.in(cells.rightBox, { from: 'fade', d: 0.4 }), 'b3~uses-0.2');
  S.add(fx.in(cells.dramT, { from: 'scale', d: 0.4 }), 'b3~one');
  S.add(fx.in(cells.dramTLbl, { from: 'fade', d: 0.4 }), 'b3~one');
  S.add(fx.in(cells.dramCap, { from: 'scale', d: 0.4 }), 'b3~tiny');
  S.add(fx.in([cells.dramCapLbl, cells.dramCharge], { from: 'fade', d: 0.4 }), 'b3~tiny');
  S.add(fx.pulse([cells.dramCap, cells.dramCharge], { scale: 1.05, d: 0.4 }), 'b3~charge.');

  // ---------------------------------------------------------------- b4: Ultra-dense 80GB vs bucket leak
  S.add(fx.in(cells.rightPill, { from: 'up', d: 0.4 }), 'b4~denser-0.2');
  S.add(fx.pulse([cells.rightCard, cells.rightPill], { scale: 1.05, d: 0.4 }), 'b4~eighty');
  S.add(fx.recolor(cells.dramCap, {
    fill: S.tone('violet', 0.2),
    stroke: S.tone('violet', 0.8),
    d: 0.4
  }), 'b4~leaks');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
