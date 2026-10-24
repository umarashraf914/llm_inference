"""V8 Part 7, MoBA: review §4 J5, fix P4 (Fig 19's "learned gate"), restore names and the episode 6 link.

From the MoBA paper (arXiv 2502.13189): score_i = <q, mean of block i's keys>; top-k gate of 0s and 1s;
the query's own block always routed, with a causal mask; no future blocks; no new parameters; layers
can switch between MoBA and full attention; deployed for Kimi's long-context requests.

  o019  Moonshot's MoBA routes each query to the few blocks it needs   (P4, P20, names)
  b14   the gate worked: dot product with each block's average key      (J5)

  python3 figures/V08/src/b_moba.py
"""
from b_lib import (box, cell, ghost, txt, hd, ln, arr, prose, emit, stamp, f, n0, text)

Q = (0.6, 0.9)
KEYS3 = [(1.0, 0.2), (0.6, 0.8), (0.8, 0.5), (0.6, 0.5)]            # block 3's keys, worked in full
MEANS = {1: (0.2, 0.1), 2: (0.9, 0.3), 3: None, 4: (-0.4, 0.6), 5: (0.1, 0.9), 6: (0.5, -0.3),
         7: (-0.2, -0.6)}
MEANS[3] = tuple(sum(k[i] for k in KEYS3) / len(KEYS3) for i in range(2))
OWN, K = 8, 3
dot = lambda a, b: sum(x * y for x, y in zip(a, b))
SCORE = {b: dot(Q, m) for b, m in MEANS.items()}
KEPT = sorted(sorted(SCORE, key=lambda b: -SCORE[b])[:K - 1]) + [OWN]
assert MEANS[3] == (0.75, 0.5) and KEPT == [3, 5, 8]
assert abs(SCORE[3] - 0.9) < 1e-12 and abs(SCORE[5] - 0.87) < 1e-12 and SCORE[2] < SCORE[5]


def o019():
    b = [hd(40, 46, "Mixture of block attention: cut the context into blocks, send each query to a few")]
    b.append(box(40, 74, 92, 44, "u", "query"))
    BW, G, X0 = 54, 6, 160
    for blk in range(1, OWN + 1):
        x = X0 + (blk - 1) * (BW + G)
        b.append(cell(x, 74, BW, 44, "s" if blk in KEPT else "u", rx=4, label=f"block {blk}"))
        note = "own" if blk == OWN else ("kept" if blk in KEPT else "")
        if note:
            b.append(txt(x + BW / 2, 136, note, "sub2", "middle"))
    b.append(txt(X0, 166, "a top-k gate, with no weights of its own, picks which blocks the query reads", "sub2"))
    body, yb = prose(206, [
        "Moonshot's mixture of block attention, MoBA, routes queries instead of compressing tokens. It "
        "cuts the context into blocks and puts a gate in front of them, so each query goes only to the "
        "blocks it needs. That is the mixture-of-experts idea from episode 6 ({{fig:v06-o010}}) applied "
        "to attention instead of to the feed-forward network: the blocks play the experts.",
        "The model decides where to attend instead of being handed a fixed pattern, which MoBA's authors "
        "call a less-structure principle. The same mechanism can fall back to full attention whenever it "
        "needs to: layers switch between the two, and the authors' million-token model keeps its last "
        "three layers full. Moonshot deployed it to serve Kimi's long-context requests.",
    ])
    emit("o019", stamp("mixture of block attention"),
         "Moonshot's MoBA routes each query to the few blocks it needs", yb + 30, b + [body],
         "A satisfying reuse: the routing that chose feed-forward experts works just as well choosing "
         "which part of the context to read.")


def b14():
    b = [hd(40, 46, "One query, eight blocks; keys have two numbers here so the arithmetic fits")]
    # block 3's average, worked
    b.append(txt(40, 82, "block 3's keys", "cap"))
    CW, G, X0 = 72, 8, 170
    for i, k in enumerate(KEYS3):
        b.append(cell(X0 + i * (CW + G), 64, CW, 28, "u", label=f"({f(k[0], 1)}, {f(k[1], 1)})"))
    xa = X0 + 4 * (CW + G)
    b.append(txt(xa + 6, 82, "average", "sub2"))
    b.append(cell(xa + 60, 64, 86, 28, "s", label=f"({f(MEANS[3][0])}, {f(MEANS[3][1])})"))
    b.append(txt(40, 118, f"(1.0 + 0.6 + 0.8 + 0.6) ÷ 4 = {f(MEANS[3][0])}, and (0.2 + 0.8 + 0.5 + 0.5) ÷ 4 = "
                 f"{f(MEANS[3][1])}", "sub2"))
    # the table
    b.append(txt(40, 146, f"the query: q = ({f(Q[0], 1)}, {f(Q[1], 1)})", "sub2"))
    yt = 180
    cols = [(40, "block"), (110, "average key"), (230, "query · average"), (430, "score"), (520, "gate")]
    for x, t in cols:
        b.append(txt(x, yt, t, "sub2"))
    for r, blk in enumerate(range(1, OWN + 1)):
        y = yt + 14 + r * 30
        kept = blk in KEPT
        b.append(txt(40, y + 17, str(blk) + ("  (own)" if blk == OWN else ""), "cap"))
        if blk == OWN:
            b.append(txt(110, y + 17, "not scored: always kept, causal mask inside", "sub2"))
        else:
            m = MEANS[blk]
            b.append(txt(110, y + 17, f"({f(m[0])}, {f(m[1])})", "sub2"))
            b.append(txt(230, y + 17, f"{f(Q[0], 1)} × {f(m[0])} + {f(Q[1], 1)} × {f(m[1])}", "sub2"))
            b.append(cell(430, y, 62, 24, "s" if kept else "u", label=f(SCORE[blk])))
        b.append(cell(520, y, 40, 24, "s" if kept else "u", label="1" if kept else "0"))
    yb0 = yt + 14 + OWN * 30 + 30
    body, yb = prose(yb0, [
        "Each block is summarised by the average of its keys: add them and divide by how many. The "
        "query's dot product with that average is the block's score ({{fig:v03-o014}}), and the gate "
        "keeps the k highest ({{fig:v06-o009}}).",
        f"The query's own block is always kept, with the usual causal mask inside it, and blocks after "
        f"the query are never scored. Here k = {K}: the own block plus the two best earlier ones, blocks "
        f"{KEPT[0]} and {KEPT[1]}. The query then attends, by ordinary softmax, to the tokens of those "
        f"three blocks only.",
        "The gate is 1 for a kept block and 0 for the rest, and it has no weights of its own. What "
        "training shapes is the queries and keys themselves, learned with the gate in place.",
    ])
    emit("b14", stamp("It cuts the context into blocks"),
         "MoBA scores a block by the query's dot product with the block's average key", yb + 30,
         b + [body],
         "Unlike episode 6's router, which has a weight matrix of its own, this gate is arithmetic on "
         "vectors the model already computes. Learned belongs to the queries and keys, not to the gate.")


if __name__ == "__main__":
    for fn in (o019, b14):
        fn()
