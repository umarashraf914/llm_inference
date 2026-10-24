"""V7 Part 2, second half: the ceiling the caches put on the batch, and paging. Review section C
(P7-P15) and the rebuild of Fig 5 (o005).

  o005     shared weights against private caches: the one thing no two requests share
  a07  P7  128 KiB of cache per token on Llama 3 8B, built term by term
  a08  P8  attention's reads stay at 4 operations per byte, whatever the batch
  a09  P9  widget: intensity against batch once the caches count; a context slider
  a10  P10 what fills an 80 GB card, and how many requests fit at three context lengths
  a11  P11 out of room at 55, out of arithmetic at 295
  a12  P12 contiguous reservations: 2,450 of 10,592 slots hold real tokens
  a13  P13 widget: a token's address by division and a block table
  a14  P14 blocks on demand: at most 15 empty slots per request
  a15  P15 the vLLM paper's measurement: 20.4-38.2% before, 96.3% after

  python3 figures/V07/src/p2_ceiling.py

Source for a12 and a15: Kwon et al., "Efficient Memory Management for Large Language Model Serving
with PagedAttention", SOSP 2023 (arXiv 2309.06180): Figure 2 (20.4% Orca-Max, 26.8% Orca-Pow2, 38.2%
Orca-Oracle, 96.3% vLLM), the three reservation rules in section 6.1, default block size 16 in 7.2.
"""
import json
import math
from v07common import *  # noqa: F401,F403

CTX = [256, 512, 1024, 2048, 4096, 8192, 16384, 32768]
WORK = 4e9                                         # activations and buffers: an assumption, labelled
POOL = HBM - W8 - WORK
assert round(POOL / 1e9, 2) == 59.94


def cache(ctx):
    return KV8 * ctx                               # bytes one request's cache holds


def intensity(n, ctx):
    """Operations per byte for a decode step of n requests, each with ctx tokens cached."""
    c = cache(ctx)
    return n * (W8 + 4 * c) / (W8 + n * c)         # 2P ops per token = W8 numerically; attention 4 per cache byte


