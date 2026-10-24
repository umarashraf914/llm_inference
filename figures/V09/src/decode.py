"""V9 Part 7, decode (stop 4): Fig 10 corrected, N22 (decode in time), N23 (the cache read grows),
Fig 11 corrected, N24 (positions per weight read) and its widget N24w, N25 (each expert's share).
plans/depth_pass/V09_review.md §4 G-H and §5 Figs 10, 11.

  python3 figures/V09/src/decode.py     writes items o010 n22 n23 o011 n24 n24w n25
"""
import json, math, random
from common import SRT, box, cell, ghost, txt, hd, ln, para, stamp, emit, emit_widget, width, f, n

PEAK, BW, RIDGE = 1e16, 8e12, 1250
ACTIVE = 30e9
READ = ACTIVE * 0.5                           # bytes of active weights at 4 bits
OPS = 2 * ACTIVE
assert READ == 15e9 and OPS == 60e9 and OPS / READ == 4 and RIDGE / 4 == 312.5
READ_S = ACTIVE * (0.5 + 1 / 16)              # counting one 8-bit scale per 16 weights
assert round(READ_S / 1e9, 1) == 16.9 and round(OPS / READ_S, 1) == 3.6 and round(RIDGE / (OPS / READ_S)) == 352
H_RIDGE = 989e12 / 3.35e12
assert round(H_RIDGE) == 295
T_GB, C_GB = 1e9 / BW, 4e9 / PEAK             # one gigabyte: read time, arithmetic time
assert round(T_GB * 1e6) == 125 and round(C_GB * 1e6, 1) == 0.4 and T_GB / C_GB == 312.5
IDLE = 1 - 4 / RIDGE
assert round(100 * IDLE, 2) == 99.68
PER_TOK = 70272


def eqrow(b, x, y, items, h=34):
    """Boxes and operators in a row: items are (text, width, cls) or an operator string."""
    for it in items:
        if isinstance(it, str):
            b.append(txt(x + 14, y + h / 2 + 4, it, "sub2", "middle"))
            x += 28
        else:
            s_, w, c = it
            assert width(s_, "sub") + 24 <= w, s_
            b.append(cell(x, y, w, h, c, rx=6, label=s_))
            x += w
    assert x <= 640
    return x


def o010():
    b = [hd(40, 46, "One decode step for this request, priced")]
    eqrow(b, 40, 64, [("30 billion active parameters", 200, "u"), "×", ("half a byte each", 140, "u"), "=",
                      ("15 GB read", 110, "h")])
    eqrow(b, 40, 112, [("30 billion active parameters", 200, "u"), "×", ("2 operations each", 140, "u"), "=",
                       ("60 billion operations", 160, "m")])
    eqrow(b, 40, 160, [("60 × 10⁹ operations", 160, "m"), "÷", ("15 × 10⁹ bytes", 130, "h"), "=",
                       ("4 per byte", 100, "s")])
    b.append(txt(40, 218, f"against a ridge of 1,250: {f(RIDGE / 4, 1)} times short", "sub2"))
    b.append(txt(40, 236, f"counting the block scales, 0.5625 bytes a weight: {f(READ_S / 1e9, 1)} GB, "
                 f"{f(OPS / READ_S, 1)} per byte, {n(RIDGE / (OPS / READ_S))} times short", "sub2"))
    body, yb = para(282, [
        "Decode writes the rest of the answer one token at a time, and every token begins with a read of "
        "the active weights: attention, the shared expert and the eight chosen experts in every layer, "
        "about 30 billion parameters ({{fig:v09-n15}}). At 4 bits each that is 15 GB pulled out of "
        "memory, and the arithmetic done on the way past is about 60 billion operations "
        "({{fig:v01-o114}}).",
        "Sixty billion over fifteen billion is four operations per byte, and the chip can sustain 1,250. "
        "That is nearly the same gap as the first episode's: 295 to 1 on the H100 at 16 bits, 312.5 to "
        "1 here ({{fig:v09-n07}}). Counting the block scales makes it slightly worse, not better.",
        "And each token the model writes adds its own 70 KB to the cache, so the next read is slightly "
        "larger than the one before it.",
    ])
    emit("o010", stamp(SRT, "Decode writes the rest of the answer one"),
         "Decode gets 4 operations from each byte, and the chip can use 1,250", yb + 30, b + [body],
         "Four-bit weights, latent attention and a rack-scale fabric are all in place, and a lone token "
         "still gets 4 of the 1,250. Only putting more positions behind each read moves that, a few "
         "figures on.")


