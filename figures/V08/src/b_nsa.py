"""V8 Part 7, native sparse attention and DSA: review §4 J1-J4, fix P12 (Fig 18's caption), restore names.

Hyperparameters and the read budget are from the NSA paper (arXiv 2502.11089: l = 32, d = 16, l' = 64,
n = 16 including 1 initial and 2 local blocks, w = 512; Table 4 memory access per decode step). The
top-2,048 selection is from DeepSeek's V3.2-Exp report. Scores and gate values are illustrative.

  o018  three branches, each with its own keys and values
  b10   how much each branch reads at 64k: 5,632 keys, 8.6%          (J1)
  b11   the summaries' weights choose the blocks                     (J2)
  b12   the gate: one sigmoid weight per branch, then a weighted sum (J3)
  b13   DSA: single tokens, 2,048 of 131,072                         (J4, P12)

  python3 figures/V08/src/b_nsa.py
"""
import math, random
from b_lib import (box, cell, ghost, txt, hd, ln, arr, prose, emit, stamp, f, n0, pct, text, CTX)

L_CMP, D_CMP, L_SLC, N_SLC, W_WIN = 32, 16, 64, 16, 512        # the paper's settings
TABLE4 = {8192: (2048, 4.0), 16384: (2560, 6.4), 32768: (3584, 9.1), 65536: (5632, 11.6)}


def nsa_keys(ctx):
    """Keys read per query per step, counted as the paper's Table 4 counts them."""
    return ctx // D_CMP + N_SLC * L_SLC + W_WIN


for _c, (_k, _s) in TABLE4.items():
    assert nsa_keys(_c) == _k and round(_c / _k, 1) == _s
assert round(nsa_keys(65536) / 65536 * 100, 1) == 8.6


# ---- o018: the overview ------------------------------------------------------------------------------
def o018():
    b = [hd(40, 46, "Native sparse attention: every query runs all three, and a learned gate blends them")]
    specs = [("Compression", "older tokens in blocks,", "each squashed to a summary"),
             ("Selection", "the few blocks that matter,", "read at full detail"),
             ("Sliding", "the most recent tokens,", "read in full")]
    xs = [40, 246, 452]
    for x, (t, a, c) in zip(xs, specs):
        b.append(box(x, 70, 188, 78, "s", t, a, c))
        b.append(txt(x + 94, 166, "its own keys and values", "sub2", "middle"))
    for x in xs:
        b.append(arr(x + 94, 176, 340 + (x + 94 - 340) * 0.25, 206))
    b.append(box(250, 210, 180, 36, "u", "learned gate"))
    b.append(arr(340, 250, 340, 270))
    b.append(txt(340, 288, "one output for the query", "sub2", "middle"))
    body, yb = prose(330, [
        "DeepSeek's native sparse attention makes the sparsity something the model learns in pretraining, "
        "the long first training run on a huge body of text ({{fig:v01-o002}}), rather than something "
        "bolted on afterwards. Every query runs three branches at once, and each branch has its own keys "
        "and values, computed from the same tokens, so each can specialise.",
        "A compression branch cuts the older tokens into blocks and squashes each block into one coarse "
        "summary. A selection branch picks out a few important blocks and keeps them at full detail. A "
        "sliding branch handles whatever is nearby. The next four figures take them in turn: what each "
        "reads, how the selection chooses, how the gate blends, and the version DeepSeek shipped.",
    ])
    emit("o018", stamp("native sparse attention makes the sparsity"),
         "DeepSeek's native sparse attention runs three branches, each with its own keys and values",
         yb + 30, b + [body],
         "What sets it apart from every other method in this part: the model learns where to look during "
         "pretraining, so nothing has to be approximated after the fact.")


