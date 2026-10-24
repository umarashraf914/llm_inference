"""V2 Part 11, the ridge: Figs 74 and 75 merged into one recap of V1's roofline, and Figs 76 and 77 put
on log axes at one precision (16-bit), reconciled with V1's prefill intensity.

  python3 figures/V02/src/ridge.py     writes o074 o076 o077
"""
import math
from common import *  # noqa: F401,F403

RIDGE = PEAK_BF16 / HBM_BW
B16 = 2                                                 # bytes per number at 16 bits


def mm_intensity(m, k, n, weights_only=False, bpe=B16):
    ops = 2 * m * k * n
    nums = k * n if weights_only else m * k + k * n + m * n
    return ops / (nums * bpe)


PRE, PRE_W = mm_intensity(2048, 4096, 4096), mm_intensity(2048, 4096, 4096, True)
DEC = mm_intensity(1, 4096, 4096)
ADD = 1 / (3 * B16)
MM1K = mm_intensity(1024, 1024, 1024)
assert round(PRE) == 1024 and round(PRE_W) == 2048 and round(DEC, 3) == 1.0
assert round(ADD, 2) == 0.17 and round(MM1K) == 341 and MM1K > RIDGE and round(MM1K / ADD) == 2048
assert round(mm_intensity(1024, 1024, 1024, bpe=4)) == 171          # the old figure's FP32 number


def o074():
    b = [eq(40, 46, 600, "attainable  =  min( 989.4 trillion a second,  3.352 TB/s  ×  intensity )", cls="m")]
    X0, X1, Y0, Y1 = 110, 610, 268, 118                 # intensity 0.1..10,000 ; FLOP/s 1e11..1e15
    lx = lambda v: logx(v, 0.1, 1e4, X0, X1)
    ly = lambda v: Y0 - (math.log10(v) - 11) / 4 * (Y0 - Y1)
    b.append(ln(X0, Y0, X1, Y0, "axis"))
    b.append(ln(X0, Y1 - 10, X0, Y0, "axis"))
    pts = [(0.1, HBM_BW * 0.1), (RIDGE, PEAK_BF16), (1e4, PEAK_BF16)]
    b.append('<polyline class="pl-h" points="' + " ".join(f"{lx(x):.1f},{ly(y):.1f}" for x, y in pts) + '"/>')
    for v, s_ in [(0.1, "0.1"), (1, "1"), (10, "10"), (100, "100"), (1000, "1,000"), (1e4, "10,000")]:
        b.append(vline(lx(v), Y0, Y0 + 5))
        b.append(txt(round(lx(v), 1), Y0 + 19, s_, "sub2", "middle"))
    b.append(txt(X1, Y0 + 38, "operations per byte (log)", "sub2", "end"))
    for v, s_ in [(1e12, "1 T"), (1e13, "10 T"), (1e14, "100 T"), (1e15, "1,000 T")]:
        b.append(ln(X0 - 5, round(ly(v), 1), X0, round(ly(v), 1), "tick"))
        b.append(txt(X0 - 9, round(ly(v), 1) + 4, s_, "sub2", "end"))
    b.append(txt(40, Y1 - 18, "operations a second (log)", "sub2"))
    b.append(ln(lx(RIDGE), ly(PEAK_BF16), lx(RIDGE), Y0, "tick"))
    b.append(txt(round(lx(RIDGE), 1) + 6, ly(PEAK_BF16) - 10, f"ridge: {RIDGE:.0f}", "sub2"))
    b.append(txt(round(lx(1.2), 1), ly(HBM_BW * 1.2) - 14, "memory bound", "sub2 halo"))
    b.append(txt(round(lx(1200), 1), ly(PEAK_BF16) + 22, "compute bound", "sub2"))
    b.append(eq(40, Y0 + 56, 600, f"ridge  =  989.4 trillion  ÷  3.352 trillion bytes  =  {RIDGE:.0f} operations per byte"))
    body, yb = prose(Y0 + 56 + 42 + 36, [
        "A recap of V1's roofline ({fig1}). Below the ridge the slanted roof binds: the chip can do no more "
        "operations a second than bandwidth times intensity. Above it the flat ceiling binds, the tensor "
        "cores' peak.".replace("{fig1}", "{{fig:v01-o123}}"),
        f"The ridge is where the two meet, the two hardware peaks divided ({{{{fig:v01-o126}}}}). Below "
        f"{RIDGE:.0f} operations per byte a kernel waits on HBM; above it, on the tensor cores.",
    ])
    emit("o074", stamp(SRT, "That rich point"), "The roofline, and the 295 it turns on", yb + 24, b + [body],
         "Both axes logarithmic. The ridge is not a free-standing number: it is the tensor cores' peak over "
         "HBM's bandwidth, so every change to either chip spec moves it.")


