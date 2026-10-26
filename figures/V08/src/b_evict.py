"""V8 Part 8, deleting tokens: review §4 K1-K6, fixes P7 (Fig 22 to scale), P20 (episode 4 link), names.

Sources read: StreamingLLM (arXiv 2309.17453: sinks, 4 initial tokens, 4 million tokens, window
attention collapses when the first tokens go); H2O (arXiv 2306.14048: accumulated attention, heavy
hitters plus recent tokens, half the budget each, 20% budget, >95% sparsity below 1% of the row max);
SnapKV (arXiv 2404.14469: observation window at the end of the prompt votes, pooling keeps neighbours,
done before generation); The Sparse Frontier (arXiv 2504.17768). Scores and tallies are illustrative.

  s08   part heading
  b15   softmax has no "none of the above"                                  (K1)
  b16   a sink soaks up the leftover; evicting it multiplies the rest by 5   (K2)
  o020  StreamingLLM: sinks + window                                         (names)
  o021  H2O keeps the heavy hitters (worked)                                 (K3 merged in)
  b17   SnapKV: the end of the prompt votes                                  (K4)
  b18   attention so far says nothing about attention later                 (K5)
  b19   quantizing keeps every token, each smaller                           (K6, P20)
  o022  The Sparse Frontier, to scale                                        (P7)

  python3 figures/V08/src/b_evict.py
"""
import math, random
from b_lib import (box, cell, ghost, txt, hd, ln, arr, prose, emit, sec, stamp, f, n0, pct, text,
                   KV_PER_TOKEN)


def softmax(z):
    m = max(z)
    e = [math.exp(v - m) for v in z]
    t = sum(e)
    return [v / t for v in e]


# ---- b15: no "none of the above" -------------------------------------------------------------------
POOR = [-3.0, -2.8, -3.1, -2.9, -3.0]
EP = [math.exp(v) for v in POOR]
SP = [v / sum(EP) for v in EP]
assert abs(sum(SP) - 1) < 1e-12
assert all(abs(a - b) < 1e-12 for a, b in zip(SP, softmax([v + 10 for v in POOR])))   # shift changes nothing


def b15():
    b = [hd(40, 46, "Five poor matches: e to each score, then divide by the total")]
    cols = [(40, "token"), (120, "score"), (200, "e to the score"), (330, "share of the weight, to scale")]
    for x, t in cols:
        b.append(txt(x, 76, t, "sub2"))
    SC = 300
    for i, (z, e, s) in enumerate(zip(POOR, EP, SP)):
        y = 88 + i * 34
        b.append(txt(40, y + 18, f"token {i + 1}", "cap"))
        b.append(txt(120, y + 18, f(z, 1), "sub2"))
        b.append(txt(200, y + 18, f(e, 4), "sub2"))
        b.append(cell(330, y + 2, s * SC, 24, "u"))
        b.append(txt(330 + s * SC + 10, y + 18, f(s, 3), "sub2"))
    yt = 88 + 5 * 34 + 6
    b.append(ln(200, yt, 260, yt, "tick"))
    b.append(txt(200, yt + 18, f(sum(EP), 4), "sub2"))
    b.append(txt(330, yt + 18, f"total {f(sum(SP), 3)}", "sub2"))
    b.append(txt(40, yt + 18, "total", "cap"))
    body, yb = prose(yt + 62, [
        "StreamingLLM starts with the softmax, the step that decides how a new token spreads its "
        "attention across everything before it ({{fig:v01-o009}}). Raise e to each score and divide by "
        "the total: the weights always add up to one.",
        "So even when nothing in the context is a good match, the whole budget still has to land "
        "somewhere. Five scores near −3 give each token about a fifth, exactly what five scores near +7 "
        "would give: only the gaps between scores matter, because subtracting the same number from "
        "every score changes nothing ({{fig:v03-o025}}).",
    ])
    emit("b15", stamp("Those weights have to add up to one"),
         "Softmax has no “none of the above”", yb + 30, b + [body],
         "There is no way to attend to nothing. Every token ends up with a sliver of weight, even the "
         "ones that match nothing, and the next figure shows where trained models learn to put it.")


