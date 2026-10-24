"""Drive every V09 widget in a browser and compare each displayed number with Python.

  python3 figures/V09/src/test_widgets.py <built atlas.html>

Each widget's JavaScript reimplements its arithmetic; this checks the two agree at every setting
the controls allow, string for string, including rounding (toFixed against common.f). It also checks
the initial state drawn in Python matches what the script draws on load, and that Reset restores it.
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))


def texts(pg, fid, sel):
    return pg.eval_on_selector_all(f"#{fid} {sel}", "els => els.map(e => e.textContent)")


def set_range(pg, fid, k, v):
    pg.eval_on_selector_all(f"#{fid} input[type=range]",
                            f"(els, v) => {{ els[{k}].value = v; els[{k}].dispatchEvent(new Event('input')); }}", v)


def click(pg, fid, label):
    pg.eval_on_selector_all(f"#{fid} button", f"bs => bs.find(b => b.textContent.trim() === {label!r}).click()")


def test_n07(pg, static):
    import wall
    fid = "v09-n07"
    want0 = [wall.readout(c, wall.BS[0]) for c in wall.CHIPS]
    assert static[fid] == want0, (static[fid], want0)
    checked = 0
    for i, B in enumerate(wall.BS):
        set_range(pg, fid, 0, i)
        got = texts(pg, fid, "[data-r]")
        want = [wall.readout(c, B) for c in wall.CHIPS]
        assert got == want, (B, got, want)
        assert texts(pg, fid, ".val") == [f"{B:,}"]
        checked += len(want)
    click(pg, fid, "Reset")
    assert texts(pg, fid, "[data-r]") == want0
    return checked


def test_n24w(pg, static):
    import decode as d
    fid = "v09-n24w"
    B0, D0, A0 = d.BS2[d.INIT[0]], d.INIT[1], d.AS[d.INIT[2]]
    want0 = d.lines24(B0, D0, A0)
    assert static[fid] == want0, (static[fid], want0)
    checked = 0
    for i, B in enumerate(d.BS2):
        set_range(pg, fid, 0, i)
        for dr in range(d.DMAX + 1):
            set_range(pg, fid, 1, dr)
            for j, a in enumerate(d.AS):
                set_range(pg, fid, 2, j)
                got = texts(pg, fid, "[data-l]")
                want = d.lines24(B, dr, a)
                assert got == want, (B, dr, a, got, want)
                assert texts(pg, fid, ".val") == [f"{B:,}", str(dr), f"{a:.1f}"]
                checked += len(want)
    click(pg, fid, "Reset")
    assert texts(pg, fid, "[data-l]") == want0
    return checked


READ27 = """fid => { const f = document.getElementById(fid), q = s => f.querySelector(s), out = [];
  for (const s of ['[data-k]', '[data-pre]', '[data-next]', '[data-state]']) out.push(q(s).textContent);
  for (let i = 0; i < 5; i++) { const g = q(`[data-row="${i}"]`);
    if (g.getAttribute('visibility') === 'hidden') continue;
    for (const s of ['[data-c]', '[data-pv]', '[data-av]']) out.push(g.querySelector(s).textContent); }
  out.push(q('[data-tot]').textContent); return out; }"""


def test_n27w(pg, static):
    import pick
    fid = "v09-n27w"
    want0 = pick.lines27(0)
    assert static[fid] == want0, (static[fid], want0)
    checked = 0
    for k in range(len(pick.STEPS)):
        if k:
            click(pg, fid, "Next")
        got = pg.evaluate(READ27, fid)
        want = pick.lines27(k)
        assert got == want, (k, got, want)
        checked += len(want)
    for k in range(len(pick.STEPS) - 2, -1, -1):      # and back again
        click(pg, fid, "Back")
        assert pg.evaluate(READ27, fid) == pick.lines27(k), k
    click(pg, fid, "Next")
    click(pg, fid, "Reset")
    assert pg.evaluate(READ27, fid) == want0
    return checked


TESTS = {"v09-n07": (test_n07, "[data-r]"), "v09-n24w": (test_n24w, "[data-l]"), "v09-n27w": (test_n27w, None)}


def main():
    page = Path(sys.argv[1]).resolve()
    html = page.read_text(encoding="utf-8")
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        # the initial state as Python drew it: load with scripts disabled
        ctx = b.new_context(java_script_enabled=False)
        st = ctx.new_page()
        st.goto(page.as_uri())
        static = {fid: (texts(st, fid, sel) if sel else st.evaluate(READ27, fid))
                  for fid, (_, sel) in TESTS.items() if f"id='{fid}'" in html}
        ctx.close()
        pg.goto(page.as_uri())
        pg.wait_for_timeout(300)
        total = 0
        for fid, (fn, sel) in TESTS.items():
            if f"id='{fid}'" not in html:
                print(f"{fid}: not in this build")
                continue
            got = texts(pg, fid, sel) if sel else pg.evaluate(READ27, fid)
            assert got == static[fid], f"{fid}: the script's first draw differs from Python's static state"
            k = fn(pg, static)
            total += k
            print(f"{fid}: {k} displayed strings match Python")
        b.close()
    print(f"all widgets agree with Python ({total} strings)")


if __name__ == "__main__":
    main()
