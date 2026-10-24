"""V3 Part 2, the two tiers and the roofline: §5d merges 08+09 and 11+12, §5a item 16, review #5.

  o008  the two tiers drawn to scale: capacity as area, read rate as bars (merges o009)
  o011  intensity is a lever: one matrix multiply, two schedules (merges o012)
  p05   widget: attention's passes on the H100 roofline, with n and d to turn

  python3 figures/V03/src/tiers.py
"""
import json
from common import *  # noqa: F401,F403


# ---- o008: the two tiers, honestly ---------------------------------------------------------------
def o008():
    sram = H100_SMS * H100_SMEM                    # every byte of shared memory on the chip
    ratio = H100_HBM / sram
    smem_bw = SMEM_BYTES_PER_CLK * H100_SMS * 1.83e9   # FA3 footnote 4: 128 B/clk/SM x 132 x 1830 MHz
    speed = smem_bw / H100_BW
    assert round(sram / 1e6, 1) == 30.8 and round(ratio, -2) == 2600 and round(smem_bw / 1e12) == 31
    assert 9 < speed < 10
    BIG = 250
    small = BIG * math.sqrt(sram / H100_HBM)
    assert 4.9 < small < 5.0
    b = [hd(40, 46, "Capacity drawn as area, read rate as length, both to scale")]
    b.append(cell(40, 70, BIG, BIG, "h", rx=2))
    b.append(txt(40 + BIG / 2, 70 + BIG / 2 - 8, "HBM", "lbl", "middle"))
    b.append(txt(40 + BIG / 2, 70 + BIG / 2 + 12, "80 GB, beside the die", "sub", "middle"))
    sx, sy = 40 + BIG + 22, 70 + BIG - small
    b.append(cell(sx, sy, small, small, "s", rx=1))
    b.append(txt(sx + small + 10, sy + 4, f"all the SRAM on the chip:", "sub2"))
    b.append(txt(sx + small + 10, sy + 20, f"{H100_SMS} × 228 KiB = {sram / 1e6:.1f} MB", "sub2"))
    # read rate, to scale
    RX, SC = 330, 290 / 31e12
    b.append(txt(RX, 86, "read rate", "sub2"))
    b.append(cell(RX, 96, H100_BW * SC, 24, "h"))
    b.append(txt(RX + H100_BW * SC + 8, 113, "HBM, 3.35 TB/s", "sub2"))
    b.append(cell(RX, 128, smem_bw * SC, 24, "s"))
    b.append(txt(RX + 8, 145, f"SRAM, about {smem_bw / 1e12:.0f} TB/s across the chip", "sub", "start"))
    body, yb = prose(70 + BIG + 46, [
        f"The square is the 80 GB of high-bandwidth memory stacked beside the GPU die. The dot beside "
        f"it is every byte of on-chip SRAM on all {H100_SMS} multiprocessors added together, {sram / 1e6:.1f} MB "
        f"({{{{fig:v02-o031}}}}). The slow tier holds about {round(ratio, -2):,.0f} times as much.",
        f"The fast tier wins on speed: it sits beside the arithmetic units, and the chip reads it at "
        f"about {smem_bw / 1e12:.0f} TB/s against HBM's 3.35, roughly {speed:.0f} times faster.",
        "So the fast tier can never hold the data. It holds only the piece being worked on at this "
        f"instant, and choosing that piece is what tiling is (Part {PART['tiling']}).",
    ])
    figure("o008", st("Two tiers of the memory ladder"), "The two tiers that decide everything", yb + 30,
           b + [body],
           esc("Drawn to scale, and the dot really is that small: a 2,600-to-1 ratio drawn as area. Vast "
               "and slow, or tiny and fast; every technique in this atlas keeps the working piece in the "
               "dot."))


