"""V7 Part 2, batching built up: review section B (P4-P6) and the fixes to Figs 2-4 (o002-o004).

  o002     voice: "this video" -> "this document"; a caption that judges
  o003     the weights belong to nobody; the two equal bars that contradicted their labels are gone
  a04  P4  a 4 x 4 matrix against one vector and against three: same 16 weights, 3x the work
  a05  P5  intensity = 2PN / 2P = N, worked for the 70B model at N = 1, 8, 64
  a06  P6  widget: slide the batch along the roofline (weights only)
  o004     the static batch as a lane chart: 604 of 2,048 seat-steps, tokens per read 4 -> 1

  python3 figures/V07/src/p2_batching.py
"""
import json
import math
from v07common import *  # noqa: F401,F403

T_READ70 = t_read(W70)
T_TOK70 = t_math(2 * P70)                    # arithmetic time each request adds to a step


# ---- o002: text fixes only ------------------------------------------------------------------------
def o002():
    p = OUT / "o002.html"
    s = p.read_text(encoding="utf-8")
    fixes = [("That sharing is the single most important idea in this video, and the queue is what feeds it.",
              "That sharing is the single most important idea in this document, and the queue is what feeds it."),
             ("Two words that sound similar and mean opposite things. One is a line of people waiting; the other is a group going through the door together.",
              "Two words often used as if they meant the same thing. One is a line of people waiting; the other is a group going through the door together."),
             ("&middot;&nbsp; 1:38</div><h3>Queues and batches", f"&middot;&nbsp; {st('Batching is how a serving system raises')}</div><h3>Queues and batches")]
    for a, b_ in fixes:
        if a in s:
            s = s.replace(a, b_)
    assert "this video" not in s and "sound similar" not in s
    p.write_text(s, encoding="utf-8")
    print("o002  patched")


# ---- o003 -----------------------------------------------------------------------------------------
def o003():
    b = [hd(40, 46, "The weights belong to nobody")]
    b.append(box(40, 84, 190, 56, "h", "one weight matrix", "read once from memory", rx=4))
    ys = [66, 90, 114, 138, 162]
    for i, (y, lab) in enumerate(zip(ys, ["request 1", "request 2", "request 3", "…", "request N"])):
        b.append(arr(236, 112, 280, y + 8))
        b.append(cell(286, y, 96, 16, "s", rx=2, label=lab))
    b.append(txt(396, 116, "one token vector from each request,", "sub2"))
    b.append(txt(396, 132, "all multiplied by the same weights", "sub2"))
    body, yb = prose(222, [
        "When the GPU pulls a weight matrix out of high-bandwidth memory, nothing about that matrix "
        "belongs to any particular user. So instead of reading the weights, computing one token and "
        "starting over, the system gathers N requests that each need a decode step, reads each weight "
        "matrix once, and multiplies it against all N token vectors at the same time.",
        "The thin matrix-vector product becomes a fat matrix-matrix product. The next two figures count "
        "what that does: the bytes moved stay where they were, and the useful work grows N times.",
        "One read of the weights now produces N tokens instead of one.",
    ])
    emit("o003", st("The weights are identical for every request"), "Why batching works at all",
         yb + 32, b + [body],
         "It works for exactly one reason: the weights are identical for every request. Nothing else "
         "in the forward pass has that property, which is what {{ref:v07-o005}} is about.")


# ---- a04 · P4 -------------------------------------------------------------------------------------
Wm = [[1, 0, 2, 1], [0, 1, 1, 0], [2, 1, 0, 1], [1, 2, 1, 0]]
vecs = {"a": [1, 2, 0, 1], "b": [0, 1, 1, 2], "c": [2, 0, 1, 1]}
mv = lambda M, v: [sum(m * x for m, x in zip(row, v)) for row in M]
outs = {k: mv(Wm, v) for k, v in vecs.items()}
assert outs["a"] == [2, 2, 5, 5]


