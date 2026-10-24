"""V8 Part 10a, measuring latency: review §4 M1-M4; fixes P1 (Figs 25-26 from one array), P15 (fleet
sizing split out), P19 ("Queue weight" is queue wait; batch fullness), P20 (episode 1 link), and the
cramped label of old Fig 27 (its boxes are replaced by a timeline).

NVIDIA's definition of utilisation is from the nvidia-smi documentation: "Percent of time over the past
sample period during which one or more kernels was executing on the GPU."

  b24   where TTFT and TPOT sit on one request's timeline            (M1)
  o025  a percentile is a position in the sorted list                (P1)
  o026  the same hundred requests, four summaries, one scale         (P1, P15)
  b25   size the fleet for the busiest minutes                       (M2)
  o027  utilisation reads 100% while the arithmetic is 0.3% busy      (M3 merged in)
  b26   queue wait climbs long before throughput stops rising        (M4, P19)

  python3 figures/V08/src/b_latency.py
"""
import math, random
from b_lib import (box, cell, ghost, txt, hd, ln, arr, prose, emit, stamp, f, n0, pct, text,
                   PARAMS, WEIGHT_BYTES, H100_BW, H100_PEAK)

T_DECODE = WEIGHT_BYTES / H100_BW                     # 41.8 ms a token at batch one
T_MATH = 2 * PARAMS / H100_PEAK                       # 0.142 ms of arithmetic per token
assert round(T_DECODE * 1e3, 1) == 41.8 and round(T_MATH * 1e3, 3) == 0.142


# ---- b24: one request's timeline ----------------------------------------------------------------------
def b24():
    prompt, queue, answer = 2000, 0.40, 500
    t_pre = 2 * PARAMS * prompt / H100_PEAK
    ttft = queue + t_pre
    assert round(t_pre, 2) == 0.28 and round(ttft, 2) == 0.68 and round(answer * T_DECODE, 1) == 20.9
    X0, SC = 140, 440                                   # px per second
    steps = 9
    b = [hd(40, 46, f"One request: the 70B model, a {n0(prompt)}-token prompt, an illustrative queue wait")]
    y = 92
    b.append(txt(40, y + 18, "the request", "cap"))
    xq, xp = X0, X0 + queue * SC
    b.append(cell(xq, y, queue * SC, 28, "h", label=f"queue wait {f(queue)} s"))
    b.append(cell(xp, y, t_pre * SC, 28, "m", label=f"prefill {f(t_pre)} s"))
    x = xp + t_pre * SC
    for k in range(steps):
        b.append(cell(x + 1, y, T_DECODE * SC - 2, 28, "u", rx=2))
        x += T_DECODE * SC
    b.append(txt(x + 8, y + 18, "…", "sub2"))
    b.append(txt(X0, y - 12, "arrives", "sub2"))
    b.append(txt(xp + t_pre * SC, y - 12, "first token", "sub2"))
    # braces
    def brace(x1, x2, yy, lab):
        return [ln(x1, yy, x2, yy, "tick"), ln(x1, yy - 5, x1, yy, "tick"), ln(x2, yy - 5, x2, yy, "tick"),
                txt((x1 + x2) / 2, yy + 18, lab, "sub2", "middle")]
    b += brace(xq, xp + t_pre * SC, y + 46, f"time to first token, TTFT = {f(ttft)} s")
    x0d = xp + t_pre * SC
    b += brace(x0d + 1, x0d + T_DECODE * SC - 1, y + 82, f"one step = TPOT, {f(T_DECODE * 1e3, 1)} ms")
    for t in (0, 0.25, 0.5, 0.75, 1.0):
        xx = X0 + t * SC
        b.append(ln(xx, 226, xx, 230, "tick"))
        b.append(txt(xx, 246, f"{t:g} s", "sub2", "middle"))
    b.append(ln(X0, 226, X0 + 1.1 * SC, 226, "axis"))
    body, yb = prose(292, [
        "Two numbers decide whether a service is meeting its deadlines, and episode 1 built both "
        "({{fig:v01-o143}}). Time to first token is prefill plus however long the request sat in the "
        "queue. Time per output token comes from memory-bound decode: one step for every token.",
        f"Here the {n0(prompt)}-token prompt needs 2 × 70 billion × {n0(prompt)} = 2.8 × 10¹⁴ operations, "
        f"{f(t_pre)} s at the H100's peak, after {f(queue)} s in the queue: TTFT {f(ttft)} s. Every decode "
        f"step reads the 140 GB of weights, {f(T_DECODE * 1e3, 1)} ms at 3.35 TB/s, so a {answer}-token "
        f"answer takes another {f(answer * T_DECODE, 1)} s.",
        "The queue term is zero on an idle machine and grows as the machine fills; it gets its own figure "
        "further on.",
    ])
    emit("b24", stamp("covered both of them in episode 1"),
         "TTFT is queue wait plus prefill; TPOT is one decode step", yb + 30, b + [body],
         "TTFT is about load and prompt length, TPOT about bytes per token. Production watches both, and, "
         "as the next two figures show, not their averages.")


