"""V01 Parts 12 to 14: why a key depends on its context, the prefix rule, and one conversation warm and
cold. This material moved here from the front of the atlas (BUILD, V1 item 1). The script redraws the
figures whose numbers or drawings changed:

  o040  redrawn. Each layer has its own W_K (o098), so the comparison is now two sentences at one
        layer. The old drawing compared layer 1 with layer 2 and called their W_K the same matrix.
  o041  re-measured on a small transformer built below (review section 5.1, #21)
  o043  with the saving computed
  o044, o046 to o053, o056  one conversation throughout (review section 5.1, #18)

  python3 figures/V01/src/prefix.py
"""
import numpy as np

from common import (cell, ghost, arr, ln, txt, hd, prose, emit, st, f, g, D, KVW, LAYER, N_EXACT, L, OUT)

TS = st("share the cache across requests")
assert TS == "25:43"

# ---- one conversation, followed through Parts 13 and 14 ----------------------------------------
# Token counts of the preamble are illustrative; one word or mark is one token, for drawing.
SYSTEM, TOOLS = 320, 450
PRE = [f"s{i}" for i in range(SYSTEM)] + [f"t{i}" for i in range(TOOLS)]
Q1 = "What is the capital of France ?".split()
A1 = "The capital of France is Paris .".split()
FOLLOW = "And of Japan ?".split()
QB = "What is the capital of Japan ?".split()      # case B: one word changed
QC = "The capital of France is what ?".split()     # case C: the same words, reordered


def hit(held, arriving):
    """How many tokens from the front match: the ones whose keys and values can be reused."""
    n = 0
    for a, b in zip(held, arriving):
        if a != b:
            break
        n += 1
    return n


TURN1 = PRE + Q1                                   # the first question
HELD = TURN1 + A1                                  # what the machine holds a minute later
CASE_A = HELD + FOLLOW                             # the follow-up
CASE_B = PRE + QB
CASE_C = PRE + QC
assert (len(PRE), len(TURN1), len(HELD), len(CASE_A)) == (770, 777, 784, 788)
HIT0 = hit([], TURN1)
HIT_A, HIT_B, HIT_C = hit(HELD, CASE_A), hit(HELD, CASE_B), hit(HELD, CASE_C)
HIT_DAY = hit(PRE, CASE_A)                         # a day later only the shared preamble is left
assert (HIT0, HIT_A, HIT_B, HIT_C, HIT_DAY) == (0, 784, 775, 770, 770)
PF_A, PF_B, PF_C, PF_DAY = (len(CASE_A) - HIT_A, len(CASE_B) - HIT_B, len(CASE_C) - HIT_C,
                            len(CASE_A) - HIT_DAY)
assert (PF_A, PF_B, PF_C, PF_DAY) == (4, 2, 7, 18)
COLD = len(CASE_A) / PF_A                          # nothing held against the warm follow-up
assert COLD == 197
# words in common with the first question, ignoring capitals
assert len(set(w.lower() for w in QB) & set(w.lower() for w in Q1)) == 6
assert sorted(w.lower() for w in QC) == sorted(w.lower() for w in Q1)
# the user's own seven tokens, with the preamble set aside
OWN = [hit(Q1, Q1), hit(Q1, QB), hit(Q1, QC)]
assert OWN == [7, 5, 0]
RATES = [100 * HIT_A / len(CASE_A), 100 * HIT_B / len(CASE_B), 100 * HIT_C / len(CASE_C)]
assert [f(r, 1) for r in RATES] == ["99.5", "99.7", "99.1"]
# an edit at the fifth token of the system prompt
EDITED = PRE[:4] + ["changed"] + PRE[5:] + Q1 + A1 + FOLLOW
HIT_E = hit(HELD, EDITED)
assert (HIT_E, len(EDITED) - HIT_E, (len(EDITED) - HIT_E) / PF_A) == (4, 784, 196)
# two prompts that differ in one token: the last, or the first
LAST = CASE_A[:-1] + ["other"]
FIRST = ["other"] + CASE_A[1:]
assert hit(CASE_A, LAST) == 787 and hit(CASE_A, FIRST) == 0
assert sum(a == b for a, b in zip(CASE_A, FIRST)) == 787

