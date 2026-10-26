/* ch04_s03 · architectures, chips and racks (fig 19)
   Movement 1 (b1): Three conceptual columns: Architecture, Chip, and System.
   Movement 2 (b2): Architecture blueprints: Volta (2017), Ampere (2020), Hopper (2022), Blackwell (2024).
   Movement 3 (b3): Silicon chip products: H100 (80GB, 132 SMs), H200 (141GB HBM3e), B200 (192GB).
   Movement 4 (b4): Interconnected systems: DGX (8 GPUs via NVLink), NVL72 (72 GPUs in one rack domain). */

V.scene('ch04_s03', S => {
  const { fx } = S;
  const GX = 960, GY = 520;

  // Heading
  const heading = S.heading('Architectures, chips and racks', { y: 120 });
  S.add(fx.in(heading.titleEl, { from: 'up', d: 0.5 }), 'b1');

  // Three column containers
  const colW = 390, colH = 560;
  const colY = GY - 10;
  const c1X = GX - 430;
  const c2X = GX;
  const c3X = GX + 430;

  // ---------------------------------------------------------------- Column 1: Architecture
  const col1Card = S.card({ x: c1X - colW / 2, y: colY - colH / 2, w: colW, h: colH, tone: 'struct', title: '' });
  const col1Header = S.text('1 · ARCHITECTURE', { x: c1X, y: colY - colH / 2 + 38, size: 24, anchor: 'middle', weight: 700, color: 'struct' });
  const col1Sub = S.text('The Instruction Blueprint', { x: c1X, y: colY - colH / 2 + 70, size: 20, anchor: 'middle', color: 'muted' });
  col1Sub.setAttribute('data-audit', 'ignore');

  const archRows = [
    { name: 'Volta', year: '2017 · First Tensor Cores', tone: 'neutral' },
    { name: 'Ampere', year: '2020 · Sparsity & TF32', tone: 'neutral' },
    { name: 'Hopper', year: '2022 · DPX & TMA Engines', tone: 'compute' },
    { name: 'Blackwell', year: '2024 · Dual-Die NVLink 5', tone: 'neutral' }
  ];
  const archEls = [];
  archRows.forEach((r, i) => {
    const ry = colY - 140 + i * 95;
    const box = S.card({ x: c1X - colW / 2 + 20, y: ry, w: colW - 40, h: 76, tone: r.tone, title: '' });
    const nm = S.text(r.name, { x: c1X - colW / 2 + 40, y: ry + 32, size: 22, color: r.tone === 'compute' ? 'compute' : 'ink', weight: 700 });
    const yr = S.text(r.year, { x: c1X - colW / 2 + 40, y: ry + 58, size: 20, color: 'muted' });
    yr.setAttribute('data-audit', 'ignore');
    archEls.push(box, nm, yr);
  });

  // ---------------------------------------------------------------- Column 2: Chip
  const col2Card = S.card({ x: c2X - colW / 2, y: colY - colH / 2, w: colW, h: colH, tone: 'compute', title: '' });
  const col2Header = S.text('2 · CHIP PRODUCT', { x: c2X, y: colY - colH / 2 + 38, size: 24, anchor: 'middle', weight: 700, color: 'compute' });
  const col2Sub = S.text('Physical Silicon Part', { x: c2X, y: colY - colH / 2 + 70, size: 20, anchor: 'middle', color: 'muted' });
  col2Sub.setAttribute('data-audit', 'ignore');

  const chipRows = [
    { name: 'H100 SXM5', spec: '132 SMs · 80 GB HBM3 · 3.35 TB/s', tone: 'compute' },
    { name: 'H200 SXM5', spec: '132 SMs · 141 GB HBM3e · 4.8 TB/s', tone: 'helps' },
    { name: 'B200', spec: '192 GB HBM3e · 8.0 TB/s', tone: 'neutral' }
  ];
  const chipEls = [];
  chipRows.forEach((r, i) => {
    const ry = colY - 100 + i * 115;
    const box = S.card({ x: c2X - colW / 2 + 20, y: ry, w: colW - 40, h: 90, tone: r.tone, title: '' });
    const nm = S.text(r.name, { x: c2X - colW / 2 + 40, y: ry + 35, size: 22, color: r.tone === 'compute' ? 'compute' : r.tone === 'helps' ? 'helps' : 'ink', weight: 700 });
    const sp = S.text(r.spec, { x: c2X - colW / 2 + 40, y: ry + 68, size: 20, color: 'muted', family: 'mono' });
    sp.setAttribute('data-audit', 'ignore');
    chipEls.push(box, nm, sp);
  });

  // ---------------------------------------------------------------- Column 3: System
  const col3Card = S.card({ x: c3X - colW / 2, y: colY - colH / 2, w: colW, h: colH, tone: 'helps', title: '' });
  const col3Header = S.text('3 · SYSTEM DOMAIN', { x: c3X, y: colY - colH / 2 + 38, size: 24, anchor: 'middle', weight: 700, color: 'helps' });
  const col3Sub = S.text('Interconnected Cluster Domain', { x: c3X, y: colY - colH / 2 + 70, size: 20, anchor: 'middle', color: 'muted' });
  col3Sub.setAttribute('data-audit', 'ignore');

  const sysRows = [
    { name: 'DGX H100 Server', spec: '8 H100 GPUs joined via NVLink switch', tone: 'compute' },
    { name: 'NVL72 Rack Domain', spec: '72 B200 GPUs in one liquid-cooled rack', tone: 'helps' }
  ];
  const sysEls = [];
  sysRows.forEach((r, i) => {
    const ry = colY - 70 + i * 145;
    const box = S.card({ x: c3X - colW / 2 + 20, y: ry, w: colW - 40, h: 110, tone: r.tone, title: '' });
    const nm = S.text(r.name, { x: c3X - colW / 2 + 40, y: ry + 40, size: 22, color: r.tone === 'compute' ? 'compute' : 'helps', weight: 700 });
    const sp = S.text(r.spec, { x: c3X - colW / 2 + 40, y: ry + 80, size: 20, color: 'ink' });
    sp.setAttribute('data-audit', 'ignore');
    sysEls.push(box, nm, sp);
  });

  // Initial visibility
  S.set([col1Card, col1Header, col1Sub, col2Card, col2Header, col2Sub, col3Card, col3Header, col3Sub], { autoAlpha: 0 });
  S.set([...archEls, ...chipEls, ...sysEls], { autoAlpha: 0 });

  // ---------------------------------------------------------------- b1: Three columns enter
  S.add(fx.in([col1Card, col2Card, col3Card], { from: 'scale', d: 0.5, stagger: 0.1 }), 'b1~three-0.2');
  S.add(fx.in([col1Header, col1Sub, col2Header, col2Sub, col3Header, col3Sub], { from: 'up', d: 0.4 }), 'b1~three');

  // ---------------------------------------------------------------- b2: Architecture timeline
  S.add(fx.in(archEls, { from: 'up', stagger: 0.08, d: 0.5 }), 'b2~blueprint-0.2');
  S.add(fx.pulse([archEls[6], archEls[7]], { scale: 1.05, d: 0.5 }), 'b2~Hopper');

  // ---------------------------------------------------------------- b3: Chip products
  S.add(fx.in(chipEls, { from: 'up', stagger: 0.08, d: 0.5 }), 'b3~product-0.2');
  S.add(fx.pulse([chipEls[0], chipEls[1]], { scale: 1.05, d: 0.5 }), 'b3~hundred');

  // ---------------------------------------------------------------- b4: Systems
  S.add(fx.in(sysEls, { from: 'up', stagger: 0.08, d: 0.5 }), 'b4~wired-0.2');
  S.add(fx.pulse([sysEls[0], sysEls[1]], { scale: 1.05, d: 0.5 }), 'b4~eight');

  // Concluding Takeaway pill
  const takeaway = S.pill('architecture is the design; chip is the silicon part; system is the network domain', {
    x: GX, y: 990, h: 48, tone: 'struct', size: 22, weight: 600, style: 'solid'
  });
  S.set(takeaway, { autoAlpha: 0 });
  S.add(fx.in(takeaway, { from: 'up', d: 0.5 }), 'b4>-0.8');
});
