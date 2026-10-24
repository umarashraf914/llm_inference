"""V01 Part 2, what inference is: a request, the components, a batch, and what it all costs.

Regenerates o018 (sources restored), o020 (the system prompt and tool descriptions named), o031 (the
network against memory traffic, with the ratio corrected), o060 (all seven stages), and writes the
review's proposals 1-4: what a batch is, cost per token, how big frontier models are, and how new the
techniques are.

  python3 figures/V01/src/front.py
"""
import math
from common import (box, cont, cell, ghost, arr, ln, txt, hd, eq, prose, emit, st, f, g, sig,
                    N, W_BYTES)


# ---- o018: the commercial scale, with its sources -----------------------------------------------
def o018():
    b = [hd(40, 46, "Three numbers about the scale of serving models")]
    rows = [("Share of all AI compute, 2026", "about two thirds", "Deloitte's projection"),
            ("AI capital spending this year", "around $700 billion", "guidance, five largest US hyperscalers"),
            ("Tokens processed every day", "over 20 trillion", "OpenAI's API alone")]
    for k, (lab, val, src) in enumerate(rows):
        y = 70 + k * 48
        b.append(txt(40, y + 20, lab, "cap"))
        b.append(cell(250, y, 170, 30, "h", rx=4, label=val))
        b.append(txt(434, y + 20, src, "sub2"))
    y2 = 70 + 3 * 48 + 24
    body1, yb = prose(y2, [
        "Most of that spending goes on inference, not training. At this volume every architectural decision, "
        "from chip layout to memory hierarchy to scheduling policy, comes down to one number:"])
    b.append(body1)
    b.append(cell(220, yb + 22, 240, 36, "m", rx=6, label="cost per token"))
    body2, yb2 = prose(yb + 22 + 36 + 38, [
        "A token is the unit the model reads and writes ({{fig:v01-o006}}), so a cost per token is the price "
        "of every word a model produces. The next figure shows how it is worked out."])
    emit("o018", st("Deloitte projects"), "Why this matters commercially", yb2 + 26, b + [body2],
         "A projection and company guidance, so the exact figures are uncertain; the direction is not. "
         "Serving models, not training them, is where the compute and the money now go.")


# ---- p02: cost per token --------------------------------------------------------------------------
def p02():
    price, tps = 3.0, 100                        # an illustrative rental price and an illustrative rate
    per_hour = tps * 3600
    per_token = price / per_hour
    per_million = per_token * 1e6
    assert per_hour == 360_000 and round(per_million, 2) == 8.33
    b = [hd(40, 46, "An operator rents chips by the hour and sells what they produce, token by token")]
    y = 72
    b.append(eq(40, y, 170, "cost per token", "m"))
    b.append(txt(222, y + 26, "=", "hd"))
    b.append(eq(240, y, 170, "dollars per hour", "h"))
    b.append(txt(422, y + 26, "÷", "hd"))
    b.append(eq(440, y, 200, "tokens made per hour", "s"))
    y2 = y + 70
    b.append(txt(40, y2 + 26, "and", "sub2"))
    b.append(eq(80, y2, 200, "tokens made per hour", "s"))
    b.append(txt(292, y2 + 26, "=", "hd"))
    b.append(eq(310, y2, 170, "tokens per second", "s"))
    b.append(txt(492, y2 + 26, "×", "hd"))
    b.append(eq(510, y2, 130, "3,600", "u"))
    b.append(txt(575, y2 + 62, "seconds in an hour", "sub2", "middle"))
    y3 = y2 + 104
    b.append(hd(40, y3, "Worked with round numbers: a $3 hour, 100 tokens a second"))
    steps = [f"100 tokens a second × 3,600 = {g(per_hour)} tokens an hour",
             f"$3 ÷ {g(per_hour)} = ${per_token:.7f} per token",
             f"× 1,000,000 = ${f(per_million)} per million tokens, the unit prices are quoted in"]
    for k, s in enumerate(steps):
        b.append(txt(60, y3 + 30 + k * 26, s, "sub2"))
    body, yb = prose(y3 + 30 + 3 * 26 + 30, [
        "Only the bottom of the division is engineering. The hourly price is set by the market; how many "
        "tokens a chip makes in a second is what every technique in this series changes.",
        "The $3 is a typical rental for one high-end chip and the 100 tokens a second is a round number "
        "for illustration. Part 15 works the same division with rates derived for a real chip.",
    ])
    emit("p02", st("comes down to one number, cost per token"),
         "Cost per token is an hourly price divided by the tokens made in that hour", yb + 26,
         b + [body],
         "Halve the time a token takes and the cost per token halves with it. That is why a lecture about "
         "milliseconds is also a lecture about money.")


