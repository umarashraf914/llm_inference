#!/usr/bin/env python3
"""Render scenes with headless Chromium: video segments, still frames, or a layout audit.

  # stills at the end of every beat (+ mid-beat), and a contact sheet per scene
  python3 video/tools/render.py video/v01 stills ch05_s01 ch05_s02
  python3 video/tools/render.py video/v01 stills ch05 --at 3.5,12 --debug     # explicit times, grid overlay

  # automated layout audit (overlapping / off-screen / tiny text), sampled through each scene
  python3 video/tools/render.py video/v01 audit ch05

  # video segments (silent), one mp4 per scene, in parallel
  python3 video/tools/render.py video/v01 video all --fps 30 --workers 3

Scene selectors: a scene id (ch05_s01), a chapter (ch05, includes its title card), or "all".
Needs build/timing.json from tools/tts.py and scenes/<scene>.js (plus optional scenes/<chapter>_common.js).
"""
import argparse, base64, http.server, json, os, socketserver, subprocess, sys, threading, time
from functools import partial
from multiprocessing import Pool
from pathlib import Path

VIDEO = Path(__file__).resolve().parents[1]
CRF = os.environ.get("CRF", "18")


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def end_headers(self):
            self.send_header("Cache-Control", "no-store")
            super().end_headers()

    handler = partial(Quiet, directory=str(VIDEO))
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv.server_address[1]


def select(timing, sel):
    order = timing["order"]
    out = []
    for s in sel:
        if s == "all":
            out += order
        elif s in timing["scenes"]:
            out.append(s)
        else:
            hits = [x for x in order if x.startswith(s + "_")]
            if not hits:
                sys.exit(f"no scenes match {s!r}")
            out += hits
    seen, uniq = set(), []
    for x in out:
        if x not in seen:
            seen.add(x); uniq.append(x)
    return uniq


class Stage:
    def __init__(self, film, port, debug=False):
        from playwright.sync_api import sync_playwright
        self.pw = sync_playwright().start()
        self.browser = self.pw.chromium.launch(args=["--disable-gpu", "--font-render-hinting=none", "--force-color-profile=srgb",
                                                      "--disable-lcd-text", "--hide-scrollbars"])
        self.page = self.browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
        self.errors = []
        self.page.on("pageerror", lambda e: self.errors.append(str(e)))
        self.page.on("console", lambda m: self.errors.append(m.text) if m.type == "error" else None)
        self.cdp = self.page.context.new_cdp_session(self.page)
        self.film, self.port, self.debug = film, port, debug
        self.loaded_chapter = None

    def load(self, entry):
        sid = entry["id"]
        url = f"http://127.0.0.1:{self.port}/engine/stage.html?film={self.film.name}&scene={sid}"
        self.page.goto(url)
        self.page.wait_for_function("window.__chapterLoaded !== undefined && window.V !== undefined", timeout=20000)
        if self.page.evaluate("window.__chapterLoaded") == "error":
            raise RuntimeError(f"could not load scenes/{sid}.js")
        self.errors.clear()
        res = self.page.evaluate("([id, t, dbg]) => V.load(id, t, {debug: dbg})", [sid, entry, self.debug])
        if self.errors:
            raise RuntimeError(f"{sid}: page errors: {self.errors[:3]}")
        return res

    def seek(self, t):
        self.page.evaluate(f"V.seek({t})")

    def png(self):
        d = self.cdp.send("Page.captureScreenshot", {"format": "png", "optimizeForSpeed": True})
        return base64.b64decode(d["data"])

    def jpeg(self, q=95):
        # PNG-compressing the textured background costs ~3x the paint; q95 JPEG is visually lossless before x264
        d = self.cdp.send("Page.captureScreenshot", {"format": "jpeg", "quality": q, "optimizeForSpeed": True})
        return base64.b64decode(d["data"])

    def close(self):
        self.browser.close(); self.pw.stop()


def stills_times(entry, at):
    if at:
        return [float(x) for x in at.split(",")]
    ts = []
    for b in entry["beats"]:
        ts.append(b["start"] + b["dur"] * 0.5)
        ts.append(b["end"] + 0.35)
    if not ts:
        ts = [entry["duration"] * 0.5, entry["duration"] - 0.7]
    return [round(min(t, entry["duration"] - 0.6), 2) for t in ts]


