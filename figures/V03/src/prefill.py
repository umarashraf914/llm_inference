"""V3 Part 6, the worked prefill: §2c restamps (11:13), §5a items 8, 9 and 23, §5c voice and chat residue,
and review #12 (exact, up to the order of additions).

  o048  picking a block size: the largest that fits is 128, so 200 tokens are two blocks
  o049  four tiles, in the first version's order, and the causal mask skips one
  p12   exact, up to the order of additions (11:29)
  patches: o044 caption (8 KV heads), o046 (why K and V are 1,024 wide), o047, o051, o052; restamps

  python3 figures/V03/src/prefill.py
"""
import numpy as np
from common import *  # noqa: F401,F403

T, D = 200, 128                     # the prompt, and Llama-3-8B's head dimension


def ws(blk, d=D):
    """Working set of one head's step, bytes: Q, K, V blocks and the S tile in 16-bit, O and m, l in FP32."""
    return 3 * blk * d * 2 + blk * blk * 2 + blk * d * 4 + blk * 2 * 4


# ---- o048: the block size ------------------------------------------------------------------------
def o048():
    sizes = [256, 128, 64, 32]
    kib = {s: ws(s) / 1024 for s in sizes}
    assert (kib[256], kib[128], kib[64], round(kib[32], 2)) == (450, 193, 88.5, 42.25)
    fits = [s for s in sizes if ws(s) <= H100_SMEM]
    pick = max(fits)
    assert pick == 128 and ws(256) > H100_SMEM
    tiles = {s: math.ceil(T / s) for s in sizes}
    assert tiles == {256: 1, 128: 2, 64: 4, 32: 7}
    b = [hd(40, 46, f"One head of this model, d = {D}: what each block size needs at once")]
    SC = 300 / ws(256)
    xb = 140
    budget_x = xb + H100_SMEM * SC
    b.append(txt(40, 82, "block", "sub2"))
    b.append(txt(xb, 82, "working set, to scale", "sub2"))
    b.append(txt(640, 82, "tiles at 200 tokens", "sub2", "end"))
    for k, s in enumerate(sizes):
        y = 94 + k * 40
        b.append(txt(40, y + 19, str(s), "cap"))
        cls = "h" if ws(s) > H100_SMEM else ("s" if s == pick else "u")
        lab = f"{f(kib[s], 1 if kib[s] % 1 else 0)} KB"
        if 70 < ws(s) * SC and ws(s) <= H100_SMEM:
            b.append(cell(xb, y + 2, ws(s) * SC, 24, cls, label=lab))
        else:
            b.append(cell(xb, y + 2, ws(s) * SC, 24, cls))
            b.append(txt(xb + ws(s) * SC + 8, y + 19, lab, "sub2"))
        b.append(txt(640, y + 19, f"{tiles[s]} × {tiles[s]}", "sub2", "end"))
    b.append(dashed(budget_x, 88, budget_x, 94 + 4 * 40, "--s"))
    b.append(txt(budget_x + 6, 94 + 4 * 40 + 14, "228 KB budget", "sub2"))
    body, yb = prose(94 + 4 * 40 + 52, [
        "Each row adds up one step's needs: blocks of Q, K and V and the tile of scores in 16-bit, the "
        "running output in FP32, and two numbers per row. The dashed line is the 228 KB of shared memory on "
        "one multiprocessor.",
        f"Bigger blocks mean fewer trips and less repeated traffic ({{{{fig:v03-p10}}}}), so the rule is to "
        f"take the largest block that fits: {pick}, at {kib[pick]:.0f} KB. The next size up, 256, needs "
        f"{kib[256]:.0f} KB and spills. At {T} tokens, blocks of {pick} cut the sequence into two: {pick} "
        f"tokens and {T - pick}.",
    ])
    figure("o048", st("built tile by tile on chip"), "Picking a block size that fits", yb + 30, b + [body],
           esc("Red does not fit, teal is the choice. Real kernels also leave room for the next blocks to load "
               "while the current ones are used, which can push the choice down a size."))


