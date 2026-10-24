"""V5 Part 3, tensor parallelism from the floor: N9-N18 of plans/depth_pass/V05_review.md, with Fig 9
rebuilt as the assembled block (placed after N13) and Fig 10 rebuilt as a lane chart.

The worked example is a 2-number token, a 2 × 4 matrix A and a 4 × 2 matrix B, small enough to do in
your head; the priced numbers are the 70B from V1 on eight H100s.

  python3 figures/V05/src/part3_tensor.py     writes items n9-n18, o009, o010
"""
import json
from v05common import *  # noqa: F401,F403

# ---- the worked example ---------------------------------------------------------------------------
X = [1, 2]
A = [[1, 0, 2, 1], [0, 1, 1, 3]]
B = [[1, 0], [0, 1], [1, 1], [2, -1]]
H = [sum(X[i] * A[i][j] for i in range(2)) for j in range(4)]                  # x times A
P1 = [sum(H[i] * B[i][j] for i in (0, 1)) for j in range(2)]                   # GPU 1's rows of B
P2 = [sum(H[i] * B[i][j] for i in (2, 3)) for j in range(2)]                   # GPU 2's rows of B
Y = [a + b for a, b in zip(P1, P2)]
R1 = [X[0] * a for a in A[0]]                                                  # A split by rows
R2 = [X[1] * a for a in A[1]]
BEND_THEN_ADD = [gelu(a) + gelu(b) for a, b in zip(R1, R2)]
BEND_OF_SUM = [gelu(v) for v in H]
assert H == [1, 2, 4, 7] and P1 == [1, 2] and P2 == [18, -3] and Y == [19, -1]
assert Y == [sum(H[i] * B[i][j] for i in range(4)) for j in range(2)]
assert [a + b for a, b in zip(R1, R2)] == H
assert [f(v) for v in BEND_THEN_ADD] == ["0.84", "1.95", "3.91", "6.84"]
assert [f(v) for v in BEND_OF_SUM] == ["0.84", "1.95", "4.00", "7.00"]
assert f(gelu(1) + gelu(6)) == "6.84" and f(gelu(7)) == "7.00"

# ---- the priced example: one 70B layer group on eight H100s ---------------------------------------
TP = 8
AR_PER_LAYER, AR_PER_TOKEN = 2, 2 * LAYERS
RING = 2 * (TP - 1) / TP
assert AR_PER_TOKEN == 160 and RING == 1.75


def vec_list(v, d=None):
    return "[" + " ".join(f(a, d) if d is not None else n(a) for a in v) + "]"


def box2(x, y, w, h, cls, l1, l2=None):
    """A box holding one or two centred lines of sub text."""
    o = f'<g class="{cls}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4"/>'
    lines = [l1] if l2 is None else [l1, l2]
    for k, s in enumerate(lines):
        yy = y + h / 2 + (0 if l2 is None else (-8 if k == 0 else 8))
        o += (f'<text class="sub" x="{x + w / 2}" y="{yy}" text-anchor="middle" '
              f'dominant-baseline="central">{esc(s)}</text>')
    return o + "</g>"


# ---- N9: the feed-forward block ------------------------------------------------------------------
def n9():
    d, wide = HIDDEN, 4 * HIDDEN
    assert wide == 32_768
    X0, PX = 160, 100 / d                              # px per number
    b = [hd(40, 40, "One token through a feed-forward block, widths to scale")]
    rows = [(58, "the token's vector", d, "u", f"{n(d)} numbers"),
            (118, "four times wider", wide, "m", f"{n(wide)} numbers"),
            (178, "each one bent", wide, "m", f"{n(wide)} numbers, each bent on its own"),
            (238, "back to its width", d, "u", f"{n(d)} numbers")]
    for y, lab, v, c, inside in rows:
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(cell(X0, y, v * PX, 26, c, label=inside))
    steps = [(88, f"× A: {n(d)} rows × {n(wide)} columns"), (148, "GELU, number by number"),
             (208, f"× B: {n(wide)} rows × {n(d)} columns")]
    for y, s in steps:
        b.append(arr(X0 + 50, y + 2, X0 + 50, y + 26))
        b.append(txt(X0 + 64, y + 18, s, "sub2"))
    body, yb = prose(306, [
        "Megatron-LM, Nvidia's model-parallel training framework, defined the standard recipe: "
        "tensor parallelism. Split each weight matrix across GPUs, so one matrix multiply becomes "
        "several partial ones running at once.",
        "The first block it splits is the feed-forward network, the half of each layer that treats "
        "every token alone ({{fig:v01-o091}}). It is two matrices with a bend between them: A widens "
        "the token's vector, GELU bends each of the wider vector's numbers, and B narrows the result "
        "back to its original width.",
        "Drawn here at the 70B's width of 8,192 with a four-times widening, as in the original "
        "Transformer, which went from 512 to 2,048. The 70B's own block uses three matrices and "
        f"splits the same way ({fwd('n14', 'below')}).",
    ])
    emit("n9", stamp(SRT, "Megatron-LM,"), "A feed-forward block widens, bends, then narrows",
         yb + 26, b + [body],
         "Widths to scale. How A and B can be split is decided by the bend in the middle, so the bend "
         "comes first.")


