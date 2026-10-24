"""V4 Part 1: Fig 02 corrected (review §5.1). Decode at 16 bits and batch 1 does one operation per byte;
an H100's ridge is about 295 (V1 Figs 116 and 126), so the gap is about 295 times, not 150.

  python3 figures/V04/src/part1.py      writes figures/V04/items/o002.html
"""
import math
from common import emit, txt, eq, prose, ln, tick, text, dot, f, fi

# ---- the numbers ----------------------------------------------------------------------------------
OPS_PER_PARAM = 2            # one multiply-add per weight per token (V1 Fig 111)
BYTES_PER_PARAM = 2          # a 16-bit weight
I_DECODE = OPS_PER_PARAM / BYTES_PER_PARAM
PEAK = 1979e12 / 2           # H100 SXM FP16 tensor peak: 1,979 TFLOPS quoted with sparsity, half dense
BW = 3.35e12                 # H100 SXM HBM3 bandwidth, bytes per second
RIDGE = PEAK / BW
assert I_DECODE == 1 and round(RIDGE) == 295
GAP = RIDGE / I_DECODE


def o002():
    b = [eq(120, 52, 440, "arithmetic intensity  =  operations performed ÷ bytes moved", "m")]
    p1, y = prose(128, [
        "One number decides whether a workload waits on maths or on memory. Decode at 16 bits does "
        "two operations per weight and moves two bytes per weight, so about one operation for every "
        "byte it moves ({{fig:v01-o116}}). An H100 needs about " + f"{RIDGE:.0f}" + " before its "
        "arithmetic units become the limit ({{fig:v01-o126}}).",
    ])
    b.append(p1)
    # a log axis: equal steps are multiplications by ten (V1 Fig 121)
    X0, X1, Y = 80, 600, y + 86
    lo, hi = 0.1, 1000
    X = lambda v: X0 + (math.log10(v) - math.log10(lo)) / (math.log10(hi) - math.log10(lo)) * (X1 - X0)
    b.append(ln(X0, Y, X1, Y, "axis"))
    for v, lab in [(0.1, "0.1"), (1, "1"), (10, "10"), (100, "100"), (1000, "1,000")]:
        b.append(tick(X(v), Y - 5, Y + 5))
        b.append(text(X(v), Y + 22, lab, "sub2", "middle"))
    b.append(text((X0 + X1) / 2, Y + 42, "operations per byte, on a log scale: each step is ten times the last",
                  "sub2", "middle"))
    xd, xr = X(I_DECODE), X(RIDGE)
    b.append(dot(xd, Y, 5, "h"))
    b.append(dot(xr, Y, 5, "s"))
    b.append(text(xd, Y - 16, "decode, about 1", "sub2", "middle"))
    b.append(text(xr, Y - 16, f"H100 ridge, {RIDGE:.0f}", "sub2", "middle"))
    yb = Y - 44
    b.append(ln(xd, yb, xr, yb, "tick"))
    b.append(ln(xd, yb, xd, yb + 6, "tick"))
    b.append(ln(xr, yb, xr, yb + 6, "tick"))
    b.append(text((xd + xr) / 2, yb - 8, f"a factor of about {GAP:.0f}", "sub2", "middle"))
    p2, y2 = prose(Y + 84, [
        f"A gap of about {GAP:.0f} times. Closing it is what the whole series is about, and there are "
        "only two ways: do more operations per byte, or move fewer bytes per operation.",
    ])
    b.append(p2)
    emit("o002", "0:10", "The number that decides everything", y2 + 22, b,
         "Arithmetic intensity is the ratio to keep in your head for the rest of this document. "
         "Quantization is an attack on its denominator.")


if __name__ == "__main__":
    o002()
