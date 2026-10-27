#!/usr/bin/env python3
"""Render scenes with headless Chromium: video segments, still frames, or a layout audit.

  # stills at the end of every beat (+ mid-beat), and a contact sheet per scene
  python3 video/tools/render.py video/v01 stills ch05_s01 ch05_s02
  python3 video/tools/render.py video/v01 stills ch05 --at 3.5,12 --debug     # explicit times, grid overlay

  # automated layout audit (overlapping / off-screen / tiny text), sampled through each scene
  python3 video/tools/render.py video/v01 audit ch05
  python3 video/tools/render.py video/v01 audit all --touch-gap 8      # also labels within 8 px of a neighbour

  # video segments (silent), one mp4 per scene, in parallel
  python3 video/tools/render.py video/v01 video all --fps 30 --workers 3

  # 4K (3840x2160): the same 1920x1080 stage drawn at twice the pixel density, into its own folder;
  # --skip-existing resumes an interrupted run (each segment is written to a .partial file, then renamed)
  python3 video/tools/render.py video/v01 video all --scale 2 --out video/v01/build/segments_4k --skip-existing

  # with a cache, every scene rendered is kept under its fingerprint (tools/scenekeys.py: everything its frames depend
  # on), and a scene whose fingerprint is already there is reused instead of rendered; --out gets links to them
  python3 video/tools/render.py video/v01 video all --scale 2 --cache video/.cache/segments --out ...

  # on the graphics card: Chromium draws on the GPU (--gpu shell|full) and a hardware encoder compresses (--encoder
  # nvenc on NVIDIA cards, videotoolbox on Apple silicon). Neither is pixel-identical to the software look the audits
  # were made with; make_4k.py checks both against software on each computer before using them.
  python3 video/tools/render.py video/v01 video all --scale 2 --gpu shell --encoder nvenc --out ...

Scene selectors: a scene id (ch05_s01), a chapter (ch05, includes its title card), or "all".
Needs build/timing.json from tools/tts.py and scenes/<scene>.js (plus optional scenes/<chapter>_common.js).
"""
import argparse, base64, json, multiprocessing, os, shutil, subprocess, sys, time, urllib.parse
from multiprocessing import Pool
from pathlib import Path

from ffbin import ffmpeg

VIDEO = Path(__file__).resolve().parents[1]
CRF = os.environ.get("CRF", "18")
PRESET = os.environ.get("PRESET", "slow")
NVENC_CQ = os.environ.get("NVENC_CQ", "19")
VT_QUALITY = os.environ.get("VT_QUALITY", "80")
SOFTWARE_GPUS = ("SwiftShader", "Basic Render", "WARP", "llvmpipe", "softpipe")


GPU_SWITCHES = {"nosandbox": "--disable-gpu-sandbox"}


def launch_options(gpu=None, log=None):
    """Chromium launch options. Without gpu: software drawing, the look every audit was made against. With gpu:
    draw on the graphics card, through the headless shell ('shell') or the full browser's new headless mode ('full'),
    optionally naming ANGLE's back-end and extra switches: 'full:gl', 'full:d3d11:nosandbox' (gpu_check.WAYS lists
    what is tried). gpu_status() says whether a graphics card really draws. log: a file for Chromium's own log."""
    args = ["--font-render-hinting=none", "--force-color-profile=srgb", "--disable-lcd-text", "--hide-scrollbars"]
    if log:
        args += ["--enable-logging", "--v=0", f"--log-file={log}"]
    if not gpu:
        return {"args": ["--disable-gpu", *args]}
    mode, *rest = gpu.split(":")
    angle = (rest[0] if rest and rest[0] else None) or os.environ.get("FILM_ANGLE") or \
        {"win32": "d3d11", "darwin": "metal"}.get(sys.platform, "vulkan")
    args += ["--enable-gpu", "--ignore-gpu-blocklist", "--enable-gpu-rasterization", f"--use-angle={angle}"]
    args += [GPU_SWITCHES[x] for x in rest[1:] if x in GPU_SWITCHES]
    if angle == "swiftshader":                  # a software stand-in for a graphics card, for testing this path
        args.append("--enable-unsafe-swiftshader")
    return {"args": args, **({"channel": "chromium"} if mode == "full" else {})}


