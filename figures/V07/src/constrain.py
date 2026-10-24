"""V7 Part 10, constrained decoding: o023 trimmed, o022 redrawn and moved, o024 trimmed, and b63–b70,
b72 (P63–P70 of the review; §5 items 14, 15 and 28).

  o023  the mask sits one stage before the sampler; what it is for
  b63   asking in the prompt is a bet on every token: 0.999^n
  b64   minus infinity becomes exactly zero, and the rest renormalise
  o022  a finite state machine for [0-9]{4}-[0-9]{2}, tracing 2025-1x to its refusal
  b65   the mask is over tokens, and a token is several characters
  b66   a machine that counts depth needs a state for every depth
  b67   a stack remembers depth: [[1],[2,[3]]]
  o024  the cost to beat: every token, every step; Outlines' index and XGrammar's split
  b68   the index: one row per state, built once
  b69   XGrammar builds the rest of the mask on the CPU while the GPU runs
  b70   the guarantee is exact and narrow, and a mask can steer
  b72   an agent cannot call a tool that is not on the list

XGrammar figures from Dong et al. (arXiv 2411.15100v3): under 40 µs per token for JSON, and 1,134 of
Llama 3.1's tokens context-dependent under a JSON grammar. Read 2026-10-24.

  python3 figures/V07/src/constrain.py
"""
import math
from bcommon import (SRT, BW, VOCAB, W70, W8, arr, box, cell, emit, eq, f, g, ghost, hd, ln, pc,
                     prose, stamp, tw, txt)
from sampler import CONF, softmax

# ---- the date machine: [0-9]{4}-[0-9]{2} --------------------------------------------------------
PATTERN = "[0-9]{4}-[0-9]{2}"
REJECT = "reject"


def step(state, ch):
    """One character. States 0-3 and 5-6 want a digit, 4 wants a dash, 7 accepts and wants nothing."""
    if state == REJECT:
        return REJECT
    want_digit = state in (0, 1, 2, 3, 5, 6)
    if want_digit and ch.isdigit():
        return state + 1
    if state == 4 and ch == "-":
        return 5
    return REJECT


def run(state, s):
    path = [state]
    for ch in s:
        state = step(state, ch)
        path.append(state)
    return path


assert run(0, "2025-10")[-1] == 7 and run(0, "2025-1x")[-1] == REJECT and run(0, "2025-1x")[-2] == 6


# ---- o023 ---------------------------------------------------------------------------------------
def o023():
    b = [hd(40, 46, "One stage before the sampler")]
    b.append(box(40, 66, 150, 44, "u", "logits", rx=6))
    b.append(arr(194, 88, 222, 88))
    b.append(box(226, 66, 220, 44, "h", "illegal tokens to −∞", rx=6))
    b.append(arr(450, 88, 478, 88))
    b.append(box(482, 66, 158, 44, "s", "sampler", rx=6))
    b.append(txt(40, 146, "needed whenever a machine reads the output", "cap"))
    for k, s in enumerate(["JSON a parser will consume", "a query matching a schema",
                           "tool calls that type-check"]):
        b.append(cell(40 + k * 202, 158, 194, 28, "u", label=s))
    body, yb = prose(230, [
        "Sampling chooses among the tokens the model proposes. Constrained decoding changes which "
        "tokens are on offer in the first place, one stage earlier: before the sampler runs, the "
        "engine sets the logit of every token that would break the format to minus infinity.",
        "It is needed whenever the output will be read by a machine rather than a person. A schema is "
        "a written description of the shape data must have: which fields, in what order, of what "
        "type. To type-check is to confirm each value has the type the schema demands, a number "
        "where a number is required.",
    ])
    emit("o023", stamp(SRT, "Constraint decoding changes which tokens"),
         "Constrained decoding changes which tokens are on offer at all", yb + 32, b + [body],
         "The mechanism is brutally simple. All the sophistication is in deciding what to mask.")


