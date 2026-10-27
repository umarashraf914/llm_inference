/* ch05_s06 · the gap, as a ratio and as a percentage (fig 38)
   One scale for both bars: 50 px per ms, so the budget (30 ms) is 1,500 px and the arithmetic (0.1 ms)
   is 5 px. Ratio: 30 ÷ 0.1 = 300. Percentage: 0.1 ÷ 30 = 0.0033 × 100 = 0.33%, a third of one percent
   (the first 1% of the ruler is 15 px; the sliver fills one third of it); 99.67% is everything else.
   Unrounded: 1.4 × 10¹¹ ÷ 10¹⁵ = 0.14 ms ≈ 1/7 ms (7 px), ≈ 0.47%, ≈ 200 ×. Under 1% either way. */
V.scene('ch05_s06', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const X0 = 300, PXMS = CH05.PX_PER_MS, BW = 30 * PXMS, YA = 480, YB = 620, H = 48, RY = 760, PCT = BW / 100;
  // the top row holds the results, centred: 'ratio: 300 ×' alone, then beside the '≈ 200 ×' ghost (b5), then
  // '= percentage: 0.33%' (b6); RC is the ratio card's centre while it is alone, and it moves to make room
  const RC = 960, RW = 290, GW = 190, PWD = 370;
  const RX5 = 960 - (RW + 30 + GW) / 2 + RW / 2 - RC, RX6 = 960 - (RW + 70 + PWD) / 2 + RW / 2 - RC;
  const PCX = RC + RX6 + RW / 2 + 70 + PWD / 2, EQX = X0 + BW / 2, EQY = YB - 90;
  // the lanes, with their labels on the left, are centred; when the labels go (end of b4) the bar alone moves
  // left by LS to be centred, where the next scene's bar is
  const lanes = S.g(), LS = -90;

  // ---------------------------------------------------------------- b1: the two rows; 30 ÷ 0.1 = 300
  const lA = S.text('arithmetic', { x: X0 - 24, y: YA + 1, size: 30, anchor: 'end', weight: 650, color: 'ink' }, lanes);
  const lB = S.text('the budget', { x: X0 - 24, y: YB + 1, size: 30, anchor: 'end', weight: 650, color: 'ink' }, lanes);
  S.set([lA, lB], { autoAlpha: 0 }, 0);
  S.add(gsap.set(lA, { autoAlpha: 1 }), 0.3);
  S.add(ch05Wipe(S, lA, { d: 0.5 }), 0.3);
  S.add(gsap.set(lB, { autoAlpha: 1 }), 0.6);
  S.add(ch05Wipe(S, lB, { d: 0.5 }), 0.6);
  const tA = S.text('0.1 ms', { x: X0 + 22, y: YA + 1, size: 30, weight: 700, family: 'mono', color: 'compute' }, lanes);
  const tB = S.text('30 ms', { x: X0 + BW, y: YB - H / 2 - 18, size: 30, anchor: 'end', weight: 700, family: 'mono', color: 'ink' }, lanes);
  S.set([tA, tB], { autoAlpha: 0 }, 0);
  S.add(fx.in([tA, tB], { from: 'fade', d: 0.4, stagger: 0.2 }), 1.0);
  const eqCard = S.g();
  S.rect({ x: 960 - 220, y: RY - 40, w: 440, h: 80, r: 18, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.25, sw: 2 }, eqCard);
  S.text('30 ÷ 0.1 = 300', { x: 960, y: RY + 2, size: 40, anchor: 'middle', weight: 700, family: 'mono', color: 'ink' }, eqCard);
  S.set(eqCard, { autoAlpha: 0 }, 0);
  S.add(gsap.set(eqCard, { autoAlpha: 1 }), 'b1~zero');
  S.add(ch05Wipe(S, eqCard, { d: 0.7 }), 'b1~zero');
  const ratio = S.g();
  S.rect({ x: RC - RW / 2, y: 136, w: RW, h: 68, r: 18, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.6, sw: 2 }, ratio);
  S.text('ratio: 300 ×', { x: RC, y: 171, size: 34, anchor: 'middle', weight: 700, color: 'ink' }, ratio);
  S.set(ratio, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(ratio, { autoAlpha: 0, y: -30 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'back.out(1.8)' }), 'b1~times');

  // ---------------------------------------------------------------- b2: on one scale: the sliver from the very start; 300 tokens' worth
  const budget = S.rect({ x: X0, y: YB - H / 2, w: 0, h: H, r: 6, fill: 'faint', fillOpacity: 0.1, stroke: 'ink', strokeOpacity: 0.8, sw: 2 }, lanes);
  const sliver = ch05Sliver(S, { x: X0, y: YA, h: H, tagSide: 'below', tagGap: 26, tagSize: 24 }, lanes);
  S.set([budget, sliver], { autoAlpha: 0 }, 0);
  const ONE = T('b2~one') - 0.1;
  S.add(gsap.set([budget, sliver], { autoAlpha: 1 }), ONE);
  S.add(gsap.to(budget, { attr: { width: BW }, duration: 0.9, ease: 'power2.inOut' }), ONE);
  S.add(gsap.to(tA, { x: 8, duration: 0.3 }), ONE);
  const ptr = S.g(null, lanes);
  S.line({ x1: X0 + 2.5, y1: YA - H / 2 - 64, x2: X0 + 2.5, y2: YA - H / 2 - 8, stroke: 'ink', sw: 2 }, ptr);
  S.path({ d: `M${X0 - 4},${YA - H / 2 - 18} L${X0 + 2.5},${YA - H / 2 - 6} L${X0 + 9},${YA - H / 2 - 18}`, stroke: 'ink', sw: 2 }, ptr);
  S.text('drawn to scale', { x: X0 + 14, y: YA - H / 2 - 66, size: 26, weight: 650, color: 'ink' }, ptr);
  ignore(ptr.firstChild);
  S.set(ptr, { autoAlpha: 0 }, 0);
  S.add(fx.in(ptr, { from: 'down', d: 0.4, dist: 14 }), 'b2~sliver-0.1');
  // 300 copies of the sliver, end to end, fill the budget exactly
  let cd = '';
  for (let k = 0; k < 300; k++) cd += `M${(X0 + k * 5 + 0.5).toFixed(1)},${YB - H / 2 + 3}h4v${H - 6}h-4Z`;
  const copies = S.g(null, lanes);
  const cpId = 's06-copies';
  const clip = S.el('clipPath', { id: cpId }, copies);
  const clipR = S.rect({ x: X0, y: YB - H / 2, w: 0, h: H }, clip);
  const cpath = S.path({ d: cd, fill: 'compute', fillOpacity: 0.85 }, copies);
  cpath.setAttribute('clip-path', `url(#${cpId})`);
  ignore(copies);
  const cnt = S.text('', { x: X0 + BW / 2, y: YB - H / 2 - 22, size: 30, anchor: 'middle', weight: 700, family: 'mono', color: 'compute' }, lanes);
  const FILL = T('b2~three') - 0.1, FD = 2.0;
  S.add(gsap.fromTo(clipR, { attr: { width: 0 } }, { attr: { width: BW }, duration: FD, ease: 'power1.in', immediateRender: false }), FILL);
  const cc = { v: 0 };
  S.add(gsap.fromTo(cc, { v: 0 }, { v: 300, duration: FD, ease: 'power1.in', immediateRender: false, onUpdate: () => { cnt.textContent = `${Math.max(1, Math.round(cc.v))} token${Math.round(cc.v) > 1 ? 's' : ''}`; } }), FILL);
  S.set(cnt, { autoAlpha: 0 }, 0);
  S.add(gsap.to(cnt, { autoAlpha: 1, duration: 0.2 }), FILL);
  S.add(gsap.to([copies, cnt], { autoAlpha: 0, duration: 0.5 }), T('b2~one#2') + 0.4);

  // ---------------------------------------------------------------- b3: drawn to scale, hard to shrug off
  S.add(fx.out(eqCard, { d: 0.4 }), 'b3');
  S.add(gsap.to(budget, { attr: { 'fill-opacity': 0.2 }, duration: 0.8 }), 'b3~Drawn');

  // ---------------------------------------------------------------- b4: upside down: 0.1 ÷ 30 = 0.0033 × 100 = 0.33%
  const B4 = T('b4') - 0.1;
  S.add(fx.out(ptr, { d: 0.3 }), B4);
  S.add(gsap.to(sliver, { y: YB - YA, duration: 0.6, ease: 'power2.inOut' }), B4 + 0.3);
  S.add(fx.out([tA, lA], { d: 0.3, stagger: 0 }), B4 + 0.2);
  const lA2 = S.g(null, lanes);
  S.text('arithmetic', { x: X0 - 6, y: YB - H / 2 - 22, size: 28, weight: 650, color: 'compute' }, lA2);
  S.set(lA2, { autoAlpha: 0 }, 0);
  S.add(fx.in(lA2, { from: 'down', d: 0.35, dist: 10 }), B4 + 0.8);
  S.add(gsap.to(tB, { x: 0, duration: 0.01 }), 0.02);
  const eq = S.text('', { x: EQX, y: EQY, size: 40, anchor: 'middle', weight: 700, family: 'mono', color: 'ink' }, lanes);
  const eqA = '0.1 ÷ 30 = 0.0033', eqB = '0.1 ÷ 30 = 0.0033 × 100 = 0.33%';
  eq.textContent = eqA;
  S.set(eq, { autoAlpha: 0 }, 0);
  S.add(gsap.set(eq, { autoAlpha: 1 }), 'b4~Zero-0.1');
  S.add(ch05Wipe(S, eq, { d: 0.8 }), 'b4~Zero-0.1');
  // the percent ruler under the budget bar: 15 px per percent, ticks every 10%
  const ruler = S.g(null, lanes);
  S.line({ x1: X0, y1: RY, x2: X0 + BW, y2: RY, stroke: 'muted', sw: 2 }, ruler);
  for (let p = 0; p <= 100; p += 10) S.line({ x1: X0 + p * PCT, y1: RY - 8, x2: X0 + p * PCT, y2: RY + 8, stroke: 'muted', sw: 2 }, ruler);
  S.text('0%', { x: X0, y: RY + 34, size: 24, anchor: 'middle', weight: 600, color: 'muted' }, ruler);
  S.text('100%', { x: X0 + BW, y: RY + 34, size: 24, anchor: 'middle', weight: 600, color: 'muted' }, ruler);
  S.set(ruler, { autoAlpha: 0 }, 0);
  const FR = T('b4~fraction') - 0.1;
  S.add(gsap.set(ruler, { autoAlpha: 1 }), FR);
  S.add(ch05Wipe(S, ruler, { d: 0.8 }), FR);
  S.add(fx.swap(eq, eqB), FR + 0.3);
  // the first 1% of the ruler, magnified 40×: it splits in three and the sliver fills one
  const MAG = { x: 660, y: 280, w: 600, h: 120 };
  const mag = S.g();
  S.rect({ x: MAG.x - 44, y: MAG.y - 40, w: MAG.w + 88, h: MAG.h + 80, r: 18, fill: '#0c1326', stroke: 'ink', strokeOpacity: 0.5, sw: 2 }, mag);
  S.rect({ x: MAG.x, y: MAG.y + 10, w: MAG.w, h: 60, r: 4, fill: 'faint', fillOpacity: 0.15, stroke: 'ink', strokeOpacity: 0.6, sw: 1.5 }, mag);
  const third = S.rect({ x: MAG.x, y: MAG.y + 10, w: MAG.w / 3, h: 60, r: 4, fill: 'compute' }, mag);
  [1, 2].forEach(k => S.line({ x1: MAG.x + k * MAG.w / 3, y1: MAG.y + 4, x2: MAG.x + k * MAG.w / 3, y2: MAG.y + 76, stroke: 'ink', sw: 2, dash: '5 5' }, mag));
  S.text('0%', { x: MAG.x, y: MAG.y + 104, size: 24, anchor: 'middle', weight: 600, color: 'muted' }, mag);
  S.text('1%', { x: MAG.x + MAG.w, y: MAG.y + 104, size: 24, anchor: 'middle', weight: 700, color: 'ink' }, mag);
  S.text('a third of one percent', { x: MAG.x + MAG.w / 2, y: MAG.y - 14, size: 26, anchor: 'middle', weight: 650, color: 'compute' }, mag);
  const lens = ignore(S.path({ d: `M${X0},${RY - 10} L${MAG.x - 44},${MAG.y + MAG.h + 40} M${X0 + PCT},${RY - 10} L${MAG.x + MAG.w + 44},${MAG.y + MAG.h + 40}`, stroke: 'ink', sw: 1.5, strokeOpacity: 0.4, dash: '4 6' }));
  const ring = ignore(S.rect({ x: X0 - 3, y: RY - 12, w: PCT + 6, h: 24, r: 4, stroke: 'ink', sw: 2 }));
  S.set([mag, lens, ring, third], { autoAlpha: 0 }, 0);
  const ZM = T('b4~third') - 0.3;
  S.add(fx.in([ring, lens], { from: 'fade', d: 0.3, stagger: 0.1 }), ZM);
  S.add(fx.in(mag, { from: 'scale', scale: 0.4, d: 0.5, origin: `${X0}px ${RY}px` }), ZM + 0.2);
  S.add(gsap.fromTo(third, { autoAlpha: 0, attr: { width: 0 } }, { autoAlpha: 1, attr: { width: MAG.w / 3 }, duration: 0.5, ease: 'power2.out', immediateRender: false }), ZM + 0.7);
  S.call(() => mag.setAttribute('data-audit', 'ignore'), ZM);
  S.call(() => mag.removeAttribute('data-audit'), ZM + 0.75);
  const OUT = Math.min(T('b4>') - 0.2, ZM + 2.0);
  S.add(fx.out([mag, lens, ring], { d: 0.4, stagger: 0 }), OUT);
  const rest = S.text('everything that is not arithmetic, 99.67%', { x: X0 + 5 + (BW - 5) / 2, y: YB + 1, size: 28, anchor: 'middle', weight: 650, color: 'ink' }, lanes);   // centred in the grey part
  S.set(rest, { autoAlpha: 0 }, 0);
  S.add(fx.in(rest, { from: 'fade', d: 0.4 }), OUT + 0.2);
  S.add(fx.out([sliver.tagG, lB], { d: 0.35, stagger: 0 }), T('b4>') + 0.1);
  S.add(gsap.fromTo(lanes, { x: 0 }, { x: LS, duration: 0.7, ease: 'power2.inOut', immediateRender: false }), T('b4>') + 0.3);

  // ---------------------------------------------------------------- b5: unrounded: 0.14 ms, ≈ 0.47%, ≈ 200 ×; under 1% either way
  const UN = T('b5~Unrounded') - 0.1;
  S.add(gsap.to([eq, rest], { opacity: 0.3, duration: 0.4 }), UN);
  const work = S.g();
  // the working, centred under the top row (where the magnifier was), flanked by the chip and the model
  const WK = { x: 680, y: 240, w: 560, h: 130 };
  S.rect({ x: WK.x, y: WK.y, w: WK.w, h: WK.h, r: 18, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.2, sw: 2 }, work);
  S.text('1.4 × 10¹¹ ÷ 10¹⁵ = 0.14 ms', { x: 960, y: WK.y + 52, size: 30, anchor: 'middle', weight: 650, family: 'mono', color: 'muted' }, work);
  const sev = S.text('≈ 1/7 ms', { x: 960, y: WK.y + 100, size: 30, anchor: 'middle', weight: 650, family: 'mono', color: 'muted' }, work);
  S.set([work, sev], { autoAlpha: 0 }, 0);
  S.add(gsap.set(work, { autoAlpha: 1 }), UN + 0.1);
  S.add(ch05Wipe(S, work, { d: 0.7 }), UN + 0.1);
  S.add(fx.in(sev, { from: 'up', d: 0.35, dist: 10 }), 'b5~seventh');
  const ghost = ignore(S.rect({ x: X0 + 5, y: YB - H / 2, w: 2, h: H, fill: 'compute', fillOpacity: 0.35, stroke: 'compute', sw: 1, dash: '3 2' }, lanes));
  const gTag = S.text('≈ 0.47% unrounded', { x: X0 + 18, y: YB + H / 2 + 34, size: 24, weight: 650, color: 'compute' }, lanes);
  S.set([ghost, gTag], { autoAlpha: 0 }, 0);
  S.add(fx.in(ghost, { from: 'fade', d: 0.3 }), 'b5~Nearer');
  S.add(fx.in(gTag, { from: 'up', d: 0.3, dist: 8 }), T('b5~Nearer') + 0.2);
  const g200 = S.g();
  const GX = RC + RX5 + RW / 2 + 30;
  S.rect({ x: GX, y: 136, w: GW, h: 68, r: 18, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.5, sw: 2, dash: '7 6' }, g200);
  S.text('≈ 200 ×', { x: GX + GW / 2, y: 171, size: 32, anchor: 'middle', weight: 700, color: 'muted' }, g200);
  S.set(g200, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(ratio, { x: 0 }, { x: RX5, duration: 0.6, ease: 'power2.inOut', immediateRender: false }), T('b5~two') - 0.4);
  S.add(fx.in(g200, { from: 'left', d: 0.4, dist: 14 }), 'b5~two');
  const icons = S.g();
  S.icon('ph:cpu-duotone', { x: WK.x - 50, y: WK.y + WK.h / 2, size: 52, color: 'compute' }, icons);
  S.icon('ph:file-duotone', { x: WK.x + WK.w + 50, y: WK.y + WK.h / 2, size: 48, color: 'muted' }, icons);
  S.set(icons, { autoAlpha: 0 }, 0);
  S.add(fx.in(icons, { from: 'fade', d: 0.35 }), 'b5~model');
  const PW = T('b5~power') - 0.1;
  S.add(fx.out([gTag, g200, icons, work], { d: 0.35, stagger: 0 }), PW);
  const brk = S.g(null, lanes);
  S.path({ d: `M${X0},${RY + 14} l0,12 L${X0 + PCT},${RY + 26} l0,-12`, stroke: 'ink', sw: 2.5 }, brk);
  S.path({ d: `M${X0 + PCT / 2},${YB - H / 2 - 6} L${X0 + PCT / 2 + 40},${YB - H / 2 - 60}`, stroke: 'ink', sw: 2 }, brk);
  S.text('under 1% either way', { x: X0 + PCT / 2 + 48, y: YB - H / 2 - 66, size: 28, weight: 700, color: 'ink' }, brk);
  ignore(brk.firstChild);
  S.set(brk, { autoAlpha: 0 }, 0);
  S.add(fx.in(brk, { from: 'fade', d: 0.4 }), PW + 0.3);
  S.add(gsap.to(lA2, { autoAlpha: 0, duration: 0.25 }), PW + 0.1);
  const BACK = T('b5>') + 0.1;
  S.add(fx.out([brk, ghost], { d: 0.35, stagger: 0 }), BACK);
  S.add(gsap.to([eq, rest], { opacity: 1, duration: 0.4 }), BACK);
  S.add(gsap.to(lA2, { autoAlpha: 1, duration: 0.3 }), BACK + 0.4);

  // ---------------------------------------------------------------- b6: two ways of saying one thing
  const B6 = T('b6') - 0.1;
  const eqSign = S.text('=', { x: PCX - PWD / 2 - 35, y: 172, size: 40, anchor: 'middle', weight: 700, color: 'muted' });
  const pctC = S.g();
  S.rect({ x: PCX - PWD / 2, y: 136, w: PWD, h: 68, r: 18, fill: '#0c1326', stroke: 'compute', strokeOpacity: 0.8, sw: 2 }, pctC);
  S.text('percentage: 0.33%', { x: PCX, y: 171, size: 34, anchor: 'middle', weight: 700, color: 'compute' }, pctC);
  S.set([eqSign, pctC], { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(ratio, { x: RX5 }, { x: RX6, duration: 0.7, ease: 'power2.inOut', immediateRender: false }), B6);
  S.add(gsap.to(eq, { x: PCX - (EQX + LS), y: 171 - EQY, scale: 0.5, autoAlpha: 0, transformOrigin: '50% 50%', duration: 0.7, ease: 'power3.inOut' }), B6);
  S.call(() => eq.setAttribute('data-audit', 'ignore'), B6);
  S.add(gsap.to(pctC, { autoAlpha: 1, duration: 0.35 }), B6 + 0.55);
  S.add(fx.in(eqSign, { from: 'fade', d: 0.3 }), B6 + 0.7);
});
