"""V3 Part 9, FlashAttention 2: §5d merges 65+66, 67+68 and 69+70; §5a items 3, 11, 12 and 13; review #11, #17,
#18, #18a and #19.

  o065  wait one: scalar work between the matrix multiplies, 16 times dearer per operation (merges o066)
  p17   divide once, at the end: the worked row both ways (17:47)
  o067  wait two: too few blocks; an A100 has 108 multiprocessors (merges o068)
  o039  swapping the loops keeps the output on chip and gives every query block its own thread block (moved)
  p11   every query block reads all of K and V; the L2 cache catches the repeats (18:52)
  o069  wait three: split K across warps, or split Q (merges o070)
  p18a  a barrier makes every warp wait for the slowest (19:21)
  p19   seventy-two percent of a whole training run (19:58)

  python3 figures/V03/src/fa2.py
"""
from common import *  # noqa: F401,F403

STEPS, ANSWER = online(ROW_X, ROW_V)
S1, S2 = STEPS


# ---- o065: wait one ---------------------------------------------------------------------------------
def o065():
    ratio = A100_PEAK / A100_SCALAR
    assert ratio == 16
    d = 128
    mm_ops = 4 * d                                  # per score: 2d in QK^T and 2d in PV
    scalar = 5                                      # illustrative: max, subtract, add, convert, rescale
    share_ops = scalar / (mm_ops + scalar)
    share_time = scalar * ratio / (mm_ops + scalar * ratio)
    assert round(100 * share_ops) == 1 and round(100 * share_time, 1) == 13.5
    b = [hd(40, 46, "The two kinds of arithmetic unit on an A100, drawn to scale")]
    SC = 400 / A100_PEAK
    rows = [("tensor cores", A100_PEAK, "s", "matrix multiplies only"),
            ("CUDA cores", A100_SCALAR, "h", "everything else")]
    for k, (lab, v, cls, what) in enumerate(rows):
        y = 70 + k * 40
        b.append(txt(40, y + 19, lab, "cap"))
        if v * SC > 200:
            b.append(cell(170, y + 2, v * SC, 26, cls, label=f"{v / 1e12:g} trillion a second: {what}"))
        else:
            b.append(cell(170, y + 2, v * SC, 26, cls))
            b.append(txt(170 + v * SC + 8, y + 20, f"{v / 1e12:g} trillion a second: {what}", "sub2"))
    y2 = 170
    b.append(hd(40, y2, f"One score at d = {d}: what it costs, as an illustration"))
    b.append(txt(40, y2 + 30, "tensor-core operations", "cap"))
    b.append(txt(300, y2 + 30, f"{mm_ops}: 2 × {d} for QKᵀ and 2 × {d} for PV", "sub2"))
    b.append(txt(40, y2 + 54, "scalar operations", "cap"))
    b.append(txt(300, y2 + 54, f"about {scalar}: max, subtract, add, convert, rescale", "sub2"))
    b.append(txt(40, y2 + 78, "share of the operations", "cap"))
    b.append(txt(300, y2 + 78, f"{scalar} ÷ {mm_ops + scalar} = {100 * share_ops:.0f}%", "sub2"))
    b.append(txt(40, y2 + 102, "share of the time", "cap"))
    b.append(txt(300, y2 + 102, f"{scalar} × {ratio:.0f} = {scalar * ratio:.0f};  {scalar * ratio:.0f} ÷ "
                                f"({mm_ops} + {scalar * ratio:.0f}) = {100 * share_time:.1f}%", "sub2"))
    body, yb = prose(y2 + 140, [
        "Softmax is not a matrix multiply, so it cannot run on the tensor cores. Its maximums, rescales and "
        "divisions run on the CUDA cores, the general-purpose units ({{fig:v02-o078}}), and its exponentials "
        "on the multi-function unit, which is scarcer still. On an A100 the tensor cores deliver 312 trillion "
        "operations a second and the scalar path 19.5: 312 ÷ 19.5 = 16.",
        "So every scalar operation the kernel cannot avoid costs about 16 matrix operations' worth of time, "
        "and while it runs between two matrix multiplies, the tensor cores hold. A handful of scalar steps "
        f"per score is about 1% of the operations and, at sixteen times the price, {100 * share_time:.0f}% of "
        "the time, before the exponentials are counted at all. The count of five is illustrative; the "
        "multiplier is not.",
    ])
    figure("o065", st("runs on the CUDA Cores"), "Wait one: scalar work between the matrix multiplies",
           yb + 30, b + [body],
           esc("Not a memory problem at all. A chip with two kinds of arithmetic unit is fast only while the "
               "expensive kind is the one that is busy, so the first fix is to give the slow units less to do."))


