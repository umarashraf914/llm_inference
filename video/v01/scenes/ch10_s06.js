/* ch10_s06 · why operations and bytes come out equal (fig 116)
   Checked: 70 bn × 2 = 140 bn operations = 1.4 × 10¹¹; 70 bn × 2 bytes = 140 GB; (2N)/(N·2) = 1 op per byte;
   H100 989 TFLOP/s ÷ 3.35 TB/s = 295.2; 1/295 = 0.34 %; H200 989 ÷ 4.8 = 206, 1/206 = 0.49 %.
   b1  the card '70 billion parameters'; amber '× 2 = 140 billion operations' (1.4 × 10¹¹) above; coral
       '× 2 bytes (16-bit) = 140 GB' (140 billion bytes) below.
   b2  the lines stretch into equal bars 'Operations · 2 × N' / 'Bytes, at 16 bits · N × 2', the N's blue and
       bracketed: 'works for any model'; the twos tagged 'multiply-accumulate = 2 ops' / '16 bits = 2 bytes':
       'unrelated, same number'.
   b3  the bars form a fraction and cancel into a white box '1 operation per byte': 'arithmetic intensity',
       'one decode step, one token'.
   b4  the H100 card: '989 trillion ops / second', '3.35 trillion bytes / second', '989 ÷ 3.35 ≈ 295'; one
       coral byte crosses a pipe while the chip's counter runs to 295; then 'chip needs ≈ 295 per byte' and
       'decode offers 1'.
   b5  a strip of 295 squares, one amber: '1 of 295 ≈ 0.34%' (H100), '< 1%'; 'earlier: under 1%' /
       'H200: 1 of 206 ≈ 0.5%'.
   Layout: card x 140-520 at y 440; lines from x 560 (amber y 370, coral y 510); H100 card x 1230-1820, y 300-620,
   its lines centred on it; pipe y 730. The left group is one picture, centred while it is alone (b1-b3, moved
   (320, 75)); at b4 it moves to (-20, -19) beside the H100 card, the top row centred; at b5 the row moves up to
   -113 and the strip band (y 767) comes in under it, the whole frame centred. */
