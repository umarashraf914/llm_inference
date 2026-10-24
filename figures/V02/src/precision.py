"""V2 Part 13, precision from the floor: review proposals 27-31 (26, place value, is V1's new p06 and is
pointed to rather than rebuilt), and Figs 84-88 redrawn or corrected, Fig 89 given its numbers.

  python3 figures/V02/src/precision.py     writes p27 p28 p29 p30 p31 o084 o085 o086 o088;
                                           edits o083 o087 o089 o090

Every floating-point fact is computed here: FP16 and FP32 against numpy, BF16 (which numpy lacks) from
its layout and from FP32's bits, with round-to-nearest-even emulated and checked against numpy.
"""
import math, struct
import numpy as np
from common import *  # noqa: F401,F403

SUP = str.maketrans("0123456789-", "⁰¹²³⁴⁵⁶⁷⁸⁹⁻")


def sci(v, d=1):
    """6.1 × 10⁻⁵, from v."""
    m, e = f"{v:.{d}e}".split("e")
    return f"{m} × 10{str(int(e)).translate(SUP)}"


def p2(e):
    """2 to a power, written 2⁻¹⁴."""
    return "2" + str(e).translate(SUP)


# ---- the formats ---------------------------------------------------------------------------------
FMT = {  # exponent bits, stored fraction bits
    "FP32": (8, 23), "FP16": (5, 10), "BF16": (8, 7), "TF32": (8, 10), "FP8": (4, 3)}


def bias(fmt):
    return 2 ** (FMT[fmt][0] - 1) - 1


def largest(fmt):
    e, m = FMT[fmt]
    return (2 - 2.0 ** -m) * 2.0 ** (2 ** e - 2 - bias(fmt))     # all-ones exponent is reserved


def smallest_normal(fmt):
    return 2.0 ** (1 - bias(fmt))                                 # all-zeros exponent is reserved


def sig_bits(fmt):
    return FMT[fmt][1] + 1                                        # the unstored leading 1


assert bias("FP32") == bias("BF16") == 127 and bias("FP16") == 15
assert largest("FP16") == 65504 == float(np.finfo(np.float16).max)
assert smallest_normal("FP16") == 2.0 ** -14 == float(np.finfo(np.float16).tiny)
assert largest("FP32") == float(np.finfo(np.float32).max) and smallest_normal("FP32") == float(np.finfo(np.float32).tiny)
assert smallest_normal("BF16") == smallest_normal("FP32") == 2.0 ** -126
assert 2.0 ** -10 == float(np.finfo(np.float16).eps) and 2.0 ** -23 == float(np.finfo(np.float32).eps)
RANGE_X = largest("BF16") / largest("FP16")
assert f"{largest('BF16'):.4e}" == "3.3895e+38" and f"{RANGE_X:.2e}" == "5.17e+33"
assert round(math.log10(smallest_normal("FP16") / smallest_normal("BF16")), 1) == 33.7   # the low end too
assert [sig_bits(k) for k in ("FP32", "FP16", "BF16", "FP8")] == [24, 11, 8, 4]


def round_sig(x, p):
    """x rounded to p significant bits, ties to even (range limits ignored: the values here are small)."""
    if x == 0:
        return 0.0
    m, e = math.frexp(x)
    return math.ldexp(round(m * 2 ** p), e - p)      # round() on a float is ties-to-even; m * 2**p is exact


def f32_bits(x):
    return struct.unpack(">I", struct.pack(">f", x))[0]


def bf16_bits(x):
    """BF16 by the usual trick: FP32's bits, rounded to the top 16, ties to even."""
    b = f32_bits(x)
    return (b + 0x7FFF + ((b >> 16) & 1)) >> 16


def from_bf16(h):
    return struct.unpack(">f", struct.pack(">I", h << 16))[0]


# emulation agrees with numpy where numpy has the format, and with the bit trick for BF16
for v in [1.0, 257.0, 2049.0, 3.14159265, 0.1, 1 / 3, 1000.7, 65519.0, 2.0 ** -20]:
    assert round_sig(v, 11) == float(np.float16(v)) or v > 65504, v
    assert round_sig(v, 24) == float(np.float32(v)), v
    assert round_sig(float(np.float32(v)), 8) == from_bf16(bf16_bits(v)), v

