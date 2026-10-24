"""V4 Part 2, the binary floor: review entries 1-5 (p01-p05), the FP16 bit-flipper widget (p02w, in
part2_flip.py), and the fixes to Figs 10, 18, 22, 24 and the merge of Figs 26 and 27.

  p01  base two is place value          p02  bits after the point
  p03  two's complement                 p04  subnormals: FP16's real floor
  p05  ties go to the even neighbour
  o018 regenerated with hex explained   o024 histogram over FP8's ticks
  o026 FP32 baseline, merged with o027

  python3 figures/V04/src/part2.py
"""
import math, struct
from fractions import Fraction as Fr
import numpy as np
from common import (emit, txt, hd, cell, box, ln, arr, prose, text, tick, hline, dot, rect, f, fi, fs, sup,
                    MINUS, st, nb)
from numfmt import values, limits, round_to, bias

# ---- shared drawing: a row of bits under their place values ----------------------------------------
CW, GAP = 40, 5


def places(x0, y, heads, cls="sub2", point_after=None):
    """Place-value headings centred over the columns that place_row draws."""
    out = []
    for k, h in enumerate(heads):
        x = col_x(x0, k, point_after)
        out.append(text(x + CW / 2, y, h, cls, "middle"))
    return "".join(out)


def col_x(x0, k, point_after=None):
    extra = 14 if point_after is not None and k > point_after else 0
    return x0 + k * (CW + GAP) + extra


def place_row(x0, y, bits, point_after=None, h=30, cls_one="m"):
    out = []
    for k, b in enumerate(bits):
        out.append(cell(col_x(x0, k, point_after), y, CW, h, cls_one if b == "1" else "u", label=b))
    if point_after is not None:
        xp = col_x(x0, point_after) + CW + GAP / 2 + 7
        out.append(text(xp, y + h - 6, ".", "hd", "middle"))
    return "".join(out)


def end_x(x0, n, point_after=None):
    return col_x(x0, n - 1, point_after) + CW


# ---- p01: base two -----------------------------------------------------------------------------------
def p01():
    heads = [str(2 ** k) for k in range(7, -1, -1)]
    rows = ["00000110", "10000001", "11111111"]
    vals = [int(r, 2) for r in rows]
    assert vals == [6, 129, 255] and 2 ** 8 == 256 and 2 ** 5 == 32
    terms = [[2 ** (7 - k) for k, b in enumerate(r) if b == "1"] for r in rows]
    assert [sum(t) for t in terms] == vals
    b = [hd(40, 46, "Each place is worth twice the one to its right")]
    X0 = 120
    b.append(text(40, 84, "place value", "cap"))
    b.append(places(X0, 84, heads))
    sums = ["4 + 2  =  6", "128 + 1  =  129", "all of them  =  255"]
    for r, (bits, s) in enumerate(zip(rows, sums)):
        y = 100 + r * 44
        b.append(place_row(X0, y, bits))
        b.append(text(end_x(X0, 8) + 18, y + 20, s, "sub2"))
    word = "0011100000000000"
    wv = int(word, 2)
    wt = [2 ** (15 - k) for k, c in enumerate(word) if c == "1"]
    assert wv == 14336 == sum(wt) and np.float16(0.5).view(np.uint16) == wv
    body, y = prose(268, [
        "Base ten gives each digit a place worth ten times the one to its right: 6,022 is 6 thousands, "
        "no hundreds, 2 tens and 2 ones. Base two works the same way with only two digits, 0 and 1, "
        "and places worth 1, 2, 4, 8 and so on ({{fig:v01-p06}} counts eight of them). To read a binary "
        "number, add up the places that hold a 1.",
        "Each extra bit doubles the number of patterns, so n bits give 2ⁿ of them: eight bits count "
        "from 0 to 255, and five, the size of FP16's exponent field, from 0 to 31. All ones is always "
        "one less than the next place up: 11111111 is 256 − 1. The middle row is the exponent field "
        "that {{fig:v04-o018}} decodes.",
        f"A whole 16-bit word reads the same way, with places up to 32,768: {word} is "
        f"{' + '.join(fi(t) for t in wt)} = {fi(wv)}. That is how {{{{fig:v04-o013}}}} turns a float's "
        "bits into one ordinary integer.",
    ])
    b.append(body)
    emit("p01", st("with what a number's bits actually do"), "Base two counts in powers of two", y + 26, b,
         "Nothing about binary is stranger than this. Every exponent field, integer code and stored word "
         "later in this atlas is read by adding up the places that hold a 1.")


