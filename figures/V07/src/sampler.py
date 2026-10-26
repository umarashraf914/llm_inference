"""V7 Part 9, the sampler: o019 (merged with o020's top flow), o020, o021 rebuilt, then b55–b62
(P55–P62) and b71, the sampler playground (review §5 items 8, 13, 26, 27).

  o019  recap: one score per token, softmax to shares, on the series' four logits (V01 Figs 8-9)
  o020  neither extreme works: Holtzman et al. 2020
  b55   greedy and beam search, on a two-step probability tree
  b56   degeneration, quoted from Holtzman et al.'s Figure 1 (GPT-2 Large, beam width 32)
  b57   a thin tail adds up: 1 - 0.9^100
  o021  the sampler's pipeline: divide by T, softmax, cut, renormalise, draw
  b58   temperature on the four logits at T = 0.5, 1, 2
  b59   why: the ratio of two probabilities is e^(gap / T)
  b60   top-k on a confident list and an unsure one
  b61   top-p: a running total, cut at P
  b62   min-p: a cut at a fraction of the leader
  b71   widget: the playground

  python3 figures/V07/src/sampler.py
"""
import itertools, math
from bcommon import (SRT, JS_FMT, VOCAB, W70, arr, box, cell, emit, emit_widget, eq, f, g, ghost, hd,
                     js_fill, ln, pc, prose, stamp, tw, txt)

CONF = [("cat", 8.2), ("dog", 7.1), ("the", 3.5), ("banana", 0.4)]          # V01 Fig 8's logits
UNSURE = [("red", 3.0), ("blue", 2.9), ("green", 2.8), ("gold", 2.7), ("grey", 2.6), ("the", 0.0)]


def softmax(z):
    m = max(z)
    e = [math.exp(v - m) for v in z]
    s = sum(e)
    return [v / s for v in e]


def sample_set(logits, T=1.0, method="none", k=4, p=0.9, mp=0.1):
    """The playground's arithmetic: shares after temperature, which survive the cut, and the
    renormalised shares. Returns (shares, kept flags, final shares)."""
    sh = softmax([v / T for v in logits])
    order = sorted(range(len(sh)), key=lambda i: -sh[i])
    keep = [True] * len(sh)
    if method == "top-k":
        keep = [i in order[:k] for i in range(len(sh))]
    elif method == "top-p":
        tot, kept = 0.0, set()
        for i in order:
            kept.add(i)
            tot += sh[i]
            if tot >= p:
                break
        keep = [i in kept for i in range(len(sh))]
    elif method == "min-p":
        cut = mp * max(sh)
        keep = [v >= cut for v in sh]
    s = sum(v for v, kk in zip(sh, keep) if kk)
    fin = [v / s if kk else 0.0 for v, kk in zip(sh, keep)]
    return sh, keep, fin


P_CONF = softmax([v for _, v in CONF])
P_UNS = softmax([v for _, v in UNSURE])
assert [pc(v, 1) for v in P_CONF[:2]] + [pc(v, 2) for v in P_CONF[2:]] == ["74.5%", "24.8%", "0.68%", "0.03%"]
assert [round(100 * v, 1) for v in P_UNS] == [23.9, 21.6, 19.6, 17.7, 16.0, 1.2]


def share_rows(b, x_lab, x0, y0, names, shares, sc, keep=None, fin=None, pitch=26, xfin=None, xval=None):
    """Rows of share bars to scale: kept ones filled, dropped ones as dashed outlines. Values go after
    each bar, or in a fixed column at xval."""
    for i, (nm, v) in enumerate(zip(names, shares)):
        y = y0 + i * pitch
        b.append(txt(x_lab, y + 15, nm, "cap"))
        w = max(v * sc, 1.5)
        if keep is None or keep[i]:
            b.append(cell(x0, y, w, 20, "s" if keep is not None else "m"))
        else:
            b.append(ghost(x0, y, max(w, 3), 20))
        b.append(txt(xval if xval else x0 + w + 8, y + 15, pc(v, 2 if v < 0.01 else 1), "sub2"))
        if fin is not None and xfin is not None and keep[i]:
            b.append(txt(xfin, y + 15, pc(fin[i]), "sub2"))


