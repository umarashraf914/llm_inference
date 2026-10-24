"""V9 Part 3, the wall restated: Fig 5 redrawn (rates as numbers, the gap as 1,250 cells), N5 (the
sparse mode), N6 (the amortisation ladder), N7 (two rooflines, a widget).
plans/depth_pass/V09_review.md §4 C and §5 Fig 5.

  python3 figures/V09/src/wall.py       writes items o005 n05 n06 n07

Sources: NVIDIA's GB200 NVL72 page gives NVFP4 per superchip as 40 | 20 PFLOPS, sparse | dense, two
GPUs per superchip, and 16 TB/s of memory per superchip. NVIDIA's PTX ISA (tcgen05.mma.sp, sm_100a)
gives the sparse pattern for 4-bit e2m1: "pair-wise structured sparse at a granularity of 4:8", each
run of eight holding four zeros in two-wide pairs, with two 2-bit indices recording the kept pairs.
The review's N5 said "two in every four"; for this chip's 4-bit path the documented pattern is 4:8 in
pairs, so that is what is drawn.
"""
import json, math
from common import SRT, cell, ghost, txt, hd, ln, para, stamp, emit, emit_widget, width, f, n

PEAK, BW = 10e15, 8e12                      # one Blackwell GPU: dense 4-bit operations/s, bytes/s
SPARSE = 2 * PEAK                           # the advertised figure
RIDGE = PEAK / BW
OFFER = 2 * 2                               # two 4-bit weights a byte, a multiply and an add each
assert RIDGE == 1250 and OFFER == 4 and SPARSE / BW == 2500
H_PEAK, H_BW = 989e12, 3.35e12              # H100 at 16 bits, V1 Fig 126
H_RIDGE = H_PEAK / H_BW
assert round(H_RIDGE) == 295 and RIDGE / OFFER == 312.5
assert round(RIDGE / H_RIDGE, 1) == 4.2 and round(PEAK / H_PEAK) == 10 and round(BW / H_BW, 1) == 2.4


def o005():
    b = [hd(40, 46, "What the arithmetic needs from each byte")]
    E = [("10 × 10¹⁵ operations a second", 210, "u"), ("÷", 0, ""), ("8 × 10¹² bytes a second", 172, "u"),
         ("=", 0, ""), ("1,250 per byte", 120, "h")]
    x = 40
    for s, w, c in E:
        if w:
            assert width(s, "sub") + 24 <= w, s
            b.append(cell(x, 62, w, 36, c, rx=6, label=s))
            x += w
        else:
            b.append(txt(x + 15, 85, s, "sub2", "middle"))
            x += 30
    assert x <= 640
    b.append(txt(40, 122, "= (10 ÷ 8) × 10¹⁵⁻¹² = 1.25 × 10³. The seconds cancel, leaving operations per byte.", "sub2"))
    b.append(hd(40, 168, "What one byte offers each token that uses it"))
    flow = [("one byte", 100, "u"), ("two 4-bit weights", 150, "u"), ("2 × 2 = 4 operations", 160, "m")]
    x = 40
    for k, (s, w, c) in enumerate(flow):
        b.append(cell(x, 186, w, 34, c, rx=4, label=s))
        if k < 2:
            b.append(f'<line class="conn" x1="{x + w + 6}" y1="203" x2="{x + w + 34}" y2="203" marker-end="url(#arw)"/>')
        x += w + 40
    b.append(txt(40, 240, "each weight is multiplied and added into a running total: two operations", "sub2"))
    b.append(hd(40, 286, "The gap drawn as cells: 1,250 operations, 4 of them used"))
    COLS, ROWS, P, S = 50, 25, 10, 8
    assert COLS * ROWS == RIDGE
    x0, y0 = 90, 302
    lit = {(0, 0), (0, 1), (0, 2), (0, 3)}
    for r in range(ROWS):
        for c in range(COLS):
            b.append(f'<g class="{"m" if (r, c) in lit else "u"}"><rect x="{x0 + c * P}" y="{y0 + r * P}" '
                     f'width="{S}" height="{S}" rx="1"/></g>')
    yg = y0 + ROWS * P
    b.append(txt(x0, yg + 16, f"4 of 1,250 is {f(100 * OFFER / RIDGE, 2)}%: the share of the arithmetic one token keeps busy", "sub2"))
    body, yb = para(yg + 60, [
        "A Blackwell GPU in this rack does 10 quadrillion 4-bit operations a second: 10 × 10¹⁵, a one "
        "followed by sixteen zeros ({{fig:v01-o062}}). The rate is for 4-bit numbers. Narrower numbers "
        "run faster, so the same chip does fewer operations a second at 16 bits ({{fig:v02-o084}}).",
        "It pulls about 8 terabytes a second out of its own memory. Dividing one rate by the other "
        "cancels the seconds and leaves operations per byte ({{fig:v01-o066}}): 1,250. That is this "
        "chip's ridge ({{fig:v01-o126}}). A workload that does fewer operations per byte leaves the "
        "arithmetic waiting on memory.",
        "A byte holds two 4-bit weights, and each is multiplied and added once per token, which counts "
        "as two operations ({{fig:v01-o111}}). So a byte offers four operations to each token that uses "
        "it. To light all 1,250 cells, the same byte has to serve roughly 300 tokens before the chip "
        "lets it go.",
    ])
    emit("o005", stamp(SRT, "A Blackwell GPU in this rack carries out"),
         "The chip needs 1,250 operations from each byte, and a byte of 4-bit weights offers 4",
         yb + 30, b + [body],
         "That gap is the memory wall of the first episode, in new numbers. NVIDIA advertises twice "
         "this rate by counting a sparsity mode, which this workload does not use (next figure).")