# ---- the hundred requests behind o025 and o026 --------------------------------------------------------------
BODY = ([1 + 0.15 * (i - 49) / 49 for i in range(50)] +
        [1 + 0.15 * (i - 49) / 42 for i in range(50, 92)])
R = (20 / 1.6) ** (1 / 7)
TAIL = [1.6 * R ** k for k in range(8)]
DATA = sorted(BODY + TAIL)
N = len(DATA)
pk = lambda k: DATA[k - 1]                                  # the k-th of the hundred, sorted (nearest rank)
P50, P90, P99, MEAN = pk(50), pk(90), pk(99), sum(DATA) / N
assert N == 100 and DATA == BODY + TAIL and P50 == 1.0
assert max(BODY) <= 1.15 + 1e-12 and min(BODY) >= 0.85 - 1e-12
assert round(MEAN, 2) == 1.54 and round(P90, 2) == 1.14 and round(P99, 1) == 13.9 and round(DATA[-1], 6) == 20
assert sum(v < MEAN for v in DATA) == 92                    # the average sits above 92 of the 100
assert round(P99 / MEAN) == 9


def o025():
    b = [hd(40, 46, "One hundred requests' time to first token, sorted fastest to slowest (illustrative)")]
    X0, P, BW, BASE, SC = 46, 5.9, 4.4, 236, 150 / DATA[-1]
    for i, v in enumerate(DATA):
        h = v * SC
        b.append(cell(X0 + i * P, BASE - h, BW, h, "h" if i >= 92 else "u", rx=1))
    b.append(ln(X0, BASE, X0 + N * P, BASE, "axis"))
    for k in (50, 90, 99):
        x = X0 + (k - 1) * P + BW / 2
        b.append(ln(x, BASE + 2, x, BASE + 10, "tick"))
        b.append(txt(x, BASE + 26, f"p{k}", "sub2", "middle"))
    b.append(txt(X0 + 99 * P, 76, f"slowest: {f(DATA[-1], 0)} × the median", "sub2", "end"))
    body, yb = prose(BASE + 66, [
        "Each bar is one request, and its height is how long that request waited for its first token. "
        "Sort them, and a percentile is simply a position in the sorted line. p50, the median, is the "
        "50th: half the requests were quicker. p90 is the 90th. p99 is the 99th: only one request in a "
        "hundred was slower than that.",
        "Notice the shape. Ninety-two of the hundred sit almost flat, within 15% of the median, and the "
        "line climbs only in the last eight, to 20 times the median. That is the shape latency "
        "distributions have, and it is why the average tells you so little.",
    ])
    emit("o025", stamp("We watch the tail"), "A percentile is a position in the sorted list", yb + 30,
         b + [body],
         "The definition is a sorting operation. The data are illustrative, but a flat body with a sudden "
         "climb is what real services show, and the next figure reads this one four ways.")


