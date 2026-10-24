"""V9 Parts 9-10, closing: Fig 14 as a timeline to scale with its forecast caveat, Fig 15 restamped with
Mercury named and its scope restored, N29 (a masked position), N30 (one position per pass, or many) and
its stepper N30w, N31 (the arithmetic of filling many positions), N32 (no causal triangle).
plans/depth_pass/V09_review.md §4 J and §5 Figs 14, 15.

  python3 figures/V09/src/closing.py    writes items o014 o015 n29 n30 n30w n31 n32

Sources read: Crossref for Wulf and McKee, "Hitting the memory wall", March 1995; arXiv for the
transformer (12 Jun 2017), PagedAttention (12 Sep 2023), Microscaling formats (16 Oct 2023), Splitwise
(30 Nov 2023), DistServe (18 Jan 2024), DeepSeek-V2 (7 May 2024); Deloitte TMT Predictions 2026
(inference "roughly two-thirds of all compute" in 2026, "up from a third in 2023 and half in 2025");
Inception Labs' Mercury report, arXiv 2506.17298 (Artificial Analysis measured 1,109 tokens/s for
Mercury Coder Mini and 737 for Small on H100s; "Transformer ... trained to predict multiple tokens in
parallel"); LLaDA, arXiv 2502.09992 ("does not use a causal mask", "incompatible with KV caching",
low-confidence remasking).
"""
import json
from common import SRT, box, cell, ghost, txt, hd, ln, para, stamp, emit, emit_widget, width, f, n, esc

# ---- Fig 14: the dates, as year + month/12 ---------------------------------------------------------------
WALL, TRANSFORMER = 1995 + 2 / 12, 2017 + 5 / 12
ANSWERS = [("paged attention", 2023 + 8 / 12, "September 2023"),
           ("4-bit microscaled formats", 2023 + 9 / 12, "October 2023"),
           ("prefill and decode split", 2023 + 10 / 12, "November 2023 and January 2024"),
           ("latent attention", 2024 + 4 / 12, "May 2024")]
assert TRANSFORMER - WALL > 20 and round((ANSWERS[-1][1] - ANSWERS[0][1]) * 12) == 8
assert all(a[1] > 2023 for a in ANSWERS)                     # "published after 2022"


def o014():
    b = [hd(40, 46, "Thirty-one years on one axis, to scale")]
    X0, X1, Y0, Y1 = 60, 620, 1995, 2027
    px = lambda yr: X0 + (yr - Y0) / (Y1 - Y0) * (X1 - X0)
    AX = 120
    b.append(ln(X0, AX, X1, AX, "axis"))
    for yr in range(1995, 2028, 5):
        b.append(ln(px(yr), AX, px(yr), AX + 4, "tick"))
        b.append(txt(px(yr), AX + 18, str(yr), "sub2", "middle"))
    for yr, lab in [(WALL, "1995: the memory wall named"), (TRANSFORMER, "2017: the transformer")]:
        b.append(f'<circle cx="{px(yr):.1f}" cy="{AX}" r="4" fill="var(--paper)" stroke="var(--h)" stroke-width="1.5"/>')
        b.append(txt(px(yr), AX - 14, lab, "sub2", "middle" if yr > 2000 else "start"))
    xa, xb = px(ANSWERS[0][1]), px(ANSWERS[-1][1])
    b.append(cell(xa - 1, AX - 8, xb - xa + 2, 16, "s", rx=2))
    b.append(txt(xb + 8, AX - 14, "2023-24", "sub2"))
    b.append(f'<line class="conn" x1="{(xa + xb) / 2:.1f}" y1="{AX + 26}" x2="{(xa + xb) / 2:.1f}" y2="{AX + 52}"/>')
    yl = AX + 70
    for k, (name, _, when) in enumerate(ANSWERS):
        b.append(txt(250, yl + k * 20, f"{name}: {when}", "sub2"))
    b.append(txt(250, yl - 16, "the answers, all within eight months", "cap"))
    ys = yl + 4 * 20 + 18
    span = [("the wall to the first answer", ANSWERS[0][1] - WALL, "h"),
            ("the first answer to the last", ANSWERS[-1][1] - ANSWERS[0][1], "s")]
    SC = (X1 - X0) / (Y1 - Y0)
    for k, (lab, yrs, c) in enumerate(span):
        y = ys + k * 34
        b.append(txt(40, y + 17, lab, "cap"))
        b.append(cell(250, y, max(yrs * SC, 2), 24, c))
        b.append(txt(250 + yrs * SC + 8, y + 17, f"{f(yrs, 1)} years" if yrs > 2 else f"{round(yrs * 12)} months", "sub2"))
    body, yb = para(ys + 2 * 34 + 40, [
        "Most of the stack this series described did not exist five years ago. Paged caches, latent "
        "attention, the split between prefill and decode, and 4-bit microscaled numbers were all published "
        "in 2023 and 2024, within eight months of one another.",
        "The memory wall they answer was named in 1995 ({{fig:v01-o082}}), more than twenty years before "
        "the transformer existed. The trend was there all along. What changed was a workload hungry enough "
        "for bytes to make it the dominant concern.",
        "Inference is forecast to reach about two thirds of all AI compute in 2026, up from a third in 2023 "
        "and half in 2025. That is Deloitte's projection, and projections are uncertain "
        "({{fig:v01-o018}}).",
    ])
    emit("o014", stamp(SRT, "Most of the LLM inference stack this"),
         "The wall is three decades old, and the answers to it date from 2023 and 2024", yb + 30, b + [body],
         "Drawn to scale in years. The constraint waited almost thirty years for a workload that made it "
         "decisive, and the answers arrived within eight months of each other.")


