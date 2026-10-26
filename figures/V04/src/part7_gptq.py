"""V4 Part 7, GPTQ built from "error times input": review entries 18, 20 and 21 (p18, p20, p21), Fig 61
cut down to calibration only, and the prose of Figs 59, 60 and 63 corrected. The parabola widget,
entry 19, is part7_parabola.py; the chain is p13 -> p14 -> p18 -> p19 -> p20.

Sources read: Frantar, Ashkboos, Hoefler and Alistarh, "GPTQ" (ICLR 2023): H_F = 2 X_F X_F^T, the
update delta_F, 128 random 2,048-token C4 segments, about four GPU hours for 175B, Table 3's
round-to-nearest rows, and the single-A100 OPT-175B run at 3 bits (about 63 GB + 9 GB cache).

  python3 figures/V04/src/part7_gptq.py
"""
import math
import numpy as np
from common import emit, hd, cell, box, eq, ln, arr, prose, text, tick, hline, dot, rect, poly, f, fi, nb, MINUS, st
from fixes import reprose
from part7_parabola import calibration, averages

E1 = -0.4                                    # weight 1 is 0.4, rounded down to 0 on a grid of whole numbers


# ---- p18: two weights fed the same input --------------------------------------------------------------
def p18():
    xs = [1.0, 2.0, -1.0, 0.5]
    w = 0.4
    rtn = [round(w), round(w)]
    nudge = -E1 * 1.0                        # identical inputs: avg(x1 x2) / avg(x2^2) = 1
    w2 = w + nudge
    gptq = [round(w), round(w2)]
    err_rtn = [(rtn[0] - w + rtn[1] - w) * x for x in xs]
    err_gq = [(gptq[0] - w + gptq[1] - w) * x for x in xs]
    ms_rtn = sum(e * e for e in err_rtn) / 4
    ms_gq = sum(e * e for e in err_gq) / 4
    assert rtn == [0, 0] and gptq == [0, 1] and round(w2, 10) == 0.8
    assert round(ms_rtn, 10) == 1.0 and round(ms_gq, 10) == 0.0625 and round(ms_rtn / ms_gq) == 16
    b = [hd(40, 46, "Two weights of 0.4, rounded to whole numbers; the two inputs are always equal")]
    panels = [(40, "Round both to the nearest", [(w, None, 0)], [(w, None, 0)]),
              (360, "GPTQ: round one, nudge the other", [(w, None, 0)], [(w, w2, 1)])]
    for x0, title, r1, r2 in panels:
        b.append(text(x0, 82, title, "sub2"))
        X = lambda v, x0=x0: x0 + 40 + (v + 0.2) / 1.4 * 230
        for k, (lab, rows) in enumerate([("w₁", r1), ("w₂", r2)]):
            y = 118 + k * 56
            b.append(text(x0, y + 4, lab, "cap"))
            b.append(hline(X(-0.2), X(1.2), y))
            for g in (0, 1):
                b.append(tick(X(g), y - 8, y + 8))
                b.append(text(X(g), y + 24, str(g), "sub2", "middle"))
            for start, mid, end in rows:
                b.append(dot(X(start), y, 4.5, "m"))
                if mid is None:
                    b.append(arr(X(start) - 7, y - 14, X(end) + 6, y - 14))
                else:
                    b.append(arr(X(start) + 7, y - 14, X(mid) - 5, y - 14))
                    b.append(dot(X(mid), y, 4, "s"))
                    b.append(arr(X(mid) + 6, y - 14, X(end) - 6, y - 14))
        b.append(text(x0, 230, "w₂ nudged to 0.8, then rounded" if x0 > 300 else "both errors −0.4", "sub2"))
    ty = 270
    cols = [40, 200, 270, 340, 410, 520]
    b.append(text(cols[0], ty, "calibration input x", "cap"))
    for j, x in enumerate(xs):
        b.append(text(cols[1 + j], ty, f"{x:g}".replace("-", MINUS), "sub2", "middle"))
    b.append(text(cols[5], ty, "mean square", "sub2"))
    for k, (lab, errs, ms) in enumerate([("output error, nearest", err_rtn, ms_rtn),
                                         ("output error, GPTQ", err_gq, ms_gq)]):
        y = ty + 26 + k * 24
        b.append(text(cols[0], y, lab, "cap"))
        for j, e in enumerate(errs):
            b.append(text(cols[1 + j], y, ("+" if e > 0 else "") + f(e, 1), "sub2", "middle"))
        b.append(text(cols[5], y, f(ms, 4).rstrip("0").rstrip("."), "sub2"))
    yb = ty + 26 + 2 * 24 + 22
    b.append(text(40, yb + 17, "nearest", "cap"))
    b.append(rect(150, yb, 300, 24, "h", rx=2))
    b.append(text(460, yb + 17, "1", "sub2"))
    b.append(text(40, yb + 51, "GPTQ", "cap"))
    b.append(rect(150, yb + 34, 300 * ms_gq / ms_rtn, 24, "s", rx=2))
    b.append(text(150 + 300 * ms_gq / ms_rtn + 10, yb + 51, "0.0625, 16 times smaller", "sub2"))
    body, y = prose(yb + 100, [
        "The output is w₁ × x₁ + w₂ × x₂, and here x₂ always equals x₁. So a change to w₂ moves the output "
        "exactly as a change to w₁ would ({{fig:v04-p13}}). Once w₁ has been rounded down by 0.4, raising "
        "w₂ by 0.4 cancels that damage completely; w₂ is then rounded itself, to 1, which leaves an error "
        "of +0.2 per unit of input instead of −0.8.",
        "GPTQ judges the damage over real inputs: run the calibration inputs through, square each output "
        "error and average. Rounding both weights to the nearest whole number scores 1; rounding the first "
        "and paying its error forward scores 0.0625. The bars are to scale.",
    ])
    b.append(body)
    emit("p18", st("nudges everything not yet quantized"),
         "Two weights fed the same input: round one, and the other can pay it back", y + 26, b,
         "Compensation works because the two inputs move together. When they do not, nudging the second "
         "weight cannot help, and the next figure measures how much it helps in between.")