# ---- the small transformer for o041 ------------------------------------------------------------
# Random, untrained weights. Positions are added at the start, as o038 draws it; then each layer is
# normalise, causal attention, add; normalise, gated feed-forward with SiLU (as o102 and p18), add.


def toy(seed, vocab=50, width=32, layers=4, n=5):
    rng = np.random.default_rng(seed)
    w = lambda a, b: rng.normal(0, a ** -0.5, (a, b))
    emb, pos = rng.normal(0, 1, (vocab, width)), rng.normal(0, 1, (n, width))
    ps = [dict(q=w(width, width), k=w(width, width), v=w(width, width), o=w(width, width),
               gate=w(width, 3 * width), up=w(width, 3 * width), down=w(3 * width, width))
          for _ in range(layers)]
    return emb, pos, ps


def keys_of_token5(model, tokens):
    emb, pos, ps = model
    n, width = len(tokens), emb.shape[1]
    rms = lambda x: x / np.sqrt((x * x).mean(-1, keepdims=True) + 1e-6)
    silu = lambda z: z / (1 + np.exp(-z))
    mask = np.triu(np.full((n, n), -np.inf), 1)    # a token sees itself and the ones before it
    x, out = emb[tokens] + pos[:n], []
    for p in ps:
        h = rms(x)
        out.append(h[4] @ p["k"])                  # token 5's key at this layer
        s = (h @ p["q"]) @ (h @ p["k"]).T / np.sqrt(width) + mask
        a = np.exp(s - s.max(-1, keepdims=True))
        x = x + (a / a.sum(-1, keepdims=True)) @ (h @ p["v"]) @ p["o"]
        h = rms(x)
        x = x + (silu(h @ p["gate"]) * (h @ p["up"])) @ p["down"]
    return out


SENT_A, SENT_B = [3, 17, 8, 21, 40], [3, 29, 8, 21, 40]   # only token 2 differs


def measure(seed):
    m = toy(seed)
    ka, kb = keys_of_token5(m, SENT_A), keys_of_token5(m, SENT_B)
    assert np.array_equal(ka[0], kb[0])            # layer 1: identical to the last bit
    return [100 * float(np.linalg.norm(a - b) / np.linalg.norm(a)) for a, b in zip(ka, kb)]


RUNS = [measure(s) for s in range(6)]
assert all(r[0] == 0 and min(r[1:]) > 0 for r in RUNS)
DIFF = RUNS[0]                                     # the model drawn: the first seed
assert [f(v, 1) for v in DIFF] == ["0.0", "20.5", "26.5", "29.5"]
ABOVE = [v for r in RUNS for v in r[1:]]
RISING = sum(r[1] < r[2] < r[3] for r in RUNS)
assert (round(min(ABOVE)), round(max(ABOVE)), RISING) == (13, 67, 5)   # five of six rise

# ---- what layer 1's surviving keys and values would save (o043) --------------------------------
KV_PROJ = 2 * D * KVW                              # layer 1's W_K and W_V
assert KV_PROJ == 16_777_216
assert round(100 / L, 2) == 1.25 and round(100 * KV_PROJ / LAYER) == 2
assert round(100 * KV_PROJ / N_EXACT, 2) == 0.02