# ---- b63: asking nicely -------------------------------------------------------------------------
def b63():
    p = 0.001
    ns = [200, 500, 2000]
    ok = [(1 - p) ** n for n in ns]
    assert [round(v, 3) for v in ok] == [0.819, 0.606, 0.135]
    b = [hd(40, 46, "Chance that an output never strays, if each token strays one time in a thousand")]
    b.append(eq(40, 64, 330, "chance all n tokens behave = 0.999^n", "u", h=34))
    X0, SC = 200, 400
    for k, (n, v) in enumerate(zip(ns, ok)):
        y = 122 + k * 40
        b.append(txt(40, y + 18, f"{g(n)} tokens", "cap"))
        b.append(cell(X0, y, SC, 26, "u"))
        b.append(cell(X0, y, v * SC, 26, "s", label=pc(v)))
    b.append(txt(X0 + SC, 122 + 3 * 40 + 4, "100%", "sub2", "end"))
    body, yb = prose(122 + 3 * 40 + 44, [
        "Asking for the format in the prompt is not a guarantee, because eventually the model emits "
        "one stray token and the parser fails. Suppose each token has a 0.1% chance of breaking the "
        "format, independently: an output survives only if every token behaves, a chance of 0.999 "
        "multiplied by itself once per token.",
        f"A 200-token answer parses {pc(ok[0])} of the time, a 500-token one {pc(ok[1])}, a "
        f"2,000-token one {pc(ok[2])}. The longer the output, the more certain the failure, and a "
        "program reading it needs it to work every time.",
    ])
    emit("b63", stamp(SRT, "Asking for the format in the prompt is"),
         "Asking nicely is a bet placed on every token", yb + 32, b + [body],
         "Bars to scale; the rate is illustrative and the shape is not. Any per-token chance of error, "
         "however small, compounds over a long output.")


# ---- b64: minus infinity ------------------------------------------------------------------------
def b64():
    before = softmax([v for _, v in CONF])
    masked = [v for _, v in CONF]
    masked[1] = -math.inf
    after = softmax(masked)
    assert after[1] == 0.0 and math.exp(-math.inf) == 0.0
    assert [round(100 * v, 2) for v in after] == [99.06, 0.0, 0.9, 0.04]
    b = [hd(40, 46, "Suppose the format forbids dog: its logit becomes −∞")]
    b.append(txt(110, 70, "logit", "sub2")); b.append(txt(170, 70, "before", "sub2"))
    b.append(txt(400, 70, "after the mask", "sub2"))
    for i, ((nm, v), p0, p1) in enumerate(zip(CONF, before, after)):
        y = 80 + i * 30
        b.append(txt(40, y + 16, nm, "cap"))
        b.append(txt(110, y + 16, "−∞" if i == 1 else f(v, 1), "sub2"))
        b.append(cell(170, y + 2, max(p0 * 180, 1.5), 20, "u"))
        b.append(txt(170 + max(p0 * 180, 1.5) + 6, y + 17, pc(p0, 2 if p0 < 0.01 else 1), "sub2"))
        if p1 > 0:
            b.append(cell(400, y + 2, max(p1 * 180, 1.5), 20, "s"))
            b.append(txt(400 + max(p1 * 180, 1.5) + 6, y + 17, pc(p1, 2), "sub2"))
        else:
            b.append(ghost(400, y + 2, 3, 20)); b.append(txt(410, y + 17, "0, exactly", "sub2"))
    ye = 214
    xe = 40
    for x, lab, w in [(-1, "e^−1 = 0.37", 116), (-10, "e^−10 = 0.0000454", 150),
                      (-100, "e^−100 ≈ 3.7 × 10^−44", 182), (None, "e^−∞ = 0", 116)]:
        b.append(eq(xe, ye, w, lab, "h" if x is None else "u", h=32))
        xe += w + 8
    assert round(math.exp(-1), 2) == 0.37 and round(math.exp(-10), 7) == 0.0000454
    assert abs(math.exp(-100) / 1e-44 - 3.72) < 0.01
    body, yb = prose(ye + 32 + 40, [
        "Softmax raises e to each logit, and e to a very negative number is very small: the row of "
        "boxes shows it shrinking toward zero. In a computer's floating-point arithmetic e to minus "
        "infinity is 0 itself, not merely small, so the forbidden token's share is exactly 0.",
        f"The others are renormalised over what remains: cat rises from {pc(before[0])} to "
        f"{pc(after[0], 2)}, the from {pc(before[2], 2)} to {pc(after[2], 2)}. A token with probability "
        "zero can never be drawn, whatever sampler runs after: temperature divides minus infinity and "
        "gets minus infinity, and top-k, top-p and min-p only ever remove tokens.",
    ])
    emit("b64", stamp(SRT, "Softmax turns those into exactly zero,"),
         "Minus infinity becomes exactly zero, and the rest renormalise", yb + 32, b + [body],
         "Masking is softmax over the survivors. The model's preferences among the legal tokens are "
         "untouched; only the illegal ones vanish.")