# ---- p17: divide once ---------------------------------------------------------------------------------
def p17():
    l1, O1, l2, O2, c = S1["l"], S1["O"], S2["l"], S2["O"], S2["c"]
    new_O = O2 - O1 * c
    fa1_1 = O1 / l1                                           # version 1 keeps O as a finished average
    fa1_2 = (l1 * c * fa1_1 + new_O) / l2                     # FA1 Algorithm 1, line 12
    assert abs(fa1_2 - ANSWER) < 1e-12 and f(fa1_1, 2) == "15.12"
    n, B = 8192, 128
    assert n // B == 64
    b = [hd(40, 46, "The worked row, with the output kept two ways")]
    cols = [(40, "", "start"), (330, "version 1: an average at every step", "end"),
            (640, "version 2: unnormalised until the end", "end")]
    for cx, lab, an in cols:
        b.append(txt(cx, 82, lab, "sub2", an))
    rows = [("after tile 1", f"24.05 ÷ {f(l1, 3)} = {f(fa1_1, 2)}", f"{f(O1, 2)}"),
            ("after tile 2", f"(rescale, add, ÷ {f(l2, 3)}) = {f(fa1_2, 2)}", f"{f(O2, 2)}"),
            ("at the end", f"{f(fa1_2, 2)}", f"{f(O2, 2)} ÷ {f(l2, 4)} = {f(ANSWER, 2)}"),
            ("divisions per row", "one per tile", "one")]
    for k, (lab, a, z) in enumerate(rows):
        y = 106 + k * 28
        b.append(txt(40, y, lab, "cap"))
        b.append(txt(330, y, a, "sub2", "end"))
        b.append(txt(640, y, z, "sub2", "end"))
    y2 = 106 + 4 * 28 + 10
    b.append(eq(40, y2, 290, "O = (l·c·O + new terms) ÷ l_new", "h", 32))
    b.append(eq(350, y2, 290, "Õ = c·Õ + new terms;  O = Õ ÷ l, once", "s", 32))
    body, yb = prose(y2 + 70, [
        "The first version kept the running output as a finished weighted average, so after every tile it "
        "multiplied the old average back up by its old sum and divided by the new one. Version 2 lets the "
        "output run unnormalised, exactly as the worked row did in Part 7, and divides once when the row is "
        "done. Both end at the same answer.",
        f"At {n:,} tokens and blocks of {B}, that is {n // B} divisions of every output row against one, and "
        "the multiplications that undid each division go too. Version 2 also stores a single number per row "
        "for the backward pass, m + ln l, instead of two.",
    ])
    figure("p17", st("writes through the whole loop unnormalized"), "Divide once, at the end", yb + 30,
           b + [body],
           esc("The result is unchanged and the scalar work shrinks. It is the first wait removed, and it is "
               "pure bookkeeping: the order of a multiplication and a division."))


# ---- o067: wait two ----------------------------------------------------------------------------------
def o067():
    batch, heads = 2, 16
    blocks = batch * heads
    idle = A100_SMS - blocks
    assert (blocks, idle, round(100 * idle / A100_SMS)) == (32, 76, 70)
    b = [hd(40, 46, f"Version 1 on an A100: one thread block per head per sequence, {blocks} for 108 multiprocessors")]
    cols, C, G = 18, 24, 6
    for k in range(A100_SMS):
        i, j = divmod(k, cols)
        b.append(cell(40 + j * (C + G) + 30, 70 + i * (C + G), C, C, "s" if k < blocks else "u", rx=3))
    yl = 70 + 6 * (C + G) + 10
    b.append(txt(70, yl + 6, f"teal: the {blocks} multiprocessors given a block;  grey: the {idle} with nothing to do",
                 "sub2"))
    body, yb = prose(yl + 46, [
        "A kernel's work is handed out as thread blocks, and each block runs on one multiprocessor until it "
        "finishes ({{fig:v03-o004}}). So the number of blocks caps how much of the chip can be busy.",
        f"The first version made one block per head per sequence in the batch, the batch being however many "
        f"separate sequences the chip is processing at once. Serve two long sequences on a model with "
        f"{heads} heads and that is {batch} × {heads} = {blocks} blocks. An A100 has 108 multiprocessors, so "
        f"{idle} of them, {100 * idle / A100_SMS:.0f}%, sit idle however well each block is written.",
    ])
    figure("o067", st("the number of blocks is the number of"), "Wait two: too few blocks to fill the chip",
           yb + 30, b + [body],
           esc("Occupancy is set by how the problem is cut up, not by the hardware. Long sequences make it "
               "worse, because they force small batches."))


