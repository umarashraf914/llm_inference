"""V8 Part 10b, agents and money: review §4 M5-M9; fixes P2 (Fig 29's heading), P20 (episode 7 links),
names (Manus, NVIDIA, Perplexity, Llama 3.3 70B, Llama 2 70B, H200).

Manus figures are from the Manus team's post "Context Engineering for AI Agents" (hit rate the single
most important metric; about 100:1 input to output; cached input a tenth of the price; a timestamp at the
top of the prompt kills the hit rate). The two cost runs and the price range are as the video gives them.

  b27   hit rate, measured on an agent's growing prompt          (M5)
  o028  at a 90% hit rate, 100 reads cost 19                      (P20, names)
  b28   cost per million tokens, built with units                 (M6)
  o029  the two measured runs, one machine full and one not       (P2, names)
  b29   cheaper per token, slower per user                        (M7)
  b30   what you pay varies 2-3 times; what you get, 15           (M8)
  b31   a late token is paid for and cannot be sold               (M9)

  python3 figures/V08/src/b_cost.py
"""
from b_lib import (box, cell, ghost, txt, hd, ln, arr, prose, emit, stamp, f, n0, pct, text)

RENT = 3.0                                   # $ per GPU-hour, H100
NV_TPS, PX_TPS, PX_GPUS, PX_REQ = 51, 767, 2, 128
per_m = lambda tps: RENT / (tps * 3600) * 1e6
NV_COST, PX_COST = per_m(NV_TPS), per_m(PX_TPS)
assert NV_TPS * 3600 == 183_600 and round(NV_COST, 2) == 16.34
assert round(PX_TPS * 3600 / 1e6, 2) == 2.76 and round(PX_COST, 2) == 1.09
assert round(NV_COST / PX_COST, 1) == 15.0 and round(PX_TPS / NV_TPS, 1) == 15.0


# ---- b27: hit rate on an agent's growing prompt ----------------------------------------------------------
STEPS, BASE_P, ACTION, REPLY = 20, 2000, 100, 900
PROMPT = [BASE_P + (ACTION + REPLY) * k for k in range(STEPS)]
CACHED = [0] + [PROMPT[k - 1] + ACTION for k in range(1, STEPS)]
NEW = [p - c for p, c in zip(PROMPT, CACHED)]
HIT = sum(CACHED) / sum(PROMPT)
RATIO = sum(PROMPT) / (STEPS * ACTION)
assert sum(PROMPT) == 230_000 and sum(CACHED) == 210_900 and NEW[1:] == [REPLY] * (STEPS - 1)
assert round(HIT, 3) == 0.917 and round(RATIO) == 115


def b27():
    b = [hd(40, 46, f"An agent's prompt over {STEPS} steps (illustrative): each step resends everything before it")]
    X0, P, BW, BASE = 110, 26, 18, 250
    SC = 180 / PROMPT[-1]
    for k in range(STEPS):
        x = X0 + k * P
        hc, hn = CACHED[k] * SC, NEW[k] * SC
        if hc:
            b.append(cell(x, BASE - hc, BW, hc, "s", rx=1))
        b.append(cell(x, BASE - hc - hn, BW, hn, "h", rx=1))
        if k in (0, 4, 9, 14, 19):
            b.append(txt(x + BW / 2, BASE + 16, str(k + 1), "sub2", "middle"))
    b.append(ln(X0 - 4, BASE, X0 + STEPS * P, BASE, "axis"))
    b.append(txt(40, BASE + 16, "step", "cap"))
    b.append(txt(40, BASE - 180, f"{n0(PROMPT[-1])}", "sub2"))
    b.append(txt(40, BASE - 164, "tokens in", "sub2"))
    lx = X0
    b.append(cell(lx, BASE + 34, 12, 12, "s", rx=1))
    b.append(txt(lx + 18, BASE + 44, "already in the cache: earlier prompt and the model's last action", "sub2"))
    b.append(cell(lx, BASE + 54, 12, 12, "h", rx=1))
    b.append(txt(lx + 18, BASE + 64, f"new: the tool's reply, {REPLY} tokens (the whole {n0(BASE_P)}-token start, at step 1)", "sub2"))
    body, yb = prose(BASE + 110, [
        "Agents work differently: they run the model over and over, feeding the whole history back in "
        "each time. Each step's prompt is the previous one plus what happened since, the model's last "
        "action and the tool's reply, so its front is a prefix the server has already seen and can serve "
        "from the cache ({{fig:v07-o013}}).",
        f"The hit rate is the share of input tokens served from the cache. Over these {STEPS} steps, "
        f"{n0(sum(CACHED))} of {n0(sum(PROMPT))} input tokens were already cached: {pct(HIT, 0)}. The agent "
        f"also read {round(RATIO)} tokens for every token it wrote.",
    ])
    emit("b27", stamp("agents work differently"),
         "Hit rate is the share of an agent's input already in the cache", yb + 30, b + [body],
         "The hit rate climbs as the history grows, because each step adds a little to a lot. Anything that "
         "edits the front, such as a timestamp at the top of the system prompt, sends it back to zero.")


