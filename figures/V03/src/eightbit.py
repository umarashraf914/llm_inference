"""V3 Part 11, eight-bit attention in FlashAttention 3: §5a item 14 (Fig 76's FP8 mechanism, Fig 75's 256),
review #22-#25, one extra ground-floor figure (n01, quantising worked), and a new part heading (s16).

  s16   Part 11: Eight bits
  o075  what FP8 is: two layouts, 256 bit patterns, 253 and 247 values (rebuilt)
  p22   E4M3 holds 253 values, packed tight near zero and sparse near 448 (23:09)
  n01   to quantise is to divide by a scale and round: four numbers worked (23:14)
  p23   one scale per tensor crushes an integer grid; a float grid keeps most of its codes (23:26)
  p24   a rotation turns arrows without changing the angle between them (24:07)
  p25   spreading an outlier channel across 128 lets rounding errors cancel (24:22)
  o076  what the two fixes bought, as measured (rebuilt)

  python3 figures/V03/src/eightbit.py
"""
import numpy as np
import fp8
from common import *  # noqa: F401,F403

BPX = 36                                             # pixels per bit, as in o024
SUP = str.maketrans("-0123456789", "⁻⁰¹²³⁴⁵⁶⁷⁸⁹")
sup = lambda e: str(e).translate(SUP)


def bits(x0, y, fields):
    out, x = [], x0
    for n, cls, lab in fields:
        out.append(cell(x, y, n * BPX - 2, 28, cls, label=lab))
        x += n * BPX
    return "".join(out)


# ---- o075: what FP8 is ------------------------------------------------------------------------------
def o075():
    b = [hd(40, 46, "Eight bits, arranged two ways, drawn at the same width per bit as FP16")]
    b.append(txt(40, 86, "E4M3", "cap"))
    b.append(bits(120, 68, [(1, "u", "±"), (4, "h", "exponent, 4"), (3, "s", "fraction, 3")]))
    b.append(txt(120 + 8 * BPX + 14, 86, f"{len(fp8.E4M3_POS) * 2 + 1} values, up to {max(fp8.E4M3_POS):g}", "sub2"))
    b.append(txt(40, 132, "E5M2", "cap"))
    b.append(bits(120, 114, [(1, "u", "±"), (5, "h", "exponent, 5"), (2, "s", "frac, 2")]))
    b.append(txt(120 + 8 * BPX + 14, 132, f"{len(fp8.E5M2_POS) * 2 + 1} values, up to {max(fp8.E5M2_POS):,.0f}", "sub2"))
    body, yb = prose(186, [
        "Both formats are the same three fields as every floating-point number ({{fig:v03-o024}}), squeezed "
        "into eight bits. E4M3 spends four bits on the exponent and three on the fraction; E5M2 moves one "
        "bit across, trading fineness for reach. Hopper's tensor cores multiply either at about twice the "
        "rate they manage in 16 bits.",
        "Eight bits make 256 patterns, but not 256 numbers. Plus zero and minus zero are the same value, and "
        "some patterns are kept for 'not a number': E4M3 holds 253 distinct values and has no infinity, "
        "E5M2 holds 247. A couple of hundred values, to stand in for every number a tensor might hold.",
    ])
    figure("o075", st("compute in FP8"), "What FP8 is", yb + 30, b + [body],
           esc("Two formats, one width. Which values those 253 patterns land on, and how far apart, decides "
               "everything that follows in this part."))