def o076():
    b = [eq(60, 46, 560, "intensity  =  operations  ÷  bytes moved", cls="m")]
    X0, X1, V0, V1 = 210, 610, 0.5, 5000
    rows = [("decode", "1 token", DEC, "h", f"{DEC:.0f} per byte"),
            ("prefill, all bytes", "2,048 tokens", PRE, "s", f"{PRE:,.0f} per byte"),
            ("prefill, weights only", "as V1 counts it", PRE_W, "s", f"{PRE_W:,.0f} per byte")]
    for k, (lab, shape, v, c, note) in enumerate(rows):
        y = 112 + k * 50
        w = logx(v, V0, V1, X0, X1) - X0
        b.append(txt(40, y + 14, lab, "cap"))
        b.append(txt(40, y + 32, shape, "sub2"))
        b.append(rect(X0, y, w, 26, c))
        b.append(txt(X0 + w + 8, y + 18, note, "sub2 halo"))
    ax = 112 + 3 * 50 + 4
    b.append(ln(X0, ax, X1, ax, "axis"))
    for v in (1, 10, 100, 1000):
        b.append(vline(logx(v, V0, V1, X0, X1), ax, ax + 5))
        b.append(txt(round(logx(v, V0, V1, X0, X1), 1), ax + 19, f"{v:,}", "sub2", "middle"))
    xr = logx(RIDGE, V0, V1, X0, X1)
    b.append(ln(xr, 104, xr, ax, "mark xok"))
    b.append(txt(round(xr, 1), 98, f"the ridge, {RIDGE:.0f}", "sub2", "middle"))
    body, yb = prose(ax + 56, [
        "The same weights, the same chip, 16-bit numbers. A token's vector times a 4,096 × 4,096 weight "
        "matrix uses each weight once: one operation per byte. A 2,048-token prompt times the same matrix "
        "reuses each weight 2,048 times.",
        f"Counting every byte read and written, prefill does {PRE:,.0f} operations per byte; counting only "
        f"the weights, {PRE_W:,.0f}. V1's “about 2,000” counts a whole 70B model, where the weights "
        "dwarf everything else ({fig}). Either way prefill sits far right of the ridge and decode far "
        "left.".replace("{fig}", "{{fig:v01-o128}}"),
    ])
    emit("o076", stamp(SRT, "why decode lands deep"), "Where prefill and decode land", yb + 24, b + [body],
         "Log axis; intensity computed from the shapes. This single comparison explains most of what is "
         "strange about serving large language models.")


def o077():
    b = [hd(40, 46, "Two operations at 16 bits, against the H100's ridge (log axis)")]
    X0, X1, V0, V1 = 230, 610, 0.05, 2000
    rows = [("adding two arrays", "c[i] = a[i] + b[i]", ADD, "h", f"{ADD:.2f} per byte"),
            ("multiplying two matrices", "1,024 × 1,024 each", MM1K, "s", f"{MM1K:.0f} per byte")]
    for k, (lab, sub, v, c, note) in enumerate(rows):
        y = 74 + k * 56
        w = logx(v, V0, V1, X0, X1) - X0
        b.append(txt(40, y + 14, lab, "cap"))
        b.append(txt(40, y + 32, sub, "sub2"))
        b.append(rect(X0, y, w, 28, c))
        b.append(txt(X0 + w + 8, y + 19, note, "sub2 halo"))
    ax = 74 + 2 * 56 + 4
    b.append(ln(X0, ax, X1, ax, "axis"))
    for v, s_ in [(0.1, "0.1"), (1, "1"), (10, "10"), (100, "100"), (1000, "1,000")]:
        b.append(vline(logx(v, V0, V1, X0, X1), ax, ax + 5))
        b.append(txt(round(logx(v, V0, V1, X0, X1), 1), ax + 19, s_, "sub2", "middle"))
    xr = logx(RIDGE, V0, V1, X0, X1)
    b.append(ln(xr, 66, xr, ax, "mark xok"))
    b.append(txt(round(xr, 1), 60, f"ridge {RIDGE:.0f}", "sub2", "middle"))
    body, yb = prose(ax + 56, [
        "Adding two arrays reads two numbers and writes one for each addition: 6 bytes per operation at "
        f"2 bytes a number, {ADD:.2f} operations per byte.",
        f"Multiplying two 1,024 × 1,024 matrices does 2 × 1,024³ = {2 * 1024 ** 3:,} operations on 3 × 1,024² "
        f"numbers, if each is read or written only once, the best case that tiling approaches: "
        f"{3 * 1024 ** 2 * 2:,} bytes, {MM1K:.0f} operations per byte, just right of the ridge.",
        f"Two thousand times apart, and neither number depends on the chip. The chip only decides where "
        "the ridge falls; which side you land on was settled by the mathematics.",
    ])
    emit("o077", stamp(SRT, "why decode lands deep"), "Intensity, worked for two real operations", yb + 24,
         b + [body],
         "Computed from the shapes, not measured. Precision moves intensity too: at 32 bits every number "
         "takes twice the bytes, and both intensities halve.")


if __name__ == "__main__":
    o074()
    o076()
    o077()