# ---- o019: the recap ----------------------------------------------------------------------------
def o019():
    b = [hd(40, 46, "Each token's score, e to that score, and its share of the total")]
    xs = [40, 150, 240, 330]
    for x, h in zip(xs[1:], ["score", "e to the score", "share"]):
        b.append(txt(x, 72, h, "sub2"))
    ex = [math.exp(v) for _, v in CONF]
    tot = sum(ex)
    for i, ((nm, v), e, p) in enumerate(zip(CONF, ex, P_CONF)):
        y = 82 + i * 30
        b.append(txt(40, y + 16, nm, "cap"))
        b.append(txt(150, y + 16, f(v, 1), "sub2"))
        b.append(txt(240, y + 16, g(e) if e > 10 else f(e, 2), "sub2"))
        b.append(cell(330, y + 2, max(p * 260, 1.5), 20, "m"))
        b.append(txt(330 + max(p * 260, 1.5) + 8, y + 17, pc(p, 2 if p < 0.01 else 1), "sub2"))
    b.append(ln(240, 82 + 4 * 30 + 2, 300, 82 + 4 * 30 + 2, "tick"))
    b.append(txt(150, 82 + 4 * 30 + 20, "total", "sub2"))
    b.append(txt(240, 82 + 4 * 30 + 20, g(tot), "sub2"))
    assert round(tot) == 4888 and abs(sum(P_CONF) - 1) < 1e-12
    logit_bytes = VOCAB * 4
    body, yb = prose(262, [
        f"Every forward pass ends the same way: a vector of logits, one raw score for every token in "
        f"the vocabulary, {g(VOCAB)} of them for Llama 3. Softmax raises e to each score and divides by "
        "the total, so the scores become shares that add up to one ({{fig:v01-o009}}). These four "
        "carry the illustrative scores used across the series ({{fig:v01-o008}}), worked over the "
        "four alone.",
        f"The sampler's job is to pick one token from those shares. Next to the forward pass it is "
        f"nearly free: a list of {g(VOCAB)} numbers, about half a megabyte, against {g(W70 / 1e9)} GB of "
        "weights read for every token of a 70-billion-parameter model. It is also where every "
        "user-facing quality knob lives.",
    ])
    assert 0.5e6 < logit_bytes < 0.52e6
    emit("o019", stamp(SRT, "Every forward pass ends the same way."),
         "Every forward pass ends in one score per token, and softmax makes them shares", yb + 32,
         b + [body],
         "Nearly free next to the forward pass, and yet where every user-facing quality knob lives. "
         "Small gaps in score become large gaps in share, which is what everything below works on.")


# ---- o020: neither extreme works ----------------------------------------------------------------
def o020():
    b = [hd(40, 46, "Neither extreme works")]
    b.append(box(40, 70, 285, 82, "h", "Always take the highest", "degeneration: bland, incoherent,",
                 "stuck in repetitive loops"))
    b.append(box(355, 70, 285, 82, "h", "Sample from the raw shares", "thousands of tiny shares,",
                 "and incoherent choices drawn"))
    body, yb = prose(196, [
        "The obvious approach is to take the highest-scoring token every time. It does not work. "
        "Holtzman and colleagues showed in 2020 that maximization-based decoding, choosing greedily or "
        "by beam search, produces what they named degeneration: text that is bland, incoherent, or "
        "stuck in repetitive loops.",
        "Sampling straight from the raw distribution fails in the opposite direction. A language "
        "model's tail is unreliable: thousands of tokens each hold a tiny share, and between them "
        "enough probability that incoherent choices get drawn regularly.",
    ])
    emit("o020", stamp(SRT, "The obvious approach is to take the"),
         "Taking the top token fails, and so does sampling everything", yb + 32, b + [body],
         "Both naive strategies fail, in opposite directions. The next three figures take them apart: "
         "what maximising means, what it produces, and how a thin tail adds up.")


# ---- b55: greedy and beam search ----------------------------------------------------------------
TREE = {"The": (0.5, {"cat": 0.4, "dog": 0.3, "end": 0.3}),
        "A": (0.4, {"cat": 0.9, "dog": 0.1}),
        "One": (0.1, None)}


def b55():
    seqs = {(a, b_): pa * pb for a, (pa, kids) in TREE.items() if kids for b_, pb in kids.items()}
    first = max(TREE, key=lambda a: TREE[a][0])
    greedy = (first, max(TREE[first][1], key=TREE[first][1].get))
    beam1 = sorted(TREE, key=lambda a: -TREE[a][0])[:2]
    beam2 = sorted(((a, b_) for (a, b_) in seqs if a in beam1), key=lambda s: -seqs[s])[:2]
    assert greedy == ("The", "cat") and round(seqs[greedy], 2) == 0.20
    assert beam1 == ["The", "A"] and beam2 == [("A", "cat"), ("The", "cat")]
    assert round(seqs[("A", "cat")], 2) == 0.36 and max(seqs, key=seqs.get) == ("A", "cat")
    b = [hd(40, 46, "Two steps of choices, each with its probability; a text's probability is the product")]
    b.append(cell(40, 150, 56, 26, "u", label="start"))
    rows = {}
    r = 0
    for a, (pa, kids) in TREE.items():
        n = len(kids) if kids else 1
        rows[a] = (r, n)
        r += n
    Y = lambda row: 74 + row * 34
    for a, (pa, kids) in TREE.items():
        r0, n = rows[a]
        ya = Y(r0 + (n - 1) / 2)
        cls = "s" if a in beam1 else "u"
        b.append(ln(96, 163, 150, ya + 13))
        b.append(cell(150, ya, 86, 26, cls if kids else "u", label=f"{a} · {f(pa, 1)}"))
        if not kids:
            b.append(txt(250, ya + 17, "dropped after step one by a beam of two", "sub2"))
            continue
        for j, (b_, pb) in enumerate(kids.items()):
            yb_ = Y(r0 + j)
            p = seqs[(a, b_)]
            on_beam = (a, b_) in beam2
            b.append(ln(236, ya + 13, 290, yb_ + 13))
            b.append(cell(290, yb_, 86, 26, "s" if on_beam else "u", label=f"{b_} · {f(pb, 1)}"))
            note = f"{f(pa, 1)} × {f(pb, 1)} = {f(p)}"
            if (a, b_) == greedy:
                note += "   greedy's pick"
            if (a, b_) == beam2[0]:
                note += "   beam search's pick"
            b.append(txt(392, yb_ + 17, note, "sub2"))
    body, yb = prose(Y(r) + 30, [
        "A text's probability is the product of its tokens' probabilities, each one given the tokens "
        "before it: A then cat is 0.4 × 0.9 = 0.36. Maximization-based decoding hunts for the text "
        "with the highest product.",
        "Greedy decoding takes the best token at each step: The, at 0.5, then cat, for 0.5 × 0.4 = "
        "0.20. It never looks back, so it misses that A, a slightly worse start, leads somewhere much "
        "better.",
        "Beam search keeps the best few partial texts, here two, extends each, and keeps the best two "
        "again. It keeps The and A, extends both, and finds A cat at 0.36. A wider beam finds still "
        "more probable text, and the next figure shows why that is the problem.",
    ])
    emit("b55", stamp(SRT, "Holtzman and colleagues showed in 2020"),
         "Greedy and beam search both chase the most probable text", yb + 32, b + [body],
         "Probabilities illustrative; highlighted boxes are what a beam of two keeps. Both methods aim "
         "at the most probable text, and beam search is simply better at finding it.")


