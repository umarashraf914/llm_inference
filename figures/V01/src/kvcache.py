"""V01 Part 11, the KV cache: o134 redrawn (review §5.1 #5), o138-o140 reorganised so the count of numbers,
the reason for the 80 and the bytes each appear once (§5.3, §5.4), and proposals 27 and 30-32: what the
cache saves in seconds, kilo as 1,024, what the cache costs one conversation, and what it costs a batch
(a widget on the shared roofline).

  python3 figures/V01/src/kvcache.py
"""
import json
import math
from common import (cell, ghost, arr, ln, txt, hd, eq, prose, emit, widget, tag, st, f, g, sig, rnd, JS_FMT,
                    CHIPS, N, N_EXACT, W_BYTES, KV_PER_TOKEN, PEAK, BW, RIDGE, L, KVH, NH, KVW)
import roof
from roof import xs, ys, axes, roof_points, sig3

HD = 128
NUMS = 2 * KVH * HD                              # numbers kept per layer per token
assert NUMS == 2048 and NUMS * L == 163_840 and NUMS * L * 2 == KV_PER_TOKEN == 327_680
KV_MHA = 2 * L * NH * HD * 2
assert KV_MHA == 2_621_440 == 8 * KV_PER_TOKEN


# ---- o134: per step, flat against rising ------------------------------------------------------------
def o134():
    n = 10
    assert sum(range(1, n + 1)) == 55 and sum(range(1, 10001)) == 50_005_000
    b = [hd(40, 46, "Positions put through the layers at each step, without and with a cache, to scale")]
    X0, W, H0, U = 120, 44, 290, 18             # one group of bars per step; 18 px per position
    b.append(ln(X0 - 10, H0, X0 + n * W + 10, H0, "axis"))
    for t in range(1, n + 1):
        x = X0 + (t - 1) * W
        b.append(cell(x, H0 - t * U, 18, t * U, "h", rx=2))
        b.append(cell(x + 20, H0 - U, 18, U, "s", rx=2))
        b.append(txt(x + 19, H0 + 16, str(t), "sub2", "middle"))
    b.append(txt(X0 + n * W / 2, H0 + 36, "the token being generated", "sub2", "middle"))
    b.append(cell(40, 76, 16, 16, "h", rx=2))
    b.append(txt(62, 89, "without a cache: every position again, t of them", "sub2"))
    b.append(cell(40, 100, 16, 16, "s", rx=2))
    b.append(txt(62, 113, "with a cache: only the new one", "sub2"))
    body, yb = prose(H0 + 70, [
        "Without a cache, generating token t means putting all t positions through every layer again; with it, "
        "only the new one. Per step that is a rising staircase against a flat line.",
        "The total is the area: 1 + 2 + … + n against n. At ten tokens, 55 against 10. At ten thousand, "
        "50,005,000 against 10,000, five thousand times as much. The staircase's area grows with the square of "
        "n; that is what quadratic means.",
        "With the cache the work per step on the layers is flat, but each step still reads every key and value "
        "kept so far, so the bytes per step keep growing with the conversation ({{fig:v01-o141}}).",
    ])
    emit("o134", st("By the time we are generating token 1,000"), "Per step, flat against rising; in total, linear against quadratic",
         yb + 26, b + [body],
         "Two shapes worth being able to recognise. Almost every scaling problem in this series is a term of the "
         "second kind growing past everything of the first.")


# ---- p27: what the cache saves, in seconds ------------------------------------------------------------
def t_without(t):
    """Token t without a cache: all t positions through the model, at full speed if the arithmetic allows."""
    return max(W_BYTES / BW, t * 2 * N / PEAK)


def t_with(t):
    """Token t with a cache: the weights once, plus every kept key and value."""
    return (W_BYTES + t * KV_PER_TOKEN) / BW


