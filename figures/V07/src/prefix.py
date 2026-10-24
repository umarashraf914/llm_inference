"""V7 Part 6, what repeats and why it can be reused: o012 rebuilt, then b36–b38
(P36–P38 of plans/depth_pass/V07_review.md).

  o012  the five kinds of overlap, drawn as repeated text in front of new text, with glosses
  b36   the agent loop, and the context it resends on every lap
  b37   a hit is a shared beginning, because attention is causal (recaps V01 Figs 35, 44, 45)
  b38   fifty requests behind one system prompt: 105,000 prefill tokens become 7,000

  python3 figures/V07/src/prefix.py
"""
from bcommon import (SRT, P8, PEAK, cell, emit, f, g, hd, ln, node, prose, stamp, tw, txt, arr,
                     box, pc)

# ---- o012: overlap is the normal case -----------------------------------------------------------
# (row label, repeated tokens, new tokens): token counts are illustrative; the 2,000-token system
# prompt matches V01 Fig 27.
ROWS = [("system prompt", 2000, 60), ("few-shot examples", 1200, 80),
        ("retrieved document", 3000, 40), ("multi-turn chat", 900, 300), ("agent loop", 5000, 1000)]


def o012():
    b = [hd(40, 46, "In each case the repeated text comes first, and only the end is new")]
    b.append(cell(40, 62, 14, 12, "s"))
    b.append(txt(60, 72, "repeated: sent before, in the same order", "sub2"))
    b.append(cell(300, 62, 14, 12, "m"))
    b.append(txt(320, 72, "new on this request", "sub2"))
    X0, SC = 190, 330 / max(r + n for _, r, n in ROWS)
    for k, (lab, rep, new) in enumerate(ROWS):
        y = 90 + k * 38
        b.append(txt(40, y + 16, lab, "cap"))
        b.append(cell(X0, y, rep * SC, 24, "s"))
        b.append(cell(X0 + rep * SC, y, max(new * SC, 2), 24, "m"))
        b.append(txt(X0 + (rep + new) * SC + 10, y + 16, f"{g(rep)} + {g(new)} tokens", "sub2"))
        assert rep > new or lab == "multi-turn chat"
    body, yb = prose(90 + 5 * 38 + 34, [
        "The prefill pool computes every one of these from scratch on every request, even when "
        "thousands of requests open with the same text. So compute the shared part once, and reuse it.",
        "Few-shot examples are worked question-and-answer pairs placed in front of the real question "
        "to show the model the format wanted. A retrieved document is a passage found by a search and "
        "pasted into the prompt, so the model can answer from it. The agent loop gets the next figure.",
        "In all five the repeated text comes first and the new text last. That order is not a detail: "
        "two figures on, it turns out that only a shared beginning can be reused.",
    ])
    emit("o012", stamp(SRT, "The pre-filled pool still computes every"),
         "The same text, computed again and again", yb + 32, b + [body],
         "Bars to scale, token counts illustrative. Overlap is the normal case rather than the "
         "exception, and it nearly always sits at the front of the prompt, the one place a cache can "
         "use it.")


# ---- b36: the agent loop ------------------------------------------------------------------------
LAP_NEW = 1000                                   # new tokens per lap, illustrative
LAPS = 4


