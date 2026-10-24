"""V8 Part 5, EAGLE: draft the vector, not the token (review §4 F1–F5; §5 P19, P22).

  python3 figures/V08/src/spec_eagle.py     writes items a26–a30 and o013

a26  F1  Medusa's heads all guess from one snapshot
a27  F2  EAGLE drafts the vector the decoding head reads, and borrows the target's head to turn it into a token
a28  F3  Vectors drift; tokens jump
a29  F4  EAGLE-2 spends its branches where the drafter is confident
a30  F5  EAGLE-3 reads three depths of the target and drafts tokens again
o013     regenerated as the EAGLE closer: 6.5× against 1.38×, and the batch sweep from the same paper

Sources read: EAGLE (arXiv 2401.15077), EAGLE-2 (2406.16858), EAGLE-3 (2503.01840), Medusa (2401.10774).
"""
import math
from spec_common import (cell, ghost, txt, hd, ln, arr, box, prose, emit, at, bar, f, fc)


# ---- a26 · F1: one snapshot ----------------------------------------------------------------------------
def a26():
    b = [hd(40, 46, "Guesses for the next four positions, made two ways")]
    xs = [200, 310, 420, 530]
    W_ = 92
    b.append(txt(40, 82, "Medusa's heads", "hd"))
    b.append(box(40, 96, 130, 120, "u", "hidden state", "at the last", "real token"))
    medusa = ["the", "dog", "purred", "loudly"]
    for k, w in enumerate(medusa):
        y = 92 + k * 32
        b.append(arr(176, y + 12, xs[k] - 4, y + 12))
        b.append(cell(xs[k], y, W_, 24, "h" if w == "purred" else "m", label=w))
    b.append(txt(xs[2] + W_ + 10, 92 + 2 * 32 + 16, "assumed ‘cat’", "sub2"))
    y2 = 262
    b.append(txt(40, y2, "a drafter that feeds each guess back in", "hd"))
    chain = ["the", "dog", "barked", "loudly"]
    b.append(box(40, y2 + 14, 130, 40, "u", "hidden state"))
    b.append(arr(176, y2 + 34, xs[0] - 4, y2 + 34))
    for k, w in enumerate(chain):
        b.append(cell(xs[k], y2 + 22, W_, 24, "m", label=w))
        if k < 3:
            b.append(arr(xs[k] + W_ + 3, y2 + 34, xs[k + 1] - 4, y2 + 34))
    b.append(txt(xs[0], y2 + 72, "each arrow carries the guess into the next pass", "sub2"))
    body, yb = prose(y2 + 116, [
        "The heads still guess several positions ahead from a single snapshot of the model's state, "
        "taken before any of these guesses were made. The head for three ahead cannot know that the "
        "head for two ahead picked ‘dog’, so it can guess ‘purred’, a word that only follows ‘cat’.",
        "A drafter that writes the normal way feeds each guess back in, so its third guess already "
        "knows the second: ‘barked’, after ‘dog’. That costs one small pass per guess, but the "
        "guesses hang together.",
    ])
    emit("a26", at("The heads still guess several positions ahead from a single snapshot"),
         "Medusa's heads all guess from one snapshot", yb + 30, b + [body],
         "Speed from guessing all at once, paid for in coherence. EAGLE keeps the feeding back, and "
         "makes the drafter tiny.")


