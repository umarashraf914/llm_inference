/* ch06_s05 · close is not the same as on (fig 79)
   b1  s04's last package (memory hugging the die). A ghost arrow tries to drag a stack onto the die and it
       springs back. Heading; the package sinks to the background. Three cards: amber 'Fast logic', coral
       'Dense storage' (each with its own process recipe card), blue 'Nobody has made both'; amber and coral
       slide into one slab, a crack runs down the seam, they part.
   b2  a postage stamp with the amber die on it; a coral '140 GB' block grows beside it until it dwarfs it;
       a price tag spins up dollar signs and is struck through ('at any price' stays).
   b3  the camera pulls back to the package filling the frame ('off-chip: separate chips, side by side'),
       then dives into the hairline gap between the die and the middle stack: 'close ≠ on' → 'the memory wall'.
   b4  hold on the gap; two grey captions.
   The camera is one painter on `world` (a translate + scale that maps a focus point P to a screen point Q). */
V.scene('ch06_s05', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = n => gsap.parseEase(n);
  const eIO2 = E('power2.inOut'), eIO3 = E('power3.inOut');
  const ignoreIn = (els, a, b) => ch06Clock(S, a, b, t => els.forEach(e => (t > a && t < b ? e.setAttribute('data-audit', 'ignore') : e.removeAttribute('data-audit'))));

  // ================================================================ the world: s04's final package
  const world = S.g();
  const PS = 1.1, GAP = 16, LX = -(300 + GAP + 130) / 2;         // die's left edge, local (-223)
  const PX = 1000 + PS * (-300 - LX);                             // same die position as s04's end (915.3)
  const pkg = ch06Package(S, { x: PX, y: 640, s: PS, gap: GAP, wires: 40, wireSw: 0.75 }, world);
  const D = pkg.dieBox, ST = [0, 1, 2].map(i => pkg.stackBox(i));

  // the ghost arrow: tries to drag the middle stack onto the die, and it springs back
  const ghost = S.g(null, world);
  S.rect({ x: ST[1].x, y: ST[1].y, w: ST[1].w, h: ST[1].h, r: 11, fill: 'bytes', fillOpacity: 0.14, stroke: 'bytes', sw: 2.5, dash: '8 7' }, ghost);
  const gArrow = S.arrow({ x1: ST[1].cx + 30, y1: ST[1].y - 70, x2: D.cx + 20, y2: D.y + 70, color: 'muted', sw: 3, head: 14, bend: -70, dash: '10 8' }, world);
  S.set(gArrow, { autoAlpha: 0 }, 0);
  S.set(ghost, { autoAlpha: 0 }, 0);
  const tG = T('b1~put') - 0.1, dx = (D.cx - ST[1].cx) * 0.55;
  S.add(fx.in(gArrow, { from: 'fade', d: 0.35 }), tG);
  S.add(gsap.fromTo(ghost, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, immediateRender: false }), tG + 0.25);
  S.add(gsap.fromTo(ghost, { x: 0 }, { x: dx, duration: 0.45, ease: 'power2.in', immediateRender: false }), tG + 0.3);
  S.add(gsap.fromTo(ghost, { x: dx }, { x: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)', immediateRender: false }), tG + 0.78);
  S.add(gsap.to([ghost, gArrow], { autoAlpha: 0, duration: 0.35 }), tG + 1.45);

  const head = S.text('Why the memory is not on the chip', { x: 960, y: 128, size: 52, weight: 700, family: 'display', anchor: 'middle', color: 'ink' });
  S.add(fx.in(head, { from: 'up', d: 0.6, dist: 16 }), T('b1~chip?') + 0.1);

  // ---------------------------------------------------------------- the camera
  // state: {s, P (world point), Q (screen point), o (opacity)}; the transform maps P to Q at scale s
  const A = { s: 1, P: [960, 640], Q: [960, 640], o: 1 };
  const B = { s: 0.78, P: [960, 640], Q: [960, 700], o: 0.13 };
  const C = { s: 1.75, P: [PX, 640 + PS * 20], Q: [960, 520], o: 1 };
  const gapP = [PX + PS * ((LX + 300) + GAP / 2), 640];           // the gap beside the middle stack
  const DZ = { s: 30 / PS, P: gapP, Q: [960, 540], o: 1 };
  const tAB = T('b1~Each') - 0.05, tBC = T('b3') + 0.25, tCD = T('b3~Close') - 0.05;
  const legs = [[tAB, 0.9, A, B], [tBC, 1.3, B, C], [tCD, 1.5, C, DZ]];
  const camAt = t => {
    let st = A;
    for (const [t0, d, a, b] of legs) {
      if (t < t0) break;
      const u = eIO3(cl((t - t0) / d));
      st = { s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), u)), P: [0, 1].map(i => lerp(a.P[i], b.P[i], u)), Q: [0, 1].map(i => lerp(a.Q[i], b.Q[i], u)), o: lerp(a.o, b.o, u) };
    }
    return st;
  };
  const cam = t => {
    const c = camAt(t);
    world.setAttribute('transform', `translate(${(c.Q[0] - c.s * c.P[0]).toFixed(2)},${(c.Q[1] - c.s * c.P[1]).toFixed(2)}) scale(${c.s.toFixed(4)})`);
    world.setAttribute('opacity', c.o.toFixed(3));
  };
  cam(0);
  ch06Clock(S, 0, S.duration, cam);
  ignoreIn([world], tAB, tBC + 1.3);                              // faint and small in the background
  ignoreIn([world], tCD, S.duration);                             // labels grow off the frame

  // ================================================================ b1: three cards
  const CW = 500, CH = 200, CY = 196, CXS = [140, 710, 1280];
  const recipe = (x, y, tone, kind, parent) => {
    const g = S.g(null, parent);
    S.rect({ x: x - 30, y: y - 38, w: 60, h: 76, r: 7, fill: '#0c1326', stroke: tone, sw: 2.2 }, g);
    S.rect({ x: x - 30, y: y - 38, w: 60, h: 14, r: 7, fill: tone, fillOpacity: 0.55 }, g);
    if (kind === 'a') {                                           // logic: short steps and a zigzag
      [[-18, 6, 22], [-18, 4, 30], [-18, 2, 16]].forEach(([dx0, dy, w], k) => S.line({ x1: x + dx0, y1: y - 12 + k * 11, x2: x + dx0 + w, y2: y - 12 + k * 11, stroke: tone, sw: 2 }, g));
      S.path({ d: `M${x - 18},${y + 26} l7,-8 l7,8 l7,-8 l7,8 l7,-8`, stroke: tone, sw: 2 }, g);
    } else {                                                      // storage: a grid of cells
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) S.rect({ x: x - 19 + c * 10, y: y - 14 + r * 10, w: 7, h: 7, r: 1.5, fill: tone, fillOpacity: 0.7 }, g);
    }
    S.text('process', { x, y: y + 60, size: 22, weight: 550, anchor: 'middle', color: 'muted' }, g);
    g.querySelectorAll('line, path').forEach(e => e.setAttribute('data-audit', 'ignore'));
    return g;
  };
  const card = (k, tone, l1, l2, s1, s2, rec) => {
    const outer = S.g(), g = S.g(null, outer);
    const x = CXS[k];
    S.card({ x, y: CY, w: CW, h: CH, tone, r: 22 }, g);
    S.text(l1, { x: x + 30, y: CY + 56, size: s1, weight: 700, color: tone === 'struct' ? 'ink' : tone }, g);
    S.text(l2, { x: x + 30, y: CY + 56 + s1 * 1.35, size: s2, weight: 550, color: tone === 'struct' ? 'ink' : 'muted' }, g);
    if (rec) recipe(x + CW - 62, CY + 86, tone, rec, g);
    outer.inner = g;
    return outer;
  };
  const cAmber = card(0, 'compute', 'Fast logic', 'one kind of silicon process', 36, 26, 'a');
  const cCoral = card(1, 'bytes', 'Dense storage', 'a different one', 36, 26, 'b');
  const cBlue = card(2, 'struct', 'Nobody has made both', 'work on one piece of silicon', 34, 30, null);
  S.add(fx.in(cAmber, { from: 'left', d: 0.6, dist: 40 }), 'b1~Logic-0.1');
  S.add(fx.in(cCoral, { from: 'up', d: 0.6, dist: 30 }), 'b1~dense-0.1');
  S.add(fx.in(cBlue, { from: 'right', d: 0.6, dist: 40 }), 'b1~nobody-0.1');
  // amber and coral slide into one slab, a crack runs down the seam, and they part again
  const tSlab = T('b1~made') - 0.1, half = (CXS[1] - CXS[0] - CW) / 2;
  S.add(gsap.fromTo(cAmber.inner, { x: 0 }, { x: half, duration: 0.45, ease: 'power3.in', immediateRender: false }), tSlab);
  S.add(gsap.fromTo(cCoral.inner, { x: 0 }, { x: -half, duration: 0.45, ease: 'power3.in', immediateRender: false }), tSlab);
  const seam = CXS[0] + CW + half;
  let cd = `M${seam - 4},${CY - 8}`;
  const rc = S.rand(65);
  for (let y = CY + 18; y < CY + CH; y += 22) cd += ` L${(seam + (rc() - 0.5) * 26).toFixed(1)},${y}`;
  cd += ` L${seam + 3},${CY + CH + 8}`;
  const crack = S.path({ d: cd, stroke: 'ink', sw: 3.5 }, null);
  crack.setAttribute('stroke-linejoin', 'round');
  crack.setAttribute('data-audit', 'ignore');
  S.set(crack, { autoAlpha: 0 }, 0);
  const tCrack = tSlab + 0.5;
  S.add(fx.draw(crack, { d: 0.35, ease: 'power1.in' }), tCrack);
  const tPart = T('b1~well') + 0.2;
  S.add(gsap.fromTo(cAmber.inner, { x: half }, { x: 0, duration: 0.7, ease: 'power3.out', immediateRender: false }), tPart);
  S.add(gsap.fromTo(cCoral.inner, { x: -half }, { x: 0, duration: 0.7, ease: 'power3.out', immediateRender: false }), tPart);
  S.add(gsap.to(crack, { autoAlpha: 0, duration: 0.3 }), tPart);
  ignoreIn([cAmber, cCoral], tSlab, tPart + 0.7);                 // the cards touch while they are one slab

  // ================================================================ b2: a postage stamp, 140 GB, any price
  const cards = [cAmber, cCoral, cBlue];
  S.add(gsap.to(cards, { opacity: 0.35, duration: 0.5 }), T('b2') - 0.1);
  // the stamp: off-white paper with a scalloped edge and the amber die drawn on it
  const SP = { x: 300, y: 690, w: 170, h: 204 };
  const stamp = S.g();
  S.rect({ x: SP.x - SP.w / 2, y: SP.y - SP.h / 2, w: SP.w, h: SP.h, r: 4, fill: '#e9e3d3' }, stamp);
  for (let k = 0; k <= 8; k++) {
    [SP.y - SP.h / 2, SP.y + SP.h / 2].forEach(y => S.circle({ x: SP.x - SP.w / 2 + k * SP.w / 8, y, r: 6.5, fill: '#0b1124' }, stamp));
  }
  for (let k = 1; k < 10; k++) {
    [SP.x - SP.w / 2, SP.x + SP.w / 2].forEach(x => S.circle({ x, y: SP.y - SP.h / 2 + k * SP.h / 10, r: 6.5, fill: '#0b1124' }, stamp));
  }
  S.rect({ x: SP.x - 58, y: SP.y - 70, w: 116, h: 116, r: 8, fill: '#1a1408', stroke: 'compute', sw: 3 }, stamp);
  let sf = '';
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) sf += `M${SP.x - 47 + c * 16},${SP.y - 59 + r * 16}h12v12h-12z`;
  S.path({ d: sf, fill: 'compute', fillOpacity: 0.7 }, stamp);
  S.text('1 chip', { x: SP.x, y: SP.y + 74, size: 22, weight: 700, anchor: 'middle', color: '#3a3326' }, stamp);
  const stampLbl = S.text('a postage stamp of silicon', { x: SP.x, y: SP.y + SP.h / 2 + 40, size: 24, weight: 550, anchor: 'middle', color: 'muted' });
  S.set([stamp, stampLbl], { autoAlpha: 0 }, 0);
  S.add(fx.in(stamp, { from: 'up', d: 0.55, dist: 20 }), T('b2') + 0.1);
  S.add(fx.in(stampLbl, { from: 'fade', d: 0.45 }), 'b2~postage-0.1');
  // the 140 GB block grows from a stamp-sized square until it dwarfs it
  const BK = { x: 490, y: 690 }, BK0 = { w: 150, h: 150 }, BK1 = { w: 760, h: 520 };
  const blk = S.g();
  const blkR = S.rect({ x: BK.x, y: BK.y - BK0.h / 2, w: BK0.w, h: BK0.h, r: 14, fill: '#2a1218', stroke: 'bytes', sw: 3 }, blk);
  const blkT = S.text('140 GB', { x: BK.x + BK0.w / 2, y: BK.y + 2, size: 40, weight: 700, family: 'mono', anchor: 'middle', color: 'bytes' }, blk);
  S.set(blk, { autoAlpha: 0 }, 0);
  const tB0 = T('b2~hundred') - 0.15, tB1 = T('b2~fit');
  S.add(fx.in(blk, { from: 'fade', d: 0.35 }), tB0);
  ch06Clock(S, tB0 + 0.25, tB1, t => {
    const u = eIO2(cl((t - tB0 - 0.25) / (tB1 - tB0 - 0.25)));
    const w = lerp(BK0.w, BK1.w, u), h = lerp(BK0.h, BK1.h, u);
    blkR.setAttribute('y', (BK.y - h / 2).toFixed(2)); blkR.setAttribute('width', w.toFixed(2)); blkR.setAttribute('height', h.toFixed(2));
    blkT.setAttribute('x', (BK.x + w / 2).toFixed(2)); blkT.setAttribute('font-size', lerp(40, 96, u).toFixed(2));
  });
  // the price tag: dollar signs spin up out of it; a grey strike crosses the tag, not the label
  const PT = { x: 1420, y: 690 };
  const tagG = S.g();
  S.icon('ph:tag-duotone', { x: PT.x, y: PT.y, size: 96, color: 'muted' }, tagG);
  const anyPrice = S.text('at any price', { x: PT.x + 66, y: PT.y, size: 32, weight: 600, color: 'muted' });
  S.set([tagG, anyPrice], { autoAlpha: 0 }, 0);
  const tP = T('b2~at') - 0.25;
  S.add(fx.in(tagG, { from: 'fade', d: 0.35 }), tP);
  S.add(fx.in(anyPrice, { from: 'left', d: 0.4, dist: 12 }), tP + 0.1);
  const dollars = [0, 1, 2, 3].map(k => S.text('$', { x: PT.x - 45 + k * 30, y: PT.y - 40, size: 30, weight: 700, anchor: 'middle', color: 'compute', opacity: 0 }));
  dollars.forEach(e => e.setAttribute('data-audit', 'ignore'));
  const tD = T('b2~any') - 0.1;
  ch06Clock(S, tD, tD + 1.1, t => dollars.forEach((e, k) => {
    const u = cl((t - tD - k * 0.12) / 0.6);
    e.setAttribute('opacity', (u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0).toFixed(3));
    e.setAttribute('y', (PT.y - 40 - 70 * u).toFixed(2));
    e.setAttribute('transform', `rotate(${(360 * u).toFixed(1)} ${PT.x - 45 + k * 30} ${(PT.y - 40 - 70 * u).toFixed(2)})`);
  }));
  const strike = S.line({ x1: PT.x - 56, y1: PT.y + 46, x2: PT.x + 52, y2: PT.y - 48, stroke: 'muted', sw: 5 });
  strike.setAttribute('data-audit', 'ignore');
  S.set(strike, { autoAlpha: 0 }, 0);
  S.add(fx.draw(strike, { d: 0.3 }), tD + 1.0);

  // ================================================================ b3: off-chip, then into the gap
  const tOff = T('b3') - 0.1;
  S.add(fx.out([head, ...cards], { to: 'up', d: 0.5, dist: 60, stagger: 0.04 }), tOff);
  S.add(fx.out([stamp, stampLbl, blk, tagG, anyPrice, strike], { to: 'down', d: 0.5, dist: 80, stagger: 0.03 }), tOff);
  const offTag = S.text('off-chip: separate chips, side by side', { x: 960, y: 1000, size: 30, weight: 600, anchor: 'middle', color: 'muted' });
  S.set(offTag, { autoAlpha: 0 }, 0);
  S.add(fx.in(offTag, { from: 'up', d: 0.5, dist: 12 }), 'b3~off-0.1');
  S.add(fx.out(offTag, { d: 0.35 }), tCD - 0.1);
  // the label in the gap: 'close ≠ on', then 'the memory wall'
  const plate = (w, y) => S.rect({ x: 960 - w / 2, y: y - 44, w, h: 88, r: 22, fill: '#0b1124', fillOpacity: 0.94, stroke: 'ink', strokeOpacity: 0.2, sw: 2 });
  const lab = S.g();
  const labPlate = plate(470, 540);
  lab.appendChild(labPlate);
  const closeNe = S.text('close ≠ on', { x: 960, y: 542, size: 56, weight: 700, family: 'display', anchor: 'middle', color: 'ink' }, lab);
  const wallT = S.text('the memory wall', { x: 960, y: 542, size: 52, weight: 700, family: 'display', anchor: 'middle', color: 'bytes' }, lab);
  S.set(lab, { autoAlpha: 0 }, 0);
  S.set(wallT, { autoAlpha: 0 }, 0);
  S.add(fx.in(lab, { from: 'fade', d: 0.45 }), T('b3~on,') - 0.25);
  S.add(gsap.to(closeNe, { autoAlpha: 0, duration: 0.3 }), 'b3~memory#2-0.15');
  S.add(fx.in(wallT, { from: 'up', d: 0.45, dist: 12 }), 'b3~memory#2');

  // ================================================================ b4: not an oversight
  const capA = S.g(), capB = S.g();
  const wA = S.measure('not an oversight anyone could avoid', { size: 32, weight: 600 }) + 60;
  const wB = S.measure('what silicon can and cannot do', { size: 32, weight: 600 }) + 60;
  capA.appendChild(plate(wA, 820)); capB.appendChild(plate(wB, 916));
  [capA, capB].forEach(g => g.firstChild.setAttribute('height', 70));
  capA.firstChild.setAttribute('y', 820 - 35); capB.firstChild.setAttribute('y', 916 - 35);
  S.text('not an oversight anyone could avoid', { x: 960, y: 821, size: 32, weight: 600, anchor: 'middle', color: 'muted' }, capA);
  S.text('what silicon can and cannot do', { x: 960, y: 917, size: 32, weight: 600, anchor: 'middle', color: 'muted' }, capB);
  S.set([capA, capB], { autoAlpha: 0 }, 0);
  S.add(fx.in(capA, { from: 'up', d: 0.5, dist: 12 }), 'b4~oversight-0.2');
  S.add(fx.in(capB, { from: 'up', d: 0.5, dist: 12 }), 'b4~what-0.1');
});