def o026():
    rows = [("the median", "half were quicker", P50, "u"), ("the average", "dragged up by the tail", MEAN, "u"),
            ("p90", "one in ten was slower", P90, "u"), ("p99", "one in a hundred was slower", P99, "h")]
    SC = 20
    b = [hd(40, 46, "The same hundred requests read four ways, in multiples of the median, drawn to one scale")]
    for k, (a, c, v, cls) in enumerate(rows):
        y = 74 + k * 54
        b.append(txt(40, y + 14, a, "cap"))
        b.append(txt(40, y + 32, c, "sub2"))
        b.append(cell(250, y, v * SC, 32, cls))
        b.append(txt(250 + v * SC + 10, y + 21, f"{f(v)} ×", "sub2"))
    body, yb = prose(74 + 4 * 54 + 30, [
        f"All four describe one set of requests. Eight slow ones drag the average to {f(MEAN)} times the "
        f"median, above {sum(v < MEAN for v in DATA)} of the hundred, so it describes no request anyone "
        f"actually had; and it is still {round(P99 / MEAN)} times below p99. Here even p90 sits on the flat "
        "body: only the 99th percentile sees the tail.",
        "So in production neither number is judged by its average. The service watches the tail, the "
        "99th percentile, the slowest one request in a hundred: that is the request a user remembers, and "
        "the one that decides whether the service met the latency it promised.",
    ])
    emit("o026", stamp("the slowest one request in a 100"), "The average hides the tail; p99 shows it",
         yb + 30, b + [body],
         "Four summaries of one distribution on a single scale. The gap between the second bar and the "
         "fourth is the reason production systems are judged on percentiles.")


# ---- b25: sizing the fleet ------------------------------------------------------------------------------------
LOAD = [100 + 60 * math.sin(2 * math.pi * (t - 540) / 1440) for t in range(1440)]   # peak at 15:00


def b25():
    mean = sum(LOAD) / len(LOAD)
    srt = sorted(LOAD)
    p99 = srt[math.ceil(0.99 * len(LOAD)) - 1]
    above = [v for v in LOAD if v > mean + 1e-9]
    share_req = sum(above) / sum(LOAD)
    over_p99 = sum(v > p99 for v in LOAD)
    assert abs(mean - 100) < 1e-9 and round(p99) == 160 and len(above) in (719, 720)
    assert round(share_req, 2) == 0.69 and over_p99 <= 0.01 * len(LOAD)
    X0, BW, BASE, SC = 80, 3.0, 250, 1.0
    b = [hd(40, 46, "One day's load, in 10-minute steps (illustrative), against two fleet sizes")]
    for k in range(144):
        v = sum(LOAD[k * 10:(k + 1) * 10]) / 10
        b.append(cell(X0 + k * BW, BASE - v * SC, BW - 0.6, v * SC, "h" if v > mean else "u", rx=0))
    xe = X0 + 144 * BW
    for cap, lab in ((mean, f"fleet for the mean, {f(mean, 0)}"), (p99, f"fleet for p99, {f(p99, 0)}")):
        y = BASE - cap * SC
        b.append(f'<line class="tick xok" x1="{X0}" y1="{y:.1f}" x2="{xe + 4:.1f}" y2="{y:.1f}"/>')
        b.append(txt(xe + 10, y + 4, lab, "sub2"))
    b.append(ln(X0, BASE, xe, BASE, "axis"))
    for h in (0, 6, 12, 18, 24):
        x = X0 + h * 6 * BW
        b.append(ln(x, BASE, x, BASE + 4, "tick"))
        b.append(txt(x, BASE + 18, f"{h:02d}:00", "sub2", "middle"))
    b.append(txt(40, BASE - 160 - 10, "requests a minute", "sub2"))
    b.append(txt(X0 - 8, BASE + 4, "0", "sub2", "end"))
    body, yb = prose(BASE + 58, [
        f"Sizing the fleet works the same way. A fleet sized for the mean fails at the peaks, which is "
        f"when the most people are using it: here the load is above its mean for half the day, red, and "
        f"those minutes carry {pct(share_req, 0)} of the day's requests.",
        f"So the fleet is built against the load at the 99th percentile of minutes, the 1,426th of the "
        f"day's 1,440 sorted: {f(p99, 0)} here, enough for 99% of the minutes in the day. It is the same "
        "sorted-list idea as the latency percentiles, applied to load.",
    ])
    emit("b25", stamp("Sizing the fleet works the same way"),
         "Size the fleet for the busiest minutes, not the average minute", yb + 30, b + [body],
         "The average minute is a minute when hardly anyone needs the service. Capacity has to be judged by "
         "the minutes when everyone does.")


