"""V6 Part 9, routing and its failure mode: Fig 16 (o016) redrawn as the overview, then P24 (token
choice against expert choice on one grid), P25 (causality), P26 (rich get richer, a widget) and P27
(a layer waits for its busiest GPU) of plans/depth_pass/V06_review.md.

Source for expert choice: Zhou et al. 2022 (arXiv 2202.09368), eq. 1: capacity k = n x c / e, and §6:
the method "takes in the past and future tokens to perform the top-k selection".

  python3 figures/V06/src/routing.py      writes o016, p24, p25, p26, p27 in figures/V06/items/
"""
import json, math
from common import (at, box, cell, dashed, emit, emit_html, f, hd, ln, n, nb, prose, rect, txt)

# ---- the grid: eight tokens' router shares over four experts (each row adds to one) ------------------
G = [[.45, .30, .05, .20], [.42, .05, .30, .23], [.38, .17, .05, .40], [.50, .25, .15, .10],
     [.35, .18, .27, .20], [.30, .10, .35, .25], [.05, .40, .30, .25], [.10, .27, .28, .35]]
T, E, K = 8, 4, 2
CAP = T * K // E                                            # expert choice capacity, n x c / e with c = K
tc = [sorted(range(E), key=lambda j: -r[j])[:K] for r in G]                    # each row's top two
ec = [sorted(range(T), key=lambda i: -G[i][j])[:CAP] for j in range(E)]        # each column's top four
loads = [sum(j in t for t in tc) for j in range(E)]
per_token = [sum(i in c for c in ec) for i in range(T)]
assert all(abs(sum(r) - 1) < 1e-9 for r in G)
assert loads == [6, 3, 5, 2] and CAP == 4
assert per_token == [2, 2, 2, 2, 0, 2, 3, 3]
assert all(sorted(r, reverse=True)[K - 1] > sorted(r, reverse=True)[K] for r in G)          # no ties at a cut
assert all(sorted(c, reverse=True)[CAP - 1] > sorted(c, reverse=True)[CAP]
           for c in [[G[i][j] for i in range(T)] for j in range(E)])


def lab(v):
    return f"{v:.2f}"[1:]                               # .45


def grid(b, x0, y0, chosen, rows=range(T), ghost_rows=()):
    """The score grid: one row per token, one column per expert; chosen cells in amber."""
    CW, CH, G_ = 44, 22, 4
    for j in range(E):
        b.append(txt(x0 + j * (CW + G_) + CW / 2, y0 - 8, f"E{j + 1}", "sub2", "middle"))
    for i in range(T):
        y = y0 + i * (CH + G_)
        b.append(txt(x0 - 30, y + 16, f"t{i + 1}", "cap"))
        for j in range(E):
            x = x0 + j * (CW + G_)
            if i in ghost_rows:
                b.append(dashed(x, y, CW, CH))
            elif i in rows:
                b.append(cell(x, y, CW, CH, "m" if (i, j) in chosen else "u", label=lab(G[i][j])))
    return y0 + T * (CH + G_) - G_


# ---- Fig 16, the overview ---------------------------------------------------------------------------
def o016():
    b = [box(40, 55, 285, 78, "s", "Token choice", "each token picks its top K,", "experts take what arrives")]
    b.append(box(368, 55, 272, 78, "u", "Expert choice", "each expert picks its top C tokens,", "up to a fixed capacity"))
    b.append(box(40, 168, 285, 66, "u", "Gentle", "a token nobody picks is skipped"))
    b.append(box(368, 168, 272, 66, "h", "Fatal", "ranking needs the whole sequence"))
    body, y = prose(280, [
        "Nearly every deployed model routes by token choice, and nothing in it promises balance: one "
        "expert can be flooded while another sits idle. In 2022 Zhou and colleagues turned it around. "
        "With expert choice each expert takes a fixed number of tokens, so the load is balanced by "
        "construction and overload is impossible.",
        "So why doesn't everyone route that way? There are two problems, one gentle and one fatal, and "
        "the next two figures work both on real numbers.",
    ])
    emit("o016", at("Everything so far has assumed the token does the choosing"),
         "Two ways to route, and why decoding can use only one", y + 32, b + [body],
         "Causality rules out the balanced option for decoding. The same constraint reappears in how "
         "balance is enforced instead.")


