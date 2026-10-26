"""V3 Part 1, the opening: review entries #1-#4 and the rebuilt Fig 03 (§5a item 2).

  p01  one line of PyTorch is one kernel launch (0:37)
  o003 a ninefold cut in traffic gave a 5.7-fold speed-up: FlashAttention's own measurement (0:51)
  p02  the five choices the formula leaves open (1:03)
  p03  fraction of peak, defined and worked (1:59)
  p04  six levers, one target (2:26)
and restamps o002, o004, o005 into the video's order (§2b, §2c).

  python3 figures/V03/src/opening.py
"""
from common import *  # noqa: F401,F403


# ---- p01: one line of PyTorch, one launch ---------------------------------------------------------
def p01():
    N, TILE, THREADS = 4096, 128, 256              # the tile and block size are typical choices
    outputs = N * N
    side = N // TILE
    blocks = side * side
    threads = blocks * THREADS
    resident = 32 * 64 * H100_SMS                  # V02 Fig 44: 32 threads x 64 warps x 132 SMs
    assert (outputs, side, blocks, threads, resident) == (16777216, 32, 1024, 262144, 270336)
    b = [hd(40, 46, "Each line hands the GPU one kernel, launched as a grid of thread blocks")]
    b.append(box(40, 80, 190, 56, "u", "C = A @ B", "A, B: 4,096 × 4,096"))
    b.append(arr(236, 108, 266, 108))
    G0X, G0Y, P = 272, 74, 6                       # the grid: 32 x 32 blocks, 6 px pitch
    W = side * P - 1
    b.append(cell(G0X, G0Y, W, W, "m", rx=2))
    for k in range(1, side):
        x = G0X + k * P - 0.5
        b.append(f'<line class="xok" x1="{x}" y1="{G0Y}" x2="{x}" y2="{G0Y + W}" stroke="var(--paper)" stroke-width="1"/>')
        y = G0Y + k * P - 0.5
        b.append(f'<line class="xok" x1="{G0X}" y1="{y}" x2="{G0X + W}" y2="{y}" stroke="var(--paper)" stroke-width="1"/>')
    notes = ["one launch", f"{side} × {side} = {blocks:,} blocks", f"each block computes one",
             f"{TILE} × {TILE} tile of C, with", f"{THREADS} threads: {threads:,} in all"]
    for k, s in enumerate(notes):
        b.append(txt(482, 96 + k * 20, s, "sub2"))
    y2 = G0Y + W + 30
    b.append(box(40, y2, 190, 56, "u", "P = softmax(S)", "the next line"))
    b.append(arr(236, y2 + 28, 266, y2 + 28))
    b.append(ghost(272, y2, 190, 56, label="a second launch, its own grid"))
    body, yb = prose(y2 + 100, [
        "PyTorch does not do the arithmetic itself. Each operation hands the GPU a kernel, a program "
        "written in advance for that one job, and launches it as a grid of thread blocks "
        "({{fig:v03-o004}}).",
        f"Multiplying two {N:,} × {N:,} matrices produces {outputs / 1e6:.1f} million outputs. A typical "
        f"matrix-multiply kernel gives each thread block one {TILE}\u00a0×\u00a0{TILE} tile of them, so the grid is "
        f"{side}\u00a0×\u00a0{side} = {blocks:,} blocks. At {THREADS} threads a block that is {threads:,} threads, "
        f"close to the {resident:,} an H100 can hold at once ({{{{fig:v02-o044}}}}).",
        "The tile and block sizes are the kernel writer's choices, and other kernels choose differently. What "
        "does not change is the shape of it: one line, one launch, and the next line is a separate "
        "launch with its own grid.",
    ])
    figure("p01", st("When PyTorch multiplies two matrices"), "One line of PyTorch is one kernel launch",
           yb + 30, b + [body],
           esc("Every technique in this atlas changes what happens inside one of these grids, or how many "
               "of them are launched."))


