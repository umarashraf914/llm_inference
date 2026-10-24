"""V3 Part 12, Blackwell and FlashAttention 4: §5d merge 77+78; §5a items 15 and 20; §5f caveats (27:35,
29:13, 30:23); review #26 to #31, and one extra figure (n02, where the speed-ups hold).

  o077  asymmetric scaling, per clock per multiprocessor (merges o078)                       (25:05)
  o079  at head dimension 128 the exponentials take as long as both matrix multiplies (#26)  (26:15)
  o080  e to any power is a power of two times a short polynomial (#27)                      (26:48)
  p28   skipping the rescale gives the same answer: the worked row with a stale maximum       (27:26)
  p29   the copy engine moves data; tensor memory keeps it                                    (28:06)
  p30   two thread blocks, one multiply, half the staging                                     (28:26)
  p31   the compiler's speed sets the pace of every experiment                                (28:52)
  n02   the speed-ups hold from 4,000 tokens up, in BF16, against named baselines            (29:13)
  o081  the climb, as ranges, with the ceilings under it (rebuilt)                            (29:47)

Sources, each read: FlashAttention-4 (arXiv 2603.05451): §2.2 per-clock rates, TMEM, 2-CTA; Table 1 (forward
cycles), eq. (4)-(5) and Table 2 (the polynomial), §3.1.4 (tau), Table 3 (backward cycles), Table 4 (compile
times), §5 (speed-ups, settings). FlashAttention 3 (arXiv 2407.08608) for 740 TFLOP/s and FA2's 35% on H100;
FlashAttention 2 (arXiv 2307.08691) for 25-40% and 50-73% on A100. CUDA programming guide, compute capability
table (registers and shared memory per SM for 10.0); NVIDIA's CUDA GPUs list (B200 is 10.0).

  python3 figures/V03/src/fa4.py
"""
import numpy as np
from common import *  # noqa: F401,F403

STEPS, ANSWER = online(ROW_X, ROW_V)
STALE, ANSWER4 = online(ROW_X, ROW_V, TAU)
assert abs(ANSWER - ANSWER4) < 1e-12 and not STALE[1]["fired"] and STEPS[1]["fired"]


# ---- o077: asymmetric scaling (merges o078) -------------------------------------------------------------
def o077():
    units = [("tensor cores: BF16 operations", H100_MMA_PER_CLK, B200_MMA_PER_CLK),
             ("multi-function unit: exponentials", MUFU_PER_CLK, MUFU_PER_CLK),
             ("shared memory: bytes read", SMEM_BYTES_PER_CLK, SMEM_BYTES_PER_CLK)]
    assert B200_MMA_PER_CLK == 2 * H100_MMA_PER_CLK
    assert round(B200_MMA_PER_CLK * B200_SMS * B200_CLOCK / 1e15, 2) == 2.24   # FA4: "2.25 PFLOPS"
    b = [hd(40, 46, "Per clock, per multiprocessor: H100 against B200 (each pair to its own scale)")]
    y = 74
    for lab, h, bw in units:
        b.append(txt(40, y, lab, "cap"))
        SC = 150 / h
        for k, (chip, v) in enumerate((("H100", h), ("B200", bw))):
            yy = y + 10 + k * 30
            b.append(txt(60, yy + 17, chip, "sub2"))
            b.append(cell(120, yy, v * SC, 24, "u" if chip == "H100" else ("s" if v > h else "h"),
                          label=f"{v:,} per clock"))
        b.append(txt(640, y + 10 + 47, "doubled" if bw > h else "unchanged", "sub2", "end"))
        y += 10 + 2 * 30 + 26
    body, yb = prose(y + 6, [
        "From the H100 to the B200 the tensor cores' BF16 throughput rises from about 1 quadrillion operations "
        "a second to 2.25 quadrillion. Per multiprocessor per clock they exactly double, 4,096 to 8,192; more "
        "multiprocessors supply most of the rest. The multi-function unit that computes exponentials does not grow at "
        "all, and neither does the rate at which a multiprocessor reads its own shared memory.",
        "When one unit gets faster and its neighbours do not, the bottleneck moves rather than disappearing. "
        "On the B200 the forward pass becomes limited by the exponentials and the backward pass by "
        "shared-memory reads, which in the version 4 paper's own estimate now exceed the matrix-multiply "
        "time by 25 to 60% for typical attention shapes.",
        "A kernel balanced for the H100 is unbalanced on the B200 without a line of it changing. That is why "
        "each generation of this hardware has needed its own version of the kernel.",
    ])
    figure("o077", st("From the H100 to the B200"), "Asymmetric hardware scaling", yb + 30, b + [body],
           esc("Tri Dao's group calls this asymmetric hardware scaling, and it changes the job: raising "
               "tensor-core utilisation stops being the lever. Per-clock rates from the version 4 paper."))