# ---- π in BF16 -------------------------------------------------------------------------------------
PI32 = f32_bits(math.pi)
PIB = bf16_bits(math.pi)
assert PI32 == 0x40490FDB and PIB == 0x4049 == PI32 >> 16 and not (PI32 >> 15) & 1   # first dropped bit is 0
S, E, F = PIB >> 15, (PIB >> 7) & 0xFF, PIB & 0x7F
assert (S, E, F) == (0, 128, 73) and f"{E:08b}" == "10000000" and f"{F:07b}" == "1001001"
PI_B = (-1) ** S * 2.0 ** (E - 127) * (1 + F / 128)
assert PI_B == 3.140625 == from_bf16(PIB) and 1 + F / 128 == 1 + 1 / 2 + 1 / 16 + 1 / 128 == 1.5703125
assert abs(PI_B - math.pi) < abs(PI_B + 2 ** -6 - math.pi)                 # nearer than 3.15625
GAP_2_4 = 2.0 ** (1 - 7)
assert GAP_2_4 == 0.015625 == 2 / 128 and PI_B + GAP_2_4 == 3.15625
ERR_B = (math.pi - PI_B) / math.pi
PI_F = float(np.float32(math.pi))
ERR_F = (PI_F - math.pi) / math.pi
assert f(100 * ERR_B, 3) == "0.031" and f(math.pi - PI_B, 5) == "0.00097"
assert f(PI_F, 8) == "3.14159274" and f(100 * ERR_F, 7) == "0.0000028"

# ---- the running total ----------------------------------------------------------------------------
N_ADD = 3000


def run(p, n=N_ADD, step=1.0):
    t, out = 0.0, [0.0]
    for _ in range(n):
        t = round_sig(t + step, p)
        out.append(t)
    return out


RUN = {"BF16": run(8), "FP16": run(11), "FP32": run(24)}
t16 = np.float16(0)
for _ in range(N_ADD):
    t16 = np.float16(t16 + np.float16(1))
assert float(t16) == RUN["FP16"][-1] == 2048 and RUN["BF16"][-1] == 256 and RUN["FP32"][-1] == N_ADD
assert RUN["BF16"][1000] == 256 and RUN["BF16"].index(256) == 256 and round_sig(257, 8) == 256
assert round_sig(2 ** 24 + 1, 24) == 2 ** 24 == 16_777_216 and round_sig(2 ** 24 - 1 + 1, 24) == 2 ** 24
assert round_sig(256, 8) + 2 == round_sig(258, 8) == 258                   # neighbours 2 apart from 256


# ---- rates --------------------------------------------------------------------------------------------
TF32_H100 = 494.7e12                     # WP104 Table 3, dense
B200_FP8 = 72e15 / 2 / 8                 # HGX: FP8/FP6 72 PF sparse for eight GPUs, dense is half
assert PEAK_FP8 / PEAK_BF16 == 1978.9 / 989.4 and round(PEAK_FP8 / PEAK_BF16, 3) == 2.0
assert TF32_H100 * 2 == PEAK_BF16
assert B200["bf16"] == 2.25e15 and B200_FP8 == 4.5e15 and B200["fp4"] == 9e15 == 4 * B200["bf16"]
assert B200["fp4"] / V100["fp16"] == 72


# ---- p27: binary long multiplication ---------------------------------------------------------------
def p27():
    a, b = 0b1011, 0b1101
    rows = [(a if (b >> j) & 1 else 0) << j for j in range(4)]
    assert (a, b, a * b) == (11, 13, 143) and sum(rows) == 143 == 0b10001111
    assert [f"{r:08b}" for r in rows] == ["00001011", "00000000", "00101100", "01011000"]
    ands = {w: w * w for w in (4, 8, 16, 32)}
    assert list(ands.values()) == [16, 64, 256, 1024]
    CX, P, CW, CH = 150, 34, 30, 24
    cx = lambda c: CX + c * P
    b_ = [hd(40, 46, "11 × 13 in binary, as long multiplication")]
    for c in range(8):
        b_.append(txt(cx(c) + CW / 2, 74, f"{2 ** (7 - c)}", "sub2", "middle"))
    b_.append(txt(40, 74, "place value", "cap"))

    def bits(y, s, c0, cls_of):
        for k, ch in enumerate(s):
            b_.append(cell(cx(c0 + k), y, CW, CH, cls_of(ch), label=ch))

    note_x = cx(8) + 8
    Y = [84, 114, 152, 182, 212, 242, 282]
    bits(Y[0], "1011", 4, lambda ch: "s")
    bits(Y[1], "1101", 4, lambda ch: "s")
    b_.append(txt(cx(3) + CW / 2, Y[1] + 17, "×", "hd", "middle"))
    b_.append(ln(cx(0), 145, cx(7) + CW, 145, "tick"))
    for j in range(4):
        s = f"{a:04b}" if (b >> j) & 1 else "0000"
        bits(Y[2 + j], s, 4 - j, lambda ch: "m" if ch == "1" else "u")
    b_.append(ln(cx(0), 275, cx(7) + CW, 275, "tick"))
    bits(Y[6], f"{a * b:08b}", 0, lambda ch: "h" if ch == "1" else "u")
    notes = ["11  =  8 + 2 + 1", "13  =  8 + 4 + 1", "1 × 1011", "0 × 1011, one place left",
             "1 × 1011, two places left", "1 × 1011, three places left", "143  =  128 + 8 + 4 + 2 + 1"]
    for y, s_ in zip(Y, notes):
        b_.append(txt(note_x, y + 16, s_, "sub2"))
    b_.append(txt(40, Y[3] + 10, "16 bits, each", "cap"))
    b_.append(txt(40, Y[3] + 28, "one AND", "cap"))
    b_.append(txt(40, Y[6] + 16, "the sum", "cap"))
    ye = Y[6] + CH + 22
    b_.append(eq(40, ye, 600, "ANDs  =  width × width:  16 at 4 bits,  64 at 8,  256 at 16,  1,024 at 32",
                 cls="m"))
    body, yb = prose(ye + 42 + 36, [
        "Binary long multiplication is the decimal method with an easier times table. Each digit of 1101 "
        "is 0 or 1, so each row is either 0000 or a copy of 1011, shifted one place further left for "
        "each place, and the rows are added. Read by place value ({fig}), the sum is 128 + 8 + 4 + 2 + 1 "
        "= 143.".replace("{fig}", "{{fig:v01-p06}}"),
        "Every bit in the four rows pairs one bit of 1011 with one bit of 1101, and it is 1 only when "
        "both are 1. A chip makes each with an AND gate: 4 × 4 = 16 of them for a 4-bit multiply, and "
        "four rows to add.",
        "So the work grows with the square of the width: 64 ANDs at 8 bits, 256 at 16, 1,024 at 32, "
        "each with its bits to add up. Halve the width of a number and its multiplier shrinks to about "
        "a quarter.",
    ])
    emit("p27", stamp(SRT, "Storing a number in fewer bits"),
         "Multiplying in binary is long multiplication, and it costs width × width", yb + 24, b_ + [body],
         "11 × 13 = 143, the way a chip does it. Storing a number costs its width; multiplying two costs "
         "the width squared, which is why narrow formats pay off so well in the arithmetic.")


