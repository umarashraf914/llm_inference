"""V5 Part 8, the ring all-reduce step by step: N36-N40 of plans/depth_pass/V05_review.md, with Fig 21
rebuilt as the obvious ways to sum, Fig 22 rebuilt as the count, and a stepper widget (n38w) that runs
the whole ring for any group of two to eight GPUs.

The four-GPU data are N3's: GPU k holds [1, 2, 3, 4] × 10^(k−1), so each digit of a sum says whose
contribution has arrived. ring() below is the algorithm; the widget's script runs the same steps.

  python3 figures/V05/src/part8_ring.py     writes items o021, o022, n36-n40, n38w
"""
import json
from v05common import *  # noqa: F401,F403
from part2_exchange import DATA, SUM, grid, gw

G = 4


def ring(n, start):
    """Run a ring all-reduce on n GPUs. start[g][j] is GPU g's value for slice j; values must add.
    Returns the list of steps, each (phase, sends, state after), sends being (from, to, slice, value)."""
    have = [row[:] for row in start]
    done = [[False] * n for _ in range(n)]
    steps = []
    for t in range(1, n):                               # reduce-scatter: add, pass it on
        sends = [(g, (g + 1) % n, (g - t) % n, have[g][(g - t) % n]) for g in range(n)]
        for a, z, j, v in sends:
            have[z][j] = have[z][j] + v
        steps.append(("reduce-scatter", sends, [row[:] for row in have]))
    for g in range(n):
        done[g][g] = True                               # GPU g has finished slice g
    for t in range(1, n):                               # all-gather: copy the finished slices on
        sends = [(g, (g + 1) % n, (g - t + 1) % n, have[g][(g - t + 1) % n]) for g in range(n)]
        for a, z, j, v in sends:
            assert done[a][j]
            have[z][j] = v
            done[z][j] = True
        steps.append(("all-gather", sends, [row[:] for row in have]))
    return steps


STEPS = ring(G, DATA)
assert [v for *_, v in STEPS[0][1]] == [4, 10, 200, 3000]
assert [v for *_, v in STEPS[1][1]] == [3003, 44, 110, 2200]
assert [v for *_, v in STEPS[2][1]] == [2202, 3033, 444, 1110]
assert all(STEPS[2][2][g][g] == SUM[g] for g in range(G))
assert all(row == SUM for row in STEPS[-1][2])
assert len(STEPS) == 2 * (G - 1)


