/* ch00_s03 · two numbers, and a wall (cold open, scene 3 of 3)
   One continuous shot, no camera. Opens on s02's last frame: the 30 ms bar. It eases down 160 px to free the
   upper stage for a promise in three facts: the stopwatch readout '≈ 30 ms per token' (its label lifts off the
   bar and flies up-left into it), the model's size, and a chip spec sheet whose two marked lines resolve into
   'operations per second: ?' (amber) and 'bytes per second: ?' (coral). Coral and blue threads tie memory and
   the model to the 30 ms; the amber line gets none. Fans of other models and chips riffle: any model, any chip.
   Then everything clears, the grey 99% breaks into 28 pieces that restack (same area, +3%) into a coral wall,
   a token runs into it and stops dead, and the film's title writes on: The Memory Wall.
   Built from the chapter's shared pieces (ch00_common.js): ch00Bar, ch00Stamp, ch00ModelFile, ch00Chip. */
V.scene('ch00_s03', {
  fadeIn: false,                                   // opens on s02's last frame; default fade-out (the film's first)
  build: S => {
    const { fx } = S;
    const B = CH00.BAR;
    const DY = 160;                                // the bar eases down 160 px: bar y 800-880
    const clamp = q => Math.max(0, Math.min(1, q));
    const lerp = (a, b, q) => a + (b - a) * q;
    const easeIO = q => (q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2);
    const ease2IO = q => (q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2);
    const ease3o = q => 1 - Math.pow(1 - q, 3);
    const backO = (q, s = 1.6) => 1 + (s + 1) * Math.pow(q - 1, 3) + s * Math.pow(q - 1, 2);
    const f2 = v => (+v).toFixed(2);
    // hidden from the very first frame (a zero-time S.set alone does not render when seeked to 0)
    const hide = els => { gsap.set(els, { autoAlpha: 0 }); S.set(els, { autoAlpha: 0 }, 0); };
    const fade = (els, from, to, d, at, ease = 'power1.inOut') =>
      S.add(gsap.fromTo(els, { autoAlpha: from }, { autoAlpha: to, duration: d, ease, immediateRender: false }), at);
    const rgb = c => { const n = parseInt(S.tone(c).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const GREY = rgb('muted'), CORAL = rgb('bytes');
    const mixC = (a, b, w) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * w)).join(',')})`;

    // ---------------------------------------------------------------- numbers, checked
    // the wall: 14 courses of two 110 x 40 bricks = 28 bricks, 220 x 560 px (x 1300-1520, y 320-880);
    // area 123,200 px², the grey strip's 1,495 x 80 = 119,600 px² (+3%), so the restack does not exaggerate
    const NP = 28, COURSES = 14, BW = 110, BH = 40;
    const WALL = { x0: 1300, x1: 1520, top: 320, floor: 880 };
    const xs = B.x0 + B.sliverMs * B.pxPerMs;                  // 215: the sliver's right edge
    const PW = (B.x1 - xs) / NP;                               // 53.39 px per piece
    if (COURSES * 2 !== NP || WALL.x1 - WALL.x0 !== 2 * BW || WALL.floor - WALL.top !== COURSES * BH || B.y + B.h + DY !== WALL.floor)
      S.warn('ch00_s03: wall geometry does not match the storyboard');
    const areaRatio = (2 * BW * COURSES * BH) / ((B.x1 - xs) * B.h);
    if (Math.abs(areaRatio - 1.03) > 0.005) S.warn(`ch00_s03: wall/strip area ratio ${areaRatio.toFixed(3)}, expected 1.03`);

    // ---------------------------------------------------------------- the floor (drawn in b3), behind everything
    const floor = S.line({ x1: 160, y1: WALL.floor, x2: 1760, y2: WALL.floor, stroke: 'muted', sw: 2, strokeOpacity: 0.6 }, S.layers.back);

    // ---------------------------------------------------------------- the bar, exactly as s02 left it
    const bar = ch00Bar(S, {});
    // the '?' carries an opacity attribute (0.7); move and fade a holder, never the '?' itself
    const qHolder = S.g(null, bar);
    bar.insertBefore(qHolder, bar.q);
    qHolder.appendChild(bar.q);
    // the strip's 28 pieces (and later the wall) sit where the grey was: above it, under the outline
    const wallG = S.g(null, bar);
    bar.insertBefore(wallG, bar.outline);
    const LY0 = B.y;                                           // pieces live in the bar's own coordinates
    const pieces = Array.from({ length: NP }, (_, i) => {
      const r = S.rect({ x: xs + i * PW, y: LY0, w: PW, h: B.h, fill: 'muted', fillOpacity: 0.3 }, wallG);
      r.setAttribute('opacity', 0);
      return r;
    });
    // the sliver's soft amber bloom (b2 'calculates')
    const bloom = S.circle({ x: B.x0 + 2.5, y: B.y + B.h / 2 + DY, r: 70, fill: 'url(#pglow-compute)' }, S.layers.back);
    bloom.setAttribute('data-audit', 'ignore');
    hide(bloom);

    // ---------------------------------------------------------------- b1: the bar steps down; the stage clears above it
    const TB = S.t('b1~By') - 0.08;
    S.add(fx.xform(bar, { y: DY }, { d: 1.1, ease: 'power2.inOut' }), TB);
    fade([bar.pill, bar.inside], 1, 0, 0.4, TB);
    fade([bar.tag, bar.pointer], 1, 0.3, 0.5, TB);

    // the readout '≈ 30 ms' / 'per token': 72 px mono left-anchored at x 340, y 330; 'per token' 30 px at (340, 405)
    const RO = { x: 340, y: 330, size: 72, subY: 405, subSize: 30 };
    const wMono = S.measure('≈ 30 ms', { size: RO.size, weight: 600, family: 'mono' });
    const NX = RO.x + wMono / 2;
    const roG = S.g();                                         // readout, underline, pencil: they clear together in b3
    const stamp = ch00Stamp(S, { x: NX, y: RO.y, size: RO.size, sub: '' }, roG);
    const subHolder = S.g(null, roG);
    const sub = S.text('per token', { x: RO.x, y: RO.subY, size: RO.subSize, weight: 500, color: 'muted' }, subHolder);
    // where each half of the bar's label '≈ 30 ms per token' sits once the bar has moved (40 px, centred on 960)
    const LBL = { size: B.dimLabelSize, weight: 600 };
    const LY = B.dimLabelY + DY;
    const L0 = 960 - S.measure('≈ 30 ms per token', LBL) / 2;
    const wNum40 = S.measure('≈ 30 ms', LBL), wNumSp40 = S.measure('≈ 30 ms ', LBL), wSub40 = S.measure('per token', LBL);
    const wSub30 = S.measure('per token', { size: RO.subSize, weight: 500 });
    const subCx = RO.x + wSub30 / 2;
    // both halves start exactly on the label, at its size, then fly up-left and grow into the readout
    S.xset(stamp.numHolder, { x: L0 + wNum40 / 2 - NX, y: LY - RO.y, s: wNum40 / wMono, ox: NX, oy: RO.y });
    S.xset(subHolder, { x: L0 + wNumSp40 + wSub40 / 2 - subCx, y: LY - RO.subY, s: wSub40 / wSub30, ox: subCx, oy: RO.subY });
    hide([stamp, sub]);
    const TL = S.t('b1~thirty') - 0.15, DL = 1.05;
    fade(bar.dimLabel, 1, 0, 0.18, TL);
    fade([stamp, sub], 0, 1, 0.18, TL);
    fade(bar.dim, 1, 0, 0.4, TL);
    // it lifts off quickly (it crosses the bar in the first ~0.15 s) and glides into place
    S.add(fx.xform(stamp.numHolder, { x: 0, y: 0, s: 1 }, { d: DL, ease: 'power3.out' }), TL + 0.04);
    S.add(fx.xform(subHolder, { x: 0, y: 0, s: 1 }, { d: DL, ease: 'power3.out' }), TL + 0.1);
    S.add(gsap.fromTo(sub, { fill: S.tone('ink') }, { fill: S.tone('muted'), duration: DL, ease: 'power1.inOut', immediateRender: false }), TL + 0.1);

    // the stopwatch pops in beside it, its hand sweeping to 30 ms (half a turn at 60 ms per turn)
    const swG = S.g();
    const sw = libStopwatch(S, { x: 260, y: RO.y, size: 110, readout: 'none', span: 60 }, swG);
    const TW = TL + DL - 0.4;
    S.add(sw.in({ d: 0.5 }), TW);
    S.add(sw.run(0, 30, { d: 0.45, ease: 'power2.inOut' }), TW + 0.05);

    // 'yourself': a pencil draws a white underline beneath '≈ 30 ms'
    const UL = { x1: RO.x, x2: RO.x + wMono, y: 374 };
    const underline = S.line({ x1: UL.x1, y1: UL.y, x2: UL.x1, y2: UL.y, stroke: 'ink', sw: 3 }, roG);
    underline.setAttribute('opacity', 0);
    const pencilG = S.g(null, roG);
    pencilG.setAttribute('data-audit', 'ignore');
    const PEN = 46, TIP = PEN * (128 - 36) / 256;              // ph:pencil-simple: the tip sits at (36, 220) of 256
    S.icon('ph:pencil-simple-duotone', { x: 0, y: 0, size: PEN, color: 'ink' }, pencilG);
    pencilG.setAttribute('opacity', 0);
    const TU = S.t('b1~yourself') - 0.1, DU = 0.55;

    // 'model's size': the blue model file and its label, below the stopwatch
    const modelFanG = S.g();                                   // behind the model: other models (b2)
    const model = ch00ModelFile(S, { x: 260, y: 540, size: 96, label: 'model size', labelSize: 36 });
    S.add(fx.in(model.icon, { from: 'left', d: 0.6, dist: 30 }), 'b1~model-0.25');
    S.add(fx.in(model.labelEl, { from: 'left', d: 0.6, dist: 24 }), 'b1~model-0.12');

    // 'two numbers': the spec sheet slides in from the right; 'specification sheet': two of its lines brighten
    const chipFanG = S.g();                                    // behind the card: other chips (b2)
    const sheetG = S.g();
    const sheet = libSpecSheet(S, {
      x: 1000, y: 180, w: 640, h: 440, title: 'chip spec sheet', titleSize: 36, start: 'placeholder', rowStyle: 'inline', rowH: 50,
      rows: [null, { label: 'operations per second', value: '?', tone: 'compute' }, null, { label: 'bytes per second', value: '?', tone: 'bytes' }, null, null],
    }, sheetG);
    S.add(fx.in(sheet, { from: 'right', d: 0.8, dist: 90 }), 'b1~two-0.2');
    S.add(sheet.brighten([1, 3], { d: 0.45 }), 'b1~specification-0.1');

    // ---------------------------------------------------------------- b2: how fast it calculates; how fast memory delivers
    S.add(sheet.reveal(1), 'b2~calculates-0.2');
    S.add(sheet.glow(1, { part: 'row', d: 0.8 }), 'b2~calculates+0.3');
    S.add(gsap.fromTo(bloom, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), 'b2~calculates+0.3');
    S.add(sheet.reveal(3), 'b2~memory-0.2');
    // memory ties to the 30 ms: a coral thread from the line's left end to just right of the readout
    const threadG = S.g();
    const coral = S.path({ d: 'M1030,450 C900,450 800,330 660,330', stroke: 'bytes', sw: 3 }, threadG);
    const coralEnd = S.circle({ x: 660, y: 330, r: 5.5, fill: 'bytes' }, threadG);
    // and so does the model: a short blue thread straight up from the file to the stopwatch
    const blue = S.path({ d: 'M260,492 V388', stroke: 'struct', sw: 3 }, threadG);
    hide(coralEnd);
    S.add(fx.draw(coral, { d: 0.65, ease: 'power2.inOut' }), 'b2~memory+0.2');
    S.add(fx.pop(coralEnd, { d: 0.3 }), 'b2~memory+0.8');
    S.add(fx.draw(blue, { d: 0.4, ease: 'power2.inOut' }), 'b2~the model-0.1');
    const TFL = S.t('b2~the model') + 0.32;
    S.add(gsap.fromTo(stamp.num, { fill: S.tone('ink') }, { fill: S.tone('bytes'), duration: 0.22, yoyo: true, repeat: 1, repeatDelay: 0.2, ease: 'power2.out', immediateRender: false }), TFL);
    S.add(sw.flash({ tone: 'bytes', d: 0.64 }), TFL);

    // 'any model, on any chip': fans of other models (behind the file) and other chips (behind the card) riffle and settle
    const MF = { px: 260, py: 588 };                           // the fan's pivot: the model file's bottom centre
    // ph:file is an outline: give each file an opaque sheet so the fan reads as a deck, not a tangle of lines
    const sheetPath = (cx, cy, s) => {
      const P = (u, v) => `${f2(cx + (u - 128) * s / 256)},${f2(cy + (v - 128) * s / 256)}`;
      return `M${P(44, 28)}L${P(152, 28)}L${P(212, 88)}L${P(212, 228)}L${P(44, 228)}Z`;
    };
    const SHEET_FILL = '#0c1429';
    const modelFan = [{ s: 70, a: -15 }, { s: 100, a: -30 }, { s: 132, a: -45 }].reverse().map(m => {
      const g = S.g(null, modelFanG);
      const cy = MF.py - m.s / 2 + m.s * 0.1;                  // the glyph's bottom (232 of 256) sits on the pivot
      S.path({ d: sheetPath(MF.px, cy, m.s), fill: SHEET_FILL }, g);
      S.icon('ph:file-duotone', { x: MF.px, y: cy, size: m.s, color: 'struct', opacity: 0.5 }, g);
      g.setAttribute('opacity', 0);
      return { g, ...m };
    }).reverse();
    // the front file's own sheet, so the fan does not show through it (shown with the fan)
    const frontSheet = S.path({ d: sheetPath(260, 540, 96), fill: SHEET_FILL }, modelFanG);
    frontSheet.setAttribute('opacity', 0);
    const CF0 = 1556;                                          // where the chips hide, fully behind the card
    const chipFan = [{ s: 64, x: 1672, y: 268, r: -12 }, { s: 96, x: 1686, y: 400, r: 0 }, { s: 76, x: 1674, y: 536, r: 12 }].map(c => {
      const g = S.g(null, chipFanG);
      ch00Chip(S, { x: CF0, y: c.y, size: c.s, style: 'outline' }, g);
      g.setAttribute('opacity', 0);
      return { g, ...c };
    });
    const TFM = S.t('b2~any model') - 0.12, TFC = S.t('b2~any chip') - 0.12, RIF = 0.08, DRF = 0.55;

    // ---------------------------------------------------------------- b3: the ninety-nine percent has a name
    const TA = S.t('b3~And');
    fade([swG, roG, model, modelFanG, threadG, sheetG, chipFanG], 1, 0, 0.4, TA);
    fade([bar.tag, bar.pointer], 0.3, 0, 0.4, TA);
    S.add(fx.draw(floor, { d: 0.8, ease: 'power2.inOut' }), TA + 0.05);
    // the strip breaks into 28 pieces; right to left, they fly to the wall and stack, course by course
    const TBRK = S.t('b3~ninety') - 0.17;
    const CRACK = 0.1, SPREAD = 0.48, FD = 0.5;                // last piece lands by 'has'
    S.set(bar.rest, { autoAlpha: 0 }, TBRK);
    fade(bar.outline, 1, 0, 0.35, TBRK);
    const depT = j => TBRK + CRACK + j * SPREAD / (NP - 1);   // j-th to leave = piece NP-1-j
    const brick = j => {                                       // slot j: course j>>1 (0 = bottom), left or right brick
      const c = j >> 1, s = 1 - (j & 1);
      return { x: WALL.x0 + s * BW, y: WALL.floor - DY - (c + 1) * BH, c };   // in the bar's coordinates
    };
    if (depT(NP - 1) + FD > S.t('b3~has') + 0.02) S.warn('ch00_s03: the wall finishes after "has"');

    // the '?' rides up on the top course to (1410, 270)
    const Q0 = { x: B.q[0], y: B.q[1] };                       // its own (bar) coordinates
    const QF = { x: 1410, y: 270 - DY };

    // a token runs along the floor, past the sliver, and stops dead against the wall's left face
    const tokG = S.g();
    libToken(S, { text: '', x: 0, y: 0, w: 60, h: 40 }, tokG);
    tokG.setAttribute('opacity', 0);
    const TT0 = S.t('b3~has') - 0.05, TT1 = S.t('b4') - 0.3, TOK = { x0: -60, x1: WALL.x0 - 30 - 1, y: WALL.floor - 20 };
    const RAMP = 0.22, VMAX = 1 / (1 - RAMP / 2);             // speed ramps up over the first 22%, then holds
    const glide = q => (q < RAMP ? VMAX * q * q / (2 * RAMP) : VMAX * (RAMP / 2 + q - RAMP));
    const hit = S.circle({ x: WALL.x0, y: WALL.floor - 20, r: 46, fill: 'url(#pglow-bytes)' }, S.layers.back);
    hit.setAttribute('data-audit', 'ignore');
    hide(hit);
    S.add(gsap.fromTo(hit, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }), TT1);

    // ---------------------------------------------------------------- b4: The Memory Wall
    const TT = S.t('b4');
    fade(qHolder, 1, 0, 0.3, TT);
    const TITLE = { size: 110, weight: 700, family: 'display' };
    const words = ['The', 'Memory', 'Wall'];
    const tdefs = S.el('defs', null, S.main);
    const titleG = S.g();
    words.forEach((w, k) => {
      const x = 160 + (k ? S.measure(words.slice(0, k).join(' ') + ' ', TITLE) : 0);
      const ww = S.measure(w, TITLE);
      const cp = S.el('clipPath', { id: `ch00s03-title-${k}` }, tdefs);
      const cr = S.rect({ x: x - 12, y: 330 - 95, w: 0, h: 190, fill: '#fff' }, cp);
      const txt = S.text(w, { x, y: 330, ...TITLE, color: 'ink' }, titleG);
      txt.setAttribute('clip-path', `url(#ch00s03-title-${k})`);
      // one rule: the words start 0.15 s apart from 'The', each writes on in 0.3 s; complete 0.6 s after b4
      S.add(gsap.fromTo(cr, { attr: { width: 0 } }, { attr: { width: ww + 40 }, duration: 0.3, ease: 'power1.inOut' }), TT + 0.15 * k);
      hide(txt);                                               // clipped to nothing until then; hidden so the audit agrees
      S.set(txt, { autoAlpha: 1 }, TT + 0.15 * k);
    });
    const wTitle = S.measure('The Memory Wall', TITLE);
    if (160 + wTitle > WALL.x0 - 120) S.warn(`ch00_s03: title ends at ${Math.round(160 + wTitle)}, too close to the wall`);
    // 'wall': the bricks pulse coral once
    let gd = '';
    for (let j = 0; j < NP; j++) { const b = brick(j); gd += `M${b.x + 1.5},${b.y + DY + 1.5}h${BW - 3}v${BH - 3}h${-(BW - 3)}z`; }
    const wallGlow = S.path({ d: gd, fill: 'bytes', filter: 'url(#glow-bytes)' });
    wallGlow.setAttribute('data-audit', 'ignore');
    hide(wallGlow);
    S.add(gsap.fromTo(wallGlow, { autoAlpha: 0 }, { autoAlpha: 0.75, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), 'b4~wall-0.1');

    // ---------------------------------------------------------------- one pure function of time: pencil, fans, pieces, '?', token
    const render = t => {
      // b1: the underline and the pencil that draws it
      const pu = clamp((t - TU) / DU), eu = ease2IO(pu);
      const ux = UL.x1 + (UL.x2 - UL.x1) * eu;
      underline.setAttribute('x2', f2(ux));
      underline.setAttribute('opacity', t >= TU ? 1 : 0);
      const pa = t < TU ? clamp((t - (TU - 0.18)) / 0.18) : 1 - clamp((t - (TU + DU + 0.05)) / 0.25);
      pencilG.setAttribute('opacity', pa.toFixed(3));
      pencilG.setAttribute('transform', `translate(${f2(ux + TIP)},${f2(UL.y - TIP - 2)})`);

      // b2: the fans riffle out, one after another, and settle
      modelFan.forEach((m, k) => {
        const q = clamp((t - TFM - k * RIF) / DRF);
        m.g.setAttribute('opacity', clamp(q * 4).toFixed(3));
        m.g.setAttribute('transform', `rotate(${f2(m.a * backO(q))} ${MF.px} ${MF.py})`);
      });
      frontSheet.setAttribute('opacity', t >= TFM ? 1 : 0);
      chipFan.forEach((c, k) => {
        const q = clamp((t - TFC - k * RIF) / DRF), e = backO(q);
        c.g.setAttribute('opacity', (0.55 * clamp(q * 4)).toFixed(3));
        c.g.setAttribute('transform', `translate(${f2((c.x - CF0) * e)},0) rotate(${f2(c.r * e)} ${CF0} ${c.y})`);
      });

      // b3: the strip cracks into 28 pieces, which fly right to left into the wall
      const crack = clamp((t - TBRK) / CRACK);
      let courses = 0;                                         // departed bricks, as courses: the '?' stays above them
      pieces.forEach((p, i) => {
        if (t < TBRK) { p.setAttribute('opacity', 0); return; }
        const j = NP - 1 - i, b = brick(j);
        const q = clamp((t - depT(j)) / FD), e = easeIO(q);
        courses += clamp((t - depT(j)) / (0.6 * FD)) / 2;
        const g0 = 1.5 * crack;                               // the cracks open: 3 px gaps between pieces
        const w0 = PW - 2 * g0, h0 = B.h;
        const c0 = [xs + i * PW + PW / 2, LY0 + B.h / 2], c1 = [b.x + BW / 2, b.y + BH / 2];
        const k = [(c0[0] + c1[0]) / 2, Math.min(c0[1], c1[1]) - 110];   // thrown: up first, then down onto its course
        const u = 1 - e;
        const cx = u * u * c0[0] + 2 * u * e * k[0] + e * e * c1[0];
        const cy = u * u * c0[1] + 2 * u * e * k[1] + e * e * c1[1];
        const w = lerp(w0, BW - 3, e), h = lerp(h0, BH - 3, e);
        p.setAttribute('x', f2(cx - w / 2)); p.setAttribute('y', f2(cy - h / 2));
        p.setAttribute('width', f2(w)); p.setAttribute('height', f2(h));
        p.setAttribute('rx', f2(lerp(0, 3, e))); p.setAttribute('ry', f2(lerp(0, 3, e)));
        const warm = clamp((e - 0.1) / 0.9);                   // grey to coral as it rises
        p.setAttribute('fill', mixC(GREY, CORAL, warm));
        p.setAttribute('fill-opacity', lerp(0.3, 0.8 + 0.15 * b.c / (COURSES - 1), warm).toFixed(3));
        p.setAttribute('opacity', 1);
      });
      // the '?' rides the top of the rising wall
      const top = WALL.floor - DY - BH * courses;
      const qx = lerp(Q0.x, QF.x, easeIO(clamp((t - TBRK - 0.05) / 0.8)));
      const qy = Math.min(Q0.y, top - 50);
      qHolder.setAttribute('transform', t < TBRK ? '' : `translate(${f2(qx - Q0.x)},${f2(qy - Q0.y)})`);

      // the label in flight crosses the bar for a moment: exempt from the layout audit only then
      if (t > TL && t < TL + 0.45) roG.setAttribute('data-audit', 'ignore'); else roG.removeAttribute('data-audit');

      // the token: glides in from the left edge, stops dead at the wall, recoils 8 px
      const qt = clamp((t - TT0) / (TT1 - TT0));
      let tx = TOK.x0 + (TOK.x1 - TOK.x0) * glide(qt);
      if (t > TT1) tx -= 8 * Math.sin(Math.PI * clamp((t - TT1) / 0.32));
      tokG.setAttribute('opacity', t >= TT0 ? 1 : 0);
      tokG.setAttribute('transform', `translate(${f2(tx)},${TOK.y})`);
    };
    render(0);
    const clock = { t: 0 };
    S.add(gsap.fromTo(clock, { t: 0 }, {
      t: S.duration, duration: S.duration, ease: 'none', immediateRender: false,
      onUpdate: () => render(clock.t), onStart: () => render(clock.t), onReverseComplete: () => render(0),
    }), 0);
  },
});
