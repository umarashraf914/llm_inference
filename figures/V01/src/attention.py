"""V01 Part 5, how attention compares tokens: proposals 11-14, 28 and 29, and o089 and o104 redrawn.

V1 owns this foundation for the series: projection is a matrix multiply, a score is a dot product,
softmax turns a row of scores into weights, a head is a 128-wide slice doing all of that on its own,
and grouped-query attention lets eight query heads share one key head and one value head.

  python3 figures/V01/src/attention.py
"""
import json
import math
from common import (box, cont, cell, ghost, arr, ln, txt, hd, eq, prose, emit, widget, tag, st, f, g, sig,
                    JS_FMT, MINUS, D, FF, L, NH, KVH, HD, KVW, VOC, ATTN, FFN, LAYER)

dot = lambda a, b: sum(p * q for p, q in zip(a, b))
mv = lambda M, x: [dot(r, x) for r in M]


def n(v):
    """Small numbers as written in the figures: 2, −1, 0.5."""
    v = v + 0.0
    s = f"{v:g}"
    return s.replace("-", MINUS)


# ---- p11: projection --------------------------------------------------------------------------------
X = [1, 2, 0, -1]
WQ = [[1, 0, 1, 0], [0, 1, 0, 1]]
WK = [[1, 1, 0, 0], [0, 0, 1, -1]]
WV = [[0, 1, 1, 0], [1, 0, 0, 1]]
Q_, K_, V_ = mv(WQ, X), mv(WK, X), mv(WV, X)
assert Q_ == [1, 1] and K_ == [3, 1] and V_ == [2, 0]


def p11():
    b = [hd(40, 46, "One vector, three learned matrices, three new vectors")]
    b.append(txt(40, 86, "the token's vector x", "cap"))
    for j, v in enumerate(X):
        b.append(cell(210 + j * 38, 68, 32, 28, "s", rx=3, label=n(v)))
    blocks = [("W_Q", WQ, Q_, "q, the query"), ("W_K", WK, K_, "k, the key"), ("W_V", WV, V_, "v, the value")]
    for k, (name, M, out, lab) in enumerate(blocks):
        x0 = 40 + k * 205
        b.append(txt(x0, 132, name, "cap"))
        for r, row in enumerate(M):
            y = 142 + r * 32
            for j, v in enumerate(row):
                b.append(cell(x0 + j * 30, y, 26, 26, "u", rx=3, label=n(v)))
            b.append(txt(x0 + 4 * 30 + 6, y + 18, "→", "sub2"))
            b.append(cell(x0 + 4 * 30 + 24, y, 30, 26, "m", rx=3, label=n(out[r])))
        b.append(txt(x0, 228, lab, "sub2"))
    terms = " + ".join(f"{n(w)}×{n(v) if v >= 0 else '(' + n(v) + ')'}" for w, v in zip(WK[0], X))
    b.append(txt(40, 256, f"for example, the first row of W_K with x:  {terms}  =  {n(K_[0])}", "sub2"))
    yh = 300
    b.append(hd(40, yh, "The same thing at the real size, in the model this atlas follows"))
    rows = [("W_Q", D, "q", f"{g(D * D / 1e6, 1)} million weights"),
            ("W_K", KVW, "k", f"{g(D * KVW / 1e6, 1)} million weights"),
            ("W_V", KVW, "v", f"{g(D * KVW / 1e6, 1)} million weights")]
    for k, (name, r, o, w) in enumerate(rows):
        y = yh + 26 + k * 24
        b.append(txt(60, y, f"{name}: {g(r)} rows of {g(D)}  →  {o} has {g(r)} numbers", "sub2"))
        b.append(txt(420, y, w, "sub2"))
    body, yb = prose(yh + 26 + 3 * 24 + 22, [
        "Projecting a vector means multiplying it by a matrix: each row of the matrix, multiplied pair by pair "
        "with the vector and added up, gives one number of the result ({{fig:v01-o085}}). Three different "
        "matrices turn one vector into three: the query, the key and the value.",
        "Nothing about the arithmetic decides which is which. The three matrices were learned in training and "
        "are the same for every token; what differs from token to token is the vector it brings. The small "
        "weights above are illustrative.",
        "In the real model the token's vector holds 8,192 numbers. W_Q has 8,192 rows, so the query is as long "
        "as the input; W_K and W_V have only 1,024, so keys and values are eight times shorter. Why is the "
        "subject of {{fig:v01-p29}}.",
    ])
    emit("p11", st("projects it into three separate vectors"),
         "Projecting means multiplying by a matrix: one vector in, three out", yb + 26, b + [body],
         "Projection is the same multiply-and-add as everywhere else in the model. The three roles come from "
         "three learned matrices, not from anything special in the arithmetic.")


