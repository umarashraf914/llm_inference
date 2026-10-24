"""The roofline shared by V01's to-scale roofline figures and its four roofline widgets (p21, p25, p32,
p36): one geometry on true log-log axes, drawn the same way in Python (the static first frame) and in
JavaScript (the live one).

Intensity runs from 0.1 to 10,000 operations per byte (80 px per factor of ten); performance from
10^11 to 10^16 operations per second (64 px per factor of ten).
"""
import math
from common import ln, txt, rnd, f, g, sig, CHIPS

L, R, T, B = 100, 500, 70, 390
X_DEC, Y_DEC = 80, 64
I_MIN, P_MIN = 0.1, 1e11
I_MAX, P_MAX = 1e4, 1e16
assert (R - L) == X_DEC * 5 and (B - T) == Y_DEC * 5


def xs(i):
    return rnd(L + (math.log10(i) + 1) * X_DEC)          # the same expression as the script's


def ys(p):
    return rnd(B - (math.log10(p) - 11) * Y_DEC)


def axes():
    """Axes, ticks and tick labels. Every label uses the prefixes of p05."""
    o = [ln(L, B, R, B, "axis"), ln(L, T, L, B, "axis")]
    for k, lab in enumerate(["0.1", "1", "10", "100", "1,000", "10,000"]):
        x = L + k * X_DEC
        o.append(ln(x, B, x, B + 4, "tick"))
        o.append(txt(x, B + 18, lab, "sub2", "middle"))
    for k, lab in enumerate(["100 G", "1 T", "10 T", "100 T", "1 P", "10 P"]):
        y = B - k * Y_DEC
        o.append(ln(L - 4, y, L, y, "tick"))
        o.append(txt(L - 8, y + 4, lab, "sub2", "end"))
    o.append(txt((L + R) / 2, B + 38, "arithmetic intensity: operations per byte (log scale)", "sub2", "middle"))
    o.append(txt(L - 8, T - 14, "operations per second (log scale)", "sub2", "start"))
    return o


def roof_points(peak, bw):
    """The roofline as polyline points: the slanted ceiling up to the ridge, then the flat one."""
    ridge = peak / bw
    return f"{xs(I_MIN)},{ys(bw * I_MIN)} {xs(ridge)},{ys(peak)} {xs(I_MAX)},{ys(peak)}"


def attainable(i, peak, bw):
    return min(peak, bw * i)


# The same geometry in JavaScript. xs/ys round with toFixed(1), as rnd() does in Python.
JS_ROOF = r"""
  const RL = __L__, RR = __R__, RT = __T__, RB = __B__, XD = __XD__, YD = __YD__;
  const xs = i => +(RL + (Math.log10(i) + 1) * XD).toFixed(1);
  const ys = p => +(RB - (Math.log10(p) - 11) * YD).toFixed(1);
  const roofPts = (peak, bw) => { const r = peak / bw;
    return `${xs(0.1)},${ys(bw * 0.1)} ${xs(r)},${ys(peak)} ${xs(1e4)},${ys(peak)}`; };
  const sig3 = v => { if (v === 0) return '0'; const d = Math.max(0, 2 - Math.floor(Math.log10(Math.abs(v))));
    return gx(v, d); };
""".replace("__L__", str(L)).replace("__R__", str(R)).replace("__T__", str(T)).replace("__B__", str(B)) \
   .replace("__XD__", str(X_DEC)).replace("__YD__", str(Y_DEC))


def sig3(v):
    """Three significant figures, the way sig3() prints them in JavaScript."""
    if v == 0:
        return "0"
    d = max(0, 2 - math.floor(math.log10(abs(v))))
    return g(v, d)
