"""V4 Part 3, the ladder of formats: review entries 6-12 (p06-p12) and the redrawn Figs 31, 33, 36 and 37.

  p06  FP4 listed in full, and FP6           p07  how far each eight-bit float reaches
  p08  quantizing five numbers by hand        p09  a zero-point slides the grid
  p10  the outlier's price, in numbers        p11  a gradient is a slope
  p12  loss scaling followed through one gradient
  o031 FP16's window (moved to 4:06; boxes instead of bars that were not to scale)
  o033 FP4's real ticks against INT4's        o036 FP16's floor, with the subnormal band
  o037 loss scaling: scaling a curve scales its slope

  python3 figures/V04/src/part3.py
"""
import math
from fractions import Fraction as Fr
import numpy as np
from common import (emit, hd, cell, box, eq, ln, arr, prose, text, tick, hline, dot, rect, poly, f, fi, fs,
                    sup, nb, MINUS, st)
from numfmt import values, limits, round_to, quant_sym, quant_asym, decode


def logx(lo, hi, L, R):
    """A log10 axis: value -> x."""
    return lambda v: L + (math.log10(v) - lo) / (hi - lo) * (R - L)


def decades(X, lo, hi, Y, labels=True, every=1):
    out = [hline(X(10.0 ** lo), X(10.0 ** hi), Y)]
    for e in range(lo, hi + 1):
        out.append(tick(X(10.0 ** e), Y - 5, Y + 5))
        if labels and (e - lo) % every == 0:
            out.append(text(X(10.0 ** e), Y + 20, "10" + sup(e) if e not in (0, 1) else ("1" if e == 0 else "10"),
                            "sub2", "middle"))
    return "".join(out)


# ---- p06: FP4 in full, and FP6 -------------------------------------------------------------------------
def p06():
    v = values("E2M1")
    assert [float(x) for x in v] == [0, 0.5, 1, 1.5, 2, 3, 4, 6]
    steps = [v[k + 1] - v[k] for k in range(7)]
    assert [float(s) for s in steps] == [0.5, 0.5, 0.5, 0.5, 1, 1, 2]
    L4, L23, L32 = limits("E2M1"), limits("E2M3"), limits("E3M2")
    assert (float(L23["max"]), float(L32["max"])) == (7.5, 28.0)
    assert L23["max"] == Fr(15, 8) * 4 and L32["max"] == Fr(7, 4) * 16
    b = [hd(40, 46, "FP4 (E2M1): one sign bit, two exponent bits, one mantissa bit; bias 1")]
    X0, CWD, G = 120, 60, 4
    b.append(text(40, 84, "code", "cap"))
    b.append(text(40, 120, "value", "cap"))
    b.append(text(40, 154, "in base two", "cap"))
    for k in range(8):
        x = X0 + k * (CWD + G)
        e, m = k >> 1, k & 1
        b.append(cell(x, 66, CWD, 28, "u", label=f"{e:02b} {m}"))
        b.append(cell(x, 102, CWD, 28, "m", label=f"{float(v[k]):g}"))
        form = f"{'0' if e == 0 else '1'}.{m}×2{sup(max(e, 1) - 1)}"
        b.append(text(x + CWD / 2, 154, form, "sub2", "middle"))
        assert Fr(int(form[0]) * 2 + m, 2) * 2 ** (max(e, 1) - 1) == v[k]
    # the whole line, -6 to 6
    L, R, Y = 70, 610, 226
    X = lambda t: L + (float(t) + 6) / 12 * (R - L)
    allv = sorted(set([-x for x in v] + list(v)))
    assert len(allv) == 15
    b.append(hline(L, R, Y))
    for t in allv:
        b.append(tick(X(t), Y - 7, Y + 7))
    for t in [-6, -4, -3, -2, -1, 0, 1, 2, 3, 4, 6]:
        b.append(text(X(t), Y + 22, f"{t:g}".replace("-", MINUS), "sub2", "middle"))
    b.append(text(X(3), Y - 14, "steps 0.5, 0.5, 0.5, 0.5, 1, 1, 2", "sub2", "middle"))
    b.append(text(X(-3), Y - 14, "the same, mirrored", "sub2", "middle"))
    # FP6 beside FP4
    ty = Y + 62
    cols = [40, 150, 250, 340, 445, 570]
    heads = ["format", "s + e + m", "largest", "smallest > 0", "steps per doubling", "values ≥ 0"]
    for c, s in zip(cols, heads):
        b.append(text(c, ty, s, "sub2"))
    for r, (name, lay, Lm, mb) in enumerate([("FP4  E2M1", "1 + 2 + 1", L4, 1), ("FP6  E2M3", "1 + 2 + 3", L23, 3),
                                             ("FP6  E3M2", "1 + 3 + 2", L32, 2)]):
        y = ty + 24 + r * 22
        b.append(text(cols[0], y, name, "cap"))
        b.append(text(cols[1], y, lay, "sub2"))
        b.append(text(cols[2], y, f"{float(Lm['max']):g}", "sub2"))
        b.append(text(cols[3], y, f"{float(Lm['min_sub']):g}", "sub2"))
        b.append(text(cols[4], y, str(2 ** mb), "sub2"))
        b.append(text(cols[5], y, str(Lm["codes"]), "sub2"))
    body, y = prose(ty + 24 + 3 * 22 + 28, [
        "Below the eight-bit floats sit six and four bits. Four bits make only sixteen patterns, so FP4 "
        "can be listed in full. The two exponent bits pick a power of two after subtracting the bias of "
        "1, and the mantissa bit adds a half; code 00 is the subnormal, with no implied 1, exactly as in "
        "{{fig:v04-p04}}. Code 11 1 is " + nb("1.1₂ × 2² = 6") + ", the largest.",
        "The steps grow 0.5, 0.5, 0.5, 0.5, 1, 1, 2: the float staircase of {{fig:v04-o022}} in "
        "miniature. Nothing is reserved: these small formats have no infinity and no not-a-number, so "
        "every code is a number. FP6 splits its six bits two ways, as FP8 does: more exponent reaches "
        "28, more mantissa cuts each power of two into eight steps instead of four.",
        "Alone, FP4 covers only 0.5 to 6. It becomes useful with a scale shared by a small block of "
        "values, which is how MXFP4 and NVFP4 use it ({{fig:v04-o076}}).",
    ])
    b.append(body)
    emit("p06", st("then six and four bits"), "Four bits make a float small enough to list in full", y + 26, b,
         "Sixteen patterns, fifteen numbers, since plus and minus zero coincide. Every four-bit method "
         "later in this atlas is a way of deciding where to lay this tiny ruler.")