def n05():
    b = [hd(40, 46, "Weights pruned for the sparse mode: in every run of eight, two pairs are zero")]
    zero = [(1, 3), (0, 1), (2, 3), (0, 2)]            # which pairs of each run are zero
    vals = [[0.4, -1.2, 0.7, 0.3], [0.2, -0.6, 1.4, -0.3], [0.8, -1.0, 0.5, 0.6], [-0.5, 0.9, -0.8, 1.1]]
    CW, CH, PG, GG = 44, 26, 3, 12
    x0, y0, RP = 40, 68, 38
    for r in range(4):
        y = y0 + r * RP
        x, k = x0, 0
        for pair in range(4):
            for e in range(2):
                if pair in zero[r]:
                    b.append(ghost(x, y, CW, CH, label="0"))
                else:
                    b.append(cell(x, y, CW, CH, "u", label=f(vals[r][k], 1)))
                    k += 1
                x += CW + (PG if e == 0 else GG)
        assert k == 4 and x - GG == x0 + 400
        kept = [p + 1 for p in range(4) if p not in zero[r]]
        b.append(txt(466, y + 11, "kept: " + ", ".join(f(v, 1) for v in vals[r]), "sub2"))
        b.append(txt(466, y + 26, f"from pairs {kept[0]} and {kept[1]} of 4", "sub2"))
    yb0 = y0 + 4 * RP
    b.append(txt(x0, yb0 + 8, "Stored: the 4 survivors of each run, and two 2-bit indices saying which pairs they came from.", "sub2"))
    b.append(hd(40, yb0 + 56, "What the advertised figure counts, to scale"))
    SC = 520 / SPARSE
    bars = [("done", PEAK, "u", "10 quadrillion operations a second"),
            ("counted", SPARSE, "h", "20 quadrillion: the skipped zeros counted too")]
    y = yb0 + 74
    for lab, v, c, s_ in bars:
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(cell(120, y, v * SC, 26, c, label=s_))
        assert width(s_, "sub") + 24 < v * SC
        y += 38
    body, yb = para(y + 34, [
        "The sparse mode works only on weights pruned to a fixed pattern. In every run of eight, four are "
        "zero, and the zeros come in pairs. The hardware stores just the four survivors, with two small "
        "indices that say which pairs they were, and skips the multiplications by zero.",
        "Skipping half the multiplications halves the time a matrix takes, and the advertised figure "
        "counts the skipped ones as if they had been done: 20 quadrillion operations a second instead of "
        f"10. Counted that way the ridge would sit at {n(SPARSE / BW)} instead of {n(RIDGE)}.",
        "This model's weights were not pruned to the pattern, so this workload gets the dense rate. It is "
        "the rate used from here on.",
    ])
    emit("n05", stamp(SRT, "second. NVIDIA advertises twice that"),
         "The advertised doubling counts weights pruned to zero, four in every eight", yb + 30, b + [body],
         "Twice the rate, on condition that half of every eight weights are zero, in pairs the hardware "
         "can find. A model that was not pruned for it gets the dense number. Weight values are "
         "illustrative.")