# ---- p02: binary fractions ----------------------------------------------------------------------------
def p02():
    heads = ["4", "2", "1", "½", "¼", "⅛"]
    rows = [("110100", 2, "4 + 2 + ½  =  6.5"), ("001101", 2, "1 + ½ + ⅛  =  1.625")]
    assert 4 + 2 + Fr(1, 2) == Fr(13, 2) and 1 + Fr(1, 2) + Fr(1, 8) == Fr(13, 8)
    b = [hd(40, 46, "6.5 and its significand 1.625, written in base two place by place")]
    X0 = 150
    b.append(text(40, 84, "place value", "cap"))
    b.append(places(X0, 84, heads, point_after=2))
    for r, (bits, pa, s) in enumerate(rows):
        y = 100 + r * 44
        b.append(place_row(X0, y, bits, point_after=pa))
        b.append(text(end_x(X0, 6, 2) + 18, y + 20, s, "sub2"))
    b.append(text(40, 120, "110.1", "sub2"))
    b.append(text(40, 164, "1.101", "sub2"))
    # number line 0..2 in eighths, with 1.625 marked
    L, R, Y = 150, 590, 232
    X = lambda v: L + v / 2 * (R - L)
    b.append(hline(L, R, Y))
    for k in range(17):
        v = k / 8
        major = k % 4 == 0
        b.append(tick(X(v), Y - (7 if major else 4), Y + (7 if major else 4)))
    for v, lab in [(0, "0"), (0.5, "½"), (1, "1"), (1.5, "1½"), (2, "2")]:
        b.append(text(X(v), Y + 24, lab, "sub2", "middle"))
    b.append(dot(X(1.625), Y, 5, "m"))
    b.append(text(X(1.625), Y - 14, "1.101 = 1.625", "sub2", "middle"))
    b.append(text(40, Y + 4, "eighths, 0 to 2", "cap"))
    # 0.1 in binary
    x, digs = Fr(1, 10), ""
    for _ in range(16):
        x *= 2
        digs += str(int(x))
        x -= int(x)
    assert digs.startswith("0001100110011001")
    f32, f16 = float(np.float32(0.1)), float(np.float16(0.1))
    assert repr(f32) == "0.10000000149011612" and f16 == 0.0999755859375
    body, y = prose(Y + 64, [
        "To the right of the point the places keep halving: ½, ¼, ⅛ and so on. So 110.1 is "
        + nb("4 + 2 + ½ = 6.5") + ", and 1.101 is " + nb("1 + ½ + ⅛ = 1.625") + ". Both reappear when "
        "{{fig:v04-o017}} encodes 6.5. "
        "Each extra bit halves the step, which is why every mantissa bit is worth exactly one halving "
        "of the gap ({{fig:v04-o020}}).",
        f"Some short decimals never end in binary. One tenth is 0.{digs}… with 0011 repeating for "
        f"ever, so a float can only keep its first few bits. FP32 stores 0.1 as {f32:.15f}…, and "
        f"FP16 as {f16}.",
    ])
    b.append(body)
    emit("p02", st("with what a number's bits actually do"),
         "Bits after the point are halves, quarters and eighths", y + 26, b,
         "Every format rounds, even on a number as plain as 0.1. A format does not choose whether to "
         "be exact; its bit count only sets how large the rounding is.")


