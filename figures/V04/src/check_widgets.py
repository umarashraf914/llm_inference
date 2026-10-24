"""Drive each V4 widget in a headless browser and compare every number it displays with the Python
that drew it. Run after building the atlas:

  python3 figures/V04/src/check_widgets.py BUILT_ATLAS.html [widget ...]

Each check clicks or drags the real controls, reads the page's text back, and compares it with the
reference functions in the part scripts, string for string.
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))


def check_p02w(page):
    """Walk all 65,536 FP16 patterns by a Gray code from 6.5: one click flips one bit each step."""
    from part2_flip import decode_strings, START
    got = page.evaluate("""() => {
      const fig = document.getElementById('v04-p02w');
      fig.querySelector('button[data-reset]').click();
      const cells = [...fig.querySelectorAll('[data-bit]')];
      const rows = [...Array(6).keys()].map(i => fig.querySelector(`[data-row="${i}"]`));
      const read = () => [cells.map(c => c.querySelector('text').textContent).join(''),
                          ...rows.map(r => r.textContent)];
      const out = [read()];
      for (let i = 1; i < 65536; i++) {
        let t = 0; while (!((i >> t) & 1)) t++;          // the bit a Gray code flips at step i
        cells[15 - t].dispatchEvent(new MouseEvent('click', {bubbles: true}));
        out.push(read());
      }
      return out;
    }""")
    bad, w = 0, START
    for i, row in enumerate(got):
        if i:
            t = (i & -i).bit_length() - 1
            w ^= 1 << t
        want = [format(w, "016b")] + decode_strings(w)
        if row != want:
            bad += 1
            if bad <= 5:
                print("  p02w mismatch at", hex(w), row, want)
    seen = len({r[0] for r in got})
    print(f"p02w: {len(got)} patterns read, {seen} distinct, {bad} mismatches")
    return bad == 0 and seen == 65536


def check_p14(page):
    """Every n from 4 to 4,096, for the first four toss sequences: readouts, bar counts, bar heights."""
    from part4_coins import frame, HMAX, SEED0
    from common import f
    bad = 0
    for s in range(SEED0, SEED0 + 4):
        got = page.evaluate("""(s) => {
          const fig = document.getElementById('v04-p14'), sl = fig.querySelector('input[type=range]');
          fig.querySelector('button[data-reset]').click();
          for (let k = 1; k < s; k++) fig.querySelector('button[data-again]').click();
          const out = [];
          for (let K = 2; K <= 12; K++) {
            sl.value = K; sl.dispatchEvent(new Event('input'));
            const q = sel => fig.querySelector(sel).textContent;
            const bars = sel => [...fig.querySelectorAll(sel)].map(e => [+e.dataset.count, e.getAttribute('height')]);
            out.push({K, val: fig.querySelector('.val').textContent, rms: q('[data-k="rms"]'), root: q('[data-k="root"]'),
                      worst: q('[data-k="worst"]'), lo: q('[data-k="lo"]'), hi: q('[data-k="hi"]'),
                      h1: bars('[data-h1]'), h2: bars('[data-h2]')});
          }
          return out;
        }""", s)
        for g in got:
            fr = frame(s, g["K"])
            want = {"val": fr["worst"], "rms": fr["rms"], "root": fr["root"], "worst": fr["worst"],
                    "lo": "−" + fr["worst"], "hi": fr["worst"]}
            for k, v in want.items():
                if g[k] != v:
                    bad += 1
                    print("  p14", s, g["K"], k, g[k], "!=", v)
            for key in ("h1", "h2"):
                m = max(fr[key])
                exp = [[c, f(c / m * HMAX, 2)] for c in fr[key]]      # half up, as toFixed
                for (gc, gh), (ec, eh) in zip(g[key], exp):
                    if gc != ec or gh != eh:
                        bad += 1
                        if bad < 8:
                            print("  p14", s, g["K"], key, gc, gh, ec, eh)
    print(f"p14: 4 toss sequences x 11 settings checked, {bad} mismatches")
    return bad == 0


def check_p19(page):
    """All 21 settings of 'how closely input 2 follows input 1' against seven nudges."""
    from part7_parabola import frame
    from common import f
    rhos = [f"{k / 20:g}" for k in range(21)]
    ds = ["-0.4", "-0.2", "0", "0.1", "0.32", "0.4", "0.8"]
    got = page.evaluate("""([rhos, ds]) => {
      const fig = document.getElementById('v04-p19'); const [sr, sd] = fig.querySelectorAll('input[type=range]');
      const out = [];
      for (const r of rhos) for (const d of ds) {
        sr.value = r; sd.value = d; sr.dispatchEvent(new Event('input'));
        const g = {}; fig.querySelectorAll('[data-k]').forEach(e => g[e.dataset.k] = e.textContent);
        g.vals = [...fig.querySelectorAll('.val')].map(e => e.textContent); g.r = sr.value; g.d = sd.value;
        out.push(g);
      }
      fig.querySelector('button').click();
      return out;
    }""", [rhos, ds])
    bad = 0
    for g in got:
        fr = frame(float(g["r"]), float(g["d"]))
        for k in ("A", "B", "C", "Ed", "ds", "Es", "E0", "ratio"):
            if g[k] != fr[k]:
                bad += 1
                if bad < 8:
                    print("  p19", g["r"], g["d"], k, g[k], "!=", fr[k])
        if g["vals"] != [f(float(g["r"]), 2), f(float(g["d"]), 2)]:
            bad += 1
            print("  p19 slider readout", g["vals"], g["r"], g["d"])
    print(f"p19: {len(got)} settings checked, {bad} mismatches")
    return bad == 0 and len(got) == 147


def check_p23(page):
    """All 21 settings of alpha: the four readouts and every dot's position."""
    from part7_smooth import p23_strings, lx, OUT_CH
    from common import f
    alphas = [f"{k / 20:g}" for k in range(21)]
    got = page.evaluate("""(alphas) => {
      const fig = document.getElementById('v04-p23'), sl = fig.querySelector('input[type=range]'); const out = [];
      for (const a of alphas) {
        sl.value = a; sl.dispatchEvent(new Event('input'));
        const g = {a: sl.value, val: fig.querySelector('.val').textContent};
        fig.querySelectorAll('[data-k]').forEach(e => g[e.dataset.k] = e.textContent);
        g.am = [...fig.querySelectorAll('[data-am]')].map(e => e.getAttribute('cx'));
        g.wm = [...fig.querySelectorAll('[data-wm]')].map(e => e.getAttribute('cx'));
        g.kam = fig.querySelector('[data-k="am"]').textContent; g.kwm = fig.querySelector('[data-k="wm"]').textContent;
        out.push(g);
      }
      fig.querySelector('button').click();
      return out;
    }""", alphas)
    bad = 0
    for g in got:
        s = p23_strings(float(g["a"]))
        r = s["r"]
        want = {"val": s["a"], "s": s["s"], "kam": s["am"], "kwm": s["wm"], "err": s["err"]}
        for k, v in want.items():
            if g[k] != v:
                bad += 1
                print("  p23", g["a"], k, g[k], "!=", v)
        if g["am"] != [f(lx(v), 1) for v in r["amax"]] or g["wm"] != [f(lx(v), 1) for v in r["wmax"]]:
            bad += 1
            print("  p23 dots", g["a"])
    print(f"p23: {len(got)} settings checked, {bad} mismatches")
    return bad == 0 and len(got) == 21


