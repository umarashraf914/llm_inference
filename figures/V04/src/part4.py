"""V4 Part 4, why a trained network survives rounding: review entry 13 (p13), the merge of Figs 41 and 42
into o041, Fig 43 with its bars drawn to scale, and Fig 44 with measured numbers. The coin-toss widget
(entry 14, p14) is in part4_coins.py.

  python3 figures/V04/src/part4.py
"""
import math
import numpy as np
from common import emit, hd, cell, box, eq, ln, arr, prose, text, tick, hline, dot, rect, poly, f, fi, nb, MINUS, st


# ---- o041: what rounding error is (Figs 41 and 42 merged) ------------------------------------------------
def o041():
    b = [hd(40, 46, "Rounding to the nearest available value")]
    L, R, Y = 70, 610, 110
    step = (R - L) / 8
    b.append(hline(L, R, Y))
    for k in range(9):
        b.append(tick(L + k * step, Y - 9, Y + 9))
    true_x = L + 3.38 * step
    land = L + 3 * step
    b.append(rect(true_x - 3, Y - 14, 6, 28, "h", rx=1))
    b.append(text(true_x + 6, Y - 22, "the true value", "sub2"))
    b.append(arr(true_x - 6, Y + 30, land + 4, Y + 30))
    b.append(text(land - 6, Y + 50, "lands on the nearest tick", "sub2"))
    b.append(text(L + 4.5 * step, Y + 34, "one step", "sub2", "middle"))
    b.append(ln(L + 4 * step, Y + 16, L + 5 * step, Y + 16, "tick"))
    body, y = prose(Y + 90, [
        "The ticks are the only values the format can hold. Anything between them moves to the nearest "
        "one, and the distance it moves is the rounding error.",
        "Four properties follow. The error is at most half a step. It is as likely to go up as down, so "
        "it averages to zero, ties included ({{fig:v04-p05}}). Across many weights it is spread evenly "
        "between minus and plus half a step. And each weight's error has nothing to do with its "
        "neighbours', because where a weight falls between two ticks has nothing to do with where they do.",
        "The whole argument for why squeezing a model into fewer bits survives at all rests on these four.",
    ])
    b.append(body)
    emit("o041", st("and rounding nudges each one"), "What rounding error is", y + 26, b,
         "Small, bounded, zero-mean and independent. The next three figures spend all four.")


# ---- p13: one rounded weight moves the output by its error times its input -----------------------------
def p13():
    ws = [0.31, -0.72, 0.18, 0.55]
    xs = [1.0, 0.5, 2.0, -1.5]
    grid = 0.25
    wr = [round(w / grid) * grid for w in ws]
    e = [a - w for a, w in zip(wr, ws)]
    ex = [a * x for a, x in zip(e, xs)]
    y0 = sum(w * x for w, x in zip(ws, xs))
    y1 = sum(w * x for w, x in zip(wr, xs))
    assert wr == [0.25, -0.75, 0.25, 0.5] and [round(v, 3) for v in e] == [-0.06, -0.03, 0.07, -0.05]
    assert [round(v, 4) for v in ex] == [-0.06, -0.015, 0.14, 0.075]
    assert round(y0, 4) == -0.515 and round(y1, 4) == -0.375 and round(y1 - y0, 4) == round(sum(ex), 4) == 0.14
    assert round(sum(abs(v) for v in ex), 4) == 0.29
    b = [hd(40, 46, "One output, four weights, each rounded to the nearest 0.25")]
    cols = [40, 140, 240, 350, 460, 570]
    heads = ["input x", "weight w", "rounded", "error e", "e × x", ""]
    for c, h in zip(cols, heads):
        if h:
            b.append(text(c, 84, h, "sub2"))
    for r in range(4):
        y = 96 + r * 36
        b.append(text(cols[0], y + 19, f(xs[r], 1), "cap"))
        b.append(text(cols[1], y + 19, f(ws[r], 2), "sub2"))
        b.append(text(cols[2], y + 19, f(wr[r], 2), "sub2"))
        b.append(text(cols[3], y + 19, ("+" if e[r] > 0 else "") + f(e[r], 2), "sub2"))
        b.append(cell(cols[4], y, 76, 26, "h" if r == 2 else "m",
                      label=("+" if ex[r] > 0 else "") + f(ex[r], 3)))
    yt = 96 + 4 * 36 + 12
    b.append(ln(cols[4], yt - 6, cols[4] + 76, yt - 6, "tick"))
    b.append(text(cols[4], yt + 14, f"sum  +{f(sum(ex), 2)}", "sub2"))
    b.append(text(40, yt + 14, f"output  {f(y0, 3)}  becomes  {f(y1, 3)}", "sub2"))
    b.append(eq(150, yt + 36, 380, "(w + e) × x   =   w × x   +   e × x", "u"))
    body, y = prose(yt + 112, [
        "A layer's output is a weighted sum, each input times its weight, added up ({{fig:v01-o005}}). "
        "Round a weight and it becomes w + e, and multiplying out shows exactly what changes: the "
        "output gains e × x, the weight's error times the input it multiplies, and nothing else.",
        "So an error matters in proportion to its input. The third weight's error, 0.07, is the biggest "
        "push because its input is 2.0; the second's, 0.03, is halved by an input of 0.5. The four "
        "pushes add up to 0.29 in size, but they point both ways and the output moves by only 0.14.",
        "Two later methods are built on this one line. GPTQ uses it to decide how to compensate for "
        "each rounding, and AWQ to decide which weights to protect.",
    ])
    b.append(body)
    emit("p13", st("nudges each one up or down"), "Rounding one weight moves the output by its error times its input",
         y + 26, b,
         "The distributive law is the whole mechanism. Every method later in this atlas is a different "
         "way of making these error-times-input pushes small, or making them cancel.")


