"""V3 Part 5, tiling: §5d merges 35+36, 40+41 and 10 into 42; review #9 and #10; §5a items 3 and 4 (the
loop order and Fig 43's 24x); the animation link where tiling is introduced (brief, V3 item 3).

  o035  a block of the product needs only a strip of each input (merges o036)
  p09   one block of a product, computed from two strips (10:40)
  p10   the first version's loop order: Q and O make a trip for every block of K and V (10:58)
  o040  SRAM is a window, not a destination (merges o041)
  o042  the working set, defined and drawn to scale against 228 KB (merges o010)
  o043  how much tiling saves: n²d²/M, derived and bounded by the measurement
  patches: o034, o037 (animation link), o038 restamped

  python3 figures/V03/src/tiling.py
"""
from common import *  # noqa: F401,F403

n, d, B = 8192, 64, 128
NB = n // B                                     # 64 blocks of 128 rows
ROW = n * d * 2                                 # one n x d matrix in FP16, bytes


# ---- o035: strips ---------------------------------------------------------------------------------
def o035():
    b = [hd(40, 46, "A block of the answer needs only a strip of each input")]
    S = 132
    b.append(cell(60, 70, S, S, "s"))
    b.append(cell(60, 70, S, 30, "m", label="rows i"))
    b.append(txt(60 + S + 18, 70 + S / 2 + 4, "×", "lbl", "middle"))
    b.append(cell(228, 70, S, S, "s"))
    b.append(cell(228, 70, 30, S, "m"))
    b.append(txt(228 + S + 18, 70 + S / 2 + 4, "=", "lbl", "middle"))
    b.append(cell(396, 70, S, S, "u"))
    b.append(cell(396, 70, 30, 30, "m"))
    b.append(txt(60, 222, "A: one strip of rows", "sub2"))
    b.append(txt(228, 222, "B: one strip of columns", "sub2"))
    b.append(txt(396, 222, "C: the block where they cross", "sub2"))
    body, yb = prose(262, [
        "Every entry of C = A × B is a row of A dotted with a column of B ({{fig:v03-n07}}). So a whole "
        "block of C, the entries where a band of rows meets a band of columns, needs only that strip of A "
        "and that strip of B. Nothing outside the two strips affects it.",
        "The strips can therefore be brought onto the chip on their own, the block computed, and both "
        "discarded. Repeat for every block and the whole product is built without either input ever being "
        "present in full. Every large matrix multiply on a GPU is done this way, the one in "
        "{{fig:v03-p01}} included; attention is not a special case.",
    ])
    figure("o035", st("decomposes cleanly into blocks"), "Why the computation can be cut up", yb + 30,
           b + [body],
           esc("The mathematical permission for tiling, and a property of multiplication itself. FlashAttention "
               "exploits it; it did not invent it."))


# ---- p09: one block, worked --------------------------------------------------------------------------
def mm(X, Y):
    return [[sum(X[i][k] * Y[k][j] for k in range(len(Y))) for j in range(len(Y[0]))] for i in range(len(X))]


