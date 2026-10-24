"""V6 Part 2, why models grow: Fig 04 (o004) rebuilt with real losses, P3 (the gradient as a slope),
Fig 05 (o005) rebuilt as P4 (a power law on log-log axes), P5 (Chinchilla), Fig 06 (o006) with its numbers.

Sources, read for this build: Kaplan et al. 2020 (arXiv 2001.08361) eq. 1.1, Table 1 and §2.1;
Hoffmann et al. 2022 (arXiv 2203.15556) Table 1 and §1; NVIDIA's H100 SXM specification page.

  python3 figures/V06/src/growth.py      writes o004, p03, o005, p05, o006 in figures/V06/items/
"""
import math
from common import (H100, at, cell, dashed, emit, f, hd, ln, n, nb, prose, rect, txt)


def poly(pts, cls="pl-m"):
    return f'<polyline class="{cls}" points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in pts)}"/>'


def dot(x, y, cls="h"):
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4" fill="var(--paper)" stroke="var(--{cls})" stroke-width="1.5"/>'


# ---- Fig 04: what loss is, with the numbers -------------------------------------------------------
CASES = [("confident and right, p = 0.9", 0.9, "s"), ("right, but hesitant, p = 0.3", 0.3, "m"),
         ("expected something else, p = 0.02", 0.02, "h")]


def o004():
    b = [hd(40, 46, "The loss for one prediction is −ln p, where p is what the right token got")]
    SC = 260 / max(-math.log(p) for _, p, _ in CASES)          # px per unit of loss
    X0 = 270
    for k, (lab, p, c) in enumerate(CASES):
        y = 72 + k * 46
        L = -math.log(p)
        b.append(txt(40, y + 19, lab, "cap"))
        b.append(rect(X0, y, L * SC, 28, c))
        b.append(txt(X0 + L * SC + 10, y + 19, f"−ln {p:g} = {f(L)}", "sub2"))
    assert [f(-math.log(p)) for _, p, _ in CASES] == ["0.11", "1.20", "3.91"]
    body, y = prose(240, [
        "A model's output is a probability for every token it knows ({{fig:v01-o009}}). Once the real "
        "next token is known, the loss looks only at the probability p the model gave that token, and "
        "charges −ln p for it.",
        f"ln is the natural logarithm: the power e must be raised to. A certain, correct guess, {nb('p = 1')}, "
        f"costs {nb('ln 1 = 0')}. Below one the logarithm is negative, so the minus sign makes the charge "
        f"positive, and every halving of p adds ln 2 = {f(math.log(2))}: the penalty climbs steeply as p "
        "falls toward zero.",
        "Averaged over every token of a text, this is the loss a training run reports, and the number "
        "the scaling laws below predict. Training means nudging every weight in whichever direction "
        "makes it smaller.",
    ])
    emit("o004", at("measured how a language model's loss"), "Loss is −ln of the probability the right token got",
         y + 32, b + [body],
         "Bars drawn to scale. The loss says how wrong the model was, not which weights to change; that "
         "is what the gradient in the next figure is for.")


# ---- P3: a gradient is a slope ---------------------------------------------------------------------
loss = lambda w: (w - 3) ** 2 + 1            # a toy loss with its lowest point at w = 3
slope = lambda w: 2 * (w - 3)                # its slope, the limit of rise over run
RATE = 0.1


