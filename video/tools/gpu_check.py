#!/usr/bin/env python3
"""How should this computer render? Its graphics card and hardware video encoder, checked against software.

  python video/tools/gpu_check.py [v01]       # prints a report; make_4k.py runs the same check on a computer's first run

Chromium can draw on the graphics card, through the headless shell or the full browser in new-headless mode. For each
way, this asks Chromium whether a real graphics card is drawing, renders the same probe frames there and in software
(the look every audit was made against), compares them pixel by pixel and times both. It also encodes the probe
frames with this computer's hardware encoder (NVIDIA NVENC, or Apple VideoToolbox on a Mac) and with x264, and
compares both after decoding. The GPU is used only where it matches software closely and is faster.

Several ways of drawing on the graphics card are tried (WAYS: the headless shell or the full browser, and ANGLE's
back-ends: Direct3D 11, Direct3D 11 on 12, OpenGL and Vulkan on Windows). Each first gets a quick test: start the
browser, ask which device draws, draw a plain page, load the film's page and draw one frame. A way that gets through
it is timed and compared on the probe frames. Every test runs in a process of its own with a time limit: a graphics
driver that never answers would otherwise hold the whole check (Chromium's calls to it have no time-out of their
own). A test that runs out of time is stopped with its browser, and the report says how far it got, with the first
errors in Chromium's own log, so a failing way can be diagnosed from the report alone.
"""
import argparse, json, os, re, signal, subprocess, sys, tempfile, time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render  # noqa: E402
from ffbin import ffmpeg  # noqa: E402

VERSION = 2                     # bump when the choices change, so every computer checks again (a change of way
                                # redraws every scene once, as scenes drawn differently are not reused: so the new
                                # ways tried since are left to make_4k --check, not forced on a resumed render)
FRAMES = 8                      # consecutive frames timed per probe
FAR = 64                        # a pixel is "far off" if a channel differs by more than this (of 255)
MIN_PSNR, MAX_FAR = 36.0, 0.002  # GPU drawing passes if every probe frame is at least this close
MAX_LOSS = 1.5                  # dB a hardware encoder may give up against x264
GPU_TIMEOUT = 150               # s a GPU drawing test may take (software drawing needs about 30 s for the same frames)
QUICK_TIMEOUT = 45              # s the quick test of a way may take
LOAD_WAIT = 15                  # s the quick test waits for each of: the film's page to load, its scene to be ready
# ways to draw on the graphics card, in the order tried: mode (shell / full browser), then ANGLE's back-end and
# switches where they differ from this platform's default (Direct3D 11, Metal, Vulkan; see render.launch_options);
# the plain names keep the fingerprints of scenes already rendered that way (tools/scenekeys.py)
WAYS = {"win32": ["shell", "full", "full:d3d11:nosandbox", "full:d3d11on12", "full:gl", "full:vulkan"]}.get(
    sys.platform, ["shell", "full"])
HARDWARE_ENCODERS = ["videotoolbox"] if sys.platform == "darwin" else ["nvenc"]
NAMES = {"x264": "x264", "nvenc": "NVIDIA NVENC", "videotoolbox": "Apple VideoToolbox"}


def probes(timing, n=6):
    """The first title card and n scenes spread through the film, each a little past its middle."""
    kind = lambda s: timing["scenes"][s]["kind"]
    scenes = [s for s in timing["order"] if kind(s) != "title"]
    picks = [s for s in timing["order"] if kind(s) == "title"][:1]
    picks += [scenes[round(i * (len(scenes) - 1) / max(1, n - 1))] for i in range(min(n, len(scenes)))]
    return [(s, 0.55) for s in dict.fromkeys(picks)]


def capture(film, timing, picks, gpu, scale=2, note=lambda m: None):
    """Per probe, a run of FRAMES consecutive frames (JPEG bytes) drawn with this gpu mode, and seconds per frame.
    note(step) is told each step as it starts, so a test that stalls can say where."""
    note("starting the browser")
    st = render.Stage(film, scale=scale, gpu=gpu)
    try:
        note("asking the browser which graphics device draws")
        hardware, what = render.gpu_status(st.browser)
        runs, spent, n = [], 0.0, 0
        for sid, frac in picks:
            entry = timing["scenes"][sid]
            note(f"loading {sid}")
            st.load(entry)
            t0 = round(entry["duration"] * frac * 30) / 30
            run = []
            for i in range(FRAMES):
                note(f"drawing {sid}, frame {i + 1} of {FRAMES}")
                a = time.perf_counter()
                st.seek(t0 + i / 30)
                run.append(st.jpeg())
                if i:                           # the first frame after a load warms caches; time the rest
                    spent += time.perf_counter() - a; n += 1
            runs.append(run)
        return runs, spent / n, hardware, what
    finally:
        st.close()


