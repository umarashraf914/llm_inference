"""V4 Parts 10 and 11, choosing and closing (16:51-20:25): review entries 35 (p35), 36 (p36), 37 (p37) and
38 (p38); Fig 77 redrawn to scale with "or FP8" and an accuracy point defined; Fig 78 without the 70B
rule (it belongs to Fig 80, at 19:06) and with a new caption; Fig 80 given distillation; Fig 81 given
Ada, the SmoothQuant-style FP8 recipe and the INT8 exception; Fig 82 given back the communication cost;
Part 11's heading renamed for the recap that now opens it; Figs 78, 79 and 81 restamped.

Sources read: Bengio, Leonard and Courville (2013), "Estimating or Propagating Gradients Through
Stochastic Neurons": the straight-through estimator, "proposed by Hinton (2012) in his lecture 15b".
Hinton, Vinyals and Dean (2015), "Distilling the Knowledge in a Neural Network". NVIDIA A100 datasheet:
FP16 Tensor 312 TFLOPS, INT8 Tensor 624 TOPS (dense). NVIDIA Ada architecture whitepaper: FP8 Tensor
Cores (RTX 4090, L4, L40S class). SmoothQuant (Xiao et al.): W8A8 INT8, measured on A100-80GB, up to
1.56x.

  python3 figures/V04/src/part10_close.py
"""
import math
import numpy as np
from common import emit, hd, cell, box, text, tick, hline, ln, rect, dot, poly, prose, f, fi, nb, MINUS, esc, st, OUT
from fixes import reprose, apply


def restamp(name, old, phrase):
    apply([(name, f"&nbsp;&middot;&nbsp; {old}</div>", f"&nbsp;&middot;&nbsp; {st(phrase)}</div>")])


# ---- Fig 77: to scale ---------------------------------------------------------------------------------------
def o077():
    K, x0 = 18, 280                                          # pixels per accuracy point
    assert f(100 / 78, 1) == "1.3"
    b = [hd(40, 40, "Accuracy points lost on hard reasoning benchmarks, to scale")]
    b.append(text(40, 80, "Hundreds of billions", "cap"))
    b.append(text(40, 98, "of parameters, NVFP4", "sub2"))
    b.append(rect(x0, 66, 1 * K, 28, "s", rx=3))
    b.append(text(x0 + K + 10, 85, "within about one point of BF16 or FP8", "sub2"))
    b.append(text(40, 140, "Under about 50 billion,", "cap"))
    b.append(text(40, 158, "plain post-training", "sub2"))
    b.append(text(40, 174, "quantization", "sub2"))
    b.append(rect(x0 + 4 * K, 126, 10 * K, 28, "h", rx=3))
    b.append(text(x0 + 14 * K + 10, 145, "4 to 14 points", "sub2"))
    ya = 196
    b.append(hline(x0, x0 + 14 * K, ya))
    for p in range(0, 15, 2):
        b.append(tick(x0 + p * K, ya, ya + 5))
        b.append(text(x0 + p * K, ya + 19, str(p), "sub2", "middle"))
    b.append(text(x0 + 14 * K, ya + 37, "points lost", "sub2", "end"))
    body, y = prose(ya + 76, [
        "You would guess the biggest models are the hardest to squeeze into four bits. It is the other "
        "way round.",
        "An accuracy point is one percentage point of a benchmark score: a model that answered 78% of the "
        "questions and now answers 77% has lost one point, 1.3% of its score. The small models' loss is "
        "a range across models and benchmarks, so it is drawn as one.",
        "The usual explanation is redundancy: a very large model has enough spare capacity to absorb the "
        "rounding, and a small one does not.",
    ])
    b.append(body)
    emit("o077", st("You would guess the biggest"), "Bigger models squeeze better", y + 26, b,
         "Near-lossless four bits is a large-model story, not a universal one.")


# ---- Fig 78, 79: text and stamps ---------------------------------------------------------------------------
def o078_o079():
    reprose("o078", 178, [
        "Post-training quantization treats the model as finished. Quantization-aware training lets it "
        "adapt to the rounding, at the cost of a training run; {{fig:v04-p35}} shows how a network can "
        "train through a rounding at all. Mixed precision measures which layers suffer most from "
        "rounding and leaves those at higher precision.",
    ], caption="Two ways to spend effort on a small model: change the weights to suit the rounding, or "
               "exempt the layers that suit it least.")
    restamp("o078", "17:20", "quantization aware training where the")
    restamp("o079", "17:35", "Two cautions though")


