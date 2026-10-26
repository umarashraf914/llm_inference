#!/usr/bin/env python3
"""Render a finished film in 4K on this computer and save it as one video file in Downloads.

  python video/tools/make_4k.py              # the newest finished film (asks which, if several are ready)
  python video/tools/make_4k.py v01          # -> Downloads/V01_The_Memory_Wall_4K.mp4

Or double-click make_film.bat (Windows) or make_film.command (Mac) at the top of the repository: they update from
GitHub first, then run this. It works the same way on every computer and sets itself up for each one:

- First run on a computer: a private Python environment in video/.venv (Playwright with its own Chromium, numpy, a
  bundled ffmpeg), GSAP from npm, and a check of the graphics card and hardware video encoder (NVIDIA NVENC, Apple
  VideoToolbox) against the software path. Whatever matches the software look and is faster is used from then on.
  The result stays on that computer: --recheck redoes it, --cpu renders in software for one run.
- Narration: from the repository (video/vNN/narration, kept up to date by git pull); failing that, the film's
  narration pack (V01_narration_pack.zip for V01) from Downloads, the Desktop or the home folder; failing that, it
  is synthesised here with Kokoro (Python 3.13 or older, and a 350 MB voice model).
- Rendering takes from under an hour on a big workstation to several hours on a small computer. Stop it at any time
  (Ctrl+C, or close the window) and run the same command again: finished scenes are kept.

  --out PATH         where to save the film (default: your Downloads folder)
  --workers N        scenes rendered at once (default: from CPU cores, memory and the encoder)
  --cpu              draw and encode in software this time (the reference look), whatever the check found
  --recheck          check the graphics card and video encoder again
  --narration ZIP    use this narration pack instead of the repository's narration
  --preset P         x264 preset: slow (default), medium (faster, slightly larger file)
  --only ch18 ...    just these chapters, as a quick test (saved as ..._4K_ch18.mp4)
  --keep-segments    keep the per-scene 4K files after the film is assembled
"""
import argparse, base64, hashlib, io, json, os, platform, re, shutil, subprocess, sys, tarfile, time
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
VIDEO = TOOLS.parent
FILM = NAME = PACK = None             # the film being rendered: see use_film()
VENV = VIDEO / ".venv"
REQS = ["playwright==1.56.0", "numpy", "imageio-ffmpeg", "certifi"]
TTS_REQS = ["kokoro-onnx==0.6.1"]
GSAP_FILES = ["gsap", "DrawSVGPlugin", "MorphSVGPlugin", "MotionPathPlugin", "CustomEase"]
KOKORO_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
KOKORO = {"kokoro-v1.0.onnx": "7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5",
          "voices-v1.0.bin": "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d"}
# memory per scene rendering at once: Chromium at 3840x2160 (~0.6 GB) plus its encoder (x264 ~1.8 GB, measured;
# the hardware encoders keep their buffers on the graphics card or media engine)
GB_PER_WORKER = {"x264": 2.6, "nvenc": 1.0, "videotoolbox": 1.0}
ENCODERS = {"x264": "x264", "nvenc": "NVIDIA NVENC", "videotoolbox": "Apple VideoToolbox"}


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


# ---------------------------------------------------------------- which film
def films():
    """The films in this copy of the repository, oldest first: (folder, film.json) for each video/vNN."""
    return [(d, json.loads((d / "film.json").read_text())) for d in sorted(VIDEO.glob("v[0-9][0-9]"))
            if (d / "film.json").is_file()]


def choose_film(arg):
    have = films()
    if arg:
        want = "v" + arg.lower().lstrip("v").zfill(2)          # v01, V01, 01 and 1 all mean video/v01
        for d, meta in have:
            if d.name == want:
                return d, meta
        sys.exit(f"there is no film {arg!r} here (films: {', '.join(d.name for d, _ in have) or 'none'}); "
                 f"git pull brings new ones")
    ready = [(d, m) for d, m in have if m.get("ready")]
    if not ready:
        sys.exit("there is no finished film in this copy yet; git pull brings new ones")
    if len(ready) == 1 or not sys.stdin.isatty():
        return ready[-1]
    print("\nFilms ready to render:")
    for i, (d, m) in enumerate(ready, 1):
        print(f"  {i}. {d.name.upper()}  {m['title']}")
    pick = input(f"Which one? [{len(ready)}] ").strip()
    n = int(pick) if pick.isdigit() else (len(ready) if not pick else 0)
    if not 1 <= n <= len(ready):
        sys.exit(f"{pick!r} is not one of 1-{len(ready)}")
    return ready[n - 1]


