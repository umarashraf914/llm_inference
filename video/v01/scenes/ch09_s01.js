/* ch09_s01 · the whole model, and where it can sit (figs 105, 106)
   Stage 1 (b1-b2): ch08's '70.6 B parameters' drops into a worked line under 'parameter count × bytes per
   parameter = memory'; the 140 GB swells into a block and settles in the memory beside the chip.
   Stage 2 (b3-b5): the same block fetched from three places on one 0-20 s scale: disk (20 s), the memory
   beside the chip (a 2.5 px sliver, 42 ms), the chip itself (it does not fit). The disk row leaves; the
   container glides to the centre for s02. */
V.scene('ch09_s01', S => {
  const { fx } = S;
  const WL = 54;                                   // worked-line size; the strip is the same pieces at 30
  const EQ_Y = 262, WL_Y = 372;
  const mono = (t, size = WL) => S.measure(t, { size, weight: 600, family: 'mono' });
  const sans = (t, size = WL, w = 600) => S.measure(t, { size, weight: w });
  const show = (els, d = 0.5) => gsap.fromTo(els, { autoAlpha: 0 }, { autoAlpha: 1, duration: d, ease: 'power2.out' });

  // ================================================================ stage 1 · the equation
  const eq = S.equation([
    { t: 'parameter count', tone: 'struct' }, { t: '×', tone: 'ink' }, { t: 'bytes per parameter', tone: 'bytes' },
    { t: '=', tone: 'ink' }, { t: 'memory', tone: 'bytes' }], { x: 960, y: EQ_Y, size: 52, gap: 26 });
  eq.parts.forEach(p => { p.style.opacity = 0; p.style.visibility = 'hidden'; });

  // the worked-line pieces, each in an xform holder whose origin is the piece's left end on the centre line
  const xW = sans('×'), eqW = sans('='), w2 = mono('2 bytes'), slotPad = 18, slotW = w2 + 2 * slotPad, slotH = 84;
  const wNum = mono('70.6 B'), wWord = sans('parameters', 44);
  const opening = S.g();                           // the fraction frame (drawn first: it sits behind the number)
  const hA = S.g(), hX = S.g(), hSlot = S.g(), hEq = S.g(), hGB = S.g();
  const t70 = S.text('70', { x: 0, y: 0, size: WL, family: 'mono', weight: 600, color: 'struct' }, hA);
  const t06 = S.text('.6', { x: mono('70'), y: 0, size: WL, family: 'mono', weight: 600, color: 'struct' }, hA);
  const tB = S.text('B', { x: mono('70.6 '), y: 0, size: WL, family: 'mono', weight: 600, color: 'struct' }, hA);
  const tWord = S.text('parameters', { x: wNum + 20, y: 3, size: 44, weight: 600, color: 'struct' }, hA);
  S.text('×', { x: 0, y: 0, size: WL, weight: 600, color: 'ink' }, hX);
  const slotBox = S.rect({ x: 0, y: -slotH / 2, w: slotW, h: slotH, r: 14, stroke: 'faint', sw: 2.5, dash: '10 8' }, hSlot);
  const t2 = S.text('2 bytes', { x: slotW / 2, y: 0, size: WL, family: 'mono', weight: 600, color: 'bytes', anchor: 'middle' }, hSlot);
  t2.style.opacity = 0; t2.style.visibility = 'hidden';
  const tEq = S.text('=', { x: 0, y: 0, size: WL, weight: 600, color: 'ink' }, hEq);
  const gb = S.counter({ x: 0, y: 0, size: WL, value: 140, suffix: ' GB', color: 'bytes', family: 'mono', weight: 600 }, hGB);

  // ---- the opening frame, as ch08 leaves it: '70.6 B parameters' over a blank denominator, a '×' slot beside it
  const O_Y = 500, fullW = wNum + 20 + wWord, boxW = fullW + 64;
  const rowW = boxW + 34 + xW + 26 + slotW, oL = 960 - rowW / 2;
  S.rect({ x: oL, y: O_Y - 52, w: boxW, h: 104, r: 18, fill: '#0c1326', filter: 'url(#shadow)' }, opening);
  S.rect({ x: oL, y: O_Y - 52, w: boxW, h: 104, r: 18, fill: 'url(#card-struct)', stroke: 'compute', sw: 3 }, opening);
  const fracBar = S.line({ x1: oL, y1: O_Y + 80, x2: oL + boxW, y2: O_Y + 80, stroke: 'ink', sw: 4, strokeOpacity: 0.85 });
  const denom = S.rect({ x: oL + boxW / 2 - 130, y: O_Y + 104, w: 260, h: 84, r: 14, stroke: 'faint', sw: 2.5, dash: '10 8' });
  S.xset(hA, { x: oL + 32, y: O_Y });
  S.xset(hX, { x: oL + boxW + 34, y: O_Y });
  S.xset(hSlot, { x: oL + boxW + 34 + xW + 26, y: O_Y });

  // worked-line targets: each piece centred under its term ('× 2 bytes' measured as it reads once filled)
  const P = eq.parts;
  const aL = P[0].cx - mono('70 B') / 2;
  const bVis = xW + 26 + slotPad + w2, bL = P[2].cx - bVis / 2;
  const cL = P[4].cx - (eqW + 20 + mono('140 GB')) / 2;
  S.xset(hEq, { x: cL, y: WL_Y });
  S.xset(hGB, { x: cL + eqW + 20, y: WL_Y });
  [tEq, gb].forEach(e => { e.style.opacity = 0; e.style.visibility = 'hidden'; });

  // b1: the fraction dissolves; the equation draws on; the number and its slot drop into the worked line
  S.add(fx.out([opening, fracBar, denom], { d: 0.55, stagger: 0.06 }), 'b1+0.05');
  P.forEach((p, i) => S.add(fx.in(p, { from: 'down', d: 0.6, dist: 24 }), `b1+${(0.3 + i * 0.2).toFixed(2)}`));
  const drop = gsap.timeline();
  drop.add(fx.xform(hA, { x: aL, y: WL_Y }, { d: 0.85, ease: 'power3.inOut' }), 0);
  drop.add(fx.xform(hX, { x: bL, y: WL_Y }, { d: 0.85, ease: 'power3.inOut' }), 0.06);
  drop.add(fx.xform(hSlot, { x: bL + xW + 26, y: WL_Y }, { d: 0.85, ease: 'power3.inOut' }), 0.1);
  drop.to(tWord, { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 0);
  S.add(drop, 'b1+0.85');
  // 'seventy billion': the .6 rounds away; a side note keeps the exact count
  const round = gsap.timeline();
  round.to(t06, { autoAlpha: 0, y: 14, duration: 0.3, ease: 'power2.in' }, 0);
  round.fromTo(tB, { x: 0 }, { x: -mono('.6'), duration: 0.4, ease: 'power3.inOut' }, 0.15);
  S.add(round, 'b1~seventy+0.12');
  // the note sits under the number it keeps exact, on the same line as the '16-bit' tag
  const note = S.text([{ t: '70.6 B × 2 = 141.2 GB ' }, { t: '≈ 140', c: 'ink' }], { x: aL, y: WL_Y + 58, size: 26, color: 'muted', weight: 500 });
  S.add(fx.in(note, { from: 'up', d: 0.55, dist: 14 }), 'b1~billion+0.1');
  // 'two bytes': the slot fills
  S.add(gsap.to(slotBox, { autoAlpha: 0, duration: 0.3 }), 'b1~two-0.15');
  S.add(fx.pop(t2, { from: 0.6, d: 0.5 }), 'b1~two-0.1');
  const bit = S.text('16-bit', { x: bL + xW + 26 + slotW / 2, y: WL_Y + 58, size: 26, anchor: 'middle', color: 'muted', weight: 500 });
  S.add(fx.in(bit, { from: 'up', d: 0.5 }), 'b1~each-0.1');
  // 'a hundred and forty gigabytes': '= 140 GB' lands and counts
  S.add(fx.in(tEq, { from: 'left', d: 0.45, dist: 20 }), 'b1~hundred-0.25');
  S.add(show(gb, 0.3), 'b1~hundred-0.1');
  S.add(fx.count(gb, 0, 140, { d: 1.05, ease: 'power2.out' }), 'b1~hundred-0.1');

  // ================================================================ stage 1 · where it sits
  // the tags (right-aligned at TGX), the container and the chip make one row, centred (x 471-1450)
  const MEM0 = { x: 1079, y: 690 }, CHIP0 = { x: 1399, y: 690 }, LBL_Y = 822, TGX = 859;
  const mem = ch09Memory(S, { x: MEM0.x, y: MEM0.y });
  const chip = ch09Chip(S, { x: CHIP0.x, y: CHIP0.y });
  mem.style.opacity = 0; mem.style.visibility = 'hidden';
  const memLbl = S.text('memory beside the chip', { x: MEM0.x, y: LBL_Y, size: 30, anchor: 'middle', weight: 600, color: 'ink' });
  const chipLbl = S.text('chip', { x: CHIP0.x, y: LBL_Y, size: 30, anchor: 'middle', weight: 600, color: 'compute' });
  S.add(show(mem, 0.5), 'b1>-0.1');
  S.add(fx.draw(mem.frame, { d: 0.8 }), 'b1>-0.1');
  S.add(chip.chip.drawOn({ d: 1.0 }), 'b1>+0.05');
  S.add(fx.in([memLbl, chipLbl], { from: 'up', d: 0.55, stagger: 0.12 }), 'b1>+0.3');

  // b2: the side note steps back; the 140 GB swells into the block and settles in the container
  S.add(fx.dim(note, { to: 0.3 }), 'b2');
  const gbCx = cL + eqW + 20 + mono('140 GB') / 2;
  const k0 = mono('140 GB') / mem.inner.w;          // the block starts the width of the text
  S.xset(mem.blockHolder, { x: gbCx - MEM0.x, y: WL_Y - MEM0.y, s: k0 });
  const swell = gsap.timeline();
  swell.fromTo(mem.blockHolder, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: 'power2.out' }, 0);
  swell.add(fx.xform(mem.blockHolder, { s: k0 * 1.35 }, { d: 0.35, ease: 'back.out(2)' }), 0);
  swell.add(fx.xform(mem.blockHolder, { x: 0, y: 0, s: 1 }, { d: 0.85, ease: 'power3.inOut' }), 0.4);
  swell.add(mem.glow({ d: 0.8 }), 1.15);
  // the worked line's '= 140 GB' gives way to the block it becomes, and is back once the block has gone
  swell.to([tEq, gb], { autoAlpha: 0, duration: 0.15, ease: 'power1.in' }, 0);
  swell.fromTo([tEq, gb], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out', immediateRender: false }, 1.0);
  S.add(swell, 'b2~entire-0.15');
  // three facts, one at a time, each stepping back as the next lands
  const TAGS = ['the entire model', 'off the chip', 'same for every request'];
  const tagAt = ['b2~entire+0.15', 'b2~off-0.1', 'b2~same-0.1'];
  const tags = TAGS.map((t, i) => S.text(t, { x: TGX, y: 630 + i * 62, size: 32, anchor: 'end', weight: 600, color: 'ink' }));
  tags.forEach((t, i) => {
    S.add(fx.in(t, { from: 'right', d: 0.55, dist: 30 }), tagAt[i]);
    if (i) S.add(fx.dim(tags[i - 1], { to: 0.4 }), tagAt[i]);
  });
  S.add(chip.chip.pulse({ d: 0.6 }), 'b2~chip-0.1');
  S.add(mem.glow({ d: 0.9 }), 'b2~memory-0.05');
  const take = S.takeaway('all of it beside the chip, none on it', { tone: 'bytes' });
  S.add(fx.in(take, { from: 'up', d: 0.6 }), 'b2~request-0.2');

  // ================================================================ stage 2 · three places, one scale
  const R = [370, 550, 730];                        // row centre lines
  const ICX = 150, LX = 222;                        // icon column, label column
  const AX = { x: 596, w: 1200, y: 850 };           // 0-20 s across 1,200 px: 41.8 ms is 2.5 px
  const T_HBM = 140 / 3350;                         // 140 GB / 3.35 TB/s = 0.0418 s

  // b3 opens: the tags and band leave; equation + worked line + note collapse into the strip
  S.add(fx.out([...tags, take], { d: 0.35, stagger: 0.03 }), 'b2>+0.1');
  S.add(fx.out([...P, note, bit, memLbl, chipLbl], { d: 0.4, stagger: 0.02 }), 'b2>+0.25');
  const SK = 30 / WL, SY = 150;
  // the strip, centred over the header
  let sx = 960 - (SK * (mono('70 B') + xW + w2 + eqW + mono('140 GB')) + 4 * 11) / 2;
  const stripAt = [];
  stripAt.push(sx); sx += SK * mono('70 B') + 11;
  stripAt.push(sx); sx += SK * xW + 11;
  stripAt.push(sx - SK * slotPad); sx += SK * w2 + 11;
  stripAt.push(sx); sx += SK * eqW + 11;
  stripAt.push(sx);
  [hA, hX, hSlot, hEq, hGB].forEach((h, i) => S.add(fx.xform(h, { x: stripAt[i], y: SY, s: SK }, { d: 1.0, ease: 'power3.inOut' }), `b2>+${(0.3 + i * 0.04).toFixed(2)}`));
  // the container and the chip slide left and become the row-2 and row-3 icons
  const MEM_S = 0.32, CHIP_S = 0.58;
  S.add(mem.label(false, { d: 0.3 }), 'b2>+0.15');
  S.add(mem.place({ x: ICX, y: R[1], s: MEM_S }, { d: 1.1 }), 'b2>+0.2');
  S.add(chip.place({ x: ICX, y: R[2], s: CHIP_S }, { d: 1.1 }), 'b2>+0.3');
  S.add(gsap.to(chip, { opacity: 0.4, duration: 0.6 }), 'b2>+1.1');

  const header = S.text('Fetching 140 GB from each place', { x: 960, y: 226, size: 46, weight: 700, family: 'display', anchor: 'middle' });
  S.add(fx.in(header, { from: 'left', d: 0.7 }), 'b3+0.75');

  // the row labels
  const row1 = S.g(), row2 = S.g(), row3 = S.g();
  const disk = S.icon('ph:hard-drive-duotone', { x: ICX, y: R[0], size: 84, color: 'ink' }, row1);
  const diskLbl = S.text('disk', { x: LX, y: R[0], size: 28, weight: 600 }, row1);
  const memL1 = S.text('memory beside the chip', { x: LX, y: R[1] - 16, size: 28, weight: 600 }, row2);
  const memL2 = S.text('H100', { x: LX, y: R[1] + 19, size: 26, weight: 550, color: 'muted' }, row2);
  const chipL = S.text('the chip itself', { x: LX, y: R[2], size: 28, weight: 600 }, row3);
  S.add(fx.in([memL1, memL2], { from: 'left', d: 0.6, stagger: 0.08 }), 'b3+0.6');
  S.add(fx.in(chipL, { from: 'left', d: 0.6 }), 'b3+0.7');
  S.set(row3, { opacity: 0.4 }, 0);

  // 'disk': the disk row and the shared axis
  S.add(fx.in(disk, { from: 'fade', d: 0.6 }), 'b3~disk-0.25');
  S.add(fx.in(diskLbl, { from: 'left', d: 0.55 }), 'b3~disk-0.15');
  const axis = libTimeAxis(S, { x: AX.x, y: AX.y, w: AX.w, t0: 0, t1: 20, unit: 's', ticks: 5, minor: 0, size: 24, tone: 'faint' });
  S.add(axis.draw({ d: 1.0 }), 'b3~disk');
  // three faint lanes, the full 20 s of each row: what the bars are measured against
  const lanes = R.map(y => S.rect({ x: AX.x, y: y - 28, w: AX.w, h: 56, r: 8, fill: '#ffffff', fillOpacity: 0.03, stroke: '#ffffff', strokeOpacity: 0.1, sw: 1.5 }, S.layers.back));
  S.add(gsap.fromTo(lanes, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, stagger: 0.12 }), 'b3~disk+0.3');
  const same = S.text('same scale', { x: AX.x - 30, y: AX.y, size: 24, anchor: 'end', weight: 550, color: 'muted' });
  S.add(fx.in(same, { from: 'right', d: 0.5, dist: 20 }), 'b3~disk+0.6');

  // the bars, to one scale: the disk's 20 s fills the width; the memory's 41.8 ms is a 2.5 px sliver
  const sc = libScaleCompare(S, {
    x: AX.x, y: R[0] - 28, w: AX.w, max: 20, h: 56, gap: R[1] - R[0] - 56,
    items: [{ value: 20, tone: 'bytes' }, { value: T_HBM, tone: 'bytes' }],
  });
  // 'fast drive': the bar grows at a constant rate (a time-lapse) and lands on 'twenty seconds';
  // the sliver's entrance is the same call, staggered to 'forty-two'
  const tGrow = S.t('b3~fast'), tSliver = S.t('b3~forty') - 0.1;
  S.add(sc.in({ d: S.t('b3~seconds') - 0.05 - tGrow, ease: 'none', stagger: tSliver - tGrow }), tGrow);
  const lapse = S.g();
  S.icon('ph:fast-forward-duotone', { x: AX.x + 14, y: R[0] - 56, size: 28, color: 'muted' }, lapse);
  S.text('time-lapse', { x: AX.x + 38, y: R[0] - 56, size: 24, weight: 550, color: 'muted' }, lapse);
  S.add(fx.in(lapse, { from: 'left', d: 0.45, dist: 20 }), 'b3~fast');
  S.add(fx.dim([hA, hX, hSlot, hEq, hGB, same], { to: 0.3 }), 'b3~fast+0.2');
  const rate1 = S.text('≈ 7 GB/s', { x: AX.x + AX.w, y: R[0] + 52, size: 26, anchor: 'end', family: 'mono', weight: 600, color: 'muted' });
  S.add(fx.in(rate1, { from: 'up', d: 0.45, dist: 16 }), 'b3~seconds');
  const time1 = S.text('about 20,000 ms', { x: AX.x + AX.w, y: R[0] - 56, size: 32, anchor: 'end', family: 'mono', weight: 600 });
  S.add(fx.in(time1, { from: 'down', d: 0.5, dist: 18 }), 'b3~twenty thousand-0.1');
  S.add(fx.dim(lapse, { to: 0.3 }), 'b3~thousand');

  // 'the memory beside an H100, if it fitted': the row lights; the what-if tag
  S.add(mem.glow({ d: 0.9 }), 'b3~memory-0.1');
  const whatIf = S.text('what-if: pretend it fits on one H100', { x: LX, y: R[1] + 56, size: 24, weight: 550, color: 'muted' });
  S.add(fx.in(whatIf, { from: 'up', d: 0.5, dist: 14 }), 'b3~if it-0.1');
  // 'forty-two milliseconds': the sliver blinks in; its time and rate; the magnifier opens on it
  const time2 = S.text('about 42 ms', { x: AX.x, y: R[1] - 56, size: 32, family: 'mono', weight: 600 });
  const rate2 = S.text('3.35 TB/s', { x: AX.x + S.measure('about 42 ms', { size: 32, weight: 600, family: 'mono' }) + 28, y: R[1] - 56, size: 26, family: 'mono', weight: 600, color: 'muted' });
  S.add(fx.in(time2, { from: 'down', d: 0.45, dist: 16 }), 'b3~forty+0.05');
  S.add(fx.in(rate2, { from: 'down', d: 0.45, dist: 16 }), 'b3~forty+0.2');
  const lens = sc.magnify({ i: 1, x: 812, y: R[1] + 52, r: 70, ring: 31, tag: false });
  const zoomTag = S.text(`× ${Math.round(lens.M.zoom)}`, { x: 812 + 70 + 18, y: R[1] + 52, size: 26, family: 'mono', weight: 600, color: 'muted' });
  S.add(lens.open({ d: 0.9 }), 'b3~milliseconds#2-0.3');
  S.add(fx.in(zoomTag, { from: 'fade', d: 0.3 }), 'b3~milliseconds#2+0.45');

  // 'five hundred times': rates step back, the lens closes, an amber bracket joins the two rows
  S.add(fx.dim([rate1, rate2], { to: 0.3 }), 'b3~five-0.25');
  S.add(lens.close({ d: 0.7 }), 'b3~roughly');
  S.add(gsap.to(lens, { autoAlpha: 0, duration: 0.15 }), 'b3~roughly+0.6');   // the closed leader leaves a dot
  S.add(fx.out(zoomTag, { d: 0.2 }), 'b3~roughly');
  const BX = AX.x + AX.w + 14, BY1 = R[0] + 6, BY2 = R[1];
  const brk = S.path({ d: `M${BX - 10},${BY1} H${BX} V${BY2} H${BX - 10}`, stroke: 'compute', sw: 3 });
  const brkTick = S.line({ x1: BX, y1: (BY1 + BY2) / 2 + 6, x2: BX - 12, y2: (BY1 + BY2) / 2 + 6, stroke: 'compute', sw: 3 });
  const ratio = S.text('20 s ÷ 41.8 ms ≈ 478×', { x: BX - 26, y: (BY1 + BY2) / 2 + 6, size: 32, anchor: 'end', family: 'mono', weight: 600, color: 'compute' });
  S.add(fx.draw(brk, { d: 0.55 }), 'b3~five-0.1');
  S.add(fx.in(brkTick, { from: 'fade', d: 0.2 }), 'b3~five+0.3');
  S.add(fx.in(ratio, { from: 'right', d: 0.5, dist: 20 }), 'b3~five+0.2');
  S.add(fx.swap(ratio, 'roughly 500×', { d: 0.45 }), 'b3~faster-0.1');

  // ================================================================ b4 · the chip itself: it does not fit
  S.add(fx.out([brk, brkTick, ratio], { d: 0.35 }), 'b4-0.15');
  S.add(fx.out([time1, rate1, lapse, time2, rate2, whatIf], { d: 0.35, stagger: 0.02 }), 'b4');
  const rowsDim = [row1, row2, mem, sc.rows[0].g, sc.rows[1].g, lanes[0], lanes[1]];
  S.add(fx.dim(rowsDim, { to: 0.25 }), 'b4+0.05');
  S.add(gsap.to([row3, chip], { opacity: 1, duration: 0.5, ease: 'power2.out' }), 'b4~chip-0.15');
  S.add(chip.chip.pulse({ d: 0.6 }), 'b4~chip');
  const noBar = S.text('no bar', { x: AX.x, y: R[2] - 56, size: 28, weight: 600, color: 'muted' });
  S.add(fx.in(noBar, { from: 'down', d: 0.45, dist: 14 }), 'b4~Not-0.1');
  // the 140 GB slides along the row and stops dead against the chip's own tiny store
  const store = ch09ChipStore(S, { x: AX.x + 12, y: R[2], size: 24 });
  S.add(fx.pop(store, { d: 0.45 }), 'b4~impossible-0.5');
  const blkG = S.g();
  const blk = libMemBlock(S, { x: AX.x + 28, y: R[2] - 28, w: 200, h: 56, gb: 140, size: 28, tone: 'bytes', style: 'solid', shadow: false }, blkG);
  const slide = gsap.timeline();
  slide.fromTo(blkG, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: 'power1.out' }, 0);
  slide.fromTo(blkG, { x: 900 }, { x: 0, duration: 0.62, ease: 'power2.in' }, 0);
  slide.to(blkG, { x: 9, duration: 0.07, ease: 'power1.out' }, 0.62);
  slide.to(blkG, { x: 0, duration: 0.3, ease: 'bounce.out' }, 0.69);
  slide.add(fx.pulse(store, { scale: 1.25, d: 0.35 }), 0.6);
  slide.add(blk.flash({ tone: 'ink', d: 0.4, to: 0.35 }), 0.6);
  S.add(slide, 'b4~impossible-0.35');
  S.add(fx.swap(noBar, 'it does not fit', { d: 0.4 }), 'b4~impossible+0.3');
  S.add(fx.recolor(noBar, { fill: 'ink', d: 0.3 }), 'b4~impossible+0.5');
  // 'a tenth of a gigabyte': what the whole chip holds, and what the block overshoots by
  const storeL = S.text('≈ 0.1 GB, whole chip', { x: AX.x, y: R[2] + 54, size: 28, weight: 600, color: 'struct' });
  const storeSub = S.text('a few hundred KB per working area', { x: AX.x, y: R[2] + 88, size: 24, weight: 500, color: 'muted' });
  const tooBig = S.text('> 1,000× too big', { x: AX.x + 28 + 200 + 26, y: R[2], size: 30, family: 'mono', weight: 600, color: 'bytes' });
  S.add(fx.in(storeL, { from: 'up', d: 0.5, dist: 14 }), 'b4~tenth-0.2');
  S.add(fx.in(storeSub, { from: 'up', d: 0.5, dist: 14 }), 'b4~tenth+0.25');
  S.add(fx.in(tooBig, { from: 'left', d: 0.5, dist: 20 }), 'b4~gigabyte');

  // ================================================================ b5 · loaded once; the disk only at start-up
  S.add(fx.out([blkG, store, noBar, storeL, storeSub, tooBig], { d: 0.4, stagger: 0.02 }), 'b5-0.2');
  S.add(gsap.to([row3, chip], { opacity: 0.4, duration: 0.5 }), 'b5-0.1');
  S.add(fx.undim(rowsDim, { d: 0.6 }), 'b5');
  S.add(fx.in([time1, time2], { from: 'fade', d: 0.5, stagger: 0.1 }), 'b5+0.1');
  // 'loaded once': a teal arrow from the disk into the memory
  const load = S.arrow({ x1: ICX, y1: R[0] + 46, x2: ICX, y2: R[1] - 36, color: 'helps', sw: 3.5, head: 13 });
  const loadL = S.text('load once', { x: ICX + 24, y: (R[0] + R[1]) / 2 + 4, size: 26, weight: 600, color: 'helps' });
  S.add(fx.drawArrow(load, { d: 0.55 }), 'b5~loaded-0.2');
  S.add(fx.in(loadL, { from: 'left', d: 0.45, dist: 16 }), 'b5~loaded+0.1');
  S.add(mem.glow({ tone: 'helps', d: 1.0 }), 'b5~loaded+0.3');
  // 'vary widely': the caveat; 'stays enormous': the ratio glows once
  const caveat = S.text('disk figures approximate, vary by hardware', { x: AX.x, y: R[0] + 52, size: 24, weight: 500, color: 'muted' });
  S.add(fx.in(caveat, { from: 'up', d: 0.5, dist: 14 }), 'b5~vary-0.1');
  const glowTxt = S.text('roughly 500×', { x: BX - 26, y: (BY1 + BY2) / 2 + 6, size: 32, anchor: 'end', family: 'mono', weight: 600, color: 'compute' });
  glowTxt.setAttribute('filter', 'url(#glow-compute)');
  glowTxt.setAttribute('data-audit', 'ignore');
  glowTxt.style.opacity = 0;
  S.add(gsap.fromTo([brk, brkTick], { autoAlpha: 0 }, { autoAlpha: 0.6, duration: 0.4 }), 'b5~stays enormous-0.3');
  S.add(fx.in(ratio, { from: 'fade', d: 0.4 }), 'b5~stays enormous-0.3');
  const glowOnce = gsap.timeline();
  glowOnce.fromTo(glowTxt, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out', immediateRender: false }, 0);
  glowOnce.to(glowTxt, { opacity: 0, duration: 0.7, ease: 'power2.in' }, 0.5);
  S.add(glowOnce, 'b5~enormous-0.1');
  S.add(fx.pulse(ratio, { scale: 1.08, d: 0.6 }), 'b5~enormous-0.05');
  // 'slow start-ups': the disk row goes grey and leaves for good
  S.add(fx.out([brk, brkTick, ratio], { d: 0.35 }), 'b5~slow-0.3');
  S.add(sc.restyle(0, 'grey', { d: 0.5 }), 'b5~slow-0.1');
  S.add(gsap.to(disk.firstChild, { color: S.tone('faint'), duration: 0.5 }), 'b5~slow-0.1');
  S.add(fx.recolor([diskLbl, time1], { fill: 'muted', d: 0.5 }), 'b5~slow-0.1');
  const startup = S.text('start-up only', { x: LX, y: R[0] + 36, size: 24, weight: 550, color: 'muted' }, row1);
  S.add(fx.in(startup, { from: 'up', d: 0.45, dist: 12 }), 'b5~slow+0.1');
  const leaving = [row1, sc.rows[0].g, lanes[0], time1, caveat, rate1, lapse, load, loadL];
  // the row slides off the left edge; its words fade as it starts to move, so nothing is read off-frame
  S.add(gsap.to(leaving, { x: -1960, duration: 0.85, ease: 'power2.in' }), 'b5~and why-0.1');
  S.add(gsap.to([diskLbl, startup, time1, caveat, loadL], { autoAlpha: 0, duration: 0.25, ease: 'power1.in' }), 'b5~and why-0.1');
  S.add(gsap.to(leaving, { autoAlpha: 0, duration: 0.05 }), 'b5~and why+0.8');
  const trail = S.text('after the load: never again', { x: 960, y: R[0], size: 32, anchor: 'middle', weight: 550, color: 'muted' });
  S.add(fx.in(trail, { from: 'right', d: 0.7, dist: 140 }), 'b5~and why+0.75');
  // the rest steps away; the memory beside the chip brightens and glides to the centre for s02
  const rest = [header, hA, hX, hSlot, hEq, hGB, same, axis, row2, row3, chip, sc.rows[1].g, lanes[1], lanes[2], time2];
  S.add(mem.brighten({ d: 0.5 }), 'b5~weights-0.3');
  S.add(fx.out(rest, { d: 0.5, stagger: 0.02 }), 'b5~weights-0.2');
  S.add(fx.out(trail, { d: 0.5 }), 'b5~weights+0.65');
  S.add(mem.place(CH09.memEnd, { d: 1.3, ease: 'power3.inOut' }), 'b5~weights');
  S.add(mem.label(true, { d: 0.5 }), 'b5~weights+0.85');
});
