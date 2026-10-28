#!/usr/bin/env python3
"""The icon library the films draw from: the sets it holds, how an icon id becomes SVG, search, and preview sheets.

An icon id is <prefix>:<name>. Prefixes are Iconify's (browse a set at https://icon-sets.iconify.design/<prefix>/),
except four kept from the first film:
  fluent:<name>          Fluent Emoji Flat (Iconify's fluent-emoji-flat)
  fluent-ui:<name>       Fluent UI System Icons (Iconify's fluent)
  ms:<name>              Material Symbols (Iconify's material-symbols)
  tabler-filled:<name>   Tabler's filled icons
and LobeHub's AI logos (https://lobehub.com/icons): lobe:<brand>, lobe:<brand>-color, lobe:<brand>-text, ...

The sets are npm packages pinned in video/package.json: `npm install` in video/ puts them in node_modules (about
370 MB, never in git). The computers that render need none of it: they draw only the icons a film uses, which
tools/build_icons.py bundles into engine/icons.generated.js. icons/README.md describes the library and its licences.
"""
import hashlib, html, json, re, tempfile
from pathlib import Path

VIDEO = Path(__file__).resolve().parents[1]
REPO = VIDEO.parent
NM = VIDEO / "node_modules"
LOBE = NM / "@lobehub" / "icons-static-svg" / "icons"