def use_film(folder, meta):
    global FILM, NAME, PACK
    FILM = folder
    NAME = f"{folder.name.upper()}_{re.sub(r'[^A-Za-z0-9]+', '_', meta['title']).strip('_')}_4K"
    PACK = f"{folder.name.upper()}_narration_pack"


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
    """Download url (to dst, with progress, or into memory). Trusts the system's certificates first (they include
    any proxy's), then certifi's (python.org builds on macOS ship without a store)."""
    import ssl, urllib.error, urllib.request, certifi
    try:
        return _fetch(url, dst, ssl.create_default_context())
    except urllib.error.URLError as e:
        if not isinstance(e.reason, ssl.SSLCertVerificationError):
            raise
        return _fetch(url, dst, ssl.create_default_context(cafile=certifi.where()))


def _fetch(url, dst, ctx):
    import urllib.request
    with urllib.request.urlopen(url, context=ctx, timeout=60) as r:
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


def system_certificates():
    """The certificate authorities this computer trusts, as one PEM file (or None).

    Playwright downloads its browser with Node.js, which trusts only its own built-in list. On a network that
    inspects HTTPS with its own authority (common at companies and institutes) that download fails with
    'self-signed certificate in certificate chain' while pip and Python, which use the system store, work.
    Node takes extra authorities from NODE_EXTRA_CA_CERTS, so hand it the system's."""
    import re, ssl
    ders = []
    if os.name == "nt":
        for store in ("ROOT", "CA"):
            try:
                ders += [der for der, enc, trust in ssl.enum_certificates(store)
                         if enc == "x509_asn" and (trust is True or "1.3.6.1.5.5.7.3.1" in trust)]   # server auth
            except OSError:
                pass
    elif sys.platform == "darwin":
        for kc in ("/Library/Keychains/System.keychain", "/System/Library/Keychains/SystemRootCertificates.keychain"):
            try:
                out = subprocess.run(["security", "find-certificate", "-a", "-p", kc], capture_output=True, text=True).stdout
            except OSError:
                continue
            ders += [ssl.PEM_cert_to_DER_cert(m) for m in re.findall(r"-----BEGIN CERTIFICATE-----.+?-----END CERTIFICATE-----", out, re.S)]
    else:
        f = ssl.get_default_verify_paths().cafile
        return Path(f) if f and os.path.isfile(f) else None
    return write_certificates(ders, VENV / "system-certificates.pem")


def write_certificates(ders, path):
    # keep only certificates OpenSSL can parse, so one odd store entry cannot spoil the file
    import ssl
    good = []
    for der in dict.fromkeys(ders):
        try:
            ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT).load_verify_locations(cadata=der)
            good.append(ssl.DER_cert_to_PEM_cert(der))
        except (ValueError, OSError):           # ssl.SSLError is an OSError
            pass
    if not good:
        return None
    path.write_text("".join(good))
    return path


def install_browser():
    step("Checking the browser (Playwright's Chromium)")
    e = env()
    if not e.get("NODE_EXTRA_CA_CERTS"):
        ca = system_certificates()
        if ca:
            e["NODE_EXTRA_CA_CERTS"] = str(ca)
    try:
        run([sys.executable, "-m", "playwright", "install", "chromium"], env=e)
    except subprocess.CalledProcessError:
        sys.exit("\nCould not download Playwright's Chromium (see above). If this network inspects HTTPS, ask for its root "
                 "certificate as a .pem file, point NODE_EXTRA_CA_CERTS at it (Windows: set NODE_EXTRA_CA_CERTS=C:\\path\\root.pem; "
                 "macOS/Linux: export NODE_EXTRA_CA_CERTS=/path/root.pem) and run the same command again.")


def have_narration():
    build = FILM / "build"
    try:
        timing = json.loads((build / "timing.json").read_text())
    except (OSError, ValueError):
        return False
    return all((build / "audio" / f"{s}.wav").exists() for s in timing["order"] if timing["scenes"][s]["kind"] != "title")


def find_pack(given):
    """The narration pack: as given, else the newest V01_narration_pack*.zip for V01 (a browser names a second
    download 'V01_narration_pack (1).zip') in Downloads, on the Desktop, in the home folder or beside the repository."""
    if given:
        return Path(given).expanduser()
    home = Path.home()
    places = [downloads(), home / "Desktop", home / "OneDrive" / "Desktop", home / "OneDrive" / "Downloads", home, VIDEO.parent]
    hits = [f for d in places for f in d.glob(f"{PACK}*.zip") if f.is_file()]
    return max(hits, key=lambda f: f.stat().st_mtime) if hits else None


