"""V6 Part 10, enforcing balance: the part heading s12, Fig 18 (o018) as the overview, then P28 (the
auxiliary loss, built term by term), P29 (where its push lands), P30 (a bias that changes only the
choice), P31 (the controller, a widget) and P32 (a balanced batch of unbalanced sequences).

Sources, read for this build: Fedus, Zoph and Shazeer, Switch Transformers (arXiv 2101.03961), eq. 4-6:
loss = alpha N sum f_i P_i with alpha = 0.01, f not differentiable; Wang et al. 2024 (arXiv 2408.15664),
Algorithm 1: b_i += u sign(mean load - c_i) after each batch, from the previous batch only;
DeepSeek-V3 report §2.1.2 and §4.2: bias only for routing, update speed 0.001, sequence-wise alpha 0.0001.

  python3 figures/V06/src/balance.py      writes s12, o018, p28 ... p32 in figures/V06/items/
"""
import json
from common import (OUT, at, box, cell, dashed, emit, emit_html, f, hd, ln, n, nb, pct, prose, rect, txt)


def s12():
    (OUT / "s12.html").write_text(
        "<div class='sec'><div class='l'>Part 10</div><h2>Enforcing balance</h2>"
        "<p>Two ways to push back, and what neither fixes.</p></div>", encoding="utf-8")
    print("s12 Enforcing balance")


def o018():
    b = [box(40, 55, 285, 78, "u", "The classic fix", "an auxiliary loss, smallest", "when traffic spreads evenly")]
    b.append(box(368, 55, 272, 78, "s", "The newer fix", "a feedback controller", "adjusting a per-expert bias"))
    body, y = prose(178, [
        "The classic fix, introduced by Shazeer and colleagues and refined in the Switch Transformer, adds "
        "a second term to the training loss that is smallest when traffic spreads evenly "
        "({{fig:v06-p28}}). It works through the gradient, so it pulls on the same weights as the "
        "language objective, and costs a little quality on every update ({{fig:v06-p29}}).",
        "DeepSeek's answer, from Wang and colleagues in 2024, stops using a gradient for balance. A "
        "feedback controller nudges a per-expert bias that changes which experts are chosen and nothing "
        "else ({{fig:v06-p30}}), reading only past batches ({{fig:v06-p31}}).",
        "Neither closes the problem. A single sequence can still hammer a few experts while the batch "
        "looks fine ({{fig:v06-p32}}), and serving traffic never quite matches what training balanced "
        "for. Load balancing stays an operational concern, watched and patched at runtime.",
    ])
    emit("o018", at("The classic fix introduced by Shazeer"), "Two ways to enforce balance", y + 32, b + [body],
         "The distinction is whether balance is bought with gradient, and therefore with a little quality, "
         "or with a separate control loop that leaves the objective alone.")


# ---- P28: the auxiliary loss, built term by term ------------------------------------------------
PROBS = [[.80, .10, .05, .05], [.70, .10, .10, .10], [.75, .10, .10, .05], [.60, .20, .10, .10],
         [.65, .10, .15, .10], [.70, .15, .10, .05], [.60, .10, .20, .10], [.30, .50, .10, .10],
         [.25, .10, .55, .10], [.25, .10, .10, .55]]
N, ALPHA = 4, 0.01
T = len(PROBS)
pick = [max(range(N), key=lambda j: r[j]) for r in PROBS]           # Switch sends each token to one expert
fr = [sum(p == j for p in pick) / T for j in range(N)]
P = [sum(r[j] for r in PROBS) / T for j in range(N)]
term = N * sum(a * b for a, b in zip(fr, P))
assert all(abs(sum(r) - 1) < 1e-9 for r in PROBS)
assert fr == [0.7, 0.1, 0.1, 0.1] and [round(v, 3) for v in P] == [0.56, 0.155, 0.155, 0.13]
assert round(term, 3) == 1.744 and abs(sum(P) - 1) < 1e-12