# ---- b56: degeneration, quoted ------------------------------------------------------------------
CONTEXT = ("In a shocking finding, scientist discovered a herd of unicorns living in a remote, "
           "previously unexplored valley, in the Andes Mountains. Even more surprising to the "
           "researchers was the fact that the unicorns spoke perfect English.")
BEAM_HEAD = ("“The study, published in the Proceedings of the National Academy of Sciences of the "
             "United States of America (PNAS), was conducted by researchers from the")
BEAM_TAIL = ["(UNAM) and the", "(UNAM/", "/", "/", "/", ""]
UNAM = "Universidad Nacional Autónoma de México"
PURE = ("They were cattle called Bolivian Cavalleros; they live in a remote desert uninterrupted by "
        "town, and they speak huge, beautiful, paradisiacal Bolivian linguistic thing. They say, "
        "'Lunch, marge.' They don't tell what the lunch is,” director Professor Chuperas Omwell told "
        "Sky News.")


def b56():
    import textwrap
    full = BEAM_HEAD + " " + " ".join(
        (UNAM if i < 5 else "Universidad Nacional Autónoma de ...”") + (" " + t if t else "")
        for i, t in enumerate(BEAM_TAIL))
    assert full.count("Universidad Nacional Autónoma de") == 6 and full.count(UNAM) == 5
    b = [txt(40, 40, "the opening both were given", "cap")]
    y = 60
    for line in textwrap.wrap(CONTEXT, 92):
        b.append(txt(40, y, line, "sub2")); y += 17
    y += 22
    b.append(txt(40, y, "beam search, keeping 32 candidates", "cap")); y += 20
    for line in textwrap.wrap(BEAM_HEAD, 92):
        b.append(txt(40, y, line, "sub2")); y += 17
    y += 2
    for i, t in enumerate(BEAM_TAIL):
        lab = UNAM if i < 5 else "Universidad Nacional Autónoma de …”"
        b.append(cell(40, y, 270, 22, "h", label=lab))
        if t:
            b.append(txt(320, y + 15, t, "sub2"))
        y += 27
    y += 26
    b.append(txt(40, y, "sampling straight from the model's shares", "cap")); y += 20
    for line in textwrap.wrap(PURE, 92):
        b.append(txt(40, y, line, "sub2")); y += 17
    body, yb = prose(y + 30, [
        "Both continuations come from GPT-2 Large, a 774-million-parameter model OpenAI released in "
        "2019, given the same "
        "two-sentence opening (Holtzman et al., 2020, Figure 1). Beam search finds text the model rates "
        "as highly probable, and it is one university's name, five times over and starting a sixth.",
        "Models do assign high probability to well-formed text, but the highest-scoring long "
        "continuations tend to be generic and repetitive. Each repetition makes the next more "
        "probable, a feedback loop the same paper measured. Sampling from the raw shares escapes the "
        "loop and wanders into nonsense instead.",
    ])
    emit("b56", stamp(SRT, "In their example, beam search on GPT-2"),
         "The most probable text repeats itself; the raw shares wander off", yb + 32, b + [body],
         "Quoted from the paper, repeats highlighted. Maximising probability and writing well turn out "
         "to be different goals.")


