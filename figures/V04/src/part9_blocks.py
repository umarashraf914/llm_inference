"""V4 Part 9, block formats (15:11-16:49): review entries 32 (p32 widget), 33 (p33) and 34 (p34), with
Figs 73 and 74 redrawn and Figs 75 and 76 corrected.

  Fig 73: bars on a labelled log axis (they were 250/125/31 px for 16.8 million / 4,096 / 16-32), and
          "spoils one row or one column".
  Fig 74: blocks of 16 along a row, as the formats define them; ruined cells tinted h in both panels.
  Fig 75: "one fetch" dropped: cuBLAS keeps block scales in their own tiled array.
  Fig 76: caption ("the same granularity" contradicted 32 against 16); pointers to p32-p34.

Sources read: OCP Microscaling Formats (MX) v1.0, section 6.3 (X = largest power of two <= max|V|,
divided by the element type's largest power of two; elements rounded ties-to-even and clamped) and
Table 7 (E8M0, exponents -127 to 127). cuBLAS documentation, "1D Block Quantization" (block scale =
amax / Amax(type); for UE8M0 the exponent is rounded up, "differs from the OCP MXFP suggested rounding";
for FP4 the scale is e4m3(amax / 6) after a tensorwide factor Amax(e2m1) x Amax(e4m3) / Amax(D)) and
"1D Block Scaling Factors Layout" (scales stored in a tiled layout, 128 x 4 tiles). NVIDIA's NVFP4
post: 16-value blocks, E4M3 scale, a second-level FP32 scale per tensor so that blocks fit E4M3,
"approximately 3.5x relative to FP16 and 1.8x compared to FP8".

  python3 figures/V04/src/part9_blocks.py
"""
import json, math
from fractions import Fraction as Fr
import numpy as np
from common import (emit, emit_widget, hd, cell, ghost, text, tick, hline, ln, rect, dot, prose, f, fi, nb,
                    sup, MINUS, esc, st)
from fixes import reprose, apply
from numfmt import round_to, limits

FP4 = [0, 0.5, 1, 1.5, 2, 3, 4, 6]
assert [float(v) for v in __import__("numfmt").values("E2M1")] == FP4


# ---- Fig 73: how many values share a scale, on a log axis ---------------------------------------------------
def o073():
    rows = [("Per tensor", "one scale for a whole", 4096 * 4096, "h", "most fragile"),
            ("Per channel or per token", "the grain SmoothQuant and the KV cache methods work at", 4096, "m",
             "spoils one row or one column"),
            ("Microscaling", "blocks of 16 or 32 values", 16, "s", "spoils its own block only")]
    assert math.log2(4096 * 4096) == 24 and math.log2(4096) == 12
    PX = 11                                                  # pixels per doubling
    x0 = 260
    b = [hd(40, 40, "How many numbers share a single scale?")]
    for k, (name, sub, n, cls, note) in enumerate(rows):
        y = 70 + k * 72
        b.append(text(40, y + 18, name, "cap"))
        b.append(text(40, y + 38, sub if k != 1 else "the grain SmoothQuant and the", "sub2"))
        if k == 1:
            b.append(text(40, y + 54, "KV cache methods work at", "sub2"))
        if k == 0:
            b.append(text(40, y + 54, "4,096 × 4,096 matrix", "sub2"))
        w = math.log2(n) * PX
        if k == 2:
            b.append(rect(x0, y, 5 * PX, 34, "s", rx=3))     # 32: the longer of the two
            b.append(rect(x0, y, 4 * PX, 34, "s", rx=3))     # 16
            w = 5 * PX
        else:
            b.append(rect(x0, y, w, 34, cls, rx=3))
        label = {0: "16,777,216 = 2²⁴", 1: "4,096 = 2¹²", 2: "16 or 32 = 2⁴ or 2⁵"}[k]
        b.append(text(x0 + w + 10, y + 15, label, "sub2"))
        b.append(text(x0 + w + 10, y + 31, note, "sub2"))
    ya = 70 + 3 * 72 - 6
    b.append(hline(x0, x0 + 24 * PX, ya))
    for e in range(0, 25, 4):
        b.append(tick(x0 + e * PX, ya, ya + 5))
        b.append(text(x0 + e * PX, ya + 19, "2" + sup(e), "sub2", "middle"))
    body, y = prose(ya + 56, [
        "Bar length is how many times the count doubles, log₂ of the number of values one scale covers, "
        "so this is a log scale: the top bar covers 4,096 times as many values as the middle one. Finer "
        "grain costs more scale storage and buys more containment. That is the entire trade.",
    ])
    b.append(body)
    emit("o073", st("Underneath all of these methods"), "The choice underneath everything", y + 26, b,
         "Once you see this axis the methods stop looking like a list of tricks and start looking like "
         "points on a single dial.")


