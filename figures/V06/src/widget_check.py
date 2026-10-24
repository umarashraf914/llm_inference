"""Drive V6's widgets in a browser and compare every number they display with the Python that drew
their initial state. Run after building the atlas:

  python3 figures/V06/src/widget_check.py ATLAS.html

Each check sets the controls through the page, as a reader would, and reads back the text the page
shows. JavaScript's toFixed and common.f() round the same way, so the strings must match exactly.
"""
import sys
from playwright.sync_api import sync_playwright
from common import f

CHECKS = []


def check(fn):
    CHECKS.append(fn)
    return fn


def set_range(fig, value, k=0):
    fig.evaluate("""(el, a) => { const s = el.querySelectorAll('input[type=range]')[a[1]];
                     s.value = a[0]; s.dispatchEvent(new Event('input')); }""", [str(value), k])


def text(fig, sel):
    return fig.eval_on_selector(sel, "e => e.textContent")


@check
def p26(page):
    import routing as R
    fig = page.query_selector("#v06-p26")
    bad, n = [], 0
    for k in range(0, 31):
        push = round(k * 0.01, 2)
        set_range(fig, f"{push:.2f}")
        h = R.collapse(float(f"{push:.2f}"))
        last = h[-1]
        want = {"[data-r=top]": f(last[R.LEAD], 3), "[data-r=at100]": f(h[100][R.LEAD], 3),
                "[data-r=dead]": str(sum(v < 0.01 for v in last)), ".val": f(push),
                "[data-r=takeover]": R.takeover_text(float(f"{push:.2f}"))}
        want.update({f"[data-v='{i}']": f(last[i], 3) for i in range(8)})
        for sel, w in want.items():
            n += 1
            got = text(fig, sel)
            if got != w:
                bad.append((push, sel, got, w))
    fig.eval_on_selector("button", "b => b.click()")
    if text(fig, "[data-r=dead]") != "7" or text(fig, ".val") != f(0):
        bad.append(("reset", "", text(fig, "[data-r=dead]"), "7"))
    return n, bad


@check
def p31(page):
    import balance as B
    fig = page.query_selector("#v06-p31")
    bad, n = [], 0
    for k in range(0, 31):
        u = f"{k / 1000:.3f}"
        set_range(fig, u)
        h = B.controller(float(u))
        last = h[-1]
        want = {".val": f(float(u), 3)}
        want.update({f"[data-r='{m}']": f(h[m - 1]["ratio"]) for m in B.MARK})
        want.update({f"[data-v='{i}']": str(last["loads"][i]) for i in range(8)})
        want.update({f"[data-b='{i}']": B.sfmt(last["bias"][i]) for i in range(8)})
        for sel, w in want.items():
            n += 1
            got = text(fig, sel)
            if got != w:
                bad.append((u, sel, got, w))
    fig.eval_on_selector("button", "b => b.click()")
    if text(fig, ".val") != f(B.U0, 3):
        bad.append(("reset", ".val", text(fig, ".val"), f(B.U0, 3)))
    return n, bad


@check
def p39(page):
    import serving as S
    from common import n as nfmt
    fig = page.query_selector("#v06-p39")
    bad, count = [], 0
    for i, B in enumerate(S.BS):
        set_range(fig, str(i))
        s = S.state(B)
        want = {f"[data-r='{k}']": v for k, v in S.readout_texts(s, B).items()}
        want[".val"] = nfmt(B)
        for sel, w in want.items():
            count += 1
            got = text(fig, sel)
            if got != w:
                bad.append((B, sel, got, w))
        cls = fig.eval_on_selector_all("[data-c]", "els => els.map(e => e.getAttribute('class'))")
        count += len(cls)
        if cls != s["cls"]:
            bad.append((B, "cells", sum(a != b for a, b in zip(cls, s["cls"])), "differ"))
    fig.eval_on_selector("button", "b => b.click()")
    if text(fig, ".val") != "1":
        bad.append(("reset", ".val", text(fig, ".val"), "1"))
    return count, bad


@check
def p46(page):
    import derive as D
    from common import n as nfmt
    fig = page.query_selector("#v06-p46")
    bad, count = [], 0
    SET = """(el, a) => { const r = el.querySelectorAll('input[type=radio]'); r[a[0]].checked = true;
        r[a[0]].dispatchEvent(new Event('change'));
        const s = el.querySelectorAll('input[type=range]'); [a[1], a[2], a[3], a[4]].forEach((v, i) => s[i].value = v);
        s[0].dispatchEvent(new Event('input'));
        const out = {}; el.querySelectorAll('[data-r]').forEach(e => out[e.dataset.r] = e.textContent);
        out.vals = [...el.querySelectorAll('.val')].map(e => e.textContent); return out; }"""
    for pi, key in enumerate(["deepseek", "mixtral"]):
        a = D.ARCH[key]
        for ni, N in enumerate(D.NS):
            for K in (1, 2, 8, 16):
                for S in (0, 1):
                    for wi, w in enumerate(D.WS):
                        got = fig.evaluate(SET, [pi, ni, K, S, wi])
                        k = min(K, N)
                        want = D.outs(D.calc(a, N, k, S, w))
                        want["name"] = a["name"]
                        for kk, vv in want.items():
                            count += 1
                            if got[kk] != vv:
                                bad.append((key, N, k, S, w, kk, got[kk], vv))
                        vals = [str(N), str(k), str(S), nfmt(w)]
                        count += 4
                        if got["vals"] != vals:
                            bad.append((key, N, k, S, w, "vals", got["vals"], vals))
    fig.eval_on_selector("button", "b => b.click()")
    if text(fig, "[data-r=held]") != D.outs(D.calc(D.ARCH["deepseek"], 256, 8, 1, 2048))["held"]:
        bad.append(("reset", "held", text(fig, "[data-r=held]"), ""))
    return count, bad


def main():
    atlas = sys.argv[1]
    only = sys.argv[2:]
    with sync_playwright() as p:
        b = p.chromium.launch()
        page = b.new_page()
        page.goto(f"file://{__import__('os').path.abspath(atlas)}")
        page.wait_for_timeout(500)
        failed = 0
        for fn in CHECKS:
            if only and fn.__name__ not in only:
                continue
            n, bad = fn(page)
            print(f"{fn.__name__}: {n} numbers compared, {len(bad)} differ")
            for x in bad[:10]:
                print("   ", x)
            failed += len(bad)
        b.close()
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
