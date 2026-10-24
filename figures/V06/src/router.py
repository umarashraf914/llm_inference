"""V6 Part 6, inside the router: P15–P20 of plans/depth_pass/V06_review.md.

One token, four experts, carried through the router with real numbers: four dot products, softmax,
top-2, renormalise, blend; then the router's cost, then the sigmoid variant. Every number below is
computed here, and the claims in the prose are asserted, so the figures cannot drift from the maths.

  python3 figures/V06/src/router.py      writes figures/V06/items/p15.html … p20.html
"""
import math, sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / ".claude/skills/srt-figure-atlas/scripts"))
from atlas import box, cell, ghost, txt, hd, ln, prose, item, stamp  # noqa: E402

SRT = ROOT / "transcripts/V06_Mixture_of_Experts.srt"
OUT = ROOT / "figures/V06/items"

# ---- the worked example -------------------------------------------------------------------------
x = [1.0, -0.5, 2.0, 0.5]                       # the token's hidden vector
W = [[0.5, 0, 1, -0.5],                         # one row of the router per expert
     [-1, 0.5, 0, 1],
     [0, -1, 0.5, 0.5],
     [1, 1, -0.5, 0]]
dot = lambda a, b: sum(p * q for p, q in zip(a, b))
z = [dot(w, x) for w in W]
zmax = max(z)
ex = [math.exp(v - zmax) for v in z]
tot = sum(ex)
share = [v / tot for v in ex]
top = sorted(range(4), key=lambda i: -share[i])[:2]
kept = sum(share[i] for i in top)
gate = {i: share[i] / kept for i in top}
E = {0: [0.8, -0.2, 0.4, 0.0], 2: [0.1, 0.6, -0.3, 0.5]}   # illustrative expert outputs
y_out = [gate[0] * a + gate[2] * b for a, b in zip(E[0], E[2])]
sig = [1 / (1 + math.exp(-v)) for v in z]
stop = sorted(range(4), key=lambda i: -sig[i])[:2]
sgate = {i: sig[i] / sum(sig[j] for j in stop) for i in stop}

assert z == [2.25, -0.75, 1.75, -0.5]
assert top == [0, 2] and stop == [0, 2]
assert abs(sum(share) - 1) < 1e-12 and abs(sum(gate.values()) - 1) < 1e-12
assert abs(share[0] / share[2] - math.exp(z[0] - z[2])) < 1e-12        # the ratio is e^(gap)


def f(v, d=2):
    """A number as printed: fixed decimals, a real minus sign. Exact halves round away from zero,
    as JavaScript's toFixed does, so the widget and the static figures print the same digits."""
    q = Decimal(abs(v)).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP)
    return ("−" if v < 0 else "") + f"{q:.{d}f}"


def f1(v):
    """Short form for the router's inputs and weights: 0.5, 0, 1.0 as written."""
    v = v + 0.0                                   # turn −0.0 into 0.0
    s = f"{v:g}" if v != int(v) or abs(v) < 1 else f"{v:.1f}"
    return s.replace("-", "−")


def emit(name, ts, title, h, body, caption, cls=None):
    (OUT / f"{name}.html").write_text(item(ts, title, h, body, caption, cls), encoding="utf-8")
    print(name, ts, title)


