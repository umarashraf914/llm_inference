"""V2 Part 7, the memory ladder: Fig 51 rebuilt (capacity by rung, one scope), review proposals 15
and 16, Fig 52's label and caption, and Fig 54 redrawn on log axes.

  python3 figures/V02/src/ladder.py     writes o051 p15 p16 o054; edits o052
"""
import math
from common import *  # noqa: F401,F403

KIB, MIB, GIB = 1024, 1024 ** 2, 1024 ** 3
CAP = {"registers": RF_KB_GPU * KIB,                  # 33,792 KB across the chip (WP104)
       "L1 and shared": SMS * 256 * KIB,              # 256 KB per SM
       "L2": L2_MB * MIB,
       "HBM": HBM_GB * GIB}
MODEL = 140e9                                          # 70B weights at 2 bytes, counted in plain bytes
FAST = CAP["registers"] + CAP["L1 and shared"] + CAP["L2"]
assert CAP["registers"] == CAP["L1 and shared"] == 34_603_008
assert round(FAST / 1e6, 1) == 121.6 and FAST / MODEL < 1e-3

# per-SM bytes per tick, at the 1.98 GHz clock NVIDIA quotes for non-tensor work
BW_TICK = {"registers": FP32_PER_SM * 3 * 4,           # one FFMA per lane reads three 4-byte registers
           "shared": 32 * 4,                          # 32 banks, 4 bytes each per clock (PG)
           "L2": 4472.3 / 114,                        # LUO Table V, H800, FP32 loads, 114 SMs
           "HBM": HBM_BW / SMS / CLK_FP32}
LAT_TICK = {"registers": 1, "shared": LAT["shared"], "L1": LAT["l1"], "L2": LAT["l2"], "HBM": LAT["hbm"]}
bw_ratio = BW_TICK["registers"] / BW_TICK["HBM"]
lat_ratio = LAT_TICK["HBM"] / LAT_TICK["registers"]
assert BW_TICK["registers"] == 1536 and BW_TICK["shared"] == 128 and round(BW_TICK["HBM"], 1) == 12.8
assert 110 < bw_ratio < 130 and 470 < lat_ratio < 490


def o051():
    b = [hd(40, 46, "Capacity of each rung, summed over the whole chip (log axis)")]
    X0, X1, V0, V1 = 200, 560, 1e6, 1e12
    rows = [("registers", "256 KB in each SM", "s"), ("L1 and shared", "256 KB in each SM", "s"),
            ("L2", "one, for all 132 SMs", "u"), ("HBM", "beside the die", "h")]
    for k, (key, note, c) in enumerate(rows):
        y = 64 + k * 52
        v = CAP[key]
        w = logx(v, V0, V1, X0, X1) - X0
        b.append(txt(40, y + 16, key, "cap"))
        b.append(txt(40, y + 34, note, "sub2"))
        b.append(rect(X0, y, w, 30, c))
        label = f"{v / 1e6:.1f} MB" if v < 1e9 else f"{HBM_GB} GB"
        b.append(txt(X0 + w + 10, y + 20, label, "sub2"))
    ax = 64 + 4 * 52 + 6
    b.append(ln(X0, ax, X1, ax, "axis"))
    for v, s_ in [(1e6, "1 MB"), (1e9, "1 GB"), (1e12, "1 TB")]:
        x = logx(v, V0, V1, X0, X1)
        b.append(vline(x, ax, ax + 5))
        b.append(txt(round(x, 1), ax + 20, s_, "sub2", "middle"))
    ratio = CAP["HBM"] / CAP["registers"]
    assert 2400 < ratio < 2550
    body, yb = prose(ax + 56, [
        f"Four rungs. Counted across the whole chip, the registers hold {CAP['registers'] / 1e6:.1f} million "
        f"bytes and HBM holds {HBM_GB} GB, about {round(ratio, -2):,.0f} times as much. Each step down is "
        "bigger, further from the arithmetic and slower.",
        "The registers and the 256 KB of L1 and shared memory are inside each multiprocessor; the L2 is "
        "shared by all 132; HBM is the separate memory stacked beside the die. Latency and bandwidth for "
        "each rung follow below.",
    ])
    emit("o051", stamp(SRT, "ladder of four levels"), "The four rungs", yb + 24, b + [body],
         "Bar length is capacity on a log scale, for the whole chip. That capacity grows as speed falls is "
         "the whole point of a ladder, and it traces back to the SRAM and DRAM cells of Part 6.")