def b36():
    b = [hd(40, 46, "One lap: the model writes a call, a program runs it, the result joins the text")]
    # the loop: four stages at the corners of a rectangle, clockwise
    b.append(box(40, 70, 140, 46, "u", "context", "all the text so far"))
    b.append(box(220, 70, 140, 46, "m", "model", "writes a tool call"))
    b.append(box(220, 172, 140, 46, "u", "tool runs", "outside the model"))
    b.append(box(40, 172, 140, 46, "u", "result", "appended as text"))
    b.append(arr(184, 93, 214, 93))
    b.append(arr(290, 120, 290, 166))
    b.append(arr(216, 195, 186, 195))
    b.append(arr(110, 168, 110, 122))
    # the context each lap sends, to scale
    sent = [LAP_NEW * k for k in range(1, LAPS + 1)]
    rep = [LAP_NEW * (k - 1) for k in range(1, LAPS + 1)]
    X0, SC = 448, 180 / sent[-1]
    b.append(txt(400, 70, "tokens each lap sends", "sub2"))
    for k in range(LAPS):
        y = 82 + k * 34
        b.append(txt(400, y + 15, f"lap {k + 1}", "cap"))
        if rep[k]:
            b.append(cell(X0, y, rep[k] * SC, 22, "s"))
        b.append(cell(X0 + rep[k] * SC, y, LAP_NEW * SC, 22, "m"))
        b.append(txt(X0 + sent[k] * SC + 8, y + 15, g(sent[k]), "sub2"))
    tot, again = sum(sent), sum(rep)
    assert (tot, again) == (10_000, 6_000)
    # over twenty laps, the share already sent before (b47 prices it)
    s20 = sum(LAP_NEW * k for k in range(1, 21)); r20 = sum(LAP_NEW * (k - 1) for k in range(1, 21))
    share20 = r20 / s20
    assert 0.90 < share20 < 0.91
    b.append(txt(400, 82 + LAPS * 34 + 12, f"{g(tot)} sent, {g(again)} of them a repeat", "sub2"))
    body, yb = prose(262, [
        "A tool call is text in an agreed shape, such as {\"tool\": \"search\", \"query\": \"…\"}. The "
        "model only writes it. Ordinary software outside the model reads it, runs the search, and "
        "pastes the result back in as more text ({{fig:v01-o024}}).",
        "The model keeps nothing between laps, so every lap sends the whole context again "
        f"({{{{fig:v01-o020}}}}). With {g(LAP_NEW)} new tokens a lap, lap k sends k thousand tokens, and "
        "all but the newest thousand went out on the lap before.",
        f"Four laps send 1,000 + 2,000 + 3,000 + 4,000 = {g(tot)} tokens, and {g(again)} of them are "
        f"a repeat. The repeated share only grows: over twenty laps it is {pc(share20)}.",
    ])
    emit("b36", stamp(SRT, "an agent resending its entire context on"),
         "An agent is a model in a loop that resends everything", yb + 32, b + [body],
         "Token counts illustrative, bars to scale. Agents run through the rest of this document, and "
         "this loop is all they are: a model, a tool, and a context resent in full on every lap.")


# ---- b37: a hit is a shared beginning -----------------------------------------------------------
CACHED = "You are helpful . What is 2+2 ?".split()
ARRIVING = "You are helpful . Translate cat".split()


def common_prefix(a, b):
    n = 0
    while n < min(len(a), len(b)) and a[n] == b[n]:
        n += 1
    return n


def b37():
    hit = common_prefix(CACHED, ARRIVING)
    assert hit == 4 and len(ARRIVING) - hit == 2
    b = [hd(40, 46, "Compare from the first token, and stop at the first difference")]
    ncol = max(len(CACHED), len(ARRIVING))
    word = lambda row, i: row[i] if i < len(row) else ""
    colw = [max(28, round(max(tw(word(CACHED, i)), tw(word(ARRIVING, i))) + 18)) for i in range(ncol)]
    xs, x = [], 130
    for w in colw:
        xs.append(x); x += w + 8
    y1, y2 = 96, 136
    # the bracket over the shared beginning: token 4's keys and values come from these four
    xa, xb = xs[0], xs[hit - 1] + colw[hit - 1]
    b.append(ln(xa, 86, xb, 86, "tick")); b.append(ln(xa, 86, xa, 91, "tick")); b.append(ln(xb, 86, xb, 91, "tick"))
    b.append(txt(xa, 78, f"token {hit}'s keys and values are computed from these {hit} alone", "sub2"))
    b.append(txt(40, y1 + 17, "cached", "cap"))
    b.append(txt(40, y2 + 17, "arriving", "cap"))
    for i, t in enumerate(CACHED):
        b.append(cell(xs[i], y1, colw[i], 26, "s" if i < hit else "u", label=t))
    for i, t in enumerate(ARRIVING):
        b.append(cell(xs[i], y2, colw[i], 26, "s" if i < hit else "m", label=t))
    # the first difference, and what each side of it costs
    xd = xs[hit] - 4
    b.append(ln(xd, y1 - 2, xd, y2 + 30, "mark"))
    b.append(txt(xd + 6, y2 + 46, "first difference", "sub2"))
    yb0 = y2 + 40
    b.append(ln(xa, yb0, xb, yb0, "tick")); b.append(ln(xa, yb0 - 5, xa, yb0, "tick")); b.append(ln(xb, yb0 - 5, xb, yb0, "tick"))
    b.append(txt((xa + xb) / 2, yb0 + 16, f"reused: {hit} tokens", "sub2", "middle"))
    body, yb = prose(232, [
        "A token's keys and values are computed from that token and the ones before it, never from "
        "the ones after, because attention is causal ({{fig:v01-o035}}). The first four tokens are the "
        "same in both prompts, so their keys and values are the same, and the cached copies can be "
        "used exactly as they are.",
        "From the fifth token the texts differ. Every later key and value depends on that fifth "
        "token, so nothing after the first difference can be reused, not even words that happen to "
        "match again further on ({{fig:v01-o045}}).",
        f"A hit is therefore the length of the shared beginning: {hit} of these {len(ARRIVING)} tokens, "
        f"with {len(ARRIVING) - hit} left to prefill. For a real follow-up question it is usually "
        "most of the prompt: 906 of 911 tokens in {{fig:v01-o044}}.",
    ])
    emit("b37", stamp(SRT, "That works because attention is causal."),
         "Only a shared beginning can be reused, because attention looks back", yb + 32, b + [body],
         "Causality, which forced decode to run one token at a time, is here the permission for "
         "reuse: the same beginning always produces the same keys and values.")


