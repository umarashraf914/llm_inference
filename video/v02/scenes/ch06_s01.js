/* ch06_s01 · the register file and the trade (figs 26, 27, 28)
   Movement 1 (b1): Architecture bottleneck: memory cannot feed ALUs directly. Data must land in registers.
   Movement 2 (b2): Red prohibition on direct memory access; clean detour through register r0.
   Movement 3 (b3): 256 KB register file = 65,536 registers (single-cycle latency).
   Movement 4 (b4): 32 registers/thread = 2,048 threads (100% occupancy).
   Movement 5 (b5): 64 registers/thread = 1,024 threads (50% occupancy). Tradeoff revealed. */

V.scene('ch06_s01', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('The register file and the trade', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Top Section: Memory -> Register -> Math Pipeline
  const topCard = S.card({
    x: GX - 620, y: 175, w: 1240, h: 220,
    tone: 'struct', title: ''
  });
  const topTitle = S.text('REQUIRED DATA PATH: MEMORY CANNOT FEED ARITHMETIC DIRECTLY', {
    x: GX - 580, y: 212, size: 22, weight: 700, color: 'struct'
  });

  // Math ALU (left)
  const aluBox = S.pill('Math ALU', { x: GX - 440, y: 310, h: 48, tone: 'compute', size: 22, weight: 700 });

  // Registers (center: r0, r1, r2)
  const r0 = S.pill('Register r0', { x: GX - 160, y: 310, h: 48, tone: 'struct', size: 22, weight: 700 });
  const r1 = S.pill('Register r1', { x: GX + 20, y: 310, h: 48, tone: 'struct', size: 22, weight: 700 });

  // Memory (right)
  const memBox = S.pill('DRAM / HBM', { x: GX + 380, y: 310, h: 48, tone: 'bytes', size: 22, weight: 700 });

  // Legal flow arrows: Memory -> Register -> ALU
  const arr1 = S.line({ x1: GX + 270, y1: 310, x2: GX + 130, y2: 310, stroke: S.tone('struct'), sw: 3, arrow: true });
  arr1.setAttribute('data-audit', 'ignore');
  const arr2 = S.line({ x1: GX - 60, y1: 310, x2: GX - 330, y2: 310, stroke: S.tone('compute'), sw: 3, arrow: true });
  arr2.setAttribute('data-audit', 'ignore');

  // Illegal direct path (Memory -> ALU) with red strike
  const badPath = S.line({ x1: GX + 270, y1: 260, x2: GX - 330, y2: 260, stroke: S.tone('bytes'), sw: 2.5, dash: '6 4' });
  badPath.setAttribute('data-audit', 'ignore');
  const noDirectPill = S.pill('NO DIRECT MEMORY ARITHMETIC', { x: GX - 30, y: 260, h: 36, tone: 'bytes', size: 22, weight: 700 });

  // Bottom Section: 256 KB Register File & Occupancy Tradeoff
  const botCard = S.card({
    x: GX - 620, y: 425, w: 1240, h: 415,
    tone: 'neutral', title: ''
  });
  const botTitle = S.text('REGISTER ALLOCATION TRADEOFF · 256 KB ÷ 4 BYTES = 65,536 REGISTERS', {
    x: GX - 580, y: 465, size: 22, weight: 700, color: 'ink'
  });

  // Allocation Row 1: 32 regs/thread -> 100% occupancy
  const a1Y = 540;
  const a1Bar = S.rect({ x: GX - 580, y: a1Y - 22, w: 1160, h: 44, r: 8, fill: S.tone('helps'), stroke: S.tone('helps'), sw: 1 });
  a1Bar.setAttribute('data-audit', 'ignore');
  const a1Lbl = S.text('32 REGISTERS / THREAD  →  2,048 RESIDENT THREADS', {
    x: GX - 550, y: a1Y + 7, size: 22, color: '#0a0f1e', weight: 700
  });
  const a1Badge = S.pill('100% OCCUPANCY', { x: GX + 440, y: a1Y, h: 38, tone: 'helps', size: 22, weight: 700, style: 'solid' });

  // Allocation Row 2: 64 regs/thread -> 50% occupancy
  const a2Y = 635;
  const a2Bar = S.rect({ x: GX - 580, y: a2Y - 22, w: 580, h: 44, r: 8, fill: S.tone('compute'), stroke: S.tone('compute'), sw: 1 });
  a2Bar.setAttribute('data-audit', 'ignore');
  const a2Idle = S.rect({ x: GX, y: a2Y - 22, w: 580, h: 44, r: 8, fill: '#141d30', stroke: '#253555', sw: 1 });
  a2Idle.setAttribute('data-audit', 'ignore');
  const a2Lbl = S.text('64 REGISTERS / THREAD  →  1,024 THREADS', {
    x: GX - 550, y: a2Y + 7, size: 22, color: '#0a0f1e', weight: 700
  });
  const a2Badge = S.pill('50% OCCUPANCY (HALF IDLE)', { x: GX + 380, y: a2Y, h: 38, tone: 'compute', size: 22, weight: 700 });

  // Allocation Row 3: 128 regs/thread -> 25% occupancy
  const a3Y = 730;
  const a3Bar = S.rect({ x: GX - 580, y: a3Y - 22, w: 290, h: 44, r: 8, fill: S.tone('bytes'), stroke: S.tone('bytes'), sw: 1 });
  a3Bar.setAttribute('data-audit', 'ignore');
  const a3Idle = S.rect({ x: GX - 290, y: a3Y - 22, w: 870, h: 44, r: 8, fill: '#141d30', stroke: '#253555', sw: 1 });
  a3Idle.setAttribute('data-audit', 'ignore');
  const a3Lbl = S.text('128 REGISTERS / THREAD  →  512 THREADS', {
    x: GX - 550, y: a3Y + 7, size: 22, color: '#0a0f1e', weight: 700
  });
  const a3Badge = S.pill('25% OCCUPANCY (75% IDLE)', { x: GX + 380, y: a3Y, h: 38, tone: 'bytes', size: 22, weight: 700 });

  // Initial visibility
  S.set([topCard, topTitle, aluBox, r0, r1, memBox, arr1, arr2], { autoAlpha: 0 });
  S.set([badPath, noDirectPill], { autoAlpha: 0 });
  S.set([botCard, botTitle, a1Bar, a1Lbl, a1Badge], { autoAlpha: 0 });
  S.set([a2Bar, a2Idle, a2Lbl, a2Badge, a3Bar, a3Idle, a3Lbl, a3Badge], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Pipeline intro
  S.add(fx.in([topCard, topTitle, aluBox, r0, r1, memBox, arr1, arr2], { from: 'scale', d: 0.6 }), 'b1~reach-0.2');

  // ---------------------------------------------------------------- b2: Prohibition of direct memory access
  S.add(fx.in([badPath, noDirectPill], { from: 'up', d: 0.5 }), 'b2~optional-0.2');
  S.add(fx.pulse(noDirectPill, { scale: 1.08, d: 0.5 }), 'b2~touch');

  // ---------------------------------------------------------------- b3: 256 KB register file size
  S.add(fx.in([botCard, botTitle], { from: 'up', d: 0.5 }), 'b3~contains-0.2');

  // ---------------------------------------------------------------- b4: 32 regs/thread = 2,048 threads
  S.add(fx.in([a1Bar, a1Lbl, a1Badge], { from: 'left', d: 0.5 }), 'b4~partitioned-0.2');
  S.add(fx.pulse(a1Badge, { scale: 1.05, d: 0.4 }), 'b4~fit');

  // ---------------------------------------------------------------- b5: 64 & 128 regs/thread occupancy drop
  S.add(fx.in([a2Bar, a2Idle, a2Lbl, a2Badge], { from: 'left', d: 0.5 }), 'b5~Double-0.2');
  S.add(fx.in([a3Bar, a3Idle, a3Lbl, a3Badge], { from: 'left', d: 0.5 }), 'b5~Hoarding');
  S.add(fx.pulse([a2Badge, a3Badge], { scale: 1.08, d: 0.5 }), 'b5~waits');

  // Concluding Takeaway pill
  const takeaway = S.pill('registers per thread trade one-for-one with occupancy', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b5>-0.8');
});
