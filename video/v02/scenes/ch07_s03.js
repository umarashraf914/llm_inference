/* ch07_s03 · the floor plan: four identical quarters (fig 37)
   Movement 1 (b1): Full Hopper SM floor plan: 4 identical quarters.
   Movement 2 (b2): Quarter 1 detail: 1 scheduler, 32 FP32 lanes, 1 tensor core, 16,384 registers.
   Movement 3 (b3): Central 256 KB shared memory and TMA engine feeding all quarters.
   Movement 4 (b4): Arithmetic proof: 128 lanes ÷ 4 schedulers = 32 lanes per tick.
   Movement 5 (b5): The architectural origin of the 32-thread warp. */

V.scene('ch07_s03', S => {
  const { fx } = S;
  const GX = 960, GY = 505;

  // Heading
  const heading = S.heading('the floor plan: four identical quarters', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // SM Floor Plan builder from ch07_common.js
  const plan = ch07SmFloorPlan(S, { cx: GX, cy: GY, w: 1420, h: 540 });

  // Initial visibility
  S.set([plan.bg, plan.title], { autoAlpha: 0 });
  plan.quarters.forEach(q => {
    S.set([q.qBox, q.qHeader, q.sBox, q.sLbl, q.rBox, q.rLbl, q.lBox, q.lLbl, q.tBox, q.tLbl], { autoAlpha: 0 });
  });
  S.set([plan.botBox, plan.botText], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: 4 Quarters overview
  S.add(fx.in([plan.bg, plan.title], { from: 'fade', d: 0.5 }), 'b1~multiprocessor-0.2');
  const allQuarterEls = plan.quarters.flatMap(q => [q.qBox, q.qHeader, q.sBox, q.sLbl, q.rBox, q.rLbl, q.lBox, q.lLbl, q.tBox, q.tLbl]);
  S.add(fx.in(allQuarterEls, { from: 'fade', stagger: 0.02, d: 0.5 }), 'b1~quarters');

  // ---------------------------------------------------------------- b2: Quarter 1 components highlight
  S.add(fx.pulse([plan.quarters[0].qHeader, plan.quarters[0].sLbl, plan.quarters[0].lLbl, plan.quarters[0].tLbl], { scale: 1.05, d: 0.5 }), 'b2~quarter-0.2');

  // ---------------------------------------------------------------- b3: Central Shared Memory & TMA
  S.add(fx.in([plan.botBox, plan.botText], { from: 'fade', d: 0.5 }), 'b3~shared-0.2');
  S.add(fx.pulse([plan.botBox, plan.botText], { scale: 1.03, d: 0.5 }), 'b3~center');

  // ---------------------------------------------------------------- b4: 128 ÷ 4 = 32 lanes
  const allLanes = plan.quarters.map(q => q.lLbl);
  S.add(fx.pulse(allLanes, { scale: 1.08, d: 0.5 }), 'b4~arithmetic-0.2');

  // ---------------------------------------------------------------- b5: The Warp definition
  S.add(fx.pulse(allLanes, { scale: 1.1, d: 0.5 }), 'b5~warp-0.2');

  // Concluding Takeaway band
  const takeaway = S.takeaway('four quarters, thirty-two lanes per scheduler: the hardware basis of the warp', {
    tone: 'struct'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
