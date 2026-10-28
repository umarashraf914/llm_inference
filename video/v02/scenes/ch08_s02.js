/* ch08_s02 · writing a kernel (fig 39)
   Movement 1 (b1): CUDA Kernel code window: written once, executed by millions of threads.
   Movement 2 (b2): Thread identity: blockIdx.x and threadIdx.x provided by hardware.
   Movement 3 (b3): Global index calculation: Block 3, Thread 5 -> 3 × 256 + 5 = 773 (3,092 bytes).
   Movement 4 (b4): Contiguous memory: 32 adjacent threads read 128 contiguous bytes. */

V.scene('ch08_s02', S => {
  const { fx } = S;
  const GX = 960, GY = 505;

  // Heading
  const heading = S.heading('writing a kernel', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Kernel Address Builder (Fig 39)
  const kern = ch08KernelAddress(S, { cx: GX, cy: GY, w: 1420, h: 540 });

  // Initial visibility
  S.set([kern.bg, kern.title], { autoAlpha: 0 });
  S.set(kern.code, { autoAlpha: 0 });
  S.set(kern.eval, { autoAlpha: 0 });
  S.set(kern.ribbon, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Code window
  S.add(fx.in([kern.bg, kern.title, ...kern.code], { from: 'fade', d: 0.5 }), 'b1~program-0.2');

  // ---------------------------------------------------------------- b2: Identical execution
  S.add(fx.pulse([kern.code[1], kern.code[2]], { scale: 1.02, d: 0.4 }), 'b2~identical-0.2');

  // ---------------------------------------------------------------- b3: Thread 5 Block 3 index calculation
  S.add(fx.in(kern.eval, { from: 'fade', d: 0.5 }), 'b3~works-0.2');
  S.add(fx.pulse(kern.eval[2], { scale: 1.04, d: 0.4 }), 'b3~seventy-three');

  // ---------------------------------------------------------------- b4: Contiguous warp memory access
  S.add(fx.in(kern.ribbon, { from: 'fade', d: 0.5 }), 'b4~Neighbouring-0.2');
  S.add(fx.pulse(kern.ribbon[1], { scale: 1.03, d: 0.5 }), 'b4~consecutive');

  // Concluding Takeaway band
  const takeaway = S.takeaway('index arithmetic naturally organizes warps into contiguous memory requests', {
    tone: 'helps'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
