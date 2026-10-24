/* Shared builders for chapter 4, "Streaming on the wire". Loaded before every ch04 scene.
 *
 * The chapter's visual language (use these so a thing looks the same in every scene):
 * - The user's end is a libDevice laptop (s01 floats a libChatWindow above it); the machine is a libServer
 *   with its spinner: one turn of the circular arrow = one run of the model = one token.
 * - The network is a cable: a grey line that fills teal while the connection is held open ......... ch04Cable
 *   (teal = the held connection, everywhere in this chapter). It can be re-routed, cut and mended.
 * - A token on the wire is a blue libToken in a thin rectangular frame. Frames ride the Down lane just
 *   below the cable, server → you, at a steady rhythm; the stream can freeze ................. ch04Frames
 * - The prompt going up is a blue parcel: one block that can show its make-up (segments, the newest one
 *   bright) and count its tokens ...................................................... ch04Parcel
 * - A wrong guess, or the option that loses, takes a grey cross ............................ ch04Cross
 * - The running answer is CH04.answer (Example A, the weather conversation's follow-up).
 * Colour: blue = prompt and tokens; teal = the held connection, a saving; grey = the network itself,
 * waiting, wrong guesses; amber = arithmetic (prefill); coral = memory traffic and the cache.
 * Builders return the root <g>; helpers return tweens for S.add (call one element's helpers in time
 * order). ch04Frames is the one exception: like S.flow, it schedules itself.
 */

const CH04 = {
  /** the follow-up message and its streamed answer (s01, s03 'Sunny', s05's slots; s05 ends on 'stop') */
  question: 'What about tomorrow?',
  answer: ['Sunny', ' tomorrow', ' with', ' light', ' winds', ' and', ' a', ' warm', ' evening', '.'],
  words: ['Sunny', 'tomorrow', 'with', 'light', 'winds', 'and', 'a', 'warm', 'evening'],
  /** Example A (CHAPTER_NOTES): 1,027 tokens of history + 5 new = 1,032, about 4 KB of text */
  prompt: { tokens: 1032, history: 1027, fresh: 5, kb: 4 },
};

/* a seek-safe drive of a plain state object: later drives take precedence once they have started
   (GSAP renders a timeline's children last-to-first when seeking backwards). */
function ch04Channel() {
  const list = [];
  return (from, to, apply, o = {}) => {
    const idx = list.length, me = {};
    list.push(me);
    const p = { ...from };
    const go = () => { for (let k = idx + 1; k < list.length; k++) if (list[k].tw.progress() > 0) return; apply(p); };
    me.tw = gsap.fromTo(p, { ...from }, {
      ...to, duration: o.d ?? 0.8, ease: o.ease || 'power2.inOut', immediateRender: false,
      onStart: go, onUpdate: go, onReverseComplete: () => { Object.assign(p, from); go(); },
    });
    return me.tw;
  };
}

/**
 * ch04Cable — the network connection between your device (x1, y1) and the server (x2, y2): a thin grey line
 * that draws on, and a thicker teal line over it while the connection is held open. Built from <line>s whose
 * ends are set every frame, so it can be re-routed (a camera push that moves the server), cut in the middle
 * and mended. Marked data-audit="ignore" (frames and labels ride beside it).
 * o: {x1, y1, x2, y2, sw = 6 (teal width; the grey line is 0.55 × sw), tone = 'helps', base = 'faint',
 *     drawn = false (grey line visible as built), open = false (teal visible as built), glow = true}
 * Returns <g> (root, free for fx.in / fx.out / fx.dim) with .plan (the planned state) and helpers:
 *   .drawOn({d = 0.9, ease})   the grey line extends from (x1, y1) to (x2, y2)
 *   .open({d = 0.7, ease})     the teal fills it from the device end: "the line stays open"
 *   .shut({d = 0.5})           the teal drains back to the device end
 *   .route({x1, y1, x2, y2}, {d = 1.4, ease = 'power2.inOut'})   move either end (match a camera move's d / ease)
 *   .cut({gap = 34, d = 0.35}) the cable breaks: both halves pull back from the middle and the teal turns grey
 *   .mend({d = 0.5})           the halves meet again, teal
 *   .lane(dy, inset = 0) → 'M… L…'  a path dy below the planned cable (negative = above), from the server
 *                              end to the device end, inset at both ends: the Down lane for ch04Frames
 *   .mid() → {x, y}            the planned midpoint (for a label pill)
 */
