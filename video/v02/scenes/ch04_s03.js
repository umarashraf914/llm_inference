/* ch04_s03 · architectures, chips and racks (fig 19)
   Movement 1 (b1): Three conceptual columns: Architecture, Chip, and System.
   Movement 2 (b2): Architecture blueprints: Volta (2017), Ampere (2020), Hopper (2022), Blackwell (2024).
   Movement 3 (b3): Silicon chip products: V100, A100, H100/H200, B200/GB200 with connecting arrows.
   Movement 4 (b4): Interconnected systems: DGX (8 GPUs via NVLink), NVL72 (72 GPUs in one rack). */

V.scene('ch04_s03', S => {
  const { fx } = S;
  const GX = 960, GY = 510;

  // Heading
  const heading = S.heading('architectures, chips and racks', { y: 110 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Background hierarchy carrier
  const frameW = 1420, frameH = 560;
  const frame = S.rect({
    x: GX - frameW / 2, y: GY - frameH / 2 + 10, w: frameW, h: frameH, r: 16,
    fill: '#0a0f1d', stroke: S.tone('struct'), sw: 1.5
  });

  // Three column headers
  const col1X = GX - 470; // Architecture
  const col2X = GX - 60;  // Chip
  const col3X = GX + 420; // System
  const headY = GY - frameH / 2 + 50;

  const h1 = S.text('1 · architecture (design)', { x: col1X, y: headY, size: 22, anchor: 'middle', weight: 700, color: 'struct' });
  const h2 = S.text('2 · chip (silicon product)', { x: col2X, y: headY, size: 22, anchor: 'middle', weight: 700, color: 'compute' });
  const h3 = S.text('3 · system (network domain)', { x: col3X, y: headY, size: 22, anchor: 'middle', weight: 700, color: 'helps' });

  const rowsData = [
    {
      arch: 'Volta, 2017',
      chip: 'V100 · 16–32 GB',
      sys: 'DGX-1 · 8 GPUs',
      gold: false,
      hasSys: false
    },
    {
      arch: 'Ampere, 2020',
      chip: 'A100 · 40–80 GB',
      sys: 'DGX A100 · 8 GPUs (NVLink 3)',
      gold: false,
      hasSys: true
    },
    {
      arch: 'Hopper, 2022',
      chip: 'H100 · 80 GB / H200 · 141 GB',
      sys: 'DGX H100 · 8 GPUs (NVLink 4)',
      gold: true,
      hasSys: true
    },
    {
      arch: 'Blackwell, 2024',
      chip: 'B200 · 192 GB / GB200',
      sys: 'GB200 NVL72 · 72 GPUs in one rack',
      gold: false,
      hasSys: true
    }
  ];

  const rowY0 = headY + 55;
  const rowGap = 92;
  const archEls = [];
  const chipEls = [];
  const sysEls = [];
  let hopperEls = [];

  rowsData.forEach((r, i) => {
    const ry = rowY0 + i * rowGap;
    const isGold = r.gold;

    // Box 1: Architecture
    const b1W = 280, b1H = 56;
    const box1 = S.rect({
      x: col1X - b1W / 2, y: ry, w: b1W, h: b1H, r: 8,
      fill: isGold ? '#2b1c0a' : '#152238',
      stroke: isGold ? S.tone('compute') : S.tone('struct'),
      sw: isGold ? 2 : 1
    });
    box1.setAttribute('data-audit', 'ignore');
    const t1 = S.text(r.arch, {
      x: col1X, y: ry + 36, size: 22, anchor: 'middle', weight: 700,
      color: isGold ? 'compute' : 'ink'
    });
    archEls.push(box1, t1);

    // Arrow 1 -> 2
    const a1 = S.line({
      x1: col1X + b1W / 2 + 10, y1: ry + b1H / 2,
      x2: col2X - 160 - 10, y2: ry + b1H / 2,
      stroke: isGold ? S.tone('compute') : '#475569', sw: 2, arrow: true
    });
    a1.setAttribute('data-audit', 'ignore');

    // Box 2: Chip
    const b2W = 320, b2H = 56;
    const box2 = S.rect({
      x: col2X - b2W / 2, y: ry, w: b2W, h: b2H, r: 8,
      fill: isGold ? '#2b1c0a' : '#1e293b',
      stroke: isGold ? S.tone('compute') : '#334155',
      sw: isGold ? 2 : 1
    });
    box2.setAttribute('data-audit', 'ignore');
    const t2 = S.text(r.chip, {
      x: col2X, y: ry + 36, size: 22, anchor: 'middle', weight: 700,
      color: isGold ? 'compute' : 'ink'
    });
    chipEls.push(box2, t2, a1);

    if (isGold) {
      hopperEls = [box1, t1, box2, t2, a1];
    }

    // Box 3: System (if present)
    if (r.hasSys) {
      const a2 = S.line({
        x1: col2X + b2W / 2 + 10, y1: ry + b2H / 2,
        x2: col3X - 220 - 10, y2: ry + b2H / 2,
        stroke: isGold ? S.tone('compute') : '#475569', sw: 2, arrow: true
      });
      a2.setAttribute('data-audit', 'ignore');

      const b3W = 440, b3H = 56;
      const box3 = S.rect({
        x: col3X - b3W / 2, y: ry, w: b3W, h: b3H, r: 8,
        fill: isGold ? '#142e2b' : '#132337',
        stroke: isGold ? S.tone('helps') : '#334155',
        sw: isGold ? 1.5 : 1
      });
      box3.setAttribute('data-audit', 'ignore');
      const t3 = S.text(r.sys, {
        x: col3X, y: ry + 36, size: 22, anchor: 'middle', weight: 600,
        color: isGold ? 'helps' : 'ink'
      });
      sysEls.push(box3, t3, a2);
      if (isGold) {
        hopperEls.push(box3, t3, a2);
      }
    }
  });

  // Reference note
  const refNote = S.text('gold: Hopper and the H100, the reference architecture and chip used throughout this atlas', {
    x: GX, y: rowY0 + 4 * rowGap + 18, size: 20, anchor: 'middle', color: 'compute'
  });

  // Initial visibility
  S.set([frame, h1, h2, h3, refNote], { autoAlpha: 0 });
  S.set([...archEls, ...chipEls, ...sysEls], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Three columns enter
  S.add(fx.in([frame, h1, h2, h3], { from: 'fade', d: 0.5 }), 'b1~three-0.2');
  S.add(fx.pulse([h1, h2, h3], { scale: 1.04, d: 0.4 }), 'b1~three');

  // ---------------------------------------------------------------- b2: Architecture timeline
  S.add(fx.in(archEls, { from: 'fade', stagger: 0.08, d: 0.5 }), 'b2~blueprint-0.2');
  S.add(fx.pulse(hopperEls.slice(0, 2), { scale: 1.05, d: 0.5 }), 'b2~Hopper');

  // ---------------------------------------------------------------- b3: Chip products
  S.add(fx.in(chipEls, { from: 'fade', stagger: 0.08, d: 0.5 }), 'b3~product-0.2');
  S.add(fx.pulse(hopperEls.slice(2, 5), { scale: 1.05, d: 0.5 }), 'b3~hundred');

  // ---------------------------------------------------------------- b4: Systems
  S.add(fx.in([...sysEls, refNote], { from: 'fade', stagger: 0.08, d: 0.5 }), 'b4~wired-0.2');
  S.add(fx.pulse(sysEls.slice(-3), { scale: 1.05, d: 0.5 }), 'b4~eight');

  // Concluding Takeaway band
  const takeaway = S.takeaway('architecture is the layout; chip is the part; system is the network domain', {
    tone: 'struct'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