# ---- o049: the tiles, in order, with the mask --------------------------------------------------------
def o049():
    blocks = [(0, 128), (128, 200)]
    skipped = [(i, j) for i in range(2) for j in range(2) if blocks[j][0] > blocks[i][1] - 1]
    assert skipped == [(0, 1)]                       # keys 129-200 all lie after queries 1-128
    order = [(i, j) for j in range(2) for i in range(2) if (i, j) not in skipped]   # K, V outside
    assert order == [(0, 0), (1, 0), (1, 1)]
    SC = 1.4
    X0, Y0 = 170, 92
    px = lambda t: t * SC
    b = [hd(40, 46, f"One head's {T} × {T} scores, cut by blocks of 128, in the order they are visited")]
    for j, (a, z) in enumerate(blocks):
        b.append(txt(X0 + px((a + z) / 2), Y0 - 10, f"keys {a + 1}–{z}", "sub2", "middle"))
    for i, (a, z) in enumerate(blocks):
        b.append(txt(X0 - 12, Y0 + px((a + z) / 2) + 4, f"queries {a + 1}–{z}", "sub2", "end"))
    for i, (qa, qz) in enumerate(blocks):
        for j, (ka, kz) in enumerate(blocks):
            x, y, w, h = X0 + px(ka), Y0 + px(qa), px(kz - ka) - 3, px(qz - qa) - 3
            if (i, j) in skipped:
                b.append(ghost(x, y, w, h, label="skipped"))
                continue
            b.append(cell(x, y, w, h, "m"))
            if i == j:                                 # the mask hides the triangle above the diagonal
                b.append(f'<polygon points="{x:.1f},{y:.1f} {x + w:.1f},{y:.1f} {x + w:.1f},{y + h:.1f}" '
                         f'fill="var(--u-fill)" stroke="none"/>')
            k = order.index((i, j)) + 1
            b.append(txt(x + 14, y + h - 12, f"{k}", "lbl"))
    b.append(txt(X0 + px(T) + 16, Y0 + 20, "gold: computed", "sub2"))
    b.append(txt(X0 + px(T) + 16, Y0 + 38, "grey: masked", "sub2"))
    b.append(txt(X0 + px(T) + 16, Y0 + 56, "1, 2, 3: visit order", "sub2"))
    body, yb = prose(Y0 + px(T) + 40, [
        "With blocks of 128, one head's score matrix is four tiles. In the first version's order the "
        "kernel loads K and V block 1 and sweeps both blocks of queries past it, then loads K and V block 2: "
        "a column at a time.",
        "Queries 1–128 need nothing from the second column. Keys 129–200 all lie in their future, the "
        "causal mask hides every one ({{fig:v03-o020}}), and the kernel skips the tile. Three tiles are "
        "computed, and the two on the diagonal are half hidden inside. The largest tile is 128 × 128 "
        "scores, 32 KB, and it lives on the chip only while it is used.",
    ])
    figure("o049", st("built tile by tile on chip"), "Four tiles, and the mask skips one", yb + 30,
           b + [body],
           esc("Drawn to scale. The 200 × 200 matrix exists only as these pieces, each made and discarded on "
               "the chip, and the masked one is never made at all: a saving the three-kernel version, which "
               "writes every entry, cannot have."))


# ---- p12: exact, up to the order of additions --------------------------------------------------------
def streaming_vs_direct(rows=200, n=4096, tile=128, seed=0):
    rng = np.random.default_rng(seed)
    differ, worst = 0, 0.0
    for _ in range(rows):
        x = (rng.standard_normal(n) * 2).astype(np.float32)
        v = rng.standard_normal(n).astype(np.float32)
        e = np.exp(x - x.max())
        direct = np.float32((e * v).sum(dtype=np.float32) / e.sum(dtype=np.float32))
        M, L, O = np.float32(-np.inf), np.float32(0), np.float32(0)
        for j in range(0, n, tile):
            xt, vt = x[j:j + tile], v[j:j + tile]
            mn = np.float32(max(M, xt.max()))
            c = np.float32(np.exp(M - mn)) if np.isfinite(M) else np.float32(0)
            et = np.exp(xt - mn).astype(np.float32)
            L = np.float32(L * c + et.sum(dtype=np.float32))
            O = np.float32(O * c + (et * vt).sum(dtype=np.float32))
            M = mn
        stream = np.float32(O / L)
        differ += stream != direct
        worst = max(worst, abs(float(stream) - float(direct)))
    return int(differ), worst


