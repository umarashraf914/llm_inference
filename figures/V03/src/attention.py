"""V3 Part 3, attention from scratch: §5d merge 15+16, §5a items 1, 5, 10, 21, 22, review #6 and #7, one
extra ground-floor figure (n07, matrix times matrix), and the restamps of §2b.

  o015  Q, K and V: three roles, made by the kernel before attention and read by it (merges o016)
  n07   a matrix times a matrix is a grid of dot products (6:02)
  o024  FP16 runs out at 65,504: the bit layout worked (review #6 folded in), "routinely" softened
  p07   subtracting the maximum, on one row of scores (review #7)
  o026  linear against quadratic, redrawn to scale
  patches: o017 caption, o020 (just under half; a recap of V1), o021 (the 1/sqrt(d)), o025, o027 (42.7)

  python3 figures/V03/src/attention.py
"""
import numpy as np
from common import *  # noqa: F401,F403


# ---- o015: Q, K and V ----------------------------------------------------------------------------
def o015():
    n, d, width = 8192, 64, 4096
    per = n * d * 2                                  # one head's Q (or K, or V) in FP16, bytes
    assert per == 1048576
    b = [hd(40, 46, "Each token's vector, times three learned matrices, gives three new vectors")]
    b.append(box(40, 70, 150, 70, "u", "X", "the layer's input", "one row per token"))
    roles = [("Q", "what this token looks for"), ("K", "what it offers to others"),
             ("V", "what it contributes")]
    for k, (name, what) in enumerate(roles):
        y = 64 + k * 30
        b.append(arr(196, 105, 236, y + 12))
        b.append(cell(242, y, 130, 24, "m", label=f"× W_{name[0]}"))
        b.append(arr(378, y + 12, 398, y + 12))
        b.append(cell(404, y, 236, 24, "s", label=f"{name}: {what}"))
    yk = 172
    b.append(cont(40, yk, 600, 112, "u", "Two kernels, one hand-off through HBM"))
    b.append(box(62, yk + 44, 180, 46, "m", "projection kernel", "writes Q, K, V"))
    b.append(arr(248, yk + 67, 278, yk + 67))
    b.append(box(284, yk + 44, 150, 46, "h", "HBM", "1 MB each, per head"))
    b.append(arr(440, yk + 67, 470, yk + 67))
    b.append(box(476, yk + 44, 142, 46, "m", "attention kernel", "reads them back"))
    body, yb = prose(yk + 112 + 34, [
        "Q, K and V are made inside each layer by multiplying the layer's input by three learned weight "
        f"matrices. Each has one row per token, sliced into heads of width d: at {n:,} tokens and d = {d}, one "
        f"head's Q is {n:,} × {d} numbers, {per / 2**20:.0f} MB in 16-bit.",
        "They are made by a kernel of their own, the projection, which writes them to HBM. The attention "
        "kernel then reads them back. That read is real traffic, but it is the small term: four n × d "
        f"matrices, against the n × n ones attention builds from them (Part {PART['naive']}). K and V also "
        "stay in HBM afterwards, as the cache later tokens read (next figures).",
    ])
    figure("o015", st("each token builds three"), "Q, K and V: three roles, made before attention runs",
           yb + 30, b + [body],
           esc("Inputs to the attention kernel, outputs of the one before it. They do cross HBM, but they "
               "grow with n, not n², so they are never the expensive part."))


