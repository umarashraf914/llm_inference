"""V7 Part 3, continuous and selective batching: review sections D and E (P16-P21), the median the
video first leans on, and the rebuilds of Figs 6 and 7 (o006, o007).

  o006     Orca's change drawn as the loop it is, with the end-of-sequence exit
  a16  P16 widget: the same four requests, static against continuous, over 512 steps
  a17      the median, built where "a median latency of 190 milliseconds" first appears (7:58)
  a18      Orca against FasterTransformer at the same median latency; vLLM a year later
  a19  P18 four requests mid-flight have four different shapes
  a20  P19 a linear layer treats every row on its own
  a21  P20 layer norm, RMS norm and SiLU, worked on one token
  a22  P21 seven tokens stacked into one [7 x H] matrix, then split for attention
  o007     selective batching assembled: the layer as a stack, attention the only split step

  python3 figures/V07/src/p3_continuous.py

Sources: Yu et al., "Orca", OSDI 2022: GPT-3 175B on A100s against FasterTransformer, 0.185 against
6.81 requests a second at a median normalized latency of 190 ms, "36.9x"; the selective-batching
example of its Figures 4 and 5 (x1 and x2 decoding x14 and x22, x3 and x4 prefilling 2 and 3 tokens,
a [7, H] tensor split before attention). Kwon et al., SOSP 2023: vLLM 2-4x over FasterTransformer and
Orca at the same latency.
"""
import json
import math
from v07common import *  # noqa: F401,F403

# ---- the scheduler simulation ---------------------------------------------------------------------
FIRST = [8, 24, 60, 512]
QUEUE = [100, 300, 200, 450, 150, 80, 260]         # waiting requests, illustrative
T = 512


def simulate():
    """Seats refilled from the queue the moment they free. Returns, per seat, (start, end, name)."""
    lanes = [[(0, n, str(i + 1))] for i, n in enumerate(FIRST)]
    free_at = list(FIRST)
    q = list(QUEUE)
    k = len(FIRST)
    while q:
        s = min(range(len(free_at)), key=lambda i: (free_at[i], i))
        if free_at[s] >= T:
            break
        n = q.pop(0)
        k += 1
        lanes[s].append((free_at[s], free_at[s] + n, str(k)))
        free_at[s] += n
    return lanes


CONT = simulate()
STAT = [[(0, n, str(i + 1))] for i, n in enumerate(FIRST)]
segs = lambda L: [s for lane in L for s in lane]
done_by = lambda L, t: sum(max(0, min(e, t) - b) for b, e, _ in segs(L))
working = lambda L, t: sum(1 for b, e, _ in segs(L) if b < t <= e)
returned_c = lambda t: sum(1 for b, e, _ in segs(CONT) if e <= t)
returned_s = lambda t: len(FIRST) if t >= T else 0
assert done_by(STAT, T) == 604 and done_by(CONT, T) == 1946
assert [b for b, e, n in segs(CONT) if int(n) > 4] == [8, 108, 24, 324, 404, 60, 260]
assert round(done_by(CONT, T) / done_by(STAT, T), 2) == 3.22 and returned_c(T) == 9
assert min(working(CONT, t) for t in range(1, 411)) == 4 and working(CONT, 411) == 3


def sched_state(t):
    S, C = done_by(STAT, t), done_by(CONT, t)
    return {"val": str(t),
            "r1": f"step {t}: seats working, static {working(STAT, t)} of 4, continuous {working(CONT, t)} of 4",
            "r2": f"tokens so far: static {fc(S)}, continuous {fc(C)}; per read of the weights {f(S / t, 2)} against {f(C / t, 2)}",
            "r3": f"requests returned to their users: static {returned_s(t)}, continuous {returned_c(t)}"}