# ---- o084: the same silicon, at three widths --------------------------------------------------------
def o084():
    S = 132
    assert 1 * 32 ** 2 == 4 * 16 ** 2 == 16 * 8 ** 2 == 1024
    b_ = [hd(40, 46, "The same silicon as 32-bit, 16-bit or 8-bit multipliers (area to scale)")]
    panels = [(60, 1, "one 32-bit multiplier", "1,024 ANDs"), (274, 2, "four 16-bit ones", "256 ANDs each"),
              (488, 4, "sixteen 8-bit ones", "64 ANDs each")]
    y0 = 66
    for x0, k, l1, l2 in panels:
        side = S / k
        for i in range(k):
            for j in range(k):
                b_.append(rect(x0 + j * side, y0 + i * side, side, side, "u" if k == 1 else "m", rx=0))
        b_.append(txt(x0 + S / 2, y0 + S + 30, l1, "cap", "middle"))
        b_.append(txt(x0 + S / 2, y0 + S + 47, l2, "sub2", "middle"))
    body, yb = prose(y0 + S + 47 + 44, [
        "A multiplier's size goes with the square of its width (the last figure), so the area of one "
        "32-bit multiplier holds four 16-bit ones, or sixteen 8-bit ones: 1,024 = 4 × 256 = 16 × 64.",
        "By area alone, halving the width would quadruple the multiplies per tick. Tensor cores double "
        f"them instead: the H100 does {f(PEAK_BF16 / 1e12, 1)} trillion operations a second at 16 bits and "
        f"{f(PEAK_FP8 / 1e12, 1)} trillion at 8. Why twice and not four times becomes clear once a "
        "floating-point number is taken apart ({fig}).".replace("{fig}", "{{fig:v02-p28}}"),
    ])
    emit("o084", stamp(SRT, "More compute and less memory traffic"), "Why narrower numbers run faster",
         yb + 24, b_ + [body],
         "Squares drawn to the AND-gate count, ignoring the wiring between them. The square law sets how "
         "much arithmetic fits; something else sets how fast it can be fed.")


