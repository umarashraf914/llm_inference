/* ch02_s06 · everything between those two boxes (fig 15)
   A trained checkpoint on the left, a service that responds on the right: the whole film is the gap. */
V.scene('ch02_s06', S => {
  const { fx } = S;
  const Y = 520, H = 280;
  const L = { x: 180, w: 580 }, R = { x: 1160, w: 580 };

  // the camera eases out from the empty centre
  S.add(fx.cam({ x: 960, y: Y, scale: 1.7, d: 0.01 }), 0);
  S.add(fx.cam({ scale: 1, d: 1.8, ease: 'power2.inOut' }), 'b1-0.2');

  const box = (o, title, sub) => {
    const g = S.g();
    S.rect({ x: o.x, y: Y - H / 2, w: o.w, h: H, r: 26, fill: '#0c1326' }, g);
    g.bg = S.rect({ x: o.x, y: Y - H / 2, w: o.w, h: H, r: 26, fill: 'url(#card-struct)', stroke: 'struct', sw: 2.5, strokeOpacity: 0.85 }, g);
    g.title = S.text(title, { x: o.x + o.w / 2, y: Y - H / 2 + 50, size: 38, anchor: 'middle', weight: 700, family: 'display', color: 'ink' }, g);
    g.sub = S.text(sub, { x: o.x + o.w / 2, y: Y - H / 2 + 94, size: 28, anchor: 'middle', color: 'muted', weight: 550 }, g);
    return g;
  };
  // ---------------------------------------------------------------- b1: a checkpoint; a service
  const left = box(L, 'A trained checkpoint', 'weights on disk');
  S.icon('ph:hard-drives-duotone', { x: L.x + 120, y: Y + 70, size: 72, color: 'struct' }, left);
  S.rect({ x: L.x + 180, y: Y + 48, w: 300, h: 44, r: 6, fill: 'url(#bar-bytes)' }, left);
  S.text('140 GB', { x: L.x + 330, y: Y + 71, size: 26, anchor: 'middle', family: 'mono', weight: 700, color: '#0a0f1e' }, left);
  S.add(fx.in(left, { from: 'up', d: 0.6 }), 'b1~a trained-0.1');

  const right = box(R, 'A service that responds', 'a token every 30 ms');
  // a chat bubble streaming words at a true 30 ms beat
  const BUB = { x: R.x + 40, y: Y + 26, w: R.w - 80, h: 90 };
  S.rect({ x: BUB.x, y: BUB.y, w: BUB.w, h: BUB.h, r: 18, fill: '#0c1326', stroke: 'struct', sw: 1.5, strokeOpacity: 0.6 }, right);
  const line1 = S.text('', { x: BUB.x + 22, y: BUB.y + 30, size: 22, color: 'ink', weight: 500, case: 'keep' }, right);   // the service's answers, as written
  const line2 = S.text('', { x: BUB.x + 22, y: BUB.y + 62, size: 22, color: 'ink', weight: 500, case: 'keep' }, right);
  S.add(fx.in(right, { from: 'up', d: 0.6 }), 'b1~a service-0.1');
  const user = S.icon('ph:user-circle-duotone', { x: 1800, y: Y, size: 60, color: 'struct' });
  S.add(fx.in(user, { from: 'fade', d: 0.4 }), 'b1~responds');
  const ANSWERS = [
    'The sky looks blue because sunlight | scatters off air, blue light the most.',
    'Paris is the capital of France, | on the river Seine.',
    'A token is a small piece of text, | often a word or part of one.',
  ];
  const T0 = S.t('b1~responds'), STEP = 0.03;
  const paint = t => {
    let u = t - T0;
    if (u < 0) { line1.textContent = ''; line2.textContent = ''; return; }
    const total = ANSWERS.reduce((s, a) => s + a.split(' ').length * STEP + 1.6, 0);
    u = u % total;                       // the service keeps answering, one answer after another
    for (const a of ANSWERS) {
      const words = a.split(' ');
      const dur = words.length * STEP + 1.6;
      if (u < dur) {
        const n = Math.min(words.length, Math.floor(u / STEP) + 1);
        const shown = words.slice(0, n).join(' ').split('|');
        line1.textContent = shown[0].trim();
        line2.textContent = (shown[1] || '').trim();
        return;
      }
      u -= dur;
    }
  };
  const clock = { t: 0 };
  S.add(gsap.fromTo(clock, { t: 0 }, { t: S.duration, duration: S.duration, ease: 'none', immediateRender: false, onUpdate: () => paint(clock.t) }), 0);

  // ---------------------------------------------------------------- b2: training made it; serving it is its own discipline
  const done = S.text('training: done', { x: L.x + L.w / 2, y: Y - H / 2 - 34, size: 26, anchor: 'middle', color: 'muted', weight: 550 });
  S.add(fx.in(done, { from: 'down', d: 0.4 }), 'b2~Training');
  S.add(gsap.to(done, { opacity: 0.5, duration: 0.4 }), 'b2~checkpoint');
  // the arrow joins the two boxes through their middle; the 'inference' band takes the lower half of the gap
  const arrow = S.arrow({ x1: L.x + L.w + 14, y1: Y, x2: R.x - 14, y2: Y, color: 'ink', sw: 4, head: 18 });
  S.set(arrow, { autoAlpha: 0 }, 0);
  S.add(gsap.set(arrow, { autoAlpha: 1 }), 'b2~Turning');
  S.add(fx.drawArrow(arrow, { d: 0.6 }), 'b2~Turning');
  S.add(fx.pulse(user, { scale: 1.2, d: 0.5 }), 'b2~talk');
  const price = S.icon('ph:tag-duotone', { x: 960, y: Y - 52, size: 48, color: 'helps' });
  S.add(fx.pop(price), 'b2~a price');

  // ---------------------------------------------------------------- b3: the reading holds the gap at 30 ms; inference
  S.flow({ d: `M${L.x + L.w + 20},${Y} L${R.x - 30},${Y}`, from: 'b3~the reading', to: 'end', speed: 260, every: 0.1, size: 6, color: 'bytes' });
  const ghost = S.text('0.1 ms?', { x: R.x + R.w / 2 + 210, y: Y - H / 2 + 94, size: 26, anchor: 'middle', color: 'compute', weight: 650 });
  S.set(ghost, { autoAlpha: 0 }, 0);
  S.add(gsap.fromTo(ghost, { autoAlpha: 0 }, { autoAlpha: 0.8, duration: 0.15, yoyo: true, repeat: 3 }), 'b3~not');
  const brk = S.path({ d: `M${L.x + L.w},${Y + 150} l0,14 L${R.x},${Y + 164} l0,-14`, stroke: 'muted', sw: 2.5 });
  S.set(brk, { autoAlpha: 0 }, 0);
  S.add(gsap.set(brk, { autoAlpha: 1 }), 'b3~the gap');
  S.add(fx.draw(brk, { d: 0.5 }), 'b3~the gap');
  S.add(gsap.fromTo(right.sub, { filter: 'none' }, { filter: 'url(#glow-struct)', duration: 0.4, yoyo: true, repeat: 1 }), 'b3~thirty');
  S.add(fx.out(brk, { d: 0.4 }), 'b3~the rest');
  const bandG = S.g();
  S.rect({ x: L.x + L.w + 16, y: Y + 36, w: R.x - L.x - L.w - 32, h: 104, r: 20, fill: 'ink', fillOpacity: 0.08, stroke: 'ink', strokeOpacity: 0.25, sw: 1.5 }, bandG);
  S.text('inference', { x: 960, y: Y + 88, size: 58, anchor: 'middle', weight: 700, family: 'display', color: 'ink' }, bandG);
  S.add(fx.in(bandG, { from: 'fade', d: 0.6 }), 'b3~inference-0.1');
});