# ---- N10: GELU -----------------------------------------------------------------------------------
def n10():
    L, R, T, Bt = 64, 324, 60, 236                     # plot box: x from -3 to 3, y from -0.5 to 3
    px = lambda v: L + (v + 3) / 6 * (R - L)
    py = lambda v: Bt - (v + 0.5) / 3.5 * (Bt - T)
    b = [hd(40, 40, "GELU(x) = x × Φ(x), drawn for x from −3 to 3")]
    b.append(ln(L, py(0), R, py(0), "axis"))
    b.append(ln(px(0), T, px(0), Bt, "axis"))
    for v in (-3, -2, -1, 1, 2, 3):
        b.append(ln(px(v), py(0), px(v), py(0) + 4, "tick"))
        b.append(txt(px(v), py(0) + 20, str(v).replace("-", "−"), "sub2 halo", "middle"))
    for v in (1, 2, 3):
        b.append(txt(px(0) - 7, py(v) + 4, str(v), "sub2", "end"))
    guide = [(px(v), py(v)) for v in (-0.5, 3)]
    b.append(f'<line class="axis" x1="{guide[0][0]:.1f}" y1="{guide[0][1]:.1f}" x2="{guide[1][0]:.1f}" '
             f'y2="{guide[1][1]:.1f}" stroke-dasharray="4 3"/>')
    b.append(txt(px(2.55), py(2.95) - 2, "y = x", "sub2 halo", "end"))
    b.append(poly([(px(v), py(gelu(v))) for v in [i / 20 for i in range(-60, 61)]]))
    offs = {-2: (0, -11), -1: (0, -11), 0: (-10, -9), 1: (10, 4), 2: (10, 4)}
    pts = {v: (f(gelu(v)) if v else "0", dx, dy) for v, (dx, dy) in offs.items()}
    assert [pts[v][0] for v in (-2, -1, 1, 2)] == ["−0.05", "−0.16", "0.84", "1.95"]
    for v, (s, dx, dy) in pts.items():
        b.append(f'<circle cx="{px(v):.1f}" cy="{py(gelu(v)):.1f}" r="3.5" fill="var(--paper)" '
                 f'stroke="var(--h)" stroke-width="1.5"/>')
        anchor = "middle" if dx == 0 else ("start" if dx > 0 else "end")
        b.append(txt(px(v) + dx, py(gelu(v)) + dy, s, "sub2 halo", anchor))
    # the second panel: without a bend, two matrices are one
    g3 = gelu(-3)
    assert f(g3, 3) == "−0.004" and f(2 * g3, 3) == "−0.008"
    x0 = 380
    b.append(hd(x0, 76, "Without a bend, two are one"))
    lines = [("start with x = −1", None), ("× 3 gives −3, × 2 gives −6:", None),
             ("the same as × 6, for every x", None), ("", None), ("with GELU between:", None),
             ("× 3 gives −3, GELU gives −0.004,", None), ("× 2 gives −0.008, not −6", None)]
    for k, (s, _) in enumerate(lines):
        if s:
            b.append(txt(x0, 104 + k * 20, s, "sub2"))
    body, yb = prose(288, [
        "GELU(x) = x × Φ(x), where Φ(x) is the share of a bell curve lying below x, a probability "
        "between 0 and 1. Far above zero Φ is nearly 1 and a number passes almost unchanged; far "
        "below, Φ is nearly 0 and the number is squashed toward zero; near zero, it bends.",
        "It looks at one number at a time: output 3 depends only on input 3. So a GPU holding some "
        "of the numbers can bend them without asking any other GPU.",
        "Why bend at all? Without it, A then B would be a single matrix: in one dimension, × 3 then "
        "× 2 is × 6 for every input. The bend is what lets two matrices do what one cannot.",
    ])
    emit("n10", stamp(SRT, "non-linearity,"), "GELU bends each number on its own", yb + 26,
         b + [body],
         "The two facts tensor parallelism rests on: the bend is what makes two matrices worth having, "
         "and it touches each number alone, so whoever holds a number can bend it.")


# ---- N11: split A by output columns --------------------------------------------------------------
COLX = [300, 362, 454, 516]                           # A's columns; the gap marks the split
CW, CH = 56, 30