# ---- p22: where the values are ------------------------------------------------------------------------------
def p22():
    lo, hi = 2.0 ** -17, 2.0 ** 16.5
    X0, X1 = 70, 620
    L = lambda v: lg(v, lo, hi, X0, X1)
    per_doubling = sum(1 for v in fp8.E4M3_POS if 1 <= v < 2)
    last = sum(1 for v in fp8.E4M3_POS if v >= 256)
    subs = sum(1 for v in fp8.E4M3_POS if v < 2 ** -6)
    assert (per_doubling, last, subs) == (8, 7, 7)
    assert sum(1 for v in fp8.E5M2_POS if 1 <= v < 2) == 4
    b = [hd(40, 46, "Every positive value each format can hold, on a logarithmic axis")]
    for name, vals, y in (("E4M3", fp8.E4M3_POS, 80), ("E5M2", fp8.E5M2_POS, 150)):
        b.append(txt(40, y - 10, name, "cap"))
        for v in vals:
            b.append(tline(L(v), y, L(v), y + 22))
    ya = 210
    b.append(tline(X0, ya, X1, ya, "axis"))
    for e in range(-16, 17, 4):
        x = L(2.0 ** e)
        b.append(tline(x, ya, x, ya + 5))
        b.append(txt(x, ya + 20, ("2" + sup(e)) if e else "1", "sub2", "middle"))
    b.append(txt(L(2.0 ** -9), 122, "2⁻⁹, the smallest", "sub2", "middle"))
    b.append(txt(L(448), 122, "448", "sub2", "middle"))
    b.append(txt(L(57344), 192, "57,344", "sub2", "end"))
    b.append(txt(L(2.0 ** -16), 192, "2⁻¹⁶", "sub2", "middle"))
    body, yb = prose(ya + 56, [
        f"Each tick is one value. Within every doubling, from 1 to 2 or from 64 to 128, E4M3 has the same "
        f"{per_doubling} values, because its three fraction bits split each doubling into eight equal steps. "
        "So the steps are tiny near zero and large far out: 0.125 apart between 1 and 2, but 32 apart "
        "between 256 and 448.",
        f"Below 2⁻⁶ the format runs out of exponents and has {subs} evenly spaced subnormals down to 2⁻⁹; below "
        f"that, everything rounds to zero. Its top doubling has {last} values, not 8, because the very top "
        "pattern means 'not a number'. E5M2 covers far more range with half as many values per doubling.",
        "Every value carries the same relative precision: a number is never more than 1/16, 6.25%, from the "
        "nearest E4M3 value, wherever it sits on the axis.",
    ])
    figure("p22", st("a couple hundred distinct values"),
           "E4M3 holds 253 values, packed tight near zero and sparse near 448", yb + 30, b + [body],
           esc("Spacing that grows with size is the floating-point bargain: the same few percent of precision "
               "at every scale, in place of the same absolute step everywhere."))


# ---- n01: quantising, worked --------------------------------------------------------------------------------------
def n01():
    xs = np.array([0.37, -1.2, 2.9, 0.05])
    s = np.abs(xs).max() / 448
    scaled = xs / s
    q = fp8.e4m3(scaled)
    back = q * s
    rel = (back - xs) / xs
    assert list(q) == [56.0, -192.0, 448.0, 7.5] and np.all(np.abs(rel) <= 0.0625)
    b = [hd(40, 46, "Four numbers into E4M3, with one scale for all of them")]
    b.append(eq(40, 62, 600, f"scale = largest ÷ 448 = 2.9 ÷ 448 = {s:.6f}", "u", 32))
    cols = [(40, "number", "start"), (200, "÷ scale", "end"), (320, "nearest E4M3", "end"), (460, "× scale", "end"),
            (600, "error", "end")]
    for cx, lab, an in cols:
        b.append(txt(cx, 122, lab, "sub2", an))
    for k in range(4):
        y = 146 + k * 24
        b.append(txt(40, y, f"{xs[k]:g}".replace("-", "−"), "cap"))
        b.append(txt(200, y, f(scaled[k], 2), "sub2", "end"))
        b.append(txt(320, y, f(q[k], 1) if q[k] % 1 else f(q[k], 0), "sub2", "end"))
        b.append(txt(460, y, f(back[k], 4), "sub2", "end"))
        b.append(txt(600, y, (f(100 * rel[k], 1) + "%") if rel[k] else "0", "sub2", "end"))
    body, yb = prose(146 + 4 * 24 + 26, [
        "Quantising means storing each number as the nearest value the format can hold. A raw tensor's "
        "numbers can be any size, so first everything is divided by one scale, chosen so the largest "
        "magnitude lands exactly on 448, E4M3's top. Then each scaled number is rounded to the nearest "
        "E4M3 value ({{fig:v03-p22}}). To use them, multiply back by the scale.",
        "Here 57.16 rounds to 56, because between 32 and 64 the values are 4 apart; 7.72 rounds to 7.5, where "
        "they are half a unit apart. Every number comes back within a few percent of where it started, and "
        "the scale is stored once, in higher precision, beside the tensor.",
    ])
    figure("n01", st("quantizing, rounding every number"), "To quantise is to divide by a scale and round",
           yb + 30, b + [body],
           esc("The scale is set by the single largest magnitude. That one sentence is the whole of the problem "
               "the next figure shows."))