# ---- o028: what the hit rate is worth -------------------------------------------------------------------------
READS, HITR, CACHED_PRICE, WRITE_PRICE = 100, 0.9, 0.1, 1.25
COST90 = READS * HITR * CACHED_PRICE + READS * (1 - HITR) * 1
COST90W = READS * HITR * CACHED_PRICE + READS * (1 - HITR) * WRITE_PRICE
assert round(COST90, 6) == 19 and round(COST90W, 6) == 21.5


def o028():
    SC = 400 / READS
    b = [hd(40, 46, "100 tokens of history, priced in uncached reads, drawn to scale")]
    rows = [("0% hit rate", READS, "h", "100 uncached reads"),
            ("90% hit rate", COST90, "s", "90 × 0.1 + 10 × 1 = 19"),
            ("90%, misses written", COST90W, "s", "90 × 0.1 + 10 × 1.25 = 21.5")]
    for k, (lab, v, c, note) in enumerate(rows):
        y = 70 + k * 44
        b.append(txt(40, y + 19, lab, "cap"))
        w = v * SC
        if w > 200:
            b.append(cell(200, y, w, 28, c, label=note))
        else:
            b.append(cell(200, y, w, 28, c))
            b.append(txt(200 + w + 10, y + 19, note, "sub2"))
    body, yb = prose(234, [
        "The Manus team said the KV-cache hit rate is the single most important metric for a production "
        "agent, because it affects both latency and cost. In Manus an agent reads about 100 tokens of "
        "history for every token it generates.",
        "Episode 7 priced a cached read at a tenth of an uncached one ({{fig:v07-o014}}). So at a 90% "
        "hit rate those 100 reads come out at 19. If each miss is also written to the cache at 1.25 times "
        "the normal price, as on the same price list, it is 21.5: still under a quarter.",
    ])
    emit("o028", stamp("An agent reads about 100 tokens"),
         "At a 90% hit rate, 100 tokens of history cost what 19 would", yb + 30, b + [body],
         "A five-fold cost difference from one cache statistic, on a workload that is almost all replayed "
         "history.")


# ---- b28: the cost formula ------------------------------------------------------------------------------------------
def b28():
    per_hour = NV_TPS * 3600
    per_tok = RENT / per_hour
    b = [hd(40, 46, "$ per million tokens = ($ per hour) ÷ (tokens per hour) × 1,000,000")]
    steps = [("tokens per hour", f"{NV_TPS} tokens/s × 3,600 s/h", f"= {n0(per_hour)} tokens/h"),
             ("$ per token", f"$3 /h ÷ {n0(per_hour)} tokens/h", f"= ${per_tok:.7f} per token"),
             ("$ per million", f"${per_tok:.7f} × 1,000,000", f"= ${f(NV_COST)} per million tokens")]
    for k, (lab, expr, res) in enumerate(steps):
        y = 70 + k * 52
        b.append(txt(40, y + 21, lab, "cap"))
        b.append(cell(170, y, 230, 32, "u", rx=6, label=expr))
        b.append(cell(414, y, 226, 32, "h" if k == 2 else "u", rx=6, label=res))
    b.append(txt(170, 238, "the hours cancel: ($/h) ÷ (tokens/h) = $ per token", "sub2"))
    body, yb = prose(282, [
        "None of the latency numbers says anything about money. That comes from dividing what the machine "
        "costs by what it actually produced: the cost of a million tokens is what you rent the GPU for in "
        "an hour, divided by the tokens it produced in that hour.",
        f"Renting an H100 runs about $3 an hour, though across providers that spans anywhere from $1.50 "
        f"to $8. At the low end of utilisation, NVIDIA measured Llama 3.3 70B on a single H200 serving one "
        f"request at a time at {NV_TPS} output tokens a second over an hour: {n0(per_hour)} tokens, about "
        f"184,000. At $3 an hour that is ${f(NV_COST)} per million tokens.",
    ])
    emit("b28", stamp("The cost of a million tokens is what you rent"),
         "Cost per million tokens is an hourly price over an hourly output", yb + 30, b + [body],
         "Every technique in this series works on the denominator. The rent is a fixed number; the tokens "
         "per hour are what engineering changes.")