# ---- a27 · F2: EAGLE-1 -----------------------------------------------------------------------------------
def a27():
    b = [hd(40, 46, "Left, the target; right, EAGLE-1's drafter, which borrows two of its parts")]
    # the target, a nested container
    b.append(f'<g class="u"><rect x="40" y="66" width="260" height="290" rx="14"/>'
             f'<text class="lbl" x="62" y="92">the target</text></g>')
    b.append(cell(70, 108, 200, 30, "u", label="embedding table"))
    b.append(arr(170, 140, 170, 154))
    b.append(cell(70, 158, 200, 40, "u", label="80 layers"))
    b.append(arr(170, 200, 170, 214))
    b.append(cell(70, 218, 200, 30, "m", label="top hidden state: 8,192 numbers"))
    b.append(arr(170, 250, 170, 264))
    b.append(cell(70, 268, 200, 30, "u", label="decoding head"))
    b.append(arr(170, 300, 170, 312))
    b.append(cell(110, 316, 120, 24, "u", label="next token"))
    # the drafter
    b.append(f'<g class="m"><rect x="340" y="66" width="300" height="290" rx="14"/>'
             f'<text class="lbl" x="362" y="92">EAGLE-1\'s drafter</text></g>')
    b.append(cell(370, 108, 240, 30, "u", label="vector + next token's embedding"))
    b.append(arr(490, 140, 490, 154))
    b.append(cell(370, 158, 240, 40, "u", label="mixing layer, then one layer"))
    b.append(arr(490, 200, 490, 214))
    b.append(cell(370, 218, 240, 30, "m", label="predicted next hidden state"))
    b.append(arr(490, 250, 490, 264))
    b.append(cell(370, 268, 240, 30, "u", label="the target's head, borrowed"))
    b.append(arr(490, 300, 490, 312))
    b.append(cell(430, 316, 120, 24, "u", label="a guessed token"))
    b.append(arr(302, 233, 336, 123))
    b.append(txt(40, 384, "the guessed token and the predicted vector go back in for the next guess", "sub2"))
    body, yb = prose(426, [
        "EAGLE, a family of drafting methods from 2024, changes what the drafter predicts. Instead of "
        "the next token, EAGLE-1 predicts the target's own hidden state at the top of its layer stack: "
        "the vector the decoding head reads, which the paper calls the second-to-top layer, counting "
        "the head as the top. The target's head then turns it into a token.",
        "The drafter is small: one layer that mixes that vector with the next token's embedding, its "
        "row of the embedding table ({{fig:v01-o087}}), then one layer of the kind the target stacks "
        "80 of ({{fig:v01-o091}}): under a billion trainable weights for a 70B target (0.99 billion). "
        "Its embedding table and head are the target's own, borrowed rather than trained.",
        "EAGLE-1 arranges its guesses into a tree the same way Medusa does, and checks them with the "
        "rule of Part 3, so the output stays exact.",
    ])
    emit("a27", at("Eagle is a family of drafting methods"),
         "EAGLE drafts the vector the decoding head reads, and borrows the head to turn it into a token",
         yb + 30, b + [body],
         "The drafter predicts in the target's own internal language, and the target's own head "
         "translates it into tokens. That division of labour is the whole idea.")


# ---- a28 · F3: vectors drift, tokens jump --------------------------------------------------------------
WORDS = ["The", "cat", "sat", "on", "the", "mat"]
# Checked with tiktoken (cl100k_base, GPT-4's tokeniser, 100,277 rows): "The cat sat on the mat." is
# [791, 8415, 7731, 389, 279, 5634, 13]; rows 8414 and 8416 are " excell" and "normal", rows 7730 and
# 7732 are " Fre" and " wood".
NEIGHBOURS = [(8414, "excell"), (8415, "cat"), (8416, "normal"), (7730, "Fre"), (7731, "sat"), (7732, "wood")]


def a28():
    b = [hd(40, 46, "A vector can be nearly right; a token cannot")]
    b.append(txt(40, 76, "hidden states along ‘The cat sat on the mat’ (schematic)", "sub2"))
    pts = [(70 + 42 * k, 200 - 70 * math.sin(k / 5 * math.pi * 0.9) - 6 * k) for k in range(6)]
    b.append('<polyline class="pl-m" points="' + " ".join(f"{x:.1f},{y:.1f}" for x, y in pts) + '"/>')
    for (x, y), w in zip(pts, WORDS):
        b.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4" fill="var(--paper)" stroke="var(--m)" stroke-width="1.5"/>')
        b.append(txt(x, y + 28, w, "sub2", "middle"))
    b.append(txt(40, 252, "each step moves a little: the next one is a short reach", "sub2"))
    X2 = 380
    b.append(txt(X2, 76, "rows of GPT-4's token table", "sub2"))
    for k, (row, w) in enumerate(NEIGHBOURS):
        y = 88 + k * 26 + (12 if k >= 3 else 0)
        hit = w in ("cat", "sat")
        b.append(txt(X2, y + 16, f"{row:,}", "sub2"))
        b.append(cell(X2 + 60, y, 130, 22, "m" if hit else "u", label=f"‘ {w}’" if w != "normal" else "‘normal’"))
    b.append(txt(X2, 270, "the row next door is an unrelated word", "sub2"))
    body, yb = prose(314, [
        "A hidden state changes a little from one position to the next, so predicting the next one is "
        "like extending a curve. That is the EAGLE paper's observation: these vectors are more regular "
        "than the tokens, and predicting the vector, then reading a token off it with the target's "
        "head, beat predicting the token directly.",
        "A token is a row number in a table ({{fig:v01-o087}}), and nearby rows mean nothing. In "
        "GPT-4's table the row after ‘ cat’ is ‘normal’ and the row after ‘ sat’ is ‘ wood’. A guessed "
        "token is the right row or a wrong one; there is no nearly right.",
    ])
    emit("a28", at("Those internal vectors change smoothly"),
         "Vectors drift; tokens jump", yb + 30, b + [body],
         "The left panel is schematic: real hidden states have 8,192 numbers, not two. The contrast is "
         "the paper's: a vector can be nearly right and still read as the right token.")


