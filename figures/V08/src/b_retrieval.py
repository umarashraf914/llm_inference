"""V8 Part 9, retrieval: review §4 L1-L4, restore the name, the 2020 method and the episode 7 link.

Source read: Lewis et al. 2020, Retrieval-Augmented Generation (arXiv 2005.11401): a dense vector index
of Wikipedia (21 million 100-word chunks), a pre-trained neural retriever (DPR), top-K by maximum
inner product search in sub-linear time. Chunk sizes and the corpus size below are illustrative.

  o023  the pipeline: ahead of time, and per question     (names)
  b20   a chunk's vector: similar meanings land close      (L1)
  b21   nearest means the highest cosine, worked           (L2)
  b22   corpus of any size, prompt of a few thousand       (L3)
  o024  what retrieval gives up
  b23   the shared prefix ends where the chunks begin      (L4, P20)

  python3 figures/V08/src/b_retrieval.py
"""
import math
from b_lib import (box, cell, ghost, txt, hd, ln, arr, prose, emit, stamp, f, n0, pct, text, KV_PER_TOKEN)


# ---- o023: the pipeline ---------------------------------------------------------------------------------
def o023():
    b = [hd(40, 46, "Ahead of time, once")]
    b.append(box(40, 64, 140, 40, "u", "the corpus"))
    b.append(arr(184, 84, 206, 84))
    b.append(box(210, 64, 150, 40, "u", "split into chunks"))
    b.append(arr(364, 84, 386, 84))
    b.append(box(390, 64, 250, 40, "u", "each stored as a vector"))
    b.append(hd(40, 150, "When a question arrives"))
    b.append(box(40, 168, 140, 40, "u", "the question"))
    b.append(arr(184, 188, 206, 188))
    b.append(box(210, 168, 150, 40, "u", "turned into a vector"))
    b.append(arr(364, 188, 386, 188))
    b.append(box(390, 168, 250, 40, "s", "nearest few into the prompt"))
    body, yb = prose(252, [
        "Retrieval-augmented generation keeps the documents outside the prompt and pulls in only the "
        "few pieces each question needs. The corpus is everything the model should be able to draw on. "
        "It is split into chunks and indexed ahead of time, each chunk stored as a vector that captures "
        "roughly what it says.",
        "When a question arrives, it is turned into a vector the same way, the chunks nearest to it are "
        "found, and only those few are put in the prompt. The next three figures open the boxes: what a "
        "chunk's vector is, what nearest means, and what this saves.",
    ])
    emit("o023", stamp("Retrieval augmented generation keeps"),
         "Retrieval-augmented generation keeps the documents outside the prompt", yb + 30, b + [body],
         "Everything slow happens once, ahead of time. Per question there is one short encoding, one "
         "search, and a prompt of a few chunks.")


# ---- b20: points in a space ------------------------------------------------------------------------------
PTS = [("returns: 30 days", 140, 112, "a"), ("refunds to your card", 190, 144, "a"),
       ("exchanging a size", 128, 168, "a"),
       ("delivery: 3 to 5 days", 420, 100, "b"), ("express shipping", 452, 132, "b"),
       ("tracking a parcel", 404, 162, "b"),
       ("store opening hours", 430, 246, "c"), ("finding a store", 470, 278, "c"),
       ("jobs at the shop", 120, 250, "d"), ("internships", 160, 282, "d")]
QPT = (256, 90)