# ---- p35: quantization-aware training and the straight-through estimator ---------------------------------
def p35():
    STEP, LR, G = 0.5, 0.1, -0.8
    q = lambda w: STEP * round(w / STEP)
    ws = [0.62]
    for _ in range(3):
        ws.append(ws[-1] - LR * G)
    rows = [(w, q(w)) for w in ws]
    assert [f(w, 2) for w in ws] == ["0.62", "0.70", "0.78", "0.86"] and [r[1] for r in rows] == [0.5, 0.5, 1.0, 1.0]
    PX0, PY0, U = 70, 262, 120                                # plot origin (w = 0, y = 0), pixels per unit
    X = lambda w: PX0 + w * U
    Y = lambda v: PY0 - v * U
    b = [hd(40, 30, "Forward, the weight is rounded; backward, the rounding is treated as y = x")]
    b.append(ln(X(0), Y(0), X(1.6), Y(0), "axis"))
    b.append(ln(X(0), Y(0), X(0), Y(1.6), "axis"))
    for v in (0, 0.5, 1, 1.5):
        b.append(tick(X(v), Y(0), Y(0) + 5))
        b.append(text(X(v), Y(0) + 19, f"{v:g}", "sub2", "middle"))
        b.append(f'<line class="tick" x1="{X(0) - 5}" y1="{Y(v)}" x2="{X(0)}" y2="{Y(v)}"/>')
        b.append(text(X(0) - 9, Y(v) + 4, f"{v:g}", "sub2", "end"))
    for g in (0, 0.5, 1.0, 1.5):                              # the staircase, flat between jumps
        lo, hi = max(0, g - 0.25), min(1.6, g + 0.25)
        b.append(poly([(X(lo), Y(g)), (X(hi), Y(g))], "pl-m", 2.5))
    b.append(poly([(X(0), Y(0)), (X(1.6), Y(1.6))], "pl-s", 1.5, dash="5 4"))
    b.append(text(X(1.6) + 6, Y(1.6) + 4, "y = x", "sub2"))
    b.append(text(X(0.8), Y(0) + 38, "the master weight, full precision", "sub2", "middle"))
    b.append(text(40, 56, "the weight the forward pass uses", "sub2"))
    for k, (w, r) in enumerate(rows[:3]):
        b.append(dot(X(w), Y(r), 4, "h"))
    b.append(text(X(0.62) - 10, Y(0.5) - 16, "0.62, 0.70", "sub2", "end"))
    b.append(text(X(0.78) + 6, Y(1.0) - 12, "0.78", "sub2"))
    tx = 360
    b.append(text(tx, 62, "step", "sub2"))
    b.append(text(tx + 50, 62, "master weight", "sub2"))
    b.append(text(tx + 150, 62, "forward uses", "sub2"))
    b.append(text(tx + 238, 62, "update", "sub2"))
    for k, (w, r) in enumerate(rows):
        y = 88 + k * 24
        b.append(text(tx + 8, y, str(k + 1), "cap"))
        b.append(text(tx + 50, y, f(w, 2), "cap"))
        b.append(text(tx + 150, y, f(r, 1), "cap", extra=' style="fill:var(--h-text)"' if r != rows[0][1] else ""))
        if k < 3:
            b.append(text(tx + 238, y, f"+{f(-LR * G, 2)}", "cap"))
    b.append(text(tx, 88 + 4 * 24 + 4, f"gradient {f(G, 1)} each step, learning rate {f(LR, 1)}", "sub2"))
    body, y = prose(Y(0) + 74, [
        "Training moves each weight by its slope: how much the loss changes when the weight moves a little "
        "({{fig:v04-p11}}). Rounding breaks this. Its graph is a staircase, flat between the jumps, so its "
        "slope is 0 almost everywhere; a weight that saw only its rounded value would never be told to "
        "move.",
        "Quantization-aware training keeps a full-precision master copy of every weight. The forward pass "
        "uses the rounded copy, so the loss is the quantized model's own. The backward pass pretends the "
        "rounding was the straight line y = x and hands the gradient straight through to the master copy. "
        "Bengio, Léonard and Courville named this the straight-through estimator in 2013, crediting a 2012 "
        "lecture by Geoffrey Hinton.",
        "In the table the master weight creeps from 0.62 to 0.70 while the forward pass still sees 0.5. "
        "At 0.78 it passes the halfway mark, 0.75, and the weight in use jumps to 1. Small updates add up "
        "in the master copy until they move the rounding.",
    ])
    b.append(body)
    emit("p35", st("trains with the rounding baked in"),
         "Quantization-aware training rounds going forward and pretends it did not going back", y + 26, b,
         "The trick that lets a network learn around its own rounding: round on the way forward, look "
         "straight through it on the way back.")


