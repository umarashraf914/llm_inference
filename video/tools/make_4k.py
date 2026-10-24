#!/usr/bin/env python3
"""Render the finished film in 4K on this computer and save it as one video file in Downloads.

  python video/tools/make_4k.py                    # -> Downloads/V01_The_Memory_Wall_4K.mp4

Everything runs here and nothing is uploaded anywhere. The first run sets up a private Python environment in
video/.venv (Playwright with its own Chromium, numpy, a bundled ffmpeg) and fetches GSAP from npm. The narration
comes from V01_narration_pack.zip if that is in Downloads (the exact narration the film was cut to); without it,
the narration is synthesised here with Kokoro, which first downloads a 350 MB voice model.

The render is long: 166,140 frames at 3840x2160, hours even on a fast machine. Stop it at any time (Ctrl+C, or
close the window) and run the same command again: finished scenes are kept and it carries on from there.

  --out PATH         where to save the film (default: your Downloads folder)
  --workers N        scenes rendered at once (default: chosen from CPU cores and memory)
  --narration ZIP    the narration pack, if it is not in Downloads
  --preset P         x264 preset: slow (default), medium (about 1.5x faster, slightly larger file)
  --only ch18 ...    just these chapters, as a quick test (saved as ..._4K_ch18.mp4)
  --keep-segments    keep the per-scene 4K files after the film is assembled
"""
import argparse, base64, hashlib, io, json, os, shutil, subprocess, sys, tarfile, time
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
VIDEO = TOOLS.parent
FILM = VIDEO / "v01"
NAME = "V01_The_Memory_Wall_4K"
PACK = "V01_narration_pack.zip"
VENV = VIDEO / ".venv"
SEG = FILM / "build" / "segments_4k"
REQS = ["playwright==1.56.0", "numpy", "imageio-ffmpeg", "certifi"]
TTS_REQS = ["kokoro-onnx==0.6.1"]
GSAP_FILES = ["gsap", "DrawSVGPlugin", "MorphSVGPlugin", "MotionPathPlugin", "CustomEase"]
KOKORO_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
KOKORO = {"kokoro-v1.0.onnx": "7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5",
          "voices-v1.0.bin": "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d"}
GB_PER_WORKER = 2.6        # one Chromium page at 3840x2160 (~0.6 GB) plus its x264 encoder (~1.8 GB), measured


def step(msg):
    print(f"\n== {msg}", flush=True)


def env():
    e = dict(os.environ, PYTHONUTF8="1", PYTHONIOENCODING="utf-8", PYTHONUNBUFFERED="1")
    e.pop("PYTHONHOME", None)
    return e


def run(cmd, **kw):
    subprocess.run([str(c) for c in cmd], check=True, env=kw.pop("env", env()), **kw)


def downloads():
    d = Path.home() / "Downloads"
    return d if d.is_dir() else Path.home()


def venv_python():
    return VENV / ("Scripts/python.exe" if os.name == "nt" else "bin/python")


# ---------------------------------------------------------------- setup
def bootstrap(argv):
    """Re-run this script inside video/.venv, creating it first if needed."""
    if Path(sys.prefix).resolve() == VENV.resolve():
        return
    if sys.version_info < (3, 9):
        sys.exit("Python 3.9 or newer is needed (python.org/downloads)")
    py = venv_python()
    if not py.exists():
        step("Setting up a private Python environment in video/.venv (first run only)")
        try:
            run([sys.executable, "-m", "venv", VENV])
        except subprocess.CalledProcessError:
            sys.exit("Could not create a virtual environment. On Debian/Ubuntu: sudo apt install python3-venv")
    try:
        sys.exit(subprocess.call([str(py), str(Path(__file__).resolve()), *argv], env=env()))
    except KeyboardInterrupt:
        sys.exit(130)


def ensure_packages(reqs, tag):
    marker = VENV / f".installed-{tag}"
    want = "\n".join(reqs)
    if marker.exists() and marker.read_text() == want:
        return
    step(f"Installing {', '.join(r.split('=')[0] for r in reqs)}")
    run([sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "--quiet", "--upgrade", "pip"])
    run([sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "--quiet", *reqs])
    marker.write_text(want)