def gpu_status(browser):
    """(drawing on a real graphics card?, what Chromium reports) for a launched browser."""
    g = browser.new_browser_cdp_session().send("SystemInfo.getInfo")["gpu"]
    raster = g.get("featureStatus", {}).get("rasterization", "?")
    name = next((d["deviceString"] for d in g.get("devices", []) if d.get("deviceString")), "unknown device")
    hardware = raster.startswith("enabled") and not any(x in name for x in SOFTWARE_GPUS)
    return hardware, f"{name}, rasterization {raster}"


def encoder_args(encoder, scale):
    if encoder == "videotoolbox":
        # Apple's hardware encoder (constant quality needs Apple silicon); hardware only, never its software fallback
        return ["-c:v", "h264_videotoolbox", "-q:v", VT_QUALITY, "-profile:v", "high", "-allow_sw", "0", "-pix_fmt", "yuv420p"]
    if encoder == "nvenc":
        # NVIDIA's hardware encoder: constant-quality VBR, slow preset, adaptive quantisation, B-frames
        return ["-c:v", "h264_nvenc", "-preset", "p6", "-tune", "hq", "-rc", "vbr", "-cq", NVENC_CQ, "-b:v", "0",
                "-spatial-aq", "1", "-temporal-aq", "1", "-bf", "3", "-rc-lookahead", "20", "-profile:v", "high",
                "-pix_fmt", "yuv420p"]
    # at 4K the capture (~5 fps) is the bottleneck, so two encoder threads keep up; a shorter look-ahead holds each
    # encoder to ~1.8 GB instead of ~2.6 GB (SSIM 0.9971 vs 0.9977), so more scenes fit in memory at once
    big = ["-threads", "2", "-rc-lookahead", "20"] if scale > 1 else []
    return ["-c:v", "libx264", "-preset", PRESET, "-tune", "animation", "-crf", CRF, "-pix_fmt", "yuv420p", *big]


# The stage's files are answered from disk inside the browser session (Playwright request routing), so there is
# no web server: a local one worked on Linux, but on macOS a burst of ~60 requests overflowed its listen queue
# and the kernel reset connections at random, losing scripts and fonts. The host is never contacted.
ORIGIN = "http://stage.localhost"
TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
         ".json": "application/json; charset=utf-8", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png"}


