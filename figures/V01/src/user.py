"""V01 Part 15, what the user feels: proposals 33 (the pause before the first token is prefill, and its
length is arithmetic), 34 (when 64 users share each read, the cost per token falls 64-fold) and 35 (goodput
keeps only the requests that met their promise, as a widget).

  python3 figures/V01/src/user.py
"""
import json
import math
from statistics import NormalDist

from common import (cell, ln, txt, hd, eq, prose, emit, widget, tag, st, f, g, sig, rnd, D, L, N_EXACT, W_BYTES,
                    KV_PER_TOKEN, PEAK, BW, RIDGE, JS_FMT)

# ---- 33: prefill time for one prompt, alone on the chip at full peak ---------------------------
PROMPTS = [200, 2000, 20000]


def prefill(p):
    """Seconds to read (weights once, plus the prompt's keys and values written) and to compute (two
    operations per weight per token, plus causal attention: query i meets i keys, for scores and blend)."""
    read = (2 * N_EXACT + p * KV_PER_TOKEN) / BW
    att = 4 * D * L * p * (p + 1) // 2
    ops = 2 * N_EXACT * p + att
    return dict(read=read, math=ops / PEAK, pause=max(read, ops / PEAK), att=att / ops,
                bound="memory" if read >= ops / PEAK else "arithmetic")


PF = {p: prefill(p) for p in PROMPTS}
assert [f(PF[p]["read"] * 1e3, 1) for p in PROMPTS] == ["42.1", "42.3", "44.1"]
assert [f(PF[p]["math"] * 1e3, 1) for p in PROMPTS] == ["28.6", "290.7", "3383.7"]
assert [PF[p]["bound"] for p in PROMPTS] == ["memory", "arithmetic", "arithmetic"]
assert round(100 * PF[20000]["att"]) == 16
CROSS = next(p for p in range(1, 1000) if prefill(p)["bound"] == "arithmetic")
assert CROSS == 295 == round(RIDGE)

# ---- 34: cost per million tokens at $3 an hour -------------------------------------------------
PRICE = 3.0                                        # illustrative, as V08's o029
TPS1 = BW / W_BYTES                                # one request: one token per read of the weights
assert round(TPS1, 1) == 23.9 and round(TPS1 * 3600) == 86_143


def cost(batch):
    return PRICE / (batch * TPS1 * 3600) * 1e6


assert f(cost(1), 2) == "34.83" and f(cost(64), 2) == "0.54" and abs(cost(1) / cost(64) - 64) < 1e-9
assert 64 < RIDGE                                  # a batch of 64 is still below the ridge
assert round(64 * TPS1) == 1531 and round(64 * TPS1 * 3600 / 1e6, 2) == 5.51

# ---- 35: goodput over an illustrative population of 100 requests -------------------------------
N_REQ, TOKENS, WINDOW = 100, 500, 60               # each request gets 500 tokens; all within one minute
SIGMA = 0.9
_z = [NormalDist().inv_cdf((i - 0.5) / N_REQ) for i in range(1, N_REQ + 1)]
MU = -SIGMA * (_z[59] + _z[60]) / 2                # puts one second between the 60th and the 61st
TTFT = [round(100 * math.exp(MU + SIGMA * z)) for z in _z]   # hundredths of a second, sorted
assert TTFT == sorted(TTFT) and TTFT[59] <= 100 < TTFT[60]
assert (TTFT[0], TTFT[49], TTFT[-1]) == (8, 79, 809)
T0, TMIN, TMAX = 10, 2, 50                         # the promise in tenths of a second: 1.0 s, 0.2 to 5.0


def met(tenths):
    return sum(t <= 10 * tenths for t in TTFT)


def p35_lines(tenths):
    m = met(tenths)
    return [f"{m} of {N_REQ} requests had their first token within {f(tenths / 10, 1)} s",
            f"goodput: {m} × {TOKENS} tokens in {WINDOW} s = {g(m * TOKENS / WINDOW)} tokens a second"]


assert met(T0) == 60 and g(N_REQ * TOKENS / WINDOW) == "833" and g(60 * TOKENS / WINDOW) == "500"
assert p35_lines(T0)[1].endswith("= 500 tokens a second")