def descendants(pid):
    """Every process started, directly or not, by pid (POSIX; the browser runs in a process group of its own)."""
    kids = {}
    for ln in subprocess.run(["ps", "-A", "-o", "pid=,ppid="], capture_output=True, text=True).stdout.splitlines():
        a, _, b = ln.strip().partition(" ")
        if a.isdigit() and b.strip().isdigit():
            kids.setdefault(int(b), []).append(int(a))
    found, todo = [], [pid]
    while todo:
        for k in kids.get(todo.pop(), []):
            found.append(k); todo.append(k)
    return found


def kill_tree(p):
    """Stop a process and everything it started (Playwright's driver and the browser's own processes)."""
    if sys.platform == "win32":
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(p.pid)], capture_output=True)
    else:
        for pid in [*descendants(p.pid), p.pid]:
            try:
                os.kill(pid, signal.SIGKILL)
            except (ProcessLookupError, PermissionError):
                pass
    try:
        p.wait(timeout=20)
    except subprocess.TimeoutExpired:
        pass


def child_error(err, code):
    """The error a test's process stopped with: the last line of its traceback that is not indented (Playwright puts
    an indented call log under 'Call log:' after the error itself), without the exception's module path."""
    lines = [ln for ln in (err or b"").decode("utf-8", "replace").splitlines() if ln.strip()]
    top = [ln for ln in lines if not ln[0].isspace() and ln.strip() != "Call log:"]
    line = (top or lines or [f"stopped with exit code {code}"])[-1].strip()
    return re.sub(r"^(?:[A-Za-z_]\w*\.)+(?=\w+: )", "", line)       # playwright._impl._errors.Error: -> Error:


def capture_limited(film, timing, picks, gpu, timeout=GPU_TIMEOUT):
    """capture() in a process of its own, stopped with its browser if it is not done within timeout seconds."""
    # on Windows a stopped process can hold a file a moment longer; leave such a file rather than fail the check
    with tempfile.TemporaryDirectory(**({"ignore_cleanup_errors": True} if sys.version_info >= (3, 10) else {})) as tmp:
        out = Path(tmp)
        (out / "timing.json").write_text(json.dumps(timing))
        cmd = [sys.executable, str(Path(__file__).resolve()), "--capture", gpu, "--film-dir", str(Path(film).resolve()),
               "--picks", json.dumps(picks), "--out", str(out)]
        p = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        try:
            _, err = p.communicate(timeout=timeout)
        except subprocess.TimeoutExpired:
            kill_tree(p)
            last = (out / "progress.txt").read_text().strip().splitlines() if (out / "progress.txt").exists() else []
            raise TimeoutError(f"no answer within {timeout} s, stuck at: {last[-1] if last else 'the start'}")
        except BaseException:                   # Ctrl+C: take the browser down too
            kill_tree(p)
            raise
        done = out / "result.json"
        if p.returncode != 0 or not done.exists():
            raise RuntimeError(child_error(err, p.returncode))
        res = json.loads(done.read_text())
        runs = [[(out / f"{i}_{j}.jpg").read_bytes() for j in range(FRAMES)] for i in range(len(picks))]
        return runs, res["spent"], res["hardware"], res["what"]


def capture_child(a):
    """The far side of capture_limited: capture, writing each step to progress.txt and the frames to files."""
    out = Path(a.out)
    progress = open(out / "progress.txt", "a", encoding="utf-8")
    note = lambda m: (progress.write(m + "\n"), progress.flush())
    timing = json.loads((out / "timing.json").read_text())
    picks = [tuple(x) for x in json.loads(a.picks)]
    runs, spent, hardware, what = capture(Path(a.film_dir), timing, picks, a.capture, note=note)
    for i, run in enumerate(runs):
        for j, f in enumerate(run):
            (out / f"{i}_{j}.jpg").write_bytes(f)
    (out / "result.json").write_text(json.dumps({"spent": spent, "hardware": hardware, "what": what}))


