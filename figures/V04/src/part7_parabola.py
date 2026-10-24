"""V4 Part 7 widget p19 (review entry 19): the best nudge is the bottom of a parabola.

Weight 1 is rounded from 0.4 to 0 (error e1 = -0.4). Weight 2 can be nudged by delta. Over 200
calibration inputs the mean square output error is a parabola in delta,
    E(delta) = e1^2 avg(x1^2) + 2 e1 delta avg(x1 x2) + delta^2 avg(x2^2),
lowest at delta* = -e1 avg(x1 x2) / avg(x2^2). The inputs are fixed numbers, written into the page, and
input 2 is rho x1 + sqrt(1 - rho^2) z, so the page and this file compute from the same values in the
same order. check_widgets.py compares them at every setting.

  python3 figures/V04/src/part7_parabola.py     writes figures/V04/items/p19.html
"""
import json, math
import numpy as np
from common import emit_widget, hd, prose, text, hline, tick, ln, dot, poly, f, fi, nb, MINUS, esc, st

E1, N_IN, RHO0, D0 = -0.4, 200, 0.8, 0.0
_rng = np.random.default_rng(4)
X1 = [round(float(v), 3) for v in _rng.standard_normal(N_IN)]
Z = [round(float(v), 3) for v in _rng.standard_normal(N_IN)]
DLO, DHI, ELO, EHI = -0.4, 0.8, 0.0, 0.8                 # the parabola's window
SX0, SY0, SS = 60, 62, 196                                  # scatter: square at (SX0, SY0), side SS, -3..3
PX0, PX1, PY0, PY1 = 340, 640, 62, 258                      # parabola plot box


def calibration(rho):
    c = math.sqrt(1 - rho * rho)
    return X1, [rho * a + c * z for a, z in zip(X1, Z)]


def averages(x1, x2):
    """avg x1^2, avg x2^2, avg x1 x2, summed in order, as the page does."""
    A = B = C = 0.0
    for a, b in zip(x1, x2):
        A += a * a
        B += b * b
        C += a * b
    n = len(x1)
    return A / n, B / n, C / n


def err(d, A, B, C):
    return E1 * E1 * A + 2 * E1 * d * C + d * d * B


def frame(rho, d):
    """Every string the widget shows, and its moving geometry."""
    x1, x2 = calibration(rho)
    A, B, C = averages(x1, x2)
    ds = -E1 * C / B
    E0, Ed, Es = E1 * E1 * A, err(d, A, B, C), E1 * E1 * (A - C * C / B)
    ratio = (f(E0 / Es, 2) + " times smaller") if Es > 1e-9 else "the whole error removed"
    return {"A": f(A, 3), "B": f(B, 3), "C": f(C, 3), "Ed": f(Ed, 4), "ds": f(ds, 3), "Es": f(abs(Es) if Es < 1e-9 else Es, 4),
            "E0": f(E0, 4), "ratio": ratio, "x2": x2, "nums": (A, B, C, ds, Ed, Es)}


R_SC = 3.5                                                  # the scatter shows -3.5 to 3.5 on both axes


def sx(v):
    return SX0 + (v + R_SC) / (2 * R_SC) * SS


def sy(v):
    return SY0 + SS - (v + R_SC) / (2 * R_SC) * SS


def px(d):
    return PX0 + (d - DLO) / (DHI - DLO) * (PX1 - PX0)


def py(e):
    return PY1 - (min(e, EHI) - ELO) / (EHI - ELO) * (PY1 - PY0)


assert max(abs(v) for v in X1) < R_SC and all(abs(v) < R_SC for r in range(21) for v in calibration(r / 20)[1])

# the claims in the prose, checked
for rho, lo_ratio in ((0.0, None), (0.8, 2.5), (0.95, 9)):
    A, B, C, ds, Ed, Es = frame(rho, 0)["nums"]
    if lo_ratio:
        assert E1 * E1 * A / Es > lo_ratio
    else:
        assert abs(ds) < 0.02 and E1 * E1 * A / Es < 1.01
A, B, C, ds, Ed, Es = frame(1.0, 0)["nums"]
assert abs(ds - 0.4) < 1e-12 and Es < 1e-12

JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const X1 = __X1__, Z = __Z__, E1 = __E1__, RHO0 = __RHO0__, D0 = __D0__;
  const [DLO, DHI, ELO, EHI] = __WIN__, [SX0, SY0, SS] = __SC__, [PX0, PX1, PY0, PY1] = __PB__;
  const [sr, sd] = fig.querySelectorAll('input[type=range]'), vals = fig.querySelectorAll('.val');
  const fx = (v, d) => (v < 0 && Math.abs(v).toFixed(d) !== (0).toFixed(d) ? '−' : '') + Math.abs(v).toFixed(d);
  const sy = v => SY0 + SS - (v + __RSC__) / (2 * __RSC__) * SS;
  const px = d => PX0 + (d - DLO) / (DHI - DLO) * (PX1 - PX0);
  const py = e => PY1 - (Math.min(e, EHI) - ELO) / (EHI - ELO) * (PY1 - PY0);
  const err = (d, A, B, C) => E1 * E1 * A + 2 * E1 * d * C + d * d * B;
  const dots = [...fig.querySelectorAll('[data-pt]')];
  function draw() {
    const rho = parseFloat(sr.value), d = parseFloat(sd.value), c = Math.sqrt(1 - rho * rho);
    vals[0].textContent = fx(rho, 2); vals[1].textContent = fx(d, 2);
    const x2 = X1.map((a, i) => rho * a + c * Z[i]);
    let A = 0, B = 0, C = 0;
    for (let i = 0; i < X1.length; i++) { A += X1[i] * X1[i]; B += x2[i] * x2[i]; C += X1[i] * x2[i]; }
    const n = X1.length; A /= n; B /= n; C /= n;
    const ds = -E1 * C / B, E0 = E1 * E1 * A, Ed = err(d, A, B, C), Es = E1 * E1 * (A - C * C / B);
    dots.forEach((e, i) => e.setAttribute('cy', sy(x2[i]).toFixed(1)));
    const pts = [];
    for (let k = 0; k <= 60; k++) { const dd = DLO + k * (DHI - DLO) / 60; pts.push(px(dd).toFixed(1) + ',' + py(err(dd, A, B, C)).toFixed(1)); }
    fig.querySelector('[data-curve]').setAttribute('points', pts.join(' '));
    const cur = fig.querySelector('[data-cur]'), best = fig.querySelector('[data-best]');
    cur.setAttribute('cx', px(d).toFixed(1)); cur.setAttribute('cy', py(Ed).toFixed(1));
    best.setAttribute('cx', px(ds).toFixed(1)); best.setAttribute('cy', py(Es).toFixed(1));
    const set = (k, s) => fig.querySelector(`[data-k="${k}"]`).textContent = s;
    set('A', fx(A, 3)); set('B', fx(B, 3)); set('C', fx(C, 3)); set('Ed', fx(Ed, 4)); set('ds', fx(ds, 3));
    set('Es', fx(Es < 1e-9 ? Math.abs(Es) : Es, 4)); set('E0', fx(E0, 4));
    set('ratio', Es > 1e-9 ? fx(E0 / Es, 2) + ' times smaller' : 'the whole error removed');
  }
  [sr, sd].forEach(s => s.addEventListener('input', draw));
  fig.querySelector('button').addEventListener('click', () => { sr.value = RHO0; sd.value = D0; draw(); });
  draw();
})();</script>"""


def p19():
    fr = frame(RHO0, D0)
    A, B, C, ds, Ed, Es = fr["nums"]
    b = [hd(40, 30, "Weight 1 has been rounded from 0.4 to 0. How far should weight 2 be nudged?")]
    # scatter of the calibration inputs
    b.append(ln(SX0, SY0 + SS, SX0 + SS, SY0 + SS, "axis"))
    b.append(ln(SX0, SY0, SX0, SY0 + SS, "axis"))
    for v in (-3, 0, 3):
        b.append(text(sx(v), SY0 + SS + 16, str(v).replace("-", MINUS), "sub2", "middle"))
        b.append(text(SX0 - 6, sy(v) + 4, str(v).replace("-", MINUS), "sub2", "end"))
    for i, (a, c2) in enumerate(zip(X1, fr["x2"])):
        b.append(f'<circle cx="{sx(a):.1f}" cy="{sy(c2):.1f}" r="2" fill="var(--s)" fill-opacity="0.55" data-pt="{i}"/>')
    b.append(text(SX0 + SS / 2, SY0 + SS + 34, "input 1, for each of 200 calibration inputs", "sub2", "middle"))
    b.append(text(SX0 + 4, SY0 - 8, "input 2", "sub2"))
    # the parabola
    b.append(ln(PX0, PY1, PX1, PY1, "axis"))
    b.append(ln(PX0, PY0, PX0, PY1, "axis"))
    for d in (-0.4, 0, 0.4, 0.8):
        b.append(tick(px(d), PY1, PY1 + 5))
        b.append(text(px(d), PY1 + 21, f"{d:g}".replace("-", MINUS), "sub2", "middle"))
    for e in (0, 0.4, 0.8):
        b.append(text(PX0 - 6, py(e) + 4, f"{e:g}", "sub2", "end"))
    pts = [(px(DLO + k * (DHI - DLO) / 60), py(err(DLO + k * (DHI - DLO) / 60, A, B, C))) for k in range(61)]
    b.append(poly(pts, "pl-m").replace("<polyline ", "<polyline data-curve='' "))
    b.append(f'<circle cx="{px(ds):.1f}" cy="{py(Es):.1f}" r="5" fill="var(--paper)" stroke="var(--s)" stroke-width="2" data-best=""/>')
    b.append(f'<circle cx="{px(D0):.1f}" cy="{py(Ed):.1f}" r="5" fill="var(--paper)" stroke="var(--h)" stroke-width="2" data-cur=""/>')
    b.append(text((PX0 + PX1) / 2, PY1 + 34, "the nudge δ added to weight 2", "sub2", "middle"))
    b.append(text(PX0 + 4, PY0 - 8, "mean square output error", "sub2"))
    yr = PY1 + 66
    rows = [("averages over the 200 inputs", [("x₁² = ", "A"), (";   x₂² = ", "B"), (";   x₁x₂ = ", "C")]),
            ("error at this nudge (red dot)", [("", "Ed")]),
            ("best nudge, the bottom (teal dot)", [("−e₁ × avg x₁x₂ ÷ avg x₂²  =  ", "ds")]),
            ("error at the best nudge", [("", "Es"), (",  ", "ratio"), (" than with no nudge, ", "E0")])]
    for k, (lab, parts) in enumerate(rows):
        y = yr + k * 24
        b.append(text(40, y, lab, "sub2"))
        spans = "".join(f'{esc(pre)}<tspan data-k="{key}">{esc(fr[key])}</tspan>' for pre, key in parts)
        b.append(f'<text class="sub2" x="270" y="{y}" text-anchor="start">{spans}</text>')
    body, y = prose(yr + 4 * 24 + 26, [
        "After weight 1 is rounded from 0.4 to 0, the output is off by e₁ × x₁ for each input, with "
        "e₁ = −0.4 ({{fig:v04-p13}}). Nudging weight 2 by δ adds δ × x₂. So the leftover error on each "
        "input is e₁x₁ + δx₂, and its average square is "
        + nb("e₁² × avg x₁²  +  2e₁δ × avg x₁x₂  +  δ² × avg x₂²") + ".",
        "As δ varies, that is a parabola, aδ² + bδ + c, and a parabola is lowest at δ = −b ÷ 2a: here "
        "−e₁ × avg x₁x₂ ÷ avg x₂². That is all second-order means: the error is a quadratic in the "
        "nudge, so its bottom can be found exactly.",
        "Move the inputs apart and avg x₁x₂ falls towards zero: the best nudge shrinks to nothing, and "
        "any nudge only adds error. Move them together and the nudge cancels the error completely, as in "
        "{{fig:v04-p18}}. The widget's arithmetic was checked against Python at every setting.",
    ])
    b.append(body)
    controls = [f"<label>how closely input 2 follows input 1 <input type='range' min='0' max='1' step='0.05' "
                f"value='{RHO0}'><span class='val'>{f(RHO0, 2)}</span></label>",
                f"<label>nudge δ <input type='range' min='{DLO}' max='{DHI}' step='0.02' value='{D0}'>"
                f"<span class='val'>{f(D0, 2)}</span></label><button type='button'>Reset</button>"]
    js = (JS.replace("__X1__", json.dumps(X1)).replace("__Z__", json.dumps(Z)).replace("__E1__", repr(E1))
          .replace("__RHO0__", repr(RHO0)).replace("__D0__", repr(D0))
          .replace("__WIN__", json.dumps([DLO, DHI, ELO, EHI])).replace("__SC__", json.dumps([SX0, SY0, SS]))
          .replace("__PB__", json.dumps([PX0, PX1, PY0, PY1])).replace("__RSC__", repr(R_SC)))
    emit_widget("p19", st("How much to nudge comes from the Hessian"), "The right nudge is the bottom of a parabola",
                controls, y + 26, b,
                "GPTQ's update in miniature. The best correction is the bottom of a parabola, and where the "
                "bottom sits depends only on averages of the inputs.", js)


if __name__ == "__main__":
    p19()