def n06():
    b = [hd(40, 46, "Operations one byte of weights performs, by how many tokens use it before it leaves")]
    X0, X1, TOP = 190, 610, 1300
    sc = (X1 - X0) / TOP
    rows = [(1, "read once, 1 token"), (64, "read once, 64 tokens"), (312, "read once, 312 tokens"),
            (313, "read once, 313 tokens")]
    y = 72
    for t, lab in rows:
        ops = OFFER * t
        b.append(txt(40, y + 18, lab, "cap"))
        w = max(ops * sc, 2)
        c = "m" if ops >= RIDGE else "u"
        if w > 150:
            b.append(cell(X0, y, w, 26, c, label=f"{n(ops)} operations"))
        else:
            b.append(cell(X0, y, w, 26, c))
            b.append(txt(X0 + w + 10, y + 18, f"{n(ops)} operation{'s' if ops != 1 else ''}", "sub2"))
        y += 40
    xr = X0 + RIDGE * sc
    b.append(f'<line class="mark xok" x1="{xr:.1f}" y1="64" x2="{xr:.1f}" y2="{y - 6}"/>')
    b.append(txt(xr, y + 12, "1,250, the ridge", "sub2", "middle"))
    assert OFFER * 312 < RIDGE < OFFER * 313
    body, yb = para(y + 58, [
        "Amortising means spreading one fixed cost over more work ({{fig:v01-o118}}). Reading a byte "
        "costs the same however many tokens use it, and each extra token that uses it before it leaves "
        "the chip adds four operations to what that one read bought.",
        f"1,250 ÷ 4 = {f(RIDGE / OFFER, 1)}, so the byte has to serve 313 tokens to pass the ridge: the "
        "roughly 300 tokens the chip needs. At 312 it falls two operations short.",
        "Those tokens can be other requests sharing the same step, which is batching ({{fig:v07-o003}}), "
        "or several positions of one request: a whole prompt in prefill, or drafted tokens in decode "
        "(Part 7).",
    ])
    emit("n06", stamp(SRT, "Getting to 1,250 means the same byte has"),
         "A byte reaches 1,250 only if 313 tokens use it before it is dropped", yb + 30, b + [body],
         "Bars to scale. Nothing about the byte changes from row to row; only the number of tokens "
         "sharing one read of it does.")


# ---- N7: the widget -----------------------------------------------------------------------------------
CHIPS = [{"name": "H100 at 16 bits", "peak": H_PEAK, "bw": H_BW, "k": 1, "cls": "u"},
         {"name": "Blackwell at 4 bits", "peak": PEAK, "bw": BW, "k": 4, "cls": "m"}]
BS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 296, 313, 512, 1024, 2048]
GEO = {"x0": 110, "x1": 620, "dx": 4, "y0": 56, "y1": 296, "lo": 12, "dy": 5}