V.scene('ch10_s06', S => {
  const K = ch10Kit(S), { T, cl, lerp, E, EIO, whole, setO, hide, fade, pulse } = K;

  // ================================================================ b1: one count, two totals
  const card = S.g();
  S.rect({ x: 140, y: 400, w: 380, h: 80, r: 16, fill: 'url(#card-struct)', stroke: 'struct', sw: 2.5 }, card);
  S.text('70 billion parameters', { x: 330, y: 441, size: 32, weight: 750, anchor: 'middle', color: 'struct' }, card);
  hide(card);
  fade(card, 0, 1, 0.4, 0.5);
  const LX = 560, AY = 370, CY = 510;
  const seq = (parts, y, color) => { let x = LX; return parts.map(([s, sz, c]) => { const e = S.text(s, { x, y, size: sz, weight: 700, color: c || color, family: 'mono' }); x += S.measure(s, { size: sz, weight: 700, family: 'mono' }) + 18; hide(e); return e; }); };
  const aLine = seq([['× 2', 34], ['= 140 billion operations', 34]], AY, 'compute');
  const aNote = S.text('1.4 × 10¹¹', { x: LX, y: AY + 40, size: 24, weight: 600, color: 'muted' });
  const cLine = seq([['× 2 bytes (16-bit)', 34], ['= 140 GB', 34]], CY, 'bytes');
  const cNote = S.text('140 billion bytes', { x: LX, y: CY + 40, size: 24, weight: 600, color: 'muted' });
  hide([aNote, cNote]);
  fade(aLine[0], 0, 1, T('b1~times') - 0.1, 0.3);
  fade(aLine[1], 0, 1, T('b1~hundred') - 0.1, 0.35);
  fade(aNote, 0, 1, T('b1~token') - 0.1, 0.35);
  fade(cLine[0], 0, 1, T('b1~times#2') - 0.1, 0.3);
  fade(cLine[1], 0, 1, T('b1~hundred#2') - 0.1, 0.35);
  fade(cNote, 0, 1, T('b1~gigabytes') - 0.1, 0.35);

  // ================================================================ b2: equal bars; the twos are unrelated
  const tB2 = T('b2') - 0.1, BW = 600, BH = 56;
  fade([...aLine, aNote, ...cLine, cNote], 1, 0, tB2, 0.3);
  const mkBar = (y, tone, parts) => {
    const g = S.g();
    g.r = S.rect({ x: LX, y: y - BH / 2, w: BW, h: BH, r: 10, fill: `url(#card-${tone})`, stroke: tone, sw: 2.5 }, g);
    g.t = S.text(parts.map(([t, c]) => ({ t, c })), { x: LX + 22, y: y + 1, size: 30, weight: 700 }, g);
    return g;
  };
  const aBar = mkBar(AY, 'compute', [['Operations · ', 'ink'], ['2', 'compute'], [' × ', 'ink'], ['N', 'struct']]);
  const cBar = mkBar(CY, 'bytes', [['Bytes, at 16 bits · ', 'ink'], ['N', 'struct'], [' × ', 'ink'], ['2', 'bytes']]);
  [aBar, cBar].forEach(b => S.add(K.drive(0.6, k => { const e = EIO(k); b.r.setAttribute('width', (lerp(60, BW, e)).toFixed(1)); setO(b, Math.min(1, k * 3)); }), tB2 + 0.1));
  hide([aBar, cBar]);
  const nX1 = LX + 22 + S.measure('Operations · 2 × ', { size: 30, weight: 700 }) + S.measure('N', { size: 30, weight: 700 }) / 2;
  const nX2 = LX + 22 + S.measure('Bytes, at 16 bits · ', { size: 30, weight: 700 }) + S.measure('N', { size: 30, weight: 700 }) / 2;
  const nBr = S.path({ d: `M${nX1},${AY + 22} C${nX1},${(AY + CY) / 2} ${nX2},${(AY + CY) / 2} ${nX2},${CY - 22}`, stroke: 'struct', sw: 2.5 });
  nBr.setAttribute('data-audit', 'ignore');
  K.draw(nBr, 200, T('b2~count') - 0.1, 0.4);
  const anyM = S.text('works for any model', { x: LX + BW + 30, y: (AY + CY) / 2, size: 24, weight: 600, color: 'muted' });
  hide(anyM);
  fade(anyM, 0, 1, T('b2~worth') - 0.1, 0.35);
  const tUn = T('b2~unrelated') - 0.1;
  fade(nBr, 1, 0, tUn, 0.3);    // the N bracket has made its point; 'unrelated, same number' takes its place
  const twoA = S.text('multiply-accumulate = 2 ops', { x: LX + 22, y: AY - 52, size: 24, weight: 650, color: 'compute' });
  const twoC = S.text('16 bits = 2 bytes', { x: LX + 22, y: CY + 52, size: 24, weight: 650, color: 'bytes' });
  const unrel = S.text('unrelated, same number', { x: LX + BW / 2 + 60, y: (AY + CY) / 2, size: 24, weight: 600, anchor: 'middle', color: 'muted' });
  hide([twoA, twoC, unrel]);
  fade(twoA, 0, 1, T('b2~multiply') - 0.1, 0.35);
  fade(twoC, 0, 1, T('b2~sixteen') - 0.1, 0.35);
  fade(unrel, 0, 1, tUn, 0.35);
  fade(anyM, 1, 0, tUn, 0.3);

  // ================================================================ b3: one operation per byte
  const tB3 = T('b3') - 0.1;
  fade([twoA, twoC, unrel], 1, 0, tB3, 0.3);
  const fracL = S.path({ d: `M${LX},${(AY + CY) / 2} H${LX + BW}`, stroke: 'ink', sw: 3 });
  hide(fracL);
  K.track(aBar, [K.K(tB3 + 0.2, { y: 0 }), K.K(tB3 + 0.7, { y: 30 })]);
  K.track(cBar, [K.K(tB3 + 0.2, { y: 0 }), K.K(tB3 + 0.7, { y: -30 })]);
  fade(fracL, 0, 1, tB3 + 0.6, 0.25);
  const tOne = T('b3~exactly') - 0.1;
  fade([aBar, cBar, fracL], 1, 0, tOne, 0.35);
  const box = S.g();
  S.rect({ x: LX + 60, y: 395, w: 480, h: 96, r: 16, fill: '#0c1326', stroke: 'white', sw: 3 }, box);
  S.text('1 operation per byte', { x: LX + 300, y: 444, size: 40, weight: 800, anchor: 'middle', color: 'ink' }, box);
  hide(box);
  fade(box, 0, 1, tOne + 0.25, 0.4);
  const ai = S.text('arithmetic intensity', { x: LX + 300, y: 536, size: 30, weight: 700, anchor: 'middle', color: 'ink' });
  const ai2 = S.text('one decode step, one token', { x: LX + 300, y: 576, size: 24, weight: 600, anchor: 'middle', color: 'muted' });
  hide([ai, ai2]);
  fade(ai, 0, 1, T('b3~arithmetic') - 0.1, 0.4);
  fade(ai2, 0, 1, T('b3~arithmetic') + 0.3, 0.4);

  const left = S.g();          // everything so far: the left group
  [...S.main.children].filter(e => e !== left).forEach(e => left.appendChild(e));

  // ================================================================ b4: what the chip could do
  const tB4 = T('b4') - 0.1;
  fade(card, 1, 0.3, tB4, 0.4);
  const h100 = S.g();
  S.rect({ x: 1230, y: 300, w: 590, h: 320, r: 18, fill: '#0c1326', stroke: 'white', strokeOpacity: 0.22, sw: 2 }, h100);
  // its contents centred on the card (x 1525): the icon and name as one row, then the lines
  const HC = 1525, hx = HC - (52 + S.measure('H100', { size: 32, weight: 750 })) / 2;
  S.icon('ph:cpu-duotone', { x: hx + 20, y: 350, size: 40, color: 'compute' }, h100);
  S.text('H100', { x: hx + 52, y: 350, size: 32, weight: 750, color: 'ink' }, h100);
  hide(h100);
  fade(h100, 0, 1, tB4 + 0.45, 0.4);     // once the left group has moved over
  const l1 = S.text('989 trillion ops / second', { x: HC, y: 420, size: 28, weight: 700, family: 'mono', anchor: 'middle', color: 'compute' }, h100);
  const l2 = S.text('3.35 trillion bytes / second', { x: HC, y: 474, size: 28, weight: 700, family: 'mono', anchor: 'middle', color: 'bytes' }, h100);
  const div = S.text([{ t: '989 ÷ 3.35 ≈ ', c: 'ink' }, { t: '295', c: 'compute' }], { x: HC, y: 560, size: 36, weight: 800, family: 'mono', anchor: 'middle' }, h100);
  hide([l1, l2, div]);
  fade(l1, 0, 1, T('b4~compute') - 0.1, 0.35);
  fade(l2, 0, 1, T('b4~bandwidth') - 0.1, 0.35);
  fade(div, 0, 1, T('b4~while') - 0.1, 0.35);
  // a short pipe: one byte crosses while the chip counts to 295
  const pipe = S.g();
  S.icon('ph:memory-duotone', { x: 1300, y: 730, size: 48, color: 'bytes' }, pipe);
  S.rect({ x: 1336, y: 720, w: 380, h: 20, r: 10, fill: '#140c14', stroke: 'bytes', strokeOpacity: 0.6, sw: 2 }, pipe);
  S.icon('ph:cpu-duotone', { x: 1760, y: 730, size: 48, color: 'compute' }, pipe);
  const byte = S.rect({ x: -9, y: -7, w: 18, h: 14, r: 3, fill: 'bytes' }, pipe);
  byte.setAttribute('data-audit', 'ignore');
  const cnt = S.text('0', { x: 1760, y: 792, size: 34, weight: 750, family: 'mono', anchor: 'middle', color: 'compute' }, pipe);
  hide(pipe);
  const tPipe = T('b4~byte') - 0.2, PD = 2.6;
  fade(pipe, 0, 1, tPipe - 0.2, 0.35);
  whole(t => {
    const k = cl((t - tPipe) / PD);
    byte.setAttribute('transform', `translate(${lerp(1346, 1706, k).toFixed(1)},730)`);
    cnt.textContent = String(Math.round(295 * k));
  });
  const tDec = T('b4~Decode') - 0.1;
  fade(pipe, 1, 0, tDec, 0.35);
  const need = S.pill('chip needs ≈ 295 per byte', { x: 1525, y: 720, tone: 'compute', size: 26, h: 52 });
  const offer = S.pill('decode offers 1', { x: 1525, y: 792, tone: 'neutral', size: 26, h: 52, color: 'ink' });
  hide([need, offer]);
  fade(need, 0, 1, tDec + 0.2, 0.35);
  fade(offer, 0, 1, T('b4~one#3') - 0.1, 0.35);
  const right = S.g();          // the H100 group
  [h100, pipe, need, offer].forEach(e => right.appendChild(e));

  // ================================================================ b5: a third of one percent
  const tB5 = T('b5') - 0.1;
  fade([h100, need, offer], 1, 0.3, tB5, 0.4);
  const SX0 = 140, SX1 = 1780, N = 295, pitch = (SX1 - SX0) / N, SY = 767;
  const strip = S.g();
  strip.setAttribute('data-audit', 'ignore');
  let dGrey = '';
  for (let i = 1; i < N; i++) dGrey += `M${(SX0 + i * pitch).toFixed(2)},${SY - 12}h${(pitch * 0.72).toFixed(2)}v24h${(-pitch * 0.72).toFixed(2)}Z`;
  S.path({ d: dGrey, fill: 'faint', fillOpacity: 0.7 }, strip);
  const lit = S.rect({ x: SX0, y: SY - 12, w: pitch * 0.72, h: 24, r: 1, fill: 'compute' }, strip);
  const litGlow = S.circle({ x: SX0 + pitch * 0.36, y: SY, r: 18, fill: 'url(#pglow-compute)' }, strip);
  hide(strip);
  const tStrip = T('b5~third') - 0.2;
  fade(strip, 0, 1, tStrip, 0.8);
  void lit; void litGlow;
  const lab = S.text([{ t: '1 of 295 ≈ ', c: 'ink' }, { t: '0.34%', c: 'compute' }], { x: SX0, y: SY + 70, size: 32, weight: 750, family: 'mono' });
  const labH = S.text('H100', { x: SX0, y: SY + 110, size: 22, weight: 600, color: 'muted' });
  const lt1 = S.text('< 1%', { x: SX0 + S.measure('1 of 295 ≈ 0.34%', { size: 32, weight: 750, family: 'mono' }) + 30, y: SY + 70, size: 32, weight: 800, color: 'ink' });
  hide([lab, labH, lt1]);
  fade([lab, labH], 0, 1, tStrip + 0.6, 0.4);
  fade(lt1, 0, 1, T('b5~under') - 0.1, 0.35);
  // the callback chip, ending with the strip, sized to its lines and with them centred in it
  const callW = Math.max(S.measure('earlier: under 1%', { size: 26, weight: 650 }), S.measure('H200: 1 of 206 ≈ 0.5%', { size: 22, weight: 600, family: 'mono' })) + 52;
  const call = S.g();
  S.rect({ x: SX1 - callW, y: SY + 40, w: callW, h: 86, r: 14, fill: '#0c1326', stroke: 'white', strokeOpacity: 0.2, sw: 2 }, call);
  S.text('earlier: under 1%', { x: SX1 - callW / 2, y: SY + 68, size: 26, weight: 650, anchor: 'middle', color: 'muted' }, call);
  S.text('H200: 1 of 206 ≈ 0.5%', { x: SX1 - callW / 2, y: SY + 104, size: 22, weight: 600, family: 'mono', anchor: 'middle', color: 'muted' }, call);
  hide(call);
  S.add(K.drive(0.5, k => { setO(call, k); call.setAttribute('transform', `translate(${(60 * (1 - E('power3.out')(k))).toFixed(1)},0)`); }), T('b5~thirty') - 0.1);
  // the frame's layout: the left group alone and centred, then beside the H100 card, then the row up for the strip
  const row = t => lerp(-19, -113, EIO(cl((t - tB5) / 0.7))) + 19;
  whole(t => { const u = EIO(cl((t - tB4) / 0.8)); left.setAttribute('transform', `translate(${lerp(320, -20, u).toFixed(1)},${(lerp(75, -19, u) + row(t)).toFixed(1)})`); });
  whole(t => right.setAttribute('transform', `translate(-20,${(-19 + row(t)).toFixed(1)})`));
  void pulse; void E;
});
