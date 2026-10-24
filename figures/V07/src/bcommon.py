"""Shared helpers for V7 Parts 6–11 (builder B: items b36 … b72 and o012 … o026).

Lives in figures/V07/src, not in the shared scripts. It re-exports the drawing library, holds the
model and hardware constants every figure uses, and adds the few things the library lacks:
number formatting that matches JavaScript, a writer for widget figures, and small drawing helpers
(a bar with an outside label, a node cell sized to its text).

The constants are the series' own (V01 Fig 126, V07 review): H100 SXM at 989 TFLOP/s dense BF16
and 3.35 TB/s; Llama 3 8B with 32 layers, 8 KV heads, head dimension 128, 8.03 B parameters and a
128,256-token vocabulary (its config.json, read 2026-10-24); Llama 3 70B at 140 GB.
"""
import json, math, sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / ".claude/skills/srt-figure-atlas/scripts"))
from atlas import arr, box, brace, cell, esc, eq, ghost, hd, item, ln, prose, stamp, txt  # noqa: E402,F401

SRT = ROOT / "transcripts/V07_Serving_in_Production.srt"
OUT = ROOT / "figures/V07/items"

# ---- hardware and models -------------------------------------------------------------------------
PEAK = 989e12                 # H100 SXM, dense BF16, operations per second
BW = 3.35e12                  # H100 SXM HBM3, bytes per second
RIDGE = PEAK / BW             # 295.2 operations per byte
P8 = 8.03e9                   # Llama 3 8B parameters
W8 = 2 * P8                   # its weights in FP16, bytes
KV8 = 2 * 32 * 8 * 128 * 2    # bytes of keys and values per token: K and V, 32 layers, 8 heads, 128, 2 B
VOCAB = 128_256               # Llama 3 vocabulary
W70 = 140e9                   # Llama 3 70B weights in FP16, bytes
assert KV8 == 131_072 and round(RIDGE, 1) == 295.2


def f(v, d=2):
    """A number as printed: fixed decimals, a real minus sign. Exact halves round away from zero,
    as JavaScript's toFixed does, so widgets and static figures print the same digits."""
    q = Decimal(abs(v)).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP)
    return ("−" if v < 0 and q != 0 else "") + f"{q:.{d}f}"


def g(v, d=0):
    """Thousands separators, fixed decimals: 105000 -> '105,000'."""
    q = Decimal(abs(v)).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP)
    return ("−" if v < 0 and q != 0 else "") + f"{q:,.{d}f}"


def pc(v, d=1):
    """A share as a percentage: 0.745 -> '74.5%'."""
    return f(100 * v, d) + "%"


def tw(s, cls="sub"):
    """Rough text width in px, from design.md's per-character table. For layout, not for checking."""
    return len(s) * {"lbl": 7.0, "sub": 6.0, "sub2": 6.0, "cap": 6.5, "hd": 7.0}[cls]


def emit(name, ts, title, h, body, caption, cls=None, links=()):
    """Write a figure item. `links` become <!-- link: ... --> notes for the final pass: pointers to
    figures that another builder has not made yet."""
    html_ = item(ts, title, h, body, caption, cls)
    if links:
        html_ = html_.replace("</figure>", "".join(f"<!-- link: {l} -->" for l in links) + "</figure>")
    (OUT / f"{name}.html").write_text(html_, encoding="utf-8")
    print(name, ts, title)


def emit_widget(name, ts, title, controls, svg, h, caption, js, links=()):
    """A widget figure, following V06's p18: controls in .ctl rows, one SVG, caption, inline script.
    `controls` is a list of HTML strings, one per .ctl row; `svg` is the drawing's inner SVG."""
    rows = "".join(f"<div class='ctl'>{c}</div>" for c in controls)
    html_ = (f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; {ts}</div>"
             f"<h3>{esc(title)}</h3><div class='wg'>{rows}"
             f"<svg viewBox='0 0 680 {h}' role='img'><title>{esc(title)}</title>{svg}</svg></div>"
             f"<figcaption>{esc(caption)}</figcaption>{js}"
             + "".join(f"<!-- link: {l} -->" for l in links) + "</figure>")
    (OUT / f"{name}.html").write_text(html_, encoding="utf-8")
    print(name, ts, title, "(widget)")


def js_fill(template, **values):
    """Put Python values into a JavaScript template as JSON: __NAME__ becomes json.dumps(value)."""
    for k, v in values.items():
        template = template.replace(f"__{k}__", json.dumps(v))
    assert "__" not in template.replace("__proto__", ""), "unfilled placeholder in widget script"
    return template


# A JavaScript twin of f(): toFixed rounds exact binary halves away from zero, like ROUND_HALF_UP on
# the exact decimal value of the double, so the two agree digit for digit.
JS_FMT = ("const fx = (v, d = 2) => { const s = Math.abs(v).toFixed(d); "
          "return (v < 0 && +s !== 0 ? '\\u2212' : '') + s; };"
          "const gx = (v, d = 0) => { const s = Math.abs(v).toFixed(d), [a, b] = s.split('.'); "
          "const t = a.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ','); "
          "return (v < 0 && +s !== 0 ? '\\u2212' : '') + t + (b ? '.' + b : ''); };"
          "const pcx = (v, d = 1) => fx(100 * v, d) + '%';")


def node(x, y, s, cls="u", h=26, pad=9, minw=26):
    """A cell sized to its label (one token, or a run of tokens). Returns (svg, width)."""
    w = max(minw, round(tw(s) + 2 * pad))
    return cell(x, y, w, h, cls, label=s), w


def hbar(x, y, w, h, cls, label=None, note=None, gap=8):
    """A filled bar to scale. The label goes inside if it fits with 8px either side, else outside to
    the right with `note`. Returns svg."""
    o = []
    if label is not None and tw(label) + 16 <= w:
        o.append(cell(x, y, w, h, cls, label=label))
        if note:
            o.append(txt(x + w + gap, y + h / 2 + 4, note, "sub2"))
    else:
        o.append(cell(x, y, max(w, 1.5), h, cls))
        s = " ".join(t for t in (label, note) if t)
        if s:
            o.append(txt(x + max(w, 1.5) + gap, y + h / 2 + 4, s, "sub2"))
    return "".join(o)


def path(points, cls="conn", marker=False):
    """An open polyline through points, as connector lines (so the checker sees them)."""
    o = []
    for (x1, y1), (x2, y2) in zip(points, points[1:]):
        o.append(f'<line class="{cls}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>')
    if marker:
        o[-1] = o[-1].replace("/>", ' marker-end="url(#arw)"/>')
    return "".join(o)