def p24():
    b = [hd(40, 46, "One grid of router shares, rows are tokens, routed two ways")]
    xa, xb, y0 = 80, 390, 98
    b.append(txt(xa - 30, 72, "token choice: each row keeps its top two", "sub2"))
    b.append(txt(xb - 30, 72, f"expert choice: each column keeps its top {CAP}", "sub2"))
    bot = grid(b, xa, y0, {(i, j) for i in range(T) for j in tc[i]})
    grid(b, xb, y0, {(i, j) for j in range(E) for i in ec[j]})
    CW, G_ = 44, 4
    for j in range(E):                                       # what each expert gets under token choice
        cl = "h" if loads[j] > CAP else ("u" if loads[j] == CAP else "s")
        b.append(cell(xa + j * (CW + G_), bot + 10, CW, 22, cl, label=str(loads[j])))
    b.append(txt(xa, bot + 50, f"tokens each expert gets; a fair share is {CAP}", "sub2"))
    for i in range(T):                                       # what each token gets under expert choice
        y = y0 + i * 26
        cl = "h" if per_token[i] == 0 else ("m" if per_token[i] > K else "u")
        b.append(cell(xb + 4 * (CW + G_) + 8, y, 26, 22, cl, label=str(per_token[i])))
    b.append(txt(xb + 4 * (CW + G_) + 21, y0 - 8, "gets", "sub2", "middle"))
    b.append(txt(xb, bot + 26, "every expert gets exactly four;", "sub2"))
    b.append(txt(xb, bot + 46, "the last column counts each token's experts", "sub2"))
    body, y = prose(bot + 98, [
        "Each row is one token's router shares over four experts, adding to one. Token choice lets every "
        f"row keep its two largest. Expert 1 lands in {loads[0]} rows' top two and expert 4 in only "
        f"{loads[3]}, against a fair share of {nb(f'8 × 2 / 4 = {CAP}')}. Nothing in the rule looks at the "
        "columns, so nothing evens them out.",
        f"Expert choice gives each expert a capacity, here {nb(f'8 × 2 / 4 = {CAP}')} tokens, and lets every "
        "column keep its four largest. Every expert is exactly full. But now nothing looks at the rows: "
        "t5 is in no column's top four and skips the layer, while t7 and t8 get three experts each.",
    ])
    emit("p24", at("In expert choice routing"), "Token choice and expert choice on the same eight tokens",
         y + 32, b + [body],
         "Token choice balances the tokens and not the experts; expert choice balances the experts and "
         "not the tokens. Somebody's count comes out uneven either way.")


def p25():
    made = 3                                                  # tokens generated so far
    col = [G[i][0] for i in range(T)]
    rank_t1 = sorted(range(T), key=lambda i: -col[i]).index(0) + 1
    above = [i for i in range(1, T) if col[i] > col[0]]       # later tokens that beat t1 in expert 1's column
    assert rank_t1 == 2 and above == [3] and ec[0] == [3, 0, 1, 2]   # only t4's .50; CAP of them would push t1 out
    b = [hd(40, 46, "The same grid during decoding, when only three tokens exist")]
    x0, y0 = 80, 98
    b.append(txt(x0 - 30, 72, "t1 to t3 written; t4 to t8 not yet generated", "sub2"))
    bot = grid(b, x0, y0, {(i, 0) for i in range(made)}, rows=range(made), ghost_rows=range(made, T))
    tx = 330
    notes = [
        "t1 reaches this layer now, and must be routed now.",
        "Expert choice asks expert 1 to rank its whole column,",
        "and that column is five scores short.",
        "",
        f"With all eight written, t1 ranks second in it: only",
        f"t4's {lab(col[3])} beats it. Any {CAP} later tokens above {lab(col[0])}",
        f"would have pushed it out of the top {CAP}. At decode",
        "there is no knowing which way it will go.",
    ]
    for k, s in enumerate(notes):
        if s:
            b.append(txt(tx, y0 + 16 + k * 22, s, "sub2"))
    body, y = prose(bot + 60, [
        "A decoder writes one token at a time, and each token passes through every layer before the next "
        "one exists ({{fig:v01-o110}}). When t1 is routed, t2 to t8 are not yet text.",
        "Attention already obeys the rule that follows: a token may look back, never forward "
        "({{fig:v03-o020}}). Token choice obeys it too, since each row decides alone. Expert choice breaks "
        "it, because a rank depends on every score in the column, including the scores of tokens that do "
        "not exist yet.",
    ])
    emit("p25", at("The fatal one is causality"), "To rank its column, an expert needs tokens that do not exist yet",
         y + 32, b + [body],
         "This is why production decoding sticks with token choice and lives with uneven traffic: a router "
         "that needs to see the future is no use to a model that writes one token at a time.")