def n22():
    b = [hd(40, 46, "One gigabyte of 4-bit weights on one GPU: reading it against using it, to scale")]
    X0, X1 = 200, 600
    sc = (X1 - X0) / (T_GB * 1e6)                    # px per microsecond
    b.append(txt(40, 87, "reading it", "cap"))
    b.append(cell(X0, 70, T_GB * 1e6 * sc, 26, "h", label="125 µs at 8 TB/s"))
    b.append(txt(40, 127, "the arithmetic", "cap"))
    w = C_GB * 1e6 * sc
    b.append(cell(X0, 110, max(w, 2), 26, "m"))
    b.append(txt(X0 + 12, 127, "0.4 µs: 4 billion operations at 10 quadrillion a second", "sub2"))
    ya = 150
    b.append(ln(X0, ya, X1, ya, "axis"))
    for v in range(0, 126, 25):
        b.append(ln(X0 + v * sc, ya, X0 + v * sc, ya + 4, "tick"))
        b.append(txt(X0 + v * sc, ya + 18, f"{v} µs", "sub2", "middle"))
    b.append(txt(40, ya + 52, f"this token's 15 GB on one GPU: {f(15 * T_GB * 1e3, 3)} ms of reading against "
                 f"{f(OPS / PEAK * 1e6, 0)} µs of arithmetic,", "sub2"))
    b.append(txt(40, ya + 70, f"so the arithmetic units sit idle {f(100 * IDLE, 2)}% of the step", "sub2"))
    body, yb = para(ya + 114, [
        "Reading a gigabyte at 8 terabytes a second takes one eight-thousandth of a second: 125 "
        "microseconds. The gigabyte holds two billion 4-bit weights, which offer 4 billion operations, "
        "and at 10 quadrillion a second those take 0.4 microseconds.",
        "So the arithmetic for each gigabyte is done 312.5 times sooner than the gigabyte arrives, and "
        "the units wait for the rest: the same picture as the first episode's 30-millisecond token "
        "({{fig:v01-o067}}). Spread over many GPUs, each reads and computes its own share sooner, but on "
        "each one the ratio is the same.",
    ])
    emit("n22", stamp(SRT, "is four operations per byte. The chip"),
         "Each gigabyte takes 125 microseconds to read and 0.4 to compute", yb + 30, b + [body],
         "Bars to scale: the arithmetic is the sliver at the left. The read, not the arithmetic, sets the "
         "price of a decode step.")


def n23():
    b = [hd(40, 46, "What one decode step reads, to scale: the weights once, every cache in full")]
    X0, X1, TOP = 252, 630, 20e9
    sc = (X1 - X0) / TOP
    rows = [("the active weights", READ, "u", "15 GB, read once for the whole batch"),
            ("1 conversation, 4,000 tokens", 4000 * PER_TOK, "h", None),
            ("1 conversation, 100,000 tokens", 100000 * PER_TOK, "h", None),
            ("64 conversations, 4,000 each", 64 * 4000 * PER_TOK, "h", None)]
    y = 68
    for lab, v, c, s_ in rows:
        b.append(txt(40, y + 18, lab, "cap"))
        w = max(v * sc, 2)
        pct = f"{f(v / 1e9, 2 if v < 1e9 else 1)} GB, {f(100 * v / READ, 1)}% of the weight read"
        if s_:
            b.append(cell(X0, y, w, 26, c, label=s_))
        elif width(pct, "sub") + 24 <= w:
            b.append(cell(X0, y, w, 26, c, label=pct))
        else:
            b.append(cell(X0, y, w, 26, c))
            b.append(txt(X0 + w + 10, y + 18, pct, "sub2"))
        y += 38
    ya = y + 2
    b.append(ln(X0, ya, X1, ya, "axis"))
    for v in range(0, 21, 5):
        b.append(ln(X0 + v * 1e9 * sc, ya, X0 + v * 1e9 * sc, ya + 4, "tick"))
        b.append(txt(X0 + v * 1e9 * sc, ya + 18, f"{v} GB", "sub2", "middle"))
    assert round(4000 * PER_TOK / READ * 100, 1) == 1.9 and round(64 * 4000 * PER_TOK / 1e9) == 18
    body, yb = para(ya + 62, [
        "Every decode step reads the weights once for the whole batch, but it reads each sequence's cache "
        "separately, because no two requests share one ({{fig:v07-o005}}). At 70 KB a token, this "
        "conversation's 4,000 tokens are 281 MB: under 2% of the weight read, nothing.",
        "The same arithmetic at a crowd's scale is decisive. One conversation at 100,000 tokens reads 7.0 "
        "GB a step; 64 conversations of 4,000 tokens read 18.0 GB, more than the weights "
        "({{fig:v08-o015}}). And each new token adds 70 KB, so every read is slightly larger than the one "
        "before it.",
    ])
    emit("n23", stamp(SRT, "Each token the model writes adds its own"),
         "Seventy kilobytes a token is nothing for one conversation and decisive for a crowd", yb + 30,
         b + [body],
         "Bars to scale. Batching shares the weight read among requests; it can never share their caches, "
         "which grow with every token and every request.")


