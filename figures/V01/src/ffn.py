"""V01 Part 5, the feed-forward block and the residual stream: proposals 15-19.

V1 owns this foundation for the series: the block widens each vector, bends every number, and narrows it
back; without the bend two matrices are just one; Llama's version has three matrices, one a gate; and
each block adds its result to the vector it was handed.

  python3 figures/V01/src/ffn.py
"""
import json
import math
from common import (box, cont, cell, ghost, arr, ln, txt, hd, eq, prose, emit, widget, tag, st, f, g, sig,
                    JS_FMT, MINUS, D, FF, L, ATTN, FFN, LAYER, rnd)

relu = lambda x: max(0.0, x)
silu = lambda x: x / (1 + math.exp(-x))


def n(v):
    v = v + 0.0
    return f"{v:g}".replace("-", MINUS)


# ---- p15: widen, then narrow ---------------------------------------------------------------------
def p15():
    assert FF / D == 3.5 and round(D * FF / 1e6, 1) == 234.9 and D * FF > ATTN
    b = [hd(40, 46, "One token's vector through the feed-forward block, lengths to scale")]
    X0 = 150
    SC = (640 - X0) / FF
    rows = [("in", D, "s", f"{g(D)} numbers"), ("widened", FF, "m", f"{g(FF)} numbers, 3.5 times as many"),
            ("narrowed back", D, "s", f"{g(D)} numbers")]
    ys = [70, 150, 230]
    for (lab, v, c, note), y in zip(rows, ys):
        w = round(v * SC, 1)
        b.append(cell(X0, y, w, 30, c, rx=3, label=note if w > 250 else None))
        if w <= 250:
            b.append(txt(X0 + w + 10, y + 20, note, "sub2"))
        b.append(txt(40, y + 20, lab, "cap"))
    b.append(arr(X0 + 16, 104, X0 + 16, 146))
    b.append(txt(X0 + 30, 129, f"× matrix 1: {g(FF)} rows of {g(D)}, then a bend applied to every number", "sub2"))
    b.append(arr(X0 + 16, 184, X0 + 16, 226))
    b.append(txt(X0 + 30, 209, f"× matrix 2: {g(D)} rows of {g(FF)}", "sub2"))
    body, yb = prose(300, [
        "The feed-forward block works on one token's vector at a time and never looks at the others. It "
        f"multiplies the vector by a matrix with {g(FF)} rows, making a vector 3.5 times as long; bends every one "
        "of those numbers; and multiplies by a second matrix that brings it back to 8,192.",
        f"Each of the two matrices holds 8,192 × 28,672 = {f(D * FF / 1e6, 1)} million weights, more than all four "
        f"of attention's matrices together ({f(ATTN / 1e6, 1)} million). Most of a layer's weights live here.",
        "Why the bend is there at all is the next figure. How much to widen is a design choice settled by "
        "experiment rather than derived; 3.5 times is this model's.",
    ])
    emit("p15", st("The second operation is the feed forward network"),
         "The feed-forward block widens each vector 3.5 times, then narrows it back", yb + 26, b + [body],
         "Two matrix multiplies with a bend between them, applied to each token separately. Attention mixes "
         "tokens together; this block works on what each token already carries.")


# ---- p16: without a bend, two matrices are one (widget) ----------------------------------------------
A0, B0 = 2.0, 3.0
XS = [-2, -1, 0, 1, 2]
straight = lambda a, b, x: b * (a * x)
bent = lambda a, b, x: b * relu(a * x)
assert [straight(A0, B0, x) for x in XS] == [-12, -6, 0, 6, 12]
assert [bent(A0, B0, x) for x in XS] == [0, 0, 0, 6, 12]
grid = [v / 2 for v in range(-6, 7)]
for a in grid:                                   # the claims, at every slider setting
    for b_ in grid:
        assert all(abs(straight(a, b_, x) - (a * b_) * x) < 1e-12 for x in XS)    # always one line
        if a != 0 and b_ != 0:
            assert not all(abs(bent(a, b_, x) - (a * b_) * x) < 1e-12 for x in XS)  # the bend breaks it
