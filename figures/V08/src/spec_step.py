"""V8 Parts 1–2: the idle arithmetic, and one speculative step drawn (review §4 A1, B1–B3; §5 P21).

  python3 figures/V08/src/spec_step.py     writes items a01–a04 and o004

a01  A1  At batch one, the arithmetic units are 99.7% idle
a02  B1  Five cheap passes, then one expensive one
a03  B2  One pass returns a next-token distribution at every position
a04  B3  Everything after the first disagreement was built on a wrong token
o004     redrawn: six positions of arithmetic against the weight read, to scale
"""
import math
from spec_common import (cell, ghost, txt, hd, ln, arr, prose, emit, at, bar, f, fc,
                         PARAMS, BYTES, PEAK, BW, OPS_TOKEN, T_READ, T_POS, RIDGE, DRAFT_BYTES)

GAMMA = 5                                    # guesses per pass
POSITIONS = GAMMA + 1                        # the last real token comes along
busy = T_POS / T_READ                        # share of the read the arithmetic needs
assert round(busy * 100, 2) == 0.34 and round((1 - busy) * 100, 2) == 99.66
assert round(RIDGE, 1) == 295.2 and abs(T_READ / T_POS - RIDGE) < 1e-9   # the time ratio is the ridge
assert round(BYTES / BW * 1e3, 2) == 41.79 and round(1 / T_READ, 1) == 23.9


# ---- a01 · A1: the idle arithmetic ---------------------------------------------------------------
def a01():
    b = [hd(40, 46, "One token at batch one, timed two ways, on a log axis")]
    X0, DEC = 150, 120                        # 0.01 ms at x=150, 120 px a decade
    lx = lambda ms: X0 + DEC * math.log10(ms / 0.01)
    rows = [("arithmetic", T_POS * 1e3, "m", "0.142 ms"), ("weight read", T_READ * 1e3, "h", "41.8 ms")]
    for k, (lab, ms, c, val) in enumerate(rows):
        y = 70 + k * 44
        b.append(txt(40, y + 19, lab, "cap"))
        b.append(bar(X0, y, lx(ms) - X0, 28, c))
        b.append(txt(lx(ms) + 8, y + 19, val, "sub2"))
    ya = 70 + 2 * 44 + 4
    b.append(ln(X0, ya, X0 + 4 * DEC, ya, "axis"))
    for k, lab in enumerate(["0.01 ms", "0.1", "1", "10", "100 ms"]):
        x = X0 + k * DEC
        b.append(ln(x, ya, x, ya + 5, "tick"))
        b.append(txt(x, ya + 20, lab, "sub2", "middle"))
    assert f"{T_POS * 1e3:.3f}" == "0.142" and f"{T_READ * 1e3:.1f}" == "41.8"
    y2 = ya + 70
    b.append(hd(40, y2, "The same two times as shares of the read, on an ordinary axis"))
    W = 480
    b.append(txt(40, y2 + 37, "busy or idle", "cap"))
    b.append(bar(X0, y2 + 18, busy * W, 28, "m"))
    b.append(cell(X0 + busy * W, y2 + 18, (1 - busy) * W, 28, "u", label=f"idle {f((1 - busy) * 100)}%"))
    b.append(txt(X0, y2 + 66, f"busy {f(busy * 100)}%: the sliver at the left edge", "sub2"))
    body, yb = prose(y2 + 112, [
        "One token needs a multiply and an add for each of the 70 billion weights: 140 billion "
        "operations, which an H100 GPU's 989 trillion a second get through in 0.142 ms. Reading the 140 GB "
        "of weights at 3.35 TB/s takes 41.8 ms ({{fig:v01-o126}} has both specifications).",
        f"So the arithmetic units work for 0.142 ms of every 41.8: {f(busy * 100)}% of the time, idle "
        f"the other {f((1 - busy) * 100)}%. The ratio of the two times, {RIDGE:.0f}, is the chip's ridge: "
        "the operations it can do for each byte it reads, against the one operation per byte that "
        "decode asks of it ({{fig:v01-o116}}).",
        "That idle 99.7% is the room every technique in the next four parts spends.",
    ])
    emit("a01", at("the arithmetic units sit nearly idle"),
         "At batch one, the arithmetic units are 99.7% idle", yb + 30, b + [body],
         "Log axis for the two times, because on an ordinary one the arithmetic bar would be under "
         "two pixels long. Batching filled this idle time with other people's tokens; speculative "
         "decoding fills it with guesses for the same person.")


# ---- a02 · B1: five drafter passes, one target pass ----------------------------------------------
PROMPT = ["the", "cat", "sat"]
DRAFTS = ["on", "the", "mat", "and", "then"]
TARGET_PICKS = ["on", "the", "mat", ".", "then"]     # the target's top choice at each guess's slot