# ---- a29 · F4: EAGLE-2's dynamic tree -------------------------------------------------------------------
EASY = lambda depth: [0.9, 0.06, 0.02]                         # illustrative drafter confidences
HARD = lambda depth: [0.4, 0.3, 0.15, 0.1] if depth == 1 else [0.5, 0.2, 0.1]
FIXED = [(0,), (1,), (0, 0), (0, 1), (1, 0), (0, 0, 0)]       # one fixed shape with six nodes
BUDGET = 6


def tree_values(conf, maxdepth=7):
    vals = {(): 1.0}
    frontier = [()]
    for d in range(1, maxdepth + 1):
        nxt = []
        for node in frontier:
            for r, c in enumerate(conf(d)):
                vals[node + (r,)] = vals[node] * c
                nxt.append(node + (r,))
        frontier = nxt
    return vals


def dynamic(conf):
    """EAGLE-2's rule as the paper states it: a node's value is the product of the drafter's
    confidences along its path, and the highest-valued nodes are kept for checking."""
    vals = tree_values(conf)
    nodes = sorted((n for n in vals if n), key=lambda n: (-vals[n], len(n), n))[:BUDGET]
    assert all(n[:-1] in nodes or len(n) == 1 for n in nodes)          # the kept nodes form a tree
    return nodes, vals


def layout(nodes, x0, w):
    """x positions: leaves spread evenly in depth-first order, parents centred over children."""
    kids = {n: sorted(c for c in nodes if c[:-1] == n) for n in [()] + nodes}
    order, xs = [], {}

    def visit(n):
        if not kids[n]:
            order.append(n)
        for c in kids[n]:
            visit(c)
    visit(())
    for i, n in enumerate(order):
        xs[n] = x0 + (i + 0.5) * w / len(order)

    def place(n):
        if n in xs:
            return xs[n]
        xs[n] = sum(place(c) for c in kids[n]) / len(kids[n])
        return xs[n]
    place(())
    return xs


def draw_tree(nodes, vals, x0, w, y0, show_vals=True):
    o = []
    xs = layout(nodes, x0, w)
    NW, NH, DY = 40, 20, 32
    o.append(cell(xs[()] - 8, y0, 16, 12, "u", rx=2))
    for n in nodes:
        px, py = xs[n[:-1]], y0 + (len(n) - 1) * DY + (12 if len(n) == 1 else NH)
        o.append(ln(px, py + 1, xs[n], y0 + len(n) * DY - 1))
    for n in nodes:
        lab = f"{vals[n]:.2f}".rstrip("0").rstrip(".") if show_vals else None
        o.append(cell(xs[n] - NW / 2, y0 + len(n) * DY, NW, NH, "m", rx=3, label=lab))
    return o


