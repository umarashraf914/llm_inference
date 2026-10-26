"""Shared constants and helpers for V7's depth pass, Parts 1-5 (figures/V07/src/p*.py).

Every hardware and model number used in more than one figure lives here, derived from its sources
and asserted, so two figures cannot disagree.

Sources read for these values:
  H100 SXM: 989 TFLOP/s dense BF16, 1,979 FP8, 3.35 TB/s HBM, 80 GB: the series' own values
            (V1 Fig 126, V2 Fig 75).
  Llama 3 8B and 70B shapes: Llama 3 paper (arXiv 2407.21783), Table 3: 32 / 80 layers, model
            dimension 4,096 / 8,192, FFN 14,336 / 28,672, 32 / 64 attention heads, 8 KV heads,
            vocabulary 128,000. Llama 3 8B keeps separate input and output embeddings.
  OPT-66B:  OPT paper (arXiv 2205.01068), Table 1: 64 layers, 72 heads, d_model 9,216.
"""
import sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / ".claude/skills/srt-figure-atlas/scripts"))
from atlas import (box, cell, ghost, arr, ln, txt, hd, eq, prose, item, stamp, esc)  # noqa: E402,F401

SRT = ROOT / "transcripts/V07_Serving_in_Production.srt"
OUT = ROOT / "figures/V07/items"

# ---- the chip -------------------------------------------------------------------------------------
PEAK = 989e12            # FLOP/s, dense BF16
PEAK8 = 1979e12          # FLOP/s, dense FP8
BW = 3.35e12             # bytes/s of HBM
HBM = 80e9               # bytes on the card
RIDGE = PEAK / BW        # ops per byte where the two ceilings meet
assert round(RIDGE) == 295 and round(PEAK8 / BW / 2) == 295     # FP8: 1-byte weights, so 295 tokens again

# ---- Llama 3 8B, computed from its shape ----------------------------------------------------------
L8, D8, FF8, H8, KVH8, VOC = 32, 4096, 14336, 32, 8, 128000
HD = D8 // H8                                            # 128 numbers per head
_layer = (D8 * D8 + 2 * D8 * KVH8 * HD + D8 * D8) + 3 * D8 * FF8 + 2 * D8
P8 = L8 * _layer + 2 * VOC * D8 + D8                     # untied embeddings
W8 = 2 * P8                                              # bytes at 16 bits
KV8 = 2 * L8 * KVH8 * HD * 2                             # bytes of cache per token of context
ATT8 = 2 * 2 * H8 * HD * L8                              # attention ops per new token per cached token
GROUP = H8 // KVH8                                       # query heads sharing one KV head
LAYER_W8 = _layer - 2 * D8                               # matrix weights in one layer
assert round(P8 / 1e9, 2) == 8.03 and round(W8 / 1e9, 2) == 16.06
assert KV8 == 131072 == 128 * 1024 and ATT8 == 524288 and ATT8 / KV8 == 4 and GROUP == 4

# ---- the series' 70B example (V1 Fig 73: 70 billion weights x 2 bytes = 140 GB) --------------------
P70 = 70e9
W70 = 2 * P70
KV70 = 2 * 80 * 8 * HD * 2                               # Llama 3 70B: 80 layers, 8 KV heads
assert W70 == 140e9 and KV70 == 327680

# ---- OPT-66B -------------------------------------------------------------------------------------
OPT_L, OPT_D = 64, 9216
KV_OPT = 2 * OPT_L * OPT_D * 2                           # full multi-head attention: every head kept
assert KV_OPT == 2359296


def t_read(nbytes):
    return nbytes / BW


def t_math(ops, peak=PEAK):
    return ops / peak


# ---- number formatting ----------------------------------------------------------------------------
def f(v, d=2):
    """Fixed decimals with a real minus sign. Exact halves round away from zero, like JavaScript's
    toFixed, so a widget and the static figures print the same digits."""
    q = Decimal(abs(v)).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP)
    return ("−" if v < 0 and q != 0 else "") + f"{q:.{d}f}"


def fc(v, d=0):
    """As f(), with thousands separators: 1,531 or 2,787.5."""
    s = f(v, d)
    neg = s.startswith("−")
    s = s.lstrip("−")
    whole, _, frac = s.partition(".")
    whole = f"{int(whole):,}"
    return ("−" if neg else "") + whole + ("." + frac if frac else "")


def ms(sec, d=2):
    return f(sec * 1e3, d)


def gb(nbytes, d=2):
    return f(nbytes / 1e9, d)


# ---- drawing helpers that atlas.py lacks ----------------------------------------------------------
HALO = "paint-order:stroke;stroke:var(--paper);stroke-width:4px;stroke-linejoin:round"


def halo(x, y, s, cls="sub2", anchor="start"):
    """Text knocked out of a line beneath it. V7's shell has no .halo rule, so the stroke is inline."""
    return (f'<text class="{cls} halo" x="{x}" y="{y}" text-anchor="{anchor}" style="{HALO}">'
            f"{esc(s)}</text>")


