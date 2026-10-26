"""V4 Part 5, outlier features: review entry 15 (p15), Fig 45 given a job of its own, Fig 48 corrected,
and the prose of Figs 46 and 47 (names restored, the per-channel claim made consistent with p22).

  python3 figures/V04/src/part5.py
"""
import math
import numpy as np
from common import emit, hd, cell, box, eq, ln, arr, prose, text, tick, hline, dot, rect, poly, f, fi, nb, MINUS, st
from fixes import reprose


# ---- o045: INT4 against activations with one outlier ---------------------------------------------------
def o045():
    rng = np.random.default_rng(0)
    xs = rng.standard_normal(4095)
    big = 100.0
    s = big / 7
    q = np.clip(np.rint(xs / s), -7, 7)
    assert (q == 0).all() and np.abs(xs).max() < s / 2
    rms_x = float(np.sqrt((xs ** 2).mean()))
    rms_err = float(np.sqrt(((q * s - xs) ** 2).mean()))
    assert rms_err == rms_x and round(s, 1) == 14.3 and round(s / 2, 1) == 7.1
    b = [hd(40, 46, "INT4, one value 100 times the rest: the step becomes 100 ÷ 7 = " + f(s, 1))]
    # the full range, -100 to 100
    L, R, Y = 60, 620, 136
    X = lambda v: (L + R) / 2 + v / big * (R - L) / 2
    b.append(text(40, 76, "the whole range, to scale", "sub2"))
    pts = [(X(v / 10), Y - 6 - 60 * math.exp(-0.5 * (v / 10) ** 2)) for v in range(-40, 41)]
    b.append(poly(pts, "pl-m"))
    b.append(hline(L, R, Y))
    for k in range(-7, 8):
        b.append(tick(X(k * s), Y - 6, Y + 6))
    b.append(dot(X(big), Y, 5, "h"))
    b.append(text(X(big), Y - 14, "100", "sub2", "middle"))
    b.append(text(X(0), Y + 22, "4,095 ordinary values, all here", "sub2", "middle"))
    # zoomed to -10..10
    L2, R2, Y2 = 60, 620, 280
    X2 = lambda v: (L2 + R2) / 2 + v / 10 * (R2 - L2) / 2
    b.append(text(40, 190, "zoomed in to −10 to 10", "sub2"))
    b.append(rect(X2(-s / 2), Y2 - 76, X2(s / 2) - X2(-s / 2), 10, "h", rx=2))
    b.append(text(X2(0), Y2 - 82, f"everything within half a step, ±{f(s / 2, 1)}, rounds to the level at 0",
                  "sub2", "middle"))
    pts2 = [(X2(v / 10), Y2 - 6 - 54 * math.exp(-0.5 * (v / 10) ** 2)) for v in range(-45, 46)]
    b.append(poly(pts2, "pl-m"))
    b.append(hline(L2, R2, Y2))
    b.append(tick(X2(0), Y2 - 9, Y2 + 9))
    for v in (-10, -5, 0, 5, 10):
        b.append(text(X2(v), Y2 + 22, str(v).replace("-", MINUS), "sub2", "middle"))
    b.append(text(R2, Y2 - 14, f"next level at {f(s, 1)} →", "sub2", "end"))
    body, y = prose(Y2 + 60, [
        "Most activations cluster near zero, but a few run around 100 times larger, and the format's "
        "single shared scale must stretch to reach them. With INT4's levels from −7 to 7 sized to 100, "
        f"one step is {f(s, 1)} and the level at 0 catches everything within {f(s / 2, 1)} of zero.",
        "That is every ordinary value: the largest of these 4,095 is " + f(float(np.abs(xs).max()), 1)
        + ". All of them are stored as 0, so the error on each is the whole value, 100% of a typical "
        "activation, against about 12% for the weights of {{fig:v04-o044}}. The format keeps the outlier "
        "and erases the data.",
    ])
    b.append(body)
    emit("o045", st("Now take those same 16 values"), "The same budget, set against activations", y + 26, b,
         "Identical format, identical bit budget, opposite outcome. The difference is entirely in the data.")


# ---- o046 and o047: prose ------------------------------------------------------------------------------
def o046():
    reprose("o046", 290, [
        "A token's activation is a long list of numbers. Channel 8 means the eighth entry, and there is "
        "one of those for every token that passes through.",
        "So a channel is a column, not a row. When a later figure says the outliers sit in a few fixed "
        "channels, it means the same handful of columns run large no matter what the text is.",
    ], caption="The word appears constantly and means something quite specific: a column, not a row. For "
               "weights a scale per channel is easy. For activations the channel is the direction a matrix "
               "multiply adds along, which is why giving them one takes a detour ({{ref:v04-o064}}).")


