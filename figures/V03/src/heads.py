"""V3 Part 14, storing fewer numbers: grouped heads and multi-head latent attention. §5a item 18; §5f (40:38);
review #35 to #39 (36, 37, 37a, 38, 39), and one extra figure (n09, what a literal rebuild would cost).

  o088  restamped (34:32), formula typeset
  p35   every new token rereads the whole cache: head count is a bandwidth bill (35:08)
  o089  multi-head, grouped-query, multi-query: redrawn with why quality drops (35:31; id kept, five atlases link it)
  o090  restamped (36:56); one overclaim softened
  p36   a big matrix that is really two thin ones: low rank (37:29)
  o091  multi-head latent attention, the numbers: 32,768 against 576, 2.25 groups (37:34; redrawn, id kept)
  n09   rebuilt literally at every step, the keys and values would cost more than reading them (38:32)
  p37   two multiplies in a row are one multiply: the fold (38:54)
  p37a  after folding, every cached byte feeds all 128 heads (39:20)
  p38   rotary position turns each query and key by an angle set by its position (39:37)
  o092  restamped (39:58), one sentence made exact
  p39   the 93.3% has three sources (40:20)

Sources, each read: Shazeer 2019 (arXiv 1911.02150); GQA (Ainslie et al., arXiv 2305.13245): 5% uptraining, GQA-8,
PaLM uses MQA, quality degradation; DeepSeek-V2 (arXiv 2405.04434): §2.1 (128 heads of 128, d_c = 512, d_h^R = 64,
absorption, decoupled RoPE), Table 1 (2.25 groups), §3.2.3 deployment (FP8 weights, ~6-bit KV cache, 5.76x),
Appendix C (absorbing W_UK and W_UV avoids recomputing keys and values); DeepSeek LLM (arXiv 2401.02954) Table 2
(67B: 95 layers, 64 heads, 8 KV heads). Llama 3 70B's config (80 layers, 64 heads, 8 KV heads).

  python3 figures/V03/src/heads.py
"""
import numpy as np
from common import *  # noqa: F401,F403

DS_HEADS, DS_DH, DS_DC, DS_DR, DS_LAYERS = 128, 128, 512, 64, 60       # DeepSeek-V2
LATENT = DS_DC + DS_DR
FULL = 2 * DS_HEADS * DS_DH
assert (LATENT, FULL, round(FULL / LATENT)) == (576, 32768, 57) and LATENT / (2 * DS_DH) == 2.25


# ---- p35: the bandwidth bill ------------------------------------------------------------------------------------
def p35():
    n, layers, dh = 8192, 80, 128                                   # Llama 3 70B, one 8,192-token sequence
    per = lambda kv: 2 * layers * kv * dh * 2 * n
    gb = {kv: per(kv) for kv in (64, 8, 1)}
    ms = {kv: gb[kv] / H100_BW * 1e3 for kv in gb}
    assert round(gb[8] / 1e9, 2) == 2.68 and round(ms[8], 2) == 0.80 and round(gb[64] / 1e9, 1) == 21.5
    assert round(ms[64], 1) == 6.4 and round(gb[1] / 1e9, 2) == 0.34 and round(ms[1], 2) == 0.10
    batch = 32
    assert round(batch * gb[8] / 1e9) == 86 and round(batch * gb[64] / 1e9) == 687
    b = [hd(40, 46, "Cache read for every generated token: Llama 3 70B, one sequence of 8,192 tokens")]
    SC = 440 / gb[64]
    for k, kv in enumerate((64, 8)):
        y = 66 + k * 38
        b.append(txt(40, y + 17, f"{kv} KV heads", "cap"))
        b.append(hbar(170, y, gb[kv] * SC, 26, "h" if kv == 64 else "s",
                      f"{gb[kv] / 1e9:.1f} GB: {ms[kv]:.1f} ms at 3.35 TB/s" if kv == 64 else
                      f"{gb[kv] / 1e9:.2f} GB: {ms[kv]:.2f} ms", 200))
    body, yb = prose(66 + 2 * 38 + 34, [
        "In 2019 Noam Shazeer pointed at where the bill lands. Generating each token means reloading every "
        "cached key and value from HBM, and that reloading is bandwidth bound, the constraint behind every "
        "technique so far. Most of those bytes exist only because every head keeps a private copy.",
        f"Llama 3 70B keeps 8 KV heads for its 64 query heads ({{{{fig:v01-p29}}}}). At 8,192 tokens of "
        f"context, each new token rereads {gb[8] / 1e9:.2f} GB of cache, {ms[8]:.2f} ms at the H100's "
        f"3.35 TB/s. With a key and value head for every query head the same token would reread "
        f"{gb[64] / 1e9:.1f} GB, {ms[64]:.1f} ms, eight times the bill; with a single shared head, "
        f"{gb[1] / 1e9:.2f} GB.",
        f"A batch multiplies it. Thirty-two such sequences reread {batch * gb[8] / 1e9:.0f} GB every step with "
        f"8 KV heads, the whole cache of {{{{fig:v03-o082}}}}; with 64 they would hold {batch * gb[64] / 1e9:.0f} "
        "GB, more than any single GPU's memory.",
    ])
    figure("p35", st("In 2019, Noam Shazeer"), "Every new token rereads the whole cache, so head count is a "
           "bandwidth bill", yb + 30, b + [body],
           esc("Bars to scale. The formula is the one from Part 13, 2 × layers × KV heads × head dimension × 2 "
               "bytes per token, times the tokens held."))


