"""V2 Part 1, the opening: review proposals 1 and 2, the merges 05+09 and 07+08, Fig 10 on one log
scale, Fig 11's part references, and Fig 19 moved to 0:58 and redrawn on a log scale.

  python3 figures/V02/src/opening.py     writes items o005 o007 o010 o011 o019 p01 p02
"""
import math
from common import *  # noqa: F401,F403

# ---- numbers --------------------------------------------------------------------------------------
MODEL_B = 140e9                       # 70B weights at 2 bytes (V1 Fig 73, 105)
OPS = 2 * 70e9                        # 2 operations per weight per token (V1 Fig 111)
t_mem = MODEL_B / HBM_BW              # seconds to read the weights once
t_ops = OPS / PEAK_BF16               # seconds of arithmetic
ratio = t_mem / t_ops
ridge = PEAK_BF16 / HBM_BW
intensity = OPS / MODEL_B
assert round(t_mem * 1e3, 1) == 41.8 and round(t_ops * 1e3, 3) == 0.141
assert abs(ratio - ridge / intensity) < 1e-9 and round(ratio) == 295 and intensity == 1
assert t_ops / t_mem < 0.01                                  # "less than 1% of the time goes to math"

per_wire = HBM_DDR_MHZ * 1e6 * 2                             # two transfers per clock
bits_per_stack = HBM_BITS // HBM_STACKS
bw_calc = HBM_BITS * per_wire / 8
assert bits_per_stack == 1024 and abs(bw_calc - HBM_BW) / HBM_BW < 1e-3
GD_BITS, GD_MHZ, GD_BW = 384, 10501, 1008e9                  # RTX 4090 GDDR6X (Luo et al. Table III)
gd_wire = GD_MHZ * 1e6 * 2
assert abs(GD_BITS * gd_wire / 8 - GD_BW) / GD_BW < 1e-3

TICK = 1 / CLK_TC                                            # seconds per tick at 1.83 GHz
hbm_ns = LAT["hbm"] / H800_CLK * 1e9                         # measured load, in ns
assert round(TICK * 1e9, 2) == 0.55 and 270 < hbm_ns < 275


# ---- o005: two distinctions from V1, merged with o009 ---------------------------------------------
def o005():
    b = [hd(40, 46, "A count against a rate")]
    b.append(box(40, 66, 270, 62, "m", "FLOP", "one operation: a count"))
    b.append(box(370, 66, 270, 62, "u", "FLOP/s", "operations per second: a rate"))
    b.append(eq(40, 148, 600, f"140 billion operations  ÷  989.4 trillion per second  =  {f(t_ops * 1e3, 2)} ms"))
    b.append(hd(40, 236, "A wait against a width"))
    b.append(txt(40, 274, "latency", "cap"))
    b.append(cell(150, 258, 44, 26, "u", label="ask"))
    b.append(ghost(200, 258, 330, 26, label="wait for the one answer"))
    b.append(cell(536, 258, 64, 26, "s", label="arrive"))
    b.append(txt(40, 318, "bandwidth", "cap"))
    for k in range(5):
        b.append(cell(150, 304 + k * 14, 450, 9, "s", rx=2))
    b.append(txt(150, 388, "many requests travelling at once, each with its own wait", "sub2"))
    body, yb = prose(430, [
        "A FLOP is one operation, a count with no time in it. FLOP/s is a rate. Dividing the count by "
        "the rate gives seconds, and if the units do not cancel that way, the two have been swapped "
        "({{fig:v01-o063}}).",
        "Latency is how long one request takes to come back. Bandwidth is how many bytes arrive per "
        "second when many requests are travelling at once. They are independent: a wide, slow pipe has "
        "high bandwidth and high latency ({{fig:v01-o076}}).",
    ])
    emit("o005", stamp(SRT, "How fast it does arithmetic"),
         "A count is not a rate, and a wait is not a width", yb + 24, b + [body],
         "Two pairs of words that sound alike and measure different things. Nearly every confusing "
         "performance claim swaps one of them, so the rest of this atlas keeps them apart.")