def o040():
    b = [hd(40, 46, "Token 5's key at one layer, in two sentences that differ at token 2")]
    rows = [("layer 1, sentence A", "token 5 + position 5", "layer 1's W_K", "key", "s"),
            ("layer 1, sentence B", "token 5 + position 5", "layer 1's W_K", "identical", "s"),
            ("layer 2, sentence A", "stream at position 5", "layer 2's W_K", "key", "h"),
            ("layer 2, sentence B", "stream at position 5", "layer 2's W_K", "different", "h")]
    y = 70
    for k, (lab, inp, mat, key, c) in enumerate(rows):
        if k == 2:
            y += 22
        b.append(txt(40, y + 20, lab, "cap"))
        b.append(cell(196, y, 170, 30, c, label=inp))
        b.append(arr(370, y + 15, 390, y + 15))
        b.append(cell(396, y, 112, 30, "m", label=mat))
        b.append(arr(512, y + 15, 532, y + 15))
        b.append(cell(538, y, 102, 30, c, label=key))
        y += 38
    body, yb = prose(y + 34, [
        "Within one layer, W_K is the same matrix for both sentences. At layer 1 the vector it multiplies "
        "is the same too, so the two keys are identical. At layer 2 that vector has been through layer 1, "
        "whose attention blended token 2 into position 5 ({{fig:v01-o039}}), so the keys differ.",
        "Layer 3's input carries layer 2's mixing, and so on up: across 80 layers, position 5's vector is "
        "blended with the earlier positions 80 times over.",
        "It is the fact that put the factor of 80 into the cache's size ({{fig:v01-o138}}), seen across "
        "sentences instead of across layers. The dependence enters through the residual stream "
        "({{fig:v01-p19}}), never through the weights.",
    ])
    emit("o040", TS, "Where the dependence actually enters", yb + 22, b + [body],
         "Fixed function, changing input. The weights never learn anything about the sentence; the vector "
         "arriving at them already carries it.")


def o041():
    b = [hd(40, 46, "Change token 2, then compare token 5's key at each layer")]
    px = 8                                          # pixels per percentage point
    for k, v in enumerate(DIFF):
        y = 70 + k * 44
        b.append(txt(40, y + 20, f"layer {k + 1}", "cap"))
        if v == 0:
            b.append(txt(130, y + 20, "0: identical, to the last bit", "sub2"))
        else:
            w = round(v * px, 1)
            b.append(cell(130, y, w, 30, "h"))
            b.append(txt(130 + w + 10, y + 20, f"{f(v, 1)}% of the key's length", "sub2"))
    y = 70 + 4 * 44 + 10
    body, yb = prose(y + 24, [
        "A four-layer transformer with random, untrained weights: positions added at the start, causal "
        "attention, a gated feed-forward block like Llama's ({{fig:v01-p18}}) and residual connections. It "
        "was run on five tokens, then again with only token 2 replaced, and token 5's keys compared: each "
        "bar is the length of the difference between the two keys, as a share of the key's own length.",
        "Layer 1's key does not move at all, to the last bit: its input is token 5 and its position, and "
        "neither changed. Every layer above it differs, because its input already carries token 2.",
        f"The sizes depend on the random weights. In six random models the differences above layer 1 ran "
        f"from {round(min(ABOVE))}% to {round(max(ABOVE))}%, rising with depth in five and not in the "
        "sixth. Layer 1 was exactly zero in all six.",
    ])
    emit("o041", TS, "Measured on a small transformer", yb + 22, b + [body],
         "Not an argument from authority: run a small model twice with one token changed, and layer 1's key "
         "comes out identical to the last bit while every layer above it moves. Bars to scale.")


def o043():
    b = [hd(40, 46, "So could the cache keep layer 1's keys and values and redo the rest?")]
    w1 = round(320 / (L - 1), 1)
    b.append(txt(40, 96, "layer 1, still valid", "cap"))
    b.append(cell(300, 76, w1, 30, "s", rx=1))
    b.append(txt(300 + w1 + 12, 96, f"1 of 80 layers: {f(100 / L, 2)}% of the work", "sub2"))
    b.append(txt(40, 156, "layers 2 to 80, invalid", "cap"))
    b.append(cell(300, 136, 320, 30, "h", label=f"79 of 80: {f(100 * (L - 1) / L, 2)}%, redone"))
    body, yb = prose(226, [
        "In principle yes, for the positions whose token and position did not change. In practice it "
        "buys almost nothing, because one layer out of eighty is a small share to begin with.",
        "And the share actually saved is smaller still. Layer 2 needs layer 1's output, so layer 1 has to "
        "run anyway, and all that would be skipped is its key and value projections. Those use "
        f"2 × 8,192 × 1,024 = {f(KV_PROJ / 1e6, 1)} million of the model's 70.55 billion weights: about "
        f"{f(100 * KV_PROJ / N_EXACT, 2)}% of the work.",
        "So serving systems treat a changed token as invalidating everything after it, which is correct "
        "for layers 2 upward and not worth an exception for layer 1. The next part turns that into the "
        "rule they use.",
    ])
    emit("o043", TS, "Why layer 1 surviving does not rescue the cache", yb + 22, b + [body],
         "Layer 1's keys really do survive, and the engineering conclusion is unchanged: one layer in "
         "eighty, and in practice a fiftieth of that layer, is not worth the bookkeeping. Bars to scale.")