# ---- P26: rich get richer, simulated (a widget) -------------------------------------------------------
LUCK = [0.01, -0.04, 0.08, -0.01, 0.02, -0.08, 0.04, -0.02]     # starting scores: small differences, by luck
ETA, STEPS = 0.15, 200                                          # feedback per step; steps simulated


def collapse(push):
    """Each step: shares by softmax of the scores; each score rises by ETA x its share (more traffic, more
    updates, more skill) and falls by push x (share - 1/8) (the balancing push)."""
    z, hist = list(LUCK), []
    for _ in range(STEPS + 1):
        m = max(z)
        e = [math.exp(v - m) for v in z]
        s = sum(e)
        p = [v / s for v in e]
        hist.append(p)
        z = [zi + ETA * pi - push * (pi - 1 / 8) for zi, pi in zip(z, p)]
    return hist


LEAD = max(range(8), key=lambda i: LUCK[i])
LIMIT = 5000                                                    # how far to look for a takeover


def takeover(push):
    """The first step at which one expert carries over 90% of the traffic, or None within LIMIT."""
    z = list(LUCK)
    for t in range(LIMIT + 1):
        m = max(z)
        e = [math.exp(v - m) for v in z]
        s = sum(e)
        p = [v / s for v in e]
        if max(p) > 0.9:
            return t
        z = [zi + ETA * pi - push * (pi - 1 / 8) for zi, pi in zip(z, p)]
    return None


def takeover_text(push):
    st = takeover(push)
    return f"at step {st:,}" if st is not None else f"never, within {LIMIT:,} steps"
PL, PR, PT, PB = 70, 360, 60, 230                               # the plot's box
px = lambda t: PL + t / STEPS * (PR - PL)
py = lambda s: PB - s * (PB - PT)
BX, BS = 476, 140                                               # final-share bars: left edge, px for 1.0


def readouts(push):
    h = collapse(push)
    last = h[-1]
    return dict(top=last[LEAD], dead=sum(v < 0.01 for v in last), at100=h[100][LEAD])


