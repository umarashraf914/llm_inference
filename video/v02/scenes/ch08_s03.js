/* ch08_s03 · grids, blocks and cooperation (fig 40)
   Movement 1 (b1): Launch Grid: 4,096 blocks (1,048,576 elements).
   Movement 2 (b2): Thread Block: holds up to 1,024 threads (32 warps), placed whole on one SM.
   Movement 3 (b3): Multiprocessor capacity: 2,048 threads = two 1,024-thread blocks.
   Movement 4 (b4): Cooperation boundary: shared memory is allocated per block. */

V.scene('ch08_s03', S => {
  const { fx } = S;
  const GX = 960, GY = 505;

  // Heading
  const heading = S.heading('grids, blocks and cooperation', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Hierarchy Diagram Builder (Fig 40)
  const h = ch08HierarchyDiagram(S, { cx: GX, cy: GY, w: 1420, h: 540 });

  // Initial visibility
  S.set([h.bg, h.title], { autoAlpha: 0 });
  S.set(h.col1, { autoAlpha: 0 });
  S.set(h.col2, { autoAlpha: 0 });
  S.set(h.col3, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Launch Grid
  S.add(fx.in([h.bg, h.title, ...h.col1], { from: 'fade', d: 0.5 }), 'b1~grid-0.2');

  // ---------------------------------------------------------------- b2: Block details
  S.add(fx.in(h.col2, { from: 'fade', d: 0.5 }), 'b2~twenty-four-0.2');
  S.add(fx.pulse([h.col2[2], h.col2[3]], { scale: 1.04, d: 0.4 }), 'b2~places');

  // ---------------------------------------------------------------- b3: SM capacity (2,048 threads)
  S.add(fx.in(h.col3.slice(0, 5), { from: 'fade', d: 0.5 }), 'b3~forty-eight-0.2');
  S.add(fx.pulse(h.col3[3], { scale: 1.04, d: 0.4 }), 'b3~blocks');

  // ---------------------------------------------------------------- b4: Shared memory cooperation boundary
  S.add(fx.in(h.col3.slice(5), { from: 'fade', d: 0.5 }), 'b4~scratchpad-0.2');
  S.add(fx.pulse([h.col3[6], h.col3[8]], { scale: 1.05, d: 0.5 }), 'b4~cooperates');

  // Concluding Takeaway band
  const takeaway = S.takeaway('blocks are the boundary of shared memory cooperation', {
    tone: 'helps'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