def p27():
    rows = [(1000, t_without(1000), t_with(1000)), (10000, t_without(10000), t_with(10000))]
    assert [round(a * 1000) for _, a, _ in rows] == [142, 1416] and [round(c * 1000, 1) for _, _, c in rows] == [41.9, 42.8]
    tot_wo = sum(t_without(t) for t in range(1, 10001))
    tot_w = sum(t_with(t) for t in range(1, 10001))
    assert round(tot_wo / 60) == 118 and round(tot_w / 60, 1) == 7.0 and round(tot_wo / tot_w) == 17
    b = [hd(40, 46, "Time for one token, on one H100; log scale from 10 ms to 10 s")]
    X0, DEC = 240, 120
    xl = lambda sec: round(X0 + (math.log10(sec) + 2) * DEC, 1)
    ya = 70 + 4 * 40 + 6
    b.append(ln(X0, ya, xl(10), ya, "axis"))
    for v, lab in ((0.01, "10 ms"), (0.1, "100 ms"), (1, "1 s"), (10, "10 s")):
        b.append(ln(xl(v), ya, xl(v), ya + 4, "tick"))
        b.append(txt(xl(v), ya + 18, lab, "sub2", "middle"))
    k = 0
    for t, a, c in rows:
        for lab, v, cls in ((f"token {g(t)}, no cache", a, "h"), (f"token {g(t)}, cached", c, "s")):
            y = 70 + k * 40
            b.append(txt(40, y + 19, lab, "cap"))
            w = xl(v) - X0
            b.append(cell(X0, y, w, 28, cls, rx=3))
            b.append(txt(X0 + w + 8, y + 19, f"{sig(v * 1000, 3)} ms" if v < 1 else f"{f(v, 2)} s", "sub2"))
            k += 1
    y2 = ya + 60
    b.append(hd(40, y2, "A whole 10,000-token answer, minutes, to scale"))
    SC = 300 / (tot_wo / 60)
    for k, (lab, v, cls) in enumerate((("no cache", tot_wo / 60, "h"), ("cached", tot_w / 60, "s"))):
        y = y2 + 16 + k * 40
        b.append(txt(40, y + 19, lab, "cap"))
        w = round(v * SC, 1)
        b.append(cell(X0, y, w, 28, cls, rx=3))
        b.append(txt(X0 + w + 8, y + 19, f"{f(v, 1) if v < 10 else round(v)} minutes", "sub2"))
    body, yb = prose(y2 + 16 + 2 * 40 + 30, [
        "Without the cache, token t sends all t positions through the model, and once t passes the ridge, 295, "
        f"the arithmetic outlasts the read: token 1,000 takes {round(rows[0][1] * 1000)} ms and token 10,000 "
        f"{f(rows[1][1], 2)} s. With the cache every token reads the weights once plus the kept keys and values: "
        f"{f(rows[0][2] * 1000, 1)} and {f(rows[1][2] * 1000, 1)} ms.",
        f"Over a 10,000-token answer that is {round(tot_wo / 60)} minutes against {f(tot_w / 60, 1)}, "
        f"{round(tot_wo / tot_w)} times as long.",
        "Both assumptions favour the version without a cache: the recomputation is taken to run at the chip's "
        "full peak, and attention's own work is left out. The real gap is wider.",
    ])
    emit("p27", st("By the time we are generating token 1,000"),
         "Without the cache, token 10,000 would take 1.4 seconds instead of 43 milliseconds", yb + 26, b + [body],
         "The quadratic of the previous figure, in seconds. Every serving system keeps the cache because the "
         "alternative is unusable, not merely slow.")


