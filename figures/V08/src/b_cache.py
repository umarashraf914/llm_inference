"""V8 Part 6, the cache quantified: review §4 H1-H4, plus fixes to Figs 15-16 (P17, P20, P22).

  o015  the cache is the other thing every step reads (what it holds, why)
  b01   320 KB a token, term by term; 128k tokens; four requests outweigh the weights   (H1)
  b02   time per step rises in a straight line with context                            (H2)
  b03   FlashAttention removed the score matrix's trips; the cache is untouched        (H3)
  b04   ring attention: the cache spread across four GPUs, blocks passed round         (H4)
  o016  the map of Parts 7-9: what each technique keeps, saves and gives up            (P22)

  python3 figures/V08/src/b_cache.py
"""
from b_lib import (box, cell, ghost, txt, hd, ln, arr, prose, emit, stamp, f, n0, pct, text,
                   WEIGHT_BYTES, H100_BW, H100_PEAK, LAYERS, KV_HEADS, HEAD_DIM, BYTES,
                   KV_PER_TOKEN, Q_HEADS, CTX)

GB = 1e9
cache_128k = CTX * KV_PER_TOKEN                     # one request at 131,072 tokens
assert cache_128k == 40 * 2**30                      # exactly 40 GiB: the "roughly 40 GB" usually quoted
assert round(cache_128k / GB, 1) == 42.9
assert 4 * cache_128k > WEIGHT_BYTES                 # four such requests outweigh the weights
assert KV_PER_TOKEN == 320 * 1024                    # "320 KB" is 320 KiB


# ---- o015: what the cache holds -----------------------------------------------------------------
def o015():
    toks = ["The", "cat", "sat", "on", "the"]
    X0, CW, G = 150, 84, 12
    xs = [X0 + i * (CW + G) for i in range(5)]
    b = [hd(40, 46, "For every token so far, each layer keeps one key and one value")]
    b.append(txt(40, 89, "tokens", "cap"))
    b.append(txt(40, 129, "keys", "cap"))
    b.append(txt(40, 165, "values", "cap"))
    for i, (x, t) in enumerate(zip(xs, toks)):
        new = i == 4
        b.append(cell(x, 70, CW, 28, "u", label=t if not new else "the  (newest)"))
        if new:
            b.append(ghost(x, 110, CW, 26, label="k5, new"))
            b.append(ghost(x, 146, CW, 26, label="v5, new"))
        else:
            b.append(cell(x, 110, CW, 26, "h", label=f"k{i + 1}"))
            b.append(cell(x, 146, CW, 26, "h", label=f"v{i + 1}"))
    x1, x2 = xs[0], xs[4] + CW
    b.append(ln(x1, 186, x2, 186, "tick"))
    b.append(ln(x1, 186, x1, 180, "tick"))
    b.append(ln(x2, 186, x2, 180, "tick"))
    b.append(txt((x1 + x2) / 2, 204, "all read by the newest token's query, at this step and every later one",
                 "sub2", "middle"))
    b.append(txt((x1 + x2) / 2, 222, f"and the same again in each of the {LAYERS} layers", "sub2", "middle"))
    body, yb = prose(262, [
        "The model turns every token it reads into a key and a value, and every later token needs "
        "those in order to attend to it ({{fig:v01-o092}}). Storing them saves the model from "
        "processing the whole context again at every step: only the newest token goes through the "
        "model, and it appends its own pair ({{fig:v01-o137}}).",
        "So a decode step reads two things: every weight, and every key and value stored so far. At "
        "short context the second is small. At long context it is the bigger problem, and the next "
        "three figures put numbers on it.",
    ])
    emit("o015", stamp("The other thing being read is the cache"),
         "Every decode step reads the cache as well as the weights", yb + 30, b + [body],
         "A cache trades memory for time ({{ref:v01-o135}}). Memory is not the only price: everything "
         "it stores is read back on every step.")


