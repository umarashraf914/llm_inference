#!/usr/bin/env python3
"""Build video/lib/README.md, the catalogue of shared film components, from the summaries the
library builders returned (a JSON list of {component, functions[{name, signature, purpose, helpers}],
usedIn, notes}).

  python3 tools/lib_readme.py summaries.json
"""
import json, sys
from pathlib import Path

VIDEO = Path(__file__).resolve().parents[1]
ORDER = ["tokens", "hardware", "time", "memory", "model", "charts"]

HEAD = """# Shared film components

Every file listed in `manifest.json` is loaded before each scene (after `engine.js`, before the
chapter's `<chapter>_common.js`), so these functions are always available as globals. Use them for
any element they cover: the same thing must look the same in every chapter.

Conventions shared by all of them:

- `libX(S, o = {}, parent)` builds into `parent` (default `S.main`) and returns the root `<g>` with
  named handles and geometry.
- Helpers **return** tweens or timelines; place them with `S.add(tween, at)`. They never add to the
  timeline themselves.
- Helpers keep a plan (like `fx.xform`): the first time a property is driven, its build-time value
  becomes the start. Call each element's helpers **in time order**.
- Everything is deterministic under seeking (no `Math.random`, no `Date`; seeded variety via `S.rand`).
- Colour follows the film's meaning: amber compute, coral bytes, teal helps, blue structure,
  violet negatives/secondary.
- The full doc comment (every option and default, usage example) sits above each function in its file.
  Demo scenes showing every component in its main states: `video/libdemo/scenes/demo_<family>.js`
  (render with `python3 tools/render.py libdemo stills demo_<family>`).

Do not edit these files from a scene task. If a component lacks an option you need, build the
variant inside your scene file and say so in your notes.
"""


def main():
    data = json.loads(Path(sys.argv[1]).read_text())
    by = {d["component"]: d for d in data if d}
    out = [HEAD]
    out.append("## Index\n")
    for fam in ORDER:
        d = by.get(fam)
        if not d:
            continue
        names = ", ".join(f"`{f['name']}`" for f in d["functions"])
        out.append(f"- **{fam}** (`lib/{fam}.js`): {names}")
    out.append("")
    for fam in ORDER:
        d = by.get(fam)
        if not d:
            continue
        out.append(f"## {fam} — `lib/{fam}.js`\n")
        for f in d["functions"]:
            out.append(f"### `{f['name']}`\n")
            out.append(f"```\n{f['signature']}\n```\n")
            out.append(f"{f['purpose']}\n")
            if f.get("helpers") and f["helpers"].strip().lower() not in ("none", "none (pure function)"):
                out.append(f"**Helpers:** {f['helpers']}\n")
        if d.get("notes"):
            out.append(f"#### Builder's notes ({fam})\n")
            out.append(d["notes"].strip() + "\n")
        if d.get("usedIn"):
            out.append(f"*Used in:* {', '.join(d['usedIn'])}\n")
    (VIDEO / "lib" / "README.md").write_text("\n".join(out))
    print(VIDEO / "lib" / "README.md", sum(len(by[f]["functions"]) for f in by), "functions")


if __name__ == "__main__":
    main()