# ---- o089: the three settings, redrawn ------------------------------------------------------------------------------
def o089():
    b = []
    rows = [("Multi-head: every query head has its own key and value head", 4),
            ("Grouped-query: each group of query heads shares one", 2),
            ("Multi-query: all of them share one", 1)]
    y = 46
    for title, kv in rows:
        b.append(hd(40, y, title))
        for i in range(4):
            b.append(cell(40 + i * 152, y + 14, 140, 26, "m", label=f"Q{i}"))
        w = 4 // kv
        for j in range(kv):
            b.append(cell(40 + j * w * 152, y + 46, w * 152 - 12, 26, "s", label=f"KV{j}" if kv > 1 else "KV"))
        y += 116
    body, yb = prose(y - 10, [
        "Shazeer's proposal, multi-query attention: keep all the query heads, but let them share one key head "
        "and one value head. The head count in the cache formula drops to one, so the cache, and the "
        "bandwidth bill with it, shrinks by the full head count. PaLM, among others, shipped it.",
        "The price is quality. Query heads trained to ask different kinds of questions now all consult the "
        "same single description of each token, and accuracy measurably drops; the grouped-query paper also "
        "reports training instability.",
        "Grouped-query attention, from 2023, turns that all-or-nothing choice into a dial: split the query "
        "heads into groups and give each group its own key and value head. One group is multi-query; one group "
        "per head is multi-head. Eight groups hold quality close to multi-head at close to multi-query speed, "
        "and an existing multi-head model can be converted for about 5% of its original pre-training compute, "
        "which the paper calls uptraining.",
    ])
    figure("o089", st("His proposal is called multi-query"), "Multi-head, grouped-query, multi-query", yb + 30,
           b + [body],
           esc("One dial with three settings. The cache shrinks exactly in proportion to the KV heads removed; the "
               "quality cost is what has to be measured."))