# ---- Fig 80: distillation, the 70B rule, a pointer to p36 ---------------------------------------------------
def o080():
    apply([("o080", ">quantization-aware training, not raw PTQ</text>",
            ">quantization-aware training or distillation, not raw PTQ</text>")])
    reprose("o080", 392, [
        "W4 A16 is the safest and most widely deployed win: roughly four times smaller than FP16 and "
        "faster decode on almost any GPU. {{fig:v04-p36}} reads the 80% test with numbers.",
        "Below about 70 billion parameters, do not ship four bits straight from post-training "
        "quantization: budget for quantization-aware training ({{fig:v04-p35}}) or distillation from the "
        "full-precision model ({{fig:v04-p37}}), and keep the sensitive layers at higher precision.",
        "Above all, measure on your own benchmarks. Published numbers are model-specific and "
        "benchmark-specific.",
    ])


# ---- p36: the 80% rule in numbers -----------------------------------------------------------------------
def p36():
    W, BW = 140e9, 3.35e12
    t_min = W / BW
    r50, r100 = W / 0.050, W / 0.100
    assert f(1000 * t_min, 1) == "41.8" and f(r50 / 1e12, 1) == "2.8" and f(100 * r50 / BW, 0) == "84"
    assert f(r100 / 1e12, 1) == "1.4" and f(100 * r100 / BW, 0) == "42" and f(0.8 * BW / 1e12, 2) == "2.68"
    K, x0 = 110, 220                                           # pixels per TB/s
    b = [hd(40, 30, "Achieved bandwidth = bytes moved in a step ÷ the time the step took")]
    b.append(text(40, 56, "a 70-billion-parameter model in 16 bits reads 140 GB of weights per decode step", "sub2"))
    rows = [("step takes 50 ms", r50, "s", f"140 GB ÷ 0.050 s = 2.8 TB/s, {f(100 * r50 / BW, 0)}% of peak"),
            ("step takes 100 ms", r100, "h", f"140 GB ÷ 0.100 s = 1.4 TB/s, {f(100 * r100 / BW, 0)}% of peak")]
    Y0 = 104
    for k, (lab, r, cls, note) in enumerate(rows):
        y = Y0 + k * 58
        b.append(text(40, y + 18, lab, "cap"))
        b.append(rect(x0, y, r / 1e12 * K, 26, cls, rx=2))
        b.append(text(x0, y + 44, note, "sub2"))
    yb, yt = Y0 - 10, Y0 + 58 + 26 + 6
    xp, x80 = x0 + 3.35 * K, x0 + 0.8 * 3.35 * K
    b.append(f'<line class="mark" x1="{xp:.1f}" y1="{yb}" x2="{xp:.1f}" y2="{yt}"/>')
    dash = 'stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 3"'
    b.append(f'<line x1="{x80:.1f}" y1="{yb}" x2="{x80:.1f}" y2="{Y0 - 2}" {dash}/>')      # the bar crosses it
    b.append(f'<line x1="{x80:.1f}" y1="{Y0 + 28}" x2="{x80:.1f}" y2="{yt}" {dash}/>')
    b.append(text(x80 - 4, yb + 6, "80% of peak: 2.68 TB/s", "sub2", "end"))
    b.append(text(xp + 4, yb + 6, "peak 3.35", "sub2"))
    body, y = prose(yt + 62, [
        "A profiler reports how many bytes a step moved and how long it took, and their ratio is the "
        "bandwidth it achieved: a count divided by a time ({{fig:v01-o075}}). Decoding one token of a "
        "70-billion-parameter model in 16 bits reads all 140 GB of its weights, so on an H100, at "
        "3.35 TB/s, a step cannot take less than 41.8 ms.",
        "If the step takes 50 ms, it moved 2.8 TB/s, 84% of the peak: memory is the wall, and fewer bytes "
        "per weight, W4 A16, is the fix. If it takes 100 ms, it moved 1.4 TB/s, 42%: the memory sat idle "
        "for more than half the step, so the bottleneck is elsewhere, in arithmetic, in launching many "
        "small kernels or in waiting on other chips, and smaller weights will help less than the bytes "
        "suggest.",
        "Real decode reads the KV cache as well ({{fig:v04-o055}}), so count those bytes too. The 80% line "
        "is a rule of thumb: real kernels rarely reach the full peak.",
    ])
    b.append(body)
    emit("p36", st("bandwidth runs above 80"), "Reading the 80% rule", y + 26, b,
         "The 80% rule is a ratio you can compute from two numbers a profiler gives you.")