def n11():
    b = [hd(40, 40, "x times A: each output is x against one column")]
    b.append(txt(np_mean(COLX[:2]) + CW / 2, 66, "GPU 1: columns 1–2", "sub2", "middle"))
    b.append(txt(np_mean(COLX[2:]) + CW / 2, 66, "GPU 2: columns 3–4", "sub2", "middle"))
    for a, z in ((COLX[0], COLX[1] + CW), (COLX[2], COLX[3] + CW)):
        b.append(ln(a, 76, z, 76, "tick"))
    for r in range(2):
        y = 86 + r * 36
        b.append(cell(200, y, CW, CH, "u", label=str(X[r])))
        b.append(txt(272, y + 20, "×", "sub2", "middle"))
        for c in range(4):
            b.append(cell(COLX[c], y, CW, CH, "u", label=str(A[r][c])))
    b.append(txt(228, 80, "x", "sub2", "middle"))
    b.append(txt(40, 124, "x and A", "cap"))
    for c in range(4):
        s = f"{X[0]}×{A[0][c]} + {X[1]}×{A[1][c]}"
        b.append(txt(COLX[c] + CW / 2, 176, s, "sub2", "middle"))
        b.append(cell(COLX[c], 186, CW, CH, "s", label=str(H[c])))
    b.append(txt(40, 206, "the output", "cap"))
    body, yb = prose(258, [
        "Write the token's vector on the left, as Megatron-LM does: Y = GELU(XA). Each output number "
        "is the dot product of the whole of x with one column of A ({{fig:v03-o014}}): output 3 is "
        f"1×2 + 2×1 = {H[2]}.",
        f"Give GPU 1 columns 1 and 2 and GPU 2 columns 3 and 4, and give both a copy of x. GPU 1 "
        f"computes {vec_list(H[:2])}, GPU 2 computes {vec_list(H[2:])}, and neither needs anything "
        "from the other.",
        "{{fig:v01-o112}} put the vector on the right, where the same split is by rows. The rule "
        "underneath is the same: split by outputs, and each GPU finishes its own numbers.",
    ])
    emit("n11", stamp(SRT, "Megatron splits A by columns"),
         "Split by output columns, each GPU finishes its own numbers", yb + 26, b + [body],
         "No exchange at all: every output a GPU needs is made from columns it holds and an input it "
         "already has.")


def np_mean(v):
    return sum(v) / len(v)


# ---- N12: split B by input rows ------------------------------------------------------------------
def n12():
    b = [hd(40, 40, "h times B: each GPU multiplies its own numbers by its own rows")]
    PX0 = [40, 360]
    for g, (px0, rows, part) in enumerate(zip(PX0, ((0, 1), (2, 3)), (P1, P2))):
        b.append(txt(px0, 70, f"GPU {g + 1} holds {'h₁, h₂' if g == 0 else 'h₃, h₄'} and "
                              f"B's rows {'1–2' if g == 0 else '3–4'}", "sub2"))
        for k, i in enumerate(rows):
            y = 82 + k * 34
            b.append(cell(px0, y, 40, 26, "u", label=str(H[i])))
            b.append(txt(px0 + 52, y + 18, "×", "sub2", "middle"))
            for j in range(2):
                b.append(cell(px0 + 64 + j * 46, y, 40, 26, "u", label=f(B[i][j], 0)))
            b.append(txt(px0 + 168, y + 18, "=", "sub2", "middle"))
            for j in range(2):
                b.append(cell(px0 + 180 + j * 46, y, 40, 26, "u", label=f(H[i] * B[i][j], 0)))
        b.append(ln(px0 + 180, 148, px0 + 266, 148, "tick"))
        for j in range(2):
            b.append(cell(px0 + 180 + j * 46, 154, 40, 26, "m", label=f(part[j], 0)))
        b.append(txt(px0 + 170, 172, "partial", "sub2", "end"))
    b.append(arr(260, 184, 260, 204))
    b.append(arr(580, 184, 580, 204))
    b.append(cell(40, 208, 600, 30, "h", label=f"all-reduce: {vec_list(P1)} + {vec_list(P2)} = "
                                                 f"{vec_list(Y)}"))
    b.append(arr(260, 242, 260, 262))
    b.append(arr(580, 242, 580, 262))
    for px0 in PX0:
        for j in range(2):
            b.append(cell(px0 + 180 + j * 46, 266, 40, 26, "s", label=f(Y[j], 0)))
        b.append(txt(px0 + 170, 284, "the true hB", "sub2", "end"))
    body, yb = prose(334, [
        f"Now B, the matrix after the bend. GPU 1 holds h's first two numbers and GPU 2 the last two, "
        "exactly what the column split left on each. So B is split by rows to match: GPU 1 takes "
        "rows 1 and 2, the rows its own numbers multiply.",
        f"Each GPU's result has the right shape, two numbers, but only part of the value: GPU 1 has "
        f"{vec_list(P1)}, GPU 2 has {vec_list(P2)}. The true h × B is their sum, {vec_list(Y)}, and "
        "one all-reduce adds them on every GPU. A product split into blocks is a sum of block "
        "products ({{fig:v03-o035}}); the all-reduce is that sum.",
        "The bend between A and B changes the numbers but not who holds them, so it is left out of "
        "this arithmetic.",
    ])
    emit("n12", stamp(SRT, "B is split by rows to match"),
         "Split by input rows, each GPU holds part of every number", yb + 26, b + [body],
         "One exchange, and it comes at the end: every partial is complete in shape and incomplete in "
         "value until the others are added.")