def p28():
    b = [hd(40, 46, "Ten tokens' router shares; each token goes to its largest, lit")]
    CW, CH, G, X0, Y0 = 52, 20, 3, 120, 82
    for j in range(N):
        b.append(txt(X0 + j * (CW + G) + CW / 2, Y0 - 8, f"E{j + 1}", "sub2", "middle"))
    for i, r in enumerate(PROBS):
        y = Y0 + i * (CH + G)
        b.append(txt(40, y + 15, f"token {i + 1}", "cap"))
        for j in range(N):
            b.append(cell(X0 + j * (CW + G), y, CW, CH, "m" if pick[i] == j else "u", label=f"{r[j]:.2f}"))
    yb = Y0 + T * (CH + G) + 10
    rows = [("f: share of tokens sent", [f"{v:.1f}" for v in fr], "count ÷ 10"),
            ("P: average router share", [f"{v:.3f}" for v in P], "column ÷ 10"),
            ("f × P", [f"{a * c:.4f}" for a, c in zip(fr, P)], "")]
    for k, (lab, vals, note) in enumerate(rows):
        y = yb + k * 30
        for j in range(N):
            b.append(cell(X0 + j * (CW + G), y, CW, 22, "s" if k == 2 else "u", label=vals[j]))
        b.append(txt(X0 + N * (CW + G) + 8, y + 16, lab + (f", {note}" if note else ""), "sub2"))
    ys = yb + 3 * 30 + 10
    s_ = sum(a * c for a, c in zip(fr, P))
    b.append(cell(40, ys, 600, 30, "m", rx=6,
                  label=f"N × Σ f × P = 4 × {s_:.3f} = {term:.3f};   × α = {ALPHA} gives {ALPHA * term:.4f}"))
    yC = ys + 64
    b.append(hd(40, yC, "N × Σ f × P for three batches, to scale"))
    cases = [("even traffic", [0.25] * 4, [0.25] * 4), ("this batch", fr, P), ("one expert takes all", [1, 0, 0, 0], [1, 0, 0, 0])]
    vals = []
    for k, (lab, ff, pp) in enumerate(cases):
        v = N * sum(a * c for a, c in zip(ff, pp))
        vals.append(v)
        y = yC + 16 + k * 36
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(rect(220, y, v * 90, 26, "s" if k == 0 else ("m" if k == 1 else "h")))
        b.append(txt(220 + v * 90 + 10, y + 18, f"{v:.2f}", "sub2"))
    assert vals == [1.0, term, 4.0]
    body, y = prose(yC + 16 + 3 * 36 + 44, [
        "The Switch Transformer sends each token to one expert, its largest share. For a batch, f for an "
        "expert is the fraction of tokens it received: a count divided by the number of tokens. P is the "
        "average share the router gave it over the same tokens: its column's mean.",
        "The term multiplies the two expert by expert and adds. With even traffic every f and P is 1/N, "
        "the sum is N × 1/N² = 1/N, and multiplying by N makes it 1 whatever N is. If one expert takes "
        "everything, it is N.",
        f"It is added to the language loss with a weight α. Switch used α = {ALPHA}: large enough to keep "
        "the experts balanced, small enough not to overwhelm the real objective.",
    ])
    emit("p28", at("An auxiliary loss that is smallest"), "The auxiliary loss, built term by term", y + 32,
         b + [body],
         "Bars drawn to scale. One number that grows as traffic piles onto a few experts. Its value matters "
         "less than its slope, which the next figure follows.")