PL, PR, PT, PB = 80, 330, 70, 310                # plot box; x from -2 to 2, y from -18 to 18
px = lambda x: rnd(PL + (x + 2) / 4 * (PR - PL))
py = lambda y: rnd(PT + (18 - y) / 36 * (PB - PT))
TX = [360, 420, 500, 580]                        # table columns


def pts(fn, a, b):
    xs = [i / 20 for i in range(-40, 41)]
    return " ".join(f"{px(x)},{py(max(-18, min(18, fn(a, b, x))))}" for x in xs)


def p16():
    b = [hd(40, 34, "Two steps, multiply by a and then by b, with and without a bend between")]
    b.append(ln(PL, py(0), PR, py(0), "axis"))
    b.append(ln(px(0), PT, px(0), PB, "axis"))
    for x in XS:
        b.append(ln(px(x), py(0), px(x), py(0) + 4, "tick"))
        if x:
            b.append(txt(px(x), py(0) + 16, n(x), "sub2 halo", "middle"))
    for y in (-12, -6, 6, 12, 18):
        b.append(ln(px(0) - 4, py(y), px(0), py(y), "tick"))
        b.append(txt(px(0) - 8, py(y) + 4, n(y), "sub2 halo", "end"))
    b.append(f'<polyline class="pl-h" data-line="straight" points="{pts(straight, A0, B0)}"/>')
    b.append(f'<polyline class="pl-m" data-line="bent" points="{pts(bent, A0, B0)}"/>')
    b.append(f'<line class="pl-h" x1="{PL}" y1="{PB + 22}" x2="{PL + 24}" y2="{PB + 22}"/>')
    b.append(txt(PL + 32, PB + 26, "b × (a × x), no bend", "sub2"))
    b.append(f'<line class="pl-m" x1="{PL}" y1="{PB + 40}" x2="{PL + 24}" y2="{PB + 40}"/>')
    b.append(txt(PL + 32, PB + 44, "b × ReLU(a × x), with a bend", "sub2"))
    heads = ["x", "no bend", "with bend"]
    for c, h_ in zip(TX, heads):
        b.append(txt(c, 86, h_, "sub2"))
    for k, x in enumerate(XS):
        y = 112 + k * 26
        b.append(txt(TX[0], y, n(x), "sub2"))
        b.append(tag("text", {"class": "sub2", "x": TX[1], "y": y, "data-s": k}, n(straight(A0, B0, x))))
        b.append(tag("text", {"class": "sub2", "x": TX[2], "y": y, "data-b": k}, n(bent(A0, B0, x))))
    b.append(tag("text", {"class": "sub2", "x": TX[0], "y": 112 + 5 * 26 + 10, "data-one": ""},
                  f"no bend is one step: × {n(A0 * B0)}"))
    body, yl = prose(PB + 84, [
        "Multiplying by 2 and then by 3 is the same as multiplying by 6: two straight-line steps make one straight "
        "line, however many are chained. The same holds for matrices: W₂ times (W₁ times x) equals (W₂W₁) "
        "times x, and W₂W₁ is a single matrix. Without something in between, the second matrix adds nothing "
        "one matrix could not do.",
        "Put a bend between them, here ReLU, which replaces negative numbers with zero, and the result is no longer "
        "a line: flat on one side, steep on the other. Thousands of bends like this, one per number, let the "
        "block represent shapes no single matrix can.",
        "Drag the slopes. Every number in the table was checked against Python at every slider setting.",
    ])
    js = JS_FMT + r"""
  const fig = document.currentScript.closest('figure');
  const XS = [-2, -1, 0, 1, 2], A0 = __A0__, B0 = __B0__, PL = __PL__, PR = __PR__, PT = __PT__, PB = __PB__;
  const sl = [...fig.querySelectorAll('input[type=range]')], val = [...fig.querySelectorAll('.val')];
  const q = s => fig.querySelector(s);
  const nf = v => { v = Math.round(v * 1e9) / 1e9 + 0; return (v < 0 ? '−' : '') + String(Math.abs(v)); };
  const px = x => +(PL + (x + 2) / 4 * (PR - PL)).toFixed(1);
  const py = y => +(PT + (18 - y) / 36 * (PB - PT)).toFixed(1);
  const relu = v => Math.max(0, v);
  const pts = fn => { const o = []; for (let i = -40; i <= 40; i++) { const x = i / 20;
    o.push(`${px(x)},${py(Math.max(-18, Math.min(18, fn(x))))}`); } return o.join(' '); };
  function draw() {
    const [a, b] = sl.map(s => +s.value);
    val[0].textContent = nf(a); val[1].textContent = nf(b);
    q('[data-line="straight"]').setAttribute('points', pts(x => b * (a * x)));
    q('[data-line="bent"]').setAttribute('points', pts(x => b * relu(a * x)));
    XS.forEach((x, k) => { q(`[data-s="${k}"]`).textContent = nf(b * (a * x));
                           q(`[data-b="${k}"]`).textContent = nf(b * relu(a * x)); });
    q('[data-one]').textContent = `no bend is one step: × ${nf(a * b)}`;
  }
  sl.forEach(s => s.addEventListener('input', draw));
  q('button').addEventListener('click', () => { sl[0].value = A0; sl[1].value = B0; draw(); });
  draw();"""
    for k_, v_ in dict(A0=A0, B0=B0, PL=PL, PR=PR, PT=PT, PB=PB).items():
        js = js.replace(f"__{k_}__", str(v_))
    ctl = "".join(f"<label>{nm} <input type='range' min='-3' max='3' step='0.5' value='{v:g}'>"
                  f"<span class='val'>{n(v)}</span></label>" for nm, v in (("a", A0), ("b", B0)))
    widget("p16", st("with a non-linear activation between them"),
           "Without a bend between them, two matrices are just one matrix",
           [ctl + "<button type='button'>Reset</button>"], yl + 22, b + [body],
           "The bend is what makes depth worth having. Without it, eighty layers of matrices would collapse into "
           "one matrix, and the model could only draw straight lines.", js)