# ---- p03: two's complement ----------------------------------------------------------------------------
def p03():
    heads = ["−16", "8", "4", "2", "1"]
    tc = lambda s: -16 * int(s[0]) + int(s[1:], 2)
    rows = [("00110", "4 + 2  =  6"), ("11111", "−16 + 8 + 4 + 2 + 1  =  −1"),
            ("10110", "−16 + 4 + 2  =  −10"), ("10000", "−16")]
    want = [6, -1, -10, -16]
    assert [tc(r) for r, _ in rows] == want
    assert all(format(v & 31, "05b") == r for (r, _), v in zip(rows, want))
    assert format(int("11111", 2) + int("00001", 2), "06b") == "100000"
    b = [hd(40, 46, "Five bits, with the top place worth −16 instead of +16")]
    X0 = 150
    b.append(text(40, 84, "place value", "cap"))
    b.append(places(X0, 84, heads))
    for r, (bits, s) in enumerate(rows):
        y = 100 + r * 42
        b.append(place_row(X0, y, bits, cls_one="m"))
        b.append(text(end_x(X0, 5) + 18, y + 20, s, "sub2"))
    # the number line of all 32 codes
    L, R, Y = 60, 620, 314
    X = lambda v: L + (v + 16) / 31 * (R - L)
    b.append(hline(L, R, Y))
    for v in range(-16, 16):
        b.append(tick(X(v), Y - (7 if v in (-16, -1, 0, 15) else 4), Y + (7 if v in (-16, -1, 0, 15) else 4)))
    for v, anc, dx in ((-16, "start", -4), (-1, "end", 4), (0, "start", -4), (15, "end", 4)):
        b.append(text(X(v) + dx, Y - 16, format(v & 31, "05b") + " = " + str(v).replace("-", MINUS), "sub2", anc))
    b.append(text(X(-8.5), Y + 24, "top bit 1: negative", "sub2", "middle"))
    b.append(text(X(7.5), Y + 24, "top bit 0: zero and positive", "sub2", "middle"))
    body, y = prose(Y + 70, [
        "Give the top place a negative value and the same five bits count from −16 to 15. This is two's "
        "complement, the way chips store signed integers. With n bits the range is −2ⁿ⁻¹ to "
        + nb("2ⁿ⁻¹ − 1") + ": "
        "INT8 runs from −128 to 127, and INT4 from −8 to 7.",
        "It won because ordinary binary addition still works. " + nb("11111 + 00001") + " is 100000; drop the carry "
        "out of the fifth place and 00000 is left, so −1 + 1 = 0 with no special rules.",
        "The cost shows when the bits are read as a plain count: every negative number starts with a 1, "
        "so −1 looks like 31, the largest pattern of all. {{fig:v04-o013}} shows what that does to a "
        "float.",
    ])
    b.append(body)
    emit("p03", "1:12", "Negative integers: the top bit counts as minus", y + 26, b,
         "Two's complement gets signed arithmetic for free, at the price of negative numbers that look "
         "enormous when read as unsigned. Integers pay that price happily; exponent fields do not.")