def serve_files(page, root=VIDEO):
    """Answer the stage's requests from root: the video/ folder holding engine/, lib/ and the film (this checkout's,
    or a released version's snapshot, so a version renders with the engine it was released with)."""
    root = Path(root).resolve()

    def answer(route):
        rel = urllib.parse.unquote(urllib.parse.urlsplit(route.request.url).path).lstrip("/")
        f = (root / rel).resolve()
        if f.is_file() and root in f.parents:
            route.fulfill(status=200, body=f.read_bytes(), headers={
                "Content-Type": TYPES.get(f.suffix.lower(), "application/octet-stream"), "Cache-Control": "no-store"})
        else:   # with a body, so the full browser too opens a missing page as a 404 (an empty one fails the visit)
            route.fulfill(status=404, body=f"not found: {rel}", headers={
                "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store"})

    page.route(ORIGIN + "/**", answer)


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
    def __init__(self, film, debug=False, scale=1, gpu=None, log=None):
        from playwright.sync_api import sync_playwright
        self.pw = sync_playwright().start()
        self.browser = self.pw.chromium.launch(**launch_options(gpu, log))
        # the stage is always laid out at 1920x1080; scale only sets how many pixels draw it (2 -> 3840x2160)
        self.page = self.browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=scale)
        self.root = Path(film).parent.resolve()      # the video/ folder whose files the stage is served
        serve_files(self.page, self.root)
        self.errors = []
        self.page.on("pageerror", lambda e: self.errors.append(str(e)))
        self.page.on("console", lambda m: self.errors.append(m.text) if m.type == "error" else None)
        self.page.on("requestfailed", lambda r: self.errors.append(f"{r.url.replace(ORIGIN, '')}: {r.failure}"))
        self.cdp = self.page.context.new_cdp_session(self.page)
        # a bare CDP capture is 1920x1080 whatever the density; a clip with a scale renders it at that density
        self.shot = {} if scale == 1 else {"clip": {"x": 0, "y": 0, "width": 1920, "height": 1080, "scale": scale}}
        self.film, self.debug = film, debug
        self.loaded_chapter = None

    def load(self, entry, tries=3, wait=60):
        """Open the stage on a scene and build it; wait: seconds allowed for the page (at most 30) and for the scene."""
        sid = entry["id"]
        url = f"{ORIGIN}/engine/stage.html?film={self.film.name}&scene={sid}"
        for attempt in range(1, tries + 1):
            self.errors.clear()
            r = self.page.goto(url, timeout=min(30, wait) * 1000)
            if r and not r.ok:                          # the stage's own files are missing: waiting cannot help
                raise RuntimeError(f"{sid}: engine/stage.html answered {r.status} (files served from {self.root})")
            # the stage sets __chapterLoaded to true once the engine, the scene and every font are in, or to 'error'
            try:
                self.page.wait_for_function("window.__chapterLoaded !== undefined", timeout=wait * 1000, polling=100)
                state, why = self.page.evaluate("[window.__chapterLoaded, window.__loadError]")
            except Exception as e:                      # playwright's TimeoutError
                state, why = "error", f"not loaded after {wait} s ({type(e).__name__})"
            if state is True:
                break
            if attempt == tries:
                raise RuntimeError(f"{sid}: could not load the stage ({tries} tries): {why}; browser: {self.errors[:6]}")
        self.errors.clear()
        res = self.page.evaluate("([id, t, dbg]) => V.load(id, t, {debug: dbg})", [sid, entry, self.debug])
        if self.errors:
            raise RuntimeError(f"{sid}: page errors: {self.errors[:3]}")
        return res

    def seek(self, t):
        self.page.evaluate(f"V.seek({t})")

    def png(self):
        d = self.cdp.send("Page.captureScreenshot", {"format": "png", "optimizeForSpeed": True, **self.shot})
        return base64.b64decode(d["data"])

    def jpeg(self, q=95):
        # PNG-compressing the textured background costs ~3x the paint; q95 JPEG is visually lossless before x264
        d = self.cdp.send("Page.captureScreenshot", {"format": "jpeg", "quality": q, "optimizeForSpeed": True, **self.shot})
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


def do_stills(film, timing, ids, at, debug, scale=1):
    st = Stage(film, debug, scale)
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


def do_audit(film, timing, ids, step, touch_gap=None):
    opts = {"touchGap": touch_gap} if touch_gap is not None else {}   # a wider gap sweeps for near misses
    st = Stage(film)
    total = 0
    for sid in ids:
        entry = timing["scenes"][sid]
        res = st.load(entry)
        ts = [round(x * step, 2) for x in range(int(entry["duration"] / step))]
        ts += [b["end"] + 0.3 for b in entry["beats"]]
        found = {}
        for t in sorted(ts):
            st.seek(t)
            for iss in st.page.evaluate("o => V.audit(o)", opts):
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


PROGRESS_EVERY = 60     # seconds between progress lines while scenes render
_FRAMES = None          # in each worker: the count of frames drawn by all workers (shared), for the progress lines


def _share(counter):
    global _FRAMES
    _FRAMES = counter


def _count(k):
    if _FRAMES is not None and k:
        with _FRAMES.get_lock():
            _FRAMES.value += k