# ---- p07: FP8 ranges ----------------------------------------------------------------------------------
def p07():
    rows = [("FP16", limits("FP16")), ("E5M2", limits("E5M2")), ("E4M3", limits("E4M3"))]
    span = {n: math.log2(Lm["max"] / Lm["min_sub"]) for n, Lm in rows}
    assert round(span["E4M3"], 1) == 17.8 and round(span["E5M2"], 1) == 31.8 and round(span["FP16"]) == 40
    ieee = [decode(c, 4, 3, "ieee") for c in range(128)]
    ieee_max = max(x for x in ieee if x is not None)
    e4 = limits("E4M3")["max"]
    assert ieee_max == 240 and e4 == 448 == Fr(7, 4) * 2 ** 8 and limits("E5M2")["max"] == Fr(7, 4) * 2 ** 15
    lo, hi = -8, 5
    L, R = 110, 630
    X = logx(lo, hi, L, R)
    b = [hd(40, 46, "From the smallest step to the largest value, on a log scale")]
    for r, (name, Lm) in enumerate(rows):
        y = 72 + r * 64
        b.append(text(40, y + 17, name, "cap"))
        xs, xn, xm = X(float(Lm["min_sub"])), X(float(Lm["min_normal"])), X(float(Lm["max"]))
        b.append(rect(xs, y, xn - xs, 24, "m", rx=2))
        b.append(cell(xn, y, xm - xn, 24, "s", rx=2, label=f"{span[name]:.1f} powers of two in all"))
        b.append(text(xs, y + 40, fs(float(Lm["min_sub"]), 3), "sub2", "start"))
        b.append(text(xm, y + 40, fi(Lm["max"]) if Lm["max"] >= 1000 else f"{float(Lm['max']):g}", "sub2", "end"))
    Y = 72 + 3 * 64 + 6
    b.append(decades(X, lo, hi, Y, every=2))
    body, y = prose(Y + 56, [
        "The amber stretch at the left of each bar is the subnormal tail of {{fig:v04-p04}}; the teal is "
        "the normal range. E5M2 keeps FP16's five exponent bits, so it reaches almost as far, to 57,344, "
        "with two mantissa bits instead of ten. E4M3 trades an exponent bit for a mantissa bit and covers "
        f"{span['E4M3']:.1f} powers of two instead of {span['E5M2']:.1f}.",
        "E4M3 also bends the rules of {{fig:v04-o014}}. Under them its top exponent code would be "
        f"reserved and the largest value would be {fi(ieee_max)}. E4M3 keeps that code for numbers, "
        "reserves only the one pattern S.1111.111 for not-a-number and has no infinity, which lifts its "
        "top to " + nb("1.75 × 2⁸ = 448") + ".",
        "That is the bending {{fig:v04-o015}} mentions. Forward-pass weights and activations fit "
        "E4M3's window once a scale slides them into it; gradients spread over far more powers of two "
        "and need E5M2.",
    ])
    b.append(body)
    emit("p07", st("for the wider range that"), "How far each eight-bit float reaches", y + 26, b,
         "Same eight bits, two answers. E5M2 buys fourteen more powers of two of reach with one mantissa "
         "bit: wherever both formats hold normal numbers, its steps are twice as wide.")