# ---- o079: the tie (#26) ----------------------------------------------------------------------------------
def o079():
    d = M = N = 128
    rows = [("H100", "matrix multiplies", 4 * M * N * d / H100_MMA_PER_CLK, "s"),
            ("H100", "exponentials", M * N / MUFU_PER_CLK, "m"),
            ("B200", "matrix multiplies", 4 * M * N * d / B200_MMA_PER_CLK, "s"),
            ("B200", "exponentials", M * N / MUFU_PER_CLK, "m"),
            ("B200", "shared-memory reads", 3 * M * N * d / 8192, "u")]     # FA4 eq. (2), Table 1
    assert [r[2] for r in rows] == [2048, 1024, 1024, 1024, 768]
    assert B200_MMA_PER_CLK // MUFU_PER_CLK == 512 == 4 * d
    ratio = lambda dd: (4 * M * N * dd / B200_MMA_PER_CLK) / (M * N / MUFU_PER_CLK)
    assert ratio(128) == 1 and ratio(64) == 0.5 and ratio(256) == 2      # the tile size cancels: d / 128
    b = [hd(40, 46, "Cycles on one multiprocessor for a 128 × 128 tile of scores, head dimension 128")]
    SC = 400 / 2048
    y = 68
    for k, (chip, lab, v, cls) in enumerate(rows):
        if k == 2:
            y += 12
        if k in (0, 2):
            b.append(txt(40, y + 17, chip, "cap"))
        b.append(txt(100, y + 17, lab, "sub2"))
        b.append(cell(250, y, v * SC, 24, cls, label=f"{v:,.0f}"))
        y += 32
    y += 14
    b.append(eq(40, y, 600, "per score: 1 exponential, and 4d = 512 tensor-core operations;   "
                            "B200 per clock: 8,192 ÷ 16 = 512", "u", 36))
    body, yb = prose(y + 36 + 36, [
        "Every score needs one exponential, plus its share of the two matrix multiplies: 2d operations for its "
        "entry of S = QKᵀ and 2d more when its weight multiplies a row of V. At head dimension 128 that is "
        "512 operations, and 512 is exactly the B200's ratio: 8,192 tensor-core operations per clock per "
        "multiprocessor against 16 exponentials.",
        "So on the B200 the exponentials take as long as both matrix multiplies, 1,024 cycles each for this "
        "tile. On the H100 the same tile took 2,048 cycles of multiplies, and the exponentials' 1,024 hid "
        "inside them ({{fig:v03-p21}}). The tile's size cancels out: the ratio is d/128 for any tile, so the "
        "head dimension sets it, and at d = 64 the exponentials would take twice as long as the multiplies.",
        "With no slack left, everything else the softmax does lands on the critical path. Version 4 answers "
        "twice: it computes some exponentials another way, with a polynomial on otherwise idle cores, and it "
        "skips most rescales.",
    ])
    figure("o079", st("delivers about 16"), "At head dimension 128, the exponentials take as long as the matrix "
           "multiplies", yb + 30, b + [body],
           esc("Bars to scale. Cycle counts from version 4's own roofline (its Table 1); the H100 rows use the "
               "H100's 4,096 operations per clock. Shared memory is left out for the H100, whose smaller tiles "
               "read their operands differently."))