function ch04Cable(S, o = {}, parent) {
  const g = S.g(null, parent);
  g.setAttribute('data-audit', 'ignore');
  const sw = o.sw ?? 6;
  const mk = (stroke, w, op, p) => { const l = S.line({ x1: 0, y1: 0, x2: 0, y2: 0, stroke, sw: w, cap: 'round', strokeOpacity: op }, p || g); l.setAttribute('visibility', 'hidden'); return l; };
  const baseL = [mk(o.base || 'faint', sw * 0.55, 0.8), mk(o.base || 'faint', sw * 0.55, 0.8)];
  const glowG = S.g({ opacity: o.glow === false ? 0 : 0.22 }, g);
  const glowL = [mk(o.tone || 'helps', sw * 3, 1, glowG), mk(o.tone || 'helps', sw * 3, 1, glowG)];
  const fillL = [mk(o.tone || 'helps', sw, 1), mk(o.tone || 'helps', sw, 1)];
  const teal = S.tone(o.tone || 'helps'), grey = S.tone(o.base || 'faint');
  const hx = h => h.replace('#', '').match(/../g).map(c => parseInt(c, 16));
  const A = hx(teal), B = hx(grey);
  const mixC = t => '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  const plan = { x1: o.x1, y1: o.y1, x2: o.x2, y2: o.y2, b: o.drawn ? 1 : 0, f: o.open ? 1 : 0, gap: 0, c: 0 };
  const put = (l, P, a0, a1) => {
    if (a1 - a0 < 0.0005) { l.setAttribute('visibility', 'hidden'); return; }
    l.setAttribute('visibility', 'visible');
    l.setAttribute('x1', (P.x1 + (P.x2 - P.x1) * a0).toFixed(2)); l.setAttribute('y1', (P.y1 + (P.y2 - P.y1) * a0).toFixed(2));
    l.setAttribute('x2', (P.x1 + (P.x2 - P.x1) * a1).toFixed(2)); l.setAttribute('y2', (P.y1 + (P.y2 - P.y1) * a1).toFixed(2));
  };
  const apply = P => {
    const len = Math.hypot(P.x2 - P.x1, P.y2 - P.y1) || 1, gh = P.gap / 2 / len;
    const halves = [[0, 0.5 - gh], [0.5 + gh, 1]];
    halves.forEach(([h0, h1], i) => {
      put(baseL[i], P, h0, Math.min(h1, P.b));
      put(fillL[i], P, h0, Math.min(h1, P.f));
      put(glowL[i], P, h0, Math.min(h1, P.f));
    });
    const col = mixC(P.c);
    fillL.forEach(l => l.setAttribute('stroke', col));
    glowG.setAttribute('opacity', o.glow === false ? 0 : (0.22 * (1 - P.c)).toFixed(3));
  };
  apply(plan);
  const ch = ch04Channel();
  const go = (to, d, ease) => { const from = { ...plan }; Object.assign(plan, to); return ch(from, { ...plan }, apply, { d, ease }); };
  g.plan = plan;
  g.drawOn = (q = {}) => go({ b: 1 }, q.d ?? 0.9, q.ease || 'power2.inOut');
  g.open = (q = {}) => go({ b: 1, f: 1 }, q.d ?? 0.7, q.ease || 'power2.inOut');
  g.shut = (q = {}) => go({ f: 0 }, q.d ?? 0.5, q.ease || 'power2.in');
  g.route = (to, q = {}) => go(to, q.d ?? 1.4, q.ease || 'power2.inOut');
  g.cut = (q = {}) => go({ gap: q.gap ?? 34, c: 1 }, q.d ?? 0.35, q.ease || 'power3.out');
  g.mend = (q = {}) => go({ gap: 0, c: 0 }, q.d ?? 0.5, q.ease || 'power2.inOut');
  g.lane = (dy, inset = 0) => {
    const ux = Math.sign(plan.x2 - plan.x1) || 1;
    return `M${plan.x2 - ux * inset},${plan.y2 + dy} L${plan.x1 + ux * inset},${plan.y1 + dy}`;
  };
  g.mid = () => ({ x: (plan.x1 + plan.x2) / 2, y: (plan.y1 + plan.y2) / 2 });
  return g;
}