# ---- Fig 21: the obvious ways --------------------------------------------------------------------
def o021():
    N = 8
    plans = [("everyone to everyone", N - 1, "each GPU sends its whole vector to the other 7"),
             ("one collector", 2 * (N - 1), "7 vectors in and 7 sums out, on one GPU's link"),
             ("whole vectors round a ring", N - 1, "every vector passed on until all have seen it"),
             ("the ring all-reduce", 2 * (N - 1) / N, "derived in the next four figures")]
    assert [p[1] for p in plans] == [7, 14, 7, 1.75]
    b = [hd(40, 40, "Three obvious plans, drawn for four GPUs")]
    PX = [40, 253, 466]
    for k, (name, _, _) in enumerate(plans[:3]):
        b.append(txt(PX[k], 66, f"{'abc'[k]}. {name}", "sub2"))
    BW, BH = 34, 22

    def gpu(x, y, k):
        b.append(cell(x, y, BW, BH, "u", label=f"G{k}"))
        return x, y
    # a: four corners, every pair joined
    x0, y0 = PX[0] + 20, 80
    corners = [(x0, y0), (x0 + 110, y0), (x0 + 110, y0 + 70), (x0, y0 + 70)]
    for k, (x, y) in enumerate(corners):
        gpu(x, y, k + 1)
    pairs = [(0, 1), (1, 2), (2, 3), (3, 0), (0, 2), (1, 3)]
    for a, z in pairs:
        (xa, ya), (xz, yz) = corners[a], corners[z]
        ax, ay = xa + BW / 2, ya + BH / 2
        zx, zy = xz + BW / 2, yz + BH / 2
        dx, dy = zx - ax, zy - ay
        L = (dx * dx + dy * dy) ** 0.5
        tx = min(abs((BW / 2 + 4) / dx) if dx else 9e9, abs((BH / 2 + 4) / dy) if dy else 9e9)
        b.append(f'<line class="conn" x1="{ax + dx * tx:.1f}" y1="{ay + dy * tx:.1f}" '
                 f'x2="{zx - dx * tx:.1f}" y2="{zy - dy * tx:.1f}" marker-start="url(#arw)" marker-end="url(#arw)"/>')
    # b: one collector in the middle
    cx, cy = PX[1] + 72, 115
    gpu(cx, cy, 1)
    around = [(PX[1] + 2, 80), (PX[1] + 142, 80), (PX[1] + 72, 160)]
    for k, (x, y) in enumerate(around):
        gpu(x, y, k + 2)
    b.append(f'<line class="conn" x1="{PX[1] + 38}" y1="102" x2="{cx - 2}" y2="{cy + 4}" '
             f'marker-start="url(#arw)" marker-end="url(#arw)"/>')
    b.append(f'<line class="conn" x1="{PX[1] + 140}" y1="102" x2="{cx + BW + 2}" y2="{cy + 4}" '
             f'marker-start="url(#arw)" marker-end="url(#arw)"/>')
    b.append(f'<line class="conn" x1="{cx + BW / 2}" y1="{cy + BH + 4}" x2="{cx + BW / 2}" y2="156" '
             f'marker-start="url(#arw)" marker-end="url(#arw)"/>')
    # c: whole vectors round a ring
    x0 = PX[2] + 20
    corners = [(x0, y0), (x0 + 110, y0), (x0 + 110, y0 + 70), (x0, y0 + 70)]
    for k, (x, y) in enumerate(corners):
        gpu(x, y, k + 1)
    b.append(arr(x0 + BW + 4, y0 + 11, x0 + 106, y0 + 11))
    b.append(arr(x0 + 127, y0 + BH + 4, x0 + 127, y0 + 66))
    b.append(arr(x0 + 106, y0 + 81, x0 + BW + 4, y0 + 81))
    b.append(arr(x0 + 17, y0 + 66, x0 + 17, y0 + BH + 4))
    b.append(hd(40, 222, "What the busiest GPU sends, for eight GPUs and a message of S bytes"))
    X0, S = 230, 26
    for k, (name, v, note) in enumerate(plans):
        y = 238 + k * 40
        b.append(txt(40, y + 18, f"{'abc'[k] + '. ' if k < 3 else ''}{name}", "cap"))
        b.append(cell(X0, y, v * S, 26, "h" if k < 3 else "s"))
        b.append(txt(X0 + v * S + 10, y + 18, f"{f(v, 2) if v % 1 else f(v, 0)} S", "sub2"))
        b.append(txt(X0, y + 38, note, "sub2") if False else "")
    body, yb = prose(420, [
        "Tensor parallelism fires an all-reduce twice in every layer, and training-time data "
        "parallelism syncs its gradients with one. Both are affordable for the same reason. Every GPU "
        "holds a vector of S bytes and every GPU needs the sum, and the obvious plans all get worse "
        "as the group grows.",
        "Everyone sending its whole vector to everyone costs each GPU 7 S among eight; one collector "
        "that adds and sends back carries 14 S on its own link while the other links idle; passing "
        "whole vectors round a ring costs 7 S per GPU. At 16,000 GPUs the first would send 15,999 S "
        "from each. You would expect each GPU's cost to grow as the ring gets bigger. The ring "
        "all-reduce's does not.",
    ])
    emit("o021", stamp(SRT, "You would expect each GPU's cost to grow"),
         "The obvious ways to sum across GPUs grow with the group", yb + 26, b + [body],
         "Bars to scale, for eight GPUs. A central collector also leaves every other wire idle while "
         "its own carries fourteen messages' worth.")


