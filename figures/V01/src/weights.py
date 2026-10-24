"""V01 Part 6, the weights and what they cost to move: o105 and o107 redrawn, o106 merged with o012 and
o013 (review §2.2 and §5.1 #6), and proposal 20, capacity.

The chip's own fast memory comes from the H100 whitepaper (Table 3): 50 MB of L2 cache, and in each of
132 multiprocessors 256 KB of registers and up to 228 KB of shared memory. V2 Figs 51-52 use the same.

  python3 figures/V01/src/weights.py
"""
import math
from common import (box, cont, cell, ghost, arr, ln, txt, hd, eq, prose, emit, st, f, g, sig,
                    N, W_BYTES, BW, HBM_GB, SMS, L2_BYTES, REG_PER_SM, SHARED_PER_SM)

ON_CHIP = L2_BYTES + SMS * (REG_PER_SM + SHARED_PER_SM)
assert round(ON_CHIP / 1e6, 1) == 113.9 and round(W_BYTES / ON_CHIP) == 1229
T_HBM = W_BYTES / BW * 1000                     # ms to read the weights once
DISK = 7e9                                      # a fast disk, bytes per second, taken as typical
T_DISK = W_BYTES / DISK * 1000
assert round(T_HBM, 1) == 41.8 and T_DISK == 20000 and round(T_DISK / T_HBM) == 479


def o105():
    b = [eq(40, 30, 600, "memory  =  parameter count  ×  bytes per parameter", "m")]
    b.append(txt(40, 112, "70 billion parameters", "cap"))
    b.append(cell(220, 92, 90, 30, "s", rx=4, label="× 2 bytes"))
    b.append(txt(322, 112, "= 140 GB, at 16 bits per parameter", "sub2"))
    body, yb = prose(166, [
        "That is the entire model, sitting in the memory beside the chip. It does not change between requests. "
        "It is the model.",
        "Every forward pass reads all 140 GB out of that memory and moves it across the bus into the arithmetic "
        "units. Every single time.",
        "The next figures ask whether 140 GB fits on one chip, where else the weights could sit, and what the "
        "memory beside the chip physically is.",
    ])
    emit("o105", st("For a 70 billion parameter model"), "140 gigabytes, moved every pass", yb + 26, b + [body],
         "One multiplication turns a parameter count into a byte count, and the byte count is what every token "
         "has to pay to move.")


def p20():
    two = 2 * HBM_GB * 1e9
    assert W_BYTES / (HBM_GB * 1e9) == 1.75 and two - W_BYTES == 20e9
    kimi_bytes = 1e12 * 2
    chips = kimi_bytes / (HBM_GB * 1e9)
    per_chip_ms = W_BYTES / 2 / BW * 1000
    assert chips == 25 and round(per_chip_ms, 1) == 20.9
    b = [hd(40, 46, "The weights against the memory that has to hold them, to scale")]
    SC = 380 / two
    rows = [("the weights", W_BYTES, "h", "140 GB"), ("one H100", HBM_GB * 1e9, "u", "80 GB: 60 GB too small")]
    for k, (lab, v, c, note) in enumerate(rows):
        y = 70 + k * 46
        b.append(txt(40, y + 20, lab, "cap"))
        w = round(v * SC, 1)
        b.append(cell(200, y, w, 30, c, rx=3))
        b.append(txt(200 + w + 10, y + 20, note, "sub2"))
    y = 70 + 2 * 46
    b.append(txt(40, y + 20, "two H100s", "cap"))
    w1 = round(HBM_GB * 1e9 * SC, 1)
    b.append(cell(200, y, w1, 30, "s", rx=3))
    b.append(cell(200 + w1, y, w1, 30, "s", rx=3))
    b.append(txt(200 + 2 * w1 + 10, y + 20, "160 GB: fits", "sub2"))
    y2 = y + 70
    b.append(hd(40, y2, "A trillion parameters at 2 bytes each: 2 TB, in 80 GB chips"))
    for k in range(int(chips)):
        b.append(cell(40 + k * 24, y2 + 16, 20, 26, "u", rx=2))
    b.append(txt(40 + 25 * 24 + 4, y2 + 34, "25", "sub2"))
    body, yb = prose(y2 + 16 + 26 + 40, [
        "Capacity is the first limit on a specification sheet ({{fig:v01-o080}}): whether the model fits at all. "
        "The model this atlas follows needs 140 GB and one H100 holds 80, so it does not fit on one chip; it "
        "needs at least two.",
        f"Split across two, each chip holds 70 GB and reads it once per token: 70 GB ÷ 3.35 TB/s = "
        f"{f(per_chip_ms, 1)} ms, if the two work perfectly side by side. What splitting really costs is the "
        "fifth video's subject ({{fig:v05-o001}}).",
        "A trillion-parameter model like Kimi K2 ({{fig:v01-p03}}) needs 2 TB at two bytes a parameter: 25 H100s "
        "just to hold its weights.",
    ])
    emit("p20", st("2 bytes per weight"), "140 GB does not fit in one H100's 80 GB", yb + 26, b + [body],
         "The rest of this atlas works with one 70-billion-parameter model on one H100, because the "
         "arithmetic per chip is the same. In practice that model needs at least two.")