# ---- p36: low rank ---------------------------------------------------------------------------------------------------------
def p36():
    col, row = np.array([1, 2, 3, 4]), np.array([2, 0, 1, 3])
    M = np.outer(col, row)
    assert M.tolist() == [[2, 0, 1, 3], [4, 0, 2, 6], [6, 0, 3, 9], [8, 0, 4, 12]] and np.linalg.matrix_rank(M) == 1
    K = DS_HEADS * DS_DH
    assert K == 16384 and K // DS_DC == 32
    b = [hd(40, 46, "Sixteen numbers built from eight: a column times a row")]
    C, G = 30, 4
    for i, v in enumerate(col):
        b.append(cell(40, 66 + i * (C + G), C, C, "m", label=str(v)))
    b.append(txt(90, 66 + 2 * (C + G) - 2, "×", "hd", "middle"))
    for j, v in enumerate(row):
        b.append(cell(110 + j * (C + G), 66, C, C, "s", label=str(v)))
    b.append(txt(270, 66 + 2 * (C + G) - 2, "=", "hd", "middle"))
    for i in range(4):
        for j in range(4):
            b.append(cell(292 + j * (C + G), 66 + i * (C + G), C, C, "u", label=str(M[i, j])))
    b.append(txt(450, 90, "every row is a multiple", "sub2"))
    b.append(txt(450, 108, "of the same row (2, 0, 1, 3)", "sub2"))
    b.append(txt(450, 140, "store 4 + 4 = 8 numbers,", "sub2"))
    b.append(txt(450, 158, "rebuild all 16 on demand", "sub2"))
    y2 = 66 + 4 * (C + G) + 34
    b.append(hd(40, y2, "The same shape in MLA: keys for n tokens (widths to scale, n schematic)"))
    S = 240 / K                                     # px per column: 16,384 columns -> 240 px, 512 -> 7.5 px
    top, H = y2 + 30, 110
    b.append(cell(40, top, DS_DC * S, H, "m", rx=1))
    b.append(txt(40, top + H + 18, "latents, n × 512:", "sub2"))
    b.append(txt(40, top + H + 34, "the only thing cached", "sub2"))
    b.append(txt(64, top + H / 2 + 5, "×", "hd", "middle"))
    b.append(cell(80, top, K * S, DS_DC * S, "s", rx=1))
    b.append(txt(80, top + 28, "512 × 16,384: one learned", "sub2"))
    b.append(txt(80, top + 44, "matrix, the same for every token", "sub2"))
    b.append(txt(342, top + H / 2 + 5, "=", "hd", "middle"))
    b.append(ghost(362, top, K * S, H))
    b.append(txt(362 + K * S / 2, top + H / 2 - 4, "n × 16,384 keys,", "sub2", "middle"))
    b.append(txt(362 + K * S / 2, top + H / 2 + 14, "rebuilt, never stored", "sub2", "middle"))
    body, yb = prose(top + H + 74, [
        "A matrix built as a column times a row holds 16 numbers but only 8 numbers' worth of information: "
        "every row is a multiple of one row. A matrix that factors into a tall thin piece times a short wide "
        "one is called low rank, and storing the two pieces costs far less than storing the product.",
        "DeepSeek-V2 trains its keys to have exactly this shape, which its paper calls low-rank joint "
        "compression. Each token stores a latent of 512 numbers. One fixed 512 × 16,384 matrix, learned in "
        "training and shared by every token, turns any latent into that token's 16,384 key numbers, and a "
        "second one turns the same latent into its 16,384 value numbers.",
    ])
    figure("p36", st("low-rank joint"), "A big matrix that is really two thin ones", yb + 30, b + [body],
           esc("Nothing is thrown away at serving time: the model learned to make its keys and values from the "
               "latent, so the latent is all there is to keep."))


# ---- o091: the numbers, redrawn ------------------------------------------------------------------------------------------
def o091():
    side = lambda v: 220 * math.sqrt(v / FULL)
    assert round(side(LATENT), 1) == 29.2
    b = [hd(40, 46, "Numbers stored per token per layer (areas to scale)")]
    b.append(cell(40, 66, side(FULL), side(FULL), "h", label=f"{FULL:,}"))
    b.append(txt(40, 66 + 220 + 20, "full keys and values:", "sub2"))
    b.append(txt(40, 66 + 220 + 37, "128 heads × 128 × 2", "sub2"))
    x2 = 300
    b.append(cell(x2, 66, side(LATENT), side(LATENT), "s"))
    b.append(txt(x2 + side(LATENT) + 10, 66 + 18, f"{LATENT}: a 512 latent and a 64-wide", "sub2"))
    b.append(txt(x2 + side(LATENT) + 10, 66 + 35, "companion that carries position", "sub2"))
    rows = [("ratio", f"{FULL:,} ÷ {LATENT} = {FULL / LATENT:.1f}, about 57"),
            ("as grouped-query", f"one group stores 2 × 128 = 256; {LATENT} ÷ 256 = {LATENT / 256:g} groups"),
            ("what is lost", "nothing at serving time: keys and values are rebuilt from it")]
    for k, (lab, v) in enumerate(rows):
        y = 170 + k * 36
        b.append(txt(x2, y, lab, "cap"))
        b.append(txt(x2, y + 17, v, "sub2"))
    body, yb = prose(66 + 220 + 76, [
        "Multi-head latent attention, MLA, from DeepSeek-V2 (May 2024), does not keep keys and values at all. "
        "For each token it stores one short vector, the latent, a compressed summary the model learns to "
        "write during training. DeepSeek-V2 has 128 heads of dimension 128, so full keys and values are "
        f"{FULL:,} numbers per token per layer. The latent stores 512, and a small 64-number companion rides "
        f"beside it to carry position: {LATENT} in place of {FULL:,}, 57 times fewer.",
        "That is the footprint of a grouped-query model with just 2.25 groups, and nothing is discarded. The "
        "full keys and values are rebuilt from the latent, by two learned decompression matrices, only for "
        "the tokens being attended to.",
    ])
    figure("o091", st("Multi-head latent attention does not"), "Multi-head latent attention", yb + 30, b + [body],
           esc("Compression built into the architecture rather than applied afterwards. The next figures show "
               "how a latent can rebuild keys at all, why the rebuilding is nearly free, and where the extra 64 "
               "comes from."))