def fetch(url, dst=None):
    """Download url (to dst, with progress, or into memory)."""
    import ssl, urllib.request, certifi
    ctx = ssl.create_default_context(cafile=certifi.where())
    with urllib.request.urlopen(url, context=ctx) as r:
        size, got, buf = int(r.headers.get("Content-Length") or 0), 0, io.BytesIO()
        out = open(dst, "wb") if dst else buf
        try:
            while True:
                chunk = r.read(1 << 20)
                if not chunk:
                    break
                out.write(chunk)
                got += len(chunk)
                if dst and size:
                    print(f"\r   {Path(dst).name}: {got / 1e6:.0f} / {size / 1e6:.0f} MB", end="", flush=True)
        finally:
            if dst:
                out.close()
                print()
    return None if dst else buf.getvalue()


def ensure_gsap():
    vendor = VIDEO / "engine" / "vendor"
    if all((vendor / f"{f}.min.js").exists() for f in GSAP_FILES):
        return
    step("Fetching GSAP (the animation library) from npm")
    lock = json.loads((VIDEO / "package-lock.json").read_text())["packages"]["node_modules/gsap"]
    data = fetch(lock["resolved"])
    algo, digest = lock["integrity"].split("-", 1)
    if base64.b64encode(hashlib.new(algo, data).digest()).decode() != digest:
        sys.exit("the GSAP download does not match package-lock.json; try again")
    vendor.mkdir(parents=True, exist_ok=True)
    with tarfile.open(fileobj=io.BytesIO(data)) as t:
        for f in GSAP_FILES:
            (vendor / f"{f}.min.js").write_bytes(t.extractfile(f"package/dist/{f}.min.js").read())


def have_narration():
    build = FILM / "build"
    try:
        timing = json.loads((build / "timing.json").read_text())
    except (OSError, ValueError):
        return False
    return all((build / "audio" / f"{s}.wav").exists() for s in timing["order"] if timing["scenes"][s]["kind"] != "title")


def ensure_narration(pack):
    if have_narration():
        return
    pack = Path(pack).expanduser() if pack else downloads() / PACK
    if pack.exists():
        step(f"Unpacking the narration from {pack}")
        run([sys.executable, TOOLS / "narration_pack.py", "unpack", FILM, pack])
        return
    step(f"No {PACK} in {pack.parent}: synthesising the narration here instead")
    ensure_packages(TTS_REQS, "tts")
    kdir = Path.home() / ".cache" / "llm-inference-video" / "kokoro"
    kdir.mkdir(parents=True, exist_ok=True)
    for name, sha in KOKORO.items():
        f = kdir / name
        if not (f.exists() and hashlib.sha256(f.read_bytes()).hexdigest() == sha):
            fetch(KOKORO_URL + name, f)
            if hashlib.sha256(f.read_bytes()).hexdigest() != sha:
                f.unlink()
                sys.exit(f"{name} did not download correctly; run the command again")
    run([sys.executable, TOOLS / "tts.py", FILM], env=dict(env(), KOKORO_DIR=str(kdir)))


# ---------------------------------------------------------------- machine
def memory_gb():
    try:
        if os.name == "nt":
            import ctypes

            class MS(ctypes.Structure):
                _fields_ = [("len", ctypes.c_ulong), ("load", ctypes.c_ulong)] + [(n, ctypes.c_ulonglong) for n in
                            ("total", "avail", "ptotal", "pavail", "vtotal", "vavail", "xavail")]
            m = MS(); m.len = ctypes.sizeof(MS)
            ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m))
            return m.total / 2 ** 30
        return os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES") / 2 ** 30
    except (OSError, ValueError, AttributeError):
        return None