def track(x, y, w, h, rx=3):
    """A dashed full-scale track for a bar to sit on."""
    return ghost(x, y, w, h, rx)


def dot(cx, cy, cls="h", r=5):
    return f'<g class="{cls}"><rect x="{cx - r}" y="{cy - r}" width="{2 * r}" height="{2 * r}" rx="{r}"/></g>'


def poly(points, cls="pl-m", extra=""):
    pts = " ".join(f"{x:.1f},{y:.1f}" for x, y in points)
    return f'<polyline class="{cls}" points="{pts}"{extra}/>'


def tick(x1, y1, x2, y2):
    return ln(x1, y1, x2, y2, "tick")


def emit(name, ts, title, h, body, caption, cls=None, note=None):
    """Write items/<name>.html. h is the SVG height. note leaves a <!-- link: … --> for the final pass."""
    html_ = item(ts, title, h, body, caption, cls)
    if note:
        html_ = html_[: -len("</figure>")] + f"<!-- link: {note} --></figure>"
    (OUT / f"{name}.html").write_text(html_, encoding="utf-8")
    print(f"{name:5s} {ts:>6}  {title}")


def widget(name, ts, title, controls, svg_h, svg_body, caption, js):
    """A widget item, laid out as figures/V06/src/router.py's p18 is."""
    html_ = (f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; {ts}</div><h3>{esc(title)}</h3>"
             f"<div class='wg'>{controls}"
             f"<svg viewBox='0 0 680 {svg_h}' role='img'><title>{esc(title)}</title>{''.join(svg_body)}</svg></div>"
             f"<figcaption>{esc(caption)}</figcaption>{js}</figure>")
    (OUT / f"{name}.html").write_text(html_, encoding="utf-8")
    print(f"{name:5s} {ts:>6}  {title}  [widget]")


def st(phrase):
    return stamp(SRT, phrase)


# JavaScript twins of f() and fc(), pasted into every widget
JS_FMT = r"""
  const fx = (v, d = 2) => { const s = Math.abs(v).toFixed(d); return (v < 0 && +s !== 0 ? '−' : '') + s; };
  const fcx = (v, d = 0) => { const s = fx(v, d), n = s.startsWith('−'), t = n ? s.slice(1) : s;
    const [w, fr] = t.split('.'); return (n ? '−' : '') + (+w).toLocaleString('en-US') + (fr ? '.' + fr : ''); };
"""


# ---- log-log axes, shared by the rooflines and the intensity plot -------------------------------
import math as _m


class LogAxes:
    """Logarithmic x and y. Px(v) and Py(v) map a value to the canvas; draw() gives axes, ticks, labels."""

    def __init__(self, X0, X1, Y0, Y1, xlo, xhi, ylo, yhi):
        self.X0, self.X1, self.Y0, self.Y1 = X0, X1, Y0, Y1        # Y0 is the bottom (larger y)
        self.xlo, self.xhi, self.ylo, self.yhi = xlo, xhi, ylo, yhi

    def px(self, v):
        return self.X0 + (_m.log10(v) - _m.log10(self.xlo)) / (_m.log10(self.xhi) - _m.log10(self.xlo)) * (self.X1 - self.X0)

    def py(self, v):
        return self.Y0 - (_m.log10(v) - _m.log10(self.ylo)) / (_m.log10(self.yhi) - _m.log10(self.ylo)) * (self.Y0 - self.Y1)

    def draw(self, xticks, yticks, xlabel, ylabel, fmt=lambda v: f"{v:,g}"):
        o = [ln(self.X0, self.Y0, self.X1, self.Y0, "axis"), ln(self.X0, self.Y1, self.X0, self.Y0, "axis")]
        for v in xticks:
            x = self.px(v)
            o.append(tick(x, self.Y0, x, self.Y0 + 5))
            o.append(txt(round(x, 1), self.Y0 + 19, fmt(v), "sub2", "middle"))
        for v in yticks:
            y = self.py(v)
            o.append(tick(self.X0 - 5, y, self.X0, y))
            o.append(txt(self.X0 - 9, round(y + 4, 1), fmt(v), "sub2", "end"))
        o.append(txt((self.X0 + self.X1) / 2, self.Y0 + 38, xlabel, "sub2", "middle"))
        o.append(txt(self.X0 - 9, self.Y1 - 14, ylabel, "sub2", "start"))
        return o


def in_order(item_id):
    """True when item_id is listed in order.txt, so a {{fig:v07-…}} pointer to it will resolve.
    Lets a figure point forward to one a later build-up adds, without breaking the build before."""
    p = ROOT / "figures/V07/order.txt"
    return item_id in [ln_.split("#", 1)[0].strip() for ln_ in p.read_text(encoding="utf-8").splitlines()]


def fwd(item_id, with_ref, without):
    """with_ref (containing a pointer to item_id) once item_id is in the order, else the plain text."""
    return with_ref if in_order(item_id) else without


def nb(s):
    """Bind an expression so body prose never wraps inside it: spaces become non-breaking."""
    return s.replace(" ", " ")
