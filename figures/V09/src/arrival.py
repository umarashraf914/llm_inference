"""V9 Part 4, arrival at the gateway (stop 1): Fig 6 retitled as a claim, N8 (the prefix table), N9
(prefill runs only on the unseen tokens), N10 (why prefill and decode are split).
plans/depth_pass/V09_review.md §4 D and §5 Fig 6.

  python3 figures/V09/src/arrival.py    writes items o006 n08 n09 n10

The prompt's token counts are Fig 1's illustrative ones (request.PROMPT): 4,000 tokens, of which the
newest question is the last 100.
"""
import math
from common import SRT, box, cell, ghost, txt, hd, ln, para, stamp, emit, width, f, n
from request import PROMPT, TOTAL

PRE = PROMPT[0][1]                         # the shared system prompt and tools
NEW = PROMPT[-1][1]                        # the newest question
SEEN = TOTAL - NEW                         # everything machine B already holds
ACTIVE = 30e9                              # parameters active per token (Fig 10)
RIDGE, OFFER = 1250, 4
assert (PRE, NEW, SEEN) == (1500, 100, 3900) and NEW / TOTAL == 0.025
OPS_FULL, OPS_NEW = 2 * ACTIVE * TOTAL, 2 * ACTIVE * NEW
assert OPS_FULL == 2.4e14 and OPS_NEW == 6e12 and OPS_FULL - OPS_NEW == 2.34e14


def o006():
    b = [hd(40, 46, "An ordinary load balancer, with one difference")]
    b.append(box(40, 66, 286, 78, "u", "Normally it picks by", "taking turns, or whichever", "machine is least busy"))
    b.append(box(354, 66, 286, 78, "s", "This one picks by", "what each machine already", "holds in memory"))
    body, yb = para(190, [
        "A load balancer is a program that sits in front of many identical servers and hands each "
        "incoming request to one of them. The usual rules are simple: take turns, or pick the machine "
        "with the fewest requests in flight. Either spreads the work evenly.",
        "Either would also waste this request. Each machine keeps the key-value cache for the openings of "
        "prompts it has already read, their prefixes. A machine picked by turns holds the shared system "
        f"prompt, as every machine does, but is unlikely to hold this conversation, so it would compute the other "
        f"{n(TOTAL - PRE)} tokens of the prompt again. This gateway instead picks by what each machine "
        "already holds, and the next three figures show what that buys.",
    ])
    emit("o006", stamp(SRT, "The request reaches the gateway,"),
         "The gateway sends the request to whoever already holds its prefix", yb + 30, b + [body],
         "Prefix caching and cache-aware routing, arriving together. The saving happens before any "
         "arithmetic is done at all.")


