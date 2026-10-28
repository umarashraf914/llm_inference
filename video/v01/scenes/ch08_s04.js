/* ch08_s04 · attention in one sentence (fig 94)
   b1  a ghost of '5 + 6 + 6 = 17' flashes; 'the cat sat down' stack in a column, each with a key; 'it' drops
       in top-left ('this token asks'); dashed lines fan from it to the four keys.
   b2  amber scores beside the pills: 0, 2.5, 1.7, 0 ('illustrative'); a self-loop on 'it' greys out:
       'own score: left out'.
   b3  'softmax' sweeps the column; the scores become shares 0.05, 0.62, 0.28, 0.05 as amber bars grow to
       scale (1,000 px per share of 1); 'how much each counts'; '= 1.00'.
   b4  a value bar beside each pill (opacity by its share); 62% and 5% flash; they merge into 'the blended
       result', mostly cat; it rises into 'it', which gains a stripe in cat's colours.
   b5  the headline writes on; role tags 'who asks', 'how much each counts', 'what is averaged'; '= 1.00'
       glows white.
   Checks: softmax(0, 2.5, 1.7, 0) = 0.051, 0.620, 0.278, 0.051 (sum 1).
   Layout: 'it' at (250, 300); the column x 250, y 430-730; bars from x 450; value bars x 1250-1450; all of it
   620 px right in b1-b2, 330 in b3-b4 and 180 in b5 (its labels reach further right), centred. */