# ---- n09: a literal rebuild ---------------------------------------------------------------------------------------------
def n09():
    n = 8192
    rebuild = 2 * DS_DC * FULL * n * DS_LAYERS                      # multiply-adds x 2, every cached token, every layer
    t_rebuild = rebuild / H100_PEAK * 1e3
    read_full = FULL * 2 * DS_LAYERS * n
    read_lat = LATENT * 2 * DS_LAYERS * n
    t_full, t_lat = read_full / H100_BW * 1e3, read_lat / H100_BW * 1e3
    assert round(rebuild / 1e12, 1) == 16.5 and round(t_rebuild, 1) == 16.7
    assert round(read_full / 1e9, 1) == 32.2 and round(t_full, 1) == 9.6 and round(t_lat, 2) == 0.17
    b = [hd(40, 46, "Time per generated token, 8,192 tokens of context, 60 layers, one H100 (log scale)")]
    lo, hi, X0, X1 = 0.1, 100, 260, 620
    rows = [("rebuild keys and values", t_rebuild, "h", "arithmetic, at full tensor-core speed"),
            ("read a full multi-head cache", t_full, "m", f"{read_full / 1e9:.1f} GB"),
            ("read the latents", t_lat, "s", f"{read_lat / 1e9:.2f} GB")]
    for k, (lab, t, cls, what) in enumerate(rows):
        y = 70 + k * 46
        b.append(txt(40, y + 12, lab, "cap"))
        b.append(txt(40, y + 29, what, "sub2"))
        w = lg(t, lo, hi, X0, X1) - X0
        b.append(cell(X0, y, w, 24, cls))
        b.append(txt(X0 + w + 8, y + 17, f"{t:.1f} ms" if t > 1 else f"{t:.2f} ms", "sub2"))
    ya = 70 + 3 * 46
    for v in (0.1, 1, 10, 100):
        x = lg(v, lo, hi, X0, X1)
        b.append(tline(x, ya - 4, x, ya))
        b.append(txt(x, ya + 14, f"{v:g} ms", "sub2", "middle"))
    body, yb = prose(ya + 50, [
        "Rebuilding the keys and values costs extra matrix multiplies on every step, and decode leaves the "
        "tensor cores mostly idle. But done literally, the rebuild is not small. Every cached token's latent "
        f"is multiplied by the two 512 × 16,384 matrices: 2 × 512 × {FULL:,} operations per token per layer, "
        f"{rebuild / 1e12:.1f} trillion for one new token at 8,192 tokens of context.",
        f"Even at the H100's full 989 trillion a second that is {t_rebuild:.1f} ms, longer than simply reading "
        f"a full multi-head cache, {t_full:.1f} ms. Reading the latents alone would take {t_lat:.2f} ms. So the "
        "saving needs one more step: never rebuilding at all, which the next figure shows is possible.",
    ])
    figure("n09", st("Rebuilding them costs extra"), "Rebuilt literally at every step, the keys and values would "
           "cost more than reading them", yb + 30, b + [body],
           esc("DeepSeek-V2 makes the same point: recomputing the keys and values for every query would be a real "
               "overhead, which its inference avoids by folding the matrices together."))


