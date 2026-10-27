#!/usr/bin/env python3
"""Render a released film in 4K on this computer and save it as one video file in the repository folder, under
rendered/ (git leaves that folder alone: rendered video never goes into git).

  python video/tools/make_4k.py              # asks which film and which version (the latest unless you pick another)
  python video/tools/make_4k.py v01          # V01's latest version -> rendered/V01_The_Memory_Wall_4K_version4.mp4
  python video/tools/make_4k.py v01 --version 1
  python video/tools/make_4k.py --list       # the films, where each came from, and their versions

Or double-click make_film.bat (Windows) or make_film.command (Mac) at the top of the repository: they update from
GitHub first, then run this.

Every film keeps all its versions (video/vNN/film.json lists them, tools/release.py adds one). A version renders
from exactly the files it was released with, its scenes and narration and the shared engine as they were then, so
work on other films or on the engine never changes it.

- Each computer sets itself up on its first run: a private Python environment in video/.venv (Playwright with its
  own Chromium, numpy, a bundled ffmpeg), GSAP from npm, and a check of the graphics card and hardware video
  encoder (NVIDIA NVENC, Apple VideoToolbox) against the software path. Whatever matches the software look and is
  faster is used from then on. The result stays on that computer: --recheck redoes it, --cpu renders in software
  for one run.
- Narration: from the repository (video/vNN/narration, kept up to date by git pull); failing that, the film's
  narration pack (V01_narration_pack.zip for V01) from Downloads, the Desktop or the home folder; failing that, it
  is synthesised here with Kokoro (Python 3.13 or older, and a 350 MB voice model).
- Rendering takes from under an hour on a big workstation to several hours on a small computer. Stop it at any time
  (Ctrl+C, or close the window) and run the same command again: finished scenes are kept. It leaves room for other
  work, keeping memory in use under 80%; on Windows its processes opt out of the power saving that moves background
  work onto a hybrid processor's power-saving cores.

  --version N        render this version of the film (default: its latest)
  --working-copy     render the film's files as they are now, released or not (a draft)
  --list             list the films and their versions, and stop
  --out PATH         where to save the film (default: rendered/ in the repository folder)
  --workers N        scenes rendered at once (default: three quarters of the CPU threads, fewer where memory in
                     use, other programs included, would pass 80%)
  --cpu              draw and encode in software this time (the reference look), whatever the check found
  --recheck          check the graphics card and video encoder again
  --check            check the graphics card and video encoder again, report, and stop (no rendering)
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
CACHE = VIDEO / ".cache" / "segments"   # rendered scenes by fingerprint, kept across versions (tools/scenekeys.py)
RENDERED = VIDEO.parent / "rendered"     # the finished films, in the repository folder (ignored by git)
CACHE_DAYS = 90                          # a cached scene unused this long is deleted
REQS = ["playwright==1.56.0", "numpy", "imageio-ffmpeg", "certifi"]
TTS_REQS = ["kokoro-onnx==0.6.1"]
GSAP_FILES = ["gsap", "DrawSVGPlugin", "MorphSVGPlugin", "MotionPathPlugin", "CustomEase"]
KOKORO_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
KOKORO = {"kokoro-v1.0.onnx": "7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5",
          "voices-v1.0.bin": "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d"}
# memory per scene rendering at once: Chromium at 3840x2160 (~0.6 GB) plus its encoder (x264 ~1.8 GB, measured;
# the hardware encoders keep their buffers on the graphics card or media engine)
GB_PER_WORKER = {"x264": 2.6, "nvenc": 1.0, "videotoolbox": 1.0}
GB_GPU_DRAWING = 2.0    # more when Chromium draws on the graphics card: its GPU process and the memory it shares with
                        # the card (measured: 18 scenes at once on an RTX 5000 Ada, with NVENC, held about 50 GB)
MEMORY_TARGET = 0.8     # as many scenes at once as keep memory in use, other programs included, under this share
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


# ---------------------------------------------------------------- which film, which version
sys.path.insert(0, str(TOOLS))
import films  # noqa: E402  (standard library only: the menu works before the environment exists)


def ask(question, options, default):
    """The number picked on a terminal from options [(number, label)] (a film's number, or a version's); with one
    option, or no terminal to ask on, the default. Answers like 2, 02, v2 and V02 all mean 2."""
    if len(options) == 1 or not sys.stdin.isatty():
        return default
    print()
    for n, label in options:
        print(f"  {n}. {label}")
    numbers = [n for n, _ in options]
    while True:
        try:
            pick = input(f"{question} [{default}] ").strip().lower().lstrip("v").lstrip("0") or str(default)
        except EOFError:
            sys.exit("\nnothing chosen")
        if pick.isdigit() and int(pick) in numbers:
            return int(pick)
        print(f"  Type {', '.join(map(str, numbers[:-1]))} or {numbers[-1]}, or press Enter for {default}.")


def version_line(v, latest):
    return f"version {v['version']}, {v['date']}: {v.get('notes', '')}" + ("  (latest)" if latest else "")


def list_films():
    for d, m in films.films():
        print(films.describe(d, m))
        vs = m.get("versions") or []
        for v in reversed(vs):
            print("    " + version_line(v, v is vs[-1]))
        if not vs:
            print("    not released yet")


def choose(a):
    """(film folder, film.json, version, or None for the working copy): as the arguments say, else asked on a
    terminal, else the newest film's latest version."""
    if a.film:
        hit = films.find(a.film)
        if not hit:
            sys.exit(f"there is no film {a.film!r} here (films: {', '.join(d.name for d, _ in films.films()) or 'none'}); "
                     f"git pull brings new ones")
        folder, meta = hit
    else:
        released = [(d, m) for d, m in films.films() if m.get("versions")]
        if not released:
            sys.exit("there is no released film in this copy yet; git pull brings new ones")
        number = lambda d: int(d.name[1:])
        lines = [(number(d), f"{films.describe(d, m)}   [latest: version {m['versions'][-1]['version']}, "
                             f"{m['versions'][-1]['date']}" + (f"; {len(m['versions'])} versions]" if len(m["versions"]) > 1 else "]"))
                 for d, m in released]
        pick = ask("Which film?", lines, number(released[-1][0]))
        folder, meta = next((d, m) for d, m in released if number(d) == pick)
    if a.working_copy:
        return folder, meta, None
    vs = meta.get("versions") or []
    if not vs:
        sys.exit(f"{folder.name.upper()} has no released version yet (--working-copy renders its files as they are now)")
    if a.version is not None:
        v = next((v for v in vs if v["version"] == a.version), None)
        if v is None:
            sys.exit(f"{folder.name.upper()} has no version {a.version} (it has {', '.join(str(v['version']) for v in vs)})")
        return folder, meta, v
    if a.film:                                  # a film named on the command line means its latest version
        return folder, meta, vs[-1]
    pick = ask(f"Which version of {folder.name.upper()}?", [(v["version"], version_line(v, v is vs[-1])) for v in vs[::-1]],
               vs[-1]["version"])
    return folder, meta, next(v for v in vs if v["version"] == pick)