# ---- o031: FP16's window, moved to where the video returns to it ----------------------------------------
def o031():
    Lm = limits("FP16")
    mn, mx = Lm["min_normal"], Lm["max"]
    assert mn == Fr(1, 2 ** 14) and mx == (2 - Fr(1, 1024)) * 2 ** 15 == 65504
    b = [hd(40, 46, "FP16 has five exponent bits, so its bias is 15")]
    b.append(box(60, 70, 260, 42, "s", "smallest normal = 2¹⁻¹⁵ = 2⁻¹⁴"))
    b.append(box(360, 70, 260, 42, "s", "largest = (2 − 2⁻¹⁰) × 2¹⁵"))
    b.append(box(60, 128, 260, 42, "m", f"= {float(mn):.6f}…, or {fs(float(mn), 2)}"))
    b.append(box(360, 128, 260, 42, "m", f"= {fi(mx)}"))
    body, y = prose(214, [
        "Those two numbers are exactly the window usually quoted for FP16: about six times ten to the "
        "minus five, up to about sixty-five thousand.",
        "They are not measured or looked up. They fall straight out of the bias arithmetic: five "
        "exponent bits, two reserved codes, bias 15. Below the bottom of the window the subnormals carry "
        "on down to 6 × 10⁻⁸, losing bits as they go ({{fig:v04-p04}}).",
        "Change the bias and you move the window. That is all an exponent field ever does.",
    ])
    b.append(body)
    emit("o031", st("Back to the two 16"), "Where the familiar FP16 numbers come from", y + 26, b,
         "A satisfying close: the range figures everyone quotes for a format are a direct consequence of "
         "how many exponent bits it has and where the bias puts them.")


# ---- o033: FP4's real ticks against INT4's ----------------------------------------------------------------
def o033():
    fp4 = [float(x) for x in values("E2M1")]
    int4 = [k * 6 / 7 for k in range(8)]
    assert len(fp4) == len(int4) == 8 and fp4[-1] == int4[-1] == 6
    b = [hd(40, 46, "FP4: eight values crowd toward zero"), hd(370, 46, "INT4 scaled to 6: evenly spaced")]
    for (L, R, vals, labs) in [(50, 330, fp4, [0, 1, 2, 3, 4, 6]), (370, 640, int4, None)]:
        X = lambda t: L + t / 6 * (R - L)
        b.append(hline(L, R, 92))
        for t in vals:
            b.append(tick(X(t), 84, 100))
        if labs:
            for t in labs:
                b.append(text(X(t), 120, f"{t:g}", "sub2", "middle"))
        else:
            b.append(text(X(0), 120, "0", "sub2", "middle"))
            b.append(text(X(6), 120, "6", "sub2", "middle"))
            b.append(text(X(3), 120, "steps of 6/7", "sub2", "middle"))
    body, y = prose(166, [
        "Both rulers have eight values from 0 to 6. The float spends them near zero, in steps of 0.5 "
        "that grow to 2; the integer spaces them evenly, " + nb("6/7 ≈ 0.86") + " apart.",
        "Integers carry no per-value exponent. Every step is the same size, and the position on the "
        "real number line comes from one scale factor shared across a whole group of values.",
        "That is simple and fast in silicon, and it is exactly what breaks on wide-ranging data.",
    ])
    b.append(body)
    emit("o033", "3:36", "Integers give up the per-value exponent", y + 26, b,
         "The exponent moves out of the number and becomes a property of the group. Everything that "
         "follows about outliers is a consequence of that move.")