def b20():
    b = [hd(40, 46, "A shop's help pages as points (schematic: real vectors have hundreds of numbers)")]
    b.append(ghost(60, 70, 580, 236, rx=8))
    for lab, x, y, _ in PTS:
        b.append(cell(x - 4, y - 4, 8, 8, "u", rx=4))
        b.append(txt(x + 10, y + 4, lab, "sub2"))
    qx, qy = QPT
    b.append(cell(qx - 5, qy - 5, 10, 10, "h", rx=5))
    b.append(txt(qx + 12, qy + 4, "the question:", "sub2"))
    b.append(txt(qx + 12, qy + 20, "can I send a jacket back?", "sub2"))
    near = sorted(PTS, key=lambda p: math.hypot(p[1] - qx, p[2] - qy))[:2]
    assert [p[3] for p in near] == ["a", "a"]                    # its nearest neighbours are the returns pages
    body, yb = prose(346, [
        "An embedding model turns each chunk into a list of numbers, a vector ({{fig:v01-o084}}), "
        "trained so that chunks saying similar things get similar numbers. Each number is a coordinate, "
        "so each chunk is a point.",
        "Drawn in two dimensions, the help pages fall into neighbourhoods: returns near refunds, "
        "delivery near tracking. The question, encoded the same way, lands among the returns pages "
        "without sharing a single word with them.",
    ])
    emit("b20", stamp("Each chunk is stored as a vector"),
         "A chunk's vector places similar meanings close together", yb + 30, b + [body],
         "Schematic, since nobody can draw hundreds of dimensions. What carries over is the geometry: "
         "close means similar, and closeness is all the search will use.")


# ---- b21: cosine, worked ------------------------------------------------------------------------------------
Q = (0.8, 0.6)
CH = {"A": (0.9, 0.4), "B": (0.1, 1.0), "C": (-0.7, 0.7)}
dot = lambda a, b: a[0] * b[0] + a[1] * b[1]
norm = lambda a: math.hypot(*a)
COS = {k: dot(Q, v) / (norm(Q) * norm(v)) for k, v in CH.items()}
TOP2 = sorted(COS, key=lambda k: -COS[k])[:2]
assert norm(Q) == 1.0 and TOP2 == ["A", "B"]
assert [round(COS[k], 3) for k in "ABC"] == [0.975, 0.677, -0.141]


def b21():
    b = [hd(40, 46, "The question q against three chunks A, B and C, in two dimensions")]
    OX, OY, S = 190, 236, 130
    P = lambda v: (OX + v[0] * S, OY - v[1] * S)
    b.append(ln(OX - 1.05 * S, OY, OX + 1.15 * S, OY, "axis"))
    b.append(ln(OX, OY + 6, OX, OY - 1.12 * S, "axis"))
    for v, lab in [((-1, 0), "−1"), ((1, 0), "1")]:
        x, y = P(v)
        b.append(ln(x, OY, x, OY + 4, "tick"))
        b.append(txt(x, OY + 18, lab, "sub2", "middle"))
    b.append(txt(OX - 6, OY - S + 4, "1", "sub2", "end"))
    b.append(ln(OX - 4, OY - S, OX, OY - S, "tick"))
    offs = {"q": (8, 10), "A": (8, 6), "B": (8, -2), "C": (-10, -4)}
    for k, v in [("q", Q)] + list(CH.items()):
        x, y = P(v)
        b.append(f'<line class="{"mark" if k == "q" else "conn"}" x1="{OX}" y1="{OY}" x2="{x:.1f}" y2="{y:.1f}" '
                 f'marker-end="url(#arw)"/>')
        dx, dy = offs[k]
        b.append(txt(x + dx, y + dy, f"{k} ({f(v[0], 1)}, {f(v[1], 1)})", "sub2", "end" if dx < 0 else "start"))
    # the table
    X = [420, 452, 524, 590]
    for x, t in zip(X, ["", "q · chunk", "length", "cosine"]):
        b.append(txt(x, 82, t, "sub2"))
    for r, k in enumerate("ABC"):
        y = 96 + r * 40
        v = CH[k]
        b.append(txt(X[0], y + 18, k, "cap"))
        b.append(txt(X[1], y + 18, f(dot(Q, v)), "sub2"))
        b.append(txt(X[2], y + 18, f(norm(v), 3), "sub2"))
        b.append(cell(X[3], y, 60, 26, "s" if k in TOP2 else "u", label=f(COS[k], 3)))
    b.append(txt(X[0], 240, "A and B go in the prompt", "sub2"))
    body, yb = prose(292, [
        f"The dot product multiplies the pairs and adds ({{{{fig:v03-o014}}}}): q · A = 0.8 × 0.9 + "
        f"0.6 × 0.4 = {f(dot(Q, CH['A']))}. Dividing by both lengths, each found by Pythagoras "
        f"(|A| = √(0.9² + 0.4²) = {f(norm(CH['A']), 3)}), gives the cosine of the angle between the two "
        "arrows: 1 for the same direction, 0 at right angles, −1 for opposite.",
        f"A scores {f(COS['A'], 3)} and B {f(COS['B'], 3)}, so with room for two they go in the prompt; C "
        f"points away and scores {f(COS['C'], 3)}. The 2020 system ranked its 21 million chunks of "
        "Wikipedia by the plain dot product, with an index that finds the top scorers without checking "
        "every one.",
    ])
    emit("b21", stamp("finds the chunks nearest to it"),
         "Nearest means the highest cosine", yb + 30, b + [body],
         "Two multiplications, an addition and a division per chunk: retrieval is a ranking by one number, "
         "which is why it can search millions of chunks for every question.")


