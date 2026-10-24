/* ch15_s05 · words in common are not a hit (fig 45)
   Cached 'What is the capital of France ?' against arriving 'Tell me the capital of France please': four words
   in common (the, capital, of, France), even in the same positions 3-6, but compared from the front 'What' ≠
   'Tell', so 0 tokens match and all 7 are prefilled. Here one word = one token (said on screen).
   b1  the cached row, one pill per spoken word; the arriving row the same; position numbers; the token note.
   b2  links in columns 4, 5, 6 then 3, a counter to 4; numbers 3-6 brighten; a caret back to column 1, 'What'
       ≠ 'Tell'; a white line at the left edge, 'tokens matched from the front: 0'.
   b3  the links snap; the heading; amber outlines on all seven arriving pills, 'prefill: 7 of 7'; 'not: words
       in common' struck through, 'identical from the start, in order, unchanged'; 'the commonest mistake'.
   b4  everything dims; 'shared vocabulary: nothing', 'shared beginning: everything'.
   Layout: columns x 360 + 200 i; numbers y 384; cached y 454, arriving y 594; result box y 706-786;
   heading y 128 / 176, lines y 236 / 284; counter x 1760, y 500-550; closing lines y 872 / 940. */
V.scene('ch15_s05', S => {
  const K = libKit(S), { T, cl, E, whole, setO, hide, fade } = K;
  const tB3 = T('b3') - 0.1, tB4 = T('b4') - 0.1;
  const rise = (e, at, dy = 12, d = 0.4) => { hide(e); S.add(K.drive(d, k => { setO(e, k); e.setAttribute('transform', `translate(0,${(dy * (1 - E('power3.out')(k))).toFixed(1)})`); }), at); };
  const CX = i => 360 + 200 * i, RY = [454, 594], PW = 150, PH = 56;
  const WORDS = [['What', 'is', 'the', 'capital', 'of', 'France', '?'], ['Tell', 'me', 'the', 'capital', 'of', 'France', 'please']];
  const AT = [
    ['b1~What', 'b1~is', 'b1~the#3', 'b1~capital', 'b1~of', 'b1~France', null],
    ['b1~Tell', 'b1~me', 'b1~the#5', 'b1~capital#2', 'b1~of#2', 'b1~France#2', 'b1~please'],
  ].map(r => r.map(c => (c ? T(c) - 0.12 : null)));
  AT[0][6] = AT[0][5] + 0.3;

  // ================================================================ b1: two prompts, one word per token
  const rowL = [['cached', 'b1~server'], ['arriving', 'b1~new']].map(([s, c], r) => {
    const e = S.text(s, { x: 240, y: RY[r] + 1, size: 26, weight: 750, anchor: 'end', color: 'muted' });
    rise(e, T(c) - 0.1, 0);
    return e;
  });
  const glowG = S.g(), rowsG = S.g();
  const glows = [[], []];
  const pills = WORDS.map((row, r) => row.map((w, i) => {
    const gl = S.rect({ x: CX(i) - PW / 2 - 14, y: RY[r] - PH / 2 - 8, w: PW + 28, h: PH + 16, r: 22, fill: 'url(#pglow-struct)', opacity: 0 }, glowG);
    gl.setAttribute('data-audit', 'ignore');
    glows[r].push(gl);
    const g = S.g(null, rowsG);
    libToken(S, { text: w, x: CX(i), y: RY[r], size: 28, w: PW, state: 'token' }, g);
    K.track(g, [K.K(AT[r][i], { y: -14, o: 0 }), K.K(AT[r][i] + 0.35, { y: 0, o: 1, e: 'back.out(1.6)' })]);
    return g;
  }));
  const nums = [0, 1, 2, 3, 4, 5, 6].map(i => {
    const e = S.text(String(i + 1), { x: CX(i), y: 384, size: 24, weight: 700, family: 'mono', anchor: 'middle', color: 'muted' });
    hide(e);
    return e;
  });
  const tNums = T('b1~please') + 0.05, tSame = T('b2~same') - 0.1, tShort = T('b4~short') - 0.1;
  nums.forEach((e, i) => {
    const bright = i >= 2 && i <= 5;
    whole(t => {
      const k = cl((t - tNums - 0.05 * i) / 0.3), b = bright ? E('power2.out')(cl((t - tSame - 0.06 * (i - 2)) / 0.35)) : 0;
      setO(e, k * (0.55 + 0.45 * b) * (1 - 0.7 * cl((t - tShort) / 0.5)));
      e.setAttribute('fill', b > 0.5 ? S.tone('struct') : S.tone('muted'));
    });
  });
  const note = S.text('here, one word = one token', { x: CX(6) + PW / 2, y: 664, size: 22, weight: 600, anchor: 'end', color: 'muted' });
  rise(note, tNums + 0.4, 6);

  // ================================================================ b2: four in common, none from the front
  const linkCols = [3, 4, 5, 2], linkAt = ['b2~capital', 'b2~of', 'b2~France', 'b2~the#2'].map(c => T(c) - 0.1);
  const tSnap = T('b3~sits') - 0.1;
  const links = linkCols.map((c, k) => {
    const at = linkAt[k];
    const up = S.path({ d: `M${CX(c)},${RY[0] + PH / 2 + 4} V${(RY[0] + RY[1]) / 2}`, stroke: 'struct', sw: 4 });
    const dn = S.path({ d: `M${CX(c)},${(RY[0] + RY[1]) / 2} V${RY[1] - PH / 2 - 4}`, stroke: 'struct', sw: 4 });
    [up, dn].forEach((p, j) => {
      p.setAttribute('data-audit', 'ignore');
      whole(t => {
        const kin = E('power2.out')(cl((t - at - 0.1 - 0.18 * j) / 0.2)), ks = E('power2.in')(cl((t - tSnap - 0.05 * k) / 0.4));
        p.setAttribute('stroke-dasharray', `${(36 * kin).toFixed(1)} 60`);
        p.setAttribute('transform', `translate(0,${((j ? 14 : -14) * ks).toFixed(1)})`);
        setO(p, kin > 0 ? 1 - ks : 0);
      });
    });
    // both pills of the pair glow from their link until the snap
    [0, 1].forEach(r => whole(t => glows[r][c].setAttribute('opacity', (cl((t - at) / 0.25) * (1 - cl((t - tSnap) / 0.3))).toFixed(3))));
    return [up, dn];
  });
  const cnt = S.g();
  S.text('words in common', { x: 1760, y: 500, size: 24, weight: 700, anchor: 'middle', color: 'struct' }, cnt);
  const cntV = S.text('0', { x: 1760, y: 550, size: 48, weight: 800, family: 'mono', anchor: 'middle', color: 'struct' }, cnt);
  whole(t => { cntV.textContent = String(linkAt.filter(a => t > a + 0.2).length); });
  rise(cnt, linkAt[0], 8);
  // compare from the front: a caret back to column 1, 'What' against 'Tell'
  const tCmp = T('b2~compare') - 0.1, tWhat = T('b2~What') - 0.1, tTell = T('b2~Tell') - 0.1, tNever = T('b2~never') - 0.1;
  const caret = S.path({ d: 'M-12,-8 L0,6 L12,-8', stroke: 'ink', sw: 3.5 });
  caret.setAttribute('data-audit', 'ignore');
  whole(t => {
    const k = E('power3.inOut')(cl((t - tCmp - 0.2) / 0.9));
    caret.setAttribute('transform', `translate(${(CX(3) + (CX(0) - CX(3)) * k).toFixed(1)},350)`);
    setO(caret, cl((t - tCmp) / 0.25) * (1 - cl((t - tB3) / 0.35)));
  });
  [0, 1].forEach(r => { const f = S.rect({ x: CX(0) - PW / 2 - 14, y: RY[r] - PH / 2 - 8, w: PW + 28, h: PH + 16, r: 22, fill: 'url(#pglow-struct)', opacity: 0 }, glowG); f.setAttribute('data-audit', 'ignore'); K.pulse(f, tWhat, 1, 0.5); K.pulse(f, tTell, 1, 0.5); });
  const neq = S.text('≠', { x: CX(0), y: (RY[0] + RY[1]) / 2 + 2, size: 48, weight: 800, anchor: 'middle', color: 'ink' });
  rise(neq, tTell - 0.05, 0, 0.3);
  const LX = CX(0) - PW / 2 - 14;
  const line = S.line({ x1: LX, y1: 354, x2: LX, y2: 654, stroke: '#ffffff', sw: 4 });
  line.setAttribute('data-audit', 'ignore');
  whole(t => { const k = E('power2.out')(cl((t - tNever) / 0.45)); line.setAttribute('y2', (354 + 300 * k).toFixed(1)); setO(line, k > 0 ? 1 : 0); });
  const box = S.g();
  S.rect({ x: 560, y: 706, w: 800, h: 80, r: 18, fill: CH15.BASE, stroke: '#ffffff', strokeOpacity: 0.55, sw: 2 }, box);
  S.text('tokens matched from the front: 0', { x: 960, y: 747, size: 32, weight: 800, anchor: 'middle', color: 'ink' }, box);
  rise(box, T('b2~begins') - 0.05, 10);

  // ================================================================ b3: shared words sit behind the difference
  fade(cnt, 1, 0.3, tSnap, 0.4);
  fade(note, 1, 0, tSnap, 0.3);
  const head = S.g();
  S.text('Four words in common,', { x: 960, y: 128, size: 40, weight: 750, anchor: 'middle', color: 'ink' }, head);
  S.text('and not one of them helps', { x: 960, y: 176, size: 34, weight: 650, anchor: 'middle', color: 'muted' }, head);
  rise(head, tSnap + 0.2, 10);
  const amb = S.g();
  WORDS[1].forEach((w, i) => {
    const r = S.rect({ x: CX(i) - PW / 2 - 6, y: RY[1] - PH / 2 - 6, w: PW + 12, h: PH + 12, r: 20, stroke: 'compute', sw: 3 }, amb);
    hide(r);
    fade(r, 0, 1, tSnap + 0.4 + 0.07 * i, 0.3);
  });
  const pre = S.text('prefill: 7 of 7', { x: 960, y: 666, size: 28, weight: 800, anchor: 'middle', color: 'compute' });
  rise(pre, tSnap + 1.0, 6);
  const tId = T('b3~identical') - 0.1, tBeg = T('b3~beginning') - 0.1, tCom = T('b3~commonest') - 0.1;
  const l1 = S.text('not: words in common', { x: 960, y: 236, size: 26, weight: 650, anchor: 'middle', color: 'muted' });
  rise(l1, tId, 6);
  const w1 = S.measure('not: words in common', { size: 26, weight: 650 });
  const strike = S.path({ d: `M${960 - w1 / 2 - 6},237 H${960 + w1 / 2 + 6}`, stroke: 'muted', sw: 3 });
  strike.setAttribute('data-audit', 'ignore');
  K.draw(strike, w1 + 12, tId + 0.45, 0.35);
  const l2s = 'identical from the start, in order, unchanged';
  const l2 = S.text(l2s, { x: 960, y: 284, size: 28, weight: 750, anchor: 'middle', color: 'helps' });
  rise(l2, tBeg, 6);
  const w2 = S.measure(l2s, { size: 28, weight: 750 });
  const tag = ch15Tag(S, { x: 960 + w2 / 2 + 28, y: 284, lines: 'the commonest mistake' });
  rise(tag, tCom, 6);

  // ================================================================ b4: vocabulary against a beginning
  fade([rowsG, ...rowL, head, l1, strike, l2, tag, amb, pre, box, line, neq], 1, 0.3, tShort, 0.5);
  fade(cnt, 0.3, 0.15, tShort, 0.5);
  const s1 = S.text('shared vocabulary: nothing', { x: 960, y: 872, size: 40, weight: 750, anchor: 'middle', color: 'muted' });
  rise(s1, T('b4~Shared') - 0.1, 10);
  const s2 = S.text('shared beginning: everything', { x: 960, y: 940, size: 40, weight: 800, anchor: 'middle', color: 'helps' });
  rise(s2, T('b4~shared#2') - 0.1, 10);
  void links; void pills;
});
