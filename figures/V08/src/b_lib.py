"""Shared helpers for the V8 Parts 6-11 build-ups (b_cache.py ... b_workload.py).

Kept here rather than in the shared atlas.py, which builders do not edit. Every script imports the
drawing primitives from atlas.py and the few extras below.
"""
import math, re, sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / ".claude/skills/srt-figure-atlas/scripts"))
import atlas  # noqa: E402
from atlas import box, cell, ghost, txt, hd, ln, arr, prose, item, esc  # noqa: E402,F401

SRT = ROOT / "transcripts/V08_Speculative_Decoding_and_Long_Context.srt"
OUT = ROOT / "figures/V08/items"

# ---- the series' standing numbers (built in V01; recomputed here) -----------------------------
PARAMS = 70e9                 # a 70B model
WEIGHT_BYTES = PARAMS * 2     # 16-bit weights: 140 GB
H100_BW = 3.35e12             # bytes per second (V01 Fig 126)
H100_PEAK = 989e12            # operations per second (V01 Fig 126)
LAYERS, KV_HEADS, HEAD_DIM, BYTES = 80, 8, 128, 2           # Llama-class 70B (V01 Fig 140)
KV_PER_TOKEN = 2 * LAYERS * KV_HEADS * HEAD_DIM * BYTES      # one key and one value per layer
Q_HEADS = 64
assert KV_PER_TOKEN == 327_680 and WEIGHT_BYTES == 140e9
CTX = 131_072                 # "128k" = 2^17 tokens


def stamp(phrase):
    return atlas.stamp(SRT, phrase)


def f(v, d=2):
    """Fixed decimals with a real minus sign. Exact halves round away from zero, as JavaScript's
    toFixed does, so widgets and static figures print the same digits."""
    q = Decimal(abs(v)).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP)
    return ("−" if v < 0 else "") + f"{q:.{d}f}"


def n0(v):
    """An integer with thousands separators."""
    return f"{round(v):,}"


def pct(v, d=1):
    return f(100 * v, d) + "%"


def emit(name, ts, title, h, body, caption, cls=None, note=None):
    """Write one figure item. `note` is an HTML comment kept inside the figure for the final pass."""
    html = item(ts, title, h, body, caption, cls)
    if note:
        html = html.replace("</figure>", f"<!-- {note} --></figure>")
    (OUT / f"{name}.html").write_text(html, encoding="utf-8")
    print(f"{name:5s} {ts:>6}  {title}")
    return html


def sec(name, n, title, blurb):
    (OUT / f"{name}.html").write_text(
        f"<div class='sec'><div class='l'>Part {n}</div><h2>{esc(title)}</h2><p>{esc(blurb)}</p></div>",
        encoding="utf-8")
    print(f"{name:5s}         Part {n}: {title}")


def width(s, cls="cap"):
    """Rough rendered width of a label, from design.md's px-per-character table."""
    return len(s) * {"cap": 6.5, "sub": 6.0, "sub2": 6.0, "lbl": 7.0, "hd": 7.0}[cls]


def bar(x, y, w, h, cls, label=None, rx=3):
    """A to-scale bar. Its label goes inside only if it fits with 12px each side, else returns
    (svg, False) so the caller can place it outside."""
    if label is not None and width(label, "sub") + 24 <= w:
        return cell(x, y, w, h, cls, rx=rx, label=label), True
    return cell(x, y, max(w, 1), h, cls, rx=rx), False


def text(x, y, s, cls="sub2", anchor="start", extra=""):
    """Free text with optional attributes (data-*, for widgets)."""
    return f'<text class="{cls}" x="{x}" y="{y}" text-anchor="{anchor}"{extra}>{esc(s)}</text>'
