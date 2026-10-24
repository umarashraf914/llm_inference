"""Edits to the V6 figures that existed before the depth pass: restamps, rewrapped body prose, titles and
captions, the fixes listed in §2 and §5 of plans/depth_pass/V06_review.md.

Every edit either replaces text that must be present exactly once, or regenerates the body prose from a
given baseline down, so running the script again leaves the items as they are. Figures rebuilt whole
(o003-o006, o009, o010, o018, o021) are drawn by the build-up scripts instead.

  python3 figures/V06/src/edits.py
"""
import html, re
from common import OUT, at, prose

STAMP = re.compile(r"(<div class='ts'>Fig \S+ &nbsp;&middot;&nbsp; )([0-9:]+)(</div>)")


def load(i):
    return (OUT / f"{i}.html").read_text(encoding="utf-8")


def save(i, t):
    (OUT / f"{i}.html").write_text(t, encoding="utf-8")


def restamp(i, phrase):
    t, k = STAMP.subn(lambda m: m.group(1) + at(phrase) + m.group(3), load(i), count=1)
    assert k == 1, i
    save(i, t)


def replace(i, old, new):
    t = load(i)
    if old not in t and new in t:
        return                                            # already applied
    assert t.count(old) == 1, (i, old, t.count(old))
    save(i, t.replace(old, new))


def caption(i, text):
    t, k = re.subn(r"<figcaption>.*?</figcaption>", lambda m: f"<figcaption>{html.escape(text, quote=False)}</figcaption>",
                   load(i), count=1, flags=re.S)
    assert k == 1, i
    save(i, t)


def title(i, text):
    e = html.escape(text, quote=False)
    t = re.sub(r"<h3>.*?</h3>", lambda m: f"<h3>{e}</h3>", load(i), count=1, flags=re.S)
    t = re.sub(r"<title>.*?</title>", lambda m: f"<title>{e}</title>", t, count=1, flags=re.S)
    save(i, t)


def reprose(i, y0, paras):
    """Replace the body prose whose baselines are at y0 or below with `paras`, and fit the canvas."""
    t = load(i)
    cap = re.compile(r'<text class="cap" x="40" y="([0-9.]+)" text-anchor="start">.*?</text>', re.S)
    svg = re.search(r"<svg viewBox='0 0 680 \d+'.*?</svg>", t, re.S).group(0)
    kept = cap.sub(lambda m: m.group(0) if float(m.group(1)) < y0 else "", svg)
    body, last = prose(y0, paras)
    new = re.sub(r"viewBox='0 0 680 \d+'", f"viewBox='0 0 680 {round(last + 24)}'", kept, count=1)
    new = new.replace("</svg>", body + "</svg>")
    save(i, t.replace(svg, new))


# ---- Part 1 ---------------------------------------------------------------------------------------
replace("o001", "The distinction the whole video turns on", "The distinction the whole subject turns on")
restamp("o002", "The other 634 billion sit in memory")

# ---- Part 3 and 4 ---------------------------------------------------------------------------------
restamp("o007", "A transformer layer does two different jobs")
restamp("o008", "About 2/3 of a transformer's parameters")
restamp("o011", "look at what that structure does to the accounting")

# ---- Part 6: the router's overview names DeepSeek V3 and the word affinity -----------------------
reprose("o013", 434, [
    "Some models, DeepSeek V3 among them, compute these scores, which they call affinities, with a "
    "sigmoid plus a normalisation instead of a softmax ({{fig:v06-p20}}). The skeleton stays the same: "
    "score, select, renormalise.",
])

# ---- Part 7: fine-grained experts ----------------------------------------------------------------
restamp("o014", "So, how many experts should a layer have")
reprose("o014", 356, [
    "Eight quarter-width experts cost exactly what two full-width experts cost, so the compute did not "
    "move at all. Only the number of possible teams did.",
    "This is the fine-grained idea of the DeepSeekMoE paper: many small experts rather than a few "
    "large ones. DeepSeek V3 runs 256 routed experts with eight firing per token, and DeepSeek V4 Pro, "
    "the 1.6-trillion-parameter model of {{fig:v05-o001}}, pushes the pool to 384. Compute per token "
    "barely moves while what a token can compose becomes far more specific.",
])

# ---- Part 8: the shared expert; "Chimera 2" in the captions is Kimi K2 ----------------------------
restamp("o015", "The DeepSeek MoE paper added a second refinement")
reprose("o015", 474, [
    "The DeepSeekMoE paper brought this in alongside fine-grained experts. DeepSeek V3 pairs one shared "
    "expert with its 256 routed ones; Llama 4 Maverick does the same, and so does Kimi K2, the "
    "trillion-parameter model. Qwen 3, at 235 billion parameters, deliberately leaves it out, so it is "
    "popular but not required.",
])


# ---- Part 9: routing collapse ------------------------------------------------------------------------
restamp("o017", "Token choice has a failure mode")
restamp("o018", "The classic fix introduced by Shazeer")       # o018 is redrawn whole in balance.py


# ---- part labels, renumbered for the three parts the pass adds (s11 Part 8, s12 Part 10, s13 Part 13) ----
replace("s08", "<div class='l'>Part 8</div>", "<div class='l'>Part 9</div>")
replace("s09", "<div class='l'>Part 9</div>", "<div class='l'>Part 11</div>")
replace("s10", "<div class='l'>Part 10</div>", "<div class='l'>Part 12</div>")


if __name__ == "__main__":
    print("edits applied")
