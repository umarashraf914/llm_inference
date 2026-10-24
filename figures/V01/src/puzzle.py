"""V01 Part 3, the 30 millisecond puzzle: reading the numbers, and the division that does not come out.

Regenerates o062 (bars on an even logarithmic scale; review §5.1 #3), o064 (two value boxes that no
longer read as bars, and a pointer to where 10^11 comes from), o065 (the division and the unit check,
merged from o065 and o066; §5.1 #17), o067 (the share of a step spent on arithmetic, truly to scale,
merged from o067 and o069; §5.1 #23), and writes proposal 5, the unit prefixes.

  python3 figures/V01/src/puzzle.py
"""
from common import cell, arr, ln, txt, hd, eq, prose, emit, st, f, g, sig, PEAK

OPS_TOKEN, RATE, BUDGET_MS = 1e11, 1e15, 30.0
ARITH_MS = OPS_TOKEN / RATE * 1000
assert ARITH_MS == 0.1 and BUDGET_MS / ARITH_MS == 300


def o062():
    b = [hd(40, 46, "Reading the big numbers")]
    names = ["thousand", "million", "billion", "trillion", "quadrillion"]
    STEP = 68                                   # each ×1,000 adds the same length: a log scale
    for k, name in enumerate(names):
        y = 70 + k * 44
        b.append(cell(60, y, 78, 30, "u", rx=3, label=f"10^{3 * (k + 1)}"))
        b.append(txt(152, y + 20, name, "cap"))
        b.append(cell(280, y + 2, STEP * (k + 1), 26, "m", rx=3))
    lin = [10 ** (3 * (k + 1)) / 1e15 * STEP * 5 for k in range(5)]
    assert lin[3] < 0.5                         # on a linear scale the first four would vanish
    b.append(txt(60, 70 + 5 * 44 + 8, "each bar is one equal step longer than the one above it, and each step is ×1,000", "sub2"))
    body, yb = prose(70 + 5 * 44 + 52, [
        "The small raised number, written here after a ^, counts the zeros. Ten to the fifteen, 10^15, is a "
        "one followed by fifteen zeros: a thousand million million.",
        "Each step down the list is a thousand times the one above, and each bar is the same length longer "
        "than the one above it. That is a logarithmic scale, taken apart in the next figure. On an ordinary "
        "scale the first four bars would be invisible beside the last.",
        "Only two of these matter here: a chip does about ten to the fifteen operations a second, and one "
        "token costs about ten to the eleven.",
    ])
    emit("o062", "2:39", "How to read a number like ten to the fifteen", yb + 26, b + [body],
         "Worth a moment, because the whole argument compares two of these numbers, 10^15 and 10^11. They "
         "are four powers of ten apart: a factor of 10,000.")


def p05():
    b = [hd(40, 46, "A prefix in front of a unit is a name for a power of ten")]
    C = [40, 96, 196, 286, 390]
    for c, h in zip(C[1:], ["name", "means", "in words", "seen in this atlas as"]):
        b.append(txt(c, 76, h, "sub2"))
    rows = [("k", "kilo", "10^3", "thousand", "a few KB of prompt on the network"),
            ("M", "mega", "10^6", "million", "prices per million tokens"),
            ("G", "giga", "10^9", "billion", "140 GB of weights"),
            ("T", "tera", "10^12", "trillion", "3.35 TB/s read from memory"),
            ("P", "peta", "10^15", "quadrillion", "about 1 PFLOP/s of arithmetic"),
            ("m", "milli", "10^−3", "thousandth", "30 ms for one token"),
            ("µ", "micro", "10^−6", "millionth", "100 µs of arithmetic per token"),
            ("n", "nano", "10^−9", "billionth", "about 270 ns for one memory read")]
    y = 88
    for k, (sym, name, pw, words, ex) in enumerate(rows):
        if k == 5:
            y += 24
            b.append(ln(40, y - 14, 640, y - 14, "axis"))
        # the symbol sits between two labels that begin and end with digits: check_atlas.py's
        # split-word test raises IndexError when a non-ASCII letter such as µ meets a word
        b.append(txt(C[2], y + 18, pw, "sub2"))
        b.append(cell(C[0], y, 40, 26, "u", rx=3, label=sym))
        b.append(txt(C[4], y + 18, ex, "sub2"))
        b.append(txt(C[1], y + 18, name, "cap"))
        b.append(txt(C[3], y + 18, words, "sub2"))
        assert ex[0].isdigit() or sym.isascii()
        y += 34
    assert round(0.1e-3 / 1e-6) == 100 and round(PEAK / 1e15, 3) == 0.989
    body, yb = prose(y + 26, [
        "A prefix multiplies its unit by its power of ten: 140 GB is 140 × 10^9 bytes, 30 ms is 30 × 10^−3 "
        "seconds, and 3.35 TB/s is 3.35 × 10^12 bytes every second. B is for bytes ({{fig:v01-o073}}).",
        "Each row is a thousand times the one below it, so converting is moving the decimal point three "
        "places: 0.1 ms = 100 µs, and 989 TFLOP/s = 0.989 PFLOP/s.",
        "In computer memory k, M and G are sometimes powers of two instead, 1,024 rather than 1,000 for k. "
        "Part 11 shows where that difference becomes visible.",
    ])
    emit("p05", "2:43", "Unit prefixes are powers of ten with names", yb + 26, b + [body],
         "Eight prefixes cover every quantity in this series, from nanoseconds to petaflops. Reading them "
         "without stopping is most of what reading a specification sheet takes.")


