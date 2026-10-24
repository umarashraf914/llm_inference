"""V8 Part 5, Medusa: heads instead of a drafter (review §4 E1–E7; §5 P5, P10, P21, P22, P25).

  python3 figures/V08/src/spec_medusa.py     writes items a19–a25, o011 and o012, and fixes o010

o010     label fixed: "probabili" restored to "probabilities" (P5)
a19  E1  Two tokenisers cut the same word differently, so there is no q to divide by
a20  E2  A decoding head is one matrix from the hidden state to a score per token
o012     trimmed to the heads (P25): Medusa's heads guess 2, 3, 4 and 5 positions ahead
o011     moved after the heads; redrawn as the tree the mask figure uses; caption fixed (P10)
a21  E3  Top candidates from each head multiply into a tree
a22  E5  Spent as a tree, fourteen positions reach further than a chain of fourteen
a23  E4  Flattened into one sequence, the tree needs a mask that shows each token only its ancestors
a24  E6  Frozen backbone or trained together: over 2.2× against 2.3–3.6×
a25  E7  Typical acceptance lowers the bar where the target is unsure
"""
import math
from spec_common import (cell, ghost, txt, hd, ln, arr, box, prose, emit, at, bar, f, fc, OUT, mulberry32)

E = lambda a, g: (1 - a ** (g + 1)) / (1 - a)


# ---- o010: the truncated label -----------------------------------------------------------------------
def o010():
    p = OUT / "o010.html"
    s = p.read_text(encoding="utf-8")
    old = "because verification compares probabili</text>"
    if old in s:
        s = s.replace(old, "because verification compares probabilities</text>")
        p.write_text(s, encoding="utf-8")
    assert "compares probabilities</text>" in s
    print("o010 label fixed")


# ---- a19 · E1: two tokenisers ------------------------------------------------------------------------
TOKA = [("mis", 2984), ("pred", 28764), ("iction", 2867)]     # GPT-2's tokeniser, 50,257 rows
TOKB = [("mis", 5906), ("prediction", 70031)]                 # GPT-3.5/4's tokeniser (cl100k), 100,277 rows
# Checked with tiktoken: " misprediction" encodes to [2984, 28764, 2867] and [5906, 70031]; the first
# piece of each carries the leading space. "prediction" is not a row of GPT-2's table; "pred" is row
# 28,764 there and row 24,361 in cl100k.
PRED_B = 24361


def a19():
    assert "".join(t for t, _ in TOKA) == "".join(t for t, _ in TOKB) == "misprediction"
    b = [hd(40, 46, "The word ‘misprediction’ through two real tokenisers")]
    X0, CH = 220, 30                                   # px per letter, so the cuts line up with the word
    rows = [("GPT-2's tokeniser", "50,257 rows", TOKA), ("GPT-4's tokeniser", "100,277 rows", TOKB)]
    for r, (lab, size, toks) in enumerate(rows):
        y = 70 + r * 74
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(txt(40, y + 38, size, "sub2"))
        x = X0
        for t, i in toks:
            w = len(t) * CH
            b.append(cell(x + 1, y, w - 2, 28, "m" if r == 0 else "u", label=t))
            b.append(txt(x + w / 2, y + 46, f"row {i:,}", "sub2", "middle"))
            x += w
    b.append(txt(40, 70 + 2 * 74 + 6, "‘prediction’ is no row of GPT-2's table; ‘pred’ is in both, at rows 28,764 and "
                                     f"{PRED_B:,}", "sub2"))
    E8, E6 = E(0.8, 5), E(0.6, 5)
    drop = 1 - E6 / E8
    assert round(E8, 2) == 3.69 and round(E6, 2) == 2.38 and round(drop * 100) == 35
    y2 = 70 + 2 * 74 + 50
    b.append(hd(40, y2, "Drift: tokens per pass with five guesses, to scale"))
    S = 110
    for k, (lab, v) in enumerate([("agreeing, α = 0.8", E8), ("drifted, α = 0.6", E6)]):
        y = y2 + 18 + k * 40
        b.append(txt(40, y + 19, lab, "cap"))
        b.append(cell(X0, y, v * S, 28, "m" if k == 0 else "h", label=f"{v:.2f}"))
    body, yb = prose(y2 + 18 + 2 * 40 + 44, [
        "The acceptance test divides the target's probability for the drafter's token by the "
        "drafter's own, p(x) ÷ q(x). That needs both models to have the same token x. Two real "
        "tokenisers cut ‘misprediction’ differently: GPT-2's into three pieces, GPT-4's into two "
        "({{fig:v01-o006}} shows what a tokeniser does).",
        "If the target's next token is ‘prediction’, a drafter with GPT-2's table has no probability "
        "for it at all, and even a shared piece like ‘pred’ sits at a different row. Without one "
        "shared vocabulary there is nothing to divide.",
        "Drift is the slower failure. When the target is retrained and the drafter is not, they "
        f"agree less and α falls. From 0.8 to 0.6, five guesses yield {E6:.2f} tokens a pass instead "
        f"of {E8:.2f}: {drop * 100:.0f}% fewer.",
    ])
    emit("a19", at("The two models also have to share one vocabulary"),
         "Two tokenisers cut the same word differently, so there is no q to divide by", yb + 30,
         b + [body],
         "A shared vocabulary is a hard requirement and agreement a soft one. Medusa and EAGLE meet "
         "both by drafting with the target's own vocabulary, and lookahead by drafting with the "
         "target itself.")