# ---- o029: the two runs ------------------------------------------------------------------------------------------------
def o029():
    SC = 400 / NV_COST
    b = [hd(40, 46, "Cost per million tokens at the same hourly rate, $3, and the same model size")]
    rows = [("NVIDIA: one H200,", "one request at a time", NV_COST, "h",
             f"${f(NV_COST)}: {NV_TPS} tokens a second"),
            ("Perplexity: two H100s,", "128 requests at once", PX_COST, "m",
             f"${f(PX_COST)}: {PX_TPS} tokens a second per GPU")]
    for k, (a, c, v, cls, note) in enumerate(rows):
        y = 72 + k * 60
        b.append(txt(40, y + 12, a, "cap"))
        b.append(txt(40, y + 30, c, "cap"))
        w = v * SC
        if w > 260:
            b.append(cell(210, y, w, 32, cls, label=note))
        else:
            b.append(cell(210, y, w, 32, cls))
            b.append(txt(210 + w + 10, y + 21, note, "sub2"))
    body, yb = prose(222, [
        f"Filling the machine changes that number completely. Perplexity measured Llama 2 70B on two H100s "
        f"running {PX_REQ} requests at once: {PX_TPS} output tokens a second per GPU, "
        f"{f(PX_TPS * 3600 / 1e6, 2)} million an hour. The same $3 an hour now buys a million tokens for "
        f"about ${f(PX_COST)}: $16 against one, roughly {round(NV_COST / PX_COST)} times apart.",
        "The chips differ, but in the wrong direction to explain it: the single-request run had the H200, "
        "with 43% more memory bandwidth than an H100 ({{fig:v02-o071}}). What changed is how many requests "
        "were sharing each read of the weights.",
        "Those two measurements come from different machines and different prompt lengths, and both are "
        "vendor best cases, so the dollar figures are illustrative.",
    ])
    assert round(4.8 / 3.35 - 1, 2) == 0.43
    emit("o029", stamp("Perplexity measured"),
         "One request at a time costs fifteen times more per token than 128 at once", yb + 30, b + [body],
         "The ratio is the part that holds. It is set by how full the machine is, not by which machine it is.")


# ---- b29: the price to the user ------------------------------------------------------------------------------------------
def b29():
    shared = PX_TPS * PX_GPUS / PX_REQ
    assert round(shared, 1) == 12.0 and round(1000 / shared, 1) == 83.4 and round(1000 / NV_TPS, 1) == 19.6
    SC = 400 / NV_TPS
    b = [hd(40, 46, "Output speed one user sees in each run, drawn to scale")]
    rows = [("alone on an H200", NV_TPS, "u", f"{NV_TPS} tokens a second: one every {f(1000 / NV_TPS, 1)} ms"),
            ("one of 128 sharing", shared, "h", f"{f(shared, 1)} a second: one every {f(1000 / shared, 1)} ms")]
    for k, (lab, v, cls, note) in enumerate(rows):
        y = 72 + k * 46
        b.append(txt(40, y + 19, lab, "cap"))
        w = v * SC
        if w > 300:
            b.append(cell(200, y, w, 28, cls, label=note))
        else:
            b.append(cell(200, y, w, 28, cls))
            b.append(txt(200 + w + 10, y + 19, note, "sub2"))
    body, yb = prose(196, [
        f"Perplexity's two GPUs produced {n0(PX_TPS * PX_GPUS)} tokens a second between them, shared by "
        f"{PX_REQ} requests: {f(shared, 1)} tokens a second for each, one every {f(1000 / shared)} ms. "
        f"NVIDIA's single request got all {NV_TPS}, one every {f(1000 / NV_TPS, 1)} ms.",
        "That is the latency and throughput trade of episode 1 ({{fig:v01-o142}}): filling the machine "
        "buys throughput with each user's time per output token. Different machines and prompt lengths "
        "again, so read the direction, not the exact ratio.",
    ])
    emit("b29", stamp("Nothing about the chip changed"), "Cheaper per token, slower per user", yb + 30,
         b + [body],
         "The fifteen-fold saving is paid for in TPOT. Whether that is acceptable depends on the latency the "
         "service has promised.")