# ---- p12: the dot product as agreement (widget) -----------------------------------------------------
A = (3, 1)
B0 = (2, 2)
EXAMPLES = {(2, 2): 8, (-2, 1): -5, (1, -3): 0}
for v, s in EXAMPLES.items():
    assert dot(A, v) == s
OX, OY, U = 190, 190, 32                        # origin and pixels per unit of the coordinate plane


def verdict(s):
    return ("points the same way: positive" if s > 0 else "at right angles: zero" if s == 0
            else "points away: negative")


def p12():
    b = [hd(40, 34, "Drag b and watch its dot product with a")]
    for t in range(-4, 5):                      # the grid
        b.append(ln(OX + t * U, OY - 4 * U, OX + t * U, OY + 4 * U, "axis"))
        b.append(ln(OX - 4 * U, OY + t * U, OX + 4 * U, OY + t * U, "axis"))
    for t in (-4, -2, 2, 4):
        b.append(txt(OX + t * U, OY + 4 * U + 16, n(t), "sub2", "middle"))
        b.append(txt(OX - 4 * U - 8, OY - t * U + 4, n(t), "sub2", "end"))
    ax, ay = OX + A[0] * U, OY - A[1] * U
    bx, by = OX + B0[0] * U, OY - B0[1] * U
    b.append(f'<line x1="{OX}" y1="{OY}" x2="{ax}" y2="{ay}" style="stroke:var(--m);stroke-width:2.5"/>')
    b.append(f'<circle cx="{ax}" cy="{ay}" r="4" style="fill:var(--m)"/>')
    b.append(txt(ax + 8, ay - 6, "a", "hd halo"))
    b.append(f'<line data-b="" x1="{OX}" y1="{OY}" x2="{bx}" y2="{by}" style="stroke:var(--s);stroke-width:2.5"/>')
    b.append(f'<circle data-bt="" cx="{bx}" cy="{by}" r="4" style="fill:var(--s)"/>')
    b.append(f'<text class="hd halo" data-bl="" x="{bx + 8}" y="{by - 6}">b</text>')
    R = 360
    s0 = dot(A, B0)
    b.append(txt(R, 76, "a = (3, 1), fixed", "sub2"))
    b.append(tag("text", {"class": "sub2", "x": R, "y": 100, "data-bv": ""}, f"b = ({n(B0[0])}, {n(B0[1])})"))
    b.append(txt(R, 136, "a · b = first × first + second × second", "sub2"))
    b.append(tag("text", {"class": "sub2", "x": R, "y": 160, "data-sum": ""},
                  f"= 3 × {n(B0[0])} + 1 × {n(B0[1])} = {n(s0)}"))
    b.append(f'<g class="m"><rect x="{R}" y="182" width="270" height="34" rx="5"/>'
             f'<text class="sub" x="{R + 135}" y="199" text-anchor="middle" dominant-baseline="central" '
             f'data-verdict="">{verdict(s0)}</text></g>')
    body, yl = prose(OY + 4 * U + 52, [
        "A dot product multiplies two lists pair by pair and adds the results: the operation each output of a "
        "matrix multiply is made of ({{fig:v01-o005}}). Read as arrows, it measures how far two vectors "
        "point the same way.",
        "Here b = (2, 2) gives 3 × 2 + 1 × 2 = 8: the arrows roughly agree. b = (−2, 1) gives −6 + 1 = −5: they "
        "point apart. b = (1, −3) gives 3 − 3 = 0: they stand at right angles. Longer arrows give bigger "
        "numbers either way.",
        "Drag b with the sliders. The figure's arithmetic was checked against Python at every slider setting.",
    ])
    js = JS_FMT + r"""
  const fig = document.currentScript.closest('figure');
  const A = [3, 1], OX = __OX__, OY = __OY__, U = __U__, B0 = __B0__;
  const sl = [...fig.querySelectorAll('input[type=range]')], val = [...fig.querySelectorAll('.val')];
  const q = s => fig.querySelector(s);
  const nf = v => (v < 0 ? '−' : '') + String(Math.abs(v));
  function draw() {
    const b = sl.map(s => +s.value);
    b.forEach((v, i) => val[i].textContent = nf(v));
    const x = OX + b[0] * U, y = OY - b[1] * U, s = A[0] * b[0] + A[1] * b[1];
    const ln = q('[data-b]'); ln.setAttribute('x2', x); ln.setAttribute('y2', y);
    const t = q('[data-bt]'); t.setAttribute('cx', x); t.setAttribute('cy', y);
    const l = q('[data-bl]'); l.setAttribute('x', x + 8); l.setAttribute('y', y - 6);
    q('[data-bv]').textContent = `b = (${nf(b[0])}, ${nf(b[1])})`;
    q('[data-sum]').textContent = `= 3 × ${nf(b[0])} + 1 × ${nf(b[1])} = ${nf(s)}`;
    q('[data-verdict]').textContent = s > 0 ? 'points the same way: positive' : s === 0 ? 'at right angles: zero' : 'points away: negative';
  }
  sl.forEach(s => s.addEventListener('input', draw));
  q('button').addEventListener('click', () => { sl.forEach((s, i) => s.value = B0[i]); draw(); });
  draw();""".replace("__OX__", str(OX)).replace("__OY__", str(OY)).replace("__U__", str(U)).replace("__B0__", json.dumps(list(B0)))
    ctl = "".join(f"<label>b{'₁₂'[k]} <input type='range' min='-3' max='3' step='0.5' value='{B0[k]}'>"
                  f"<span class='val'>{n(B0[k])}</span></label>" for k in range(2))
    widget("p12", st("The model compares every query against every key"),
           "A dot product is large when two vectors point the same way", [ctl + "<button type='button'>Reset</button>"],
           yl + 22, b + [body],
           "Agreement as a single number. Attention uses exactly this to decide which earlier tokens matter to "
           "the current one.", js)