# ---- o006 -----------------------------------------------------------------------------------------
def o006():
    b = [hd(40, 46, "Iteration-level scheduling, drawn as the loop it is")]
    for i in range(3):
        b.append(cell(40, 92 + i * 18, 60, 13, "u", rx=2))
    b.append(txt(40, 160, "waiting", "sub2"))
    b.append(arr(106, 112, 158, 112))
    b.append(txt(110, 104, "admit", "sub2"))
    b.append(box(164, 84, 176, 58, "s", "scheduler", "picks this step's batch", rx=6))
    b.append(box(440, 84, 200, 58, "m", "engine", "one token for each request", rx=6))
    b.append(arr(346, 100, 434, 100))
    b.append(txt(390, 92, "one iteration", "sub2", "middle"))
    b.append(arr(434, 128, 346, 128))
    b.append(txt(390, 146, "the new tokens", "sub2", "middle"))
    b.append(arr(252, 148, 252, 186))
    b.append(cell(164, 192, 176, 26, "u", label="finished: back to its user"))
    b.append(txt(264, 172, "end-of-sequence token", "sub2"))
    body, yb = prose(266, [
        "Orca (Yu et al., presented in 2022 at OSDI, a leading systems conference) changed what the "
        "scheduler hands to the engine. Rather than a batch to run to completion, it hands over a batch "
        "and asks for exactly one iteration: one token for every active request. The engine runs that "
        "step and returns.",
        "Between steps the scheduler drops whatever just emitted an end-of-sequence token, returning it "
        "to its user at once, admits whatever has been waiting, and rebuilds the batch. Orca called "
        "this iteration-level scheduling; it is now usually called continuous batching.",
        "It works because one iteration is the same small unit of work for every request. Whether a "
        "sequence is on its fifth token or its 500th, a step advances it by exactly one, so the batch "
        "can be rebuilt between any two steps without interrupting anyone.",
    ])
    emit("o006", st("Orca, presented at OSDI"), "Orca hands the engine one iteration, then rebuilds the batch",
         yb + 32, b + [body],
         "The change is to what the scheduler hands over, not to the model or the kernels. A loop that "
         "comes back every step can change its mind every step.")


# ---- a16 · P16: the scheduler widget --------------------------------------------------------------
X0, X1 = 110, 630
SC16 = (X1 - X0) / T


def lanes_svg(L, y0, tag):
    o = []
    for i, lane in enumerate(L):
        y = y0 + i * 22
        o.append(txt(40, y + 13, f"seat {i + 1}", "cap"))
        o.append(track(X0, y, X1 - X0, 18, rx=2))
        for b_, e_, name in lane:
            e2 = min(e_, T)
            w = (e2 - b_) * SC16
            o.append(cell(round(X0 + b_ * SC16, 2), y, round(w, 2), 18, "m", rx=2,
                          label=name if w >= 18 else None))
    return o


def strip_svg(L, ybase):
    o = [txt(40, ybase - 1, "per read", "cap")]
    t = 1
    while t <= T:
        k = working(L, t)
        t2 = t
        while t2 + 1 <= T and working(L, t2 + 1) == k:
            t2 += 1
        if k:
            o.append(cell(round(X0 + (t - 1) * SC16, 2), ybase - k * 4, round((t2 - t + 1) * SC16, 2), k * 4, "s", rx=0))
        t = t2 + 1
    return o