# ---- o027: the utilisation trap ----------------------------------------------------------------------------------
def o027():
    L, X0 = 470, 170
    share = T_MATH / T_DECODE
    assert round(share * 100, 2) == 0.34 and round(1 / share) == 295
    b = [hd(40, 46, f"One decode step of the 70B model at batch one, {f(T_DECODE * 1e3, 1)} ms, drawn to scale")]
    rows = [("a kernel is running", L, "u", "utilisation counts this: 100%"),
            ("weights on the bus", L, "h", f"140 GB at 3.35 TB/s: {f(T_DECODE * 1e3, 1)} ms"),
            ("arithmetic units", share * L, "m", f"busy {f(T_MATH * 1e3, 2)} ms: {pct(share, 2)} of the step")]
    for k, (lab, w, c, note) in enumerate(rows):
        y = 72 + k * 44
        b.append(txt(40, y + 19, lab, "cap"))
        if w > 200:
            b.append(cell(X0, y, w, 28, c, label=note))
        else:
            b.append(cell(X0, y, max(w, 1.6), 28, c))
            b.append(txt(X0 + 12, y + 19, note, "sub2"))
    b.append(txt(40, 226, "NVIDIA's definition: the percentage of time over a sample period during which "
                 "one or more", "sub2"))
    b.append(txt(40, 242, "kernels was executing; the sample period is between a sixth of a second and one "
                 "second", "sub2"))
    body, yb = prose(284, [
        "GPU utilisation is the figure most dashboards lead with, and a kernel is one program launched on "
        "the GPU ({{fig:v03-o004}}). NVIDIA's definition tells you whether the chip is busy, not whether it "
        "is getting anything done.",
        f"A decode step stalled on memory leaves the arithmetic units nearly idle, but it is still a kernel "
        f"executing, so utilisation reports 100%. The arithmetic for one token is 2 × 70 billion "
        f"operations, {f(T_MATH * 1e3, 2)} ms at the H100's peak, inside a step that takes "
        f"{f(T_DECODE * 1e3, 1)} ms to read the weights: one part in {round(1 / share)}, the ridge of "
        "{{fig:v01-o126}}.",
    ])
    emit("o027", stamp("Nvidia's own definition"),
         "Utilisation can read 100% while the arithmetic is 0.3% busy", yb + 30, b + [body],
         "Worth knowing precisely, because it is the number most likely to be quoted as evidence that a "
         "cluster is working hard.")


# ---- b26: queue wait ------------------------------------------------------------------------------------------------
def simulate(rho, n=2_000_000, seed=26):
    """Mean wait before service, in mean service times, for random arrivals and one server (Lindley)."""
    rnd = random.Random(seed)
    w = tot = 0.0
    for _ in range(n):
        tot += w
        w = max(0.0, w + rnd.expovariate(1.0) - rnd.expovariate(rho))
    return tot / n


