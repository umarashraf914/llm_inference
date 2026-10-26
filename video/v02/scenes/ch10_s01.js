/* ch10_s01 · what a branch means in lockstep (figs 49, 50)
   Movement 1 (b1): Single CPU thread branch: clean single path, 0 wasted cycles.
   Movement 2 (b2): 32-lane warp arrives at the fork; lanes test different data.
   Movement 3 (b3): 1 decoder forces 2 serial passes; half the lanes masked in each.
   Movement 4 (b4): 50% throughput penalty; divergent paths serialized not parallelized. */

V.scene('ch10_s01', S => {
  const { fx } = S;
  const GX = 960, GY = 530;

  // Heading
  const heading = S.heading('What a branch means in lockstep', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Single CPU thread comparison card (top/left initially or small banner)
  const cpuCard = S.card({
    x: GX - 480, y: 190, w: 960, h: 90,
    tone: 'neutral', title: ''
  });
  const cpuTitle = S.text('CPU: 1 Thread Reaches Branch  →  Takes 1 Path Cleanly (0 Wasted Cycles)', {
    x: GX, y: 244, size: 22, anchor: 'middle', weight: 700, color: 'helps'
  });

  // 32-Lane Warp Display
  const warp = ch10WarpLanes(S, { cx: GX, cy: GY + 30, w: 1360, h: 360 });

  // Throughput meter / Callout card
  const calloutCard = S.card({
    x: GX - 480, y: GY + 250, w: 960, h: 84,
    tone: 'bytes', title: ''
  });
  const calloutText = S.text('THROUGHPUT CUT IN HALF: 2 PASSES REQUIRED FOR 1 OPERATION', {
    x: GX, y: GY + 300, size: 22, anchor: 'middle', weight: 700, color: 'bytes'
  });

  // Concluding Takeaway pill
  const takeaway = S.pill('warp divergence: divergent paths are serialized, not parallelized', {
    x: GX, y: 990, h: 48, tone: 'violet', size: 22, weight: 600, style: 'solid'
  });

  // Initial states
  S.set([cpuCard, cpuTitle], { autoAlpha: 0 });
  S.set([warp.card, warp.title, warp.statusBadge, warp.ifHeader, warp.elseHeader], { autoAlpha: 0 });
  warp.lanes.forEach(l => S.set([l.box, l.num, l.stateRect], { autoAlpha: 0 }));
  S.set([calloutCard, calloutText], { autoAlpha: 0 });
  S.set(takeaway, { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: CPU single thread comparison
  S.add(fx.in([cpuCard, cpuTitle], { from: 'up', d: 0.5 }), 'b1~ordinary-0.2');
  S.add(fx.pulse(cpuTitle, { scale: 1.05, d: 0.4 }), 'b1~decision,');

  // ---------------------------------------------------------------- b2: 32 lanes reach the fork
  S.add(fx.in([warp.card, warp.title], { from: 'scale', d: 0.5 }), 'b2~thirty-two-0.2');
  S.add(fx.in(warp.statusBadge, { from: 'up', d: 0.5 }), 'b2~thirty-two');
  S.add(fx.in(warp.lanes.map(l => l.box), { from: 'scale', stagger: 0.015, d: 0.4 }), 'b2~lanes');
  S.add(fx.in(warp.lanes.map(l => l.num), { from: 'fade', stagger: 0.01, d: 0.3 }), 'b2~fork');

  // Show split conditions: left 16 amber (TRUE), right 16 violet (FALSE)
  S.add(fx.in([warp.ifHeader, warp.elseHeader], { from: 'up', d: 0.4 }), 'b2~differ-0.2');
  warp.lanes.forEach((l, idx) => {
    const isIf = idx < 16;
    S.add(fx.recolor(l.box, {
      fill: isIf ? S.tone('compute', 0.25) : S.tone('violet', 0.25),
      stroke: isIf ? S.tone('compute', 0.9) : S.tone('violet', 0.9),
      d: 0.4
    }), 'b2~lane.');
    S.add(fx.recolor(l.stateRect, {
      fill: isIf ? S.tone('compute', 0.6) : S.tone('violet', 0.6),
      d: 0.4
    }), 'b2~lane.');
  });

  // ---------------------------------------------------------------- b3: Two serial passes
  // Pass 1: Lanes 0-15 active (amber), Lanes 16-31 masked/idle (grey)
  warp.lanes.forEach((l, idx) => {
    if (idx >= 16) {
      S.add(fx.recolor(l.box, {
        fill: S.tone('muted', 0.08),
        stroke: S.tone('muted', 0.3),
        d: 0.3
      }), 'b3~masking');
      S.add(fx.recolor(l.stateRect, {
        fill: S.tone('muted', 0.15),
        d: 0.3
      }), 'b3~masking');
    }
  });
  S.add(fx.pulse(warp.lanes.slice(0, 16).map(l => l.box), { scale: 1.05, stagger: 0.01, d: 0.4 }), 'b3~runs');

  // Pass 2: Switch to else path (lanes 0-15 idle grey, lanes 16-31 active violet)
  warp.lanes.forEach((l, idx) => {
    if (idx < 16) {
      S.add(fx.recolor(l.box, {
        fill: S.tone('muted', 0.08),
        stroke: S.tone('muted', 0.3),
        d: 0.3
      }), 'b3~pass.');
      S.add(fx.recolor(l.stateRect, {
        fill: S.tone('muted', 0.15),
        d: 0.3
      }), 'b3~pass.');
    } else {
      S.add(fx.recolor(l.box, {
        fill: S.tone('violet', 0.35),
        stroke: S.tone('violet', 0.9),
        d: 0.3
      }), 'b3~pass.');
      S.add(fx.recolor(l.stateRect, {
        fill: S.tone('violet', 0.7),
        d: 0.3
      }), 'b3~pass.');
    }
  });

  // ---------------------------------------------------------------- b4: Idle waste & 50% throughput
  S.add(fx.in([calloutCard, calloutText], { from: 'up', d: 0.5 }), 'b4~cuts-0.2');
  S.add(fx.pulse(calloutCard, { scale: 1.05, d: 0.4 }), 'b4~half.');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
