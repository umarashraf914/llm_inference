#!/usr/bin/env python3
"""Bundle the film's fonts into engine/fonts/ as WOFF2, with the @font-face rules the stage loads.

Every machine must measure and draw text alike, so the faces travel with the engine (glyphs unchanged):

  Poppins                labels and titles (since October 2026): weights 400-900, upright and italic, the latin and
                         latin-ext subsets of @fontsource/poppins (Google Fonts, OFL) as published. Each face claims
                         its own weight and CSS takes the nearest (550 -> 600, 650 -> 700). Glyphs it lacks (arrows,
                         ≈ ≤ ≠, superscripts, ⅔) come from Inter: the engine's family lists are 'Poppins', 'Inter'
  Inter                  the first films' face, now Poppins' fallback: Debian fonts-inter 4.0, weights 400-900,
                         upright and italic, each claiming the weights Linux fontconfig gave it when the films
                         were first rendered (550 -> Medium, 650 -> Bold)
  JetBrains Mono         numbers and code: Debian fonts-jetbrains-mono 2.304, weights 400-800, upright and italic
  DejaVu Sans (Mono)     only the few symbols Inter and JetBrains Mono lack (⋮ ⁻ ∝ …), declared as part of each
                         family with a unicode-range, so nothing falls through to whatever the OS has

  python3 video/tools/build_fonts.py        # needs fonttools + brotli, the system fonts above, and npm
"""
import io, re, shutil, subprocess, sys, tarfile, tempfile
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

VIDEO = Path(__file__).resolve().parents[1]
OUT = VIDEO / "engine" / "fonts"
INTER = Path("/usr/share/fonts/opentype/inter")
JBM = Path("/usr/share/fonts/truetype/jetbrains-mono")
DEJAVU = Path("/usr/share/fonts/truetype/dejavu")
WEIGHTS = {400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold", 900: "Black"}
# Which face each requested weight gets. The films were audited with Linux fontconfig picking the NEAREST face
# (550 -> Medium, 650 -> Bold, 850 -> ExtraBold), not the CSS rule (550 -> SemiBold, 850 -> Black), so each face
# claims the weight range fontconfig gave it (measured in Chromium against the system fonts, 100-990 by 10).
RANGE = {400: (1, 449), 500: (450, 555), 600: (556, 645), 700: (646, 755), 800: (756, 855), 900: (856, 1000)}
RANGE_ITALIC = {**RANGE, 400: (1, 455), 500: (456, 555)}
FAMILIES = [("Inter", INTER, "Inter", ".otf", range(400, 1000, 100)),
            ("JetBrains Mono", JBM, "JetBrainsMono", ".ttf", range(400, 900, 100))]
POPPINS = ("Poppins", "@fontsource/poppins@5.3.0", range(400, 1000, 100))
# Poppins' superscripts and fractions are drawn differently from Inter's: leave them all to Inter, so 10¹⁵ is one design
NOT_POPPINS = {0xB2, 0xB3, 0xB9, 0xBC, 0xBD, 0xBE}


def source(d, stem, ext, w, italic):
    name = WEIGHTS[w]
    if italic:
        name = "Italic" if w == 400 else name + "Italic"
    return d / f"{stem}-{name}{ext}"


def woff2(src, dst, keep=None):
    f = TTFont(src)
    if keep is not None:
        opts = subset.Options()
        opts.layout_features, opts.name_IDs, opts.notdef_outline = ["*"], ["*"], True
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=keep)
        sub.subset(f)
    f.flavor = "woff2"
    buf = io.BytesIO()
    f.save(buf)
    dst.write_bytes(buf.getvalue())
    return set(f.getBestCmap())


def ranges(cps):
    cps, out = sorted(cps), []
    for c in cps:
        if out and c == out[-1][1] + 1:
            out[-1][1] = c
        else:
            out.append([c, c])
    return ", ".join(f"U+{a:X}" if a == b else f"U+{a:X}-{b:X}" for a, b in out)


def codepoints(spec):
    """'U+0000-00FF,U+0131' -> the set of code points"""
    cps = set()
    for part in spec.split(","):
        a, _, b = part.strip()[2:].partition("-")
        cps |= set(range(int(a, 16), int(b or a, 16) + 1))
    return cps