def a29():
    e_nodes, e_vals = dynamic(EASY)
    h_nodes, h_vals = dynamic(HARD)
    assert e_nodes == [(0,), (0, 0), (0, 0, 0), (0, 0, 0, 0), (0, 0, 0, 0, 0), (0, 0, 0, 0, 0, 0)]
    assert sorted(h_nodes) == sorted([(0,), (1,), (0, 0), (2,), (1, 0), (3,)])
    ev = lambda nodes, vals: sum(vals[n] for n in nodes)
    fe, fh = ev(FIXED, tree_values(EASY)), ev(FIXED, tree_values(HARD))
    de, dh = ev(e_nodes, e_vals), ev(h_nodes, h_vals)
    assert round(fe, 2) == 2.61 and round(de, 2) == 4.22 and round(fh, 2) == 1.23 and round(dh, 2) == 1.30
    b = [hd(40, 46, "Six nodes to spend; the drafter's confidences decide the shape (illustrative)")]
    panels = [("a fixed shape", FIXED, tree_values(EASY), 40, False),
              ("EAGLE-2, easy stretch", e_nodes, e_vals, 250, True),
              ("EAGLE-2, hard stretch", h_nodes, h_vals, 450, True)]
    for title, nodes, vals, x0, show in panels:
        b.append(txt(x0, 78, title, "sub2"))
        b += draw_tree(nodes, vals, x0, 190, 92, show)
    yt = 92 + 6 * 32 + 50
    for x, h in [(40, "expected guesses accepted"), (260, "fixed shape"), (380, "EAGLE-2's shape")]:
        b.append(txt(x, yt, h, "sub2"))
    for k, (lab, fv, dv) in enumerate([("easy stretch", fe, de), ("hard stretch", fh, dh)]):
        y = yt + 24 + k * 22
        b.append(txt(40, y, lab, "cap"))
        b.append(txt(260, y, f"{fv:.2f}", "sub2"))
        b.append(txt(380, y, f"{dv:.2f}", "sub2"))
    body, yb = prose(yt + 24 + 2 * 22 + 36, [
        "EAGLE-2 leaves the drafting alone and changes the shape of the tree. A guess deep in the tree "
        "counts only if every guess above it survives, so its worth is the product of the chances along "
        "its path. EAGLE-2 estimates each chance with the drafter's own confidence, the probability "
        "it gave its guess, which the authors found tracks the real acceptance rate closely, then "
        "keeps the highest-valued nodes.",
        "In an easy stretch, confidences of 0.9 keep one line worth extending: six deep is still worth "
        "0.53. In a hard one the best first guess is 0.4 and its best child 0.4 × 0.5 = 0.2, so the "
        "budget goes into alternatives at the first position. The expected count of accepted guesses "
        "is the sum of the kept values.",
        "Another 20 to 40% over EAGLE-1, and the output is still exact, because only the drafting "
        "changed.",
    ])
    emit("a29", at("Eagle 2 leaves the drafting alone"),
         "EAGLE-2 spends its branches where the drafter is confident", yb + 30, b + [body],
         "Same budget of positions, placed by measured confidence instead of a fixed pattern. A fixed "
         "tree wastes width when the text is easy and depth when it is hard.")


# ---- a30 · F5: EAGLE-3 ------------------------------------------------------------------------------------
def a30():
    b = [hd(40, 46, "Three taps on the target, joined, and a drafter that predicts tokens")]
    b.append(f'<g class="u"><rect x="40" y="66" width="250" height="230" rx="14"/>'
             f'<text class="lbl" x="62" y="92">the target\'s layers</text></g>')
    taps = [("a high layer", 112), ("a middle layer", 170), ("a low layer", 228)]
    for lab, y in taps:
        b.append(cell(70, y, 190, 34, "u", label=lab))
        b.append(arr(264, y + 17, 336, 181 + (y - 170) * 0.25))
    b.append(cell(340, 152, 140, 60, "m", label="join: 3 × 8,192"))
    b.append(txt(410, 228, "squeezed to 8,192", "sub2", "middle"))
    b.append(arr(484, 182, 516, 182))
    b.append(cell(520, 152, 120, 60, "m", label="drafter"))
    b.append(txt(580, 228, "predicts tokens", "sub2", "middle"))
    # schematic scaling curves
    y0 = 340
    b.append(hd(40, y0, "Speed-up against training data (schematic, after the paper's Figure 1)"))
    X0, XW, YB = 120, 420, y0 + 130
    lx = lambda k: X0 + k / 3 * XW                       # data 1×, 2×, 4×, 8×: equal steps of doubling
    b.append(ln(X0, YB, X0 + XW, YB, "axis"))
    for k, lab in enumerate(["1×", "2×", "4×", "8×"]):
        b.append(ln(lx(k), YB, lx(k), YB + 5, "tick"))
        b.append(txt(lx(k), YB + 19, lab, "sub2", "middle"))
    flat = [(lx(k), YB - 52 - 6 * (1 - 0.5 ** k)) for k in range(4)]
    rise = [(lx(k), YB - 62 - 18 * k) for k in range(4)]
    b.append('<polyline class="pl-h" points="' + " ".join(f"{x:.1f},{y:.1f}" for x, y in flat) + '"/>')
    b.append('<polyline class="pl-m" points="' + " ".join(f"{x:.1f},{y:.1f}" for x, y in rise) + '"/>')
    b.append(txt(lx(3) + 8, flat[3][1] + 4, "EAGLE-2", "sub2"))
    b.append(txt(lx(3) + 8, rise[3][1] + 4, "EAGLE-3", "sub2"))
    b.append(txt(X0 + XW, YB + 40, "training text, relative to the original set", "sub2", "end"))
    body, yb = prose(YB + 84, [
        "EAGLE-3 reverses the original idea: it goes back to predicting tokens directly, but feeds the "
        "drafter a mixture of the target's hidden states from a low, a middle and a high layer, joined "
        "into one vector three times as long and squeezed back to the usual width by one small layer.",
        "Dropping the requirement to predict the next hidden state exactly removed a ceiling. With "
        "the vector-predicting drafter of EAGLE and EAGLE-2, more training text gave little; "
        "EAGLE-3's kept improving, up to eight times the original training set, the most the paper "
        "tried.",
    ])
    emit("a30", at("Eagle 3 reverses the original idea"),
         "EAGLE-3 reads three depths of the target and drafts tokens again", yb + 30, b + [body],
         "Two changes with one motive: a drafter no longer forced to reproduce one layer's vector can "
         "use more of what the target computed, and keeps getting better with more data.")