# ---- n07: matrix times matrix -------------------------------------------------------------------
def n07():
    Q = [[1, 2], [0, 1], [3, 1]]
    K = [[2, 1], [1, 0], [0, 3]]
    S = [[sum(a * b for a, b in zip(q, k)) for k in K] for q in Q]
    assert S == [[4, 1, 6], [1, 0, 3], [7, 3, 3]]
    HI, HJ = 2, 0                                   # the highlighted entry
    b = [hd(40, 46, "Entry (i, j) of Q Kᵀ is row i of Q dotted with row j of K")]
    C = 30
    qx, qy = 60, 122
    b.append(txt(qx, qy - 12, "Q, 3 × 2", "sub2"))
    for i in range(3):
        for j in range(2):
            b.append(cell(qx + j * (C + 4), qy + i * (C + 4), C, C, "m" if i == HI else "u", label=str(Q[i][j])))
    kx, ky = 190, 88
    b.append(txt(kx, ky - 8, "Kᵀ, 2 × 3", "sub2"))
    for i in range(2):
        for j in range(3):
            b.append(cell(kx + j * (C + 4), ky + i * (C + 4), C, C, "m" if j == HJ else "u", label=str(K[j][i])))
    sx, sy = 330, 122
    b.append(txt(sx, sy - 12, "S = Q Kᵀ, 3 × 3", "sub2"))
    for i in range(3):
        for j in range(3):
            b.append(cell(sx + j * (C + 4), sy + i * (C + 4), C, C, "s" if (i, j) == (HI, HJ) else "u",
                          label=str(S[i][j])))
    q, k = Q[HI], K[HJ]
    b.append(txt(470, 142, f"row {HI + 1} of Q: ({q[0]}, {q[1]})", "sub2"))
    b.append(txt(470, 162, f"row {HJ + 1} of K: ({k[0]}, {k[1]})", "sub2"))
    b.append(txt(470, 182, f"{q[0]}×{k[0]} + {q[1]}×{k[1]} = {S[HI][HJ]}", "sub2"))
    body, yb = prose(qy + 3 * (C + 4) + 44, [
        "Multiplying two matrices is a grid of dot products ({{fig:v03-o014}}). Each entry of the "
        "answer takes one row of the left matrix and one column of the right, multiplies them pair by pair "
        "and adds. Transposing K turns its rows into columns, so column j of Kᵀ is row j of K "
        "({{fig:v03-o019}}).",
        "So S = Q Kᵀ holds one score for every pair of tokens: query i against key j. With n tokens and "
        "head width d, that is n × n entries, each a dot product of d multiply-adds, n·n·d in all; the "
        "multiply by V is the same count again. Those are the two halves of attention's 4·n²·d operations "
        "({{fig:v03-p03}}).",
    ])
    figure("n07", st("S = Q * K transpose"), "A matrix times a matrix is a grid of dot products", yb + 30,
           b + [body],
           esc("The one operation everything else in this atlas is built from. Its output here is 3 × 3 "
               "from inputs of 3 × 2: the output grows with the square of the token count, the inputs do "
               "not."))


# ---- o024: where 65,504 comes from -------------------------------------------------------------------
BPX = 36                                             # pixels per bit, shared with the FP8 layouts (o075)


def bits_row(x0, y, fields):
    """fields: list of (bits string, class). Returns svg and the x of each field's start."""
    out, xs, x = [], [], x0
    for bits, cls in fields:
        xs.append(x)
        for ch in bits:
            out.append(cell(x, y, BPX - 2, 26, cls, label=ch))
            x += BPX
    return "".join(out), xs


def o024():
    exp_field, bias, frac_bits = 0b11110, 15, 10
    sig = 2 - 2 ** -frac_bits
    largest = sig * 2 ** (exp_field - bias)
    assert largest == 65504 == float(np.finfo(np.float16).max)
    thr16 = math.log(largest)
    big32 = float(np.finfo(np.float32).max)
    thr32 = math.log(big32)
    assert round(thr16, 2) == 11.09 and round(thr32, 2) == 88.72 and f"{big32:.2e}" == "3.40e+38"
    with np.errstate(over="ignore"):
        assert np.isinf(np.exp(np.float16(12))) and not np.isinf(np.exp(np.float16(11)))
    b = [hd(40, 46, "Sixteen bits: the largest number they can hold, worked out")]
    row, xs = bits_row(40, 66, [("0", "u"), ("11110", "h"), ("1111111111", "s")])
    b.append(row)
    b.append(txt(xs[0], 112, "sign", "sub2"))
    b.append(txt(xs[1], 112, "exponent: 11110 = 30", "sub2"))
    b.append(txt(xs[2], 112, "fraction: all ten bits set", "sub2"))
    b.append(eq(40, 130, 600, f"(2 − 2⁻¹⁰) × 2^(30 − 15)  =  1.9990234375 × 32,768  =  {largest:,.0f}", "u", 36))
    rows = [(8, math.exp(8)), (10, math.exp(10)), (thr16, largest), (12, math.exp(12))]
    b.append(txt(40, 200, "x", "sub2"))
    b.append(txt(250, 200, "e to the x", "sub2", "end"))
    b.append(txt(290, 200, "in FP16", "sub2"))
    for k, (x, v) in enumerate(rows):
        y = 222 + k * 22
        b.append(txt(40, y, f"{x:.2f}" if k == 2 else f"{x}", "sub2"))
        b.append(txt(250, y, f"{v:,.0f}", "sub2", "end"))
        b.append(txt(290, y, "infinity: overflowed" if k == 3 else ("the largest there is" if k == 2 else "fits"), "sub2"))
    body, yb = prose(222 + 4 * 22 + 30, [
        "A floating-point number is a sign, an exponent and a fraction ({{fig:v02-o086}}). FP16 stores "
        "its exponent with 15 added, so that negative ones can be written, and keeps the top pattern, "
        "11111, for infinity. The largest usable exponent is 11110 = 30, which means 2^(30 − 15) = 2¹⁵. "
        "With all ten fraction bits set, the number in front is 1.1111111111 in binary, which is "
        "2 − 2⁻¹⁰. Multiplied out: 65,504.",
        f"e^x passes that at x = ln 65,504 = {thr16:.2f}. A score of 12 already gives 162,755, which "
        "FP16 can only call infinity, and the softmax built on it turns to nonsense. Scores above "
        "eleven are entirely possible, so the obvious formula is not safe in sixteen bits.",
        f"FP32 has eight exponent bits and reaches {big32:.2e}".replace("e+38", " × 10³⁸") +
        f", so its exponentials are safe up to {thr32:.1f}. Kernels do the softmax's arithmetic in FP32 "
        "for this reason among others.",
    ])
    figure("o024", st("overflows finite precision"), "FP16 runs out at 65,504, and e¹² is already past it",
           yb + 30, b + [body],
           esc("The threshold is exact and low: the natural logarithm of the largest FP16 number. "
               "Subtracting the row's maximum, next, is what keeps every exponent at or below zero."))