def a04():
    b = [hd(40, 46, "The same 16 weights, used against one token's vector, then against three")]
    C, G = 22, 3
    def grid(x, y, M, cls):
        o = []
        for r, row in enumerate(M):
            for c, v in enumerate(row):
                o.append(cell(x + c * (C + G), y + r * (C + G), C, C, cls, rx=2, label=str(v)))
        return o
    def cols(x, y, vs, cls):
        o = []
        for j, v in enumerate(vs):
            for r, val in enumerate(v):
                o.append(cell(x + j * (C + G), y + r * (C + G), C, C, cls, rx=2, label=str(val)))
        return o
    Y = 82
    mw = 4 * C + 3 * G
    # left: one token
    x = 40
    b += grid(x, Y, Wm, "h")
    b.append(txt(x + mw + 10, Y + 52, "×", "sub2", "middle"))
    b += cols(x + mw + 20, Y, [vecs["a"]], "u")
    b.append(txt(x + mw + 20 + C + 12, Y + 52, "=", "sub2", "middle"))
    b += cols(x + mw + 20 + C + 24, Y, [outs["a"]], "m")
    b.append(txt(x, Y - 10, "one token, a", "sub2"))
    # right: three tokens
    x2 = 330
    b += grid(x2, Y, Wm, "h")
    b.append(txt(x2 + mw + 10, Y + 52, "×", "sub2", "middle"))
    w3 = 3 * C + 2 * G
    b += cols(x2 + mw + 20, Y, [vecs[k] for k in "abc"], "u")
    b.append(txt(x2 + mw + 20 + w3 + 12, Y + 52, "=", "sub2", "middle"))
    b += cols(x2 + mw + 20 + w3 + 24, Y, [outs[k] for k in "abc"], "m")
    b.append(txt(x2, Y - 10, "three tokens, a, b and c, side by side", "sub2"))
    # the count, as a table
    rows = [("weights read", 16, 16), ("multiply-adds", 16, 48), ("operations, 2 each", 32, 96),
            ("bytes of weights, 2 each", 32, 32), ("operations per byte", 1, 3)]
    assert rows[1][2] == 16 * 3 and rows[2][2] == 2 * rows[1][2] and rows[4][2] == rows[2][2] / rows[3][2]
    TY = Y + 4 * (C + G) + 40
    b.append(txt(250, TY, "one token", "sub2", "end"))
    b.append(txt(540, TY, "three tokens", "sub2", "end"))
    for i, (lab, v1, v3) in enumerate(rows):
        y = TY + 26 + i * 24
        b.append(txt(40, y, lab, "cap"))
        b.append(txt(250, y, str(v1), "sub2", "end"))
        b.append(txt(540, y, str(v3), "sub2", "end"))
    body, yb = prose(TY + 26 + 5 * 24 + 26, [
        "Each output number is one row of the matrix times the token's vector, multiplied pair by pair "
        "and added: four multiply-adds ({{fig:v01-o085}}). Four rows make 16, and each of the 16 "
        "weights is used exactly once.",
        "Put three tokens' vectors side by side and the same 16 weights, read once, each do three "
        f"multiply-adds: 48 in all. Column a's answer, {', '.join(map(str, outs['a']))}, is identical on "
        "both sides. Batching changes nothing about what any request gets back.",
        "At 2 bytes a weight, 32 bytes buy 32 operations on the left and 96 on the right. In a real "
        "layer the vectors are tiny beside the matrix: a 4,096 × 4,096 matrix holds 16.8 million "
        "weights against 4,096 numbers per token, so the weights are the bytes that count.",
    ])
    assert 4096 * 4096 == 16_777_216
    emit("a04", st("need a decode step, reads each weight matrix once"),
         "A matrix times three vectors still reads the matrix once", yb + 32, b + [body],
         "Three times the work for the same bytes. The weights stayed put; only the number of "
         "requests sharing them changed.")


