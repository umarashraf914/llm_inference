#!/usr/bin/env python3
"""Load one scene the way the renderer does, and report everything the browser says along the way.

For when rendering fails on a machine we cannot see. Run it with the environment make_4k.py set up:

  video/.venv/bin/python video/tools/diagnose_stage.py              # macOS / Linux
  video\\.venv\\Scripts\\python video\\tools\\diagnose_stage.py         # Windows

It loads one scene at 4K (timing each step, logging every console message, page error and failed request,
and polling the page's state twice a second for up to 90 s), then times a few frames. With --workers N it
then does the same in N spawned processes at once, as the renderer does. Paste the whole output back.
"""
import argparse, json, multiprocessing, os, platform, sys, time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render  # noqa: E402

FILM = render.VIDEO / "v01"
STATE = """() => ({
  loaded: String(window.__chapterLoaded), V: typeof window.V, gsap: typeof window.gsap, err: window.__loadError || null,
  fonts: [...document.fonts].reduce((a, f) => (a[f.status] = (a[f.status] || 0) + 1, a), {}),
  resources: performance.getEntriesByType('resource').length,
  slowest: performance.getEntriesByType('resource').sort((a, b) => b.duration - a.duration).slice(0, 3)
    .map(r => r.name.split('/').pop() + ' ' + Math.round(r.duration) + 'ms'),
  raf: window.__rafCount || 0,
})"""


def probe(sid, scale, tag=""):
    t0 = time.time()
    out = []
    say = lambda m: out.append(f"{tag}[{time.time() - t0:6.2f}s] {m}") or print(out[-1], flush=True)
    timing = json.loads((FILM / "build" / "timing.json").read_text())
    entry = timing["scenes"][sid]
    port = render.serve()
    say(f"server on 127.0.0.1:{port}")
    from playwright.sync_api import sync_playwright
    pw = sync_playwright().start()
    browser = pw.chromium.launch(args=["--disable-gpu", "--font-render-hinting=none", "--force-color-profile=srgb",
                                       "--disable-lcd-text", "--hide-scrollbars"])
    say(f"browser launched: {browser.browser_type.name} {browser.version}")
    page = browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=scale)
    page.on("console", lambda m: say(f"console.{m.type}: {m.text[:300]}"))
    page.on("pageerror", lambda e: say(f"PAGE ERROR: {str(e)[:300]}"))
    page.on("requestfailed", lambda r: say(f"REQUEST FAILED: {r.url.split('/', 3)[-1]} {r.failure}"))
    page.on("response", lambda r: r.status >= 400 and say(f"HTTP {r.status}: {r.url.split('/', 3)[-1]}"))
    page.add_init_script("window.__rafCount = 0; (function t(){ window.__rafCount++; requestAnimationFrame(t); })();")
    url = f"http://127.0.0.1:{port}/engine/stage.html?film=v01&scene={sid}"
    page.goto(url)
    say("goto done (load event)")
    last, ok = None, False
    for _ in range(180):
        st = page.evaluate(STATE)
        key = json.dumps({k: v for k, v in st.items() if k not in ("resources", "slowest", "raf")})
        if key != last:
            say(f"state {json.dumps(st)}")
            last = key
        if st["loaded"] != "undefined" and st["V"] != "undefined":
            ok = st["loaded"] == "true"
            break
        time.sleep(0.5)
    else:
        say(f"NOT LOADED after 90 s: {json.dumps(page.evaluate(STATE))}")
    if ok:
        try:
            page.wait_for_function("true", timeout=5000)
            say("wait_for_function (raf polling) works")
        except Exception as e:
            say(f"wait_for_function (raf polling) FAILED: {e}")
        res = page.evaluate("([id, t]) => V.load(id, t, {debug: false})", [sid, entry])
        say(f"V.load done, warnings: {res.get('warnings') if isinstance(res, dict) else res}")
        cdp = page.context.new_cdp_session(page)
        shot = {} if scale == 1 else {"clip": {"x": 0, "y": 0, "width": 1920, "height": 1080, "scale": scale}}
        for i in range(5):
            a = time.time()
            page.evaluate(f"V.seek({1 + i / 30})")
            d = cdp.send("Page.captureScreenshot", {"format": "jpeg", "quality": 95, "optimizeForSpeed": True, **shot})
            say(f"frame {i}: {(time.time() - a) * 1000:.0f} ms, {len(d['data']) * 3 // 4 // 1024} KB")
    browser.close(); pw.stop()
    say("done" if ok else "FAILED")
    return ok


def worker(args):
    sid, scale, k = args
    return probe(sid, scale, tag=f"w{k} ")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scene", default="ch08_s03")
    ap.add_argument("--scale", type=float, default=2)
    ap.add_argument("--workers", type=int, default=4)
    a = ap.parse_args()
    import playwright
    print(f"python {sys.version.split()[0]} ({sys.executable}) on {platform.platform()} {platform.machine()}, "
          f"cpus {os.cpu_count()}, playwright {getattr(playwright, '__version__', '?')}, "
          f"start method {multiprocessing.get_start_method()}", flush=True)
    print("== one scene, in this process", flush=True)
    ok = probe(a.scene, a.scale)
    if a.workers > 1:
        print(f"== {a.workers} at once, in spawned worker processes (as the renderer does)", flush=True)
        long = sorted(json.loads((FILM / "build" / "timing.json").read_text())["scenes"].values(), key=lambda e: -e["duration"])
        with multiprocessing.Pool(a.workers) as pool:
            oks = pool.map(worker, [(e["id"], a.scale, k) for k, e in enumerate(long[:a.workers])])
        ok = ok and all(oks)
    print("\nDIAGNOSIS: everything loaded" if ok else "\nDIAGNOSIS: a load failed; see the lines above", flush=True)


if __name__ == "__main__":
    main()