# drawing scale for p35
X0, BAR = 80, 5.2                                  # request k (from 0) sits at X0 + BAR * k
YB, PX = 320, 95                                   # 0.05 s on the baseline, 95 px per factor of ten


def ty(hundredths):
    return rnd(YB - PX * math.log10(hundredths / 5))


assert min(TTFT) > 5 and ty(max(TTFT)) > 90


def dur(s):
    """A duration to three figures: 28.6 ms, 291 ms, 3.38 s."""
    return f"{sig(s * 1e3, 3)} ms" if s < 1 else f"{f(s, 2)} s"


assert [dur(PF[p]['pause']) for p in PROMPTS] == ['42.1 ms', '291 ms', '3.38 s']


def p33():
    b = [hd(40, 46, "One prompt's prefill, alone on an H100 at full peak (log scale)")]
    x0, dec = 190, 120                             # 10 ms at x0, 120 px per factor of ten
    xt = lambda s: round(x0 + dec * math.log10(s / 0.01), 1)
    for k, p in enumerate(PROMPTS):
        y = 76 + 70 * k
        r = PF[p]
        pause = dur(r["pause"])
        b.append(txt(40, y + 14, f"{g(p)} tokens", "cap"))
        b.append(txt(40, y + 34, f"{pause}: {r['bound']}", "sub2"))
        b.append(cell(x0, y, xt(r["read"]) - x0, 16, "h", rx=2))
        b.append(txt(xt(r["read"]) + 8, y + 13, f"reading, {dur(r['read'])}", "sub2"))
        b.append(cell(x0, y + 20, xt(r["math"]) - x0, 16, "m", rx=2))
        b.append(txt(xt(r["math"]) + 8, y + 33, f"arithmetic, {dur(r['math'])}", "sub2"))
    ya = 76 + 70 * 3 - 14
    b.append(ln(x0, ya, xt(10), ya, "tick"))
    for s, lab in [(0.01, "10 ms"), (0.1, "100 ms"), (1, "1 s"), (10, "10 s")]:
        b.append(ln(xt(s), ya, xt(s), ya + 6, "tick"))
        b.append(txt(xt(s), ya + 22, lab, "sub2", "middle"))
    body, yb = prose(ya + 64, [
        "A prompt goes through prefill in a single pass, so its pause is the longer of two times: reading the "
        "weights once, 141.1 GB at 3.35 TB/s (with the prompt's keys and values written), and the arithmetic, "
        "two operations per weight for every token plus attention's scores and blend ({{fig:v01-o128}}), at "
        "989 trillion a second.",
        f"Reading takes about 42 ms whatever the length. The arithmetic grows with the prompt and overtakes "
        f"the reading at {CROSS} tokens, the ridge ({{{{fig:v01-o129}}}}): a 200-token prompt waits on memory, a "
        f"2,000-token one on arithmetic. At 20,000 tokens attention's share, which grows with the square of "
        f"the length, is already {round(100 * PF[20000]['att'])}% of the arithmetic.",
        "These are floors: one request alone on a chip at full peak, counted as if one H100 held the whole "
        "model ({{fig:v01-o014}}). Real pauses are longer, with queueing and other requests sharing the chip, "
        "which is how a user comes to see half a second for a short prompt and several seconds for a long one.",
    ])
    emit("p33", st("TTFT is governed by the pre-fill phase"),
         "The pause before the first token is prefill, and its length is arithmetic", yb + 22, b + [body],
         "The wait for the first word is the longer of one read of the weights and the prompt's arithmetic, "
         "so short prompts wait on memory and long ones on the arithmetic units. Log scale.")


