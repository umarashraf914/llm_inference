"""V7 Part 8, goodput: o016 rebuilt on ten requests (review §5 item 24), then b48 (P48), a widget
that reads per-GPU goodput off a queue, and prices a query.

  o016  throughput against goodput: ten requests, two targets, a request counts only if it meets both
  b48   widget: one prefill GPU taking random arrivals; attainment and busy time against the rate,
        the highest rate at which 90% are on time, and what that makes a query cost

The queue is a toy with stated assumptions (one prompt at a time, 0.25 s each, random arrivals, a
one-second first-token target). Its arithmetic is exact for those assumptions, and the widget's
JavaScript repeats it on the same fixed arrival draws.

  python3 figures/V07/src/goodput.py
"""
import math, random
from bcommon import (SRT, JS_FMT, cell, emit, emit_widget, f, g, hd, js_fill, ln, pc, prose, stamp,
                     txt)

# ---- o016 ---------------------------------------------------------------------------------------
TTFT_T, TPOT_T, TOKENS = 500, 50, 200                     # targets in ms, and tokens per request
TTFT = [210, 340, 450, 900, 280, 120, 470, 300, 190, 360]  # illustrative
TPOT = [32, 41, 47, 38, 44, 29, 49, 61, 36, 40]


def o016():
    ok1 = [v <= TTFT_T for v in TTFT]
    ok2 = [v <= TPOT_T for v in TPOT]
    both = [a and b for a, b in zip(ok1, ok2)]
    assert (sum(ok1), sum(ok2), sum(both)) == (9, 9, 8)
    thr, good = TOKENS * len(TTFT), TOKENS * sum(both)
    assert (thr, good) == (2000, 1600)
    b = [hd(40, 46, f"Ten requests against two targets: {TTFT_T} ms to the first token, {TPOT_T} ms per token")]
    X0, P = 172, 46
    for i in range(10):
        b.append(txt(X0 + i * P + 20, 72, f"{i + 1}", "sub2", "middle"))
    rows = [("first token, ms", TTFT, ok1, None), ("per token, ms", TPOT, ok2, None),
            ("both met", None, both, None)]
    for r, (lab, vals, oks, _) in enumerate(rows):
        y = 80 + r * 32
        b.append(txt(40, y + 17, lab, "cap"))
        for i in range(10):
            s = f"{vals[i]}" if vals else ("yes" if oks[i] else "no")
            b.append(cell(X0 + i * P, y, 40, 24, "s" if oks[i] else "h", label=s))
    b.append(txt(X0, 196, f"each target alone: {sum(ok1)} of 10 · both at once: {sum(both)} of 10", "sub2"))
    SC = 400 / thr
    b.append(txt(40, 236, "throughput", "cap"))
    b.append(cell(X0, 220, thr * SC, 26, "u"))
    b.append(txt(X0 + thr * SC + 10, 237, f"{g(thr)} tokens", "sub2"))
    b.append(txt(40, 274, "goodput", "cap"))
    b.append(cell(X0, 258, good * SC, 26, "s"))
    b.append(txt(X0 + good * SC + 10, 275, f"{g(good)}: the {sum(both)} in time", "sub2"))
    body, yb = prose(320, [
        "Throughput counts every token the cluster produces. Goodput, the measure from "
        "{{fig:v01-o145}}, counts only the tokens of requests that met their latency targets, here "
        f"{TTFT_T} ms to the first token and {TPOT_T} ms per token after it, both illustrative. A "
        "request counts only if it meets both at once.",
        f"Request 4 started too late and request 8 streamed too slowly. Each target alone is met by "
        f"{sum(ok1)} of the 10; both together by {sum(both)}. Every request produced {TOKENS} tokens, "
        f"so {g(thr)} were made and {g(good)} count. The share of requests inside both targets, "
        f"{pc(sum(both) / 10, 0)} here, is called attainment.",
        "A token generated for a request that already blew its deadline is work paid for that cannot "
        "be sold. So a cluster can run at full utilisation and deliver very little.",
    ])
    emit("o016", stamp(SRT, "What all of it optimizes is not"),
         "Goodput counts only the requests that met both targets", yb + 32, b + [body],
         "Bars to scale, latencies illustrative. Two filters applied together: missing either "
         "target is a miss, so attainment is always at or below the worse of the two.",
         links=["P32 (Part 5, 13:47), the both-targets table: point 'a request counts only if it meets "
                "both at once' at it once it exists, and check the two examples agree"])


