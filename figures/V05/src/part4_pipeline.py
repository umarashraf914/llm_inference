"""V5 Part 4, pipeline parallelism: N19-N24 of plans/depth_pass/V05_review.md, with Figs 11-14
rebuilt (Fig 12 after N21, Fig 13 redrawn at its true values with its caption corrected).

The schedule in N22 and N23 is simulated, slot by slot, by simulate() below; the widget runs the
same simulation in JavaScript and was compared with this one in a browser.

  python3 figures/V05/src/part4_pipeline.py     writes items o011-o014, n19-n24
"""
import json
from v05common import *  # noqa: F401,F403

STAGES = 4
WORDS = {3: "three", 7: "seven"}
LAYERS_PER_STAGE = LAYERS // STAGES
assert LAYERS_PER_STAGE == 20


def simulate(p, m, v):
    """Forward-only pipeline: m microbatches through p GPUs, each GPU holding v chunks of layers.
    One task is one chunk of one microbatch on one GPU, one time unit long. A GPU runs the ready task
    with the lowest (round, microbatch). Returns grid[gpu][t] = (microbatch, round) or None."""
    done, grid = {}, [[] for _ in range(p)]
    todo = {(i, r, s) for i in range(m) for r in range(v) for s in range(p)}
    t = 0
    while todo:
        for s in range(p):
            ready = [k for k in todo if k[2] == s and
                     (lambda d: d is None or done.get(d, 1e9) <= t)(
                         (k[0], k[1], s - 1) if s else ((k[0], k[1] - 1, p - 1) if k[1] else None))]
            if ready:
                k = min(ready, key=lambda k: (k[1], k[0]))
                grid[s].append((k[0], k[1]))
                todo.discard(k)
                done[k] = t + 1
            else:
                grid[s].append(None)
        t += 1
    return grid


def bubble(p, m, v=1):
    return (p - 1) / (v * m + p - 1)


for _p in range(2, 9):                                  # the formula is the count, when m >= p
    for _m in range(_p, 33):
        for _v in range(1, 5):
            _g = simulate(_p, _m, _v)
            assert len(_g[0]) == _v * _m + _p - 1
            assert all(sum(c is not None for c in row) == _v * _m for row in _g)


def lanes(x0, y0, grid, slot, lab=None, idle_numbers=False, ch=26, gap=4):
    """Draw a lane chart: busy slots as cells, idle slots dashed."""
    o, k = [], 0
    for s, row in enumerate(grid):
        for t, c in enumerate(row):
            x, y = x0 + t * slot, y0 + s * (ch + gap)
            if c is None:
                k += 1
                o.append(ghost(x, y, slot - 4, ch, label=str(k) if idle_numbers else None))
            else:
                o.append(cell(x, y, slot - 4, ch, "m", label=lab(c) if lab else None))
    return o


# ---- Fig 11: one message per stage boundary ------------------------------------------------------
def o011():
    b = [cont(40, 40, 600, 120, "u", "Four stages, like stations on an assembly line")]
    for k in range(STAGES):
        x = 66 + k * 145
        b.append(cell(x, 92, 120, 44, "s",
                      label=f"layers {k * LAYERS_PER_STAGE + 1}–{(k + 1) * LAYERS_PER_STAGE}"))
        if k < STAGES - 1:
            b.append(arr(x + 122, 114, x + 142, 114))
    X0 = 160
    b.append(hd(40, 196, "Exchanges per token, one mark each"))
    b.append(txt(40, 230, "tensor", "cap"))
    for k in range(2 * LAYERS):
        b.append(cell(X0 + k * 3, 216, 2, 18, "h", rx=0))
    b.append(txt(X0, 252, "160 all-reduces, every GPU in the group each time", "sub2"))
    b.append(txt(40, 290, "pipeline", "cap"))
    for k in range(STAGES - 1):
        b.append(cell(X0 + k * 3, 276, 2, 18, "h", rx=0))
    b.append(txt(X0 + 20, 290, "3 handoffs, each to one neighbour", "sub2"))
    body, yb = prose(338, [
        "Pipeline parallelism splits the model the obvious way, by layers: each GPU group takes one "
        "contiguous block, like stations on an assembly line. A batch flows through stage one, which "
        "hands its output activations to stage two, and on down the line.",
        "Compare the traffic with what came before. Tensor parallelism synchronised every GPU twice "
        "inside every layer, 160 times per token. A pipeline stage speaks once, at its own boundary, "
        "to one neighbour: a single point-to-point message, three per token across four stages.",
    ])
    emit("o011", stamp(SRT, "Pipeline parallelism splits the model"),
         "A pipeline stage speaks once, to one neighbour", yb + 26, b + [body],
         "One mark per exchange, so the rows are to scale. How often is half the difference between "
         "the two strategies; how much, next, is the other half.")


