#!/usr/bin/env python3
"""Can this computer's graphics card render the film, and does it look the same?

  python video/tools/gpu_check.py            # prints a report; make_4k.py --gpu runs the same check

For each way Chromium can draw on the GPU (the headless shell, the full browser in new-headless mode) it asks
Chromium whether a real graphics card is drawing, then renders the same probe frames there and in software
(the look every audit was made against), compares them pixel by pixel and times both. It also test-encodes 4K
with NVIDIA's hardware encoder. GPU drawing is used only if it matches software closely and is faster.
"""
import argparse, json, re, subprocess, sys, tempfile, time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render  # noqa: E402
from ffbin import ffmpeg  # noqa: E402

FILM = render.VIDEO / "v01"
# blur and glow, gradients, hundreds of thin tiles, a chart, a long drawn path, big display type
PROBES = [("ch00_s02", 0.55), ("ch03_title", 0.6), ("ch08_s03", 0.5), ("ch11_s03", 0.6), ("ch14_s05", 0.6), ("ch18_s04", 0.9)]
FRAMES = 8                      # consecutive frames timed per probe
FAR = 64                        # a pixel is "far off" if a channel differs by more than this (of 255)
MIN_PSNR, MAX_FAR = 36.0, 0.002  # GPU drawing passes if every probe frame is at least this close


def capture(timing, gpu, scale=2):
    """Probe frames (JPEG bytes: per probe, its run of FRAMES consecutive frames) and seconds per frame, drawn with
    this gpu mode."""
    st = render.Stage(FILM, scale=scale, gpu=gpu)
    try:
        hardware, what = render.gpu_status(st.browser)
        runs, spent, n = [], 0.0, 0
        for sid, frac in PROBES:
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


def nvenc():
    """Does NVIDIA's hardware encoder take a 4K stream here? (str reason if not)"""
    out = subprocess.run([ffmpeg(), "-hide_banner", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=3840x2160:rate=30",
                          "-frames:v", "30", *render.encoder_args("nvenc", 2), "-f", "null", "-"], capture_output=True, text=True)
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


def check(timing, say=print, modes=("shell", "full"), allow_software=False, keep=None):
    """Decide how to render: {'gpu': None|'shell'|'full', 'encoder': 'x264'|'nvenc', 'report': [...]}."""
    report = []
    log = lambda m: (report.append(m), say(m))
    ok = nvenc()
    try:
        ref, cpu_s, _, _ = capture(timing, None)
    except Exception as e:
        log(f"software drawing failed: {e}")
        return {"gpu": None, "encoder": "x264", "report": report}
    log(f"software drawing: {cpu_s * 1000:.0f} ms per 4K frame")
    encoder = "x264"
    if ok is True:
        x_db, x_mb = encoded_quality(ref[:3], "x264")
        n_db, n_mb = encoded_quality(ref[:3], "nvenc")
        good = n_db >= x_db - 1.5
        log(f"NVIDIA video encoder (NVENC): {n_db:.1f} dB at {n_mb:.0f} Mbit/s, against x264's {x_db:.1f} dB at "
            f"{x_mb:.0f} Mbit/s -> {'as good' if good else 'NOT as good, keeping x264'}")
        encoder = "nvenc" if good else "x264"
    else:
        log(f"NVIDIA video encoder (NVENC): not available ({ok})")
    best = None
    for mode in modes:
        try:
            shots, gpu_s, hardware, what = capture(timing, mode)
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
            (keep / f"{PROBES[worst][0]}_software.jpg").write_bytes(ref[worst][0])
            (keep / f"{PROBES[worst][0]}_gpu_{mode}.jpg").write_bytes(shots[worst][0])
        if same and gpu_s < 0.85 * cpu_s and (best is None or gpu_s < best[1]):
            best = (mode, gpu_s)
    gpu = best[0] if best else None
    log(f"decision: draw {'on the GPU (' + gpu + ')' if gpu else 'in software'}, encode with "
        f"{'NVENC' if encoder == 'nvenc' else 'x264'}")
    return {"gpu": gpu, "encoder": encoder, "report": report}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--allow-software", action="store_true", help="test the GPU path on a software GPU (no speed-up)")
    a = ap.parse_args()
    timing = json.loads((FILM / "build" / "timing.json").read_text())
    res = check(timing, allow_software=a.allow_software, keep=FILM / "build" / "gpu_check")
    print(json.dumps({k: v for k, v in res.items() if k != "report"}))


if __name__ == "__main__":
    main()
