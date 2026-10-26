"""V4 Part 7, rotation (13:00-13:34): review entries 25-29 (p25 widget, p26, p27, p28, p29), and Figs 66,
67 and 68 redrawn: Fig 66's notation and its "bit-identical", Fig 67's unsigned, equal bars, and Fig 68's
missing names (QuaRot is a randomised Hadamard; SpinQuant is Meta's).

Sources read for names: Ashkboos et al., "QuaRot: Outlier-Free 4-Bit Inference in Rotated LLMs" (2024):
random sign flips then a Hadamard, most rotations fused into the weights, online Hadamard transforms
(for example before the MLP's down projection). Liu et al. (Meta), "SpinQuant: LLM Quantization with
Learned Rotations" (2024): rotations learned on calibration data, kept orthogonal while training.
V3's p24 (rotation from cosine and sine) and p25 (FlashAttention 3's Hadamard) come before these.

  python3 figures/V04/src/part7_rotate.py
"""
import json, math
import numpy as np
from common import (emit, emit_widget, hd, cell, ghost, eq, ln, text, tick, hline, dot, rect, f, fi,
                    nb, MINUS, esc, st)

# ---- shared ---------------------------------------------------------------------------------------------
import re
from common import prose as _prose

TUPLE = re.compile(r"\((?:[^()\s,]+, )+[^()\s,]+\)")


def prose(y, paras, **kw):
    """common.prose, with small tuples such as (5.66, 5.66) kept on one line."""
    return _prose(y, [TUPLE.sub(lambda m: nb(m.group(0)), s) for s in paras], **kw)



def hadamard(n):
    """Sylvester's doubling rule: H_2n = [[H, H], [H, -H]], starting from H_1 = [1]."""
    H = np.array([[1.0]])
    while H.shape[0] < n:
        H = np.block([[H, H], [H, -H]])
    return H


def sgn(v):
    return ("+" if v > 0 else "") + f(v, 1) if v else "0"


def sbars(x0, pitch, w, zy, vals, k, cls="m", hot=()):
    """Signed bars to scale about a zero line at zy, k pixels per unit; bars listed in hot are drawn h."""
    out = []
    for i, v in enumerate(vals):
        h = abs(v) * k
        if h < 0.05:
            continue
        out.append(rect(x0 + i * pitch, zy - h if v > 0 else zy, w, round(h, 1), "h" if i in hot else cls, rx=1))
    return "".join(out)


def turn(p, deg):
    t = deg * math.pi / 180
    return (p[0] * math.cos(t) - p[1] * math.sin(t), p[0] * math.sin(t) + p[1] * math.cos(t))


def pair(p):
    return f"({f(p[0], 2)}, {f(p[1], 2)})"


# ---- p25: the rotation widget ---------------------------------------------------------------------------
CX, CY, U = 170, 204, 14             # the plane: origin, pixels per unit
RL = 8 * U + 22                       # where the label v sits, beyond the circle
BX, BW = 404, 210                     # coordinate bars: start, length of 8
BY = (164, 190)                       # their tops
T0 = 45


def p25_frame(deg):
    """Every string and moving coordinate the widget shows at a whole-degree angle."""
    x, y = turn((8, 0), deg)
    a, b = turn((3, 1), deg), turn((2, -1), deg)
    t = deg * math.pi / 180
    px, py = CX + x * U, CY - y * U
    L, M = math.sqrt(x * x + y * y), max(abs(x), abs(y))
    wx, wy = abs(x) / 8 * BW, abs(y) / 8 * BW
    return {"deg": f"{deg}°", "x": f(x, 2), "y": f(y, 2), "len": f(L, 2), "max": f(M, 2),
            "a": pair(a), "b": pair(b), "dot": f(a[0] * b[0] + a[1] * b[1], 2),
            "px": f(px, 1), "py": f(py, 1), "lx": f(CX + RL * math.cos(t), 1), "ly": f(CY - RL * math.sin(t), 1),
            "wx": f(wx, 1), "wy": f(wy, 1), "ax": f(abs(x), 2), "ay": f(abs(y), 2),
            "nums": (x, y, L, M, a, b)}


# the prose's claims
_x, _y, _L, _M, _a, _b = p25_frame(45)["nums"]
assert f(_x, 2) == f(_y, 2) == "5.66" and abs(_L - 8) < 1e-12 and abs(_x * _x - 32) < 1e-9
assert all(abs(p25_frame(d)["nums"][2] - 8) < 1e-12 for d in range(361))
assert all(p25_frame(d)["dot"] == "5.00" for d in range(361))
assert min(range(91), key=lambda d: p25_frame(d)["nums"][3]) == 45 and p25_frame(90)["max"] == "8.00"
assert f(8 / _M, 2) == "1.41" and _a[0] * _b[0] + _a[1] * _b[1] - 5 < 1e-12