def p09():
    A = [[1, 2, 0, 1], [0, 1, 3, 2], [2, 0, 1, 1], [1, 1, 0, 2]]
    Bm = [[1, 0, 2, 1], [0, 1, 1, 0], [1, 2, 0, 1], [2, 1, 1, 0]]
    C = mm(A, Bm)
    blk = lambda M, r, c: [row[c:c + 2] for row in M[r:r + 2]]
    A11, A12, B11, B21 = blk(A, 0, 0), blk(A, 0, 2), blk(Bm, 0, 0), blk(Bm, 2, 0)
    P1, P2 = mm(A11, B11), mm(A12, B21)
    C11 = [[P1[i][j] + P2[i][j] for j in range(2)] for i in range(2)]
    assert C11 == [[3, 3], [7, 9]] == blk(C, 0, 0) and P2 == [[2, 1], [7, 8]]
    b = [hd(40, 46, "The top-left block of C, from the top strip of A and the left strip of B")]
    W = 26

    def grid(x0, y0, M, hi, name):
        o = [txt(x0, y0 - 10, name, "sub2")]
        for i in range(4):
            for j in range(4):
                cls = hi(i, j)
                o.append(cell(x0 + j * (W + 3), y0 + i * (W + 3), W, W, cls, label=str(M[i][j])))
        return "".join(o)
    b.append(grid(40, 84, A, lambda i, j: ("m" if j < 2 else "s") if i < 2 else "u", "A"))
    b.append(grid(200, 84, Bm, lambda i, j: ("m" if i < 2 else "s") if j < 2 else "u", "B"))
    b.append(grid(360, 84, C, lambda i, j: "h" if i < 2 and j < 2 else "u", "C = A × B, in full"))
    b.append(txt(520, 104, "gold: first pieces", "sub2"))
    b.append(txt(520, 122, "teal: second pieces", "sub2"))
    b.append(txt(520, 140, "red: the block", "sub2"))

    def mat(M):
        return " ".join("(" + ", ".join(str(v) for v in r) + ")" for r in M)
    y = 84 + 4 * (W + 3) + 34
    lines = [("first pieces", f"{mat(A11)} × {mat(B11)}  =  {mat(P1)}"),
             ("second pieces", f"{mat(A12)} × {mat(B21)}  =  {mat(P2)}"),
             ("add", f"{mat(P1)} + {mat(P2)}  =  {mat(C11)}")]
    for k, (lab, s) in enumerate(lines):
        b.append(txt(40, y + k * 26, lab, "cap"))
        b.append(txt(160, y + k * 26, s, "sub2"))
    body, yb = prose(y + 3 * 26 + 30, [
        "Each pair of brackets is one row of a 2 × 2 piece. The block needs rows 1–2 of A and columns 1–2 "
        "of B. Cut each strip into two 2 × 2 pieces, multiply the gold pieces together and the teal pieces "
        "together, and add: the result is exactly the top-left corner of the full product.",
        "Nothing else was needed, and the two piece-products did not have to be present at the same time: "
        "the first can be added into a running total, and the second added when it arrives. That running "
        "total is called an accumulator, and it is how a tiled kernel builds a block from pieces that "
        "stream past.",
    ])
    figure("p09", st("decomposes cleanly into blocks"), "One block of a product, computed from two strips",
           yb + 30, b + [body],
           esc("Checked against the full product. Two strips in, one block out, and each strip can arrive a "
               "piece at a time: the whole of tiling, on sixteen numbers."))


# ---- p10: the first version's loop order --------------------------------------------------------------
def fa1_traffic():
    kv = 2 * ROW                                  # K and V read once
    q = NB * ROW                                  # Q block i read on every outer step
    o = 2 * NB * ROW                              # O block i read and written on every outer step (16-bit)
    ml = 2 * NB * n * 2 * 4                       # m and l, FP32, read and written on every outer step
    return kv, q, o, ml


def p10():
    kv, q, o, ml = fa1_traffic()
    total = kv + q + o + ml
    naive = 4 * ROW + 4 * n * n * 2
    floor = 4 * ROW
    assert NB == 64 and round((kv + q + o) / 1e6, 1) == 203.4 and round(total / 1e6, 1) == 211.8
    assert round(naive / total, 1) == 2.6 and round(total / floor) == 50
    b = [hd(40, 46, "The order of the published algorithm: K and V outside, Q inside")]
    b.append(cont(40, 62, 600, 196, "u", f"for each block of K and V: {NB} times"))
    b.append(cell(62, 102, 556, 26, "s", label="load this block of K and V: once, for good"))
    b.append(cont(62, 138, 556, 108, "u", f"for each block of Q: {NB} times, inside every outer step"))
    b.append(cell(84, 174, 160, 56, "h", label="read Qᵢ, Oᵢ, m, l"))
    b.append(arr(250, 202, 266, 202))
    b.append(cell(272, 174, 170, 56, "m", label="fold the S tile in, on chip"))
    b.append(arr(448, 202, 464, 202))
    b.append(cell(470, 174, 126, 56, "h", label="write Oᵢ, m, l"))
    # traffic, to scale
    SC = 360 / naive
    y0 = 288
    b.append(hd(40, y0, f"HBM traffic, one head, {n:,} tokens, d = {d}, blocks of {B}"))
    rows = [("three kernels", naive, "h"), ("this loop order", total, "h"), ("every byte once", floor, "s")]
    for k, (lab, v, cls) in enumerate(rows):
        y = y0 + 18 + k * 36
        b.append(txt(40, y + 19, lab, "cap"))
        b.append(cell(200, y + 2, max(v * SC, 2), 24, cls))
        b.append(txt(200 + max(v * SC, 2) + 8, y + 19, f"{v / 1e6:.1f} MB", "sub2"))
    body, yb = prose(y0 + 18 + 3 * 36 + 34, [
        "This is the loop of the paper's algorithm: load one block of K and V, then sweep every block of "
        "Q past it. Each K and V block is read once. But the running "
        "output Oᵢ for a block of queries cannot stay on the chip: the next visit to block i comes only "
        f"after the other {NB - 1} Q blocks have had their turn. So every inner step reads Qᵢ, Oᵢ and the "
        "two running numbers per row that Part 7 explains, and writes Oᵢ and those numbers back.",
        f"Counted from the algorithm, with O kept in 16-bit between visits: K and V {kv / 1e6:.1f} MB, Q "
        f"read {NB} times {q / 1e6:.1f} MB, O read and written {NB} times {o / 1e6:.1f} MB, the statistics "
        f"{ml / 1e6:.1f} MB. {total / 1e6:.0f} MB in all: {naive / total:.1f} times less than three kernels, "
        f"because S never moves, and {total / floor:.0f} times the floor of touching each input once.",
    ])
    figure("p10", st("folds the partial result"),
           "In the first version, Q and O make a trip for every block of K and V", yb + 30, b + [body],
           esc("S is gone, but the bill did not vanish with it: it became repeated trips for Q and for the "
               "output. Bigger blocks mean fewer trips, and which matrix makes the trips is a choice; "
               f"version 2 makes the other one (Part {PART['fa2']})."))