# ---- b16: the sink ----------------------------------------------------------------------------------------
SINK = softmax([1.0] + [-2.0] * 5)
NOSINK = softmax([-2.0] * 5)
assert round(SINK[0], 2) == 0.80 and round(SINK[1], 2) == 0.04 and round(NOSINK[0], 2) == 0.20
assert round(NOSINK[0] / SINK[1]) == 5


def b16():
    b = [hd(40, 46, "One sink scored 1 and five ordinary tokens scored −2: the whole budget, to scale")]
    L, X0 = 480, 150
    rows = [("sink kept", SINK, ["u"] + ["s"] * 5), ("sink evicted", NOSINK, ["h"] * 5)]
    for r, (lab, w, cls) in enumerate(rows):
        y = 74 + r * 76
        b.append(txt(40, y + 20, lab, "cap"))
        x = X0
        for k, (v, c) in enumerate(zip(w, cls)):
            wd = v * L
            label = (f"sink {f(v)}" if (r == 0 and k == 0) else f(v)) if wd >= 44 else None
            b.append(cell(x, y, wd, 30, c, rx=2, label=label))
            x += wd
        if r == 0:
            b.append(txt(X0 + SINK[0] * L + 2.5 * SINK[1] * L, y + 50, f"five tokens, {f(SINK[1])} each",
                         "sub2", "middle"))
    body, yb = prose(240, [
        "The model resolves this by dumping the leftover onto the first few tokens of the sequence. "
        "Those work because every later position can see them, so training can teach every query to "
        "park its unneeded weight there.",
        f"With the sink scored 1 and five tokens scored −2: e¹ = {f(math.e)}, e⁻² = {f(math.exp(-2), 3)}, "
        f"five of them {f(5 * math.exp(-2))}, total {f(math.e + 5 * math.exp(-2))}. The sink takes "
        f"{f(SINK[0])} and each ordinary token {f(SINK[1])}.",
        f"Evict the sink and the same five scores share the whole budget: {f(NOSINK[0])} each, five times "
        "what the model was trained to give them. StreamingLLM's authors saw exactly this: plain window "
        "attention collapses as soon as the first tokens are evicted.",
    ])
    emit("b16", stamp("dumping the leftover onto the first few tokens"),
         "A sink soaks up the leftover; evict it and the rest get five times their weight", yb + 30,
         b + [body],
         "Why the sinks have to stay. They carry almost no meaning, yet removing them pushes 80% of the "
         "weight onto tokens that were never meant to have it.")


# ---- o020: StreamingLLM ------------------------------------------------------------------------------------
def o020():
    b = [hd(40, 46, "The cache StreamingLLM keeps, in token order")]
    b.append(box(40, 70, 110, 44, "s", "4 sink tokens"))
    b.append(ghost(160, 70, 300, 44, label="evicted: gone for good"))
    b.append(box(470, 70, 170, 44, "s", "recent window"))
    b.append(txt(95, 134, "the first four", "sub2", "middle"))
    b.append(txt(555, 134, "rolls forward with the text", "sub2", "middle"))
    body, yb = prose(178, [
        "StreamingLLM keeps those sink tokens, and four are enough, alongside a rolling window of recent "
        "ones, and evicts everything in between. A model trained on a finite window can then keep "
        "generating over a stream of four million tokens and more.",
        "That is not a four-million-token memory. The window never grows, and whatever falls out of it "
        "is gone permanently.",
    ])
    emit("o020", stamp("keeps those sync tokens"),
         "StreamingLLM keeps four sink tokens and a rolling window, and evicts the rest", yb + 30,
         b + [body],
         "An artefact of softmax turned into a mechanism. The second paragraph is the honest reading of "
         "the headline number.")


# ---- o021: H2O, worked ------------------------------------------------------------------------------------------
ACC = [0.20, 0.03, 0.02, 0.04, 0.02, 0.18, 0.03, 0.02, 0.03, 0.02,
       0.04, 0.02, 0.14, 0.03, 0.02, 0.03, 0.04, 0.03, 0.03, 0.03]       # illustrative tallies, positions 1-20