# ---- o022: the state machine --------------------------------------------------------------------
def o022():
    word = "2025-1x"
    trace = run(0, word)
    assert trace == [0, 1, 2, 3, 4, 5, 6, REJECT]
    b = [hd(40, 46, f"A state machine for {PATTERN}: four digits, a dash, two digits")]
    SX = [40 + k * 76 for k in range(8)]
    labels = ["digit"] * 4 + ["-"] + ["digit"] * 2
    for k, x in enumerate(SX):
        cls = "s" if k == 7 else "u"
        b.append(cell(x, 80, 44, 30, cls, rx=15, label=f"{k}"))
        if k < 7:
            b.append(arr(x + 46, 95, SX[k + 1] - 4, 95))
            b.append(txt((x + 44 + SX[k + 1]) / 2, 86, labels[k], "sub2", "middle"))
    b.append(txt(SX[0] + 22, 128, "start", "sub2", "middle"))
    b.append(txt(SX[7] + 22, 128, "accept", "sub2", "middle"))
    b.append(cell(270, 150, 120, 30, "h", rx=15, label="reject"))
    b.append(arr(SX[4] + 22, 112, 330, 146))
    b.append(txt(404, 170, "any other character, from any state", "sub2"))
    yt = 214
    b.append(txt(40, yt + 17, "fed", "cap"))
    b.append(txt(40, yt + 49, "state after", "cap"))
    for i, ch in enumerate(word):
        x = 140 + i * 56
        st = trace[i + 1]
        b.append(cell(x, yt, 44, 26, "u", label=ch))
        b.append(cell(x, yt + 32, 44, 26, "h" if st == REJECT else "s",
                      label="✗" if st == REJECT else f"{st}"))
    body, yb = prose(yt + 58 + 40, [
        "What decides which tokens would break the format is an automaton that tracks the output so "
        f"far. For output shaped like a regular expression, a pattern language for text in which "
        f"{PATTERN} means four digits, a dash and two digits (a year and a month, like 2025-10), a "
        "finite state machine is enough.",
        "A state machine is a set of states, with a rule for each saying which characters move it to "
        "which state. This one counts its way through the pattern: four digits take it from state 0 "
        "to 4, a dash to 5, two more digits to 7, which accepts. Any other character goes to reject, "
        "and nothing leaves reject.",
        f"Fed {word}, it reaches state 6 after 2025-1 and is refused at x. Outlines, a "
        "constrained-decoding library, takes this approach, reformulating generation as transitions "
        "between the states of a state machine.",
    ])
    emit("o022", stamp(SRT, "For output shaped like a regular"),
         "A state machine is states, and the characters that move between them", yb + 32, b + [body],
         "A finite set of states is enough for any pattern that never has to remember an unbounded "
         "amount: here, only how far through the date it has got.")


# ---- b65: tokens span characters ----------------------------------------------------------------
CANDS = ["25", "2", "25-", "250", "-", "x", "2025"]


def b65():
    start = run(0, "20")[-1]
    assert start == 2
    rows = [(t, run(start, t)) for t in CANDS]
    ok = {t: p[-1] != REJECT for t, p in rows}
    assert [t for t in CANDS if ok[t]] == ["25", "2", "25-"]
    b = [hd(40, 46, "After 20, the machine is in state 2. Which next tokens are allowed?")]
    b.append(txt(40, 66, "token", "sub2")); b.append(txt(140, 66, "the machine's state, and each character fed in", "sub2"))
    for k, (t, pth) in enumerate(rows):
        y = 84 + k * 40
        b.append(cell(40, y, 70, 24, "u", label=t))
        x = 140
        b.append(cell(x, y, 30, 24, "u", rx=12, label=f"{start}"))
        x += 30
        for ch, st in zip(t, pth[1:]):
            b.append(arr(x + 3, y + 12, x + 31, y + 12))
            b.append(txt(x + 17, y + 3, ch, "sub2", "middle"))
            x += 36
            bad = st == REJECT
            b.append(cell(x, y, 44 if bad else 30, 24, "h" if bad else "u", rx=12,
                          label="✗" if bad else f"{st}"))
            x += 44 if bad else 30
            if bad:
                break
        b.append(cell(560, y, 80, 24, "s" if ok[t] else "h", label="allowed" if ok[t] else "masked"))
    body, yb = prose(84 + len(rows) * 40 + 24, [
        "The mask is applied to tokens, and a token is often several characters ({{fig:v01-o006}}). "
        "To decide whether a token is allowed, the machine is fed its characters one at a time from "
        "the current state; the token is allowed only if none of them reaches reject.",
        "After 20 the machine is in state 2. The token 25 passes through 3 to 4, and 25- reaches 5. "
        "250 puts a third digit where the dash must go and is refused, and 2025 fails the same way. A "
        f"real vocabulary has {g(VOCAB)} tokens to test like this at every step, which is the cost "
        "taken up below.",
    ])
    emit("b65", stamp(SRT, "outlines takes, reformulating generation"),
         "The mask is over tokens, and a token can be several characters", yb + 32, b + [body],
         "Token strings illustrative. Checking a token means running the machine over every character "
         "in it, which is why the work grows with the size of the vocabulary.")