def X(I):
    return GEO["x0"] + math.log10(I) / GEO["dx"] * (GEO["x1"] - GEO["x0"])


def Y(a):
    return GEO["y1"] - (math.log10(a) - GEO["lo"]) / GEO["dy"] * (GEO["y1"] - GEO["y0"])


def readout(c, B):
    """The sentence under the plot for one chip, exactly as the widget prints it."""
    I = B * c["k"]
    ridge = c["peak"] / c["bw"]
    pct = "100%" if I >= ridge else f(100 * I / ridge, 2) + "%"
    tail = "past its ridge" if I >= ridge else f(ridge / I, 1) + "× short of its ridge"
    return (f"{c['name']}: {n(B)} × {c['k']} = {n(I)} operation{'' if I == 1 else 's'} per byte, "
            f"{pct} of peak, {tail}")


assert readout(CHIPS[0], 1).endswith("295.2× short of its ridge")
assert readout(CHIPS[1], 1).endswith("312.5× short of its ridge")
assert "past" in readout(CHIPS[0], 296) and "past" not in readout(CHIPS[0], 295)
assert "past" in readout(CHIPS[1], 313) and "past" not in readout(CHIPS[1], 312)
assert readout(CHIPS[0], 64).split(", ")[1].startswith("21.68%") and readout(CHIPS[1], 64).split(", ")[1].startswith("20.48%")

