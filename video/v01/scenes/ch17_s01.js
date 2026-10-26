/* ch17_s01 · the van, the courier, and a server (fig 142)
   One stage, two questions. A road runs from a post office (left) to three houses (right); two neutral
   definition cards sit in the top band. b1 defines latency (one letter, timed) and throughput (a stream,
   counted); b2 runs the van (huge throughput, a week's wait) and the courier (the reverse); b3 weighs
   them, recalls ch06's ship and courier ('independent'), then ties the two cards together with a
   taut arrow; b4 re-dresses the same stage as a server (GPU, ten users, request pills, a tray) and adds
   the one dial, 'wait before sending'; b5 shows the price of waiting: the first request waits for the rest.

   Layout (fixed for the whole scene):
     cards     y 150-330: Latency x 420-900, Throughput x 1020-1500 (neutral)
     slots     y 468: left slot x 660 (courier ledger, then the 'answer at once' counter),
               right slot x 1260 (van ledger, then the 'gather' counter); the scale sits between them
     road      y 626-794, x 300-1610: upper lane y 668 (courier, single pills), lower lane y 752 (van, tray)
     ends      post office / GPU at (200, 705); houses / ten users at x 1700-1810
     slider    y 872, track x 700-1220; label below at y 922
     camera    opens at 1.75x on the waiting person, eases back to the full stage on 'Take the mail';
               the cards and their arrow live in S.hud, above the camera
     tags      bottom-right (ch17Tag) */