# ---- b66: counting needs states -----------------------------------------------------------------
def b66():
    depth_max = 3
    states = list(range(depth_max + 1))
    word = "[[[["
    d, trace = 0, []
    for ch in word:
        d = d + 1 if ch == "[" else d - 1
        trace.append(d if d <= depth_max else REJECT)
    assert trace == [1, 2, 3, REJECT]
    b = [hd(40, 46, "Depth as states: [ moves one state right, ] one state left")]
    SX = [60 + k * 120 for k in range(depth_max + 2)]
    for k, x in enumerate(SX):
        if k <= depth_max:
            b.append(cell(x, 86, 56, 30, "u", rx=15, label=f"depth {k}"))
        else:
            b.append(ghost(x, 86, 56, 30, rx=15, label="depth 4"))
        if k < depth_max + 1:
            b.append(arr(x + 60, 94, SX[k + 1] - 4, 94) if k < depth_max else
                     f'<line class="conn" x1="{x + 60}" y1="94" x2="{SX[k + 1] - 4}" y2="94" stroke-dasharray="3 3" marker-end="url(#arw)"/>')
            b.append(txt((x + 56 + SX[k + 1]) / 2, 84, "[", "sub2", "middle"))
            if k < depth_max:
                b.append(arr(SX[k + 1] - 4, 108, x + 60, 108))
                b.append(txt((x + 56 + SX[k + 1]) / 2, 126, "]", "sub2", "middle"))
    b.append(txt(SX[-1] + 28, 140, "no such state: reject", "sub2", "middle"))
    yt = 170
    b.append(txt(40, yt + 17, "fed [[[[", "cap"))
    for i, st in enumerate(trace):
        x = 160 + i * 60
        b.append(cell(x, yt, 50, 26, "h" if st == REJECT else "u", label="✗" if st == REJECT else f"{st}"))
    body, yb = prose(yt + 26 + 40, [
        "Grammars that nest, like JSON or SQL, need more, because a state machine cannot remember how "
        "many brackets are still open. To track depth it needs a state for each depth: an opening "
        "bracket moves it one state right, a closing one one state left.",
        f"With states for depths 0 to {depth_max}, the machine follows three open brackets and refuses "
        "a fourth, though [[[[]]]] is perfectly good JSON. A machine with d + 1 states handles depth d "
        "and fails at d + 1, and JSON sets no limit on depth, so no finite number of states is enough.",
    ])
    emit("b66", stamp(SRT, "because a state machine cannot remember"),
         "A machine that tracks depth needs a state for every depth", yb + 32, b + [body],
         "The problem is not speed but memory: a finite machine can only count as high as it has "
         "states.")