# ---- o080: the polynomial (#27) ---------------------------------------------------------------------------------
def minimax_cubic():
    """Remez exchange for 2^f on [0, 1] with p(0) = 1 fixed, minimising the largest relative error, as
    FA4 §3.1.3 does with Sollya. Returns the coefficients of f, f^2, f^3 and the error curve's extreme."""
    xs = np.array([0.15, 0.45, 0.8, 1.0])
    grid = np.linspace(0, 1, 100001)
    for _ in range(25):
        A = np.column_stack([xs, xs ** 2, xs ** 3, [(-1) ** i * 2 ** x for i, x in enumerate(xs)]])
        a1, a2, a3, _E = np.linalg.solve(A, 2 ** xs - 1)
        err = (1 + a1 * grid + a2 * grid ** 2 + a3 * grid ** 3) / 2 ** grid - 1
        ext = [i for i in range(1, len(grid) - 1) if (err[i] - err[i - 1]) * (err[i + 1] - err[i]) <= 0]
        ext.append(len(grid) - 1)
        sel = []
        for i in ext:
            if sel and np.sign(err[i]) == np.sign(err[sel[-1]]):
                if abs(err[i]) > abs(err[sel[-1]]):
                    sel[-1] = i
            else:
                sel.append(i)
        xs = grid[sel[-4:]]
    return (a1, a2, a3), float(np.abs(err).max()), grid, err


def bf16(v):
    """Round to the nearest BF16 value (8 significant bits)."""
    e = math.floor(math.log2(abs(v)))
    step = 2.0 ** (e - 7)
    return round(v / step) * step


def o080():
    (a1, a2, a3), emax, grid, err = minimax_cubic()
    x = 1.7
    y = x * math.log2(math.e)
    k, fr = math.floor(y), y - math.floor(y)
    p = 1 + fr * (a1 + fr * (a2 + fr * a3))                  # Horner: three multiply-adds
    approx, exact = 2 ** k * p, math.exp(x)
    assert (round(y, 4), k, round(fr, 4)) == (2.4526, 2, 0.4526)
    assert f(p, 4) == "1.3684" and f(2 ** fr, 4) == "1.3685" and f(approx, 4) == "5.4735" and f(exact, 4) == "5.4739"
    assert bf16(approx) == bf16(exact) == 5.46875              # the same BF16 number either way
    assert 8.5e-5 < emax < 8.7e-5 and round(2 ** -8 / emax) == 46   # FA4 Table 2's degree-3: 8.77e-5
    b = [hd(40, 46, "Computing e^1.7 without the exponential unit")]
    rows = [("1  change base", "e^1.7 = 2^(1.7 × log₂e) = 2^2.4526", "one multiplication, which the score scaling can absorb"),
            ("2  split", "2^2.4526 = 2² × 2^0.4526", "a whole power, and a fraction between 0 and 1"),
            ("3  whole part", "2² goes straight into the exponent field", "a shift and an integer add on the exponent bits"),
            ("4  fraction", f"1 + {f(a1, 4)}f + {f(a2, 4)}f² + {f(a3, 4)}f³ = {f(p, 4)}",
             f"three multiply-adds; the true value is {f(2 ** fr, 4)}"),
            ("5  combine", f"4 × {f(p, 4)} = {f(approx, 4)}", f"e^1.7 = {f(exact, 4)}; in BF16 both are 5.46875")]
    for j, (step, what, why) in enumerate(rows):
        yy = 76 + j * 44
        b.append(txt(40, yy, step, "cap"))
        b.append(txt(150, yy, what, "hd"))
        b.append(txt(150, yy + 18, why, "sub2"))
    # the cubic's relative error on [0, 1], to scale
    y0 = 76 + 5 * 44 + 26
    b.append(hd(40, y0, "The cubic's relative error across the whole fraction range, to scale"))
    X0, X1, YM, H = 150, 620, y0 + 70, 46               # +-1e-4 maps to +-H
    b.append(tline(X0, YM, X1, YM, "tick"))
    for lab, v in (("+1 × 10⁻⁴", 1e-4), ("−1 × 10⁻⁴", -1e-4)):
        b.append(dashed(X0, YM - v / 1e-4 * H, X1, YM - v / 1e-4 * H, "--rule"))
        b.append(txt(X0 - 8, YM - v / 1e-4 * H + 4, lab, "sub2", "end"))
    pts = [(X0 + g * (X1 - X0), YM - e / 1e-4 * H) for g, e in zip(grid[::500], err[::500])]
    b.append(poly(pts, "--s", 2))
    for g, lab in ((0, "f = 0"), (1, "f = 1")):
        b.append(txt(X0 + g * (X1 - X0), YM + H + 20, lab, "sub2", "middle"))
    body, yb = prose(YM + H + 52, [
        "Version 4 computes some exponentials without the multi-function unit, in five steps. A power of two "
        "splits cleanly into a whole power and a fractional one. The whole power needs no floating-point arithmetic: "
        "floating-point numbers store a power of two in their exponent field ({{fig:v02-o086}}), so 2² is an "
        "addition to that field.",
        "Only the fraction needs approximating, and only between 0 and 1, where a cubic does it closely. The "
        f"cubic here is fitted to make its worst relative error as small as possible: {emax / 1e-5:.1f} × 10⁻⁵, "
        f"and the paper's own cubic reaches 8.8 × 10⁻⁵. BF16 rounds every result to within 2⁻⁸ = 3.9 × 10⁻³ anyway, "
        f"{2 ** -8 / emax:.0f} times coarser, so after rounding the two paths agree to within one BF16 step on "
        "99% of inputs (the paper's measurement).",
        "The polynomial runs on the CUDA cores, which this kernel otherwise leaves idle. It costs registers, "
        "so only 10 to 25% of each row's exponentials take this path, tuned to the tile; the rest stay on "
        "the multi-function unit, and the two run side by side.",
    ])
    figure("o080", st("a short polynomial runs on the CUDA"), "e to any power is a power of two times a short "
           "polynomial", yb + 30, b + [body],
           esc("The trick is range reduction, a classical one in the libraries that compute exponentials: shrink "
               "the problem to a small interval where a polynomial is easy, then put the scale back exactly."))