# ---- p03: how big frontier models are ------------------------------------------------------------
def p03():
    small, kimi, active = 70e9, 1e12, 32e9      # Kimi K2 README: 1T total, 32B activated
    ratio = kimi / small
    assert round(ratio, 1) == 14.3
    b = [hd(40, 46, "Parameter counts, drawn to scale")]
    X0, W = 230, 400                            # 1 trillion = 400 px
    sc = W / kimi
    rows = [("the model this atlas follows", small, "s", "70 billion"),
            ("Kimi K2, an open model", kimi, "h", "1 trillion")]
    for k, (lab, n, c, val) in enumerate(rows):
        y = 70 + k * 46
        b.append(txt(40, y + 20, lab, "cap"))
        w = round(n * sc, 1)
        b.append(cell(X0, y, w, 30, c, rx=3))
        if w > 120:
            b.append(txt(X0 + w / 2, y + 20, val, "sub", "middle").replace('class="sub"', 'class="sub"'))
        else:
            b.append(txt(X0 + w + 10, y + 20, val, "sub2"))
    yr = 70 + 2 * 46
    body, yb = prose(yr + 40, [
        f"The frontier systems in production today hold from the high hundreds of billions of parameters to "
        f"over a trillion. Kimi K2, an open model of this generation, holds one trillion: "
        f"{g(kimi / 1e9)} ÷ 70 = {f(ratio, 1)} times the model this atlas follows. DeepSeek V4 and the closed "
        "models from OpenAI, Anthropic and Google are the same kind of workload.",
        f"Kimi K2 is a mixture of experts: it uses only {g(active / 1e9)} billion of its parameters for each "
        "token, a design the sixth video in the series is about. Every one of its trillion parameters still "
        "has to be stored somewhere.",
        "This atlas follows a 70-billion-parameter model throughout, because every number about it can be "
        "worked by hand. The arithmetic scales with the parameter count.",
    ])
    emit("p03", st("in the high hundreds of billions"),
         "Frontier models carry up to fourteen times the parameters this atlas follows", yb + 26, b + [body],
         "The trillion is Kimi K2's own published figure. The captions spell the model Chimera 2, so a "
         "search of them for Kimi will fail.")


# ---- p04: how new the techniques are ---------------------------------------------------------------
EVENTS = [  # year as a fraction, label, where the series covers it; dates from the papers' first versions
    (1995.0, "the memory wall named", None),
    (2009.25, "the roofline model", None),
    (2017.45, "the transformer", None),
    (2022.40, "FlashAttention", "V3"),
    (2022.50, "iteration-level batching", "V7"),
    (2022.62, "8-bit and 4-bit weights", "V4"),
    (2022.92, "speculative decoding", "V8"),
    (2023.39, "grouped-query attention", "V3"),
    (2023.70, "PagedAttention", "V3"),
    (2024.05, "prefill and decode split apart", "V7"),
]