def check_p25(page):
    """Every whole-degree angle, 0 to 360: the readouts, and the vector, label and bars as drawn."""
    from part7_rotate import p25_frame
    got = page.evaluate("""() => {
      const fig = document.getElementById('v04-p25'), sl = fig.querySelector('input[type=range]'); const out = [];
      const g = k => fig.querySelector(`[data-g="${k}"]`);
      for (let d = 0; d <= 360; d++) {
        sl.value = d; sl.dispatchEvent(new Event('input'));
        const r = {d: sl.value, val: fig.querySelector('.val').textContent};
        fig.querySelectorAll('[data-k]').forEach(e => r[e.dataset.k] = e.textContent);
        r.px = g('v').getAttribute('x2'); r.py = g('v').getAttribute('y2');
        r.cx = g('tip').getAttribute('cx'); r.cy = g('tip').getAttribute('cy');
        r.fx = [g('fx').getAttribute('x1'), g('fx').getAttribute('y1'), g('fx').getAttribute('x2')];
        r.fy = [g('fy').getAttribute('x1'), g('fy').getAttribute('y1'), g('fy').getAttribute('y2')];
        r.lx = g('lab').getAttribute('x'); r.ly = g('lab').getAttribute('y');
        r.wx = g('bx').getAttribute('width'); r.wy = g('by').getAttribute('width');
        out.push(r);
      }
      fig.querySelector('button').click();
      out.push({reset: sl.value, val: fig.querySelector('.val').textContent});
      return out;
    }""")
    bad = 0
    for r in got[:-1]:
        fr = p25_frame(int(r["d"]))
        want = {k: fr[k] for k in ("deg", "x", "y", "len", "max", "a", "b", "dot", "ax", "ay", "lx", "ly", "wx", "wy")}
        want.update(val=fr["deg"], px=fr["px"], py=fr["py"], cx=fr["px"], cy=fr["py"],
                    fx=[fr["px"], fr["py"], fr["px"]], fy=[fr["px"], fr["py"], fr["py"]])
        for k, v in want.items():
            if r[k] != v:
                bad += 1
                if bad < 8:
                    print("  p25", r["d"], k, r[k], "!=", v)
    if got[-1] != {"reset": "45", "val": "45°"}:
        bad += 1
        print("  p25 reset", got[-1])
    print(f"p25: {len(got) - 1} angles checked, {bad} mismatches")
    return bad == 0 and len(got) == 362