def p03():
    b = [hd(40, 46, "A toy loss with one weight: the slope says which way is down, and how steeply")]
    L, R, T, B = 80, 400, 76, 276                     # plot box: w from 0 to 5, loss from 0 to 10
    px = lambda w: L + w / 5 * (R - L)
    py = lambda v: B - v / 10 * (B - T)
    b.append(ln(L, B, R, B, "axis"))
    b.append(ln(L, T, L, B, "axis"))
    for w in range(6):
        b.append(ln(px(w), B, px(w), B + 4, "tick"))
        b.append(txt(px(w), B + 18, str(w), "sub2", "middle"))
    for v in (0, 5, 10):
        b.append(txt(L - 8, py(v) + 4, str(v), "sub2", "end"))
    b.append(txt((L + R) / 2, B + 38, "the weight, w", "sub2", "middle"))
    b.append(txt(L + 6, T - 8, "loss", "sub2"))
    b.append(poly([(px(w), py(loss(w))) for w in [i / 20 for i in range(0, 101)]], "pl-m"))
    for w in (1, 2, 3):                               # the line that just touches the curve
        a, c = w - 0.8, w + 0.8
        b.append(f'<line class="mark" x1="{px(a):.1f}" y1="{py(loss(w) + slope(w) * (a - w)):.1f}" '
                 f'x2="{px(c):.1f}" y2="{py(loss(w) + slope(w) * (c - w)):.1f}"/>')
        b.append(dot(px(w), py(loss(w))))
    # labels sit on the empty side of each point: below-left of the falling tangents, above the floor
    b.append(txt(px(1) + 10, py(loss(1)) + 4, "slope −4", "sub2 halo"))
    b.append(txt(px(2) - 10, py(loss(2)) + 20, "slope −2", "sub2 halo", "end"))
    b.append(txt(px(3), py(loss(3)) - 14, "slope 0", "sub2 halo", "middle"))
    # the table: one step of training from each point
    X = [450, 490, 535, 585, 630]
    for x, h in zip(X, ["w", "loss", "slope", "step", "new w"]):
        b.append(txt(x, 92, h, "sub2", "middle"))
    for k, w in enumerate((1, 2, 3)):
        y = 122 + k * 34
        st = -RATE * slope(w) + 0.0                   # + 0.0 turns −0.0 into 0.0
        row = [f"{w}", f"{loss(w):g}", f"{slope(w):g}".replace("-", "−"),
               f"{st:+.1f}".replace("-", "−") if st else "0", f"{w + st:.1f}"]
        for x, v in zip(X, row):
            b.append(txt(x, y, v, "sub2", "middle"))
    b.append(txt(450, 232, "step = −0.1 × slope", "sub2"))
    assert (loss(1), slope(1), 1 - RATE * slope(1), loss(1 - RATE * slope(1))) == (5, -4, 1.4, 3.5600000000000005)
    r = (loss(1.01) - loss(1)) / 0.01
    assert round(r, 2) == -3.99
    body, y = prose(B + 80, [
        "The slope of a straight line is rise over run. The slope of a curve at a point is the slope of "
        f"the straight line that just touches it there. Nudge w from 1 to 1.01 and the loss goes from "
        f"{loss(1):g} to {loss(1.01):.4f}: a rise of {loss(1.01) - loss(1):.4f} over a run of 0.01, slope "
        f"{r:.2f}. Smaller nudges close in on −4.".replace("-", "−"),
        "A gradient is that slope taken for each weight in turn, with all the others held still. A model "
        "has billions of weights, so its gradient is billions of slopes, all computed together by the "
        "backward pass ({{fig:v03-o060}}).",
        "Training then steps every weight against its slope: new w = w − rate × slope. A negative slope "
        "means the loss falls to the right, so w moves right; a steeper slope moves it further; at the "
        f"bottom the slope is 0 and w stays put. From w = 1, one step of rate {RATE:g} lands at 1.4 and the "
        f"loss drops from {loss(1):g} to {loss(1.4):.2f}.",
    ])
    emit("p03", at("the error it makes predicting the next token"),
         "A gradient is a slope: which way to nudge one weight, and how hard", y + 32, b + [body],
         "Everything later figures need: a gradient points each weight downhill on the loss. Load "
         "balancing adds a second term to the loss, and with it a second slope pulling on the same weights.")


# ---- Fig 05 rebuilt as P4: a power law is a straight line on log-log axes ---------------------------
A_N, N_C = 0.076, 8.8e13                       # Kaplan et al. 2020, eq. 1.1 (non-embedding parameters)
Lk = lambda N: (N_C / N) ** A_N
NS = [1e9, 1e10, 1e11, 1e12]