# ---- N13: why columns first ----------------------------------------------------------------------
def n13():
    bt, bs = BEND_THEN_ADD, BEND_OF_SUM
    left = [("u", "each GPU takes one number of x", "and the matching row of A"),
            ("m", "two full-length partials:", f"{vec_list(R1)} and {vec_list(R2)}"),
            ("h", "bend each partial, then add:", vec_list(bt, 2)),
            ("h", f"but the bend of the true sum {vec_list(H)}", f"is {vec_list(bs, 2)}: wrong"),
            ("h", "so add before bending:", "an extra all-reduce, two per block")]
    right = [("u", "each GPU takes two whole columns", "of A, and a copy of x"),
             ("m", "whole outputs:", f"{vec_list(H[:2])} on GPU 1, {vec_list(H[2:])} on GPU 2"),
             ("s", "bend them where they are:", f"{vec_list(bs[:2], 2)} and {vec_list(bs[2:], 2)}"),
             ("s", "then B split by rows: partials", "added once, at the end"),
             ("s", "one all-reduce per block", None)]
    b = [hd(40, 40, "Two ways to split A, for the same x and A")]
    b.append(txt(40, 66, "A split by rows", "cap"))
    b.append(txt(360, 66, "A split by columns", "cap"))
    for col, x0 in ((left, 40), (right, 360)):
        for k, (c, l1, l2) in enumerate(col):
            y = 78 + k * 58
            b.append(box2(x0, y, 280, 44, c, l1, l2))
            if k < len(col) - 1:
                b.append(arr(x0 + 140, y + 46, x0 + 140, y + 56))
    b.append(cell(40, 380, 600, 30, "u",
                  label=f"GELU(1) + GELU(6) = {f(gelu(1))} + {f(gelu(6))} = {f(gelu(1) + gelu(6))}, "
                        f"but GELU(1 + 6) = GELU(7) = {f(gelu(7))}"))
    body, yb = prose(452, [
        "Split A by rows and each GPU's partial is full length but incomplete, so the bend lands on "
        "the wrong numbers: in position 4, GPU 1 bends its 1 and GPU 2 bends its 6, but the bend "
        "belongs on 7. The partials would have to be added first, a second exchange in every block.",
        "Split A by columns and each GPU holds whole numbers, ready to bend where they are. "
        "Megatron-LM's paper makes exactly this argument: GELU(X₁A₁ + X₂A₂) is not "
        "GELU(X₁A₁) + GELU(X₂A₂), so the first matrix is split by columns and the second by rows.",
    ])
    emit("n13", stamp(SRT, "B is split by rows to match"),
         "The bend decides the order: columns first, rows second", yb + 26, b + [body],
         "The order is forced, not a matter of style. Split A any other way and the bend needs the "
         "whole sum first, which costs a second exchange per block.")


# ---- Fig 9: the assembled block ------------------------------------------------------------------
def o009():
    b = [hd(40, 40, "One feed-forward block on two GPUs")]
    LY = {1: 62, 2: 166}
    steps = [("x, whole", 64, "u"), ("× A columns", 84, "m"), ("GELU", 52, "m"),
             ("× B rows", 70, "m"), ("partial", 60, "m")]
    for g, y in LY.items():
        b.append(txt(40, y + 23, f"GPU {g}", "cap"))
        x = 100
        for k, (s, w, c) in enumerate(steps):
            b.append(cell(x, y, w, 36, c, label=s))
            if k < len(steps) - 1:
                b.append(arr(x + w + 2, y + 18, x + w + 12, y + 18))
            x += w + 14
        b.append(cell(540, y, 100, 36, "s", label="true output"))
    px = 100 + sum(w + 14 for _, w, _ in steps[:-1])           # the partial column
    b.append(cell(px, 114, 640 - px, 36, "h", label="all-reduce: partials added"))
    pc = px + 30
    b.append(arr(pc, 100, pc, 112))
    b.append(arr(pc, 164, pc, 152))
    b.append(arr(590, 114, 590, 100))
    b.append(arr(590, 150, 590, 164))
    body, yb = prose(246, [
        "Put the pieces together and one feed-forward block costs one exchange. Each GPU starts with "
        "the whole input, multiplies it by its own columns of A, bends its own numbers, multiplies "
        "them by its own rows of B, and holds a partial output: the right shape, but only part of "
        "the value.",
        "One all-reduce sums the partials into the true result on every GPU, ready for the next "
        "layer. Each GPU stores half of A and half of B here; across eight GPUs, an eighth of each.",
    ])
    emit("o009", stamp(SRT, "right shape, but only part of the value"),
         "Columns, bend, rows: one all-reduce per block", yb + 26, b + [body],
         "The column-then-row pairing is the trick. It is arranged so that exactly one synchronisation "
         "is needed per block rather than one per matrix.")


