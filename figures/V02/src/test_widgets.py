"""Drive every V2 widget in Chromium and compare what it displays with the Python that drew it.

  python3 figures/V02/src/test_widgets.py <built atlas, e.g. atlases/V02_Inside_the_GPU.html>

p17 (latency hiding) at 305 settings, p18 (occupancy) at 705, p20 (stride) at all 192, and p36 (the
systolic array) at every beat, forwards and backwards; then each Reset button. Widths and other
rounded numbers are compared through common.fixed(), which rounds as JavaScript's toFixed does.
"""
import itertools, random, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import hiding as H          # noqa: E402
import coalesce as CO       # noqa: E402
import bets as BT           # noqa: E402
from common import fixed    # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

ATLAS = Path(sys.argv[1]).resolve()
random.seed(1)

SET = """([id, vals]) => { const fig = document.getElementById(id);
  const sl = [...fig.querySelectorAll('input[type=range]')];
  vals.forEach((v, i) => { sl[i].value = v; sl[i].dispatchEvent(new Event('input')); }); }"""
READ17 = """() => { const fig = document.getElementById('v02-p17'); const q = s => fig.querySelector(s);
  const rs = [...fig.querySelectorAll('[data-lanes] rect')].map(r => [r.getAttribute('x'), r.getAttribute('width'),
     r.getAttribute('y'), r.getAttribute('fill') === 'none' ? 'ghost' : r.parentNode.getAttribute('class')]);
  return [q('[data-busy]').textContent, q('[data-need]').textContent, q('[data-occ]').textContent, rs]; }"""
READ18 = """() => { const fig = document.getElementById('v02-p18'); const q = s => fig.querySelector(s);
  return [[0,1,2,3].map(i => q(`[data-v="${i}"]`).textContent),
          [0,1,2,3].map(i => q(`[data-bar="${i}"]`).parentNode.getAttribute('class')),
          q('[data-head]').textContent, q('[data-detail]').textContent]; }"""
SET20 = """([st, el]) => { const fig = document.getElementById('v02-p20');
  const sl = fig.querySelector('input[type=range]'); sl.value = st;
  [...fig.querySelectorAll('input[type=radio]')].forEach(r => r.checked = +r.value === el);
  sl.dispatchEvent(new Event('input')); }"""
READ20 = """() => { const fig = document.getElementById('v02-p20'); const q = s => fig.querySelector(s);
  const cells = [...fig.querySelectorAll('[data-cells] g.s rect')].map(r => r.getAttribute('width'));
  return [q('[data-sec]').textContent, q('[data-lin]').textContent, q('[data-use]').textContent,
          q('[data-pct]').textContent, q('[data-moved]').getAttribute('width'),
          q('[data-usedbar]').getAttribute('width'), cells]; }"""
READ36 = """() => { const fig = document.getElementById('v02-p36'); const q = s => fig.querySelector(s);
  const cells = [...fig.querySelectorAll('[data-cell]')].map(g => [g.dataset.cell, g.getAttribute('class'),
     g.querySelector('[data-calc]').textContent]);
  const queue = [...fig.querySelectorAll('[data-q]')].map(g => [g.dataset.q,
     g.style.display === 'none' ? null : g.querySelector('text').textContent]);
  const out = [...fig.querySelectorAll('[data-out]')].map(g => [g.dataset.out, g.getAttribute('class'),
     g.querySelector('text').textContent]);
  const [back, step] = fig.querySelectorAll('button');
  return [cells, queue, out, q('[data-read]').textContent, back.disabled, step.disabled]; }"""
CLICK36 = """(n) => { const b = [...document.querySelectorAll('#v02-p36 button')]; b[n].click(); }"""


def py17(w, c, l):
    r = H.readouts(w, c, l)
    rs = []
    for kind, row, a, b in H.schedule(w, c, l):
        x, wd = H.tx_(a), H.tx_(b) - H.tx_(a)
        y = 50 if row < 0 else H.ROW0 + row * H.ROWH
        rs.append([fixed(x), fixed(wd), str(y), "ghost" if kind in ("queued", "idle") else ("m" if kind == "issue" else "h")])
    return [r["busy"], r["need"], r["occ"], rs]


def py18(t, r, s):
    rows, head, detail, binding, lim, wpb = H.p18_text(t, r, s)
    order = ["registers", "shared memory", "64-warp limit", "32-block limit"]
    return [[rows[k] for k in order], ["h" if k in binding else "u" for k in order], head, detail]