# ---- b67: the stack -----------------------------------------------------------------------------
def b67():
    text = "[[1],[2,[3]]]"
    stack, heights, read = [], [], []
    for ch in text:
        if ch == "[":
            stack.append("[")
        elif ch == "]":
            assert stack, "pop from an empty stack would reject"
            stack.pop()
        else:
            continue
        heights.append(len(stack)); read.append(ch)
    assert heights == [1, 2, 1, 2, 3, 2, 1, 0] and not stack
    b = [hd(40, 46, f"The stack after each bracket of {text}")]
    for i, (ch, h) in enumerate(zip(read, heights)):
        x = 50 + i * 74
        base = 176
        for j in range(h):
            b.append(cell(x, base - (j + 1) * 24, 50, 20, "m", label="["))
        if h == 0:
            b.append(ghost(x, base - 24, 50, 20, label="empty"))
        b.append(ln(x - 4, base + 2, x + 54, base + 2, "tick"))
        b.append(txt(x + 25, base + 20, f"read {ch}", "sub2", "middle"))
        b.append(txt(x + 25, base + 36, f"height {h}", "sub2", "middle"))
    body, yb = prose(254, [
        "A stack is a pile you can only touch at the top: push puts an item on, pop takes the top one "
        "off. A pushdown automaton is a state machine plus a stack. On [ it pushes; on ] it pops, and "
        "it refuses a ] when there is nothing to pop. The stack's height is the depth, and it has no "
        "limit.",
        f"Reading {text}, the stack after each bracket stands 1, 2, 1, 2, 3, 2, 1 and finally 0 high. "
        "Empty at the end means every bracket was closed, so the text is accepted. A pushdown "
        "automaton is what XGrammar runs.",
    ])
    emit("b67", stamp(SRT, "That takes a pushdown automaton, a state"),
         "A stack remembers how deep you are", yb + 32, b + [body],
         "One pile with no fixed height replaces an unlimited number of states. That is the whole "
         "difference between the two machines.")


# ---- o024: the cost to beat ---------------------------------------------------------------------
def o024():
    b = [hd(40, 46, "Naively: every token in the vocabulary through the automaton, at every step")]
    b.append(cell(40, 66, 600, 30, "h", label=f"{g(VOCAB)} tokens tested per output token"))
    b.append(hd(40, 136, "Two ways around it"))
    b.append(box(40, 152, 290, 82, "s", "Outlines: an index", "once per schema, from each state",
                 "to the tokens allowed in it"))
    b.append(box(350, 152, 290, 82, "s", "XGrammar: split the vocabulary", "check most tokens ahead of time;",
                 "the few that need the stack, live"))
    body, yb = prose(276, [
        "The obvious worry is cost, because the mask is needed at every single token. Done naively, "
        f"every one of the {g(VOCAB)} tokens in Llama 3's vocabulary would be run through the "
        "automaton, character by character, at every step.",
        "Outlines removes that by precomputing, once per schema, an index from each state of the "
        "machine to the set of tokens allowed in it, so the per-step work becomes a lookup. XGrammar "
        "splits the vocabulary instead: most tokens can be checked ahead of time, and only a few need "
        "the live stack.",
    ])
    emit("o024", stamp(SRT, "The obvious worry is cost, because this"),
         "Testing every token at every step is the cost to beat", yb + 32, b + [body],
         "Two answers to one question: do the work once, before generation starts, or do at runtime "
         "only the part that cannot be done in advance.")


# ---- b68: the index -----------------------------------------------------------------------------
TOY = ["0", "1", "2", "5", "20", "25", "-", "-1", "10", "2025", "x", "⟨end⟩"]


def allowed(state, tok):
    if tok == "⟨end⟩":
        return state == 7
    return run(state, tok)[-1] != REJECT


def b68():
    index = {s: [t for t in TOY if allowed(s, t)] for s in range(8)}
    now = run(0, "2025-1")[-1]
    assert now == 6 and index[6] == ["0", "1", "2", "5"] and index[7] == ["⟨end⟩"]
    assert index[4] == ["-", "-1"] and index[0] == ["0", "1", "2", "5", "20", "25", "10", "2025"]
    build_once = 8 * VOCAB
    assert build_once == 1_026_048
    b = [hd(40, 46, f"The index for {PATTERN}, over a toy vocabulary of {len(TOY)} tokens")]
    b.append(txt(40, 72, "state", "sub2")); b.append(txt(110, 72, "tokens allowed there", "sub2"))
    for s in range(8):
        y = 82 + s * 28
        cls = "m" if s == now else "u"
        b.append(cell(40, y, 50, 22, cls, label=f"{s}"))
        x = 110
        for t in index[s]:
            w = max(28, round(tw(t) + 14))
            b.append(cell(x, y, w, 22, "s" if s == now else "u", label=t))
            x += w + 6
    b.append(arr(30, 82 + now * 28 + 11, 38, 82 + now * 28 + 11))
    b.append(txt(110 + 4 * 34 + 12, 82 + now * 28 + 16, "after 2025-1: this row is the mask", "sub2"))
    body, yb = prose(82 + 8 * 28 + 34, [
        "Before generation starts, every token in the vocabulary is run through the machine from every "
        f"state, once, and the tokens each state allows are recorded. Here that is 8 states × "
        f"{len(TOY)} toy tokens; for Llama 3's vocabulary it would be 8 × {g(VOCAB)} = {g(build_once)} "
        "checks, done once per schema.",
        "During generation the engine only needs the machine's current state. After 2025-1 it is in "
        "state 6, and row 6 is the mask, fetched in one step. The work per step no longer grows with "
        "the vocabulary; it is a lookup, constant on average.",
    ])
    emit("b68", stamp(SRT, "Outlines removes that by pre-computing"),
         "The index turns a vocabulary of checks into one lookup", yb + 32, b + [body],
         "Toy vocabulary, real method. Pay once per schema, and every step after that is a table "
         "lookup.")


