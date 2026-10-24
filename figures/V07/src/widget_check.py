"""Drive V7's widgets (Parts 1-5) in a headless browser and compare every number they print with
the Python that drew them.

  python3 figures/V07/src/widget_check.py BUILT_ATLAS.html [a06 a09 …]

Each widget's module exposes <id>_cases(): a list of (settings, expected). settings maps a CSS
selector inside the figure to a value: a range input is set and sent an 'input' event, "click" clicks
the element. expected maps a selector to the exact text it must show. After the cases, Reset is
clicked and the first case's expected text must come back.
"""
import importlib
import pathlib
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
WIDGETS = {"a06": "p2_batching", "a09": "p2_ceiling", "a13": "p2_ceiling", "a16": "p3_continuous",
           "a27": "p4_chunked"}

APPLY = """([sel, v]) => { const fig = document.getElementById(sel[0]); const el = fig.querySelector(sel[1]);
  if (v === 'click') { el.click(); return; }
  el.value = String(v); el.dispatchEvent(new Event('input', {bubbles: true}));
  el.dispatchEvent(new Event('change', {bubbles: true})); }"""
READ = """([fid, sels]) => { const fig = document.getElementById(fid);
  return sels.map(s => { const e = fig.querySelector(s); return e ? e.textContent : null; }); }"""


def main():
    atlas = pathlib.Path(sys.argv[1]).resolve()
    want = sys.argv[2:] or [w for w in WIDGETS]
    bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        pg.goto(atlas.as_uri())
        pg.wait_for_timeout(300)
        for wid in want:
            fid = f"v07-{wid}"
            if pg.query_selector(f"#{fid}") is None:
                print(f"{wid}: not in this build, skipped")
                continue
            mod = importlib.import_module(WIDGETS[wid])
            cases = getattr(mod, f"{wid}_cases")()
            n = 0
            for settings, expected in cases:
                for sel, v in settings.items():
                    pg.evaluate(APPLY, [[fid, sel], v])
                sels = list(expected)
                got = pg.evaluate(READ, [fid, sels])
                for s, g in zip(sels, got):
                    n += 1
                    if g != expected[s]:
                        bad += 1
                        print(f"{wid} {settings} {s}:\n   page   {g!r}\n   python {expected[s]!r}")
            reset = "[data-reset]" if pg.query_selector(f"#{fid} [data-reset]") else "button"
            pg.evaluate(APPLY, [[fid, reset], "click"])             # Reset brings back the first case
            sels = list(cases[0][1])
            got = pg.evaluate(READ, [fid, sels])
            for s, g in zip(sels, got):
                n += 1
                if g != cases[0][1][s]:
                    bad += 1
                    print(f"{wid} after Reset {s}: page {g!r}, python {cases[0][1][s]!r}")
            print(f"{wid}: {len(cases)} settings, {n} strings compared")
        b.close()
    print("ALL WIDGET NUMBERS MATCH" if not bad else f"{bad} MISMATCHES")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
