"""V9 Part 5, inside prefill (stop 2): N11 (4-bit values and the block scale), N12 (the scale applied
inside the multiply), N13 (FlashAttention-4), N14 (tensor parallelism), N15 (8 of 384 experts),
N16 (the all-to-all), and Fig 7 rebuilt as the assembly. plans/depth_pass/V09_review.md §4 E, §5 Fig 7.

  python3 figures/V09/src/prefill.py    writes items n11 n12 n13 n14 n15 n16 o007

Sources: NVIDIA's PTX ISA documents the block-scaled multiply as D = (A × scale_A) × (B × scale_B) + C,
with NVFP4 (kind::mxf4nvf4, e2m1 values, ue4m3 scales, scale_vec::4X) taking one scale per 16 values
and both operands in 4 bits. Kimi K2's published config.json (Hugging Face): 384 routed experts, 1
shared, 8 per token, 61 layers, 64 heads, latent rank 512 plus 64 rotary dims, vocabulary 163,840.
"""
import random
from math import comb
from common import SRT, box, cell, ghost, txt, hd, ln, para, stamp, emit, width, f, n


# ---- N11: the E2M1 format and one block ----------------------------------------------------------------
def e2m1(c):
    """Decode a 4-bit code: 1 sign, 2 exponent, 1 mantissa bit, bias 1, exponent 0 subnormal."""
    s, e, m = c >> 3, (c >> 1) & 3, c & 1
    v = m * 0.5 if e == 0 else 2 ** (e - 1) * (1 + m / 2)
    return -v if s else v


CODES = {c: e2m1(c) for c in range(16)}
GRID = sorted(set(CODES.values()))
assert len(GRID) == 15 and GRID[-1] == 6 and [v for v in GRID if v >= 0] == [0, 0.5, 1, 1.5, 2, 3, 4, 6]
CODE_OF = {v: c for c, v in sorted(CODES.items(), reverse=True)}       # +0 gets code 0000
BLOCK = [0.012, -0.031, 0.071, -0.090, 0.005, 0.044, -0.017, 0.026,
         -0.058, 0.009, -0.002, 0.038, -0.065, 0.021, 0.050, -0.040]
SCALE = max(abs(w) for w in BLOCK) / 6
assert len(BLOCK) == 16 and abs(SCALE - 0.015) < 1e-15


def quant(w):
    y = w / SCALE
    d = sorted((abs(g - y), g) for g in GRID)
    assert d[1][0] - d[0][0] > 0.02, f"{w} is too close to a tie"        # no ambiguous rounding
    q = d[0][1]
    return y, q, q * SCALE, abs(w - q * SCALE)


Q = [quant(w) for w in BLOCK]
WORKED = {"a": 0, "b": 1, "c": 2}
assert [round(Q[i][0], 2) for i in WORKED.values()] == [0.8, -2.07, 4.73]
assert [Q[i][1] for i in WORKED.values()] == [1, -2, 4]
assert max(range(16), key=lambda i: Q[i][3]) == 2 and round(Q[2][3], 3) == 0.011    # c errs most
BITS = (16 * 4 + 8) / 16
assert BITS == 4.5

# ---- N12: the scale factors out of the sum --------------------------------------------------------------
QW, QX, SW, SX = [3, -1.5, 0.5, 2], [1, 2, -4, 0.5], SCALE, 0.25
assert all(v in GRID for v in QW + QX)
W = [SW * q for q in QW]
Xa = [SX * r for r in QX]
DIRECT = sum(a * b for a, b in zip(W, Xa))
CODESUM = sum(a * b for a, b in zip(QW, QX))
FACTORED = SW * SX * CODESUM
assert CODESUM == -1 and abs(DIRECT - FACTORED) < 1e-15 and abs(FACTORED + 0.00375) < 1e-15