# ---- o039 (moved here): the loops swapped -------------------------------------------------------------------
def o039():
    n, B, batch, heads = 8192, 128, 2, 16
    blocks = batch * heads * (n // B)
    waves = blocks / A100_SMS
    assert blocks == 2048 and round(waves, 1) == 19.0
    b = [hd(40, 46, "Version 2: Q outside, K and V inside, one thread block per block of queries")]
    b.append(cont(40, 62, 600, 166, "u", "on one multiprocessor, for the whole inner loop"))
    b.append(box(62, 100, 170, 42, "s", "Q block", "loaded once"))
    b.append(box(62, 152, 170, 42, "s", "O, m and l", "stay on the chip"))
    for k in range(3):
        x = 252 + k * 128
        b.append(box(x, 100, 112, 42, "h", f"K, V block {k + 1}", "streams in"))
        if k:
            b.append(arr(x - 14, 121, x - 2, 121))
        b.append(box(x, 152, 112, 42, "m", "S tile", "made, used, gone"))
    y2 = 62 + 166 + 30
    b.append(txt(40, y2, f"blocks of work at {batch} sequences × {heads} heads, {n:,} tokens:", "cap"))
    rows = [("version 1", batch * heads), (f"version 2: × {n // B}", blocks)]
    SC = 400 / blocks
    line_x = 200 + A100_SMS * SC
    for k, (lab, v) in enumerate(rows):
        y = y2 + 16 + k * 34
        b.append(txt(40, y + 18, lab, "cap"))
        if k:
            b.append(cell(200, y + 2, v * SC, 24, "s", label=f"{v:,} blocks"))
        else:
            b.append(cell(200, y + 2, max(v * SC, 3), 24, "h"))
            b.append(txt(line_x + 8, y + 19, f"{v:,} blocks", "sub2"))
    b.append(dashed(line_x, y2 + 10, line_x, y2 + 16 + 2 * 34, "--muted"))
    b.append(txt(line_x + 6, y2 + 16 + 2 * 34 + 12, "108 multiprocessors", "sub2"))
    body, yb = prose(y2 + 16 + 2 * 34 + 44, [
        "Version 2 swaps the loops. Each thread block takes one block of queries, keeps it and its running "
        "output on the chip, and streams every block of K and V past them. The output is written to HBM once, "
        "when the row of tiles is finished, instead of making a trip on every step as in version 1 "
        "({{fig:v03-p10}}).",
        f"The swap also makes the blocks of queries independent of each other, so each can be its own thread "
        f"block. At {n:,} tokens that is {n // B} per head: the {batch * heads} blocks of version 1 become "
        f"{blocks:,}, about {waves:.0f} rounds of work for 108 multiprocessors, and one long sequence can fill "
        "the chip on its own.",
    ])
    figure("o039", st("splits the query rows"),
           "Swapping the loops keeps the output on chip and gives every query block its own thread block",
           yb + 30, b + [body],
           esc("Teal stays for the whole loop, red streams through, gold lives for microseconds. The trips did not "
               "disappear: K and V now make them instead, and the next figure counts what that costs."))


# ---- p11: K and V make the trips now ----------------------------------------------------------------------
def p11():
    n, d, B = 8192, 64, 128
    row = n * d * 2
    nb = n // B
    fa2 = 2 * row + nb * 2 * row + n * 4                # Q in, O out, L out; K and V read once per Q block
    fa1 = 2 * row + nb * row + 2 * nb * row + 2 * nb * n * 2 * 4
    floor = 4 * row
    ops = 4 * n * n * d
    inten = ops / fa2
    kv = 2 * row
    assert round(fa2 / 1e6, 1) == 136.3 and round(inten) == 126 and round(fa1 / 1e6, 1) == 211.8
    assert round(kv / 1e6, 1) == 2.1 and inten < RIDGE and round(H100_L2 / kv) == 25
    b = [hd(40, 46, f"One head, {n:,} tokens, d = {d}, blocks of {B}, if every read came from HBM")]
    SC = 400 / fa1
    rows = [("version 1's order", fa1, "h", "Q and O make the trips"), ("version 2's order", fa2, "h", "K and V make them"),
            ("every byte once", floor, "s", "the floor")]
    for k, (lab, v, cls, why) in enumerate(rows):
        y = 66 + k * 36
        b.append(txt(40, y + 19, lab, "cap"))
        b.append(hbar(190, y + 2, v * SC, 24, cls, f"{v / 1e6:.1f} MB: {why}", 260))
    y2 = 66 + 3 * 36 + 24
    b.append(eq(40, y2, 600, f"intensity ≈ 4·n²·d ÷ ( n/{B} trips × 4·n·d bytes )  =  {B}:   here {inten:.0f} per byte, "
                             f"under the ridge of {RIDGE:.0f}", "u", 34))
    body, yb = prose(y2 + 70, [
        f"In version 2's order each block of queries reads all of K and V, so K and V are read {nb} times. "
        f"Counted that way the head moves {fa2 / 1e6:.0f} MB, less than version 1's {fa1 / 1e6:.0f}, because "
        f"only K and V travel now, but still {fa2 / floor:.0f} times the floor. The arithmetic per byte "
        "works out to about the block height: a block of 128 queries reuses each byte of K and V 128 times.",
        f"They mostly do not come from HBM. The repeats are the same {kv / 1e6:.1f} MB of K and V, requested "
        "by query blocks of the same head running side by side, and the H100's 50 MB L2 cache, shared by "
        f"every multiprocessor ({{{{fig:v02-o052}}}}), holds that {H100_L2 / kv:.0f} times over. Version 4 "
        "orders its blocks deliberately so that these loads hit in L2.",
        "How large a share the cache catches is something a profiler measures, not something this count can "
        "settle; the count is the worst case.",
    ])
    figure("p11", st("splits the query rows"),
           "Every block of queries reads all of K and V, and the L2 cache catches the repeats", yb + 30, b + [body],
           esc("The swap traded trips by Q and O, each private to one block, for trips by K and V, which every "
               "block shares. Shared trips are the kind a cache can absorb."))


# ---- o069: wait three ---------------------------------------------------------------------------------
def o069():
    b = [hd(40, 46, "Four warps share one block of work: who gets which part")]
    for g, (title, x0, split_k) in enumerate((("version 1: split K and V", 40, True), ("version 2: split Q", 360, False))):
        b.append(txt(x0, 80, title, "hd"))
        W, H = 240, 120
        for w in range(4):
            if split_k:
                b.append(cell(x0 + w * W / 4, 94, W / 4 - 4, H, "h", label=f"w{w + 1}"))
            else:
                b.append(cell(x0, 94 + w * H / 4, W, H / 4 - 4, "s", label=f"w{w + 1}"))
        b.append(txt(x0, 94 + H + 22, "each warp: part of every row's answer" if split_k else
                     "each warp: whole rows, finished alone", "sub2"))
        b.append(txt(x0, 94 + H + 40, "so they must add up through shared memory" if split_k else
                     "nothing to exchange", "sub2"))
    body, yb = prose(94 + 120 + 80, [
        "A thread block's warps, the 32-thread groups that run in lockstep ({{fig:v02-o037}}), divide its "
        "work among them. Version 1 gave each warp a slice of K and V. Every warp then held a part of every "
        "query row's answer, and the parts had to be written to shared memory, waited for, and added before "
        "any row could finish.",
        "Version 2 gives each warp a slice of Q instead. Rows are independent ({{fig:v03-o023}}), so a warp "
        "with whole rows carries them all the way to the output on its own, and the exchange disappears. No "
        "arithmetic changed; only which warp was given which piece.",
    ])
    figure("o069", st("divided K and V across"), "Wait three: warps talking to each other", yb + 30, b + [body],
           esc("Any split that cuts across a row manufactures a need to communicate that the mathematics never "
               "had. Three waits, three rearrangements, and none of them changed the result."))


# ---- p18a: the barrier --------------------------------------------------------------------------------
def p18a():
    finish = [0.62, 0.80, 0.70, 0.95]                # schematic: warps finish their partial sums at different times
    X0, X1 = 110, 600
    T = lambda t: X0 + t * (X1 - X0) / 1.3
    b = [hd(40, 46, "Split K: every warp waits at the barrier for the slowest (durations schematic)")]
    for w, fin in enumerate(finish):
        y = 70 + w * 30
        b.append(txt(40, y + 16, f"warp {w + 1}", "cap"))
        b.append(cell(T(0), y, T(fin) - T(0), 20, "s", rx=2))
        if fin < max(finish):
            b.append(f'<rect x="{T(fin):.1f}" y="{y}" width="{T(max(finish)) - T(fin):.1f}" height="20" rx="2" '
                     f'fill="none" stroke="var(--h)" stroke-dasharray="3 3"/>')
        b.append(cell(T(max(finish)) + 4, y, T(1.25) - T(max(finish)) - 4, 20, "h", rx=2))
    yb_ = 70 + 4 * 30
    b.append(dashed(T(max(finish)) + 2, 64, T(max(finish)) + 2, yb_ + 4, "--h"))
    b.append(txt(T(max(finish)) + 2, yb_ + 20, "barrier", "sub2", "middle"))
    b.append(txt(X0, yb_ + 40, "teal: own share of the work;  dashed: waiting;  red: exchanging partial sums",
                 "sub2"))
    y2 = yb_ + 70
    b.append(txt(40, y2, "Split Q: no barrier", "hd"))
    for w, fin in enumerate(finish):
        y = y2 + 14 + w * 30
        b.append(txt(40, y + 16, f"warp {w + 1}", "cap"))
        b.append(cell(T(0), y, T(fin) - T(0), 20, "s", rx=2))
        b.append(txt(T(fin) + 8, y + 15, "rows done", "sub2"))
    body, yb = prose(y2 + 14 + 4 * 30 + 30, [
        "A barrier is a point in the code that no warp may pass until every warp in the block has reached "
        "it. Split K needs one: the partial sums can only be added once all four exist. So every warp's time "
        "becomes the slowest warp's time, and then the exchange through shared memory comes on top.",
        "Split Q needs no barrier for this: each warp's rows are finished when its own work is. The warps "
        "still differ in speed, but nobody waits for anybody.",
    ])
    figure("p18a", st("before anything could finish"), "A barrier makes every warp wait for the slowest",
           yb + 30, b + [body],
           esc("Waiting time is the gap between each warp and the slowest one, plus the exchange. Removing the "
               "need to exchange removes both."))


# ---- p19: the training run -------------------------------------------------------------------------------
def p19():
    mfu = 225e12 / A100_PEAK
    assert round(100 * mfu, 1) == 72.1
    b = [hd(40, 46, "Fraction of the A100's 312 trillion, drawn to scale")]
    X0, X1 = 230, 610
    sc = lambda p: X0 + p * (X1 - X0)
    rows = [("version 1, attention alone", 0.25, 0.40, "u"), ("version 2, attention alone", 0.50, 0.73, "s"),
            ("version 2, a whole training run", mfu, mfu, "s")]
    for k, (lab, lo, hi, cls) in enumerate(rows):
        y = 70 + k * 40
        b.append(txt(40, y + 19, lab, "cap"))
        b.append(f'<rect x="{X0}" y="{y + 2}" width="{X1 - X0}" height="24" rx="3" fill="none" '
                 f'stroke="var(--rule)" stroke-dasharray="3 3"/>')
        if lo == hi:
            b.append(cell(X0, y + 2, sc(hi) - X0, 24, cls, label=f"225 trillion = {100 * hi:.0f}%"))
        else:
            b.append(cell(sc(lo), y + 2, sc(hi) - sc(lo), 24, cls))
            b.append(txt(sc(hi) + 8, y + 19, f"{round(100 * lo)}–{round(100 * hi)}%", "sub2"))
    for p in (0, 0.5, 1):
        b.append(tline(sc(p), 192, sc(p), 196))
        b.append(txt(sc(p), 210, f"{round(100 * p)}%", "sub2", "middle"))
    body, yb = prose(246, [
        "The three rearrangements roughly doubled the number being tracked: 25 to 40% of peak became 50 to "
        "73% on the A100, for the attention kernel measured on its own.",
        "The cleanest end-to-end test of a kernel is a whole training run, so the headline here is a "
        "training number rather than an inference one. GPT-style models trained at up to 225 trillion "
        "operations a second per A100: 225 ÷ 312 = 72%. That figure is the model FLOPs utilisation: the "
        "operations the model needs by its own arithmetic, done per second, as a fraction of what the "
        "hardware could do.",
        "Those are A100 numbers, measured on the chip the kernel was written for.",
    ])
    figure("p19", st("225 trillion operations"), "Seventy-two percent of a whole training run", yb + 30,
           b + [body],
           esc("Model FLOPs utilisation counts only the arithmetic the model requires, so recomputation and "
               "every other overhead count against it. It is the same fraction of peak, measured on a whole run."))


if __name__ == "__main__":
    for job in (o065, p17, o067, o039, p11, o069, p18a, p19):
        job()