def check_p32(page):
    """Every setting of the block's largest value: both scales, levels, readouts and every dot and tick."""
    from part9_blocks import p32_frame, SETTINGS
    vals = [f"{a:g}" for a in SETTINGS]
    got = page.evaluate("""(vals) => {
      const fig = document.getElementById('v04-p32'), sl = fig.querySelector('input[type=range]'); const out = [];
      const read = () => {
        const r = {a: sl.value, val: fig.querySelector('.val').textContent};
        fig.querySelectorAll('[data-k]').forEach(e => r[e.dataset.k] = e.textContent);
        r.vx = [...fig.querySelectorAll('[data-v]')].map(e => e.getAttribute('cx'));
        for (const k of ['mx', 'nv']) {
          r[k + 'sx'] = [...fig.querySelectorAll(`[data-s="${k}"]`)].map(e => e.getAttribute('cx'));
          r[k + 'gx'] = [...fig.querySelectorAll(`[data-g="${k}"]`)].map(e => [e.getAttribute('x1'), e.getAttribute('x2')]);
        }
        return r; };
      for (const v of vals) { sl.value = v; sl.dispatchEvent(new Event('input')); out.push(read()); }
      for (const b of fig.querySelectorAll('button[data-a]')) { b.click(); out.push(read()); }
      fig.querySelector('button[data-reset]').click(); out.push(read());
      return out;
    }""", vals)
    bad = 0
    for r in got:
        fr = p32_frame(float(r["a"]))
        want = {"val": fr["val"], "ideal": fr["ideal"], "vx": fr["vx"] * 2}
        for k in ("mx", "nv"):
            for key in ("scale", "levels", "big", "stored", "off", "rms"):
                want[f"{k}-{key}"] = fr[k][key]
            want[k + "sx"] = fr[k]["sx"]
            want[k + "gx"] = [[x, x] for x in fr[k]["gx"]]
        for k, v in want.items():
            if r[k] != v:
                bad += 1
                if bad < 8:
                    print("  p32", r["a"], k, r[k], "!=", v)
    tail = [r["a"] for r in got[-3:]]
    if tail != ["11", "7", "11"]:
        bad += 1
        print("  p32 presets and reset gave", tail)
    print(f"p32: {len(got)} settings checked, {bad} mismatches")
    return bad == 0 and len(got) == len(vals) + 3


CHECKS = {"p02w": check_p02w, "p14": check_p14, "p19": check_p19, "p23": check_p23,
          "p25": check_p25, "p32": check_p32}


def main():
    atlas = Path(sys.argv[1]).resolve()
    which = sys.argv[2:] or list(CHECKS)
    ok = True
    with sync_playwright() as p:
        b = p.chromium.launch()
        page = b.new_page()
        page.goto(atlas.as_uri())
        page.wait_for_timeout(300)
        for name in which:
            ok &= CHECKS[name](page)
        b.close()
    print("ALL WIDGETS AGREE WITH PYTHON" if ok else "WIDGET MISMATCHES")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