# ---- a05 · P5 -------------------------------------------------------------------------------------
def a05():
    b = [hd(40, 46, "The same count for a model of P weights and a batch of N requests")]
    steps = [("operations per step  =  2 × P × N", "2 operations per weight, for each of N tokens"),
             ("bytes per step  =  2 × P", "each weight read once, 2 bytes, whoever uses it"),
             ("intensity  =  2PN ÷ 2P  =  N", "the 2 and the P cancel: only the batch is left")]
    for i, (e, note) in enumerate(steps):
        y = 66 + i * 58
        b.append(eq(40, y, 280, e, "m" if i == 2 else "u", h=38))
        b.append(txt(336, y + 23, note, "sub2"))
    # the 70B example
    TY = 66 + 3 * 58 + 34
    b.append(hd(40, TY, "The series' 70B model, P = 70 billion, on an H100"))
    heads = ["N", "operations", "bytes read", "arithmetic", "read", "tokens a second"]
    X = [70, 190, 290, 400, 490, 640]
    for x, h_ in zip(X, heads):
        b.append(txt(x, TY + 28, h_, "sub2", "end"))
    rows = []
    for k, n in enumerate((1, 8, 64)):
        ops = 2 * P70 * n
        tm, tr = t_math(ops), T_READ70
        step = max(tm, tr)
        rows.append((n, ops, tm, step, n / step))
        y = TY + 54 + k * 26
        b.append(txt(X[0], y, str(n), "cap", "end"))
        b.append(txt(X[1], y, f"{fc(ops / 1e9)} billion" if ops < 1e12 else f"{f(ops / 1e12, 2)} trillion", "sub2", "end"))
        b.append(txt(X[2], y, "140 GB", "sub2", "end"))
        b.append(txt(X[3], y, f"{ms(tm, 3 if tm < 1e-3 else 2)} ms", "sub2", "end"))
        b.append(txt(X[4], y, f"{ms(tr, 1)} ms", "sub2", "end"))
        b.append(cell(X[5] - 70, y - 15, 70, 21, "s" if n > 1 else "u", label=fc(n / step, 1) if n / step < 100 else fc(n / step)))
    assert all(r[2] < T_READ70 for r in rows)                         # still memory-bound at 64
    assert [round(r[4], 1) for r in rows] == [23.9, 191.4, 1531.4]
    body, yb = prose(TY + 54 + 3 * 26 + 30, [
        "A step takes the longer of its reading and its arithmetic ({{fig:v01-o123}}). At 64 requests "
        f"the arithmetic has grown to {ms(rows[2][2], 2)} ms, still well inside the {ms(T_READ70, 1)} ms "
        "read, so the step costs exactly what it cost for one request.",
        f"Every extra request is therefore an extra token for free: 64 requests get {fc(rows[2][4])} "
        f"tokens a second out of reads that gave one request {f(rows[0][4], 1)}. That is the "
        "intensity rising from 1 to 64, read as a speed.",
    ])
    emit("a05", st("Look at what that does to the arithmetic"), "Intensity rises one for one with the batch",
         yb + 32, b + [body],
         "The cancelled P is the whole trick: intensity stops depending on the model and depends only "
         "on how many requests share each read.")


# ---- a06 · P6: the widget -------------------------------------------------------------------------
NS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 295, 512, 1024]
AX = dict(X0=110, X1=620, Y0=262, Y1=70, xlo=0.1, xhi=1e4, ylo=1, yhi=1000)
BX0, BSC = 150, 480 / 150e-3                       # step-time bars: 150 ms across 480 px


def fa(v):
    return f(v, 2) if v < 10 else f(v, 1)


def ft(sec):
    m = sec * 1e3
    return f(m, 3) if m < 1 else (f(m, 2) if m < 10 else f(m, 1))


def ftps(v):
    return fc(v, 1) if v < 100 else fc(v)