# ---- o139: one token, eighty layers deep -----------------------------------------------------------------
def o139():
    b = [hd(40, 46, "One token, eighty layers deep: a key and a value kept at every one")]
    for k in range(10):
        b.append(cell(60 + k * 52, 64, 46, 26, "s", rx=3, label=f"L{k + 1}"))
    b.append(txt(586, 82, "… L80", "sub2"))
    rows = [("per layer, per token", f"a key and a value: 2 × 8 heads × 128 = {g(NUMS)} numbers"),
            ("× 80 layers", f"{g(NUMS * L)} numbers kept for one token")]
    for k, (lab, s) in enumerate(rows):
        y = 116 + k * 40
        b.append(txt(40, y + 19, lab, "cap"))
        b.append(cell(220, y, 420, 28, "h" if k else "u", rx=3, label=s))
    body, yb = prose(116 + 2 * 40 + 28, [
        "Each layer computes a key and a value for every token from its own input ({{fig:v01-o098}}), and every "
        "one is kept. With eight key-value heads of 128 numbers ({{fig:v01-p29}}), that is 2,048 numbers per "
        "layer per token, and 163,840 across the eighty layers.",
        f"If every query head had its own key and value head, it would be eight times as many "
        "({{fig:v01-p29}}). The techniques in this series leave the number of layers alone, so every way of "
        "shrinking the cache attacks one of the other factors.",
    ])
    emit("o139", st("The KV cache stores two vectors per token"), "Eighty keys and eighty values, per token",
         yb + 26, b + [body],
         "Counted in numbers first, bytes next. The eighty is the factor nobody in this series can touch, which "
         "is why the others get so much attention.")


def o138():
    b = [hd(40, 46, "Why every layer's key has to be kept, not just one")]
    rows = [("if the key were computed once, from the token alone", "one key per token: no factor of 80", "u"),
            ("each layer computes its own, from its own input", "80 keys per token, all different", "s")]
    for k, (lab, s, c) in enumerate(rows):
        y = 70 + k * 72
        b.append(txt(40, y + 2, lab, "cap"))
        b.append(cell(60, y + 12, 360, 30, c, rx=4, label=s))
    body, yb = prose(70 + 72 + 12 + 30 + 36, [
        "A layer's key for a token is that layer's input vector times that layer's W_K ({{fig:v01-o098}}). The "
        "input differs at every layer, because each layer adds its result to the residual stream "
        "({{fig:v01-p19}}), and so does W_K. So the key differs at every layer.",
        "Layer 40, attending to an earlier token, needs layer 40's key for it, not layer 1's. All eighty have "
        "to be kept, which is where the factor of 80 in the cache's size comes from.",
    ])
    emit("o138", st("For Llama 3 70B with 80 transformer layers"), "Where the 80 in the cache comes from", yb + 26,
         b + [body],
         "If the projection happened once, the cache would be eighty times smaller and most of this series would "
         "not exist.")


def o140():
    b = [hd(40, 46, "Bytes per token, built term by term")]
    terms = [("2", "key and value"), ("80", "layers"), ("8", "KV heads"), ("128", "per head"),
             ("2", "bytes each")]
    x = 40
    for k, (v, lab) in enumerate(terms):
        b.append(cell(x, 66, 64, 32, "u", rx=4, label=v))
        b.append(txt(x + 32, 116, lab, "sub2", "middle"))
        x += 64
        b.append(txt(x + 8, 87, "×" if k < 4 else "=", "hd"))
        x += 26
    b.append(cell(x, 66, 640 - x, 32, "h", rx=4, label="327,680 bytes"))
    assert x < 520
    ys_ = 160
    b.append(hd(40, ys_, "How it grows with the conversation, to scale against the weights"))
    rows = [("1,000 tokens", 1000), ("10,000 tokens", 10000), ("100,000 tokens", 100000)]
    SC = 300 / (2 * N_EXACT)
    for k, (lab, n_) in enumerate(rows):
        y = ys_ + 18 + k * 36
        v = n_ * KV_PER_TOKEN
        b.append(txt(40, y + 19, lab, "cap"))
        w = round(max(v * SC, 2), 1)
        b.append(cell(200, y, w, 28, "h", rx=3))
        b.append(txt(200 + w + 8, y + 19, f"{sig(v / 1e9, 2)} GB", "sub2"))
    y = ys_ + 18 + 3 * 36
    b.append(txt(40, y + 19, "the weights", "cap"))
    b.append(cell(200, y, 300, 28, "u", rx=3))
    b.append(txt(508, y + 19, f"{f(2 * N_EXACT / 1e9, 1)} GB", "sub2"))
    share = 100000 * KV_PER_TOKEN / (2 * N_EXACT)
    assert round(share * 100) == 23
    body, yb = prose(y + 28 + 36, [
        "The 2 is one key and one value; 80 is the layers ({{fig:v01-o138}}); 8 key-value heads of 128 numbers "
        "each come from {{fig:v01-p29}}; and each number is stored in 2 bytes. For Llama 3 70B that is 327,680 "
        "bytes for every token in the conversation.",
        f"It grows in step with the conversation: 0.33 GB at a thousand tokens, 33 GB at a hundred thousand, "
        f"which is already {round(share * 100)}% of the model's own {f(2 * N_EXACT / 1e9, 1)} GB.",
    ])
    emit("o140", st("the per token cache size works out"), "How big the cache gets", yb + 26, b + [body],
         "A formula worth memorising. It turns any model's shape and any conversation's length straight into "
         "gigabytes, and each later technique changes exactly one of its five terms.")


