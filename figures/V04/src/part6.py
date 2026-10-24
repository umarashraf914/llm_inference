"""V4 Part 6, where quantization pays: review entries 16 and 17 (p16, p17), Fig 52 redrawn as a real
log-log roofline with labelled points, Fig 55 given a new job (the KV cache caps decode's intensity),
and Fig 57 with bars drawn to scale.

  python3 figures/V04/src/part6.py
"""
import math
from common import emit, hd, cell, box, eq, ln, arr, prose, text, tick, hline, dot, rect, poly, f, fi, nb, MINUS, st, sup

PEAK16 = 1979e12 / 2          # H100 SXM, FP16/BF16 tensor, dense (NVIDIA quotes 1,979 with sparsity)
PEAK8 = 3958e12 / 2           # FP8 and INT8, dense
BW = 3.35e12                  # bytes per second
RIDGE16, RIDGE8 = PEAK16 / BW, PEAK8 / BW
assert round(RIDGE16) == 295 and round(RIDGE8) == 591
N = 70e9                      # the 70-billion-parameter model used throughout
KV_BYTES = 2 * 80 * 8 * 128 * 2          # K and V, 80 layers, 8 KV heads of 128, 16-bit: per token of context
ATT_OPS = 2 * 2 * 64 * 128 * 80          # Q.K and attention-weighted V, multiply-add, 64 query heads
assert KV_BYTES == 327680 and ATT_OPS / KV_BYTES == 8


def logaxis(lo, hi, a, b):
    """log10 value -> pixel, lo..hi in decades mapped to a..b."""
    return lambda v: a + (math.log10(v) - lo) / (hi - lo) * (b - a)


# ---- o052: the roofline, with the two phases labelled -------------------------------------------------
def o052():
    b = [eq(80, 46, 520, "intensity  =  operations ÷ bytes:   halve the bytes, double the intensity", "m")]
    X = logaxis(-1, 4, 110, 620)
    Y = logaxis(math.log10(0.3), math.log10(3000), 290, 120)
    roof = lambda i: min(PEAK16, BW * i)
    pts = [(X(10 ** (k / 20)), Y(roof(10 ** (k / 20)) / 1e12)) for k in range(-20, 81)]
    b.append(ln(110, 290, 620, 290, "axis"))
    b.append(ln(110, 120, 110, 290, "axis"))
    b.append(poly(pts, "pl-h"))
    for e in range(-1, 5):
        b.append(tick(X(10 ** e), 290, 295))
        b.append(text(X(10 ** e), 310, ("1" if e == 0 else "10" if e == 1 else "10" + sup(e)), "sub2", "middle"))
    b.append(text(365, 330, "operations per byte, log scale", "sub2", "middle"))
    b.append(text(100, 126, "TFLOP/s", "sub2", "end"))
    b.append(text(100, Y(1) + 4, "1", "sub2", "end"))
    b.append(text(100, Y(1000) + 4, "1,000", "sub2", "end"))
    for v in (1, 1000):
        b.append(ln(105, Y(v), 110, Y(v), "tick"))
    # the ridge
    xr = X(RIDGE16)
    b.append(text(xr, Y(PEAK16 / 1e12) - 12, f"ridge, {RIDGE16:.0f}", "sub2", "middle"))
    # decode: batch 1 at FP16, then half the bytes
    d0, d1 = 1.0, 2.0
    b.append(dot(X(d0), Y(roof(d0) / 1e12), 4.5, "s"))
    b.append(dot(X(d1), Y(roof(d1) / 1e12), 4.5, "s"))
    b.append(text(X(d1) + 12, Y(roof(d1) / 1e12) + 16, "decode: twice as fast", "sub2"))
    p0, p1 = 2000.0, 4000.0
    b.append(dot(X(p0), Y(roof(p0) / 1e12), 4.5, "h"))
    b.append(dot(X(p1), Y(roof(p1) / 1e12), 4.5, "h"))
    b.append(text(X(p0) - 6, Y(roof(p0) / 1e12) + 22, "prefill: no faster", "sub2", "middle"))
    assert roof(d1) == 2 * roof(d0) and roof(p1) == roof(p0)
    body, y = prose(370, [
        "Quantization changes only the denominator, so it can only ever push a workload to the right. "
        "Decode at batch 1 sits at one operation per byte; halving its bytes doubles both its intensity "
        "and its speed. Prefill sits near 2,000 ({{fig:v01-o128}}), already past the ridge.",
        "Left of the ridge that slide is pure speed-up. Cross the ridge and fewer bytes buys almost "
        "nothing, because you were never waiting on memory.",
    ])
    b.append(body)
    emit("o052", "8:18", "Quantization pushes one way only", y + 26, b,
         "The decode point gains. The prefill point has already crossed and gains nothing. Which one you "
         "are depends entirely on the phase. Both axes are logarithmic, peaks from NVIDIA's H100 SXM sheet.")