# ---- P29: where the push lands --------------------------------------------------------------------
def p29():
    push = [ALPHA * N * v for v in fr]                  # slope of alpha N sum f P with respect to each P
    assert [round(v, 3) for v in push] == [0.028, 0.004, 0.004, 0.004] and round(push[0] / push[1]) == 7
    b = [hd(40, 46, "α × N × f: the slope of the balancing term for each expert's share, to scale")]
    X0, SC = 150, 9000
    for j in range(N):
        y = 66 + j * 36
        b.append(txt(40, y + 18, f"expert {j + 1}", "cap"))
        b.append(rect(X0, y, push[j] * SC, 26, "h" if j == 0 else "u"))
        b.append(txt(X0 + push[j] * SC + 10, y + 18, f"{ALPHA} × 4 × {fr[j]:.1f} = {push[j]:.3f}", "sub2"))
    yT = 66 + 4 * 36 + 36
    b.append(hd(40, yT, "Two slopes pulling on token 1's share for expert 1"))
    L, R, yl = 120, 600, yT + 52
    b.append(ln(L, yl, R, yl, "axis"))
    for v in (0, 0.5, 1):
        xx = L + v * (R - L)
        b.append(ln(xx, yl - 4, xx, yl + 4, "tick"))
        b.append(txt(xx, yl + 20, f"{v:g}", "sub2", "middle"))
    x80 = L + PROBS[0][0] * (R - L)
    b.append(f'<circle cx="{x80:.1f}" cy="{yl}" r="5" fill="var(--paper)" stroke="var(--m)" stroke-width="2"/>')
    b.append(txt(x80, yl + 20, f"{PROBS[0][0]:.2f}", "sub2", "middle"))
    b.append(f'<line class="conn" x1="{x80 + 8:.1f}" y1="{yl - 16}" x2="{x80 + 70:.1f}" y2="{yl - 16}" marker-end="url(#arw)"/>')
    b.append(txt(x80 + 8, yl - 28, "language loss: up", "sub2"))
    b.append(f'<line class="conn" x1="{x80 - 8:.1f}" y1="{yl - 16}" x2="{x80 - 70:.1f}" y2="{yl - 16}" marker-end="url(#arw)"/>')
    b.append(txt(x80 - 8, yl - 28, "balancing term: down", "sub2", "end"))
    body, y = prose(yl + 66, [
        "Training steps each weight against the slope of the loss ({{fig:v06-p03}}). For the balancing "
        "term the slope with respect to an expert's average share P is α × N × f: in the Switch "
        "Transformer f counts tokens and is held fixed, so only P is pushed.",
        f"So the push is set by traffic. Expert 1 took 70% of the tokens and is pushed "
        f"{push[0] / push[1]:.0f} times harder than each of the others, and the push lowers its share for "
        "every token, including the ones it was genuinely best for.",
        "Token 1 gave expert 1 a share of 0.80. If expert 1 really is the right expert for it, the language "
        "loss pulls that share up while the balancing term pulls it down. The step taken is the sum of "
        "the two, so balance is paid for with a little quality on every update.",
    ])
    emit("p29", at("pushes the router away from that expert anyway"),
         "The balancing push lands hardest on the popular expert, deserved or not", y + 32, b + [body],
         "Bars drawn to scale; the number line is schematic. The balancing gradient knows only how busy an "
         "expert is, never whether it was right, and that is its cost.")


# ---- P30: a bias that changes who is chosen ---------------------------------------------------------
S_ = [.80, .75, .70, .30]
B_ = [-.10, 0, .20, 0]


def top2(v):
    return sorted(range(len(v)), key=lambda i: -v[i])[:2]


def p30():
    sb = [round(a + c, 2) for a, c in zip(S_, B_)]
    raw, biased = top2(S_), top2(sb)
    gate = {i: S_[i] / sum(S_[j] for j in biased) for i in biased}
    assert raw == [0, 1] and biased == [2, 1]
    assert [f(gate[i], 3) for i in (1, 2)] == ["0.517", "0.483"]
    b = [hd(40, 46, "Choose with score + bias; weigh with the score alone")]
    X = [40, 150, 240, 330, 450, 560]
    for x, h in zip(X, ["", "score s", "bias b", "s + b", "chosen", "gate, from s"]):
        b.append(txt(x, 80, h, "sub2"))
    for i in range(4):
        y = 94 + i * 38
        ch = i in biased
        b.append(txt(X[0], y + 19, f"expert {i + 1}", "cap"))
        b.append(cell(X[1], y, 64, 28, "u", label=f"{S_[i]:.2f}"))
        b.append(cell(X[2], y, 64, 28, "s" if B_[i] > 0 else ("h" if B_[i] < 0 else "u"),
                      label=f"{B_[i]:+.2f}".replace("-", "−") if B_[i] else "0"))
        b.append(cell(X[3], y, 64, 28, "m" if ch else "u", label=f"{sb[i]:.2f}"))
        b.append(txt(X[4], y + 19, "yes" if ch else ("would be, without bias" if i in raw else "no"), "sub2"))
        if ch:
            b.append(cell(X[5], y, 64, 28, "m", label=f(gate[i], 3)))
    body, y = prose(94 + 4 * 38 + 48, [
        "DeepSeek V3 adds a bias b to each expert's score, but only when choosing. Selection takes the "
        "top two of s + b; the weight each chosen expert gets in the blend is worked out from s alone, "
        "renormalised over the chosen experts as in {{fig:v06-p20}}.",
        "Expert 1 has been overloaded, so its bias is −0.10; expert 3 has been starved, so +0.20. On the "
        "raw scores this token would go to experts 1 and 2; with the biases it goes to 3 and 2. Expert 3's "
        f"gate still comes from its own score: {nb(f'{S_[2]:.2f} / ({S_[1]:.2f} + {S_[2]:.2f}) = {f(gate[2], 3)}')}.",
        "No gradient flows into b. A controller sets it, the next figure shows how, and the language "
        "objective trains the router's weights exactly as it would without it.",
    ])
    emit("p30", at("Every expert gets a small bias added"), "A bias that changes who is chosen, never how much they count",
         y + 32, b + [body],
         "The bias moves traffic, not answers. That is the whole difference from the auxiliary loss, which "
         "moves the router's own weights to get its balance.")


