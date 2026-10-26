/* ch00_s03 · what is inside the package (cold open)
   Movement 1 (b1): Look inside package: transistors and clock cycles (132 SMs).
   Movement 2 (b2): 500 clock ticks from memory vs 1 tick for arithmetic.
   Movement 3 (b3): 64 warps hide latency vs divergence cuts throughput in half.
   Movement 4 (b4): The machine behind the memory wall.
   Movement 5 (b5): Film title reveal: Inside the GPU. */

V.scene('ch00_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('What is inside the package', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Inside Package Visual
  const pkg = ch00InsidePackage(S, { cx: GX, cy: 510 });

  // Grand Title Pill
  const takeaway = S.pill('INSIDE THE GPU · THE ARCHITECTURE OF HIGH-THROUGHPUT INFERENCE', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 700, style: 'solid'
  });

  // Initial states
  S.set([pkg.card, pkg.title, pkg.footer], { autoAlpha: 0 });
  pkg.colEls.forEach(col => {
    S.set(col.bc, { autoAlpha: 0 });
    S.set([col.pn, col.ps, col.pd, col.pt], { autoAlpha: 0 });
  });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Look inside package (132 SMs)
  S.add(fx.in([pkg.card, pkg.title], { from: 'scale', d: 0.5 }), 'b1~understand-0.2');
  const c1 = pkg.colEls[0];
  S.add(fx.in(c1.bc, { from: 'scale', d: 0.4 }), 'b1~transistors');
  S.add(fx.in([c1.pn, c1.ps, c1.pd, c1.pt], { from: 'fade', d: 0.35 }), 'b1~transistors');

  // ---------------------------------------------------------------- b2: Memory ladder 500 ticks vs 1 tick
  const c2 = pkg.colEls[1];
  S.add(fx.in(c2.bc, { from: 'scale', d: 0.4 }), 'b2~fetching-0.2');
  S.add(fx.in([c2.pn, c2.ps, c2.pd, c2.pt], { from: 'fade', d: 0.35 }), 'b2~fetching');
  S.add(fx.pulse([c2.bc, c2.pt], { scale: 1.04, d: 0.4 }), 'b2~one?');

  // ---------------------------------------------------------------- b3: 64 warps latency hiding
  const c3 = pkg.colEls[2];
  S.add(fx.in(c3.bc, { from: 'scale', d: 0.4 }), 'b3~sixty-four-0.2');
  S.add(fx.in([c3.pn, c3.ps, c3.pd, c3.pt], { from: 'fade', d: 0.35 }), 'b3~sixty-four');
  S.add(fx.pulse([c3.bc, c3.pt], { scale: 1.04, d: 0.4 }), 'b3~half?');

  // ---------------------------------------------------------------- b4: The machine behind the memory wall
  S.add(fx.pulse([pkg.card, c1.bc, c2.bc, c3.bc], { scale: 1.03, stagger: 0.08, d: 0.45 }), 'b4~machine');

  // ---------------------------------------------------------------- b5: Grand Title Reveal: Inside the GPU
  S.add(fx.in(pkg.footer, { from: 'up', d: 0.4 }), 'b5~Inside-0.2');
  S.add(fx.pulse(pkg.footer, { scale: 1.05, d: 0.5 }), 'b5~Inside');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.5');
});