# ---- o003: what FlashAttention measured -----------------------------------------------------------
def o003():
    # FlashAttention (arXiv 2205.14135) Fig 2 left: GPT-2 medium, seq 1024, head dim 64, 16 heads,
    # batch 64, A100, forward + backward.
    rows = [("HBM traffic", 40.3, 4.4, "GB"), ("time", 41.7, 7.3, "ms"), ("arithmetic", 66.6, 75.2, "GFLOP")]
    traffic, speed, flops = 40.3 / 4.4, 41.7 / 7.3, 75.2 / 66.6 - 1
    assert round(traffic, 1) == 9.2 and round(speed, 1) == 5.7 and round(100 * flops) == 13
    b = [hd(40, 46, "GPT-2 medium on an A100, attention forward and backward, as measured")]
    SC, X0 = 340, 210
    y = 72
    verdict = [f"{traffic:.1f}× less", f"{speed:.1f}× faster", f"{100 * flops:.0f}% more"]
    for k, (lab, a, c, unit) in enumerate(rows):
        top = max(a, c)
        b.append(txt(40, y + 32, lab, "cap"))
        for j, (who, v, cls) in enumerate([("standard", a, "h"), ("FlashAttention", c, "s")]):
            yy = y + j * 30
            w = v / top * SC
            b.append(cell(X0, yy + 6, w, 22, cls))
            b.append(txt(X0 + w + 8, yy + 22, f"{v:g} {unit}", "sub2"))
            b.append(txt(X0 - 12, yy + 22, who, "sub2", "end"))
        b.append(txt(40, y + 54, verdict[k], "sub2"))
        y += 84
    body, yb = prose(y + 26, [
        "Both kernels compute the same attention. The fused one moves about a ninth of the bytes, "
        f"and finishes in under a fifth of the time. It even does {100 * flops:.0f}% more arithmetic, "
        f"because its backward pass rebuilds the score matrix instead of storing it (Part {PART['recompute']}).",
        f"A {traffic:.1f}-fold cut in traffic gave a {speed:.1f}-fold cut in time, not {traffic:.1f}: only "
        "the time spent waiting on memory can be removed, and the rest of the step, the arithmetic and "
        "the launches, stays. The up to 7.6 times quoted for GPT-2 is the same paper's measurement of "
        "the attention computation alone.",
    ])
    figure("o003", st("up to 7.6 times faster"), "A ninefold cut in traffic gave a 5.7-fold speed-up",
           yb + 30, b + [body],
           esc("Each pair is drawn to its own scale. The lesson to carry: removing a bottleneck gives back "
               "what the bottleneck was costing, and no more, and less arithmetic was never the reason."))


# ---- p02: what the mathematics leaves open --------------------------------------------------------
def p02():
    rows = [("which threads do which work", "one block per head, or per block of query rows", f"Part {PART['fa2']}"),
            ("which bytes, from which memory", "tiles on chip; the score matrix never in HBM", f"Parts {PART['tiling']}–{PART['prefill']}"),
            ("in what order", "the loop order, and a softmax that runs as tiles arrive", f"Parts {PART['tiling']}, {PART['online']}"),
            ("at what precision", "16-bit or 8-bit numbers; exponentials by polynomial", f"Parts {PART['fp8']}–{PART['fa4']}"),
            ("where each result is written", "the output stays on chip until it is finished", f"Parts {PART['tiling']}, {PART['fa2']}")]
    b = [hd(40, 46, "The formula fixes the answer and nothing else")]
    b.append(box(40, 64, 600, 40, "u", f"softmax( Q Kᵀ ) V,  built in Part {PART['attention']}: every kernel must produce exactly this"))
    b.append(txt(40, 134, "the kernel decides", "sub2"))
    b.append(txt(262, 134, "for attention, the choice", "sub2"))
    b.append(txt(640, 134, "where", "sub2", "end"))
    for k, (dec, ex, part) in enumerate(rows):
        y = 146 + k * 44
        b.append(cell(40, y, 206, 32, "m", label=dec))
        b.append(txt(262, y + 21, ex, "sub2"))
        b.append(txt(640, y + 21, part, "sub2", "end"))
    body, yb = prose(146 + 5 * 44 + 30, [
        "The formula says which numbers must come out. It does not say who computes which part, where "
        "the inputs wait while they are used, in which order the additions happen, how many bits each "
        "number gets, or where the results go.",
        "Each of those is a choice about moving data, and two kernels can make them differently while "
        "producing the same output. The whole difference in speed between them lives in this table.",
    ])
    figure("p02", st("everything the mathematics leaves open"),
           "The mathematics fixes the answer; the kernel decides five things", yb + 30, b + [body],
           esc("Read the rest of the atlas as answers to these five rows. None of them changes the formula; "
               f"two of them change the rounding, which Part {PART['fixed']} settles."))