# ---- o011: intensity is a lever --------------------------------------------------------------------
def o011():
    n = 4096
    ops = 2 * n ** 3                               # n*n outputs, n multiply-adds each, 2 per multiply-add
    worst = 2 * n ** 3 * 2                         # both inputs fetched for every multiply-add, 2 bytes each
    best = 3 * n * n * 2                           # A and B read once, C written once
    i_worst, i_best = ops / worst, ops / best
    assert (round(ops / 1e9, 1), round(worst / 1e9), round(best / 1e6)) == (137.4, 275, 101)
    assert i_worst == 0.5 and round(i_best) == 1365 and round(i_best / i_worst) == 2731
    b = [hd(40, 46, "One multiply, two ways to feed it")]
    b.append(eq(40, 64, 600, "arithmetic intensity  =  operations  ÷  bytes moved", "u", 36))
    b.append(txt(40, 128, f"C = A × B, both {n:,} × {n:,} in 16-bit:  2 × {n:,}³ = {ops / 1e9:.1f} billion "
                          "operations, whatever the schedule", "sub2"))
    rows = [("fetch both inputs for every multiply-add", f"{worst / 1e9:.0f} GB", i_worst, "h"),
            ("fetch every input once, write the output once", f"{best / 1e6:.0f} MB", i_best, "s")]
    for k, (lab, by, inten, cls) in enumerate(rows):
        y = 146 + k * 44
        b.append(cell(40, y, 300, 32, cls, label=lab))
        b.append(txt(356, y + 21, f"{by} moved", "sub2"))
        b.append(txt(640, y + 21, f"{f(inten, 1) if inten < 10 else f(inten, 0)} per byte", "sub2", "end"))
    # intensity on a log line, with the ridge
    LX0, LX1, ly = 90, 600, 268
    lo, hi = 0.1, 10000
    b.append(tline(LX0, ly, LX1, ly, "axis"))
    for v in (0.1, 1, 10, 100, 1000, 10000):
        x = lg(v, lo, hi, LX0, LX1)
        b.append(tline(x, ly, x, ly + 5))
        b.append(txt(x, ly + 20, f"{v:g}" if v < 1000 else f"{v:,.0f}", "sub2", "middle"))
    xr = lg(RIDGE, lo, hi, LX0, LX1)
    b.append(dashed(xr, ly - 34, xr, ly))
    b.append(txt(xr + 6, ly - 26, f"ridge, {RIDGE:.0f}", "sub2"))
    for inten, var in ((i_worst, "--h"), (i_best, "--s")):
        b.append(dot(lg(inten, lo, hi, LX0, LX1), ly, 5, var))
    b.append(txt(LX0, ly + 40, "operations per byte, log scale", "sub2"))
    body, yb = prose(ly + 76, [
        "The operations are fixed by the mathematics: every one of the 16.8 million outputs needs its "
        f"{n:,} multiply-adds, however the work is arranged. The bytes are not. They depend on how often each "
        "input is fetched from HBM, and that is a decision the kernel makes.",
        f"Fetched afresh for every multiply-add, the inputs cost {worst / 1e9:.0f} GB and the multiply runs "
        f"at {f(i_worst, 1)} operations per byte, deep on the memory side of the ridge. Fetched once, they "
        f"cost {best / 1e6:.0f} MB and the same arithmetic sits at {i_best:,.0f}, far past it: "
        f"{i_best / i_worst:,.0f} times the intensity for identical work.",
        f"Real kernels land between the two. Tiling (Part {PART['tiling']}) is the craft of getting close "
        "to the second.",
    ])
    figure("o011", st("That ratio is arithmetic intensity"), "Intensity is a lever, not a property",
           yb + 30, b + [body],
           esc("One of the two numbers in the ratio is fixed by the mathematics and the other is a "
               "decision. Everything in this atlas pulls on the second."))


# ---- p05: the roofline widget -----------------------------------------------------------------------
NS = [512, 1024, 2048, 4096, 8192, 16384, 32768, 65536]
DS = [64, 128, 256]
SOFT_OPS = 5            # per score: compare for the max, subtract, exponential, add, divide (approximate)


def points(n, d):
    """Operations, bytes and intensity of one head of naive attention in FP16 (Part 4's three passes)."""
    p1 = (2 * n * n * d, 4 * n * d + 2 * n * n)            # QK^T: read Q, K; write S   (pass 3 is the same)
    p2 = (SOFT_OPS * n * n, 4 * n * n)                       # softmax: read S, write P
    p3 = (4 * n * n * d, 8 * n * d + 8 * n * n)              # all three passes: matmul operations only
    p4 = (4 * n * n * d, 8 * n * d)                          # every byte once: Q, K, V read, O written
    return [(o, by, o / by) for o, by in (p1, p2, p3, p4)]


def fmt_i(v):
    return f(v, 2) if v < 10 else (f(v, 1) if v < 100 else f(v, 0))


def fmt_share(v):
    s = min(1.0, v / RIDGE)
    return "all of it" if s >= 1 else f(100 * s, 1) + "%"


X0, X1, Y0, Y1 = 96, 616, 262, 72            # plot box: x = log10 intensity -1..5, y = log10 TFLOP/s -1..3
IX = lambda i: X0 + (math.log10(i) + 1) / 6 * (X1 - X0)
TY = lambda t: Y0 - (math.log10(t) + 1) / 4 * (Y0 - Y1)
ATT = lambda i: min(H100_PEAK, H100_BW * i) / 1e12
LETTERS = "ABCD"
WHAT = ["pass 1 or pass 3: a matrix multiply", "pass 2: the softmax", "all three passes together",
        "the same work, every byte moved once"]