# ---- o085: the ladder, same chip against across generations ------------------------------------------
def o085():
    rows = [("FP16", "2017, Volta", 16, f"the first tensor-core format: {f(V100['fp16'] / 1e12, 0)} trillion a "
                                         "second on the V100"),
            ("FP8", "2022, Hopper", 8, f"{f(PEAK_FP8 / 1e12, 1)} trillion on the H100, 2× its "
                                       f"{f(PEAK_BF16 / 1e12, 1)} at 16 bits"),
            ("FP4", "2024, Blackwell", 4, f"{f(B200['fp4'] / 1e12, 0)} trillion on the B200, 4× its "
                                          f"{f(B200['bf16'] / 1e12, 0)} at 16 bits")]
    b_ = [hd(40, 46, "Each generation's new, narrower tensor-core format (bar length is bits, to scale)")]
    for k, (fmt, when, bits, note) in enumerate(rows):
        y = 68 + k * 74
        b_.append(txt(40, y + 18, fmt, "cap"))
        b_.append(txt(40, y + 36, when, "sub2"))
        b_.append(cell(190, y, bits * 25, 28, "m", rx=4, label=f"{bits} bits"))
        b_.append(txt(190, y + 28 + 18, note, "sub2"))
    body, yb = prose(68 + 3 * 74 + 18, [
        "Each new format halves the bits, and on the chip that introduced it the rate doubles against "
        f"16 bits: the B200 does {f(B200['bf16'] / 1e12, 0)} trillion operations a second at 16 bits, "
        f"{f(B200_FP8 / 1e12, 0)} at 8 and {f(B200['fp4'] / 1e12, 0)} at 4.",
        "Across generations the gain compounds with everything else that improved, more and faster "
        f"tensor cores among them: from the V100's {f(V100['fp16'] / 1e12, 0)} trillion at 16 bits to the "
        f"B200's {f(B200['fp4'] / 1e12, 0)} trillion at 4 bits is {B200['fp4'] / V100['fp16']:.0f} times.",
    ])
    emit("o085", stamp(SRT, "Volta started with 16-bit"), "The generational ladder", yb + 24, b_ + [body],
         "Bar length is bits per number, to scale. The doublings are measured against 16 bits on the "
         "same chip; rates are dense, from NVIDIA's whitepapers and the HGX B200 specifications.")


# ---- o086: three fields, with the bias --------------------------------------------------------------
def o086():
    six = f32_bits(6.0)
    s6, e6, f6 = six >> 31, (six >> 23) & 0xFF, six & 0x7FFFFF
    assert (s6, e6, f6) == (0, 129, 1 << 22) and e6 - 127 == 2 and 0b110 == 6 == 1.5 * 2 ** 2
    assert (f32_bits(0.125) >> 23) & 0xFF == 124 == 127 - 3
    b_ = [hd(40, 46, "Scientific notation, in base two")]
    b_.append(eq(40, 62, 290, "decimal:   1,500  =  1.5 × 10³", h=36))
    b_.append(eq(350, 62, 290, "binary:   6  =  110  =  1.1 × 2²", h=36))
    yf = 134
    fields = [(40, 60, "u", "sign s", f"{s6}", "0: plus"),
              (108, 200, "h", "exponent e, 8 bits", f"{e6:08b}", f"{e6} = 2 + 127"),
              (316, 324, "s", "fraction f, 23 bits", f"{f6:023b}", "the .1 of 1.1, then zeros")]
    for x, w, c, name, bits, note in fields:
        b_.append(txt(x, yf - 8, name, "sub2"))
        b_.append(cell(x, yf, w, 36, c, rx=4, label=bits))
        b_.append(txt(x, yf + 36 + 18, note, "sub2"))
    ye = yf + 36 + 18 + 22
    b_.append(eq(90, ye, 500, "value  =  (−1)^s  ×  2^(e − 127)  ×  1.f", cls="m"))
    body, yb = prose(ye + 42 + 36, [
        "Scientific notation writes a number as a few digits times a power of ten, the power saying where "
        "the decimal point goes. A floating-point number does the same in base two: 6 is 110 in binary, "
        "which is 1.1 × 2², the binary point moved two places.",
        "FP32 keeps the three parts in 32 bits. The sign bit is 0 for plus. The exponent field holds the "
        "power plus 127, the bias, so that negative powers need no sign of their own: 2² is stored as 129, "
        "and 2⁻³ would be 124.",
        "The fraction, often called the mantissa, holds the digits after the binary point. With the point "
        "placed just after the first "
        "1, the digit before it is always 1, so it is not stored: the significand is 1.f, and FP32 gets "
        "24 significant bits from 23.",
    ])
    emit("o086", stamp(SRT, "A floating-point number splits"), "What a floating-point number is", yb + 24,
         b_ + [body],
         "6 written as FP32, checked in Python. Every format in this Part is these three fields in other "
         "widths; the fourth atlas, on quantization, takes them further ({{ref:v04-o031}}).")