def p12():
    a, one = np.float16(2048), np.float16(1)
    left, right = (a + one) + one, a + (one + one)
    assert float(left) == 2048 and float(right) == 2050 and float(np.spacing(np.float16(2048))) == 2
    differ, worst = streaming_vs_direct()
    assert differ == 160 and worst == 2 ** -24
    b = [hd(40, 46, "FP16 near 2,048: whole numbers below it, only even numbers from it on")]
    X0, X1, y = 70, 610, 110
    vals = list(range(2044, 2048)) + [2048, 2050, 2052]
    xs = lambda v: X0 + (v - 2044) / (2052 - 2044) * (X1 - X0)
    b.append(tline(X0, y, X1, y, "axis"))
    for v in vals:
        b.append(tline(xs(v), y - 6, xs(v), y + 6))
        b.append(txt(xs(v), y + 24, f"{v:,}", "sub2", "middle"))
    b.append(dot(xs(2049), y, 4, "--h"))
    b.append(txt(xs(2049), y - 16, "2,049: no such FP16 number", "sub2", "middle"))
    rows = [("(2,048 + 1) + 1", "2,048 + 1 rounds back to 2,048, twice", f"{float(left):,.0f}", "h"),
            ("2,048 + (1 + 1)", "1 + 1 = 2 first, then 2,048 + 2", f"{float(right):,.0f}", "s")]
    for k, (expr, how, res, cls) in enumerate(rows):
        yy = 162 + k * 38
        b.append(cell(40, yy, 150, 28, cls, label=expr))
        b.append(txt(204, yy + 19, how, "sub2"))
        b.append(txt(640, yy + 19, f"= {res}", "sub2", "end"))
    yt = 162 + 2 * 38 + 34
    b.append(hd(40, yt, "The tiled softmax against the direct one, in FP32"))
    b.append(txt(40, yt + 28, f"200 rows of 4,096 random scores, tiles of 128: the answers differ in {differ} "
                              "rows,", "sub2"))
    b.append(txt(40, yt + 48, f"never by more than 2⁻²⁴ = {worst:.1e}, the spacing of FP32 numbers between "
                              "0.5 and 1", "sub2").replace("e-08", " × 10⁻⁸"))
    body, yb = prose(yt + 88, [
        "Floating point rounds after every operation, so the order in which numbers are added can change "
        "the last bits of the answer. In FP16 the numbers from 2,048 to 4,096 are spaced 2 apart, so adding "
        "1 to 2,048 lands exactly between two of them and rounds back down; adding the two 1s first gives "
        "2, which fits.",
        "A tiled kernel adds the same terms as the three-kernel one, in a different order: tile by tile, "
        "with the rescaling multiplications of Part 7 in between. So its output is the same function, "
        "identical up to the order of floating-point sums, not identical bit for bit.",
        "Against a high-precision reference the tiled answers are, if anything, closer: FlashAttention 3 "
        "measured an error of 1.9 × 10⁻⁴ in FP16 against 3.2 × 10⁻⁴ for the standard implementation, "
        "because its softmax runs in FP32.",
    ])
    figure("p12", st("identical up to the reordering"), "Exact, up to the order of additions", yb + 30,
           b + [body],
           esc("Exact in the mathematician's sense, not bit for bit. Any two correct ways of adding a long list "
               "differ like this, which is why nobody retrains a model to switch kernels."))


def patches():
    s = st("built tile by tile on chip")
    for i in ("o044", "o045", "o046", "o047", "o050"):
        patch(i, [], stamp_to=s)
    patch("o044", [("<figcaption>A Llama-3-8B-shaped model in FP16: 32 layers, 4096 wide, 32 query heads and 8 KV heads of dimension 128.</figcaption>",
                    "<figcaption>A Llama-3-8B-shaped model in FP16: 32 layers, 4,096 wide, 32 query heads of dimension "
                    f"128 sharing 8 key-value heads (grouped-query attention, Part {PART['heads']}).</figcaption>")])
    assert 8 * 128 == 1024 and 32 // 8 == 4
    patch("o046", [("<text class=\"cap\" x=\"40\" y=\"292\" text-anchor=\"start\">Tiling is not a FlashAttention invention. Every large matmul on a GPU is tiled.</text>",
                    "<text class=\"cap\" x=\"40\" y=\"292\" text-anchor=\"start\">K and V are 1,024 wide, not 4,096: 8 key-value heads of 128, each shared by 4 query heads.</text>")])
    patch("o047", [("It overflows by a hundred kilobytes. This is exactly the situation you described, at a prompt</text>",
                    "It overflows by a hundred kilobytes, at a prompt length people actually type. This is</text>"),
                   ("length people actually type.</text>",
                    "the situation tiling exists for.</text>")])
    patch("o051", [("Score matrices, FlashAttention</text>", "Score matrices, tiled</text>"),
                   (">essentially zero</text>", ">zero: S never leaves the chip</text>"),
                   ("This is not a criticism of it. It is the precondition the video keeps stating: on long sequences.",
                    "Not a criticism: the claim was always conditional, on long sequences."),
                   ("<figcaption>The entire prefill is dominated by reading the model once. That is a V1 memory-wall problem, not a V3 attention problem.</figcaption>",
                    "<figcaption>The entire prefill is dominated by reading the model once: the memory wall of the "
                    "first atlas ({{ref:v01-o105}}), not an attention problem.</figcaption>")],
          stamp_to=s)
    growth = (8192 / 200) ** 2
    assert round(growth) == 1678
    patch("o052", [("Score matrices, FlashAttention</text>", "Score matrices, tiled</text>"),
                   (">essentially zero</text>", ">zero: S never leaves the chip</text>"),
                   ("the score-matrix bar has grown by a factor of 1,700 and now accounts for 97% of the traffic.",
                    f"the score-matrix bar has grown {growth:,.0f}-fold, (8,192 ÷ 200)², and is 97% of the traffic."),
                   ("Now FlashAttention is not saving 2%. It is the difference between working and not working.",
                    "Now removing it is almost the whole job. The tiled kernel's rereads ({{fig:v03-p10}}) remain."),
                   ("<figcaption>The n squared term grows while everything else stays fixed. This single comparison is the reason the whole video exists.</figcaption>",
                    "<figcaption>The n squared term grows while everything else stays fixed. How many of the tiled "
                    f"kernel's rereads reach HBM is the loop-order question of Part {PART['fa2']}.</figcaption>")],
          stamp_to=s)


if __name__ == "__main__":
    for fn in (o048, o049, p12, patches):
        fn()