# ---- p04: subnormals ------------------------------------------------------------------------------------
def p04():
    E = 5
    mn, sub = 2.0 ** (1 - bias(E)), 2.0 ** (1 - bias(E) - 10)
    zero_below = sub / 2
    L16 = limits("FP16")
    assert (mn, sub) == (float(L16["min_normal"]), float(L16["min_sub"])) == (2 ** -14, 2 ** -24)
    ex = [3e-5, 1e-6, 1e-7, 2.9e-8]
    stored = [float(np.float16(v)) for v in ex]
    err = [abs(s - v) / v for s, v in zip(stored, ex)]
    assert stored[3] == 0 and round(err[0] * 100, 2) == 0.06 and round(err[1] * 100, 1) == 1.3
    assert round(err[2] * 100) == 19 and mn / zero_below == 2048
    assert all(float(round_to(v, "FP16")) == s for v, s in zip(ex, stored))
    b = [hd(40, 46, "FP16 near zero, on a log scale: three bands")]
    L, R, Y = 60, 620, 136
    lo, hi = -9, -3
    X = lambda v: L + (math.log10(v) - lo) / (hi - lo) * (R - L)
    b.append(rect(L, Y - 40, X(zero_below) - L, 22, "h"))
    b.append(rect(X(zero_below), Y - 40, X(mn) - X(zero_below), 22, "m"))
    b.append(rect(X(mn), Y - 40, R - X(mn), 22, "s"))
    b.append(text((L + X(zero_below)) / 2, Y - 50, "becomes 0", "sub2", "middle"))
    b.append(text((X(zero_below) + X(mn)) / 2, Y - 50, "subnormal: fixed steps", "sub2", "middle"))
    b.append(text((X(mn) + R) / 2, Y - 50, "normal", "sub2", "middle"))
    b.append(hline(L, R, Y))
    for e in range(lo, hi + 1):
        b.append(tick(X(10.0 ** e), Y - 5, Y + 5))
        b.append(text(X(10.0 ** e), Y + 20, "10" + sup(e), "sub2", "middle"))
    for v, lab, dy in [(zero_below, "3.0 × 10⁻⁸", 38), (mn, "6.1 × 10⁻⁵", 38)]:
        b.append(text(X(v), Y + dy, lab, "sub2", "middle"))
    for v in ex:
        b.append(dot(X(v), Y, 3.5, "h" if v == ex[3] else "m"))
    # the table of examples
    ty = Y + 82
    cols = [40, 200, 360, 520]
    for c, s in zip(cols, ["value", "FP16 stores", "error", "steps of 6 × 10⁻⁸"]):
        b.append(text(c, ty, s, "sub2"))
    for k, (v, s, e) in enumerate(zip(ex, stored, err)):
        y = ty + 24 + k * 22
        b.append(text(cols[0], y, fs(v, 2), "cap"))
        b.append(text(cols[1], y, fs(s, 4) if s else "0", "sub2"))
        b.append(text(cols[2], y, (f(100 * e, 2 if e < 0.01 else 1) + "%") if s else "all of it", "sub2"))
        b.append(text(cols[3], y, f"{round(v / sub, 2):g}".replace("-", MINUS) + f" → {round(s / sub)}", "sub2"))
    body, y = prose(ty + 24 + 4 * 22 + 30, [
        "Exponent code 0 is the special one ({{fig:v04-o014}}). It turns the implied 1 into a 0 and holds "
        "the exponent at −14, so the values are 0.mantissa × 2⁻¹⁴: every whole multiple of 2⁻²⁴, about "
        f"{fs(sub, 3)}, up to the smallest normal number, {fs(mn, 3)}.",
        "Those steps stop shrinking. A value near 6 × 10⁻⁵ still has about a thousand steps beneath it; "
        "one near 10⁻⁷ has fewer than two, so its error is a fifth of its size. Below half a step, "
        f"2⁻²⁵ ≈ {fs(zero_below, 2)}, a value rounds to exactly zero. These are the subnormal numbers, "
        "and they make underflow gradual rather than sudden.",
    ])
    b.append(body)
    emit("p04", "1:12", "Below the smallest normal number, precision drains away before zero", y + 26, b,
         f"The window usually quoted for FP16 starts at 6 × 10⁻⁵, but exact zero arrives "
         f"{fi(mn / zero_below)} times lower. In between, a value survives with fewer and fewer of its "
         "bits.")


# ---- p05: ties to even ----------------------------------------------------------------------------------
def p05():
    vs = [v for v in values("E5M2") if 4 <= v <= 8]
    assert [float(v) for v in vs] == [4, 5, 6, 7, 8]
    mant = ["00", "01", "10", "11", "00"]
    ties = [Fr(9, 2), Fr(11, 2), Fr(13, 2), Fr(15, 2)]
    got = [round_to(t, "E5M2") for t in ties]
    assert [float(g) for g in got] == [4, 6, 6, 8]
    errs = [g - t for g, t in zip(got, ties)]
    assert sum(errs) == 0 and [float(e) for e in errs] == [-0.5, 0.5, -0.5, 0.5]
    b = [hd(40, 46, "E5M2 from 4 to 8: five values, and the four exact ties between them")]
    L, R, Y = 110, 590, 128
    X = lambda v: L + (float(v) - 4) / 4 * (R - L)
    b.append(hline(L, R, Y))
    for v, m in zip(vs, mant):
        b.append(tick(X(v), Y - 9, Y + 9))
        b.append(text(X(v), Y - 18, f"{float(v):g}", "sub2", "middle"))
        b.append(text(X(v), Y + 26, "mantissa " + m, "sub2", "middle"))
    b.append(text(40, Y + 4, "values", "cap"))
    for t, g in zip(ties, got):
        up = g > t
        b.append(dot(X(t), Y, 4, "h"))
        ya = Y + 52
        x1, x2 = X(t), X(g)
        b.append(arr(x1, ya, x2 + (-6 if up else 6), ya))
        b.append(text(x1, ya + 22, f"{float(t):g} → {float(g):g}", "sub2", "middle"))
    b.append(text(40, Y + 56, "ties", "cap"))
    body, y = prose(Y + 120, [
        "Round to nearest leaves one case open: a value exactly halfway between two neighbours. The rule "
        "floating-point hardware follows by default is to pick the neighbour whose last mantissa bit is "
        "0, the even one. So "
        "6.5 goes down to 6 (mantissa 10) rather than up to 7 (mantissa 11), while 5.5 goes up to 6.",
        "Across the four ties the errors are −½, +½, −½ and +½, which average to zero. Always rounding "
        "halves up would add +½ every time, and over millions of roundings that lean would build into a "
        "steady drift.",
    ])
    b.append(body)
    emit("p05", "1:24", "A tie goes to the even neighbour, so rounding has no lean", y + 26, b,
         "Rounding errors average to zero by design, not by luck. The argument for why a rounded network "
         "survives, a few figures on, leans on exactly this.")