V.scene('ch08_s04', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const E = n => gsap.parseEase(n);
  const clock = (a, b, fn) => S.add(ch08Drive(b - a, k => fn(a + k * (b - a))), a);
  const fade = (els, a, b, at, d = 0.45) => S.add(ch08Fade(els, a, b, { d }), at);

  // ================================================================ b1: the tokens, the query, the keys
  const ghost = S.text('5 + 6 + 6 = 17', { x: 1790, y: 140, size: 34, weight: 650, family: 'mono', anchor: 'end', color: 'muted' });
  ch08Hide(ghost);
  S.add(ch08Drive(1.4, k => { const v = 0.7 * Math.sin(Math.PI * k); ghost.style.opacity = v; ghost.style.visibility = v > 0.01 ? 'inherit' : 'hidden'; }), 'b1~weighted-0.1');
  // the picture (pic, all but the headline): the column with its scores is alone in b1-b2, so pic holds it
  // centred (P12 px right); as the bars grow (b3) it moves to P34, where the closing picture (column, bars,
  // the blended result and its tag) is centred
  const pic = S.g(), P12 = 620, P34 = 330, P5 = 180;   // b5's labels reach further right: it settles at P5
  S.set(pic, { x: P12 }, 0);
  S.add(gsap.fromTo(pic, { x: P12 }, { x: P34, duration: 0.8, ease: 'power2.inOut', immediateRender: false }), T('b3') - 0.45);
  const KX = 250, KYS = [430, 530, 630, 730], TOK = ['the', 'cat', 'sat', 'down'];
  const keys = TOK.map((w, i) => {
    const g = S.g(null, pic);
    libToken(S, { text: w, x: KX, y: KYS[i], size: 30 }, g);
    S.icon('ph:key-bold', { x: KX - 92, y: KYS[i], size: 30, color: 'struct' }, g);
    return g;
  });
  [T('b1~the#2'), T('b1~cat'), T('b1~sat'), T('b1~down')].forEach((t, i) => S.add(fx.in(keys[i], { from: 'left', d: 0.4, dist: 24 }), t - 0.1));
  const itG = S.g(null, pic);
  const itTok = libToken(S, { text: 'it', x: KX, y: 300, size: 32 }, itG);
  S.icon('ph:magnifying-glass-bold', { x: KX - 92, y: 300, size: 32, color: 'struct' }, itG);
  const asks = S.text('this token asks', { x: KX + 60, y: 301, size: 26, weight: 600, color: 'muted' }, pic);
  S.add(fx.in(itG, { from: 'up', d: 0.5, dist: 40, ease: 'bounce.out' }), 'b1~new-0.05');
  ch08Hide(asks);
  fade(asks, 0, 1, T('b1~it') - 0.05, 0.4);
  // dashed lines fan from 'it' to each key icon
  const fan = S.g(null, pic);
  KYS.forEach(y => S.path({ d: `M${KX - 112},${300} C${KX - 170},${300} ${KX - 160},${y} ${KX - 112},${y}`, stroke: 'struct', strokeOpacity: 0.55, sw: 2, dash: '6 6' }, fan));
  fan.querySelectorAll('path').forEach(e => e.setAttribute('data-audit', 'ignore'));
  ch08Hide(fan);
  fade(fan, 0, 1, T('b1~meets') - 0.1, 0.5);

  // ================================================================ b2: scores
  const SCX = 390, SC = ['0', '2.5', '1.7', '0'];
  const scores = SC.map((v, i) => S.text(v, { x: SCX, y: KYS[i] + 1, size: 34, weight: 750, family: 'mono', anchor: 'middle', color: 'compute' }, pic));
  ch08Hide(scores);
  [T('b2~zero'), T('b2~two'), T('b2~one'), T('b2~zero#2')].forEach((t, i) => fade(scores[i], 0, 1, t - 0.1, 0.35));
  const illus = S.text('illustrative', { x: SCX, y: KYS[0] - 50, size: 24, weight: 550, anchor: 'middle', color: 'faint' }, pic);   // over the scores it qualifies
  ch08Hide(illus);
  fade(illus, 0, 0.6, T('b2') + 0.2);
  // a self-loop on 'it', drawn on and greyed out
  const loopG = S.g(null, pic);
  const LX = KX + itTok.w / 2 + 6;
  const loop = S.path({ d: `M${LX},${292} C${LX + 46},${250} ${LX + 46},${348} ${LX},${310}`, stroke: 'compute', sw: 3 }, loopG);
  S.path({ d: `M${LX + 10},${300} L${LX},${310} L${LX + 13},${316}`, stroke: 'compute', sw: 3 }, loopG);
  loopG.querySelectorAll('path').forEach(e => e.setAttribute('data-audit', 'ignore'));
  const own = S.text('own score: left out', { x: LX + 60, y: 260, size: 24, weight: 600, color: 'muted' }, pic);
  ch08Hide([loopG, own]);
  const tLoop = T('b2~leaving') - 0.1;
  fade(asks, 1, 0, tLoop - 0.1, 0.3);
  fade(loopG, 0, 1, tLoop, 0.4);
  S.add(gsap.fromTo(loopG.querySelectorAll('path'), { attr: { stroke: S.tone('compute') } }, { attr: { stroke: S.tone('faint') }, duration: 0.4, immediateRender: false }), T('b2~own') - 0.1);
  fade(own, 0, 1, T('b2~own'), 0.4);

  // ================================================================ b3: softmax → shares, bars to scale
  const SH = [0.05, 0.62, 0.28, 0.05], BX = 450, PXS = 1000;
  const sm = S.text('softmax', { x: BX + 70, y: KYS[0] - 46, size: 26, weight: 700, anchor: 'middle', color: 'compute' }, pic);
  ch08Hide(sm);
  const tSm = T('b3') - 0.05;
  fade(sm, 0, 1, tSm, 0.3);
  S.add(gsap.fromTo(sm, { y: 0 }, { y: KYS[3] - KYS[0] + 92, duration: 1.4, ease: 'power1.inOut', immediateRender: false }), tSm + 0.2);
  fade(sm, 1, 0, tSm + 1.5, 0.3);
  S.add(ch08Ignore(sm, 1.6), tSm);
  const bars = KYS.map(y => S.rect({ x: BX, y: y - 15, w: 0, h: 30, r: 6, fill: 'compute' }, pic));
  const shares = SH.map((v, i) => S.text(v.toFixed(2), { x: BX + 14, y: KYS[i] + 1, size: 32, weight: 750, family: 'mono', color: 'compute' }, pic));
  ch08Hide(shares);
  const tSh = [T('b3~five'), T('b3~two'), T('b3~eight'), T('b3~five#2')];
  tSh.forEach((t, i) => {
    fade(scores[i], 1, 0, t - 0.35, 0.25);
    fade(shares[i], 0, 1, t - 0.3, 0.3);
    clock(t - 0.3, t + 0.5, tt => {
      const w = PXS * SH[i] * E('power2.out')(cl((tt - t + 0.3) / 0.8));
      bars[i].setAttribute('width', w.toFixed(2));
      shares[i].setAttribute('x', (BX + w + 14).toFixed(2));
    });
  });
  const how = S.text('how much each counts', { x: BX, y: 812, size: 28, weight: 650, color: 'compute' }, pic);
  const sum = S.text('= 1.00', { x: BX + PXS * 0.62 + 92, y: 812, size: 32, weight: 750, family: 'mono', anchor: 'end', color: 'compute' }, pic);
  ch08Hide([how, sum]);
  fade(how, 0, 1, T('b3~eight') + 0.4);
  const tSum = T('b3~Together') - 0.05;
  fade(sum, 0, 1, tSum, 0.3);
  clock(tSum, tSum + 0.7, t => { sum.textContent = `= ${(E('power2.out')(cl((t - tSum) / 0.7))).toFixed(2)}`; });
  fade(how, 1, 0.55, T('b4') - 0.1, 0.4);

  // ================================================================ b4: blend the values
  const VXS = 1250, vals = TOK.map((w, i) => {
    const g = S.g(null, pic);
    ch08Vec(S, { token: `${w}-V`, round: 1, dir: 'row', n: 8, cw: 22, ch: 30, gap: 3, anchor: 'start', x: VXS, y: KYS[i] - 15 }, g);
    ch08Hide(g);
    return g;
  });
  const vOp = SH.map(s => 0.25 + 0.75 * s / 0.62);
  const tV = T('b4~blend') - 0.1;
  vals.forEach((g, i) => fade(g, 0, vOp[i], tV + 0.08 * i, 0.4));
  const pct = (txt, i, at) => {
    const e = S.text(txt, { x: VXS + 214, y: KYS[i] + 1, size: 30, weight: 800, family: 'mono', color: 'white' }, pic);
    ch08Hide(e);
    S.add(ch08Drive(1.1, k => { const v = k < 0.2 ? k / 0.2 : k > 0.75 ? (1 - k) / 0.25 : 1; e.style.opacity = v; e.style.visibility = v > 0.01 ? 'inherit' : 'hidden'; }), at);
    return e;
  };
  pct('62%', 1, T('b4~sixty-two') - 0.1);
  pct('5%', 0, T('b4~five') - 0.1);
  // the blended result, bottom centre
  const BB = { x: 790, y: 870, w: 360, h: 110 };
  const box = S.g(null, pic);
  S.card({ x: BB.x, y: BB.y, w: BB.w, h: BB.h, tone: 'struct', r: 18 }, box);
  S.text('the blended result', { x: BB.x + BB.w / 2, y: BB.y + 30, size: 26, weight: 650, anchor: 'middle', color: 'ink' }, box);
  ch08Hide(box);
  fade(box, 0, 1, T('b4~values') - 0.1, 0.45);
  const tMerge = T('b4~word') - 0.15;
  vals.forEach((g, i) => S.add(gsap.fromTo(g, { x: 0, y: 0 }, { x: BB.x + 80 - VXS, y: BB.y + 56 - (KYS[i] - 15), duration: 0.8, ease: 'power2.in', immediateRender: false }), tMerge + 0.06 * i));
  vals.forEach((g, i) => fade(g, vOp[i], 0, tMerge + 0.65 + 0.06 * i, 0.2));
  S.add(ch08Ignore(vals, 1.2), tMerge);
  const mixH = S.g(null, pic);
  const mix = ch08Vec(S, { token: 'cat-V', round: 1, dir: 'row', n: 8, cw: 22, ch: 30, gap: 3, anchor: 'start', x: BB.x + 80, y: BB.y + 56 }, mixH);
  ch08Hide(mixH);
  fade(mixH, 0, 1, tMerge + 0.75, 0.3);
  // the blend stays in the box; a copy of it rises into 'it'
  const keepH = S.g(null, pic);
  ch08Vec(S, { token: 'cat-V', round: 1, dir: 'row', n: 8, cw: 22, ch: 30, gap: 3, anchor: 'start', x: BB.x + 80, y: BB.y + 56 }, keepH);
  ch08Hide(keepH);
  fade(keepH, 0, 1, T('b4~carries') - 0.1, 0.01);
  // 'carries mostly cat': the blend rises into the 'it' pill, which gains a stripe in cat's colours
  const tRise = T('b4~carries') - 0.1;
  S.add(gsap.fromTo(mixH, { x: 0, y: 0 }, { x: KX - 100 - (BB.x + 80), y: 330 - (BB.y + 56), duration: 0.9, ease: 'power3.inOut', immediateRender: false }), tRise);
  S.add(ch08Ignore(mixH, 1.0), tRise);
  S.add(gsap.fromTo(mixH, { scale: 1, transformOrigin: '0% 50%' }, { scale: 0.92, duration: 0.9, immediateRender: false, transformOrigin: '0% 50%' }), tRise);
  S.add(gsap.fromTo(itTok.body || itTok, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.12, duration: 0.2, yoyo: true, repeat: 1, immediateRender: false, transformOrigin: '50% 50%' }), tRise + 0.85);

  // ================================================================ b5: the sentence
  const t5 = T('b5') - 0.1;
  fade([own, loopG], 1, 0, t5, 0.35);
  S.add(gsap.fromTo(pic, { x: P34 }, { x: P5, duration: 0.8, ease: 'power2.inOut', immediateRender: false }), t5);
  const head1 = S.text([{ t: 'Attention is a ' }, { t: 'weighted average', c: 'compute' }], { x: 960, y: 112, size: 50, weight: 700, family: 'display', anchor: 'middle', color: 'ink' });
  const head2 = S.text('over the tokens so far', { x: 960, y: 176, size: 42, weight: 650, family: 'display', anchor: 'middle', color: 'ink' });
  ch08Hide([head1, head2]);
  fade(head1, 0, 1, T('b5~weighted') - 0.15, 0.5);
  fade(head2, 0, 1, T('b5~over') - 0.1, 0.5);
  const who = S.text('who asks', { x: KX + 60, y: 301, size: 28, weight: 700, color: 'struct' }, pic);
  ch08Hide(who);
  fade(who, 0, 1, T('b5~query') - 0.1, 0.4);
  fade(how, 0.55, 1, T('b5~keys') - 0.1, 0.4);
  const what = S.text('what is averaged', { x: BB.x + BB.w + 24, y: BB.y + BB.h / 2, size: 28, weight: 700, color: 'struct' }, pic);
  ch08Hide(what);
  fade(what, 0, 1, T('b5~values') - 0.1, 0.4);
  fade(illus, 0.6, 1, T('b5~illustrative') - 0.1, 0.35);
  S.add(gsap.fromTo(sum, { attr: { fill: S.tone('compute') } }, { attr: { fill: '#ffffff' }, duration: 0.35, immediateRender: false }), T('b5~adding') - 0.05);
});