def p34():
    b = [hd(40, 46, "One H100 at $3 an hour, decoding the 70B model, weights only")]
    rows = [(f"one request:  3.35 TB/s ÷ 140 GB  =  {f(TPS1, 1)} tokens a second", "u"),
            (f"{f(TPS1, 1)} × 3,600 seconds  =  {g(TPS1 * 3600)} tokens an hour", "u"),
            (f"$3 ÷ {g(TPS1 * 3600)} tokens  =  ${f(cost(1), 2)} per million tokens", "h")]
    y = 66
    for s, c in rows:
        b.append(eq(60, y, 560, s, c, h=36))
        y += 46
    y += 14
    b.append(hd(40, y + 4, "Sixty-four requests sharing each read"))
    rows = [(f"each read makes 64 tokens:  64 × {f(TPS1, 1)}  =  {g(64 * TPS1)} tokens a second", "u"),
            (f"{g(64 * TPS1)} × 3,600 seconds  =  {f(64 * TPS1 * 3600 / 1e6, 2)} million tokens an hour", "u"),
            (f"$3 ÷ {f(64 * TPS1 * 3600 / 1e6, 2)} million tokens  =  ${f(cost(64), 2)} per million tokens", "s")]
    y += 24
    for s, c in rows:
        b.append(eq(60, y, 560, s, c, h=36))
        y += 46
    y += 18
    b.append(hd(40, y + 4, "Cost per million tokens (log scale)"))
    x0, dec = 200, 130                             # $0.10 at x0, 130 px per factor of ten
    xc = lambda d: round(x0 + dec * math.log10(d / 0.1), 1)
    for k, (lab, bt, c) in enumerate([("one request", 1, "h"), ("a batch of 64", 64, "s")]):
        yy = y + 24 + 40 * k
        b.append(txt(40, yy + 19, lab, "cap"))
        b.append(cell(x0, yy, xc(cost(bt)) - x0, 28, c, rx=3))
        b.append(txt(xc(cost(bt)) + 10, yy + 19, f"${f(cost(bt), 2)}", "sub2"))
    ya = y + 24 + 80 + 4
    b.append(ln(x0, ya, xc(100), ya, "tick"))
    for d, lab in [(0.1, "$0.10"), (1, "$1"), (10, "$10"), (100, "$100")]:
        b.append(ln(xc(d), ya, xc(d), ya + 6, "tick"))
        b.append(txt(xc(d), ya + 22, lab, "sub2", "middle"))
    body, yb = prose(ya + 62, [
        "The operator pays for the chip by the hour and sells tokens, so a token's cost is the hourly price "
        "divided by the tokens made in that hour ({{fig:v01-p02}}).",
        "Alone, one request gets 23.9 tokens a second, one per read of the weights ({{fig:v01-o014}}). In a "
        "batch of 64 every read makes 64 tokens ({{fig:v01-p24}}) and the step takes just as long, because 64 "
        "operations per byte is still below the ridge of 295. Same hour, same price, 64 times the tokens: the "
        "cost per token falls 64-fold.",
        "This counts the weights only. Each request also reads its own cache, which is not shared "
        "({{fig:v01-p32}}), so a real batch falls short of the full 64-fold. The $3 is an illustrative rental "
        "price, as in {{fig:v08-o029}}, which sets two published measurements side by side.",
    ])
    emit("p34", st("They pay for the chip by the hour"),
         "When 64 users share each read, the cost per token falls sixty-four-fold", yb + 22, b + [body],
         "Why operators batch: the hour costs the same however many users share it, so every user added to "
         "each read of the weights divides the price of a token. Log scale.")


