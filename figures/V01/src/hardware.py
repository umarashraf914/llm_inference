"""V01 Part 4, the two hardware numbers taken apart: proposals 8, 9 and 10, and o076 and o081 redrawn.

Sources, read 2026-10-24:
  NVIDIA H100 whitepaper (GTC22), Table 3: A100 has 108 SMs at 1410 MHz and 312 dense FP16 tensor
    TFLOPS with 1555 GB/s; H100 SXM5 has 132 SMs, 4 tensor cores per SM (528), a 5120-bit HBM3
    interface in 5 stacks (the full GH100 has 6), 80 billion transistors on 814 mm^2. Its text: the
    H100 tensor core "delivers double the raw dense ... matrix math throughput per SM, clock-for-clock,
    compared to A100".
  NVIDIA H100 datasheet: 1,979 TFLOPS FP16 "with sparsity", half without; 3.35 TB/s.
  Luo et al., "Benchmarking and Dissecting the Nvidia Hopper GPU Architecture" (arXiv 2402.13499),
    Table IV: global-memory latency 478.8 cycles on an H800 PCIe, whose maximum clock is 1755 MHz.

  python3 figures/V01/src/hardware.py
"""
import math
from common import (box, cont, cell, ghost, arr, ln, txt, hd, eq, prose, emit, st, f, g, sig,
                    PEAK, BW, SMS, TC_PER_SM, BUS_BITS, STACKS)

# ---- compute: units x operations per tick x ticks per second ------------------------------------
A100_PEAK, A100_SMS, A100_CLK, A100_BW = 312e12, 108, 1.41e9, 1555e9
FMA_PER_SM_A100 = A100_PEAK / 2 / (A100_SMS * A100_CLK)            # dense 16-bit multiply-adds per tick
assert round(FMA_PER_SM_A100) == 1024
FMA_PER_TC = 2 * 1024 // TC_PER_SM                                  # H100: twice A100 per SM, 4 cores
OPS_PER_TC = 2 * FMA_PER_TC                                         # a multiply-add counts as two
CORES = SMS * TC_PER_SM
CLOCK = PEAK / (CORES * OPS_PER_TC)                                 # what the published numbers imply
assert CORES == 528 and FMA_PER_TC == 512 and OPS_PER_TC == 1024 and round(CLOCK / 1e9, 2) == 1.83
assert abs(CORES * OPS_PER_TC * 1.83e9 / PEAK - 1) < 0.001
TRANSISTORS, DIE_MM2 = 80e9, 814
side_nm = math.sqrt(DIE_MM2 * 1e12 / TRANSISTORS)                   # 1 mm^2 = 10^12 nm^2
assert round(side_nm) == 101
assert abs(SMS / A100_SMS * 2 * CLOCK / A100_CLK - PEAK / A100_PEAK) < 0.01

# ---- bandwidth: stacks x wires x rate per wire -----------------------------------------------------
WIRES_PER_STACK = BUS_BITS // STACKS
RATE_PER_WIRE = BW * 8 / BUS_BITS
assert WIRES_PER_STACK == 1024 and round(RATE_PER_WIRE / 1e9, 2) == 5.23

# ---- latency against bandwidth ------------------------------------------------------------------
LAT_CYCLES, H800_CLK = 478.8, 1.755e9
LAT = LAT_CYCLES / H800_CLK
IN_FLIGHT = BW * LAT
assert round(LAT * 1e9) == 273 and round(IN_FLIGHT / 1e6, 2) == 0.91

# ---- the decade: 80x against 17x -----------------------------------------------------------------
C10, B10 = 80, 17
c1, b1 = C10 ** 0.1, B10 ** 0.1
assert round(c1, 2) == 1.55 and round(b1, 2) == 1.33 and round(c1 / b1, 3) == 1.168
assert round(C10 / B10, 1) == 4.7 and abs((c1 / b1) ** 10 - C10 / B10) < 1e-9