# prefix, where it comes from, family, tier (1 = look here first), what it is for
SETS = [
    ("lobe", "lobe", "brands", 1, "AI companies, models and tools: <brand>, <brand>-color, <brand>-text"),
    ("logos", "iconify:logos", "brands", 1, "technology brands in full colour: chips, clouds, languages, tools"),
    ("thesvg-color", "iconify:thesvg-color", "brands", 2, "more brand logos in full colour"),
    ("simple-icons", "iconify:simple-icons", "brands", 2, "brand marks in one colour, to tint"),
    ("thesvg", "iconify:thesvg", "brands", 2, "more brand marks in one colour, to tint"),
    ("devicon", "iconify:devicon", "brands", 2, "programming languages and developer tools, in colour"),
    ("skill-icons", "iconify:skill-icons", "brands", 3, "technology badges on rounded tiles"),
    ("gcp", "iconify:gcp", "brands", 3, "Google Cloud products"),
    ("k8s", "iconify:k8s", "brands", 3, "Kubernetes objects"),
    ("fluent-emoji", "iconify:fluent-emoji", "objects", 1, "real-world things and ideas, shaded like 3D: the first choice"),
    ("fluent", "iconify:fluent-emoji-flat", "objects", 2, "the same things, flat-shaded (the first film's colour icons)"),
    ("noto", "iconify:noto", "objects", 2, "Google's emoji: real-world things"),
    ("streamline-color", "iconify:streamline-color", "objects", 2, "objects and ideas, two-tone colour"),
    ("streamline-plump-color", "iconify:streamline-plump-color", "objects", 2, "objects and ideas, rounded, colour"),
    ("streamline-flex-color", "iconify:streamline-flex-color", "objects", 2, "objects and ideas, flexible line, colour"),
    ("streamline-ultimate-color", "iconify:streamline-ultimate-color", "objects", 3, "objects and ideas, colour"),
    ("streamline-freehand-color", "iconify:streamline-freehand-color", "objects", 3, "hand-drawn, colour"),
    ("streamline-sharp-color", "iconify:streamline-sharp-color", "objects", 3, "sharp corners, colour"),
    ("streamline-cyber-color", "iconify:streamline-cyber-color", "objects", 3, "technology, colour"),
    ("streamline-kameleon-color", "iconify:streamline-kameleon-color", "objects", 3, "round badges, colour"),
    ("streamline-stickies-color", "iconify:streamline-stickies-color", "objects", 3, "sticker style, colour"),
    ("icon-park", "iconify:icon-park", "objects", 3, "multi-colour line icons"),
    ("glyphs-poly", "iconify:glyphs-poly", "objects", 3, "multi-colour glyphs"),
    ("marketeq", "iconify:marketeq", "objects", 3, "business, colour"),
    ("flat-color-icons", "iconify:flat-color-icons", "objects", 3, "flat colour (Icons8)"),
    ("meteocons", "iconify:meteocons", "objects", 3, "weather"),
    ("circle-flags", "iconify:circle-flags", "objects", 2, "country and language flags, round"),
    ("fluent-color", "iconify:fluent-color", "ui", 1, "interface symbols in colour (Microsoft 365 style)"),
    ("vscode-icons", "iconify:vscode-icons", "code", 2, "file types and folders"),
    ("material-icon-theme", "iconify:material-icon-theme", "code", 3, "file types and folders"),
    ("catppuccin", "iconify:catppuccin", "code", 3, "file types and folders, pastel"),
    ("ph", "phosphor", "glyphs", 1, "one-colour symbols in six weights; -duotone is the films' default"),
    ("solar", "iconify:solar", "glyphs", 1, "one-colour symbols; -bold-duotone and -linear-duotone"),
    ("fluent-ui", "iconify:fluent", "glyphs", 2, "Microsoft's widest set: -regular and -filled"),
    ("ms", "iconify:material-symbols", "glyphs", 2, "Google's, in styles: -outline, -rounded, -sharp"),
    ("tabler", "tabler:outline", "glyphs", 2, "outline"),
    ("tabler-filled", "tabler:filled", "glyphs", 2, "filled"),
    ("lucide", "lucide", "glyphs", 2, "clean outline"),
    ("carbon", "iconify:carbon", "glyphs", 2, "IBM's: strong on computing and data"),
    ("mdi", "iconify:mdi", "glyphs", 2, "the widest range of objects"),
    ("hugeicons", "iconify:hugeicons", "glyphs", 2, "stroke, rounded"),
    ("icon-park-twotone", "iconify:icon-park-twotone", "glyphs", 3, "two-tone line icons"),
    ("duo-icons", "iconify:duo-icons", "glyphs", 3, "duotone symbols"),
    ("game-icons", "iconify:game-icons", "glyphs", 3, "detailed silhouettes"),
    ("ix", "iconify:ix", "glyphs", 3, "industrial equipment (Siemens)"),
    ("fluent-emoji-high-contrast", "iconify:fluent-emoji-high-contrast", "glyphs", 3, "emoji as one-colour silhouettes"),
]
BY_PREFIX = {s[0]: s for s in SETS}
# the first film's prefixes resolve exactly as they always have, so its bundle and scene fingerprints never move
LEGACY = {"ph", "lucide", "tabler", "tabler-filled", "fluent", "carbon", "ms"}
# an icon id as scene code writes it, in quotes; longest prefixes first
ID_RE = re.compile(r"""['"`]((?:%s):[a-z0-9-]+)['"`]""" % "|".join(
    re.escape(p) for p in sorted(BY_PREFIX, key=len, reverse=True)))
FAMILIES = {"brands": "brand logos", "objects": "things and ideas, in colour", "ui": "interface symbols, in colour",
            "code": "files and code", "glyphs": "one-colour symbols, tinted by the scene"}
# other packages' licences (Iconify sets carry theirs in info.json)
NPM_INFO = {
    "lobe": {"name": "LobeHub Icons", "author": {"name": "LobeHub", "url": "https://lobehub.com/icons"},
             "license": {"spdx": "MIT", "url": "https://github.com/lobehub/lobe-icons/blob/master/LICENSE"},
             "package": "@lobehub/icons-static-svg"},
    "phosphor": {"name": "Phosphor", "author": {"name": "Phosphor Icons", "url": "https://phosphoricons.com"},
                 "license": {"spdx": "MIT", "url": "https://github.com/phosphor-icons/core/blob/main/LICENSE"},
                 "package": "@phosphor-icons/core"},
    "lucide": {"name": "Lucide", "author": {"name": "Lucide Contributors", "url": "https://lucide.dev"},
               "license": {"spdx": "ISC", "url": "https://github.com/lucide-icons/lucide/blob/main/LICENSE"},
               "package": "lucide-static"},
    "tabler": {"name": "Tabler Icons", "author": {"name": "Paweł Kuna", "url": "https://tabler.io/icons"},
               "license": {"spdx": "MIT", "url": "https://github.com/tabler/tabler-icons/blob/main/LICENSE"},
               "package": "@tabler/icons"},
}