def o011():
    b = [hd(40, 46, "Two directions for putting more behind one read of the weights")]
    b.append(box(40, 66, 286, 82, "s", "Continuous batching", "more requests in the same pass:",
                 "one read serves them all"))
    b.append(box(354, 66, 286, 82, "s", "Speculative decoding", "more positions per request:",
                 "drafted tokens, checked in one pass"))
    body, yb = para(196, [
        "Continuous batching puts this request through the same forward pass as every other request in "
        "flight, so one read of the weights serves all of them ({{fig:v07-o006}}). Speculative decoding "
        "has a small draft model propose several tokens ahead, which the large model checks in a single "
        "pass ({{fig:v08-o002}}).",
        "So the forward pass carrying this request holds many sequences, each with several proposed "
        "tokens attached. One puts more requests behind a read; the other gets more positions out of it "
        "for the same request. They are the two directions within one-token-at-a-time generation, and a "
        "production system runs both at once. Part 10 meets a model that leaves that frame.",
    ])
    emit("o011", stamp(SRT, "Continuous batching puts this request"),
         "Batching and speculation both put more positions behind one weight read", yb + 30, b + [body],
         "They compete for the same idle arithmetic: at 64 sequences with 4 drafts each, the read is "
         "already past the ridge (next figure).")


def n24():
    b = [hd(40, 46, "One cell per position computed from a single read of the weights")]
    cases = [(1, 0, "1 sequence, no drafts"), (64, 0, "64 sequences, no drafts"),
             (64, 4, "64 sequences, 4 drafts each")]
    CW, CH, G_ = 10, 3, 1
    xs = [70, 250, 430]
    y0 = 92
    for (B, d, lab), x0 in zip(cases, xs):
        b.append(txt(x0, y0 - 18, lab, "cap"))
        for r in range(B):
            for c in range(d + 1):
                b.append(f'<g class="{"u" if c == 0 else "m"}"><rect x="{x0 + c * (CW + G_)}" '
                         f'y="{y0 + r * (CH + G_)}" width="{CW}" height="{CH}" rx="0.5"/></g>')
        P = B * (d + 1)
        I = 4 * P
        yy = y0 + 64 * (CH + G_) + 22
        rel = "past the ridge" if I >= RIDGE else f"{f(RIDGE / I, 1)}× short of the ridge"
        for k, t in enumerate([f"{n(P)} position{'s' if P > 1 else ''}", f"4 × {n(P)} = {n(I)} per byte", rel]):
            assert width(t, "sub2") < 170
            b.append(txt(x0, yy + 16 * k, t, "sub2"))
    assert 4 * 64 * 5 == 1280 > RIDGE > 4 * 64
    yk = y0 + 64 * (CH + G_) + 80
    b.append(cell(70, yk, 10, 10, "u", rx=1))
    b.append(txt(88, yk + 9, "the sequence's next token", "sub2"))
    b.append(cell(270, yk, 10, 10, "m", rx=1))
    b.append(txt(288, yk + 9, "a drafted token, checked in the same pass", "sub2"))
    body, yb = para(yk + 52, [
        "Positions per read are sequences times one plus the drafts, and each position gets 4 operations "
        "from every byte of weights read ({{fig:v09-n06}}). One sequence gives 4. A batch of 64 gives "
        "256. Give each of the 64 four drafts and the pass holds 320 positions: 1,280 operations per "
        "byte, past the ridge of 1,250.",
        "Below the ridge, extra positions ride free on arithmetic that was idle anyway. Past it, every "
        "position adds time ({{fig:v08-o009}}). That is why speculation's measured gain falls from up to "
        "6.5 times with one request to 1.38 times with 64 ({{fig:v08-o013}}).",
    ])
    emit("n24", stamp(SRT, "The forward pass carrying this request"),
         "Positions per weight read are sequences times one plus the drafts", yb + 30, b + [body],
         "Drawn to scale, one cell per position. Batching adds rows and speculation adds columns, and "
         "both spend the same 1,246 operations per byte a lone token leaves idle.")