# ---- b38: fifty requests behind one system prompt ----------------------------------------------
N_REQ, SYS, Q = 50, 2000, 100


def b38():
    without = N_REQ * (SYS + Q)
    with_ = SYS + N_REQ * Q
    ratio = without / with_
    assert (without, with_, ratio) == (105_000, 7_000, 15.0)
    hit_share = SYS / (SYS + Q)
    t_full = 2 * P8 * (SYS + Q) / PEAK                  # one request's prefill at peak, seconds
    t_new = 2 * P8 * Q / PEAK
    b = [hd(40, 46, f"Tokens to prefill for {N_REQ} requests sharing a {g(SYS)}-token system prompt")]
    X0, SC = 200, 430 / without
    y = 72
    b.append(txt(40, y + 16, "without reuse", "cap"))
    b.append(txt(40, y + 32, f"{g(without)} tokens", "sub2"))
    b.append(cell(X0, y, N_REQ * SYS * SC, 30, "h", label=f"{N_REQ} copies of the system prompt"))
    b.append(cell(X0 + N_REQ * SYS * SC, y, N_REQ * Q * SC, 30, "m"))
    y = 124
    b.append(txt(40, y + 16, "with reuse", "cap"))
    b.append(txt(40, y + 32, f"{g(with_)} tokens", "sub2"))
    b.append(cell(X0, y, SYS * SC, 30, "s"))
    b.append(cell(X0 + SYS * SC, y, N_REQ * Q * SC, 30, "m"))
    b.append(txt(X0 + with_ * SC + 10, y + 19, f"one copy, then {N_REQ} questions: {f(ratio, 0)} times less", "sub2"))
    b.append(cell(200, 176, 14, 12, "m"))
    b.append(txt(220, 186, f"the {N_REQ} questions, {g(Q)} tokens each, needed either way", "sub2"))
    body, yb = prose(226, [
        f"Without reuse every request prefills its own copy of the system prompt: {N_REQ} × "
        f"({g(SYS)} + {g(Q)}) = {g(without)} tokens. With reuse the system prompt is prefilled once "
        f"and each request computes only its own {g(Q)}: {g(SYS)} + {N_REQ} × {g(Q)} = {g(with_)}.",
        f"Each request finds {g(SYS)} of its {g(SYS + Q)} tokens already cached, a {pc(hit_share, 0)} "
        f"hit, and its first token arrives that much sooner. On Llama 3 8B at the H100's peak "
        f"arithmetic, a {g(SYS + Q)}-token prefill takes at least {f(t_full * 1e3, 0)} ms; a "
        f"{g(Q)}-token one, {f(t_new * 1e3, 1)} ms.",
        "Decode is untouched: every output token still reads all the weights, cached prefix or not "
        "({{fig:v01-o055}}).",
    ])
    emit("b38", stamp(SRT, "A request arriving with that prefix"),
         f"Fifty requests behind one system prompt need {f(ratio, 0)} times less prefill", yb + 32,
         b + [body],
         "Drawn to scale. The saving grows with the number of requests behind the prefix, and it "
         "lands entirely on the time to the first token.")


if __name__ == "__main__":
    for fn in (o012, b36, b37, b38):
        fn()