def source(prefix):
    kind, _, arg = BY_PREFIX[prefix][1].partition(":")
    return kind, arg


def set_info(prefix):
    """{name, author, license, package, version, total, colour} for a set."""
    kind, arg = source(prefix)
    lock = json.loads((VIDEO / "package-lock.json").read_text())["packages"]
    if kind == "iconify":
        info = json.loads((NM / "@iconify-json" / arg / "info.json").read_text(encoding="utf-8"))
        pkg = f"@iconify-json/{arg}"
        out = {"name": info["name"], "author": info.get("author", {}), "license": info.get("license", {}),
               "total": info.get("total"), "colour": bool(info.get("palette"))}
    else:
        out = dict(NPM_INFO[kind])
        pkg = out.pop("package")
        out["total"] = len(names(prefix))
        out["colour"] = kind == "lobe"
        if kind == "tabler":
            out["name"] += " (filled)" if arg == "filled" else " (outline)"
    out["package"], out["version"] = pkg, lock.get(f"node_modules/{pkg}", {}).get("version")
    return out


# ---------------------------------------------------------------- resolving an id to SVG
_data = {}


def iconify(setname):
    if setname not in _data:
        _data[setname] = json.loads((NM / "@iconify-json" / setname / "icons.json").read_text(encoding="utf-8"))
    return _data[setname]


def num(x):
    """A number as JavaScript prints it (16, not 16.0), so bodies and boxes read as Iconify writes them."""
    x = float(x)
    return int(x) if x.is_integer() else x


def unique_ids(body, icon_id):
    """Give the ids inside an icon (gradients, clip paths, masks) a prefix of their own, so two different icons on
    one page never take each other's gradients."""
    ids = set(re.findall(r'\bid="([^"]+)"', body))
    if not ids:
        return body
    tag = "i" + hashlib.sha1(icon_id.encode()).hexdigest()[:6] + "-"
    for i in sorted(ids, key=len, reverse=True):
        body = body.replace(f'id="{i}"', f'id="{tag}{i}"')
        body = re.sub("#" + re.escape(i) + r"""(?=["')\s;,])""", "#" + tag + i, body)
    return body


def iconify_icon(setname, name):
    """(viewBox, body) of an Iconify icon, aliases followed and their flips and turns applied as Iconify does."""
    d = iconify(setname)
    props, n, seen = {"rotate": 0, "hFlip": False, "vFlip": False}, name, set()
    while n not in d["icons"]:
        a = d.get("aliases", {}).get(n)
        if a is None or n in seen:
            raise KeyError(f"{setname}:{name}")
        seen.add(n)
        for k in ("left", "top", "width", "height"):
            if k in a and k not in props:
                props[k] = a[k]
        props["rotate"] += a.get("rotate", 0)
        props["hFlip"] ^= bool(a.get("hFlip"))
        props["vFlip"] ^= bool(a.get("vFlip"))
        n = a["parent"]
    ic = d["icons"][n]
    box = {k: props.get(k, ic.get(k, d.get(k, 0 if k in ("left", "top") else 16))) for k in ("left", "top", "width", "height")}
    rot = props["rotate"] + ic.get("rotate", 0)
    hflip, vflip = props["hFlip"] ^ bool(ic.get("hFlip")), props["vFlip"] ^ bool(ic.get("vFlip"))
    body, tr = ic["body"], []
    if hflip:
        if vflip:
            rot += 2
        else:
            tr += [f"translate({num(box['width'] + box['left'])} {num(-box['top'])})", "scale(-1 1)"]
            box["top"] = box["left"] = 0
    elif vflip:
        tr += [f"translate({num(-box['left'])} {num(box['height'] + box['top'])})", "scale(1 -1)"]
        box["top"] = box["left"] = 0
    rot %= 4
    if rot == 1:
        c = num(box["height"] / 2 + box["top"])
        tr.insert(0, f"rotate(90 {c} {c})")
    elif rot == 2:
        tr.insert(0, f"rotate(180 {num(box['width'] / 2 + box['left'])} {num(box['height'] / 2 + box['top'])})")
    elif rot == 3:
        c = num(box["width"] / 2 + box["left"])
        tr.insert(0, f"rotate(-90 {c} {c})")
    if rot % 2:
        box["left"], box["top"] = box["top"], box["left"]
        box["width"], box["height"] = box["height"], box["width"]
    if tr:
        body = f'<g transform="{" ".join(tr)}">{body}</g>'
    return [num(box[k]) for k in ("left", "top", "width", "height")], body