# ---- b57: a thin tail adds up -------------------------------------------------------------------
def b57():
    head, n_tail, each, L = 0.90, 1000, 0.0001, 100
    tail = n_tail * each
    assert abs(head + tail - 1) < 1e-12
    none = head ** L
    at_least = 1 - none
    small = 1 - 0.99 ** L
    assert round(at_least, 5) == 0.99997 and round(small, 3) == 0.634 and round(L * tail) == 10
    b = [hd(40, 46, "One step's probability: a few likely tokens, and a thousand unlikely ones")]
    X0, SC = 40, 600
    b.append(cell(X0, 66, head * SC, 30, "m", label="the top few tokens: 90%"))
    b.append(cell(X0 + head * SC, 66, tail * SC, 30, "h"))
    b.append(txt(X0 + head * SC + tail * SC, 114, "1,000 tokens × 0.01% = 10%", "sub2", "end"))
    ye = 140
    b.append(eq(40, ye, 172, "no tail token, one step: 0.90", "u", h=34))
    b.append(eq(226, ye, 196, "none in 100 steps: 0.90^100", "u", h=34))
    b.append(eq(436, ye, 204, f"= {none:.7f}", "u", h=34))
    b.append(eq(40, ye + 48, 290, f"at least one in 100: {pc(at_least, 3)}", "h", h=34))
    b.append(eq(346, ye + 48, 294, f"tail tokens drawn, on average: {round(L * tail)}", "h", h=34))
    body, yb = prose(ye + 48 + 34 + 40, [
        "Suppose a few top tokens hold 90% of the probability at every step and a thousand others "
        "share the remaining 10%, 0.01% each. No single tail token is likely, but the tail as a whole "
        "is drawn one step in ten.",
        f"Over a {L}-token answer the chance of never touching the tail is 0.9 multiplied by itself "
        f"{L} times, {none:.7f}, so at least one tail token appears in {pc(at_least, 3)} of answers, "
        f"and about {round(L * tail)} on average. Even a 1% tail is hit at least once in "
        f"{pc(small, 0)} of answers. One incoherent token can send the text somewhere odd, and "
        "everything after builds on it.",
        "So the sampler does two things: it reshapes the distribution, and it cuts off the tail.",
    ])
    emit("b57", stamp(SRT, "A language model's tail is unreliable."),
         "A thin tail adds up", yb + 32, b + [body],
         "Masses illustrative, bar to scale. The danger is not any one unlikely token but how many "
         "there are: thousands of tiny shares add up, which is why the tail is cut rather than trusted.")


# ---- o021: the pipeline -------------------------------------------------------------------------
def o021():
    stages = [("logits", "per token", "u"), ("÷ T", "reshape", "m"), ("softmax", "shares", "u"),
              ("cut", "drop the tail", "s"), ("rescale", "sum to one", "u"), ("draw", "one token", "u")]
    b = [hd(40, 46, "The order of operations, every token, after the forward pass")]
    W, GAP = 90, 12
    for i, (t, s_, c) in enumerate(stages):
        x = 40 + i * (W + GAP)
        b.append(box(x, 92, W, 50, c, t, s_, rx=6))
        if i:
            b.append(arr(x - GAP + 2, 117, x - 2, 117))
    def br(i0, i1, lab):
        x1, x2 = 40 + i0 * (W + GAP), 40 + i1 * (W + GAP) + W
        return (ln(x1, 80, x2, 80, "tick") + ln(x1, 80, x1, 86, "tick") + ln(x2, 80, x2, 86, "tick")
                + txt((x1 + x2) / 2, 72, lab, "sub2", "middle"))
    b.append(br(1, 2, "temperature reshapes"))
    b.append(br(3, 4, "truncation cuts"))
    body, yb = prose(184, [
        "Temperature does the reshaping: every logit is divided by a number T before the softmax. "
        "Truncation does the cutting, in one of three ways. Top-k keeps a fixed number of the best "
        "tokens. Top-p, or nucleus sampling, keeps the fewest top tokens whose probabilities add up "
        "to at least P. Min-p keeps the tokens at least some fraction as likely as the best one.",
        "Whatever survives is renormalised to sum to one, and a single token is drawn in proportion "
        "({{fig:v01-o010}}). The next five figures work each step on numbers.",
    ])
    emit("o021", stamp(SRT, "Temperature does the reshaping."),
         "Reshape, then cut, then draw", yb + 32, b + [body],
         "Two independent operations, usually applied together. Neither touches the model, which is "
         "why these are runtime knobs rather than training decisions.")