# ---- b22: what it saves ---------------------------------------------------------------------------------------
PROMPT = 5 * 500 + 50
CORPUS = 10**9


def b22():
    rows = [("a billion-token corpus", "held in context", CORPUS * KV_PER_TOKEN, "h"),
            ("one 128k context", "", 131_072 * KV_PER_TOKEN, "h"),
            ("retrieval: 5 chunks of 500", "and a 50-token question", PROMPT * KV_PER_TOKEN, "s")]
    assert round(rows[0][2] / 1e12, 1) == 327.7 and round(rows[2][2] / 1e9, 2) == 0.84
    ratio = rows[0][2] / rows[2][2]
    assert round(ratio, -4) == 390_000
    X0, DEC, LO = 230, 52, -1                                    # 52 px per factor of ten, from 0.1 GB
    xg = lambda gb: X0 + (math.log10(gb) - LO) * DEC
    b = [hd(40, 46, "Cache needed for one question with the 70B model, log scale ({{fig:v01-o121}})")]
    for k, (a, c, v, cls) in enumerate(rows):
        y = 70 + k * 48
        b.append(txt(40, y + (12 if c else 18), a, "cap"))
        if c:
            b.append(txt(40, y + 28, c, "cap"))
        gb = v / 1e9
        w = xg(gb) - X0
        b.append(cell(X0, y, w, 26, cls))
        lab = f"{f(v / 1e12, 1)} TB" if gb >= 1000 else f"{f(gb, 1 if gb >= 10 else 2)} GB"
        b.append(txt(X0 + w + 10, y + 18, lab, "sub2"))
    ya = 70 + 3 * 48 + 4
    b.append(ln(X0, ya, xg(1e6), ya, "axis"))
    for e_, lab in zip(range(-1, 7), ["0.1 GB", "1 GB", "10 GB", "100 GB", "1 TB", "10 TB", "100 TB", "1 PB"]):
        x = xg(10.0**e_)
        b.append(ln(x, ya, x, ya + 4, "tick"))
        b.append(txt(x, ya + 18, lab, "sub2", "middle"))
    body, yb = prose(ya + 62, [
        f"The context stays a few thousand tokens long no matter how large the corpus is, so the cache "
        f"never gets a chance to grow: five chunks of 500 tokens and a 50-token question are {n0(PROMPT)} "
        f"tokens, {f(rows[2][2] / 1e9, 2)} GB of cache, whatever the corpus holds. Holding a billion-token "
        f"corpus in context would take {f(rows[0][2] / 1e12, 1)} TB.",
        "A 2020 paper introduced this using a dense vector index of Wikipedia with a trained retriever in "
        "front of it. Saving memory was not what its authors were after: they wanted a model that could "
        "reach knowledge it had never memorised. Keeping the context short is a side effect that turned "
        "out to matter later.",
    ])
    emit("b22", stamp("The context stays a few thousand tokens"),
         "The corpus can be any size; the prompt stays a few thousand tokens", yb + 30, b + [body],
         f"Log scale: the two ends differ about {n0(round(ratio, -4))}-fold. A technique that arrived for one "
         "reason and stayed for another.")