def o015():
    b = [hd(40, 46, "The assumption under every technique that fights decode")]
    b.append(cell(140, 66, 400, 40, "h", rx=4, label="the model writes one token at a time"))
    b.append(txt(140, 130, "batching, speculation, the cache and everything that shrinks it", "sub2"))
    body, yb = para(176, [
        "At the same time, many quite different approaches are being tried. Every technique that fights "
        "decode assumes the model writes one token at a time: each token needs its own pass over the "
        "weights, and the stack exists to put more work behind each of those passes. Diffusion language "
        "models do not write that way.",
        "A diffusion model starts from a sequence of blanks, masked positions, and fills it in over several "
        "passes, predicting many positions at once. Mercury, a commercial diffusion model from Inception "
        "Labs, was independently measured by Artificial Analysis at 1,109 tokens a second on H100 GPUs for "
        "Mercury Coder Mini, and 737 for the larger Mercury Coder Small.",
        "A model that fills in many positions at once is a different problem, and the stack that serves it "
        "will look different too. The next four figures show why.",
    ])
    emit("o015", stamp(SRT, "Every technique that fights decode"),
         "Every technique that fights decode assumes one token at a time", yb + 30, b + [body],
         "A measurement by an independent benchmarker, on the previous generation of GPU, for one family "
         "of coding models: a speed, not a verdict on the approach.")


# ---- N29-N30w: a sentence of 12 tokens ---------------------------------------------------------------------
WORDS = ["the", "test", "fails", "because", "the", "parser", "subtracts", "where", "it", "should", "add", "."]
PASSES = [[0, 5, 10], [1, 6, 11], [2, 3, 9], [4, 7, 8]]      # positions a diffusion model commits per pass
assert sorted(sum(PASSES, [])) == list(range(12)) and all(len(p) == 3 for p in PASSES) and len(PASSES) == 12 // 3
# one pass in close-up, illustrative confidences for the five blanks left after pass 2
CLOSE = [(2, "fails", 0.91), (3, "because", 0.86), (9, "should", 0.83), (7, "where", 0.52), (8, "it", 0.47)]
assert sorted(p for p, _, _ in CLOSE) == [2, 3, 7, 8, 9]
assert [p for p, _, c in sorted(CLOSE, key=lambda r: -r[2])[:3]] == PASSES[2]       # the top three are kept


def n29():
    b = [hd(40, 46, "After two passes: seven positions filled, five still blank")]
    CW, G_ = 46, 4
    done = set(PASSES[0] + PASSES[1])
    for i, w in enumerate(WORDS):
        x = 40 + i * (CW + G_)
        if i in done:
            b.append(cell(x, 66, CW, 28, "u", label=w if width(w, "sub") + 12 <= CW else w[:4] + "…"))
        else:
            b.append(ghost(x, 66, CW, 28, label="?"))
    b.append(txt(40, 118, "the model's top guess for each blank, and how sure it is", "cap"))
    cols = [(40, "position"), (130, "top guess"), (250, "confidence"), (380, "this pass")]
    for x, s_ in cols:
        b.append(txt(x, 144, s_, "sub2"))
    keep = set(PASSES[2])
    for k, (pos, w, c) in enumerate(sorted(CLOSE, key=lambda r: -r[2])):
        y = 166 + k * 24
        b.append(txt(40, y, str(pos + 1), "cap"))
        b.append(txt(130, y, w, "cap"))
        b.append(cell(250, y - 13, c * 100, 16, "m" if pos in keep else "u", rx=2))
        b.append(txt(250 + c * 100 + 8, y, f(c, 2), "sub2"))
        b.append(txt(380, y, "kept" if pos in keep else "masked again", "sub2"))
    body, yb = para(166 + 5 * 24 + 30, [
        "A masked position is a blank. In training, random positions of real text are hidden and the "
        "model learns to restore them, scoring every token of its vocabulary for each blank, exactly as an "
        "ordinary model scores the next token ({{fig:v01-o008}}).",
        "When it writes, every blank gets a top guess and a confidence, the probability of that guess "
        "({{fig:v08-o005}}). The most confident guesses are kept and the rest are masked again for the next "
        "pass. LLaDA, a published diffusion model, uses this rule: it re-masks the predictions it is least "
        "sure of.",
        "Nothing here waits for the position before it. Positions 3, 4 and 10 are kept in the same pass "
        "while 8 and 9, between them, stay blank. An ordinary model can guess ahead too, but its positions "
        "still settle one at a time ({{fig:v08-o014}}).",
    ])
    emit("n29", stamp(SRT, "A diffusion model starts from a masked"),
         "A masked position is a blank the model was trained to fill", yb + 30, b + [body],
         "Illustrative words and confidences. Which guesses to keep is the sampler's rule, and published "
         "models differ in it.")