assert abs(sum(ACC) - 1) < 1e-12
N, BUDGET = len(ACC), 4
RECENT = {N - 2, N - 1}
HEAVY = set(sorted((i for i in range(N) if i not in RECENT), key=lambda i: -ACC[i])[:BUDGET - len(RECENT)])
BYPOS = {0, 1, N - 2, N - 1}
KEPT_H2O = HEAVY | RECENT
SH_H2O, SH_POS = sum(ACC[i] for i in KEPT_H2O), sum(ACC[i] for i in BYPOS)
assert HEAVY == {0, 5} and BUDGET / N == 0.2 and round(SH_H2O, 2) == 0.44 and round(SH_POS, 2) == 0.29


def o021():
    b = [hd(40, 46, "20 cached tokens, room for 4: the tally of attention each has received (illustrative)")]
    X0, P, BW, BASE, SC = 150, 22, 17, 190, 500
    for i, v in enumerate(ACC):
        x = X0 + i * P
        h = v * SC
        b.append(cell(x, BASE - h, BW, h, "u", rx=1))
        b.append(txt(x + BW / 2, BASE + 16, str(i + 1), "sub2", "middle"))
    b.append(ln(X0 - 4, BASE, X0 + N * P, BASE, "axis"))
    b.append(txt(40, BASE - 40, "attention", "cap"))
    b.append(txt(40, BASE - 22, "received", "cap"))
    b.append(txt(40, BASE + 16, "position", "cap"))
    for r, (lab, keep, share) in enumerate([("by position", BYPOS, SH_POS), ("H2O", KEPT_H2O, SH_H2O)]):
        y = BASE + 34 + r * 34
        b.append(txt(40, y + 17, lab, "cap"))
        for i in range(N):
            x = X0 + i * P
            if i in keep:
                b.append(cell(x, y, BW, 24, "s", rx=2))
            else:
                b.append(ghost(x, y, BW, 24, rx=2))
        b.append(txt(X0 + N * P + 8, y + 17, f"keeps {pct(share, 0)}", "sub2"))
    body, yb = prose(BASE + 34 + 2 * 34 + 40, [
        "H2O, the heavy-hitter oracle, is a 2023 paper with a second way to choose what to evict. It "
        "keeps tokens by attention received rather than by position: each token's tally is the total "
        "weight every later query has given it so far, updated at every step.",
        f"A small fraction of tokens account for most of that weight. H2O keeps those heavy hitters "
        f"alongside the most recent tokens, half the budget each, and runs on about 20% of the cache "
        f"with quality close to the full cache. Here its four slots hold {pct(SH_H2O, 0)} of the attention "
        f"received, against {pct(SH_POS, 0)} for keeping the first two and the last two. Its top tally is "
        f"the first token: the tally finds the sink without being told.",
    ])
    emit("o021", stamp("H2O, the heavy hitter oracle"),
         "H2O keeps the tokens that have received the most attention", yb + 30, b + [body],
         "Position is cheap and blind; attention received is informed but looks only backwards, which is "
         "the weakness the next two figures examine.")


# ---- b17: SnapKV --------------------------------------------------------------------------------------------------
def snap_votes(seed=17, npos=16, nobs=4):
    rnd = random.Random(seed)
    hot = {2: 2.4, 6: 2.0, 7: 1.6, 11: 2.2}
    rows = []
    for _ in range(nobs):
        z = [rnd.gauss(0, 0.5) + hot.get(p, 0) for p in range(npos)]
        rows.append(softmax(z))
    votes = [sum(r[p] for r in rows) for p in range(npos)]
    return rows, votes


