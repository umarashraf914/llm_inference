/* ch20_s08 · expanding the fast domain (fig 118)
   Movement 1 (b1): Strategy: make the fast domain as large as possible.
   Movement 2 (b2): Historical domain: 8 GPUs in single server chassis (640 GB).
   Movement 3 (b3): Liquid-cooled GB200 NVL72: 72 GPUs, 13.4 TB unified memory.
   Movement 4 (b4): Full 1.8 TB/s peer bandwidth keeps frontier models off network. */

V.scene('ch20_s08', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('Expanding the fast domain', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Expanding Fast Domain Visual
  const dom = ch20ExpandingDomain(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('rack-scale switch domains keep frontier models entirely within the fast neighbourhood', {
    x: GX, y: 990, h: 48, tone: 'helps', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([dom.leftCard, dom.leftTitle, dom.leftSub, dom.leftPill], { autoAlpha: 0 });
  dom.lElements.forEach(el => S.set([el.box, el.lt], { autoAlpha: 0 }));

  S.set([dom.rightCard, dom.rightTitle, dom.rightSub, dom.rightPill], { autoAlpha: 0 });
  dom.rElements.forEach(el => S.set([el.box, el.rt], { autoAlpha: 0 }));

  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Primary hardware strategy
  S.add(fx.in([dom.leftCard, dom.leftTitle, dom.leftSub], { from: 'scale', d: 0.4 }), 'b1~hardware-0.2');

  // ---------------------------------------------------------------- b2: Traditional 8-GPU chassis
  dom.lElements.forEach((el, idx) => {
    S.add(fx.in(el.box, { from: 'scale', d: 0.35 }), `b2~standard:-${0.2 - idx * 0.1}`);
    S.add(fx.in(el.lt, { from: 'fade', d: 0.35 }), `b2~standard:-${0.2 - idx * 0.1}`);
  });
  S.add(fx.in(dom.leftPill, { from: 'up', d: 0.4 }), 'b2~chassis.');

  // ---------------------------------------------------------------- b3: 72-GPU liquid-cooled rack (13.4 TB)
  S.add(fx.in([dom.rightCard, dom.rightTitle, dom.rightSub], { from: 'scale', d: 0.4 }), 'b3~liquid-cooled-0.2');
  dom.rElements.forEach((el, idx) => {
    S.add(fx.in(el.box, { from: 'scale', d: 0.35 }), `b3~unites:-${0.2 - idx * 0.1}`);
    S.add(fx.in(el.rt, { from: 'fade', d: 0.35 }), `b3~unites:-${0.2 - idx * 0.1}`);
  });
  S.add(fx.in(dom.rightPill, { from: 'up', d: 0.4 }), 'b3~memory.');

  // ---------------------------------------------------------------- b4: All chips at full bandwidth off network
  S.add(fx.pulse([dom.rightCard, dom.rightPill], { scale: 1.04, d: 0.45 }), 'b4~bandwidth');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