# ---- p20: the Hessian is a table of input products -------------------------------------------------------------
def p20():
    rho = 0.8
    x1, x2 = calibration(rho)
    A, B, C = averages(x1, x2)
    d_star = -E1 * C / B
    X = np.vstack([x1, x2])
    H = 2 * X @ X.T / len(x1)
    Hi = np.linalg.inv(H)
    obs = E1 / Hi[0, 0] * Hi[:, 0]                     # GPTQ's update when weight 1 is rounded
    assert abs(obs[0] - E1) < 1e-12 and abs(obs[1] - d_star) < 1e-12
    n = 4096
    entries = n * n
    mb = entries * 4 / 1e6
    assert entries == 16777216 and round(mb) == 67
    b = [hd(40, 46, f"Two inputs: the averages of their products over the {len(x1)} inputs of the widget above")]
    gx, gy, cw, ch = 150, 74, 120, 44
    cells = [[A, C], [C, B]]
    names = [["average x₁ × x₁", "average x₁ × x₂"], ["average x₂ × x₁", "average x₂ × x₂"]]
    for i in range(2):
        for j in range(2):
            c = "s" if i == j else "m"
            b.append(cell(gx + j * (cw + 6), gy + i * (ch + 6), cw, ch, c, label=f(cells[i][j], 3)))
    b.append(text(gx - 12, gy + 28, "H = 2 ×", "hd", "end"))
    b.append(text(gx + 2 * cw + 30, gy + 20, "diagonal: how loud each input is,", "sub2"))
    b.append(text(gx + 2 * cw + 30, gy + 38, "so how much its weight's error costs", "sub2"))
    b.append(text(gx + 2 * cw + 30, gy + 70, "off the diagonal: how much the two", "sub2"))
    b.append(text(gx + 2 * cw + 30, gy + 88, "move together, so whether one weight", "sub2"))
    b.append(text(gx + 2 * cw + 30, gy + 106, "can cover for the other", "sub2"))
    yq = gy + 2 * ch + 6 + 36
    b.append(eq(60, yq, 560, f"best nudge to w₂  =  −e₁ × (x₁x₂ entry) ÷ (x₂x₂ entry)  =  0.4 × {f(C, 3)} ÷ {f(B, 3)}  =  {f(d_star, 3)}", "m"))
    # the full-size table, schematic
    yt = yq + 92
    b.append(text(40, yt - 12, f"A layer with {fi(n)} inputs: a table of {fi(n)} × {fi(n)}, schematic", "sub2"))
    k, sz = 16, 9
    for i in range(k):
        for j in range(k):
            near = abs(i - j)
            c = "s" if i == j else ("m" if near == 1 or (i + j) % 7 == 0 else "u")
            b.append(rect(60 + j * (sz + 1), yt + i * (sz + 1), sz, sz, c, rx=1))
    tx = 60 + k * (sz + 1) + 24
    b.append(text(tx, yt + 30, f"{fi(entries)} averages", "sub2"))
    b.append(text(tx, yt + 50, f"{f(mb, 0)} MB in FP32, built once per layer from the calibration data", "sub2"))
    b.append(text(tx, yt + 70, "teal: each input with itself; amber: pairs that move together", "sub2"))
    body, y = prose(yt + k * (sz + 1) + 40, [
        "The parabola's bottom needed three averages, and they are all this table holds. GPTQ calls it the "
        "Hessian: the measure of how sharply the error's bowl curves, which for a squared output error is "
        "twice the average of each pair of inputs multiplied together. The 2 cancels in every ratio GPTQ "
        "uses. It depends only on the inputs, never on the weights: for a linear layer, just a statistic of "
        "the inputs.",
        "With many weights GPTQ applies the same rule to every weight still unquantized, all at once, "
        "through the inverse of the table, H⁻¹, the matrix that undoes H as dividing by 2 undoes "
        f"multiplying by 2. For these two inputs its update for w₂ is {f(obs[1], 4)}: exactly the "
        "parabola's bottom.",
        "It is sometimes called an input covariance. That is exact only when the inputs average to zero; "
        "the table itself is plain averages of products.",
    ])
    b.append(body)
    emit("p20", st("For a linear layer, that"), "The Hessian is a table of input products", y + 26, b,
         "Despite the name, nothing here needs gradients or training. The second-order information GPTQ "
         "uses is averages of input products, measured once.")