def o047():
    reprose("o047", 250, [
        "Tim Dettmers and colleagues mapped these outlier features in the LLM.int8() paper. A few "
        "positions in the activation vector carry values far larger than the rest, and they are the same "
        "positions for every token.",
        "They appear abruptly, in what the paper calls a phase shift, at about 6.7 billion parameters, and "
        "from there they show up in every layer.",
    ], caption="This structure is what makes outliers tractable. Scattered at random they would offer "
               "nothing to plan for; sitting in fixed channels, they can be handled by the same correction "
               "every time, decided in advance.")


# ---- o048: a tenth of a percent, counted -----------------------------------------------------------------
def o048():
    width, outl = 4096, 6
    share = outl / width
    assert round(100 * share, 2) == 0.15
    W = 390
    true_px = W * share
    assert true_px < 1
    b = [text(40, 78, "All channels", "cap")]
    b.append(cell(230, 62, W, 32, "u", label=f"{fi(width)} in the 6.7B model"))
    b.append(text(40, 138, "The outlier channels", "cap"))
    b.append(rect(230, 122, 2, 32, "h", rx=1))
    b.append(text(244, 141, f"six of them, {f(100 * share, 2)}%", "sub2"))
    body, y = prose(200, [
        "At 6.7 billion parameters with a sequence length of 2,048, roughly 150,000 outliers appear per "
        f"sequence, concentrated in just six of the model's {fi(width)} channels: {f(100 * share, 2)}%, "
        "which the paper calls about a tenth of a percent of all features.",
        "Yet zero those six out and the model falls apart: the top token's share of attention drops by "
        "more than 20%, and perplexity worsens by 600 to 1,000% ({{fig:v04-o049}}). Zero six channels "
        "chosen at random instead and perplexity worsens by about 0.1%.",
    ])
    b.append(body)
    emit("o048", st("At that scale, with a sequence length of"), "A tenth of a percent that cannot be dropped",
         y + 26, b,
         "Simultaneously negligible in count and indispensable in function, which is why you cannot simply "
         f"clip them away. The short bar is drawn at the narrowest visible width; to scale it would be "
         f"{f(true_px, 1)} of a pixel.")


# ---- p15: perplexity, worked -------------------------------------------------------------------------------
def p15():
    ps = [0.5, 0.25, 0.1, 0.8]
    nll = [-math.log(p) for p in ps]
    mean = sum(nll) / 4
    ppl = math.exp(mean)
    geo = (math.prod(1 / p for p in ps)) ** 0.25
    assert [round(v, 3) for v in nll] == [0.693, 1.386, 2.303, 0.223]
    assert round(mean, 3) == 1.151 and round(ppl, 2) == 3.16 and abs(ppl - geo) < 1e-12
    assert math.prod(1 / p for p in ps) == 100.00000000000001 or round(math.prod(1 / p for p in ps)) == 100
    b = [hd(40, 46, "Four next tokens, and the probability the model gave each true one")]
    cols = [40, 160, 290, 420]
    for c, h in zip(cols, ["token", "probability p", "−ln p", "1 ÷ p"]):
        b.append(text(c, 84, h, "sub2"))
    for r, (p, v) in enumerate(zip(ps, nll)):
        y = 96 + r * 32
        b.append(text(cols[0], y + 18, f"token {r + 1}", "cap"))
        b.append(text(cols[1], y + 18, f"{p:g}", "sub2"))
        b.append(cell(cols[2], y, 76, 26, "m", label=f(v, 3)))
        b.append(text(cols[3], y + 18, f"{1 / p:g}", "sub2"))
    yt = 96 + 4 * 32 + 10
    steps = [("average of −ln p", f"({' + '.join(f(v, 3) for v in nll)}) ÷ 4  =  {f(sum(nll), 3)} ÷ 4  =  {f(mean, 3)}", "u"),
             ("perplexity", f"e to the {f(mean, 3)}  =  {f(ppl, 2)}", "s")]
    for k, (lab, s, c) in enumerate(steps):
        y = yt + k * 50
        b.append(text(40, y + 26, lab, "sub2"))
        b.append(box(200, y, 440, 40, c, s))
    body, y = prose(yt + 2 * 50 + 34, [
        "A model's output is a probability for every possible next token ({{fig:v01-o009}}). Perplexity "
        "asks how much it gave the token that actually came next. Take −ln of each such probability, "
        "average them, and raise e to the result.",
        f"Here that is {f(ppl, 2)}, the same as the four values of 1 ÷ p multiplied together, "
        + nb("2 × 4 × 10 × 1.25 = 100") + ", and fourth-rooted. Read it as the number of equally likely options the model was "
        "choosing between: a model that always gave the true token 0.5 would score exactly 2, one that "
        "gave it 0.1 would score 10.",
        "So a perplexity of 10 worsened by 600% is 70: as unsure as picking among seventy options.",
    ])
    b.append(body)
    emit("p15", st("perplexity, the standard measure"), "Perplexity, worked on four tokens", y + 26, b,
         "One number for how surprised the model is by real text, on a multiplying scale. That is why "
         "its changes are quoted as percentages, and why 600% means collapse, not drift.")


if __name__ == "__main__":
    for fn in (o045, o046, o047, o048, p15):
        fn()
