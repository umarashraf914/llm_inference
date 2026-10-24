"""V4 Part 7, SmoothQuant and AWQ: review entries 22, 23 and 24 (p22, p23 widget, p24), with the names
and prose of Figs 64 and 65 restored and Fig 46's pointer aimed at p22.

Sources read: Xiao, Lin, Seznec, Wu, Demouth and Han, "SmoothQuant" (MIT and NVIDIA): s_j =
max|X_j|^alpha / max|W_j|^(1-alpha), alpha = 0.5 for OPT and BLOOM, 0.75 for GLM-130B, and "we can only
use scaling factors from the outer dimensions ... but not inner dimension". Dettmers et al., LLM.int8():
the mixed-precision decomposition. Lin, Tang and colleagues (MIT), "AWQ": error ratio Delta'/Delta x 1/s,
s = 2 best on OPT-6.7B, s = 4 changes Delta in 21.2% of groups, search s = s_X^alpha.

  python3 figures/V04/src/part7_smooth.py
"""
import json, math
import numpy as np
from common import (emit, emit_widget, hd, cell, box, eq, ln, arr, prose, text, tick, hline, dot, rect, poly,
                    f, fi, fs, nb, MINUS, esc, st, sup)
from fixes import reprose, apply


# ---- p22: a scale on the summed dimension cannot come out of the sum ------------------------------------------
def p22():
    b = [hd(40, 46, "One output, x₁w₁ + x₂w₂ + x₃w₃ + x₄w₄, with integers q for x and r for w")]
    rows = [("a scale per token, a", "Σ (a q) × (b r)   =   a × b × Σ q r", "s", "one integer sum, then one float multiply"),
            ("a scale per input channel, cⱼ", "Σ (cⱼ q) × (b r)   =   b × Σ cⱼ × q r", "h", "cⱼ changes from term to term: stuck inside")]
    for k, (lab, s, c, note) in enumerate(rows):
        y = 70 + k * 78
        b.append(text(40, y + 16, lab, "sub2"))
        b.append(box(40, y + 26, 330, 36, c, s))
        b.append(text(386, y + 49, note, "sub2"))
    yx = 70 + 2 * 78 + 10
    b.append(text(40, yx, "Written out, the second needs a float multiply in every term before anything is added:", "sub2"))
    terms = ["c₁ q₁ r₁", "c₂ q₂ r₂", "c₃ q₃ r₃", "c₄ q₄ r₄"]
    for j, tm in enumerate(terms):
        b.append(cell(60 + j * 140, yx + 14, 110, 30, "h", label=tm))
        if j < 3:
            b.append(text(60 + j * 140 + 125, yx + 34, "+", "sub2", "middle"))
    yw = yx + 80
    b.append(text(40, yw, "Three ways round it", "hd"))
    ways = [("LLM.int8()", "split the few outlier channels off into a 16-bit multiply; the rest stays INT8"),
            ("SmoothQuant", "move cⱼ into the weights before quantizing: x w = (x ÷ cⱼ) × (cⱼ w)"),
            ("block formats", "a scale per 16 or 32 terms of the sum; each block's sum stays integer work")]
    for k, (name, how) in enumerate(ways):
        y = yw + 18 + k * 30
        b.append(cell(40, y, 116, 24, "m" if k == 1 else "u", label=name))
        b.append(text(170, y + 16, how, "sub2"))
    body, y = prose(yw + 18 + 3 * 30 + 32, [
        "{{fig:v04-p17}} could pull its two scales out of the sum because each is the same for every term: "
        "a belongs to the token, b to the output channel. A scale for each input channel, cⱼ, belongs to the "
        "very index the sum runs over, so it changes from term to term and cannot be factored out. The "
        "tensor core's single integer sum is lost.",
        "That is why the per-channel structure of {{fig:v04-o046}} cannot simply be given per-channel "
        "activation scales. Xiao and colleagues put it plainly: integer matrix-multiply kernels can apply "
        "scales only along the outer dimensions, tokens and output channels, never along the inner one "
        "being summed.",
        "Dettmers and colleagues answered by splitting the outlier channels off; SmoothQuant moves the "
        "scale across the multiply; block formats keep a scale per short stretch of the sum, and one scale "
        "per channel is their limit, blocks of one, with no integer work left at all.",
    ])
    b.append(body)
    emit("p22", st("attacks the outliers by moving"), "A scale on the summed dimension cannot come out of the sum",
         y + 26, b,
         "The obstacle is arithmetic, not engineering: a factor that changes inside a sum cannot be pulled "
         "out of it. Every activation method that follows is a way round this one line.")