# ---- p17: ReLU and SiLU --------------------------------------------------------------------------------
def p17():
    vals = {x: silu(x) for x in XS}
    assert [round(vals[x], 3) for x in XS] == [-0.238, -0.269, 0.0, 0.731, 1.762]
    b = [hd(40, 46, "Two common bends, each applied to one number at a time")]
    L_, R_, T_, B_ = 80, 360, 70, 290            # x from -4 to 4, y from -1 to 4
    xs = lambda x: round(L_ + (x + 4) / 8 * (R_ - L_), 1)
    ys = lambda y: round(T_ + (4 - y) / 5 * (B_ - T_), 1)
    b.append(ln(L_, ys(0), R_, ys(0), "axis"))
    b.append(ln(xs(0), T_, xs(0), B_, "axis"))
    for x in (-4, -2, 2, 4):
        b.append(ln(xs(x), ys(0), xs(x), ys(0) + 4, "tick"))
        b.append(txt(xs(x), ys(0) + 16, n(x), "sub2 halo", "middle"))
    for y in (1, 2, 3, 4):
        b.append(ln(xs(0) - 4, ys(y), xs(0), ys(y), "tick"))
        b.append(txt(xs(0) - 8, ys(y) + 4, n(y), "sub2 halo", "end"))
    grid = [i / 10 for i in range(-40, 41)]
    b.append(f'<polyline class="pl-h" points="{" ".join(f"{xs(x)},{ys(relu(x))}" for x in grid)}"/>')
    b.append(f'<polyline class="pl-m" points="{" ".join(f"{xs(x)},{ys(silu(x))}" for x in grid)}"/>')
    b.append(f'<line class="pl-h" x1="{L_}" y1="{B_ + 18}" x2="{L_ + 24}" y2="{B_ + 18}"/>')
    b.append(txt(L_ + 32, B_ + 22, "ReLU(x) = the larger of 0 and x", "sub2"))
    b.append(f'<line class="pl-m" x1="{L_}" y1="{B_ + 36}" x2="{L_ + 24}" y2="{B_ + 36}"/>')
    b.append(txt(L_ + 32, B_ + 40, "SiLU(x) = x ÷ (1 + e^−x)", "sub2"))
    C = [400, 470, 550]
    for c, h_ in zip(C, ["x", "ReLU", "SiLU"]):
        b.append(txt(c, 86, h_, "sub2"))
    for k, x in enumerate(XS):
        y = 112 + k * 26
        b.append(txt(C[0], y, n(x), "sub2"))
        b.append(txt(C[1], y, n(relu(x)), "sub2"))
        b.append(txt(C[2], y, f(vals[x], 3), "sub2"))
    body, yb = prose(B_ + 80, [
        "The bend is applied to each of the 28,672 numbers on its own: no number affects another, and the bend "
        "has no weights. ReLU keeps a positive number as it is and replaces a negative one with zero.",
        "SiLU is a smoothed version: near zero for large negative numbers, near x itself for large positive "
        "ones, with a small dip below zero in between; at −1 it gives −1 ÷ (1 + e) = −0.269. The model this "
        "atlas follows uses SiLU.",
    ])
    emit("p17", st("with a non-linear activation between them"),
         "The bend is one small curve applied to every number separately", yb + 26, b + [body],
         "Cheap to compute and free of weights, so it costs nothing in memory traffic. Its whole job is to stop "
         "the two matrices around it from collapsing into one.")