# ---- p13: scores --------------------------------------------------------------------------------------
QV = [1, 2, 0, -1]
KEYS = [[1, 2, 0, -1], [0, 1, 1, 0], [-1, -2, 0, 1]]
SCORES = [dot(QV, k) for k in KEYS]
assert SCORES == [6, 2, -6]
NP = 2000
assert NP * NP == 4_000_000 and NP * (NP + 1) // 2 == 2_001_000


def p13():
    b = [hd(40, 46, "One query against three keys: multiply the pairs, add them up")]
    def row(y, lab, vec, c):
        b.append(txt(40, y + 19, lab, "cap"))
        for j, v in enumerate(vec):
            b.append(cell(120 + j * 36, y, 30, 28, c, rx=3, label=n(v)))
    row(66, "query", QV, "s")
    for k, (kv, s) in enumerate(zip(KEYS, SCORES)):
        y = 116 + k * 40
        row(y, f"key {k + 1}", kv, "u")
        terms = " + ".join(f"{n(a) if a >= 0 else '(' + n(a) + ')'}×{n(c) if c >= 0 else '(' + n(c) + ')'}"
                           for a, c in zip(QV, kv))
        b.append(txt(278, y + 19, terms, "sub2"))
        b.append(txt(548, y + 19, "=", "sub2"))
        b.append(cell(566, y, 54, 28, "m" if s > 0 else "u", rx=3, label=n(s)))
    yg = 116 + 3 * 40 + 34
    b.append(hd(40, yg, "Every query against every key: a grid with a score in each cell"))
    G, C = 10, 14
    for i in range(G):
        for j in range(G):
            b.append(cell(60 + j * C, yg + 18 + i * C, C - 2, C - 2, "u", rx=1))
    b.append(txt(60 + G * C + 20, yg + 40, "a row for each token's query, a column for each token's key", "sub2"))
    b.append(txt(60 + G * C + 20, yg + 64, "10 tokens drawn: 10 × 10 = 100 scores", "sub2"))
    b.append(txt(60 + G * C + 20, yg + 88, f"a {g(NP)}-token prompt: {g(NP)} × {g(NP)} = {g(NP * NP)} scores", "sub2"))
    body, yb = prose(yg + 18 + G * C + 38, [
        "A query is compared with a key by their dot product ({{fig:v01-p12}}). Key 1 points exactly the way "
        "the query does and scores 6; key 3 points exactly the opposite way and scores −6; key 2 is partly "
        "aligned and scores 2. The score is how relevant that key's token is to the query's.",
        "Every token in the prompt has a query and a key, and every query is scored against every key. At "
        f"{g(NP)} tokens that is {g(NP * NP)} scores for one attention computation in one layer, and each layer "
        "runs many side by side ({{fig:v01-p28}}).",
        "About half the grid goes unused, because a token may not look at tokens after it; "
        "{{fig:v01-o132}} shows why.",
    ])
    emit("p13", st("The model compares every query against every key"),
         "A score is the query's dot product with each key, and a prompt makes millions of them", yb + 26,
         b + [body],
         "The grid grows with the square of the prompt: ten times the tokens, a hundred times the scores. "
         "That square is why long prompts are expensive in ways the weights alone do not explain.")