def inner_argv(a, folder, version):
    """The arguments that repeat this choice exactly, for the run inside video/.venv (which then asks nothing)."""
    argv = [folder.name] + (["--version", str(version["version"])] if version else ["--working-copy"])
    for flag, val in (("--out", a.out), ("--workers", a.workers), ("--narration", a.narration), ("--preset", a.preset),
                      ("--crf", a.crf)):
        if val is not None:
            argv += [flag, str(val)]
    if a.only:
        argv += ["--only", *a.only]
    return argv + [f for f, on in (("--keep-segments", a.keep_segments), ("--cpu", a.cpu),
                                   ("--recheck", a.recheck or a.gpu_recheck), ("--check", a.check)) if on]


def use_film(film_dir, meta, version):
    global FILM, NAME, PACK
    FILM = film_dir
    tag = f"version{version['version']}" if version else "working_copy"
    NAME = f"{film_dir.name.upper()}_{re.sub(r'[^A-Za-z0-9]+', '_', meta['title']).strip('_')}_4K_{tag}"
    PACK = f"{film_dir.name.upper()}_narration_pack"


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


def ensure_gsap(root):
    """GSAP in root/engine/vendor: the release root/package-lock.json pins (copied from this checkout when it is the
    same one, else fetched from npm and checked against the lock)."""
    vendor = root / "engine" / "vendor"
    if all((vendor / f"{f}.min.js").exists() for f in GSAP_FILES):
        return
    lock = json.loads((root / "package-lock.json").read_text())["packages"]["node_modules/gsap"]
    here = VIDEO / "engine" / "vendor"
    if (root != VIDEO and all((here / f"{f}.min.js").exists() for f in GSAP_FILES)
            and json.loads((VIDEO / "package-lock.json").read_text())["packages"]["node_modules/gsap"] == lock):
        shutil.copytree(here, vendor, dirs_exist_ok=True)
        return
    step("Fetching GSAP (the animation library) from npm")
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
    """(total memory, memory available to programs now) in GB; either is None where it cannot be read."""
    total = avail = None
    try:
        if os.name == "nt":
            import ctypes

            class MS(ctypes.Structure):
                _fields_ = [("len", ctypes.c_ulong), ("load", ctypes.c_ulong)] + [(n, ctypes.c_ulonglong) for n in
                            ("total", "avail", "ptotal", "pavail", "vtotal", "vavail", "xavail")]
            m = MS(); m.len = ctypes.sizeof(MS)
            ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m))
            return m.total / 2 ** 30, m.avail / 2 ** 30
        total = os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES") / 2 ** 30
        if sys.platform == "darwin":            # free pages, and those holding cache the system gives up on demand
            out = subprocess.run(["vm_stat"], capture_output=True, text=True).stdout
            page = int(re.search(r"page size of (\d+)", out).group(1))
            avail = page * sum(map(int, re.findall(r"Pages (?:free|inactive|speculative):\s+(\d+)", out))) / 2 ** 30
        else:
            with open("/proc/meminfo") as f:
                avail = next(int(ln.split()[1]) for ln in f if ln.startswith("MemAvailable:")) / 2 ** 20
    except (OSError, ValueError, AttributeError, StopIteration):
        pass
    return total, avail