# ---- o061: what calibration means --------------------------------------------------------------------------------
def o061():
    segs, toks = 128, 2048
    assert segs * toks == 262144
    b = [box(40, 52, 180, 56, "u", "calibration text", f"{segs} pieces of {fi(toks)} tokens"),
         arr(226, 80, 250, 80),
         box(256, 52, 180, 56, "s", "run once", "recording each layer's inputs"),
         arr(442, 80, 466, 80),
         box(472, 52, 168, 56, "m", "per layer", "the table of products")]
    body, y = prose(148, [
        "Calibration data is a small, ordinary sample of the kind of text the model will see, run through "
        "the model once so the tool can see what flows into each layer. Frantar and colleagues used "
        f"{segs} random segments of {fi(toks)} tokens from C4, a crawl of web pages: {fi(segs * toks)} tokens, "
        "nothing task-specific.",
        "No labels, no gradients, no training: just a look at what flows through. For GPTQ that costs "
        "minutes for a small model and about four GPU-hours for one of 175 billion parameters.",
        "This is post-training quantization: the model is finished, and you are only choosing how to "
        "write it down.",
    ])
    b.append(body)
    emit("o061", st("collected by running calibration data"), "What calibration means", y + 26, b,
         "The weights learn nothing new here. Calibration only measures the inputs, so that the rounding "
         "can be steered by them.")