N7_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const BS = __BS__, CH = __CH__, G = __G__;
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val');
  const q = s => fig.querySelector(s);
  const com = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fx = (v, d) => { const [i, f] = Math.abs(v).toFixed(d).split('.');
    return (v < 0 && +Math.abs(v).toFixed(d) !== 0 ? '−' : '') + com(i) + (f ? '.' + f : ''); };
  const X = I => G.x0 + Math.log10(I) / G.dx * (G.x1 - G.x0);
  const Y = a => G.y1 - (Math.log10(a) - G.lo) / G.dy * (G.y1 - G.y0);
  function draw() {
    const B = BS[+sl.value];
    val.textContent = com(String(B));
    CH.forEach((c, j) => {
      const I = B * c.k, ridge = c.peak / c.bw, att = Math.min(c.peak, c.bw * I);
      const pt = q(`[data-pt="${j}"]`);
      pt.setAttribute('cx', X(I).toFixed(1)); pt.setAttribute('cy', Y(att).toFixed(1));
      const pct = I >= ridge ? '100%' : fx(100 * I / ridge, 2) + '%';
      const tail = I >= ridge ? 'past its ridge' : fx(ridge / I, 1) + '× short of its ridge';
      q(`[data-r="${j}"]`).textContent =
        `${c.name}: ${com(String(B))} × ${c.k} = ${com(String(I))} operation${I === 1 ? '' : 's'} per byte, ${pct} of peak, ${tail}`;
    });
  }
  sl.addEventListener('input', draw);
  q('button').addEventListener('click', () => { sl.value = 0; draw(); });
  draw();
})();</script>"""


def n07():
    G = GEO
    s = [txt(G["x0"], G["y0"] - 26, "operations a second (log scale)", "sub2")]
    s.append(ln(G["x0"], G["y1"], G["x1"], G["y1"], "axis"))
    s.append(ln(G["x0"], G["y0"], G["x0"], G["y1"], "axis"))
    for e in range(0, 5):
        x = X(10 ** e)
        s.append(ln(x, G["y1"], x, G["y1"] + 4, "tick"))
        s.append(txt(x, G["y1"] + 18, n(10 ** e), "sub2", "middle"))
    for e in range(12, 18):
        y = Y(10 ** e)
        s.append(ln(G["x0"] - 4, y, G["x0"], y, "tick"))
        s.append(txt(G["x0"] - 8, y + 4, "10" + "".join("⁰¹²³⁴⁵⁶⁷⁸⁹"[int(d)] for d in str(e)), "sub2", "end"))
    s.append(txt((G["x0"] + G["x1"]) / 2, G["y1"] + 38, "operations per byte of weights read (log scale)", "sub2", "middle"))
    for j, c in enumerate(CHIPS):
        ridge = c["peak"] / c["bw"]
        pts = [(1, c["bw"]), (ridge, c["peak"]), (10 ** 4, c["peak"])]
        s.append(f'<polyline points="{" ".join(f"{X(i):.1f},{Y(a):.1f}" for i, a in pts)}" '
                 f'style="fill:none;stroke:var(--{c["cls"]});stroke-width:2"/>')
        s.append(f'<line class="mark" x1="{X(ridge):.1f}" y1="{G["y0"] + 6}" x2="{X(ridge):.1f}" y2="{Y(c["peak"]) - 6:.1f}"/>')
        s.append(txt(X(ridge), G["y0"] - 6, f"ridge {n(ridge)}", "sub2", "middle"))
        s.append(f'<g class="{c["cls"]}"><text class="sub" x="{G["x1"] - 2}" y="{Y(c["peak"]) - 9:.1f}" '
                 f'text-anchor="end">{c["name"]}</text></g>')
    B0 = BS[0]
    for j, c in enumerate(CHIPS):
        I = B0 * c["k"]
        att = min(c["peak"], c["bw"] * I)
        s.append(f'<circle data-pt="{j}" cx="{X(I):.1f}" cy="{Y(att):.1f}" r="5" fill="var(--paper)" '
                 f'stroke="var(--{c["cls"]})" stroke-width="2"/>')
    yr = G["y1"] + 70
    for j, c in enumerate(CHIPS):
        assert width(readout(c, 2048), "sub") < 600 and width(readout(c, 1), "sub") < 600
        s.append(f'<g class="{c["cls"]}"><text class="sub" x="40" y="{yr + j * 22}" data-r="{j}">{readout(c, B0)}</text></g>')
    body, yb = para(yr + 22 + 50, [
        "The first episode's chip, an H100 reading 16-bit weights, needs 295 operations per byte "
        "({{fig:v01-o126}}), and each byte offers one to each token ({{fig:v01-o116}}). Breaking even "
        "takes about 295 tokens per read. This chip needs 1,250, each byte offers 4, and breaking even "
        "takes 313.",
        "Peak arithmetic grew about tenfold and memory speed about 2.4 times, so the ridge rose 4.2 "
        "times; 4-bit weights made each byte worth 4 times as much. The two nearly cancel. Slide to 64 "
        "tokens and both chips reach about a fifth of their peak; near 300 both reach their ridge.",
        "Both rooflines come from the two rates alone, on logarithmic axes ({{fig:v01-o121}}): "
        "attainable = min(peak, bandwidth × intensity) ({{fig:v01-o123}}). The widget's arithmetic was "
        "checked against Python at every setting.",
    ])
    ctl = [f"<label>tokens sharing each read <input type='range' min='0' max='{len(BS) - 1}' step='1' "
           f"value='0'><span class='val'>{n(B0)}</span></label><button type='button'>Reset</button>"]
    js = (N7_JS.replace("__BS__", json.dumps(BS)).replace("__G__", json.dumps(GEO))
          .replace("__CH__", json.dumps([{k: c[k] for k in ("name", "peak", "bw", "k")} for c in CHIPS])))
    emit_widget("n07", stamp(SRT, "That gap is the memory wall, which we"),
                "A taller ridge and a richer byte leave the same gap: 295 tokens then, 313 now", ctl, s + [body],
                yb + 26,
                "The headline rates grew about tenfold and the gap a lone token leaves did not move. Every "
                "gain on the arithmetic side was matched by a ridge that rose to meet it.", js)


if __name__ == "__main__":
    for fn in (o005, n05, n06, n07):
        fn()