# ---- b69: overlap -------------------------------------------------------------------------------
def b69():
    t8, t70, mask = W8 / BW, W70 / BW, 40e-6
    frac8, frac70 = mask / t8, mask / t70
    ctx_dep, vocab31 = 1134, VOCAB
    assert round(t8 * 1e3, 2) == 4.79 and round(100 * frac8, 2) == 0.83 and round(100 * frac70, 2) == 0.10
    assert ctx_dep / vocab31 < 0.01
    b = [hd(40, 46, "One decode step of Llama 3 8B, to scale")]
    X0, SC = 110, 500 / t8
    b.append(txt(40, 84, "GPU", "cap"))
    b.append(cell(X0, 66, t8 * SC, 28, "m", label=f"forward pass: weights read, {f(t8 * 1e3, 2)} ms"))
    b.append(txt(40, 130, "CPU", "cap"))
    xm = X0 + t8 * SC - mask * SC - 60
    b.append(cell(xm, 112, max(mask * SC, 2), 28, "s"))
    b.append(txt(xm - 8, 130, "the mask, under 40 µs", "sub2", "end"))
    b.append(ln(X0 + t8 * SC, 60, X0 + t8 * SC, 146, "tick"))
    b.append(txt(X0 + t8 * SC, 162, "logits ready: apply the mask, sample", "sub2", "end"))
    body, yb = prose(200, [
        "XGrammar splits the vocabulary. For most tokens, whether they are allowed depends only on the "
        "current position in the grammar, not on what lies deeper in the stack, so they are checked "
        f"ahead of time. For Llama 3.1 under a JSON grammar its authors found only {g(ctx_dep)} of "
        "about 128,000 tokens, under 1%, that need the live stack.",
        "Those few are checked on the CPU while the GPU is still running the forward pass, so the "
        "mask is ready when the logits are; the two run at once ({{fig:v03-o072}}). Their measured "
        f"masks took under 40 microseconds per token. A Llama 3 8B decode step reads 16.06 GB of "
        f"weights, {f(t8 * 1e3, 2)} ms at 3.35 TB/s, so 40 µs is {pc(frac8, 2)} of it; for a 70B model, "
        f"{pc(frac70, 2)}.",
    ])
    emit("b69", stamp(SRT, "the mask for those is built on the CPU"),
         "The mask is built while the GPU is still working", yb + 32, b + [body],
         "Lanes to scale, the mask's 40 µs a sliver. It costs nothing in time, because it runs while "
         "the GPU is busy anyway.")


