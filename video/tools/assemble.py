#!/usr/bin/env python3
"""Join rendered scene segments and narration into the finished film, with subtitles and chapters.

  python3 video/tools/assemble.py video/v01 --name V01_The_Memory_Wall

Needs build/timing.json (tools/tts.py), build/audio/*.wav and build/segments/*.mp4 (tools/render.py).
Writes build/<name>.mp4 (H.264 + AAC, soft English subtitles, chapter markers) and build/<name>.srt.
"""
import argparse, json, re, subprocess, sys, wave
from pathlib import Path

import numpy as np

SR = 24000


def ffprobe_frames(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v:0", "-show_entries",
                          "stream=nb_read_packets,r_frame_rate", "-of", "json", str(path)], capture_output=True, text=True, check=True)
    s = json.loads(out.stdout)["streams"][0]
    num, den = map(int, s["r_frame_rate"].split("/"))
    return int(s["nb_read_packets"]), num / den


def srt_time(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def cues_for_beat(beat, offset, maxlen=84):
    """Split a beat into subtitle cues of at most two ~42-character lines, timed by word estimates."""
    words = beat["words"]
    cues, cur, cur_start = [], [], None
    for i, w in enumerate(words):
        if cur_start is None:
            cur_start = w["start"]
        cur.append(w["w"])
        text = " ".join(cur)
        nxt = words[i + 1]["w"] if i + 1 < len(words) else None
        sentence_end = w["w"][-1] in ".!?"
        if len(text) >= maxlen or sentence_end or (nxt and len(text) + len(nxt) + 1 > maxlen):
            end = words[i + 1]["start"] if i + 1 < len(words) else beat["end"]
            cues.append((offset + cur_start, offset + end, text))
            cur, cur_start = [], None
    if cur:
        cues.append((offset + cur_start, offset + beat["end"], " ".join(cur)))
    out = []
    for a, b, t in cues:
        if len(t) > 42:  # break into two balanced lines
            mid = len(t) // 2
            cut = min((m.start() for m in re.finditer(" ", t)), key=lambda p: abs(p - mid))
            t = t[:cut] + "\n" + t[cut + 1:]
        out.append((a, max(b, a + 0.8), t))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("film")
    ap.add_argument("--name", default="film")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--no-music", action="store_true", help="narration only, no ambient bed track")
    ap.add_argument("--only", nargs="+", help="assemble just these chapters (e.g. ch01), each with its title card")
    a = ap.parse_args()
    film = Path(a.film).resolve()
    build = film / "build"
    timing = json.loads((build / "timing.json").read_text())
    order = timing["order"]
    if a.only:
        # a stand-alone cut: keep the chosen chapters and restart the clock at zero
        order = [s for s in order if s.split("_")[0] in a.only]
        t0 = timing["scenes"][order[0]]["globalStart"]
        for sid in order:
            timing["scenes"][sid] = dict(timing["scenes"][sid], globalStart=timing["scenes"][sid]["globalStart"] - t0)
        timing["total"] = sum(timing["scenes"][s]["duration"] for s in order)
        if timing["scenes"][order[0]]["kind"] == "title":
            timing["scenes"][order[0]] = dict(timing["scenes"][order[0]], chapter=dict(timing["scenes"][order[0]]["chapter"]))

    # 1. video: check every segment, then concatenate without re-encoding
    lst = build / "concat.txt"
    lines, t = [], 0.0
    for sid in order:
        seg = build / "segments" / f"{sid}.mp4"
        if not seg.exists():
            sys.exit(f"missing segment {seg}")
        n, fps = ffprobe_frames(seg)
        want = round(timing["scenes"][sid]["duration"] * fps)
        if n != want:
            sys.exit(f"{sid}: {n} frames, expected {want}")
        lines.append(f"file '{seg}'")
    lst.write_text("\n".join(lines) + "\n")
    video = build / "video_only.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(video)], check=True)

    # 2. narration: scene wavs in order, silence under title cards
    narr = build / "narration.wav"
    with wave.open(str(narr), "wb") as out:
        out.setnchannels(1); out.setsampwidth(2); out.setframerate(SR)
        for sid in order:
            sc = timing["scenes"][sid]
            n = int(round(sc["duration"] * SR))
            wf = build / "audio" / f"{sid}.wav"
            if sc["kind"] == "title" or not wf.exists():
                out.writeframes(np.zeros(n, dtype="<i2").tobytes())
                continue
            with wave.open(str(wf)) as w:
                data = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2")
            data = np.pad(data, (0, max(0, n - len(data))))[:n]
            out.writeframes(data.tobytes())

    # 3. subtitles and chapters
    cues = []
    meta = [";FFMETADATA1", f"title={a.name.replace('_', ' ')}"]
    for sid in order:
        sc = timing["scenes"][sid]
        g = sc["globalStart"]
        for b in sc["beats"]:
            cues += cues_for_beat(b, g)
        if sc["kind"] == "title" or (sc["chapter"]["id"] == "ch00" and sc["chapter"].get("enter")) or (a.only and sid == order[0]):
            meta += ["[CHAPTER]", "TIMEBASE=1/1000", f"START={int(g * 1000)}", "END=__END__",
                     f"title={sc['chapter']['number']} {sc['chapter']['title']}"]
    # chapter ends = next chapter's start
    starts = [i for i, ln in enumerate(meta) if ln == "[CHAPTER]"]
    for k, i in enumerate(starts):
        end = int(timing["total"] * 1000) if k + 1 == len(starts) else int(meta[starts[k + 1] + 2].split("=")[1])
        meta[i + 3] = f"END={end}"
    srt = build / f"{a.name}.srt"
    srt.write_text("\n".join(f"{i}\n{srt_time(s)} --> {srt_time(e)}\n{t}\n" for i, (s, e, t) in enumerate(cues, 1)))
    metaf = build / "chapters.txt"
    metaf.write_text("\n".join(meta) + "\n")

    # 4. final mux: video copied; track 1 = narration (normalised to -16 LUFS) over a quiet ducked ambient bed,
    #    track 2 = narration only; soft subtitles; chapters
    final = build / f"{a.name}.mp4"
    music = build / ("music.wav" if not a.only else "music_cut.wav")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(video), "-i", str(narr), "-i", str(srt), "-i", str(metaf)]
    if not a.no_music:
        if not music.exists():
            subprocess.run([sys.executable, str(Path(__file__).with_name("music.py")), str(music), "--seconds", str(timing["total"] + 1)], check=True)
        cmd += ["-i", str(music)]
        fc = ("[1:a]highpass=f=60,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,asplit=3[n1][n2][sc];"
              "[4:a]aresample=48000,volume=-15dB[m];"
              "[m][sc]sidechaincompress=threshold=0.02:ratio=4:attack=200:release=1200[md];"
              "[n1][md]amix=inputs=2:duration=first:normalize=0[mix]")
        cmd += ["-filter_complex", fc, "-map", "0:v", "-map", "[mix]", "-map", "[n2]", "-map", "2:s",
                "-metadata:s:a:0", "title=Narration with music", "-metadata:s:a:1", "title=Narration only",
                "-metadata:s:a:0", "language=eng", "-metadata:s:a:1", "language=eng", "-disposition:a:0", "default", "-disposition:a:1", "0"]
    else:
        cmd += ["-filter_complex", "[1:a]highpass=f=60,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[n]", "-map", "0:v", "-map", "[n]", "-map", "2:s",
                "-metadata:s:a:0", "language=eng"]
    cmd += ["-map_metadata", "3", "-map_chapters", "3", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
            "-c:s", "mov_text", "-metadata:s:s:0", "language=eng", "-movflags", "+faststart", "-shortest", str(final)]
    subprocess.run(cmd, check=True)
    size = final.stat().st_size / 1e6
    print(f"{final}  {timing['total']/60:.1f} min  {size:.0f} MB  {len(cues)} subtitle cues  {len(starts)} chapters")


if __name__ == "__main__":
    main()