def a02():
    b = [hd(40, 46, "The drafter writes one guess per pass, feeding each back in")]
    CW, G, X0 = 40, 4, 104
    for k in range(GAMMA):
        y = 66 + k * 36
        b.append(txt(40, y + 18, f"pass {k + 1}", "cap"))
        words = PROMPT + DRAFTS[:k]
        for j, w in enumerate(words):
            b.append(cell(X0 + j * (CW + G), y, CW, 26, "u" if j < 3 else "m", label=w))
        xe = X0 + len(words) * (CW + G)
        b.append(arr(xe + 2, y + 13, xe + 30, y + 13))
        b.append(cell(xe + 34, y, CW, 26, "m", label=DRAFTS[k]))
        if k == 0:
            b.append(txt(xe + 34 + CW + 12, y + 17, "a new guess", "sub2"))
    y = 66 + GAMMA * 36 + 8
    b.append(txt(40, y + 18, "checking", "cap"))
    span = 6 * (CW + G) - G
    xs = X0 + 2 * (CW + G)
    b.append(cell(xs, y, span, 26, "h", label="the target: one pass, six positions"))
    # bytes, to scale
    yb0 = y + 76
    b.append(hd(40, yb0, "Bytes moved, to scale"))
    SC, XB = 450 / BYTES, 190
    d_total = GAMMA * DRAFT_BYTES
    b.append(txt(40, yb0 + 37, "five drafter passes", "cap"))
    for k in range(GAMMA):
        b.append(bar(XB + k * DRAFT_BYTES * SC, yb0 + 18, DRAFT_BYTES * SC, 28, "s", rx=0.5))
    b.append(txt(XB + d_total * SC + 10, yb0 + 37, f"{d_total / 1e9:.0f} GB, 1.4 GB each", "sub2"))
    b.append(txt(40, yb0 + 81, "one target pass", "cap"))
    b.append(cell(XB, yb0 + 62, BYTES * SC, 28, "h", label="140 GB"))
    assert d_total / 1e9 == 7 and DRAFT_BYTES / 1e9 == 1.4
    body, yb = prose(yb0 + 134, [
        "The drafter writes the normal way: each guess goes back in as input for the next, so five "
        "guesses take five passes of the small model, one after another. The 2022 speculative decoding "
        "paper found that a drafter about 100 times smaller than the target usually works best.",
        "At that size a pass moves 1.4 GB, so the five move 7 GB in all, against 140 GB for the "
        "target's single pass over the text with all five guesses attached.",
    ])
    emit("a02", at("The small model writes its guesses the normal way"),
         "Five cheap passes, then one expensive one", yb + 30, b + [body],
         "Bars by bytes moved. In time the drafter costs relatively more, because a small model rarely "
         "runs the chip at full bandwidth: the 2022 paper measured its drafters at under 5% of a target "
         "pass, against the 1% their bytes suggest.")


# ---- a03 · B2: an output at every position -------------------------------------------------------
OUTS = [("on", 0.6), ("the", 0.7), ("mat", 0.5), (".", 0.5), ("then", 0.4), ("the", 0.5)]   # illustrative


def a03():
    b = [hd(40, 46, "Six positions go in; at each, out comes a distribution over the next token")]
    CW, G, X0 = 70, 8, 168
    xs = [X0 + j * (CW + G) for j in range(6)]
    b.append(txt(40, 92, "into the pass", "cap"))
    inp = ["sat"] + DRAFTS
    for j, w in enumerate(inp):
        b.append(cell(xs[j], 74, CW, 28, "u" if j == 0 else "m", label=w))
    b.append(txt(40, 192, "out of the pass", "cap"))
    for j, (w, p) in enumerate(OUTS):
        b.append(cell(xs[j], 174, CW, 28, "u", label=f"{w} {p:.1f}"))
    for j in range(5):                          # each output is the opinion of the next slot
        b.append(arr(xs[j] + CW - 6, 170, xs[j + 1] + 10, 106))
    for j in range(6):
        lab = f"judges {inp[j + 1]}" if j < 5 else "a free sixth"
        b.append(txt(xs[j] + CW / 2, 222, lab, "sub2", "middle"))
    b.append(txt(xs[0], 252, "top choice and its probability shown; each is a full distribution", "sub2"))
    body, yb = prose(296, [
        "At every position the target produces what it always produces: a score for each of its "
        "128,000 tokens, turned into probabilities by softmax ({{fig:v01-o009}}). That distribution "
        "is its prediction for the next slot, so the output at ‘mat’ is its opinion of whatever "
        "follows ‘mat’, and that is what the guess ‘and’ must answer to.",
        "Five guesses means six positions. The last real token, ‘sat’, comes along, because its output "
        "is the one that judges the first guess. The output at the last guess judges nothing: it is a "
        "whole distribution over a sixth token, already paid for.",
        "‘The cat’ needs no recomputing. Its keys and values are already stored in the cache "
        "({{fig:v01-o136}}), so only these six positions go through the pass.",
    ])
    emit("a03", at("at every position it produces its own distribution"),
         "One pass returns a next-token distribution at every position", yb + 30, b + [body],
         "Each guess is judged by the output one place to its left. That shift by one is what lets a "
         "single pass check all five guesses; the probabilities shown are illustrative.")