# ---- p28: the stale maximum (#28) ------------------------------------------------------------------------------
def p28():
    s1, s2, t2 = STEPS[0], STEPS[1], STALE[1]
    rise = s2["m"] - s1["m"]
    doublings = rise / math.log(2)
    assert rise == 2 and round(doublings, 2) == 2.89 and doublings < 8 and 2 ** 8 == 256
    assert round(t2["l"] / s2["l"], 3) == round(t2["O"] / s2["O"], 3) == round(math.e ** 2, 3)
    assert max(t2["terms"]) < 256 and f(t2["l"], 2) == "11.83" and f(t2["O"], 1) == "463.6"
    b = [hd(40, 46, "The worked row's second tile, scores 5, 4 and 1, taken two ways")]
    X1, X2 = 400, 640
    b.append(txt(X1, 80, "every rise rescales (versions 1–3)", "sub2", "end"))
    b.append(txt(X2, 80, "rescale only past 8 doublings (version 4)", "sub2", "end"))
    tf = lambda ts, d=3: ", ".join(f(t, d) for t in ts)
    rows = [("after tile 1: maximum, sum, output", f"3,  {f(s1['l'], 3)},  {f(s1['O'], 2)}", "the same"),
            ("tile 2's maximum is 5: keep which?", "move to 5", f"keep 3: a rise of {f(doublings, 1)} doublings"),
            ("old sum and output multiplied by", f"e⁻² = {f(s2['c'], 4)}", "nothing"),
            ("tile 2's terms", tf(s2["terms"]), tf(t2["terms"])),
            ("sum l", f"{f(s2['l'], 4)}", f"{f(t2['l'], 2)}"),
            ("output O", f"{f(s2['O'], 2)}", f"{f(t2['O'], 1)}"),
            ("answer O ÷ l", f"{f(ANSWER, 2)}", f"{f(ANSWER4, 2)}")]
    for k, (lab, a, z) in enumerate(rows):
        y = 106 + k * 26
        b.append(txt(40, y, lab, "cap"))
        b.append(txt(X1, y, a, "sub2", "end"))
        b.append(txt(X2, y, z, "sub2", "end"))
    body, yb = prose(106 + 7 * 26 + 24, [
        "Version 4 computes in powers of two, so its threshold τ = 8 counts doublings: the running maximum may "
        "fall behind the true one by up to a factor of 2⁸ = 256 before a rescale fires. In the worked row the "
        f"maximum rises from 3 to 5, a factor of e² = {f(math.e ** 2, 2)}, under 3 doublings. So version 4 "
        "keeps 3, multiplies nothing, and takes tile 2's terms against the stale 3: e², e¹ and e⁻², larger "
        "than 1 but nowhere near 256.",
        f"Its sum and output both come out {f(math.e ** 2, 2)} times larger than in the left column, the same "
        "factor in each, and the final division cancels it: 39.18 either way. Nothing can overflow, because "
        "no term exceeds 256 and an FP32 sum can hold numbers up to 3.4 × 10³⁸.",
        "The paper says only that the skipped rescales save significant work. The figure of about ten times "
        "fewer rescales comes from Tri Dao's Hot Chips talk rather than from the paper. The widget in "
        "{{fig:v03-p16}} has this rule as a checkbox.",
    ])
    figure("p28", st("eight doublings"), "Skipping the rescale gives the same answer", yb + 30, b + [body],
           esc("The online softmax only ever needed the maximum to be close enough to keep the terms in range, "
               "not to be the true one. The true one is applied once, in the final division."))