# ---- a20 · E2: what a decoding head is ------------------------------------------------------------
D_MODEL, VOCAB = 8192, 128000


def a20():
    head = D_MODEL * VOCAB
    med = D_MODEL * D_MODEL + D_MODEL * VOCAB          # Medusa's head: one d×d layer and its own d×V matrix
    assert head == 1_048_576_000 and round(head * 2 / 1e9, 1) == 2.1
    assert round(med / 1e9, 2) == 1.12 and round(med / 70e9 * 100, 1) == 1.6
    b = [hd(40, 46, "Shapes to proportion: 8,192 numbers in, 128,000 scores out")]
    W = 480
    H = W * D_MODEL / VOCAB                            # the matrix, height to width as 8,192 to 128,000
    X0, Y0 = 150, 76
    b.append(txt(40, Y0 + H / 2 + 5, "hidden state", "cap"))
    b.append(cell(X0 - 26, Y0, 12, H, "u", rx=1))
    b.append(txt(X0 - 9, Y0 + H / 2 + 5, "×", "sub2", "middle"))
    b.append(cell(X0, Y0, W, H, "u", label=f"the head: {D_MODEL:,} × {VOCAB:,} = {head / 1e9:.2f} billion weights", rx=2))
    yS = Y0 + H + 34
    b.append(txt(40, yS + 10, f"scores, {VOCAB:,}", "cap"))
    b.append(cell(X0, yS, W, 12, "u", rx=1))
    b.append(txt(X0, yS + 32, "one score per token; softmax turns them into probabilities, and one token is chosen", "sub2"))
    b.append(txt(X0 - 20, Y0 + H + 18, f"{D_MODEL:,}", "sub2", "middle"))
    body, yb = prose(yS + 82, [
        "A model's last step turns the hidden state, the 8,192 numbers its top layer hands up for a "
        "position, into a score for each of its 128,000 tokens: one matrix multiply "
        "({{fig:v01-o103}}), then softmax. That matrix is the decoding head, 8,192 × 128,000 = 1.05 "
        "billion weights, drawn here to its true proportions.",
        "Medusa, from 2024, removes the second model by bolting more heads beside this one. Each "
        "reads the same hidden state, and each is one extra layer plus its own matrix of this same "
        "shape, started as a copy of the model's head and trained to guess a different distance ahead.",
        f"For this 70B shape that is about {med / 1e9:.1f} billion weights a head, {med / 70e9 * 100:.1f}% "
        "of the model each, read on every step: no second model, but not free either.",
    ])
    emit("a20", at("it adds extra decoding heads to the model already running"),
         "A decoding head is one matrix from the hidden state to a score per token", yb + 30, b + [body],
         "Hidden state is the name for the vector that flows up between the layers, the residual "
         "stream of {{ref:v01-o099}}. One matrix turns it into a guess about a token; Medusa simply "
         "asks for more guesses.")