# ---- a04 · B3: keep up to the first disagreement -------------------------------------------------
def a04():
    b = [hd(40, 46, "Greedy checking: keep a guess when it is the target's top choice")]
    CW, G, X0 = 96, 6, 160
    xs = [X0 + j * (CW + G) for j in range(5)]
    first_bad = next(j for j in range(5) if DRAFTS[j] != TARGET_PICKS[j])
    assert first_bad == 3 and DRAFTS[4] == TARGET_PICKS[4]      # the fifth agrees and still goes
    for j in range(5):
        b.append(txt(xs[j] + CW / 2, 74, f"guess {j + 1}", "sub2", "middle"))
    b.append(txt(40, 103, "drafter wrote", "cap"))
    b.append(txt(40, 147, "target's choice", "cap"))
    b.append(txt(40, 191, "verdict", "cap"))
    for j in range(5):
        b.append(cell(xs[j], 84, CW, 28, "m", label=DRAFTS[j]))
        b.append(cell(xs[j], 128, CW, 28, "u", label=TARGET_PICKS[j]))
        if j < first_bad:
            b.append(cell(xs[j], 172, CW, 28, "m", label="kept"))
        elif j == first_bad:
            b.append(cell(xs[j], 172, CW, 28, "h", label="replaced by ."))
        else:
            b.append(ghost(xs[j], 172, CW, 28, label="discarded"))
    b.append(txt(xs[4] + CW, 222, "agrees, but both assumed ‘and’", "sub2", "end"))
    out = DRAFTS[:first_bad] + [TARGET_PICKS[first_bad]]
    yr = 260
    b.append(txt(40, yr + 19, "this pass yields", "cap"))
    for j, w in enumerate(out):
        b.append(cell(xs[j], yr, CW, 28, "m" if j < first_bad else "u", label=w))
    b.append(txt(xs[len(out)] + 4, yr + 19, f"{len(out)} tokens", "sub2"))
    assert len(out) == 4
    body, yb = prose(yr + 76, [
        "The simplest check keeps a guess when it is the target's top choice; Part 3 gives the rule "
        "that also works when the text is sampled. ‘on’, ‘the’ and ‘mat’ match and are kept. At the "
        "fourth slot the target wanted a full stop, so ‘and’ is rejected and the full stop takes its place: the "
        "target's own choice, already computed, so the replacement costs nothing extra.",
        "The fifth slot agrees, ‘then’ and ‘then’, and is thrown away anyway. The drafter wrote ‘then’ "
        "after ‘and’, and the target's choice there was computed with ‘and’ in its input. Once ‘and’ is gone, both "
        "answer a question nobody is asking.",
        "One pass, four tokens: three kept and the replacement. Even a pass that rejects its first "
        "guess still yields one token, the replacement, so a pass never yields fewer than ordinary "
        "decode does.",
    ])
    emit("a04", at("throws away everything from the first disagreement"),
         "Everything after the first disagreement was built on a wrong token", yb + 30, b + [body],
         "The first disagreement ends the pass, however many guesses after it happen to agree. That is "
         "why guesses are checked in order, and why Part 4 multiplies their chances of surviving.")


# ---- o004: the extra arithmetic, to scale --------------------------------------------------------
def o004():
    b = [hd(40, 46, "Busy time at full speed, drawn to scale against the weight read")]
    X0, W = 210, 400
    SC = W / (T_READ * 1e3)
    t6 = POSITIONS * T_POS * 1e3
    rows = [("reading the weights", T_READ * 1e3, "h", None),
            ("arithmetic, one position", T_POS * 1e3, "m", f"{T_POS * 1e3:.3f} ms"),
            ("arithmetic, six positions", t6, "m", f"{t6:.2f} ms, {t6 / (T_READ * 1e3) * 100:.0f}% of the read")]
    for k, (lab, ms, c, val) in enumerate(rows):
        y = 68 + k * 44
        b.append(txt(40, y + 19, lab, "cap"))
        if val is None:
            b.append(cell(X0, y, ms * SC, 28, c, label=f"{ms:.1f} ms"))
        else:
            b.append(bar(X0, y, ms * SC, 28, c, rx=0.5))
            b.append(txt(X0 + ms * SC + 10, y + 19, val, "sub2"))
    assert f"{t6:.2f}" == "0.85" and round(t6 / (T_READ * 1e3) * 100) == 2
    body, yb = prose(240, [
        "Checking five guesses puts six positions through the pass, so six times the arithmetic of a "
        "single token: 6 × 140 billion operations, 0.85 ms at full speed. The weight read still takes "
        "41.8 ms.",
        "The 2022 paper assumes the extra positions run in parallel on compute that was idle anyway, "
        "and add no wall-clock time. At batch one that is safe: six positions need 2% of the time the "
        "read takes. It is an assumption all the same, and {{fig:v08-o009}} finds the batch size at "
        "which it fails.",
    ])
    emit("o004", at("five times the arithmetic"), "The arithmetic is free, by assumption", yb + 30,
         b + [body],
         "Six times the arithmetic and still a sliver of the read. Arithmetic was never what decode "
         "waited on, which is the only reason checking guesses can be free.")


if __name__ == "__main__":
    for fn in (a01, a02, a03, a04, o004):
        fn()
