"""V3 Part 15, decode: §5d merge 93+94; review #40 and #41, and two extra figures (n03, the block count at
decode; n04, the benchmark and the batch condition).

  n03   decode hands the chip one block per head (41:06)
  p40   without splitting, one multiprocessor walks the whole cache alone (41:53)
  o094  Flash-Decoding: split the cache, keep each chunk's bookkeeping, merge (42:07; merges o093, id kept)
  p41   merging two chunks is the online-softmax correction, applied once: the worked row (42:51)
  n04   the benchmark, and why a large batch does not need it (43:19)

Sources, each read: Flash-Decoding (Dao, Haziza, Massa, Sizov, PyTorch blog, October 2023): the split, the
log-sum-exp per split, two kernels, CodeLlama-34B from 512 to 64k at batch 1, up to 8x decoding and 50x attention.
FlashAttention 2 (arXiv 2307.08691) for the blocks per query block, head and sequence.

  python3 figures/V03/src/decode.py
"""
from common import *  # noqa: F401,F403

N_CTX, TILE, HEADS = 8192, 128, 32
STEPS, ANSWER = online(ROW_X, ROW_V)


# ---- n03: the block count at decode ------------------------------------------------------------------------------
def n03():
    prefill = (N_CTX // TILE) * HEADS
    decode = 1 * HEADS
    assert prefill == 2048 and round(prefill / H100_SMS, 1) == 15.5 and H100_SMS - decode == 100
    b = [hd(40, 46, "The H100's 132 multiprocessors, and the blocks one request hands them")]
    C, G, COLS = 14, 3, 12

    def grid(x0, busy):
        o = []
        for k in range(H100_SMS):
            i, j = divmod(k, COLS)
            o.append(cell(x0 + j * (C + G), 66 + i * (C + G), C, C, "s" if k < busy else "u", rx=2))
        return "".join(o)
    b.append(grid(40, H100_SMS))
    b.append(grid(380, decode))
    yl = 66 + 11 * (C + G) + 30
    b.append(txt(40, yl, f"prefill, {N_CTX:,} tokens: {prefill:,} blocks", "cap"))
    b.append(txt(40, yl + 18, f"about {prefill / H100_SMS:.1f} waves of 132, every one busy", "sub2"))
    b.append(txt(380, yl, f"decode, one new token: {decode} blocks", "cap"))
    b.append(txt(380, yl + 18, f"{decode} busy, {H100_SMS - decode} idle", "sub2"))
    body, yb = prose(yl + 58, [
        "FlashAttention 2 fills a chip by handing out many independent blocks of work, each one bundle of "
        "query rows for one head of one sequence in the batch ({{fig:v03-o039}}). The number of blocks is the "
        "number of multiprocessors it can keep busy.",
        f"Prefill produces thousands. At {N_CTX:,} tokens, blocks of {TILE} query rows and {HEADS} heads, that "
        f"is {N_CTX // TILE} × {HEADS} = {prefill:,} blocks, about {prefill / H100_SMS:.1f} waves, a wave being "
        "one round in which every multiprocessor takes a block. Decode produces "
        "almost none. Its query is one new token, a single row, so the query dimension contributes exactly "
        f"one block, and the count collapses to batch × heads. One request on a {HEADS}-head model gives "
        f"{decode} pieces of work, and {H100_SMS - decode} multiprocessors stand idle.",
    ])
    figure("n03", st("Flash Attention 2 fills a chip"), "Decode hands the chip one block per head", yb + 30,
           b + [body],
           esc("The same kernel on the same chip: only the shape of the work changed, from a tall block of "
               "queries to a single row."))


# ---- p40: the serial walk ---------------------------------------------------------------------------------------------
def p40():
    tiles = N_CTX // TILE
    chunks, chunk_len = 16, 512
    blocks = chunks * HEADS
    waves = blocks / H100_SMS
    per_block = chunk_len // TILE
    split_time = math.ceil(waves) * per_block
    assert (tiles, blocks, round(waves, 1), per_block, split_time) == (64, 512, 3.9, 4, 16)
    b = [hd(40, 46, "Time to walk an 8,192-token cache, in tile steps (durations schematic, counts exact)")]
    X0, SC = 230, 6.5
    rows = [("32 busy multiprocessors", tiles, "s", f"{tiles} tiles, one after another"),
            ("the other 100", tiles, None, "nothing to do"),
            (f"split into {chunks} chunks", split_time, "s", f"{math.ceil(waves)} waves of {per_block} tiles")]
    for k, (lab, n, cls, what) in enumerate(rows):
        y = 70 + k * 40
        b.append(txt(40, y + 18, lab, "cap"))
        if cls:
            b.append(cell(X0, y, n * SC, 26, cls, label=what if n * SC > 160 else None))
            if n * SC <= 160:
                b.append(txt(X0 + n * SC + 8, y + 18, what, "sub2"))
        else:
            b.append(ghost(X0, y, n * SC, 26, label=what))
    for t in (0, 16, 32, 48, 64):
        b.append(tline(X0 + t * SC, 70 + 3 * 40 - 6, X0 + t * SC, 70 + 3 * 40 - 2))
        b.append(txt(X0 + t * SC, 70 + 3 * 40 + 12, str(t), "sub2", "middle"))
    body, yb = prose(70 + 3 * 40 + 52, [
        f"Each busy multiprocessor walks the entire cached sequence alone, tile after tile: at {N_CTX:,} "
        f"tokens and tiles of {TILE}, {tiles} tiles in a row, and the longer the context, the longer the "
        "walk. Meanwhile 100 multiprocessors wait. The work is all in one dimension nobody had split: the "
        "cache itself.",
        f"Split each head's cache into {chunks} chunks of {chunk_len} tokens and the {HEADS} blocks become "
        f"{chunks} × {HEADS} = {blocks}: {waves:.1f} waves over 132 multiprocessors, each block walking only "
        f"{per_block} tiles. Every multiprocessor is busy, and the walk takes {split_time} tile steps instead "
        f"of {tiles}, before a short merge at the end.",
    ])
    figure("p40", st("walks the entire cached"), "Without splitting, one multiprocessor walks the whole cache "
           "alone", yb + 30, b + [body],
           esc("Durations assume every tile costs the same and ignore the merge; the block and wave counts are "
               "exact. The cache was never too slow to read, only read by too few."))


# ---- o094: Flash-Decoding (merges o093) -----------------------------------------------------------------------------
def o094():
    b = [hd(40, 46, "Split the cache, give every chunk its own block, merge the partial answers")]
    for k in range(4):
        x = 40 + k * 150
        b.append(cell(x, 66, 144, 30, "s", label=f"chunk {k + 1} of the cache"))
        b.append(arr(x + 72, 98, x + 72, 118))
        b.append(box(x, 122, 144, 50, "u", "its own block", "m, l, partial output"))
        b.append(ln(x + 72, 174, 340, 212))
    b.append(box(190, 214, 300, 50, "m", "merge kernel", "rescale each by its maximum's gap, add"))
    b.append(arr(340, 266, 340, 286))
    b.append(box(240, 290, 200, 36, "s", "exact attention output"))
    body, yb = prose(366, [
        "Flash-Decoding, published in October 2023 by Tri Dao and collaborators, splits the cached keys and "
        "values into chunks. Every chunk gets its own block of work, and so its own multiprocessor, which "
        "computes the new token's attention against that chunk as if it were the whole sequence.",
        "Softmax should forbid that: its normalisation couples every position in a row to every other, so "
        "partial results cannot simply be added. What makes the split legal is the bookkeeping the online "
        "softmax already keeps. Each chunk keeps its own running maximum and its own sum of exponentials, and "
        "writes them out beside its partial output, in practice as one number per row, m + ln l, the same "
        "number version 2 keeps for the backward pass.",
        "A small second kernel merges the partial outputs, rescaling each by how far its local maximum sits "
        "below the global one: the online softmax's correction, run in parallel across the chunks of the "
        "cache instead of serially down one row. The merged answer is exact attention.",
    ])
    figure("o094", st("Flash Decoding, published in October"), "Flash-Decoding", yb + 30, b + [body],
           esc("Machinery from Part 7 reused one level up. The next figure runs the merge on numbers."))


# ---- p41: the merge, computed -----------------------------------------------------------------------------------------------
def p41():
    (A,), ansA = online([ROW_X[0]], [ROW_V[0]])
    (B,), ansB = online([ROW_X[1]], [ROW_V[1]])
    M = max(A["m"], B["m"])
    wA, wB = A["l"] * math.exp(A["m"] - M), B["l"] * math.exp(B["m"] - M)
    sA, sB = wA / (wA + wB), wB / (wA + wB)
    merged = sA * ansA + sB * ansB
    lseA, lseB = A["m"] + math.log(A["l"]), B["m"] + math.log(B["l"])
    lse = math.log(math.exp(lseA) + math.exp(lseB))
    assert abs(merged - ANSWER) < 1e-12 and abs(math.exp(lseA - lse) - sA) < 1e-12
    assert (f(A["l"], 3), f(ansA, 2), f(B["l"], 3), f(ansB, 2)) == ("1.591", "15.12", "1.386", "42.92")
    assert (f(wA, 4), f(sA, 3), f(sB, 3), f(merged, 2), f((ansA + ansB) / 2, 2)) == ("0.2153", "0.134", "0.866", "39.18", "29.02")
    b = [hd(40, 46, "The worked row of Part 7, its two tiles now two chunks on two multiprocessors")]
    cols = [(40, "", "start"), (240, "scores", "end"), (330, "m", "end"), (410, "l", "end"),
            (510, "chunk's answer", "end"), (640, "weight l · e^(m − 5)", "end")]
    for x, lab, an in cols:
        b.append(txt(x, 80, lab, "sub2", an))
    rows = [("chunk A", "3, 2, 1.5", A, ansA, wA), ("chunk B", "5, 4, 1", B, ansB, wB)]
    for k, (lab, sc, S, ans, w) in enumerate(rows):
        y = 106 + k * 28
        b.append(txt(40, y, lab, "cap"))
        b.append(txt(240, y, sc, "sub2", "end"))
        b.append(txt(330, y, f(S["m"], 0), "sub2", "end"))
        b.append(txt(410, y, f(S["l"], 3), "sub2", "end"))
        b.append(txt(510, y, f(ans, 2), "sub2", "end"))
        b.append(txt(640, y, f(w, 4), "sub2", "end"))
    y2 = 106 + 2 * 28 + 6
    b.append(eq(40, y2, 600, f"shares: {f(wA, 4)} ÷ {f(wA + wB, 4)} = {f(sA, 3)}   and   "
                             f"{f(wB, 4)} ÷ {f(wA + wB, 4)} = {f(sB, 3)}", "u", 34))
    b.append(eq(40, y2 + 44, 600, f"merged: {f(sA, 3)} × {f(ansA, 2)} + {f(sB, 3)} × {f(ansB, 2)} = "
                                  f"{f(merged, 2)}, the whole row's answer", "s", 34))
    b.append(txt(40, y2 + 104, f"a plain average, ({f(ansA, 2)} + {f(ansB, 2)}) ÷ 2 = {f((ansA + ansB) / 2, 2)}: "
                               "wrong, because chunk B's scores are larger", "sub2"))
    body, yb = prose(y2 + 146, [
        f"Each chunk reports its maximum m, its sum of exponentials l, and its own answer, already divided by "
        f"its own l. The global maximum is 5. Chunk A's sum was taken against 3, so it is moved onto the "
        f"common scale by e^(3 − 5) = {f(math.exp(-2), 4)}: {f(A['l'], 3)} × {f(math.exp(-2), 4)} = {f(wA, 4)}. "
        f"Chunk B's already is. Each chunk's share of the whole row is its weight over the total.",
        f"The shares weight the two answers, and the result is {f(merged, 2)}, exactly what the full row gave "
        f"in Part {PART['online']}. The correction is the one the online softmax applies down a row; here it "
        "is applied once, to chunks that ran at the same time. Flash-Decoding stores each chunk's m + ln l as "
        f"one number, {f(lseA, 3)} and {f(lseB, 3)}, which gives the same shares.",
    ])
    figure("p41", st("A small second kernel merges"), "Merging two chunks is the online-softmax correction, "
           "applied once", yb + 30, b + [body],
           esc("Two numbers per chunk are enough to merge exactly. That is why the split costs only a small "
               "second kernel, and why the answer does not change."))


# ---- n04: the benchmark, and the batch condition ----------------------------------------------------------------------------
def n04():
    batches = [1, 2, 4, 8, 16]
    blocks = [bb * HEADS for bb in batches]
    assert blocks == [32, 64, 128, 256, 512] and blocks[3] > H100_SMS > blocks[2]
    b = [hd(40, 46, f"Blocks without splitting, {HEADS} heads, by batch size (bars to scale)")]
    X0, SC = 140, 440 / 512
    for k, (bb, n) in enumerate(zip(batches, blocks)):
        y = 66 + k * 30
        b.append(txt(40, y + 16, f"batch {bb}", "cap"))
        b.append(hbar(X0, y, n * SC, 22, "s" if n >= H100_SMS else "h", f"{n}", 1000))
    xs = X0 + H100_SMS * SC
    b.append(dashed(xs, 60, xs, 66 + 5 * 30, "--m"))
    b.append(txt(xs + 6, 66 + 5 * 30 + 14, "132 multiprocessors", "sub2"))
    y2 = 66 + 5 * 30 + 52
    b.append(hd(40, y2, "The published benchmark: CodeLlama-34B, batch 1, prompts of 512 to 64,000 tokens"))
    rows = [("decoding", "up to 8 times faster at the long end"),
            ("attention alone", "up to 50 times faster than FlashAttention without the split"),
            ("as length grows", "every other implementation slows; this one barely does")]
    for k, (lab, v) in enumerate(rows):
        y = y2 + 28 + k * 24
        b.append(txt(40, y, lab, "cap"))
        b.append(txt(170, y, v, "sub2"))
    body, yb = prose(y2 + 28 + 3 * 24 + 26, [
        "Every other attention implementation in the published comparison slows as the context grows. With "
        "Flash-Decoding, sequence length has little impact on generation speed: the serial walk of "
        "{{fig:v03-p40}} is gone, and the decoding gain at the long end, up to 8 times, rests on an attention "
        "operation up to 50 times faster.",
        "The gain concentrates where decode hurt most, at long context and small batch. A large batch already "
        "fills the chip through the batch dimension, by the same block counting: with 32 heads, a batch of 8 "
        "gives 256 blocks, more than the 132 multiprocessors, before any splitting.",
    ])
    figure("n04", st("The published benchmark runs"), "Long context at small batch is where splitting pays",
           yb + 30, b + [body],
           esc("Flash-Decoding's own write-up makes the block-count argument with the A100's 108 "
               "multiprocessors; the H100's 132 change only where the line falls."))


if __name__ == "__main__":
    for job in (n03, p40, o094, p41, n04):
        job()