SVG_KEEP = ("fill", "fill-rule", "clip-rule", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin")


def lobe_icon(name):
    s = (LOBE / f"{name}.svg").read_text(encoding="utf-8")
    m = re.search(r"<svg([^>]*)>(.*)</svg>", s, re.S)
    attrs = dict(re.findall(r'([\w:-]+)="([^"]*)"', m.group(1)))
    body = re.sub(r"<title>.*?</title>", "", m.group(2), flags=re.S).strip()
    keep = [f'{k}="{attrs[k]}"' for k in SVG_KEEP if k in attrs]
    if keep:
        body = f"<g {' '.join(keep)}>{body}</g>"
    return [num(x) for x in attrs["viewBox"].split()], body


def legacy_svg_file(path):
    """The first film's reader for icons kept as SVG files (Phosphor, Lucide, Tabler): unchanged, so they bundle
    exactly as before."""
    s = path.read_text()
    root = re.search(r"<svg([^>]*)>", s).group(1)
    vb = [float(x) for x in re.search(r'viewBox="([^"]+)"', root).group(1).split()]
    body = re.sub(r"^.*?<svg[^>]*>|</svg>\s*$", "", s, flags=re.S).strip()
    attrs = " ".join(f'{k}="{v}"' for k, v in re.findall(r'([a-z-]+)="([^"]*)"', root)
                     if k in ("fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"))
    if attrs:
        body = f"<g {attrs}>{body}</g>"
    return vb, body


def resolve(icon_id):
    """{'vb': [x, y, w, h], 'body': svg markup, 'mono': True if the scene's colour tints it} for an icon id."""
    prefix, name = icon_id.split(":", 1)
    if prefix not in BY_PREFIX:
        raise ValueError(f"unknown icon prefix in {icon_id} (sets: python3 video/tools/build_icons.py --sets)")
    kind, arg = source(prefix)
    if prefix in LEGACY:
        if kind == "phosphor":
            m = re.search(r"-(duotone|fill|bold|light|thin)$", name)
            vb, body = legacy_svg_file(NM / "@phosphor-icons/core/assets" / (m.group(1) if m else "regular") / f"{name}.svg")
        elif kind == "lucide":
            vb, body = legacy_svg_file(NM / "lucide-static/icons" / f"{name}.svg")
        elif kind == "tabler":
            vb, body = legacy_svg_file(NM / "@tabler/icons/icons" / arg / f"{name}.svg")
        else:                                   # fluent, carbon, ms: Iconify JSON, read as the first film read it
            d = iconify(arg)
            ic = d["icons"].get(name)
            if ic is None and name in d.get("aliases", {}):
                ic = d["icons"][d["aliases"][name]["parent"]]
            if ic is None:
                raise KeyError(icon_id)
            w, h = ic.get("width", d.get("width", 16)), ic.get("height", d.get("height", 16))
            return {"vb": [0, 0, w, h], "body": ic["body"], "mono": prefix != "fluent"}
        return {"vb": vb, "body": body, "mono": True}
    if kind == "lobe":
        vb, body = lobe_icon(name)
        mono = not re.search(r"-color(-|$)", name)
    else:
        vb, body = iconify_icon(arg, name)
        mono = not set_info_colour(prefix)
    return {"vb": vb, "body": unique_ids(body, icon_id), "mono": mono}


_colour = {}


def set_info_colour(prefix):
    if prefix not in _colour:
        _colour[prefix] = set_info(prefix)["colour"]
    return _colour[prefix]


# ---------------------------------------------------------------- names and search
_names = {}


def names(prefix):
    """Every name in a set that its makers have not hidden (hidden ones still resolve, for old ids)."""
    if prefix in _names:
        return _names[prefix]
    kind, arg = source(prefix)
    if kind == "phosphor":
        root = NM / "@phosphor-icons/core/assets"
        out = sorted(p.stem for w in root.iterdir() for p in w.glob("*.svg"))
    elif kind == "lucide":
        out = sorted(p.stem for p in (NM / "lucide-static/icons").glob("*.svg"))
    elif kind == "tabler":
        out = sorted(p.stem for p in (NM / "@tabler/icons/icons" / arg).glob("*.svg"))
    elif kind == "lobe":
        out = sorted(p.stem for p in LOBE.glob("*.svg"))
    else:
        d = iconify(arg)
        out = sorted([n for n, ic in d["icons"].items() if not ic.get("hidden")] + list(d.get("aliases", {})))
    _names[prefix] = out
    return out


# words a search also tries, for the things these films keep needing
SYNONYMS = {
    "gpu": ["gpu", "graphics-card", "video-card", "graphic-card"], "ram": ["ram", "memory"],
    "memory": ["memory", "ram"], "ssd": ["ssd", "hard-drive", "hard-disk", "harddisk", "storage"],
    "money": ["money", "coin", "dollar", "banknote", "cash"], "cpu": ["cpu", "processor", "chip"],
    "chip": ["chip", "cpu", "processor", "microchip"], "server": ["server", "rack", "data-center", "datacenter"],
    "ai": ["ai", "artificial-intelligence", "robot", "sparkle"], "time": ["time", "clock", "timer", "stopwatch"],
    "speed": ["speed", "speedometer", "gauge", "rocket", "fast"], "user": ["user", "person", "people", "account"],
    "chat": ["chat", "message", "speech-balloon", "comment"], "document": ["document", "file", "page", "paper"],
    "network": ["network", "wifi", "globe", "internet", "link"], "cost": ["cost", "money", "price", "coin"],
}


def search(term, prefixes=None, family=None, limit=None):
    """Icon ids whose names hold every word of term, best first: whole words before parts of words, then the set's
    tier, then shorter names."""
    words = [w for w in re.split(r"[\s_]+", term.lower().strip()) if w]
    if not words:
        return []
    alts = [SYNONYMS.get(w, [w]) for w in words]
    hits = []
    for prefix, _, fam, tier, _ in SETS:
        if (prefixes and prefix not in prefixes) or (family and fam != family):
            continue
        try:
            pool = names(prefix)
        except FileNotFoundError:
            continue
        for n in pool:
            parts, score = n.split("-"), 0
            for options in alts:
                best = None
                for w in options:
                    wp = w.split("-")
                    if any(parts[i:i + len(wp)] == wp for i in range(len(parts))):
                        s = 0
                    elif any(p.startswith(wp[0]) for p in parts) and w in n:
                        s = 1
                    elif w in n:
                        s = 2
                    else:
                        continue
                    s += 0 if w == options[0] else 0.5
                    best = s if best is None else min(best, s)
                if best is None:
                    break
                score += best
            else:
                hits.append((score, tier, len(n), f"{prefix}:{n}"))
    hits.sort()
    out = [h[3] for h in hits]
    return out[:limit] if limit else out


# ---------------------------------------------------------------- standalone SVG and preview sheets
def svg_text(icon_id, size=None, colour=None):
    """A standalone SVG file for an icon (one-colour icons drawn in colour, else left to currentColor)."""
    d = resolve(icon_id)
    x, y, w, h = d["vb"]
    dims = f' width="{num(size * w / max(w, h))}" height="{num(size * h / max(w, h))}"' if size else ""
    style = f' style="color:{colour}"' if colour and d["mono"] else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            f'viewBox="{num(x)} {num(y)} {num(w)} {num(h)}"{dims}{style}>{d["body"]}</svg>\n')


