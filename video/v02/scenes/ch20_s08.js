/* ch20_s08 · expanding the fast domain (fig 118)
   Movement 1 (b1): Strategy: make the fast domain as large as possible.
   Movement 2 (b2): Historical domain: 8 GPUs in single server chassis (640 GB).
   Movement 3 (b3): Liquid-cooled GB200 NVL72: 72 GPUs, 13.4 TB unified memory.
   Movement 4 (b4): Full 1.8 TB/s peer bandwidth keeps frontier models off network. */

V.scene('ch20_s08', S => {
  const { fx } = S;

  // Heading
  const heading = S.heading('expanding the fast domain', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Expanding Fast Domain Visual (Atlas Fig 118)
  const dom = ch20ExpandingDomain(S, { cx: 960, cy: 510 });

  // Concluding Takeaway band
  const takeaway = S.takeaway('rack-scale switch domains keep frontier models entirely within the fast neighbourhood', {
    tone: 'helps'
  });

  // Initial states
  S.set([dom.leftBg, dom.leftTitle, dom.leftSub, dom.diagBg1, dom.sBox1, dom.l1, dom.l2, dom.l3, dom.l4, dom.leftPill], { autoAlpha: 0 });
  dom.lGpus.forEach(g => S.set([g.gb, g.gl1, g.gl2], { autoAlpha: 0 }));

  S.set([dom.rightBg, dom.rightTitle, dom.rightSub, dom.diagBg2, dom.rackBox, dom.sBox2, dom.r1, dom.r2, dom.r3, dom.r4, dom.rightPill], { autoAlpha: 0 });
  dom.rGpus.forEach(b => S.set(b, { autoAlpha: 0 }));

  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Primary hardware strategy
  S.add(fx.in([dom.leftBg, dom.leftTitle, dom.leftSub], { from: 'fade', d: 0.4 }), 'b1~hardware-0.2');

  // ---------------------------------------------------------------- b2: Traditional 8-GPU chassis
  S.add(fx.in(dom.diagBg1, { from: 'fade', d: 0.4 }), 'b2~standard-0.2');
  dom.lGpus.forEach((g, idx) => {
    S.add(fx.in(g.gb, { from: 'fade', d: 0.35 }), `b2~standard:-${0.2 - idx * 0.04}`);
    S.add(fx.in([g.gl1, g.gl2], { from: 'fade', d: 0.35 }), `b2~standard:-${0.2 - idx * 0.04}`);
  });
  S.add(fx.in([dom.sBox1, dom.l1, dom.l2, dom.l3, dom.l4, dom.leftPill], { from: 'fade', d: 0.4 }), 'b2~chassis.');

  // ---------------------------------------------------------------- b3: 72-GPU liquid-cooled rack (13.4 TB)
  S.add(fx.in([dom.rightBg, dom.rightTitle, dom.rightSub, dom.diagBg2, dom.rackBox], { from: 'fade', d: 0.4 }), 'b3~liquid-cooled-0.2');
  dom.rGpus.forEach((b, idx) => {
    S.add(fx.in(b, { from: 'fade', d: 0.25 }), `b3~unites:-${0.2 - (idx % 9) * 0.02}`);
  });
  S.add(fx.in([dom.sBox2, dom.r1, dom.r2, dom.r3, dom.r4, dom.rightPill], { from: 'fade', d: 0.4 }), 'b3~memory.');

  // ---------------------------------------------------------------- b4: All chips at full bandwidth off network
  S.add(fx.pulse([dom.rightBg, dom.rightPill], { scale: 1.02, d: 0.45 }), 'b4~bandwidth');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
