/* ch19_s06 · the accumulation safeguard and the 256 wall (figs 105, 106)
   Movement 1 (b1): Crucial safeguard: low precision multiplies accumulate into FP32.
   Movement 2 (b2): Adding 1 repeatedly in BF16 freezes completely at 256.
   Movement 3 (b3): At 256, step size is 2; 256 + 1 rounds right back to 256.
   Movement 4 (b4): FP16 freezes at 2,048; FP32 accumulates exact past 16 million. */

V.scene('ch19_s06', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('the accumulation safeguard and the 256 wall', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Freeze visual
  const fg = ch19FreezeGraph(S, { cx: GX, cy: 500 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('FP32 accumulation prevents running sums from freezing at the 256 wall', {
    tone: 'helps'
  });

  // Initial states
  S.set([fg.bg, fg.title, fg.footer, takeaway], { autoAlpha: 0 });
  fg.colEls.forEach(c => {
    S.set(c.bc, { autoAlpha: 0 });
    S.set([c.fn, c.fl, c.fd1, c.fd2], { autoAlpha: 0 });
  });

  // ---------------------------------------------------------------- b1: FP32 safeguard concept
  S.add(fx.in([fg.bg, fg.title], { from: 'up', d: 0.5 }), 'b1~preserve-0.2');

  // ---------------------------------------------------------------- b2: BF16 freezes at 256
  S.add(fx.in(fg.colEls[0].bc, { from: 'fade', d: 0.4 }), 'b2~add-0.2');
  S.add(fx.in([fg.colEls[0].fn, fg.colEls[0].fl], { from: 'fade', d: 0.4 }), 'b2~repeatedly');
  S.add(fx.in([fg.colEls[0].fd1, fg.colEls[0].fd2], { from: 'fade', d: 0.4 }), 'b2~hundred');
  S.add(fx.pulse([fg.colEls[0].bc, fg.colEls[0].fl], { scale: 1.04, d: 0.4 }), 'b2~fifty-six.');

  // ---------------------------------------------------------------- b3: Step size widens to 2 (rounds down)
  S.add(fx.pulse([fg.colEls[0].fd1, fg.colEls[0].fd2], { scale: 1.03, d: 0.4 }), 'b3~gap');

  // ---------------------------------------------------------------- b4: FP16 wall (2,048) vs FP32 (16M)
  S.add(fx.in(fg.colEls[1].bc, { from: 'fade', d: 0.4 }), 'b4~Standard-0.2');
  S.add(fx.in([fg.colEls[1].fn, fg.colEls[1].fl, fg.colEls[1].fd1, fg.colEls[1].fd2], { from: 'fade', d: 0.4 }), 'b4~sixteen-bit');
  S.add(fx.in(fg.colEls[2].bc, { from: 'fade', d: 0.4 }), 'b4~Accumulating-0.2');
  S.add(fx.in([fg.colEls[2].fn, fg.colEls[2].fl, fg.colEls[2].fd1, fg.colEls[2].fd2], { from: 'fade', d: 0.4 }), 'b4~sixteen');
  S.add(fx.pulse([fg.colEls[2].bc, fg.colEls[2].fl], { scale: 1.04, d: 0.4 }), 'b4~million');
  S.add(fx.in(fg.footer, { from: 'up', d: 0.4 }), 'b4~layers.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
