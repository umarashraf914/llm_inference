"""Shared helpers for V03's depth-pass figures (plans/depth_pass/V03_review.md).

Every number a figure prints is computed in the build-up scripts beside this file, from the
constants below, and the claims the prose makes are asserted there. Sources for the constants
are given where they are defined; each was read in the paper or spec it cites.

  python3 figures/V03/src/<buildup>.py    writes figures/V03/items/<id>.html for its figures
"""
import math, re, sys, html as _html
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / ".claude/skills/srt-figure-atlas/scripts"))
from atlas import box, cont, cell, ghost, arr, ln, txt, hd, eq, prose, esc, stamp, brace  # noqa: E402,F401

SRT = ROOT / "transcripts/V03_Kernels_and_Memory.srt"
ITEMS = ROOT / "figures/V03/items"
ANIM = "V03_Kernels_and_Memory_animation.html"

# ---- hardware, as the papers state it ----------------------------------------------------------
H100_PEAK = 989e12        # BF16/FP16 dense tensor-core FLOP/s (FA3 §3.1; V02 Fig 69)
H100_BW = 3.35e12         # HBM bytes/s (FA3 Table 1)
H100_SMS = 132            # streaming multiprocessors
H100_SMEM = 228 * 1024    # shared memory per SM, bytes (FA3 Table 1: 228 KiB)
H100_L2 = 50 * 2**20      # L2 cache, bytes (FA3 Table 1: 50 MiB)
H100_HBM = 80e9           # HBM capacity, bytes (80 GB)
A100_PEAK = 312e12        # FP16/BF16 tensor-core FLOP/s (FA2 §3.1)
A100_SCALAR = 19.5e12     # non-matmul FP32 FLOP/s (FA2 §3.1)
A100_SMS = 108            # (FA2 §3.2)
B200_PEAK = 2.25e15       # BF16 dense (FA4 §2.2)
B200_SMS, B200_CLOCK = 148, 1.85e9   # (FA4 §2.2)
B200_MMA_PER_CLK = 8192   # BF16 FLOPs per clock per SM (FA4 §2.2); Hopper 4096
H100_MMA_PER_CLK = 4096
MUFU_PER_CLK = 16         # exponentials per clock per SM, Hopper and B200 (FA3 §3.1, FA4 §2.2)
SMEM_BYTES_PER_CLK = 128  # shared-memory read bytes per clock per SM (FA4 §2.2)
RIDGE = H100_PEAK / H100_BW

# ---- the Part numbers this atlas uses, so cross-references stay right if parts move -------------
PART = dict(puzzle=1, tiers=2, attention=3, naive=4, tiling=5, prefill=6, online=7, recompute=8,
            fa2=9, fa3=10, fp8=11, fa4=12, cache=13, heads=14, decode=15, launch=16, fixed=17)


def st(phrase):
    """Stamp from the transcript: where the phrase is first spoken."""
    return stamp(SRT, phrase)


def f(v, d=2):
    """A number as printed: fixed decimals, a real minus sign. Exact halves round away from zero, as
    JavaScript's toFixed does, so widgets and static figures print the same digits."""
    q = Decimal(abs(v)).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP)
    s = f"{q:,.{d}f}"
    return ("−" if v < 0 and float(q) != 0 else "") + s


def pct(v, d=0):
    return f(100 * v, d) + "%"


def figure(name, ts, title, h, body, caption, cls=None):
    """Write a figure item. `caption` is HTML: pass text through esc() yourself, so a link can sit in
    it. {{ref:…}} and {{fig:…}} are resolved at build time."""
    guard_split_word(name, "".join(body))
    c = f" class='{cls}'" if cls else ""
    out = (f"<figure{c}><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; {ts}</div><h3>{esc(title)}</h3>"
           f"<svg viewBox='0 0 680 {int(math.ceil(h))}' role='img'><title>{esc(title)}</title>"
           f"{''.join(body)}</svg><figcaption>{caption}</figcaption></figure>")
    (ITEMS / f"{name}.html").write_text(out, encoding="utf-8")
    print(f"{name:6s} {ts:>6}  {title}")


def guard_split_word(name, svg):
    """check_atlas.py's split-word check crashes when a label ends in a non-ASCII letter (Kᵀ, Oᵢ, µ) and
    the next label starts in lower case: str.isalpha() accepts the letter, its ASCII regex finds no word.
    Refuse to write such a figure, so the checker can run."""
    texts = [_html.unescape(re.sub(r"<[^>]+>", "", x)) for x in re.findall(r"<text[^>]*>(.*?)</text>", svg, re.S)]
    for a, b in zip(texts, texts[1:]):
        if a and b and a[-1].isalpha() and b[0].isalpha() and b[0].islower() and not re.search(r"[A-Za-z'-]+$", a):
            raise SystemExit(f"{name}: label {a!r} ends in {a[-1]!r} before {b!r}; reword it (checker bug)")


def anim_link(words):
    return f"<a class='xref' href='{ANIM}'>{esc(words)}</a>"


def section(name, label, title, blurb):
    (ITEMS / f"{name}.html").write_text(
        f"<div class='sec'><div class='l'>{label}</div><h2>{esc(title)}</h2><p>{esc(blurb)}</p></div>",
        encoding="utf-8")
    print(f"{name:6s}  {label}: {title}")


def patch(name, pairs, stamp_to=None):
    """Edit an existing item in place: each (old, new) must match exactly once, unless `new` is
    already there (so a build-up script can be rerun). Optionally restamp it."""
    p = ITEMS / f"{name}.html"
    t = p.read_text(encoding="utf-8")
    for old, new in pairs:
        if old in t:
            assert t.count(old) == 1, (name, old)
            t = t.replace(old, new)
        else:
            assert new in t, f"{name}: neither {old!r} nor its replacement is in the item"
    if stamp_to:
        t = re.sub(r"(<div class=['\"]ts['\"]>Fig [^ &<]+ &nbsp;&middot;&nbsp; )[0-9:]+(</div>)",
                   rf"\g<1>{stamp_to}\2", t, count=1)
    p.write_text(t, encoding="utf-8")
    print(f"{name:6s} patched" + (f", stamped {stamp_to}" if stamp_to else ""))


def lg(v, lo, hi, x0, x1):
    """Position of v on a logarithmic axis running from lo (at x0) to hi (at x1)."""
    return x0 + (math.log10(v) - math.log10(lo)) / (math.log10(hi) - math.log10(lo)) * (x1 - x0)


def tline(x1, y1, x2, y2, cls="tick", extra=""):
    return f'<line class="{cls}" x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}"{extra}/>'


def dashed(x1, y1, x2, y2, var="--h", cls="xok"):
    """A dashed reference line in one of the palette's colours (a token, not a hard-coded colour)."""
    return (f'<line class="{cls}" x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
            f'stroke="var({var})" stroke-width="1.2" stroke-dasharray="4 3"/>')


def poly(pts, var="--h", width=2, cls=""):
    p = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    c = f' class="{cls}"' if cls else ""
    return f'<polyline{c} points="{p}" fill="none" stroke="var({var})" stroke-width="{width}"/>'


def dot(x, y, r=4, var="--h", fill="--paper"):
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="var({fill})" stroke="var({var})" stroke-width="1.5"/>'


def text(x, y, s, cls="sub2", anchor="start", extra=""):
    """txt() with an optional attribute string (data-* hooks for widgets)."""
    return f'<text class="{cls}" x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}"{extra}>{esc(s)}</text>'