def p08():
    b = [hd(40, 46, "Peak arithmetic is three numbers multiplied")]
    terms = [(f"{CORES} tensor cores", "132 multiprocessors × 4", "u"),
             (f"{g(OPS_PER_TC)} operations a tick", "512 multiply-adds each", "m"),
             (f"{f(CLOCK / 1e9, 2)} billion ticks a second", "the clock, 1.83 GHz", "u")]
    x = 40
    widths = [150, 160, 196]
    for k, ((lab, under, c), w) in enumerate(zip(terms, widths)):
        b.append(cell(x, 70, w, 36, c, rx=5, label=lab))
        b.append(txt(x + w / 2, 124, under, "sub2", "middle"))
        x += w
        if k < 2:
            b.append(txt(x + 6, 93, "×", "hd"))
            x += 22
    assert x <= 640
    b.append(txt(340, 160, "=", "hd"))
    b.append(cell(170, 172, 340, 36, "m", rx=5, label=f"{g(CORES * OPS_PER_TC * CLOCK / 1e12)} trillion operations a second"))
    b.append(txt(340, 226, "the 989 on the specification sheet", "sub2", "middle"))
    yt = 268
    b.append(hd(40, yt, "Where the units come from: transistors"))
    b.append(cell(40, yt + 18, 200, 36, "u", rx=5, label="80 billion transistors"))
    b.append(txt(252, yt + 41, "on", "sub2"))
    b.append(cell(276, yt + 18, 160, 36, "u", rx=5, label="814 mm² of silicon"))
    b.append(txt(40, yt + 76, f"on average, each transistor gets a square of silicon about {round(side_nm, -1):.0f} nanometres on a side", "sub2"))
    body, yb = prose(yt + 76 + 40, [
        "A tensor core is a block of circuitry that does nothing but multiply small grids of numbers. Each of "
        "the H100's 528 completes 512 multiply-adds every tick of the chip's clock, and a multiply-add "
        "counts as two operations ({{fig:v01-o111}}).",
        "A tick is one beat of the clock that paces every circuit on the chip. NVIDIA publishes the core count "
        "and the per-core rate (twice the previous generation's, tick for tick); the 1.83 billion ticks a "
        "second is what the 989 trillion then implies.",
        "Every one of those circuits is built from transistors, microscopic electrical switches. Fitting more "
        "of them into the same area fits more arithmetic units on the chip, which is why compute grows with "
        "transistor density.",
    ])
    emit("p08", st("Compute throughput tracks transistor density"),
         "989 trillion is arithmetic units × operations per tick × ticks per second", yb + 26, b + [body],
         f"From the A100 to the H100, NVIDIA's own tables give {f(SMS / A100_SMS, 2)} times the cores, twice the "
         f"work per core per tick and {f(CLOCK / A100_CLK, 2)} times the clock: {f(PEAK / A100_PEAK, 1)} times in "
         "all. The counts of circuits did most of it, and transistors are what they are made of.")


def p09():
    b = [cont(40, 30, 600, 200, "u", "One H100 package, seen from above")]
    b.append(cell(240, 80, 200, 120, "m", rx=6, label="the GPU die"))
    sites = [(60, 70), (60, 120), (60, 170), (470, 70), (470, 120), (470, 170)]
    for k, (x, y) in enumerate(sites):
        if k == 5:
            b.append(ghost(x, y, 150, 40, rx=4, label="sixth site, unused"))
        else:
            b.append(cell(x, y, 150, 40, "h", rx=4, label=f"stack {k + 1}: 1,024 wires"))
    bits_s = STACKS * WIRES_PER_STACK * RATE_PER_WIRE
    assert round(bits_s / 1e12, 1) == 26.8 and abs(bits_s / 8 - BW) < 1
    y1 = 30 + 200 + 30
    row1 = [("5 stacks", 110), ("1,024 wires each", 150), ("5.23 billion bits a second, per wire", 250)]
    x = 40
    for k, (lab, w) in enumerate(row1):
        b.append(cell(x, y1, w, 34, "u", rx=5, label=lab))
        x += w
        if k < 2:
            b.append(txt(x + 7, y1 + 22, "×", "hd"))
            x += 24
    y2 = y1 + 50
    b.append(txt(40, y2 + 22, "=", "hd"))
    row2 = [("26.8 trillion bits a second", 200, "u"), ("÷", 0, None), ("8 bits a byte", 120, "u"), ("=", 0, None),
            ("3.35 trillion bytes a second", 210, "h")]
    x = 62
    for lab, w, c in row2:
        if c is None:
            b.append(txt(x + 6, y2 + 22, lab, "hd"))
            x += 24
        else:
            b.append(cell(x, y2, w, 34, c, rx=5, label=lab))
            x += w
    assert x <= 640
    body, yb = prose(y2 + 34 + 40, [
        f"The three factors of {{{{fig:v01-o078}}}}, multiplied out. Each stack of memory talks to the chip over "
        f"{g(WIRES_PER_STACK)} data wires, and the H100 has five stacks: {g(BUS_BITS)} wires, the 5120-bit "
        "interface on NVIDIA's specification. The full design has six sites; this product uses five.",
        f"Each wire carries one bit at a time, {f(RATE_PER_WIRE / 1e9, 2)} billion times a second. Multiply, "
        "divide by eight bits to a byte, and the result is the 3.35 TB/s on the specification sheet.",
        "The rate per wire is not published directly; it is what the other numbers imply. Each factor runs "
        "into something physical: more wires need more room on the package, more stacks need more edge "
        "around the die, and a faster rate per wire runs into electrical noise.",
    ])
    emit("p09", st("Memory bandwidth is gated by the product of three things"),
         "3.35 TB/s is 5,120 wires, each carrying 5.2 billion bits a second", yb + 26, b + [body],
         "Drawing schematic, numbers exact. Bandwidth is a count of wires times a rate per wire, and every "
         "term is geometry or physics, which is why it grows so slowly.")