# ---- N24w: the widget ---------------------------------------------------------------------------------
BS2 = [1, 2, 4, 8, 16, 32, 64, 128, 256, 313]
AS = [0.5, 0.6, 0.7, 0.8, 0.9]
DMAX = 7
INIT = (0, 4, 3)                               # 1 sequence, 4 drafts, 0.8
GEO2 = {"x0": 110, "x1": 620, "dx": 4, "y0": 40, "y1": 240, "lo": 12, "dy": 5}


def X2(I):
    return GEO2["x0"] + math.log10(I) / GEO2["dx"] * (GEO2["x1"] - GEO2["x0"])


def Y2(a):
    return GEO2["y1"] - (math.log10(a) - GEO2["lo"]) / GEO2["dy"] * (GEO2["y1"] - GEO2["y0"])


def kept(a, d):
    """1 + a + a² + … + a^d, added in this order, exactly as the widget adds it."""
    e, p = 1.0, 1.0
    for _ in range(d):
        p *= a
        e += p
    return e


def lines24(B, d, a):
    P = B * (d + 1)
    I = 4 * P
    pct = "100%" if I >= RIDGE else f(100 * I / RIDGE, 2) + "%"
    tail = ", past the ridge: each extra position now costs time" if I >= RIDGE else " of peak"
    e = kept(a, d)
    K = B * e
    return [f"positions computed per read: {n(B)} × ({d} + 1) = {n(P)}",
            f"operations per byte: 4 × {n(P)} = {n(I)}, {pct}{tail}",
            f"tokens kept per read, on average: {n(B)} × {f(e, 2)} = {f(K, 1)}",
            f"share of computed positions kept: {f(100 * K / P, 1)}%"]


assert round(kept(0.8, 4) / 5, 3) == 0.672      # "about a third ... thrown away"
assert lines24(1, 4, 0.8)[2].endswith("1 × 3.36 = 3.4") and lines24(64, 4, 0.8)[1].startswith("operations per byte: 4 × 320 = 1,280, 100%")
assert abs(kept(0.8, 4) - (1 - 0.8 ** 5) / (1 - 0.8)) < 1e-12