# ---- b48: per-GPU goodput, read off a queue -----------------------------------------------------
S, T, N = 0.25, 1.0, 1000              # seconds of GPU per prompt, first-token target, requests
random.seed(7)
GAPS = [round(-math.log(1 - random.random()), 6) for _ in range(N)]   # random gaps, mean 1
RATES = [k / 10 for k in range(1, 40)]                                # 0.1 … 3.9 a second
PRICE = 0.20 * (22.3e3 / 8) * 3600 / 1e6                              # $/GPU-hour the 96-GPU run implies


def queue(lam):
    """Arrivals at random moments, `lam` a second on average; first come, first served. Returns
    (share whose first token came within T, share of the time the GPU was busy)."""
    t = free = 0.0
    ok = 0
    for u in GAPS:
        t += u / lam
        start = max(t, free)
        free = start + S
        ok += (free - t) <= T
    return ok / N, N * S / free


CURVE = [queue(lam) for lam in RATES]
BEST = max(lam for lam, (a, _) in zip(RATES, CURVE) if a >= 0.9)
LAM0 = 2.0

WIDGET_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const U = __U__, R = __R__, P = __P__, D = __D__;
  __FMT__
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val');
  const q = s => fig.querySelector(s);
  function queue(lam) {
    let t = 0, free = 0, ok = 0;
    for (const u of U) { t += u / lam; const start = Math.max(t, free); free = start + P.S; ok += (free - t) <= P.T ? 1 : 0; }
    return [ok / U.length, U.length * P.S / free];
  }
  const C = R.map(queue);
  const best = Math.max(...R.filter((l, i) => C[i][0] >= 0.9));
  const X = l => P.X0 + l * P.XS, Y = v => P.Y0 - v * P.YS;
  function draw() {
    const lam = +sl.value, [a, u] = queue(lam);
    val.textContent = fx(lam, 1);
    q('[data-da]').setAttribute('cx', X(lam).toFixed(2)); q('[data-da]').setAttribute('cy', Y(a).toFixed(2));
    q('[data-du]').setAttribute('cx', X(lam).toFixed(2)); q('[data-du]').setAttribute('cy', Y(u).toFixed(2));
    q('[data-r1]').textContent = `${fx(lam, 1)} arrivals a second: the GPU is busy ${pcx(u)} of the time, and ${pcx(a)} of first tokens come within 1 s`;
    q('[data-r2]').textContent = `${fx(lam * a)} requests a second on time; per-GPU goodput, the highest rate with 90% on time: ${fx(best, 1)}`;
  }
  sl.addEventListener('input', draw);
  q('button').addEventListener('click', () => { sl.value = D; draw(); });
  draw();
})();</script>"""


def b48():
    a0, u0 = queue(LAM0)
    aB, uB = queue(BEST)
    a_top, u_top = queue(RATES[-1])
    assert BEST == 2.4 and aB >= 0.9 and queue(2.5)[0] < 0.9
    assert a_top < 0.15 and u_top > 0.98                       # nearly always busy, nearly all late
    peak_on_time = max(l * a for l, (a, _) in zip(RATES, CURVE))
    assert peak_on_time < 2.4 * 1.0 and RATES[-1] * a_top < 0.5
    per_hour = BEST * 3600
    cpq = PRICE / per_hour
    cpq_thr = PRICE / (RATES[-1] * 3600)
    assert round(PRICE, 2) == 2.01 and round(cpq, 5) == 0.00023 and round(cpq_thr, 5) == 0.00014
    X0, XS, Y0, YS = 90, 130, 252, 180                      # rate 0…4 across 520 px; 0…100% up 180 px
    s = [hd(40, 34, "One prefill GPU, one prompt at a time, 0.25 s each; target: first token within 1 s")]
    s.append(ln(X0, Y0, X0 + 4 * XS, Y0, "axis")); s.append(ln(X0, Y0 - YS, X0, Y0, "axis"))
    for k in range(5):
        s.append(ln(X0 + k * XS, Y0, X0 + k * XS, Y0 + 4, "tick"))
        s.append(txt(X0 + k * XS, Y0 + 18, f"{k}", "sub2", "middle"))
    s.append(txt(X0 + 2 * XS, Y0 + 36, "arrivals a second", "sub2", "middle"))
    for v, lab in ((0, "0"), (0.5, "50%"), (0.9, "90%"), (1, "100%")):
        s.append(txt(X0 - 8, Y0 - v * YS + 4, lab, "sub2", "end"))
    s.append(ln(X0, Y0 - 0.9 * YS, X0 + 4 * XS, Y0 - 0.9 * YS, "mark"))
    s.append(ln(X0 + BEST * XS, Y0 - 0.9 * YS, X0 + BEST * XS, Y0, "mark"))
    pa = " ".join(f"{X0 + l * XS:.1f},{Y0 - a * YS:.1f}" for l, (a, _) in zip(RATES, CURVE))
    pu = " ".join(f"{X0 + l * XS:.1f},{Y0 - u * YS:.1f}" for l, (_, u) in zip(RATES, CURVE))
    s.append(f'<polyline class="pl-m" points="{pa}"/>')
    s.append(f'<polyline class="pl-h" style="stroke-dasharray:6 4" points="{pu}"/>')
    s.append(txt(X0 + 0.55 * XS, Y0 - 1.0 * YS - 8, "on time", "sub2 halo"))
    s.append(txt(X0 + 0.8 * XS, Y0 - 0.40 * YS, "busy", "sub2 halo"))
    s.append(txt(X0 + BEST * XS + 6, Y0 - 10, f"{f(BEST, 1)} a second", "sub2 halo"))
    s.append(f'<circle data-da="" cx="{X0 + LAM0 * XS:.2f}" cy="{Y0 - a0 * YS:.2f}" r="4.5" fill="var(--m)"/>')
    s.append(f'<circle data-du="" cx="{X0 + LAM0 * XS:.2f}" cy="{Y0 - u0 * YS:.2f}" r="4.5" fill="var(--h)"/>')
    s.append(f'<text class="sub2" x="40" y="{Y0 + 70}" data-r1="">{f(LAM0, 1)} arrivals a second: the GPU '
             f'is busy {pc(u0)} of the time, and {pc(a0)} of first tokens come within 1 s</text>')
    s.append(f'<text class="sub2" x="40" y="{Y0 + 88}" data-r2="">{f(LAM0 * a0)} requests a second on '
             f'time; per-GPU goodput, the highest rate with 90% on time: {f(BEST, 1)}</text>')
    body, yb = prose(Y0 + 130, [
        f"Requests arrive at random moments, on average as many a second as the slider says, and wait "
        f"for the ones ahead. A request's time to first token is its wait plus its own {f(S)} s of "
        "prefill. The curves were computed for a thousand requests at each rate.",
        f"Busy time rises in a straight line, {f(S)} s of work per request. The share on time does "
        "not: it stays near 100% while the GPU has slack, then falls away as a queue builds, because "
        "every late request delays the ones behind it.",
        f"Per-GPU goodput is the highest rate at which 90% still make the target: {f(BEST, 1)} requests "
        f"a second here, with the GPU busy {pc(uB, 0)} of the time. At {f(RATES[-1], 1)} a second it is "
        f"busy {pc(u_top, 0)} of the time and only {pc(a_top, 0)} are on time. This toy checks only the "
        "first-token target; a real measurement checks both.",
        f"Counted per GPU, goodput becomes cost per query. The 96-GPU run's 20 cents per million "
        f"tokens, at 2,787.5 output tokens a second per GPU, implies ${f(PRICE)} per GPU-hour. At "
        f"{f(BEST, 1)} queries a second, {g(per_hour)} an hour, each costs ${f(cpq, 5)}. Priced on raw "
        f"throughput at {f(RATES[-1], 1)} a second it would look like ${f(cpq_thr, 5)}, for queries "
        "nine in ten of which arrived late. The arithmetic was checked in Python.",
    ])
    ctl = [f"<label>arrivals a second <input type='range' min='0.1' max='3.9' step='0.1' value='{LAM0}'>"
           f"<span class='val'>{f(LAM0, 1)}</span></label><button type='button'>Reset</button>"]
    js = js_fill(WIDGET_JS.replace("__FMT__", JS_FMT), U=GAPS, R=RATES,
                 P=dict(S=S, T=T, X0=X0, XS=XS, Y0=Y0, YS=YS), D=LAM0)
    emit_widget("b48", stamp(SRT, "Serving adds a per GPU version of the"),
                "Per-GPU goodput is read where nine in ten are still on time", ctl, "".join(s) + body,
                yb + 26,
                "A toy queue, exact for its assumptions. Utilisation climbs in a straight line while "
                "the share on time falls off a cliff: the GPU is busiest exactly when it is least "
                "useful.", js,
                links=["P35 (Part 5, 15:05), twenty cents per million: point the $2.01 per GPU-hour "
                       "derivation at it once it exists"])


if __name__ == "__main__":
    o016()
    b48()
