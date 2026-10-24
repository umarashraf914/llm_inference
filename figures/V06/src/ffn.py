"""V6 Part 3, where the knowledge lives: P6-P8 (the feed-forward block as a memory) and P9-P10 (where
two thirds comes from) of plans/depth_pass/V06_review.md.

Source for the key-value reading: Geva et al. 2021, "Transformer Feed-Forward Layers Are Key-Value
Memories" (arXiv 2012.14913), eq. 1: FF(x) = f(x K^T) V, keys the rows of the first matrix, values the
rows of the second (columns, when the vector is written as a column). The 4d^2 and 8d^2 counts are in
that paper and in Kaplan et al. 2020, Table 1.

  python3 figures/V06/src/ffn.py      writes p06 ... p10 in figures/V06/items/
"""
import math
from common import (DS, arr, at, cell, dsv3, emit, f, hd, ln, n, nb, pct, prose, rect, txt)

# ---- the worked example: a 2-wide token, 4 hidden units --------------------------------------------
x = [1, 2]
KEYS = [[1, 1], [1, -1], [2, -1], [0.5, -1]]               # rows of the first matrix
VALS = [[0.6, 0.2], [-0.5, 0.4], [0.3, -0.7], [-0.2, 0.9]]  # columns of the second matrix
h = [sum(a * b for a, b in zip(k, x)) for k in KEYS]
kept = [max(0, v) for v in h]
y = [sum(kept[i] * VALS[i][j] for i in range(4)) for j in range(2)]
y_lin = [sum(h[i] * VALS[i][j] for i in range(4)) for j in range(2)]     # the same block without ReLU
assert h == [3, -1, 0, -1.5] and kept == [3, 0, 0, 0]
assert [round(v, 12) for v in y] == [1.8, 0.6] and [round(v, 12) for v in y_lin] == [2.6, -1.15]


def s(v):
    """Short form: 3, −1, 0.5 as written."""
    v = v + 0.0
    t = f"{v:g}"
    return t.replace("-", "−")


def p06():
    b = [hd(40, 46, "One token through a toy feed-forward block: 2 numbers in, 4 inside, 2 out")]
    CW, CH, G = 36, 24, 4
    top = 82
    ry = [top + i * (CH + G) for i in range(4)]
    for i in range(4):                                            # W_up, 4 rows of 2
        for j in range(2):
            b.append(cell(60 + j * (CW + G), ry[i], CW, CH, "u", label=s(KEYS[i][j])))
        b.append(cell(228, ry[i], 42, CH, "m", label=s(h[i])))
        b.append(cell(340, ry[i], 42, CH, "m" if kept[i] else "u", label=s(kept[i])))
    mid = top + 2 * (CH + G) - G / 2
    b.append(txt(150, mid + 4, "×", "sub2", "middle"))
    for i in range(2):
        b.append(cell(164, mid - CH - G / 2 + i * (CH + G), CW, CH, "u", label=s(x[i])))
    b.append(txt(214, mid + 4, "=", "sub2", "middle"))
    b.append(arr(276, mid, 332, mid))
    b.append(txt(304, mid - 8, "max(0, ·)", "sub2", "middle"))
    bot = ry[3] + CH
    for xx, lab in [(60, "first matrix"), (164, "x"), (228, "h"), (340, "kept")]:
        b.append(txt(xx, bot + 18, lab, "sub2"))
    b.append(txt(410, ry[0] + 17, "1  widen: multiply by the first matrix", "sub2"))
    b.append(txt(410, ry[1] + 17, "2  keep the positives: max(0, h)", "sub2"))
    # row B: the second matrix narrows back to 2
    top2 = bot + 52
    ry2 = [top2 + i * (CH + G) for i in range(4)]
    wy = [ry2[1], ry2[2]]                                         # the 2 x 4 matrix, centred on the column
    for i in range(2):
        for j in range(4):
            b.append(cell(60 + j * (40 + G), wy[i], 40, CH, "u", label=s(VALS[j][i])))
        b.append(cell(340, wy[i], 42, CH, "m", label=f(y[i], 1)))
    for i in range(4):
        b.append(cell(260, ry2[i], 42, CH, "m" if kept[i] else "u", label=s(kept[i])))
    mid2 = ry2[2] - G / 2
    b.append(txt(246, mid2 + 4, "×", "sub2", "middle"))
    b.append(txt(321, mid2 + 4, "=", "sub2", "middle"))
    bot2 = ry2[3] + CH
    for xx, lab in [(60, "second matrix"), (260, "kept"), (340, "y")]:
        b.append(txt(xx, bot2 + 18, lab, "sub2"))
    b.append(txt(410, wy[0] + 17, "3  narrow: multiply by the second matrix", "sub2"))
    body, yy = prose(bot2 + 64, [
        "The feed-forward block, or feed-forward network (FFN), does three things to one token's vector. "
        "It multiplies by a first matrix "
        "that makes the vector wider, four times wider in the classic design; here 2 numbers become 4. "
        "Then it replaces every negative number with zero: ReLU, max(0, x). Then a second matrix narrows "
        "the result back to the token's width.",
        "The middle step is what makes the block more than one matrix. Without it the two multiplies in "
        f"a row would collapse into a single 2 × 2 matrix and give {nb(f'[{f(y_lin[0], 2)}, {f(y_lin[1], 2)}]')} "
        f"here; with it, three of the four hidden numbers are switched off and the answer is "
        f"{nb(f'[{f(y[0], 1)}, {f(y[1], 1)}]')}.",
        "Most modern blocks add a third matrix, a gate that multiplies the widened vector entry by entry "
        "before it is narrowed (SwiGLU). That is why {{fig:v01-o100}} counts three feed-forward matrices "
        "per layer. The drawing is the original two-matrix form; the logic is the same.",
    ])
    emit("p06", at("the same transformation applied at every position"),
         "Inside the feed-forward block: widen, keep the positives, narrow", yy + 32, b + [body],
         "Two matrix multiplies with one cheap step between them. That step lets each hidden number switch "
         "on or off, which is what the next figure reads as a lookup.")


