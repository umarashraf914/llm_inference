"""V6 Part 1, the gap: P1, P2 of plans/depth_pass/V06_review.md, and Fig 03 (o003) given a new job.

  python3 figures/V06/src/gap.py      writes figures/V06/items/p01.html, p02.html, o003.html
"""
from common import (DS, at, cell, dashed, dsv3, emit, f, hd, ln, n, prose, rect, txt)

# ---- P1: a weight runs when the token's vector is multiplied by it -------------------------------
W1 = [[1, 0, 2, -1], [0, 1, 1, 0], [2, -1, 0, 1], [1, 1, 1, 1]]     # the chosen expert's matrix
W2 = [[0, 2, -1, 1], [1, 0, 0, 2], [-1, 1, 2, 0], [0, 0, 1, -1]]    # an expert this token skips
x = [1, 2, -1, 3]                                                   # the token's vector
out = [sum(w * v for w, v in zip(row, x)) for row in W1]
assert out == [-4, 1, 3, 5]
cells = sum(len(r) for r in W1)
ops = 2 * cells                                                     # one multiply-add per weight


def s(v):
    return f"{v}".replace("-", "−")


def p01():
    b = [hd(40, 46, "Running a weight means multiplying the token's vector by it")]
    CW, CH, G = 34, 26, 4
    y0 = 92
    b.append(txt(60, 78, "expert 1, chosen for this token", "sub2"))
    b.append(txt(440, 78, "expert 2, not chosen", "sub2"))
    for r in range(4):
        y = y0 + r * (CH + G)
        for c in range(4):
            b.append(cell(60 + c * (CW + G), y, CW, CH, "m", label=s(W1[r][c])))
            b.append(cell(440 + c * (CW + G), y, CW, CH, "u", label=s(W2[r][c])))
        b.append(cell(236, y, CW, CH, "u", label=s(x[r])))
        b.append(cell(298, y, 40, CH, "m", label=s(out[r])))
    ym = y0 + 2 * (CH + G) - G / 2
    b.append(txt(222, ym + 4, "×", "sub2", "middle"))
    b.append(txt(284, ym + 4, "=", "sub2", "middle"))
    yb = y0 + 4 * (CH + G) - G
    b.append(txt(236, yb + 18, "token", "sub2"))
    b.append(txt(298, yb + 18, "output", "sub2"))
    b.append(txt(60, yb + 40, f"{cells} weights, {cells} multiply-adds: {ops} operations", "sub2"))
    b.append(txt(440, yb + 40, f"{cells} weights held, 0 operations", "sub2"))
    par = lambda v: s(v) if v >= 0 else f"({s(v)})"
    terms = "\u00a0+\u00a0".join(f"{par(w)}\u00a0×\u00a0{par(v)}" for w, v in zip(W1[0], x))
    body, y = prose(yb + 96, [
        "A weight is one number in one of the model's matrices. It runs when it multiplies one entry "
        "of the token's vector and the product is added into an output: each row is lined up with the "
        f"vector, multiplied pair by pair and summed ({{{{fig:v01-o085}}}}). Row 1 gives "
        f"{terms}\u00a0=\u00a0{s(out[0])}.",
        f"Every weight of the chosen matrix takes part in exactly one multiply-add, which counts as two "
        f"operations ({{{{fig:v01-o111}}}}): {cells} weights, {ops} operations. The second matrix is "
        f"never multiplied, so it costs no arithmetic, but its {cells} numbers sit in memory all the same.",
    ])
    emit("p01", at("Push one token through it"), "A weight runs when the token's vector is multiplied by it",
         y + 32, b + [body],
         "Held and run are different counts. A dense model runs everything it holds; a mixture of experts "
         "runs a chosen few, and every cost that follows is priced in one count or the other.")


# ---- P2: held parameters cost memory; run parameters cost arithmetic ------------------------------
HELD, RUN = 671e9, 37e9                      # the published counts; P44 and P45 derive them
mem_held, mem_run = HELD * 1, RUN * 1        # FP8: one byte a parameter
ops_dense, ops_run = 2 * HELD, 2 * RUN
assert round(ops_run / 1e9) == 74 and round(ops_dense / 1e9) == 1342 and round(HELD / RUN, 1) == 18.1