def performance_work():
    """On Windows 11, work Windows judges to be in the background (as with a window minimised or behind others) can be
    moved onto the power-saving cores of a hybrid processor, such as the E-cores of Intel's 12th generation and
    later, and its timers coarsened: a render left running while the computer is used for something else would
    crawl. Opt this process and every process it has started (Playwright's driver, the browser's processes, ffmpeg)
    out of that power saving, as work the user is waiting for. Elsewhere, or where Windows refuses, nothing."""
    if os.name != "nt":
        return
    try:
        import ctypes
        from ctypes import wintypes
        k = ctypes.WinDLL("kernel32", use_last_error=True)
        k.CreateToolhelp32Snapshot.restype = wintypes.HANDLE
        k.CreateToolhelp32Snapshot.argtypes = [wintypes.DWORD, wintypes.DWORD]
        k.Process32FirstW.argtypes = k.Process32NextW.argtypes = [wintypes.HANDLE, ctypes.c_void_p]
        k.OpenProcess.restype = wintypes.HANDLE
        k.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
        k.SetProcessInformation.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD]
        k.CloseHandle.argtypes = [wintypes.HANDLE]

        class Entry(ctypes.Structure):                  # PROCESSENTRY32W
            _fields_ = [("size", wintypes.DWORD), ("usage", wintypes.DWORD), ("pid", wintypes.DWORD),
                        ("heap", ctypes.c_size_t), ("module", wintypes.DWORD), ("threads", wintypes.DWORD),
                        ("parent", wintypes.DWORD), ("priority", ctypes.c_long), ("flags", wintypes.DWORD),
                        ("exe", ctypes.c_wchar * 260)]

        class Throttling(ctypes.Structure):             # PROCESS_POWER_THROTTLING_STATE
            _fields_ = [("version", wintypes.ULONG), ("control", wintypes.ULONG), ("state", wintypes.ULONG)]

        snap = k.CreateToolhelp32Snapshot(0x2, 0)       # TH32CS_SNAPPROCESS
        if not snap or snap == ctypes.c_void_p(-1).value:
            return
        kids, e = {}, Entry()
        e.size = ctypes.sizeof(Entry)
        more = k.Process32FirstW(snap, ctypes.byref(e))
        while more:
            kids.setdefault(e.parent, []).append(e.pid)
            more = k.Process32NextW(snap, ctypes.byref(e))
        k.CloseHandle(snap)
        mine, todo = set(), [os.getpid()]
        while todo:                                     # (a reused process id could make a loop: each is taken once)
            p = todo.pop()
            if p not in mine:
                mine.add(p)
                todo += kids.get(p, [])
        # the mechanisms named in control and off in state: execution speed (EcoQoS, the power-saving cores) and,
        # from Windows 11, ignoring timer resolution while hidden; Windows 10 knows only the first
        ways = [Throttling(1, 0x1 | 0x4, 0), Throttling(1, 0x1, 0)]
        for p in mine:
            h = k.OpenProcess(0x0200, False, p)         # PROCESS_SET_INFORMATION
            if h:                                       # 4: ProcessPowerThrottling; the first way Windows takes
                any(k.SetProcessInformation(h, 4, ctypes.byref(w), ctypes.sizeof(w)) for w in ways)
                k.CloseHandle(h)
    except Exception:                                   # a hint to the scheduler: never worth stopping a render for
        pass