# ---- p29: tensor memory (#29) -------------------------------------------------------------------------------------
def p29():
    tile = 128 * 128 * 4                                     # one 128 x 128 tile in FP32
    tmem = 256 * 1024
    assert tile == 64 * 1024 and 4 * tile == tmem            # two output tiles + two score tiles fill TMEM
    regs = 64 * 1024 * 4                                     # 64K 32-bit registers per SM (CC 10.0)
    assert regs == tmem
    b = [hd(40, 46, "One B200 multiprocessor, and the two ways a tile gets near the tensor cores")]
    b.append(box(40, 90, 110, 64, "u", "HBM", "off the chip"))
    b.append(cont(184, 64, 456, 248, "u", "one multiprocessor"))
    b.append(box(206, 106, 150, 56, "h", "TMA copy engine", "moves tiles in"))
    b.append(box(206, 190, 150, 56, "m", "shared memory", "up to 228 KB"))
    b.append(box(398, 106, 220, 56, "s", "tensor cores", "BF16 multiply-adds"))
    b.append(box(398, 190, 220, 56, "s", "tensor memory, TMEM", "256 KB, new on Blackwell"))
    b.append(box(206, 262, 412, 26, "u", "registers, 256 KB: the warps' own working values", rx=4))
    b.append(arr(152, 122, 202, 130))
    b.append(arr(281, 164, 281, 186))
    b.append(arr(360, 212, 394, 140))
    b.append(arr(470, 164, 470, 186))
    b.append(arr(546, 186, 546, 166))
    b.append(txt(40, 346, "TMEM in version 4's forward pass: four 64 KB tiles, FP32, fill it exactly", "hd"))
    labs = ["output 1", "output 2", "scores → weights 1", "scores → weights 2"]
    for k, lab in enumerate(labs):
        b.append(cell(40 + k * 150, 360, 146, 30, "s" if k < 2 else "m", label=lab))
    b.append(txt(40, 410, "1 and 2 are the two blocks of 128 query rows that the kernel works on in turn", "sub2"))
    body, yb = prose(448, [
        "Blackwell adds a memory beside the tensor cores: tensor memory, TMEM, 256 KB per multiprocessor, as "
        "large as the register file. The tensor cores write their results into it directly and "
        "asynchronously. On the H100 a matrix multiply's result went into the issuing warps' registers, "
        "which the kernel then had to keep free.",
        "The TMA from {{fig:v02-o035}} is a copy engine: it moves tiles from HBM into shared memory. TMEM is "
        "a place to keep data, next to the units that make and use it. Version 4's forward pass keeps two "
        "output tiles there and two tiles of scores, which softmax turns into weights in place and the next "
        "multiply reads straight back.",
    ])
    figure("p29", st("tensor memory or TMEM"), "The copy engine moves data; tensor memory keeps it", yb + 30,
           b + [body],
           esc("Sizes per multiprocessor: TMEM and its use from the version 4 paper; registers and shared memory "
               "from CUDA's table for compute capability 10.0, the B200's, the same as the H100's."))


