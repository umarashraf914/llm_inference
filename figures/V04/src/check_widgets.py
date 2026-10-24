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


CHECKS = {"p02w": check_p02w, "p14": check_p14}


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