# ---- p08: quantizing five numbers by hand ----------------------------------------------------------------
def p08():
    xs = [0.12, -0.5, 0.33, 0.9, -0.07]
    s, q, xh = quant_sym(xs, 8)
    err = [a - x for a, x in zip(xh, xs)]
    assert q == [17, -71, 47, 127, -10] and all(abs(e) <= s / 2 for e in err)
    assert format(-71 & 0xFF, "08b") == "10111001" and -128 + 32 + 16 + 8 + 1 == -71
    b = [hd(40, 46, "Five values, one INT8 scale: s = 0.9 ÷ 127 = " + f(s, 5))]
    cols = [40, 150, 280, 400, 540]
    heads = ["value x", "x ÷ s", "round: q", "back: s × q", "error"]
    for c, h in zip(cols, heads):
        b.append(text(c, 84, h, "sub2"))
    for r, (x, qq, a, e) in enumerate(zip(xs, q, xh, err)):
        y = 96 + r * 34
        b.append(text(cols[0], y + 19, f(x, 2), "cap"))
        b.append(text(cols[1], y + 19, f(x / s, 2), "sub2"))
        b.append(cell(cols[2], y, 60, 26, "m", label=str(qq).replace("-", MINUS)))
        b.append(text(cols[3], y + 19, f(a, 4), "sub2"))
        b.append(text(cols[4], y + 19, ("+" if e > 0 else "") + f(e, 4) if abs(e) > 1e-12 else "0", "sub2"))
    yb = 96 + 5 * 34 + 16
    b.append(text(40, yb, f"every error is at most half a step: s ÷ 2 = {f(s / 2, 5)}", "sub2"))
    body, y = prose(yb + 40, [
        "The largest magnitude, 0.9, sets the scale: it must land on the top code, 127. Every value is "
        "divided by the scale, rounded to the nearest whole number, and stored as that integer. Reading "
        "it back multiplies by the scale again, and the difference is the rounding error, never more "
        "than half a step.",
        "Two's complement gives INT8 the codes −128 to 127 ({{fig:v04-p03}}); −71 is stored as 10111001, "
        "that is " + nb("−128 + 32 + 16 + 8 + 1") + ". Symmetric quantization leaves −128 unused so that "
        "the grid is the same on both sides of zero. The scale itself is one FP16 or FP32 number stored "
        "beside the group.",
    ])
    b.append(body)
    emit("p08", "3:44", "Quantizing five numbers by hand", y + 26, b,
         "Divide, round, store; multiply to read back. The error is bounded by the step, and the step is "
         "set by one number: the group's largest value.")


# ---- p09: the zero-point -----------------------------------------------------------------------------------
def p09():
    lo_x, hi_x = -1.0, 6.5
    s_sym = hi_x / 7
    used = list(range(round(lo_x / s_sym), round(hi_x / s_sym) + 1))
    assert used == list(range(-1, 8)) and len(used) == 9
    s, z, q, xh = quant_asym([lo_x, 0.0, hi_x, 7.2, 2.3], 4, lo_x, hi_x)
    assert (s, z) == (0.5, 2) and q == [0, 2, 15, 15, 7] and xh[3] == 6.5 and xh[4] == 2.5
    ratio = s_sym / s
    assert round(ratio, 2) == 1.86
    b = [hd(40, 46, "Data from −1 to 6.5, stored in INT4 two ways")]
    L, R = 90, 620
    X = lambda t: L + (t - (-7.5)) / (8 - (-7.5)) * (R - L)

    def panel(y, title, codes, val_of, cls_used, note):
        out = [text(40, y - 26, title, "sub2")]
        out.append(rect(X(lo_x), y - 14, X(hi_x) - X(lo_x), 8, "m", rx=2))
        out.append(hline(L, R, y))
        for c in codes:
            v = val_of(c)
            if -7.5 <= v <= 8:
                used_c = lo_x - 1e-9 <= v <= hi_x + 1e-9
                out.append(tick(X(v), y - (6 if used_c else 3), y + (6 if used_c else 3)))
        out.append(text(40, y + 4, note, "cap"))
        return "".join(out)

    yA, yB = 120, 220
    b.append(panel(yA, f"Symmetric, codes −7 to 7, step 6.5 ÷ 7 = {f(s_sym, 3)}: codes −7 to −2 never used",
                   range(-7, 8), lambda c: c * s_sym, "s", ""))
    b.append(panel(yB, f"Zero-point, codes 0 to 15, step 7.5 ÷ 15 = {f(s, 1)}, zero-point z = {z}",
                   range(0, 16), lambda c: s * (c - z), "s", ""))
    for v in (0, 6.5):
        b.append(text(X(v), yA + 22, f"{v:g}", "sub2", "middle"))
    b.append(text(X(-1), yB + 22, "code 0", "sub2", "middle"))
    b.append(text(X(0), yB + 38, "code 2 = 0", "sub2", "middle"))
    b.append(text(X(6.5), yB + 22, "code 15", "sub2", "middle"))
    b.append(text(X(-1), yA + 22, MINUS + "1", "sub2", "middle"))
    b.append(eq(60, 278, 270, f"q  =  round(x ÷ s)  +  z", "m"))
    b.append(eq(350, 278, 270, f"read back  =  s  ×  (q  −  z)", "u"))
    body, y = prose(370, [
        f"A symmetric grid is centred on zero, so data that leans to one side leaves part of it empty: "
        f"here only {len(used)} of the 15 codes are ever used. A zero-point, an integer z stored with the "
        "scale, slides the grid so its 16 codes span exactly the data: real 0 lands on code 2, −1 on "
        f"code 0, 6.5 on code 15, and the step is {f(ratio, 2)} times finer.",
        "Values outside the span are clamped: 7.2 gives round(14.4) + 2 = 16, past the last code, so it "
        "is stored as 15 and read back as 6.5. That is what clamped means in {{fig:v04-o034}}. The price "
        "is a second number per group and one subtraction on every read.",
    ])
    b.append(body)
    emit("p09", "3:44", "A zero-point slides the grid to where the data is", y + 26, b,
         "Symmetric scales suit data centred on zero, such as weights. When the data leans to one side, "
         "the zero-point buys back the codes a symmetric grid would leave empty.")