# ---- p30: 2-CTA (#30) ---------------------------------------------------------------------------------------------------
def p30():
    one = dict(operands=2048, dS=256, exchange=0, dQ=1024)       # FA4 Table 3, cycles per CTA, M = N = d = 128
    two = dict(operands=1536, dS=256, exchange=384, dQ=512)
    mma = 2560
    t1, t2 = sum(one.values()), sum(two.values())
    assert (t1, t2) == (3328, 2688)
    assert round(100 * (t1 / mma - 1)) == 30 and round(100 * (t2 / mma - 1)) == 5 and round(100 * (1 - t2 / t1)) == 19
    assert two["dQ"] * 2 == one["dQ"]
    b = [hd(40, 46, "Operand B for one multiply, staged once per block or shared by a pair")]
    b.append(cont(40, 62, 280, 112, "u", "1-CTA: one block"))
    b.append(box(58, 100, 110, 56, "m", "its A rows", "128"))
    b.append(box(186, 100, 116, 56, "h", "all of B", "staged here"))
    b.append(cont(360, 62, 280, 112, "u", "2-CTA: a pair, one multiply"))
    b.append(box(378, 100, 116, 56, "m", "block 1", "128 rows, half B"))
    b.append(box(506, 100, 116, 56, "m", "block 2", "128 rows, half B"))
    y0 = 214
    b.append(hd(40, y0, "Shared-memory cycles per block, one backward step (bars to scale)"))
    X0, SC = 120, 500 / t1
    parts = [("operands", "u"), ("dS", "m"), ("exchange", "h"), ("dQ", "s")]
    for k, (lab, dd, tot) in enumerate((("1-CTA", one, t1), ("2-CTA", two, t2))):
        y = y0 + 20 + k * 40
        b.append(txt(40, y + 18, lab, "cap"))
        x = X0
        for name, cls in parts:
            w = dd[name] * SC
            if w:
                b.append(cell(x, y, w - 1, 26, cls, label=f"{dd[name]:,}" if w > 30 else None))
                x += w
        b.append(txt(x + 8, y + 18, f"{tot:,}", "sub2"))
    xm = X0 + mma * SC
    b.append(dashed(xm, y0 + 12, xm, y0 + 20 + 80 + 4, "--s"))
    b.append(txt(xm, y0 + 20 + 80 + 20, f"matrix multiplies: {mma:,}", "sub2", "middle"))
    ky = y0 + 20 + 80 + 46
    key = [("operand reads", "u"), ("writing dS", "m"), ("swapping half of dS", "h"), ("dQ out and back", "s")]
    for k, (lab, cls) in enumerate(key):
        b.append(cell(40 + k * 152, ky - 10, 12, 12, cls))
        b.append(txt(58 + k * 152, ky, lab, "sub2"))
    body, yb = prose(ky + 40, [
        "In 2-CTA mode two thread blocks on neighbouring multiprocessors drive one matrix multiply of 256 "
        "rows. Each keeps its own 128 rows of A and its own slice of the result, and stages only half of "
        "operand B; the hardware reads both halves for the one multiply. A single copy of the shared data "
        "serves both blocks.",
        f"In the backward pass, where shared memory is the wall, the paper's cycle count per block falls from "
        f"{t1:,} to {t2:,}, against {mma:,} cycles of matrix multiply: from 30% over the tensor cores' time to "
        "5%. Operand B's share of the reads halves, and so does the traffic for the gradient dQ; swapping "
        "half of the dS tile with the partner adds a new 384. The total falls 19%: the halving is of those "
        "terms, not of the whole.",
        "Both bars already count the backward pass's use of TMEM, which holds two of the ten matrix operands "
        "so they need not be read from shared memory at all.",
    ])
    figure("p30", st("in a mode NVIDIA calls"), "Two thread blocks, one multiply, half the staging", yb + 30,
           b + [body],
           esc("Cycle counts from version 4's Table 3, at M = N = d = 128. Halving dQ's traffic also halves "
               "the global atomic additions that sum it, which are slow and make results vary run to run."))