def o005():
    b = [hd(40, 46, "The same four models, drawn on ordinary axes and on logarithmic axes")]
    T, B = 92, 252
    # left: linear axes
    L1, R1 = 76, 316
    x1 = lambda N: L1 + N / 1e12 * (R1 - L1)
    y1 = lambda v: B - v / 2.5 * (B - T)
    b.append(txt(L1, 74, "ordinary axes", "sub2"))
    b.append(ln(L1, B, R1, B, "axis"))
    b.append(ln(L1, T, L1, B, "axis"))
    for N, lab in [(0, "0"), (5e11, "500 B"), (1e12, "1 T")]:
        b.append(ln(x1(N), B, x1(N), B + 4, "tick"))
        b.append(txt(x1(N), B + 18, lab, "sub2", "middle"))
    for v in (0, 1, 2):
        b.append(txt(L1 - 8, y1(v) + 4, str(v), "sub2", "end"))
    pts = [10 ** (9 + i / 40) for i in range(121)]
    b.append(poly([(x1(N), y1(Lk(N))) for N in pts]))
    for N in NS:
        b.append(dot(x1(N), y1(Lk(N))))
    b.append(txt(x1(1e12) - 4, y1(Lk(1e12)) + 22, f(Lk(1e12)), "sub2 halo", "end"))
    b.append(txt(x1(1e9) + 12, y1(Lk(1e9)) - 2, f"{f(Lk(1e9))} at 1 B", "sub2 halo"))
    # right: log-log axes
    L2, R2 = 410, 640
    x2 = lambda N: L2 + (math.log10(N) - 9) / 3 * (R2 - L2)
    lo, hi = math.log10(1.25), math.log10(2.6)
    y2 = lambda v: B - (math.log10(v) - lo) / (hi - lo) * (B - T)
    b.append(txt(L2, 74, "logarithmic axes", "sub2"))
    b.append(ln(L2, B, R2, B, "axis"))
    b.append(ln(L2, T, L2, B, "axis"))
    for N, lab in zip(NS, ["1 B", "10 B", "100 B", "1 T"]):
        b.append(ln(x2(N), B, x2(N), B + 4, "tick"))
        b.append(txt(x2(N), B + 18, lab, "sub2", "middle"))
    for v in (1.5, 2.0, 2.5):
        b.append(ln(L2 - 4, y2(v), L2, y2(v), "tick"))
        b.append(txt(L2 - 8, y2(v) + 4, f"{v:g}", "sub2", "end"))
    b.append(poly([(x2(N), y2(Lk(N))) for N in pts]))
    for N in NS:
        b.append(dot(x2(N), y2(Lk(N))))
        b.append(txt(x2(N) + 8, y2(Lk(N)) - 9, f(Lk(N)), "sub2 halo"))
    b.append(txt((L1 + R1) / 2, B + 38, "parameters", "sub2", "middle"))
    b.append(txt((L2 + R2) / 2, B + 38, "parameters", "sub2", "middle"))
    ratio = 10 ** -A_N
    assert [f(Lk(N)) for N in NS] == ["2.38", "1.99", "1.67", "1.41"]
    assert all(abs(Lk(N * 10) / Lk(N) - ratio) < 1e-12 for N in NS[:3])
    body, y = prose(B + 80, [
        "In 2020 Kaplan and colleagues measured how a language model's loss falls as the model, the "
        "data and the training compute grow. Against model size it follows "
        f"{nb(f'L = (8.8 × 10¹³ / N)^{A_N}')}, for N parameters outside the embedding table and the loss "
        "of {{fig:v06-o004}}.",
        f"That is a power law: every tenfold step in N multiplies the loss by the same factor, "
        f"10^−{A_N} = {ratio:.2f}, a {pct_s(1 - ratio)} cut, and every doubling by 2^−{A_N} = "
        f"{2 ** -A_N:.2f}. On ordinary axes the curve plunges and flattens, and the small models crowd "
        "against the left edge.",
        f"Take logarithms of both sides and log L = {A_N} × log(8.8 × 10¹³) − {A_N} × log N: a straight "
        f"line in log N, falling with slope −{A_N} ({{{{fig:v01-o121}}}}). A straight line can be extended, so the loss of a model ten "
        "times larger can be forecast before anything is spent building it. Data and compute follow "
        "power laws of the same shape, with exponents of their own.",
    ])
    emit("o005", at("It falls as a power law"), "Loss falls as a power law, a straight line on log–log axes",
         y + 32, b + [body],
         "Predictability is what makes the spend rational. If ten times the parameters reliably buys a "
         "16% lower loss, the parameter count keeps climbing.")


def pct_s(v):
    return f"{100 * v:.0f}%"


# ---- P5: Chinchilla ----------------------------------------------------------------------------------
GOPHER = dict(N=280e9, D=300e9)                # Hoffmann et al. 2022, Table 1
CHIN = dict(N=70e9, D=1.4e12)                  # Hoffmann et al. 2022, §1
C6 = lambda m: 6 * m["N"] * m["D"]