def do_stills(film, timing, ids, at, debug):
    port = serve()
    st = Stage(film, port, debug)
    root = film / "build" / "stills"
    for sid in ids:
        entry = timing["scenes"][sid]
        res = st.load(entry)
        d = root / sid
        d.mkdir(parents=True, exist_ok=True)
        for f in d.glob("*.png"):
            f.unlink()
        files = []
        for t in stills_times(entry, at):
            st.seek(t)
            f = d / f"{sid}_{t:07.2f}.png"
            f.write_bytes(st.png())
            files.append(f)
        sheet = root / f"{sid}_sheet.jpg"
        subprocess.run(["montage", *map(str, files), "-tile", "4x", "-geometry", "640x360+6+6", "-background", "#000",
                        "-pointsize", "18", "-fill", "#ccc", str(sheet)], check=False, capture_output=True)
        w = res.get("warnings") or []
        print(f"{sid}: {len(files)} stills -> {d}  sheet {sheet.name}" + (f"  WARNINGS: {w}" if w else ""))
    st.close()


def do_audit(film, timing, ids, step):
    port = serve()
    st = Stage(film, port)
    total = 0
    for sid in ids:
        entry = timing["scenes"][sid]
        res = st.load(entry)
        ts = [round(x * step, 2) for x in range(int(entry["duration"] / step))]
        ts += [b["end"] + 0.3 for b in entry["beats"]]
        found = {}
        for t in sorted(ts):
            st.seek(t)
            for iss in st.page.evaluate("V.audit()"):
                key = json.dumps({k: v for k, v in iss.items() if k not in ("box", "frac", "px")}, sort_keys=True)
                found.setdefault(key, []).append(t)
        w = res.get("warnings") or []
        n = len(found) + len(w)
        total += n
        print(f"== {sid}: {'clean' if not n else f'{n} problem(s)'}")
        for k, tl in found.items():
            print(f"   {k}  at t={tl[0]}..{tl[-1]} ({len(tl)} samples)")
        for x in w:
            print(f"   warning: {x}")
    st.close()
    print("AUDIT CLEAN" if total == 0 else f"AUDIT: {total} problem(s)")
    return total


def render_one(args):
    film, entry, fps, outdir = args
    port = serve()
    st = Stage(Path(film), port)
    st.load(entry)
    n = round(entry["duration"] * fps)
    out = Path(outdir) / f"{entry['id']}.mp4"
    enc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(fps), "-i", "-",
                            "-c:v", "libx264", "-preset", "slow", "-tune", "animation", "-crf", CRF, "-pix_fmt", "yuv420p",
                            "-r", str(fps), "-g", str(fps * 4), "-video_track_timescale", str(fps * 1000), str(out)], stdin=subprocess.PIPE)
    t0 = time.time()
    for i in range(n):
        st.seek(i / fps)
        enc.stdin.write(st.jpeg())
    enc.stdin.close(); enc.wait()
    st.close()
    return entry["id"], n, time.time() - t0


def do_video(film, timing, ids, fps, workers):
    outdir = film / "build" / "segments"
    outdir.mkdir(parents=True, exist_ok=True)
    jobs = sorted([(str(film), timing["scenes"][s], fps, str(outdir)) for s in ids], key=lambda j: -j[1]["duration"])
    t0, frames = time.time(), 0
    with Pool(workers) as pool:
        for sid, n, dt in pool.imap_unordered(render_one, jobs):
            frames += n
            print(f"{sid}: {n} frames in {dt:.0f}s ({n/dt:.1f} fps)", flush=True)
    dt = time.time() - t0
    print(f"rendered {len(jobs)} scenes, {frames} frames in {dt/60:.1f} min ({frames/dt:.1f} fps overall)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("film")
    ap.add_argument("mode", choices=["stills", "audit", "video"])
    ap.add_argument("scenes", nargs="+")
    ap.add_argument("--at", help="comma-separated times for stills")
    ap.add_argument("--debug", action="store_true", help="grid + safe-area overlay on stills")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--step", type=float, default=0.5, help="audit sampling step, seconds")
    a = ap.parse_args()
    film = Path(a.film).resolve()
    timing = json.loads((film / "build" / "timing.json").read_text())
    ids = select(timing, a.scenes)
    if a.mode == "stills":
        do_stills(film, timing, ids, a.at, a.debug)
    elif a.mode == "audit":
        sys.exit(1 if do_audit(film, timing, ids, a.step) else 0)
    else:
        do_video(film, timing, ids, a.fps, a.workers)


if __name__ == "__main__":
    main()