# ---- p14: softmax over the scores --------------------------------------------------------------------
TOK = ["the", "cat", "sat", "down"]
SC = [0.5, 3.0, 2.2, 0.5]
EX = [math.exp(s) for s in SC]
TOT = sum(EX)
WTS = [e / TOT for e in EX]
assert [round(w, 2) for w in WTS] == [0.05, 0.62, 0.28, 0.05] and round(sum(round(w, 2) for w in WTS), 2) == 1.0


def p14():
    b = [hd(40, 46, "The query of “down” against four keys: e to each score, divided by the total")]
    C = [40, 140, 220, 320]
    for c, h in zip(C[1:], ["score", "e to that", "weight, to scale"]):
        b.append(txt(c, 84, h, "sub2"))
    SCL = 300
    for r in range(4):
        y = 98 + r * 42
        b.append(txt(C[0], y + 19, TOK[r], "cap"))
        b.append(txt(C[1], y + 19, f(SC[r], 1), "sub2"))
        b.append(txt(C[2], y + 19, f(EX[r], 2), "sub2"))
        w = round(max(WTS[r] * SCL, 2), 1)
        b.append(cell(C[3], y + 2, w, 26, "m" if WTS[r] > 0.2 else "u", rx=3))
        b.append(txt(C[3] + w + 10, y + 19, f(WTS[r], 2), "sub2"))
    yt = 98 + 4 * 42 + 4
    b.append(ln(C[2], yt, C[2] + 50, yt, "tick"))
    b.append(txt(C[1], yt + 20, "total", "sub2"))
    b.append(txt(C[2], yt + 20, f(TOT, 2), "sub2"))
    b.append(txt(C[3], yt + 20, f"{f(sum(round(w, 2) for w in WTS), 2)}", "sub2"))
    body, yb = prose(yt + 62, [
        "Scores can be any size and either sign, but the weights of an average must be positive and add to one "
        "({{fig:v01-o093}}). Softmax, the same step that turned word scores into probabilities "
        "({{fig:v01-o009}}), makes them so: raise e to each score and divide by the total.",
        "So “down” gives 62% of its attention to “cat” and 28% to “sat”: the exponential turns a lead of 0.8 "
        "in score into more than twice the weight, since e^0.8 = 2.2. These are the weights "
        "{{fig:v01-o094}} blends with.",
        "Real models first divide every score by the square root of the key's length, √128 ≈ 11.3, so that "
        "long vectors do not produce scores so large that softmax gives everything to one token "
        "({{fig:v03-o021}}). The scores here are shown after that division, and are illustrative.",
    ])
    assert round(math.exp(0.8), 1) == 2.2 and round(math.sqrt(128), 1) == 11.3
    emit("p14", st("then uses those scores to blend the values"),
         "Softmax turns each row of scores into weights that add to one", yb + 26, b + [body],
         "Every row of the score grid gets its own softmax, so every token ends up with its own set of "
         "weights over the tokens before it.")