# ---- P15: the scores are four dot products -------------------------------------------------------
def p15():
    b = [hd(40, 46, "Each expert owns one row; its score is that row times the token's vector")]
    X0, CW, GAP = 170, 48, 8
    col = [X0 + k * (CW + GAP) for k in range(4)]
    b.append(txt(40, 92, "token's vector", "cap"))
    for k in range(4):
        b.append(cell(col[k], 72, CW, 30, "u", label=f1(x[k])))
    b.append(txt(402, 92, "multiply each pair, then add", "sub2"))
    b.append(txt(603, 92, "score", "sub2", "middle"))
    for r in range(4):
        y = 124 + r * 48
        b.append(txt(40, y + 20, f"expert {r + 1}'s row", "cap"))
        for k in range(4):
            b.append(cell(col[k], y, CW, 30, "u", label=f1(W[r][k])))
        terms = [W[r][k] * x[k] for k in range(4)]
        s = f1(terms[0])
        for t in terms[1:]:
            s += (" − " if t < 0 else " + ") + f1(abs(t))
        b.append(txt(402, y + 20, s, "sub2"))
        b.append(txt(560, y + 20, "=", "sub2"))
        b.append(cell(576, y, 54, 30, "m" if r in top else "u", label=f(z[r])))
    body, yb = prose(352, [
        "Each expert owns one row of the router's matrix, four numbers here, as long as the token's "
        "vector. Line the row up under the vector, multiply each pair of entries and add the four "
        "products. That sum is the expert's score, and the operation is a dot product "
        "({{fig:v03-o014}}).",
        "Stacked, the four rows are a 4 × 4 matrix, and the four dot products are one matrix–vector "
        "multiply ({{fig:v01-o085}}). A real router is the same shape, only bigger: DeepSeek V3 "
        "scores 256 experts against a vector of 7,168 numbers.",
        "A high score means the token's vector points the way that expert's row points. Expert 1 "
        f"scores {f(z[0])} because both it and the token put their largest number in third place.",
    ])
    assert max(range(4), key=lambda k: W[0][k]) == max(range(4), key=lambda k: x[k]) == 2
    emit("p15", stamp(SRT, "one matrix, turns that vector into one raw"),
         "The router's scores are four dot products", yb + 32, b + [body],
         "Nothing in the router knows any words. It measures how well one vector lines up with four "
         "directions, and everything after this follows from those four numbers.")


# ---- P16: softmax turns the scores into shares ---------------------------------------------------
def p16():
    b = [hd(40, 46, f"Subtract the largest score, raise e to each, divide by the total")]
    C = [40, 150, 232, 318, 400]          # expert, score, minus max, e to that, share bar
    SC = 230                              # px for a share of 1.0
    heads = ["score", f"minus {f(zmax)}", "e to that", f"share of {tot:.3f}"]
    for c, s in zip(C[1:], heads):
        b.append(txt(c, 86, s, "sub2"))
    for r in range(4):
        y = 102 + r * 46
        b.append(txt(C[0], y + 20, f"expert {r + 1}", "cap"))
        b.append(txt(C[1], y + 20, f(z[r]), "sub2"))
        b.append(txt(C[2], y + 20, f(z[r] - zmax), "sub2"))
        b.append(txt(C[3], y + 20, f(ex[r], 3), "sub2"))
        w = share[r] * SC
        b.append(cell(C[4], y + 2, max(w, 2), 28, "m" if r in top else "u"))
        b.append(txt(C[4] + max(w, 2) + 10, y + 20, f(share[r], 3), "sub2"))
    yt = 102 + 4 * 46 + 6
    b.append(ln(C[3], yt, C[3] + 52, yt, "tick"))
    b.append(txt(C[3], yt + 20, f"{tot:.3f}", "sub2"))
    b.append(txt(C[4], yt + 20, f"{sum(share):.3f}", "sub2"))
    b.append(txt(C[2], yt + 20, "total", "sub2"))
    r13 = share[0] / share[2]
    body, yb = prose(yt + 70, [
        "Raising e to each number makes every value positive, and dividing by their total turns them "
        "into shares that add to exactly one. That is softmax, the same step that turns a model's "
        "word scores into probabilities ({{fig:v01-o009}}).",
        f"Subtracting the largest score first changes nothing in the answer. It divides every e-value "
        f"by the same e^{f(zmax)}, and that factor cancels when each is divided by the total. It only "
        "keeps the numbers small enough that a computer cannot overflow ({{fig:v03-o025}}).",
        f"Expert 1 leads expert 3 by only {f(z[0] - z[2], 1)} in score, yet takes {f(share[0])} of "
        f"the budget to {f(share[2])}. The ratio of their shares is e^{f(z[0] - z[2], 1)} = "
        f"{r13:.2f}: a half-point lead becomes a {round((r13 - 1) * 100)}% larger share.",
    ])
    emit("p16", stamp(SRT, "Then, a softmax turns those raw scores"),
         "Softmax turns the four scores into shares", yb + 32, b + [body],
         "Bars drawn to scale. The exponential rewards a lead: small gaps in score become large gaps "
         "in share, which is what makes the router's choice decisive.")