# ---- b01: 320 KB a token, and what that becomes -----------------------------------------------------
def b01():
    terms = [(2, "key + value"), (LAYERS, "layers"), (KV_HEADS, "KV heads"), (HEAD_DIM, "per head"),
             (BYTES, "bytes each")]
    b = [hd(40, 46, "One token's cache in the 70B model, term by term (built in {{fig:v01-o140}})")]
    W, GX = 58, 30
    x = 40
    for k, (v, lab) in enumerate(terms):
        b.append(cell(x, 70, W, 40, "u", rx=6, label=str(v)))
        b.append(txt(x + W / 2, 128, lab, "sub2", "middle"))
        if k < 4:
            b.append(txt(x + W + GX / 2, 95, "×", "sub2", "middle"))
        x += W + GX
    b.append(txt(x - GX / 2, 95, "=", "sub2", "middle"))
    b.append(cell(x, 70, 150, 40, "h", rx=6, label=f"{n0(KV_PER_TOKEN)} bytes"))
    b.append(txt(x + 75, 128, "about 320 KB a token", "sub2", "middle"))
    # bars to scale
    SC = 400 / (4 * cache_128k)
    rows = [("the weights", WEIGHT_BYTES, "u", "140 GB, the same for every request"),
            ("one request at 128k", cache_128k, "h", f"{f(cache_128k / GB, 1)} GB"),
            ("four such requests", 4 * cache_128k, "h", f"{f(4 * cache_128k / GB, 1)} GB, more than the weights")]
    b.append(hd(40, 176, f"Times {n0(CTX)} tokens, drawn to scale"))
    for k, (lab, v, c, note) in enumerate(rows):
        y = 194 + k * 44
        b.append(txt(40, y + 19, lab, "cap"))
        w = v * SC
        if len(note) * 6 + 24 < w:
            b.append(cell(230, y, w, 28, c, label=note))
        else:
            b.append(cell(230, y, w, 28, c))
            b.append(txt(230 + w + 10, y + 18, note, "sub2"))
    body, yb = prose(364, [
        f"Here a GB is 10⁹ bytes, the unit of the 140 GB of weights. The 128k of context is "
        f"2¹⁷ = {n0(CTX)} tokens, and {n0(CTX)} × {n0(KV_PER_TOKEN)} bytes is {f(cache_128k / GB, 1)} GB. "
        f"In binary units that is exactly 40 GiB (40 × 2³⁰ bytes), which is where the round figure of "
        f"40 GB usually quoted comes from; the 320 KB is likewise 320 × 1,024 bytes.",
        "The weights are paid for once and shared by every request on the machine. The cache is paid "
        "per request and per token, so four requests at this length hold more between them than the "
        "model holds in weights.",
    ])
    emit("b01", stamp("about 320 kilobytes for every token"),
         "At 128k tokens one request's cache is 43 GB, and four outweigh the model", yb + 30, b + [body],
         "Two units for one quantity is a common source of disagreement between sources. This atlas "
         "uses decimal GB throughout, so 42.9 here and the 140 of the weights compare directly.")