# ---- p37: the fold -----------------------------------------------------------------------------------------------------------
def p37():
    x, c = np.array([2, 1]), np.array([1, -2])
    WQ, WUK = np.array([[1, 0], [2, -1]]), np.array([[2, -1], [1, 3]])
    q, k = x @ WQ, c @ WUK
    M = WQ @ WUK.T
    xm = x @ M
    assert q.tolist() == [4, -1] and k.tolist() == [0, -7] and M.tolist() == [[2, 1], [5, -1]] and xm.tolist() == [9, 1]
    assert int(q @ k) == int(xm @ c) == 7
    v = lambda a: "(" + ", ".join(f(int(t), 0) for t in a) + ")"
    b = [hd(40, 46, "One head, made small: a 2-number query input x and a 2-number cached latent c")]
    C = 30

    def mat(x0, y0, A, cls, name):
        o = [txt(x0, y0 - 8, name, "sub2")]
        for i in range(2):
            for j in range(2):
                o.append(cell(x0 + j * (C + 4), y0 + i * (C + 4), C, C, cls, label=f(int(A[i][j]), 0)))
        return "".join(o)
    b.append(txt(40, 84, f"x = {v(x)}", "cap"))
    b.append(txt(40, 104, f"c = {v(c)}", "cap"))
    b.append(mat(150, 84, WQ.tolist(), "m", "W_Q makes the query"))
    b.append(mat(330, 84, WUK.tolist(), "m", "W_UK rebuilds a key"))
    y1 = 180
    b.append(cont(40, y1, 290, 146, "u", "rebuild the key, then score"))
    b.append(txt(60, y1 + 58, f"query q = x W_Q = {v(q)}", "sub2"))
    b.append(txt(60, y1 + 80, f"key k = c W_UK = {v(k)}", "sub2"))
    b.append(txt(60, y1 + 102, f"score q · k = 4 × 0 + (−1) × (−7) = {int(q @ k)}", "sub2"))
    b.append(txt(60, y1 + 124, "a key built for every cached token", "sub2"))
    b.append(cont(350, y1, 290, 146, "s", "fold first, then score"))
    b.append(mat(560, y1 + 52, M.tolist(), "s", "M"))
    b.append(txt(370, y1 + 58, "M = W_Q W_UKᵀ, once", "sub2"))
    b.append(txt(370, y1 + 80, f"x M = {v(xm)}", "sub2"))
    b.append(txt(370, y1 + 102, f"score = {v(xm)} · c = {int(xm @ c)}", "sub2"))
    b.append(txt(370, y1 + 124, "no key is ever built", "sub2"))
    body, yb = prose(y1 + 146 + 36, [
        "Two matrix multiplies in a row are the same as one multiply by their product. A query only ever "
        "meets a rebuilt key inside such a chain, (x W_Q) · (c W_UK), so the key's matrix can be folded into "
        "the query's matrix ahead of time: M = W_Q W_UKᵀ, computed once when the model is loaded. Both routes "
        "give a score of 7.",
        "At decode, the new token's query side is multiplied by M, and the result is dotted straight with "
        "each cached latent. In the same way the values' decompression matrix folds into the matrix that "
        "produces the output. The kernel simply reorders its multiplies, and no step ever rebuilds the full "
        "keys and values from the latents.",
    ])
    figure("p37", st("Two matrix multiplies in a row"), "Two multiplies in a row are one multiply", yb + 30,
           b + [body],
           esc("Associativity, (AB)C = A(BC), doing real work. DeepSeek-V2 describes this as absorbing W_UK into "
               "the query projection and W_UV into the output projection."))


