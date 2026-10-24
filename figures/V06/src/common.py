"""Shared pieces for the V6 build-up scripts: paths, number formatting, item writing, model shapes.

The shapes are the published configurations, typed in with their source. Every count printed in a
figure is computed from them here or in the script that draws it, never typed in.
"""
import math, sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / ".claude/skills/srt-figure-atlas/scripts"))
from atlas import box, cell, cont, ghost, txt, hd, ln, arr, prose, item, stamp, eq, esc  # noqa: E402,F401

SRT = ROOT / "transcripts/V06_Mixture_of_Experts.srt"
OUT = ROOT / "figures/V06/items"


def at(phrase):
    """The stamp where the video says `phrase`."""
    return stamp(SRT, phrase)


def f(v, d=2):
    """A number as printed: fixed decimals, a real minus sign. Exact halves round away from zero,
    as JavaScript's toFixed does, so widgets and static figures print the same digits."""
    q = Decimal(abs(v)).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP)
    return ("−" if v < 0 and q != 0 else "") + f"{q:.{d}f}"


def n(v):
    """An integer with thousands separators and a real minus sign."""
    return f"{v:,}".replace("-", "−")


def nb(s):
    """Keep a short phrase on one line: prose() wraps only at ordinary spaces."""
    return s.replace(" ", "\u00a0")


def pct(v, d=1):
    return f(100 * v, d) + "%"


def emit(name, ts, title, h, body, caption, cls=None):
    (OUT / f"{name}.html").write_text(item(ts, title, h, body, caption, cls), encoding="utf-8")
    print(name, ts, title)


def emit_html(name, html):
    (OUT / f"{name}.html").write_text(html, encoding="utf-8")
    print(name, "(widget)")


def rect(x, y, w, h, cls, rx=3, extra=""):
    """A filled rectangle in a colour class, with no label (for bars measured to scale)."""
    return f'<g class="{cls}"><rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}"{extra}/></g>'


def dashed(x, y, w, h, rx=3):
    """A dashed outline with no label: a slot that is empty, or a bar that does not exist."""
    return (f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="none" '
            f'stroke="var(--rule)" stroke-width="1" stroke-dasharray="3 3"/>')


# ---- DeepSeek-V3: config.json at huggingface.co/deepseek-ai/DeepSeek-V3, and §4.2 of its report ----
DS = dict(d=7168, layers=61, dense_layers=3, ffn_dense=18432, ffn_expert=2048, routed=256, shared=1,
          k=8, heads=128, q_rank=1536, kv_rank=512, rope_dim=64, nope_dim=128, v_dim=128,
          vocab=129280, groups=8, top_groups=4)


def dsv3():
    """DeepSeek-V3's parameters, counted from its shapes. Every matrix is rows x columns."""
    c = DS
    d = c["d"]
    q = d * c["q_rank"] + c["q_rank"] * c["heads"] * (c["nope_dim"] + c["rope_dim"])    # query: down, then up
    kv = d * (c["kv_rank"] + c["rope_dim"]) + c["kv_rank"] * c["heads"] * (c["nope_dim"] + c["v_dim"])
    o = c["heads"] * c["v_dim"] * d
    attn_norms = c["q_rank"] + c["kv_rank"]                                               # inside MLA
    attn = q + kv + o + attn_norms
    expert = 3 * d * c["ffn_expert"]                    # gate, up and down matrices (SwiGLU)
    dense_ffn = 3 * d * c["ffn_dense"]
    router = c["routed"] * d
    moe_layers = c["layers"] - c["dense_layers"]
    layer_norms = 2 * d
    embed = c["vocab"] * d
    head = c["vocab"] * d
    parts = dict(
        attention=c["layers"] * attn,
        dense_ffn=c["dense_layers"] * dense_ffn,
        routed=moe_layers * c["routed"] * expert,
        shared=moe_layers * c["shared"] * expert,
        routers=moe_layers * router,
        embed=embed, head=head,
        norms=c["layers"] * layer_norms + d,
    )
    active = dict(parts, routed=moe_layers * c["k"] * expert)
    return dict(attn=attn, expert=expert, dense_ffn=dense_ffn, router=router, moe_layers=moe_layers,
                parts=parts, total=sum(parts.values()), active_parts=active,
                active=sum(active.values()), active_no_embed=sum(active.values()) - embed)


# ---- Mixtral 8x7B and Mistral 7B: config.json at huggingface.co/mistralai/ -------------------------
MX = dict(d=4096, layers=32, ffn=14336, experts=8, k=2, heads=32, kv_heads=8, head_dim=128, vocab=32000)


def mixtral(experts=None, k=None):
    c = MX
    d = c["d"]
    attn = 2 * d * c["heads"] * c["head_dim"] + 2 * d * c["kv_heads"] * c["head_dim"]   # Q, O and K, V
    expert = 3 * d * c["ffn"]
    e = c["experts"] if experts is None else experts
    kk = c["k"] if k is None else k
    router = e * d
    norms = 2 * d
    embed = head = c["vocab"] * d
    per_layer = attn + e * expert + router + norms
    per_layer_active = attn + kk * expert + router + norms
    return dict(attn=attn, expert=expert, router=router, embed=embed, head=head,
                total=c["layers"] * per_layer + embed + head + d,
                active=c["layers"] * per_layer_active + embed + head + d)


# ---- H100 SXM, nvidia.com/en-us/data-center/h100 (sparsity figures halved for dense) --------------
H100 = dict(bw=3.35e12, fp8=3958e12 / 2, bf16=1979e12 / 2, hbm=80e9)


if __name__ == "__main__":
    v = dsv3()
    print({k: f"{x / 1e9:.3f} B" for k, x in v["parts"].items()})
    print(f"total {v['total'] / 1e9:.3f} B, active {v['active'] / 1e9:.3f} B, "
          f"without the embedding {v['active_no_embed'] / 1e9:.3f} B")
    m = mixtral()
    print(f"Mixtral total {m['total'] / 1e9:.3f} B, active {m['active'] / 1e9:.3f} B")