# ---- b30: which decision matters ---------------------------------------------------------------------------------------------
def b30():
    lo, hi = 1.5, 8.0
    ext = hi / lo
    out = PX_TPS / NV_TPS
    assert round(ext, 1) == 5.3 and round(out, 1) == 15.0
    SC = 420 / 16
    b = [hd(40, 46, "Best against worst, as a ratio, drawn to one scale")]
    y = 72
    b.append(txt(40, y + 12, "price of a GPU hour,", "cap"))
    b.append(txt(40, y + 30, "comparable providers", "cap"))
    b.append(cell(200, y + 2, 2 * SC, 28, "u"))
    b.append(ghost(200 + 2 * SC, y + 2, SC, 28))
    b.append(txt(200 + 3 * SC + 10, y + 21, "2 to 3 ×", "sub2"))
    y += 58
    b.append(txt(40, y + 12, "price of a GPU hour,", "cap"))
    b.append(txt(40, y + 30, "cheapest to dearest", "cap"))
    b.append(cell(200, y + 2, ext * SC, 28, "u"))
    b.append(txt(200 + ext * SC + 10, y + 21, f"$8 ÷ $1.50 = {f(ext, 1)} ×", "sub2"))
    y += 58
    b.append(txt(40, y + 12, "tokens out of the hour,", "cap"))
    b.append(txt(40, y + 30, "the two runs", "cap"))
    b.append(cell(200, y + 2, out * SC, 28, "m", label=f"{PX_TPS} ÷ {NV_TPS} = {f(out, 1)} ×"))
    body, yb = prose(y + 76, [
        "It also settles which decision matters. What you pay per GPU hour varies by two or three times "
        "between comparable providers, and about five times between the cheapest and dearest quoted. What "
        "you get out of that hour varies by more than ten: fifteen in the two runs above.",
        "Choosing a cheaper chip is the small optimisation. Keeping the one you have full is the large "
        "one, and it is what batching, paging, prefix caching and the rest of this series are for.",
    ])
    emit("b30", stamp("What you pay per GPU hour varies"),
         "What you pay varies two or three times; what you get varies fifteen", yb + 30, b + [body],
         "The denominator dominates. A provider's price list is the smaller of the two numbers in the "
         "division.")


# ---- b31: goodput ---------------------------------------------------------------------------------------------------------------
LAT = [0.3 + 0.9 * (i / 99) ** 2.5 for i in range(100)]
DEADLINE = (LAT[89] + LAT[90]) / 2
LATE = sum(v > DEADLINE for v in LAT)
assert LATE == 10 and round(1 / 0.9, 2) == 1.11


def b31():
    X0, P, BW, BASE, SC = 60, 5.4, 4.0, 210, 120 / max(LAT)
    b = [hd(40, 46, "100 requests sorted by how long they took (illustrative), against their deadline")]
    for i, v in enumerate(LAT):
        h = v * SC
        b.append(cell(X0 + i * P, BASE - h, BW, h, "h" if v > DEADLINE else "u", rx=1))
    b.append(ln(X0, BASE, X0 + 100 * P, BASE, "axis"))
    yd = BASE - DEADLINE * SC
    b.append(f'<line class="mark xok" x1="{X0}" y1="{yd:.1f}" x2="{X0 + 100 * P + 4:.1f}" y2="{yd:.1f}"/>')
    b.append(txt(X0 + 100 * P + 10, yd + 4, "deadline", "sub2"))
    b.append(txt(X0 + 89 * P, BASE + 18, f"the last {LATE}: late", "sub2", "middle"))
    body, yb = prose(BASE + 60, [
        "The denominator needs one correction. A token generated after its deadline has already used the "
        "compute, and it cannot be sold. So the tokens that count are the ones delivered inside their "
        "latency targets: that is goodput ({{fig:v01-o145}}), which episode 7 counted per GPU "
        "({{fig:v07-o016}}).",
        f"If one request in ten misses its deadline, every good token carries the cost of 1 ÷ 0.9 = "
        f"{f(1 / 0.9)} tokens: an 11% surcharge before anyone has complained. Goodput per dollar is what "
        "the whole stack is arranged around.",
    ])
    emit("b31", stamp("A token generated after its deadline"),
         "A late token is paid for and cannot be sold", yb + 30, b + [body],
         "Throughput per dollar flatters a system that answers late. Goodput per dollar cannot be raised by "
         "working hard on requests nobody is still waiting for.")


if __name__ == "__main__":
    for fn in (b27, o028, b28, o029, b29, b30, b31):
        fn()
