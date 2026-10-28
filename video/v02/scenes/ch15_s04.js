/* ch15_s04 · the H200 proof and the three attacks (figs 81, 82, 83)
   Movement 1 (b1): Controlled experiment: H100 vs H200.
   Movement 2 (b2): Identical compute die, 4.8 TB/s HBM3e (+43% memory bandwidth).
   Movement 3 (b3): 70B token generation: 47.9 -> 68.6 tok/s (exactly +43% gain).
   Movement 4 (b4): The three attacks: Lower precision, faster memory, wider links. */

V.scene('ch15_s04', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('the h200 proof and the three attacks', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // H200 proof visual
  const hp = ch15H200Proof(S, { cx: GX, cy: 510 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('inference is bandwidth-bound: faster memory directly accelerates generation', {
    tone: 'helps'
  });

  // Initial states
  S.set([hp.bg, hp.title, hp.h1Card, hp.h1Title, hp.h1Flop, hp.h1Bw, hp.h1Tok], { autoAlpha: 0 });
  S.set([hp.h2Card, hp.h2Title, hp.h2Flop, hp.h2Bw, hp.h2Tok, hp.footer, takeaway.el], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Two chips side by side
  S.add(fx.in([hp.bg, hp.title], { from: 'up', d: 0.5 }), 'b1~controlled-0.2');
  S.add(fx.in([hp.h1Card, hp.h1Title], { from: 'fade', d: 0.5 }), 'b1~experiment-0.2');
  S.add(fx.in([hp.h2Card, hp.h2Title], { from: 'fade', d: 0.5 }), 'b1~two');

  // ---------------------------------------------------------------- b2: Identical compute, 43% faster memory
  S.add(fx.in([hp.h1Flop, hp.h1Bw], { from: 'fade', d: 0.4 }), 'b2~compute-0.2');
  S.add(fx.in([hp.h2Flop, hp.h2Bw], { from: 'fade', d: 0.4 }), 'b2~identical:-0.2');
  S.add(fx.pulse([hp.h2Card, hp.h2Bw], { scale: 1.03, d: 0.4 }), 'b2~forty-three');

  // ---------------------------------------------------------------- b3: 47.9 -> 68.6 tok/s (+43% speedup)
  S.add(fx.in(hp.h1Tok, { from: 'fade', d: 0.4 }), 'b3~forty-seven-0.2');
  S.add(fx.in(hp.h2Tok, { from: 'fade', d: 0.4 }), 'b3~sixty-eight-0.2');
  S.add(fx.pulse([hp.h2Tok, hp.h2Card], { scale: 1.03, d: 0.4 }), 'b3~forty-three');

  // ---------------------------------------------------------------- b4: Three attacks & conclusion
  S.add(fx.in(hp.footer, { from: 'up', d: 0.4 }), 'b4~attacks-0.2');
  S.add(fx.pulse(hp.footer, { scale: 1.03, d: 0.4 }), 'b4~links');

  S.add(fx.in(takeaway.el, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