# ---- o013: the closer ---------------------------------------------------------------------------------------
SWEEP = [(1, 373.25 / 158.34), (2, 1.81), (4, 1.82), (8, 1.62), (16, 1.48), (24, 1.39), (32, 1.32),
         (48, 1.38), (56, 1.34), (64, 1.38)]      # EAGLE-3 paper, Tables 3 and 4 (SGLang, 8B, H100, MT-Bench)


def o013():
    assert round(SWEEP[0][1], 2) == 2.36
    b = [hd(40, 46, "The two headline numbers, to scale")]
    X0, S = 200, 66
    rows = [("one request", 6.47, "m", "up to 6.5×", "Vicuna 13B, coding"),
            ("batch of 64", 1.38, "h", "1.38×", "8B Llama, SGLang")]
    for k, (lab, v, c, val, setup) in enumerate(rows):
        y = 66 + k * 44
        b.append(txt(40, y + 19, lab, "cap"))
        b.append(cell(X0, y, v * S, 28, c, label=f"{val}: {setup}" if k == 0 else None))
        if k:
            b.append(txt(X0 + v * S + 10, y + 19, f"{val}, {setup}", "sub2"))
    assert 6.47 * S + X0 < 640
    y0 = 196
    b.append(hd(40, y0, "One setup held fixed: speed-up against batch size"))
    BW_, PITCH, YB = 36, 50, y0 + 150
    for k, (B, v) in enumerate(SWEEP):
        x = 90 + k * PITCH
        h = v * 50
        b.append(cell(x, YB - h, BW_, h, "m" if k == 0 else ("h" if B == 64 else "u"), rx=2))
        b.append(txt(x + BW_ / 2, YB - h - 6, f"{v:.2f}", "sub2", "middle"))
        b.append(txt(x + BW_ / 2, YB + 18, f"{B}", "sub2", "middle"))
    b.append(ln(84, YB, 90 + len(SWEEP) * PITCH - 8, YB, "axis"))
    b.append(txt(90, YB + 40, "requests in the batch; 8B Llama in SGLang on one H100, chat prompts", "sub2"))
    body, yb = prose(YB + 86, [
        "Those two numbers both describe EAGLE-3. The 6.5 is one request on an idle machine; the 1.38 "
        "is a machine with 64 requests already competing for its compute.",
        "They also come from different setups: the 6.5 is the paper's best case, Vicuna 13B writing "
        "code, and the 1.38 was measured by the team behind SGLang, an open-source serving system, "
        "running an 8-billion-parameter Llama on MT-Bench's chat prompts ({{fig:v08-a34}}). It "
        "counts throughput, tokens a second across the whole batch ({{fig:v01-o142}}). Holding that "
        "setup fixed, the gain falls from 2.36× at one request to 1.38× at 64: the ceiling of "
        "{{fig:v08-o009}}, measured.",
        "Medusa's authors simulated the same effect for their method: past a batch of about 32 the "
        "speed-up shrinks, and can become a slowdown, as the layers stop being bound by memory.",
    ])
    emit("o013", at("The paper reports up to 6"),
         "EAGLE-3: up to 6.5× alone, 1.38× at a batch of 64", yb + 30, b + [body],
         "Same method, very different numbers, and the headline is a best case on an idle machine. "
         "Ask which batch size any speed-up was measured at.")


if __name__ == "__main__":
    for fn in (a26, a27, a28, a29, a30, o013):
        fn()
