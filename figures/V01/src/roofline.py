"""V01 Part 8, the roofline: o123 redrawn to scale on true log-log axes (review §5.1 #4, §5.5), and
proposal 21, a widget that slides a workload along the roofline of a chosen chip.

  python3 figures/V01/src/roofline.py
"""
import json
import math
from common import (cell, ln, txt, hd, eq, prose, emit, widget, tag, st, f, g, sig, rnd, JS_FMT, CHIPS,
                    PEAK, BW, RIDGE)
import roof
from roof import xs, ys, axes, roof_points, attainable, sig3

H100 = CHIPS["H100"]


def o123():
    b = [hd(40, 34, "The H100's roofline, both axes logarithmic and drawn to scale")]
    b += axes()
    b.append(f'<polyline class="pl-m" points="{roof_points(PEAK, BW)}"/>')
    xr = xs(RIDGE)
    b.append(ln(xr, ys(PEAK) + 4, xr, roof.B, "mark"))
    b.append(txt(xr + 6, roof.B - 10, f"the ridge, {round(RIDGE)}", "sub2 halo"))
    b.append(txt(xs(1000), ys(PEAK) - 10, "flat ceiling: 989 trillion a second", "sub2 halo", "middle"))
    for i, lab in ((1, "1 per byte: 3.35 trillion a second"), (10, "10 per byte: 33.5 trillion")):
        x, y = xs(i), ys(BW * i)
        b.append(f'<circle cx="{x}" cy="{y}" r="4" fill="var(--paper)" stroke="var(--h)" stroke-width="1.5"/>')
        b.append(txt(x + 8, y + 16, lab, "sub2 halo"))
    assert round(BW * 1 / 1e12, 2) == 3.35 and round(BW * 10 / 1e12, 1) == 33.5
    b.append(txt(xs(0.3), ys(BW * 0.3) - 14, "slanted ceiling: bandwidth × intensity", "sub2 halo"))
    b.append(eq(140, roof.B + 58, 400, "attainable  =  the lower of:  peak,  bandwidth × intensity", "m"))
    body, yb = prose(roof.B + 58 + 42 + 36, [
        "Both axes are logarithmic ({{fig:v01-o121}}): each labelled step is ten times the one before. The "
        "slanted ceiling is the bandwidth times the intensity: at one operation per byte, 3.35 TB/s supports "
        "3.35 trillion operations a second; at ten, 33.5 trillion. On these axes it is a straight line.",
        "The flat ceiling is the peak arithmetic rate, 989 trillion operations a second, which no workload can "
        "beat however much work it gets from each byte. A workload sits on whichever ceiling is lower at its "
        "intensity.",
    ])
    emit("o123", st("It's called the roofline model"), "The roofline", yb + 26, b + [body],
         "Introduced by Williams, Waterman and Patterson at Berkeley in 2009. Drawn to scale, the corner sits at "
         "295 operations per byte, far to the right of where a single decoding token lives.")


INIT_V, INIT_CHIP = 0.0, "H100"


def readouts(i, chip):
    c = CHIPS[chip]
    a = attainable(i, c["peak"], c["bw"])
    ridge = c["peak"] / c["bw"]
    busy = a / c["peak"] * 100
    bound = (f"memory bound: below the ridge of {round(ridge)}" if i < ridge
             else f"compute bound: at or above the ridge of {round(ridge)}")
    return [f"intensity: {sig3(i)} operations per byte",
            f"attainable: {sig3(a / 1e12)} trillion operations a second",
            f"arithmetic units busy: {sig3(busy)}% of the time",
            bound]


def intensity(v):
    """The slider's value is log10 of the intensity; round the intensity to 3 significant figures."""
    return float(f"{10 ** v:.3g}")


