"""V01 Part 9, placing the two phases: o128 with its derivation shown (review §5.6), o129 on the to-scale
roofline (§5.1 #4), and proposal 22, why the opening's 300 and the ridge are the same number.

  python3 figures/V01/src/placing.py
"""
from common import (cell, ln, txt, hd, eq, prose, emit, st, f, g, sig, D, L, N, N_EXACT, W_BYTES, KV_PER_TOKEN,
                    PEAK, BW, RIDGE)
import roof
from roof import xs, ys, axes, roof_points

P = 2000
W_OPS = 2 * N_EXACT * P                          # every weight, once per prompt token
ATT_OPS = 2 * 2 * D * L * P * (P + 1) // 2       # causal scores and blend: query i meets i keys
PRE_OPS = W_OPS + ATT_OPS
KV_WRITE = P * KV_PER_TOKEN
assert round(W_OPS / 1e12, 1) == 282.2 and round(ATT_OPS / 1e12, 1) == 5.2 and round(PRE_OPS / 1e12) == 287
assert round(2 * N_EXACT / 1e9, 1) == 141.1 and round(KV_WRITE / 1e9, 2) == 0.66
PRE_BYTES = 146e9                                # the lecture's figure: weights, cache writes, intermediates
assert 2 * N_EXACT + KV_WRITE < PRE_BYTES < 2 * N_EXACT + KV_WRITE + 5e9
PRE_I = PRE_OPS / PRE_BYTES
assert round(PRE_I, -2) == 2000
T_READ = W_BYTES / BW
T_MATH = 2 * N / PEAK
assert round(T_READ * 1e3, 1) == 41.8 and round(T_MATH * 1e3, 3) == 0.142 and round(T_READ / T_MATH, 1) == 295.2
assert abs(T_READ / T_MATH - RIDGE / 1) < 1e-9


def o128():
    b = [hd(40, 46, "Prefill: a 2,000-token prompt through the 70-billion-parameter model")]
    rows = [("operations", f"2 × 70.55 billion × 2,000 = {f(W_OPS / 1e12, 1)} trillion, for the weights"),
            ("", f"+ {f(ATT_OPS / 1e12, 1)} trillion for attention's scores and blend ({{{{fig:v01-o115}}}})"),
            ("", f"= {round(PRE_OPS / 1e12)} trillion: about 290 trillion"),
            ("bytes moved", f"{f(2 * N_EXACT / 1e9, 1)} GB of weights + {f(KV_WRITE / 1e9, 2)} GB of keys and values kept"),
            ("", "+ a few GB of intermediate results: about 146 GB"),
            ("intensity", f"{round(PRE_OPS / 1e12)} trillion ÷ 146 billion = about 2,000 operations per byte")]
    y = 74
    for lab, s in rows:
        if lab:
            y += 8
            b.append(txt(40, y, lab, "cap"))
        b.append(txt(160, y, s, "sub2"))
        y += 22
    y += 20
    b.append(hd(40, y, "Decode: one token, a batch of one"))
    rows2 = [("operations", "2 × 70 billion = 140 billion"), ("bytes moved", "the same 140 GB of weights"),
             ("intensity", "140 billion ÷ 140 billion = 1 operation per byte")]
    y += 28
    for lab, s in rows2:
        b.append(txt(40, y, lab, "cap"))
        b.append(txt(160, y, s, "sub2"))
        y += 30
    body, yb = prose(y + 22, [
        "Every number comes from the shapes alone. Prefill uses every weight once per prompt token, two "
        "operations each ({{fig:v01-o113}}); attention's own work adds 2%. The bytes are almost entirely the "
        "one read of the weights, which all 2,000 tokens share.",
        "Decode reads the identical bytes and gets one operation out of each. The keys and values kept are the "
        "subject of Part 11; the intermediate results, which the layers hand each other, add a few gigabytes "
        "that the lecture rounds into its 146.",
    ])
    emit("o128", st("Now we place prefill and decode on the same diagram"), "The two numbers", yb + 26, b + [body],
         "Same model, same chip. Two thousand operations per byte against one, and the difference is only how "
         "many tokens share each read of the weights.")


