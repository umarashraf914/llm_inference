"""V2 Part 12, the tensor core: review proposals 23-25, Figs 80 and 81 merged, Fig 79's caption and
operand note, Fig 82 restamped.

  python3 figures/V02/src/tensor.py     writes p23 p24 p25; edits o079 o080 o082
"""
from common import *  # noqa: F401,F403

A2 = [[1, 2], [3, 4]]
B2 = [[5, 6], [7, 8]]


def matmul(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(len(b))) for j in range(len(b[0]))] for i in range(len(a))]


C2 = matmul(A2, B2)
assert C2 == [[19, 22], [43, 50]]


def grid(b, x0, y0, m, cs, hot=lambda i, j: False, cls="u", hcls="m", label=lambda i, j: None, gap=4):
    for i in range(len(m) if m else 0):
        for j in range(len(m[0])):
            b.append(cell(x0 + j * (cs + gap), y0 + i * (cs + gap), cs, cs, hcls if hot(i, j) else cls,
                          label=label(i, j)))


# ---- p23: matrix times matrix --------------------------------------------------------------------
def p23():
    b = [hd(40, 46, "Row 1 of A meets column 1 of B: multiply the pairs, add, and that is one entry")]
    CS = 40
    BX, BY, AX, AY = 250, 66, 130, 166
    grid(b, BX, BY, B2, CS, hot=lambda i, j: j == 0, cls="s", label=lambda i, j: str(B2[i][j]))
    grid(b, AX, AY, A2, CS, hot=lambda i, j: i == 0, cls="s", label=lambda i, j: str(A2[i][j]))
    grid(b, BX, AY, C2, CS, hot=lambda i, j: (i, j) == (0, 0), cls="u", label=lambda i, j: str(C2[i][j]))
    b.append(txt(BX + 2 * (CS + 4) + 8, BY + 48, "B", "sub2"))
    b.append(txt(AX - 18, AY + 48, "A", "sub2"))
    b.append(txt(BX + 2 * (CS + 4) + 8, AY + 48, "C = A × B", "sub2"))
    rows = [f"c11  =  1 × 5  +  2 × 7  =  {C2[0][0]}", f"c12  =  1 × 6  +  2 × 8  =  {C2[0][1]}",
            f"c21  =  3 × 5  +  4 × 7  =  {C2[1][0]}", f"c22  =  3 × 6  +  4 × 8  =  {C2[1][1]}"]
    for k, s_ in enumerate(rows):
        b.append(cell(420, 112 + k * 34, 220, 28, "m" if k == 0 else "u", rx=5, label=s_))
    n_ma, n_in = 2 * 2 * 2, 2 * 2 * 2
    assert n_ma == 8 and n_in == 8
    body, yb = prose(AY + 2 * (CS + 4) + 40, [
        "To multiply two matrices, every row of the first meets every column of the second. Multiply the "
        "pairs, add the products, and the sum is one entry of the answer: row 1 of A against column 1 of B "
        "gives 1 × 5 + 2 × 7 = 19.",
        "Two 2 × 2 matrices take 8 multiply-adds, and every number is used twice: the 1 meets both the 5 "
        "and the 6. For two n × n matrices it is n³ multiply-adds from 2n² numbers, so every number is "
        "used n times.",
        "A matrix times a vector is the case where B has one column ({fig}): each weight meets one number "
        "and is used once. That is decode. A prompt of many tokens makes B a matrix with a column per "
        "token, and every weight is used once per token.".replace("{fig}", "{{fig:v01-o085}}"),
    ])
    emit("p23", stamp(SRT, "we said we'd come back to the tensor cores"),
         "Multiplying two matrices is every row meeting every column", yb + 24, b + [body],
         "Matrix × matrix is matrix × vector done for many vectors at once. The reuse that brings is the "
         "whole difference between prefill and decode, and the whole reason for the tensor core.")


# ---- p24: inside one 4 x 4 x 4 tensor-core step ----------------------------------------------------
def p24():
    n = 4
    mas, ins = n ** 3, 2 * n * n
    volta, hopper = 64, 512                        # A100WP: V100 TC 64 FMA/clock (4x4x4); H100: 512 (see p05)
    m16 = 16 * 8 * 16
    assert mas == volta == 64 and ins == 32 and m16 == 2048 and m16 // hopper == 4
    b = [hd(40, 46, "D = A × B + C on a 4 × 4 tile, with one entry traced")]
    CS, G = 22, 3
    W4 = 4 * CS + 3 * G
    xs = [40, 40 + W4 + 30, 40 + 2 * (W4 + 30), 40 + 3 * (W4 + 30)]
    y0 = 84
    I, J = 1, 2                                     # d23
    names = ["A", "B", "C", "D"]
    hot = [lambda i, j: i == I, lambda i, j: j == J, lambda i, j: (i, j) == (I, J), lambda i, j: (i, j) == (I, J)]
    for k, (x, nm) in enumerate(zip(xs, names)):
        dummy = [[0] * 4 for _ in range(4)]
        grid(b, x, y0, dummy, CS, hot=hot[k], cls="s" if k < 2 else "u", gap=G)
        b.append(txt(x, y0 - 8, nm, "sub2"))
    for k, op in enumerate(["×", "+", "="]):
        b.append(txt(xs[k] + W4 + 15, y0 + W4 / 2 + 5, op, "hd", "middle"))
    b.append(eq(40, y0 + W4 + 26, 600, "d23  =  a21·b13  +  a22·b23  +  a23·b33  +  a24·b43  +  c23"))
    yt = y0 + W4 + 26 + 42 + 22
    rows = [("one 4 × 4 × 4 step", f"{mas} multiply-adds from {ins} numbers: each used 4 times"),
            ("Volta's tensor core, 2017", f"exactly this step, {volta} multiply-adds every tick"),
            ("Hopper's tensor core", f"{hopper} multiply-adds every tick"),
            ("one warp instruction", f"16 × 8 × 16 = {m16:,} multiply-adds: {m16 // hopper} ticks of one core")]
    for k, (lab, s_) in enumerate(rows):
        y = yt + k * 34
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(cell(230, y, 410, 26, "m" if k == 0 else "u", rx=5, label=s_))
    body, yb = prose(yt + 4 * 34 + 30, [
        "Each of the 16 entries of D is a row of A against a column of B, four multiply-adds, plus the "
        "matching entry of C: 64 multiply-adds in all. Every number of A and B is used four times, once "
        "for each entry in its row or column of D.",
        "The first tensor cores, in Volta, did exactly one such 4 × 4 × 4 step per tick. Hopper's does "
        "512 multiply-adds a tick, so a warp's 16 × 8 × 16 instruction, 2,048 multiply-adds, keeps one "
        "tensor core busy for four ticks.",
    ])
    emit("p24", stamp(SRT, "multiplies two small matrices"),
         "Inside one tensor-core step: a 4 × 4 tile, 64 multiply-adds, every number used four times",
         yb + 24, b + [body],
         "What “a whole tile at once” means, counted. Volta's rate and the 16 × 8 × 16 shape are from "
         "NVIDIA's A100 whitepaper; Hopper's rate is the one behind the 989.4 trillion.")