# ---- p18: Llama's gated block -------------------------------------------------------------------------
GATE = [1.0, -2.0, 0.5]
UP = [2.0, 1.0, -1.0]
SG = [silu(v) for v in GATE]
PROD = [a * b for a, b in zip(SG, UP)]
assert [round(v, 3) for v in SG] == [0.731, -0.238, 0.311] and [round(v, 3) for v in PROD] == [1.462, -0.238, -0.311]
assert round(FFN / 1e6, 1) == 704.6 and round(LAYER / 1e6, 1) == 855.7 and round(FFN / LAYER * 100, 1) == 82.4


def p18():
    b = [hd(40, 46, "Two matrices side by side, a bend on one, a multiply, then a third")]
    b.append(cell(40, 96, 120, 34, "s", rx=4, label="token's vector"))
    b.append(txt(100, 146, f"{g(D)} numbers", "sub2", "middle"))
    b.append(arr(162, 104, 196, 82))
    b.append(arr(162, 122, 196, 144))
    b.append(cell(200, 64, 150, 34, "m", rx=4, label=f"× gate: {g(FF)} rows"))
    b.append(cell(200, 128, 150, 34, "m", rx=4, label=f"× up: {g(FF)} rows"))
    b.append(arr(352, 81, 380, 81))
    b.append(cell(384, 64, 70, 34, "u", rx=4, label="SiLU"))
    b.append(arr(456, 81, 480, 100))
    b.append(arr(352, 145, 480, 122))
    b.append(cell(484, 94, 40, 34, "u", rx=4, label="×"))
    b.append(arr(526, 111, 548, 111))
    b.append(cell(552, 94, 88, 34, "m", rx=4, label="× down"))
    b.append(txt(596, 146, f"back to {g(D)}", "sub2", "middle"))
    y0 = 196
    b.append(hd(40, y0, "Three of the 28,672 numbers, worked"))
    rows = [("gate's result", GATE), ("after SiLU", SG), ("up's result", UP), ("multiplied, number by number", PROD)]
    for k, (lab, vec) in enumerate(rows):
        y = y0 + 16 + k * 32
        b.append(txt(40, y + 19, lab, "cap"))
        for j, v in enumerate(vec):
            b.append(cell(260 + j * 74, y, 66, 26, "m" if k == 3 else "u", rx=3, label=f(v, 3)))
    y1 = y0 + 16 + 4 * 32 + 32
    b.append(hd(40, y1, "Where one layer's weights are, to scale"))
    SC = 560 / LAYER
    wa, wf = round(ATTN * SC, 1), round(FFN * SC, 1)
    b.append(cell(40, y1 + 16, wa, 30, "s", rx=3))
    b.append(txt(40, y1 + 16 + 46, f"attention, {f(ATTN / 1e6, 1)} M, {round(ATTN / LAYER * 100)}%", "sub2"))
    b.append(cell(40 + wa, y1 + 16, wf, 30, "m", rx=3,
                  label=f"feed-forward, 3 × {g(D)} × {g(FF)} = {f(FFN / 1e6, 1)} M, {round(FFN / LAYER * 100)}%"))
    body, yb = prose(y1 + 16 + 30 + 58, [
        "The block of {{fig:v01-p15}} has two matrices with a bend between them, the original design of 2017. "
        "Llama, like most current models, uses a gated version with three. The vector "
        "is multiplied by two matrices side by side, gate and up; SiLU bends the gate's result; the two results "
        "are multiplied number by number; and a third matrix, down, brings 28,672 numbers back to 8,192.",
        "The gate decides, number by number, how much of up's result gets through: above, the first number is "
        "passed at 0.731 of its size and the second is nearly shut off. So a layer's feed-forward block holds "
        f"three matrices, {f(FFN / 1e6, 1)} million weights and {round(FFN / LAYER * 100)}% of the layer, which "
        "is why {{fig:v01-o100}} counts three per layer and why {{fig:v01-o101}} adds up.",
    ])
    emit("p18", st("This is where the model applies what it learned"),
         "Llama's feed-forward block has three matrices, and one of them is a gate", yb + 26, b + [body],
         "Four fifths of every layer is this block. Whatever makes reading the weights expensive, it is mostly "
         "these three matrices being read.")


