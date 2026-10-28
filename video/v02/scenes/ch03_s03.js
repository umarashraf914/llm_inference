/* ch03_s03 · the bet: matrix multiplies and parallel independence (figs 13, 14)
   Movement 1 (b1): The Workload Bet banner: billions of identical operations.
   Movement 2 (b2): Serial execution (time 4) vs Parallel execution (time 1).
   Movement 3 (b3): The dependency hazard: job 2 waiting on job 1 serializes execution.
   Movement 4 (b4): Matrix multiplication inside a token: 4,096 × 4,096 = 16.7M independent ops. */

V.scene('ch03_s03', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('The bet: matrix multiplies and parallel independence', { y: 130 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // ---------------------------------------------------------------- b1: Workload Bet Banner
  const betCard = S.card({
    x: GX - 600, y: 170, w: 1200, h: 64,
    tone: 'compute', title: ''
  });
  const betText = S.text('the hardware bet: identical operations repeated billions of times', {
    x: GX, y: 208, size: 22, anchor: 'middle', weight: 650, color: 'compute'
  });

  // ---------------------------------------------------------------- b2: Serial vs Parallel Timelines
  const tGroup = S.g();
  const timelines = ch03ParallelTimeline(S, { cx: GX, cy: 440, parent: tGroup });

  // ---------------------------------------------------------------- b3: Dependency Hazard
  const depArrow = S.line({
    x1: GX + 100, y1: 295, x2: GX + 180, y2: 295,
    stroke: S.tone('bytes'), sw: 3, arrow: true
  });
  depArrow.setAttribute('data-audit', 'ignore');

  const depBadge = S.pill('dependency blocks parallel launch: job 2 needs job 1 output', {
    x: GX, y: 418, h: 40, tone: 'bytes', size: 22, weight: 650
  });

  // ---------------------------------------------------------------- b4: Matrix Multiply 4,096 x 4,096
  const matCard = S.card({
    x: GX - 600, y: 630, w: 1200, h: 210,
    tone: 'helps', title: ''
  });
  const matTitle = S.text('transformer decode step: 4,096 × 4,096 matrix-vector product', {
    x: GX - 560, y: 668, size: 22, weight: 650, color: 'helps'
  });

  const mEq1 = S.text('row vectors multiplied independently: 4,096 × 4,096 =', {
    x: GX - 560, y: 728, size: 22, color: 'ink', weight: 600
  });
  const mBadge = S.pill('16,777,216 independent multiply-adds', {
    x: GX + 330, y: 726, h: 44, tone: 'helps', size: 22, weight: 650
  });
  const mSub = S.text('every single multiplication can run simultaneously with zero inter-thread dependencies', {
    x: GX - 560, y: 785, size: 22, color: 'muted', weight: 550
  });

  // Concluding Takeaway
  const takeaway = S.takeaway('parallelism is vast within each token, but starved by memory delivery', {
    tone: 'helps'
  });

  // Initial visibility
  S.set([betCard, betText, tGroup, depArrow, depBadge, matCard, matTitle, mEq1, mBadge, mSub, takeaway], { autoAlpha: 0 });

  // Animations
  S.add(fx.in([betCard, betText], { from: 'up', d: 0.4 }), 'b1~bet-0.2');

  // b2: Parallel timelines appear
  S.add(fx.in(tGroup, { from: 'fade', d: 0.6 }), 'b2~sequence-0.2');

  // b3: Dependency hazard
  S.add(fx.in([depArrow, depBadge], { from: 'up', d: 0.4 }), 'b3~depend-0.2');

  // b4: Matrix multiply independence
  S.add(fx.in([matCard, matTitle, mEq1, mBadge, mSub], { from: 'up', d: 0.5 }), 'b4~matrix-0.2');
  S.add(fx.pulse(mBadge, { scale: 1.06, d: 0.5 }), 'b4~sixteen');

  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
