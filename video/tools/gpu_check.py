#!/usr/bin/env python3
"""How should this computer render? Its graphics card and hardware video encoder, checked against software.

  python video/tools/gpu_check.py [v01]       # prints a report; make_4k.py runs the same check on a computer's first run

Chromium can draw on the graphics card, through the headless shell or the full browser in new-headless mode. For each
way, this asks Chromium whether a real graphics card is drawing, renders the same probe frames there and in software
(the look every audit was made against), compares them pixel by pixel and times both. It also encodes the probe
frames with this computer's hardware encoder (NVIDIA NVENC, or Apple VideoToolbox on a Mac) and with x264, and
compares both after decoding. The GPU is used only where it matches software closely and is faster.
"""
import argparse, json, re, subprocess, sys, tempfile, time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render  # noqa: E402
from ffbin import ffmpeg  # noqa: E402

VERSION = 2                     # bump when the choices change, so every computer checks again
FRAMES = 8                      # consecutive frames timed per probe
FAR = 64                        # a pixel is "far off" if a channel differs by more than this (of 255)
MIN_PSNR, MAX_FAR = 36.0, 0.002  # GPU drawing passes if every probe frame is at least this close
MAX_LOSS = 1.5                  # dB a hardware encoder may give up against x264
HARDWARE_ENCODERS = ["videotoolbox"] if sys.platform == "darwin" else ["nvenc"]
NAMES = {"x264": "x264", "nvenc": "NVIDIA NVENC", "videotoolbox": "Apple VideoToolbox"}


def probes(timing, n=6):
    """The first title card and n scenes spread through the film, each a little past its middle."""
    kind = lambda s: timing["scenes"][s]["kind"]
    scenes = [s for s in timing["order"] if kind(s) != "title"]
    picks = [s for s in timing["order"] if kind(s) == "title"][:1]
    picks += [scenes[round(i * (len(scenes) - 1) / max(1, n - 1))] for i in range(min(n, len(scenes)))]
    return [(s, 0.55) for s in dict.fromkeys(picks)]


def capture(film, timing, picks, gpu, scale=2):
    """Per probe, a run of FRAMES consecutive frames (JPEG bytes) drawn with this gpu mode, and seconds per frame."""
    st = render.Stage(film, scale=scale, gpu=gpu)
    try:
        hardware, what = render.gpu_status(st.browser)
        runs, spent, n = [], 0.0, 0
        for sid, frac in picks:
            entry = timing["scenes"][sid]
            st.load(entry)
            t0 = round(entry["duration"] * frac * 30) / 30
            run = []
            for i in range(FRAMES):
                a = time.perf_counter()
                st.seek(t0 + i / 30)
                run.append(st.jpeg())
                if i:                           # the first frame after a load warms caches; time the rest
                    spent += time.perf_counter() - a; n += 1
            runs.append(run)
        return runs, spent / n, hardware, what
    finally:
        st.close()


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


def check(film, timing, say=print, modes=("shell", "full"), allow_software=False, keep=None):
    """Decide how this computer renders: {'version', 'gpu': None|'shell'|'full', 'encoder', 'report': [...]}."""
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
    for mode in modes:
        try:
            shots, gpu_s, hardware, what = capture(film, timing, picks, mode)
        except Exception as e:
            log(f"GPU drawing ({mode}): could not start ({str(e).splitlines()[0][:160]})")
            continue
        if not hardware and not allow_software:
            log(f"GPU drawing ({mode}): no graphics card in use ({what})")
            continue
        scores = [compare(a[0], b[0]) for a, b in zip(ref, shots)]
        psnr, far = min(s[0] for s in scores), max(s[1] for s in scores)
        same = psnr >= MIN_PSNR and far <= MAX_FAR
        log(f"GPU drawing ({mode}): {what}; {gpu_s * 1000:.0f} ms per frame ({cpu_s / gpu_s:.1f}x software); "
            f"worst probe frame {psnr:.1f} dB, {100 * far:.3f}% of its pixels far off -> "
            f"{'matches' if same else 'DIFFERS from'} software")
        if keep:
            keep.mkdir(parents=True, exist_ok=True)
            worst = min(range(len(scores)), key=lambda i: scores[i][0])
            (keep / f"{picks[worst][0]}_software.jpg").write_bytes(ref[worst][0])
            (keep / f"{picks[worst][0]}_gpu_{mode}.jpg").write_bytes(shots[worst][0])
        if same and gpu_s < 0.85 * cpu_s and (best_s is None or gpu_s < best_s):
            decision["gpu"], best_s = mode, gpu_s
    log(f"decision: draw {'on the GPU (' + decision['gpu'] + ')' if decision['gpu'] else 'in software'}, "
        f"encode with {NAMES[decision['encoder']]}")
    return decision


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("film", nargs="?", default="v01")
    ap.add_argument("--allow-software", action="store_true", help="test the GPU path on a software GPU (no speed-up)")
    a = ap.parse_args()
    film = render.VIDEO / a.film
    timing = json.loads((film / "build" / "timing.json").read_text())
    res = check(film, timing, allow_software=a.allow_software, keep=film / "build" / "gpu_check")
    print(json.dumps({k: v for k, v in res.items() if k != "report"}))


if __name__ == "__main__":
    main()