# ---- o007: a bus, and bandwidth as wires times bits per wire (merged with o008) -------------------
def o007():
    b = [hd(40, 46, "A bus is the set of wires between memory and the chip")]
    b.append(box(40, 66, 150, 70, "h", "memory"))
    for k in range(7):
        y = 74 + k * 9
        b.append(ln(190, y, 488, y, "tick"))
    b.append(box(490, 66, 150, 70, "m", "the chip"))
    b.append(txt(196, 158, "every wire carries one bit at a time, all of them at once", "sub2"))
    b.append(eq(40, 180, 600, "bandwidth  =  wires  ×  bits per second on each wire  ÷  8 bits per byte"))
    b.append(hd(40, 270, "Two real buses, drawn to scale"))
    SC = 560 / HBM_BITS                                  # px per wire
    b.append(txt(40, 306, "RTX 4090", "cap"))
    b.append(rect(150, 292, GD_BITS * SC, 22, "h"))
    b.append(txt(150 + GD_BITS * SC + 10, 307, f"{GD_BITS} wires at {f(gd_wire / 1e9, 1)} Gb/s each", "sub2"))
    b.append(txt(40, 346, "H100", "cap"))
    b.append(rect(150, 332, HBM_BITS * SC, 22, "s"))
    b.append(txt(150, 372, f"{n(HBM_BITS)} wires at {f(per_wire / 1e9, 2)} Gb/s each", "sub2"))
    body, yb = prose(412, [
        f"The gaming card's memory runs each wire four times as fast, {f(gd_wire / 1e9, 1)} billion bits a "
        f"second against {f(per_wire / 1e9, 2)} billion. The H100 still moves {f(HBM_BW / GD_BW, 1)} times "
        f"as many bytes per second, because it has {f(HBM_BITS / GD_BITS, 1)} times as many wires.",
        "Widening is the main way memory gets faster, and it explains where memory sits: thousands of "
        "wires only work over millimetres, so a wide memory has to be packed beside the chip "
        "({{fig:v01-o074}}, {{fig:v01-o107}}).",
        "Every weight the model uses travels along these wires before any arithmetic can touch it.",
    ])
    assert 3 < HBM_BW / GD_BW < 3.5 and 13 < HBM_BITS / GD_BITS < 14 and 4 < gd_wire / per_wire < 4.1
    emit("o007", stamp(SRT, "how fast it moves bytes"), "Bandwidth is wires times how fast each one runs",
         yb + 24, b + [body],
         "Bars are wire counts, to scale. The slow-wire chip wins on bandwidth by going wide, which is "
         "the whole design of high-bandwidth memory. Rates: NVIDIA's H100 whitepaper; Luo et al. 2024 "
         "for the RTX 4090.")


# ---- p02: the H100's 3.35 TB/s, built from its stacks --------------------------------------------
def p02():
    b = [hd(40, 46, "The package from above: the GPU die and its five memory stacks")]
    b.append(box(230, 80, 220, 150, "m", "GPU die", "814 mm²"))
    sites = [(110, 80), (110, 162), (470, 80), (470, 162), (470, 244), (110, 244)]
    for k, (x, y) in enumerate(sites):
        if k < HBM_STACKS:
            b.append(box(x, y, 100, 66, "h", "HBM3 stack", f"{bits_per_stack:,} wires"))
        else:
            b.append(ghost(x, y, 100, 66, label="unused site"))
    rows = [
        (f"{HBM_STACKS} stacks  ×  {bits_per_stack:,} wires", f"{n(HBM_BITS)} wires"),
        (f"×  {HBM_DDR_MHZ:,} million clocks a second  ×  2 transfers per clock", f"{f(per_wire / 1e9, 3)} billion bits a second on each wire"),
        (f"{n(HBM_BITS)}  ×  {f(per_wire / 1e9, 3)} billion", f"{f(HBM_BITS * per_wire / 1e12, 1)} trillion bits a second"),
        ("÷  8 bits per byte", f"{f(bw_calc / 1e9, 0)} GB/s, the 3.35 TB/s on the specification"),
    ]
    y = 340
    for k, (lhs, rhs) in enumerate(rows):
        b.append(cell(40, y, 330, 34, "u", rx=6, label=lhs))
        b.append(txt(386, y + 22, "=  " + rhs, "sub2"))
        y += 46
    body, yb = prose(y + 26, [
        "Each stack is a pile of DRAM chips joined to the package by 1,024 data wires. The full Hopper "
        "die has room for six stacks; the H100 sold in this form enables five, which is where its 80 GB "
        "and its 5,120-bit memory interface come from.",
        "Each wire is driven at 2,619 million clocks a second and carries a bit on both the rising and "
        "the falling edge of the clock, so 5.24 billion bits a second. Nothing about the memory is "
        "exotic per wire. The bandwidth comes from the count.",
    ])
    emit("p02", stamp(SRT, "how fast it moves bytes"),
         "3.35 TB/s is 5,120 wires, each carrying 5.24 billion bits a second", yb + 24, b + [body],
         "Schematic layout; the numbers are NVIDIA's (H100 whitepaper, final specifications). The same "
         "equation returns for the H200 and for the links between chips, and it is the reason bandwidth "
         "grows so slowly: more wires need more edge.")