assert abs(2 * P8 - W8) < 1 and ATT8 * 2048 == 4 * cache(2048)
assert [round(intensity(n, 2048), 1) for n in (8, 32, 64, 128, 256, 1024)] == [7.5, 22.2, 33.0, 43.5, 51.7, 60.3]
LIM = lambda ctx: W8 / cache(ctx) + 4
assert round(LIM(2048), 1) == 63.8 and round(LIM(8192), 2) == 18.95
FIT = lambda ctx: int(POOL // cache(ctx))
assert [FIT(2048), FIT(8192), FIT(32768)] == [223, 55, 13]          # the review's 14 at 32K rounds up


def fsize(c):
    return f"{f(c / 1e9, 2)} GB" if c >= 1e9 else (f"{f(c / 1e6, 0)} MB" if c >= 1e8 else f"{f(c / 1e6, 1)} MB")


# ---- o005 -----------------------------------------------------------------------------------------
def o005():
    b = [hd(40, 46, "Shared by every request, against owned by one")]
    b.append(box(40, 70, 130, 126, "s", "the weights", "read once", rx=6))
    for i in range(4):
        y = 70 + i * 34
        b.append(arr(176, 133, 214, y + 12))
        b.append(cell(220, y, 90, 24, "u", label=f"request {i + 1}"))
        b.append(cell(372, y, 142, 24, "h", label=f"request {i + 1}'s KV cache"))
        b.append(arr(520, y + 12, 544, y + 12))
        b.append(cell(550, y, 90, 24, "u", label=f"request {i + 1}"))
    b.append(txt(40, 222, "one read serves the whole batch", "sub2"))
    b.append(txt(372, 222, "one read per request, on every step", "sub2"))
    body, yb = prose(270, [
        "The weights are identical for every request, which is why one read of them serves the whole "
        "batch. A KV cache is the opposite: every request carries its own keys and values, the vectors "
        "attention computed for each of its earlier tokens and keeps so that it never recomputes them, "
        "the running record of its own sequence ({{fig:v01-o136}}).",
        "So attention has to read each request's cache separately, one read per request on every step. "
        "Those reads grow with the batch, and none of them is shared. Two consequences follow, and the "
        "next figures work out both: attention's reads never amortise, and the caches decide how many "
        "requests fit on the card.",
    ])
    emit("o005", st("Suppose the batch does stay full"), "The one thing no two requests share",
         yb + 32, b + [body],
         "Two separate consequences from one fact: the cache is why attention will not amortise, and it "
         "is also why the batch cannot grow past a few tens at long contexts.")


# ---- a07 · P7 -------------------------------------------------------------------------------------
def a07():
    b = [hd(40, 46, "bytes of cache per token = 2 × layers × KV heads × numbers per head × bytes each")]
    terms = [("2, K and V", "u"), ("32 layers", "u"), ("8 KV heads", "u"), ("128 numbers", "u"),
             ("2 bytes", "u"), (f"{fc(KV8)} bytes", "m")]
    widths = [86, 78, 84, 90, 66, 104]
    x, y = 40, 66
    for k, ((lab, cls), w) in enumerate(zip(terms, widths)):
        if k:
            b.append(txt(x - 8, y + 22, "=" if k == len(terms) - 1 else "×", "sub2", "middle"))
        b.append(eq(x, y, w, lab, cls, h=34))
        x += w + 16
    assert 2 * L8 * KVH8 * HD * 2 == KV8 and x - 16 <= 640
    b.append(txt(40, 134, f"{fc(KV8)} bytes = 128 × 1,024 bytes = 128 KiB, about 131 kB in decimal units", "sub2"))
    # one request's cache at three lengths, to scale
    YB, X0, SC = 186, 150, 400 / cache(32768)
    b.append(hd(40, YB - 16, "One request's cache, drawn to scale"))
    for i, ctx in enumerate((2048, 8192, 32768)):
        y = YB + i * 34
        w = cache(ctx) * SC
        b.append(txt(40, y + 17, f"{fc(ctx)} tokens", "cap"))
        b.append(cell(X0, y, w, 24, "h", rx=2))
        b.append(txt(round(X0 + w + 10, 1), y + 17, f"{fsize(cache(ctx))}  ({ctx // 1024 * 128 // 1024 if ctx >= 8192 else ctx * 128 // 1024} {'GiB' if ctx >= 8192 else 'MiB'})", "sub2"))
    assert cache(2048) == 256 * 2**20 and cache(8192) == 2**30 and cache(32768) == 4 * 2**30
    body, yb = prose(YB + 3 * 34 + 34, [
        "From here the arithmetic needs one card, and the 70B model's 140 GB does not fit on an 80 GB "
        f"H100. Llama 3 8B does: 32 layers, 8 key-value heads of 128 numbers, {f(P8 / 1e9, 2)} billion "
        f"parameters, {f(W8 / 1e9, 2)} GB at 16 bits. The rest of this part uses it.",
        "Each token of context leaves a key and a value in every layer, for each KV head "
        "({{fig:v01-o140}}); grouped-query attention is why there are 8 KV heads and not 32 "
        "({{fig:v03-o089}}). The 70B model came to 327,680 bytes; with 32 layers instead of 80, the 8B "
        f"keeps {f(KV70 / KV8, 1)} times less per token.",
        "Memory is counted in powers of two as often as in powers of ten ({{fig:v01-p30}}). A KiB is "
        "1,024 bytes, a MiB "
        "is 1,024 KiB and a GiB is 1,024 MiB, so 131,072 bytes is exactly 128 KiB, and 8,192 tokens "
        "fill exactly 1 GiB, which is 1.07 GB.",
    ])
    assert KV70 / KV8 == 2.5
    emit("a07", st("A KV cache is the opposite"), "One token of context costs 128 KiB on Llama 3 8B",
         yb + 32, b + [body],
         "A request's cache is rent paid per token, and every request pays its own. At 8,192 tokens one "
         "conversation holds a gigabyte of the card.")


# ---- a08 · P8 -------------------------------------------------------------------------------------
def a08():
    b = [hd(40, 46, "One cached key, 128 numbers in one layer, met by the new token's queries")]
    for i in range(GROUP):
        y = 66 + i * 30
        b.append(cell(40, y, 116, 22, "m", label=f"query head {i + 1}"))
        b.append(arr(162, y + 11, 236, 111))
    b.append(cell(242, 92, 210, 38, "h", label=f"one key: 128 numbers, {128 * 2} bytes"))
    ops_per_head = 2 * 128
    total = GROUP * ops_per_head
    b.append(txt(242, 152, f"each query head: 128 multiply-adds = {ops_per_head} operations", "sub2"))
    b.append(txt(242, 170, f"{GROUP} heads: {fc(total)} operations on {128 * 2} bytes = 4 per byte", "sub2"))
    assert total / 256 == 4 == ATT8 / KV8
    # the batch does not move it
    TY = 66 + 4 * 30 + 36
    b.append(hd(40, TY, "The same ratio at any batch, with 2,048 tokens cached per request"))
    X = [90, 300, 440, 600]
    for x, h_ in zip(X, ["batch", "attention operations", "cache bytes read", "per byte"]):
        b.append(txt(x, TY + 26, h_, "sub2", "end"))
    for k, n in enumerate((1, 8, 64)):
        y = TY + 50 + k * 24
        ops, by = n * ATT8 * 2048, n * cache(2048)
        b.append(txt(X[0], y, str(n), "cap", "end"))
        b.append(txt(X[1], y, f"{f(ops / 1e9, 1)} billion", "sub2", "end"))
        b.append(txt(X[2], y, fsize(by), "sub2", "end"))
        b.append(txt(X[3], y, f(ops / by, 0), "sub2", "end"))
    body, yb = prose(TY + 50 + 3 * 24 + 26, [
        "For each new token, every one of the 32 query heads compares itself with each cached key and "
        "then blends the cached values ({{fig:v01-o094}}). Grouped-query attention lets 4 query heads "
        "share one key-value head ({{fig:v03-o089}}), so each cached number, once read, is used 4 "
        "times: 4 multiply-adds, 8 operations, for its 2 bytes. The values work the same way.",
        "That ratio belongs to the cache, not to the batch. A second request brings a second cache: "
        "twice the operations and twice the bytes. At batch 1 or batch 1,000 attention runs at 4 "
        "operations per byte, against the 295 the chip needs.",
    ])
    emit("a08", st("attention has to read each cache separately"),
         "Attention's reads stay at 4 operations per byte, at any batch", yb + 32, b + [body],
         "Batching multiplies the cache reads along with the work, so the ratio never moves. Attention "
         "stays on the memory-bound floor however large the batch grows.")


# ---- a09 · P9: the widget -------------------------------------------------------------------------
AX9 = dict(X0=110, X1=620, Y0=262, Y1=70, xlo=1, xhi=1024, ylo=1, yhi=1000)
NPTS = [round(2 ** (k / 4), 4) for k in range(41)]          # 1 … 1,024, evenly spaced on the log axis
D9 = 3                                                      # CTX[3] = 2,048 tokens to start


def ridge_batch(ctx):
    """Smallest batch reaching the ridge, or None if the intensity's limit is below it."""
    c = cache(ctx)
    den = W8 + 4 * c - RIDGE * c
    return None if den <= 0 else math.ceil(RIDGE * W8 / den)


def ctx_state(i):
    ctx = CTX[i]
    c = cache(ctx)
    lim = LIM(ctx)
    cross = int(W8 // c) + 1
    nr = ridge_batch(ctx)
    tail = f", past the ridge from batch {fc(nr)}" if nr else ", below the ridge's 295"
    return {
        "val": fc(ctx),
        "r1": f"{fc(ctx)} tokens of context: each request's cache adds {fsize(c)} to every step's read",
        "r2": f"at batch 64: {f(intensity(64, ctx), 1)} operations per byte; caches outweigh the weights from batch {fc(cross)}",
        "r3": f"limit as the batch grows: weights ÷ one cache + 4 = {f(lim, 1)}{tail}",
        "lim": f"limit {f(lim, 1)}",
        "_lim": lim,
    }


assert ridge_batch(2048) is None and ridge_batch(512) is None
assert intensity(ridge_batch(256), 256) >= RIDGE > intensity(ridge_batch(256) - 1, 256)


A09_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const CTX = __CTX__, NPTS = __NPTS__, D = __D__, A = __AX__;
  const W8 = __W8__, KV8 = __KV8__, RIDGE = __RIDGE__;
  const lg = Math.log10;
  const px = v => A.X0 + (lg(v) - lg(A.xlo)) / (lg(A.xhi) - lg(A.xlo)) * (A.X1 - A.X0);
  const py = v => A.Y0 - (lg(v) - lg(A.ylo)) / (lg(A.yhi) - lg(A.ylo)) * (A.Y0 - A.Y1);
  __FMT__
  const fsize = c => c >= 1e9 ? fx(c / 1e9, 2) + ' GB' : (c >= 1e8 ? fx(c / 1e6, 0) + ' MB' : fx(c / 1e6, 1) + ' MB');
  const inten = (n, c) => n * (W8 + 4 * c) / (W8 + n * c);
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val'), q = s => fig.querySelector(s);
  function draw() {
    const ctx = CTX[+sl.value], c = KV8 * ctx, lim = W8 / c + 4, cross = Math.floor(W8 / c) + 1;
    const den = W8 + 4 * c - RIDGE * c, nr = den <= 0 ? null : Math.ceil(RIDGE * W8 / den);
    val.textContent = fcx(ctx);
    q('[data-curve]').setAttribute('points', NPTS.map(n => px(n).toFixed(1) + ',' + py(inten(n, c)).toFixed(1)).join(' '));
    const yl = py(lim).toFixed(1);
    const L = q('[data-limline]'); L.setAttribute('y1', yl); L.setAttribute('y2', yl);
    const t = q('[data-lim]'); t.setAttribute('y', (py(lim) - 6).toFixed(1)); t.textContent = 'limit ' + fx(lim, 1);
    q('[data-r1]').textContent = `${fcx(ctx)} tokens of context: each request's cache adds ${fsize(c)} to every step's read`;
    q('[data-r2]').textContent = `at batch 64: ${fx(inten(64, c), 1)} operations per byte; caches outweigh the weights from batch ${fcx(cross)}`;
    q('[data-r3]').textContent = `limit as the batch grows: weights ÷ one cache + 4 = ${fx(lim, 1)}` + (nr ? `, past the ridge from batch ${fcx(nr)}` : `, below the ridge's 295`);
  }
  sl.addEventListener('input', draw);
  q('button').addEventListener('click', () => { sl.value = D; draw(); });
  draw();
})();</script>"""


def a09():
    A = LogAxes(**AX9)
    s0 = ctx_state(D9)
    ctx0 = CTX[D9]
    b = [hd(40, 34, "Operations per byte against batch size, Llama 3 8B, both axes logarithmic")]
    b += A.draw([1, 4, 16, 64, 256, 1024], [1, 10, 100, 1000], "batch size: requests in the step",
                "operations per byte")
    # the ridge, the weights-only line, the curve with caches, its limit
    yr = round(A.py(RIDGE), 1)
    b.append(ln(A.X0, yr, A.X1, yr, "mark"))
    b.append(halo(A.X0 + 8, yr + 16, "ridge, 295"))
    b.append(poly([(A.px(1), A.py(1)), (A.px(1000), A.py(1000))], "conn", ' style="stroke-dasharray:4 3"'))
    pts = [(A.px(n), A.py(intensity(n, ctx0))) for n in NPTS]
    b.append(poly(pts, "pl-m", ' data-curve=""'))
    yl = round(A.py(s0["_lim"]), 1)
    b.append(f'<line class="tick" x1="{A.X0}" y1="{yl}" x2="{A.X1}" y2="{yl}" style="stroke-dasharray:1 3" data-limline=""/>')
    b.append(f'<text class="sub2 halo" x="{A.X1 - 4}" y="{round(yl - 6, 1)}" text-anchor="end" style="{HALO}" '
             f'data-lim="">{esc(s0["lim"])}</text>')
    # a legend above the plot, where no setting of the slider can put a curve
    b.append(ln(300, 52, 324, 52, "pl-m"))
    b.append(txt(332, 56, "with the caches counted", "sub2"))
    b.append(f'<line class="conn" x1="478" y1="52" x2="502" y2="52" style="stroke-dasharray:4 3"/>')
    b.append(txt(510, 56, "weights alone", "sub2"))
    RY = A.Y0 + 64
    for k in (1, 2, 3):
        b.append(f'<text class="sub2" x="40" y="{RY + (k - 1) * 20}" data-r{k}="">{esc(s0[f"r{k}"])}</text>')
    c = cache(ctx0)
    body, yb = prose(RY + 2 * 20 + 38, [
        f"Each request adds its weight work, 2 × {f(P8 / 1e9, 2)} billion operations, plus attention's 4 "
        f"per cached byte. It also adds its whole cache to the bytes read: {fsize(c)} at 2,048 tokens. "
        f"The weights' {f(W8 / 1e9, 2)} GB are shared; the caches are not.",
        f"So intensity = N × ({f(W8 / 1e9, 2)} G + 4 × {fsize(c)}) ÷ ({f(W8 / 1e9, 2)} GB + N × {fsize(c)}). "
        "While the weights dominate the bytes it climbs like N; once the caches do, it levels off at "
        f"{f(W8 / 1e9, 2)} GB ÷ {fsize(c)} + 4 = {f(s0['_lim'], 1)}, far below the ridge.",
        f"Longer contexts lower the ceiling, to {f(LIM(8192), 1)} at 8,192 tokens; only very short ones, "
        "around 256 tokens, ever reach the ridge. The widget's arithmetic was checked against Python at "
        "every setting.",
    ])
    assert round(W8 / c + 4, 1) == 63.8
    ctl = (f"<div class='ctl'><label>context per request <input type='range' min='0' max='{len(CTX) - 1}' "
           f"step='1' value='{D9}'><span class='val'>{s0['val']}</span></label>"
           "<button type='button'>Reset</button></div>")
    js = (A09_JS.replace("__CTX__", json.dumps(CTX)).replace("__NPTS__", json.dumps(NPTS))
          .replace("__D__", str(D9)).replace("__AX__", json.dumps(AX9)).replace("__W8__", str(W8))
          .replace("__KV8__", str(KV8)).replace("__RIDGE__", repr(RIDGE)).replace("__FMT__", JS_FMT))
    widget("a09", st("attention stays on the memory bound floor"),
           "Once the caches count, intensity levels off below 64", ctl, yb + 26, b + [body],
           "Batching's free lunch has a hidden bill. Past a few dozen requests the chip spends its time "
           "reading caches, not weights, and at ordinary context lengths no batch reaches the ridge.", js)


def a09_cases():
    out = []
    for i in [D9] + [k for k in range(len(CTX)) if k != D9]:
        s = ctx_state(i)
        out.append(({"input[type=range]": i}, {".val": s["val"], "[data-r1]": s["r1"], "[data-r2]": s["r2"],
                                              "[data-r3]": s["r3"], "[data-lim]": s["lim"]}))
    return out


# ---- a10 · P10 ------------------------------------------------------------------------------------
def a10():
    b = [hd(40, 46, "One H100's 80 GB, drawn to scale")]
    X0, SC = 160, 480 / HBM
    xw, xk = X0 + W8 * SC, X0 + (W8 + WORK) * SC
    b.append(txt(40, 92, "the card", "cap"))
    b.append(cell(X0, 72, W8 * SC, 30, "u", rx=2, label="weights"))
    b.append(ghost(xw, 72, WORK * SC, 30))
    b.append(cell(xk, 72, POOL * SC, 30, "s", rx=2, label=f"left for KV caches: {gb(POOL)} GB"))
    b.append(txt(round(X0 + W8 * SC / 2, 1), 120, f"{gb(W8)} GB", "sub2", "middle"))
    b.append(txt(round(xw + WORK * SC / 2, 1), 64, "4 GB working space, assumed", "sub2", "middle"))
    rows = [2048, 8192, 32768]
    for i, ctx in enumerate(rows):
        y = 150 + i * 46
        n = FIT(ctx)
        used = n * cache(ctx)
        b.append(txt(40, y + 17, f"{fc(ctx)} tokens: {n} fit", "cap"))
        b.append(cell(xk, y, used * SC, 24, "s", rx=2))
        for k in range(1, n):
            x = round(xk + k * cache(ctx) * SC, 2)
            b.append(f'<line class="xok" x1="{x}" y1="{y + 1}" x2="{x}" y2="{y + 23}" style="stroke:var(--paper);stroke-width:1"/>')
        left = POOL - used
        if left * SC > 3:
            b.append(ghost(round(xk + used * SC, 2), y, round(left * SC, 2), 24))
    assert round((POOL - 13 * cache(32768)) / 1e9, 2) == 4.11
    body, yb = prose(150 + 3 * 46 + 30, [
        "Model weights are a fixed cost and activations, the intermediate numbers a forward pass "
        "computes and discards, take little, so whatever is left of the card "
        "holds caches ({{fig:v01-o141}}). Setting aside 4 GB for activations and working buffers, an "
        f"assumption, leaves 80 − {gb(W8)} − 4 = {gb(POOL)} GB.",
        f"Requests that fit = that pool ÷ one request's cache, rounded down: {gb(POOL)} GB ÷ "
        f"{fsize(cache(2048))} = {f(POOL / cache(2048), 1)}, so {FIT(2048)} at 2,048 tokens; {FIT(8192)} "
        f"at 8,192; and {FIT(32768)} at 32,768, where a 14th would need {fsize(cache(32768))} and only "
        f"{gb(POOL - 13 * cache(32768))} GB are left.",
    ])
    emit("a10", st("whatever high-bandwidth memory is left over"), "What fills an 80 GB card, and how many requests fit",
         yb + 32, b + [body],
         "A few tens is the honest answer at long context; at 2,048 tokens it is a couple of hundred. "
         "Context length, not arithmetic, sets the batch.")


# ---- a11 · P11 ------------------------------------------------------------------------------------
def a11():
    b = [hd(40, 46, "Requests the card can hold, against requests the ridge needs, on one scale")]
    X0, SC = 200, 1.0
    R = round(RIDGE)
    rows = [(f"fit at {fc(8192)} tokens", FIT(8192), "h", f"{FIT(8192)} requests"),
            (f"fit at {fc(2048)} tokens", FIT(2048), "h", f"{FIT(2048)}"),
            ("the ridge needs", R, "m", f"{R} sharing each read")]
    for i, (lab, n, cls, val) in enumerate(rows):
        y = 70 + i * 40
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(cell(X0, y, n * SC, 26, cls, rx=2))
        b.append(txt(round(X0 + n * SC + 10, 1), y + 18, val, "sub2"))
    i55 = intensity(FIT(8192), 8192)
    assert round(i55, 1) == 14.9
    body, yb = prose(70 + 3 * 40 + 36, [
        f"At 8,192 tokens of context the card holds {FIT(8192)} requests; at 2,048 it holds {FIT(2048)}. "
        f"Reaching the ridge, counting the weights alone, takes {R} requests sharing each read: more "
        "than the card holds at either length.",
        fwd("a09",
            f"And {R} would not be enough anyway. With the caches counted, {FIT(8192)} requests at 8,192 "
            f"tokens run at {f(i55, 1)} operations per byte, and no batch passes {f(LIM(8192), 1)} at that "
            "length ({{fig:v07-a09}}).",
            f"And {R} would not be enough anyway. With the caches counted, {FIT(8192)} requests at 8,192 "
            f"tokens run at {f(i55, 1)} operations per byte, and no batch passes {f(LIM(8192), 1)} at that "
            "length."),
    ])
    emit("a11", st("you still fit only a few tens"), "Out of room at 55 requests, out of arithmetic at 295",
         yb + 32, b + [body],
         "The arithmetic units are not what runs out. Memory runs out first, which is why the rest of "
         "this part is about memory.")


# ---- a12 · P12 ------------------------------------------------------------------------------------
RES = 2048
HELD = [("A", 400), ("B", 700), ("C", 250), ("D", 1100)]
GAPS = [900, 700, 800]


def a12():
    total = len(HELD) * RES + sum(GAPS)
    real = sum(n for _, n in HELD)
    empty = len(HELD) * RES - real
    free = sum(GAPS)
    assert (total, real, empty, free) == (10592, 2450, 5742, 2400)
    assert free > RES and max(GAPS) < RES                       # enough in total, nowhere in one piece
    b = [hd(40, 46, f"Four requests, each given one unbroken run of {fc(RES)} slots, to scale")]
    X0, SC = 40, 600 / total
    x = X0
    for k, (name, n) in enumerate(HELD):
        b.append(cell(round(x, 2), 70, round(n * SC, 2), 34, "s", rx=2, label=name))
        b.append(cell(round(x + n * SC, 2), 70, round((RES - n) * SC, 2), 34, "h", rx=2,
                      label="reserved" if (RES - n) * SC > 60 else None))
        x += RES * SC
        if k < len(GAPS):
            b.append(ghost(round(x, 2), 70, round(GAPS[k] * SC, 2), 34, label="free"))
            x += GAPS[k] * SC
    assert abs(x - (X0 + 600)) < 1e-6
    b.append(txt(40, 126, "real tokens are the green part of each run; the rest is reserved for tokens not yet written", "sub2"))
    b.append(ghost(40, 146, round(RES * SC, 2), 26, label="request E"))
    b.append(txt(round(40 + RES * SC + 12, 1), 163,
                 f"needs {fc(RES)} slots in a row, and no free gap is longer than {max(GAPS)}", "sub2"))
    # where the slots went, as one bar
    YB = 216
    b.append(hd(40, YB - 12, f"Where the {fc(total)} slots went"))
    xs = 40
    for lab, n, cls in [("real tokens", real, "s"), ("reserved, empty", empty, "h"), ("free, unusable", free, None)]:
        w = n * 600 / total
        if cls:
            b.append(cell(round(xs, 2), YB, round(w, 2), 30, cls, rx=2, label=f"{lab} {f(n / total * 100, 1)}%"))
        else:
            b.append(ghost(round(xs, 2), YB, round(w, 2), 30, label=f"{lab} {f(n / total * 100, 1)}%"))
        xs += w
    body, yb = prose(YB + 30 + 40, [
        "The systems before paged memory, the next figure, gave each request one unbroken run of "
        "memory, sized for the longest "
        "answer it might produce, because the cache had to sit in one contiguous stretch and could not "
        "grow ({{fig:v03-o083}}).",
        f"That wastes memory twice. Inside each run are slots reserved for tokens not yet written, and "
        f"perhaps never: {fc(empty)} here. Between runs are gaps too small for anyone: {fc(free)} slots "
        f"are free, yet a fifth request needing {fc(RES)} in a row fits nowhere.",
        f"Only {fc(real)} of the {fc(total)} slots hold real tokens, {f(real / total * 100, 1)}%. "
        "Profiling schemes like this one, the vLLM paper (Kwon et al., 2023) found 20.4% to 38.2% of the "
        "cache memory holding real tokens.",
    ])
    emit("a12", st("contiguous block of memory for each request"),
         "Reserving for the longest answer leaves three-quarters of the memory empty", yb + 32, b + [body],
         "Free space that cannot be used is lost all the same. Both wastes come from one rule: a "
         "request's memory must be one unbroken run.")


# ---- a13 · P13: the widget ------------------------------------------------------------------------
BS = 16
TABLE = [7, 1, 3]                                   # logical block -> physical block
HOLD = 45                                           # tokens this request holds
OTHER, FREE = {0, 2, 5}, {4, 6}                     # physical blocks used by others, and free
D13 = 37
assert sorted(TABLE + sorted(OTHER) + sorted(FREE)) == list(range(8))


def addr(i):
    blk, off = divmod(i, BS)
    phys = TABLE[blk]
    return blk, off, phys, phys * BS + off


assert addr(37) == (2, 5, 3, 53)


def tok_state(i):
    blk, off, phys, slot = addr(i)
    return {"val": str(i),
            "r1": f"token {i} ÷ 16 = {blk} remainder {off}: logical block {blk}, position {off} in it",
            "r2": f"block table, row {blk} → physical block {phys}",
            "r3": f"address: {phys} × 16 + {off} = slot {slot} of the cache memory"}


A13_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const T = __TABLE__, BS = 16, D = __D__;
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val'), q = s => fig.querySelector(s);
  let last = null;
  function set(sel, cls) { const g = q(sel); if (g) g.setAttribute('class', cls); }
  function draw() {
    const i = +sl.value, blk = Math.floor(i / BS), off = i % BS, phys = T[blk], slot = phys * BS + off;
    if (last) { set(`[data-l="${last[0]}"]`, 's'); set(`[data-p="${last[1]}"]`, 's'); }
    for (let k = 0; k < T.length; k++) set(`[data-t="${k}"]`, k === blk ? 'm' : 'u');
    set(`[data-l="${i}"]`, 'm'); set(`[data-p="${slot}"]`, 'm');
    last = [i, slot];
    val.textContent = String(i);
    q('[data-r1]').textContent = `token ${i} ÷ 16 = ${blk} remainder ${off}: logical block ${blk}, position ${off} in it`;
    q('[data-r2]').textContent = `block table, row ${blk} → physical block ${phys}`;
    q('[data-r3]').textContent = `address: ${phys} × 16 + ${off} = slot ${slot} of the cache memory`;
  }
  sl.addEventListener('input', draw);
  q('button').addEventListener('click', () => { sl.value = D; draw(); });
  draw();
})();</script>"""