# ---- o012: Medusa's heads ----------------------------------------------------------------------------------
HEADS = [("the model's own head", "1 ahead", ["the"]), ("Medusa head 1", "2 ahead", ["cat", "dog"]),
         ("Medusa head 2", "3 ahead", ["sat", "ran"]), ("Medusa head 3", "4 ahead", ["on", "away"]),
         ("Medusa head 4", "5 ahead", ["the", "a"])]


def o012():
    b = [hd(40, 46, "Every head reads the same hidden state, at the same moment")]
    b.append(box(40, 96, 120, 120, "u", "hidden state", "at the last", "position"))
    for k, (name, ahead, cands) in enumerate(HEADS):
        y = 70 + k * 36
        b.append(arr(166, 156, 196, y + 13))
        b.append(cell(200, y, 190, 26, "u" if k == 0 else "m", label=f"{name}: {ahead}"))
        for j, w in enumerate(cands):
            b.append(cell(410 + j * 66, y, 58, 26, "u", label=w))
    b.append(txt(410, 70 + 5 * 36 + 12, "each head's top picks", "sub2"))
    body, yb = prose(304, [
        "Medusa's extra heads all read the hidden state at the last position. The model's own head "
        "gives the next token; the first extra head guesses the token two positions ahead, the second "
        "three, and so on, all at once, in the same pass. The paper recommends training five heads, "
        "and finds three or four often enough.",
        "But nothing links one head to the next. The head guessing three ahead offers ‘sat’ or "
        "‘ran’ without knowing whether ‘cat’ or ‘dog’ was chosen before it, so a single chain of "
        "guesses would usually break early.",
    ])
    emit("o012", at("The first head guesses the token two positions ahead"),
         "Medusa: extra heads guess 2, 3, 4 and 5 positions ahead from one hidden state", yb + 30,
         b + [body],
         "Several guesses for the price of a few small matrix multiplies, made blind to one another. "
         "The tree that follows is how Medusa makes blind guesses pay.")


# ---- o011: what a tree of guesses is ------------------------------------------------------------------------
TREE = {"the": None, "cat": "the", "dog": "the", "sat": "cat", "ran": "dog"}     # child: parent
ORDER = ["the", "cat", "dog", "sat", "ran"]


def o011():
    b = [hd(40, 46, "A tree: one start, branching into alternatives")]
    pos = {"the": (280, 70), "cat": (150, 132), "dog": (410, 132), "sat": (150, 194), "ran": (410, 194)}
    W_, H_ = 120, 34
    for child, parent in TREE.items():
        if parent:
            (px, py), (cx, cy) = pos[parent], pos[child]
            b.append(ln(px + W_ / 2, py + H_ + 2, cx + W_ / 2, cy - 2))
    for w, (x, y) in pos.items():
        b.append(cell(x, y, W_, H_, "u" if w == "the" else "m", label=w))
    b.append(txt(150 + W_ / 2, 254, "path: the cat sat", "sub2", "middle"))
    b.append(txt(410 + W_ / 2, 254, "path: the dog ran", "sub2", "middle"))
    body, yb = prose(298, [
        "Each path from the top is one possible continuation: ‘the cat sat’ and ‘the dog ran’. A "
        "shared beginning is stored once, so five tokens hold two three-token guesses.",
        "Check the whole tree in one pass, then keep the longest path that survives. A single chain "
        "would have to be abandoned at its first mistake; a tree still has the other branch.",
    ])
    emit("o011", at("Medusa takes the top few candidates from each head"),
         "A tree holds several continuations at once, sharing their beginnings", yb + 30, b + [body],
         "At most one path survives. What branching buys is a better chance that the surviving path "
         "is long; {{ref:v08-a22}} counts how much better.")