# ---- o010: the units of time, on one log scale ----------------------------------------------------
def o010():
    b = [hd(40, 46, "Three durations on one logarithmic axis, from 0.1 ns to 100 ms")]
    X0, X1, V0, V1 = 150, 630, 1e-10, 1e-1
    ax = 250
    b.append(ln(X0, ax, X1, ax, "axis"))
    labels = {1e-10: "0.1 ns", 1e-9: "1 ns", 1e-8: "10 ns", 1e-7: "100 ns", 1e-6: "1 µs", 1e-5: "10 µs",
              1e-4: "100 µs", 1e-3: "1 ms", 1e-2: "10 ms", 1e-1: "100 ms"}
    for v, s in labels.items():
        x = logx(v, V0, V1, X0, X1)
        b.append(vline(x, ax, ax + 5))
        b.append(txt(round(x, 1), ax + 20, s, "sub2", "middle"))
    rows = [("one tick", TICK, "s", f"{f(TICK * 1e9, 2)} ns at 1.83 GHz"),
            ("a load from HBM", hbm_ns * 1e-9, "h", f"about {round(hbm_ns, -1):.0f} ns, or 479 ticks"),
            ("one token", 30e-3, "u", "about 30 ms")]
    for k, (lab, v, c, note) in enumerate(rows):
        y = 74 + k * 52
        w = logx(v, V0, V1, X0, X1) - X0
        b.append(txt(40, y + 17, lab, "cap"))
        b.append(rect(X0, y, w, 24, c))
        b.append(txt(X0 + w + 10, y + 17, note, "sub2"))
    r1, r2 = hbm_ns * 1e-9 / TICK, 30e-3 / (hbm_ns * 1e-9)
    body, yb = prose(318, [
        f"Each equal step along the axis is ten times longer. A load from HBM lasts about {round(r1, -1):.0f} "
        f"ticks, and one token lasts about {round(r2, -4):,.0f} loads, so the three are not a thousand apart "
        "each but about 500 and about 100,000.",
        "A tick is the chip's clock: the H100's tensor cores are rated at 1.83 billion ticks a second, "
        "so one tick is 0.55 ns. The load time was measured on a Hopper GPU, 479 ticks at its 1.755 GHz "
        "clock. Almost every timing argument below compares the first two rows.",
    ])
    assert 450 < r1 < 550 and 90_000 < r2 < 120_000
    emit("o010", stamp(SRT, "in bytes per second"), "The units of time at this scale", yb + 24, b + [body],
         "Bar lengths are logarithmic. A nanosecond against a millisecond is the same ratio as a second "
         "against eleven days. Load latency: Luo et al. 2024, measured on an H800; clock: NVIDIA's H100 "
         "whitepaper.")


# ---- p01: the factor of almost 300, two ways ------------------------------------------------------
def p01():
    b = [hd(40, 46, "One decode step of a 70B model on an H100, in time (log axis)")]
    X0, X1 = 170, 600
    V0, V1 = 1e-5, 1e-1                                       # 10 µs .. 100 ms
    ax = 152
    b.append(ln(X0, ax, X1, ax, "axis"))
    for v, s in {1e-5: "10 µs", 1e-4: "0.1 ms", 1e-3: "1 ms", 1e-2: "10 ms", 1e-1: "100 ms"}.items():
        x = logx(v, V0, V1, X0, X1)
        b.append(vline(x, ax, ax + 5))
        b.append(txt(round(x, 1), ax + 20, s, "sub2", "middle"))
    for k, (lab, v, c, note) in enumerate([
            ("arithmetic", t_ops, "m", f"{f(t_ops * 1e3, 3)} ms"),
            ("reading weights", t_mem, "h", f"{f(t_mem * 1e3, 1)} ms")]):
        y = 66 + k * 40
        w = logx(v, V0, V1, X0, X1) - X0
        b.append(txt(40, y + 17, lab, "cap"))
        b.append(rect(X0, y, w, 24, c))
        b.append(txt(X0 + w + 10, y + 17, note, "sub2"))
    b.append(hd(40, 222, "The same step, as operations per byte (log axis)"))
    ax2 = 316
    W0, W1 = 0.5, 1000
    b.append(ln(X0, ax2, X1, ax2, "axis"))
    for v in (1, 10, 100, 1000):
        x = logx(v, W0, W1, X0, X1)
        b.append(vline(x, ax2, ax2 + 5))
        b.append(txt(round(x, 1), ax2 + 20, f"{v:,}", "sub2", "middle"))
    for k, (lab, v, c, note) in enumerate([
            ("decode delivers", intensity, "h", "1 operation per byte"),
            ("the chip needs", ridge, "m", f"{ridge:.0f} per byte to keep busy")]):
        y = 236 + k * 40
        w = logx(v, W0, W1, X0, X1) - X0
        b.append(txt(40, y + 17, lab, "cap"))
        b.append(rect(X0, y, w, 24, c))
        b.append(txt(X0 + w + 10, y + 17, note, "sub2"))
    b.append(eq(40, 360, 600, f"{f(t_mem * 1e3, 1)} ms  ÷  {f(t_ops * 1e3, 3)} ms  =  {ratio:.0f}  =  "
                              f"(989.4 T ÷ 3.352 T)  ÷  1"))
    body, yb = prose(440, [
        f"Reading 140 GB of weights at 3,352 GB/s takes {f(t_mem * 1e3, 1)} ms ({{{{fig:v01-o014}}}}). The "
        f"arithmetic, 140 billion operations at 989.4 trillion a second, takes {f(t_ops * 1e3, 3)} ms. The "
        f"maths is busy {100 * t_ops / t_mem:.2f}% of the time.",
        f"Counted the second way, decode does one operation for each byte it reads ({{{{fig:v01-o116}}}}), "
        f"while the chip can do {ridge:.0f} operations in the time one byte arrives: the ridge "
        "({{fig:v01-o126}}). The two ratios are the same number, because 140 billion operations over "
        "140 billion bytes is exactly one.",
    ])
    emit("p01", stamp(SRT, "memory bound by a factor of almost 300"), "Almost three hundred, counted two ways",
         yb + 24, b + [body],
         "Time spent and work per byte tell one story: on a single request the chip waits 295 times "
         "longer than it computes. The rest of this atlas is about the machine that makes that so.")