# ---- o088: three layouts at one bit per 15 px ---------------------------------------------------------
def o088():
    PX, CWB, X0 = 15, 13, 110
    b_ = [hd(40, 46, "Three formats, one bit per 15 pixels")]
    notes = {"FP32": "", "FP16": "fine steps, narrow range", "BF16": "FP32's range, coarse steps"}
    for k, fmt in enumerate(("FP32", "FP16", "BF16")):
        e, m = FMT[fmt]
        y = 66 + k * 74
        b_.append(txt(40, y + 18, fmt, "cap"))
        b_.append(txt(40, y + 36, f"{1 + e + m} bits", "sub2"))
        for i in range(1 + e + m):
            c = "u" if i == 0 else ("h" if i <= e else "s")
            b_.append(rect(X0 + i * PX, y, CWB, 26, c, rx=2))
        xe0, xe1 = X0 + PX, X0 + (1 + e) * PX - (PX - CWB)
        xm0, xm1 = X0 + (1 + e) * PX, X0 + (1 + e + m) * PX - (PX - CWB)
        b_.append(txt((xe0 + xe1) / 2, y + 26 + 17, f"{e} exponent bits", "sub2", "middle"))
        b_.append(txt((xm0 + xm1) / 2, y + 26 + 17, f"{m} mantissa bits", "sub2", "middle"))
        if notes[fmt]:
            b_.append(txt(X0 + (1 + e + m) * PX + 14, y + 18, notes[fmt], "sub2"))
    body, yb = prose(66 + 3 * 74 + 14, [
        "Drawn to scale; the grey bit is the sign. The two 16-bit formats spend "
        "their bits in opposite ways.",
        "Deep learning leans on range while staying forgiving about precision. So BF16 keeps all eight of "
        "FP32's exponent bits, and with them FP32's range, and cuts the mantissa from twenty-three bits to "
        "seven. IEEE's FP16 does the reverse: ten mantissa bits and a five-bit exponent.",
        "BF16 is simply the first half of an FP32 number, rounded, so converting between the two costs "
        "almost nothing. NVIDIA reports that both 16-bit formats train networks in mixed precision to the "
        "same results as FP32, without retuning.",
    ])
    emit("o088", stamp(SRT, "Deep learning leans on range"), "BF16: keep the range, cut the precision",
         yb + 24, b_ + [body],
         "Layouts and the training result from NVIDIA's A100 whitepaper. Mixed precision means "
         "low-precision inputs feeding higher-precision sums, the safeguard a few figures on.")


# ---- p29: π in BF16, decoded ---------------------------------------------------------------------------
def p29():
    bits = f"{PIB:016b}"
    assert bits == "0100000001001001"
    P, W, H, X0, Y0 = 32, 28, 30, 84, 66
    b_ = [hd(40, 46, "π in BF16, read field by field")]
    for i, ch in enumerate(bits):
        c = "u" if i == 0 else ("h" if i <= 8 else "s")
        b_.append(cell(X0 + i * P, Y0, W, H, c, rx=3, label=ch))
    mid = lambda i0, i1: (X0 + i0 * P + X0 + i1 * P + W) / 2
    for (i0, i1), s_ in [((0, 0), "sign"), ((1, 8), "exponent, 8 bits"), ((9, 15), "fraction, 7 bits")]:
        b_.append(txt(mid(i0, i1), Y0 + H + 18, s_, "sub2", "middle"))
    ys = Y0 + H + 38
    lines = [("u", f"sign  {S}   →   (−1)^{S}  =  +1"),
             ("u", f"exponent  {E:08b}  =  {E}   →   {E} − 127  =  {E - 127}   →   2^{E - 127}  =  {2 ** (E - 127)}"),
             ("u", f"significand  1.{F:07b}  =  1 + 1/2 + 1/16 + 1/128  =  1 + {F}/128  =  {1 + F / 128}"),
             ("m", f"value  =  +1  ×  {2 ** (E - 127)}  ×  {1 + F / 128}  =  {PI_B}")]
    for k, (c, s_) in enumerate(lines):
        b_.append(eq(40, ys + k * 42, 600, s_, cls=c, h=34))
    body, yb = prose(ys + 3 * 42 + 34 + 36, [
        "Each field is read by place value ({fig}). The exponent 10000000 is 128, and taking off the bias "
        "of 127 leaves 1. The fraction 1001001 is 73, so with its unstored leading 1 the significand is "
        "1 + 73/128.".replace("{fig}", "{{fig:v01-p06}}"),
        f"π is 3.14159265…, so BF16's π is {f(math.pi - PI_B, 5)} short, {f(100 * ERR_B, 3)}% off. Between 2 "
        f"and 4 BF16's numbers are 2 ÷ 128 = {GAP_2_4} apart, and π lies between {PI_B} and "
        f"{PI_B + GAP_2_4}, nearer the first.",
        f"FP32 has sixteen more fraction bits, exactly the ones BF16 drops: its π, {f(PI_F, 8)}, is off by "
        f"{f(100 * ERR_F, 7)}%.",
    ])
    emit("p29", stamp(SRT, "BF16, a 16-bit format"), "π in BF16: 0 | 10000000 | 1001001 is 3.140625",
         yb + 24, b_ + [body],
         "Checked in Python against FP32's π, whose first sixteen bits are exactly these. The first bit "
         "dropped is a 0, so cutting the rest off is the correct rounding here.")