# ---- N36: one slice per GPU ----------------------------------------------------------------------
def n36():
    X0 = 140
    b = [hd(40, 40, "Each GPU's message cut into four slices of S/4")]
    for j in range(G):
        b.append(txt(X0 + j * 54 + 25, 70, f"slice {j + 1}", "sub2", "middle"))
    b += grid(X0, 80, DATA, cls=lambda r, c: "s" if r == c else "u")
    for k in range(G):
        b.append(txt(40, 80 + k * 32 + 19, f"G{k + 1}", "cap"))
    b.append(txt(X0 + gw() + 16, 100, "teal: the slice each GPU", "sub2"))
    b.append(txt(X0 + gw() + 16, 116, "will finish, G1 the first,", "sub2"))
    b.append(txt(X0 + gw() + 16, 132, "G2 the second, and so on", "sub2"))
    b.append(cell(40, 228, 280, 34, "m", label="reduce-scatter: 3 steps, adding"))
    b.append(arr(324, 245, 352, 245))
    b.append(cell(356, 228, 284, 34, "s", label="all-gather: 3 steps, copying"))
    body, yb = prose(304, [
        "The ring cuts each GPU's message into one slice per GPU: four GPUs, four slices, each a "
        "quarter of the message. Every GPU will finish one slice: G1 the first, G2 the second, and "
        "so on.",
        "Then the two halves met earlier run in sequence ({{fig:v05-n4}}). First a reduce-scatter, in "
        "which every slice travels once round the ring collecting each GPU's contribution; then an "
        "all-gather, in which the finished slices make one more lap and everyone collects them.",
    ])
    emit("n36", stamp(SRT, "The ring cuts the message into one slice"),
         "Cut every message into one slice per GPU", yb + 26, b + [body],
         "The same numbers as {{ref:v05-n3}}: every digit records whose contribution has arrived, so "
         "the next two figures can be checked by eye.")


# ---- N37 and N38: the two laps, step by step -----------------------------------------------------
CW, GP = 38, 3
PANEL_X = [64, 262, 460]


def sends_text(sends):
    a = ", ".join(f"G{x + 1}→G{z + 1}: {n(v)}" for x, z, _, v in sends[:2])
    z = ", ".join(f"G{x + 1}→G{zz + 1}: {n(v)}" for x, zz, _, v in sends[2:])
    return a + ",", z


def n37():
    b = [hd(40, 40, "Each step, every GPU passes one slice to the next; the receiver adds it")]
    for k in range(G):
        b.append(txt(40, 82 + k * 27 + 17, f"G{k + 1}", "sub2"))
    for i in range(3):
        phase, sends, state = STEPS[i]
        got = {(z, j) for _, z, j, _ in sends}
        last = i == 2
        vals = [[n(state[r][c]) for c in range(G)] for r in range(G)]
        tone = (lambda r, c, got=got: "s" if (r, c) in got and r == c else "m" if (r, c) in got else "u") if last \
            else (lambda r, c, got=got: "m" if (r, c) in got else "u")
        b.append(txt(PANEL_X[i], 70, f"after step {i + 1}", "sub2"))
        b += grid(PANEL_X[i], 82, vals, cw=CW, ch=24, gap=GP, cls=tone)
        l1, l2 = sends_text(sends)
        b.append(txt(PANEL_X[i], 208, l1, "sub2"))
        b.append(txt(PANEL_X[i], 224, l2, "sub2"))
    body, yb = prose(268, [
        "Step 1: every GPU sends one slice to the next GPU round the ring, G4's going back to G1, and "
        "the receiver adds it into its own copy of that slice. G1 sends its 4, and G2's slice 4 "
        "becomes 40 + 4 = 44.",
        "Step 2: each GPU passes on the slice it has just added to, so the sums keep travelling: G1 "
        "sends 3003, G2 44, G3 110, G4 2200. Step 3 does it once more. Highlighted cells are the ones "
        "that have just been added to.",
        "After N − 1 = 3 steps every slice has made one lap and collected all four contributions: G1 "
        "holds 1111 in slice 1, G2 2222 in slice 2, G3 3333, G4 4444. Each GPU has sent three slices "
        "of S/4.",
    ])
    emit("n37", stamp(SRT, "First, the reduce scatter"),
         "Reduce-scatter: each slice makes one lap, collecting", yb + 26, b + [body],
         "Read the digits: 3033 is 3 from G1, 30 from G2 and 3,000 from G4, with G3's 300 still to "
         "come. Every step, every link carries one slice, all at the same time.")


