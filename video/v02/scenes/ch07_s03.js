/* ch07_s03 · the floor plan: four identical quarters (fig 37)
   Movement 1 (b1): Full Hopper SM floor plan: 4 identical quarters.
   Movement 2 (b2): Quarter 1 detail: 1 scheduler, 32 FP32 lanes, 1 tensor core, 16,384 registers.
   Movement 3 (b3): Central 256 KB shared memory and TMA engine feeding all quarters.
   Movement 4 (b4): Arithmetic proof: 128 lanes ÷ 4 schedulers = 32 lanes per tick.
   Movement 5 (b5): The architectural origin of the 32-thread warp. */

V.scene('ch07_s03', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('The floor plan: four identical quarters', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // SM Floor Plan builder from ch07_common.js
  const plan = ch07SmFloorPlan(S, { cx: GX, cy: GY + 10, w: 1280, h: 540 });

  // Floating warp formula badge (Movement 4 & 5)
  const warpBadge = S.pill('128 LANES ÷ 4 SCHEDULERS = 32 LANES = 1 WARP', {
    x: GX, y: GY - 135, h: 46, tone: 'compute', size: 24, weight: 700, style: 'solid'
  });

  // Initial visibility
  S.set([plan.card, plan.title], { autoAlpha: 0 });
  plan.quarters.forEach(q => S.set(q.group, { autoAlpha: 0 }));
  S.set([plan.botCard, plan.sramText, warpBadge], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 4 Quarters overview
  S.add(fx.in([plan.card, plan.title], { from: 'scale', d: 0.5 }), 'b1~multiprocessor-0.2');
  S.add(fx.in(plan.quarters.map(q => q.group), { from: 'up', stagger: 0.1, d: 0.5 }), 'b1~quarters');

  // ---------------------------------------------------------------- b2: Quarter 1 components highlight
  S.add(fx.pulse([plan.quarters[0].card, plan.quarters[0].tcLbl], { scale: 1.05, d: 0.5 }), 'b2~quarter-0.2');

  // ---------------------------------------------------------------- b3: Central Shared Memory & TMA
  S.add(fx.in([plan.botCard, plan.sramText], { from: 'up', d: 0.5 }), 'b3~shared-0.2');
  S.add(fx.pulse(plan.botCard, { scale: 1.03, d: 0.5 }), 'b3~center');

  // ---------------------------------------------------------------- b4: 128 ÷ 4 = 32 lanes
  S.add(fx.in(warpBadge, { from: 'up', d: 0.5 }), 'b4~arithmetic-0.2');
  S.add(fx.pulse(warpBadge, { scale: 1.08, d: 0.5 }), 'b4~thirty-two');

  // ---------------------------------------------------------------- b5: The Warp definition
  S.add(fx.pulse([warpBadge, ...plan.quarters.map(q => q.card)], { scale: 1.05, d: 0.5 }), 'b5~warp-0.2');

  // Concluding Takeaway pill
  const takeaway = S.pill('four quarters, thirty-two lanes per scheduler: the hardware basis of the warp', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