def p10():
    b = [hd(40, 46, "Ten years of steady growth, two years at a time")]
    C = [50, 150, 300, 460]
    for c, h in zip(C, ["years", "compute, ×1.55 a year", "bandwidth, ×1.33 a year", "compute ÷ bandwidth"]):
        b.append(txt(c, 74, h, "sub2"))
    for k, t in enumerate(range(0, 11, 2)):
        y = 98 + k * 26
        cc, bb = C10 ** (t / 10), B10 ** (t / 10)
        b.append(txt(C[0], y, f"{t}  ({2012 + t})", "sub2"))
        b.append(txt(C[1], y, f"× {sig(cc, 3)}", "sub2"))
        b.append(txt(C[2], y, f"× {sig(bb, 3)}", "sub2"))
        b.append(txt(C[3], y, f"× {f(cc / bb, 2)}", "sub2"))
    body, yb = prose(98 + 5 * 26 + 44, [
        f"Exponential growth means the same multiplier every year, not the same addition. Eighty-fold in ten "
        f"years is the tenth root of 80 each year: 80^(1/10) = {f(c1, 2)}, a rise of 55% every year, because "
        f"{f(c1, 2)} multiplied by itself ten times is 80.",
        f"Seventeen-fold is 17^(1/10) = {f(b1, 2)}, 33% a year. The gap between them widens by "
        f"{f(c1, 2)} ÷ {f(b1, 2)} = {f(c1 / b1, 2)} every year, about 17%, which compounds to 80 ÷ 17 = "
        f"{f(C10 / B10, 1)} after ten.",
        "A steady multiplier draws as a straight line on a logarithmic axis, which is how the next figure "
        "draws both.",
    ])
    emit("p10", st("grew by a factor of about 80"), "Eighty-fold in a decade is ×1.55 a year; seventeen-fold is ×1.33",
         yb + 26, b + [body],
         "Two steady percentages are all it takes. The gap between them compounds the same way the "
         "quantities do, so it never stops growing on its own.")


def o081():
    b = [hd(40, 46, "Growth since 2012 on a logarithmic axis, through the quoted endpoints")]
    L, R, T, B = 100, 520, 76, 316
    xs = lambda yr: round(L + (yr - 2012) / 10 * (R - L), 1)
    ys = lambda v: round(B - math.log10(v) / 2 * (B - T), 1)          # ×1 at the bottom, ×100 at the top
    b.append(ln(L, B, R, B, "axis"))
    b.append(ln(L, T, L, B, "axis"))
    for v in (1, 2, 5, 10, 20, 50, 100):
        b.append(ln(L - 4, ys(v), L, ys(v), "tick"))
        b.append(txt(L - 8, ys(v) + 4, f"×{v}", "sub2", "end"))
    for yr in (2012, 2014, 2016, 2018, 2020, 2022):
        b.append(ln(xs(yr), B, xs(yr), B + 4, "tick"))
        b.append(txt(xs(yr), B + 18, str(yr), "sub2", "middle"))
    pts = lambda m: " ".join(f"{xs(2012 + t)},{ys(m ** (t / 10))}" for t in range(11))
    b.append(f'<polyline class="pl-m" points="{pts(C10)}"/>')
    b.append(f'<polyline class="pl-h" points="{pts(B10)}"/>')
    b.append(txt(R + 10, ys(C10) + 4, "compute, ×80", "sub2"))
    b.append(txt(R + 10, ys(B10) + 4, "bandwidth, ×17", "sub2"))
    xg = R + 6
    b.append(ln(xg, ys(C10) + 10, xg, ys(B10) - 10, "tick"))
    b.append(txt(xg + 8, (ys(C10) + ys(B10)) / 2 + 4, f"gap ×{f(C10 / B10, 1)}", "sub2"))
    body, yb = prose(B + 54, [
        "On a logarithmic axis a steady yearly multiplier is a straight line, and a steeper line is a bigger "
        "multiplier. The vertical distance between the two lines is the ratio between them, so the "
        "widening wedge is the gap compounding.",
        "The endpoints are the round factors quoted for top-tier server GPUs from 2012 to 2022; the straight "
        "lines assume steady growth between them, so the middle is schematic. One generation can be checked "
        f"in NVIDIA's own tables: from the A100 (2020) to the H100 (2022), 16-bit compute rose "
        f"{f(PEAK / A100_PEAK, 1)}× and bandwidth {f(BW / A100_BW, 1)}×.",
    ])
    emit("o081", st("A 4.7x divergence"), "The divergence, measured", yb + 26, b + [body],
         "The curves are still spreading. Each generation buys more arithmetic than bandwidth, so each one "
         "makes the memory wall a little higher.")


