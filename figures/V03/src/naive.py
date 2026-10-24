"""V3 Part 4, the naive kernel: §5d merges 06 into 30 and 29 into 31, §5a item 17, review #8, voice fixes.

  o030  three kernels, and every hand-off goes through HBM (merges o006)
  o031  the traffic tally, every bar on one scale (merges o029; link to the animation's naive side)
  p08   541 MB at 3.35 TB/s takes 162 us; the arithmetic needs 17 (9:06)
  patches: o028 (what the tiled kernel pays instead), o033/o032/o007 restamped, o007's voice

  python3 figures/V03/src/naive.py
"""
from common import *  # noqa: F401,F403

n, d = 8192, 64
QKVO = 4 * n * d * 2                 # Q, K, V read and O written, FP16
S_RW = 2 * n * n * 2                 # S written once and read once
P_RW = 2 * n * n * 2
TOTAL = QKVO + S_RW + P_RW
OPS = 4 * n * n * d
assert (round(QKVO / 1e6, 2), round(S_RW / 1e6, 1), round(TOTAL / 1e6, 2)) == (4.19, 268.4, 541.07)
assert round(100 * (S_RW + P_RW) / TOTAL, 1) == 99.2 and round(TOTAL / QKVO) == 129


# ---- o030: three kernels, three hand-offs ---------------------------------------------------------
def o030():
    one = n * n * 2
    b = [hd(40, 46, "Three kernels, and every hand-off between them goes through HBM")]
    b.append(cell(40, 64, 600, 36, "h", label=f"HBM: S and P are parked here, {one / 1e6:.0f} MB each for one head at {n:,} tokens"))
    ks = [("kernel 1", "S = Q Kᵀ, the scores", 40), ("kernel 2", "softmax, row by row", 255), ("kernel 3", "P × V", 470)]
    for name, what, x in ks:
        b.append(box(x, 170, 170, 52, "m", name, what))
    # traffic arrows, each labelled with what crosses
    b.append(arr(100, 166, 100, 104)); b.append(txt(108, 140, "writes S", "sub2"))
    b.append(arr(300, 104, 300, 166)); b.append(txt(308, 124, "reads S", "sub2"))
    b.append(arr(380, 166, 380, 104)); b.append(txt(388, 152, "writes P", "sub2"))
    b.append(arr(530, 104, 530, 166)); b.append(txt(538, 140, "reads P", "sub2"))
    for x in (232.5, 447.5):
        b.append(dashed(x, 170, x, 226, "--muted", "conn"))
    b.append(txt(40, 250, "on chip: lost the moment each kernel ends", "sub2"))
    body, yb = prose(286, [
        "When a kernel finishes, its multiprocessors are handed to the next one and everything in their "
        "registers and shared memory is gone. Only what was written to HBM survives, so each boundary "
        "forces a full round trip through main memory, whether or not the mathematics wanted one "
        "({{fig:v03-o005}}).",
        "Written as three kernels, attention parks two full n × n matrices in HBM: the scores S and the "
        "weights P, each written once and read once. The arithmetic suits the tensor cores perfectly; the "
        "traffic grows as n² while the work done per byte does not.",
    ])
    figure("o030", st("The first pass computes S"), "Why the naive kernel is expensive", yb + 30, b + [body],
           esc("The kernel is not badly written. It is correctly written against a cost model that stopped "
               "being the right one: its cost is set by where the boundaries fall, not by the arithmetic."))


# ---- o031: the tally, on one scale ------------------------------------------------------------------
def o031():
    SC = 400 / TOTAL
    b = [hd(40, 46, f"One head, {n:,} tokens, head dimension {d}, 16-bit: every bar on one scale")]
    rows = [("Q, K, V read, output written", QKVO, "s"), ("S written, then read", S_RW, "h"),
            ("P written, then read", P_RW, "h")]
    x = 230
    for k, (lab, v, cls) in enumerate(rows):
        y = 70 + k * 44
        b.append(txt(40, y + 20, lab, "cap"))
        if v * SC > 80:
            b.append(cell(x, y + 2, v * SC, 28, cls, label=f"{v / 1e6:.1f} MB"))
        else:
            b.append(cell(x, y + 2, max(v * SC, 2), 28, cls))
            b.append(txt(x + max(v * SC, 2) + 8, y + 21, f"{v / 1e6:.1f} MB", "sub2"))
        x += v * SC                                  # the parts laid end to end make up the total
    yt = 70 + 3 * 44 + 8
    b.append(tline(40, yt, 640, yt, "axis"))
    b.append(txt(40, yt + 32, "total", "cap"))
    b.append(cell(230, yt + 14, TOTAL * SC, 28, "h", label=f"{TOTAL / 1e6:.1f} MB"))
    body, yb = prose(yt + 84, [
        f"Laid end to end, the three bars make the total. The useful data, Q, K and V in and the output "
        f"out, is {QKVO / 1e6:.1f} MB. The scratch matrices, each written out in full and read straight "
        f"back, are {(S_RW + P_RW) / 1e6:.1f} MB: {100 * (S_RW + P_RW) / TOTAL:.1f}% of everything that "
        "crosses the bus.",
        f"So the kernel moves {TOTAL / QKVO:.0f} times the bytes its inputs and output need, and every "
        "one of the extra bytes exists only because a kernel boundary sits between the steps.",
    ])
    figure("o031", st("The bottleneck is the traffic"), "The traffic tally", yb + 30, b + [body],
           esc("The shape to remember: the useful data is a sliver, and the bookkeeping is the bar. ")
           + anim_link("The companion animation") + esc(" runs these three kernels step by step on four "
                                                         "tokens, counting every number that crosses the bus."))