def p30():
    KiB = 1024
    assert KV_PER_TOKEN / KiB == 320 and 4096 / KiB == 4
    assert round(1000 * KV_PER_TOKEN / 2 ** 20, 1) == 312.5
    b = [hd(40, 46, "The same byte counts, read with kilo as 1,000 and as 1,024")]
    C = [40, 230, 380, 520]
    for c, h in zip(C, ["bytes", "in thousands (kB, MB, GB)", "in 1,024s (KiB, MiB, GiB)"]):
        b.append(txt(c, 76, h, "sub2"))
    rows = [("one layer, one token", 4096), ("one token", KV_PER_TOKEN), ("1,000 tokens", 1000 * KV_PER_TOKEN),
            ("10,000 tokens", 10000 * KV_PER_TOKEN), ("100,000 tokens", 100000 * KV_PER_TOKEN)]

    def short(v):
        s_ = sig(v, 4)
        return s_.rstrip("0").rstrip(".") if "." in s_ else s_

    def dec(v):
        for p_, u in ((1e9, "GB"), (1e6, "MB"), (1e3, "kB")):
            if v >= p_:
                return f"{short(v / p_)} {u}"
        return f"{v} B"

    def binr(v):
        for p_, u in ((2 ** 30, "GiB"), (2 ** 20, "MiB"), (2 ** 10, "KiB")):
            if v >= p_:
                return f"{short(v / p_)} {u}"
        return f"{v} B"
    for k, (lab, v) in enumerate(rows):
        y = 100 + k * 26
        b.append(txt(C[0], y, f"{lab}: {g(v)}", "sub2"))
        b.append(txt(C[1], y, dec(v), "sub2"))
        b.append(txt(C[2], y, binr(v), "sub2"))
    assert binr(KV_PER_TOKEN) == "320 KiB" and dec(KV_PER_TOKEN) == "327.7 kB"
    body, yb = prose(100 + 5 * 26 + 30, [
        "Kilo means a thousand everywhere except in computer memory, which is built in powers of two: 2^10 = "
        "1,024 is close to a thousand, so it borrowed the name. To keep them apart, 1,024 bytes is written KiB, "
        "a kibibyte, and 1,000 bytes kB ({{fig:v01-p05}}).",
        "The cache per token is 327,680 bytes: exactly 320 KiB, or 327.68 kB. The lecture's '320 kilobytes' is "
        "the binary one. Multiplied by a thousand tokens it is 312.5 MiB or 327.7 MB; the lecture's 320 MB, "
        "3.2 GB and 32 GB mix the two, and this atlas's 0.33, 3.3 and 33 GB are decimal.",
        "The difference is 2.4% per factor of 1,024, so it never changes a conclusion. It only explains why two "
        "correct sources can print different numbers for the same memory.",
    ])
    assert round((1024 / 1000 - 1) * 100, 1) == 2.4
    emit("p30", st("about 320 kilobytes per token"), "“Kilo” means 1,000, except in “320 KB”, where it means 1,024",
         yb + 26, b + [body],
         "Two conventions, both in daily use. Specification sheets for bandwidth are decimal; memory sizes are "
         "often binary; and a careful reader checks which before comparing.")