# ---- Fig 81: Ada, the FP8 recipe, the INT8 exception -----------------------------------------------------
def o081():
    assert 624 / 312 == 2
    b = [box(40, 58, 190, 74, "s", "FP8", "Hopper, Ada and newer"),
         box(246, 58, 190, 74, "s", "NVFP4", "Blackwell only"),
         box(452, 58, 188, 74, "h", "Older chips", "FP8 and FP4 maths", "buys nothing")]
    body, y = prose(178, [
        "SmoothQuant-style FP8, 8-bit weights and activations with the outliers moved into the weights "
        "({{fig:v04-o064}}), is the proven recipe for compute-bound work, but it pays only where the "
        "tensor cores have an FP8 path: Hopper, and Ada chips such as the L4, L40S and RTX 40 series, and "
        "newer. NVFP4 pays only on Blackwell.",
        "On older chips FP8 and FP4 maths buys nothing, so stay weight-only there. The exception is INT8: "
        "an A100's INT8 tensor cores run 624 trillion operations a second against 312 trillion for FP16, "
        "and SmoothQuant's own W8A8 speed-ups, up to 1.56 times, were measured on A100s.",
        "The memory saving still arrives on any hardware. The maths speed-up does not.",
    ])
    b.append(body)
    emit("o081", st("For computebound speedups"), "Match the format to the silicon", y + 26, b,
         "The single most practical sentence in the subject, and the reason storage format and compute "
         "format had to be separated right at the start.")


# ---- p37: distillation --------------------------------------------------------------------------------------
def p37():
    words = ["cat", "dog", "the", "banana"]
    z = np.array([8.2, 7.1, 3.5, 0.4])
    p = np.exp(z) / np.exp(z).sum()
    shares = [f(100 * v, 2) for v in p]
    assert shares == ["74.49", "24.80", "0.68", "0.03"] and max(p) / min(p) > 50
    L0, L1, x0, PX = -2, 2, 160, 105                         # log10 of a percentage, 0.01% to 100%
    lx = lambda pct: x0 + (math.log10(pct) - L0) * PX
    b = [hd(40, 30, "Two targets for the same next token, on a log scale")]
    groups = [("Ordinary training: the right answer only", [100, 0, 0, 0], "u"),
              ("Distillation: the full-precision model's shares", [100 * v for v in p], "s")]
    y = 60
    for title, vals, cls in groups:
        b.append(text(40, y, title, "cap"))
        for i, (w, v) in enumerate(zip(words, vals)):
            yy = y + 14 + i * 26
            b.append(text(x0 - 12, yy + 14, w, "sub2", "end"))
            if v > 0:
                b.append(rect(x0, yy, lx(v) - x0, 18, cls, rx=2))
                b.append(text(lx(v) + 8, yy + 14, (f(v, 2) if v < 100 else "100") + "%", "sub2"))
            else:
                b.append(text(x0 + 4, yy + 14, "0: no credit at all", "sub2"))
        y += 14 + 4 * 26 + 30
    ya = y - 22
    b.append(hline(x0, x0 + 4 * PX, ya))
    for e, lab in zip(range(-2, 3), ["0.01%", "0.1%", "1%", "10%", "100%"]):
        b.append(tick(x0 + (e - L0) * PX, ya, ya + 5))
        b.append(text(x0 + (e - L0) * PX, ya + 19, lab, "sub2", "middle"))
    body, yy = prose(ya + 58, [
        "The full-precision model's output for the next token is a share for every word ({{fig:v01-o009}}"
        " worked these four): cat 74.49%, dog 24.80%, the 0.68%, banana 0.03%. Ordinary training rewards "
        "only the right answer, as if every other share should be 0.",
        "Distillation trains the quantized model, the student, to match the whole set of shares of the "
        "full-precision model, the teacher. The shares say more than the answer does: that dog was a near "
        "miss, and that banana was absurd. Hinton, Vinyals and Dean called this distilling the knowledge "
        "in a neural network, in 2015.",
        "Here the teacher is the same model before rounding, so the student learns to make its rounded "
        "weights give the original's shares, for every token of the training text. Combined with "
        "quantization-aware training ({{fig:v04-p35}}), that is the budget the advice above sets for "
        "models under about 70 billion parameters.",
    ])
    b.append(body)
    emit("p37", st("distillation from the full"), "Distillation copies the full model's probabilities, not just "
         "its answers", yy + 26, b,
         "The answer is one word. The shares are the model's whole opinion, and the student copies the "
         "opinion.")