# ---- b10: how much each branch reads ------------------------------------------------------------------
def b10():
    ctx = 65536
    parts = [("full attention", ctx, "u", f"{n0(ctx)} keys"),
             ("compression", ctx // D_CMP, "s", f"{n0(ctx // D_CMP)}: one summary per {D_CMP} tokens"),
             ("selection", N_SLC * L_SLC, "s", f"{n0(N_SLC * L_SLC)}: {N_SLC} blocks of {L_SLC}"),
             ("sliding window", W_WIN, "s", f"{W_WIN}: the most recent"),
             ("all three", nsa_keys(ctx), "s", f"{n0(nsa_keys(ctx))}, {pct(nsa_keys(ctx) / ctx)} of the context")]
    SC = 440 / ctx
    b = [hd(40, 46, f"Keys read for one query at {n0(ctx)} tokens, drawn to scale (the paper's settings)")]
    for k, (lab, v, c, note) in enumerate(parts):
        y = 66 + k * 36 + (8 if k == 4 else 0)
        b.append(txt(40, y + 17, lab, "cap"))
        w = v * SC
        if k == 0:
            b.append(cell(170, y, w, 24, c, label=note))
        else:
            b.append(cell(170, y, max(w, 1.5), 24, c))
            b.append(txt(170 + max(w, 1.5) + 10, y + 17, note, "sub2"))
    # how the summaries overlap: blocks of 32 starting every 16
    y0 = 284
    b.append(hd(40, y0, f"Compression up close: blocks of {L_CMP} tokens, a new one every {D_CMP}"))
    X0, PX, NT = 170, 4.5, 96
    b.append(cell(X0, y0 + 18, NT * PX, 14, "u", rx=2))
    for t in range(0, NT + 1, 16):
        b.append(ln(X0 + t * PX, y0 + 33, X0 + t * PX, y0 + 36, "tick"))
        b.append(txt(X0 + t * PX, y0 + 52, str(t), "sub2", "middle"))
    b.append(txt(40, y0 + 29, "tokens", "cap"))
    starts = list(range(0, NT - L_CMP + 1, D_CMP))
    for k, s0 in enumerate(starts):
        y = y0 + 62 + (k % 2) * 22
        b.append(cell(X0 + s0 * PX, y, L_CMP * PX, 16, "s", rx=2, label=f"summary {k + 1}"))
    b.append(txt(40, y0 + 85, "blocks", "cap"))
    assert len(starts) == 5 and starts[1] - starts[0] == D_CMP
    # the paper's Table 4
    yt = y0 + 136
    b.append(hd(40, yt, "Keys read per query as the context grows (the paper's Table 4)"))
    cols = [(40, "context"), (170, "keys read"), (300, "share"), (420, "fewer than full")]
    for x, t in cols:
        b.append(txt(x, yt + 24, t, "sub2"))
    for k, (c_, (kk, sp)) in enumerate(TABLE4.items()):
        y = yt + 46 + k * 20
        b.append(txt(40, y, n0(c_), "cap"))
        b.append(txt(170, y, n0(kk), "cap"))
        b.append(txt(300, y, pct(kk / c_), "cap"))
        b.append(txt(420, y, f"{f(c_ / kk, 1)} times", "cap"))
    body, yb = prose(yt + 46 + 3 * 20 + 46, [
        f"The compression branch keeps one summary for every {D_CMP} tokens, each squashing a block of "
        f"{L_CMP}, so neighbouring blocks overlap by half: {n0(65536)} ÷ {D_CMP} = {n0(65536 // D_CMP)} "
        f"summaries. The selection branch reads {N_SLC} blocks of {L_SLC} tokens at full detail, "
        f"{n0(N_SLC * L_SLC)} keys. The sliding branch reads the last {W_WIN}. Together "
        f"{n0(nsa_keys(65536))} keys, {pct(nsa_keys(65536) / 65536)} of the context.",
        "Decoding is limited by the bytes it reads, so reading 8.6% of the keys should make attention "
        "about 11.6 times faster at this length, and that is the speed-up the paper reports. Only the "
        "compression branch grows with the context, so the share keeps falling as the context grows.",
    ])
    emit("b10", stamp("A compression branch cuts"),
         "At 64k tokens the three branches read 5,632 keys: 8.6% of the context", yb + 30, b + [body],
         "Two of the three branches read a fixed amount, which is why the saving grows with length: a "
         "quarter of the keys at 8k, under a tenth at 64k.")


# ---- b11: the selection ----------------------------------------------------------------------------------
def selection(seed=11, nblk=12, per=4):
    rnd = random.Random(seed)
    z = [rnd.gauss(0, 0.6) for _ in range(nblk * per)]
    for i in (13, 14, 27):                                      # a few stretches the query cares about
        z[i] += 2.6
    m = max(z)
    e = [math.exp(v - m) for v in z]
    w = [v / sum(e) for v in e]
    imp = [sum(w[b * per:(b + 1) * per]) for b in range(nblk)]
    forced = {0, nblk - 2, nblk - 1}
    rest = sorted((b for b in range(nblk) if b not in forced), key=lambda b: -imp[b])
    chosen = set(rest[:2])
    return w, imp, forced, chosen


def b11():
    w, imp, forced, chosen = selection()
    nblk, per = len(imp), len(w) // len(imp)
    assert abs(sum(w) - 1) < 1e-12 and chosen == {3, 6} and len(forced | chosen) == 5
    X0, BW, G = 110, 40, 5
    b = [hd(40, 46, "One query, 12 blocks of 64 tokens: read 5 in full (illustrative weights)")]
    b.append(txt(40, 76, "the compression branch's weights on the 48 summaries, four per block", "sub2"))
    SC = 260
    base = 162
    for blk in range(nblk):
        x = X0 + blk * (BW + G)
        for j in range(per):
            v = w[blk * per + j]
            h = max(v * SC, 1)
            b.append(cell(x + 1 + j * 10, base - h, 8, h, "u", rx=1))
    b.append(ln(X0, base, X0 + nblk * (BW + G) - G, base, "axis"))
    b.append(txt(40, 192, "add up each block's four", "sub2"))
    for blk in range(nblk):
        x = X0 + blk * (BW + G)
        keep = blk in forced or blk in chosen
        b.append(cell(x, 202, BW, 30, "s" if keep else "u", label=f(imp[blk])))
        b.append(txt(x + BW / 2, 250, str(blk + 1), "sub2", "middle"))
        if blk in forced:
            b.append(txt(x + BW / 2, 268, "always", "sub2", "middle"))
        elif blk in chosen:
            b.append(txt(x + BW / 2, 268, "chosen", "sub2", "middle"))
    b.append(txt(40, 250, "block", "cap"))
    top2 = sorted(chosen)
    body, yb = prose(310, [
        "No extra scoring pass is needed. The compression branch has already compared the query with "
        "every summary, and its attention weights say which stretches of the context matter. Adding up "
        "the weights of the summaries inside each block gives the block's importance.",
        f"The first block and the two most recent are always read; the remaining places go to the "
        f"highest-scoring blocks, here blocks {top2[0] + 1} and {top2[1] + 1}. The paper reads 16 blocks of "
        "64 this way: the initial one, the 2 local ones and 13 chosen by score. The weights here are "
        "illustrative; the rule is the paper's.",
    ])
    emit("b11", stamp("A selection branch picks"),
         "The summaries' attention weights choose which blocks to read in full", yb + 30, b + [body],
         "Choosing costs almost nothing because it reuses work already done: the coarse branch is both "
         "one of the three answers and the map for another.")


# ---- b12: the gate ---------------------------------------------------------------------------------------------
O = {"compression": [0.4, -0.2, 0.1], "selection": [0.9, 0.3, -0.5], "sliding": [-0.1, 0.6, 0.2]}
Z = {"compression": -0.8, "selection": 1.7, "sliding": 0.2}
G = {k: 1 / (1 + math.exp(-v)) for k, v in Z.items()}
OUT = [sum(G[k] * O[k][i] for k in O) for i in range(3)]
assert max(G, key=G.get) == "selection" and round(sum(G.values()), 2) == 1.71


def b12():
    b = [hd(40, 46, "The output is a weighted sum: each branch's answer times its gate, then added")]
    heads = [(40, "branch"), (160, "its output (3 of its numbers)"), (380, "gate"), (470, "× gate")]
    for x, t in heads:
        b.append(txt(x, 78, t, "sub2"))
    CW, CG = 52, 6
    for r, k in enumerate(O):
        y = 90 + r * 40
        b.append(txt(40, y + 19, k, "cap"))
        for i in range(3):
            b.append(cell(160 + i * (CW + CG), y, CW, 28, "u", label=f(O[k][i])))
        b.append(cell(380, y, 64, 28, "s", label=f(G[k], 3)))
        for i in range(3):
            b.append(cell(470 + i * (CW + CG), y, CW, 28, "u", label=f(G[k] * O[k][i])))
    ys = 90 + 3 * 40 + 4
    b.append(ln(470, ys, 470 + 3 * CW + 2 * CG, ys, "tick"))
    b.append(txt(380, ys + 26, "sum:", "sub2"))
    for i in range(3):
        b.append(cell(470 + i * (CW + CG), ys + 8, CW, 28, "s", label=f(OUT[i])))
    b.append(txt(40, ys + 74, "each gate is σ(z) = 1 ÷ (1 + e^−z) of a score z from a small learned layer:", "sub2"))
    zl = ", ".join(f"σ({f(Z[k], 1)}) = {f(G[k], 3)}" for k in O)
    b.append(txt(40, ys + 92, zl, "sub2"))
    body, yb = prose(ys + 136, [
        "A small learned layer reads the query token's vector and gives one score per branch; a sigmoid "
        "squashes each score to between 0 and 1 ({{fig:v06-p20}}). Each branch's output is multiplied "
        "by its gate and the three are added. Here the selection branch counts most.",
        f"The gates need not add to one, and here they add to {f(sum(G.values()))}: each branch is "
        "weighed on its own, not as a share of a fixed budget.",
        "Why a sliding branch at all: local patterns are the easiest thing to learn, so without a branch "
        "of their own the other two would learn those and not much else. Trained this way from the "
        "start, the paper's model matches or exceeds full attention on general benchmarks (fixed sets "
        "of test questions, {{fig:v08-a34}}), long-context tasks and reasoning.",
    ])
    emit("b12", stamp("A learned gate blends"),
         "A learned gate gives each branch a weight between 0 and 1", yb + 30, b + [body],
         "Numbers illustrative, arithmetic exact. The blend itself is learned, so the model decides, "
         "query by query, how much each way of looking should count.")


# ---- b13: DSA ----------------------------------------------------------------------------------------------------
def dsa_field(seed=13, n=256, hot=24):
    rnd = random.Random(seed)
    z = [rnd.gauss(0, 0.5) for _ in range(n)]
    for i in rnd.sample(range(n), hot):
        z[i] += rnd.uniform(3.0, 4.5)
    m = max(z)
    e = [math.exp(v - m) for v in z]
    return [v / sum(e) for v in e]


def b13():
    w = dsa_field()
    n, side, budget = len(w), 16, 32
    rows = sorted(range(side), key=lambda r: -sum(w[r * side:(r + 1) * side]))[:budget // side]
    blk = {r * side + c for r in rows for c in range(side)}
    tok = set(sorted(range(n), key=lambda i: -w[i])[:budget])
    got_b, got_t = sum(w[i] for i in blk), sum(w[i] for i in tok)
    assert len(blk) == len(tok) == budget and got_t > got_b
    share = 2048 / CTX
    assert share == 0.015625
    b = [hd(40, 46, "The same 32-token budget, spent two ways (256 tokens, illustrative scores)")]
    P, C = 14, 12
    for k, (sel, x0, lab, got) in enumerate([(blk, 60, "two whole blocks of 16", got_b),
                                              (tok, 380, "the 32 best single tokens", got_t)]):
        b.append(txt(x0, 76, lab, "sub2"))
        for i in range(n):
            r, c = divmod(i, side)
            b.append(cell(x0 + c * P, 86 + r * P, C, C, "s" if i in sel else "u", rx=2))
        b.append(txt(x0, 86 + side * P + 20, f"catches {pct(got, 0)} of the weight", "sub2"))
    body, yb = prose(86 + side * P + 62, [
        "DeepSeek shipped a relative of native sparse attention as DeepSeek Sparse Attention, in "
        "DeepSeek-V3.2-Exp. It picks single tokens rather than whole blocks: for each query a small, "
        "fast scorer, the lightning indexer, rates every earlier token, and only the 2,048 highest are "
        f"read at full detail, {pct(share, 2)} of a {n0(CTX)}-token context.",
        "The indexer still looks at every earlier token, so its work grows with the square of the "
        "context, but it has few heads and works in 8-bit numbers, far cheaper per pair than the "
        f"attention it saves. Single tokens can follow the weight wherever it lands: with the same "
        f"budget here, they catch {pct(got_t, 0)} of it and two whole blocks {pct(got_b, 0)}.",
        "DeepSeek cut the prices of its API, what developers pay per token, by more than half on the "
        "same day.",
    ])
    emit("b13", stamp("picks single tokens rather"),
         "DeepSeek Sparse Attention reads single tokens: 2,048 of 131,072 per query", yb + 30, b + [body],
         "The price cut shows the saving reached the bill on day one. The evidence that quality did not "
         "pay for it is different: on public benchmarks the new model matched the one it replaced.")


if __name__ == "__main__":
    for fn in (o018, b10, b11, b12, b13):
        fn()