# ---- p31: CuTe DSL (#31) ------------------------------------------------------------------------------------------------------
def p31():
    times = [("forward kernel", 55, 2.5), ("backward kernel", 45, 1.4)]   # FA4 Table 4, seconds
    assert [round(a / z) for _, a, z in times] == [22, 32]
    runs = 200                                                             # illustrative "hundreds"
    assert round(runs * 55 / 3600, 1) == 3.1 and round(runs * 2.5 / 60, 1) == 8.3
    b = [hd(40, 46, "Seconds to compile one kernel (bars to scale)")]
    SC = 440 / 55
    y = 66
    for lab, a, z in times:
        b.append(txt(40, y + 14, lab, "cap"))
        b.append(txt(60, y + 40, "C++ templates (v3)", "sub2"))
        b.append(cell(190, y + 24, a * SC, 22, "h", label=f"{a:g} s"))
        b.append(txt(60, y + 68, "CuTe DSL (v4)", "sub2"))
        b.append(hbar(190, y + 52, z * SC, 22, "s", f"{z:g} s"))
        y += 96
    body, yb = prose(y + 16, [
        "Version 4 is written entirely in CuTe DSL, NVIDIA's language for kernels embedded in Python, where "
        "earlier versions were C++ templates. It gives up no reach: it lowers to PTX, the same intermediate "
        "code C++ kernels compile to, and lets hand-written PTX through where needed. But a kernel compiles in seconds: 22 times "
        "faster for the forward kernel, 32 times for the backward.",
        f"A kernel at this level is tuned by changing something, rebuilding and measuring, hundreds of times "
        f"over. {runs} rebuilds of the forward kernel cost {runs * 55 / 3600:.1f} hours of compiling at 55 "
        f"seconds each and {runs * 2.5 / 60:.0f} minutes at 2.5. The speed of the compiler becomes the speed "
        "of every experiment.",
    ])
    figure("p31", st("Python embedded language"), "The compiler's speed sets the pace of every experiment",
           yb + 30, b + [body],
           esc("Compile times from the version 4 paper's Table 4, one kernel each; the 200 rebuilds are "
               "illustrative. Versions 2 and 3 also precompile hundreds of kernels, one per attention variant."))


# ---- n02: where the speed-ups hold ---------------------------------------------------------------------------------------
def n02():
    lens = [1, 2, 4, 8, 16, 32]                   # thousands of tokens, the paper's sweep
    X0, X1 = 120, 620
    xp = lambda k: X0 + math.log2(k) / 5 * (X1 - X0)
    b = [hd(40, 46, "Sequence lengths the paper benchmarks, and where it claims a lead")]
    y = 112
    b.append(tline(X0, y, X1, y, "tick"))
    for k in lens:
        b.append(tline(xp(k), y - 4, xp(k), y + 4, "tick"))
        b.append(txt(xp(k), y + 22, f"{k}k", "sub2", "middle"))
    b.append(cell(xp(4), 66, xp(32) - xp(4), 30, "s", label="consistently ahead of every baseline"))
    b.append(ghost(X0, 66, xp(4) - X0 - 4, 30, label="no consistent lead"))
    b.append(txt(40, y + 4, "tokens", "cap"))
    rows = [("against cuDNN 9.13", "1.1 to 1.3 times faster", "NVIDIA's own attention library, tuned for the B200"),
            ("against Triton", "2.1 to 2.7 times faster", "the open-source kernel language much of the field uses"),
            ("measured as", "forward pass, BF16, B200", "head dimension 64, 128 or (192, 128); 32k tokens a batch")]
    for k, (lab, v, what) in enumerate(rows):
        yy = 170 + k * 40
        b.append(txt(40, yy, lab, "cap"))
        b.append(txt(200, yy, v, "hd"))
        b.append(txt(200, yy + 17, what, "sub2"))
    body, yb = prose(170 + 3 * 40 + 22, [
        "The gains are real but regime specific. The paper sweeps sequence lengths from 1k to 32k tokens, "
        "sizing the batch so that 32k tokens are processed at once, and claims a consistent lead over every baseline from 4k up. "
        "Version 4's BF16 forward pass runs 1.1 to 1.3 times faster than cuDNN 9.13 and 2.1 to 2.7 "
        "times faster than Triton.",
        "Below 4,000 tokens it claims no consistent lead. The paper also notes that later cuDNN releases have "
        "taken up many of these techniques and now perform about the same.",
    ])
    figure("n02", st("are real, but regime"), "The lead is claimed from 4,000 tokens up", yb + 30, b + [body],
           esc("A speed-up is a sentence with conditions attached: a range of lengths, a precision, a pass, and "
               "a baseline with a version number."))