# ---- o043: independent against correlated, to scale ------------------------------------------------------
def o043():
    n = 4096
    ind, cor = math.sqrt(n), n
    assert ind == 64
    b = [hd(40, 46, "Independent errors"), hd(370, 46, "Correlated errors")]
    b.append(hline(70, 340, 106))
    ups = [1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0]
    for k, u in enumerate(ups):
        x = 80 + 25 * k
        b.append(arr(x, 106, x, 86 if u else 126))
    b.append(hline(400, 640, 106))
    for k in range(10):
        x = 410 + 25 * k
        b.append(arr(x, 106, x, 84))
    W = 300
    px = W / cor
    b.append(text(40, 186, f"Total error in a layer with {fi(n)} inputs, to scale", "hd"))
    b.append(text(40, 220, "independent", "cap"))
    b.append(rect(170, 204, max(ind * px, 1), 24, "s", rx=1))
    b.append(text(170 + ind * px + 10, 221, f"about {fi(ind)} units, √{fi(n)}", "sub2"))
    b.append(text(40, 258, "correlated", "cap"))
    b.append(rect(170, 242, cor * px, 24, "h", rx=2))
    b.append(text(170 + cor * px + 10, 259, f"{fi(cor)} units", "sub2"))
    body, y = prose(306, [
        "The unit is one term's typical error: a weight's rounding error times its input "
        "({{fig:v04-p13}}). Inside a weighted sum of n terms, independent errors partly cancel and the "
        "total grows like the square root of n ({{fig:v04-p14}}). Correlated errors all push the same "
        "way and the total grows like n.",
        f"For {fi(n)} inputs that is {fi(ind)} units against {fi(cor)}, a factor of {fi(cor / ind)}, from "
        "nothing but whether the errors happen to agree. Rounding produces independent errors, and that "
        "is why quantization is survivable. The bars are to scale: the short one is "
        f"{f(ind * px, 1)} pixels long.",
    ])
    b.append(body)
    emit("o043", st("Inside the network's long weighted sums"), "Why the errors do not accumulate", y + 26, b,
         "The square root is doing all the work. Had every nudge pushed the same way they would pile up "
         "and break the model.")


# ---- o044: sixteen values, well spent, with the numbers ----------------------------------------------------
def o044():
    rng = np.random.default_rng(0)
    G, N = 20000, 128
    w = rng.standard_normal((G, N))
    s = np.abs(w).max(axis=1, keepdims=True) / 7
    q = np.clip(np.rint(w / s), -7, 7)
    rms = float(np.sqrt(((q * s - w) ** 2).mean()))
    zero = float((q == 0).mean())
    mean_max = float(np.abs(w).max(axis=1).mean())
    assert round(rms, 2) == 0.12 and round(zero, 2) == 0.16 and 2.7 < mean_max < 2.9
    b = [hd(40, 46, "A group of 128 bell-shaped weights against INT4's levels")]
    L, R, Y = 60, 620, 216
    M = mean_max
    X = lambda v: (L + R) / 2 + v / M * (R - L) / 2
    pts = []
    for k in range(0, 201):
        v = -M + 2 * M * k / 200
        pts.append((X(v), Y - 18 - 110 * math.exp(-0.5 * v * v)))
    b.append(poly(pts, "pl-m"))
    b.append(hline(L, R, Y))
    sm = M / 7
    for k in range(-7, 8):
        b.append(tick(X(k * sm), Y - 9, Y + 9))
    b.append(text(X(-M), Y + 26, MINUS + "max", "sub2", "middle"))
    b.append(text(X(0), Y + 26, "0", "sub2", "middle"))
    b.append(text(X(M), Y + 26, "max", "sub2", "middle"))
    b.append(text(X(0), Y - 138, "most weights", "sub2", "middle"))
    body, y = prose(Y + 64, [
        "Fifteen levels from −7 to 7, the sixteenth code left unused as in {{fig:v04-p08}}, and the "
        "scale set by the group's largest weight, about "
        f"{f(M, 1)} typical weights from zero for a group of 128. Nearly all of them land where the "
        "weights actually live, because the weights crowd into the middle of the range.",
        f"Measured on {fi(G)} such groups, the rounding error is about {pct(rms, 0)} of a typical weight "
        f"(its rms, {{{{fig:v04-p14}}}}), and {pct(zero, 0)} of the weights, those within half a step of "
        "zero, round to exactly 0. Errors that size, independent and cancelling, are what the previous "
        "figures showed a network can absorb.",
    ])
    b.append(body)
    emit("o044", st("with just 16 distinct values"), "Sixteen values, well spent", y + 26, b,
         "This is the good case, and it is why four-bit weights work: the errors are about an eighth of "
         "a typical weight, and they cancel. The next figure takes the same sixteen values to the "
         "activations.")


def pct(v, d=0):
    return f(100 * v, d) + "%"


if __name__ == "__main__":
    for fn in (o041, p13, o043, o044):
        fn()