# ---- b58: temperature, worked -------------------------------------------------------------------
def b58():
    Ts = [0.5, 1.0, 2.0]
    res = {T: softmax([v / T for _, v in CONF]) for T in Ts}
    assert round(100 * res[0.5][0], 1) == 90.0 and round(100 * res[2.0][0], 1) == 59.1
    assert round(100 * res[2.0][2], 1) == 5.6 and round(100 * res[2.0][3], 1) == 1.2
    for T in Ts:
        assert sorted(range(4), key=lambda i: -res[T][i]) == [0, 1, 2, 3]   # order never changes
    b = [hd(40, 46, "The same four scores, divided by T before the softmax")]
    b.append(txt(40, 66, "in each column: the score divided by T, then the share it gets", "sub2"))
    PX = [100, 280, 460]
    SC = 90
    for x, T in zip(PX, Ts):
        b.append(txt(x, 92, f"T = {f(T, 1)}", "hd"))
    for i, (nm, v) in enumerate(CONF):
        y = 104 + i * 30
        b.append(txt(40, y + 15, nm, "cap"))
        for x, T in zip(PX, Ts):
            p = res[T][i]
            b.append(txt(x, y + 15, f(v / T, 2 if T == 2.0 else 1), "sub2"))
            w = max(p * SC, 1.5)
            b.append(cell(x + 40, y + 2, w, 18, "m"))
            b.append(txt(x + 40 + w + 6, y + 15, pc(p, 2 if p < 0.01 else 1), "sub2"))
            assert x + 40 + w + 6 + 40 < 640
    body, yb = prose(254, [
        f"Dividing every score by T changes the gaps between them. At T = 0.5 the scores double, 16.4 "
        f"against 14.2, and cat's share rises from {pc(res[1.0][0])} to {pc(res[0.5][0])}. At T = 2 they "
        f"halve, 4.1 against 3.55, and cat falls to {pc(res[2.0][0])} while the and banana climb from "
        f"under 1% to {pc(res[2.0][2])} and {pc(res[2.0][3])}.",
        "At T = 1 nothing changes. Below 1 the distribution sharpens toward a spike on the top score, "
        "approaching greedy; above 1 it flattens, spreading probability toward unlikely tokens.",
    ])
    emit("b58", stamp(SRT, "Divide every logit by a temperature T"),
         "Halving the temperature turns 74% into 90%", yb + 32, b + [body],
         "Bars to scale within each column. Temperature never changes the order of the tokens, only "
         "how far apart their chances are.")


# ---- b59: why it works --------------------------------------------------------------------------
def b59():
    gap = CONF[0][1] - CONF[1][1]
    rows = [(T, gap / T, math.exp(gap / T)) for T in (0.5, 1.0, 2.0)]
    for T, ex, r in rows:
        sh = softmax([v / T for _, v in CONF])
        assert abs(sh[0] / sh[1] - r) < 1e-9
    assert [round(r, 2) for _, _, r in rows] == [9.03, 3.0, 1.73]
    b = [hd(40, 46, "Cat's chance against dog's, at temperature T")]
    b.append(eq(40, 64, 300, "p(cat) ÷ p(dog) = e^(8.2 ÷ T) ÷ e^(7.1 ÷ T)", "u", h=36))
    b.append(txt(356, 86, "softmax's shared total cancels", "sub2"))
    b.append(eq(40, 112, 300, "= e^((8.2 − 7.1) ÷ T) = e^(1.1 ÷ T)", "m", h=36))
    b.append(txt(356, 134, "dividing powers of e subtracts exponents", "sub2"))
    b.append(txt(40, 184, "T", "cap")); b.append(txt(110, 184, "exponent 1.1 ÷ T", "sub2"))
    b.append(txt(250, 184, "ratio", "sub2"))
    for k, (T, ex, r) in enumerate(rows):
        y = 194 + k * 30
        b.append(txt(40, y + 16, f(T, 1), "cap"))
        b.append(txt(110, y + 16, f(ex, 2), "sub2"))
        b.append(cell(250, y + 2, r * 30, 20, "m"))
        b.append(txt(250 + r * 30 + 8, y + 16, f"{f(r)} to 1", "sub2"))
    body, yb = prose(312, [
        "Softmax divides every e-value by the same total, so in a ratio of two shares the total cancels "
        "and only e^(score ÷ T) is left for each. Dividing one power of e by another subtracts their "
        "exponents, so the ratio is e raised to the gap in scores divided by T.",
        f"The gap here is {f(gap, 1)}. Halving T doubles the exponent, and because it is an exponent the "
        f"ratio is squared: {f(rows[1][2])} to 1 becomes {f(rows[0][2])} to 1. Doubling T halves it, and "
        f"the ratio falls to its square root, {f(rows[2][2])}. As T shrinks toward 0 the ratio grows "
        "without limit, which is greedy; as T grows the ratio tends to 1, every token alike.",
    ])
    emit("b59", stamp(SRT, "Below 1, the gaps between scores widen,"),
         "Dividing by T scales the gap in the exponent", yb + 32, b + [body],
         "Bars to scale. One division, inside an exponential: that is why a small change in "
         "temperature makes a large change in how adventurous the text is.")


# ---- b60, b61, b62: truncation ------------------------------------------------------------------
def lists_panel(b, method, y0, **kw):
    """Draw both lists under one truncation rule. Returns the kept counts."""
    out = []
    for name_, L, y in (("confident list", CONF, y0), ("unsure list", UNSURE, y0 + 4 * 26 + 40)):
        sh, keep, fin = sample_set([v for _, v in L], method=method, **kw)
        b.append(txt(40, y - 10, name_, "sub2"))
        share_rows(b, 40, 120, y, [n for n, _ in L], sh, 300, keep=keep, fin=fin, xfin=540, xval=440)
        b.append(txt(440, y - 10, "share", "sub2"))
        b.append(txt(540, y - 10, "kept, rescaled", "sub2"))
        out.append((sh, keep, fin))
    return out