def n08():
    b = [hd(40, 46, "The gateway's table: what each machine holds, compared from token 0")]
    X0, X1 = 150, 540
    sc = (X1 - X0) / TOTAL
    y = 70
    b.append(txt(40, y + 17, "this request", "cap"))
    b.append(cell(X0, y, PRE * sc, 24, "s", label="system prompt"))
    b.append(cell(X0 + PRE * sc, y, (SEEN - PRE) * sc, 24, "s", label="this conversation"))
    b.append(cell(X0 + SEEN * sc, y, NEW * sc, 24, "h"))
    b.append(txt(X1 + 10, y + 17, "100 new", "sub2"))
    rows = [("machine A", [(0, PRE, "s", "system prompt")], PRE),
            ("machine B", [(0, PRE, "s", "system prompt"), (PRE, SEEN, "s", "this conversation")], SEEN),
            ("machine C", [(0, PRE, "s", "system prompt"), (PRE, 3200, "u", "another conversation")], PRE),
            ("machine D", [], 0)]
    yt = y + 50
    b.append(txt(X1 + 24, yt - 10, "matched", "sub2"))
    best = max(rows, key=lambda r: r[2])
    assert best[0] == "machine B" and best[2] == SEEN
    for k, (name, segs, match) in enumerate(rows):
        yy = yt + k * 34
        b.append(txt(40, yy + 17, name, "cap"))
        if not segs:
            b.append(ghost(X0, yy, X1 - X0, 24, label="nothing yet: it has just started"))
        for a, z, c, lab in segs:
            b.append(cell(X0 + a * sc, yy, (z - a) * sc, 24, c, label=lab))
        b.append(txt(X1 + 24, yy + 17, n(match), "sub2"))
    yB = yt + 34 + 12
    b.append(f'<line class="conn" x1="{X1 + 64}" y1="{yB}" x2="{X1 + 82}" y2="{yB}" marker-end="url(#arw)"/>')
    b.append(txt(X1 + 88, yB + 4, "B", "hd"))
    yl = yt + 4 * 34 + 8
    b.append(txt(X0, yl + 6, "a match runs from token 0 and stops at the first token that differs", "sub2"))
    body, yb = para(yl + 52, [
        "The gateway keeps a table of which machine holds which prefix, a run of tokens from the very "
        "start of some earlier prompt, kept up to date as caches fill and empty. Keeping that table across "
        "a fleet is the orchestration layer's job ({{fig:v07-o015}}).",
        "To route, it compares this request with each machine's prefixes from token 0 and stops at the "
        "first token that differs ({{fig:v01-o044}}). Every machine holds the shared system prompt, because "
        "every user sends it ({{fig:v01-o026}}). Only machine B also holds this conversation: it prefilled "
        "the earlier turns a minute ago, when the user asked the previous question.",
        "B still has them because its engine keeps a finished request's cache in a tree of prefixes and "
        "evicts the least recently used only when memory runs short ({{fig:v07-o013}}).",
    ])
    emit("n08", stamp(SRT, "Most of this prompt is a prefix some"),
         "The gateway looks the prompt up in a table of which machine holds which prefix", yb + 30,
         b + [body],
         "The longest match wins, and the conversation decides it, since the shared preamble is "
         "everywhere. Schematic table; the token counts are Fig 1's, drawn to scale.")


def n09():
    b = [hd(40, 46, "The 4,000-token prompt on machine B, and the part prefill still has to compute")]
    X0, X1 = 210, 630
    sc = (X1 - X0) / TOTAL
    b.append(txt(40, 87, "the prompt", "cap"))
    b.append(cell(X0, 70, SEEN * sc, 26, "s", label=f"{n(SEEN)} tokens already in B's cache"))
    b.append(cell(X0 + SEEN * sc, 70, NEW * sc, 26, "h"))
    b.append(txt(40, 141, "prefilled now", "cap"))
    b.append(ghost(X0, 124, X1 - X0, 26))
    b.append(cell(X0 + SEEN * sc, 124, NEW * sc, 26, "h"))
    b.append(txt(X0 + SEEN * sc - 10, 141, f"{n(NEW)} new tokens, {f(100 * NEW / TOTAL, 1)}% of the prompt", "sub2", "end"))
    ya = 168
    b.append(ln(X0, ya, X1, ya, "axis"))
    for v in range(0, TOTAL + 1, 1000):
        b.append(ln(X0 + v * sc, ya, X0 + v * sc, ya + 4, "tick"))
        b.append(txt(X0 + v * sc, ya + 18, n(v), "sub2", "middle"))
    b.append(txt(X0, ya + 38, "position in the prompt, in tokens", "sub2"))
    b.append(hd(40, ya + 84, "Arithmetic for the weights, at 2 operations per active parameter per token"))
    rows = [("whole prompt", OPS_FULL, f"2 × 30 billion × {n(TOTAL)} = {f(OPS_FULL / 1e12, 0)} trillion"),
            ("new tokens only", OPS_NEW, f"2 × 30 billion × {n(NEW)} = {f(OPS_NEW / 1e12, 0)} trillion")]
    osc = (X1 - X0) / OPS_FULL
    for k, (lab, v, s_) in enumerate(rows):
        yy = ya + 102 + k * 34
        b.append(txt(40, yy + 17, lab, "cap"))
        w = v * osc
        if width(s_, "sub") + 24 <= w:
            b.append(cell(X0, yy, w, 26, "u", label=s_))
        else:
            b.append(cell(X0, yy, max(w, 2), 26, "h"))
            b.append(txt(X0 + w + 10, yy + 18, s_, "sub2"))
    body, yb = para(ya + 102 + 2 * 34 + 44, [
        "Machine B holds the keys and values for the first 3,900 tokens, so prefill starts partway "
        "through the prompt, at the first token B has not seen. Only the newest question goes through the "
        "model: 100 tokens, 2.5% of the prompt.",
        "Each token costs about two operations per active parameter ({{fig:v01-o114}}), so skipping 3,900 "
        f"tokens skips about {f((OPS_FULL - OPS_NEW) / 1e12, 0)} trillion operations. The new tokens still "
        "attend to all 4,000 positions, reading the cached keys and values for the first 3,900 "
        "({{fig:v01-o136}}).",
        "A cache hit shortens prefill and nothing else. Every token of the answer still costs a full "
        "decode step, so the saving shows up only in the wait for the first token ({{fig:v01-o055}}).",
    ])
    emit("n09", stamp(SRT, "So, prefill starts partway through the"),
         "Prefill runs only on the part of the prompt no machine has seen", yb + 30, b + [body],
         "Bars to scale, token counts illustrative. Forty to one is the order of saving a follow-up "
         "question gets, and it is paid for entirely with memory the cache already held.")


