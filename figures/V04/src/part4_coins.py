"""V4 Part 4 widget p14 (review entry 14): independent ±1 nudges add up to about √n, not n.

Two hundred sums of n coin tosses, each toss +1 or −1. The tosses come from a counter-based hash
(Wellons's lowbias32) of (seed, sum, toss), written identically here and in the page, so the first
frame is drawn in Python and every frame the page draws can be checked against this file.

  python3 figures/V04/src/part4_coins.py      writes figures/V04/items/p14.html
"""
import math
import numpy as np
from common import emit_widget, hd, prose, text, hline, tick, f, fi, nb, MINUS, esc, st

REPS, NMAX, SEED0, K0 = 200, 4096, 1, 8          # 200 sums; n = 2^K from 4 to 4,096; start at n = 256
BINS1, BINS2 = 64, 32
L, R = 80, 620
Y1, Y2, HMAX = 190, 400, 110                    # HMAX: the height of each panel's tallest bar
M32 = 0xFFFFFFFF


def lowbias32(x):
    x = np.asarray(x, dtype=np.uint64) & M32
    x ^= x >> 16
    x = (x * 0x7FEB352D) & M32
    x ^= x >> 15
    x = (x * 0x846CA68B) & M32
    x ^= x >> 16
    return x


def totals(seed):
    """cum[r, i]: the running total of sum r after i + 1 tosses."""
    base = (seed * 0x9E3779B9) & M32
    k = (base + np.arange(REPS, dtype=np.uint64)[:, None] * NMAX + np.arange(NMAX, dtype=np.uint64)[None, :]) & M32
    coins = np.where((lowbias32(k) >> 31) == 1, 1, -1)
    return np.cumsum(coins, axis=1)


def frame(seed, K):
    """Everything the widget shows for one setting: the readouts and both histograms' counts."""
    n = 2 ** K
    T = totals(seed)[:, n - 1].astype(np.int64)
    rms = math.sqrt(float((T * T).sum()) / REPS)
    h1 = [0] * BINS1
    h2 = [0] * BINS2
    for t in T.tolist():
        h1[min(BINS1 - 1, math.floor((t + n) / (2 * n) * BINS1))] += 1
        z = t / math.sqrt(n)
        h2[min(BINS2 - 1, max(0, math.floor((z + 4) / 8 * BINS2)))] += 1
    rt = math.sqrt(n)
    return {"n": n, "rms": f(rms, 2), "root": f(rt, 2) if rt != int(rt) else str(int(rt)), "worst": fi(n),
            "h1": h1, "h2": h2, "rms_value": rms}


# the claims in the prose: the rms tracks √n from 4 to 4,096, and a sum this long never comes near n
for s in (1, 2, 3):
    for K in range(2, 13):
        fr = frame(s, K)
        assert 0.8 < fr["rms_value"] / math.sqrt(fr["n"]) < 1.2, (s, K, fr["rms"])
assert frame(1, 12)["rms_value"] < 0.03 * 4096

JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const REPS = __REPS__, NMAX = __NMAX__, B1 = __B1__, B2 = __B2__, L = __L__, R = __R__;
  const Y1 = __Y1__, Y2 = __Y2__, HMAX = __HMAX__, SEED0 = __SEED0__, K0 = __K0__;
  const slider = fig.querySelector('input[type=range]'), val = fig.querySelector('.val');
  let seed = SEED0, cum = null;
  const h32 = x => { x ^= x >>> 16; x = Math.imul(x, 0x7feb352d); x ^= x >>> 15;
                     x = Math.imul(x, 0x846ca68b); x ^= x >>> 16; return x >>> 0; };
  function build() {
    const base = Math.imul(seed, 0x9E3779B9) >>> 0;
    cum = [];
    for (let r = 0; r < REPS; r++) {
      const row = new Int32Array(NMAX); let s = 0;
      for (let i = 0; i < NMAX; i++) { s += (h32((base + r * NMAX + i) >>> 0) >>> 31) ? 1 : -1; row[i] = s; }
      cum.push(row);
    }
  }
  const fx = (v, d) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
  const comma = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  function draw() {
    const K = +slider.value, n = 2 ** K, rt = Math.sqrt(n);
    val.textContent = comma(n);
    const T = cum.map(row => row[n - 1]);
    const rms = Math.sqrt(T.reduce((a, t) => a + t * t, 0) / REPS);
    const h1 = new Array(B1).fill(0), h2 = new Array(B2).fill(0);
    T.forEach(t => {
      h1[Math.min(B1 - 1, Math.floor((t + n) / (2 * n) * B1))]++;
      const z = t / Math.sqrt(n);
      h2[Math.min(B2 - 1, Math.max(0, Math.floor((z + 4) / 8 * B2)))]++;
    });
    const m1 = Math.max(...h1), m2 = Math.max(...h2);
    const bar = (sel, c, Y, m) => { const e = fig.querySelector(sel), h = c / m * HMAX;
      e.setAttribute('height', h.toFixed(2)); e.setAttribute('y', (Y - h).toFixed(2)); e.dataset.count = c; };
    h1.forEach((c, i) => bar(`[data-h1="${i}"]`, c, Y1, m1));
    h2.forEach((c, i) => bar(`[data-h2="${i}"]`, c, Y2, m2));
    const W = (R - L) / 2;
    fig.querySelector('[data-k="lo"]').textContent = '−' + comma(n);
    fig.querySelector('[data-k="hi"]').textContent = comma(n);
    fig.querySelector('[data-k="rms"]').textContent = fx(rms, 2);
    fig.querySelector('[data-k="root"]').textContent = Number.isInteger(rt) ? String(rt) : fx(rt, 2);
    fig.querySelector('[data-k="worst"]').textContent = comma(n);
    const m = fig.querySelectorAll('[data-root]');
    m.forEach(e => { const x = (L + R) / 2 + (+e.dataset.root) * rt / n * W;
      e.setAttribute('x1', x.toFixed(2)); e.setAttribute('x2', x.toFixed(2)); });
  }
  slider.addEventListener('input', draw);
  fig.querySelector('button[data-again]').addEventListener('click', () => { seed += 1; build(); draw(); });
  fig.querySelector('button[data-reset]').addEventListener('click', () => {
    seed = SEED0; slider.value = K0; build(); draw(); });
  build(); draw();
})();</script>"""


def p14():
    fr = frame(SEED0, K0)
    n = fr["n"]
    W1, W2 = (R - L) / BINS1, (R - L) / BINS2
    b = [hd(40, 30, f"Two hundred sums, each of n random tosses scoring +1 or −1")]
    b.append(text(40, 58, "On the scale of the worst case, from −n to +n, where every toss agrees", "sub2"))
    for i, c in enumerate(fr["h1"]):
        h = c / max(fr["h1"]) * HMAX
        b.append(f'<g class="m"><rect x="{L + i * W1 + 0.6:.2f}" y="{f(Y1 - h, 2)}" width="{W1 - 1.2:.2f}" '
                 f'height="{f(h, 2)}" rx="1" data-h1="{i}" data-count="{c}"/></g>')   # f: half up, as toFixed
    b.append(hline(L, R, Y1))
    rt = math.sqrt(n)
    W = (R - L) / 2
    for sgn in (-1, 1):
        x = (L + R) / 2 + sgn * rt / n * W                # the same order of operations as the page
        b.append(f'<line class="tick" x1="{x:.2f}" y1="{Y1 + 2}" x2="{x:.2f}" y2="{Y1 + 12}" data-root="{sgn}"/>')
    b.append(text(L, Y1 + 26, MINUS + fr["worst"], "sub2", "middle", ' data-k="lo"'))
    b.append(text((L + R) / 2, Y1 + 26, "0  (ticks at ±√n)", "sub2", "middle"))
    b.append(text(R, Y1 + 26, fr["worst"], "sub2", "middle", ' data-k="hi"'))
    b.append(text(40, Y2 - HMAX - 20, "Zoomed so that √n is always the same width: the shape never changes", "sub2"))
    for i, c in enumerate(fr["h2"]):
        h = c / max(fr["h2"]) * HMAX
        b.append(f'<g class="s"><rect x="{L + i * W2 + 0.6:.2f}" y="{f(Y2 - h, 2)}" width="{W2 - 1.2:.2f}" '
                 f'height="{f(h, 2)}" rx="1" data-h2="{i}" data-count="{c}"/></g>')
    b.append(hline(L, R, Y2))
    for z in range(-4, 5, 2):
        x = L + (z + 4) / 8 * (R - L)
        b.append(tick(x, Y2 - 4, Y2 + 4))
        lab = "0" if z == 0 else (MINUS if z < 0 else "") + (f"{abs(z)}√n")
        b.append(text(x, Y2 + 22, lab, "sub2", "middle"))
    yr = Y2 + 56
    rows = [("typical size of the 200 sums (their rms)", "rms", fr["rms"]), ("√n", "root", fr["root"]),
            ("worst case, every toss the same", "worst", fr["worst"])]
    for k, (lab, key, v) in enumerate(rows):
        y = yr + k * 22
        b.append(text(40, y, lab, "sub2"))
        b.append(text(330, y, v, "sub2", "start", f' data-k="{key}"'))
    body, y = prose(yr + 3 * 22 + 26, [
        "Each term of a rounded weighted sum carries a small error, equally likely to push up or down, "
        "like a coin toss scoring +1 or −1. In the worst case all n agree and the total is n. Move the "
        "slider: the sums cluster ever more tightly on the scale of n, while the zoomed bell keeps its "
        "shape, because their spread grows like √n. Each panel's bars are scaled to its tallest.",
        "Why √n: square a sum of two tosses, (a + b)² = a² + 2ab + b². Each square is 1, and ab is +1 or "
        "−1 equally often, so it averages to zero: the average square is 2. With n tosses there are n "
        "squares worth 1 each and pairs that average to zero, so the average square of the total is n, "
        "and its typical size is √n.",
        "That typical size, the square root of the average square, is called the root mean square, or "
        "rms; this atlas measures the size of an error with it from here on. The tosses are a fixed "
        "pseudo-random sequence, so the page draws the same sums each time, and its arithmetic was "
        "checked against Python at every setting.",
    ])
    b.append(body)
    controls = [f"<label>n <input type='range' min='2' max='12' step='1' value='{K0}'>"
                f"<span class='val'>{fi(n)}</span></label>"
                "<button type='button' data-again=''>Toss again</button>"
                "<button type='button' data-reset=''>Reset</button>"]
    js = JS
    for k, v in {"__REPS__": REPS, "__NMAX__": NMAX, "__B1__": BINS1, "__B2__": BINS2, "__L__": L, "__R__": R,
                 "__Y1__": Y1, "__Y2__": Y2, "__HMAX__": HMAX, "__SEED0__": SEED0, "__K0__": K0}.items():
        js = js.replace(k, str(v))
    emit_widget("p14", st("Inside the network's long weighted sums"),
                "Independent nudges grow like the square root of their number", controls, y + 26, b,
                "Quadruple the number of independent errors and their typical total only doubles. A sum of "
                "4,096 such errors is typically about 64 of them wide, not 4,096.", js)


if __name__ == "__main__":
    p14()