def o044():
    b = [hd(40, 46, "The prompt that arrives, and what the server already holds")]
    segs = [(120, 140, "system"), (262, 196, "tools"), (460, 120, "history")]
    b.append(txt(40, 92, "arriving", "sub2"))
    for x, w, lab in segs:
        b.append(cell(x, 74, w, 28, "s", label=lab))
    b.append(cell(582, 74, 58, 28, "h", label="new"))
    b.append(txt(40, 152, "cached", "sub2"))
    for x, w, _ in segs:
        b.append(cell(x, 134, w, 28, "s"))
    b.append(ghost(582, 134, 58, 28))
    b.append(ln(581, 66, 581, 172, "mark xok"))
    b.append(txt(581, 192, "the first difference", "sub2", "middle"))
    body, yb = prose(242, [
        "A prefix is the opening stretch of a sequence: its first token, its first two, its first hundred. "
        "A cache hit is the longest prefix of the arriving prompt whose keys and values the server already "
        "holds.",
        "The match runs from the front and stops at the first token that differs. Everything before it is "
        "a hit; everything from there on has to be prefilled, however much of it is identical "
        "({{fig:v01-o036}}).",
        f"For the follow-up question of {{{{fig:v01-o049}}}}, {g(HIT_A)} of {g(len(CASE_A))} tokens match and "
        f"only the {PF_A} new ones are prefilled: a hit rate of {f(RATES[0], 1)}%, almost all of it text the "
        "user never wrote.",
    ])
    emit("o044", TS, "A cache hit is a prefix match", yb + 22, b + [body],
         "Front to back, stopping at the first difference. That one rule explains every warm and cold case "
         "in the next part. Widths schematic.")


def o046():
    b = [cell(90, 46, 500, 42, "m", rx=6, label="compare from token 1, stop at the first difference")]
    body1, y1 = prose(118, ["Everything before that point is a hit and is reused. Everything from that point "
                            "onward is a miss and must be prefilled."])
    b.append(body1)
    b.append(hd(40, y1 + 50, "So the question is never how similar two prompts are, but how far they are identical"))
    body, yb = prose(y1 + 98, [
        f"Two {g(len(CASE_A))}-token prompts that differ only in their last token: "
        f"{g(hit(CASE_A, LAST))} tokens hit.",
        f"Two that differ only in their first token: none hit, though {g(len(CASE_A) - 1)} of their "
        f"{g(len(CASE_A))} tokens are identical.",
        "This is why the order of a prompt matters as much as its contents, and why the stable parts "
        "belong at the front.",
    ])
    emit("o046", TS, "The whole rule, in one line", yb + 22, b + [body],
         "Everything in the next part is this sentence applied to one conversation.")


