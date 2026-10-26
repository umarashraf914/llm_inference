/* ch05_s01 · one operation, deliberately tiny (fig 61)
   b1: the callback: one token, 30 ms on the stopwatch; the suspect's tag 'arithmetic: 0.1 ms?'; the tally.
   b2: the arithmetic bench, one act on two numbers at a time: 0.5 × 0.13 = 0.065, then 1.2 + 0.065 = 1.265;
       the tally ticks 1, 2. Two ghosts it is not: a line of code, a step of reasoning.
   b3: its name: 'FLoating-point OPeration' collapses into FLOP; '.13' is the fractional part;
       1 metre measures distance, 1 FLOP measures work.
   b4: FLOP shrinks to a corner, the camera pushes in on the tally, and one token's count spins up to
       140,000,000,000. */
V.scene('ch05_s01', S => {
  const { fx } = S;

  // ================================================================ b1: one token, 30 ms, a suspect
  const intro = S.g();                           // faded out as a whole at b2
  const PY = 430;                                // the pill and the dial share a centre line
  const tok = ch05Token(S, { x: 640, y: PY, size: 40 }, intro);
  const sw = ch05Stopwatch(S, { x: 1250, y: PY, size: 290 }, intro);
  const lx1 = tok.r + 24, lx2 = sw.cx - sw.rad - 28;
  const link = S.arrow({ x1: lx1, y1: PY, x2: lx2, y2: PY, color: 'faint', sw: 3, head: 14 }, intro);
  S.add(tok.pop({ d: 0.6 }), 'b1-0.3');
  S.add(sw.in({ d: 0.7 }), 'b1-0.15');
  S.add(fx.drawArrow(link, { d: 0.5 }), 'b1+0.25');

  // the suspect's tag hangs from the link on a string: 'arithmetic?' → 'arithmetic: 0.1 ms?'
  const AX = (lx1 + lx2) / 2;
  const TG = { y: 742, h: 72, size: 38 };
  const tagL = AX - 34;                          // the punched hole sits under the string, at AX
  const txt0 = tagL + 66;
  const wA = S.measure('arithmetic', { size: TG.size, weight: 600 });
  const wB = S.measure(': 0.1 ms', { size: TG.size, weight: 600 });
  const wQ = S.measure('?', { size: TG.size, weight: 650 });
  const tw1 = 66 + wA + wQ + 34, tw2 = tw1 + wB;
  const string = S.line({ x1: AX, y1: PY + 18, x2: AX, y2: TG.y - 8, stroke: 'compute', sw: 2, strokeOpacity: 0.65, dash: '5 7' }, intro);
  const tag = S.g(null, intro);
  const tagRects = [
    S.rect({ x: tagL, y: TG.y - TG.h / 2, w: tw1, h: TG.h, r: 18, fill: '#0c1326', filter: 'url(#shadow)' }, tag),
    S.rect({ x: tagL, y: TG.y - TG.h / 2, w: tw1, h: TG.h, r: 18, fill: 'url(#card-compute)', stroke: 'compute', strokeOpacity: 0.75, sw: 2 }, tag),
  ];
  S.circle({ x: AX, y: TG.y, r: 8, fill: '#060a14', stroke: 'compute', strokeOpacity: 0.75, sw: 2 }, tag);
  S.text('arithmetic', { x: txt0, y: TG.y + 1, size: TG.size, weight: 600, color: 'compute' }, tag);
  const tB = S.text(': 0.1 ms', { x: txt0 + wA, y: TG.y + 1, size: TG.size, weight: 600, color: 'ink' }, tag);
  const qHold = S.g(null, tag);                  // slides right as the tag extends
  const q = S.text('?', { x: txt0 + wA, y: TG.y + 1, size: TG.size, weight: 650, color: 'compute' }, qHold);
  // ': 0.1 ms' types on just behind the '?' as it slides right, both from one progress value (seek-safe):
  // each character shows once the room opened for it is there
  const B = ': 0.1 ms', bCut = [...B].map((_, i) => S.measure(B.slice(0, i + 1), { size: TG.size, weight: 600 }));
  const ext = { k: 0 };
  const extend = () => {
    const k = ext.k, room = wB * k;
    tagRects.forEach(r => r.setAttribute('width', (tw1 + room).toFixed(2)));
    qHold.setAttribute('transform', `translate(${room.toFixed(2)},0)`);
    const n = bCut.filter(w => w <= room + 1).length;
    tB.textContent = B.slice(0, n);
    tB.style.visibility = n > 0 ? 'visible' : 'hidden';
  };
  extend();
  // the string lowers (y2 grows, keeping its dash pattern; DrawSVG would overwrite the dashes)
  S.set(string, { autoAlpha: 0 }, 0);
  S.add(gsap.timeline().set(string, { autoAlpha: 1 })
    .fromTo(string, { attr: { y2: PY + 18 } }, { attr: { y2: TG.y - 8 }, duration: 0.4, ease: 'power1.out', immediateRender: false }), 'b1~the-0.1');
  S.add(fx.in(tag, { from: 'down', dist: 46, d: 0.6, ease: 'back.out(1.5)' }), 'b1~the+0.05');
  // 'a tenth of a millisecond': the tag extends
  S.add(gsap.fromTo(ext, { k: 0 }, { k: 1, duration: 0.6, ease: 'power3.inOut', immediateRender: false, onStart: extend, onUpdate: extend, onReverseComplete: extend }), 'b1~tenth-0.15');
  // 'Time to check': the question mark pulses
  S.add(gsap.fromTo(q, { scale: 1, transformOrigin: '50% 60%' },
    { scale: 1.5, duration: 0.2, yoyo: true, repeat: 3, ease: 'sine.inOut', transformOrigin: '50% 60%', immediateRender: false }), 'b1~Time');

  // ---------------------------------------------------------------- the tally, bottom right (stays to the end)
  const TX = 1600, TY = 878, TW0 = 300, TH = 150, NUM = { size: 62, family: 'mono', weight: 600 };
  const tally = S.g();
  const tRects = [
    S.rect({ x: TX - TW0 / 2, y: TY - TH / 2, w: TW0, h: TH, r: 22, fill: '#0c1326', filter: 'url(#shadow)' }, tally),
    S.rect({ x: TX - TW0 / 2, y: TY - TH / 2, w: TW0, h: TH, r: 22, fill: 'url(#card-compute)', stroke: 'compute', strokeOpacity: 0.5, sw: 2 }, tally),
  ];
  const tRing = S.rect({ x: TX - TW0 / 2 - 6, y: TY - TH / 2 - 6, w: TW0 + 12, h: TH + 12, r: 26, stroke: 'compute', sw: 3, filter: 'url(#glow-compute)' }, tally);
  tRing.setAttribute('data-audit', 'ignore');
  S.set(tRing, { opacity: 0 }, 0);
  S.text('operations', { x: TX, y: TY - 40, size: 28, color: 'muted', weight: 550, anchor: 'middle' }, tally);
  const numG = S.g(null, tally);
  const num = S.text('0', { x: TX, y: TY + 24, size: NUM.size, family: 'mono', weight: 600, anchor: 'middle', color: 'ink' }, numG);
  // the card widens with the number it holds (b4); a pure function of the value shown
  const tallyW = s => Math.max(TW0, S.measure(s, NUM) + 80);
  const setTally = v => {
    const s = S.fmt.int(v), w = tallyW(s);
    num.textContent = s;
    tRects.forEach(r => { r.setAttribute('x', TX - w / 2); r.setAttribute('width', w); });
    tRing.setAttribute('x', TX - w / 2 - 6); tRing.setAttribute('width', w + 12);
  };
  // value from → to; log: interpolate the exponent, so the digits grow steadily (a spin-up)
  const tallyTo = (from, to, d, o = {}) => {
    const p = { k: 0 }, e = gsap.parseEase(o.ease || 'none');
    const show = () => {
      const k = e(p.k);
      setTally(o.log ? Math.pow(10, Math.log10(from) + (Math.log10(to) - Math.log10(from)) * k) : from + (to - from) * k);
    };
    return gsap.fromTo(p, { k: 0 }, { k: 1, duration: d, ease: 'none', immediateRender: false, onStart: show, onUpdate: show, onReverseComplete: show });
  };
  const ringFlash = (hold = 0.5) => gsap.timeline()
    .fromTo(tRing, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out', immediateRender: false }, 0)
    .fromTo(tRing, { opacity: 1 }, { opacity: 0, duration: 0.5, ease: 'power2.in', immediateRender: false }, 0.25 + hold);
  S.add(fx.in(tally, { from: 'up', d: 0.6 }), 'b1~counting-0.2');

  // ================================================================ b2: the arithmetic bench
  S.add(fx.out(intro, { d: 0.45 }), 'b2-0.15');
  const BX = 1060, BCY = 540, R1 = 440, R2 = 640, CW = 230, CH = 140;
  const COL = [BX - 340, BX, BX + 340], SIGN = [BX - 170, BX + 170];
  const head = S.text([{ t: 'one operation ' }, { t: '= ', c: 'muted' }, { t: 'one piece of arithmetic' }],
    { x: BX, y: 160, size: 52, weight: 700, family: 'display', anchor: 'middle' });
  S.add(ch05Wipe(S, head, { d: 1.1 }), 'b2+0.15');

  const bench = S.g();                           // the whole bench; dimmed and moved up in b3
  const numCard = (x, y, value, tone, label) => {
    const outer = S.g(null, bench);              // entrances, dims
    const body = S.g(null, outer);               // nudges, pulses
    S.rect({ x: x - CW / 2, y: y - CH / 2, w: CW, h: CH, r: 18, fill: '#0c1326', filter: 'url(#shadow)' }, body);
    const bg = S.rect({ x: x - CW / 2, y: y - CH / 2, w: CW, h: CH, r: 18, fill: `url(#card-${tone})`, stroke: tone, strokeOpacity: 0.6, sw: 2 }, body);
    const lab = label ? S.text(label, { x, y: y - 38, size: 30, color: 'muted', weight: 550, anchor: 'middle' }, body) : null;
    const val = S.text(value, { x, y: label ? y + 18 : y + 2, size: 58, family: 'mono', weight: 600, anchor: 'middle', color: 'ink' }, body);
    return Object.assign(outer, { body, bg, lab, val, cx: x, cy: y, value });
  };
  const opSign = (x, y, glyph) => {
    const g = S.g(null, bench);
    S.circle({ x, y, r: 34, fill: '#0c1326' }, g);
    S.circle({ x, y, r: 34, fill: 'url(#card-compute)', stroke: 'compute', strokeOpacity: 0.85, sw: 2.5 }, g);
    S.text(glyph, { x, y: y + 2, size: 48, weight: 600, anchor: 'middle', color: 'compute' }, g);
    return g;
  };
  const eqSign = y => S.text('=', { x: SIGN[1], y: y + 2, size: 58, weight: 500, anchor: 'middle', color: 'muted' }, bench);

  // row 1: input × weight = 0.065
  const cIn = numCard(COL[0], R1, '0.5', 'struct', 'input');
  const cW = numCard(COL[1], R1, '0.13', 'struct', 'weight');
  const sMul = opSign(SIGN[0], R1, '×');
  const eq1 = eqSign(R1);
  const cP = numCard(COL[2], R1, '0.065', 'compute');
  // row 2: 1.2 + 0.065 = 1.265
  const cT = numCard(COL[0], R2, '1.2', 'struct');
  const sAdd = opSign(SIGN[0], R2, '+');
  const cP2 = numCard(COL[1], R2, '0.065', 'compute');
  const eq2 = eqSign(R2);
  const cS = numCard(COL[2], R2, '1.265', 'compute');
  [cP2].forEach(c => S.set(c, { autoAlpha: 0 }, 0));
  // the copy of 0.065 that carries the product down into the add (a moving picture: not audited)
  const carry = numCard(COL[2], R1, '0.065', 'compute');
  carry.setAttribute('data-audit', 'ignore');
  S.set(carry, { autoAlpha: 0 }, 0);

  // a seek-safe move along a path, written to the element's transform attribute
  const along = (el, d, dur, o = {}) => {
    const path = S.path({ d, stroke: 'none' }, S.layers.back);
    const L = path.getTotalLength(), p0 = path.getPointAtLength(0), p = { k: 0 }, e = gsap.parseEase(o.ease || 'power2.inOut');
    const put = () => {
      const k = e(p.k), pt = path.getPointAtLength(L * k);
      const s = o.scale ? o.scale(k) : 1;
      el.setAttribute('transform', `translate(${(pt.x - (o.rel ? p0.x : 0)).toFixed(2)},${(pt.y - (o.rel ? p0.y : 0)).toFixed(2)}) scale(${s.toFixed(3)})`);
    };
    return gsap.fromTo(p, { k: 0 }, { k: 1, duration: dur, ease: 'none', immediateRender: false, onStart: put, onUpdate: put, onReverseComplete: put });
  };
  // '+1': an amber chip flies from a result card into the tally, which ticks
  let ticks = 0;
  const plusOne = (x0, y0, cx, cy, at, dur = 0.45) => {
    const chip = S.g(null, S.layers.front);
    chip.setAttribute('data-audit', 'ignore');
    S.pill('+1', { x: 0, y: 0, h: 54, size: 34, tone: 'compute', style: 'solid', mono: true }, chip);
    S.set(chip, { autoAlpha: 0 }, 0);
    const fly = gsap.timeline();
    fly.fromTo(chip, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, immediateRender: false }, 0);
    fly.add(along(chip, `M${x0},${y0} Q${cx},${cy} ${TX},${TY + 4}`, dur, { ease: 'power2.in', scale: k => (k < 0.15 ? 0.5 + k / 0.15 * 0.5 : k > 0.75 ? 1 - (k - 0.75) / 0.25 * 0.7 : 1) }), 0);
    fly.fromTo(chip, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.1, immediateRender: false }, dur - 0.05);
    S.add(fly, at);
    const n = ticks++;
    const tAt = S.t(at) + dur - 0.02;
    S.add(tallyTo(n, n + 1, 0.02), tAt);
    S.add(gsap.fromTo(numG, { scale: 1.35, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, ease: 'back.out(2.2)', immediateRender: false, transformOrigin: '50% 50%' }), tAt);
    S.add(gsap.fromTo(num, { attr: { fill: S.tone('compute') } }, { attr: { fill: S.tone('ink') }, duration: 0.8, ease: 'power1.in', immediateRender: false }), tAt);
  };

  // 'One multiplication': the two blue numbers slide together through the ×, and the product appears
  S.add(fx.in(cIn, { from: 'right', dist: 90, d: 0.65 }), 'b2~One multiplication-0.4');
  S.add(fx.in(cW, { from: 'left', dist: 90, d: 0.65 }), 'b2~One multiplication-0.4');
  S.add(fx.pop(sMul, { d: 0.45 }), 'b2~multiplication-0.15');
  // the two cards press into the × and the product comes out; its +1 lands before the add begins
  S.add(gsap.fromTo(cIn.body, { x: 0 }, { x: 18, duration: 0.16, yoyo: true, repeat: 1, ease: 'power2.inOut', immediateRender: false }), 'b2~multiplication');
  S.add(gsap.fromTo(cW.body, { x: 0 }, { x: -18, duration: 0.16, yoyo: true, repeat: 1, ease: 'power2.inOut', immediateRender: false }), 'b2~multiplication');
  S.add(fx.in(eq1, { from: 'fade', d: 0.3 }), 'b2~multiplication+0.2');
  S.add(fx.pop(cP, { d: 0.55, from: 0.5 }), 'b2~multiplication+0.25');
  plusOne(COL[2] + CW / 2 + 52, R1, 1790, R1 + 140, 'b2~multiplication+0.32');

  // 'one addition': a blue 1.2 takes in the 0.065 through the +, giving 1.265
  S.add(fx.in(cT, { from: 'right', dist: 90, d: 0.6 }), 'b2~one addition-0.25');
  S.add(fx.pop(sAdd, { d: 0.45 }), 'b2~addition-0.2');
  const carryT = gsap.timeline();
  carryT.set(carry, { autoAlpha: 1 }, 0);
  carryT.add(along(carry.body, `M${COL[2]},${R1} Q${COL[2] - 20},${R2 + 10} ${COL[1]},${R2}`, 0.55, { rel: true, ease: 'power2.inOut' }), 0);
  carryT.set(carry, { autoAlpha: 0 }, 0.56);
  carryT.set(cP2, { autoAlpha: 1 }, 0.56);
  S.add(carryT, 'b2~addition-0.1');
  S.add(fx.in(eq2, { from: 'fade', d: 0.3 }), 'b2~addition+0.4');
  S.add(fx.pop(cS, { d: 0.55, from: 0.5 }), 'b2~addition+0.45');
  plusOne(COL[2] + CW / 2 + 52, R2, 1740, R2 + 60, 'b2~addition+0.5');
  // 'on two numbers': each act takes exactly two inputs
  const operands = [cIn, cW, cT, cP2];
  S.add(gsap.fromTo(operands.map(c => c.bg), { attr: { 'stroke-opacity': 0.6, 'stroke-width': 2 } },
    { attr: { 'stroke-opacity': 1, 'stroke-width': 4 }, duration: 0.3, yoyo: true, repeat: 1, repeatDelay: 0.25, ease: 'sine.inOut', immediateRender: false }), 'b2~numbers-0.05');

  // 'Not a line of code, nor a step of reasoning': one ghost at a time, struck through
  const ghost = (icon, label) => {
    const g = S.g();
    const X0 = 108, GW = 420, GY = BCY, GH = 116;
    S.rect({ x: X0, y: GY - GH / 2, w: GW, h: GH, r: 20, fill: '#ffffff', fillOpacity: 0.03, stroke: '#ffffff', strokeOpacity: 0.3, sw: 2, dash: '10 8' }, g);
    const inner = S.g(null, g);
    S.icon(icon, { x: X0 + 58, y: GY, size: 54, color: 'muted' }, inner);
    const t = S.text(label, { x: X0 + 102, y: GY, size: 32, color: 'muted', weight: 550 }, inner);
    const tw = S.measure(label, { size: 32, weight: 550 });
    const ln = S.line({ x1: X0 + 22, y1: GY + 2, x2: X0 + 102 + tw + 14, y2: GY + 2, stroke: 'ink', sw: 4, strokeOpacity: 0.85 }, inner);
    ln.__strike = true;                          // the audit allows a strike through its own label
    g.t = t; g.ln = ln;
    return g;
  };
  const g1 = ghost('ph:code-duotone', 'a line of code');
  const g2 = ghost('ph:lightbulb-duotone', 'a step of reasoning');
  [[g1, 'b2~Not', 'b2~code-0.1', 'b2~nor-0.05'], [g2, 'b2~step-0.25', 'b2~reasoning+0.05', 'b2>+0.05']].forEach(([g, a, b, c]) => {
    S.add(fx.in(g, { from: 'right', dist: 50, d: 0.45 }), a);
    S.add(fx.draw(g.ln, { d: 0.3, ease: 'power2.out' }), b);
    S.set(g.ln, { autoAlpha: 0 }, 0);
    S.add(fx.out(g, { to: 'down', dist: 16, d: 0.3 }), c);
  });

  // ================================================================ b3: its proper name, FLOP
  S.add(fx.out(head, { d: 0.4 }), 'b3-0.1');
  const benchParts = [cIn, cW, sMul, eq1, cP, cT, sAdd, cP2, eq2, cS];
  S.add(fx.dim(benchParts, { to: 0.4, d: 0.6 }), 'b3');
  const BS = 0.8, BTX = 960, BTY = 300;           // the bench eases up into the heading's space, re-centred
  S.add(fx.xform(bench, { x: BTX - BX, y: BTY - BCY, s: BS, ox: BX, oy: BCY }, { d: 1.1, ease: 'power3.inOut' }), 'b3');

  // 'FLoating-point OPeration' writes on; the amber F, L, O, P slide together into FLOP
  const flopG = S.g(null, S.hud);                 // in the HUD: it stays put when the camera moves in b4
  const phrase = S.g(null, flopG);
  const PS = 68, FS = 184, FY = 650, DISP = { weight: 700, family: 'display', case: 'keep' };   // the letters spell FLOP: as written
  const pieces = [['F', 1], ['L', 1], ['oating-point', 0, true], ['O', 1], ['P', 1], ['eration', 0]];
  const pw = pieces.map(([t, , sp]) => S.measure(t, { size: PS, ...DISP }) + (sp ? S.measure(' ', { size: PS, ...DISP }) : 0));
  const lw = ['F', 'L', 'O', 'P'].map(t => S.measure(t, { size: FS, ...DISP }));
  const WF = lw.reduce((a, b) => a + b, 0), FL = 960 - WF / 2;   // FLOP's left edge, at full size
  const fxs = lw.map((_, i) => FL + lw.slice(0, i).reduce((a, b) => a + b, 0));
  let px = 960 - pw.reduce((a, b) => a + b, 0) / 2, k = 0;
  const letters = [], inkPieces = [];
  pieces.forEach(([t, amber], i) => {
    if (amber) {
      const hold = S.g(null, phrase);
      hold.letter = S.text(t, { x: fxs[k], y: FY, size: FS, ...DISP, color: 'compute' }, hold);
      S.xset(hold, { x: px - fxs[k], y: 0, s: PS / FS, ox: fxs[k], oy: FY });
      letters.push(hold); k++;
    } else {
      inkPieces.push(S.text(t, { x: px, y: FY, size: PS, ...DISP, color: 'ink' }, phrase));
    }
    px += pw[i];
  });
  S.add(ch05Wipe(S, phrase, { d: 1.1, ease: 'power1.inOut' }), 'b3~floating-0.1');
  S.add(fx.out(inkPieces, { d: 0.25, stagger: 0 }), 'b3~flop-0.35');
  // one shared progress, no stagger: each letter's right edge then tracks the next letter's left edge exactly
  letters.forEach(h => S.add(fx.xform(h, { x: 0, y: 0, s: 1 }, { d: 0.85, ease: 'power3.inOut' }), 'b3~flop-0.1'));

  // 'a fractional part, like the weights': the weight card brightens and its .13 is underlined
  const vW = S.measure('0.13', { size: 58, family: 'mono', weight: 600 }), v0 = S.measure('0', { size: 58, family: 'mono', weight: 600 });
  const ul = S.line({ x1: COL[1] - vW / 2 + v0 + 2, y1: R1 + 56, x2: COL[1] + vW / 2, y2: R1 + 56, stroke: 'compute', sw: 5 }, cW.body);
  S.set(ul, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(cW, { opacity: 0.4 }, { opacity: 1, duration: 0.4, ease: 'power2.out', immediateRender: false }), 'b3~fractional-0.25');
  S.add(fx.draw(ul, { d: 0.45, ease: 'power2.out' }), 'b3~fractional+0.2');
  S.add(fx.pulse(cW.body, { scale: 1.06, d: 0.5 }), 'b3~weights-0.1');
  S.add(gsap.fromTo(cW, { opacity: 1 }, { opacity: 0.4, duration: 0.5, ease: 'power2.inOut', immediateRender: false }), 'b3~Counting-0.2');
  // 'Counting them measures a job': the tally lights; '1 FLOP: work'
  S.add(ringFlash(0.7), 'b3~Counting-0.1');
  const workL = S.text('1 FLOP: work', { x: 960, y: FY + 140, size: 32, color: 'muted', weight: 550, anchor: 'middle' }, flopG);
  S.add(fx.in(workL, { from: 'up', d: 0.5 }), 'b3~job-0.25');

  // 'the way metres measure distance': a ruler joins on the left; FLOP makes room
  const DX = 240, RX = 960 - 340, RW = 380, RH = 76;
  const ruler = S.g(null, S.hud);
  const rulerBody = S.g(null, ruler);
  S.rect({ x: RX - RW / 2, y: FY - RH / 2, w: RW, h: RH, r: 8, fill: '#0c1326', filter: 'url(#shadow)' }, rulerBody);
  S.rect({ x: RX - RW / 2, y: FY - RH / 2, w: RW, h: RH, r: 8, fill: 'url(#card-neutral)', stroke: '#ffffff', strokeOpacity: 0.4, sw: 2 }, rulerBody);
  const rTicks = [];
  for (let i = 0; i <= 20; i++) {
    const x = RX - RW / 2 + 18 + i * (RW - 36) / 20, len = i % 10 === 0 ? 34 : i % 5 === 0 ? 24 : 14;
    rTicks.push(S.line({ x1: x, y1: FY - RH / 2 + 2, x2: x, y2: FY - RH / 2 + 2 + len, stroke: 'muted', sw: i % 5 === 0 ? 2.5 : 1.8 }, rulerBody));
  }
  rTicks.forEach(t => S.set(t, { autoAlpha: 0 }, 0));
  const metreL = S.text('1 metre: distance', { x: RX, y: FY + 140, size: 32, color: 'muted', weight: 550, anchor: 'middle' }, ruler);
  S.add(fx.xform(flopG, { x: DX, ox: FL, oy: FY }, { d: 0.8, ease: 'power3.inOut' }), 'b3~metres-0.3');
  S.add(fx.in(rulerBody, { from: 'right', dist: 60, d: 0.7 }), 'b3~metres-0.15');
  S.add(fx.draw(rTicks, { d: 0.25, stagger: 0.015, ease: 'power1.out' }), 'b3~metres-0.05');
  S.add(fx.in(metreL, { from: 'up', d: 0.5 }), 'b3~distance-0.35');

  // ================================================================ b4: deliberately tiny; one token's count
  S.add(fx.out([ruler, workL], { d: 0.4 }), 'b4-0.25');
  // the bench has done its job: it clears before FLOP crosses its corner and the camera leaves it
  S.add(fx.out(benchParts, { d: 0.45, stagger: 0.02 }), 'b4-0.2');
  // FLOP shrinks into the top-left corner and stays: the unit the rest of the chapter counts in
  const FS2 = 0.3;
  S.add(fx.xform(flopG, { x: 112 - FL, y: 176 - FY, s: FS2 }, { d: 1.0, ease: 'power3.inOut' }), 'b4~flop-0.1');
  // the camera pushes in on the tally reading 2
  const CS = 1.65, CY = TY - 40;
  S.add(fx.cam({ x: TX, y: CY, scale: CS, d: 1.6, ease: 'power2.inOut' }), 'b4~deliberately-0.2');
  // 'one token': the pill returns, top right, and settles just above the tally
  const cardTop = 540 + (TY - TH / 2 - CY) * CS;   // the tally card's top edge on screen, after the push-in
  const tok2 = ch05Token(S, { x: 1560, y: 230, size: 40 }, S.hud);
  S.add(tok2.in({ from: 'down', dist: 30, d: 0.5 }), 'b4~one-0.25');
  S.add(tok2.moveTo([960, cardTop - 30 - tok2.h / 2], { d: 0.8, ease: 'power3.inOut' }), 'b4~one+0.3');
  // 'a hundred and forty billion': the tally spins up from 2 (the card widens to hold it)
  S.add(tallyTo(2, CH05.OPS_PER_TOKEN, 1.45, { log: true, ease: 'power1.inOut' }), 'b4~hundred-0.15');
  S.add(gsap.fromTo(num, { attr: { fill: S.tone('ink') } }, { attr: { fill: S.tone('compute') }, duration: 0.3, yoyo: true, repeat: 1, repeatDelay: 0.4, immediateRender: false }), 'b4~billion-0.1');
  // 'of exactly these': FLOP in the corner hops letter by letter, and the tally lights
  S.add(gsap.fromTo(letters.map(h => h.letter), { y: 0 },
    { y: -40, duration: 0.2, yoyo: true, repeat: 1, stagger: 0.07, ease: 'sine.inOut', immediateRender: false }), 'b4~exactly-0.1');
  S.add(ringFlash(0.6), 'b4~exactly');
});