# ---- p30: range and precision, in numbers ----------------------------------------------------------------
def p30():
    X0, X1 = 150, 620
    lx = lambda v: logx(v, 1e-40, 1e40, X0, X1)
    b_ = [hd(40, 46, "Range: smallest normal number to largest (log axis, eighty powers of ten)")]
    rows = [("FP32", "u"), ("BF16", "s"), ("FP16", "m")]
    for k, (fmt, c) in enumerate(rows):
        y = 62 + k * 34
        lo, hi = smallest_normal(fmt), largest(fmt)
        x0, x1 = lx(lo), lx(hi)
        lab = f"{sci(lo)} to {sci(hi)}" if fmt != "FP16" else f"{sci(lo)} to {n(hi)}"
        b_.append(txt(40, y + 17, fmt, "cap"))
        if x1 - x0 > tw(lab) + 30:
            b_.append(cell(round(x0, 1), y, round(x1 - x0, 1), 24, c, label=lab))
        else:
            b_.append(rect(x0, y, x1 - x0, 24, c))
            b_.append(txt(round(x1 + 8, 1), y + 17, lab, "sub2"))
    ax = 62 + 3 * 34 + 2
    b_.append(ln(X0, ax, X1, ax, "axis"))
    for e in (-40, -20, 0, 20, 40):
        x = lx(10.0 ** e)
        b_.append(vline(x, ax, ax + 5))
        b_.append(txt(round(x, 1), ax + 19, "1" if e == 0 else "10" + str(e).translate(SUP), "sub2", "middle"))
    y2 = ax + 56
    b_.append(hd(40, y2, "Precision: every number each format holds from 1 to 1.03 (linear axis)"))
    lin = lambda v: X0 + (v - 1) / 0.03 * (X1 - X0)
    vals = {"FP16": [1 + k * 2.0 ** -10 for k in range(64) if 1 + k * 2.0 ** -10 <= 1.03],
            "BF16": [1 + k * 2.0 ** -7 for k in range(8) if 1 + k * 2.0 ** -7 <= 1.03]}
    assert len(vals["FP16"]) == 31 and len(vals["BF16"]) == 4
    assert all(float(np.float16(v)) == v for v in vals["FP16"]) and all(round_sig(v, 8) == v for v in vals["BF16"])
    for k, (fmt, pl, gap) in enumerate([("FP16", "pl-m", 2.0 ** -10), ("BF16", "pl-h", 2.0 ** -7)]):
        y = y2 + 20 + k * 46
        b_.append(txt(40, y + 12, fmt, "cap"))
        b_.append(txt(40, y + 29, f"every {f(gap, 5 if fmt == 'FP16' else 4)}", "sub2"))
        b_.append(ln(X0, y + 12, X1, y + 12, "axis"))
        for v in vals[fmt]:
            b_.append(vline(lin(v), y + 2, y + 22, pl))
    ax2 = y2 + 20 + 2 * 46 + 4
    b_.append(ln(X0, ax2, X1, ax2, "axis"))
    for v, s_ in [(1.0, "1.00"), (1.01, "1.01"), (1.02, "1.02"), (1.03, "1.03")]:
        b_.append(vline(lin(v), ax2, ax2 + 5))
        b_.append(txt(round(lin(v), 1), ax2 + 19, s_, "sub2", "middle"))
    assert f(2.0 ** -10, 5) == "0.00098" and f(2.0 ** -7, 4) == "0.0078" and 2.0 ** -7 / 2.0 ** -10 == 8
    assert f(100 * 2.0 ** -11, 2) == "0.05" and f(100 * 2.0 ** -8, 1) == "0.4"     # half a gap, at worst
    body, yb = prose(ax2 + 56, [
        "The largest number has the biggest exponent and every fraction bit set; the smallest normal one "
        "has the smallest exponent and none. The all-zeros and all-ones exponent patterns are kept for "
        f"zero, infinity and the tiniest numbers. So FP16, with five exponent bits and a bias of 15, spans "
        f"{p2(-14)} = 0.000061 to (2 − {p2(-10)}) × {p2(15)} = {n(largest('FP16'))}, and BF16 spans {p2(-126)} to "
        f"{sci(largest('BF16'))}, the same powers of two as FP32.",
        "Precision runs the other way. Just above 1, FP16's numbers are 2⁻¹⁰ = 0.00098 apart and BF16's "
        "2⁻⁷ = 0.0078, eight times coarser. Rounding to the nearest moves a value by at most 0.05% in FP16 "
        "and 0.4% in BF16.",
        "That is the whole trade: BF16 accepts a coarser blur on every number in order to reach every "
        "power of two that FP32 reaches.",
    ])
    emit("p30", stamp(SRT, "keeps all eight"),
         f"BF16 reaches {sci(RANGE_X, 0)} times higher than FP16, in steps eight times coarser",
         yb + 24, b_ + [body],
         "Both panels computed from the bit layouts, with FP16's and FP32's limits checked against numpy. "
         "On the top axis FP32 and BF16 differ only in the third digit of their largest number.")