# ---- N15, N16: experts and the all-to-all ---------------------------------------------------------------
E, K, GPUS, TOK = 384, 8, 8, 64
PER = E // GPUS
_rng = random.Random(9)
LIT = sorted(_rng.sample(range(E), K))
SEND = [[0] * GPUS for _ in range(GPUS)]
for src in range(GPUS):
    for t in range(TOK):
        for d in {e // PER for e in _rng.sample(range(E), K)}:
            SEND[src][d] += 1
COPIES = sum(map(sum, SEND))
LOCAL = sum(SEND[i][i] for i in range(GPUS))
DESTS = COPIES / (GPUS * TOK)
EXPECT = GPUS * (1 - comb(E - PER, K) / comb(E, K))
assert len({e // PER for e in LIT}) >= 6 and min(map(min, SEND)) > 0
assert abs(DESTS - EXPECT) < 0.1 and abs(LOCAL / COPIES - 1 / GPUS) < 0.02
assert round(100 * K / E, 1) == 2.1 and 30 / 1000 == 0.03


def n11():
    b = [hd(40, 46, "The fifteen values a 4-bit float can hold, and where three weights land")]
    YL, X0, U = 128, 46, 49                       # the number line: x of value v is X0 + (v + 6) * U
    xv = lambda v: X0 + (v + 6) * U
    b.append(ln(xv(-6), YL, xv(6), YL, "axis"))
    for v in GRID:
        b.append(ln(xv(v), YL, xv(v), YL + 6, "tick"))
        if v >= 0 or v <= -2:
            lab = f(v, 1)
            b.append(txt(xv(v), YL + 20, lab[:-2] if lab.endswith(".0") else lab, "sub2", "middle"))
    for name, i in WORKED.items():
        y, q, _, _ = Q[i]
        b.append(f'<line class="conn" x1="{xv(y):.1f}" y1="{YL - 24}" x2="{xv(q):.1f}" y2="{YL - 4}" marker-end="url(#arw)"/>')
        b.append(f'<circle cx="{xv(y):.1f}" cy="{YL - 28}" r="3.5" fill="var(--paper)" stroke="var(--m)" stroke-width="1.5"/>')
        b.append(txt(xv(y), YL - 38, f"{name}: {f(y, 2)}", "sub2", "middle"))
    b.append(txt(40, YL + 44, "the negatives mirror the positives; ±0 are one value, so 16 codes give 15 values", "sub2"))
    yb0 = YL + 76
    b.append(txt(40, yb0 + 4, "One block of 16 weights, as the model trained them", "cap"))
    CW, CG = 68, 6
    for i, w in enumerate(BLOCK):
        r, c = divmod(i, 8)
        tag = next((k + "  " for k, j in WORKED.items() if j == i), "")
        cls = "m" if tag else "u"
        b.append(cell(40 + c * (CW + CG), yb0 + 16 + r * 34, CW, 26, cls, label=f"{tag}{f(w, 3)}"))
    yb1 = yb0 + 16 + 2 * 34 + 8
    b.append(txt(40, yb1 + 6, f"largest magnitude 0.090 ÷ 6 = {f(SCALE, 3)}: the block's scale", "sub2"))
    yt = yb1 + 44
    cols = [(40, "weight"), (110, "÷ 0.015"), (196, "nearest value"), (300, "stored code"),
            (396, "rebuilt: value × 0.015"), (560, "error")]
    for x, s_ in cols:
        b.append(txt(x, yt, s_, "sub2"))
    for k, (name, i) in enumerate(WORKED.items()):
        y, q, back, err = Q[i]
        yy = yt + 22 + k * 22
        row = [f"{name}  {f(BLOCK[i], 3)}", f(y, 2), f(q, 0) if q == int(q) else f(q, 1),
               f"{CODE_OF[q]:04b}", f(back, 3), f(err, 3)]
        for (x, _), s_ in zip(cols, row):
            b.append(txt(x, yy, s_, "cap"))
    ys = yt + 22 + 3 * 22 + 10
    b.append(txt(40, ys, f"stored: 16 codes × 4 bits + one 8-bit scale = 72 bits, {f(BITS, 1)} bits a weight", "sub2"))
    body, yb = para(ys + 46, [
        "A 4-bit float has one sign bit, two exponent bits and one mantissa bit ({{fig:v04-o028}}). Its "
        "sixteen codes decode to fifteen values, because +0 and −0 are the same number: 0, 0.5, 1, 1.5, "
        "2, 3, 4 and 6, and their negatives. The gaps widen as the values grow.",
        "Trained weights are far smaller than 6, so each block of 16 shares one scale: the block's "
        "largest magnitude divided by 6, here 0.090 ÷ 6 = 0.015 ({{fig:v04-o034}}). Each weight is "
        "divided by the scale, rounded to the nearest of the fifteen values, and that value's 4-bit code "
        "is stored beside the scale ({{fig:v04-o075}}).",
        "Weight c lands at 4.73, in the wide gap between 4 and 6, and rounds down to 4. Rebuilt, it is "
        "0.060, off by 0.011, the largest error in the block. Counting the scale, the block costs 4.5 bits "
        "a weight ({{fig:v04-o058}}).",
    ])
    emit("n11", stamp(SRT, "4-bits wide. Each block of 16 weights"),
         "Four bits give fifteen values, and one scale per block stretches them to fit",
         yb + 30, b + [body],
         "Fifteen values are enough because the shared scale moves them to wherever the block's weights "
         "live. Weights illustrative; in practice the scale is itself stored as an 8-bit float, so it is "
         "rounded slightly too.")


def n12():
    b = [hd(40, 46, "Four of a block's sixteen terms, worked both ways")]
    X0, CW, CG = 250, 70, 8
    rows = [("weight values, q", QW, "u", None), ("weights, s × q, s = 0.015", W, "u", None),
            ("activation values, r", QX, "u", None), ("activations, t × r, t = 0.25", Xa, "u", None)]
    y = 64
    for k, (lab, vals, c, note) in enumerate(rows):
        if k == 2:
            y += 14
        b.append(txt(40, y + 18, lab, "cap"))
        for j, v in enumerate(vals):
            s_ = f(v, 4).rstrip("0").rstrip(".") if v != int(v) else f(v, 0)
            b.append(cell(X0 + j * (CW + CG), y, CW, 26, c, label=s_))
        if note:
            b.append(txt(X0 + 4 * (CW + CG) + 6, y + 18, note, "sub2"))
        y += 34
    terms = [a * c_ for a, c_ in zip(W, Xa)]
    t1 = " ".join(([f(terms[0], 5).rstrip("0")] + [("− " if t < 0 else "+ ") + f(abs(t), 5).rstrip("0") for t in terms[1:]]))
    t2 = " ".join(([f(QW[0] * QX[0], 0)] + [("− " if a * c_ < 0 else "+ ") + f(abs(a * c_), 0) for a, c_ in zip(QW[1:], QX[1:])]))
    y += 20
    b.append(txt(40, y + 18, "way 1: multiply the rebuilt numbers", "cap"))
    b.append(txt(X0 + 16, y + 18, f"{t1} = {f(DIRECT, 5)}", "sub2"))
    y += 34
    b.append(txt(40, y + 18, "way 2: multiply the 4-bit values", "cap"))
    b.append(txt(X0 + 16, y + 18, f"{t2} = {f(CODESUM, 0)}, then × 0.015 × 0.25 = {f(FACTORED, 5)}", "sub2"))
    y += 64
    b.append(hd(40, y, "The same thing for all sixteen terms, built up"))
    eqs = [("Σ (s × q) × (t × r)", 168, "u"), ("=", 0, ""), ("Σ s × t × q × r", 168, "u"), ("=", 0, ""),
           ("s × t × Σ q × r", 168, "s")]
    x = 40
    for s_, w, c in eqs:
        if w:
            b.append(cell(x, y + 16, w, 36, c, rx=6, label=s_))
            x += w
        else:
            b.append(txt(x + 14, y + 38, s_, "sub2", "middle"))
            x += 28
    assert x <= 640
    notes = [(124, "32 rebuilds, 16 products"), (320, "reorder the factors"), (516, "16 products on 4-bit values,")]
    for xx, s_ in notes:
        b.append(txt(xx, y + 72, s_, "sub2", "middle"))
    b.append(txt(516, y + 88, "then 2 by the scales", "sub2", "middle"))
    body, yb = para(y + 132, [
        "One number of a matrix multiply's output is a row of weights times the activations, multiplied "
        "pair by pair and added ({{fig:v01-o085}}). In a block of 16, every weight is its 4-bit value "
        "times the block's scale, and so is every activation, because this chip's 4-bit rate needs both "
        "sides in 4 bits ({{fig:v04-o056}}).",
        "Factors can be multiplied in any order, and a factor shared by every term comes out of a sum: "
        "s·a + s·b = s·(a + b). So the 16 products can be taken on the 4-bit values themselves, and the "
        "two scales applied once to the block's partial sum. The answer is identical: −0.00375 both ways.",
        "That is what applying the scale as the multiply runs means. NVIDIA documents the instruction as "
        "D = (A × scale A) × (B × scale B) + C, with one scale for every 16 values, and the running total "
        "C kept at higher precision ({{fig:v02-o079}}). Weight-only 4-bit works the other way: it "
        "expands every weight back to 16 bits before multiplying ({{fig:v04-o057}}).",
    ])
    emit("n12", stamp(SRT, "The matrix multiply instruction applies"),
         "The scale factors out of the block's sum, so the multiply runs on the 4-bit values", yb + 30,
         b + [body],
         "The scale never touches an individual weight. It is applied once per block of sixteen, which is "
         "how the weights stay four bits wide until the instant they are multiplied.")


def n13():
    b = [hd(40, 46, "Four versions of one exact kernel, each fixing the constraint the last exposed")]
    steps = [("the score matrix goes out to memory", "and back, at every layer", "v1: build it tile by tile",
              "on chip, never store it", "v03-o037"),
             ("scalar work sits between the", "matrix multiplies", "v2: do less of it, and split",
              "the work across more blocks", "v03-o065"),
             ("copying and multiplying", "take turns", "v3: asynchronous units", "run them at the same time",
              "v03-o072"),
             ("Blackwell's tensor cores: 2.25×", "faster; its exponential unit: not", "v4: some exponentials by",
              "polynomial, on idle cores", "v03-o079")]
    y = 66
    for k, (p1, p2, f1, f2, ref) in enumerate(steps):
        b.append(f'<g class="h"><rect x="40" y="{y}" width="250" height="50" rx="6"/>'
                 f'<text class="sub" x="165" y="{y + 18}" text-anchor="middle" dominant-baseline="central">{p1}</text>'
                 f'<text class="sub" x="165" y="{y + 34}" text-anchor="middle" dominant-baseline="central">{p2}</text></g>')
        b.append(f'<line class="conn" x1="296" y1="{y + 25}" x2="330" y2="{y + 25}" marker-end="url(#arw)"/>')
        b.append(f'<g class="s"><rect x="336" y="{y}" width="200" height="50" rx="6"/>'
                 f'<text class="sub" x="436" y="{y + 18}" text-anchor="middle" dominant-baseline="central">{f1}</text>'
                 f'<text class="sub" x="436" y="{y + 34}" text-anchor="middle" dominant-baseline="central">{f2}</text></g>')
        b.append(txt(548, y + 30, f"{{{{fig:{ref}}}}}", "sub2"))
        for s_ in (p1, p2):
            assert width(s_, "sub") + 24 <= 250, s_
        for s_ in (f1, f2):
            assert width(s_, "sub") + 24 <= 200, s_
        if k < 3:
            b.append(f'<line class="conn" x1="436" y1="{y + 54}" x2="200" y2="{y + 72}" marker-end="url(#arw)"/>')
        y += 76
    b.append(txt(40, y + 6, "result: about 71% of the tensor cores' peak on a B200 ({{fig:v03-o081}})", "sub2"))
    assert 8192 / 16 == 512
    body, yb = para(y + 50, [
        "Attention scores every earlier token against the current one, turns the scores into shares with "
        "softmax, and blends the tokens' values by those shares ({{fig:v03-o021}}). A kernel is one "
        "function the GPU runs over many blocks of threads at once ({{fig:v03-o004}}), and FlashAttention "
        "fuses all of attention into one, so the scores never leave the chip ({{fig:v03-o033}}).",
        "Each version solved the bottleneck the previous one exposed. On Blackwell the tensor cores do "
        "8,192 operations a cycle against 16 exponentials, a gap of 512 times, so version 4 computes "
        "some exponentials with a short polynomial on cores that were otherwise idle, and rescales "
        "less often ({{fig:v03-o080}}).",
        "Version 4, the attention kernel written for Blackwell, is the one this request's prefill runs.",
    ])
    emit("n13", stamp(SRT, "Flash attention 4, the attention kernel"),
         "FlashAttention-4 is the same fused kernel, rebuilt around Blackwell's slow exponential", yb + 30,
         b + [body],
         "Every version computes exactly the same attention. What changed each time was which unit the "
         "work was waiting on.")


def n14():
    b = [hd(40, 46, "One layer split across 4 GPUs, schematic: compute, wait, exchange, twice")]
    X0, LH, LP = 110, 24, 34
    att, ffn, AR = [96, 104, 92, 100], [130, 122, 136, 126], 40
    t1 = X0 + max(att)
    t2 = t1 + AR
    t3 = t2 + max(ffn)
    t4 = t3 + AR
    for k in range(4):
        y = 66 + k * LP
        b.append(txt(40, y + 17, f"GPU {k + 1}", "cap"))
        b.append(cell(X0, y, att[k], LH, "m"))
        if att[k] < max(att):
            b.append(ghost(X0 + att[k], y, t1 - X0 - att[k], LH))
        b.append(cell(t1, y, AR, LH, "h"))
        b.append(cell(t2, y, ffn[k], LH, "m"))
        if ffn[k] < max(ffn):
            b.append(ghost(t2 + ffn[k], y, t3 - t2 - ffn[k], LH))
        b.append(cell(t3, y, AR, LH, "h"))
    yb = 66 + 4 * LP
    for xc, s_ in [((X0 + t1) / 2, "attention"), ((t1 + t2) / 2, "all-reduce"), ((t2 + t3) / 2, "feed-forward"),
                   ((t3 + t4) / 2, "all-reduce")]:
        b.append(txt(xc, yb + 10, s_, "sub2", "middle"))
    ym = 66 + 2 * LP - 5
    b.append(f'<line class="conn" x1="{t4 + 8}" y1="{ym}" x2="{t4 + 40}" y2="{ym}" marker-end="url(#arw)"/>')
    b.append(txt(t4 + 48, ym - 6, "next layer:", "sub2"))
    b.append(txt(t4 + 48, ym + 10, f"× 61 = {2 * 61} exchanges", "sub2"))
    assert 2 * 61 == 122
    body, yb2 = para(yb + 52, [
        "Tensor parallelism cuts each weight matrix into slices, one per GPU ({{fig:v05-o009}}). "
        "Attention divides by heads; the feed-forward block cuts its first matrix by columns and its "
        "second by rows. Each GPU ends up holding part of the layer's answer, and an all-reduce adds the "
        "parts and hands every GPU the total ({{fig:v05-o007}}).",
        "Nothing can continue until the slowest GPU has finished and the sum has arrived, so a layer "
        "split this way stops twice ({{fig:v05-o010}}). Through 61 layers that is 122 exchanges in every "
        "forward pass, which is why the split stays on the rack's fast links.",
        "In this model the feed-forward half of nearly every layer is a mixture of experts, which is usually "
        "spread by expert rather than sliced, so its exchange is an all-to-all instead (next two "
        "figures).",
    ])
    emit("n14", stamp(SRT, "Each matrix multiply is split across"),
         "Every layer split across GPUs stops twice for them to add up their partial results", yb2 + 30,
         b + [body],
         "Schematic timings. The dashed gaps are GPUs waiting for the slowest one, and an exchange at "
         "every layer is affordable only on the fastest links in the building.")


def n15():
    b = [hd(40, 46, "One layer's 384 routed experts on 8 GPUs, and the 8 one token is sent to")]
    CS, CG = 12, 3
    for g in range(GPUS):
        gx = 40 + (g % 4) * 152
        gy = 84 + (g // 4) * 124
        b.append(txt(gx, gy - 8, f"GPU {g + 1}", "sub2"))
        for j in range(PER):
            r, c = divmod(j, 8)
            e = g * PER + j
            b.append(f'<g class="{"m" if e in LIT else "u"}"><rect x="{gx + c * (CS + CG)}" '
                     f'y="{gy + r * (CS + CG)}" width="{CS}" height="{CS}" rx="2"/></g>')
    ys = 84 + 2 * 124 - 10
    b.append(cell(40, ys, 117, 26, "s", label="shared expert"))
    b.append(txt(170, ys + 18, "runs for every token, outside the router's choice", "sub2"))
    yh = ys + 66
    b.append(hd(40, yh, "Parameters held against parameters used per token, to scale"))
    SC = 600 / 1000
    b.append(cell(40, yh + 16, 1000 * SC, 26, "u", label="held in memory: about 1,000 billion"))
    b.append(cell(40, yh + 52, 30 * SC, 26, "m"))
    b.append(txt(40 + 30 * SC + 10, yh + 70, "used by one token: about 30 billion, 3%", "sub2"))
    body, yb = para(yh + 126, [
        "An expert is a complete feed-forward network of its own, and a mixture-of-experts layer holds "
        "many of them side by side with a router in front ({{fig:v06-o010}}). The router scores every "
        "expert for each token and keeps the top eight ({{fig:v06-p17}}).",
        "Hundreds, concretely: Kimi K2, a published model with this shape (a trillion parameters, 61 "
        "layers, latent attention, eight experts per token), has 384 routed experts in each layer and one "
        f"shared expert that every token uses ({{{{fig:v06-o015}}}}). Eight of 384 is {f(100 * K / E, 1)}%.",
        "Every expert has to sit in memory, but a token's arithmetic touches only the eight it is sent "
        "to, plus attention and the shared expert: about 30 billion of the trillion parameters "
        "({{fig:v06-o011}}).",
    ])
    emit("n15", stamp(SRT, "Each layer of the model holds hundreds"),
         "Eight of several hundred: a token wakes about 2% of a layer's experts", yb + 30, b + [body],
         "Memory pays for all 384 experts and arithmetic for 8. The eight one token needs sit on "
         "different GPUs, which is the next figure's problem. The placement on 8 GPUs is schematic.")


def n16():
    b = [hd(40, 46, "Tokens each GPU sends to each other GPU in one dispatch, 64 tokens per GPU")]
    X0, Y0, CW, CH, G_ = 160, 88, 50, 26, 4
    b.append(txt(X0 + 4 * (CW + G_) - G_ / 2, Y0 - 24, "to GPU", "sub2", "middle"))
    for j in range(GPUS):
        b.append(txt(X0 + j * (CW + G_) + CW / 2, Y0 - 8, str(j + 1), "sub2", "middle"))
    for i in range(GPUS):
        y = Y0 + i * (CH + G_)
        b.append(txt(40, y + 18, f"from GPU {i + 1}", "cap"))
        for j in range(GPUS):
            b.append(cell(X0 + j * (CW + G_), y, CW, CH, "s" if i == j else "h", label=str(SEND[i][j])))
    yb0 = Y0 + GPUS * (CH + G_)
    b.append(txt(X0, yb0 + 12, f"teal: stays on its own GPU, {n(LOCAL)} of {n(COPIES)} copies "
                 f"({f(100 * LOCAL / COPIES, 1)}%); red: crosses the fabric", "sub2"))
    body, yb = para(yb0 + 56, [
        "A token's eight experts sit on several GPUs, so its vector is copied to every GPU that holds one "
        "of them: dispatch. The experts run, and their answers travel back to the token's own GPU to be "
        "blended: combine ({{fig:v05-o016}}). Every GPU sends to every other, twice in every layer.",
        f"In this random draw a token's eight experts landed on {f(DESTS, 2)} different GPUs on average, "
        "and only about one copy in eight stayed home. The router redraws the pattern for every batch, so "
        "the traffic cannot be planned ahead.",
        "At 0.9 TB/s each way per GPU ({{fig:v09-n03}}) this exchange can stay inside the rack. Spread "
        "across separate machines, it can take over 70% of a mixture-of-experts layer's time "
        "({{fig:v05-o017}}).",
    ])
    emit("n16", stamp(SRT, "The eight experts a token needs sit on"),
         "Eight experts on different GPUs make every GPU send to every other, twice a layer", yb + 30,
         b + [body],
         "No cell is empty: every pair of GPUs trades tokens in every mixture-of-experts layer, so the "
         "slowest link sets the pace. Counts from one random draw, illustrative.")


def o007():
    b = [hd(40, 46, "One layer of the forward pass, in the order this request's tokens meet it")]
    stages = [("weights arrive 4 bits wide", "scaled per 16, inside the multiply", "m", ["v09-n11", "v09-n12"]),
              ("attention: FlashAttention-4", "fused, on chip", "m", ["v09-n13"]),
              ("split across GPUs", "partial results added over NVLink", "h", ["v09-n14"]),
              ("router: 8 of 384 experts", "plus the shared expert", "m", ["v09-n15"]),
              ("all-to-all: dispatch, combine", "every GPU to every other", "h", ["v09-n16"])]
    y = 66
    for k, (t1, t2, c, refs) in enumerate(stages):
        b.append(box(40, y, 300, 46, c, t1, t2, rx=6))
        assert width(t1, "lbl") + 24 <= 300 and width(t2, "sub") + 24 <= 300
        b.append(txt(360, y + 28, "drawn in " + " and ".join(f"{{{{fig:{r}}}}}" for r in refs), "sub2"))
        if k < len(stages) - 1:
            b.append(f'<line class="conn" x1="190" y1="{y + 49}" x2="190" y2="{y + 59}" marker-end="url(#arw)"/>')
        y += 62
    b.append(txt(40, y + 8, "then the same five steps in the next layer", "sub2"))
    body, yb = para(y + 52, [
        "Prefill sends the 100 new tokens through these five steps in each of the 61 layers. Four "
        "episodes' machinery fires in every one: microscaled 4-bit numerics ({{fig:v04-o076}}), a fused attention kernel "
        "({{fig:v03-o079}}), tensor parallelism ({{fig:v05-o009}}) and expert parallelism "
        "({{fig:v05-o016}}).",
        "At the end of the last layer the model's scores for the next token give the first token of the "
        "answer, and every layer has written keys and values for the whole prompt into the cache.",
    ])
    emit("o007", stamp(SRT, "sending to every other."),
         "Four episodes' machinery runs inside one forward pass", yb + 30, b + [body],
         "Each box is a figure above and an episode before. Amber is arithmetic, red is the traffic "
         "the split creates.")


if __name__ == "__main__":
    for fn in (n11, n12, n13, n14, n15, n16, o007):
        fn()
