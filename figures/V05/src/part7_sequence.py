"""V5 Part 7, sequence parallelism and ring attention: N31-N35 of plans/depth_pass/V05_review.md,
with Fig 19 rebuilt and Fig 20 redrawn on four GPUs with its names restored.

  python3 figures/V05/src/part7_sequence.py     writes items o019, o020, n31-n35
"""
import json, math
from v05common import *  # noqa: F401,F403

N = 4                                                   # GPUs in the worked ring
PAIR = QH * HEAD * 2 * 2                                # operations per query-key pair per layer
TOKB = 2 * KVH * HEAD * BYTES                           # key and value bytes per token per layer
assert PAIR == 32_768 and TOKB == 4_096 and TOKB * LAYERS == KV_PER_TOKEN


def holds(g, t):
    """The key-value block GPU g holds at step t, all counted from 0: blocks move one GPU on."""
    return (g - t) % N


# ---- Fig 19: split the input ---------------------------------------------------------------------
def o019():
    b = [hd(40, 40, "Sixteen tokens of one sequence, cut into four chunks")]
    xs = [40 + i * 35 + (i // 4) * 10 for i in range(16)]
    for i, x in enumerate(xs):
        b.append(cell(x, 58, 32, 30, "s", label=f"t{i + 1}"))
    for k in range(1, 4):
        cx = (xs[4 * k - 1] + 32 + xs[4 * k]) / 2
        b.append(mark(cx, 50, cx, 96, ok=False))
    for k in range(4):
        x0 = xs[4 * k]
        b.append(txt(x0, 114, f"GPU {k + 1}", "sub2"))
        b.append(txt(x0, 130, f"t{4 * k + 1}–t{4 * k + 4}'s K, V", "sub2"))
    body, yb = prose(176, [
        "Every strategy so far has split the model. Sequence parallelism, also called context "
        "parallelism, splits the input instead: each GPU holds one chunk of the token sequence, "
        "and the keys and values for those tokens only.",
        "Each GPU still runs every layer, on its own chunk of tokens. What it no longer holds is "
        "anyone else's part of the cache.",
    ])
    emit("o019", stamp(SRT, "Every strategy so far has split"),
         "Sequence parallelism splits the input, not the model", yb + 26, b + [body],
         "Also called context parallelism. Of the five splits, it is the only one that keeps "
         "dividing the cache as the context grows.")


# ---- N31: a million tokens over eight GPUs -------------------------------------------------------
def n31():
    tokens, gpus = 1_000_000, 8
    whole, each = KV_PER_TOKEN * tokens, KV_PER_TOKEN * tokens / gpus
    assert f(whole / 1e9, 1) == "327.7" and f(each / 1e9, 1) == "41.0"
    X0, W = 160, 480
    SC = W / whole
    b = [hd(40, 40, "The cache of one million-token sequence, every bar on one scale")]
    b.append(txt(40, 76, "on one GPU", "cap"))
    b.append(cell(X0, 58, W, 28, "h", label=f"1,000,000 tokens: {f(whole / 1e9, 1)} GB"))
    b.append(txt(40, 128, "on eight GPUs", "cap"))
    for k in range(gpus):
        b.append(cell(X0 + k * each * SC, 110, each * SC - 3, 28, "s", label=f"{f(each / 1e9, 0)} GB"))
    edge = X0 + B200_MEM * SC
    b.append(mark(edge, 46, edge, 56, ok=False))
    b.append(mark(edge, 88, edge, 100, ok=False))
    b.append(txt(edge + 6, 48, "one B200: 192 GB", "sub2"))
    b.append(hd(40, 186, "What each split divides the cache by"))
    rows = [("tensor", "up to 8: one KV head per GPU ({{fig:v05-n15}})"),
            ("pipeline", "the number of stages: each keeps its own layers"),
            ("sequence", "the number of GPUs, as many as the context needs")]
    for k, (a, s) in enumerate(rows):
        b.append(txt(40, 214 + k * 22, a, "cap"))
        b.append(txt(160, 214 + k * 22, s, "sub2"))
    body, yb = prose(306, [
        f"A million tokens at {n(KV_PER_TOKEN)} bytes each is {f(whole / 1e9, 1)} GB, more than a "
        f"B200 holds. Cut the sequence into eight chunks of 125,000 tokens and each GPU keeps "
        f"125,000 × {n(KV_PER_TOKEN)} = {f(each / 1e9, 2)} GB.",
        "The other splits divide the cache too, but by factors fixed by the model's shape. Only "
        "splitting the sequence keeps dividing as the context grows: twice the tokens, twice the "
        "GPUs, and the same 41 GB on each.",
    ])
    emit("n31", stamp(SRT, "That directly answers the KV cache"),
         "Eight GPUs turn a 328 GB cache into 41 GB each", yb + 26, b + [body],
         "Bars to scale. This directly answers the cache overflow of Part 1 ({{ref:v05-n2}}): a context "
         "too long for one GPU can now spread its cache across many.")


# ---- N32: the score grid -------------------------------------------------------------------------
GX, GY, GW, GH = 230, 82, 80, 40


def n32():
    local = N
    remote = N * N - N
    causal_empty = N * (N - 1) // 2
    assert remote / (N * N) == 0.75 and causal_empty == 6
    b = [hd(40, 34, "Every query against every key: 16 blocks over four GPUs")]
    for c in range(N):
        b.append(txt(GX + c * (GW + 4) + GW / 2, 58, "K, V of", "sub2", "middle"))
        b.append(txt(GX + c * (GW + 4) + GW / 2, 72, f"chunk {c + 1}", "sub2", "middle"))
    for r in range(N):
        y = GY + r * (GH + 4)
        b.append(txt(40, y + 25, f"GPU {r + 1}'s queries", "cap"))
        for c in range(N):
            loc = r == c
            b.append(cell(GX + c * (GW + 4), y, GW, GH, "s" if loc else "h",
                          label="its own" if loc else "elsewhere"))
    body, yb = prose(GY + N * (GH + 4) + 40, [
        "Attention is what makes this hard. Every query must compare against every key and value "
        "({{fig:v03-o021}}), and each query's output is a weighted average over all of them "
        "({{fig:v01-o094}}).",
        f"Cut the sequence in four: GPU k holds the queries of chunk k and the keys and values of "
        f"chunk k. Of the 16 blocks of the score grid only the {local} on the diagonal pair a GPU's "
        f"queries with its own keys. The other {remote}, three quarters, need keys and values that "
        "live on another chip.",
    ])
    emit("n32", stamp(SRT, "Attention is what makes this hard"),
         "Three quarters of the score grid needs someone else's keys", yb + 26, b + [body],
         "With N GPUs only N of the N × N blocks are local. Under the causal mask, where a token may "
         "look only at earlier tokens ({{ref:v03-o020}}), the six blocks above the diagonal are empty, so the GPUs are "
         "also loaded unevenly.")


# ---- Fig 20: the ring ----------------------------------------------------------------------------
def o020():
    from part3_tensor import box2
    pos = [(270, 58), (470, 140), (270, 222), (70, 140)]
    BW, BH = 140, 44
    b = [hd(40, 40, "Four GPUs: queries stay put, key-value blocks go round")]
    for g, (x, y) in enumerate(pos):
        b.append(box2(x, y, BW, BH, "s", f"GPU {g + 1}", f"queries Q{g + 1}, holds KV{g + 1}"))
    b.append(arr(410, 84, 498, 134))
    b.append(arr(540, 188, 410, 240))
    b.append(arr(270, 248, 182, 188))
    b.append(arr(140, 134, 270, 84))
    b.append(txt(340, 168, "blocks move one GPU on,", "sub2", "middle"))
    b.append(txt(340, 186, "every step", "sub2", "middle"))
    body, yb = prose(320, [
        "The fix is a 2023 technique called Ring Attention (Liu, Zaharia and Abbeel), which arranges "
        "the GPUs in a ring. Each computes attention for its own queries against the key-value block "
        "it holds, then passes that block to its neighbour while receiving the next one. After a full "
        "trip around the ring, every query has seen every block.",
        "Context length is then bounded not by one GPU's memory but by the ring's combined memory. "
        "That is part of the machinery behind the million-token windows of models like DeepSeek V4, "
        "and the 10-million-token window of Meta's Llama 4 Scout.",
    ])
    emit("o020", stamp(SRT, "a 2023 technique called ring attention"),
         "Ring attention: the keys and values travel, the queries stay", yb + 26, b + [body],
         "Only key-value blocks ever move. Overlapping that movement with computation is the idea that "
         "hid the pipeline's transfers ({{ref:v05-n20}}), applied to a harder pattern.")


# ---- N33: the rotation, stepped (widget) ---------------------------------------------------------
TX, TY, TCW, TCH = 120, 84, 50, 28                      # the schedule table
RX, RY, RCW, RCH = 400, 84, 52, 28                      # the score grid

WIDGET33 = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const C = __C__, q = s => fig.querySelector(s), btn = [...fig.querySelectorAll('button')];
  let t = 0;
  function draw() {
    for (let s = 0; s < C.N; s++) q(`[data-row="${s}"]`).setAttribute('class', s === t ? 'm' : 'u');
    for (let g = 0; g < C.N; g++) for (let s = 0; s < C.N; s++) {
      const b = ((g - s) % C.N + C.N) % C.N, on = s <= t;
      q(`[data-g="${g}-${b}"]`).setAttribute('class', on ? 's' : 'u0');
      q(`[data-gr="${g}-${b}"]`).setAttribute('style', on ? '' : 'fill:none;stroke:var(--rule);stroke-dasharray:3 3');
      q(`[data-gt="${g}-${b}"]`).textContent = on ? `step ${s + 1}` : '';
    }
    q('[data-step]').textContent = `step ${t + 1} of ${C.N}: ` + (t === 0 ? 'each GPU uses the block it already holds'
      : `each GPU uses the block that arrived from the GPU before it`);
    q('[data-moves]').textContent = `transfers so far: ${t} of ${C.N - 1}; blocks met: ${(t + 1) * C.N} of ${C.N * C.N}`;
    btn[0].disabled = t === 0; btn[1].disabled = t === C.N - 1;
  }
  btn[0].addEventListener('click', () => { t = Math.max(t - 1, 0); draw(); });
  btn[1].addEventListener('click', () => { t = Math.min(t + 1, C.N - 1); draw(); });
  btn[2].addEventListener('click', () => { t = 0; draw(); });
  draw();
})();</script>"""


def n33_state(t):
    step = f"step {t + 1} of {N}: " + ("each GPU uses the block it already holds" if t == 0 else
                                       "each GPU uses the block that arrived from the GPU before it")
    moves = f"transfers so far: {t} of {N - 1}; blocks met: {(t + 1) * N} of {N * N}"
    lit = {(g, holds(g, s)): s for g in range(N) for s in range(t + 1)}
    return step, moves, lit


def n33():
    assert sorted(holds(g, t) for t in range(N) for g in range(N)) == sorted(list(range(N)) * N)
    assert all(sorted(holds(g, t) for t in range(N)) == list(range(N)) for g in range(N))
    t0 = 0
    step, moves, lit = n33_state(t0)
    s = [hd(40, 34, "Which block each GPU holds, step by step, and the grid it fills")]
    for g in range(N):
        s.append(txt(TX + g * (TCW + 4) + TCW / 2, 70, f"GPU {g + 1}", "sub2", "middle"))
    for t in range(N):
        y = TY + t * (TCH + 4)
        s.append(txt(40, y + 19, f"step {t + 1}", "cap"))
        cells = "".join(f'<rect x="{TX + g * (TCW + 4)}" y="{y}" width="{TCW}" height="{TCH}" rx="3"/>'
                        f'<text class="sub" x="{TX + g * (TCW + 4) + TCW / 2}" y="{y + TCH / 2}" '
                        f'text-anchor="middle" dominant-baseline="central">KV{holds(g, t) + 1}</text>'
                        for g in range(N))
        s.append(f'<g class="{"m" if t == t0 else "u"}" data-row="{t}">{cells}</g>')
    for c in range(N):
        s.append(txt(RX + c * (RCW + 4) + RCW / 2, 70, f"KV{c + 1}", "sub2", "middle"))
    for g in range(N):
        y = RY + g * (RCH + 4)
        s.append(txt(RX - 8, y + 19, f"Q{g + 1}", "sub2", "end"))
        for c in range(N):
            x = RX + c * (RCW + 4)
            on = (g, c) in lit
            st = "" if on else ' style="fill:none;stroke:var(--rule);stroke-dasharray:3 3"'
            s.append(f'<g class="{"s" if on else "u0"}" data-g="{g}-{c}"><rect x="{x}" y="{y}" '
                     f'width="{RCW}" height="{RCH}" rx="3" data-gr="{g}-{c}"{st}/>'
                     f'<text class="sub" x="{x + RCW / 2}" y="{y + RCH / 2}" text-anchor="middle" '
                     f'dominant-baseline="central" data-gt="{g}-{c}">{f"step {lit[(g, c)] + 1}" if on else ""}'
                     f'</text></g>')
    yr = TY + N * (TCH + 4) + 26
    s.append(f'<text class="sub2" x="40" y="{yr}" data-step="">{esc(step)}</text>')
    s.append(f'<text class="sub2" x="40" y="{yr + 20}" data-moves="">{esc(moves)}</text>')
    body, yb = prose(yr + 64, [
        "Step 1: each GPU computes its own queries against the block it already holds, the diagonal "
        "of the grid. Then every GPU passes its key-value block to the next GPU round the ring while "
        "receiving one from the GPU before it, and step 2 uses the block that arrived.",
        "After four steps, four rounds of compute and three of transfer, every GPU's queries have "
        "met every block. No GPU holds more than two blocks at once: the one in use and the one "
        "arriving. Step through it; the schedule was checked against the same rotation in Python.",
    ])
    s.append(body)
    ctl = ["<button type='button'>Back</button><button type='button'>Step</button>"
           "<button type='button'>Reset</button>"]
    js = WIDGET33.replace("__C__", json.dumps({"N": N}))
    emit_raw("n33", widget("n33", stamp(SRT, "Each one computes attention against the"),
                           "After four steps, every GPU has met every block", ctl, yb + 24, s,
                           "The schedule is a rotation fixed in advance: nothing in it depends on the "
                           "data, so every transfer can start before it is needed.", js))


# ---- N34: partial answers merge exactly ----------------------------------------------------------
def partial(scores, values):
    m = max(scores)
    w = [math.exp(x - m) for x in scores]
    return m, sum(w), sum(a * v for a, v in zip(w, values))


def n34():
    s1, v1, s2, v2 = [1, 3], [10, 20], [5, 2], [30, 40]
    m1, l1, o1 = partial(s1, v1)
    m2, l2, o2 = partial(s2, v2)
    M = max(m1, m2)
    c1 = math.exp(m1 - M)
    L, O = l1 * c1 + l2 * math.exp(m2 - M), o1 * c1 + o2 * math.exp(m2 - M)
    md, ld, od = partial(s1 + s2, v1 + v2)
    assert abs(O / L - od / ld) < 1e-12 and f(O / L, 4) == f(od / ld, 4) == "28.9847"
    assert f(c1, 3) == "0.135"
    heads = [("largest", "score"), ("weights", "add to"), ("weighted", "sum"), ("answer", "")]
    cx = [300, 385, 470, 555]
    b = [hd(40, 40, "One query, four keys: two blocks on two GPUs, then merged")]
    for x, (h1, h2) in zip(cx, heads):
        b.append(txt(x + 40, 66, h1, "sub2", "middle"))
        if h2:
            b.append(txt(x + 40, 80, h2, "sub2", "middle"))
    rows = [("block 1, on GPU 1", "scores 1, 3; values 10, 20", "m", (m1, l1, o1, o1 / l1)),
            ("block 2, on GPU 2", "scores 5, 2; values 30, 40", "m", (m2, l2, o2, o2 / l2)),
            ("merged", f"block 1 × e^(3 − 5) = {f(c1, 3)}, then add", "s", (M, L, O, O / L)),
            ("one softmax over all four", "scores 1, 3, 5, 2; values 10…40", "u", (md, ld, od, od / ld))]
    for k, (l1_, l2_, c, vals) in enumerate(rows):
        y = 94 + k * 50
        b.append(txt(40, y + 14, l1_, "cap"))
        b.append(txt(40, y + 30, l2_, "sub2"))
        for x, v, d in zip(cx, vals, (0, 3, 2, 4)):
            b.append(cell(x, y, 80, 32, c, label=f(v, d)))
    body, yb = prose(318, [
        "Each GPU's pass over one block leaves three numbers per query: the largest score it saw, the "
        "sum of its weights e^(score − largest), and the weighted sum of its values, the online "
        "softmax of {{fig:v03-o057}}. Values here are single numbers; in a model they are vectors, "
        "handled the same way.",
        f"Two partials merge by rescaling the one with the smaller maximum by e to the difference, "
        f"here e^(3 − 5) = {f(c1, 3)}, then adding. The result is identical to one softmax over all "
        "four scores, the same exactness as {{fig:v03-o059}}.",
    ])
    emit("n34", stamp(SRT, "every query has seen every block"),
         "Partial answers from different blocks merge exactly", yb + 26, b + [body],
         "Exact merging is what lets the blocks arrive in any order: each step folds its partial into "
         "a running total, so the ring never needs the whole sequence in one place.")


# ---- N35: work against transfer (widget) ---------------------------------------------------------
CS = [10, 20, 50, 100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 125_000, 200_000,
      500_000, 1_000_000]
BS = [12.5, 25, 50, 100, 200, 450, 900]
BL = ["12.5", "25", "50", "100", "200", "450", "900"]
C0, B0 = CS.index(125_000), BS.index(50)
PL, PR, PT, PB = 110, 620, 64, 284                      # plot box
YLO, YHI = 1e-9, 1e2                                    # seconds


def times(c, bgb):
    return c * c * PAIR / H100_FLOPS, c * TOKB / (bgb * 1e9)


def tfmt(sec):
    if sec >= 1:
        return f(sec, 2) + " s"
    for scale, unit in ((1e3, "ms"), (1e6, "µs")):
        v = sec * scale
        if v >= 1:
            return (f(v, 2) if v < 10 else f(v, 1)) + " " + unit
    v = sec * 1e9
    return (f(v, 2) if v < 10 else f(v, 1)) + " ns"


def verdict(c, bgb):
    w, x = times(c, bgb)
    r = w / x
    return (f"compute is {f(r, 1)}× the transfer: hidden" if r >= 1 else
            f"transfer is {f(1 / r, 1)}× the compute: exposed")


def cstar(bgb):
    return H100_FLOPS * TOKB / (PAIR * bgb * 1e9)


def lx(c):
    return log_px(c, 10, 1e6, PL, PR)


def ly(sec):
    return PB - (math.log10(sec) - math.log10(YLO)) / (math.log10(YHI) - math.log10(YLO)) * (PB - PT)


def curve(fn):
    return " ".join(f"{lx(c):.1f},{ly(fn(c)):.1f}" for c in [10 ** (1 + k / 10) for k in range(51)])


WIDGET35 = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const C = __C__, q = s => fig.querySelector(s);
  const sl = [...fig.querySelectorAll('input[type=range]')], val = [...fig.querySelectorAll('.val')];
  const fmt = (v, d) => { const s = Math.abs(v).toFixed(d), [i, p] = s.split('.');
    return (v < 0 && +s !== 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (p ? '.' + p : ''); };
  const lg = Math.log10, lx = c => C.PL + (lg(c) - 1) / 5 * (C.PR - C.PL);
  const ly = s => C.PB - (lg(s) - lg(C.YLO)) / (lg(C.YHI) - lg(C.YLO)) * (C.PB - C.PT);
  function tfmt(sec) {
    if (sec >= 1) return fmt(sec, 2) + ' s';
    for (const [k, u] of [[1e3, 'ms'], [1e6, 'µs']]) { const v = sec * k; if (v >= 1) return (v < 10 ? fmt(v, 2) : fmt(v, 1)) + ' ' + u; }
    const v = sec * 1e9; return (v < 10 ? fmt(v, 2) : fmt(v, 1)) + ' ns';
  }
  function draw() {
    const c = C.CS[+sl[0].value], b = C.BS[+sl[1].value];
    val[0].textContent = fmt(c, 0); val[1].textContent = C.BL[+sl[1].value];
    const w = c * c * C.PAIR / C.F, x = c * C.TOKB / (b * 1e9), r = w / x, cs = C.F * C.TOKB / (C.PAIR * b * 1e9);
    const pts = []; for (let k = 0; k <= 50; k++) { const cc = 10 ** (1 + k / 10);
      pts.push(`${lx(cc).toFixed(1)},${ly(cc * C.TOKB / (b * 1e9)).toFixed(1)}`); }
    q('[data-tr]').setAttribute('points', pts.join(' '));
    q('[data-vline]').setAttribute('x1', lx(c).toFixed(1)); q('[data-vline]').setAttribute('x2', lx(c).toFixed(1));
    q('[data-dw]').setAttribute('cx', lx(c).toFixed(1)); q('[data-dw]').setAttribute('cy', ly(w).toFixed(1));
    q('[data-dx]').setAttribute('cx', lx(c).toFixed(1)); q('[data-dx]').setAttribute('cy', ly(x).toFixed(1));
    q('[data-w]').textContent = `compute, one step of one layer: ${tfmt(w)}`;
    q('[data-x]').textContent = `transfer of the next block: ${tfmt(x)}`;
    q('[data-v]').textContent = r >= 1 ? `compute is ${fmt(r, 1)}× the transfer: hidden`
                                       : `transfer is ${fmt(1 / r, 1)}× the compute: exposed`;
    q('[data-cs]').textContent = `blocks above ${fmt(cs, 0)} tokens hide their transfer at ${C.BL[+sl[1].value]} GB/s`;
  }
  sl.forEach(s => s.addEventListener('input', draw));
  q('button').addEventListener('click', () => { sl[0].value = C.c0; sl[1].value = C.b0; draw(); });
  draw();
})();</script>"""