# ---- p25: bigger tiles feed themselves -------------------------------------------------------------
def p25():
    tiles = [2, 4, 16, 128]
    uses = {n: n for n in tiles}                           # each number meets n others
    opb = {n: 2 * n ** 3 / (2 * n * n * 2) for n in tiles}  # FLOP per byte of inputs at 16 bits = n / 2
    assert [opb[n] for n in tiles] == [1, 2, 8, 64]
    b = [hd(40, 46, "Times each fetched number is used, for an n × n × n tile (log axis)")]
    X0, X1 = 200, 560
    for k, n in enumerate(tiles):
        y = 64 + k * 40
        w = logx(uses[n], 1, 200, X0, X1) - X0
        b.append(txt(40, y + 18, f"tile {n} × {n}", "cap"))
        note = f"{uses[n]} uses; {opb[n]:g} operation{'s' if opb[n] != 1 else ''} per byte"
        if w > tw(note) + 30:
            b.append(cell(X0, y, w, 26, "m", label=note))
        else:
            b.append(rect(X0, y, w, 26, "m"))
            b.append(txt(X0 + w + 10, y + 18, note, "sub2"))
    ax = 64 + 4 * 40 + 2
    b.append(ln(X0, ax, X1, ax, "axis"))
    for v in (1, 10, 100):
        b.append(vline(logx(v, 1, 200, X0, X1), ax, ax + 5))
        b.append(txt(round(logx(v, 1, 200, X0, X1), 1), ax + 19, f"{v}", "sub2", "middle"))
    body, yb = prose(ax + 56, [
        "An n × n × n tile does n³ multiply-adds on 2n² numbers, so every number fetched is used n times, "
        "and at 2 bytes a number the tile does n ÷ 2 operations for each byte it brings in.",
        "Double the tile and the reuse doubles. That is why tensor cores work on tiles, why kernels stage "
        "large tiles in shared memory, and why prefill, whose many tokens make a wide tile, runs on the "
        "compute side of the ridge while decode, a tile one column wide, cannot.",
    ])
    emit("p25", stamp(SRT, "matrix multiply accumulate"), "Bigger tiles feed themselves: each number fetched is used n times",
         yb + 24, b + [body],
         "Reuse is a property of the shape, not of the chip. The same arithmetic returns as the systolic "
         "array in Part 15, which is a tile made of hardware.")


def fixes():
    edit_item("o079", from_y=220, paras=[
        "All four operands are small matrices. The instruction issues once and the hardware performs every "
        "multiply and add inside the tile. In the older warp-wide form the operands sit in registers; "
        "Hopper's newer form can read A and B straight from shared memory.",
        "The accumulator, C and then D, is usually kept at higher precision than A and B, so that a long "
        "chain of accumulations does not lose information.",
    ], caption="One instruction, thousands of multiply-adds: a warp's 16 × 8 × 16 step is 2,048. That density "
               "is why four tensor cores outproduce 128 scalar cores more than sevenfold at 16 bits.")
    edit_item("o080", from_y=156, paras=[
        "Well over ninety percent. The remainder is additions, normalisations and the activation function, "
        "all of which are cheap and none of which dominate.",
        "A chip that did matrix multiplication superbly and everything else merely adequately would "
        "therefore be almost as good as one that did everything superbly, and much cheaper to build. The "
        "H100 has 528 such units, four per multiprocessor.",
        "It also explains the risk: a model whose arithmetic looked different would leave most of this chip "
        "idle.",
    ])
    edit_item("o082", ts=stamp(SRT, "One caveat"), from_y=272, paras=[
        "Peak assumes every unit fed every cycle with no stalls, no divergence and no waiting on memory. "
        "Nothing achieves it and nothing is meant to.",
        "The gap between the first bar and the second is the subject of the next atlas, on kernels.",
        "So a chip is best compared with another chip on peak, and a program is best compared with itself "
        "on the fraction of peak it reaches.",
    ])


if __name__ == "__main__":
    p23()
    p24()
    p25()
    fixes()