# ---- N19: sixteen kilobytes per token ------------------------------------------------------------
def n19():
    tp = 2 * LAYERS * 2 * 7 / 8 * VEC
    pp = VEC
    stage_gb = WEIGHT_BYTES / STAGES / 1e9
    hop_us = pp / NET_EACH_WAY * 1e6
    assert tp == 4_587_520 and tp / pp == 280 and stage_gb == 35 and f(hop_us, 2) == "0.33"
    L0, L1, X0, X1 = 1e3, 1e7, 200, 640
    lx = lambda v: log_px(v, L0, L1, X0, X1)
    b = [hd(40, 40, "Bytes one GPU sends per token in decode, on a log scale")]
    for k, lab in enumerate(["1 KB", "10 KB", "100 KB", "1 MB", "10 MB"]):
        x = lx(10 ** (3 + k))
        b.append(ln(x, 58, x, 140, "axis"))
        b.append(txt(x, 156, lab, "sub2", "middle" if 0 < k < 4 else ("start" if k == 0 else "end")))
    b.append(txt(40, 78, "tensor, 8 GPUs", "cap"))
    b.append(cell(X0, 60, lx(tp) - X0, 28, "h", label=f"{n(tp)} bytes"))
    b.append(txt(40, 120, "pipeline, 4 stages", "cap"))
    b.append(cell(X0, 102, lx(pp) - X0, 28, "s", label=f"{n(pp)} bytes"))
    b.append(txt(lx(pp) + 10, 120, f"{tp / pp:.0f} times less, sent once", "sub2 halo"))
    body, yb = prose(200, [
        "What crosses a stage boundary is the residual stream: one vector of 8,192 numbers per token "
        "({{fig:v01-o099}}), 16 KB at 2 bytes each. That is the whole of a pipeline stage's "
        "conversation.",
        f"A tensor-parallel GPU sends {n(tp)} bytes per token ({{{{fig:v05-n16}}}}); a pipeline stage "
        f"sends {n(pp)}, {tp / pp:.0f} times less, in one message instead of 160. Each stage holds a "
        f"quarter of the layers, 140 ÷ 4 = {stage_gb:.0f} GB of weights.",
        f"Over the 50 GB/s network, 16 KB takes {f(hop_us, 2)} µs to transmit. Traffic that thin "
        "can afford the slow boundary between boxes.",
    ])
    emit("n19", stamp(SRT, "A pipeline stage speaks once"),
         "A pipeline handoff is sixteen kilobytes per token", yb + 26, b + [body],
         "Log scale; on a linear one the pipeline's bar would be 1/280 of the tensor bar, a sliver. "
         "This ratio, more than anything, is why the two strategies live on different hardware.")