# ---- Fig 74: containment, with blocks of 16 along each row ----------------------------------------------------
def o074():
    cols, rows, blk = 32, 4, 16
    pitch, cw, ch_, rh = 18, 16, 18, 24
    x0 = 52
    out_at = (1, 20)
    b = [hd(40, 40, "Per tensor: one outlier anywhere ruins everything")]

    def grid(y0, cls_of):
        g = []
        for i in range(rows):
            for j in range(cols):
                c = cls_of(i, j)
                lab = "!" if (i, j) == out_at else None
                g.append(cell(x0 + j * pitch, y0 + i * rh, cw, ch_, c, rx=2, label=lab))
        return g
    b += grid(60, lambda i, j: "h")
    b.append(ghost(x0 - 4, 56, cols * pitch + 6, rows * rh + 2, rx=4))
    y2 = 60 + rows * rh + 64
    b.append(hd(40, y2 - 20, "Microscaling, blocks of 16 along each row: it ruins its own block and nothing else"))
    hot_blk = (out_at[0], out_at[1] // blk)
    b += grid(y2, lambda i, j: "h" if (i, j // blk) == hot_blk else "s")
    for i in range(rows):
        for k in range(cols // blk):
            b.append(ghost(x0 - 2 + k * blk * pitch, y2 - 3 + i * rh, blk * pitch + 2, ch_ + 6, rx=3))
    yl = y2 + rows * rh + 26
    b.append(text(40, yl, "!  the outlier;  red: values the outlier's scale rounds away", "sub2"))
    b.append(text(40, yl + 18, "teal: values kept at the precision their own scale allows;  dashed: values that "
                  "share one scale", "sub2"))
    body, y = prose(yl + 58, [
        "Same data, same outlier, entirely different blast radius. With one scale for the tensor, the "
        "outlier sets the step for every value, and the ordinary ones round to 0 ({{fig:v04-p29}} measured "
        "it). With a scale per block of 16, the outlier sets the step for its own 15 neighbours only.",
        "This is an old idea called block floating point, and its payoff is containment.",
    ])
    b.append(body)
    emit("o074", "15:33", "Containment", y + 26, b,
         "A local outlier blows up its own little block and leaves the rest of the tensor at the precision "
         "its own scale allows.")


# ---- Figs 75 and 76: text ------------------------------------------------------------------------------------
def fix_75_76():
    reprose("o075", 186, [
        "Each block's scale travels with its block: the format pairs every 16 or 32 codes with one scale, "
        "the matrix-multiply kernel loads a tile of codes together with the tile of scales that belongs to "
        "it, and Blackwell's tensor cores apply the scales as they multiply. In memory, cuBLAS keeps the "
        "scales in an array of their own, laid out tile by tile to match the codes.",
        "What containment costs is storage: one 8-bit scale per block, half a bit per value for blocks of "
        "16 and a quarter of a bit for 32 ({{fig:v04-p34}}).",
    ], caption="The scale is part of the block: every 16 or 32 codes mean nothing without the one number "
               "that sizes them.")
    reprose("o076", 306, [
        "An E8M0 scale is all exponent and no mantissa, so it can only ever be an exact power of two "
        "({{fig:v04-p32}} shows what that costs). An FP8 scale, E4M3 ({{fig:v04-p07}}), has mantissa bits, "
        "so it can sit between powers and fit the block more tightly; its narrower range is what the "
        "FP32 factor is for ({{fig:v04-p33}}). Both formats store FP4 values, the fifteen of "
        "{{fig:v04-p06}}.",
        "Nvidia report the tighter blocks and finer scales cutting quantization error by 88% against "
        "MXFP4. That figure comes from the vendor whose format wins.",
    ], caption="Two designs at the finest practical grain, differing in block size and in how precisely the "
               "shared scale can be written.")


# ---- p32: a power-of-two scale moves in factors of two (widget) ------------------------------------------------
_rng = np.random.default_rng(11)
P = [round(float(v), 3) for v in np.abs(_rng.standard_normal(16))]
_m = max(P)
P = [round(v / _m, 3) for v in P]
P[P.index(max(P))] = 1.0
assert max(P) == 1.0 and len(set(P)) == 16 and min(P) > 0.01
A0, ALO, AHI = 11.0, 2.0, 15.9
X0, X1, VMAX = 50, 630, 17


def exp2floor(y):
    e = math.floor(math.log2(y))
    while 2.0 ** e > y:
        e -= 1
    while 2.0 ** (e + 1) <= y:
        e += 1
    return e


def rne(q):
    r = math.floor(q)
    d = q - r
    return r + 1 if d > 0.5 else r if d < 0.5 else (r if r % 2 == 0 else r + 1)


def fp4(u):
    for k in range(7):
        mid = (FP4[k] + FP4[k + 1]) / 2
        if u < mid:
            return FP4[k]
        if u == mid:
            return FP4[k] if k % 2 == 0 else FP4[k + 1]
    return 6


def e4m3(y):
    e = exp2floor(y)
    step = 2.0 ** (e - 3)
    return rne(y / step) * step


def jsnum(x):
    """A number as JavaScript's String() prints it, for the dyadic values here."""
    s = repr(float(x))
    return s[:-2] if s.endswith(".0") else s


def px(v):
    return X0 + v / VMAX * (X1 - X0)


def p32_frame(a):
    vals = [a * p for p in P]
    X = 2.0 ** (exp2floor(a) - 2)
    S = e4m3(a / 6)
    out = {"val": f(a, 1)}
    for key, sc in (("mx", X), ("nv", S)):
        st_ = [sc * fp4(v / sc) for v in vals]
        err = [s - v for s, v in zip(st_, vals)]
        acc = 0.0
        for e in err:
            acc += e * e
        r = math.sqrt(acc / len(err))
        top = max(range(16), key=lambda i: vals[i])
        out[key] = {"scale": jsnum(sc), "levels": ", ".join(jsnum(sc * g) for g in FP4),
                    "big": f(a, 1), "stored": jsnum(st_[top]), "off": f(abs(err[top]), 2), "rms": f(r, 3),
                    "sx": [f(px(s), 1) for s in st_], "gx": [f(px(sc * g), 1) for g in FP4]}
    out["vx"] = [f(px(v), 1) for v in vals]
    out["ideal"] = f(a / 6, 3)
    out["nums"] = (X, S)
    return out


SETTINGS = [round(ALO + k / 10, 1) for k in range(int(round((AHI - ALO) * 10)) + 1)]

# the claims, checked, with numfmt's exact rounding as a second opinion
for a in SETTINGS:
    X, S = p32_frame(a)["nums"]
    ideal = a / 6
    assert 0.75 < X / ideal <= 1.5 and abs(S / ideal - 1) <= 0.0625 + 1e-12
    assert float(round_to(Fr(a) / 6, "E4M3")) == S
    up = 2.0 ** math.ceil(math.log2(ideal))
    assert 1 <= up / ideal < 2
    for p in P:
        v = a * p
        assert fp4(v / X) == float(round_to(Fr(v) / Fr(X), "E2M1")) and fp4(v / S) == float(round_to(Fr(v) / Fr(S), "E2M1"))
    assert max(S * g for g in FP4) < VMAX
fr11, fr7 = p32_frame(11.0), p32_frame(7.0)
assert (fr11["mx"]["scale"], fr11["mx"]["stored"], fr11["mx"]["off"]) == ("2", "12", "1.00")
assert (fr11["nv"]["scale"], fr11["nv"]["stored"], fr11["nv"]["off"]) == ("1.875", "11.25", "0.25")
assert (fr7["mx"]["scale"], fr7["mx"]["stored"], fr7["mx"]["off"]) == ("1", "6", "1.00")
assert (fr7["nv"]["scale"], fr7["nv"]["stored"], fr7["nv"]["off"]) == ("1.125", "6.75", "0.25")

P32_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const P = __P__, FP4 = [0, 0.5, 1, 1.5, 2, 3, 4, 6], [X0, X1, VMAX] = __AX__, A0 = __A0__;
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val');
  const fx = (v, d) => (v < 0 && Math.abs(v).toFixed(d) !== (0).toFixed(d) ? '−' : '') + Math.abs(v).toFixed(d);
  const px = v => X0 + v / VMAX * (X1 - X0);
  const exp2floor = y => { let e = Math.floor(Math.log2(y));
    while (Math.pow(2, e) > y) e--; while (Math.pow(2, e + 1) <= y) e++; return e; };
  const rne = q => { const r = Math.floor(q), d = q - r; return d > 0.5 ? r + 1 : d < 0.5 ? r : (r % 2 === 0 ? r : r + 1); };
  const fp4 = u => { for (let k = 0; k < 7; k++) { const mid = (FP4[k] + FP4[k + 1]) / 2;
    if (u < mid) return FP4[k]; if (u === mid) return k % 2 === 0 ? FP4[k] : FP4[k + 1]; } return 6; };
  const e4m3 = y => { const e = exp2floor(y), step = Math.pow(2, e - 3); return rne(y / step) * step; };
  const set = (k, s) => fig.querySelectorAll(`[data-k="${k}"]`).forEach(e => e.textContent = s);
  function draw() {
    const a = parseFloat(sl.value), vals = P.map(p => a * p);
    val.textContent = fx(a, 1);
    fig.querySelectorAll('[data-v]').forEach((e, i) => e.setAttribute('cx', fx(px(vals[i % 16]), 1)));
    let top = 0; for (let i = 1; i < 16; i++) if (vals[i] > vals[top]) top = i;
    for (const [key, sc] of [['mx', Math.pow(2, exp2floor(a) - 2)], ['nv', e4m3(a / 6)]]) {
      const st = vals.map(v => sc * fp4(v / sc)); let acc = 0;
      for (let i = 0; i < 16; i++) { const e = st[i] - vals[i]; acc += e * e; }
      fig.querySelectorAll(`[data-s="${key}"]`).forEach((e, i) => e.setAttribute('cx', fx(px(st[i]), 1)));
      fig.querySelectorAll(`[data-g="${key}"]`).forEach((e, i) => { const x = fx(px(sc * FP4[i]), 1);
        e.setAttribute('x1', x); e.setAttribute('x2', x); });
      set(key + '-scale', String(sc)); set(key + '-levels', FP4.map(g => String(sc * g)).join(', '));
      set(key + '-big', fx(a, 1)); set(key + '-stored', String(st[top]));
      set(key + '-off', fx(Math.abs(st[top] - vals[top]), 2)); set(key + '-rms', fx(Math.sqrt(acc / 16), 3));
    }
    set('ideal', fx(a / 6, 3));
  }
  sl.addEventListener('input', draw);
  fig.querySelectorAll('button[data-a]').forEach(bt => bt.addEventListener('click', () => { sl.value = bt.dataset.a; draw(); }));
  fig.querySelector('button[data-reset]').addEventListener('click', () => { sl.value = A0; draw(); });
  draw();
})();</script>"""


def tsp(key, s):
    return f'<tspan data-k="{key}">{esc(s)}</tspan>'


def p32():
    fr = p32_frame(A0)
    b = [hd(40, 30, "The same 16 values as one block in each format")]
    b.append(text(40, 48, "dots above each line: the values;  below it: where each is stored;  ticks: the 8 levels",
                  "sub2"))
    panels = [("mx", "MXFP4: the largest power of two not above the block's largest value, ÷ 4 (the OCP rule)"),
              ("nv", "NVFP4: the block's largest value ÷ 6, rounded to the nearest FP8 (E4M3) number")]
    for k, (key, title) in enumerate(panels):
        y0 = 84 + k * 168
        b.append(text(40, y0, title, "cap"))
        ay = y0 + 46
        b.append(hline(X0, X1, ay))
        for v in range(0, 17, 2):
            b.append(tick(px(v), ay, ay + 4, "axis"))
            b.append(text(px(v), ay + 34, str(v), "sub2", "middle"))
        for g, gx in zip(FP4, fr[key]["gx"]):
            b.append(f'<line class="tick" data-g="{key}" x1="{gx}" y1="{ay - 9}" x2="{gx}" y2="{ay + 9}"/>')
        for i, vx in enumerate(fr["vx"]):
            b.append(f'<circle data-v="{i}" cx="{vx}" cy="{ay - 16}" r="3.5" fill="var(--m-fill)" stroke="var(--m)" '
                     f'stroke-width="1.2"/>')
        for i, sx in enumerate(fr[key]["sx"]):
            b.append(f'<circle data-s="{key}" cx="{sx}" cy="{ay + 16}" r="3.5" fill="var(--s-fill)" '
                     f'stroke="var(--s)" stroke-width="1.2"/>')
        d = fr[key]
        b.append(f'<text class="sub2" x="40" y="{ay + 62}">scale {tsp(key + "-scale", d["scale"])}: the levels are '
                 f'{tsp(key + "-levels", d["levels"])}</text>')
        b.append(f'<text class="sub2" x="40" y="{ay + 80}">the largest value, {tsp(key + "-big", d["big"])}, is '
                 f'stored as {tsp(key + "-stored", d["stored"])}, off by {tsp(key + "-off", d["off"])}; rms error '
                 f'over the 16: {tsp(key + "-rms", d["rms"])}</text>')
    b.append(f'<text class="sub2" x="40" y="{84 + 2 * 168 - 14}">the ideal scale, the largest value ÷ 6: '
             f'{tsp("ideal", fr["ideal"])}</text>')
    body, y = prose(84 + 2 * 168 + 30, [
        "Both formats store each value as one of FP4's levels, 0, 0.5, 1, 1.5, 2, 3, 4 and 6, times the "
        "block's scale ({{fig:v04-p06}}), and both aim to put the block's largest value at the top level, "
        "6. The ideal scale is therefore the largest value ÷ 6.",
        "MXFP4's scale must be a power of two. For a largest value of 11 the OCP rule gives 8 ÷ 4 = 2, so "
        "the top level is 12 and 11 is stored as 12. For 7 it gives 4 ÷ 4 = 1, the top level is 6, and 7 "
        "is clipped to 6. The rule lands between 0.75 and 1.5 times the ideal scale and clips whenever it "
        "lands low. cuBLAS rounds the power of two up instead, which never clips but can make the steps up "
        "to twice too coarse: a full factor of two.",
        "NVFP4's scale is an FP8 number, with 8 steps between one power of two and the next, so it lands "
        "within 6.25% of the ideal: 11 ÷ 6 = 1.833 becomes 1.875, and 11 is stored as 11.25. Drag the "
        "largest value. MXFP4's levels jump only when it crosses a power of two; NVFP4's follow it in "
        "small steps. The widget's numbers were checked against Python at every setting.",
    ])
    b.append(body)
    presets = "".join(f"<button type='button' data-a='{a:g}'>{a:g}</button>" for a in (11, 7))
    controls = [f"<label>the block's largest value <input type='range' min='{ALO}' max='{AHI}' step='0.1' "
                f"value='{A0:g}'><span class='val'>{f(A0, 1)}</span></label>{presets}"
                f"<button type='button' data-reset=''>Reset</button>"]
    js = (P32_JS.replace("__P__", json.dumps(P)).replace("__AX__", json.dumps([X0, X1, VMAX]))
          .replace("__A0__", repr(A0)))
    emit_widget("p32", st("off by up to a full factor"), "A power-of-two scale can only move in factors of two",
                controls, y + 26, b, "The scale decides where FP4's few levels sit. A power of two can only "
                "put them in a handful of places; an FP8 scale can put them almost where the block needs.", js)


# ---- p33: why NVFP4 needs a second scale -------------------------------------------------------------------------
def p33():
    lim = limits("E4M3")
    mx, mn_sub, mn_norm = float(lim["max"]), float(lim["min_sub"]), float(lim["min_normal"])
    assert (mx, mn_sub, mn_norm) == (448.0, 2.0 ** -9, 2.0 ** -6)
    span, span_n = mx / mn_sub, mx / mn_norm
    assert span == 229376 and f(math.log2(span), 1) == "17.8" and span_n == 28672 and f(math.log2(span_n), 1) == "14.8"
    lo_blk, hi_blk = 0.0005, 0.5
    s_lo, s_hi = lo_blk / 6, hi_blk / 6
    factor = 6 * 448 / hi_blk
    assert factor == 5376 and s_lo < mn_sub and s_hi > mn_norm
    t_lo, t_hi = s_lo * factor, s_hi * factor
    assert abs(t_hi - 448) < 1e-9 and abs(t_lo - 0.448) < 1e-12 and t_lo > mn_norm
    assert float(round_to(Fr(s_lo), "E4M3")) == 0.0                 # stored as 0 without the factor
    L0, L1 = -16, 10
    lx = lambda v: 60 + (math.log2(v) - L0) / (L1 - L0) * 560
    b = [hd(40, 30, "Block scales on a log axis: E4M3 can hold only the shaded window")]
    ay = 96
    b.append(rect(lx(mn_sub), ay - 34, lx(mn_norm) - lx(mn_sub), 28, "u", rx=2))
    b.append(rect(lx(mn_norm), ay - 34, lx(mx) - lx(mn_norm), 28, "s", rx=2))
    b.append(text((lx(mn_sub) + lx(mn_norm)) / 2, ay - 42, "fewer digits", "sub2", "middle"))
    b.append(text((lx(mn_norm) + lx(mx)) / 2, ay - 15, "E4M3 at full precision: 2⁻⁶ to 448", "sub2", "middle"))
    b.append(hline(60, 620, ay))
    for e in range(L0, L1 + 1, 2):
        b.append(tick(60 + (e - L0) / (L1 - L0) * 560, ay, ay + 5))
        b.append(text(60 + (e - L0) / (L1 - L0) * 560, ay + 19, "2" + sup(e), "sub2", "middle"))
    r1 = ay + 64
    b.append(text(40, r1 - 10, "a tensor's block scales: its blocks' largest values, 0.0005 to 0.5, each ÷ 6", "sub2"))
    b.append(rect(lx(s_lo), r1, lx(mn_sub) - lx(s_lo), 18, "h", rx=2))
    b.append(rect(lx(mn_sub), r1, lx(s_hi) - lx(mn_sub), 18, "m", rx=2))
    b.append(text(lx(s_lo) + 4, r1 + 34, "below 2⁻⁹: stored as 0", "sub2"))
    r2 = r1 + 74
    b.append(text(40, r2 - 10, f"the same scales × the tensor's FP32 factor, 6 × 448 ÷ 0.5 = {fi(factor)}", "sub2"))
    b.append(rect(lx(t_lo), r2, lx(t_hi) - lx(t_lo), 18, "s", rx=2))
    b.append(text(lx(t_lo) - 6, r2 + 14, "0.448", "sub2", "end"))
    b.append(text(lx(t_hi) + 6, r2 + 14, "448", "sub2"))
    body, y = prose(r2 + 62, [
        "An E4M3 number reaches from 2⁻⁹, its smallest, to 448, its largest: 448 ÷ 2⁻⁹ = 229,376, about "
        "2¹⁷·⁸. Below 2⁻⁶ it runs out of exponent and keeps fewer digits ({{fig:v04-p04}}), so full "
        "precision spans 2⁻⁶ to 448, about 2¹⁴·⁸.",
        "A tensor's block scales need not sit in that window. In this example the blocks' largest values "
        "run from 0.0005 to 0.5, so their scales run from 0.000083 to 0.083. The smallest fall below 2⁻⁹ "
        "and would be stored as 0, and every value in those blocks read back as 0.",
        "So NVFP4 first multiplies the whole tensor by one FP32 number. cuBLAS uses 6 × 448 ÷ the tensor's "
        f"largest value, {fi(factor)} here, which puts the largest block's scale exactly at 448 and slides "
        "every other scale up by the same factor, here to between 0.448 and 448. MXFP4 needs no such help: "
        "an E8M0 scale's 8 exponent bits reach from 2⁻¹²⁷ to 2¹²⁷.",
    ])
    b.append(body)
    emit("p33", st("with one FP32"), "NVFP4's second scale exists because FP8 cannot reach every block", y + 26, b,
         "Precision in the block scale costs range, and one number per tensor buys the range back.")


# ---- p34: what the scales cost -----------------------------------------------------------------------------------
def p34():
    rows = [("FP16", 16, None, "u"), ("FP8", 8, None, "u"),
            ("INT4, FP16 scale per 128", 4 + 16 / 128, "group of 128 ({{fig:v04-o058}})", "m"),
            ("MXFP4", 4 + 8 / 32, "8-bit scale per 32", "s"),
            ("NVFP4", 4 + 8 / 16, "8-bit scale per 16, + 32 bits per tensor", "s")]
    assert [r[1] for r in rows][2:] == [4.125, 4.25, 4.5]
    assert f(16 / 4.125, 2) == "3.88" and f(16 / 4.25, 2) == "3.76" and f(16 / 4.5, 2) == "3.56"
    assert f(8 / 4.5, 1) == "1.8" and 32 / (4096 * 4096) < 2e-6
    K = 24                                                     # pixels per bit
    x0 = 230
    b = [hd(40, 30, "Bits stored per value, scales included, to scale")]
    for i, (name, bits, note, cls) in enumerate(rows):
        y = 52 + i * 40
        b.append(text(40, y + 17, name, "cap"))
        b.append(rect(x0, y, bits * K, 24, cls, rx=2))
        lab = f"{bits:g}" + ("" if bits >= 8 else f", {f(16 / bits, 2)}× smaller than FP16")
        b.append(text(x0 + bits * K + 8, y + 17, lab, "sub2"))
    ya = 52 + 5 * 40 - 4
    b.append(hline(x0, x0 + 16 * K, ya))
    for k in range(0, 17, 4):
        b.append(tick(x0 + k * K, ya, ya + 5))
        b.append(text(x0 + k * K, ya + 19, str(k), "sub2", "middle"))
    b.append(text(x0 + 16 * K, ya + 37, "bits per value", "sub2", "end"))
    body, y = prose(52 + 5 * 40 + 76, [
        "Each block pays for its own scale. An 8-bit scale shared by 32 values costs a quarter of a bit "
        "per value, shared by 16 half a bit. NVFP4's FP32 number per tensor adds 32 bits to a 4,096 × "
        "4,096 matrix, 32 ÷ 16,777,216, about two millionths of a bit per value: nothing. INT4 with an FP16 "
        "scale per group of 128 costs an eighth of a bit ({{fig:v04-o058}}).",
        "So MXFP4 is 3.76 times smaller than FP16 and NVFP4 3.56 times, against the 4 times of bare 4-bit "
        "numbers; NVIDIA's own figures, about 3.5 times smaller than FP16 and 1.8 times smaller than FP8, "
        "are this arithmetic. Containment and finer scales cost a quarter or half a bit per value.",
    ])
    b.append(body)
    emit("p34", st("Nvidia reports that combination"), "What the scales cost: 4.25 and 4.5 bits per value", y + 26,
         b, "The price of a scale is its bits divided by the values that share it.")


if __name__ == "__main__":
    for fn in (o073, o074, fix_75_76, p32, p33, p34):
        fn()