# ---- P31: the controller, batch by batch (a widget) ---------------------------------------------------
SKEW = [0.05, 0.3, -0.1, 0, 0.2, -0.2, 0.1, -0.05]      # how popular each expert is, made up
NOISE, TOKENS, BATCHES, SEED, E8 = 0.5, 512, 40, 6, 8


def mulberry32(seed):
    """The same small random-number generator the page uses, so both draw identical tokens."""
    a = seed & 0xFFFFFFFF

    def rnd():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = ((a ^ (a >> 15)) * (a | 1)) & 0xFFFFFFFF
        t = ((t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF) ^ t
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296
    return rnd


def controller(u):
    """Each batch: TOKENS tokens, scores = popularity + noise, top two of score + bias. Then every bias
    moves one step u toward balance, using this batch's counts for the next batch only."""
    r = mulberry32(SEED)
    b = [0.0] * E8
    out = []
    for _ in range(BATCHES):
        c = [0] * E8
        for _ in range(TOKENS):
            v = [SKEW[i] + NOISE * (r() + r() - 1) + b[i] for i in range(E8)]
            i1 = 0
            for i in range(1, E8):
                if v[i] > v[i1]:
                    i1 = i
            i2 = 1 if i1 == 0 else 0
            for i in range(E8):
                if i != i1 and v[i] > v[i2]:
                    i2 = i
            c[i1] += 1
            c[i2] += 1
        mean = 2 * TOKENS / E8
        out.append(dict(ratio=max(c) / mean, loads=c, bias=b[:]))
        b = [bi + (u if c[i] < mean else (-u if c[i] > mean else 0)) for i, bi in enumerate(b)]
    return out


CL, CR, CT, CB = 70, 350, 64, 214                       # the chart's box: batches 1-40, ratio 1 to 3
cx = lambda k: CL + (k - 1) / (BATCHES - 1) * (CR - CL)
cy = lambda v: CB - (v - 1) / 2 * (CB - CT)
LX, LS, BXB = 500, 0.36, 452                            # load bars: left edge, px per token; bias column
MARK = [1, 10, 25, 40]

P31_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const SKEW = __SKEW__, NOISE = __NOISE__, TOKENS = __TOKENS__, BATCHES = __BATCHES__, SEED = __SEED__, MARK = __MARK__;
  const CL = __CL__, CR = __CR__, CT = __CT__, CB = __CB__, LX = __LX__, LS = __LS__, U0 = __U0__;
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val'), q = s => fig.querySelector(s);
  const fmt = (v, d = 2) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
  const sfmt = v => v === 0 ? '0' : (v > 0 ? '+' : '−') + Math.abs(v).toFixed(2);
  const cx = k => CL + (k - 1) / (BATCHES - 1) * (CR - CL), cy = v => CB - (v - 1) / 2 * (CB - CT);
  function mulberry32(a) { return function() { a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function run(u) {
    const r = mulberry32(SEED); let b = new Array(8).fill(0); const out = [];
    for (let k = 0; k < BATCHES; k++) {
      const c = new Array(8).fill(0);
      for (let t = 0; t < TOKENS; t++) {
        const v = []; for (let i = 0; i < 8; i++) v.push(SKEW[i] + NOISE * (r() + r() - 1) + b[i]);
        let i1 = 0; for (let i = 1; i < 8; i++) if (v[i] > v[i1]) i1 = i;
        let i2 = i1 === 0 ? 1 : 0; for (let i = 0; i < 8; i++) if (i !== i1 && v[i] > v[i2]) i2 = i;
        c[i1]++; c[i2]++;
      }
      const mean = 2 * TOKENS / 8;
      out.push({ratio: Math.max(...c) / mean, loads: c, bias: b.slice()});
      b = b.map((bi, i) => bi + (c[i] < mean ? u : (c[i] > mean ? -u : 0)));
    }
    return out;
  }
  function draw() {
    const u = +sl.value; val.textContent = fmt(u, 3);
    const h = run(u), last = h[BATCHES - 1];
    q('[data-line]').setAttribute('points', h.map((x, k) => `${cx(k + 1).toFixed(1)},${cy(Math.min(x.ratio, 3)).toFixed(1)}`).join(' '));
    MARK.forEach(k => q(`[data-r="${k}"]`).textContent = fmt(h[k - 1].ratio));
    for (let i = 0; i < 8; i++) {
      const w = Math.max(last.loads[i] * LS, 2), bar = q(`[data-bar="${i}"]`), tx = q(`[data-v="${i}"]`);
      bar.setAttribute('width', w.toFixed(1)); tx.setAttribute('x', (LX + w + 6).toFixed(1));
      tx.textContent = String(last.loads[i]);
      q(`[data-b="${i}"]`).textContent = sfmt(last.bias[i]);
    }
  }
  sl.addEventListener('input', draw);
  q('button').addEventListener('click', () => { sl.value = U0; draw(); });
  draw();
})();</script>"""

U0 = 0.01


def sfmt(v):
    return "0" if v == 0 else ("+" if v > 0 else "−") + f(abs(v))


def p31():
    h0, h = controller(0.0), controller(U0)
    mean = 2 * TOKENS / E8
    assert round(h0[0]["ratio"], 2) == 2.56 and min(x["ratio"] for x in h0) > 2.4
    assert h[24]["ratio"] < 1.2 and h[9]["ratio"] > 2
    b = [hd(40, 34, "The busiest expert's load over the average, batch by batch")]
    b.append(ln(CL, CB, CR, CB, "axis"))
    b.append(ln(CL, CT, CL, CB, "axis"))
    for k in (1, 10, 20, 30, 40):
        b.append(ln(cx(k), CB, cx(k), CB + 4, "tick"))
        b.append(txt(cx(k), CB + 18, str(k), "sub2", "middle"))
    for v in (1, 2, 3):
        b.append(txt(CL - 8, cy(v) + 4, str(v), "sub2", "end"))
    b.append(txt((CL + CR) / 2, CB + 38, "batch", "sub2", "middle"))
    pts = " ".join(f"{cx(k + 1):.1f},{cy(min(x['ratio'], 3)):.1f}" for k, x in enumerate(h))
    b.append(f'<polyline class="pl-m" points="{pts}" data-line=""/>')
    b.append(txt(LX, 52, "loads in batch 40", "sub2"))
    b.append(txt(BXB, 52, "bias", "sub2"))
    last = h[-1]
    for i in range(E8):
        y = 62 + i * 21
        w = max(last["loads"][i] * LS, 2)
        b.append(txt(BXB - 10, y + 13, f"E{i + 1}", "cap", "end"))
        b.append(f'<g class="m"><rect x="{LX}" y="{y}" width="{w:.1f}" height="16" rx="2" data-bar="{i}"/></g>')
        b.append(f'<text class="sub2 halo" x="{LX + w + 6:.1f}" y="{y + 13}" data-v="{i}">{last["loads"][i]}</text>')
        b.append(f'<text class="sub2" x="{BXB}" y="{y + 13}" data-b="{i}">{sfmt(last["bias"][i])}</text>')
    b.append(f'<line class="mark xok" x1="{LX + mean * LS:.1f}" y1="58" x2="{LX + mean * LS:.1f}" y2="{62 + 8 * 21:.1f}"/>')
    b.append(txt(LX + mean * LS, 62 + 8 * 21 + 16, f"average {mean:.0f}", "sub2", "middle"))
    yr = CB + 66
    b.append('<text class="sub2" x="40" y="%d">busiest over average: ' % yr + "; ".join(
        f'batch {k} <tspan data-r="{k}">{f(h[k - 1]["ratio"])}</tspan>' for k in MARK) + "</text>")
    body, yb = prose(yr + 44, [
        f"A toy with made-up numbers: 8 experts, {TOKENS} tokens a batch, each token sent to its top two. "
        "A token's score for an expert is that expert's popularity plus noise, and some experts are far "
        "more popular than others.",
        "After each batch the controller counts what every expert received and moves each bias one step: "
        "up for an expert below the average, down for one above. The biases used in batch 10 come from "
        f"batches 1 to 9 only. With the step at zero the busiest expert carries about "
        f"{f(h0[0]['ratio'], 1)} times the average for ever; at {U0} it is within 20% of it by batch 25. "
        "Every batch is a fresh draw of tokens, so the loads keep jittering.",
        "DeepSeek V3 used a step of 0.001 on its own scores, over hundreds of thousands of batches. The "
        "numbers on the page were checked against the same arithmetic in Python.",
    ])
    title = "The controller, batch by batch"
    ctl = (f"<label>step per batch <input type='range' min='0' max='0.03' step='0.001' value='{U0}'>"
           f"<span class='val'>{f(U0, 3)}</span></label><button type='button'>Reset</button>")
    js = P31_JS
    for k, v in dict(SKEW=json.dumps(SKEW), NOISE=NOISE, TOKENS=TOKENS, BATCHES=BATCHES, SEED=SEED,
                     MARK=json.dumps(MARK), CL=CL, CR=CR, CT=CT, CB=CB, LX=LX, LS=LS, U0=U0).items():
        js = js.replace(f"__{k}__", str(v))
    emit_html("p31", f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; "
              f"{at('After each batch, the controller counts')}</div><h3>{title}</h3><div class='wg'>"
              f"<div class='ctl'>{ctl}</div><svg viewBox='0 0 680 {yb + 26}' role='img'><title>{title}</title>"
              f"{''.join(b)}{body}</svg></div>"
              "<figcaption>A thermostat, not a gradient: count, compare with the average, nudge, repeat. The "
              "language objective never feels it, and the biases settle where the traffic spreads evenly."
              f"</figcaption>{js}</figure>")


# ---- P32: a balanced batch of unbalanced sequences ---------------------------------------------------
def p32():
    seqs = 4
    per_seq = 16 * 2                                     # 16 tokens, two experts each
    grid = [[(per_seq // 2 if e // 2 == s else 0) for e in range(8)] for s in range(seqs)]
    cols = [sum(r[e] for r in grid) for e in range(8)]
    assert all(c == cols[0] for c in cols) and all(sum(1 for v in r if v) == 2 for r in grid)
    b = [hd(40, 46, "Expert assignments in one batch of four sequences, 16 tokens each")]
    CW, CH, G, X0, Y0 = 52, 26, 4, 150, 82
    for e in range(8):
        b.append(txt(X0 + e * (CW + G) + CW / 2, Y0 - 8, f"E{e + 1}", "sub2", "middle"))
    for s in range(seqs):
        y = Y0 + s * (CH + G)
        b.append(txt(40, y + 18, f"sequence {'ABCD'[s]}", "cap"))
        for e in range(8):
            v = grid[s][e]
            if v:
                b.append(cell(X0 + e * (CW + G), y, CW, CH, "m", label=str(v)))
            else:
                b.append(dashed(X0 + e * (CW + G), y, CW, CH))
    yt = Y0 + seqs * (CH + G) + 8
    b.append(txt(40, yt + 18, "the batch", "cap"))
    for e in range(8):
        b.append(cell(X0 + e * (CW + G), yt, CW, CH, "s", label=str(cols[e])))
    body, y = prose(yt + CH + 50, [
        "The controller counts what each expert received over a whole batch. Here every expert received "
        f"{cols[0]} assignments: a perfect batch, and the controller would leave every bias alone.",
        "Yet each sequence used only 2 of the 8 experts. A sequence about code, or about one language, "
        "can send its tokens to the same few experts all the way through, and inside that sequence two "
        "experts do all the work while the batch average looks fine.",
        "DeepSeek V3 adds a small sequence-level balance term to its training loss, weighted 0.0001, "
        "just to avoid extreme imbalance within any single sequence. And serving traffic never quite "
        "matches what training balanced for.",
    ])
    emit("p32", at("A single sequence can still hammer"), "A batch can look balanced while each sequence is not",
         y + 32, b + [body],
         "Balance is a property of whatever you average over. A batch can be perfect while every sequence "
         "in it is lopsided, which is why balancing stays an operational job.")


if __name__ == "__main__":
    for fn in (s12, o018, p28, p29, p30, p31, p32):
        fn()