def _grid(b, x0, y0, rows, label, cw=20, ch=14):
    """rows: list of (committed-before set, committed-now set). One row per pass, 12 cells each."""
    b.append(txt(x0, y0 - 10, label, "cap"))
    for r, (old, new) in enumerate(rows):
        for i in range(12):
            x, y = x0 + i * (cw + 2), y0 + r * (ch + 3)
            if i in new:
                b.append(cell(x, y, cw, ch, "m", rx=2))
            elif i in old:
                b.append(cell(x, y, cw, ch, "u", rx=2))
            else:
                b.append(ghost(x, y, cw, ch, rx=2))
    return y0 + len(rows) * (ch + 3)


def n30():
    b = [hd(40, 46, "Twelve positions; each row is one pass over the weights")]
    ar = [(set(range(r)), {r}) for r in range(12)]
    df, seen = [], set()
    for p in PASSES:
        df.append((set(seen), set(p)))
        seen |= set(p)
    ya = _grid(b, 40, 86, ar, "one position per pass: 12 passes")
    yd = _grid(b, 340, 86, df, f"{len(PASSES[0])} positions per pass: {len(PASSES)} passes")
    yk = max(ya, yd) + 22
    b.append(cell(40, yk, 14, 12, "m", rx=2))
    b.append(txt(62, yk + 10, "filled in this pass", "sub2"))
    b.append(cell(200, yk, 14, 12, "u", rx=2))
    b.append(txt(222, yk + 10, "filled earlier", "sub2"))
    b.append(ghost(340, yk, 14, 12, rx=2))
    b.append(txt(362, yk + 10, "still masked", "sub2"))
    body, yb = para(yk + 52, [
        "An ordinary model adds one position per pass, so twelve positions take twelve passes, each one "
        "reading all the weights ({{fig:v01-o007}}). The staircase on the left is the shape of every "
        "decode in this document.",
        "A diffusion model starts with all twelve masked and fills several per pass: at three a pass, four "
        "passes. The order is set by confidence, not by position, so the filled cells are scattered.",
    ])
    emit("n30", stamp(SRT, "sequence and fills it in over several"),
         "One position per pass, or many: two ways to write an answer", yb + 30, b + [body],
         "Illustrative: three a pass is a round number, not a measured rate. What changes is how many "
         "weight reads an answer costs.")


