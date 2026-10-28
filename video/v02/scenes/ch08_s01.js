/* ch08_s01 · the warp and S I M T (figs 38, 41)
   Movement 1 (b1): 32 threads form the irreducible scheduling unit: the warp.
   Movement 2 (b2): The SIMT paradigm: Single Instruction, Multiple Threads.
   Movement 3 (b3): 1 instruction decoded once and broadcast across 32 lanes in lockstep.
   Movement 4 (b4): Same operation, private data registers and array indices per lane. */

V.scene('ch08_s01', S => {
  const { fx } = S;
  const GX = 960, GY = 505;

  // Heading
  const heading = S.heading('the warp and simt', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Warp SIMT Builder (Figs 38, 41)
  const warp = ch08SimtLanes(S, { cx: GX, cy: GY, w: 1420, h: 540 });

  // Initial visibility
  S.set([warp.bg, warp.title, warp.bracket, warp.footer], { autoAlpha: 0 });
  S.set([warp.instBox, warp.instTitle], { autoAlpha: 0 });
  warp.broadcastLines.forEach(l => S.set(l, { autoAlpha: 0 }));
  warp.laneBoxes.forEach(l => {
    S.set([l.lBox, l.lLbl, l.opBox, l.opLbl, l.regBox, l.regLbl, l.dataIdx], { autoAlpha: 0 });
  });

  // ---------------------------------------------------------------- b1: 32 Lanes enter
  S.add(fx.in([warp.bg, warp.title, warp.bracket], { from: 'fade', d: 0.5 }), 'b1~Thirty-two-0.2');
  const allLaneBoxes = warp.laneBoxes.flatMap(l => [l.lBox, l.lLbl, l.opBox, l.opLbl]);
  S.add(fx.in(allLaneBoxes, { from: 'fade', stagger: 0.02, d: 0.4 }), 'b1~threads');

  // ---------------------------------------------------------------- b2: SIMT Instruction arrives
  S.add(fx.in([warp.instBox, warp.instTitle], { from: 'fade', d: 0.5 }), 'b2~single-0.2');
  S.add(fx.pulse([warp.instBox, warp.instTitle], { scale: 1.04, d: 0.4 }), 'b2~threads');

  // ---------------------------------------------------------------- b3: Broadcast across 32 lanes in lockstep
  S.add(fx.in(warp.broadcastLines, { from: 'fade', stagger: 0.015, d: 0.3 }), 'b3~fired-0.2');
  const regEls = warp.laneBoxes.flatMap(l => [l.regBox, l.regLbl]);
  S.add(fx.in(regEls, { from: 'fade', stagger: 0.015, d: 0.3 }), 'b3~lockstep');

  // ---------------------------------------------------------------- b4: Private registers & array index data
  const idxEls = warp.laneBoxes.map(l => l.dataIdx);
  S.add(fx.in([...idxEls, warp.footer], { from: 'fade', stagger: 0.015, d: 0.4 }), 'b4~addition-0.2');
  S.add(fx.pulse(idxEls, { scale: 1.05, stagger: 0.01, d: 0.3 }), 'b4~registers');

  // Concluding Takeaway band
  const takeaway = S.takeaway('the warp, not the thread, is the unit the hardware schedules', {
    tone: 'struct'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