def ensure_narration(given):
    src, build = FILM / "narration", FILM / "build"
    if (src / "timing.json").exists() and not given:
        # the repository's narration is the reference: decode it again whenever it differs from what build/ holds
        held = build / "timing.json"
        fresh = held.exists() and held.read_bytes() == (src / "timing.json").read_bytes() and all(
            (build / "audio" / f"{f.stem}.wav").exists() for f in src.glob("*.opus"))
        if not fresh:
            step(f"Narration: decoding it from the repository ({src.relative_to(VIDEO.parent).as_posix()})")
            run([sys.executable, TOOLS / "narration_pack.py", "import", FILM])
        return
    if have_narration():
        return
    pack = find_pack(given)
    if pack and pack.exists():
        step(f"Unpacking the narration from {pack}")
        run([sys.executable, TOOLS / "narration_pack.py", "unpack", FILM, pack])
        return
    if given:
        sys.exit(f"{given} does not exist")
    if sys.version_info >= (3, 14):
        sys.exit(f"\n{PACK}.zip was not found (looked in Downloads, on the Desktop and in the home folder). Put it in your "
                 f"Downloads folder and run the same command again. (Without it the narration would be synthesised here, "
                 f"but the speech engine, kokoro-onnx, does not support Python {sys.version_info[0]}.{sys.version_info[1]} yet.)")
    step(f"No {PACK}.zip found (looked in Downloads, on the Desktop and in the home folder): synthesising the narration "
         f"here instead")
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


def describe_machine():
    mem = memory_gb()
    system = {"Darwin": "macOS", "Windows": "Windows"}.get(platform.system(), platform.system())
    return f"{system} ({platform.machine()}), {os.cpu_count()} logical CPUs" + (f", {mem:.0f} GB memory" if mem else "")


