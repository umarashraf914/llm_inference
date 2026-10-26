"""The films in this repository, their released versions, and the files of a version exactly as it was released.

A film is video/vNN/ with a film.json:

  {"title": "The Memory Wall",
   "source": {"lecture": 1, "length": "31:08", "youtube": "ENkuf_2zbkc", "atlas": ..., "transcript": ...},
   "versions": [{"version": 1, "date": "2026-10-26", "commit": "<sha>", "notes": "First release ..."}]}

A version is the repository as it was at its commit: the film's scenes and narration, and the shared engine, library
and fonts as they were then. Rendering a version extracts exactly those files (snapshot()), so later work on other
films, or on the shared code, never changes a released film. To change a film, release a new version
(tools/release.py); the earlier ones stay renderable. Standard library only: make_4k.py uses this before its
environment exists.
"""
import json, shutil, subprocess, tarfile
from pathlib import Path

VIDEO = Path(__file__).resolve().parents[1]
REPO = VIDEO.parent


def films():
    """[(folder, film.json)] for every video/vNN that has a film.json, in order."""
    return [(d, json.loads((d / "film.json").read_text(encoding="utf-8"))) for d in sorted(VIDEO.glob("v[0-9][0-9]"))
            if (d / "film.json").is_file()]


def find(name):
    """(folder, film.json) for 'v01', 'V01', '01' or '1', or None."""
    want = "v" + str(name).lower().lstrip("v").zfill(2)
    return next(((d, m) for d, m in films() if d.name == want), None)


def describe(folder, meta):
    src = meta.get("source", {})
    made = f", from lecture {src['lecture']} ({src['length']})" if "lecture" in src and "length" in src else ""
    return f"{folder.name.upper()}  {meta['title']}{made}"


def git(*args):
    return subprocess.run(["git", "-C", str(REPO), *args], capture_output=True, text=True)


def snapshot(commit):
    """video/ exactly as it was at commit, extracted once into video/.versions/<commit>/video and reused until
    discard() (git archive: committed files only, so no builds, environments or downloads come along)."""
    dest = VIDEO / ".versions" / commit[:12]
    if (dest / ".complete").exists():
        return dest / "video"
    if not shutil.which("git"):
        raise RuntimeError("rendering a released version needs git (git-scm.com); --working-copy renders the files "
                           "as they are instead")
    shutil.rmtree(dest, ignore_errors=True)
    dest.mkdir(parents=True)
    p = subprocess.Popen(["git", "-C", str(REPO), "archive", "--format=tar", commit, "video"], stdout=subprocess.PIPE)
    with tarfile.open(fileobj=p.stdout, mode="r|") as t:
        t.extractall(dest, **({"filter": "data"} if hasattr(tarfile, "data_filter") else {}))
    if p.wait():
        raise RuntimeError(f"git archive {commit} failed: is this a full clone with that commit (git pull)?")
    (dest / ".complete").write_text(commit)
    return dest / "video"


def discard(commit):
    shutil.rmtree(VIDEO / ".versions" / commit[:12], ignore_errors=True)
