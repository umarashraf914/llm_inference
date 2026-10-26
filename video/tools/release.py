#!/usr/bin/env python3
"""Release a version of a film: record in video/vNN/film.json the commit that holds it.

  python3 video/tools/release.py v01 "First release: 19 chapters, 92 minutes"

A version is everything the film renders from at that commit: its scenes and narration, and the shared engine,
library and fonts as they are then. make_4k.py renders a version from exactly those files, so later work on other
films or on the engine never changes it. This checks first that the film is complete and committed: its narration
is exported (video/vNN/narration, matching build/timing.json when that exists), every scene it times has a committed
scene file and narration, and nothing it renders from has uncommitted changes. Then it adds the version (number,
date, commit, notes) to film.json and stages it; commit and push that as usual.
"""
import argparse, datetime, json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import films  # noqa: E402


def problems(folder):
    rel = folder.relative_to(films.REPO).as_posix()
    found = []
    dirty = films.git("status", "--porcelain", "--untracked-files=no", "--", "video/engine", "video/lib",
                      "video/package-lock.json", rel).stdout.strip()
    if dirty:
        found.append(f"uncommitted changes the release would not include:\n{dirty}")
    narr = folder / "narration" / "timing.json"
    if not narr.exists():
        return found + [f"no exported narration: run  python3 video/tools/narration_pack.py export {rel}"]
    built = folder / "build" / "timing.json"
    if built.exists() and built.read_bytes() != narr.read_bytes():
        found.append(f"{rel}/narration is older than build/timing.json: export it again")
    timing = json.loads(narr.read_text())
    tracked = set(films.git("ls-files", "--", f"{rel}/scenes", f"{rel}/narration").stdout.split())
    for sid in timing["order"]:
        if timing["scenes"][sid]["kind"] == "title":
            continue
        for f, what in ((f"{rel}/scenes/{sid}.js", "scene file"), (f"{rel}/narration/{sid}.opus", "narration")):
            if f not in tracked:
                found.append(f"{sid} has no committed {what} ({f})")
    return found


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film", help="v01, v02, ...")
    ap.add_argument("notes", help="what this version is, or what changed since the last one")
    a = ap.parse_args()
    hit = films.find(a.film)
    if not hit:
        sys.exit(f"there is no film {a.film!r} (films: {', '.join(d.name for d, _ in films.films())})")
    folder, meta = hit
    found = problems(folder)
    if found:
        sys.exit("not released:\n- " + "\n- ".join(found))
    commit = films.git("rev-parse", "HEAD").stdout.strip()
    vs = meta.setdefault("versions", [])
    if vs and vs[-1]["commit"] == commit:
        sys.exit(f"version {vs[-1]['version']} already is this commit; commit the changes for a new version first")
    vs.append({"version": len(vs) + 1, "date": datetime.date.today().isoformat(), "commit": commit, "notes": a.notes})
    (folder / "film.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    films.git("add", (folder / "film.json").relative_to(films.REPO).as_posix())
    print(f"{folder.name.upper()} {meta['title']}: version {vs[-1]['version']} = commit {commit[:12]} "
          f"(film.json staged; commit and push it)")


if __name__ == "__main__":
    main()
