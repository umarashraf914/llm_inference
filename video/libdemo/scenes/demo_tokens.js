V.scene('demo_tokens', S => {
  const { fx } = S;
  // ===== b1: chip helpers
  const T1 = libTokenStrip(S, { x: 200, y: 220, tokens: [' the', ' river', ' bank', ' was', ' muddy'], idPos: 'above', ids: false });
  S.add(fx.in(T1, { from: 'fade' }), 'b1-0.3');
  S.add(T1.textOff([1, 3]), 'b1+0.3');
  S.add(T1.textOn([1, 3]), 'b1+1.2');
  S.add(T1.lift(2), 'b1+0.5');
  S.add(T1.setState(2, 'new'), 'b1+0.5');
  S.add(T1.stripe(2, ['helps', 'violet']), 'b1+0.9');
  S.add(T1.badges('all', ['1', '2', '3', '4', '5']), 'b1+1.3');
  S.add(T1.glow(4, { tone: 'compute', hold: 1 }), 'b1+1.6');
  const bu = T1.bracket(0, 1, { label: 'from these', up: true, tone: 'helps' });
  S.add(bu.drawOn(), 'b1+2.0');
  S.add(T1.drop([0, 0], { dy: 70 }), 'b1+2.6');
  const P1 = libTokenStrip(S, { x: 1100, y: 220, tokens: [{ t: 'What', id: 1 }, { t: 'is', id: 2 }, { t: 'the', id: 3 }, { t: 'capital', id: 4 }], idPos: 'above' });
  S.add(P1.reveal('all'), 'b1');
  S.add(P1.showIds(), 'b1+0.8');
  const R1 = libTokenStrip(S, { x: 1100, y: 400, shades: 5, tokens: [{ t: '', id: '24/s' }, { t: '', id: '24/s' }, { t: '', id: '24/s' }, { t: '', id: '24/s' }], w: 70 });
  S.add(R1.reveal('all'), 'b1+0.4');
  const lone = libToken(S, { text: 'your question', x: 300, y: 480 });
  const route = S.path({ d: 'M300,480 C600,380 800,580 1000,480', stroke: 'faint', sw: 2 }, S.layers.back);
  route.setAttribute('data-audit', 'ignore');
  S.add(lone.in({ from: 'left' }), 'b1');
  S.add(lone.travel(route, { d: 1.2 }), 'b1+0.8');
  S.add(lone.moveTo([1000, 600]), 'b1+2.2');
  S.add(lone.out(), 'b1+3.0');
  S.add(fx.out(route, { d: 0.3 }), 'b1+3.0');
  const shifty = libTokenStrip(S, { x: 200, y: 720, tokens: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] });
  S.add(fx.in(shifty), 'b1');
  S.add(shifty.shift(2), 'b1+1.5');
  S.add(fx.out([T1, bu, P1, R1, shifty], { d: 0.3, stagger: 0 }), 'b2-0.7');

  // ===== b2: a small scrolling chat in a bottom band, bubbles
  const LONG = 'Short wavelengths, the blues, scatter far more strongly than long ones, the reds, so blue light reaches your eyes from every direction of the sky at once, which is why the whole dome looks blue at noon.';
  const mini = libChatWindow(S, { x: 360, y: 700, w: 1200, h: 210, size: 28, question: 'Why is the sky blue?', answer: LONG, splits: { wavelengths: ['wave', 'lengths'] } });
  S.add(mini.drawOn(), 'b2-0.4');
  const times = []; for (let k = 0; k < 30; k++) times.push(k * 0.06 + (k > 15 ? 0.4 : 0));
  S.add(mini.stream({ count: 30, times }), 'b2');
  S.add(mini.stream({ every: 0.05 }), 'b2+3.1');
  S.add(mini.pillify(25, 27), 'b2+2.3');
  S.add(mini.unpillify(25, 27), 'b2+2.9');
  S.add(mini.blink({ n: 1, period: 0.5 }), 'b2+3.0');
  const multi = libBubble(S, { text: 'Tell me the capital of France, and then its population please', x: 1250, y: 300, maxW: 560, avatar: true });
  S.add(multi.pop(), 'b2-0.2');
  S.add(multi.type({ d: 1.2 }), 'b2');
  S.add(multi.shrink(), 'b2+2.6');
  const ans = libBubble(S, { text: 'Paris.', x: 560, y: 300, tone: 'helps', side: 'left' });
  S.add(ans.pop(), 'b2+0.5');
  S.add(fx.out([mini, ans], { d: 0.3, stagger: 0 }), 'b3-0.7');

  // ===== b3: prompt stacks: land, append, paint, schematic, crowded outside labels
  const st = libPromptStack(S, { x: 160, y: 300, w: 1200, segments: [
    { label: 'system prompt', tokens: 770, state: 'cached' },
    { label: 'tools', tokens: 120 }, { label: 'question 1', tokens: 30 }, { label: 'answer 1', tokens: 40 }, { label: 'new', tokens: 12, state: 'prefill' },
  ] });
  S.add(st.grow('all', { stagger: 0.15 }), 'b3-0.3');
  S.add(st.paint([1, 3], 'cached', { stagger: 0.1 }), 'b3+1.0');
  S.add(st.notch(960, { label: 'diverges here' }), 'b3+1.6');
  const sch = libPromptStack(S, { x: 160, y: 640, segments: [
    { label: "provider's system prompt", w: 520, icon: 'ph:globe-duotone' }, { label: 'your instructions', w: 300, icon: 'ph:user-circle-duotone' },
    { label: 'conversation so far', w: 420 }, { label: 'newest message', w: 200, state: 'new' },
  ], values: false });
  S.add(sch.land(0, [300, 900]), 'b3');
  S.add(sch.land(1, [700, 900]), 'b3+0.3');
  S.add(sch.land(2, [1100, 900]), 'b3+0.6');
  S.add(sch.land(3, [1500, 900]), 'b3+0.9');
  S.add(sch.append({ label: 'answer', w: 180, state: 'cached' }), 'b3+1.6');
  S.add(sch.highlight(0, {}), 'b3+2');
  S.add(fx.out([st, sch], { d: 0.3, stagger: 0 }), 'b4-0.7');

  // ===== b4: reflow into a grid, middle-aligned wrap + split, multi-line highlight shrinking
  const many = libTokenStrip(S, { x: 160, y: 200, w: 90, size: 26, tokens: Array.from({ length: 16 }, (_, i) => ({ t: String(i + 1), icon: 'ph:puzzle-piece-duotone' })) });
  S.add(many.reveal('all', { every: 0.03 }), 'b4-0.3');
  S.add(many.relayout({ maxW: 4 * 100 - 10, x: 1300, y: 200 }), 'b4+0.8');
  const mid = libTokenStrip(S, { x: 620, y: 560, maxW: 900, align: 'middle', tokens: libTokenize('Ask a chatbot a question, and the answer streams out, one small piece at a time.') });
  S.add(fx.in(mid), 'b4-0.2');
  S.add(mid.highlight(12, { label: 'prefix' }), 'b4+0.6');
  S.add(mid.split(4, ['ques', 'tion']), 'b4+1.4');
  S.add(mid.highlight(3, { label: 'shorter' }), 'b4+2.2');
  S.add(mid.highlight(0), 'b4+3.0');
});