def p16():
    W, H = 600, 300
    small = math.sqrt(W * H * FAST / MODEL)            # equal ratio of areas
    l2_frac = MODEL / CAP["L2"]
    assert 12 < small < 13 and 2600 < l2_frac < 2700
    b = [hd(40, 46, "Areas to scale: a 70B model's weights, and all the fast memory on the chip")]
    b.append(f'<g class="h"><rect x="40" y="62" width="{W}" height="{H}" rx="4"/>'
             f'<text class="sub" x="56" y="86">140 GB of weights</text>'
             f'<text class="sub" x="{86 + small:.1f}" y="{132 + small / 2 + 4:.1f}">{FAST / 1e6:.1f} MB: every register, '
             f'L1, shared memory and L2</text></g>')
    b.append(rect(70, 132, small, small, "s", rx=1))
    body, yb = prose(400, [
        "Memory sizes count in powers of two: a kilobyte of memory is 1,024 bytes and a megabyte "
        f"1,048,576. So the chip's registers are 33,792 KB = {CAP['registers']:,} bytes, the L1 and shared "
        f"memory the same again, and the 50 MB L2 is {CAP['L2']:,} bytes: {FAST / 1e6:.1f} million bytes "
        f"in all, {100 * FAST / MODEL:.3f}% of the 140 billion bytes of a 70B model.",
        f"The L2 alone holds one part in {round(l2_frac, -1):,.0f} of the weights. Generating a token reads every "
        "weight exactly once, so by the time a weight could be reused, thousands of others have passed "
        "through: during decode the caches have almost nothing worth keeping.",
    ])
    emit("p16", stamp(SRT, "shared across all 132 SMs"),
         "All the fast memory on the chip holds less than a thousandth of the model", yb + 24, b + [body],
         "Drawn as areas, so the small square's side is the square root of the ratio. This is why every "
         "token's weights must come up from HBM: there is nowhere closer to keep them.")


def p15():
    b = [hd(40, 46, "Time to answer one load, in ticks (log axis)")]
    X0, X1 = 190, 590
    rows = [("registers", "registers", "s", "about 1, the single cycle"), ("shared memory", "shared", "s", None),
            ("L1 cache", "L1", "s", None), ("L2 cache", "L2", "u", None), ("HBM", "HBM", "h", None)]
    for k, (lab, key, c, note) in enumerate(rows):
        y = 62 + k * 30
        v = LAT_TICK[key]
        w = max(logx(v, 0.5, 1000, X0, X1) - X0, 3)
        b.append(txt(40, y + 16, lab, "cap"))
        b.append(rect(X0, y, w, 22, c))
        b.append(txt(X0 + w + 8, y + 16, note or f"{v:g}", "sub2"))
    ax1 = 62 + 5 * 30 + 2
    b.append(ln(X0, ax1, X1, ax1, "axis"))
    for v in (1, 10, 100, 1000):
        x = logx(v, 0.5, 1000, X0, X1)
        b.append(vline(x, ax1, ax1 + 5))
        b.append(txt(round(x, 1), ax1 + 19, f"{v:,}", "sub2", "middle"))
    y2 = ax1 + 58
    b.append(hd(40, y2, "Bytes each multiprocessor can take in per tick (log axis)"))
    rows2 = [("registers", "registers", "s", f"{BW_TICK['registers']:,}, one FFMA per lane"),
             ("shared memory", "shared", "s", f"{BW_TICK['shared']}, 32 banks × 4 bytes"),
             ("L2 cache", "L2", "u", f"about {BW_TICK['L2']:.0f}, measured"),
             ("HBM", "HBM", "h", f"{BW_TICK['HBM']:.1f}, its 3.35 TB/s shared by 132")]
    for k, (lab, key, c, note) in enumerate(rows2):
        y = y2 + 16 + k * 30
        v = BW_TICK[key]
        w = logx(v, 1, 10000, X0, X1) - X0
        b.append(txt(40, y + 16, lab, "cap"))
        b.append(rect(X0, y, w, 22, c))
        b.append(txt(X0 + w + 8, y + 16, note, "sub2"))
    ax2 = y2 + 16 + 4 * 30 + 2
    b.append(ln(X0, ax2, X1, ax2, "axis"))
    for v in (1, 10, 100, 1000, 10000):
        x = logx(v, 1, 10000, X0, X1)
        b.append(vline(x, ax2, ax2 + 5))
        b.append(txt(round(x, 1), ax2 + 19, f"{v:,}", "sub2", "middle"))
    body, yb = prose(ax2 + 56, [
        f"Latencies were measured on a Hopper GPU, the H800, with the chip otherwise idle: {LAT['shared']:g} "
        f"ticks for shared memory, {LAT['l1']:g} for L1, {LAT['l2']:g} for L2 and {LAT['hbm']:g} for HBM.",
        f"Bandwidth falls the other way. An FFMA on every lane reads three 4-byte registers, "
        f"{BW_TICK['registers']:,} bytes a tick per multiprocessor; shared memory delivers {BW_TICK['shared']}; "
        f"HBM's 3,352 GB/s, divided among 132 multiprocessors at 1.98 billion ticks a second, is "
        f"{BW_TICK['HBM']:.1f}.",
    ])
    emit("p15", stamp(SRT, "hundreds of cycles to come back"), "Every rung, with its numbers", yb + 24,
         b + [body],
         "Latency: Luo et al. 2024, measured on an H800; the L2 rate is theirs too, per multiprocessor of the "
         "H800. Bank count: NVIDIA's CUDA programming guide. Each rung down is slower to answer and narrower.")


