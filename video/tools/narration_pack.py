#!/usr/bin/env python3
"""Carry a film's finished narration to another machine: build/timing.json plus every scene's audio, losslessly
compressed (FLAC), in one zip. Unpacking restores the exact samples and timing the film was cut to, so a render
elsewhere needs no speech synthesis and matches this one frame for frame.

  python3 video/tools/narration_pack.py pack video/v01 V01_narration_pack.zip
  python3 video/tools/narration_pack.py unpack video/v01 V01_narration_pack.zip
"""
import argparse, json, subprocess, sys, tempfile, wave, zipfile
from pathlib import Path

from ffbin import ffmpeg

SR = 24000


def pack(film, dst):
    build = film / "build"
    timing = json.loads((build / "timing.json").read_text())
    scenes = [s for s in timing["order"] if (build / "audio" / f"{s}.wav").exists()]
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
            wav = build / "audio" / f"{sid}.wav"
            subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", str(flac), "-c:a", "pcm_s16le", "-ar", str(SR), "-ac", "1",
                            "-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact", str(wav)], check=True)
            with wave.open(str(wav)) as w:
                assert w.getframerate() == SR and w.getnchannels() == 1
        (build / "timing.json").write_bytes(z.read("timing.json"))
    print(f"narration for {len(meta['scenes'])} scenes ({meta['total'] / 60:.1f} min) -> {build}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["pack", "unpack"])
    ap.add_argument("film")
    ap.add_argument("zip")
    a = ap.parse_args()
    film, z = Path(a.film).resolve(), Path(a.zip).expanduser().resolve()
    pack(film, z) if a.mode == "pack" else unpack(film, z)


if __name__ == "__main__":
    main()