# ---- o055: the cache caps decode's intensity -------------------------------------------------------------
def intensity(B, bytes_w, cache_frac=1.0, L=4096):
    """Operations per byte for one decode step: weights read once for the batch, each sequence's cache once."""
    return (2 * N * B + ATT_OPS * B * L) / (N * bytes_w + B * L * KV_BYTES * cache_frac)


def o055():
    L = 4096
    cap16 = 2 * N / (L * KV_BYTES) + ATT_OPS / KV_BYTES
    cap4 = 2 * N / (L * KV_BYTES / 4) + ATT_OPS / (KV_BYTES / 4)
    assert round(cap16) == 112 and round(cap4) == 449
    lo, hi = 1.0, 1e6
    for _ in range(100):
        m = (lo + hi) / 2
        lo, hi = (m, hi) if intensity(m, 0.5, 0.25) < RIDGE16 else (lo, m)
    b4c4 = hi
    assert round(b4c4) == 200 and round(RIDGE16 / 4) == 74
    assert all(intensity(B, 0.5) < RIDGE16 for B in (2 ** k for k in range(0, 30)))
    b = [hd(40, 46, "Decode's operations per byte as the batch grows: 4-bit weights, 4,096 tokens of context")]
    X = logaxis(0, math.log10(4096), 110, 560)
    Y = logaxis(0, 3, 290, 80)
    b.append(ln(110, 290, 560, 290, "axis"))
    b.append(ln(110, 80, 110, 290, "axis"))
    for k in range(0, 13, 2):
        b.append(tick(X(2 ** k), 290, 295))
        b.append(text(X(2 ** k), 310, fi(2 ** k), "sub2", "middle"))
    b.append(text(335, 330, "batch size, log scale", "sub2", "middle"))
    for v in (1, 10, 100, 1000):
        b.append(ln(105, Y(v), 110, Y(v), "tick"))
        b.append(text(100, Y(v) + 4, fi(v), "sub2", "end"))
    b.append(f'<line class="mark xok" x1="110" y1="{Y(RIDGE16):.1f}" x2="560" y2="{Y(RIDGE16):.1f}"/>')
    b.append(text(566, Y(RIDGE16) + 4, f"ridge {RIDGE16:.0f}", "sub2"))
    Bs = [2 ** (k / 8) for k in range(0, 97)]
    curves = [("pl-m", lambda B: 4 * B, "weights only"), ("pl-h", lambda B: intensity(B, 0.5), "16-bit cache"),
              ("pl-s", lambda B: intensity(B, 0.5, 0.25), "4-bit cache")]
    for cls, fn, lab in curves:
        pts = [(X(B), Y(fn(B))) for B in Bs if fn(B) <= 1000]
        b.append(poly(pts, cls, dash="5 4" if cls == "pl-m" else None))
    b.append(text(X(64) - 8, Y(4 * 64) - 10, "weights alone: ridge at batch 74", "sub2 halo", "end"))
    b.append(text(X(4096), Y(intensity(4096, 0.5, 0.25)) - 10, "4-bit cache: ridge at batch 200",
                  "sub2 halo", "end"))
    b.append(text(X(4096), Y(intensity(4096, 0.5)) + 18, "16-bit cache: stops near 112", "sub2 halo", "end"))
    body, y = prose(370, [
        "{{fig:v01-o116}} worked decode's intensity from the weights alone: at batch B it is B "
        "operations per byte at 16 bits, so the ridge comes at batch 295, or at 74 with 4-bit weights. "
        "But each sequence also rereads its own keys and values ({{fig:v04-o054}}), 320 KB per token of "
        "context for this 70-billion-parameter model ({{fig:v04-o069}}), and that traffic is not shared.",
        "At 4,096 tokens that is 1.3 GB per sequence, and each cached byte feeds only about 8 operations, "
        "because the model's 64 query heads share 8 key-value heads. As the batch grows the cache comes "
        f"to dominate the bytes, and intensity levels off near {cap16:.0f}: below the ridge however large "
        "the batch, and whatever format the weights are in. Storing the cache in 4 bits lifts the "
        f"ceiling to {cap4:.0f}.",
        "W8 A8 moves the ridge itself, by raising the ceiling ({{fig:v04-p16}}).",
    ])
    b.append(body)
    emit("o055", "9:35", "Batching shares the weights, but not the cache", y + 26, b,
         "Quantizing the weights brings the ridge within reach only while the weights dominate the "
         "bytes. At long context the cache sets the limit, which is why the cache gets quantized too.")