# ---- p08: what the tally costs in time --------------------------------------------------------------
def p08():
    t_mem = TOTAL / H100_BW
    t_ops = OPS / H100_PEAK
    t_min = QKVO / H100_BW
    busy = t_ops / t_mem
    assert (round(t_mem * 1e6, 1), round(t_ops * 1e6, 1), round(t_min * 1e6, 2)) == (161.5, 17.4, 1.25)
    assert round(100 * busy, 1) == 10.8
    SC = 400 / t_mem
    b = [hd(40, 46, "Time for one head at the H100's two limits, drawn to scale")]
    groups = [("three kernels", [("moving the bytes", t_mem, "h"), ("doing the arithmetic", t_ops, "m")]),
              ("every byte once", [("moving the bytes", t_min, "s"), ("doing the arithmetic", t_ops, "m")])]
    y = 66
    for g, rows in groups:
        b.append(txt(40, y + 18, g, "hd"))
        for lab, v, cls in rows:
            y += 34
            b.append(txt(60, y + 18, lab, "cap"))
            lab_v = f"{f(v * 1e6, 2 if v < 1e-5 else 1)} µs"
            if v * SC > 100:
                b.append(cell(230, y + 2, v * SC, 24, cls, label=lab_v))
            else:
                b.append(cell(230, y + 2, max(v * SC, 2), 24, cls))
                b.append(txt(230 + max(v * SC, 2) + 8, y + 19, lab_v, "sub2"))
        y += 46
    body, yb = prose(y + 18, [
        f"Moving bytes takes bytes ÷ bandwidth: {TOTAL / 1e6:.0f} MB ÷ 3.35 TB/s = {t_mem * 1e6:.1f}\u00a0µs. "
        f"The arithmetic takes operations ÷ peak: 4·n²·d = {OPS / 1e9:.1f} billion operations ÷ 989 trillion "
        f"a second = {t_ops * 1e6:.1f}\u00a0µs. The two run at the same time, so the longer one sets the pace.",
        f"For the three-kernel version that is the memory: the bus is saturated for {t_mem * 1e6:.0f}\u00a0µs while "
        f"the tensor cores need only {t_ops * 1e6:.0f}, so they work {100 * busy:.1f}% of the time and wait "
        "the rest. Moving every byte just once would take the memory down to "
        f"{t_min * 1e6:.2f}\u00a0µs, and the arithmetic would be the limit instead.",
    ])
    figure("p08", st("the bus saturated"), "541 MB at 3.35 TB/s takes 162 µs; the arithmetic needs 17",
           yb + 30, b + [body],
           esc("A saturated bus and idle tensor cores are one fact seen twice: 10.8% is also the most of peak "
               "the roofline allowed this schedule. To go faster, cut the bytes; nothing else on this chart "
               "is the limit."))


def patches():
    patch("o028", [("The tiled version makes one. That is the whole of the difference.",
                    f"The tiled version makes no pass over S at all; what it pays instead is counted in Part {PART['tiling']}.")],
          stamp_to=st("A naive kernel builds every one"))
    patch("o033", [], stamp_to=st("never write it to HBM"))
    patch("o032", [], stamp_to=st("wall clock time is set"))
    patch("o007", [("Reading it as file access will make the rest of the video confusing.",
                    "Reading it as file access will make the rest of this atlas confusing.")],
          stamp_to=st("IO awareness"))


if __name__ == "__main__":
    for fn in (o030, o031, p08, patches):
        fn()