def p05():
    b = [hd(40, 46, "Gopher and Chinchilla, given about the same compute, drawn to scale")]
    X0, W = 230, 360
    rows = [("parameters", "N", 1e9, "billion"), ("training tokens", "D", 1e9, "billion")]
    y = 70
    for lab, key, unit, word in rows:
        big = max(GOPHER[key], CHIN[key])
        b.append(txt(40, y + 14, lab, "hd"))
        for name, m, c in (("Gopher", GOPHER, "u"), ("Chinchilla", CHIN, "s")):
            y += 24
            w = m[key] / big * W
            b.append(txt(40, y + 17, name, "cap"))
            b.append(rect(X0, y, w, 24, c))
            b.append(txt(X0 + w + 10, y + 17, f"{m[key] / unit:,.0f} {word}", "sub2"))
            y += 10
        y += 28
    b.append(txt(40, y + 14, "6 × N × D, operations to train", "hd"))
    big = max(C6(GOPHER), C6(CHIN))
    for name, m, c in (("Gopher", GOPHER, "u"), ("Chinchilla", CHIN, "s")):
        y += 24
        w = C6(m) / big * W
        b.append(txt(40, y + 17, name, "cap"))
        b.append(rect(X0, y, w, 24, c))
        b.append(txt(X0 + w + 10, y + 17, f"{C6(m) / 1e23:.1f} × 10²³", "sub2"))
        y += 10
    tpp_g, tpp_c = GOPHER["D"] / GOPHER["N"], CHIN["D"] / CHIN["N"]
    assert round(CHIN["D"] / GOPHER["D"], 1) == 4.7 and GOPHER["N"] / CHIN["N"] == 4 and round(tpp_c) == 20
    body, yy = prose(y + 60, [
        "Training costs about 6 operations per parameter per token: 2 to run each weight forward "
        "({{fig:v01-o114}}) and about twice that again for the backward pass that finds the gradient "
        "({{fig:v03-o060}}). So a run's compute is about 6 × N × D, for N parameters and D tokens.",
        "In 2022 DeepMind's Chinchilla paper held that budget fixed and asked how to split it. Its answer "
        "was to grow the model and its data together. Chinchilla has a quarter of Gopher's parameters, "
        f"trained on {CHIN['D'] / GOPHER['D']:.1f} times the tokens, and beat it: {tpp_c:.0f} tokens per "
        f"parameter, against Gopher's {tpp_g:.1f}.",
        "6 × N × D puts the two runs within a sixth of each other; the paper's fuller count gives Gopher "
        "5.76 × 10²³, the budget Chinchilla was matched to. Many models of that era turned out to be "
        "oversized for the data they were fed.",
    ])
    emit("p05", at("the Chinchilla paper"), "Chinchilla: a quarter of the parameters, 4.7 times the data, the same budget",
         yy + 32, b + [body],
         "A correction to the recipe, not to its direction: fed enough data, a bigger model's loss still "
         "falls on the line, and that predictability keeps pushing parameter counts up.")


# ---- Fig 06: the punishment for growing, with numbers -----------------------------------------------
HELD = 671e9


def o006():
    b = [hd(40, 46, "Growth runs straight into the memory wall")]
    b.append(cell(40, 70, 600, 26, "h", label="HBM, the high-bandwidth memory beside the chip"))
    b.append(f'<line class="conn" x1="200" y1="100" x2="200" y2="130" marker-end="url(#arw)"/>')
    b.append(cell(150, 134, 380, 40, "u", label="the arithmetic units"))
    b.append(txt(150, 198, "every weight read out and streamed across the bus, once per token", "sub2"))
    read = HELD * 1 / H100["bw"]                     # FP8: one byte a weight
    work = 2 * HELD / H100["fp8"]
    b.append(hd(40, 248, "One token of a dense 671-billion-parameter model, to scale"))
    X0, W = 230, 380
    b.append(txt(40, 286, "reading 671 GB", "cap"))
    b.append(rect(X0, 268, W, 28, "h"))
    b.append(txt(X0 + W - 10, 316, f"{read * 1e3:.0f} ms at 3.35 TB/s", "sub2", "end"))
    b.append(txt(40, 352, "1,342 billion operations", "cap"))
    w = work / read * W
    b.append(rect(X0, 334, max(w, 1), 28, "m"))
    b.append(txt(X0 + 12, 352, f"{work * 1e3:.2f} ms, {100 * work / read:.2f}% of the time", "sub2"))
    assert round(read * 1e3) == 200 and round(work * 1e3, 2) == 0.68 and work / read < 0.01
    body, y = prose(408, [
        "At decode, producing each new token means reading every weight out of HBM and across the memory "
        f"bus ({{{{fig:v01-o105}}}}). For 671 billion weights at one byte each, an H100's {nb('3.35 TB/s')} needs "
        f"{read * 1e3:.0f} ms. The arithmetic is two operations per weight, which the same chip does at "
        f"1,979 trillion a second in FP8: {work * 1e3:.2f} ms. Arithmetic is under 1% of each token's "
        "time, as {{fig:v01-o129}} found; the pace is set by the reading.",
        "Splitting the model over many chips shrinks both bars together and leaves their ratio alone. "
        "And in a dense model the amount to read is the whole model, so time per token grows in "
        "lockstep with the parameter count.",
    ])
    emit("o006", at("runs straight into the memory wall"), "The punishment for growing", y + 32, b + [body],
         "The arithmetic bar is under two pixels long. The growth that scaling laws reward is exactly what "
         "the memory wall punishes: every parameter added makes every token slower to produce.")


if __name__ == "__main__":
    for fn in (o004, p03, o005, p05, o006):
        fn()