def o054():
    b = [hd(40, 46, "How much worse the bottom rung is than the top, on one log axis")]
    X0, X1 = 230, 600
    rows = [("bandwidth, round figure", 100, "u"), ("bandwidth, worked out", bw_ratio, "h"),
            ("latency, round figure", 1000, "u"), ("latency, measured idle", lat_ratio, "h")]
    for k, (lab, v, c) in enumerate(rows):
        y = 64 + k * 40 + (12 if k >= 2 else 0)
        w = logx(v, 1, 1000, X0, X1) - X0
        b.append(txt(40, y + 18, lab, "cap"))
        note = f"{v:,.0f}×"
        b.append(cell(X0, y, w, 26, c, label=note))
    ax = 64 + 4 * 40 + 12 + 4
    b.append(ln(X0, ax, X1, ax, "axis"))
    for v in (1, 10, 100, 1000):
        x = logx(v, 1, 1000, X0, X1)
        b.append(vline(x, ax, ax + 5))
        b.append(txt(round(x, 1), ax + 19, f"{v:,}×", "sub2", "middle"))
    body, yb = prose(ax + 58, [
        "Top to bottom, bandwidth is usually said to fall a hundredfold and latency to grow a thousandfold. "
        f"Worked out from the previous figure, bandwidth falls about {bw_ratio:.0f}× and latency grows about "
        f"{lat_ratio:.0f}× on an idle chip, and more when the memory is busy and requests queue.",
        "Either way, reaching down to HBM for a byte costs vastly more than doing arithmetic on a byte "
        "already at the top. GPU programming is largely the craft of staging data upward and keeping the "
        "maths units fed from the fast end.",
    ])
    emit("o054", stamp(SRT, "hundredfold drop in bandwidth"), "The asymmetry that defines the craft", yb + 24,
         b + [body],
         "Log axis: the gaps span two and three decades, past what straight bars can show honestly. They call "
         "for different remedies: bandwidth by moving fewer bytes, latency by having more work in flight.")


def fixes():
    edit_item("o052", replace=[("SRAM, up to 228 KB, nanoseconds", "L1 and shared memory, 256 KB")],
              caption="Scope, drawn: each box holds what can be reached from inside it. Registers and the SRAM "
                      "belong to one multiprocessor, the L2 to the whole die, and HBM is separate chips beside it.")


if __name__ == "__main__":
    o051()
    p16()
    p15()
    o054()
    fixes()
