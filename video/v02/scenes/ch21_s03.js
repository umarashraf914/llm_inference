/* ch21_s03 · the software ecosystem constraint (figs 121, 122)
   Movement 1 (b1): AMD MI300X specs (192 GB, 5.3 TB/s) outshine H100 (80 GB, 3.35 TB/s).
   Movement 2 (b2): AI teams continue choosing Nvidia: the deciding factor is software.
   Movement 3 (b3): 4-layer stack: frameworks, hand-tuned libraries, compiler, silicon.
   Movement 4 (b4): 20 years of CUDA library tuning creates an insurmountable moat. */

V.scene('ch21_s03', S => {
  const { fx } = S;

  // Heading
  const heading = S.heading('the software ecosystem constraint', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Software Moat Visual (Atlas Figs 121, 122)
  const moat = ch21SoftwareMoat(S, { cx: 960, cy: 510 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('software ecosystem maturity frequently outweighs raw silicon specifications', {
    tone: 'bytes'
  });

  // Initial states
  S.set([moat.bg, moat.title, moat.footer], { autoAlpha: 0 });
  S.set([moat.specCard, moat.specTitle, moat.specSub, moat.specPill], { autoAlpha: 0 });
  S.set([moat.c1, moat.c1Lbl, moat.c1BarA, moat.c1BarH], { autoAlpha: 0 });
  S.set([moat.c2, moat.c2Lbl, moat.c2BarA, moat.c2BarH], { autoAlpha: 0 });
  S.set([moat.c3, moat.c3T1, moat.c3T2], { autoAlpha: 0 });

  S.set([moat.stackCard, moat.stackTitle, moat.stackSub, moat.stackPill], { autoAlpha: 0 });
  moat.layerEls.forEach(el => S.set([el.lb, el.lt1, el.lt2], { autoAlpha: 0 }));

  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: AMD MI300X vs H100 specs
  S.add(fx.in([moat.bg, moat.title], { from: 'fade', d: 0.5 }), 'b1~specifications,-0.2');
  S.add(fx.in([moat.specCard, moat.specTitle, moat.specSub], { from: 'fade', d: 0.4 }), 'b1~specifications,');
  S.add(fx.in([moat.c1, moat.c1Lbl, moat.c1BarA, moat.c1BarH], { from: 'fade', d: 0.35 }), 'b1~three');
  S.add(fx.in([moat.c2, moat.c2Lbl, moat.c2BarA, moat.c2BarH], { from: 'fade', d: 0.35 }), 'b1~three');
  S.add(fx.in([moat.c3, moat.c3T1, moat.c3T2, moat.specPill], { from: 'fade', d: 0.4 }), 'b1~one.');

  // ---------------------------------------------------------------- b2: Software is deciding factor
  S.add(fx.in([moat.stackCard, moat.stackTitle, moat.stackSub], { from: 'fade', d: 0.4 }), 'b2~Nvidia.-0.2');
  S.add(fx.pulse([moat.stackCard, moat.stackTitle], { scale: 1.02, d: 0.4 }), 'b2~software.');

  // ---------------------------------------------------------------- b3: 4-tier stack hierarchy
  moat.layerEls.forEach((el, idx) => {
    S.add(fx.in([el.lb, el.lt1, el.lt2], { from: 'fade', d: 0.35 }), `b3~between:-${0.2 - idx * 0.08}`);
  });
  S.add(fx.in(moat.stackPill, { from: 'up', d: 0.4 }), 'b3~drivers.');

  // ---------------------------------------------------------------- b4: 20 years of CUDA libraries & takeaway
  S.add(fx.pulse([moat.layerEls[1].lb, moat.stackPill], { scale: 1.03, d: 0.45 }), 'b4~twenty');
  S.add(fx.in(moat.footer, { from: 'up', d: 0.4 }), 'b4~four.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
