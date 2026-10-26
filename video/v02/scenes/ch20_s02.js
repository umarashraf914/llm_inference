/* ch20_s02 · what an interconnect link is (fig 110)
   Movement 1 (b1): Model split across chips requires continuous communication.
   Movement 2 (b2): Interconnect links obey width * frequency bus arithmetic.
   Movement 3 (b3): Distance dictates wire count, speed, and energy.
   Movement 4 (b4): Three tiers: Local HBM, Neighbour NVLink, Network InfiniBand. */

V.scene('ch20_s02', S => {
  const { fx } = S;
  const GX = 960;

  // Heading
  const heading = S.heading('What an interconnect link is', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Three tiers visual
  const tt = ch20ThreeTiers(S, { cx: GX, cy: 510 });

  // Concluding Takeaway pill
  const takeaway = S.pill('a GPU communicates across three tiers, each significantly slower than the last', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([tt.card, tt.title, tt.footer], { autoAlpha: 0 });
  tt.colEls.forEach(c => {
    S.set(c.bc, { autoAlpha: 0 });
    S.set([c.tn, c.td, c.tw, c.tb], { autoAlpha: 0 });
  });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Interconnect link joins chips
  S.add(fx.in([tt.card, tt.title], { from: 'scale', d: 0.5 }), 'b1~model-0.2');

  // ---------------------------------------------------------------- b2: Width * frequency arithmetic
  S.add(fx.in(tt.colEls[0].bc, { from: 'scale', d: 0.4 }), 'b2~bundle-0.2');
  S.add(fx.in([tt.colEls[0].tn, tt.colEls[0].td, tt.colEls[0].tw, tt.colEls[0].tb], { from: 'fade', d: 0.4 }), 'b2~bundle');

  // ---------------------------------------------------------------- b3: Distance difference
  S.add(fx.in(tt.colEls[1].bc, { from: 'scale', d: 0.4 }), 'b3~distance.-0.2');
  S.add(fx.in([tt.colEls[1].tn, tt.colEls[1].td, tt.colEls[1].tw, tt.colEls[1].tb], { from: 'fade', d: 0.4 }), 'b3~distance.');

  // ---------------------------------------------------------------- b4: Three tiers
  S.add(fx.in(tt.colEls[2].bc, { from: 'scale', d: 0.4 }), 'b4~three-0.2');
  S.add(fx.in([tt.colEls[2].tn, tt.colEls[2].td, tt.colEls[2].tw, tt.colEls[2].tb], { from: 'fade', d: 0.4 }), 'b4~three');
  S.add(fx.pulse([tt.colEls[0].bc, tt.colEls[1].bc, tt.colEls[2].bc], { scale: 1.04, stagger: 0.1, d: 0.4 }), 'b4~slower');
  S.add(fx.in(tt.footer, { from: 'up', d: 0.4 }), 'b4~last.');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