P26_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const LUCK = __LUCK__, ETA = __ETA__, STEPS = __STEPS__, LEAD = __LEAD__, LIMIT = __LIMIT__;
  const PL = __PL__, PR = __PR__, PT = __PT__, PB = __PB__, BX = __BX__, BS = __BS__;
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val'), q = s => fig.querySelector(s);
  const fmt = (v, d = 2) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
  const px = t => PL + t / STEPS * (PR - PL), py = s => PB - s * (PB - PT);
  function sim(push) {
    let z = LUCK.slice(); const hist = [];
    for (let t = 0; t <= STEPS; t++) {
      const m = Math.max(...z), e = z.map(v => Math.exp(v - m)), s = e.reduce((a, b) => a + b, 0);
      const p = e.map(v => v / s); hist.push(p);
      z = z.map((zi, i) => zi + ETA * p[i] - push * (p[i] - 1 / 8));
    }
    return hist;
  }
  function takeover(push) {
    let z = LUCK.slice();
    for (let t = 0; t <= LIMIT; t++) {
      const m = Math.max(...z), e = z.map(v => Math.exp(v - m)), s = e.reduce((a, b) => a + b, 0);
      const p = e.map(v => v / s);
      if (Math.max(...p) > 0.9) return t;
      z = z.map((zi, i) => zi + ETA * p[i] - push * (p[i] - 1 / 8));
    }
    return null;
  }
  const group = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  function draw() {
    const push = +sl.value; val.textContent = fmt(push);
    const st = takeover(push);
    q('[data-r="takeover"]').textContent = st === null ? `never, within ${group(LIMIT)} steps` : `at step ${group(st)}`;
    const h = sim(push), last = h[STEPS];
    for (let i = 0; i < 8; i++) {
      q(`[data-line="${i}"]`).setAttribute('points', h.map((p, t) => `${px(t).toFixed(1)},${py(p[i]).toFixed(1)}`).join(' '));
      const w = Math.max(last[i] * BS, 2), bar = q(`[data-bar="${i}"]`), tx = q(`[data-v="${i}"]`);
      bar.setAttribute('width', w.toFixed(1)); tx.setAttribute('x', (BX + w + 8).toFixed(1)); tx.textContent = fmt(last[i], 3);
    }
    q('[data-r="top"]').textContent = fmt(last[LEAD], 3);
    q('[data-r="at100"]').textContent = fmt(h[100][LEAD], 3);
    q('[data-r="dead"]').textContent = String(last.filter(v => v < 0.01).length);
  }
  sl.addEventListener('input', draw);
  q('button').addEventListener('click', () => { sl.value = 0; draw(); });
  draw();
})();</script>"""


def p26():
    h = collapse(0.0)
    r0 = readouts(0.0)
    assert round(h[0][LEAD], 3) == 0.135 and r0["dead"] == 7 and r0["top"] > 0.99
    assert readouts(ETA)["top"] == h[0][LEAD] or abs(readouts(ETA)["top"] - h[0][LEAD]) < 1e-12   # frozen
    assert abs(readouts(2 * ETA)["top"] - 1 / 8) < 0.001 and readouts(2 * ETA)["dead"] == 0
    assert takeover(0.0) == 164 and takeover(0.12) == 810 and takeover(ETA) is None
    s = [hd(40, 34, "Each expert's share of the traffic over 200 training steps")]
    s.append(ln(PL, PB, PR, PB, "axis"))
    s.append(ln(PL, PT, PL, PB, "axis"))
    for t in range(0, STEPS + 1, 50):
        s.append(ln(px(t), PB, px(t), PB + 4, "tick"))
        s.append(txt(px(t), PB + 18, str(t), "sub2", "middle"))
    for v in (0, 0.5, 1):
        s.append(txt(PL - 8, py(v) + 4, f"{v:g}", "sub2", "end"))
    s.append(txt((PL + PR) / 2, PB + 38, "training step", "sub2", "middle"))
    s.append(f'<line class="mark" x1="{PL}" y1="{py(1 / 8):.1f}" x2="{PR}" y2="{py(1 / 8):.1f}"/>')
    s.append(txt(PR + 6, py(1 / 8) + 4, "1/8", "sub2"))
    for i in range(8):
        pts = " ".join(f"{px(t):.1f},{py(p[i]):.1f}" for t, p in enumerate(h))
        s.append(f'<polyline class="{"pl-h" if i == LEAD else "pl-m"}" points="{pts}" data-line="{i}"/>')
    s.append(txt(BX, 52, "share at step 200", "sub2"))
    for i in range(8):
        y = 62 + i * 21
        w = max(h[-1][i] * BS, 2)
        s.append(txt(BX - 10, y + 13, f"E{i + 1}", "cap", "end"))
        s.append(f'<g class="{"h" if i == LEAD else "m"}"><rect x="{BX}" y="{y}" width="{w:.1f}" height="16" rx="2" data-bar="{i}"/></g>')
        s.append(f'<text class="sub2" x="{BX + w + 8:.1f}" y="{y + 13}" data-v="{i}">{f(h[-1][i], 3)}</text>')
    yr = PB + 70
    s.append(f'<text class="sub2" x="40" y="{yr}">expert {LEAD + 1}, the luckiest, at step 100: '
             f'<tspan data-r="at100">{f(r0["at100"], 3)}</tspan>; at step 200: <tspan data-r="top">{f(r0["top"], 3)}</tspan></text>')
    s.append(f'<text class="sub2" x="40" y="{yr + 20}">experts left with under 1% of the traffic: '
             f'<tspan data-r="dead">{r0["dead"]}</tspan> of 8</text>')
    s.append(f'<text class="sub2" x="40" y="{yr + 40}">one expert passes 90% of all traffic: '
             f'<tspan data-r="takeover">{takeover_text(0.0)}</tspan></text>')
    body, yb = prose(yr + 84, [
        f"A toy, with made-up rates. Eight experts start almost level; by luck expert {LEAD + 1} is a "
        f"little ahead, with {f(h[0][LEAD], 3)} of the traffic instead of 0.125. Each step, every expert "
        f"improves in proportion to the traffic it got, and the router, a softmax over how good each "
        f"expert is, shifts toward the better ones.",
        "With the balancing push at zero, nothing seems to happen for a hundred steps, then the luckiest "
        "expert takes everything and seven go dead. The push lowers each expert's score in proportion to "
        f"how far its share is above one eighth. Below {f(ETA)} it only slows the loop: at 0.12 the "
        f"takeover comes {takeover_text(0.12)} instead of {takeover_text(0.0)}. At {f(ETA)}, the "
        "strength of the feedback, the shares freeze; above it they settle at one eighth.",
        "The simulation in the page was checked against the same arithmetic in Python.",
    ])
    title = "Rich get richer, simulated"
    ctl = (f"<label>balancing push <input type='range' min='0' max='0.3' step='0.01' value='0'>"
           f"<span class='val'>{f(0)}</span></label><button type='button'>Reset</button>")
    js = P26_JS
    for k, v in dict(LUCK=json.dumps(LUCK), ETA=ETA, STEPS=STEPS, LEAD=LEAD, LIMIT=LIMIT, PL=PL, PR=PR, PT=PT, PB=PB,
                     BX=BX, BS=BS).items():
        js = js.replace(f"__{k}__", str(v))
    emit_html("p26", f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; {at('purely by luck')}</div>"
              f"<h3>{title}</h3><div class='wg'><div class='ctl'>{ctl}</div>"
              f"<svg viewBox='0 0 680 {yb + 26}' role='img'><title>{title}</title>{''.join(s)}{body}</svg></div>"
              "<figcaption>Positive feedback is invisible until it is not. A loop in which a small lead earns a "
              "bigger one ends with a few celebrity experts and a long tail of dead ones, unless something "
              "pushes back at least as hard.</figcaption>"
              f"{js}</figure>")


# ---- P27: a layer waits for its busiest GPU --------------------------------------------------------
LOADS = [40, 20, 18, 16, 14, 12, 10, 6]


def p27():
    mean = sum(LOADS) / len(LOADS)
    worst = max(LOADS)
    assert mean == 17 and worst == 40 and round(100 * mean / worst, 1) == 42.5
    b = [hd(40, 46, "Tokens of work on each GPU in one MoE layer, to scale")]
    X0, SC = 130, 11
    for i, v in enumerate(LOADS):
        y = 66 + i * 30
        b.append(txt(40, y + 16, f"GPU {i + 1}", "cap"))
        b.append(rect(X0, y, v * SC, 22, "h" if v == worst else "m"))
        b.append(txt(X0 + v * SC + 8, y + 16, str(v), "sub2 halo"))
    yb = 66 + len(LOADS) * 30
    b.append(f'<line class="mark xok" x1="{X0 + mean * SC:.1f}" y1="60" x2="{X0 + mean * SC:.1f}" y2="{yb + 2}"/>')
    b.append(txt(X0 + mean * SC, yb + 18, f"average {mean:g}", "sub2", "middle"))
    b.append(txt(X0 + worst * SC, yb + 18, f"the layer's time: {worst}", "sub2", "end"))
    body, y = prose(yb + 64, [
        "Expert parallelism gives each GPU its own experts ({{fig:v05-o015}}). In one MoE layer every GPU "
        "runs its experts on the tokens sent to it, and the next layer cannot start until the last GPU "
        "has finished.",
        f"So the layer takes as long as its busiest GPU: {worst} units of work here, though the average is "
        f"{sum(LOADS)} / 8 = {mean:g}. The other seven finish early and wait. The cluster runs at "
        f"{mean:g} / {worst} = {100 * mean / worst:.1f}% of what an even spread would give.",
    ])
    emit("p27", at("becomes a straggler"), "A layer waits for its busiest GPU", y + 32, b + [body],
         "Maximum, not average. One hot expert sets the pace for every GPU in the layer, which is why "
         "imbalance is a cost problem as well as a quality one.")


if __name__ == "__main__":
    for fn in (o016, p24, p25, p26, p27):
        fn()
