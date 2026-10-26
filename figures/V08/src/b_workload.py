"""V8 Part 11, the workload is changing: review §4 N1-N4; fixes P3 (Fig 31's caption), P8 (Fig 30's
"both pass 95%"), P22 (Fig 31 on a log axis), Fig 32's stamp (29:21), names restored.

Sources read: RhymeRL (arXiv 2508.18588, Fig. 2: 32B models, veRL and GRPO; rollout 91% / reward 2% /
train 7% for math, 84% / 7% / 9% for code at 16K; over 95% at 32K and longer). Stanford AI Index 2025:
GPT-3.5's 64.8 on MMLU cost $20.00 per million tokens in November 2022 and $0.07 in October 2024
(Gemini-1.5-Flash-8B), prices a 3:1 blend of input and output; MMLU spans 57 subjects. Bandwidth and
compute per chip are V02 Fig 69's (A100 2.0 TB/s and 312 TFLOPS; B200 8.0 TB/s and 2,250 TFLOPS).

  o030  a reasoning model thinks in tokens before it answers      (first half of old Fig 30)
  b32   10,000 thinking tokens is three minutes of decode         (N1)
  b33   RL on a language model: attempts, scores, nudges          (N2)
  b34   where an RL step's time goes                              (N3, P8)
  o031  the price of a fixed capability, log scale                (P3, P22)
  b35   per year: price 19x, bandwidth 1.4x                       (N4)
  o032  the whole set, restamped to the closing                   (stamp)

  python3 figures/V08/src/b_workload.py
"""
import math
from b_lib import (box, cell, ghost, txt, hd, ln, arr, prose, emit, stamp, f, n0, pct, text)

TPS = 51                                     # NVIDIA's single-request rate (Fig 29)


# ---- o030 ---------------------------------------------------------------------------------------------
def o030():
    think, answer = 3000, 300
    SC = 540 / (think + answer)
    b = [hd(40, 46, f"One hard question, illustrative: {n0(think)} thinking tokens, then a {answer}-token answer")]
    b.append(cell(40, 70, think * SC, 34, "h", label="the chain of thought: never shown, still generated"))
    b.append(cell(40 + think * SC, 70, answer * SC, 34, "u"))
    b.append(txt(40 + (think + answer) * SC + 10, 92, "answer", "sub2"))
    b.append(txt(40, 124, f"{n0(think)} decode steps, each a full read of the weights, before the first word of the answer",
                 "sub2"))
    b.append(txt(40, 142, "drawn to scale in tokens", "sub2"))
    body, yb = prose(186, [
        "The workload itself is changing, and the change makes decode matter more. Reasoning models think "
        "before they answer, producing a long internal chain of thought that is not part of the answer: a "
        "few hundred tokens for an easy question and tens of thousands for a hard one.",
        "Every one of those thinking tokens is a decode step. Each is memory bound and takes a full read of "
        "the weights, and all of it happens before the user has seen a single word of the answer. The "
        "longer a model reasons, the more of the work in one answer is decode.",
    ])
    emit("o030", stamp("Reasoning models think before they answer"),
         "A reasoning model thinks in tokens before it answers", yb + 30, b + [body],
         "The hidden tokens are the expensive ones. Everything in this series that made decode cheaper now "
         "applies to most of what a reasoning model writes.")