# ---- p21: three bits on one GPU -----------------------------------------------------------------------------------
def p21():
    P = 175e9
    gib = 2 ** 30
    sizes = [(bits, P * bits / 8 / gib) for bits in (16, 8, 4, 3)]
    card = 80
    assert round(sizes[0][1]) == 326 and round(sizes[2][1], 1) == 81.5 and round(sizes[3][1], 1) == 61.1
    assert sizes[2][1] > card > sizes[3][1] + 9
    assert math.ceil(sizes[0][1] / card) == 5 and math.ceil(sizes[1][1] / card) == 3
    assert math.ceil(sizes[2][1] / card) == 2
    PX = 1.2
    X0 = 150
    b = [hd(40, 46, "OPT-175B's weights at four precisions, to scale, against one 80 GB GPU")]
    notes = {16: "5 GPUs", 8: "3 GPUs", 4: "does not fit", 3: "fits, with room for the cache"}
    for k, (bits, size) in enumerate(sizes):
        y = 74 + k * 44
        b.append(text(40, y + 18, f"{bits}-bit" if bits != 16 else "FP16", "cap"))
        c = "h" if size > card else "s"
        b.append(rect(X0, y, size * PX, 26, c, rx=2))
        lx = max(X0 + size * PX, X0 + card * PX) + 10        # labels start clear of the card's line
        label = f"{f(size, 1).rstrip('0').rstrip('.')} GB: {notes[bits]}"
        b.append(text(lx, y + 18, label, "sub2"))
        assert lx + 6 * len(label) < 650
    xc = X0 + card * PX
    b.append(f'<line class="mark xok" x1="{xc:.1f}" y1="64" x2="{xc:.1f}" y2="{74 + 4 * 44}"/>')
    b.append(text(xc, 74 + 4 * 44 + 16, "one 80 GB A100", "sub2", "middle"))
    body, y = prose(74 + 4 * 44 + 56, [
        "Weights alone, counted as the GPTQ paper counts, in gigabytes of 1,024³ bytes: 175 billion "
        "parameters at 16 bits are 326 GB, five 80 GB cards. At 4 bits they are 81.5 GB, already more "
        "than one card holds; at 3 bits, 61.",
        "The paper's own count for its 3-bit OPT-175B is about 63 GB, because the embeddings stay in 16 "
        "bits, plus about 9 GB of cached keys and values for 2,048 tokens: inside one 80 GB A100, where "
        "the 8-bit LLM.int8() needed three. That is the single-GPU result.",
    ])
    b.append(body)
    emit("p21", st("it fit a 175"), "Three bits is what put 175 billion parameters on one GPU", y + 26, b,
         "The headline is a three-bit result. Four bits cuts the hardware from five cards to two; only "
         "three bits gets it down to one.")


# ---- the existing figures' prose ---------------------------------------------------------------------------------
def o059():
    from fixes import apply
    apply([("o059", ">Works to 8 bits</text>", ">Holds at 8 bits</text>"),
           ("o059", ">falls apart below</text>", ">degrades at 4, collapses at 3</text>")])
    reprose("o059", 164, [
        "Simply rounding each weight to the closest representable value is the null method. It holds at "
        "eight bits, degrades at four and collapses at three. Measured by Frantar and colleagues on "
        "OPT-175B: perplexity 8.34 in FP16, 10.54 rounded to 4 bits, about " + nb("7,300 at 3 bits") + ".",
        "Everything below exists because of that last step.",
    ])


def o060():
    reprose("o060", 200, [
        "GPTQ, from Elias Frantar and colleagues in 2022, rounds a layer's weights one at a time. After "
        "rounding each one, it nudges everything not yet quantized to cancel the error just introduced. "
        "The error is never eliminated, only relocated to where the output cares least.",
        "How much to nudge comes from the Hessian, second-order information measuring how much each "
        "weight's error moves the layer's output. The next three figures build it from one rounded weight.",
    ])


def o063():
    reprose("o063", 170, [
        "That was enough for three and four bits in one shot, with no retraining, at near-baseline "
        "accuracy. At three bits it fit a 175-billion-parameter model onto a single GPU for the first "
        "time ({{fig:v04-p21}}).",
    ])


if __name__ == "__main__":
    for fn in (p18, p20, o061, p21, o059, o060, o063):
        fn()