# ---- p10: the outlier's price ------------------------------------------------------------------------------
def p10():
    x = 0.37
    rows = []
    for mx in (1, 100):
        s = mx / 127
        q = round(x / s)
        rows.append((mx, s, q, q * s))
    (m1, s1, q1, a1), (m2, s2, q2, a2) = rows
    assert (q1, round(a1, 4), q2, a2) == (47, 0.3701, 0, 0.0)
    assert round(100 * (s1 / 2), 2) == 0.39 and round(100 * (s2 / 2)) == 39
    b = [hd(40, 46, "The same value, 0.37, in two INT8 groups, zoomed to 0 to 1")]
    L, R = 100, 620
    X = lambda t: L + t * (R - L)
    for k, (mx, s, q, a) in enumerate(rows):
        y = 112 + k * 112
        b.append(text(40, y - 34, f"group's largest value {mx}: step {mx} ÷ 127 = {f(s, 4)}", "sub2"))
        b.append(hline(L, R, y))
        n = int(1 / s)
        for j in range(n + 1):
            b.append(f'<line class="tick" x1="{X(j * s):.2f}" y1="{y - 6}" x2="{X(j * s):.2f}" y2="{y + 6}" '
                     f'stroke-width="{0.6 if n > 20 else 1}"/>')
        b.append(text(L, y + 22, "0", "sub2", "middle"))
        b.append(text(R, y + 22, "1", "sub2", "middle"))
        b.append(dot(X(x), y, 5, "h" if q == 0 else "s"))
        b.append(text(X(x), y - 14, "0.37", "sub2", "middle"))
        land = f"stored as code {q}, read back as {f(a, 4)}"
        land += "  (error " + (f(abs(a - x), 4) if q else "0.37, all of it") + ")"
        b.append(text(X(x), y + 44, land, "sub2", "middle"))
    body, y = prose(112 + 112 + 80, [
        f"In the first group the step is {f(s1, 4)}, so 0.37 is stored as code 47 and read back as "
        f"{f(a1, 4)}; the worst error any member can suffer is half a step, {pct(s1 / 2 / 1, 2)} of a "
        f"value near 1. Put one value of 100 in the group and the step becomes {f(s2, 3)}: 0.37 is "
        "stored as code 0, and the worst error on a value near 1 is " + pct(s2 / 2, 0) + ".",
        "A float's error is a fixed fraction of the value, because its gaps grow with the number. An "
        "integer's is a fixed half-step for every member of the group, set by the largest one. That is "
        "why a shared scale punishes the small values, and why the outlier never pays its own price.",
    ])
    b.append(body)
    emit("p10", st("One outlier stretches the"), "The outlier's price is paid by every ordinary value",
         y + 26, b,
         "Same value, same eight bits, a hundred times the worst-case error, decided entirely by a "
         "neighbour. Every outlier method later in this atlas is an attempt to stop this.")


def pct(v, d=1):
    return f(100 * v, d) + "%"


# ---- p11: a gradient is a slope ------------------------------------------------------------------------------
LOSS = lambda w: 0.5 * (w - 2) ** 2 + 0.5            # schematic: one weight's loss curve