def o047():
    b = [hd(40, 46, "The same follow-up question, two states of the cache")]
    w = round(320 * PF_A / len(CASE_A), 2)
    assert w == 1.62
    b.append(txt(40, 92, "Warm, a minute later", "cap"))
    b.append(txt(40, 112, f"{g(HIT_A)} of {g(len(CASE_A))} already held", "sub2"))
    b.append(cell(300, 76, w, 30, "s", rx=0.5))
    b.append(txt(312, 96, f"prefill {PF_A} tokens", "sub2"))
    b.append(txt(40, 172, "Cold: none of it held", "cap"))
    b.append(txt(40, 192, f"0 of {g(len(CASE_A))} on this machine", "sub2"))
    b.append(cell(300, 156, 320, 30, "h", label=f"prefill {g(len(CASE_A))} tokens"))
    b.append(cell(190, 214, 300, 42, "u", rx=6, label=f"{g(COLD)} times the work"))
    body, yb = prose(298, [
        f"The conversation this part follows: a {g(len(PRE))}-token preamble of system prompt and tool "
        f"descriptions, a {len(Q1)}-token question and its {len(A1)}-token answer, then a {len(FOLLOW)}-token "
        f"follow-up, {g(len(CASE_A))} tokens in all.",
        "Identical question, identical model, identical hardware. The only difference is whether the keys "
        "and values from last time are still held on this machine.",
        "Warm means they are. Cold means they were evicted to make room for somebody else's, or the request "
        "landed on a machine that never had them. The text survives either way; the keys and values are "
        "the model's processed form of it ({{fig:v01-o034}}), and rebuilding them is exactly what prefill "
        "does.",
    ])
    emit("o047", TS, "What warm and cold actually mean", yb + 22, b + [body], "CAPTION")
    p = OUT / "o047.html"
    p.write_text(p.read_text(encoding="utf-8").replace(
        "<figcaption>CAPTION</figcaption>",
        "<figcaption>Not a vague sense of readiness but a count: how many of the arriving tokens already have "
        "keys and values on this machine. Bars to scale. The companion animation, <a class='xref' "
        "href='V01_The_Memory_Wall_animation.html'>One conversation, end to end</a>, plays a longer "
        "conversation through these states step by step.</figcaption>"), encoding="utf-8")


def prompt_rows(b, arriving, held, y0=76):
    """The five segments of the conversation, arriving above and held below, coloured by outcome."""
    segs = [(150, 90, "system"), (244, 110, "tools"), (358, 110, "question 1"), (472, 96, "answer 1"),
            (572, 68, "new")]
    b.append(txt(40, y0 + 16, "arriving", "sub2"))
    for (x, w, lab), c in zip(segs, arriving):
        b.append(cell(x, y0, w, 30, c, label=lab))
    b.append(txt(40, y0 + 76, "in the cache", "sub2"))
    for (x, w, _), c in zip(segs, held):
        if c:
            b.append(cell(x, y0 + 60, w, 30, c))
    return segs


def o048():
    b = [hd(40, 46, "Time t: the user asks the first question")]
    b.append(txt(40, 92, "arriving", "sub2"))
    for x, w, lab in [(150, 130, "system"), (284, 170, "tools"), (458, 130, "the question")]:
        b.append(cell(x, 76, w, 30, "h", label=lab))
    b.append(txt(40, 152, "in the cache", "sub2"))
    b.append(ghost(150, 136, 438, 30, label="nothing that matches this conversation"))
    b.append(cell(140, 190, 400, 42, "h", rx=6, label=f"hit {HIT0}   ·   prefill all {g(len(TURN1))} tokens"))
    body, yb = prose(274, [
        f"Nothing of this conversation has been seen before, so every token is processed from scratch: "
        f"{SYSTEM} of system prompt, {TOOLS} of tool descriptions ({{{{fig:v01-o020}}}}) and the {len(Q1)} of "
        "the question. This is the expensive case, and it is unavoidable the first time.",
        "One caveat: the system prompt and tools are identical for every user of this service, so on a busy "
        "machine they are very likely already cached from somebody else's request ({{fig:v01-o026}}).",
        f"Set those aside and the user's {len(Q1)} tokens are the only genuinely new work.",
    ])
    emit("o048", TS, "Time t, the first question", yb + 22, b + [body],
         "The cold case, and the only one where nothing at all can be reused. Even here the shared preamble "
         "is usually already warm. Widths schematic.")


