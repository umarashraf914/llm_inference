"""Shared helpers for the V09 depth pass (plans/depth_pass/V09_review.md).

Every V09 source file imports this. It adds three things the shared atlas.py lacks:

  width()  text width in px, from glyph advances measured in the checker's own headless Chromium
           (glyphs.json). Labels are sized against it, so a box is chosen to fit its words.
  para()   body prose wrapped by measured width. {{fig:…}} pointers are kept whole (atlas.py's
           prose() wraps on hyphens and can split "v01-o060" across two lines) and are measured
           at their resolved length, "V1 Fig 123".
  f()      a number as printed, rounding exact halves away from zero like JavaScript's toFixed,
           so widgets and static figures print the same digits (copied from V06's router.py).
"""
import json, re, sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / ".claude/skills/srt-figure-atlas/scripts"))
from atlas import box, cell, ghost, txt, hd, ln, arr, item, stamp, esc, eq, cont  # noqa: E402,F401

SRT = ROOT / "transcripts/V09_The_Whole_Stack.srt"
OUT = ROOT / "figures/V09/items"
G = json.loads((Path(__file__).with_name("glyphs.json")).read_text(encoding="utf-8"))
PTR = re.compile(r"\{\{(?:ref|fig):v(\d\d)-[a-z0-9_-]+\}\}")


def width(s, cls="sub2"):
    """Advance width of s in px for a text class (cap, sub, sub2, lbl, hd)."""
    s = PTR.sub(lambda m: f"V{int(m.group(1))} Fig 123", s)
    g = G[cls]
    return sum(g.get(ch, g["n"]) for ch in s)


def wrap(s, maxw, cls="cap"):
    """Greedy word wrap by measured width. Pointers are single words."""
    lines, cur = [], ""
    for w in s.split():
        t = w if not cur else cur + " " + w
        if cur and width(t, cls) > maxw:
            lines.append(cur)
            cur = w
        else:
            cur = t
    if cur:
        lines.append(cur)
    return lines


def para(y, paras, x=40, maxw=590, cls="cap", gap=40, lh=20):
    """Body prose: paragraphs wrapped to maxw px, lh px lines, gap px between paragraphs.
    Returns (svg, y of the last baseline)."""
    o = []
    for k, p in enumerate(paras):
        if k:
            y += gap
        for j, line in enumerate(wrap(p, maxw, cls)):
            if j:
                y += lh
            o.append(txt(x, y, line, cls))
    return "".join(o), y


def f(v, d=2, sep=True):
    """A number as printed: fixed decimals, a real minus sign, exact halves away from zero.
    Decimal(abs(v)) is the double's exact binary value, which is what toFixed rounds."""
    q = Decimal(abs(v)).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP)
    s = f"{q:,.{d}f}" if sep else f"{q:.{d}f}"
    return ("−" if v < 0 and q != 0 else "") + s


def n(v):
    """An integer with thousands separators."""
    return f"{int(round(v)):,}"


def emit(name, ts, title, h, body, caption, cls=None):
    """Write items/<name>.html. h is the SVG height."""
    (OUT / f"{name}.html").write_text(item(ts, title, h, body, caption, cls), encoding="utf-8")
    print(f"{name:6s} {ts:>5s}  {title}")


def emit_widget(name, ts, title, controls, svg_body, h, caption, js):
    """A widget figure in the style of V06's p18: controls, one SVG drawn in its initial state,
    the caption, then a script that finds its own figure."""
    ctl = "".join(f"<div class='ctl'>{c}</div>" for c in controls)
    page = (f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; {ts}</div>"
            f"<h3>{esc(title)}</h3><div class='wg'>{ctl}"
            f"<svg viewBox='0 0 680 {h}' role='img'><title>{esc(title)}</title>{''.join(svg_body)}</svg>"
            f"</div><figcaption>{esc(caption)}</figcaption>{js}</figure>")
    (OUT / f"{name}.html").write_text(page, encoding="utf-8")
    print(f"{name:6s} {ts:>5s}  {title}  [widget]")


def label_box(x, y, w, h, cls, s, tcls="sub", pad=12):
    """cell() with a label, after checking the label fits with pad px either side."""
    need = width(s, "sub") + 2 * pad
    assert need <= w, f"label {s!r} needs {need:.0f}px, box is {w}"
    return cell(x, y, w, h, cls, label=s)


def fit_w(s, pad=12, cls="sub"):
    """Smallest whole width that holds s with pad px either side."""
    import math
    return math.ceil(width(s, cls) + 2 * pad)


def section(name, part, title, blurb):
    """A part heading item."""
    (OUT / f"{name}.html").write_text(
        f"<div class='sec'><div class='l'>Part {part}</div><h2>{esc(title)}</h2><p>{esc(blurb)}</p></div>",
        encoding="utf-8")
    print(f"{name:6s}        Part {part}: {title}")
