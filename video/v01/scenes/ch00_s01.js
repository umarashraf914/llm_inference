/* ch00_s01 · an answer, one token every thirty milliseconds (cold open)
   One continuous shot, no camera. A chat window streams its answer at true speed while a tick track under
   it (chart paper scrolling left, one tick per token) blurs into a streak band; on "Each piece" the paper
   freezes into crisp ticks 60 px apart, the newest six tokens stand apart as pills; on "steady beat" the
   stream resumes at 20x slow motion, the stopwatch counting 0 -> 30 ms between ticks; a bracket marks
   one gap, and its '≈ 30 ms' lifts off to become the stamp s02 opens on. */
V.scene('ch00_s01', {
  fadeOut: false,                                  // s02 opens on this scene's last frame
  build: S => {
    const { fx } = S;
    const stage = S.g();                           // everything that dims in b3 and clears in the tail

    // ---------------------------------------------------------------- the chat window
    const ANSWER = 'Sunlight looks white, but it is really a mix of every colour of the rainbow. On its way down ' +
      'through the air, it keeps bumping into tiny gas molecules, mostly nitrogen and oxygen. Each bump can knock a ' +
      'little of the light off course and send it sideways. This is called scattering, and it does not treat all ' +
      'colours equally. Short wavelengths, the blues, scatter far more strongly than long ones, the reds. So blue ' +
      'light reaches your eyes from every direction, and the whole sky glows blue.';
    const chat = libChatWindow(S, {
      x: 300, y: 130, w: 1320, h: 630, title: '', question: 'Why is the sky blue?', qSize: 34, qRight: 1500,
      answer: ANSWER, splits: { wavelengths: ['wave', 'lengths'] }, size: 36, lineH: 54, iconX: 360, ax: 400, aw: 1110,
    }, stage);
    const kb = chat.find(' blues');                // the freeze point
    const N = kb + 1;                              // tokens streamed at true speed (74)
    if (N !== 74) S.warn(`ch00_s01: ${N} tokens before the freeze, storyboard says 74`);

    // ---------------------------------------------------------------- the clock of the stream
    const TICK = 0.03;                             // 30 ms per token
    const SLOW = 0.6;                              // the same 30 ms at 20x slow motion
    const TF = S.t('b2');                          // freeze, on "Each piece"
    const T0 = TF - N * TICK;                      // true-speed stream starts so that ' blues' lands just before b2
    const TS = S.t('b2~steady');                   // slow motion resumes
    const NS = Math.floor((S.duration - TS) / SLOW);   // held-back tokens that land before the scene ends
    const landT = k => (k < N ? T0 + k * TICK : TS + (k - N + 1) * SLOW);
    // paper offset (px moved left): 2,000 px/s at true speed, stopped while paused, 100 px/s in slow motion.
    // Every token k lands at offset 60k, so ticks are always exactly 60 px apart.
    const P = t => (t < T0 ? 0 : t < TF ? 2000 * (t - T0) : t < TS ? 60 * (N - 1) : 60 * (N - 1) + 100 * (t - TS));
    const TR = { x0: 160, x1: 1640, y: 880, h: 24 };
    const tickX = (k, t) => TR.x1 - (P(t) - 60 * k);
    const leftFade = x => Math.max(0, Math.min(1, (x - TR.x0) / 160));

    // ---------------------------------------------------------------- the track: line, streaks, ticks
    const track = S.g(null, stage);
    const defs = S.el('defs', null, track);
    const lg = S.el('linearGradient', { id: 'ch00-track', gradientUnits: 'userSpaceOnUse', x1: TR.x0, y1: 0, x2: TR.x1, y2: 0 }, defs);
    S.el('stop', { offset: 0, 'stop-color': S.tone('faint'), 'stop-opacity': 0 }, lg);
    S.el('stop', { offset: 0.12, 'stop-color': S.tone('faint'), 'stop-opacity': 1 }, lg);
    S.el('stop', { offset: 1, 'stop-color': S.tone('faint'), 'stop-opacity': 1 }, lg);
    // a streak: the trail one tick leaves during one frame at true speed, bright at its head (left)
    const sg = S.el('linearGradient', { id: 'ch00-streak', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    S.el('stop', { offset: 0, 'stop-color': '#ffffff', 'stop-opacity': 0.25 }, sg);
    S.el('stop', { offset: 0.05, 'stop-color': '#ffffff', 'stop-opacity': 0.62 }, sg);
    S.el('stop', { offset: 0.4, 'stop-color': '#ffffff', 'stop-opacity': 0.3 }, sg);
    S.el('stop', { offset: 1, 'stop-color': '#ffffff', 'stop-opacity': 0.08 }, sg);
    const blur = S.el('filter', { id: 'ch00-blur', x: '-5%', y: '-30%', width: '110%', height: '160%' }, defs);
    S.el('feGaussianBlur', { stdDeviation: '4 1.2' }, blur);
    const line = S.line({ x1: TR.x0, y1: TR.y, x2: TR.x1, y2: TR.y, stroke: 'url(#ch00-track)', sw: 2 }, track);
    const streakG = S.g({ filter: 'url(#ch00-blur)' }, track);
    const streaks = [];
    for (let j = 0; j < 27; j++) {
      const r = S.rect({ x: 0, y: TR.y - TR.h / 2, w: 66, h: TR.h, r: 2, fill: 'url(#ch00-streak)' }, streakG);
      r.setAttribute('opacity', 0);
      streaks.push(r);
    }
    const kOld = Math.floor((60 * (N - 1) - (TR.x1 - TR.x0)) / 60);   // the oldest tick in view at the freeze
    const ticks = [];
    for (let k = kOld; k < N + NS; k++) {
      const l = S.line({ x1: 0, y1: TR.y - TR.h / 2, x2: 0, y2: TR.y + TR.h / 2, stroke: 'ink', sw: 3 }, track);
      l.setAttribute('opacity', 0);
      l.k = k;
      ticks.push(l);
    }
    // while the six newest tokens stand as pills, their six ticks turn blue: one tick per token
    const rgb = c => { const n = parseInt(S.tone(c).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const INK = rgb('ink'), BLUE = rgb('struct');
    const mix = w => `rgb(${INK.map((v, i) => Math.round(v + (BLUE[i] - v) * w)).join(',')})`;

    // the bracket between two slow-motion ticks (drawn on "thirty"), riding left with them
    // the two newest ticks on "thirty": K2 is the newest one landed by then (one gap clear of the speed tag,
    // so the label never meets 'slowed 20×' however close the next landing is)
    const TTH = S.t('b2~thirty');
    const K2 = N + Math.max(1, Math.floor((TTH - TS) / SLOW)) - 1;
    const TBR = TTH;
    const BR = { y: 846, leg: 10 };
    const bracketG = S.g(null, track);
    const bracket = S.path({ d: `M-60,${BR.y + BR.leg} V${BR.y} H0 V${BR.y + BR.leg}`, stroke: 'muted', sw: 2.5 }, bracketG);
    S.set(bracket, { autoAlpha: 0 }, 0);

    // ---------------------------------------------------------------- stopwatch and speed tag
    const sw = libStopwatch(S, { x: 1720, y: TR.y, size: 80, span: 30, readout: 'below', readoutSize: 30 }, stage);
    const speed = S.text('paused', { x: 1720, y: 796, size: 26, weight: 550, anchor: 'middle', color: 'muted' }, stage);
    S.set(speed, { autoAlpha: 0 }, 0);

    // ---------------------------------------------------------------- the stamp (s02 opens on it)
    // a soft dark scrim under the stamp, so it never sits on the dimmed answer's letters
    const scrimDefs = S.el('defs', null, S.layers.front);
    const scg = S.el('radialGradient', { id: 'ch00-scrim' }, scrimDefs);
    S.el('stop', { offset: 0, 'stop-color': S.tone('bg'), 'stop-opacity': 0.9 }, scg);
    S.el('stop', { offset: 0.55, 'stop-color': S.tone('bg'), 'stop-opacity': 0.72 }, scg);
    S.el('stop', { offset: 1, 'stop-color': S.tone('bg'), 'stop-opacity': 0 }, scg);
    const scrim = S.rect({ x: 960 - 640, y: 530 - 230, w: 1280, h: 460, fill: 'url(#ch00-scrim)' }, S.layers.front);
    scrim.setAttribute('data-audit', 'ignore');
    S.set(scrim, { autoAlpha: 0 }, 0);
    const stamp = ch00Stamp(S, {}, S.layers.front);
    const LBL = { y: 820, s: 34 / 96 };            // the stamp's number starts life as the bracket's 34 px label
    const TLBL = TBR + 0.15;                       // label fades in as the bracket draws
    const TL = S.t('b3');                          // "That number": it lifts off
    const DL = 1.1;
    const ease3 = q => 1 - Math.pow(1 - q, 3);
    const easeIO = q => (q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2);
    const clamp = q => Math.max(0, Math.min(1, q));
    const ride = t => [tickX(K2, t) - 30, LBL.y];
    const stampAt = t => {
      if (t < TL) return { p: ride(t), s: LBL.s, a: clamp((t - TLBL) / 0.35) };
      const q = easeIO(clamp((t - TL) / DL)), p0 = ride(TL), p2 = [CH00.STAMP.x, CH00.STAMP.y];
      const p1 = [p0[0] - 140, p2[1] + 30];        // rises first, then glides left: a gentle arc
      const u = 1 - q;
      return { p: [u * u * p0[0] + 2 * u * q * p1[0] + q * q * p2[0], u * u * p0[1] + 2 * u * q * p1[1] + q * q * p2[1]], s: LBL.s + (1 - LBL.s) * q, a: 1 };
    };
    S.set(stamp.sub, { autoAlpha: 0 }, 0);

    // ---------------------------------------------------------------- one pure function of time draws the track
    const render = t => {
      // true speed: a shimmering band of streaks, re-scattered every frame
      if (t >= T0 && t < TF) {
        const rr = S.rand(7919 + Math.floor(t * 30 + 1e-6) * 104729); rr();
        const off = rr() * 60;
        const lead = TR.x1 - 2000 * (t - T0);     // the furthest any tick has travelled yet
        streaks.forEach((r, j) => {
          const xl = TR.x1 - 66 - off - 60 * j;
          const a = xl + 66 < TR.x0 || xl < lead - 40 ? 0 : leftFade(xl + 20);
          r.setAttribute('x', xl.toFixed(1));
          r.setAttribute('opacity', a.toFixed(3));
        });
      } else streaks.forEach(r => r.setAttribute('opacity', 0));
      // paused and slow motion: crisp ticks, each dropping in as its token lands
      ticks.forEach(l => {
        const k = l.k, lt = landT(k);
        let a = 0, dy = 0;
        if (t >= TF && t >= lt) {
          const x = tickX(k, t);
          a = 0.92 * leftFade(x);
          if (k >= N) { const e = ease3(clamp((t - lt) / 0.22)); a *= e; dy = -18 * (1 - e); }
          l.setAttribute('x1', x.toFixed(2)); l.setAttribute('x2', x.toFixed(2));
          l.setAttribute('y1', (TR.y - TR.h / 2 + dy).toFixed(2)); l.setAttribute('y2', (TR.y + TR.h / 2 + dy).toFixed(2));
          const w = k >= N - 6 && k < N ? clamp((t - TF) / 0.4) * (1 - clamp((t - TS) / 0.4)) : 0;
          l.setAttribute('stroke', mix(w));
        }
        l.setAttribute('opacity', a.toFixed(3));
      });
      bracketG.setAttribute('transform', `translate(${tickX(K2, t).toFixed(2)},0)`);
      const st = stampAt(t);
      stamp.numHolder.setAttribute('transform', `translate(${st.p[0].toFixed(2)},${st.p[1].toFixed(2)}) scale(${st.s.toFixed(4)}) translate(${-CH00.STAMP.x},${-CH00.STAMP.y})`);
      stamp.numHolder.setAttribute('opacity', st.a.toFixed(3));
    };
    render(0);
    const clock = { t: 0 };
    S.add(gsap.fromTo(clock, { t: 0 }, {
      t: S.duration, duration: S.duration, ease: 'none', immediateRender: false,
      onUpdate: () => render(clock.t), onStart: () => render(clock.t), onReverseComplete: () => render(0),
    }), 0);

    // ---------------------------------------------------------------- b1: ask, and the answer streams at true speed
    S.add(chat.drawOn({ d: 0.8 }), 'b1~Ask-0.2');
    S.add(chat.typeQuestion({ d: 0.85 }), 'b1~chatbot');
    S.add(chat.blink({ n: 2, period: 0.8 }), 'b1~question+0.35');   // the assistant 'thinks' until the stream starts
    S.add(fx.pulse(chat.sparkle, { scale: 1.35, d: 0.6 }), 'b1~answer-0.1');
    S.add(gsap.fromTo(line, { drawSVG: '100% 100%' }, { drawSVG: '0% 100%', duration: 0.7, ease: 'power2.inOut' }), 'b1~streams-0.15');
    S.add(sw.in({ d: 0.5 }), 'b1~streams+0.05');
    S.add(chat.stream({ to: N, every: TICK }), T0);
    S.add(sw.flicker(TF - T0, { seed: 3, rate: 30, max: 29 }), T0);

    // ---------------------------------------------------------------- b2: freeze; tokens; then the slow beat
    S.add(sw.press(), TF);
    S.add(fx.in(speed, { from: 'fade', d: 0.35 }), TF + 0.1);
    S.add(chat.pillify(kb - 5, kb), TF);
    S.add(chat.dimTokens(0, kb - 6, { to: 0.5 }), TF);
    // "a word or part of one": wave + lengths glow, a bracket names the split
    S.add(chat.glow(kb - 4, kb - 3, { hold: 1.0 }), 'b2~part-0.1');
    const split = chat.bracket(kb - 4, kb - 3, { label: 'one word, two tokens' });
    S.add(split.drawOn({ d: 0.5 }), 'b2~part');
    const sb = split.label.getBBox();
    const illus = S.pill('illustrative split', { x: sb.x + sb.width + 22, y: sb.y + sb.height / 2, anchor: 'start', h: 38, size: 24, padX: 16, tone: 'neutral', style: 'ghost' }, stage);
    S.add(fx.in(illus, { from: 'left', d: 0.45, dist: 20 }), 'b2~part+0.45');
    // "steady beat": back to text, and the stream resumes at 20x slow motion
    S.add(fx.out([split, illus], { d: 0.3 }), TS - 0.15);
    S.add(chat.unpillify(kb - 5, kb), TS);
    S.add(chat.undimTokens(0, kb - 6), TS);
    S.add(fx.swap(speed, 'slowed 20×'), TS - 0.1);
    S.add(sw.press(), TS);
    S.add(chat.stream({ from: N, count: NS, times: Array.from({ length: NS }, (_, i) => (i + 1) * SLOW) }), TS);
    S.add(sw.laps(Math.ceil((S.duration - TS) / SLOW), 30, { every: SLOW }), TS);
    // "thirty milliseconds": a bracket between the two newest ticks; its label is the stamp-to-be
    S.add(gsap.fromTo(bracket, { autoAlpha: 1, drawSVG: '50% 50%' }, { autoAlpha: 1, drawSVG: '0% 100%', duration: 0.45, ease: 'power2.out' }), TBR);

    // ---------------------------------------------------------------- b3: that number
    S.add(fx.dim(stage, { to: 0.18, d: 0.5 }), 'b3');
    S.add(gsap.fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7, ease: 'power1.out' }), 'b3');
    S.add(gsap.fromTo(scrim, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.8, ease: 'power1.inOut', immediateRender: false }), S.duration - 1.0);
    S.add(fx.in(stamp.sub, { from: 'up', d: 0.6, dist: 20 }), TL + DL - 0.25);
    S.add(gsap.to(stage, { opacity: 0, duration: 0.8, ease: 'power1.inOut' }), S.duration - 1.0);
  },
});