# ---- o011: the three questions, with the new part numbers -----------------------------------------
def o011():
    b = [box(40, 50, 190, 88, "u", "Why so different", "from a laptop CPU?"),
         box(245, 50, 190, 88, "u", "Why is a byte", "so expensive", "next to an operation?"),
         box(450, 50, 190, 88, "u", "What can the", "hardware do", "to fight back?")]
    body, yb = prose(178, [
        "Parts 2 to 5 answer the first: one bet about the workload, and the multiprocessor built around "
        "it. Parts 6 and 7 answer the second, from the memory cell up to the four-rung ladder.",
        "Parts 8 to 15 answer the third: latency hiding, coalescing, tensor cores, lower precision and "
        "more chips.",
    ])
    emit("o011", stamp(SRT, "three questions"), "The three questions", yb + 24, b + [body],
         "The structure of everything below. Holding these three in mind makes the ordering feel "
         "inevitable rather than arbitrary.")


# ---- o019: energy, on a log scale, moved to 0:58 --------------------------------------------------
def o019():
    b = [hd(40, 46, "Energy per operation at 45 nm, relative to one 32-bit float add (log axis)")]
    X0, X1 = 250, 600
    rel = {k: v / PJ["fadd"] for k, v in PJ.items()}
    assert round(rel["fmul"], 1) == 4.1 and round(rel["sram"], 1) == 5.6 and round(rel["dram"]) == 711
    ax = 290
    b.append(ln(X0, ax, X1, ax, "axis"))
    for v in (1, 10, 100, 1000):
        x = logx(v, 1, 1000, X0, X1)
        b.append(vline(x, ax, ax + 5))
        b.append(txt(round(x, 1), ax + 20, f"{v:,}×", "sub2", "middle"))
    rows = [("32-bit float add", "fadd", "m"), ("32-bit float multiply", "fmul", "m"),
            ("32-bit read, SRAM cache", "sram", "s"), ("32-bit read, DRAM", "dram", "h")]
    for k, (lab, key, c) in enumerate(rows):
        y = 70 + k * 52
        w = max(logx(rel[key], 1, 1000, X0, X1) - X0, 3)
        b.append(txt(40, y + 20, lab, "cap"))
        b.append(rect(X0, y, w, 30, c))
        b.append(txt(X0 + w + 10, y + 20, f"{f(rel[key], 1) if rel[key] < 10 else n(rel[key])}×  ({PJ[key]:g} pJ)", "sub2"))
    body, yb = prose(352, [
        f"Fetching one 32-bit number from DRAM took {PJ['dram']:g} picojoules, {n(rel['dram'])} times the "
        f"energy of adding two such numbers once they have arrived. A read from a small on-chip SRAM cache "
        f"cost {PJ['sram']:g} pJ, close to the arithmetic.",
        "So the hierarchy is not only about time. On a chip limited by power, moving data is the "
        "expensive act and computing is nearly free.",
    ])
    emit("o019", stamp(SRT, "Why does moving a byte"), "Fetching a number from DRAM costs 700 times the energy of adding it",
         yb + 24, b + [body],
         "Figures from Han et al. 2015, after Horowitz, for a 45 nm process; the add bar is one unit "
         "wide by definition. Absolute energies have shrunk since. The ordering has not, and it shapes "
         "every accelerator.")


if __name__ == "__main__":
    for fn in (o005, o007, p02, o010, p01, o011, o019):
        fn()