# ---- b02: time per step against context ----------------------------------------------------------------
def b02():
    t_w = WEIGHT_BYTES / H100_BW
    slope = KV_PER_TOKEN / H100_BW                         # seconds per token of context, per request
    step = lambda B, L: (WEIGHT_BYTES + B * L * KV_PER_TOKEN) / H100_BW
    cross = {B: WEIGHT_BYTES / (B * KV_PER_TOKEN) for B in (1, 4)}
    assert round(t_w * 1e3, 1) == 41.8 and round(slope * 1e6, 4) == 0.0978   # µs per token = ms per 1,000
    assert round(step(1, CTX) * 1e3, 1) == 54.6 and round(step(4, CTX) * 1e3, 1) == 93.1
    assert round(cross[1]) == 427_246 and round(cross[4]) == 106_812
    assert abs(step(4, cross[4]) - 2 * t_w) < 1e-12                      # where cache = weights, time doubles
    L0, L1, T, B0 = 100, 560, 80, 300                                    # plot box
    xL = lambda L: L0 + L / CTX * (L1 - L0)
    yT = lambda ms: B0 - ms / 100 * (B0 - T)
    b = [hd(40, 46, "Milliseconds per decode step: 140 GB of weights plus every request's cache, at 3.35 TB/s")]
    b.append(ln(L0, B0, L1, B0, "axis"))
    b.append(ln(L0, T, L0, B0, "axis"))
    for L, lab in [(0, "0"), (32768, "32k"), (65536, "64k"), (98304, "96k"), (CTX, "128k")]:
        b.append(ln(xL(L), B0, xL(L), B0 + 4, "tick"))
        b.append(txt(xL(L), B0 + 18, lab, "sub2", "middle"))
    for ms in (0, 20, 40, 60, 80, 100):
        b.append(ln(L0 - 4, yT(ms), L0, yT(ms), "tick"))
        b.append(txt(L0 - 8, yT(ms) + 4, str(ms), "sub2", "end"))
    b.append(txt((L0 + L1) / 2, B0 + 38, "tokens of context per request", "sub2", "middle"))
    b.append(txt(40, T - 12, "ms per step", "sub2"))
    b.append(ln(xL(0), yT(t_w * 1e3), xL(CTX), yT(t_w * 1e3), "conn"))
    for B, cls in ((1, "pl-m"), (4, "pl-h")):
        b.append(f'<polyline class="{cls}" points="{xL(0):.1f},{yT(t_w * 1e3):.1f} '
                 f'{xL(CTX):.1f},{yT(step(B, CTX) * 1e3):.1f}"/>')
        b.append(f'<circle cx="{xL(CTX):.1f}" cy="{yT(step(B, CTX) * 1e3):.1f}" r="3.5" '
                 f'fill="var(--paper)" stroke="var(--{"m" if B == 1 else "h"})" stroke-width="1.5"/>')
    b.append(txt(L1 + 10, yT(step(4, CTX) * 1e3) + 4, f"4 requests: {f(step(4, CTX) * 1e3, 1)} ms", "sub2"))
    b.append(txt(L1 + 10, yT(step(1, CTX) * 1e3) + 4, f"1 request: {f(step(1, CTX) * 1e3, 1)} ms", "sub2"))
    b.append(txt(L1 + 10, yT(t_w * 1e3) + 8, f"weights alone: {f(t_w * 1e3, 1)}", "sub2"))
    cx, cy = xL(cross[4]), yT(step(4, cross[4]) * 1e3)
    b.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="3.5" fill="var(--paper)" stroke="var(--h)" stroke-width="1.5"/>')
    b.append(txt(cx - 10, cy - 10, f"4 requests at {round(cross[4] / 1000)}k: cache = weights", "sub2", "end"))
    body, yb = prose(B0 + 76, [
        f"A step reads every weight and every stored key and value, so its time is bytes ÷ bandwidth: "
        f"(140 GB + requests × tokens × {n0(KV_PER_TOKEN)} bytes) ÷ 3.35 TB/s. The weights fix the "
        f"starting height, {f(t_w * 1e3, 1)} ms. The cache adds {f(slope * 1e6, 4)} microseconds per token "
        f"of context, {f(slope * 1e6, 4)} ms per thousand, for every request in the batch.",
        f"That is a straight line. One request at 128k takes {f(step(1, CTX) * 1e3, 1)} ms a step; four take "
        f"{f(step(4, CTX) * 1e3, 1)} ms, more than twice the weights alone, and still produce only one "
        f"token each. For one request the cache matches the weights at {n0(cross[1])} tokens; for four, "
        f"at {n0(cross[4])}.",
        "Counted as if one chip held everything, as in {{fig:v01-o014}}. Split across several GPUs, each "
        "reads its share in parallel, but the bytes per token are the same.",
    ])
    emit("b02", stamp("reads the whole cache back out of memory"),
         "Time per token rises in a straight line with the context", yb + 30, b + [body],
         "The cache competes with the weights byte for byte, because both cross the same bus on every "
         "step. Batching shares the weights; it shares none of the cache.")