def render_one(args):
    film, entry, fps, out, scale, gpu, encoder = args
    st = Stage(Path(film), scale=scale, gpu=gpu)
    st.load(entry)
    n = round(entry["duration"] * fps)
    out = Path(out)
    part = out.with_name(f"{out.stem}.partial.mp4")      # renamed only once complete, so a resume never trusts half a file
    enc = subprocess.Popen([ffmpeg(), "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(fps), "-i", "-",
                            *encoder_args(encoder, scale), "-r", str(fps), "-g", str(fps * 4), "-video_track_timescale", str(fps * 1000), str(part)], stdin=subprocess.PIPE)
    performance_work()                      # this worker, its browser and its encoder, all started by now
    t0, spent = time.time(), [0.0, 0.0, 0.0]    # seconds seeking, drawing (the screenshot), handing frames to ffmpeg
    for i in range(n):
        a = time.perf_counter()
        st.seek(i / fps)
        b = time.perf_counter()
        frame = st.jpeg()
        c = time.perf_counter()
        enc.stdin.write(frame)
        spent[0] += b - a; spent[1] += c - b; spent[2] += time.perf_counter() - c
        if i % 15 == 14:
            _count(15)
    _count(n % 15)
    enc.stdin.close()
    if enc.wait():
        raise RuntimeError(f"{entry['id']}: ffmpeg failed")
    st.close()
    for k in range(20):                     # on Windows a virus scanner may hold a fresh file for a moment
        try:
            os.replace(part, out)
            break
        except PermissionError:
            if k == 19:
                raise
            time.sleep(0.5)
    return entry["id"], n, time.time() - t0, [round(s / max(n, 1) * 1000) for s in spent]


def render_settings(scale, fps, gpu, encoder):
    """What, besides a scene's own inputs, decides how its segment looks (part of its fingerprint)."""
    from importlib.metadata import version
    return {"scale": scale, "fps": fps, "gpu": gpu, "encoder": encoder_args(encoder, scale),
            "browser": f"playwright {version('playwright')}"}


def place(src, dst):
    """dst becomes src: a hard link (no copy, no space), or a copy where links are not possible."""
    dst.unlink(missing_ok=True)
    try:
        os.link(src, dst)
    except OSError:
        shutil.copy2(src, dst)


def do_video(film, timing, ids, fps, workers, scale=1, outdir=None, skip_existing=False, gpu=None, encoder="x264",
             cache=None):
    outdir = Path(outdir) if outdir else film / "build" / "segments"
    outdir.mkdir(parents=True, exist_ok=True)
    if cache:
        import scenekeys
        cache = Path(cache)
        cache.mkdir(parents=True, exist_ok=True)
        keys = scenekeys.scene_keys(film, timing, render_settings(scale, fps, gpu, encoder), ids)
        target = {s: cache / f"{keys[s]}.mp4" for s in ids}

        def fresh(s):
            meta = target[s].with_suffix(".json")
            return (target[s].exists() and meta.exists() and abs(json.loads(meta.read_text())["globalStart"]
                    - timing["scenes"][s].get("globalStart", 0)) <= scenekeys.AMBIENT_SLACK)
        todo = [s for s in ids if not fresh(s)]
        if len(todo) < len(ids):
            print(f"{len(ids) - len(todo)} of {len(ids)} scenes are unchanged since an earlier render and are reused"
                  + (f"; rendering the other {len(todo)}" if todo else ""), flush=True)
    else:
        target = {s: outdir / f"{s}.mp4" for s in ids}
        todo = [s for s in ids if not (skip_existing and target[s].exists())]
        if len(todo) < len(ids):
            print(f"{len(ids) - len(todo)} of {len(ids)} scenes already rendered in {outdir}"
                  + (f"; rendering the other {len(todo)}" if todo else ""), flush=True)
    def done(s):                                # a scene is in the cache the moment it is rendered (resumable)
        if cache:
            target[s].with_suffix(".json").write_text(json.dumps(
                {"scene": s, "film": film.name, "globalStart": timing["scenes"][s].get("globalStart", 0)}))
    if todo:
        render_all(film, timing, todo, fps, workers, scale, gpu, encoder, target, done)
    if cache:
        for s in ids:
            os.utime(target[s])                 # last used, for pruning
            place(target[s], outdir / f"{s}.mp4")