def p07():
    b = [hd(40, 46, f"The same arithmetic for x = [{s(x[0])}, {s(x[1])}], read one hidden unit at a time")]
    X = dict(unit=40, key=96, match=208, kept=272, val=330, prod=470)
    for k, l1, l2 in [("key", "key", "row of the first"), ("match", "key · x", ""), ("kept", "kept", ""),
                      ("val", "value", "column of the second"), ("prod", "kept × value", "")]:
        b.append(txt(X[k], 70, l1, "sub2"))
        if l2:
            b.append(txt(X[k], 84, l2, "sub2"))
    for i in range(4):
        yy = 94 + i * 38
        on = kept[i] > 0
        b.append(txt(X["unit"], yy + 20, f"unit {i + 1}", "cap"))
        for j in range(2):
            b.append(cell(X["key"] + j * 40, yy, 36, 28, "m" if on else "u", label=s(KEYS[i][j])))
            b.append(cell(X["val"] + j * 46, yy, 42, 28, "m" if on else "u", label=s(VALS[i][j])))
            pv = kept[i] * VALS[i][j]
            b.append(cell(X["prod"] + j * 46, yy, 42, 28, "m" if on else "u", label=f(pv, 1)))
        b.append(txt(X["match"] + 18, yy + 19, s(h[i]), "sub2", "middle"))
        b.append(txt(X["kept"] + 14, yy + 19, s(kept[i]), "sub2", "middle"))
    ysum = 94 + 4 * 38 + 4
    b.append(ln(X["prod"], ysum, X["prod"] + 88, ysum, "tick"))
    for j in range(2):
        b.append(cell(X["prod"] + j * 46, ysum + 10, 42, 28, "m", label=f(y[j], 1)))
    b.append(txt(X["prod"] + 100, ysum + 29, "sum: y", "sub2"))
    body, yy = prose(ysum + 86, [
        "Read the first matrix row by row and each row is a key: a direction the input can point. The "
        "key's match with the token is a dot product ({{fig:v03-o014}}), and ReLU keeps only the "
        "positive matches. Here only key 1 matches, with strength 3.",
        "Each hidden unit also owns one column of the second matrix, its value. The output is every value "
        f"times its unit's kept match, added up: {nb('3 × [0.6, 0.2] = [1.8, 0.6]')}, and the other three values "
        "are multiplied by zero.",
        "A hard lookup, like an embedding table ({{fig:v01-o087}}), returns exactly one row chosen by its "
        "number. This one is soft: every key is scored against the input, and every key that matches "
        "adds its value in proportion. Geva and colleagues found trained keys that fire on recognisable "
        "patterns, such as text ending in a particular phrase.",
    ])
    emit("p07", at("Each key recognizes a pattern"),
         "Each row of the first matrix is a key; each column of the second is a value", yy + 32, b + [body],
         "These keys and values are fixed weights, learned in training and read like a table. They have "
         "nothing to do with attention's keys and values or the KV cache of {{ref:v06-o012}}: same words, different "
         "objects.")