# ---- p07: the worked row -------------------------------------------------------------------------
def p07():
    x = [8, 10, 12]
    m = max(x)
    ex = [math.exp(v) for v in x]
    w_direct = [v / sum(ex) for v in ex]
    sh = [math.exp(v - m) for v in x]
    w_shift = [v / sum(sh) for v in sh]
    assert all(abs(a - c) < 1e-15 for a, c in zip(w_direct, w_shift))
    x16 = np.array(x, dtype=np.float16)
    with np.errstate(over="ignore", invalid="ignore"):
        e16 = np.exp(x16)
        w16_direct = e16 / e16.sum()
    assert np.isinf(e16[2]) and np.isinf(e16.sum()) and w16_direct[0] == 0 and np.isnan(w16_direct[2])
    w16 = np.exp(x16 - x16.max()) / np.exp(x16 - x16.max()).sum()
    assert [f"{float(v):.3g}" for v in w16] == ["0.0159", "0.117", "0.867"]
    assert [f(v, 4) for v in w_shift] == ["0.0159", "0.1173", "0.8668"]
    b = [hd(40, 46, "One row of three scores, the obvious way and the safe way")]
    cols = [(40, "score x", "start"), (176, "e^x", "end"), (290, "in FP16", "end"), (430, "e^(x − 12)", "end"),
            (530, "shifted weight", "end"), (640, "exact weight", "end")]
    for cx, lab, an in cols:
        b.append(txt(cx, 84, lab, "sub2", an))
    for k in range(3):
        y = 108 + k * 26
        b.append(txt(40, y, str(x[k]), "cap"))
        b.append(txt(176, y, f"{ex[k]:,.0f}", "sub2", "end"))
        b.append(txt(290, y, "infinity" if k == 2 else f"{float(e16[k]):,.0f}", "sub2", "end"))
        b.append(txt(430, y, f(sh[k], 4), "sub2", "end"))
        b.append(txt(530, y, f(w_shift[k], 4), "sub2", "end"))
        b.append(txt(640, y, f(w_direct[k], 4), "sub2", "end"))
    yt = 108 + 3 * 26 - 12
    b.append(tline(110, yt, 640, yt))
    y = yt + 22
    b.append(txt(40, y, "total", "cap"))
    b.append(txt(176, y, f"{sum(ex):,.0f}", "sub2", "end"))
    b.append(txt(290, y, "infinity", "sub2", "end"))
    b.append(txt(430, y, f(sum(sh), 4), "sub2", "end"))
    b.append(txt(530, y, "1", "sub2", "end"))
    b.append(txt(640, y, "1", "sub2", "end"))
    ye = y + 26
    b.append(eq(40, ye, 600, "e^(x − 12)  =  e^x × e^(−12):  every term, top and bottom, carries the same e^(−12)", "u", 36))
    body, yb = prose(ye + 36 + 32, [
        "The obvious way exponentiates the scores as they are. e¹² is 162,755, past FP16's 65,504, so it "
        "becomes infinity, the total becomes infinity, and the weights come out as 2,980 ÷ infinity = 0 "
        "and infinity ÷ infinity, which is not a number at all.",
        "The safe way first subtracts the row's largest score, 12. The exponents become −4, −2 and 0, "
        "every exponential lies between 0 and 1, and nothing can overflow. The weights it gives are the "
        "exact ones, the last column, computed in full precision.",
        "Why they agree: each shifted term is the original times e^(−12). The weight is a term divided by "
        "the total, and the total is also multiplied by e^(−12), so the factor cancels. Done in FP16 "
        "itself, the safe way gives 0.0159, 0.117 and 0.867: the same weights, to the three digits FP16 "
        "carries.",
    ])
    figure("p07", st("The weights come out identical"), "Subtracting the maximum, on one row of scores",
           yb + 30, b + [body],
           esc("A shift that changes no weight and removes every overflow: whatever the scores were, every "
               "exponential now lands between 0 and 1."))