# ---- b32: thinking time --------------------------------------------------------------------------------
def b32():
    rows = [(300, "an easy question"), (10_000, "a hard one"), (30_000, "a very hard one")]
    secs = [n / TPS for n, _ in rows]
    assert [round(s, 1) for s in secs] == [5.9, 196.1, 588.2]
    X0, DEC = 220, 120                                       # 120 px per factor of ten, from 1 s
    xs = lambda s: X0 + math.log10(s) * DEC
    b = [hd(40, 46, f"Thinking time before the answer starts, at {TPS} tokens a second, log scale ({{{{fig:v01-o121}}}})")]
    for k, ((n, lab), s) in enumerate(zip(rows, secs)):
        y = 70 + k * 46
        b.append(txt(40, y + 12, f"{n0(n)} tokens", "cap"))
        b.append(txt(40, y + 28, lab, "sub2"))
        w = xs(s) - X0
        b.append(cell(X0, y, w, 28, "h"))
        note = f"{f(s, 1)} s" if s < 60 else f"{f(s, 0)} s, {f(s / 60, 1)} minutes"
        b.append(txt(X0 + w + 10, y + 19, note, "sub2"))
    ya = 70 + 3 * 46 + 4
    b.append(ln(X0, ya, xs(1000), ya, "axis"))
    for e_ in range(0, 4):
        x = xs(10**e_)
        b.append(ln(x, ya, x, ya + 4, "tick"))
        b.append(txt(x, ya + 18, f"{10**e_:,} s", "sub2", "middle"))
    body, yb = prose(ya + 60, [
        f"At NVIDIA's single-request rate of {TPS} tokens a second, a few hundred thinking tokens add "
        f"{f(secs[0], 0)} seconds before the answer starts; ten thousand add more than three minutes; thirty "
        "thousand, nearly ten.",
        "Batching does not shorten that wait for the one user waiting: it shares each weight read across "
        "users, not across one user's tokens. Only cheaper decode steps do, which is where the first half "
        "of this episode, speculative decoding, comes back in.",
    ])
    emit("b32", stamp("Every one of those thinking tokens is a decode step"),
         "Ten thousand thinking tokens is three minutes of decode before the first word", yb + 30, b + [body],
         "Log scale, a hundred to one between the ends. For a reasoning model, time per output token has "
         "become the time to the answer.")


# ---- b33: the RL loop -----------------------------------------------------------------------------------
def b33():
    b = [hd(40, 46, "One step of the loop that trains a reasoning model")]
    b.append(box(40, 70, 200, 70, "h", "rollout", "the model writes attempts:", "decode, token by token"))
    b.append(box(270, 70, 160, 70, "u", "reward", "each attempt", "is scored"))
    b.append(box(460, 70, 180, 70, "u", "update", "gradients nudge", "every weight"))
    b.append(arr(244, 105, 266, 105))
    b.append(arr(434, 105, 456, 105))
    b.append(ln(550, 144, 550, 172, "conn"))
    b.append(ln(550, 172, 140, 172, "conn"))
    b.append(arr(140, 172, 140, 146))
    b.append(txt(345, 192, "the next step generates with the new weights", "sub2", "middle"))
    body, yb = prose(236, [
        "The same shift shows up in training too. The reinforcement learning that produces reasoning models "
        "is dominated by rollouts, where the model generates its own attempts and they get scored.",
        "A rollout is just inference: decode, token by token, every weight read for every token. The update "
        "is ordinary training ({{fig:v06-o004}}): nudge every weight in the direction that makes "
        "high-scoring attempts more likely, then generate again with the new weights.",
    ])
    emit("b33", stamp("dominated by rollouts"),
         "Reinforcement learning: write attempts, score them, nudge the weights",
         yb + 30, b + [body],
         "A loop with inference inside it. Whatever makes decode slow makes this kind of training slow too.")


# ---- b34: where the time goes -----------------------------------------------------------------------------
PROFILE = {"math model": (91, 2, 7), "code model": (84, 7, 9)}
assert all(sum(v) == 100 for v in PROFILE.values())


def b34():
    L, X0 = 360, 190
    b = [hd(40, 46, "RhymeRL's profile: 32B models, responses capped at 16,000 tokens, drawn to scale")]
    for k, (name, (ro, rw, tr)) in enumerate(PROFILE.items()):
        y = 70 + k * 46
        b.append(txt(40, y + 19, f"{name}, 16k", "cap"))
        x = X0
        for v, c, lab in ((ro, "h", f"rollout {ro}%"), (rw, "u", None), (tr, "u", None)):
            b.append(cell(x, y, v / 100 * L, 28, c, rx=2, label=lab))
            x += v / 100 * L
        b.append(txt(X0 + L + 8, y + 19, f"reward {rw}, train {tr}", "sub2"))
    y = 70 + 2 * 46
    b.append(txt(40, y + 19, "both, at 32k", "cap"))
    b.append(cell(X0, y, 0.95 * L, 28, "h", rx=2, label="rollout over 95%"))
    b.append(ghost(X0 + 0.95 * L, y, 0.05 * L, 28, rx=2))
    b.append(txt(X0 + L + 8, y + 19, "the rest under 5", "sub2"))
    body, yb = prose(70 + 3 * 46 + 34, [
        "The RhymeRL team profiled this with responses capped at 16,000 tokens. Rollouts took 91% of an "
        "entire reinforcement-learning step for a math model; for a code model, 84%. At 32,000 tokens, both "
        "passed 95%.",
        "Their explanation is the one this series started with: generating each token requires a forward "
        "pass, and that pass is constrained by memory bandwidth. Training a reasoning model is now mostly "
        "an inference workload.",
    ])
    emit("b34", stamp("Rollouts took 91%"),
         "Generating the attempts takes 84 to 91% of an RL step", yb + 30, b + [body],
         "The line between training infrastructure and serving infrastructure is collapsing: what makes "
         "serving fast now makes this training fast too.")