# ---- P8: the value tips the next-token scores --------------------------------------------------------
OUT = [("Paris", [1, 0.3]), ("London", [0.2, 1]), ("the", [0.1, -0.2])]
after = [a + b for a, b in zip(x, y)]


def scores(vec):
    sc = [sum(a * b for a, b in zip(u, vec)) for _, u in OUT]
    m = max(sc)
    e = [math.exp(v - m) for v in sc]
    return sc, [v / sum(e) for v in e]


def p08():
    sb, pb = scores(x)
    sa, pa = scores(after)
    assert [round(v, 2) for v in sb] == [1.6, 2.2, -0.3] and [round(v, 2) for v in sa] == [3.58, 3.16, -0.24]
    assert max(range(3), key=lambda i: pb[i]) == 1 and max(range(3), key=lambda i: pa[i]) == 0
    b = [hd(40, 46, "Next-token scores before and after the block's output is added")]
    SC = 150
    for k, (lab, vec, sc, pr) in enumerate([("before: x", x, sb, pb), ("after: x + y", after, sa, pa)]):
        x0 = 40 + k * 320
        b.append(txt(x0, 80, f"{lab} = [{f(vec[0], 1)}, {f(vec[1], 1)}]", "sub2"))
        b.append(txt(x0 + 76, 104, "score", "sub2", "end"))
        b.append(txt(x0 + 90, 104, "probability", "sub2"))
        top = max(range(3), key=lambda i: pr[i])
        for i, (tok, _) in enumerate(OUT):
            yy = 116 + i * 38
            b.append(txt(x0, yy + 19, tok, "cap"))
            b.append(txt(x0 + 76, yy + 19, f(sc[i]), "sub2", "end"))
            w = max(pr[i] * SC, 2)
            b.append(rect(x0 + 90, yy, w, 28, "m" if i == top else "u"))
            b.append(txt(x0 + 90 + w + 8, yy + 19, f(pr[i]), "sub2"))
    dP = sa[0] - sb[0]
    dL = sa[1] - sb[1]
    THE = nb("'the' [0.1, −0.2]")
    body, yy = prose(116 + 3 * 38 + 50, [
        "Say [1, 2] is the vector for the last word of 'The capital of France is', and key 1 is the key "
        "that fires on that pattern. The block's output y is added onto the vector, the residual stream "
        f"({{{{fig:v01-o099}}}}): {nb(f'[1, 2] + [1.8, 0.6] = [{f(after[0], 1)}, {f(after[1], 1)}]')}.",
        "At the top of the model each vocabulary token's score is a dot product of the final vector with "
        f"that token's own row of the output matrix ({{{{fig:v01-o103}}}}), here {nb('Paris [1, 0.3]')}, "
        f"{nb('London [0.2, 1]')} and {THE}; softmax turns scores into probabilities "
        "({{fig:v01-o009}}).",
        f"The value raised Paris's score by {f(dP)} and London's by only {f(dL)}, and the favourite "
        "changed. Every number here is illustrative, two dimensions instead of thousands; the mechanism, "
        "a value pushing up the tokens that follow its key's pattern, is the one Geva and colleagues "
        "measured.",
    ])
    emit("p08", at("pushes the model's output toward"),
         "The value tips the next-token scores from London to Paris", yy + 32, b + [body],
         "Bars drawn to scale. Remembering, in this picture, is adding: a key that fires adds its value to "
         "the stream, and the value pushes particular tokens up. That is why the facts sit in these weights.")


