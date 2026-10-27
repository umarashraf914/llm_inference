"""A fingerprint for each scene: everything its frames depend on. A scene rendered once is reused, on that computer,
for as long as nothing it depends on changes; so a new version of a film renders only the scenes that changed.

A scene's frames come from:
  the engine core      engine/stage.html, engine.js, theme.css, the fonts, GSAP
  the library it uses  the lib/*.js files defining the lib functions it names, and the ones those name in turn
                       (library files only define functions; loading one changes nothing, so a scene depends on
                       exactly the files it names)
  the icons it draws   their entries in engine/icons.generated.js, not the whole bundle
  its chapter helpers  scenes/<chapter>_common.js
  itself               scenes/<scene>.js, and its entry in timing.json (beats, words, duration, chapter)
  how it is rendered   size, frame rate, drawing on the GPU or not, the encoder and its settings, the browser
Left out: where the scene sits in the film (globalStart). It moves only the faint ambient glow behind everything
(about 8 px a second at most), so a cached scene is reused while the film around it has moved it by at most
AMBIENT_SLACK seconds: a shift of 3 or 4 brightness levels in a soft haze, at the one cut after a lengthened scene.
"""
import hashlib, json, re
from pathlib import Path

import iconlib

FORMAT = 1                      # bump when capture or encoding changes what a segment looks like
AMBIENT_SLACK = 10.0            # seconds
DEF = re.compile(r"^(?:async\s+function|function|const|let|var|class)\s+([A-Za-z_$][\w$]*)|^window\.([A-Za-z_$][\w$]*)\s*=", re.M)
IDENT = re.compile(r"[A-Za-z_$][\w$]*")
ICON = iconlib.ID_RE         # an icon id in scene code, from any set in the library


def sha(data):
    return hashlib.sha256(data if isinstance(data, bytes) else data.encode()).hexdigest()


class SceneKeys:
    def __init__(self, film, settings):
        """film: a video/vNN folder (this checkout's, or a version's snapshot); settings: how scenes are rendered."""
        self.film, root = Path(film), Path(film).parent
        core = [root / "engine" / n for n in ("stage.html", "engine.js", "theme.css")]
        core += sorted((root / "engine" / "fonts").glob("*")) + sorted((root / "engine" / "vendor").glob("*.js"))
        self.engine_js = (root / "engine" / "engine.js").read_text(encoding="utf-8")
        self.base = {"format": FORMAT, "render": settings,
                     "core": sha("".join(f"{p.relative_to(root).as_posix()}:{sha(p.read_bytes())}\n" for p in core))}
        self.lib = {p: p.read_text(encoding="utf-8") for p in sorted((root / "lib").glob("*.js"))}
        self.defined = {}                       # library name -> the file that defines it
        for p, text in self.lib.items():
            for m in DEF.finditer(text):
                self.defined.setdefault(m.group(1) or m.group(2), p)
        bundle = (root / "engine" / "icons.generated.js").read_text(encoding="utf-8")
        self.icons = json.loads(bundle[bundle.index("{"):bundle.rindex("}") + 1])

    def libraries(self, text):
        """The library files text depends on, following library functions into the ones they use."""
        todo = {self.defined[n] for n in IDENT.findall(text) if n in self.defined}
        seen = set()
        while todo:
            p = todo.pop()
            seen.add(p)
            todo |= {self.defined[n] for n in IDENT.findall(self.lib[p]) if n in self.defined} - seen
        return sorted(seen)

    def key(self, entry):
        sid = entry["id"]
        read = lambda p: p.read_text(encoding="utf-8") if p.exists() and entry.get("kind") != "title" else ""
        common = read(self.film / "scenes" / f"{sid.split('_')[0]}_common.js")    # (a title card loads neither)
        scene = read(self.film / "scenes" / f"{sid}.js")
        libs = self.libraries(common + scene)
        uses = set(ICON.findall(common + scene + self.engine_js + "".join(self.lib[p] for p in libs)))
        return sha(json.dumps({**self.base,
                               "libs": {p.name: sha(self.lib[p]) for p in libs},
                               "icons": {i: self.icons.get(i) for i in sorted(uses)},
                               "common": sha(common), "scene": sha(scene),
                               "timing": {k: v for k, v in entry.items() if k != "globalStart"}}, sort_keys=True))


def scene_keys(film, timing, settings, ids=None):
    sk = SceneKeys(film, settings)
    return {s: sk.key(timing["scenes"][s]) for s in (ids or timing["order"])}