# ---- b03: FlashAttention and the cache ---------------------------------------------------------------------
def b03():
    scores = CTX * CTX * 2                                   # one head, one layer, every pair, 2 bytes
    assert round(scores / GB, 1) == 34.4
    SC = 300 / cache_128k
    b = [hd(40, 46, f"One {n0(CTX)}-token prompt in the 70B model: what reaches memory")]
    rows = [
        ("score grid, one head, one layer", None),
        ("naive kernel", ("h", scores, f"{f(scores / GB, 1)} GB written, then read back")),
        ("FlashAttention", (None, 0, "0 bytes: each tile stays on chip")),
        ("cache, all 80 layers", None),
        ("naive kernel", ("h", cache_128k, f"{f(cache_128k / GB, 1)} GB")),
        ("FlashAttention", ("h", cache_128k, f"{f(cache_128k / GB, 1)} GB, unchanged")),
    ]
    y = 64
    for lab, spec in rows:
        if spec is None:
            y += 12
            b.append(txt(40, y + 14, lab, "cap"))
            y += 26
            continue
        c, v, note = spec
        b.append(txt(60, y + 18, lab, "sub2"))
        if c is None:
            b.append(ghost(230, y, 300, 26))
            b.append(txt(242, y + 17, note, "sub2"))
        else:
            w = v * SC
            b.append(cell(230, y, w, 26, c))
            b.append(txt(230 + w + 10, y + 17, note, "sub2"))
        y += 34
    body, yb = prose(y + 34, [
        f"Attention compares every query with every key. A naive kernel writes that grid of scores to "
        f"memory, reads it back for the softmax and writes it again ({{{{fig:v03-o030}}}}): at this "
        f"length the grid is {n0(CTX)}² numbers, {f(scores / GB, 1)} GB for each head in each layer. "
        f"FlashAttention computes it tile by tile on the chip, folds each tile into the output and "
        f"discards it, so the grid never reaches memory ({{{{fig:v03-o037}}}}). The output is identical.",
        "The cache is a different object: one key and one value per token per layer, kept between "
        "steps and read at every step. FlashAttention changes how it is read, never how much of it "
        "there is, and it still grows with every token that arrives.",
    ])
    emit("b03", stamp("Flash attention already cut"),
         "FlashAttention stopped the scores reaching memory; the cache stayed the same size",
         yb + 30, b + [body],
         "Two memory problems with different shapes. FlashAttention solved the one that grows with the "
         "square of the context; the one that grows in a straight line is what every method from here "
         "on attacks.")


# ---- b04: ring attention ---------------------------------------------------------------------------------------
def b04():
    G = 4
    per_gpu = cache_128k / G
    blk_tokens = CTX // G
    blk_layer = blk_tokens * 2 * KV_HEADS * HEAD_DIM * BYTES        # one block's keys and values, one layer
    nvlink = 900e9                                                    # H100 NVLink, V02 Fig 95
    t_move = blk_layer / nvlink
    flops = 4 * blk_tokens * blk_tokens * Q_HEADS * HEAD_DIM          # QK and PV for one block, one layer
    t_math = flops / H100_PEAK
    assert round(per_gpu / GB, 1) == 10.7 and round(blk_layer / 1e6) == 134
    assert round(t_move * 1e3, 2) == 0.15 and round(t_math * 1e3) == 36 and t_math > 100 * t_move
    names = "ABCD"
    holds = [[names[(g - s) % G] for s in range(G)] for g in range(G)]
    for g in range(G):                                                # every query meets every block
        assert sorted(holds[g]) == list(names)
    X0, CW, GX, Y0, RH = 214, 82, 30, 92, 36
    b = [hd(40, 46, f"Four GPUs share one {n0(CTX)}-token request: a quarter of the cache each")]
    for s in range(G):
        b.append(txt(X0 + s * (CW + GX) + CW / 2, Y0 - 10, f"step {s + 1}", "sub2", "middle"))
    for g in range(G):
        y = Y0 + g * RH
        b.append(txt(40, y + 18, f"GPU {g + 1}, queries {names[g]}", "cap"))
        for s in range(G):
            x = X0 + s * (CW + GX)
            b.append(cell(x, y, CW, 26, "u", label=f"keys {holds[g][s]}"))
            if s < G - 1:
                b.append(arr(x + CW + 4, y + 13, x + CW + GX - 4, y + 13))
    yy = Y0 + G * RH + 8
    b.append(txt(X0, yy + 12, "each step: attend to the block held, pass it on, receive the next", "sub2"))
    body, yb = prose(yy + 52, [
        "Ring attention keeps every token and spreads the cache across devices, which episode 5 built "
        "({{fig:v05-o020}}). Each GPU holds a slice of the sequence: its own queries, and the keys and "
        f"values for {n0(blk_tokens)} tokens, {f(per_gpu / GB, 1)} GB instead of {f(cache_128k / GB, 1)} "
        "GB on one chip. After three passes round the ring, every query has met every block, and the "
        "result is exact.",
        f"What it needs is an interconnect fast enough to hide the passing behind the arithmetic. Per "
        f"layer, one block is {round(blk_layer / 1e6)} MB, about {f(t_move * 1e3, 2)} ms over NVLink at "
        f"900 GB/s ({{{{fig:v02-o095}}}}). Attending {n0(blk_tokens)} queries to it is about "
        f"{round(t_math * 1e3)} ms of arithmetic at the H100's peak, so the next block arrives long "
        "before it is needed.",
    ])
    emit("b04", stamp("which we covered in episode 5"),
         "Ring attention keeps every token by passing the cache around", yb + 30, b + [body],
         "The one long-context method that gives nothing up: no token is dropped and no answer changes. "
         "Its price is hardware, several GPUs and a fast link between them.")


