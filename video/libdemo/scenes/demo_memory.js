/* demo_memory — lib/memory.js in its main states. Four pages, one per beat. */
V.scene('demo_memory', S => {
  const { fx } = S;

  // ---------------------------------------------------------------- b1: memory bars to scale
  const p1 = S.g();
  const SC = 1300 / 141;
  const h200 = libMemoryBar(S, { x: 220, y: 300, capacity: 141, scale: SC, title: 'H200 memory',
    segments: [{ id: 'weights', name: 'weights', gb: 140 }, { id: 'kv', name: 'KV cache', gb: 0, style: 'soft' }] }, p1);
  const h100 = libMemoryBar(S, { x: 220, y: 620, capacity: 80, scale: SC, title: 'H100 memory',
    segments: [{ id: 'weights', name: 'weights', gb: 140 }] }, p1);
  S.add(h200.in(), 'b1');
  S.add(h100.in(), 'b1+0.3');
  S.add(h200.grow('kv', 30, { d: 1.4 }), 'b1+1.1');
  S.add(h200.overflow(), 'b1+2.6');
  S.add(fx.out(p1, { d: 0.35 }), 'b2-0.45');

  // ---------------------------------------------------------------- b2-b3: KV cache
  const p2 = S.g();
  const kv = libKVCache(S, { x: 170, y: 460, slots: 16, filled: 8, label: 'KV cache', sub: 'one slab per token' }, p2);
  const st = libKVCache(S, { layout: 'stack', x: 1440, y: 360, slots: 9, filled: 3, tone: 'helps', frameTone: 'helps', label: 'key-value cache' }, p2);
  S.add(fx.in(p2, { from: 'fade', d: 0.4 }), 'b2-0.3');
  S.add(kv.append(8, { stagger: 0.2 }), 'b2+0.2');
  S.add(st.append(5, { stagger: 0.42 }), 'b2+0.2');
  S.add(kv.read(), 'b2+2.6');
  S.add(st.read(), 'b2+2.6');
  const pre = kv.reuse(10, { label: 'reused prefix' });
  S.add(pre, 'b3');
  S.add(kv.invalidate({ from: 10, to: 15 }, { stagger: 0.22 }), 'b3+1.1');
  S.add(kv.evict({ from: 10, to: 15 }, { stagger: 0.06 }), 'b3+2.7');
  S.add(st.evict({ from: 5, to: 7 }), 'b3+1.6');
  S.add(fx.out(p2, { d: 0.35 }), 'b4-0.45');

  // ---------------------------------------------------------------- b4: bytes moving
  const p4 = S.g();
  const bus = libByteStream(S, { x1: 560, y1: 560, x2: 1360, rate: '3.35 TB/s', rateSub: 'bandwidth', meter: true,
    source: { title: 'memory', sub: '140 GB' } }, p4);
  S.add(fx.in(p4, { from: 'fade', d: 0.4 }), 'b4-0.3');
  bus.flow('b4', 'end', { density: 'steady' });
  S.add(bus.pass({ amount: 140, count: true, d: 1.3 }), 'b4+0.5');
  S.add(bus.pass({ amount: 140, count: true, d: 0.9 }), 'b4+2.1');
});
