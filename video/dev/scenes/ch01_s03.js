V.scene('ch01_s03', S => {
  const { fx } = S;
  // b1: chip and memory, then the bus
  const gpu = S.gpu({ x: 960, y: 520, scale: 1.45 });
  S.add(fx.in(gpu.substrate, { from: 'scale', scale: 0.92, d: 0.9 }), 'b1');
  S.add(fx.pop(gpu.die, { from: 0.7 }), 'b1~chip');
  S.add(fx.in(gpu.dieLabel, { from: 'up' }), 'b1~chip+0.3');
  S.add(fx.pop(gpu.stacks, { stagger: 0.07 }), 'b1~memory');
  S.add(fx.in([gpu.hbmLabel, gpu.hbmLabel2], { from: 'up' }), 'b1~memory+0.3');
  S.add(fx.pulse(gpu.stacks, { scale: 1.06 }), 'b1~weight');
  S.add(fx.pulse(gpu.die, { scale: 1.04 }), 'b1~arithmetic');
  S.add(fx.draw(gpu.buses, { d: 1.0, stagger: 0.05 }), 'b1~arithmetic+0.6');
  // b2: bytes stream across every bus
  gpu.buses.forEach((b, i) => S.flow({ d: b.__d, from: 'b2~cross', to: 'b3+1.5', speed: 420, every: 0.09, size: 5, color: 'bytes' }));
  const counter = S.counter({ x: 960, y: 940, size: 52, anchor: 'middle', color: 'bytes', value: 0, fmt: v => `${v.toFixed(0)} GB`, suffix: '' });
  const per = S.text('read per token', { x: 960, y: 992, size: 28, anchor: 'middle', color: 'muted' });
  S.add(fx.in([counter, per], { from: 'up' }), 'b2~hundred');
  S.add(fx.count(counter, 0, 140, { d: 2.4, ease: 'power1.inOut', fmt: v => `${v.toFixed(0)} GB` }), 'b2~hundred');
  // b3: zoom into the die: units waiting
  S.add(fx.out([counter, per], { d: 0.3 }), 'b3-0.2');
  S.add(fx.cam({ x: 960, y: 520, scale: 2.1, d: 1.6 }), 'b3~Zoom');
  const wait = S.text('waiting', { x: 960, y: 520, size: 34, anchor: 'middle', color: 'compute', weight: 650 }, S.hud);
  S.add(fx.in(wait, { from: 'fade' }), 'b3~waiting');
  // b4: the chart
  S.add(fx.out([gpu.g || gpu, wait], { d: 0.5 }), 'b3~chart');
  S.add(fx.cam({ x: 960, y: 540, scale: 1, d: 0.01 }), 'b3~chart+0.5');
  const ch = S.chart({ x: 300, y: 200, w: 1300, h: 640, xmin: 0.5, xmax: 5000, ymin: 1e12, ymax: 2e15, xlog: true, ylog: true,
    xticks: [1, 10, 100, 1000], yticks: [1e12, 1e13, 1e14, 1e15], xfmt: v => S.fmt.int(v), yfmt: S.fmt.pow10,
    xlabel: 'operations per byte', ylabel: 'operations per second' });
  S.add(fx.in(ch.axes, { from: 'fade', d: 0.6 }), 'b3~chart+0.6');
  const ridge = 989 / 3.35;
  const roof = ch.plot([[0.5, 3.35e12 * 0.5], [ridge, 989e12], [5000, 989e12]], { color: 'compute', sw: 5 });
  S.add(fx.draw(roof, { d: 1.4 }), 'b4-0.2');
  const dot = S.circle({ x: ch.X(1), y: ch.Y(3.35e12), r: 14, fill: 'bytes', filter: 'url(#glow-bytes)' });
  S.add(fx.pop(dot), 'b4~one');
  const lab = S.callout('decode · 1 op/byte', { x: ch.X(1) + 30, y: ch.Y(3.35e12) - 60, from: [ch.X(1), ch.Y(3.35e12) - 14], tone: 'bytes', size: 28 });
  S.add(fx.in(lab, { from: 'fade' }), 'b4~one+0.3');
  const rl = S.line({ x1: ch.X(ridge), y1: ch.Y(989e12), x2: ch.X(ridge), y2: ch.y + ch.h, stroke: 'compute', sw: 2, dash: '8 8' });
  const rlab = S.text('ridge 295', { x: ch.X(ridge), y: ch.Y(989e12) - 34, size: 28, anchor: 'middle', color: 'compute', weight: 650 });
  S.add(fx.draw(rl), 'b4~ridge');
  S.add(fx.in(rlab, { from: 'up' }), 'b4~ridge');
});
