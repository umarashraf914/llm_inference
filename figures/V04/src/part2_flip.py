"""V4 Part 2 widget p02w: flip the bits of an FP16 number and watch it decode (review §6, "a bit-flipper
attached to Fig 18 / entry 2"). It sits after Fig 18 and runs the same four steps on any pattern.

The Python here is the reference: decode_strings(word) gives every string the widget shows. The
page's JavaScript reimplements it, and check_widgets.py walks all 65,536 patterns in a browser and
compares them.

  python3 figures/V04/src/part2_flip.py      writes figures/V04/items/p02w.html
"""
import json
from decimal import Decimal, ROUND_HALF_UP
from fractions import Fraction as Fr
import numpy as np
from common import emit_widget, hd, prose, text, esc, MINUS, sup, f, nb

SIG = 12                                   # significant digits shown for a value that is not exact
X0, CW, CG, FG, Y0, CH = 60, 30, 4, 10, 58, 34
BOX_X, BOX_W = 290, 350
ROWS = ["exponent field as a whole number", "subtract the bias", "mantissa field as a whole number m",
        "the significand", "assemble", "all sixteen bits as one whole number"]
PRESETS = [("1", 0x3C00), ("0.1", 0x2E66), ("largest", 0x7BFF), ("smallest normal", 0x0400),
           ("smallest subnormal", 0x0001), ("infinity", 0x7C00)]
START = 0x4680                              # 6.5, the number Figs 17 and 18 work


def cell_x(k):
    """x of bit cell k, k = 0 the sign, 1-5 exponent, 6-15 mantissa."""
    return X0 + k * (CW + CG) + (FG if k >= 1 else 0) + (FG if k >= 6 else 0)


def field_cls(k, bit):
    if bit == "0":
        return "u"
    return "m" if k == 0 else "h" if k < 6 else "s"


def num(v):
    """A value as the widget prints it: exact when ten significant digits hold it, else rounded half up
    to ten and marked ≈. Scientific notation below 10⁻⁶, as JavaScript's toPrecision does."""
    x = Fr(v)
    if x == 0:
        return "=", "0"
    a = Decimal(float(abs(x)))                       # every FP16 value is exact as a double
    e = a.adjusted()
    q = a.quantize(Decimal(1).scaleb(e - SIG + 1), rounding=ROUND_HALF_UP)
    if q.adjusted() != e:                            # rounding carried into a new digit
        e = q.adjusted()
        q = a.quantize(Decimal(1).scaleb(e - SIG + 1), rounding=ROUND_HALF_UP)
    exact = q == a
    sign = MINUS if x < 0 else ""
    if e < -6:
        m = (q.scaleb(-e)).normalize()
        ms = format(m, "f")
        s = f"{ms} × 10{sup(e)}"
    else:
        s = format(q.normalize(), "f") if q != q.to_integral() else format(q.to_integral(), "f")
        if "." not in s and abs(q) >= 1000:
            s = f"{int(q):,}"
    return ("=" if exact else "≈"), sign + s


def js(x):
    """A double printed as JavaScript's String() prints it: shortest round trip, no trailing .0."""
    r = repr(float(x))
    return r[:-2] if r.endswith(".0") else r


def decode_strings(word):
    """Every string the widget shows for one 16-bit pattern, in display order."""
    bits = format(word, "016b")
    s, e, m = int(bits[0]), int(bits[1:6], 2), int(bits[6:], 2)
    sg = "+" if s == 0 else MINUS
    out = [f"{bits[1:6]} = {e}"]
    if e == 31:
        out += ["code 31 is reserved", f"{bits[6:]} = {m}",
                "zero means infinity" if m == 0 else "not zero: not a number",
                f"{sg}infinity" if m == 0 else "NaN, not a number"]
    elif e == 0:
        sig = Fr(m, 1024)
        rel, vs = num((-1) ** s * sig * Fr(1, 2 ** 14))
        if m == 0 and s:
            vs = MINUS + "0"                         # IEEE keeps a negative zero
        out += ["code 0: subnormal, held at −14", f"{bits[6:]} = {m}",
                f"no implied 1: 0 + {m}/1024 = {js(sig)}",
                f"{sg}1 × 2⁻¹⁴ × {js(sig)} {rel} {vs}"]
    else:
        sig = 1 + Fr(m, 1024)
        p = e - 15
        rel, vs = num((-1) ** s * sig * Fr(2) ** p)
        out += [f"{e} − 15 = {str(p).replace('-', MINUS)}", f"{bits[6:]} = {m}",
                f"1 + {m}/1024 = {js(sig)}", f"{sg}1 × 2{sup(p)} × {js(sig)} {rel} {vs}"]
    out.append(f"{word:,}")
    return out


