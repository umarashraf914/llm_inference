/* ch13_s01 · every step reads more than the last (fig 131)
   b1: one decode step reads every weight (the film's byte stream: 140 GB crosses into the chip), which folds
       into a reference tag in the corner; the conversation is read too, and it grows (the staircase's empty
       silhouette).
   b2: one row per decode step; the newest (amber) token's coral read arcs reach back over every earlier
       token and itself: reads 4, 5, 6. The staircase, and the square it stands for.
   b3: no memory between steps: row 1's work evaporates, row 2 redraws all of it. Two ways out: recompute
       it, or keep it in a store that grows one entry per step. Which is cheaper? */
V.scene('ch13_s01', S => {
  const { fx } = S;

  // ---------------------------------------------------------------- layout
  const ST = { x: 490, y: 344, size: 36 };          // staircase: left edge, first row's centre (centred with its tags)
  const LABEL_R = ST.x - 30;                         // right edge of the label column left of the rows
  const CARD = { w: 500, h: 136, y: 812, gap: 220 }; // the two cards in the bottom third

  // ---------------------------------------------------------------- b1: weights every step, then the conversation
  // "Each decode step reads every weight": the film's picture of it (ch10-12), one step, the 140 GB crossing
  // the bus into the chip. Then it folds away into a small reference tag in the corner: the known cost.
  const BS = { x1: 730, x2: 1190, y: 452 };
  const bsHold = S.g();                              // xform target (the fold into the corner)
  const bsFade = S.g(null, bsHold);                  // fx.in / fade target
  const bus = libByteStream(S, { x1: BS.x1, x2: BS.x2, y1: BS.y, width: 56, rate: null,
    source: { style: 'stack', w: 200, h: 200, label: 'weights', sub: '140 GB' },
    sink: { title: 'one decode step', w: 190, h: 190, size: 30 } }, bsFade);
  S.add(fx.in(bsFade, { from: 'scale', scale: 0.94, d: 0.7 }), 'b1-0.25');
  S.add(bus.pass({ amount: 140, d: 1.05, length: 170 }), 'b1~reads-0.2');

  // the reference tag, at its corner spot; it fades in as the byte stream folds into it
  const TAG = { x: 96, y: 224, h: 48, size: 26, pad: 22 };
  const segs = [{ t: 'weights: ', c: 'muted' }, { t: '140', c: 'bytes', f: 'mono', w: 600 }, { t: ' GB', c: 'bytes', w: 600 }, { t: ' every step', c: 'muted' }];
  const tagW = segs.reduce((a, s) => a + S.measure(s.t, { size: TAG.size, weight: s.w || 550, family: s.f || 'sans' }), 0) + 2 * TAG.pad;
  const wHold = S.g();
  const wTag = S.g(null, wHold);
  S.rect({ x: TAG.x, y: TAG.y - TAG.h / 2, w: tagW, h: TAG.h, r: TAG.h / 2, fill: '#0c1326' }, wTag);
  S.rect({ x: TAG.x, y: TAG.y - TAG.h / 2, w: tagW, h: TAG.h, r: TAG.h / 2, fill: 'url(#card-neutral)', stroke: 'bytes', strokeOpacity: 0.55, sw: 2 }, wTag);
  S.text(segs, { x: TAG.x + TAG.pad, y: TAG.y + 1, size: TAG.size, weight: 550 }, wTag);
  const tcx = TAG.x + tagW / 2, tcy = TAG.y;
  // "It also reads": the stream shrinks into the tag's place and hands over to it
  const BSC = [(BS.x1 + BS.x2) / 2, BS.y + 26];      // centre of the stream with its labels
  S.xset(bsHold, { s: 1.12, ox: BSC[0], oy: BSC[1] });
  bsHold.setAttribute('data-audit', 'ignore');       // a picture while it shrinks
  S.add(fx.xform(bsHold, { x: tcx - BSC[0], y: tcy - BSC[1], s: 0.16 }, { d: 0.9, ease: 'power3.inOut' }), 'b1~It also-0.15');
  S.add(gsap.fromTo(bsFade, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: 'power1.in', immediateRender: false }), 'b1~It also+0.12');
  S.add(fx.in(wTag, { from: 'scale', scale: 0.85, d: 0.55 }), 'b1~It also+0.25');
  S.add(gsap.fromTo(wHold, { opacity: 1 }, { opacity: 0.3, duration: 0.6, ease: 'power1.inOut', immediateRender: false }), 'b1~so far-0.1');

  // the header writes on (left to right, so it is laid out from its left edge)
  const HEAD = 'Every new token re-reads the whole conversation';
  const headW = S.measure(HEAD, { size: 52, weight: 700, family: 'display' });
  const head = S.heading(HEAD, { y: 136, size: 52, anchor: 'start', x: 960 - headW / 2 });
  S.set(head, { autoAlpha: 0 }, 0);
  S.add(gsap.set(head, { autoAlpha: 1 }), 'b1~the conversation-0.1');
  S.add(fx.type(head.titleEl, { d: 1.3 }), 'b1~the conversation-0.1');

  // the staircase: its empty silhouette appears on "grows"
  const st = ch13Staircase(S, { x: ST.x, y: ST.y, size: ST.size });
  S.add(st.showGuide({ stagger: 0.13 }), 'b1~grows-0.15');

  // ---------------------------------------------------------------- b2: one row per decode step
  const R = st.rows;
  const rowLabel = S.text('one row = one decode step', { x: LABEL_R, y: R[0].y, size: 28, anchor: 'end', color: 'muted', weight: 550 });
  S.add(st.enter(0, { d: 0.55, stagger: 0.08 }), 'b2~Each row-0.1');
  S.add(fx.in(rowLabel, { from: 'right', d: 0.6 }), 'b2~row+0.15');
  // the newest token is the one computed in this step
  S.add(st.light(0), 'b2~newest-0.1');
  // it attends to every earlier token (each rings coral as its arc lands: read), then to itself
  S.add(st.read(0, { d: 0.6, stagger: 0.36, self: false, flash: 'bytes' }), 'b2~attends-0.15');
  S.add(st.readSelf(0, { d: 0.5, flash: 'bytes' }), 'b2~itself-0.2');
  S.add(st.tag(0), 'b2~four-0.1');
  // five, then six: each row builds directly below, one longer
  S.add(st.enter(1, { d: 0.42, stagger: 0.04, amber: true }), 'b2~then-0.25');
  S.add(st.read(1, { d: 0.42, stagger: 0.07, selfD: 0.35 }), 'b2~five-0.25');
  S.add(st.tag(1), 'b2~five+0.2');
  S.add(st.enter(2, { d: 0.42, stagger: 0.04, amber: true }), 'b2~then#2-0.25');
  S.add(st.read(2, { d: 0.42, stagger: 0.06, selfD: 0.35 }), 'b2~six-0.25');
  S.add(st.tag(2), 'b2~six+0.2');
  // "staircase": the dotted diagonal traces the rising right edge; the guide has done its job
  S.add(st.hideGuide({ d: 0.4 }), 'b2~staircase-0.2');
  S.add(st.drawDiag({ d: 1.1 }), 'b2~staircase-0.15');
  // "a cost growing": the reads tags brighten in turn, 4 → 5 → 6
  R.forEach((rw, i) => S.add(gsap.fromTo(rw.tag.bg, { attr: { stroke: S.tone('neutral') } },
    { attr: { stroke: S.tone('bytes') }, duration: 0.35, ease: 'power1.inOut', immediateRender: false }), `b2~growing${(-0.25 + i * 0.22 >= 0 ? '+' : '')}${(-0.25 + i * 0.22).toFixed(2)}`));
  R.forEach((rw, i) => S.add(gsap.fromTo(rw.tag.label, { attr: { fill: S.tone('muted') } },
    { attr: { fill: S.tone('ink') }, duration: 0.35, ease: 'power1.inOut', immediateRender: false }), `b2~growing${(-0.25 + i * 0.22 >= 0 ? '+' : '')}${(-0.25 + i * 0.22).toFixed(2)}`));
  // "square": the rows pulse top to bottom, and the key phrase lands under them
  S.add(st.pulseRows({ stagger: 0.2, scale: 1.1 }), 'b2~square-0.15');
  const key = S.text('each step longer than the last', { x: 960, y: R[2].y + 104, size: 32, anchor: 'middle', color: 'muted', weight: 550 });
  S.add(fx.in(key, { from: 'up', d: 0.6 }), 'b2~square+0.35');

  // ---------------------------------------------------------------- b3: no memory between steps
  S.add(fx.out([key, rowLabel], { d: 0.4 }), 'b3-0.1');
  S.add(gsap.fromTo(wHold, { opacity: 0.3 }, { opacity: 0, duration: 0.45, ease: 'power1.in', immediateRender: false }), 'b3-0.1');
  // the reads tags settle back to grey
  S.add(gsap.fromTo(R.map(rw => rw.tag.bg), { attr: { stroke: S.tone('bytes') } }, { attr: { stroke: S.tone('neutral') }, duration: 0.5, immediateRender: false }), 'b3');
  S.add(gsap.fromTo(R.map(rw => rw.tag.label), { attr: { fill: S.tone('ink') } }, { attr: { fill: S.tone('muted') }, duration: 0.5, immediateRender: false }), 'b3');
  // "no memory": later steps dim; the work done in step 1 evaporates, and so does step 2's
  S.add(gsap.fromTo([R[1].g, R[2].g], { opacity: 1 }, { opacity: 0.28, duration: 0.6, ease: 'power2.out', immediateRender: false }), 'b3~no memory-0.15');
  S.add(st.forget(0, { d: 0.9 }), 'b3~no memory');
  S.add(st.forget(1, { d: 0.5 }), 'b3~no memory');
  const gapY = (R[0].y + R[1].y) / 2 - 6;
  const carried = S.text('nothing carried over', { x: LABEL_R, y: gapY, size: 28, anchor: 'end', color: 'muted', weight: 550 });
  S.add(fx.in(carried, { from: 'right', d: 0.6 }), 'b3~memory+0.25');
  // "its work on earlier tokens": step 2 starts from scratch; every arc is drawn fresh, every earlier token re-read
  S.add(gsap.fromTo(R[1].g, { opacity: 0.28 }, { opacity: 1, duration: 0.5, ease: 'power2.out', immediateRender: false }), 'b3~So-0.1');
  S.add(st.read(1, { d: 0.5, stagger: 0.2, flash: 'compute', selfD: 0.4 }), 'b3~work-0.25');

  // "redone every time": the amber card rises, its arrows going round
  const cx0 = 960 - CARD.gap / 2 - CARD.w, cx1 = 960 + CARD.gap / 2;
  const redo = S.card({ x: cx0, y: CARD.y, w: CARD.w, h: CARD.h, tone: 'compute', title: 'recompute it', icon: 'ph:arrows-clockwise-duotone', iconSize: 72, size: 40 });
  S.add(fx.out(carried, { d: 0.35 }), 'b3~redone-0.3');
  S.add(fx.in(redo, { from: 'up', d: 0.7 }), 'b3~redone-0.25');
  S.add(gsap.fromTo(redo.iconEl, { rotation: 0, transformOrigin: '50% 50%' },
    { rotation: 540, duration: 1.6, ease: 'power2.inOut', transformOrigin: '50% 50%', immediateRender: false }), 'b3~redone-0.05');

  // "or kept, in a store that grows": the teal card rises holding a small stack, one entry per step
  const keep = S.card({ x: cx1, y: CARD.y, w: CARD.w, h: CARD.h, tone: 'helps', title: 'keep it', icon: 'ph:archive-duotone', iconSize: 72, size: 40 });
  const KV = { cw: 116, ch: 11, gap: 5, n: 6 };
  const kvH = KV.n * KV.ch + (KV.n - 1) * KV.gap;
  const kv = libKVCache(S, { layout: 'stack', x: keep.r - 44 - KV.cw, y: keep.cy - kvH / 2, slots: KV.n, filled: 3, tone: 'helps',
    cw: KV.cw, ch: KV.ch, gap: KV.gap, frame: false, label: null, empty: false }, keep);
  S.add(fx.in(keep, { from: 'up', d: 0.7 }), 'b3~kept-0.25');
  S.add(gsap.fromTo(R[2].g, { opacity: 0.28 }, { opacity: 1, duration: 0.5, ease: 'power2.out', immediateRender: false }), 'b3~kept');
  // the rows pulse once more, top to bottom; each step's new token is kept: one entry flies into the store
  R.forEach((rw, i) => {
    const at = `b3~kept+${(0.42 + i * 0.4).toFixed(2)}`;
    S.add(st.pulseRows({ rows: [i], scale: 1.1 }), at);
    S.add(rw.q.glow({ tone: 'helps', hold: 0.15, d: 0.2 }), at);
    S.add(kv.append(1, { from: [rw.q.cx, rw.q.cy], d: 0.55 }), at);
  });

  // "Which is cheaper?": a question mark between the two cards; the staircase steps back
  const ask = S.text('?', { x: 960, y: CARD.y + CARD.h / 2 + 2, size: 84, anchor: 'middle', color: 'muted', weight: 700, family: 'display' });
  S.add(fx.pop(ask, { from: 0.6, d: 0.55 }), 'b3~Which-0.1');
  S.add(gsap.fromTo(st, { opacity: 1 }, { opacity: 0.5, duration: 0.6, ease: 'power1.inOut', immediateRender: false }), 'b3~Which');
});