def py20(st, el):
    r, a = CO.p20_read(st, el), CO.access(st, el)
    return [r["sec"], r["lin"], r["use"], r["pct"], fixed(a["moved"] / 1024 * 440), fixed(a["used"] / 1024 * 440),
            [fixed((CO.SW - 2) * s) for s in CO.p20_cells(st, el)]]


def py36(s):
    cells, queue, out, macs, read = BT.state(s)
    return [[[f"{k}-{j}", c, calc] for (k, j), (c, calc) in sorted(cells.items())],
            [[f"{k}-{m}", v] for (k, m), v in sorted(queue.items())],
            [[f"{i}-{j}", "s" if v else "u", v or ""] for (i, j), v in sorted(out.items())],
            read, s == 0, s == BT.T]


def sort36(got):
    cells, queue, out, read, b0, b1 = got
    return [sorted(cells), sorted(queue), sorted(out), read, b0, b1]


with sync_playwright() as p:
    br = p.chromium.launch()
    pg = br.new_page()
    pg.goto(ATLAS.as_uri())
    pg.wait_for_timeout(300)

    n17 = 0
    cases = [(16, 32, 479), (16, 8, 479), (16, 16, 479), (1, 4, 100), (16, 64, 1000)]
    cases += [(random.randint(1, 16), random.choice(range(4, 65, 4)), random.randint(100, 1000)) for _ in range(300)]
    for w, c, l in cases:
        pg.evaluate(SET, ["v02-p17", [w, c, l]])
        got, want = pg.evaluate(READ17), py17(w, c, l)
        js_rects = [[a, b_, str(int(float(y))) if y else y, k] for a, b_, y, k in got[3]]
        assert got[:3] == want[:3], (w, c, l, got[:3], want[:3])
        assert js_rects == want[3], (w, c, l, len(js_rects), len(want[3]))
        n17 += 1

    n18 = 0
    grid = list(itertools.product(range(32, 1025, 32), (16, 32, 37, 40, 64, 72, 96, 128, 168, 200, 255),
                                  (0, 1, 8, 16, 24, 48, 64, 100, 164, 227)))
    for t, r, s in random.sample(grid, 700) + [(128, 64, 48), (256, 128, 0), (256, 32, 0), (1024, 64, 0), (1024, 72, 0)]:
        pg.evaluate(SET, ["v02-p18", [t, r, s]])
        got, want = pg.evaluate(READ18), py18(t, r, s)
        assert got == want, (t, r, s, got, want)
        n18 += 1

    n20 = 0
    for el in (2, 4, 8):
        for st in range(1, 65):
            pg.evaluate(SET20, [st, el])
            got, want = pg.evaluate(READ20), py20(st, el)
            assert got == want, (st, el, got, want)
            n20 += 1

    assert sort36(pg.evaluate(READ36)) == sort36(py36(0)), "p36 initial state"
    n36 = 0
    for s in range(1, BT.T + 1):                     # forwards, one beat at a time
        pg.evaluate(CLICK36, 1)
        assert sort36(pg.evaluate(READ36)) == sort36(py36(s)), ("forward", s)
        n36 += 1
    pg.evaluate(CLICK36, 1)                          # Next at the end changes nothing
    assert sort36(pg.evaluate(READ36)) == sort36(py36(BT.T))
    for s in range(BT.T - 1, -1, -1):                # and backwards
        pg.evaluate(CLICK36, 0)
        assert sort36(pg.evaluate(READ36)) == sort36(py36(s)), ("back", s)
        n36 += 1
    for _ in range(4):
        pg.evaluate(CLICK36, 1)
    pg.evaluate(CLICK36, 2)                          # Reset
    assert sort36(pg.evaluate(READ36)) == sort36(py36(0))

    pg.evaluate("() => ['#v02-p17', '#v02-p18', '#v02-p20'].forEach(s => document.querySelector(s + ' button').click())")
    assert pg.evaluate(READ17)[:3] == py17(16, 32, 479)[:3] and pg.evaluate(READ18) == py18(128, 64, 48)
    assert pg.evaluate(READ20)[:4] == py20(CO.S0, CO.E0)[:4]
    br.close()

print(f"p17: {n17} settings, p18: {n18}, p20: {n20}, p36: {n36} beats: all match Python; resets ok")