# ---- o031: the price of a fixed capability ------------------------------------------------------------------
P0, P1, MONTHS = 20.0, 0.07, 23                       # Nov 2022 to Oct 2024
DROP = P0 / P1
assert round(DROP, 1) == 285.7 and (2024 - 2022) * 12 + (10 - 11) == MONTHS


def o031():
    X0, DEC, LO = 200, 100, -2                         # 100 px per factor of ten, from $0.01
    xp = lambda p: X0 + (math.log10(p) - LO) * DEC
    b = [hd(40, 46, "Price per million tokens of a model scoring 64.8 on MMLU, GPT-3.5's level, log scale")]
    rows = [("November 2022", P0, "h", f"${f(P0)}"), ("October 2024", P1, "s", f"${f(P1)}, an 8-billion-parameter model")]
    for k, (lab, p, c, note) in enumerate(rows):
        y = 72 + k * 48
        b.append(txt(40, y + 19, lab, "cap"))
        w = xp(p) - X0
        b.append(cell(X0, y, w, 28, c))
        b.append(txt(X0 + w + 10, y + 19, note, "sub2"))
    ya = 72 + 2 * 48 + 4
    b.append(ln(X0, ya, xp(100), ya, "axis"))
    for e_, lab in zip(range(-2, 3), ["$0.01", "$0.10", "$1", "$10", "$100"]):
        x = xp(10.0**e_)
        b.append(ln(x, ya, x, ya + 4, "tick"))
        b.append(txt(x, ya + 18, lab, "sub2", "middle"))
    body, yb = prose(ya + 60, [
        f"The Stanford AI Index tracked the price of a GPT-3.5-level score on MMLU, the standard knowledge "
        f"benchmark, with questions across 57 subjects. In November 2022 that score cost ${f(P0)} per million "
        f"tokens; by October 2024, ${f(P1)}: {f(P0, 0)} ÷ {f(P1)} = {f(DROP, 0)}, more than 280 times "
        f"cheaper in under two years.",
        "The capability is held fixed and only the model changes. An 8-billion-parameter model, Gemini 1.5 "
        "Flash-8B, reached that score, running on a stack built over three years to move fewer bytes per "
        "token. The Index's prices blend input and output prices three to one.",
    ])
    emit("o031", stamp("The Stanford AI index tracked"),
         "The price of a fixed capability fell 286-fold in 23 months", yb + 30, b + [body],
         "One score held constant, and a factor of 286 in under two years. The next figure asks how much of "
         "it the chips could have supplied.")