# ---- N14: the 70B's gated block ------------------------------------------------------------------
def n14():
    cols = FFN // TP
    per_gpu = 3 * HIDDEN * cols
    assert cols == 3584 and per_gpu == 88_080_384 and 3 * HIDDEN * FFN == 704_643_072
    b = [cont(40, 40, 600, 172, "u", f"GPU 1 of {TP}: its eighth of one layer's feed-forward block")]
    b.append(cell(62, 82, 170, 34, "m", label=f"gate: {n(HIDDEN)} × {n(cols)}"))
    b.append(cell(62, 138, 170, 34, "m", label=f"up: {n(HIDDEN)} × {n(cols)}"))
    b.append(arr(236, 99, 262, 119))
    b.append(arr(236, 155, 262, 135))
    b.append(box2(266, 104, 178, 46, "m", "SiLU(gate) × up,", f"{n(cols)} numbers, local"))
    b.append(arr(448, 127, 464, 127))
    b.append(cell(468, 110, 150, 34, "m", label=f"down: {n(cols)} × {n(HIDDEN)}"))
    b.append(cell(40, 236, 190, 30, "m", label=f"partial: {n(HIDDEN)} numbers"))
    b.append(arr(234, 251, 252, 251))
    b.append(cell(256, 236, 150, 30, "h", label="one all-reduce"))
    b.append(arr(410, 251, 428, 251))
    b.append(cell(432, 236, 208, 30, "s", label="the layer's output, on all 8"))
    body, yb = prose(308, [
        f"The 70B counts three feed-forward matrices per layer ({{{{fig:v01-o100}}}}): gate and up, "
        f"each {n(HIDDEN)} × {n(FFN)}, and down, {n(FFN)} × {n(HIDDEN)}. Gate and up play A's part "
        f"and are split by columns: {n(FFN)} ÷ {TP} = {n(cols)} columns of each per GPU.",
        "The bend is SiLU, x ÷ (1 + e^−x), applied to the gate's output and then multiplied, "
        "number by number, by the up matrix's output. Both act on the same positions, which the "
        "column split keeps on the same GPU, so this step is local.",
        f"Down plays B's part, split by rows, leaving partial outputs and one all-reduce. Each GPU "
        f"stores 3 × {n(HIDDEN)} × {n(cols)} = {per_gpu / 1e6:.1f} million weights per layer, "
        f"{per_gpu * BYTES / 1e6:.0f} MB at two bytes: an eighth of {3 * HIDDEN * FFN / 1e6:.1f} million.",
    ])
    emit("n14", stamp(SRT, "One all reduce sums the partials"),
         "The 70B's three-matrix block splits the same way", yb + 26, b + [body],
         "V1's three feed-forward matrices and this video's A and B are the same block. The gate adds "
         "a matrix, not an exchange.")