# ---- P17: keep two, renormalise, blend ----------------------------------------------------------
def p17():
    b = [hd(40, 46, "Keep the two largest shares, drop the rest, rescale to one")]
    SC, X0 = 400, 150
    for r in range(4):
        y = 70 + r * 40
        b.append(txt(40, y + 18, f"expert {r + 1}", "cap"))
        w = max(share[r] * SC, 2)
        if r in top:
            b.append(cell(X0, y + 2, w, 26, "m"))
            b.append(txt(X0 + w + 10, y + 18, f"{f(share[r], 3)}  kept", "sub2"))
        else:
            b.append(ghost(X0, y + 2, w, 26))
            b.append(txt(X0 + w + 10, y + 18, f"{f(share[r], 3)}  dropped: never runs", "sub2"))
    y = 70 + 4 * 40 + 10
    b.append(txt(40, y + 14, f"kept total {f(share[0], 3)} + {f(share[2], 3)} = {f(kept, 3)}; divide each by it", "sub2"))
    for k, r in enumerate(top):
        yy = y + 30 + k * 40
        b.append(txt(40, yy + 18, f"gate {r + 1}", "cap"))
        w = gate[r] * SC
        b.append(cell(X0, yy + 2, w, 26, "m"))
        b.append(txt(X0 + w + 10, yy + 18, f(gate[r], 3), "sub2"))
    y2 = y + 30 + 2 * 40 + 34
    b.append(hd(40, y2, "The gates weight the two experts' answers"))
    CW, GAP, X1 = 56, 6, 250
    rows = [("expert 1's output", E[0], "u", f"× {f(gate[0], 3)}"),
            ("expert 3's output", E[2], "u", f"× {f(gate[2], 3)}"),
            ("layer output", y_out, "m", "the gated sum")]
    for k, (lab, v, c, note) in enumerate(rows):
        yy = y2 + 20 + k * 44
        if k == 2:
            b.append(ln(X1, yy - 7, X1 + 4 * CW + 3 * GAP, yy - 7, "tick"))
        b.append(txt(40, yy + 20, lab, "cap"))
        for j in range(4):
            b.append(cell(X1 + j * (CW + GAP), yy + 2, CW, 28, c, label=f(v[j])))
        b.append(txt(X1 + 4 * CW + 3 * GAP + 16, yy + 20, note, "sub2"))
    yb0 = y2 + 20 + 3 * 44 + 40
    body, yb = prose(yb0, [
        "Experts 2 and 4 are switched off for this token: they are never run, which is the whole "
        f"saving. The two survivors' shares add to {f(kept, 3)}, so each is divided by {f(kept, 3)} "
        "to make the gates add back up to one.",
        "Each chosen expert is a full feed-forward network that returns a vector the same length as "
        f"the token's. The layer's output is the gated sum: {f(gate[0], 3)} of expert 1's answer plus "
        f"{f(gate[2], 3)} of expert 3's. The expert outputs here are illustrative; the arithmetic on "
        "them is exact.",
    ])
    emit("p17", stamp(SRT, "Finally, top k keeps"), "Keep two, renormalise, blend", yb + 32,
         b + [body],
         "The same two numbers do both jobs: they chose which experts run, and they set how much each "
         "one's answer counts.")


# ---- P19: the router's cost ----------------------------------------------------------------------
def p19():
    d, n_routed, d_ff, active = 7168, 256, 2048, 8 + 1        # DeepSeek V3: hidden, experts, expert width, 8 routed + 1 shared
    router_w = n_routed * d
    router_ops = 2 * router_w
    expert_w = 3 * d * d_ff                                    # gate, up and down matrices
    expert_ops = 2 * active * expert_w
    held = (n_routed + 1) * expert_w
    pct, pct_held = 100 * router_ops / expert_ops, 100 * router_w / held
    assert round(router_w / 1e6, 2) == 1.84 and round(expert_ops / 1e6) == 793 and pct < 0.5
    b = [hd(40, 46, "Operations per token in one DeepSeek V3 MoE layer, drawn to scale")]
    SC = 520 / expert_ops
    b.append(txt(40, 92, "9 experts run", "cap"))
    b.append(cell(150, 74, expert_ops * SC, 28, "m"))
    b.append(txt(150 + expert_ops * SC, 120, f"{expert_ops / 1e6:,.0f} million", "sub2", "end"))
    b.append(txt(40, 160, "the router", "cap"))
    b.append(cell(150, 142, max(router_ops * SC, 2), 28, "s"))
    b.append(txt(150 + 12, 160, f"{router_ops / 1e6:.2f} million, {pct:.2f}% of the expert work", "sub2"))
    body, yb = prose(232, [
        f"The router is {n_routed} rows of {d:,} numbers, {router_w / 1e6:.2f} million weights. Each is "
        f"used once per token, a multiply and an add, so {router_ops / 1e6:.2f} million operations "
        "({{fig:v01-o111}}).",
        f"Each expert is three matrices of {d:,} × {d_ff:,}, {expert_w / 1e6:.1f} million weights. Nine "
        f"run per token, eight chosen and one shared, so {expert_ops / 1e6:,.0f} million operations. "
        f"The router is {pct:.2f}% of that, and {pct_held:.3f}% of the weights the layer stores.",
    ])
    emit("p19", stamp(SRT, "notice how little work this took"),
         "The router costs under half a percent of the expert work", yb + 32, b + [body],
         "Deciding costs a rounding error next to doing, which is why the model can afford to run the "
         "router on every token at every layer.")