def n35():
    c, bgb = CS[C0], BS[B0]
    w, x = times(c, bgb)
    assert tfmt(w) == "517.7 ms" and tfmt(x) == "10.2 ms" and f(w / x, 1) == "50.6"
    assert f(cstar(50), 0) == "2,473" and f(cstar(450), 0) == "275"
    decode_ratio = TOKB * H100_FLOPS / (PAIR * NET_EACH_WAY)            # one query: transfer ÷ compute
    assert f(decode_ratio, 1) == "2,472.5"
    s = [hd(40, 34, "Time per step per layer, both axes logarithmic")]
    s.append(ln(PL, PB, PR, PB, "axis"))
    s.append(ln(PL, PT, PL, PB, "axis"))
    for k, lab in enumerate(["10", "100", "1,000", "10k", "100k", "1M"]):
        xx = lx(10 ** (k + 1))
        s.append(ln(xx, PB, xx, PB + 4, "tick"))
        s.append(txt(xx, PB + 18, lab, "sub2", "middle"))
    s.append(txt((PL + PR) / 2, PB + 36, "block size c, tokens", "sub2", "middle"))
    for v, lab in ((1e-9, "1 ns"), (1e-6, "1 µs"), (1e-3, "1 ms"), (1, "1 s"), (1e2, "100 s")):
        s.append(txt(PL - 8, ly(v) + 4, lab, "sub2", "end"))
        s.append(ln(PL - 4, ly(v), PL, ly(v), "tick"))
    s.append(f'<polyline class="pl-m" points="{curve(lambda cc: times(cc, bgb)[0])}"/>')
    s.append(f'<polyline class="pl-h" points="{curve(lambda cc: times(cc, bgb)[1])}" data-tr=""/>')
    for k, (cls, lab) in enumerate((("pl-m", "compute: c × c × 32,768 operations"),
                                    ("pl-h", "transfer: c × 4,096 bytes"))):
        yy = PT + 12 + k * 20                     # the top-left corner, which no line reaches
        s.append(poly([(PL + 12, yy - 4), (PL + 36, yy - 4)], cls))
        s.append(txt(PL + 44, yy, lab, "sub2"))
    s.append(f'<line class="axis" x1="{lx(c):.1f}" y1="{PT}" x2="{lx(c):.1f}" y2="{PB}" '
             f'stroke-dasharray="3 3" data-vline=""/>')
    for attr, yy, col in (("data-dw", ly(w), "--m"), ("data-dx", ly(x), "--h")):
        s.append(f'<circle cx="{lx(c):.1f}" cy="{yy:.1f}" r="4" fill="var(--paper)" stroke="var({col})" '
                 f'stroke-width="1.5" {attr}=""/>')
    yr = PB + 64
    s.append(f'<text class="sub2" x="{PL}" y="{yr}" data-w="">compute, one step of one layer: {tfmt(w)}</text>')
    s.append(f'<text class="sub2" x="{PL}" y="{yr + 18}" data-x="">transfer of the next block: {tfmt(x)}</text>')
    s.append(f'<text class="sub2" x="{PL}" y="{yr + 36}" data-v="">{verdict(c, bgb)}</text>')
    s.append(f'<text class="sub2" x="{PL}" y="{yr + 54}" data-cs="">blocks above {f(cstar(bgb), 0)} tokens '
             f'hide their transfer at {BL[B0]} GB/s</text>')
    body, yb = prose(yr + 100, [
        "Per step, per layer, a GPU holding a block of c tokens computes c queries against c keys: "
        "c × c × 32,768 operations for the 70B, since each of 64 query heads does 2 × 128 for a score "
        "and 2 × 128 to weight a value. Meanwhile it passes on c tokens' keys and values: c × 4,096 "
        "bytes, for 8 KV heads × 128 numbers × 2 bytes, key and value.",
        "Work grows with c², transfer with c, so a big enough block always hides its transfer. They "
        f"are equal where c = F ÷ (8 × B): {f(cstar(50), 0)} tokens over a 50 GB/s network, "
        f"{f(cstar(450), 0)} over NVLink's 450. Ring Attention's paper derives the same condition, "
        "block ≥ FLOPS ÷ bandwidth, for attention without grouped keys and values.",
        f"At a million tokens over eight GPUs, c = 125,000: {f(w * 1e3, 0)} ms of compute per step "
        f"against {f(x * 1e3, 0)} ms of transfer, {f(w / x, 0)} times over. The widget's arithmetic "
        "was checked against Python at every setting.",
    ])
    s.append(body)
    ctl = [f"<label>block size c <input type='range' min='0' max='{len(CS) - 1}' step='1' value='{C0}'>"
           f"<span class='val'>{n(c)}</span></label>"
           f"<label>link GB/s each way <input type='range' min='0' max='{len(BS) - 1}' step='1' value='{B0}'>"
           f"<span class='val'>{BL[B0]}</span></label>", "<button type='button'>Reset</button>"]
    C = {"CS": CS, "BS": BS, "BL": BL, "PAIR": PAIR, "TOKB": TOKB, "F": H100_FLOPS, "PL": PL, "PR": PR,
         "PT": PT, "PB": PB, "YLO": YLO, "YHI": YHI, "c0": C0, "b0": B0}
    js = WIDGET35.replace("__C__", json.dumps(C))
    emit_raw("n35", widget("n35", stamp(SRT, "What makes it work is the timing"),
                           "Work grows with the square of the block, transfer only with its length",
                           ctl, yb + 24, s,
                           "Ideal rates at 989 TFLOPS. In decode there is one query, the work collapses to "
                           "a line, and the transfer would take about 2,500 times the compute, so ring "
                           "attention is a prefill tool; for decode, Meta's context-parallel serving "
                           "(2024) passes the query round the ring instead of the keys and values.", js))


if __name__ == "__main__":
    for fn in (o019, n31, n32, o020, n33, n34, n35):
        fn()