P25_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val');
  const [CX, CY, U, RL, BX, BW] = __GEO__, T0 = __T0__;
  const fx = (v, d) => (v < 0 && Math.abs(v).toFixed(d) !== (0).toFixed(d) ? '−' : '') + Math.abs(v).toFixed(d);
  const turn = (p, deg) => { const t = deg * Math.PI / 180;
    return [p[0] * Math.cos(t) - p[1] * Math.sin(t), p[0] * Math.sin(t) + p[1] * Math.cos(t)]; };
  const pair = p => '(' + fx(p[0], 2) + ', ' + fx(p[1], 2) + ')';
  const set = (k, s) => fig.querySelectorAll(`[data-k="${k}"]`).forEach(e => e.textContent = s);
  const at = (k, o) => { const e = fig.querySelector(`[data-g="${k}"]`); for (const n in o) e.setAttribute(n, o[n]); };
  function draw() {
    const deg = parseInt(sl.value, 10), t = deg * Math.PI / 180;
    const [x, y] = turn([8, 0], deg), a = turn([3, 1], deg), b = turn([2, -1], deg);
    const px = fx(CX + x * U, 1), py = fx(CY - y * U, 1);
    const L = Math.sqrt(x * x + y * y), M = Math.max(Math.abs(x), Math.abs(y));
    const wx = Math.abs(x) / 8 * BW, wy = Math.abs(y) / 8 * BW;
    val.textContent = deg + '°';
    at('v', {x2: px, y2: py}); at('tip', {cx: px, cy: py});
    at('fx', {x1: px, y1: py, x2: px}); at('fy', {x1: px, y1: py, y2: py});
    at('lab', {x: fx(CX + RL * Math.cos(t), 1), y: fx(CY - RL * Math.sin(t), 1)});
    at('bx', {width: fx(wx, 1)}); at('by', {width: fx(wy, 1)});
    set('deg', deg + '°'); set('x', fx(x, 2)); set('y', fx(y, 2)); set('len', fx(L, 2)); set('max', fx(M, 2));
    set('ax', fx(Math.abs(x), 2)); set('ay', fx(Math.abs(y), 2));
    set('a', pair(a)); set('b', pair(b)); set('dot', fx(a[0] * b[0] + a[1] * b[1], 2));
  }
  sl.addEventListener('input', draw);
  fig.querySelector('button').addEventListener('click', () => { sl.value = T0; draw(); });
  draw();
})();</script>"""


def tspan(key, s):
    return f'<tspan data-k="{key}">{esc(s)}</tspan>'


def p25():
    fr = p25_frame(T0)
    b = [hd(40, 30, "Turning v = (8, 0) about the origin (dashed: v before turning)")]
    R = 9 * U
    b.append(ln(CX - R, CY, CX + R, CY, "axis"))
    b.append(ln(CX, CY - R, CX, CY + R, "axis"))
    for v in (-8, -4, 4, 8):
        s = str(v).replace("-", MINUS)
        b.append(tick(CX + v * U, CY, CY + 5))
        c = "sub2 halo" if abs(v) == 8 else "sub2"
        b.append(text(CX + v * U, CY + 20, s, c, "middle"))
        b.append(f'<line class="tick" x1="{CX - 5}" y1="{CY - v * U}" x2="{CX}" y2="{CY - v * U}"/>')
        b.append(text(CX - 8, CY - v * U + 4, s, c, "end"))
    b.append(text(CX + R + 4, CY + 4, "x", "sub2"))
    b.append(text(CX + 6, CY - R + 2, "y", "sub2"))
    b.append(f'<circle cx="{CX}" cy="{CY}" r="{8 * U}" fill="none" stroke="var(--u)" stroke-width="1" '
             f'stroke-dasharray="3 3"/>')
    b.append(f'<line x1="{CX}" y1="{CY}" x2="{CX + 8 * U}" y2="{CY}" stroke="var(--m)" stroke-width="2" '
             f'stroke-dasharray="5 4" opacity="0.6"/>')
    px, py = fr["px"], fr["py"]
    b.append(f'<line data-g="fx" x1="{px}" y1="{py}" x2="{px}" y2="{CY}" stroke="var(--m)" stroke-width="1" '
             f'stroke-dasharray="2 3"/>')
    b.append(f'<line data-g="fy" x1="{px}" y1="{py}" x2="{CX}" y2="{py}" stroke="var(--m)" stroke-width="1" '
             f'stroke-dasharray="2 3"/>')
    b.append(f'<line data-g="v" x1="{CX}" y1="{CY}" x2="{px}" y2="{py}" stroke="var(--m)" stroke-width="2.5"/>')
    b.append(f'<circle data-g="tip" cx="{px}" cy="{py}" r="4" fill="var(--m)"/>')
    b.append(f'<text class="lbl" data-g="lab" x="{fr["lx"]}" y="{fr["ly"]}" text-anchor="middle" '
             f'dominant-baseline="central">v</text>')
    # readouts
    x0 = 340
    b.append(f'<text class="cap" x="{x0}" y="92">turned by {tspan("deg", fr["deg"])}, v becomes '
             f'({tspan("x", fr["x"])}, {tspan("y", fr["y"])})</text>')
    b.append(f'<text class="cap" x="{x0}" y="118">its length, √(x² + y²): {tspan("len", fr["len"])}</text>')
    b.append(text(x0, 150, "the size of each coordinate, to scale", "sub2"))
    for k, (lab, key, w) in enumerate([("x", "bx", fr["wx"]), ("y", "by", fr["wy"])]):
        y = BY[k]
        b.append(text(x0, y + 11, lab, "sub2"))
        b.append(f'<g class="m"><rect data-g="{key}" x="{BX}" y="{y}" width="{w}" height="14" rx="1"/></g>')
        b.append(f'<text class="sub2" x="{BX - 8}" y="{y + 11}" text-anchor="end">'
                 f'{tspan("a" + lab, fr["a" + lab])}</text>')
    b.append(f'<line class="mark" x1="{BX + BW}" y1="{BY[0] - 6}" x2="{BX + BW}" y2="{BY[1] + 20}"/>')
    b.append(text(BX + BW, BY[1] + 34, "8, the size before turning", "sub2", "end"))
    b.append(f'<text class="cap" x="{x0}" y="{BY[1] + 66}">largest coordinate: {tspan("max", fr["max"])}</text>')
    b.append(f'<text class="cap" x="40" y="356">a = (3, 1) and b = (2, {MINUS}1), turned the same way: '
             f'a′ = {tspan("a", fr["a"])}, b′ = {tspan("b", fr["b"])}</text>')
    b.append(f'<text class="cap" x="40" y="378">a′ · b′ = {tspan("dot", fr["dot"])}, the same as before turning: '
             f'a · b = 3 × 2 + 1 × ({MINUS}1) = 5</text>')
    body, y = prose(420, [
        "A rotation turns every vector by the same angle about the origin; {{fig:v03-p24}} built one from "
        "cosine and sine. Drag the angle. The tip of v stays on the circle, because a turn changes no "
        "length, and a′ · b′ stays 5, because it changes no angle between vectors either. A layer's outputs "
        "are dot products like that one, so they cannot tell that anything was turned ({{fig:v04-o066}}).",
        "What a turn does change is how the length is shared between the coordinates. At 0° all of v's 8 "
        "sits in x. At 45° it is split evenly: each coordinate is " + nb("8 ÷ √2 = 5.66") + ", and "
        + nb("32 + 32 = 64 = 8²") + ". "
        "The largest coordinate has fallen from 8 to 5.66, as low as it can go for this vector, and the "
        "largest value is what sets a quantization scale ({{fig:v04-o034}}): the same levels now sit 1.41 "
        "times closer together. At 90° v is (0, 8), as bad as at the start, so a turn helps only if it "
        "spreads the vector it is given.",
        "The widget's numbers were checked against Python at every whole-degree angle.",
    ])
    b.append(body)
    controls = [f"<label>turn by <input type='range' min='0' max='360' step='1' value='{T0}'>"
                f"<span class='val'>{T0}°</span></label><button type='button'>Reset</button>"]
    js = (P25_JS.replace("__GEO__", json.dumps([CX, CY, U, RL, BX, BW])).replace("__T0__", str(T0)))
    emit_widget("p25", st("Rotate. An orthogonal"), "A rotation turns a vector without stretching it", controls,
                y + 26, b, "Length kept, dot products kept, and the largest coordinate free to change: the three "
                "facts the rotation methods are built on.", js)


# ---- p26: Q^T Q = I on a two-by-two -----------------------------------------------------------------------
def grid(x, y, rows, cw=64, ch=30, gap=4, cls_of=None):
    out = []
    for i, row in enumerate(rows):
        for j, s in enumerate(row):
            c = cls_of(i, j) if cls_of else "u"
            out.append(cell(x + j * (cw + gap), y + i * (ch + gap), cw, ch, c, label=s))
    return "".join(out)


def p26():
    c = s = 1 / math.sqrt(2)
    Q = np.array([[c, -s], [s, c]])
    assert np.allclose(Q.T @ Q, np.eye(2)) and abs(c * c - 0.5) < 1e-15 and f(c, 3) == "0.707"
    v = Q @ np.array([8.0, 0.0])
    back = Q.T @ v
    assert f(v[0], 2) == f(v[1], 2) == "5.66" and np.allclose(back, [8, 0]) and abs(c * v[0] - 4) < 1e-12
    for th in range(0, 360, 7):                                     # "at every angle"
        t = math.radians(th)
        R = np.array([[math.cos(t), -math.sin(t)], [math.sin(t), math.cos(t)]])
        assert np.allclose(R.T @ R, np.eye(2))
    k, n = "0.707", MINUS + "0.707"
    b = [hd(40, 30, "Q turns by 45°. Qᵀ, its transpose, turns back, and Qᵀ × Q is the identity, I")]
    gx = [60, 270, 480]
    hi_t = lambda i, j: "s" if i == 0 else "u"
    hi_q = lambda i, j: "s" if j == 1 else "u"
    hi_i = lambda i, j: "s" if (i, j) == (0, 1) else "u"
    for x, lab in zip(gx, ["Qᵀ, the turn back", "Q, the 45° turn", "I, the identity"]):
        b.append(text(x + 66, 64, lab, "sub2", "middle"))
    b.append(grid(gx[0], 76, [[k, k], [n, k]], cls_of=hi_t))
    b.append(grid(gx[1], 76, [[k, n], [k, k]], cls_of=hi_q))
    b.append(grid(gx[2], 76, [["1", "0"], ["0", "1"]], cls_of=hi_i))
    b.append(text(234, 115, "×", "lbl", "middle"))
    b.append(text(444, 115, "=", "lbl", "middle"))
    rows = [("row 1 with column 1", f"0.707 × 0.707 + 0.707 × 0.707", "½ + ½", "1"),
            ("row 1 with column 2", f"0.707 × ({n}) + 0.707 × 0.707", f"{MINUS}½ + ½", "0"),
            ("row 2 with column 1", f"({n}) × 0.707 + 0.707 × 0.707", f"{MINUS}½ + ½", "0"),
            ("row 2 with column 2", f"({n}) × ({n}) + 0.707 × 0.707", "½ + ½", "1")]
    y0 = 186
    b.append(text(40, y0 - 8, "each entry: a row of Qᵀ dotted with a column of Q (teal: the entry in row 1, column 2)",
                  "sub2"))
    for i, (lab, lhs, mid, rhs) in enumerate(rows):
        y = y0 + 16 + i * 22
        b.append(text(40, y, lab, "sub2"))
        b.append(text(180, y, f"{lhs}  =  {mid}  =  {rhs}", "cap", extra=' style="fill:var(--s-text)"' if i == 1 else ""))
    y1 = y0 + 16 + 4 * 22 + 14
    b.append(text(40, y1, "0.707 stands for 1/√2, which is cos 45° and sin 45°; 1/√2 × 1/√2 = ½ exactly.", "sub2"))
    y2 = y1 + 34
    b.append(text(40, y2, "turn and turn back", "sub2"))
    b.append(text(180, y2, "Q × (8, 0)  =  (0.707 × 8 + 0, 0.707 × 8 + 0)  =  (5.66, 5.66)", "cap"))
    b.append(text(180, y2 + 22, f"Qᵀ × (5.66, 5.66)  =  (4 + 4, {MINUS}4 + 4)  =  (8, 0)", "cap"))
    body, y = prose(y2 + 64, [
        "A matrix times a matrix is a grid of dot products ({{fig:v03-o014}}): the entry in row i and "
        "column j of the result is row i of the first dotted with column j of the second. Qᵀ is Q with rows "
        "and columns swapped ({{fig:v03-o019}}), so each entry of Qᵀ × Q is one column of Q dotted with "
        "another.",
        "Q's columns are where (1, 0) and (0, 1) land after the turn. Each has length 1, so dotted with "
        "itself it gives 1; the two stay at right angles, so dotted with each other they give 0. That holds "
        "at every angle and in any number of dimensions. A matrix whose columns have length 1 and stand at "
        "right angles to each other is called orthogonal, and for it QᵀQ = I.",
        "I is the identity, the matrix that changes nothing: " + nb("I × (x, y) = (1x + 0y, 0x + 1y) = (x, y)") + ". So "
        "QᵀQ = I says that Qᵀ undoes Q; it is Q's inverse. Q turns (8, 0) to (5.66, 5.66), and Qᵀ turns "
        "it back.",
    ])
    b.append(body)
    emit("p26", st("Rotate. An orthogonal"), "QᵀQ = I, checked on a two-by-two", y + 26, b,
         "The identity the whole rotation trick rests on, worked entry by entry for one turn.")


# ---- Fig 66, redrawn: notation and "bit-identical" -------------------------------------------------------
def o066():
    b = [text(40, 30, "From {{fig:v04-p26}}: an orthogonal matrix Q satisfies", "cap")]
    b.append(eq(190, 44, 300, "QᵀQ  =  I"))
    b.append(text(40, 122, "Write a dot product as a row times a column, x · y = xᵀy. Turning both vectors by Q gives",
                  "cap"))
    b.append(eq(150, 136, 380, "(Qx) · (Qy)  =  xᵀQᵀQy  =  xᵀIy  =  x · y"))
    body1, y = prose(214, [
        "since the transpose of Qx is xᵀQᵀ (transposing a product reverses its order). Every dot product "
        "survives the turn.",
        "A layer's outputs are dot products of each token's activations, a row of X, with each column of "
        "the weights W. Turn every activation row and every weight column by the same Q, and every output "
        "is mathematically identical:",
    ])
    b.append(body1)
    b.append(eq(150, y + 16, 380, "(XQᵀ)(QW)  =  X(QᵀQ)W  =  XW", cls="s"))
    body2, y = prose(y + 94, [
        "QW is computed once, offline, and stored as the model's new weights. XQᵀ is folded into the layer "
        "that makes X where the model allows it, and applied on the fly where it does not "
        "({{fig:v04-o068}}).",
        "Mathematically identical, not bit-identical: in floating point the sums round a little "
        "differently. And once the turned values are quantized the outputs differ on purpose, because the "
        "rounding now falls on values that suit it ({{fig:v04-p29}}).",
    ])
    b.append(body2)
    emit("o066", st("leaves every output unchanged"), "Rotating both sides of a layer leaves its outputs unchanged",
         y + 26, b, "Two lines of algebra that license the whole technique. Everything hinges on QᵀQ being the "
         "identity.")


# ---- Fig 67, redrawn: signed bars, to scale ---------------------------------------------------------------
X16 = [0.0, 0.3, -0.3, -0.9, -0.5, 24.0, 0.1, 1.3, -0.5, -0.6, 0.5, 0.4, 0.1, -0.9, 0.0, 0.7]


def int4(v):
    s = np.abs(v).max() / 7
    return np.clip(np.round(v / s), -7, 7) * s, s


def o067():
    x = np.array(X16)
    H = hadamard(16) / 4
    y = H @ x
    assert np.allclose(H.T @ H, np.eye(16))
    mx0, mx1 = abs(x).max(), abs(y).max()
    lo1 = abs(y).min()
    L0, L1 = np.linalg.norm(x), np.linalg.norm(y)
    e0 = int4(x)[0] - x
    e1 = H.T @ int4(y)[0] - x
    r0, r1 = math.sqrt((e0 ** 2).mean()), math.sqrt((e1 ** 2).mean())
    assert f(mx1, 1) == "6.8" and f(lo1, 1) == "5.0" and abs(L0 - L1) < 1e-9 and f(L0, 1) == "24.1"
    assert f(mx0 / mx1, 1) == "3.5" and f(r0, 2) == "0.57" and f(r1, 2) == "0.28"
    assert max(abs(v) for i, v in enumerate(X16) if i != 5) == 1.3
    K = 3.5                                                   # pixels per unit, both rows
    x0, pitch, w = 60, 22, 16
    b = [hd(40, 34, "Before: one token's 16 activations, one of them an outlier of 24")]
    z0 = 46 + 24 * K + 14
    b.append(hline(x0 - 8, x0 + 15 * pitch + w + 8, z0))
    b.append(sbars(x0, pitch, w, z0, X16, K, "s", hot=(5,)))
    b.append(text(440, z0 - 60, "largest 24: the scale", "sub2"))
    b.append(text(440, z0 - 44, "must reach it", "sub2"))
    hy = z0 + 40
    b.append(hd(40, hy, "After a 16-channel Hadamard rotation: the same length, shared out"))
    z1 = hy + 20 + 7 * K + 6
    b.append(hline(x0 - 8, x0 + 15 * pitch + w + 8, z1))
    b.append(sbars(x0, pitch, w, z1, list(y), K, "m"))
    b.append(text(440, z1 - 6, f"largest {f(mx1, 1)}, signs mixed:", "sub2"))
    b.append(text(440, z1 + 10, "each about 24 ÷ √16 = 6", "sub2"))
    b.append(text(40, z1 + 7 * K + 26, "Both rows to the same scale.", "sub2"))
    body, yy = prose(z1 + 7 * K + 62, [
        "The ordinary values here are made up for the drawing, none larger than 1.3. A 16-channel Hadamard "
        "rotation ({{fig:v04-p27}}) gives every channel a share of the outlier, plus or minus "
        "24 ÷ √16 = 6, and a little of each ordinary value, so the turned values run from 5.0 to 6.8 in "
        "size, with signs mixed.",
        "The length, the square root of the sum of squares, is 24.1 both times, because a rotation "
        "stretches nothing ({{fig:v04-p25}}). Only the sharing changes. The largest value, which sets the "
        f"scale, falls from 24 to {f(mx1, 1)}, so the steps become {f(mx0 / mx1, 1)} times finer for every "
        f"channel. In INT4 the rms error, measured after turning back, falls from {f(r0, 2)} to {f(r1, 2)} "
        "here; at a real model's width the gain is larger ({{fig:v04-p29}}).",
    ])
    b.append(body)
    emit("o067", st("smears each outlier"), "Rotation as an outlier treatment", round(yy + 26), b,
         "Same information, redistributed. It is the trick FlashAttention 3 used to make FP8 attention "
         "safe ({{ref:v03-p25}}).")


# ---- Fig 68, redrawn: names, and why QuaRot's Hadamard is randomised ---------------------------------------
def o068():
    H4 = hadamard(4) / 2
    spike = H4 @ np.array([1.0, -1.0, 1.0, -1.0])
    assert np.allclose(spike, [0, 2, 0, 0])
    b = [f'<g class="s"><rect x="40" y="40" width="290" height="78" rx="8"/>'
         f'<text class="lbl" x="185" y="62" text-anchor="middle" dominant-baseline="central">QuaRot</text>'
         f'<text class="sub" x="185" y="80" text-anchor="middle" dominant-baseline="central">random sign flips, '
         f'then a fixed Hadamard</text>'
         f'<text class="sub" x="185" y="97" text-anchor="middle" dominant-baseline="central">pattern, cheap to '
         f'apply on the fly</text></g>',
         f'<g class="m"><rect x="350" y="40" width="290" height="78" rx="8"/>'
         f'<text class="lbl" x="495" y="62" text-anchor="middle" dominant-baseline="central">SpinQuant, from Meta'
         f'</text>'
         f'<text class="sub" x="495" y="80" text-anchor="middle" dominant-baseline="central">learns its rotation '
         f'from data:</text>'
         f'<text class="sub" x="495" y="97" text-anchor="middle" dominant-baseline="central">a better fit, '
         f'more setup</text></g>']
    body, y = prose(156, [
        "QuaRot, from Saleh Ashkboos and colleagues (2024), uses a Hadamard matrix ({{fig:v04-p27}}): only "
        "plus and minus ones, so applying it takes additions and subtractions, n log₂ n of them "
        "({{fig:v04-p28}}). It first flips the signs of the channels at random. Without that, a vector "
        "shaped like one of the matrix's own rows, such as (1, −1, 1, −1), would be gathered into a spike, "
        "(0, 2, 0, 0), the opposite of what the rotation is for; random signs make that bad luck "
        "vanishingly rare.",
        "Most of the rotations are folded into the weights before serving ({{fig:v04-o066}}). The few that "
        "must act on activations as they are made, such as the input to each MLP's last matrix, are applied "
        "on the fly by a small kernel.",
        "SpinQuant, from Zechun Liu and colleagues at Meta (2024), learns its rotations instead, adjusting "
        "them on calibration data to reduce the quantized model's loss while keeping them rotations. That "
        "fits the model better, at the cost of an optimisation run before deployment.",
    ])
    b.append(body)
    emit("o068", st("Quarro's rotation"), "Two ways to choose the rotation", y + 26, b,
         "The familiar trade: a structured transform that costs almost nothing to apply, against a learned "
         "one that fits the model better.")


# ---- p27: the Hadamard matrix -------------------------------------------------------------------------------
def p27():
    H2, H4 = hadamard(2), hadamard(4)
    x = np.array([1.0, -1.0, 1.0, 20.0])
    y = H4 @ x / 2
    assert list(y) == [10.5, -8.5, -10.5, 10.5]
    assert abs(np.linalg.norm(x) - math.sqrt(403)) < 1e-12 and abs(np.linalg.norm(y) - math.sqrt(403)) < 1e-12
    assert f(math.sqrt(403), 2) == "20.07"
    assert np.allclose(H4 @ H4.T, 4 * np.eye(4)) and np.allclose(hadamard(4096)[:8, :8], hadamard(8))
    Hn = hadamard(64)
    assert np.allclose(Hn @ Hn.T, 64 * np.eye(64))                 # the doubling keeps rows orthogonal
    assert 2 ** 12 == 4096 and 100 / math.sqrt(4096) == 1.5625
    c = 1 / math.sqrt(2)
    assert np.allclose(H2 / math.sqrt(2), np.array([[c, -c], [c, c]]) @ np.diag([1, -1]))
    b = [hd(40, 30, "Built by doubling: H₂ₙ is Hₙ four times over, with the bottom-right copy's signs flipped")]
    lab = lambda v: "1" if v > 0 else MINUS + "1"
    cls = lambda v: "s" if v > 0 else "u"
    cw, ch, gp = 34, 26, 4
    gy = 84
    b.append(text(40 + cw / 2, gy - 12, "H₁", "sub2", "middle"))
    b.append(cell(40, gy, cw, ch, "s", label="1"))
    hx = 110
    b.append(text(hx + cw + gp / 2, gy - 12, "H₂", "sub2", "middle"))
    for i in range(2):
        for j in range(2):
            b.append(cell(hx + j * (cw + gp), gy + i * (ch + gp), cw, ch, cls(H2[i, j]), label=lab(H2[i, j])))
    qx = 230
    for i in range(4):
        for j in range(4):
            b.append(cell(qx + j * (cw + gp), gy + i * (ch + gp), cw, ch, cls(H4[i, j]), label=lab(H4[i, j])))
    for (i, j, s) in ((0, 0, "H₂"), (0, 1, "H₂")):
        b.append(text(qx + j * 2 * (cw + gp) + cw + gp / 2, gy - 12, s, "sub2", "middle"))
    for (j, s) in ((0, "H₂"), (1, f"{MINUS}H₂")):
        b.append(text(qx + j * 2 * (cw + gp) + cw + gp / 2, gy + 4 * (ch + gp) + 12, s, "sub2", "middle"))
    b.append(ghost(qx + 2 * (cw + gp) - 5, gy + 2 * (ch + gp) - 5, 2 * cw + gp + 10, 2 * ch + gp + 10, rx=6))
    rx = qx + 4 * (cw + gp) + 18
    b.append(text(rx, gy - 12, "½ H₄ × (1, −1, 1, 20), row by row", "sub2"))
    sums = [(1, -1, 1, 20), (1, 1, 1, -20), (1, -1, -1, -20), (1, 1, -1, 20)]
    for i, terms in enumerate(sums):
        assert sum(terms) / 2 == y[i] and all(t == H4[i, k] * x[k] for k, t in enumerate(terms))
        s = " ".join(("" if k == 0 else ("+ " if t > 0 else MINUS + " ")) + f"{abs(t):g}" for k, t in enumerate(terms))
        b.append(text(rx, gy + i * (ch + gp) + 17, f"({s}) ÷ 2  =  {f(y[i], 1)}", "cap"))
    # bars to scale
    K = 3
    by = gy + 4 * (ch + gp) + 48
    b.append(text(40, by, "Before and after, both to the same scale", "sub2"))
    z1 = by + 14 + 20 * K
    z2 = z1 + 1 * K + 26 + 10.5 * K
    for (vals, cl, z, t1, t2, hot) in [
            (list(x), "s", z1, "before: (1, −1, 1, 20)", "largest 20; length √403 = 20.07", (3,)),
            (list(y), "m", z2, "after: (10.5, −8.5, −10.5, 10.5)", "largest 10.5; length √403 = 20.07", ())]:
        b.append(hline(52, 60 + 3 * 34 + 22 + 8, z))
        b.append(sbars(60, 34, 22, z, vals, K, cl, hot=hot))
        b.append(text(230, z - 6, t1, "sub2"))
        b.append(text(230, z + 10, t2, "sub2"))
    body, yy = prose(z2 + 10.5 * K + 40, [
        "H₂ is a 2 × 2 pattern of signs, and the doubling rule builds the next size from the last: copy it "
        "four times and flip the signs of the bottom-right copy. Twelve doublings reach 4,096 = 2¹², a "
        "typical model width.",
        "Any two different rows agree in exactly half their places and disagree in the other half, so their "
        "dot product is 0, while each row dotted with itself gives n, its number of entries. Divide by √n "
        "and every row has length 1, at right angles to every other: by {{fig:v04-p26}} the matrix is "
        "orthogonal. The doubling keeps this true. Two top rows (r, r) and (r′, r′) give 2 r · r′, which is "
        "0 when r and r′ differ, and a top row against a bottom row gives r · r′ − r · r′ = 0.",
        "Each entry of the result adds or subtracts every value once, then divides by √n. An outlier A "
        "alone therefore lands as plus or minus A ÷ √n in every channel: 20 ÷ 2 = 10 here, give or take "
        "the small values, and at 4,096 channels an outlier of 100 becomes ±100 ÷ 64 = ±1.56 in each. The "
        "length stays √403 = 20.07, and the largest value falls from 20 to 10.5.",
        "Strictly, H₂ ÷ √2 is {{fig:v04-p26}}'s 45° turn applied after flipping the sign of the second "
        "value. A sign flip keeps lengths and dot products too, so the papers call it a rotation.",
    ])
    b.append(body)
    emit("p27", st("is a fixed pattern cheap"), "A Hadamard matrix is a rotation built from plus and minus ones",
         round(yy + 26), b, "Plus and minus ones, arranged so that every row is at right angles to every other: a "
         "rotation that needs no multiplications.")


# ---- p28: the butterfly -------------------------------------------------------------------------------------
def butterfly(x):
    """Stage by stage: pairs (a, b) that sit d apart become (a + b, a - b), d = 1, 2, 4, ..."""
    stages, v, d = [list(x)], list(x), 1
    while d < len(v):
        w = v[:]
        for i in range(len(v)):
            if not i & d:
                w[i], w[i + d] = v[i] + v[i + d], v[i] - v[i + d]
        stages.append(w)
        v, d = w, d * 2
    return stages


def p28():
    n = 8
    x = [0, 0, 0, 8, 0, 0, 0, 0]
    S = butterfly(x)
    assert np.allclose(S[-1], hadamard(8) @ np.array(x, float)) and len(S) == 4
    assert [sum(1 for v in s if v) for s in S] == [1, 2, 4, 8]
    out = [v / math.sqrt(8) for v in S[-1]]
    assert all(f(abs(v), 2) == "2.83" for v in out)
    rng = np.random.default_rng(1)                                  # the butterfly is H, for any input
    r = rng.standard_normal(4096)
    assert np.allclose(butterfly(r)[-1], hadamard(4096) @ r)
    ops8, dense8 = n * 3, n * n
    ops, dense = 4096 * 12, 4096 * 4096
    assert (ops8, dense8, ops, dense) == (24, 64, 49152, 16777216) and f(dense / ops, 0) == "341"
    assert f(100 * ops / dense, 1) == "0.3"
    cols = [40, 170, 300, 430, 560]
    cw, ch, pitch, y0 = 56, 22, 28, 76
    heads = ["input", "pairs 1 apart", "pairs 2 apart", "pairs 4 apart", "÷ √8"]
    b = [hd(40, 30, "H₈ applied to a spike: each stage turns pairs (a, b) into (a + b, a − b)")]
    for c, h in zip(cols, heads):
        b.append(text(c + cw / 2, y0 - 12, h, "sub2", "middle"))
    vals = S + [out]
    for want in (False, True):                                      # wires under the cells, hot ones on top
        for k in range(4):
            d = 1 << k if k < 3 else 0
            for i in range(n):
                hot = vals[k][i] != 0
                if hot != want:
                    continue
                for j in ([i] if k == 3 else [i, i ^ d]):
                    col = "var(--h)" if hot else "var(--rule)"
                    b.append(f'<line x1="{cols[k] + cw}" y1="{y0 + i * pitch + ch / 2}" x2="{cols[k + 1]}" '
                             f'y2="{y0 + j * pitch + ch / 2}" stroke="{col}" stroke-width="{1.5 if hot else 1}"/>')
    for k, col in enumerate(vals):
        for i, v in enumerate(col):
            s = (f(v, 2) if k == 4 else fi(v)) if v else "0"
            b.append(cell(cols[k], y0 + i * pitch, cw, ch, "h" if v else "u", label=s))
    yb = y0 + n * pitch + 30
    body, yy = prose(yb, [
        "Each stage has 4 pairs, and each pair costs one addition and one subtraction: 8 operations. There "
        "are three stages because 8 = 2³, so 24 operations in all, against " + nb("8 × 8 = 64") + " multiply-adds for a "
        "general 8 × 8 rotation.",
        "log₂ n counts how many times n can be halved before it reaches 1: 3 for 8, and 12 for 4,096. The "
        "butterfly has that many stages, and stage k pairs values 2ᵏ⁻¹ apart. The channels holding the spike "
        "double at every stage, 1, 2, 4, 8, and after the last the result is H₈ times the input: the 8 that "
        "sat in one channel sits in all eight, with signs. Dividing by √8 makes it a rotation, so each "
        "share is 8 ÷ √8 = 2.83.",
        f"At 4,096 channels that is 12 stages × 4,096 = {fi(ops)} additions and subtractions, against "
        f"4,096 × 4,096 = {fi(dense)} multiply-adds for a general rotation, {f(dense / ops, 0)} times fewer "
        "and none of them a multiplication. A layer 4,096 wide spends those 16.8 million multiply-adds on "
        f"each token anyway, so the Hadamard adds about {f(100 * ops / dense, 1)}% to its arithmetic. The "
        "final ÷ √n can be folded into the quantization scale. That is why QuaRot can apply it on the fly.",
    ])
    b.append(body)
    emit("p28", st("cheap to apply on the fly"), "n log n: the butterfly applies a Hadamard with additions alone",
         yy + 26, b, "Fast because the matrix is all signs: three stages of add-and-subtract pairs for eight "
         "values, twelve for 4,096.")


# ---- p29: what the rotation buys ------------------------------------------------------------------------------
N29, SEED29, OUT_AT, OUT_V = 4096, 0, 1234, 100.0


def p29_numbers():
    rng = np.random.default_rng(SEED29)
    x = rng.standard_normal(N29)
    x[OUT_AT] = OUT_V
    H = hadamard(N29) / 64
    xq, s0 = int4(x)
    y = H @ x
    yq, s1 = int4(y)
    e0, e1 = xq - x, H.T @ yq - x
    r0, r1 = math.sqrt((e0 ** 2).mean()), math.sqrt((e1 ** 2).mean())
    r1_turned = math.sqrt(((yq - y) ** 2).mean())
    ordinary = np.delete(x, OUT_AT)
    return dict(x=x, y=y, s0=s0, s1=s1, r0=r0, r1=r1, r1t=r1_turned, omax=abs(ordinary).max(),
                zeros0=int((xq == 0).sum()), zeros1=int((yq == 0).sum()), ymax=abs(y).max())


def p29():
    d = p29_numbers()
    assert d["omax"] < d["s0"] / 2 and d["zeros0"] == N29 - 1           # every ordinary value rounds to 0
    assert abs(d["r1"] - d["r1t"]) < 1e-12                               # turning back keeps the error's size
    assert f(d["r0"], 2) == "1.00" and f(d["r1"], 2) == "0.21" and f(d["r0"] / d["r1"], 1) == "4.8"
    assert f(d["ymax"], 2) == "5.05" and f(d["s0"], 1) == "14.3" and f(d["s1"], 2) == "0.72"
    assert f(d["s1"] / math.sqrt(12), 2) == "0.21" and f(d["omax"], 1) == "3.9"
    X0, X1 = 60, 620
    b = [hd(40, 30, "One token's 4,096 activations: ordinary values of typical size 1, and one outlier of 100")]
    # no rotation
    b.append(text(40, 60, f"No rotation: largest 100, so the INT4 step is 100 ÷ 7 = {f(d['s0'], 1)}", "cap"))
    A0 = 150
    xa = lambda v: X0 + (v + 105) / 210 * (X1 - X0)
    b.append(hline(X0, X1, A0))
    for k in range(-7, 8):
        b.append(tick(xa(k * d["s0"]), A0, A0 + 6))
    cnt0, edges0 = np.histogram(np.delete(d["x"], OUT_AT), bins=np.arange(-4, 4.01, 1.0))
    HM = 60
    top = cnt0.max()
    for c, e in zip(cnt0, edges0):
        if c:
            b.append(rect(xa(e), A0 - c / top * HM, xa(e + 1) - xa(e), round(c / top * HM, 1), "u", rx=0))
    b.append(dot(xa(OUT_V), A0, 4.5, "h"))
    b.append(text(xa(OUT_V), A0 - 14, "the outlier, 100", "sub2", "end"))
    b.append(text(xa(0) - 22, A0 - 44, f"{fi(N29 - 1)} ordinary values, all within ±{f(d['omax'], 1)},", "sub2",
                  "end"))
    b.append(text(xa(0) - 22, A0 - 28, "under half a step from 0: every one rounds to 0", "sub2", "end"))
    for v in (-100, 0, 100):
        b.append(text(xa(v), A0 + 22, str(v).replace("-", MINUS), "sub2", "middle"))
    # Hadamard first
    b.append(text(40, A0 + 58, f"Hadamard first: largest {f(d['ymax'], 2)}, so the step is "
                               f"{f(d['ymax'], 2)} ÷ 7 = {f(d['s1'], 2)}", "cap"))
    A1 = A0 + 58 + 22 + HM + 14
    xb = lambda v: X0 + (v + 6) / 12 * (X1 - X0)
    b.append(hline(X0, X1, A1))
    for k in range(-7, 8):
        b.append(tick(xb(k * d["s1"]), A1, A1 + 6))
    cnt1, edges1 = np.histogram(d["y"], bins=np.arange(-5.5, 5.51, 0.25))
    assert cnt1.sum() == N29
    top1 = cnt1.max()
    for c, e in zip(cnt1, edges1):
        if c:
            b.append(rect(xb(e) + 0.5, A1 - c / top1 * HM, xb(e + 0.25) - xb(e) - 1, round(c / top1 * HM, 1), "m",
                          rx=0))
    for v in (-d["ymax"], 0, d["ymax"]):
        b.append(text(xb(v), A1 + 22, f(v, 2) if v else "0", "sub2", "middle"))
    mag = ((X1 - X0) / 12) / ((X1 - X0) / 210)
    assert f(mag, 1) == "17.5"
    b.append(text(X1, A1 + 40, f"this axis magnified {f(mag, 1)} times; ticks mark the 15 INT4 levels in both rows",
                  "sub2", "end"))
    b.append(text(X1, A1 + 56, "each histogram is scaled to its own tallest bar", "sub2", "end"))
    # the error
    E = A1 + 92
    b.append(text(40, E, "rms error per value, measured after turning back, to scale", "sub2"))
    BL = 420
    for k, (lab, r, cl) in enumerate([("no rotation", d["r0"], "h"), ("Hadamard first", d["r1"], "s")]):
        yy = E + 14 + k * 30
        b.append(text(40, yy + 15, lab, "cap"))
        b.append(rect(150, yy, BL * r / d["r0"], 20, cl, rx=2))
        b.append(text(150 + BL * r / d["r0"] + 8, yy + 15, f(r, 2) + ("" if k == 0 else
                      f", {f(d['r0'] / d['r1'], 1)} times smaller"), "sub2"))
    body, yy = prose(E + 14 + 60 + 44, [
        f"A simulation, not a measurement on a model: {fi(N29 - 1)} values drawn from a bell curve of typical "
        "size 1, and one of 100, like one token's activations with an outlier channel, quantized to INT4 "
        "with one scale for all ({{fig:v04-o045}}). Without rotation every ordinary value rounds to 0 and "
        f"is lost: the rms error is {f(d['r0'], 2)}, as large as the values themselves.",
        "Turned first by a 4,096-channel Hadamard, the outlier becomes ±100 ÷ 64 = ±1.56 in every channel "
        "({{fig:v04-p27}}), on top of a mix of the ordinary values; hence the two humps. The largest value "
        f"is {f(d['ymax'], 2)}, the step {f(d['s1'], 2)}, and the rms error {f(d['r1'], 2)}, the "
        f"{f(d['s1'], 2)} ÷ √12 expected of rounding errors spread evenly across a step "
        "({{fig:v04-p24}}). Turning back leaves every error's size alone, since a rotation stretches "
        f"nothing; {fi(d['zeros1'])} of the 4,096 turned values still round to 0, against all "
        f"{fi(N29 - 1)} ordinary ones before.",
        f"{f(d['r0'] / d['r1'], 1)} times less error, for a transform that costs about 0.3% of the layer's "
        "arithmetic ({{fig:v04-p28}}): that is why rotation is what finally makes four-bit activations "
        "workable.",
    ])
    b.append(body)
    emit("p29", st("Rotation is what finally makes"), "What the rotation buys, measured", yy + 26, b,
         "The outlier problem solved by sharing rather than by special handling: the same 4,096 numbers and "
         "one scale, with a fifth of the error.")


if __name__ == "__main__":
    for fn in (p25, p26, o066, o067, o068, p27, p28, p29):
        fn()