# ---- o016: the map of what follows -------------------------------------------------------------------------------
ROWS = [  # technique, keeps every token, reads less each step, stores less in total, output unchanged, part
    ("ring attention", True, False, False, True, "this part"),
    ("sliding window", False, True, True, False, "Part 7"),
    ("NSA and DSA", True, True, False, False, "Part 7"),
    ("MoBA", True, True, False, False, "Part 7"),
    ("sinks + window", False, True, True, False, "Part 8"),
    ("H2O and SnapKV", False, True, True, False, "Part 8"),
    ("quantized cache", True, True, True, False, "Part 8"),
    ("retrieval", False, True, True, False, "Part 9"),
]


def o016():
    heads = [("keeps every", "token"), ("reads less", "each step"), ("stores less", "in total"),
             ("same output", "as full")]
    X0, CW, GX, Y0, RH = 214, 84, 8, 104, 34
    b = [hd(40, 46, "The ways out ahead, against what they keep, what they save, and what they give up")]
    for k, (a, c) in enumerate(heads):
        x = X0 + k * (CW + GX) + CW / 2
        b.append(txt(x, 76, a, "sub2", "middle"))
        b.append(txt(x, 91, c, "sub2", "middle"))
    b.append(txt(X0 + 4 * (CW + GX) + 8, 91, "covered in", "sub2"))
    for r, (name, *flags, part) in enumerate(ROWS):
        y = Y0 + r * RH
        b.append(txt(40, y + 18, name, "cap"))
        for k, v in enumerate(flags):
            saving = k in (1, 2)                       # columns that count bytes saved
            cls = ("s" if v else "u") if saving else ("u" if v else "h")
            b.append(cell(X0 + k * (CW + GX), y, CW, 26, cls, label="yes" if v else "no"))
        b.append(txt(X0 + 4 * (CW + GX) + 8, y + 18, part, "sub2"))
    # claims made in the prose
    assert [r[0] for r in ROWS if r[1] and r[4]] == ["ring attention"]
    assert all(r[2] or r[3] for r in ROWS[1:]) and not (ROWS[0][2] or ROWS[0][3])
    assert all(not (r[1] and r[4]) for r in ROWS[1:])
    body, yb = prose(Y0 + len(ROWS) * RH + 30, [
        "Ring attention is the only row that gives nothing up: every token is still there and the "
        "answer is exact. It saves no bytes either; it spreads them over more devices.",
        "Every other row saves bytes, teal, and pays for it in red: it attends to fewer tokens (Part 7), "
        "stores fewer of them (Part 8), or keeps them out of the context in the first place (Part 9). "
        "Each of those can drop the very token the answer needed. In ring attention, that token is "
        "still there.",
    ])
    emit("o016", stamp("The other ways we'll talk about next"),
         "Every other way out gives something up", yb + 30, b + [body],
         "The map for the next three parts. Read each row as a trade: the teal cells are what it saves, "
         "the red ones what it costs.")


if __name__ == "__main__":
    for fn in (o015, b01, b02, b03, b04, o016):
        fn()
