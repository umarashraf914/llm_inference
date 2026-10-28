/* ch17_s03 · tile scaling and arithmetic reuse (fig 92)
   Movement 1 (b1): Bigger tiles multiply data reuse.
   Movement 2 (b2): 2x2 tile: 2 reuses -> 1 op/byte.
   Movement 3 (b3): 16x16 (8 op/B) and 128x128 (64 op/B).
   Movement 4 (b4): Large tiles in SRAM turn memory-bound workloads into compute-bound ones. */

V.scene('ch17_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('tile scaling and arithmetic reuse', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Tile scaling visual
  const ts = ch17TileScaling(S, { cx: GX, cy: 500 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('data reuse grows with tile width: large tiles turn memory-bound workloads into compute-bound ones', {
    tone: 'helps'
  });

  // Initial states
  S.set([ts.bg, ts.title, ts.footer, takeaway], { autoAlpha: 0 });
  ts.rowEls.forEach(r => {
    S.set(r.rc, { autoAlpha: 0 });
    S.set([r.ts, r.tr, r.ti], { autoAlpha: 0 });
  });

  // ---------------------------------------------------------------- b1: Bigger tiles feed themselves
  S.add(fx.in([ts.bg, ts.title], { from: 'up', d: 0.5 }), 'b1~Bigger-0.2');

  // ---------------------------------------------------------------- b2: 2x2 tile (1 op/B)
  S.add(fx.in(ts.rowEls[0].rc, { from: 'fade', d: 0.4 }), 'b2~two-by-two-0.2');
  S.add(fx.in([ts.rowEls[0].ts, ts.rowEls[0].tr, ts.rowEls[0].ti], { from: 'fade', d: 0.4 }), 'b2~twice,');
  S.add(fx.pulse([ts.rowEls[0].rc, ts.rowEls[0].ti], { scale: 1.03, d: 0.4 }), 'b2~operation');

  // ---------------------------------------------------------------- b3: 16x16 & 128x128 tiles
  S.add(fx.in(ts.rowEls[1].rc, { from: 'fade', d: 0.4 }), 'b3~sixteen-by-sixteen-0.2');
  S.add(fx.in([ts.rowEls[1].ts, ts.rowEls[1].tr, ts.rowEls[1].ti], { from: 'fade', d: 0.4 }), 'b3~sixteen-by-sixteen');
  S.add(fx.in(ts.rowEls[2].rc, { from: 'fade', d: 0.4 }), 'b3~sixteen-0.2');
  S.add(fx.in([ts.rowEls[2].ts, ts.rowEls[2].tr, ts.rowEls[2].ti], { from: 'fade', d: 0.4 }), 'b3~sixteen');
  S.add(fx.in(ts.rowEls[3].rc, { from: 'fade', d: 0.4 }), 'b3~twenty-eight-0.2');
  S.add(fx.in([ts.rowEls[3].ts, ts.rowEls[3].tr, ts.rowEls[3].ti], { from: 'fade', d: 0.4 }), 'b3~twenty-eight');
  S.add(fx.pulse([ts.rowEls[3].rc, ts.rowEls[3].ti], { scale: 1.03, d: 0.4 }), 'b3~twenty-eight');

  // ---------------------------------------------------------------- b4: Staging large tiles in SRAM
  S.add(fx.pulse(ts.rowEls[3].rc, { scale: 1.04, d: 0.4 }), 'b4~scratchpad');
  S.add(fx.in(ts.footer, { from: 'up', d: 0.4 }), 'b4~cannot.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