def n38():
    b = [hd(40, 40, "Each step, every GPU passes a finished slice on; the receiver keeps it")]
    for k in range(G):
        b.append(txt(40, 82 + k * 27 + 17, f"G{k + 1}", "sub2"))
    known = [[c == r for c in range(G)] for r in range(G)]
    for i in range(3):
        phase, sends, state = STEPS[3 + i]
        assert phase == "all-gather"
        got = {(z, j) for _, z, j, _ in sends}
        for z, j in got:
            known[z][j] = True
        vals = [[n(state[r][c]) if known[r][c] else None for c in range(G)] for r in range(G)]
        b.append(txt(PANEL_X[i], 70, f"after step {i + 4}", "sub2"))
        b += grid(PANEL_X[i], 82, vals, cw=CW, ch=24, gap=GP,
                  cls=lambda r, c, got=got: "m" if (r, c) in got else "s")
        l1, l2 = sends_text(sends)
        b.append(txt(PANEL_X[i], 208, l1, "sub2"))
        b.append(txt(PANEL_X[i], 224, l2, "sub2"))
    assert all(all(row) for row in known)
    body, yb = prose(268, [
        "Each GPU now owns one finished slice. Step 4: every GPU sends its finished slice to the next "
        "GPU, and the receiver simply keeps it. Steps 5 and 6 pass on whatever has just arrived. "
        "Highlighted cells have just been received; the leftover partial sums of the first lap are "
        "simply overwritten, so they are not drawn.",
        "Nothing is added, only copied. After N − 1 = 3 more steps every row reads 1111 2222 3333 "
        "4444, and each GPU has sent three more slices of S/4.",
    ])
    emit("n38", stamp(SRT, "Then the all gather"),
         "All-gather: the finished slices make one more lap", yb + 26, b + [body],
         "Two laps in all, one to add and one to share. Every GPU ends with the same total, and no GPU "
         "ever sent more than one slice at a time.")


# ---- n38w: the whole ring, any group size (widget) -----------------------------------------------
NMAX, N0 = 8, 4


def masks(n, t):
    """Whose contributions each cell holds after t steps of the ring, as bit masks, and which cells
    changed in step t."""
    start = [[1 << g for _ in range(n)] for g in range(n)]
    st = ring(n, start) if n > 1 else []
    # a ring of masks: adding is OR-ing, copying is copying; ring() adds with +, which for disjoint
    # bits is the same as OR, and the reduce-scatter only ever adds disjoint contributions
    state = start if t == 0 else st[t - 1][2]
    changed = set() if t == 0 else {(z, j) for _, z, j, _ in st[t - 1][1]}
    phase = "start" if t == 0 else st[t - 1][0]
    return state, changed, phase


def labels(n, t):
    total = 2 * (n - 1)
    if t == 0:
        ph = "start: each GPU holds only its own numbers"
    elif t <= n - 1:
        ph = f"reduce-scatter, step {t} of {n - 1}: every GPU adds one slice and passes it on"
    else:
        ph = f"all-gather, step {t - n + 1} of {n - 1}: every GPU copies one finished slice on"
    tally = (f"each GPU has sent {t} of {total} slices of S/{n}: {t}/{n} of the message"
             + (f" = {f(total / n, 3).rstrip('0').rstrip('.')} S, the whole all-reduce" if t == total else ""))
    return ph, tally


GX, GY, CHH = 120, 76, 30