# ---- Part 11 heading and p38 -------------------------------------------------------------------------------------
def s11():
    html = ("<div class='sec'><div class='l'>Part 11</div><h2>The bit budget, spent</h2><p>Every method was a plan "
            "for the outlier, and two limits remain.</p></div>")
    (OUT / "s11.html").write_text(html, encoding="utf-8")
    print("s11    heading renamed")


def p38():
    rows = [("Floating point, BF16, E5M2", "spend exponent bits so that a large value fits at all", "o030"),
            ("Group and block scales", "keep it inside its own small group", "o074"),
            ("LLM.int8()", "lift its channels out into a 16-bit multiply", "p22"),
            ("SmoothQuant", "move it from the activations into the weights", "o064"),
            ("AWQ", "protect the weights that its large inputs multiply", "p24"),
            ("GPTQ", "weigh every rounding error by the inputs it meets", "p20"),
            ("QuaRot, SpinQuant", "smear it thinly across every channel", "o067"),
            ("KIVI, KVQuant", "give its key channel a scale of its own", "p30"),
            ("NVFP4", "a finer scale for a smaller block", "p32")]
    b = [hd(40, 30, "What each technique does with the few values far larger than the rest")]
    b.append(text(40, 58, "technique", "sub2"))
    b.append(text(250, 58, "what it does with the outlier", "sub2"))
    b.append(text(640, 58, "built in", "sub2", "end"))
    for i, (tech, what, ref) in enumerate(rows):
        y = 84 + i * 26
        b.append(text(40, y, tech, "cap"))
        b.append(text(250, y, what, "cap"))
        b.append(text(640, y, "{{fig:v04-" + ref + "}}", "sub2", "end"))
    body, y = prose(84 + len(rows) * 26 + 30, [
        "Back to the bit budget ({{fig:v04-o005}}). Quantization spends it well: fewer bits per number "
        "means fewer bytes across the memory wall. And every format and method met along the way was, "
        "one way or another, a plan for handling the outliers: the few values far larger than the rest, "
        "which a shared scale must reach.",
    ])
    b.append(body)
    emit("p38", st("Back to the bit budget"), "Every method here was a plan for the outlier", y + 26, b,
         "One problem, nine answers. Read down the middle column and the atlas retells itself.")


# ---- Fig 82: the communication cost -----------------------------------------------------------------------------
def o082():
    reprose("o082", 263, [
        "One limit is about capacity, the other about waste. Even at four bits the largest models do not "
        "fit on one chip: a model of a few trillion parameters is still terabytes ({{fig:v05-o001}} counts "
        "one). So it must be split across many chips, and you pay for the communication between them. And "
        "for any given token most of the weights contribute almost nothing, which is where mixture of "
        "experts begins.",
    ])


if __name__ == "__main__":
    for fn in (o077, o078_o079, p35, o080, p36, o081, p37, s11, p38, o082):
        fn()