# ---- P20: the sigmoid variant --------------------------------------------------------------------
def p20():
    b = [hd(40, 46, "σ(z) = 1 / (1 + e^−z) squashes each score into 0 to 1, on its own")]
    L, R, T, B = 60, 320, 76, 216                     # the curve's box; z from −4 to 4
    zx = lambda v: L + (v + 4) / 8 * (R - L)
    sy = lambda s: B - s * (B - T)
    b.append(ln(L, B, R, B, "axis"))
    b.append(ln(L, T, L, B, "axis"))
    for v in (-4, -2, 0, 2, 4):
        b.append(ln(zx(v), B, zx(v), B + 4, "tick"))
        b.append(txt(zx(v), B + 18, f"{v}".replace("-", "−"), "sub2", "middle"))
    for s in (0, 0.5, 1):
        b.append(txt(L - 8, sy(s) + 4, f"{s:g}", "sub2", "end"))
    pts = " ".join(f"{zx(v):.1f},{sy(1 / (1 + math.exp(-v))):.1f}" for v in [i / 10 for i in range(-40, 41)])
    b.append(f'<polyline class="pl-m" points="{pts}"/>')
    for r in range(4):
        b.append(f'<circle cx="{zx(z[r]):.1f}" cy="{sy(sig[r]):.1f}" r="4" fill="var(--paper)" stroke="var(--h)" stroke-width="1.5"/>')
    # the curve rises left to right, so above-left and below-right of a point are empty
    b.append(txt(zx(z[0]) - 7, sy(sig[0]) - 9, "1", "sub2 halo", "end"))
    b.append(txt(zx(z[2]) + 7, sy(sig[2]) + 17, "3", "sub2 halo"))
    b.append(txt(zx(z[3]) - 7, sy(sig[3]) - 9, "4", "sub2 halo", "end"))
    b.append(txt(zx(z[1]) + 7, sy(sig[1]) + 17, "2", "sub2 halo"))
    b.append(txt((L + R) / 2, B + 38, "score z", "sub2", "middle"))
    SC, X0 = 150, 470
    b.append(txt(X0, 72, "sigmoid of each score", "sub2"))
    for r in range(4):
        y = 84 + r * 34
        b.append(txt(X0 - 14, y + 17, f"expert {r + 1}", "cap", "end"))
        b.append(cell(X0, y, sig[r] * SC, 24, "m" if r in stop else "u"))
        b.append(txt(X0 + sig[r] * SC + 8, y + 17, f(sig[r], 3), "sub2"))
    b.append(txt(X0, 84 + 4 * 34 + 14, f"sum {sum(sig):.3f}: no shared budget", "sub2"))
    yg = 290
    b.append(hd(40, yg, "The gates after choosing the same two experts, drawn to scale"))
    for k, (lab, g) in enumerate([("softmax", gate), ("sigmoid", sgate)]):
        y = yg + 18 + k * 40
        b.append(txt(40, y + 18, lab, "cap"))
        xx = 150
        for i in top:
            w = g[i] * 420
            b.append(cell(xx, y, w, 26, "m", label=f"expert {i + 1}  {f(g[i], 3)}"))
            xx += w
    body, yb = prose(yg + 18 + 2 * 40 + 40, [
        f"Unlike softmax, nothing is divided by a shared total, so the four values need not add to one; "
        f"here they add to {sum(sig):.3f}. Raising one expert's score leaves the others where they were.",
        f"Selection is unchanged: the two largest are still experts 1 and 3. Only after choosing are the "
        f"survivors divided by their sum, {f(sig[0], 3)} + {f(sig[2], 3)}, giving gates of "
        f"{f(sgate[0], 3)} and {f(sgate[2], 3)}. DeepSeek V3 scores its experts this way: score, select, "
        "renormalise, as before.",
    ])
    emit("p20", stamp(SRT, "compute their affinity scores with a sigmoid"),
         "A sigmoid scores each expert on its own", yb + 32, b + [body],
         f"Without a shared budget, two strong experts can both be confident, so the gates come out "
         f"flatter: {f(sgate[0], 2)} and {f(sgate[2], 2)} here, against softmax's {f(gate[0], 2)} and "
         f"{f(gate[2], 2)}.")