# ---- p28: the significand sets the multiplier, the bits set the rate ------------------------------------
def p28():
    sq = {k: sig_bits(k) ** 2 for k in ("FP32", "FP16", "BF16", "FP8")}
    assert list(sq.values()) == [576, 121, 64, 16] and sq["FP32"] / sq["BF16"] == 9
    assert round(sq["FP32"] / sq["FP16"], 2) == 4.76 and sq["BF16"] / sq["FP8"] == 4
    assert sig_bits("TF32") == sig_bits("FP16") == 11
    U = 5
    b_ = [hd(40, 46, "Each format's significand multiplier, width × width (area to scale)")]
    base = 190
    xs = {"FP32": 60, "FP16": 240, "BF16": 360, "FP8": 470}
    for k, x in xs.items():
        s = sig_bits(k) * U
        b_.append(rect(x, base - s, s, s, "u" if k == "FP32" else "m", rx=0))
        b_.append(txt(x + s / 2, base + 30, f"{k}: {sig_bits(k)} bits", "cap", "middle"))
        b_.append(txt(x + s / 2, base + 47, f"{sig_bits(k)} × {sig_bits(k)} = {sq[k]}", "sub2", "middle"))
    y2 = base + 47 + 42
    b_.append(hd(40, y2, "The H100's tensor-core rate, trillion operations a second (bars to scale)"))
    rates = [("TF32", 32, PEAK_BF16 / 2), ("FP16", 16, PEAK_BF16), ("BF16", 16, PEAK_BF16), ("FP8", 8, PEAK_FP8)]
    assert rates[0][2] == TF32_H100
    hy = y2 + 24
    for x, s_ in [(100, "bits a number"), (210, "multiplier size")]:
        b_.append(txt(x, hy, s_, "sub2"))
    BX, BW = 300, 270
    for k, (fmt, bits, r) in enumerate(rates):
        y = hy + 10 + k * 32
        b_.append(txt(40, y + 17, fmt, "cap"))
        b_.append(txt(100, y + 17, f"{bits}", "sub2"))
        b_.append(txt(210, y + 17, f"{sig_bits(fmt) ** 2}", "sub2"))
        w = r / PEAK_FP8 * BW
        b_.append(rect(BX, y, w, 24, "s"))
        b_.append(txt(round(BX + w + 8, 1), y + 17, f(r / 1e12, 1), "sub2"))
    body, yb = prose(hy + 10 + 4 * 32 + 30, [
        "Multiplying two floating-point numbers multiplies their significands and adds their exponents, "
        "since 2^a × 2^b = 2^(a + b). The adder is small, so the significand multiplier is most of the cost, and "
        "it grows with the square of the significand's width: 24 × 24 = 576 for FP32 against 8 × 8 = 64 "
        "for BF16, a ninth.",
        "Yet the rates follow the bits a number takes, not the multiplier. TF32 has FP16's 11-bit "
        "significand but is read as 32-bit numbers, and runs at half FP16's rate; BF16's multiplier is "
        "about half FP16's, at the same rate; FP8's is a quarter of BF16's, at twice the rate.",
        "The likely reason is delivery. Every operand must be carried to the tensor cores, and the paths "
        "that carry them move a fixed number of bits a tick, so halving the bits doubles the numbers that "
        "arrive. The square law sets how much arithmetic fits; the bits set how fast it is fed.",
    ])
    emit("p28", stamp(SRT, "cuts the mantissa"),
         "BF16's multiplier is a ninth the size of FP32's, yet the rate follows the bits", yb + 24, b_ + [body],
         "Rates are dense, from NVIDIA's H100 whitepaper; TF32's layout is from the A100 whitepaper. The "
         "delivery explanation is reasoned from that pattern, not a published specification.")