def fontsource(family, package, weights, css):
    """A fontsource package's latin and latin-ext WOFF2 files, unchanged, with an @font-face for each face and subset."""
    n = 0
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["npm", "pack", package, "--silent"], cwd=tmp, check=True, capture_output=True)
        with tarfile.open(next(Path(tmp).glob("*.tgz"))) as t:
            t.extractall(tmp, **({"filter": "data"} if hasattr(tarfile, "data_filter") else {}))
        root = Path(tmp) / "package"
        for w in weights:
            for style in ("normal", "italic"):
                sheet = (root / f"{w}{'-italic' if style == 'italic' else ''}.css").read_text()
                for file, rng in re.findall(r"/\* [\w-]+?-latin(?:-ext)?-\d+-\w+ \*/.*?src: url\(\./files/([^)]+\.woff2)\)"
                                            r".*?unicode-range: ([^;]+);", sheet, re.S):
                    shutil.copy(root / "files" / file, OUT / file)
                    css.append(f"@font-face {{ font-family: '{family}'; font-weight: {w}; font-style: {style}; font-display: block; "
                               f"src: url('{file}') format('woff2'); unicode-range: {ranges(codepoints(rng) - NOT_POPPINS)}; }}")
                    n += 1
        (OUT / f"LICENSE-{family}.txt").write_text((root / "LICENSE").read_text())
    return n


def used_chars():
    chars = set()
    for f in list(VIDEO.glob("*/scenes/*.js")) + list(VIDEO.glob("lib/*.js")) + list(VIDEO.glob("*/script/*.json")) + [VIDEO / "engine" / "engine.js"]:
        chars |= {ord(c) for c in f.read_text() if ord(c) > 126}
    return chars


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for f in OUT.glob("*.woff2"):
        f.unlink()
    used = used_chars()
    css = ["/* generated by tools/build_fonts.py; do not edit */"]
    gaps = set()
    faces = []
    for fam, d, stem, ext, ws in FAMILIES:
        for w in ws:
            for italic in (False, True):
                src = source(d, stem, ext, w, italic)
                dst = OUT / (src.stem + ".woff2")
                cmap = woff2(src, dst)
                missing = {c for c in used if c not in cmap}
                gaps |= missing
                faces.append((fam, w, italic, dst.name, missing))
    # one tiny DejaVu Sans subset per weight band for every symbol any family lacks
    # (the monospace family falls back to DejaVu Sans Mono, as fontconfig did; it has every symbol that family lacks)
    fb = {(m, b): "DejaVuSans" + ("Mono" if m else "") + ("-Bold" if b else "") for m in (False, True) for b in (False, True)}
    for stem in fb.values():
        woff2(DEJAVU / f"{stem}.ttf", OUT / f"{stem}-symbols.woff2", keep=sorted(gaps))
    for fam, w, italic, file, missing in faces:
        style = "italic" if italic else "normal"
        lo, hi = (RANGE_ITALIC if italic else RANGE)[w]
        if w == max(f[1] for f in faces if f[0] == fam):
            hi = 1000                                   # the heaviest face takes everything above it
        bold, w = w >= 600, f"{lo} {hi}"
        # the fallback is declared first so the family's own face (declared after it) is tried first
        if missing:
            css.append(f"@font-face {{ font-family: '{fam}'; font-weight: {w}; font-style: {style}; font-display: block; "
                       f"src: url('{fb[fam == 'JetBrains Mono', bold]}-symbols.woff2') format('woff2'); unicode-range: {ranges(missing)}; }}")
        css.append(f"@font-face {{ font-family: '{fam}'; font-weight: {w}; font-style: {style}; font-display: block; "
                   f"src: url('{file}') format('woff2'); }}")
    n = fontsource(*POPPINS, css)
    (OUT / "fonts.css").write_text("\n".join(css) + "\n")
    for lic, dst in [("/usr/share/doc/fonts-inter/copyright", "LICENSE-Inter.txt"),
                     ("/usr/share/doc/fonts-jetbrains-mono/copyright", "LICENSE-JetBrainsMono.txt"),
                     ("/usr/share/doc/fonts-dejavu-core/copyright", "LICENSE-DejaVu.txt")]:
        (OUT / dst).write_text(Path(lic).read_text())
    size = sum(f.stat().st_size for f in OUT.glob("*.woff2"))
    print(f"{POPPINS[0]}: {n} faces and subsets; {len(faces)} faces + symbol fallback -> {OUT.relative_to(VIDEO)} ({size / 1e6:.1f} MB); "
          f"fallback covers {''.join(map(chr, sorted(gaps)))}")


if __name__ == "__main__":
    sys.exit(main())