def p21():
    i0 = intensity(INIT_V)
    c = CHIPS[INIT_CHIP]
    b = [hd(40, 34, "Slide a workload along the roofline of a chosen chip")]
    b += axes()
    b.append(f'<polyline class="pl-m" data-roof="" points="{roof_points(c["peak"], c["bw"])}"/>')
    r = c["peak"] / c["bw"]
    b.append(f'<line class="mark" data-ridge="" x1="{xs(r)}" y1="{ys(c["peak"]) + 4}" x2="{xs(r)}" y2="{roof.B}"/>')
    a = attainable(i0, c["peak"], c["bw"])
    b.append(f'<circle data-pt="" cx="{xs(i0)}" cy="{ys(a)}" r="6" fill="var(--s-fill)" stroke="var(--s)" stroke-width="2"/>')
    for k, line in enumerate(readouts(i0, INIT_CHIP)):
        b.append(tag("text", {"class": "sub2", "x": 140, "y": roof.B + 70 + k * 20, "data-r": k}, line))
    yb0 = roof.B + 70 + 4 * 20 + 20
    body, yl = prose(yb0, [
        "Move the intensity and the point rides the lower ceiling. Below the ridge, every extra operation per "
        "byte buys speed in proportion; above it, nothing does, because the arithmetic units are already full.",
        "Switch chips and the corner moves. The H200 has the H100's arithmetic with 4.8 TB/s of bandwidth, so "
        "its ridge drops to 206; the B200 raises both, to 2,250 trillion operations a second and 8 TB/s, a "
        "ridge of 281. Every figure comes from NVIDIA's specifications, dense 16-bit.",
        "The readouts were checked against Python at every position of the slider, for all three chips.",
    ])
    assert round(CHIPS["H200"]["peak"] / CHIPS["H200"]["bw"]) == 206 and round(CHIPS["B200"]["peak"] / CHIPS["B200"]["bw"]) == 281
    js = JS_FMT + roof.JS_ROOF + r"""
  const fig = document.currentScript.closest('figure');
  const CHIPS = __CHIPS__, V0 = __V0__;
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val');
  const rad = [...fig.querySelectorAll('input[type=radio]')], q = s => fig.querySelector(s);
  function draw() {
    const v = +sl.value, i = +(Math.pow(10, v)).toPrecision(3);
    const name = rad.find(r => r.checked).value, c = CHIPS[name];
    const a = Math.min(c.peak, c.bw * i), ridge = c.peak / c.bw, busy = a / c.peak * 100;
    val.textContent = sig3(i);
    q('[data-roof]').setAttribute('points', roofPts(c.peak, c.bw));
    const rl = q('[data-ridge]'); rl.setAttribute('x1', xs(ridge)); rl.setAttribute('x2', xs(ridge));
    rl.setAttribute('y1', ys(c.peak) + 4);
    const pt = q('[data-pt]'); pt.setAttribute('cx', xs(i)); pt.setAttribute('cy', ys(a));
    const R = Math.round(ridge);
    const lines = [`intensity: ${sig3(i)} operations per byte`,
      `attainable: ${sig3(a / 1e12)} trillion operations a second`,
      `arithmetic units busy: ${sig3(busy)}% of the time`,
      i < ridge ? `memory bound: below the ridge of ${R}` : `compute bound: at or above the ridge of ${R}`];
    lines.forEach((t, k) => q(`[data-r="${k}"]`).textContent = t);
  }
  sl.addEventListener('input', draw);
  rad.forEach(r => r.addEventListener('change', draw));
  q('button').addEventListener('click', () => { sl.value = V0; rad[0].checked = true; draw(); });
  draw();""".replace("__CHIPS__", json.dumps({k: dict(peak=v["peak"], bw=v["bw"]) for k, v in CHIPS.items()})) \
             .replace("__V0__", str(INIT_V))
    ctl1 = (f"<label>intensity <input type='range' min='-1' max='4' step='0.01' value='{INIT_V:g}'>"
            f"<span class='val'>{sig3(i0)}</span></label>")
    ctl2 = "".join(f"<label class='opt'><input type='radio' name='v01-p21-chip' value='{k}'"
                   f"{' checked' if k == INIT_CHIP else ''}> {k}</label>" for k in CHIPS) + \
        "<button type='button'>Reset</button>"
    widget("p21", st("The Nvidia H100 peaks at 989"), "Slide a workload along the roofline",
           [ctl1, ctl2], yl + 22, b + [body],
           "The roofline as an instrument rather than a picture. Any workload whose operations and bytes can be "
           "counted can be placed on it before it is run.", js)


if __name__ == "__main__":
    o123()
    p21()