def batch_state(n):
    """Everything the widget prints for batch n, as strings."""
    att = min(PEAK, BW * n) / 1e12
    tm, tr = t_math(2 * P70 * n), T_READ70
    step = max(tm, tr)
    tps = n / step
    return {
        "val": str(n),
        "r1": f"batch {n}: intensity {n} operation{'s' if n > 1 else ''} per byte, attainable {fa(att)} of 989 TFLOP/s",
        "r2": f"step = the longer of {ft(tr)} ms reading and {ft(tm)} ms arithmetic = {ft(step)} ms",
        "r3": f"{ftps(tps)} tokens a second in total; each user waits {ft(step)} ms per token",
        "_att": att, "_tm": tm, "_tr": tr,
    }


A06_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const NS = __NS__, PEAK = 989e12, BW = 3.35e12, W = 140e9, P = 70e9;
  const A = __AX__, BX0 = __BX0__, BSC = __BSC__;
  const lg = Math.log10;
  const px = v => A.X0 + (lg(v) - lg(A.xlo)) / (lg(A.xhi) - lg(A.xlo)) * (A.X1 - A.X0);
  const py = v => A.Y0 - (lg(v) - lg(A.ylo)) / (lg(A.yhi) - lg(A.ylo)) * (A.Y0 - A.Y1);
  __FMT__
  const fa = v => v < 10 ? fx(v, 2) : fx(v, 1);
  const ft = s => { const m = s * 1e3; return m < 1 ? fx(m, 3) : (m < 10 ? fx(m, 2) : fx(m, 1)); };
  const ftps = v => v < 100 ? fcx(v, 1) : fcx(v);
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val');
  const q = s => fig.querySelector(s);
  function draw() {
    const n = NS[+sl.value];
    const att = Math.min(PEAK, BW * n) / 1e12, tm = 2 * P * n / PEAK, tr = W / BW, step = Math.max(tm, tr);
    const tps = n / step;
    val.textContent = String(n);
    const d = q('[data-pt]');
    d.setAttribute('x', (px(n) - 5).toFixed(1)); d.setAttribute('y', (py(att) - 5).toFixed(1));
    q('[data-r1]').textContent = `batch ${n}: intensity ${n} operation${n > 1 ? 's' : ''} per byte, attainable ${fa(att)} of 989 TFLOP/s`;
    q('[data-r2]').textContent = `step = the longer of ${ft(tr)} ms reading and ${ft(tm)} ms arithmetic = ${ft(step)} ms`;
    q('[data-r3]').textContent = `${ftps(tps)} tokens a second in total; each user waits ${ft(step)} ms per token`;
    q('[data-bm]').setAttribute('width', Math.max(tm * BSC, 2).toFixed(1));
  }
  sl.addEventListener('input', draw);
  q('button').addEventListener('click', () => { sl.value = 0; draw(); });
  draw();
})();</script>"""


def a06():
    A = LogAxes(**AX)
    s0 = batch_state(1)
    b = [hd(40, 34, "One point per batch size, on the roofline of the 70B model's weights")]
    b += A.draw([0.1, 1, 10, 100, 1000, 10000], [1, 10, 100, 1000],
                "arithmetic intensity: operations per byte moved", "TFLOP/s attainable")
    x_floor = 1 / (BW / 1e12)
    b.append(poly([(A.px(x_floor), A.py(1)), (A.px(RIDGE), A.py(PEAK / 1e12)), (A.px(1e4), A.py(PEAK / 1e12))], "pl-h"))
    xr = A.px(RIDGE)
    b.append(ln(round(xr, 1), round(A.py(PEAK / 1e12), 1) + 8, round(xr, 1), A.Y0, "mark"))
    b.append(halo(round(xr, 1) + 8, round(A.py(PEAK / 1e12)) + 26, f"ridge, batch {round(RIDGE)}"))
    cx, cy = A.px(1), A.py(s0["_att"])
    b.append(f'<g class="m"><rect x="{cx - 5:.1f}" y="{cy - 5:.1f}" width="10" height="10" rx="5" data-pt=""/></g>')
    # the two times, to scale
    YB = A.Y0 + 66
    b.append(txt(40, YB + 15, "reading", "cap"))
    b.append(cell(BX0, YB, round(T_READ70 * BSC, 1), 22, "h", rx=2))
    b.append(txt(40, YB + 45, "arithmetic", "cap"))
    b.append(f'<g class="m"><rect x="{BX0}" y="{YB + 30}" width="{max(s0["_tm"] * BSC, 2):.1f}" height="22" rx="2" data-bm=""/></g>')
    b.append(txt(round(BX0 + T_READ70 * BSC + 8, 1), YB + 15, f"{ft(T_READ70)} ms, whatever the batch", "sub2"))
    b.append(ln(BX0, YB + 60, BX0 + 480, YB + 60, "axis"))
    for v in (0, 50, 100, 150):
        x = BX0 + v / 1e3 * BSC
        b.append(tick(x, YB + 60, x, YB + 65))
        b.append(txt(round(x, 1), YB + 82, f"{v} ms" if v == 150 else str(v), "sub2", "middle" if v < 150 else "end"))
    RY = YB + 108
    for k in (1, 2, 3):
        b.append(f'<text class="sub2" x="40" y="{RY + (k - 1) * 20}" data-r{k}="">{esc(s0[f"r{k}"])}</text>')
    body, yb = prose(RY + 2 * 20 + 38, [
        f"Each request added to the step adds 2 × 70 billion operations, {ft(T_TOK70)} ms of arithmetic, "
        f"and no bytes. Up to {round(RIDGE)} requests the arithmetic still finishes inside the "
        f"{ft(T_READ70)} ms read: the step costs the same, and every added request is a token for free.",
        f"Past {round(RIDGE)} the arithmetic is the longer of the two. Each further request lengthens "
        f"the step by {ft(T_TOK70)} ms for every user, and the total stops rising at 989 trillion ÷ 140 "
        f"billion = {fc(PEAK / (2 * P70))} tokens a second.",
        fwd("a09",
            "This counts the weights alone. The next figures add what every request brings with it, and "
            "the curve bends long before 295 ({{fig:v07-a09}}). The widget's arithmetic was checked "
            "against Python at every setting.",
            "This counts the weights alone. The next figures add what every request brings with it, and "
            "the curve bends long before 295. The widget's arithmetic was checked against Python at "
            "every setting."),
    ])
    ctl = (f"<div class='ctl'><label>batch size <input type='range' min='0' max='{len(NS) - 1}' step='1' "
           f"value='0'><span class='val'>{s0['val']}</span></label>"
           "<button type='button'>Reset</button></div>")
    js = (A06_JS.replace("__NS__", json.dumps(NS)).replace("__AX__", json.dumps(AX))
          .replace("__BX0__", str(BX0)).replace("__BSC__", repr(BSC)).replace("__FMT__", JS_FMT))
    widget("a06", st("toward the compute-bound region"), "Batch 295 is where decode reaches the ridge",
           ctl, yb + 26, b + [body],
           "Batching is free up to the ridge and costs every user time past it. Real batches stop far "
           "short of 295, for a reason the cache figures below work out.", js)


def a06_cases():
    """(slider index, {selector: expected text}) for the browser check."""
    out = []
    for i, n in enumerate(NS):
        s = batch_state(n)
        out.append(({"input[type=range]": i}, {".val": s["val"], "[data-r1]": s["r1"], "[data-r2]": s["r2"],
                                              "[data-r3]": s["r3"]}))
    return out


# ---- o004 -----------------------------------------------------------------------------------------
NEED = [8, 24, 60, 512]


def o004():
    T = max(NEED)
    used = sum(NEED)
    cap = len(NEED) * T
    occ = [sum(1 for n in NEED if t < n) for t in range(T)]          # requests generating at step t
    assert used == 604 and cap == 2048 and sum(occ) == used
    assert round(used / cap * 100, 1) == 29.5 and round((1 - used / cap) * 100, 1) == 70.5
    assert round(used / T, 2) == 1.18 and T - NEED[0] == 504 and T - NEED[2] == 452
    b = [hd(40, 46, "Four requests that need 8, 24, 60 and 512 decode steps, locked together")]
    X0, X1 = 182, 630
    sc = (X1 - X0) / T
    for i, n in enumerate(NEED):
        y = 68 + i * 38
        b.append(txt(40, y + 19, f"request {i + 1}, {n} steps", "cap"))
        b.append(track(X0, y, X1 - X0, 26))
        b.append(cell(X0, y, max(n * sc, 2), 26, "m", rx=2))
        if i == 0:
            b.append(txt((X0 + X1) / 2, y + 17, "seat held, computing nothing anyone asked for", "sub2", "middle"))
    ya = 68 + 4 * 38 + 4
    for v in (0, 128, 256, 384, 512):
        x = X0 + v * sc
        b.append(tick(x, ya, x, ya + 5))
        b.append(txt(round(x, 1), ya + 19, str(v) + (" steps" if v == 512 else ""), "sub2", "middle" if v < 512 else "end"))
    # tokens per read of the weights, step by step
    ys = ya + 78
    b.append(txt(40, ys - 4, "tokens per read", "cap"))
    segs = [(0, 8, 4), (8, 24, 3), (24, 60, 2), (60, 512, 1)]
    for a_, e_, k in segs:
        assert all(occ[t] == k for t in range(a_, e_))
        b.append(cell(X0 + a_ * sc, ys - k * 9, (e_ - a_) * sc, k * 9, "s", rx=1))
    b.append(txt(X0, ys + 18, f"4, then 3, then 2, then 1 for the last {T - NEED[2]} steps", "sub2"))
    # work delivered against room
    yw = ys + 46
    b.append(txt(40, yw + 18, "seats used", "cap"))
    b.append(track(X0, yw, 240, 26))
    b.append(cell(X0, yw, used / cap * 240, 26, "s", rx=2))
    b.append(txt(X0 + 252, yw + 18, f"{used} of {fc(cap)} seat-steps, {f(used / cap * 100, 1)}%", "sub2"))
    body, yb = prose(yw + 70, [
        "That N is not a number anyone sets: it is however many requests are generating at that step. "
        "The first serving systems fixed it when the batch formed. They scheduled whole requests: "
        "collect a batch, run it, and hold its membership until every sequence has emitted its "
        "end-of-sequence token, the stop signal a model produces when its answer is done "
        "({{fig:v01-o029}}).",
        f"Here the batch is locked for {T} steps, because that is when the last request finishes. The "
        f"first is done after {NEED[0]} and its seat keeps running for the remaining {T - NEED[0]}; for "
        f"the final {T - NEED[2]} steps one request runs alone.",
        f"Seats used: {' + '.join(map(str, NEED))} = {used} of 4 × {T} = {fc(cap)}, which is "
        f"{f(used / cap * 100, 1)}%. Tokens per read of the weights slide from 4 to 1 and average "
        f"{used} ÷ {T} = {f(used / T, 2)}. And a finished request cannot be returned to its user until "
        f"the whole batch drains: the {NEED[0]}-step answer waits {T - NEED[0]} steps.",
    ])
    emit("o004", st("That N, though, is not a number anyone"), "A static batch drains to a single survivor",
         yb + 32, b + [body],
         f"More than two thirds of the capacity is wasted on this mix, {f((1 - used / cap) * 100, 1)}%. "
         "The longest request sets the pace for everyone locked in with it.")


if __name__ == "__main__":
    for fn in (o002, o003, a04, a05, a06, o004):
        fn()