# ---- p37a: intensity after folding -------------------------------------------------------------------------------------
def p37a():
    mha = (2 * DS_DH + 2 * DS_DH) / ((DS_DH + DS_DH) * 2)          # one head, one cached token: score + output
    gqa = 8 * mha                                                  # 8 query heads per KV head (Llama 3 70B)
    mla = DS_HEADS * 2 * (LATENT + DS_DC) / (LATENT * 2)          # 128 heads: 576-long score, 512-long output
    assert mha == 1 and gqa == 8 and DS_HEADS * 2 * (LATENT + DS_DC) == 278528 and round(mla, 1) == 241.8
    b = [hd(40, 46, "Operations per byte of cache read, attention at decode (log scale)")]
    lo, hi, X0, X1 = 0.5, 1000, 60, 620
    ya = 150
    b.append(tline(X0, ya, X1, ya, "tick"))
    for v in (1, 10, 100, 1000):
        x = lg(v, lo, hi, X0, X1)
        b.append(tline(x, ya, x, ya + 4))
        b.append(txt(x, ya + 18, f"{v:,}", "sub2", "middle"))
    xr = lg(RIDGE, lo, hi, X0, X1)
    b.append(dashed(xr, 64, xr, ya, "--h"))
    b.append(txt(xr + 6, 76, f"H100 ridge, {RIDGE:.0f}", "sub2"))
    pts = [("multi-head", mha, 112, "start"), ("grouped, 8 per KV head", gqa, 88, "start"),
           ("MLA, folded", mla, 112, "end")]
    for lab, v, yl, an in pts:
        x = lg(v, lo, hi, X0, X1)
        b.append(tline(x, yl + 6, x, ya))
        b.append(dot(x, ya, 5, "--s"))
        b.append(txt(x + (6 if an == "start" else -6), yl, f"{lab}: {f(v, 1) if v > 100 else f(v, 0)}", "sub2", an))
    body, yb = prose(ya + 56, [
        "In multi-head attention each cached key and value serves exactly one query head: per cached token, "
        "one head does a 128-long dot product for its score and a 128-long weighted add for its output, 512 "
        "operations on 512 bytes, 1 per byte. Grouping eight query heads on each KV head makes it 8.",
        "After folding, every one of DeepSeek-V2's 128 heads works directly on the same cached latent: a "
        "576-long dot product for the score and a 512-long accumulation for the output. That is "
        f"278,528 operations on 1,152 bytes, {f(mla, 0)} per byte, close to the H100's ridge of 295 "
        "({{fig:v03-p05}}). The arithmetic that decode used to leave idle is now spent buying back bytes.",
    ])
    figure("p37a", st("No step ever rebuilds"), "After folding, every cached byte feeds all 128 heads", yb + 30,
           b + [body],
           esc("Counted for one new token, batch 1, 16-bit cache, ignoring the softmax and the projections. A "
               "kernel near the ridge is no longer simply waiting on memory."))


# ---- p38: rotary position -----------------------------------------------------------------------------------------------
def p38():
    om = 0.5
    q, k = np.array([2.0, 1.0]), np.array([1.0, 1.0])
    R = lambda a: np.array([[math.cos(a), -math.sin(a)], [math.sin(a), math.cos(a)]])
    pairs = [(2, 5), (10, 13), (0, 3)]
    dots = [float((R(m * om) @ q) @ (R(nn * om) @ k)) for m, nn in pairs]
    assert max(dots) - min(dots) < 1e-12 and f(dots[0], 3) == "−0.785"
    b = [hd(40, 46, f"Query q = (2, 1) and key k = (1, 1), each turned by its position × {om} radians")]
    U = 34
    for p, (m, nn) in enumerate(pairs):
        cx, cy = 130 + p * 210, 150
        b.append(tline(cx - 80, cy, cx + 80, cy, "tick"))
        b.append(tline(cx, cy - 80, cx, cy + 80, "tick"))
        for vec, pos, var, lab in ((q, m, "--m", "q"), (k, nn, "--s", "k")):
            r = R(pos * om) @ vec
            ex, ey = cx + r[0] * U, cy - r[1] * U
            b.append(poly([(cx, cy), (ex, ey)], var, 2.5))
            b.append(dot(ex, ey, 3, var, var))
            b.append(txt(ex + (8 if r[0] >= 0 else -8), ey + (4 if r[1] >= 0 else 14), f"{lab} at {pos}", "sub2",
                         "start" if r[0] >= 0 else "end"))
        b.append(txt(cx, cy + 104, f"positions {m} and {nn}", "cap", "middle"))
        b.append(txt(cx, cy + 122, f"q · k = {f(dots[p], 3)}", "sub2", "middle"))
    body, yb = prose(150 + 122 + 40, [
        "Transformers encode each token's position by rotating its query and key vectors by an angle set by "
        "the position: rotary position embedding. Real models rotate many pairs of coordinates at many "
        f"speeds; one pair at {om} radians per position is enough to see it work. The arrows move with "
        "position, but the angle between query and key, and so their dot product, depends only on how far "
        "apart the two tokens are: three positions apart gives −0.785 every time.",
        "That is exactly what breaks the fold. The score becomes x W_Q R W_UKᵀ c, with a rotation R in the "
        "middle that changes with every pair of positions, so no single matrix M can be computed ahead of "
        "time. Applied to a rebuilt key, the rotation wedges an unmergeable step into the chain.",
    ])
    figure("p38", st("rotating its query and key"), "Rotary position turns each query and key by an angle set by "
           "its position", yb + 30, b + [body],
           esc("Drawn to scale, one unit = 34 px. Rotation keeps lengths, so only the angle between the two "
               "arrows can carry position, and it carries only the distance between them."))