# ---- N15: attention by heads ---------------------------------------------------------------------
def n15():
    q_per, kv_per = QH // TP, KVH // TP
    per_gpu = KV_PER_TOKEN // TP
    assert (q_per, kv_per, per_gpu) == (8, 1, 40_960) and q_per == QH // KVH
    b = []
    for g in range(TP):
        x, y = 40 + (g % 4) * 153, 40 + (g // 4) * 96
        b.append(cont(x, y, 141, 84, "u", f"GPU {g + 1}"))
        b.append(cell(x + 12, y + 40, 70, 24, "m", label=f"Q {q_per * g + 1}–{q_per * (g + 1)}"))
        b.append(cell(x + 88, y + 40, 41, 24, "m", label=f"KV {g + 1}"))
    b.append(txt(40, 254, "query heads and the one KV head they share, per GPU", "sub2"))
    X0, SC = 200, 320 / KV_PER_TOKEN
    b.append(txt(40, 296, "cache per token, unsplit", "cap"))
    b.append(cell(X0, 278, KV_PER_TOKEN * SC, 26, "h", label=f"{n(KV_PER_TOKEN)} bytes"))
    b.append(txt(40, 334, "on each GPU", "cap"))
    b.append(cell(X0, 316, per_gpu * SC, 26, "s"))
    b.append(txt(X0 + per_gpu * SC + 10, 334, f"{n(per_gpu)} bytes, an eighth", "sub2"))
    body, yb = prose(382, [
        f"Attention divides even more naturally, because its heads are already independent "
        f"({{{{fig:v03-o013}}}}). The 70B has {QH} query heads sharing {KVH} KV heads, {QH // KVH} "
        f"query heads to each ({{{{fig:v03-o089}}}}). Eight GPUs take {q_per} query heads each, and those "
        "8 are exactly the group that shares one KV head, so no GPU needs another's keys.",
        "W_Q, W_K and W_V are split by columns, whole heads at a time. W_O, which mixes the heads "
        "back into one vector, is split by rows, leaving partial outputs: the layer's second "
        "all-reduce.",
        f"The cache splits with the heads: each GPU keeps keys and values for its own KV head only, "
        f"{n(KV_PER_TOKEN)} ÷ 8 = {n(per_gpu)} bytes per token. With more GPUs than KV heads, KV "
        "heads would have to be copied, one reason eight is the natural group size here.",
    ])
    emit("n15", stamp(SRT, "Attention divides even more naturally"),
         "Attention splits by heads, and the cache splits with them", yb + 26, b + [body],
         "Bars to scale. The two all-reduces per layer now have names: one after attention's W_O, one "
         "after the feed-forward block's last matrix.")


# ---- Fig 10: two blocking exchanges per layer ----------------------------------------------------
def o010():
    X0 = 110
    att = [120, 130, 115, 125]
    ffn = [150, 140, 155, 145]
    LY = [72, 104, 136, 168]
    a_end = X0 + max(att)
    ar1 = (a_end + 4, a_end + 74)
    f0 = ar1[1] + 4
    f_end = f0 + max(ffn)
    ar2 = (f_end + 4, f_end + 74)
    nx = ar2[1] + 4
    b = []
    for lab, x in (("attention", X0), ("feed-forward", f0), ("next layer", nx)):
        b.append(txt(x, 60, lab, "sub2"))
    for k, y in enumerate(LY):
        b.append(txt(40, y + 18, f"GPU {k + 1}", "cap"))
        b.append(cell(X0, y, att[k] - 4, 26, "m"))
        if att[k] < max(att):
            b.append(ghost(X0 + att[k], y, max(att) - att[k], 26))
        b.append(cell(f0, y, ffn[k] - 4, 26, "m"))
        if ffn[k] < max(ffn):
            b.append(ghost(f0 + ffn[k], y, max(ffn) - ffn[k], 26))
        b.append(cell(nx, y, 640 - nx, 26, "m"))
    for a, z in (ar1, ar2):
        b.append(cell(a, LY[0], z - a, LY[-1] + 26 - LY[0], "h", label="all-reduce"))
    b.append(txt(X0, 220, "dashed: a GPU that finished early, waiting for the slowest", "sub2"))
    x = 40
    for k, (s, w, c) in enumerate([("80 layers", 110, "u"), ("×", 28, None), ("2 per layer", 110, "u"),
                                    ("=", 28, None), ("160 blocking exchanges per token", 324, "h")]):
        if c is None:
            b.append(txt(x + w / 2, 260, s, "sub2", "middle"))
        else:
            b.append(cell(x, 242, w, 30, c, label=s))
        x += w
    body, yb = prose(316, [
        "Each layer runs attention, an all-reduce, the feed-forward block and another all-reduce, in "
        "that order. Both exchanges sit on the critical path: the next step cannot start on any GPU "
        "until every GPU's partial has been added, so the fast GPUs wait for the slowest.",
        f"For the 80-layer model from earlier, that is 80 × 2 = {AR_PER_TOKEN} blocking exchanges for "
        "every token, far too heavy to cross between servers. The Megatron team therefore capped the "
        "group at the GPUs inside one server, the eight NVLink GPUs of a standard node, and the rule "
        "still holds.",
    ])
    emit("o010", stamp(SRT, "So, the price is two all reduces"),
         "Two blocking exchanges per layer, 160 per token", yb + 26, b + [body],
         "Four of the eight GPUs drawn; lengths schematic. The bill is not one big transfer but 160 "
         "small waits in a row, and each pays the toll of {{ref:v05-n8}}.")


# ---- N16: the size of each message ---------------------------------------------------------------
def n16():
    sizes = [(1, "1 token: decode"), (64, "64 tokens"), (4096, "4,096 tokens: a prefill")]
    per_token = AR_PER_TOKEN * RING * VEC
    assert per_token == 4_587_520 and RING * VEC == 28_672
    b = [hd(40, 40, "message  =  tokens × 8,192 numbers × 2 bytes")]
    L0, L1, X0, X1 = 1e3, 1e8, 190, 640
    lx = lambda v: log_px(v, L0, L1, X0, X1)
    for k, lab in enumerate(["1 KB", "10 KB", "100 KB", "1 MB", "10 MB", "100 MB"]):
        x = lx(10 ** (3 + k))
        b.append(ln(x, 58, x, 176, "axis"))
        b.append(txt(x, 192, lab, "sub2", "middle" if k else "start"))
    for k, (t, lab) in enumerate(sizes):
        y = 64 + k * 36
        v = t * VEC
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(cell(X0, y, lx(v) - X0, 26, "h", label=f"{n(v)} bytes"))
    b.append(hd(40, 236, "Every GPU, over one pass for one token"))
    x = 40
    for s, w, c in [("160 all-reduces", 130, "u"), ("×", 26, None), ("1.75 × 16,384 bytes", 160, "u"),
                    ("=", 26, None), (f"{n(per_token)} bytes, 4.6 MB", 258, "h")]:
        if c is None:
            b.append(txt(x + w / 2, 272, s, "sub2", "middle"))
        else:
            b.append(cell(x, 254, w, 30, c, label=s))
        x += w
    body, yb = prose(328, [
        "An all-reduce has to carry each token's full vector, 8,192 numbers at 2 bytes: 16 KB per "
        "token. In decode at batch 1 that is the whole message; a 4,096-token prefill sends 67 MB "
        "per exchange.",
        "Why all-reduce, rather than adding everything on one GPU? The next layer splits its matrices "
        "by columns too, so it needs the whole vector, the residual stream ({{fig:v01-o099}}), on "
        "every GPU.",
        f"In a ring of eight, each GPU sends 1.75 times the message per all-reduce "
        f"({fwd('o022', 'Part 8')}). Per token, over one pass: 160 × 1.75 × 16,384 = "
        f"{n(per_token)} bytes, 4.6 MB from every GPU.",
    ])
    emit("n16", stamp(SRT, "For the 80-layer model from earlier"),
         "Each all-reduce carries every token's whole vector", yb + 26, b + [body],
         "Log scale: each gridline is ten times the last, and the bars start at 1 KB. Decode sends "
         "little and often, prefill a great deal at once.")


# ---- N17: priced in time (widget) ----------------------------------------------------------------
TOK = [2 ** k for k in range(15)]                     # 1 … 16,384 tokens
NETS = [12.5, 25, 50, 100, 200, 400]                 # network, GB/s each way
NET_LABELS = ["12.5", "25", "50", "100", "200", "400"]
T0, N0 = TOK.index(4096), NETS.index(50)
BARW = 330


def tp_times(T, net):
    """Milliseconds for one prompt of T tokens through the 70B on eight H100s, as the widget does it."""
    comp = 2 * PARAMS * T / (8 * H100_FLOPS)
    read = WEIGHT_BYTES / 8 / H100_HBM
    work = max(comp, read)
    per = 2 * 7 / 8 * T * VEC
    nv = 160 * per / NVL_H100_EACH_WAY
    nt = 160 * per / (net * 1e9)
    return [work * 1e3, nv * 1e3, nt * 1e3], comp >= read


def ms(v):
    return f(v, 3) if v < 1 else f(v, 2) if v < 10 else f(v, 1)


def rat(r):
    return f(r, 3) if r < 0.1 else f(r, 2) if r < 1 else f(r, 1)


WIDGET17 = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const TOK = __TOK__, NETS = __NETS__, NL = __NL__, C = __C__;
  const sl = [...fig.querySelectorAll('input[type=range]')], val = [...fig.querySelectorAll('.val')];
  const q = s => fig.querySelector(s);
  const fmt = (v, d) => { const s = Math.abs(v).toFixed(d), [i, p] = s.split('.');
    return (v < 0 && +s !== 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (p ? '.' + p : ''); };
  const ms = v => v < 1 ? fmt(v, 3) : v < 10 ? fmt(v, 2) : fmt(v, 1);
  const rat = r => r < 0.1 ? fmt(r, 3) : r < 1 ? fmt(r, 2) : fmt(r, 1);
  function draw() {
    const T = TOK[+sl[0].value], net = NETS[+sl[1].value];
    val[0].textContent = fmt(T, 0); val[1].textContent = NL[+sl[1].value];
    const comp = 2 * C.params * T / (8 * C.flops), read = C.wbytes / 8 / C.hbm, work = Math.max(comp, read);
    const per = 2 * 7 / 8 * T * C.vec, nv = 160 * per / C.nv, nt = 160 * per / (net * 1e9);
    const v = [work * 1e3, nv * 1e3, nt * 1e3], mx = Math.max(...v);
    v.forEach((t, k) => {
      const w = Math.max(t / mx * C.W, 2);
      q(`[data-bar="${k}"]`).setAttribute('width', w.toFixed(1));
      const lab = q(`[data-t="${k}"]`);
      lab.textContent = ms(t) + ' ms'; lab.setAttribute('x', (C.X0 + w + 10).toFixed(1));
    });
    q('[data-work]').textContent = comp >= read ? 'the arithmetic' : 'reading the weights';
    q('[data-net]').textContent = `network, ${NL[+sl[1].value]} GB/s each way`;
    q('[data-r]').textContent = `exchanges ÷ work: ${rat(v[1] / v[0])}× on NVLink, ${rat(v[2] / v[0])}× on the network`;
  }
  sl.forEach(s => s.addEventListener('input', draw));
  q('button').addEventListener('click', () => { sl[0].value = C.t0; sl[1].value = C.n0; draw(); });
  draw();
})();</script>"""


def n17_svg(T, net):
    """The widget's drawing at one setting, exactly as its script would draw it."""
    v, arith = tp_times(T, net)
    mx = max(v)
    X0 = 230
    rows = [("the GPU's own work", "m", "data-work", "the arithmetic" if arith else "reading the weights"),
            ("160 all-reduces", "h", "", "NVLink, 450 GB/s each way"),
            ("160 all-reduces", "h", "data-net", f"network, {NET_LABELS[NETS.index(net)]} GB/s each way")]
    s = [hd(40, 34, "One prompt through the 70B on eight H100s, at ideal rates")]
    for k, (lab, c, attr, sub) in enumerate(rows):
        y = 52 + k * 50
        w = max(v[k] / mx * BARW, 2)
        s.append(txt(40, y + 12, lab, "cap"))
        hook = f' {attr}=""' if attr else ""            # the script finds the label by this attribute
        s.append(f'<text class="sub2" x="40" y="{y + 28}"{hook}>{esc(sub)}</text>')
        s.append(f'<g class="{c}"><rect x="{X0}" y="{y}" width="{w:.1f}" height="26" rx="3" '
                 f'data-bar="{k}"/></g>')
        s.append(f'<text class="sub2" x="{X0 + w + 10:.1f}" y="{y + 18}" data-t="{k}">{ms(v[k])} ms</text>')
    s.append(f'<text class="sub2" x="{X0}" y="{52 + 3 * 50 + 4}" data-r="">exchanges ÷ work: '
             f'{rat(v[1] / v[0])}× on NVLink, {rat(v[2] / v[0])}× on the network</text>')
    return s, X0, v


