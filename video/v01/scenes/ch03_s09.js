/* ch03_s09 · skills, loaded only when needed (fig 24)
   A catalogue of skills (≈ 30 tokens each) is always present; a skill's full instructions (≈ 2,000
   tokens) load only when a request matches it. Forty skills: 40 × 30 = 1,200 tokens of catalogue;
   all forty in full would be 40 × 2,000 = 80,000, 40% of a 200,000-token window. Loading the one you
   need: 1,200 + 2,000 = 3,200, 25× smaller. The context window to scale: 200,000 tokens = 1,600 px. */
V.scene('ch03_s09', S => {
  const { fx } = S;
  const T = spec => S.t(spec);
  const ignore = el => { el.setAttribute('data-audit', 'ignore'); return el; };
  const BX = 160, BW = 1600, BY = 720, BH = 36;           // the context window bar
  const X = tok => BX + tok * BW / 200000;                // 80,000 → 800, 2,000 → 16 px, 3,200 → 25.6 px

  // ---------------------------------------------------------------- the skill pills: built at row size, placed with xset
  const PW = 120, PHt = 64;
  const mkPill = n => {
    const g = S.g();
    S.rect({ x: -PW / 2, y: -PHt / 2, w: PW, h: PHt, r: 16, fill: '#0c1326' }, g);
    g.bg = S.rect({ x: -PW / 2, y: -PHt / 2, w: PW, h: PHt, r: 16, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.7, sw: 2 }, g);
    S.icon('ph:puzzle-piece-duotone', { x: -24, y: 0, size: 34, color: 'struct' }, g);
    g.num = S.text(String(n), { x: 22, y: 1, size: 30, anchor: 'middle', weight: 700, color: 'ink' }, g);
    return g;
  };
  const ROW = i => ({ x: 960 - 3.5 * 140 + i * 140, y: 265 });
  const GS = 0.7, GRID = k => ({ x: 960 - 3.5 * 100 + (k % 8) * 100, y: 178 + Math.floor(k / 8) * 58 });
  const pills = Array.from({ length: 40 }, (_, k) => {
    const p = mkPill(k + 1);
    if (k < 8) S.xset(p, { x: ROW(k).x, y: ROW(k).y, s: 1, ox: 0, oy: 0 });
    else S.xset(p, { x: GRID(k).x, y: GRID(k).y, s: GS, ox: 0, oy: 0 });
    S.set(p, { autoAlpha: 0 }, 0);
    return p;
  });

  // ---------------------------------------------------------------- b1: a catalogue is always present
  const head = S.text('Always present: just enough to know what exists', { x: 960, y: 130, size: 40, anchor: 'middle', weight: 700, family: 'display', color: 'ink' });
  S.add(fx.in(head, { from: 'up', d: 0.5 }), 0.15);
  pills.slice(0, 8).forEach((p, i) => S.add(gsap.fromTo(p, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }), 0.5 + i * 0.12));
  const deck = S.g();
  S.circle({ x: ROW(1).x, y: ROW(1).y - 70, r: 34, fill: '#0c1326', stroke: 'struct', sw: 2 }, deck);
  S.icon('ph:presentation-chart-duotone', { x: ROW(1).x, y: ROW(1).y - 70, size: 44, color: 'ink' }, deck);
  ignore(deck);
  S.set(deck, { autoAlpha: 0 }, 0);
  S.add(fx.pop(deck, { d: 0.4 }), 'b1~one kind-0.1');
  S.add(fx.out(deck, { d: 0.3 }), T('b1~job') + 0.6);
  const cat = S.bracket({ x1: ROW(0).x - PW / 2, x2: ROW(7).x + PW / 2, y: 312, label: 'catalogue  ·  ≈ 30 tokens each', tone: 'struct', size: 28 });
  S.set(cat, { autoAlpha: 0 }, 0);
  S.add(fx.in(cat, { from: 'up', d: 0.4, dist: 10 }), 'b1~catalogue-0.1');
  // the context strip, and the catalogue's sliver at its left end (8 × 30 = 240 tokens = 1.9 px)
  const strip = S.rect({ x: BX, y: BY - BH / 2, w: BW, h: BH, r: 6, fill: 'url(#card-struct)', stroke: 'struct', strokeOpacity: 0.6, sw: 2 });
  const stripLbl = S.text('context', { x: BX, y: BY - BH / 2 - 26, size: 28, weight: 650, color: 'struct' });
  S.set([strip, stripLbl], { autoAlpha: 0 }, 0);
  S.add(gsap.set(strip, { autoAlpha: 1 }), 'b1~always-0.2');
  S.add(gsap.fromTo(strip, { attr: { width: 0 } }, { attr: { width: BW }, duration: 0.8, ease: 'power3.out', immediateRender: false }), 'b1~always-0.2');
  S.add(fx.in(stripLbl, { from: 'up', d: 0.35, dist: 10 }), 'b1~always');
  const sliver = S.rect({ x: BX, y: BY - BH / 2, w: X(240) - BX, h: BH, fill: '#d6e6ff' });
  const drop = ignore(S.rect({ x: ROW(0).x - 20, y: 320, w: 40, h: 10, r: 3, fill: '#d6e6ff' }));
  S.set([sliver, drop], { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(drop, { autoAlpha: 1, attr: { x: ROW(3).x, y: 330 } }, { attr: { x: BX, y: BY - 5 }, duration: 0.6, ease: 'power2.in', immediateRender: false }), 'b1~thirty-0.2');
  S.add(gsap.to(drop, { autoAlpha: 0, duration: 0.1 }), T('b1~thirty') + 0.4);
  S.add(gsap.set(sliver, { autoAlpha: 1 }), T('b1~thirty') + 0.4);

  // ---------------------------------------------------------------- b2: loaded only when one is actually needed
  S.add(fx.swap(head, 'Loaded only when one is actually needed'), 'b2-0.1');
  S.add(fx.out(cat, { d: 0.3 }), 'b2-0.1');
  const user = libToken(S, { text: 'make slides from my notes', icon: 'ph:user-duotone', x: 1300, y: 520, size: 26, hidden: true });
  S.add(user.pop({ d: 0.45 }), 'b2~request-0.2');
  const link = ignore(S.path({ d: `M${user.l - 6},520 C${ROW(1).x + 220},520 ${ROW(1).x},420 ${ROW(1).x},${ROW(1).y + PHt / 2 + 6}`, stroke: 'struct', sw: 2.5, strokeOpacity: 0.8 }));
  S.set(link, { autoAlpha: 0 }, 0);
  S.add(gsap.set(link, { autoAlpha: 1 }), 'b2~matches');
  S.add(fx.draw(link, { d: 0.5 }), 'b2~matches');
  S.add(gsap.fromTo(pills[1].bg, { attr: { 'stroke-opacity': 0.7 } }, { attr: { 'stroke-opacity': 1, 'stroke-width': 3.5 }, duration: 0.3, immediateRender: false }), 'b2~one');
  // pill 2 unfolds into its full instructions
  const DOC = { x: ROW(1).x - 130, y: 400, w: 260, h: 250 };
  const doc = S.g();
  S.rect({ x: DOC.x, y: DOC.y, w: DOC.w, h: DOC.h, r: 16, fill: '#0c1326' }, doc);
  S.rect({ x: DOC.x, y: DOC.y, w: DOC.w, h: DOC.h, r: 16, fill: 'url(#card-struct)', stroke: 'struct', sw: 2 }, doc);
  S.text('full instructions', { x: DOC.x + DOC.w / 2, y: DOC.y + 36, size: 26, anchor: 'middle', weight: 650, color: 'ink' }, doc);
  const dr = S.rand(5);
  for (let i = 0; i < 7; i++) S.rect({ x: DOC.x + 24, y: DOC.y + 66 + i * 18, w: (DOC.w - 48) * (0.5 + 0.5 * dr()), h: 8, r: 4, fill: 'struct', fillOpacity: 0.4 }, doc);
  S.text('≈ 2,000 tokens', { x: DOC.x + DOC.w / 2, y: DOC.y + DOC.h - 26, size: 26, anchor: 'middle', weight: 650, family: 'mono', color: 'struct' }, doc);
  S.set(doc, { autoAlpha: 0 }, 0);
  const UNF = T('b2~full') - 0.2;
  S.add(fx.out(link, { d: 0.3 }), UNF + 0.1);
  S.add(gsap.fromTo(doc, { autoAlpha: 0, scaleY: 0.1, transformOrigin: `50% 0%` }, { autoAlpha: 1, scaleY: 1, transformOrigin: '50% 0%', duration: 0.6, ease: 'power3.out' }), UNF);
  S.call(() => doc.setAttribute('data-audit', 'ignore'), UNF);
  S.call(() => doc.removeAttribute('data-audit'), UNF + 0.65);
  // ... and drops into the context: 2,000 tokens is 16 px at this window's scale
  const docSlab = S.rect({ x: X(240), y: BY - BH / 2, w: 16, h: BH, fill: 'struct', fillOpacity: 0.9 });
  S.set(docSlab, { autoAlpha: 0 }, 0);
  const DROP = T('b2~tokens') - 0.3;
  S.xset(doc, { x: 0, y: 0, s: 1, ox: DOC.x, oy: DOC.y + DOC.h });
  S.add(fx.xform(doc, { x: X(240) - DOC.x, y: BY + BH / 2 - (DOC.y + DOC.h), s: 0.07 }, { d: 0.6, ease: 'power3.in' }), DROP);
  S.call(() => doc.setAttribute('data-audit', 'ignore'), DROP);
  S.add(gsap.to(doc, { autoAlpha: 0, duration: 0.1 }), DROP + 0.55);
  S.add(gsap.set(docSlab, { autoAlpha: 1 }), DROP + 0.55);
  S.add(gsap.fromTo(docSlab, { attr: { 'fill-opacity': 1 } }, { attr: { 'fill-opacity': 0.9 }, duration: 0.4, immediateRender: false }), DROP + 0.55);
  // the other six stay one-liners
  const six = ignore(S.rect({ x: ROW(2).x - PW / 2 - 12, y: 265 - PHt / 2 - 12, w: ROW(7).x - ROW(2).x + PW + 24, h: PHt + 24, r: 20, stroke: 'muted', sw: 2, dash: '8 7' }));
  const sixLbl = S.text('the other six stay one-liners', { x: (ROW(2).x + ROW(7).x) / 2, y: 342, size: 26, anchor: 'middle', weight: 600, color: 'muted' });
  S.set([six, sixLbl], { autoAlpha: 0 }, 0);
  S.add(gsap.set(six, { autoAlpha: 1 }), 'b2~rest');
  S.add(fx.draw(six, { d: 0.6 }), 'b2~rest');
  S.add(fx.in(sixLbl, { from: 'up', d: 0.35, dist: 10 }), T('b2~rest') + 0.3);

  // ---------------------------------------------------------------- b3: forty skills; all forty in full would be 80,000
  const B3 = T('b3') - 0.2;
  S.add(fx.out([head, six, sixLbl, user], { d: 0.35, stagger: 0 }), B3);
  S.add(gsap.to(docSlab, { autoAlpha: 0, duration: 0.3 }), B3);
  S.add(gsap.to(pills[1].bg, { attr: { 'stroke-opacity': 0.7, 'stroke-width': 2 }, duration: 0.3 }), B3);
  pills.slice(0, 8).forEach((p, i) => S.add(fx.xform(p, { x: GRID(i).x, y: GRID(i).y, s: GS }, { d: 0.6, ease: 'power3.inOut' }), B3 + 0.1 + i * 0.02));
  pills.slice(8).forEach((p, j) => S.add(gsap.fromTo(p, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }), B3 + 0.5 + j * 0.015));
  const eq1 = S.equation([{ t: '40' }, { t: '×', tone: 'muted' }, { t: '30' }, { t: '=', tone: 'muted' }, { t: '1,200 tokens', tone: 'struct' }], { x: 900, y: 540, size: 44 });
  S.set(eq1.parts, { autoAlpha: 0 }, 0);
  S.add(fx.in(eq1.parts[0], { from: 'up', d: 0.35, dist: 12 }), 'b3~Forty');
  S.add(fx.in(eq1.parts.slice(1, 3), { from: 'up', d: 0.35, dist: 12, stagger: 0.08 }), 'b3~make');
  S.add(fx.in(eq1.parts.slice(3), { from: 'up', d: 0.35, dist: 12, stagger: 0.08 }), 'b3~twelve');
  const aff = S.pill('affordable', { x: eq1.r + 110, y: 540, h: 46, size: 26, tone: 'helps' });
  S.set(aff, { autoAlpha: 0 }, 0);
  S.add(fx.pop(aff, { d: 0.4 }), 'b3~affordable');
  // the strip becomes the context window, to scale; the catalogue is 1,200 tokens = 9.6 px
  const WIN = T('b3~twelve');
  S.add(gsap.to(strip, { attr: { fill: '#0c1326', stroke: S.tone('ink'), 'stroke-opacity': 0.8 }, duration: 0.5 }), WIN);
  S.add(fx.swap(stripLbl, 'context window: 200,000 tokens'), WIN);
  S.add(gsap.to(stripLbl, { attr: { fill: S.tone('ink') }, duration: 0.3 }), WIN);
  S.add(gsap.to(sliver, { attr: { width: X(1200) - BX }, duration: 0.5 }), WIN + 0.3);
  const ends = S.g();
  S.text('0', { x: BX, y: BY + BH / 2 + 26, size: 22, anchor: 'middle', weight: 550, color: 'muted' }, ends);
  S.text('200,000', { x: BX + BW, y: BY + BH / 2 + 26, size: 22, anchor: 'end', weight: 550, color: 'muted' }, ends);
  S.set(ends, { autoAlpha: 0 }, 0);
  S.add(fx.in(ends, { from: 'fade', d: 0.4 }), WIN + 0.3);
  // 'all forty in full': every pill unfolds and its 2,000 tokens land as one 16 px slab
  const ALL = T('b3~All') - 0.1;
  S.add(gsap.to(pills.map(p => p.bg), { attr: { 'fill-opacity': 1, stroke: '#d6e6ff' }, duration: 0.3, stagger: 0.01 }), ALL);
  const slabs = pills.map((p, k) => {
    const s = S.rect({ x: X(k * 2000), y: BY - BH / 2, w: 16, h: BH, fill: 'struct', fillOpacity: k % 2 ? 0.75 : 0.9 });
    S.set(s, { autoAlpha: 0 }, 0);
    const fly = ignore(S.rect({ x: GRID(k).x - 8, y: GRID(k).y - 6, w: 16, h: 12, r: 3, fill: 'struct' }));
    S.set(fly, { autoAlpha: 0 }, 0);
    const t0 = ALL + 0.35 + k * 0.035;
    S.add(gsap.fromTo(fly, { autoAlpha: 1, x: 0, y: 0 }, { x: X(k * 2000) - (GRID(k).x - 8), y: BY - 6 - (GRID(k).y - 6), duration: 0.65, ease: 'power2.in', immediateRender: false }), t0);
    S.add(gsap.to(fly, { autoAlpha: 0, duration: 0.05 }), t0 + 0.65);
    S.add(gsap.set(s, { autoAlpha: 1 }), t0 + 0.65);
    return s;
  });
  S.add(gsap.to(sliver, { autoAlpha: 0, duration: 0.2 }), ALL + 1.0);
  const eq2 = S.equation([{ t: '40' }, { t: '×', tone: 'muted' }, { t: '2,000' }, { t: '=', tone: 'muted' }, { t: '80,000', tone: 'struct' }], { x: X(40000), y: BY - BH / 2 - 70, size: 36 });
  S.set(eq2.parts, { autoAlpha: 0 }, 0);
  S.add(fx.in(eq2.parts.slice(0, 3), { from: 'up', d: 0.35, dist: 10, stagger: 0.08 }), 'b3~full');
  S.add(fx.in(eq2.parts.slice(3), { from: 'up', d: 0.35, dist: 10, stagger: 0.08 }), 'b3~eighty-0.1');
  const mk40 = S.g();
  S.line({ x1: X(80000), y1: BY - BH / 2 - 14, x2: X(80000), y2: BY + BH / 2 + 10, stroke: 'ink', sw: 3 }, mk40);
  S.text('40%', { x: X(80000) + 12, y: BY - BH / 2 - 26, size: 30, weight: 700, color: 'ink' }, mk40);
  S.set(mk40, { autoAlpha: 0 }, 0);
  S.add(fx.in(mk40, { from: 'down', d: 0.4, dist: 12 }), 'b3~percent-0.3');
  S.add(fx.out(stripLbl, { d: 0.3 }), 'b3~percent-0.3');

  // ---------------------------------------------------------------- b4: load only the one you need: 3,200, 25× smaller
  S.add(fx.out([...eq1.parts, aff], { d: 0.35, stagger: 0 }), 'b4-0.2');
  S.add(gsap.to(pills.map(p => p.bg), { attr: { 'fill-opacity': 0.55 }, duration: 0.4 }), 'b4-0.2');
  const R1 = 790;
  const teal = S.rect({ x: BX, y: R1 - 12, w: 0, h: 24, fill: 'helps' });
  S.set(teal, { autoAlpha: 0 }, 0);
  S.add(gsap.set(teal, { autoAlpha: 1 }), 'b4~twelve-0.1');
  S.add(gsap.to(teal, { attr: { width: X(3200) - BX }, duration: 0.6, ease: 'power2.out' }), 'b4~twelve-0.1');
  const eq3 = S.equation([{ t: '1,200' }, { t: '+', tone: 'muted' }, { t: '2,000' }, { t: '=', tone: 'muted' }, { t: '3,200', tone: 'helps' }], { x: BX + 46, y: R1 + 1, size: 30, anchor: 'start' });
  S.set(eq3.parts, { autoAlpha: 0 }, 0);
  S.add(fx.in(eq3.parts[0], { from: 'left', d: 0.3, dist: 10 }), 'b4~twelve');
  S.add(fx.in(eq3.parts.slice(1, 3), { from: 'left', d: 0.3, dist: 10, stagger: 0.08 }), 'b4~plus');
  S.add(fx.in(eq3.parts.slice(3), { from: 'left', d: 0.3, dist: 10, stagger: 0.08 }), 'b4~thirty-two');
  // the bracket: the 80,000 block against the 3,200 bar
  const dim = S.g();
  const DY = 826;
  S.line({ x1: X(80000), y1: BY + BH / 2 + 4, x2: X(80000), y2: DY + 8, stroke: 'muted', sw: 2, dash: '4 5' }, dim);
  S.line({ x1: X(3200), y1: R1 + 14, x2: X(3200), y2: DY + 8, stroke: 'muted', sw: 2, dash: '4 5' }, dim);
  S.arrow({ x1: X(80000) - 4, y1: DY, x2: X(3200) + 4, y2: DY, color: 'helps', sw: 3, head: 12 }, dim);
  S.text('25× smaller', { x: X(80000) + 20, y: DY + 2, size: 30, weight: 700, color: 'helps' }, dim);
  ignore(dim);
  S.set(dim, { autoAlpha: 0 }, 0);
  S.add(fx.in(dim, { from: 'fade', d: 0.4 }), 'b4~twenty-five-0.1');
  // plugins work the same way: tools and skills in one bundle
  const plugin = ch03Plugin(S, { x: 1590, y: 520, tools: 3, skills: 3, chipH: 46 });
  const plugLbl = S.g();
  S.text('catalogue: cheap', { x: 1590, y: plugin.b + 34, size: 26, anchor: 'middle', weight: 600, color: 'ink' }, plugLbl);
  S.text('contents: on demand', { x: 1590, y: plugin.b + 68, size: 26, anchor: 'middle', weight: 600, color: 'ink' }, plugLbl);
  S.set([plugin, plugLbl], { autoAlpha: 0 }, 0);
  S.add(fx.in(plugin, { from: 'right', d: 0.5, dist: 30 }), 'b4~Plugins-0.1');
  plugin.skills.forEach((c, i) => S.add(c.pulse({ scale: 1.15, d: 0.4 }), T('b4~Plugins') + 0.5 + i * 0.12));
  S.add(fx.in(plugLbl, { from: 'up', d: 0.4, dist: 10 }), 'b4~same');

  // ---------------------------------------------------------------- b5: progressive disclosure, forced by arithmetic
  S.add(fx.out([plugin, plugLbl, dim], { d: 0.4, stagger: 0 }), 'b5-0.1');
  const take = S.takeaway('progressive disclosure', { tone: 'helps' });
  S.add(fx.in(take, { from: 'up', d: 0.5 }), 'b5~progressive-0.1');
  const R2 = 850;
  const chat = S.rect({ x: BX, y: R2 - 12, w: 0, h: 24, fill: 'struct', fillOpacity: 0.9 });
  const chatLbl = S.text('ten turns of chat: 2,000 tokens', { x: BX + 36, y: R2 + 1, size: 28, weight: 600, color: 'ink' });
  const illus = S.pill('illustrative', { x: BX + 36 + S.measure('ten turns of chat: 2,000 tokens', { size: 28, weight: 600 }) + 80, y: R2, h: 36, size: 22, tone: 'neutral', style: 'outline' });
  S.set([chat, chatLbl, illus], { autoAlpha: 0 }, 0);
  const CONV = T('b5~than') - 0.1;
  S.add(gsap.set(chat, { autoAlpha: 1 }), CONV);
  S.add(gsap.to(chat, { attr: { width: 16 }, duration: 0.4 }), CONV);
  S.add(fx.in(chatLbl, { from: 'left', d: 0.35, dist: 10 }), CONV + 0.15);
  S.add(fx.in(illus, { from: 'fade', d: 0.3 }), CONV + 0.4);
  S.add(gsap.fromTo(slabs, { attr: { 'fill-opacity': 0.9 } }, { attr: { 'fill-opacity': 1, fill: '#d6e6ff' }, duration: 0.25, yoyo: true, repeat: 3, immediateRender: false }), CONV + 0.3);
});
