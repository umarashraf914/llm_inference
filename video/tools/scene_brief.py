#!/usr/bin/env python3
"""Everything an animator needs about one scene, compactly: its storyboard, each beat's narration
with start/end and word times, and what the viewer sees just before and just after.

  python3 tools/scene_brief.py v01 ch13_s04
"""
import json, sys
from pathlib import Path

VIDEO = Path(__file__).resolve().parents[1]


def main():
    film, sid = sys.argv[1], sys.argv[2]
    fdir = VIDEO / film
    ch = sid.split("_")[0]
    d = json.loads((fdir / "script" / f"{ch}.json").read_text())
    timing = json.loads((fdir / "build" / "timing.json").read_text())
    scenes = d["scenes"]
    idx = [s["id"] for s in scenes].index(sid)
    s, tm = scenes[idx], timing["scenes"].get(sid, {})
    print(f"# {sid} · {s.get('name', '')}   ({d['chapter']} '{d['title']}', scene {idx + 1} of {len(scenes)}, "
          f"figs {s.get('figs', [])}, duration {tm.get('duration', 0):.2f} s)\n")
    if idx > 0:
        p = scenes[idx - 1]
        print(f"## Just before: {p['id']} · {p.get('name', '')}\nLast beat: {p['beats'][-1]['say']}\n"
              f"Its last show: {p['beats'][-1]['show']}\n")
    else:
        print("## Just before: the chapter title card (number + title), after the previous chapter.\n")
    print(f"## Visual\n{s.get('visual', '')}\n")
    beats = {b["id"]: b for b in tm.get("beats", [])}
    for b in s["beats"]:
        t = beats.get(b["id"], {})
        words = " ".join(f"{w['w']}@{w['start']:.2f}" for w in t.get("words", []))
        print(f"## {b['id']}  {t.get('start', 0):.2f}–{t.get('end', 0):.2f} s\nSAY: {b['say']}\nSHOW: {b['show']}\nWORDS: {words}\n")
    if idx + 1 < len(scenes):
        n = scenes[idx + 1]
        print(f"## Just after: {n['id']} · {n.get('name', '')}\nVisual: {n.get('visual', '')[:600]}")
    else:
        print("## Just after: the next chapter's title card.")
    nums = [c for c in d.get("checks", []) if any(k in json.dumps(c) for k in (sid, f"s{idx + 1:02d}"))]
    if nums:
        print("\n## Checks that mention this scene")
        for c in nums:
            print(f"- {c['claim']}  ->  {c.get('result', '')}")


if __name__ == "__main__":
    main()