def p04():
    b = [hd(40, 46, "When the ideas in this series first appeared, on two timelines to scale")]
    X0, X1, Y0, Y1 = 60, 620, 1993, 2027
    xs = lambda y: round(X0 + (y - Y0) / (Y1 - Y0) * (X1 - X0), 1)
    ya = 150
    b.append(ln(X0, ya, X1, ya, "axis"))
    for y in range(1995, 2030, 5):
        b.append(ln(xs(y), ya, xs(y), ya + 5, "tick"))
        b.append(txt(xs(y), ya + 20, str(y), "sub2", "middle"))
    heights = [96, 116, 96]                      # staggered so the three labels never meet
    for (yr, lab, v), yy in zip(EVENTS[:3], heights):
        x = xs(yr)
        b.append(ln(x, yy + 6, x, ya - 4, "tick"))
        b.append(f'<circle cx="{x}" cy="{ya}" r="3.5" fill="var(--paper)" stroke="var(--h)" stroke-width="1.5"/>')
        if yr == 2009.25:                        # its right-hand label would cross 2017's leader
            b.append(txt(x - 6, yy, f"{lab}, {int(yr)}", "sub2", "end"))
        else:
            b.append(txt(x + 6, yy, f"{lab}, {int(yr)}", "sub2"))
    # the cluster of new work, marked on the long axis and enlarged on a second one
    x22, x245 = xs(2022), xs(2024.5)
    b.append(cell(x22, ya - 10, x245 - x22, 20, "m", rx=3))
    b.append(txt((x22 + x245) / 2, ya + 40, "2022 to 2024, enlarged below", "sub2", "middle"))
    Z0, Z1, yb_ = 60, 460, 360
    zx = lambda y: round(Z0 + (y - 2022) / 2.5 * (Z1 - Z0), 1)
    b.append(ln(Z0, yb_, Z1, yb_, "axis"))
    for y in (2022, 2023, 2024):
        b.append(ln(zx(y), yb_, zx(y), yb_ + 5, "tick"))
        b.append(txt(zx(y), yb_ + 20, str(y), "sub2", "middle"))
    new = EVENTS[3:]
    top = yb_ - 22 - 20 * (len(new) - 1)
    for k, (yr, lab, v) in enumerate(new):
        x, yy = zx(yr), top + 20 * k
        assert x + 6 + 6.2 * len(f"{lab} ({v})") < 640
        b.append(ln(x, yy + 4, x, yb_ - 4, "tick"))
        b.append(f'<circle cx="{x}" cy="{yb_}" r="3.5" fill="var(--paper)" stroke="var(--m)" stroke-width="1.5"/>')
        b.append(txt(x + 6, yy, f"{lab} ({v})", "sub2"))
    assert all(zx(a[0]) < zx(c[0]) for a, c in zip(new, new[1:]))   # labels step down left to right
    body, yb = prose(yb_ + 58, [
        "The memory wall was named in 1995 and the roofline model drawn in 2009, so the problem is old. The "
        "transformer, the design every model here uses, dates from 2017. Almost every technique that "
        "makes serving one affordable appeared between 2022 and 2024.",
        "Each date is the first public version of the paper that introduced the idea; the label in brackets "
        "is the video in this series that takes it apart.",
    ])
    emit("p04", st("requires a stack of techniques"),
         "Almost every technique in this series is less than five years old", yb + 26, b + [body],
         "The physics is decades old and the workload is recent. That combination is why the field "
         "changes so fast: the constraint is fixed, and people only recently had a reason to fight it.")


# ---- p01: what a batch is ---------------------------------------------------------------------------
def p01():
    b = [hd(40, 46, "Four users each need their next token")]
    users = "ABCD"
    b.append(txt(40, 92, "one at a time", "cap"))
    x = 170
    for k, u in enumerate(users):
        b.append(cell(x, 72, 104, 32, "u", rx=4, label=f"pass {k + 1}: user {u}"))
        x += 104 + 8
    b.append(txt(170, 124, "four passes, each running the whole model", "sub2"))
    b.append(txt(40, 186, "as a batch", "cap"))
    b.append(cont(170, 150, 440, 92, "m", "one pass through the model"))
    for k, u in enumerate(users):
        b.append(cell(192 + k * 102, 190, 90, 32, "s", rx=4, label=f"user {u}"))
    body, yb = prose(286, [
        "A pass means running the whole model once, which is what producing one token takes "
        "({{fig:v01-o007}}). Run separately, four users need four passes.",
        "Batched, the scheduler gathers the four users' inputs and sends them through the model together. "
        "One pass then produces the next token for each of them. A batch is several requests going through "
        "the model in a single pass, and the batch size is how many.",
        "Why that is worth doing is the subject of most of this atlas. The short answer is that the costly "
        "part of a pass is not the arithmetic, and a batch shares the costly part.",
    ])
    emit("p01", st("a scheduler batches them alongside"), "A batch is several requests going through the model in one pass",
         yb + 26, b + [body],
         "A batch is not a queue. The four requests are not served one after another but together, which is "
         "how a crowd of users becomes an advantage rather than a burden.")


# ---- o020: what one request contains ------------------------------------------------------------
def o020():
    b = [cont(40, 30, 600, 176, "u", "What arrives at the server, every turn")]
    parts = [("system prompt", 118, "u"), ("tool descriptions", 128, "u"),
             ("the conversation so far", 170, "s"), ("the new message", 110, "s")]
    x = 62
    for lab, w, c in parts:
        b.append(cell(x, 70, w, 32, c, rx=4, label=lab))
        x += w + 10
    assert x - 10 == 618
    b.append(txt(62 + (118 + 10 + 128) / 2, 122, "written by the operator", "sub2", "middle"))
    b.append(txt(62 + 256 + 10 + (170 + 10 + 110) / 2, 122, "written by the user, and the model's replies", "sub2", "middle"))
    b.append(cell(62, 144, 556, 32, "u", rx=4, label="settings: how long the answer may be, how random, when to stop"))
    body, yb = prose(246, [
        "The system prompt is the operator's standing instructions to the model: what it is for, what tone to "
        "take, what to refuse. The tool descriptions list the outside programs the model may ask to have run "
        "({{fig:v01-o024}}).",
        "Then comes the whole conversation so far, not just the new message. The model keeps nothing between "
        "requests, so anything it needs to know must arrive with the request.",
        "A long conversation therefore means a long input, every single turn. That fact returns in Part 11 as "
        "the reason one particular cost keeps growing.",
    ])
    emit("o020", "0:21", "What one request contains", yb + 26, b + [body],
         "The stateless part is the surprise. Each turn re-sends everything, which is why conversation "
         "length becomes a hardware problem rather than a bookkeeping one.")