# ---- o018: the complete decode, with hexadecimal explained ------------------------------------------------
def o018():
    word = struct.unpack(">I", struct.pack(">f", 6.5))[0]
    bits = format(word, "032b")
    s, e, m = bits[0], bits[1:9], bits[9:]
    assert (s, e, m) == ("0", "10000001", "10100000000000000000000") and f"{word:08X}" == "40D00000"
    ev = int(e, 2)
    sig = 1 + Fr(int(m, 2), 2 ** 23)
    assert ev == 129 and ev - 127 == 2 and sig == Fr(13, 8) and sig * 4 == Fr(13, 2)
    b = [hd(40, 46, "The 32 bits that FP32 uses for 6.5")]
    b.append(cell(40, 66, 60, 38, "u", rx=4, label=s))
    b.append(cell(106, 66, 190, 38, "h", rx=4, label=e))
    b.append(cell(302, 66, 318, 38, "s", rx=4, label=m))
    b.append(text(40, 124, "sign", "sub2"))
    b.append(text(106, 124, "exponent field", "sub2"))
    b.append(text(302, 124, "mantissa field", "sub2"))
    nib = [bits[k:k + 4] for k in range(0, 32, 4)]
    hexd = [f"{int(n, 2):X}" for n in nib]
    b.append(text(40, 158, "In hexadecimal each group of four bits is one digit, 0 to 9 then A to F for 10 to 15:", "sub2"))
    b.append(text(40, 178, "  ".join(nib[:4]) + "  …  reads  " + "  ".join(hexd[:4]) + "  …, so the word is written "
                  f"0x{word:08X}.", "sub2"))
    b.append(hd(40, 224, "Decode it"))
    steps = [("exponent field as an integer", f"{e} = 128 + 1 = {ev}", "u"),
             ("subtract the bias", f"{ev} − 127 = {ev - 127}", "m"),
             ("put the implied 1 back", "1.101 = 1 + ½ + ⅛ = 1.625", "m"),
             ("assemble", "+1 × 2² × 1.625 = 6.5", "s")]
    for k, (lab, val, c) in enumerate(steps):
        y = 244 + k * 52
        b.append(text(40, y + 26, lab, "sub2"))
        b.append(box(340, y, 280, 40, c, val))
        if k < 3:
            b.append(arr(480, y + 42, 480, y + 48))
    body, y = prose(244 + 4 * 52 + 26, [
        "Every floating-point number in every model you run is decoded by these four steps.",
    ])
    b.append(body)
    emit("o018", "1:12", "A complete decode, start to finish", y + 22, b,
         "The bias appears exactly once, as a single subtraction. That is the whole of its role at runtime.")