# ---- p03: fraction of peak ------------------------------------------------------------------------
def p03():
    n, d, heads = 8192, 128, 32
    ops = 4 * n * n * d * heads
    rate = 740e12                                   # FlashAttention 3, FP16, H100 (FA3 abstract)
    t = ops / rate
    frac = rate / H100_PEAK
    assert f"{ops / 1e12:.2f}" == "1.10" and f"{t * 1e3:.3f}" == "1.486" and round(100 * frac) == 75
    assert round(1.10e12 / round(t, 6) / 1e12) == 740          # the printed numbers agree
    b = [hd(40, 46, "Count the operations, time them, divide by what the chip could do")]
    b.append(txt(40, 84, "1  count", "cap"))
    b.append(eq(140, 64, 150, "QKᵀ: n·n·d", "m", 34))
    b.append(txt(298, 86, "+", "sub2"))
    b.append(eq(312, 64, 150, "PV: n·d·n", "m", 34))
    b.append(txt(470, 86, "multiply-adds, ×2", "sub2"))
    b.append(eq(140, 108, 322, "= 4 · n² · d operations per head", "m", 34))
    b.append(txt(40, 170, "2  worked", "cap"))
    b.append(txt(140, 170, f"4 × {n:,}² × {d} × {heads} heads = {ops / 1e12:.2f} × 10¹² operations", "sub2"))
    b.append(txt(40, 204, "3  time it", "cap"))
    b.append(txt(140, 204, f"if the kernel takes {t * 1e3:.3f} ms:  {ops / 1e12:.2f} × 10¹² ÷ {t:.6f} s"
                 f" = {rate / 1e12:.0f} × 10¹² per second", "sub2"))
    b.append(txt(40, 238, "4  divide", "cap"))
    b.append(eq(140, 218, 322, f"{rate / 1e12:.0f} ÷ {H100_PEAK / 1e12:.0f} = {100 * frac:.0f}% of peak", "u", 34))
    b.append(txt(470, 240, "989: the H100's ceiling", "sub2"))
    # the track, drawn to scale on 0-100%
    TX0, TX1, ty = 200, 600, 310
    sc = lambda p: TX0 + p / 100 * (TX1 - TX0)
    b.append(hd(40, ty - 16, "The number tracked from here on"))
    track = [("version 1, A100", 25, 40), ("version 2, A100", 50, 73), ("version 2, H100", 35, 35),
             ("version 3, H100", 75, 75), ("version 4, B200", 71, 71)]
    for k, (lab, lo, hi) in enumerate(track):
        y = ty + 6 + k * 30
        b.append(txt(40, y + 15, lab, "cap"))
        b.append(f'<rect x="{TX0}" y="{y + 4}" width="{TX1 - TX0}" height="14" rx="3" fill="none" '
                 f'stroke="var(--rule)" stroke-dasharray="3 3"/>')
        w = max(sc(hi) - sc(lo), 3)
        b.append(cell(sc(lo) if hi > lo else sc(lo) - 1.5, y + 4, w, 14, "s"))
        b.append(txt(sc(hi) + 8, y + 16, f"{lo}–{hi}%" if hi > lo else f"{hi}%", "sub2"))
    ya = ty + 6 + 5 * 30 + 4
    for p in (0, 50, 100):
        b.append(tline(sc(p), ya, sc(p), ya + 4))
        b.append(txt(sc(p), ya + 18, f"{p}%", "sub2", "middle"))
    body, yb = prose(ya + 54, [
        "The count comes from the shapes alone: two matrix multiplies of n·n·d multiply-adds each, and "
        "a multiply-add counts as two operations ({{fig:v01-o111}}). Only the time is measured. Their "
        "ratio is the rate the kernel achieved, and dividing by the chip's peak "
        "({{fig:v02-o082}}) says how much of its arithmetic the kernel actually used.",
        "A kernel that waits on memory is slow however fast its chip, so its fraction is low. That is "
        "why the fraction, not the speed, is the score kept from generation to generation.",
    ])
    figure("p03", st("fraction of the chip's peak arithmetic"),
           "Fraction of peak is operations done per second over operations possible", yb + 30, b + [body],
           esc("Measured against its own chip, so kernels on different generations share one scale. The "
               "strip is the climb from a quarter to three quarters, and the dip when a kernel met a chip "
               "it was not written for."))