# ---- N20: the handoff hides ----------------------------------------------------------------------
def n20():
    batch = 32
    read_ms = WEIGHT_BYTES / STAGES / H100_HBM * 1e3
    hop_us = batch * VEC / NET_EACH_WAY * 1e6
    assert f(read_ms, 1) == "10.4" and f(hop_us, 1) == "10.5" and round(read_ms * 1e3 / hop_us) == 996
    X0, W, TW = 130, 120, 26                      # compute block, transfer block (schematic)
    LY = {"stage 1": 62, "the wire": 98, "stage 2": 134}
    b = [hd(40, 40, "Three microbatches; lengths schematic")]
    for lab, y in LY.items():
        b.append(txt(40, y + 18, lab, "cap"))
    for k in range(4):
        x = X0 + k * (W + 4)
        b.append(cell(x, LY["stage 1"], W, 26, "m", label=f"microbatch {k + 1}"))
    for k in range(3):
        x = X0 + (k + 1) * (W + 4)
        b.append(cell(x, LY["the wire"], TW, 26, "h", label=str(k + 1)))
        b.append(cell(x + TW + 4, LY["stage 2"], W, 26, "m", label=f"microbatch {k + 1}"))
    b.append(ghost(X0, LY["stage 2"], W + TW + 4, 26, label="waiting"))
    b.append(txt(X0 + W + 4, 186, "microbatch 1 crosses while stage 1 starts microbatch 2", "sub2"))
    body, yb = prose(232, [
        "The stage sends one batch's activations onward while it computes the next, so the transfer "
        "adds almost no wall-clock time. Nothing got faster; the wait was covered with other work "
        "({{fig:v02-o055}}), the same overlap as an asynchronous copy ({{fig:v03-o072}}).",
        f"The sizes, for a batch of {batch} decode tokens: stage 1 reads its 35 GB of weights in "
        f"35 ÷ 3,350 GB/s = {f(read_ms, 1)} ms, while the handoff of {batch} × 16 KB = 0.5 MB takes "
        f"{f(hop_us, 1)} µs over the network. The transfer is a thousand times shorter than the work "
        "it hides behind.",
    ])
    emit("n20", stamp(SRT, "Traffic that thin is easy to hide"),
         "The handoff hides behind the next microbatch", yb + 26, b + [body],
         "Lengths schematic: to scale, each transfer would be a thousandth of a compute block. That is "
         "what makes pipeline parallelism the natural way to span nodes.")


# ---- N21: one batch, four stages -----------------------------------------------------------------
def n21():
    g = simulate(STAGES, 1, 1)
    idle = sum(c is None for row in g for c in row)
    assert len(g[0]) == 4 and idle == 12 and bubble(4, 1) == 0.75
    X0, SL = 130, 100
    b = [hd(40, 40, "Four stages, one batch, four time slots")]
    for s in range(STAGES):
        b.append(txt(40, 62 + s * 30 + 18, f"stage {s + 1}", "cap"))
    b += lanes(X0, 62, g, SL, lab=lambda c: "the batch")
    b.append(txt(X0, 202, "fill", "sub2"))
    b.append(txt(X0 + 4 * SL - 4, 202, "drain", "sub2", "end"))
    body, yb = prose(246, [
        "While stage one works on the batch, every stage after it sits idle waiting for work to "
        "arrive. By the time the batch reaches the last stage, the early stages have already run "
        "dry. Fill at the start, drain at the end: that idle time is the pipeline bubble.",
        f"With one batch and four stages each stage works one slot in four: {idle} of 16 cells are "
        f"empty, {bubble(4, 1):.0%}.",
    ])
    emit("n21", stamp(SRT, "Spanning nodes cheaply has a cost"),
         "One batch through four stages leaves three quarters idle", yb + 26, b + [body],
         "Four GPUs bought, one working at a time. Spanning nodes cheaply has a cost, and the fix is to "
         "cut the batch up.")


# ---- Fig 12: microbatches ------------------------------------------------------------------------
def o012():
    g = simulate(STAGES, 4, 1)
    idle = sum(c is None for row in g for c in row)
    assert len(g[0]) == 7 and idle == 12
    X0, SL = 130, 72
    b = [hd(40, 40, "Four stages, four microbatches, numbered")]
    for s in range(STAGES):
        b.append(txt(40, 62 + s * 30 + 18, f"stage {s + 1}", "cap"))
    b += lanes(X0, 62, g, SL, lab=lambda c: str(c[0] + 1))
    b.append(txt(X0, 202, "fill", "sub2"))
    b.append(txt(X0 + 7 * SL - 4, 202, "drain", "sub2", "end"))
    body, yb = prose(246, [
        "The fix is microbatches. Break the batch into smaller slices and feed them in one after "
        "another: while stage 2 works on microbatch 1, stage 1 is already on microbatch 2, so "
        "several are in flight at once and every stage is busy most of the time.",
        f"Empty cells: {idle} of {4 * 7}, against 12 of 16 with one batch. The fill and drain "
        "triangles are the same size as before; what grew is the work between them.",
    ])
    emit("o012", stamp(SRT, "The fix is microbatches"), "Microbatches keep the stages busy",
         yb + 26, b + [body],
         "Numbers are microbatches. The bubble did not shrink in slots, only as a share of the run.")


# ---- N22: the bubble formula, by counting (widget) -----------------------------------------------
W22, P0, M0, V0 = 520, 4, 4, 1