# ---- o026: linear against quadratic, to scale -------------------------------------------------------
def o026():
    b = [hd(40, 46, "Double the length: the linear term doubles, the square quadruples")]
    X0, X1, Y0, Y1 = 90, 590, 290, 70
    U = lambda u: Y0 - u / 4 * (Y0 - Y1)              # 0 to 4 units up the page
    b.append(tline(X0, Y0, X1, Y0, "axis"))
    b.append(tline(X0, Y1, X0, Y0, "axis"))
    ts = [i / 100 for i in range(101)]               # t = 1 is a length of 2n
    lin = [(X0 + t * (X1 - X0), U(2 * t)) for t in ts]
    quad = [(X0 + t * (X1 - X0), U(4 * t * t)) for t in ts]
    assert lin[50][1] == quad[50][1] == U(1)         # both are 1 unit at n
    b.append(poly(lin, "--u", 2))
    b.append(poly(quad, "--h", 2))
    for t, lab in ((0.5, "n"), (1.0, "2n")):
        x = X0 + t * (X1 - X0)
        b.append(tline(x, Y0, x, Y0 + 5))
        b.append(txt(x, Y0 + 20, lab, "sub2", "middle"))
    for u in (1, 2, 4):
        b.append(tline(X0 - 5, U(u), X0, U(u)))
        b.append(txt(X0 - 10, U(u) + 4, str(u), "sub2", "end"))
    xh = X0 + 0.5 * (X1 - X0)
    b.append(dot(xh, U(1), 4, "--h"))
    b.append(txt(xh + 10, U(1) + 18, "both 1 unit at n", "sub2 halo"))
    b.append(dot(X1, U(2), 4, "--u"))
    b.append(dot(X1, U(4), 4, "--h"))
    b.append(txt(X1 + 10, U(2) + 4, "linear: 2", "sub2"))
    b.append(txt(X1 + 10, U(4) + 4, "square: 4", "sub2"))
    body, yb = prose(Y0 + 54, [
        "Both curves are drawn to one scale and pass through the same value at n. Doubling the input "
        "doubles the straight line and quadruples the curve. At ten times the input the gap is ten-fold; "
        "at a thousand times, a thousand-fold.",
        "In attention, Q, K and V grow with the number of tokens, the straight line. The score matrix S "
        "has an entry for every pair of tokens, so it grows as the square. Everything else in sight is on "
        "the straight line; S is the only thing on the curve.",
    ])
    figure("o026", st("Double the sequence length"), "Linear against quadratic", yb + 30, b + [body],
           esc("A shape worth recognising instantly. Whenever one term grows quadratically and the rest do "
               "not, the quadratic one eventually decides everything."))


