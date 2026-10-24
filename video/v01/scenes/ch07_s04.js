/* ch07_s04 · a token ID is a row number (fig 87)
   b1  'embedding table: one row per token': the table builds top-down (0, 1, 2, …, 4271, …, 128,254,
       128,255) while a counter runs to 128,256 rows; '8,192 numbers per row' across the top.
   b2  the blue 'fox' pill flips to 'fox · ID 4271' ('ID illustrative'); 'f( )' is crossed out; 'a token ID is
       a row number': a coral pointer drops onto the table and slides down to row 4271; a copy of the row
       lifts out and slides right into 'that row', trailing a short coral streak.
   b3  a crossed-out calculator above the table; 'one memory read, 16.4 KB'; the pointer pulses; 'a lookup'.
   b4  'learned in training'; a teal 'floating-point operations: 0'.
   No arithmetic on screen: no '×' or '=' anywhere. 8,192 × 2 bytes = 16,384 bytes = 16.4 KB.
   Layout: table strips x 560-1057, y 330-766 (row 4271 at y 554-594); pill x 120-400; slot x 1260-1757. */
V.scene('ch07_s04', S => {
  const { fx } = S;
  const T = s => S.t(s);
  const cl = v => Math.max(0, Math.min(1, v));
  const E = n => gsap.parseEase(n);
  const head = ch07Heading(S);

  // ================================================================ b1: the embedding table
  S.add(head.show([{ t: 'embedding table', c: 'struct' }, { t: ': one row per token' }]), 'b1~embedding-0.2');
  const TB = ch07Table(S, { x: 560, y: 330, widthLabel: '8,192 numbers per row', hidden: true });
  ch07Hide(TB.widthG);
  S.add(TB.build({ d: 0.4, stagger: 0.16 }), 'b1~table-0.1');
  S.add(ch07Fade(TB.widthG, 0, 1, { d: 0.5 }), 'b1~hundred-0.1');
  const r4271 = TB.rowAt(4271);
  // the row counter on the table's right edge
  const cnt = S.text('0 rows', { x: TB.r + 24, y: TB.rows[TB.rows.length - 1].cy, size: 28, weight: 650, family: 'mono', color: 'muted' });
  ch07Hide(cnt);
  const tC0 = T('b1~table'), tC1 = T('b1~thousand') + 0.3;
  S.add(ch07Fade(cnt, 0, 1, { d: 0.3 }), tC0 - 0.1);
  clock(tC0, tC1, t => { cnt.textContent = `${ch07Comma(Math.round(CH07.VOCAB * E('power2.inOut')(cl((t - tC0) / (tC1 - tC0)))))} rows`; });
  function clock(a, b, fn) { S.add(ch07Drive(b - a, k => fn(a + k * (b - a))), a); }

  // ================================================================ b2: fox is ID 4271, a row number
  S.add(ch07Fade(cnt, 1, 0.4, { d: 0.4 }), T('b2') - 0.1);
  const PY = TB.rows[0].cy, PX = 250;
  const pill1 = S.pill('fox', { x: PX, y: PY, tone: 'struct', size: 32, h: 60 });
  const wFox = S.measure('fox', { size: 32, weight: 600 }), wDot = S.measure(' · ', { size: 32, weight: 600 }), wId = S.measure('ID 4271', { size: 32, weight: 600 });
  const W2 = wFox + wDot + wId + 48;
  const pill2 = S.g();
  S.rect({ x: PX - W2 / 2, y: PY - 30, w: W2, h: 60, r: 16, fill: '#0c1326' }, pill2);
  S.rect({ x: PX - W2 / 2, y: PY - 30, w: W2, h: 60, r: 16, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.7, sw: 2 }, pill2);
  S.text([{ t: 'fox' }, { t: ' · ', c: 'muted' }, { t: 'ID 4271' }], { x: PX, y: PY + 1, size: 32, weight: 600, anchor: 'middle', color: 'ink' }, pill2);
  const idX = PX - W2 / 2 + 24 + wFox + wDot;
  const idGlow = S.rect({ x: idX - 8, y: PY - 24, w: wId + 16, h: 48, r: 10, fill: 'white', opacity: 0 }, pill2);
  idGlow.setAttribute('data-audit', 'ignore');
  const illus = S.text('ID illustrative', { x: PX, y: PY + 58, size: 22, weight: 550, anchor: 'middle', color: 'faint' });
  ch07Hide([pill1, pill2, illus]);
  const tFox = T('b2~turns') - 0.1;
  S.add(ch07Fade(pill1, 0, 1, { d: 0.5 }), tFox - 0.3);
  S.add(gsap.fromTo(pill1, { x: -160 }, { x: 0, duration: 0.6, ease: 'power3.out', immediateRender: false }), tFox - 0.3);
  // the flip: the plain pill folds away, the pill with its ID unfolds
  const tFlip = T('b2~whole') - 0.1;
  S.add(gsap.fromTo(pill1, { scaleX: 1, transformOrigin: '50% 50%' }, { scaleX: 0, duration: 0.2, ease: 'power2.in', transformOrigin: '50% 50%', immediateRender: false }), tFlip);
  S.add(ch07Fade(pill1, 1, 0, { d: 0.01 }), tFlip + 0.2);
  S.add(ch07Fade(pill2, 0, 1, { d: 0.01 }), tFlip + 0.2);
  S.add(gsap.fromTo(pill2, { scaleX: 0, transformOrigin: '50% 50%' }, { scaleX: 1, duration: 0.25, ease: 'power2.out', transformOrigin: '50% 50%', immediateRender: false }), tFlip + 0.2);
  S.add(ch07Fade(illus, 0, 1, { d: 0.4 }), tFlip + 0.5);
  S.add(gsap.fromTo(idGlow, { attr: { opacity: 0 } }, { attr: { opacity: 0.32 }, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), 'b2~token-0.05');
  // 'isn't fed into a formula': a grey f( ) box, crossed out
  const fBox = S.g();
  const FB = { x: PX + W2 / 2 + 30, y: PY - 28, w: 92, h: 56 };
  S.rect({ x: FB.x, y: FB.y, w: FB.w, h: FB.h, r: 10, stroke: 'muted', sw: 2.5 }, fBox);
  S.text('f( )', { x: FB.x + FB.w / 2, y: PY + 1, size: 30, weight: 600, family: 'mono', anchor: 'middle', color: 'muted' }, fBox);
  const fSlash = S.line({ x1: FB.x - 6, y1: FB.y + FB.h + 6, x2: FB.x + FB.w + 6, y2: FB.y - 6, stroke: 'muted', sw: 3.5 }, fBox);
  fSlash.setAttribute('data-audit', 'ignore');
  ch07Hide(fBox);
  const L = Math.hypot(FB.w + 12, FB.h + 12);
  fSlash.setAttribute('stroke-dasharray', L.toFixed(1)); fSlash.setAttribute('stroke-dashoffset', L.toFixed(1));
  S.add(ch07Fade(fBox, 0, 1, { d: 0.4 }), 'b2~fed-0.1');
  S.add(ch07Drive(0.35, k => fSlash.setAttribute('stroke-dashoffset', (L * (1 - k)).toFixed(1)), 'power2.inOut'), 'b2~formula');
  // 'row number': the heading changes; a coral pointer drops onto the table and slides to row 4271
  const tRow = T('b2~row') - 0.15;
  S.add(ch07Fade([fBox, illus], 1, 0, { d: 0.35 }), tRow);
  S.add(head.show([{ t: 'a token ID is ' }, { t: 'a row number', c: 'struct' }]), tRow);
  const PTX = TB.l - 96;                                          // the pointer's tip, left of the row numbers
  const ptr = S.g();
  S.path({ d: `M${PTX},${0} l-22,-14 v28 Z`, fill: 'bytes' }, ptr);
  S.line({ x1: PTX - 22, y1: 0, x2: PTX - 52, y2: 0, stroke: 'bytes', sw: 4 }, ptr);
  ptr.setAttribute('data-audit', 'ignore');
  ch07Hide(ptr);
  // the pointer is written from one clock: drop from the pill to row 0, then slide down to 4271
  const tP0 = tRow + 0.2, tP1 = tP0 + 0.45, tP2 = tP1 + 0.9;
  const ptrAt = t => {
    const a = E('power2.out')(cl((t - tP0) / (tP1 - tP0))), b = E('power2.inOut')(cl((t - tP1) / (tP2 - tP1)));
    const x = PTX + (1 - a) * (PX + W2 / 2 - PTX + 60), y = PY - (1 - a) * 40 + b * (r4271.cy - PY);
    ptr.setAttribute('transform', `translate(${(x - PTX).toFixed(2)},${y.toFixed(2)})`);
  };
  ptrAt(0);
  S.add(ch07Fade(ptr, 0, 1, { d: 0.3 }), tP0);
  clock(tP0, tP2, ptrAt);
  // row 4271 highlights
  const hl = S.rect({ x: TB.l - 90, y: r4271.t - 6, w: TB.w + 96, h: 52, r: 10, fill: 'bytes', fillOpacity: 0.12, stroke: 'bytes', sw: 2.5 });
  hl.setAttribute('data-audit', 'ignore');
  ch07Hide(hl);
  S.add(ch07Fade(hl, 0, 1, { d: 0.35 }), tP2 - 0.1);
  // the slot on the right, 'that row'
  const SL = { x: 1260, y: r4271.t, w: TB.w, h: 40 };
  const slot = S.rect({ x: SL.x - 6, y: SL.y - 6, w: SL.w + 12, h: SL.h + 12, r: 10, stroke: 'muted', sw: 2.5, dash: '9 7' });
  const slotLbl = S.text('that row', { x: SL.x + SL.w / 2, y: SL.y - 34, size: 28, weight: 600, anchor: 'middle', color: 'muted' });
  ch07Hide([slot, slotLbl]);
  S.add(ch07Fade([slot, slotLbl], 0, 1, { d: 0.5 }), T('b2~fed'));
  // 'copies that row out': a copy lifts off and slides right, trailing a coral streak
  const streak = S.rect({ x: TB.r, y: r4271.t + 8, w: 0, h: 24, r: 12, fill: 'bytes', fillOpacity: 0.5, opacity: 0 });   // under the copy
  streak.setAttribute('data-audit', 'ignore');
  const hold = S.g();
  const copy = TB.copy(4271, { parent: hold });
  ch07Hide(hold);
  const tCp = T('b2~copies') - 0.05, DX = SL.x - TB.l;
  S.add(ch07Fade(hold, 0, 1, { d: 0.2 }), tCp);
  const lift = gsap.timeline();
  lift.fromTo(hold, { x: 0, y: 0 }, { y: -18, duration: 0.25, ease: 'power2.out', immediateRender: false }, 0);
  lift.fromTo(hold, { x: 0 }, { x: DX, duration: 0.75, ease: 'power2.inOut', immediateRender: false }, 0.25);
  lift.fromTo(hold, { y: -18 }, { y: 0, duration: 0.2, ease: 'power2.in', immediateRender: false }, 1.0);
  S.add(lift, tCp);
  clock(tCp + 0.25, tCp + 1.6, t => {
    const u = cl((t - tCp - 0.25) / 0.75), fade = 1 - cl((t - tCp - 1.0) / 0.6);
    const head2 = TB.l + DX * E('power2.inOut')(u);
    const tail = Math.max(TB.l + 40, head2 - 260);
    streak.setAttribute('x', tail.toFixed(1)); streak.setAttribute('width', Math.max(0, head2 - tail).toFixed(1));
    streak.setAttribute('y', (r4271.t + 8 - 18).toFixed(1));
    streak.setAttribute('opacity', (fade * (u > 0 ? 1 : 0)).toFixed(3));
  });

  // ================================================================ b3: no arithmetic; one memory read
  const t3 = T('b3') - 0.1;
  S.add(ch07Fade(slotLbl, 1, 0, { d: 0.35 }), t3);
  S.add(ch07Fade(slot, 1, 0, { d: 0.35 }), t3);
  S.add(ch07Fade(TB.widthG, 1, 0.4, { d: 0.4 }), t3);
  S.add(ch07Fade(cnt, 0.4, 0.2, { d: 0.4 }), t3);
  const nc = ch07NoCalc(S, { x: TB.r - 20, y: 272, size: 60 });
  S.add(nc.show(), 'b3~arithmetic-0.25');
  const readLbl = S.text('one memory read, 16.4 KB', { x: SL.x + SL.w / 2, y: SL.y - 34, size: 30, weight: 700, anchor: 'middle', color: 'bytes' });
  ch07Hide(readLbl);
  S.add(ch07Fade(readLbl, 0, 1, { d: 0.45, dy0: 10, dy1: 0 }), 'b3~memory-0.1');
  S.add(gsap.fromTo(hl, { attr: { 'fill-opacity': 0.12 } }, { attr: { 'fill-opacity': 0.4 }, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }), 'b3~address-0.15');
  const ptrPulse = S.g();
  ptrPulse.appendChild(ptr);
  S.add(gsap.fromTo(ptrPulse, { x: 0 }, { x: 10, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut', immediateRender: false }), 'b3~address-0.15');
  S.add(head.show([{ t: 'a lookup', c: 'bytes' }]), 'b3~lookup-0.2');

  // ================================================================ b4: learned; zero operations
  const learned = S.text('learned in training', { x: TB.cx, y: TB.b + 44, size: 26, weight: 550, anchor: 'middle', color: 'faint' });
  ch07Hide(learned);
  S.add(ch07Fade(learned, 0, 1, { d: 0.5 }), 'b4~learned-0.1');
  const flops = S.text([{ t: 'floating-point operations: ', c: 'muted' }, { t: '0', c: 'helps', w: 800 }], { x: 1830, y: 236, size: 32, weight: 600, anchor: 'end' });
  ch07Hide(flops);
  S.add(ch07Fade(flops, 0, 1, { d: 0.5, dy0: -10, dy1: 0 }), 'b4~zero-0.1');
});