def o064():
    b = []
    rows = [("What the chip can do", "about 10^15 operations per second", "s"),
            ("What one token needs", "about 10^11 operations", "m")]
    for k, (lab, val, c) in enumerate(rows):
        y = 62 + k * 52
        b.append(txt(40, y + 20, lab, "cap"))
        b.append(cell(250, y, 300, 32, c, rx=3, label=val))
    b.append(eq(140, 176, 400, "10^11 ÷ 10^15  =  0.1 milliseconds of arithmetic", "m"))
    body, yb = prose(258, [
        "A quadrillion operations a second is a trillion in every millisecond. The arithmetic for one token, "
        "a hundred billion operations, takes a tenth of a millisecond.",
        f"The budget is thirty milliseconds. On the arithmetic alone the chip could have finished "
        f"{g(BUDGET_MS / ARITH_MS - 1)} more tokens in the time left over: {g(BUDGET_MS / ARITH_MS)} in all.",
        "The 10^11 is two operations for each of the model's 70 billion weights; {{fig:v01-o114}} shows "
        "where the two comes from.",
    ])
    emit("o064", st("on the order of a hundred billion arithmetic"), "The arithmetic finishes almost instantly",
         yb + 26, b + [body],
         "Two numbers and a division. Everything in this atlas is an answer to why the remaining 29.9 "
         "milliseconds are not free.")


def o065():
    b = [hd(40, 46, "The numbers: subtract the exponents"), hd(350, 46, "The units: they cancel")]
    nums = ["10^11  ÷  10^15", "=  10^(11 − 15)  =  10^−4", "=  0.0001"]
    units = ["operations  ÷  operations per second", "=  operations  ×  seconds per operation", "=  seconds"]
    for k, (n_, u_) in enumerate(zip(nums, units)):
        y = 66 + k * 62
        b.append(eq(40, y, 290, n_, "m"))
        b.append(eq(350, y, 290, u_, "u"))
        if k:
            b.append(arr(185, y - 18, 185, y - 3))
            b.append(arr(495, y - 18, 495, y - 3))
    yr = 66 + 3 * 62 + 4
    b.append(eq(150, yr, 380, "together:  0.0001 seconds  =  0.1 milliseconds", "s"))
    body, yb = prose(yr + 42 + 36, [
        "A negative exponent means a fraction: ten to the minus four is one ten-thousandth.",
        "Dividing by a rate is multiplying by the rate turned over: operations per second becomes seconds per "
        "operation. The operations then cancel, as any quantity divided by itself does, and seconds are "
        "left, which is what a duration should be.",
        "Divide the other way round, operations per second by operations, and what is left is per second: a "
        "frequency, not a duration. When the units do not come out as the thing being asked for, the "
        "calculation is wrong.",
    ])
    emit("o065", st("about a tenth of a millisecond"), "Doing the division, and checking the units", yb + 26,
         b + [body],
         "The whole puzzle is one division, so it is worth doing slowly. The unit check takes five seconds and "
         "catches the most common class of error in this subject; use it on every claim in this series, "
         "including the ones made here.")


def o067():
    b = [hd(40, 46, "Where the 30 milliseconds of one token go, drawn to scale")]
    X0, W, Y = 60, 560, 92
    a = W * ARITH_MS / BUDGET_MS
    assert round(a, 2) == 1.87
    share = ARITH_MS / BUDGET_MS * 100
    b.append(cell(X0, Y, round(a, 2), 44, "m", rx=0))
    b.append(cell(round(X0 + a, 2), Y, round(W - a, 2), 44, "h", rx=3,
                  label=f"everything else: {f(BUDGET_MS - ARITH_MS, 1)} ms, {f(100 - share)}%"))
    b.append(txt(X0, Y - 12, f"arithmetic: {f(ARITH_MS, 1)} ms, {f(share)}%, the sliver at the left edge", "sub2"))
    b.append(eq(150, Y + 70, 380, f"0.1 ÷ 30  =  {f(ARITH_MS / BUDGET_MS, 4)}  =  {f(share)} percent", "u"))
    body, yb = prose(Y + 70 + 42 + 38, [
        "Drawn to scale, the arithmetic is under two pixels wide. Everything else in a decode step is "
        "something other than mathematics.",
        f"A percentage is a fraction written out of a hundred: 0.1 out of 30 is {f(share)} out of 100, a third "
        "of one percent. The exact share depends on the model and the chip; that it is under one percent "
        "does not.",
        "By the end of this atlas the other 99 percent has a name, and the time per token can be derived from "
        "two hardware numbers, for any model on any chip.",
    ])
    emit("o067", st("less than 1% is spent on arithmetic"), "Under one percent of each step is arithmetic",
         yb + 26, b + [body],
         "This bar is the thesis of the whole series. Everything later is an attempt to shrink the red part.")


if __name__ == "__main__":
    for fn in (o062, p05, o064, o065, o067):
        fn()