LOADS = [0.5, 0.8, 0.9, 0.95]
THEORY = {r: r / (1 - r) for r in LOADS}
SIM = {r: simulate(r) for r in LOADS}
ERR = max(abs(SIM[r] / THEORY[r] - 1) for r in LOADS)
assert [round(THEORY[r]) for r in LOADS] == [1, 4, 9, 19] and ERR < 0.05


def b26():
    b = [hd(40, 46, "The simplest queue: requests arrive at random, one server, load as a share of capacity")]
    # left: throughput
    L0, L1, T, B0 = 80, 280, 80, 250
    xa = lambda r: L0 + r * (L1 - L0)
    b.append(ln(L0, B0, L1, B0, "axis"))
    b.append(ln(L0, T, L0, B0, "axis"))
    b.append(f'<polyline class="pl-m" points="{xa(0):.1f},{B0} {xa(1):.1f},{T}"/>')
    for r in (0, 0.5, 1):
        b.append(ln(xa(r), B0, xa(r), B0 + 4, "tick"))
        b.append(txt(xa(r), B0 + 18, f"{round(r * 100)}%", "sub2", "middle"))
    b.append(txt(L0, T - 12, "tokens per second, as a share of the most", "sub2"))
    b.append(txt((L0 + L1) / 2, B0 + 38, "load", "sub2", "middle"))
    # right: wait
    R0, R1, YM = 380, 600, 20
    xb = lambda r: R0 + r * (R1 - R0)
    yb_ = lambda w: B0 - w / YM * (B0 - T)
    b.append(ln(R0, B0, R1, B0, "axis"))
    b.append(ln(R0, T, R0, B0, "axis"))
    pts = " ".join(f"{xb(r / 100):.1f},{yb_((r / 100) / (1 - r / 100)):.1f}" for r in range(0, 96))
    b.append(f'<polyline class="pl-h" points="{pts}"/>')
    for r in LOADS:
        x, y = xb(r), yb_(THEORY[r])
        b.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.5" fill="var(--paper)" stroke="var(--h)" stroke-width="1.5"/>')
        b.append(txt(x - 6, y - 8, f"{round(THEORY[r])}", "sub2", "end"))
    for r in (0, 0.5, 1):
        b.append(ln(xb(r), B0, xb(r), B0 + 4, "tick"))
        b.append(txt(xb(r), B0 + 18, f"{round(r * 100)}%", "sub2", "middle"))
    for w in (0, 10, 20):
        b.append(txt(R0 - 8, yb_(w) + 4, str(w), "sub2", "end"))
    b.append(txt(R0, T - 12, "average queue wait, in service times", "sub2"))
    b.append(txt((R0 + R1) / 2, B0 + 38, "load", "sub2", "middle"))
    sims = ", ".join(f(SIM[r], 1) for r in LOADS)
    body, yb = prose(B0 + 78, [
        "So the numbers worth tracking are the ones that actually move. Tokens per second is the product "
        "itself. Batch fullness counts how many requests share each weight read ({{fig:v07-o003}}). Queue "
        "wait, how long a request sits before it is first scheduled, which is the queue term of TTFT, "
        "climbs before anything else when capacity runs short.",
        f"For the simplest queue, counting in service times, the time one request takes to serve, the "
        f"average wait is ρ ÷ (1 − ρ) at load ρ: 1 at 50%, 4 at "
        f"80%, 9 at 90%, 19 at 95%. A simulation of two million requests at each load gives {sims}, within "
        f"{pct(ERR, 0)}. Throughput is still climbing in a straight line at 95%; the wait has already grown "
        "nineteen-fold.",
    ])
    emit("b26", stamp("the numbers worth tracking"),
         "Queue wait climbs long before throughput stops rising", yb + 30, b + [body],
         "Throughput looks healthiest just before the queue explodes, which is why the wait, not the "
         "throughput, is the early warning. The exact numbers belong to this simple queue; the shape "
         "belongs to every queue.")


if __name__ == "__main__":
    for fn in (b24, o025, o026, b25, o027, b26):
        fn()
