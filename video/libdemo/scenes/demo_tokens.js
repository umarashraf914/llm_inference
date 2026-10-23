/* demo_tokens · the tokens library (lib/tokens.js) in its main states.
   b1: a sentence cut into tokens, IDs, an append riding a return path, a split, a column reflow, single chips, bubbles.
   b2: every colour state, a wrapped strip with a prefix highlight and slots, a reorder, a sliding context window.
   b3: the chat window: question typed, answer streamed, six newest tokens as pills, a split bracket, ghosts.
   b4: the prompt stack: rows grow, slide into one bar, total counts, cached prefix; a context window to scale. */
V.scene('demo_tokens', S => {
  const { fx } = S;

  // ================================================================ b1
  // Row A: a sentence bar is cut into tokens, IDs appear, ' over' rides a return path to the end
  const A = libTokenStrip(S, { x: 960, y: 200, align: 'middle', tokens: ['the', ' quick', ' brown', ' fox', ' jumps'], joined: true, ids: true });
  S.add(fx.in(A, { from: 'fade', d: 0.5 }), 'b1-0.4');
  S.add(A.cut(), 'b1+0.2');
  S.add(A.showIds(), 'b1+1.1');
  const land = A.next(' over');
  const via = `M${land.x + 300},${land.y + 150} C${land.x + 300},${land.y} ${land.x + 150},${land.y} ${land.x},${land.y}`;
  const ret = S.path({ d: via, stroke: 'faint', sw: 2.5 }, S.layers.back);   // behind the chips that ride it
  ret.setAttribute('data-audit', 'ignore');   // a guide the chip rides: it runs under the chip by design
  S.add(fx.draw(ret, { d: 0.5 }), 'b1+1.3');
  S.add(A.append(' over', { via, d: 0.9 }), 'b1+1.7');
  S.add(fx.out(ret, { d: 0.3 }), 'b1+2.7');

  // Row B: one word splits into three tokens; a bracket says so
  const B = libTokenStrip(S, { x: 180, y: 420, tokens: ['unbelievably'] });
  S.add(fx.in(B, { from: 'up' }), 'b1');
  S.add(B.split(0, ['un', 'believ', 'ably']), 'b1+0.9');
  const bB = B.bracket(0, 2, { label: 'one word, three tokens' });
  S.add(bB.drawOn(), 'b1+1.9');

  // Row B right: a row reflows into a column
  const Cc = libTokenStrip(S, { x: 1000, y: 420, tokens: ['the', 'cat', 'sat', 'down'] });
  S.add(fx.in(Cc, { from: 'up' }), 'b1+0.1');
  S.add(Cc.relayout({ vertical: true, x: 1640, y: 330 }), 'b1+1.4');
  S.add(Cc.setState(3, 'new'), 'b1+2.4');

  // Row C: single chips
  const fox = libToken(S, { text: 'fox', x: 230, y: 660, id: 4271, idPos: 'inline', idHidden: true });
  S.add(fox.pop(), 'b1+0.2');
  S.add(fox.showId(), 'b1+1.0');
  S.add(fox.glowId(), 'b1+1.7');
  const bank = libToken(S, { text: 'bank', x: 560, y: 660 });
  S.add(bank.pop(), 'b1+0.3');
  S.add(bank.stripe(['helps']), 'b1+1.4');
  const dog = libToken(S, { text: 'dog', x: 740, y: 660 });
  S.add(dog.pop(), 'b1+0.4');
  S.add(dog.badge('2'), 'b1+1.5');
  const stop = libToken(S, { text: 'stop', x: 900, y: 660, state: 'stop' });
  S.add(stop.pop(), 'b1+0.5');
  const ell = libToken(S, { text: '…', x: 1020, y: 660, state: 'plain' });
  S.add(ell.pop(), 'b1+0.6');
  const skill = libToken(S, { text: '2', x: 1140, y: 660, icon: 'ph:puzzle-piece-duotone' });
  S.add(skill.pop(), 'b1+0.7');
  const pkt = libToken(S, { text: 'Sunny', x: 1310, y: 660, frame: true });
  S.add(pkt.pop(), 'b1+0.8');
  const t9 = libToken(S, { text: 't9', x: 1480, y: 660, state: 'new' });
  S.add(t9.pop(), 'b1+0.9');
  const xx = libToken(S, { text: 't2', x: 1620, y: 660 });
  S.add(xx.pop(), 'b1+1.0');
  S.add(xx.swap('XX', { state: 'changed' }), 'b1+2.0');

  // Row D: speech bubbles
  const ask = libBubble(S, { text: 'weather tomorrow?', x: 560, y: 860, avatar: true });
  S.add(ask.pop(), 'b1+0.4');
  S.add(ask.type(), 'b1+0.55');
  const reply = libBubble(S, { text: 'Sunny, 18 °C', x: 1260, y: 860, tone: 'struct', avatar: 'ph:sparkle-fill' });
  S.add(reply.pop(), 'b1+1.6');
  S.add(reply.glow(), 'b1+2.3');

  S.add(fx.out([A, B, bB, Cc, fox, bank, dog, stop, ell, skill, pkt, t9, xx, ask, reply], { d: 0.3, stagger: 0 }), 'b2-0.7');

  // ================================================================ b2
  // Row A: every state
  const ST = ['token', 'new', 'cached', 'prefill', 'recompute', 'changed', 'bytes', 'dim', 'ghost', 'slot', 'solid', 'stop'];
  const G = libTokenStrip(S, { x: 960, y: 190, align: 'middle', size: 26, gap: 12, tokens: ST.map(k => ({ t: k === 'slot' ? '' : k, state: k })) });
  S.add(G.reveal('all', { every: 0.04 }), 'b2-0.3');

  // Row B: a wrapped strip with a growing prefix and two slots that fill
  const W = libTokenStrip(S, { x: 200, y: 360, maxW: 1520, tokens: libTokenize('The capital of France is Paris, and its population is about two million people'), slots: 2, hidden: true });
  S.add(W.reveal('all', { every: 0.035 }), 'b2');
  S.add(W.setState([0, 4], 'cached', { stagger: 0.06 }), 'b2+1.0');
  S.add(W.highlight(5, { label: 'prefix' }), 'b2+1.0');
  S.add(W.stream([' today', '?'], { every: 0.35 }), 'b2+1.9');
  S.add(W.highlight(9, { label: 'prefix: 9 tokens' }), 'b2+2.6');

  // Row C: the newest message jumps to the front
  const Rr = libTokenStrip(S, { x: 200, y: 640, size: 28, tokens: [{ t: "provider's prompt", state: 'cached' }, { t: 'your instructions' }, { t: 'conversation' }, { t: 'newest message', state: 'new' }] });
  S.add(fx.in(Rr, { from: 'up' }), 'b2+0.2');
  S.add(Rr.reorder([3, 0, 1, 2]), 'b2+1.3');
  S.add(Rr.reorder([1, 2, 3, 0]), 'b2+2.5');

  // Row D: a sliding context window of 8
  const Wn = libTokenStrip(S, { x: 200, y: 850, w: 96, tokens: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'], window: { n: 8, label: 'context length' }, state: 'token' });
  S.add(fx.in(Wn, { from: 'up' }), 'b2+0.3');
  S.add(Wn.push('t9', { keep: 8 }), 'b2+1.1');
  S.add(Wn.push('t10', { keep: 8 }), 'b2+1.7');
  S.add(Wn.push('t11', { keep: 8 }), 'b2+2.3');
  S.add(Wn.solidWindow(), 'b2+2.9');
  const fr = Wn.fallenRow();
  const reach = S.text('out of reach', { x: fr.x1 + 3 * (96 + 10) + 14, y: fr.cy + 1, size: 26, weight: 550, color: 'muted' });
  S.add(fx.in(reach, { from: 'left', d: 0.5 }), 'b2+1.9');
  // a column of shades (different users' requests)
  const Sh = libTokenStrip(S, { x: 1500, y: 850, tokens: ['', '', '', '', '', ''], shades: 3, w: 44, gap: 8 });
  S.add(Sh.reveal('all', { every: 0.06 }), 'b2+0.6');

  S.add(fx.out([G, W, Rr, Wn, Sh, reach], { d: 0.3, stagger: 0 }), 'b3-0.75');

  // ================================================================ b3: chat window
  const ANSWER = 'The sky looks blue because sunlight scatters off the air. Short wavelengths, the blues, scatter far more strongly than long ones, the reds, so blue light reaches your eyes from every direction.';
  const chat = libChatWindow(S, { x: 260, y: 150, w: 1400, h: 660, question: 'Why is the sky blue?', answer: ANSWER, splits: { wavelengths: ['wave', 'lengths'] }, composer: true });
  S.add(chat.drawOn({ d: 0.6 }), 'b3-0.4');
  S.add(chat.typeQuestion({ d: 0.7 }), 'b3');
  S.add(chat.send(), 'b3+0.75');
  const kb = chat.find(' blues');
  S.add(chat.stream({ to: kb + 1, every: 0.05 }), 'b3+0.9');
  S.add(chat.pillify(kb - 5, kb), 'b3+2.0');
  S.add(chat.dimTokens(0, kb - 6), 'b3+2.0');
  S.add(chat.glow(kb - 4, kb - 3, { hold: 1.1 }), 'b3+2.4');
  const cb = chat.bracket(kb - 4, kb - 3, { label: 'one word, two tokens' });
  S.add(cb.drawOn(), 'b3+2.5');
  S.add(chat.ghosts(kb + 1, kb + 9), 'b3+2.9');
  S.add(fx.out(chat, { d: 0.3 }), 'b4-0.75');

  // ================================================================ b4: prompt stack
  const ps = libPromptStack(S, { x: 160, y: 660, scale: 0.25, rows: { x: 780, y: 210 }, total: true, segments: [
    { label: "provider's system prompt", tokens: 2000, icon: 'ph:globe-duotone' },
    { label: 'tool definitions', tokens: 450 },
    { label: 'custom instructions', tokens: 300, icon: 'ph:user-circle-duotone' },
    { label: 'one loaded skill', tokens: 2000 },
  ] });
  S.add(ps.grow('all', { stagger: 0.22 }), 'b4-0.4');
  S.add(ps.toStack({ d: 0.9 }), 'b4+1.0');
  S.add(ps.count({ d: 0.9 }), 'b4+1.9');
  S.add(ps.highlight(2000, { label: 'cached prefix' }), 'b4+2.3');

  const cap = libPromptStack(S, { x: 160, y: 880, h: 40, scale: 0.008, capacity: 200000, labels: 'none', values: false, segments: [
    { tokens: 4750 }, { tokens: 80000, state: 'prefill' },
  ] });
  S.add(cap.showFrame(), 'b4+0.6');
  S.add(cap.grow('all', { stagger: 0.3 }), 'b4+1.0');
  S.add(cap.notch(84750, { label: '84,750 of 200,000' }), 'b4+2.2');
});