def p11():
    w0, lr = 3.5, 0.1
    slope = w0 - 2                                     # the slope of 0.5 (w - 2)^2 + 0.5 at w0
    step = -lr * slope
    assert slope == 1.5 and round(step, 2) == -0.15
    rise = LOSS(w0 + 0.001) - LOSS(w0)
    assert round(rise / 0.001, 2) == 1.5
    L, R, T, B = 80, 380, 70, 250                     # plot box; w from 0 to 4.5, loss from 0 to 4
    WX = lambda w: L + w / 4.5 * (R - L)
    LY = lambda l: B - l / 4 * (B - T)
    b = [hd(40, 46, "One weight's loss curve, schematic")]
    b.append(ln(L, B, R, B, "axis"))
    b.append(ln(L, T, L, B, "axis"))
    b.append(poly([(WX(w), LY(LOSS(w))) for w in [i / 20 for i in range(0, 91)] if LOSS(w) <= 4.05]))
    # tangent at w0
    t0, t1 = w0 - 1.0, w0 + 0.7
    b.append(f'<line class="pl-h" x1="{WX(t0):.1f}" y1="{LY(LOSS(w0) + slope * (t0 - w0)):.1f}" '
             f'x2="{WX(t1):.1f}" y2="{LY(LOSS(w0) + slope * (t1 - w0)):.1f}" stroke-dasharray="5 4"/>')
    b.append(dot(WX(w0), LY(LOSS(w0)), 4.5, "h"))
    b.append(text(WX(w0) + 10, LY(LOSS(w0)) + 18, f"slope {f(slope, 1)}", "sub2 halo"))
    b.append(dot(WX(2), LY(LOSS(2)), 4, "s"))
    b.append(text(WX(2), LY(LOSS(2)) - 12, "slope 0", "sub2 halo", "middle"))
    b.append(text((L + R) / 2, B + 22, "the weight's value", "sub2", "middle"))
    b.append(text(L - 8, T + 4, "loss", "sub2", "end"))
    # the update, worked
    xr = 420
    b.append(text(xr, 92, "the training step", "hd"))
    lines = [f"slope here = {f(slope, 1)}", "(loss rises 1.5 times as fast as w)",
             f"w  ←  w − learning rate × slope", f"3.5  ←  3.5 − 0.1 × 1.5 = {f(w0 + step, 2)}",
             "", "if the slope is stored as 0:", "3.5  ←  3.5 − 0.1 × 0 = 3.5", "the weight never moves"]
    for k, s in enumerate(lines):
        if s:
            b.append(text(xr, 120 + k * 20, s, "sub2"))
    body, y = prose(B + 60, [
        "Training measures how wrong the model is with one number, the loss, and asks of every weight: "
        "if this weight grew a little, would the loss rise or fall, and how fast? That rate is the slope "
        "of the loss curve at the weight's current value, the steepness of the line that just touches "
        "it. A slope of 1.5 means the loss rises about 1.5 times as fast as the weight grows.",
        "The gradient is that slope, one per weight. Each training step moves every weight a little "
        "downhill, by the learning rate times its slope, and at the bottom of the curve the slope is 0 "
        "and the weight stays put. That is why a gradient rounded to zero is a disaster: the weight "
        "stops learning while it is still far from the bottom.",
    ])
    b.append(body)
    emit("p11", st("In a deep network, gradients slip below"), "A gradient is a slope, and a zero slope teaches nothing",
         y + 26, b,
         "The curve is schematic; the arithmetic of the step is exact. Everything training does is this "
         "step, for billions of weights at once, which is why the slopes have to survive being stored.")