A16_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const STAT = __STAT__, CONT = __CONT__, T = __T__, X0 = __X0__, SC = __SC__;
  __FMT__
  const done = (L, t) => L.flat().reduce((a, [b, e]) => a + Math.max(0, Math.min(e, t) - b), 0);
  const work = (L, t) => L.flat().filter(([b, e]) => b < t && t <= e).length;
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val'), q = s => fig.querySelector(s);
  const play = q('[data-play]');
  let timer = null;
  function draw() {
    const t = +sl.value, S = done(STAT, t), C = done(CONT, t);
    val.textContent = String(t);
    const x = (X0 + t * SC).toFixed(1);
    fig.querySelectorAll('[data-cur]').forEach(l => { l.setAttribute('x1', x); l.setAttribute('x2', x); });
    q('[data-r1]').textContent = `step ${t}: seats working, static ${work(STAT, t)} of 4, continuous ${work(CONT, t)} of 4`;
    q('[data-r2]').textContent = `tokens so far: static ${fcx(S)}, continuous ${fcx(C)}; per read of the weights ${fx(S / t, 2)} against ${fx(C / t, 2)}`;
    q('[data-r3]').textContent = `requests returned to their users: static ${t >= T ? 4 : 0}, continuous ${CONT.flat().filter(([b, e]) => e <= t).length}`;
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } play.textContent = 'Play'; }
  play.addEventListener('click', () => {
    if (timer) { stop(); return; }
    if (+sl.value >= T) sl.value = 1;
    play.textContent = 'Pause';
    timer = setInterval(() => { const t = Math.min(T, +sl.value + 4); sl.value = t; draw(); if (t >= T) stop(); }, 40);
  });
  sl.addEventListener('input', () => { stop(); draw(); });
  q('[data-reset]').addEventListener('click', () => { stop(); sl.value = T; draw(); });
  draw();
})();</script>"""


def a16():
    s0 = sched_state(T)
    b = [hd(40, 34, "Four seats, 512 steps, the same four requests scheduled two ways, to scale")]
    b.append(txt(X0, 60, "static: the batch stays as formed until all four finish", "sub2"))
    b += lanes_svg(STAT, 68, "s")
    yst = 68 + 4 * 22 + 22
    b += strip_svg(STAT, yst)
    y2 = yst + 30
    b.append(txt(X0, y2, "continuous: a waiting request takes each seat the moment it frees", "sub2"))
    b += lanes_svg(CONT, y2 + 8, "c")
    yct = y2 + 8 + 4 * 22 + 22
    b += strip_svg(CONT, yct)
    ya = yct + 10
    b.append(ln(X0, ya, X1, ya, "axis"))
    for v in (0, 128, 256, 384, 512):
        x = X0 + v * SC16
        b.append(tick(x, ya, x, ya + 5))
        b.append(txt(round(x, 1), ya + 19, f"{v} steps" if v == 512 else str(v), "sub2", "middle" if v < 512 else "end"))
    xc = round(X0 + T * SC16, 1)
    for (ya_, yb_) in ((64, yst + 2), (y2 + 4, yct + 2)):
        b.append(f'<line class="mark xok" x1="{xc}" y1="{ya_}" x2="{xc}" y2="{yb_}" data-cur=""/>')
    RY = ya + 50
    for k in (1, 2, 3):
        b.append(f'<text class="sub2" x="40" y="{RY + (k - 1) * 20}" data-r{k}="">{esc(s0[f"r{k}"])}</text>')
    ends = [b_ for b_, e_, n in segs(CONT) if int(n) > 4]
    body, yb = prose(RY + 40 + 38, [
        "Take the same four requests: 8, 24, 60 and 512 steps. Static batching holds all four seats "
        "until step 512. Continuous batching gives a seat to the next waiting request the moment one "
        f"frees: seven are queued, needing {', '.join(map(str, QUEUE[:-1]))} and {QUEUE[-1]} steps "
        f"(illustrative), and they join at steps {', '.join(map(str, sorted(ends)[:-1]))} and "
        f"{sorted(ends)[-1]}. Only after step 410, with the queue empty, does a seat sit idle.",
        f"Over the same 512 steps the static batch keeps 604 of its 2,048 seat-steps busy, "
        f"{f(604 / 2048 * 100, 1)}%; the continuous one keeps 1,946 busy, {f(1946 / 2048 * 100, 1)}%. "
        f"Tokens per read of the weights average {f(604 / T, 2)} against {f(1946 / T, 2)}, "
        f"{f(1946 / 604, 1)} times as many from the same reads.",
        "Press Play to run it, or drag through the steps. The counts were checked against Python at "
        "every one of the 512.",
    ])
    ctl = (f"<div class='ctl'><label>step <input type='range' min='1' max='{T}' step='1' value='{T}'>"
           f"<span class='val'>{s0['val']}</span></label><button type='button' data-play=''>Play</button>"
           "<button type='button' data-reset=''>Reset</button></div>")
    js = (A16_JS.replace("__STAT__", json.dumps([[[b_, e_] for b_, e_, _ in L] for L in STAT]))
          .replace("__CONT__", json.dumps([[[b_, e_] for b_, e_, _ in L] for L in CONT]))
          .replace("__T__", str(T)).replace("__X0__", str(X0)).replace("__SC__", repr(SC16))
          .replace("__FMT__", JS_FMT))
    widget("a16", st("Take the same four requests"), "The same four requests, one step at a time", ctl,
           yb + 26, b + [body],
           "Drawn to scale over 512 steps. Nothing about the model changed; only the moment a seat is "
           "refilled did, and that alone more than triples the tokens from each read.", js)


def a16_cases():
    ts = [T] + list(range(1, T))                       # every step, as the prose claims
    return [({"input[type=range]": t}, {".val": sched_state(t)["val"], "[data-r1]": sched_state(t)["r1"],
                                       "[data-r2]": sched_state(t)["r2"], "[data-r3]": sched_state(t)["r3"]})
            for t in ts]


# ---- a17: the median ------------------------------------------------------------------------------
ARRIVED = [200, 150, 600, 185, 170, 240, 195, 160, 210, 180]   # ms per generated token, illustrative


def median(v):
    s = sorted(v)
    n = len(s)
    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2


def a17():
    s = sorted(ARRIVED)
    med, mean = median(ARRIVED), sum(ARRIVED) / len(ARRIVED)
    assert med == 190 and mean == 229 and median(s[:9]) == s[4]
    b = [hd(40, 46, "Ten requests' time per generated token, in milliseconds (illustrative)")]
    b.append(txt(40, 84, "as they finished", "cap"))
    for i, v in enumerate(ARRIVED):
        b.append(cell(170 + i * 47, 68, 41, 24, "u", rx=3, label=str(v)))
    BASE, HS = 250, 0.2                                  # bars: 600 ms is 120 px tall
    b.append(txt(40, BASE - 8, "sorted", "cap"))
    for i, v in enumerate(s):
        x = 170 + i * 47
        mid = i in (4, 5)
        b.append(cell(x, BASE - v * HS, 41, v * HS, "m" if mid else "u", rx=2))
        b.append(txt(x + 20.5, BASE - v * HS - 6, str(v), "sub2", "middle"))
        b.append(txt(x + 20.5, BASE + 16, str(i + 1), "sub2", "middle"))
    b.append(txt(170, BASE + 34, "position in the sorted line", "sub2"))
    # the two summaries as bars on one scale
    YS, SS = BASE + 82, 400 / 300
    b.append(hd(40, YS - 12, "Two summaries of the same ten, on one scale"))
    for k, (lab, v, cls) in enumerate([("median", med, "m"), ("average", mean, "u")]):
        y = YS + k * 34
        b.append(txt(40, y + 17, lab, "cap"))
        b.append(cell(170, y, v * SS, 24, cls, rx=2))
        b.append(txt(round(170 + v * SS + 10, 1), y + 17, f"{v:g} ms", "sub2"))
    body, yb = prose(YS + 2 * 34 + 34, [
        "A median is the middle value once the measurements are sorted. With an odd count it is the "
        "middle one; with an even count it is the average of the two middle ones: here the 5th and 6th, "
        f"({s[4]} + {s[5]}) ÷ 2 = {med:g} ms. Half the requests did better, half worse.",
        f"The average, total ÷ count = {sum(ARRIVED):,} ÷ 10 = {mean:g} ms, is pulled up by the one slow "
        "request at 600 ms. The median would not move if that request took a minute, which is why "
        "latency is usually quoted as a median.",
        "Orca's result uses one per request: its total time divided by the tokens it generated. A "
        "median of 190 ms per generated token means half the requests did better than that.",
    ])
    emit("a17", st("holding a median latency"), "A median is the middle of the sorted line", yb + 32, b + [body],
         fwd("a28", "The median says what a typical request saw and is blind to the slowest few, which is "
                    "why {{ref:v07-a28}} adds the tail.",
             "The median says what a typical request saw and is blind to the slowest few, which is why a "
             "later figure adds the tail."))


# ---- a18: Orca's result -------------------------------------------------------------------------
FT, ORCA = 0.185, 6.81


def a18():
    b = [hd(40, 46, "GPT-3 175B on A100s, both held to a median 190 ms per generated token")]
    X0_, SC = 210, 400 / ORCA
    for k, (lab, v, cls, val) in enumerate([("Orca", ORCA, "s", f"{f(ORCA, 2)} requests a second"),
                                             ("FasterTransformer", FT, "h", f"{f(FT, 3)} requests a second")]):
        y = 70 + k * 40
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(cell(X0_, y, max(v * SC, 2), 26, cls, rx=2, label=val if v * SC > 200 else None))
        if v * SC <= 200:
            b.append(txt(round(X0_ + v * SC + 10, 1), y + 18, val, "sub2"))
    ratio = ORCA / FT
    assert round(ratio, 2) == 36.81
    body, yb = prose(70 + 2 * 40 + 36, [
        "Orca's paper set it against NVIDIA's FasterTransformer, a fast engine that batched whole "
        "requests. Throughput only means something at a stated latency, because any system can serve "
        "more by making everyone wait longer ({{fig:v01-o142}}); so both were held to the same median, "
        "190 ms per generated token.",
        f"At that latency FasterTransformer served {f(FT, 3)} requests a second and Orca {f(ORCA, 2)}: "
        f"36.9 times, as the paper reports. From the rounded rates the division gives {f(ratio, 1)}.",
        "vLLM, measured against Orca a year later, reported two to four times Orca's throughput at the "
        "same latency, by fitting more sequences into the same memory.",
    ])
    emit("a18", st("Orca served 6.81"), "At the same median latency, Orca served 36.9 times the requests",
         yb + 32, b + [body],
         "Same model, same hardware, same median latency, drawn to scale. The gap is scheduling alone.")


# ---- a19 · P18: ragged shapes ---------------------------------------------------------------------
ORCA_REQ = [("x1", "decoding its 4th token", 1, 4), ("x2", "decoding its 2nd token", 1, 2),
            ("x3", "a 2-token prompt", 2, 2), ("x4", "a 3-token prompt", 3, 3)]


def a19():
    keys = [k for *_, k in ORCA_REQ]
    real, box_ = sum(keys), len(keys) * max(keys)
    assert (real, box_) == (11, 16)
    big = [7, 40, 900, 2000]
    pad_big = 1 - sum(big) / (len(big) * max(big))
    assert round(pad_big * 100) == 63
    b = [hd(40, 46, "Keys each request's new tokens must read this step, in Orca's example")]
    C, G = 22, 4
    for i, (name, what, q, k) in enumerate(ORCA_REQ):
        y = 70 + i * 32
        b.append(txt(40, y + 16, f"{name}: {what}", "cap"))
        for j in range(k):
            b.append(cell(236 + j * (C + G), y, C, 22, "s", rx=2))
        for j in range(4):
            x = 430 + j * (C + G)
            b.append(cell(x, y, C, 22, "s", rx=2) if j < k else ghost(x, y, C, 22, rx=2))
    b.append(txt(236, 210, "as they are: ragged", "sub2"))
    b.append(txt(430, 210, f"padded: {box_} cells for {real} real", "sub2"))
    body, yb = prose(254, [
        "Orca's paper follows four requests mid-flight. x1 is generating its 4th token, so its new "
        "token attends over 4 keys; x2 is on its 2nd; x3 and x4 have just arrived with prompts of 2 and "
        "3 tokens. Each request's next step has a different shape: different numbers of new tokens, "
        "and different numbers of keys behind them.",
        "A batched operation works on one tensor, a block of numbers laid out along several dimensions "
        "with every row the same length. Forcing these four into one means padding the short rows with "
        f"dummy entries: {box_} cells for {real} real ones. With lengths like 7, 40, 900 and 2,000 keys, "
        f"{round(pad_big * 100)}% of the rectangle would be padding.",
        "That is what Orca means by no guarantee that the next iteration can be merged into one batched "
        "operation.",
    ])
    emit("a19", st("But those requests now sit at different"), "Four requests mid-flight have four different shapes",
         yb + 32, b + [body],
         "A batched operation wants a rectangle. Requests at different points in their lives rarely "
         "form one, and padding them into one wastes most of it.")


# ---- a20 · P19: a linear layer, row by row ----------------------------------------------------------
ROWS = {"a": [1, 0], "b": [2, 1], "c": [0, 3]}
Wl = [[1, 2], [-1, 1]]
vm = lambda v, M: [sum(v[k] * M[k][j] for k in range(len(v))) for j in range(len(M[0]))]
OUTL = {k: vm(v, Wl) for k, v in ROWS.items()}
assert OUTL == {"a": [1, 2], "b": [1, 5], "c": [-3, 3]}
sgn = lambda v: f"{v}".replace("-", "−")


def mat(x, y, M, cls, C=30, G=4, hl=None):
    o = []
    for r, row in enumerate(M):
        for c, v in enumerate(row):
            o.append(cell(x + c * (C + G), y + r * (C + G), C, C - 4, cls if hl is None or hl == r else "u",
                          rx=3, label=sgn(v)))
    return o


def a20():
    b = [hd(40, 46, "One weight matrix W, three token rows: one at a time, then stacked")]
    for i, k in enumerate("abc"):
        y = 70 + i * 40
        b.append(txt(40, y + 18, f"row {k}", "cap"))
        b += mat(96, y, [ROWS[k]], "u")
        b.append(txt(170, y + 18, "× W =", "sub2"))
        b += mat(212, y, [OUTL[k]], "m")
    b.append(txt(96, 204, "W, the same for every row", "sub2"))
    b += mat(96, 212, Wl, "h")
    # stacked
    b.append(txt(340, 64, "stacked", "sub2"))
    b += mat(340, 70, [ROWS[k] for k in "abc"], "u")
    b.append(txt(414, 122, "×", "sub2", "middle"))
    b += mat(426, 87, Wl, "h")
    b.append(txt(504, 122, "=", "sub2", "middle"))
    b += mat(518, 70, [OUTL[k] for k in "abc"], "m")
    b.append(txt(340, 196, "[3 × 2] × [2 × 2] = [3 × 2]: one multiply, one read of W", "sub2"))
    a1 = ROWS["a"]
    body, yb = prose(310, [
        "A linear projection multiplies each token's vector by one weight matrix ({{fig:v01-o085}}). "
        f"Row a gives {nb(f'[{a1[0]} × 1 + {a1[1]} × (−1),')} {nb(f'{a1[0]} × 2 + {a1[1]} × 1] = [1, 2]')}; "
        f"b gives {nb('[1, 5]')}; c gives {nb('[−3, 3]')}.",
        "Stack the three rows into one matrix and multiply once, and the answer's rows are exactly the "
        "three separate answers. Each output row depends only on its own input row and the shared "
        "weights, never on which request the row came from or what the other rows hold.",
        "So rows from different requests, at any position in their sequences, can share one multiply "
        "and one read of W.",
    ])
    emit("a20", st("Most of a transformer layer treats"), "A linear layer treats every row on its own",
         yb + 32, b + [body],
         "Stacking changes nothing about any row's answer, which is exactly what makes stacking safe.")


# ---- a21 · P20: norms and the activation --------------------------------------------------------
TOK = [2, 4, 6, 8]


def a21():
    mu = sum(TOK) / 4
    var = sum((x - mu) ** 2 for x in TOK) / 4
    sd = math.sqrt(var)
    ln_ = [(x - mu) / sd for x in TOK]
    rms = math.sqrt(sum(x * x for x in TOK) / 4)
    rn = [x / rms for x in TOK]
    silu = lambda x: x / (1 + math.exp(-x))
    assert (mu, var) == (5, 5) and round(sd, 3) == 2.236 and round(rms, 3) == 5.477
    assert [round(v, 3) for v in ln_] == [-1.342, -0.447, 0.447, 1.342]
    assert [round(v, 3) for v in rn] == [0.365, 0.73, 1.095, 1.461]
    assert [round(silu(x), 3) for x in (-1, 0.5, 2)] == [-0.269, 0.311, 1.762]
    b = [hd(40, 46, "One token's four numbers, before and after each per-token step")]
    L, R = 210, 630
    rows = [("the token", TOK, 0, 10, [0, 5, 10]), ("layer norm", ln_, -2, 2, [-2, 0, 2]),
            ("RMS norm, Llama", rn, -2, 2, [-2, 0, 2])]
    for i, (lab, vals, lo, hi, ticks) in enumerate(rows):
        y = 84 + i * 56
        px_ = lambda v: L + (v - lo) / (hi - lo) * (R - L)
        b.append(txt(40, y + 4, lab, "cap"))
        b.append(ln(L, y, R, y, "axis"))
        for t_ in ticks:
            b.append(tick(px_(t_), y, px_(t_), y + 4))
            b.append(txt(round(px_(t_), 1), y + 17, sgn(t_), "sub2", "middle"))
        for v in vals:
            b.append(dot(round(px_(v), 1), y, "m", r=4))
        b.append(txt(L, y - 12, ", ".join(f(v, 3) if i else str(v) for v in vals), "sub2"))
    # SiLU
    ys = 84 + 3 * 56 + 6
    b.append(txt(40, ys + 4, "SiLU, Llama", "cap"))
    b.append(txt(L, ys + 4, "x ÷ (1 + e^(−x)):  −1 → −0.269,  0.5 → 0.311,  2 → 1.762", "sub2"))
    body, yb = prose(ys + 50, [
        f"Layer norm rescales one token's vector to average 0 and spread 1: subtract its mean, "
        f"{nb('(2 + 4 + 6 + 8) ÷ 4 = 5')}, then divide by its standard deviation, the square root of the "
        f"average squared distance from that mean: {nb(f'√((9 + 1 + 1 + 9) ÷ 4) = √5 = {f(sd, 3)}')}. A "
        "learned scale is applied after.",
        f"Llama's RMS norm skips the subtraction and divides by the root of the mean square, "
        f"{nb(f'√((4 + 16 + 36 + 64) ÷ 4) = √30 = {f(rms, 3)}')}. The activation function then works on "
        "each number alone; "
        "Llama's SiLU, x ÷ (1 + e^(−x)), passes large positives nearly unchanged and squeezes negatives "
        "towards 0.",
        "Every one of these needs only the token's own numbers, plus a few learned constants shared by "
        "all tokens. None asks which request the token came from.",
    ])
    emit("a21", st("the layer norms, the activation"), "Normalising and activating also look at one token at a time",
         yb + 32, b + [body],
         "With the projections, that covers everything in a layer except attention: all of it can run "
         "on any stack of tokens, from any mix of requests.")


# ---- a22 · P21: the flattened tensor and the split ------------------------------------------------
TOKS = [("x14", 0), ("x22", 1), ("x31", 2), ("x32", 2), ("x41", 3), ("x42", 3), ("x43", 3)]
KEYS = [("x11", 0, True), ("x12", 0, True), ("x13", 0, True), ("x14", 0, False), ("x21", 1, True),
        ("x22", 1, False), ("x31", 2, False), ("x32", 2, False), ("x41", 3, False), ("x42", 3, False),
        ("x43", 3, False)]


def allowed(q, k):
    """A query sees keys of its own request up to and including itself."""
    qn, qr = TOKS[q]
    kn, kr, _ = KEYS[k]
    return qr == kr and int(kn[2]) <= int(qn[2])


def a22():
    n_ok = sum(allowed(q, k) for q in range(7) for k in range(11))
    assert len(TOKS) == 1 + 1 + 2 + 3 and n_ok == 15 and 7 * 11 == 77
    b = [hd(40, 46, "Orca's batch: x1 and x2 decode one token each, x3 and x4 prefill 2 and 3")]
    # the flattened tensor
    b.append(txt(40, 70, "one [7 × H] tensor", "sub2"))
    for i, (name, r) in enumerate(TOKS):
        y = 78 + i * 22
        b.append(cell(70, y, 120, 18, "u", rx=2, label=name))
    for r, (a_, e_) in enumerate([(0, 0), (1, 1), (2, 3), (4, 6)]):
        y1, y2 = 78 + a_ * 22, 78 + e_ * 22 + 18
        b.append(ln(62, y1 + 1, 62, y2 - 1, "tick"))
        b.append(txt(54, (y1 + y2) / 2 + 4, f"x{r + 1}", "sub2", "end"))
    b.append(txt(40, 254, "projections: one multiply,", "sub2"))
    b.append(txt(40, 270, "[7 × H] × [H × 3H]", "sub2"))
    # the attention grid
    GX, GY, C = 280, 96, 30
    for k, (name, r, cached) in enumerate(KEYS):
        b.append(txt(GX + k * C + C / 2, GY - 8, name, "sub2", "middle"))
    for q, (name, r) in enumerate(TOKS):
        y = GY + q * 22
        b.append(txt(GX - 8, y + 14, name, "sub2", "end"))
        for k in range(11):
            x = GX + k * C
            if allowed(q, k):
                b.append(cell(x + 1, y + 1, C - 2, 18, "m", rx=2))
            else:
                b.append(ghost(x + 1, y + 1, C - 2, 18, rx=2))
    b.append(txt(GX, GY - 26, "attention: which keys each token may see", "sub2"))
    b.append(txt(GX, GY + 7 * 22 + 18, "x11 to x13 and x21 come from the cache", "sub2"))
    body, yb = prose(306, [
        "Orca's example: x1 and x2 are decoding, one new token each (x14 and x22), and x3 and x4 have "
        "just arrived with prompts of 2 and 3 tokens: 7 tokens in all. Stacked, they form one [7 × H] "
        "tensor, H numbers per token, and the projections run as a single multiply with one read of the "
        "weights for all seven.",
        "Attention is split out. A token may look only at its own request's tokens up to itself, cached "
        "or new ({{fig:v03-o020}}): x14 sees x11 to x14, x22 sees x21 and x22, x32 sees x31 and x32. Of "
        f"the 77 query-key pairs, {n_ok} are allowed, in blocks along the diagonal.",
        "So attention runs request by request, each on its own block, and the results are stacked back "
        "into [7 × H] for the next projection.",
    ])
    emit("a22", st("four requests contribute seven tokens"),
         "Seven tokens from four requests run as one matrix, then split for attention", yb + 32, b + [body],
         "Stacked where nothing mixes, split where something does. The blank cells are why attention "
         "cannot be one batched rectangle.")


# ---- o007 -----------------------------------------------------------------------------------------
def o007():
    b = [hd(40, 46, "One transformer layer under selective batching, top to bottom")]
    steps = [("layer norm", "s", None), ("Q, K, V projection", "s", None), ("attention", "h", 4),
             ("output projection", "s", None), ("layer norm", "s", None), ("feed-forward network", "s", None)]
    y = 66
    for i, (lab, cls, split) in enumerate(steps):
        if split:
            for k in range(split):
                b.append(cell(40 + k * 61, y, 55, 30, cls, rx=4, label=f"x{k + 1}"))
        else:
            b.append(cell(40, y, 238, 30, cls, rx=4, label=lab))
        if i < len(steps) - 1:
            b.append(arr(159, y + 31, 159, y + 41))
        y += 44
    b.append(txt(300, 82, "all 7 tokens as one [7 × H] tensor:", "sub2"))
    b.append(txt(300, 98, "one read of each weight matrix", "sub2"))
    b.append(txt(300, 170, "attention, split by request: each token", "sub2"))
    b.append(txt(300, 186, "sees only its own; no weights to read", "sub2"))
    b.append(txt(300, 218, "merged back into [7 × H]", "sub2"))
    w_m = LAYER_W8 / 1e6
    assert round(w_m) == 218
    body, yb = prose(y + 20, [
        "Selective batching does both at once: it batches every other operation across all the tokens "
        "together and splits attention out to run request by request. Orca's engine splits the [7 × H] "
        "tensor just before attention and merges the four results back just after.",
        "Splitting costs almost nothing, and the reason reaches back to why batching worked at all. "
        "Batching pays by making one read of the weights serve many requests. Attention has no weights "
        "of its own, only keys and values that belong to individual requests, so there was never "
        f"anything there to share. In Llama 3 8B all {round(w_m)} million weights of a layer sit in the "
        "batched steps; attention holds none.",
    ])
    emit("o007", st("Selective batching does both"), "Selective batching: one matrix for everything but attention",
         yb + 32, b + [body],
         "A neat consequence: the operation that refuses to batch is exactly the operation that had "
         "nothing to gain from batching.")


if __name__ == "__main__":
    for fn in (o006, a16, a17, a18, a19, a20, a21, a22, o007):
        fn()