def quick_child(a):
    """The far side of quick(): each step of a short test of one way, written down as it starts and as it ends."""
    out, t0 = Path(a.out), time.time()
    progress = open(out / "progress.txt", "a", encoding="utf-8")
    note = lambda m: (progress.write(f"{time.time() - t0:.1f} s: {m}\n"), progress.flush())
    res = {}
    save = lambda: (out / "quick.json").write_text(json.dumps(res))
    timing = json.loads((out / "timing.json").read_text())
    sid = json.loads(a.picks)[0][0]
    note("starting the browser")
    st = render.Stage(Path(a.film_dir), scale=2, gpu=a.quick, log=str(out / "chrome.log"))
    st.page.on("crash", lambda: note("the page crashed"))
    reqs = open(out / "requests.txt", "a", encoding="utf-8")      # what the page asked for and got, for the report
    short = lambda r: r.url.replace(render.ORIGIN + "/", "")
    st.page.on("request", lambda r: (reqs.write(f"+ {short(r)}\n"), reqs.flush()))
    for ev in ("requestfinished", "requestfailed"):
        st.page.on(ev, lambda r: (reqs.write(f"- {short(r)}\n"), reqs.flush()))
    note("asking the browser which graphics device draws")
    g = st.browser.new_browser_cdp_session().send("SystemInfo.getInfo")["gpu"]
    dev = next((d for d in g.get("devices", []) if d.get("deviceString")), {})
    res["device"] = dev.get("deviceString", "unknown device")
    res["driver"] = dev.get("driverVersion", "")
    res["features"] = {k: v for k, v in g.get("featureStatus", {}).items() if k in ("gpu_compositing", "rasterization")}
    res["hardware"], res["what"] = render.gpu_status(st.browser)
    save()
    note("drawing a plain page")
    a0 = time.time()
    st.page.set_content("<body style='margin:0;background:#123'><div style='width:600px;height:300px;background:#2a6;"
                        "font:40px sans-serif'>plain page</div></body>", timeout=LOAD_WAIT * 1000)
    st.jpeg()
    res["plain_s"] = round(time.time() - a0, 2); save()
    note("loading a file through the stage's file server")
    a0 = time.time()
    r = st.page.goto(f"{render.ORIGIN}/engine/fonts/fonts.css", timeout=LOAD_WAIT * 1000)
    if not r or not r.ok:
        raise RuntimeError(f"engine/fonts/fonts.css answered {r.status if r else 'nothing'} (files served from {st.root})")
    res["file_s"] = round(time.time() - a0, 2); save()
    note("loading the film's page")
    a0 = time.time()
    st.load(timing["scenes"][sid], tries=1, wait=LOAD_WAIT)
    res["load_s"] = round(time.time() - a0, 2); save()
    note("drawing a frame of the film")
    a0 = time.time()
    st.seek(timing["scenes"][sid]["duration"] * 0.55)
    st.jpeg()
    res["frame_s"] = round(time.time() - a0, 2)
    res["ok"] = True; save()
    note("closing the browser")
    st.close()


GPU_WORDS = re.compile(r"gpu|angle|d3d|dxgi|vulkan|\bgl|egl|opengl|context|shared.?image|viz|raster|composit|display",
                       re.I)


def chrome_errors(log, n=2):
    """The first few distinct errors in Chromium's own log, without their process/time prefix: the graphics ones
    first (a log also holds unrelated complaints, such as a missing system message bus on Linux)."""
    if not log.exists():
        return []
    seen = []
    for ln in log.read_text("utf-8", "replace").splitlines():
        m = re.match(r"\[[^\]]*:(ERROR|FATAL)(?::|\])([^\]]*)\]\s*(.*)", ln)
        if m:
            msg = f"{m.group(2).strip()} {m.group(3).strip()}".strip()[:150]
            if msg and msg not in seen and not msg.startswith("dbus/"):    # Linux's message bus: never the cause
                seen.append(msg)
    gpu = [m for m in seen if GPU_WORDS.search(m)]
    return (gpu or seen)[:n]


