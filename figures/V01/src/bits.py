"""V01 Part 4: what a bit pattern means, and what sixteen bits can hold. Proposals 6 and 7.

p06 is a widget: eight checkboxes set eight bits, and the figure shows each bit's place value, its
contribution and the sum. p07 counts patterns and shows a weight rounded to the nearest 16-bit value.

  python3 figures/V01/src/bits.py       writes figures/V01/items/p06.html and p07.html
"""
import struct
import numpy as np
from common import (cell, ln, txt, hd, eq, prose, emit, widget, tag, f, g, JS_FMT, MINUS)

PLACES = [128, 64, 32, 16, 8, 4, 2, 1]
START = [0, 1, 0, 1, 0, 1, 0, 1]                # 01010101, the byte drawn in o073
value = lambda bits: sum(p * b for p, b in zip(PLACES, bits))
assert value(START) == 85 and value([1] * 8) == 255 and 2 ** 8 == 256
assert all(value([(n >> (7 - i)) & 1 for i in range(8)]) == n for n in range(256))

CW, GAP = 56, 8
X0 = (680 - (8 * CW + 7 * GAP)) // 2            # the row of bits is centred


def sum_text(bits):
    return " + ".join(str(p * b) for p, b in zip(PLACES, bits)) + f"  =  {value(bits)}"


def p06():
    b = [hd(40, 34, "Eight bits, each worth twice the one to its right")]
    yb = 70
    for i, p in enumerate(PLACES):
        x = X0 + i * (CW + GAP)
        b.append(txt(x + CW / 2, yb - 10, f"worth {p}", "sub2", "middle"))
        on = START[i]
        b.append(f'<g class="{"m" if on else "u"}" data-cell="{i}"><rect x="{x}" y="{yb}" width="{CW}" height="40" rx="4"/>'
                 f'<text class="lbl" x="{x + CW / 2}" y="{yb + 20}" text-anchor="middle" dominant-baseline="central" '
                 f'data-bit="{i}">{on}</text></g>')
        b.append(tag("text", {"class": "sub2", "x": x + CW / 2, "y": yb + 62, "text-anchor": "middle",
                              "data-part": i}, str(p * on)))
    ys = yb + 84
    b.append(f'<g class="m"><rect x="90" y="{ys}" width="500" height="40" rx="6"/>'
             f'<text class="sub" x="340" y="{ys + 20}" text-anchor="middle" dominant-baseline="central" '
             f'data-sum="">{sum_text(START)}</text></g>')
    body, yl = prose(ys + 40 + 40, [
        "Each position is worth twice the one to its right, just as each decimal place is worth ten times "
        "the one to its right. A 1 switches that position's value on and a 0 leaves it off; the number is "
        "the sum of the values switched on.",
        "So 01010101 is 64 + 16 + 4 + 1 = 85. All ones is 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255 and all "
        "zeros is 0, so eight bits count from 0 to 255: 2^8 = 256 different patterns.",
        "Tick the boxes to set the bits. The sum the figure shows was checked against Python for all 256 "
        "patterns.",
    ])
    js = JS_FMT + r"""
  const fig = document.currentScript.closest('figure');
  const P = [128, 64, 32, 16, 8, 4, 2, 1], START = __START__;
  const box = [...fig.querySelectorAll('input[type=checkbox]')], q = s => fig.querySelector(s);
  function draw() {
    const bits = box.map(c => c.checked ? 1 : 0);
    let total = 0;
    bits.forEach((v, i) => {
      q(`[data-bit="${i}"]`).textContent = v;
      q(`[data-cell="${i}"]`).setAttribute('class', v ? 'm' : 'u');
      q(`[data-part="${i}"]`).textContent = P[i] * v;
      total += P[i] * v;
    });
    q('[data-sum]').textContent = bits.map((v, i) => P[i] * v).join(' + ') + '  =  ' + total;
  }
  const set = v => { box.forEach((c, i) => c.checked = Array.isArray(v) ? !!v[i] : v); draw(); };
  box.forEach(c => c.addEventListener('change', draw));
  const [z, o, r] = fig.querySelectorAll('button');
  z.addEventListener('click', () => set(false));
  o.addEventListener('click', () => set(true));
  r.addEventListener('click', () => set(START));
  draw();""".replace("__START__", str(START))
    boxes = "".join(f"<label class='opt'><input type='checkbox'{' checked' if on else ''}> {p}</label>"
                    for p, on in zip(PLACES, START))
    buttons = ("<button type='button'>All 0</button><button type='button'>All 1</button>"
               "<button type='button'>Reset</button>")
    widget("p06", "4:02", "Eight bits count from 0 to 255", [boxes, buttons], yl + 22, b + [body],
           "A bit pattern is a number written in twos instead of tens. Every quantity in this series, "
           "weights included, is stored as patterns like this one.", js)