V.scene('ch17_s01', S => {
  const { fx } = S;
  const T = s => S.t(s);

  // ------------------------------------------------------------------ geometry
  const RX0 = 300, RX1 = 1610, RY0 = 626, RY1 = 794, UP = 668, LO = 752, MID = 710;
  const PO = { x: 200, y: 705 };
  const HX = 1768, HY = [590, 712, 834];               // the three houses
  const DOOR = { px: 1700, py: 730, mx: 1648, my: 752 }; // person and mailbox at the middle house's door
  const CARD = { y: 150, h: 180, lx: 420, rx: 1020, w: 480 };
  const SLOT = { y: 468, l: 660, r: 1260, il: 846, ir: 1074 };
  const SL = { x0: 700, x1: 1220, y: 872 };
  const TRAY_HOME = 448, PARK_R = 1530, COUR_HOME = 392, COUR_END = 1556;

  // ------------------------------------------------------------------ small helpers
  /** an envelope: a <g> centred on (0, 0), positioned by its transform; hidden (opacity attribute 0) */
  const envelope = (size = 38, parent, glow) => {
    const g = S.g({ opacity: 0 }, parent);
    g.setAttribute('data-audit', 'ignore');   // letters in flight pass over the labels
    S.rect({ x: -size * 0.42, y: -size * 0.3, w: size * 0.84, h: size * 0.6, r: 4, fill: '#0c1326' }, g);
    S.icon('ph:envelope-simple-duotone', { x: 0, y: 0, size, color: 'struct' }, g);
    if (glow) g.setAttribute('filter', 'url(#glow-struct)');
    return g;
  };
  /** move a positioned element along a path between two times (seek-safe: a proxy drives the transform).
   *  o: {ease, appear (fade in over the first 10%), vanish (fade and shrink over the last 18%), s0, s1} */
  const ride = (el, d, at, dur, o = {}) => {
    const pe = S.path({ d }, S.layers.back);
    pe.setAttribute('stroke', 'none'); pe.setAttribute('fill', 'none');
    const L = pe.getTotalLength(), ease = gsap.parseEase(o.ease || 'power1.inOut');
    const s0 = o.s0 ?? 1, s1 = o.s1 ?? 1;
    const apply = p => {
      const q = ease(p), pt = pe.getPointAtLength(L * q);
      let op = 1, sc = s0 + (s1 - s0) * q;
      if (o.appear) op = Math.min(op, p / 0.1);
      if (o.vanish && p > 0.82) { op = Math.min(op, (1 - p) / 0.18); sc *= 1 - 0.4 * (p - 0.82) / 0.18; }
      if (p <= 0 && o.appear) op = 0;
      if (p >= 1 && o.vanish) op = 0;
      el.setAttribute('transform', `translate(${pt.x.toFixed(2)},${pt.y.toFixed(2)}) scale(${sc.toFixed(3)})`);
      el.setAttribute('opacity', Math.max(0, Math.min(1, op)).toFixed(3));
    };
    const pr = { p: 0 };
    S.add(gsap.fromTo(pr, { p: 0 }, { p: 1, duration: dur, ease: 'none', immediateRender: false, onUpdate: () => apply(pr.p), onStart: () => apply(pr.p) }), at);
  };
  /** a tween over d seconds calling fn(eased progress); seek-safe */
  const drive = (fn, d, ease = 'none') => {
    const pr = { p: 0 };
    return gsap.fromTo(pr, { p: 0 }, { p: 1, duration: d, ease, immediateRender: false, onUpdate: () => fn(pr.p), onStart: () => fn(pr.p) });
  };
  const hide = e => { e.style.opacity = 0; e.style.visibility = 'hidden'; };
  /** a small request pill (an unlabelled libToken) */
  const pill = (x, y, parent, o = {}) => libToken(S, { text: '', x, y, w: o.w ?? 36, h: o.h ?? 21, r: 7, decorative: true, hidden: o.hidden ?? true, state: o.state || 'solid' }, parent);
  /** a small tray with a few pills, as an icon (slider end, counter) */
  const miniTray = (x, y, parent) => {
    const g = S.g(null, parent);
    S.rect({ x: x - 30, y: y - 15, w: 60, h: 30, r: 7, fill: '#0c1326', stroke: 'struct', strokeOpacity: 0.75, sw: 2 }, g);
    for (let k = 0; k < 3; k++) S.rect({ x: x - 22 + k * 15.5, y: y - 6, w: 12, h: 12, r: 3, fill: 'url(#solid-struct)' }, g);
    return g;
  };
  /** a mini pill icon */
  const miniPill = (x, y, parent) => {
    const g = S.g(null, parent);
    S.rect({ x: x - 16, y: y - 10, w: 32, h: 20, r: 6, fill: '#0c1326' }, g);
    S.rect({ x: x - 16, y: y - 10, w: 32, h: 20, r: 6, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.9, sw: 2 }, g);
    return g;
  };
  /** a mirrored icon (the fluent vehicles face left; we need them facing right) */
  const iconFacing = (id, size, right, parent) => {
    const g = S.g(null, parent);
    const inner = S.g(right ? { transform: 'scale(-1,1)' } : null, g);
    S.icon(id, { x: 0, y: 0, size }, inner);
    return g;
  };

  // ------------------------------------------------------------------ the road (draws on left to right)
  const clip = S.el('clipPath', { id: 'ch17s01-road' }, S.layers.back);
  const clipR = S.el('rect', { x: RX0 - 10, y: RY0 - 10, width: 0, height: RY1 - RY0 + 20 }, clip);
  const road = S.g({ 'clip-path': 'url(#ch17s01-road)' }, S.layers.back);
  S.rect({ x: RX0, y: RY0, w: RX1 - RX0, h: RY1 - RY0, r: 14, fill: '#121a2f' }, road);
  S.rect({ x: RX0, y: RY0, w: RX1 - RX0, h: (RY1 - RY0) / 2, r: 14, fill: '#ffffff', fillOpacity: 0.025 }, road);
  const edges = [RY0 + 10, RY1 - 10].map(y => S.line({ x1: RX0 + 14, y1: y, x2: RX1 - 14, y2: y, stroke: '#ffffff', strokeOpacity: 0.26, sw: 2.5 }, road));
  S.line({ x1: RX0 + 30, y1: MID, x2: RX1 - 30, y2: MID, stroke: 'muted', strokeOpacity: 0.55, sw: 3, dash: '28 22', cap: 'butt' }, road);
  S.add(gsap.fromTo(clipR, { attr: { width: 0 } }, { attr: { width: RX1 - RX0 + 20 }, duration: 0.95, ease: 'power2.inOut' }), 'b1~Take-0.1');

  // ------------------------------------------------------------------ the two ends: post office, houses, the person
  const postOffice = S.g();
  S.icon('fluent:post-office', { x: PO.x, y: PO.y - 8, size: 164 }, postOffice);
  S.add(fx.pop(postOffice, { from: 0.6, d: 0.6 }), 'b1~Take+0.15');

  const houses = HY.map(y => { const h = S.g(); S.icon('fluent:house', { x: HX, y, size: 100 }, h); return h; });
  S.add(fx.pop(houses, { from: 0.5, d: 0.55, stagger: 0.09 }), 'b1~mail-0.15');

  // the person waiting, with an empty mailbox and a tiny ticking clock; they start at (1500, 700) and
  // settle at the middle house's door
  const door = S.g();
  S.xset(door, { x: 1500 - DOOR.px, y: 700 - DOOR.py });
  const mailbox = S.g(null, door);
  const boxDown = S.icon('fluent:closed-mailbox-with-lowered-flag', { x: DOOR.mx, y: DOOR.my, size: 54 }, mailbox);
  const boxUp = S.icon('fluent:closed-mailbox-with-raised-flag', { x: DOOR.mx, y: DOOR.my, size: 54 }, mailbox);
  S.set(boxUp, { autoAlpha: 0 }, 0);
  const person = S.g(null, door);
  S.icon('fluent:man-standing', { x: DOOR.px, y: DOOR.py, size: 86 }, person);
  const clock = S.g(null, door);
  const CK = { x: DOOR.px, y: DOOR.py - 68 };
  S.circle({ x: CK.x, y: CK.y, r: 13, fill: '#0c1326', stroke: 'muted', sw: 2.5 }, clock);
  const hand = S.line({ x1: CK.x, y1: CK.y, x2: CK.x, y2: CK.y - 8.5, stroke: 'muted', sw: 2.5 }, clock);
  S.add(fx.in(person, { from: 'up', d: 0.6 }), 'b1~person-0.4');
  S.add(fx.pop(mailbox, { from: 0.5, d: 0.5 }), 'b1~person-0.15');
  S.add(fx.pop(clock, { from: 0.4, d: 0.45 }), 'b1~waiting-0.25');
  // ticking: the hand jumps 30 degrees every half second until the letter lands
  const tickFrom = T('b1~waiting'), tickTo = T('b1~takes');
  S.add(drive(p => {
    const k = Math.floor(p * (tickTo - tickFrom) / 0.5);
    hand.setAttribute('transform', `rotate(${(k * 30) % 360} ${CK.x} ${CK.y})`);
  }, tickTo - tickFrom), tickFrom);
  S.add(fx.xform(door, { x: 0, y: 0 }, { d: 0.8, ease: 'power3.inOut' }), 'b1~Take+0.25');
  // the scene opens close on the person waiting; on 'Take the mail' the camera eases back to the whole stage
  const CAM0 = { x: 1488, y: 680, s: 1.75 };
  S.xset(S.camera, { x: 960 - CAM0.x * CAM0.s, y: 540 - CAM0.y * CAM0.s, s: CAM0.s, ox: 0, oy: 0 });
  S.add(fx.cam({ x: 960, y: 540, scale: 1, d: 1.5, ease: 'power2.inOut' }), 'b1~Take-0.25');

  // ------------------------------------------------------------------ the two definition cards
  const cardL = S.g(null, S.hud), cardR = S.g(null, S.hud);   // outer holders (above the camera): they lean in b3
  const cardLIn = S.g(null, cardL), cardRIn = S.g(null, cardR);
  S.card({ x: CARD.lx, y: CARD.y, w: CARD.w, h: CARD.h, tone: 'neutral' }, cardLIn);
  S.card({ x: CARD.rx, y: CARD.y, w: CARD.w, h: CARD.h, tone: 'neutral' }, cardRIn);
  const TY = CARD.y + 70, DY = CARD.y + 124, ICY = CARD.y + CARD.h / 2;
  const watch = libStopwatch(S, { x: CARD.lx + 84, y: ICY + 6, size: 100, readout: 'none', span: 60, tone: 'neutral' }, cardLIn);
  const latTitle = S.text('Latency', { x: CARD.lx + 162, y: TY, size: 46, weight: 700, family: 'display' }, cardLIn);
  const latDesc = S.text('time for one letter', { x: CARD.lx + 162, y: DY, size: 28, weight: 500, color: 'muted' }, cardLIn);
  // stacked envelopes, the Throughput icon
  const stackIc = S.g(null, cardRIn);
  [[-12, -12], [0, 0], [12, 12]].forEach(([dx, dy]) => {
    S.rect({ x: CARD.rx + 82 + dx - 25, y: ICY + dy - 18, w: 50, h: 36, r: 5, fill: '#0c1326' }, stackIc);
    S.icon('ph:envelope-simple-duotone', { x: CARD.rx + 82 + dx, y: ICY + dy, size: 58, color: 'struct' }, stackIc);
  });
  const thrTitle = S.text('Throughput', { x: CARD.rx + 162, y: TY, size: 46, weight: 700, family: 'display' }, cardRIn);
  const thrDesc = S.text('letters per day', { x: CARD.rx + 162, y: DY, size: 28, weight: 500, color: 'muted' }, cardRIn);
  const thrCount = S.counter({ x: CARD.rx + CARD.w - 32, y: DY, size: 30, value: 0, anchor: 'end', color: 'ink' }, cardRIn);
  // the thin throughput bar, in the description's place once the description has gone
  const BAR = { x: CARD.rx + 162, y: CARD.y + 134, w: CARD.w - 162 - 34, h: 11 };
  const barG = S.g(null, cardRIn);
  S.rect({ x: BAR.x, y: BAR.y, w: BAR.w, h: BAR.h, r: 6, fill: '#ffffff', fillOpacity: 0.06, stroke: '#ffffff', strokeOpacity: 0.16, sw: 1.5 }, barG);
  const barFill = S.rect({ x: BAR.x, y: BAR.y, w: BAR.w, h: BAR.h, r: 6, fill: 'url(#bar-struct)' }, barG);
  hide(barG);
  S.set(barFill, { scaleX: 0, transformOrigin: '0% 50%' }, 0);
  const barTo = (v, at, d = 0.6, from) => S.add(gsap.fromTo(barFill, { scaleX: from, transformOrigin: '0% 50%' }, { scaleX: v, duration: d, ease: 'power2.inOut', transformOrigin: '0% 50%', immediateRender: false }), at);

  S.add(fx.in(cardLIn, { from: 'down', d: 0.7 }), 'b1~latency-0.2');
  S.add(fx.in(cardRIn, { from: 'down', d: 0.7 }), 'b1~throughput-0.15');
  hide(thrCount);
  S.add(fx.in(thrCount, { from: 'fade', d: 0.3 }), 'b1~throughput+0.6');

  // latency: one letter, timed
  const env1 = envelope(46);
  const LAND = { x: DOOR.mx + 2, y: DOOR.my - 6 };
  const tFly = T('b1~latency') + 0.4, tLand = T('b1~takes');
  ride(env1, `M${PO.x + 70},${UP} L${RX1 - 70},${UP} Q${LAND.x - 10},${UP} ${LAND.x},${LAND.y}`, tFly, tLand - tFly, { ease: 'power1.inOut', appear: true, vanish: true });
  S.add(watch.run(0, 22, { d: tLand - tFly }), tFly);
  S.add(gsap.timeline().set(boxDown, { autoAlpha: 0 }).set(boxUp, { autoAlpha: 1 }).add(fx.pulse(mailbox, { scale: 1.15, d: 0.4 })), tLand);
  S.add(gsap.to(clock, { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%', duration: 0.3, ease: 'power2.in' }), tLand);

  // throughput: a steady stream to all three houses, counted on the card
  const STREAM = { t0: T('b1~throughput') + 0.15, every: 0.11, n: 14, dur: 0.9 };
  for (let k = 0; k < STREAM.n; k++) {
    const h = k % 3, lane = h === 0 ? UP : h === 2 ? LO : (k % 2 ? UP : LO);
    const e = envelope(40);
    ride(e, `M${PO.x + 70},${lane} L${RX1 - 80},${lane} Q${HX - 50},${lane} ${HX - 16},${HY[h] + 12}`, STREAM.t0 + k * STREAM.every, STREAM.dur, { ease: 'power1.in', appear: true, vanish: true });
  }
  const arr0 = STREAM.t0 + STREAM.dur, arr1 = STREAM.t0 + (STREAM.n - 1) * STREAM.every + STREAM.dur;
  S.add(fx.count(thrCount, 0, STREAM.n, { d: arr1 - arr0, ease: 'none' }), arr0);
  // the beat ends: the description lines go; the counter goes as the last letter lands; the bar track appears
  S.add(fx.out([latDesc, thrDesc], { d: 0.4 }), 'b1>-0.15');
  // the titles settle to the cards' middle line once they stand alone
  S.add(gsap.fromTo([latTitle, thrTitle], { y: 0 }, { y: 22, duration: 0.6, ease: 'power2.inOut', immediateRender: false }), 'b1>+0.05');
  S.add(fx.out(thrCount, { d: 0.3 }), arr1 + 0.05);
  S.add(fx.in(barG, { from: 'fade', d: 0.5 }), arr1 + 0.2);
  S.add(watch.reset({ d: 0.5 }), 'b1>');

  // ------------------------------------------------------------------ b2: the van
  const van = S.g();                                       // holder (xform: drives)
  S.xset(van, { x: 430, y: LO });
  const vanVis = S.g(null, van);
  iconFacing('fluent:delivery-truck', 100, true, S.g({ transform: 'translate(0,-4)' }, vanVis));
  const vanCount = S.g(null, vanVis);
  S.rect({ x: -50, y: -82, w: 100, h: 36, r: 9, fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.3, sw: 1.5 }, vanCount);
  S.path({ d: 'M-7,-46 L0,-39 L7,-46', fill: '#0c1326', stroke: '#ffffff', strokeOpacity: 0.3, sw: 1.5 }, vanCount);
  const vanNum = S.counter({ x: 0, y: -63, size: 26, value: 0, anchor: 'middle', color: 'ink', fmt: S.fmt.int }, vanCount);
  hide(vanCount);
  const weekTag = S.text('once a week', { x: 430, y: RY1 + 32, size: 26, anchor: 'middle', color: 'muted', weight: 550 });
  S.add(fx.pop(vanVis, { from: 0.6, d: 0.55 }), 'b2~van-0.2');
  S.add(fx.in(weekTag, { from: 'up', d: 0.45 }), 'b2~van+0.05');
  // filling all week: letters pour from the post office into the van, the counter runs to 7,000
  const tFill = T('b2~filling'), tFull = T('b2~enormous') - 0.12;
  S.add(fx.in(vanCount, { from: 'fade', d: 0.25 }), tFill - 0.1);
  for (let k = 0; k < 12; k++) {
    const e = envelope(30);
    ride(e, `M${PO.x + 34},${PO.y - 34} Q${PO.x + 150},${RY0 - 70} ${430 - 18 + (k % 3) * 10},${LO - 26}`, tFill + k * 0.075, 0.38, { ease: 'power1.in', appear: true, vanish: true });
  }
  S.add(fx.count(vanNum, 0, 7000, { d: tFull - tFill, ease: 'power1.inOut' }), tFill);
  // enormous throughput: the tag goes, the van drives to the houses and unloads
  const tDrive = T('b2~enormous') - 0.05, dDrive = 1.0;
  S.add(fx.out(weekTag, { d: 0.3 }), tDrive - 0.15);
  S.add(fx.xform(van, { x: PARK_R }, { d: dDrive, ease: 'power2.inOut' }), tDrive);
  const tUnload = tDrive + dDrive - 0.12;
  for (let k = 0; k < 6; k++) {
    const e = envelope(30), h = k % 3;
    ride(e, `M${PARK_R - 10},${LO - 30} Q${PARK_R + 120},${RY0 - 40} ${HX - 12},${HY[h] + 10}`, tUnload + k * 0.04, 0.32, { ease: 'power1.in', appear: true, vanish: true });
  }
  S.add(fx.out(vanCount, { d: 0.3 }), tUnload);

  // the ledgers (middle band): van on the right, under Throughput; courier on the left, under Latency
  const ledger = (cx, side, iconId, text) => {
    const g = S.g();
    const tw = S.measure(text, { size: 28, weight: 560 });
    const iw = 64, gap = 14, x0 = side < 0 ? cx - (iw + gap + tw) : cx;
    iconFacing(iconId, iconId.includes('truck') ? 62 : 56, true, S.g({ transform: `translate(${x0 + iw / 2},${SLOT.y})` }, g));
    g.label = S.text(text, { x: x0 + iw + gap, y: SLOT.y, size: 28, weight: 560, color: 'ink' }, g);
    hide(g);
    return g;
  };
  const vanLedger = ledger(SLOT.ir, 1, 'fluent:delivery-truck', '≈ 1,000/day · up to a week');
  const courLedger = ledger(SLOT.il, -1, 'fluent:motor-scooter', '≈ 20/day · under an hour');
  S.add(fx.in(vanLedger, { from: 'up', d: 0.6 }), 'b2~throughput+0.1');

  // terrible latency: the next letter drops into the empty post office and waits a week
  const waitG = S.g();
  S.circle({ x: PO.x, y: PO.y - 4, r: 62, fill: '#0c1326', fillOpacity: 0.94, stroke: '#ffffff', strokeOpacity: 0.12, sw: 1.5 }, waitG);
  const ring = [];
  for (let d = 0; d < 7; d++) {
    const a0 = -Math.PI / 2 + d * 2 * Math.PI / 7 + 0.08, a1 = a0 + 2 * Math.PI / 7 - 0.16, R = 47;
    const P = a => `${(PO.x + R * Math.cos(a)).toFixed(1)},${(PO.y - 4 + R * Math.sin(a)).toFixed(1)}`;
    S.path({ d: `M${P(a0)} A${R},${R} 0 0 1 ${P(a1)}`, stroke: '#ffffff', strokeOpacity: 0.14, sw: 8, cap: 'butt' }, waitG);
    ring.push(S.path({ d: `M${P(a0)} A${R},${R} 0 0 1 ${P(a1)}`, stroke: 'ink', sw: 8, cap: 'butt' }, waitG));
  }
  hide(waitG);
  const waitEnv = envelope(42, waitG, true);
  const tDrop = T('b2~terrible') - 0.1;
  S.add(fx.in(waitG, { from: 'fade', d: 0.3 }), tDrop);
  ride(waitEnv, `M${PO.x},${PO.y - 150} L${PO.x},${PO.y - 4}`, tDrop, 0.35, { ease: 'power2.in', appear: true });
  S.set(ring, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(ring, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, stagger: 0.12, immediateRender: false }), tDrop + 0.4);
  const tWaitEnd = T('b2~courier') - 0.2;
  S.add(fx.out(waitG, { d: 0.3 }), tWaitEnd);

  // the courier: one letter at a time, there and back
  const cour = S.g();
  S.xset(cour, { x: COUR_HOME, y: UP });
  const courVis = S.g(null, cour);
  const scootR = iconFacing('fluent:motor-scooter', 78, true, courVis);
  const scootL = iconFacing('fluent:motor-scooter', 78, false, courVis);
  S.set(scootL, { autoAlpha: 0 }, 0);
  const carried = S.g(null, courVis);
  S.rect({ x: -15, y: -50, w: 30, h: 21, r: 3, fill: '#0c1326' }, carried);
  S.icon('ph:envelope-simple-duotone', { x: 0, y: -40, size: 34, color: 'struct' }, carried);
  const tC = T('b2~courier'), tOff = T('b2~off');
  S.add(fx.in(courVis, { from: 'left', d: 0.4 }), tC - 0.3);
  const trip = (tGo, dGo, house) => {
    S.add(fx.xform(cour, { x: COUR_END }, { d: dGo, ease: 'power2.inOut' }), tGo);
    const tArr = tGo + dGo;
    S.set(carried, { autoAlpha: 0 }, tArr);
    const hop = envelope(32);
    ride(hop, `M${COUR_END},${UP - 40} Q${HX - 60},${UP - 60} ${HX - 14},${HY[house] + 10}`, tArr, 0.3, { ease: 'power1.in', appear: true, vanish: true });
    S.set(scootR, { autoAlpha: 0 }, tArr + 0.05);
    S.set(scootL, { autoAlpha: 1 }, tArr + 0.05);
    return tArr;
  };
  const back = (tBack, dBack) => {
    S.add(fx.xform(cour, { x: COUR_HOME }, { d: dBack, ease: 'power2.inOut' }), tBack);
    const t = tBack + dBack;
    S.set(scootL, { autoAlpha: 0 }, t + 0.02);
    S.set(scootR, { autoAlpha: 1 }, t + 0.02);
    S.add(fx.pop(carried, { from: 0.4, d: 0.35 }), t + 0.02);
    return t;
  };
  const a1 = trip(tC, 0.62, 1);
  const r1 = back(Math.max(a1 + 0.08, tOff - 0.02), 0.45);
  const a2 = trip(r1 + 0.1, 0.62, 0);
  back(a2 + 0.08, 0.45);
  S.add(fx.in(courLedger, { from: 'up', d: 0.6 }), 'b2~letter+0.1');
  const illus = ch17Tag(S, 'illustrative');
  S.add(fx.in(illus, { from: 'fade', d: 0.5 }), 'b2~reverse');

  // ------------------------------------------------------------------ b3: neither is better; not independent
  // the balance: beam and pans swing, then settle level
  const SC = { x: 960, y: SLOT.y - 34, arm: 60 };
  const scale = S.g();
  S.line({ x1: SC.x, y1: SC.y, x2: SC.x, y2: SC.y + 72, stroke: 'ink', sw: 4 }, scale);
  S.path({ d: `M${SC.x - 26},${SC.y + 78} L${SC.x + 26},${SC.y + 78} L${SC.x + 14},${SC.y + 68} L${SC.x - 14},${SC.y + 68} Z`, fill: 'ink', stroke: 'ink', sw: 2 }, scale);
  const beam = S.line({ x1: SC.x - SC.arm, y1: SC.y, x2: SC.x + SC.arm, y2: SC.y, stroke: 'ink', sw: 4 }, scale);
  const pans = [-1, 1].map(() => {
    const p = S.g(null, scale);
    S.path({ d: 'M0,0 L-18,34 M0,0 L18,34', stroke: 'muted', sw: 2 }, p);
    S.path({ d: 'M-24,34 L24,34 Q0,52 -24,34 Z', fill: 'muted', fillOpacity: 0.85, stroke: 'ink', sw: 2 }, p);
    return p;
  });
  S.circle({ x: SC.x, y: SC.y, r: 6, fill: 'ink' }, scale);
  const setBeam = deg => {
    const a = deg * Math.PI / 180, dx = SC.arm * Math.cos(a), dy = SC.arm * Math.sin(a);
    beam.setAttribute('x1', SC.x - dx); beam.setAttribute('y1', SC.y - dy);
    beam.setAttribute('x2', SC.x + dx); beam.setAttribute('y2', SC.y + dy);
    pans[0].setAttribute('transform', `translate(${(SC.x - dx).toFixed(2)},${(SC.y - dy).toFixed(2)})`);
    pans[1].setAttribute('transform', `translate(${(SC.x + dx).toFixed(2)},${(SC.y + dy).toFixed(2)})`);
  };
  setBeam(-14);
  hide(scale);
  const diffQ = S.text('different questions', { x: 960, y: SLOT.y + 76, size: 26, anchor: 'middle', color: 'muted', weight: 550 });
  hide(diffQ);
  S.add(fx.in(scale, { from: 'fade', d: 0.35 }), 'b3~Neither-0.15');
  S.add(drive(p => setBeam(p >= 1 ? 0 : -14 * Math.exp(-3.4 * p) * Math.cos(3.2 * Math.PI * p)), 1.25), 'b3~Neither-0.05');
  S.add(fx.in(diffQ, { from: 'up', d: 0.5 }), 'b3~better');

  // 'Unlike memory's latency and bandwidth': a grey inset of ch06's ship and courier, 'independent'
  const defs = S.el('defs', null, S.layers.back);
  const desat = S.el('filter', { id: 'ch17s01-desat' }, defs);
  S.el('feColorMatrix', { type: 'saturate', values: 0.28 }, desat);
  const inset = S.g();
  S.rect({ x: 760, y: 404, w: 400, h: 196, r: 18, fill: '#0c1326', fillOpacity: 0.95, stroke: '#ffffff', strokeOpacity: 0.14, sw: 2 }, inset);
  const insetArt = S.g({ filter: 'url(#ch17s01-desat)', opacity: 0.85 }, inset);
  S.icon('fluent:ship', { x: 868, y: 478, size: 112 }, insetArt);
  iconFacing('fluent:motor-scooter', 86, false, S.g({ transform: 'translate(1058,484)' }, insetArt));
  S.text('independent', { x: 960, y: 562, size: 28, anchor: 'middle', color: 'muted', weight: 600 }, inset);
  hide(inset);
  const tUnlike = T('b3~Unlike') - 0.1, tPull = T('b3~pull') - 0.15;
  S.add(fx.out([diffQ, vanLedger, courLedger, illus, scale], { d: 0.35, stagger: 0 }), tUnlike);
  S.add(fx.in(inset, { from: 'scale', scale: 0.92, d: 0.55 }), tUnlike + 0.25);
  S.add(fx.out(inset, { d: 0.35 }), tPull);
  S.add(fx.in([vanLedger, courLedger, scale], { from: 'fade', d: 0.45, stagger: 0 }), tPull + 0.3);
  S.add(fx.in(illus, { from: 'fade', d: 0.45 }), tPull + 0.3);

  // 'pull against each other': a slack double-headed arrow between the cards draws, then pulls taut,
  // and the two cards lean toward each other
  const AR = { y: ICY, l: CARD.lx + CARD.w + 12, r: CARD.rx - 12, lean: 6, sag: 26, hs: 12 };
  const arrowG = S.g(null, S.hud);
  const arrowLine = S.path({ d: '', stroke: 'ink', sw: 3.5 }, arrowG);
  const heads = [0, 1].map(() => S.path({ d: '', stroke: 'ink', sw: 3.5 }, arrowG));
  const setArrow = p => {   // p 0: slack, 1: taut
    const l = AR.l + AR.lean * p, r = AR.r - AR.lean * p, sag = AR.sag * (1 - p), m = (l + r) / 2;
    arrowLine.setAttribute('d', `M${l},${AR.y} Q${m},${AR.y + 2 * sag} ${r},${AR.y}`);
    // head direction = tangent at each end
    const tan = [[l - m, -2 * sag], [r - m, -2 * sag]];
    [l, r].forEach((x, i) => {
      const [tx, ty] = tan[i], L = Math.hypot(tx, ty) || 1, ux = tx / L, uy = ty / L, hs = AR.hs;
      heads[i].setAttribute('d', `M${x - ux * hs - uy * hs * 0.6},${AR.y - uy * hs + ux * hs * 0.6} L${x},${AR.y} L${x - ux * hs + uy * hs * 0.6},${AR.y - uy * hs - ux * hs * 0.6}`);
    });
  };
  setArrow(0);
  const tArrow = T('b3~pull');
  S.add(gsap.fromTo(arrowLine, { drawSVG: '50% 50%', autoAlpha: 0 }, { drawSVG: '0% 100%', autoAlpha: 1, duration: 0.45, ease: 'power2.out' }), tArrow);
  S.set(heads, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(heads, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, immediateRender: false }), tArrow + 0.38);
  S.add(drive(setArrow, 0.55, 'back.out(2.2)'), T('b3~against') - 0.05);
  S.add(gsap.fromTo(cardL, { rotation: 0, x: 0, svgOrigin: `${CARD.lx + CARD.w / 2} ${CARD.y + CARD.h}` },
    { rotation: 1.1, x: AR.lean, svgOrigin: `${CARD.lx + CARD.w / 2} ${CARD.y + CARD.h}`, duration: 0.55, ease: 'back.out(2.2)', immediateRender: false }), T('b3~against') - 0.05);
  S.add(gsap.fromTo(cardR, { rotation: 0, x: 0, svgOrigin: `${CARD.rx + CARD.w / 2} ${CARD.y + CARD.h}` },
    { rotation: -1.1, x: -AR.lean, svgOrigin: `${CARD.rx + CARD.w / 2} ${CARD.y + CARD.h}`, duration: 0.55, ease: 'back.out(2.2)', immediateRender: false }), T('b3~against') - 0.05);

  // ------------------------------------------------------------------ b4: the same stage, for a server
  S.add(fx.out([illus, scale, vanLedger, courLedger], { d: 0.45, stagger: 0.05 }), 'b4~Nothing');
  const tMorph = T('b4~serving') - 0.15;
  // post office -> GPU
  const gpuG = S.g();
  const gpu = ch17Gpu(S, { x: PO.x, y: PO.y }, gpuG);
  hide(gpuG);
  S.add(gsap.to(postOffice, { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.32, ease: 'power2.in' }), tMorph);
  S.add(gsap.fromTo(gpuG, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, immediateRender: false }), tMorph + 0.3);
  S.add(gpu.drawOn({ d: 0.9 }), tMorph + 0.3);
  // houses and the person -> ten users (they fly out of the houses)
  const U = ch17Users(S, { x: 1752, y: 712, n: 10, cols: 2, gapX: 74, gapY: 60, size: 46 });
  S.add(gsap.to([...houses, person, mailbox], { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 50%', duration: 0.4, ease: 'power2.in', stagger: 0.04 }), tMorph + 0.05);
  S.add(gsap.fromTo(U.list, {
    autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%',
    x: (i, u) => HX - u.cx, y: (i, u) => HY[Math.min(2, Math.floor(i * 3 / 10))] - u.cy,
  }, { autoAlpha: 1, scale: 1, x: 0, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.04, transformOrigin: '50% 50%', immediateRender: false }), tMorph + 0.2);
  // the courier and its letter -> one request pill on the upper lane
  const singles = [0, 1, 2, 3].map(() => pill(COUR_HOME, UP));
  S.add(gsap.to(courVis, { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 50%', duration: 0.35, ease: 'power2.in' }), tMorph + 0.1);
  S.add(singles[0].pop({ d: 0.45 }), tMorph + 0.35);
  // the van -> a tray on the lower lane, which slides back to the GPU end
  const tray = S.g();
  S.xset(tray, { x: PARK_R, y: LO });
  const trayVis = S.g(null, tray);
  const trayBody = S.g(null, trayVis);
  S.rect({ x: -118, y: -33, w: 236, h: 66, r: 14, fill: '#0c1326' }, trayBody);
  S.rect({ x: -118, y: -33, w: 236, h: 66, r: 14, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.75, sw: 2.5 }, trayBody);
  hide(trayVis);
  const slot = k => [-86 + Math.floor(k / 2) * 43, -12.5 + (k % 2) * 25];
  S.add(gsap.to(vanVis, { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.35, ease: 'power2.in' }), tMorph + 0.15);
  S.add(fx.pop(trayVis, { from: 0.6, d: 0.45 }), tMorph + 0.35);
  S.add(fx.xform(tray, { x: TRAY_HOME }, { d: 0.75, ease: 'power2.inOut' }), tMorph + 0.75);
  // the road becomes a link: its edges take the blue of requests
  S.add(gsap.to(edges, { attr: { stroke: S.tone('struct') }, strokeOpacity: 0.35, duration: 0.6 }), tMorph + 0.3);

  // 'this choice': the dial
  const slider = S.g();
  const track = S.line({ x1: SL.x0, y1: SL.y, x2: SL.x1, y2: SL.y, stroke: '#ffffff', strokeOpacity: 0.3, sw: 6 }, slider);
  const ticks = [SL.x0, (SL.x0 + SL.x1) / 2, SL.x1].map(x => S.line({ x1: x, y1: SL.y - 12, x2: x, y2: SL.y + 12, stroke: 'faint', sw: 2.5 }, slider));
  const endL = miniPill(SL.x0 - 54, SL.y, slider);
  const endR = miniTray(SL.x1 + 62, SL.y, slider);
  const slLabel = S.text('wait before sending', { x: 960, y: SL.y + 50, size: 28, anchor: 'middle', color: 'muted', weight: 550 }, slider);
  const knob = S.g(null, slider);
  S.xset(knob, { x: 0 });
  const knobIn = S.g(null, knob);
  S.circle({ x: 960, y: SL.y, r: 19, fill: 'ink', filter: 'url(#shadow)' }, knobIn);
  S.circle({ x: 960, y: SL.y, r: 8, fill: 'struct' }, knobIn);
  [track, ...ticks].forEach(hide); [endL, endR, slLabel, knobIn].forEach(hide);
  const tChoice = T('b4~this') - 0.05;
  S.add(gsap.fromTo(track, { drawSVG: '50% 50%', autoAlpha: 0 }, { drawSVG: '0% 100%', autoAlpha: 1, duration: 0.55, ease: 'power2.out' }), tChoice);
  S.add(fx.in(ticks, { from: 'fade', d: 0.3, stagger: 0.05 }), tChoice + 0.2);
  S.add(fx.pop([endL, endR], { from: 0.5, d: 0.45, stagger: 0.08 }), tChoice + 0.3);
  S.add(fx.pop(knobIn, { from: 0.4, d: 0.45 }), tChoice + 0.35);
  S.add(fx.in(slLabel, { from: 'up', d: 0.5 }), tChoice + 0.3);
  const knobTo = (x, at) => S.add(fx.xform(knob, { x: x - 960 }, { d: 0.6, ease: 'power3.inOut' }), at);

  // the two rates (the slots the ledgers used): left = answer at once, right = gather
  const rateRow = (cx, kind, unit, widest) => {
    const g = S.g();
    const iconW = kind === 'tray' ? 60 : 32, numW = S.measure(widest, { size: 34, weight: 600, family: 'mono' });
    const unitW = S.measure(unit, { size: 28, weight: 550 });
    const total = iconW + 16 + numW + 10 + unitW, x0 = cx - total / 2;
    (kind === 'tray' ? miniTray : miniPill)(x0 + iconW / 2, SLOT.y, g);
    g.num = S.counter({ x: x0 + iconW + 16 + numW, y: SLOT.y, size: 34, value: 0, anchor: 'end', prefix: '≈ ', color: 'ink' }, g);
    g.unit = S.text(unit, { x: x0 + iconW + 16 + numW + 10, y: SLOT.y + 1, size: 28, weight: 550, color: 'ink' }, g);
    hide(g);
    return g;
  };
  const rateR = rateRow(SLOT.r, 'tray', 'tokens/s in total', '≈ 240');
  const subR = S.text('each user ≈ 24/s', { x: SLOT.r, y: SLOT.y + 46, size: 26, anchor: 'middle', color: 'muted', weight: 550 });
  hide(subR);
  const rateL = rateRow(SLOT.l, 'pill', 'tokens/s', '≈ 24');
  const h100 = ch17Tag(S, 'H100, weights only');

  // 'wait to gather requests': knob right; ten pills collect; the full tray leaves together
  const tWait = T('b4~wait') - 0.15;
  knobTo(SL.x1, tWait);
  const batch = Array.from({ length: 10 }, (_, k) => pill(slot(k)[0], slot(k)[1], tray));
  batch.forEach((p, k) => S.add(gsap.fromTo(p, { autoAlpha: 0, y: -44 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.in', immediateRender: false }), tWait + 0.2 + k * 0.075));
  const tGo = T('b4~requests') + 0.08, dGo = 0.8;
  S.add(fx.xform(tray, { x: PARK_R }, { d: dGo, ease: 'power2.inOut' }), tGo);
  barTo(1, tGo + 0.1, 0.8, 0);
  S.add(fx.in(rateR, { from: 'up', d: 0.5 }), tGo + 0.1);
  S.add(fx.count(rateR.num, 0, 240, { d: 0.9, ease: 'power2.out' }), tGo + 0.1);
  S.add(fx.in(subR, { from: 'up', d: 0.5 }), T('b4~more') - 0.1);
  S.add(fx.in(h100, { from: 'fade', d: 0.5 }), T('b4~more'));
  // arrived: each pill goes to its user
  const tDeliver = tGo + dGo - 0.05;
  batch.forEach((p, k) => {
    const [ux, uy] = U.at(k);
    S.add(p.moveTo([ux - PARK_R, uy - LO], { d: 0.32, ease: 'power2.in' }), tDeliver + k * 0.025);
    S.add(gsap.to(p, { autoAlpha: 0, duration: 0.12 }), tDeliver + k * 0.025 + 0.28);
  });
  S.add(fx.pulse(U.list, { scale: 1.12, d: 0.35 }), tDeliver + 0.28);
  S.add(fx.xform(tray, { x: TRAY_HOME }, { d: 0.5, ease: 'power2.inOut' }), tDeliver + 0.42);

  // 'answer at once': knob left; the tray sits empty; pills leave one by one on the upper lane
  const tOnce = T('b4~answer') - 0.18;
  knobTo(SL.x0, tOnce);
  S.add(fx.dim([trayVis], { to: 0.35 }), tOnce + 0.1);
  S.add(fx.dim([rateR, subR], { to: 0.3 }), tOnce + 0.1);
  barTo(0.1, tOnce + 0.25, 0.6, 1);
  S.add(fx.in(rateL, { from: 'up', d: 0.5 }), tOnce + 0.3);
  S.add(fx.count(rateL.num, 0, 24, { d: 0.6, ease: 'power2.out' }), tOnce + 0.3);
  S.add(fx.pulse(rateL, { scale: 1.08, d: 0.45 }), 'b4~less-0.1');
  singles.forEach((p, k) => {
    const tDep = tOnce + 0.2 + k * 0.48;
    if (k > 0) S.add(p.pop({ d: 0.3 }), tDep - 0.32);
    const [ux, uy] = U.at(k);
    S.add(p.travel(`M${COUR_HOME},${UP} L${RX1 - 60},${UP} Q${ux - 40},${UP} ${ux},${uy}`, { d: 0.78, ease: 'power1.in' }), tDep);
    S.add(gsap.to(p, { autoAlpha: 0, duration: 0.12 }), tDep + 0.74);
    S.add(fx.pulse(U.list[k], { scale: 1.12, d: 0.3 }), tDep + 0.74);
  });

  // ------------------------------------------------------------------ b5: the first request waits for the rest
  const tFirst = T('b5~first') - 0.25;
  knobTo(SL.x1, tFirst);
  S.add(fx.out([rateL, rateR, subR, h100], { d: 0.4, stagger: 0 }), tFirst);
  S.add(fx.undim([trayVis]), tFirst + 0.1);
  const wait2 = Array.from({ length: 10 }, (_, k) => pill(slot(k)[0], slot(k)[1], tray));
  const tP0 = tFirst + 0.3, tTrickle = tP0 + 0.5, every = 0.25;
  const tAll = tTrickle + 8 * every + 0.3;                  // the tenth has landed
  barTo(0.1, tP0 + 0.15, 0.25, 0.1);
  wait2.forEach((p, k) => {
    const t = k === 0 ? tP0 : tTrickle + (k - 1) * every;
    S.add(gsap.fromTo(p, { autoAlpha: 0, y: -44 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.in', immediateRender: false }), t);
    if (k > 0) barTo((k + 1) / 10, t + 0.25, 0.2, k / 10);
  });
  S.add(wait2[0].pulse({ scale: 1.35, d: 0.5 }), tP0 + 0.3);
  S.add(wait2[0].glow({ hold: tAll - tP0 - 0.6 }), tP0 + 0.3);
  // a small stopwatch over the tray, and the Latency card's watch, run while the rest trickle in
  const sw2 = libStopwatch(S, { x: TRAY_HOME + 170, y: LO + 2, size: 62, readout: 'none', span: 60, tone: 'neutral' }, S.layers.front);
  S.add(sw2.in({ d: 0.35 }), tP0 + 0.15);
  S.add(sw2.run(0, 52, { d: tAll - tP0 - 0.4 }), tP0 + 0.4);
  S.add(watch.run(0, 52, { d: tAll - tP0 - 0.4 }), tP0 + 0.4);
  S.add(fx.pulse(cardLIn, { scale: 1.02, d: 0.5 }), tAll);
  // 'arriving in time': a teal clock flickers once over each user
  const badges = U.list.map(u => {
    const b = S.g(null, S.layers.front);
    S.circle({ x: u.cx + 19, y: u.cy - 19, r: 13, fill: '#0c1326', stroke: 'helps', sw: 2 }, b);
    S.icon('ph:clock-duotone', { x: u.cx + 19, y: u.cy - 19, size: 20, color: 'helps' }, b);
    b.setAttribute('data-audit', 'ignore');
    hide(b);
    return b;
  });
  const tTime = T('b5~arriving') - 0.1;
  S.add(fx.pop(badges, { from: 0.4, d: 0.35, stagger: 0.045 }), tTime);
  S.add(fx.out(badges, { d: 0.45, stagger: 0.03 }), tTime + 1.05);
});