def p02():
    b = [hd(40, 46, "Memory, in gigabytes at one byte a weight")]
    X0, W = 230, 400
    b.append(txt(40, 82, "held, all 671 billion", "cap"))
    b.append(cell(X0, 64, W, 28, "h", label=f"{mem_held / 1e9:,.0f} GB"))
    b.append(txt(40, 124, "read for one token", "cap"))
    w = mem_run / mem_held * W
    b.append(rect(X0, 106, w, 28, "m"))
    b.append(txt(X0 + w + 10, 124, f"{mem_run / 1e9:.0f} GB", "sub2"))
    b.append(hd(40, 184, "Arithmetic, in billions of operations per token"))
    b.append(txt(40, 220, "if all 671 billion ran", "cap"))
    b.append(dashed(X0, 202, W, 28))
    b.append(txt(X0 + W / 2, 220, f"{ops_dense / 1e9:,.0f} billion, as a dense model would", "sub2", "middle"))
    b.append(txt(40, 262, "with 37 billion running", "cap"))
    w = ops_run / ops_dense * W
    b.append(rect(X0, 244, w, 28, "m"))
    b.append(txt(X0 + w + 10, 262, f"{ops_run / 1e9:.0f} billion", "sub2"))
    body, y = prose(318, [
        "Memory is set by what is held: parameters × bytes per parameter ({{fig:v01-o105}}). At FP8, "
        f"one byte each, {HELD / 1e9:.0f} billion parameters fill {mem_held / 1e9:.0f} GB, whichever "
        "experts a token happens to pick.",
        f"Arithmetic is set by what runs: two operations per parameter used ({{{{fig:v01-o114}}}}). "
        f"A token runs {RUN / 1e9:.0f} billion, so 2 × {RUN / 1e9:.0f} billion = {ops_run / 1e9:.0f} billion "
        f"operations. Were all {HELD / 1e9:.0f} billion to run, as in a dense model, it would be "
        f"{ops_dense / 1e9:,.0f} billion.",
        f"Both pairs differ by the same factor, {HELD / 1e9:.0f} / {RUN / 1e9:.0f} = {HELD / RUN:.1f}: the "
        "one-eighteenth of {{fig:v06-o002}}.",
    ])
    emit("p02", at("That gap between what the model holds"),
         "Held parameters cost memory; run parameters cost arithmetic", y + 32, b + [body],
         "Each pair is drawn to its own scale. Sparsity shrinks what a token reads and computes; the "
         "671 GB held does not shrink at all, and that bill comes due when the model is served.")


# ---- Fig 03, new job: the two dials, with dense as N = K = 1 --------------------------------------
def o003():
    b = [hd(40, 46, "N networks held in each layer, K of them run for each token")]
    rows = [("dense, N = K = 1", 1, [0]), ("Mixtral, N = 8, K = 2", 8, [1, 5])]
    y = 70
    for lab, N, lit in rows:
        b.append(txt(40, y + 19, lab, "cap"))
        for i in range(N):
            b.append(cell(250 + i * 46, y, 40, 28, "m" if i in lit else "u"))
        y += 48
    # DeepSeek V3: 256 routed experts as a 32 x 8 block, eight lit, plus the shared one
    N, K = DS["routed"], DS["k"]
    lit = [9, 38, 77, 120, 141, 186, 203, 250]          # any eight: which ones depends on the token
    assert len(set(lit)) == K and max(lit) < N
    b.append(txt(40, y + 19, f"DeepSeek V3, N = {N}, K = {K}", "cap"))
    CW, CH, G = 9, 9, 2
    for i in range(N):
        r, c = divmod(i, 32)
        b.append(rect(250 + c * (CW + G), y + 2 + r * (CH + G), CW, CH, "m" if i in lit else "u", rx=1))
    yb = y + 2 + 8 * (CH + G) - G
    b.append(txt(250, yb + 20, f"{N} routed experts, {K} lit; one more, the shared expert, always runs",
                 "sub2"))
    body, yy = prose(yb + 62, [
        "How much a model can know grows with what it holds; what each token costs grows with what "
        "runs. A dense layer has one feed-forward network and runs it for every token, so the two "
        "numbers are the same and can only grow together.",
        "A mixture of experts holds N networks in each layer and runs K of them for each token. N "
        "sets the memory, K sets the work, and the two can now be turned separately: Mixtral holds "
        "eight and runs two, DeepSeek V3 holds 256 and runs eight.",
    ])
    emit("o003", at("A dense model multiplies every token"), "Two things a dense model welds together",
         yy + 32, b + [body],
         "Dense is the special case N = K = 1. The rest of this atlas is about what happens when N "
         "grows far faster than K, and who pays for the difference.")


if __name__ == "__main__":
    for fn in (p01, p02, o003):
        fn()