def b60():
    b = [hd(40, 46, "Top-k with k = 2: rank, keep the two highest, rescale")]
    (sc_, kc, fc), (su, ku, fu) = lists_panel(b, "top-k", 84, k=2)
    assert kc == [True, True, False, False] and round(100 * fc[0], 1) == 75.0
    assert ku == [True, True, False, False, False, False] and round(100 * fu[0], 1) == 52.5
    lost = sum(su[2:5])
    assert round(100 * lost, 1) == 53.3
    conf5 = sample_set([v for _, v in CONF], method="top-k", k=5)[1]
    assert all(conf5)                               # a k that suits the unsure list keeps banana
    body, yb = prose(84 + 10 * 26 + 72, [
        f"Top-k ranks the tokens by probability, keeps the k highest, drops the rest and rescales the "
        f"survivors to sum to one. On the confident list with k = 2, cat and dog become "
        f"{pc(fc[0])} and {pc(fc[1])}.",
        f"On the unsure list the same k = 2 keeps red and blue and throws away green, gold and grey, "
        f"{pc(lost)} of the probability, though each is nearly as likely as the two kept. A k large "
        "enough for the unsure list, 5, would keep banana on the confident one. No single k suits "
        "both, because k pays no attention to how confident the model is.",
        "It is the same rank, cut and rescale that a mixture-of-experts router uses to choose its "
        "experts ({{fig:v06-o009}}).",
    ])
    emit("b60", stamp(SRT, "Top K keeps the K highest probability"),
         "Top-k keeps the k best, however sure the model is", yb + 32, b + [body],
         "Bars to scale, dropped tokens dashed. A fixed short list: right for one shape of "
         "distribution, wrong for the other.")


def b61():
    b = [hd(40, 46, "Top-p with P = 0.9: add shares from the top until the total reaches 90%")]
    out = []
    for name_, L, y0 in (("confident list", CONF, 84), ("unsure list", UNSURE, 84 + 4 * 26 + 40)):
        sh, keep, fin = sample_set([v for _, v in L], method="top-p", p=0.9)
        run = list(itertools.accumulate(sh))
        b.append(txt(40, y0 - 10, name_, "sub2"))
        b.append(txt(470, y0 - 10, "running total", "sub2"))
        SC = 300
        for i, (nm, _) in enumerate(L):
            y = y0 + i * 26
            b.append(txt(40, y + 15, nm, "cap"))
            prev = run[i] - sh[i]
            if prev > 0:
                b.append(cell(120, y, prev * SC, 20, "u"))
            if keep[i]:
                b.append(cell(120 + prev * SC, y, max(sh[i] * SC, 1.5), 20, "s"))
            else:
                b.append(ghost(120 + prev * SC, y, max(sh[i] * SC, 3), 20))
            b.append(txt(470, y + 15, pc(run[i]) + ("  kept" if keep[i] else ""), "sub2"))
        x9 = 120 + 0.9 * SC
        b.append(ln(x9, y0 - 4, x9, y0 + len(L) * 26 - 4, "mark xok"))
        out.append((sh, keep, run))
    (sc_, kc, rc), (su, ku, ru) = out
    assert sum(kc) == 2 and round(100 * rc[1], 1) == 99.3
    assert sum(ku) == 5 and round(100 * ru[3], 1) == 82.8 and round(100 * ru[4], 1) == 98.8
    body, yb = prose(84 + 10 * 26 + 72, [
        "Top-p, also called nucleus sampling, sorts the tokens, adds up their probabilities from the "
        "top, and keeps the fewest whose total reaches at least P. Each bar starts where the one above "
        "ended, so its right end is the running total; the dashed line is 90%.",
        f"On the confident list cat alone reaches {pc(rc[0])} and cat with dog {pc(rc[1])}, so two "
        f"tokens are kept. On the unsure list the total passes 90% only at the fifth, {pc(ru[4])}, so "
        "five are kept and only the stray the is dropped. Because it reads the shape of the "
        "distribution, the set is tiny when the model is confident and widens when it is unsure.",
    ])
    emit("b61", stamp(SRT, "Top P, or nucleus sampling, keeps the"),
         "Top-p keeps two tokens when the model is sure, five when it is not", yb + 32, b + [body],
         "Bars to scale. The same P gives a short list or a long one, depending on what the model is "
         "telling it.")


def b62():
    frac = 0.1
    b = [hd(40, 46, f"Min-p at {f(frac, 1)}: keep every token at least a tenth as likely as the best")]
    res = []
    for name_, L, y0 in (("confident list", CONF, 84), ("unsure list", UNSURE, 84 + 4 * 26 + 40)):
        sh, keep, fin = sample_set([v for _, v in L], method="min-p", mp=frac)
        b.append(txt(40, y0 - 10, name_, "sub2"))
        share_rows(b, 40, 120, y0, [n for n, _ in L], sh, 300, keep=keep, fin=fin, xfin=540, xval=440)
        b.append(txt(440, y0 - 10, "share", "sub2"))
        b.append(txt(540, y0 - 10, "kept, rescaled", "sub2"))
        xc = 120 + frac * max(sh) * 300
        b.append(ln(xc, y0 - 4, xc, y0 + len(L) * 26 - 4, "mark xok"))
        b.append(txt(xc + 4, y0 + len(L) * 26 + 8, f"cut at {pc(frac * max(sh), 2)}", "sub2"))
        res.append((sh, keep))
    (sc_, kc), (su, ku) = res
    assert kc == [True, True, False, False] and ku == [True] * 5 + [False]
    assert round(100 * frac * sc_[0], 2) == 7.45 and round(100 * frac * su[0], 2) == 2.39
    body, yb = prose(84 + 10 * 26 + 80, [
        "Min-p sets its cut-off by scaling the top token's probability, keeping only tokens at least "
        f"some fraction as likely as the best one. With a fraction of {f(frac, 1)}, the confident "
        f"list's leader at {pc(sc_[0])} sets the cut at {pc(frac * sc_[0], 2)}: cat and dog stay, the "
        f"and banana go. The unsure list's leader at {pc(su[0])} sets it at {pc(frac * su[0], 2)}: all "
        "five colours stay and the goes.",
        "Like top-p it adapts to how sure the model is, but by one comparison per token instead of a "
        "running total.",
    ])
    emit("b62", stamp(SRT, "Min P sets its cut-off by scaling the"),
         "Min-p sets its cut as a fraction of the leader", yb + 32, b + [body],
         "Bars to scale, dropped tokens dashed. Two adaptive cuts, two rules, the same verdict on both "
         "lists here.")


