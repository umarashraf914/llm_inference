"""Shared pieces for V01's build-up scripts: paths, the facts the figures rest on (with where each
one comes from), number formatting that matches JavaScript, and a writer for item files.

Every build-up script in this folder imports from here. Nothing in this file writes an item.
"""
import math
import re
import sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / ".claude/skills/srt-figure-atlas/scripts"))
from atlas import box, cont, cell, ghost, arr, ln, txt, hd, eq, prose, item, stamp, esc, brace  # noqa: E402,F401

SRT = ROOT / "transcripts/V01_The_Memory_Wall.srt"
OUT = ROOT / "figures/V01/items"


def st(phrase):
    """The stamp where the transcript says `phrase`."""
    return stamp(SRT, phrase)


# ---- the model this atlas follows: Llama 3 70B --------------------------------------------------
# config.json of Meta-Llama-3-70B (read from the NousResearch mirror of Meta's file, 2026-10-24):
# hidden_size 8192, intermediate_size 28672, num_hidden_layers 80, num_attention_heads 64,
# num_key_value_heads 8, vocab_size 128256, hidden_act silu, tie_word_embeddings false.
D, FF, L, NH, KVH, VOC = 8192, 28672, 80, 64, 8, 128256
HD = D // NH                                    # 128 numbers per head
KVW = KVH * HD                                  # 1,024: the width of K and of V
ATTN = D * D + D * KVW + D * KVW + D * D        # W_Q, W_K, W_V, W_O
FFN = 3 * D * FF                                # gate, up, down
LAYER = ATTN + FFN + 2 * D                      # plus two normalisation vectors
N_EXACT = L * LAYER + 2 * VOC * D + D           # untied embedding and output head, final norm
assert HD == 128 and KVW == 1024
assert round(ATTN / 1e6, 1) == 151.0 and round(FFN / 1e6, 1) == 704.6
assert round(N_EXACT / 1e9, 2) == 70.55

# The round figures the lecture uses: 70 billion weights at 2 bytes each.
N = 70e9
BYTES_PER_W = 2
W_BYTES = N * BYTES_PER_W                       # 140 GB
KV_PER_TOKEN = 2 * L * KVH * HD * 2             # 327,680 bytes
assert KV_PER_TOKEN == 327_680

# ---- the chip: NVIDIA H100 SXM ------------------------------------------------------------------
# NVIDIA H100 datasheet: FP16 tensor 1,979 TFLOPS and INT8 3,958 TOPS "shown with sparsity;
# specifications 1/2 lower without sparsity"; memory 80 GB at 3.35 TB/s.
# NVIDIA H100 whitepaper (GTC22), Table 3 and section "H100 SXM5": 132 SMs, 4 tensor cores per SM
# (528), 80 GB HBM3 in 5 stacks, 5120-bit memory interface, 50 MB L2, 256 KB registers per SM,
# shared memory configurable up to 228 KB per SM, 80 billion transistors on 814 mm^2.
PEAK = 989e12                                   # dense 16-bit operations per second, as quoted
BW = 3.35e12                                    # bytes per second
HBM_GB = 80
RIDGE = PEAK / BW
assert round(RIDGE) == 295
PEAK_INT8 = 3958e12 / 2                         # dense 8-bit, half the sparse figure
SMS, TC_PER_SM = 132, 4
BUS_BITS, STACKS = 5120, 5
L2_BYTES, REG_PER_SM, SHARED_PER_SM = 50e6, 256e3, 228e3

# Other chips, from NVIDIA's product pages (read 2026-10-24). Dense 16-bit is half the sparse
# figure shown there. H200: 141 GB at 4.8 TB/s, 1,979 sparse. DGX B200: 8 GPUs, 1,440 GB and
# 64 TB/s in total; HGX B200: 36 PFLOPS sparse 16-bit for 8 GPUs.
CHIPS = {
    "H100": dict(peak=989e12, bw=3.35e12, cap=80e9),
    "H200": dict(peak=989e12, bw=4.8e12, cap=141e9),
    "B200": dict(peak=36e15 / 2 / 8, bw=64e12 / 8, cap=1440e9 / 8),
}

# ---- formatting ---------------------------------------------------------------------------------
MINUS = "−"


def f(v, d=2):
    """A number as printed: fixed decimals, a real minus sign. Exact halves round away from zero, as
    JavaScript's toFixed does, so a widget and its static first frame print the same digits."""
    q = Decimal(abs(v)).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP)
    s = f"{q:.{d}f}"
    return (MINUS if v < 0 and float(q) != 0 else "") + s


def g(v, d=0):
    """Thousands separators, with `d` decimals, rounding halves away from zero."""
    q = Decimal(abs(v)).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP)
    s = f"{q:,.{d}f}"
    return (MINUS if v < 0 and float(q) != 0 else "") + s


def rnd(v, d=1):
    """Round like JavaScript's toFixed: exact halves away from zero. For drawing coordinates that a
    widget's script recomputes, so the static frame and the live one agree to the last digit."""
    return float(Decimal(v).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP))


def sig(v, n=3):
    """`n` significant figures, plain notation: 41.8, 0.142, 1,416."""
    if v == 0:
        return "0"
    d = max(0, n - 1 - int(math.floor(math.log10(abs(v)))))
    return g(v, d)


def emit(name, ts, title, h, body, caption, cls=None):
    """Write one figure as figures/V01/items/<name>.html."""
    (OUT / f"{name}.html").write_text(item(ts, title, h, body, caption, cls), encoding="utf-8")
    print(f"{name:6s} {ts:>6s}  {title}")


def section(name, part, title, blurb):
    (OUT / f"{name}.html").write_text(
        f"<div class='sec'><div class='l'>Part {part}</div><h2>{esc(title)}</h2><p>{esc(blurb)}</p></div>",
        encoding="utf-8")
    print(f"{name:6s}  Part {part}: {title}")


def widget(name, ts, title, controls, svg_h, svg_body, caption, js):
    """A figure with live controls, laid out like V06's p18: controls, one SVG, caption, script.
    `controls` is a list of rows of HTML; `js` is the script body, which finds its own figure."""
    ctl = "".join(f"<div class='ctl'>{row}</div>" for row in controls)
    html_ = (f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; {ts}</div><h3>{esc(title)}</h3>"
             f"<div class='wg'>{ctl}<svg viewBox='0 0 680 {svg_h}' role='img'><title>{esc(title)}</title>"
             f"{''.join(svg_body)}</svg></div><figcaption>{caption}</figcaption>"
             f"<script>(() => {{\n{js}\n}})();</script></figure>")
    (OUT / f"{name}.html").write_text(html_, encoding="utf-8")
    print(f"{name:6s} {ts:>6s}  {title}  (widget)")


# A JavaScript twin of f() and g(), pasted into every widget so the two print the same digits.
JS_FMT = r"""
  const MINUS = '−';
  const fx = (v, d = 2) => { const s = Math.abs(v).toFixed(d); return (v < 0 && +s !== 0 ? MINUS : '') + s; };
  const gx = (v, d = 0) => { const s = Math.abs(v).toFixed(d); const [a, b] = s.split('.');
    const t = a.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (v < 0 && +s !== 0 ? MINUS : '') + t + (b !== undefined ? '.' + b : ''); };
"""


def tag(name, attrs, text=""):
    """A raw SVG element with data- attributes, for the parts of a widget its script rewrites."""
    a = " ".join(f'{k}="{v}"' for k, v in attrs.items())
    return f"<{name} {a}>{esc(text)}</{name}>"
