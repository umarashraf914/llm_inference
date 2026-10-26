#!/usr/bin/env python3
"""Carry a film's finished narration between computers: build/timing.json plus every scene's audio.

  python3 video/tools/narration_pack.py export video/v01      # build/ -> video/v01/narration/ (committed to git)
  python3 video/tools/narration_pack.py import video/v01      # video/v01/narration/ -> build/ (make_4k.py does this)
  python3 video/tools/narration_pack.py pack video/v01 V01_narration_pack.zip      # the same, as one lossless zip
  python3 video/tools/narration_pack.py unpack video/v01 V01_narration_pack.zip

The committed form is the usual one: timing.json exactly as narrated, and each scene's audio as Opus at 64 kbit/s
(V01's 92 minutes come to 41 MB, and speech sounds the same), so git carries a film's narration to every computer.
The zip keeps the samples bit-exact (FLAC). Either way, the timing every scene is cut to is exact.
"""
import argparse, json, subprocess, sys, tempfile, wave, zipfile
from pathlib import Path

from ffbin import ffmpeg

SR = 24000
OPUS_RATE = "64k"
EXACT = ["-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact"]   # same input, same bytes


def decode(src, wav):
    subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", str(src), "-c:a", "pcm_s16le", "-ar", str(SR), "-ac", "1",
                    *EXACT, str(wav)], check=True)
    with wave.open(str(wav)) as w:
        assert w.getframerate() == SR and w.getnchannels() == 1


def scenes_with_audio(build):
    timing = json.loads((build / "timing.json").read_text())
    return timing, [s for s in timing["order"] if (build / "audio" / f"{s}.wav").exists()]


def export(film):
    build, out = film / "build", film / "narration"
    timing, scenes = scenes_with_audio(build)
    out.mkdir(exist_ok=True)
    for f in out.glob("*.opus"):
        f.unlink()
    for sid in scenes:
        subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", str(build / "audio" / f"{sid}.wav"), "-c:a", "libopus",
                        "-b:a", OPUS_RATE, *EXACT, str(out / f"{sid}.opus")], check=True)
    (out / "timing.json").write_bytes((build / "timing.json").read_bytes())
    size = sum(f.stat().st_size for f in out.iterdir())
    print(f"{out}  {len(scenes)} scenes, {timing['total'] / 60:.1f} min, {size / 1e6:.0f} MB")


def import_(film):
    build, src = film / "build", film / "narration"
    (build / "audio").mkdir(parents=True, exist_ok=True)
    clips = sorted(src.glob("*.opus"))
    for f in clips:
        decode(f, build / "audio" / f"{f.stem}.wav")
    (build / "timing.json").write_bytes((src / "timing.json").read_bytes())   # last: it marks the import complete
    print(f"narration for {len(clips)} scenes -> {build}")


def pack(film, dst):
    build = film / "build"
    timing, scenes = scenes_with_audio(build)
    with tempfile.TemporaryDirectory() as tmp, zipfile.ZipFile(dst, "w", zipfile.ZIP_STORED) as z:
        z.writestr("timing.json", json.dumps(timing, indent=1))
        for sid in scenes:
            flac = Path(tmp) / f"{sid}.flac"
            subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", str(build / "audio" / f"{sid}.wav"),
                            "-c:a", "flac", "-compression_level", "8", str(flac)], check=True)
            z.write(flac, f"audio/{sid}.flac")
        z.writestr("pack.json", json.dumps({"film": film.name, "scenes": scenes, "total": timing["total"]}))
    print(f"{dst}  {len(scenes)} scenes, {timing['total'] / 60:.1f} min, {dst.stat().st_size / 1e6:.0f} MB")


def unpack(film, src):
    build = film / "build"
    (build / "audio").mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(src) as z, tempfile.TemporaryDirectory() as tmp:
        meta = json.loads(z.read("pack.json"))
        if meta["film"] != film.name:
            sys.exit(f"{src} holds the narration for {meta['film']}, not {film.name}")
        for sid in meta["scenes"]:
            flac = Path(tmp) / f"{sid}.flac"
            flac.write_bytes(z.read(f"audio/{sid}.flac"))
            decode(flac, build / "audio" / f"{sid}.wav")
        (build / "timing.json").write_bytes(z.read("timing.json"))
    print(f"narration for {len(meta['scenes'])} scenes ({meta['total'] / 60:.1f} min) -> {build}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", choices=["export", "import", "pack", "unpack"])
    ap.add_argument("film")
    ap.add_argument("zip", nargs="?")
    a = ap.parse_args()
    film = Path(a.film).resolve()
    if a.mode in ("pack", "unpack"):
        if not a.zip:
            ap.error(f"{a.mode} needs the zip file")
        z = Path(a.zip).expanduser().resolve()
        pack(film, z) if a.mode == "pack" else unpack(film, z)
    else:
        export(film) if a.mode == "export" else import_(film)


if __name__ == "__main__":
    main()
