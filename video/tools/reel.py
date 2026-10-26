#!/usr/bin/env python3
"""A short film of only what changed: every scene that differs from a released version, each after a slate saying
which change it is and where it sits in the film. For reviewing a batch of changes in minutes, before releasing them.

  python3 video/tools/reel.py v01                  # changes since V01's latest version -> v01/build/V01_changes_since_version1.mp4
  python3 video/tools/reel.py v01 --since 1
  python3 video/tools/reel.py v01 --scenes ch05_s02 ch08_s07      # these scenes, changed or not

It renders this checkout (the working copy) at 1920x1080, with each scene's narration, reusing whatever was rendered
before (video/.cache). A scene counts as changed exactly when its fingerprint differs (tools/scenekeys.py), so the
reel holds what a new version would re-render.
"""
import argparse, json, shutil, subprocess, sys, wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import films, render, scenekeys  # noqa: E402
from ffbin import ffmpeg  # noqa: E402

SR, FPS, SLATE = 24000, 30, 2.5
CACHE = render.VIDEO / ".cache" / "segments"


def clock(t):
    m, s = divmod(int(t), 60)
    h, m = divmod(m, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def changed_since(folder, timing, version):
    """The scenes of the working copy whose fingerprint differs from the version's, in film order."""
    root = films.snapshot(version["commit"])
    try:
        lock = lambda r: json.loads((r / "package-lock.json").read_text())["packages"]["node_modules/gsap"]
        if lock(root) != lock(render.VIDEO):
            sys.exit("that version pins a different GSAP release; compare by rendering it instead")
        shutil.copytree(render.VIDEO / "engine" / "vendor", root / "engine" / "vendor", dirs_exist_ok=True)
        base = json.loads((root / folder.name / "narration" / "timing.json").read_text())
        settings = render.render_settings(1, FPS, None, "x264")
        old = scenekeys.scene_keys(root / folder.name, base, settings)
    finally:
        films.discard(version["commit"])
    new = scenekeys.scene_keys(folder, timing, settings)
    gone = [s for s in base["order"] if s not in timing["scenes"]]
    return [s for s in timing["order"] if old.get(s) != new[s]], gone


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film")
    ap.add_argument("--since", type=int, help="the version to compare with (default: the latest)")
    ap.add_argument("--scenes", nargs="+", help="show these scenes instead of working out what changed")
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--out")
    a = ap.parse_args()
    hit = films.find(a.film)
    if not hit:
        sys.exit(f"there is no film {a.film!r}")
    folder, meta = hit
    timing = json.loads((folder / "build" / "timing.json").read_text())
    tag = "selected_scenes"
    if a.scenes:
        changed, gone = [s for s in timing["order"] if s in set(a.scenes)], []
    else:
        vs = meta.get("versions") or []
        v = next((v for v in vs if v["version"] == a.since), None) if a.since else (vs[-1] if vs else None)
        if v is None:
            sys.exit(f"{folder.name.upper()} has no version {a.since or ''} to compare with")
        changed, gone = changed_since(folder, timing, v)
        tag = f"changes_since_version{v['version']}"
        print(f"{len(changed)} of {len(timing['order'])} scenes differ from version {v['version']}"
              + (f"; {len(gone)} of its scenes are gone ({', '.join(gone)})" if gone else ""))
    if not changed:
        return

    # each change opens with a slate: a title card the engine draws itself (ids ending _title load no scene file)
    slates = {}
    for i, s in enumerate(changed, 1):
        sc = timing["scenes"][s]
        slates[s] = sid = f"r{i:03d}_title"
        timing["scenes"][sid] = {"id": sid, "kind": "title", "duration": SLATE, "beats": [], "globalStart": 0,
                                 "chapter": {"id": "reel", "number": f"{i}/{len(changed)}",
                                             "title": f"{clock(sc['globalStart'])}  ·  {s}", "kicker": ""}}
    order = [x for s in changed for x in (slates[s], s)]
    out = folder / "build" / "reel"
    render.do_video(folder, timing, order, FPS, a.workers, scale=1, outdir=out, cache=CACHE)

    wav = out / "reel.wav"
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        for s in order:
            n = int(round(timing["scenes"][s]["duration"] * SR))
            data, f = np.zeros(n, "<i2"), folder / "build" / "audio" / f"{s}.wav"
            if f.exists():
                with wave.open(str(f)) as r:
                    d = np.frombuffer(r.readframes(r.getnframes()), "<i2")[:n]
                data[:len(d)] = d
            w.writeframes(data.tobytes())
    lst = out / "concat.txt"
    lst.write_text("".join("file '" + (out / f"{s}.mp4").as_posix().replace("'", "'\\''") + "'\n" for s in order))
    dst = Path(a.out).expanduser().resolve() if a.out else folder / "build" / f"{folder.name.upper()}_{tag}.mp4"
    subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-i", str(wav),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart",
                    str(dst)], check=True)
    total = sum(timing["scenes"][s]["duration"] for s in order)
    print(f"\n{dst}  {total / 60:.1f} min, {len(changed)} scenes:")
    for i, s in enumerate(changed, 1):
        sc = timing["scenes"][s]
        print(f"  {i:>3}. {clock(sc['globalStart']):>7}  {s:<11} {sc.get('chapter', {}).get('title', '')}")


if __name__ == "__main__":
    main()