# ---- o081: the climb, rebuilt (§5a item 20) ------------------------------------------------------------------------
def o081():
    rows = [("version 1", "A100", 312, 0.25, 0.40, "s"),
            ("version 2", "A100", 312, 0.50, 0.73, "s"),
            ("version 2", "H100", 989, 0.35, 0.35, "h"),
            ("version 3", "H100, FP16", 989, 740 / 989, 740 / 989, "s"),
            ("version 4", "B200, BF16", 2250, 1605 / 2250, 1605 / 2250, "s")]
    assert round(100 * 740 / 989) == 75 and round(100 * 1605 / 2250) == 71 and round(2250 / 312, 1) == 7.2
    X0, X1 = 200, 480
    sc = lambda p: X0 + p * (X1 - X0)
    b = [hd(40, 46, "Fraction of peak, on the chip each version was built for")]
    b.append(txt(575, 64, "trillion operations a second", "sub2", "middle"))
    b.append(txt(510, 80, "ceiling", "sub2"))
    b.append(txt(640, 80, "reached", "sub2", "end"))
    b.append(dashed(sc(0.75), 84, sc(0.75), 92 + 5 * 34 - 4, "--m"))
    for k, (ver, chip, ceil, lo, hi, cls) in enumerate(rows):
        y = 92 + k * 34
        b.append(txt(40, y + 16, ver, "cap"))
        b.append(txt(110, y + 16, chip, "sub2"))
        b.append(f'<rect x="{X0}" y="{y}" width="{X1 - X0}" height="22" rx="3" fill="none" '
                 f'stroke="var(--rule)" stroke-dasharray="3 3"/>')
        w = sc(hi) - sc(lo)
        b.append(cell(sc(lo), y, w, 22, cls) if w > 6 else cell(sc(lo) - 3, y, 6, 22, cls))
        lab = f"{100 * lo:.0f}–{100 * hi:.0f}%" if hi > lo else f"{100 * lo:.0f}%"
        b.append(txt(sc(lo) - 8, y + 16, lab, "sub2", "end") if lo > 0.45 else txt(sc(hi) + 8, y + 16, lab, "sub2"))
        b.append(txt(510, y + 16, f"{ceil:,}", "sub2"))
        got = (f"{lo * ceil:,.0f}–{hi * ceil:,.0f}" if hi > lo else f"{lo * ceil:,.0f}")
        b.append(txt(640, y + 16, got, "sub2", "end"))
    yz = 92 + 5 * 34
    for p in (0, 0.5, 0.75, 1):
        b.append(tline(sc(p), yz, sc(p), yz + 4))
        b.append(txt(sc(p), yz + 18, f"{100 * p:.0f}%", "sub2", "middle"))
    body, yb = prose(yz + 56, [
        "Fraction of peak, the measure this atlas has tracked since {{fig:v03-p03}}, for each version on the "
        "chip it was built for. On the A100 the first two versions climbed from 25–40% to 50–73%. On the H100, "
        "version 2, which used none of its new hardware, fell to 35%, and version 3 brought it back to "
        "75%. On the B200, version 4 reaches about 1,605 trillion operations a second (the paper's "
        "abstract says up to 1,613), 71% of the peak.",
        "The ceiling underneath grew 7.2 times from the A100 and more than doubled from the H100, yet the "
        "fraction has held near three quarters, the dashed line. It is held there by the same three costs: "
        "the exponentials, the rescales and the backward pass's shared-memory traffic.",
        "Every number on the last two rows is 16-bit: FP16 for version 3, BF16 for version 4. In FP8, version 3 "
        f"reached close to 1.2 quadrillion a second (Part {PART['fp8']}).",
    ])
    figure("o081", st("Measured the same way"), "The climb, and where it plateaus", yb + 30, b + [body],
           esc("Ranges are drawn as ranges: each paper reports a span over sequence lengths and settings, not one "
               "number. The fraction makes chips comparable; the column on the right is what a user gets."))


def drop_o078_note():
    """o078 is merged into o077 and leaves the order (atlas_build.py drop); its file stays."""


if __name__ == "__main__":
    for job in (o077, o079, o080, p28, p29, p30, p31, n02, o081):
        job()