# ---- o040: a window, not a destination ------------------------------------------------------------------
def o040():
    b = [hd(40, 46, f"K in HBM: {n:,} rows in {NB} blocks of {B}; one block on the chip at a time")]
    X0, W = 104, 536
    cw = W / NB
    for step, j in enumerate((0, 1, 2)):
        y = 70 + step * 58
        b.append(txt(40, y + 16, f"step {step + 1}", "cap"))
        for k in range(NB):
            b.append(cell(X0 + k * cw, y, cw - 1.5, 22, "s" if k == j else "h", rx=1))
        b.append(txt(X0 + j * cw, y + 38, "↑ on chip", "sub2", "start"))
    yb0 = 70 + 3 * 58 + 18
    body, yb = prose(yb0, [
        f"At any instant one block of K, {B} rows of {d} numbers, is on the chip. It is used, and the next "
        f"block overwrites it in the same space. The other {NB - 1} blocks never move while it is in use.",
        "So SRAM is not a destination the matrix is copied to. It is a window the matrix passes through, "
        "and the same few kilobytes serve all of it over time. Asking where a tiled matrix goes has no "
        "answer: it never goes anywhere; its blocks take turns.",
    ])
    figure("o040", st("Each tile of S lives briefly"), "SRAM is a window, not a destination", yb + 30,
           b + [body],
           esc("Replace the picture of copying with the picture of taking turns, and the working-set "
               "arithmetic in the next figure becomes obvious."))


# ---- o042: the working set, to scale --------------------------------------------------------------------
def o042():
    parts = [("Q block", B * d * 2, "s", f"{B} × {d}"), ("K block", B * d * 2, "h", f"{B} × {d}"),
             ("V block", B * d * 2, "h", f"{B} × {d}"), ("S tile", B * B * 2, "m", f"{B} × {B}"),
             ("O accumulator", B * d * 4, "s", f"{B} × {d}, FP32"), ("m and l", B * 2 * 4, "s", f"{B} rows, FP32")]
    total = sum(p[1] for p in parts)
    assert total == 115712 and round(total / 1024) == 113 and H100_SMEM == 233472
    b = [hd(40, 46, "A working set: everything the current step needs within reach at once")]
    SC = 560 / H100_SMEM
    b.append(f'<rect x="40" y="70" width="{H100_SMEM * SC:.1f}" height="34" rx="3" fill="none" '
             f'stroke="var(--rule)" stroke-dasharray="3 3"/>')
    x = 40
    for name, v, cls, shape in parts:
        b.append(cell(x, 70, v * SC, 34, cls, rx=1))
        x += v * SC
    b.append(txt(40 + H100_SMEM * SC, 124, "228 KB of shared memory", "sub2", "end"))
    b.append(txt(40, 124, f"{total / 1024:.0f} KB in use", "sub2"))
    for k, (name, v, cls, shape) in enumerate(parts):
        y = 158 + k * 22
        b.append(cell(40, y - 11, 12, 12, cls, rx=2))
        b.append(txt(60, y, name, "cap"))
        b.append(txt(200, y, shape, "sub2"))
        b.append(txt(360, y, f"{v / 1024:g} KB", "sub2", "end"))
    body, yb = prose(158 + 6 * 22 + 26, [
        "Not everything the computation touches: only what one step needs at the same moment, because "
        f"that is what has to fit. With blocks of {B} and head dimension {d}, one step needs a block each of "
        "Q, K and V, the tile of scores they make, the running output, and two numbers per row. Drawn end "
        f"to end that is {total / 1024:.0f} KB, inside the 228 KB of shared memory one multiprocessor has.",
        f"The n × n matrix that would have been {n * n * 2 / 1e6:.0f} MB for this head never exists as a "
        "whole. In a real kernel the S tile and the output accumulator usually sit in the registers, the "
        "multiprocessor's other on-chip store ({{fig:v02-o030}}); the budget arithmetic is the same.",
    ])
    figure("o042", st("Each tile of S lives briefly"), "What is in SRAM at any one instant", yb + 30,
           b + [body],
           esc("Bars to scale against the budget. Too large a block and the list spills; too small and the "
               "same data is fetched again and again. Choosing the block size is the act of making this list "
               "fit."))


