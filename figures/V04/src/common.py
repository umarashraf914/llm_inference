"""Shared helpers for the V4 depth-pass scripts: paths, number printing, item writing, and a few SVG
pieces the drawing library does not have (number lines, bars, bit rows, widgets).

Every script in this folder imports from here, computes its numbers, asserts its claims and writes
items into figures/V04/items/. Run any of them from anywhere; paths are absolute.
"""
import math, sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / ".claude/skills/srt-figure-atlas/scripts"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from atlas import box, cell, ghost, txt, hd, ln, arr, eq, prose, item, stamp, esc  # noqa: E402,F401

SRT = ROOT / "transcripts/V04_Quantization.srt"
OUT = ROOT / "figures/V04/items"
MINUS = "−"


def st(phrase):
    """The stamp for a phrase the video speaks, from the transcript."""
    return stamp(SRT, phrase)


def f(v, d=2):
    """A number as printed: fixed decimals, a real minus sign. Exact halves round away from zero,
    as JavaScript's toFixed does, so widgets and static figures print the same digits."""
    v = float(v)
    q = Decimal(abs(v)).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP)
    s = f"{q:,.{d}f}" if abs(v) >= 1000 else f"{q:.{d}f}"
    return (MINUS if v < 0 and float(q) != 0 else "") + s


def fi(n):
    """An integer with thousands separators and a real minus sign."""
    n = int(n)
    return (MINUS if n < 0 else "") + f"{abs(n):,}"


def fs(v, sig=3):
    """Significant figures, plain decimal where sensible: 0.000061, 6.55e-4 written as 6.55 × 10⁻⁴."""
    v = float(v)
    if v == 0:
        return "0"
    e = math.floor(math.log10(abs(v)))
    if -4 <= e < 6:
        d = max(0, sig - 1 - e)
        return f(v, d)
    m = v / 10 ** e
    ms = f"{m:.{sig - 1}f}"
    if ms.startswith("10"):
        e += 1
        ms = f"{v / 10 ** e:.{sig - 1}f}"
    return f"{ms.replace('-', MINUS)} × 10{sup(e)}"


SUP = str.maketrans("0123456789-", "⁰¹²³⁴⁵⁶⁷⁸⁹⁻")


def sup(n):
    """An exponent written as superscript characters: sup(-14) is ⁻¹⁴."""
    return str(n).translate(SUP)


def pct(v, d=1):
    return f(100 * v, d) + "%"


def emit(name, ts, title, h, body, caption, cls=None):
    (OUT / f"{name}.html").write_text(item(ts, title, h, body, caption, cls), encoding="utf-8")
    print(f"{name:6s} {ts:>6s}  H={h:<4}  {title}")


def emit_widget(name, ts, title, controls, h, body, caption, script):
    """A widget figure, laid out as V6's p18: controls rows, one SVG, caption, inline script."""
    ctl = "".join(f"<div class='ctl'>{row}</div>" for row in controls)
    html = (f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; {ts}</div>"
            f"<h3>{esc(title)}</h3><div class='wg'>{ctl}"
            f"<svg viewBox='0 0 680 {h}' role='img'><title>{esc(title)}</title>{''.join(body)}</svg></div>"
            f"<figcaption>{esc(caption)}</figcaption>{script}</figure>")
    (OUT / f"{name}.html").write_text(html, encoding="utf-8")
    print(f"{name:6s} {ts:>6s}  H={h:<4}  {title}  [widget]")


def text(x, y, s, cls="sub2", anchor="start", extra=""):
    """Free text with optional extra attributes (data-*, for widgets)."""
    return f'<text class="{cls}" x="{x:g}" y="{y:g}" text-anchor="{anchor}"{extra}>{esc(s)}</text>'


def rect(x, y, w, h, cls, rx=3, extra=""):
    return f'<g class="{cls}"><rect x="{x:g}" y="{y:g}" width="{max(w, 0):.1f}" height="{h:g}" rx="{rx}"{extra}/></g>'


def tick(x, y1, y2, cls="tick"):
    return f'<line class="{cls}" x1="{x:.1f}" y1="{y1:g}" x2="{x:.1f}" y2="{y2:g}"/>'


def hline(x1, x2, y, cls="axis"):
    return f'<line class="{cls}" x1="{x1:.1f}" y1="{y:g}" x2="{x2:.1f}" y2="{y:g}"/>'


def dot(x, y, r=4, cls="h", fill="var(--paper)"):
    colour = {"h": "var(--h)", "m": "var(--m)", "s": "var(--s)", "u": "var(--u)"}[cls]
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{fill}" stroke="{colour}" stroke-width="1.5"/>'


def bits_row(x, y, bits, w=22, h=28, gap=3, cls_of=None, label=True):
    """One cell per bit. cls_of(i, b) picks the colour class of bit i; default: ones m, zeros u."""
    out = []
    for i, b in enumerate(bits):
        c = cls_of(i, b) if cls_of else ("m" if b == "1" else "u")
        out.append(cell(x + i * (w + gap), y, w, h, c, label=b if label else None))
    return "".join(out)


def poly(points, cls="pl-m"):
    pts = " ".join(f"{a:.1f},{b:.1f}" for a, b in points)
    return f'<polyline class="{cls}" points="{pts}"/>'