# ---- the patches -----------------------------------------------------------------------------------
def patches():
    patch("o017", [("<figcaption>A 2-token prompt does not give you twenty of anything. It gives you three "
                    "matrices per layer, each with exactly two rows.</figcaption>",
                    "<figcaption>Rows count tokens, columns count features. However wide the model, a 2-token "
                    "prompt gives three matrices per layer, each exactly two rows tall.</figcaption>")],
          stamp_to=st("Stack those over a sequence"))
    patch("o018", [], stamp_to=st("Stack those over a sequence"))
    patch("o013", [], stamp_to=st("64 to 128 per head"))
    patch("o014", [], stamp_to=st("compares every query against every key"))
    patch("o019", [], stamp_to=st("S = Q * K transpose"))
    patch("o022", [], stamp_to=st("First, raise e to each score"))
    patch("o023", [], stamp_to=st("Then divide each result by the row's total"))
    patch("o025", [("Scores routinely reach values where the exponential overflows:",
                    "Scores can reach values where the exponential overflows:")],
          stamp_to=st("first subtracts the row's largest score"))
    # o021: the scaling every real implementation applies
    patch("o021", [("<text class=\"cap\" x=\"40\" y=\"212\" text-anchor=\"start\">A layer runs a few dozen of these side by side, one per head, on different slices of the</text><text class=\"cap\" x=\"40\" y=\"232\" text-anchor=\"start\">same activations.</text></svg>",
                    "<text class=\"cap\" x=\"40\" y=\"212\" text-anchor=\"start\">Real implementations also divide every score by √d before the softmax: 8 when d is 64,</text><text class=\"cap\" x=\"40\" y=\"232\" text-anchor=\"start\">11.3 when d is 128. It keeps scores from growing with head size; nothing below changes.</text></svg>")],
          stamp_to=st("two matrix multiplies"))
    assert (round(math.sqrt(64)), round(math.sqrt(128), 1)) == (8, 11.3)
    # o020: just under half, and say it is V1's figure
    n = 8192
    masked = n * (n - 1) / 2 / n ** 2
    assert f"{100 * masked:.2f}" == "49.99" and 15 / 36 < 0.42
    patch("o020", [("Half the grid is unusable. At 8,192 tokens exactly half, since the triangle is n(n+1)/2 out</text><text class=\"cap\" x=\"40\" y=\"372\" text-anchor=\"start\">of n squared.",
                    f"Just under half the grid is unusable: n(n − 1)/2 of the n² entries, {100 * masked:.2f}% at</text><text class=\"cap\" x=\"40\" y=\"372\" text-anchor=\"start\">8,192 tokens. The 6 × 6 drawn here masks 15 of 36."),
                   ("<figcaption>Two consequences from one rule: half the score matrix never needs computing, and decode has to be sequential. Both return repeatedly below.</figcaption>",
                    "<figcaption>A recap of {{ref:v01-o132}}. Two consequences from one rule: almost half the score matrix never needs computing, and decode has to be sequential. Both return below.</figcaption>")],
          stamp_to=st("two matrix multiplies"))
    # o027: 128 times one of them, about 43 times all three
    d = 64
    one, three = n * n / (n * d), n * n / (3 * n * d)
    assert one == 128 and round(three, 1) == 42.7
    patch("o027", [("<text class=\"cap\" x=\"400\" y=\"138\" text-anchor=\"start\">At 8,192 tokens with head</text><text class=\"cap\" x=\"400\" y=\"160\" text-anchor=\"start\">dimension 64, S is 128 times</text><text class=\"cap\" x=\"400\" y=\"182\" text-anchor=\"start\">larger than all three combined.</text>",
                    f"<text class=\"cap\" x=\"400\" y=\"138\" text-anchor=\"start\">At 8,192 tokens with head</text><text class=\"cap\" x=\"400\" y=\"160\" text-anchor=\"start\">dimension 64, S is {one:.0f} times Q,</text><text class=\"cap\" x=\"400\" y=\"182\" text-anchor=\"start\">and {three:.0f} times all three together.</text>")],
          stamp_to=st("At 8,192"))
    big = 32768 ** 2 * 2
    assert round(big / 1e9, 1) == 2.1 and round(32 * big / 1e9) == 69
    patch("o027", [("<figcaption>One term grows quadratically while everything else grows linearly. That asymmetry is the whole problem and the whole opportunity.</figcaption>",
                    f"<figcaption>At 32,768 tokens one head's S is {big / 1e9:.1f} GB in 16-bit, and a model with 32 heads would need "
                    f"{32 * big / 1e9:.0f} GB for a single layer's scores: nearly all of an 80 GB H100, for an object used once and thrown away.</figcaption>")])


if __name__ == "__main__":
    for fn in (o015, n07, o024, p07, o026, patches):
        fn()