# ---- p28: heads ---------------------------------------------------------------------------------------------
def p28():
    assert NH * HD == D
    b = [hd(40, 46, "One query vector of 8,192 numbers, cut into 64 heads of 128")]
    W = 600 / NH
    for h in range(NH):
        b.append(cell(round(40 + h * W, 2), 66, round(W - 1.2, 2), 30, "m" if h < 2 else "u", rx=1))
    b.append(txt(40, 116, "heads 1 and 2 highlighted; 64 heads in all, each a slice of 128 numbers", "sub2"))
    steps = ["its own scores against its own 128-number keys", "its own softmax", "its own weighted average of 128-number values"]
    yh = 150
    b.append(hd(40, yh, "Each head does all of attention on its own slice"))
    for k, s in enumerate(steps):
        y = yh + 18 + k * 36
        b.append(cell(60, y, 360, 28, "u", rx=4, label=s))
        if k:
            b.append(arr(240, y - 8, 240, y - 1))
    b.append(txt(440, yh + 18 + 36 + 19, "× 64 heads, side by side", "sub2"))
    yj = yh + 18 + 3 * 36 + 14
    b.append(cell(60, yj, 560, 30, "s", rx=4, label="64 results × 128 numbers, laid end to end = 8,192 numbers, then × W_O"))
    body, yb = prose(yj + 30 + 38, [
        "One big attention over whole vectors is not what real models run. The 8,192-number query is cut into "
        "64 slices of 128, and so are the keys and values. Each slice, called a head, does the whole of the "
        "last three figures on its own: its own scores, its own softmax, its own weighted average.",
        "Heads are free to learn different patterns, which is the point of having many: one can follow "
        "grammar while another tracks a name. Their 64 results, 128 numbers each, are laid end to end into "
        "one 8,192-number vector, and a fourth matrix, W_O, mixes them; it is the combine matrix of "
        "{{fig:v01-o104}}.",
        "So the grid of {{fig:v01-p13}} is computed 64 times per layer, once per head: 256 million scores at "
        "2,000 tokens.",
    ])
    assert NH * 2000 ** 2 == 256_000_000
    emit("p28", st("then uses those scores to blend the values"),
         "A head is one 128-wide slice of the vector doing its own attention", yb + 26, b + [body],
         "Heads cost nothing extra in weights: the same three matrices, cut into slices. What they buy is 64 "
         "independent ways of deciding what matters.")


# ---- p29: grouped-query attention ------------------------------------------------------------------------
MHA = 4 * D * D                                 # every query head with its own key and value head
assert MHA == 268_435_456 and ATTN == 150_994_944 and NH // KVH == 8


def p29():
    b = [hd(40, 46, "Each group of eight query heads shares one key head and one value head")]
    for grp in range(KVH):
        y = 64 + grp * 28
        for j in range(8):
            h = grp * 8 + j + 1
            b.append(cell(40 + j * 32, y, 28, 22, "s", rx=2, label=str(h)))
        b.append(arr(40 + 8 * 32 + 4, y + 11, 40 + 8 * 32 + 40, y + 11))
        b.append(cell(40 + 8 * 32 + 46, y, 100, 22, "h", rx=2, label=f"KV head {grp + 1}"))
    b.append(txt(452, 90, "64 query heads in 8 groups", "sub2"))
    b.append(txt(452, 110, "8 key heads, 8 value heads", "sub2"))
    b.append(txt(452, 130, f"K and V: 8 × 128 = {g(KVW)} wide", "sub2"))
    yb0 = 64 + 8 * 28 + 30
    b.append(hd(40, yb0, "Attention weights in one layer, to scale"))
    SC = 280 / MHA
    rows = [("every head its own K and V", MHA, "u"), ("8 shared key and value heads", ATTN, "s")]
    for k, (lab, v, c) in enumerate(rows):
        y = yb0 + 18 + k * 40
        b.append(txt(40, y + 19, lab, "cap"))
        w = round(v * SC, 1)
        b.append(cell(250, y, w, 28, c, rx=3))
        b.append(txt(250 + w + 10, y + 19, f"{f(v / 1e6, 1)} million", "sub2"))
    body, yb = prose(yb0 + 18 + 2 * 40 + 32, [
        "Each group of eight query heads computes its scores against the same keys and blends the same values; "
        "only the queries differ. This is grouped-query attention, GQA. The model this atlas follows has 64 "
        "query heads and 8 key-value (KV) heads.",
        f"So the key and value vectors need only 8 heads × 128 = {g(KVW)} numbers each, against 8,192 for the "
        f"query, and W_K and W_V are an eighth the size of W_Q. A layer's four attention matrices hold "
        f"{f(ATTN / 1e6, 1)} million weights instead of {f(MHA / 1e6, 1)} million: the 151.0 of "
        "{{fig:v01-o101}}.",
        "The weights are the small saving. Part 11 shows the large one: every token leaves its keys and values "
        "behind, and with eight key-value heads there is an eighth as much to keep.",
    ])
    emit("p29", st("then uses those scores to blend the values"), "Sixty-four query heads share eight key-value heads",
         yb + 26, b + [body],
         "The model is trained this way from the start, so sharing is not an approximation added at serving "
         "time. It is a design choice made for inference, and its payoff arrives in Part 11.")


