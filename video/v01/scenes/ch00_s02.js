/* ch00_s02 · a sliver of arithmetic (cold open, scene 2 of 3)
   One continuous shot, no camera. The stamp '≈ 30 ms / per token' left by s01 drops to become the label of
   a proportion bar drawn to scale (1,500 px = 30 ms, 50 px per ms). A chip counts its arithmetic for one
   token up to 140,000,000,000; the count collapses into an amber block that settles as a 5 px sliver
   (0.1 ms). A magnifier (×20) shows it as 100 px of a 1 ms window, then collapses back. Under 1%: the rest
   fills grey, 'something else'. Then 299 copies of the sliver stamp across the bar, accelerating, as a
   counter runs to ≈ 300, and fade again on "So what fills the rest?". The last frame is s03's first.
   Built from the chapter's shared pieces (ch00_common.js): ch00Stamp, ch00Bar, ch00Chip, ch00ModelFile. */
V.scene('ch00_s02', {
  fadeIn: false,                                   // opens on s01's last frame
  fadeOut: false,                                  // s03 opens on this scene's last frame
  build: S => {
    const { fx } = S;
    const B = CH00.BAR;
    const clamp = q => Math.max(0, Math.min(1, q));
    const lerp = (a, b, q) => a + (b - a) * q;
    const easeIO = q => (q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2);
    const ease3o = q => 1 - Math.pow(1 - q, 3);
    const f2 = v => (+v).toFixed(2);
    // hidden from the very first frame: a zero-time S.set does not render when the timeline is seeked to 0,
    // so set the state now as well as on the timeline (which restores it when seeking back)
    const hide = els => { gsap.set(els, { autoAlpha: 0 }); S.set(els, { autoAlpha: 0 }, 0); };

    // numbers, checked: 1,500 px / 30 ms = 50 px per ms; 0.1 ms = 5 px; the rest 1,495 px; 300 × 5 px = 1,500 px
    const PX_MS = (B.x1 - B.x0) / 30;
    const SLIVER = B.sliverMs * PX_MS;
    if (PX_MS !== B.pxPerMs || SLIVER !== 5) S.warn(`ch00_s02: bar scale ${PX_MS} px/ms, sliver ${SLIVER} px; storyboard says 50 and 5`);
    const NCOPY = 299;                             // copies stamped after the original sliver: 1 + 299 = 300 tokens
    if (B.x0 + SLIVER * (NCOPY + 1) !== B.x1) S.warn('ch00_s02: 300 slivers do not tile the bar exactly');

    // ---------------------------------------------------------------- the bar (every part hidden until it arrives)
    const bar = ch00Bar(S, { tagText: 'all the arithmetic' });
    // the '?' carries an opacity attribute (0.7) that s03 rebuilds; fade a holder, never the '?' itself
    const qHolder = S.g(null, bar);
    bar.insertBefore(qHolder, bar.q);
    qHolder.appendChild(bar.q);
    // the 299 stamped copies sit on the grey and under the outline
    const copiesG = S.g(null, bar);
    bar.insertBefore(copiesG, bar.outline);
    const [dimLine, dimTick0, dimTick1] = Array.from(bar.dim.children);
    const [ptrLine, ptrHead] = Array.from(bar.pointer.children);
    hide([bar.sliver, bar.rest, bar.inside, qHolder, bar.tag, bar.dimLabel, bar.outline, bar.dim, bar.pointer]);

    // ---------------------------------------------------------------- the stamp, exactly as s01 left it
    const stamp = ch00Stamp(S, {});
    stamp.setAttribute('data-audit', 'ignore');    // transient: it turns into the dimension label below
    const subHolder = S.g(null, stamp);
    subHolder.appendChild(stamp.sub);
    // where each half of '≈ 30 ms per token' sits once the label is set (40 px, centred on 960)
    const LBL = { size: 40, weight: 600 };
    const L0 = 960 - S.measure('≈ 30 ms per token', LBL) / 2;
    const wNum = S.measure('≈ 30 ms', LBL), wNumSp = S.measure('≈ 30 ms ', LBL), wSub = S.measure('per token', LBL);
    const wMono = S.measure('≈ 30 ms', { size: CH00.STAMP.size, weight: 600, family: 'mono' });
    const wSub0 = S.measure('per token', { size: CH00.STAMP.subSize, weight: 500 });

    // ---------------------------------------------------------------- b1: one token, a staggering amount of arithmetic
    const TM = S.t('b1~Making') - 0.15, DM = 1.05;
    S.add(fx.xform(stamp.numHolder, { x: L0 + wNum / 2 - CH00.STAMP.x, y: B.dimLabelY - CH00.STAMP.y, s: wNum / wMono, ox: CH00.STAMP.x, oy: CH00.STAMP.y }, { d: DM, ease: 'power3.inOut' }), TM);
    S.add(fx.xform(subHolder, { x: L0 + wNumSp + wSub / 2 - CH00.STAMP.x, y: B.dimLabelY - CH00.STAMP.subY, s: wSub / wSub0, ox: CH00.STAMP.x, oy: CH00.STAMP.subY }, { d: DM, ease: 'power3.inOut' }), TM + 0.05);
    S.add(gsap.fromTo(stamp.sub, { fill: S.tone('muted') }, { fill: S.tone('ink'), duration: DM, ease: 'power1.inOut' }), TM);
    // it lands as the bar's own label: a short cross-fade from the stamp's type to the label's
    const TX = TM + DM - 0.1;
    S.add(gsap.fromTo(stamp, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: 'power1.inOut', immediateRender: false }), TX);
    S.add(gsap.fromTo(bar.dimLabel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'power1.inOut', immediateRender: false }), TX);
    // the outline opens outward from the centre once the stamp has passed below it; the dimension line follows
    const TO = TM + 0.72;
    S.add(gsap.fromTo(bar.outline, { autoAlpha: 1, attr: { x: 960, width: 0 } },
      { autoAlpha: 1, attr: { x: B.x0, width: B.x1 - B.x0 }, duration: 1.0, ease: 'power3.inOut', immediateRender: false }), TO);
    S.set(bar.dim, { autoAlpha: 1 }, TO + 0.12);
    S.add(gsap.fromTo(dimLine, { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 1.0, ease: 'power3.inOut' }), TO + 0.12);
    S.add(gsap.fromTo([dimTick0, dimTick1], { scaleY: 0, transformOrigin: '50% 50%' }, { scaleY: 1, duration: 0.3, ease: 'back.out(2)', transformOrigin: '50% 50%' }), TO + 0.95);
    // what the 30 ms produce, as the outline reaches the right end
    S.add(bar.pill.pop({ d: 0.5 }), TO + 0.8);

    // the chip, and its count
    const chipHolder = S.g();
    const chip = ch00Chip(S, { x: 300, y: 380 }, chipHolder);
    S.add(chip.drawOn({ d: 0.9 }), 'b1~arithmetic-0.3');
    const CNT = { x: 380, y: 380, size: 64 };
    const cntG = S.g();
    const counter = S.text('0', { x: CNT.x, y: CNT.y, size: CNT.size, weight: 600, family: 'mono', color: 'compute' }, cntG);
    const glyphG = S.g(null, cntG);
    const glyph = S.text('×', { x: 0, y: CNT.y, size: 46, weight: 600, family: 'mono', color: 'compute', anchor: 'middle' }, glyphG);
    const opsLabel = S.text('multiplications and additions', { x: CNT.x, y: 452, size: 32, weight: 500, color: 'muted' });
    S.add(fx.in(cntG, { from: 'left', d: 0.5, dist: 24 }), 'b1~arithmetic+0.05');
    const TC0 = S.t('b1~hundred') - 0.15, TC1 = S.t('b1~billion') + 0.3;   // the count lands just after 'billion'
    const OPS = 140e9;
    const opsAt = t => {
      if (t < TC0) return 0;
      if (t >= TC1) return OPS;
      const q = 1 - Math.pow(1 - (t - TC0) / (TC1 - TC0), 2);           // digits pile up steadily, then settle
      return Math.floor(Math.pow(10, q * Math.log10(OPS)));
    };
    S.add(fx.in(opsLabel, { from: 'up', d: 0.6, dist: 16 }), 'b1~multiplications-0.2');
    S.add(fx.out(glyphG, { d: 0.3 }), 'b1~multiplications-0.2');   // the words take over from '× +'

    // ---------------------------------------------------------------- b2: a modern chip gets through it in 0.1 ms
    S.add(chip.busy({ d: 0.6 }), 'b2~data-0.1');
    // the count collapses into a small amber block, which drops into the bar's left end as the 5 px sliver
    const blk = S.rect({ x: 376, y: 346, w: 590, h: 124, r: 6, fill: 'compute' });
    blk.setAttribute('data-audit', 'ignore');
    hide(blk);
    const TG = S.t('b2~get') - 0.05;
    const col = gsap.timeline();
    // the digits and label turn into one amber block (quick), which then contracts to the left
    col.fromTo(blk, { autoAlpha: 0 }, { autoAlpha: 0.95, duration: 0.1, ease: 'power1.out' }, 0);
    col.fromTo(blk, { attr: { x: 376, y: 346, width: 590, height: 124, rx: 6, ry: 6 } },
      { attr: { x: 382, y: 352, width: 26, height: 56, rx: 3, ry: 3 }, duration: 0.26, ease: 'power3.in' }, 0);
    col.to([cntG, opsLabel], { autoAlpha: 0, duration: 0.1, ease: 'power1.in' }, 0);
    // down first, then left (x late, y early), so it passes right of the chip, not over it
    col.fromTo(blk, { attr: { x: 382, width: 26, rx: 3, ry: 3 } }, { attr: { x: B.x0, width: SLIVER, rx: 0, ry: 0 }, duration: 0.34, ease: 'power2.in', immediateRender: false }, 0.26);
    col.fromTo(blk, { autoAlpha: 0.95, attr: { y: 352, height: 56 } }, { autoAlpha: 1, attr: { y: B.y, height: B.h }, duration: 0.34, ease: 'power1.out', immediateRender: false }, 0.26);
    col.set(bar.sliver, { autoAlpha: 1 }, 0.6);
    col.set(blk, { autoAlpha: 0 }, 0.6);
    S.add(col, TG);
    // a soft amber bloom where it lands (reused when the pointer names it in b3)
    const bloom = S.circle({ x: B.x0 + SLIVER / 2, y: B.y + B.h / 2, r: 70, fill: 'url(#pglow-compute)' }, S.layers.back);
    bloom.setAttribute('data-audit', 'ignore');
    hide(bloom);
    const bloomOnce = () => gsap.fromTo(bloom, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false });
    S.add(bloomOnce(), TG + 0.55);

    // the magnifier: 1 ms of the bar (x 210-260) at 1,000 px, ×20
    const MG = { x: 440, y: 200, w: 1040, h: 220, c0: 460, c1: 1460 };            // panel; its 1 ms spans c0..c1
    const SRC = { x: B.x0, y: B.y - 40, w: PX_MS, h: 40 };                         // the panel grows from the top of the first ms
    const mag = S.g();
    const guides = [0, 1].map(() => S.line({ x1: 0, y1: 0, x2: 0, y2: 0, stroke: 'muted', sw: 1.5 }, mag));
    const win = S.rect({ x: B.x0 - 4, y: B.y - 6, w: PX_MS + 8, h: B.h + 12, r: 4, stroke: 'ink', strokeOpacity: 0.75, sw: 1.5 }, mag);
    const panel = S.rect({ x: MG.x, y: MG.y, w: MG.w, h: MG.h, r: 14, fill: '#0c1326', stroke: 'ink', strokeOpacity: 0.6, sw: 1.5, filter: 'url(#shadow)' }, mag);
    const content = S.g(null, mag);
    const IB = { t: 256, b: 326 };                                                  // the bar inside the panel
    S.path({ d: `M${MG.x + MG.w - 2},${IB.t} H${MG.c0} V${IB.b} H${MG.x + MG.w - 2}`, stroke: 'ink', strokeOpacity: 0.5, sw: 2 }, content);
    S.rect({ x: MG.c0, y: IB.t, w: 0.1 * (MG.c1 - MG.c0), h: IB.b - IB.t, fill: 'compute' }, content);   // 0.1 ms = 100 px
    const DY = 374, gapHalf = 52;
    S.line({ x1: MG.c0, y1: DY, x2: 960 - gapHalf, y2: DY, stroke: 'muted', sw: 2 }, content);
    S.line({ x1: 960 + gapHalf, y1: DY, x2: MG.c1, y2: DY, stroke: 'muted', sw: 2 }, content);
    S.line({ x1: MG.c0, y1: DY - 11, x2: MG.c0, y2: DY + 11, stroke: 'muted', sw: 2 }, content);
    S.line({ x1: MG.c1, y1: DY - 11, x2: MG.c1, y2: DY + 11, stroke: 'muted', sw: 2 }, content);
    S.text('1 ms', { x: 960, y: DY, size: 30, weight: 600, anchor: 'middle', color: 'ink' }, content);
    S.text('×20', { x: MG.x + MG.w - 24, y: 228, size: 26, weight: 600, anchor: 'end', color: 'muted', family: 'mono' }, content);
    const insetTag = S.text('arithmetic ≈ 0.1 ms', { x: MG.c0 + 124, y: (IB.t + IB.b) / 2 + 1, size: 30, weight: 600, color: 'compute' }, content);
    S.add(fx.in(insetTag, { from: 'left', d: 0.5, dist: 20 }), 'b2~tenth-0.25');
    const TA = S.t('b2~all') - 0.05, DA = 0.5;                                    // opens on 'all of it'
    const TB = S.t('b3~Back') + 0.08, DB = 0.6;                                   // collapses on 'Back', done by 'scale'
    const magAt = t => (t < TA ? 0 : t < TA + DA ? easeIO((t - TA) / DA) : t < TB ? 1 : t < TB + DB ? 1 - easeIO((t - TB) / DB) : 0);

    // ---------------------------------------------------------------- b3: back at true scale; under 1%; something else
    S.add(chip.wake({ d: 0.6 }), 'b3~Back');
    S.add(fx.in(bar.tag, { from: 'left', d: 0.5, dist: 20 }), 'b3~this-0.3');
    S.set(bar.pointer, { autoAlpha: 1 }, 'b3~this-0.1');
    S.add(gsap.fromTo(ptrLine, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.35, ease: 'power2.in' }), 'b3~this-0.1');
    S.add(gsap.fromTo(ptrHead, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: 'power2.out' }), 'b3~this+0.22');
    S.add(bloomOnce(), 'b3~sliver');
    S.add(fx.swap(bar.tag, 'arithmetic: under 1%', { d: 0.45 }), 'b3~under-0.15');
    // 'thirty milliseconds': the whole-bar dimension glows once
    const dimGlow = S.g({ filter: 'url(#glow-neutral)' });
    dimGlow.setAttribute('data-audit', 'ignore');
    S.line({ x1: B.x0, y1: B.dimY, x2: B.x1, y2: B.dimY, stroke: 'ink', sw: 3 }, dimGlow);
    S.line({ x1: B.x0, y1: B.dimY - 12, x2: B.x0, y2: B.dimY + 12, stroke: 'ink', sw: 3 }, dimGlow);
    S.line({ x1: B.x1, y1: B.dimY - 12, x2: B.x1, y2: B.dimY + 12, stroke: 'ink', sw: 3 }, dimGlow);
    S.text('≈ 30 ms per token', { x: 960, y: B.dimLabelY, size: B.dimLabelSize, weight: 600, anchor: 'middle', color: 'white' }, dimGlow);
    hide(dimGlow);
    S.add(gsap.fromTo(dimGlow, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), 'b3~thirty-0.1');
    // 'ninety-nine percent': the other 1,495 px fill grey in one soft fade (not a sweep: it is not a clock)
    S.add(gsap.fromTo(bar.rest, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.9, ease: 'sine.inOut', immediateRender: false }), 'b3~ninety-0.15');
    S.add(fx.in(bar.inside, { from: 'fade', d: 0.6 }), 'b3~something-0.15');
    S.add(fx.in(qHolder, { from: 'fade', d: 0.9 }), 'b3~else-0.2');

    // ---------------------------------------------------------------- b4: the chip is not slow; 300 tokens of arithmetic
    S.add(chip.pulse({ d: 0.7 }), "b4~isn't-0.1");
    const model = ch00ModelFile(S, { x: 300, y: 482, size: 80, label: 'model', labelSize: 34 });
    const modelGlow = S.circle({ x: 300, y: 482, r: 64, fill: 'url(#pglow-struct)' }, S.layers.back);
    modelGlow.setAttribute('data-audit', 'ignore');
    hide(modelGlow);
    S.add(fx.pop(model.icon, { d: 0.55, from: 0.5 }), 'b4~model-0.25');
    S.add(fx.in(model.labelEl, { from: 'left', d: 0.5, dist: 18 }), 'b4~model-0.1');
    S.add(gsap.fromTo(modelGlow, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), 'b4~chatbot-0.15');

    // the copies: copy k (1..299) lands at T0 + DT·√(k/299), so the front accelerates (x ∝ t²) and the last
    // lands, tiling the bar exactly to its right end, on 'three hundred'
    const T0 = S.t('b4~In one'), T1 = S.t('b4~three'), DT = T1 - T0;
    const landT = k => T0 + DT * Math.sqrt(k / NCOPY);
    const landedBy = t => (t < T0 ? 0 : t >= T1 ? NCOPY : Math.min(NCOPY, Math.floor(NCOPY * Math.pow((t - T0) / DT, 2) + 1e-9)));
    const copyX = k => B.x0 + SLIVER * k;
    const DROP = 0.16;                                                              // each copy drops 28 px into place
    const settled = S.path({ d: '', fill: 'compute' }, copiesG);
    const fresh = S.path({ d: '', fill: '#ffe2a8' }, copiesG);                      // just landed: a brief bright stamp
    const flying = Array.from({ length: 40 }, () => {
      const r = S.rect({ x: 0, y: B.y, w: SLIVER - 1, h: B.h, fill: '#ffd27a' }, copiesG);
      r.setAttribute('opacity', 0);
      return r;
    });
    const front = S.circle({ x: B.x0, y: B.y + B.h / 2, r: 90, fill: 'url(#pglow-compute)', opacity: 0 }, S.layers.back);
    front.setAttribute('data-audit', 'ignore');
    // the inside label fades as the tiling front reaches its left edge, so no white text sits on amber
    const insideL = 960 - S.measure('something else: over 99%', { size: 36, weight: 600 }) / 2;
    const kIn = Math.ceil((insideL - 16 - B.x0) / SLIVER);
    S.add(gsap.fromTo(bar.inside, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: 'power1.in', immediateRender: false }), landT(kIn) - 0.3);

    // the counter: 1 (the sliver already in the bar) + each copy that lands, settling on '≈ 300'
    const NUM = { y: 470, size: 72 };
    const wTot = S.measure('≈ 300', { size: NUM.size, weight: 600, family: 'mono' });
    const tokG = S.g();
    const tokLabel = S.text('tokens of arithmetic', { x: 960, y: 398, size: 30, weight: 500, anchor: 'middle', color: 'muted' }, tokG);
    const tokNum = S.text('1', { x: 960 + wTot / 2, y: NUM.y, size: NUM.size, weight: 600, family: 'mono', anchor: 'end', color: 'compute' }, tokG);
    const approx = S.text('≈', { x: 960 - wTot / 2, y: NUM.y, size: NUM.size, weight: 600, family: 'mono', color: 'compute' }, tokG);
    hide(approx);
    S.add(fx.in([tokLabel, tokNum], { from: 'up', d: 0.5, dist: 16, stagger: 0.06 }), T0 - 0.35);
    S.add(gsap.fromTo(approx, { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power2.out', immediateRender: false }), T1 + 0.2);

    // 'So what fills the rest?': the copies and the count go; the grey shows through, its label with it
    S.add(gsap.fromTo([copiesG, tokG], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.6, ease: 'power1.inOut', immediateRender: false }), 'b4~So');
    S.add(gsap.fromTo(bar.inside, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.55, ease: 'power1.inOut', immediateRender: false }), 'b4~So+0.3');
    S.add(fx.pulse(qHolder, { scale: 1.14, d: 0.6 }), 'b4~rest-0.1');
    // handoff: the chip and the model leave; s03 opens on the bar alone
    S.add(gsap.fromTo([chipHolder, model], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.6, ease: 'power1.inOut', immediateRender: false }), S.duration - 0.95);

    // ---------------------------------------------------------------- one pure function of time: counts, magnifier, copies
    const render = t => {
      // b1: the count, with a flickering '× +' riding just after its last digit
      const v = opsAt(t);
      counter.textContent = v.toLocaleString('en-US');
      const cw = S.measure(counter.textContent, { size: CNT.size, weight: 600, family: 'mono' });
      glyph.setAttribute('x', f2(CNT.x + cw + 34));
      glyph.textContent = Math.floor(t / 0.11) % 2 ? '+' : '×';

      // b2-b3: the magnifier grows from the top of the bar's first ms, and collapses back into it
      const e = magAt(t);
      if (e <= 0) {
        mag.setAttribute('opacity', 0);
      } else {
        mag.setAttribute('opacity', 1);
        const bx = lerp(SRC.x, MG.x, e), by = lerp(SRC.y, MG.y, e), bw = lerp(SRC.w, MG.w, e), bh = lerp(SRC.h, MG.h, e);
        const sx = bw / MG.w, sy = bh / MG.h;
        panel.setAttribute('x', f2(bx)); panel.setAttribute('y', f2(by));
        panel.setAttribute('width', f2(bw)); panel.setAttribute('height', f2(bh));
        panel.setAttribute('rx', f2(Math.min(14, bw / 4))); panel.setAttribute('ry', f2(Math.min(14, bh / 4)));
        content.setAttribute('transform', `translate(${f2(bx)},${f2(by)}) scale(${sx.toFixed(5)},${sy.toFixed(5)}) translate(${-MG.x},${-MG.y})`);
        content.setAttribute('opacity', clamp((e - 0.72) / 0.28).toFixed(3));
        const yb = by + bh;
        [[B.x0, bx + (MG.c0 - MG.x) * sx], [B.x0 + PX_MS, bx + (MG.c1 - MG.x) * sx]].forEach(([x1, x2], i) => {
          const l = guides[i];
          l.setAttribute('x1', x1); l.setAttribute('y1', B.y - 6);
          l.setAttribute('x2', f2(x2)); l.setAttribute('y2', f2(yb));
          l.setAttribute('opacity', clamp(e / 0.15).toFixed(3));
        });
        win.setAttribute('opacity', clamp(e / 0.2).toFixed(3));
        panel.setAttribute('opacity', clamp(e / 0.06).toFixed(3));
      }

      // b4: the copies
      const n = landedBy(t);
      let ds = '', df = '';
      for (let k = 1; k <= n; k++) {
        const seg = `M${copyX(k)},${B.y}h${SLIVER - 1}v${B.h}h${-(SLIVER - 1)}z`;
        ds += seg;
        if (t - landT(k) < 0.12) df += seg;
      }
      settled.setAttribute('d', ds);
      fresh.setAttribute('d', df);
      let j = 0;
      for (let k = n + 1; k <= NCOPY && j < flying.length; k++) {
        const lt = landT(k);
        if (lt - DROP > t) break;
        const q = clamp(1 - (lt - t) / DROP);
        const r = flying[j++];
        r.setAttribute('x', copyX(k));
        r.setAttribute('y', f2(B.y - 28 * (1 - ease3o(q))));
        r.setAttribute('opacity', q.toFixed(3));
      }
      for (; j < flying.length; j++) flying[j].setAttribute('opacity', 0);
      const fa = t < T0 ? 0 : t < T1 ? 0.75 * clamp((t - T0) / 0.3) : 0.75 * (1 - clamp((t - T1) / 0.45));
      front.setAttribute('cx', f2(copyX(n) + SLIVER));
      front.setAttribute('opacity', fa.toFixed(3));
      // the count stays centred under its label while it runs, then steps right as '≈' joins it
      tokNum.textContent = String(1 + n);
      const wn = S.measure(tokNum.textContent, { size: NUM.size, weight: 600, family: 'mono' });
      tokNum.setAttribute('x', f2(lerp(960 + wn / 2, 960 + wTot / 2, easeIO(clamp((t - T1 - 0.08) / 0.45)))));
    };
    render(0);
    const clock = { t: 0 };
    S.add(gsap.fromTo(clock, { t: 0 }, {
      t: S.duration, duration: S.duration, ease: 'none', immediateRender: false,
      onUpdate: () => render(clock.t), onStart: () => render(clock.t), onReverseComplete: () => render(0),
    }), 0);
  },
});