def n10():
    b = [hd(40, 46, "Operations per byte of weights read, on a log scale")]
    X0, X1, LO, HI = 236, 630, 1, 1e5
    px = lambda v: X0 + math.log10(v / LO) / math.log10(HI / LO) * (X1 - X0)
    rows = [("prefill, 4,000 tokens", OFFER * TOTAL, "m"), ("prefill, 100 new tokens", OFFER * NEW, "u"),
            ("decode, one token", OFFER * 1, "h")]
    xr = px(RIDGE)
    b.append(f'<line class="mark" x1="{xr:.1f}" y1="62" x2="{xr:.1f}" y2="{70 + 3 * 40 - 8}"/>')   # behind the bars
    y = 70
    for lab, v, c in rows:
        b.append(txt(40, y + 18, lab, "cap"))
        w = px(v) - X0
        rel = f"{f(v / RIDGE, 1)}× above the ridge" if v > RIDGE else f"{f(RIDGE / v, 1)}× below the ridge"
        s_ = f"{n(v)}: {rel}"
        if width(s_, "sub") + 24 <= w:
            b.append(cell(X0, y, w, 26, c, label=s_))
        else:
            b.append(cell(X0, y, max(w, 2), 26, c))
            assert X0 + w + 10 + width(s_, "sub2") < xr - 6
            b.append(txt(X0 + w + 10, y + 18, s_, "sub2"))
        y += 40
    ya = y + 2
    b.append(ln(X0, ya, X1, ya, "axis"))
    for e in range(0, 6):
        b.append(ln(px(10 ** e), ya, px(10 ** e), ya + 4, "tick"))
        b.append(txt(px(10 ** e), ya + 18, n(10 ** e), "sub2", "middle"))
    b.append(txt(xr, ya + 38, "the ridge, 1,250", "sub2", "middle"))
    assert OFFER * TOTAL / RIDGE == 12.8 and RIDGE / OFFER == 312.5 and OFFER * TOTAL / OFFER == 4000
    body, yb = para(ya + 82, [
        "Prefill multiplies every weight it reads against every new token at once, so each byte does 4 "
        "operations per token: 16,000 for a 4,000-token prompt, far above the ridge. Decode multiplies "
        "each weight against a single token, 4 operations, far below it ({{fig:v01-o129}}).",
        "One machine has to compromise between the two. Its hardware and its way of splitting the model "
        "suit one phase, and a long prefill mixed into a decode batch holds up everyone's next token "
        "({{fig:v07-o008}}). So the work is split into separate pools, which is called disaggregation "
        "({{fig:v07-o010}}), and the price is moving the cache from one pool to the other (Part 6).",
        "With its prefix cached, this request brings only 100 new tokens: 400 operations per byte, below "
        "the ridge on its own. A prefill machine fills each pass with new tokens from several requests, "
        "so that together they clear it.",
    ])
    emit("n10", stamp(SRT, "The machine that takes the request does"),
         "Prefill and decode are split because they sit on opposite sides of the ridge", yb + 30,
         b + [body],
         "Log scale. The two phases ask four thousand times as much of a byte in one case as in the "
         "other, and no single setting of one machine suits both.")


if __name__ == "__main__":
    for fn in (o006, n08, n09, n10):
        fn()