# ---- o024: the histogram laid over a float's ticks ----------------------------------------------------------
def o024():
    pos = [float(v) for v in values("E4M3")]          # the 127 non-negative E4M3 values, 0 to 448
    ticks = sorted(set([-v for v in pos] + pos))
    MAXV = 448.0
    L, R, Y = 50, 630, 176
    X = lambda v: (L + R) / 2 + v / MAXV * (R - L) / 2
    # a bell of weights, as trained weights typically are, its width set so the largest of ~4,000
    # sits near the top of the format (about 3.6 standard deviations)
    sigma = MAXV / 3.6
    nb, half = 29, MAXV
    edges = [-half + 2 * half * k / nb for k in range(nb + 1)]
    pdf = lambda x: math.exp(-0.5 * (x / sigma) ** 2)
    mids = [(a + c) / 2 for a, c in zip(edges, edges[1:])]
    hts = [pdf(m) for m in mids]
    b = [hd(40, 46, "Bars: how many weights have each value.  Ticks: every value FP8 E4M3 can hold")]
    for a, c, hgt in zip(edges, edges[1:], hts):
        hh = 92 * hgt
        if hh >= 3:                                   # thinner bars read as stray dashes
            b.append(rect(X(a) + 1, Y - 18 - hh, X(c) - X(a) - 2, hh, "m", rx=1))
    b.append(hline(L, R, Y))
    for v in ticks:
        b.append(f'<line class="tick" x1="{X(v):.2f}" y1="{Y - 8}" x2="{X(v):.2f}" y2="{Y + 8}" stroke-width="0.6"/>')
    near = sum(1 for v in pos if 0 < v <= sigma)
    far = sum(1 for v in pos if 3 * sigma < v <= MAXV)
    assert near > 10 * far
    for v, lab, anc in [(-MAXV, "most negative", "start"), (0, "0", "middle"), (MAXV, "largest", "end")]:
        b.append(text(X(v), Y + 26, lab, "sub2", anc))
    body, y = prose(Y + 64, [
        "A trained network's weights crowd around zero, and so do a float's ticks: within one typical "
        f"weight of zero there are {near} of FP8 E4M3's positive values, and in the outer stretch, beyond "
        f"three typical weights, only {far}. The ticks crowd so densely near zero that they merge.",
        "The format and the data agree about where precision is worth spending, which is why weights "
        "survive being squeezed into very small formats.",
    ])
    b.append(body)
    emit("o024", "1:42", "Weights crowd near zero, and so do the ticks", y + 26, b,
         "A genuinely fortunate coincidence, and the foundation of everything that works in this field. "
         "The bell is the typical shape, drawn from a formula; the ticks are E4M3's real values, scaled "
         "so the largest sits at the edge.")


# ---- o026: FP32, merged with the free-bit check that was o027 -----------------------------------------------
def o026():
    L = limits("FP32")
    mx, mn = float(L["max"]), float(L["min_normal"])
    d23, d24 = 23 * math.log10(2), 24 * math.log10(2)
    d11, d8 = 11 * math.log10(2), 8 * math.log10(2)
    assert f"{d23:.2f}" == "6.92" and f"{d24:.2f}" == "7.22" and math.floor(math.log10(mx)) == 38
    assert math.floor(math.log10(mn)) == -38
    PX = 15.5
    b = []
    x = 60
    for w, c, lab in [(1, "u", None), (8, "h", "exponent 8"), (23, "s", "mantissa 23")]:
        b.append(cell(x, 52, w * PX, 34, c, rx=2, label=lab))
        x += w * PX
    b.append(text(40, 110, "FP32: one sign bit, eight exponent, twenty-three mantissa; four bytes per number", "sub2"))
    b.append(text(40, 156, "effective precision", "cap"))
    b.append(cell(199.5, 136, 23 * PX, 34, "s", rx=2, label="23 mantissa bits, stored"))
    b.append(cell(199.5 - 6 - 16, 136, 16, 34, "m", rx=2))
    b.append(text(199.5 - 22, 192, "the implied 1, free", "sub2"))
    b.append(text(199.5 + 23 * PX + 12, 158, "= 24 bits", "sub2"))
    body, y = prose(232, [
        f"Range near ten to the plus or minus thirty-eight: the largest FP32 number is {fs(mx, 3)} and the "
        f"smallest normal one {fs(mn, 3)}. Precision of about seven decimal digits.",
        "Seven digits is worth checking. Each bit doubles the number of values a format can tell "
        "apart, and doubling is multiplying by 10⁰·³⁰¹, so a bit is worth 0.301 of a decimal digit: "
        f"23 bits would give {d23:.2f} digits and 24 give {d24:.2f}. FP32 is usually quoted at about seven "
        "digits, and that only comes out right because the implied 1 makes the precision 24 bits, not 23.",
        f"Same everywhere: FP16 stores 10 and behaves like 11, about {d11:.1f} digits; BF16 stores 7 and "
        f"behaves like 8, about {d8:.1f}.",
    ])
    b.append(body)
    emit("o026", "2:00", "FP32, the baseline", y + 26, b,
         "Every format below FP32 answers one question: which of these thirty-two bits can we afford to "
         "throw away?")


if __name__ == "__main__":
    for fn in (p01, p02, p03, p04, p05, o018, o024, o026):
        fn()