# ---- p23: one scale, two grids ------------------------------------------------------------------------------------
def p23():
    big = 100.0                                         # an outlier 100 times the typical size
    int_levels = [k * big / 127 for k in range(1, 128) if k * big / 127 <= 1.0]
    f8_levels = [v * big / 448 for v in fp8.E4M3_POS if v * big / 448 <= 1.0]
    assert len(int_levels) == 1 and int(127 / big) == 1 and len(f8_levels) == 72
    rng = np.random.default_rng(5)
    typical = np.abs(rng.standard_normal(4000)) * 0.3
    typical = typical[typical <= 1.0]
    hist, edges = np.histogram(typical, bins=25, range=(0, 1))
    X0, X1 = 150, 610
    P = lambda v: X0 + v * (X1 - X0)
    b = [hd(40, 46, "Typical values, 0 to 1, when one outlier at 100 sets the scale")]

    def panel(y, name, levels, cls):
        o = [txt(40, y + 30, name, "cap")]
        hmax = hist.max()
        for k, hcount in enumerate(hist):
            h = 34 * hcount / hmax
            o.append(f'<rect x="{P(edges[k]) + 0.5:.1f}" y="{y + 40 - h:.1f}" width="{P(edges[k + 1]) - P(edges[k]) - 1:.1f}" '
                     f'height="{h:.1f}" fill="var(--u-fill)" stroke="var(--u)" stroke-width="0.6"/>')
        o.append(tline(X0, y + 40, X1, y + 40, "axis"))
        for v in levels:
            o.append(f'<line class="xok" x1="{P(v):.1f}" y1="{y + 40}" x2="{P(v):.1f}" y2="{y + 52}" '
                     f'stroke="var({cls})" stroke-width="1.2"/>')
        o.append(f'<line class="xok" x1="{P(0):.1f}" y1="{y + 40}" x2="{P(0):.1f}" y2="{y + 52}" stroke="var({cls})" stroke-width="1.2"/>')
        return "".join(o)
    b.append(panel(64, "INT8", int_levels, "--h"))
    b.append(txt(X1, 132, f"{len(int_levels)} level above zero, at {f(int_levels[0], 3)}", "sub2", "end"))
    b.append(panel(150, "E4M3", f8_levels, "--s"))
    b.append(txt(X1, 218, f"{len(f8_levels)} of its 126 positive values", "sub2", "end"))
    for v in (0, 0.5, 1):
        b.append(txt(P(v), 236, f"{v:g}", "sub2", "middle"))
    body, yb = prose(270, [
        "The bars are where typical values sit; the ticks below are the values each format can store once "
        "one outlier, 100 times larger, has set the scale. An 8-bit integer format has 255 evenly spaced "
        f"levels, so with the scale stretched to 100 they are {f(100 / 127, 3)} apart, and every typical "
        "value lands on 0 or on the first level. Almost all of the resolution sits where no value ever falls.",
        f"E4M3's values are spaced by powers of two, so after the same scaling {len(f8_levels)} of its 126 "
        "positive values still land between 0 and 1, packed toward zero where the values are. Each typical "
        "value keeps its few percent of precision. For a float format, one large outlier costs much less "
        "than the integer picture suggests.",
        "The outliers still do damage, just elsewhere: inside the scores, as the next figures show. A "
        "separate scale for every block of 128 rows also helps, because an outlier then stretches only its "
        "own block's scale.",
    ])
    figure("p23", st("The format has one scale"),
           "One scale per tensor crushes an integer grid; a float grid keeps most of its values", yb + 30, b + [body],
           esc("The crowding-onto-a-few-levels story is exactly right for integers, and the next atlas works "
               "it through in full ({{ref:v04-o035}}). For FP8 the real damage comes from what large values do "
               "to the sums."))