N30_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const W = __W__, P = __P__, N = 12;
  const q = s => fig.querySelector(s), qa = s => [...fig.querySelectorAll(s)];
  let k = 0;
  function cellState(row, i) {                       // 0 masked, 1 filled earlier, 2 filled this pass
    if (row === 0) return i < k ? (i === k - 1 ? 2 : 1) : 0;
    let before = new Set(), now = new Set();
    for (let j = 0; j < Math.min(k, P.length); j++) (j === Math.min(k, P.length) - 1 && k <= P.length ? now : before);
    for (let j = 0; j < Math.min(k, P.length); j++) {
      const into = (j === k - 1) ? now : before; P[j].forEach(p => into.add(p)); }
    return now.has(i) ? 2 : (before.has(i) ? 1 : 0);
  }
  function draw() {
    for (let row = 0; row < 2; row++) for (let i = 0; i < N; i++) {
      const st = cellState(row, i), g = q(`[data-c="${row}-${i}"]`);
      g.setAttribute('class', ['x', 'u', 'm'][st]);
      g.querySelector('rect').setAttribute('style', st ? '' : 'fill:none;stroke:var(--rule);stroke-dasharray:3 3');
      g.querySelector('text').textContent = st ? W[i] : '?';
    }
    const reads = [Math.min(k, N), Math.min(k, P.length)], filled = [Math.min(k, N), 3 * Math.min(k, P.length)];
    q('[data-k]').textContent = k === 0 ? 'before the first pass' : `after pass ${k}`;
    for (let r = 0; r < 2; r++) q(`[data-r="${r}"]`).textContent =
      `${filled[r]} of 12 positions filled, ${reads[r]} weight read${reads[r] === 1 ? '' : 's'}` + (filled[r] === N ? ': done' : '');
    const bs = qa('button'); bs[0].disabled = k === 0; bs[1].disabled = k === N;
  }
  const bs = qa('button');
  bs[0].addEventListener('click', () => { if (k > 0) { k--; draw(); } });
  bs[1].addEventListener('click', () => { if (k < N) { k++; draw(); } });
  bs[2].addEventListener('click', () => { k = 0; draw(); });
  draw();
})();</script>"""


def state30(k):
    """Cell states (0 masked, 1 earlier, 2 this pass) for both rows after k passes, and the readouts."""
    ar = [(2 if i == k - 1 else 1) if i < k else 0 for i in range(12)]
    m = min(k, len(PASSES))
    before, now = set(), set()
    for j in range(m):
        (now if j == k - 1 else before).update(PASSES[j])
    df = [2 if i in now else (1 if i in before else 0) for i in range(12)]
    reads, filled = [min(k, 12), m], [min(k, 12), 3 * m]
    lines = ["before the first pass" if k == 0 else f"after pass {k}"]
    for r in range(2):
        lines.append(f"{filled[r]} of 12 positions filled, {reads[r]} weight read{'' if reads[r] == 1 else 's'}"
                     + (": done" if filled[r] == 12 else ""))
    return ar, df, lines


assert state30(4)[2][2] == "12 of 12 positions filled, 4 weight reads: done"
assert state30(12)[2][1] == "12 of 12 positions filled, 12 weight reads: done"


def n30w():
    s = []
    ar, df, lines = state30(0)
    s.append(f'<text class="sub2" x="40" y="24" data-k="">{lines[0]}</text>')
    CW, G_ = 46, 4
    for row, (lab, st) in enumerate([("one position per pass", ar), ("three positions per pass", df)]):
        y0 = 56 + row * 96
        s.append(txt(40, y0, lab, "cap"))
        for i in range(12):
            x = 40 + i * (CW + G_)
            cls = ["x", "u", "m"][st[i]]
            style = "" if st[i] else ' style="fill:none;stroke:var(--rule);stroke-dasharray:3 3"'
            s.append(f'<g class="{cls}" data-c="{row}-{i}"><rect x="{x}" y="{y0 + 12}" width="{CW}" height="28" '
                     f'rx="3"{style}/><text class="sub" x="{x + CW / 2}" y="{y0 + 26}" text-anchor="middle" '
                     f'dominant-baseline="central">{WORDS[i] if st[i] else "?"}</text></g>')
            assert width(WORDS[i], "sub") + 8 <= CW, WORDS[i]
        s.append(f'<text class="sub2" x="40" y="{y0 + 62}" data-r="{row}">{lines[1 + row]}</text>')
    body, yb = para(56 + 2 * 96 + 30, [
        "Press Next to run one pass. The top row fills one position per pass, left to right, as every "
        "model in this series does. The bottom row fills the three positions it is most sure of in each "
        "pass, wherever they are, and is done after four passes, when the top row has filled four "
        "positions of twelve.",
        "Each pass is one read of the weights, so the bottom row's answer costs four reads instead of "
        "twelve. The order of filling is illustrative; the counting was checked against Python.",
    ])
    ctl = ["<button type='button'>Back</button><button type='button'>Next</button>"
           "<button type='button'>Reset</button>"]
    js = N30_JS.replace("__W__", json.dumps(WORDS)).replace("__P__", json.dumps(PASSES))
    emit_widget("n30w", stamp(SRT, "passes, predicting many positions at"),
                "Run the passes: twelve reads one way, four the other", ctl, s + [body], yb + 26,
                "The diffusion row is done while the ordinary one is a third of the way through. The cost is "
                "hidden in each pass, which has to compute every position, filled or not.", js)


def n31():
    b = [hd(40, 46, "A 256-token answer, illustrative: one position per pass against a block filled in 32")]
    T, PS = 256, 32
    rows = [("weight reads", [("one per pass", T, "h"), ("diffusion", PS, "s")], 256),
            ("positions computed", [("one per pass", T, "u"), ("diffusion", PS * T, "m")], PS * T),
            ("operations per byte", [("one per pass", 4, "h"), ("diffusion", 4 * T, "s")], 1250)]
    y = 72
    for title, pair, top in rows:
        b.append(txt(40, y, title, "hd"))
        sc = 400 / top
        for k, (lab, v, c) in enumerate(pair):
            yy = y + 12 + k * 30
            b.append(txt(40, yy + 17, lab, "cap"))
            w = max(v * sc, 2)
            b.append(cell(200, yy, w, 24, c))
            b.append(txt(200 + w + 8, yy + 17, n(v), "sub2"))
        if title == "operations per byte":
            xr = 200 + 1250 * sc
            b.append(f'<line class="mark xok" x1="{xr:.1f}" y1="{y + 6}" x2="{xr:.1f}" y2="{y + 72}"/>')
            b.append(txt(xr - 6, y, "ridge 1,250", "sub2", "end"))
        y += 100
    assert T / PS == 8 and PS * T / T == 32 and 4 * T == 1024 < 1250
    body, yb = para(y + 10, [
        "Suppose an answer of 256 tokens is written as one block, filled over 32 passes. Each pass reads "
        "the weights once and computes all 256 positions, filled or not, so the answer costs 32 weight "
        "reads instead of 256, eight times fewer, and 8,192 positions of arithmetic instead of 256, "
        "thirty-two times more.",
        "That is a good trade on this hardware. A pass over 256 positions gets 4 × 256 = 1,024 operations "
        "from each byte of weights, close to the ridge, against autoregressive decode's 4. It is the trade "
        "speculation makes ({{fig:v08-o004}}), on a larger scale: spend arithmetic that sat 99.7% idle "
        "({{fig:v09-n22}}) to save trips to memory.",
        "The block size and pass count are illustrative. Mercury's are not public.",
    ])
    emit("n31", stamp(SRT, "Mercury, a commercial diffusion model,"),
         "Filling many positions per pass spends idle arithmetic to save weight reads", yb + 30, b + [body],
         "Bars to scale within each pair. Thirty-two times the arithmetic buys eight times fewer reads, and "
         "on a chip whose arithmetic waits on memory that is the right way round.")


def n32():
    b = [hd(40, 46, "Which earlier positions each position may attend to, 8 × 8")]
    S, G_ = 18, 2
    for k, (lab, causal) in enumerate([("one token at a time: the triangle", True),
                                       ("a diffusion model: the full square", False)]):
        x0 = 40 + k * 300
        b.append(txt(x0, 76, lab, "cap"))
        for r in range(8):
            for c in range(8):
                ok = c <= r or not causal
                x, y = x0 + c * (S + G_), 88 + r * (S + G_)
                b.append(cell(x, y, S, S, "s", rx=2) if ok else ghost(x, y, S, S, rx=2))
    yl = 88 + 8 * (S + G_) + 30
    b.append(txt(40, yl, "what the triangle made free", "cap"))
    items = ["keeping each token's keys and values once they are made {{fig:v01-o136}}",
             "reusing a cached prefix for every request that shares it {{fig:v01-o044}}",
             "checking several drafted tokens in one pass {{fig:v08-o003}}"]
    for k, s_ in enumerate(items):
        b.append(txt(40, yl + 24 + k * 20, s_, "sub2"))
    body, yb = para(yl + 24 + 3 * 20 + 36, [
        "An ordinary model's attention is causal: each position sees only those before it, the triangle "
        "({{fig:v03-o020}}). That one rule is why a token's keys and values never change once made, so "
        "they can be kept; why a cached prefix stays valid for every request that shares it; and why "
        "drafted tokens can be checked in one pass.",
        "A masked diffusion model fills each blank from both sides, so every position sees every other: the "
        "full square. LLaDA, a published 8-billion-parameter diffusion model, uses no causal mask, and its "
        "authors note it is incompatible with key-value caching. Mercury's report says only that its models "
        "are Transformers trained to predict many tokens in parallel.",
        "So the stack built for one-token-at-a-time decode does not carry over unchanged. A model that "
        "fills in many positions at once is a different problem, and the stack that serves it will look "
        "different too.",
    ])
    emit("n32", stamp(SRT, "A model that fills in many positions at"),
         "Without the causal triangle, the cache tricks stop being free", yb + 30, b + [body],
         "Each of the stack's cache tricks rests on the triangle. Take it away and they have to be rebuilt, "
         "which is the concrete content of a different stack.")


if __name__ == "__main__":
    for fn in (o014, o015, n29, n30, n30w, n31, n32):
        fn()