def quick(film, timing, picks, way, timeout=QUICK_TIMEOUT):
    """A short test of one way to draw on the graphics card, in a process of its own: a dict of what it found (device,
    plain_s, load_s, frame_s, ok, hardware, what) plus 'steps' (its last step and when) and 'errors' (Chromium's)."""
    with tempfile.TemporaryDirectory(**({"ignore_cleanup_errors": True} if sys.version_info >= (3, 10) else {})) as tmp:
        out = Path(tmp)
        (out / "timing.json").write_text(json.dumps(timing))
        cmd = [sys.executable, str(Path(__file__).resolve()), "--quick", way, "--film-dir", str(Path(film).resolve()),
               "--picks", json.dumps(picks), "--out", str(out)]
        p = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        err, timed_out = b"", False
        try:
            _, err = p.communicate(timeout=timeout)
        except subprocess.TimeoutExpired:
            kill_tree(p)
            timed_out = True
        except BaseException:                   # Ctrl+C: take the browser down too
            kill_tree(p)
            raise
        res = json.loads((out / "quick.json").read_text()) if (out / "quick.json").exists() else {}
        steps = (out / "progress.txt").read_text("utf-8", "replace").strip().splitlines() if (out / "progress.txt").exists() else []
        res["last"] = steps[-1] if steps else "0.0 s: starting"
        res["timed_out"], res["limit"] = timed_out, timeout
        res["failure"] = None if timed_out or p.returncode == 0 else child_error(err, p.returncode)[:160]
        res["errors"] = chrome_errors(out / "chrome.log")
        pending = []                              # asked for and never answered, in the order asked
        if (out / "requests.txt").exists():
            for ln in (out / "requests.txt").read_text("utf-8", "replace").splitlines():
                url = ln[2:]
                if ln.startswith("+ "):
                    pending.append(url)
                elif ln.startswith("- ") and url in pending:
                    pending.remove(url)
        res["pending"] = pending
        return res


def quick_line(way, q):
    """One line of the report for a way whose quick test did not get through."""
    dev = f"{q['device']} (driver {q['driver']})" if q.get("device") else "device not reported"
    got = [f"plain page drawn in {q['plain_s']} s"] if "plain_s" in q else []
    if "file_s" in q:
        got.append(f"a file served in {q['file_s']} s")
    if "load_s" in q:
        got.append(f"film's page loaded in {q['load_s']} s")
    stuck = q["last"].split(": ", 1)[-1]
    why = f"no answer within {q['limit']} s while {stuck}" if q["timed_out"] else f"failed while {stuck}: {q['failure']}"
    wait = f"; still waiting for {', '.join(q['pending'][:3])}" if q.get("pending") else ""
    errs = f"; Chromium: {' | '.join(q['errors'])}" if q["errors"] else ""
    return f"GPU drawing ({way}): {dev}; " + "; ".join(got + [why]) + wait + errs


def pixels(jpg):
    raw = subprocess.run([ffmpeg(), "-v", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-i", "-", "-f", "rawvideo",
                          "-pix_fmt", "rgb24", "-"], input=jpg, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).astype(np.int16)


def compare(a, b):
    """(PSNR in dB, share of pixels far off) between two frames."""
    d = pixels(a) - pixels(b)
    mse = float(np.mean(d.astype(np.float64) ** 2))
    psnr = 99.0 if mse == 0 else 10 * np.log10(255 ** 2 / mse)
    far = float(np.mean(np.abs(d).reshape(-1, 3).max(axis=1) > FAR))
    return psnr, far


def encoder_works(encoder):
    """Does this encoder take a 4K stream here? True, or the reason it does not."""
    out = subprocess.run([ffmpeg(), "-hide_banner", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=3840x2160:rate=30",
                          "-frames:v", "30", *render.encoder_args(encoder, 2), "-f", "null", "-"], capture_output=True, text=True)
    if out.returncode == 0:
        return True
    first = next((ln for ln in out.stderr.splitlines() if ln.strip()), "failed")   # the cause comes first
    return re.sub(r"^\[[^\]]*\]\s*", "", first)[:160]