def p35():
    b = [hd(40, 34, "100 requests in one minute, sorted by their wait for the first token")]
    for t, lab in [(10, "0.1 s"), (100, "1 s"), (1000, "10 s")]:
        b.append(ln(X0 - 10, ty(t), X0 - 4, ty(t), "tick"))
        b.append(txt(X0 - 14, ty(t) + 4, lab, "sub2", "end"))
    b.append(ln(X0 - 4, YB, X0 + BAR * N_REQ, YB, "tick"))
    for k, t in enumerate(TTFT):
        c = "s" if t <= 10 * T0 else "h"
        b.append(f'<g class="{c}" data-k="{k}"><rect x="{round(X0 + BAR * k + 0.8, 1)}" y="{ty(t)}" '
                 f'width="3.6" height="{round(YB - ty(t), 1)}" rx="0.5"/></g>')
    yl = ty(10 * T0)
    b.append(f'<line class="mark" data-line="" x1="{X0 - 4}" y1="{yl}" x2="{X0 + BAR * N_REQ}" y2="{yl}"/>')
    b.append(tag("text", {"class": "sub2 halo", "x": 40, "y": 66, "data-lab": ""},
                 f"the promise, the dashed line: first token within {f(T0 / 10, 1)} s"))
    for k, lab in [(0, "1"), (49, "50"), (99, "100")]:
        b.append(txt(round(X0 + BAR * k + 2.6, 1), YB + 20, lab, "sub2", "middle"))
    b.append(txt(X0 + BAR * N_REQ / 2, YB + 40, "requests, quickest first", "sub2", "middle"))
    lines = p35_lines(T0)
    yr = YB + 76
    b.append(tag("text", {"class": "sub2", "x": 40, "y": yr, "data-r": 0}, lines[0]))
    b.append(txt(40, yr + 22, f"throughput: {N_REQ} × {TOKENS} tokens in {WINDOW} s = "
                 f"{g(N_REQ * TOKENS / WINDOW)} tokens a second", "sub2"))
    b.append(tag("text", {"class": "sub2", "x": 40, "y": yr + 44, "data-r": 1}, lines[1]))
    body, yb = prose(yr + 92, [
        "Each bar is one request: how long it waited for its first token, quickest on the left, on a log "
        "scale. The dashed line is the promise. Throughput counts every token produced; goodput counts only "
        "the tokens of requests that kept the promise ({{fig:v01-o145}}).",
        "At a one-second promise 60 of the 100 requests make it. The machine produced 833 tokens a second, but "
        "only 500 a second reached people within the time they were promised. Tighten the promise and goodput "
        "falls, though the machine did exactly the same work.",
        "The waits are illustrative. Reading such a sorted list by position, the median and the 99th, is "
        "{{fig:v08-o025}}. The readouts were checked against Python at every position of the slider.",
    ])
    js = JS_FMT + r"""
  const fig = document.currentScript.closest('figure');
  const T = __T__, TOK = __TOK__, WIN = __WIN__, T0 = __T0__, YB = __YB__, PX = __PX__;
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val'), q = s => fig.querySelector(s);
  const ty = h => +(YB - PX * Math.log10(h / 5)).toFixed(1);
  function draw() {
    const k = +sl.value, m = T.filter(t => t <= 10 * k).length;
    val.textContent = fx(k / 10, 1) + ' s';
    T.forEach((t, i) => q(`[data-k="${i}"]`).setAttribute('class', t <= 10 * k ? 's' : 'h'));
    const y = ty(10 * k), ln = q('[data-line]'); ln.setAttribute('y1', y); ln.setAttribute('y2', y);
    q('[data-lab]').textContent = `the promise, the dashed line: first token within ${fx(k / 10, 1)} s`;
    q('[data-r="0"]').textContent = `${m} of ${T.length} requests had their first token within ${fx(k / 10, 1)} s`;
    q('[data-r="1"]').textContent = `goodput: ${m} × ${TOK} tokens in ${WIN} s = ${gx(m * TOK / WIN)} tokens a second`;
  }
  sl.addEventListener('input', draw);
  q('button').addEventListener('click', () => { sl.value = T0; draw(); });
  draw();""".replace("__T__", json.dumps(TTFT)).replace("__TOK__", str(TOKENS)).replace("__WIN__", str(WINDOW)) \
        .replace("__T0__", str(T0)).replace("__YB__", str(YB)).replace("__PX__", str(PX))
    ctl = (f"<label>promise <input type='range' min='{TMIN}' max='{TMAX}' step='1' value='{T0}'>"
           f"<span class='val'>{f(T0 / 10, 1)} s</span></label><button type='button'>Reset</button>")
    widget("p35", st("You can run a system at enormous"),
           "Goodput keeps only the requests that met their promise", [ctl], yb + 22, b + [body],
           "Goodput is throughput with a filter on it, and the filter is the promise. The same minute of work "
           "is worth 833 or 500 tokens a second, depending on what the users were promised.", js)


if __name__ == "__main__":
    for fn in (p33, p34, p35):
        fn()