def gcell(x, y, w, h, cls, attr, rx=2):
    return f'<g class="{cls}" {attr}><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"/></g>'


def a13():
    s0 = tok_state(D13)
    _, _, _, slot0 = addr(D13)
    b = [hd(40, 34, f"A request holding {HOLD} tokens, stored as three 16-token blocks")]
    # the request's own view: logical blocks
    b.append(txt(40, 64, "the request's tokens, in order", "sub2"))
    LX, C, G = 92, 13, 2
    for r in range(3):
        y = 74 + r * 20
        b.append(txt(40, y + 11, f"block {r}", "sub2"))
        for k in range(BS):
            i = r * BS + k
            x = LX + k * (C + G)
            if i < HOLD:
                b.append(gcell(x, y, C, C + 2, "m" if i == D13 else "s", f'data-l="{i}"'))
            else:
                b.append(ghost(x, y, C, C + 2, rx=2))
    # the block table
    TX = 360
    b.append(txt(TX, 64, "block table", "sub2"))
    for k, ph in enumerate(TABLE):
        y = 72 + k * 24
        b.append(f'<g class="{"m" if k == D13 // BS else "u"}" data-t="{k}"><rect x="{TX}" y="{y}" width="76" height="20" rx="3"/>'
                 f'<text class="sub" x="{TX + 38}" y="{y + 10}" text-anchor="middle" dominant-baseline="central">{k} → {ph}</text></g>')
    # physical memory: 8 blocks of 16 slots
    PX, PC, PG = 486, 7, 2
    b.append(txt(466, 64, "cache memory: 8 blocks", "sub2"))
    owner = {ph: lb for lb, ph in enumerate(TABLE)}
    for r in range(8):
        y = 72 + r * 14
        b.append(txt(478, y + 10, str(r), "sub2", "end"))
        for k in range(BS):
            x = PX + k * (PC + PG)
            s_ = r * BS + k
            if r in owner:
                i = owner[r] * BS + k
                if i < HOLD:
                    b.append(gcell(x, y, PC, 11, "m" if s_ == slot0 else "s", f'data-p="{s_}"', rx=1))
                else:
                    b.append(ghost(x, y, PC, 11, rx=1))
            elif r in OTHER:
                b.append(cell(x, y, PC, 11, "u", rx=1))
            else:
                b.append(ghost(x, y, PC, 11, rx=1))
    assert PX + BS * (PC + PG) - PG <= 640
    b.append(txt(640, 196, "green: this request · grey: others · dashed: free", "sub2", "end"))
    RY = 232
    for k in (1, 2, 3):
        b.append(f'<text class="sub2" x="40" y="{RY + (k - 1) * 20}" data-r{k}="">{esc(s0[f"r{k}"])}</text>')
    blk_bytes = BS * KV8
    assert blk_bytes == 2 * 2**20 and blk_bytes // L8 == 64 * 1024
    body, yb = prose(RY + 40 + 38, [
        "PagedAttention stores each request's cache in fixed blocks of 16 tokens, vLLM's default, "
        "wherever memory is free ({{fig:v03-o086}}). A block table per request records where each block "
        "went, as an operating system's page table does for a program ({{fig:v03-o085}}).",
        "Finding token i takes one division with remainder and one lookup: 37 = 2 × 16 + 5, so block "
        f"2, position 5. One block holds 16 × {fc(KV8)} bytes = 2 MiB of Llama 3 8B's cache, 64 KiB in "
        "each of its 32 layers.",
        "Move the slider to any token; the arithmetic was checked against Python for every one.",
    ])
    ctl = (f"<div class='ctl'><label>token <input type='range' min='0' max='{HOLD - 1}' step='1' value='{D13}'>"
           f"<span class='val'>{s0['val']}</span></label><button type='button'>Reset</button></div>")
    js = A13_JS.replace("__TABLE__", json.dumps(TABLE)).replace("__D__", str(D13))
    widget("a13", st("non-contiguous fixed-size blocks"), "A token's address is one division and one lookup",
           ctl, yb + 26, b + [body],
           "Any free block will do, because the table remembers where each one went. That one "
           "indirection is what removes the need for unbroken runs.", js)