def default_workers(encoder="x264"):
    # a worker keeps about 1.3 cores busy (Chromium drawing and JPEG-ing 8 MP frames, less when the GPU draws; the
    # encoder behind it), so cores and memory set how many scenes render at once
    cores = os.cpu_count() or 2
    w = max(1, round(cores * 0.75))
    mem = memory_gb()
    if mem:
        w = min(w, max(1, int((mem - 3) // GB_PER_WORKER[encoder])))
    return min(w, 32)


def keep_awake():
    """Stop the computer sleeping while this runs (Windows, macOS); the screen may still turn off."""
    if os.name == "nt":
        import ctypes
        ctypes.windll.kernel32.SetThreadExecutionState(0x80000000 | 0x00000001)   # ES_CONTINUOUS | ES_SYSTEM_REQUIRED
    elif sys.platform == "darwin" and shutil.which("caffeinate"):
        subprocess.Popen(["caffeinate", "-i", "-w", str(os.getpid())])


def render_profile(recheck):
    """How this computer renders (gpu_check.check): worked out on its first run and remembered, so every later run,
    and a resumed one above all, renders the same way."""
    import gpu_check
    memo = VENV / "render-profile.json"
    if memo.exists() and not recheck:
        try:
            prof = json.loads(memo.read_text())
        except ValueError:
            prof = {}
        if prof.get("version") == gpu_check.VERSION:
            step("This computer renders as its first-run check found (--recheck redoes it):")
            for line in prof["report"]:
                print("   " + line)
            return prof
    step("Checking this computer's graphics card and video encoder against software (a minute or two, once)")
    try:
        prof = gpu_check.check(FILM, json.loads((FILM / "build" / "timing.json").read_text()),
                               say=lambda m: print("   " + m, flush=True), keep=FILM / "build" / "gpu_check")
    except Exception as e:                      # the check must never stop a render: software always works
        print(f"   the check failed ({e}); rendering in software this time")
        return {"gpu": None, "encoder": "x264"}
    memo.write_text(json.dumps(prof))
    return prof


def seg_dir(gpu, encoder):
    # one folder per way of rendering, so a resumed run never mixes scenes drawn or encoded differently
    profile = f"{gpu or 'cpu'}-{encoder}"
    return FILM / "build" / ("segments_4k" if profile == "cpu-x264" else f"segments_4k_{profile}")


# ---------------------------------------------------------------- main
def main(argv):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film", nargs="?", help="v01, v02, ... (default: the newest finished film)")
    ap.add_argument("--out")
    ap.add_argument("--workers", type=int)
    ap.add_argument("--narration")
    ap.add_argument("--preset", default="slow")
    ap.add_argument("--crf", default="18")
    ap.add_argument("--only", nargs="+", metavar="CHAPTER")
    ap.add_argument("--keep-segments", action="store_true")
    ap.add_argument("--cpu", action="store_true")
    ap.add_argument("--recheck", action="store_true")
    ap.add_argument("--gpu", action="store_true", help=argparse.SUPPRESS)            # (the default now)
    ap.add_argument("--gpu-recheck", action="store_true", help=argparse.SUPPRESS)    # (old name of --recheck)
    a = ap.parse_args(argv)
    bootstrap(argv)

    use_film(*choose_film(a.film))
    t0 = time.time()
    step(f"{FILM.name.upper()} in 4K on this computer: {describe_machine()}")
    ensure_packages(REQS, "base")
    install_browser()
    ensure_gsap()
    ensure_narration(a.narration)
    sys.path.insert(0, str(TOOLS))
    from ffbin import frames_and_fps

    prof = {"gpu": None, "encoder": "x264"} if a.cpu else render_profile(a.recheck or a.gpu_recheck)
    gpu, encoder = prof["gpu"], prof["encoder"]
    seg = seg_dir(gpu, encoder)

    name = NAME + ("_" + "_".join(a.only) if a.only else "")
    out = Path(a.out).expanduser().resolve() if a.out else downloads() / f"{name}.mp4"
    timing = json.loads((FILM / "build" / "timing.json").read_text())
    order = [s for s in timing["order"] if not a.only or s.split("_")[0] in a.only]
    if not order:
        sys.exit(f"no chapters match {a.only}")
    frames = sum(round(timing["scenes"][s]["duration"] * 30) for s in order)
    workers = a.workers or default_workers(encoder)
    for where in {seg.parent, out.parent if out.parent.exists() else downloads()}:
        free = shutil.disk_usage(where).free / 1e9
        need = 4 + frames / 166140 * 6
        if free < need:
            print(f"warning: only {free:.0f} GB free on the drive holding {where}; about {need:.0f} GB is needed")

    keep_awake()
    how = f"drawn {'on the GPU' if gpu else 'in software'}, encoded with {ENCODERS[encoder]}"
    step(f"Rendering {len(order)} scenes ({frames:,} frames, {frames / 30 / 60:.0f} min of film) at 3840x2160, "
         f"{workers} at a time, {how}. Stop any time; run the same command to resume.")
    run([sys.executable, TOOLS / "render.py", FILM, "video", *(a.only or ["all"]), "--scale", "2", "--out", seg,
         "--skip-existing", "--workers", workers, *(["--gpu", gpu] if gpu else []), "--encoder", encoder],
        env=dict(env(), PRESET=a.preset, CRF=str(a.crf)))

    step(f"Assembling the film: picture, narration (two audio tracks), subtitles, chapters -> {out}")
    run([sys.executable, TOOLS / "assemble.py", FILM, "--name", name, "--segments", seg, "--out", out, *(["--only", *a.only] if a.only else [])])
    n, fps = frames_and_fps(out)
    if n != frames:
        sys.exit(f"{out} has {n} frames, expected {frames}; the 4K scene files are kept in {seg}")
    if not a.keep_segments:
        for s in order:
            try:
                (seg / f"{s}.mp4").unlink(missing_ok=True)
            except OSError:                     # (a virus scanner holding it; a leftover file does no harm)
                pass
    h = (time.time() - t0) / 3600
    print(f"\nDone in {h:.1f} h: {out}  ({out.stat().st_size / 1e9:.2f} GB, 3840x2160, {n:,} frames at {fps:g} fps, {how})")


if __name__ == "__main__":
    try:
        main(sys.argv[1:])
    except KeyboardInterrupt:
        print("\nStopped. Run the same command again to carry on; finished scenes are kept.")
        sys.exit(130)
    except subprocess.CalledProcessError as e:
        sys.exit(f"\nA step failed (exit code {e.returncode}). Fix what it reports and run the same command again; "
                 f"finished work is kept.")
    except OSError as e:            # includes urllib's URLError
        sys.exit(f"\nA download or file operation failed: {e}. Check the internet connection and disk, then run the "
                 f"same command again; finished work is kept.")
