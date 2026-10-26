/* ch08_s01 · the warp and S I M T (figs 38, 41)
   Movement 1 (b1): 32 threads form the irreducible scheduling unit: the warp.
   Movement 2 (b2): The SIMT paradigm: Single Instruction, Multiple Threads.
   Movement 3 (b3): 1 instruction decoded once and broadcast across 32 lanes in lockstep.
   Movement 4 (b4): Same operation, private data registers per lane. */

V.scene('ch08_s01', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('The warp and SIMT', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Warp Builder
  const warp = ch08WarpLanes(S, { cx: GX, cy: GY - 20, w: 1280, h: 420 });

  // Lower callout card: Hardware Scheduling Unit
  const calloutCard = S.card({
    x: GX - 480, y: GY + 250, w: 960, h: 80,
    tone: 'compute', title: ''
  });
  const calloutText = S.text('THE WARP, NOT THE THREAD, IS THE ATOMIC SCHEDULING UNIT', {
    x: GX, y: GY + 292, size: 22, anchor: 'middle', weight: 700, color: 'compute'
  });

  // Initial visibility
  S.set([warp.card, warp.title, warp.warpPill], { autoAlpha: 0 });
  warp.lanes.forEach(l => S.set([l.box, l.num, l.reg], { autoAlpha: 0 }));
  S.set([warp.instCard, warp.instText], { autoAlpha: 0 });
  S.set([calloutCard, calloutText], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 32 Lanes enter
  S.add(fx.in([warp.card, warp.title, warp.warpPill], { from: 'scale', d: 0.5 }), 'b1~Thirty-two-0.2');
  S.add(fx.in(warp.lanes.map(l => l.box), { from: 'scale', stagger: 0.02, d: 0.4 }), 'b1~threads');

  // ---------------------------------------------------------------- b2: SIMT Instruction arrives
  S.add(fx.in([warp.instCard, warp.instText], { from: 'up', d: 0.5 }), 'b2~single-0.2');
  S.add(fx.pulse([warp.instCard, warp.warpPill], { scale: 1.05, d: 0.5 }), 'b2~threads');

  // ---------------------------------------------------------------- b3: Broadcast across 32 lanes in lockstep
  S.add(fx.in(warp.lanes.map(l => l.reg), { from: 'up', stagger: 0.015, d: 0.4 }), 'b3~fired-0.2');
  S.add(fx.pulse(warp.lanes.map(l => l.box), { scale: 1.05, stagger: 0.01, d: 0.3 }), 'b3~lockstep');

  // ---------------------------------------------------------------- b4: Private registers & Callout
  S.add(fx.in([calloutCard, calloutText], { from: 'up', d: 0.5 }), 'b4~addition-0.2');
  S.add(fx.pulse([calloutCard, warp.warpPill], { scale: 1.05, d: 0.5 }), 'b4~registers');

  // Concluding Takeaway pill
  const takeaway = S.pill('the warp, not the thread, is the unit the hardware schedules', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