def b17():
    rows, votes = snap_votes()
    npos, nobs, keep = len(votes), len(rows), 4
    top = set(sorted(range(npos), key=lambda p: -votes[p])[:keep])
    assert top == {2, 6, 7, 11} and abs(sum(votes) - nobs) < 1e-12
    b = [hd(40, 46, f"Before generation: the last {nobs} prompt tokens vote on {npos} earlier positions (illustrative)")]
    X0, P, C = 150, 28, 24
    THR = 0.1
    for r, row in enumerate(rows):
        y = 70 + r * 28
        b.append(txt(40, y + 16, f"window token {r + 1}", "cap"))
        for p, v in enumerate(row):
            b.append(cell(X0 + p * P, y, C, 22, "s" if v >= THR else "u", rx=2))
    yv = 70 + nobs * 28 + 18
    b.append(txt(X0, yv, f"teal: the token gave that position at least {f(THR, 1)} of its weight", "sub2"))
    BASE, SC = yv + 92, 70
    b.append(txt(40, BASE - 10, "votes", "cap"))
    for p, v in enumerate(votes):
        x = X0 + p * P
        b.append(cell(x + 2, BASE - v * SC, C - 4, v * SC, "s" if p in top else "u", rx=1))
        b.append(txt(x + C / 2, BASE + 16, str(p + 1), "sub2", "middle"))
    b.append(ln(X0, BASE, X0 + npos * P - 4, BASE, "axis"))
    b.append(txt(40, BASE + 16, "position", "cap"))
    kept = ", ".join(str(p + 1) for p in sorted(top))
    b.append(txt(X0, BASE + 40, f"kept: positions {kept}, plus the {nobs} window tokens themselves", "sub2"))
    body, yb = prose(BASE + 80, [
        "SnapKV applies the same idea earlier, compressing the prompt's cache before generation even "
        "starts. The last few prompt tokens, the observation window, attend to everything before them; "
        "adding up the weight each earlier position receives from the window gives that position's vote.",
        "The top-voted positions and the window itself keep their keys and values; the rest of the "
        "prompt's cache is dropped before the first output token. SnapKV also keeps each chosen "
        "position's neighbours, so a fact is not cut off mid-phrase. The bet is that what the end of the "
        "prompt, usually the question, attends to is what generation will need.",
    ])
    emit("b17", stamp("Snap KV applies the same idea earlier"),
         "SnapKV lets the end of the prompt vote on what to keep", yb + 30, b + [body],
         "Cheaper than a running tally, because the vote happens once. The same blind spot: it can only "
         "judge from attention that has already happened.")


# ---- b18: the backward-looking failure ----------------------------------------------------------------------------
def b18():
    T, EVICT, NEED = 1400, 1000, 1200
    X0, X1 = 170, 620
    xs = lambda t: X0 + t / T * (X1 - X0)
    b = [hd(40, 46, "One token's story, illustrative: ignored for 1,000 steps, needed at step 1,200")]
    b.append(txt(40, 92, "in the cache", "cap"))
    b.append(cell(xs(0), 76, xs(EVICT) - xs(0), 26, "s"))
    b.append(ghost(xs(EVICT), 76, xs(T) - xs(EVICT), 26, label="evicted"))
    b.append(txt(40, 142, "attention it gets", "cap"))
    b.append(cell(xs(0), 128, xs(EVICT) - xs(0), 6, "u", rx=1))
    b.append(txt(xs(0), 154, "a trickle: always near the bottom of the tally", "sub2"))
    b.append(txt(40, 196, "the question", "cap"))
    b.append(cell(xs(NEED) - 30, 180, 60, 26, "h", label="needs it"))
    for t in (0, 200, 400, 600, 800, 1000, 1200, 1400):
        b.append(ln(xs(t), 222, xs(t), 226, "tick"))
        b.append(txt(xs(t), 242, f"{t:,}", "sub2", "middle"))
    b.append(ln(xs(0), 222, xs(T), 222, "axis"))
    b.append(txt((X0 + X1) / 2, 262, "decode step", "sub2", "middle"))
    body, yb = prose(302, [
        "Both methods estimate importance from attention that has already happened. A token that has "
        "drawn little attention so far, a name in a footnote, a figure in a table, ranks low and is "
        "among the first evicted.",
        "If a later question turns on it, it is already gone, and the cache cannot bring it back; only "
        "processing the text again could. So both can discard a token that only becomes relevant later.",
    ])
    emit("b18", stamp("So both can discard a token"),
         "Attention received so far says nothing about attention needed later", yb + 30, b + [body],
         "Eviction bets that the past predicts the future. The bet fails exactly when a conversation "
         "turns to something it had not needed until now.")