def n17():
    T, net = TOK[T0], NETS[N0]
    s, X0, v = n17_svg(T, net)
    assert ms(v[0]) == "72.5" and ms(v[1]) == "41.8" and ms(v[2]) == "375.8" and rat(v[2] / v[0]) == "5.2"
    nv_each = 2 * 7 / 8 * T * VEC / NVL_H100_EACH_WAY * 1e3
    net_each = 2 * 7 / 8 * T * VEC / NET_EACH_WAY * 1e3
    cross = 160 * 2 * 7 / 8 * T * VEC / (v[0] / 1e3) / 1e9
    assert round(cross) == 259
    body, yb = prose(270, [
        "One 4,096-token prompt through the 70B on eight H100s. The arithmetic is 2 operations per "
        "weight per token ({{fig:v01-o111}}): 2 × 70 billion × 4,096 ÷ (8 × 989 trillion a second) "
        f"= {ms(v[0])} ms, with every GPU at full speed.",
        f"Each of the 160 all-reduces moves 1.75 × 67 MB from every GPU: {f(nv_each, 2)} ms over "
        f"NVLink's 450 GB/s, {ms(v[1])} ms in all; over the network's 50 GB/s, {f(net_each, 2)} ms "
        f"each, {ms(v[2])} ms in all. The exchanges sit on the critical path, so their time adds to "
        "the work.",
        "Slide the prompt down to one token and the work becomes reading the weights, 5.2 ms, while "
        "the bandwidth part of the exchanges almost vanishes; what is left is 160 tolls, not drawn. "
        "The widget's arithmetic was checked against Python at every setting.",
    ])
    s.append(body)
    ctl = [f"<label>prompt tokens <input type='range' min='0' max='{len(TOK) - 1}' step='1' "
           f"value='{T0}'><span class='val'>{n(T)}</span></label>"
           f"<label>network GB/s each way <input type='range' min='0' max='{len(NETS) - 1}' step='1' "
           f"value='{N0}'><span class='val'>{NET_LABELS[N0]}</span></label>",
           "<button type='button'>Reset</button>"]
    C = {"params": PARAMS, "flops": H100_FLOPS, "wbytes": WEIGHT_BYTES, "hbm": H100_HBM, "vec": VEC,
         "nv": NVL_H100_EACH_WAY, "W": BARW, "X0": X0, "t0": T0, "n0": N0}
    js = (WIDGET17.replace("__TOK__", json.dumps(TOK)).replace("__NETS__", json.dumps(NETS))
          .replace("__NL__", json.dumps(NET_LABELS)).replace("__C__", json.dumps(C)))
    emit_raw("n17", widget("n17", stamp(SRT, "far too heavy to cross between"),
                           "Across the network, the exchanges would outlast the arithmetic five times over",
                           ctl, yb + 24, s,
                           "Bars share one scale, which resets as you move the sliders; ideal rates, so "
                           "every bar is a floor. It takes about 260 GB/s each way, more than five 400 Gb/s "
                           "ports per GPU, before the network's exchanges fall below the arithmetic.", js))