def encoded_quality(runs, encoder):
    """PSNR (dB) of probe runs after encoding with encoder and decoding again, and the bitrate (Mbit/s)."""
    frames = [f for run in runs for f in run]
    with tempfile.TemporaryDirectory() as tmp:
        clip = Path(tmp) / "probe.mp4"
        subprocess.run([ffmpeg(), "-y", "-v", "error", "-f", "image2pipe", "-framerate", "30", "-i", "-",
                        *render.encoder_args(encoder, 2), "-g", "120", str(clip)], input=b"".join(frames), check=True)
        mbps = clip.stat().st_size * 8 / (len(frames) / 30) / 1e6
        dec = subprocess.Popen([ffmpeg(), "-v", "error", "-i", str(clip), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                               stdout=subprocess.PIPE)
        size, mse = 3840 * 2160 * 3, []
        for f in frames:
            buf = dec.stdout.read(size)
            if len(buf) < size:                 # fewer frames came back than went in
                return 0.0, mbps
            got = np.frombuffer(buf, np.uint8).astype(np.int16)
            mse.append(float(np.mean((got - pixels(f)).astype(np.float64) ** 2)))
        dec.stdout.close(); dec.wait()
    return 10 * np.log10(255 ** 2 / max(np.mean(mse), 1e-9)), mbps


def check(film, timing, say=print, ways=WAYS, allow_software=False, keep=None):
    """Decide how this computer renders: {'version', 'gpu': None or one of WAYS, 'encoder', 'report': [...]}."""
    report = []
    log = lambda m: (report.append(m), say(m))
    picks = probes(timing)
    decision = {"version": VERSION, "gpu": None, "encoder": "x264", "report": report}
    try:
        ref, cpu_s, _, _ = capture(film, timing, picks, None)
    except Exception as e:
        log(f"software drawing failed: {e}")
        return decision
    log(f"software drawing: {cpu_s * 1000:.0f} ms per 4K frame")

    best_db, x264 = None, None
    for enc in HARDWARE_ENCODERS:
        ok = encoder_works(enc)
        if ok is not True:
            log(f"{NAMES[enc]}: not available ({ok})")
            continue
        x264 = x264 or encoded_quality(ref[:3], "x264")
        db, mbps = encoded_quality(ref[:3], enc)
        good = db >= x264[0] - MAX_LOSS
        log(f"{NAMES[enc]}: {db:.1f} dB at {mbps:.0f} Mbit/s, against x264's {x264[0]:.1f} dB at {x264[1]:.0f} Mbit/s "
            f"-> {'as good' if good else 'not as good, keeping x264'}")
        if good and (best_db is None or db > best_db):
            decision["encoder"], best_db = enc, db

    best_s = None
    for way in ways:
        say(f"GPU drawing ({way}): testing")
        q = quick(film, timing, picks, way)
        if not q.get("ok"):
            log(quick_line(way, q))
            continue
        if not q["hardware"] and not allow_software:
            log(f"GPU drawing ({way}): no graphics card in use ({q['what']})")
            continue
        try:
            shots, gpu_s, hardware, what = capture_limited(film, timing, picks, way)
        except TimeoutError as e:
            log(f"GPU drawing ({way}): {q['what']}; the quick test passed but the probe frames gave {e}; not used")
            continue
        except Exception as e:
            log(f"GPU drawing ({way}): {q['what']}; the probe frames failed ({str(e).splitlines()[0][:160]})")
            continue
        scores = [compare(a[0], b[0]) for a, b in zip(ref, shots)]
        psnr, far = min(s[0] for s in scores), max(s[1] for s in scores)
        same = psnr >= MIN_PSNR and far <= MAX_FAR
        log(f"GPU drawing ({way}): {what}; {gpu_s * 1000:.0f} ms per frame ({cpu_s / gpu_s:.1f}x software); "
            f"worst probe frame {psnr:.1f} dB, {100 * far:.3f}% of its pixels far off -> "
            f"{'matches' if same else 'DIFFERS from'} software")
        if keep:
            keep.mkdir(parents=True, exist_ok=True)
            worst = min(range(len(scores)), key=lambda i: scores[i][0])
            (keep / f"{picks[worst][0]}_software.jpg").write_bytes(ref[worst][0])
            (keep / f"{picks[worst][0]}_gpu_{way.replace(':', '-')}.jpg").write_bytes(shots[worst][0])
        if same and gpu_s < 0.85 * cpu_s and (best_s is None or gpu_s < best_s):
            decision["gpu"], best_s = way, gpu_s
    log(f"decision: draw {'on the GPU (' + decision['gpu'] + ')' if decision['gpu'] else 'in software'}, "
        f"encode with {NAMES[decision['encoder']]}")
    return decision


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("film", nargs="?", default="v01")
    ap.add_argument("--allow-software", action="store_true", help="test the GPU path on a software GPU (no speed-up)")
    # the tests' own processes; not --film, which argparse would let the film argument's default overwrite
    for internal in ("--capture", "--quick", "--film-dir", "--picks", "--out"):
        ap.add_argument(internal, help=argparse.SUPPRESS)
    a = ap.parse_args()
    if a.capture:
        return capture_child(a)
    if a.quick:
        return quick_child(a)
    film = render.VIDEO / a.film
    timing = json.loads((film / "build" / "timing.json").read_text())
    res = check(film, timing, allow_software=a.allow_software, keep=film / "build" / "gpu_check")
    print(json.dumps({k: v for k, v in res.items() if k != "report"}))


if __name__ == "__main__":
    main()