# ---- p24: rotations keep dot products -------------------------------------------------------------------------
def p24():
    th = math.radians(30)
    c, s = math.cos(th), math.sin(th)
    rot = lambda v: (v[0] * c - v[1] * s, v[0] * s + v[1] * c)
    q, k = (3, 4), (1, 2)
    q2, k2 = rot(q), rot(k)
    dot_ = lambda a, b: a[0] * b[0] + a[1] * b[1]
    assert abs(dot_(q, k) - 11) < 1e-12 and abs(dot_(q2, k2) - 11) < 1e-12
    assert abs(math.hypot(*q2) - 5) < 1e-12 and f(c, 3) == "0.866"
    O, S = (150, 262), 32
    P = lambda v: (O[0] + v[0] * S, O[1] - v[1] * S)
    b = [hd(40, 46, "Turn both arrows by 30°: lengths, angle and dot product stay put")]
    b.append(tline(O[0] - 40, O[1], O[0] + 6 * S, O[1], "axis"))
    b.append(tline(O[0], O[1] + 20, O[0], O[1] - 5.5 * S, "axis"))
    for v, var, lab, dx in ((q, "--u", "q = (3, 4)", 8), (k, "--u", "k = (1, 2)", 8),
                            (q2, "--m", "q turned", -8), (k2, "--m", "k turned", -8)):
        x, y = P(v)
        b.append(f'<line x1="{O[0]}" y1="{O[1]}" x2="{x:.1f}" y2="{y:.1f}" stroke="var({var})" stroke-width="2"/>')
        b.append(dot(x, y, 3, var))
        b.append(txt(x + dx, y - 6, lab, "sub2 halo", "start" if dx > 0 else "end"))
    tx = 330
    rows = [f"(1, 0) turned by 30° lands on ({f(c, 3)}, {f(s, 3)})",
            f"(0, 1) turned by 30° lands on ({f(-s, 3)}, {f(c, 3)})",
            "q turned = 3 × the first + 4 × the second",
            f"            = ({f(q2[0], 3)}, {f(q2[1], 3)})",
            f"k turned = 1 × the first + 2 × the second = ({f(k2[0], 3)}, {f(k2[1], 3)})",
            f"before: q · k = 3×1 + 4×2 = {dot_(q, k):g}",
            f"after: {f(q2[0], 3)}×({f(k2[0], 3)}) + {f(q2[1], 3)}×{f(k2[1], 3)} = {f(dot_(q2, k2), 3)}"]
    for i, r in enumerate(rows):
        b.append(txt(tx, 92 + i * 24, r, "sub2"))
    body, yb = prose(O[1] + 50, [
        "A rotation turns every arrow by the same angle about the origin. Where it sends (1, 0) and (0, 1) "
        "says everything: those two landing points, (0.866, 0.5) and (−0.5, 0.866) for 30°, are called the "
        "cosine and sine of the angle, and any other arrow lands on the same mix of them as before. Turned "
        "together, two arrows keep their lengths and the angle between them, so their dot product, 11 here, "
        "does not change.",
        "A score is a dot product of a row of Q with a row of K. Multiply every row of both by the same "
        "rotation M and every score is unchanged: (QM)(KM)ᵀ = QKᵀ. In matrix language that is M Mᵀ = I, "
        "the identity, and a matrix with that property is called orthogonal. In 128 dimensions there are "
        "far more ways to turn, but the arithmetic is the same.",
    ])
    figure("p24", st("smears each loud coordinate"),
           "A rotation turns arrows without changing the angle between them", yb + 30, b + [body],
           esc("The licence for the trick: the attention scores cannot tell whether Q and K were rotated. What "
               "the rotation does change is how each vector's size is shared among its coordinates."))


# ---- p25: spreading the outlier --------------------------------------------------------------------------------
def p25():
    H4 = fp8.hadamard(4)
    spike = H4 @ np.array([10.0, 0, 0, 0])
    assert np.allclose(spike, [5, 5, 5, 5]) and round(math.sqrt(128), 1) == 11.3
    errs = []
    M = fp8.rotation()
    assert np.allclose(M @ M.T, np.eye(128))
    for seed in range(5):
        Q, K = fp8.outlier_case(seed)
        errs.append((fp8.score_error(Q, K), fp8.score_error(Q, K, M)))
    before = np.mean([e[0] for e in errs])
    after = np.mean([e[1] for e in errs])
    assert round(100 * before, 1) == 3.8 and round(100 * after, 2) == 0.57 and 6 < before / after < 7
    Q, K = fp8.outlier_case(0)
    row, row_r = Q[0], Q[0] @ M
    assert abs(np.linalg.norm(row) - np.linalg.norm(row_r)) < 1e-9
    top = np.abs(row).max()
    b = [hd(40, 46, "One row of Q, coordinate by coordinate, before and after the rotation (same scale)")]
    for k, (title, vec, y0, cls) in enumerate((("before: two channels 20 times the rest", row, 70, "h"),
                                              ("after: the same length, spread over all 128", row_r, 178, "s"))):
        b.append(txt(40, y0, title, "cap"))
        mid = y0 + 52
        for c in range(128):
            x = 40 + c * (600 / 128)
            h = 40 * vec[c] / top
            b.append(f'<rect x="{x:.1f}" y="{min(mid, mid - h):.1f}" width="{600 / 128 - 1:.2f}" height="{max(abs(h), 0.6):.1f}" '
                     f'fill="var(--{cls}-fill)" stroke="var(--{cls})" stroke-width="0.4"/>')
        b.append(tline(40, mid, 640, mid, "axis"))
    ye = 178 + 52 + 66
    b.append(txt(40, ye, "error in the scores, one scale per tensor, E4M3", "cap"))
    SC = 380 / before
    b.append(hbar(220, ye + 12, before * SC, 24, "h", f"before: {100 * before:.1f}%", 120))
    b.append(hbar(220, ye + 44, after * SC, 24, "s", f"after: {100 * after:.2f}%", 120))
    body, yb = prose(ye + 104, [
        "In transformers a few channels of Q and K run far larger than the rest, and they run large in "
        "every token. Then each score, a sum of 128 products, is carried by the two or three products of "
        "those channels. Rounding each number to E4M3 costs it up to a few percent, so the score inherits "
        "a few percent of error from those two products, and nothing averages it away.",
        "A Hadamard matrix is a rotation built from +1s and −1s: on four numbers it turns (10, 0, 0, 0) into "
        "(5, 5, 5, 5). Applied with random signs at d = 128, it spreads a spike s across all 128 coordinates "
        "at ±s ÷ 11.3, and the score becomes a sum of 128 comparable products. Their rounding errors are "
        "independent and partly cancel, while the products themselves add up to the same score as before.",
        f"Simulated with two channels 20 times larger in both Q and K, one scale per tensor, d = 128: the "
        f"scores' error falls from {100 * before:.1f}% to {100 * after:.2f}%, {before / after:.1f} times "
        "smaller. Without outlier channels the rotation changes nothing, because there was nothing to spread.",
    ])
    figure("p25", st("rotations cancel inside"),
           "Spreading an outlier channel across all 128 lets rounding errors cancel", yb + 30, b + [body],
           esc("Both rows have the same length, and every score they make is unchanged; only how the size is "
               "shared among coordinates differs. The simulation illustrates the mechanism, averaged over five "
               "random draws; the paper's own measurement is in the next figure."))