def o076():
    b = [hd(40, 46, "Two pipes with the same bandwidth and different latency (illustrative)")]
    L, R, T, B = 90, 560, 80, 270
    tmax, ymax = 1000, 3.5                       # ns, MB
    xs = lambda t: round(L + t / tmax * (R - L), 1)
    ys = lambda mb: round(B - mb / ymax * (B - T), 1)
    b.append(ln(L, B, R, B, "axis"))
    b.append(ln(L, T, L, B, "axis"))
    for t in range(0, 1001, 250):
        b.append(ln(xs(t), B, xs(t), B + 4, "tick"))
        b.append(txt(xs(t), B + 18, f"{t} ns", "sub2", "middle"))
    for mb in (0, 1, 2, 3):
        b.append(ln(L - 4, ys(mb), L, ys(mb), "tick"))
        b.append(txt(L - 8, ys(mb) + 4, f"{mb} MB", "sub2", "end"))
    rate = BW * 1e-9 / 1e6                       # MB per ns
    for lat, cls, lab in ((100, "pl-m", "near: first byte at 100 ns"), (400, "pl-h", "far: first byte at 400 ns")):
        end = (tmax - lat) * rate
        b.append(f'<polyline class="{cls}" points="{xs(0)},{ys(0)} {xs(lat)},{ys(0)} {xs(tmax)},{ys(end)}"/>')
        b.append(txt(xs(tmax) + 8, ys(end) + 4, lab.split(":")[0], "sub2"))
    b.append(txt(xs(100) + 8, ys(0) - 8, "100 ns", "sub2 halo"))
    b.append(txt(xs(400) + 8, ys(0) - 8, "400 ns", "sub2 halo"))
    b.append(txt(L + 4, T - 8, "bytes arrived", "sub2"))
    b.append(txt(R, B + 38, "time since the first request", "sub2", "end"))
    body, yb = prose(B + 76, [
        "Latency is the wait from asking for data to the first of it arriving: where each line leaves the "
        "axis. Bandwidth is how many bytes arrive each second once data is flowing: how steeply the line "
        "climbs. Both lines climb at 3.35 TB/s; one starts 300 ns later, and neither number tells you the "
        "other.",
        f"Measured on a Hopper-class GPU, one read from its memory takes about {round(LAT_CYCLES, -1):.0f} clock "
        f"ticks, about {round(LAT * 1e9, -1):.0f} ns. To keep 3.35 TB/s arriving, everything due in the next {round(LAT * 1e9)} "
        f"ns must already have been asked for: 3.35 TB/s × {round(LAT * 1e9)} ns = {f(IN_FLIGHT / 1e6, 2)} MB in "
        "flight at every moment.",
        "The memory cannot be made low-latency; distance and the physics of a memory cell are what they are. "
        "What a chip can do is keep enough requests in flight that the pipe never runs dry, the subject of "
        "the next video ({{fig:v02-o055}}).",
    ])
    emit("o076", "4:02", "Latency and bandwidth are different things", yb + 26, b + [body],
         "The two pipes are illustrative; the 270 ns was measured by Luo and colleagues in 2024 on the H800, a "
         "close relative of the H100. A slow first byte and a slow stream are different problems with "
         "different cures.")


if __name__ == "__main__":
    for fn in (o076, p08, p09, p10, o081):
        fn()