/**
 * ch04Frames — tokens streaming down the open connection, one framed blue chip per token, at a steady
 * rhythm. Positions are a pure function of time (one proxy, like S.flow), so the stream can freeze in place.
 * It SCHEDULES ITSELF (pass time specs or seconds); nothing to S.add.
 * o: {d (path, from the server end to the device end), texts [...], made [times: when each leaves the server],
 *     travel = 1.2 (s, server → device), size = 24, state = 'token', freeze = null (time: frames stop where
 *     they are; fade them with fx.out on the root), fadeIn = 0.12, fadeOut = 0.12, clip = null ({x, y, w, h}:
 *     frames show only inside this box, so they slide out from behind the server and into the device)}
 * Returns <g> (root) with .chips[] (libTokens, each in a wrapper .wraps[k]), .made[] and .arrive[] (seconds:
 *   when each one reaches the device end: feed these to libChatWindow.stream({times})).
 */
function ch04Frames(S, o = {}, parent) {
  const root = S.g(null, parent);
  let host = root;
  if (o.clip) {
    const id = `ch04-frames-${ch04Frames.n = (ch04Frames.n || 0) + 1}`;
    const cp = S.el('clipPath', { id, clipPathUnits: 'userSpaceOnUse' }, root);
    S.rect({ x: o.clip.x, y: o.clip.y, w: o.clip.w, h: o.clip.h }, cp);
    host = S.g({ 'clip-path': `url(#${id})` }, root);
  }
  const path = S.path({ d: o.d }, root);
  const L = path.getTotalLength();
  const travel = o.travel ?? 1.2;
  const made = (o.made || []).map(t => S.t(t));
  const fin = o.fadeIn ?? 0.12, fout = o.fadeOut ?? 0.12;
  root.wraps = []; root.chips = [];
  (o.texts || []).forEach((txt, k) => {
    const w = S.g({ opacity: 0 }, host);
    root.chips.push(libToken(S, { text: String(txt).trim(), x: 0, y: 0, size: o.size ?? 24, state: o.state || 'token', frame: true }, w));
    root.wraps.push(w);
  });
  root.made = made;
  root.arrive = made.map(t => t + travel);
  if (!made.length) return root;
  const t0 = Math.min(...made), freezeT = o.freeze != null ? S.t(o.freeze) : null;
  const t1 = freezeT != null ? freezeT : Math.max(...made) + travel;
  const clamp = v => Math.max(0, Math.min(1, v));
  const proxy = { t: 0 };
  const render = () => {
    const now = Math.min(t0 + proxy.t, t1);
    root.wraps.forEach((w, k) => {
      const age = now - made[k];
      if (age <= 0 || age >= travel) { w.setAttribute('opacity', 0); return; }
      const p = path.getPointAtLength(L * age / travel);
      w.setAttribute('transform', `translate(${p.x.toFixed(2)},${p.y.toFixed(2)})`);
      w.setAttribute('opacity', Math.min(clamp(age / fin), clamp((travel - age) / fout)).toFixed(3));
    });
  };
  S.add(gsap.fromTo(proxy, { t: 0 }, { t: t1 - t0 + 0.02, duration: t1 - t0 + 0.02, ease: 'none', immediateRender: false,
    onStart: render, onUpdate: render, onReverseComplete: () => { proxy.t = 0; render(); } }), t0);
  return root;
}

/**
 * ch04Parcel — the prompt as one blue parcel going up the wire. Drawn at (x = left edge, y = centre); move
 * it with S.xset / fx.xform on a holder. It starts as one plain block; .compose() shows what it is made of:
 * its segments laid end to end (libToken chips, so a 'new' segment is the bright just-made blue).
 * o: {x = 0, y = 0, h = 50, segments: [{w, label = '', state = 'token' | 'new' | …}], gap = 4, size = 24,
 *     counter = false (true: a mono counter centred on counterAt, hidden until .count), counterAt (x; default
 *     the middle of the first segment), suffix = ' tokens'}
 * Returns <g> with .segs[] (libTokens), .whole (the plain block), .counterEl, and .w .l .r .t .b .cx .cy.
 * Helpers: .compose({d = 0.5}) the plain block fades into its segments (hidden until then); the bright tail pulses
 *          .count(to, {from = 0, d = 1.2, ease}) the counter appears and runs (S.fmt.int: '1,032 tokens')
 */