# ---- N18: the reward -----------------------------------------------------------------------------
def n18():
    one = WEIGHT_BYTES / H100_HBM * 1e3
    each = WEIGHT_BYTES / TP / H100_HBM * 1e3
    assert f(one, 1) == "41.8" and f(each, 1) == "5.2"
    X0, SC = 230, 9
    b = [hd(40, 40, "Milliseconds to read the weights for one decode token")]
    b.append(txt(40, 76, "one GPU, if 140 GB fit", "cap"))
    b.append(cell(X0, 58, one * SC, 28, "m", label=f"{f(one, 1)} ms"))
    b.append(txt(40, 120, "each of eight GPUs", "cap"))
    b.append(cell(X0, 102, each * SC, 28, "s"))
    b.append(cell(X0 + each * SC + 2, 102, 22, 28, "h"))
    b.append(txt(X0 + each * SC + 34, 120, f"{f(each, 1)} ms, plus 160 exchanges (schematic)", "sub2"))
    body, yb = prose(172, [
        "Decode is limited by reading: each token's time is the bytes read divided by the read speed "
        "({{fig:v01-o014}}). Split the weights eight ways and every GPU reads an eighth, all eight at "
        f"once: 140 GB ÷ 8 = 17.5 GB, {f(each, 1)} ms instead of {f(one, 1)} ms on an H100's "
        "3.35 TB/s.",
        "That is the reward: each GPU holds roughly an eighth of the weights and does an eighth of "
        "the math. This is the strategy that makes a single token faster. The price is the 160 "
        "exchanges per token, whose bandwidth part is tiny at 16 KB each; what they add is mostly "
        "their tolls.",
    ])
    emit("n18", stamp(SRT, "The reward is that each GPU holds"),
         "An eighth of the weights is an eighth of the reading", yb + 26, b + [body],
         "Bars to scale, except the exchanges, whose tolls are schematic. Of the five strategies, this "
         "is the one that divides the time of a single decode token.")


if __name__ == "__main__":
    for fn in (n9, n10, n11, n12, n13, o009, n14, n15, o010, n16, n17, n18):
        fn()