SHEET_CSS = """
@import url('%(fonts)s');
html, body { margin: 0; background: #060a14; }
body { width: %(width)dpx; font-family: Poppins, system-ui, sans-serif; color: #eef2fb;
  background: radial-gradient(1200px 800px at 50%% 30%%, rgba(40, 62, 120, 0.30), transparent 70%%),
              linear-gradient(180deg, #0b1226, #060a14); padding: 28px 28px 36px; box-sizing: border-box; }
h1 { font-size: 30px; font-weight: 600; margin: 4px 6px 4px; letter-spacing: 0.2px; }
h2 { font-size: 16px; font-weight: 400; color: #a7b1cc; margin: 0 6px 22px; }
.grid { display: grid; grid-template-columns: repeat(%(cols)d, 1fr); gap: 14px; }
.c { background: rgba(255,255,255,0.045); border: 1px solid rgba(255,255,255,0.09); border-radius: 16px;
  display: flex; flex-direction: column; align-items: center; padding: 18px 8px 12px; min-width: 0; }
.c svg { width: %(icon)dpx; height: %(icon)dpx; color: #eef2fb; }
.c .n { margin-top: 12px; font-size: 15px; font-weight: 500; text-align: center; line-height: 1.25; }
.c .i { margin-top: 4px; font-size: 11.5px; color: #8390ad; text-align: center; word-break: break-all; line-height: 1.25; }
.c.t { justify-content: center; align-items: flex-start; padding: 12px 14px; background: rgba(110,168,255,0.08); }
.c.t .n { margin: 0; text-align: left; font-size: 15px; font-weight: 600; }
.c.t .i { text-align: left; word-break: normal; font-size: 12px; color: #a7b1cc; }
"""


