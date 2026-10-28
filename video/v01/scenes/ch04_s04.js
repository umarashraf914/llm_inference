/* ch04_s04 · how little crosses the network (fig 29)
   One turn on the wire: ≤ 4 KB up once, nothing up during the answer, 500 frames × ≈ 44 bytes ≈ 22 KB down;
   ≤ 26 KB per turn. Inside the machine every token reads all 140 GB: 500 × 140 GB = 70 TB, and at
   4.8 TB/s (H200) 70 ÷ 4.8 ≈ 14.6 s, the 15 s you watched. 70 TB ÷ 22 KB ≈ 3.2 billion: a millimetre
   against ≈ 3,200 km. The network was never the constraint. */
V.scene('ch04_s04', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const GREY = '#8a94aa', KB = 6;                          // ledger bars: 1 KB = 6 px

  // ---------------------------------------------------------------- b1: the ledger, bytes on the wire for one full turn
  const led = S.g();
  // alone in b1, the ledger (x 140-820, y 177-720) sits at the centre of the frame (ledW); it moves to the left
  // half as the machine arrives on the right in b2
  const ledW = S.g();
  ledW.appendChild(led);
  S.set(ledW, { x: 480, y: 90 }, 0);
  const title = S.text('Bytes on the wire, one full turn', { x: 140, y: 196, size: 36, weight: 700, color: 'ink' }, led);
  const legend = S.text('1 byte ≈ 1 letter  ·  1 KB = 1,000 bytes', { x: 140, y: 240, size: 24, weight: 550, color: 'muted' }, led);
  S.set([title, legend], { autoAlpha: 0 }, 0);
  S.add(fx.in(title, { from: 'up', d: 0.5 }), 0.15);
  S.add(fx.in(legend, { from: 'up', d: 0.35, dist: 10 }), 'b1~Count');
  const ROWS = [
    { name: 'Up, once', kb: 4, val: '≤ 4 KB of prompt', cue: 'b1~most' },
    { name: 'Up, during the answer', kb: 0, val: 'nothing at all', cue: 'b1~nothing' },
    { name: 'Down, 500 frames', kb: 22, val: '≈ 22 KB in total', cue: 'b1~twenty-two' },
  ];
  const rows = ROWS.map((r, i) => {
    const y = 320 + i * 118, g = S.g(null, led);
    S.text(r.name, { x: 140, y, size: 28, weight: 650, color: 'ink' }, g);
    S.rect({ x: 140, y: y + 26, w: 300, h: 22, r: 4, stroke: '#ffffff', strokeOpacity: 0.12, sw: 1.5 }, g);
    const bar = S.rect({ x: 140, y: y + 26, w: 0, h: 22, r: 4, fill: GREY }, g);
    S.text(r.val, { x: 460, y: y + 38, size: 26, weight: 600, color: r.kb ? 'ink' : 'muted' }, g);
    S.set(g, { autoAlpha: 0 }, 0);
    S.add(fx.in(g, { from: 'left', d: 0.4, dist: 14 }), T(r.cue) - 0.15);
    if (r.kb) S.add(gsap.to(bar, { attr: { width: r.kb * KB }, duration: 0.5, ease: 'power2.out' }), T(r.cue) + 0.1);
    return g;
  });
  const each = S.text('≈ 44 bytes each, mostly packaging', { x: 460, y: 320 + 2 * 118 + 74, size: 22, weight: 550, color: 'muted' }, led);
  const rule = S.line({ x1: 140, y1: 668, x2: 820, y2: 668, stroke: '#ffffff', strokeOpacity: 0.18, sw: 2 }, led);
  const total = S.text('≤ 26 KB per turn', { x: 140, y: 708, size: 32, weight: 700, color: 'ink' }, led);
  S.set([each, rule, total], { autoAlpha: 0 }, 0);
  S.add(fx.in(each, { from: 'up', d: 0.35, dist: 10 }), T('b1~twenty-two') + 0.6);
  S.add(fx.in([rule, total], { from: 'fade', d: 0.4, stagger: 0.15 }), T('b1~down') + 0.1);

  // ---------------------------------------------------------------- b2: inside the machine, every token reads all 140 GB
  const B2 = T('b2~Inside') - 0.1;
  S.add(gsap.to(led, { opacity: 0.6, duration: 0.5 }), B2);
  S.add(gsap.fromTo(ledW, { x: 480, y: 90 }, { x: 0, y: 0, duration: 0.8, ease: 'power2.inOut', immediateRender: false }), B2 - 0.3);
  const gpu = S.gpu({ x: 1380, y: 450, scale: 0.95, stacks: 3, labels: false });
  const wLbl = S.text('140 GB of weights', { x: 1380, y: gpu.t - 28, size: 30, anchor: 'middle', weight: 650, color: 'bytes' });
  S.set([gpu, wLbl], { autoAlpha: 0 }, 0);
  S.add(fx.in(gpu, { from: 'fade', d: 0.6 }), B2);
  S.add(fx.in(wLbl, { from: 'up', d: 0.4, dist: 10 }), B2 + 0.3);
  gpu.buses.forEach(b => S.flow({ d: b.__d, from: T('b2~reads') - 0.2, to: T('b4') - 0.1, speed: 320, every: 0.08, size: 6, color: 'bytes' }));
  const perTok = S.text('per token: 140 GB', { x: 1380, y: gpu.b + 46, size: 30, anchor: 'middle', weight: 650, family: 'mono', color: 'bytes' });
  const alone = S.pill('one answer, running alone', { x: 1380, y: gpu.b + 98, h: 40, size: 22, tone: 'neutral', style: 'outline' });
  S.set([perTok, alone], { autoAlpha: 0 }, 0);
  S.add(fx.in(perTok, { from: 'up', d: 0.35, dist: 10 }), 'b2~hundred');
  S.add(fx.in(alone, { from: 'fade', d: 0.35 }), 'b2~machine#2');
  const EQY = gpu.b + 160;
  const eq1 = S.equation([{ t: '500' }, { t: '×', tone: 'muted' }, { t: '140 GB' }, { t: '=', tone: 'muted' }, { t: '70 TB', tone: 'bytes' }], { x: 1380, y: EQY, size: 36, color: 'bytes' });
  S.set(eq1.parts, { autoAlpha: 0 }, 0);
  S.add(fx.in(eq1.parts.slice(0, 3), { from: 'up', d: 0.3, dist: 10, stagger: 0.1 }), 'b2~Five');
  S.add(fx.in(eq1.parts.slice(3), { from: 'up', d: 0.3, dist: 10, stagger: 0.1 }), 'b2~seventy');

  // ---------------------------------------------------------------- b3: on an H200 at 4.8 TB/s, about fifteen seconds: the fifteen you watched
  const h200 = S.pill('H200', { x: gpu.l + 50, y: gpu.t + 28, h: 36, size: 22, tone: 'neutral', style: 'solid' });
  S.set(h200, { autoAlpha: 0 }, 0);
  S.add(fx.in(h200, { from: 'down', d: 0.35, dist: 10 }), 'b3~H');
  S.add(fx.out(alone, { d: 0.3 }), 'b3~four-0.2');
  const eq2 = S.equation([{ t: '70 TB' }, { t: '÷', tone: 'muted' }, { t: '4.8 TB/s' }, { t: '≈', tone: 'muted' }, { t: '14.6 s', tone: 'ink' }], { x: 1380, y: EQY + 56, size: 36, color: 'bytes' });
  S.set(eq2.parts, { autoAlpha: 0 }, 0);
  S.add(fx.in(eq2.parts.slice(0, 3), { from: 'up', d: 0.3, dist: 10, stagger: 0.1 }), 'b3~four');
  S.add(fx.in(eq2.parts.slice(3), { from: 'up', d: 0.3, dist: 10, stagger: 0.1 }), 'b3~fifteen');
  // the streamed bar from the round-trip chart (12 px per second) slides in under the ledger
  const sb = S.g();
  S.text('Streamed, one connection', { x: 140, y: 790, size: 26, weight: 650, color: 'struct' }, sb);
  S.rect({ x: 140, y: 812, w: 15 * 12, h: 36, r: 5, fill: 'struct', fillOpacity: 0.9 }, sb);
  S.text('15 s', { x: 140 + 15 * 12 + 14, y: 831, size: 28, weight: 650, family: 'mono', color: 'ink' }, sb);
  S.set(sb, { autoAlpha: 0 }, 0);
  const W15 = T('b3~fifteen#2') - 0.1;
  S.add(gsap.fromTo(sb, { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power3.out' }), W15 - 0.2);
  const res = eq2.parts[4];
  const conn = ignore(S.path({ d: `M${140 + 15 * 12 + 104},836 C900,900 ${res.cx},${EQY + 140} ${res.cx},${EQY + 82}`, stroke: 'ink', sw: 2, dash: '6 6', strokeOpacity: 0.7 }));
  S.set(conn, { autoAlpha: 0 }, 0);
  S.add(gsap.set(conn, { autoAlpha: 1 }), W15 + 0.2);
  S.add(fx.draw(conn, { d: 0.5 }), W15 + 0.2);
  S.add(fx.pulse([sb, res], { scale: 1.08, d: 0.5 }), W15 + 0.7);

  // ---------------------------------------------------------------- b4: twenty-two kilobytes against seventy terabytes
  const B4 = T('b4') - 0.15;
  S.add(fx.out([led, sb, conn], { d: 0.4, stagger: 0 }), B4);
  S.add(gsap.to([gpu, wLbl, perTok, h200, ...eq1.parts, ...eq2.parts], { opacity: 0.12, duration: 0.5 }), B4);
  const BY = 700;
  const dot = S.circle({ x: 220, y: BY, r: 9, fill: GREY });
  const dotT = S.text('22 KB = 1 mm', { x: 220, y: BY - 34, size: 28, anchor: 'middle', weight: 650, color: 'ink' });
  S.set([dot, dotT], { autoAlpha: 0 }, 0);
  S.add(fx.pop(dot, { d: 0.4 }), 'b4~Twenty-two');
  S.add(fx.in(dotT, { from: 'up', d: 0.35, dist: 10 }), T('b4~Twenty-two') + 0.2);
  const ratio = S.text('≈ 3.2 billion ×', { x: 960, y: 600, size: 52, anchor: 'middle', weight: 700, family: 'display', color: 'ink' });
  S.set(ratio, { autoAlpha: 0 }, 0);
  S.add(fx.in(ratio, { from: 'scale', scale: 1.15, d: 0.45 }), 'b4~billion-0.1');
  const line = ignore(S.line({ x1: 240, y1: BY, x2: 2100, y2: BY, stroke: 'bytes', sw: 8, cap: 'round' }));
  S.set(line, { autoAlpha: 0 }, 0);
  const KM = T('b4~three#2') - 0.1;
  S.add(gsap.set(line, { autoAlpha: 1 }), KM);
  S.add(gsap.fromTo(line, { attr: { x2: 240 } }, { attr: { x2: 2100 }, duration: 0.7, ease: 'power3.in', immediateRender: false }), KM);
  const km = S.text('≈ 3,200 km', { x: 1760, y: BY - 34, size: 32, anchor: 'end', weight: 700, color: 'bytes' });
  const nts = S.text('not to scale', { x: 1760, y: BY + 46, size: 24, anchor: 'end', weight: 550, color: 'muted' });
  S.set([km, nts], { autoAlpha: 0 }, 0);
  S.add(fx.in(km, { from: 'left', d: 0.35, dist: 12 }), KM + 0.6);
  S.add(fx.in(nts, { from: 'fade', d: 0.3 }), KM + 0.8);
  // blaming the network is almost always wrong
  const BL = T('b4~Blaming') - 0.15;
  S.add(fx.out([dot, dotT, ratio, line, km, nts], { d: 0.4, stagger: 0 }), BL);
  S.add(gsap.to([gpu, wLbl, perTok, h200, ...eq1.parts, ...eq2.parts], { autoAlpha: 0, duration: 0.4 }), BL);
  // the two pills, 130 px apart, as one pair centred on the screen
  const pillW = t => S.measure(t, { size: 32, weight: 600 }) + 44;
  const PL = 960 - (pillW('network: kilobytes') + 130 + pillW('inside the machine: terabytes')) / 2;
  const tN = S.pill('network: kilobytes', { x: PL, y: 500, h: 64, size: 32, tone: 'neutral', style: 'soft', anchor: 'start' });
  const tM = S.pill('inside the machine: terabytes', { x: PL + tN.w + 130, y: 500, h: 64, size: 32, tone: 'bytes', style: 'soft', anchor: 'start' });
  const never = S.text('the network was never the constraint', { x: 960, y: 620, size: 40, anchor: 'middle', weight: 700, family: 'display', color: 'ink' });
  S.set([tN, tM, never], { autoAlpha: 0 }, 0);
  S.add(fx.pop(tN, { d: 0.45 }), BL + 0.4);
  S.add(fx.pop(tM, { d: 0.45 }), BL + 0.65);
  S.add(fx.in(never, { from: 'up', d: 0.5, dist: 14 }), 'b4~almost-0.2');
});