def a13_cases():
    out = []
    for i in [D13] + [k for k in range(HOLD) if k != D13]:
        s = tok_state(i)
        _, _, _, slot = addr(i)
        exp = {".val": s["val"], "[data-r1]": s["r1"], "[data-r2]": s["r2"], "[data-r3]": s["r3"]}
        out.append(({"input[type=range]": i}, exp))
    return out


# ---- a14 · P14 ------------------------------------------------------------------------------------
def blocks(n):
    return math.ceil(n / BS)


def a14():
    b = [hd(40, 46, "A request's blocks as it grows: a new one is taken only when the last is full")]
    C, G, BG = 7, 2, 14
    bw = BS * (C + G) - G
    for i, n in enumerate((16, 17, 37)):
        y = 70 + i * 44
        k = blocks(n)
        b.append(txt(40, y + 12, f"{n} tokens", "cap"))
        b.append(txt(40, y + 28, f"{k} block{'s' if k > 1 else ''}, {k * BS - n} empty", "sub2"))
        for j in range(k):
            x0 = 150 + j * (bw + BG)
            for s_ in range(BS):
                t = j * BS + s_
                x = x0 + s_ * (C + G)
                b.append(cell(x, y + 4, C, 20, "s", rx=1) if t < n else ghost(x, y + 4, C, 20, rx=1))
    assert 150 + 3 * (bw + BG) - BG <= 640
    TY = 70 + 3 * 44 + 30
    heads = ["tokens", "blocks, rounded up", "slots", "empty", "share empty"]
    X = [110, 270, 380, 470, 600]
    for x, h_ in zip(X, heads):
        b.append(txt(x, TY, h_, "sub2", "end"))
    rows = [(37, 3, 11, 22.9), (1000, 63, 8, 0.8), (2001, 126, 15, 0.7)]
    for k, (n, nb, e, share) in enumerate(rows):
        assert blocks(n) == nb and nb * BS - n == e and round(e / (nb * BS) * 100, 1) == share
        y = TY + 24 + k * 24
        b.append(txt(X[0], y, fc(n), "cap", "end"))
        b.append(txt(X[1], y, f"⌈{fc(n)} ÷ 16⌉ = {nb}", "sub2", "end"))
        b.append(txt(X[2], y, fc(nb * BS), "sub2", "end"))
        b.append(txt(X[3], y, str(e), "sub2", "end"))
        b.append(txt(X[4], y, f"{f(e / (nb * BS) * 100, 1)}%", "sub2", "end"))
    assert max(blocks(n) * BS - n for n in range(1, 5000)) == BS - 1
    body, yb = prose(TY + 24 + 3 * 24 + 22, [
        "A block is taken from the free list, the engine's list of unused blocks, only when the "
        "request's last block fills, so a request "
        "holds ⌈tokens ÷ 16⌉ blocks: the token count divided by 16 and rounded up, because a part-filled "
        "block is still a whole block.",
        "Only the last block can be part empty, so the waste is at most 15 slots per request, whatever "
        "its length: 11 of 48 at 37 tokens, 8 of 1,008 at 1,000, 15 of 2,016 at 2,001. Nothing has to "
        "be reserved for tokens that may never come.",
    ])
    emit("a14", st("brings that waste near zero"), "Blocks arrive one at a time, so at most fifteen slots sit empty",
         yb + 32, b + [body],
         "Waste is bounded by one partial block per request. Against the 1,648 empty slots request A "
         "reserved in {{ref:v07-a12}}, fifteen is nothing.")