# ---- b19: quantize instead ------------------------------------------------------------------------------------------
def b19():
    rows = [("16-bit, every token", KV_PER_TOKEN, "u", f"{n0(KV_PER_TOKEN)} bytes"),
            ("8-bit, every token", KV_PER_TOKEN // 2, "s", f"{n0(KV_PER_TOKEN // 2)}"),
            ("4-bit, every token", KV_PER_TOKEN // 4, "s", f"{n0(KV_PER_TOKEN // 4)}, before scales"),
            ("evict to 20%", KV_PER_TOKEN // 5, "h", f"{n0(KV_PER_TOKEN // 5)} on average: 4 tokens in 5 gone")]
    assert KV_PER_TOKEN // 4 == 81_920 and KV_PER_TOKEN // 5 == 65_536
    SC = 360 / KV_PER_TOKEN
    b = [hd(40, 46, "Cache per token of context in the 70B model, drawn to scale")]
    for k, (lab, v, c, note) in enumerate(rows):
        y = 70 + k * 40
        b.append(txt(40, y + 18, lab, "cap"))
        w = v * SC
        b.append(cell(190, y, w, 26, c))
        b.append(txt(190 + w + 10, y + 18, note, "sub2"))
    body, yb = prose(262, [
        "Quantizing the cache instead of evicting it keeps every token and stores each of its numbers in "
        "fewer bits, with a shared scale restoring the range ({{fig:v04-o034}}). Episode 4 covered it in "
        "detail, including why keys and values want different treatment ({{fig:v04-o071}}).",
        "Four-bit storage saves about as much memory as keeping a fifth of the tokens, before the small "
        "cost of storing the scales. The difference is what is lost: eviction loses whole tokens, "
        "quantization a little precision on all of them.",
    ])
    emit("b19", stamp("Episode 4 covered that"),
         "Quantizing keeps every token, each one smaller", yb + 30, b + [body],
         "A different trade with a different failure mode. A slightly blurred token can still be found; "
         "an evicted one cannot.")


# ---- o022: The Sparse Frontier ----------------------------------------------------------------------------------------
def o022():
    X0, L = 230, 380
    b = [hd(40, 46, "The Sparse Frontier (2025): share of the attention kept, drawn to scale")]
    rows = [("one fact buried", "in the context", 0.05, "s", "still answers with 95% thrown away"),
            ("several facts", "to assemble", 0.20, "h", "starts failing with 80% thrown away")]
    for r, (a, c, keep, cls, note) in enumerate(rows):
        y = 72 + r * 58
        b.append(txt(40, y + 12, a, "cap"))
        b.append(txt(40, y + 28, c, "cap"))
        b.append(cell(X0, y, keep * L, 30, cls))
        b.append(txt(X0 + keep * L + 10, y + 20, f"{pct(keep, 0)} kept: {note}", "sub2"))
    ya = 72 + 2 * 58 + 6
    b.append(ln(X0, ya, X0 + L, ya, "axis"))
    for t in (0, 20, 40, 60, 80, 100):
        b.append(ln(X0 + t / 100 * L, ya, X0 + t / 100 * L, ya + 4, "tick"))
        b.append(txt(X0 + t / 100 * L, ya + 18, f"{t}%", "sub2", "middle"))
    assert round(1 / (1 - 0.95)) == 20 and round(1 / (1 - 0.80)) == 5      # a twentieth, a fifth
    body, yb = prose(ya + 60, [
        "A 2025 study called The Sparse Frontier measured what all of this does to accuracy, and found "
        "that how much you can throw away varies dramatically from task to task. A question that needs "
        "one fact buried in the context survives even when 95% of the attention is thrown away, a "
        "twentieth kept. A question that needs several facts assembled starts failing at 80%, with a "
        "fifth kept.",
        "No method wins everywhere, and the right choice depends on the task. When it does go wrong, the "
        "answer still comes back fluent, with the missing fact quietly replaced.",
    ])
    emit("o022", stamp("called the sparse frontier"),
         "One fact survives a twentieth of the attention; several facts fail at a fifth", yb + 30,
         b + [body],
         "The last line is the operational problem. A degraded long-context system does not announce "
         "itself; it becomes confidently wrong.")


if __name__ == "__main__":
    sec("s08", 8, "Deleting tokens outright",
        "Part 7's methods read less of the cache on each step. These keep less of it.")
    for fn in (b15, b16, o020, o021, b17, b18, b19, o022):
        fn()