def o049():
    b = [hd(40, 46, "One minute later, the same conversation continues")]
    segs = prompt_rows(b, ["s", "s", "s", "s", "h"], ["s", "s", "s", "s", None])
    b.append(ghost(572, 136, 68, 30))
    b.append(ln(570, 66, 570, 172, "mark xok"))
    b.append(cell(140, 196, 400, 42, "s", rx=6, label=f"hit {g(HIT_A)}   ·   prefill {PF_A} tokens"))
    body, yb = prose(280, [
        "The answer the model produced a minute ago had its keys and values kept as it was generated, so "
        f"the whole history matches and only the follow-up's {PF_A} tokens are new.",
        "This is the best case and the most common one. It is why a conversation stays quick for as long "
        "as the user keeps replying.",
    ])
    emit("o049", TS, "Case A: the chat continues", yb + 22, b + [body],
         "A perfect prefix. The model's own previous answer is part of the cached prefix, because its keys "
         "and values were kept as it was written. Widths schematic.")


def word_rows(b, top, bottom, top_cls, bottom_cls):
    b.append(txt(40, 92, "cached", "sub2"))
    for k, (wd, c) in enumerate(zip(top, top_cls)):
        b.append(cell(150 + 68 * k, 74, 62, 30, c, label=wd))
    b.append(txt(40, 166, "arriving", "sub2"))
    for k, (wd, c) in enumerate(zip(bottom, bottom_cls)):
        b.append(cell(150 + 68 * k, 148, 62, 30, c, label=wd))


def o050():
    b = [hd(40, 46, "One minute later, a new conversation and almost the same question")]
    word_rows(b, Q1, QB, ["s"] * 7, ["s"] * OWN[1] + ["h"] * (7 - OWN[1]))
    xd = 150 + 68 * OWN[1] - 3
    b.append(ln(xd, 64, xd, 190, "mark xok"))
    b.append(txt(xd, 212, "diverges here", "sub2", "middle"))
    b.append(cell(140, 244, 400, 42, "s", rx=6, label=f"hit {HIT_B}   ·   prefill {PF_B} tokens"))
    body, yb = prose(328, [
        "A new conversation, not a follow-up, and it still lands a hit: the preamble matches, and so do the "
        "first five tokens of the question, because they are identical and in the same places.",
        "Only Japan and the question mark are new.",
        "Nobody arranged this hit. Questions of the same shape often start the same way.",
    ])
    emit("o050", TS, "Case B: the same question, one word changed", yb + 22, b + [body],
         "A partial hit in the middle of the user's own sentence. The rule does not care that this is a "
         "different conversation, only that the tokens are identical from the front.")


def o051():
    b = [hd(40, 46, "One minute later, the same words rearranged")]
    word_rows(b, Q1, QC, ["s"] * 7, ["h"] * 7)
    b.append(ln(147, 64, 147, 190, "mark xok"))
    b.append(txt(190, 212, "diverges at the very first token", "sub2"))
    b.append(cell(140, 244, 400, 42, "h", rx=6, label=f"hit {HIT_C}   ·   prefill {PF_C} tokens"))
    body, yb = prose(328, [
        "Every word of the original is here, and so is the whole phrase capital of France. None of it "
        "counts, because the first token is different.",
        f"The {HIT_C} that did hit are the system prompt and tools, which are identical for everyone. The "
        "user's own words contributed nothing.",
        f"Compare case B: one word changed, and {OWN[1]} of the {len(Q1)} tokens still hit. Here no word "
        "changed, only the order, and none do.",
    ])
    emit("o051", TS, "Case C: the same words, in a different order", yb + 22, b + [body],
         "Case C shares more words with the original than case B does, every one of them, and gets nothing; "
         "case B changed a word and kept five of its seven tokens.")