# ---- o036: FP16's floor, corrected ------------------------------------------------------------------------------
def o036():
    Lm = limits("FP16")
    zero_below = float(Lm["min_sub"]) / 2
    lo, hi = -10, 5
    L, R, Y = 60, 620, 208
    X = logx(lo, hi, L, R)
    b = [hd(40, 46, "Gradient sizes (schematic) against FP16, on a log scale")]
    # a bell of gradient sizes on the log axis, centred near 10^-6
    centre, width = -6.0, 1.6
    edges = [lo + 0.5 * k for k in range(0, 2 * (hi - lo) + 1)]
    for a, c in zip(edges, edges[1:]):
        m = (a + c) / 2
        h = 70 * math.exp(-0.5 * ((m - centre) / width) ** 2)
        if h >= 3:
            band = "h" if 10 ** c <= zero_below * 1.0001 or 10 ** m < zero_below else \
                   "m" if 10 ** m < float(Lm["min_normal"]) else "s"
            b.append(rect(X(10 ** a) + 1, Y - 60 - h, X(10 ** c) - X(10 ** a) - 2, h, band, rx=1))
    xs0, xs1, xs2 = X(zero_below), X(float(Lm["min_normal"])), X(float(Lm["max"]))
    b.append(rect(L, Y - 46, xs0 - L, 16, "h", rx=2))
    b.append(rect(xs0, Y - 46, xs1 - xs0, 16, "m", rx=2))
    b.append(rect(xs1, Y - 46, xs2 - xs1, 16, "s", rx=2))
    b.append(decades(X, lo, hi, Y, every=2))
    b.append(text(xs0, Y + 40, "3 × 10⁻⁸", "sub2", "middle"))
    b.append(text(xs1, Y + 40, "6 × 10⁻⁵", "sub2", "middle"))
    b.append(text(xs2, Y + 40, "65,504", "sub2", "middle"))
    body, y = prose(Y + 82, [
        "The bars are how many gradients have each size, and the strip beneath is what FP16 does with "
        "them. In a deep network many gradients are tiny. Those below about 3 × 10⁻⁸ round to exactly "
        "zero, and a zero gradient teaches the model nothing ({{fig:v04-p11}}). Those up to 6 × 10⁻⁵ "
        "survive only as subnormals, with a few bits each ({{fig:v04-p04}}).",
        "Measured: training an SSD object detector in FP16, Micikevicius and colleagues found many "
        "activation gradients below FP16's range. They became zeros and training diverged, while most "
        "of FP16's range above them went unused.",
        "This is a range failure, not a precision failure. FP16 has the finer mantissa and still loses.",
    ])
    b.append(body)
    emit("o036", st("underflow to exactly zero"), "FP16's floor, and what falls through it", y + 26, b,
         "A concrete demonstration that more mantissa bits cannot compensate for too few exponent bits.")


# ---- o037: loss scaling ---------------------------------------------------------------------------------------
def o037():
    S, w0 = 3, 3.0
    g = w0 - 2                                          # slope of LOSS at w0
    assert g == 1 and (LOSS(w0 + 1e-6) * S - LOSS(w0) * S) / 1e-6 - S * g < 1e-4
    b = [hd(40, 46, "Multiply the loss by S and every slope is multiplied by S")]
    L, R, T, B = 80, 380, 66, 236
    WX = lambda w: L + w / 4.5 * (R - L)
    LY = lambda l: B - l / 6 * (B - T)
    b.append(ln(L, B, R, B, "axis"))
    b.append(ln(L, T, L, B, "axis"))
    for k, (sc, cls) in enumerate([(1, "pl-m"), (S, "pl-h")]):
        pts = [(WX(w), LY(sc * LOSS(w))) for w in [i / 40 for i in range(0, 181)] if sc * LOSS(w) <= 6.05]
        b.append(poly(pts, cls))
        t0, t1 = w0 - 0.45, w0 + 0.45                   # the tangent: slope sc * g
        b.append(f'<line class="tick" x1="{WX(t0):.1f}" y1="{LY(sc * LOSS(w0) + sc * g * (t0 - w0)):.1f}" '
                 f'x2="{WX(t1):.1f}" y2="{LY(sc * LOSS(w0) + sc * g * (t1 - w0)):.1f}" stroke-dasharray="4 3"/>')
        b.append(dot(WX(w0), LY(sc * LOSS(w0)), 4, "m" if sc == 1 else "h"))
    b.append(text(WX(w0) + 10, LY(LOSS(w0)) + 16, f"loss: slope {g:g}", "sub2 halo"))
    b.append(text(WX(w0) - 10, LY(S * LOSS(w0)) - 8, f"{S} × loss: slope {S * g:g}", "sub2 halo", "end"))
    b.append(text((L + R) / 2, B + 22, "the weight's value", "sub2", "middle"))
    xr = 420
    b.append(text(xr, 92, "the three steps", "hd"))
    steps = ["1  multiply the loss by S", "2  every gradient comes out S times", "    larger, above FP16's floor",
             "3  divide by S, in FP32, before", "    the update: the step is unchanged"]
    for k, s in enumerate(steps):
        b.append(text(xr, 120 + k * 22, s, "sub2"))
    body, y = prose(B + 60, [
        "Stretching a curve upwards by a factor S stretches its slope at every point by the same factor: "
        "if the loss rose 0.003 for a 0.001 step in a weight, S times the loss rises " + nb("S × 0.003") + ". So "
        "scaling the loss scales every gradient in the network at once, lifting the tiny ones above the "
        "floor of {{fig:v04-o036}}. Dividing by S again before the update leaves each step exactly as "
        "it would have been.",
        "The catch is choosing S. Too small and gradients still underflow; too large and the biggest "
        "overflow FP16's 65,504. The paper that introduced loss scaling suggested setting it "
        "automatically: raise it while nothing overflows, cut it and skip the step when something does.",
    ])
    b.append(body)
    emit("o037", st("gets around this with loss scaling"), "Loss scaling", y + 26, b,
         "Reads as a hack because it is one. BF16 exists so this step can be deleted.")


