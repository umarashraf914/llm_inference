/* ch19_s07 · separating reality from marketing claims (fig 107)
   Movement 1 (b1): 9x and 18x headline marketing claims.
   Movement 2 (b2): Headline numbers blend reduced precision, 2:4 sparsity, and scale-out.
   Movement 3 (b3): On identical precision and dense workloads: real silicon progress is 2x to 4x.
   Movement 4 (b4): Separate true architectural advances from marketing arithmetic. */

V.scene('ch19_s07', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('separating reality from marketing claims', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Marketing decomposition visual
  const md = ch19MarketingDecomp(S, { cx: GX, cy: 500 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('always inspect precision and sparsity when evaluating generational speed-up claims', {
    tone: 'helps'
  });

  // Initial states
  S.set([md.bg, md.title, md.headBox, md.headText], { autoAlpha: 0 });
  md.fElements.forEach(f => {
    S.set(f.bc, { autoAlpha: 0 });
    S.set([f.fn, f.fm, f.fd], { autoAlpha: 0 });
  });
  S.set([md.footer, takeaway], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 9x to 18x headline claims
  S.add(fx.in([md.bg, md.title, md.headBox, md.headText], { from: 'up', d: 0.5 }), 'b1~announcements-0.2');
  S.add(fx.pulse([md.headBox, md.headText], { scale: 1.03, d: 0.4 }), 'b1~eighteen-fold');

  // ---------------------------------------------------------------- b2: Three blended factors
  md.fElements.forEach((f, idx) => {
    S.add(fx.in(f.bc, { from: 'fade', d: 0.4 }), `b2~multiples:-${0.2 - idx * 0.2}`);
    S.add(fx.in([f.fn, f.fm, f.fd], { from: 'fade', d: 0.35 }), `b2~multiples:-${0.2 - idx * 0.2}`);
  });
  S.add(fx.pulse([md.fElements[0].bc, md.fElements[1].bc], { scale: 1.03, d: 0.4 }), 'b2~sparsity');

  // ---------------------------------------------------------------- b3: Real progress = 2x to 4x per gen
  S.add(fx.in(md.footer, { from: 'up', d: 0.4 }), 'b3~workloads,-0.2');
  S.add(fx.pulse(md.footer, { scale: 1.03, d: 0.4 }), 'b3~four');

  // ---------------------------------------------------------------- b4: Understanding three attacks
  S.add(fx.pulse(md.bg, { scale: 1.02, d: 0.4 }), 'b4~physical');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