def o052():
    b = [hd(40, 46, "The user's seven tokens only, with the shared preamble set aside")]
    rows = [("A: the chat continues", OWN[0], "all of it, plus the whole history"),
            ("B: France to Japan", OWN[1], None), ("C: the same words, reordered", OWN[2], None)]
    for k, (lab, n, note) in enumerate(rows):
        y = 78 + 54 * k
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(ghost(280, y, 280, 30))
        if n:
            b.append(cell(280, y, 280 * n // 7, 30, "s"))
        b.append(txt(572, y + 18, f"{n} / 7", "sub2"))
        if note:
            b.append(txt(280, y + 44, note, "sub2"))
    assert 280 * 5 // 7 == 200
    body, yb = prose(268, [
        f"Measured against the whole prompt all three look excellent, at {f(min(RATES), 1)}% or better, "
        f"because the {len(PRE)}-token preamble dominates and always matches.",
        "That number flatters everything and hides the part the user controls.",
        "Measured against the user's own words the three cases are completely different, and the "
        "difference is decided by where the first divergence falls.",
    ])
    emit("o052", TS, "The three cases, on the user's words alone", yb + 22, b + [body],
         "Two ways of quoting the same hit rate. The flattering one is the one usually reported, so it is "
         "worth knowing what it is hiding. Bars to scale.")


def o053():
    b = [hd(40, 46, "One day later, the same follow-up as case A")]
    prompt_rows(b, ["s", "s", "h", "h", "h"], ["s", "s", None, None, None])
    b.append(ghost(358, 136, 282, 30, label="evicted overnight"))
    b.append(cell(140, 196, 400, 42, "h", rx=6, label=f"hit {HIT_DAY}   ·   prefill {PF_DAY} tokens"))
    body, yb = prose(280, [
        "The user's conversation is gone, so its history has to be turned back into keys and values from "
        f"the text, which is what prefill is: {PF_DAY} tokens instead of {PF_A}.",
        f"The preamble is probably still there. Thousands of other conversations share those exact "
        f"{len(PRE)} tokens, so on a busy machine somebody has kept them warm.",
        "That only helps if the request lands on a machine that holds them, which is why serving systems "
        "try to route each request to a machine that already holds its prefix.",
    ])
    emit("o053", TS, "A day later: what survives and what does not", yb + 22, b + [body],
         "The shared preamble usually survives because it is shared. A single user's conversation does not, "
         "because nobody else was keeping it alive. Cache-aware routing is {{ref:v07-b45}}. Widths schematic.")


def o056():
    b = [hd(40, 46, "Change one token near the very front")]
    b.append(cell(40, 74, 70, 30, "s", label="first 4"))
    b.append(cell(114, 74, 50, 30, "m", label="edit"))
    b.append(cell(168, 74, 190, 30, "h", label="rest of system prompt"))
    b.append(cell(362, 74, 110, 30, "h", label="tools"))
    b.append(cell(476, 74, 164, 30, "h", label="everything after"))
    b.append(ln(112, 66, 112, 112, "mark xok"))
    b.append(txt(112, 132, "the match ends here", "sub2", "middle"))
    body, yb = prose(182, [
        "Because the match runs from the front, a difference at the fifth token ends it at the fifth "
        "token. Nothing after that point can be reused, however identical it is.",
        "So editing the system prompt does not cost a little. It invalidates every cached conversation on "
        "the machine at once, for every user, because they all share that prefix.",
        f"For the follow-up of {{{{fig:v01-o049}}}}: {g(len(EDITED) - HIT_E)} tokens to prefill instead of "
        f"{PF_A}, {g((len(EDITED) - HIT_E) / PF_A)} times the work, from a one-token change.",
        "Which is why prompts are built with the most stable text first and the most variable text last, "
        "and why operators are careful about editing a system prompt in production.",
    ])
    emit("o056", TS, "Why the front of the prompt is the expensive place to edit", yb + 22, b + [body],
         "A practical consequence that falls straight out of prefix matching. Order matters: stable text at "
         "the front, variable text at the back. Widths schematic.")


if __name__ == "__main__":
    for fn in (o040, o041, o043, o044, o046, o047, o048, o049, o050, o051, o052, o053, o056):
        fn()