N24_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const BS = __BS__, AS = __AS__, G = __G__, PEAK = 1e16, BW = 8e12, RIDGE = 1250, INIT = __INIT__;
  const sl = [...fig.querySelectorAll('input[type=range]')], val = [...fig.querySelectorAll('.val')];
  const q = s => fig.querySelector(s);
  const com = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fx = (v, d) => { const [i, f] = Math.abs(v).toFixed(d).split('.');
    return (v < 0 && +Math.abs(v).toFixed(d) !== 0 ? '−' : '') + com(i) + (f ? '.' + f : ''); };
  const X = I => G.x0 + Math.log10(I) / G.dx * (G.x1 - G.x0);
  const Y = a => G.y1 - (Math.log10(a) - G.lo) / G.dy * (G.y1 - G.y0);
  function draw() {
    const B = BS[+sl[0].value], d = +sl[1].value, a = AS[+sl[2].value];
    val[0].textContent = com(String(B)); val[1].textContent = String(d); val[2].textContent = a.toFixed(1);
    const P = B * (d + 1), I = 4 * P;
    let e = 1, p = 1;
    for (let i = 0; i < d; i++) { p *= a; e += p; }
    const K = B * e;
    const pct = I >= RIDGE ? '100%' : fx(100 * I / RIDGE, 2) + '%';
    const tail = I >= RIDGE ? ', past the ridge: each extra position now costs time' : ' of peak';
    const L = [`positions computed per read: ${com(String(B))} × (${d} + 1) = ${com(String(P))}`,
               `operations per byte: 4 × ${com(String(P))} = ${com(String(I))}, ${pct}${tail}`,
               `tokens kept per read, on average: ${com(String(B))} × ${fx(e, 2)} = ${fx(K, 1)}`,
               `share of computed positions kept: ${fx(100 * K / P, 1)}%`];
    L.forEach((s, k) => q(`[data-l="${k}"]`).textContent = s);
    const pt = q('[data-pt]');
    pt.setAttribute('cx', X(I).toFixed(1)); pt.setAttribute('cy', Y(Math.min(PEAK, BW * I)).toFixed(1));
  }
  sl.forEach(s => s.addEventListener('input', draw));
  q('button').addEventListener('click', () => { sl.forEach((s, k) => s.value = INIT[k]); draw(); });
  draw();
})();</script>"""


def n24w():
    G = GEO2
    s = [txt(G["x0"], G["y0"] - 14, "operations a second (log scale), one Blackwell GPU at 4 bits", "sub2")]
    s.append(ln(G["x0"], G["y1"], G["x1"], G["y1"], "axis"))
    s.append(ln(G["x0"], G["y0"], G["x0"], G["y1"], "axis"))
    for e in range(0, 5):
        s.append(ln(X2(10 ** e), G["y1"], X2(10 ** e), G["y1"] + 4, "tick"))
        s.append(txt(X2(10 ** e), G["y1"] + 18, n(10 ** e), "sub2", "middle"))
    for e in range(12, 18):
        s.append(ln(G["x0"] - 4, Y2(10 ** e), G["x0"], Y2(10 ** e), "tick"))
        s.append(txt(G["x0"] - 8, Y2(10 ** e) + 4, "10" + "".join("⁰¹²³⁴⁵⁶⁷⁸⁹"[int(c)] for c in str(e)), "sub2", "end"))
    s.append(txt((G["x0"] + G["x1"]) / 2, G["y1"] + 38, "operations per byte of weights read (log scale)", "sub2", "middle"))
    pts = [(1, BW), (RIDGE, PEAK), (1e4, PEAK)]
    s.append(f'<polyline class="pl-m" points="{" ".join(f"{X2(i):.1f},{Y2(a):.1f}" for i, a in pts)}"/>')
    s.append(f'<line class="mark" x1="{X2(RIDGE):.1f}" y1="{Y2(PEAK) + 8:.1f}" x2="{X2(RIDGE):.1f}" y2="{G["y1"] - 4}"/>')
    s.append(txt(X2(RIDGE) + 8, G["y1"] - 10, "ridge 1,250", "sub2"))
    B, d, a = BS2[INIT[0]], INIT[1], AS[INIT[2]]
    I = 4 * B * (d + 1)
    s.append(f'<circle data-pt="" cx="{X2(I):.1f}" cy="{Y2(min(PEAK, BW * I)):.1f}" r="5" fill="var(--paper)" '
             f'stroke="var(--m)" stroke-width="2"/>')
    yr = G["y1"] + 76
    for k, line in enumerate(lines24(B, d, a)):
        s.append(f'<g class="u"><text class="sub" x="40" y="{yr + k * 22}" data-l="{k}">{line}</text></g>')
    for B_ in BS2:
        for d_ in range(DMAX + 1):
            for a_ in AS:
                assert all(width(t, "sub") < 600 for t in lines24(B_, d_, a_))
    body, yb = para(yr + 3 * 22 + 50, [
        "Start with one sequence and four drafts: five positions per read, and the point sits far down "
        "the slope, so the drafts cost nothing. On average 3.36 of the five positions turn into kept "
        "tokens when each draft is kept with chance 0.8: 1 + 0.8 + 0.8² + 0.8³ + 0.8⁴, since a draft "
        "counts only if every draft before it was kept, and the pass always yields one token of its own.",
        "Now raise the batch to 64. The point crosses the ridge, and from there every extra position "
        "costs time, while about a third of the positions computed are thrown away. Batching and "
        "speculation are spending the same idle arithmetic.",
        "Acceptance is treated as the same chance for every draft, which real drafters only approximate "
        "({{fig:v08-o008}}). The widget's arithmetic was checked against Python at every setting.",
    ])
    ctl = [f"<label>sequences in the batch <input type='range' min='0' max='{len(BS2) - 1}' step='1' "
           f"value='{INIT[0]}'><span class='val'>{n(B)}</span></label>"
           f"<label>drafts per sequence <input type='range' min='0' max='{DMAX}' step='1' value='{INIT[1]}'>"
           f"<span class='val'>{d}</span></label>",
           f"<label>chance each draft is kept <input type='range' min='0' max='{len(AS) - 1}' step='1' "
           f"value='{INIT[2]}'><span class='val'>{a:.1f}</span></label><button type='button'>Reset</button>"]
    js = (N24_JS.replace("__BS__", json.dumps(BS2)).replace("__AS__", json.dumps(AS))
          .replace("__G__", json.dumps(GEO2)).replace("__INIT__", json.dumps(list(INIT))))
    emit_widget("n24w", stamp(SRT, "therefore holds many sequences, each"),
                "Turn up the batch and the drafts, and watch them meet at the ridge", ctl, s + [body],
                yb + 26,
                "Positions computed and tokens kept come apart as soon as drafts are added; both batching "
                "and speculation stop being free at the same line.", js)


def n25():
    b = [hd(40, 46, "64 tokens in one pass, each sent to 8 of 384 experts: one dot per choice")]
    E, K, T = 384, 8, 64
    rng = random.Random(25)
    picks = [rng.sample(range(E), K) for _ in range(T)]
    X0, Y0, CW, CH = 40, 70, 1.5, 3
    b.append(ghost(X0 - 2, Y0 - 2, E * CW + 4, T * CH + 4))
    for t, ex in enumerate(picks):
        for e in ex:
            b.append(f'<g class="m"><rect x="{X0 + e * CW:.1f}" y="{Y0 + t * CH}" width="{CW}" height="{CH}" rx="0"/></g>')
    b.append(txt(X0, Y0 + T * CH + 18, "rows: the 64 tokens; columns: the 384 experts", "sub2"))
    counts = [0] * E
    for ex in picks:
        for e in ex:
            counts[e] += 1
    hist = [sum(1 for c in counts if c == k) for k in range(4)] + [sum(1 for c in counts if c >= 4)]
    assert sum(hist) == E and sum(counts) == T * K and abs(sum(counts) / E - 4 / 3) < 1e-12
    yh = Y0 + T * CH + 66
    b.append(hd(40, yh, "How many of the 64 tokens each expert received"))
    SC = 300 / max(hist)
    for k, v in enumerate(hist):
        y = yh + 16 + k * 30
        b.append(txt(40, y + 16, ["0 tokens", "1 token", "2 tokens", "3 tokens", "4 or more"][k], "cap"))
        b.append(cell(150, y, max(v * SC, 2), 22, "m" if k else "u"))
        b.append(txt(150 + v * SC + 10, y + 16, f"{v} experts", "sub2"))
    yb0 = yh + 16 + 5 * 30
    body, yb = para(yb0 + 40, [
        "Attention and the shared expert run for every token, so their weights are read once for all 64, "
        "as batching promises. The routed experts are not: each reads its weights only for the tokens the "
        f"router sent it, on average 64 × 8 ÷ 384 = 1.33 here, and {hist[0]} of the 384 got none at all.",
        "For one expert's read to reach the ridge it needs 312.5 tokens, so the whole pass needs 312.5 × "
        "384 ÷ 8 = 15,000 positions (10,000 for a model with 256 experts). That is why decode pools "
        "gather very large combined batches across many GPUs, one deployment at 144-way expert "
        "parallelism ({{fig:v07-o011}}), and why at ordinary loads an expert's batch stays far below the "
        "ridge ({{fig:v06-o020}}).",
    ])
    emit("n25", stamp(SRT, "with several proposed tokens attached."),
         "In a mixture of experts, each expert's read serves only its share of the batch", yb + 30,
         b + [body],
         "Batching amortises the shared weights at once and the experts only in a crowd of thousands. "
         "The pattern is one random draw, illustrative.")


if __name__ == "__main__":
    for fn in (o010, n22, n23, o011, n24, n24w, n25):
        fn()
