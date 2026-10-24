"""Shared helpers for the speculative-decoding half of V8 (Parts 1–5, items a01–a34 and o001–o014).

Every spec_*.py build-up imports this. It adds to the shared drawing library (atlas.py) only what
these figures need: printing numbers the way the widgets do, writing an item, and a seeded random
number generator that gives the same stream in Python and in the browser.
"""
import math, sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / ".claude/skills/srt-figure-atlas/scripts"))
from atlas import box, cell, ghost, txt, hd, ln, arr, eq, item, stamp, esc  # noqa: E402,F401
from atlas import prose as _prose  # noqa: E402

SRT = ROOT / "transcripts/V08_Speculative_Decoding_and_Long_Context.srt"
OUT = ROOT / "figures/V08/items"

# ---- the machine every number in this half is measured against (built in V1 Figs 105, 126) -------
PARAMS = 70e9            # parameters in the 70B model followed through the series
BYTES = 2 * PARAMS       # 16-bit weights: 140 GB
PEAK = 989e12            # H100 dense 16-bit operations per second
BW = 3.35e12             # H100 HBM bytes per second
OPS_TOKEN = 2 * PARAMS   # a multiply and an add per weight, per position
T_READ = BYTES / BW                  # 41.8 ms to read the weights once
T_POS = OPS_TOKEN / PEAK             # 0.142 ms of arithmetic per position in a pass
RIDGE = PEAK / BW                    # 295 operations per byte
DRAFT_BYTES = BYTES / 100            # a drafter 100 times smaller: 1.4 GB a pass


def glue(s):
    """Keep a short formula on one line: no line break either side of ÷, × or a spaced minus."""
    for op in ("÷", "×", "−"):
        s = s.replace(f" {op} ", f"\u00a0{op}\u00a0")
    return s


def prose(y, paras, **kw):
    """atlas.prose, with formulas glued so a wrap never strands an operator."""
    return _prose(y, [glue(t) for t in paras], **kw)


def f(v, d=2):
    """A number as printed: fixed decimals, a real minus sign. Exact halves round away from zero,
    as JavaScript's toFixed does, so a widget and the static figures print the same digits."""
    q = Decimal(abs(v)).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP)
    s = f"{q:.{d}f}"
    return ("−" if v < 0 and float(q) != 0 else "") + s


def fc(v):
    """An integer with thousands separators: 10,000."""
    return f"{int(round(v)):,}"


def emit(name, ts, title, h, body, caption, cls=None):
    (OUT / f"{name}.html").write_text(item(ts, title, h, body, caption, cls), encoding="utf-8")
    print(name, ts, title)


def at(phrase):
    """The stamp of the first cue that speaks `phrase`."""
    return stamp(SRT, phrase)


def bar(x, y, w, h, cls, label=None, rx=3):
    """A filled bar that stays visible when its value is tiny."""
    return cell(x, y, max(w, 1.5), h, cls, rx=rx if w > 2 * rx else 0.5, label=label)


def tw(s, cls="sub"):
    """Rough width of a label in px, from design.md's per-character figures."""
    per = {"lbl": 7.0, "hd": 7.0, "sub": 6.0, "sub2": 6.0, "cap": 6.5}[cls]
    return len(s) * per


def widget(name, ts, title, controls, svg_h, svg_body, caption, js):
    """A widget figure, following V6's p18: controls, one SVG drawn in Python for the first view,
    then a script that finds its own figure, so several widgets can share a page."""
    rows = "".join(f"<div class='ctl'>{c}</div>" for c in controls)
    html_ = (f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; {ts}</div><h3>{esc(title)}</h3>"
             f"<div class='wg'>{rows}"
             f"<svg viewBox='0 0 680 {svg_h}' role='img'><title>{esc(title)}</title>{''.join(svg_body)}</svg></div>"
             f"<figcaption>{esc(caption)}</figcaption>{js}</figure>")
    (OUT / f"{name}.html").write_text(html_, encoding="utf-8")
    print(name, ts, title)


# ---- a random stream that JavaScript can reproduce exactly (mulberry32) ----------------------------
def mulberry32(seed):
    a = seed & 0xFFFFFFFF

    def imul(x, y):
        return ((x & 0xFFFFFFFF) * (y & 0xFFFFFFFF)) & 0xFFFFFFFF

    def rnd():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = imul(a ^ (a >> 15), 1 | a)
        t = ((t + imul(t ^ (t >> 7), 61 | t)) & 0xFFFFFFFF) ^ t
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296
    return rnd


MULBERRY_JS = """const mulberry32 = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296; };"""

FMT_JS = """const fmt = (v, d = 2) => (v < 0 && +Math.abs(v).toFixed(d) !== 0 ? '−' : '') + Math.abs(v).toFixed(d);
  const fmtc = v => Math.round(v).toLocaleString('en-US');"""


def check_numbers():
    assert round(T_READ * 1e3, 1) == 41.8 and round(T_POS * 1e3, 3) == 0.142 and round(RIDGE) == 295
    assert f(0.125) == "0.13" and f(-0.004) == "0.00" and f(2.5, 0) == "3"
    r = mulberry32(1)
    assert 0 <= r() < 1


check_numbers()
