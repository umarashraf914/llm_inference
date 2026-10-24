"""V3 Part 8, recomputation and the first result: §5d merges 61+62 and 63+64, §5a item 25, §5c voice.

  o061  store it or make it again: 134 MB against 64 KB, and the 13% of extra arithmetic it costs (merges o062)
  o063  the first result, and the next problem: 25 to 40% of peak, three waits named (merges o064)
  patches: o060 restamped

  python3 figures/V03/src/recompute.py
"""
from common import *  # noqa: F401,F403


def o061():
    n = 8192
    p_bytes = n * n * 2                       # the weights P of one head, 16-bit
    ml_bytes = n * 2 * 4                      # m and l, FP32, per row
    flops = (66.6, 75.2)                      # FA1 Fig 2 left, GPT-2 medium, forward + backward
    assert round(p_bytes / 1e6) == 134 and ml_bytes == 65536 and p_bytes // ml_bytes == 2048
    assert round(100 * (flops[1] / flops[0] - 1)) == 13
    b = [hd(40, 46, "What the backward pass needs, kept two ways, for one head at 8,192 tokens")]
    rows = [("store the weights P", "an n × n matrix in HBM", f"{p_bytes / 1e6:.0f} MB", "h"),
            ("store m and l, rebuild P", "two numbers per row", f"{ml_bytes / 1024:.0f} KB", "s")]
    for k, (lab, what, size, cls) in enumerate(rows):
        y = 66 + k * 44
        b.append(cell(40, y, 230, 32, cls, label=lab))
        b.append(txt(286, y + 21, what, "sub2"))
        b.append(txt(640, y + 21, size, "sub2", "end"))
    y2 = 66 + 2 * 44 + 28
    b.append(hd(40, y2, "The price, as measured on GPT-2 medium, forward and backward"))
    SC = 300 / flops[1]
    for k, (lab, v, cls) in enumerate((("standard", flops[0], "h"), ("FlashAttention", flops[1], "s"))):
        y = y2 + 18 + k * 34
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(cell(200, y + 2, v * SC, 24, cls))
        b.append(txt(200 + v * SC + 8, y + 19, f"{v:g} billion operations", "sub2"))
    body, yb = prose(y2 + 18 + 2 * 34 + 34, [
        "Training runs a backward pass that needs the attention weights again ({{fig:v03-o060}}). Stored, "
        f"they are a fresh n × n matrix in HBM, {p_bytes / 1e6:.0f} MB for this one head. The first version "
        f"stored only the running maximum and sum of each row, {ml_bytes // 1024} KB, {p_bytes // ml_bytes:,} "
        "times less; version 2 stores a single number per row, m + ln l.",
        "In the backward pass the kernel reloads Q, K and V tile by tile and rebuilds each tile of S and P "
        "on chip, from m and l, at the moment it is needed. The extra multiplications run on data already in "
        f"SRAM. They added {100 * (flops[1] / flops[0] - 1):.0f}% to the arithmetic, and the kernel was still "
        "5.7 times faster, because the HBM traffic they replaced is the expensive kind.",
    ])
    figure("o061", st("recomputes each tile"), "Recomputation instead of storage", yb + 30, b + [body],
           esc("Never spend HBM traffic on anything you can rebuild from what is already on chip. A trade that "
               "would be absurd if arithmetic were expensive, and is obviously right on a chip where it is the "
               "cheap side of a 295-to-1 ratio."))


def o063():
    b = [hd(40, 46, "Memory handled, and the tensor cores still mostly idle")]
    X0, X1 = 200, 600
    sc = lambda p: X0 + p / 100 * (X1 - X0)
    b.append(txt(40, 84, "version 1, A100", "cap"))
    b.append(f'<rect x="{X0}" y="70" width="{X1 - X0}" height="22" rx="3" fill="none" stroke="var(--rule)" '
             f'stroke-dasharray="3 3"/>')
    b.append(cell(sc(25), 70, sc(40) - sc(25), 22, "s"))
    b.append(txt(sc(40) + 8, 86, "25–40% of peak", "sub2"))
    for p in (0, 50, 100):
        b.append(tline(sc(p), 98, sc(p), 102))
        b.append(txt(sc(p), 116, f"{p}%", "sub2", "middle"))
    waits = [("work on the slow units", "scalar steps between the matrix multiplies"),
             ("too few pieces of work", "not enough thread blocks to fill the chip"),
             ("warps waiting on warps", "partial results exchanged inside a block")]
    b.append(txt(40, 152, "what the rest of the time went on", "sub2"))
    for k, (w, what) in enumerate(waits):
        y = 164 + k * 38
        b.append(cell(40, y, 220, 28, "h", label=w))
        b.append(txt(276, y + 19, what, "sub2"))
    body, yb = prose(164 + 3 * 38 + 30, [
        "Tiling, the online softmax and recomputation together are the whole first version. On GPT-2 it "
        "ran attention up to 7.6 times faster than the standard PyTorch implementation, the number this "
        "atlas opened with.",
        "Judged by fraction of peak ({{fig:v03-p03}}) it still sustained only 25 to 40% on an A100. The "
        "memory wall was handled, so the tensor cores were idle for reasons that had nothing to do with "
        f"HBM. Three of them, none about memory, and Part {PART['fa2']} removes each in turn.",
    ])
    figure("o063", st("25 to 40% of peak"), "The first result, and the next problem", yb + 30, b + [body],
           esc("A shape to expect rather than be surprised by: a system has a bottleneck at all times, and "
               "solving the stated one promotes the next."))


def patches():
    patch("o060", [], stamp_to=st("Training runs every computation twice"))


if __name__ == "__main__":
    for job in (o061, o063, patches):
        job()