# ---- b71: the playground (widget) ---------------------------------------------------------------
DEF = dict(lst=0, T=1.0, method="top-p", k=2, p=0.9, mp=0.1)

WIDGET_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const L = __L__, D = __D__;
  __FMT__
  const q = s => fig.querySelector(s);
  const sl = [...fig.querySelectorAll('input[type=range]')], val = [...fig.querySelectorAll('.val')];
  const rl = [...fig.querySelectorAll('input[name="v07-b71-list"]')], rm = [...fig.querySelectorAll('input[name="v07-b71-cut"]')];
  function softmax(z) { const m = Math.max(...z), e = z.map(v => Math.exp(v - m)), s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); }
  function sampleSet(logits, T, method, k, p, mp) {
    const sh = softmax(logits.map(v => v / T));
    const order = sh.map((v, i) => i).sort((a, b) => sh[b] - sh[a]);
    let keep = sh.map(() => true);
    if (method === 'top-k') keep = sh.map((v, i) => order.slice(0, k).includes(i));
    else if (method === 'top-p') { let tot = 0; const kept = new Set();
      for (const i of order) { kept.add(i); tot += sh[i]; if (tot >= p) break; }
      keep = sh.map((v, i) => kept.has(i)); }
    else if (method === 'min-p') { const cut = mp * Math.max(...sh); keep = sh.map(v => v >= cut); }
    const s = sh.reduce((a, v, i) => a + (keep[i] ? v : 0), 0);
    return [sh, keep, sh.map((v, i) => keep[i] ? v / s : 0)];
  }
  function draw() {
    const li = rl[1].checked ? 1 : 0, lst = L[li], T = +sl[0].value, k = +sl[1].value, p = +sl[2].value, mp = +sl[3].value;
    const method = rm.find(r => r.checked).value;
    val[0].textContent = fx(T, 1); val[1].textContent = k; val[2].textContent = fx(p, 2); val[3].textContent = fx(mp, 2);
    const [sh, keep, fin] = sampleSet(lst.map(t => t[1]), T, method, k, p, mp);
    for (let i = 0; i < 6; i++) {
      const row = q(`[data-row="${i}"]`);
      if (i >= lst.length) { row.style.display = 'none'; continue; }
      row.style.display = '';
      q(`[data-nm="${i}"]`).textContent = lst[i][0];
      q(`[data-lt="${i}"]`).textContent = fx(lst[i][1] / T, 2);
      const w = Math.max(sh[i] * 200, 1.5), bar = q(`[data-sh="${i}"]`);
      bar.setAttribute('width', w.toFixed(2));
      bar.parentNode.setAttribute('class', keep[i] ? 's' : 'u');
      bar.style.cssText = keep[i] ? '' : 'fill:none;stroke:var(--rule);stroke-dasharray:3 3';
      const tv = q(`[data-sv="${i}"]`); tv.textContent = pcx(sh[i], sh[i] < 0.01 ? 2 : 1); tv.setAttribute('x', (160 + w + 6).toFixed(2));
      const wf = fin[i] * 140, fb = q(`[data-fb="${i}"]`);
      fb.setAttribute('width', Math.max(wf, keep[i] ? 1.5 : 0).toFixed(2));
      const fv = q(`[data-fv="${i}"]`); fv.textContent = keep[i] ? pcx(fin[i], fin[i] < 0.01 ? 2 : 1) : 'dropped';
      fv.setAttribute('x', (440 + Math.max(wf, 1.5) + 6).toFixed(2));
    }
    const nk = keep.filter(Boolean).length;
    q('[data-sum]').textContent = `keeps ${nk} of ${lst.length} tokens; the most likely draw is ${lst[fin.indexOf(Math.max(...fin))][0]}, at ${pcx(Math.max(...fin))}`;
  }
  [...sl, ...rl, ...rm].forEach(e => e.addEventListener('input', draw));
  [...rl, ...rm].forEach(e => e.addEventListener('change', draw));
  q('button').addEventListener('click', () => {
    rl[D.lst].checked = true; rm.find(r => r.value === D.method).checked = true;
    sl[0].value = D.T; sl[1].value = D.k; sl[2].value = D.p; sl[3].value = D.mp; draw(); });
  draw();
})();</script>"""


def b71():
    lst = CONF
    sh, keep, fin = sample_set([v for _, v in lst], T=DEF["T"], method=DEF["method"], p=DEF["p"])
    assert keep == [True, True, False, False] and round(100 * fin[0], 1) == 75.0
    s = [hd(40, 34, "One list of scores, through temperature, a cut and a rescale")]
    s.append(txt(40, 62, "token", "sub2")); s.append(txt(92, 62, "score ÷ T", "sub2"))
    s.append(txt(160, 62, "after softmax", "sub2")); s.append(txt(440, 62, "after the cut, rescaled", "sub2"))
    for i in range(6):
        y = 72 + i * 28
        vis = i < len(lst)
        nm, lv = (lst[i] if vis else ("", 0.0))
        w = max(sh[i] * 200, 1.5) if vis else 1.5
        kept = keep[i] if vis else True
        wf = fin[i] * 140 if vis else 0
        style = '' if kept else ' style="fill:none;stroke:var(--rule);stroke-dasharray:3 3"'
        s.append(f'<g data-row="{i}"{"" if vis else " style=" + chr(34) + "display:none" + chr(34)}>'
                 f'<text class="cap" x="40" y="{y + 15}" data-nm="{i}">{nm}</text>'
                 f'<text class="sub2" x="92" y="{y + 15}" data-lt="{i}">{f(lv / DEF["T"], 2) if vis else ""}</text>'
                 f'<g class="{"s" if kept else "u"}"><rect x="160" y="{y + 1}" width="{w:.2f}" height="18" rx="2" data-sh="{i}"{style}/></g>'
                 f'<text class="sub2" x="{160 + w + 6:.2f}" y="{y + 15}" data-sv="{i}">{pc(sh[i], 2 if vis and sh[i] < 0.01 else 1) if vis else ""}</text>'
                 f'<g class="m"><rect x="440" y="{y + 1}" width="{max(wf, 1.5 if kept else 0):.2f}" height="18" rx="2" data-fb="{i}"/></g>'
                 f'<text class="sub2" x="{440 + max(wf, 1.5) + 6:.2f}" y="{y + 15}" data-fv="{i}">'
                 f'{(pc(fin[i], 2 if fin[i] < 0.01 else 1) if kept else "dropped") if vis else ""}</text></g>')
    s.append(f'<text class="sub2" x="40" y="{72 + 6 * 28 + 18}" data-sum="">keeps {sum(keep)} of {len(lst)} '
             f'tokens; the most likely draw is {lst[fin.index(max(fin))][0]}, at {pc(max(fin))}</text>')
    body, yb = prose(72 + 6 * 28 + 60, [
        "Every control acts on the same few numbers: divide by T, softmax, cut, renormalise. Try the "
        "unsure list with top-k at 2, then top-p at 0.9, to watch a fixed list fail where an adaptive "
        "one does not; then raise T and see the cut let more of the tail through.",
        "Not one weight has changed in any of this. The sampler only reshapes what the model already "
        "produced, which is why all of it is a setting on the request rather than a property of the "
        "model. The arithmetic was checked against Python over many settings.",
    ])
    ctl = ["<label class='opt'><input type='radio' name='v07-b71-list' value='0' checked> confident list</label>"
           "<label class='opt'><input type='radio' name='v07-b71-list' value='1'> unsure list</label>"
           f"<label>temperature <input type='range' min='0.1' max='3' step='0.1' value='{DEF['T']}'><span class='val'>{f(DEF['T'], 1)}</span></label>",
           "<label class='opt'><input type='radio' name='v07-b71-cut' value='none'> no cut</label>"
           "<label class='opt'><input type='radio' name='v07-b71-cut' value='top-k'> top-k</label>"
           "<label class='opt'><input type='radio' name='v07-b71-cut' value='top-p' checked> top-p</label>"
           "<label class='opt'><input type='radio' name='v07-b71-cut' value='min-p'> min-p</label>"
           "<button type='button'>Reset</button>",
           f"<label>k <input type='range' min='1' max='6' step='1' value='{DEF['k']}'><span class='val'>{DEF['k']}</span></label>"
           f"<label>P <input type='range' min='0.05' max='1' step='0.05' value='{DEF['p']}'><span class='val'>{f(DEF['p'])}</span></label>"
           f"<label>min-p fraction <input type='range' min='0' max='0.5' step='0.01' value='{DEF['mp']}'><span class='val'>{f(DEF['mp'])}</span></label>"]
    js = js_fill(WIDGET_JS.replace("__FMT__", JS_FMT), L=[CONF, UNSURE], D=DEF)
    emit_widget("b71", stamp(SRT, "Whatever survives is re-normalized into"),
                "Turn the sampler's knobs on two lists of scores", ctl, "".join(s) + body, yb + 26,
                "Temperature reshapes and truncation cuts: one knob for how adventurous the text is, "
                "one for how much of the tail to trust.", js)


if __name__ == "__main__":
    for fn in (o019, o020, b55, b56, b57, o021, b58, b59, b60, b61, b62, b71):
        fn()