def o129():
    b = [hd(40, 34, "Both phases on the H100's roofline, to scale")]
    b += axes()
    b.append(f'<polyline class="pl-m" points="{roof_points(PEAK, BW)}"/>')
    xr = xs(RIDGE)
    b.append(ln(xr, ys(PEAK) + 4, xr, roof.B, "mark"))
    b.append(txt(xr + 6, roof.B - 10, f"ridge, {round(RIDGE)}", "sub2 halo"))
    xd, yd = xs(1), ys(BW * 1)
    xp, yp = xs(2000), ys(PEAK)
    b.append(f'<circle cx="{xd}" cy="{yd}" r="6" fill="var(--h-fill)" stroke="var(--h)" stroke-width="2"/>')
    b.append(f'<circle cx="{xp}" cy="{yp}" r="6" fill="var(--s-fill)" stroke="var(--s)" stroke-width="2"/>')
    b.append(txt(xd + 10, yd + 18, "decode: 1 operation per byte", "sub2 halo"))
    b.append(txt(xp, yp - 14, "prefill: 2,000", "sub2 halo", "middle"))
    # the distances, in factors of ten: the same length on this axis is the same ratio
    yb_ = roof.B - 40
    b.append(ln(xd, yb_, xr, yb_, "tick"))
    b.append(txt((xd + xr) / 2, yb_ - 8, f"× {round(RIDGE)}", "sub2 halo", "middle"))
    b.append(ln(xr, yb_, xp, yb_, "tick"))
    b.append(txt((xr + xp) / 2, yb_ - 8, f"× {f(2000 / RIDGE, 1)}", "sub2 halo", "middle"))
    body, yb = prose(roof.B + 66, [
        f"Prefill sits {f(2000 / RIDGE, 1)} times to the right of the ridge, up on the flat ceiling: the "
        "arithmetic units are saturated and the memory bus has bandwidth to spare.",
        f"Decode sits {round(RIDGE)} times to the left, deep on the slanted ceiling, with the memory bus at close "
        f"to full use and the arithmetic units busy 1/{round(RIDGE)} of the time, {f(100 / RIDGE, 2)}%. On a "
        "logarithmic axis equal lengths are equal ratios, so the left-hand gap is drawn almost three times as "
        "long as the right.",
        "A prompt's intensity is simply its length: P tokens make P × 2N operations from the same 2N bytes. So "
        "prefill reaches the ridge at a prompt of about 295 tokens, and shorter prompts are memory bound too.",
    ])
    assert round(100 / RIDGE, 2) == 0.34
    emit("o129", st("Against a ridge of 295,"), "Both phases on one diagram", yb + 26, b + [body],
         "Two points on the same picture, separated by a factor of two thousand. Everything the rest of this "
         "series does is an attempt to move the left-hand point rightward.")


def p22():
    b = [hd(40, 46, "The opening's puzzle, worked with the H100's exact numbers")]
    rows = [("time to read the weights", f"140 GB ÷ 3.35 TB/s = {f(T_READ * 1e3, 1)} ms", "h"),
            ("time to do the arithmetic", f"140 billion ÷ 989 trillion a second = {f(T_MATH * 1e3, 3)} ms", "m"),
            ("their ratio", f"{f(T_READ * 1e3, 1)} ÷ {f(T_MATH * 1e3, 3)} = {round(T_READ / T_MATH)}", "u")]
    for k, (lab, s, c) in enumerate(rows):
        y = 70 + k * 46
        b.append(txt(40, y + 21, lab, "cap"))
        b.append(cell(240, y, 400, 32, c, rx=5, label=s))
    yr = 70 + 3 * 46 + 22
    b.append(hd(40, yr, "Rearranged, the same division is the ridge over the intensity"))
    steps = ["(bytes ÷ bandwidth) ÷ (operations ÷ peak)",
             "=  (peak ÷ bandwidth)  ÷  (operations ÷ bytes)",
             f"=  ridge ÷ intensity  =  {round(RIDGE)} ÷ 1"]
    for k, s in enumerate(steps):
        b.append(eq(140, yr + 16 + k * 50, 400, s, "s" if k == 2 else "u", h=38))
    body, yb = prose(yr + 16 + 3 * 50 + 30, [
        "Part 3 found that the chip could finish the arithmetic for about 300 tokens in the time one token takes "
        f"({{{{fig:v01-o068}}}}). With the H100's exact figures that ratio is {round(T_READ / T_MATH)}, and it is no "
        "coincidence that the ridge is 295 too.",
        "Dividing the time to read by the time to compute is the same as dividing the chip's ridge by the "
        "workload's intensity. Decode's intensity is 1, so the chip waits on memory exactly as many times longer "
        "than it computes as its ridge is high.",
        f"The arithmetic share is then 1/{round(RIDGE)} = {f(100 / RIDGE, 2)}%: Part 3's 0.33%, worked with exact "
        "numbers instead of round ones.",
    ])
    emit("p22", st("running at less than 1%"), "The 300 from the opening and the ridge are the same number",
         yb + 26, b + [body],
         "The puzzle of Part 3 and the roofline of Part 8 are one calculation. The chip waits 295 times longer than "
         "it computes because decode does one operation per byte and the chip needs 295.")


if __name__ == "__main__":
    for fn in (o128, o129, p22):
        fn()
