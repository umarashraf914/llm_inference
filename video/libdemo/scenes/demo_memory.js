/* demo_memory — lib/memory.js in its main states, one page per beat.
   b1  libMemoryBar: H200 (KV cache grows past the rim), H100 (overhang) and a block resized to scale
   b2  libKVCache: row (append, read), stack, tokens × layers grid, block pool
   b3  libKVCache: reuse (teal prefix), invalidate, evict; grid layers; pool: yours, LRU eviction, newcomers
   b4  libByteStream: rate counts, flow, two 140 GB passes with a meter; a pipe pouring into a bucket
       (a vertical libMemoryBar with marker and span); a narrow laptop pipe */
V.scene('demo_memory', S => {
  const { fx } = S;

  // ---------------------------------------------------------------- b1: capacity, to scale
  const p1 = S.g();
  const SC = 1240 / 141;                                   // px per GB, shared by every bar on the page
  const h200 = libMemoryBar(S, { x: 220, y: 250, capacity: 141, scale: SC, title: 'H200 memory',
    segments: [{ id: 'weights', gb: 140 }, { id: 'kv', name: 'KV cache', gb: 0, style: 'soft' }] }, p1);
  const h100 = libMemoryBar(S, { x: 220, y: 530, capacity: 80, scale: SC, title: 'H100 memory',
    segments: [{ id: 'weights', gb: 140 }] }, p1);
  const blkLabel = S.text('weights at 16 bits', { x: 220, y: 766, size: 30, weight: 650 }, p1);
  const blk = libMemBlock(S, { x: 220, y: 810, w: 140 * SC, h: 64, gb: 140, size: 28 }, p1);
  S.add(h200.in(), 'b1-0.2');
  S.add(h100.in(), 'b1+0.1');
  S.add(fx.in([blkLabel, blk], { from: 'left', d: 0.6 }), 'b1+0.3');
  S.add(h200.grow('kv', 30, { d: 1.4 }), 'b1+0.9');
  S.add(h200.overflow(), 'b1+2.4');
  S.add(blk.resize(70, { d: 0.7 }), 'b1+1.4');
  S.add(fx.swap(blkLabel, 'weights at 8 bits'), 'b1+1.4');
  S.add(blk.resize(35, { d: 0.7 }), 'b1+2.5');
  S.add(fx.swap(blkLabel, 'weights at 4 bits'), 'b1+2.5');
  S.add(fx.out(p1, { d: 0.35 }), 'b2-0.45');

  // ---------------------------------------------------------------- b2-b3: the KV cache
  const p2 = S.g();
  const row = libKVCache(S, { x: 170, y: 250, slots: 16, filled: 8, sub: 'one slab per token' }, p2);
  const stack = libKVCache(S, { layout: 'stack', x: 1500, y: 236, slots: 9, filled: 3, tone: 'helps', frameTone: 'helps', label: 'key-value cache' }, p2);
  const grid = libKVCache(S, { layout: 'grid', x: 270, y: 580, slots: 8, layers: 6, filled: 5, label: 'tokens × layers', legend: true,
    tokens: ['t1', 'XX', 't3', 't4', 't5', 't6', 't7', 't8'] }, p2);
  const pool = libKVCache(S, { x: 900, y: 600, slots: 24, perRow: 8, filled: 16, cw: 48, ch: 48, gap: 8, label: "one machine's cache" }, p2);
  S.add(fx.in(p2, { from: 'fade', d: 0.4 }), 'b2-0.3');
  S.add(row.append(8, { stagger: 0.2 }), 'b2+0.2');
  S.add(stack.append(5, { stagger: 0.4 }), 'b2+0.2');
  S.add(grid.append(3, { stagger: 0.35 }), 'b2+0.4');
  S.add(pool.append(8, { stagger: 0.08, from: 'right' }), 'b2+1.0');
  S.add(row.read(), 'b2+2.6');
  S.add(stack.read(), 'b2+2.6');
  // b3
  S.add(row.reuse(10, { label: 'reused prefix' }), 'b3');
  S.add(row.invalidate({ from: 10, to: 15 }, { stagger: 0.18 }), 'b3+1.0');
  S.add(row.evict({ from: 12, to: 15 }, { stagger: 0.06 }), 'b3+2.6');
  S.add(grid.tint(0, 'helps'), 'b3');
  S.add(grid.invalidate(1), 'b3+0.4');
  S.add(grid.invalidate({ from: 2, to: 7 }, { layers: { from: 1, to: 5 }, stagger: 0.12 }), 'b3+0.9');
  S.add(stack.evict({ from: 6, to: 7 }), 'b3+1.2');
  S.add(pool.mark([0, 1, 2]), 'b3');
  S.add(pool.evict([3, 4, 5, 6], { grey: true, stagger: 0.08 }), 'b3+0.8');
  S.add(pool.fill([3, 4, 5, 6], { tone: 'neutral', from: 'right', stagger: 0.08 }), 'b3+2.0');
  S.add(fx.out(p2, { d: 0.35 }), 'b4-0.45');

  // ---------------------------------------------------------------- b4: bytes moving
  const p4 = S.g();
  const bus = libByteStream(S, { x1: 560, y1: 380, x2: 1120, rate: '0.00 TB/s', rateSub: 'bandwidth', meter: true,
    source: { w: 180, h: 180, sub: '140 GB' }, sink: { w: 170, h: 170 } }, p4);
  const bucket = libMemoryBar(S, { vertical: true, x: 1560, y: 330, w: 130, h: 480, capacity: 150, capLabel: false, free: false, title: 'in 30 ms',
    segments: [{ id: 'fill', name: '', gb: 0, dec: 1 }] }, p4);
  const pour = libByteStream(S, { x1: 1625, y1: 150, x2: 1625, y2: 318, width: 44, source: false, sink: false, rate: '3.35 TB/s', rateSide: 'left', rateSize: 30 }, p4);
  const laptop = libByteStream(S, { x1: 520, y1: 760, x2: 1120, width: 12, rate: '≈ 0 GB/s', rateSize: 30,
    source: { w: 150, h: 120, label: 'laptop', sub: 'memory', layers: 4, size: 28 }, sink: { w: 120, h: 120 } }, p4);
  S.add(fx.in(p4, { from: 'fade', d: 0.4 }), 'b4-0.3');
  S.add(bus.countRate(4.8, { d: 0.9 }), 'b4');
  bus.flow('b4+0.2', 'end', { density: 'steady' });
  S.add(bus.pass({ amount: 140, count: true, d: 1.2 }), 'b4+0.9');
  S.add(bus.pass({ amount: 140, count: true, d: 0.8 }), 'b4+2.3');
  pour.flow('b4+0.2', 'b4+1.9', { density: 'dense', speed: 420 });
  S.add(bucket.grow('fill', 100.5, { d: 1.6, ease: 'none' }), 'b4+0.5');
  const need = bucket.marker(140, { label: '140 GB needed', side: 'left' });
  const short = bucket.span(100.5, 140, { label: '≈ 40 GB short', side: 'left' });
  S.add(fx.in(need, { from: 'fade', d: 0.4 }), 'b4+2.2');
  S.add(fx.in(short, { from: 'fade', d: 0.4 }), 'b4+2.6');
  S.add(laptop.countRate(96, { d: 1.0 }), 'b4+0.3');
  S.add(laptop.setRate('≈ 100 GB/s'), 'b4+1.6');
  laptop.flow('b4+0.2', 'end', { density: 'trickle', speed: 700, size: 3.5 });
});
