#!/usr/bin/env python3
"""What is on screen at a moment of a film: chapter, scene, the sentence being spoken, the word, the file to edit.

  python3 video/tools/where.py v01 23:41 45:10.5 1:02:33     # in V01's latest version
  python3 video/tools/where.py v01 23:41 --version 1
  python3 video/tools/where.py v01 23:41 --working-copy       # in the narration as it is now

Times are as a player shows them (m:ss, h:mm:ss, with or without fractions, or plain seconds), so notes taken while
watching ("23:41 the arrow overlaps the label") point straight at the scene and line to change.
"""
import argparse, json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import films  # noqa: E402


def seconds(stamp):
    t = 0.0
    for part in stamp.split(":"):
        t = t * 60 + float(part)
    return t


def clock(t):
    m, s = divmod(t, 60)
    h, m = divmod(int(m), 60)
    return f"{h}:{m:02d}:{s:04.1f}" if h else f"{m}:{s:04.1f}"


def timing_of(folder, meta, version, working):
    if working:
        for p in (folder / "build" / "timing.json", folder / "narration" / "timing.json"):
            if p.exists():
                return json.loads(p.read_text()), "the working copy"
        sys.exit(f"{folder.name} has no narration timing yet")
    vs = meta.get("versions") or []
    v = next((v for v in vs if v["version"] == version), None) if version else (vs[-1] if vs else None)
    if v is None:
        sys.exit(f"{folder.name.upper()} has no version {version}" if version else f"{folder.name.upper()} is not released yet")
    rel = (folder / "narration" / "timing.json").relative_to(films.REPO).as_posix()
    out = films.git("show", f"{v['commit']}:{rel}")
    if out.returncode:
        sys.exit(f"could not read {rel} at {v['commit'][:12]}: {out.stderr.strip()}")
    return json.loads(out.stdout), f"version {v['version']}"


def where(timing, t):
    for sid in timing["order"]:
        sc = timing["scenes"][sid]
        if sc["globalStart"] <= t < sc["globalStart"] + sc["duration"]:
            return sid, sc, t - sc["globalStart"]
    return None, None, None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film")
    ap.add_argument("times", nargs="+")
    ap.add_argument("--version", type=int)
    ap.add_argument("--working-copy", action="store_true")
    a = ap.parse_args()
    hit = films.find(a.film)
    if not hit:
        sys.exit(f"there is no film {a.film!r}")
    folder, meta = hit
    timing, which = timing_of(folder, meta, a.version, a.working_copy)
    print(f"{folder.name.upper()} {meta['title']}, {which} ({timing['total'] / 60:.1f} min)")
    for stamp in a.times:
        t = seconds(stamp)
        sid, sc, local = where(timing, t)
        if sid is None:
            print(f"\n{stamp}: past the end")
            continue
        ch = sc.get("chapter", {})
        print(f"\n{stamp}: chapter {ch.get('number', '?')} '{ch.get('title', '')}', scene {sid} at {clock(local)} "
              f"of {clock(sc['duration'])}")
        beat = next((b for b in sc["beats"] if b["start"] <= local < b["end"]), None)
        if sc["kind"] == "title":
            print("   the chapter's title card")
        elif beat is None:
            print("   (a pause between sentences)")
        else:
            word = max((w for w in beat["words"] if w["start"] <= local), key=lambda w: w["start"], default=None)
            print(f"   beat {beat['id']}, {clock(beat['start'])}-{clock(beat['end'])}: \"{beat['text']}\"")
            if word:
                print(f"   word: \"{word['w']}\"")
        if sc["kind"] != "title":
            print(f"   edit: {(folder / 'scenes' / f'{sid}.js').relative_to(films.REPO).as_posix()}")


if __name__ == "__main__":
    main()
