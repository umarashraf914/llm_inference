#!/usr/bin/env python3
"""Write the whole film's narration, in order, to one markdown file for reading and review.

  python3 tools/export_narration.py v01            # -> v01/build/film_narration.md
  python3 tools/export_narration.py v01 --show     # also include each beat's storyboard ("show")
"""
import argparse, json
from pathlib import Path

VIDEO = Path(__file__).resolve().parents[1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("film")
    ap.add_argument("--show", action="store_true")
    ap.add_argument("--out")
    a = ap.parse_args()
    film = VIDEO / a.film
    lines, words = [], 0
    for f in sorted((film / "script").glob("ch*.json")):
        d = json.loads(f.read_text())
        lines.append(f"# {d['chapter']} · {d['title']}  (figs {', '.join(map(str, d.get('figs', []))) or 'none'})\n")
        for s in d["scenes"]:
            lines.append(f"## {s['id']} · {s.get('name', '')}\n")
            for b in s["beats"]:
                words += len(b["say"].split())
                lines.append(f"**{s['id']}.{b['id']}** {b['say']}\n")
                if a.show:
                    lines.append(f"> show: {b['show']}\n")
        lines.append("")
    out = Path(a.out) if a.out else film / "build" / ("film_narration_show.md" if a.show else "film_narration.md")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines))
    print(f"{out}  ({words:,} words, about {words / 150:.0f} min)")


if __name__ == "__main__":
    main()
