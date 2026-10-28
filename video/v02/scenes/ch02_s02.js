/* ch02_s02 · throughput: high volume from slow lanes (fig 6)
   Movement 1 (b1): Throughput = finished work leaving per second. Factory floor entering and exiting.
   Movement 2 (b2): Latency is time inside; throughput is output frequency. Single slow package vs fast exit counter.
   Movement 3 (b3): The GPU trade: hundreds of slow parallel lanes produce massive collective volume. */

V.scene('ch02_s02', S => {
  const { fx } = S;
  const GX = 960, GY = 500;

  // Heading
  const heading = S.heading('Throughput: high volume from slow lanes', { y: 130 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // ---------------------------------------------------------------- b1: Factory throughput pipeline
  const fW = 1260, fH = 440;
  const factoryCard = S.card({
    x: GX - fW / 2, y: GY - fH / 2 - 10, w: fW, h: fH,
    tone: 'compute', title: ''
  });
  const fTitle = S.text('throughput pipeline: finished volume per second', {
    x: GX, y: GY - fH / 2 + 25, size: 24, anchor: 'middle', color: 'compute', weight: 650
  });

  // Entrance gate (left)
  const inGate = S.pill('input work', { x: GX - 480, y: GY - 130, h: 42, tone: 'struct', size: 22, weight: 650 });
  // Exit gate (right)
  const outGate = S.pill('output work', { x: GX + 480, y: GY - 130, h: 42, tone: 'helps', size: 22, weight: 650 });

  // 4 processing lanes through the facility
  const laneY0 = GY - 70;
  const laneH = 46;
  const lanes = [];
  for (let i = 0; i < 4; i++) {
    const ly = laneY0 + i * laneH;
    const line = S.line({ x1: GX - 480, y1: ly, x2: GX + 480, y2: ly, stroke: '#203254', sw: 3, dash: '6 4' });
    line.setAttribute('data-audit', 'ignore');
    lanes.push(line);
  }

  // Work items moving along lanes
  const workItems = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 5; j++) {
      const item = S.rect({
        x: GX - 460 + j * 190, y: laneY0 + i * laneH - 12, w: 28, h: 24, r: 4,
        fill: S.tone('compute'), stroke: S.tone('compute'), sw: 1
      });
      item.setAttribute('data-audit', 'ignore');
      workItems.push(item);
    }
  }

  // ---------------------------------------------------------------- b2: Single item's latency vs exit rate
  const soloPackage = S.rect({
    x: GX - 460, y: laneY0 + 2 * laneH - 14, w: 32, h: 28, r: 5,
    fill: S.tone('violet'), stroke: '#ffffff', sw: 2
  });
  soloPackage.setAttribute('data-audit', 'ignore');

  // Latency & throughput badges
  const latencyBadge = S.pill('single item latency: 50 ms inside', {
    x: GX - 270, y: GY + 140, h: 42, tone: 'violet', size: 20, weight: 600
  });
  const exitBadge = S.pill('throughput: 1,000,000 items / s', {
    x: GX + 270, y: GY + 140, h: 42, tone: 'helps', size: 20, weight: 650
  });

  // ---------------------------------------------------------------- b3: The GPU trade banner
  const tradePill = S.pill('the GPU trade: slow individual threads, massive collective throughput', {
    x: GX, y: GY + 230, h: 46, tone: 'helps', size: 22, weight: 650
  });

  // Concluding Takeaway
  const takeaway = S.takeaway('throughput measures output rate, not individual speed', {
    tone: 'compute'
  });

  // Initial hidden states
  const factoryElements = [factoryCard, fTitle, inGate, outGate, ...lanes, ...workItems];
  S.set([factoryElements, soloPackage, exitBadge, latencyBadge, tradePill, takeaway], { autoAlpha: 0 });

  // Animations
  S.add(fx.in(factoryElements, { from: 'fade', d: 0.6 }), 'b1~Throughput-0.2');

  S.add(fx.in(soloPackage, { from: 'fade', d: 0.35 }), 'b2~counts-0.1');
  S.add(gsap.to(soloPackage, { x: GX + 440, duration: 2.2, ease: 'linear' }), 'b2~inside-0.1');
  S.add(fx.in(exitBadge, { from: 'right', d: 0.4 }), 'b2~leaves');
  S.add(fx.in(latencyBadge, { from: 'left', d: 0.4 }), 'b2~spent');

  S.add(fx.in(tradePill, { from: 'up', d: 0.5 }), 'b3~trade-0.2');
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b3>-0.8');
});
