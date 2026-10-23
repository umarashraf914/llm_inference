/* Shared builders for chapter 1. Loaded before every ch01 scene. */

// The 40 weights of "the file". The first five are referenced by name in s01-s03; keep them exact.
// Every other value stays within -1..+1, so 1.44 is the one tile past the end of the range.
const CH01_VALUES = [
  0.13, -0.7, 0.02, 1.44, -0.3, 0.41, -0.05, 0.88, -0.92, 0.27,
  -0.18, 0.66, 0.09, -0.54, 0.31, -0.83, 0.12, 0.47, -0.26, 0.74,
  0.58, -0.11, -0.67, 0.21, 0.93, -0.39, 0.05, -0.72, 0.36, -0.08,
  -0.45, 0.19, 0.81, -0.97, 0.14, 0.52, -0.31, 0.63, -0.16, 0.29,
];

/** "0.13", "−0.7": a typographic minus, no leading plus. */
function ch01Fmt(v) {
  return (v < 0 ? '−' : '') + String(Math.abs(v)).replace(/^0(?=\.)/, '0');
}

/**
 * The 10 x 4 grid of weight tiles: blue tiles, violet text for negative values.
 * o: {cx, cy (centre), cw, ch, gap, size}. Returns {g, cells, at(r,c), w, h, x, y, cx, cy, values, cellCenter(i)}
 */
function ch01Tiles(S, o = {}) {
  const cw = o.cw ?? 98, ch = o.ch ?? 64, gap = o.gap ?? 12, cols = 10, rows = 4;
  const w = cols * (cw + gap) - gap, h = rows * (ch + gap) - gap;
  const x = (o.cx ?? 960) - w / 2, y = (o.cy ?? 470) - h / 2;
  const grid = S.grid({ x, y, rows, cols, cw, ch, gap, r: 10, tone: 'struct', values: CH01_VALUES, fmt: ch01Fmt, size: o.size ?? 24 }, o.parent);
  grid.cells.forEach((c, i) => { if (CH01_VALUES[i] < 0 && c.label) c.label.setAttribute('fill', S.tone('violet')); });
  return Object.assign(grid, {
    x, y, cx: x + w / 2, cy: y + h / 2, values: CH01_VALUES, cw, ch, gap,
    cellCenter: i => { const c = grid.cells[i]; return [c.cx, c.cy]; },
  });
}
