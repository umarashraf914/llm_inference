"""V5 Part 5, expert parallelism: N25-N29 of plans/depth_pass/V05_review.md, with Figs 15-17 rebuilt
(Fig 15 after N25, Fig 17 naming DeepEP and keeping the presenter's "can").

The traffic table in N28 comes from a small random router: every token picks two of eight experts.
The generator is mulberry32, written identically here and in the widget's script, so each batch's
table can be recomputed in Python and compared with the page.

  python3 figures/V05/src/part5_expert.py     writes items n25-n29, o015-o017
"""
import json
from math import comb
from v05common import *  # noqa: F401,F403

ATT = 2 * HIDDEN * HIDDEN + 2 * HIDDEN * KVH * HEAD      # W_Q, W_O; W_K, W_V for 8 KV heads
FFN_W = 3 * HIDDEN * FFN
assert ATT == 150_994_944 and FFN_W == 704_643_072


# ---- N25: the feed-forward block is most of a layer ----------------------------------------------
def n25():
    share = FFN_W / (ATT + FFN_W)
    assert f(100 * share, 0) == "82"
    X0, SC = 170, 440 / FFN_W
    b = [hd(40, 40, "Weights in one layer of the 70B")]
    b.append(txt(40, 78, "attention", "cap"))
    b.append(cell(X0, 60, ATT * SC, 28, "u"))
    b.append(txt(X0 + ATT * SC + 10, 78, f"{ATT / 1e6:.1f} million", "sub2"))
    b.append(txt(40, 122, "feed-forward", "cap"))
    b.append(cell(X0, 104, FFN_W * SC, 28, "m",
                  label=f"{FFN_W / 1e6:.1f} million, {share:.0%} of the layer"))
    body, yb = prose(174, [
        f"Count one layer of the 70B. Attention's four matrices hold {ATT / 1e6:.1f} million weights: "
        "W_Q and W_O are 8,192 × 8,192 each, W_K and W_V only 8,192 × 1,024, since just 8 heads keep "
        f"keys and values. The feed-forward block's three hold {FFN_W / 1e6:.1f} million, "
        f"{share:.0%} of the layer ({{{{fig:v01-o101}}}}).",
        "A mixture-of-experts layer takes exactly this block, the biggest block of weights in the "
        "model, and breaks it into many smaller independent ones called experts. Each token uses "
        "only a few of them.",
    ])
    emit("n25", stamp(SRT, "A mixture of experts layer takes the"),
         "The feed-forward block is over four fifths of a layer", yb + 26, b + [body],
         "Bars to scale. Sparsity goes where the weights are; attention is left exactly as it was "
         "({{ref:v06-o012}}).")