# ---- p31: what the cache costs one conversation ------------------------------------------------------
def p31():
    rows = [(0, W_BYTES), (10000, W_BYTES + 10000 * KV_PER_TOKEN), (100000, W_BYTES + 100000 * KV_PER_TOKEN)]
    sp = [BW / v for _, v in rows]
    assert [round(v / 1e9, 1) for _, v in rows] == [140.0, 143.3, 172.8] and [round(s, 1) for s in sp] == [23.9, 23.4, 19.4]
    assert round((1 - sp[2] / sp[0]) * 100) == 19
    b = [hd(40, 46, "Bytes read for each token, weights plus cache, to scale")]
    SC = 290 / rows[-1][1]
    X0 = 200
    for k, (ctx, v) in enumerate(rows):
        y = 70 + k * 46
        b.append(txt(40, y + 20, f"{g(ctx)} tokens of context", "cap"))
        ww = round(W_BYTES * SC, 1)
        b.append(cell(X0, y, ww, 30, "u", rx=3, label="weights, 140 GB" if k == 0 else None))
        if ctx:
            b.append(cell(X0 + ww, y, round((v - W_BYTES) * SC, 1), 30, "h", rx=3))
        b.append(txt(X0 + round(v * SC, 1) + 8, y + 20, f"{f(v / 1e9, 1)} GB: {f(BW / v, 1)} tokens/s", "sub2"))
    body, yb = prose(70 + 3 * 46 + 30, [
        "Every decode step reads all the weights and every key and value kept so far, through the same 3.35 TB/s. "
        "So the speed limit of {{fig:v01-o130}} becomes bandwidth ÷ (weights + cache).",
        "At ten thousand tokens the cache adds 3.3 GB and costs 2% of the speed. At a hundred thousand it adds "
        "32.8 GB and costs 19%: the conversation runs at 19.4 tokens a second instead of 23.9.",
    ])
    emit("p31", st("Every decode step has to read every weight"),
         "At 100,000 tokens the cache costs one conversation a fifth of its speed", yb + 26, b + [body],
         "For one user the cache is a tax that grows with the conversation. Batching, the next figure, turns it "
         "into the main cost.")


# ---- p32: what the cache costs a batch (widget) --------------------------------------------------------
BATCHES = [1, 8, 16, 32, 64, 128, 256]
CTXS = [0, 1000, 2000, 5000, 10000, 20000, 50000, 100000]
B0, C0 = 32, 10000


def batch_step(bsz, ctx):
    by = W_BYTES + bsz * ctx * KV_PER_TOKEN
    ops = 2 * N * bsz
    t = max(by / BW, ops / PEAK)
    t0 = max(W_BYTES / BW, ops / PEAK)
    return dict(by=by, i=ops / by, t=t, total=bsz / t, user=1 / t, nocache=bsz / t0,
                a=min(PEAK, BW * ops / by), cache=bsz * ctx * KV_PER_TOKEN)


s32, s64 = batch_step(32, 10000), batch_step(64, 10000)
assert round(s32["by"] / 1e9, 1) == 244.9 and round(s32["total"]) == 438 and round(s32["nocache"]) == 766
assert round(s64["by"] / 1e9, 1) == 349.7 and round(s64["total"]) == 613 and round(s64["nocache"]) == 1531


def p32_lines(bsz, ctx):
    s = batch_step(bsz, ctx)
    return [f"{bsz} users at {g(ctx)} tokens each: {sig3(s['by'] / 1e9)} GB per step, {sig3(s['cache'] / 1e9)} GB of it cache",
            f"one step: {sig3(s['t'] * 1000)} ms; intensity {sig3(s['i'])} operations per byte",
            f"all users together: {sig3(s['total'])} tokens a second",
            f"without the caches it would be {sig3(s['nocache'])}"]