# ---- P9: where two thirds comes from ----------------------------------------------------------------
def p09():
    b = [hd(40, 46, "Each matrix drawn with area in proportion to its count of weights")]
    S, G = 40, 8
    b.append(txt(40, 96, "attention", "cap"))
    for i, lab in enumerate("QKVO"):
        b.append(cell(170 + i * (S + G), 72, S, S, "u", label=lab))
    b.append(txt(370, 96, "four matrices of d × d:  4d²", "sub2"))
    b.append(txt(40, 164, "feed-forward", "cap"))
    b.append(cell(170, 140, 4 * S, S, "m", label="first, d × 4d"))
    b.append(cell(170 + 4 * S + G, 140, 4 * S, S, "m", label="second, 4d × d"))
    b.append(txt(170, 202, "each the area of four of the squares above:  4d² + 4d² = 8d²", "sub2"))
    yE = 236
    b.append(cell(40, yE, 150, 40, "u", rx=6, label="attention  4d²"))
    b.append(txt(204, yE + 25, "+", "sub2", "middle"))
    b.append(cell(218, yE, 160, 40, "m", rx=6, label="feed-forward  8d²"))
    b.append(txt(392, yE + 25, "=", "sub2", "middle"))
    b.append(cell(406, yE, 110, 40, "u", rx=6, label="12d²"))
    b.append(cell(40, yE + 56, 290, 40, "m", rx=6, label="feed-forward share  8d² / 12d² = 2/3"))
    d = 4096
    att, ffn = 4 * d * d, 8 * d * d
    assert ffn / (att + ffn) == 2 / 3 and 3 * d * (8 * d / 3) == ffn
    body, yy = prose(yE + 140, [
        "A matrix that turns a vector of d numbers into another of d numbers is d × d, so d² weights "
        "({{fig:v01-o084}}). Attention makes queries, keys and values ({{fig:v01-o092}}) and combines the "
        "result: four of them, 4d². The feed-forward block widens to 4d and narrows back: d × 4d and "
        "4d × d, 8d².",
        f"So the block holds 8 parts in 12, two thirds, whatever d is. At d = {n(d)}, d² is "
        f"{n(d * d)}: {att / 1e6:.1f} million weights of attention against {ffn / 1e6:.1f} million of "
        "feed-forward in every layer.",
        "The gated form with three matrices keeps the count: its widening is cut to 8d/3, and "
        "3 × d × 8d/3 = 8d² again.",
    ])
    emit("p09", at("sit in its feedforward layers"), "Where two thirds comes from: 4d² against 8d²",
         yy + 32, b + [body],
         "A consequence of the shapes, not a measurement. Two thirds is the textbook layer; the next "
         "figure shows real layers leaning further still.")


# ---- P10: modern layers lean further ---------------------------------------------------------------
def p10():
    d70, kvw, ff70 = 8192, 8 * 128, 28672             # the 70B model of V01 Fig 101: GQA, 8 KV heads of 128
    att70 = 2 * d70 * d70 + 2 * d70 * kvw
    ffn70 = 3 * d70 * ff70
    v = dsv3()
    ffn_ds = (DS["routed"] + DS["shared"]) * v["expert"] + v["router"]
    rows = [("the classic layer", 2 / 3),
            ("the 70B layer of V1", ffn70 / (ffn70 + att70)),
            ("a DeepSeek V3 MoE layer", ffn_ds / (ffn_ds + v["attn"]))]
    assert round(att70 / 1e6, 1) == 151.0 and round(ffn70 / 1e6, 1) == 704.6
    assert pct(rows[1][1]) == "82.4%" and pct(rows[2][1]) == "98.4%"
    b = [hd(40, 46, "Share of one layer's weights in the feed-forward block, to scale")]
    X0, W = 220, 400
    for k, (lab, sh) in enumerate(rows):
        yy = 72 + k * 46
        b.append(txt(40, yy + 19, lab, "cap"))
        b.append(cell(X0, yy, sh * W, 28, "m", label=f"feed-forward {pct(sh)}"))
        b.append(rect(X0 + sh * W, yy, (1 - sh) * W, 28, "u"))
    b.append(txt(X0 + W, 72 + 3 * 46 + 4, "the grey end is attention", "sub2", "end"))
    body, yy = prose(72 + 3 * 46 + 52, [
        f"The 70-billion-parameter model of {{{{fig:v01-o101}}}} has 64 query heads, independent copies "
        "of attention ({{fig:v03-o013}}), sharing 8 key-value heads: grouped-query attention "
        "({{fig:v03-o089}}). So its K and V matrices are "
        f"{n(d70)} × {n(kvw)} rather than {n(d70)} × {n(d70)}. Attention falls to {att70 / 1e6:.1f} million "
        f"weights a layer, while the gated feed-forward block, 3.5 times wide, holds {ffn70 / 1e6:.1f} "
        f"million: {pct(rows[1][1])}.",
        f"An MoE layer multiplies the feed-forward side. DeepSeek V3 keeps {DS['routed']} routed experts "
        f"and one shared expert in each MoE layer, {ffn_ds / 1e9:.2f} billion weights with the router, "
        f"against {v['attn'] / 1e6:.1f} million for its attention: {pct(rows[2][1])}.",
    ])
    emit("p10", at("where most of the model lives"),
         "Modern layers lean further: 82% in a 70B model, 98% in an MoE layer", yy + 32, b + [body],
         "Bars drawn to scale. Wherever most of the weight sits is where sparsity pays, and in a modern "
         "layer that is almost all of it.")


if __name__ == "__main__":
    for fn in (p06, p07, p08, p09, p10):
        fn()