# ---- p04: the levers ------------------------------------------------------------------------------
def p04():
    rows = [("the kernel's own intermediates", "FlashAttention, four versions", f"{PART['naive']}–{PART['fa4']}"),
            ("a model that keeps a smaller cache", "grouped-query and latent attention", f"{PART['heads']}"),
            ("a cache packed without waste", "paged attention", f"{PART['cache']}"),
            ("decode split across the chip", "Flash-Decoding", f"{PART['decode']}"),
            ("each launch paid for once", "CUDA graphs", f"{PART['launch']}"),
            ("every number in fewer bits", "FP8 and FP4; the next atlas", f"{PART['fp8']}, {PART['fixed']}")]
    b = [hd(40, 46, "Six levers, each one a way to move fewer bytes or cheaper ones")]
    b.append(txt(40, 82, "the lever", "sub2"))
    b.append(txt(318, 82, "what pulls it", "sub2"))
    b.append(txt(640, 82, "Part", "sub2", "end"))
    for k, (lev, tech, part) in enumerate(rows):
        y = 94 + k * 42
        b.append(cell(40, y, 262, 30, "s" if k == 0 else "u", label=lev))
        b.append(txt(318, y + 20, tech, "sub2"))
        b.append(txt(640, y + 20, part, "sub2", "end"))
    body, yb = prose(94 + 6 * 42 + 30, [
        "FlashAttention is the one kernel followed through all four of its versions. The other five "
        "levers come after it, and each is a different answer to the same question: which bytes can be "
        "made smaller, rarer, or cheaper to move.",
        "Two of the six change the answer on purpose: a model that keeps fewer keys and values is a "
        "different model, and fewer bits round more coarsely. The other four compute the same attention, "
        f"up to the order of additions (Part {PART['fixed']}).",
    ])
    figure("p04", st("After it come the other levers"), "Six levers, one target", yb + 30, b + [body],
           esc(f"A map for the whole atlas. The recap in Part {PART['fixed']} comes back to this list and sorts "
               "it by what each lever left untouched."))


def restamp():
    patch("o004", [], stamp_to=st("A kernel is one small program"))
    patch("o005", [], stamp_to=st("piece of work, say"))
    patch("o002", [], stamp_to=st("Two kernels can compute the same attention"))
    # o004: a multiprocessor is built in V2; point at it
    patch("o004", [("block is placed on one multiprocessor and runs there to completion.",
                    "block is placed on one multiprocessor ({{fig:v02-o024}}) and runs there to completion.")])


if __name__ == "__main__":
    for fn in (p01, o003, p02, p03, p04, restamp):
        fn()