# ---- p39: where 93.3% comes from ---------------------------------------------------------------------------------------
def p39():
    ds67 = 2 * 8 * 128 * 95                                         # DeepSeek 67B: 8 KV heads of 128, 95 layers
    v2 = LATENT * DS_LAYERS
    rows = [("DeepSeek 67B, 16-bit", ds67 * 2, "h"), ("DeepSeek-V2, MLA, 16-bit", v2 * 2, "m"),
            ("DeepSeek-V2, ~6-bit cache", v2 * 6 / 8, "s")]
    assert (ds67, v2) == (194560, 34560) and [round(r[1] / 1e3, 1) for r in rows] == [389.1, 69.1, 25.9]
    assert round(100 * (1 - v2 / ds67), 1) == 82.2 and round(100 * (1 - v2 * 6 / (ds67 * 16)), 1) == 93.3
    b = [hd(40, 46, "Cache bytes per token, all layers (bars to scale)")]
    SC = 380 / rows[0][1]
    for k, (lab, v, cls) in enumerate(rows):
        y = 66 + k * 38
        b.append(txt(40, y + 17, lab, "cap"))
        b.append(hbar(250, y, v * SC, 26, cls, f"{v / 1e3:.1f} KB" + ("" if k == 0 else
                      f": −{100 * (1 - v / rows[0][1]):.1f}%"), 160))
    body, yb = prose(66 + 3 * 38 + 30, [
        "Measured against DeepSeek's own previous 67-billion-parameter model, the KV cache shrinks by 93.3% "
        "and maximum generation throughput rises to 5.76 times. The arithmetic shows where that comes from. "
        "The 67B already used grouped-query attention, 8 KV heads over 95 layers: 389 KB per token in 16 bits. "
        "MLA's 576 numbers a layer, over 60 layers instead of 95, are 69 KB in 16 bits, 82.2% less.",
        "The rest is precision: the deployed model compressed its cache to about 6 bits a number, and 25.9 KB "
        "is exactly 93.3% less. The 5.76 times was also measured with the weights in FP8. So the headline "
        "mixes three levers: fewer stored numbers, fewer layers, and fewer bits.",
        "DeepSeek also reports quality at or above full multi-head attention. That last claim is one to read "
        "carefully, since it comes from their own comparisons inside their own training recipe.",
    ])
    figure("p39", st("Measured against Deep Seek's own"), "The 93.3 percent has three sources", yb + 30,
           b + [body],
           esc("Every input is from the DeepSeek-V2 and DeepSeek LLM papers; the split into sources is this "
               "figure's arithmetic, and it lands on their 93.3% exactly."))


def patches():
    patch("o088", [("2  x  KV heads  x  128  x  2 bytes", "2  ×  KV heads  ×  128  ×  2 bytes")],
          stamp_to=st("In standard multi-head attention"))
    patch("o090", [("with this structure; it cannot be applied to an existing one afterwards.",
                    "with this structure; it is not a setting switched on at serving time.")],
          stamp_to=st("compressing what each token stores"))
    patch("o092", [("That merge only works if the operations commute, and a position-dependent rotation does not.",
                    "That merge needs one fixed matrix between query and key, and rotation differs for every pair.")],
          stamp_to=st("route position around"))


if __name__ == "__main__":
    for job in (patches, p35, o089, p36, o091, n09, p37, p37a, p38, p39):
        job()