# ---- o076: what it bought -----------------------------------------------------------------------------------------
def o076():
    rmse = dict(baseline=2.4e-2, fa3=9.1e-3, no_block=9.3e-3, no_rotation=2.4e-2)   # FA3 Table 3, FP8 (e4m3)
    assert round(rmse["baseline"] / rmse["fa3"], 1) == 2.6
    frac = 740e12 / H100_PEAK
    assert round(100 * frac) == 75
    b = [hd(40, 46, "Error against an exact reference: FlashAttention 3's own test, FP8")]
    SC = 380 / rmse["baseline"]
    rows = [("per-tensor scale, no rotation", rmse["baseline"], "h"),
            ("version 3: block scales and rotation", rmse["fa3"], "s"),
            ("without the block scales", rmse["no_block"], "s"),
            ("without the rotation", rmse["no_rotation"], "h")]
    for k, (lab, v, cls) in enumerate(rows):
        y = 66 + k * 34
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(hbar(250, y + 2, v * SC, 24, cls, f"{v * 1e3:.1f} × 10⁻³", 120))
    y2 = 66 + 4 * 34 + 28
    b.append(hd(40, y2, "Speed on an H100"))
    speed = [("FP16, against version 2", "1.5 to 2.0 times faster"),
             ("FP16, best case", f"740 trillion a second: {100 * frac:.0f}% of peak"),
             ("FP8", "close to 1.2 quadrillion a second")]
    for k, (lab, v) in enumerate(speed):
        y = y2 + 24 + k * 24
        b.append(txt(40, y, lab, "cap"))
        b.append(txt(250, y, v, "sub2"))
    body, yb = prose(y2 + 24 + 3 * 24 + 26, [
        "The paper filled Q, K and V with ordinary numbers plus, in one entry in a thousand, an extra one ten "
        "times larger, and measured the root-mean-square error of the attention output against a 64-bit "
        "reference. With one scale per tensor and no rotation the error was 2.4 × 10⁻²; with both fixes, "
        "9.1 × 10⁻³, 2.6 times lower.",
        "Its ablation says which fix did the work in that test: dropping the block scales barely moved the "
        "error, while dropping the rotation put it straight back to the baseline. In 16 bits, version 3 runs "
        "1.5 to 2.0 times faster than version 2 and reaches 740 trillion operations a second; in FP8 it "
        "climbs close to 1.2 quadrillion.",
    ])
    figure("o076", st("cuts the numerical error by 2.6"), "Making FP8 attention numerically safe", yb + 30,
           b + [body],
           esc("Bars to scale. Measured by the authors on their own test distribution: the 2.6 is the honest "
               "headline, and the ablation is the more useful number."))


def section():
    from common import section as sec
    sec("s16", f"Part {PART['fp8']}", "Eight bits",
        "Version 3's other contribution: attention in FP8, and what it takes to keep the error down.")


if __name__ == "__main__":
    for job in (section, o075, p22, n01, p23, p24, p25, o076):
        job()
