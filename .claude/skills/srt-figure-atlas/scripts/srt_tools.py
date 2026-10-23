#!/usr/bin/env python3
"""Turn a caption file into a timestamp-addressable reference.

  python3 srt_tools.py raw.srt --video V01 --title "The Memory Wall"
      -> V01_The_Memory_Wall.srt / .vtt / V01_index.md

  python3 srt_tools.py V01_The_Memory_Wall.srt --window 18:42 --pad 90
      -> prints the transcript spanning 18:42 +/- 90s

  python3 srt_tools.py V01_The_Memory_Wall.srt --read 0 620
      -> prints the whole range as merged ~20s paragraphs (use this to read the video)
"""
from __future__ import annotations
import argparse, re, sys
from pathlib import Path

TS = re.compile(r"^\s*(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?\s*$")
TS_IN = re.compile(r"^\s*(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?\s+(.+)$")
ARROW = re.compile(r"-->")


def secs(h, m, s, ms=None):
    t = int(h or 0) * 3600 + int(m) * 60 + int(s)
    return t + (int(ms.ljust(3, "0")) / 1000 if ms else 0)


def f_srt(t):
    ms = int(round((t - int(t)) * 1000)); t = int(t)
    return f"{t//3600:02d}:{(t%3600)//60:02d}:{t%60:02d},{ms:03d}"


def clock(t):
    t = int(t)
    return f"{t//3600}:{(t%3600)//60:02d}:{t%60:02d}" if t >= 3600 else f"{t//60}:{t%60:02d}"


def parse_srt(text):
    out = []
    for blk in re.split(r"\n\s*\n", text.strip()):
        L = [l for l in blk.splitlines() if l.strip()]
        tl = next((l for l in L if ARROW.search(l)), None)
        if not tl:
            continue
        def g(p):
            m = re.search(r"(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?", p)
            return secs(*m.groups()) if m else 0.0
        a, b = [g(x) for x in tl.split("-->")]
        body = " ".join(L[L.index(tl) + 1:]).strip()
        if body:
            out.append((a, b, body))
    return out


def parse_raw(text):
    cues, pend, buf = [], None, []
    for line in text.splitlines():
        s = line.strip()
        if not s or ARROW.search(s) or (s.isdigit() and pend is None and not buf):
            continue
        m = TS.match(s)
        if m:
            if pend is not None and buf:
                cues.append((pend, " ".join(buf).strip()))
            pend, buf = secs(*m.groups()), []
            continue
        m = TS_IN.match(s)
        if m:
            if pend is not None and buf:
                cues.append((pend, " ".join(buf).strip()))
            h, mm, ss, ms, t = m.groups()
            pend, buf = secs(h, mm, ss, ms), [t.strip()]
            continue
        if pend is not None:
            buf.append(s)
    if pend is not None and buf:
        cues.append((pend, " ".join(buf).strip()))
    pairs = [c for c in cues if c[1]]
    return [(a, (pairs[i+1][0] if i+1 < len(pairs) else a+4), t)
            for i, (a, t) in enumerate(pairs)]


def load(path):
    txt = Path(path).read_text(encoding="utf-8", errors="replace")
    return parse_srt(txt) if ARROW.search(txt[:4000]) else parse_raw(txt)


def paragraphs(cues, gap=20):
    out, cur, start = [], [], cues[0][0]
    for a, _, t in cues:
        if a - start >= gap and cur:
            out.append((start, " ".join(cur))); cur, start = [], a
        cur.append(t)
    out.append((start, " ".join(cur)))
    return out


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("infile", type=Path)
    p.add_argument("--video", default="V00"); p.add_argument("--title", default="Untitled")
    p.add_argument("--window", help="M:SS or H:MM:SS")
    p.add_argument("--pad", type=float, default=75)
    p.add_argument("--read", nargs=2, type=int, metavar=("FROM", "TO"),
                   help="print seconds FROM..TO as merged paragraphs")
    a = p.parse_args()
    cues = load(a.infile)
    if not cues:
        sys.exit("No timestamps found. Copy the transcript WITH timestamps turned on.")

    if a.read:
        for s, t in paragraphs(cues):
            if a.read[0] <= s < a.read[1]:
                print(f"[{clock(s)}] {t}")
        return
    if a.window:
        m = re.match(r"^(?:(\d+):)?(\d{1,2}):(\d{2})$", a.window.strip())
        if not m:
            sys.exit("timestamp must be M:SS or H:MM:SS")
        c = secs(*m.groups(), None); lo, hi = c - a.pad, c + a.pad
        hits = [(x, y, t) for x, y, t in cues if y >= lo and x <= hi]
        print(f"=== {clock(lo)} - {clock(hi)}  (centred on {clock(c)}) ===")
        for x, _, t in hits:
            print(f"[{clock(x)}] {t}")
        return

    stem = f"{a.video}_{a.title.replace(' ', '_')}"
    d = a.infile.parent
    (d / f"{stem}.srt").write_text("\n".join(
        f"{i}\n{f_srt(x)} --> {f_srt(y)}\n{t}\n" for i, (x, y, t) in enumerate(cues, 1)),
        encoding="utf-8")
    (d / f"{stem}.vtt").write_text("WEBVTT\n\n" + "\n".join(
        f"{f_srt(x).replace(',','.')} --> {f_srt(y).replace(',','.')}\n{t}\n"
        for x, y, t in cues), encoding="utf-8")
    lines = [f"# {a.video} — {a.title}", "", "| Minute | Opening words |", "|---|---|"]
    seen = set()
    for x, _, t in cues:
        mi = int(x) // 60
        if mi in seen:
            continue
        seen.add(mi)
        lines.append(f"| `{mi}:00` | {t[:90].replace('|', chr(92)+'|')}… |")
    lines += ["", f"**Cues:** {len(cues)}  **Runtime:** {clock(cues[-1][1])}"]
    (d / f"{a.video}_index.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"{len(cues)} cues, {clock(cues[-1][1])} covered")
    print(f"wrote {stem}.srt, {stem}.vtt, {a.video}_index.md")


if __name__ == "__main__":
    main()