# ---- the SmoothQuant widget's data -----------------------------------------------------------------------------
_rng = np.random.default_rng(0)
_T, _C, _O = 64, 8, 16
_X = _rng.standard_normal((_T, _C))
_X[:, 2] *= 50
_W = _rng.standard_normal((_C, _O)) * 0.1
XD = [[round(float(v), 3) for v in row] for row in _X]
WD = [[round(float(v), 3) for v in row] for row in _W]
OUT_CH = 2                                            # the outlier channel, channel 3 counting from 1
A0 = 0.5


def smooth(a):
    """SmoothQuant at migration strength a, then INT8 for both sides with one scale each; returns the
    channel maxima before and after, the scales s, and the relative rms output error. Summed in a fixed
    order, as the page sums."""
    T, C, O = len(XD), len(XD[0]), len(WD[0])
    mx = [max(abs(XD[t][j]) for t in range(T)) for j in range(C)]
    mw = [max(abs(WD[j][k]) for k in range(O)) for j in range(C)]
    s = [mx[j] ** a / mw[j] ** (1 - a) for j in range(C)]
    Xs = [[XD[t][j] / s[j] for j in range(C)] for t in range(T)]
    Ws = [[WD[j][k] * s[j] for k in range(O)] for j in range(C)]
    sx = max(abs(v) for r in Xs for v in r) / 127
    sw = max(abs(v) for r in Ws for v in r) / 127
    Xq = [[round(v / sx) * sx for v in r] for r in Xs]          # round: half to even, as the page does
    Wq = [[round(v / sw) * sw for v in r] for r in Ws]
    num = den = 0.0
    for t in range(T):
        for k in range(O):
            y = yq = 0.0
            for j in range(C):
                y += XD[t][j] * WD[j][k]
                yq += Xq[t][j] * Wq[j][k]
            num += (yq - y) ** 2
            den += y * y
    amax = [mx[j] / s[j] for j in range(C)]
    wmax = [mw[j] * s[j] for j in range(C)]
    return {"mx": mx, "mw": mw, "s": s, "amax": amax, "wmax": wmax, "err": math.sqrt(num / den)}


ALPHAS = [k / 20 for k in range(21)]
CURVE = [smooth(a)["err"] for a in ALPHAS]
_best = min(range(21), key=lambda k: CURVE[k])
assert 0.4 <= ALPHAS[_best] <= 0.6 and CURVE[10] < 0.5 * CURVE[0] and CURVE[10] < 0.65 * CURVE[20]
_r = smooth(0.5)
assert abs(_r["amax"][OUT_CH] - _r["wmax"][OUT_CH]) < 1e-9
assert abs(_r["amax"][OUT_CH] - math.sqrt(_r["mx"][OUT_CH] * _r["mw"][OUT_CH])) < 1e-9

LO, HI = -2, 3                                     # log10 window for the maxima strips: 0.01 to 1,000
SL, SR = 200, 620
EX0, EX1, EY0, EY1 = 200, 620, 214, 330             # the error-against-alpha plot
EMAX = 0.025


def lx(v):
    return SL + (math.log10(v) - LO) / (HI - LO) * (SR - SL)


def ex(a):
    return EX0 + a * (EX1 - EX0)


def ey(e):
    return EY1 - min(e, EMAX) / EMAX * (EY1 - EY0)


def p23_strings(a):
    r = smooth(a)
    j = OUT_CH
    return {"a": f(a, 2), "s": fs(r["s"][j], 3), "am": fs(r["amax"][j], 3), "wm": fs(r["wmax"][j], 3),
            "err": f(100 * r["err"], 2) + "%", "r": r}


JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const X = __X__, W = __W__, J = __J__, A0 = __A0__, [LO, HI, SL, SR] = __LX__, [EX0, EX1, EY0, EY1, EMAX] = __EX__;
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val');
  const T = X.length, C = X[0].length, O = W[0].length;
  const rhe = v => { const r = Math.round(v); return Math.abs(v % 1) === 0.5 ? 2 * Math.round(v / 2) : r; };
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sup = n => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(d => SUP[+d]).join('');
  const fx = (v, d) => (v < 0 && Math.abs(v).toFixed(d) !== (0).toFixed(d) ? '−' : '') + Math.abs(v).toFixed(d);
  function fs(v, sig) {                       // significant figures, as the static figure prints them
    if (v === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(v)));
    if (e >= -4 && e < 6) return fx(v, Math.max(0, sig - 1 - e));
    let m = (v / Math.pow(10, e)).toFixed(sig - 1), ee = e;
    if (m.startsWith('10')) { ee += 1; m = (v / Math.pow(10, ee)).toFixed(sig - 1); }
    return m.replace('-', '−') + ' × 10' + sup(ee);
  }
  const lx = v => SL + (Math.log10(v) - LO) / (HI - LO) * (SR - SL);
  function smooth(a) {
    const mx = [], mw = [];
    for (let j = 0; j < C; j++) { let m = 0; for (let t = 0; t < T; t++) m = Math.max(m, Math.abs(X[t][j])); mx.push(m); }
    for (let j = 0; j < C; j++) { let m = 0; for (let k = 0; k < O; k++) m = Math.max(m, Math.abs(W[j][k])); mw.push(m); }
    const s = mx.map((m, j) => Math.pow(m, a) / Math.pow(mw[j], 1 - a));
    const Xs = X.map(r => r.map((v, j) => v / s[j])), Ws = W.map((r, j) => r.map(v => v * s[j]));
    let sx = 0, sw = 0;
    Xs.forEach(r => r.forEach(v => sx = Math.max(sx, Math.abs(v)))); Ws.forEach(r => r.forEach(v => sw = Math.max(sw, Math.abs(v))));
    sx /= 127; sw /= 127;
    const Xq = Xs.map(r => r.map(v => rhe(v / sx) * sx)), Wq = Ws.map(r => r.map(v => rhe(v / sw) * sw));
    let num = 0, den = 0;
    for (let t = 0; t < T; t++) for (let k = 0; k < O; k++) {
      let y = 0, yq = 0;
      for (let j = 0; j < C; j++) { y += X[t][j] * W[j][k]; yq += Xq[t][j] * Wq[j][k]; }
      num += (yq - y) ** 2; den += y * y;
    }
    return {s, amax: mx.map((m, j) => m / s[j]), wmax: mw.map((m, j) => m * s[j]), err: Math.sqrt(num / den)};
  }
  function draw() {
    const a = parseFloat(sl.value), r = smooth(a);
    val.textContent = fx(a, 2);
    fig.querySelectorAll('[data-am]').forEach(e => e.setAttribute('cx', lx(r.amax[+e.dataset.am]).toFixed(1)));
    fig.querySelectorAll('[data-wm]').forEach(e => e.setAttribute('cx', lx(r.wmax[+e.dataset.wm]).toFixed(1)));
    const m = fig.querySelector('[data-mark]');
    m.setAttribute('cx', (EX0 + a * (EX1 - EX0)).toFixed(1));
    m.setAttribute('cy', (EY1 - Math.min(r.err, EMAX) / EMAX * (EY1 - EY0)).toFixed(1));
    const set = (k, s) => fig.querySelector(`[data-k="${k}"]`).textContent = s;
    set('s', fs(r.s[J], 3)); set('am', fs(r.amax[J], 3)); set('wm', fs(r.wmax[J], 3)); set('err', fx(100 * r.err, 2) + '%');
  }
  sl.addEventListener('input', draw);
  fig.querySelector('button').addEventListener('click', () => { sl.value = A0; draw(); });
  draw();
})();</script>"""


def p23():
    st0 = p23_strings(A0)
    r = st0["r"]
    b = [hd(40, 30, "Eight input channels, one dot each for its largest value; channel 3 runs 50 times hotter")]
    for k, (lab, key, vals, c_out) in enumerate([("largest activation", "am", r["amax"], "h"),
                                                 ("largest weight", "wm", r["wmax"], "m")]):
        assert 40 + 6.5 * len(lab) < SL - 8
        y = 66 + k * 56
        b.append(text(40, y + 4, lab, "cap"))
        b.append(hline(SL, SR, y))
        for e in range(LO, HI + 1):
            b.append(tick(lx(10.0 ** e), y - 4, y + 4))
            if k == 1:
                b.append(text(lx(10.0 ** e), y + 22, {0: "1", 1: "10"}.get(e, "10" + sup(e)), "sub2", "middle"))
        for j, v in enumerate(vals):
            c = "var(--h)" if j == OUT_CH else "var(--s)"
            b.append(f'<circle cx="{lx(v):.1f}" cy="{y}" r="{5 if j == OUT_CH else 3.5}" fill="var(--paper)" '
                     f'stroke="{c}" stroke-width="1.6" data-{key}="{j}"/>')
    b.append(text(SL, 66 + 56 + 38, "red: channel 3; teal: the other seven; log scale", "sub2"))
    # the error against alpha, computed for 21 settings
    b.append(ln(EX0, EY1, EX1, EY1, "axis"))
    b.append(ln(EX0, EY0, EX0, EY1, "axis"))
    pts = [(ex(a), ey(e)) for a, e in zip(ALPHAS, CURVE)]
    b.append(poly(pts, "pl-m"))
    b.append(f'<circle cx="{ex(A0):.1f}" cy="{ey(r["err"]):.1f}" r="5" fill="var(--paper)" stroke="var(--h)" '
             f'stroke-width="2" data-mark=""/>')
    for a in (0, 0.5, 1):
        b.append(tick(ex(a), EY1, EY1 + 5))
        b.append(text(ex(a), EY1 + 20, f"{a:g}", "sub2", "middle"))
    for e in (0, 0.01, 0.02):
        b.append(text(EX0 - 6, ey(e) + 4, f"{100 * e:g}%", "sub2", "end"))
    b.append(text(40, EY0 + 30, "output error,", "cap"))
    b.append(text(40, EY0 + 48, "INT8 both sides", "cap"))
    b.append(text((EX0 + EX1) / 2, EY1 + 38, "α, the share of the difficulty moved to the weights", "sub2", "middle"))
    yr = EY1 + 70
    rows = [("channel 3's smoothing factor s", "s", ""), ("its activations' largest value", "am", "  (118 before)"),
            ("its weights' largest value", "wm", "  (0.19 before)"), ("output error at this α", "err", "")]
    for k, (lab, key, tail) in enumerate(rows):
        y = yr + k * 22
        b.append(text(40, y, lab, "sub2"))
        b.append(f'<text class="sub2" x="300" y="{y}" text-anchor="start"><tspan data-k="{key}">{esc(st0[key])}</tspan>'
                 f'{esc(tail)}</text>')
    assert round(r["mx"][OUT_CH]) == 118 and round(r["mw"][OUT_CH], 2) == 0.19
    body, y = prose(yr + 4 * 22 + 26, [
        "SmoothQuant gives each input channel its own factor, s = max|X|^α ÷ max|W|^(1−α), from calibration "
        "data, then divides that channel's activations by s and multiplies its row of weights by s, once, "
        "offline. Afterwards the channel's largest activation is P^(1−α) and its largest weight P^α, where "
        "P is the product of the two maxima before.",
        "At α = ½ both become √P, the geometric mean of the two maxima: activations and weights end up "
        "equally hard to quantize. At α = 0 the difficulty stays on the activations, at 1 it all moves to "
        "the weights. Here the error is lowest in a broad dip around one half.",
        "Xiao and colleagues found α = ½ a good balance for the OPT and BLOOM models and used about 0.75 "
        "where activation outliers are stronger, as in GLM-130B. This small example is made up; the "
        "widget's arithmetic was checked against Python at every setting.",
    ])
    b.append(body)
    controls = [f"<label>α <input type='range' min='0' max='1' step='0.05' value='{A0}'>"
                f"<span class='val'>{f(A0, 2)}</span></label><button type='button'>Reset</button>"]
    js = (JS.replace("__X__", json.dumps(XD)).replace("__W__", json.dumps(WD)).replace("__J__", str(OUT_CH))
          .replace("__A0__", repr(A0)).replace("__LX__", json.dumps([LO, HI, SL, SR]))
          .replace("__EX__", json.dumps([EX0, EX1, EY0, EY1, EMAX])))
    emit_widget("p23", st("One knob alpha"), "Choosing s: the two maxima meet at their geometric mean", controls,
                y + 26, b,
                "One multiplication moved from the activations to the weights, done once, offline. The knob "
                "decides how to split the difficulty, and half and half usually wins.", js)


# ---- p24: AWQ, scaling a weight up before rounding ------------------------------------------------------------------
def p24():
    step, w, x = 0.1, 0.37, 10.0
    rows = []
    for s in (1, 2, 4):
        stored = round(w * s / step) * step
        used = stored * (x / s)
        rows.append((s, w * s, stored, used, used - w * x))
    assert [round(r[2], 2) for r in rows] == [0.4, 0.7, 1.5]
    assert [round(r[4], 3) for r in rows] == [0.3, -0.2, 0.05]
    rms = [step / (s * math.sqrt(12)) for s in (1, 2, 4)]
    assert [round(v, 4) for v in rms] == [0.0289, 0.0144, 0.0072]
    b = [hd(40, 46, "A weight of 0.37 with input 10, on a grid of step 0.1, scaled by s before rounding")]
    L, R = 180, 620
    for k, (s, ws, stored, used, err) in enumerate(rows):
        y = 104 + k * 70
        X = lambda v: L + v / 1.6 * (R - L)
        b.append(text(40, y + 4, f"s = {s}", "cap"))
        b.append(hline(L, R, y))
        for g in range(17):
            b.append(tick(X(g * step), y - (6 if g % 5 == 0 else 3), y + (6 if g % 5 == 0 else 3)))
        b.append(dot(X(ws), y, 4.5, "m"))
        b.append(dot(X(stored), y, 4.5, "s"))
        lab = (f"{f(ws, 2)}, stored as {f(stored, 1)};  × (10 ÷ {s})  =  {f(used, 2)},  error "
               f"{'+' if err > 0 else ''}{f(err, 2)}") if s > 1 else \
              f"0.37, stored as {f(stored, 1)};  × 10  =  {f(used, 2)},  error +{f(err, 2)}"
        assert L + 6 * len(lab) < 640
        b.append(text(L, y + 26, lab, "sub2"))
    for v in (0, 0.5, 1.0, 1.5):
        b.append(text(L + v / 1.6 * (R - L), 104 - 14, f"{v:g}", "sub2", "middle"))
    body, y = prose(104 + 3 * 70 + 16, [
        "Amber is the scaled weight, teal the grid point it is stored as. "
        "The rounding grid is fixed by the largest weight in the group, which is elsewhere, so its step "
        "stays 0.1. Multiply this weight by s before rounding and divide its input by s, a division folded "
        "into the layer before, and the product is unchanged; but the rounding error, still at most half a "
        "step, is now divided by s on the way out.",
        "One weight's error wanders, 0.3, 0.2, 0.05 here; across many weights the typical error falls as "
        f"step ÷ (s × √12): {f(rms[0], 4)}, {f(rms[1], 4)}, {f(rms[2], 4)}. AWQ, from Ji Lin and "
        "colleagues in the same MIT group, scales the weights whose inputs run largest, because their "
        "errors are multiplied by the most ({{fig:v04-p13}}).",
        "The limit: scale too far and the weight becomes the group's largest, widening the step for every "
        "other weight. On OPT-6.7B the authors found s = 2 best; at s = 4 the step grew in 21% of groups "
        "and accuracy fell back. So AWQ searches for each channel's s, as the size of its activations to a "
        "power between 0 and 1.",
    ])
    b.append(body)
    emit("p24", st("get scaled up so rounding barely"), "Scaling a weight up before rounding divides its error",
         y + 26, b,
         "The same trick as SmoothQuant, aimed the other way: spend the grid's precision on the few weights "
         "whose inputs make their errors expensive.")


def fix_existing():
    apply([("o064", ">(X / S) x (S W)  =  X W</text>", ">(X ÷ S) × (S W)  =  X W</text>")])
    reprose("o064", 244, [
        "SmoothQuant, from Guangxuan Xiao and colleagues at MIT, moves the outliers instead of fighting "
        "them. The product is mathematically unchanged, which is what makes the move safe: the division "
        "is folded into the operation before, and the multiplication into the weights, once.",
        "Choose S well and the outliers shrink while the weights absorb a little of the difficulty, until "
        "both sides quantize comfortably. One knob, α, usually a half, sets how much to shift. That is "
        "enough for W8 A8 with little accuracy loss.",
    ])
    apply([("o064", "Fig 64 &nbsp;&middot;&nbsp; 11:56</div>", f"Fig 64 &nbsp;&middot;&nbsp; {st('Divide each activation channel')}</div>")])
    reprose("o065", 174, [
        "AWQ, from Ji Lin and colleagues in the same MIT group, works the weight side rather than the "
        "activation side. Identifying which weights matter by watching the activations that flow through "
        "them is the clever part.",
        "Enough to keep plain four-bit weight-only accurate.",
    ])
    apply([("o065", "Fig 65 &nbsp;&middot;&nbsp; 12:40</div>", f"Fig 65 &nbsp;&middot;&nbsp; {st('AWQ from the same MIT group')}</div>")])
    p = "o046"
    from common import OUT
    t = (OUT / f"{p}.html").read_text(encoding="utf-8")
    t2 = t.replace("{{ref:v04-o064}}", "{{ref:v04-p22}}")
    (OUT / f"{p}.html").write_text(t2, encoding="utf-8")
    print("o046: pointer now", "p22" if "{{ref:v04-p22}}" in t2 else "unchanged")


if __name__ == "__main__":
    for fn in (p22, p23, p24, fix_existing):
        fn()