WIDGET22 = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const C = __C__;
  const sl = [...fig.querySelectorAll('input[type=range]')], val = [...fig.querySelectorAll('.val')];
  const q = s => fig.querySelector(s), NS = 'http://www.w3.org/2000/svg';
  const fmt = (v, d) => { const s = Math.abs(v).toFixed(d), [i, p] = s.split('.');
    return (v < 0 && +s !== 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (p ? '.' + p : ''); };
  function simulate(p, m, v) {
    const done = new Map(), grid = Array.from({length: p}, () => []);
    let todo = [];
    for (let i = 0; i < m; i++) for (let r = 0; r < v; r++) for (let s = 0; s < p; s++) todo.push([i, r, s]);
    const key = (i, r, s) => `${i},${r},${s}`;
    let t = 0;
    while (todo.length) {
      const pick = [];
      for (let s = 0; s < p; s++) {
        let best = null;
        for (const k of todo) {
          if (k[2] !== s) continue;
          const d = s ? key(k[0], k[1], s - 1) : (k[1] ? key(k[0], k[1] - 1, p - 1) : null);
          if (d !== null && !(done.has(d) && done.get(d) <= t)) continue;
          if (!best || k[1] < best[1] || (k[1] === best[1] && k[0] < best[0])) best = k;
        }
        grid[s].push(best ? [best[0], best[1]] : null);
        if (best) pick.push(best);
      }
      for (const k of pick) { done.set(key(...k), t + 1); }
      todo = todo.filter(k => !pick.includes(k));
      t++;
    }
    return grid;
  }
  function el(tag, at, txt) { const e = document.createElementNS(NS, tag);
    for (const a in at) e.setAttribute(a, at[a]); if (txt !== undefined) e.textContent = txt; return e; }
  function draw() {
    const p = +sl[0].value, m = +sl[1].value, v = +sl[2].value;
    val[0].textContent = p; val[1].textContent = m; val[2].textContent = v;
    const g = simulate(p, m, v), T = g[0].length, slot = C.W / T, layer = q('[data-chart]');
    const ch = Math.min(26, Math.floor((C.H - (p - 1) * 4) / p));
    layer.replaceChildren();
    let k = 0;
    for (let s = 0; s < p; s++) {
      const y = C.Y0 + s * (ch + 4);
      layer.appendChild(el('text', {class: 'cap', x: 40, y: (y + ch / 2 + 4).toFixed(1)}, `GPU ${s + 1}`));
      for (let t = 0; t < T; t++) {
        const c = g[s][t], x = C.X0 + t * slot, w = Math.max(slot - (slot > 8 ? 4 : 1), 0.5);
        if (c === null) {
          k++;
          layer.appendChild(el('rect', {x: x.toFixed(1), y, width: w.toFixed(1), height: ch, rx: 3,
            fill: 'none', stroke: 'var(--rule)', 'stroke-width': 1, 'stroke-dasharray': '3 3'}));
          if (slot >= 18 && ch >= 16) layer.appendChild(el('text', {class: 'sub2', x: (x + w / 2).toFixed(1),
            y: (y + ch / 2).toFixed(1), 'text-anchor': 'middle', 'dominant-baseline': 'central'}, k));
        } else {
          const gr = el('g', {class: 'm'});
          gr.appendChild(el('rect', {x: x.toFixed(1), y, width: w.toFixed(1), height: ch, rx: slot > 8 ? 3 : 0}));
          if (slot >= 18 && ch >= 16) gr.appendChild(el('text', {class: 'sub', x: (x + w / 2).toFixed(1),
            y: (y + ch / 2).toFixed(1), 'text-anchor': 'middle', 'dominant-baseline': 'central'},
            c[0] + 1 + (c[1] ? '′'.repeat(c[1]) : '')));
          layer.appendChild(gr);
        }
      }
    }
    const busy = v * m, idle = T - busy, sim = idle / T, form = (p - 1) / (v * m + p - 1);
    q('[data-count]').textContent = `each GPU: ${busy} busy slots of ${T}, so ${idle} idle: ${fmt(100 * sim, 1)}%`;
    q('[data-formula]').textContent = `(p − 1) ÷ (v·m + p − 1) = ${p - 1} ÷ ${v * m + p - 1} = ${fmt(100 * form, 1)}%`
      + (Math.abs(sim - form) > 1e-12 ? ', but only when m ≥ p' : '');
  }
  sl.forEach(s => s.addEventListener('input', draw));
  q('button').addEventListener('click', () => { sl[0].value = C.p0; sl[1].value = C.m0; sl[2].value = C.v0; draw(); });
  draw();
})();</script>"""


def n22_readout(p, m, v):
    g = simulate(p, m, v)
    T = len(g[0])
    busy, idle = v * m, len(g[0]) - v * m
    sim, form = idle / T, bubble(p, m, v)
    count = f"each GPU: {busy} busy slots of {T}, so {idle} idle: {f(100 * sim, 1)}%"
    formula = (f"(p − 1) ÷ (v·m + p − 1) = {p - 1} ÷ {v * m + p - 1} = {f(100 * form, 1)}%"
               + (", but only when m ≥ p" if abs(sim - form) > 1e-12 else ""))
    return g, count, formula


def n22():
    X0, Y0, H = 120, 52, 4 * 26 + 3 * 4
    g, count, formula = n22_readout(P0, M0, V0)
    assert count == "each GPU: 4 busy slots of 7, so 3 idle: 42.9%"
    slot = W22 / len(g[0])
    chart = [txt(40, Y0 + s * 30 + 17, f"GPU {s + 1}", "cap") for s in range(P0)]
    chart += lanes(X0, Y0, g, slot, lab=lambda c: str(c[0] + 1), idle_numbers=True)
    s = [hd(40, 34, "Every empty slot of the schedule, counted"),
         f'<g data-chart="">{"".join(chart)}</g>',
         f'<text class="sub2" x="{X0}" y="{Y0 + H + 24}" data-count="">{esc(count)}</text>',
         f'<text class="sub2" x="{X0}" y="{Y0 + H + 44}" data-formula="">{esc(formula)}</text>']
    body, yb = prose(Y0 + H + 92, [
        "Count the cells. Every microbatch must visit every stage, so each stage is busy m slots. The "
        "last microbatch enters stage 1 in slot m and needs p − 1 more slots to reach the last "
        "stage, so the run lasts m + p − 1 slots, and each stage is idle for p − 1 of them. The idle "
        "share is (p − 1) ÷ (m + p − 1): 3 ÷ 7 = 43% for four stages and four microbatches.",
        "Filling and draining is a fixed cost, roughly one trip through the stages, while the useful "
        "work grows with every extra microbatch. Give each GPU v chunks of layers and every slot "
        "shrinks to 1/v: the run is v·m + p − 1 short slots, of which v·m are busy.",
        "The chart is a slot-by-slot simulation of the schedule, and its count matches the formula "
        "whenever there are at least as many microbatches as GPUs. Both were checked against the "
        "same simulation in Python.",
    ])
    s.append(body)
    ctl = [f"<label>GPUs, p <input type='range' min='2' max='8' step='1' value='{P0}'>"
           f"<span class='val'>{P0}</span></label>"
           f"<label>microbatches, m <input type='range' min='1' max='32' step='1' value='{M0}'>"
           f"<span class='val'>{M0}</span></label>",
           f"<label>chunks per GPU, v <input type='range' min='1' max='4' step='1' value='{V0}'>"
           f"<span class='val'>{V0}</span></label><button type='button'>Reset</button>"]
    C = {"W": W22, "X0": X0, "Y0": Y0, "H": H, "p0": P0, "m0": M0, "v0": V0}
    js = WIDGET22.replace("__C__", json.dumps(C))
    emit_raw("n22", widget("n22", stamp(SRT, "The reason more micro batches help"),
                           "The bubble formula is a count of empty cells", ctl, yb + 24, s,
                           "Dashed cells are idle and numbered; a prime marks a microbatch's second "
                           "chunk. More microbatches never empty the fill and drain triangles, they "
                           "only dilute them.", js))


# ---- Fig 13: what microbatching buys -------------------------------------------------------------
def o013():
    ms_ = [4, 8, 16, 32]
    bb = [bubble(4, m) for m in ms_]
    pts = [round(100 * (a - b)) for a, b in zip(bb, bb[1:])]
    share = [1 - b / a for a, b in zip(bb, bb[1:])]
    assert [f(100 * x, 0) for x in bb] == ["43", "27", "16", "9"] and pts == [16, 11, 7]
    assert share[0] < share[1] < share[2] < 0.5 and f(bb[2] / bb[3], 2) == "1.84"
    X0, TR = 220, 300                                  # the track is 100%
    b = [hd(40, 40, "Share of the run spent idle, four stages; the dashed track is 100%")]
    for k, (m, v) in enumerate(zip(ms_, bb)):
        y = 60 + k * 44
        b.append(txt(40, y + 19, f"{m} microbatches", "cap"))
        b.append(ghost(X0, y, TR, 28))
        b.append(cell(X0, y, v * TR, 28, "h"))
        b.append(txt(X0 + TR + 12, y + 19, f"{f(100 * v, 0)}% idle  ({3} ÷ {m + 3})", "sub2"))
    body, yb = prose(266, [
        f"Four stages throughout. Fed four microbatches the stages idle 3 ÷ 7 = {f(100 * bb[0], 0)}% "
        f"of the time; eight, 3 ÷ 11 = {f(100 * bb[1], 0)}%; sixteen, 3 ÷ 19 = {f(100 * bb[2], 0)}%; "
        f"thirty-two, 3 ÷ 35 = {f(100 * bb[3], 0)}%.",
        f"Each doubling removes fewer points, {pts[0]}, then {pts[1]}, then {pts[2]}, yet a larger "
        f"share of what is left: {f(100 * share[0], 0)}%, {f(100 * share[1], 0)}%, "
        f"{f(100 * share[2], 0)}%. Once microbatches far outnumber stages the bubble is about "
        "(p\u00a0−\u00a01)\u00a0÷\u00a0m, so each doubling nearly halves it.",
    ])
    emit("o013", stamp(SRT, "Four stages fed four micro batches"),
         "More microbatches shrink the bubble, never to zero", yb + 26, b + [body],
         "Bars to scale against a 100% track. Going from 4 to 8 takes the bubble from 43% to 27%; "
         "going from 16 to 32 nearly halves it. It never reaches zero.")


# ---- N23: interleaved chunks ---------------------------------------------------------------------
def n23():
    g1, g2 = simulate(4, 4, 1), simulate(4, 4, 2)
    assert len(g1[0]) == 7 and len(g2[0]) == 11
    assert f(100 * bubble(4, 4, 1), 0) == "43" and f(100 * bubble(4, 4, 2), 0) == "27"
    assert bubble(4, 4, 2) == bubble(4, 8, 1)
    msgs1, msgs2 = STAGES - 1, STAGES * 2 - 1
    assert (msgs1, msgs2) == (3, 7)
    X0, SL = 130, 60
    b = [hd(40, 40, "One block per GPU: layers 1–20 on GPU 1, 21–40 on GPU 2, and so on")]
    for s in range(STAGES):
        b.append(txt(40, 60 + s * 30 + 18, f"GPU {s + 1}", "cap"))
    b += lanes(X0, 60, g1, SL, lab=lambda c: str(c[0] + 1))
    b.append(txt(X0 + 7 * SL + 6, 120, "7 slots, 43% idle", "sub2"))
    b.append(hd(40, 210, "Two chunks per GPU: 1–10 and 41–50 on GPU 1, 11–20 and 51–60 on GPU 2…"))
    for s in range(STAGES):
        b.append(txt(40, 228 + s * 30 + 18, f"GPU {s + 1}", "cap"))
    b += lanes(X0, 228, g2, SL / 2, lab=lambda c: str(c[0] + 1) + ("′" if c[1] else ""))
    b.append(txt(X0 + 11 * SL / 2 + 6, 288, "11 half-slots, 27% idle", "sub2"))
    body, yb = prose(380, [
        "One more trick comes from the training world. Give each GPU several short, non-contiguous "
        "chunks of layers instead of one block: with two chunks, GPU 1 holds layers 1–10 and 41–50. "
        "A microbatch now goes round the GPUs twice, in steps half as long, so the pipeline fills "
        "and drains in smaller steps.",
        "Four GPUs and four microbatches: the run is 11 half-slots instead of 7 whole ones, and idle "
        "falls from 3 ÷ 7 = 43% to 3 ÷ 11 = 27%, the same as doubling the microbatches. The price is "
        f"more messages between stages: each microbatch crosses {WORDS[msgs2]} boundaries instead of "
        f"{WORDS[msgs1]}.",
    ])
    emit("n23", stamp(SRT, "Give each GPU several short"),
         "Two short chunks per GPU shrink the bubble from 43% to 27%", yb + 26, b + [body],
         "Both charts on one time scale; a prime marks a microbatch's second lap. The same trade as "
         "everywhere in parallelism: a smaller bubble, paid for in messages.")


# ---- Fig 14: the bubble depends on the phase -----------------------------------------------------
def o014():
    b = [box(40, 55, 285, 78, "s", "Prefill", "thousands of tokens in one pass,", "plenty to slice into microbatches"),
         box(368, 55, 272, 78, "h", "Decode", "one token at a time,", "nothing to slice")]
    body, yb = prose(176, [
        "The bubble is not the same size for every job, because serving has two very different "
        "phases ({{fig:v01-o109}}). Prefill reads the whole prompt at once, maybe thousands of "
        "tokens in one compute-heavy pass: plenty of work to slice into microbatches, so the pipe "
        "fills and the bubble stays small.",
        "Decode is the opposite. Each new token depends on the one before it, so a single request "
        "can only move through the pipeline one tiny step at a time, and the stages spend most of "
        "their time waiting.",
    ])
    emit("o014", stamp(SRT, "The bubble is not the same size"),
         "The bubble depends on the phase", yb + 26, b + [body],
         "The prefill and decode split of V1, reappearing as a scheduling constraint. "
         "It becomes the whole subject of V7, Serving in Production.")


# ---- N24: decode in a pipeline -------------------------------------------------------------------
def n24():
    X0, SL = 130, 60
    # one request: token k+1 enters stage 1 only after token k leaves stage 4
    one = [[None] * 8 for _ in range(STAGES)]
    for tok in range(2):
        for s in range(STAGES):
            one[s][tok * STAGES + s] = (tok, 0)
    busy_one = sum(c is not None for c in one[0]) / 8
    # four requests: A, B, C, D take turns, each token still waiting for its own previous one
    four = [[None] * 8 for _ in range(STAGES)]
    for t in range(8):
        for s in range(STAGES):
            k = t - s
            if k >= 0:
                four[s][t] = (k // 4, k % 4)
    for s in range(STAGES):
        for t in range(8):
            if four[s][t]:
                tok, req = four[s][t]
                if tok:                                 # this request's previous token left stage 4
                    assert t > (tok - 1) * 4 + req + STAGES - 1
    assert busy_one == 0.25 and all(c is not None for c in four[3][3:])
    b = [hd(40, 40, "One request: each token waits for the one before it")]
    for s in range(STAGES):
        b.append(txt(40, 60 + s * 30 + 18, f"stage {s + 1}", "cap"))
    b += lanes(X0, 60, one, SL, lab=lambda c: f"t{c[0] + 1}")
    b.append(hd(40, 210, "Four requests in flight: A, B, C and D take turns"))
    for s in range(STAGES):
        b.append(txt(40, 228 + s * 30 + 18, f"stage {s + 1}", "cap"))
    b += lanes(X0, 228, four, SL, lab=lambda c: "ABCD"[c[1]] + str(c[0] + 1))
    body, yb = prose(380, [
        "With one request, token 2 cannot enter stage 1 until token 1 has left stage 4 "
        "({{fig:v01-o110}}). Each stage works one slot in four, 25%, however the work is sliced.",
        "The fix is to fill the pipe with other people's tokens. With four requests in flight, while "
        "stage 4 finishes A's token, stage 1 is already on B's; once filled, every stage is busy in "
        "every slot. Continuous batching folds new requests in as old ones finish, keeping every "
        "stage fed ({{fig:v07-o006}}).",
        "Modern stacks go further and run prefill and decode on separate GPU pools, each with its own "
        "parallelism, so the heavy prompt work never stalls the token-by-token stream "
        "({{fig:v07-o010}}).",
    ])
    emit("n24", stamp(SRT, "Decode is the opposite"),
         "In decode, one request keeps one stage busy in four", yb + 26, b + [body],
         "Letters are requests, numbers their tokens. A pipeline serves decode well only when at least "
         "as many requests are in flight as there are stages.")


if __name__ == "__main__":
    for fn in (o011, n19, n20, n21, o012, n22, o013, n23, o014, n24):
        fn()