# ---- a21 · E3: the tree multiplies ------------------------------------------------------------------------
def a21():
    nodes = {k: sum(k ** i for i in range(1, 5)) for k in (2, 3)}
    paths = {k: k ** 4 for k in (2, 3)}
    assert nodes == {2: 30, 3: 120} and paths == {2: 16, 3: 81}
    b = [hd(40, 46, "Top two picks from each of four heads, every combination allowed")]
    X0, W = 170, 460
    nw, nh = 18, 14
    ys = [72, 106, 140, 174, 208]
    labels = ["the model's own", "head 1: 2 picks", "head 2: 4", "head 3: 8", "head 4: 16"]
    for lev in range(5):
        n = 2 ** lev
        b.append(txt(40, ys[lev] + 11, labels[lev], "cap"))
        for i in range(n):
            cx = X0 + (i + 0.5) * W / n
            if lev:
                pcx = X0 + (i // 2 + 0.5) * W / (n // 2)
                b.append(ln(pcx, ys[lev - 1] + nh + 1, cx, ys[lev] - 1))
            b.append(cell(cx - nw / 2, ys[lev], nw, nh, "u" if lev == 0 else "m", rx=2))
    yt = 260
    for x, h in [(40, "picks per head"), (230, "tokens to check"), (400, "complete paths")]:
        b.append(txt(x, yt, h, "sub2"))
    for r, k in enumerate((2, 3)):
        y = yt + 24 + r * 24
        b.append(txt(40, y, f"top {k}", "cap"))
        terms = " + ".join(str(k ** i) for i in range(1, 5))
        b.append(txt(230, y, f"{terms} = {nodes[k]}", "sub2"))
        b.append(txt(400, y, f"{k}⁴ = {paths[k]}", "sub2"))
    body, yb = prose(yt + 24 + 2 * 24 + 40, [
        "Take each head's top two picks and allow every combination: 2 choices for the next position, "
        "each followed by 2 for the one after, and so on. Four heads give 2 + 4 + 8 + 16 = 30 tokens "
        "to check and 16 complete paths. Top three gives 120 tokens and 81 paths.",
        "Every node is a position in the verification pass, so a tree spends exactly the arithmetic "
        "{{fig:v08-o009}} counted. Medusa therefore prunes it: its published tree keeps 64 nodes, "
        "added one at a time, each the node most likely to be accepted, as measured on sample text.",
    ])
    emit("a21", at("combines them into a tree"),
         "Top candidates from each head multiply into a tree", yb + 30, b + [body],
         "Combinations multiply, so trees are pruned to their likeliest branches. Positions are cheap "
         "at batch one, but they are not free.")


# ---- a22 · E5: tree against chain ----------------------------------------------------------------------------
P1, P2 = 0.6, 0.2                       # illustrative: top pick right 60%, second pick a further 20%


def a22():
    chain = lambda n: sum(P1 ** k for k in range(1, n + 1))
    tree = sum((P1 + P2) ** k for k in range(1, 4))
    c3, c14 = chain(3), chain(14)
    assert round(c14, 2) == 1.50 and round(c3, 2) == 1.18 and round(tree, 2) == 1.95
    r, N, tot = mulberry32(11), 1_000_000, 0
    for _ in range(N):
        d = 0
        while d < 3 and r() < P1 + P2:
            d += 1
        tot += d
    mc = tot / N
    assert abs(mc - tree) < 0.01
    b = [hd(40, 46, "Expected guesses accepted per pass, drawn to scale (illustrative rates)")]
    X0, S = 230, 180
    rows = [("a chain of 3", 3, c3, "u"), ("a chain of 14", 14, c14, "u"), ("a tree of 14: 2 + 4 + 8", 14, tree, "m")]
    for k, (lab, n, v, c) in enumerate(rows):
        y = 70 + k * 44
        b.append(txt(40, y + 19, lab, "cap"))
        b.append(cell(X0, y, v * S, 28, c, label=f"{v:.2f}"))
        b.append(txt(X0 + v * S + 10, y + 19, f"{n} positions", "sub2"))
    body, yb = prose(70 + 3 * 44 + 40, [
        "Assume each head's top pick is right 60% of the time and its second pick a further 20%. A "
        "chain uses top picks only, so its k-th guess survives with chance 0.6 to the power k: a chain "
        f"of 14 expects 0.6 + 0.36 + … = {c14:.2f} accepted guesses, and the last eleven add almost "
        "nothing.",
        "A tree with two picks at each of three levels also has 14 tokens. At every level one of its "
        f"two branches is right with chance 0.8, so it expects 0.8 + 0.64 + 0.512 = {tree:.2f}, "
        f"against {c3:.2f} for a chain three deep. Simulated a million times, the tree reached "
        f"{mc:.2f}.",
    ])
    emit("a22", at("The model verifies the whole tree in one forward pass"),
         "Spent as a tree, fourteen positions reach further than a chain of fourteen", yb + 30,
         b + [body],
         "Illustrative rates, general shape: positions spent on alternatives near the root are worth "
         "more than positions spent far down a single line.")


# ---- a23 · E4: the tree mask --------------------------------------------------------------------------------
def ancestors(w):
    out = []
    while w:
        out.append(w)
        w = TREE[w]
    return set(out)


def a23():
    n = len(ORDER)
    tree_mask = [[1 if ORDER[j] in ancestors(ORDER[i]) else 0 for j in range(n)] for i in range(n)]
    causal = [[1 if j <= i else 0 for j in range(n)] for i in range(n)]
    assert ["".join(map(str, r)) for r in tree_mask] == ["10000", "11000", "10100", "11010", "10101"]
    b = [hd(40, 46, "Row: the token doing the looking. Column: the token it may see.")]
    C = 28
    for g, (title, m, x0) in enumerate([("ordinary causal mask", causal, 110), ("tree mask", tree_mask, 420)]):
        b.append(txt(x0, 78, title, "sub2"))
        for j, w in enumerate(ORDER):
            b.append(txt(x0 + j * C + C / 2, 100, w, "sub2", "middle"))
        for i, w in enumerate(ORDER):
            y = 108 + i * C
            b.append(txt(x0 - 8, y + C / 2 + 4, w, "sub2", "end"))
            for j in range(n):
                wrong = g == 0 and causal[i][j] and not tree_mask[i][j]
                cls = "h" if wrong else ("s" if m[i][j] else "u")
                b.append(cell(x0 + j * C + 1, y + 1, C - 2, C - 2, cls, rx=2))
    y = 108 + n * C + 26
    b.append(txt(110, y, "red: allowed by order, but on another branch", "sub2"))
    b.append(txt(420, y, "each token sees only its own path", "sub2"))
    body, yb = prose(y + 44, [
        "To check the tree in one pass, its five tokens are laid out in a row and fed in together. "
        "With the ordinary causal mask ({{fig:v08-o003}}) each token would see every token to its "
        "left: dog would see cat, and ran would see cat and sat, as if the text read ‘the cat dog’.",
        "The tree mask lets each token see only the tokens on its own path: dog sees ‘the’ and "
        "itself, ran sees ‘the’ and ‘dog’. Each token is also given the position it has in its own "
        "path, so cat and dog both sit at position 2, and every path gets exactly the predictions it "
        "would get alone.",
    ])
    emit("a23", at("An attention mask lets each token see only its own ancestors"),
         "Flattened into one sequence, the tree needs a mask that shows each token only its ancestors",
         yb + 30, b + [body],
         "Same pass, same weights read once; the mask makes five tokens behave like two separate "
         "sentences that share a first word.")


# ---- a24 · E6: frozen or trained together ---------------------------------------------------------------------
def a24():
    b = [hd(40, 46, "Speed-ups the Medusa paper reports, drawn to scale")]
    X1, S = 250, 130
    sx = lambda v: X1 + (v - 1) * S
    b.append(txt(40, 89, "Medusa-1, frozen", "cap"))
    b.append(cell(sx(1), 70, sx(2.2) - sx(1), 28, "m", label="over 2.2×"))
    b.append(arr(sx(2.2) + 4, 84, sx(2.2) + 26, 84))
    b.append(txt(40, 133, "Medusa-2, together", "cap"))
    b.append(cell(sx(1), 114, sx(2.3) - sx(1), 28, "u"))
    b.append(cell(sx(2.3), 114, sx(2.8) - sx(2.3), 28, "m", label="2.3–2.8×"))
    b.append(ghost(sx(2.8), 114, sx(3.6) - sx(2.8), 28, label="to 3.6×"))
    ya = 158
    b.append(ln(sx(1), ya, sx(4), ya, "axis"))
    for v in (1, 2, 3, 4):
        b.append(ln(sx(v), ya, sx(v), ya + 5, "tick"))
        b.append(txt(sx(v), ya + 19, f"{v}×", "sub2", "middle"))
    b.append(txt(sx(1), ya + 44, "dashed: the first version's upper end, from a single category", "sub2"))
    body, yb = prose(ya + 90, [
        "Training nudges weights to make a loss smaller ({{fig:v06-o004}}). Medusa-1 trains only the "
        "heads: the original model, the backbone, is frozen, so its own outputs cannot change. The "
        "paper reports over 2.2 times without compromising generation quality.",
        "Medusa-2 trains the backbone along with the heads. The heads get more accurate and the "
        "speed-up larger, but the model itself has changed, so it needs a training recipe that "
        "protects what the model already did well.",
        "The paper's first version gave Medusa-2 as 2.3 to 3.6 times; its published version gives "
        "2.3 to 2.8. The 3.6 is the best single category, extraction, at 3.62 times on a 7B model.",
    ])
    emit("a24", at("With the backbone left frozen"),
         "Frozen backbone or trained together: over 2.2× against 2.3–3.6×", yb + 30, b + [body],
         "Freezing buys safety: the model you deployed is the model you tested. Training them "
         "together buys speed, at the price of a new model to validate.")


# ---- a25 · E7: typical acceptance -------------------------------------------------------------------------------
EPS, DELTA = 0.09, 0.3                  # the defaults in Medusa's code (posterior_threshold, posterior_alpha)


def entropy(p):
    return -sum(x * math.log(x) for x in p if x > 0)


def a25():
    peaked, flat = [0.9, 0.05, 0.05], [0.05] * 20
    Hp, Hf = entropy(peaked), entropy(flat)
    tp, tf = min(EPS, DELTA * math.exp(-Hp)), min(EPS, DELTA * math.exp(-Hf))
    assert round(Hp, 3) == 0.394 and round(Hf, 2) == 3.00 and tp == EPS and round(tf, 3) == 0.015
    hfall = math.log(DELTA / EPS)
    assert round(hfall, 2) == 1.20
    b = [hd(40, 46, "A guess survives if the target's probability for it beats the bar")]
    YB, S = 206, 120                                  # baseline, px per unit probability
    panels = [("peaked: one clear favourite", peaked, Hp, tp, 60, 26), ("open: twenty equal choices", flat, Hf, tf, 350, 13)]
    for title, p, H, t, x0, bw in panels:
        b.append(txt(x0, 76, title, "sub2"))
        for i, v in enumerate(p):
            x = x0 + i * bw
            b.append(cell(x + 1, YB - v * S, bw - 2, v * S, "m" if v > t else "u", rx=1))
        b.append(ln(x0, YB, x0 + len(p) * bw, YB, "axis"))
        small = min(p)
        xs = x0 + (bw if len(p) == 3 else 0)
        b.append(txt(xs + 2, YB - small * S - 8, f"{small:.2f} each: {'under' if small < t else 'over'} {t:.3g}", "sub2"))
        b.append(txt(x0, YB + 20, f"entropy H = {H:.2f}", "sub2"))
        b.append(txt(x0, YB + 40, f"bar: min(0.09, 0.3 × e^(−H)) = {t:.3f}", "sub2"))
        passed = sum(v > t for v in p)
        b.append(txt(x0, YB + 60, f"{passed} of {len(p)} candidates clear it", "sub2"))
    body, yb = prose(YB + 106, [
        "Medusa also changed the test. Instead of p ÷ q, a guess survives when the target's own "
        "probability for it clears a bar, because the paper argues that matching the original "
        "model's distribution is typically unnecessary.",
        "The bar falls when the target is unsure, measured by entropy: H = −Σ p × ln p, each "
        "token's probability times its surprise, ln(1 ÷ p), added up. One clear favourite gives "
        f"{Hp:.2f}; twenty equal choices give ln 20 = {Hf:.2f}. The bar is the smaller of 0.09 and "
        f"0.3 × e^(−H), the defaults in Medusa's code: 0.09 here, {tf:.3f} there, and it only starts "
        f"to fall once H passes {hfall:.2f}.",
        "There is no replacement step and no p-over-q test, so the output is no longer the target's "
        "distribution. The paper reports that quality held on benchmarks, a weaker claim than an "
        "identical distribution.",
    ])
    emit("a25", at("Medusa also changed the acceptance test"),
         "Typical acceptance lowers the bar where the target is unsure", yb + 30, b + [body],
         "The trade made explicit: a looser test keeps more guesses and gives up the guarantee of "
         "Part 3. Quality becomes something measured, not something proved.")


if __name__ == "__main__":
    for fn in (o010, a19, a20, o012, o011, a21, a22, a23, a24, a25):
        fn()
