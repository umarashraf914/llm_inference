"""V7 Part 8, preemption: b49, o017 rebuilt, b50 (P49–P50 of the review; §5 item 25 for Fig 17).

  b49   a full batch outgrows its memory within a few steps: 223 requests, 37 spare blocks, 3 steps
  o017  vLLM evicts whole sequences, and gets them back by swapping or by recomputing
  b50   swap against recompute, priced in milliseconds on a log scale

The memory budget is the review's: 80 GB, less Llama 3 8B's 16.06 GB of weights and an assumed 4 GB
of working space, leaves 59.94 GB for caches. PCIe Gen5: 32 GT/s per lane, 16 lanes, 128b/130b.

  python3 figures/V07/src/preempt.py
"""
import math
from bcommon import (SRT, BW, KV8, P8, PEAK, RIDGE, W8, arr, box, cell, emit, f, g, ghost, hd, ln,
                     prose, stamp, txt)

BLOCK = 16
POOL = 80e9 - W8 - 4e9                          # bytes left for caches
BLOCK_BYTES = BLOCK * KV8
CTX = 2048


def admit():
    """Fill the pool with requests of 2,048 - r tokens (r = i mod 16, so they cross block
    boundaries at different steps). Returns (requests, blocks in the pool, blocks free)."""
    blocks = int(POOL // BLOCK_BYTES)
    per = math.ceil(CTX / BLOCK)
    n = blocks // per
    return n, blocks, blocks - n * per


def growth(n, free):
    """Step by step: who needs a new block, and how many are left. Stops at the first shortfall."""
    lengths = [CTX - (i % BLOCK) for i in range(n)]
    out, step = [], 0
    while True:
        step += 1
        need = sum(1 for L in lengths if L % BLOCK == 0)       # the next token starts a new block
        out.append((step, need, free))
        if need > free:
            return out
        free -= need
        lengths = [L + 1 for L in lengths]


def b49():
    n, blocks, free = admit()
    assert round(POOL / 1e9, 2) == 59.94 and blocks == 28_581 and (n, free) == (223, 37)
    steps = growth(n, free)
    assert [(s, need, fr) for s, need, fr in steps] == [(1, 14, 37), (2, 14, 23), (3, 14, 9)]
    step_s = (W8 + n * CTX * KV8) / BW                         # one decode step, weights and caches
    assert round(step_s * 1e3, 1) == 22.7
    b = [hd(40, 46, f"Free blocks after admitting {n} requests of about {g(CTX)} tokens, step by step")]
    X0, CW = 130, 10
    rows = [("admitted", 0, f"{free} free")]
    used = 0
    for s_, need, fr in steps:
        take = min(need, fr)
        used += take
        rows.append((f"step {s_}", used, f"{fr - need} free" if need <= fr else ""))
    for k, (lab, taken, note) in enumerate(rows):
        y = 70 + k * 34
        b.append(txt(40, y + 15, lab, "cap"))
        for j in range(free):
            b.append(cell(X0 + j * CW, y, CW - 3, 20, "m" if j < taken else "s", rx=2))
        if note:
            b.append(txt(X0 + free * CW + 10, y + 15, note, "sub2"))
    short = steps[-1][1] - steps[-1][2]
    yl = 70 + 3 * 34
    for j in range(short):
        b.append(ghost(X0 + (free + j) * CW, yl, CW - 3, 20, rx=2))
    b.append(txt(X0 + (free + short) * CW + 8, yl + 15, f"{short} short", "sub2"))
    assert X0 + (free + short) * CW + 8 + 45 < 640
    b.append(cell(X0, 208, 12, 12, "s")); b.append(txt(X0 + 18, 218, "free block", "sub2"))
    b.append(cell(X0 + 110, 208, 12, 12, "m")); b.append(txt(X0 + 128, 218, "taken by a growing cache", "sub2"))
    b.append(ghost(X0 + 300, 208, 12, 12, rx=2)); b.append(txt(X0 + 318, 218, "needed, not there", "sub2"))
    body, yb = prose(262, [
        f"On one H100 serving Llama 3 8B, take {f(POOL / 1e9)} GB for caches: 80 GB, less 16.06 GB of "
        f"weights and an assumed 4 GB of working space ({{{{fig:v07-a10}}}}). In blocks of {BLOCK} "
        f"tokens, 2 MiB each, that "
        f"is {g(blocks)} blocks. A request holding about {g(CTX)} tokens needs {CTX // BLOCK} of them, so "
        f"{n} requests fit, with {free} blocks to spare.",
        f"Every step adds one token to every request, and a request needs a fresh block each time its "
        f"length passes a multiple of {BLOCK} ({{{{fig:v07-a14}}}}). Their lengths differ, so about "
        f"{n} ÷ {BLOCK} ≈ "
        f"{round(n / BLOCK)} need one at each step. The {free} spare blocks last two steps; on the "
        f"third, {steps[-1][1]} requests need a block and {steps[-1][2]} are left.",
        f"At about {f(step_s * 1e3, 0)} ms a step, that is under a tenth of a second. Admitting work "
        "against the caches' size now is a bet on their size later, and when the bet fails something "
        "has to be evicted.",
    ])
    emit("b49", stamp(SRT, "Memory runs out first."),
         "A full batch outgrows its memory within a few steps", yb + 32, b + [body],
         "Every cell drawn is one 2 MiB block. A cache grows with every token, so a full batch is "
         "always a few steps from overflowing, and eviction is part of running at capacity rather "
         "than an emergency.")


def o017():
    b = [hd(40, 46, "The sequence's blocks leave together, and come back one of two ways")]
    # swapping: out to CPU memory over the bus, and back later
    b.append(txt(40, 76, "swapping", "cap"))
    b.append(box(40, 88, 120, 50, "u", "GPU memory", rx=6))
    b.append(box(220, 88, 120, 50, "u", "CPU memory", rx=6))
    b.append(arr(164, 104, 214, 104))
    b.append(arr(216, 124, 166, 124))
    b.append(txt(190, 98, "out", "sub2", "middle"))
    b.append(txt(190, 144, "back", "sub2", "middle"))
    b.append(txt(40, 164, "paid in bus bandwidth", "sub2"))
    # recomputing: discard, then rebuild in one prefill
    b.append(txt(380, 76, "recomputing", "cap"))
    b.append(box(380, 88, 120, 50, "u", "prompt + output", "as text", rx=6))
    b.append(box(540, 88, 100, 50, "m", "one prefill", rx=6))
    b.append(arr(504, 113, 534, 113))
    b.append(txt(380, 164, "paid in arithmetic", "sub2"))
    body, yb = prose(204, [
        "vLLM evicts a whole sequence at a time, all of its blocks or none, because attention needs "
        "all of them together anyway: a sequence missing one block cannot take its next step. Getting "
        "it back costs one of two things.",
        "Swapping copies the blocks out to CPU memory, the server's ordinary main memory, larger and "
        "slower than the GPU's own, and back again when the sequence resumes. "
        "Recomputing discards them and rebuilds them later.",
        "Recomputing is cheaper than it sounds. The tokens the request has already generated are "
        "appended to its original prompt, and the whole cache is rebuilt in a single prefill pass "
        "instead of one token at a time. Which way wins depends on the machine: how much bandwidth "
        "sits between CPU and GPU, against how much compute is spare.",
    ])
    emit("o017", stamp(SRT, "vLLM evicts a whole sequence at a time,"),
         "vLLM evicts whole sequences, and gets them back one of two ways", yb + 32, b + [body],
         "A genuine hardware-dependent choice rather than a best practice. The next figure puts "
         "milliseconds on both.")


def b50():
    tokens = 2500
    cache = tokens * KV8
    gen5 = 16 * 32e9 * (128 / 130) / 8
    gen4 = gen5 / 2
    swap5, swap4 = 2 * cache / gen5, 2 * cache / gen4
    prefill = 2 * P8 * tokens / PEAK
    by_token = tokens * W8 / BW
    assert round(cache / 1e6) == 328 and round(gen5 / 1e9, 1) == 63.0
    assert (round(swap5 * 1e3, 1), round(swap4 * 1e3, 1)) == (10.4, 20.8)
    assert round(prefill * 1e3, 1) == 40.6 and round(by_token, 1) == 12.0
    assert abs(by_token / prefill - RIDGE) < 0.5 and swap5 < prefill
    rows = [("swap, PCIe Gen5", swap5, "s", f"{f(swap5 * 1e3, 1)} ms"),
            ("swap, PCIe Gen4", swap4, "s", f"{f(swap4 * 1e3, 1)} ms"),
            ("recompute, one prefill", prefill, "m", f"at least {f(prefill * 1e3, 1)} ms"),
            ("recompute, token by token", by_token, "h", f"{f(by_token, 1)} s")]
    b = [hd(40, 46, f"Getting back a Llama 3 8B request that held {g(tokens)} tokens: {round(cache / 1e6)} MB of cache")]
    X0, DEC = 216, 86                           # 1 ms at X0, one decade per 86 px, to 10 s
    xs = lambda sec: X0 + math.log10(sec * 1e3) * DEC
    for k, lab in enumerate(["1 ms", "10 ms", "100 ms", "1 s", "10 s"]):
        x = X0 + k * DEC
        b.append(ln(x, 214, x, 218, "tick"))
        b.append(txt(x, 232, lab, "sub2", "middle"))
    b.append(ln(X0, 214, X0 + 4.2 * DEC, 214, "axis"))
    for k, (lab, v, cls, note) in enumerate(rows):
        y = 70 + k * 36
        b.append(txt(40, y + 17, lab, "cap"))
        b.append(cell(X0, y, xs(v) - X0, 24, cls))
        b.append(txt(xs(v) + 8, y + 17, note, "sub2"))
    assert xs(by_token) + 8 + 50 < 640
    body, yb = prose(270, [
        f"The request keeps {g(tokens)} × {g(KV8)} bytes = {round(cache / 1e6)} MB of keys and values "
        f"({{{{fig:v07-a07}}}}). Swapping moves them over PCIe, the bus between CPU and GPU "
        "({{fig:v02-o007}}). A Gen5 link has 16 lanes, each carrying 32 billion bits a second, 128 of "
        f"every 130 of them data: 16 × 32 × 128/130 ÷ 8 = {f(gen5 / 1e9, 1)} GB/s each way. Out and "
        f"back takes 2 × {f(cache / gen5 * 1e3, 1)} = {f(swap5 * 1e3, 1)} ms; on a Gen4 link, half as "
        f"fast, {f(swap4 * 1e3, 1)} ms. Those are the link's rates, and a real copy gets somewhat less.",
        f"Recomputing as one prefill costs 2 × 8.03 billion × {g(tokens)} operations: at least "
        f"{f(prefill * 1e3, 1)} ms at the H100's peak. Rebuilt token by token, every token would read "
        f"all 16.06 GB of weights: {g(tokens)} × {f(W8 / BW * 1e3, 2)} ms = {f(by_token, 1)} s, "
        f"{f(by_token / prefill, 0)} times longer. That factor is the ridge again ({{{{fig:v01-o126}}}}).",
        "On these numbers swapping wins when the bus is free. A busier bus, a GPU with arithmetic to "
        "spare between memory-bound decode steps, or a model with a smaller cache per token moves the "
        "line, which is why the choice depends on the machine.",
    ])
    emit("b50", stamp(SRT, "Recomputing is cheaper than it sounds,"),
         "Swap or recompute: milliseconds either way, and never token by token", yb + 32, b + [body],
         "Log scale, one division per factor of ten. The two sensible options sit within a factor of "
         "four of each other; the naive one takes 295 times as long as a single prefill.")


if __name__ == "__main__":
    for fn in (b49, o017, b50):
        fn()