def o106():
    b = [hd(40, 46, "Reading the 140 GB of weights from each place; time on a log scale")]
    X0, DEC = 260, 76                            # 1 ms at X0, 76 px per factor of ten
    xs = lambda ms: round(X0 + math.log10(ms) * DEC, 1)
    ya = 214
    b.append(ln(X0, ya, xs(1e5), ya, "axis"))
    for k, lab in enumerate(["1 ms", "10 ms", "100 ms", "1 s", "10 s", "100 s"]):
        b.append(ln(xs(10 ** k), ya, xs(10 ** k), ya + 4, "tick"))
        b.append(txt(xs(10 ** k), ya + 18, lab, "sub2", "middle"))
    rows = [("from a fast disk", T_DISK, "h", "about 20 s"), ("from the memory beside the chip", T_HBM, "s",
                                                                  f"{f(T_HBM, 1)} ms")]
    for k, (lab, ms, c, note) in enumerate(rows):
        y = 70 + k * 46
        b.append(txt(40, y + 20, lab, "cap"))
        w = round(xs(ms) - X0, 1)
        b.append(cell(X0, y, w, 30, c, rx=3))
        b.append(txt(X0 + w + 10, y + 20, note, "sub2"))
    y = 70 + 2 * 46
    b.append(txt(40, y + 20, "from the chip's own memory", "cap"))
    b.append(txt(X0, y + 20, f"it does not fit: about {round(ON_CHIP / 1e6)} MB, a thousandth of the model", "sub2"))
    body, yb = prose(ya + 60, [
        "Between runs the model file is kept on a disk. While the service runs, it sits in the memory beside the "
        f"chip. The chip itself holds only about {round(ON_CHIP / 1e6)} MB of fast memory, 1/{g(W_BYTES / ON_CHIP)} "
        "of the model, so the weights cannot live there.",
        f"Reading the weights off a fast disk, taken here as 7 GB a second, takes about 20 seconds: some "
        f"{round(T_DISK / T_HBM, -1):.0f} times as long as from the memory beside the chip. So the model is loaded "
        "once at start-up and then left in place for as long as the service runs, answering millions of tokens.",
        "That is the first example of a pattern that runs through the series: a fixed cost stops mattering once "
        "it is spread over enough work. The rest of the atlas is about a cost that refuses to spread that way, "
        f"the {f(T_HBM, 1)} ms read paid again for every token.",
    ])
    emit("o106", st("The weights live in the chip's main off-chip memory"), "Three places, three speeds", yb + 26,
         b + [body],
         "Disk speeds vary widely, so the top row is approximate; the gap between the tiers is not. The chip's "
         "own memory is a ladder of its own, which the next video climbs ({{ref:v02-o051}}).")


def o107():
    b = [hd(40, 46, "One package, seen from the side (schematic)")]
    base_y = 214
    b.append(cell(60, base_y, 560, 26, "u", rx=3, label="the package: the slab everything is mounted on"))
    # one memory stack: dies on top of one another
    for k in range(6):
        b.append(cell(90, base_y - 22 - k * 22, 150, 18, "h", rx=2, label="memory die" if k == 2 else None))
    b.append(cell(300, base_y - 70, 220, 64, "m", rx=4, label="the GPU die"))
    b.append(txt(165, base_y - 22 * 6 - 12, "one memory stack", "sub2", "middle"))
    b.append(txt(410, base_y - 82, "the processing chip", "sub2", "middle"))
    b.append(txt(270, base_y + 46, "millimetres apart, joined through the package by a very wide bus", "sub2", "middle"))
    body, yb = prose(base_y + 86, [
        "A die is one piece of silicon cut from a larger disc called a wafer. The processing chip is one die. A "
        "memory stack is several memory dies bonded on top of one another, which is the stack in high bandwidth "
        "memory, HBM.",
        "This is what HBM means: not faster memory chips, but memory placed as close as physically possible to "
        "the processing die, on the same package, and joined to it by a very wide bus ({{fig:v01-p09}} counts "
        "the wires).",
        "Wide needs short. The thousands of connections that give it its bandwidth only work over millimetres, "
        "which is why the memory cannot simply be moved further away and made bigger.",
    ])
    emit("o107", st("A stack of silicon memory chips called dies"), "What high bandwidth memory is", yb + 26,
         b + [body],
         "The name describes a placement, not a technology. Close and wide, at the cost of being small and "
         "expensive.")


if __name__ == "__main__":
    for fn in (o105, p20, o106, o107):
        fn()