# ---- o057: inside W4 A16, with bars to scale -----------------------------------------------------------------
def o057():
    g = 128
    w16, w4 = 2.0, 0.5 + 2 / g
    assert round(w4, 4) == 0.5156
    b = [box(40, 52, 150, 44, "s", "INT4 in HBM", "two per byte"),
         arr(196, 74, 214, 74),
         box(220, 52, 180, 44, "m", "dequantize to FP16", "on chip, per tile"),
         arr(406, 74, 424, 74),
         box(430, 52, 210, 44, "u", "FP16 × FP16 matmul")]
    PX = 120
    b.append(text(40, 140, "Bytes read per weight, to scale", "hd"))
    b.append(text(40, 172, "FP16", "cap"))
    b.append(rect(160, 156, w16 * PX, 24, "u", rx=2))
    b.append(text(160 + w16 * PX + 10, 173, "2 bytes", "sub2"))
    b.append(text(40, 206, "W4 A16", "cap"))
    b.append(rect(160, 190, w4 * PX, 24, "s", rx=2))
    b.append(text(160 + w4 * PX + 10, 207, f"0.5 bytes, or {f(w4, 2)} with an FP16 scale per {g}", "sub2"))
    b.append(text(40, 252, "Operations per weight, to scale", "hd"))
    b.append(text(40, 284, "FP16", "cap"))
    b.append(rect(160, 268, 2 * 60, 24, "u", rx=2))
    b.append(text(40, 318, "W4 A16", "cap"))
    b.append(rect(160, 302, 2 * 60, 24, "u", rx=2))
    b.append(text(160 + 120 + 10, 302 + 17, "2 each: one multiply, one add, unchanged", "sub2"))
    body, y = prose(366, [
        "This is what W4 A16 actually does. The weights travel as four-bit integers, two packed into each "
        "byte, then expand back to sixteen bits on chip, just before the multiply.",
        f"So the bus carries about a quarter as many bytes, {f(w4 / w16 * 100, 0)}% of FP16's once the "
        "scales are counted ({{fig:v04-o058}}), and the tensor cores do exactly the same work. That is why weight-only "
        "quantization speeds up memory-bound decode and does almost nothing for compute-bound prefill.",
        "To speed up the arithmetic you have to quantize the activations too, so the multiply itself can "
        "run in a narrower format.",
    ])
    b.append(body)
    emit("o057", "9:58", "What happens inside a W4 A16 matmul", y + 26, b,
                     "The dequantization step is the part that is easy to miss, and it is exactly why the two "
                     "strategies have different effects.")