def default_workers():
    # a worker keeps about 1.3 cores busy (Chromium rasterising and JPEG-ing 8 MP frames, x264 behind it)
    cores = os.cpu_count() or 2
    w = max(1, round(cores * 0.75))
    mem = memory_gb()
    if mem:
        w = min(w, max(1, int((mem - 3) // GB_PER_WORKER)))
    return min(w, 12)


def keep_awake():
    """Stop the computer sleeping while this runs (Windows, macOS); the screen may still turn off."""
    if os.name == "nt":
        import ctypes
        ctypes.windll.kernel32.SetThreadExecutionState(0x80000000 | 0x00000001)   # ES_CONTINUOUS | ES_SYSTEM_REQUIRED
    elif sys.platform == "darwin" and shutil.which("caffeinate"):
        subprocess.Popen(["caffeinate", "-i", "-w", str(os.getpid())])


# ---------------------------------------------------------------- main
def main(argv):
    ap = argparse.ArgumentParser(description="Render the film in 4K and save it to Downloads.")
    ap.add_argument("--out")
    ap.add_argument("--workers", type=int)
    ap.add_argument("--narration")
    ap.add_argument("--preset", default="slow")
    ap.add_argument("--crf", default="18")
    ap.add_argument("--only", nargs="+", metavar="CHAPTER")
    ap.add_argument("--keep-segments", action="store_true")
    a = ap.parse_args(argv)
    bootstrap(argv)

    t0 = time.time()
    ensure_packages(REQS, "base")
    step("Checking the browser (Playwright's Chromium)")
    run([sys.executable, "-m", "playwright", "install", "chromium"])
    ensure_gsap()
    ensure_narration(a.narration)
    sys.path.insert(0, str(TOOLS))
    from ffbin import frames_and_fps

    name = NAME + ("_" + "_".join(a.only) if a.only else "")
    out = Path(a.out).expanduser().resolve() if a.out else downloads() / f"{name}.mp4"
    timing = json.loads((FILM / "build" / "timing.json").read_text())
    order = [s for s in timing["order"] if not a.only or s.split("_")[0] in a.only]
    if not order:
        sys.exit(f"no chapters match {a.only}")
    frames = sum(round(timing["scenes"][s]["duration"] * 30) for s in order)
    workers = a.workers or default_workers()
    for where in {SEG.parent.parent, out.parent if out.parent.exists() else downloads()}:
        free = shutil.disk_usage(where).free / 1e9
        need = 4 + frames / 166140 * 6
        if free < need:
            print(f"warning: only {free:.0f} GB free on the drive holding {where}; about {need:.0f} GB is needed")

    keep_awake()
    step(f"Rendering {len(order)} scenes ({frames:,} frames, {frames / 30 / 60:.0f} min of film) at 3840x2160, "
         f"{workers} at a time. Stop any time; run the same command to resume.")
    run([sys.executable, TOOLS / "render.py", FILM, "video", *(a.only or ["all"]), "--scale", "2", "--out", SEG,
         "--skip-existing", "--workers", workers], env=dict(env(), PRESET=a.preset, CRF=str(a.crf)))

    step(f"Assembling the film: picture, narration (two audio tracks), subtitles, chapters -> {out}")
    run([sys.executable, TOOLS / "assemble.py", FILM, "--name", name, "--segments", SEG, "--out", out, *(["--only", *a.only] if a.only else [])])
    n, fps = frames_and_fps(out)
    if n != frames:
        sys.exit(f"{out} has {n} frames, expected {frames}; the 4K scene files are kept in {SEG}")
    if not a.keep_segments:
        for s in order:
            (SEG / f"{s}.mp4").unlink(missing_ok=True)
    h = (time.time() - t0) / 3600
    print(f"\nDone in {h:.1f} h: {out}  ({out.stat().st_size / 1e9:.2f} GB, 3840x2160, {n:,} frames at {fps:g} fps)")


if __name__ == "__main__":
    try:
        main(sys.argv[1:])
    except KeyboardInterrupt:
        print("\nStopped. Run the same command again to carry on; finished scenes are kept.")
        sys.exit(130)
    except subprocess.CalledProcessError as e:
        sys.exit(f"\nA step failed (exit code {e.returncode}). Fix what it reports and run the same command again; "
                 f"finished work is kept.")