# ---- o043: how the saving scales -------------------------------------------------------------------------
def o043():
    # the paper: standard attention Theta(N d + N^2) HBM accesses, FlashAttention Theta(N^2 d^2 / M)
    rel = {(dd, mm_): (dd / 64) ** 2 / (mm_ / 100) for dd in (64, 128) for mm_ in (100, 200)}
    assert rel[(128, 100)] == 4 and rel[(64, 200)] == 0.5
    b = [hd(40, 46, "Where n² d² / M comes from, step by step")]
    steps = [("a block of K and V must fit", "block rows × d: a share of M", "rows go as M ÷ d"),
             ("the number of trips", "n ÷ block rows", "goes as n·d ÷ M"),
             ("each trip moves Q and O once", "about n·d numbers", ""),
             ("traffic", "trips × n·d", "goes as n²·d² ÷ M")]
    for k, (lab, mid, res) in enumerate(steps):
        y = 66 + k * 40
        b.append(txt(40, y + 20, lab, "cap"))
        b.append(cell(250, y, 220, 30, "u" if k < 3 else "m", label=mid))
        if res:
            b.append(txt(484, y + 20, res, "sub2"))
    y2 = 66 + 4 * 40 + 22
    b.append(txt(40, y2, "double the SRAM:", "cap"))
    b.append(txt(250, y2, "half the traffic", "sub2"))
    b.append(txt(40, y2 + 24, "double the head dimension:", "cap"))
    b.append(txt(250, y2 + 24, "four times the traffic, at the same SRAM", "sub2"))
    body, yb = prose(y2 + 64, [
        "The paper proves that standard attention needs on the order of N·d + N² HBM accesses and its "
        "algorithm on the order of N²·d² ÷ M, for SRAM of size M. The steps above are where that comes from: "
        "the blocks must fit, so their size is set by M ÷ d, and every trip costs a full pass over n·d "
        "numbers.",
        "So the saving over the n² of the naive kernel goes as M ÷ d²: it grows in proportion to on-chip "
        "memory and falls with the square of the head size. The constants are dropped, so this predicts how "
        "the saving moves, not its size; a direct count at one size is the previous figures' job, and the "
        "paper's measurement on GPT-2 medium found 9.2 times less traffic in all ({{fig:v03-o003}}).",
        "That measurement is a whole training step, whose standard attention also writes masked and "
        "dropped-out copies of the score matrix (the paper's Figure 1 shows those passes), so its saving is "
        "not the count for one plain head.",
    ])
    figure("o043", st("Each tile of S lives briefly"), "How much tiling saves depends on the SRAM and the head size",
           yb + 30, b + [body],
           esc("Tiling does not make attention's traffic linear in n: it is still n², with a smaller constant. "
               "Every later generation fights for on-chip memory because M is the lever in that constant."))


def patches():
    patch("o034", [], stamp_to=st("decomposes cleanly into blocks"))
    patch("o037", [("<figcaption>The n squared object still exists in full. It just never exists all at once, anywhere.</figcaption>",
                    "<figcaption>" + esc("The n squared object still exists in full. It just never exists all at "
                                         "once, anywhere. Watch it happen on four tokens in ")
                    + anim_link("the companion animation") + esc(", where the fused kernel's panel never writes a "
                                                                   "score to HBM.") + "</figcaption>")],
          stamp_to=st("This is called tiling"))
    patch("o038", [], stamp_to=st("folds the partial result"))


if __name__ == "__main__":
    for fn in (o035, p09, p10, o040, o042, o043, patches):
        fn()