# ---- o089: the embedding table against the output projection, at the real width ----------------------
def o089():
    prompt = 200
    rows_frac = prompt / VOC
    in_bytes = prompt * D * 2
    out_bytes = VOC * D * 2
    out_ops = 2 * VOC * D
    assert round(rows_frac * 100, 2) == 0.16 and round(in_bytes / 1e6, 2) == 3.28
    assert round(out_bytes / 1e9, 2) == 2.10 and round(out_ops / 1e9, 2) == 2.10
    b = [hd(40, 46, f"Two matrices of identical shape, {g(VOC)} × {g(D)}")]
    TR, TW = 220, 300
    def bar(y, frac, c, lab, inside=None):
        b.append(ghost(TR, y, TW, 30, rx=3))
        w = round(max(frac * TW, 2), 1)
        b.append(cell(TR, y, w, 30, c, rx=3, label=inside))
        if lab:
            b.append(txt(TR + TW + 12, y + 20, lab, "sub2"))
    b.append(txt(40, 82, "Input embedding", "cap"))
    b.append(txt(40, 100, f"a {prompt}-token prompt", "sub2"))
    bar(68, rows_frac, "s", f"{f(rows_frac * 100, 2)}% of the rows")
    b.append(txt(40, 134, "Output projection", "cap"))
    b.append(txt(40, 152, "every single token", "sub2"))
    bar(120, 1.0, "h", None, "every row, 100%")
    yb0 = 186
    b.append(hd(40, yb0, "Bytes moved, to scale"))
    b.append(txt(40, yb0 + 34, "Input embedding", "cap"))
    bar(yb0 + 14, in_bytes / out_bytes, "s", f"{f(in_bytes / 1e6, 2)} MB, once")
    b.append(txt(40, yb0 + 82, "Output projection", "cap"))
    bar(yb0 + 62, 1.0, "h", None, f"{f(out_bytes / 1e9, 2)} GB, every token")
    body, yb = prose(yb0 + 62 + 30 + 40, [
        f"The input embedding touches {prompt} rows out of {g(VOC)} and never looks at the rest. The output "
        "projection has to score every token in the vocabulary, so it reads all of them, every time.",
        f"Zero arithmetic against {f(out_ops / 1e9, 2)} billion operations, for the same quantity of stored "
        f"weights: {f(out_bytes / 1e9, 2)} GB each.",
        "Some models share one set of weights between the two; the model this atlas follows keeps two copies. "
        "Even when shared, the reading is not: one end gathers a handful of rows, the other end streams all of "
        "them.",
    ])
    emit("o089", "6:58", "The same shape, read two opposite ways", yb + 26, b + [body],
         "Bars to scale, the input side drawn at the narrowest visible width. A genuine exception to every token "
         "reading every weight: one of the largest matrices in the model adds almost nothing to the traffic on "
         "the way in.")


# ---- o104: where the parameters live -------------------------------------------------------------------
def o104():
    b = [cont(40, 30, 600, 142, "u", "Every layer is parameterised by seven weight matrices")]
    att = ["query, W_Q", "key, W_K", "value, W_V", "combine, W_O"]
    for k, lab in enumerate(att):
        b.append(cell(62 + k * 141, 64, 133, 30, "s", rx=4, label=lab))
    ffn = ["feed-forward gate", "feed-forward up", "feed-forward down"]
    for k, lab in enumerate(ffn):
        b.append(cell(62 + k * 188, 112, 180, 30, "m", rx=4, label=lab))
    body, yb = prose(212, [
        "Four matrices for attention and three for the feed-forward block, in each of 80 layers: 560 matrices. "
        "These weights are what the model learned during training. They are the model.",
        "One forward pass is the whole journey: from the embedding lookup, through all 80 layers, to the "
        "vocabulary projection and the choice of one token ({{fig:v01-o103}}). Every one of these matrices is "
        "used exactly once on the way.",
    ])
    assert 7 * L == 560
    emit("o104", st("Every one of those layers is parameterized by weight matrices"), "Where the parameters live",
         yb + 26, b + [body],
         "The count of these matrices, and their size, is the number everything else in this atlas divides by "
         "or multiplies against.")


if __name__ == "__main__":
    for fn in (p11, p12, p13, p14, p28, p29, o089, o104):
        fn()