# ---- p12: loss scaling, followed through one gradient -----------------------------------------------------------
def p12():
    g, S = 1e-8, 2 ** 16
    a = float(np.float16(g))
    gs = g * S
    h = float(np.float16(gs))
    back = float(np.float32(h) / np.float32(S))
    err = abs(back - g) / g
    assert a == 0 and h == float(round_to(gs, "FP16")) and round(h, 8) == 0.00065517
    assert round(err * 100, 2) == 0.03 and S == 65536
    lo, hi = -9, -2
    L, R, Y = 60, 620, 150
    X = logx(lo, hi, L, R)
    Lm = limits("FP16")
    z0, mn = float(Lm["min_sub"]) / 2, float(Lm["min_normal"])
    b = [hd(40, 46, "One gradient of 10⁻⁸, on a log scale, with FP16's bands beneath")]
    b.append(rect(L, Y + 30, X(z0) - L, 12, "h", rx=2))
    b.append(rect(X(z0), Y + 30, X(mn) - X(z0), 12, "m", rx=2))
    b.append(rect(X(mn), Y + 30, R - X(mn), 12, "s", rx=2))
    b.append(text((L + X(z0)) / 2, Y + 60, "becomes 0", "sub2", "middle"))
    b.append(text((X(mn) + R) / 2, Y + 60, "normal", "sub2", "middle"))
    b.append(text((X(z0) + X(mn)) / 2, Y + 60, "subnormal", "sub2", "middle"))
    b.append(hline(L, R, Y))
    for e in range(lo, hi + 1):
        b.append(tick(X(10.0 ** e), Y - 5, Y + 5))
        b.append(text(X(10.0 ** e), Y + 20, "10" + sup(e), "sub2", "middle"))
    b.append(dot(X(g), Y, 5, "h"))
    b.append(dot(X(h), Y, 5, "s"))
    b.append(arr(X(g) + 8, Y - 34, X(h) - 8, Y - 34))
    b.append(text((X(g) + X(h)) / 2, Y - 44, "× 65,536 = 2¹⁶, before the backward pass", "sub2", "middle"))
    b.append(text(X(h), Y - 14, "6.55 × 10⁻⁴", "sub2", "middle"))
    ty = Y + 100
    rows = [("the gradient", fs(g, 2), "FP16 stores 0"),
            ("× 65,536", f"{gs * 1e4:.4f} × 10⁻⁴", f"FP16 stores {h * 1e4:.4f} × 10⁻⁴"),
            ("÷ 65,536, in FP32", f"{back * 1e9:.3f} × 10⁻⁹", f"{pct(err, 2)} off the true value")]
    for k, (a1, a2, a3) in enumerate(rows):
        y = ty + k * 24
        b.append(text(40, y, a1, "cap"))
        b.append(text(220, y, a2, "sub2"))
        b.append(text(400, y, a3, "sub2"))
    body, y = prose(ty + 3 * 24 + 22, [
        "Unscaled, this gradient is below half of FP16's smallest step and is stored as zero. Scaled by "
        "65,536 it lands among FP16's normal numbers and keeps all eleven of its significant bits. "
        "Multiplying by a power of two only shifts the exponent, so the one rounding is FP16's own, at "
        "the new size; dividing back out in FP32 recovers the gradient to within " + pct(err, 2) + ".",
        "The scale must not push the largest gradient past 65,504, which is why it is chosen against "
        "the biggest values as well as the smallest.",
    ])
    b.append(body)
    emit("p12", st("Then divide it back out"), "Loss scaling, followed through one gradient", y + 26, b,
         "From zero to within three hundredths of a percent, by multiplying by a constant and dividing it "
         "back out. The information was never lost to precision, only to range.")


if __name__ == "__main__":
    for fn in (p06, p07, o031, o033, p08, p09, p10, p11, o036, o037, p12):
        fn()