# ---- Fig 15: the experts get homes ---------------------------------------------------------------
def o015():
    per = DS_EXPERTS // 8
    assert per == 48
    b = []
    for g in range(8):
        x, y = 40 + (g % 4) * 153, 40 + (g // 4) * 157
        b.append(cont(x, y, 141, 147, "u", f"GPU {g + 1}", sub=f"experts {per * g + 1}–{per * (g + 1)}"))
        for k in range(per):
            b.append(cell(x + 12 + (k % 8) * 15, y + 54 + (k // 8) * 12.4, 12, 9.4, "m", rx=1.5))
    body, yb = prose(384, [
        "In DeepSeek V4 Pro, a layer holds 384 routed experts, and every token runs through just six "
        "of them. Why models built this way work so well is the next video's topic.",
        "What matters here is that the experts are separate networks, so they can live on separate "
        f"GPUs: that split is expert parallelism. Spread over eight GPUs, each holds 384 ÷ 8 = {per} "
        "experts whole. Where tensor parallelism slices every matrix into pieces, expert parallelism "
        "keeps each expert whole and gives it a home.",
    ])
    emit("o015", stamp(SRT, "In DeepSeek V4 Pro, a layer holds 384"),
         "Experts are whole networks, so each can have its own home", yb + 26, b + [body],
         "Illustrative placement, eight GPUs of 48 experts. The layout is fixed; which experts a token "
         "needs is not, and that is where the traffic comes from.")


# ---- N26: six of 384 -----------------------------------------------------------------------------
LIT = [17, 92, 145, 233, 301, 366]                      # an illustrative token's six experts


def n26():
    assert len(LIT) == DS_TOPK and 16 * 24 == DS_EXPERTS
    pct, act = DS_TOPK / DS_EXPERTS, DS_ACTIVE / DS_PARAMS
    assert f(100 * pct, 1) == "1.6" and f(100 * act, 1) == "3.1"
    b = [hd(40, 40, "384 experts, one cell each; the six this token uses are lit")]
    for e in range(DS_EXPERTS):
        r, c = divmod(e, 24)
        b.append(cell(40 + c * 13, 58 + r * 13, 11, 11, "m" if e + 1 in LIT else "u", rx=1.5))
    X0, W = 384, 256
    steps = [("u", "the token's vector, 7,168 numbers"), ("m", "384 scores, one per expert"),
             ("m", "the six largest kept"), ("s", "six experts run; scores weight them")]
    notes = ["× the router: one row per expert", "rank them", "only these six do any work"]
    for k, (c, s) in enumerate(steps):
        y = 58 + k * 54
        b.append(cell(X0, y, W, 30, c, label=s))
        if k < 3:
            b.append(arr(X0 + 20, y + 32, X0 + 20, y + 52))
            b.append(txt(X0 + 32, y + 46, notes[k], "sub2"))
    body, yb = prose(310, [
        "A small router reads the token's vector and scores every expert: one small matrix multiply, "
        "one row per expert, gives 384 scores ({{fig:v06-p15}}). It keeps the six largest, and their "
        "scores later weight the six experts' outputs when they are combined ({{fig:v06-p17}}).",
        f"Six of 384 routed experts is {f(100 * pct, 1)}% of them. With the one shared expert, "
        "attention and the rest that every token uses, DeepSeek counts 49 billion of the model's 1.6 "
        f"trillion parameters as active for each token: {f(100 * act, 1)}%.",
    ])
    emit("n26", stamp(SRT, "routed experts, and every token runs"),
         "Six of 384, and how the six are chosen", yb + 26, b + [body],
         "Grid to scale: six lit of 384. Which six changes from token to token, and that is the root "
         "of everything that follows in this part.")


# ---- Fig 16: one token's trip --------------------------------------------------------------------
def o016():
    b = [hd(40, 46, "One token, one layer")]
    steps = [(40, 100, "s", "arrives"), (172, 110, "s", "router picks 6"),
             (314, 150, "h", "ships to its experts"), (496, 144, "h", "results come back")]
    for k, (x, w, c, s) in enumerate(steps):
        b.append(cell(x, 70, w, 40, c, label=s, rx=4))
        if k < 3:
            b.append(arr(x + w + 6, 90, steps[k + 1][0] - 6, 90))
    b.append(txt(314, 134, "dispatch", "sub2"))
    b.append(txt(496, 134, "combine", "sub2"))
    body, yb = prose(180, [
        "Watch one token move through a layer. It arrives on some GPU, and a small router reads it "
        "and picks its six experts. A couple might live on this chip, but the rest sit elsewhere. So "
        "the token ships out to the GPUs that hold its experts, gets processed there, and the results "
        "come back to be combined.",
        "The trip out is called the dispatch and the trip back the combine. Both are communication, "
        "and both sit inside every MoE layer, for every token.",
    ])
    emit("o016", stamp(SRT, "Now, watch one token move"),
         "One token's trip: out to its experts and back", yb + 26, b + [body],
         "Two exchanges per MoE layer, out and back. Once every token in the batch takes this trip at "
         "the same time, each one becomes an all-to-all.")


# ---- N27: most experts are elsewhere -------------------------------------------------------------
def n27():
    eps = [2, 4, 8, 16, 64]
    p_all = comb(48, 6) / comb(DS_EXPERTS, 6)
    assert f(p_all * 1e6, 1) == "2.9"
    X0, PE = 190, 50                                  # px per expert; the track is all six
    b = [hd(40, 40, "Expected experts at home, of a token's six, if routing were even")]
    for k, ep in enumerate(eps):
        y = 58 + k * 40
        loc = DS_TOPK / ep
        b.append(txt(40, y + 18, f"group of {ep} GPUs", "cap"))
        b.append(ghost(X0, y, DS_TOPK * PE, 26))
        b.append(cell(X0, y, max(loc * PE, 2), 26, "s"))
        b.append(txt(X0 + DS_TOPK * PE + 12, y + 18, f"{f(loc, 2)} home, {f(100 * (1 - 1 / ep), 1)}% leave",
                     "sub2"))
    body, yb = prose(282, [
        "Spread the experts evenly over the G GPUs of an expert-parallel group. If every expert "
        "were equally likely, each of a token's six would sit on the token's own GPU with chance "
        "1/G, so on average 6/G of them stay home and the share 1 − 1/G must travel.",
        "In a group of two, three of six stay home: the couple that might live on this chip. In a "
        "group of eight, three quarters of one; in sixty-four, almost none. The chance that all six "
        f"are local in a group of eight is {f(p_all * 1e6, 1)} in a million.",
    ])
    emit("n27", stamp(SRT, "A couple might live on this chip"),
         "Most of a token's six experts live on other GPUs", yb + 26, b + [body],
         "Bars to scale against six. Real routers are uneven ({{ref:v06-o017}}), but either way nearly "
         "every token leaves home, and the all-to-all is how it travels.")


# ---- N28: the traffic table (widget) -------------------------------------------------------------
G4, EXP, TOKS = 4, 8, 16


def mulberry32(seed):
    a = seed & 0xFFFFFFFF

    def rnd():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = ((a ^ (a >> 15)) * (a | 1)) & 0xFFFFFFFF
        t = ((t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF) ^ t
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296
    return rnd


def table(batch):
    """Jobs (one token for one expert) from each GPU's tokens, by the GPU holding the expert."""
    rnd, T = mulberry32(batch), [[0] * G4 for _ in range(G4)]
    for s in range(G4):
        for _ in range(TOKS):
            e1 = int(rnd() * EXP)
            e2 = int(rnd() * (EXP - 1))
            e2 += e2 >= e1
            for e in (e1, e2):
                T[s][e // 2] += 1
    assert all(sum(r) == 2 * TOKS for r in T)
    return T


def summary(T):
    load = [sum(T[s][r] for s in range(G4)) for r in range(G4)]
    hot = max(range(G4), key=lambda r: (load[r], -r))
    away = sum(T[s][r] for s in range(G4) for r in range(G4) if s != r)
    return load, hot, away / (G4 * 2 * TOKS)


WIDGET28 = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const C = __C__;
  const q = s => fig.querySelector(s), btn = [...fig.querySelectorAll('button')];
  const fmt = (v, d) => { const s = Math.abs(v).toFixed(d), [i, p] = s.split('.');
    return (v < 0 && +s !== 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (p ? '.' + p : ''); };
  function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function table(batch) {
    const rnd = mulberry32(batch), T = Array.from({length: C.G}, () => Array(C.G).fill(0));
    for (let s = 0; s < C.G; s++) for (let k = 0; k < C.TOKS; k++) {
      const e1 = Math.floor(rnd() * C.EXP); let e2 = Math.floor(rnd() * (C.EXP - 1)); if (e2 >= e1) e2++;
      T[s][Math.floor(e1 / 2)]++; T[s][Math.floor(e2 / 2)]++;
    }
    return T;
  }
  let batch = C.b0;
  function draw() {
    const tabs = [table(batch), table(batch + 1)];
    tabs.forEach((T, j) => {
      q(`[data-head="${j}"]`).textContent = `batch ${batch + j}`;
      const load = [0, 1, 2, 3].map(r => T.reduce((a, row) => a + row[r], 0));
      let hot = 0; load.forEach((v, r) => { if (v > load[hot]) hot = r; });
      let away = 0;
      for (let s = 0; s < C.G; s++) for (let r = 0; r < C.G; r++) {
        q(`[data-c="${j}-${s}-${r}"]`).textContent = T[s][r];
        if (s !== r) { away += T[s][r];
          q(`[data-r="${j}-${s}-${r}"]`).style.fillOpacity = (0.1 + 0.55 * T[s][r] / C.cmax).toFixed(2); }
      }
      load.forEach((v, r) => { q(`[data-l="${j}-${r}"]`).textContent = v;
        q(`[data-lg="${j}-${r}"]`).setAttribute('class', r === hot ? 'h' : 'u0'); });
      q(`[data-hot="${j}"]`).setAttribute('x', C.cx[j][hot] - 20);
      q(`[data-s="${j}"]`).textContent = `busiest: G${hot + 1}, ${load[hot]} jobs; ${fmt(100 * away / (C.G * 2 * C.TOKS), 0)}% leave home`;
    });
  }
  btn[0].addEventListener('click', () => { batch += 2; draw(); });
  btn[1].addEventListener('click', () => { batch = C.b0; draw(); });
  draw();
})();</script>"""


def n28_svg(b0):
    tabs = [table(b0), table(b0 + 1)]
    cmax = 2 * TOKS                                       # a cell can hold at most every job of a row
    CW, CH, GAPX = 44, 28, 4
    X = [100, 400]
    cx = [X[0] + 36 + r * (CW + GAPX) + CW / 2 for r in range(G4)]
    s = [hd(40, 34, "Rows: the GPU a token starts on. Columns: the GPU holding its expert")]
    for j, T in enumerate(tabs):
        x0 = X[j]
        load, hot, away = summary(T)
        s.append(f'<text class="cap" x="{x0}" y="64" data-head="{j}">batch {b0 + j}</text>')
        for r in range(G4):
            s.append(txt(x0 + 36 + r * (CW + GAPX) + CW / 2, 86, f"to G{r + 1}", "sub2", "middle"))
        for si in range(G4):
            y = 96 + si * (CH + 4)
            s.append(txt(x0, y + 19, f"G{si + 1}", "sub2"))
            for r in range(G4):
                x = x0 + 36 + r * (CW + GAPX)
                if si == r:
                    s.append(f'<rect x="{x}" y="{y}" width="{CW}" height="{CH}" rx="3" fill="none" '
                             f'stroke="var(--rule)" stroke-width="1" stroke-dasharray="3 3"/>')
                else:
                    op = 0.1 + 0.55 * T[si][r] / cmax
                    s.append(f'<rect x="{x}" y="{y}" width="{CW}" height="{CH}" rx="3" '
                             f'style="fill:var(--h);fill-opacity:{f(op, 2)};stroke:var(--h)" '
                             f'data-r="{j}-{si}-{r}"/>')
                s.append(f'<text class="sub" x="{x + CW / 2}" y="{y + CH / 2}" text-anchor="middle" '
                         f'dominant-baseline="central" data-c="{j}-{si}-{r}">{T[si][r]}</text>')
        yl = 96 + G4 * (CH + 4) + 18
        s.append(txt(x0, yl, "jobs", "sub2"))
        for r in range(G4):
            xx = x0 + 36 + r * (CW + GAPX) + CW / 2
            s.append(f'<g class="{"h" if r == hot else "u0"}" data-lg="{j}-{r}"><text class="sub2" x="{xx}" '
                     f'y="{yl}" text-anchor="middle" data-l="{j}-{r}">{load[r]}</text></g>')
        hx = x0 + 36 + hot * (CW + GAPX) + CW / 2 - 20
        s.append(f'<rect x="{hx}" y="{yl + 7}" width="40" height="3" rx="1.5" '
                 f'style="fill:var(--h)" data-hot="{j}"/>')
        s.append(f'<text class="sub2" x="{x0}" y="{yl + 30}" data-s="{j}">busiest: G{hot + 1}, '
                 f'{load[hot]} jobs; {f(100 * away, 0)}% leave home</text>')
    return s, tabs, [X[0] + 36 + r * (CW + GAPX) + CW / 2 for r in range(G4)]


def n28():
    b0 = 1
    s, tabs, _ = n28_svg(b0)
    load, hot, away = summary(tabs[0])
    assert sum(load) == G4 * 2 * TOKS
    body, yb = prose(330, [
        "Four GPUs, two experts on each, sixteen tokens per GPU, and every token sent to two experts "
        "picked at random. Each cell counts jobs, one token for one expert, from the row's GPU to the "
        "column's. The dashed diagonal stays home; everything else crosses a link. This table is the "
        "dispatch all-to-all, and the combine is the same table transposed, as every answer goes back "
        "where it came from.",
        "Press next batch: the router redraws the map, so the table changes every time, and so does "
        "which GPU is busiest. The traffic cannot be planned in advance. Random routing stands in for "
        "the router here; the generator is the same one in the script and in Python, and every table "
        "was checked against both.",
    ])
    s.append(body)
    ctl = ["<button type='button'>Next batch</button><button type='button'>Reset</button>"]
    # the busiest column's sum sits in a g.h, so the page's own rule gives it the communication colour
    X = [100, 400]
    C = {"G": G4, "EXP": EXP, "TOKS": TOKS, "b0": b0, "cmax": 2 * TOKS,
         "cx": [[X[j] + 36 + r * 48 + 22 for r in range(G4)] for j in range(2)]}
    js = WIDGET28.replace("__C__", json.dumps(C))
    emit_raw("n28", widget("n28", stamp(SRT, "Multiply that by every token in the"),
                           "The all-to-all is a traffic table that changes every batch", ctl, yb + 24, s,
                           "Uniform random routing, simulated. A real router is less even, which makes "
                           "the heaviest column heavier, and the GPU that holds it the one everybody "
                           "waits for.", js))


# ---- Fig 17: the shuffle takes over --------------------------------------------------------------
def o017():
    X0, TR = 300, 320
    b = [txt(40, 78, "Time inside a MoE layer", "cap"),
         ghost(X0, 62, TR, 32), cell(X0, 62, 0.70 * TR, 32, "h", label="over 70% shuffling"),
         txt(40, 138, "End-to-end inference latency", "cap"),
         ghost(X0, 122, TR, 32), cell(X0, 122, 0.40 * TR, 32, "h", label="around 40%")]
    body, yb = prose(196, [
        "Measured across nodes, the two all-to-alls can eat over 70% of a MoE layer's time and around "
        "40% of end-to-end inference latency. The expert mathematics is not the bottleneck; moving "
        "tokens to the experts is.",
        "That is why DeepSeek built DeepEP, an all-to-all library that exists just for dispatch and "
        "combine.",
    ])
    emit("o017", stamp(SRT, "What surprised me in the measurements"),
         "Across nodes, the shuffling can take over", yb + 26, b + [body],
         "Measurements, not a law: the share depends on the system. A strategy whose communication can "
         "outweigh its computation has to be placed very carefully.")


# ---- N29: spilling past the node -----------------------------------------------------------------
def n29():
    ks = [1, 2, 4, 8]
    slow = NVL_H100_EACH_WAY / NET_EACH_WAY
    assert slow == 9
    X0, TR = 200, 400
    b = [hd(40, 40, "Share of dispatch traffic that crosses the network, if routing were even")]
    for i, k in enumerate(ks):
        y = 58 + i * 40
        v = (k - 1) / k
        b.append(txt(40, y + 18, f"experts on {k} node{'s' if k > 1 else ''}", "cap"))
        b.append(ghost(X0, y, TR, 26))
        if v:
            b.append(cell(X0, y, v * TR, 26, "h", label=f"{f(100 * v, 1)}%"))
        else:
            b.append(txt(X0 + 10, y + 18, "0%: everything stays on NVLink", "sub2"))
    body, yb = prose(246, [
        "Put a group's experts on k nodes and, with even routing, a token's expert sits on another "
        "node with chance (k − 1) ÷ k. One node keeps everything on NVLink; two send half the traffic "
        "over the network; eight, seven eighths.",
        f"Every crossing runs at about 50 GB/s each way instead of NVLink's 450 ({{{{fig:v05-n7}}}}): "
        f"the same bytes, {slow:.0f} times the time. This is the arithmetic behind expert parallelism "
        "suffering the moment it spills past the fast domain: its traffic is exactly the kind that "
        "cannot afford the slow boundary.",
    ])
    emit("n29", stamp(SRT, "Across nodes, those two all-to-alls"),
         "Spread the experts over k nodes and (k − 1)/k of the traffic crosses the slow wire", yb + 26,
         b + [body],
         "Bars to scale against 100%. Node-limited routing ({{ref:v06-o021}}) exists to cap how many "
         "nodes one token can reach.")


if __name__ == "__main__":
    for fn in (n25, o015, n26, o016, n27, n28, o017, n29):
        fn()