function ch04Parcel(S, o = {}, parent) {
  const g = S.g(null, parent);
  const x = o.x ?? 0, y = o.y ?? 0, h = o.h ?? 50, gap = o.gap ?? 4, size = o.size ?? 24;
  const segs = o.segments || [{ w: 300 }];
  const W = segs.reduce((a, s) => a + s.w, 0) + gap * (segs.length - 1);
  let cx = x;
  g.segs = segs.map(s => {
    const t = libToken(S, { text: s.label || '', x: cx, y, anchor: 'start', w: s.w, h, size, state: s.state || 'token', minW: 8 }, g);
    t.__x = cx;
    cx += s.w + gap;
    return t;
  });
  g.whole = libToken(S, { text: '', x, y, anchor: 'start', w: W, h, size, state: 'token' }, g);
  S.set(g.segs, { autoAlpha: 0 }, 0);                 // under the plain block until .compose()
  if (o.counter) {
    const ax = o.counterAt ?? x + segs[0].w / 2;
    g.counterEl = S.counter({ x: ax, y: y + 1, size, value: 0, fmt: S.fmt.int, suffix: o.suffix ?? ' tokens', anchor: 'middle', color: 'ink', weight: 600 }, g);
    S.set(g.counterEl, { autoAlpha: 0 }, 0);
  }
  Object.assign(g, { w: W, h, l: x, r: x + W, t: y - h / 2, b: y + h / 2, cx: x + W / 2, cy: y });
  g.compose = (q = {}) => {
    const d = q.d ?? 0.5, tl = gsap.timeline();
    tl.fromTo(g.segs, { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.6, ease: 'power1.out', immediateRender: false }, 0);
    tl.fromTo(g.whole, { autoAlpha: 1 }, { autoAlpha: 0, duration: d, ease: 'power1.inOut', immediateRender: false }, 0);
    g.segs.forEach(s => { if (s.state === 'new') tl.add(s.pulse({ scale: 1.18, d: 0.6 }), d * 0.6); });
    return tl;
  };
  g.count = (to, q = {}) => {
    const tl = gsap.timeline();
    tl.fromTo(g.counterEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 0);
    tl.add(S.fx.count(g.counterEl, q.from ?? 0, to, { d: q.d ?? 1.2, ease: q.ease || 'power2.out' }), 0);
    return tl;
  };
  return g;
}

/**
 * ch04Cross — a grey cross struck over a region: a wrong guess, a ruled-out option. Hidden until .draw().
 * o: {x, y, w, h (the region), inset = 0.18 (fraction of each side left clear), tone = 'muted', sw = 7}
 * Returns <g> with .a .b (the strokes) and .draw({d = 0.45}) (the two strokes in turn).
 */
function ch04Cross(S, o = {}, parent) {
  const g = S.g(null, parent);
  g.setAttribute('data-audit', 'ignore');
  const ins = o.inset ?? 0.18, s = Math.min(o.w, o.h) * ins;
  const x1 = o.x + Math.max(s, (o.w - o.h) / 2 + s), x2 = o.x + o.w - Math.max(s, (o.w - o.h) / 2 + s);
  const y1 = o.y + s, y2 = o.y + o.h - s;
  const st = { stroke: o.tone || 'muted', sw: o.sw ?? 7, cap: 'round' };
  g.a = S.line({ x1, y1, x2, y2, ...st }, g);
  g.b = S.line({ x1: x2, y1, x2: x1, y2, ...st }, g);
  S.set([g.a, g.b], { autoAlpha: 0 }, 0);
  g.draw = (q = {}) => S.fx.draw([g.a, g.b], { d: (q.d ?? 0.45) / 1.6, stagger: (q.d ?? 0.45) * 0.38 });
  return g;
}