# ---- o024: the costs ------------------------------------------------------------------------------------------
def o024():
    b = [hd(40, 46, "What retrieval gives up")]
    b.append(box(40, 70, 190, 82, "h", "The retriever decides", "what the model is", "allowed to know"))
    b.append(box(246, 70, 190, 82, "h", "A second system", "with its own index to", "build, refresh and tune"))
    b.append(box(452, 70, 188, 82, "h", "Prefix caching", "fits badly: the next", "figure shows why"))
    body, yb = prose(198, [
        "If the retriever misses the chunk holding the answer, the model never sees it. No amount of "
        "capability recovers a document that was never put in front of it.",
        "You are also running a second system now, with its own index to build, refresh and tune, and it "
        "fits badly with prefix caching.",
    ])
    emit("o024", stamp("the retriever now decides"),
         "In exchange, the retriever decides what the model is allowed to know", yb + 30, b + [body],
         "The first cost is the serious one. Retrieval moves the question of what the model knows out of "
         "the model and into a search.")


# ---- b23: prefix caching and retrieval ---------------------------------------------------------------------------
def b23():
    SYS, MID, QN = 500, 2500, 50
    TOT = SYS + MID + QN
    share_fixed, share_rag = (SYS + MID) / TOT, SYS / TOT
    assert round(share_fixed * 100, 1) == 98.4 and round(share_rag * 100, 1) == 16.4
    X0, L = 150, 450
    s = lambda n: n / TOT * L
    b = [hd(40, 46, f"Two questions to one assistant, each prompt {n0(TOT)} tokens, drawn to scale")]
    cases = [("same document", [("system", SYS, "s"), ("the document", MID, "s"), ("", QN, "h")],
              [("system", SYS, "s"), ("the same document", MID, "s"), ("", QN, "h")], share_fixed),
             ("retrieval", [("system", SYS, "s"), ("chunks for question 1", MID, "h"), ("", QN, "h")],
              [("system", SYS, "s"), ("chunks for question 2", MID, "h"), ("", QN, "h")], share_rag)]
    y = 66
    for name, r1, r2, share in cases:
        b.append(txt(40, y + 14, name, "cap"))
        for k, row in enumerate((r1, r2)):
            yy = y + k * 32
            x = X0
            for lab, n, c in row:
                b.append(cell(x, yy, s(n), 24, c, rx=2, label=lab if lab else None))
                x += s(n)
            b.append(txt(X0 + L + 8, yy + 16, f"request {k + 1}", "sub2"))
        b.append(txt(X0, y + 2 * 32 + 14, f"shared prefix: {pct(share)}", "sub2"))
        y += 2 * 32 + 44
    b.append(txt(X0, y - 4, f"system {SYS} + document or chunks {n0(MID)} + question {QN} tokens; teal reused, red computed afresh", "sub2"))
    body, yb = prose(y + 40, [
        "Prefix caching, which episode 7 built ({{fig:v07-o012}}), works because an identical run of "
        "tokens produces identical keys and values, so the shared front of a prompt can be computed once "
        "and reused. The match runs from the first token and stops at the first difference "
        "({{fig:v01-o044}}).",
        f"Retrieved chunks change from query to query and they sit near the front of the prompt. Two "
        f"requests diverge almost immediately: only {SYS} of {n0(TOT)} tokens are shared, {pct(share_rag, 0)}, "
        f"against {pct(share_fixed, 0)} when the same document sits in every prompt.",
    ])
    emit("b23", stamp("discussed in episode 7"),
         "With retrieval, the shared prefix ends where the chunks begin", yb + 30, b + [body],
         "Two sensible techniques pulling against each other: retrieval puts the varying text near the "
         "front, exactly where prefix caching needs everything to stay the same.")


if __name__ == "__main__":
    for fn in (o023, b20, b21, b22, o024, b23):
        fn()