# ---- b70: the guarantee -------------------------------------------------------------------------
def b70():
    masked = [-math.inf] + [v for _, v in CONF[1:]]
    after = softmax(masked)
    before = softmax([v for _, v in CONF])
    assert [round(100 * v, 2) for v in after] == [0.0, 97.22, 2.66, 0.12]
    b = [hd(40, 46, "What a mask buys, exactly")]
    b.append(box(40, 66, 285, 60, "s", "The output will parse", "guaranteed"))
    b.append(box(355, 66, 285, 60, "h", "That it is true", "not guaranteed at all"))
    b.append(hd(40, 166, "Suppose the format forbids cat, the model's favourite"))
    b.append(txt(170, 188, "the model's shares", "sub2")); b.append(txt(400, 188, "after the mask", "sub2"))
    for i, ((nm, _), p0, p1) in enumerate(zip(CONF, before, after)):
        y = 196 + i * 28
        b.append(txt(40, y + 15, nm, "cap"))
        b.append(cell(170, y + 1, max(p0 * 180, 1.5), 18, "u"))
        b.append(txt(170 + max(p0 * 180, 1.5) + 6, y + 15, pc(p0, 2 if p0 < 0.01 else 1), "sub2"))
        if p1 > 0:
            b.append(cell(400, y + 1, max(p1 * 180, 1.5), 18, "h"))
            b.append(txt(400 + max(p1 * 180, 1.5) + 6, y + 15, pc(p1, 2), "sub2"))
        else:
            b.append(txt(400, y + 15, "masked", "sub2"))
    body, yb = prose(196 + 4 * 28 + 34, [
        "The guarantee this buys is exact and narrow. The output will parse, because no token that "
        "breaks the format can ever be drawn. Nothing about it is guaranteed to be true: a well-formed "
        "answer can still be wrong.",
        f"And because the mask can remove the token the model most wanted, generation can be pushed "
        f"down a path it would not otherwise have taken. Forbid cat, the model's {pc(before[0])} "
        f"favourite, and its share is spread over the rest in proportion: dog rises from "
        f"{pc(before[1])} to {pc(after[1], 2)}. The output parses, but it is not what the model would "
        "have said.",
    ])
    emit("b70", stamp(SRT, "The guarantee this buys is exact and"),
         "The guarantee is exact and narrow, and a mask can steer", yb + 32, b + [body],
         "A mask decides what may be said, not what is true. Forcing a format can force a worse "
         "answer, and nothing in the output will show it.")


# ---- b72: vetted tools --------------------------------------------------------------------------
TOOLS = [("search", 1.0, True), ("read_file", 0.55, True), ("delete_files", 0.85, False),
         ("send_payment", -1.2, False)]                     # illustrative logits


def b72():
    z = [v for _, v, _ in TOOLS]
    before = softmax(z)
    after = softmax([v if ok else -math.inf for _, v, ok in TOOLS])
    assert before[2] > 0.3 and before[2] > before[1]       # the model leans toward deleting
    assert after[2] == after[3] == 0.0 and abs(after[0] + after[1] - 1) < 1e-12
    assert abs(after[0] / after[1] - before[0] / before[1]) < 1e-12   # legal preferences untouched
    b = [hd(40, 46, "The agent is writing a tool call; the next token is the tool's name")]
    b.append(cell(40, 62, 150, 26, "u", label='{"tool": "'))
    b.append(txt(204, 80, "then one of:", "sub2"))
    b.append(txt(170, 112, "the model's shares", "sub2")); b.append(txt(400, 112, "allowed by the schema", "sub2"))
    for i, ((nm, _, ok), p0, p1) in enumerate(zip(TOOLS, before, after)):
        y = 120 + i * 28
        b.append(txt(40, y + 15, nm, "cap"))
        b.append(cell(170, y + 1, p0 * 180, 18, "u"))
        b.append(txt(170 + p0 * 180 + 6, y + 15, pc(p0, 0), "sub2"))
        if ok:
            b.append(cell(400, y + 1, p1 * 180, 18, "s"))
            b.append(txt(400 + p1 * 180 + 6, y + 15, pc(p1), "sub2"))
        else:
            b.append(txt(400, y + 15, "masked: never available", "sub2"))
    body, yb = prose(120 + 4 * 28 + 34, [
        "The mechanism generalises past formatting. An agent acts by writing a tool call "
        "({{fig:v07-b36}}); if the engine restricts the next token to an approved set, the agent's "
        "actions are held inside a vetted schema. Here the name must be search or read_file, so "
        "delete_files and send_payment are masked, however much the model leans toward them.",
        "It cannot emit a call that is not on the list, because those tokens are never available to "
        "it. The serving layer is the last place anything can be enforced before tokens reach a user "
        "or a tool. Names are drawn as single tokens for clarity; in practice the machine admits a "
        "name character by character, as in {{fig:v07-b65}}.",
    ])
    emit("b72", stamp(SRT, "And the mechanism generalizes"),
         "An agent cannot call a tool that is not on the list", yb + 32, b + [body],
         "Shares illustrative. A rule enforced at the logits holds whatever the prompt says, which "
         "makes the serving layer the place for any rule that must not be argued with.")


if __name__ == "__main__":
    for fn in (o023, b63, b64, o022, b65, b66, b67, o024, b68, b69, b70, b72):
        fn()