P05_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const NS = __NS__, DS = __DS__, RIDGE = __RIDGE__, BW = __BW__, PEAK = __PEAK__, SOFT = __SOFT__;
  const X0 = __X0__, X1 = __X1__, Y0 = __Y0__, Y1 = __Y1__, N0 = 4, D0 = 0;
  const q = s => fig.querySelector(s), sl = q('input[type=range]'), rad = [...fig.querySelectorAll('input[type=radio]')];
  const IX = i => X0 + (Math.log10(i) + 1) / 6 * (X1 - X0);
  const TY = t => Y0 - (Math.log10(t) + 1) / 4 * (Y0 - Y1);
  const ATT = i => Math.min(PEAK, BW * i) / 1e12;
  const grp = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fx = (v, d) => grp(v.toFixed(d));
  const fmtI = v => v < 10 ? fx(v, 2) : (v < 100 ? fx(v, 1) : fx(v, 0));
  const share = v => { const s = Math.min(1, v / RIDGE); return s >= 1 ? 'all of it' : fx(100 * s, 1) + '%'; };
  function draw() {
    const n = NS[+sl.value], d = DS[rad.findIndex(r => r.checked)];
    q('[data-n]').textContent = grp(String(n));
    const P = [[2*n*n*d, 4*n*d + 2*n*n], [SOFT*n*n, 4*n*n], [4*n*n*d, 8*n*d + 8*n*n], [4*n*n*d, 8*n*d]];
    P.forEach(([o, b], k) => {
      const i = o / b, x = IX(i), y = TY(ATT(i));
      const c = q(`[data-pt="${k}"]`); c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1));
      const t = q(`[data-lt="${k}"]`); t.setAttribute('x', (x - 9).toFixed(1)); t.setAttribute('y', (y - 9).toFixed(1));
      q(`[data-i="${k}"]`).textContent = fmtI(i);
      q(`[data-s="${k}"]`).textContent = share(i);
    });
    q('[data-ops]').textContent = fx(4*n*n*d / 1e9, 1);
    q('[data-bytes]').textContent = fx((8*n*d + 8*n*n) / 1e6, 0);
  }
  sl.addEventListener('input', draw);
  rad.forEach(r => r.addEventListener('change', draw));
  q('button').addEventListener('click', () => { sl.value = N0; rad[D0].checked = true; draw(); });
  draw();
})();</script>"""


def p05():
    n, d = 8192, 64
    P = points(n, d)
    assert round(P[0][2], 1) == 63.0 and P[1][2] == 1.25 and round(P[2][2], 2) == 31.75 and P[3][2] == 4096
    assert round(P[2][1] / 1e6, 2) == 541.07 and fmt_share(P[2][2]) == "10.8%" and fmt_share(P[0][2]) == "21.3%"
    # the claim in the prose: the naive kernel tends to d/2, every-byte-once to n/2
    for dd in DS:
        assert abs(points(10 ** 7, dd)[2][2] - dd / 2) < 0.01 and points(4096, dd)[3][2] == 2048
    s = [f'<text class="hd" x="40" y="34">One head of naive attention on an H100, FP16, sequence of '
         f'<tspan data-n="">{n:,}</tspan> tokens</text>']
    # axes and grid
    for v in (0.1, 1, 10, 100, 1000, 10000, 100000):
        x = IX(v)
        s.append(tline(x, Y1, x, Y0, "axis"))
        s.append(txt(x, Y0 + 18, f"{v:g}" if v < 1000 else f"{v:,.0f}", "sub2", "middle"))
    for t in (0.1, 1, 10, 100, 1000):
        y = TY(t)
        s.append(tline(X0, y, X1, y, "axis"))
        s.append(txt(X0 - 8, y + 4, f"{t:g}" if t < 1000 else "1,000", "sub2", "end"))
    s.append(txt((X0 + X1) / 2, Y0 + 38, "operations per byte, log scale", "sub2", "middle"))
    s.append(txt(X0 - 8, Y1 - 14, "trillion operations a second, at most (log)", "sub2", "start"))
    # the roof: slanted to the ridge, flat after
    roof = [(X0, TY(ATT(0.1))), (IX(RIDGE), TY(H100_PEAK / 1e12)), (X1, TY(H100_PEAK / 1e12))]
    s.append(poly(roof, "--h", 2))
    xr = IX(RIDGE)
    s.append(dashed(xr, TY(H100_PEAK / 1e12) + 6, xr, Y0))
    s.append(txt(xr + 6, Y0 - 8, f"ridge {RIDGE:.0f}", "sub2 halo"))
    s.append(txt(IX(1.2), TY(ATT(30)) - 2, "memory bound", "sub2 halo"))
    s.append(txt(IX(3000), TY(H100_PEAK / 1e12) + 18, "compute bound: 989", "sub2 halo"))
    for k, (o, by, i) in enumerate(P):
        x, y = IX(i), TY(ATT(i))
        s.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5" fill="var(--paper)" stroke="var(--m)" '
                 f'stroke-width="2" data-pt="{k}"/>')
        s.append(f'<text class="sub2 halo" x="{x - 9:.1f}" y="{y - 9:.1f}" text-anchor="end" '
                 f'data-lt="{k}">{LETTERS[k]}</text>')
    # the table
    ty = Y0 + 74
    s.append(txt(40, ty, "point", "sub2"))
    s.append(txt(104, ty, "what", "sub2"))
    s.append(txt(500, ty, "per byte", "sub2", "end"))
    s.append(txt(640, ty, "most of peak", "sub2", "end"))
    for k, (o, by, i) in enumerate(P):
        y = ty + 26 + k * 24
        s.append(txt(40, y, LETTERS[k], "cap"))
        s.append(txt(104, y, WHAT[k], "cap"))
        s.append(f'<text class="sub2" x="500" y="{y}" text-anchor="end" data-i="{k}">{fmt_i(i)}</text>')
        s.append(f'<text class="sub2" x="640" y="{y}" text-anchor="end" data-s="{k}">{fmt_share(i)}</text>')
    yo = ty + 26 + 4 * 24 + 6
    s.append(f'<text class="sub2" x="104" y="{yo}">C: <tspan data-ops="">{f(P[2][0] / 1e9, 1)}</tspan> billion '
             f'operations on <tspan data-bytes="">{f(P[2][1] / 1e6, 0)}</tspan> MB</text>')
    body, yb = prose(yo + 44, [
        "The H100's roofline ({{fig:v01-o123}}): at I operations per byte a kernel can run at most "
        f"3.35 × I trillion operations a second, until the 989 ceiling at I = {RIDGE:.0f} "
        "({{fig:v02-o075}}). Divided by 989, that is the most of peak it can ever reach: I ÷ 295 below "
        "the ridge, all of it past it.",
        f"The points are one head of attention done the naive way (Part {PART['naive']}). Each matrix-multiply "
        f"pass does 2·n²·d operations on its inputs and its n × n output: {f(P[0][2], 1)} per byte at "
        f"8,192 tokens. The softmax pass does about five operations per score on four bytes, 1.25 per "
        f"byte, and those are not even tensor-core work. Together: {f(P[2][2], 1)} per byte, at most "
        f"{fmt_share(P[2][2])} of peak.",
        "Point D is the same arithmetic with every byte moved once. Drag the length: D moves right with "
        "n, while C settles near d ÷ 2 however long the sequence, because the score matrix's bytes grow "
        "exactly as fast as its arithmetic. The arithmetic here was checked against Python.",
    ])
    title = "Attention's arithmetic could sit past the ridge; its naive schedule cannot"
    ctl = (f"<label>sequence length <input type='range' min='0' max='{len(NS) - 1}' step='1' value='4'>"
           f"</label>")
    opts = ("<label class='opt'>head dimension</label>"
            + "".join(f"<label class='opt'><input type='radio' name='v03-p05-d' value='{dd}'"
                      f"{' checked' if dd == d else ''}> {dd}</label>" for dd in DS)
            + "<button type='button'>Reset</button>")
    js = (P05_JS.replace("__NS__", json.dumps(NS)).replace("__DS__", json.dumps(DS))
          .replace("__RIDGE__", repr(RIDGE)).replace("__BW__", repr(H100_BW)).replace("__PEAK__", repr(H100_PEAK))
          .replace("__SOFT__", str(SOFT_OPS)).replace("__X0__", str(X0)).replace("__X1__", str(X1))
          .replace("__Y0__", str(Y0)).replace("__Y1__", str(Y1)))
    html_ = (f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; "
             f"{st('Attention over long sequences is the opposite')}</div><h3>{esc(title)}</h3>"
             f"<div class='wg'><div class='ctl'>{ctl}</div><div class='ctl'>{opts}</div>"
             f"<svg viewBox='0 0 680 {int(yb + 26)}' role='img'><title>{esc(title)}</title>{''.join(s)}{body}</svg></div>"
             "<figcaption>" + esc("Attention is not memory-bound by nature: its own arithmetic could sit far "
                                  "past the ridge. What pins it at a tenth of peak is the naive schedule's "
                                  "bytes, and those are the lever.") + f"</figcaption>{js}</figure>")
    (ITEMS / "p05.html").write_text(html_, encoding="utf-8")
    print("p05", title)


if __name__ == "__main__":
    for fn in (o008, o011, p05):
        fn()