# ---- P18: the widget ------------------------------------------------------------------------------
E_ALL = [E[0], [-0.4, 0.3, 0.6, -0.1], E[2], [0.2, -0.5, 0.1, 0.7]]   # illustrative; 1 and 3 as in P17


def route(xv, fn="softmax"):
    """The router as the widget runs it: scores, shares, the top two, gates, the layer's output."""
    zz = [dot(w, xv) for w in W]
    if fn == "softmax":
        m = max(zz)
        e = [math.exp(v - m) for v in zz]
        pp = [v / sum(e) for v in e]
    else:
        pp = [1 / (1 + math.exp(-v)) for v in zz]
    tp = sorted(range(4), key=lambda i: -pp[i])[:2]
    gg = [pp[i] / sum(pp[j] for j in tp) if i in tp else 0 for i in range(4)]
    yy = [sum(gg[i] * E_ALL[i][k] for i in range(4)) for k in range(4)]
    return zz, pp, tp, gg, yy


WIDGET_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const W = __W__, E = __E__, X0 = __X0__, XB = __XB__, SC = __SC__;
  const sl = [...fig.querySelectorAll('input[type=range]')], val = [...fig.querySelectorAll('.val')];
  const rad = [...fig.querySelectorAll('input[type=radio]')], q = s => fig.querySelector(s);
  const fmt = (v, d = 2) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
  function draw() {
    const x = sl.map(s => +s.value), sig = rad[1].checked;
    x.forEach((v, i) => val[i].textContent = fmt(v));
    const z = W.map(w => w.reduce((a, wk, k) => a + wk * x[k], 0));
    let p;
    if (sig) p = z.map(v => 1 / (1 + Math.exp(-v)));
    else { const m = Math.max(...z), e = z.map(v => Math.exp(v - m)), t = e.reduce((a, b) => a + b);
           p = e.map(v => v / t); }
    const top = [0, 1, 2, 3].sort((a, b) => p[b] - p[a]).slice(0, 2);
    const kept = top.reduce((a, i) => a + p[i], 0);
    const g = [0, 1, 2, 3].map(i => top.includes(i) ? p[i] / kept : 0);
    q('[data-head]').textContent = sig ? 'sigmoid of the score' : 'softmax share';
    for (let r = 0; r < 4; r++) {
      const w = Math.max(p[r] * SC, 2), bar = q(`[data-bar="${r}"]`), t = q(`[data-p="${r}"]`);
      q(`[data-z="${r}"]`).textContent = fmt(z[r]);
      bar.setAttribute('width', w.toFixed(1));
      bar.parentNode.setAttribute('class', top.includes(r) ? 'm' : 'u');
      t.textContent = fmt(p[r], 3); t.setAttribute('x', (XB + w + 10).toFixed(1));
      q(`[data-g="${r}"]`).textContent = top.includes(r) ? fmt(g[r], 3) : '—';
    }
    for (let k = 0; k < 4; k++)
      q(`[data-y="${k}"]`).textContent = fmt(top.reduce((a, i) => a + g[i] * E[i][k], 0));
  }
  sl.forEach(s => s.addEventListener('input', draw));
  rad.forEach(r => r.addEventListener('change', draw));
  q('button').addEventListener('click', () => { sl.forEach((s, i) => s.value = X0[i]); rad[0].checked = true; draw(); });
  draw();
})();</script>"""


def p18():
    import json
    XB, SC = 230, 250
    zz, pp, tp, gg, yy = route(x)
    assert tp == top and all(abs(a - b) < 1e-12 for a, b in zip(yy, y_out))   # the defaults are P15–P17
    # claims made in the prose, checked
    assert route([-2, -0.5, 2, 0.5])[2] == [1, 2]
    grid = [v / 4 for v in range(-8, 9)]
    for a in grid:
        for bb in grid:
            for c in grid:
                for d in grid:
                    s1, s2 = route([a, bb, c, d]), route([a, bb, c, d], "sigmoid")
                    assert set(s1[2]) == set(s2[2])
                    i, j = s1[2]
                    assert abs(s2[3][i] - s2[3][j]) <= abs(s1[3][i] - s1[3][j]) + 1e-12
    s = [hd(40, 34, "Scores, shares and the top two, recomputed as you move the token")]
    s.append(txt(150, 62, "score", "sub2"))
    s.append(f'<text class="sub2" x="{XB}" y="62" data-head="">softmax share</text>')
    s.append(txt(600, 62, "gate", "sub2"))
    for r in range(4):
        y = 74 + r * 40
        w = max(pp[r] * SC, 2)
        s.append(txt(40, y + 18, f"expert {r + 1}", "cap"))
        s.append(f'<text class="sub2" x="150" y="{y + 18}" data-z="{r}">{f(zz[r])}</text>')
        s.append(f'<g class="{"m" if r in tp else "u"}"><rect x="{XB}" y="{y}" width="{w:.1f}" height="26" rx="3" data-bar="{r}"/></g>')
        s.append(f'<text class="sub2" x="{XB + w + 10:.1f}" y="{y + 18}" data-p="{r}">{f(pp[r], 3)}</text>')
        s.append(f'<text class="sub2" x="600" y="{y + 18}" data-g="{r}">{f(gg[r], 3) if r in tp else "—"}</text>')
    yo = 74 + 4 * 40 + 22
    s.append(txt(40, yo + 19, "layer output", "cap"))
    for k in range(4):
        cx = XB + k * 62
        s.append(f'<g class="m"><rect x="{cx}" y="{yo}" width="56" height="28" rx="3"/>'
                 f'<text class="sub" x="{cx + 28}" y="{yo + 14}" text-anchor="middle" '
                 f'dominant-baseline="central" data-y="{k}">{f(yy[k])}</text></g>')
    body, yb = prose(yo + 28 + 44, [
        "Each expert's row rewards some entries of the token's vector and penalises others: expert 1 "
        "leans on the third entry, expert 4 on the first two. Drag x₁ down to −2 and expert 1 drops out "
        "of the top two; expert 2 takes its place.",
        "Switch to the sigmoid and the bars stop competing for one budget. The same two experts always "
        "win, because both functions rank experts by score, but their gates come out closer together.",
        "The expert outputs are illustrative. The arithmetic is the same as in the figures above, and "
        "was checked against them in Python.",
    ])
    title = "Move the token and watch the router change its mind"
    ctl = "".join(
        f"<label>x{'₁₂₃₄'[k]} <input type='range' min='-2' max='2' step='0.25' value='{x[k]:g}'>"
        f"<span class='val'>{f(x[k])}</span></label>" for k in range(4))
    opts = ("<label class='opt'><input type='radio' name='v06-p18-fn' value='softmax' checked> softmax</label>"
            "<label class='opt'><input type='radio' name='v06-p18-fn' value='sigmoid'> sigmoid</label>"
            "<button type='button'>Reset</button>")
    js = (WIDGET_JS.replace("__W__", json.dumps(W)).replace("__E__", json.dumps(E_ALL))
          .replace("__X0__", json.dumps(x)).replace("__XB__", str(XB)).replace("__SC__", str(SC)))
    html_ = (f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; "
             f"{stamp(SRT, 'The numbers that selected the experts now blend')}</div><h3>{title}</h3>"
             f"<div class='wg'><div class='ctl'>{ctl}</div><div class='ctl'>{opts}</div>"
             f"<svg viewBox='0 0 680 {yb + 26}' role='img'><title>{title}</title>{''.join(s)}{body}</svg></div>"
             "<figcaption>Four dot products, one squashing function, a cut to two and a rescale: that is the "
             "whole router. Move any entry and every later number follows.</figcaption>"
             f"{js}</figure>")
    (OUT / "p18.html").write_text(html_, encoding="utf-8")
    print("p18", title)


if __name__ == "__main__":
    for fn in (p15, p16, p17, p18, p19, p20):
        fn()
