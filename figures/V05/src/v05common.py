"""Shared helpers and constants for the V05 depth-pass sources.

Every number a V05 figure prints is computed from the constants here or in the build-up file that
draws it. Constants that come from a specification or a paper say where they were read.

  python3 figures/V05/src/<part>.py      writes figures/V05/items/<id>.html for that build-up
"""
import math, sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / ".claude/skills/srt-figure-atlas/scripts"))
from atlas import box, cell, ghost, txt, hd, ln, arr, prose, item, stamp, esc, eq, cont  # noqa: E402,F401

SRT = ROOT / "transcripts/V05_Parallelism.srt"
OUT = ROOT / "figures/V05/items"

# ---- the model the worked numbers use: Llama 3 70B, as in V1 Figs 101 and 140 ---------------------
# config.json of the Meta-Llama-3-70B weights: hidden 8192, intermediate 28672, 80 layers,
# 64 attention heads, 8 key-value heads, hidden_act silu; layers hold gate_proj, up_proj, down_proj.
LAYERS, HIDDEN, FFN, QH, KVH, HEAD = 80, 8192, 28672, 64, 8, 128
BYTES = 2                                   # 16-bit weights, activations and cache
PARAMS = 70e9                               # "a 70 billion parameter model": 140 GB, as V1 uses
WEIGHT_BYTES = PARAMS * BYTES
assert QH * HEAD == HIDDEN
KV_PER_TOKEN = 2 * LAYERS * KVH * HEAD * BYTES          # V1 Fig 140
assert KV_PER_TOKEN == 327_680
VEC = HIDDEN * BYTES                                    # one token's residual-stream vector
assert VEC == 16_384

# ---- hardware -------------------------------------------------------------------------------------
# H100 SXM product page: BF16 tensor core 1,979 TFLOPS with sparsity (989 dense), 3.35 TB/s HBM.
H100_FLOPS, H100_HBM, H100_MEM = 989e12, 3.35e12, 80e9
B200_MEM = 192e9                            # the video's figure for one B200
DGX_B200_MEM = 1440e9                       # DGX B200 spec page: "1,440 GB total"
# NVIDIA Hopper in-depth: 18 NVLink links, 25 GB/s each direction, "900 GB/sec total bandwidth".
NVL_H100_EACH_WAY = 18 * 25e9
assert 2 * NVL_H100_EACH_WAY == 900e9
# Blackwell launch release: "1.8TB/s bidirectional throughput per GPU".
NVL_B200_EACH_WAY = 1.8e12 / 2
# A 400 Gb/s InfiniBand NDR or ConnectX-7 port, quoted per direction (links are duplex).
NET_EACH_WAY = 400e9 / 8
assert NET_EACH_WAY == 50e9

# ---- the frontier model of the opening ------------------------------------------------------------
# DeepSeek-V4-Pro model card: 1.6T parameters, 49B activated, one-million-token context;
# config.json: hidden 7168, 384 routed experts, 6 per token, 1 shared; the FP8 base checkpoint is 1.606 TB.
DS_PARAMS, DS_ACTIVE, DS_EXPERTS, DS_TOPK = 1.6e12, 49e9, 384, 6
DS_FP4_RELEASE_BYTES = 864_721_029_744      # DeepSeek-V4-Pro safetensors, experts in FP4


import re as _re
import textwrap as _tw

_UNIT = _re.compile(r"(\d) (GB/s|TB/s|Gb/s|GB|TB|MB|KB|ms|µs|ns|bytes|tokens|GPUs|layers|times|S)\b")
_OP = _re.compile(r"(?<=[\d)]) ([+×÷=−]) (?=[\d(−])")


def prose(y, paras, x=40, width=88, cls="cap"):
    """atlas.prose with two changes: a line never breaks inside a hyphenated word, and a number
    never wraps away from its unit or from the sum it is part of."""
    o = []
    for k, p in enumerate(paras):
        p = _OP.sub("\u00a0\\1\u00a0", _UNIT.sub("\\1\u00a0\\2", p))
        refs = _re.findall(r"\{\{(?:fig|ref):[^}]+\}\}", p)
        for i, r in enumerate(refs):              # wrap as if each pointer were already "V5 Fig 99"
            p = p.replace(r, f"\u0001{i:07d}\u0001", 1)
        if k:
            y += 40
        for j, line in enumerate(_tw.wrap(p, width, break_on_hyphens=False)):
            for i, r in enumerate(refs):
                line = line.replace(f"\u0001{i:07d}\u0001", r)
            if j:
                y += 20
            o.append(txt(x, y, line, cls))
    return "".join(o), y


def fwd(i, words, kind="fig"):
    """A pointer to V5 item i once it is in order.txt; until then, `words` (the atlas must build
    after every step, so forward pointers wait for their target). Rerun the script to fill them in."""
    order = (ROOT / "figures/V05/order.txt").read_text(encoding="utf-8").split()
    return f"{{{{{kind}:v05-{i}}}}}" if i in order else words


def f(v, d=2):
    """A number as printed: fixed decimals and a real minus sign. Exact halves round away from
    zero, as JavaScript's toFixed does, so widgets and static figures print the same digits."""
    q = Decimal(abs(v)).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP)
    return ("−" if v < 0 and q != 0 else "") + f"{q:,.{d}f}"


def n(v):
    """An integer with thousands separators and a real minus sign."""
    return ("−" if v < 0 else "") + f"{abs(int(round(v))):,}"


def emit(name, ts, title, h, body, caption, cls=None):
    (OUT / f"{name}.html").write_text(item(ts, title, h, body, caption, cls), encoding="utf-8")
    print(f"{name:5s} {ts:>6s}  {title}")


def emit_raw(name, html_):
    (OUT / f"{name}.html").write_text(html_, encoding="utf-8")
    print(f"{name:5s}         (widget) {html_[html_.index('<h3>') + 4:html_.index('</h3>')]}")


def mark(x1, y1, x2, y2, ok=True):
    """A dashed line in the communication colour: a cut, or a reference that spans bars."""
    return f'<line class="mark{" xok" if ok else ""}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>'


def poly(pts, cls="pl-m"):
    return f'<polyline class="{cls}" points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in pts)}"/>'


def gelu(x):
    return x * 0.5 * (1 + math.erf(x / math.sqrt(2)))


def log_px(v, v0, v1, p0, p1):
    """Position of v on a logarithmic axis that runs from v0 at p0 to v1 at p1."""
    return p0 + (math.log10(v) - math.log10(v0)) / (math.log10(v1) - math.log10(v0)) * (p1 - p0)


def widget(name, ts, title, controls, svg_h, svg_body, caption, js):
    """An inline widget figure, after p18() in figures/V06/src/router.py."""
    ctl = "".join(f"<div class='ctl'>{c}</div>" for c in controls)
    return (f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; {ts}</div>"
            f"<h3>{esc(title)}</h3><div class='wg'>{ctl}"
            f"<svg viewBox='0 0 680 {svg_h}' role='img'><title>{esc(title)}</title>{''.join(svg_body)}</svg>"
            f"</div><figcaption>{esc(caption)}</figcaption>{js}</figure>")