# ---- p31: the running total that stops ----------------------------------------------------------------
def p31():
    X0, X1, Y0, Y1, V = 100, 600, 266, 92, N_ADD
    px = lambda k: X0 + k / V * (X1 - X0)
    py = lambda t: Y0 - t / V * (Y0 - Y1)

    def knees(seq):
        pts = [(0, seq[0])]
        for k in range(1, len(seq) - 1):
            if (seq[k] - seq[k - 1]) != (seq[k + 1] - seq[k]):
                pts.append((k, seq[k]))
        return pts + [(len(seq) - 1, seq[-1])]

    K = {k: knees(v) for k, v in RUN.items()}
    assert K["BF16"] == [(0, 0), (256, 256), (V, 256)] and K["FP16"] == [(0, 0), (2048, 2048), (V, 2048)]
    assert K["FP32"] == [(0, 0), (V, V)]
    b_ = [hd(40, 46, "The running total, adding 1 each time, in three formats")]
    b_.append(ln(X0, Y0, X1, Y0, "axis"))
    b_.append(ln(X0, Y1, X0, Y0, "axis"))
    for v in (0, 1000, 2000, 3000):
        b_.append(vline(px(v), Y0, Y0 + 5))
        b_.append(txt(round(px(v), 1), Y0 + 19, n(v), "sub2", "middle"))
        if v:
            b_.append(ln(X0 - 5, round(py(v), 1), X0, round(py(v), 1), "tick"))
            b_.append(txt(X0 - 9, round(py(v), 1) + 4, n(v), "sub2", "end"))
    b_.append(txt(X1, Y0 + 38, "additions", "sub2", "end"))
    b_.append(txt(40, Y1 - 16, "running total", "sub2"))
    for fmt, cls in [("FP32", "conn"), ("FP16", "pl-m"), ("BF16", "pl-h")]:
        b_.append(f'<polyline class="{cls}" points="' + " ".join(f"{px(k):.1f},{py(t):.1f}" for k, t in K[fmt]) + '"/>')
    b_.append(txt(X1, Y1 - 8, f"FP32: {n(V)}, exact", "sub2", "end"))
    b_.append(txt(X1, py(2048) + 17, "FP16: stuck at 2,048", "sub2", "end"))
    b_.append(txt(X1, py(256) - 8, "BF16: stuck at 256", "sub2", "end"))
    body, yb = prose(Y0 + 38 + 40, [
        "Adding 1 stays exact only while the total's neighbours are at most 1 apart. BF16 has 8 "
        "significant bits, so from 256 its numbers run 256, 258, 260. 257 lies exactly halfway, the tie "
        "goes to 256, and every addition after that is rounded away.",
        "FP16, with 11 significant bits, lasts until 2,048; FP32, with 24, counts exactly to 16,777,216. A "
        "dot product of thousands of terms is just such a running total, which is why its sum is kept in "
        "FP32 even when every input is BF16.",
        "Real terms are not all 1, but the effect is the same: once the total is large, any term smaller "
        "than half the gap vanishes, and larger ones are rounded.",
    ])
    emit("p31", stamp(SRT, "accumulate back in FP32"), "Add 1 over and over in BF16 and the total stops at 256",
         yb + 24, b_ + [body],
         "Computed by emulating round-to-nearest, ties to even, in Python, and checked against numpy for "
         "FP16. The lines are the emulated totals, drawn through every point where their slope changes.")


# ---- edits ---------------------------------------------------------------------------------------------
def fixes():
    edit_item("o083", caption="Both arrows point at bottlenecks already established. The bytes side was "
                              "counted in {{ref:v01-o116}}; the compute side is worked out over the next "
                              "figures.")
    edit_item("o087", ts=stamp(SRT, "which sets its fine precision"), from_y=200, paras=[
        "A format with a wide exponent and a narrow fraction covers an enormous span coarsely. The reverse "
        "covers a narrow span finely.",
        "With a fixed number of bits, every one given to one field is taken from the other. There is no "
        "setting that improves both.",
        "So a format must choose. For neural networks the choice turned out to be range, and the next "
        "figures show what that buys and what it costs.",
    ])
    edit_item("o089", from_y=150, paras=[
        "Each product is added into a running total ({fig}), and the total is kept in FP32 even when the "
        f"inputs are BF16 or FP8. It costs no speed: the H100's {f(PEAK_BF16 / 1e12, 1)} trillion BF16 "
        "operations a second are quoted with FP32 accumulation.".replace("{fig}", "{{fig:v01-o111}}"),
        "Google's TPUs make the same choice: bfloat16 multiplies, FP32 accumulation. The next figure shows "
        "what goes wrong without it.",
    ], caption="Storing, multiplying and accumulating in low precision are three separate decisions; the "
               "hardware takes the first two and declines the third. Sources: the H100 whitepaper's Table 3 "
               "and Google Cloud's TPU architecture page.")
    two, four = 2 / 9 * 400, 4 / 9 * 400
    edit_item("o090", replace=[
        ('dominant-baseline="central">9x</text>', 'dominant-baseline="central">9×</text>'),
        ('<g class="m"><rect x="210" y="142" width="133" height="32" rx="4"></rect><text class="sub" '
         'x="276.5" y="158.0" text-anchor="middle" dominant-baseline="central">2 to 4x</text></g>',
         rect(210, 142, two, 32, "m", rx=4) + ghost(round(210 + two, 1), 142, round(four - two, 1), 32, rx=4)
         + txt(round(210 + four + 10, 1), 163, "2 to 4×", "sub2")),
    ])


if __name__ == "__main__":
    p27()
    o084()
    o085()
    o086()
    o088()
    p29()
    p30()
    p28()
    p31()
    fixes()
