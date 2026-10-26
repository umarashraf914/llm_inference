/* ch21_s03 · the software ecosystem constraint (figs 121, 122)
   Movement 1 (b1): AMD MI300X specs (192 GB, 5.3 TB/s) outshine H100 (80 GB, 3.35 TB/s).
   Movement 2 (b2): AI teams continue choosing Nvidia: the deciding factor is software.
   Movement 3 (b3): 4-layer stack: frameworks, hand-tuned libraries, compiler, silicon.
   Movement 4 (b4): 20 years of CUDA library tuning creates an insurmountable moat. */

V.scene('ch21_s03', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('The software ecosystem constraint', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Software Moat Visual
  const moat = ch21SoftwareMoat(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('software ecosystem maturity frequently outweighs raw silicon specifications', {
    x: GX, y: 990, h: 48, tone: 'bytes', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([moat.card, moat.title, moat.footer], { autoAlpha: 0 });
  S.set([moat.specCard, moat.specTitle, moat.specPill], { autoAlpha: 0 });
  moat.specEls.forEach(el => S.set([el.box, el.txt], { autoAlpha: 0 }));

  S.set([moat.stackCard, moat.stackTitle, moat.stackPill], { autoAlpha: 0 });
  moat.layerEls.forEach(el => S.set([el.box, el.lt], { autoAlpha: 0 }));

  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: AMD MI300X vs H100 specs
  S.add(fx.in([moat.card, moat.title], { from: 'scale', d: 0.5 }), 'b1~specifications,-0.2');
  S.add(fx.in([moat.specCard, moat.specTitle], { from: 'scale', d: 0.4 }), 'b1~specifications,');
  moat.specEls.forEach((el, idx) => {
    S.add(fx.in(el.box, { from: 'scale', d: 0.35 }), `b1~three:-${0.2 - idx * 0.1}`);
    S.add(fx.in(el.txt, { from: 'fade', d: 0.35 }), `b1~three:-${0.2 - idx * 0.1}`);
  });
  S.add(fx.in(moat.specPill, { from: 'up', d: 0.4 }), 'b1~one.');

  // ---------------------------------------------------------------- b2: Software is deciding factor
  S.add(fx.in([moat.stackCard, moat.stackTitle], { from: 'scale', d: 0.4 }), 'b2~Nvidia.-0.2');
  S.add(fx.pulse([moat.stackCard, moat.stackTitle], { scale: 1.04, d: 0.4 }), 'b2~software.');

  // ---------------------------------------------------------------- b3: 4-tier stack
  moat.layerEls.forEach((el, idx) => {
    S.add(fx.in(el.box, { from: 'scale', d: 0.35 }), `b3~between:-${0.2 - idx * 0.1}`);
    S.add(fx.in(el.lt, { from: 'fade', d: 0.35 }), `b3~between:-${0.2 - idx * 0.1}`);
  });
  S.add(fx.in(moat.stackPill, { from: 'up', d: 0.4 }), 'b3~drivers.');

  // ---------------------------------------------------------------- b4: 20 years of CUDA libraries & takeaway
  S.add(fx.pulse([moat.stackCard, moat.stackPill], { scale: 1.05, d: 0.45 }), 'b4~twenty');
  S.add(fx.in(moat.footer, { from: 'up', d: 0.4 }), 'b4~four.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