def sheet_html(cells, title="", subtitle="", cols=8, icon=96, width=1800):
    """cells: [(icon id, caption or None)]. One-colour icons are drawn in the films' ink colour."""
    fonts = (VIDEO / "engine" / "fonts" / "fonts.css").as_uri()
    out = [f"<!doctype html><html><head><meta charset='utf-8'><style>"
           f"{SHEET_CSS % {'fonts': fonts, 'cols': cols, 'icon': icon, 'width': width}}</style></head><body>"]
    if title:
        out.append(f"<h1>{html.escape(title)}</h1>")
    if subtitle:
        out.append(f"<h2>{html.escape(subtitle)}</h2>")
    out.append("<div class='grid'>")
    for cell in cells:
        if cell[0] == "label":                  # ("label", title, detail): a text cell, e.g. a set's name
            out.append(f"<div class='c t'><div class='n'>{html.escape(cell[1])}</div>"
                       f"<div class='i'>{html.escape(cell[2])}</div></div>")
            continue
        icon_id, caption = cell
        try:
            d = resolve(icon_id)
            x, y, w, h = d["vb"]
            art = f"<svg viewBox='{num(x)} {num(y)} {num(w)} {num(h)}' preserveAspectRatio='xMidYMid meet'>{d['body']}</svg>"
        except (KeyError, FileNotFoundError, ValueError):
            art = f"<svg viewBox='0 0 10 10'><rect x='1' y='1' width='8' height='8' fill='none' stroke='#ff6b6b' stroke-dasharray='1 1' stroke-width='0.3'/></svg>"
        cap = f"<div class='n'>{html.escape(caption)}</div>" if caption else ""
        out.append(f"<div class='c'>{art}{cap}<div class='i'>{html.escape(icon_id)}</div></div>")
    out.append("</div></body></html>")
    return "".join(out)


def render_sheets(pages, quality=88):
    """pages: [(output .jpg or .png path, html)]. Drawn by headless Chromium at the page's own height."""
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        try:
            page = browser.new_page(viewport={"width": 1800, "height": 1000})
            with tempfile.TemporaryDirectory() as tmp:
                for out, doc in pages:
                    f = Path(tmp) / "sheet.html"
                    f.write_text(doc, encoding="utf-8")
                    page.goto(f.as_uri())
                    page.evaluate("document.fonts.ready")
                    out = Path(out)
                    out.parent.mkdir(parents=True, exist_ok=True)
                    kw = {"type": "jpeg", "quality": quality} if out.suffix.lower() in (".jpg", ".jpeg") else {"type": "png"}
                    page.screenshot(path=str(out), full_page=True, **kw)
        finally:
            browser.close()
