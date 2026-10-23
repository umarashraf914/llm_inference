V.scene('demo_tokens', S => {
  const { fx } = S;
  // b1: a sentence bar cut into tokens, an append, a split
  const s1 = libTokenStrip(S, { x: 960, y: 260, align: 'middle', tokens: ['the', ' quick', ' brown', ' fox', ' jumps'], joined: true, ids: true });
  S.add(fx.in(s1, { from: 'fade' }), 'b1');
  S.add(s1.cut(), 'b1+0.8');
  S.add(s1.showIds(), 'b1+1.8');
  S.add(s1.append(' over', { from: [1500, 700] }), 'b1+2.4');
  const s2 = libTokenStrip(S, { x: 960, y: 520, align: 'middle', tokens: ['unbelievably'] });
  S.add(fx.in(s2, { from: 'up' }), 'b1+0.5');
  S.add(s2.split(0, ['un', 'believ', 'ably']), 'b1+2');
  const t1 = libToken(S, { text: 'fox', x: 960, y: 760, id: 4271, idPos: 'inline' });
  S.add(t1.pop(), 'b1+1');
  S.add(t1.glow(), 'b1+2.5');
  S.add(fx.out([s1, s2, t1], { d: 0.4 }), 'b2-0.45');

  // b2: states, prefix highlight, wrap, stream
  const st = ['token', 'new', 'cached', 'prefill', 'recompute', 'changed', 'dim', 'ghost', 'slot', 'solid'];
  const s3 = libTokenStrip(S, { x: 960, y: 240, align: 'middle', tokens: st.map(k => ({ t: k, state: k })) });
  S.add(fx.in(s3, { from: 'up' }), 'b2');
  const s4 = libTokenStrip(S, { x: 200, y: 460, maxW: 1520, tokens: libTokenize('The capital of France is Paris, and its population is about two million people.'), hidden: true, slots: 2 });
  S.add(s4.reveal('all', { every: 0.05 }), 'b2+0.3');
  S.add(s4.highlight(5, { label: 'prefix' }), 'b2+1.5');
  S.add(s4.setState([0, 4], 'cached', { stagger: 0.05 }), 'b2+1.5');
  S.add(s4.stream([' Yes', '.'], { every: 0.3 }), 'b2+2.4');
  S.add(fx.out([s3, s4], { d: 0.4 }), 'b3-0.45');

  // b3: chat window
  const ANSWER = 'The sky looks blue because sunlight scatters off the air. Short wavelengths, the blues, scatter far more strongly than long ones, the reds, so blue light reaches your eyes from every direction.';
  const chat = libChatWindow(S, { x: 300, y: 150, w: 1320, h: 620, question: 'Why is the sky blue?', answer: ANSWER, splits: { wavelengths: ['wave', 'lengths'] }, composer: true });
  S.add(chat.drawOn(), 'b3-0.2');
  S.add(chat.typeQuestion(), 'b3+0.3');
  S.add(chat.stream({ count: 24, every: 0.06 }), 'b3+1.2');
  S.add(chat.pillify(18, 23), 'b3+2.8');
  S.add(chat.glow(19, 20), 'b3+3.1');
  S.add(fx.out(chat, { d: 0.4 }), 'b4-0.45');

  // b4: prompt stack
  const ps = libPromptStack(S, { x: 620, y: 260, scale: 0.25, layout: 'rows', total: true, stackAt: { x: 160, y: 700 },
    segments: [
      { label: "provider's system prompt", tokens: 2000, icon: 'ph:globe-duotone' },
      { label: 'tool definitions', tokens: 450 },
      { label: 'custom instructions', tokens: 300, icon: 'ph:user-circle-duotone' },
      { label: 'one loaded skill', tokens: 2000 },
    ] });
  S.add(ps.grow('all', { stagger: 0.3 }), 'b4');
  S.add(ps.toStack(), 'b4+1.4');
  S.add(ps.count(), 'b4+2.4');
});