# the reference agrees with numpy's FP16 on the value of every finite pattern
for w in range(1 << 16):
    v = np.uint16(w).view(np.float16)
    bits = format(w, "016b")
    e, m = int(bits[1:6], 2), int(bits[6:], 2)
    if e != 31:
        mine = (-1) ** int(bits[0]) * (Fr(m, 1024) * Fr(1, 2 ** 14) if e == 0 else (1 + Fr(m, 1024)) * Fr(2) ** (e - 15))
        assert Fr(float(v)) == mine, w
    else:
        assert (np.isinf(v) if m == 0 else np.isnan(v)), w
assert decode_strings(START)[:5] == ["10001 = 17", "17 − 15 = 2", "1010000000 = 640", "1 + 640/1024 = 1.625",
                                     "+1 × 2² × 1.625 = 6.5"]
assert decode_strings(0x2E66)[4] == "+1 × 2⁻⁴ × 1.599609375 = 0.0999755859375"
assert decode_strings(0x7BFF)[4] == "+1 × 2¹⁵ × 1.9990234375 = 65,504"
assert decode_strings(0x0001)[4].endswith("≈ 5.96046447754 × 10⁻⁸")
assert decode_strings(START ^ 1)[4].endswith("= 6.50390625")          # the last mantissa bit: 1/256
assert decode_strings(START ^ (1 << 13))[4].endswith("= 1,664")       # exponent bit worth 8: 17 -> 25

JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const START = __START__, SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', M = '−';
  let w = START;
  const sup = n => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(d => SUP[+d]).join('');
  const comma = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  function num(x) {
    if (x === 0) return ['=', '0'];
    const a = Math.abs(x), sg = x < 0 ? M : '';
    let s = a.toPrecision(__SIG__), exact = Number(s) === a, out;
    if (s.includes('e')) {
      let [mm, ee] = s.split('e');
      if (mm.includes('.')) mm = mm.replace(/0+$/, '').replace(/\.$/, '');
      out = mm + ' × 10' + sup(+ee);
    } else {
      if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
      out = s.includes('.') ? s : comma(s);
    }
    return [exact ? '=' : '≈', sg + out];
  }
  function strings(word) {
    const bits = word.toString(2).padStart(16, '0');
    const s = +bits[0], e = parseInt(bits.slice(1, 6), 2), m = parseInt(bits.slice(6), 2);
    const sg = s ? M : '+', out = [bits.slice(1, 6) + ' = ' + e];
    if (e === 31) {
      out.push('code 31 is reserved', bits.slice(6) + ' = ' + m,
               m === 0 ? 'zero means infinity' : 'not zero: not a number',
               m === 0 ? sg + 'infinity' : 'NaN, not a number');
    } else if (e === 0) {
      const sig = m / 1024;
      let [rel, vs] = num((s ? -1 : 1) * sig * Math.pow(2, -14));
      if (m === 0 && s) vs = M + '0';
      out.push('code 0: subnormal, held at −14', bits.slice(6) + ' = ' + m,
               'no implied 1: 0 + ' + m + '/1024 = ' + String(sig),
               sg + '1 × 2⁻¹⁴ × ' + String(sig) + ' ' + rel + ' ' + vs);
    } else {
      const sig = 1 + m / 1024, p = e - 15, [rel, vs] = num((s ? -1 : 1) * sig * Math.pow(2, p));
      out.push(e + ' − 15 = ' + String(p).replace('-', M), bits.slice(6) + ' = ' + m,
               '1 + ' + m + '/1024 = ' + String(sig), sg + '1 × 2' + sup(p) + ' × ' + String(sig) + ' ' + rel + ' ' + vs);
    }
    out.push(comma(word));
    return out;
  }
  const cls = (k, b) => b === '0' ? 'u' : (k === 0 ? 'm' : k < 6 ? 'h' : 's');
  function draw() {
    const bits = w.toString(2).padStart(16, '0');
    fig.querySelectorAll('[data-bit]').forEach(g => {
      const k = +g.dataset.bit;
      g.setAttribute('class', cls(k, bits[k]));
      g.querySelector('text').textContent = bits[k];
    });
    strings(w).forEach((s, i) => fig.querySelector(`[data-row="${i}"]`).textContent = s);
  }
  fig.querySelectorAll('[data-bit]').forEach(g => g.addEventListener('click', () => {
    w ^= 1 << (15 - +g.dataset.bit); draw();
  }));
  fig.querySelectorAll('button[data-word]').forEach(b => b.addEventListener('click', () => {
    w = +b.dataset.word; draw();
  }));
  fig.querySelector('button[data-reset]').addEventListener('click', () => { w = START; draw(); });
  draw();
})();</script>"""


def p02w():
    bits = format(START, "016b")
    rows = decode_strings(START)
    b = [hd(40, 30, "Click any bit to flip it. FP16: one sign bit, five exponent bits, ten mantissa bits")]
    heads = ["±", "16", "8", "4", "2", "1", "512", "256", "128", "64", "32", "16", "8", "4", "2", "1"]
    for k in range(16):
        x = cell_x(k)
        b.append(text(x + CW / 2, Y0 - 8, heads[k], "sub2", "middle"))
        b.append(f'<g class="{field_cls(k, bits[k])}" data-bit="{k}" style="cursor:pointer">'
                 f'<rect x="{x}" y="{Y0}" width="{CW}" height="{CH}" rx="3"/>'
                 f'<text class="sub" x="{x + CW / 2}" y="{Y0 + CH / 2}" text-anchor="middle" '
                 f'dominant-baseline="central">{bits[k]}</text></g>')
    b.append(text(cell_x(0), Y0 + CH + 18, "sign", "sub2"))
    b.append(text(cell_x(1), Y0 + CH + 18, "exponent field", "sub2"))
    b.append(text(cell_x(6), Y0 + CH + 18, "mantissa field", "sub2"))
    yr = Y0 + CH + 42
    for i, (lab, s) in enumerate(zip(ROWS, rows)):
        y = yr + i * 40
        b.append(text(40, y + 21, lab, "sub2"))
        c = "s" if i == 4 else "m" if i in (1, 3) else "u"
        b.append(f'<g class="{c}"><rect x="{BOX_X}" y="{y}" width="{BOX_W}" height="32" rx="5"/>'
                 f'<text class="sub" x="{BOX_X + BOX_W / 2}" y="{y + 16}" text-anchor="middle" '
                 f'dominant-baseline="central" data-row="{i}">{esc(s)}</text></g>')
    body, y = prose(yr + 6 * 40 + 34, [
        "These are the four steps of {{fig:v04-o018}}, run on any pattern you make. The exponent field "
        "is read as a whole number ({{fig:v04-p01}}) and the bias of 15 subtracted. The mantissa field, "
        "read as a whole number m, is the fraction m/1024 after the point ({{fig:v04-p02}}), with the "
        "implied 1 in front.",
        "Flip the last bit of 6.5 and it becomes 6.50390625: one step of the grid near 6.5 is "
        + nb("2² × 2⁻¹⁰ = 1/256") + " ({{fig:v04-o020}}). Flip the exponent bit worth 8 and the field goes from 17 "
        "to 25, so 6.5 becomes 1,664. Clear all five exponent bits to reach the subnormals of "
        "{{fig:v04-p04}}; set all five for infinity and not-a-number.",
        "The last row reads the whole word as one number. Larger positive floats always have larger "
        "words, which is the point of {{fig:v04-o013}}. The widget's arithmetic was checked against "
        "Python on all 65,536 patterns.",
    ])
    b.append(body)
    presets = "".join(f"<button type='button' data-word='{w}'>{esc(lab)}</button>" for lab, w in PRESETS)
    controls = [presets + "<button type='button' data-reset=''>Reset to 6.5</button>"]
    script = JS.replace("__START__", str(START)).replace("__SIG__", str(SIG))
    emit_widget("p02w", "1:12", "Flip the bits of an FP16 number and watch it decode", controls, y + 26, b,
                "Every FP16 number is one of these 65,536 patterns, and every one decodes by the same four "
                "steps. Range, precision, subnormals and the reserved codes are all just patterns of bits.",
                script)


if __name__ == "__main__":
    p02w()