# ---- p17: inside W8 A8 -------------------------------------------------------------------------------------------
def p17():
    x = [0.5, -1.2, 2.0, 0.3]
    w = [0.8, 0.1, -0.45, 0.6]
    a, bb = max(map(abs, x)) / 127, max(map(abs, w)) / 127
    qx, rw = [v / a for v in x], [v / bb for v in w]
    assert all(abs(v - round(v)) != 0.5 for v in qx + rw)          # no ties to explain
    q, r = [round(v) for v in qx], [round(v) for v in rw]
    S = sum(i * j for i, j in zip(q, r))
    y_int = a * bb * S
    y = sum(i * j for i, j in zip(x, w))
    assert (q, r, S) == ([32, -76, 127, 19], [127, 16, -71, 95], -4364)
    assert round(y, 2) == -0.44 and abs(y_int - y) < 0.008
    big = 127 * 127 * 4096
    assert big == 66064384 and big < 2 ** 31 - 1 and big > 2 ** 15 - 1
    b = [hd(40, 46, "One output of a W8 A8 matmul: four inputs, four weights")]
    rows = [("activations x", x, "a = 2.0 ÷ 127", q, "token's scale"),
            ("weights w", w, "b = 0.8 ÷ 127", r, "output channel's scale")]
    cols = [40, 150, 210, 270, 330]
    for k, (lab, vals, sc, ints, note) in enumerate(rows):
        y0 = 80 + k * 70
        b.append(text(40, y0 + 18, lab, "cap"))
        for j, v in enumerate(vals):
            b.append(text(170 + j * 60, y0 + 18, f(v, 2), "sub2", "middle"))
            b.append(cell(146 + j * 60, y0 + 26, 48, 24, "m", label=str(ints[j]).replace("-", MINUS)))
        b.append(text(410, y0 + 18, sc, "sub2"))
        b.append(text(410, y0 + 43, f"integers: round(value ÷ {sc[0]})", "sub2"))
    steps = [("the exact output", f"Σ x w  =  0.40 − 0.12 − 0.90 + 0.18  =  {f(y, 2)}", "u"),
             ("substitute", "Σ (a q) × (b r)  =  a × b × Σ q r", "m"),
             ("the integer sum", f"32×127 − 76×16 − 127×71 + 19×95  =  {fi(S)}", "m"),
             ("one float multiply", f"a × b × ({fi(S)})  =  {f(y_int, 4)}", "s")]
    for k, (lab, s, c) in enumerate(steps):
        yy = 232 + k * 46
        b.append(text(40, yy + 24, lab, "sub2"))
        b.append(box(190, yy, 450, 36, c, s))
    body, yb = prose(232 + 4 * 46 + 34, [
        "Both sides are stored as INT8, each with its own scale: one number a for the token's activations, "
        "one number b for the column of weights that makes this output. Because a and b are the same for "
        "every term, they come out of the sum, and what is left is pure integer multiply-and-add, the "
        "work the tensor cores' eight-bit path does twice as fast ({{fig:v02-o084}}). One float multiply "
        f"per output then restores the scale, here to within {f(abs(y_int - y), 3)} of the exact answer.",
        "The running sum needs room. Each product is at most 127 × 127 = 16,129, so 4,096 of them can "
        f"reach {fi(big)}: far beyond a 16-bit integer's 32,767 but well inside a 32-bit integer's "
        "2,147,483,647. Integer matmuls therefore add up in INT32, as float ones add up in FP32 "
        "({{fig:v02-o089}}).",
    ])
    b.append(body)
    emit("p17", st("weight and activation quantization W8"),
         "Inside a W8 A8 matmul the integers multiply and the scales wait outside the sum", yb + 26, b,
         "The scales can wait outside only because each is constant along the sum. That condition is "
         "about to matter: an activation scale that changed from term to term would break it.")