# ---- b35: per year ----------------------------------------------------------------------------------------------
def b35():
    price_yr = DROP ** (12 / MONTHS)
    bw_yr = (8.0 / 2.0) ** (1 / 4)
    fl_yr = (2250 / 312) ** (1 / 4)
    bw_window = (8.0 / 2.0) ** (MONTHS / 48)
    share = math.log(bw_window) / math.log(DROP)
    assert round(price_yr, 1) == 19.1 and round(bw_yr, 2) == 1.41 and round(fl_yr, 2) == 1.64
    assert round(bw_window, 2) == 1.94 and round(share, 2) == 0.12 and fl_yr > bw_yr
    X0, DEC = 220, 200                                 # 200 px per factor of ten, from 1
    xf = lambda v: X0 + math.log10(v) * DEC
    b = [hd(40, 46, "Improvement per year, log scale: a factor of 1 is no change at all")]
    rows = [("price of the capability", price_yr, "s", f"{f(price_yr, 1)} × a year"),
            ("memory bandwidth", bw_yr, "u", f"{f(bw_yr, 2)} × a year: A100 to Blackwell"),
            ("compute", fl_yr, "u", f"{f(fl_yr, 2)} × a year")]
    for k, (lab, v, c, note) in enumerate(rows):
        y = 70 + k * 44
        b.append(txt(40, y + 19, lab, "cap"))
        w = xf(v) - X0
        b.append(cell(X0, y, w, 28, c))
        b.append(txt(X0 + w + 10, y + 19, note, "sub2"))
    ya = 70 + 3 * 44 + 4
    b.append(ln(X0, ya, xf(100), ya, "axis"))
    for v in (1, 2, 5, 10, 20, 50, 100):
        x = xf(v)
        b.append(ln(x, ya, x, ya + 4, "tick"))
        b.append(txt(x, ya + 18, f"{v} ×", "sub2", "middle"))
    body, yb = prose(ya + 60, [
        f"To compare a change over 23 months with one over four years, turn each into a factor per year "
        f"with roots. A drop of {f(DROP, 0)} times in 23 months is {f(DROP, 0)} raised to the power 12/23, "
        f"{f(price_yr, 1)} times a year. Memory bandwidth roughly quadrupled over four years, from about "
        f"2 TB/s on the A100 to around 8 on Blackwell: the fourth root of 4, {f(bw_yr, 2)} times a year.",
        f"Over the price series' 23 months, bandwidth grew {f(bw_window, 2)} times. Had the price of a "
        f"memory-bound token tracked bandwidth alone, it would have fallen about two-fold, not "
        f"{f(DROP, 0)}-fold. Measured as factors multiplied together, with logarithms, bandwidth supplied "
        f"log {f(bw_window, 2)} ÷ log {f(DROP, 0)} = {pct(share, 0)} of the drop; the rest came from smaller "
        "models on a better stack.",
        f"Compute climbed faster still, about {f(2250 / 312, 1)} times over the same four years "
        "({{fig:v02-o069}}), so the gap that decode falls into is wider now than when this series started.",
    ])
    emit("b35", stamp("Memory bandwidth roughly quadrupled"),
         "286 times in 23 months is 19 times a year; bandwidth grew 1.4 times a year", yb + 30, b + [body],
         "The hardware did not stand still, but at 1.4 times a year it could not have produced 19. Most of "
         "the drop came from moving fewer bytes per token.")


# ---- o032: the closing ---------------------------------------------------------------------------------------------
def o032():
    rows = [("speculative decoding", "several tokens from a single weight read", "m"),
            ("ring attention", "spread the cache across devices", "s"),
            ("sparse attention", "read less of it each step", "s"),
            ("cache eviction", "delete parts of it outright", "s"),
            ("retrieval", "keep the context short enough that it never grows", "s")]
    b = [hd(40, 46, "Eight episodes, one target")]
    for k, (a, c, cls) in enumerate(rows):
        y = 70 + k * 46
        b.append(cell(40, y, 200, 34, cls, rx=4, label=a))
        b.append(arr(246, y + 17, 264, y + 17))
        b.append(cell(270, y, 370, 34, "u", rx=4, label=c))
    body, yb = prose(70 + 5 * 46 + 30, [
        "Every one is a way of getting more useful work out of every byte that crosses the memory bus, and "
        "goodput decides whether any of it arrived inside its deadline.",
        "Each arrived on its own, answering its own bottleneck, and we have met them one at a time. A "
        "request arriving in production meets all of them at once, in a single pass.",
    ])
    emit("o032", stamp("Every technique in these eight episodes"),
         "Five ways to get more out of every byte that crosses the bus", yb + 30, b + [body],
         "The hand-off to the final episode, which follows one real request into a rack of 72 GPUs, from the "
         "routing decision that picks its machine to the last token it streams back.")


if __name__ == "__main__":
    for fn in (o030, b32, b33, b34, o031, b35, o032):
        fn()