def p32():
    s0 = batch_step(B0, C0)
    b = [hd(40, 34, "Each user's cache is read only for that user, so a batch's caches add up")]
    b += axes()
    b.append(f'<polyline class="pl-m" points="{roof_points(PEAK, BW)}"/>')
    xr = xs(RIDGE)
    b.append(ln(xr, ys(PEAK) + 4, xr, roof.B, "mark"))
    b.append(txt(xr + 6, roof.B - 10, "ridge, 295", "sub2 halo"))
    b.append(f'<circle data-pt="" cx="{xs(s0["i"])}" cy="{ys(s0["a"])}" r="6" fill="var(--s-fill)" stroke="var(--s)" stroke-width="2"/>')
    for k, line in enumerate(p32_lines(B0, C0)):
        b.append(tag("text", {"class": "sub2", "x": 140, "y": roof.B + 70 + k * 20, "data-r": k}, line))
    body, yl = prose(roof.B + 70 + 4 * 20 + 24, [
        "Batching shares one read of the weights among every user in the batch ({{fig:v01-p24}}). It cannot share "
        "the caches: each user's keys and values belong to that user's conversation, and each step reads all of "
        "them.",
        "So at 32 users with 10,000 tokens each, a step reads 140 GB of weights and 104.9 GB of caches, and the "
        "batch makes 438 tokens a second instead of 766. At 64 users, 613 instead of 1,531. Long conversations "
        "drag the point back down the slope, toward where a single user started.",
        "That is the number behind the claim that this data structure is why every other optimisation in the "
        "series exists. The readouts were checked against Python at every setting.",
    ])
    js = JS_FMT + roof.JS_ROOF + r"""
  const fig = document.currentScript.closest('figure');
  const N = __N__, PEAK = __PEAK__, BW = __BW__, W = __W__, KV = __KV__, BS = __BS__, CS = __CS__, I0 = __I0__;
  const sl = [...fig.querySelectorAll('input[type=range]')], val = [...fig.querySelectorAll('.val')];
  const q = s => fig.querySelector(s);
  function draw() {
    const bsz = BS[+sl[0].value], ctx = CS[+sl[1].value];
    val[0].textContent = gx(bsz); val[1].textContent = gx(ctx);
    const by = W + bsz * ctx * KV, ops = 2 * N * bsz, t = Math.max(by / BW, ops / PEAK);
    const t0 = Math.max(W / BW, ops / PEAK), i = ops / by, a = Math.min(PEAK, BW * i), cache = bsz * ctx * KV;
    const pt = q('[data-pt]'); pt.setAttribute('cx', xs(i)); pt.setAttribute('cy', ys(a));
    const L = [`${bsz} users at ${gx(ctx)} tokens each: ${sig3(by / 1e9)} GB per step, ${sig3(cache / 1e9)} GB of it cache`,
      `one step: ${sig3(t * 1000)} ms; intensity ${sig3(i)} operations per byte`,
      `all users together: ${sig3(bsz / t)} tokens a second`, `without the caches it would be ${sig3(bsz / t0)}`];
    L.forEach((s, k) => q(`[data-r="${k}"]`).textContent = s);
  }
  sl.forEach(s => s.addEventListener('input', draw));
  q('button').addEventListener('click', () => { sl[0].value = I0[0]; sl[1].value = I0[1]; draw(); });
  draw();"""
    for k_, v_ in dict(N=repr(N), PEAK=repr(PEAK), BW=repr(BW), W=repr(W_BYTES), KV=str(KV_PER_TOKEN),
                       BS=json.dumps(BATCHES), CS=json.dumps(CTXS), I0=json.dumps([BATCHES.index(B0), CTXS.index(C0)])).items():
        js = js.replace(f"__{k_}__", v_)
    ctl1 = (f"<label>users <input type='range' min='0' max='{len(BATCHES) - 1}' step='1' value='{BATCHES.index(B0)}'>"
            f"<span class='val'>{g(B0)}</span></label>"
            f"<label>tokens each <input type='range' min='0' max='{len(CTXS) - 1}' step='1' value='{CTXS.index(C0)}'>"
            f"<span class='val'>{g(C0)}</span></label>")
    widget("p32", st("The bigger the cache grows"), "In a batch the weights are shared; the caches are not",
           [ctl1 + "<button type='button'>Reset</button>"], yl + 22, b + [body],
           "The weights stop being the problem once enough users share them. What each user brings with them, "
           "their conversation's keys and values, is what is left.", js)


if __name__ == "__main__":
    for fn in (o134, p27, o139, o138, o140, p30, p31, p32):
        fn()