# ---- a15 · P15 ------------------------------------------------------------------------------------
KWON = [("reserve the model's maximum, 2,048", 20.4, "h"), ("reserve up to twice the true length", 26.8, "h"),
        ("reserve exactly the true length", 38.2, "h"), ("paged, vLLM", 96.3, "s")]


def a15():
    b = [hd(40, 46, "Share of cache memory holding real tokens, measured, drawn to scale")]
    X0, SC = 290, 330 / 100
    for i, (lab, pct, cls) in enumerate(KWON):
        y = 70 + i * 36
        b.append(txt(40, y + 17, lab, "cap"))
        b.append(track(X0, y, 330, 24))
        if pct > 90:
            b.append(cell(X0, y, pct * SC, 24, cls, rx=2, label=f"{f(pct, 1)}%"))
        else:
            b.append(cell(X0, y, pct * SC, 24, cls, rx=2))
            b.append(txt(round(X0 + pct * SC + 8, 1), y + 17, f"{f(pct, 1)}%", "sub2"))
    lo, hi = 96.3 / 38.2, 96.3 / 20.4
    assert round(lo, 2) == 2.52 and round(hi, 2) == 4.72
    body, yb = prose(70 + 4 * 36 + 30, [
        "The vLLM paper (Kwon et al., SOSP 2023, a leading systems conference) measured this directly. "
        "Its authors built three "
        "versions of Orca's contiguous reservation: one reserving the model's maximum length, one up to "
        "twice the true answer, one exactly the true answer, which no real system can know in advance. "
        "Under those rules 20.4% to 38.2% of the memory held real tokens. Under paging 96.3% did, "
        "wasting under 4%.",
        f"Real tokens per gigabyte therefore rise {f(lo, 1)} times against the best of the three and "
        f"{f(hi, 1)} times against the worst. More sequences fit on the same card, the batch grows, and "
        "each read of the weights covers more tokens.",
    ])
    emit("a15", st("So, more sequences fit"), "The same memory holds 2.5 to 4.7 times the sequences",
         yb + 32, b + [body],
         "Room is not yet speed. Capacity sets how large the batch can be; keeping it that large is the "
         "scheduling problem the next part takes up.")


if __name__ == "__main__":
    for fn in (o005, a07, a08, a09, a10, a11, a12, a13, a14, a15):
        fn()