def describe_machine():
    mem, _ = memory_gb()
    system = {"Darwin": "macOS", "Windows": "Windows"}.get(platform.system(), platform.system())
    return f"{system} ({platform.machine()}), {os.cpu_count()} logical CPUs" + (f", {mem:.0f} GB memory" if mem else "")


def default_workers(encoder="x264", gpu=None):
    """(how many scenes render at once, what sets that number). A worker keeps about 1.3 cores busy (Chromium drawing
    and JPEG-ing 8 MP frames, less when the GPU draws; the encoder behind it), so three quarters of the processor's
    threads; fewer where memory in use, counting what is already open, would pass MEMORY_TARGET of the total, so the
    computer stays usable for other work while it renders."""
    cores = os.cpu_count() or 2
    w, why = max(1, round(cores * 0.75)), f"for {cores} logical CPUs"
    total, avail = memory_gb()
    if total:
        in_use = total - avail if avail is not None else 3
        fit = max(1, int((MEMORY_TARGET * total - in_use) // (GB_PER_WORKER[encoder] + (GB_GPU_DRAWING if gpu else 0))))
        if fit < w:
            w, why = fit, f"keeping memory in use under {MEMORY_TARGET:.0%}"
    return (32, "at most 32") if w > 32 else (w, why)


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
    step("Checking this computer's graphics card and video encoder against software (a few minutes, once)")
    try:
        prof = gpu_check.check(FILM, json.loads((FILM / "build" / "timing.json").read_text()),
                               say=lambda m: print("   " + m, flush=True), keep=FILM / "build" / "gpu_check")
    except Exception as e:                      # the check must never stop a render: software always works
        print(f"   the check failed ({e}); rendering in software this time")
        return {"gpu": None, "encoder": "x264"}
    memo.write_text(json.dumps(prof))
    return prof


def prune_cache():
    """Delete cached scenes no render has used for CACHE_DAYS, and say how much the cache holds."""
    old = time.time() - CACHE_DAYS * 86400
    kept = 0
    for f in CACHE.glob("*.mp4"):
        if f.stat().st_mtime < old:
            for g in (f, f.with_suffix(".json")):
                g.unlink(missing_ok=True)
        else:
            kept += f.stat().st_size
    size = f"{kept / 1e9:.1f} GB" if kept >= 1e9 else f"{kept / 1e6:.0f} MB"
    print(f"(rendered scenes kept for the next version: {size} in {CACHE})")


def seg_dir(gpu, encoder):
    # one folder per way of rendering, so a resumed run never mixes scenes drawn or encoded differently
    profile = f"{(gpu or 'cpu').replace(':', '-')}-{encoder}"
    return FILM / "build" / ("segments_4k" if profile == "cpu-x264" else f"segments_4k_{profile}")


# ---------------------------------------------------------------- main
def main(argv):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film", nargs="?", help="v01, v02, ... (default: asked, or the newest film)")
    ap.add_argument("--version", type=int)
    ap.add_argument("--working-copy", action="store_true")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--out")
    ap.add_argument("--workers", type=int)
    ap.add_argument("--narration")
    ap.add_argument("--preset", default="slow")
    ap.add_argument("--crf", default="18")
    ap.add_argument("--only", nargs="+", metavar="CHAPTER")
    ap.add_argument("--keep-segments", action="store_true")
    ap.add_argument("--cpu", action="store_true")
    ap.add_argument("--recheck", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--gpu", action="store_true", help=argparse.SUPPRESS)            # (the default now)
    ap.add_argument("--gpu-recheck", action="store_true", help=argparse.SUPPRESS)    # (old name of --recheck)
    a = ap.parse_args(argv)
    if a.list:
        return list_films()
    folder, meta, version = choose(a)
    bootstrap(inner_argv(a, folder, version))       # from here on: inside video/.venv, with nothing left to ask

    t0 = time.time()
    root = films.snapshot(version["commit"]) if version else VIDEO
    use_film(root / folder.name, meta, version)
    what = f"version {version['version']} ({version['date']})" if version else "working copy (not a release)"
    step(f"{folder.name.upper()} {meta['title']}, {what}, in 4K on this computer: {describe_machine()}")
    ensure_packages(REQS, "base")
    install_browser()
    ensure_gsap(root)
    ensure_narration(a.narration)
    from ffbin import frames_and_fps

    if a.check:
        memo = VENV / "render-profile.json"
        try:
            before = json.loads(memo.read_text()) if memo.exists() else None
        except ValueError:
            before = None
        prof = render_profile(True)
        print(f"\nSaved: from now on this computer draws {'on the GPU (' + prof['gpu'] + ')' if prof['gpu'] else 'in software'}"
              f" and encodes with {ENCODERS[prof['encoder']]}.")
        if before and (before.get("gpu"), before.get("encoder")) != (prof["gpu"], prof["encoder"]):
            print("That is a change, so the next render draws every scene again once (scenes are reused only when "
                  "drawn and encoded the same way).")
        return
    prof = {"gpu": None, "encoder": "x264"} if a.cpu else render_profile(a.recheck or a.gpu_recheck)
    gpu, encoder = prof["gpu"], prof["encoder"]
    seg = seg_dir(gpu, encoder)

    name = NAME + ("_" + "_".join(a.only) if a.only else "")
    out = Path(a.out).expanduser().resolve() if a.out else RENDERED / f"{name}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    timing = json.loads((FILM / "build" / "timing.json").read_text())
    order = [s for s in timing["order"] if not a.only or s.split("_")[0] in a.only]
    if not order:
        sys.exit(f"no chapters match {a.only}")
    frames = sum(round(timing["scenes"][s]["duration"] * 30) for s in order)
    workers, why = (a.workers, "as asked") if a.workers else default_workers(encoder, gpu)
    for where in {seg.parent, out.parent}:
        free = shutil.disk_usage(where).free / 1e9
        need = 4 + frames / 166140 * 6
        if free < need:
            print(f"warning: only {free:.0f} GB free on the drive holding {where}; about {need:.0f} GB is needed")

    keep_awake()
    how = f"drawn {'on the GPU' if gpu else 'in software'}, encoded with {ENCODERS[encoder]}"
    step(f"Rendering {len(order)} scenes ({frames:,} frames, {frames / 30 / 60:.0f} min of film) at 3840x2160, "
         f"{workers} at a time ({why}), {how}. Stop any time; run the same command to resume.")
    run([sys.executable, TOOLS / "render.py", FILM, "video", *(a.only or ["all"]), "--scale", "2", "--out", seg,
         "--cache", CACHE, "--workers", workers, *(["--gpu", gpu] if gpu else []), "--encoder", encoder],
        env=dict(env(), PRESET=a.preset, CRF=str(a.crf)))

    step(f"Assembling the film: picture, narration (two audio tracks), subtitles, chapters -> {out}")
    run([sys.executable, TOOLS / "assemble.py", FILM, "--name", name, "--segments", seg, "--out", out, *(["--only", *a.only] if a.only else [])])
    n, fps = frames_and_fps(out)
    if n != frames:
        sys.exit(f"{out} has {n} frames, expected {frames}; the 4K scene files are kept in {seg}")
    if not a.keep_segments:
        shutil.rmtree(seg, ignore_errors=True)  # links into the cache; the rendered scenes themselves stay there
        if version:
            films.discard(version["commit"])    # the version's extracted files; the next render extracts them again
    prune_cache()
    h = (time.time() - t0) / 3600
    print(f"\nDone in {h:.1f} h: {out}  ({out.stat().st_size / 1e9:.2f} GB, 3840x2160, {n:,} frames at {fps:g} fps, {how}; "
          f"{folder.name.upper()} {what})")


if __name__ == "__main__":
    try:
        main(sys.argv[1:])
    except KeyboardInterrupt:
        print("\nStopped. Run the same command again to carry on; finished scenes are kept.")
        sys.exit(130)
    except subprocess.CalledProcessError as e:
        sys.exit(f"\nA step failed (exit code {e.returncode}). Fix what it reports and run the same command again; "
                 f"finished work is kept.")
    except RuntimeError as e:
        sys.exit(f"\n{e}")
    except OSError as e:            # includes urllib's URLError
        sys.exit(f"\nA download or file operation failed: {e}. Check the internet connection and disk, then run the "
                 f"same command again; finished work is kept.")