# ---- o031: how little crosses the network --------------------------------------------------------
def o031():
    up, down, toks = 4e3, 22e3, 500             # typical sizes for one turn, in bytes
    mem = toks * W_BYTES                        # every token reads every weight once
    ratio = mem / (up + down)
    assert mem == 70e12 and round(ratio / 1e9, 1) == 2.7 and 9 < math.log10(ratio) < 9.5
    assert mem / ((up + down) * 10) > 1e8       # the caveat in the prose
    b = [hd(40, 46, "Bytes on the wire for one 500-token answer, drawn to scale")]
    sc = 360 / down
    rows = [("Up, once", up, "s", "about 4 KB: the whole prompt"),
            ("Down, as it answers", down, "s", "about 22 KB: 500 small messages"),
            ("Up, while it answers", 0, "u", "nothing at all")]
    for k, (lab, v, c, note) in enumerate(rows):
        y = 70 + k * 46
        b.append(txt(40, y + 20, lab, "cap"))
        w = round(max(v * sc, 2), 1)
        if w > 200:
            b.append(cell(200, y, w, 30, c, rx=3, label=note))
        else:
            b.append(cell(200, y, w, 30, c, rx=3))
            b.append(txt(200 + w + 10, y + 20, note, "sub2"))
    body, yb = prose(232, [
        "A byte is the space one character of plain text takes in a computer ({{fig:v01-o073}} builds it "
        "from bits), and a kilobyte, KB, is a thousand bytes. A whole turn crosses the network in a few tens "
        "of kilobytes.",
        f"Inside the machine the same answer reads the model's weights once per token. The weights take 140 "
        f"billion bytes, so 500 tokens read 70 million million bytes, 70 terabytes: about "
        f"{f(ratio / 1e9, 1)} billion times the 26 KB that crossed the network.",
        "Message sizes depend on the format, so treat the kilobytes as typical rather than measured. At ten "
        "times these sizes the gap would still be hundreds of millions to one.",
    ])
    emit("o031", "0:21", "How little actually crosses the network", yb + 26, b + [body],
         f"About {f(ratio / 1e9, 1)} billion to one, more than nine powers of ten. The slowness a user feels "
         "has nothing to do with the connection, and blaming the network for a slow answer is almost always "
         "wrong.")


# ---- o060: the route the series takes ------------------------------------------------------------
def o060():
    stages = [("router", "picks which machine handles the request"),
              ("scheduler", "batches it with others"),
              ("prefill cluster", "machines that read the whole prompt"),
              ("KV transfer", "hands their results to other machines"),
              ("decode cluster", "machines that write the answer, a token at a time"),
              ("multi-token loop", "making several tokens per pass"),
              ("the user's screen", "where each token appears")]
    b = [hd(40, 46, "One token, end to end, from pressing enter to the screen")]
    for k, (name, what) in enumerate(stages):
        y = 66 + k * 44
        b.append(cell(60, y, 160, 30, "s", rx=4, label=name))
        b.append(txt(236, y + 20, what, "sub2"))
        if k:
            b.append(arr(140, y - 13, 140, y - 1))
    yl = 66 + 7 * 44
    body, yb = prose(yl + 30, [
        "The series traces exactly this path. Each stage gets its own engineering problem and its own answer, "
        "and every term above, prefill, decode and KV included, is built from scratch before it is used.",
        "This atlas covers the ground underneath all of them: where the 30 milliseconds of a token actually "
        "go.",
    ])
    emit("o060", st("We'll trace a single token end to end"), "The route this series takes", yb + 26,
         b + [body],
         "Worth returning to. Most of what follows in later videos is an optimisation of one of these seven "
         "stages.")


if __name__ == "__main__":
    for fn in (o018, p02, p03, p04, p01, o020, o031, o060):
        fn()