def cellw(n):
    return min(56, (520 - (n - 1) * 4) // n)


WIDGET38 = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const C = __C__, q = s => fig.querySelector(s), NS = 'http://www.w3.org/2000/svg';
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val');
  const btn = [...fig.querySelectorAll('button')];
  const fmt = (v, d) => { const s = Math.abs(v).toFixed(d), [i, p] = s.split('.');
    return (v < 0 && +s !== 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (p ? '.' + p : ''); };
  let t = 0;
  function el(tag, at, txt) { const e = document.createElementNS(NS, tag);
    for (const a in at) e.setAttribute(a, at[a]); if (txt !== undefined) e.textContent = txt; return e; }
  function run(n, upto) {
    let have = Array.from({length: n}, (_, g) => Array(n).fill(1 << g)), changed = [];
    for (let s = 1; s <= upto; s++) {
      const rs = s <= n - 1, k = rs ? s : s - n + 1;
      const sends = [];
      for (let g = 0; g < n; g++) { const j = rs ? ((g - k) % n + n) % n : ((g - k + 1) % n + n) % n;
        sends.push([g, (g + 1) % n, j, have[g][j]]); }
      for (const [a, z, j, v] of sends) have[z][j] = rs ? have[z][j] + v : v;
      changed = sends.map(([a, z, j]) => `${z}-${j}`);
    }
    return [have, changed];
  }
  function draw() {
    const n = +sl.value, total = 2 * (n - 1); val.textContent = n;
    if (t > total) t = total;
    const [have, changed] = run(n, t), cw = Math.min(56, Math.floor((520 - (n - 1) * 4) / n));
    const layer = q('[data-grid]'); layer.replaceChildren();
    for (let j = 0; j < n; j++) layer.appendChild(el('text', {class: 'sub2', x: C.GX + j * (cw + 4) + cw / 2,
      y: C.GY - 8, 'text-anchor': 'middle'}, `s${j + 1}`));
    for (let g = 0; g < n; g++) {
      const y = C.GY + g * (C.CH + 4);
      layer.appendChild(el('text', {class: 'sub2', x: 40, y: y + 19}, `G${g + 1}`));
      for (let j = 0; j < n; j++) {
        const x = C.GX + j * (cw + 4), m = have[g][j], full = m === (1 << n) - 1;
        const cls = changed.includes(`${g}-${j}`) ? 'm' : full ? 's' : 'u';
        const gr = el('g', {class: cls}); gr.appendChild(el('rect', {x, y, width: cw, height: C.CH, rx: 3}));
        const pw = 4, pg = 2, w0 = n * pw + (n - 1) * pg, x0 = x + (cw - w0) / 2;
        for (let p = 0; p < n; p++) gr.appendChild(el('rect', {x: (x0 + p * (pw + pg)).toFixed(1), y: y + C.CH / 2 - 2,
          width: pw, height: pw, rx: 1, style: (m >> p) & 1 ? 'fill:var(--ink);stroke:none' : 'fill:none;stroke:var(--muted)'}));
        layer.appendChild(gr);
      }
    }
    const ph = t === 0 ? 'start: each GPU holds only its own numbers' : t <= n - 1
      ? `reduce-scatter, step ${t} of ${n - 1}: every GPU adds one slice and passes it on`
      : `all-gather, step ${t - n + 1} of ${n - 1}: every GPU copies one finished slice on`;
    let tally = `each GPU has sent ${t} of ${total} slices of S/${n}: ${t}/${n} of the message`;
    if (t === total) tally += ` = ${fmt(total / n, 3).replace(/0+$/, '').replace(/\.$/, '')} S, the whole all-reduce`;
    q('[data-ph]').textContent = ph; q('[data-tally]').textContent = tally;
    btn[0].disabled = t === 0; btn[1].disabled = t === total;
  }
  sl.addEventListener('input', () => { t = 0; draw(); });
  btn[0].addEventListener('click', () => { t = Math.max(t - 1, 0); draw(); });
  btn[1].addEventListener('click', () => { t += 1; draw(); });
  btn[2].addEventListener('click', () => { t = 0; sl.value = C.n0; draw(); });
  draw();
})();</script>"""


def n38w_grid(n, t):
    state, changed, _ = masks(n, t)
    cw = cellw(n)
    o = [txt(GX + j * (cw + 4) + cw / 2, GY - 8, f"s{j + 1}", "sub2", "middle") for j in range(n)]
    for g in range(n):
        y = GY + g * (CHH + 4)
        o.append(txt(40, y + 19, f"G{g + 1}", "sub2"))
        for j in range(n):
            x = GX + j * (cw + 4)
            m = state[g][j]
            cls = "m" if (g, j) in changed else "s" if m == (1 << n) - 1 else "u"
            pips = "".join(
                f'<rect x="{x + (cw - (n * 4 + (n - 1) * 2)) / 2 + p * 6:.1f}" y="{y + CHH / 2 - 2}" width="4" '
                f'height="4" rx="1" style="{"fill:var(--ink);stroke:none" if (m >> p) & 1 else "fill:none;stroke:var(--muted)"}"/>'
                for p in range(n))
            o.append(f'<g class="{cls}"><rect x="{x}" y="{y}" width="{cw}" height="{CHH}" rx="3"/>{pips}</g>')
    return o


def n38w():
    for nn in range(2, NMAX + 1):                       # every step of every ring, checked
        for t in range(2 * (nn - 1) + 1):
            st, ch, _ = masks(nn, t)
        assert all(all(m == (1 << nn) - 1 for m in row) for row in st)
    ph, tally = labels(N0, 0)
    H = GY + NMAX * (CHH + 4)
    s = [hd(40, 34, "Each dot is one GPU's contribution; a full row of dots is a finished slice"),
         f'<g data-grid="">{"".join(n38w_grid(N0, 0))}</g>',
         f'<text class="sub2" x="40" y="{H + 16}" data-ph="">{esc(ph)}</text>',
         f'<text class="sub2" x="40" y="{H + 36}" data-tally="">{esc(tally)}</text>']
    body, yb = prose(H + 80, [
        "Step through the whole all-reduce, then change the number of GPUs. Highlighted cells have "
        "just changed; teal cells hold a finished slice. Whatever the group, the reduce-scatter takes "
        "N − 1 steps, the all-gather N − 1 more, and each step costs every GPU one slice of S/N.",
        "So the tally always ends at 2(N − 1) slices of S/N: 1.5 S for four GPUs, 1.75 S for eight. "
        "The steps were checked against the same ring in Python for every group from two to eight.",
    ])
    s.append(body)
    ctl = [f"<label>GPUs in the ring <input type='range' min='2' max='{NMAX}' step='1' value='{N0}'>"
           f"<span class='val'>{N0}</span></label>",
           "<button type='button'>Back</button><button type='button'>Step</button>"
           "<button type='button'>Reset</button>"]
    C = {"GX": GX, "GY": GY, "CH": CHH, "n0": N0}
    js = WIDGET38.replace("__C__", json.dumps(C))
    emit_raw("n38w", widget("n38w", stamp(SRT, "Then the all gather"),
                            "Step through the whole ring, for any number of GPUs", ctl, yb + 24, s,
                            "The dots are the digits of the last two figures, for any group size: a "
                            "reduce-scatter fills each row's own slice, an all-gather copies it to "
                            "everyone.", js))


# ---- Fig 22: the count ---------------------------------------------------------------------------
def o022():
    rows = [(4, "four GPUs"), (8, "eight GPUs"), (16_000, "16,000 GPUs")]
    vals = [2 * (n_ - 1) / n_ for n_, _ in rows]
    assert vals[:2] == [1.5, 1.75] and f(vals[2], 6) == "1.999875"
    b = [hd(40, 40, "What one GPU sends, built term by term")]
    x = 40
    parts = [("N − 1 slices", "reduce-scatter", "u", 104), ("+", None, None, 24),
             ("N − 1 slices", "all-gather", "u", 104), ("=", None, None, 24),
             ("2(N − 1) slices", "about two laps", "m", 124), ("×", None, None, 24),
             ("S/N each", "one slice", "u", 80)]
    for s_, note, c, w in parts:
        if c is None:
            b.append(txt(x + w / 2, 78, s_, "sub2", "middle"))
        else:
            b.append(cell(x, 58, w, 32, c, label=s_))
            b.append(txt(x + w / 2, 106, note, "sub2", "middle"))
        x += w
    b.append(txt(x + 8, 78, "=", "sub2"))
    b.append(cell(x + 22, 58, 640 - x - 22, 32, "h", label="2(N − 1)/N × S"))
    X0, S = 200, 150
    for k, ((n_, lab), v) in enumerate(zip(rows, vals)):
        y = 134 + k * 40
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(ghost(X0, y, 2 * S, 26))
        b.append(cell(X0, y, v * S, 26, "h"))
        expr = f"{2 * (n_ - 1):,} × S/{n_:,} = {f(v, 6).rstrip('0').rstrip('.')} S"
        b.append(txt(X0 + 2 * S + 12, y + 18, expr, "sub2"))
    b.append(txt(X0 + 2 * S, 270, "2 S", "sub2", "end"))
    body, yb = prose(310, [
        "Now count what a single GPU sends. In the reduce-scatter it sends one slice per step for "
        "N − 1 steps; in the all-gather, N − 1 more: 2(N − 1) slices, roughly two laps round the ring. "
        "Each slice is one N-th of the message.",
        "So every GPU sends 2(N − 1) × S/N = 2(N − 1)/N × S. A bigger ring means more steps but "
        "proportionally thinner slices, so the total barely moves: every GPU sends about twice the "
        "message whether the ring holds eight GPUs or 16,000, and never quite twice.",
    ])
    emit("o022", stamp(SRT, "Now count what a single GPU sends"),
         "Each GPU sends 2(N − 1)/N of the message: never quite twice", yb + 26, b + [body],
         "Bars to scale against a 2 S track. The surprising part is the independence from ring size: "
         "it is why tensor parallelism inside a node and gradient synchronisation across thousands of "
         "GPUs are both affordable.")


# ---- N39: the steps grow ------------------------------------------------------------------------
def n39():
    rows = [(8, "eight GPUs"), (16_000, "16,000 GPUs")]
    steps = [2 * (n_ - 1) for n_, _ in rows]
    assert steps == [14, 31_998]
    X0, S = 200, 150
    b = [hd(40, 40, "Bytes per GPU: the same scale for both")]
    for k, ((n_, lab), st) in enumerate(zip(rows, steps)):
        y = 58 + k * 36
        v = 2 * (n_ - 1) / n_
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(cell(X0, y, v * S, 26, "h", label=f"{f(v, 2)} S"))
    b.append(hd(40, 156, "Steps, each paying the toll: logarithmic scale"))
    L0, L1 = 1, 1e5
    lx = lambda v: log_px(v, L0, L1, X0, 600)
    for e in range(6):
        xx = lx(10 ** e)
        b.append(ln(xx, 170, xx, 246, "axis"))
        b.append(txt(xx, 262, f"{10 ** e:,}", "sub2", "middle"))
    for k, ((n_, lab), st) in enumerate(zip(rows, steps)):
        y = 176 + k * 36
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(cell(X0, y, lx(st) - X0, 26, "m", label=f"{n(st)} steps"))
    body, yb = prose(304, [
        "The bytes stay flat, but every step is a separate exchange, and each pays the fixed toll of "
        "{{fig:v05-n8}}. The steps grow with the group: 2 × 7 = 14 for eight GPUs, 2 × 15,999 = "
        "31,998 for 16,000. A ring's latency grows in proportion to its size.",
        "That is why very large groups do not use one flat ring. NCCL, Nvidia's communication "
        "library, added double binary trees in 2019: the same full bandwidth, with a latency that "
        "grows only with the logarithm of the group, measured up to 180 times lower than a ring at "
        "24,576 GPUs.",
    ])
    emit("n39", stamp(SRT, "A bigger ring means more steps"),
         "The bytes stay flat; the number of steps does not", yb + 26, b + [body],
         "Bandwidth-optimal is not latency-optimal. The ring wins on bytes and loses on tolls, so at "
         "scale the libraries change shape.")


# ---- N40: the floor ------------------------------------------------------------------------------
def n40():
    from part3_tensor import box2
    b = [hd(40, 40, "Why no algorithm can send less: one number on each of N GPUs")]
    b.append(box2(40, 58, 280, 54, "h", "before any GPU holds the sum, each of",
                  "the other N − 1 must send: N − 1 messages"))
    b.append(box2(360, 58, 280, 54, "h", "then the other N − 1 still lack it,",
                  "and each must receive: N − 1 more"))
    b.append(txt(40, 134, "push your own data out", "sub2"))
    b.append(txt(360, 134, "pull the result back", "sub2"))
    x = 40
    for s_, c, w in [("2(N − 1) messages per number", "m", 230), ("÷ N GPUs", None, 80),
                     ("× S bytes of numbers", None, 120)]:
        if c is None:
            b.append(txt(x + w / 2, 170, s_, "sub2", "middle"))
        else:
            b.append(cell(x, 150, w, 32, c, label=s_))
        x += w
    b.append(cell(x + 10, 150, 640 - x - 10, 32, "s", label="2(N − 1)/N × S each"))
    body, yb = prose(226, [
        "Take a single number on each of N GPUs. Before any GPU can hold the finished sum, each of the "
        "other N − 1 must have sent at least one message, or its number could not be in it: each GPU "
        "has to push its own data out. At that moment the other N − 1 GPUs still lack the sum, and "
        "each must receive at least one more message: each has to pull the result back.",
        "That is 2(N − 1) messages per number, shared among N GPUs: 2(N − 1)/N each on average, and "
        "for S bytes of numbers, 2(N − 1)/N × S. The ring sends exactly that from every GPU, so no "
        "algorithm can move less. Engineers call the ring bandwidth-optimal.",
    ])
    emit("n40", stamp(SRT, "And that is the floor"), "No algorithm can send less", yb + 26,
         b + [body],
         "Proved by Patarasuk and Yuan (2009). The bound counts bytes, not steps: the ring meets it "
         "exactly, and still pays the step tolls of the figure before.")


if __name__ == "__main__":
    for fn in (o021, n36, n37, n38, n38w, o022, n39, n40):
        fn()