def clock(s):
    m, s = divmod(int(s), 60)
    h, m = divmod(m, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def render_all(film, timing, todo, fps, workers, scale, gpu, encoder, target, done=lambda s: None):
    jobs = sorted([(str(film), timing["scenes"][s], fps, str(target[s]), scale, gpu, encoder) for s in todo],
                  key=lambda j: -j[1]["duration"])
    total = sum(round(j[1]["duration"] * fps) for j in jobs)
    t0, frames = time.time(), 0
    drawn = multiprocessing.Value("q", 0)       # every frame drawn, finished scenes or not, so the estimate is right early
    seen = [(t0, 0)]                            # (time, frames drawn) at each line, for the speed over the last minute

    def progress():
        now, f = time.time(), drawn.value
        el = now - t0
        if not f:
            return f"{clock(el)} | starting"
        seen.append((now, f))
        while now - seen[1][0] >= 60:           # keep as the oldest the newest sample at least a minute old
            seen.pop(0)
        rate, (t1, f1) = f / el, seen[0]
        recent = f" ({(f - f1) / (now - t1):.1f} in the last minute)" if t1 > t0 else ""
        left = (total - f) / rate
        left = (f"about {left / 3600:.1f} h left" if left >= 5400 else f"about {round(left / 60)} min left" if left >= 90
                else "under 2 min left" if f < total else "all frames drawn")
        return f"{clock(el)} | {f:,} of {total:,} frames ({100 * f / total:.0f}%), {rate:.1f} frames/s{recent}, {left}"

    with Pool(workers, initializer=_share, initargs=(drawn,)) as pool:
        it, k = pool.imap_unordered(render_one, jobs), 0
        while k < len(jobs):
            try:
                sid, n, dt, ms = it.next(timeout=PROGRESS_EVERY)
            except multiprocessing.TimeoutError:     # no scene finished in the last minute: say how far the rest are
                print("   " + progress(), flush=True)
                continue
            k += 1
            done(sid)
            frames += n
            print(f"[{k}/{len(jobs)}] {sid}: {n} frames in {dt:.0f}s ({n/dt:.1f} fps; a frame: seek {ms[0]} ms, draw "
                  f"{ms[1]} ms, to the encoder {ms[2]} ms) | {progress()}", flush=True)
    dt = time.time() - t0
    print(f"rendered {len(jobs)} scenes, {frames} frames in {dt/60:.1f} min ({frames/max(dt, 1e-9):.1f} fps overall)")


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
    ap.add_argument("--touch-gap", type=float, help="audit: flag labels closer than this many px to a neighbour "
                    "(default 3-4; 8 sweeps for near misses before a release)")
    ap.add_argument("--scale", type=float, default=1, help="pixel density: 1 -> 1920x1080, 2 -> 3840x2160")
    ap.add_argument("--out", help="folder for video segments (default build/segments)")
    ap.add_argument("--skip-existing", action="store_true", help="leave segments already in the folder alone (resume)")
    ap.add_argument("--gpu", help="draw on the graphics card: shell or full, optionally :angle[:nosandbox] (see launch_options)")
    ap.add_argument("--encoder", choices=["x264", "nvenc", "videotoolbox"], default="x264")
    ap.add_argument("--cache", help="keep and reuse rendered scenes here, by fingerprint (see tools/scenekeys.py)")
    a = ap.parse_args()
    film = Path(a.film).resolve()
    # keep the icon bundle in step with the scene files (cheap, and self-heals concurrent edits)
    # (needs the icon packages in node_modules; without them the committed bundle is used as it is)
    if (VIDEO / "node_modules").is_dir():
        subprocess.run([sys.executable, str(Path(__file__).with_name("build_icons.py"))], capture_output=True)
    timing = json.loads((film / "build" / "timing.json").read_text())
    ids = select(timing, a.scenes)
    if a.mode == "stills":
        do_stills(film, timing, ids, a.at, a.debug, a.scale)
    elif a.mode == "audit":
        sys.exit(1 if do_audit(film, timing, ids, a.step, a.touch_gap) else 0)
    else:
        do_video(film, timing, ids, a.fps, a.workers, a.scale, a.out, a.skip_existing, a.gpu, a.encoder, a.cache)


if __name__ == "__main__":
    main()