def fp16(x):
    return float(np.float16(x))


def bf16(x):
    """Round a float to bfloat16 (nearest, ties to even) through its float32 bits."""
    u = struct.unpack("<I", struct.pack("<f", x))[0]
    u = (u + 0x7FFF + ((u >> 16) & 1)) & 0xFFFF0000
    return struct.unpack("<f", struct.pack("<I", u))[0]


def p07():
    w = 0.13
    step = 2.0 ** -13
    s16 = fp16(w)
    assert s16 == 0.1300048828125 and abs(s16 - w) < step / 2 and round(step, 6) == 0.000122
    assert np.float16(w + step) != np.float16(w)          # the neighbour really is one step away
    sb = bf16(w)
    assert sb == 0.1298828125 and 2.0 ** -10 / step == 8
    b = [hd(40, 46, "Each extra bit doubles the number of patterns")]
    rows = [(1, 2), (2, 4), (4, 16), (8, 256), (16, 65536)]
    for k, (bits, n) in enumerate(rows):
        y = 64 + k * 30
        b.append(txt(60, y + 18, f"{bits} bit{'s' if bits > 1 else ''}", "sub2"))
        b.append(txt(150, y + 18, f"2^{bits} = {g(n)} patterns", "sub2"))
    assert all(2 ** a == n for a, n in rows) and 2 ** 16 == 256 * 256
    y0 = 64 + 5 * 30 + 36
    b.append(hd(40, y0, "So a weight is stored as the nearest of them: FP16 near 0.13, to scale"))
    L, R, ya = 70, 610, y0 + 86
    ks = list(range(1062, 1068))                # six neighbouring FP16 values around 0.13
    lo, hi = ks[0] * step, ks[-1] * step
    xs = lambda v: round(L + (v - lo) / (hi - lo) * (R - L), 1)
    b.append(ln(L, ya, R, ya, "axis"))
    for k in ks:
        v = k * step
        b.append(ln(xs(v), ya - 6, xs(v), ya + 6, "tick"))
        b.append(txt(xs(v), ya + 24, f"{v:.6f}", "sub2", "middle"))
    xw, xn = xs(w), xs(s16)
    b.append(ln(xw, ya - 44, xw, ya - 2, "mark"))
    b.append(txt(xw - 6, ya - 50, "0.13, as training left it", "sub2", "end"))
    b.append(f'<circle cx="{xn}" cy="{ya}" r="4.5" fill="var(--m-fill)" stroke="var(--m)" stroke-width="1.5"/>')
    b.append(txt(xn + 8, ya - 50, f"stored as {s16:.7f}", "sub2"))
    b.append(txt((xs(ks[1] * step) + xs(ks[2] * step)) / 2, ya + 44,
                 f"neighbours are 2^−13 = {step:.6f} apart", "sub2", "middle"))
    body, yb = prose(ya + 84, [
        "Every extra bit doubles the number of patterns, so 16 bits give 256 × 256 = 65,536. A weight stored "
        "in 16 bits can be only one of those 65,536 values.",
        "The formats used for weights spread their values unevenly: crowded near zero, where most weights "
        "sit, and sparse far from it. They work like scientific notation in base two ({{fig:v04-o006}}). In "
        "FP16, a common 16-bit format, neighbouring values near 0.13 are 2^−13 apart.",
        f"So a weight that training left at 0.13 is stored as the nearest one, {s16:.7f}: an error of "
        f"{f((s16 - w) * 1e6, 1)} millionths. The model this atlas follows uses BF16, a 16-bit format whose "
        f"values near 0.13 are eight times farther apart, so it would store {sb:.7f}; it gives up precision "
        "to reach much larger and smaller numbers ({{fig:v04-o030}}).",
    ])
    emit("p07", "4:02", "Sixteen bits give 65,536 patterns, so every weight is rounded to the nearest one",
         yb + 26, b + [body],
         "Two bytes per weight is a budget of 65,536 numbers. Every weight is rounded to one of them, and the "
         "fourth video in the series is about how far that budget can be cut.")


if __name__ == "__main__":
    p06()
    p07()