# ---- p19: the residual stream -------------------------------------------------------------------------
IN = [0.4, -1.2, 0.0, 0.9]
DA = [0.1, 0.3, -0.2, 0.0]
DF = [0.0, 0.2, 0.1, -0.3]
MID = [round(a + b, 10) for a, b in zip(IN, DA)]
OUT_ = [round(a + b, 10) for a, b in zip(MID, DF)]
assert MID == [0.5, -0.9, -0.2, 0.9] and OUT_ == [0.5, -0.7, -0.1, 0.6]


def p19():
    b = [hd(40, 46, "One token's vector through one layer: two additions")]
    rows = [("the vector into the layer", IN, "s", ""), ("+ attention's change", DA, "u", "+"),
            ("= after attention", MID, "s", "="), ("+ feed-forward's change", DF, "u", "+"),
            ("= the vector out of the layer", OUT_, "s", "=")]
    for k, (lab, vec, c, op) in enumerate(rows):
        y = 66 + k * 40
        b.append(txt(40, y + 19, lab, "cap"))
        for j, v in enumerate(vec):
            b.append(cell(270 + j * 70, y, 62, 28, c, rx=3, label=f(v, 1)))
        if k in (2, 4):
            b.append(ln(270, y - 6, 270 + 4 * 70 - 8, y - 6, "tick"))
    body, yb = prose(66 + 5 * 40 + 30, [
        "Neither block replaces the vector it is given. Each computes a change, and the change is added to what "
        "came in, number by number: first plus first, second plus second. That is all vector addition is.",
        "The running vector that every layer adds to is called the residual stream. It is 8,192 numbers wide for "
        "every token from the first layer to the last, which is why layers can be stacked: each hands on a vector "
        "of the shape it received ({{fig:v01-o096}}). Four numbers are drawn; the values are illustrative.",
    ])
    emit("p19", st("The output of one layer is the input to the next"),
         "Each block adds its result to the vector it was handed", yb + 26, b + [body],
         "Each layer writes into the same running sum instead of starting afresh. That is what lets eighty of "
         "them be stacked, each refining what the ones below produced.")


if __name__ == "__main__":
    for fn in (p15, p16, p17, p18, p19):
        fn()