# ---- p16: two strategies, two lines of the roofline ---------------------------------------------------------------
def p16():
    schemes = [("FP16", 2.0, PEAK16), ("W4 A16", 0.5, PEAK16), ("W8 A8", 1.0, PEAK8)]
    batches = (16, 512)
    att = {}
    for name, bw, peak in schemes:
        for B in batches:
            att[(name, B)] = min(peak, BW * 2 * B / bw) / 1e12
    assert round(att[("FP16", 16)], 1) == 53.6 and round(att[("W4 A16", 16)], 1) == 214.4
    assert round(att[("W8 A8", 16)], 1) == 107.2 and att[("W4 A16", 512)] == att[("FP16", 512)]
    assert att[("W8 A8", 512)] == 2 * att[("FP16", 512)]
    b = [hd(40, 40, "Three H100 rooflines, log scales; dots are decode at batch 16 and batch 512")]
    PW, PH, GAP, X0, YT = 180, 150, 30, 50, 70
    for k, (name, bw, peak) in enumerate(schemes):
        x0 = X0 + k * (PW + GAP)
        X = logaxis(0, 4, x0, x0 + PW)
        Y = logaxis(1, math.log10(3000), YT + PH, YT)
        b.append(text(x0, YT - 8, f"{name}: ceiling {fi(peak / 1e12)}", "sub2"))
        b.append(ln(x0, YT + PH, x0 + PW, YT + PH, "axis"))
        b.append(ln(x0, YT, x0, YT + PH, "axis"))
        roof = lambda i: min(peak, BW * i) / 1e12
        pts = [(X(10 ** (j / 20)), Y(roof(10 ** (j / 20)))) for j in range(0, 81) if roof(10 ** (j / 20)) >= 10]
        b.append(poly(pts, "pl-h"))
        for B, c in zip(batches, ("s", "m")):
            i = 2 * B / bw
            b.append(dot(X(i), Y(att[(name, B)]), 4.5, c))
        for e in (0, 2, 4):
            b.append(text(X(10 ** e), YT + PH + 16, "1" if e == 0 else "10" + sup(e), "sub2", "middle"))
    b.append(text(X0 + 1.5 * PW + GAP, YT + PH + 36, "operations per byte", "sub2", "middle"))
    ty = YT + PH + 76
    cols = [40, 160, 280, 430]
    for c, h in zip(cols, ["", "ridge", "batch 16 (teal)", "batch 512 (amber)"]):
        if h:
            b.append(text(c, ty, h, "sub2"))
    for k, (name, bw, peak) in enumerate(schemes):
        yy = ty + 24 + k * 22
        b.append(text(cols[0], yy, name, "cap"))
        b.append(text(cols[1], yy, f"{peak / BW:.0f}", "sub2"))
        for c, B in zip(cols[2:], batches):
            gain = att[(name, B)] / att[("FP16", B)]
            b.append(text(c, yy, f"{f(att[(name, B)], 1)} TFLOP/s, ×{gain:g}", "sub2"))
    body, yb = prose(ty + 24 + 3 * 22 + 28, [
        "Weight-only quantization multiplies decode's intensity by four and leaves the ceiling where it "
        "was: the maths still runs in 16 bits. It pays at small batch, and stops paying once the batch is "
        "large enough to make decode compute bound.",
        "W8 A8 stores one byte per weight, so intensity only doubles, but it also doubles the ceiling, "
        "because the tensor cores' eight-bit path runs twice as fast. The ridge moves to "
        f"{RIDGE8:.0f}, and once the batch is large every point sits twice as high. That is what lets it "
        "speed up prefill, and decode at large batch.",
        "Weights only: these intensities leave out the cache of {{fig:v04-o055}}. The peaks are NVIDIA's "
        "dense figures for the H100 SXM, half the numbers it quotes with sparsity.",
    ])
    b.append(body)
    emit("p16", st("That is what speeds up"), "W4 A16 and W8 A8 move different lines of the roofline", yb + 26, b,
         "Two levers on one diagram: W4 A16 slides decode to the right, W8 A8 raises the roof. Which one "
         "helps depends on the batch, which is to say on the phase.")


if __name__ == "__main__":
    for fn in (o052, o055, o057, p17, p16):
        fn()
